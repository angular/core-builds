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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvbWlncmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBR0gsK0JBQWdEO0lBQ2hELGlDQUFpQztJQUVqQyx3SEFBa0U7SUFDbEUsa0hBQWlFO0lBQ2pFLGtIQUEwRTtJQUMxRSwrR0FBK0Q7SUFDL0QscUdBQXdEO0lBRXhEOzs7OztPQUtHO0lBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDeEYsTUFBTSxNQUFNLEdBQUcsNEJBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpELDZFQUE2RTtRQUM3RSwrRUFBK0U7UUFDL0UsOEVBQThFO1FBQzlFLHlFQUF5RTtRQUN6RSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNoRCxDQUFDLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMs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QyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDekMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ25GO2FBQU07WUFDTCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsVUFBVSxDQUN6QixTQUFTLEVBQUUsU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsYUFBYSxFQUN4RCxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdFLFdBQVcsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztTQUMvRTtRQUVELFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzVELFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQzFELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHJlZSwgVXBkYXRlUmVjb3JkZXJ9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmUsIHJlc29sdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7YW5hbHl6ZU5nUXVlcnlVc2FnZX0gZnJvbSAnLi9hbmd1bGFyL2FuYWx5emVfcXVlcnlfdXNhZ2UnO1xuaW1wb3J0IHtOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3J9IGZyb20gJy4vYW5ndWxhci9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb24sIFF1ZXJ5VGltaW5nfSBmcm9tICcuL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbic7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4vdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4vdHlwZXNjcmlwdC90c2NvbmZpZyc7XG5cbi8qKlxuICogUnVucyB0aGUgc3RhdGljIHF1ZXJ5IG1pZ3JhdGlvbiBmb3IgdGhlIGdpdmVuIFR5cGVTY3JpcHQgcHJvamVjdC4gVGhlIHNjaGVtYXRpY1xuICogYW5hbHl6ZXMgYWxsIHF1ZXJpZXMgd2l0aGluIHRoZSBwcm9qZWN0IGFuZCBzZXRzIHVwIHRoZSBxdWVyeSB0aW1pbmcgYmFzZWQgb25cbiAqIHRoZSBjdXJyZW50IHVzYWdlIG9mIHRoZSBxdWVyeSBwcm9wZXJ0eS4gZS5nLiBhIHZpZXcgcXVlcnkgdGhhdCBpcyBub3QgdXNlZCBpbiBhbnlcbiAqIGxpZmVjeWNsZSBob29rIGRvZXMgbm90IG5lZWQgdG8gYmUgc3RhdGljIGFuZCBjYW4gYmUgc2V0IHVwIHdpdGggXCJzdGF0aWM6IGZhbHNlXCIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBob3N0IFwicmVhZEZpbGVcIiBtZXRob2QsIGFzIHdlIHdhbnQgdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuIE90aGVyd2lzZVxuICAvLyBpZiB3ZSBydW4gdGhlIG1pZ3JhdGlvbiBmb3IgbXVsdGlwbGUgdHNjb25maWcgZmlsZXMgd2hpY2ggaGF2ZSBpbnRlcnNlY3RpbmdcbiAgLy8gc291cmNlIGZpbGVzLCBpdCBjYW4gZW5kIHVwIHVwZGF0aW5nIHF1ZXJ5IGRlZmluaXRpb25zIG11bHRpcGxlIHRpbWVzLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgcXVlcnlWaXNpdG9yID0gbmV3IE5nUXVlcnlSZXNvbHZlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHJvb3RTb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0Um9vdEZpbGVOYW1lcygpLm1hcChmID0+IHByb2dyYW0uZ2V0U291cmNlRmlsZShmKSAhKTtcbiAgY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgcXVlcmllcyBhbmQgY2xhc3MgcmVsYXRpb25zLlxuICByb290U291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHF1ZXJ5VmlzaXRvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtyZXNvbHZlZFF1ZXJpZXMsIGNsYXNzTWV0YWRhdGF9ID0gcXVlcnlWaXNpdG9yO1xuXG4gIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIHRoYXQgY29udGFpbiByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGVcbiAgLy8gdGhlIHNvdXJjZSBmaWxlcyBpZiBuZWVkZWQuIE5vdGUgdGhhdCB3ZSBuZWVkIHRvIHVwZGF0ZSBtdWx0aXBsZSBxdWVyaWVzXG4gIC8vIHdpdGhpbiBhIHNvdXJjZSBmaWxlIHdpdGhpbiB0aGUgc2FtZSByZWNvcmRlciBpbiBvcmRlciB0byBub3QgdGhyb3cgb2ZmXG4gIC8vIHRoZSBUeXBlU2NyaXB0IG5vZGUgb2Zmc2V0cy5cbiAgcmVzb2x2ZWRRdWVyaWVzLmZvckVhY2goKHF1ZXJpZXMsIHNvdXJjZUZpbGUpID0+IHtcbiAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG5cbiAgICAvLyBDb21wdXRlIHRoZSBxdWVyeSB1c2FnZSBmb3IgYWxsIHJlc29sdmVkIHF1ZXJpZXMgYW5kIHVwZGF0ZSB0aGVcbiAgICAvLyBxdWVyeSBkZWZpbml0aW9ucyB0byBleHBsaWNpdGx5IGRlY2xhcmUgdGhlIHF1ZXJ5IHRpbWluZyAoc3RhdGljIG9yIGR5bmFtaWMpXG4gICAgcXVlcmllcy5mb3JFYWNoKHEgPT4ge1xuICAgICAgY29uc3QgdGltaW5nID0gYW5hbHl6ZU5nUXVlcnlVc2FnZShxLCBjbGFzc01ldGFkYXRhLCB0eXBlQ2hlY2tlcik7XG4gICAgICByZWNvcmRRdWVyeVVzYWdlVHJhbnNmb3JtYXRpb24ocSwgdXBkYXRlLCB0aW1pbmcsIHByaW50ZXIsIHNvdXJjZUZpbGUpO1xuICAgIH0pO1xuXG4gICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlKTtcbiAgfSk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgcXVlcnkgZGVjb3JhdG9yIGJ5IGV4cGxpY2l0bHkgc3BlY2lmeWluZyB0aGUgdGltaW5nIGJhc2VkIG9uIHRoZVxuICogZGV0ZXJtaW5lZCB0aW1pbmcuIFRoZSBjaGFuZ2VzIHdpbGwgYmUgYWRkZWQgdG8gdGhlIHNwZWNpZmllZCB1cGRhdGUgcmVjb3JkZXIuXG4gKi9cbmZ1bmN0aW9uIHJlY29yZFF1ZXJ5VXNhZ2VUcmFuc2Zvcm1hdGlvbihcbiAgICBxdWVyeTogTmdRdWVyeURlZmluaXRpb24sIHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlciwgdGltaW5nOiBRdWVyeVRpbWluZywgcHJpbnRlcjogdHMuUHJpbnRlcixcbiAgICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKSB7XG4gIGNvbnN0IHF1ZXJ5RXhwciA9IHF1ZXJ5LmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb24gYXMgdHMuQ2FsbEV4cHJlc3Npb247XG4gIGNvbnN0IHF1ZXJ5QXJndW1lbnRzID0gcXVlcnlFeHByLmFyZ3VtZW50cztcbiAgY29uc3QgdGltaW5nUHJvcGVydHlBc3NpZ25tZW50ID0gdHMuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KFxuICAgICAgJ3N0YXRpYycsIHRpbWluZyA9PT0gUXVlcnlUaW1pbmcuU1RBVElDID8gdHMuY3JlYXRlVHJ1ZSgpIDogdHMuY3JlYXRlRmFsc2UoKSk7XG4gIGxldCBuZXdDYWxsVGV4dCA9ICcnO1xuXG4gIC8vIElmIHRoZSBxdWVyeSBkZWNvcmF0b3IgaXMgYWxyZWFkeSBjYWxsZWQgd2l0aCB0d28gYXJndW1lbnRzLCB3ZSBuZWVkIHRvXG4gIC8vIGtlZXAgdGhlIGV4aXN0aW5nIG9wdGlvbnMgdW50b3VjaGVkIGFuZCBqdXN0IGFkZCB0aGUgbmV3IHByb3BlcnR5IGlmIG5lZWRlZC5cbiAgaWYgKHF1ZXJ5QXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIGNvbnN0IGV4aXN0aW5nT3B0aW9ucyA9IHF1ZXJ5QXJndW1lbnRzWzFdIGFzIHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uO1xuXG4gICAgLy8gSW4gY2FzZSB0aGUgb3B0aW9ucyBhbHJlYWR5IGNvbnRhaW5zIGEgcHJvcGVydHkgZm9yIHRoZSBcInN0YXRpY1wiIGZsYWcsIHdlIGp1c3RcbiAgICAvLyBza2lwIHRoaXMgcXVlcnkgYW5kIGxlYXZlIGl0IHVudG91Y2hlZC5cbiAgICBpZiAoZXhpc3RpbmdPcHRpb25zLnByb3BlcnRpZXMuc29tZShcbiAgICAgICAgICAgIHAgPT4gISFwLm5hbWUgJiYgZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAnc3RhdGljJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVkT3B0aW9ucyA9IHRzLnVwZGF0ZU9iamVjdExpdGVyYWwoXG4gICAgICAgIGV4aXN0aW5nT3B0aW9ucywgZXhpc3RpbmdPcHRpb25zLnByb3BlcnRpZXMuY29uY2F0KHRpbWluZ1Byb3BlcnR5QXNzaWdubWVudCkpO1xuICAgIGNvbnN0IHVwZGF0ZWRDYWxsID0gdHMudXBkYXRlQ2FsbChcbiAgICAgICAgcXVlcnlFeHByLCBxdWVyeUV4cHIuZXhwcmVzc2lvbiwgcXVlcnlFeHByLnR5cGVBcmd1bWVudHMsXG4gICAgICAgIFtxdWVyeUFyZ3VtZW50c1swXSwgdXBkYXRlZE9wdGlvbnNdKTtcbiAgICBuZXdDYWxsVGV4dCA9IHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCB1cGRhdGVkQ2FsbCwgc291cmNlRmlsZSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbmV3Q2FsbCA9IHRzLnVwZGF0ZUNhbGwoXG4gICAgICAgIHF1ZXJ5RXhwciwgcXVlcnlFeHByLmV4cHJlc3Npb24sIHF1ZXJ5RXhwci50eXBlQXJndW1lbnRzLFxuICAgICAgICBbcXVlcnlBcmd1bWVudHNbMF0sIHRzLmNyZWF0ZU9iamVjdExpdGVyYWwoW3RpbWluZ1Byb3BlcnR5QXNzaWdubWVudF0pXSk7XG4gICAgbmV3Q2FsbFRleHQgPSBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3Q2FsbCwgc291cmNlRmlsZSk7XG4gIH1cblxuICByZWNvcmRlci5yZW1vdmUocXVlcnlFeHByLmdldFN0YXJ0KCksIHF1ZXJ5RXhwci5nZXRXaWR0aCgpKTtcbiAgcmVjb3JkZXIuaW5zZXJ0UmlnaHQocXVlcnlFeHByLmdldFN0YXJ0KCksIG5ld0NhbGxUZXh0KTtcbn1cbiJdfQ==