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
            if ((propertySymbol === null || propertySymbol === void 0 ? void 0 : propertySymbol.declarations) === undefined || propertySymbol.declarations.length === 0 ||
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
            const leftExpr = (0, functions_1.unwrapExpression)(node.left);
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
            if (ts.isCallExpression(jumpExp)) {
                const symbol = this._getDeclarationSymbolOfNode(jumpExp.expression);
                if (symbol && symbol.valueDeclaration) {
                    const parentNode = symbol.valueDeclaration.parent;
                    if (parentNode && (ts.isInterfaceDeclaration(parentNode) || ts.isSourceFile(parentNode)) &&
                        (ts.isMethodSignature(symbol.valueDeclaration) ||
                            ts.isFunctionDeclaration(symbol.valueDeclaration)) &&
                        symbol.valueDeclaration.name) {
                        const parentName = ts.isInterfaceDeclaration(parentNode) ? parentNode.name.text : null;
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
                if (ts.isVariableDeclaration(node) && node.initializer) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFDakMsbUZBQW1HO0lBQ25HLDJGQUErRTtJQUkvRSxJQUFZLGFBSVg7SUFKRCxXQUFZLGFBQWE7UUFDdkIsK0RBQVcsQ0FBQTtRQUNYLGlFQUFZLENBQUE7UUFDWiwyREFBUyxDQUFBO0lBQ1gsQ0FBQyxFQUpXLGFBQWEsR0FBYixxQkFBYSxLQUFiLHFCQUFhLFFBSXhCO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTSxzQkFBc0IsR0FBRztRQUM3QixFQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtRQUM5QixFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtRQUNqQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQjtRQUNsQyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWM7UUFDNUIsRUFBRSxDQUFDLFVBQVUsQ0FBQywyQkFBMkI7UUFDekMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlO1FBQzdCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO1FBQzlCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO0tBQy9CLENBQUM7SUFFRjs7O09BR0c7SUFDSCxNQUFNLG9CQUFvQixHQUFHO1FBQzNCLEVBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztRQUNuQyxFQUFDLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7UUFDcEMs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Q0FBQzthQUN2QjtZQUVELDZFQUE2RTtZQUM3RSwyRUFBMkU7WUFDM0Usa0ZBQWtGO1lBQ2xGLG1GQUFtRjtZQUNuRixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFbEYsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCwyRUFBMkU7WUFDM0UsK0JBQStCO1lBQy9CLE9BQU8sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RCxDQUFDO0tBQ0Y7SUE3V0QsMERBNldDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uLCB1bndyYXBFeHByZXNzaW9ufSBmcm9tICcuLi8uLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L2Z1bmN0aW9ucyc7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5cbmV4cG9ydCB0eXBlIEZ1bmN0aW9uQ29udGV4dCA9IE1hcDx0cy5Ob2RlLCB0cy5Ob2RlPjtcblxuZXhwb3J0IGVudW0gUmVzb2x2ZWRVc2FnZSB7XG4gIFNZTkNIUk9OT1VTLFxuICBBU1lOQ0hST05PVVMsXG4gIEFNQklHVU9VUyxcbn1cblxuLyoqXG4gKiBMaXN0IG9mIFR5cGVTY3JpcHQgc3ludGF4IHRva2VucyB0aGF0IGNhbiBiZSB1c2VkIHdpdGhpbiBhIGJpbmFyeSBleHByZXNzaW9uIGFzXG4gKiBjb21wb3VuZCBhc3NpZ25tZW50LiBUaGVzZSBpbXBseSBhIHJlYWQgYW5kIHdyaXRlIG9mIHRoZSBsZWZ0LXNpZGUgZXhwcmVzc2lvbi5cbiAqL1xuY29uc3QgQklOQVJZX0NPTVBPVU5EX1RPS0VOUyA9IFtcbiAgdHMuU3ludGF4S2luZC5DYXJldEVxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLkFzdGVyaXNrRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuQW1wZXJzYW5kRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuQmFyRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuQXN0ZXJpc2tBc3Rlcmlza0VxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLlBsdXNFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5NaW51c0VxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLlNsYXNoRXF1YWxzVG9rZW4sXG5dO1xuXG4vKipcbiAqIExpc3Qgb2Yga25vd24gYXN5bmNocm9ub3VzIGV4dGVybmFsIGNhbGwgZXhwcmVzc2lvbnMgd2hpY2ggYXJlbid0IGFuYWx5emFibGVcbiAqIGJ1dCBhcmUgZ3VhcmFudGVlZCB0byBub3QgZXhlY3V0ZSB0aGUgcGFzc2VkIGFyZ3VtZW50IHN5bmNocm9ub3VzbHkuXG4gKi9cbmNvbnN0IEFTWU5DX0VYVEVSTkFMX0NBTExTID0gW1xuICB7cGFyZW50OiBbJ1Byb21pc2UnXSwgbmFtZTogJ3RoZW4nfSxcbiAge3BhcmVudDogWydQcm9taXNlJ10sIG5hbWU6ICdjYXRjaCd9LFxuICB7cGFyZW50OiBbbnVsbCwgJ1dpbmRvdyddLCBuYW1lOiAncmVxdWVzdEFuaW1hdGlvbkZyYW1lJ30sXG4gIHtwYXJlbnQ6IFtudWxsLCAnV2luZG93J10sIG5hbWU6ICdzZXRUaW1lb3V0J30sXG4gIHtwYXJlbnQ6IFtudWxsLCAnV2luZG93J10sIG5hbWU6ICdzZXRJbnRlcnZhbCd9LFxuICB7cGFyZW50OiBbJyonXSwgbmFtZTogJ2FkZEV2ZW50TGlzdGVuZXInfSxcbl07XG5cbi8qKlxuICogQ2xhc3MgdGhhdCBjYW4gYmUgdXNlZCB0byBkZXRlcm1pbmUgaWYgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUgaXMgdXNlZCB3aXRoaW5cbiAqIG90aGVyIGdpdmVuIFR5cGVTY3JpcHQgbm9kZXMuIFRoaXMgaXMgYWNoaWV2ZWQgYnkgd2Fsa2luZyB0aHJvdWdoIGFsbCBjaGlsZHJlblxuICogb2YgdGhlIGdpdmVuIG5vZGUgYW5kIGNoZWNraW5nIGZvciB1c2FnZXMgb2YgdGhlIGdpdmVuIGRlY2xhcmF0aW9uLiBUaGUgdmlzaXRvclxuICogYWxzbyBoYW5kbGVzIHBvdGVudGlhbCBjb250cm9sIGZsb3cgY2hhbmdlcyBjYXVzZWQgYnkgY2FsbC9uZXcgZXhwcmVzc2lvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvciB7XG4gIC8qKiBTZXQgb2YgdmlzaXRlZCBzeW1ib2xzIHRoYXQgY2F1c2VkIGEganVtcCBpbiBjb250cm9sIGZsb3cuICovXG4gIHByaXZhdGUgdmlzaXRlZEp1bXBFeHByTm9kZXMgPSBuZXcgU2V0PHRzLk5vZGU+KCk7XG5cbiAgLyoqXG4gICAqIFF1ZXVlIG9mIG5vZGVzIHRoYXQgbmVlZCB0byBiZSBjaGVja2VkIGZvciBkZWNsYXJhdGlvbiB1c2FnZSBhbmRcbiAgICogYXJlIGd1YXJhbnRlZWQgdG8gYmUgZXhlY3V0ZWQgc3luY2hyb25vdXNseS5cbiAgICovXG4gIHByaXZhdGUgbm9kZVF1ZXVlOiB0cy5Ob2RlW10gPSBbXTtcblxuICAvKipcbiAgICogTm9kZXMgd2hpY2ggbmVlZCB0byBiZSBjaGVja2VkIGZvciBkZWNsYXJhdGlvbiB1c2FnZSBidXQgYXJlbid0XG4gICAqIGd1YXJhbnRlZWQgdG8gZXhlY3V0ZSBzeW5jaHJvbm91c2x5LlxuICAgKi9cbiAgcHJpdmF0ZSBhbWJpZ3VvdXNOb2RlUXVldWU6IHRzLk5vZGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiBjb250ZXh0IHRoYXQgaG9sZHMgdGhlIFR5cGVTY3JpcHQgbm9kZSB2YWx1ZXMgZm9yIGFsbCBwYXJhbWV0ZXJzXG4gICAqIG9mIHRoZSBjdXJyZW50bHkgYW5hbHl6ZWQgZnVuY3Rpb24gYmxvY2suXG4gICAqL1xuICBwcml2YXRlIGNvbnRleHQ6IEZ1bmN0aW9uQ29udGV4dCA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgZGVjbGFyYXRpb246IHRzLk5vZGUsIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBiYXNlQ29udGV4dDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpKSB7fVxuXG4gIHByaXZhdGUgaXNSZWZlcnJpbmdUb1N5bWJvbChub2RlOiB0cy5Ob2RlKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuICAgIHJldHVybiAhIXN5bWJvbCAmJiBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbiA9PT0gdGhpcy5kZWNsYXJhdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgYWRkSnVtcEV4cHJlc3Npb25Ub1F1ZXVlKGNhbGxFeHByZXNzaW9uOiB0cy5DYWxsRXhwcmVzc2lvbikge1xuICAgIGNvbnN0IG5vZGUgPSB1bndyYXBFeHByZXNzaW9uKGNhbGxFeHByZXNzaW9uLmV4cHJlc3Npb24pO1xuXG4gICAgLy8gSW4gY2FzZSB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiBpcyBhbHJlYWR5IHJlZmVycmluZyB0byBhIGZ1bmN0aW9uLWxpa2UgZGVjbGFyYXRpb24sXG4gICAgLy8gd2UgZG9uJ3QgbmVlZCB0byByZXNvbHZlIHRoZSBzeW1ib2wgb2YgdGhlIGV4cHJlc3Npb24gYXMgdGhlIGp1bXAgZXhwcmVzc2lvbiBpc1xuICAgIC8vIGRlZmluZWQgaW5saW5lIGFuZCB3ZSBjYW4ganVzdCBhZGQgdGhlIGdpdmVuIG5vZGUgdG8gdGhlIHF1ZXVlLlxuICAgIGlmIChpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKG5vZGUpICYmIG5vZGUuYm9keSkge1xuICAgICAgdGhpcy5ub2RlUXVldWUucHVzaChub2RlLmJvZHkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbGxFeHByU3ltYm9sID0gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUobm9kZSk7XG5cbiAgICBpZiAoIWNhbGxFeHByU3ltYm9sIHx8ICFjYWxsRXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB7XG4gICAgICB0aGlzLnBlZWtJbnRvSnVtcEV4cHJlc3Npb24oY2FsbEV4cHJlc3Npb24pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cHJlc3Npb25EZWNsID0gdGhpcy5fcmVzb2x2ZU5vZGVGcm9tQ29udGV4dChjYWxsRXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKTtcblxuICAgIC8vIE5vdGUgdGhhdCB3ZSBzaG91bGQgbm90IGFkZCBwcmV2aW91c2x5IHZpc2l0ZWQgc3ltYm9scyB0byB0aGUgcXVldWUgYXNcbiAgICAvLyB0aGlzIGNvdWxkIGNhdXNlIGN5Y2xlcy5cbiAgICBpZiAoIWlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24oZXhwcmVzc2lvbkRlY2wpIHx8XG4gICAgICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuaGFzKGV4cHJlc3Npb25EZWNsKSB8fCAhZXhwcmVzc2lvbkRlY2wuYm9keSkge1xuICAgICAgdGhpcy5wZWVrSW50b0p1bXBFeHByZXNzaW9uKGNhbGxFeHByZXNzaW9uKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcganVtcCBleHByZXNzaW9uIGFuZCBpdHMgc3BlY2lmaWVkIGFyZ3VtZW50cy5cbiAgICB0aGlzLl91cGRhdGVDb250ZXh0KGNhbGxFeHByZXNzaW9uLmFyZ3VtZW50cywgZXhwcmVzc2lvbkRlY2wucGFyYW1ldGVycyk7XG5cbiAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmFkZChleHByZXNzaW9uRGVjbCk7XG4gICAgdGhpcy5ub2RlUXVldWUucHVzaChleHByZXNzaW9uRGVjbC5ib2R5KTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkTmV3RXhwcmVzc2lvblRvUXVldWUobm9kZTogdHMuTmV3RXhwcmVzc2lvbikge1xuICAgIGNvbnN0IG5ld0V4cHJTeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZSh1bndyYXBFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbikpO1xuXG4gICAgLy8gT25seSBoYW5kbGUgbmV3IGV4cHJlc3Npb25zIHdoaWNoIHJlc29sdmUgdG8gY2xhc3Nlcy4gVGVjaG5pY2FsbHkgXCJuZXdcIiBjb3VsZFxuICAgIC8vIGFsc28gY2FsbCB2b2lkIGZ1bmN0aW9ucyBvciBvYmplY3RzIHdpdGggYSBjb25zdHJ1Y3RvciBzaWduYXR1cmUuIEFsc28gbm90ZSB0aGF0XG4gICAgLy8gd2Ugc2hvdWxkIG5vdCB2aXNpdCBhbHJlYWR5IHZpc2l0ZWQgc3ltYm9scyBhcyB0aGlzIGNvdWxkIGNhdXNlIGN5Y2xlcy5cbiAgICBpZiAoIW5ld0V4cHJTeW1ib2wgfHwgIW5ld0V4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbiB8fFxuICAgICAgICAhdHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5ld0V4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgIHRoaXMucGVla0ludG9KdW1wRXhwcmVzc2lvbihub2RlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXRDb25zdHJ1Y3RvciA9XG4gICAgICAgIG5ld0V4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbi5tZW1iZXJzLmZpbmQodHMuaXNDb25zdHJ1Y3RvckRlY2xhcmF0aW9uKTtcblxuICAgIGlmICh0YXJnZXRDb25zdHJ1Y3RvciAmJiB0YXJnZXRDb25zdHJ1Y3Rvci5ib2R5ICYmXG4gICAgICAgICF0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmhhcyh0YXJnZXRDb25zdHJ1Y3RvcikpIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBleHByZXNzaW9uIGFuZCBpdHMgc3BlY2lmaWVkIGNvbnN0cnVjdG9yXG4gICAgICAvLyBwYXJhbWV0ZXJzIGlmIGFyZ3VtZW50cyBhcmUgcGFzc2VkIHRvIHRoZSBjbGFzcyBjb25zdHJ1Y3Rvci5cbiAgICAgIGlmIChub2RlLmFyZ3VtZW50cykge1xuICAgICAgICB0aGlzLl91cGRhdGVDb250ZXh0KG5vZGUuYXJndW1lbnRzLCB0YXJnZXRDb25zdHJ1Y3Rvci5wYXJhbWV0ZXJzKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5hZGQodGFyZ2V0Q29uc3RydWN0b3IpO1xuICAgICAgdGhpcy5ub2RlUXVldWUucHVzaCh0YXJnZXRDb25zdHJ1Y3Rvci5ib2R5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wZWVrSW50b0p1bXBFeHByZXNzaW9uKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhcbiAgICAgIG5vZGU6IHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbiwgY2hlY2tTZXR0ZXI6IGJvb2xlYW4sIGNoZWNrR2V0dGVyOiBib29sZWFuKSB7XG4gICAgY29uc3QgcHJvcGVydHlTeW1ib2wgPSB0aGlzLl9nZXRQcm9wZXJ0eUFjY2Vzc1N5bWJvbChub2RlKTtcblxuICAgIGlmIChwcm9wZXJ0eVN5bWJvbD8uZGVjbGFyYXRpb25zID09PSB1bmRlZmluZWQgfHwgcHJvcGVydHlTeW1ib2wuZGVjbGFyYXRpb25zLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgICAocHJvcGVydHlTeW1ib2wuZ2V0RmxhZ3MoKSAmIHRzLlN5bWJvbEZsYWdzLkFjY2Vzc29yKSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHdlIGNoZWNrZWQgdGhlIHN5bWJvbCBmbGFncyBhbmQgdGhlIHN5bWJvbCBpcyBkZXNjcmliaW5nIGFuIGFjY2Vzc29yLCB0aGVcbiAgICAvLyBkZWNsYXJhdGlvbnMgYXJlIGd1YXJhbnRlZWQgdG8gb25seSBjb250YWluIHRoZSBnZXR0ZXJzIGFuZCBzZXR0ZXJzLlxuICAgIGNvbnN0IGFjY2Vzc29ycyA9IHByb3BlcnR5U3ltYm9sLmRlY2xhcmF0aW9ucyBhcyB0cy5BY2Nlc3NvckRlY2xhcmF0aW9uW107XG5cbiAgICBhY2Nlc3NvcnNcbiAgICAgICAgLmZpbHRlcihcbiAgICAgICAgICAgIGQgPT4gKGNoZWNrU2V0dGVyICYmIHRzLmlzU2V0QWNjZXNzb3IoZCkgfHwgY2hlY2tHZXR0ZXIgJiYgdHMuaXNHZXRBY2Nlc3NvcihkKSkgJiZcbiAgICAgICAgICAgICAgICBkLmJvZHkgJiYgIXRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuaGFzKGQpKVxuICAgICAgICAuZm9yRWFjaChkID0+IHtcbiAgICAgICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmFkZChkKTtcbiAgICAgICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKGQuYm9keSEpO1xuICAgICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRCaW5hcnlFeHByZXNzaW9uKG5vZGU6IHRzLkJpbmFyeUV4cHJlc3Npb24pOiBib29sZWFuIHtcbiAgICBjb25zdCBsZWZ0RXhwciA9IHVud3JhcEV4cHJlc3Npb24obm9kZS5sZWZ0KTtcblxuICAgIGlmICghdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obGVmdEV4cHIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKEJJTkFSWV9DT01QT1VORF9UT0tFTlMuaW5kZXhPZihub2RlLm9wZXJhdG9yVG9rZW4ua2luZCkgIT09IC0xKSB7XG4gICAgICAvLyBDb21wb3VuZCBhc3NpZ25tZW50cyBhbHdheXMgY2F1c2UgdGhlIGdldHRlciBhbmQgc2V0dGVyIHRvIGJlIGNhbGxlZC5cbiAgICAgIC8vIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIGNoZWNrIHRoZSBzZXR0ZXIgYW5kIGdldHRlciBvZiB0aGUgcHJvcGVydHkgYWNjZXNzLlxuICAgICAgdGhpcy52aXNpdFByb3BlcnR5QWNjZXNzb3JzKGxlZnRFeHByLCAvKiBzZXR0ZXIgKi8gdHJ1ZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgIH0gZWxzZSBpZiAobm9kZS5vcGVyYXRvclRva2VuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRXF1YWxzVG9rZW4pIHtcbiAgICAgIC8vIFZhbHVlIGFzc2lnbm1lbnRzIHVzaW5nIHRoZSBlcXVhbHMgdG9rZW4gb25seSBjYXVzZSB0aGUgXCJzZXR0ZXJcIiB0byBiZSBjYWxsZWQuXG4gICAgICAvLyBUaGVyZWZvcmUgd2UgbmVlZCB0byBhbmFseXplIHRoZSBzZXR0ZXIgZGVjbGFyYXRpb24gb2YgdGhlIHByb3BlcnR5IGFjY2Vzcy5cbiAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhsZWZ0RXhwciwgLyogc2V0dGVyICovIHRydWUsIC8qIGdldHRlciAqLyBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZSBiaW5hcnkgZXhwcmVzc2lvbiBpcyBub3QgYW4gYXNzaWdubWVudCwgaXQncyBhIHNpbXBsZSBwcm9wZXJ0eSByZWFkIGFuZFxuICAgICAgLy8gd2UgbmVlZCB0byBjaGVjayB0aGUgZ2V0dGVyIGRlY2xhcmF0aW9uIGlmIHByZXNlbnQuXG4gICAgICB0aGlzLnZpc2l0UHJvcGVydHlBY2Nlc3NvcnMobGVmdEV4cHIsIC8qIHNldHRlciAqLyBmYWxzZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGdldFJlc29sdmVkTm9kZVVzYWdlKHNlYXJjaE5vZGU6IHRzLk5vZGUpOiBSZXNvbHZlZFVzYWdlIHtcbiAgICB0aGlzLm5vZGVRdWV1ZSA9IFtzZWFyY2hOb2RlXTtcbiAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmNsZWFyKCk7XG4gICAgdGhpcy5jb250ZXh0LmNsZWFyKCk7XG5cbiAgICAvLyBDb3B5IGJhc2UgY29udGV4dCB2YWx1ZXMgaW50byB0aGUgY3VycmVudCBmdW5jdGlvbiBibG9jayBjb250ZXh0LiBUaGVcbiAgICAvLyBiYXNlIGNvbnRleHQgaXMgdXNlZnVsIGlmIG5vZGVzIG5lZWQgdG8gYmUgbWFwcGVkIHRvIG90aGVyIG5vZGVzLiBlLmcuXG4gICAgLy8gYWJzdHJhY3Qgc3VwZXIgY2xhc3MgbWV0aG9kcyBhcmUgbWFwcGVkIHRvIHRoZWlyIGltcGxlbWVudGF0aW9uIG5vZGUgb2ZcbiAgICAvLyB0aGUgZGVyaXZlZCBjbGFzcy5cbiAgICB0aGlzLmJhc2VDb250ZXh0LmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHRoaXMuY29udGV4dC5zZXQoa2V5LCB2YWx1ZSkpO1xuXG4gICAgcmV0dXJuIHRoaXMuaXNTeW5jaHJvbm91c2x5VXNlZEluTm9kZShzZWFyY2hOb2RlKTtcbiAgfVxuXG4gIHByaXZhdGUgaXNTeW5jaHJvbm91c2x5VXNlZEluTm9kZShzZWFyY2hOb2RlOiB0cy5Ob2RlKTogUmVzb2x2ZWRVc2FnZSB7XG4gICAgdGhpcy5hbWJpZ3VvdXNOb2RlUXVldWUgPSBbXTtcblxuICAgIHdoaWxlICh0aGlzLm5vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVRdWV1ZS5zaGlmdCgpITtcblxuICAgICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSAmJiB0aGlzLmlzUmVmZXJyaW5nVG9TeW1ib2wobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIFJlc29sdmVkVXNhZ2UuU1lOQ0hST05PVVM7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBjYWxsIGV4cHJlc3Npb25zIHdpdGhpbiBUeXBlU2NyaXB0IG5vZGVzIHRoYXQgY2F1c2UgYSBqdW1wIGluIGNvbnRyb2xcbiAgICAgIC8vIGZsb3cuIFdlIHJlc29sdmUgdGhlIGNhbGwgZXhwcmVzc2lvbiB2YWx1ZSBkZWNsYXJhdGlvbiBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5hZGRKdW1wRXhwcmVzc2lvblRvUXVldWUobm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgdGhhdCBjYXVzZSBhIGp1bXAgaW4gY29udHJvbCBmbG93LiBXZSByZXNvbHZlIHRoZVxuICAgICAgLy8gY29uc3RydWN0b3IgZGVjbGFyYXRpb24gb2YgdGhlIHRhcmdldCBjbGFzcyBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzTmV3RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLmFkZE5ld0V4cHJlc3Npb25Ub1F1ZXVlKG5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBhbHNvIG5lZWQgdG8gaGFuZGxlIGJpbmFyeSBleHByZXNzaW9ucyB3aGVyZSBhIHZhbHVlIGNhbiBiZSBlaXRoZXIgYXNzaWduZWQgdG9cbiAgICAgIC8vIHRoZSBwcm9wZXJ0eSwgb3IgYSB2YWx1ZSBpcyByZWFkIGZyb20gYSBwcm9wZXJ0eSBleHByZXNzaW9uLiBEZXBlbmRpbmcgb24gdGhlXG4gICAgICAvLyBiaW5hcnkgZXhwcmVzc2lvbiBvcGVyYXRvciwgc2V0dGVycyBvciBnZXR0ZXJzIG5lZWQgdG8gYmUgYW5hbHl6ZWQuXG4gICAgICBpZiAodHMuaXNCaW5hcnlFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIC8vIEluIGNhc2UgdGhlIGJpbmFyeSBleHByZXNzaW9uIGNvbnRhaW5lZCBhIHByb3BlcnR5IGV4cHJlc3Npb24gb24gdGhlIGxlZnQgc2lkZSwgd2VcbiAgICAgICAgLy8gZG9uJ3Qgd2FudCB0byBjb250aW51ZSB2aXNpdGluZyB0aGlzIHByb3BlcnR5IGV4cHJlc3Npb24gb24gaXRzIG93bi4gVGhpcyBpcyBuZWNlc3NhcnlcbiAgICAgICAgLy8gYmVjYXVzZSB2aXNpdGluZyB0aGUgZXhwcmVzc2lvbiBvbiBpdHMgb3duIGNhdXNlcyBhIGxvc3Mgb2YgY29udGV4dC4gZS5nLiBwcm9wZXJ0eVxuICAgICAgICAvLyBhY2Nlc3MgZXhwcmVzc2lvbnMgKmRvIG5vdCogYWx3YXlzIGNhdXNlIGEgdmFsdWUgcmVhZCAoZS5nLiBwcm9wZXJ0eSBhc3NpZ25tZW50cylcbiAgICAgICAgaWYgKHRoaXMudmlzaXRCaW5hcnlFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgICAgdGhpcy5ub2RlUXVldWUucHVzaChub2RlLnJpZ2h0KTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb25zLiBQcm9wZXJ0eSBleHByZXNzaW9ucyB3aGljaCBhcmUgcGFydCBvZiBiaW5hcnlcbiAgICAgIC8vIGV4cHJlc3Npb25zIHdvbid0IGJlIGFkZGVkIHRvIHRoZSBub2RlIHF1ZXVlLCBzbyB0aGVzZSBhY2Nlc3MgZXhwcmVzc2lvbnMgYXJlXG4gICAgICAvLyBndWFyYW50ZWVkIHRvIGJlIFwicmVhZFwiIGFjY2Vzc2VzIGFuZCB3ZSBuZWVkIHRvIGNoZWNrIHRoZSBcImdldHRlclwiIGRlY2xhcmF0aW9uLlxuICAgICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhub2RlLCAvKiBzZXR0ZXIgKi8gZmFsc2UsIC8qIGdldHRlciAqLyB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gRG8gbm90IHZpc2l0IG5vZGVzIHRoYXQgZGVjbGFyZSBhIGJsb2NrIG9mIHN0YXRlbWVudHMgYnV0IGFyZSBub3QgZXhlY3V0ZWRcbiAgICAgIC8vIHN5bmNocm9ub3VzbHkgKGUuZy4gZnVuY3Rpb24gZGVjbGFyYXRpb25zKS4gV2Ugb25seSB3YW50IHRvIGNoZWNrIFR5cGVTY3JpcHRcbiAgICAgIC8vIG5vZGVzIHdoaWNoIGFyZSBzeW5jaHJvbm91c2x5IGV4ZWN1dGVkIGluIHRoZSBjb250cm9sIGZsb3cuXG4gICAgICBpZiAoIWlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5ub2RlUXVldWUucHVzaCguLi5ub2RlLmdldENoaWxkcmVuKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmFtYmlndW91c05vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgbm9kZSBxdWV1ZSB0byBhbGwgc3RvcmVkIGFtYmlndW91cyBub2Rlcy4gVGhlc2Ugbm9kZXMgYXJlIG5vdFxuICAgICAgLy8gZ3VhcmFudGVlZCB0byBiZSBleGVjdXRlZCBhbmQgdGhlcmVmb3JlIGluIGNhc2Ugb2YgYSBzeW5jaHJvbm91cyB1c2FnZVxuICAgICAgLy8gd2l0aGluIG9uZSBvZiB0aG9zZSBub2RlcywgdGhlIHJlc29sdmVkIHVzYWdlIGlzIGFtYmlndW91cy5cbiAgICAgIHRoaXMubm9kZVF1ZXVlID0gdGhpcy5hbWJpZ3VvdXNOb2RlUXVldWU7XG4gICAgICBjb25zdCB1c2FnZSA9IHRoaXMuaXNTeW5jaHJvbm91c2x5VXNlZEluTm9kZShzZWFyY2hOb2RlKTtcbiAgICAgIHJldHVybiB1c2FnZSA9PT0gUmVzb2x2ZWRVc2FnZS5TWU5DSFJPTk9VUyA/IFJlc29sdmVkVXNhZ2UuQU1CSUdVT1VTIDogdXNhZ2U7XG4gICAgfVxuICAgIHJldHVybiBSZXNvbHZlZFVzYWdlLkFTWU5DSFJPTk9VUztcbiAgfVxuXG4gIC8qKlxuICAgKiBQZWVrcyBpbnRvIHRoZSBnaXZlbiBqdW1wIGV4cHJlc3Npb24gYnkgYWRkaW5nIGFsbCBmdW5jdGlvbiBsaWtlIGRlY2xhcmF0aW9uc1xuICAgKiB3aGljaCBhcmUgcmVmZXJlbmNlZCBpbiB0aGUganVtcCBleHByZXNzaW9uIGFyZ3VtZW50cyB0byB0aGUgYW1iaWd1b3VzIG5vZGVcbiAgICogcXVldWUuIFRoZXNlIGFyZ3VtZW50cyBjb3VsZCB0ZWNobmljYWxseSBhY2Nlc3MgdGhlIGdpdmVuIGRlY2xhcmF0aW9uIGJ1dCBpdCdzXG4gICAqIG5vdCBndWFyYW50ZWVkIHRoYXQgdGhlIGp1bXAgZXhwcmVzc2lvbiBpcyBleGVjdXRlZC4gSW4gdGhhdCBjYXNlIHRoZSByZXNvbHZlZFxuICAgKiB1c2FnZSBpcyBhbWJpZ3VvdXMuXG4gICAqL1xuICBwcml2YXRlIHBlZWtJbnRvSnVtcEV4cHJlc3Npb24oanVtcEV4cDogdHMuQ2FsbEV4cHJlc3Npb258dHMuTmV3RXhwcmVzc2lvbikge1xuICAgIGlmICghanVtcEV4cC5hcmd1bWVudHMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3Igc29tZSBjYWxsIGV4cHJlc3Npb25zIHdlIGRvbid0IHdhbnQgdG8gYWRkIHRoZSBhcmd1bWVudHMgdG8gdGhlXG4gICAgLy8gYW1iaWd1b3VzIG5vZGUgcXVldWUuIGUuZy4gXCJzZXRUaW1lb3V0XCIgaXMgbm90IGFuYWx5emFibGUgYnV0IGlzXG4gICAgLy8gZ3VhcmFudGVlZCB0byBleGVjdXRlIGl0cyBhcmd1bWVudCBhc3luY2hyb25vdXNseS4gV2UgaGFuZGxlIGEgc3Vic2V0XG4gICAgLy8gb2YgdGhlc2UgY2FsbCBleHByZXNzaW9ucyBieSBoYXZpbmcgYSBoYXJkY29kZWQgbGlzdCBvZiBzb21lLlxuICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKGp1bXBFeHApKSB7XG4gICAgICBjb25zdCBzeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShqdW1wRXhwLmV4cHJlc3Npb24pO1xuICAgICAgaWYgKHN5bWJvbCAmJiBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikge1xuICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ucGFyZW50O1xuICAgICAgICBpZiAocGFyZW50Tm9kZSAmJiAodHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihwYXJlbnROb2RlKSB8fCB0cy5pc1NvdXJjZUZpbGUocGFyZW50Tm9kZSkpICYmXG4gICAgICAgICAgICAodHMuaXNNZXRob2RTaWduYXR1cmUoc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHx8XG4gICAgICAgICAgICAgdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSkgJiZcbiAgICAgICAgICAgIHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uLm5hbWUpIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnROYW1lID0gdHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihwYXJlbnROb2RlKSA/IHBhcmVudE5vZGUubmFtZS50ZXh0IDogbnVsbDtcbiAgICAgICAgICBjb25zdCBjYWxsTmFtZSA9IGdldFByb3BlcnR5TmFtZVRleHQoc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ubmFtZSk7XG4gICAgICAgICAgaWYgKEFTWU5DX0VYVEVSTkFMX0NBTExTLnNvbWUoXG4gICAgICAgICAgICAgICAgICBjID0+XG4gICAgICAgICAgICAgICAgICAgICAgKGMubmFtZSA9PT0gY2FsbE5hbWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgKGMucGFyZW50LmluZGV4T2YocGFyZW50TmFtZSkgIT09IC0xIHx8IGMucGFyZW50LmluZGV4T2YoJyonKSAhPT0gLTEpKSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBqdW1wRXhwLmFyZ3VtZW50cyEuZm9yRWFjaCgobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgbm9kZSA9IHRoaXMuX3Jlc29sdmVEZWNsYXJhdGlvbk9mTm9kZShub2RlKTtcblxuICAgICAgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSAmJiBub2RlLmluaXRpYWxpemVyKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLmluaXRpYWxpemVyO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihub2RlKSAmJiAhIW5vZGUuYm9keSkge1xuICAgICAgICB0aGlzLmFtYmlndW91c05vZGVRdWV1ZS5wdXNoKG5vZGUuYm9keSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgYSBnaXZlbiBub2RlIGZyb20gdGhlIGNvbnRleHQuIEluIGNhc2UgdGhlIG5vZGUgaXMgbm90IG1hcHBlZCBpblxuICAgKiB0aGUgY29udGV4dCwgdGhlIG9yaWdpbmFsIG5vZGUgaXMgcmV0dXJuZWQuXG4gICAqL1xuICBwcml2YXRlIF9yZXNvbHZlTm9kZUZyb21Db250ZXh0KG5vZGU6IHRzLk5vZGUpOiB0cy5Ob2RlIHtcbiAgICBpZiAodGhpcy5jb250ZXh0Lmhhcyhub2RlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5nZXQobm9kZSkhO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb250ZXh0IHRvIHJlZmxlY3QgdGhlIG5ld2x5IHNldCBwYXJhbWV0ZXIgdmFsdWVzLiBUaGlzIGFsbG93cyBmdXR1cmVcbiAgICogcmVmZXJlbmNlcyB0byBmdW5jdGlvbiBwYXJhbWV0ZXJzIHRvIGJlIHJlc29sdmVkIHRvIHRoZSBhY3R1YWwgbm9kZSB0aHJvdWdoIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29udGV4dChcbiAgICAgIGNhbGxBcmdzOiB0cy5Ob2RlQXJyYXk8dHMuRXhwcmVzc2lvbj4sIHBhcmFtZXRlcnM6IHRzLk5vZGVBcnJheTx0cy5QYXJhbWV0ZXJEZWNsYXJhdGlvbj4pIHtcbiAgICBwYXJhbWV0ZXJzLmZvckVhY2goKHBhcmFtZXRlciwgaW5kZXgpID0+IHtcbiAgICAgIGxldCBhcmd1bWVudE5vZGU6IHRzLk5vZGUgPSBjYWxsQXJnc1tpbmRleF07XG5cbiAgICAgIGlmICghYXJndW1lbnROb2RlKSB7XG4gICAgICAgIGlmICghcGFyYW1ldGVyLmluaXRpYWxpemVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXJndW1lbnQgY2FuIGJlIHVuZGVmaW5lZCBpbiBjYXNlIHRoZSBmdW5jdGlvbiBwYXJhbWV0ZXIgaGFzIGEgZGVmYXVsdFxuICAgICAgICAvLyB2YWx1ZS4gSW4gdGhhdCBjYXNlIHdlIHdhbnQgdG8gc3RvcmUgdGhlIHBhcmFtZXRlciBkZWZhdWx0IHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICAgICAgICBhcmd1bWVudE5vZGUgPSBwYXJhbWV0ZXIuaW5pdGlhbGl6ZXI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIoYXJndW1lbnROb2RlKSkge1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0KHBhcmFtZXRlciwgdGhpcy5fcmVzb2x2ZURlY2xhcmF0aW9uT2ZOb2RlKGFyZ3VtZW50Tm9kZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LnNldChwYXJhbWV0ZXIsIGFyZ3VtZW50Tm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgdGhlIGRlY2xhcmF0aW9uIG9mIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlLiBGb3IgZXhhbXBsZSBhbiBpZGVudGlmaWVyIGNhblxuICAgKiByZWZlciB0byBhIGZ1bmN0aW9uIHBhcmFtZXRlci4gVGhpcyBwYXJhbWV0ZXIgY2FuIHRoZW4gYmUgcmVzb2x2ZWQgdGhyb3VnaCB0aGVcbiAgICogZnVuY3Rpb24gY29udGV4dC5cbiAgICovXG4gIHByaXZhdGUgX3Jlc29sdmVEZWNsYXJhdGlvbk9mTm9kZShub2RlOiB0cy5Ob2RlKTogdHMuTm9kZSB7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUobm9kZSk7XG5cbiAgICBpZiAoIXN5bWJvbCB8fCAhc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9yZXNvbHZlTm9kZUZyb21Db250ZXh0KHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWNsYXJhdGlvbiBzeW1ib2wgb2YgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUuIFJlc29sdmVzIGFsaWFzZWRcbiAgICogc3ltYm9scyB0byB0aGUgc3ltYm9sIGNvbnRhaW5pbmcgdGhlIHZhbHVlIGRlY2xhcmF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUobm9kZTogdHMuTm9kZSk6IHRzLlN5bWJvbHxudWxsIHtcbiAgICBsZXQgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuXG4gICAgaWYgKCFzeW1ib2wpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFJlc29sdmUgdGhlIHN5bWJvbCB0byBpdCdzIG9yaWdpbmFsIGRlY2xhcmF0aW9uIHN5bWJvbC5cbiAgICB3aGlsZSAoc3ltYm9sLmZsYWdzICYgdHMuU3ltYm9sRmxhZ3MuQWxpYXMpIHtcbiAgICAgIHN5bWJvbCA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0QWxpYXNlZFN5bWJvbChzeW1ib2wpO1xuICAgIH1cblxuICAgIHJldHVybiBzeW1ib2w7XG4gIH1cblxuICAvKiogR2V0cyB0aGUgc3ltYm9sIG9mIHRoZSBnaXZlbiBwcm9wZXJ0eSBhY2Nlc3MgZXhwcmVzc2lvbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0UHJvcGVydHlBY2Nlc3NTeW1ib2wobm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKTogdHMuU3ltYm9sfG51bGwge1xuICAgIGxldCBwcm9wZXJ0eVN5bWJvbCA9IHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKG5vZGUubmFtZSk7XG5cbiAgICBpZiAoIXByb3BlcnR5U3ltYm9sIHx8ICFwcm9wZXJ0eVN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY29udGV4dC5oYXMocHJvcGVydHlTeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgIHJldHVybiBwcm9wZXJ0eVN5bWJvbDtcbiAgICB9XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBjb250ZXh0IGhhcyB0aGUgdmFsdWUgZGVjbGFyYXRpb24gb2YgdGhlIGdpdmVuIHByb3BlcnR5IGFjY2Vzc1xuICAgIC8vIG5hbWUgaWRlbnRpZmllciwgd2UgbmVlZCB0byByZXBsYWNlIHRoZSBcInByb3BlcnR5U3ltYm9sXCIgd2l0aCB0aGUgc3ltYm9sXG4gICAgLy8gcmVmZXJyaW5nIHRvIHRoZSByZXNvbHZlZCBzeW1ib2wgYmFzZWQgb24gdGhlIGNvbnRleHQuIGUuZy4gYWJzdHJhY3QgcHJvcGVydGllc1xuICAgIC8vIGNhbiB1bHRpbWF0ZWx5IHJlc29sdmUgaW50byBhbiBhY2Nlc3NvciBkZWNsYXJhdGlvbiBiYXNlZCBvbiB0aGUgaW1wbGVtZW50YXRpb24uXG4gICAgY29uc3QgY29udGV4dE5vZGUgPSB0aGlzLl9yZXNvbHZlTm9kZUZyb21Db250ZXh0KHByb3BlcnR5U3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pO1xuXG4gICAgaWYgKCF0cy5pc0FjY2Vzc29yKGNvbnRleHROb2RlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUmVzb2x2ZSB0aGUgc3ltYm9sIHJlZmVycmluZyB0byB0aGUgXCJhY2Nlc3NvclwiIHVzaW5nIHRoZSBuYW1lIGlkZW50aWZpZXJcbiAgICAvLyBvZiB0aGUgYWNjZXNzb3IgZGVjbGFyYXRpb24uXG4gICAgcmV0dXJuIHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKGNvbnRleHROb2RlLm5hbWUpO1xuICB9XG59XG4iXX0=