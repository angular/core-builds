/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/utils/typescript/visit_nodes", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy", "@angular/core/schematics/migrations/static-queries/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const ng_component_template_1 = require("@angular/core/schematics/utils/ng_component_template");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const visit_nodes_1 = require("@angular/core/schematics/utils/typescript/visit_nodes");
    const ng_query_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor");
    const template_strategy_1 = require("@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy");
    const usage_strategy_1 = require("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy");
    const transform_1 = require("@angular/core/schematics/migrations/static-queries/transform");
    /** Entry point for the V8 static-query migration. */
    function default_1() {
        return (tree, context) => {
            const projectTsConfigPaths = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            if (!projectTsConfigPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate queries ' +
                    'to explicit timing.');
            }
            for (const tsconfigPath of projectTsConfigPaths) {
                runStaticQueryMigration(tree, tsconfigPath, basePath, context.logger);
            }
        };
    }
    exports.default = default_1;
    /**
     * Runs the static query migration for the given TypeScript project. The schematic
     * analyzes all queries within the project and sets up the query timing based on
     * the current usage of the query property. e.g. a view query that is not used in any
     * lifecycle hook does not need to be static and can be set up with "static: false".
     */
    function runStaticQueryMigration(tree, tsconfigPath, basePath, logger) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = ts.createCompilerHost(parsed.options, true);
        // We need to overwrite the host "readFile" method, as we want the TypeScript
        // program to be based on the file contents in the virtual file tree. Otherwise
        // if we run the migration for multiple tsconfig files which have intersecting
        // source files, it can end up updating query definitions multiple times.
        host.readFile = fileName => {
            const buffer = tree.read(path_1.relative(basePath, fileName));
            return buffer ? buffer.toString() : undefined;
        };
        const isUsageStrategy = !!process.env['NG_STATIC_QUERY_USAGE_STRATEGY'];
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const queryVisitor = new ng_query_visitor_1.NgQueryResolveVisitor(typeChecker);
        const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker);
        const rootSourceFiles = program.getRootFileNames().map(f => program.getSourceFile(f));
        const printer = ts.createPrinter();
        const analysisVisitors = [queryVisitor];
        // If the "usage" strategy is selected, we also need to add the query visitor
        // to the analysis visitors so that query usage in templates can be also checked.
        if (isUsageStrategy) {
            analysisVisitors.push(templateVisitor);
        }
        rootSourceFiles.forEach(sourceFile => {
            // The visit utility function only traverses a source file once. We don't want to
            // traverse through all source files multiple times for each visitor as this could be
            // slow.
            visit_nodes_1.visitAllNodes(sourceFile, analysisVisitors);
        });
        const { resolvedQueries, classMetadata } = queryVisitor;
        const { resolvedTemplates } = templateVisitor;
        if (isUsageStrategy) {
            // Add all resolved templates to the class metadata if the usage strategy is used. This
            // is necessary in order to be able to check component templates for static query usage.
            resolvedTemplates.forEach(template => {
                if (classMetadata.has(template.container)) {
                    classMetadata.get(template.container).template = template;
                }
            });
        }
        const strategy = isUsageStrategy ?
            new usage_strategy_1.QueryUsageStrategy(classMetadata, typeChecker) :
            new template_strategy_1.QueryTemplateStrategy(tsconfigPath, classMetadata, host);
        const detectionMessages = [];
        // In case the strategy could not be set up properly, we just exit the
        // migration. We don't want to throw an exception as this could mean
        // that other migrations are interrupted.
        if (!strategy.setup()) {
            return;
        }
        // Walk through all source files that contain resolved queries and update
        // the source files if needed. Note that we need to update multiple queries
        // within a source file within the same recorder in order to not throw off
        // the TypeScript node offsets.
        resolvedQueries.forEach((queries, sourceFile) => {
            const relativePath = path_1.relative(basePath, sourceFile.fileName);
            const update = tree.beginUpdate(relativePath);
            // Compute the query timing for all resolved queries and update the
            // query definitions to explicitly set the determined query timing.
            queries.forEach(q => {
                const queryExpr = q.decorator.node.expression;
                const { timing, message } = strategy.detectTiming(q);
                const transformedNode = transform_1.getTransformedQueryCallExpr(q, timing, !!message);
                if (!transformedNode) {
                    return;
                }
                const newText = printer.printNode(ts.EmitHint.Unspecified, transformedNode, sourceFile);
                // Replace the existing query decorator call expression with the updated
                // call expression node.
                update.remove(queryExpr.getStart(), queryExpr.getWidth());
                update.insertRight(queryExpr.getStart(), newText);
                const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, q.decorator.node.getStart());
                detectionMessages.push(`${relativePath}@${line + 1}:${character + 1}: ${message}`);
            });
            tree.commitUpdate(update);
        });
        if (detectionMessages.length) {
            logger.info('------ Static Query migration ------');
            logger.info('In preparation for Ivy, developers can now explicitly specify the');
            logger.info('timing of their queries. Read more about this here:');
            logger.info('https://github.com/angular/angular/pull/28810');
            logger.info('');
            logger.info('Some queries cannot be migrated automatically. Please go through');
            logger.info('those manually and apply the appropriate timing:');
            detectionMessages.forEach(failure => logger.warn(`⮑   ${failure}`));
            logger.info('------------------------------------------------');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILDJEQUE2RjtJQUM3RiwrQkFBdUM7SUFDdkMsaUNBQWlDO0lBRWpDLGdHQUE2RTtJQUM3RSxrR0FBMkU7SUFDM0UsNkZBQXdFO0lBQ3hFLHVGQUFvRjtJQUVwRixrSEFBaUU7SUFDakUseUlBQXVGO0lBRXZGLGdJQUE4RTtJQUM5RSw0RkFBd0Q7SUFJeEQscURBQXFEO0lBQ3JEO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDL0MsTUFBTSxvQkFBb0IsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRTtnQkFDaEMsTUFBTSxJQUFJLGdDQUFtQixDQUN6QiwyREFBMkQ7b0JBQzNELHFCQUFxQixDQUFDLENBQUM7YUFDNUI7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLG9CQUFvQixFQUFFO2dCQUMvQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDdkU7UUFDSCxDQUFDLENBQUM7SUFDSixDQUFDO0lBZkQsNEJBZUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVMsdUJBQXVCLENBQzVCLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCLEVBQUUsTUFBYztRQUNwRSxNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FBQyxZQUFZLEVBQUUsY0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsNkVBQTZFO1FBQzdFLCtFQUErRTtRQUMvRSw4RUFBOEU7UUFDOUUseUVBQXlFO1FBQ3pFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdkQsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ2hELENBQUMsQ0FBQztRQUVGLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDeEUsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sWUFBWSxHQUFHLElBQUksd0NBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDNUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxrREFBMEIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRSxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBRyxDQUFDLENBQUM7UUFDeEYsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ25DLE1BQU0sZ0JBQWdCLEdBQXdCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFN0QsNkVBQTZFO1FBQzdFLGlGQUFpRjtRQUNqRixJQUFJLGVBQWUsRUFBRTtZQUNuQixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDeEM7UUFFRCxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ25DLGlGQUFpRjtZQUNqRixxRkFBcUY7WUFDckYsUUFBUTtZQUNSLDJCQUFhLENBQUMsVUFBVSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLEVBQUMsZUFBZSxFQUFFLGFBQWEsRUFBQyxHQUFHLFlBQVksQ0FBQztRQUN0RCxNQUFNLEVBQUMsaUJBQWlCLEVBQUMsR0FBRyxlQUFlLENBQUM7UUFFNUMsSUFBSSxlQUFlLEVBQUU7WUFDbkIsdUZBQXVGO1lBQ3ZGLHdGQUF3RjtZQUN4RixpQkFBaUIsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ25DLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQ3pDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBRyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7aUJBQzdEO1lBQ0gsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUVELE1BQU0sUUFBUSxHQUFtQixlQUFlLENBQUMsQ0FBQztZQUM5QyxJQUFJLG1DQUFrQixDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3BELElBQUkseUNBQXFCLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqRSxNQUFNLGlCQUFpQixHQUFhLEVBQUUsQ0FBQztRQUV2QyxzRUFBc0U7UUFDdEUsb0VBQW9FO1FBQ3BFLHlDQUF5QztRQUN6QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3JCLE9BQU87U0FDUjtRQUVELHlFQUF5RTtRQUN6RSwyRUFBMkU7UUFDM0UsMEVBQTBFO1FBQzFFLCtCQUErQjtRQUMvQixlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFO1lBQzlDLE1BQU0sWUFBWSxHQUFHLGVBQVEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzdELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFOUMsbUVBQW1FO1lBQ25FLG1FQUFtRTtZQUNuRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNsQixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQzlDLE1BQU0sRUFBQyxNQUFNLEVBQUUsT0FBTyxFQUFDLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxlQUFlLEdBQUcsdUNBQTJCLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRTFFLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3BCLE9BQU87aUJBQ1I7Z0JBRUQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXhGLHdFQUF3RTtnQkFDeEUsd0JBQXdCO2dCQUN4QixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRWxELE1BQU0sRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDLEdBQ25CLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDOUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsWUFBWSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksU0FBUyxHQUFHLENBQUMsS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3JGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFO1lBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLG1FQUFtRSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLElBQUksQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxJQUFJLENBQUMsK0NBQStDLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0VBQWtFLENBQUMsQ0FBQztZQUNoRixNQUFNLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxDQUFDLENBQUM7WUFDaEUsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxDQUFDLENBQUM7U0FDakU7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmd9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtkaXJuYW1lLCByZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcn0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZyc7XG5pbXBvcnQge1R5cGVTY3JpcHRWaXNpdG9yLCB2aXNpdEFsbE5vZGVzfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3Zpc2l0X25vZGVzJztcblxuaW1wb3J0IHtOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3J9IGZyb20gJy4vYW5ndWxhci9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7UXVlcnlUZW1wbGF0ZVN0cmF0ZWd5fSBmcm9tICcuL3N0cmF0ZWdpZXMvdGVtcGxhdGVfc3RyYXRlZ3kvdGVtcGxhdGVfc3RyYXRlZ3knO1xuaW1wb3J0IHtUaW1pbmdTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3RpbWluZy1zdHJhdGVneSc7XG5pbXBvcnQge1F1ZXJ5VXNhZ2VTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3VzYWdlX3N0cmF0ZWd5L3VzYWdlX3N0cmF0ZWd5JztcbmltcG9ydCB7Z2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5cbnR5cGUgTG9nZ2VyID0gbG9nZ2luZy5Mb2dnZXJBcGk7XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFY4IHN0YXRpYy1xdWVyeSBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgcHJvamVjdFRzQ29uZmlnUGF0aHMgPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG5cbiAgICBpZiAoIXByb2plY3RUc0NvbmZpZ1BhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBxdWVyaWVzICcgK1xuICAgICAgICAgICd0byBleHBsaWNpdCB0aW1pbmcuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgcHJvamVjdFRzQ29uZmlnUGF0aHMpIHtcbiAgICAgIHJ1blN0YXRpY1F1ZXJ5TWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGNvbnRleHQubG9nZ2VyKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUnVucyB0aGUgc3RhdGljIHF1ZXJ5IG1pZ3JhdGlvbiBmb3IgdGhlIGdpdmVuIFR5cGVTY3JpcHQgcHJvamVjdC4gVGhlIHNjaGVtYXRpY1xuICogYW5hbHl6ZXMgYWxsIHF1ZXJpZXMgd2l0aGluIHRoZSBwcm9qZWN0IGFuZCBzZXRzIHVwIHRoZSBxdWVyeSB0aW1pbmcgYmFzZWQgb25cbiAqIHRoZSBjdXJyZW50IHVzYWdlIG9mIHRoZSBxdWVyeSBwcm9wZXJ0eS4gZS5nLiBhIHZpZXcgcXVlcnkgdGhhdCBpcyBub3QgdXNlZCBpbiBhbnlcbiAqIGxpZmVjeWNsZSBob29rIGRvZXMgbm90IG5lZWQgdG8gYmUgc3RhdGljIGFuZCBjYW4gYmUgc2V0IHVwIHdpdGggXCJzdGF0aWM6IGZhbHNlXCIuXG4gKi9cbmZ1bmN0aW9uIHJ1blN0YXRpY1F1ZXJ5TWlncmF0aW9uKFxuICAgIHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nLCBsb2dnZXI6IExvZ2dlcikge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBob3N0IFwicmVhZEZpbGVcIiBtZXRob2QsIGFzIHdlIHdhbnQgdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuIE90aGVyd2lzZVxuICAvLyBpZiB3ZSBydW4gdGhlIG1pZ3JhdGlvbiBmb3IgbXVsdGlwbGUgdHNjb25maWcgZmlsZXMgd2hpY2ggaGF2ZSBpbnRlcnNlY3RpbmdcbiAgLy8gc291cmNlIGZpbGVzLCBpdCBjYW4gZW5kIHVwIHVwZGF0aW5nIHF1ZXJ5IGRlZmluaXRpb25zIG11bHRpcGxlIHRpbWVzLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgaXNVc2FnZVN0cmF0ZWd5ID0gISFwcm9jZXNzLmVudlsnTkdfU1RBVElDX1FVRVJZX1VTQUdFX1NUUkFURUdZJ107XG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHF1ZXJ5VmlzaXRvciA9IG5ldyBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCB0ZW1wbGF0ZVZpc2l0b3IgPSBuZXcgTmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCByb290U291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFJvb3RGaWxlTmFtZXMoKS5tYXAoZiA9PiBwcm9ncmFtLmdldFNvdXJjZUZpbGUoZikgISk7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIGNvbnN0IGFuYWx5c2lzVmlzaXRvcnM6IFR5cGVTY3JpcHRWaXNpdG9yW10gPSBbcXVlcnlWaXNpdG9yXTtcblxuICAvLyBJZiB0aGUgXCJ1c2FnZVwiIHN0cmF0ZWd5IGlzIHNlbGVjdGVkLCB3ZSBhbHNvIG5lZWQgdG8gYWRkIHRoZSBxdWVyeSB2aXNpdG9yXG4gIC8vIHRvIHRoZSBhbmFseXNpcyB2aXNpdG9ycyBzbyB0aGF0IHF1ZXJ5IHVzYWdlIGluIHRlbXBsYXRlcyBjYW4gYmUgYWxzbyBjaGVja2VkLlxuICBpZiAoaXNVc2FnZVN0cmF0ZWd5KSB7XG4gICAgYW5hbHlzaXNWaXNpdG9ycy5wdXNoKHRlbXBsYXRlVmlzaXRvcik7XG4gIH1cblxuICByb290U291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICAvLyBUaGUgdmlzaXQgdXRpbGl0eSBmdW5jdGlvbiBvbmx5IHRyYXZlcnNlcyBhIHNvdXJjZSBmaWxlIG9uY2UuIFdlIGRvbid0IHdhbnQgdG9cbiAgICAvLyB0cmF2ZXJzZSB0aHJvdWdoIGFsbCBzb3VyY2UgZmlsZXMgbXVsdGlwbGUgdGltZXMgZm9yIGVhY2ggdmlzaXRvciBhcyB0aGlzIGNvdWxkIGJlXG4gICAgLy8gc2xvdy5cbiAgICB2aXNpdEFsbE5vZGVzKHNvdXJjZUZpbGUsIGFuYWx5c2lzVmlzaXRvcnMpO1xuICB9KTtcblxuICBjb25zdCB7cmVzb2x2ZWRRdWVyaWVzLCBjbGFzc01ldGFkYXRhfSA9IHF1ZXJ5VmlzaXRvcjtcbiAgY29uc3Qge3Jlc29sdmVkVGVtcGxhdGVzfSA9IHRlbXBsYXRlVmlzaXRvcjtcblxuICBpZiAoaXNVc2FnZVN0cmF0ZWd5KSB7XG4gICAgLy8gQWRkIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgdG8gdGhlIGNsYXNzIG1ldGFkYXRhIGlmIHRoZSB1c2FnZSBzdHJhdGVneSBpcyB1c2VkLiBUaGlzXG4gICAgLy8gaXMgbmVjZXNzYXJ5IGluIG9yZGVyIHRvIGJlIGFibGUgdG8gY2hlY2sgY29tcG9uZW50IHRlbXBsYXRlcyBmb3Igc3RhdGljIHF1ZXJ5IHVzYWdlLlxuICAgIHJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgICAgaWYgKGNsYXNzTWV0YWRhdGEuaGFzKHRlbXBsYXRlLmNvbnRhaW5lcikpIHtcbiAgICAgICAgY2xhc3NNZXRhZGF0YS5nZXQodGVtcGxhdGUuY29udGFpbmVyKSAhLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBzdHJhdGVneTogVGltaW5nU3RyYXRlZ3kgPSBpc1VzYWdlU3RyYXRlZ3kgP1xuICAgICAgbmV3IFF1ZXJ5VXNhZ2VTdHJhdGVneShjbGFzc01ldGFkYXRhLCB0eXBlQ2hlY2tlcikgOlxuICAgICAgbmV3IFF1ZXJ5VGVtcGxhdGVTdHJhdGVneSh0c2NvbmZpZ1BhdGgsIGNsYXNzTWV0YWRhdGEsIGhvc3QpO1xuICBjb25zdCBkZXRlY3Rpb25NZXNzYWdlczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBJbiBjYXNlIHRoZSBzdHJhdGVneSBjb3VsZCBub3QgYmUgc2V0IHVwIHByb3Blcmx5LCB3ZSBqdXN0IGV4aXQgdGhlXG4gIC8vIG1pZ3JhdGlvbi4gV2UgZG9uJ3Qgd2FudCB0byB0aHJvdyBhbiBleGNlcHRpb24gYXMgdGhpcyBjb3VsZCBtZWFuXG4gIC8vIHRoYXQgb3RoZXIgbWlncmF0aW9ucyBhcmUgaW50ZXJydXB0ZWQuXG4gIGlmICghc3RyYXRlZ3kuc2V0dXAoKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIHRoYXQgY29udGFpbiByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGVcbiAgLy8gdGhlIHNvdXJjZSBmaWxlcyBpZiBuZWVkZWQuIE5vdGUgdGhhdCB3ZSBuZWVkIHRvIHVwZGF0ZSBtdWx0aXBsZSBxdWVyaWVzXG4gIC8vIHdpdGhpbiBhIHNvdXJjZSBmaWxlIHdpdGhpbiB0aGUgc2FtZSByZWNvcmRlciBpbiBvcmRlciB0byBub3QgdGhyb3cgb2ZmXG4gIC8vIHRoZSBUeXBlU2NyaXB0IG5vZGUgb2Zmc2V0cy5cbiAgcmVzb2x2ZWRRdWVyaWVzLmZvckVhY2goKHF1ZXJpZXMsIHNvdXJjZUZpbGUpID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZVBhdGgpO1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgcXVlcnkgdGltaW5nIGZvciBhbGwgcmVzb2x2ZWQgcXVlcmllcyBhbmQgdXBkYXRlIHRoZVxuICAgIC8vIHF1ZXJ5IGRlZmluaXRpb25zIHRvIGV4cGxpY2l0bHkgc2V0IHRoZSBkZXRlcm1pbmVkIHF1ZXJ5IHRpbWluZy5cbiAgICBxdWVyaWVzLmZvckVhY2gocSA9PiB7XG4gICAgICBjb25zdCBxdWVyeUV4cHIgPSBxLmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgICBjb25zdCB7dGltaW5nLCBtZXNzYWdlfSA9IHN0cmF0ZWd5LmRldGVjdFRpbWluZyhxKTtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWVkTm9kZSA9IGdldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcihxLCB0aW1pbmcsICEhbWVzc2FnZSk7XG5cbiAgICAgIGlmICghdHJhbnNmb3JtZWROb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3VGV4dCA9IHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCB0cmFuc2Zvcm1lZE5vZGUsIHNvdXJjZUZpbGUpO1xuXG4gICAgICAvLyBSZXBsYWNlIHRoZSBleGlzdGluZyBxdWVyeSBkZWNvcmF0b3IgY2FsbCBleHByZXNzaW9uIHdpdGggdGhlIHVwZGF0ZWRcbiAgICAgIC8vIGNhbGwgZXhwcmVzc2lvbiBub2RlLlxuICAgICAgdXBkYXRlLnJlbW92ZShxdWVyeUV4cHIuZ2V0U3RhcnQoKSwgcXVlcnlFeHByLmdldFdpZHRoKCkpO1xuICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBuZXdUZXh0KTtcblxuICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIHEuZGVjb3JhdG9yLm5vZGUuZ2V0U3RhcnQoKSk7XG4gICAgICBkZXRlY3Rpb25NZXNzYWdlcy5wdXNoKGAke3JlbGF0aXZlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfTogJHttZXNzYWdlfWApO1xuICAgIH0pO1xuXG4gICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlKTtcbiAgfSk7XG5cbiAgaWYgKGRldGVjdGlvbk1lc3NhZ2VzLmxlbmd0aCkge1xuICAgIGxvZ2dlci5pbmZvKCctLS0tLS0gU3RhdGljIFF1ZXJ5IG1pZ3JhdGlvbiAtLS0tLS0nKTtcbiAgICBsb2dnZXIuaW5mbygnSW4gcHJlcGFyYXRpb24gZm9yIEl2eSwgZGV2ZWxvcGVycyBjYW4gbm93IGV4cGxpY2l0bHkgc3BlY2lmeSB0aGUnKTtcbiAgICBsb2dnZXIuaW5mbygndGltaW5nIG9mIHRoZWlyIHF1ZXJpZXMuIFJlYWQgbW9yZSBhYm91dCB0aGlzIGhlcmU6Jyk7XG4gICAgbG9nZ2VyLmluZm8oJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC8yODgxMCcpO1xuICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICBsb2dnZXIuaW5mbygnU29tZSBxdWVyaWVzIGNhbm5vdCBiZSBtaWdyYXRlZCBhdXRvbWF0aWNhbGx5LiBQbGVhc2UgZ28gdGhyb3VnaCcpO1xuICAgIGxvZ2dlci5pbmZvKCd0aG9zZSBtYW51YWxseSBhbmQgYXBwbHkgdGhlIGFwcHJvcHJpYXRlIHRpbWluZzonKTtcbiAgICBkZXRlY3Rpb25NZXNzYWdlcy5mb3JFYWNoKGZhaWx1cmUgPT4gbG9nZ2VyLndhcm4oYOKukSAgICR7ZmFpbHVyZX1gKSk7XG4gICAgbG9nZ2VyLmluZm8oJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICB9XG59XG4iXX0=