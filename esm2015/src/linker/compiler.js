import { Injectable } from '../di/injectable';
import { InjectionToken } from '../di/injection_token';
import * as i0 from "../r3_symbols";
/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
    /**
     * Compiles the given NgModule and all of its components. All templates of the components listed
     * in `entryComponents` have to be inlined.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleSync(moduleType) { throw _throwError(); }
    /**
     * Compiles the given NgModule and all of its components
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAsync(moduleType) { throw _throwError(); }
    /**
     * Same as {\@link #compileModuleSync} but also creates ComponentFactories for all components.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsSync(moduleType) {
        throw _throwError();
    }
    /**
     * Same as {\@link #compileModuleAsync} but also creates ComponentFactories for all components.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsAsync(moduleType) {
        throw _throwError();
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
    { type: Injectable },
];
Compiler.ngInjectableDef = i0.defineInjectable({ token: Compiler, factory: function Compiler_Factory(t) { return new (t || Compiler)(); }, providedIn: null });
/*@__PURE__*/ i0.setClassMetadata(Compiler, [{
        type: Injectable
    }], null, null);
/** @typedef {?} */
var CompilerOptions;
export { CompilerOptions };
/** *
 * Token to provide CompilerOptions in the platform injector.
 *
 * \@publicApi
  @type {?} */
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdCckQsTUFBTSxPQUFPLDRCQUE0Qjs7Ozs7SUFDdkMsWUFDVyxpQkFDQTtRQURBLG9CQUFlLEdBQWYsZUFBZTtRQUNmLHVCQUFrQixHQUFsQixrQkFBa0I7S0FBNkI7Q0FDM0Q7Ozs7Ozs7Ozs7QUFHRCxTQUFTLFdBQVc7SUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0NBQ25EOzs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLE9BQU8sUUFBUTs7Ozs7Ozs7SUFLbkIsaUJBQWlCLENBQUksVUFBbUIsSUFBd0IsTUFBTSxXQUFXLEVBQUUsQ0FBQyxFQUFFOzs7Ozs7O0lBS3RGLGtCQUFrQixDQUFJLFVBQW1CLElBQWlDLE1BQU0sV0FBVyxFQUFFLENBQUMsRUFBRTs7Ozs7OztJQUtoRyxpQ0FBaUMsQ0FBSSxVQUFtQjtRQUN0RCxNQUFNLFdBQVcsRUFBRSxDQUFDO0tBQ3JCOzs7Ozs7O0lBS0Qsa0NBQWtDLENBQUksVUFBbUI7UUFFdkQsTUFBTSxXQUFXLEVBQUUsQ0FBQztLQUNyQjs7Ozs7SUFLRCxVQUFVLE1BQVc7Ozs7OztJQUtyQixhQUFhLENBQUMsSUFBZSxLQUFJOzs7Ozs7SUFLakMsV0FBVyxDQUFDLFVBQXFCLElBQXNCLE9BQU8sU0FBUyxDQUFDLEVBQUU7OztZQXpDM0UsVUFBVTs7d0RBQ0UsUUFBUSwyREFBUixRQUFRO2tDQUFSLFFBQVE7Y0FEcEIsVUFBVTs7Ozs7Ozs7OztBQThEWCxhQUFhLGdCQUFnQixHQUFHLElBQUksY0FBYyxDQUFvQixpQkFBaUIsQ0FBQyxDQUFDOzs7Ozs7O0FBT3pGLE1BQU0sT0FBZ0IsZUFBZTtDQUVwQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge1N0YXRpY1Byb3ZpZGVyfSBmcm9tICcuLi9kaS9wcm92aWRlcic7XG5pbXBvcnQge01pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5fSBmcm9tICcuLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4vY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtOZ01vZHVsZUZhY3Rvcnl9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuXG5cblxuLyoqXG4gKiBDb21iaW5hdGlvbiBvZiBOZ01vZHVsZUZhY3RvcnkgYW5kIENvbXBvbmVudEZhY3RvcnlzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBuZ01vZHVsZUZhY3Rvcnk6IE5nTW9kdWxlRmFjdG9yeTxUPixcbiAgICAgIHB1YmxpYyBjb21wb25lbnRGYWN0b3JpZXM6IENvbXBvbmVudEZhY3Rvcnk8YW55PltdKSB7fVxufVxuXG5cbmZ1bmN0aW9uIF90aHJvd0Vycm9yKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoYFJ1bnRpbWUgY29tcGlsZXIgaXMgbm90IGxvYWRlZGApO1xufVxuXG4vKipcbiAqIExvdy1sZXZlbCBzZXJ2aWNlIGZvciBydW5uaW5nIHRoZSBhbmd1bGFyIGNvbXBpbGVyIGR1cmluZyBydW50aW1lXG4gKiB0byBjcmVhdGUge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9cywgd2hpY2hcbiAqIGNhbiBsYXRlciBiZSB1c2VkIHRvIGNyZWF0ZSBhbmQgcmVuZGVyIGEgQ29tcG9uZW50IGluc3RhbmNlLlxuICpcbiAqIEVhY2ggYEBOZ01vZHVsZWAgcHJvdmlkZXMgYW4gb3duIGBDb21waWxlcmAgdG8gaXRzIGluamVjdG9yLFxuICogdGhhdCB3aWxsIHVzZSB0aGUgZGlyZWN0aXZlcy9waXBlcyBvZiB0aGUgbmcgbW9kdWxlIGZvciBjb21waWxhdGlvblxuICogb2YgY29tcG9uZW50cy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBDb21waWxlciB7XG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgZ2l2ZW4gTmdNb2R1bGUgYW5kIGFsbCBvZiBpdHMgY29tcG9uZW50cy4gQWxsIHRlbXBsYXRlcyBvZiB0aGUgY29tcG9uZW50cyBsaXN0ZWRcbiAgICogaW4gYGVudHJ5Q29tcG9uZW50c2AgaGF2ZSB0byBiZSBpbmxpbmVkLlxuICAgKi9cbiAgY29tcGlsZU1vZHVsZVN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE5nTW9kdWxlRmFjdG9yeTxUPiB7IHRocm93IF90aHJvd0Vycm9yKCk7IH1cblxuICAvKipcbiAgICogQ29tcGlsZXMgdGhlIGdpdmVuIE5nTW9kdWxlIGFuZCBhbGwgb2YgaXRzIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbXBpbGVNb2R1bGVBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+IHsgdGhyb3cgX3Rocm93RXJyb3IoKTsgfVxuXG4gIC8qKlxuICAgKiBTYW1lIGFzIHtAbGluayAjY29tcGlsZU1vZHVsZVN5bmN9IGJ1dCBhbHNvIGNyZWF0ZXMgQ29tcG9uZW50RmFjdG9yaWVzIGZvciBhbGwgY29tcG9uZW50cy5cbiAgICovXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgdGhyb3cgX3Rocm93RXJyb3IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTYW1lIGFzIHtAbGluayAjY29tcGlsZU1vZHVsZUFzeW5jfSBidXQgYWxzbyBjcmVhdGVzIENvbXBvbmVudEZhY3RvcmllcyBmb3IgYWxsIGNvbXBvbmVudHMuXG4gICAqL1xuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOlxuICAgICAgUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+PiB7XG4gICAgdGhyb3cgX3Rocm93RXJyb3IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIGNhY2hlcy5cbiAgICovXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7fVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGNhY2hlIGZvciB0aGUgZ2l2ZW4gY29tcG9uZW50L25nTW9kdWxlLlxuICAgKi9cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pIHt9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIGZvciBhIGdpdmVuIE5nTW9kdWxlLCBpZiBvbmUgaXMgZGVmaW5lZCBhbmQga25vd24gdG8gdGhlIGNvbXBpbGVyLlxuICAgKi9cbiAgZ2V0TW9kdWxlSWQobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogc3RyaW5nfHVuZGVmaW5lZCB7IHJldHVybiB1bmRlZmluZWQ7IH1cbn1cblxuLyoqXG4gKiBPcHRpb25zIGZvciBjcmVhdGluZyBhIGNvbXBpbGVyXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBDb21waWxlck9wdGlvbnMgPSB7XG4gIHVzZUppdD86IGJvb2xlYW4sXG4gIGRlZmF1bHRFbmNhcHN1bGF0aW9uPzogVmlld0VuY2Fwc3VsYXRpb24sXG4gIHByb3ZpZGVycz86IFN0YXRpY1Byb3ZpZGVyW10sXG4gIG1pc3NpbmdUcmFuc2xhdGlvbj86IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5LFxuICBwcmVzZXJ2ZVdoaXRlc3BhY2VzPzogYm9vbGVhbixcbn07XG5cbi8qKlxuICogVG9rZW4gdG8gcHJvdmlkZSBDb21waWxlck9wdGlvbnMgaW4gdGhlIHBsYXRmb3JtIGluamVjdG9yLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IENPTVBJTEVSX09QVElPTlMgPSBuZXcgSW5qZWN0aW9uVG9rZW48Q29tcGlsZXJPcHRpb25zW10+KCdjb21waWxlck9wdGlvbnMnKTtcblxuLyoqXG4gKiBBIGZhY3RvcnkgZm9yIGNyZWF0aW5nIGEgQ29tcGlsZXJcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21waWxlckZhY3Rvcnkge1xuICBhYnN0cmFjdCBjcmVhdGVDb21waWxlcihvcHRpb25zPzogQ29tcGlsZXJPcHRpb25zW10pOiBDb21waWxlcjtcbn1cbiJdfQ==