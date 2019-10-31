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
        define("@angular/core/schematics/migrations/missing-injectable/transform", ["require", "exports", "@angular/compiler-cli/src/ngtsc/annotations/src/util", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/migrations/missing-injectable/import_manager"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const util_1 = require("@angular/compiler-cli/src/ngtsc/annotations/src/util");
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
            const evaluatedExpr = this._evaluateExpression(module.providersExpr);
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
                const evaluatedExpr = this._evaluateExpression(directive.providersExpr);
                if (!Array.isArray(evaluatedExpr)) {
                    return [
                        { node: directive.providersExpr, message: `Providers are not statically analyzable.` }
                    ];
                }
                failures.push(...this._visitProviderResolvedValue(evaluatedExpr, directive));
            }
            // Migrate "viewProviders" on components if defined.
            if (directive.viewProvidersExpr) {
                const evaluatedExpr = this._evaluateExpression(directive.viewProvidersExpr);
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
            // We cannot migrate provider classes outside of source files. This is because the
            // migration for third-party library files should happen in "ngcc", and in general
            // would also involve metadata parsing.
            if (sourceFile.isDeclarationFile) {
                return;
            }
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
         * Evaluates the given TypeScript expression using the partial evaluator with
         * the foreign function resolver for handling "forwardRef" calls.
         */
        _evaluateExpression(expr) {
            return this.partialEvaluator.evaluate(expr, util_1.forwardRefResolver);
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
                if (!value.has('provide') || value.has('useValue') || value.has('useFactory') ||
                    value.has('useExisting')) {
                    return [];
                }
                if (value.has('useClass')) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbWlzc2luZy1pbmplY3RhYmxlL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtFQUF3RjtJQUN4RixxRUFBa0U7SUFDbEUseUZBQWdIO0lBQ2hILDJFQUFvRjtJQUNwRixpQ0FBaUM7SUFFakMsZ0ZBQStEO0lBRy9ELDBHQUErQztJQUkvQyxzRkFBc0Y7SUFDdEYsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBTy9FLE1BQWEsMEJBQTBCO1FBUXJDLFlBQ1ksV0FBMkIsRUFDM0IsaUJBQXdEO1lBRHhELGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXVDO1lBVDVELFlBQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDN0Isa0JBQWEsR0FBRyxJQUFJLDhCQUFhLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUdoRixpRkFBaUY7WUFDekUsMkJBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFLOUQsSUFBSSxDQUFDLGdCQUFnQjtnQkFDakIsSUFBSSxvQ0FBZ0IsQ0FBQyxJQUFJLHFDQUF3QixDQUFDLFdBQVcsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ25GLENBQUM7UUFFRCxhQUFhLEtBQUssSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFdkQ7OztXQUdHO1FBQ0gsY0FBYyxDQUFDLE9BQTJCO1lBQ3hDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FDakIsQ0FBQyxR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RTthQUNGO2lCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDL0IsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFDbkUsQ0FBQyxDQUFDO2FBQ3pCO2lCQUFNLElBQUksS0FBSyxZQUFZLGdDQUFZLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSx3Q0FBd0MsRUFBQyxDQUFDLENBQUM7YUFDaEY7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7S0FDRjtJQXZLRCxnRUF1S0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Zm9yd2FyZFJlZlJlc29sdmVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL2Fubm90YXRpb25zL3NyYy91dGlsJztcbmltcG9ydCB7UmVmZXJlbmNlfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL2ltcG9ydHMnO1xuaW1wb3J0IHtEeW5hbWljVmFsdWUsIFBhcnRpYWxFdmFsdWF0b3IsIFJlc29sdmVkVmFsdWV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcmVmbGVjdGlvbic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5cbmltcG9ydCB7UmVzb2x2ZWREaXJlY3RpdmUsIFJlc29sdmVkTmdNb2R1bGV9IGZyb20gJy4vZGVmaW5pdGlvbl9jb2xsZWN0b3InO1xuaW1wb3J0IHtJbXBvcnRNYW5hZ2VyfSBmcm9tICcuL2ltcG9ydF9tYW5hZ2VyJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuXG4vKiogTmFtZSBvZiBkZWNvcmF0b3JzIHdoaWNoIGltcGx5IHRoYXQgYSBnaXZlbiBjbGFzcyBkb2VzIG5vdCBuZWVkIHRvIGJlIG1pZ3JhdGVkLiAqL1xuY29uc3QgTk9fTUlHUkFURV9ERUNPUkFUT1JTID0gWydJbmplY3RhYmxlJywgJ0RpcmVjdGl2ZScsICdDb21wb25lbnQnLCAnUGlwZSddO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5c2lzRmFpbHVyZSB7XG4gIG5vZGU6IHRzLk5vZGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIE1pc3NpbmdJbmplY3RhYmxlVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBwcml2YXRlIGltcG9ydE1hbmFnZXIgPSBuZXcgSW1wb3J0TWFuYWdlcih0aGlzLmdldFVwZGF0ZVJlY29yZGVyLCB0aGlzLnByaW50ZXIpO1xuICBwcml2YXRlIHBhcnRpYWxFdmFsdWF0b3I6IFBhcnRpYWxFdmFsdWF0b3I7XG5cbiAgLyoqIFNldCBvZiBwcm92aWRlciBjbGFzcyBkZWNsYXJhdGlvbnMgd2hpY2ggd2VyZSBhbHJlYWR5IGNoZWNrZWQgb3IgbWlncmF0ZWQuICovXG4gIHByaXZhdGUgdmlzaXRlZFByb3ZpZGVyQ2xhc3NlcyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBnZXRVcGRhdGVSZWNvcmRlcjogKHNmOiB0cy5Tb3VyY2VGaWxlKSA9PiBVcGRhdGVSZWNvcmRlcikge1xuICAgIHRoaXMucGFydGlhbEV2YWx1YXRvciA9XG4gICAgICAgIG5ldyBQYXJ0aWFsRXZhbHVhdG9yKG5ldyBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QodHlwZUNoZWNrZXIpLCB0eXBlQ2hlY2tlcik7XG4gIH1cblxuICByZWNvcmRDaGFuZ2VzKCkgeyB0aGlzLmltcG9ydE1hbmFnZXIucmVjb3JkQ2hhbmdlcygpOyB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGFsbCBzcGVjaWZpZWQgTmdNb2R1bGUncyBieSB3YWxraW5nIHRocm91Z2ggcmVmZXJlbmNlZCBwcm92aWRlcnNcbiAgICogYW5kIGRlY29yYXRpbmcgdGhlbSB3aXRoIFwiQEluamVjdGFibGVcIiBpZiBuZWVkZWQuXG4gICAqL1xuICBtaWdyYXRlTW9kdWxlcyhtb2R1bGVzOiBSZXNvbHZlZE5nTW9kdWxlW10pOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIG1vZHVsZXMucmVkdWNlKFxuICAgICAgICAoZmFpbHVyZXMsIG5vZGUpID0+IGZhaWx1cmVzLmNvbmNhdCh0aGlzLm1pZ3JhdGVNb2R1bGUobm9kZSkpLCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSk7XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgYWxsIHNwZWNpZmllZCBkaXJlY3RpdmVzIGJ5IHdhbGtpbmcgdGhyb3VnaCByZWZlcmVuY2VkIHByb3ZpZGVyc1xuICAgKiBhbmQgZGVjb3JhdGluZyB0aGVtIHdpdGggXCJASW5qZWN0YWJsZVwiIGlmIG5lZWRlZC5cbiAgICovXG4gIG1pZ3JhdGVEaXJlY3RpdmVzKGRpcmVjdGl2ZXM6IFJlc29sdmVkRGlyZWN0aXZlW10pOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZXMucmVkdWNlKFxuICAgICAgICAoZmFpbHVyZXMsIG5vZGUpID0+IGZhaWx1cmVzLmNvbmNhdCh0aGlzLm1pZ3JhdGVEaXJlY3RpdmUobm9kZSkpLCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSk7XG4gIH1cblxuICAvKiogTWlncmF0ZXMgYSBnaXZlbiBOZ01vZHVsZSBieSB3YWxraW5nIHRocm91Z2ggdGhlIHJlZmVyZW5jZWQgcHJvdmlkZXJzLiAqL1xuICBtaWdyYXRlTW9kdWxlKG1vZHVsZTogUmVzb2x2ZWROZ01vZHVsZSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICBpZiAobW9kdWxlLnByb3ZpZGVyc0V4cHIgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBldmFsdWF0ZWRFeHByID0gdGhpcy5fZXZhbHVhdGVFeHByZXNzaW9uKG1vZHVsZS5wcm92aWRlcnNFeHByKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShldmFsdWF0ZWRFeHByKSkge1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgIG5vZGU6IG1vZHVsZS5wcm92aWRlcnNFeHByLFxuICAgICAgICBtZXNzYWdlOiAnUHJvdmlkZXJzIG9mIG1vZHVsZSBhcmUgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS4nXG4gICAgICB9XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUoZXZhbHVhdGVkRXhwciwgbW9kdWxlKTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGEgZ2l2ZW4gZGlyZWN0aXZlIGJ5IHdhbGtpbmcgdGhyb3VnaCBkZWZpbmVkIHByb3ZpZGVycy4gVGhpcyBtZXRob2RcbiAgICogYWxzbyBoYW5kbGVzIGNvbXBvbmVudHMgd2l0aCBcInZpZXdQcm92aWRlcnNcIiBkZWZpbmVkLlxuICAgKi9cbiAgbWlncmF0ZURpcmVjdGl2ZShkaXJlY3RpdmU6IFJlc29sdmVkRGlyZWN0aXZlKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGNvbnN0IGZhaWx1cmVzOiBBbmFseXNpc0ZhaWx1cmVbXSA9IFtdO1xuXG4gICAgLy8gTWlncmF0ZSBcInByb3ZpZGVyc1wiIG9uIGRpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudHMgaWYgZGVmaW5lZC5cbiAgICBpZiAoZGlyZWN0aXZlLnByb3ZpZGVyc0V4cHIpIHtcbiAgICAgIGNvbnN0IGV2YWx1YXRlZEV4cHIgPSB0aGlzLl9ldmFsdWF0ZUV4cHJlc3Npb24oZGlyZWN0aXZlLnByb3ZpZGVyc0V4cHIpO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV2YWx1YXRlZEV4cHIpKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAge25vZGU6IGRpcmVjdGl2ZS5wcm92aWRlcnNFeHByLCBtZXNzYWdlOiBgUHJvdmlkZXJzIGFyZSBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9XG4gICAgICAgIF07XG4gICAgICB9XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLnRoaXMuX3Zpc2l0UHJvdmlkZXJSZXNvbHZlZFZhbHVlKGV2YWx1YXRlZEV4cHIsIGRpcmVjdGl2ZSkpO1xuICAgIH1cblxuICAgIC8vIE1pZ3JhdGUgXCJ2aWV3UHJvdmlkZXJzXCIgb24gY29tcG9uZW50cyBpZiBkZWZpbmVkLlxuICAgIGlmIChkaXJlY3RpdmUudmlld1Byb3ZpZGVyc0V4cHIpIHtcbiAgICAgIGNvbnN0IGV2YWx1YXRlZEV4cHIgPSB0aGlzLl9ldmFsdWF0ZUV4cHJlc3Npb24oZGlyZWN0aXZlLnZpZXdQcm92aWRlcnNFeHByKTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShldmFsdWF0ZWRFeHByKSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHtub2RlOiBkaXJlY3RpdmUudmlld1Byb3ZpZGVyc0V4cHIsIG1lc3NhZ2U6IGBQcm92aWRlcnMgYXJlIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuYH1cbiAgICAgICAgXTtcbiAgICAgIH1cbiAgICAgIGZhaWx1cmVzLnB1c2goLi4udGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUoZXZhbHVhdGVkRXhwciwgZGlyZWN0aXZlKSk7XG4gICAgfVxuICAgIHJldHVybiBmYWlsdXJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyBhIGdpdmVuIHByb3ZpZGVyIGNsYXNzIGlmIGl0IGlzIG5vdCBkZWNvcmF0ZWQgd2l0aFxuICAgKiBhbnkgQW5ndWxhciBkZWNvcmF0b3IuXG4gICAqL1xuICBtaWdyYXRlUHJvdmlkZXJDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBjb250ZXh0OiBSZXNvbHZlZE5nTW9kdWxlfFJlc29sdmVkRGlyZWN0aXZlKSB7XG4gICAgaWYgKHRoaXMudmlzaXRlZFByb3ZpZGVyQ2xhc3Nlcy5oYXMobm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy52aXNpdGVkUHJvdmlkZXJDbGFzc2VzLmFkZChub2RlKTtcblxuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcblxuICAgIC8vIFdlIGNhbm5vdCBtaWdyYXRlIHByb3ZpZGVyIGNsYXNzZXMgb3V0c2lkZSBvZiBzb3VyY2UgZmlsZXMuIFRoaXMgaXMgYmVjYXVzZSB0aGVcbiAgICAvLyBtaWdyYXRpb24gZm9yIHRoaXJkLXBhcnR5IGxpYnJhcnkgZmlsZXMgc2hvdWxkIGhhcHBlbiBpbiBcIm5nY2NcIiwgYW5kIGluIGdlbmVyYWxcbiAgICAvLyB3b3VsZCBhbHNvIGludm9sdmUgbWV0YWRhdGEgcGFyc2luZy5cbiAgICBpZiAoc291cmNlRmlsZS5pc0RlY2xhcmF0aW9uRmlsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5nRGVjb3JhdG9ycyA9XG4gICAgICAgIG5vZGUuZGVjb3JhdG9ycyA/IGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuZGVjb3JhdG9ycykgOiBudWxsO1xuXG4gICAgaWYgKG5nRGVjb3JhdG9ycyAhPT0gbnVsbCAmJlxuICAgICAgICBuZ0RlY29yYXRvcnMuc29tZShkID0+IE5PX01JR1JBVEVfREVDT1JBVE9SUy5pbmRleE9mKGQubmFtZSkgIT09IC0xKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZVJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKTtcbiAgICBjb25zdCBpbXBvcnRFeHByID1cbiAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShzb3VyY2VGaWxlLCAnSW5qZWN0YWJsZScsICdAYW5ndWxhci9jb3JlJyk7XG4gICAgY29uc3QgbmV3RGVjb3JhdG9yRXhwciA9IHRzLmNyZWF0ZURlY29yYXRvcih0cy5jcmVhdGVDYWxsKGltcG9ydEV4cHIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKSk7XG4gICAgY29uc3QgbmV3RGVjb3JhdG9yVGV4dCA9XG4gICAgICAgIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0RlY29yYXRvckV4cHIsIHNvdXJjZUZpbGUpO1xuXG5cbiAgICAvLyBJbiBjYXNlIHRoZSBjbGFzcyBpcyBhbHJlYWR5IGRlY29yYXRlZCB3aXRoIFwiQEluamVjdCguLilcIiwgd2UgcmVwbGFjZSB0aGUgXCJASW5qZWN0XCJcbiAgICAvLyBkZWNvcmF0b3Igd2l0aCBcIkBJbmplY3RhYmxlKClcIiBzaW5jZSB1c2luZyBcIkBJbmplY3QoLi4pXCIgb24gYSBjbGFzcyBpcyBhIG5vb3AgYW5kXG4gICAgLy8gbW9zdCBsaWtlbHkgd2FzIG1lYW50IHRvIGJlIFwiQEluamVjdGFibGUoKVwiLlxuICAgIGNvbnN0IGV4aXN0aW5nSW5qZWN0RGVjb3JhdG9yID1cbiAgICAgICAgbmdEZWNvcmF0b3JzICE9PSBudWxsID8gbmdEZWNvcmF0b3JzLmZpbmQoZCA9PiBkLm5hbWUgPT09ICdJbmplY3QnKSA6IG51bGw7XG4gICAgaWYgKGV4aXN0aW5nSW5qZWN0RGVjb3JhdG9yKSB7XG4gICAgICB1cGRhdGVSZWNvcmRlci5yZXBsYWNlRGVjb3JhdG9yKGV4aXN0aW5nSW5qZWN0RGVjb3JhdG9yLm5vZGUsIG5ld0RlY29yYXRvclRleHQsIGNvbnRleHQubmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZVJlY29yZGVyLmFkZENsYXNzRGVjb3JhdG9yKG5vZGUsIG5ld0RlY29yYXRvclRleHQsIGNvbnRleHQubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV2YWx1YXRlcyB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBleHByZXNzaW9uIHVzaW5nIHRoZSBwYXJ0aWFsIGV2YWx1YXRvciB3aXRoXG4gICAqIHRoZSBmb3JlaWduIGZ1bmN0aW9uIHJlc29sdmVyIGZvciBoYW5kbGluZyBcImZvcndhcmRSZWZcIiBjYWxscy5cbiAgICovXG4gIHByaXZhdGUgX2V2YWx1YXRlRXhwcmVzc2lvbihleHByOiB0cy5FeHByZXNzaW9uKTogUmVzb2x2ZWRWYWx1ZSB7XG4gICAgcmV0dXJuIHRoaXMucGFydGlhbEV2YWx1YXRvci5ldmFsdWF0ZShleHByLCBmb3J3YXJkUmVmUmVzb2x2ZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZpc2l0cyB0aGUgZ2l2ZW4gcmVzb2x2ZWQgdmFsdWUgb2YgYSBwcm92aWRlci4gUHJvdmlkZXJzIGNhbiBiZSBuZXN0ZWQgaW5cbiAgICogYXJyYXlzIGFuZCB3ZSBuZWVkIHRvIHJlY3Vyc2l2ZWx5IHdhbGsgdGhyb3VnaCB0aGUgcHJvdmlkZXJzIHRvIGJlIGFibGUgdG9cbiAgICogbWlncmF0ZSBhbGwgcmVmZXJlbmNlZCBwcm92aWRlciBjbGFzc2VzLiBlLmcuIFwicHJvdmlkZXJzOiBbW0EsIFtCXV1dXCIuXG4gICAqL1xuICBwcml2YXRlIF92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZSh2YWx1ZTogUmVzb2x2ZWRWYWx1ZSwgbW9kdWxlOiBSZXNvbHZlZE5nTW9kdWxlKTpcbiAgICAgIEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWZlcmVuY2UgJiYgdHMuaXNDbGFzc0RlY2xhcmF0aW9uKHZhbHVlLm5vZGUpKSB7XG4gICAgICB0aGlzLm1pZ3JhdGVQcm92aWRlckNsYXNzKHZhbHVlLm5vZGUsIG1vZHVsZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgaWYgKCF2YWx1ZS5oYXMoJ3Byb3ZpZGUnKSB8fCB2YWx1ZS5oYXMoJ3VzZVZhbHVlJykgfHwgdmFsdWUuaGFzKCd1c2VGYWN0b3J5JykgfHxcbiAgICAgICAgICB2YWx1ZS5oYXMoJ3VzZUV4aXN0aW5nJykpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgaWYgKHZhbHVlLmhhcygndXNlQ2xhc3MnKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodmFsdWUuZ2V0KCd1c2VDbGFzcycpICEsIG1vZHVsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodmFsdWUuZ2V0KCdwcm92aWRlJykgISwgbW9kdWxlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICByZXR1cm4gdmFsdWUucmVkdWNlKChyZXMsIHYpID0+IHJlcy5jb25jYXQodGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodiwgbW9kdWxlKSksIFtcbiAgICAgIF0gYXMgQW5hbHlzaXNGYWlsdXJlW10pO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBEeW5hbWljVmFsdWUpIHtcbiAgICAgIHJldHVybiBbe25vZGU6IHZhbHVlLm5vZGUsIG1lc3NhZ2U6IGBQcm92aWRlciBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9XTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXX0=