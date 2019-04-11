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
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/utils/typescript/visit_nodes", "@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/transform"], factory);
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
    const analyze_query_usage_1 = require("@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage");
    const ng_query_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor");
    const transform_1 = require("@angular/core/schematics/migrations/static-queries/transform");
    /** Entry point for the V8 static-query migration. */
    function default_1() {
        return (tree) => {
            const projectTsConfigPaths = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            if (!projectTsConfigPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate queries ' +
                    'to explicit timing.');
            }
            for (const tsconfigPath of projectTsConfigPaths) {
                runStaticQueryMigration(tree, tsconfigPath, basePath);
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
    function runStaticQueryMigration(tree, tsconfigPath, basePath) {
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
        // Analyze source files by detecting queries, class relations and component templates.
        rootSourceFiles.forEach(sourceFile => {
            // The visit utility function only traverses the source file once. We don't want to
            // traverse through all source files multiple times for each visitor as this could be
            // slow.
            visit_nodes_1.visitAllNodes(sourceFile, [queryVisitor, templateVisitor]);
        });
        const { resolvedQueries, classMetadata } = queryVisitor;
        // Add all resolved templates to the class metadata so that we can also
        // check component templates for static query usage.
        templateVisitor.resolvedTemplates.forEach(template => {
            if (classMetadata.has(template.container)) {
                classMetadata.get(template.container).template = template;
            }
        });
        // Walk through all source files that contain resolved queries and update
        // the source files if needed. Note that we need to update multiple queries
        // within a source file within the same recorder in order to not throw off
        // the TypeScript node offsets.
        resolvedQueries.forEach((queries, sourceFile) => {
            const update = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
            // Compute the query usage for all resolved queries and update the
            // query definitions to explicitly declare the query timing (static or dynamic)
            queries.forEach(q => {
                const queryExpr = q.decorator.node.expression;
                const timing = analyze_query_usage_1.analyzeNgQueryUsage(q, classMetadata, typeChecker);
                const transformedNode = transform_1.getTransformedQueryCallExpr(q, timing);
                if (!transformedNode) {
                    return;
                }
                const newText = printer.printNode(ts.EmitHint.Unspecified, transformedNode, sourceFile);
                // Replace the existing query decorator call expression with the updated
                // call expression node.
                update.remove(queryExpr.getStart(), queryExpr.getWidth());
                update.insertRight(queryExpr.getStart(), newText);
            });
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJEQUEyRTtJQUMzRSwrQkFBdUM7SUFDdkMsaUNBQWlDO0lBRWpDLGdHQUE2RTtJQUM3RSxrR0FBMkU7SUFDM0UsNkZBQXdFO0lBQ3hFLHVGQUFpRTtJQUVqRSx3SEFBa0U7SUFDbEUsa0hBQWlFO0lBQ2pFLDRGQUF3RDtJQUl4RCxxREFBcUQ7SUFDckQ7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLEVBQUU7WUFDcEIsTUFBTSxvQkFBb0IsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRTtnQkFDaEMsTUFBTSxJQUFJLGdDQUFtQixDQUN6QiwyREFBMkQ7b0JBQzNELHFCQUFxQixDQUFDLENBQUM7YUFDNUI7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLG9CQUFvQixFQUFFO2dCQUMvQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ3ZEO1FBQ0gsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQWZELDRCQWVDO0lBRUQ7Ozs7O09BS0c7SUFDSCxTQUFTLHVCQUF1QixDQUFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCO1FBQ2pGLE1BQU0sTUFBTSxHQUFHLGtDQUFpQixDQUFDLFlBQVksRUFBRSxjQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8s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QUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3BhcnNlX3RzY29uZmlnJztcbmltcG9ydCB7dmlzaXRBbGxOb2Rlc30gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC92aXNpdF9ub2Rlcyc7XG5cbmltcG9ydCB7YW5hbHl6ZU5nUXVlcnlVc2FnZX0gZnJvbSAnLi9hbmd1bGFyL2FuYWx5emVfcXVlcnlfdXNhZ2UnO1xuaW1wb3J0IHtOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3J9IGZyb20gJy4vYW5ndWxhci9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7Z2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5cblxuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOCBzdGF0aWMtcXVlcnkgbWlncmF0aW9uLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHByb2plY3RUc0NvbmZpZ1BhdGhzID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgaWYgKCFwcm9qZWN0VHNDb25maWdQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgcXVlcmllcyAnICtcbiAgICAgICAgICAndG8gZXhwbGljaXQgdGltaW5nLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIHByb2plY3RUc0NvbmZpZ1BhdGhzKSB7XG4gICAgICBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUnVucyB0aGUgc3RhdGljIHF1ZXJ5IG1pZ3JhdGlvbiBmb3IgdGhlIGdpdmVuIFR5cGVTY3JpcHQgcHJvamVjdC4gVGhlIHNjaGVtYXRpY1xuICogYW5hbHl6ZXMgYWxsIHF1ZXJpZXMgd2l0aGluIHRoZSBwcm9qZWN0IGFuZCBzZXRzIHVwIHRoZSBxdWVyeSB0aW1pbmcgYmFzZWQgb25cbiAqIHRoZSBjdXJyZW50IHVzYWdlIG9mIHRoZSBxdWVyeSBwcm9wZXJ0eS4gZS5nLiBhIHZpZXcgcXVlcnkgdGhhdCBpcyBub3QgdXNlZCBpbiBhbnlcbiAqIGxpZmVjeWNsZSBob29rIGRvZXMgbm90IG5lZWQgdG8gYmUgc3RhdGljIGFuZCBjYW4gYmUgc2V0IHVwIHdpdGggXCJzdGF0aWM6IGZhbHNlXCIuXG4gKi9cbmZ1bmN0aW9uIHJ1blN0YXRpY1F1ZXJ5TWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IHRzLmNyZWF0ZUNvbXBpbGVySG9zdChwYXJzZWQub3B0aW9ucywgdHJ1ZSk7XG5cbiAgLy8gV2UgbmVlZCB0byBvdmVyd3JpdGUgdGhlIGhvc3QgXCJyZWFkRmlsZVwiIG1ldGhvZCwgYXMgd2Ugd2FudCB0aGUgVHlwZVNjcmlwdFxuICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS4gT3RoZXJ3aXNlXG4gIC8vIGlmIHdlIHJ1biB0aGUgbWlncmF0aW9uIGZvciBtdWx0aXBsZSB0c2NvbmZpZyBmaWxlcyB3aGljaCBoYXZlIGludGVyc2VjdGluZ1xuICAvLyBzb3VyY2UgZmlsZXMsIGl0IGNhbiBlbmQgdXAgdXBkYXRpbmcgcXVlcnkgZGVmaW5pdGlvbnMgbXVsdGlwbGUgdGltZXMuXG4gIGhvc3QucmVhZEZpbGUgPSBmaWxlTmFtZSA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gdHJlZS5yZWFkKHJlbGF0aXZlKGJhc2VQYXRoLCBmaWxlTmFtZSkpO1xuICAgIHJldHVybiBidWZmZXIgPyBidWZmZXIudG9TdHJpbmcoKSA6IHVuZGVmaW5lZDtcbiAgfTtcblxuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBxdWVyeVZpc2l0b3IgPSBuZXcgTmdRdWVyeVJlc29sdmVWaXNpdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3QgdGVtcGxhdGVWaXNpdG9yID0gbmV3IE5nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3Qgcm9vdFNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRSb290RmlsZU5hbWVzKCkubWFwKGYgPT4gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlKGYpICEpO1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBxdWVyaWVzLCBjbGFzcyByZWxhdGlvbnMgYW5kIGNvbXBvbmVudCB0ZW1wbGF0ZXMuXG4gIHJvb3RTb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgIC8vIFRoZSB2aXNpdCB1dGlsaXR5IGZ1bmN0aW9uIG9ubHkgdHJhdmVyc2VzIHRoZSBzb3VyY2UgZmlsZSBvbmNlLiBXZSBkb24ndCB3YW50IHRvXG4gICAgLy8gdHJhdmVyc2UgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIG11bHRpcGxlIHRpbWVzIGZvciBlYWNoIHZpc2l0b3IgYXMgdGhpcyBjb3VsZCBiZVxuICAgIC8vIHNsb3cuXG4gICAgdmlzaXRBbGxOb2Rlcyhzb3VyY2VGaWxlLCBbcXVlcnlWaXNpdG9yLCB0ZW1wbGF0ZVZpc2l0b3JdKTtcbiAgfSk7XG5cbiAgY29uc3Qge3Jlc29sdmVkUXVlcmllcywgY2xhc3NNZXRhZGF0YX0gPSBxdWVyeVZpc2l0b3I7XG5cbiAgLy8gQWRkIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgdG8gdGhlIGNsYXNzIG1ldGFkYXRhIHNvIHRoYXQgd2UgY2FuIGFsc29cbiAgLy8gY2hlY2sgY29tcG9uZW50IHRlbXBsYXRlcyBmb3Igc3RhdGljIHF1ZXJ5IHVzYWdlLlxuICB0ZW1wbGF0ZVZpc2l0b3IucmVzb2x2ZWRUZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB7XG4gICAgaWYgKGNsYXNzTWV0YWRhdGEuaGFzKHRlbXBsYXRlLmNvbnRhaW5lcikpIHtcbiAgICAgIGNsYXNzTWV0YWRhdGEuZ2V0KHRlbXBsYXRlLmNvbnRhaW5lcikgIS50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gV2FsayB0aHJvdWdoIGFsbCBzb3VyY2UgZmlsZXMgdGhhdCBjb250YWluIHJlc29sdmVkIHF1ZXJpZXMgYW5kIHVwZGF0ZVxuICAvLyB0aGUgc291cmNlIGZpbGVzIGlmIG5lZWRlZC4gTm90ZSB0aGF0IHdlIG5lZWQgdG8gdXBkYXRlIG11bHRpcGxlIHF1ZXJpZXNcbiAgLy8gd2l0aGluIGEgc291cmNlIGZpbGUgd2l0aGluIHRoZSBzYW1lIHJlY29yZGVyIGluIG9yZGVyIHRvIG5vdCB0aHJvdyBvZmZcbiAgLy8gdGhlIFR5cGVTY3JpcHQgbm9kZSBvZmZzZXRzLlxuICByZXNvbHZlZFF1ZXJpZXMuZm9yRWFjaCgocXVlcmllcywgc291cmNlRmlsZSkgPT4ge1xuICAgIGNvbnN0IHVwZGF0ZSA9IHRyZWUuYmVnaW5VcGRhdGUocmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcblxuICAgIC8vIENvbXB1dGUgdGhlIHF1ZXJ5IHVzYWdlIGZvciBhbGwgcmVzb2x2ZWQgcXVlcmllcyBhbmQgdXBkYXRlIHRoZVxuICAgIC8vIHF1ZXJ5IGRlZmluaXRpb25zIHRvIGV4cGxpY2l0bHkgZGVjbGFyZSB0aGUgcXVlcnkgdGltaW5nIChzdGF0aWMgb3IgZHluYW1pYylcbiAgICBxdWVyaWVzLmZvckVhY2gocSA9PiB7XG4gICAgICBjb25zdCBxdWVyeUV4cHIgPSBxLmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgICBjb25zdCB0aW1pbmcgPSBhbmFseXplTmdRdWVyeVVzYWdlKHEsIGNsYXNzTWV0YWRhdGEsIHR5cGVDaGVja2VyKTtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWVkTm9kZSA9IGdldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcihxLCB0aW1pbmcpO1xuXG4gICAgICBpZiAoIXRyYW5zZm9ybWVkTm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld1RleHQgPSBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgdHJhbnNmb3JtZWROb2RlLCBzb3VyY2VGaWxlKTtcblxuICAgICAgLy8gUmVwbGFjZSB0aGUgZXhpc3RpbmcgcXVlcnkgZGVjb3JhdG9yIGNhbGwgZXhwcmVzc2lvbiB3aXRoIHRoZSB1cGRhdGVkXG4gICAgICAvLyBjYWxsIGV4cHJlc3Npb24gbm9kZS5cbiAgICAgIHVwZGF0ZS5yZW1vdmUocXVlcnlFeHByLmdldFN0YXJ0KCksIHF1ZXJ5RXhwci5nZXRXaWR0aCgpKTtcbiAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChxdWVyeUV4cHIuZ2V0U3RhcnQoKSwgbmV3VGV4dCk7XG4gICAgfSk7XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcbn1cbiJdfQ==