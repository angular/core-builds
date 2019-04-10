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
        define("@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/functions"], factory);
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
            if (!propertySymbol) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyxtRkFBZ0c7SUFJaEc7OztPQUdHO0lBQ0gsTUFBTSxzQkFBc0IsR0FBRztRQUM3QixFQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtRQUM5QixFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtRQUNqQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQjtRQUNsQyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWM7UUFDNUIsRUFBRSxDQUFDLFVBQVUsQ0FBQywyQkFBMkI7UUFDekMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlO1FBQzdCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO1FBQzlCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO0tBQy9CLENBQUM7SUFFRjs7Ozs7T0FLRztJQUNILE1BQWEsdUJBQXVCO1FBYWxDLFlBQ1ksV0FBb0IsRUFBVSxXQUEyQixFQUN6RCxjQUErQixJQUFJLEdBQUcsRUFBRTtZQUR4QyxnQkFBVyxHQUFYLFdBQVcsQ0FBUztZQUFVLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUN6RCxnQkFBVyxHQUFYLFdBQVcsQ0FBNkI7WUFkcEQsaUVBQWlFO1lBQ3pELHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUFXLENBQUM7WUFFbEQsb0VBQW9FO1lBQzVELGNBQVMsR0FBYyxFQUFFLENBQUM7WUFFbEM7OztlQUdHO1lBQ0ssWUFBTyxHQUFvQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBSVUsQ0FBQztRQUVoRCxt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LENBQUM7UUFDNUQsQ0FBQztLQUNGO0lBblJELDBEQW1SQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2lzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24sIHVud3JhcEV4cHJlc3Npb259IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcblxuZXhwb3J0IHR5cGUgRnVuY3Rpb25Db250ZXh0ID0gTWFwPHRzLk5vZGUsIHRzLk5vZGU+O1xuXG4vKipcbiAqIExpc3Qgb2YgVHlwZVNjcmlwdCBzeW50YXggdG9rZW5zIHRoYXQgY2FuIGJlIHVzZWQgd2l0aGluIGEgYmluYXJ5IGV4cHJlc3Npb24gYXNcbiAqIGNvbXBvdW5kIGFzc2lnbm1lbnQuIFRoZXNlIGltcGx5IGEgcmVhZCBhbmQgd3JpdGUgb2YgdGhlIGxlZnQtc2lkZSBleHByZXNzaW9uLlxuICovXG5jb25zdCBCSU5BUllfQ09NUE9VTkRfVE9LRU5TID0gW1xuICB0cy5TeW50YXhLaW5kLkNhcmV0RXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuQXN0ZXJpc2tFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5BbXBlcnNhbmRFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5CYXJFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5Bc3Rlcmlza0FzdGVyaXNrRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuUGx1c0VxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLk1pbnVzRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuU2xhc2hFcXVhbHNUb2tlbixcbl07XG5cbi8qKlxuICogQ2xhc3MgdGhhdCBjYW4gYmUgdXNlZCB0byBkZXRlcm1pbmUgaWYgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUgaXMgdXNlZCB3aXRoaW5cbiAqIG90aGVyIGdpdmVuIFR5cGVTY3JpcHQgbm9kZXMuIFRoaXMgaXMgYWNoaWV2ZWQgYnkgd2Fsa2luZyB0aHJvdWdoIGFsbCBjaGlsZHJlblxuICogb2YgdGhlIGdpdmVuIG5vZGUgYW5kIGNoZWNraW5nIGZvciB1c2FnZXMgb2YgdGhlIGdpdmVuIGRlY2xhcmF0aW9uLiBUaGUgdmlzaXRvclxuICogYWxzbyBoYW5kbGVzIHBvdGVudGlhbCBjb250cm9sIGZsb3cgY2hhbmdlcyBjYXVzZWQgYnkgY2FsbC9uZXcgZXhwcmVzc2lvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvciB7XG4gIC8qKiBTZXQgb2YgdmlzaXRlZCBzeW1ib2xzIHRoYXQgY2F1c2VkIGEganVtcCBpbiBjb250cm9sIGZsb3cuICovXG4gIHByaXZhdGUgdmlzaXRlZEp1bXBFeHByTm9kZXMgPSBuZXcgU2V0PHRzLk5vZGU+KCk7XG5cbiAgLyoqIFF1ZXVlIG9mIG5vZGVzIHRoYXQgbmVlZCB0byBiZSBjaGVja2VkIGZvciBkZWNsYXJhdGlvbiB1c2FnZS4gKi9cbiAgcHJpdmF0ZSBub2RlUXVldWU6IHRzLk5vZGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiBjb250ZXh0IHRoYXQgaG9sZHMgdGhlIFR5cGVTY3JpcHQgbm9kZSB2YWx1ZXMgZm9yIGFsbCBwYXJhbWV0ZXJzXG4gICAqIG9mIHRoZSBjdXJyZW50bHkgYW5hbHl6ZWQgZnVuY3Rpb24gYmxvY2suXG4gICAqL1xuICBwcml2YXRlIGNvbnRleHQ6IEZ1bmN0aW9uQ29udGV4dCA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgZGVjbGFyYXRpb246IHRzLk5vZGUsIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBiYXNlQ29udGV4dDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpKSB7fVxuXG4gIHByaXZhdGUgaXNSZWZlcnJpbmdUb1N5bWJvbChub2RlOiB0cy5Ob2RlKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuICAgIHJldHVybiAhIXN5bWJvbCAmJiBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbiA9PT0gdGhpcy5kZWNsYXJhdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgYWRkSnVtcEV4cHJlc3Npb25Ub1F1ZXVlKGNhbGxFeHByZXNzaW9uOiB0cy5DYWxsRXhwcmVzc2lvbikge1xuICAgIGNvbnN0IG5vZGUgPSB1bndyYXBFeHByZXNzaW9uKGNhbGxFeHByZXNzaW9uLmV4cHJlc3Npb24pO1xuXG4gICAgLy8gSW4gY2FzZSB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiBpcyBhbHJlYWR5IHJlZmVycmluZyB0byBhIGZ1bmN0aW9uLWxpa2UgZGVjbGFyYXRpb24sXG4gICAgLy8gd2UgZG9uJ3QgbmVlZCB0byByZXNvbHZlIHRoZSBzeW1ib2wgb2YgdGhlIGV4cHJlc3Npb24gYXMgdGhlIGp1bXAgZXhwcmVzc2lvbiBpc1xuICAgIC8vIGRlZmluZWQgaW5saW5lIGFuZCB3ZSBjYW4ganVzdCBhZGQgdGhlIGdpdmVuIG5vZGUgdG8gdGhlIHF1ZXVlLlxuICAgIGlmIChpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKG5vZGUpICYmIG5vZGUuYm9keSkge1xuICAgICAgdGhpcy5ub2RlUXVldWUucHVzaChub2RlLmJvZHkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbGxFeHByU3ltYm9sID0gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUobm9kZSk7XG5cbiAgICBpZiAoIWNhbGxFeHByU3ltYm9sIHx8ICFjYWxsRXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZXhwcmVzc2lvbkRlY2wgPSB0aGlzLl9yZXNvbHZlTm9kZUZyb21Db250ZXh0KGNhbGxFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pO1xuXG4gICAgLy8gTm90ZSB0aGF0IHdlIHNob3VsZCBub3QgYWRkIHByZXZpb3VzbHkgdmlzaXRlZCBzeW1ib2xzIHRvIHRoZSBxdWV1ZSBhc1xuICAgIC8vIHRoaXMgY291bGQgY2F1c2UgY3ljbGVzLlxuICAgIGlmICghaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihleHByZXNzaW9uRGVjbCkgfHxcbiAgICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5oYXMoZXhwcmVzc2lvbkRlY2wpIHx8ICFleHByZXNzaW9uRGVjbC5ib2R5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IGZvciB0aGUgbmV3IGp1bXAgZXhwcmVzc2lvbiBhbmQgaXRzIHNwZWNpZmllZCBhcmd1bWVudHMuXG4gICAgdGhpcy5fdXBkYXRlQ29udGV4dChjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHMsIGV4cHJlc3Npb25EZWNsLnBhcmFtZXRlcnMpO1xuXG4gICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5hZGQoZXhwcmVzc2lvbkRlY2wpO1xuICAgIHRoaXMubm9kZVF1ZXVlLnB1c2goZXhwcmVzc2lvbkRlY2wuYm9keSk7XG4gIH1cblxuICBwcml2YXRlIGFkZE5ld0V4cHJlc3Npb25Ub1F1ZXVlKG5vZGU6IHRzLk5ld0V4cHJlc3Npb24pIHtcbiAgICBjb25zdCBuZXdFeHByU3ltYm9sID0gdGhpcy5fZ2V0RGVjbGFyYXRpb25TeW1ib2xPZk5vZGUodW53cmFwRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG5ldyBleHByZXNzaW9ucyB3aGljaCByZXNvbHZlIHRvIGNsYXNzZXMuIFRlY2huaWNhbGx5IFwibmV3XCIgY291bGRcbiAgICAvLyBhbHNvIGNhbGwgdm9pZCBmdW5jdGlvbnMgb3Igb2JqZWN0cyB3aXRoIGEgY29uc3RydWN0b3Igc2lnbmF0dXJlLiBBbHNvIG5vdGUgdGhhdFxuICAgIC8vIHdlIHNob3VsZCBub3QgdmlzaXQgYWxyZWFkeSB2aXNpdGVkIHN5bWJvbHMgYXMgdGhpcyBjb3VsZCBjYXVzZSBjeWNsZXMuXG4gICAgaWYgKCFuZXdFeHByU3ltYm9sIHx8ICFuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gfHxcbiAgICAgICAgIXRzLmlzQ2xhc3NEZWNsYXJhdGlvbihuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0Q29uc3RydWN0b3IgPVxuICAgICAgICBuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ubWVtYmVycy5maW5kKHRzLmlzQ29uc3RydWN0b3JEZWNsYXJhdGlvbik7XG5cbiAgICBpZiAodGFyZ2V0Q29uc3RydWN0b3IgJiYgdGFyZ2V0Q29uc3RydWN0b3IuYm9keSAmJlxuICAgICAgICAhdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5oYXModGFyZ2V0Q29uc3RydWN0b3IpKSB7XG4gICAgICAvLyBVcGRhdGUgdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcgZXhwcmVzc2lvbiBhbmQgaXRzIHNwZWNpZmllZCBjb25zdHJ1Y3RvclxuICAgICAgLy8gcGFyYW1ldGVycyBpZiBhcmd1bWVudHMgYXJlIHBhc3NlZCB0byB0aGUgY2xhc3MgY29uc3RydWN0b3IuXG4gICAgICBpZiAobm9kZS5hcmd1bWVudHMpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29udGV4dChub2RlLmFyZ3VtZW50cywgdGFyZ2V0Q29uc3RydWN0b3IucGFyYW1ldGVycyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuYWRkKHRhcmdldENvbnN0cnVjdG9yKTtcbiAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2godGFyZ2V0Q29uc3RydWN0b3IuYm9keSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdFByb3BlcnR5QWNjZXNzb3JzKFxuICAgICAgbm9kZTogdHMuUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uLCBjaGVja1NldHRlcjogYm9vbGVhbiwgY2hlY2tHZXR0ZXI6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBwcm9wZXJ0eVN5bWJvbCA9IHRoaXMuX2dldFByb3BlcnR5QWNjZXNzU3ltYm9sKG5vZGUpO1xuXG4gICAgaWYgKCFwcm9wZXJ0eVN5bWJvbCB8fCAhcHJvcGVydHlTeW1ib2wuZGVjbGFyYXRpb25zLmxlbmd0aCB8fFxuICAgICAgICAocHJvcGVydHlTeW1ib2wuZ2V0RmxhZ3MoKSAmIHRzLlN5bWJvbEZsYWdzLkFjY2Vzc29yKSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNpbmNlIHdlIGNoZWNrZWQgdGhlIHN5bWJvbCBmbGFncyBhbmQgdGhlIHN5bWJvbCBpcyBkZXNjcmliaW5nIGFuIGFjY2Vzc29yLCB0aGVcbiAgICAvLyBkZWNsYXJhdGlvbnMgYXJlIGd1YXJhbnRlZWQgdG8gb25seSBjb250YWluIHRoZSBnZXR0ZXJzIGFuZCBzZXR0ZXJzLlxuICAgIGNvbnN0IGFjY2Vzc29ycyA9IHByb3BlcnR5U3ltYm9sLmRlY2xhcmF0aW9ucyBhcyB0cy5BY2Nlc3NvckRlY2xhcmF0aW9uW107XG5cbiAgICBhY2Nlc3NvcnNcbiAgICAgICAgLmZpbHRlcihcbiAgICAgICAgICAgIGQgPT4gKGNoZWNrU2V0dGVyICYmIHRzLmlzU2V0QWNjZXNzb3IoZCkgfHwgY2hlY2tHZXR0ZXIgJiYgdHMuaXNHZXRBY2Nlc3NvcihkKSkgJiZcbiAgICAgICAgICAgICAgICBkLmJvZHkgJiYgIXRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuaGFzKGQpKVxuICAgICAgICAuZm9yRWFjaChkID0+IHtcbiAgICAgICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmFkZChkKTtcbiAgICAgICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKGQuYm9keSAhKTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHZpc2l0QmluYXJ5RXhwcmVzc2lvbihub2RlOiB0cy5CaW5hcnlFeHByZXNzaW9uKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGVmdEV4cHIgPSB1bndyYXBFeHByZXNzaW9uKG5vZGUubGVmdCk7XG5cbiAgICBpZiAoIXRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKGxlZnRFeHByKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChCSU5BUllfQ09NUE9VTkRfVE9LRU5TLmluZGV4T2Yobm9kZS5vcGVyYXRvclRva2VuLmtpbmQpICE9PSAtMSkge1xuICAgICAgLy8gQ29tcG91bmQgYXNzaWdubWVudHMgYWx3YXlzIGNhdXNlIHRoZSBnZXR0ZXIgYW5kIHNldHRlciB0byBiZSBjYWxsZWQuXG4gICAgICAvLyBUaGVyZWZvcmUgd2UgbmVlZCB0byBjaGVjayB0aGUgc2V0dGVyIGFuZCBnZXR0ZXIgb2YgdGhlIHByb3BlcnR5IGFjY2Vzcy5cbiAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhsZWZ0RXhwciwgLyogc2V0dGVyICovIHRydWUsIC8qIGdldHRlciAqLyB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUub3BlcmF0b3JUb2tlbi5raW5kID09PSB0cy5TeW50YXhLaW5kLkVxdWFsc1Rva2VuKSB7XG4gICAgICAvLyBWYWx1ZSBhc3NpZ25tZW50cyB1c2luZyB0aGUgZXF1YWxzIHRva2VuIG9ubHkgY2F1c2UgdGhlIFwic2V0dGVyXCIgdG8gYmUgY2FsbGVkLlxuICAgICAgLy8gVGhlcmVmb3JlIHdlIG5lZWQgdG8gYW5hbHl6ZSB0aGUgc2V0dGVyIGRlY2xhcmF0aW9uIG9mIHRoZSBwcm9wZXJ0eSBhY2Nlc3MuXG4gICAgICB0aGlzLnZpc2l0UHJvcGVydHlBY2Nlc3NvcnMobGVmdEV4cHIsIC8qIHNldHRlciAqLyB0cnVlLCAvKiBnZXR0ZXIgKi8gZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGUgYmluYXJ5IGV4cHJlc3Npb24gaXMgbm90IGFuIGFzc2lnbm1lbnQsIGl0J3MgYSBzaW1wbGUgcHJvcGVydHkgcmVhZCBhbmRcbiAgICAgIC8vIHdlIG5lZWQgdG8gY2hlY2sgdGhlIGdldHRlciBkZWNsYXJhdGlvbiBpZiBwcmVzZW50LlxuICAgICAgdGhpcy52aXNpdFByb3BlcnR5QWNjZXNzb3JzKGxlZnRFeHByLCAvKiBzZXR0ZXIgKi8gZmFsc2UsIC8qIGdldHRlciAqLyB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpc1N5bmNocm9ub3VzbHlVc2VkSW5Ob2RlKHNlYXJjaE5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgICB0aGlzLm5vZGVRdWV1ZSA9IFtzZWFyY2hOb2RlXTtcbiAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmNsZWFyKCk7XG4gICAgdGhpcy5jb250ZXh0LmNsZWFyKCk7XG5cbiAgICAvLyBDb3B5IGJhc2UgY29udGV4dCB2YWx1ZXMgaW50byB0aGUgY3VycmVudCBmdW5jdGlvbiBibG9jayBjb250ZXh0LiBUaGVcbiAgICAvLyBiYXNlIGNvbnRleHQgaXMgdXNlZnVsIGlmIG5vZGVzIG5lZWQgdG8gYmUgbWFwcGVkIHRvIG90aGVyIG5vZGVzLiBlLmcuXG4gICAgLy8gYWJzdHJhY3Qgc3VwZXIgY2xhc3MgbWV0aG9kcyBhcmUgbWFwcGVkIHRvIHRoZWlyIGltcGxlbWVudGF0aW9uIG5vZGUgb2ZcbiAgICAvLyB0aGUgZGVyaXZlZCBjbGFzcy5cbiAgICB0aGlzLmJhc2VDb250ZXh0LmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHRoaXMuY29udGV4dC5zZXQoa2V5LCB2YWx1ZSkpO1xuXG4gICAgd2hpbGUgKHRoaXMubm9kZVF1ZXVlLmxlbmd0aCkge1xuICAgICAgY29uc3Qgbm9kZSA9IHRoaXMubm9kZVF1ZXVlLnNoaWZ0KCkgITtcblxuICAgICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSAmJiB0aGlzLmlzUmVmZXJyaW5nVG9TeW1ib2wobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBjYWxsIGV4cHJlc3Npb25zIHdpdGhpbiBUeXBlU2NyaXB0IG5vZGVzIHRoYXQgY2F1c2UgYSBqdW1wIGluIGNvbnRyb2xcbiAgICAgIC8vIGZsb3cuIFdlIHJlc29sdmUgdGhlIGNhbGwgZXhwcmVzc2lvbiB2YWx1ZSBkZWNsYXJhdGlvbiBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5hZGRKdW1wRXhwcmVzc2lvblRvUXVldWUobm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgdGhhdCBjYXVzZSBhIGp1bXAgaW4gY29udHJvbCBmbG93LiBXZSByZXNvbHZlIHRoZVxuICAgICAgLy8gY29uc3RydWN0b3IgZGVjbGFyYXRpb24gb2YgdGhlIHRhcmdldCBjbGFzcyBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzTmV3RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLmFkZE5ld0V4cHJlc3Npb25Ub1F1ZXVlKG5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBhbHNvIG5lZWQgdG8gaGFuZGxlIGJpbmFyeSBleHByZXNzaW9ucyB3aGVyZSBhIHZhbHVlIGNhbiBiZSBlaXRoZXIgYXNzaWduZWQgdG9cbiAgICAgIC8vIHRoZSBwcm9wZXJ0eSwgb3IgYSB2YWx1ZSBpcyByZWFkIGZyb20gYSBwcm9wZXJ0eSBleHByZXNzaW9uLiBEZXBlbmRpbmcgb24gdGhlXG4gICAgICAvLyBiaW5hcnkgZXhwcmVzc2lvbiBvcGVyYXRvciwgc2V0dGVycyBvciBnZXR0ZXJzIG5lZWQgdG8gYmUgYW5hbHl6ZWQuXG4gICAgICBpZiAodHMuaXNCaW5hcnlFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIC8vIEluIGNhc2UgdGhlIGJpbmFyeSBleHByZXNzaW9uIGNvbnRhaW5lZCBhIHByb3BlcnR5IGV4cHJlc3Npb24gb24gdGhlIGxlZnQgc2lkZSwgd2VcbiAgICAgICAgLy8gZG9uJ3Qgd2FudCB0byBjb250aW51ZSB2aXNpdGluZyB0aGlzIHByb3BlcnR5IGV4cHJlc3Npb24gb24gaXRzIG93bi4gVGhpcyBpcyBuZWNlc3NhcnlcbiAgICAgICAgLy8gYmVjYXVzZSB2aXNpdGluZyB0aGUgZXhwcmVzc2lvbiBvbiBpdHMgb3duIGNhdXNlcyBhIGxvc3Mgb2YgY29udGV4dC4gZS5nLiBwcm9wZXJ0eVxuICAgICAgICAvLyBhY2Nlc3MgZXhwcmVzc2lvbnMgKmRvIG5vdCogYWx3YXlzIGNhdXNlIGEgdmFsdWUgcmVhZCAoZS5nLiBwcm9wZXJ0eSBhc3NpZ25tZW50cylcbiAgICAgICAgaWYgKHRoaXMudmlzaXRCaW5hcnlFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgICAgdGhpcy5ub2RlUXVldWUucHVzaChub2RlLnJpZ2h0KTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb25zLiBQcm9wZXJ0eSBleHByZXNzaW9ucyB3aGljaCBhcmUgcGFydCBvZiBiaW5hcnlcbiAgICAgIC8vIGV4cHJlc3Npb25zIHdvbid0IGJlIGFkZGVkIHRvIHRoZSBub2RlIHF1ZXVlLCBzbyB0aGVzZSBhY2Nlc3MgZXhwcmVzc2lvbnMgYXJlXG4gICAgICAvLyBndWFyYW50ZWVkIHRvIGJlIFwicmVhZFwiIGFjY2Vzc2VzIGFuZCB3ZSBuZWVkIHRvIGNoZWNrIHRoZSBcImdldHRlclwiIGRlY2xhcmF0aW9uLlxuICAgICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhub2RlLCAvKiBzZXR0ZXIgKi8gZmFsc2UsIC8qIGdldHRlciAqLyB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gRG8gbm90IHZpc2l0IG5vZGVzIHRoYXQgZGVjbGFyZSBhIGJsb2NrIG9mIHN0YXRlbWVudHMgYnV0IGFyZSBub3QgZXhlY3V0ZWRcbiAgICAgIC8vIHN5bmNocm9ub3VzbHkgKGUuZy4gZnVuY3Rpb24gZGVjbGFyYXRpb25zKS4gV2Ugb25seSB3YW50IHRvIGNoZWNrIFR5cGVTY3JpcHRcbiAgICAgIC8vIG5vZGVzIHdoaWNoIGFyZSBzeW5jaHJvbm91c2x5IGV4ZWN1dGVkIGluIHRoZSBjb250cm9sIGZsb3cuXG4gICAgICBpZiAoIWlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5ub2RlUXVldWUucHVzaCguLi5ub2RlLmdldENoaWxkcmVuKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgYSBnaXZlbiBub2RlIGZyb20gdGhlIGNvbnRleHQuIEluIGNhc2UgdGhlIG5vZGUgaXMgbm90IG1hcHBlZCBpblxuICAgKiB0aGUgY29udGV4dCwgdGhlIG9yaWdpbmFsIG5vZGUgaXMgcmV0dXJuZWQuXG4gICAqL1xuICBwcml2YXRlIF9yZXNvbHZlTm9kZUZyb21Db250ZXh0KG5vZGU6IHRzLk5vZGUpOiB0cy5Ob2RlIHtcbiAgICBpZiAodGhpcy5jb250ZXh0Lmhhcyhub2RlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5nZXQobm9kZSkgITtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY29udGV4dCB0byByZWZsZWN0IHRoZSBuZXdseSBzZXQgcGFyYW1ldGVyIHZhbHVlcy4gVGhpcyBhbGxvd3MgZnV0dXJlXG4gICAqIHJlZmVyZW5jZXMgdG8gZnVuY3Rpb24gcGFyYW1ldGVycyB0byBiZSByZXNvbHZlZCB0byB0aGUgYWN0dWFsIG5vZGUgdGhyb3VnaCB0aGUgY29udGV4dC5cbiAgICovXG4gIHByaXZhdGUgX3VwZGF0ZUNvbnRleHQoXG4gICAgICBjYWxsQXJnczogdHMuTm9kZUFycmF5PHRzLkV4cHJlc3Npb24+LCBwYXJhbWV0ZXJzOiB0cy5Ob2RlQXJyYXk8dHMuUGFyYW1ldGVyRGVjbGFyYXRpb24+KSB7XG4gICAgcGFyYW1ldGVycy5mb3JFYWNoKChwYXJhbWV0ZXIsIGluZGV4KSA9PiB7XG4gICAgICBsZXQgYXJndW1lbnROb2RlOiB0cy5Ob2RlID0gY2FsbEFyZ3NbaW5kZXhdO1xuICAgICAgaWYgKHRzLmlzSWRlbnRpZmllcihhcmd1bWVudE5vZGUpKSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5zZXQocGFyYW1ldGVyLCB0aGlzLl9yZXNvbHZlSWRlbnRpZmllcihhcmd1bWVudE5vZGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY29udGV4dC5zZXQocGFyYW1ldGVyLCBhcmd1bWVudE5vZGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGEgVHlwZVNjcmlwdCBpZGVudGlmaWVyIG5vZGUuIEZvciBleGFtcGxlIGFuIGlkZW50aWZpZXIgY2FuIHJlZmVyIHRvIGFcbiAgICogZnVuY3Rpb24gcGFyYW1ldGVyIHdoaWNoIGNhbiBiZSByZXNvbHZlZCB0aHJvdWdoIHRoZSBmdW5jdGlvbiBjb250ZXh0LlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzb2x2ZUlkZW50aWZpZXIobm9kZTogdHMuSWRlbnRpZmllcik6IHRzLk5vZGUge1xuICAgIGNvbnN0IHN5bWJvbCA9IHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKG5vZGUpO1xuXG4gICAgaWYgKCFzeW1ib2wgfHwgIXN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcmVzb2x2ZU5vZGVGcm9tQ29udGV4dChzeW1ib2wudmFsdWVEZWNsYXJhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVjbGFyYXRpb24gc3ltYm9sIG9mIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlLiBSZXNvbHZlcyBhbGlhc2VkXG4gICAqIHN5bWJvbHMgdG8gdGhlIHN5bWJvbCBjb250YWluaW5nIHRoZSB2YWx1ZSBkZWNsYXJhdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKG5vZGU6IHRzLk5vZGUpOiB0cy5TeW1ib2x8bnVsbCB7XG4gICAgbGV0IHN5bWJvbCA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihub2RlKTtcblxuICAgIGlmICghc3ltYm9sKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZXNvbHZlIHRoZSBzeW1ib2wgdG8gaXQncyBvcmlnaW5hbCBkZWNsYXJhdGlvbiBzeW1ib2wuXG4gICAgd2hpbGUgKHN5bWJvbC5mbGFncyAmIHRzLlN5bWJvbEZsYWdzLkFsaWFzKSB7XG4gICAgICBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldEFsaWFzZWRTeW1ib2woc3ltYm9sKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3ltYm9sO1xuICB9XG5cbiAgLyoqIEdldHMgdGhlIHN5bWJvbCBvZiB0aGUgZ2l2ZW4gcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb24uICovXG4gIHByaXZhdGUgX2dldFByb3BlcnR5QWNjZXNzU3ltYm9sKG5vZGU6IHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbik6IHRzLlN5bWJvbHxudWxsIHtcbiAgICBsZXQgcHJvcGVydHlTeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShub2RlLm5hbWUpO1xuXG4gICAgaWYgKCFwcm9wZXJ0eVN5bWJvbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbnRleHQuaGFzKHByb3BlcnR5U3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pKSB7XG4gICAgICByZXR1cm4gcHJvcGVydHlTeW1ib2w7XG4gICAgfVxuXG4gICAgLy8gSW4gY2FzZSB0aGUgY29udGV4dCBoYXMgdGhlIHZhbHVlIGRlY2xhcmF0aW9uIG9mIHRoZSBnaXZlbiBwcm9wZXJ0eSBhY2Nlc3NcbiAgICAvLyBuYW1lIGlkZW50aWZpZXIsIHdlIG5lZWQgdG8gcmVwbGFjZSB0aGUgXCJwcm9wZXJ0eVN5bWJvbFwiIHdpdGggdGhlIHN5bWJvbFxuICAgIC8vIHJlZmVycmluZyB0byB0aGUgcmVzb2x2ZWQgc3ltYm9sIGJhc2VkIG9uIHRoZSBjb250ZXh0LiBlLmcuIGFic3RyYWN0IHByb3BlcnRpZXNcbiAgICAvLyBjYW4gdWx0aW1hdGVseSByZXNvbHZlIGludG8gYW4gYWNjZXNzb3IgZGVjbGFyYXRpb24gYmFzZWQgb24gdGhlIGltcGxlbWVudGF0aW9uLlxuICAgIGNvbnN0IGNvbnRleHROb2RlID0gdGhpcy5fcmVzb2x2ZU5vZGVGcm9tQ29udGV4dChwcm9wZXJ0eVN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKTtcblxuICAgIGlmICghdHMuaXNBY2Nlc3Nvcihjb250ZXh0Tm9kZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFJlc29sdmUgdGhlIHN5bWJvbCByZWZlcnJpbmcgdG8gdGhlIFwiYWNjZXNzb3JcIiB1c2luZyB0aGUgbmFtZSBpZGVudGlmaWVyXG4gICAgLy8gb2YgdGhlIGFjY2Vzc29yIGRlY2xhcmF0aW9uLlxuICAgIHJldHVybiB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShjb250ZXh0Tm9kZS5uYW1lKTtcbiAgfVxufVxuIl19