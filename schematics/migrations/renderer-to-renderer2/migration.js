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
        define("@angular/core/schematics/migrations/renderer-to-renderer2/migration", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateExpression = exports.replaceImport = void 0;
    const ts = require("typescript");
    /** Replaces an import inside an import statement with a different one. */
    function replaceImport(node, existingImport, newImportName) {
        const isAlreadyImported = node.elements.find(element => {
            const { name, propertyName } = element;
            return propertyName ? propertyName.text === newImportName : name.text === newImportName;
        });
        if (isAlreadyImported) {
            return node;
        }
        return ts.updateNamedImports(node, [
            ...node.elements.filter(current => current !== existingImport),
            // Create a new import while trying to preserve the alias of the old one.
            ts.createImportSpecifier(existingImport.propertyName ? ts.createIdentifier(newImportName) : undefined, existingImport.propertyName ? existingImport.name : ts.createIdentifier(newImportName))
        ]);
    }
    exports.replaceImport = replaceImport;
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
        return ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression);
    }
    /** Renames a method call while keeping all of the parameters in place. */
    function renameMethodCall(node, newName) {
        const newExpression = ts.updatePropertyAccess(node.expression, node.expression.expression, ts.createIdentifier(newName));
        return ts.updateCall(node, newExpression, node.typeArguments, node.arguments);
    }
    /**
     * Migrates a `selectRootElement` call by removing the last argument which is no longer supported.
     */
    function migrateSelectRootElement(node) {
        // The only thing we need to do is to drop the last argument
        // (`debugInfo`), if the consumer was passing it in.
        if (node.arguments.length > 1) {
            return ts.updateCall(node, node.expression, node.typeArguments, [node.arguments[0]]);
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
            const topExpression = ts.createPropertyAccess(innerExpression, isAdd ? 'addClass' : 'removeClass');
            return ts.createCall(topExpression, [], node.arguments.slice(0, 2));
        };
        // If the call has the `isAdd` argument as a literal boolean, we can map it directly to
        // `addClass` or `removeClass`. Note that we can't use the type checker here, because it
        // won't tell us whether the value resolves to true or false.
        if (isAddArgument.kind === ts.SyntaxKind.TrueKeyword ||
            isAddArgument.kind === ts.SyntaxKind.FalseKeyword) {
            return createRendererCall(isAddArgument.kind === ts.SyntaxKind.TrueKeyword);
        }
        // Otherwise create a ternary on the variable.
        return ts.createConditional(isAddArgument, createRendererCall(true), createRendererCall(false));
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
            typeChecker.typeToString(typeChecker.getTypeAtLocation(args[2]), node, ts.TypeFormatFlags.AddUndefined) :
            null;
        // Note that for a literal null, TS considers it a `NullKeyword`,
        // whereas a literal `undefined` is just an Identifier.
        if (args.length === 2 || lastArgType === 'null' || lastArgType === 'undefined') {
            // If we've got a call with two arguments, or one with three arguments where the last one is
            // `undefined` or `null`, we can safely switch to a `removeStyle` call.
            const innerExpression = node.expression.expression;
            const topExpression = ts.createPropertyAccess(innerExpression, removeMethodName);
            return ts.createCall(topExpression, [], args.slice(0, 2));
        }
        else if (args.length === 3) {
            // We need the checks for string literals, because the type of something
            // like `"blue"` is the literal `blue`, not `string`.
            if (lastArgType === 'string' || lastArgType === 'number' || ts.isStringLiteral(args[2]) ||
                ts.isNoSubstitutionTemplateLiteral(args[2]) || ts.isNumericLiteral(args[2])) {
                // If we've got three arguments and the last one is a string literal or a number, we
                // can safely rename to `setStyle`.
                return renameMethodCall(node, addMethodName);
            }
            else {
                // Otherwise migrate to a ternary that looks like:
                // `value == null ? removeStyle(el, key) : setStyle(el, key, value)`
                const condition = ts.createBinary(args[2], ts.SyntaxKind.EqualsEqualsToken, ts.createNull());
                const whenNullCall = renameMethodCall(ts.createCall(node.expression, [], args.slice(0, 2)), removeMethodName);
                return ts.createConditional(condition, whenNullCall, renameMethodCall(node, addMethodName));
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
        const isNameStatic = ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name);
        const isArgsStatic = !args || ts.isArrayLiteralExpression(args);
        if (isNameStatic && isArgsStatic) {
            // If the name is a static string and the arguments are an array literal,
            // we can safely convert the node into a call expression.
            const expression = ts.createPropertyAccess(target, name.text);
            const callArguments = args ? args.elements : [];
            return ts.createCall(expression, [], callArguments);
        }
        else {
            // Otherwise create an expression in the form of `(target as any)[name].apply(target, args)`.
            const asExpression = ts.createParen(ts.createAsExpression(target, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)));
            const elementAccess = ts.createElementAccess(asExpression, name);
            const applyExpression = ts.createPropertyAccess(elementAccess, 'apply');
            return ts.createCall(applyExpression, [], args ? [target, args] : [target]);
        }
    }
    /** Migrates a call to `createViewRoot` to whatever node was passed in as the first argument. */
    function migrateCreateViewRoot(node) {
        return node.arguments[0];
    }
    /** Migrates a call to `migrate` a direct call to the helper. */
    function migrateAnimateCall() {
        return ts.createCall(ts.createIdentifier("__ngRendererAnimateHelper" /* animate */), [], []);
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
        return ts.createCall(ts.createIdentifier(helper), [], [node.expression.expression, ...args]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvcmVuZGVyZXItdG8tcmVuZGVyZXIyL21pZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFPakMsMEVBQTBFO0lBQzFFLFNBQWdCLGFBQWEsQ0FDekIsSUFBcUIsRUFBRSxjQUFrQyxFQUFFLGFBQXFCO1FBQ2xGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDckQsTUFBTSxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUMsR0FBRyxPQUFPLENBQUM7WUFDckMsT0FBTyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGFBQWEsQ0FBQztRQUMxRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksaUJBQWlCLEVBQUU7WUFDckIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRTtZQUNqQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxLQUFLLGNBQWMsQ0FBQztZQUM5RCx5RUFBeUU7WUFDekUsRUFBRSxDQUFDLHFCQUFxQixDQUNwQixjQUFjLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFDNUUsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQzVGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFsQkQsc0NBa0JDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsSUFBdUIsRUFBRSxXQUEyQjtRQUVwRixJQUFJLDhCQUE4QixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hDLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ3RDLEtBQUssb0JBQW9CO29CQUN2QixPQUFPLEVBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsRUFBQyxDQUFDO2dCQUN2RCxLQUFLLFNBQVM7b0JBQ1osT0FBTyxFQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLEVBQUMsQ0FBQztnQkFDcEQsS0FBSyxjQUFjO29CQUNqQixPQUFPLEVBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBQyxDQUFDO2dCQUNsRCxLQUFLLG1CQUFtQjtvQkFDdEIsT0FBTyxFQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDO2dCQUNoRCxLQUFLLGlCQUFpQjtvQkFDcEIsT0FBTyxFQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDO2dCQUM5QyxLQUFLLGlCQUFpQjtvQkFDcEIsT0FBTyxFQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLEVBQUMsQ0FBQztnQkFDM0QsS0FBSyxxQkFBcUI7b0JBQ3hCLE9BQU8sRUFBQyxJQUFJLEVBQUUsMEJBQTBCLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQztnQkFDbEQsS0FBSyxxQkFBcUI7b0JBQ3hCLE9BQU8sRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUM7Z0JBQ3RCLEtBQUssZ0JBQWdCO29CQUNuQixPQUFPLEVBQUMsSUFBSSxFQUFFLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFDLENBQUM7Z0JBQzdDLEtBQUsscUJBQXFCO29CQUN4QixPQUFPO3dCQUNMLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLHFFQUFzQyxJQUFJLENBQUMsU0FBUyxDQUFDO3dCQUNsRixlQUFlLEVBQUU7O3lCQUVoQjtxQkFDRixDQUFDO2dCQUNKLEtBQUssZUFBZTtvQkFDbEIsT0FBTzt3QkFDTCxJQUFJLEVBQUUsa0JBQWtCLENBQUMsSUFBSSx5REFBZ0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN4RixlQUFlLEVBQ1gsd0pBQWlGO3FCQUN0RixDQUFDO2dCQUNKLEtBQUssWUFBWTtvQkFDZixPQUFPO3dCQUNMLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLG1EQUE2QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3JGLGVBQWUsRUFBRSx5RkFBK0M7cUJBQ2pFLENBQUM7Z0JBQ0osS0FBSyxzQkFBc0I7b0JBQ3pCLE9BQU87d0JBQ0wsSUFBSSxFQUFFLGtCQUFrQixDQUNwQixJQUFJLHVFQUF1QyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQzFFLGVBQWUsRUFBRSw2R0FBeUQ7cUJBQzNFLENBQUM7Z0JBQ0osS0FBSyxjQUFjO29CQUNqQixPQUFPO3dCQUNMLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLHVEQUErQixJQUFJLENBQUMsU0FBUyxDQUFDO3dCQUMzRSxlQUFlLEVBQUUsNkZBQWlEO3FCQUNuRSxDQUFDO2dCQUNKLEtBQUssU0FBUztvQkFDWixPQUFPO3dCQUNMLElBQUksRUFBRSxrQkFBa0IsRUFBRTt3QkFDMUIsZUFBZSxFQUFFLG1GQUE0QztxQkFDOUQsQ0FBQztnQkFDSixLQUFLLGFBQWE7b0JBQ2hCLE9BQU87d0JBQ0wsSUFBSSxFQUFFLGtCQUFrQixDQUFDLElBQUkscURBQThCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUMvRSxlQUFlLEVBQUUsMkZBQWdEO3FCQUNsRSxDQUFDO2dCQUNKLEtBQUssWUFBWTtvQkFDZixPQUFPO3dCQUNMLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLG1EQUE2QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDOUUsZUFBZSxFQUFFLHlGQUErQztxQkFDakUsQ0FBQztnQkFDSixLQUFLLGlCQUFpQjtvQkFDcEIsT0FBTzt3QkFDTCxJQUFJLEVBQUUsa0JBQWtCLENBQUMsSUFBSSw2REFBa0MsSUFBSSxDQUFDLFNBQVMsQ0FBQzt3QkFDOUUsZUFBZSxFQUFFLG1HQUFvRDtxQkFDdEUsQ0FBQzthQUNMO1NBQ0Y7UUFFRCxPQUFPLEVBQUMsSUFBSSxFQUFDLENBQUM7SUFDaEIsQ0FBQztJQTNFRCw4Q0EyRUM7SUFFRCwyREFBMkQ7SUFDM0QsU0FBUyw4QkFBOEIsQ0FBQyxJQUFhO1FBQ25ELE9BQU8sRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUVELDBFQUEwRTtJQUMxRSxTQUFTLGdCQUFnQixDQUFDLElBQWtDLEVBQUUsT0FBZTtRQUMzRSxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQ3pDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFL0UsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUyx3QkFBd0IsQ0FBQyxJQUF1QjtRQUN2RCw0REFBNEQ7UUFDNUQsb0RBQW9EO1FBQ3BELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzdCLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdEY7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLHNCQUFzQixDQUFDLElBQWtDO1FBQ2hFLGlFQUFpRTtRQUNqRSw2REFBNkQ7UUFDN0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hELE1BQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsRUFBRyxDQUFDO1FBQzlDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxLQUFjLEVBQUUsRUFBRTtZQUM1QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQztZQUNuRCxNQUFNLGFBQWEsR0FDZixFQUFFLENBQUMsb0JBQW9CLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNqRixPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RSxDQUFDLENBQUM7UUFFRix1RkFBdUY7UUFDdkYsd0ZBQXdGO1FBQ3hGLDZEQUE2RDtRQUM3RCxJQUFJLGFBQWEsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXO1lBQ2hELGFBQWEsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUU7WUFDckQsT0FBTyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDN0U7UUFFRCw4Q0FBOEM7UUFDOUMsT0FBTyxFQUFFLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDbEcsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFTLHNCQUFzQixDQUMzQixJQUFrQyxFQUFFLFdBQTJCO1FBQ2pFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDNUIsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDO1FBQ2pDLE1BQU0sZ0JBQWdCLEdBQUcsYUFBYSxDQUFDO1FBQ3ZDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLFdBQVcsQ0FBQyxZQUFZLENBQ3BCLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLElBQUksQ0FBQztRQUVULGlFQUFpRTtRQUNqRSx1REFBdUQ7UUFDdkQsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxXQUFXLEtBQUssTUFBTSxJQUFJLFdBQVcsS0FBSyxXQUFXLEVBQUU7WUFDOUUsNEZBQTRGO1lBQzVGLHVFQUF1RTtZQUN2RSxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQztZQUNuRCxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDakYsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMzRDthQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDNUIsd0VBQXdFO1lBQ3hFLHFEQUFxRDtZQUNyRCxJQUFJLFdBQVcsS0FBSyxRQUFRLElBQUksV0FBVyxLQUFLLFFBQVEsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkYsRUFBRSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDL0Usb0ZBQW9GO2dCQUNwRixtQ0FBbUM7Z0JBQ25DLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQzlDO2lCQUFNO2dCQUNMLGtEQUFrRDtnQkFDbEQsb0VBQW9FO2dCQUNwRSxNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO2dCQUM3RixNQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FDakMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBaUMsRUFDcEYsZ0JBQWdCLENBQUMsQ0FBQztnQkFDdEIsT0FBTyxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQzthQUM3RjtTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUywwQkFBMEIsQ0FBQyxJQUF1QjtRQUN6RCxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzVDLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFGLE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVoRSxJQUFJLFlBQVksSUFBSSxZQUFZLEVBQUU7WUFDaEMseUVBQXlFO1lBQ3pFLHlEQUF5RDtZQUN6RCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQ3RDLE1BQU0sRUFBRyxJQUE0RCxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUUsSUFBa0MsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMvRSxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztTQUNyRDthQUFNO1lBQ0wsNkZBQTZGO1lBQzdGLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQy9CLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakUsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN4RSxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7U0FDN0U7SUFDSCxDQUFDO0lBRUQsZ0dBQWdHO0lBQ2hHLFNBQVMscUJBQXFCLENBQUMsSUFBdUI7UUFDcEQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxnRUFBZ0U7SUFDaEUsU0FBUyxrQkFBa0I7UUFDekIsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsMkNBQXdCLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsU0FBUyxrQkFBa0IsQ0FDdkIsSUFBa0MsRUFBRSxNQUFzQixFQUMxRCxJQUFpRDtRQUNuRCxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0hlbHBlckZ1bmN0aW9ufSBmcm9tICcuL2hlbHBlcnMnO1xuXG4vKiogQSBjYWxsIGV4cHJlc3Npb24gdGhhdCBpcyBiYXNlZCBvbiBhIHByb3BlcnR5IGFjY2Vzcy4gKi9cbnR5cGUgUHJvcGVydHlBY2Nlc3NDYWxsRXhwcmVzc2lvbiA9IHRzLkNhbGxFeHByZXNzaW9uJntleHByZXNzaW9uOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb259O1xuXG4vKiogUmVwbGFjZXMgYW4gaW1wb3J0IGluc2lkZSBhbiBpbXBvcnQgc3RhdGVtZW50IHdpdGggYSBkaWZmZXJlbnQgb25lLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VJbXBvcnQoXG4gICAgbm9kZTogdHMuTmFtZWRJbXBvcnRzLCBleGlzdGluZ0ltcG9ydDogdHMuSW1wb3J0U3BlY2lmaWVyLCBuZXdJbXBvcnROYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgaXNBbHJlYWR5SW1wb3J0ZWQgPSBub2RlLmVsZW1lbnRzLmZpbmQoZWxlbWVudCA9PiB7XG4gICAgY29uc3Qge25hbWUsIHByb3BlcnR5TmFtZX0gPSBlbGVtZW50O1xuICAgIHJldHVybiBwcm9wZXJ0eU5hbWUgPyBwcm9wZXJ0eU5hbWUudGV4dCA9PT0gbmV3SW1wb3J0TmFtZSA6IG5hbWUudGV4dCA9PT0gbmV3SW1wb3J0TmFtZTtcbiAgfSk7XG5cbiAgaWYgKGlzQWxyZWFkeUltcG9ydGVkKSB7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICByZXR1cm4gdHMudXBkYXRlTmFtZWRJbXBvcnRzKG5vZGUsIFtcbiAgICAuLi5ub2RlLmVsZW1lbnRzLmZpbHRlcihjdXJyZW50ID0+IGN1cnJlbnQgIT09IGV4aXN0aW5nSW1wb3J0KSxcbiAgICAvLyBDcmVhdGUgYSBuZXcgaW1wb3J0IHdoaWxlIHRyeWluZyB0byBwcmVzZXJ2ZSB0aGUgYWxpYXMgb2YgdGhlIG9sZCBvbmUuXG4gICAgdHMuY3JlYXRlSW1wb3J0U3BlY2lmaWVyKFxuICAgICAgICBleGlzdGluZ0ltcG9ydC5wcm9wZXJ0eU5hbWUgPyB0cy5jcmVhdGVJZGVudGlmaWVyKG5ld0ltcG9ydE5hbWUpIDogdW5kZWZpbmVkLFxuICAgICAgICBleGlzdGluZ0ltcG9ydC5wcm9wZXJ0eU5hbWUgPyBleGlzdGluZ0ltcG9ydC5uYW1lIDogdHMuY3JlYXRlSWRlbnRpZmllcihuZXdJbXBvcnROYW1lKSlcbiAgXSk7XG59XG5cbi8qKlxuICogTWlncmF0ZXMgYSBmdW5jdGlvbiBjYWxsIGV4cHJlc3Npb24gZnJvbSBgUmVuZGVyZXJgIHRvIGBSZW5kZXJlcjJgLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBleHByZXNzaW9uIHNob3VsZCBiZSBkcm9wcGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZUV4cHJlc3Npb24obm9kZTogdHMuQ2FsbEV4cHJlc3Npb24sIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcik6XG4gICAge25vZGU6IHRzLk5vZGV8bnVsbCwgcmVxdWlyZWRIZWxwZXJzPzogSGVscGVyRnVuY3Rpb25bXX0ge1xuICBpZiAoaXNQcm9wZXJ0eUFjY2Vzc0NhbGxFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgc3dpdGNoIChub2RlLmV4cHJlc3Npb24ubmFtZS5nZXRUZXh0KCkpIHtcbiAgICAgIGNhc2UgJ3NldEVsZW1lbnRQcm9wZXJ0eSc6XG4gICAgICAgIHJldHVybiB7bm9kZTogcmVuYW1lTWV0aG9kQ2FsbChub2RlLCAnc2V0UHJvcGVydHknKX07XG4gICAgICBjYXNlICdzZXRUZXh0JzpcbiAgICAgICAgcmV0dXJuIHtub2RlOiByZW5hbWVNZXRob2RDYWxsKG5vZGUsICdzZXRWYWx1ZScpfTtcbiAgICAgIGNhc2UgJ2xpc3Rlbkdsb2JhbCc6XG4gICAgICAgIHJldHVybiB7bm9kZTogcmVuYW1lTWV0aG9kQ2FsbChub2RlLCAnbGlzdGVuJyl9O1xuICAgICAgY2FzZSAnc2VsZWN0Um9vdEVsZW1lbnQnOlxuICAgICAgICByZXR1cm4ge25vZGU6IG1pZ3JhdGVTZWxlY3RSb290RWxlbWVudChub2RlKX07XG4gICAgICBjYXNlICdzZXRFbGVtZW50Q2xhc3MnOlxuICAgICAgICByZXR1cm4ge25vZGU6IG1pZ3JhdGVTZXRFbGVtZW50Q2xhc3Mobm9kZSl9O1xuICAgICAgY2FzZSAnc2V0RWxlbWVudFN0eWxlJzpcbiAgICAgICAgcmV0dXJuIHtub2RlOiBtaWdyYXRlU2V0RWxlbWVudFN0eWxlKG5vZGUsIHR5cGVDaGVja2VyKX07XG4gICAgICBjYXNlICdpbnZva2VFbGVtZW50TWV0aG9kJzpcbiAgICAgICAgcmV0dXJuIHtub2RlOiBtaWdyYXRlSW52b2tlRWxlbWVudE1ldGhvZChub2RlKX07XG4gICAgICBjYXNlICdzZXRCaW5kaW5nRGVidWdJbmZvJzpcbiAgICAgICAgcmV0dXJuIHtub2RlOiBudWxsfTtcbiAgICAgIGNhc2UgJ2NyZWF0ZVZpZXdSb290JzpcbiAgICAgICAgcmV0dXJuIHtub2RlOiBtaWdyYXRlQ3JlYXRlVmlld1Jvb3Qobm9kZSl9O1xuICAgICAgY2FzZSAnc2V0RWxlbWVudEF0dHJpYnV0ZSc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogc3dpdGNoVG9IZWxwZXJDYWxsKG5vZGUsIEhlbHBlckZ1bmN0aW9uLnNldEVsZW1lbnRBdHRyaWJ1dGUsIG5vZGUuYXJndW1lbnRzKSxcbiAgICAgICAgICByZXF1aXJlZEhlbHBlcnM6IFtcbiAgICAgICAgICAgIEhlbHBlckZ1bmN0aW9uLmFueSwgSGVscGVyRnVuY3Rpb24uc3BsaXROYW1lc3BhY2UsIEhlbHBlckZ1bmN0aW9uLnNldEVsZW1lbnRBdHRyaWJ1dGVcbiAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgICBjYXNlICdjcmVhdGVFbGVtZW50JzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBzd2l0Y2hUb0hlbHBlckNhbGwobm9kZSwgSGVscGVyRnVuY3Rpb24uY3JlYXRlRWxlbWVudCwgbm9kZS5hcmd1bWVudHMuc2xpY2UoMCwgMikpLFxuICAgICAgICAgIHJlcXVpcmVkSGVscGVyczpcbiAgICAgICAgICAgICAgW0hlbHBlckZ1bmN0aW9uLmFueSwgSGVscGVyRnVuY3Rpb24uc3BsaXROYW1lc3BhY2UsIEhlbHBlckZ1bmN0aW9uLmNyZWF0ZUVsZW1lbnRdXG4gICAgICAgIH07XG4gICAgICBjYXNlICdjcmVhdGVUZXh0JzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBzd2l0Y2hUb0hlbHBlckNhbGwobm9kZSwgSGVscGVyRnVuY3Rpb24uY3JlYXRlVGV4dCwgbm9kZS5hcmd1bWVudHMuc2xpY2UoMCwgMikpLFxuICAgICAgICAgIHJlcXVpcmVkSGVscGVyczogW0hlbHBlckZ1bmN0aW9uLmFueSwgSGVscGVyRnVuY3Rpb24uY3JlYXRlVGV4dF1cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ2NyZWF0ZVRlbXBsYXRlQW5jaG9yJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBub2RlOiBzd2l0Y2hUb0hlbHBlckNhbGwoXG4gICAgICAgICAgICAgIG5vZGUsIEhlbHBlckZ1bmN0aW9uLmNyZWF0ZVRlbXBsYXRlQW5jaG9yLCBub2RlLmFyZ3VtZW50cy5zbGljZSgwLCAxKSksXG4gICAgICAgICAgcmVxdWlyZWRIZWxwZXJzOiBbSGVscGVyRnVuY3Rpb24uYW55LCBIZWxwZXJGdW5jdGlvbi5jcmVhdGVUZW1wbGF0ZUFuY2hvcl1cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ3Byb2plY3ROb2Rlcyc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogc3dpdGNoVG9IZWxwZXJDYWxsKG5vZGUsIEhlbHBlckZ1bmN0aW9uLnByb2plY3ROb2Rlcywgbm9kZS5hcmd1bWVudHMpLFxuICAgICAgICAgIHJlcXVpcmVkSGVscGVyczogW0hlbHBlckZ1bmN0aW9uLmFueSwgSGVscGVyRnVuY3Rpb24ucHJvamVjdE5vZGVzXVxuICAgICAgICB9O1xuICAgICAgY2FzZSAnYW5pbWF0ZSc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbm9kZTogbWlncmF0ZUFuaW1hdGVDYWxsKCksXG4gICAgICAgICAgcmVxdWlyZWRIZWxwZXJzOiBbSGVscGVyRnVuY3Rpb24uYW55LCBIZWxwZXJGdW5jdGlvbi5hbmltYXRlXVxuICAgICAgICB9O1xuICAgICAgY2FzZSAnZGVzdHJveVZpZXcnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IHN3aXRjaFRvSGVscGVyQ2FsbChub2RlLCBIZWxwZXJGdW5jdGlvbi5kZXN0cm95VmlldywgW25vZGUuYXJndW1lbnRzWzFdXSksXG4gICAgICAgICAgcmVxdWlyZWRIZWxwZXJzOiBbSGVscGVyRnVuY3Rpb24uYW55LCBIZWxwZXJGdW5jdGlvbi5kZXN0cm95Vmlld11cbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ2RldGFjaFZpZXcnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IHN3aXRjaFRvSGVscGVyQ2FsbChub2RlLCBIZWxwZXJGdW5jdGlvbi5kZXRhY2hWaWV3LCBbbm9kZS5hcmd1bWVudHNbMF1dKSxcbiAgICAgICAgICByZXF1aXJlZEhlbHBlcnM6IFtIZWxwZXJGdW5jdGlvbi5hbnksIEhlbHBlckZ1bmN0aW9uLmRldGFjaFZpZXddXG4gICAgICAgIH07XG4gICAgICBjYXNlICdhdHRhY2hWaWV3QWZ0ZXInOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5vZGU6IHN3aXRjaFRvSGVscGVyQ2FsbChub2RlLCBIZWxwZXJGdW5jdGlvbi5hdHRhY2hWaWV3QWZ0ZXIsIG5vZGUuYXJndW1lbnRzKSxcbiAgICAgICAgICByZXF1aXJlZEhlbHBlcnM6IFtIZWxwZXJGdW5jdGlvbi5hbnksIEhlbHBlckZ1bmN0aW9uLmF0dGFjaFZpZXdBZnRlcl1cbiAgICAgICAgfTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge25vZGV9O1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBub2RlIGlzIGEgUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uLiAqL1xuZnVuY3Rpb24gaXNQcm9wZXJ0eUFjY2Vzc0NhbGxFeHByZXNzaW9uKG5vZGU6IHRzLk5vZGUpOiBub2RlIGlzIFByb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24ge1xuICByZXR1cm4gdHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSAmJiB0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pO1xufVxuXG4vKiogUmVuYW1lcyBhIG1ldGhvZCBjYWxsIHdoaWxlIGtlZXBpbmcgYWxsIG9mIHRoZSBwYXJhbWV0ZXJzIGluIHBsYWNlLiAqL1xuZnVuY3Rpb24gcmVuYW1lTWV0aG9kQ2FsbChub2RlOiBQcm9wZXJ0eUFjY2Vzc0NhbGxFeHByZXNzaW9uLCBuZXdOYW1lOiBzdHJpbmcpOiB0cy5DYWxsRXhwcmVzc2lvbiB7XG4gIGNvbnN0IG5ld0V4cHJlc3Npb24gPSB0cy51cGRhdGVQcm9wZXJ0eUFjY2VzcyhcbiAgICAgIG5vZGUuZXhwcmVzc2lvbiwgbm9kZS5leHByZXNzaW9uLmV4cHJlc3Npb24sIHRzLmNyZWF0ZUlkZW50aWZpZXIobmV3TmFtZSkpO1xuXG4gIHJldHVybiB0cy51cGRhdGVDYWxsKG5vZGUsIG5ld0V4cHJlc3Npb24sIG5vZGUudHlwZUFyZ3VtZW50cywgbm9kZS5hcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIE1pZ3JhdGVzIGEgYHNlbGVjdFJvb3RFbGVtZW50YCBjYWxsIGJ5IHJlbW92aW5nIHRoZSBsYXN0IGFyZ3VtZW50IHdoaWNoIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQuXG4gKi9cbmZ1bmN0aW9uIG1pZ3JhdGVTZWxlY3RSb290RWxlbWVudChub2RlOiB0cy5DYWxsRXhwcmVzc2lvbik6IHRzLk5vZGUge1xuICAvLyBUaGUgb25seSB0aGluZyB3ZSBuZWVkIHRvIGRvIGlzIHRvIGRyb3AgdGhlIGxhc3QgYXJndW1lbnRcbiAgLy8gKGBkZWJ1Z0luZm9gKSwgaWYgdGhlIGNvbnN1bWVyIHdhcyBwYXNzaW5nIGl0IGluLlxuICBpZiAobm9kZS5hcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgIHJldHVybiB0cy51cGRhdGVDYWxsKG5vZGUsIG5vZGUuZXhwcmVzc2lvbiwgbm9kZS50eXBlQXJndW1lbnRzLCBbbm9kZS5hcmd1bWVudHNbMF1dKTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufVxuXG4vKipcbiAqIE1pZ3JhdGVzIGEgY2FsbCB0byBgc2V0RWxlbWVudENsYXNzYCBlaXRoZXIgdG8gYSBjYWxsIHRvIGBhZGRDbGFzc2Agb3IgYHJlbW92ZUNsYXNzYCwgb3JcbiAqIHRvIGFuIGV4cHJlc3Npb24gbGlrZSBgaXNBZGQgPyBhZGRDbGFzcyhlbCwgY2xhc3NOYW1lKSA6IHJlbW92ZUNsYXNzKGVsLCBjbGFzc05hbWUpYC5cbiAqL1xuZnVuY3Rpb24gbWlncmF0ZVNldEVsZW1lbnRDbGFzcyhub2RlOiBQcm9wZXJ0eUFjY2Vzc0NhbGxFeHByZXNzaW9uKTogdHMuTm9kZSB7XG4gIC8vIENsb25lIHNvIHdlIGRvbid0IG11dGF0ZSBieSBhY2NpZGVudC4gTm90ZSB0aGF0IHdlIGFzc3VtZSB0aGF0XG4gIC8vIHRoZSB1c2VyJ3MgY29kZSBpcyBwcm92aWRpbmcgYWxsIHRocmVlIHJlcXVpcmVkIGFyZ3VtZW50cy5cbiAgY29uc3Qgb3V0cHV0TWV0aG9kQXJncyA9IG5vZGUuYXJndW1lbnRzLnNsaWNlKCk7XG4gIGNvbnN0IGlzQWRkQXJndW1lbnQgPSBvdXRwdXRNZXRob2RBcmdzLnBvcCgpITtcbiAgY29uc3QgY3JlYXRlUmVuZGVyZXJDYWxsID0gKGlzQWRkOiBib29sZWFuKSA9PiB7XG4gICAgY29uc3QgaW5uZXJFeHByZXNzaW9uID0gbm9kZS5leHByZXNzaW9uLmV4cHJlc3Npb247XG4gICAgY29uc3QgdG9wRXhwcmVzc2lvbiA9XG4gICAgICAgIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKGlubmVyRXhwcmVzc2lvbiwgaXNBZGQgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJyk7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUNhbGwodG9wRXhwcmVzc2lvbiwgW10sIG5vZGUuYXJndW1lbnRzLnNsaWNlKDAsIDIpKTtcbiAgfTtcblxuICAvLyBJZiB0aGUgY2FsbCBoYXMgdGhlIGBpc0FkZGAgYXJndW1lbnQgYXMgYSBsaXRlcmFsIGJvb2xlYW4sIHdlIGNhbiBtYXAgaXQgZGlyZWN0bHkgdG9cbiAgLy8gYGFkZENsYXNzYCBvciBgcmVtb3ZlQ2xhc3NgLiBOb3RlIHRoYXQgd2UgY2FuJ3QgdXNlIHRoZSB0eXBlIGNoZWNrZXIgaGVyZSwgYmVjYXVzZSBpdFxuICAvLyB3b24ndCB0ZWxsIHVzIHdoZXRoZXIgdGhlIHZhbHVlIHJlc29sdmVzIHRvIHRydWUgb3IgZmFsc2UuXG4gIGlmIChpc0FkZEFyZ3VtZW50LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQgfHxcbiAgICAgIGlzQWRkQXJndW1lbnQua2luZCA9PT0gdHMuU3ludGF4S2luZC5GYWxzZUtleXdvcmQpIHtcbiAgICByZXR1cm4gY3JlYXRlUmVuZGVyZXJDYWxsKGlzQWRkQXJndW1lbnQua2luZCA9PT0gdHMuU3ludGF4S2luZC5UcnVlS2V5d29yZCk7XG4gIH1cblxuICAvLyBPdGhlcndpc2UgY3JlYXRlIGEgdGVybmFyeSBvbiB0aGUgdmFyaWFibGUuXG4gIHJldHVybiB0cy5jcmVhdGVDb25kaXRpb25hbChpc0FkZEFyZ3VtZW50LCBjcmVhdGVSZW5kZXJlckNhbGwodHJ1ZSksIGNyZWF0ZVJlbmRlcmVyQ2FsbChmYWxzZSkpO1xufVxuXG4vKipcbiAqIE1pZ3JhdGVzIGEgY2FsbCB0byBgc2V0RWxlbWVudFN0eWxlYCBjYWxsIGVpdGhlciB0byBhIGNhbGwgdG9cbiAqIGBzZXRTdHlsZWAgb3IgYHJlbW92ZVN0eWxlYC4gb3IgdG8gYW4gZXhwcmVzc2lvbiBsaWtlXG4gKiBgdmFsdWUgPT0gbnVsbCA/IHJlbW92ZVN0eWxlKGVsLCBrZXkpIDogc2V0U3R5bGUoZWwsIGtleSwgdmFsdWUpYC5cbiAqL1xuZnVuY3Rpb24gbWlncmF0ZVNldEVsZW1lbnRTdHlsZShcbiAgICBub2RlOiBQcm9wZXJ0eUFjY2Vzc0NhbGxFeHByZXNzaW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiB0cy5Ob2RlIHtcbiAgY29uc3QgYXJncyA9IG5vZGUuYXJndW1lbnRzO1xuICBjb25zdCBhZGRNZXRob2ROYW1lID0gJ3NldFN0eWxlJztcbiAgY29uc3QgcmVtb3ZlTWV0aG9kTmFtZSA9ICdyZW1vdmVTdHlsZSc7XG4gIGNvbnN0IGxhc3RBcmdUeXBlID0gYXJnc1syXSA/XG4gICAgICB0eXBlQ2hlY2tlci50eXBlVG9TdHJpbmcoXG4gICAgICAgICAgdHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24oYXJnc1syXSksIG5vZGUsIHRzLlR5cGVGb3JtYXRGbGFncy5BZGRVbmRlZmluZWQpIDpcbiAgICAgIG51bGw7XG5cbiAgLy8gTm90ZSB0aGF0IGZvciBhIGxpdGVyYWwgbnVsbCwgVFMgY29uc2lkZXJzIGl0IGEgYE51bGxLZXl3b3JkYCxcbiAgLy8gd2hlcmVhcyBhIGxpdGVyYWwgYHVuZGVmaW5lZGAgaXMganVzdCBhbiBJZGVudGlmaWVyLlxuICBpZiAoYXJncy5sZW5ndGggPT09IDIgfHwgbGFzdEFyZ1R5cGUgPT09ICdudWxsJyB8fCBsYXN0QXJnVHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBJZiB3ZSd2ZSBnb3QgYSBjYWxsIHdpdGggdHdvIGFyZ3VtZW50cywgb3Igb25lIHdpdGggdGhyZWUgYXJndW1lbnRzIHdoZXJlIHRoZSBsYXN0IG9uZSBpc1xuICAgIC8vIGB1bmRlZmluZWRgIG9yIGBudWxsYCwgd2UgY2FuIHNhZmVseSBzd2l0Y2ggdG8gYSBgcmVtb3ZlU3R5bGVgIGNhbGwuXG4gICAgY29uc3QgaW5uZXJFeHByZXNzaW9uID0gbm9kZS5leHByZXNzaW9uLmV4cHJlc3Npb247XG4gICAgY29uc3QgdG9wRXhwcmVzc2lvbiA9IHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKGlubmVyRXhwcmVzc2lvbiwgcmVtb3ZlTWV0aG9kTmFtZSk7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUNhbGwodG9wRXhwcmVzc2lvbiwgW10sIGFyZ3Muc2xpY2UoMCwgMikpO1xuICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAzKSB7XG4gICAgLy8gV2UgbmVlZCB0aGUgY2hlY2tzIGZvciBzdHJpbmcgbGl0ZXJhbHMsIGJlY2F1c2UgdGhlIHR5cGUgb2Ygc29tZXRoaW5nXG4gICAgLy8gbGlrZSBgXCJibHVlXCJgIGlzIHRoZSBsaXRlcmFsIGBibHVlYCwgbm90IGBzdHJpbmdgLlxuICAgIGlmIChsYXN0QXJnVHlwZSA9PT0gJ3N0cmluZycgfHwgbGFzdEFyZ1R5cGUgPT09ICdudW1iZXInIHx8IHRzLmlzU3RyaW5nTGl0ZXJhbChhcmdzWzJdKSB8fFxuICAgICAgICB0cy5pc05vU3Vic3RpdHV0aW9uVGVtcGxhdGVMaXRlcmFsKGFyZ3NbMl0pIHx8IHRzLmlzTnVtZXJpY0xpdGVyYWwoYXJnc1syXSkpIHtcbiAgICAgIC8vIElmIHdlJ3ZlIGdvdCB0aHJlZSBhcmd1bWVudHMgYW5kIHRoZSBsYXN0IG9uZSBpcyBhIHN0cmluZyBsaXRlcmFsIG9yIGEgbnVtYmVyLCB3ZVxuICAgICAgLy8gY2FuIHNhZmVseSByZW5hbWUgdG8gYHNldFN0eWxlYC5cbiAgICAgIHJldHVybiByZW5hbWVNZXRob2RDYWxsKG5vZGUsIGFkZE1ldGhvZE5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UgbWlncmF0ZSB0byBhIHRlcm5hcnkgdGhhdCBsb29rcyBsaWtlOlxuICAgICAgLy8gYHZhbHVlID09IG51bGwgPyByZW1vdmVTdHlsZShlbCwga2V5KSA6IHNldFN0eWxlKGVsLCBrZXksIHZhbHVlKWBcbiAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRzLmNyZWF0ZUJpbmFyeShhcmdzWzJdLCB0cy5TeW50YXhLaW5kLkVxdWFsc0VxdWFsc1Rva2VuLCB0cy5jcmVhdGVOdWxsKCkpO1xuICAgICAgY29uc3Qgd2hlbk51bGxDYWxsID0gcmVuYW1lTWV0aG9kQ2FsbChcbiAgICAgICAgICB0cy5jcmVhdGVDYWxsKG5vZGUuZXhwcmVzc2lvbiwgW10sIGFyZ3Muc2xpY2UoMCwgMikpIGFzIFByb3BlcnR5QWNjZXNzQ2FsbEV4cHJlc3Npb24sXG4gICAgICAgICAgcmVtb3ZlTWV0aG9kTmFtZSk7XG4gICAgICByZXR1cm4gdHMuY3JlYXRlQ29uZGl0aW9uYWwoY29uZGl0aW9uLCB3aGVuTnVsbENhbGwsIHJlbmFtZU1ldGhvZENhbGwobm9kZSwgYWRkTWV0aG9kTmFtZSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBub2RlO1xufVxuXG4vKipcbiAqIE1pZ3JhdGVzIGEgY2FsbCB0byBgaW52b2tlRWxlbWVudE1ldGhvZCh0YXJnZXQsIG1ldGhvZCwgW2FyZzEsIGFyZzJdKWAgZWl0aGVyIHRvXG4gKiBgdGFyZ2V0Lm1ldGhvZChhcmcxLCBhcmcyKWAgb3IgYCh0YXJnZXQgYXMgYW55KVttZXRob2RdLmFwcGx5KHRhcmdldCwgW2FyZzEsIGFyZzJdKWAuXG4gKi9cbmZ1bmN0aW9uIG1pZ3JhdGVJbnZva2VFbGVtZW50TWV0aG9kKG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uKTogdHMuTm9kZSB7XG4gIGNvbnN0IFt0YXJnZXQsIG5hbWUsIGFyZ3NdID0gbm9kZS5hcmd1bWVudHM7XG4gIGNvbnN0IGlzTmFtZVN0YXRpYyA9IHRzLmlzU3RyaW5nTGl0ZXJhbChuYW1lKSB8fCB0cy5pc05vU3Vic3RpdHV0aW9uVGVtcGxhdGVMaXRlcmFsKG5hbWUpO1xuICBjb25zdCBpc0FyZ3NTdGF0aWMgPSAhYXJncyB8fCB0cy5pc0FycmF5TGl0ZXJhbEV4cHJlc3Npb24oYXJncyk7XG5cbiAgaWYgKGlzTmFtZVN0YXRpYyAmJiBpc0FyZ3NTdGF0aWMpIHtcbiAgICAvLyBJZiB0aGUgbmFtZSBpcyBhIHN0YXRpYyBzdHJpbmcgYW5kIHRoZSBhcmd1bWVudHMgYXJlIGFuIGFycmF5IGxpdGVyYWwsXG4gICAgLy8gd2UgY2FuIHNhZmVseSBjb252ZXJ0IHRoZSBub2RlIGludG8gYSBjYWxsIGV4cHJlc3Npb24uXG4gICAgY29uc3QgZXhwcmVzc2lvbiA9IHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKFxuICAgICAgICB0YXJnZXQsIChuYW1lIGFzIHRzLlN0cmluZ0xpdGVyYWwgfCB0cy5Ob1N1YnN0aXR1dGlvblRlbXBsYXRlTGl0ZXJhbCkudGV4dCk7XG4gICAgY29uc3QgY2FsbEFyZ3VtZW50cyA9IGFyZ3MgPyAoYXJncyBhcyB0cy5BcnJheUxpdGVyYWxFeHByZXNzaW9uKS5lbGVtZW50cyA6IFtdO1xuICAgIHJldHVybiB0cy5jcmVhdGVDYWxsKGV4cHJlc3Npb24sIFtdLCBjYWxsQXJndW1lbnRzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBPdGhlcndpc2UgY3JlYXRlIGFuIGV4cHJlc3Npb24gaW4gdGhlIGZvcm0gb2YgYCh0YXJnZXQgYXMgYW55KVtuYW1lXS5hcHBseSh0YXJnZXQsIGFyZ3MpYC5cbiAgICBjb25zdCBhc0V4cHJlc3Npb24gPSB0cy5jcmVhdGVQYXJlbihcbiAgICAgICAgdHMuY3JlYXRlQXNFeHByZXNzaW9uKHRhcmdldCwgdHMuY3JlYXRlS2V5d29yZFR5cGVOb2RlKHRzLlN5bnRheEtpbmQuQW55S2V5d29yZCkpKTtcbiAgICBjb25zdCBlbGVtZW50QWNjZXNzID0gdHMuY3JlYXRlRWxlbWVudEFjY2Vzcyhhc0V4cHJlc3Npb24sIG5hbWUpO1xuICAgIGNvbnN0IGFwcGx5RXhwcmVzc2lvbiA9IHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKGVsZW1lbnRBY2Nlc3MsICdhcHBseScpO1xuICAgIHJldHVybiB0cy5jcmVhdGVDYWxsKGFwcGx5RXhwcmVzc2lvbiwgW10sIGFyZ3MgPyBbdGFyZ2V0LCBhcmdzXSA6IFt0YXJnZXRdKTtcbiAgfVxufVxuXG4vKiogTWlncmF0ZXMgYSBjYWxsIHRvIGBjcmVhdGVWaWV3Um9vdGAgdG8gd2hhdGV2ZXIgbm9kZSB3YXMgcGFzc2VkIGluIGFzIHRoZSBmaXJzdCBhcmd1bWVudC4gKi9cbmZ1bmN0aW9uIG1pZ3JhdGVDcmVhdGVWaWV3Um9vdChub2RlOiB0cy5DYWxsRXhwcmVzc2lvbik6IHRzLk5vZGUge1xuICByZXR1cm4gbm9kZS5hcmd1bWVudHNbMF07XG59XG5cbi8qKiBNaWdyYXRlcyBhIGNhbGwgdG8gYG1pZ3JhdGVgIGEgZGlyZWN0IGNhbGwgdG8gdGhlIGhlbHBlci4gKi9cbmZ1bmN0aW9uIG1pZ3JhdGVBbmltYXRlQ2FsbCgpIHtcbiAgcmV0dXJuIHRzLmNyZWF0ZUNhbGwodHMuY3JlYXRlSWRlbnRpZmllcihIZWxwZXJGdW5jdGlvbi5hbmltYXRlKSwgW10sIFtdKTtcbn1cblxuLyoqXG4gKiBTd2l0Y2hlcyBvdXQgYSBjYWxsIHRvIHRoZSBgUmVuZGVyZXJgIHRvIGEgY2FsbCB0byBvbmUgb2Ygb3VyIGhlbHBlciBmdW5jdGlvbnMuXG4gKiBNb3N0IG9mIHRoZSBoZWxwZXJzIGFjY2VwdCBhbiBpbnN0YW5jZSBvZiBgUmVuZGVyZXIyYCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgYW5kIGFsbFxuICogc3Vic2VxdWVudCBhcmd1bWVudHMgZGlmZmVyLlxuICogQHBhcmFtIG5vZGUgTm9kZSBvZiB0aGUgb3JpZ2luYWwgbWV0aG9kIGNhbGwuXG4gKiBAcGFyYW0gaGVscGVyIE5hbWUgb2YgdGhlIGhlbHBlciB3aXRoIHdoaWNoIHRvIHJlcGxhY2UgdGhlIG9yaWdpbmFsIGNhbGwuXG4gKiBAcGFyYW0gYXJncyBBcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIGludG8gdGhlIGhlbHBlciBhZnRlciB0aGUgcmVuZGVyZXIgYXJndW1lbnQuXG4gKi9cbmZ1bmN0aW9uIHN3aXRjaFRvSGVscGVyQ2FsbChcbiAgICBub2RlOiBQcm9wZXJ0eUFjY2Vzc0NhbGxFeHByZXNzaW9uLCBoZWxwZXI6IEhlbHBlckZ1bmN0aW9uLFxuICAgIGFyZ3M6IHRzLkV4cHJlc3Npb25bXXx0cy5Ob2RlQXJyYXk8dHMuRXhwcmVzc2lvbj4pOiB0cy5Ob2RlIHtcbiAgcmV0dXJuIHRzLmNyZWF0ZUNhbGwodHMuY3JlYXRlSWRlbnRpZmllcihoZWxwZXIpLCBbXSwgW25vZGUuZXhwcmVzc2lvbi5leHByZXNzaW9uLCAuLi5hcmdzXSk7XG59XG4iXX0=