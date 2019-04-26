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
        define("@angular/core/schematics/migrations/static-queries/transform", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    const TODO_COMMENT = 'TODO: add static flag';
    /**
     * Transforms the given query decorator by explicitly specifying the timing based on the
     * determined timing. The updated decorator call expression node will be returned.
     */
    function getTransformedQueryCallExpr(query, timing, createTodo) {
        const queryExpr = query.decorator.node.expression;
        const queryArguments = queryExpr.arguments;
        const queryPropertyAssignments = timing === null ?
            [] :
            [ts.createPropertyAssignment('static', timing === query_definition_1.QueryTiming.STATIC ? ts.createTrue() : ts.createFalse())];
        // If the query decorator is already called with two arguments, we need to
        // keep the existing options untouched and just add the new property if needed.
        if (queryArguments.length === 2) {
            const existingOptions = queryArguments[1];
            // In case the options already contains a property for the "static" flag, we just
            // skip this query and leave it untouched.
            if (existingOptions.properties.some(p => !!p.name && property_name_1.getPropertyNameText(p.name) === 'static')) {
                return null;
            }
            const updatedOptions = ts.updateObjectLiteral(existingOptions, existingOptions.properties.concat(queryPropertyAssignments));
            // In case we want to add a todo and the options do not have the todo
            // yet, we add the query timing todo as synthetic multi-line comment.
            if (createTodo && !existingOptions.getFullText().includes(TODO_COMMENT)) {
                addQueryTimingTodoToNode(updatedOptions);
            }
            return ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], updatedOptions]);
        }
        const optionsNode = ts.createObjectLiteral(queryPropertyAssignments);
        if (createTodo) {
            addQueryTimingTodoToNode(optionsNode);
        }
        return ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], optionsNode]);
    }
    exports.getTransformedQueryCallExpr = getTransformedQueryCallExpr;
    /**
     * Adds a to-do to the given TypeScript node which reminds developers to specify
     * an explicit query timing.
     */
    function addQueryTimingTodoToNode(node) {
        ts.setSyntheticLeadingComments(node, [{
                pos: -1,
                end: -1,
                hasTrailingNewLine: false,
                kind: ts.SyntaxKind.MultiLineCommentTrivia,
                text: ` ${TODO_COMMENT} `
            }]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBQ2pDLDJGQUF5RTtJQUN6RSxrSEFBMEU7SUFFMUUsTUFBTSxZQUFZLEdBQUcsdUJBQXVCLENBQUM7SUFFN0M7OztPQUdHO0lBQ0gsU0FBZ0IsMkJBQTJCLENBQ3ZDLEtBQXdCLEVBQUUsTUFBMEIsRUFBRSxVQUFtQjtRQUUzRSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDbEQsTUFBTSxjQUFjLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUMzQyxNQUFNLHdCQUF3QixHQUFHLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQztZQUM5QyxFQUFFLENBQUMsQ0FBQztZQUNKLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUN4QixRQUFRLEVBQUUsTUFBTSxLQUFLLDhCQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFdkYsMEVBQTBFO1FBQzFFLCtFQUErRTtRQUMvRSxJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQy9CLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQStCLENBQUM7WUFFeEUsaUZBQWlGO1lBQ2pGLDBDQUEwQztZQUMxQyxJQUFJLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUMzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLENBQUMsRUFBRTtnQkFDbEUsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FDekMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztZQUVsRixxRUFBcUU7WUFDckUscUVBQXFFO1lBQ3JFLElBQUksVUFBVSxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRTtnQkFDdkUsd0JBQXdCLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDMUM7WUFFRCxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQ2hCLFNBQVMsRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxhQUFhLEVBQ3hELENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7U0FDMUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsbUJBQW1CLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUVyRSxJQUFJLFVBQVUsRUFBRTtZQUNkLHdCQUF3QixDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3ZDO1FBRUQsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUNoQixTQUFTLEVBQUUsU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDbEcsQ0FBQztJQTVDRCxrRUE0Q0M7SUFFRDs7O09BR0c7SUFDSCxTQUFTLHdCQUF3QixDQUFDLElBQWE7UUFDN0MsRUFBRSxDQUFDLDJCQUEyQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNMLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ1AsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDUCxrQkFBa0IsRUFBRSxLQUFLO2dCQUN6QixJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxzQkFBc0I7Z0JBQzFDLElBQUksRUFBRSxJQUFJLFlBQVksR0FBRzthQUMxQixDQUFDLENBQUMsQ0FBQztJQUNyQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb24sIFF1ZXJ5VGltaW5nfSBmcm9tICcuL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbic7XG5cbmNvbnN0IFRPRE9fQ09NTUVOVCA9ICdUT0RPOiBhZGQgc3RhdGljIGZsYWcnO1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIGdpdmVuIHF1ZXJ5IGRlY29yYXRvciBieSBleHBsaWNpdGx5IHNwZWNpZnlpbmcgdGhlIHRpbWluZyBiYXNlZCBvbiB0aGVcbiAqIGRldGVybWluZWQgdGltaW5nLiBUaGUgdXBkYXRlZCBkZWNvcmF0b3IgY2FsbCBleHByZXNzaW9uIG5vZGUgd2lsbCBiZSByZXR1cm5lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcihcbiAgICBxdWVyeTogTmdRdWVyeURlZmluaXRpb24sIHRpbWluZzogUXVlcnlUaW1pbmcgfCBudWxsLCBjcmVhdGVUb2RvOiBib29sZWFuKTogdHMuQ2FsbEV4cHJlc3Npb258XG4gICAgbnVsbCB7XG4gIGNvbnN0IHF1ZXJ5RXhwciA9IHF1ZXJ5LmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gIGNvbnN0IHF1ZXJ5QXJndW1lbnRzID0gcXVlcnlFeHByLmFyZ3VtZW50cztcbiAgY29uc3QgcXVlcnlQcm9wZXJ0eUFzc2lnbm1lbnRzID0gdGltaW5nID09PSBudWxsID9cbiAgICAgIFtdIDpcbiAgICAgIFt0cy5jcmVhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoXG4gICAgICAgICAgJ3N0YXRpYycsIHRpbWluZyA9PT0gUXVlcnlUaW1pbmcuU1RBVElDID8gdHMuY3JlYXRlVHJ1ZSgpIDogdHMuY3JlYXRlRmFsc2UoKSldO1xuXG4gIC8vIElmIHRoZSBxdWVyeSBkZWNvcmF0b3IgaXMgYWxyZWFkeSBjYWxsZWQgd2l0aCB0d28gYXJndW1lbnRzLCB3ZSBuZWVkIHRvXG4gIC8vIGtlZXAgdGhlIGV4aXN0aW5nIG9wdGlvbnMgdW50b3VjaGVkIGFuZCBqdXN0IGFkZCB0aGUgbmV3IHByb3BlcnR5IGlmIG5lZWRlZC5cbiAgaWYgKHF1ZXJ5QXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIGNvbnN0IGV4aXN0aW5nT3B0aW9ucyA9IHF1ZXJ5QXJndW1lbnRzWzFdIGFzIHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uO1xuXG4gICAgLy8gSW4gY2FzZSB0aGUgb3B0aW9ucyBhbHJlYWR5IGNvbnRhaW5zIGEgcHJvcGVydHkgZm9yIHRoZSBcInN0YXRpY1wiIGZsYWcsIHdlIGp1c3RcbiAgICAvLyBza2lwIHRoaXMgcXVlcnkgYW5kIGxlYXZlIGl0IHVudG91Y2hlZC5cbiAgICBpZiAoZXhpc3RpbmdPcHRpb25zLnByb3BlcnRpZXMuc29tZShcbiAgICAgICAgICAgIHAgPT4gISFwLm5hbWUgJiYgZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAnc3RhdGljJykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRPcHRpb25zID0gdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgICAgZXhpc3RpbmdPcHRpb25zLCBleGlzdGluZ09wdGlvbnMucHJvcGVydGllcy5jb25jYXQocXVlcnlQcm9wZXJ0eUFzc2lnbm1lbnRzKSk7XG5cbiAgICAvLyBJbiBjYXNlIHdlIHdhbnQgdG8gYWRkIGEgdG9kbyBhbmQgdGhlIG9wdGlvbnMgZG8gbm90IGhhdmUgdGhlIHRvZG9cbiAgICAvLyB5ZXQsIHdlIGFkZCB0aGUgcXVlcnkgdGltaW5nIHRvZG8gYXMgc3ludGhldGljIG11bHRpLWxpbmUgY29tbWVudC5cbiAgICBpZiAoY3JlYXRlVG9kbyAmJiAhZXhpc3RpbmdPcHRpb25zLmdldEZ1bGxUZXh0KCkuaW5jbHVkZXMoVE9ET19DT01NRU5UKSkge1xuICAgICAgYWRkUXVlcnlUaW1pbmdUb2RvVG9Ob2RlKHVwZGF0ZWRPcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHMudXBkYXRlQ2FsbChcbiAgICAgICAgcXVlcnlFeHByLCBxdWVyeUV4cHIuZXhwcmVzc2lvbiwgcXVlcnlFeHByLnR5cGVBcmd1bWVudHMsXG4gICAgICAgIFtxdWVyeUFyZ3VtZW50c1swXSwgdXBkYXRlZE9wdGlvbnNdKTtcbiAgfVxuXG4gIGNvbnN0IG9wdGlvbnNOb2RlID0gdHMuY3JlYXRlT2JqZWN0TGl0ZXJhbChxdWVyeVByb3BlcnR5QXNzaWdubWVudHMpO1xuXG4gIGlmIChjcmVhdGVUb2RvKSB7XG4gICAgYWRkUXVlcnlUaW1pbmdUb2RvVG9Ob2RlKG9wdGlvbnNOb2RlKTtcbiAgfVxuXG4gIHJldHVybiB0cy51cGRhdGVDYWxsKFxuICAgICAgcXVlcnlFeHByLCBxdWVyeUV4cHIuZXhwcmVzc2lvbiwgcXVlcnlFeHByLnR5cGVBcmd1bWVudHMsIFtxdWVyeUFyZ3VtZW50c1swXSwgb3B0aW9uc05vZGVdKTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgdG8tZG8gdG8gdGhlIGdpdmVuIFR5cGVTY3JpcHQgbm9kZSB3aGljaCByZW1pbmRzIGRldmVsb3BlcnMgdG8gc3BlY2lmeVxuICogYW4gZXhwbGljaXQgcXVlcnkgdGltaW5nLlxuICovXG5mdW5jdGlvbiBhZGRRdWVyeVRpbWluZ1RvZG9Ub05vZGUobm9kZTogdHMuTm9kZSkge1xuICB0cy5zZXRTeW50aGV0aWNMZWFkaW5nQ29tbWVudHMobm9kZSwgW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zOiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzVHJhaWxpbmdOZXdMaW5lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2luZDogdHMuU3ludGF4S2luZC5NdWx0aUxpbmVDb21tZW50VHJpdmlhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBgICR7VE9ET19DT01NRU5UfSBgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XSk7XG59XG4iXX0=