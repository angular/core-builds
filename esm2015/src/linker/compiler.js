/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '../di/injectable';
import { InjectionToken } from '../di/injection_token';
import { NgModuleFactory as NgModuleFactoryR3 } from '../render3/ng_module_ref';
/**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * \@publicApi
 * @template T
 */
export class ModuleWithComponentFactories {
    /**
     * @param {?} ngModuleFactory
     * @param {?} componentFactories
     */
    constructor(ngModuleFactory, componentFactories) {
        this.ngModuleFactory = ngModuleFactory;
        this.componentFactories = componentFactories;
    }
}
if (false) {
    /** @type {?} */
    ModuleWithComponentFactories.prototype.ngModuleFactory;
    /** @type {?} */
    ModuleWithComponentFactories.prototype.componentFactories;
}
/**
 * @return {?}
 */
function _throwError() {
    throw new Error(`Runtime compiler is not loaded`);
}
/** @type {?} */
const Compiler_compileModuleSync__PRE_R3__ = (/** @type {?} */ (_throwError));
/** @type {?} */
export const Compiler_compileModuleSync__POST_R3__ = function (moduleType) {
    return new NgModuleFactoryR3(moduleType);
};
/** @type {?} */
const Compiler_compileModuleSync = Compiler_compileModuleSync__PRE_R3__;
/** @type {?} */
const Compiler_compileModuleAsync__PRE_R3__ = (/** @type {?} */ (_throwError));
/** @type {?} */
export const Compiler_compileModuleAsync__POST_R3__ = function (moduleType) {
    return Promise.resolve(Compiler_compileModuleSync__POST_R3__(moduleType));
};
/** @type {?} */
const Compiler_compileModuleAsync = Compiler_compileModuleAsync__PRE_R3__;
/** @type {?} */
const Compiler_compileModuleAndAllComponentsSync__PRE_R3__ = (/** @type {?} */ (_throwError));
/** @type {?} */
export const Compiler_compileModuleAndAllComponentsSync__POST_R3__ = function (moduleType) {
    return new ModuleWithComponentFactories(Compiler_compileModuleSync__POST_R3__(moduleType), []);
};
/** @type {?} */
const Compiler_compileModuleAndAllComponentsSync = Compiler_compileModuleAndAllComponentsSync__PRE_R3__;
/** @type {?} */
const Compiler_compileModuleAndAllComponentsAsync__PRE_R3__ = (/** @type {?} */ (_throwError));
/** @type {?} */
export const Compiler_compileModuleAndAllComponentsAsync__POST_R3__ = function (moduleType) {
    return Promise.resolve(Compiler_compileModuleAndAllComponentsSync__POST_R3__(moduleType));
};
/** @type {?} */
const Compiler_compileModuleAndAllComponentsAsync = Compiler_compileModuleAndAllComponentsAsync__PRE_R3__;
/**
 * Low-level service for running the angular compiler during runtime
 * to create {\@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 *
 * Each `\@NgModule` provides an own `Compiler` to its injector,
 * that will use the directives/pipes of the ng module for compilation
 * of components.
 *
 * \@publicApi
 */
export class Compiler {
    constructor() {
        /**
         * Compiles the given NgModule and all of its components. All templates of the components listed
         * in `entryComponents` have to be inlined.
         */
        this.compileModuleSync = Compiler_compileModuleSync;
        /**
         * Compiles the given NgModule and all of its components
         */
        this.compileModuleAsync = Compiler_compileModuleAsync;
        /**
         * Same as {\@link #compileModuleSync} but also creates ComponentFactories for all components.
         */
        this.compileModuleAndAllComponentsSync = Compiler_compileModuleAndAllComponentsSync;
        /**
         * Same as {\@link #compileModuleAsync} but also creates ComponentFactories for all components.
         */
        this.compileModuleAndAllComponentsAsync = Compiler_compileModuleAndAllComponentsAsync;
    }
    /**
     * Clears all caches.
     * @return {?}
     */
    clearCache() { }
    /**
     * Clears the cache for the given component/ngModule.
     * @param {?} type
     * @return {?}
     */
    clearCacheFor(type) { }
    /**
     * Returns the id for a given NgModule, if one is defined and known to the compiler.
     * @param {?} moduleType
     * @return {?}
     */
    getModuleId(moduleType) { return undefined; }
}
Compiler.decorators = [
    { type: Injectable }
];
if (false) {
    /**
     * Compiles the given NgModule and all of its components. All templates of the components listed
     * in `entryComponents` have to be inlined.
     * @type {?}
     */
    Compiler.prototype.compileModuleSync;
    /**
     * Compiles the given NgModule and all of its components
     * @type {?}
     */
    Compiler.prototype.compileModuleAsync;
    /**
     * Same as {\@link #compileModuleSync} but also creates ComponentFactories for all components.
     * @type {?}
     */
    Compiler.prototype.compileModuleAndAllComponentsSync;
    /**
     * Same as {\@link #compileModuleAsync} but also creates ComponentFactories for all components.
     * @type {?}
     */
    Compiler.prototype.compileModuleAndAllComponentsAsync;
}
/**
 * Token to provide CompilerOptions in the platform injector.
 *
 * \@publicApi
 * @type {?}
 */
export const COMPILER_OPTIONS = new InjectionToken('compilerOptions');
/**
 * A factory for creating a Compiler
 *
 * \@publicApi
 * @abstract
 */
export class CompilerFactory {
}
if (false) {
    /**
     * @abstract
     * @param {?=} options
     * @return {?}
     */
    CompilerFactory.prototype.createCompiler = function (options) { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBS3JELE9BQU8sRUFBQyxlQUFlLElBQUksaUJBQWlCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQzs7Ozs7OztBQVk5RSxNQUFNLE9BQU8sNEJBQTRCOzs7OztJQUN2QyxZQUNXLGVBQW1DLEVBQ25DLGtCQUEyQztRQUQzQyxvQkFBZSxHQUFmLGVBQWUsQ0FBb0I7UUFDbkMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUF5QjtJQUFHLENBQUM7Q0FDM0Q7OztJQUZLLHVEQUEwQzs7SUFDMUMsMERBQWtEOzs7OztBQUl4RCxTQUFTLFdBQVc7SUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ3BELENBQUM7O01BRUssb0NBQW9DLEdBQ3RDLG1CQUFBLFdBQVcsRUFBTzs7QUFDdEIsTUFBTSxPQUFPLHFDQUFxQyxHQUN6QixVQUFZLFVBQW1CO0lBQ3RELE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMzQyxDQUFDOztNQUNLLDBCQUEwQixHQUFHLG9DQUFvQzs7TUFFakUscUNBQXFDLEdBQ1QsbUJBQUEsV0FBVyxFQUFPOztBQUNwRCxNQUFNLE9BQU8sc0NBQXNDLEdBQ2pCLFVBQVksVUFBbUI7SUFDL0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLHFDQUFxQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDNUUsQ0FBQzs7TUFDSywyQkFBMkIsR0FBRyxxQ0FBcUM7O01BRW5FLG9EQUFvRCxHQUNwQixtQkFBQSxXQUFXLEVBQU87O0FBQ3hELE1BQU0sT0FBTyxxREFBcUQsR0FDNUIsVUFBWSxVQUFtQjtJQUVuRSxPQUFPLElBQUksNEJBQTRCLENBQUMscUNBQXFDLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDakcsQ0FBQzs7TUFDSywwQ0FBMEMsR0FDNUMsb0RBQW9EOztNQUVsRCxxREFBcUQsR0FDWixtQkFBQSxXQUFXLEVBQU87O0FBQ2pFLE1BQU0sT0FBTyxzREFBc0QsR0FDcEIsVUFBWSxVQUFtQjtJQUU1RSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMscURBQXFELENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUM1RixDQUFDOztNQUNLLDJDQUEyQyxHQUM3QyxxREFBcUQ7Ozs7Ozs7Ozs7OztBQWN6RCxNQUFNLE9BQU8sUUFBUTtJQURyQjs7Ozs7UUFNRSxzQkFBaUIsR0FBbUQsMEJBQTBCLENBQUM7Ozs7UUFLL0YsdUJBQWtCLEdBQzRDLDJCQUEyQixDQUFDOzs7O1FBSzFGLHNDQUFpQyxHQUM3QiwwQ0FBMEMsQ0FBQzs7OztRQUsvQyx1Q0FBa0MsR0FDYSwyQ0FBMkMsQ0FBQztJQWdCN0YsQ0FBQzs7Ozs7SUFYQyxVQUFVLEtBQVUsQ0FBQzs7Ozs7O0lBS3JCLGFBQWEsQ0FBQyxJQUFlLElBQUcsQ0FBQzs7Ozs7O0lBS2pDLFdBQVcsQ0FBQyxVQUFxQixJQUFzQixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7OztZQXZDM0UsVUFBVTs7Ozs7Ozs7SUFNVCxxQ0FBK0Y7Ozs7O0lBSy9GLHNDQUMwRjs7Ozs7SUFLMUYscURBQytDOzs7OztJQUsvQyxzREFDMkY7Ozs7Ozs7O0FBb0M3RixNQUFNLE9BQU8sZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQW9CLGlCQUFpQixDQUFDOzs7Ozs7O0FBT3hGLE1BQU0sT0FBZ0IsZUFBZTtDQUVwQzs7Ozs7OztJQURDLGtFQUErRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge1N0YXRpY1Byb3ZpZGVyfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneX0gZnJvbSAnLi4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YSc7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeSBhcyBOZ01vZHVsZUZhY3RvcnlSM30gZnJvbSAnLi4vcmVuZGVyMy9uZ19tb2R1bGVfcmVmJztcblxuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcblxuXG5cbi8qKlxuICogQ29tYmluYXRpb24gb2YgTmdNb2R1bGVGYWN0b3J5IGFuZCBDb21wb25lbnRGYWN0b3J5cy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgbmdNb2R1bGVGYWN0b3J5OiBOZ01vZHVsZUZhY3Rvcnk8VD4sXG4gICAgICBwdWJsaWMgY29tcG9uZW50RmFjdG9yaWVzOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSkge31cbn1cblxuXG5mdW5jdGlvbiBfdGhyb3dFcnJvcigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKGBSdW50aW1lIGNvbXBpbGVyIGlzIG5vdCBsb2FkZWRgKTtcbn1cblxuY29uc3QgQ29tcGlsZXJfY29tcGlsZU1vZHVsZVN5bmNfX1BSRV9SM19fOiA8VD4obW9kdWxlVHlwZTogVHlwZTxUPikgPT4gTmdNb2R1bGVGYWN0b3J5PFQ+ID1cbiAgICBfdGhyb3dFcnJvciBhcyBhbnk7XG5leHBvcnQgY29uc3QgQ29tcGlsZXJfY29tcGlsZU1vZHVsZVN5bmNfX1BPU1RfUjNfXzogPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pID0+XG4gICAgTmdNb2R1bGVGYWN0b3J5PFQ+ID0gZnVuY3Rpb248VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE5nTW9kdWxlRmFjdG9yeTxUPiB7XG4gIHJldHVybiBuZXcgTmdNb2R1bGVGYWN0b3J5UjMobW9kdWxlVHlwZSk7XG59O1xuY29uc3QgQ29tcGlsZXJfY29tcGlsZU1vZHVsZVN5bmMgPSBDb21waWxlcl9jb21waWxlTW9kdWxlU3luY19fUFJFX1IzX187XG5cbmNvbnN0IENvbXBpbGVyX2NvbXBpbGVNb2R1bGVBc3luY19fUFJFX1IzX186IDxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KSA9PlxuICAgIFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PFQ+PiA9IF90aHJvd0Vycm9yIGFzIGFueTtcbmV4cG9ydCBjb25zdCBDb21waWxlcl9jb21waWxlTW9kdWxlQXN5bmNfX1BPU1RfUjNfXzogPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pID0+XG4gICAgUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+ID0gZnVuY3Rpb248VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PFQ+PiB7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoQ29tcGlsZXJfY29tcGlsZU1vZHVsZVN5bmNfX1BPU1RfUjNfXyhtb2R1bGVUeXBlKSk7XG59O1xuY29uc3QgQ29tcGlsZXJfY29tcGlsZU1vZHVsZUFzeW5jID0gQ29tcGlsZXJfY29tcGlsZU1vZHVsZUFzeW5jX19QUkVfUjNfXztcblxuY29uc3QgQ29tcGlsZXJfY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jX19QUkVfUjNfXzogPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pID0+XG4gICAgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiA9IF90aHJvd0Vycm9yIGFzIGFueTtcbmV4cG9ydCBjb25zdCBDb21waWxlcl9jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmNfX1BPU1RfUjNfXzogPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pID0+XG4gICAgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiA9IGZ1bmN0aW9uPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOlxuICAgICAgICBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+IHtcbiAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKENvbXBpbGVyX2NvbXBpbGVNb2R1bGVTeW5jX19QT1NUX1IzX18obW9kdWxlVHlwZSksIFtdKTtcbn07XG5jb25zdCBDb21waWxlcl9jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmMgPVxuICAgIENvbXBpbGVyX2NvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luY19fUFJFX1IzX187XG5cbmNvbnN0IENvbXBpbGVyX2NvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmNfX1BSRV9SM19fOiA8VD4obW9kdWxlVHlwZTogVHlwZTxUPikgPT5cbiAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+ID0gX3Rocm93RXJyb3IgYXMgYW55O1xuZXhwb3J0IGNvbnN0IENvbXBpbGVyX2NvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmNfX1BPU1RfUjNfXzogPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pID0+XG4gICAgUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+PiA9IGZ1bmN0aW9uPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOlxuICAgICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShDb21waWxlcl9jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmNfX1BPU1RfUjNfXyhtb2R1bGVUeXBlKSk7XG59O1xuY29uc3QgQ29tcGlsZXJfY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYyA9XG4gICAgQ29tcGlsZXJfY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luY19fUFJFX1IzX187XG5cbi8qKlxuICogTG93LWxldmVsIHNlcnZpY2UgZm9yIHJ1bm5pbmcgdGhlIGFuZ3VsYXIgY29tcGlsZXIgZHVyaW5nIHJ1bnRpbWVcbiAqIHRvIGNyZWF0ZSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX1zLCB3aGljaFxuICogY2FuIGxhdGVyIGJlIHVzZWQgdG8gY3JlYXRlIGFuZCByZW5kZXIgYSBDb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogRWFjaCBgQE5nTW9kdWxlYCBwcm92aWRlcyBhbiBvd24gYENvbXBpbGVyYCB0byBpdHMgaW5qZWN0b3IsXG4gKiB0aGF0IHdpbGwgdXNlIHRoZSBkaXJlY3RpdmVzL3BpcGVzIG9mIHRoZSBuZyBtb2R1bGUgZm9yIGNvbXBpbGF0aW9uXG4gKiBvZiBjb21wb25lbnRzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIENvbXBpbGVyIHtcbiAgLyoqXG4gICAqIENvbXBpbGVzIHRoZSBnaXZlbiBOZ01vZHVsZSBhbmQgYWxsIG9mIGl0cyBjb21wb25lbnRzLiBBbGwgdGVtcGxhdGVzIG9mIHRoZSBjb21wb25lbnRzIGxpc3RlZFxuICAgKiBpbiBgZW50cnlDb21wb25lbnRzYCBoYXZlIHRvIGJlIGlubGluZWQuXG4gICAqL1xuICBjb21waWxlTW9kdWxlU3luYzogPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pID0+IE5nTW9kdWxlRmFjdG9yeTxUPiA9IENvbXBpbGVyX2NvbXBpbGVNb2R1bGVTeW5jO1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgZ2l2ZW4gTmdNb2R1bGUgYW5kIGFsbCBvZiBpdHMgY29tcG9uZW50c1xuICAgKi9cbiAgY29tcGlsZU1vZHVsZUFzeW5jOlxuICAgICAgPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pID0+IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PFQ+PiA9IENvbXBpbGVyX2NvbXBpbGVNb2R1bGVBc3luYztcblxuICAvKipcbiAgICogU2FtZSBhcyB7QGxpbmsgI2NvbXBpbGVNb2R1bGVTeW5jfSBidXQgYWxzbyBjcmVhdGVzIENvbXBvbmVudEZhY3RvcmllcyBmb3IgYWxsIGNvbXBvbmVudHMuXG4gICAqL1xuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM6IDxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KSA9PiBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+ID1cbiAgICAgIENvbXBpbGVyX2NvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYztcblxuICAvKipcbiAgICogU2FtZSBhcyB7QGxpbmsgI2NvbXBpbGVNb2R1bGVBc3luY30gYnV0IGFsc28gY3JlYXRlcyBDb21wb25lbnRGYWN0b3JpZXMgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgKi9cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYzogPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pID0+XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+ID0gQ29tcGlsZXJfY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYztcblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBjYWNoZXMuXG4gICAqL1xuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBjYWNoZSBmb3IgdGhlIGdpdmVuIGNvbXBvbmVudC9uZ01vZHVsZS5cbiAgICovXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KSB7fVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBmb3IgYSBnaXZlbiBOZ01vZHVsZSwgaWYgb25lIGlzIGRlZmluZWQgYW5kIGtub3duIHRvIHRoZSBjb21waWxlci5cbiAgICovXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG59XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgY3JlYXRpbmcgYSBjb21waWxlclxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgQ29tcGlsZXJPcHRpb25zID0ge1xuICB1c2VKaXQ/OiBib29sZWFuLFxuICBkZWZhdWx0RW5jYXBzdWxhdGlvbj86IFZpZXdFbmNhcHN1bGF0aW9uLFxuICBwcm92aWRlcnM/OiBTdGF0aWNQcm92aWRlcltdLFxuICBtaXNzaW5nVHJhbnNsYXRpb24/OiBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSxcbiAgcHJlc2VydmVXaGl0ZXNwYWNlcz86IGJvb2xlYW4sXG59O1xuXG4vKipcbiAqIFRva2VuIHRvIHByb3ZpZGUgQ29tcGlsZXJPcHRpb25zIGluIHRoZSBwbGF0Zm9ybSBpbmplY3Rvci5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBDT01QSUxFUl9PUFRJT05TID0gbmV3IEluamVjdGlvblRva2VuPENvbXBpbGVyT3B0aW9uc1tdPignY29tcGlsZXJPcHRpb25zJyk7XG5cbi8qKlxuICogQSBmYWN0b3J5IGZvciBjcmVhdGluZyBhIENvbXBpbGVyXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcGlsZXJGYWN0b3J5IHtcbiAgYWJzdHJhY3QgY3JlYXRlQ29tcGlsZXIob3B0aW9ucz86IENvbXBpbGVyT3B0aW9uc1tdKTogQ29tcGlsZXI7XG59XG4iXX0=