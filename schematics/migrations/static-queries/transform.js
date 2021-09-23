/**
 * @license
 * Copyright Google LLC All Rights Reserved.
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
    exports.getTransformedQueryCallExpr = void 0;
    const ts = require("typescript");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    const TODO_SPECIFY_COMMENT = 'TODO: add static flag';
    const TODO_CHECK_COMMENT = 'TODO: check static flag';
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
        // keep the existing options untouched and just add the new property if possible.
        if (queryArguments.length === 2) {
            const existingOptions = queryArguments[1];
            const existingOptionsText = existingOptions.getFullText();
            const hasTodoComment = existingOptionsText.includes(TODO_SPECIFY_COMMENT) ||
                existingOptionsText.includes(TODO_CHECK_COMMENT);
            let newOptionsNode;
            let failureMessage = null;
            if (ts.isObjectLiteralExpression(existingOptions)) {
                // In case the options already contains a property for the "static" flag,
                // we just skip this query and leave it untouched.
                if (existingOptions.properties.some(p => !!p.name && (0, property_name_1.getPropertyNameText)(p.name) === 'static')) {
                    return null;
                }
                newOptionsNode = ts.updateObjectLiteral(existingOptions, existingOptions.properties.concat(queryPropertyAssignments));
                // In case we want to add a todo and the options do not have the todo
                // yet, we add the query timing todo as synthetic multi-line comment.
                if (createTodo && !hasTodoComment) {
                    addQueryTimingTodoToNode(newOptionsNode, timing === null);
                }
            }
            else {
                // In case the options query parameter is not an object literal expression, and
                // we want to set the query timing, we just preserve the existing query parameter.
                newOptionsNode = existingOptions;
                // We always want to add a TODO in case the query options cannot be updated.
                if (!hasTodoComment) {
                    addQueryTimingTodoToNode(existingOptions, true);
                }
                // If there is a new explicit timing that has been determined for the given query,
                // we create a transformation failure message that shows developers that they need
                // to set the query timing manually to the determined query timing.
                if (timing !== null) {
                    failureMessage = 'Cannot update query to set explicit timing. Please manually ' +
                        `set the query timing to: "{static: ${(timing === query_definition_1.QueryTiming.STATIC).toString()}}"`;
                }
            }
            return {
                failureMessage,
                node: ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], newOptionsNode])
            };
        }
        const optionsNode = ts.createObjectLiteral(queryPropertyAssignments);
        if (createTodo) {
            addQueryTimingTodoToNode(optionsNode, timing === null);
        }
        return {
            failureMessage: null,
            node: ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], optionsNode])
        };
    }
    exports.getTransformedQueryCallExpr = getTransformedQueryCallExpr;
    /**
     * Adds a to-do to the given TypeScript node which reminds developers to specify
     * an explicit query timing or to double-check the updated timing.
     */
    function addQueryTimingTodoToNode(node, addSpecifyTimingTodo) {
        ts.setSyntheticLeadingComments(node, [{
                pos: -1,
                end: -1,
                hasTrailingNewLine: false,
                kind: ts.SyntaxKind.MultiLineCommentTrivia,
                text: ` ${addSpecifyTimingTodo ? TODO_SPECIFY_COMMENT : TODO_CHECK_COMMENT} `
            }]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQywyRkFBeUU7SUFDekUsa0hBQTBFO0lBUzFFLE1BQU0sb0JBQW9CLEdBQUcsdUJBQXVCLENBQUM7SUFDckQsTUFBTSxrQkFBa0IsR0FBRyx5QkFBeUIsQ0FBQztJQUVyRDs7O09BR0c7SUFDSCxTQUFnQiwyQkFBMkIsQ0FDdkMsS0FBd0IsRUFBRSxNQUF3QixFQUNsRCxVQUFtQjtRQUNyQixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDbEQsTUFBTSxjQUFjLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUMzQyxNQUFNLHdCQUF3QixHQUFHLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQztZQUM5QyxFQUFFLENBQUMsQ0FBQztZQUNKLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUN4QixRQUFRLEVBQUUsTUFBTSxLQUFLLDhCQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFdkYsMEVBQTBFO1FBQzFFLGlGQUFpRjtRQUNqRixJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQy9CLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLG1CQUFtQixHQUFHLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxRCxNQUFNLGNBQWMsR0FBRyxtQkFBbUIsQ0FBQyxRQUFR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ZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmd9IGZyb20gJy4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcblxuZXhwb3J0IHR5cGUgVHJhbnNmb3JtZWRRdWVyeVJlc3VsdCA9IG51bGx8e1xuICAvKiogVHJhbnNmb3JtZWQgY2FsbCBleHByZXNzaW9uLiAqL1xuICBub2RlOiB0cy5DYWxsRXhwcmVzc2lvbjtcbiAgLyoqIEZhaWx1cmUgbWVzc2FnZSB3aGljaCBpcyBzZXQgd2hlbiB0aGUgcXVlcnkgY291bGQgbm90IGJlIHRyYW5zZm9ybWVkIHN1Y2Nlc3NmdWxseS4gKi9cbiAgZmFpbHVyZU1lc3NhZ2U6IHN0cmluZ3xudWxsO1xufTtcblxuY29uc3QgVE9ET19TUEVDSUZZX0NPTU1FTlQgPSAnVE9ETzogYWRkIHN0YXRpYyBmbGFnJztcbmNvbnN0IFRPRE9fQ0hFQ0tfQ09NTUVOVCA9ICdUT0RPOiBjaGVjayBzdGF0aWMgZmxhZyc7XG5cbi8qKlxuICogVHJhbnNmb3JtcyB0aGUgZ2l2ZW4gcXVlcnkgZGVjb3JhdG9yIGJ5IGV4cGxpY2l0bHkgc3BlY2lmeWluZyB0aGUgdGltaW5nIGJhc2VkIG9uIHRoZVxuICogZGV0ZXJtaW5lZCB0aW1pbmcuIFRoZSB1cGRhdGVkIGRlY29yYXRvciBjYWxsIGV4cHJlc3Npb24gbm9kZSB3aWxsIGJlIHJldHVybmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByKFxuICAgIHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbiwgdGltaW5nOiBRdWVyeVRpbWluZ3xudWxsLFxuICAgIGNyZWF0ZVRvZG86IGJvb2xlYW4pOiBUcmFuc2Zvcm1lZFF1ZXJ5UmVzdWx0IHtcbiAgY29uc3QgcXVlcnlFeHByID0gcXVlcnkuZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcbiAgY29uc3QgcXVlcnlBcmd1bWVudHMgPSBxdWVyeUV4cHIuYXJndW1lbnRzO1xuICBjb25zdCBxdWVyeVByb3BlcnR5QXNzaWdubWVudHMgPSB0aW1pbmcgPT09IG51bGwgP1xuICAgICAgW10gOlxuICAgICAgW3RzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChcbiAgICAgICAgICAnc3RhdGljJywgdGltaW5nID09PSBRdWVyeVRpbWluZy5TVEFUSUMgPyB0cy5jcmVhdGVUcnVlKCkgOiB0cy5jcmVhdGVGYWxzZSgpKV07XG5cbiAgLy8gSWYgdGhlIHF1ZXJ5IGRlY29yYXRvciBpcyBhbHJlYWR5IGNhbGxlZCB3aXRoIHR3byBhcmd1bWVudHMsIHdlIG5lZWQgdG9cbiAgLy8ga2VlcCB0aGUgZXhpc3Rpbmcgb3B0aW9ucyB1bnRvdWNoZWQgYW5kIGp1c3QgYWRkIHRoZSBuZXcgcHJvcGVydHkgaWYgcG9zc2libGUuXG4gIGlmIChxdWVyeUFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBjb25zdCBleGlzdGluZ09wdGlvbnMgPSBxdWVyeUFyZ3VtZW50c1sxXTtcbiAgICBjb25zdCBleGlzdGluZ09wdGlvbnNUZXh0ID0gZXhpc3RpbmdPcHRpb25zLmdldEZ1bGxUZXh0KCk7XG4gICAgY29uc3QgaGFzVG9kb0NvbW1lbnQgPSBleGlzdGluZ09wdGlvbnNUZXh0LmluY2x1ZGVzKFRPRE9fU1BFQ0lGWV9DT01NRU5UKSB8fFxuICAgICAgICBleGlzdGluZ09wdGlvbnNUZXh0LmluY2x1ZGVzKFRPRE9fQ0hFQ0tfQ09NTUVOVCk7XG4gICAgbGV0IG5ld09wdGlvbnNOb2RlOiB0cy5FeHByZXNzaW9uO1xuICAgIGxldCBmYWlsdXJlTWVzc2FnZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oZXhpc3RpbmdPcHRpb25zKSkge1xuICAgICAgLy8gSW4gY2FzZSB0aGUgb3B0aW9ucyBhbHJlYWR5IGNvbnRhaW5zIGEgcHJvcGVydHkgZm9yIHRoZSBcInN0YXRpY1wiIGZsYWcsXG4gICAgICAvLyB3ZSBqdXN0IHNraXAgdGhpcyBxdWVyeSBhbmQgbGVhdmUgaXQgdW50b3VjaGVkLlxuICAgICAgaWYgKGV4aXN0aW5nT3B0aW9ucy5wcm9wZXJ0aWVzLnNvbWUoXG4gICAgICAgICAgICAgIHAgPT4gISFwLm5hbWUgJiYgZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAnc3RhdGljJykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIG5ld09wdGlvbnNOb2RlID0gdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgICAgICBleGlzdGluZ09wdGlvbnMsIGV4aXN0aW5nT3B0aW9ucy5wcm9wZXJ0aWVzLmNvbmNhdChxdWVyeVByb3BlcnR5QXNzaWdubWVudHMpKTtcblxuICAgICAgLy8gSW4gY2FzZSB3ZSB3YW50IHRvIGFkZCBhIHRvZG8gYW5kIHRoZSBvcHRpb25zIGRvIG5vdCBoYXZlIHRoZSB0b2RvXG4gICAgICAvLyB5ZXQsIHdlIGFkZCB0aGUgcXVlcnkgdGltaW5nIHRvZG8gYXMgc3ludGhldGljIG11bHRpLWxpbmUgY29tbWVudC5cbiAgICAgIGlmIChjcmVhdGVUb2RvICYmICFoYXNUb2RvQ29tbWVudCkge1xuICAgICAgICBhZGRRdWVyeVRpbWluZ1RvZG9Ub05vZGUobmV3T3B0aW9uc05vZGUsIHRpbWluZyA9PT0gbnVsbCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEluIGNhc2UgdGhlIG9wdGlvbnMgcXVlcnkgcGFyYW1ldGVyIGlzIG5vdCBhbiBvYmplY3QgbGl0ZXJhbCBleHByZXNzaW9uLCBhbmRcbiAgICAgIC8vIHdlIHdhbnQgdG8gc2V0IHRoZSBxdWVyeSB0aW1pbmcsIHdlIGp1c3QgcHJlc2VydmUgdGhlIGV4aXN0aW5nIHF1ZXJ5IHBhcmFtZXRlci5cbiAgICAgIG5ld09wdGlvbnNOb2RlID0gZXhpc3RpbmdPcHRpb25zO1xuICAgICAgLy8gV2UgYWx3YXlzIHdhbnQgdG8gYWRkIGEgVE9ETyBpbiBjYXNlIHRoZSBxdWVyeSBvcHRpb25zIGNhbm5vdCBiZSB1cGRhdGVkLlxuICAgICAgaWYgKCFoYXNUb2RvQ29tbWVudCkge1xuICAgICAgICBhZGRRdWVyeVRpbWluZ1RvZG9Ub05vZGUoZXhpc3RpbmdPcHRpb25zLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgbmV3IGV4cGxpY2l0IHRpbWluZyB0aGF0IGhhcyBiZWVuIGRldGVybWluZWQgZm9yIHRoZSBnaXZlbiBxdWVyeSxcbiAgICAgIC8vIHdlIGNyZWF0ZSBhIHRyYW5zZm9ybWF0aW9uIGZhaWx1cmUgbWVzc2FnZSB0aGF0IHNob3dzIGRldmVsb3BlcnMgdGhhdCB0aGV5IG5lZWRcbiAgICAgIC8vIHRvIHNldCB0aGUgcXVlcnkgdGltaW5nIG1hbnVhbGx5IHRvIHRoZSBkZXRlcm1pbmVkIHF1ZXJ5IHRpbWluZy5cbiAgICAgIGlmICh0aW1pbmcgIT09IG51bGwpIHtcbiAgICAgICAgZmFpbHVyZU1lc3NhZ2UgPSAnQ2Fubm90IHVwZGF0ZSBxdWVyeSB0byBzZXQgZXhwbGljaXQgdGltaW5nLiBQbGVhc2UgbWFudWFsbHkgJyArXG4gICAgICAgICAgICBgc2V0IHRoZSBxdWVyeSB0aW1pbmcgdG86IFwie3N0YXRpYzogJHsodGltaW5nID09PSBRdWVyeVRpbWluZy5TVEFUSUMpLnRvU3RyaW5nKCl9fVwiYDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmFpbHVyZU1lc3NhZ2UsXG4gICAgICBub2RlOiB0cy51cGRhdGVDYWxsKFxuICAgICAgICAgIHF1ZXJ5RXhwciwgcXVlcnlFeHByLmV4cHJlc3Npb24sIHF1ZXJ5RXhwci50eXBlQXJndW1lbnRzLFxuICAgICAgICAgIFtxdWVyeUFyZ3VtZW50c1swXSwgbmV3T3B0aW9uc05vZGUhXSlcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qgb3B0aW9uc05vZGUgPSB0cy5jcmVhdGVPYmplY3RMaXRlcmFsKHF1ZXJ5UHJvcGVydHlBc3NpZ25tZW50cyk7XG5cbiAgaWYgKGNyZWF0ZVRvZG8pIHtcbiAgICBhZGRRdWVyeVRpbWluZ1RvZG9Ub05vZGUob3B0aW9uc05vZGUsIHRpbWluZyA9PT0gbnVsbCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGZhaWx1cmVNZXNzYWdlOiBudWxsLFxuICAgIG5vZGU6IHRzLnVwZGF0ZUNhbGwoXG4gICAgICAgIHF1ZXJ5RXhwciwgcXVlcnlFeHByLmV4cHJlc3Npb24sIHF1ZXJ5RXhwci50eXBlQXJndW1lbnRzLCBbcXVlcnlBcmd1bWVudHNbMF0sIG9wdGlvbnNOb2RlXSlcbiAgfTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgdG8tZG8gdG8gdGhlIGdpdmVuIFR5cGVTY3JpcHQgbm9kZSB3aGljaCByZW1pbmRzIGRldmVsb3BlcnMgdG8gc3BlY2lmeVxuICogYW4gZXhwbGljaXQgcXVlcnkgdGltaW5nIG9yIHRvIGRvdWJsZS1jaGVjayB0aGUgdXBkYXRlZCB0aW1pbmcuXG4gKi9cbmZ1bmN0aW9uIGFkZFF1ZXJ5VGltaW5nVG9kb1RvTm9kZShub2RlOiB0cy5Ob2RlLCBhZGRTcGVjaWZ5VGltaW5nVG9kbzogYm9vbGVhbikge1xuICB0cy5zZXRTeW50aGV0aWNMZWFkaW5nQ29tbWVudHMoXG4gICAgICBub2RlLCBbe1xuICAgICAgICBwb3M6IC0xLFxuICAgICAgICBlbmQ6IC0xLFxuICAgICAgICBoYXNUcmFpbGluZ05ld0xpbmU6IGZhbHNlLFxuICAgICAgICBraW5kOiB0cy5TeW50YXhLaW5kLk11bHRpTGluZUNvbW1lbnRUcml2aWEsXG4gICAgICAgIHRleHQ6IGAgJHthZGRTcGVjaWZ5VGltaW5nVG9kbyA/IFRPRE9fU1BFQ0lGWV9DT01NRU5UIDogVE9ET19DSEVDS19DT01NRU5UfSBgXG4gICAgICB9XSk7XG59XG4iXX0=