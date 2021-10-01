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
        define("@angular/core/schematics/migrations/renderer-to-renderer2/migration", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateExpression = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    /**
     * Migrates a function call expression from `Renderer` to `Renderer2`.
     * Returns null if the expression should be dropped.
     */
    function migrateExpression(node, typeChecker) {
        if (isPropertyAccessCallExpression(node)) {
            switch (node.expression.name.getText()) {
                case 'setElementProperty':
                    return { node: renameMethodCall(node, 'setProperty') };
                case 'setText':
                    return { node: renameMethodCall(node, 'setValue') };
                case 'listenGlobal':
                    return { node: renameMethodCall(node, 'listen') };
                case 'selectRootElement':
                    return { node: migrateSelectRootElement(node) };
                case 'setElementClass':
                    return { node: migrateSetElementClass(node) };
                case 'setElementStyle':
                    return { node: migrateSetElementStyle(node, typeChecker) };
                case 'invokeElementMethod':
                    return { node: migrateInvokeElementMethod(node) };
                case 'setBindingDebugInfo':
                    return { node: null };
                case 'createViewRoot':
                    return { node: migrateCreateViewRoot(node) };
                case 'setElementAttribute':
                    return {
                        node: switchToHelperCall(node, "__ngRendererSetElementAttributeHelper" /* setElementAttribute */, node.arguments),
                        requiredHelpers: [
                            "AnyDuringRendererMigration" /* any */, "__ngRendererSplitNamespaceHelper" /* splitNamespace */, "__ngRendererSetElementAttributeHelper" /* setElementAttribute */
                        ]
                    };
                case 'createElement':
                    return {
                        node: switchToHelperCall(node, "__ngRendererCreateElementHelper" /* createElement */, node.arguments.slice(0, 2)),
                        requiredHelpers: ["AnyDuringRendererMigration" /* any */, "__ngRendererSplitNamespaceHelper" /* splitNamespace */, "__ngRendererCreateElementHelper" /* createElement */]
                    };
                case 'createText':
                    return {
                        node: switchToHelperCall(node, "__ngRendererCreateTextHelper" /* createText */, node.arguments.slice(0, 2)),
                        requiredHelpers: ["AnyDuringRendererMigration" /* any */, "__ngRendererCreateTextHelper" /* createText */]
                    };
                case 'createTemplateAnchor':
                    return {
                        node: switchToHelperCall(node, "__ngRendererCreateTemplateAnchorHelper" /* createTemplateAnchor */, node.arguments.slice(0, 1)),
                        requiredHelpers: ["AnyDuringRendererMigration" /* any */, "__ngRendererCreateTemplateAnchorHelper" /* createTemplateAnchor */]
                    };
                case 'projectNodes':
                    return {
                        node: switchToHelperCall(node, "__ngRendererProjectNodesHelper" /* projectNodes */, node.arguments),
                        requiredHelpers: ["AnyDuringRendererMigration" /* any */, "__ngRendererProjectNodesHelper" /* projectNodes */]
                    };
                case 'animate':
                    return {
                        node: migrateAnimateCall(),
                        requiredHelpers: ["AnyDuringRendererMigration" /* any */, "__ngRendererAnimateHelper" /* animate */]
                    };
                case 'destroyView':
                    return {
                        node: switchToHelperCall(node, "__ngRendererDestroyViewHelper" /* destroyView */, [node.arguments[1]]),
                        requiredHelpers: ["AnyDuringRendererMigration" /* any */, "__ngRendererDestroyViewHelper" /* destroyView */]
                    };
                case 'detachView':
                    return {
                        node: switchToHelperCall(node, "__ngRendererDetachViewHelper" /* detachView */, [node.arguments[0]]),
                        requiredHelpers: ["AnyDuringRendererMigration" /* any */, "__ngRendererDetachViewHelper" /* detachView */]
                    };
                case 'attachViewAfter':
                    return {
                        node: switchToHelperCall(node, "__ngRendererAttachViewAfterHelper" /* attachViewAfter */, node.arguments),
                        requiredHelpers: ["AnyDuringRendererMigration" /* any */, "__ngRendererAttachViewAfterHelper" /* attachViewAfter */]
                    };
            }
        }
        return { node };
    }
    exports.migrateExpression = migrateExpression;
    /** Checks whether a node is a PropertyAccessExpression. */
    function isPropertyAccessCallExpression(node) {
        return typescript_1.default.isCallExpression(node) && typescript_1.default.isPropertyAccessExpression(node.expression);
    }
    /** Renames a method call while keeping all of the parameters in place. */
    function renameMethodCall(node, newName) {
        const newExpression = typescript_1.default.updatePropertyAccess(node.expression, node.expression.expression, typescript_1.default.createIdentifier(newName));
        return typescript_1.default.updateCall(node, newExpression, node.typeArguments, node.arguments);
    }
    /**
     * Migrates a `selectRootElement` call by removing the last argument which is no longer supported.
     */
    function migrateSelectRootElement(node) {
        // The only thing we need to do is to drop the last argument
        // (`debugInfo`), if the consumer was passing it in.
        if (node.arguments.length > 1) {
            return typescript_1.default.updateCall(node, node.expression, node.typeArguments, [node.arguments[0]]);
        }
        return node;
    }
    /**
     * Migrates a call to `setElementClass` either to a call to `addClass` or `removeClass`, or
     * to an expression like `isAdd ? addClass(el, className) : removeClass(el, className)`.
     */
    function migrateSetElementClass(node) {
        // Clone so we don't mutate by accident. Note that we assume that
        // the user's code is providing all three required arguments.
        const outputMethodArgs = node.arguments.slice();
        const isAddArgument = outputMethodArgs.pop();
        const createRendererCall = (isAdd) => {
            const innerExpression = node.expression.expression;
            const topExpression = typescript_1.default.createPropertyAccess(innerExpression, isAdd ? 'addClass' : 'removeClass');
            return typescript_1.default.createCall(topExpression, [], node.arguments.slice(0, 2));
        };
        // If the call has the `isAdd` argument as a literal boolean, we can map it directly to
        // `addClass` or `removeClass`. Note that we can't use the type checker here, because it
        // won't tell us whether the value resolves to true or false.
        if (isAddArgument.kind === typescript_1.default.SyntaxKind.TrueKeyword ||
            isAddArgument.kind === typescript_1.default.SyntaxKind.FalseKeyword) {
            return createRendererCall(isAddArgument.kind === typescript_1.default.SyntaxKind.TrueKeyword);
        }
        // Otherwise create a ternary on the variable.
        return typescript_1.default.createConditional(isAddArgument, createRendererCall(true), createRendererCall(false));
    }
    /**
     * Migrates a call to `setElementStyle` call either to a call to
     * `setStyle` or `removeStyle`. or to an expression like
     * `value == null ? removeStyle(el, key) : setStyle(el, key, value)`.
     */
    function migrateSetElementStyle(node, typeChecker) {
        const args = node.arguments;
        const addMethodName = 'setStyle';
        const removeMethodName = 'removeStyle';
        const lastArgType = args[2] ?
            typeChecker.typeToString(typeChecker.getTypeAtLocation(args[2]), node, typescript_1.default.TypeFormatFlags.AddUndefined) :
            null;
        // Note that for a literal null, TS considers it a `NullKeyword`,
        // whereas a literal `undefined` is just an Identifier.
        if (args.length === 2 || lastArgType === 'null' || lastArgType === 'undefined') {
            // If we've got a call with two arguments, or one with three arguments where the last one is
            // `undefined` or `null`, we can safely switch to a `removeStyle` call.
            const innerExpression = node.expression.expression;
            const topExpression = typescript_1.default.createPropertyAccess(innerExpression, removeMethodName);
            return typescript_1.default.createCall(topExpression, [], args.slice(0, 2));
        }
        else if (args.length === 3) {
            // We need the checks for string literals, because the type of something
            // like `"blue"` is the literal `blue`, not `string`.
            if (lastArgType === 'string' || lastArgType === 'number' || typescript_1.default.isStringLiteral(args[2]) ||
                typescript_1.default.isNoSubstitutionTemplateLiteral(args[2]) || typescript_1.default.isNumericLiteral(args[2])) {
                // If we've got three arguments and the last one is a string literal or a number, we
                // can safely rename to `setStyle`.
                return renameMethodCall(node, addMethodName);
            }
            else {
                // Otherwise migrate to a ternary that looks like:
                // `value == null ? removeStyle(el, key) : setStyle(el, key, value)`
                const condition = typescript_1.default.createBinary(args[2], typescript_1.default.SyntaxKind.EqualsEqualsToken, typescript_1.default.createNull());
                const whenNullCall = renameMethodCall(typescript_1.default.createCall(node.expression, [], args.slice(0, 2)), removeMethodName);
                return typescript_1.default.createConditional(condition, whenNullCall, renameMethodCall(node, addMethodName));
            }
        }
        return node;
    }
    /**
     * Migrates a call to `invokeElementMethod(target, method, [arg1, arg2])` either to
     * `target.method(arg1, arg2)` or `(target as any)[method].apply(target, [arg1, arg2])`.
     */
    function migrateInvokeElementMethod(node) {
        const [target, name, args] = node.arguments;
        const isNameStatic = typescript_1.default.isStringLiteral(name) || typescript_1.default.isNoSubstitutionTemplateLiteral(name);
        const isArgsStatic = !args || typescript_1.default.isArrayLiteralExpression(args);
        if (isNameStatic && isArgsStatic) {
            // If the name is a static string and the arguments are an array literal,
            // we can safely convert the node into a call expression.
            const expression = typescript_1.default.createPropertyAccess(target, name.text);
            const callArguments = args ? args.elements : [];
            return typescript_1.default.createCall(expression, [], callArguments);
        }
        else {
            // Otherwise create an expression in the form of `(target as any)[name].apply(target, args)`.
            const asExpression = typescript_1.default.createParen(typescript_1.default.createAsExpression(target, typescript_1.default.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword)));
            const elementAccess = typescript_1.default.createElementAccess(asExpression, name);
            const applyExpression = typescript_1.default.createPropertyAccess(elementAccess, 'apply');
            return typescript_1.default.createCall(applyExpression, [], args ? [target, args] : [target]);
        }
    }
    /** Migrates a call to `createViewRoot` to whatever node was passed in as the first argument. */
    function migrateCreateViewRoot(node) {
        return node.arguments[0];
    }
    /** Migrates a call to `migrate` a direct call to the helper. */
    function migrateAnimateCall() {
        return typescript_1.default.createCall(typescript_1.default.createIdentifier("__ngRendererAnimateHelper" /* animate */), [], []);
    }
    /**
     * Switches out a call to the `Renderer` to a call to one of our helper functions.
     * Most of the helpers accept an instance of `Renderer2` as the first argument and all
     * subsequent arguments differ.
     * @param node Node of the original method call.
     * @param helper Name of the helper with which to replace the original call.
     * @param args Arguments that should be passed into the helper after the renderer argument.
     */
    function switchToHelperCall(node, helper, args) {
        return typescript_1.default.createCall(typescript_1.default.createIdentifier(helper), [], [node.expression.expression, ...args]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvcmVuZGVyZXItdG8tcmVuZGVyZXIyL21pZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCw0REFBNEI7SUFPNUI7OztPQUdHO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsSUFBdUIsRUFBRSxXQUEyQjtRQUVwRixJQUFJLDhCQUE4QixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hDLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ3RDLEtBQUssb0JBQW9CO29CQUN2QixPQUFPLEVBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsRUFBQyxDQUFDO2dCQUN2RCxLQUFLLFNBQVM7b0JBQ1osT0FBTyxFQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLEVBQUMsQ0FBQztnQkFDcEQsS0FBSyxjQUFjO29CQUNqQixPQUFPLEVBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBQyxDQUFDO2dCQUNsRCxLQUFLLG1CQUFtQjtvQkFDdEIsT0FBTyxFQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDO2dCQUNoRCxLQUFLLGlCQUFpQjtvQkFDcEIsT0FBTyxFQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDO2dCQUM5QyxLQUFLLGlCQUFpQjtvQkFDcEIsT0FBTyxFQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLEVBQUMsQ0FBQztnQkFDM0QsS0FBSyxxQkFBcUI7b0JBQ3hC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bUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakUsTUFBTSxlQUFlLEdBQUcsb0JBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDeEUsT0FBTyxvQkFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUM3RTtJQUNILENBQUM7SUFFRCxnR0FBZ0c7SUFDaEcsU0FBUyxxQkFBcUIsQ0FBQyxJQUF1QjtRQUNwRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELGdFQUFnRTtJQUNoRSxTQUFTLGtCQUFrQjtRQUN6QixPQUFPLG9CQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFFLENBQUMsZ0JBQWdCLDJDQUF3QixFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILFNBQVMsa0JBQWtCLENBQ3ZCLElBQWtDLEVBQUUsTUFBc0IsRUFDMUQsSUFBaUQ7UUFDbkQsT0FBTyxvQkFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBRSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtIZWxwZXJGdW5jdGlvbn0gZnJvbSAnLi9oZWxwZXJzJztcblxuLyoqIEEgY2FsbCBleHByZXNzaW9uIHRoYXQgaXMgYmFzZWQgb24gYSBwcm9wZXJ0eSBhY2Nlc3MuICovXG50eXBlIFByb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24gPSB0cy5DYWxsRXhwcmVzc2lvbiZ7ZXhwcmVzc2lvbjogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9ufTtcblxuLyoqXG4gKiBNaWdyYXRlcyBhIGZ1bmN0aW9uIGNhbGwgZXhwcmVzc2lvbiBmcm9tIGBSZW5kZXJlcmAgdG8gYFJlbmRlcmVyMmAuXG4gKiBSZXR1cm5zIG51bGwgaWYgdGhlIGV4cHJlc3Npb24gc2hvdWxkIGJlIGRyb3BwZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaWdyYXRlRXhwcmVzc2lvbihub2RlOiB0cy5DYWxsRXhwcmVzc2lvbiwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTpcbiAgICB7bm9kZTogdHMuTm9kZXxudWxsLCByZXF1aXJlZEhlbHBlcnM/OiBIZWxwZXJGdW5jdGlvbltdfSB7XG4gIGlmIChpc1Byb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24obm9kZSkpIHtcbiAgICBzd2l0Y2ggKG5vZGUuZXhwcmVzc2lvbi5uYW1lLmdldFRleHQoKSkge1xuICAgICAgY2FzZSAnc2V0RWxlbWVudFByb3BlcnR5JzpcbiAgICAgICAgcmV0dXJuIHtub2RlOiByZW5hbWVNZXRob2RDYWxsKG5vZGUsICdzZXRQcm9wZXJ0eScpfTtcbiAgICAgIGNhc2UgJ3NldFRleHQnOlxuICAgICAgICByZXR1cm4ge25vZGU6IHJlbmFtZU1ldGhvZENhbGwobm9kZSwgJ3NldFZhbHVlJyl9O1xuICAgICAgY2FzZSAnbGlzdGVuR2xvYmFsJzpcbiAgICAgICAgcmV0dXJuIHtub2RlOiByZW5hbWVNZXRob2RDYWxsKG5vZGUsICdsaXN0ZW4nKX07XG4gICAgICBjYXNlICdzZWxlY3RSb290RWxlbWVudCc6XG4gICAgICAgIHJldHVybiB7bm9kZTogbWlncmF0ZVNlbGVjdFJvb3RFbGVtZW50KG5vZGUpfTtcbiAgICAgIGNhc2UgJ3NldEVsZW1lbnRDbGFzcyc6XG4gICAgICAgIHJldHVybiB7bm9kZTogbWlncmF0ZVNldEVsZW1lbnRDbGFzcyhub2RlKX07XG4gICAgICBjYXNlICdzZXRFbGVtZW50U3R5bGUnOlxuICAgICAgICByZXR1cm4ge25vZGU6IG1pZ3JhdGVTZXRFbGVtZW50U3R5bGUobm9kZSwgdHlwZUNoZWNrZXIpfTtcbiAgICAgIGNhc2UgJ2ludm9rZUVsZW1lbnRNZXRob2QnOlxuICAgICAgICByZXR1cm4ge25vZGU6IG1pZ3JhdGVJbnZva2VFbGVtZW50TWV0aG9kKG5vZGUpfTtcbiAgICAgIGNhc2UgJ3NldEJpbmRpbmdEZWJ1Z0luZm8nOlxuICAgICAgICByZXR1cm4ge25vZGU6IG51bGx9O1xuICAgICAgY2FzZSAnY3JlYXRlVmlld1Jvb3QnOlxuICAgICAgICByZXR1cm4ge25vZGU6IG1pZ3JhdGVDcmVhdGVWaWV3Um9vdChub2RlKX07XG4gICAgICBjYXNlICdzZXRFbGVtZW50QXR0cmlidXRlJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBzd2l0Y2hUb0hlbHBlckNhbGwobm9kZSwgSGVscGVyRnVuY3Rpb24uc2V0RWxlbWVudEF0dHJpYnV0ZSwgbm9kZS5hcmd1bWVudHMpLFxuICAgICAgICAgIHJlcXVpcmVkSGVscGVyczogW1xuICAgICAgICAgICAgSGVscGVyRnVuY3Rpb24uYW55LCBIZWxwZXJGdW5jdGlvbi5zcGxpdE5hbWVzcGFjZSwgSGVscGVyRnVuY3Rpb24uc2V0RWxlbWVudEF0dHJpYnV0ZVxuICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ2NyZWF0ZUVsZW1lbnQnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IHN3aXRjaFRvSGVscGVyQ2FsbChub2RlLCBIZWxwZXJGdW5jdGlvbi5jcmVhdGVFbGVtZW50LCBub2RlLmFyZ3VtZW50cy5zbGljZSgwLCAyKSksXG4gICAgICAgICAgcmVxdWlyZWRIZWxwZXJzOlxuICAgICAgICAgICAgICBbSGVscGVyRnVuY3Rpb24uYW55LCBIZWxwZXJGdW5jdGlvbi5zcGxpdE5hbWVzcGFjZSwgSGVscGVyRnVuY3Rpb24uY3JlYXRlRWxlbWVudF1cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ2NyZWF0ZVRleHQnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IHN3aXRjaFRvSGVscGVyQ2FsbChub2RlLCBIZWxwZXJGdW5jdGlvbi5jcmVhdGVUZXh0LCBub2RlLmFyZ3VtZW50cy5zbGljZSgwLCAyKSksXG4gICAgICAgICAgcmVxdWlyZWRIZWxwZXJzOiBbSGVscGVyRnVuY3Rpb24uYW55LCBIZWxwZXJGdW5jdGlvbi5jcmVhdGVUZXh0XVxuICAgICAgICB9O1xuICAgICAgY2FzZSAnY3JlYXRlVGVtcGxhdGVBbmNob3InOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IHN3aXRjaFRvSGVscGVyQ2FsbChcbiAgICAgICAgICAgICAgbm9kZSwgSGVscGVyRnVuY3Rpb24uY3JlYXRlVGVtcGxhdGVBbmNob3IsIG5vZGUuYXJndW1lbnRzLnNsaWNlKDAsIDEpKSxcbiAgICAgICAgICByZXF1aXJlZEhlbHBlcnM6IFtIZWxwZXJGdW5jdGlvbi5hbnksIEhlbHBlckZ1bmN0aW9uLmNyZWF0ZVRlbXBsYXRlQW5jaG9yXVxuICAgICAgICB9O1xuICAgICAgY2FzZSAncHJvamVjdE5vZGVzJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBzd2l0Y2hUb0hlbHBlckNhbGwobm9kZSwgSGVscGVyRnVuY3Rpb24ucHJvamVjdE5vZGVzLCBub2RlLmFyZ3VtZW50cyksXG4gICAgICAgICAgcmVxdWlyZWRIZWxwZXJzOiBbSGVscGVyRnVuY3Rpb24uYW55LCBIZWxwZXJGdW5jdGlvbi5wcm9qZWN0Tm9kZXNdXG4gICAgICAgIH07XG4gICAgICBjYXNlICdhbmltYXRlJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBtaWdyYXRlQW5pbWF0ZUNhbGwoKSxcbiAgICAgICAgICByZXF1aXJlZEhlbHBlcnM6IFtIZWxwZXJGdW5jdGlvbi5hbnksIEhlbHBlckZ1bmN0aW9uLmFuaW1hdGVdXG4gICAgICAgIH07XG4gICAgICBjYXNlICdkZXN0cm95Vmlldyc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogc3dpdGNoVG9IZWxwZXJDYWxsKG5vZGUsIEhlbHBlckZ1bmN0aW9uLmRlc3Ryb3lWaWV3LCBbbm9kZS5hcmd1bWVudHNbMV1dKSxcbiAgICAgICAgICByZXF1aXJlZEhlbHBlcnM6IFtIZWxwZXJGdW5jdGlvbi5hbnksIEhlbHBlckZ1bmN0aW9uLmRlc3Ryb3lWaWV3XVxuICAgICAgICB9O1xuICAgICAgY2FzZSAnZGV0YWNoVmlldyc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogc3dpdGNoVG9IZWxwZXJDYWxsKG5vZGUsIEhlbHBlckZ1bmN0aW9uLmRldGFjaFZpZXcsIFtub2RlLmFyZ3VtZW50c1swXV0pLFxuICAgICAgICAgIHJlcXVpcmVkSGVscGVyczogW0hlbHBlckZ1bmN0aW9uLmFueSwgSGVscGVyRnVuY3Rpb24uZGV0YWNoVmlld11cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ2F0dGFjaFZpZXdBZnRlcic6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogc3dpdGNoVG9IZWxwZXJDYWxsKG5vZGUsIEhlbHBlckZ1bmN0aW9uLmF0dGFjaFZpZXdBZnRlciwgbm9kZS5hcmd1bWVudHMpLFxuICAgICAgICAgIHJlcXVpcmVkSGVscGVyczogW0hlbHBlckZ1bmN0aW9uLmFueSwgSGVscGVyRnVuY3Rpb24uYXR0YWNoVmlld0FmdGVyXVxuICAgICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7bm9kZX07XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBhIG5vZGUgaXMgYSBQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24uICovXG5mdW5jdGlvbiBpc1Byb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24obm9kZTogdHMuTm9kZSk6IG5vZGUgaXMgUHJvcGVydHlBY2Nlc3NDYWxsRXhwcmVzc2lvbiB7XG4gIHJldHVybiB0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpICYmIHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbik7XG59XG5cbi8qKiBSZW5hbWVzIGEgbWV0aG9kIGNhbGwgd2hpbGUga2VlcGluZyBhbGwgb2YgdGhlIHBhcmFtZXRlcnMgaW4gcGxhY2UuICovXG5mdW5jdGlvbiByZW5hbWVNZXRob2RDYWxsKG5vZGU6IFByb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24sIG5ld05hbWU6IHN0cmluZyk6IHRzLkNhbGxFeHByZXNzaW9uIHtcbiAgY29uc3QgbmV3RXhwcmVzc2lvbiA9IHRzLnVwZGF0ZVByb3BlcnR5QWNjZXNzKFxuICAgICAgbm9kZS5leHByZXNzaW9uLCBub2RlLmV4cHJlc3Npb24uZXhwcmVzc2lvbiwgdHMuY3JlYXRlSWRlbnRpZmllcihuZXdOYW1lKSk7XG5cbiAgcmV0dXJuIHRzLnVwZGF0ZUNhbGwobm9kZSwgbmV3RXhwcmVzc2lvbiwgbm9kZS50eXBlQXJndW1lbnRzLCBub2RlLmFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogTWlncmF0ZXMgYSBgc2VsZWN0Um9vdEVsZW1lbnRgIGNhbGwgYnkgcmVtb3ZpbmcgdGhlIGxhc3QgYXJndW1lbnQgd2hpY2ggaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC5cbiAqL1xuZnVuY3Rpb24gbWlncmF0ZVNlbGVjdFJvb3RFbGVtZW50KG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uKTogdHMuTm9kZSB7XG4gIC8vIFRoZSBvbmx5IHRoaW5nIHdlIG5lZWQgdG8gZG8gaXMgdG8gZHJvcCB0aGUgbGFzdCBhcmd1bWVudFxuICAvLyAoYGRlYnVnSW5mb2ApLCBpZiB0aGUgY29uc3VtZXIgd2FzIHBhc3NpbmcgaXQgaW4uXG4gIGlmIChub2RlLmFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgcmV0dXJuIHRzLnVwZGF0ZUNhbGwobm9kZSwgbm9kZS5leHByZXNzaW9uLCBub2RlLnR5cGVBcmd1bWVudHMsIFtub2RlLmFyZ3VtZW50c1swXV0pO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cbi8qKlxuICogTWlncmF0ZXMgYSBjYWxsIHRvIGBzZXRFbGVtZW50Q2xhc3NgIGVpdGhlciB0byBhIGNhbGwgdG8gYGFkZENsYXNzYCBvciBgcmVtb3ZlQ2xhc3NgLCBvclxuICogdG8gYW4gZXhwcmVzc2lvbiBsaWtlIGBpc0FkZCA/IGFkZENsYXNzKGVsLCBjbGFzc05hbWUpIDogcmVtb3ZlQ2xhc3MoZWwsIGNsYXNzTmFtZSlgLlxuICovXG5mdW5jdGlvbiBtaWdyYXRlU2V0RWxlbWVudENsYXNzKG5vZGU6IFByb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24pOiB0cy5Ob2RlIHtcbiAgLy8gQ2xvbmUgc28gd2UgZG9uJ3QgbXV0YXRlIGJ5IGFjY2lkZW50LiBOb3RlIHRoYXQgd2UgYXNzdW1lIHRoYXRcbiAgLy8gdGhlIHVzZXIncyBjb2RlIGlzIHByb3ZpZGluZyBhbGwgdGhyZWUgcmVxdWlyZWQgYXJndW1lbnRzLlxuICBjb25zdCBvdXRwdXRNZXRob2RBcmdzID0gbm9kZS5hcmd1bWVudHMuc2xpY2UoKTtcbiAgY29uc3QgaXNBZGRBcmd1bWVudCA9IG91dHB1dE1ldGhvZEFyZ3MucG9wKCkhO1xuICBjb25zdCBjcmVhdGVSZW5kZXJlckNhbGwgPSAoaXNBZGQ6IGJvb2xlYW4pID0+IHtcbiAgICBjb25zdCBpbm5lckV4cHJlc3Npb24gPSBub2RlLmV4cHJlc3Npb24uZXhwcmVzc2lvbjtcbiAgICBjb25zdCB0b3BFeHByZXNzaW9uID1cbiAgICAgICAgdHMuY3JlYXRlUHJvcGVydHlBY2Nlc3MoaW5uZXJFeHByZXNzaW9uLCBpc0FkZCA/ICdhZGRDbGFzcycgOiAncmVtb3ZlQ2xhc3MnKTtcbiAgICByZXR1cm4gdHMuY3JlYXRlQ2FsbCh0b3BFeHByZXNzaW9uLCBbXSwgbm9kZS5hcmd1bWVudHMuc2xpY2UoMCwgMikpO1xuICB9O1xuXG4gIC8vIElmIHRoZSBjYWxsIGhhcyB0aGUgYGlzQWRkYCBhcmd1bWVudCBhcyBhIGxpdGVyYWwgYm9vbGVhbiwgd2UgY2FuIG1hcCBpdCBkaXJlY3RseSB0b1xuICAvLyBgYWRkQ2xhc3NgIG9yIGByZW1vdmVDbGFzc2AuIE5vdGUgdGhhdCB3ZSBjYW4ndCB1c2UgdGhlIHR5cGUgY2hlY2tlciBoZXJlLCBiZWNhdXNlIGl0XG4gIC8vIHdvbid0IHRlbGwgdXMgd2hldGhlciB0aGUgdmFsdWUgcmVzb2x2ZXMgdG8gdHJ1ZSBvciBmYWxzZS5cbiAgaWYgKGlzQWRkQXJndW1lbnQua2luZCA9PT0gdHMuU3ludGF4S2luZC5UcnVlS2V5d29yZCB8fFxuICAgICAgaXNBZGRBcmd1bWVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLkZhbHNlS2V5d29yZCkge1xuICAgIHJldHVybiBjcmVhdGVSZW5kZXJlckNhbGwoaXNBZGRBcmd1bWVudC5raW5kID09PSB0cy5TeW50YXhLaW5kLlRydWVLZXl3b3JkKTtcbiAgfVxuXG4gIC8vIE90aGVyd2lzZSBjcmVhdGUgYSB0ZXJuYXJ5IG9uIHRoZSB2YXJpYWJsZS5cbiAgcmV0dXJuIHRzLmNyZWF0ZUNvbmRpdGlvbmFsKGlzQWRkQXJndW1lbnQsIGNyZWF0ZVJlbmRlcmVyQ2FsbCh0cnVlKSwgY3JlYXRlUmVuZGVyZXJDYWxsKGZhbHNlKSk7XG59XG5cbi8qKlxuICogTWlncmF0ZXMgYSBjYWxsIHRvIGBzZXRFbGVtZW50U3R5bGVgIGNhbGwgZWl0aGVyIHRvIGEgY2FsbCB0b1xuICogYHNldFN0eWxlYCBvciBgcmVtb3ZlU3R5bGVgLiBvciB0byBhbiBleHByZXNzaW9uIGxpa2VcbiAqIGB2YWx1ZSA9PSBudWxsID8gcmVtb3ZlU3R5bGUoZWwsIGtleSkgOiBzZXRTdHlsZShlbCwga2V5LCB2YWx1ZSlgLlxuICovXG5mdW5jdGlvbiBtaWdyYXRlU2V0RWxlbWVudFN0eWxlKFxuICAgIG5vZGU6IFByb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24sIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcik6IHRzLk5vZGUge1xuICBjb25zdCBhcmdzID0gbm9kZS5hcmd1bWVudHM7XG4gIGNvbnN0IGFkZE1ldGhvZE5hbWUgPSAnc2V0U3R5bGUnO1xuICBjb25zdCByZW1vdmVNZXRob2ROYW1lID0gJ3JlbW92ZVN0eWxlJztcbiAgY29uc3QgbGFzdEFyZ1R5cGUgPSBhcmdzWzJdID9cbiAgICAgIHR5cGVDaGVja2VyLnR5cGVUb1N0cmluZyhcbiAgICAgICAgICB0eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihhcmdzWzJdKSwgbm9kZSwgdHMuVHlwZUZvcm1hdEZsYWdzLkFkZFVuZGVmaW5lZCkgOlxuICAgICAgbnVsbDtcblxuICAvLyBOb3RlIHRoYXQgZm9yIGEgbGl0ZXJhbCBudWxsLCBUUyBjb25zaWRlcnMgaXQgYSBgTnVsbEtleXdvcmRgLFxuICAvLyB3aGVyZWFzIGEgbGl0ZXJhbCBgdW5kZWZpbmVkYCBpcyBqdXN0IGFuIElkZW50aWZpZXIuXG4gIGlmIChhcmdzLmxlbmd0aCA9PT0gMiB8fCBsYXN0QXJnVHlwZSA9PT0gJ251bGwnIHx8IGxhc3RBcmdUeXBlID09PSAndW5kZWZpbmVkJykge1xuICAgIC8vIElmIHdlJ3ZlIGdvdCBhIGNhbGwgd2l0aCB0d28gYXJndW1lbnRzLCBvciBvbmUgd2l0aCB0aHJlZSBhcmd1bWVudHMgd2hlcmUgdGhlIGxhc3Qgb25lIGlzXG4gICAgLy8gYHVuZGVmaW5lZGAgb3IgYG51bGxgLCB3ZSBjYW4gc2FmZWx5IHN3aXRjaCB0byBhIGByZW1vdmVTdHlsZWAgY2FsbC5cbiAgICBjb25zdCBpbm5lckV4cHJlc3Npb24gPSBub2RlLmV4cHJlc3Npb24uZXhwcmVzc2lvbjtcbiAgICBjb25zdCB0b3BFeHByZXNzaW9uID0gdHMuY3JlYXRlUHJvcGVydHlBY2Nlc3MoaW5uZXJFeHByZXNzaW9uLCByZW1vdmVNZXRob2ROYW1lKTtcbiAgICByZXR1cm4gdHMuY3JlYXRlQ2FsbCh0b3BFeHByZXNzaW9uLCBbXSwgYXJncy5zbGljZSgwLCAyKSk7XG4gIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDMpIHtcbiAgICAvLyBXZSBuZWVkIHRoZSBjaGVja3MgZm9yIHN0cmluZyBsaXRlcmFscywgYmVjYXVzZSB0aGUgdHlwZSBvZiBzb21ldGhpbmdcbiAgICAvLyBsaWtlIGBcImJsdWVcImAgaXMgdGhlIGxpdGVyYWwgYGJsdWVgLCBub3QgYHN0cmluZ2AuXG4gICAgaWYgKGxhc3RBcmdUeXBlID09PSAnc3RyaW5nJyB8fCBsYXN0QXJnVHlwZSA9PT0gJ251bWJlcicgfHwgdHMuaXNTdHJpbmdMaXRlcmFsKGFyZ3NbMl0pIHx8XG4gICAgICAgIHRzLmlzTm9TdWJzdGl0dXRpb25UZW1wbGF0ZUxpdGVyYWwoYXJnc1syXSkgfHwgdHMuaXNOdW1lcmljTGl0ZXJhbChhcmdzWzJdKSkge1xuICAgICAgLy8gSWYgd2UndmUgZ290IHRocmVlIGFyZ3VtZW50cyBhbmQgdGhlIGxhc3Qgb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgb3IgYSBudW1iZXIsIHdlXG4gICAgICAvLyBjYW4gc2FmZWx5IHJlbmFtZSB0byBgc2V0U3R5bGVgLlxuICAgICAgcmV0dXJuIHJlbmFtZU1ldGhvZENhbGwobm9kZSwgYWRkTWV0aG9kTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBtaWdyYXRlIHRvIGEgdGVybmFyeSB0aGF0IGxvb2tzIGxpa2U6XG4gICAgICAvLyBgdmFsdWUgPT0gbnVsbCA/IHJlbW92ZVN0eWxlKGVsLCBrZXkpIDogc2V0U3R5bGUoZWwsIGtleSwgdmFsdWUpYFxuICAgICAgY29uc3QgY29uZGl0aW9uID0gdHMuY3JlYXRlQmluYXJ5KGFyZ3NbMl0sIHRzLlN5bnRheEtpbmQuRXF1YWxzRXF1YWxzVG9rZW4sIHRzLmNyZWF0ZU51bGwoKSk7XG4gICAgICBjb25zdCB3aGVuTnVsbENhbGwgPSByZW5hbWVNZXRob2RDYWxsKFxuICAgICAgICAgIHRzLmNyZWF0ZUNhbGwobm9kZS5leHByZXNzaW9uLCBbXSwgYXJncy5zbGljZSgwLCAyKSkgYXMgUHJvcGVydHlBY2Nlc3NDYWxsRXhwcmVzc2lvbixcbiAgICAgICAgICByZW1vdmVNZXRob2ROYW1lKTtcbiAgICAgIHJldHVybiB0cy5jcmVhdGVDb25kaXRpb25hbChjb25kaXRpb24sIHdoZW5OdWxsQ2FsbCwgcmVuYW1lTWV0aG9kQ2FsbChub2RlLCBhZGRNZXRob2ROYW1lKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cbi8qKlxuICogTWlncmF0ZXMgYSBjYWxsIHRvIGBpbnZva2VFbGVtZW50TWV0aG9kKHRhcmdldCwgbWV0aG9kLCBbYXJnMSwgYXJnMl0pYCBlaXRoZXIgdG9cbiAqIGB0YXJnZXQubWV0aG9kKGFyZzEsIGFyZzIpYCBvciBgKHRhcmdldCBhcyBhbnkpW21ldGhvZF0uYXBwbHkodGFyZ2V0LCBbYXJnMSwgYXJnMl0pYC5cbiAqL1xuZnVuY3Rpb24gbWlncmF0ZUludm9rZUVsZW1lbnRNZXRob2Qobm9kZTogdHMuQ2FsbEV4cHJlc3Npb24pOiB0cy5Ob2RlIHtcbiAgY29uc3QgW3RhcmdldCwgbmFtZSwgYXJnc10gPSBub2RlLmFyZ3VtZW50cztcbiAgY29uc3QgaXNOYW1lU3RhdGljID0gdHMuaXNTdHJpbmdMaXRlcmFsKG5hbWUpIHx8IHRzLmlzTm9TdWJzdGl0dXRpb25UZW1wbGF0ZUxpdGVyYWwobmFtZSk7XG4gIGNvbnN0IGlzQXJnc1N0YXRpYyA9ICFhcmdzIHx8IHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbihhcmdzKTtcblxuICBpZiAoaXNOYW1lU3RhdGljICYmIGlzQXJnc1N0YXRpYykge1xuICAgIC8vIElmIHRoZSBuYW1lIGlzIGEgc3RhdGljIHN0cmluZyBhbmQgdGhlIGFyZ3VtZW50cyBhcmUgYW4gYXJyYXkgbGl0ZXJhbCxcbiAgICAvLyB3ZSBjYW4gc2FmZWx5IGNvbnZlcnQgdGhlIG5vZGUgaW50byBhIGNhbGwgZXhwcmVzc2lvbi5cbiAgICBjb25zdCBleHByZXNzaW9uID0gdHMuY3JlYXRlUHJvcGVydHlBY2Nlc3MoXG4gICAgICAgIHRhcmdldCwgKG5hbWUgYXMgdHMuU3RyaW5nTGl0ZXJhbCB8IHRzLk5vU3Vic3RpdHV0aW9uVGVtcGxhdGVMaXRlcmFsKS50ZXh0KTtcbiAgICBjb25zdCBjYWxsQXJndW1lbnRzID0gYXJncyA/IChhcmdzIGFzIHRzLkFycmF5TGl0ZXJhbEV4cHJlc3Npb24pLmVsZW1lbnRzIDogW107XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUNhbGwoZXhwcmVzc2lvbiwgW10sIGNhbGxBcmd1bWVudHMpO1xuICB9IGVsc2Uge1xuICAgIC8vIE90aGVyd2lzZSBjcmVhdGUgYW4gZXhwcmVzc2lvbiBpbiB0aGUgZm9ybSBvZiBgKHRhcmdldCBhcyBhbnkpW25hbWVdLmFwcGx5KHRhcmdldCwgYXJncylgLlxuICAgIGNvbnN0IGFzRXhwcmVzc2lvbiA9IHRzLmNyZWF0ZVBhcmVuKFxuICAgICAgICB0cy5jcmVhdGVBc0V4cHJlc3Npb24odGFyZ2V0LCB0cy5jcmVhdGVLZXl3b3JkVHlwZU5vZGUodHMuU3ludGF4S2luZC5BbnlLZXl3b3JkKSkpO1xuICAgIGNvbnN0IGVsZW1lbnRBY2Nlc3MgPSB0cy5jcmVhdGVFbGVtZW50QWNjZXNzKGFzRXhwcmVzc2lvbiwgbmFtZSk7XG4gICAgY29uc3QgYXBwbHlFeHByZXNzaW9uID0gdHMuY3JlYXRlUHJvcGVydHlBY2Nlc3MoZWxlbWVudEFjY2VzcywgJ2FwcGx5Jyk7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUNhbGwoYXBwbHlFeHByZXNzaW9uLCBbXSwgYXJncyA/IFt0YXJnZXQsIGFyZ3NdIDogW3RhcmdldF0pO1xuICB9XG59XG5cbi8qKiBNaWdyYXRlcyBhIGNhbGwgdG8gYGNyZWF0ZVZpZXdSb290YCB0byB3aGF0ZXZlciBub2RlIHdhcyBwYXNzZWQgaW4gYXMgdGhlIGZpcnN0IGFyZ3VtZW50LiAqL1xuZnVuY3Rpb24gbWlncmF0ZUNyZWF0ZVZpZXdSb290KG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uKTogdHMuTm9kZSB7XG4gIHJldHVybiBub2RlLmFyZ3VtZW50c1swXTtcbn1cblxuLyoqIE1pZ3JhdGVzIGEgY2FsbCB0byBgbWlncmF0ZWAgYSBkaXJlY3QgY2FsbCB0byB0aGUgaGVscGVyLiAqL1xuZnVuY3Rpb24gbWlncmF0ZUFuaW1hdGVDYWxsKCkge1xuICByZXR1cm4gdHMuY3JlYXRlQ2FsbCh0cy5jcmVhdGVJZGVudGlmaWVyKEhlbHBlckZ1bmN0aW9uLmFuaW1hdGUpLCBbXSwgW10pO1xufVxuXG4vKipcbiAqIFN3aXRjaGVzIG91dCBhIGNhbGwgdG8gdGhlIGBSZW5kZXJlcmAgdG8gYSBjYWxsIHRvIG9uZSBvZiBvdXIgaGVscGVyIGZ1bmN0aW9ucy5cbiAqIE1vc3Qgb2YgdGhlIGhlbHBlcnMgYWNjZXB0IGFuIGluc3RhbmNlIG9mIGBSZW5kZXJlcjJgIGFzIHRoZSBmaXJzdCBhcmd1bWVudCBhbmQgYWxsXG4gKiBzdWJzZXF1ZW50IGFyZ3VtZW50cyBkaWZmZXIuXG4gKiBAcGFyYW0gbm9kZSBOb2RlIG9mIHRoZSBvcmlnaW5hbCBtZXRob2QgY2FsbC5cbiAqIEBwYXJhbSBoZWxwZXIgTmFtZSBvZiB0aGUgaGVscGVyIHdpdGggd2hpY2ggdG8gcmVwbGFjZSB0aGUgb3JpZ2luYWwgY2FsbC5cbiAqIEBwYXJhbSBhcmdzIEFyZ3VtZW50cyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgaW50byB0aGUgaGVscGVyIGFmdGVyIHRoZSByZW5kZXJlciBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gc3dpdGNoVG9IZWxwZXJDYWxsKFxuICAgIG5vZGU6IFByb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24sIGhlbHBlcjogSGVscGVyRnVuY3Rpb24sXG4gICAgYXJnczogdHMuRXhwcmVzc2lvbltdfHRzLk5vZGVBcnJheTx0cy5FeHByZXNzaW9uPik6IHRzLk5vZGUge1xuICByZXR1cm4gdHMuY3JlYXRlQ2FsbCh0cy5jcmVhdGVJZGVudGlmaWVyKGhlbHBlciksIFtdLCBbbm9kZS5leHByZXNzaW9uLmV4cHJlc3Npb24sIC4uLmFyZ3NdKTtcbn1cbiJdfQ==