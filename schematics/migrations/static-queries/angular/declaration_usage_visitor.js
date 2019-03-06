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
        define("@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
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
            const callExprSymbol = this.typeChecker.getSymbolAtLocation(node);
            // Note that we should not add previously visited symbols to the queue as this
            // could cause cycles.
            if (callExprSymbol && callExprSymbol.valueDeclaration &&
                !this.visitedJumpExprSymbols.has(callExprSymbol)) {
                this.visitedJumpExprSymbols.add(callExprSymbol);
                nodeQueue.push(callExprSymbol.valueDeclaration);
            }
        }
        addNewExpressionToQueue(node, nodeQueue) {
            const newExprSymbol = this.typeChecker.getSymbolAtLocation(node.expression);
            // Only handle new expressions which resolve to classes. Technically "new" could
            // also call void functions or objects with a constructor signature. Also note that
            // we should not visit already visited symbols as this could cause cycles.
            if (!newExprSymbol || !newExprSymbol.valueDeclaration ||
                !ts.isClassDeclaration(newExprSymbol.valueDeclaration) ||
                this.visitedJumpExprSymbols.has(newExprSymbol)) {
                return;
            }
            const targetConstructor = newExprSymbol.valueDeclaration.members.find(d => ts.isConstructorDeclaration(d));
            if (targetConstructor) {
                this.visitedJumpExprSymbols.add(newExprSymbol);
                nodeQueue.push(targetConstructor);
            }
        }
        isUsedInNode(searchNode) {
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
                    this.addJumpExpressionToQueue(node.expression, nodeQueue);
                }
                // Handle new expressions that cause a jump in control flow. We resolve the
                // constructor declaration of the target class and add it to the node queue.
                if (ts.isNewExpression(node)) {
                    this.addNewExpressionToQueue(node, nodeQueue);
                }
                nodeQueue.push(...node.getChildren());
            }
            return false;
        }
    }
    exports.DeclarationUsageVisitor = DeclarationUsageVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQzs7Ozs7T0FLRztJQUNILE1BQWEsdUJBQXVCO1FBSWxDLFlBQW9CLFdBQW9CLEVBQVUsV0FBMkI7WUFBekQsZ0JBQVcsR0FBWCxXQUFXLENBQVM7WUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFIN0UsaUVBQWlFO1lBQ3pELDJCQUFzQixHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7UUFFMEIsQ0FBQztRQUV6RSxtQkFBbUIsQ0FBQyxJQUFhO1lBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUQsT0FBTyxDQUFDLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ2xFLENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxJQUFtQixFQUFFLFNBQW9CO1lBQ3hFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFbEUsOEVBQThFO1lBQzlFLHNCQUFzQjtZQUN0QixJQUFJLGNBQWMsSUFBSSxjQUFjLENBQUMsZ0JBQWdCO2dCQUNqRCxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ3BELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2hELFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7YUFDakQ7UUFDSCxDQUFDO1FBRU8sdUJBQXVCLENBQUMsSUFBc0IsRUFBRSxTQUFvQjtZQUMxRSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU1RSxnRkFBZ0Y7WUFDaEYsbUZBQW1GO1lBQ25GLDBFQUEwRTtZQUMxRSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQjtnQkFDakQsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDO2dCQUN0RCxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUNsRCxPQUFPO2FBQ1I7WUFFRCxNQUFNLGlCQUFpQixHQUNuQixhQUFhLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXJGLElBQUksaUJBQWlCLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQy9DLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUNuQztRQUNILENBQUM7UUFFRCxZQUFZLENBQUMsVUFBbUI7WUFDOUIsTUFBTSxTQUFTLEdBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFcEMsT0FBTyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUN2QixNQUFNLElBQUksR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFJLENBQUM7Z0JBRWpDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzNELE9BQU8sSUFBSSxDQUFDO2lCQUNiO2dCQUVELCtFQUErRTtnQkFDL0UsdUZBQXVGO2dCQUN2RixJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDN0IsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7aUJBQzNEO2dCQUVELDJFQUEyRTtnQkFDM0UsNEVBQTRFO2dCQUM1RSxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzVCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7aUJBQy9DO2dCQUVELFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQzthQUN2QztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQztLQUNGO0lBdkVELDBEQXVFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbi8qKlxuICogQ2xhc3MgdGhhdCBjYW4gYmUgdXNlZCB0byBkZXRlcm1pbmUgaWYgYSBnaXZlbiBUeXBlU2NyaXB0IG5vZGUgaXMgdXNlZCB3aXRoaW5cbiAqIG90aGVyIGdpdmVuIFR5cGVTY3JpcHQgbm9kZXMuIFRoaXMgaXMgYWNoaWV2ZWQgYnkgd2Fsa2luZyB0aHJvdWdoIGFsbCBjaGlsZHJlblxuICogb2YgdGhlIGdpdmVuIG5vZGUgYW5kIGNoZWNraW5nIGZvciB1c2FnZXMgb2YgdGhlIGdpdmVuIGRlY2xhcmF0aW9uLiBUaGUgdmlzaXRvclxuICogYWxzbyBoYW5kbGVzIHBvdGVudGlhbCBjb250cm9sIGZsb3cgY2hhbmdlcyBjYXVzZWQgYnkgY2FsbC9uZXcgZXhwcmVzc2lvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvciB7XG4gIC8qKiBTZXQgb2YgdmlzaXRlZCBzeW1ib2xzIHRoYXQgY2F1c2VkIGEganVtcCBpbiBjb250cm9sIGZsb3cuICovXG4gIHByaXZhdGUgdmlzaXRlZEp1bXBFeHByU3ltYm9scyA9IG5ldyBTZXQ8dHMuU3ltYm9sPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVjbGFyYXRpb246IHRzLk5vZGUsIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKSB7fVxuXG4gIHByaXZhdGUgaXNSZWZlcnJpbmdUb1N5bWJvbChub2RlOiB0cy5Ob2RlKTogYm9vbGVhbiB7XG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuICAgIHJldHVybiAhIXN5bWJvbCAmJiBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbiA9PT0gdGhpcy5kZWNsYXJhdGlvbjtcbiAgfVxuXG4gIHByaXZhdGUgYWRkSnVtcEV4cHJlc3Npb25Ub1F1ZXVlKG5vZGU6IHRzLkV4cHJlc3Npb24sIG5vZGVRdWV1ZTogdHMuTm9kZVtdKSB7XG4gICAgY29uc3QgY2FsbEV4cHJTeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgd2Ugc2hvdWxkIG5vdCBhZGQgcHJldmlvdXNseSB2aXNpdGVkIHN5bWJvbHMgdG8gdGhlIHF1ZXVlIGFzIHRoaXNcbiAgICAvLyBjb3VsZCBjYXVzZSBjeWNsZXMuXG4gICAgaWYgKGNhbGxFeHByU3ltYm9sICYmIGNhbGxFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gJiZcbiAgICAgICAgIXRoaXMudmlzaXRlZEp1bXBFeHByU3ltYm9scy5oYXMoY2FsbEV4cHJTeW1ib2wpKSB7XG4gICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwclN5bWJvbHMuYWRkKGNhbGxFeHByU3ltYm9sKTtcbiAgICAgIG5vZGVRdWV1ZS5wdXNoKGNhbGxFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkTmV3RXhwcmVzc2lvblRvUXVldWUobm9kZTogdHMuTmV3RXhwcmVzc2lvbiwgbm9kZVF1ZXVlOiB0cy5Ob2RlW10pIHtcbiAgICBjb25zdCBuZXdFeHByU3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUuZXhwcmVzc2lvbik7XG5cbiAgICAvLyBPbmx5IGhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgd2hpY2ggcmVzb2x2ZSB0byBjbGFzc2VzLiBUZWNobmljYWxseSBcIm5ld1wiIGNvdWxkXG4gICAgLy8gYWxzbyBjYWxsIHZvaWQgZnVuY3Rpb25zIG9yIG9iamVjdHMgd2l0aCBhIGNvbnN0cnVjdG9yIHNpZ25hdHVyZS4gQWxzbyBub3RlIHRoYXRcbiAgICAvLyB3ZSBzaG91bGQgbm90IHZpc2l0IGFscmVhZHkgdmlzaXRlZCBzeW1ib2xzIGFzIHRoaXMgY291bGQgY2F1c2UgY3ljbGVzLlxuICAgIGlmICghbmV3RXhwclN5bWJvbCB8fCAhbmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uIHx8XG4gICAgICAgICF0cy5pc0NsYXNzRGVjbGFyYXRpb24obmV3RXhwclN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSB8fFxuICAgICAgICB0aGlzLnZpc2l0ZWRKdW1wRXhwclN5bWJvbHMuaGFzKG5ld0V4cHJTeW1ib2wpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0Q29uc3RydWN0b3IgPVxuICAgICAgICBuZXdFeHByU3ltYm9sLnZhbHVlRGVjbGFyYXRpb24ubWVtYmVycy5maW5kKGQgPT4gdHMuaXNDb25zdHJ1Y3RvckRlY2xhcmF0aW9uKGQpKTtcblxuICAgIGlmICh0YXJnZXRDb25zdHJ1Y3Rvcikge1xuICAgICAgdGhpcy52aXNpdGVkSnVtcEV4cHJTeW1ib2xzLmFkZChuZXdFeHByU3ltYm9sKTtcbiAgICAgIG5vZGVRdWV1ZS5wdXNoKHRhcmdldENvbnN0cnVjdG9yKTtcbiAgICB9XG4gIH1cblxuICBpc1VzZWRJbk5vZGUoc2VhcmNoTm9kZTogdHMuTm9kZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vZGVRdWV1ZTogdHMuTm9kZVtdID0gW3NlYXJjaE5vZGVdO1xuICAgIHRoaXMudmlzaXRlZEp1bXBFeHByU3ltYm9scy5jbGVhcigpO1xuXG4gICAgd2hpbGUgKG5vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2RlUXVldWUuc2hpZnQoKSAhO1xuXG4gICAgICBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUpICYmIHRoaXMuaXNSZWZlcnJpbmdUb1N5bWJvbChub2RlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIGNhbGwgZXhwcmVzc2lvbnMgd2l0aGluIFR5cGVTY3JpcHQgbm9kZXMgdGhhdCBjYXVzZSBhIGp1bXAgaW4gY29udHJvbFxuICAgICAgLy8gZmxvdy4gV2UgcmVzb2x2ZSB0aGUgY2FsbCBleHByZXNzaW9uIHZhbHVlIGRlY2xhcmF0aW9uIGFuZCBhZGQgaXQgdG8gdGhlIG5vZGUgcXVldWUuXG4gICAgICBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLmFkZEp1bXBFeHByZXNzaW9uVG9RdWV1ZShub2RlLmV4cHJlc3Npb24sIG5vZGVRdWV1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSBuZXcgZXhwcmVzc2lvbnMgdGhhdCBjYXVzZSBhIGp1bXAgaW4gY29udHJvbCBmbG93LiBXZSByZXNvbHZlIHRoZVxuICAgICAgLy8gY29uc3RydWN0b3IgZGVjbGFyYXRpb24gb2YgdGhlIHRhcmdldCBjbGFzcyBhbmQgYWRkIGl0IHRvIHRoZSBub2RlIHF1ZXVlLlxuICAgICAgaWYgKHRzLmlzTmV3RXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICB0aGlzLmFkZE5ld0V4cHJlc3Npb25Ub1F1ZXVlKG5vZGUsIG5vZGVRdWV1ZSk7XG4gICAgICB9XG5cbiAgICAgIG5vZGVRdWV1ZS5wdXNoKC4uLm5vZGUuZ2V0Q2hpbGRyZW4oKSk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl19