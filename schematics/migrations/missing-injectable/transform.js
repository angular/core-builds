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
        define("@angular/core/schematics/migrations/missing-injectable/transform", ["require", "exports", "typescript", "@angular/core/schematics/utils/import_manager", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/migrations/missing-injectable/providers_evaluator"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MissingInjectableTransform = void 0;
    const typescript_1 = __importDefault(require("typescript"));
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
        constructor(typeChecker, getUpdateRecorder, compilerCliMigrationsModule) {
            this.typeChecker = typeChecker;
            this.getUpdateRecorder = getUpdateRecorder;
            this.compilerCliMigrationsModule = compilerCliMigrationsModule;
            this.printer = typescript_1.default.createPrinter();
            this.importManager = new import_manager_1.ImportManager(this.getUpdateRecorder, this.printer);
            /** Set of provider class declarations which were already checked or migrated. */
            this.visitedProviderClasses = new Set();
            /** Set of provider object literals which were already checked or migrated. */
            this.visitedProviderLiterals = new Set();
            this.providersEvaluator = (0, providers_evaluator_1.createProvidersEvaluator)(compilerCliMigrationsModule, new compilerCliMigrationsModule.TypeScriptReflectionHost(typeChecker), typeChecker);
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
            const newDecoratorExpr = typescript_1.default.createDecorator(typescript_1.default.createCall(importExpr, undefined, undefined));
            const newDecoratorText = this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newDecoratorExpr, sourceFile);
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
                const newObjectLiteral = typescript_1.default.updateObjectLiteral(node, node.properties.concat(typescript_1.default.createPropertyAssignment('useValue', typescript_1.default.createIdentifier('undefined'))));
                this.getUpdateRecorder(sourceFile)
                    .updateObjectLiteral(node, this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newObjectLiteral, sourceFile));
            }
        }
        /**
         * Visits the given resolved value of a provider. Providers can be nested in
         * arrays and we need to recursively walk through the providers to be able to
         * migrate all referenced provider classes. e.g. "providers: [[A, [B]]]".
         */
        _visitProviderResolvedValue(value, module) {
            if (value instanceof this.compilerCliMigrationsModule.Reference &&
                typescript_1.default.isClassDeclaration(value.node)) {
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
            else if (value instanceof this.compilerCliMigrationsModule.DynamicValue) {
                return [{ node: value.node, message: `Provider is not statically analyzable.` }];
            }
            return [];
        }
    }
    exports.MissingInjectableTransform = MissingInjectableTransform;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbWlzc2luZy1pbmplY3RhYmxlL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSCw0REFBNEI7SUFFNUIsa0ZBQXlEO0lBQ3pELGdGQUErRDtJQUcvRCxvSEFBZ0Y7SUFHaEY7Ozs7OztPQU1HO0lBQ0gsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztJQU8zRixNQUFhLDBCQUEwQjtRQVdyQyxZQUNZLFdBQTJCLEVBQzNCLGlCQUF3RCxFQUN4RCwyQkFDcUQ7WUFIckQsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUM7WUFDeEQsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUMwQjtZQWR6RCxZQUFPLEdBQUcsb0JBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM3QixrQkFBYSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBR2hGLGlGQUFpRjtZQUN6RSwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztZQUVoRSw4RUFBOEU7WUFDdEUsNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7WUFPdEUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUEsOENBQXdCLEVBQzlDLDJCQUEyQixFQUMzQixJQUFJLDJCQUEyQixDQUFDLHdCQUF3QixDQUFDLFdBQVcsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFRCxhQUFhO1lBQ1gsSUFBSSxDQUFDLGFBQWEsQ0FB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MkJBQTJCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDekU7YUFDRjtpQkFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FDZixDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUNuRSxFQUF1QixDQUFDLENBQUM7YUFDOUI7aUJBQU0sSUFBSSxLQUFLLFlBQVksSUFBSSxDQUFDLDJCQUEyQixDQUFDLFlBQVksRUFBRTtnQkFDekUsT0FBTyxDQUFDLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLHdDQUF3QyxFQUFDLENBQUMsQ0FBQzthQUNoRjtZQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQztLQUNGO0lBOU1ELGdFQThNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7UmVzb2x2ZWRWYWx1ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3ByaXZhdGUvbWlncmF0aW9ucyc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0TWFuYWdlcn0gZnJvbSAnLi4vLi4vdXRpbHMvaW1wb3J0X21hbmFnZXInO1xuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5cbmltcG9ydCB7UmVzb2x2ZWREaXJlY3RpdmUsIFJlc29sdmVkTmdNb2R1bGV9IGZyb20gJy4vZGVmaW5pdGlvbl9jb2xsZWN0b3InO1xuaW1wb3J0IHtjcmVhdGVQcm92aWRlcnNFdmFsdWF0b3IsIFByb3ZpZGVyTGl0ZXJhbH0gZnJvbSAnLi9wcm92aWRlcnNfZXZhbHVhdG9yJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuLyoqXG4gKiBOYW1lIG9mIGRlY29yYXRvcnMgd2hpY2ggaW1wbHkgdGhhdCBhIGdpdmVuIGNsYXNzIGRvZXMgbm90IG5lZWQgdG8gYmUgbWlncmF0ZWQuXG4gKiAgICAtIGBASW5qZWN0YWJsZWAsIGBARGlyZWN0aXZlYCwgYEBDb21wb25lbnRgIGFuZCBgQFBpcGVgIGluc3RydWN0IHRoZSBjb21waWxlclxuICogICAgICAgdG8gZ2VuZXJhdGUgYSBmYWN0b3J5IGRlZmluaXRpb24uXG4gKiAgICAtIGBATmdNb2R1bGVgIGluc3RydWN0cyB0aGUgY29tcGlsZXIgdG8gZ2VuZXJhdGUgYSBwcm92aWRlciBkZWZpbml0aW9uIHRoYXQgaG9sZHNcbiAqICAgICAgIHRoZSBmYWN0b3J5IGZ1bmN0aW9uLlxuICovXG5jb25zdCBOT19NSUdSQVRFX0RFQ09SQVRPUlMgPSBbJ0luamVjdGFibGUnLCAnRGlyZWN0aXZlJywgJ0NvbXBvbmVudCcsICdQaXBlJywgJ05nTW9kdWxlJ107XG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5hbHlzaXNGYWlsdXJlIHtcbiAgbm9kZTogdHMuTm9kZTtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgTWlzc2luZ0luamVjdGFibGVUcmFuc2Zvcm0ge1xuICBwcml2YXRlIHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIHByaXZhdGUgaW1wb3J0TWFuYWdlciA9IG5ldyBJbXBvcnRNYW5hZ2VyKHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIsIHRoaXMucHJpbnRlcik7XG4gIHByaXZhdGUgcHJvdmlkZXJzRXZhbHVhdG9yO1xuXG4gIC8qKiBTZXQgb2YgcHJvdmlkZXIgY2xhc3MgZGVjbGFyYXRpb25zIHdoaWNoIHdlcmUgYWxyZWFkeSBjaGVja2VkIG9yIG1pZ3JhdGVkLiAqL1xuICBwcml2YXRlIHZpc2l0ZWRQcm92aWRlckNsYXNzZXMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG5cbiAgLyoqIFNldCBvZiBwcm92aWRlciBvYmplY3QgbGl0ZXJhbHMgd2hpY2ggd2VyZSBhbHJlYWR5IGNoZWNrZWQgb3IgbWlncmF0ZWQuICovXG4gIHByaXZhdGUgdmlzaXRlZFByb3ZpZGVyTGl0ZXJhbHMgPSBuZXcgU2V0PHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIGdldFVwZGF0ZVJlY29yZGVyOiAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IFVwZGF0ZVJlY29yZGVyLFxuICAgICAgcHJpdmF0ZSBjb21waWxlckNsaU1pZ3JhdGlvbnNNb2R1bGU6XG4gICAgICAgICAgdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3ByaXZhdGUvbWlncmF0aW9ucycpKSB7XG4gICAgdGhpcy5wcm92aWRlcnNFdmFsdWF0b3IgPSBjcmVhdGVQcm92aWRlcnNFdmFsdWF0b3IoXG4gICAgICAgIGNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZSxcbiAgICAgICAgbmV3IGNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZS5UeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QodHlwZUNoZWNrZXIpLCB0eXBlQ2hlY2tlcik7XG4gIH1cblxuICByZWNvcmRDaGFuZ2VzKCkge1xuICAgIHRoaXMuaW1wb3J0TWFuYWdlci5yZWNvcmRDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgYWxsIHNwZWNpZmllZCBOZ01vZHVsZSdzIGJ5IHdhbGtpbmcgdGhyb3VnaCByZWZlcmVuY2VkIHByb3ZpZGVyc1xuICAgKiBhbmQgZGVjb3JhdGluZyB0aGVtIHdpdGggXCJASW5qZWN0YWJsZVwiIGlmIG5lZWRlZC5cbiAgICovXG4gIG1pZ3JhdGVNb2R1bGVzKG1vZHVsZXM6IFJlc29sdmVkTmdNb2R1bGVbXSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gbW9kdWxlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMubWlncmF0ZU1vZHVsZShub2RlKSksIFtdIGFzIEFuYWx5c2lzRmFpbHVyZVtdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyBhbGwgc3BlY2lmaWVkIGRpcmVjdGl2ZXMgYnkgd2Fsa2luZyB0aHJvdWdoIHJlZmVyZW5jZWQgcHJvdmlkZXJzXG4gICAqIGFuZCBkZWNvcmF0aW5nIHRoZW0gd2l0aCBcIkBJbmplY3RhYmxlXCIgaWYgbmVlZGVkLlxuICAgKi9cbiAgbWlncmF0ZURpcmVjdGl2ZXMoZGlyZWN0aXZlczogUmVzb2x2ZWREaXJlY3RpdmVbXSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMubWlncmF0ZURpcmVjdGl2ZShub2RlKSksIFtdIGFzIEFuYWx5c2lzRmFpbHVyZVtdKTtcbiAgfVxuXG4gIC8qKiBNaWdyYXRlcyBhIGdpdmVuIE5nTW9kdWxlIGJ5IHdhbGtpbmcgdGhyb3VnaCB0aGUgcmVmZXJlbmNlZCBwcm92aWRlcnMuICovXG4gIG1pZ3JhdGVNb2R1bGUobW9kdWxlOiBSZXNvbHZlZE5nTW9kdWxlKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGlmIChtb2R1bGUucHJvdmlkZXJzRXhwciA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHtyZXNvbHZlZFZhbHVlLCBsaXRlcmFsc30gPSB0aGlzLnByb3ZpZGVyc0V2YWx1YXRvci5ldmFsdWF0ZShtb2R1bGUucHJvdmlkZXJzRXhwcik7XG4gICAgdGhpcy5fbWlncmF0ZUxpdGVyYWxQcm92aWRlcnMobGl0ZXJhbHMpO1xuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc29sdmVkVmFsdWUpKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7bm9kZTogbW9kdWxlLnByb3ZpZGVyc0V4cHIsIG1lc3NhZ2U6ICdQcm92aWRlcnMgb2YgbW9kdWxlIGFyZSBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLid9XG4gICAgICBdO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZShyZXNvbHZlZFZhbHVlLCBtb2R1bGUpO1xuICB9XG5cblxuICAvKipcbiAgICogTWlncmF0ZXMgYSBnaXZlbiBkaXJlY3RpdmUgYnkgd2Fsa2luZyB0aHJvdWdoIGRlZmluZWQgcHJvdmlkZXJzLiBUaGlzIG1ldGhvZFxuICAgKiBhbHNvIGhhbmRsZXMgY29tcG9uZW50cyB3aXRoIFwidmlld1Byb3ZpZGVyc1wiIGRlZmluZWQuXG4gICAqL1xuICBtaWdyYXRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogUmVzb2x2ZWREaXJlY3RpdmUpOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgY29uc3QgZmFpbHVyZXM6IEFuYWx5c2lzRmFpbHVyZVtdID0gW107XG5cbiAgICAvLyBNaWdyYXRlIFwicHJvdmlkZXJzXCIgb24gZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cyBpZiBkZWZpbmVkLlxuICAgIGlmIChkaXJlY3RpdmUucHJvdmlkZXJzRXhwcikge1xuICAgICAgY29uc3Qge3Jlc29sdmVkVmFsdWUsIGxpdGVyYWxzfSA9IHRoaXMucHJvdmlkZXJzRXZhbHVhdG9yLmV2YWx1YXRlKGRpcmVjdGl2ZS5wcm92aWRlcnNFeHByKTtcbiAgICAgIHRoaXMuX21pZ3JhdGVMaXRlcmFsUHJvdmlkZXJzKGxpdGVyYWxzKTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZXNvbHZlZFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHtub2RlOiBkaXJlY3RpdmUucHJvdmlkZXJzRXhwciwgbWVzc2FnZTogYFByb3ZpZGVycyBhcmUgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfVxuICAgICAgICBdO1xuICAgICAgfVxuICAgICAgZmFpbHVyZXMucHVzaCguLi50aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZShyZXNvbHZlZFZhbHVlLCBkaXJlY3RpdmUpKTtcbiAgICB9XG5cbiAgICAvLyBNaWdyYXRlIFwidmlld1Byb3ZpZGVyc1wiIG9uIGNvbXBvbmVudHMgaWYgZGVmaW5lZC5cbiAgICBpZiAoZGlyZWN0aXZlLnZpZXdQcm92aWRlcnNFeHByKSB7XG4gICAgICBjb25zdCB7cmVzb2x2ZWRWYWx1ZSwgbGl0ZXJhbHN9ID1cbiAgICAgICAgICB0aGlzLnByb3ZpZGVyc0V2YWx1YXRvci5ldmFsdWF0ZShkaXJlY3RpdmUudmlld1Byb3ZpZGVyc0V4cHIpO1xuICAgICAgdGhpcy5fbWlncmF0ZUxpdGVyYWxQcm92aWRlcnMobGl0ZXJhbHMpO1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc29sdmVkVmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAge25vZGU6IGRpcmVjdGl2ZS52aWV3UHJvdmlkZXJzRXhwciwgbWVzc2FnZTogYFByb3ZpZGVycyBhcmUgbm90IHN0YXRpY2FsbHkgYW5hbHl6YWJsZS5gfVxuICAgICAgICBdO1xuICAgICAgfVxuICAgICAgZmFpbHVyZXMucHVzaCguLi50aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZShyZXNvbHZlZFZhbHVlLCBkaXJlY3RpdmUpKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhaWx1cmVzO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGEgZ2l2ZW4gcHJvdmlkZXIgY2xhc3MgaWYgaXQgaXMgbm90IGRlY29yYXRlZCB3aXRoXG4gICAqIGFueSBBbmd1bGFyIGRlY29yYXRvci5cbiAgICovXG4gIG1pZ3JhdGVQcm92aWRlckNsYXNzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIGNvbnRleHQ6IFJlc29sdmVkTmdNb2R1bGV8UmVzb2x2ZWREaXJlY3RpdmUpIHtcbiAgICBpZiAodGhpcy52aXNpdGVkUHJvdmlkZXJDbGFzc2VzLmhhcyhub2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnZpc2l0ZWRQcm92aWRlckNsYXNzZXMuYWRkKG5vZGUpO1xuXG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuXG4gICAgLy8gV2UgY2Fubm90IG1pZ3JhdGUgcHJvdmlkZXIgY2xhc3NlcyBvdXRzaWRlIG9mIHNvdXJjZSBmaWxlcy4gVGhpcyBpcyBiZWNhdXNlIHRoZVxuICAgIC8vIG1pZ3JhdGlvbiBmb3IgdGhpcmQtcGFydHkgbGlicmFyeSBmaWxlcyBzaG91bGQgaGFwcGVuIGluIFwibmdjY1wiLCBhbmQgaW4gZ2VuZXJhbFxuICAgIC8vIHdvdWxkIGFsc28gaW52b2x2ZSBtZXRhZGF0YSBwYXJzaW5nLlxuICAgIGlmIChzb3VyY2VGaWxlLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID1cbiAgICAgICAgbm9kZS5kZWNvcmF0b3JzID8gZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKSA6IG51bGw7XG5cbiAgICBpZiAobmdEZWNvcmF0b3JzICE9PSBudWxsICYmXG4gICAgICAgIG5nRGVjb3JhdG9ycy5zb21lKGQgPT4gTk9fTUlHUkFURV9ERUNPUkFUT1JTLmluZGV4T2YoZC5uYW1lKSAhPT0gLTEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlUmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGUpO1xuICAgIGNvbnN0IGltcG9ydEV4cHIgPVxuICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKHNvdXJjZUZpbGUsICdJbmplY3RhYmxlJywgJ0Bhbmd1bGFyL2NvcmUnKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JFeHByID0gdHMuY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoaW1wb3J0RXhwciwgdW5kZWZpbmVkLCB1bmRlZmluZWQpKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JUZXh0ID1cbiAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yRXhwciwgc291cmNlRmlsZSk7XG5cblxuICAgIC8vIEluIGNhc2UgdGhlIGNsYXNzIGlzIGFscmVhZHkgZGVjb3JhdGVkIHdpdGggXCJASW5qZWN0KC4uKVwiLCB3ZSByZXBsYWNlIHRoZSBcIkBJbmplY3RcIlxuICAgIC8vIGRlY29yYXRvciB3aXRoIFwiQEluamVjdGFibGUoKVwiIHNpbmNlIHVzaW5nIFwiQEluamVjdCguLilcIiBvbiBhIGNsYXNzIGlzIGEgbm9vcCBhbmRcbiAgICAvLyBtb3N0IGxpa2VseSB3YXMgbWVhbnQgdG8gYmUgXCJASW5qZWN0YWJsZSgpXCIuXG4gICAgY29uc3QgZXhpc3RpbmdJbmplY3REZWNvcmF0b3IgPVxuICAgICAgICBuZ0RlY29yYXRvcnMgIT09IG51bGwgPyBuZ0RlY29yYXRvcnMuZmluZChkID0+IGQubmFtZSA9PT0gJ0luamVjdCcpIDogbnVsbDtcbiAgICBpZiAoZXhpc3RpbmdJbmplY3REZWNvcmF0b3IpIHtcbiAgICAgIHVwZGF0ZVJlY29yZGVyLnJlcGxhY2VEZWNvcmF0b3IoZXhpc3RpbmdJbmplY3REZWNvcmF0b3Iubm9kZSwgbmV3RGVjb3JhdG9yVGV4dCwgY29udGV4dC5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlUmVjb3JkZXIuYWRkQ2xhc3NEZWNvcmF0b3Iobm9kZSwgbmV3RGVjb3JhdG9yVGV4dCwgY29udGV4dC5uYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgb2JqZWN0IGxpdGVyYWwgcHJvdmlkZXJzIHdoaWNoIGRvIG5vdCB1c2UgXCJ1c2VWYWx1ZVwiLCBcInVzZUNsYXNzXCIsXG4gICAqIFwidXNlRXhpc3RpbmdcIiBvciBcInVzZUZhY3RvcnlcIi4gVGhlc2UgcHJvdmlkZXJzIGJlaGF2ZSBkaWZmZXJlbnRseSBpbiBJdnkuIGUuZy5cbiAgICpcbiAgICogYGBgdHNcbiAgICogICB7cHJvdmlkZTogWH0gLT4ge3Byb3ZpZGU6IFgsIHVzZVZhbHVlOiB1bmRlZmluZWR9IC8vIHRoaXMgaXMgaG93IGl0IGJlaGF2ZXMgaW4gVkVcbiAgICogICB7cHJvdmlkZTogWH0gLT4ge3Byb3ZpZGU6IFgsIHVzZUNsYXNzOiBYfSAvLyB0aGlzIGlzIGhvdyBpdCBiZWhhdmVzIGluIEl2eVxuICAgKiBgYGBcbiAgICpcbiAgICogVG8gZW5zdXJlIGZvcndhcmQgY29tcGF0aWJpbGl0eSwgd2UgbWlncmF0ZSB0aGVzZSBlbXB0eSBvYmplY3QgbGl0ZXJhbCBwcm92aWRlcnNcbiAgICogdG8gZXhwbGljaXRseSB1c2UgYHVzZVZhbHVlOiB1bmRlZmluZWRgLlxuICAgKi9cbiAgcHJpdmF0ZSBfbWlncmF0ZUxpdGVyYWxQcm92aWRlcnMobGl0ZXJhbHM6IFByb3ZpZGVyTGl0ZXJhbFtdKSB7XG4gICAgZm9yIChsZXQge25vZGUsIHJlc29sdmVkVmFsdWV9IG9mIGxpdGVyYWxzKSB7XG4gICAgICBpZiAodGhpcy52aXNpdGVkUHJvdmlkZXJMaXRlcmFscy5oYXMobm9kZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLnZpc2l0ZWRQcm92aWRlckxpdGVyYWxzLmFkZChub2RlKTtcblxuICAgICAgaWYgKCFyZXNvbHZlZFZhbHVlIHx8ICEocmVzb2x2ZWRWYWx1ZSBpbnN0YW5jZW9mIE1hcCkgfHwgIXJlc29sdmVkVmFsdWUuaGFzKCdwcm92aWRlJykgfHxcbiAgICAgICAgICByZXNvbHZlZFZhbHVlLmhhcygndXNlQ2xhc3MnKSB8fCByZXNvbHZlZFZhbHVlLmhhcygndXNlVmFsdWUnKSB8fFxuICAgICAgICAgIHJlc29sdmVkVmFsdWUuaGFzKCd1c2VFeGlzdGluZycpIHx8IHJlc29sdmVkVmFsdWUuaGFzKCd1c2VGYWN0b3J5JykpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIGNvbnN0IG5ld09iamVjdExpdGVyYWwgPSB0cy51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgbm9kZS5wcm9wZXJ0aWVzLmNvbmNhdChcbiAgICAgICAgICAgICAgdHMuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KCd1c2VWYWx1ZScsIHRzLmNyZWF0ZUlkZW50aWZpZXIoJ3VuZGVmaW5lZCcpKSkpO1xuXG4gICAgICB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGUpXG4gICAgICAgICAgLnVwZGF0ZU9iamVjdExpdGVyYWwoXG4gICAgICAgICAgICAgIG5vZGUsIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld09iamVjdExpdGVyYWwsIHNvdXJjZUZpbGUpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmlzaXRzIHRoZSBnaXZlbiByZXNvbHZlZCB2YWx1ZSBvZiBhIHByb3ZpZGVyLiBQcm92aWRlcnMgY2FuIGJlIG5lc3RlZCBpblxuICAgKiBhcnJheXMgYW5kIHdlIG5lZWQgdG8gcmVjdXJzaXZlbHkgd2FsayB0aHJvdWdoIHRoZSBwcm92aWRlcnMgdG8gYmUgYWJsZSB0b1xuICAgKiBtaWdyYXRlIGFsbCByZWZlcmVuY2VkIHByb3ZpZGVyIGNsYXNzZXMuIGUuZy4gXCJwcm92aWRlcnM6IFtbQSwgW0JdXV1cIi5cbiAgICovXG4gIHByaXZhdGUgX3Zpc2l0UHJvdmlkZXJSZXNvbHZlZFZhbHVlKHZhbHVlOiBSZXNvbHZlZFZhbHVlLCBtb2R1bGU6IFJlc29sdmVkTmdNb2R1bGUpOlxuICAgICAgQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHRoaXMuY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlLlJlZmVyZW5jZSAmJlxuICAgICAgICB0cy5pc0NsYXNzRGVjbGFyYXRpb24odmFsdWUubm9kZSkpIHtcbiAgICAgIHRoaXMubWlncmF0ZVByb3ZpZGVyQ2xhc3ModmFsdWUubm9kZSwgbW9kdWxlKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAvLyBJZiBhIFwiQ2xhc3NQcm92aWRlclwiIGhhcyB0aGUgXCJkZXBzXCIgcHJvcGVydHkgc2V0LCB0aGVuIHdlIGRvIG5vdCBuZWVkIHRvXG4gICAgICAvLyBkZWNvcmF0ZSB0aGUgY2xhc3MuIFRoaXMgaXMgYmVjYXVzZSB0aGUgY2xhc3MgaXMgaW5zdGFudGlhdGVkIHRocm91Z2ggdGhlXG4gICAgICAvLyBzcGVjaWZpZWQgXCJkZXBzXCIgYW5kIHRoZSBjbGFzcyBkb2VzIG5vdCBuZWVkIGEgZmFjdG9yeSBkZWZpbml0aW9uLlxuICAgICAgaWYgKHZhbHVlLmhhcygncHJvdmlkZScpICYmIHZhbHVlLmhhcygndXNlQ2xhc3MnKSAmJiB2YWx1ZS5nZXQoJ2RlcHMnKSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZSh2YWx1ZS5nZXQoJ3VzZUNsYXNzJykhLCBtb2R1bGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5yZWR1Y2UoXG4gICAgICAgICAgKHJlcywgdikgPT4gcmVzLmNvbmNhdCh0aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZSh2LCBtb2R1bGUpKSxcbiAgICAgICAgICBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHRoaXMuY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlLkR5bmFtaWNWYWx1ZSkge1xuICAgICAgcmV0dXJuIFt7bm9kZTogdmFsdWUubm9kZSwgbWVzc2FnZTogYFByb3ZpZGVyIGlzIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuYH1dO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cbn1cbiJdfQ==