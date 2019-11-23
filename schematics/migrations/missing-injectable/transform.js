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
        define("@angular/core/schematics/migrations/missing-injectable/transform", ["require", "exports", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/migrations/missing-injectable/import_manager", "@angular/core/schematics/migrations/missing-injectable/providers_evaluator"], factory);
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
    const providers_evaluator_1 = require("@angular/core/schematics/migrations/missing-injectable/providers_evaluator");
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
            /** Set of provider object literals which were already checked or migrated. */
            this.visitedProviderLiterals = new Set();
            this.providersEvaluator =
                new providers_evaluator_1.ProvidersEvaluator(new reflection_1.TypeScriptReflectionHost(typeChecker), typeChecker);
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
            const { resolvedValue, literals } = this.providersEvaluator.evaluate(module.providersExpr);
            this._migrateLiteralProviders(literals);
            if (!Array.isArray(resolvedValue)) {
                return [{
                        node: module.providersExpr,
                        message: 'Providers of module are not statically analyzable.'
                    }];
            }
            return this._visitProviderResolvedValue(resolvedValue, module);
        }
        /**
         * Migrates a given directive by walking through defined providers. This method
         * also handles components with "viewProviders" defined.
         */
        migrateDirective(directive) {
            const failures = [];
            // Migrate "providers" on directives and components if defined.
            if (directive.providersExpr) {
                const { resolvedValue, literals } = this.providersEvaluator.evaluate(directive.providersExpr);
                this._migrateLiteralProviders(literals);
                if (!Array.isArray(resolvedValue)) {
                    return [
                        { node: directive.providersExpr, message: `Providers are not statically analyzable.` }
                    ];
                }
                failures.push(...this._visitProviderResolvedValue(resolvedValue, directive));
            }
            // Migrate "viewProviders" on components if defined.
            if (directive.viewProvidersExpr) {
                const { resolvedValue, literals } = this.providersEvaluator.evaluate(directive.viewProvidersExpr);
                this._migrateLiteralProviders(literals);
                if (!Array.isArray(resolvedValue)) {
                    return [
                        { node: directive.viewProvidersExpr, message: `Providers are not statically analyzable.` }
                    ];
                }
                failures.push(...this._visitProviderResolvedValue(resolvedValue, directive));
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
         * Migrates object literal providers which do not use "useValue", "useClass",
         * "useExisting" or "useFactory". These providers behave differently in Ivy. e.g.
         *
         * ```ts
         *   {provide: X} -> {provide: X, useValue: undefined} // this is how it behaves in VE
         *   {provide: X} -> {provide: X, useClass: X} // this is how it behaves in Ivy
         * ```
         *
         * To ensure forward compatibility, we migrate these empty object literal providers
         * to explicitly use `useValue: undefined`.
         */
        _migrateLiteralProviders(literals) {
            for (let { node, resolvedValue } of literals) {
                if (this.visitedProviderLiterals.has(node)) {
                    continue;
                }
                this.visitedProviderLiterals.add(node);
                if (!resolvedValue || !(resolvedValue instanceof Map) || !resolvedValue.has('provide') ||
                    resolvedValue.has('useClass') || resolvedValue.has('useValue') ||
                    resolvedValue.has('useExisting') || resolvedValue.has('useFactory')) {
                    continue;
                }
                const sourceFile = node.getSourceFile();
                const newObjectLiteral = ts.updateObjectLiteral(node, node.properties.concat(ts.createPropertyAssignment('useValue', ts.createIdentifier('undefined'))));
                this.getUpdateRecorder(sourceFile)
                    .updateObjectLiteral(node, this.printer.printNode(ts.EmitHint.Unspecified, newObjectLiteral, sourceFile));
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
                // If a "ClassProvider" has the "deps" property set, then we do not need to
                // decorate the class. This is because the class is instantiated through the
                // specified "deps" and the class does not need a factory definition.
                if (value.has('provide') && value.has('useClass') && value.get('deps') == null) {
                    return this._visitProviderResolvedValue(value.get('useClass'), module);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbWlzc2luZy1pbmplY3RhYmxlL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILHFFQUFrRTtJQUNsRSx5RkFBOEY7SUFDOUYsMkVBQW9GO0lBQ3BGLGlDQUFpQztJQUVqQyxnRkFBK0Q7SUFHL0QsMEdBQStDO0lBQy9DLG9IQUEwRTtJQUkxRSxzRkFBc0Y7SUFDdEYsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBTy9FLE1BQWEsMEJBQTBCO1FBV3JDLFlBQ1ksV0FBMkIsRUFDM0IsaUJBQXdEO1lBRHhELGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXVDO1lBWjVELFlBQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDN0Isa0JBQWEsR0FBRyxJQUFJLDhCQUFhLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUdoRixpRkFBaUY7WUFDekUsMkJBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFFaEUsOEVBQThFO1lBQ3RFLDRCQUF1QixHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1lBS3RFLElBQUksQ0FBQyxrQkFBa0I7Z0JBQ25CLElBQUksd0NBQWtCLENBQUMsSUFBSSxxQ0FBd0IsQ0FBQyxXQUFXLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRUQsYUFBYSxLQUFLLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXZEOzs7V0FHRztRQUNILGNB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QUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQ25FLENBQUMsQ0FBQzthQUN6QjtpQkFBTSxJQUFJLEtBQUssWUFBWSxnQ0FBWSxFQUFFO2dCQUN4QyxPQUFPLENBQUMsRUFBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsd0NBQXdDLEVBQUMsQ0FBQyxDQUFDO2FBQ2hGO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWixDQUFDO0tBQ0Y7SUF2TUQsZ0VBdU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1JlZmVyZW5jZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9pbXBvcnRzJztcbmltcG9ydCB7RHluYW1pY1ZhbHVlLCBSZXNvbHZlZFZhbHVlfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL3BhcnRpYWxfZXZhbHVhdG9yJztcbmltcG9ydCB7VHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0fSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL3JlZmxlY3Rpb24nO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuXG5pbXBvcnQge1Jlc29sdmVkRGlyZWN0aXZlLCBSZXNvbHZlZE5nTW9kdWxlfSBmcm9tICcuL2RlZmluaXRpb25fY29sbGVjdG9yJztcbmltcG9ydCB7SW1wb3J0TWFuYWdlcn0gZnJvbSAnLi9pbXBvcnRfbWFuYWdlcic7XG5pbXBvcnQge1Byb3ZpZGVyTGl0ZXJhbCwgUHJvdmlkZXJzRXZhbHVhdG9yfSBmcm9tICcuL3Byb3ZpZGVyc19ldmFsdWF0b3InO1xuaW1wb3J0IHtVcGRhdGVSZWNvcmRlcn0gZnJvbSAnLi91cGRhdGVfcmVjb3JkZXInO1xuXG5cbi8qKiBOYW1lIG9mIGRlY29yYXRvcnMgd2hpY2ggaW1wbHkgdGhhdCBhIGdpdmVuIGNsYXNzIGRvZXMgbm90IG5lZWQgdG8gYmUgbWlncmF0ZWQuICovXG5jb25zdCBOT19NSUdSQVRFX0RFQ09SQVRPUlMgPSBbJ0luamVjdGFibGUnLCAnRGlyZWN0aXZlJywgJ0NvbXBvbmVudCcsICdQaXBlJ107XG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5hbHlzaXNGYWlsdXJlIHtcbiAgbm9kZTogdHMuTm9kZTtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgTWlzc2luZ0luamVjdGFibGVUcmFuc2Zvcm0ge1xuICBwcml2YXRlIHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIHByaXZhdGUgaW1wb3J0TWFuYWdlciA9IG5ldyBJbXBvcnRNYW5hZ2VyKHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIsIHRoaXMucHJpbnRlcik7XG4gIHByaXZhdGUgcHJvdmlkZXJzRXZhbHVhdG9yOiBQcm92aWRlcnNFdmFsdWF0b3I7XG5cbiAgLyoqIFNldCBvZiBwcm92aWRlciBjbGFzcyBkZWNsYXJhdGlvbnMgd2hpY2ggd2VyZSBhbHJlYWR5IGNoZWNrZWQgb3IgbWlncmF0ZWQuICovXG4gIHByaXZhdGUgdmlzaXRlZFByb3ZpZGVyQ2xhc3NlcyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcblxuICAvKiogU2V0IG9mIHByb3ZpZGVyIG9iamVjdCBsaXRlcmFscyB3aGljaCB3ZXJlIGFscmVhZHkgY2hlY2tlZCBvciBtaWdyYXRlZC4gKi9cbiAgcHJpdmF0ZSB2aXNpdGVkUHJvdmlkZXJMaXRlcmFscyA9IG5ldyBTZXQ8dHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICAgIHByaXZhdGUgZ2V0VXBkYXRlUmVjb3JkZXI6IChzZjogdHMuU291cmNlRmlsZSkgPT4gVXBkYXRlUmVjb3JkZXIpIHtcbiAgICB0aGlzLnByb3ZpZGVyc0V2YWx1YXRvciA9XG4gICAgICAgIG5ldyBQcm92aWRlcnNFdmFsdWF0b3IobmV3IFR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdCh0eXBlQ2hlY2tlciksIHR5cGVDaGVja2VyKTtcbiAgfVxuXG4gIHJlY29yZENoYW5nZXMoKSB7IHRoaXMuaW1wb3J0TWFuYWdlci5yZWNvcmRDaGFuZ2VzKCk7IH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgYWxsIHNwZWNpZmllZCBOZ01vZHVsZSdzIGJ5IHdhbGtpbmcgdGhyb3VnaCByZWZlcmVuY2VkIHByb3ZpZGVyc1xuICAgKiBhbmQgZGVjb3JhdGluZyB0aGVtIHdpdGggXCJASW5qZWN0YWJsZVwiIGlmIG5lZWRlZC5cbiAgICovXG4gIG1pZ3JhdGVNb2R1bGVzKG1vZHVsZXM6IFJlc29sdmVkTmdNb2R1bGVbXSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gbW9kdWxlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMubWlncmF0ZU1vZHVsZShub2RlKSksIFtdIGFzIEFuYWx5c2lzRmFpbHVyZVtdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyBhbGwgc3BlY2lmaWVkIGRpcmVjdGl2ZXMgYnkgd2Fsa2luZyB0aHJvdWdoIHJlZmVyZW5jZWQgcHJvdmlkZXJzXG4gICAqIGFuZCBkZWNvcmF0aW5nIHRoZW0gd2l0aCBcIkBJbmplY3RhYmxlXCIgaWYgbmVlZGVkLlxuICAgKi9cbiAgbWlncmF0ZURpcmVjdGl2ZXMoZGlyZWN0aXZlczogUmVzb2x2ZWREaXJlY3RpdmVbXSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMubWlncmF0ZURpcmVjdGl2ZShub2RlKSksIFtdIGFzIEFuYWx5c2lzRmFpbHVyZVtdKTtcbiAgfVxuXG4gIC8qKiBNaWdyYXRlcyBhIGdpdmVuIE5nTW9kdWxlIGJ5IHdhbGtpbmcgdGhyb3VnaCB0aGUgcmVmZXJlbmNlZCBwcm92aWRlcnMuICovXG4gIG1pZ3JhdGVNb2R1bGUobW9kdWxlOiBSZXNvbHZlZE5nTW9kdWxlKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGlmIChtb2R1bGUucHJvdmlkZXJzRXhwciA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHtyZXNvbHZlZFZhbHVlLCBsaXRlcmFsc30gPSB0aGlzLnByb3ZpZGVyc0V2YWx1YXRvci5ldmFsdWF0ZShtb2R1bGUucHJvdmlkZXJzRXhwcik7XG4gICAgdGhpcy5fbWlncmF0ZUxpdGVyYWxQcm92aWRlcnMobGl0ZXJhbHMpO1xuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc29sdmVkVmFsdWUpKSB7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgbm9kZTogbW9kdWxlLnByb3ZpZGVyc0V4cHIsXG4gICAgICAgIG1lc3NhZ2U6ICdQcm92aWRlcnMgb2YgbW9kdWxlIGFyZSBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLidcbiAgICAgIH1dO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZShyZXNvbHZlZFZhbHVlLCBtb2R1bGUpO1xuICB9XG5cblxuICAvKipcbiAgICogTWlncmF0ZXMgYSBnaXZlbiBkaXJlY3RpdmUgYnkgd2Fsa2luZyB0aHJvdWdoIGRlZmluZWQgcHJvdmlkZXJzLiBUaGlzIG1ldGhvZFxuICAgKiBhbHNvIGhhbmRsZXMgY29tcG9uZW50cyB3aXRoIFwidmlld1Byb3ZpZGVyc1wiIGRlZmluZWQuXG4gICAqL1xuICBtaWdyYXRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogUmVzb2x2ZWREaXJlY3RpdmUpOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgY29uc3QgZmFpbHVyZXM6IEFuYWx5c2lzRmFpbHVyZVtdID0gW107XG5cbiAgICAvLyBNaWdyYXRlIFwicHJvdmlkZXJzXCIgb24gZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cyBpZiBkZWZpbmVkLlxuICAgIGlmIChkaXJlY3RpdmUucHJvdmlkZXJzRXhwcikge1xuICAgICAgY29uc3Qge3Jlc29sdmVkVmFsdWUsIGxpdGVyYWxzfSA9IHRoaXMucHJvdmlkZXJzRXZhbHVhdG9yLmV2YWx1YXRlKGRpcmVjdGl2ZS5wcm92aWRlcnNFeHByKTtcbiAgICAgIHRoaXMuX21pZ3JhdGVMaXRlcmFsUHJvdmlkZXJzKGxpdGVyYWxzKTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZXNvbHZlZFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHtub2RlOiBkaXJlY3RpdmUucHJvdmlkZXJzRXhwciwgbWVzc2FnZTogYFByb3ZpZGVycyBhcmUgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfVxuICAgICAgICBdO1xuICAgICAgfVxuICAgICAgZmFpbHVyZXMucHVzaCguLi50aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZShyZXNvbHZlZFZhbHVlLCBkaXJlY3RpdmUpKTtcbiAgICB9XG5cbiAgICAvLyBNaWdyYXRlIFwidmlld1Byb3ZpZGVyc1wiIG9uIGNvbXBvbmVudHMgaWYgZGVmaW5lZC5cbiAgICBpZiAoZGlyZWN0aXZlLnZpZXdQcm92aWRlcnNFeHByKSB7XG4gICAgICBjb25zdCB7cmVzb2x2ZWRWYWx1ZSwgbGl0ZXJhbHN9ID1cbiAgICAgICAgICB0aGlzLnByb3ZpZGVyc0V2YWx1YXRvci5ldmFsdWF0ZShkaXJlY3RpdmUudmlld1Byb3ZpZGVyc0V4cHIpO1xuICAgICAgdGhpcy5fbWlncmF0ZUxpdGVyYWxQcm92aWRlcnMobGl0ZXJhbHMpO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc29sdmVkVmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAge25vZGU6IGRpcmVjdGl2ZS52aWV3UHJvdmlkZXJzRXhwciwgbWVzc2FnZTogYFByb3ZpZGVycyBhcmUgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfVxuICAgICAgICBdO1xuICAgICAgfVxuICAgICAgZmFpbHVyZXMucHVzaCguLi50aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZShyZXNvbHZlZFZhbHVlLCBkaXJlY3RpdmUpKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhaWx1cmVzO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGEgZ2l2ZW4gcHJvdmlkZXIgY2xhc3MgaWYgaXQgaXMgbm90IGRlY29yYXRlZCB3aXRoXG4gICAqIGFueSBBbmd1bGFyIGRlY29yYXRvci5cbiAgICovXG4gIG1pZ3JhdGVQcm92aWRlckNsYXNzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIGNvbnRleHQ6IFJlc29sdmVkTmdNb2R1bGV8UmVzb2x2ZWREaXJlY3RpdmUpIHtcbiAgICBpZiAodGhpcy52aXNpdGVkUHJvdmlkZXJDbGFzc2VzLmhhcyhub2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnZpc2l0ZWRQcm92aWRlckNsYXNzZXMuYWRkKG5vZGUpO1xuXG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuXG4gICAgLy8gV2UgY2Fubm90IG1pZ3JhdGUgcHJvdmlkZXIgY2xhc3NlcyBvdXRzaWRlIG9mIHNvdXJjZSBmaWxlcy4gVGhpcyBpcyBiZWNhdXNlIHRoZVxuICAgIC8vIG1pZ3JhdGlvbiBmb3IgdGhpcmQtcGFydHkgbGlicmFyeSBmaWxlcyBzaG91bGQgaGFwcGVuIGluIFwibmdjY1wiLCBhbmQgaW4gZ2VuZXJhbFxuICAgIC8vIHdvdWxkIGFsc28gaW52b2x2ZSBtZXRhZGF0YSBwYXJzaW5nLlxuICAgIGlmIChzb3VyY2VGaWxlLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID1cbiAgICAgICAgbm9kZS5kZWNvcmF0b3JzID8gZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKSA6IG51bGw7XG5cbiAgICBpZiAobmdEZWNvcmF0b3JzICE9PSBudWxsICYmXG4gICAgICAgIG5nRGVjb3JhdG9ycy5zb21lKGQgPT4gTk9fTUlHUkFURV9ERUNPUkFUT1JTLmluZGV4T2YoZC5uYW1lKSAhPT0gLTEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlUmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGUpO1xuICAgIGNvbnN0IGltcG9ydEV4cHIgPVxuICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKHNvdXJjZUZpbGUsICdJbmplY3RhYmxlJywgJ0Bhbmd1bGFyL2NvcmUnKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JFeHByID0gdHMuY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoaW1wb3J0RXhwciwgdW5kZWZpbmVkLCB1bmRlZmluZWQpKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JUZXh0ID1cbiAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yRXhwciwgc291cmNlRmlsZSk7XG5cblxuICAgIC8vIEluIGNhc2UgdGhlIGNsYXNzIGlzIGFscmVhZHkgZGVjb3JhdGVkIHdpdGggXCJASW5qZWN0KC4uKVwiLCB3ZSByZXBsYWNlIHRoZSBcIkBJbmplY3RcIlxuICAgIC8vIGRlY29yYXRvciB3aXRoIFwiQEluamVjdGFibGUoKVwiIHNpbmNlIHVzaW5nIFwiQEluamVjdCguLilcIiBvbiBhIGNsYXNzIGlzIGEgbm9vcCBhbmRcbiAgICAvLyBtb3N0IGxpa2VseSB3YXMgbWVhbnQgdG8gYmUgXCJASW5qZWN0YWJsZSgpXCIuXG4gICAgY29uc3QgZXhpc3RpbmdJbmplY3REZWNvcmF0b3IgPVxuICAgICAgICBuZ0RlY29yYXRvcnMgIT09IG51bGwgPyBuZ0RlY29yYXRvcnMuZmluZChkID0+IGQubmFtZSA9PT0gJ0luamVjdCcpIDogbnVsbDtcbiAgICBpZiAoZXhpc3RpbmdJbmplY3REZWNvcmF0b3IpIHtcbiAgICAgIHVwZGF0ZVJlY29yZGVyLnJlcGxhY2VEZWNvcmF0b3IoZXhpc3RpbmdJbmplY3REZWNvcmF0b3Iubm9kZSwgbmV3RGVjb3JhdG9yVGV4dCwgY29udGV4dC5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlUmVjb3JkZXIuYWRkQ2xhc3NEZWNvcmF0b3Iobm9kZSwgbmV3RGVjb3JhdG9yVGV4dCwgY29udGV4dC5uYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgb2JqZWN0IGxpdGVyYWwgcHJvdmlkZXJzIHdoaWNoIGRvIG5vdCB1c2UgXCJ1c2VWYWx1ZVwiLCBcInVzZUNsYXNzXCIsXG4gICAqIFwidXNlRXhpc3RpbmdcIiBvciBcInVzZUZhY3RvcnlcIi4gVGhlc2UgcHJvdmlkZXJzIGJlaGF2ZSBkaWZmZXJlbnRseSBpbiBJdnkuIGUuZy5cbiAgICpcbiAgICogYGBgdHNcbiAgICogICB7cHJvdmlkZTogWH0gLT4ge3Byb3ZpZGU6IFgsIHVzZVZhbHVlOiB1bmRlZmluZWR9IC8vIHRoaXMgaXMgaG93IGl0IGJlaGF2ZXMgaW4gVkVcbiAgICogICB7cHJvdmlkZTogWH0gLT4ge3Byb3ZpZGU6IFgsIHVzZUNsYXNzOiBYfSAvLyB0aGlzIGlzIGhvdyBpdCBiZWhhdmVzIGluIEl2eVxuICAgKiBgYGBcbiAgICpcbiAgICogVG8gZW5zdXJlIGZvcndhcmQgY29tcGF0aWJpbGl0eSwgd2UgbWlncmF0ZSB0aGVzZSBlbXB0eSBvYmplY3QgbGl0ZXJhbCBwcm92aWRlcnNcbiAgICogdG8gZXhwbGljaXRseSB1c2UgYHVzZVZhbHVlOiB1bmRlZmluZWRgLlxuICAgKi9cbiAgcHJpdmF0ZSBfbWlncmF0ZUxpdGVyYWxQcm92aWRlcnMobGl0ZXJhbHM6IFByb3ZpZGVyTGl0ZXJhbFtdKSB7XG4gICAgZm9yIChsZXQge25vZGUsIHJlc29sdmVkVmFsdWV9IG9mIGxpdGVyYWxzKSB7XG4gICAgICBpZiAodGhpcy52aXNpdGVkUHJvdmlkZXJMaXRlcmFscy5oYXMobm9kZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLnZpc2l0ZWRQcm92aWRlckxpdGVyYWxzLmFkZChub2RlKTtcblxuICAgICAgaWYgKCFyZXNvbHZlZFZhbHVlIHx8ICEocmVzb2x2ZWRWYWx1ZSBpbnN0YW5jZW9mIE1hcCkgfHwgIXJlc29sdmVkVmFsdWUuaGFzKCdwcm92aWRlJykgfHxcbiAgICAgICAgICByZXNvbHZlZFZhbHVlLmhhcygndXNlQ2xhc3MnKSB8fCByZXNvbHZlZFZhbHVlLmhhcygndXNlVmFsdWUnKSB8fFxuICAgICAgICAgIHJlc29sdmVkVmFsdWUuaGFzKCd1c2VFeGlzdGluZycpIHx8IHJlc29sdmVkVmFsdWUuaGFzKCd1c2VGYWN0b3J5JykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIGNvbnN0IG5ld09iamVjdExpdGVyYWwgPSB0cy51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICAgIG5vZGUsIG5vZGUucHJvcGVydGllcy5jb25jYXQoXG4gICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudCgndXNlVmFsdWUnLCB0cy5jcmVhdGVJZGVudGlmaWVyKCd1bmRlZmluZWQnKSkpKTtcblxuICAgICAgdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKVxuICAgICAgICAgIC51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICAgICAgICBub2RlLCB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdPYmplY3RMaXRlcmFsLCBzb3VyY2VGaWxlKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZpc2l0cyB0aGUgZ2l2ZW4gcmVzb2x2ZWQgdmFsdWUgb2YgYSBwcm92aWRlci4gUHJvdmlkZXJzIGNhbiBiZSBuZXN0ZWQgaW5cbiAgICogYXJyYXlzIGFuZCB3ZSBuZWVkIHRvIHJlY3Vyc2l2ZWx5IHdhbGsgdGhyb3VnaCB0aGUgcHJvdmlkZXJzIHRvIGJlIGFibGUgdG9cbiAgICogbWlncmF0ZSBhbGwgcmVmZXJlbmNlZCBwcm92aWRlciBjbGFzc2VzLiBlLmcuIFwicHJvdmlkZXJzOiBbW0EsIFtCXV1dXCIuXG4gICAqL1xuICBwcml2YXRlIF92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZSh2YWx1ZTogUmVzb2x2ZWRWYWx1ZSwgbW9kdWxlOiBSZXNvbHZlZE5nTW9kdWxlKTpcbiAgICAgIEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWZlcmVuY2UgJiYgdHMuaXNDbGFzc0RlY2xhcmF0aW9uKHZhbHVlLm5vZGUpKSB7XG4gICAgICB0aGlzLm1pZ3JhdGVQcm92aWRlckNsYXNzKHZhbHVlLm5vZGUsIG1vZHVsZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgLy8gSWYgYSBcIkNsYXNzUHJvdmlkZXJcIiBoYXMgdGhlIFwiZGVwc1wiIHByb3BlcnR5IHNldCwgdGhlbiB3ZSBkbyBub3QgbmVlZCB0b1xuICAgICAgLy8gZGVjb3JhdGUgdGhlIGNsYXNzLiBUaGlzIGlzIGJlY2F1c2UgdGhlIGNsYXNzIGlzIGluc3RhbnRpYXRlZCB0aHJvdWdoIHRoZVxuICAgICAgLy8gc3BlY2lmaWVkIFwiZGVwc1wiIGFuZCB0aGUgY2xhc3MgZG9lcyBub3QgbmVlZCBhIGZhY3RvcnkgZGVmaW5pdGlvbi5cbiAgICAgIGlmICh2YWx1ZS5oYXMoJ3Byb3ZpZGUnKSAmJiB2YWx1ZS5oYXMoJ3VzZUNsYXNzJykgJiYgdmFsdWUuZ2V0KCdkZXBzJykgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodmFsdWUuZ2V0KCd1c2VDbGFzcycpICEsIG1vZHVsZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlLnJlZHVjZSgocmVzLCB2KSA9PiByZXMuY29uY2F0KHRoaXMuX3Zpc2l0UHJvdmlkZXJSZXNvbHZlZFZhbHVlKHYsIG1vZHVsZSkpLCBbXG4gICAgICBdIGFzIEFuYWx5c2lzRmFpbHVyZVtdKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgRHluYW1pY1ZhbHVlKSB7XG4gICAgICByZXR1cm4gW3tub2RlOiB2YWx1ZS5ub2RlLCBtZXNzYWdlOiBgUHJvdmlkZXIgaXMgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfV07XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxufVxuIl19