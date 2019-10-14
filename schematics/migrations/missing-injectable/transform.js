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
        define("@angular/core/schematics/migrations/missing-injectable/transform", ["require", "exports", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/migrations/missing-injectable/import_manager"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    const partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    const reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    const ts = require("typescript");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const import_manager_1 = require("@angular/core/schematics/migrations/missing-injectable/import_manager");
    /** Name of decorators which imply that a given class does not need to be migrated. */
    const NO_MIGRATE_DECORATORS = ['Injectable', 'Directive', 'Component', 'Pipe'];
    class MissingInjectableTransform {
        constructor(typeChecker, getUpdateRecorder) {
            this.typeChecker = typeChecker;
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = ts.createPrinter();
            this.importManager = new import_manager_1.ImportManager(this.getUpdateRecorder, this.printer);
            /** Set of provider class declarations which were already checked or migrated. */
            this.visitedProviderClasses = new Set();
            this.partialEvaluator =
                new partial_evaluator_1.PartialEvaluator(new reflection_1.TypeScriptReflectionHost(typeChecker), typeChecker);
        }
        recordChanges() { this.importManager.recordChanges(); }
        /**
         * Migrates all specified NgModule's by walking through referenced providers
         * and decorating them with "@Injectable" if needed.
         */
        migrateModules(modules) {
            return modules.reduce((failures, node) => failures.concat(this.migrateModule(node)), []);
        }
        /**
         * Migrates all specified directives by walking through referenced providers
         * and decorating them with "@Injectable" if needed.
         */
        migrateDirectives(directives) {
            return directives.reduce((failures, node) => failures.concat(this.migrateDirective(node)), []);
        }
        /** Migrates a given NgModule by walking through the referenced providers. */
        migrateModule(module) {
            if (module.providersExpr === null) {
                return [];
            }
            const evaluatedExpr = this.partialEvaluator.evaluate(module.providersExpr);
            if (!Array.isArray(evaluatedExpr)) {
                return [{
                        node: module.providersExpr,
                        message: 'Providers of module are not statically analyzable.'
                    }];
            }
            return this._visitProviderResolvedValue(evaluatedExpr, module);
        }
        /**
         * Migrates a given directive by walking through defined providers. This method
         * also handles components with "viewProviders" defined.
         */
        migrateDirective(directive) {
            const failures = [];
            // Migrate "providers" on directives and components if defined.
            if (directive.providersExpr) {
                const evaluatedExpr = this.partialEvaluator.evaluate(directive.providersExpr);
                if (!Array.isArray(evaluatedExpr)) {
                    return [
                        { node: directive.providersExpr, message: `Providers are not statically analyzable.` }
                    ];
                }
                failures.push(...this._visitProviderResolvedValue(evaluatedExpr, directive));
            }
            // Migrate "viewProviders" on components if defined.
            if (directive.viewProvidersExpr) {
                const evaluatedExpr = this.partialEvaluator.evaluate(directive.viewProvidersExpr);
                if (!Array.isArray(evaluatedExpr)) {
                    return [
                        { node: directive.viewProvidersExpr, message: `Providers are not statically analyzable.` }
                    ];
                }
                failures.push(...this._visitProviderResolvedValue(evaluatedExpr, directive));
            }
            return failures;
        }
        /**
         * Migrates a given provider class if it is not decorated with
         * any Angular decorator.
         */
        migrateProviderClass(node, context) {
            if (this.visitedProviderClasses.has(node)) {
                return;
            }
            this.visitedProviderClasses.add(node);
            const sourceFile = node.getSourceFile();
            const ngDecorators = node.decorators ? ng_decorators_1.getAngularDecorators(this.typeChecker, node.decorators) : null;
            if (ngDecorators !== null &&
                ngDecorators.some(d => NO_MIGRATE_DECORATORS.indexOf(d.name) !== -1)) {
                return;
            }
            const updateRecorder = this.getUpdateRecorder(sourceFile);
            const importExpr = this.importManager.addImportToSourceFile(sourceFile, 'Injectable', '@angular/core');
            const newDecoratorExpr = ts.createDecorator(ts.createCall(importExpr, undefined, undefined));
            const newDecoratorText = this.printer.printNode(ts.EmitHint.Unspecified, newDecoratorExpr, sourceFile);
            // In case the class is already decorated with "@Inject(..)", we replace the "@Inject"
            // decorator with "@Injectable()" since using "@Inject(..)" on a class is a noop and
            // most likely was meant to be "@Injectable()".
            const existingInjectDecorator = ngDecorators !== null ? ngDecorators.find(d => d.name === 'Inject') : null;
            if (existingInjectDecorator) {
                updateRecorder.replaceDecorator(existingInjectDecorator.node, newDecoratorText, context.name);
            }
            else {
                updateRecorder.addClassDecorator(node, newDecoratorText, context.name);
            }
        }
        /**
         * Visits the given resolved value of a provider. Providers can be nested in
         * arrays and we need to recursively walk through the providers to be able to
         * migrate all referenced provider classes. e.g. "providers: [[A, [B]]]".
         */
        _visitProviderResolvedValue(value, module) {
            if (value instanceof imports_1.Reference && ts.isClassDeclaration(value.node)) {
                this.migrateProviderClass(value.node, module);
            }
            else if (value instanceof Map) {
                if (!value.has('provide') || value.has('useValue') || value.has('useFactory')) {
                    return [];
                }
                if (value.has('useExisting')) {
                    return this._visitProviderResolvedValue(value.get('useExisting'), module);
                }
                else if (value.has('useClass')) {
                    return this._visitProviderResolvedValue(value.get('useClass'), module);
                }
                else {
                    return this._visitProviderResolvedValue(value.get('provide'), module);
                }
            }
            else if (Array.isArray(value)) {
                return value.reduce((res, v) => res.concat(this._visitProviderResolvedValue(v, module)), []);
            }
            else if (value instanceof partial_evaluator_1.DynamicValue) {
                return [{ node: value.node, message: `Provider is not statically analyzable.` }];
            }
            return [];
        }
    }
    exports.MissingInjectableTransform = MissingInjectableTransform;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbWlzc2luZy1pbmplY3RhYmxlL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILHFFQUFrRTtJQUNsRSx5RkFBZ0g7SUFDaEgsMkVBQW9GO0lBQ3BGLGlDQUFpQztJQUVqQyxnRkFBK0Q7SUFHL0QsMEdBQStDO0lBSS9DLHNGQUFzRjtJQUN0RixNQUFNLHFCQUFxQixHQUFHLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFPL0UsTUFBYSwwQkFBMEI7UUFRckMsWUFDWSxXQUEyQixFQUMzQixpQkFBd0Q7WUFEeEQsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUM7WUFUNUQsWUFBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM3QixrQkFBYSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBR2hGLGlGQUFpRjtZQUN6RSwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztZQUs5RCxJQUFJLENBQUMsZ0JBQWdCO2dCQUNqQixJQUFJLG9DQUFnQixDQUFDLElBQUkscUNBQXdCLENBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUVELGFBQWEsS0FBSyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV2RDs7O1dBR0c7UUFDSCxjQUFjLENBQUMsT0FBMkI7WUFDeEMsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUNqQixDQUFDLFFBQVEsRUFBRSxJQUFJ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QUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFDbkUsQ0FBQyxDQUFDO2FBQ3pCO2lCQUFNLElBQUksS0FBSyxZQUFZLGdDQUFZLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSx3Q0FBd0MsRUFBQyxDQUFDLENBQUM7YUFDaEY7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7S0FDRjtJQXhKRCxnRUF3SkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UmVmZXJlbmNlfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL2ltcG9ydHMnO1xuaW1wb3J0IHtEeW5hbWljVmFsdWUsIFBhcnRpYWxFdmFsdWF0b3IsIFJlc29sdmVkVmFsdWV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcmVmbGVjdGlvbic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5cbmltcG9ydCB7UmVzb2x2ZWREaXJlY3RpdmUsIFJlc29sdmVkTmdNb2R1bGV9IGZyb20gJy4vZGVmaW5pdGlvbl9jb2xsZWN0b3InO1xuaW1wb3J0IHtJbXBvcnRNYW5hZ2VyfSBmcm9tICcuL2ltcG9ydF9tYW5hZ2VyJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuXG4vKiogTmFtZSBvZiBkZWNvcmF0b3JzIHdoaWNoIGltcGx5IHRoYXQgYSBnaXZlbiBjbGFzcyBkb2VzIG5vdCBuZWVkIHRvIGJlIG1pZ3JhdGVkLiAqL1xuY29uc3QgTk9fTUlHUkFURV9ERUNPUkFUT1JTID0gWydJbmplY3RhYmxlJywgJ0RpcmVjdGl2ZScsICdDb21wb25lbnQnLCAnUGlwZSddO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5c2lzRmFpbHVyZSB7XG4gIG5vZGU6IHRzLk5vZGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIE1pc3NpbmdJbmplY3RhYmxlVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBwcml2YXRlIGltcG9ydE1hbmFnZXIgPSBuZXcgSW1wb3J0TWFuYWdlcih0aGlzLmdldFVwZGF0ZVJlY29yZGVyLCB0aGlzLnByaW50ZXIpO1xuICBwcml2YXRlIHBhcnRpYWxFdmFsdWF0b3I6IFBhcnRpYWxFdmFsdWF0b3I7XG5cbiAgLyoqIFNldCBvZiBwcm92aWRlciBjbGFzcyBkZWNsYXJhdGlvbnMgd2hpY2ggd2VyZSBhbHJlYWR5IGNoZWNrZWQgb3IgbWlncmF0ZWQuICovXG4gIHByaXZhdGUgdmlzaXRlZFByb3ZpZGVyQ2xhc3NlcyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBnZXRVcGRhdGVSZWNvcmRlcjogKHNmOiB0cy5Tb3VyY2VGaWxlKSA9PiBVcGRhdGVSZWNvcmRlcikge1xuICAgIHRoaXMucGFydGlhbEV2YWx1YXRvciA9XG4gICAgICAgIG5ldyBQYXJ0aWFsRXZhbHVhdG9yKG5ldyBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QodHlwZUNoZWNrZXIpLCB0eXBlQ2hlY2tlcik7XG4gIH1cblxuICByZWNvcmRDaGFuZ2VzKCkgeyB0aGlzLmltcG9ydE1hbmFnZXIucmVjb3JkQ2hhbmdlcygpOyB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGFsbCBzcGVjaWZpZWQgTmdNb2R1bGUncyBieSB3YWxraW5nIHRocm91Z2ggcmVmZXJlbmNlZCBwcm92aWRlcnNcbiAgICogYW5kIGRlY29yYXRpbmcgdGhlbSB3aXRoIFwiQEluamVjdGFibGVcIiBpZiBuZWVkZWQuXG4gICAqL1xuICBtaWdyYXRlTW9kdWxlcyhtb2R1bGVzOiBSZXNvbHZlZE5nTW9kdWxlW10pOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIG1vZHVsZXMucmVkdWNlKFxuICAgICAgICAoZmFpbHVyZXMsIG5vZGUpID0+IGZhaWx1cmVzLmNvbmNhdCh0aGlzLm1pZ3JhdGVNb2R1bGUobm9kZSkpLCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSk7XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgYWxsIHNwZWNpZmllZCBkaXJlY3RpdmVzIGJ5IHdhbGtpbmcgdGhyb3VnaCByZWZlcmVuY2VkIHByb3ZpZGVyc1xuICAgKiBhbmQgZGVjb3JhdGluZyB0aGVtIHdpdGggXCJASW5qZWN0YWJsZVwiIGlmIG5lZWRlZC5cbiAgICovXG4gIG1pZ3JhdGVEaXJlY3RpdmVzKGRpcmVjdGl2ZXM6IFJlc29sdmVkRGlyZWN0aXZlW10pOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZXMucmVkdWNlKFxuICAgICAgICAoZmFpbHVyZXMsIG5vZGUpID0+IGZhaWx1cmVzLmNvbmNhdCh0aGlzLm1pZ3JhdGVEaXJlY3RpdmUobm9kZSkpLCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSk7XG4gIH1cblxuICAvKiogTWlncmF0ZXMgYSBnaXZlbiBOZ01vZHVsZSBieSB3YWxraW5nIHRocm91Z2ggdGhlIHJlZmVyZW5jZWQgcHJvdmlkZXJzLiAqL1xuICBtaWdyYXRlTW9kdWxlKG1vZHVsZTogUmVzb2x2ZWROZ01vZHVsZSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICBpZiAobW9kdWxlLnByb3ZpZGVyc0V4cHIgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBldmFsdWF0ZWRFeHByID0gdGhpcy5wYXJ0aWFsRXZhbHVhdG9yLmV2YWx1YXRlKG1vZHVsZS5wcm92aWRlcnNFeHByKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShldmFsdWF0ZWRFeHByKSkge1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgIG5vZGU6IG1vZHVsZS5wcm92aWRlcnNFeHByLFxuICAgICAgICBtZXNzYWdlOiAnUHJvdmlkZXJzIG9mIG1vZHVsZSBhcmUgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS4nXG4gICAgICB9XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUoZXZhbHVhdGVkRXhwciwgbW9kdWxlKTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGEgZ2l2ZW4gZGlyZWN0aXZlIGJ5IHdhbGtpbmcgdGhyb3VnaCBkZWZpbmVkIHByb3ZpZGVycy4gVGhpcyBtZXRob2RcbiAgICogYWxzbyBoYW5kbGVzIGNvbXBvbmVudHMgd2l0aCBcInZpZXdQcm92aWRlcnNcIiBkZWZpbmVkLlxuICAgKi9cbiAgbWlncmF0ZURpcmVjdGl2ZShkaXJlY3RpdmU6IFJlc29sdmVkRGlyZWN0aXZlKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGNvbnN0IGZhaWx1cmVzOiBBbmFseXNpc0ZhaWx1cmVbXSA9IFtdO1xuXG4gICAgLy8gTWlncmF0ZSBcInByb3ZpZGVyc1wiIG9uIGRpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudHMgaWYgZGVmaW5lZC5cbiAgICBpZiAoZGlyZWN0aXZlLnByb3ZpZGVyc0V4cHIpIHtcbiAgICAgIGNvbnN0IGV2YWx1YXRlZEV4cHIgPSB0aGlzLnBhcnRpYWxFdmFsdWF0b3IuZXZhbHVhdGUoZGlyZWN0aXZlLnByb3ZpZGVyc0V4cHIpO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV2YWx1YXRlZEV4cHIpKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAge25vZGU6IGRpcmVjdGl2ZS5wcm92aWRlcnNFeHByLCBtZXNzYWdlOiBgUHJvdmlkZXJzIGFyZSBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9XG4gICAgICAgIF07XG4gICAgICB9XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLnRoaXMuX3Zpc2l0UHJvdmlkZXJSZXNvbHZlZFZhbHVlKGV2YWx1YXRlZEV4cHIsIGRpcmVjdGl2ZSkpO1xuICAgIH1cblxuICAgIC8vIE1pZ3JhdGUgXCJ2aWV3UHJvdmlkZXJzXCIgb24gY29tcG9uZW50cyBpZiBkZWZpbmVkLlxuICAgIGlmIChkaXJlY3RpdmUudmlld1Byb3ZpZGVyc0V4cHIpIHtcbiAgICAgIGNvbnN0IGV2YWx1YXRlZEV4cHIgPSB0aGlzLnBhcnRpYWxFdmFsdWF0b3IuZXZhbHVhdGUoZGlyZWN0aXZlLnZpZXdQcm92aWRlcnNFeHByKTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShldmFsdWF0ZWRFeHByKSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHtub2RlOiBkaXJlY3RpdmUudmlld1Byb3ZpZGVyc0V4cHIsIG1lc3NhZ2U6IGBQcm92aWRlcnMgYXJlIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuYH1cbiAgICAgICAgXTtcbiAgICAgIH1cbiAgICAgIGZhaWx1cmVzLnB1c2goLi4udGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUoZXZhbHVhdGVkRXhwciwgZGlyZWN0aXZlKSk7XG4gICAgfVxuICAgIHJldHVybiBmYWlsdXJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyBhIGdpdmVuIHByb3ZpZGVyIGNsYXNzIGlmIGl0IGlzIG5vdCBkZWNvcmF0ZWQgd2l0aFxuICAgKiBhbnkgQW5ndWxhciBkZWNvcmF0b3IuXG4gICAqL1xuICBtaWdyYXRlUHJvdmlkZXJDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBjb250ZXh0OiBSZXNvbHZlZE5nTW9kdWxlfFJlc29sdmVkRGlyZWN0aXZlKSB7XG4gICAgaWYgKHRoaXMudmlzaXRlZFByb3ZpZGVyQ2xhc3Nlcy5oYXMobm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy52aXNpdGVkUHJvdmlkZXJDbGFzc2VzLmFkZChub2RlKTtcblxuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCBuZ0RlY29yYXRvcnMgPVxuICAgICAgICBub2RlLmRlY29yYXRvcnMgPyBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpIDogbnVsbDtcblxuICAgIGlmIChuZ0RlY29yYXRvcnMgIT09IG51bGwgJiZcbiAgICAgICAgbmdEZWNvcmF0b3JzLnNvbWUoZCA9PiBOT19NSUdSQVRFX0RFQ09SQVRPUlMuaW5kZXhPZihkLm5hbWUpICE9PSAtMSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVSZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIoc291cmNlRmlsZSk7XG4gICAgY29uc3QgaW1wb3J0RXhwciA9XG4gICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoc291cmNlRmlsZSwgJ0luamVjdGFibGUnLCAnQGFuZ3VsYXIvY29yZScpO1xuICAgIGNvbnN0IG5ld0RlY29yYXRvckV4cHIgPSB0cy5jcmVhdGVEZWNvcmF0b3IodHMuY3JlYXRlQ2FsbChpbXBvcnRFeHByLCB1bmRlZmluZWQsIHVuZGVmaW5lZCkpO1xuICAgIGNvbnN0IG5ld0RlY29yYXRvclRleHQgPVxuICAgICAgICB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdEZWNvcmF0b3JFeHByLCBzb3VyY2VGaWxlKTtcblxuXG4gICAgLy8gSW4gY2FzZSB0aGUgY2xhc3MgaXMgYWxyZWFkeSBkZWNvcmF0ZWQgd2l0aCBcIkBJbmplY3QoLi4pXCIsIHdlIHJlcGxhY2UgdGhlIFwiQEluamVjdFwiXG4gICAgLy8gZGVjb3JhdG9yIHdpdGggXCJASW5qZWN0YWJsZSgpXCIgc2luY2UgdXNpbmcgXCJASW5qZWN0KC4uKVwiIG9uIGEgY2xhc3MgaXMgYSBub29wIGFuZFxuICAgIC8vIG1vc3QgbGlrZWx5IHdhcyBtZWFudCB0byBiZSBcIkBJbmplY3RhYmxlKClcIi5cbiAgICBjb25zdCBleGlzdGluZ0luamVjdERlY29yYXRvciA9XG4gICAgICAgIG5nRGVjb3JhdG9ycyAhPT0gbnVsbCA/IG5nRGVjb3JhdG9ycy5maW5kKGQgPT4gZC5uYW1lID09PSAnSW5qZWN0JykgOiBudWxsO1xuICAgIGlmIChleGlzdGluZ0luamVjdERlY29yYXRvcikge1xuICAgICAgdXBkYXRlUmVjb3JkZXIucmVwbGFjZURlY29yYXRvcihleGlzdGluZ0luamVjdERlY29yYXRvci5ub2RlLCBuZXdEZWNvcmF0b3JUZXh0LCBjb250ZXh0Lm5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVSZWNvcmRlci5hZGRDbGFzc0RlY29yYXRvcihub2RlLCBuZXdEZWNvcmF0b3JUZXh0LCBjb250ZXh0Lm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWaXNpdHMgdGhlIGdpdmVuIHJlc29sdmVkIHZhbHVlIG9mIGEgcHJvdmlkZXIuIFByb3ZpZGVycyBjYW4gYmUgbmVzdGVkIGluXG4gICAqIGFycmF5cyBhbmQgd2UgbmVlZCB0byByZWN1cnNpdmVseSB3YWxrIHRocm91Z2ggdGhlIHByb3ZpZGVycyB0byBiZSBhYmxlIHRvXG4gICAqIG1pZ3JhdGUgYWxsIHJlZmVyZW5jZWQgcHJvdmlkZXIgY2xhc3Nlcy4gZS5nLiBcInByb3ZpZGVyczogW1tBLCBbQl1dXVwiLlxuICAgKi9cbiAgcHJpdmF0ZSBfdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodmFsdWU6IFJlc29sdmVkVmFsdWUsIG1vZHVsZTogUmVzb2x2ZWROZ01vZHVsZSk6XG4gICAgICBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmVmZXJlbmNlICYmIHRzLmlzQ2xhc3NEZWNsYXJhdGlvbih2YWx1ZS5ub2RlKSkge1xuICAgICAgdGhpcy5taWdyYXRlUHJvdmlkZXJDbGFzcyh2YWx1ZS5ub2RlLCBtb2R1bGUpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgIGlmICghdmFsdWUuaGFzKCdwcm92aWRlJykgfHwgdmFsdWUuaGFzKCd1c2VWYWx1ZScpIHx8IHZhbHVlLmhhcygndXNlRmFjdG9yeScpKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZS5oYXMoJ3VzZUV4aXN0aW5nJykpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Zpc2l0UHJvdmlkZXJSZXNvbHZlZFZhbHVlKHZhbHVlLmdldCgndXNlRXhpc3RpbmcnKSAhLCBtb2R1bGUpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZS5oYXMoJ3VzZUNsYXNzJykpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Zpc2l0UHJvdmlkZXJSZXNvbHZlZFZhbHVlKHZhbHVlLmdldCgndXNlQ2xhc3MnKSAhLCBtb2R1bGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Zpc2l0UHJvdmlkZXJSZXNvbHZlZFZhbHVlKHZhbHVlLmdldCgncHJvdmlkZScpICEsIG1vZHVsZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlLnJlZHVjZSgocmVzLCB2KSA9PiByZXMuY29uY2F0KHRoaXMuX3Zpc2l0UHJvdmlkZXJSZXNvbHZlZFZhbHVlKHYsIG1vZHVsZSkpLCBbXG4gICAgICBdIGFzIEFuYWx5c2lzRmFpbHVyZVtdKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgRHluYW1pY1ZhbHVlKSB7XG4gICAgICByZXR1cm4gW3tub2RlOiB2YWx1ZS5ub2RlLCBtZXNzYWdlOiBgUHJvdmlkZXIgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfV07XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxufVxuIl19