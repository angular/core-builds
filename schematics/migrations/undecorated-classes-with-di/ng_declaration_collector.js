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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector", ["require", "exports", "@angular/compiler-cli/private/migrations", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getNgClassDecorators = exports.hasNgDeclarationDecorator = exports.hasInjectableDecorator = exports.hasDirectiveDecorator = exports.NgDeclarationCollector = void 0;
    const migrations_1 = require("@angular/compiler-cli/private/migrations");
    const typescript_1 = __importDefault(require("typescript"));
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    /**
     * Visitor that walks through specified TypeScript nodes and collects all defined
     * directives and provider classes. Directives are separated by decorated and
     * undecorated directives.
     */
    class NgDeclarationCollector {
        constructor(typeChecker, evaluator) {
            this.typeChecker = typeChecker;
            this.evaluator = evaluator;
            /** List of resolved directives which are decorated. */
            this.decoratedDirectives = [];
            /** List of resolved providers which are decorated. */
            this.decoratedProviders = [];
            /** Set of resolved Angular declarations which are not decorated. */
            this.undecoratedDeclarations = new Set();
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
            // In case the module specifies the "entryComponents" field, walk through all
            // resolved entry components and collect the referenced directives.
            if (entryComponentsNode) {
                flattenTypeList(this.evaluator.evaluate(entryComponentsNode)).forEach(ref => {
                    if (typescript_1.default.isClassDeclaration(ref.node) &&
                        !hasNgDeclarationDecorator(ref.node, this.typeChecker)) {
                        this.undecoratedDeclarations.add(ref.node);
                    }
                });
            }
            // In case the module specifies the "declarations" field, walk through all
            // resolved declarations and collect the referenced directives.
            if (declarationsNode) {
                flattenTypeList(this.evaluator.evaluate(declarationsNode)).forEach(ref => {
                    if (typescript_1.default.isClassDeclaration(ref.node) &&
                        !hasNgDeclarationDecorator(ref.node, this.typeChecker)) {
                        this.undecoratedDeclarations.add(ref.node);
                    }
                });
            }
        }
    }
    exports.NgDeclarationCollector = NgDeclarationCollector;
    /** Flattens a list of type references. */
    function flattenTypeList(value) {
        if (Array.isArray(value)) {
            return value.reduce((res, v) => res.concat(flattenTypeList(v)), []);
        }
        else if (value instanceof migrations_1.Reference) {
            return [value];
        }
        return [];
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfZGVjbGFyYXRpb25fY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL25nX2RlY2xhcmF0aW9uX2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCx5RUFBb0c7SUFDcEcsNERBQTRCO0lBRTVCLGdGQUE0RTtJQUM1RSwyRkFBeUU7SUFHekU7Ozs7T0FJRztJQUNILE1BQWEsc0JBQXNCO1FBVWpDLFlBQW1CLFdBQTJCLEVBQVUsU0FBMkI7WUFBaEUsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQVUsY0FBUyxHQUFULFNBQVMsQ0FBa0I7WUFUbkYsdURBQXVEO1lBQ3ZELHdCQUFtQixHQUEwQixFQUFFLENBQUM7WUFFaEQsc0RBQXNEO1lBQ3RELHVCQUFrQixHQUEwQixFQUFFLENBQUM7WUFFL0Msb0VBQW9FO1lBQ3BFLDRCQUF1QixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1FBRTZCLENBQUM7UUFFdkYsU0FBUyxDQUFDLElBQWE7WUFDckIsSUFBSSxvQkFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMvQixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbkM7WUFFRCxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVPLHNCQUFzQixDQUFDLElBQXlCO1lBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7Z0JBQy9DLE9BQU87YUFDUjtZ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SUFDL0MsQ0FBQztJQUpELHdEQUlDO0lBQ0QsOEZBQThGO0lBQzlGLFNBQWdCLHlCQUF5QixDQUFDLElBQXlCLEVBQUUsV0FBMkI7UUFDOUYsT0FBTyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDO2FBQ3pDLElBQUksQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLFdBQVcsSUFBSSxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUM7SUFDekYsQ0FBQztJQUhELDhEQUdDO0lBRUQsZ0VBQWdFO0lBQ2hFLFNBQWdCLG9CQUFvQixDQUNoQyxJQUF5QixFQUFFLFdBQTJCO1FBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BCLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxPQUFPLElBQUEsb0NBQW9CLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBTkQsb0RBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQYXJ0aWFsRXZhbHVhdG9yLCBSZWZlcmVuY2UsIFJlc29sdmVkVmFsdWV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9wcml2YXRlL21pZ3JhdGlvbnMnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldEFuZ3VsYXJEZWNvcmF0b3JzLCBOZ0RlY29yYXRvcn0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5cblxuLyoqXG4gKiBWaXNpdG9yIHRoYXQgd2Fsa3MgdGhyb3VnaCBzcGVjaWZpZWQgVHlwZVNjcmlwdCBub2RlcyBhbmQgY29sbGVjdHMgYWxsIGRlZmluZWRcbiAqIGRpcmVjdGl2ZXMgYW5kIHByb3ZpZGVyIGNsYXNzZXMuIERpcmVjdGl2ZXMgYXJlIHNlcGFyYXRlZCBieSBkZWNvcmF0ZWQgYW5kXG4gKiB1bmRlY29yYXRlZCBkaXJlY3RpdmVzLlxuICovXG5leHBvcnQgY2xhc3MgTmdEZWNsYXJhdGlvbkNvbGxlY3RvciB7XG4gIC8qKiBMaXN0IG9mIHJlc29sdmVkIGRpcmVjdGl2ZXMgd2hpY2ggYXJlIGRlY29yYXRlZC4gKi9cbiAgZGVjb3JhdGVkRGlyZWN0aXZlczogdHMuQ2xhc3NEZWNsYXJhdGlvbltdID0gW107XG5cbiAgLyoqIExpc3Qgb2YgcmVzb2x2ZWQgcHJvdmlkZXJzIHdoaWNoIGFyZSBkZWNvcmF0ZWQuICovXG4gIGRlY29yYXRlZFByb3ZpZGVyczogdHMuQ2xhc3NEZWNsYXJhdGlvbltdID0gW107XG5cbiAgLyoqIFNldCBvZiByZXNvbHZlZCBBbmd1bGFyIGRlY2xhcmF0aW9ucyB3aGljaCBhcmUgbm90IGRlY29yYXRlZC4gKi9cbiAgdW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgcHJpdmF0ZSBldmFsdWF0b3I6IFBhcnRpYWxFdmFsdWF0b3IpIHt9XG5cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAodHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICB0aGlzLl92aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZSk7XG4gICAgfVxuXG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIG4gPT4gdGhpcy52aXNpdE5vZGUobikpO1xuICB9XG5cbiAgcHJpdmF0ZSBfdmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICBpZiAoIW5vZGUuZGVjb3JhdG9ycyB8fCAhbm9kZS5kZWNvcmF0b3JzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5nRGVjb3JhdG9ycyA9IGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuZGVjb3JhdG9ycyk7XG4gICAgY29uc3QgbmdNb2R1bGVEZWNvcmF0b3IgPSBuZ0RlY29yYXRvcnMuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnTmdNb2R1bGUnKTtcblxuICAgIGlmIChoYXNEaXJlY3RpdmVEZWNvcmF0b3Iobm9kZSwgdGhpcy50eXBlQ2hlY2tlciwgbmdEZWNvcmF0b3JzKSkge1xuICAgICAgdGhpcy5kZWNvcmF0ZWREaXJlY3RpdmVzLnB1c2gobm9kZSk7XG4gICAgfSBlbHNlIGlmIChoYXNJbmplY3RhYmxlRGVjb3JhdG9yKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIsIG5nRGVjb3JhdG9ycykpIHtcbiAgICAgIHRoaXMuZGVjb3JhdGVkUHJvdmlkZXJzLnB1c2gobm9kZSk7XG4gICAgfSBlbHNlIGlmIChuZ01vZHVsZURlY29yYXRvcikge1xuICAgICAgdGhpcy5fdmlzaXROZ01vZHVsZURlY29yYXRvcihuZ01vZHVsZURlY29yYXRvcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdmlzaXROZ01vZHVsZURlY29yYXRvcihkZWNvcmF0b3I6IE5nRGVjb3JhdG9yKSB7XG4gICAgY29uc3QgZGVjb3JhdG9yQ2FsbCA9IGRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgY29uc3QgbWV0YWRhdGEgPSBkZWNvcmF0b3JDYWxsLmFyZ3VtZW50c1swXTtcblxuICAgIGlmICghbWV0YWRhdGEgfHwgIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obWV0YWRhdGEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGVudHJ5Q29tcG9uZW50c05vZGU6IHRzLkV4cHJlc3Npb258bnVsbCA9IG51bGw7XG4gICAgbGV0IGRlY2xhcmF0aW9uc05vZGU6IHRzLkV4cHJlc3Npb258bnVsbCA9IG51bGw7XG5cbiAgICBtZXRhZGF0YS5wcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAoIXRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHApKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmFtZSA9IGdldFByb3BlcnR5TmFtZVRleHQocC5uYW1lKTtcblxuICAgICAgaWYgKG5hbWUgPT09ICdlbnRyeUNvbXBvbmVudHMnKSB7XG4gICAgICAgIGVudHJ5Q29tcG9uZW50c05vZGUgPSBwLmluaXRpYWxpemVyO1xuICAgICAgfSBlbHNlIGlmIChuYW1lID09PSAnZGVjbGFyYXRpb25zJykge1xuICAgICAgICBkZWNsYXJhdGlvbnNOb2RlID0gcC5pbml0aWFsaXplcjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEluIGNhc2UgdGhlIG1vZHVsZSBzcGVjaWZpZXMgdGhlIFwiZW50cnlDb21wb25lbnRzXCIgZmllbGQsIHdhbGsgdGhyb3VnaCBhbGxcbiAgICAvLyByZXNvbHZlZCBlbnRyeSBjb21wb25lbnRzIGFuZCBjb2xsZWN0IHRoZSByZWZlcmVuY2VkIGRpcmVjdGl2ZXMuXG4gICAgaWYgKGVudHJ5Q29tcG9uZW50c05vZGUpIHtcbiAgICAgIGZsYXR0ZW5UeXBlTGlzdCh0aGlzLmV2YWx1YXRvci5ldmFsdWF0ZShlbnRyeUNvbXBvbmVudHNOb2RlKSkuZm9yRWFjaChyZWYgPT4ge1xuICAgICAgICBpZiAodHMuaXNDbGFzc0RlY2xhcmF0aW9uKHJlZi5ub2RlKSAmJlxuICAgICAgICAgICAgIWhhc05nRGVjbGFyYXRpb25EZWNvcmF0b3IocmVmLm5vZGUsIHRoaXMudHlwZUNoZWNrZXIpKSB7XG4gICAgICAgICAgdGhpcy51bmRlY29yYXRlZERlY2xhcmF0aW9ucy5hZGQocmVmLm5vZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBtb2R1bGUgc3BlY2lmaWVzIHRoZSBcImRlY2xhcmF0aW9uc1wiIGZpZWxkLCB3YWxrIHRocm91Z2ggYWxsXG4gICAgLy8gcmVzb2x2ZWQgZGVjbGFyYXRpb25zIGFuZCBjb2xsZWN0IHRoZSByZWZlcmVuY2VkIGRpcmVjdGl2ZXMuXG4gICAgaWYgKGRlY2xhcmF0aW9uc05vZGUpIHtcbiAgICAgIGZsYXR0ZW5UeXBlTGlzdCh0aGlzLmV2YWx1YXRvci5ldmFsdWF0ZShkZWNsYXJhdGlvbnNOb2RlKSkuZm9yRWFjaChyZWYgPT4ge1xuICAgICAgICBpZiAodHMuaXNDbGFzc0RlY2xhcmF0aW9uKHJlZi5ub2RlKSAmJlxuICAgICAgICAgICAgIWhhc05nRGVjbGFyYXRpb25EZWNvcmF0b3IocmVmLm5vZGUsIHRoaXMudHlwZUNoZWNrZXIpKSB7XG4gICAgICAgICAgdGhpcy51bmRlY29yYXRlZERlY2xhcmF0aW9ucy5hZGQocmVmLm5vZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEZsYXR0ZW5zIGEgbGlzdCBvZiB0eXBlIHJlZmVyZW5jZXMuICovXG5mdW5jdGlvbiBmbGF0dGVuVHlwZUxpc3QodmFsdWU6IFJlc29sdmVkVmFsdWUpOiBSZWZlcmVuY2VbXSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiA8UmVmZXJlbmNlW10+dmFsdWUucmVkdWNlKFxuICAgICAgICAocmVzOiBSZWZlcmVuY2VbXSwgdjogUmVzb2x2ZWRWYWx1ZSkgPT4gcmVzLmNvbmNhdChmbGF0dGVuVHlwZUxpc3QodikpLCBbXSk7XG4gIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWZlcmVuY2UpIHtcbiAgICByZXR1cm4gW3ZhbHVlXTtcbiAgfVxuICByZXR1cm4gW107XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gbm9kZSBoYXMgdGhlIFwiQERpcmVjdGl2ZVwiIG9yIFwiQENvbXBvbmVudFwiIGRlY29yYXRvciBzZXQuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzRGlyZWN0aXZlRGVjb3JhdG9yKFxuICAgIG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgbmdEZWNvcmF0b3JzPzogTmdEZWNvcmF0b3JbXSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKG5nRGVjb3JhdG9ycyB8fCBnZXROZ0NsYXNzRGVjb3JhdG9ycyhub2RlLCB0eXBlQ2hlY2tlcikpXG4gICAgICAuc29tZSgoe25hbWV9KSA9PiBuYW1lID09PSAnRGlyZWN0aXZlJyB8fCBuYW1lID09PSAnQ29tcG9uZW50Jyk7XG59XG5cblxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIG5vZGUgaGFzIHRoZSBcIkBJbmplY3RhYmxlXCIgZGVjb3JhdG9yIHNldC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNJbmplY3RhYmxlRGVjb3JhdG9yKFxuICAgIG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgbmdEZWNvcmF0b3JzPzogTmdEZWNvcmF0b3JbXSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKG5nRGVjb3JhdG9ycyB8fCBnZXROZ0NsYXNzRGVjb3JhdG9ycyhub2RlLCB0eXBlQ2hlY2tlcikpXG4gICAgICAuc29tZSgoe25hbWV9KSA9PiBuYW1lID09PSAnSW5qZWN0YWJsZScpO1xufVxuLyoqIFdoZXRoZXIgdGhlIGdpdmVuIG5vZGUgaGFzIGFuIGV4cGxpY2l0IGRlY29yYXRvciB0aGF0IGRlc2NyaWJlcyBhbiBBbmd1bGFyIGRlY2xhcmF0aW9uLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc05nRGVjbGFyYXRpb25EZWNvcmF0b3Iobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKSB7XG4gIHJldHVybiBnZXROZ0NsYXNzRGVjb3JhdG9ycyhub2RlLCB0eXBlQ2hlY2tlcilcbiAgICAgIC5zb21lKCh7bmFtZX0pID0+IG5hbWUgPT09ICdDb21wb25lbnQnIHx8IG5hbWUgPT09ICdEaXJlY3RpdmUnIHx8IG5hbWUgPT09ICdQaXBlJyk7XG59XG5cbi8qKiBHZXRzIGFsbCBBbmd1bGFyIGRlY29yYXRvcnMgb2YgYSBnaXZlbiBjbGFzcyBkZWNsYXJhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZ0NsYXNzRGVjb3JhdG9ycyhcbiAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBOZ0RlY29yYXRvcltdIHtcbiAgaWYgKCFub2RlLmRlY29yYXRvcnMpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgcmV0dXJuIGdldEFuZ3VsYXJEZWNvcmF0b3JzKHR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpO1xufVxuIl19