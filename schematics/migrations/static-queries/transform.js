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
            if (createTodo) {
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
                text: ' TODO: add static flag '
            }]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBQ2pDLDJGQUF5RTtJQUN6RSxrSEFBMEU7SUFFMUU7OztPQUdHO0lBQ0gsU0FBZ0IsMkJBQTJCLENBQ3ZDLEtBQXdCLEVBQUUsTUFBMEIsRUFBRSxVQUFtQjtRQUUzRSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDbEQsTUFBTSxjQUFjLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUMzQyxNQUFNLHdCQUF3QixHQUFHLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQztZQUM5QyxFQUFFLENBQUMsQ0FBQztZQUNKLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUN4QixRQUFRLEVBQUUsTUFBTSxLQUFLLDhCQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFdkYsMEVBQTBFO1FBQzFFLCtFQUErRTtRQUMvRSxJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQy9CLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQStCLENBQUM7WUFFeEUsaUZBQWlGO1lBQ2pGLDBDQUEwQztZQUMxQyxJQUFJLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUMzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRLENBQUMsRUFBRTtnQkFDbEUsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FDekMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztZQUVsRixJQUFJLFVBQVUsRUFBRTtnQkFDZCx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUMxQztZQUVELE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FDaEIsU0FBUyxFQUFFLFNBQVMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLGFBQWEsRUFDeEQsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztTQUMxQztRQUVELE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRXJFLElBQUksVUFBVSxFQUFFO1lBQ2Qsd0JBQXdCLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDdkM7UUFFRCxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQ2hCLFNBQVMsRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUNsRyxDQUFDO0lBMUNELGtFQTBDQztJQUVEOzs7T0FHRztJQUNILFNBQVMsd0JBQXdCLENBQUMsSUFBYTtRQUM3QyxFQUFFLENBQUMsMkJBQTJCLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ0wsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDUCxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNQLGtCQUFrQixFQUFFLEtBQUs7Z0JBQ3pCLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLHNCQUFzQjtnQkFDMUMsSUFBSSxFQUFFLHlCQUF5QjthQUNoQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb24sIFF1ZXJ5VGltaW5nfSBmcm9tICcuL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbic7XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgZ2l2ZW4gcXVlcnkgZGVjb3JhdG9yIGJ5IGV4cGxpY2l0bHkgc3BlY2lmeWluZyB0aGUgdGltaW5nIGJhc2VkIG9uIHRoZVxuICogZGV0ZXJtaW5lZCB0aW1pbmcuIFRoZSB1cGRhdGVkIGRlY29yYXRvciBjYWxsIGV4cHJlc3Npb24gbm9kZSB3aWxsIGJlIHJldHVybmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByKFxuICAgIHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbiwgdGltaW5nOiBRdWVyeVRpbWluZyB8IG51bGwsIGNyZWF0ZVRvZG86IGJvb2xlYW4pOiB0cy5DYWxsRXhwcmVzc2lvbnxcbiAgICBudWxsIHtcbiAgY29uc3QgcXVlcnlFeHByID0gcXVlcnkuZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcbiAgY29uc3QgcXVlcnlBcmd1bWVudHMgPSBxdWVyeUV4cHIuYXJndW1lbnRzO1xuICBjb25zdCBxdWVyeVByb3BlcnR5QXNzaWdubWVudHMgPSB0aW1pbmcgPT09IG51bGwgP1xuICAgICAgW10gOlxuICAgICAgW3RzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChcbiAgICAgICAgICAnc3RhdGljJywgdGltaW5nID09PSBRdWVyeVRpbWluZy5TVEFUSUMgPyB0cy5jcmVhdGVUcnVlKCkgOiB0cy5jcmVhdGVGYWxzZSgpKV07XG5cbiAgLy8gSWYgdGhlIHF1ZXJ5IGRlY29yYXRvciBpcyBhbHJlYWR5IGNhbGxlZCB3aXRoIHR3byBhcmd1bWVudHMsIHdlIG5lZWQgdG9cbiAgLy8ga2VlcCB0aGUgZXhpc3Rpbmcgb3B0aW9ucyB1bnRvdWNoZWQgYW5kIGp1c3QgYWRkIHRoZSBuZXcgcHJvcGVydHkgaWYgbmVlZGVkLlxuICBpZiAocXVlcnlBcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgY29uc3QgZXhpc3RpbmdPcHRpb25zID0gcXVlcnlBcmd1bWVudHNbMV0gYXMgdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb247XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBvcHRpb25zIGFscmVhZHkgY29udGFpbnMgYSBwcm9wZXJ0eSBmb3IgdGhlIFwic3RhdGljXCIgZmxhZywgd2UganVzdFxuICAgIC8vIHNraXAgdGhpcyBxdWVyeSBhbmQgbGVhdmUgaXQgdW50b3VjaGVkLlxuICAgIGlmIChleGlzdGluZ09wdGlvbnMucHJvcGVydGllcy5zb21lKFxuICAgICAgICAgICAgcCA9PiAhIXAubmFtZSAmJiBnZXRQcm9wZXJ0eU5hbWVUZXh0KHAubmFtZSkgPT09ICdzdGF0aWMnKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZE9wdGlvbnMgPSB0cy51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICBleGlzdGluZ09wdGlvbnMsIGV4aXN0aW5nT3B0aW9ucy5wcm9wZXJ0aWVzLmNvbmNhdChxdWVyeVByb3BlcnR5QXNzaWdubWVudHMpKTtcblxuICAgIGlmIChjcmVhdGVUb2RvKSB7XG4gICAgICBhZGRRdWVyeVRpbWluZ1RvZG9Ub05vZGUodXBkYXRlZE9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiB0cy51cGRhdGVDYWxsKFxuICAgICAgICBxdWVyeUV4cHIsIHF1ZXJ5RXhwci5leHByZXNzaW9uLCBxdWVyeUV4cHIudHlwZUFyZ3VtZW50cyxcbiAgICAgICAgW3F1ZXJ5QXJndW1lbnRzWzBdLCB1cGRhdGVkT3B0aW9uc10pO1xuICB9XG5cbiAgY29uc3Qgb3B0aW9uc05vZGUgPSB0cy5jcmVhdGVPYmplY3RMaXRlcmFsKHF1ZXJ5UHJvcGVydHlBc3NpZ25tZW50cyk7XG5cbiAgaWYgKGNyZWF0ZVRvZG8pIHtcbiAgICBhZGRRdWVyeVRpbWluZ1RvZG9Ub05vZGUob3B0aW9uc05vZGUpO1xuICB9XG5cbiAgcmV0dXJuIHRzLnVwZGF0ZUNhbGwoXG4gICAgICBxdWVyeUV4cHIsIHF1ZXJ5RXhwci5leHByZXNzaW9uLCBxdWVyeUV4cHIudHlwZUFyZ3VtZW50cywgW3F1ZXJ5QXJndW1lbnRzWzBdLCBvcHRpb25zTm9kZV0pO1xufVxuXG4vKipcbiAqIEFkZHMgYSB0by1kbyB0byB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlIHdoaWNoIHJlbWluZHMgZGV2ZWxvcGVycyB0byBzcGVjaWZ5XG4gKiBhbiBleHBsaWNpdCBxdWVyeSB0aW1pbmcuXG4gKi9cbmZ1bmN0aW9uIGFkZFF1ZXJ5VGltaW5nVG9kb1RvTm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gIHRzLnNldFN5bnRoZXRpY0xlYWRpbmdDb21tZW50cyhub2RlLCBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3M6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNUcmFpbGluZ05ld0xpbmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kOiB0cy5TeW50YXhLaW5kLk11bHRpTGluZUNvbW1lbnRUcml2aWEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICcgVE9ETzogYWRkIHN0YXRpYyBmbGFnICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbn1cbiJdfQ==