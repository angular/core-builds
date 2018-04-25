/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di';
import { defineInjectable } from '../di/defs';
/**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * @experimental
 */
var /**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * @experimental
 */
ModuleWithComponentFactories = /** @class */ (function () {
    function ModuleWithComponentFactories(ngModuleFactory, componentFactories) {
        this.ngModuleFactory = ngModuleFactory;
        this.componentFactories = componentFactories;
    }
    return ModuleWithComponentFactories;
}());
/**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * @experimental
 */
export { ModuleWithComponentFactories };
function _throwError() {
    throw new Error("Runtime compiler is not loaded");
}
/**
 * Low-level service for running the angular compiler during runtime
 * to create {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 *
 * Each `@NgModule` provides an own `Compiler` to its injector,
 * that will use the directives/pipes of the ng module for compilation
 * of components.
 *
 */
var Compiler = /** @class */ (function () {
    function Compiler() {
    }
    /**
     * Compiles the given NgModule and all of its components. All templates of the components listed
     * in `entryComponents` have to be inlined.
     */
    /**
       * Compiles the given NgModule and all of its components. All templates of the components listed
       * in `entryComponents` have to be inlined.
       */
    Compiler.prototype.compileModuleSync = /**
       * Compiles the given NgModule and all of its components. All templates of the components listed
       * in `entryComponents` have to be inlined.
       */
    function (moduleType) { throw _throwError(); };
    /**
     * Compiles the given NgModule and all of its components
     */
    /**
       * Compiles the given NgModule and all of its components
       */
    Compiler.prototype.compileModuleAsync = /**
       * Compiles the given NgModule and all of its components
       */
    function (moduleType) { throw _throwError(); };
    /**
     * Same as {@link #compileModuleSync} but also creates ComponentFactories for all components.
     */
    /**
       * Same as {@link #compileModuleSync} but also creates ComponentFactories for all components.
       */
    Compiler.prototype.compileModuleAndAllComponentsSync = /**
       * Same as {@link #compileModuleSync} but also creates ComponentFactories for all components.
       */
    function (moduleType) {
        throw _throwError();
    };
    /**
     * Same as {@link #compileModuleAsync} but also creates ComponentFactories for all components.
     */
    /**
       * Same as {@link #compileModuleAsync} but also creates ComponentFactories for all components.
       */
    Compiler.prototype.compileModuleAndAllComponentsAsync = /**
       * Same as {@link #compileModuleAsync} but also creates ComponentFactories for all components.
       */
    function (moduleType) {
        throw _throwError();
    };
    /**
     * Clears all caches.
     */
    /**
       * Clears all caches.
       */
    Compiler.prototype.clearCache = /**
       * Clears all caches.
       */
    function () { };
    /**
     * Clears the cache for the given component/ngModule.
     */
    /**
       * Clears the cache for the given component/ngModule.
       */
    Compiler.prototype.clearCacheFor = /**
       * Clears the cache for the given component/ngModule.
       */
    function (type) { };
    // `ngInjectableDef` is required in core-level code because it sits behind
    // the injector and any code the loads it inside may run into a dependency
    // loop (because Injectable is also in core. Do not use the code below
    // (use @Injectable({ providedIn, factory }))  instead...
    /**
       * @internal
       * @nocollapse
       */
    Compiler.ngInjectableDef = defineInjectable({ providedIn: 'root', factory: function () { return new Compiler(); } });
    return Compiler;
}());
export { Compiler };
/**
 * Token to provide CompilerOptions in the platform injector.
 *
 * @experimental
 */
export var COMPILER_OPTIONS = new InjectionToken('compilerOptions');
/**
 * A factory for creating a Compiler
 *
 * @experimental
 */
var /**
 * A factory for creating a Compiler
 *
 * @experimental
 */
CompilerFactory = /** @class */ (function () {
    function CompilerFactory() {
    }
    return CompilerFactory;
}());
/**
 * A factory for creating a Compiler
 *
 * @experimental
 */
