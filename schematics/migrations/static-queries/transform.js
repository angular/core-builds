/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    const typescript_1 = __importDefault(require("typescript"));
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
            [typescript_1.default.createPropertyAssignment('static', timing === query_definition_1.QueryTiming.STATIC ? typescript_1.default.createTrue() : typescript_1.default.createFalse())];
        // If the query decorator is already called with two arguments, we need to
        // keep the existing options untouched and just add the new property if possible.
        if (queryArguments.length === 2) {
            const existingOptions = queryArguments[1];
            const existingOptionsText = existingOptions.getFullText();
            const hasTodoComment = existingOptionsText.includes(TODO_SPECIFY_COMMENT) ||
                existingOptionsText.includes(TODO_CHECK_COMMENT);
            let newOptionsNode;
            let failureMessage = null;
            if (typescript_1.default.isObjectLiteralExpression(existingOptions)) {
                // In case the options already contains a property for the "static" flag,
                // we just skip this query and leave it untouched.
                if (existingOptions.properties.some(p => !!p.name && (0, property_name_1.getPropertyNameText)(p.name) === 'static')) {
                    return null;
                }
                newOptionsNode = typescript_1.default.updateObjectLiteral(existingOptions, existingOptions.properties.concat(queryPropertyAssignments));
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
                node: typescript_1.default.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], newOptionsNode])
            };
        }
        const optionsNode = typescript_1.default.createObjectLiteral(queryPropertyAssignments);
        if (createTodo) {
            addQueryTimingTodoToNode(optionsNode, timing === null);
        }
        return {
            failureMessage: null,
            node: typescript_1.default.updateCall(queryExpr, queryExpr.expression, queryExpr.typeArguments, [queryArguments[0], optionsNode])
        };
    }
    exports.getTransformedQueryCallExpr = getTransformedQueryCallExpr;
    /**
     * Adds a to-do to the given TypeScript node which reminds developers to specify
     * an explicit query timing or to double-check the updated timing.
     */
    function addQueryTimingTodoToNode(node, addSpecifyTimingTodo) {
        typescript_1.default.setSyntheticLeadingComments(node, [{
                pos: -1,
                end: -1,
                hasTrailingNewLine: false,
                kind: typescript_1.default.SyntaxKind.MultiLineCommentTrivia,
                text: ` ${addSpecifyTimingTodo ? TODO_SPECIFY_COMMENT : TODO_CHECK_COMMENT} `
            }]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvc3RhdGljLXF1ZXJpZXMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDREQUE0QjtJQUM1QiwyRkFBeUU7SUFDekUsa0hBQTBFO0lBUzFFLE1BQU0sb0JBQW9CLEdBQUcsdUJBQXVCLENBQUM7SUFDckQsTUFBTSxrQkFBa0IsR0FBRyx5QkFBeUIsQ0FBQztJQUVyRDs7O09BR0c7SUFDSCxTQUFnQiwyQkFBMkIsQ0FDdkMsS0FBd0IsRUFBRSxNQUF3QixFQUNsRCxVQUFtQjtRQUNyQixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDbEQsTUFBTSxjQUFjLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUMzQyxNQUFNLHdCQUF3QixHQUFHLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQztZQUM5QyxFQUFFLENBQUMsQ0FBQztZQUNKLENBQUMsb0JBQUUsQ0FBQyx3QkFBd0IsQ0FDeEIsUUFBUSxFQUFFLE1BQU0sS0FBSyw4QkFBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsb0JBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFdkYsMEVBQTBFO1FBQzFFLGlGQUFpRjtRQUNqRixJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQy9CLE1BQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLG1CQUFtQixHQUFHLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxRCxNQUFNLGNBQWMsR0FBRyxtQkFBbUIsQ0FB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KlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5pbXBvcnQge05nUXVlcnlEZWZpbml0aW9uLCBRdWVyeVRpbWluZ30gZnJvbSAnLi9hbmd1bGFyL3F1ZXJ5LWRlZmluaXRpb24nO1xuXG5leHBvcnQgdHlwZSBUcmFuc2Zvcm1lZFF1ZXJ5UmVzdWx0ID0gbnVsbHx7XG4gIC8qKiBUcmFuc2Zvcm1lZCBjYWxsIGV4cHJlc3Npb24uICovXG4gIG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uO1xuICAvKiogRmFpbHVyZSBtZXNzYWdlIHdoaWNoIGlzIHNldCB3aGVuIHRoZSBxdWVyeSBjb3VsZCBub3QgYmUgdHJhbnNmb3JtZWQgc3VjY2Vzc2Z1bGx5LiAqL1xuICBmYWlsdXJlTWVzc2FnZTogc3RyaW5nfG51bGw7XG59O1xuXG5jb25zdCBUT0RPX1NQRUNJRllfQ09NTUVOVCA9ICdUT0RPOiBhZGQgc3RhdGljIGZsYWcnO1xuY29uc3QgVE9ET19DSEVDS19DT01NRU5UID0gJ1RPRE86IGNoZWNrIHN0YXRpYyBmbGFnJztcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSBnaXZlbiBxdWVyeSBkZWNvcmF0b3IgYnkgZXhwbGljaXRseSBzcGVjaWZ5aW5nIHRoZSB0aW1pbmcgYmFzZWQgb24gdGhlXG4gKiBkZXRlcm1pbmVkIHRpbWluZy4gVGhlIHVwZGF0ZWQgZGVjb3JhdG9yIGNhbGwgZXhwcmVzc2lvbiBub2RlIHdpbGwgYmUgcmV0dXJuZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1lZFF1ZXJ5Q2FsbEV4cHIoXG4gICAgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCB0aW1pbmc6IFF1ZXJ5VGltaW5nfG51bGwsXG4gICAgY3JlYXRlVG9kbzogYm9vbGVhbik6IFRyYW5zZm9ybWVkUXVlcnlSZXN1bHQge1xuICBjb25zdCBxdWVyeUV4cHIgPSBxdWVyeS5kZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuICBjb25zdCBxdWVyeUFyZ3VtZW50cyA9IHF1ZXJ5RXhwci5hcmd1bWVudHM7XG4gIGNvbnN0IHF1ZXJ5UHJvcGVydHlBc3NpZ25tZW50cyA9IHRpbWluZyA9PT0gbnVsbCA/XG4gICAgICBbXSA6XG4gICAgICBbdHMuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KFxuICAgICAgICAgICdzdGF0aWMnLCB0aW1pbmcgPT09IFF1ZXJ5VGltaW5nLlNUQVRJQyA/IHRzLmNyZWF0ZVRydWUoKSA6IHRzLmNyZWF0ZUZhbHNlKCkpXTtcblxuICAvLyBJZiB0aGUgcXVlcnkgZGVjb3JhdG9yIGlzIGFscmVhZHkgY2FsbGVkIHdpdGggdHdvIGFyZ3VtZW50cywgd2UgbmVlZCB0b1xuICAvLyBrZWVwIHRoZSBleGlzdGluZyBvcHRpb25zIHVudG91Y2hlZCBhbmQganVzdCBhZGQgdGhlIG5ldyBwcm9wZXJ0eSBpZiBwb3NzaWJsZS5cbiAgaWYgKHF1ZXJ5QXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIGNvbnN0IGV4aXN0aW5nT3B0aW9ucyA9IHF1ZXJ5QXJndW1lbnRzWzFdO1xuICAgIGNvbnN0IGV4aXN0aW5nT3B0aW9uc1RleHQgPSBleGlzdGluZ09wdGlvbnMuZ2V0RnVsbFRleHQoKTtcbiAgICBjb25zdCBoYXNUb2RvQ29tbWVudCA9IGV4aXN0aW5nT3B0aW9uc1RleHQuaW5jbHVkZXMoVE9ET19TUEVDSUZZX0NPTU1FTlQpIHx8XG4gICAgICAgIGV4aXN0aW5nT3B0aW9uc1RleHQuaW5jbHVkZXMoVE9ET19DSEVDS19DT01NRU5UKTtcbiAgICBsZXQgbmV3T3B0aW9uc05vZGU6IHRzLkV4cHJlc3Npb247XG4gICAgbGV0IGZhaWx1cmVNZXNzYWdlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihleGlzdGluZ09wdGlvbnMpKSB7XG4gICAgICAvLyBJbiBjYXNlIHRoZSBvcHRpb25zIGFscmVhZHkgY29udGFpbnMgYSBwcm9wZXJ0eSBmb3IgdGhlIFwic3RhdGljXCIgZmxhZyxcbiAgICAgIC8vIHdlIGp1c3Qgc2tpcCB0aGlzIHF1ZXJ5IGFuZCBsZWF2ZSBpdCB1bnRvdWNoZWQuXG4gICAgICBpZiAoZXhpc3RpbmdPcHRpb25zLnByb3BlcnRpZXMuc29tZShcbiAgICAgICAgICAgICAgcCA9PiAhIXAubmFtZSAmJiBnZXRQcm9wZXJ0eU5hbWVUZXh0KHAubmFtZSkgPT09ICdzdGF0aWMnKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgbmV3T3B0aW9uc05vZGUgPSB0cy51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICAgIGV4aXN0aW5nT3B0aW9ucywgZXhpc3RpbmdPcHRpb25zLnByb3BlcnRpZXMuY29uY2F0KHF1ZXJ5UHJvcGVydHlBc3NpZ25tZW50cykpO1xuXG4gICAgICAvLyBJbiBjYXNlIHdlIHdhbnQgdG8gYWRkIGEgdG9kbyBhbmQgdGhlIG9wdGlvbnMgZG8gbm90IGhhdmUgdGhlIHRvZG9cbiAgICAgIC8vIHlldCwgd2UgYWRkIHRoZSBxdWVyeSB0aW1pbmcgdG9kbyBhcyBzeW50aGV0aWMgbXVsdGktbGluZSBjb21tZW50LlxuICAgICAgaWYgKGNyZWF0ZVRvZG8gJiYgIWhhc1RvZG9Db21tZW50KSB7XG4gICAgICAgIGFkZFF1ZXJ5VGltaW5nVG9kb1RvTm9kZShuZXdPcHRpb25zTm9kZSwgdGltaW5nID09PSBudWxsKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSW4gY2FzZSB0aGUgb3B0aW9ucyBxdWVyeSBwYXJhbWV0ZXIgaXMgbm90IGFuIG9iamVjdCBsaXRlcmFsIGV4cHJlc3Npb24sIGFuZFxuICAgICAgLy8gd2Ugd2FudCB0byBzZXQgdGhlIHF1ZXJ5IHRpbWluZywgd2UganVzdCBwcmVzZXJ2ZSB0aGUgZXhpc3RpbmcgcXVlcnkgcGFyYW1ldGVyLlxuICAgICAgbmV3T3B0aW9uc05vZGUgPSBleGlzdGluZ09wdGlvbnM7XG4gICAgICAvLyBXZSBhbHdheXMgd2FudCB0byBhZGQgYSBUT0RPIGluIGNhc2UgdGhlIHF1ZXJ5IG9wdGlvbnMgY2Fubm90IGJlIHVwZGF0ZWQuXG4gICAgICBpZiAoIWhhc1RvZG9Db21tZW50KSB7XG4gICAgICAgIGFkZFF1ZXJ5VGltaW5nVG9kb1RvTm9kZShleGlzdGluZ09wdGlvbnMsIHRydWUpO1xuICAgICAgfVxuICAgICAgLy8gSWYgdGhlcmUgaXMgYSBuZXcgZXhwbGljaXQgdGltaW5nIHRoYXQgaGFzIGJlZW4gZGV0ZXJtaW5lZCBmb3IgdGhlIGdpdmVuIHF1ZXJ5LFxuICAgICAgLy8gd2UgY3JlYXRlIGEgdHJhbnNmb3JtYXRpb24gZmFpbHVyZSBtZXNzYWdlIHRoYXQgc2hvd3MgZGV2ZWxvcGVycyB0aGF0IHRoZXkgbmVlZFxuICAgICAgLy8gdG8gc2V0IHRoZSBxdWVyeSB0aW1pbmcgbWFudWFsbHkgdG8gdGhlIGRldGVybWluZWQgcXVlcnkgdGltaW5nLlxuICAgICAgaWYgKHRpbWluZyAhPT0gbnVsbCkge1xuICAgICAgICBmYWlsdXJlTWVzc2FnZSA9ICdDYW5ub3QgdXBkYXRlIHF1ZXJ5IHRvIHNldCBleHBsaWNpdCB0aW1pbmcuIFBsZWFzZSBtYW51YWxseSAnICtcbiAgICAgICAgICAgIGBzZXQgdGhlIHF1ZXJ5IHRpbWluZyB0bzogXCJ7c3RhdGljOiAkeyh0aW1pbmcgPT09IFF1ZXJ5VGltaW5nLlNUQVRJQykudG9TdHJpbmcoKX19XCJgO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmYWlsdXJlTWVzc2FnZSxcbiAgICAgIG5vZGU6IHRzLnVwZGF0ZUNhbGwoXG4gICAgICAgICAgcXVlcnlFeHByLCBxdWVyeUV4cHIuZXhwcmVzc2lvbiwgcXVlcnlFeHByLnR5cGVBcmd1bWVudHMsXG4gICAgICAgICAgW3F1ZXJ5QXJndW1lbnRzWzBdLCBuZXdPcHRpb25zTm9kZSFdKVxuICAgIH07XG4gIH1cblxuICBjb25zdCBvcHRpb25zTm9kZSA9IHRzLmNyZWF0ZU9iamVjdExpdGVyYWwocXVlcnlQcm9wZXJ0eUFzc2lnbm1lbnRzKTtcblxuICBpZiAoY3JlYXRlVG9kbykge1xuICAgIGFkZFF1ZXJ5VGltaW5nVG9kb1RvTm9kZShvcHRpb25zTm9kZSwgdGltaW5nID09PSBudWxsKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZmFpbHVyZU1lc3NhZ2U6IG51bGwsXG4gICAgbm9kZTogdHMudXBkYXRlQ2FsbChcbiAgICAgICAgcXVlcnlFeHByLCBxdWVyeUV4cHIuZXhwcmVzc2lvbiwgcXVlcnlFeHByLnR5cGVBcmd1bWVudHMsIFtxdWVyeUFyZ3VtZW50c1swXSwgb3B0aW9uc05vZGVdKVxuICB9O1xufVxuXG4vKipcbiAqIEFkZHMgYSB0by1kbyB0byB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlIHdoaWNoIHJlbWluZHMgZGV2ZWxvcGVycyB0byBzcGVjaWZ5XG4gKiBhbiBleHBsaWNpdCBxdWVyeSB0aW1pbmcgb3IgdG8gZG91YmxlLWNoZWNrIHRoZSB1cGRhdGVkIHRpbWluZy5cbiAqL1xuZnVuY3Rpb24gYWRkUXVlcnlUaW1pbmdUb2RvVG9Ob2RlKG5vZGU6IHRzLk5vZGUsIGFkZFNwZWNpZnlUaW1pbmdUb2RvOiBib29sZWFuKSB7XG4gIHRzLnNldFN5bnRoZXRpY0xlYWRpbmdDb21tZW50cyhcbiAgICAgIG5vZGUsIFt7XG4gICAgICAgIHBvczogLTEsXG4gICAgICAgIGVuZDogLTEsXG4gICAgICAgIGhhc1RyYWlsaW5nTmV3TGluZTogZmFsc2UsXG4gICAgICAgIGtpbmQ6IHRzLlN5bnRheEtpbmQuTXVsdGlMaW5lQ29tbWVudFRyaXZpYSxcbiAgICAgICAgdGV4dDogYCAke2FkZFNwZWNpZnlUaW1pbmdUb2RvID8gVE9ET19TUEVDSUZZX0NPTU1FTlQgOiBUT0RPX0NIRUNLX0NPTU1FTlR9IGBcbiAgICAgIH1dKTtcbn1cbiJdfQ==