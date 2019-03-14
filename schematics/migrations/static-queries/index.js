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
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/transform", "@angular/core/schematics/migrations/static-queries/typescript/tsconfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const analyze_query_usage_1 = require("@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage");
    const ng_query_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor");
    const transform_1 = require("@angular/core/schematics/migrations/static-queries/transform");
    const tsconfig_1 = require("@angular/core/schematics/migrations/static-queries/typescript/tsconfig");
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
        const parsed = tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
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
        const rootSourceFiles = program.getRootFileNames().map(f => program.getSourceFile(f));
        const printer = ts.createPrinter();
        // Analyze source files by detecting queries and class relations.
        rootSourceFiles.forEach(sourceFile => queryVisitor.visitNode(sourceFile));
        const { resolvedQueries, classMetadata } = queryVisitor;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJEQUEyRTtJQUMzRSwrQkFBdUM7SUFDdkMsaUNBQWlDO0lBRWpDLGtHQUEyRTtJQUUzRSx3SEFBa0U7SUFDbEUsa0hBQWlFO0lBQ2pFLDRGQUF3RDtJQUN4RCxxR0FBd0Q7SUFHeEQscURBQXFEO0lBQ3JEO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxFQUFFO1lBQ3BCLE1BQU0sb0JBQW9CLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsMkRBQTJEO29CQUMzRCxxQkFBcUIsQ0FBQyxDQUFDO2FBQzVCO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxvQkFBb0IsRUFBRTtnQkFDL0MsdUJBQXVCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN2RDtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFmRCw0QkFlQztJQUVEOzs7OztPQUtHO0lBQ0gsU0FBUyx1QkFBdUIsQ0FBQyxJQUFVLEVBQUUsWUFBb0IsRUFBRSxRQUFnQjtRQUNqRixNQUFNLE1BQU0sR0FBRyw0QkFBaUIsQ0FBQyxZQUFZLEVBQUUsY0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsNkVBQTZFO1FBQzdFLCtFQUErRTtRQUMvRSw4RUFBOEU7UUFDOUUseUVBQXlFO1FBQ3pFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdkQsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ2hELENBQUMsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3QyxNQUFNLFlBQVksR0FBRyxJQUFJLHdDQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzVELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFHLENBQUMsQ0FBQztRQUN4RixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFbkMsaUVBQWlFO1FBQ2pFLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFMUUsTUFBTSxFQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUMsR0FBRyxZQUFZLENBQUM7UUFFdEQseUVBQXlFO1FBQ3pFLDJFQUEyRTtRQUMzRSwwRUFBMEU7UUFDMUUsK0JBQStCO1FBQy9CLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEVBQUU7WUFDOUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRXpFLGtFQUFrRTtZQUNsRSwrRUFBK0U7WUFDL0UsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbEIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUM5QyxNQUFNLE1BQU0sR0FBRyx5Q0FBbUIsQ0FBQyxDQUFDLEVBQUUsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLGVBQWUsR0FBRyx1Q0FBMkIsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRS9ELElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3BCLE9BQU87aUJBQ1I7Z0JBRUQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXhGLHdFQUF3RTtnQkFDeEUsd0JBQXdCO2dCQUN4QixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcblxuaW1wb3J0IHthbmFseXplTmdRdWVyeVVzYWdlfSBmcm9tICcuL2FuZ3VsYXIvYW5hbHl6ZV9xdWVyeV91c2FnZSc7XG5pbXBvcnQge05nUXVlcnlSZXNvbHZlVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtnZXRUcmFuc2Zvcm1lZFF1ZXJ5Q2FsbEV4cHJ9IGZyb20gJy4vdHJhbnNmb3JtJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4vdHlwZXNjcmlwdC90c2NvbmZpZyc7XG5cblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjggc3RhdGljLXF1ZXJ5IG1pZ3JhdGlvbi4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUpID0+IHtcbiAgICBjb25zdCBwcm9qZWN0VHNDb25maWdQYXRocyA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcblxuICAgIGlmICghcHJvamVjdFRzQ29uZmlnUGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBtaWdyYXRlIHF1ZXJpZXMgJyArXG4gICAgICAgICAgJ3RvIGV4cGxpY2l0IHRpbWluZy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBwcm9qZWN0VHNDb25maWdQYXRocykge1xuICAgICAgcnVuU3RhdGljUXVlcnlNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJ1bnMgdGhlIHN0YXRpYyBxdWVyeSBtaWdyYXRpb24gZm9yIHRoZSBnaXZlbiBUeXBlU2NyaXB0IHByb2plY3QuIFRoZSBzY2hlbWF0aWNcbiAqIGFuYWx5emVzIGFsbCBxdWVyaWVzIHdpdGhpbiB0aGUgcHJvamVjdCBhbmQgc2V0cyB1cCB0aGUgcXVlcnkgdGltaW5nIGJhc2VkIG9uXG4gKiB0aGUgY3VycmVudCB1c2FnZSBvZiB0aGUgcXVlcnkgcHJvcGVydHkuIGUuZy4gYSB2aWV3IHF1ZXJ5IHRoYXQgaXMgbm90IHVzZWQgaW4gYW55XG4gKiBsaWZlY3ljbGUgaG9vayBkb2VzIG5vdCBuZWVkIHRvIGJlIHN0YXRpYyBhbmQgY2FuIGJlIHNldCB1cCB3aXRoIFwic3RhdGljOiBmYWxzZVwiLlxuICovXG5mdW5jdGlvbiBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBob3N0IFwicmVhZEZpbGVcIiBtZXRob2QsIGFzIHdlIHdhbnQgdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuIE90aGVyd2lzZVxuICAvLyBpZiB3ZSBydW4gdGhlIG1pZ3JhdGlvbiBmb3IgbXVsdGlwbGUgdHNjb25maWcgZmlsZXMgd2hpY2ggaGF2ZSBpbnRlcnNlY3RpbmdcbiAgLy8gc291cmNlIGZpbGVzLCBpdCBjYW4gZW5kIHVwIHVwZGF0aW5nIHF1ZXJ5IGRlZmluaXRpb25zIG11bHRpcGxlIHRpbWVzLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgcXVlcnlWaXNpdG9yID0gbmV3IE5nUXVlcnlSZXNvbHZlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHJvb3RTb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0Um9vdEZpbGVOYW1lcygpLm1hcChmID0+IHByb2dyYW0uZ2V0U291cmNlRmlsZShmKSAhKTtcbiAgY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgcXVlcmllcyBhbmQgY2xhc3MgcmVsYXRpb25zLlxuICByb290U291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHF1ZXJ5VmlzaXRvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtyZXNvbHZlZFF1ZXJpZXMsIGNsYXNzTWV0YWRhdGF9ID0gcXVlcnlWaXNpdG9yO1xuXG4gIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIHRoYXQgY29udGFpbiByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGVcbiAgLy8gdGhlIHNvdXJjZSBmaWxlcyBpZiBuZWVkZWQuIE5vdGUgdGhhdCB3ZSBuZWVkIHRvIHVwZGF0ZSBtdWx0aXBsZSBxdWVyaWVzXG4gIC8vIHdpdGhpbiBhIHNvdXJjZSBmaWxlIHdpdGhpbiB0aGUgc2FtZSByZWNvcmRlciBpbiBvcmRlciB0byBub3QgdGhyb3cgb2ZmXG4gIC8vIHRoZSBUeXBlU2NyaXB0IG5vZGUgb2Zmc2V0cy5cbiAgcmVzb2x2ZWRRdWVyaWVzLmZvckVhY2goKHF1ZXJpZXMsIHNvdXJjZUZpbGUpID0+IHtcbiAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG5cbiAgICAvLyBDb21wdXRlIHRoZSBxdWVyeSB1c2FnZSBmb3IgYWxsIHJlc29sdmVkIHF1ZXJpZXMgYW5kIHVwZGF0ZSB0aGVcbiAgICAvLyBxdWVyeSBkZWZpbml0aW9ucyB0byBleHBsaWNpdGx5IGRlY2xhcmUgdGhlIHF1ZXJ5IHRpbWluZyAoc3RhdGljIG9yIGR5bmFtaWMpXG4gICAgcXVlcmllcy5mb3JFYWNoKHEgPT4ge1xuICAgICAgY29uc3QgcXVlcnlFeHByID0gcS5kZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuICAgICAgY29uc3QgdGltaW5nID0gYW5hbHl6ZU5nUXVlcnlVc2FnZShxLCBjbGFzc01ldGFkYXRhLCB0eXBlQ2hlY2tlcik7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1lZE5vZGUgPSBnZXRUcmFuc2Zvcm1lZFF1ZXJ5Q2FsbEV4cHIocSwgdGltaW5nKTtcblxuICAgICAgaWYgKCF0cmFuc2Zvcm1lZE5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdUZXh0ID0gcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHRyYW5zZm9ybWVkTm9kZSwgc291cmNlRmlsZSk7XG5cbiAgICAgIC8vIFJlcGxhY2UgdGhlIGV4aXN0aW5nIHF1ZXJ5IGRlY29yYXRvciBjYWxsIGV4cHJlc3Npb24gd2l0aCB0aGUgdXBkYXRlZFxuICAgICAgLy8gY2FsbCBleHByZXNzaW9uIG5vZGUuXG4gICAgICB1cGRhdGUucmVtb3ZlKHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBxdWVyeUV4cHIuZ2V0V2lkdGgoKSk7XG4gICAgICB1cGRhdGUuaW5zZXJ0UmlnaHQocXVlcnlFeHByLmdldFN0YXJ0KCksIG5ld1RleHQpO1xuICAgIH0pO1xuXG4gICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlKTtcbiAgfSk7XG59XG4iXX0=