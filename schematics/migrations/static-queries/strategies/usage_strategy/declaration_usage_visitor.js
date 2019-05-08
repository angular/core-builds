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
        define("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/declaration_usage_visitor", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/functions"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const functions_1 = require("@angular/core/schematics/utils/typescript/functions");
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
            /** Queue of nodes that need to be checked for declaration usage. */
            this.nodeQueue = [];
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
                return;
            }
            const expressionDecl = this._resolveNodeFromContext(callExprSymbol.valueDeclaration);
            // Note that we should not add previously visited symbols to the queue as
            // this could cause cycles.
            if (!functions_1.isFunctionLikeDeclaration(expressionDecl) ||
                this.visitedJumpExprNodes.has(expressionDecl) || !expressionDecl.body) {
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
        isSynchronouslyUsedInNode(searchNode) {
            this.nodeQueue = [searchNode];
            this.visitedJumpExprNodes.clear();
            this.context.clear();
            // Copy base context values into the current function block context. The
            // base context is useful if nodes need to be mapped to other nodes. e.g.
            // abstract super class methods are mapped to their implementation node of
            // the derived class.
            this.baseContext.forEach((value, key) => this.context.set(key, value));
            while (this.nodeQueue.length) {
                const node = this.nodeQueue.shift();
                if (ts.isIdentifier(node) && this.isReferringToSymbol(node)) {
                    return true;
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
            return false;
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
                    this.context.set(parameter, this._resolveIdentifier(argumentNode));
                }
                else {
                    this.context.set(parameter, argumentNode);
                }
            });
        }
        /**
         * Resolves a TypeScript identifier node. For example an identifier can refer to a
         * function parameter which can be resolved through the function context.
         */
        _resolveIdentifier(node) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyxtRkFBbUc7SUFJbkc7OztPQUdHO0lBQ0gsTUFBTSxzQkFBc0IsR0FBRztRQUM3QixFQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtRQUM5QixFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtRQUNqQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQjtRQUNsQyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWM7UUFDNUIsRUFBRSxDQUFDLFVBQVUsQ0FBQywyQkFBMkI7UUFDekMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlO1FBQzdCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO1FBQzlCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO0tBQy9CLENBQUM7SUFFRjs7Ozs7T0FLRztJQUNILE1BQWEsdUJBQXVCO1FBYWxDLFlBQ1ksV0FBb0IsRUFBVSxXQUEyQixFQUN6RCxjQUErQixJQUFJLEdBQUcsRUFBRTtZQUR4QyxnQkFBVyxHQUFYLFdBQVcsQ0FBUztZQUFVLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUN6RCxnQkFBVyxHQUFYLFdBQVcsQ0FBNkI7WUFkcEQsaUVBQWlFO1lBQ3pELHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUFXLENBQUM7WUFFbEQsb0VBQW9FO1lBQzVELGNBQVMsR0FBYyxFQUFFLENBQUM7WUFFbEM7OztlQUdHO1lBQ0ssWUFBTyxHQUFvQixJQUFJLEdBQUcsRUFBRSxD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LENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFbEYsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCwyRUFBMkU7WUFDM0UsK0JBQStCO1lBQy9CLE9BQU8sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RCxDQUFDO0tBQ0Y7SUE5UkQsMERBOFJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7aXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbiwgdW53cmFwRXhwcmVzc2lvbn0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9mdW5jdGlvbnMnO1xuXG5leHBvcnQgdHlwZSBGdW5jdGlvbkNvbnRleHQgPSBNYXA8dHMuTm9kZSwgdHMuTm9kZT47XG5cbi8qKlxuICogTGlzdCBvZiBUeXBlU2NyaXB0IHN5bnRheCB0b2tlbnMgdGhhdCBjYW4gYmUgdXNlZCB3aXRoaW4gYSBiaW5hcnkgZXhwcmVzc2lvbiBhc1xuICogY29tcG91bmQgYXNzaWdubWVudC4gVGhlc2UgaW1wbHkgYSByZWFkIGFuZCB3cml0ZSBvZiB0aGUgbGVmdC1zaWRlIGV4cHJlc3Npb24uXG4gKi9cbmNvbnN0IEJJTkFSWV9DT01QT1VORF9UT0tFTlMgPSBbXG4gIHRzLlN5bnRheEtpbmQuQ2FyZXRFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5Bc3Rlcmlza0VxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLkFtcGVyc2FuZEVxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLkJhckVxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLkFzdGVyaXNrQXN0ZXJpc2tFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5QbHVzRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuTWludXNFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5TbGFzaEVxdWFsc1Rva2VuLFxuXTtcblxuLyoqXG4gKiBDbGFzcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGRldGVybWluZSBpZiBhIGdpdmVuIFR5cGVTY3JpcHQgbm9kZSBpcyB1c2VkIHdpdGhpblxuICogb3RoZXIgZ2l2ZW4gVHlwZVNjcmlwdCBub2Rlcy4gVGhpcyBpcyBhY2hpZXZlZCBieSB3YWxraW5nIHRocm91Z2ggYWxsIGNoaWxkcmVuXG4gKiBvZiB0aGUgZ2l2ZW4gbm9kZSBhbmQgY2hlY2tpbmcgZm9yIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gZGVjbGFyYXRpb24uIFRoZSB2aXNpdG9yXG4gKiBhbHNvIGhhbmRsZXMgcG90ZW50aWFsIGNvbnRyb2wgZmxvdyBjaGFuZ2VzIGNhdXNlZCBieSBjYWxsL25ldyBleHByZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIERlY2xhcmF0aW9uVXNhZ2VWaXNpdG9yIHtcbiAgLyoqIFNldCBvZiB2aXNpdGVkIHN5bWJvbHMgdGhhdCBjYXVzZWQgYSBqdW1wIGluIGNvbnRyb2wgZmxvdy4gKi9cbiAgcHJpdmF0ZSB2aXNpdGVkSnVtcEV4cHJOb2RlcyA9IG5ldyBTZXQ8dHMuTm9kZT4oKTtcblxuICAvKiogUXVldWUgb2Ygbm9kZXMgdGhhdCBuZWVkIHRvIGJlIGNoZWNrZWQgZm9yIGRlY2xhcmF0aW9uIHVzYWdlLiAqL1xuICBwcml2YXRlIG5vZGVRdWV1ZTogdHMuTm9kZVtdID0gW107XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIGNvbnRleHQgdGhhdCBob2xkcyB0aGUgVHlwZVNjcmlwdCBub2RlIHZhbHVlcyBmb3IgYWxsIHBhcmFtZXRlcnNcbiAgICogb2YgdGhlIGN1cnJlbnRseSBhbmFseXplZCBmdW5jdGlvbiBibG9jay5cbiAgICovXG4gIHByaXZhdGUgY29udGV4dDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBkZWNsYXJhdGlvbjogdHMuTm9kZSwgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIGJhc2VDb250ZXh0OiBGdW5jdGlvbkNvbnRleHQgPSBuZXcgTWFwKCkpIHt9XG5cbiAgcHJpdmF0ZSBpc1JlZmVycmluZ1RvU3ltYm9sKG5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG4gICAgcmV0dXJuICEhc3ltYm9sICYmIHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uID09PSB0aGlzLmRlY2xhcmF0aW9uO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRKdW1wRXhwcmVzc2lvblRvUXVldWUoY2FsbEV4cHJlc3Npb246IHRzLkNhbGxFeHByZXNzaW9uKSB7XG4gICAgY29uc3Qgbm9kZSA9IHVud3JhcEV4cHJlc3Npb24oY2FsbEV4cHJlc3Npb24uZXhwcmVzc2lvbik7XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBnaXZlbiBleHByZXNzaW9uIGlzIGFscmVhZHkgcmVmZXJyaW5nIHRvIGEgZnVuY3Rpb24tbGlrZSBkZWNsYXJhdGlvbixcbiAgICAvLyB3ZSBkb24ndCBuZWVkIHRvIHJlc29sdmUgdGhlIHN5bWJvbCBvZiB0aGUgZXhwcmVzc2lvbiBhcyB0aGUganVtcCBleHByZXNzaW9uIGlzXG4gICAgLy8gZGVmaW5lZCBpbmxpbmUgYW5kIHdlIGNhbiBqdXN0IGFkZCB0aGUgZ2l2ZW4gbm9kZSB0byB0aGUgcXVldWUuXG4gICAgaWYgKGlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24obm9kZSkgJiYgbm9kZS5ib2R5KSB7XG4gICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKG5vZGUuYm9keSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2FsbEV4cHJTeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShub2RlKTtcblxuICAgIGlmICghY2FsbEV4cHJTeW1ib2wgfHwgIWNhbGxFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBleHByZXNzaW9uRGVjbCA9IHRoaXMuX3Jlc29sdmVOb2RlRnJvbUNvbnRleHQoY2FsbEV4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbik7XG5cbiAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkIG5vdCBhZGQgcHJldmlvdXNseSB2aXNpdGVkIHN5bWJvbHMgdG8gdGhlIHF1ZXVlIGFzXG4gICAgLy8gdGhpcyBjb3VsZCBjYXVzZSBjeWNsZXMuXG4gICAgaWYgKCFpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKGV4cHJlc3Npb25EZWNsKSB8fFxuICAgICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmhhcyhleHByZXNzaW9uRGVjbCkgfHwgIWV4cHJlc3Npb25EZWNsLmJvZHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcganVtcCBleHByZXNzaW9uIGFuZCBpdHMgc3BlY2lmaWVkIGFyZ3VtZW50cy5cbiAgICB0aGlzLl91cGRhdGVDb250ZXh0KGNhbGxFeHByZXNzaW9uLmFyZ3VtZW50cywgZXhwcmVzc2lvbkRlY2wucGFyYW1ldGVycyk7XG5cbiAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmFkZChleHByZXNzaW9uRGVjbCk7XG4gICAgdGhpcy5ub2RlUXVldWUucHVzaChleHByZXNzaW9uRGVjbC5ib2R5KTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkTmV3RXhwcmVzc2lvblRvUXVldWUobm9kZTogdHMuTmV3RXhwcmVzc2lvbikge1xuICAgIGNvbnN0IG5ld0V4cHJTeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZSh1bndyYXBFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbikpO1xuXG4gICAgLy8gT25seSBoYW5kbGUgbmV3IGV4cHJlc3Npb25zIHdoaWNoIHJlc29sdmUgdG8gY2xhc3Nlcy4gVGVjaG5pY2FsbHkgXCJuZXdcIiBjb3VsZFxuICAgIC8vIGFsc28gY2FsbCB2b2lkIGZ1bmN0aW9ucyBvciBvYmplY3RzIHdpdGggYSBjb25zdHJ1Y3RvciBzaWduYXR1cmUuIEFsc28gbm90ZSB0aGF0XG4gICAgLy8gd2Ugc2hvdWxkIG5vdCB2aXNpdCBhbHJlYWR5IHZpc2l0ZWQgc3ltYm9scyBhcyB0aGlzIGNvdWxkIGNhdXNlIGN5Y2xlcy5cbiAgICBpZiAoIW5ld0V4cHJTeW1ib2wgfHwgIW5ld0V4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbiB8fFxuICAgICAgICAhdHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5ld0V4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXRDb25zdHJ1Y3RvciA9XG4gICAgICAgIG5ld0V4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbi5tZW1iZXJzLmZpbmQodHMuaXNDb25zdHJ1Y3RvckRlY2xhcmF0aW9uKTtcblxuICAgIGlmICh0YXJnZXRDb25zdHJ1Y3RvciAmJiB0YXJnZXRDb25zdHJ1Y3Rvci5ib2R5ICYmXG4gICAgICAgICF0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmhhcyh0YXJnZXRDb25zdHJ1Y3RvcikpIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBleHByZXNzaW9uIGFuZCBpdHMgc3BlY2lmaWVkIGNvbnN0cnVjdG9yXG4gICAgICAvLyBwYXJhbWV0ZXJzIGlmIGFyZ3VtZW50cyBhcmUgcGFzc2VkIHRvIHRoZSBjbGFzcyBjb25zdHJ1Y3Rvci5cbiAgICAgIGlmIChub2RlLmFyZ3VtZW50cykge1xuICAgICAgICB0aGlzLl91cGRhdGVDb250ZXh0KG5vZGUuYXJndW1lbnRzLCB0YXJnZXRDb25zdHJ1Y3Rvci5wYXJhbWV0ZXJzKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5hZGQodGFyZ2V0Q29uc3RydWN0b3IpO1xuICAgICAgdGhpcy5ub2RlUXVldWUucHVzaCh0YXJnZXRDb25zdHJ1Y3Rvci5ib2R5KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZpc2l0UHJvcGVydHlBY2Nlc3NvcnMoXG4gICAgICBub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24sIGNoZWNrU2V0dGVyOiBib29sZWFuLCBjaGVja0dldHRlcjogYm9vbGVhbikge1xuICAgIGNvbnN0IHByb3BlcnR5U3ltYm9sID0gdGhpcy5fZ2V0UHJvcGVydHlBY2Nlc3NTeW1ib2wobm9kZSk7XG5cbiAgICBpZiAoIXByb3BlcnR5U3ltYm9sIHx8ICFwcm9wZXJ0eVN5bWJvbC5kZWNsYXJhdGlvbnMubGVuZ3RoIHx8XG4gICAgICAgIChwcm9wZXJ0eVN5bWJvbC5nZXRGbGFncygpICYgdHMuU3ltYm9sRmxhZ3MuQWNjZXNzb3IpID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU2luY2Ugd2UgY2hlY2tlZCB0aGUgc3ltYm9sIGZsYWdzIGFuZCB0aGUgc3ltYm9sIGlzIGRlc2NyaWJpbmcgYW4gYWNjZXNzb3IsIHRoZVxuICAgIC8vIGRlY2xhcmF0aW9ucyBhcmUgZ3VhcmFudGVlZCB0byBvbmx5IGNvbnRhaW4gdGhlIGdldHRlcnMgYW5kIHNldHRlcnMuXG4gICAgY29uc3QgYWNjZXNzb3JzID0gcHJvcGVydHlTeW1ib2wuZGVjbGFyYXRpb25zIGFzIHRzLkFjY2Vzc29yRGVjbGFyYXRpb25bXTtcblxuICAgIGFjY2Vzc29yc1xuICAgICAgICAuZmlsdGVyKFxuICAgICAgICAgICAgZCA9PiAoY2hlY2tTZXR0ZXIgJiYgdHMuaXNTZXRBY2Nlc3NvcihkKSB8fCBjaGVja0dldHRlciAmJiB0cy5pc0dldEFjY2Vzc29yKGQpKSAmJlxuICAgICAgICAgICAgICAgIGQuYm9keSAmJiAhdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5oYXMoZCkpXG4gICAgICAgIC5mb3JFYWNoKGQgPT4ge1xuICAgICAgICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuYWRkKGQpO1xuICAgICAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2goZC5ib2R5ICEpO1xuICAgICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRCaW5hcnlFeHByZXNzaW9uKG5vZGU6IHRzLkJpbmFyeUV4cHJlc3Npb24pOiBib29sZWFuIHtcbiAgICBjb25zdCBsZWZ0RXhwciA9IHVud3JhcEV4cHJlc3Npb24obm9kZS5sZWZ0KTtcblxuICAgIGlmICghdHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obGVmdEV4cHIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKEJJTkFSWV9DT01QT1VORF9UT0tFTlMuaW5kZXhPZihub2RlLm9wZXJhdG9yVG9rZW4ua2luZCkgIT09IC0xKSB7XG4gICAgICAvLyBDb21wb3VuZCBhc3NpZ25tZW50cyBhbHdheXMgY2F1c2UgdGhlIGdldHRlciBhbmQgc2V0dGVyIHRvIGJlIGNhbGxlZC5cbiAgICAgIC8vIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIGNoZWNrIHRoZSBzZXR0ZXIgYW5kIGdldHRlciBvZiB0aGUgcHJvcGVydHkgYWNjZXNzLlxuICAgICAgdGhpcy52aXNpdFByb3BlcnR5QWNjZXNzb3JzKGxlZnRFeHByLCAvKiBzZXR0ZXIgKi8gdHJ1ZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgIH0gZWxzZSBpZiAobm9kZS5vcGVyYXRvclRva2VuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRXF1YWxzVG9rZW4pIHtcbiAgICAgIC8vIFZhbHVlIGFzc2lnbm1lbnRzIHVzaW5nIHRoZSBlcXVhbHMgdG9rZW4gb25seSBjYXVzZSB0aGUgXCJzZXR0ZXJcIiB0byBiZSBjYWxsZWQuXG4gICAgICAvLyBUaGVyZWZvcmUgd2UgbmVlZCB0byBhbmFseXplIHRoZSBzZXR0ZXIgZGVjbGFyYXRpb24gb2YgdGhlIHByb3BlcnR5IGFjY2Vzcy5cbiAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhsZWZ0RXhwciwgLyogc2V0dGVyICovIHRydWUsIC8qIGdldHRlciAqLyBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZSBiaW5hcnkgZXhwcmVzc2lvbiBpcyBub3QgYW4gYXNzaWdubWVudCwgaXQncyBhIHNpbXBsZSBwcm9wZXJ0eSByZWFkIGFuZFxuICAgICAgLy8gd2UgbmVlZCB0byBjaGVjayB0aGUgZ2V0dGVyIGRlY2xhcmF0aW9uIGlmIHByZXNlbnQuXG4gICAgICB0aGlzLnZpc2l0UHJvcGVydHlBY2Nlc3NvcnMobGVmdEV4cHIsIC8qIHNldHRlciAqLyBmYWxzZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUoc2VhcmNoTm9kZTogdHMuTm9kZSk6IGJvb2xlYW4ge1xuICAgIHRoaXMubm9kZVF1ZXVlID0gW3NlYXJjaE5vZGVdO1xuICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuY2xlYXIoKTtcbiAgICB0aGlzLmNvbnRleHQuY2xlYXIoKTtcblxuICAgIC8vIENvcHkgYmFzZSBjb250ZXh0IHZhbHVlcyBpbnRvIHRoZSBjdXJyZW50IGZ1bmN0aW9uIGJsb2NrIGNvbnRleHQuIFRoZVxuICAgIC8vIGJhc2UgY29udGV4dCBpcyB1c2VmdWwgaWYgbm9kZXMgbmVlZCB0byBiZSBtYXBwZWQgdG8gb3RoZXIgbm9kZXMuIGUuZy5cbiAgICAvLyBhYnN0cmFjdCBzdXBlciBjbGFzcyBtZXRob2RzIGFyZSBtYXBwZWQgdG8gdGhlaXIgaW1wbGVtZW50YXRpb24gbm9kZSBvZlxuICAgIC8vIHRoZSBkZXJpdmVkIGNsYXNzLlxuICAgIHRoaXMuYmFzZUNvbnRleHQuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4gdGhpcy5jb250ZXh0LnNldChrZXksIHZhbHVlKSk7XG5cbiAgICB3aGlsZSAodGhpcy5ub2RlUXVldWUubGVuZ3RoKSB7XG4gICAgICBjb25zdCBub2RlID0gdGhpcy5ub2RlUXVldWUuc2hpZnQoKSAhO1xuXG4gICAgICBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUpICYmIHRoaXMuaXNSZWZlcnJpbmdUb1N5bWJvbChub2RlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIGNhbGwgZXhwcmVzc2lvbnMgd2l0aGluIFR5cGVTY3JpcHQgbm9kZXMgdGhhdCBjYXVzZSBhIGp1bXAgaW4gY29udHJvbFxuICAgICAgLy8gZmxvdy4gV2UgcmVzb2x2ZSB0aGUgY2FsbCBleHByZXNzaW9uIHZhbHVlIGRlY2xhcmF0aW9uIGFuZCBhZGQgaXQgdG8gdGhlIG5vZGUgcXVldWUuXG4gICAgICBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLmFkZEp1bXBFeHByZXNzaW9uVG9RdWV1ZShub2RlKTtcbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIG5ldyBleHByZXNzaW9ucyB0aGF0IGNhdXNlIGEganVtcCBpbiBjb250cm9sIGZsb3cuIFdlIHJlc29sdmUgdGhlXG4gICAgICAvLyBjb25zdHJ1Y3RvciBkZWNsYXJhdGlvbiBvZiB0aGUgdGFyZ2V0IGNsYXNzIGFuZCBhZGQgaXQgdG8gdGhlIG5vZGUgcXVldWUuXG4gICAgICBpZiAodHMuaXNOZXdFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMuYWRkTmV3RXhwcmVzc2lvblRvUXVldWUobm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGFsc28gbmVlZCB0byBoYW5kbGUgYmluYXJ5IGV4cHJlc3Npb25zIHdoZXJlIGEgdmFsdWUgY2FuIGJlIGVpdGhlciBhc3NpZ25lZCB0b1xuICAgICAgLy8gdGhlIHByb3BlcnR5LCBvciBhIHZhbHVlIGlzIHJlYWQgZnJvbSBhIHByb3BlcnR5IGV4cHJlc3Npb24uIERlcGVuZGluZyBvbiB0aGVcbiAgICAgIC8vIGJpbmFyeSBleHByZXNzaW9uIG9wZXJhdG9yLCBzZXR0ZXJzIG9yIGdldHRlcnMgbmVlZCB0byBiZSBhbmFseXplZC5cbiAgICAgIGlmICh0cy5pc0JpbmFyeUV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgLy8gSW4gY2FzZSB0aGUgYmluYXJ5IGV4cHJlc3Npb24gY29udGFpbmVkIGEgcHJvcGVydHkgZXhwcmVzc2lvbiBvbiB0aGUgbGVmdCBzaWRlLCB3ZVxuICAgICAgICAvLyBkb24ndCB3YW50IHRvIGNvbnRpbnVlIHZpc2l0aW5nIHRoaXMgcHJvcGVydHkgZXhwcmVzc2lvbiBvbiBpdHMgb3duLiBUaGlzIGlzIG5lY2Vzc2FyeVxuICAgICAgICAvLyBiZWNhdXNlIHZpc2l0aW5nIHRoZSBleHByZXNzaW9uIG9uIGl0cyBvd24gY2F1c2VzIGEgbG9zcyBvZiBjb250ZXh0LiBlLmcuIHByb3BlcnR5XG4gICAgICAgIC8vIGFjY2VzcyBleHByZXNzaW9ucyAqZG8gbm90KiBhbHdheXMgY2F1c2UgYSB2YWx1ZSByZWFkIChlLmcuIHByb3BlcnR5IGFzc2lnbm1lbnRzKVxuICAgICAgICBpZiAodGhpcy52aXNpdEJpbmFyeUV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKG5vZGUucmlnaHQpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBwcm9wZXJ0eSBhY2Nlc3MgZXhwcmVzc2lvbnMuIFByb3BlcnR5IGV4cHJlc3Npb25zIHdoaWNoIGFyZSBwYXJ0IG9mIGJpbmFyeVxuICAgICAgLy8gZXhwcmVzc2lvbnMgd29uJ3QgYmUgYWRkZWQgdG8gdGhlIG5vZGUgcXVldWUsIHNvIHRoZXNlIGFjY2VzcyBleHByZXNzaW9ucyBhcmVcbiAgICAgIC8vIGd1YXJhbnRlZWQgdG8gYmUgXCJyZWFkXCIgYWNjZXNzZXMgYW5kIHdlIG5lZWQgdG8gY2hlY2sgdGhlIFwiZ2V0dGVyXCIgZGVjbGFyYXRpb24uXG4gICAgICBpZiAodHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy52aXNpdFByb3BlcnR5QWNjZXNzb3JzKG5vZGUsIC8qIHNldHRlciAqLyBmYWxzZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBEbyBub3QgdmlzaXQgbm9kZXMgdGhhdCBkZWNsYXJlIGEgYmxvY2sgb2Ygc3RhdGVtZW50cyBidXQgYXJlIG5vdCBleGVjdXRlZFxuICAgICAgLy8gc3luY2hyb25vdXNseSAoZS5nLiBmdW5jdGlvbiBkZWNsYXJhdGlvbnMpLiBXZSBvbmx5IHdhbnQgdG8gY2hlY2sgVHlwZVNjcmlwdFxuICAgICAgLy8gbm9kZXMgd2hpY2ggYXJlIHN5bmNocm9ub3VzbHkgZXhlY3V0ZWQgaW4gdGhlIGNvbnRyb2wgZmxvdy5cbiAgICAgIGlmICghaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKC4uLm5vZGUuZ2V0Q2hpbGRyZW4oKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhIGdpdmVuIG5vZGUgZnJvbSB0aGUgY29udGV4dC4gSW4gY2FzZSB0aGUgbm9kZSBpcyBub3QgbWFwcGVkIGluXG4gICAqIHRoZSBjb250ZXh0LCB0aGUgb3JpZ2luYWwgbm9kZSBpcyByZXR1cm5lZC5cbiAgICovXG4gIHByaXZhdGUgX3Jlc29sdmVOb2RlRnJvbUNvbnRleHQobm9kZTogdHMuTm9kZSk6IHRzLk5vZGUge1xuICAgIGlmICh0aGlzLmNvbnRleHQuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0LmdldChub2RlKSAhO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb250ZXh0IHRvIHJlZmxlY3QgdGhlIG5ld2x5IHNldCBwYXJhbWV0ZXIgdmFsdWVzLiBUaGlzIGFsbG93cyBmdXR1cmVcbiAgICogcmVmZXJlbmNlcyB0byBmdW5jdGlvbiBwYXJhbWV0ZXJzIHRvIGJlIHJlc29sdmVkIHRvIHRoZSBhY3R1YWwgbm9kZSB0aHJvdWdoIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ29udGV4dChcbiAgICAgIGNhbGxBcmdzOiB0cy5Ob2RlQXJyYXk8dHMuRXhwcmVzc2lvbj4sIHBhcmFtZXRlcnM6IHRzLk5vZGVBcnJheTx0cy5QYXJhbWV0ZXJEZWNsYXJhdGlvbj4pIHtcbiAgICBwYXJhbWV0ZXJzLmZvckVhY2goKHBhcmFtZXRlciwgaW5kZXgpID0+IHtcbiAgICAgIGxldCBhcmd1bWVudE5vZGU6IHRzLk5vZGUgPSBjYWxsQXJnc1tpbmRleF07XG5cbiAgICAgIGlmICghYXJndW1lbnROb2RlKSB7XG4gICAgICAgIGlmICghcGFyYW1ldGVyLmluaXRpYWxpemVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXJndW1lbnQgY2FuIGJlIHVuZGVmaW5lZCBpbiBjYXNlIHRoZSBmdW5jdGlvbiBwYXJhbWV0ZXIgaGFzIGEgZGVmYXVsdFxuICAgICAgICAvLyB2YWx1ZS4gSW4gdGhhdCBjYXNlIHdlIHdhbnQgdG8gc3RvcmUgdGhlIHBhcmFtZXRlciBkZWZhdWx0IHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICAgICAgICBhcmd1bWVudE5vZGUgPSBwYXJhbWV0ZXIuaW5pdGlhbGl6ZXI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIoYXJndW1lbnROb2RlKSkge1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0KHBhcmFtZXRlciwgdGhpcy5fcmVzb2x2ZUlkZW50aWZpZXIoYXJndW1lbnROb2RlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0KHBhcmFtZXRlciwgYXJndW1lbnROb2RlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhIFR5cGVTY3JpcHQgaWRlbnRpZmllciBub2RlLiBGb3IgZXhhbXBsZSBhbiBpZGVudGlmaWVyIGNhbiByZWZlciB0byBhXG4gICAqIGZ1bmN0aW9uIHBhcmFtZXRlciB3aGljaCBjYW4gYmUgcmVzb2x2ZWQgdGhyb3VnaCB0aGUgZnVuY3Rpb24gY29udGV4dC5cbiAgICovXG4gIHByaXZhdGUgX3Jlc29sdmVJZGVudGlmaWVyKG5vZGU6IHRzLklkZW50aWZpZXIpOiB0cy5Ob2RlIHtcbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShub2RlKTtcblxuICAgIGlmICghc3ltYm9sIHx8ICFzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3Jlc29sdmVOb2RlRnJvbUNvbnRleHQoc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlY2xhcmF0aW9uIHN5bWJvbCBvZiBhIGdpdmVuIFR5cGVTY3JpcHQgbm9kZS4gUmVzb2x2ZXMgYWxpYXNlZFxuICAgKiBzeW1ib2xzIHRvIHRoZSBzeW1ib2wgY29udGFpbmluZyB0aGUgdmFsdWUgZGVjbGFyYXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShub2RlOiB0cy5Ob2RlKTogdHMuU3ltYm9sfG51bGwge1xuICAgIGxldCBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG5cbiAgICBpZiAoIXN5bWJvbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUmVzb2x2ZSB0aGUgc3ltYm9sIHRvIGl0J3Mgb3JpZ2luYWwgZGVjbGFyYXRpb24gc3ltYm9sLlxuICAgIHdoaWxlIChzeW1ib2wuZmxhZ3MgJiB0cy5TeW1ib2xGbGFncy5BbGlhcykge1xuICAgICAgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRBbGlhc2VkU3ltYm9sKHN5bWJvbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN5bWJvbDtcbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBzeW1ib2wgb2YgdGhlIGdpdmVuIHByb3BlcnR5IGFjY2VzcyBleHByZXNzaW9uLiAqL1xuICBwcml2YXRlIF9nZXRQcm9wZXJ0eUFjY2Vzc1N5bWJvbChub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24pOiB0cy5TeW1ib2x8bnVsbCB7XG4gICAgbGV0IHByb3BlcnR5U3ltYm9sID0gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUobm9kZS5uYW1lKTtcblxuICAgIGlmICghcHJvcGVydHlTeW1ib2wgfHwgIXByb3BlcnR5U3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb250ZXh0Lmhhcyhwcm9wZXJ0eVN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSkge1xuICAgICAgcmV0dXJuIHByb3BlcnR5U3ltYm9sO1xuICAgIH1cblxuICAgIC8vIEluIGNhc2UgdGhlIGNvbnRleHQgaGFzIHRoZSB2YWx1ZSBkZWNsYXJhdGlvbiBvZiB0aGUgZ2l2ZW4gcHJvcGVydHkgYWNjZXNzXG4gICAgLy8gbmFtZSBpZGVudGlmaWVyLCB3ZSBuZWVkIHRvIHJlcGxhY2UgdGhlIFwicHJvcGVydHlTeW1ib2xcIiB3aXRoIHRoZSBzeW1ib2xcbiAgICAvLyByZWZlcnJpbmcgdG8gdGhlIHJlc29sdmVkIHN5bWJvbCBiYXNlZCBvbiB0aGUgY29udGV4dC4gZS5nLiBhYnN0cmFjdCBwcm9wZXJ0aWVzXG4gICAgLy8gY2FuIHVsdGltYXRlbHkgcmVzb2x2ZSBpbnRvIGFuIGFjY2Vzc29yIGRlY2xhcmF0aW9uIGJhc2VkIG9uIHRoZSBpbXBsZW1lbnRhdGlvbi5cbiAgICBjb25zdCBjb250ZXh0Tm9kZSA9IHRoaXMuX3Jlc29sdmVOb2RlRnJvbUNvbnRleHQocHJvcGVydHlTeW1ib2wudmFsdWVEZWNsYXJhdGlvbik7XG5cbiAgICBpZiAoIXRzLmlzQWNjZXNzb3IoY29udGV4dE5vZGUpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZXNvbHZlIHRoZSBzeW1ib2wgcmVmZXJyaW5nIHRvIHRoZSBcImFjY2Vzc29yXCIgdXNpbmcgdGhlIG5hbWUgaWRlbnRpZmllclxuICAgIC8vIG9mIHRoZSBhY2Nlc3NvciBkZWNsYXJhdGlvbi5cbiAgICByZXR1cm4gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUoY29udGV4dE5vZGUubmFtZSk7XG4gIH1cbn1cbiJdfQ==