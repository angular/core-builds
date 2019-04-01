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
        define("@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor", ["require", "exports", "typescript", "@angular/core/schematics/migrations/static-queries/typescript/functions"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const functions_1 = require("@angular/core/schematics/migrations/static-queries/typescript/functions");
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
            this.visitedJumpExprSymbols = new Set();
        }
        isReferringToSymbol(node) {
            const symbol = this.typeChecker.getSymbolAtLocation(node);
            return !!symbol && symbol.valueDeclaration === this.declaration;
        }
        addJumpExpressionToQueue(node, nodeQueue) {
            // In case the given expression is already referring to a function-like declaration,
            // we don't need to resolve the symbol of the expression as the jump expression is
            // defined inline and we can just add the given node to the queue.
            if (functions_1.isFunctionLikeDeclaration(node) && node.body) {
                nodeQueue.push(node.body);
                return;
            }
            const callExprType = this.typeChecker.getTypeAtLocation(node);
            const callExprSymbol = callExprType.getSymbol();
            if (!callExprSymbol || !callExprSymbol.valueDeclaration ||
                !functions_1.isFunctionLikeDeclaration(callExprSymbol.valueDeclaration)) {
                return;
            }
            const expressionDecl = callExprSymbol.valueDeclaration;
            // Note that we should not add previously visited symbols to the queue as
            // this could cause cycles.
            if (expressionDecl.body && !this.visitedJumpExprSymbols.has(callExprSymbol)) {
                this.visitedJumpExprSymbols.add(callExprSymbol);
                nodeQueue.push(expressionDecl.body);
            }
        }
        addNewExpressionToQueue(node, nodeQueue) {
            const newExprSymbol = this.typeChecker.getSymbolAtLocation(functions_1.unwrapExpression(node.expression));
            // Only handle new expressions which resolve to classes. Technically "new" could
            // also call void functions or objects with a constructor signature. Also note that
            // we should not visit already visited symbols as this could cause cycles.
            if (!newExprSymbol || !newExprSymbol.valueDeclaration ||
                !ts.isClassDeclaration(newExprSymbol.valueDeclaration) ||
                this.visitedJumpExprSymbols.has(newExprSymbol)) {
                return;
            }
            const targetConstructor = newExprSymbol.valueDeclaration.members.find(ts.isConstructorDeclaration);
            if (targetConstructor && targetConstructor.body) {
                this.visitedJumpExprSymbols.add(newExprSymbol);
                nodeQueue.push(targetConstructor.body);
            }
        }
        visitPropertyAccessExpression(node, nodeQueue) {
            const propertySymbol = this.typeChecker.getSymbolAtLocation(node.name);
            if (!propertySymbol || !propertySymbol.valueDeclaration ||
                this.visitedJumpExprSymbols.has(propertySymbol)) {
                return;
            }
            const valueDeclaration = propertySymbol.valueDeclaration;
            // In case the property access expression refers to a get accessor, we need to visit
            // the body of the get accessor declaration as there could be logic that uses the
            // given search node synchronously.
            if (ts.isGetAccessorDeclaration(valueDeclaration) && valueDeclaration.body) {
                this.visitedJumpExprSymbols.add(propertySymbol);
                nodeQueue.push(valueDeclaration.body);
            }
        }
        isSynchronouslyUsedInNode(searchNode) {
            const nodeQueue = [searchNode];
            this.visitedJumpExprSymbols.clear();
            while (nodeQueue.length) {
                const node = nodeQueue.shift();
                if (ts.isIdentifier(node) && this.isReferringToSymbol(node)) {
                    return true;
                }
                // Handle call expressions within TypeScript nodes that cause a jump in control
                // flow. We resolve the call expression value declaration and add it to the node queue.
                if (ts.isCallExpression(node)) {
                    this.addJumpExpressionToQueue(functions_1.unwrapExpression(node.expression), nodeQueue);
                }
                // Handle new expressions that cause a jump in control flow. We resolve the
                // constructor declaration of the target class and add it to the node queue.
                if (ts.isNewExpression(node)) {
                    this.addNewExpressionToQueue(node, nodeQueue);
                }
                // Handle property access expressions. These could resolve to get-accessor declarations
                // which can contain synchronous logic that accesses the search node.
                if (ts.isPropertyAccessExpression(node)) {
                    this.visitPropertyAccessExpression(node, nodeQueue);
                }
                // Do not visit nodes that declare a block of statements but are not executed
                // synchronously (e.g. function declarations). We only want to check TypeScript
                // nodes which are synchronously executed in the control flow.
                if (!functions_1.isFunctionLikeDeclaration(node)) {
                    nodeQueue.push(...node.getChildren());
                }
            }
            return false;
        }
    }
    exports.DeclarationUsageVisitor = DeclarationUsageVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyx1R0FBb0Y7SUFFcEY7Ozs7O09BS0c7SUFDSCxNQUFhLHVCQUF1QjtRQUlsQyxZQUFvQixXQUFvQixFQUFVLFdBQTJCO1lBQXpELGdCQUFXLEdBQVgsV0FBVyxDQUFTO1lBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBSDdFLGlFQUFpRTtZQUN6RCwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBYSxDQUFDO1FBRTBCLENBQUM7UUFFekUsbUJBQW1CLENBQUMsSUFBYTtZQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFELE9BQU8sQ0FBQyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNsRSxDQUFDO1FBRU8sd0JBQXdCLENBQUMsSUFBbUIsRUFBRSxTQUFvQjtZQUN4RSxvRkFBb0Y7WUFDcEYsa0ZBQWtGO1lBQ2xGLGtFQUFrRTtZQUNsRSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ2hELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxQixPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlELE1BQU0s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QyxFQUFFO29CQUMzRCxPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFFRCwrRUFBK0U7Z0JBQy9FLHVGQUF1RjtnQkFDdkYsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzdCLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyw0QkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7aUJBQzdFO2dCQUVELDJFQUEyRTtnQkFDM0UsNEVBQTRFO2dCQUM1RSxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzVCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7aUJBQy9DO2dCQUVELHVGQUF1RjtnQkFDdkYscUVBQXFFO2dCQUNyRSxJQUFJLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztpQkFDckQ7Z0JBRUQsNkVBQTZFO2dCQUM3RSwrRUFBK0U7Z0JBQy9FLDhEQUE4RDtnQkFDOUQsSUFBSSxDQUFDLHFDQUF5QixDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNwQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7aUJBQ3ZDO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7S0FDRjtJQXBIRCwwREFvSEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uLCB1bndyYXBFeHByZXNzaW9ufSBmcm9tICcuLi90eXBlc2NyaXB0L2Z1bmN0aW9ucyc7XG5cbi8qKlxuICogQ2xhc3MgdGhhdCBjYW4gYmUgdXNlZCB0byBkZXRlcm1pbmUgaWYgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUgaXMgdXNlZCB3aXRoaW5cbiAqIG90aGVyIGdpdmVuIFR5cGVTY3JpcHQgbm9kZXMuIFRoaXMgaXMgYWNoaWV2ZWQgYnkgd2Fsa2luZyB0aHJvdWdoIGFsbCBjaGlsZHJlblxuICogb2YgdGhlIGdpdmVuIG5vZGUgYW5kIGNoZWNraW5nIGZvciB1c2FnZXMgb2YgdGhlIGdpdmVuIGRlY2xhcmF0aW9uLiBUaGUgdmlzaXRvclxuICogYWxzbyBoYW5kbGVzIHBvdGVudGlhbCBjb250cm9sIGZsb3cgY2hhbmdlcyBjYXVzZWQgYnkgY2FsbC9uZXcgZXhwcmVzc2lvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvciB7XG4gIC8qKiBTZXQgb2YgdmlzaXRlZCBzeW1ib2xzIHRoYXQgY2F1c2VkIGEganVtcCBpbiBjb250cm9sIGZsb3cuICovXG4gIHByaXZhdGUgdmlzaXRlZEp1bXBFeHByU3ltYm9scyA9IG5ldyBTZXQ8dHMuU3ltYm9sPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVjbGFyYXRpb246IHRzLk5vZGUsIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKSB7fVxuXG4gIHByaXZhdGUgaXNSZWZlcnJpbmdUb1N5bWJvbChub2RlOiB0cy5Ob2RlKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuICAgIHJldHVybiAhIXN5bWJvbCAmJiBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbiA9PT0gdGhpcy5kZWNsYXJhdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgYWRkSnVtcEV4cHJlc3Npb25Ub1F1ZXVlKG5vZGU6IHRzLkV4cHJlc3Npb24sIG5vZGVRdWV1ZTogdHMuTm9kZVtdKSB7XG4gICAgLy8gSW4gY2FzZSB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiBpcyBhbHJlYWR5IHJlZmVycmluZyB0byBhIGZ1bmN0aW9uLWxpa2UgZGVjbGFyYXRpb24sXG4gICAgLy8gd2UgZG9uJ3QgbmVlZCB0byByZXNvbHZlIHRoZSBzeW1ib2wgb2YgdGhlIGV4cHJlc3Npb24gYXMgdGhlIGp1bXAgZXhwcmVzc2lvbiBpc1xuICAgIC8vIGRlZmluZWQgaW5saW5lIGFuZCB3ZSBjYW4ganVzdCBhZGQgdGhlIGdpdmVuIG5vZGUgdG8gdGhlIHF1ZXVlLlxuICAgIGlmIChpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKG5vZGUpICYmIG5vZGUuYm9keSkge1xuICAgICAgbm9kZVF1ZXVlLnB1c2gobm9kZS5ib2R5KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjYWxsRXhwclR5cGUgPSB0aGlzLnR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKG5vZGUpO1xuICAgIGNvbnN0IGNhbGxFeHByU3ltYm9sID0gY2FsbEV4cHJUeXBlLmdldFN5bWJvbCgpO1xuXG4gICAgaWYgKCFjYWxsRXhwclN5bWJvbCB8fCAhY2FsbEV4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbiB8fFxuICAgICAgICAhaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihjYWxsRXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cHJlc3Npb25EZWNsID0gY2FsbEV4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbjtcblxuICAgIC8vIE5vdGUgdGhhdCB3ZSBzaG91bGQgbm90IGFkZCBwcmV2aW91c2x5IHZpc2l0ZWQgc3ltYm9scyB0byB0aGUgcXVldWUgYXNcbiAgICAvLyB0aGlzIGNvdWxkIGNhdXNlIGN5Y2xlcy5cbiAgICBpZiAoZXhwcmVzc2lvbkRlY2wuYm9keSAmJiAhdGhpcy52aXNpdGVkSnVtcEV4cHJTeW1ib2xzLmhhcyhjYWxsRXhwclN5bWJvbCkpIHtcbiAgICAgIHRoaXMudmlzaXRlZEp1bXBFeHByU3ltYm9scy5hZGQoY2FsbEV4cHJTeW1ib2wpO1xuICAgICAgbm9kZVF1ZXVlLnB1c2goZXhwcmVzc2lvbkRlY2wuYm9keSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGROZXdFeHByZXNzaW9uVG9RdWV1ZShub2RlOiB0cy5OZXdFeHByZXNzaW9uLCBub2RlUXVldWU6IHRzLk5vZGVbXSkge1xuICAgIGNvbnN0IG5ld0V4cHJTeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24odW53cmFwRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pKTtcblxuICAgIC8vIE9ubHkgaGFuZGxlIG5ldyBleHByZXNzaW9ucyB3aGljaCByZXNvbHZlIHRvIGNsYXNzZXMuIFRlY2huaWNhbGx5IFwibmV3XCIgY291bGRcbiAgICAvLyBhbHNvIGNhbGwgdm9pZCBmdW5jdGlvbnMgb3Igb2JqZWN0cyB3aXRoIGEgY29uc3RydWN0b3Igc2lnbmF0dXJlLiBBbHNvIG5vdGUgdGhhdFxuICAgIC8vIHdlIHNob3VsZCBub3QgdmlzaXQgYWxyZWFkeSB2aXNpdGVkIHN5bWJvbHMgYXMgdGhpcyBjb3VsZCBjYXVzZSBjeWNsZXMuXG4gICAgaWYgKCFuZXdFeHByU3ltYm9sIHx8ICFuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gfHxcbiAgICAgICAgIXRzLmlzQ2xhc3NEZWNsYXJhdGlvbihuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pIHx8XG4gICAgICAgIHRoaXMudmlzaXRlZEp1bXBFeHByU3ltYm9scy5oYXMobmV3RXhwclN5bWJvbCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXRDb25zdHJ1Y3RvciA9XG4gICAgICAgIG5ld0V4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbi5tZW1iZXJzLmZpbmQodHMuaXNDb25zdHJ1Y3RvckRlY2xhcmF0aW9uKTtcblxuICAgIGlmICh0YXJnZXRDb25zdHJ1Y3RvciAmJiB0YXJnZXRDb25zdHJ1Y3Rvci5ib2R5KSB7XG4gICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwclN5bWJvbHMuYWRkKG5ld0V4cHJTeW1ib2wpO1xuICAgICAgbm9kZVF1ZXVlLnB1c2godGFyZ2V0Q29uc3RydWN0b3IuYm9keSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdFByb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlOiB0cy5Qcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24sIG5vZGVRdWV1ZTogdHMuTm9kZVtdKSB7XG4gICAgY29uc3QgcHJvcGVydHlTeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZS5uYW1lKTtcblxuICAgIGlmICghcHJvcGVydHlTeW1ib2wgfHwgIXByb3BlcnR5U3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gfHxcbiAgICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJTeW1ib2xzLmhhcyhwcm9wZXJ0eVN5bWJvbCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZURlY2xhcmF0aW9uID0gcHJvcGVydHlTeW1ib2wudmFsdWVEZWNsYXJhdGlvbjtcblxuICAgIC8vIEluIGNhc2UgdGhlIHByb3BlcnR5IGFjY2VzcyBleHByZXNzaW9uIHJlZmVycyB0byBhIGdldCBhY2Nlc3Nvciwgd2UgbmVlZCB0byB2aXNpdFxuICAgIC8vIHRoZSBib2R5IG9mIHRoZSBnZXQgYWNjZXNzb3IgZGVjbGFyYXRpb24gYXMgdGhlcmUgY291bGQgYmUgbG9naWMgdGhhdCB1c2VzIHRoZVxuICAgIC8vIGdpdmVuIHNlYXJjaCBub2RlIHN5bmNocm9ub3VzbHkuXG4gICAgaWYgKHRzLmlzR2V0QWNjZXNzb3JEZWNsYXJhdGlvbih2YWx1ZURlY2xhcmF0aW9uKSAmJiB2YWx1ZURlY2xhcmF0aW9uLmJvZHkpIHtcbiAgICAgIHRoaXMudmlzaXRlZEp1bXBFeHByU3ltYm9scy5hZGQocHJvcGVydHlTeW1ib2wpO1xuICAgICAgbm9kZVF1ZXVlLnB1c2godmFsdWVEZWNsYXJhdGlvbi5ib2R5KTtcbiAgICB9XG4gIH1cblxuICBpc1N5bmNocm9ub3VzbHlVc2VkSW5Ob2RlKHNlYXJjaE5vZGU6IHRzLk5vZGUpOiBib29sZWFuIHtcbiAgICBjb25zdCBub2RlUXVldWU6IHRzLk5vZGVbXSA9IFtzZWFyY2hOb2RlXTtcbiAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwclN5bWJvbHMuY2xlYXIoKTtcblxuICAgIHdoaWxlIChub2RlUXVldWUubGVuZ3RoKSB7XG4gICAgICBjb25zdCBub2RlID0gbm9kZVF1ZXVlLnNoaWZ0KCkgITtcblxuICAgICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSAmJiB0aGlzLmlzUmVmZXJyaW5nVG9TeW1ib2wobm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBjYWxsIGV4cHJlc3Npb25zIHdpdGhpbiBUeXBlU2NyaXB0IG5vZGVzIHRoYXQgY2F1c2UgYSBqdW1wIGluIGNvbnRyb2xcbiAgICAgIC8vIGZsb3cuIFdlIHJlc29sdmUgdGhlIGNhbGwgZXhwcmVzc2lvbiB2YWx1ZSBkZWNsYXJhdGlvbiBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5hZGRKdW1wRXhwcmVzc2lvblRvUXVldWUodW53cmFwRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pLCBub2RlUXVldWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgbmV3IGV4cHJlc3Npb25zIHRoYXQgY2F1c2UgYSBqdW1wIGluIGNvbnRyb2wgZmxvdy4gV2UgcmVzb2x2ZSB0aGVcbiAgICAgIC8vIGNvbnN0cnVjdG9yIGRlY2xhcmF0aW9uIG9mIHRoZSB0YXJnZXQgY2xhc3MgYW5kIGFkZCBpdCB0byB0aGUgbm9kZSBxdWV1ZS5cbiAgICAgIGlmICh0cy5pc05ld0V4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgICAgdGhpcy5hZGROZXdFeHByZXNzaW9uVG9RdWV1ZShub2RlLCBub2RlUXVldWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgcHJvcGVydHkgYWNjZXNzIGV4cHJlc3Npb25zLiBUaGVzZSBjb3VsZCByZXNvbHZlIHRvIGdldC1hY2Nlc3NvciBkZWNsYXJhdGlvbnNcbiAgICAgIC8vIHdoaWNoIGNhbiBjb250YWluIHN5bmNocm9ub3VzIGxvZ2ljIHRoYXQgYWNjZXNzZXMgdGhlIHNlYXJjaCBub2RlLlxuICAgICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZSwgbm9kZVF1ZXVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gRG8gbm90IHZpc2l0IG5vZGVzIHRoYXQgZGVjbGFyZSBhIGJsb2NrIG9mIHN0YXRlbWVudHMgYnV0IGFyZSBub3QgZXhlY3V0ZWRcbiAgICAgIC8vIHN5bmNocm9ub3VzbHkgKGUuZy4gZnVuY3Rpb24gZGVjbGFyYXRpb25zKS4gV2Ugb25seSB3YW50IHRvIGNoZWNrIFR5cGVTY3JpcHRcbiAgICAgIC8vIG5vZGVzIHdoaWNoIGFyZSBzeW5jaHJvbm91c2x5IGV4ZWN1dGVkIGluIHRoZSBjb250cm9sIGZsb3cuXG4gICAgICBpZiAoIWlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgbm9kZVF1ZXVlLnB1c2goLi4ubm9kZS5nZXRDaGlsZHJlbigpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXX0=