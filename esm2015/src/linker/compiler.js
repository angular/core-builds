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
import { Injectable } from '../di/injectable';
import { InjectionToken } from '../di/injection_token';
/**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * \@experimental
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
    { type: Injectable }
];
/** @typedef {?} */
var CompilerOptions;
export { CompilerOptions };
/** *
 * Token to provide CompilerOptions in the platform injector.
 *
 * \@experimental
  @type {?} */
export const COMPILER_OPTIONS = new InjectionToken('compilerOptions');
/**
 * A factory for creating a Compiler
 *
 * \@experimental
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7Ozs7O0FBZ0JyRCxNQUFNLE9BQU8sNEJBQTRCOzs7OztJQUN2QyxZQUNXLGlCQUNBO1FBREEsb0JBQWUsR0FBZixlQUFlO1FBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQjtLQUE2QjtDQUMzRDs7Ozs7Ozs7OztBQUdELFNBQVMsV0FBVztJQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7Q0FDbkQ7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxPQUFPLFFBQVE7Ozs7Ozs7O0lBS25CLGlCQUFpQixDQUFJLFVBQW1CLElBQXdCLE1BQU0sV0FBVyxFQUFFLENBQUMsRUFBRTs7Ozs7OztJQUt0RixrQkFBa0IsQ0FBSSxVQUFtQixJQUFpQyxNQUFNLFdBQVcsRUFBRSxDQUFDLEVBQUU7Ozs7Ozs7SUFLaEcsaUNBQWlDLENBQUksVUFBbUI7UUFDdEQsTUFBTSxXQUFXLEVBQUUsQ0FBQztLQUNyQjs7Ozs7OztJQUtELGtDQUFrQyxDQUFJLFVBQW1CO1FBRXZELE1BQU0sV0FBVyxFQUFFLENBQUM7S0FDckI7Ozs7O0lBS0QsVUFBVSxNQUFXOzs7Ozs7SUFLckIsYUFBYSxDQUFDLElBQWUsS0FBSTs7Ozs7O0lBS2pDLFdBQVcsQ0FBQyxVQUFxQixJQUFzQixPQUFPLFNBQVMsQ0FBQyxFQUFFOzs7WUF6QzNFLFVBQVU7Ozs7Ozs7Ozs7QUE4RFgsYUFBYSxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsQ0FBb0IsaUJBQWlCLENBQUMsQ0FBQzs7Ozs7OztBQU96RixNQUFNLE9BQWdCLGVBQWU7Q0FFcEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi4vZGkvcHJvdmlkZXInO1xuaW1wb3J0IHtNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneX0gZnJvbSAnLi4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL25nX21vZHVsZV9mYWN0b3J5JztcblxuXG5cbi8qKlxuICogQ29tYmluYXRpb24gb2YgTmdNb2R1bGVGYWN0b3J5IGFuZCBDb21wb25lbnRGYWN0b3J5cy5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjbGFzcyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgbmdNb2R1bGVGYWN0b3J5OiBOZ01vZHVsZUZhY3Rvcnk8VD4sXG4gICAgICBwdWJsaWMgY29tcG9uZW50RmFjdG9yaWVzOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSkge31cbn1cblxuXG5mdW5jdGlvbiBfdGhyb3dFcnJvcigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKGBSdW50aW1lIGNvbXBpbGVyIGlzIG5vdCBsb2FkZWRgKTtcbn1cblxuLyoqXG4gKiBMb3ctbGV2ZWwgc2VydmljZSBmb3IgcnVubmluZyB0aGUgYW5ndWxhciBjb21waWxlciBkdXJpbmcgcnVudGltZVxuICogdG8gY3JlYXRlIHtAbGluayBDb21wb25lbnRGYWN0b3J5fXMsIHdoaWNoXG4gKiBjYW4gbGF0ZXIgYmUgdXNlZCB0byBjcmVhdGUgYW5kIHJlbmRlciBhIENvbXBvbmVudCBpbnN0YW5jZS5cbiAqXG4gKiBFYWNoIGBATmdNb2R1bGVgIHByb3ZpZGVzIGFuIG93biBgQ29tcGlsZXJgIHRvIGl0cyBpbmplY3RvcixcbiAqIHRoYXQgd2lsbCB1c2UgdGhlIGRpcmVjdGl2ZXMvcGlwZXMgb2YgdGhlIG5nIG1vZHVsZSBmb3IgY29tcGlsYXRpb25cbiAqIG9mIGNvbXBvbmVudHMuXG4gKlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQ29tcGlsZXIge1xuICAvKipcbiAgICogQ29tcGlsZXMgdGhlIGdpdmVuIE5nTW9kdWxlIGFuZCBhbGwgb2YgaXRzIGNvbXBvbmVudHMuIEFsbCB0ZW1wbGF0ZXMgb2YgdGhlIGNvbXBvbmVudHMgbGlzdGVkXG4gICAqIGluIGBlbnRyeUNvbXBvbmVudHNgIGhhdmUgdG8gYmUgaW5saW5lZC5cbiAgICovXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4geyB0aHJvdyBfdGhyb3dFcnJvcigpOyB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGVzIHRoZSBnaXZlbiBOZ01vZHVsZSBhbmQgYWxsIG9mIGl0cyBjb21wb25lbnRzXG4gICAqL1xuICBjb21waWxlTW9kdWxlQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PFQ+PiB7IHRocm93IF90aHJvd0Vycm9yKCk7IH1cblxuICAvKipcbiAgICogU2FtZSBhcyB7QGxpbmsgI2NvbXBpbGVNb2R1bGVTeW5jfSBidXQgYWxzbyBjcmVhdGVzIENvbXBvbmVudEZhY3RvcmllcyBmb3IgYWxsIGNvbXBvbmVudHMuXG4gICAqL1xuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIHRocm93IF90aHJvd0Vycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyB7QGxpbmsgI2NvbXBpbGVNb2R1bGVBc3luY30gYnV0IGFsc28gY3JlYXRlcyBDb21wb25lbnRGYWN0b3JpZXMgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgKi9cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTpcbiAgICAgIFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIHRocm93IF90aHJvd0Vycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBjYWNoZXMuXG4gICAqL1xuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBjYWNoZSBmb3IgdGhlIGdpdmVuIGNvbXBvbmVudC9uZ01vZHVsZS5cbiAgICovXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KSB7fVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBmb3IgYSBnaXZlbiBOZ01vZHVsZSwgaWYgb25lIGlzIGRlZmluZWQgYW5kIGtub3duIHRvIHRoZSBjb21waWxlci5cbiAgICovXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG59XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgY3JlYXRpbmcgYSBjb21waWxlclxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IHR5cGUgQ29tcGlsZXJPcHRpb25zID0ge1xuICB1c2VKaXQ/OiBib29sZWFuLFxuICBkZWZhdWx0RW5jYXBzdWxhdGlvbj86IFZpZXdFbmNhcHN1bGF0aW9uLFxuICBwcm92aWRlcnM/OiBTdGF0aWNQcm92aWRlcltdLFxuICBtaXNzaW5nVHJhbnNsYXRpb24/OiBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSxcbiAgcHJlc2VydmVXaGl0ZXNwYWNlcz86IGJvb2xlYW4sXG59O1xuXG4vKipcbiAqIFRva2VuIHRvIHByb3ZpZGUgQ29tcGlsZXJPcHRpb25zIGluIHRoZSBwbGF0Zm9ybSBpbmplY3Rvci5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjb25zdCBDT01QSUxFUl9PUFRJT05TID0gbmV3IEluamVjdGlvblRva2VuPENvbXBpbGVyT3B0aW9uc1tdPignY29tcGlsZXJPcHRpb25zJyk7XG5cbi8qKlxuICogQSBmYWN0b3J5IGZvciBjcmVhdGluZyBhIENvbXBpbGVyXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcGlsZXJGYWN0b3J5IHtcbiAgYWJzdHJhY3QgY3JlYXRlQ29tcGlsZXIob3B0aW9ucz86IENvbXBpbGVyT3B0aW9uc1tdKTogQ29tcGlsZXI7XG59XG4iXX0=