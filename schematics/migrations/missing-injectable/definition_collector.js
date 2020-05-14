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
            const ngDecorators = ng_decorators_1.getAngularDecorators(this.typeChecker, node.decorators);
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
                .find(p => property_name_1.getPropertyNameText(p.name) === 'providers');
            const viewProvidersNode = metadata.properties.filter(ts.isPropertyAssignment)
                .find(p => property_name_1.getPropertyNameText(p.name) === 'viewProviders');
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
                .find(p => property_name_1.getPropertyNameText(p.name) === 'providers');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbl9jb2xsZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9taXNzaW5nLWluamVjdGFibGUvZGVmaW5pdGlvbl9jb2xsZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLGdGQUE0RTtJQUM1RSwyRkFBeUU7SUFpQnpFOzs7T0FHRztJQUNILE1BQWEscUJBQXFCO1FBSWhDLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUg5QyxvQkFBZSxHQUF1QixFQUFFLENBQUM7WUFDekMsdUJBQWtCLEdBQXdCLEVBQUUsQ0FBQztRQUVJLENBQUM7UUFFbEQsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNsQztZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxJQUF5QjtZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUMvQyxPQUFPO2FBQ1I7WUFFRCxNQUFNLFlBQVksR0FBRyxvQ0FBb0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3RSxNQUFNLGtCQUFrQixHQUNwQixZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxJQUFJLElBQUksV0FBVyxDQUFDLENBQUM7WUFDL0UsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDO1lBRTdFLElBQUksaUJBQWlCLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzthQUNuRDtpQkFBTSxJQUFJLGtCQUFrQixFQUFFO2dCQUM3QixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUM7YUFDckQ7UUFDSCxDQUFDO1FBRU8sb0JBQW9CLENBQUMsSUFBeUIsRUFBRSxTQUFzQjtZQUM1RSxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNoRCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTVDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxFQUFFLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3hELE9BQU87YUFDUjtZQUVELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQztpQkFDOUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsbUNBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLFdBQVcsQ0FBQyxDQUFDO1lBRWxGLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO2lCQUM5QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssZUFBZSxDQUFDLENBQUM7WUFFMUYsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQztnQkFDM0IsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUM1QyxJQUFJO2dCQUNKLFNBQVM7Z0JBQ1QsYUFBYSxFQUFFLGFBQWEsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQzdFLGlCQUFpQixFQUFFLGlCQUFpQixLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJO2FBQzFGLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxJQUF5QixFQUFFLFNBQXNCO1lBQzNFLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2hELE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDeEQsT0FBTzthQUNSO1lBRUQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO2lCQUM5QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssV0FBVyxDQUFDLENBQUM7WUFDbEYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDNUMsSUFBSTtnQkFDSixTQUFTO2dCQUNULGFBQWEsRUFBRSxhQUFhLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJO2FBQzlFLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRjtJQXZFRCxzREF1RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldEFuZ3VsYXJEZWNvcmF0b3JzLCBOZ0RlY29yYXRvcn0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZWROZ01vZHVsZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbjtcbiAgZGVjb3JhdG9yOiBOZ0RlY29yYXRvcjtcbiAgcHJvdmlkZXJzRXhwcjogdHMuRXhwcmVzc2lvbnxudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkRGlyZWN0aXZlIHtcbiAgbmFtZTogc3RyaW5nO1xuICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uO1xuICBkZWNvcmF0b3I6IE5nRGVjb3JhdG9yO1xuICBwcm92aWRlcnNFeHByOiB0cy5FeHByZXNzaW9ufG51bGw7XG4gIHZpZXdQcm92aWRlcnNFeHByOiB0cy5FeHByZXNzaW9ufG51bGw7XG59XG5cbi8qKlxuICogVmlzaXRvciB0aGF0IHdhbGtzIHRocm91Z2ggc3BlY2lmaWVkIFR5cGVTY3JpcHQgbm9kZXMgYW5kIGNvbGxlY3RzIGFsbFxuICogZm91bmQgTmdNb2R1bGUsIERpcmVjdGl2ZSBvciBDb21wb25lbnQgZGVmaW5pdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ0RlZmluaXRpb25Db2xsZWN0b3Ige1xuICByZXNvbHZlZE1vZHVsZXM6IFJlc29sdmVkTmdNb2R1bGVbXSA9IFtdO1xuICByZXNvbHZlZERpcmVjdGl2ZXM6IFJlc29sdmVkRGlyZWN0aXZlW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKSB7fVxuXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgdGhpcy52aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZSk7XG4gICAgfVxuXG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIG4gPT4gdGhpcy52aXNpdE5vZGUobikpO1xuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGlmICghbm9kZS5kZWNvcmF0b3JzIHx8ICFub2RlLmRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID0gZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWNvcmF0b3IgPVxuICAgICAgICBuZ0RlY29yYXRvcnMuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnQ29tcG9uZW50JyB8fCBuYW1lID09ICdEaXJlY3RpdmUnKTtcbiAgICBjb25zdCBuZ01vZHVsZURlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdOZ01vZHVsZScpO1xuXG4gICAgaWYgKG5nTW9kdWxlRGVjb3JhdG9yKSB7XG4gICAgICB0aGlzLl92aXNpdE5nTW9kdWxlQ2xhc3Mobm9kZSwgbmdNb2R1bGVEZWNvcmF0b3IpO1xuICAgIH0gZWxzZSBpZiAoZGlyZWN0aXZlRGVjb3JhdG9yKSB7XG4gICAgICB0aGlzLl92aXNpdERpcmVjdGl2ZUNsYXNzKG5vZGUsIGRpcmVjdGl2ZURlY29yYXRvcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdmlzaXREaXJlY3RpdmVDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBkZWNvcmF0b3I6IE5nRGVjb3JhdG9yKSB7XG4gICAgY29uc3QgZGVjb3JhdG9yQ2FsbCA9IGRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgY29uc3QgbWV0YWRhdGEgPSBkZWNvcmF0b3JDYWxsLmFyZ3VtZW50c1swXTtcblxuICAgIGlmICghbWV0YWRhdGEgfHwgIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obWV0YWRhdGEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJvdmlkZXJzTm9kZSA9IG1ldGFkYXRhLnByb3BlcnRpZXMuZmlsdGVyKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQocCA9PiBnZXRQcm9wZXJ0eU5hbWVUZXh0KHAubmFtZSkgPT09ICdwcm92aWRlcnMnKTtcblxuICAgIGNvbnN0IHZpZXdQcm92aWRlcnNOb2RlID0gbWV0YWRhdGEucHJvcGVydGllcy5maWx0ZXIodHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQocCA9PiBnZXRQcm9wZXJ0eU5hbWVUZXh0KHAubmFtZSkgPT09ICd2aWV3UHJvdmlkZXJzJyk7XG5cbiAgICB0aGlzLnJlc29sdmVkRGlyZWN0aXZlcy5wdXNoKHtcbiAgICAgIG5hbWU6IG5vZGUubmFtZSA/IG5vZGUubmFtZS50ZXh0IDogJ2RlZmF1bHQnLFxuICAgICAgbm9kZSxcbiAgICAgIGRlY29yYXRvcixcbiAgICAgIHByb3ZpZGVyc0V4cHI6IHByb3ZpZGVyc05vZGUgIT09IHVuZGVmaW5lZCA/IHByb3ZpZGVyc05vZGUuaW5pdGlhbGl6ZXIgOiBudWxsLFxuICAgICAgdmlld1Byb3ZpZGVyc0V4cHI6IHZpZXdQcm92aWRlcnNOb2RlICE9PSB1bmRlZmluZWQgPyB2aWV3UHJvdmlkZXJzTm9kZS5pbml0aWFsaXplciA6IG51bGwsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF92aXNpdE5nTW9kdWxlQ2xhc3Mobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgZGVjb3JhdG9yOiBOZ0RlY29yYXRvcikge1xuICAgIGNvbnN0IGRlY29yYXRvckNhbGwgPSBkZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gZGVjb3JhdG9yQ2FsbC5hcmd1bWVudHNbMF07XG5cbiAgICBpZiAoIW1ldGFkYXRhIHx8ICF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG1ldGFkYXRhKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3ZpZGVyc05vZGUgPSBtZXRhZGF0YS5wcm9wZXJ0aWVzLmZpbHRlcih0cy5pc1Byb3BlcnR5QXNzaWdubWVudClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKHAgPT4gZ2V0UHJvcGVydHlOYW1lVGV4dChwLm5hbWUpID09PSAncHJvdmlkZXJzJyk7XG4gICAgdGhpcy5yZXNvbHZlZE1vZHVsZXMucHVzaCh7XG4gICAgICBuYW1lOiBub2RlLm5hbWUgPyBub2RlLm5hbWUudGV4dCA6ICdkZWZhdWx0JyxcbiAgICAgIG5vZGUsXG4gICAgICBkZWNvcmF0b3IsXG4gICAgICBwcm92aWRlcnNFeHByOiBwcm92aWRlcnNOb2RlICE9PSB1bmRlZmluZWQgPyBwcm92aWRlcnNOb2RlLmluaXRpYWxpemVyIDogbnVsbCxcbiAgICB9KTtcbiAgfVxufVxuIl19