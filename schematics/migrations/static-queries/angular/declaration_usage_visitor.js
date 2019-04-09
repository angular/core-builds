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
        constructor(declaration, typeChecker) {
            this.declaration = declaration;
            this.typeChecker = typeChecker;
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
            const propertySymbol = this.typeChecker.getSymbolAtLocation(node.name);
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
            const symbol = this.typeChecker.getSymbolAtLocation(leftExpr.name);
            if (!symbol || !symbol.declarations.length ||
                (symbol.getFlags() & ts.SymbolFlags.Accessor) === 0) {
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
            this.visitedJumpExprNodes.clear();
            this.context.clear();
            this.nodeQueue = [searchNode];
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
            if (ts.isParameter(node) && this.context.has(node)) {
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
    }
    exports.DeclarationUsageVisitor = DeclarationUsageVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyxtRkFBZ0c7SUFJaEc7OztPQUdHO0lBQ0gsTUFBTSxzQkFBc0IsR0FBRztRQUM3QixFQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtRQUM5QixFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtRQUNqQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQjtRQUNsQyxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWM7UUFDNUIsRUFBRSxDQUFDLFVBQVUsQ0FBQywyQkFBMkI7UUFDekMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlO1FBQzdCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO1FBQzlCLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO0tBQy9CLENBQUM7SUFFRjs7Ozs7T0FLRztJQUNILE1BQWEsdUJBQXVCO1FBYWxDLFlBQW9CLFdBQW9CLEVBQVUsV0FBMkI7WUFBekQsZ0JBQVcsR0FBWCxXQUFXLENBQVM7WUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFaN0UsaUVBQWlFO1lBQ3pELHlCQUFvQixHQUFHLElBQUksR0FBRyxFQUFXLENBQUM7WUFFbEQsb0VBQW9FO1lBQzVELGNBQVMsR0FBYyxFQUFFLENBQUM7WUFFbEM7OztlQUdHO1lBQ0ssWUFBTyxHQUFvQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRW1DLENBQUM7UUFFekUsbUJBQW1CLENBQUMsSUFBYTtZQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxD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QUU7Z0JBQ3ZDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0ssMkJBQTJCLENBQUMsSUFBYTtZQUMvQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXhELElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ1gsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELDBEQUEwRDtZQUMxRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUU7Z0JBQzFDLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3BEO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQztLQUNGO0lBdlBELDBEQXVQQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2lzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24sIHVud3JhcEV4cHJlc3Npb259IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcblxudHlwZSBGdW5jdGlvbkNvbnRleHQgPSBNYXA8dHMuUGFyYW1ldGVyRGVjbGFyYXRpb24sIHRzLk5vZGU+O1xuXG4vKipcbiAqIExpc3Qgb2YgVHlwZVNjcmlwdCBzeW50YXggdG9rZW5zIHRoYXQgY2FuIGJlIHVzZWQgd2l0aGluIGEgYmluYXJ5IGV4cHJlc3Npb24gYXNcbiAqIGNvbXBvdW5kIGFzc2lnbm1lbnQuIFRoZXNlIGltcGx5IGEgcmVhZCBhbmQgd3JpdGUgb2YgdGhlIGxlZnQtc2lkZSBleHByZXNzaW9uLlxuICovXG5jb25zdCBCSU5BUllfQ09NUE9VTkRfVE9LRU5TID0gW1xuICB0cy5TeW50YXhLaW5kLkNhcmV0RXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuQXN0ZXJpc2tFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5BbXBlcnNhbmRFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5CYXJFcXVhbHNUb2tlbixcbiAgdHMuU3ludGF4S2luZC5Bc3Rlcmlza0FzdGVyaXNrRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuUGx1c0VxdWFsc1Rva2VuLFxuICB0cy5TeW50YXhLaW5kLk1pbnVzRXF1YWxzVG9rZW4sXG4gIHRzLlN5bnRheEtpbmQuU2xhc2hFcXVhbHNUb2tlbixcbl07XG5cbi8qKlxuICogQ2xhc3MgdGhhdCBjYW4gYmUgdXNlZCB0byBkZXRlcm1pbmUgaWYgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUgaXMgdXNlZCB3aXRoaW5cbiAqIG90aGVyIGdpdmVuIFR5cGVTY3JpcHQgbm9kZXMuIFRoaXMgaXMgYWNoaWV2ZWQgYnkgd2Fsa2luZyB0aHJvdWdoIGFsbCBjaGlsZHJlblxuICogb2YgdGhlIGdpdmVuIG5vZGUgYW5kIGNoZWNraW5nIGZvciB1c2FnZXMgb2YgdGhlIGdpdmVuIGRlY2xhcmF0aW9uLiBUaGUgdmlzaXRvclxuICogYWxzbyBoYW5kbGVzIHBvdGVudGlhbCBjb250cm9sIGZsb3cgY2hhbmdlcyBjYXVzZWQgYnkgY2FsbC9uZXcgZXhwcmVzc2lvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvciB7XG4gIC8qKiBTZXQgb2YgdmlzaXRlZCBzeW1ib2xzIHRoYXQgY2F1c2VkIGEganVtcCBpbiBjb250cm9sIGZsb3cuICovXG4gIHByaXZhdGUgdmlzaXRlZEp1bXBFeHByTm9kZXMgPSBuZXcgU2V0PHRzLk5vZGU+KCk7XG5cbiAgLyoqIFF1ZXVlIG9mIG5vZGVzIHRoYXQgbmVlZCB0byBiZSBjaGVja2VkIGZvciBkZWNsYXJhdGlvbiB1c2FnZS4gKi9cbiAgcHJpdmF0ZSBub2RlUXVldWU6IHRzLk5vZGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiBjb250ZXh0IHRoYXQgaG9sZHMgdGhlIFR5cGVTY3JpcHQgbm9kZSB2YWx1ZXMgZm9yIGFsbCBwYXJhbWV0ZXJzXG4gICAqIG9mIHRoZSBjdXJyZW50bHkgYW5hbHl6ZWQgZnVuY3Rpb24gYmxvY2suXG4gICAqL1xuICBwcml2YXRlIGNvbnRleHQ6IEZ1bmN0aW9uQ29udGV4dCA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlY2xhcmF0aW9uOiB0cy5Ob2RlLCBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICBwcml2YXRlIGlzUmVmZXJyaW5nVG9TeW1ib2wobm9kZTogdHMuTm9kZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHN5bWJvbCA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihub2RlKTtcbiAgICByZXR1cm4gISFzeW1ib2wgJiYgc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gPT09IHRoaXMuZGVjbGFyYXRpb247XG4gIH1cblxuICBwcml2YXRlIGFkZEp1bXBFeHByZXNzaW9uVG9RdWV1ZShjYWxsRXhwcmVzc2lvbjogdHMuQ2FsbEV4cHJlc3Npb24pIHtcbiAgICBjb25zdCBub2RlID0gdW53cmFwRXhwcmVzc2lvbihjYWxsRXhwcmVzc2lvbi5leHByZXNzaW9uKTtcblxuICAgIC8vIEluIGNhc2UgdGhlIGdpdmVuIGV4cHJlc3Npb24gaXMgYWxyZWFkeSByZWZlcnJpbmcgdG8gYSBmdW5jdGlvbi1saWtlIGRlY2xhcmF0aW9uLFxuICAgIC8vIHdlIGRvbid0IG5lZWQgdG8gcmVzb2x2ZSB0aGUgc3ltYm9sIG9mIHRoZSBleHByZXNzaW9uIGFzIHRoZSBqdW1wIGV4cHJlc3Npb24gaXNcbiAgICAvLyBkZWZpbmVkIGlubGluZSBhbmQgd2UgY2FuIGp1c3QgYWRkIHRoZSBnaXZlbiBub2RlIHRvIHRoZSBxdWV1ZS5cbiAgICBpZiAoaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihub2RlKSAmJiBub2RlLmJvZHkpIHtcbiAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2gobm9kZS5ib2R5KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjYWxsRXhwclN5bWJvbCA9IHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKG5vZGUpO1xuXG4gICAgaWYgKCFjYWxsRXhwclN5bWJvbCB8fCAhY2FsbEV4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cHJlc3Npb25EZWNsID0gdGhpcy5fcmVzb2x2ZU5vZGVGcm9tQ29udGV4dChjYWxsRXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKTtcblxuICAgIC8vIE5vdGUgdGhhdCB3ZSBzaG91bGQgbm90IGFkZCBwcmV2aW91c2x5IHZpc2l0ZWQgc3ltYm9scyB0byB0aGUgcXVldWUgYXNcbiAgICAvLyB0aGlzIGNvdWxkIGNhdXNlIGN5Y2xlcy5cbiAgICBpZiAoIWlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24oZXhwcmVzc2lvbkRlY2wpIHx8XG4gICAgICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuaGFzKGV4cHJlc3Npb25EZWNsKSB8fCAhZXhwcmVzc2lvbkRlY2wuYm9keSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBqdW1wIGV4cHJlc3Npb24gYW5kIGl0cyBzcGVjaWZpZWQgYXJndW1lbnRzLlxuICAgIHRoaXMuX3VwZGF0ZUNvbnRleHQoY2FsbEV4cHJlc3Npb24uYXJndW1lbnRzLCBleHByZXNzaW9uRGVjbC5wYXJhbWV0ZXJzKTtcblxuICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuYWRkKGV4cHJlc3Npb25EZWNsKTtcbiAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKGV4cHJlc3Npb25EZWNsLmJvZHkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGROZXdFeHByZXNzaW9uVG9RdWV1ZShub2RlOiB0cy5OZXdFeHByZXNzaW9uKSB7XG4gICAgY29uc3QgbmV3RXhwclN5bWJvbCA9IHRoaXMuX2dldERlY2xhcmF0aW9uU3ltYm9sT2ZOb2RlKHVud3JhcEV4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgd2hpY2ggcmVzb2x2ZSB0byBjbGFzc2VzLiBUZWNobmljYWxseSBcIm5ld1wiIGNvdWxkXG4gICAgLy8gYWxzbyBjYWxsIHZvaWQgZnVuY3Rpb25zIG9yIG9iamVjdHMgd2l0aCBhIGNvbnN0cnVjdG9yIHNpZ25hdHVyZS4gQWxzbyBub3RlIHRoYXRcbiAgICAvLyB3ZSBzaG91bGQgbm90IHZpc2l0IGFscmVhZHkgdmlzaXRlZCBzeW1ib2xzIGFzIHRoaXMgY291bGQgY2F1c2UgY3ljbGVzLlxuICAgIGlmICghbmV3RXhwclN5bWJvbCB8fCAhbmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uIHx8XG4gICAgICAgICF0cy5pc0NsYXNzRGVjbGFyYXRpb24obmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldENvbnN0cnVjdG9yID1cbiAgICAgICAgbmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uLm1lbWJlcnMuZmluZCh0cy5pc0NvbnN0cnVjdG9yRGVjbGFyYXRpb24pO1xuXG4gICAgaWYgKHRhcmdldENvbnN0cnVjdG9yICYmIHRhcmdldENvbnN0cnVjdG9yLmJvZHkgJiZcbiAgICAgICAgIXRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuaGFzKHRhcmdldENvbnN0cnVjdG9yKSkge1xuICAgICAgLy8gVXBkYXRlIHRoZSBjb250ZXh0IGZvciB0aGUgbmV3IGV4cHJlc3Npb24gYW5kIGl0cyBzcGVjaWZpZWQgY29uc3RydWN0b3JcbiAgICAgIC8vIHBhcmFtZXRlcnMgaWYgYXJndW1lbnRzIGFyZSBwYXNzZWQgdG8gdGhlIGNsYXNzIGNvbnN0cnVjdG9yLlxuICAgICAgaWYgKG5vZGUuYXJndW1lbnRzKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRleHQobm9kZS5hcmd1bWVudHMsIHRhcmdldENvbnN0cnVjdG9yLnBhcmFtZXRlcnMpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmFkZCh0YXJnZXRDb25zdHJ1Y3Rvcik7XG4gICAgICB0aGlzLm5vZGVRdWV1ZS5wdXNoKHRhcmdldENvbnN0cnVjdG9yLmJvZHkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhcbiAgICAgIG5vZGU6IHRzLlByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbiwgY2hlY2tTZXR0ZXI6IGJvb2xlYW4sIGNoZWNrR2V0dGVyOiBib29sZWFuKSB7XG4gICAgY29uc3QgcHJvcGVydHlTeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZS5uYW1lKTtcblxuICAgIGlmICghcHJvcGVydHlTeW1ib2wgfHwgIXByb3BlcnR5U3ltYm9sLmRlY2xhcmF0aW9ucy5sZW5ndGggfHxcbiAgICAgICAgKHByb3BlcnR5U3ltYm9sLmdldEZsYWdzKCkgJiB0cy5TeW1ib2xGbGFncy5BY2Nlc3NvcikgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB3ZSBjaGVja2VkIHRoZSBzeW1ib2wgZmxhZ3MgYW5kIHRoZSBzeW1ib2wgaXMgZGVzY3JpYmluZyBhbiBhY2Nlc3NvciwgdGhlXG4gICAgLy8gZGVjbGFyYXRpb25zIGFyZSBndWFyYW50ZWVkIHRvIG9ubHkgY29udGFpbiB0aGUgZ2V0dGVycyBhbmQgc2V0dGVycy5cbiAgICBjb25zdCBhY2Nlc3NvcnMgPSBwcm9wZXJ0eVN5bWJvbC5kZWNsYXJhdGlvbnMgYXMgdHMuQWNjZXNzb3JEZWNsYXJhdGlvbltdO1xuXG4gICAgYWNjZXNzb3JzXG4gICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgICBkID0+IChjaGVja1NldHRlciAmJiB0cy5pc1NldEFjY2Vzc29yKGQpIHx8IGNoZWNrR2V0dGVyICYmIHRzLmlzR2V0QWNjZXNzb3IoZCkpICYmXG4gICAgICAgICAgICAgICAgZC5ib2R5ICYmICF0aGlzLnZpc2l0ZWRKdW1wRXhwck5vZGVzLmhhcyhkKSlcbiAgICAgICAgLmZvckVhY2goZCA9PiB7XG4gICAgICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJOb2Rlcy5hZGQoZCk7XG4gICAgICAgICAgdGhpcy5ub2RlUXVldWUucHVzaChkLmJvZHkgISk7XG4gICAgICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdEJpbmFyeUV4cHJlc3Npb24obm9kZTogdHMuQmluYXJ5RXhwcmVzc2lvbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGxlZnRFeHByID0gdW53cmFwRXhwcmVzc2lvbihub2RlLmxlZnQpO1xuXG4gICAgaWYgKCF0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihsZWZ0RXhwcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obGVmdEV4cHIubmFtZSk7XG5cbiAgICBpZiAoIXN5bWJvbCB8fCAhc3ltYm9sLmRlY2xhcmF0aW9ucy5sZW5ndGggfHxcbiAgICAgICAgKHN5bWJvbC5nZXRGbGFncygpICYgdHMuU3ltYm9sRmxhZ3MuQWNjZXNzb3IpID09PSAwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKEJJTkFSWV9DT01QT1VORF9UT0tFTlMuaW5kZXhPZihub2RlLm9wZXJhdG9yVG9rZW4ua2luZCkgIT09IC0xKSB7XG4gICAgICAvLyBDb21wb3VuZCBhc3NpZ25tZW50cyBhbHdheXMgY2F1c2UgdGhlIGdldHRlciBhbmQgc2V0dGVyIHRvIGJlIGNhbGxlZC5cbiAgICAgIC8vIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIGNoZWNrIHRoZSBzZXR0ZXIgYW5kIGdldHRlciBvZiB0aGUgcHJvcGVydHkgYWNjZXNzLlxuICAgICAgdGhpcy52aXNpdFByb3BlcnR5QWNjZXNzb3JzKGxlZnRFeHByLCAvKiBzZXR0ZXIgKi8gdHJ1ZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgIH0gZWxzZSBpZiAobm9kZS5vcGVyYXRvclRva2VuLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuRXF1YWxzVG9rZW4pIHtcbiAgICAgIC8vIFZhbHVlIGFzc2lnbm1lbnRzIHVzaW5nIHRoZSBlcXVhbHMgdG9rZW4gb25seSBjYXVzZSB0aGUgXCJzZXR0ZXJcIiB0byBiZSBjYWxsZWQuXG4gICAgICAvLyBUaGVyZWZvcmUgd2UgbmVlZCB0byBhbmFseXplIHRoZSBzZXR0ZXIgZGVjbGFyYXRpb24gb2YgdGhlIHByb3BlcnR5IGFjY2Vzcy5cbiAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc29ycyhsZWZ0RXhwciwgLyogc2V0dGVyICovIHRydWUsIC8qIGdldHRlciAqLyBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZSBiaW5hcnkgZXhwcmVzc2lvbiBpcyBub3QgYW4gYXNzaWdubWVudCwgaXQncyBhIHNpbXBsZSBwcm9wZXJ0eSByZWFkIGFuZFxuICAgICAgLy8gd2UgbmVlZCB0byBjaGVjayB0aGUgZ2V0dGVyIGRlY2xhcmF0aW9uIGlmIHByZXNlbnQuXG4gICAgICB0aGlzLnZpc2l0UHJvcGVydHlBY2Nlc3NvcnMobGVmdEV4cHIsIC8qIHNldHRlciAqLyBmYWxzZSwgLyogZ2V0dGVyICovIHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUoc2VhcmNoTm9kZTogdHMuTm9kZSk6IGJvb2xlYW4ge1xuICAgIHRoaXMudmlzaXRlZEp1bXBFeHByTm9kZXMuY2xlYXIoKTtcbiAgICB0aGlzLmNvbnRleHQuY2xlYXIoKTtcbiAgICB0aGlzLm5vZGVRdWV1ZSA9IFtzZWFyY2hOb2RlXTtcblxuICAgIHdoaWxlICh0aGlzLm5vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVRdWV1ZS5zaGlmdCgpICE7XG5cbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIobm9kZSkgJiYgdGhpcy5pc1JlZmVycmluZ1RvU3ltYm9sKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgY2FsbCBleHByZXNzaW9ucyB3aXRoaW4gVHlwZVNjcmlwdCBub2RlcyB0aGF0IGNhdXNlIGEganVtcCBpbiBjb250cm9sXG4gICAgICAvLyBmbG93LiBXZSByZXNvbHZlIHRoZSBjYWxsIGV4cHJlc3Npb24gdmFsdWUgZGVjbGFyYXRpb24gYW5kIGFkZCBpdCB0byB0aGUgbm9kZSBxdWV1ZS5cbiAgICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMuYWRkSnVtcEV4cHJlc3Npb25Ub1F1ZXVlKG5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgbmV3IGV4cHJlc3Npb25zIHRoYXQgY2F1c2UgYSBqdW1wIGluIGNvbnRyb2wgZmxvdy4gV2UgcmVzb2x2ZSB0aGVcbiAgICAgIC8vIGNvbnN0cnVjdG9yIGRlY2xhcmF0aW9uIG9mIHRoZSB0YXJnZXQgY2xhc3MgYW5kIGFkZCBpdCB0byB0aGUgbm9kZSBxdWV1ZS5cbiAgICAgIGlmICh0cy5pc05ld0V4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5hZGROZXdFeHByZXNzaW9uVG9RdWV1ZShub2RlKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgYWxzbyBuZWVkIHRvIGhhbmRsZSBiaW5hcnkgZXhwcmVzc2lvbnMgd2hlcmUgYSB2YWx1ZSBjYW4gYmUgZWl0aGVyIGFzc2lnbmVkIHRvXG4gICAgICAvLyB0aGUgcHJvcGVydHksIG9yIGEgdmFsdWUgaXMgcmVhZCBmcm9tIGEgcHJvcGVydHkgZXhwcmVzc2lvbi4gRGVwZW5kaW5nIG9uIHRoZVxuICAgICAgLy8gYmluYXJ5IGV4cHJlc3Npb24gb3BlcmF0b3IsIHNldHRlcnMgb3IgZ2V0dGVycyBuZWVkIHRvIGJlIGFuYWx5emVkLlxuICAgICAgaWYgKHRzLmlzQmluYXJ5RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICAvLyBJbiBjYXNlIHRoZSBiaW5hcnkgZXhwcmVzc2lvbiBjb250YWluZWQgYSBwcm9wZXJ0eSBleHByZXNzaW9uIG9uIHRoZSBsZWZ0IHNpZGUsIHdlXG4gICAgICAgIC8vIGRvbid0IHdhbnQgdG8gY29udGludWUgdmlzaXRpbmcgdGhpcyBwcm9wZXJ0eSBleHByZXNzaW9uIG9uIGl0cyBvd24uIFRoaXMgaXMgbmVjZXNzYXJ5XG4gICAgICAgIC8vIGJlY2F1c2UgdmlzaXRpbmcgdGhlIGV4cHJlc3Npb24gb24gaXRzIG93biBjYXVzZXMgYSBsb3NzIG9mIGNvbnRleHQuIGUuZy4gcHJvcGVydHlcbiAgICAgICAgLy8gYWNjZXNzIGV4cHJlc3Npb25zICpkbyBub3QqIGFsd2F5cyBjYXVzZSBhIHZhbHVlIHJlYWQgKGUuZy4gcHJvcGVydHkgYXNzaWdubWVudHMpXG4gICAgICAgIGlmICh0aGlzLnZpc2l0QmluYXJ5RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2gobm9kZS5yaWdodCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIHByb3BlcnR5IGFjY2VzcyBleHByZXNzaW9ucy4gUHJvcGVydHkgZXhwcmVzc2lvbnMgd2hpY2ggYXJlIHBhcnQgb2YgYmluYXJ5XG4gICAgICAvLyBleHByZXNzaW9ucyB3b24ndCBiZSBhZGRlZCB0byB0aGUgbm9kZSBxdWV1ZSwgc28gdGhlc2UgYWNjZXNzIGV4cHJlc3Npb25zIGFyZVxuICAgICAgLy8gZ3VhcmFudGVlZCB0byBiZSBcInJlYWRcIiBhY2Nlc3NlcyBhbmQgd2UgbmVlZCB0byBjaGVjayB0aGUgXCJnZXR0ZXJcIiBkZWNsYXJhdGlvbi5cbiAgICAgIGlmICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLnZpc2l0UHJvcGVydHlBY2Nlc3NvcnMobm9kZSwgLyogc2V0dGVyICovIGZhbHNlLCAvKiBnZXR0ZXIgKi8gdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvIG5vdCB2aXNpdCBub2RlcyB0aGF0IGRlY2xhcmUgYSBibG9jayBvZiBzdGF0ZW1lbnRzIGJ1dCBhcmUgbm90IGV4ZWN1dGVkXG4gICAgICAvLyBzeW5jaHJvbm91c2x5IChlLmcuIGZ1bmN0aW9uIGRlY2xhcmF0aW9ucykuIFdlIG9ubHkgd2FudCB0byBjaGVjayBUeXBlU2NyaXB0XG4gICAgICAvLyBub2RlcyB3aGljaCBhcmUgc3luY2hyb25vdXNseSBleGVjdXRlZCBpbiB0aGUgY29udHJvbCBmbG93LlxuICAgICAgaWYgKCFpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMubm9kZVF1ZXVlLnB1c2goLi4ubm9kZS5nZXRDaGlsZHJlbigpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGEgZ2l2ZW4gbm9kZSBmcm9tIHRoZSBjb250ZXh0LiBJbiBjYXNlIHRoZSBub2RlIGlzIG5vdCBtYXBwZWQgaW5cbiAgICogdGhlIGNvbnRleHQsIHRoZSBvcmlnaW5hbCBub2RlIGlzIHJldHVybmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzb2x2ZU5vZGVGcm9tQ29udGV4dChub2RlOiB0cy5Ob2RlKTogdHMuTm9kZSB7XG4gICAgaWYgKHRzLmlzUGFyYW1ldGVyKG5vZGUpICYmIHRoaXMuY29udGV4dC5oYXMobm9kZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnRleHQuZ2V0KG5vZGUpICE7XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNvbnRleHQgdG8gcmVmbGVjdCB0aGUgbmV3bHkgc2V0IHBhcmFtZXRlciB2YWx1ZXMuIFRoaXMgYWxsb3dzIGZ1dHVyZVxuICAgKiByZWZlcmVuY2VzIHRvIGZ1bmN0aW9uIHBhcmFtZXRlcnMgdG8gYmUgcmVzb2x2ZWQgdG8gdGhlIGFjdHVhbCBub2RlIHRocm91Z2ggdGhlIGNvbnRleHQuXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVDb250ZXh0KFxuICAgICAgY2FsbEFyZ3M6IHRzLk5vZGVBcnJheTx0cy5FeHByZXNzaW9uPiwgcGFyYW1ldGVyczogdHMuTm9kZUFycmF5PHRzLlBhcmFtZXRlckRlY2xhcmF0aW9uPikge1xuICAgIHBhcmFtZXRlcnMuZm9yRWFjaCgocGFyYW1ldGVyLCBpbmRleCkgPT4ge1xuICAgICAgbGV0IGFyZ3VtZW50Tm9kZTogdHMuTm9kZSA9IGNhbGxBcmdzW2luZGV4XTtcbiAgICAgIGlmICh0cy5pc0lkZW50aWZpZXIoYXJndW1lbnROb2RlKSkge1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0KHBhcmFtZXRlciwgdGhpcy5fcmVzb2x2ZUlkZW50aWZpZXIoYXJndW1lbnROb2RlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNvbnRleHQuc2V0KHBhcmFtZXRlciwgYXJndW1lbnROb2RlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhIFR5cGVTY3JpcHQgaWRlbnRpZmllciBub2RlLiBGb3IgZXhhbXBsZSBhbiBpZGVudGlmaWVyIGNhbiByZWZlciB0byBhXG4gICAqIGZ1bmN0aW9uIHBhcmFtZXRlciB3aGljaCBjYW4gYmUgcmVzb2x2ZWQgdGhyb3VnaCB0aGUgZnVuY3Rpb24gY29udGV4dC5cbiAgICovXG4gIHByaXZhdGUgX3Jlc29sdmVJZGVudGlmaWVyKG5vZGU6IHRzLklkZW50aWZpZXIpOiB0cy5Ob2RlIHtcbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLl9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShub2RlKTtcblxuICAgIGlmICghc3ltYm9sIHx8ICFzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3Jlc29sdmVOb2RlRnJvbUNvbnRleHQoc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlY2xhcmF0aW9uIHN5bWJvbCBvZiBhIGdpdmVuIFR5cGVTY3JpcHQgbm9kZS4gUmVzb2x2ZXMgYWxpYXNlZFxuICAgKiBzeW1ib2xzIHRvIHRoZSBzeW1ib2wgY29udGFpbmluZyB0aGUgdmFsdWUgZGVjbGFyYXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9nZXREZWNsYXJhdGlvblN5bWJvbE9mTm9kZShub2RlOiB0cy5Ob2RlKTogdHMuU3ltYm9sfG51bGwge1xuICAgIGxldCBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG5cbiAgICBpZiAoIXN5bWJvbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUmVzb2x2ZSB0aGUgc3ltYm9sIHRvIGl0J3Mgb3JpZ2luYWwgZGVjbGFyYXRpb24gc3ltYm9sLlxuICAgIHdoaWxlIChzeW1ib2wuZmxhZ3MgJiB0cy5TeW1ib2xGbGFncy5BbGlhcykge1xuICAgICAgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRBbGlhc2VkU3ltYm9sKHN5bWJvbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN5bWJvbDtcbiAgfVxufVxuIl19