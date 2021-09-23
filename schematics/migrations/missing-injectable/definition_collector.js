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
        define("@angular/core/schematics/migrations/missing-injectable/definition_collector", ["require", "exports", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NgDefinitionCollector = void 0;
    const ts = require("typescript");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    /**
     * Visitor that walks through specified TypeScript nodes and collects all
     * found NgModule, Directive or Component definitions.
     */
    class NgDefinitionCollector {
        constructor(typeChecker) {
            this.typeChecker = typeChecker;
            this.resolvedModules = [];
            this.resolvedDirectives = [];
        }
        visitNode(node) {
            if (ts.isClassDeclaration(node)) {
                this.visitClassDeclaration(node);
            }
            ts.forEachChild(node, n => this.visitNode(n));
        }
        visitClassDeclaration(node) {
            if (!node.decorators || !node.decorators.length) {
                return;
            }
            const ngDecorators = (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, node.decorators);
            const directiveDecorator = ngDecorators.find(({ name }) => name === 'Component' || name == 'Directive');
            const ngModuleDecorator = ngDecorators.find(({ name }) => name === 'NgModule');
            if (ngModuleDecorator) {
                this._visitNgModuleClass(node, ngModuleDecorator);
            }
            else if (directiveDecorator) {
                this._visitDirectiveClass(node, directiveDecorator);
            }
        }
        _visitDirectiveClass(node, decorator) {
            const decoratorCall = decorator.node.expression;
            const metadata = decoratorCall.arguments[0];
            if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
                return;
            }
            const providersNode = metadata.properties.filter(ts.isPropertyAssignment)
                .find(p => (0, property_name_1.getPropertyNameText)(p.name) === 'providers');
            const viewProvidersNode = metadata.properties.filter(ts.isPropertyAssignment)
                .find(p => (0, property_name_1.getPropertyNameText)(p.name) === 'viewProviders');
            this.resolvedDirectives.push({
                name: node.name ? node.name.text : 'default',
                node,
                decorator,
                providersExpr: providersNode !== undefined ? providersNode.initializer : null,
                viewProvidersExpr: viewProvidersNode !== undefined ? viewProvidersNode.initializer : null,
            });
        }
        _visitNgModuleClass(node, decorator) {
            const decoratorCall = decorator.node.expression;
            const metadata = decoratorCall.arguments[0];
            if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
                return;
            }
            const providersNode = metadata.properties.filter(ts.isPropertyAssignment)
                .find(p => (0, property_name_1.getPropertyNameText)(p.name) === 'providers');
            this.resolvedModules.push({
                name: node.name ? node.name.text : 'default',
                node,
                decorator,
                providersExpr: providersNode !== undefined ? providersNode.initializer : null,
            });
        }
    }
    exports.NgDefinitionCollector = NgDefinitionCollector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbl9jb2xsZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9taXNzaW5nLWluamVjdGFibGUvZGVmaW5pdGlvbl9jb2xsZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLGdGQUE0RTtJQUM1RSwyRkFBeUU7SUFpQnpFOzs7T0FHRztJQUNILE1BQWEscUJBQXFCO1FBSWhDLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUg5QyxvQkFBZSxHQUF1QixFQUFFLENBQUM7WUFDekMsdUJBQWtCLEdBQXdCLEVBQUUsQ0FBQztRQUVJLENBQUM7UUFFbEQsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNsQztZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxJQUF5QjtZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUMvQyxPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFBLG9DQUFvQixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sa0JBQWtCLEdBQ3BCLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBQyxFQUFFLEVB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QUFFLGFBQWEsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUk7YUFDOUUsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGO0lBdkVELHNEQXVFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9ycywgTmdEZWNvcmF0b3J9IGZyb20gJy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkTmdNb2R1bGUge1xuICBuYW1lOiBzdHJpbmc7XG4gIG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb247XG4gIGRlY29yYXRvcjogTmdEZWNvcmF0b3I7XG4gIHByb3ZpZGVyc0V4cHI6IHRzLkV4cHJlc3Npb258bnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZERpcmVjdGl2ZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbjtcbiAgZGVjb3JhdG9yOiBOZ0RlY29yYXRvcjtcbiAgcHJvdmlkZXJzRXhwcjogdHMuRXhwcmVzc2lvbnxudWxsO1xuICB2aWV3UHJvdmlkZXJzRXhwcjogdHMuRXhwcmVzc2lvbnxudWxsO1xufVxuXG4vKipcbiAqIFZpc2l0b3IgdGhhdCB3YWxrcyB0aHJvdWdoIHNwZWNpZmllZCBUeXBlU2NyaXB0IG5vZGVzIGFuZCBjb2xsZWN0cyBhbGxcbiAqIGZvdW5kIE5nTW9kdWxlLCBEaXJlY3RpdmUgb3IgQ29tcG9uZW50IGRlZmluaXRpb25zLlxuICovXG5leHBvcnQgY2xhc3MgTmdEZWZpbml0aW9uQ29sbGVjdG9yIHtcbiAgcmVzb2x2ZWRNb2R1bGVzOiBSZXNvbHZlZE5nTW9kdWxlW10gPSBbXTtcbiAgcmVzb2x2ZWREaXJlY3RpdmVzOiBSZXNvbHZlZERpcmVjdGl2ZVtdID0gW107XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgIHRoaXMudmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpO1xuICAgIH1cblxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCBuID0+IHRoaXMudmlzaXROb2RlKG4pKTtcbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICBpZiAoIW5vZGUuZGVjb3JhdG9ycyB8fCAhbm9kZS5kZWNvcmF0b3JzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5nRGVjb3JhdG9ycyA9IGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuZGVjb3JhdG9ycyk7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVjb3JhdG9yID1cbiAgICAgICAgbmdEZWNvcmF0b3JzLmZpbmQoKHtuYW1lfSkgPT4gbmFtZSA9PT0gJ0NvbXBvbmVudCcgfHwgbmFtZSA9PSAnRGlyZWN0aXZlJyk7XG4gICAgY29uc3QgbmdNb2R1bGVEZWNvcmF0b3IgPSBuZ0RlY29yYXRvcnMuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnTmdNb2R1bGUnKTtcblxuICAgIGlmIChuZ01vZHVsZURlY29yYXRvcikge1xuICAgICAgdGhpcy5fdmlzaXROZ01vZHVsZUNsYXNzKG5vZGUsIG5nTW9kdWxlRGVjb3JhdG9yKTtcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGl2ZURlY29yYXRvcikge1xuICAgICAgdGhpcy5fdmlzaXREaXJlY3RpdmVDbGFzcyhub2RlLCBkaXJlY3RpdmVEZWNvcmF0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3Zpc2l0RGlyZWN0aXZlQ2xhc3Mobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgZGVjb3JhdG9yOiBOZ0RlY29yYXRvcikge1xuICAgIGNvbnN0IGRlY29yYXRvckNhbGwgPSBkZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHNbMF07XG5cbiAgICBpZiAoIW1ldGFkYXRhIHx8ICF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG1ldGFkYXRhKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3ZpZGVyc05vZGUgPSBtZXRhZGF0YS5wcm9wZXJ0aWVzLmZpbHRlcih0cy5pc1Byb3BlcnR5QXNzaWdubWVudClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKHAgPT4gZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAncHJvdmlkZXJzJyk7XG5cbiAgICBjb25zdCB2aWV3UHJvdmlkZXJzTm9kZSA9IG1ldGFkYXRhLnByb3BlcnRpZXMuZmlsdGVyKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKHAgPT4gZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAndmlld1Byb3ZpZGVycycpO1xuXG4gICAgdGhpcy5yZXNvbHZlZERpcmVjdGl2ZXMucHVzaCh7XG4gICAgICBuYW1lOiBub2RlLm5hbWUgPyBub2RlLm5hbWUudGV4dCA6ICdkZWZhdWx0JyxcbiAgICAgIG5vZGUsXG4gICAgICBkZWNvcmF0b3IsXG4gICAgICBwcm92aWRlcnNFeHByOiBwcm92aWRlcnNOb2RlICE9PSB1bmRlZmluZWQgPyBwcm92aWRlcnNOb2RlLmluaXRpYWxpemVyIDogbnVsbCxcbiAgICAgIHZpZXdQcm92aWRlcnNFeHByOiB2aWV3UHJvdmlkZXJzTm9kZSAhPT0gdW5kZWZpbmVkID8gdmlld1Byb3ZpZGVyc05vZGUuaW5pdGlhbGl6ZXIgOiBudWxsLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfdmlzaXROZ01vZHVsZUNsYXNzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIGRlY29yYXRvcjogTmdEZWNvcmF0b3IpIHtcbiAgICBjb25zdCBkZWNvcmF0b3JDYWxsID0gZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcbiAgICBjb25zdCBtZXRhZGF0YSA9IGRlY29yYXRvckNhbGwuYXJndW1lbnRzWzBdO1xuXG4gICAgaWYgKCFtZXRhZGF0YSB8fCAhdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihtZXRhZGF0YSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnNOb2RlID0gbWV0YWRhdGEucHJvcGVydGllcy5maWx0ZXIodHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZChwID0+IGdldFByb3BlcnR5TmFtZVRleHQocC5uYW1lKSA9PT0gJ3Byb3ZpZGVycycpO1xuICAgIHRoaXMucmVzb2x2ZWRNb2R1bGVzLnB1c2goe1xuICAgICAgbmFtZTogbm9kZS5uYW1lID8gbm9kZS5uYW1lLnRleHQgOiAnZGVmYXVsdCcsXG4gICAgICBub2RlLFxuICAgICAgZGVjb3JhdG9yLFxuICAgICAgcHJvdmlkZXJzRXhwcjogcHJvdmlkZXJzTm9kZSAhPT0gdW5kZWZpbmVkID8gcHJvdmlkZXJzTm9kZS5pbml0aWFsaXplciA6IG51bGwsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==