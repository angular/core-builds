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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector", ["require", "exports", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getNgClassDecorators = exports.hasNgDeclarationDecorator = exports.hasInjectableDecorator = exports.hasDirectiveDecorator = exports.NgDeclarationCollector = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    /**
     * Visitor that walks through specified TypeScript nodes and collects all defined
     * directives and provider classes. Directives are separated by decorated and
     * undecorated directives.
     */
    class NgDeclarationCollector {
        constructor(typeChecker, compilerCliMigrationsModule) {
            this.typeChecker = typeChecker;
            this.compilerCliMigrationsModule = compilerCliMigrationsModule;
            /** List of resolved directives which are decorated. */
            this.decoratedDirectives = [];
            /** List of resolved providers which are decorated. */
            this.decoratedProviders = [];
            /** Set of resolved Angular declarations which are not decorated. */
            this.undecoratedDeclarations = new Set();
            this.evaluator = new compilerCliMigrationsModule.PartialEvaluator(new compilerCliMigrationsModule.TypeScriptReflectionHost(typeChecker), typeChecker, 
            /* dependencyTracker */ null);
        }
        visitNode(node) {
            if (typescript_1.default.isClassDeclaration(node)) {
                this._visitClassDeclaration(node);
            }
            typescript_1.default.forEachChild(node, n => this.visitNode(n));
        }
        _visitClassDeclaration(node) {
            if (!node.decorators || !node.decorators.length) {
                return;
            }
            const ngDecorators = (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, node.decorators);
            const ngModuleDecorator = ngDecorators.find(({ name }) => name === 'NgModule');
            if (hasDirectiveDecorator(node, this.typeChecker, ngDecorators)) {
                this.decoratedDirectives.push(node);
            }
            else if (hasInjectableDecorator(node, this.typeChecker, ngDecorators)) {
                this.decoratedProviders.push(node);
            }
            else if (ngModuleDecorator) {
                this._visitNgModuleDecorator(ngModuleDecorator);
            }
        }
        _visitNgModuleDecorator(decorator) {
            const decoratorCall = decorator.node.expression;
            const metadata = decoratorCall.arguments[0];
            if (!metadata || !typescript_1.default.isObjectLiteralExpression(metadata)) {
                return;
            }
            let entryComponentsNode = null;
            let declarationsNode = null;
            metadata.properties.forEach(p => {
                if (!typescript_1.default.isPropertyAssignment(p)) {
                    return;
                }
                const name = (0, property_name_1.getPropertyNameText)(p.name);
                if (name === 'entryComponents') {
                    entryComponentsNode = p.initializer;
                }
                else if (name === 'declarations') {
                    declarationsNode = p.initializer;
                }
            });
            const values = [];
            // In case the module specifies the "entryComponents" field, walk through all
            // resolved entry components and collect the referenced directives.
            if (entryComponentsNode) {
                values.push(this.evaluator.evaluate(entryComponentsNode));
            }
            // In case the module specifies the "declarations" field, walk through all
            // resolved declarations and collect the referenced directives.
            if (declarationsNode) {
                values.push(this.evaluator.evaluate(declarationsNode));
            }
            // Flatten values and analyze references
            for (const value of values.flat(Infinity)) {
                if (value instanceof this.compilerCliMigrationsModule.Reference &&
                    typescript_1.default.isClassDeclaration(value.node) &&
                    !hasNgDeclarationDecorator(value.node, this.typeChecker)) {
                    this.undecoratedDeclarations.add(value.node);
                }
            }
        }
    }
    exports.NgDeclarationCollector = NgDeclarationCollector;
    /** Checks whether the given node has the "@Directive" or "@Component" decorator set. */
    function hasDirectiveDecorator(node, typeChecker, ngDecorators) {
        return (ngDecorators || getNgClassDecorators(node, typeChecker))
            .some(({ name }) => name === 'Directive' || name === 'Component');
    }
    exports.hasDirectiveDecorator = hasDirectiveDecorator;
    /** Checks whether the given node has the "@Injectable" decorator set. */
    function hasInjectableDecorator(node, typeChecker, ngDecorators) {
        return (ngDecorators || getNgClassDecorators(node, typeChecker))
            .some(({ name }) => name === 'Injectable');
    }
    exports.hasInjectableDecorator = hasInjectableDecorator;
    /** Whether the given node has an explicit decorator that describes an Angular declaration. */
    function hasNgDeclarationDecorator(node, typeChecker) {
        return getNgClassDecorators(node, typeChecker)
            .some(({ name }) => name === 'Component' || name === 'Directive' || name === 'Pipe');
    }
    exports.hasNgDeclarationDecorator = hasNgDeclarationDecorator;
    /** Gets all Angular decorators of a given class declaration. */
    function getNgClassDecorators(node, typeChecker) {
        if (!node.decorators) {
            return [];
        }
        return (0, ng_decorators_1.getAngularDecorators)(typeChecker, node.decorators);
    }
    exports.getNgClassDecorators = getNgClassDecorators;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfZGVjbGFyYXRpb25fY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL25nX2RlY2xhcmF0aW9uX2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCw0REFBNEI7SUFFNUIsZ0ZBQTRFO0lBQzVFLDJGQUF5RTtJQUd6RTs7OztPQUlHO0lBQ0gsTUFBYSxzQkFBc0I7UUFZakMsWUFDVyxXQUEyQixFQUMxQiwyQkFDcUQ7WUFGdEQsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQzFCLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FDMEI7WUFkakUsdURBQXVEO1lBQ3ZELHdCQUFtQixHQUEwQixFQUFFLENBQUM7WUFFaEQsc0RBQXNEO1lBQ3RELHVCQUFrQixHQUEwQixFQUFFLENBQUM7WUFFL0Msb0VBQW9FO1lBQ3BFLDRCQUF1QixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBUXZELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSwyQkFBMkIsQ0FBQyxnQkFBZ0IsQ0FDN0QsSUFBSSwyQkFBMkIsQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsRUFBRSxXQUFXO1lBQ2xGLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxTQUFTLENBQUMsSUFBYTtZQUNyQixJQUFJLG9CQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNuQztZQUVELG9CQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENB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QUEyQjtRQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsT0FBTyxJQUFBLG9DQUFvQixFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQU5ELG9EQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9ycywgTmdEZWNvcmF0b3J9IGZyb20gJy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG5cbi8qKlxuICogVmlzaXRvciB0aGF0IHdhbGtzIHRocm91Z2ggc3BlY2lmaWVkIFR5cGVTY3JpcHQgbm9kZXMgYW5kIGNvbGxlY3RzIGFsbCBkZWZpbmVkXG4gKiBkaXJlY3RpdmVzIGFuZCBwcm92aWRlciBjbGFzc2VzLiBEaXJlY3RpdmVzIGFyZSBzZXBhcmF0ZWQgYnkgZGVjb3JhdGVkIGFuZFxuICogdW5kZWNvcmF0ZWQgZGlyZWN0aXZlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIE5nRGVjbGFyYXRpb25Db2xsZWN0b3Ige1xuICAvKiogTGlzdCBvZiByZXNvbHZlZCBkaXJlY3RpdmVzIHdoaWNoIGFyZSBkZWNvcmF0ZWQuICovXG4gIGRlY29yYXRlZERpcmVjdGl2ZXM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXSA9IFtdO1xuXG4gIC8qKiBMaXN0IG9mIHJlc29sdmVkIHByb3ZpZGVycyB3aGljaCBhcmUgZGVjb3JhdGVkLiAqL1xuICBkZWNvcmF0ZWRQcm92aWRlcnM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXSA9IFtdO1xuXG4gIC8qKiBTZXQgb2YgcmVzb2x2ZWQgQW5ndWxhciBkZWNsYXJhdGlvbnMgd2hpY2ggYXJlIG5vdCBkZWNvcmF0ZWQuICovXG4gIHVuZGVjb3JhdGVkRGVjbGFyYXRpb25zID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuXG4gIHByaXZhdGUgZXZhbHVhdG9yO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICAgIHByaXZhdGUgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlOlxuICAgICAgICAgIHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9wcml2YXRlL21pZ3JhdGlvbnMnKSkge1xuICAgIHRoaXMuZXZhbHVhdG9yID0gbmV3IGNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZS5QYXJ0aWFsRXZhbHVhdG9yKFxuICAgICAgICBuZXcgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlLlR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdCh0eXBlQ2hlY2tlciksIHR5cGVDaGVja2VyLFxuICAgICAgICAvKiBkZXBlbmRlbmN5VHJhY2tlciAqLyBudWxsKTtcbiAgfVxuXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgdGhpcy5fdmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpO1xuICAgIH1cblxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCBuID0+IHRoaXMudmlzaXROb2RlKG4pKTtcbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgaWYgKCFub2RlLmRlY29yYXRvcnMgfHwgIW5vZGUuZGVjb3JhdG9ycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpO1xuICAgIGNvbnN0IG5nTW9kdWxlRGVjb3JhdG9yID0gbmdEZWNvcmF0b3JzLmZpbmQoKHtuYW1lfSkgPT4gbmFtZSA9PT0gJ05nTW9kdWxlJyk7XG5cbiAgICBpZiAoaGFzRGlyZWN0aXZlRGVjb3JhdG9yKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIsIG5nRGVjb3JhdG9ycykpIHtcbiAgICAgIHRoaXMuZGVjb3JhdGVkRGlyZWN0aXZlcy5wdXNoKG5vZGUpO1xuICAgIH0gZWxzZSBpZiAoaGFzSW5qZWN0YWJsZURlY29yYXRvcihub2RlLCB0aGlzLnR5cGVDaGVja2VyLCBuZ0RlY29yYXRvcnMpKSB7XG4gICAgICB0aGlzLmRlY29yYXRlZFByb3ZpZGVycy5wdXNoKG5vZGUpO1xuICAgIH0gZWxzZSBpZiAobmdNb2R1bGVEZWNvcmF0b3IpIHtcbiAgICAgIHRoaXMuX3Zpc2l0TmdNb2R1bGVEZWNvcmF0b3IobmdNb2R1bGVEZWNvcmF0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0TmdNb2R1bGVEZWNvcmF0b3IoZGVjb3JhdG9yOiBOZ0RlY29yYXRvcikge1xuICAgIGNvbnN0IGRlY29yYXRvckNhbGwgPSBkZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHNbMF07XG5cbiAgICBpZiAoIW1ldGFkYXRhIHx8ICF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG1ldGFkYXRhKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBlbnRyeUNvbXBvbmVudHNOb2RlOiB0cy5FeHByZXNzaW9ufG51bGwgPSBudWxsO1xuICAgIGxldCBkZWNsYXJhdGlvbnNOb2RlOiB0cy5FeHByZXNzaW9ufG51bGwgPSBudWxsO1xuXG4gICAgbWV0YWRhdGEucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKCF0cy5pc1Byb3BlcnR5QXNzaWdubWVudChwKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5hbWUgPSBnZXRQcm9wZXJ0eU5hbWVUZXh0KHAubmFtZSk7XG5cbiAgICAgIGlmIChuYW1lID09PSAnZW50cnlDb21wb25lbnRzJykge1xuICAgICAgICBlbnRyeUNvbXBvbmVudHNOb2RlID0gcC5pbml0aWFsaXplcjtcbiAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gJ2RlY2xhcmF0aW9ucycpIHtcbiAgICAgICAgZGVjbGFyYXRpb25zTm9kZSA9IHAuaW5pdGlhbGl6ZXI7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCB2YWx1ZXMgPSBbXTtcblxuICAgIC8vIEluIGNhc2UgdGhlIG1vZHVsZSBzcGVjaWZpZXMgdGhlIFwiZW50cnlDb21wb25lbnRzXCIgZmllbGQsIHdhbGsgdGhyb3VnaCBhbGxcbiAgICAvLyByZXNvbHZlZCBlbnRyeSBjb21wb25lbnRzIGFuZCBjb2xsZWN0IHRoZSByZWZlcmVuY2VkIGRpcmVjdGl2ZXMuXG4gICAgaWYgKGVudHJ5Q29tcG9uZW50c05vZGUpIHtcbiAgICAgIHZhbHVlcy5wdXNoKHRoaXMuZXZhbHVhdG9yLmV2YWx1YXRlKGVudHJ5Q29tcG9uZW50c05vZGUpKTtcbiAgICB9XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBtb2R1bGUgc3BlY2lmaWVzIHRoZSBcImRlY2xhcmF0aW9uc1wiIGZpZWxkLCB3YWxrIHRocm91Z2ggYWxsXG4gICAgLy8gcmVzb2x2ZWQgZGVjbGFyYXRpb25zIGFuZCBjb2xsZWN0IHRoZSByZWZlcmVuY2VkIGRpcmVjdGl2ZXMuXG4gICAgaWYgKGRlY2xhcmF0aW9uc05vZGUpIHtcbiAgICAgIHZhbHVlcy5wdXNoKHRoaXMuZXZhbHVhdG9yLmV2YWx1YXRlKGRlY2xhcmF0aW9uc05vZGUpKTtcbiAgICB9XG5cbiAgICAvLyBGbGF0dGVuIHZhbHVlcyBhbmQgYW5hbHl6ZSByZWZlcmVuY2VzXG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiB2YWx1ZXMuZmxhdChJbmZpbml0eSkpIHtcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHRoaXMuY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlLlJlZmVyZW5jZSAmJlxuICAgICAgICAgIHRzLmlzQ2xhc3NEZWNsYXJhdGlvbih2YWx1ZS5ub2RlKSAmJlxuICAgICAgICAgICFoYXNOZ0RlY2xhcmF0aW9uRGVjb3JhdG9yKHZhbHVlLm5vZGUsIHRoaXMudHlwZUNoZWNrZXIpKSB7XG4gICAgICAgIHRoaXMudW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMuYWRkKHZhbHVlLm5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIG5vZGUgaGFzIHRoZSBcIkBEaXJlY3RpdmVcIiBvciBcIkBDb21wb25lbnRcIiBkZWNvcmF0b3Igc2V0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc0RpcmVjdGl2ZURlY29yYXRvcihcbiAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIG5nRGVjb3JhdG9ycz86IE5nRGVjb3JhdG9yW10pOiBib29sZWFuIHtcbiAgcmV0dXJuIChuZ0RlY29yYXRvcnMgfHwgZ2V0TmdDbGFzc0RlY29yYXRvcnMobm9kZSwgdHlwZUNoZWNrZXIpKVxuICAgICAgLnNvbWUoKHtuYW1lfSkgPT4gbmFtZSA9PT0gJ0RpcmVjdGl2ZScgfHwgbmFtZSA9PT0gJ0NvbXBvbmVudCcpO1xufVxuXG5cblxuLyoqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBub2RlIGhhcyB0aGUgXCJASW5qZWN0YWJsZVwiIGRlY29yYXRvciBzZXQuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzSW5qZWN0YWJsZURlY29yYXRvcihcbiAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIG5nRGVjb3JhdG9ycz86IE5nRGVjb3JhdG9yW10pOiBib29sZWFuIHtcbiAgcmV0dXJuIChuZ0RlY29yYXRvcnMgfHwgZ2V0TmdDbGFzc0RlY29yYXRvcnMobm9kZSwgdHlwZUNoZWNrZXIpKVxuICAgICAgLnNvbWUoKHtuYW1lfSkgPT4gbmFtZSA9PT0gJ0luamVjdGFibGUnKTtcbn1cbi8qKiBXaGV0aGVyIHRoZSBnaXZlbiBub2RlIGhhcyBhbiBleHBsaWNpdCBkZWNvcmF0b3IgdGhhdCBkZXNjcmliZXMgYW4gQW5ndWxhciBkZWNsYXJhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNOZ0RlY2xhcmF0aW9uRGVjb3JhdG9yKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge1xuICByZXR1cm4gZ2V0TmdDbGFzc0RlY29yYXRvcnMobm9kZSwgdHlwZUNoZWNrZXIpXG4gICAgICAuc29tZSgoe25hbWV9KSA9PiBuYW1lID09PSAnQ29tcG9uZW50JyB8fCBuYW1lID09PSAnRGlyZWN0aXZlJyB8fCBuYW1lID09PSAnUGlwZScpO1xufVxuXG4vKiogR2V0cyBhbGwgQW5ndWxhciBkZWNvcmF0b3JzIG9mIGEgZ2l2ZW4gY2xhc3MgZGVjbGFyYXRpb24uICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmdDbGFzc0RlY29yYXRvcnMoXG4gICAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogTmdEZWNvcmF0b3JbXSB7XG4gIGlmICghbm9kZS5kZWNvcmF0b3JzKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKTtcbn1cbiJdfQ==