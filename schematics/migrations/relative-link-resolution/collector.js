var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/relative-link-resolution/collector", ["require", "exports", "typescript", "@angular/core/schematics/migrations/relative-link-resolution/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RelativeLinkResolutionCollector = void 0;
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    const typescript_1 = __importDefault(require("typescript"));
    const util_1 = require("@angular/core/schematics/migrations/relative-link-resolution/util");
    /**
     * Visitor that walks through specified TypeScript nodes and collects all
     * found ExtraOptions#RelativeLinkResolution assignments.
     */
    class RelativeLinkResolutionCollector {
        constructor(typeChecker) {
            this.typeChecker = typeChecker;
            this.forRootCalls = [];
            this.extraOptionsLiterals = [];
        }
        visitNode(node) {
            let forRootCall = null;
            let literal = null;
            if ((0, util_1.isRouterModuleForRoot)(this.typeChecker, node) && node.arguments.length > 0) {
                if (node.arguments.length === 1) {
                    forRootCall = node;
                }
                else if (typescript_1.default.isObjectLiteralExpression(node.arguments[1])) {
                    literal = node.arguments[1];
                }
                else if (typescript_1.default.isIdentifier(node.arguments[1])) {
                    literal = this.getLiteralNeedingMigrationFromIdentifier(node.arguments[1]);
                }
            }
            else if (typescript_1.default.isVariableDeclaration(node)) {
                literal = this.getLiteralNeedingMigration(node);
            }
            if (literal !== null) {
                this.extraOptionsLiterals.push(literal);
            }
            else if (forRootCall !== null) {
                this.forRootCalls.push(forRootCall);
            }
            else {
                // no match found, continue iteration
                typescript_1.default.forEachChild(node, n => this.visitNode(n));
            }
        }
        getLiteralNeedingMigrationFromIdentifier(id) {
            const symbolForIdentifier = this.typeChecker.getSymbolAtLocation(id);
            if (symbolForIdentifier === undefined) {
                return null;
            }
            if (symbolForIdentifier.declarations === undefined ||
                symbolForIdentifier.declarations.length === 0) {
                return null;
            }
            const declarationNode = symbolForIdentifier.declarations[0];
            if (!typescript_1.default.isVariableDeclaration(declarationNode) || declarationNode.initializer === undefined ||
                !typescript_1.default.isObjectLiteralExpression(declarationNode.initializer)) {
                return null;
            }
            return declarationNode.initializer;
        }
        getLiteralNeedingMigration(node) {
            if (node.initializer === undefined) {
                return null;
            }
            // declaration could be `x: ExtraOptions = {}` or `x = {} as ExtraOptions`
            if (typescript_1.default.isAsExpression(node.initializer) &&
                typescript_1.default.isObjectLiteralExpression(node.initializer.expression) &&
                (0, util_1.isExtraOptions)(this.typeChecker, node.initializer.type)) {
                return node.initializer.expression;
            }
            else if (node.type !== undefined && typescript_1.default.isObjectLiteralExpression(node.initializer) &&
                (0, util_1.isExtraOptions)(this.typeChecker, node.type)) {
                return node.initializer;
            }
            return null;
        }
    }
    exports.RelativeLinkResolutionCollector = RelativeLinkResolutionCollector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvcmVsYXRpdmUtbGluay1yZXNvbHV0aW9uL2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCw0REFBNEI7SUFFNUIsNEZBQTZEO0lBRzdEOzs7T0FHRztJQUNILE1BQWEsK0JBQStCO1FBSTFDLFlBQTZCLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUgvQyxpQkFBWSxHQUF3QixFQUFFLENBQUM7WUFDdkMseUJBQW9CLEdBQWlDLEVBQUUsQ0FBQztRQUVOLENBQUM7UUFFNUQsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxXQUFXLEdBQTJCLElBQUksQ0FBQztZQUMvQyxJQUFJLE9BQU8sR0FBb0MsSUFBSSxDQUFDO1lBQ3BELElBQUksSUFBQSw0QkFBcUIsRUFBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDOUUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQy9CLFdBQVcsR0FBRyxJQUFJLENBQUM7aUJBQ3BCO3FCQUFNLElBQUksb0JBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzFELE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBK0IsQ0FBQztpQkFDM0Q7cUJBQU0sSUFBSSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzdDLE9BQU8sR0FBRyxJQUFJLENBQUMsd0NBQXdDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQWtCLENBQUMsQ0FBQztpQkFDN0Y7YUFDRjtpQkFBTSxJQUFJLG9CQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3pDLE9BQU8sR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDakQ7WUFFRCxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDekM7aUJBQU0sSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO2dCQUMvQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUNyQztpQkFBTTtnQkFDTCxxQ0FBcUM7Z0JBQ3JDLG9CQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMvQztRQUNILENBQUM7UUFFTyx3Q0FBd0MsQ0FBQyxFQUFpQjtZQUVoRSxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDckUsSUFBSSxtQkFBbUIsS0FBSyxTQUFTLEVBQUU7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxJQUFJLG1CQUFtQixDQUFDLFlBQVksS0FBSyxTQUFTO2dCQUM5QyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDakQsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELE1BQU0sZUFBZSxHQUFHLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RCxJQUFJLENBQUMsb0JBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsSUFBSSxlQUFlLENBQUMsV0FBVyxLQUFLLFNBQVM7Z0JBQ3ZGLENBQUMsb0JBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQzlELE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxPQUFPLGVBQWUsQ0FBQyxXQUFXLENBQUM7UUFDckMsQ0FBQztRQUVPLDBCQUEwQixDQUFDLElBQTRCO1lBRTdELElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7Z0JBQ2xDLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCwwRUFBMEU7WUFDMUUsSUFBSSxvQkFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUNuQyxvQkFBRSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO2dCQUN6RCxJQUFBLHFCQUFjLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMzRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO2FBQ3BDO2lCQUFNLElBQ0gsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksb0JBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUN6RSxJQUFBLHFCQUFjLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUN6QjtZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztLQUNGO0lBdkVELDBFQXVFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2lzRXh0cmFPcHRpb25zLCBpc1JvdXRlck1vZHVsZUZvclJvb3R9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiBWaXNpdG9yIHRoYXQgd2Fsa3MgdGhyb3VnaCBzcGVjaWZpZWQgVHlwZVNjcmlwdCBub2RlcyBhbmQgY29sbGVjdHMgYWxsXG4gKiBmb3VuZCBFeHRyYU9wdGlvbnMjUmVsYXRpdmVMaW5rUmVzb2x1dGlvbiBhc3NpZ25tZW50cy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlbGF0aXZlTGlua1Jlc29sdXRpb25Db2xsZWN0b3Ige1xuICByZWFkb25seSBmb3JSb290Q2FsbHM6IHRzLkNhbGxFeHByZXNzaW9uW10gPSBbXTtcbiAgcmVhZG9ubHkgZXh0cmFPcHRpb25zTGl0ZXJhbHM6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uW10gPSBbXTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGxldCBmb3JSb290Q2FsbDogdHMuQ2FsbEV4cHJlc3Npb258bnVsbCA9IG51bGw7XG4gICAgbGV0IGxpdGVyYWw6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9ufG51bGwgPSBudWxsO1xuICAgIGlmIChpc1JvdXRlck1vZHVsZUZvclJvb3QodGhpcy50eXBlQ2hlY2tlciwgbm9kZSkgJiYgbm9kZS5hcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKG5vZGUuYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBmb3JSb290Q2FsbCA9IG5vZGU7XG4gICAgICB9IGVsc2UgaWYgKHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obm9kZS5hcmd1bWVudHNbMV0pKSB7XG4gICAgICAgIGxpdGVyYWwgPSBub2RlLmFyZ3VtZW50c1sxXSBhcyB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbjtcbiAgICAgIH0gZWxzZSBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUuYXJndW1lbnRzWzFdKSkge1xuICAgICAgICBsaXRlcmFsID0gdGhpcy5nZXRMaXRlcmFsTmVlZGluZ01pZ3JhdGlvbkZyb21JZGVudGlmaWVyKG5vZGUuYXJndW1lbnRzWzFdIGFzIHRzLklkZW50aWZpZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICBsaXRlcmFsID0gdGhpcy5nZXRMaXRlcmFsTmVlZGluZ01pZ3JhdGlvbihub2RlKTtcbiAgICB9XG5cbiAgICBpZiAobGl0ZXJhbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5leHRyYU9wdGlvbnNMaXRlcmFscy5wdXNoKGxpdGVyYWwpO1xuICAgIH0gZWxzZSBpZiAoZm9yUm9vdENhbGwgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuZm9yUm9vdENhbGxzLnB1c2goZm9yUm9vdENhbGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBubyBtYXRjaCBmb3VuZCwgY29udGludWUgaXRlcmF0aW9uXG4gICAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgbiA9PiB0aGlzLnZpc2l0Tm9kZShuKSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRMaXRlcmFsTmVlZGluZ01pZ3JhdGlvbkZyb21JZGVudGlmaWVyKGlkOiB0cy5JZGVudGlmaWVyKTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb25cbiAgICAgIHxudWxsIHtcbiAgICBjb25zdCBzeW1ib2xGb3JJZGVudGlmaWVyID0gdGhpcy50eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKGlkKTtcbiAgICBpZiAoc3ltYm9sRm9ySWRlbnRpZmllciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoc3ltYm9sRm9ySWRlbnRpZmllci5kZWNsYXJhdGlvbnMgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICBzeW1ib2xGb3JJZGVudGlmaWVyLmRlY2xhcmF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uTm9kZSA9IHN5bWJvbEZvcklkZW50aWZpZXIuZGVjbGFyYXRpb25zWzBdO1xuICAgIGlmICghdHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKGRlY2xhcmF0aW9uTm9kZSkgfHwgZGVjbGFyYXRpb25Ob2RlLmluaXRpYWxpemVyID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oZGVjbGFyYXRpb25Ob2RlLmluaXRpYWxpemVyKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY2xhcmF0aW9uTm9kZS5pbml0aWFsaXplcjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TGl0ZXJhbE5lZWRpbmdNaWdyYXRpb24obm9kZTogdHMuVmFyaWFibGVEZWNsYXJhdGlvbik6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uXG4gICAgICB8bnVsbCB7XG4gICAgaWYgKG5vZGUuaW5pdGlhbGl6ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gZGVjbGFyYXRpb24gY291bGQgYmUgYHg6IEV4dHJhT3B0aW9ucyA9IHt9YCBvciBgeCA9IHt9IGFzIEV4dHJhT3B0aW9uc2BcbiAgICBpZiAodHMuaXNBc0V4cHJlc3Npb24obm9kZS5pbml0aWFsaXplcikgJiZcbiAgICAgICAgdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlLmluaXRpYWxpemVyLmV4cHJlc3Npb24pICYmXG4gICAgICAgIGlzRXh0cmFPcHRpb25zKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuaW5pdGlhbGl6ZXIudHlwZSkpIHtcbiAgICAgIHJldHVybiBub2RlLmluaXRpYWxpemVyLmV4cHJlc3Npb247XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgbm9kZS50eXBlICE9PSB1bmRlZmluZWQgJiYgdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlLmluaXRpYWxpemVyKSAmJlxuICAgICAgICBpc0V4dHJhT3B0aW9ucyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLnR5cGUpKSB7XG4gICAgICByZXR1cm4gbm9kZS5pbml0aWFsaXplcjtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19