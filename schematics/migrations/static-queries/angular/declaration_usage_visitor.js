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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyx1R0FBb0Y7SUFFcEY7Ozs7O09BS0c7SUFDSCxNQUFhLHVCQUF1QjtRQUlsQyxZQUFvQixXQUFvQixFQUFVLFdBQTJCO1lBQXpELGdCQUFXLEdBQVgsV0FBVyxDQUFTO1lBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBSDdFLGlFQUFpRTtZQUN6RCwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBYSxDQUFDO1FBRTBCLENBQUM7UUFFekUsbUJBQW1CLENBQUMsSUFBYTtZQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFELE9BQU8sQ0FBQyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNsRSxDQUFDO1FBRU8sd0JBQXdCLENBQUMsSUFBbUIsRUFBRSxTQUFvQjtZQUN4RSxvRkFBb0Y7WUFDcEYsa0ZBQWtGO1lBQ2xGLGtFQUFrRTtZQUNsRSxJQUFJLHFDQUF5QixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ2hELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxQixPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlELE1BQU0s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QUM7UUFDZixDQUFDO0tBQ0Y7SUEzRkQsMERBMkZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7aXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbiwgdW53cmFwRXhwcmVzc2lvbn0gZnJvbSAnLi4vdHlwZXNjcmlwdC9mdW5jdGlvbnMnO1xuXG4vKipcbiAqIENsYXNzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGEgZ2l2ZW4gVHlwZVNjcmlwdCBub2RlIGlzIHVzZWQgd2l0aGluXG4gKiBvdGhlciBnaXZlbiBUeXBlU2NyaXB0IG5vZGVzLiBUaGlzIGlzIGFjaGlldmVkIGJ5IHdhbGtpbmcgdGhyb3VnaCBhbGwgY2hpbGRyZW5cbiAqIG9mIHRoZSBnaXZlbiBub2RlIGFuZCBjaGVja2luZyBmb3IgdXNhZ2VzIG9mIHRoZSBnaXZlbiBkZWNsYXJhdGlvbi4gVGhlIHZpc2l0b3JcbiAqIGFsc28gaGFuZGxlcyBwb3RlbnRpYWwgY29udHJvbCBmbG93IGNoYW5nZXMgY2F1c2VkIGJ5IGNhbGwvbmV3IGV4cHJlc3Npb25zLlxuICovXG5leHBvcnQgY2xhc3MgRGVjbGFyYXRpb25Vc2FnZVZpc2l0b3Ige1xuICAvKiogU2V0IG9mIHZpc2l0ZWQgc3ltYm9scyB0aGF0IGNhdXNlZCBhIGp1bXAgaW4gY29udHJvbCBmbG93LiAqL1xuICBwcml2YXRlIHZpc2l0ZWRKdW1wRXhwclN5bWJvbHMgPSBuZXcgU2V0PHRzLlN5bWJvbD4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlY2xhcmF0aW9uOiB0cy5Ob2RlLCBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICBwcml2YXRlIGlzUmVmZXJyaW5nVG9TeW1ib2wobm9kZTogdHMuTm9kZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHN5bWJvbCA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihub2RlKTtcbiAgICByZXR1cm4gISFzeW1ib2wgJiYgc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gPT09IHRoaXMuZGVjbGFyYXRpb247XG4gIH1cblxuICBwcml2YXRlIGFkZEp1bXBFeHByZXNzaW9uVG9RdWV1ZShub2RlOiB0cy5FeHByZXNzaW9uLCBub2RlUXVldWU6IHRzLk5vZGVbXSkge1xuICAgIC8vIEluIGNhc2UgdGhlIGdpdmVuIGV4cHJlc3Npb24gaXMgYWxyZWFkeSByZWZlcnJpbmcgdG8gYSBmdW5jdGlvbi1saWtlIGRlY2xhcmF0aW9uLFxuICAgIC8vIHdlIGRvbid0IG5lZWQgdG8gcmVzb2x2ZSB0aGUgc3ltYm9sIG9mIHRoZSBleHByZXNzaW9uIGFzIHRoZSBqdW1wIGV4cHJlc3Npb24gaXNcbiAgICAvLyBkZWZpbmVkIGlubGluZSBhbmQgd2UgY2FuIGp1c3QgYWRkIHRoZSBnaXZlbiBub2RlIHRvIHRoZSBxdWV1ZS5cbiAgICBpZiAoaXNGdW5jdGlvbkxpa2VEZWNsYXJhdGlvbihub2RlKSAmJiBub2RlLmJvZHkpIHtcbiAgICAgIG5vZGVRdWV1ZS5wdXNoKG5vZGUuYm9keSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY2FsbEV4cHJUeXBlID0gdGhpcy50eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihub2RlKTtcbiAgICBjb25zdCBjYWxsRXhwclN5bWJvbCA9IGNhbGxFeHByVHlwZS5nZXRTeW1ib2woKTtcblxuICAgIGlmICghY2FsbEV4cHJTeW1ib2wgfHwgIWNhbGxFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gfHxcbiAgICAgICAgIWlzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb24oY2FsbEV4cHJTeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBleHByZXNzaW9uRGVjbCA9IGNhbGxFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb247XG5cbiAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkIG5vdCBhZGQgcHJldmlvdXNseSB2aXNpdGVkIHN5bWJvbHMgdG8gdGhlIHF1ZXVlIGFzXG4gICAgLy8gdGhpcyBjb3VsZCBjYXVzZSBjeWNsZXMuXG4gICAgaWYgKGV4cHJlc3Npb25EZWNsLmJvZHkgJiYgIXRoaXMudmlzaXRlZEp1bXBFeHByU3ltYm9scy5oYXMoY2FsbEV4cHJTeW1ib2wpKSB7XG4gICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwclN5bWJvbHMuYWRkKGNhbGxFeHByU3ltYm9sKTtcbiAgICAgIG5vZGVRdWV1ZS5wdXNoKGV4cHJlc3Npb25EZWNsLmJvZHkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkTmV3RXhwcmVzc2lvblRvUXVldWUobm9kZTogdHMuTmV3RXhwcmVzc2lvbiwgbm9kZVF1ZXVlOiB0cy5Ob2RlW10pIHtcbiAgICBjb25zdCBuZXdFeHByU3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKHVud3JhcEV4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSk7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgd2hpY2ggcmVzb2x2ZSB0byBjbGFzc2VzLiBUZWNobmljYWxseSBcIm5ld1wiIGNvdWxkXG4gICAgLy8gYWxzbyBjYWxsIHZvaWQgZnVuY3Rpb25zIG9yIG9iamVjdHMgd2l0aCBhIGNvbnN0cnVjdG9yIHNpZ25hdHVyZS4gQWxzbyBub3RlIHRoYXRcbiAgICAvLyB3ZSBzaG91bGQgbm90IHZpc2l0IGFscmVhZHkgdmlzaXRlZCBzeW1ib2xzIGFzIHRoaXMgY291bGQgY2F1c2UgY3ljbGVzLlxuICAgIGlmICghbmV3RXhwclN5bWJvbCB8fCAhbmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uIHx8XG4gICAgICAgICF0cy5pc0NsYXNzRGVjbGFyYXRpb24obmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB8fFxuICAgICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwclN5bWJvbHMuaGFzKG5ld0V4cHJTeW1ib2wpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0Q29uc3RydWN0b3IgPVxuICAgICAgICBuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ubWVtYmVycy5maW5kKHRzLmlzQ29uc3RydWN0b3JEZWNsYXJhdGlvbik7XG5cbiAgICBpZiAodGFyZ2V0Q29uc3RydWN0b3IgJiYgdGFyZ2V0Q29uc3RydWN0b3IuYm9keSkge1xuICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJTeW1ib2xzLmFkZChuZXdFeHByU3ltYm9sKTtcbiAgICAgIG5vZGVRdWV1ZS5wdXNoKHRhcmdldENvbnN0cnVjdG9yLmJvZHkpO1xuICAgIH1cbiAgfVxuXG4gIGlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUoc2VhcmNoTm9kZTogdHMuTm9kZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vZGVRdWV1ZTogdHMuTm9kZVtdID0gW3NlYXJjaE5vZGVdO1xuICAgIHRoaXMudmlzaXRlZEp1bXBFeHByU3ltYm9scy5jbGVhcigpO1xuXG4gICAgd2hpbGUgKG5vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2RlUXVldWUuc2hpZnQoKSAhO1xuXG4gICAgICBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUpICYmIHRoaXMuaXNSZWZlcnJpbmdUb1N5bWJvbChub2RlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIGNhbGwgZXhwcmVzc2lvbnMgd2l0aGluIFR5cGVTY3JpcHQgbm9kZXMgdGhhdCBjYXVzZSBhIGp1bXAgaW4gY29udHJvbFxuICAgICAgLy8gZmxvdy4gV2UgcmVzb2x2ZSB0aGUgY2FsbCBleHByZXNzaW9uIHZhbHVlIGRlY2xhcmF0aW9uIGFuZCBhZGQgaXQgdG8gdGhlIG5vZGUgcXVldWUuXG4gICAgICBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLmFkZEp1bXBFeHByZXNzaW9uVG9RdWV1ZSh1bndyYXBFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbiksIG5vZGVRdWV1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgdGhhdCBjYXVzZSBhIGp1bXAgaW4gY29udHJvbCBmbG93LiBXZSByZXNvbHZlIHRoZVxuICAgICAgLy8gY29uc3RydWN0b3IgZGVjbGFyYXRpb24gb2YgdGhlIHRhcmdldCBjbGFzcyBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzTmV3RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLmFkZE5ld0V4cHJlc3Npb25Ub1F1ZXVlKG5vZGUsIG5vZGVRdWV1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvIG5vdCB2aXNpdCBub2RlcyB0aGF0IGRlY2xhcmUgYSBibG9jayBvZiBzdGF0ZW1lbnRzIGJ1dCBhcmUgbm90IGV4ZWN1dGVkXG4gICAgICAvLyBzeW5jaHJvbm91c2x5IChlLmcuIGZ1bmN0aW9uIGRlY2xhcmF0aW9ucykuIFdlIG9ubHkgd2FudCB0byBjaGVjayBUeXBlU2NyaXB0XG4gICAgICAvLyBub2RlcyB3aGljaCBhcmUgc3luY2hyb25vdXNseSBleGVjdXRlZCBpbiB0aGUgY29udHJvbCBmbG93LlxuICAgICAgaWYgKCFpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIG5vZGVRdWV1ZS5wdXNoKC4uLm5vZGUuZ2V0Q2hpbGRyZW4oKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl19