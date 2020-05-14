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
        define("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/declaration_usage_visitor", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/functions", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeclarationUsageVisitor = exports.ResolvedUsage = void 0;
    const ts = require("typescript");
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
        ts.SyntaxKind.CaretEqualsToken,
        ts.SyntaxKind.AsteriskEqualsToken,
        ts.SyntaxKind.AmpersandEqualsToken,
        ts.SyntaxKind.BarEqualsToken,
        ts.SyntaxKind.AsteriskAsteriskEqualsToken,
        ts.SyntaxKind.PlusEqualsToken,
        ts.SyntaxKind.MinusEqualsToken,
        ts.SyntaxKind.SlashEqualsToken,
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
            const node = functions_1.unwrapExpression(callExpression.expression);
            // In case the given expression is already referring to a function-like declaration,
            // we don't need to resolve the symbol of the expression as the jump expression is
            // defined inline and we can just add the given node to the queue.
            if (functions_1.isFunctionLikeDeclaration(node) && node.body) {
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
            if (!functions_1.isFunctionLikeDeclaration(expressionDecl) ||
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
            const newExprSymbol = this._getDeclarationSymbolOfNode(functions_1.unwrapExpression(node.expression));
            // Only handle new expressions which resolve to classes. Technically "new" could
            // also call void functions or objects with a constructor signature. Also note that
            // we should not visit already visited symbols as this could cause cycles.
            if (!newExprSymbol || !newExprSymbol.valueDeclaration ||
                !ts.isClassDeclaration(newExprSymbol.valueDeclaration)) {
                this.peekIntoJumpExpression(node);
                return;
            }
            const targetConstructor = newExprSymbol.valueDeclaration.members.find(ts.isConstructorDeclaration);
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
            if (!propertySymbol || !propertySymbol.declarations.length ||
                (propertySymbol.getFlags() & ts.SymbolFlags.Accessor) === 0) {
                return;
            }
            // Since we checked the symbol flags and the symbol is describing an accessor, the
            // declarations are guaranteed to only contain the getters and setters.
            const accessors = propertySymbol.declarations;
            accessors
                .filter(d => (checkSetter && ts.isSetAccessor(d) || checkGetter && ts.isGetAccessor(d)) &&
                d.body && !this.visitedJumpExprNodes.has(d))
                .forEach(d => {
                this.visitedJumpExprNodes.add(d);
                this.nodeQueue.push(d.body);
            });
        }
        visitBinaryExpression(node) {
            const leftExpr = functions_1.unwrapExpression(node.left);
            if (!ts.isPropertyAccessExpression(leftExpr)) {
                return false;
            }
            if (BINARY_COMPOUND_TOKENS.indexOf(node.operatorToken.kind) !== -1) {
                // Compound assignments always cause the getter and setter to be called.
                // Therefore we need to check the setter and getter of the property access.
                this.visitPropertyAccessors(leftExpr, /* setter */ true, /* getter */ true);
            }
            else if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
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
                if (ts.isIdentifier(node) && this.isReferringToSymbol(node)) {
                    return ResolvedUsage.SYNCHRONOUS;
                }
                // Handle call expressions within TypeScript nodes that cause a jump in control
                // flow. We resolve the call expression value declaration and add it to the node queue.
                if (ts.isCallExpression(node)) {
                    this.addJumpExpressionToQueue(node);
                }
                // Handle new expressions that cause a jump in control flow. We resolve the
                // constructor declaration of the target class and add it to the node queue.
                if (ts.isNewExpression(node)) {
                    this.addNewExpressionToQueue(node);
                }
                // We also need to handle binary expressions where a value can be either assigned to
                // the property, or a value is read from a property expression. Depending on the
                // binary expression operator, setters or getters need to be analyzed.
                if (ts.isBinaryExpression(node)) {
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
                if (ts.isPropertyAccessExpression(node)) {
                    this.visitPropertyAccessors(node, /* setter */ false, /* getter */ true);
                }
                // Do not visit nodes that declare a block of statements but are not executed
                // synchronously (e.g. function declarations). We only want to check TypeScript
                // nodes which are synchronously executed in the control flow.
                if (!functions_1.isFunctionLikeDeclaration(node)) {
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
            if (ts.isCallExpression(jumpExp)) {
                const symbol = this._getDeclarationSymbolOfNode(jumpExp.expression);
                if (symbol && symbol.valueDeclaration) {
                    const parentNode = symbol.valueDeclaration.parent;
                    if (parentNode && (ts.isInterfaceDeclaration(parentNode) || ts.isSourceFile(parentNode)) &&
                        (ts.isMethodSignature(symbol.valueDeclaration) ||
                            ts.isFunctionDeclaration(symbol.valueDeclaration)) &&
                        symbol.valueDeclaration.name) {
                        const parentName = ts.isInterfaceDeclaration(parentNode) ? parentNode.name.text : null;
                        const callName = property_name_1.getPropertyNameText(symbol.valueDeclaration.name);
                        if (ASYNC_EXTERNAL_CALLS.some(c => (c.name === callName &&
                            (c.parent.indexOf(parentName) !== -1 || c.parent.indexOf('*') !== -1)))) {
                            return;
                        }
                    }
                }
            }
            jumpExp.arguments.forEach((node) => {
                node = this._resolveDeclarationOfNode(node);
                if (ts.isVariableDeclaration(node) && node.initializer) {
                    node = node.initializer;
                }
                if (functions_1.isFunctionLikeDeclaration(node) && !!node.body) {
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
                if (ts.isIdentifier(argumentNode)) {
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
            while (symbol.flags & ts.SymbolFlags.Alias) {
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
            if (!ts.isAccessor(contextNode)) {
                return null;
            }
            // Resolve the symbol referring to the "accessor" using the name identifier
            // of the accessor declaration.
            return this._getDeclarationSymbolOfNode(contextNode.name);
        }
    }
    exports.DeclarationUsageVisitor = DeclarationUsageVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsbUZBQW1HO0lBQ25HLDJGQUErRTtJQUkvRSxJQUFZLGFBSVg7SUFKRCxXQUFZLGFBQWE7UUFDdkIsK0RBQVcsQ0FBQTtRQUNYLGlFQUFZLENBQUE7UUFDWiwyREFBUyxDQUFBO0lBQ1gsQ0FBQyxFQUpXLGFBQWEsR0FBYixxQkFBYSxLQUFiLHFCQUFhLFFBSXhCO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTSxzQkFBc0IsR0FBRztRQUM3QixFQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtRQUM5QixFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtRQUNqQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQjtRQUNsQyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWM7UUFDNUIsRUFBRSxDQUFDLFVBQVUsQ0FBQywyQkFBMkI7UUFDekMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlO1FBQzdCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO1FBQzlCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO0tBQy9CLENBQUM7SUFFRjs7O09BR0c7SUFDSCxNQUFNLG9CQUFvQixHQUFHO1FBQzNCLEVBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztRQUNuQyxFQUFDLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7UUFDcEMs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SSxDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRWxGLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUMvQixPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQsMkVBQTJFO1lBQzNFLCtCQUErQjtZQUMvQixPQUFPLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsQ0FBQztLQUNGO0lBN1dELDBEQTZXQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2lzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24sIHVud3JhcEV4cHJlc3Npb259IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcblxuZXhwb3J0IHR5cGUgRnVuY3Rpb25Db250ZXh0ID0gTWFwPHRzLk5vZGUsIHRzLk5vZGU+O1xuXG5leHBvcnQgZW51bSBSZXNvbHZlZFVzYWdlIHtcbiAgU1lOQ0hST05PVVMsXG4gIEFTWU5DSFJPTk9VUyxcbiAgQU1CSUdVT1VTLFxufVxuXG4vKipcbiAqIExpc3Qgb2YgVHlwZVNjcmlwdCBzeW50YXggdG9rZW5zIHRoYXQgY2FuIGJlIHVzZWQgd2l0aGluIGEgYmluYXJ5IGV4cHJlc3Npb24gYXNcbiAqIGNvbXBvdW5kIGFzc2lnbm1lbnQuIFRoZXNlIGltcGx5IGEgcmVhZCBhbmQgd3JpdGUgb2YgdGhlIGxlZnQtc2lkZSBleHByZXNzaW9uLlxuICovXG5jb25zdCBCSU5BUllfQ09NUE9VTkRfVE9LRU5TID0gW1xuICB0cy5TeW50YXhLaW5kLkNhcmV0RXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuQXN0ZXJpc2tFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5BbXBlcnNhbmRFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5CYXJFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5Bc3Rlcmlza0FzdGVyaXNrRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuUGx1c0VxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLk1pbnVzRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuU2xhc2hFcXVhbHNUb2tlbixcbl07XG5cbi8qKlxuICogTGlzdCBvZiBrbm93biBhc3luY2hyb25vdXMgZXh0ZXJuYWwgY2FsbCBleHByZXNzaW9ucyB3aGljaCBhcmVuJ3QgYW5hbHl6YWJsZVxuICogYnV0IGFyZSBndWFyYW50ZWVkIHRvIG5vdCBleGVjdXRlIHRoZSBwYXNzZWQgYXJndW1lbnQgc3luY2hyb25vdXNseS5cbiAqL1xuY29uc3QgQVNZTkNfRVhURVJOQUxfQ0FMTFMgPSBbXG4gIHtwYXJlbnQ6IFsnUHJvbWlzZSddLCBuYW1lOiAndGhlbid9LFxuICB7cGFyZW50OiBbJ1Byb21pc2UnXSwgbmFtZTogJ2NhdGNoJ30sXG4gIHtwYXJlbnQ6IFtudWxsLCAnV2luZG93J10sIG5hbWU6ICdyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnfSxcbiAge3BhcmVudDogW251bGwsICdXaW5kb3cnXSwgbmFtZTogJ3NldFRpbWVvdXQnfSxcbiAge3BhcmVudDogW251bGwsICdXaW5kb3cnXSwgbmFtZTogJ3NldEludGVydmFsJ30sXG4gIHtwYXJlbnQ6IFsnKiddLCBuYW1lOiAnYWRkRXZlbnRMaXN0ZW5lcid9LFxuXTtcblxuLyoqXG4gKiBDbGFzcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRldGVybWluZSBpZiBhIGdpdmVuIFR5cGVTY3JpcHQgbm9kZSBpcyB1c2VkIHdpdGhpblxuICogb3RoZXIgZ2l2ZW4gVHlwZVNjcmlwdCBub2Rlcy4gVGhpcyBpcyBhY2hpZXZlZCBieSB3YWxraW5nIHRocm91Z2ggYWxsIGNoaWxkcmVuXG4gKiBvZiB0aGUgZ2l2ZW4gbm9kZSBhbmQgY2hlY2tpbmcgZm9yIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gZGVjbGFyYXRpb24uIFRoZSB2aXNpdG9yXG4gKiBhbHNvIGhhbmRsZXMgcG90ZW50aWFsIGNvbnRyb2wgZmxvdyBjaGFuZ2VzIGNhdXNlZCBieSBjYWxsL25ldyBleHByZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIERlY2xhcmF0aW9uVXNhZ2VWaXNpdG9yIHtcbiAgLyoqIFNldCBvZiB2aXNpdGVkIHN5bWJvbHMgdGhhdCBjYXVzZWQgYSBqdW1wIGluIGNvbnRyb2wgZmxvdy4gKi9cbiAgcHJpdmF0ZSB2aXNpdGVkSnVtcEV4cHJOb2RlcyA9IG5ldyBTZXQ8dHMuTm9kZT4oKTtcblxuICAvKipcbiAgICogUXVldWUgb2Ygbm9kZXMgdGhhdCBuZWVkIHRvIGJlIGNoZWNrZWQgZm9yIGRlY2xhcmF0aW9uIHVzYWdlIGFuZFxuICAgKiBhcmUgZ3VhcmFudGVlZCB0byBiZSBleGVjdXRlZCBzeW5jaHJvbm91c2x5LlxuICAgKi9cbiAgcHJpdmF0ZSBub2RlUXVldWU6IHRzLk5vZGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBOb2RlcyB3aGljaCBuZWVkIHRvIGJlIGNoZWNrZWQgZm9yIGRlY2xhcmF0aW9uIHVzYWdlIGJ1dCBhcmVuJ3RcbiAgICogZ3VhcmFudGVlZCB0byBleGVjdXRlIHN5bmNocm9ub3VzbHkuXG4gICAqL1xuICBwcml2YXRlIGFtYmlndW91c05vZGVRdWV1ZTogdHMuTm9kZVtdID0gW107XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIGNvbnRleHQgdGhhdCBob2xkcyB0aGUgVHlwZVNjcmlwdCBub2RlIHZhbHVlcyBmb3IgYWxsIHBhcmFtZXRlcnNcbiAgICogb2YgdGhlIGN1cnJlbnRseSBhbmFseXplZCBmdW5jdGlvbiBibG9jay5cbiAgICovXG4gIHByaXZhdGUgY29udGV4dDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBkZWNsYXJhdGlvbjogdHMuTm9kZSwgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIGJhc2VDb250ZXh0OiBGdW5jdGlvbkNvbnRleHQgPSBuZXcgTWFwKCkpIHt9XG5cbiAgcHJpdmF0ZSBpc1JlZmVycmluZ1RvU3ltYm9sKG5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG4gICAgcmV0dXJuICEhc3ltYm9sICYmIHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uID09PSB0aGlzLmRlY2xhcmF0aW9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRKdW1wRXhwcmVzc2lvblRvUXVldWUoY2FsbEV4cHJlc3Npb246IHRzLkNhbGxFeHByZXNzaW9uKSB7XG4gICAgY29uc3Qgbm9kZSA9IHVud3JhcEV4cHJlc3Npb24oY2FsbEV4cHJlc3Npb24uZXhwcmVzc2lvbik7XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBnaXZlbiBleHByZXNzaW9uIGlzIGFscmVhZHkgcmVmZXJyaW5nIHRvIGEgZnVuY3Rpb24tbGlrZSBkZWNsYXJhdGlvbixcbiAgICAvLyB3ZSBkb24ndCBuZWVkIHRvIHJlc29sdmUgdGhlIHN5bWJvbCBvZiB0aGUgZXhwcmVzc2lvbiBhcyB0aGUganVtcCBleHByZXNzaW9uIGlzXG4gICAgLy8gZGVmaW5lZCBpbmxpbmUgYW5kIHdlIGNhbiBqdXN0IGFkZCB0aGUgZ2l2ZW4gbm9kZSB0byB0aGUgcXVldWUuXG4gICAgaWYgKGlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24obm9kZSkgJiYgbm9kZS5ib2R5KSB7XG4gICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKG5vZGUuYm9keSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2FsbEV4cHJTeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShub2RlKTtcblxuICAgIGlmICghY2FsbEV4cHJTeW1ib2wgfHwgIWNhbGxFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHtcbiAgICAgIHRoaXMucGVla0ludG9KdW1wRXhwcmVzc2lvbihjYWxsRXhwcmVzc2lvbik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZXhwcmVzc2lvbkRlY2wgPSB0aGlzLl9yZXNvbHZlTm9kZUZyb21Db250ZXh0KGNhbGxFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pO1xuXG4gICAgLy8gTm90ZSB0aGF0IHdlIHNob3VsZCBub3QgYWRkIHByZXZpb3VzbHkgdmlzaXRlZCBzeW1ib2xzIHRvIHRoZSBxdWV1ZSBhc1xuICAgIC8vIHRoaXMgY291bGQgY2F1c2UgY3ljbGVzLlxuICAgIGlmICghaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihleHByZXNzaW9uRGVjbCkgfHxcbiAgICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5oYXMoZXhwcmVzc2lvbkRlY2wpIHx8ICFleHByZXNzaW9uRGVjbC5ib2R5KSB7XG4gICAgICB0aGlzLnBlZWtJbnRvSnVtcEV4cHJlc3Npb24oY2FsbEV4cHJlc3Npb24pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBqdW1wIGV4cHJlc3Npb24gYW5kIGl0cyBzcGVjaWZpZWQgYXJndW1lbnRzLlxuICAgIHRoaXMuX3VwZGF0ZUNvbnRleHQoY2FsbEV4cHJlc3Npb24uYXJndW1lbnRzLCBleHByZXNzaW9uRGVjbC5wYXJhbWV0ZXJzKTtcblxuICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuYWRkKGV4cHJlc3Npb25EZWNsKTtcbiAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKGV4cHJlc3Npb25EZWNsLmJvZHkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGROZXdFeHByZXNzaW9uVG9RdWV1ZShub2RlOiB0cy5OZXdFeHByZXNzaW9uKSB7XG4gICAgY29uc3QgbmV3RXhwclN5bWJvbCA9IHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKHVud3JhcEV4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgd2hpY2ggcmVzb2x2ZSB0byBjbGFzc2VzLiBUZWNobmljYWxseSBcIm5ld1wiIGNvdWxkXG4gICAgLy8gYWxzbyBjYWxsIHZvaWQgZnVuY3Rpb25zIG9yIG9iamVjdHMgd2l0aCBhIGNvbnN0cnVjdG9yIHNpZ25hdHVyZS4gQWxzbyBub3RlIHRoYXRcbiAgICAvLyB3ZSBzaG91bGQgbm90IHZpc2l0IGFscmVhZHkgdmlzaXRlZCBzeW1ib2xzIGFzIHRoaXMgY291bGQgY2F1c2UgY3ljbGVzLlxuICAgIGlmICghbmV3RXhwclN5bWJvbCB8fCAhbmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uIHx8XG4gICAgICAgICF0cy5pc0NsYXNzRGVjbGFyYXRpb24obmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSkge1xuICAgICAgdGhpcy5wZWVrSW50b0p1bXBFeHByZXNzaW9uKG5vZGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldENvbnN0cnVjdG9yID1cbiAgICAgICAgbmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uLm1lbWJlcnMuZmluZCh0cy5pc0NvbnN0cnVjdG9yRGVjbGFyYXRpb24pO1xuXG4gICAgaWYgKHRhcmdldENvbnN0cnVjdG9yICYmIHRhcmdldENvbnN0cnVjdG9yLmJvZHkgJiZcbiAgICAgICAgIXRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuaGFzKHRhcmdldENvbnN0cnVjdG9yKSkge1xuICAgICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IGZvciB0aGUgbmV3IGV4cHJlc3Npb24gYW5kIGl0cyBzcGVjaWZpZWQgY29uc3RydWN0b3JcbiAgICAgIC8vIHBhcmFtZXRlcnMgaWYgYXJndW1lbnRzIGFyZSBwYXNzZWQgdG8gdGhlIGNsYXNzIGNvbnN0cnVjdG9yLlxuICAgICAgaWYgKG5vZGUuYXJndW1lbnRzKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRleHQobm9kZS5hcmd1bWVudHMsIHRhcmdldENvbnN0cnVjdG9yLnBhcmFtZXRlcnMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmFkZCh0YXJnZXRDb25zdHJ1Y3Rvcik7XG4gICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKHRhcmdldENvbnN0cnVjdG9yLmJvZHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBlZWtJbnRvSnVtcEV4cHJlc3Npb24obm9kZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdFByb3BlcnR5QWNjZXNzb3JzKFxuICAgICAgbm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uLCBjaGVja1NldHRlcjogYm9vbGVhbiwgY2hlY2tHZXR0ZXI6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBwcm9wZXJ0eVN5bWJvbCA9IHRoaXMuX2dldFByb3BlcnR5QWNjZXNzU3ltYm9sKG5vZGUpO1xuXG4gICAgaWYgKCFwcm9wZXJ0eVN5bWJvbCB8fCAhcHJvcGVydHlTeW1ib2wuZGVjbGFyYXRpb25zLmxlbmd0aCB8fFxuICAgICAgICAocHJvcGVydHlTeW1ib2wuZ2V0RmxhZ3MoKSAmIHRzLlN5bWJvbEZsYWdzLkFjY2Vzc29yKSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHdlIGNoZWNrZWQgdGhlIHN5bWJvbCBmbGFncyBhbmQgdGhlIHN5bWJvbCBpcyBkZXNjcmliaW5nIGFuIGFjY2Vzc29yLCB0aGVcbiAgICAvLyBkZWNsYXJhdGlvbnMgYXJlIGd1YXJhbnRlZWQgdG8gb25seSBjb250YWluIHRoZSBnZXR0ZXJzIGFuZCBzZXR0ZXJzLlxuICAgIGNvbnN0IGFjY2Vzc29ycyA9IHByb3BlcnR5U3ltYm9sLmRlY2xhcmF0aW9ucyBhcyB0cy5BY2Nlc3NvckRlY2xhcmF0aW9uW107XG5cbiAgICBhY2Nlc3NvcnNcbiAgICAgICAgLmZpbHRlcihcbiAgICAgICAgICAgIGQgPT4gKGNoZWNrU2V0dGVyICYmIHRzLmlzU2V0QWNjZXNzb3IoZCkgfHwgY2hlY2tHZXR0ZXIgJiYgdHMuaXNHZXRBY2Nlc3NvcihkKSkgJiZcbiAgICAgICAgICAgICAgICBkLmJvZHkgJiYgIXRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuaGFzKGQpKVxuICAgICAgICAuZm9yRWFjaChkID0+IHtcbiAgICAgICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmFkZChkKTtcbiAgICAgICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKGQuYm9keSEpO1xuICAgICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRCaW5hcnlFeHByZXNzaW9uKG5vZGU6IHRzLkJpbmFyeUV4cHJlc3Npb24pOiBib29sZWFuIHtcbiAgICBjb25zdCBsZWZ0RXhwciA9IHVud3JhcEV4cHJlc3Npb24obm9kZS5sZWZ0KTtcblxuICAgIGlmICghdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obGVmdEV4cHIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKEJJTkFSWV9DT01QT1VORF9UT0tFTlMuaW5kZXhPZihub2RlLm9wZXJhdG9yVG9rZW4ua2luZCkgIT09IC0xKSB7XG4gICAgICAvLyBDb21wb3VuZCBhc3NpZ25tZW50cyBhbHdheXMgY2F1c2UgdGhlIGdldHRlciBhbmQgc2V0dGVyIHRvIGJlIGNhbGxlZC5cbiAgICAgIC8vIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIGNoZWNrIHRoZSBzZXR0ZXIgYW5kIGdldHRlciBvZiB0aGUgcHJvcGVydHkgYWNjZXNzLlxuICAgICAgdGhpcy52aXNpdFByb3BlcnR5QWNjZXNzb3JzKGxlZnRFeHByLCAvKiBzZXR0ZXIgKi8gdHJ1ZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgIH0gZWxzZSBpZiAobm9kZS5vcGVyYXRvclRva2VuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRXF1YWxzVG9rZW4pIHtcbiAgICAgIC8vIFZhbHVlIGFzc2lnbm1lbnRzIHVzaW5nIHRoZSBlcXVhbHMgdG9rZW4gb25seSBjYXVzZSB0aGUgXCJzZXR0ZXJcIiB0byBiZSBjYWxsZWQuXG4gICAgICAvLyBUaGVyZWZvcmUgd2UgbmVlZCB0byBhbmFseXplIHRoZSBzZXR0ZXIgZGVjbGFyYXRpb24gb2YgdGhlIHByb3BlcnR5IGFjY2Vzcy5cbiAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhsZWZ0RXhwciwgLyogc2V0dGVyICovIHRydWUsIC8qIGdldHRlciAqLyBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZSBiaW5hcnkgZXhwcmVzc2lvbiBpcyBub3QgYW4gYXNzaWdubWVudCwgaXQncyBhIHNpbXBsZSBwcm9wZXJ0eSByZWFkIGFuZFxuICAgICAgLy8gd2UgbmVlZCB0byBjaGVjayB0aGUgZ2V0dGVyIGRlY2xhcmF0aW9uIGlmIHByZXNlbnQuXG4gICAgICB0aGlzLnZpc2l0UHJvcGVydHlBY2Nlc3NvcnMobGVmdEV4cHIsIC8qIHNldHRlciAqLyBmYWxzZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGdldFJlc29sdmVkTm9kZVVzYWdlKHNlYXJjaE5vZGU6IHRzLk5vZGUpOiBSZXNvbHZlZFVzYWdlIHtcbiAgICB0aGlzLm5vZGVRdWV1ZSA9IFtzZWFyY2hOb2RlXTtcbiAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmNsZWFyKCk7XG4gICAgdGhpcy5jb250ZXh0LmNsZWFyKCk7XG5cbiAgICAvLyBDb3B5IGJhc2UgY29udGV4dCB2YWx1ZXMgaW50byB0aGUgY3VycmVudCBmdW5jdGlvbiBibG9jayBjb250ZXh0LiBUaGVcbiAgICAvLyBiYXNlIGNvbnRleHQgaXMgdXNlZnVsIGlmIG5vZGVzIG5lZWQgdG8gYmUgbWFwcGVkIHRvIG90aGVyIG5vZGVzLiBlLmcuXG4gICAgLy8gYWJzdHJhY3Qgc3VwZXIgY2xhc3MgbWV0aG9kcyBhcmUgbWFwcGVkIHRvIHRoZWlyIGltcGxlbWVudGF0aW9uIG5vZGUgb2ZcbiAgICAvLyB0aGUgZGVyaXZlZCBjbGFzcy5cbiAgICB0aGlzLmJhc2VDb250ZXh0LmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHRoaXMuY29udGV4dC5zZXQoa2V5LCB2YWx1ZSkpO1xuXG4gICAgcmV0dXJuIHRoaXMuaXNTeW5jaHJvbm91c2x5VXNlZEluTm9kZShzZWFyY2hOb2RlKTtcbiAgfVxuXG4gIHByaXZhdGUgaXNTeW5jaHJvbm91c2x5VXNlZEluTm9kZShzZWFyY2hOb2RlOiB0cy5Ob2RlKTogUmVzb2x2ZWRVc2FnZSB7XG4gICAgdGhpcy5hbWJpZ3VvdXNOb2RlUXVldWUgPSBbXTtcblxuICAgIHdoaWxlICh0aGlzLm5vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVRdWV1ZS5zaGlmdCgpITtcblxuICAgICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSAmJiB0aGlzLmlzUmVmZXJyaW5nVG9TeW1ib2wobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIFJlc29sdmVkVXNhZ2UuU1lOQ0hST05PVVM7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBjYWxsIGV4cHJlc3Npb25zIHdpdGhpbiBUeXBlU2NyaXB0IG5vZGVzIHRoYXQgY2F1c2UgYSBqdW1wIGluIGNvbnRyb2xcbiAgICAgIC8vIGZsb3cuIFdlIHJlc29sdmUgdGhlIGNhbGwgZXhwcmVzc2lvbiB2YWx1ZSBkZWNsYXJhdGlvbiBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5hZGRKdW1wRXhwcmVzc2lvblRvUXVldWUobm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgdGhhdCBjYXVzZSBhIGp1bXAgaW4gY29udHJvbCBmbG93LiBXZSByZXNvbHZlIHRoZVxuICAgICAgLy8gY29uc3RydWN0b3IgZGVjbGFyYXRpb24gb2YgdGhlIHRhcmdldCBjbGFzcyBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzTmV3RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLmFkZE5ld0V4cHJlc3Npb25Ub1F1ZXVlKG5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBhbHNvIG5lZWQgdG8gaGFuZGxlIGJpbmFyeSBleHByZXNzaW9ucyB3aGVyZSBhIHZhbHVlIGNhbiBiZSBlaXRoZXIgYXNzaWduZWQgdG9cbiAgICAgIC8vIHRoZSBwcm9wZXJ0eSwgb3IgYSB2YWx1ZSBpcyByZWFkIGZyb20gYSBwcm9wZXJ0eSBleHByZXNzaW9uLiBEZXBlbmRpbmcgb24gdGhlXG4gICAgICAvLyBiaW5hcnkgZXhwcmVzc2lvbiBvcGVyYXRvciwgc2V0dGVycyBvciBnZXR0ZXJzIG5lZWQgdG8gYmUgYW5hbHl6ZWQuXG4gICAgICBpZiAodHMuaXNCaW5hcnlFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIC8vIEluIGNhc2UgdGhlIGJpbmFyeSBleHByZXNzaW9uIGNvbnRhaW5lZCBhIHByb3BlcnR5IGV4cHJlc3Npb24gb24gdGhlIGxlZnQgc2lkZSwgd2VcbiAgICAgICAgLy8gZG9uJ3Qgd2FudCB0byBjb250aW51ZSB2aXNpdGluZyB0aGlzIHByb3BlcnR5IGV4cHJlc3Npb24gb24gaXRzIG93bi4gVGhpcyBpcyBuZWNlc3NhcnlcbiAgICAgICAgLy8gYmVjYXVzZSB2aXNpdGluZyB0aGUgZXhwcmVzc2lvbiBvbiBpdHMgb3duIGNhdXNlcyBhIGxvc3Mgb2YgY29udGV4dC4gZS5nLiBwcm9wZXJ0eVxuICAgICAgICAvLyBhY2Nlc3MgZXhwcmVzc2lvbnMgKmRvIG5vdCogYWx3YXlzIGNhdXNlIGEgdmFsdWUgcmVhZCAoZS5nLiBwcm9wZXJ0eSBhc3NpZ25tZW50cylcbiAgICAgICAgaWYgKHRoaXMudmlzaXRCaW5hcnlFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgICAgdGhpcy5ub2RlUXVldWUucHVzaChub2RlLnJpZ2h0KTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb25zLiBQcm9wZXJ0eSBleHByZXNzaW9ucyB3aGljaCBhcmUgcGFydCBvZiBiaW5hcnlcbiAgICAgIC8vIGV4cHJlc3Npb25zIHdvbid0IGJlIGFkZGVkIHRvIHRoZSBub2RlIHF1ZXVlLCBzbyB0aGVzZSBhY2Nlc3MgZXhwcmVzc2lvbnMgYXJlXG4gICAgICAvLyBndWFyYW50ZWVkIHRvIGJlIFwicmVhZFwiIGFjY2Vzc2VzIGFuZCB3ZSBuZWVkIHRvIGNoZWNrIHRoZSBcImdldHRlclwiIGRlY2xhcmF0aW9uLlxuICAgICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhub2RlLCAvKiBzZXR0ZXIgKi8gZmFsc2UsIC8qIGdldHRlciAqLyB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gRG8gbm90IHZpc2l0IG5vZGVzIHRoYXQgZGVjbGFyZSBhIGJsb2NrIG9mIHN0YXRlbWVudHMgYnV0IGFyZSBub3QgZXhlY3V0ZWRcbiAgICAgIC8vIHN5bmNocm9ub3VzbHkgKGUuZy4gZnVuY3Rpb24gZGVjbGFyYXRpb25zKS4gV2Ugb25seSB3YW50IHRvIGNoZWNrIFR5cGVTY3JpcHRcbiAgICAgIC8vIG5vZGVzIHdoaWNoIGFyZSBzeW5jaHJvbm91c2x5IGV4ZWN1dGVkIGluIHRoZSBjb250cm9sIGZsb3cuXG4gICAgICBpZiAoIWlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5ub2RlUXVldWUucHVzaCguLi5ub2RlLmdldENoaWxkcmVuKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmFtYmlndW91c05vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgbm9kZSBxdWV1ZSB0byBhbGwgc3RvcmVkIGFtYmlndW91cyBub2Rlcy4gVGhlc2Ugbm9kZXMgYXJlIG5vdFxuICAgICAgLy8gZ3VhcmFudGVlZCB0byBiZSBleGVjdXRlZCBhbmQgdGhlcmVmb3JlIGluIGNhc2Ugb2YgYSBzeW5jaHJvbm91cyB1c2FnZVxuICAgICAgLy8gd2l0aGluIG9uZSBvZiB0aG9zZSBub2RlcywgdGhlIHJlc29sdmVkIHVzYWdlIGlzIGFtYmlndW91cy5cbiAgICAgIHRoaXMubm9kZVF1ZXVlID0gdGhpcy5hbWJpZ3VvdXNOb2RlUXVldWU7XG4gICAgICBjb25zdCB1c2FnZSA9IHRoaXMuaXNTeW5jaHJvbm91c2x5VXNlZEluTm9kZShzZWFyY2hOb2RlKTtcbiAgICAgIHJldHVybiB1c2FnZSA9PT0gUmVzb2x2ZWRVc2FnZS5TWU5DSFJPTk9VUyA/IFJlc29sdmVkVXNhZ2UuQU1CSUdVT1VTIDogdXNhZ2U7XG4gICAgfVxuICAgIHJldHVybiBSZXNvbHZlZFVzYWdlLkFTWU5DSFJPTk9VUztcbiAgfVxuXG4gIC8qKlxuICAgKiBQZWVrcyBpbnRvIHRoZSBnaXZlbiBqdW1wIGV4cHJlc3Npb24gYnkgYWRkaW5nIGFsbCBmdW5jdGlvbiBsaWtlIGRlY2xhcmF0aW9uc1xuICAgKiB3aGljaCBhcmUgcmVmZXJlbmNlZCBpbiB0aGUganVtcCBleHByZXNzaW9uIGFyZ3VtZW50cyB0byB0aGUgYW1iaWd1b3VzIG5vZGVcbiAgICogcXVldWUuIFRoZXNlIGFyZ3VtZW50cyBjb3VsZCB0ZWNobmljYWxseSBhY2Nlc3MgdGhlIGdpdmVuIGRlY2xhcmF0aW9uIGJ1dCBpdCdzXG4gICAqIG5vdCBndWFyYW50ZWVkIHRoYXQgdGhlIGp1bXAgZXhwcmVzc2lvbiBpcyBleGVjdXRlZC4gSW4gdGhhdCBjYXNlIHRoZSByZXNvbHZlZFxuICAgKiB1c2FnZSBpcyBhbWJpZ3VvdXMuXG4gICAqL1xuICBwcml2YXRlIHBlZWtJbnRvSnVtcEV4cHJlc3Npb24oanVtcEV4cDogdHMuQ2FsbEV4cHJlc3Npb258dHMuTmV3RXhwcmVzc2lvbikge1xuICAgIGlmICghanVtcEV4cC5hcmd1bWVudHMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3Igc29tZSBjYWxsIGV4cHJlc3Npb25zIHdlIGRvbid0IHdhbnQgdG8gYWRkIHRoZSBhcmd1bWVudHMgdG8gdGhlXG4gICAgLy8gYW1iaWd1b3VzIG5vZGUgcXVldWUuIGUuZy4gXCJzZXRUaW1lb3V0XCIgaXMgbm90IGFuYWx5emFibGUgYnV0IGlzXG4gICAgLy8gZ3VhcmFudGVlZCB0byBleGVjdXRlIGl0cyBhcmd1bWVudCBhc3luY2hyb25vdXNseS4gV2UgaGFuZGxlIGEgc3Vic2V0XG4gICAgLy8gb2YgdGhlc2UgY2FsbCBleHByZXNzaW9ucyBieSBoYXZpbmcgYSBoYXJkY29kZWQgbGlzdCBvZiBzb21lLlxuICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKGp1bXBFeHApKSB7XG4gICAgICBjb25zdCBzeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShqdW1wRXhwLmV4cHJlc3Npb24pO1xuICAgICAgaWYgKHN5bWJvbCAmJiBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikge1xuICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ucGFyZW50O1xuICAgICAgICBpZiAocGFyZW50Tm9kZSAmJiAodHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihwYXJlbnROb2RlKSB8fCB0cy5pc1NvdXJjZUZpbGUocGFyZW50Tm9kZSkpICYmXG4gICAgICAgICAgICAodHMuaXNNZXRob2RTaWduYXR1cmUoc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHx8XG4gICAgICAgICAgICAgdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSkgJiZcbiAgICAgICAgICAgIHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uLm5hbWUpIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnROYW1lID0gdHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihwYXJlbnROb2RlKSA/IHBhcmVudE5vZGUubmFtZS50ZXh0IDogbnVsbDtcbiAgICAgICAgICBjb25zdCBjYWxsTmFtZSA9IGdldFByb3BlcnR5TmFtZVRleHQoc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ubmFtZSk7XG4gICAgICAgICAgaWYgKEFTWU5DX0VYVEVSTkFMX0NBTExTLnNvbWUoXG4gICAgICAgICAgICAgICAgICBjID0+XG4gICAgICAgICAgICAgICAgICAgICAgKGMubmFtZSA9PT0gY2FsbE5hbWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgKGMucGFyZW50LmluZGV4T2YocGFyZW50TmFtZSkgIT09IC0xIHx8IGMucGFyZW50LmluZGV4T2YoJyonKSAhPT0gLTEpKSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBqdW1wRXhwLmFyZ3VtZW50cyEuZm9yRWFjaCgobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgbm9kZSA9IHRoaXMuX3Jlc29sdmVEZWNsYXJhdGlvbk9mTm9kZShub2RlKTtcblxuICAgICAgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSAmJiBub2RlLmluaXRpYWxpemVyKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLmluaXRpYWxpemVyO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihub2RlKSAmJiAhIW5vZGUuYm9keSkge1xuICAgICAgICB0aGlzLmFtYmlndW91c05vZGVRdWV1ZS5wdXNoKG5vZGUuYm9keSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgYSBnaXZlbiBub2RlIGZyb20gdGhlIGNvbnRleHQuIEluIGNhc2UgdGhlIG5vZGUgaXMgbm90IG1hcHBlZCBpblxuICAgKiB0aGUgY29udGV4dCwgdGhlIG9yaWdpbmFsIG5vZGUgaXMgcmV0dXJuZWQuXG4gICAqL1xuICBwcml2YXRlIF9yZXNvbHZlTm9kZUZyb21Db250ZXh0KG5vZGU6IHRzLk5vZGUpOiB0cy5Ob2RlIHtcbiAgICBpZiAodGhpcy5jb250ZXh0Lmhhcyhub2RlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5nZXQobm9kZSkhO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb250ZXh0IHRvIHJlZmxlY3QgdGhlIG5ld2x5IHNldCBwYXJhbWV0ZXIgdmFsdWVzLiBUaGlzIGFsbG93cyBmdXR1cmVcbiAgICogcmVmZXJlbmNlcyB0byBmdW5jdGlvbiBwYXJhbWV0ZXJzIHRvIGJlIHJlc29sdmVkIHRvIHRoZSBhY3R1YWwgbm9kZSB0aHJvdWdoIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29udGV4dChcbiAgICAgIGNhbGxBcmdzOiB0cy5Ob2RlQXJyYXk8dHMuRXhwcmVzc2lvbj4sIHBhcmFtZXRlcnM6IHRzLk5vZGVBcnJheTx0cy5QYXJhbWV0ZXJEZWNsYXJhdGlvbj4pIHtcbiAgICBwYXJhbWV0ZXJzLmZvckVhY2goKHBhcmFtZXRlciwgaW5kZXgpID0+IHtcbiAgICAgIGxldCBhcmd1bWVudE5vZGU6IHRzLk5vZGUgPSBjYWxsQXJnc1tpbmRleF07XG5cbiAgICAgIGlmICghYXJndW1lbnROb2RlKSB7XG4gICAgICAgIGlmICghcGFyYW1ldGVyLmluaXRpYWxpemVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXJndW1lbnQgY2FuIGJlIHVuZGVmaW5lZCBpbiBjYXNlIHRoZSBmdW5jdGlvbiBwYXJhbWV0ZXIgaGFzIGEgZGVmYXVsdFxuICAgICAgICAvLyB2YWx1ZS4gSW4gdGhhdCBjYXNlIHdlIHdhbnQgdG8gc3RvcmUgdGhlIHBhcmFtZXRlciBkZWZhdWx0IHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICAgICAgICBhcmd1bWVudE5vZGUgPSBwYXJhbWV0ZXIuaW5pdGlhbGl6ZXI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIoYXJndW1lbnROb2RlKSkge1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0KHBhcmFtZXRlciwgdGhpcy5fcmVzb2x2ZURlY2xhcmF0aW9uT2ZOb2RlKGFyZ3VtZW50Tm9kZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LnNldChwYXJhbWV0ZXIsIGFyZ3VtZW50Tm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgdGhlIGRlY2xhcmF0aW9uIG9mIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlLiBGb3IgZXhhbXBsZSBhbiBpZGVudGlmaWVyIGNhblxuICAgKiByZWZlciB0byBhIGZ1bmN0aW9uIHBhcmFtZXRlci4gVGhpcyBwYXJhbWV0ZXIgY2FuIHRoZW4gYmUgcmVzb2x2ZWQgdGhyb3VnaCB0aGVcbiAgICogZnVuY3Rpb24gY29udGV4dC5cbiAgICovXG4gIHByaXZhdGUgX3Jlc29sdmVEZWNsYXJhdGlvbk9mTm9kZShub2RlOiB0cy5Ob2RlKTogdHMuTm9kZSB7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUobm9kZSk7XG5cbiAgICBpZiAoIXN5bWJvbCB8fCAhc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9yZXNvbHZlTm9kZUZyb21Db250ZXh0KHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWNsYXJhdGlvbiBzeW1ib2wgb2YgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUuIFJlc29sdmVzIGFsaWFzZWRcbiAgICogc3ltYm9scyB0byB0aGUgc3ltYm9sIGNvbnRhaW5pbmcgdGhlIHZhbHVlIGRlY2xhcmF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUobm9kZTogdHMuTm9kZSk6IHRzLlN5bWJvbHxudWxsIHtcbiAgICBsZXQgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuXG4gICAgaWYgKCFzeW1ib2wpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFJlc29sdmUgdGhlIHN5bWJvbCB0byBpdCdzIG9yaWdpbmFsIGRlY2xhcmF0aW9uIHN5bWJvbC5cbiAgICB3aGlsZSAoc3ltYm9sLmZsYWdzICYgdHMuU3ltYm9sRmxhZ3MuQWxpYXMpIHtcbiAgICAgIHN5bWJvbCA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0QWxpYXNlZFN5bWJvbChzeW1ib2wpO1xuICAgIH1cblxuICAgIHJldHVybiBzeW1ib2w7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc3ltYm9sIG9mIHRoZSBnaXZlbiBwcm9wZXJ0eSBhY2Nlc3MgZXhwcmVzc2lvbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0UHJvcGVydHlBY2Nlc3NTeW1ib2wobm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKTogdHMuU3ltYm9sfG51bGwge1xuICAgIGxldCBwcm9wZXJ0eVN5bWJvbCA9IHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKG5vZGUubmFtZSk7XG5cbiAgICBpZiAoIXByb3BlcnR5U3ltYm9sIHx8ICFwcm9wZXJ0eVN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY29udGV4dC5oYXMocHJvcGVydHlTeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgIHJldHVybiBwcm9wZXJ0eVN5bWJvbDtcbiAgICB9XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBjb250ZXh0IGhhcyB0aGUgdmFsdWUgZGVjbGFyYXRpb24gb2YgdGhlIGdpdmVuIHByb3BlcnR5IGFjY2Vzc1xuICAgIC8vIG5hbWUgaWRlbnRpZmllciwgd2UgbmVlZCB0byByZXBsYWNlIHRoZSBcInByb3BlcnR5U3ltYm9sXCIgd2l0aCB0aGUgc3ltYm9sXG4gICAgLy8gcmVmZXJyaW5nIHRvIHRoZSByZXNvbHZlZCBzeW1ib2wgYmFzZWQgb24gdGhlIGNvbnRleHQuIGUuZy4gYWJzdHJhY3QgcHJvcGVydGllc1xuICAgIC8vIGNhbiB1bHRpbWF0ZWx5IHJlc29sdmUgaW50byBhbiBhY2Nlc3NvciBkZWNsYXJhdGlvbiBiYXNlZCBvbiB0aGUgaW1wbGVtZW50YXRpb24uXG4gICAgY29uc3QgY29udGV4dE5vZGUgPSB0aGlzLl9yZXNvbHZlTm9kZUZyb21Db250ZXh0KHByb3BlcnR5U3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pO1xuXG4gICAgaWYgKCF0cy5pc0FjY2Vzc29yKGNvbnRleHROb2RlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUmVzb2x2ZSB0aGUgc3ltYm9sIHJlZmVycmluZyB0byB0aGUgXCJhY2Nlc3NvclwiIHVzaW5nIHRoZSBuYW1lIGlkZW50aWZpZXJcbiAgICAvLyBvZiB0aGUgYWNjZXNzb3IgZGVjbGFyYXRpb24uXG4gICAgcmV0dXJuIHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKGNvbnRleHROb2RlLm5hbWUpO1xuICB9XG59XG4iXX0=