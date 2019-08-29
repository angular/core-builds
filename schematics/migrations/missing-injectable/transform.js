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
         * Migrates a given provider class if it is not decorated with
         * any Angular decorator.
         */
        migrateProviderClass(node, module) {
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
                updateRecorder.replaceDecorator(existingInjectDecorator.node, newDecoratorText, module.name);
            }
            else {
                updateRecorder.addClassDecorator(node, newDecoratorText, module.name);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvbWlzc2luZy1pbmplY3RhYmxlL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILHFFQUFrRTtJQUNsRSx5RkFBZ0g7SUFDaEgsMkVBQW9GO0lBQ3BGLGlDQUFpQztJQUVqQyxnRkFBK0Q7SUFFL0QsMEdBQStDO0lBSS9DLHNGQUFzRjtJQUN0RixNQUFNLHFCQUFxQixHQUFHLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFPL0UsTUFBYSwwQkFBMEI7UUFRckMsWUFDWSxXQUEyQixFQUMzQixpQkFBd0Q7WUFEeEQsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUM7WUFUNUQsWUFBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM3QixrQkFBYSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBR2hGLGlGQUFpRjtZQUN6RSwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztZQUs5RCxJQUFJLENBQUMsZ0JBQWdCO2dCQUNqQixJQUFJLG9DQUFnQixDQUFDLElBQUkscUNBQXdCLENBQUMsV0FBVyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUVELGFBQWEsS0FBSyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV2RCw2RUFBNkU7UUFDN0UsYUFBYSxDQUFDLE1BQXdCO1lBQ3BDLElBQUksTUFBTSxDQUFDLGFBQWEsS0FBSyxJQUFJLEVBQUU7Z0JBQ2pDLE9B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QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZWZlcmVuY2V9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvaW1wb3J0cyc7XG5pbXBvcnQge0R5bmFtaWNWYWx1ZSwgUGFydGlhbEV2YWx1YXRvciwgUmVzb2x2ZWRWYWx1ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9wYXJ0aWFsX2V2YWx1YXRvcic7XG5pbXBvcnQge1R5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9yZWZsZWN0aW9uJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldEFuZ3VsYXJEZWNvcmF0b3JzfSBmcm9tICcuLi8uLi91dGlscy9uZ19kZWNvcmF0b3JzJztcblxuaW1wb3J0IHtJbXBvcnRNYW5hZ2VyfSBmcm9tICcuL2ltcG9ydF9tYW5hZ2VyJztcbmltcG9ydCB7UmVzb2x2ZWROZ01vZHVsZX0gZnJvbSAnLi9tb2R1bGVfY29sbGVjdG9yJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuLyoqIE5hbWUgb2YgZGVjb3JhdG9ycyB3aGljaCBpbXBseSB0aGF0IGEgZ2l2ZW4gY2xhc3MgZG9lcyBub3QgbmVlZCB0byBiZSBtaWdyYXRlZC4gKi9cbmNvbnN0IE5PX01JR1JBVEVfREVDT1JBVE9SUyA9IFsnSW5qZWN0YWJsZScsICdEaXJlY3RpdmUnLCAnQ29tcG9uZW50JywgJ1BpcGUnXTtcblxuZXhwb3J0IGludGVyZmFjZSBBbmFseXNpc0ZhaWx1cmUge1xuICBub2RlOiB0cy5Ob2RlO1xuICBtZXNzYWdlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBNaXNzaW5nSW5qZWN0YWJsZVRyYW5zZm9ybSB7XG4gIHByaXZhdGUgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcbiAgcHJpdmF0ZSBpbXBvcnRNYW5hZ2VyID0gbmV3IEltcG9ydE1hbmFnZXIodGhpcy5nZXRVcGRhdGVSZWNvcmRlciwgdGhpcy5wcmludGVyKTtcbiAgcHJpdmF0ZSBwYXJ0aWFsRXZhbHVhdG9yOiBQYXJ0aWFsRXZhbHVhdG9yO1xuXG4gIC8qKiBTZXQgb2YgcHJvdmlkZXIgY2xhc3MgZGVjbGFyYXRpb25zIHdoaWNoIHdlcmUgYWxyZWFkeSBjaGVja2VkIG9yIG1pZ3JhdGVkLiAqL1xuICBwcml2YXRlIHZpc2l0ZWRQcm92aWRlckNsYXNzZXMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICAgIHByaXZhdGUgZ2V0VXBkYXRlUmVjb3JkZXI6IChzZjogdHMuU291cmNlRmlsZSkgPT4gVXBkYXRlUmVjb3JkZXIpIHtcbiAgICB0aGlzLnBhcnRpYWxFdmFsdWF0b3IgPVxuICAgICAgICBuZXcgUGFydGlhbEV2YWx1YXRvcihuZXcgVHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0KHR5cGVDaGVja2VyKSwgdHlwZUNoZWNrZXIpO1xuICB9XG5cbiAgcmVjb3JkQ2hhbmdlcygpIHsgdGhpcy5pbXBvcnRNYW5hZ2VyLnJlY29yZENoYW5nZXMoKTsgfVxuXG4gIC8qKiBNaWdyYXRlcyBhIGdpdmVuIE5nTW9kdWxlIGJ5IHdhbGtpbmcgdGhyb3VnaCB0aGUgcmVmZXJlbmNlZCBwcm92aWRlcnMuICovXG4gIG1pZ3JhdGVNb2R1bGUobW9kdWxlOiBSZXNvbHZlZE5nTW9kdWxlKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGlmIChtb2R1bGUucHJvdmlkZXJzRXhwciA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGV2YWx1YXRlZEV4cHIgPSB0aGlzLnBhcnRpYWxFdmFsdWF0b3IuZXZhbHVhdGUobW9kdWxlLnByb3ZpZGVyc0V4cHIpO1xuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGV2YWx1YXRlZEV4cHIpKSB7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgbm9kZTogbW9kdWxlLnByb3ZpZGVyc0V4cHIsXG4gICAgICAgIG1lc3NhZ2U6ICdQcm92aWRlcnMgb2YgbW9kdWxlIGFyZSBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLidcbiAgICAgIH1dO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZShldmFsdWF0ZWRFeHByLCBtb2R1bGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGEgZ2l2ZW4gcHJvdmlkZXIgY2xhc3MgaWYgaXQgaXMgbm90IGRlY29yYXRlZCB3aXRoXG4gICAqIGFueSBBbmd1bGFyIGRlY29yYXRvci5cbiAgICovXG4gIG1pZ3JhdGVQcm92aWRlckNsYXNzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIG1vZHVsZTogUmVzb2x2ZWROZ01vZHVsZSkge1xuICAgIGlmICh0aGlzLnZpc2l0ZWRQcm92aWRlckNsYXNzZXMuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudmlzaXRlZFByb3ZpZGVyQ2xhc3Nlcy5hZGQobm9kZSk7XG5cbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID1cbiAgICAgICAgbm9kZS5kZWNvcmF0b3JzID8gZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKSA6IG51bGw7XG5cbiAgICBpZiAobmdEZWNvcmF0b3JzICE9PSBudWxsICYmXG4gICAgICAgIG5nRGVjb3JhdG9ycy5zb21lKGQgPT4gTk9fTUlHUkFURV9ERUNPUkFUT1JTLmluZGV4T2YoZC5uYW1lKSAhPT0gLTEpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlUmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGUpO1xuICAgIGNvbnN0IGltcG9ydEV4cHIgPVxuICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKHNvdXJjZUZpbGUsICdJbmplY3RhYmxlJywgJ0Bhbmd1bGFyL2NvcmUnKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JFeHByID0gdHMuY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoaW1wb3J0RXhwciwgdW5kZWZpbmVkLCB1bmRlZmluZWQpKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JUZXh0ID1cbiAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yRXhwciwgc291cmNlRmlsZSk7XG5cblxuICAgIC8vIEluIGNhc2UgdGhlIGNsYXNzIGlzIGFscmVhZHkgZGVjb3JhdGVkIHdpdGggXCJASW5qZWN0KC4uKVwiLCB3ZSByZXBsYWNlIHRoZSBcIkBJbmplY3RcIlxuICAgIC8vIGRlY29yYXRvciB3aXRoIFwiQEluamVjdGFibGUoKVwiIHNpbmNlIHVzaW5nIFwiQEluamVjdCguLilcIiBvbiBhIGNsYXNzIGlzIGEgbm9vcCBhbmRcbiAgICAvLyBtb3N0IGxpa2VseSB3YXMgbWVhbnQgdG8gYmUgXCJASW5qZWN0YWJsZSgpXCIuXG4gICAgY29uc3QgZXhpc3RpbmdJbmplY3REZWNvcmF0b3IgPVxuICAgICAgICBuZ0RlY29yYXRvcnMgIT09IG51bGwgPyBuZ0RlY29yYXRvcnMuZmluZChkID0+IGQubmFtZSA9PT0gJ0luamVjdCcpIDogbnVsbDtcbiAgICBpZiAoZXhpc3RpbmdJbmplY3REZWNvcmF0b3IpIHtcbiAgICAgIHVwZGF0ZVJlY29yZGVyLnJlcGxhY2VEZWNvcmF0b3IoZXhpc3RpbmdJbmplY3REZWNvcmF0b3Iubm9kZSwgbmV3RGVjb3JhdG9yVGV4dCwgbW9kdWxlLm5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVSZWNvcmRlci5hZGRDbGFzc0RlY29yYXRvcihub2RlLCBuZXdEZWNvcmF0b3JUZXh0LCBtb2R1bGUubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZpc2l0cyB0aGUgZ2l2ZW4gcmVzb2x2ZWQgdmFsdWUgb2YgYSBwcm92aWRlci4gUHJvdmlkZXJzIGNhbiBiZSBuZXN0ZWQgaW5cbiAgICogYXJyYXlzIGFuZCB3ZSBuZWVkIHRvIHJlY3Vyc2l2ZWx5IHdhbGsgdGhyb3VnaCB0aGUgcHJvdmlkZXJzIHRvIGJlIGFibGUgdG9cbiAgICogbWlncmF0ZSBhbGwgcmVmZXJlbmNlZCBwcm92aWRlciBjbGFzc2VzLiBlLmcuIFwicHJvdmlkZXJzOiBbW0EsIFtCXV1dXCIuXG4gICAqL1xuICBwcml2YXRlIF92aXNpdFByb3ZpZGVyUmVzb2x2ZWRWYWx1ZSh2YWx1ZTogUmVzb2x2ZWRWYWx1ZSwgbW9kdWxlOiBSZXNvbHZlZE5nTW9kdWxlKTpcbiAgICAgIEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWZlcmVuY2UgJiYgdHMuaXNDbGFzc0RlY2xhcmF0aW9uKHZhbHVlLm5vZGUpKSB7XG4gICAgICB0aGlzLm1pZ3JhdGVQcm92aWRlckNsYXNzKHZhbHVlLm5vZGUsIG1vZHVsZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgaWYgKCF2YWx1ZS5oYXMoJ3Byb3ZpZGUnKSB8fCB2YWx1ZS5oYXMoJ3VzZVZhbHVlJykgfHwgdmFsdWUuaGFzKCd1c2VGYWN0b3J5JykpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgaWYgKHZhbHVlLmhhcygndXNlRXhpc3RpbmcnKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodmFsdWUuZ2V0KCd1c2VFeGlzdGluZycpICEsIG1vZHVsZSk7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlLmhhcygndXNlQ2xhc3MnKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodmFsdWUuZ2V0KCd1c2VDbGFzcycpICEsIG1vZHVsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodmFsdWUuZ2V0KCdwcm92aWRlJykgISwgbW9kdWxlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICByZXR1cm4gdmFsdWUucmVkdWNlKChyZXMsIHYpID0+IHJlcy5jb25jYXQodGhpcy5fdmlzaXRQcm92aWRlclJlc29sdmVkVmFsdWUodiwgbW9kdWxlKSksIFtcbiAgICAgIF0gYXMgQW5hbHlzaXNGYWlsdXJlW10pO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBEeW5hbWljVmFsdWUpIHtcbiAgICAgIHJldHVybiBbe25vZGU6IHZhbHVlLm5vZGUsIG1lc3NhZ2U6IGBQcm92aWRlciBpcyBub3Qgc3RhdGljYWxseSBhbmFseXphYmxlLmB9XTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXX0=