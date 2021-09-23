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
        define("@angular/core/schematics/migrations/module-with-providers/collector", ["require", "exports", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/migrations/module-with-providers/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Collector = void 0;
    const ts = require("typescript");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const util_1 = require("@angular/core/schematics/migrations/module-with-providers/util");
    /**
     * Visitor that walks through specified TypeScript nodes and collects all
     * found NgModule static methods without types and all ModuleWithProviders
     * usages without generic types attached.
     */
    class Collector {
        constructor(typeChecker) {
            this.typeChecker = typeChecker;
            this.resolvedModules = [];
            this.resolvedNonGenerics = [];
        }
        visitNode(node) {
            if (ts.isClassDeclaration(node)) {
                this.visitClassDeclaration(node);
            }
            else if ((0, util_1.isModuleWithProvidersNotGeneric)(this.typeChecker, node)) {
                this.resolvedNonGenerics.push(node);
            }
            ts.forEachChild(node, n => this.visitNode(n));
        }
        visitClassDeclaration(node) {
            if (!node.decorators || !node.decorators.length) {
                return;
            }
            const ngDecorators = (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, node.decorators);
            const ngModuleDecorator = ngDecorators.find(({ name }) => name === 'NgModule');
            if (ngModuleDecorator) {
                this._visitNgModuleClass(node, ngModuleDecorator);
            }
        }
        _visitNgModuleClass(node, decorator) {
            const decoratorCall = decorator.node.expression;
            const metadata = decoratorCall.arguments[0];
            if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
                return;
            }
            this.resolvedModules.push({
                name: node.name ? node.name.text : 'default',
                node,
                decorator,
                staticMethodsWithoutType: node.members.filter(isStaticMethodNoType),
            });
        }
    }
    exports.Collector = Collector;
    function isStaticMethodNoType(node) {
        return ts.isMethodDeclaration(node) && !!node.modifiers &&
            node.modifiers.findIndex(m => m.kind === ts.SyntaxKind.StaticKeyword) > -1 && !node.type;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbW9kdWxlLXdpdGgtcHJvdmlkZXJzL2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFFakMsZ0ZBQTRFO0lBRTVFLHlGQUF1RDtJQWF2RDs7OztPQUlHO0lBQ0gsTUFBYSxTQUFTO1FBSXBCLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUg5QyxvQkFBZSxHQUF1QixFQUFFLENBQUM7WUFDekMsd0JBQW1CLEdBQTJCLEVBQUUsQ0FBQztRQUVBLENBQUM7UUFFbEQsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNsQztpQkFBTSxJQUFJLElBQUEsc0NBQStCLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDbEUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNyQztZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxJQUF5QjtZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUMvQyxPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFBLG9DQUFvQixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdFLE1BQU0saUJBQWlCLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQztZQUU3RSxJQUFJLGlCQUFpQixFQUFFO2dCQUNyQixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUM7YUFDbkQ7UUFDSCxDQUFDO1FBRU8sbUJBQW1CLENBQUMsSUFBeUIsRUFBRSxTQUFzQjtZQUMzRSxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNoRCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTVDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxFQUFFLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3hELE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO2dCQUN4QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQzVDLElBQUk7Z0JBQ0osU0FBUztnQkFDVCx3QkFBd0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQzthQUNwRSxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0Y7SUE1Q0QsOEJBNENDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFxQjtRQUNqRCxPQUFPLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVM7WUFDbkQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQy9GLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnMsIE5nRGVjb3JhdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19kZWNvcmF0b3JzJztcblxuaW1wb3J0IHtpc01vZHVsZVdpdGhQcm92aWRlcnNOb3RHZW5lcmljfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkTmdNb2R1bGUge1xuICBuYW1lOiBzdHJpbmc7XG4gIG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb247XG4gIGRlY29yYXRvcjogTmdEZWNvcmF0b3I7XG4gIC8qKlxuICAgKiBMaXN0IG9mIGZvdW5kIHN0YXRpYyBtZXRob2QgZGVjbGFyYXRpb25zIG9uIHRoZSBtb2R1bGUgd2hpY2ggZG8gbm90XG4gICAqIGRlY2xhcmUgYW4gZXhwbGljaXQgcmV0dXJuIHR5cGUuXG4gICAqL1xuICBzdGF0aWNNZXRob2RzV2l0aG91dFR5cGU6IHRzLk1ldGhvZERlY2xhcmF0aW9uW107XG59XG5cbi8qKlxuICogVmlzaXRvciB0aGF0IHdhbGtzIHRocm91Z2ggc3BlY2lmaWVkIFR5cGVTY3JpcHQgbm9kZXMgYW5kIGNvbGxlY3RzIGFsbFxuICogZm91bmQgTmdNb2R1bGUgc3RhdGljIG1ldGhvZHMgd2l0aG91dCB0eXBlcyBhbmQgYWxsIE1vZHVsZVdpdGhQcm92aWRlcnNcbiAqIHVzYWdlcyB3aXRob3V0IGdlbmVyaWMgdHlwZXMgYXR0YWNoZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb2xsZWN0b3Ige1xuICByZXNvbHZlZE1vZHVsZXM6IFJlc29sdmVkTmdNb2R1bGVbXSA9IFtdO1xuICByZXNvbHZlZE5vbkdlbmVyaWNzOiB0cy5UeXBlUmVmZXJlbmNlTm9kZVtdID0gW107XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgIHRoaXMudmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpO1xuICAgIH0gZWxzZSBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzTm90R2VuZXJpYyh0aGlzLnR5cGVDaGVja2VyLCBub2RlKSkge1xuICAgICAgdGhpcy5yZXNvbHZlZE5vbkdlbmVyaWNzLnB1c2gobm9kZSk7XG4gICAgfVxuXG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIG4gPT4gdGhpcy52aXNpdE5vZGUobikpO1xuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGlmICghbm9kZS5kZWNvcmF0b3JzIHx8ICFub2RlLmRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID0gZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKTtcbiAgICBjb25zdCBuZ01vZHVsZURlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdOZ01vZHVsZScpO1xuXG4gICAgaWYgKG5nTW9kdWxlRGVjb3JhdG9yKSB7XG4gICAgICB0aGlzLl92aXNpdE5nTW9kdWxlQ2xhc3Mobm9kZSwgbmdNb2R1bGVEZWNvcmF0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0TmdNb2R1bGVDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBkZWNvcmF0b3I6IE5nRGVjb3JhdG9yKSB7XG4gICAgY29uc3QgZGVjb3JhdG9yQ2FsbCA9IGRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgY29uc3QgbWV0YWRhdGEgPSBkZWNvcmF0b3JDYWxsLmFyZ3VtZW50c1swXTtcblxuICAgIGlmICghbWV0YWRhdGEgfHwgIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obWV0YWRhdGEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZXNvbHZlZE1vZHVsZXMucHVzaCh7XG4gICAgICBuYW1lOiBub2RlLm5hbWUgPyBub2RlLm5hbWUudGV4dCA6ICdkZWZhdWx0JyxcbiAgICAgIG5vZGUsXG4gICAgICBkZWNvcmF0b3IsXG4gICAgICBzdGF0aWNNZXRob2RzV2l0aG91dFR5cGU6IG5vZGUubWVtYmVycy5maWx0ZXIoaXNTdGF0aWNNZXRob2ROb1R5cGUpLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzU3RhdGljTWV0aG9kTm9UeXBlKG5vZGU6IHRzLkNsYXNzRWxlbWVudCk6IG5vZGUgaXMgdHMuTWV0aG9kRGVjbGFyYXRpb24ge1xuICByZXR1cm4gdHMuaXNNZXRob2REZWNsYXJhdGlvbihub2RlKSAmJiAhIW5vZGUubW9kaWZpZXJzICYmXG4gICAgICBub2RlLm1vZGlmaWVycy5maW5kSW5kZXgobSA9PiBtLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3RhdGljS2V5d29yZCkgPiAtMSAmJiAhbm9kZS50eXBlO1xufVxuIl19