export { CompilerFactory };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sRUFBYSxjQUFjLEVBQXlCLE1BQU0sT0FBTyxDQUFDO0FBQ3pFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLFlBQVksQ0FBQzs7Ozs7O0FBZTVDOzs7OztBQUFBO0lBQ0Usc0NBQ1csZUFBbUMsRUFDbkMsa0JBQTJDO1FBRDNDLG9CQUFlLEdBQWYsZUFBZSxDQUFvQjtRQUNuQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXlCO0tBQUk7dUNBM0I1RDtJQTRCQyxDQUFBOzs7Ozs7QUFKRCx3Q0FJQztBQUdEO0lBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0NBQ25EOzs7Ozs7Ozs7Ozs7OztJQXVCQzs7O09BR0c7Ozs7O0lBQ0gsb0NBQWlCOzs7O0lBQWpCLFVBQXFCLFVBQW1CLElBQXdCLE1BQU0sV0FBVyxFQUFFLENBQUMsRUFBRTtJQUV0Rjs7T0FFRzs7OztJQUNILHFDQUFrQjs7O0lBQWxCLFVBQXNCLFVBQW1CLElBQWlDLE1BQU0sV0FBVyxFQUFFLENBQUMsRUFBRTtJQUVoRzs7T0FFRzs7OztJQUNILG9EQUFpQzs7O0lBQWpDLFVBQXFDLFVBQW1CO1FBQ3RELE1BQU0sV0FBVyxFQUFFLENBQUM7S0FDckI7SUFFRDs7T0FFRzs7OztJQUNILHFEQUFrQzs7O0lBQWxDLFVBQXNDLFVBQW1CO1FBRXZELE1BQU0sV0FBVyxFQUFFLENBQUM7S0FDckI7SUFFRDs7T0FFRzs7OztJQUNILDZCQUFVOzs7SUFBVixlQUFxQjtJQUVyQjs7T0FFRzs7OztJQUNILGdDQUFhOzs7SUFBYixVQUFjLElBQWUsS0FBSTs7Ozs7Ozs7OytCQXBDUixnQkFBZ0IsQ0FBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLGNBQU0sT0FBQSxJQUFJLFFBQVEsRUFBRSxFQUFkLENBQWMsRUFBQyxDQUFDO21CQXREaEc7O1NBNkNhLFFBQVE7Ozs7OztBQWtFckIsTUFBTSxDQUFDLElBQU0sZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQW9CLGlCQUFpQixDQUFDLENBQUM7Ozs7OztBQU96Rjs7Ozs7QUFBQTs7OzBCQXRIQTtJQXdIQyxDQUFBOzs7Ozs7QUFGRCwyQkFFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgU3RhdGljUHJvdmlkZXIsIGluamVjdH0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi9kaS9kZWZzJztcbmltcG9ydCB7TWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3l9IGZyb20gJy4uL2kxOG4vdG9rZW5zJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uL21ldGFkYXRhJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeX0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeSc7XG5cblxuXG4vKipcbiAqIENvbWJpbmF0aW9uIG9mIE5nTW9kdWxlRmFjdG9yeSBhbmQgQ29tcG9uZW50RmFjdG9yeXMuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY2xhc3MgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIG5nTW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PFQ+LFxuICAgICAgcHVibGljIGNvbXBvbmVudEZhY3RvcmllczogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10pIHt9XG59XG5cblxuZnVuY3Rpb24gX3Rocm93RXJyb3IoKSB7XG4gIHRocm93IG5ldyBFcnJvcihgUnVudGltZSBjb21waWxlciBpcyBub3QgbG9hZGVkYCk7XG59XG5cbi8qKlxuICogTG93LWxldmVsIHNlcnZpY2UgZm9yIHJ1bm5pbmcgdGhlIGFuZ3VsYXIgY29tcGlsZXIgZHVyaW5nIHJ1bnRpbWVcbiAqIHRvIGNyZWF0ZSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX1zLCB3aGljaFxuICogY2FuIGxhdGVyIGJlIHVzZWQgdG8gY3JlYXRlIGFuZCByZW5kZXIgYSBDb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogRWFjaCBgQE5nTW9kdWxlYCBwcm92aWRlcyBhbiBvd24gYENvbXBpbGVyYCB0byBpdHMgaW5qZWN0b3IsXG4gKiB0aGF0IHdpbGwgdXNlIHRoZSBkaXJlY3RpdmVzL3BpcGVzIG9mIHRoZSBuZyBtb2R1bGUgZm9yIGNvbXBpbGF0aW9uXG4gKiBvZiBjb21wb25lbnRzLlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBpbGVyIHtcbiAgLy8gYG5nSW5qZWN0YWJsZURlZmAgaXMgcmVxdWlyZWQgaW4gY29yZS1sZXZlbCBjb2RlIGJlY2F1c2UgaXQgc2l0cyBiZWhpbmRcbiAgLy8gdGhlIGluamVjdG9yIGFuZCBhbnkgY29kZSB0aGUgbG9hZHMgaXQgaW5zaWRlIG1heSBydW4gaW50byBhIGRlcGVuZGVuY3lcbiAgLy8gbG9vcCAoYmVjYXVzZSBJbmplY3RhYmxlIGlzIGFsc28gaW4gY29yZS4gRG8gbm90IHVzZSB0aGUgY29kZSBiZWxvd1xuICAvLyAodXNlIEBJbmplY3RhYmxlKHsgcHJvdmlkZWRJbiwgZmFjdG9yeSB9KSkgIGluc3RlYWQuLi5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAbm9jb2xsYXBzZVxuICAgKi9cbiAgc3RhdGljIG5nSW5qZWN0YWJsZURlZiA9IGRlZmluZUluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gbmV3IENvbXBpbGVyKCl9KTtcblxuICAvKipcbiAgICogQ29tcGlsZXMgdGhlIGdpdmVuIE5nTW9kdWxlIGFuZCBhbGwgb2YgaXRzIGNvbXBvbmVudHMuIEFsbCB0ZW1wbGF0ZXMgb2YgdGhlIGNvbXBvbmVudHMgbGlzdGVkXG4gICAqIGluIGBlbnRyeUNvbXBvbmVudHNgIGhhdmUgdG8gYmUgaW5saW5lZC5cbiAgICovXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4geyB0aHJvdyBfdGhyb3dFcnJvcigpOyB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGVzIHRoZSBnaXZlbiBOZ01vZHVsZSBhbmQgYWxsIG9mIGl0cyBjb21wb25lbnRzXG4gICAqL1xuICBjb21waWxlTW9kdWxlQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PFQ+PiB7IHRocm93IF90aHJvd0Vycm9yKCk7IH1cblxuICAvKipcbiAgICogU2FtZSBhcyB7QGxpbmsgI2NvbXBpbGVNb2R1bGVTeW5jfSBidXQgYWxzbyBjcmVhdGVzIENvbXBvbmVudEZhY3RvcmllcyBmb3IgYWxsIGNvbXBvbmVudHMuXG4gICAqL1xuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIHRocm93IF90aHJvd0Vycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyB7QGxpbmsgI2NvbXBpbGVNb2R1bGVBc3luY30gYnV0IGFsc28gY3JlYXRlcyBDb21wb25lbnRGYWN0b3JpZXMgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgKi9cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTpcbiAgICAgIFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIHRocm93IF90aHJvd0Vycm9yKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBjYWNoZXMuXG4gICAqL1xuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBjYWNoZSBmb3IgdGhlIGdpdmVuIGNvbXBvbmVudC9uZ01vZHVsZS5cbiAgICovXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KSB7fVxufVxuXG4vKipcbiAqIE9wdGlvbnMgZm9yIGNyZWF0aW5nIGEgY29tcGlsZXJcbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCB0eXBlIENvbXBpbGVyT3B0aW9ucyA9IHtcbiAgdXNlSml0PzogYm9vbGVhbixcbiAgZGVmYXVsdEVuY2Fwc3VsYXRpb24/OiBWaWV3RW5jYXBzdWxhdGlvbixcbiAgcHJvdmlkZXJzPzogU3RhdGljUHJvdmlkZXJbXSxcbiAgbWlzc2luZ1RyYW5zbGF0aW9uPzogTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3ksXG4gIHByZXNlcnZlV2hpdGVzcGFjZXM/OiBib29sZWFuLFxufTtcblxuLyoqXG4gKiBUb2tlbiB0byBwcm92aWRlIENvbXBpbGVyT3B0aW9ucyBpbiB0aGUgcGxhdGZvcm0gaW5qZWN0b3IuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY29uc3QgQ09NUElMRVJfT1BUSU9OUyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxDb21waWxlck9wdGlvbnNbXT4oJ2NvbXBpbGVyT3B0aW9ucycpO1xuXG4vKipcbiAqIEEgZmFjdG9yeSBmb3IgY3JlYXRpbmcgYSBDb21waWxlclxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBpbGVyRmFjdG9yeSB7XG4gIGFic3RyYWN0IGNyZWF0ZUNvbXBpbGVyKG9wdGlvbnM/OiBDb21waWxlck9wdGlvbnNbXSk6IENvbXBpbGVyO1xufVxuIl19