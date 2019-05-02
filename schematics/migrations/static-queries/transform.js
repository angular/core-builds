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
        // keep the existing options untouched and just add the new property if possible.
        if (queryArguments.length === 2) {
            const existingOptions = queryArguments[1];
            const hasTodoComment = existingOptions.getFullText().includes(TODO_COMMENT);
            let newOptionsNode;
            let failureMessage = null;
            if (ts.isObjectLiteralExpression(existingOptions)) {
                // In case the options already contains a property for the "static" flag,
                // we just skip this query and leave it untouched.
                if (existingOptions.properties.some(p => !!p.name && property_name_1.getPropertyNameText(p.name) === 'static')) {
                    return null;
                }
                newOptionsNode = ts.updateObjectLiteral(existingOptions, existingOptions.properties.concat(queryPropertyAssignments));
                // In case we want to add a todo and the options do not have the todo
                // yet, we add the query timing todo as synthetic multi-line comment.
                if (createTodo && !hasTodoComment) {
                    addQueryTimingTodoToNode(newOptionsNode);
                }
            }
            else {
                // In case the options query parameter is not an object literal expression, and
                // we want to set the query timing, we just preserve the existing query parameter.
                newOptionsNode = existingOptions;
                // We always want to add a TODO in case the query options cannot be updated.
                if (!hasTodoComment) {
                    addQueryTimingTodoToNode(existingOptions);
                }
                // If there is a new explicit timing that has been determined for the given query,
                // we create a transformation failure message that shows developers that they need
                // to set the query timing manually to the determined query timing.
                if (timing !== null) {
                    failureMessage = 'Cannot update query declaration to explicit timing. Please manually ' +
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
            addQueryTimingTodoToNode(optionsNode);
        }
        return {
            failureMessage: null,
            node: ts.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], optionsNode])
        };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBQ2pDLDJGQUF5RTtJQUN6RSxrSEFBMEU7SUFTMUUsTUFBTSxZQUFZLEdBQUcsdUJBQXVCLENBQUM7SUFFN0M7OztPQUdHO0lBQ0gsU0FBZ0IsMkJBQTJCLENBQ3ZDLEtBQXdCLEVBQUUsTUFBMEIsRUFDcEQsVUFBbUI7UUFDckIsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ2xELE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7UUFDM0MsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDOUMsRUFBRSxDQUFDLENBQUM7WUFDSixDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FDeEIsUUFBUSxFQUFFLE1BQU0sS0FBSyw4QkFBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXZGLDBFQUEwRTtRQUMxRSxpRkFBaUY7UUFDakYsSUFBSSxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUMvQixNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUMsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM1RSxJQUFJLGNBQTZCLENBQUM7WUFDbEMsSUFBSSxjQUFjLEdBQWdCLElBQUksQ0FBQztZQUV2QyxJQUFJLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsRUFBRTtnQkFDakQseUVBQXlFO2dCQUN6RSxrREFBa0Q7Z0JBQ2xELElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQzNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksbUNBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLFFBQVEsQ0FBQyxFQUFFO29CQUNsRSxPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFFRCxjQUFjLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixDQUNuQyxlQUFlLEVBQUUsZUFBZSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO2dCQUVsRixxRUFBcUU7Z0JBQ3JFLHFFQUFxRTtnQkFDckUsSUFBSSxVQUFVLElBQUksQ0FBQyxjQUFjLEVBQUU7b0JBQ2pDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxDQUFDO2lCQUMxQzthQUNGO2lCQUFNO2dCQUNMLCtFQUErRTtnQkFDL0Usa0ZBQWtGO2dCQUNsRixjQUFjLEdBQUcsZUFBZSxDQUFDO2dCQUNqQyw0RUFBNEU7Z0JBQzVFLElBQUksQ0FBQyxjQUFjLEVBQUU7b0JBQ25CLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDO2lCQUMzQztnQkFDRCxrRkFBa0Y7Z0JBQ2xGLGtGQUFrRjtnQkFDbEYsbUVBQW1FO2dCQUNuRSxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7b0JBQ25CLGNBQWMsR0FBRyxzRUFBc0U7d0JBQ25GLHNDQUFzQyxDQUFDLE1BQU0sS0FBSyw4QkFBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUM7aUJBQzFGO2FBQ0Y7WUFFRCxPQUFPO2dCQUNMLGNBQWM7Z0JBQ2QsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQ2YsU0FBUyxFQUFFLFNBQVMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLGFBQWEsRUFDeEQsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBZ0IsQ0FBQyxDQUFDO2FBQzNDLENBQUM7U0FDSDtRQUVELE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRXJFLElBQUksVUFBVSxFQUFFO1lBQ2Qsd0JBQXdCLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDdkM7UUFFRCxPQUFPO1lBQ0wsY0FBYyxFQUFFLElBQUk7WUFDcEIsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQ2YsU0FBUyxFQUFFLFNBQVMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLGFBQWEsRUFDeEQsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDdEMsQ0FBQztJQUNKLENBQUM7SUF2RUQsa0VBdUVDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUyx3QkFBd0IsQ0FBQyxJQUFhO1FBQzdDLEVBQUUsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDTCxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNQLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ1Asa0JBQWtCLEVBQUUsS0FBSztnQkFDekIsSUFBSSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsc0JBQXNCO2dCQUMxQyxJQUFJLEVBQUUsSUFBSSxZQUFZLEdBQUc7YUFDMUIsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5pbXBvcnQge05nUXVlcnlEZWZpbml0aW9uLCBRdWVyeVRpbWluZ30gZnJvbSAnLi9hbmd1bGFyL3F1ZXJ5LWRlZmluaXRpb24nO1xuXG5leHBvcnQgdHlwZSBUcmFuc2Zvcm1lZFF1ZXJ5UmVzdWx0ID0gbnVsbCB8IHtcbiAgLyoqIFRyYW5zZm9ybWVkIGNhbGwgZXhwcmVzc2lvbi4gKi9cbiAgbm9kZTogdHMuQ2FsbEV4cHJlc3Npb247XG4gIC8qKiBGYWlsdXJlIG1lc3NhZ2Ugd2hpY2ggaXMgc2V0IHdoZW4gdGhlIHF1ZXJ5IGNvdWxkIG5vdCBiZSB0cmFuc2Zvcm1lZCBzdWNjZXNzZnVsbHkuICovXG4gIGZhaWx1cmVNZXNzYWdlOiBzdHJpbmd8bnVsbDtcbn07XG5cbmNvbnN0IFRPRE9fQ09NTUVOVCA9ICdUT0RPOiBhZGQgc3RhdGljIGZsYWcnO1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIGdpdmVuIHF1ZXJ5IGRlY29yYXRvciBieSBleHBsaWNpdGx5IHNwZWNpZnlpbmcgdGhlIHRpbWluZyBiYXNlZCBvbiB0aGVcbiAqIGRldGVybWluZWQgdGltaW5nLiBUaGUgdXBkYXRlZCBkZWNvcmF0b3IgY2FsbCBleHByZXNzaW9uIG5vZGUgd2lsbCBiZSByZXR1cm5lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcihcbiAgICBxdWVyeTogTmdRdWVyeURlZmluaXRpb24sIHRpbWluZzogUXVlcnlUaW1pbmcgfCBudWxsLFxuICAgIGNyZWF0ZVRvZG86IGJvb2xlYW4pOiBUcmFuc2Zvcm1lZFF1ZXJ5UmVzdWx0IHtcbiAgY29uc3QgcXVlcnlFeHByID0gcXVlcnkuZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcbiAgY29uc3QgcXVlcnlBcmd1bWVudHMgPSBxdWVyeUV4cHIuYXJndW1lbnRzO1xuICBjb25zdCBxdWVyeVByb3BlcnR5QXNzaWdubWVudHMgPSB0aW1pbmcgPT09IG51bGwgP1xuICAgICAgW10gOlxuICAgICAgW3RzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChcbiAgICAgICAgICAnc3RhdGljJywgdGltaW5nID09PSBRdWVyeVRpbWluZy5TVEFUSUMgPyB0cy5jcmVhdGVUcnVlKCkgOiB0cy5jcmVhdGVGYWxzZSgpKV07XG5cbiAgLy8gSWYgdGhlIHF1ZXJ5IGRlY29yYXRvciBpcyBhbHJlYWR5IGNhbGxlZCB3aXRoIHR3byBhcmd1bWVudHMsIHdlIG5lZWQgdG9cbiAgLy8ga2VlcCB0aGUgZXhpc3Rpbmcgb3B0aW9ucyB1bnRvdWNoZWQgYW5kIGp1c3QgYWRkIHRoZSBuZXcgcHJvcGVydHkgaWYgcG9zc2libGUuXG4gIGlmIChxdWVyeUFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBjb25zdCBleGlzdGluZ09wdGlvbnMgPSBxdWVyeUFyZ3VtZW50c1sxXTtcbiAgICBjb25zdCBoYXNUb2RvQ29tbWVudCA9IGV4aXN0aW5nT3B0aW9ucy5nZXRGdWxsVGV4dCgpLmluY2x1ZGVzKFRPRE9fQ09NTUVOVCk7XG4gICAgbGV0IG5ld09wdGlvbnNOb2RlOiB0cy5FeHByZXNzaW9uO1xuICAgIGxldCBmYWlsdXJlTWVzc2FnZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oZXhpc3RpbmdPcHRpb25zKSkge1xuICAgICAgLy8gSW4gY2FzZSB0aGUgb3B0aW9ucyBhbHJlYWR5IGNvbnRhaW5zIGEgcHJvcGVydHkgZm9yIHRoZSBcInN0YXRpY1wiIGZsYWcsXG4gICAgICAvLyB3ZSBqdXN0IHNraXAgdGhpcyBxdWVyeSBhbmQgbGVhdmUgaXQgdW50b3VjaGVkLlxuICAgICAgaWYgKGV4aXN0aW5nT3B0aW9ucy5wcm9wZXJ0aWVzLnNvbWUoXG4gICAgICAgICAgICAgIHAgPT4gISFwLm5hbWUgJiYgZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAnc3RhdGljJykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIG5ld09wdGlvbnNOb2RlID0gdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgICAgICBleGlzdGluZ09wdGlvbnMsIGV4aXN0aW5nT3B0aW9ucy5wcm9wZXJ0aWVzLmNvbmNhdChxdWVyeVByb3BlcnR5QXNzaWdubWVudHMpKTtcblxuICAgICAgLy8gSW4gY2FzZSB3ZSB3YW50IHRvIGFkZCBhIHRvZG8gYW5kIHRoZSBvcHRpb25zIGRvIG5vdCBoYXZlIHRoZSB0b2RvXG4gICAgICAvLyB5ZXQsIHdlIGFkZCB0aGUgcXVlcnkgdGltaW5nIHRvZG8gYXMgc3ludGhldGljIG11bHRpLWxpbmUgY29tbWVudC5cbiAgICAgIGlmIChjcmVhdGVUb2RvICYmICFoYXNUb2RvQ29tbWVudCkge1xuICAgICAgICBhZGRRdWVyeVRpbWluZ1RvZG9Ub05vZGUobmV3T3B0aW9uc05vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJbiBjYXNlIHRoZSBvcHRpb25zIHF1ZXJ5IHBhcmFtZXRlciBpcyBub3QgYW4gb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbiwgYW5kXG4gICAgICAvLyB3ZSB3YW50IHRvIHNldCB0aGUgcXVlcnkgdGltaW5nLCB3ZSBqdXN0IHByZXNlcnZlIHRoZSBleGlzdGluZyBxdWVyeSBwYXJhbWV0ZXIuXG4gICAgICBuZXdPcHRpb25zTm9kZSA9IGV4aXN0aW5nT3B0aW9ucztcbiAgICAgIC8vIFdlIGFsd2F5cyB3YW50IHRvIGFkZCBhIFRPRE8gaW4gY2FzZSB0aGUgcXVlcnkgb3B0aW9ucyBjYW5ub3QgYmUgdXBkYXRlZC5cbiAgICAgIGlmICghaGFzVG9kb0NvbW1lbnQpIHtcbiAgICAgICAgYWRkUXVlcnlUaW1pbmdUb2RvVG9Ob2RlKGV4aXN0aW5nT3B0aW9ucyk7XG4gICAgICB9XG4gICAgICAvLyBJZiB0aGVyZSBpcyBhIG5ldyBleHBsaWNpdCB0aW1pbmcgdGhhdCBoYXMgYmVlbiBkZXRlcm1pbmVkIGZvciB0aGUgZ2l2ZW4gcXVlcnksXG4gICAgICAvLyB3ZSBjcmVhdGUgYSB0cmFuc2Zvcm1hdGlvbiBmYWlsdXJlIG1lc3NhZ2UgdGhhdCBzaG93cyBkZXZlbG9wZXJzIHRoYXQgdGhleSBuZWVkXG4gICAgICAvLyB0byBzZXQgdGhlIHF1ZXJ5IHRpbWluZyBtYW51YWxseSB0byB0aGUgZGV0ZXJtaW5lZCBxdWVyeSB0aW1pbmcuXG4gICAgICBpZiAodGltaW5nICE9PSBudWxsKSB7XG4gICAgICAgIGZhaWx1cmVNZXNzYWdlID0gJ0Nhbm5vdCB1cGRhdGUgcXVlcnkgZGVjbGFyYXRpb24gdG8gZXhwbGljaXQgdGltaW5nLiBQbGVhc2UgbWFudWFsbHkgJyArXG4gICAgICAgICAgICBgc2V0IHRoZSBxdWVyeSB0aW1pbmcgdG86IFwie3N0YXRpYzogJHsodGltaW5nID09PSBRdWVyeVRpbWluZy5TVEFUSUMpLnRvU3RyaW5nKCl9fVwiYDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmFpbHVyZU1lc3NhZ2UsXG4gICAgICBub2RlOiB0cy51cGRhdGVDYWxsKFxuICAgICAgICAgIHF1ZXJ5RXhwciwgcXVlcnlFeHByLmV4cHJlc3Npb24sIHF1ZXJ5RXhwci50eXBlQXJndW1lbnRzLFxuICAgICAgICAgIFtxdWVyeUFyZ3VtZW50c1swXSwgbmV3T3B0aW9uc05vZGUgIV0pXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IG9wdGlvbnNOb2RlID0gdHMuY3JlYXRlT2JqZWN0TGl0ZXJhbChxdWVyeVByb3BlcnR5QXNzaWdubWVudHMpO1xuXG4gIGlmIChjcmVhdGVUb2RvKSB7XG4gICAgYWRkUXVlcnlUaW1pbmdUb2RvVG9Ob2RlKG9wdGlvbnNOb2RlKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZmFpbHVyZU1lc3NhZ2U6IG51bGwsXG4gICAgbm9kZTogdHMudXBkYXRlQ2FsbChcbiAgICAgICAgcXVlcnlFeHByLCBxdWVyeUV4cHIuZXhwcmVzc2lvbiwgcXVlcnlFeHByLnR5cGVBcmd1bWVudHMsXG4gICAgICAgIFtxdWVyeUFyZ3VtZW50c1swXSwgb3B0aW9uc05vZGVdKVxuICB9O1xufVxuXG4vKipcbiAqIEFkZHMgYSB0by1kbyB0byB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlIHdoaWNoIHJlbWluZHMgZGV2ZWxvcGVycyB0byBzcGVjaWZ5XG4gKiBhbiBleHBsaWNpdCBxdWVyeSB0aW1pbmcuXG4gKi9cbmZ1bmN0aW9uIGFkZFF1ZXJ5VGltaW5nVG9kb1RvTm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gIHRzLnNldFN5bnRoZXRpY0xlYWRpbmdDb21tZW50cyhub2RlLCBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3M6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNUcmFpbGluZ05ld0xpbmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kOiB0cy5TeW50YXhLaW5kLk11bHRpTGluZUNvbW1lbnRUcml2aWEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGAgJHtUT0RPX0NPTU1FTlR9IGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dKTtcbn1cbiJdfQ==