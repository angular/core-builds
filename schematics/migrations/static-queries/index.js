/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "rxjs", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/schematics_prompt", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/utils/typescript/visit_nodes", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy", "@angular/core/schematics/migrations/static-queries/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const rxjs_1 = require("rxjs");
    const ts = require("typescript");
    const ng_component_template_1 = require("@angular/core/schematics/utils/ng_component_template");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const schematics_prompt_1 = require("@angular/core/schematics/utils/schematics_prompt");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const visit_nodes_1 = require("@angular/core/schematics/utils/typescript/visit_nodes");
    const ng_query_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor");
    const template_strategy_1 = require("@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy");
    const usage_strategy_1 = require("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy");
    const transform_1 = require("@angular/core/schematics/migrations/static-queries/transform");
    /** Entry point for the V8 static-query migration. */
    function default_1() {
        return (tree, context) => {
            // We need to cast the returned "Observable" to "any" as there is a
            // RxJS version mismatch that breaks the TS compilation.
            return rxjs_1.from(runMigration(tree, context).then(() => tree));
        };
    }
    exports.default = default_1;
    /** Runs the V8 migration static-query migration for all determined TypeScript projects. */
    function runMigration(tree, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectTsConfigPaths = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const logger = context.logger;
            logger.info('------ Static Query migration ------');
            logger.info('In preparation for Ivy, developers can now explicitly specify the');
            logger.info('timing of their queries. Read more about this here:');
            logger.info('https://github.com/angular/angular/pull/28810');
            logger.info('');
            if (!projectTsConfigPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate queries ' +
                    'to explicit timing.');
            }
            // In case prompts are supported, determine the desired migration strategy
            // by creating a choice prompt. By default the template strategy is used.
            let isUsageStrategy = false;
            if (schematics_prompt_1.supportsPrompt()) {
                logger.info('There are two available migration strategies that can be selected:');
                logger.info('  • Template strategy  -  migration tool (short-term gains, rare corrections)');
                logger.info('  • Usage strategy  -  best practices (long-term gains, manual corrections)');
                logger.info('For an easy migration, the template strategy is recommended. The usage');
                logger.info('strategy can be used for best practices and a code base that will be more');
                logger.info('flexible to changes going forward.');
                const { strategyName } = yield schematics_prompt_1.getInquirer().prompt({
                    type: 'list',
                    name: 'strategyName',
                    message: 'What migration strategy do you want to use?',
                    choices: [
                        { name: 'Template strategy', value: 'template' }, { name: 'Usage strategy', value: 'usage' }
                    ],
                    default: 'template',
                });
                logger.info('');
                isUsageStrategy = strategyName === 'usage';
            }
            else {
                // In case prompts are not supported, we still want to allow developers to opt
                // into the usage strategy by specifying an environment variable. The tests also
                // use the environment variable as there is no headless way to select via prompt.
                isUsageStrategy = !!process.env['NG_STATIC_QUERY_USAGE_STRATEGY'];
            }
            const failures = [];
            for (const tsconfigPath of projectTsConfigPaths) {
                failures.push(...yield runStaticQueryMigration(tree, tsconfigPath, basePath, isUsageStrategy));
            }
            if (failures.length) {
                logger.info('Some queries cannot be migrated automatically. Please go through');
                logger.info('those manually and apply the appropriate timing:');
                failures.forEach(failure => logger.warn(`⮑   ${failure}`));
            }
            logger.info('------------------------------------------------');
        });
    }
    /**
     * Runs the static query migration for the given TypeScript project. The schematic
     * analyzes all queries within the project and sets up the query timing based on
     * the current usage of the query property. e.g. a view query that is not used in any
     * lifecycle hook does not need to be static and can be set up with "static: false".
     */
    function runStaticQueryMigration(tree, tsconfigPath, basePath, isUsageStrategy) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const failureMessages = [];
            // In case the strategy could not be set up properly, we just exit the
            // migration. We don't want to throw an exception as this could mean
            // that other migrations are interrupted.
            if (!strategy.setup()) {
                return [];
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
                    if (message) {
                        const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, q.decorator.node.getStart());
                        failureMessages.push(`${relativePath}@${line + 1}:${character + 1}: ${message}`);
                    }
                });
                tree.commitUpdate(update);
            });
            return failureMessages;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsMkRBQTZGO0lBQzdGLCtCQUF1QztJQUN2QywrQkFBMEI7SUFDMUIsaUNBQWlDO0lBRWpDLGdHQUE2RTtJQUM3RSxrR0FBMkU7SUFDM0Usd0ZBQTBFO0lBQzFFLDZGQUF3RTtJQUN4RSx1RkFBb0Y7SUFFcEYsa0hBQWlFO0lBQ2pFLHlJQUF1RjtJQUV2RixnSUFBOEU7SUFDOUUsNEZBQXdEO0lBRXhELHFEQUFxRDtJQUNyRDtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLG1FQUFtRTtZQUNuRSx3REFBd0Q7WUFDeEQsT0FBTyxXQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQVEsQ0FBQztRQUNuRSxDQUFDLENBQUM7SUFDSixDQUFDO0lBTkQsNEJBTUM7SUFFRCwyRkFBMkY7SUFDM0YsU0FBZSxZQUFZLENBQUMsSUFBVSxFQUFFLE9BQXlCOztZQUMvRCxNQUFNLG9CQUFvQixHQUFHLGdEQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLG1FQUFtRSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLElBQUksQ0FBQyxxREFBcUQs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QUVILE9BQU8sZUFBZSxDQUFDO1FBQ3pCLENBQUM7S0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCB7ZnJvbX0gZnJvbSAncnhqcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcn0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtnZXRJbnF1aXJlciwgc3VwcG9ydHNQcm9tcHR9IGZyb20gJy4uLy4uL3V0aWxzL3NjaGVtYXRpY3NfcHJvbXB0JztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcGFyc2VfdHNjb25maWcnO1xuaW1wb3J0IHtUeXBlU2NyaXB0VmlzaXRvciwgdmlzaXRBbGxOb2Rlc30gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC92aXNpdF9ub2Rlcyc7XG5cbmltcG9ydCB7TmdRdWVyeVJlc29sdmVWaXNpdG9yfSBmcm9tICcuL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvcic7XG5pbXBvcnQge1F1ZXJ5VGVtcGxhdGVTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5JztcbmltcG9ydCB7VGltaW5nU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90aW1pbmctc3RyYXRlZ3knO1xuaW1wb3J0IHtRdWVyeVVzYWdlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy91c2FnZV9zdHJhdGVneS91c2FnZV9zdHJhdGVneSc7XG5pbXBvcnQge2dldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcn0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOCBzdGF0aWMtcXVlcnkgbWlncmF0aW9uLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIC8vIFdlIG5lZWQgdG8gY2FzdCB0aGUgcmV0dXJuZWQgXCJPYnNlcnZhYmxlXCIgdG8gXCJhbnlcIiBhcyB0aGVyZSBpcyBhXG4gICAgLy8gUnhKUyB2ZXJzaW9uIG1pc21hdGNoIHRoYXQgYnJlYWtzIHRoZSBUUyBjb21waWxhdGlvbi5cbiAgICByZXR1cm4gZnJvbShydW5NaWdyYXRpb24odHJlZSwgY29udGV4dCkudGhlbigoKSA9PiB0cmVlKSkgYXMgYW55O1xuICB9O1xufVxuXG4vKiogUnVucyB0aGUgVjggbWlncmF0aW9uIHN0YXRpYy1xdWVyeSBtaWdyYXRpb24gZm9yIGFsbCBkZXRlcm1pbmVkIFR5cGVTY3JpcHQgcHJvamVjdHMuICovXG5hc3luYyBmdW5jdGlvbiBydW5NaWdyYXRpb24odHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkge1xuICBjb25zdCBwcm9qZWN0VHNDb25maWdQYXRocyA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuXG4gIGxvZ2dlci5pbmZvKCctLS0tLS0gU3RhdGljIFF1ZXJ5IG1pZ3JhdGlvbiAtLS0tLS0nKTtcbiAgbG9nZ2VyLmluZm8oJ0luIHByZXBhcmF0aW9uIGZvciBJdnksIGRldmVsb3BlcnMgY2FuIG5vdyBleHBsaWNpdGx5IHNwZWNpZnkgdGhlJyk7XG4gIGxvZ2dlci5pbmZvKCd0aW1pbmcgb2YgdGhlaXIgcXVlcmllcy4gUmVhZCBtb3JlIGFib3V0IHRoaXMgaGVyZTonKTtcbiAgbG9nZ2VyLmluZm8oJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC8yODgxMCcpO1xuICBsb2dnZXIuaW5mbygnJyk7XG5cbiAgaWYgKCFwcm9qZWN0VHNDb25maWdQYXRocy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBxdWVyaWVzICcgK1xuICAgICAgICAndG8gZXhwbGljaXQgdGltaW5nLicpO1xuICB9XG5cbiAgLy8gSW4gY2FzZSBwcm9tcHRzIGFyZSBzdXBwb3J0ZWQsIGRldGVybWluZSB0aGUgZGVzaXJlZCBtaWdyYXRpb24gc3RyYXRlZ3lcbiAgLy8gYnkgY3JlYXRpbmcgYSBjaG9pY2UgcHJvbXB0LiBCeSBkZWZhdWx0IHRoZSB0ZW1wbGF0ZSBzdHJhdGVneSBpcyB1c2VkLlxuICBsZXQgaXNVc2FnZVN0cmF0ZWd5ID0gZmFsc2U7XG4gIGlmIChzdXBwb3J0c1Byb21wdCgpKSB7XG4gICAgbG9nZ2VyLmluZm8oJ1RoZXJlIGFyZSB0d28gYXZhaWxhYmxlIG1pZ3JhdGlvbiBzdHJhdGVnaWVzIHRoYXQgY2FuIGJlIHNlbGVjdGVkOicpO1xuICAgIGxvZ2dlci5pbmZvKCcgIOKAoiBUZW1wbGF0ZSBzdHJhdGVneSAgLSAgbWlncmF0aW9uIHRvb2wgKHNob3J0LXRlcm0gZ2FpbnMsIHJhcmUgY29ycmVjdGlvbnMpJyk7XG4gICAgbG9nZ2VyLmluZm8oJyAg4oCiIFVzYWdlIHN0cmF0ZWd5ICAtICBiZXN0IHByYWN0aWNlcyAobG9uZy10ZXJtIGdhaW5zLCBtYW51YWwgY29ycmVjdGlvbnMpJyk7XG4gICAgbG9nZ2VyLmluZm8oJ0ZvciBhbiBlYXN5IG1pZ3JhdGlvbiwgdGhlIHRlbXBsYXRlIHN0cmF0ZWd5IGlzIHJlY29tbWVuZGVkLiBUaGUgdXNhZ2UnKTtcbiAgICBsb2dnZXIuaW5mbygnc3RyYXRlZ3kgY2FuIGJlIHVzZWQgZm9yIGJlc3QgcHJhY3RpY2VzIGFuZCBhIGNvZGUgYmFzZSB0aGF0IHdpbGwgYmUgbW9yZScpO1xuICAgIGxvZ2dlci5pbmZvKCdmbGV4aWJsZSB0byBjaGFuZ2VzIGdvaW5nIGZvcndhcmQuJyk7XG4gICAgY29uc3Qge3N0cmF0ZWd5TmFtZX0gPSBhd2FpdCBnZXRJbnF1aXJlcigpLnByb21wdDx7c3RyYXRlZ3lOYW1lOiBzdHJpbmd9Pih7XG4gICAgICB0eXBlOiAnbGlzdCcsXG4gICAgICBuYW1lOiAnc3RyYXRlZ3lOYW1lJyxcbiAgICAgIG1lc3NhZ2U6ICdXaGF0IG1pZ3JhdGlvbiBzdHJhdGVneSBkbyB5b3Ugd2FudCB0byB1c2U/JyxcbiAgICAgIGNob2ljZXM6IFtcbiAgICAgICAge25hbWU6ICdUZW1wbGF0ZSBzdHJhdGVneScsIHZhbHVlOiAndGVtcGxhdGUnfSwge25hbWU6ICdVc2FnZSBzdHJhdGVneScsIHZhbHVlOiAndXNhZ2UnfVxuICAgICAgXSxcbiAgICAgIGRlZmF1bHQ6ICd0ZW1wbGF0ZScsXG4gICAgfSk7XG4gICAgbG9nZ2VyLmluZm8oJycpO1xuICAgIGlzVXNhZ2VTdHJhdGVneSA9IHN0cmF0ZWd5TmFtZSA9PT0gJ3VzYWdlJztcbiAgfSBlbHNlIHtcbiAgICAvLyBJbiBjYXNlIHByb21wdHMgYXJlIG5vdCBzdXBwb3J0ZWQsIHdlIHN0aWxsIHdhbnQgdG8gYWxsb3cgZGV2ZWxvcGVycyB0byBvcHRcbiAgICAvLyBpbnRvIHRoZSB1c2FnZSBzdHJhdGVneSBieSBzcGVjaWZ5aW5nIGFuIGVudmlyb25tZW50IHZhcmlhYmxlLiBUaGUgdGVzdHMgYWxzb1xuICAgIC8vIHVzZSB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUgYXMgdGhlcmUgaXMgbm8gaGVhZGxlc3Mgd2F5IHRvIHNlbGVjdCB2aWEgcHJvbXB0LlxuICAgIGlzVXNhZ2VTdHJhdGVneSA9ICEhcHJvY2Vzcy5lbnZbJ05HX1NUQVRJQ19RVUVSWV9VU0FHRV9TVFJBVEVHWSddO1xuICB9XG5cbiAgY29uc3QgZmFpbHVyZXMgPSBbXTtcbiAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgcHJvamVjdFRzQ29uZmlnUGF0aHMpIHtcbiAgICBmYWlsdXJlcy5wdXNoKC4uLmF3YWl0IHJ1blN0YXRpY1F1ZXJ5TWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGlzVXNhZ2VTdHJhdGVneSkpO1xuICB9XG5cbiAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgIGxvZ2dlci5pbmZvKCdTb21lIHF1ZXJpZXMgY2Fubm90IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuIFBsZWFzZSBnbyB0aHJvdWdoJyk7XG4gICAgbG9nZ2VyLmluZm8oJ3Rob3NlIG1hbnVhbGx5IGFuZCBhcHBseSB0aGUgYXBwcm9wcmlhdGUgdGltaW5nOicpO1xuICAgIGZhaWx1cmVzLmZvckVhY2goZmFpbHVyZSA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmYWlsdXJlfWApKTtcbiAgfVxuXG4gIGxvZ2dlci5pbmZvKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSBzdGF0aWMgcXVlcnkgbWlncmF0aW9uIGZvciB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBwcm9qZWN0LiBUaGUgc2NoZW1hdGljXG4gKiBhbmFseXplcyBhbGwgcXVlcmllcyB3aXRoaW4gdGhlIHByb2plY3QgYW5kIHNldHMgdXAgdGhlIHF1ZXJ5IHRpbWluZyBiYXNlZCBvblxuICogdGhlIGN1cnJlbnQgdXNhZ2Ugb2YgdGhlIHF1ZXJ5IHByb3BlcnR5LiBlLmcuIGEgdmlldyBxdWVyeSB0aGF0IGlzIG5vdCB1c2VkIGluIGFueVxuICogbGlmZWN5Y2xlIGhvb2sgZG9lcyBub3QgbmVlZCB0byBiZSBzdGF0aWMgYW5kIGNhbiBiZSBzZXQgdXAgd2l0aCBcInN0YXRpYzogZmFsc2VcIi5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuU3RhdGljUXVlcnlNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGlzVXNhZ2VTdHJhdGVneTogYm9vbGVhbikge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBob3N0IFwicmVhZEZpbGVcIiBtZXRob2QsIGFzIHdlIHdhbnQgdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuIE90aGVyd2lzZVxuICAvLyBpZiB3ZSBydW4gdGhlIG1pZ3JhdGlvbiBmb3IgbXVsdGlwbGUgdHNjb25maWcgZmlsZXMgd2hpY2ggaGF2ZSBpbnRlcnNlY3RpbmdcbiAgLy8gc291cmNlIGZpbGVzLCBpdCBjYW4gZW5kIHVwIHVwZGF0aW5nIHF1ZXJ5IGRlZmluaXRpb25zIG11bHRpcGxlIHRpbWVzLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgcXVlcnlWaXNpdG9yID0gbmV3IE5nUXVlcnlSZXNvbHZlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHRlbXBsYXRlVmlzaXRvciA9IG5ldyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHJvb3RTb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0Um9vdEZpbGVOYW1lcygpLm1hcChmID0+IHByb2dyYW0uZ2V0U291cmNlRmlsZShmKSAhKTtcbiAgY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcbiAgY29uc3QgYW5hbHlzaXNWaXNpdG9yczogVHlwZVNjcmlwdFZpc2l0b3JbXSA9IFtxdWVyeVZpc2l0b3JdO1xuXG4gIC8vIElmIHRoZSBcInVzYWdlXCIgc3RyYXRlZ3kgaXMgc2VsZWN0ZWQsIHdlIGFsc28gbmVlZCB0byBhZGQgdGhlIHF1ZXJ5IHZpc2l0b3JcbiAgLy8gdG8gdGhlIGFuYWx5c2lzIHZpc2l0b3JzIHNvIHRoYXQgcXVlcnkgdXNhZ2UgaW4gdGVtcGxhdGVzIGNhbiBiZSBhbHNvIGNoZWNrZWQuXG4gIGlmIChpc1VzYWdlU3RyYXRlZ3kpIHtcbiAgICBhbmFseXNpc1Zpc2l0b3JzLnB1c2godGVtcGxhdGVWaXNpdG9yKTtcbiAgfVxuXG4gIHJvb3RTb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgIC8vIFRoZSB2aXNpdCB1dGlsaXR5IGZ1bmN0aW9uIG9ubHkgdHJhdmVyc2VzIGEgc291cmNlIGZpbGUgb25jZS4gV2UgZG9uJ3Qgd2FudCB0b1xuICAgIC8vIHRyYXZlcnNlIHRocm91Z2ggYWxsIHNvdXJjZSBmaWxlcyBtdWx0aXBsZSB0aW1lcyBmb3IgZWFjaCB2aXNpdG9yIGFzIHRoaXMgY291bGQgYmVcbiAgICAvLyBzbG93LlxuICAgIHZpc2l0QWxsTm9kZXMoc291cmNlRmlsZSwgYW5hbHlzaXNWaXNpdG9ycyk7XG4gIH0pO1xuXG4gIGNvbnN0IHtyZXNvbHZlZFF1ZXJpZXMsIGNsYXNzTWV0YWRhdGF9ID0gcXVlcnlWaXNpdG9yO1xuICBjb25zdCB7cmVzb2x2ZWRUZW1wbGF0ZXN9ID0gdGVtcGxhdGVWaXNpdG9yO1xuXG4gIGlmIChpc1VzYWdlU3RyYXRlZ3kpIHtcbiAgICAvLyBBZGQgYWxsIHJlc29sdmVkIHRlbXBsYXRlcyB0byB0aGUgY2xhc3MgbWV0YWRhdGEgaWYgdGhlIHVzYWdlIHN0cmF0ZWd5IGlzIHVzZWQuIFRoaXNcbiAgICAvLyBpcyBuZWNlc3NhcnkgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBjaGVjayBjb21wb25lbnQgdGVtcGxhdGVzIGZvciBzdGF0aWMgcXVlcnkgdXNhZ2UuXG4gICAgcmVzb2x2ZWRUZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB7XG4gICAgICBpZiAoY2xhc3NNZXRhZGF0YS5oYXModGVtcGxhdGUuY29udGFpbmVyKSkge1xuICAgICAgICBjbGFzc01ldGFkYXRhLmdldCh0ZW1wbGF0ZS5jb250YWluZXIpICEudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IHN0cmF0ZWd5OiBUaW1pbmdTdHJhdGVneSA9IGlzVXNhZ2VTdHJhdGVneSA/XG4gICAgICBuZXcgUXVlcnlVc2FnZVN0cmF0ZWd5KGNsYXNzTWV0YWRhdGEsIHR5cGVDaGVja2VyKSA6XG4gICAgICBuZXcgUXVlcnlUZW1wbGF0ZVN0cmF0ZWd5KHRzY29uZmlnUGF0aCwgY2xhc3NNZXRhZGF0YSwgaG9zdCk7XG4gIGNvbnN0IGZhaWx1cmVNZXNzYWdlczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBJbiBjYXNlIHRoZSBzdHJhdGVneSBjb3VsZCBub3QgYmUgc2V0IHVwIHByb3Blcmx5LCB3ZSBqdXN0IGV4aXQgdGhlXG4gIC8vIG1pZ3JhdGlvbi4gV2UgZG9uJ3Qgd2FudCB0byB0aHJvdyBhbiBleGNlcHRpb24gYXMgdGhpcyBjb3VsZCBtZWFuXG4gIC8vIHRoYXQgb3RoZXIgbWlncmF0aW9ucyBhcmUgaW50ZXJydXB0ZWQuXG4gIGlmICghc3RyYXRlZ3kuc2V0dXAoKSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIHRoYXQgY29udGFpbiByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGVcbiAgLy8gdGhlIHNvdXJjZSBmaWxlcyBpZiBuZWVkZWQuIE5vdGUgdGhhdCB3ZSBuZWVkIHRvIHVwZGF0ZSBtdWx0aXBsZSBxdWVyaWVzXG4gIC8vIHdpdGhpbiBhIHNvdXJjZSBmaWxlIHdpdGhpbiB0aGUgc2FtZSByZWNvcmRlciBpbiBvcmRlciB0byBub3QgdGhyb3cgb2ZmXG4gIC8vIHRoZSBUeXBlU2NyaXB0IG5vZGUgb2Zmc2V0cy5cbiAgcmVzb2x2ZWRRdWVyaWVzLmZvckVhY2goKHF1ZXJpZXMsIHNvdXJjZUZpbGUpID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZVBhdGgpO1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgcXVlcnkgdGltaW5nIGZvciBhbGwgcmVzb2x2ZWQgcXVlcmllcyBhbmQgdXBkYXRlIHRoZVxuICAgIC8vIHF1ZXJ5IGRlZmluaXRpb25zIHRvIGV4cGxpY2l0bHkgc2V0IHRoZSBkZXRlcm1pbmVkIHF1ZXJ5IHRpbWluZy5cbiAgICBxdWVyaWVzLmZvckVhY2gocSA9PiB7XG4gICAgICBjb25zdCBxdWVyeUV4cHIgPSBxLmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgICBjb25zdCB7dGltaW5nLCBtZXNzYWdlfSA9IHN0cmF0ZWd5LmRldGVjdFRpbWluZyhxKTtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWVkTm9kZSA9IGdldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcihxLCB0aW1pbmcsICEhbWVzc2FnZSk7XG5cbiAgICAgIGlmICghdHJhbnNmb3JtZWROb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3VGV4dCA9IHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCB0cmFuc2Zvcm1lZE5vZGUsIHNvdXJjZUZpbGUpO1xuXG4gICAgICAvLyBSZXBsYWNlIHRoZSBleGlzdGluZyBxdWVyeSBkZWNvcmF0b3IgY2FsbCBleHByZXNzaW9uIHdpdGggdGhlIHVwZGF0ZWRcbiAgICAgIC8vIGNhbGwgZXhwcmVzc2lvbiBub2RlLlxuICAgICAgdXBkYXRlLnJlbW92ZShxdWVyeUV4cHIuZ2V0U3RhcnQoKSwgcXVlcnlFeHByLmdldFdpZHRoKCkpO1xuICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBuZXdUZXh0KTtcblxuICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgcS5kZWNvcmF0b3Iubm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgZmFpbHVyZU1lc3NhZ2VzLnB1c2goYCR7cmVsYXRpdmVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke21lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcblxuICByZXR1cm4gZmFpbHVyZU1lc3NhZ2VzO1xufVxuIl19