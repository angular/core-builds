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
        define("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/declaration_usage_visitor", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/functions", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeclarationUsageVisitor = exports.ResolvedUsage = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const functions_1 = require("@angular/core/schematics/utils/typescript/functions");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    var ResolvedUsage;
    (function (ResolvedUsage) {
        ResolvedUsage[ResolvedUsage["SYNCHRONOUS"] = 0] = "SYNCHRONOUS";
        ResolvedUsage[ResolvedUsage["ASYNCHRONOUS"] = 1] = "ASYNCHRONOUS";
        ResolvedUsage[ResolvedUsage["AMBIGUOUS"] = 2] = "AMBIGUOUS";
    })(ResolvedUsage = exports.ResolvedUsage || (exports.ResolvedUsage = {}));
    /**
     * List of TypeScript syntax tokens that can be used within a binary expression as
     * compound assignment. These imply a read and write of the left-side expression.
     */
    const BINARY_COMPOUND_TOKENS = [
        typescript_1.default.SyntaxKind.CaretEqualsToken,
        typescript_1.default.SyntaxKind.AsteriskEqualsToken,
        typescript_1.default.SyntaxKind.AmpersandEqualsToken,
        typescript_1.default.SyntaxKind.BarEqualsToken,
        typescript_1.default.SyntaxKind.AsteriskAsteriskEqualsToken,
        typescript_1.default.SyntaxKind.PlusEqualsToken,
        typescript_1.default.SyntaxKind.MinusEqualsToken,
        typescript_1.default.SyntaxKind.SlashEqualsToken,
    ];
    /**
     * List of known asynchronous external call expressions which aren't analyzable
     * but are guaranteed to not execute the passed argument synchronously.
     */
    const ASYNC_EXTERNAL_CALLS = [
        { parent: ['Promise'], name: 'then' },
        { parent: ['Promise'], name: 'catch' },
        { parent: [null, 'Window'], name: 'requestAnimationFrame' },
        { parent: [null, 'Window'], name: 'setTimeout' },
        { parent: [null, 'Window'], name: 'setInterval' },
        { parent: ['*'], name: 'addEventListener' },
    ];
    /**
     * Class that can be used to determine if a given TypeScript node is used within
     * other given TypeScript nodes. This is achieved by walking through all children
     * of the given node and checking for usages of the given declaration. The visitor
     * also handles potential control flow changes caused by call/new expressions.
     */
    class DeclarationUsageVisitor {
        constructor(declaration, typeChecker, baseContext = new Map()) {
            this.declaration = declaration;
            this.typeChecker = typeChecker;
            this.baseContext = baseContext;
            /** Set of visited symbols that caused a jump in control flow. */
            this.visitedJumpExprNodes = new Set();
            /**
             * Queue of nodes that need to be checked for declaration usage and
             * are guaranteed to be executed synchronously.
             */
            this.nodeQueue = [];
            /**
             * Nodes which need to be checked for declaration usage but aren't
             * guaranteed to execute synchronously.
             */
            this.ambiguousNodeQueue = [];
            /**
             * Function context that holds the TypeScript node values for all parameters
             * of the currently analyzed function block.
             */
            this.context = new Map();
        }
        isReferringToSymbol(node) {
            const symbol = this.typeChecker.getSymbolAtLocation(node);
            return !!symbol && symbol.valueDeclaration === this.declaration;
        }
        addJumpExpressionToQueue(callExpression) {
            const node = (0, functions_1.unwrapExpression)(callExpression.expression);
            // In case the given expression is already referring to a function-like declaration,
            // we don't need to resolve the symbol of the expression as the jump expression is
            // defined inline and we can just add the given node to the queue.
            if ((0, functions_1.isFunctionLikeDeclaration)(node) && node.body) {
                this.nodeQueue.push(node.body);
                return;
            }
            const callExprSymbol = this._getDeclarationSymbolOfNode(node);
            if (!callExprSymbol || !callExprSymbol.valueDeclaration) {
                this.peekIntoJumpExpression(callExpression);
                return;
            }
            const expressionDecl = this._resolveNodeFromContext(callExprSymbol.valueDeclaration);
            // Note that we should not add previously visited symbols to the queue as
            // this could cause cycles.
            if (!(0, functions_1.isFunctionLikeDeclaration)(expressionDecl) ||
                this.visitedJumpExprNodes.has(expressionDecl) || !expressionDecl.body) {
                this.peekIntoJumpExpression(callExpression);
                return;
            }
            // Update the context for the new jump expression and its specified arguments.
            this._updateContext(callExpression.arguments, expressionDecl.parameters);
            this.visitedJumpExprNodes.add(expressionDecl);
            this.nodeQueue.push(expressionDecl.body);
        }
        addNewExpressionToQueue(node) {
            const newExprSymbol = this._getDeclarationSymbolOfNode((0, functions_1.unwrapExpression)(node.expression));
            // Only handle new expressions which resolve to classes. Technically "new" could
            // also call void functions or objects with a constructor signature. Also note that
            // we should not visit already visited symbols as this could cause cycles.
            if (!newExprSymbol || !newExprSymbol.valueDeclaration ||
                !typescript_1.default.isClassDeclaration(newExprSymbol.valueDeclaration)) {
                this.peekIntoJumpExpression(node);
                return;
            }
            const targetConstructor = newExprSymbol.valueDeclaration.members.find(typescript_1.default.isConstructorDeclaration);
            if (targetConstructor && targetConstructor.body &&
                !this.visitedJumpExprNodes.has(targetConstructor)) {
                // Update the context for the new expression and its specified constructor
                // parameters if arguments are passed to the class constructor.
                if (node.arguments) {
                    this._updateContext(node.arguments, targetConstructor.parameters);
                }
                this.visitedJumpExprNodes.add(targetConstructor);
                this.nodeQueue.push(targetConstructor.body);
            }
            else {
                this.peekIntoJumpExpression(node);
            }
        }
        visitPropertyAccessors(node, checkSetter, checkGetter) {
            const propertySymbol = this._getPropertyAccessSymbol(node);
            if ((propertySymbol === null || propertySymbol === void 0 ? void 0 : propertySymbol.declarations) === undefined || propertySymbol.declarations.length === 0 ||
                (propertySymbol.getFlags() & typescript_1.default.SymbolFlags.Accessor) === 0) {
                return;
            }
            // Since we checked the symbol flags and the symbol is describing an accessor, the
            // declarations are guaranteed to only contain the getters and setters.
            const accessors = propertySymbol.declarations;
            accessors
                .filter(d => (checkSetter && typescript_1.default.isSetAccessor(d) || checkGetter && typescript_1.default.isGetAccessor(d)) &&
                d.body && !this.visitedJumpExprNodes.has(d))
                .forEach(d => {
                this.visitedJumpExprNodes.add(d);
                this.nodeQueue.push(d.body);
            });
        }
        visitBinaryExpression(node) {
            const leftExpr = (0, functions_1.unwrapExpression)(node.left);
            if (!typescript_1.default.isPropertyAccessExpression(leftExpr)) {
                return false;
            }
            if (BINARY_COMPOUND_TOKENS.indexOf(node.operatorToken.kind) !== -1) {
                // Compound assignments always cause the getter and setter to be called.
                // Therefore we need to check the setter and getter of the property access.
                this.visitPropertyAccessors(leftExpr, /* setter */ true, /* getter */ true);
            }
            else if (node.operatorToken.kind === typescript_1.default.SyntaxKind.EqualsToken) {
                // Value assignments using the equals token only cause the "setter" to be called.
                // Therefore we need to analyze the setter declaration of the property access.
                this.visitPropertyAccessors(leftExpr, /* setter */ true, /* getter */ false);
            }
            else {
                // If the binary expression is not an assignment, it's a simple property read and
                // we need to check the getter declaration if present.
                this.visitPropertyAccessors(leftExpr, /* setter */ false, /* getter */ true);
            }
            return true;
        }
        getResolvedNodeUsage(searchNode) {
            this.nodeQueue = [searchNode];
            this.visitedJumpExprNodes.clear();
            this.context.clear();
            // Copy base context values into the current function block context. The
            // base context is useful if nodes need to be mapped to other nodes. e.g.
            // abstract super class methods are mapped to their implementation node of
            // the derived class.
            this.baseContext.forEach((value, key) => this.context.set(key, value));
            return this.isSynchronouslyUsedInNode(searchNode);
        }
        isSynchronouslyUsedInNode(searchNode) {
            this.ambiguousNodeQueue = [];
            while (this.nodeQueue.length) {
                const node = this.nodeQueue.shift();
                if (typescript_1.default.isIdentifier(node) && this.isReferringToSymbol(node)) {
                    return ResolvedUsage.SYNCHRONOUS;
                }
                // Handle call expressions within TypeScript nodes that cause a jump in control
                // flow. We resolve the call expression value declaration and add it to the node queue.
                if (typescript_1.default.isCallExpression(node)) {
                    this.addJumpExpressionToQueue(node);
                }
                // Handle new expressions that cause a jump in control flow. We resolve the
                // constructor declaration of the target class and add it to the node queue.
                if (typescript_1.default.isNewExpression(node)) {
                    this.addNewExpressionToQueue(node);
                }
                // We also need to handle binary expressions where a value can be either assigned to
                // the property, or a value is read from a property expression. Depending on the
                // binary expression operator, setters or getters need to be analyzed.
                if (typescript_1.default.isBinaryExpression(node)) {
                    // In case the binary expression contained a property expression on the left side, we
                    // don't want to continue visiting this property expression on its own. This is necessary
                    // because visiting the expression on its own causes a loss of context. e.g. property
                    // access expressions *do not* always cause a value read (e.g. property assignments)
                    if (this.visitBinaryExpression(node)) {
                        this.nodeQueue.push(node.right);
                        continue;
                    }
                }
                // Handle property access expressions. Property expressions which are part of binary
                // expressions won't be added to the node queue, so these access expressions are
                // guaranteed to be "read" accesses and we need to check the "getter" declaration.
                if (typescript_1.default.isPropertyAccessExpression(node)) {
                    this.visitPropertyAccessors(node, /* setter */ false, /* getter */ true);
                }
                // Do not visit nodes that declare a block of statements but are not executed
                // synchronously (e.g. function declarations). We only want to check TypeScript
                // nodes which are synchronously executed in the control flow.
                if (!(0, functions_1.isFunctionLikeDeclaration)(node)) {
                    this.nodeQueue.push(...node.getChildren());
                }
            }
            if (this.ambiguousNodeQueue.length) {
                // Update the node queue to all stored ambiguous nodes. These nodes are not
                // guaranteed to be executed and therefore in case of a synchronous usage
                // within one of those nodes, the resolved usage is ambiguous.
                this.nodeQueue = this.ambiguousNodeQueue;
                const usage = this.isSynchronouslyUsedInNode(searchNode);
                return usage === ResolvedUsage.SYNCHRONOUS ? ResolvedUsage.AMBIGUOUS : usage;
            }
            return ResolvedUsage.ASYNCHRONOUS;
        }
        /**
         * Peeks into the given jump expression by adding all function like declarations
         * which are referenced in the jump expression arguments to the ambiguous node
         * queue. These arguments could technically access the given declaration but it's
         * not guaranteed that the jump expression is executed. In that case the resolved
         * usage is ambiguous.
         */
        peekIntoJumpExpression(jumpExp) {
            if (!jumpExp.arguments) {
                return;
            }
            // For some call expressions we don't want to add the arguments to the
            // ambiguous node queue. e.g. "setTimeout" is not analyzable but is
            // guaranteed to execute its argument asynchronously. We handle a subset
            // of these call expressions by having a hardcoded list of some.
            if (typescript_1.default.isCallExpression(jumpExp)) {
                const symbol = this._getDeclarationSymbolOfNode(jumpExp.expression);
                if (symbol && symbol.valueDeclaration) {
                    const parentNode = symbol.valueDeclaration.parent;
                    if (parentNode && (typescript_1.default.isInterfaceDeclaration(parentNode) || typescript_1.default.isSourceFile(parentNode)) &&
                        (typescript_1.default.isMethodSignature(symbol.valueDeclaration) ||
                            typescript_1.default.isFunctionDeclaration(symbol.valueDeclaration)) &&
                        symbol.valueDeclaration.name) {
                        const parentName = typescript_1.default.isInterfaceDeclaration(parentNode) ? parentNode.name.text : null;
                        const callName = (0, property_name_1.getPropertyNameText)(symbol.valueDeclaration.name);
                        if (ASYNC_EXTERNAL_CALLS.some(c => (c.name === callName &&
                            (c.parent.indexOf(parentName) !== -1 || c.parent.indexOf('*') !== -1)))) {
                            return;
                        }
                    }
                }
            }
            jumpExp.arguments.forEach((node) => {
                node = this._resolveDeclarationOfNode(node);
                if (typescript_1.default.isVariableDeclaration(node) && node.initializer) {
                    node = node.initializer;
                }
                if ((0, functions_1.isFunctionLikeDeclaration)(node) && !!node.body) {
                    this.ambiguousNodeQueue.push(node.body);
                }
            });
        }
        /**
         * Resolves a given node from the context. In case the node is not mapped in
         * the context, the original node is returned.
         */
        _resolveNodeFromContext(node) {
            if (this.context.has(node)) {
                return this.context.get(node);
            }
            return node;
        }
        /**
         * Updates the context to reflect the newly set parameter values. This allows future
         * references to function parameters to be resolved to the actual node through the context.
         */
        _updateContext(callArgs, parameters) {
            parameters.forEach((parameter, index) => {
                let argumentNode = callArgs[index];
                if (!argumentNode) {
                    if (!parameter.initializer) {
                        return;
                    }
                    // Argument can be undefined in case the function parameter has a default
                    // value. In that case we want to store the parameter default value in the context.
                    argumentNode = parameter.initializer;
                }
                if (typescript_1.default.isIdentifier(argumentNode)) {
                    this.context.set(parameter, this._resolveDeclarationOfNode(argumentNode));
                }
                else {
                    this.context.set(parameter, argumentNode);
                }
            });
        }
        /**
         * Resolves the declaration of a given TypeScript node. For example an identifier can
         * refer to a function parameter. This parameter can then be resolved through the
         * function context.
         */
        _resolveDeclarationOfNode(node) {
            const symbol = this._getDeclarationSymbolOfNode(node);
            if (!symbol || !symbol.valueDeclaration) {
                return node;
            }
            return this._resolveNodeFromContext(symbol.valueDeclaration);
        }
        /**
         * Gets the declaration symbol of a given TypeScript node. Resolves aliased
         * symbols to the symbol containing the value declaration.
         */
        _getDeclarationSymbolOfNode(node) {
            let symbol = this.typeChecker.getSymbolAtLocation(node);
            if (!symbol) {
                return null;
            }
            // Resolve the symbol to it's original declaration symbol.
            while (symbol.flags & typescript_1.default.SymbolFlags.Alias) {
                symbol = this.typeChecker.getAliasedSymbol(symbol);
            }
            return symbol;
        }
        /** Gets the symbol of the given property access expression. */
        _getPropertyAccessSymbol(node) {
            let propertySymbol = this._getDeclarationSymbolOfNode(node.name);
            if (!propertySymbol || !propertySymbol.valueDeclaration) {
                return null;
            }
            if (!this.context.has(propertySymbol.valueDeclaration)) {
                return propertySymbol;
            }
            // In case the context has the value declaration of the given property access
            // name identifier, we need to replace the "propertySymbol" with the symbol
            // referring to the resolved symbol based on the context. e.g. abstract properties
            // can ultimately resolve into an accessor declaration based on the implementation.
            const contextNode = this._resolveNodeFromContext(propertySymbol.valueDeclaration);
            if (!typescript_1.default.isAccessor(contextNode)) {
                return null;
            }
            // Resolve the symbol referring to the "accessor" using the name identifier
            // of the accessor declaration.
            return this._getDeclarationSymbolOfNode(contextNode.name);
        }
    }
    exports.DeclarationUsageVisitor = DeclarationUsageVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCw0REFBNEI7SUFDNUIsbUZBQW1HO0lBQ25HLDJGQUErRTtJQUkvRSxJQUFZLGFBSVg7SUFKRCxXQUFZLGFBQWE7UUFDdkIsK0RBQVcsQ0FBQTtRQUNYLGlFQUFZLENBQUE7UUFDWiwyREFBUyxDQUFBO0lBQ1gsQ0FBQyxFQUpXLGFBQWEsR0FBYixxQkFBYSxLQUFiLHFCQUFhLFFBSXhCO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTSxzQkFBc0IsR0FBRztRQUM3QixvQkFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7UUFDOUIsb0JBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO1FBQ2pDLG9CQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQjtRQUNsQyxvQkFBRSxDQUFDLFVBQVUsQ0FBQyxjQUFjO1FBQzVCLG9CQUFFLENBQUMsVUFBVSxDQUFDLDJCQUEyQjtRQUN6QyxvQkFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlO1FBQzdCLG9CQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtRQUM5QixvQkFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7S0FDL0IsQ0FBQztJQUVGOzs7T0FHRztJQUNILE1BQU0sb0JBQW9CLEdBQUc7UUFDM0IsRUFBQyxNQUFNLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO1FBQ25DLEVBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8s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QUFnQixDQUFDLEVBQUU7Z0JBQ3RELE9BQU8sY0FBYyxDQUFDO2FBQ3ZCO1lBRUQsNkVBQTZFO1lBQzdFLDJFQUEyRTtZQUMzRSxrRkFBa0Y7WUFDbEYsbUZBQW1GO1lBQ25GLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUVsRixJQUFJLENBQUMsb0JBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCwyRUFBMkU7WUFDM0UsK0JBQStCO1lBQy9CLE9BQU8sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RCxDQUFDO0tBQ0Y7SUE3V0QsMERBNldDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7aXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbiwgdW53cmFwRXhwcmVzc2lvbn0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9mdW5jdGlvbnMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG5leHBvcnQgdHlwZSBGdW5jdGlvbkNvbnRleHQgPSBNYXA8dHMuTm9kZSwgdHMuTm9kZT47XG5cbmV4cG9ydCBlbnVtIFJlc29sdmVkVXNhZ2Uge1xuICBTWU5DSFJPTk9VUyxcbiAgQVNZTkNIUk9OT1VTLFxuICBBTUJJR1VPVVMsXG59XG5cbi8qKlxuICogTGlzdCBvZiBUeXBlU2NyaXB0IHN5bnRheCB0b2tlbnMgdGhhdCBjYW4gYmUgdXNlZCB3aXRoaW4gYSBiaW5hcnkgZXhwcmVzc2lvbiBhc1xuICogY29tcG91bmQgYXNzaWdubWVudC4gVGhlc2UgaW1wbHkgYSByZWFkIGFuZCB3cml0ZSBvZiB0aGUgbGVmdC1zaWRlIGV4cHJlc3Npb24uXG4gKi9cbmNvbnN0IEJJTkFSWV9DT01QT1VORF9UT0tFTlMgPSBbXG4gIHRzLlN5bnRheEtpbmQuQ2FyZXRFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5Bc3Rlcmlza0VxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLkFtcGVyc2FuZEVxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLkJhckVxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLkFzdGVyaXNrQXN0ZXJpc2tFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5QbHVzRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuTWludXNFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5TbGFzaEVxdWFsc1Rva2VuLFxuXTtcblxuLyoqXG4gKiBMaXN0IG9mIGtub3duIGFzeW5jaHJvbm91cyBleHRlcm5hbCBjYWxsIGV4cHJlc3Npb25zIHdoaWNoIGFyZW4ndCBhbmFseXphYmxlXG4gKiBidXQgYXJlIGd1YXJhbnRlZWQgdG8gbm90IGV4ZWN1dGUgdGhlIHBhc3NlZCBhcmd1bWVudCBzeW5jaHJvbm91c2x5LlxuICovXG5jb25zdCBBU1lOQ19FWFRFUk5BTF9DQUxMUyA9IFtcbiAge3BhcmVudDogWydQcm9taXNlJ10sIG5hbWU6ICd0aGVuJ30sXG4gIHtwYXJlbnQ6IFsnUHJvbWlzZSddLCBuYW1lOiAnY2F0Y2gnfSxcbiAge3BhcmVudDogW251bGwsICdXaW5kb3cnXSwgbmFtZTogJ3JlcXVlc3RBbmltYXRpb25GcmFtZSd9LFxuICB7cGFyZW50OiBbbnVsbCwgJ1dpbmRvdyddLCBuYW1lOiAnc2V0VGltZW91dCd9LFxuICB7cGFyZW50OiBbbnVsbCwgJ1dpbmRvdyddLCBuYW1lOiAnc2V0SW50ZXJ2YWwnfSxcbiAge3BhcmVudDogWycqJ10sIG5hbWU6ICdhZGRFdmVudExpc3RlbmVyJ30sXG5dO1xuXG4vKipcbiAqIENsYXNzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlIGlzIHVzZWQgd2l0aGluXG4gKiBvdGhlciBnaXZlbiBUeXBlU2NyaXB0IG5vZGVzLiBUaGlzIGlzIGFjaGlldmVkIGJ5IHdhbGtpbmcgdGhyb3VnaCBhbGwgY2hpbGRyZW5cbiAqIG9mIHRoZSBnaXZlbiBub2RlIGFuZCBjaGVja2luZyBmb3IgdXNhZ2VzIG9mIHRoZSBnaXZlbiBkZWNsYXJhdGlvbi4gVGhlIHZpc2l0b3JcbiAqIGFsc28gaGFuZGxlcyBwb3RlbnRpYWwgY29udHJvbCBmbG93IGNoYW5nZXMgY2F1c2VkIGJ5IGNhbGwvbmV3IGV4cHJlc3Npb25zLlxuICovXG5leHBvcnQgY2xhc3MgRGVjbGFyYXRpb25Vc2FnZVZpc2l0b3Ige1xuICAvKiogU2V0IG9mIHZpc2l0ZWQgc3ltYm9scyB0aGF0IGNhdXNlZCBhIGp1bXAgaW4gY29udHJvbCBmbG93LiAqL1xuICBwcml2YXRlIHZpc2l0ZWRKdW1wRXhwck5vZGVzID0gbmV3IFNldDx0cy5Ob2RlPigpO1xuXG4gIC8qKlxuICAgKiBRdWV1ZSBvZiBub2RlcyB0aGF0IG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgZGVjbGFyYXRpb24gdXNhZ2UgYW5kXG4gICAqIGFyZSBndWFyYW50ZWVkIHRvIGJlIGV4ZWN1dGVkIHN5bmNocm9ub3VzbHkuXG4gICAqL1xuICBwcml2YXRlIG5vZGVRdWV1ZTogdHMuTm9kZVtdID0gW107XG5cbiAgLyoqXG4gICAqIE5vZGVzIHdoaWNoIG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgZGVjbGFyYXRpb24gdXNhZ2UgYnV0IGFyZW4ndFxuICAgKiBndWFyYW50ZWVkIHRvIGV4ZWN1dGUgc3luY2hyb25vdXNseS5cbiAgICovXG4gIHByaXZhdGUgYW1iaWd1b3VzTm9kZVF1ZXVlOiB0cy5Ob2RlW10gPSBbXTtcblxuICAvKipcbiAgICogRnVuY3Rpb24gY29udGV4dCB0aGF0IGhvbGRzIHRoZSBUeXBlU2NyaXB0IG5vZGUgdmFsdWVzIGZvciBhbGwgcGFyYW1ldGVyc1xuICAgKiBvZiB0aGUgY3VycmVudGx5IGFuYWx5emVkIGZ1bmN0aW9uIGJsb2NrLlxuICAgKi9cbiAgcHJpdmF0ZSBjb250ZXh0OiBGdW5jdGlvbkNvbnRleHQgPSBuZXcgTWFwKCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGRlY2xhcmF0aW9uOiB0cy5Ob2RlLCBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICAgIHByaXZhdGUgYmFzZUNvbnRleHQ6IEZ1bmN0aW9uQ29udGV4dCA9IG5ldyBNYXAoKSkge31cblxuICBwcml2YXRlIGlzUmVmZXJyaW5nVG9TeW1ib2wobm9kZTogdHMuTm9kZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHN5bWJvbCA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihub2RlKTtcbiAgICByZXR1cm4gISFzeW1ib2wgJiYgc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gPT09IHRoaXMuZGVjbGFyYXRpb247XG4gIH1cblxuICBwcml2YXRlIGFkZEp1bXBFeHByZXNzaW9uVG9RdWV1ZShjYWxsRXhwcmVzc2lvbjogdHMuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICBjb25zdCBub2RlID0gdW53cmFwRXhwcmVzc2lvbihjYWxsRXhwcmVzc2lvbi5leHByZXNzaW9uKTtcblxuICAgIC8vIEluIGNhc2UgdGhlIGdpdmVuIGV4cHJlc3Npb24gaXMgYWxyZWFkeSByZWZlcnJpbmcgdG8gYSBmdW5jdGlvbi1saWtlIGRlY2xhcmF0aW9uLFxuICAgIC8vIHdlIGRvbid0IG5lZWQgdG8gcmVzb2x2ZSB0aGUgc3ltYm9sIG9mIHRoZSBleHByZXNzaW9uIGFzIHRoZSBqdW1wIGV4cHJlc3Npb24gaXNcbiAgICAvLyBkZWZpbmVkIGlubGluZSBhbmQgd2UgY2FuIGp1c3QgYWRkIHRoZSBnaXZlbiBub2RlIHRvIHRoZSBxdWV1ZS5cbiAgICBpZiAoaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihub2RlKSAmJiBub2RlLmJvZHkpIHtcbiAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2gobm9kZS5ib2R5KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjYWxsRXhwclN5bWJvbCA9IHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKG5vZGUpO1xuXG4gICAgaWYgKCFjYWxsRXhwclN5bWJvbCB8fCAhY2FsbEV4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbikge1xuICAgICAgdGhpcy5wZWVrSW50b0p1bXBFeHByZXNzaW9uKGNhbGxFeHByZXNzaW9uKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBleHByZXNzaW9uRGVjbCA9IHRoaXMuX3Jlc29sdmVOb2RlRnJvbUNvbnRleHQoY2FsbEV4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbik7XG5cbiAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkIG5vdCBhZGQgcHJldmlvdXNseSB2aXNpdGVkIHN5bWJvbHMgdG8gdGhlIHF1ZXVlIGFzXG4gICAgLy8gdGhpcyBjb3VsZCBjYXVzZSBjeWNsZXMuXG4gICAgaWYgKCFpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKGV4cHJlc3Npb25EZWNsKSB8fFxuICAgICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmhhcyhleHByZXNzaW9uRGVjbCkgfHwgIWV4cHJlc3Npb25EZWNsLmJvZHkpIHtcbiAgICAgIHRoaXMucGVla0ludG9KdW1wRXhwcmVzc2lvbihjYWxsRXhwcmVzc2lvbik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IGZvciB0aGUgbmV3IGp1bXAgZXhwcmVzc2lvbiBhbmQgaXRzIHNwZWNpZmllZCBhcmd1bWVudHMuXG4gICAgdGhpcy5fdXBkYXRlQ29udGV4dChjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHMsIGV4cHJlc3Npb25EZWNsLnBhcmFtZXRlcnMpO1xuXG4gICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5hZGQoZXhwcmVzc2lvbkRlY2wpO1xuICAgIHRoaXMubm9kZVF1ZXVlLnB1c2goZXhwcmVzc2lvbkRlY2wuYm9keSk7XG4gIH1cblxuICBwcml2YXRlIGFkZE5ld0V4cHJlc3Npb25Ub1F1ZXVlKG5vZGU6IHRzLk5ld0V4cHJlc3Npb24pIHtcbiAgICBjb25zdCBuZXdFeHByU3ltYm9sID0gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUodW53cmFwRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG5ldyBleHByZXNzaW9ucyB3aGljaCByZXNvbHZlIHRvIGNsYXNzZXMuIFRlY2huaWNhbGx5IFwibmV3XCIgY291bGRcbiAgICAvLyBhbHNvIGNhbGwgdm9pZCBmdW5jdGlvbnMgb3Igb2JqZWN0cyB3aXRoIGEgY29uc3RydWN0b3Igc2lnbmF0dXJlLiBBbHNvIG5vdGUgdGhhdFxuICAgIC8vIHdlIHNob3VsZCBub3QgdmlzaXQgYWxyZWFkeSB2aXNpdGVkIHN5bWJvbHMgYXMgdGhpcyBjb3VsZCBjYXVzZSBjeWNsZXMuXG4gICAgaWYgKCFuZXdFeHByU3ltYm9sIHx8ICFuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gfHxcbiAgICAgICAgIXRzLmlzQ2xhc3NEZWNsYXJhdGlvbihuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pKSB7XG4gICAgICB0aGlzLnBlZWtJbnRvSnVtcEV4cHJlc3Npb24obm9kZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0Q29uc3RydWN0b3IgPVxuICAgICAgICBuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ubWVtYmVycy5maW5kKHRzLmlzQ29uc3RydWN0b3JEZWNsYXJhdGlvbik7XG5cbiAgICBpZiAodGFyZ2V0Q29uc3RydWN0b3IgJiYgdGFyZ2V0Q29uc3RydWN0b3IuYm9keSAmJlxuICAgICAgICAhdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5oYXModGFyZ2V0Q29uc3RydWN0b3IpKSB7XG4gICAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcgZXhwcmVzc2lvbiBhbmQgaXRzIHNwZWNpZmllZCBjb25zdHJ1Y3RvclxuICAgICAgLy8gcGFyYW1ldGVycyBpZiBhcmd1bWVudHMgYXJlIHBhc3NlZCB0byB0aGUgY2xhc3MgY29uc3RydWN0b3IuXG4gICAgICBpZiAobm9kZS5hcmd1bWVudHMpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGV4dChub2RlLmFyZ3VtZW50cywgdGFyZ2V0Q29uc3RydWN0b3IucGFyYW1ldGVycyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuYWRkKHRhcmdldENvbnN0cnVjdG9yKTtcbiAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2godGFyZ2V0Q29uc3RydWN0b3IuYm9keSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucGVla0ludG9KdW1wRXhwcmVzc2lvbihub2RlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZpc2l0UHJvcGVydHlBY2Nlc3NvcnMoXG4gICAgICBub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24sIGNoZWNrU2V0dGVyOiBib29sZWFuLCBjaGVja0dldHRlcjogYm9vbGVhbikge1xuICAgIGNvbnN0IHByb3BlcnR5U3ltYm9sID0gdGhpcy5fZ2V0UHJvcGVydHlBY2Nlc3NTeW1ib2wobm9kZSk7XG5cbiAgICBpZiAocHJvcGVydHlTeW1ib2w/LmRlY2xhcmF0aW9ucyA9PT0gdW5kZWZpbmVkIHx8IHByb3BlcnR5U3ltYm9sLmRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDAgfHxcbiAgICAgICAgKHByb3BlcnR5U3ltYm9sLmdldEZsYWdzKCkgJiB0cy5TeW1ib2xGbGFncy5BY2Nlc3NvcikgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB3ZSBjaGVja2VkIHRoZSBzeW1ib2wgZmxhZ3MgYW5kIHRoZSBzeW1ib2wgaXMgZGVzY3JpYmluZyBhbiBhY2Nlc3NvciwgdGhlXG4gICAgLy8gZGVjbGFyYXRpb25zIGFyZSBndWFyYW50ZWVkIHRvIG9ubHkgY29udGFpbiB0aGUgZ2V0dGVycyBhbmQgc2V0dGVycy5cbiAgICBjb25zdCBhY2Nlc3NvcnMgPSBwcm9wZXJ0eVN5bWJvbC5kZWNsYXJhdGlvbnMgYXMgdHMuQWNjZXNzb3JEZWNsYXJhdGlvbltdO1xuXG4gICAgYWNjZXNzb3JzXG4gICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgICBkID0+IChjaGVja1NldHRlciAmJiB0cy5pc1NldEFjY2Vzc29yKGQpIHx8IGNoZWNrR2V0dGVyICYmIHRzLmlzR2V0QWNjZXNzb3IoZCkpICYmXG4gICAgICAgICAgICAgICAgZC5ib2R5ICYmICF0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmhhcyhkKSlcbiAgICAgICAgLmZvckVhY2goZCA9PiB7XG4gICAgICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5hZGQoZCk7XG4gICAgICAgICAgdGhpcy5ub2RlUXVldWUucHVzaChkLmJvZHkhKTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHZpc2l0QmluYXJ5RXhwcmVzc2lvbihub2RlOiB0cy5CaW5hcnlFeHByZXNzaW9uKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGVmdEV4cHIgPSB1bndyYXBFeHByZXNzaW9uKG5vZGUubGVmdCk7XG5cbiAgICBpZiAoIXRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKGxlZnRFeHByKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChCSU5BUllfQ09NUE9VTkRfVE9LRU5TLmluZGV4T2Yobm9kZS5vcGVyYXRvclRva2VuLmtpbmQpICE9PSAtMSkge1xuICAgICAgLy8gQ29tcG91bmQgYXNzaWdubWVudHMgYWx3YXlzIGNhdXNlIHRoZSBnZXR0ZXIgYW5kIHNldHRlciB0byBiZSBjYWxsZWQuXG4gICAgICAvLyBUaGVyZWZvcmUgd2UgbmVlZCB0byBjaGVjayB0aGUgc2V0dGVyIGFuZCBnZXR0ZXIgb2YgdGhlIHByb3BlcnR5IGFjY2Vzcy5cbiAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhsZWZ0RXhwciwgLyogc2V0dGVyICovIHRydWUsIC8qIGdldHRlciAqLyB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUub3BlcmF0b3JUb2tlbi5raW5kID09PSB0cy5TeW50YXhLaW5kLkVxdWFsc1Rva2VuKSB7XG4gICAgICAvLyBWYWx1ZSBhc3NpZ25tZW50cyB1c2luZyB0aGUgZXF1YWxzIHRva2VuIG9ubHkgY2F1c2UgdGhlIFwic2V0dGVyXCIgdG8gYmUgY2FsbGVkLlxuICAgICAgLy8gVGhlcmVmb3JlIHdlIG5lZWQgdG8gYW5hbHl6ZSB0aGUgc2V0dGVyIGRlY2xhcmF0aW9uIG9mIHRoZSBwcm9wZXJ0eSBhY2Nlc3MuXG4gICAgICB0aGlzLnZpc2l0UHJvcGVydHlBY2Nlc3NvcnMobGVmdEV4cHIsIC8qIHNldHRlciAqLyB0cnVlLCAvKiBnZXR0ZXIgKi8gZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGUgYmluYXJ5IGV4cHJlc3Npb24gaXMgbm90IGFuIGFzc2lnbm1lbnQsIGl0J3MgYSBzaW1wbGUgcHJvcGVydHkgcmVhZCBhbmRcbiAgICAgIC8vIHdlIG5lZWQgdG8gY2hlY2sgdGhlIGdldHRlciBkZWNsYXJhdGlvbiBpZiBwcmVzZW50LlxuICAgICAgdGhpcy52aXNpdFByb3BlcnR5QWNjZXNzb3JzKGxlZnRFeHByLCAvKiBzZXR0ZXIgKi8gZmFsc2UsIC8qIGdldHRlciAqLyB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBnZXRSZXNvbHZlZE5vZGVVc2FnZShzZWFyY2hOb2RlOiB0cy5Ob2RlKTogUmVzb2x2ZWRVc2FnZSB7XG4gICAgdGhpcy5ub2RlUXVldWUgPSBbc2VhcmNoTm9kZV07XG4gICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5jbGVhcigpO1xuICAgIHRoaXMuY29udGV4dC5jbGVhcigpO1xuXG4gICAgLy8gQ29weSBiYXNlIGNvbnRleHQgdmFsdWVzIGludG8gdGhlIGN1cnJlbnQgZnVuY3Rpb24gYmxvY2sgY29udGV4dC4gVGhlXG4gICAgLy8gYmFzZSBjb250ZXh0IGlzIHVzZWZ1bCBpZiBub2RlcyBuZWVkIHRvIGJlIG1hcHBlZCB0byBvdGhlciBub2Rlcy4gZS5nLlxuICAgIC8vIGFic3RyYWN0IHN1cGVyIGNsYXNzIG1ldGhvZHMgYXJlIG1hcHBlZCB0byB0aGVpciBpbXBsZW1lbnRhdGlvbiBub2RlIG9mXG4gICAgLy8gdGhlIGRlcml2ZWQgY2xhc3MuXG4gICAgdGhpcy5iYXNlQ29udGV4dC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB0aGlzLmNvbnRleHQuc2V0KGtleSwgdmFsdWUpKTtcblxuICAgIHJldHVybiB0aGlzLmlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUoc2VhcmNoTm9kZSk7XG4gIH1cblxuICBwcml2YXRlIGlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUoc2VhcmNoTm9kZTogdHMuTm9kZSk6IFJlc29sdmVkVXNhZ2Uge1xuICAgIHRoaXMuYW1iaWd1b3VzTm9kZVF1ZXVlID0gW107XG5cbiAgICB3aGlsZSAodGhpcy5ub2RlUXVldWUubGVuZ3RoKSB7XG4gICAgICBjb25zdCBub2RlID0gdGhpcy5ub2RlUXVldWUuc2hpZnQoKSE7XG5cbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIobm9kZSkgJiYgdGhpcy5pc1JlZmVycmluZ1RvU3ltYm9sKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiBSZXNvbHZlZFVzYWdlLlNZTkNIUk9OT1VTO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgY2FsbCBleHByZXNzaW9ucyB3aXRoaW4gVHlwZVNjcmlwdCBub2RlcyB0aGF0IGNhdXNlIGEganVtcCBpbiBjb250cm9sXG4gICAgICAvLyBmbG93LiBXZSByZXNvbHZlIHRoZSBjYWxsIGV4cHJlc3Npb24gdmFsdWUgZGVjbGFyYXRpb24gYW5kIGFkZCBpdCB0byB0aGUgbm9kZSBxdWV1ZS5cbiAgICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMuYWRkSnVtcEV4cHJlc3Npb25Ub1F1ZXVlKG5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgbmV3IGV4cHJlc3Npb25zIHRoYXQgY2F1c2UgYSBqdW1wIGluIGNvbnRyb2wgZmxvdy4gV2UgcmVzb2x2ZSB0aGVcbiAgICAgIC8vIGNvbnN0cnVjdG9yIGRlY2xhcmF0aW9uIG9mIHRoZSB0YXJnZXQgY2xhc3MgYW5kIGFkZCBpdCB0byB0aGUgbm9kZSBxdWV1ZS5cbiAgICAgIGlmICh0cy5pc05ld0V4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5hZGROZXdFeHByZXNzaW9uVG9RdWV1ZShub2RlKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgYWxzbyBuZWVkIHRvIGhhbmRsZSBiaW5hcnkgZXhwcmVzc2lvbnMgd2hlcmUgYSB2YWx1ZSBjYW4gYmUgZWl0aGVyIGFzc2lnbmVkIHRvXG4gICAgICAvLyB0aGUgcHJvcGVydHksIG9yIGEgdmFsdWUgaXMgcmVhZCBmcm9tIGEgcHJvcGVydHkgZXhwcmVzc2lvbi4gRGVwZW5kaW5nIG9uIHRoZVxuICAgICAgLy8gYmluYXJ5IGV4cHJlc3Npb24gb3BlcmF0b3IsIHNldHRlcnMgb3IgZ2V0dGVycyBuZWVkIHRvIGJlIGFuYWx5emVkLlxuICAgICAgaWYgKHRzLmlzQmluYXJ5RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICAvLyBJbiBjYXNlIHRoZSBiaW5hcnkgZXhwcmVzc2lvbiBjb250YWluZWQgYSBwcm9wZXJ0eSBleHByZXNzaW9uIG9uIHRoZSBsZWZ0IHNpZGUsIHdlXG4gICAgICAgIC8vIGRvbid0IHdhbnQgdG8gY29udGludWUgdmlzaXRpbmcgdGhpcyBwcm9wZXJ0eSBleHByZXNzaW9uIG9uIGl0cyBvd24uIFRoaXMgaXMgbmVjZXNzYXJ5XG4gICAgICAgIC8vIGJlY2F1c2UgdmlzaXRpbmcgdGhlIGV4cHJlc3Npb24gb24gaXRzIG93biBjYXVzZXMgYSBsb3NzIG9mIGNvbnRleHQuIGUuZy4gcHJvcGVydHlcbiAgICAgICAgLy8gYWNjZXNzIGV4cHJlc3Npb25zICpkbyBub3QqIGFsd2F5cyBjYXVzZSBhIHZhbHVlIHJlYWQgKGUuZy4gcHJvcGVydHkgYXNzaWdubWVudHMpXG4gICAgICAgIGlmICh0aGlzLnZpc2l0QmluYXJ5RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2gobm9kZS5yaWdodCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIHByb3BlcnR5IGFjY2VzcyBleHByZXNzaW9ucy4gUHJvcGVydHkgZXhwcmVzc2lvbnMgd2hpY2ggYXJlIHBhcnQgb2YgYmluYXJ5XG4gICAgICAvLyBleHByZXNzaW9ucyB3b24ndCBiZSBhZGRlZCB0byB0aGUgbm9kZSBxdWV1ZSwgc28gdGhlc2UgYWNjZXNzIGV4cHJlc3Npb25zIGFyZVxuICAgICAgLy8gZ3VhcmFudGVlZCB0byBiZSBcInJlYWRcIiBhY2Nlc3NlcyBhbmQgd2UgbmVlZCB0byBjaGVjayB0aGUgXCJnZXR0ZXJcIiBkZWNsYXJhdGlvbi5cbiAgICAgIGlmICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLnZpc2l0UHJvcGVydHlBY2Nlc3NvcnMobm9kZSwgLyogc2V0dGVyICovIGZhbHNlLCAvKiBnZXR0ZXIgKi8gdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvIG5vdCB2aXNpdCBub2RlcyB0aGF0IGRlY2xhcmUgYSBibG9jayBvZiBzdGF0ZW1lbnRzIGJ1dCBhcmUgbm90IGV4ZWN1dGVkXG4gICAgICAvLyBzeW5jaHJvbm91c2x5IChlLmcuIGZ1bmN0aW9uIGRlY2xhcmF0aW9ucykuIFdlIG9ubHkgd2FudCB0byBjaGVjayBUeXBlU2NyaXB0XG4gICAgICAvLyBub2RlcyB3aGljaCBhcmUgc3luY2hyb25vdXNseSBleGVjdXRlZCBpbiB0aGUgY29udHJvbCBmbG93LlxuICAgICAgaWYgKCFpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2goLi4ubm9kZS5nZXRDaGlsZHJlbigpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5hbWJpZ3VvdXNOb2RlUXVldWUubGVuZ3RoKSB7XG4gICAgICAvLyBVcGRhdGUgdGhlIG5vZGUgcXVldWUgdG8gYWxsIHN0b3JlZCBhbWJpZ3VvdXMgbm9kZXMuIFRoZXNlIG5vZGVzIGFyZSBub3RcbiAgICAgIC8vIGd1YXJhbnRlZWQgdG8gYmUgZXhlY3V0ZWQgYW5kIHRoZXJlZm9yZSBpbiBjYXNlIG9mIGEgc3luY2hyb25vdXMgdXNhZ2VcbiAgICAgIC8vIHdpdGhpbiBvbmUgb2YgdGhvc2Ugbm9kZXMsIHRoZSByZXNvbHZlZCB1c2FnZSBpcyBhbWJpZ3VvdXMuXG4gICAgICB0aGlzLm5vZGVRdWV1ZSA9IHRoaXMuYW1iaWd1b3VzTm9kZVF1ZXVlO1xuICAgICAgY29uc3QgdXNhZ2UgPSB0aGlzLmlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUoc2VhcmNoTm9kZSk7XG4gICAgICByZXR1cm4gdXNhZ2UgPT09IFJlc29sdmVkVXNhZ2UuU1lOQ0hST05PVVMgPyBSZXNvbHZlZFVzYWdlLkFNQklHVU9VUyA6IHVzYWdlO1xuICAgIH1cbiAgICByZXR1cm4gUmVzb2x2ZWRVc2FnZS5BU1lOQ0hST05PVVM7XG4gIH1cblxuICAvKipcbiAgICogUGVla3MgaW50byB0aGUgZ2l2ZW4ganVtcCBleHByZXNzaW9uIGJ5IGFkZGluZyBhbGwgZnVuY3Rpb24gbGlrZSBkZWNsYXJhdGlvbnNcbiAgICogd2hpY2ggYXJlIHJlZmVyZW5jZWQgaW4gdGhlIGp1bXAgZXhwcmVzc2lvbiBhcmd1bWVudHMgdG8gdGhlIGFtYmlndW91cyBub2RlXG4gICAqIHF1ZXVlLiBUaGVzZSBhcmd1bWVudHMgY291bGQgdGVjaG5pY2FsbHkgYWNjZXNzIHRoZSBnaXZlbiBkZWNsYXJhdGlvbiBidXQgaXQnc1xuICAgKiBub3QgZ3VhcmFudGVlZCB0aGF0IHRoZSBqdW1wIGV4cHJlc3Npb24gaXMgZXhlY3V0ZWQuIEluIHRoYXQgY2FzZSB0aGUgcmVzb2x2ZWRcbiAgICogdXNhZ2UgaXMgYW1iaWd1b3VzLlxuICAgKi9cbiAgcHJpdmF0ZSBwZWVrSW50b0p1bXBFeHByZXNzaW9uKGp1bXBFeHA6IHRzLkNhbGxFeHByZXNzaW9ufHRzLk5ld0V4cHJlc3Npb24pIHtcbiAgICBpZiAoIWp1bXBFeHAuYXJndW1lbnRzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRm9yIHNvbWUgY2FsbCBleHByZXNzaW9ucyB3ZSBkb24ndCB3YW50IHRvIGFkZCB0aGUgYXJndW1lbnRzIHRvIHRoZVxuICAgIC8vIGFtYmlndW91cyBub2RlIHF1ZXVlLiBlLmcuIFwic2V0VGltZW91dFwiIGlzIG5vdCBhbmFseXphYmxlIGJ1dCBpc1xuICAgIC8vIGd1YXJhbnRlZWQgdG8gZXhlY3V0ZSBpdHMgYXJndW1lbnQgYXN5bmNocm9ub3VzbHkuIFdlIGhhbmRsZSBhIHN1YnNldFxuICAgIC8vIG9mIHRoZXNlIGNhbGwgZXhwcmVzc2lvbnMgYnkgaGF2aW5nIGEgaGFyZGNvZGVkIGxpc3Qgb2Ygc29tZS5cbiAgICBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihqdW1wRXhwKSkge1xuICAgICAgY29uc3Qgc3ltYm9sID0gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUoanVtcEV4cC5leHByZXNzaW9uKTtcbiAgICAgIGlmIChzeW1ib2wgJiYgc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHtcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uLnBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudE5vZGUgJiYgKHRzLmlzSW50ZXJmYWNlRGVjbGFyYXRpb24ocGFyZW50Tm9kZSkgfHwgdHMuaXNTb3VyY2VGaWxlKHBhcmVudE5vZGUpKSAmJlxuICAgICAgICAgICAgKHRzLmlzTWV0aG9kU2lnbmF0dXJlKHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB8fFxuICAgICAgICAgICAgIHRzLmlzRnVuY3Rpb25EZWNsYXJhdGlvbihzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpICYmXG4gICAgICAgICAgICBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbi5uYW1lKSB7XG4gICAgICAgICAgY29uc3QgcGFyZW50TmFtZSA9IHRzLmlzSW50ZXJmYWNlRGVjbGFyYXRpb24ocGFyZW50Tm9kZSkgPyBwYXJlbnROb2RlLm5hbWUudGV4dCA6IG51bGw7XG4gICAgICAgICAgY29uc3QgY2FsbE5hbWUgPSBnZXRQcm9wZXJ0eU5hbWVUZXh0KHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uLm5hbWUpO1xuICAgICAgICAgIGlmIChBU1lOQ19FWFRFUk5BTF9DQUxMUy5zb21lKFxuICAgICAgICAgICAgICAgICAgYyA9PlxuICAgICAgICAgICAgICAgICAgICAgIChjLm5hbWUgPT09IGNhbGxOYW1lICYmXG4gICAgICAgICAgICAgICAgICAgICAgIChjLnBhcmVudC5pbmRleE9mKHBhcmVudE5hbWUpICE9PSAtMSB8fCBjLnBhcmVudC5pbmRleE9mKCcqJykgIT09IC0xKSkpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAganVtcEV4cC5hcmd1bWVudHMhLmZvckVhY2goKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAgIG5vZGUgPSB0aGlzLl9yZXNvbHZlRGVjbGFyYXRpb25PZk5vZGUobm9kZSk7XG5cbiAgICAgIGlmICh0cy5pc1ZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSkgJiYgbm9kZS5pbml0aWFsaXplcikge1xuICAgICAgICBub2RlID0gbm9kZS5pbml0aWFsaXplcjtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24obm9kZSkgJiYgISFub2RlLmJvZHkpIHtcbiAgICAgICAgdGhpcy5hbWJpZ3VvdXNOb2RlUXVldWUucHVzaChub2RlLmJvZHkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGEgZ2l2ZW4gbm9kZSBmcm9tIHRoZSBjb250ZXh0LiBJbiBjYXNlIHRoZSBub2RlIGlzIG5vdCBtYXBwZWQgaW5cbiAgICogdGhlIGNvbnRleHQsIHRoZSBvcmlnaW5hbCBub2RlIGlzIHJldHVybmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzb2x2ZU5vZGVGcm9tQ29udGV4dChub2RlOiB0cy5Ob2RlKTogdHMuTm9kZSB7XG4gICAgaWYgKHRoaXMuY29udGV4dC5oYXMobm9kZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnRleHQuZ2V0KG5vZGUpITtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY29udGV4dCB0byByZWZsZWN0IHRoZSBuZXdseSBzZXQgcGFyYW1ldGVyIHZhbHVlcy4gVGhpcyBhbGxvd3MgZnV0dXJlXG4gICAqIHJlZmVyZW5jZXMgdG8gZnVuY3Rpb24gcGFyYW1ldGVycyB0byBiZSByZXNvbHZlZCB0byB0aGUgYWN0dWFsIG5vZGUgdGhyb3VnaCB0aGUgY29udGV4dC5cbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbnRleHQoXG4gICAgICBjYWxsQXJnczogdHMuTm9kZUFycmF5PHRzLkV4cHJlc3Npb24+LCBwYXJhbWV0ZXJzOiB0cy5Ob2RlQXJyYXk8dHMuUGFyYW1ldGVyRGVjbGFyYXRpb24+KSB7XG4gICAgcGFyYW1ldGVycy5mb3JFYWNoKChwYXJhbWV0ZXIsIGluZGV4KSA9PiB7XG4gICAgICBsZXQgYXJndW1lbnROb2RlOiB0cy5Ob2RlID0gY2FsbEFyZ3NbaW5kZXhdO1xuXG4gICAgICBpZiAoIWFyZ3VtZW50Tm9kZSkge1xuICAgICAgICBpZiAoIXBhcmFtZXRlci5pbml0aWFsaXplcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFyZ3VtZW50IGNhbiBiZSB1bmRlZmluZWQgaW4gY2FzZSB0aGUgZnVuY3Rpb24gcGFyYW1ldGVyIGhhcyBhIGRlZmF1bHRcbiAgICAgICAgLy8gdmFsdWUuIEluIHRoYXQgY2FzZSB3ZSB3YW50IHRvIHN0b3JlIHRoZSBwYXJhbWV0ZXIgZGVmYXVsdCB2YWx1ZSBpbiB0aGUgY29udGV4dC5cbiAgICAgICAgYXJndW1lbnROb2RlID0gcGFyYW1ldGVyLmluaXRpYWxpemVyO1xuICAgICAgfVxuXG4gICAgICBpZiAodHMuaXNJZGVudGlmaWVyKGFyZ3VtZW50Tm9kZSkpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LnNldChwYXJhbWV0ZXIsIHRoaXMuX3Jlc29sdmVEZWNsYXJhdGlvbk9mTm9kZShhcmd1bWVudE5vZGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5zZXQocGFyYW1ldGVyLCBhcmd1bWVudE5vZGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIHRoZSBkZWNsYXJhdGlvbiBvZiBhIGdpdmVuIFR5cGVTY3JpcHQgbm9kZS4gRm9yIGV4YW1wbGUgYW4gaWRlbnRpZmllciBjYW5cbiAgICogcmVmZXIgdG8gYSBmdW5jdGlvbiBwYXJhbWV0ZXIuIFRoaXMgcGFyYW1ldGVyIGNhbiB0aGVuIGJlIHJlc29sdmVkIHRocm91Z2ggdGhlXG4gICAqIGZ1bmN0aW9uIGNvbnRleHQuXG4gICAqL1xuICBwcml2YXRlIF9yZXNvbHZlRGVjbGFyYXRpb25PZk5vZGUobm9kZTogdHMuTm9kZSk6IHRzLk5vZGUge1xuICAgIGNvbnN0IHN5bWJvbCA9IHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKG5vZGUpO1xuXG4gICAgaWYgKCFzeW1ib2wgfHwgIXN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcmVzb2x2ZU5vZGVGcm9tQ29udGV4dChzeW1ib2wudmFsdWVEZWNsYXJhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVjbGFyYXRpb24gc3ltYm9sIG9mIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlLiBSZXNvbHZlcyBhbGlhc2VkXG4gICAqIHN5bWJvbHMgdG8gdGhlIHN5bWJvbCBjb250YWluaW5nIHRoZSB2YWx1ZSBkZWNsYXJhdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKG5vZGU6IHRzLk5vZGUpOiB0cy5TeW1ib2x8bnVsbCB7XG4gICAgbGV0IHN5bWJvbCA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihub2RlKTtcblxuICAgIGlmICghc3ltYm9sKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZXNvbHZlIHRoZSBzeW1ib2wgdG8gaXQncyBvcmlnaW5hbCBkZWNsYXJhdGlvbiBzeW1ib2wuXG4gICAgd2hpbGUgKHN5bWJvbC5mbGFncyAmIHRzLlN5bWJvbEZsYWdzLkFsaWFzKSB7XG4gICAgICBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldEFsaWFzZWRTeW1ib2woc3ltYm9sKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3ltYm9sO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHN5bWJvbCBvZiB0aGUgZ2l2ZW4gcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb24uICovXG4gIHByaXZhdGUgX2dldFByb3BlcnR5QWNjZXNzU3ltYm9sKG5vZGU6IHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbik6IHRzLlN5bWJvbHxudWxsIHtcbiAgICBsZXQgcHJvcGVydHlTeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShub2RlLm5hbWUpO1xuXG4gICAgaWYgKCFwcm9wZXJ0eVN5bWJvbCB8fCAhcHJvcGVydHlTeW1ib2wudmFsdWVEZWNsYXJhdGlvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbnRleHQuaGFzKHByb3BlcnR5U3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pKSB7XG4gICAgICByZXR1cm4gcHJvcGVydHlTeW1ib2w7XG4gICAgfVxuXG4gICAgLy8gSW4gY2FzZSB0aGUgY29udGV4dCBoYXMgdGhlIHZhbHVlIGRlY2xhcmF0aW9uIG9mIHRoZSBnaXZlbiBwcm9wZXJ0eSBhY2Nlc3NcbiAgICAvLyBuYW1lIGlkZW50aWZpZXIsIHdlIG5lZWQgdG8gcmVwbGFjZSB0aGUgXCJwcm9wZXJ0eVN5bWJvbFwiIHdpdGggdGhlIHN5bWJvbFxuICAgIC8vIHJlZmVycmluZyB0byB0aGUgcmVzb2x2ZWQgc3ltYm9sIGJhc2VkIG9uIHRoZSBjb250ZXh0LiBlLmcuIGFic3RyYWN0IHByb3BlcnRpZXNcbiAgICAvLyBjYW4gdWx0aW1hdGVseSByZXNvbHZlIGludG8gYW4gYWNjZXNzb3IgZGVjbGFyYXRpb24gYmFzZWQgb24gdGhlIGltcGxlbWVudGF0aW9uLlxuICAgIGNvbnN0IGNvbnRleHROb2RlID0gdGhpcy5fcmVzb2x2ZU5vZGVGcm9tQ29udGV4dChwcm9wZXJ0eVN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKTtcblxuICAgIGlmICghdHMuaXNBY2Nlc3Nvcihjb250ZXh0Tm9kZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFJlc29sdmUgdGhlIHN5bWJvbCByZWZlcnJpbmcgdG8gdGhlIFwiYWNjZXNzb3JcIiB1c2luZyB0aGUgbmFtZSBpZGVudGlmaWVyXG4gICAgLy8gb2YgdGhlIGFjY2Vzc29yIGRlY2xhcmF0aW9uLlxuICAgIHJldHVybiB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShjb250ZXh0Tm9kZS5uYW1lKTtcbiAgfVxufVxuIl19