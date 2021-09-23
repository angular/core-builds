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
        define("@angular/core/schematics/migrations/missing-injectable/transform", ["require", "exports", "@angular/compiler-cli/src/ngtsc/imports", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "typescript", "@angular/core/schematics/utils/import_manager", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/migrations/missing-injectable/providers_evaluator"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MissingInjectableTransform = void 0;
    const imports_1 = require("@angular/compiler-cli/src/ngtsc/imports");
    const partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    const reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    const ts = require("typescript");
    const import_manager_1 = require("@angular/core/schematics/utils/import_manager");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const providers_evaluator_1 = require("@angular/core/schematics/migrations/missing-injectable/providers_evaluator");
    /**
     * Name of decorators which imply that a given class does not need to be migrated.
     *    - `@Injectable`, `@Directive`, `@Component` and `@Pipe` instruct the compiler
     *       to generate a factory definition.
     *    - `@NgModule` instructs the compiler to generate a provider definition that holds
     *       the factory function.
     */
    const NO_MIGRATE_DECORATORS = ['Injectable', 'Directive', 'Component', 'Pipe', 'NgModule'];
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
            this.providersEvaluator = new providers_evaluator_1.ProvidersEvaluator(new reflection_1.TypeScriptReflectionHost(typeChecker), typeChecker, /* dependencyTracker */ null);
        }
        recordChanges() {
            this.importManager.recordChanges();
        }
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
                return [
                    { node: module.providersExpr, message: 'Providers of module are not statically analyzable.' }
                ];
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
            const ngDecorators = node.decorators ? (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, node.decorators) : null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbWlzc2luZy1pbmplY3RhYmxlL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxxRUFBa0U7SUFDbEUseUZBQThGO0lBQzlGLDJFQUFvRjtJQUNwRixpQ0FBaUM7SUFFakMsa0ZBQXlEO0lBQ3pELGdGQUErRDtJQUcvRCxvSEFBMEU7SUFHMUU7Ozs7OztPQU1HO0lBQ0gsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztJQU8zRixNQUFhLDBCQUEwQjtRQVdyQyxZQUNZLFdBQTJCLEVBQzNCLGlCQUF3RDtZQUR4RCxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF1QztZQVo1RCxZQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzdCLGtCQUFhLEdBQUcsSUFBSSw4QkFBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFHaEYsaUZBQWlGO1lBQ3pFLDJCQUFzQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBRWhFLDhFQUE4RTtZQUN0RSw0QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztZQUt0RSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSx3Q0FBa0IsQ0FDNUMsSUFBSSxxQ0FBd0IsQ0FBQyxXQUFXLENBQUMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVELGFBQWE7WUFDWCxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxD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QUUsTUFBTSxDQUFDLENBQUM7aUJBQ3pFO2FBQ0Y7aUJBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMvQixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQ2YsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFDbkUsRUFBdUIsQ0FBQyxDQUFDO2FBQzlCO2lCQUFNLElBQUksS0FBSyxZQUFZLGdDQUFZLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSx3Q0FBd0MsRUFBQyxDQUFDLENBQUM7YUFDaEY7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7S0FDRjtJQTFNRCxnRUEwTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZWZlcmVuY2V9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvaW1wb3J0cyc7XG5pbXBvcnQge0R5bmFtaWNWYWx1ZSwgUmVzb2x2ZWRWYWx1ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9wYXJ0aWFsX2V2YWx1YXRvcic7XG5pbXBvcnQge1R5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9yZWZsZWN0aW9uJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0ltcG9ydE1hbmFnZXJ9IGZyb20gJy4uLy4uL3V0aWxzL2ltcG9ydF9tYW5hZ2VyJztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuXG5pbXBvcnQge1Jlc29sdmVkRGlyZWN0aXZlLCBSZXNvbHZlZE5nTW9kdWxlfSBmcm9tICcuL2RlZmluaXRpb25fY29sbGVjdG9yJztcbmltcG9ydCB7UHJvdmlkZXJMaXRlcmFsLCBQcm92aWRlcnNFdmFsdWF0b3J9IGZyb20gJy4vcHJvdmlkZXJzX2V2YWx1YXRvcic7XG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbi8qKlxuICogTmFtZSBvZiBkZWNvcmF0b3JzIHdoaWNoIGltcGx5IHRoYXQgYSBnaXZlbiBjbGFzcyBkb2VzIG5vdCBuZWVkIHRvIGJlIG1pZ3JhdGVkLlxuICogICAgLSBgQEluamVjdGFibGVgLCBgQERpcmVjdGl2ZWAsIGBAQ29tcG9uZW50YCBhbmQgYEBQaXBlYCBpbnN0cnVjdCB0aGUgY29tcGlsZXJcbiAqICAgICAgIHRvIGdlbmVyYXRlIGEgZmFjdG9yeSBkZWZpbml0aW9uLlxuICogICAgLSBgQE5nTW9kdWxlYCBpbnN0cnVjdHMgdGhlIGNvbXBpbGVyIHRvIGdlbmVyYXRlIGEgcHJvdmlkZXIgZGVmaW5pdGlvbiB0aGF0IGhvbGRzXG4gKiAgICAgICB0aGUgZmFjdG9yeSBmdW5jdGlvbi5cbiAqL1xuY29uc3QgTk9fTUlHUkFURV9ERUNPUkFUT1JTID0gWydJbmplY3RhYmxlJywgJ0RpcmVjdGl2ZScsICdDb21wb25lbnQnLCAnUGlwZScsICdOZ01vZHVsZSddO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5c2lzRmFpbHVyZSB7XG4gIG5vZGU6IHRzLk5vZGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIE1pc3NpbmdJbmplY3RhYmxlVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBwcml2YXRlIGltcG9ydE1hbmFnZXIgPSBuZXcgSW1wb3J0TWFuYWdlcih0aGlzLmdldFVwZGF0ZVJlY29yZGVyLCB0aGlzLnByaW50ZXIpO1xuICBwcml2YXRlIHByb3ZpZGVyc0V2YWx1YXRvcjogUHJvdmlkZXJzRXZhbHVhdG9yO1xuXG4gIC8qKiBTZXQgb2YgcHJvdmlkZXIgY2xhc3MgZGVjbGFyYXRpb25zIHdoaWNoIHdlcmUgYWxyZWFkeSBjaGVja2VkIG9yIG1pZ3JhdGVkLiAqL1xuICBwcml2YXRlIHZpc2l0ZWRQcm92aWRlckNsYXNzZXMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG5cbiAgLyoqIFNldCBvZiBwcm92aWRlciBvYmplY3QgbGl0ZXJhbHMgd2hpY2ggd2VyZSBhbHJlYWR5IGNoZWNrZWQgb3IgbWlncmF0ZWQuICovXG4gIHByaXZhdGUgdmlzaXRlZFByb3ZpZGVyTGl0ZXJhbHMgPSBuZXcgU2V0PHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIGdldFVwZGF0ZVJlY29yZGVyOiAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IFVwZGF0ZVJlY29yZGVyKSB7XG4gICAgdGhpcy5wcm92aWRlcnNFdmFsdWF0b3IgPSBuZXcgUHJvdmlkZXJzRXZhbHVhdG9yKFxuICAgICAgICBuZXcgVHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0KHR5cGVDaGVja2VyKSwgdHlwZUNoZWNrZXIsIC8qIGRlcGVuZGVuY3lUcmFja2VyICovIG51bGwpO1xuICB9XG5cbiAgcmVjb3JkQ2hhbmdlcygpIHtcbiAgICB0aGlzLmltcG9ydE1hbmFnZXIucmVjb3JkQ2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGFsbCBzcGVjaWZpZWQgTmdNb2R1bGUncyBieSB3YWxraW5nIHRocm91Z2ggcmVmZXJlbmNlZCBwcm92aWRlcnNcbiAgICogYW5kIGRlY29yYXRpbmcgdGhlbSB3aXRoIFwiQEluamVjdGFibGVcIiBpZiBuZWVkZWQuXG4gICAqL1xuICBtaWdyYXRlTW9kdWxlcyhtb2R1bGVzOiBSZXNvbHZlZE5nTW9kdWxlW10pOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIG1vZHVsZXMucmVkdWNlKFxuICAgICAgICAoZmFpbHVyZXMsIG5vZGUpID0+IGZhaWx1cmVzLmNvbmNhdCh0aGlzLm1pZ3JhdGVNb2R1bGUobm9kZSkpLCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSk7XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgYWxsIHNwZWNpZmllZCBkaXJlY3RpdmVzIGJ5IHdhbGtpbmcgdGhyb3VnaCByZWZlcmVuY2VkIHByb3ZpZGVyc1xuICAgKiBhbmQgZGVjb3JhdGluZyB0aGVtIHdpdGggXCJASW5qZWN0YWJsZVwiIGlmIG5lZWRlZC5cbiAgICovXG4gIG1pZ3JhdGVEaXJlY3RpdmVzKGRpcmVjdGl2ZXM6IFJlc29sdmVkRGlyZWN0aXZlW10pOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZXMucmVkdWNlKFxuICAgICAgICAoZmFpbHVyZXMsIG5vZGUpID0+IGZhaWx1cmVzLmNvbmNhdCh0aGlzLm1pZ3JhdGVEaXJlY3RpdmUobm9kZSkpLCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSk7XG4gIH1cblxuICAvKiogTWlncmF0ZXMgYSBnaXZlbiBOZ01vZHVsZSBieSB3YWxraW5nIHRocm91Z2ggdGhlIHJlZmVyZW5jZWQgcHJvdmlkZXJzLiAqL1xuICBtaWdyYXRlTW9kdWxlKG1vZHVsZTogUmVzb2x2ZWROZ01vZHVsZSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICBpZiAobW9kdWxlLnByb3ZpZGVyc0V4cHIgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCB7cmVzb2x2ZWRWYWx1ZSwgbGl0ZXJhbHN9ID0gdGhpcy5wcm92aWRlcnNFdmFsdWF0b3IuZXZhbHVhdGUobW9kdWxlLnByb3ZpZGVyc0V4cHIpO1xuICAgIHRoaXMuX21pZ3JhdGVMaXRlcmFsUHJvdmlkZXJzKGxpdGVyYWxzKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShyZXNvbHZlZFZhbHVlKSkge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAge25vZGU6IG1vZHVsZS5wcm92aWRlcnNFeHByLCBtZXNzYWdlOiAnUHJvdmlkZXJzIG9mIG1vZHVsZSBhcmUgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS4nfVxuICAgICAgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUocmVzb2x2ZWRWYWx1ZSwgbW9kdWxlKTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGEgZ2l2ZW4gZGlyZWN0aXZlIGJ5IHdhbGtpbmcgdGhyb3VnaCBkZWZpbmVkIHByb3ZpZGVycy4gVGhpcyBtZXRob2RcbiAgICogYWxzbyBoYW5kbGVzIGNvbXBvbmVudHMgd2l0aCBcInZpZXdQcm92aWRlcnNcIiBkZWZpbmVkLlxuICAgKi9cbiAgbWlncmF0ZURpcmVjdGl2ZShkaXJlY3RpdmU6IFJlc29sdmVkRGlyZWN0aXZlKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGNvbnN0IGZhaWx1cmVzOiBBbmFseXNpc0ZhaWx1cmVbXSA9IFtdO1xuXG4gICAgLy8gTWlncmF0ZSBcInByb3ZpZGVyc1wiIG9uIGRpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudHMgaWYgZGVmaW5lZC5cbiAgICBpZiAoZGlyZWN0aXZlLnByb3ZpZGVyc0V4cHIpIHtcbiAgICAgIGNvbnN0IHtyZXNvbHZlZFZhbHVlLCBsaXRlcmFsc30gPSB0aGlzLnByb3ZpZGVyc0V2YWx1YXRvci5ldmFsdWF0ZShkaXJlY3RpdmUucHJvdmlkZXJzRXhwcik7XG4gICAgICB0aGlzLl9taWdyYXRlTGl0ZXJhbFByb3ZpZGVycyhsaXRlcmFscyk7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVzb2x2ZWRWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICB7bm9kZTogZGlyZWN0aXZlLnByb3ZpZGVyc0V4cHIsIG1lc3NhZ2U6IGBQcm92aWRlcnMgYXJlIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuYH1cbiAgICAgICAgXTtcbiAgICAgIH1cbiAgICAgIGZhaWx1cmVzLnB1c2goLi4udGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUocmVzb2x2ZWRWYWx1ZSwgZGlyZWN0aXZlKSk7XG4gICAgfVxuXG4gICAgLy8gTWlncmF0ZSBcInZpZXdQcm92aWRlcnNcIiBvbiBjb21wb25lbnRzIGlmIGRlZmluZWQuXG4gICAgaWYgKGRpcmVjdGl2ZS52aWV3UHJvdmlkZXJzRXhwcikge1xuICAgICAgY29uc3Qge3Jlc29sdmVkVmFsdWUsIGxpdGVyYWxzfSA9XG4gICAgICAgICAgdGhpcy5wcm92aWRlcnNFdmFsdWF0b3IuZXZhbHVhdGUoZGlyZWN0aXZlLnZpZXdQcm92aWRlcnNFeHByKTtcbiAgICAgIHRoaXMuX21pZ3JhdGVMaXRlcmFsUHJvdmlkZXJzKGxpdGVyYWxzKTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZXNvbHZlZFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHtub2RlOiBkaXJlY3RpdmUudmlld1Byb3ZpZGVyc0V4cHIsIG1lc3NhZ2U6IGBQcm92aWRlcnMgYXJlIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuYH1cbiAgICAgICAgXTtcbiAgICAgIH1cbiAgICAgIGZhaWx1cmVzLnB1c2goLi4udGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUocmVzb2x2ZWRWYWx1ZSwgZGlyZWN0aXZlKSk7XG4gICAgfVxuICAgIHJldHVybiBmYWlsdXJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyBhIGdpdmVuIHByb3ZpZGVyIGNsYXNzIGlmIGl0IGlzIG5vdCBkZWNvcmF0ZWQgd2l0aFxuICAgKiBhbnkgQW5ndWxhciBkZWNvcmF0b3IuXG4gICAqL1xuICBtaWdyYXRlUHJvdmlkZXJDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBjb250ZXh0OiBSZXNvbHZlZE5nTW9kdWxlfFJlc29sdmVkRGlyZWN0aXZlKSB7XG4gICAgaWYgKHRoaXMudmlzaXRlZFByb3ZpZGVyQ2xhc3Nlcy5oYXMobm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy52aXNpdGVkUHJvdmlkZXJDbGFzc2VzLmFkZChub2RlKTtcblxuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcblxuICAgIC8vIFdlIGNhbm5vdCBtaWdyYXRlIHByb3ZpZGVyIGNsYXNzZXMgb3V0c2lkZSBvZiBzb3VyY2UgZmlsZXMuIFRoaXMgaXMgYmVjYXVzZSB0aGVcbiAgICAvLyBtaWdyYXRpb24gZm9yIHRoaXJkLXBhcnR5IGxpYnJhcnkgZmlsZXMgc2hvdWxkIGhhcHBlbiBpbiBcIm5nY2NcIiwgYW5kIGluIGdlbmVyYWxcbiAgICAvLyB3b3VsZCBhbHNvIGludm9sdmUgbWV0YWRhdGEgcGFyc2luZy5cbiAgICBpZiAoc291cmNlRmlsZS5pc0RlY2xhcmF0aW9uRmlsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5nRGVjb3JhdG9ycyA9XG4gICAgICAgIG5vZGUuZGVjb3JhdG9ycyA/IGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuZGVjb3JhdG9ycykgOiBudWxsO1xuXG4gICAgaWYgKG5nRGVjb3JhdG9ycyAhPT0gbnVsbCAmJlxuICAgICAgICBuZ0RlY29yYXRvcnMuc29tZShkID0+IE5PX01JR1JBVEVfREVDT1JBVE9SUy5pbmRleE9mKGQubmFtZSkgIT09IC0xKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZVJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKTtcbiAgICBjb25zdCBpbXBvcnRFeHByID1cbiAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShzb3VyY2VGaWxlLCAnSW5qZWN0YWJsZScsICdAYW5ndWxhci9jb3JlJyk7XG4gICAgY29uc3QgbmV3RGVjb3JhdG9yRXhwciA9IHRzLmNyZWF0ZURlY29yYXRvcih0cy5jcmVhdGVDYWxsKGltcG9ydEV4cHIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKSk7XG4gICAgY29uc3QgbmV3RGVjb3JhdG9yVGV4dCA9XG4gICAgICAgIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0RlY29yYXRvckV4cHIsIHNvdXJjZUZpbGUpO1xuXG5cbiAgICAvLyBJbiBjYXNlIHRoZSBjbGFzcyBpcyBhbHJlYWR5IGRlY29yYXRlZCB3aXRoIFwiQEluamVjdCguLilcIiwgd2UgcmVwbGFjZSB0aGUgXCJASW5qZWN0XCJcbiAgICAvLyBkZWNvcmF0b3Igd2l0aCBcIkBJbmplY3RhYmxlKClcIiBzaW5jZSB1c2luZyBcIkBJbmplY3QoLi4pXCIgb24gYSBjbGFzcyBpcyBhIG5vb3AgYW5kXG4gICAgLy8gbW9zdCBsaWtlbHkgd2FzIG1lYW50IHRvIGJlIFwiQEluamVjdGFibGUoKVwiLlxuICAgIGNvbnN0IGV4aXN0aW5nSW5qZWN0RGVjb3JhdG9yID1cbiAgICAgICAgbmdEZWNvcmF0b3JzICE9PSBudWxsID8gbmdEZWNvcmF0b3JzLmZpbmQoZCA9PiBkLm5hbWUgPT09ICdJbmplY3QnKSA6IG51bGw7XG4gICAgaWYgKGV4aXN0aW5nSW5qZWN0RGVjb3JhdG9yKSB7XG4gICAgICB1cGRhdGVSZWNvcmRlci5yZXBsYWNlRGVjb3JhdG9yKGV4aXN0aW5nSW5qZWN0RGVjb3JhdG9yLm5vZGUsIG5ld0RlY29yYXRvclRleHQsIGNvbnRleHQubmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZVJlY29yZGVyLmFkZENsYXNzRGVjb3JhdG9yKG5vZGUsIG5ld0RlY29yYXRvclRleHQsIGNvbnRleHQubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIG9iamVjdCBsaXRlcmFsIHByb3ZpZGVycyB3aGljaCBkbyBub3QgdXNlIFwidXNlVmFsdWVcIiwgXCJ1c2VDbGFzc1wiLFxuICAgKiBcInVzZUV4aXN0aW5nXCIgb3IgXCJ1c2VGYWN0b3J5XCIuIFRoZXNlIHByb3ZpZGVycyBiZWhhdmUgZGlmZmVyZW50bHkgaW4gSXZ5LiBlLmcuXG4gICAqXG4gICAqIGBgYHRzXG4gICAqICAge3Byb3ZpZGU6IFh9IC0+IHtwcm92aWRlOiBYLCB1c2VWYWx1ZTogdW5kZWZpbmVkfSAvLyB0aGlzIGlzIGhvdyBpdCBiZWhhdmVzIGluIFZFXG4gICAqICAge3Byb3ZpZGU6IFh9IC0+IHtwcm92aWRlOiBYLCB1c2VDbGFzczogWH0gLy8gdGhpcyBpcyBob3cgaXQgYmVoYXZlcyBpbiBJdnlcbiAgICogYGBgXG4gICAqXG4gICAqIFRvIGVuc3VyZSBmb3J3YXJkIGNvbXBhdGliaWxpdHksIHdlIG1pZ3JhdGUgdGhlc2UgZW1wdHkgb2JqZWN0IGxpdGVyYWwgcHJvdmlkZXJzXG4gICAqIHRvIGV4cGxpY2l0bHkgdXNlIGB1c2VWYWx1ZTogdW5kZWZpbmVkYC5cbiAgICovXG4gIHByaXZhdGUgX21pZ3JhdGVMaXRlcmFsUHJvdmlkZXJzKGxpdGVyYWxzOiBQcm92aWRlckxpdGVyYWxbXSkge1xuICAgIGZvciAobGV0IHtub2RlLCByZXNvbHZlZFZhbHVlfSBvZiBsaXRlcmFscykge1xuICAgICAgaWYgKHRoaXMudmlzaXRlZFByb3ZpZGVyTGl0ZXJhbHMuaGFzKG5vZGUpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdGhpcy52aXNpdGVkUHJvdmlkZXJMaXRlcmFscy5hZGQobm9kZSk7XG5cbiAgICAgIGlmICghcmVzb2x2ZWRWYWx1ZSB8fCAhKHJlc29sdmVkVmFsdWUgaW5zdGFuY2VvZiBNYXApIHx8ICFyZXNvbHZlZFZhbHVlLmhhcygncHJvdmlkZScpIHx8XG4gICAgICAgICAgcmVzb2x2ZWRWYWx1ZS5oYXMoJ3VzZUNsYXNzJykgfHwgcmVzb2x2ZWRWYWx1ZS5oYXMoJ3VzZVZhbHVlJykgfHxcbiAgICAgICAgICByZXNvbHZlZFZhbHVlLmhhcygndXNlRXhpc3RpbmcnKSB8fCByZXNvbHZlZFZhbHVlLmhhcygndXNlRmFjdG9yeScpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgICBjb25zdCBuZXdPYmplY3RMaXRlcmFsID0gdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG5vZGUucHJvcGVydGllcy5jb25jYXQoXG4gICAgICAgICAgICAgIHRzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudCgndXNlVmFsdWUnLCB0cy5jcmVhdGVJZGVudGlmaWVyKCd1bmRlZmluZWQnKSkpKTtcblxuICAgICAgdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKVxuICAgICAgICAgIC51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICAgICAgICBub2RlLCB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdPYmplY3RMaXRlcmFsLCBzb3VyY2VGaWxlKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZpc2l0cyB0aGUgZ2l2ZW4gcmVzb2x2ZWQgdmFsdWUgb2YgYSBwcm92aWRlci4gUHJvdmlkZXJzIGNhbiBiZSBuZXN0ZWQgaW5cbiAgICogYXJyYXlzIGFuZCB3ZSBuZWVkIHRvIHJlY3Vyc2l2ZWx5IHdhbGsgdGhyb3VnaCB0aGUgcHJvdmlkZXJzIHRvIGJlIGFibGUgdG9cbiAgICogbWlncmF0ZSBhbGwgcmVmZXJlbmNlZCBwcm92aWRlciBjbGFzc2VzLiBlLmcuIFwicHJvdmlkZXJzOiBbW0EsIFtCXV1dXCIuXG4gICAqL1xuICBwcml2YXRlIF92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZSh2YWx1ZTogUmVzb2x2ZWRWYWx1ZSwgbW9kdWxlOiBSZXNvbHZlZE5nTW9kdWxlKTpcbiAgICAgIEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWZlcmVuY2UgJiYgdHMuaXNDbGFzc0RlY2xhcmF0aW9uKHZhbHVlLm5vZGUpKSB7XG4gICAgICB0aGlzLm1pZ3JhdGVQcm92aWRlckNsYXNzKHZhbHVlLm5vZGUsIG1vZHVsZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgLy8gSWYgYSBcIkNsYXNzUHJvdmlkZXJcIiBoYXMgdGhlIFwiZGVwc1wiIHByb3BlcnR5IHNldCwgdGhlbiB3ZSBkbyBub3QgbmVlZCB0b1xuICAgICAgLy8gZGVjb3JhdGUgdGhlIGNsYXNzLiBUaGlzIGlzIGJlY2F1c2UgdGhlIGNsYXNzIGlzIGluc3RhbnRpYXRlZCB0aHJvdWdoIHRoZVxuICAgICAgLy8gc3BlY2lmaWVkIFwiZGVwc1wiIGFuZCB0aGUgY2xhc3MgZG9lcyBub3QgbmVlZCBhIGZhY3RvcnkgZGVmaW5pdGlvbi5cbiAgICAgIGlmICh2YWx1ZS5oYXMoJ3Byb3ZpZGUnKSAmJiB2YWx1ZS5oYXMoJ3VzZUNsYXNzJykgJiYgdmFsdWUuZ2V0KCdkZXBzJykgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodmFsdWUuZ2V0KCd1c2VDbGFzcycpISwgbW9kdWxlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICByZXR1cm4gdmFsdWUucmVkdWNlKFxuICAgICAgICAgIChyZXMsIHYpID0+IHJlcy5jb25jYXQodGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodiwgbW9kdWxlKSksXG4gICAgICAgICAgW10gYXMgQW5hbHlzaXNGYWlsdXJlW10pO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBEeW5hbWljVmFsdWUpIHtcbiAgICAgIHJldHVybiBbe25vZGU6IHZhbHVlLm5vZGUsIG1lc3NhZ2U6IGBQcm92aWRlciBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9XTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXX0=