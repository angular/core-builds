/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    const typescript_1 = __importDefault(require("typescript"));
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
            if (typescript_1.default.isClassDeclaration(node)) {
                this.visitClassDeclaration(node);
            }
            else if ((0, util_1.isModuleWithProvidersNotGeneric)(this.typeChecker, node)) {
                this.resolvedNonGenerics.push(node);
            }
            typescript_1.default.forEachChild(node, n => this.visitNode(n));
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
            if (!metadata || !typescript_1.default.isObjectLiteralExpression(metadata)) {
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
        return typescript_1.default.isMethodDeclaration(node) && !!node.modifiers &&
            node.modifiers.findIndex(m => m.kind === typescript_1.default.SyntaxKind.StaticKeyword) > -1 && !node.type;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbW9kdWxlLXdpdGgtcHJvdmlkZXJzL2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCw0REFBNEI7SUFFNUIsZ0ZBQTRFO0lBRTVFLHlGQUF1RDtJQWF2RDs7OztPQUlHO0lBQ0gsTUFBYSxTQUFTO1FBSXBCLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUg5QyxvQkFBZSxHQUF1QixFQUFFLENBQUM7WUFDekMsd0JBQW1CLEdBQTJCLEVBQUUsQ0FBQztRQUVBLENBQUM7UUFFbEQsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxvQkFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMvQixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbEM7aUJBQU0sSUFBSSxJQUFBLHNDQUErQixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ2xFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDckM7WUFFRCxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVPLHFCQUFxQixDQUFDLElBQXlCO1lBQ3JELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7Z0JBQy9DLE9BQU87YUFDUjtZQUVELE1BQU0sWUFBWSxHQUFHLElBQUEsb0NBQW9CLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDN0UsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDO1lBRTdFLElBQUksaUJBQWlCLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzthQUNuRDtRQUNILENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxJQUF5QixFQUFFLFNBQXNCO1lBQzNFLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2hELE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLG9CQUFFLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3hELE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO2dCQUN4QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQzVDLElBQUk7Z0JBQ0osU0FBUztnQkFDVCx3QkFBd0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQzthQUNwRSxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0Y7SUE1Q0QsOEJBNENDO0lBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFxQjtRQUNqRCxPQUFPLG9CQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTO1lBQ25ELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxvQkFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDL0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnMsIE5nRGVjb3JhdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19kZWNvcmF0b3JzJztcblxuaW1wb3J0IHtpc01vZHVsZVdpdGhQcm92aWRlcnNOb3RHZW5lcmljfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkTmdNb2R1bGUge1xuICBuYW1lOiBzdHJpbmc7XG4gIG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb247XG4gIGRlY29yYXRvcjogTmdEZWNvcmF0b3I7XG4gIC8qKlxuICAgKiBMaXN0IG9mIGZvdW5kIHN0YXRpYyBtZXRob2QgZGVjbGFyYXRpb25zIG9uIHRoZSBtb2R1bGUgd2hpY2ggZG8gbm90XG4gICAqIGRlY2xhcmUgYW4gZXhwbGljaXQgcmV0dXJuIHR5cGUuXG4gICAqL1xuICBzdGF0aWNNZXRob2RzV2l0aG91dFR5cGU6IHRzLk1ldGhvZERlY2xhcmF0aW9uW107XG59XG5cbi8qKlxuICogVmlzaXRvciB0aGF0IHdhbGtzIHRocm91Z2ggc3BlY2lmaWVkIFR5cGVTY3JpcHQgbm9kZXMgYW5kIGNvbGxlY3RzIGFsbFxuICogZm91bmQgTmdNb2R1bGUgc3RhdGljIG1ldGhvZHMgd2l0aG91dCB0eXBlcyBhbmQgYWxsIE1vZHVsZVdpdGhQcm92aWRlcnNcbiAqIHVzYWdlcyB3aXRob3V0IGdlbmVyaWMgdHlwZXMgYXR0YWNoZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb2xsZWN0b3Ige1xuICByZXNvbHZlZE1vZHVsZXM6IFJlc29sdmVkTmdNb2R1bGVbXSA9IFtdO1xuICByZXNvbHZlZE5vbkdlbmVyaWNzOiB0cy5UeXBlUmVmZXJlbmNlTm9kZVtdID0gW107XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgIHRoaXMudmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpO1xuICAgIH0gZWxzZSBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzTm90R2VuZXJpYyh0aGlzLnR5cGVDaGVja2VyLCBub2RlKSkge1xuICAgICAgdGhpcy5yZXNvbHZlZE5vbkdlbmVyaWNzLnB1c2gobm9kZSk7XG4gICAgfVxuXG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIG4gPT4gdGhpcy52aXNpdE5vZGUobikpO1xuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGlmICghbm9kZS5kZWNvcmF0b3JzIHx8ICFub2RlLmRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID0gZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKTtcbiAgICBjb25zdCBuZ01vZHVsZURlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdOZ01vZHVsZScpO1xuXG4gICAgaWYgKG5nTW9kdWxlRGVjb3JhdG9yKSB7XG4gICAgICB0aGlzLl92aXNpdE5nTW9kdWxlQ2xhc3Mobm9kZSwgbmdNb2R1bGVEZWNvcmF0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0TmdNb2R1bGVDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBkZWNvcmF0b3I6IE5nRGVjb3JhdG9yKSB7XG4gICAgY29uc3QgZGVjb3JhdG9yQ2FsbCA9IGRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgY29uc3QgbWV0YWRhdGEgPSBkZWNvcmF0b3JDYWxsLmFyZ3VtZW50c1swXTtcblxuICAgIGlmICghbWV0YWRhdGEgfHwgIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obWV0YWRhdGEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5yZXNvbHZlZE1vZHVsZXMucHVzaCh7XG4gICAgICBuYW1lOiBub2RlLm5hbWUgPyBub2RlLm5hbWUudGV4dCA6ICdkZWZhdWx0JyxcbiAgICAgIG5vZGUsXG4gICAgICBkZWNvcmF0b3IsXG4gICAgICBzdGF0aWNNZXRob2RzV2l0aG91dFR5cGU6IG5vZGUubWVtYmVycy5maWx0ZXIoaXNTdGF0aWNNZXRob2ROb1R5cGUpLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzU3RhdGljTWV0aG9kTm9UeXBlKG5vZGU6IHRzLkNsYXNzRWxlbWVudCk6IG5vZGUgaXMgdHMuTWV0aG9kRGVjbGFyYXRpb24ge1xuICByZXR1cm4gdHMuaXNNZXRob2REZWNsYXJhdGlvbihub2RlKSAmJiAhIW5vZGUubW9kaWZpZXJzICYmXG4gICAgICBub2RlLm1vZGlmaWVycy5maW5kSW5kZXgobSA9PiBtLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3RhdGljS2V5d29yZCkgPiAtMSAmJiAhbm9kZS50eXBlO1xufVxuIl19