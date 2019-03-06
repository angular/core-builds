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
        define("@angular/core/schematics/migrations/static-queries/migration", ["require", "exports", "path", "typescript", "@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/angular/query-definition", "@angular/core/schematics/migrations/static-queries/typescript/property_name", "@angular/core/schematics/migrations/static-queries/typescript/tsconfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path_1 = require("path");
    const ts = require("typescript");
    const analyze_query_usage_1 = require("@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage");
    const ng_query_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    const property_name_1 = require("@angular/core/schematics/migrations/static-queries/typescript/property_name");
    const tsconfig_1 = require("@angular/core/schematics/migrations/static-queries/typescript/tsconfig");
    /**
     * Runs the static query migration for the given TypeScript project. The schematic
     * analyzes all queries within the project and sets up the query timing based on
     * the current usage of the query property. e.g. a view query that is not used in any
     * lifecycle hook does not need to be static and can be set up with "static: false".
     */
    function runStaticQueryMigration(tree, tsconfigPath, basePath) {
        const parsed = tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = ts.createCompilerHost(parsed.options, true);
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
                const timing = analyze_query_usage_1.analyzeNgQueryUsage(q, classMetadata, typeChecker);
                recordQueryUsageTransformation(q, update, timing, printer, sourceFile);
            });
            tree.commitUpdate(update);
        });
    }
    exports.runStaticQueryMigration = runStaticQueryMigration;
    /**
     * Transforms the query decorator by explicitly specifying the timing based on the
     * determined timing. The changes will be added to the specified update recorder.
     */
    function recordQueryUsageTransformation(query, recorder, timing, printer, sourceFile) {
        const queryExpr = query.decorator.node.expression;
        const queryArguments = queryExpr.arguments;
        const timingPropertyAssignment = ts.createPropertyAssignment('static', timing === query_definition_1.QueryTiming.STATIC ? ts.createTrue() : ts.createFalse());
        let newCallText = '';
        // If the query decorator is already called with two arguments, we need to
        // keep the existing options untouched and just add the new property if needed.
        if (queryArguments.length === 2) {
            const existingOptions = queryArguments[1];
            // In case the options already contains a property for the "static" flag, we just
            // skip this query and leave it untouched.
            if (existingOptions.properties.some(p => !!p.name && property_name_1.getPropertyNameText(p.name) === 'static')) {
                return;
            }
            const updatedOptions = ts.updateObjectLiteral(existingOptions, existingOptions.properties.concat(timingPropertyAssignment));
            const updatedCall = ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], updatedOptions]);
            newCallText = printer.printNode(ts.EmitHint.Unspecified, updatedCall, sourceFile);
        }
        else {
            const newCall = ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], ts.createObjectLiteral([timingPropertyAssignment])]);
            newCallText = printer.printNode(ts.EmitHint.Unspecified, newCall, sourceFile);
        }
        recorder.remove(queryExpr.getStart(), queryExpr.getWidth());
        recorder.insertRight(queryExpr.getStart(), newCallText);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvbWlncmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBR0gsK0JBQWdEO0lBQ2hELGlDQUFpQztJQUVqQyx3SEFBa0U7SUFDbEUsa0hBQWlFO0lBQ2pFLGtIQUEwRTtJQUMxRSwrR0FBK0Q7SUFDL0QscUdBQXdEO0lBRXhEOzs7OztPQUtHO0lBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDeEYsTUFBTSxNQUFNLEdBQUcsNEJBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pELE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3QyxNQUFNLFlBQVksR0FBRyxJQUFJLHdDQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzVELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFHLENBQUMsQ0FBQztRQUN4RixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFbkMsaUVBQWlFO1FBQ2pFLGVBQWUsQ0FBQyxPQUFP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bUIsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0UsV0FBVyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQy9FO1FBRUQsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDNUQsUUFBUSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDMUQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUcmVlLCBVcGRhdGVSZWNvcmRlcn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtkaXJuYW1lLCByZWxhdGl2ZSwgcmVzb2x2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHthbmFseXplTmdRdWVyeVVzYWdlfSBmcm9tICcuL2FuZ3VsYXIvYW5hbHl6ZV9xdWVyeV91c2FnZSc7XG5pbXBvcnQge05nUXVlcnlSZXNvbHZlVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmd9IGZyb20gJy4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi90eXBlc2NyaXB0L3RzY29uZmlnJztcblxuLyoqXG4gKiBSdW5zIHRoZSBzdGF0aWMgcXVlcnkgbWlncmF0aW9uIGZvciB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBwcm9qZWN0LiBUaGUgc2NoZW1hdGljXG4gKiBhbmFseXplcyBhbGwgcXVlcmllcyB3aXRoaW4gdGhlIHByb2plY3QgYW5kIHNldHMgdXAgdGhlIHF1ZXJ5IHRpbWluZyBiYXNlZCBvblxuICogdGhlIGN1cnJlbnQgdXNhZ2Ugb2YgdGhlIHF1ZXJ5IHByb3BlcnR5LiBlLmcuIGEgdmlldyBxdWVyeSB0aGF0IGlzIG5vdCB1c2VkIGluIGFueVxuICogbGlmZWN5Y2xlIGhvb2sgZG9lcyBub3QgbmVlZCB0byBiZSBzdGF0aWMgYW5kIGNhbiBiZSBzZXQgdXAgd2l0aCBcInN0YXRpYzogZmFsc2VcIi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJ1blN0YXRpY1F1ZXJ5TWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IHRzLmNyZWF0ZUNvbXBpbGVySG9zdChwYXJzZWQub3B0aW9ucywgdHJ1ZSk7XG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHF1ZXJ5VmlzaXRvciA9IG5ldyBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCByb290U291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFJvb3RGaWxlTmFtZXMoKS5tYXAoZiA9PiBwcm9ncmFtLmdldFNvdXJjZUZpbGUoZikgISk7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIHF1ZXJpZXMgYW5kIGNsYXNzIHJlbGF0aW9ucy5cbiAgcm9vdFNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiBxdWVyeVZpc2l0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7cmVzb2x2ZWRRdWVyaWVzLCBjbGFzc01ldGFkYXRhfSA9IHF1ZXJ5VmlzaXRvcjtcblxuICAvLyBXYWxrIHRocm91Z2ggYWxsIHNvdXJjZSBmaWxlcyB0aGF0IGNvbnRhaW4gcmVzb2x2ZWQgcXVlcmllcyBhbmQgdXBkYXRlXG4gIC8vIHRoZSBzb3VyY2UgZmlsZXMgaWYgbmVlZGVkLiBOb3RlIHRoYXQgd2UgbmVlZCB0byB1cGRhdGUgbXVsdGlwbGUgcXVlcmllc1xuICAvLyB3aXRoaW4gYSBzb3VyY2UgZmlsZSB3aXRoaW4gdGhlIHNhbWUgcmVjb3JkZXIgaW4gb3JkZXIgdG8gbm90IHRocm93IG9mZlxuICAvLyB0aGUgVHlwZVNjcmlwdCBub2RlIG9mZnNldHMuXG4gIHJlc29sdmVkUXVlcmllcy5mb3JFYWNoKChxdWVyaWVzLCBzb3VyY2VGaWxlKSA9PiB7XG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgcXVlcnkgdXNhZ2UgZm9yIGFsbCByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGUgdGhlXG4gICAgLy8gcXVlcnkgZGVmaW5pdGlvbnMgdG8gZXhwbGljaXRseSBkZWNsYXJlIHRoZSBxdWVyeSB0aW1pbmcgKHN0YXRpYyBvciBkeW5hbWljKVxuICAgIHF1ZXJpZXMuZm9yRWFjaChxID0+IHtcbiAgICAgIGNvbnN0IHRpbWluZyA9IGFuYWx5emVOZ1F1ZXJ5VXNhZ2UocSwgY2xhc3NNZXRhZGF0YSwgdHlwZUNoZWNrZXIpO1xuICAgICAgcmVjb3JkUXVlcnlVc2FnZVRyYW5zZm9ybWF0aW9uKHEsIHVwZGF0ZSwgdGltaW5nLCBwcmludGVyLCBzb3VyY2VGaWxlKTtcbiAgICB9KTtcblxuICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHF1ZXJ5IGRlY29yYXRvciBieSBleHBsaWNpdGx5IHNwZWNpZnlpbmcgdGhlIHRpbWluZyBiYXNlZCBvbiB0aGVcbiAqIGRldGVybWluZWQgdGltaW5nLiBUaGUgY2hhbmdlcyB3aWxsIGJlIGFkZGVkIHRvIHRoZSBzcGVjaWZpZWQgdXBkYXRlIHJlY29yZGVyLlxuICovXG5mdW5jdGlvbiByZWNvcmRRdWVyeVVzYWdlVHJhbnNmb3JtYXRpb24oXG4gICAgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCByZWNvcmRlcjogVXBkYXRlUmVjb3JkZXIsIHRpbWluZzogUXVlcnlUaW1pbmcsIHByaW50ZXI6IHRzLlByaW50ZXIsXG4gICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkge1xuICBjb25zdCBxdWVyeUV4cHIgPSBxdWVyeS5kZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uIGFzIHRzLkNhbGxFeHByZXNzaW9uO1xuICBjb25zdCBxdWVyeUFyZ3VtZW50cyA9IHF1ZXJ5RXhwci5hcmd1bWVudHM7XG4gIGNvbnN0IHRpbWluZ1Byb3BlcnR5QXNzaWdubWVudCA9IHRzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChcbiAgICAgICdzdGF0aWMnLCB0aW1pbmcgPT09IFF1ZXJ5VGltaW5nLlNUQVRJQyA/IHRzLmNyZWF0ZVRydWUoKSA6IHRzLmNyZWF0ZUZhbHNlKCkpO1xuICBsZXQgbmV3Q2FsbFRleHQgPSAnJztcblxuICAvLyBJZiB0aGUgcXVlcnkgZGVjb3JhdG9yIGlzIGFscmVhZHkgY2FsbGVkIHdpdGggdHdvIGFyZ3VtZW50cywgd2UgbmVlZCB0b1xuICAvLyBrZWVwIHRoZSBleGlzdGluZyBvcHRpb25zIHVudG91Y2hlZCBhbmQganVzdCBhZGQgdGhlIG5ldyBwcm9wZXJ0eSBpZiBuZWVkZWQuXG4gIGlmIChxdWVyeUFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBjb25zdCBleGlzdGluZ09wdGlvbnMgPSBxdWVyeUFyZ3VtZW50c1sxXSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbjtcblxuICAgIC8vIEluIGNhc2UgdGhlIG9wdGlvbnMgYWxyZWFkeSBjb250YWlucyBhIHByb3BlcnR5IGZvciB0aGUgXCJzdGF0aWNcIiBmbGFnLCB3ZSBqdXN0XG4gICAgLy8gc2tpcCB0aGlzIHF1ZXJ5IGFuZCBsZWF2ZSBpdCB1bnRvdWNoZWQuXG4gICAgaWYgKGV4aXN0aW5nT3B0aW9ucy5wcm9wZXJ0aWVzLnNvbWUoXG4gICAgICAgICAgICBwID0+ICEhcC5uYW1lICYmIGdldFByb3BlcnR5TmFtZVRleHQocC5uYW1lKSA9PT0gJ3N0YXRpYycpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZE9wdGlvbnMgPSB0cy51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICBleGlzdGluZ09wdGlvbnMsIGV4aXN0aW5nT3B0aW9ucy5wcm9wZXJ0aWVzLmNvbmNhdCh0aW1pbmdQcm9wZXJ0eUFzc2lnbm1lbnQpKTtcbiAgICBjb25zdCB1cGRhdGVkQ2FsbCA9IHRzLnVwZGF0ZUNhbGwoXG4gICAgICAgIHF1ZXJ5RXhwciwgcXVlcnlFeHByLmV4cHJlc3Npb24sIHF1ZXJ5RXhwci50eXBlQXJndW1lbnRzLFxuICAgICAgICBbcXVlcnlBcmd1bWVudHNbMF0sIHVwZGF0ZWRPcHRpb25zXSk7XG4gICAgbmV3Q2FsbFRleHQgPSBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgdXBkYXRlZENhbGwsIHNvdXJjZUZpbGUpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG5ld0NhbGwgPSB0cy51cGRhdGVDYWxsKFxuICAgICAgICBxdWVyeUV4cHIsIHF1ZXJ5RXhwci5leHByZXNzaW9uLCBxdWVyeUV4cHIudHlwZUFyZ3VtZW50cyxcbiAgICAgICAgW3F1ZXJ5QXJndW1lbnRzWzBdLCB0cy5jcmVhdGVPYmplY3RMaXRlcmFsKFt0aW1pbmdQcm9wZXJ0eUFzc2lnbm1lbnRdKV0pO1xuICAgIG5ld0NhbGxUZXh0ID0gcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0NhbGwsIHNvdXJjZUZpbGUpO1xuICB9XG5cbiAgcmVjb3JkZXIucmVtb3ZlKHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBxdWVyeUV4cHIuZ2V0V2lkdGgoKSk7XG4gIHJlY29yZGVyLmluc2VydFJpZ2h0KHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBuZXdDYWxsVGV4dCk7XG59XG4iXX0=