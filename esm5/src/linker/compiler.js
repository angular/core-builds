/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable, InjectionToken } from '../di';
/**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * \@experimental
 * @template T
 */
var /**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * \@experimental
 * @template T
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
 * \@experimental
 * @template T
 */
export { ModuleWithComponentFactories };
function ModuleWithComponentFactories_tsickle_Closure_declarations() {
    /** @type {?} */
    ModuleWithComponentFactories.prototype.ngModuleFactory;
    /** @type {?} */
    ModuleWithComponentFactories.prototype.componentFactories;
}
/**
 * @return {?}
 */
function _throwError() {
    throw new Error("Runtime compiler is not loaded");
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
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    Compiler.prototype.compileModuleSync = /**
     * Compiles the given NgModule and all of its components. All templates of the components listed
     * in `entryComponents` have to be inlined.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    function (moduleType) { throw _throwError(); };
    /**
     * Compiles the given NgModule and all of its components
     */
    /**
     * Compiles the given NgModule and all of its components
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    Compiler.prototype.compileModuleAsync = /**
     * Compiles the given NgModule and all of its components
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    function (moduleType) { throw _throwError(); };
    /**
     * Same as {@link #compileModuleSync} but also creates ComponentFactories for all components.
     */
    /**
     * Same as {\@link #compileModuleSync} but also creates ComponentFactories for all components.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    Compiler.prototype.compileModuleAndAllComponentsSync = /**
     * Same as {\@link #compileModuleSync} but also creates ComponentFactories for all components.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    function (moduleType) {
        throw _throwError();
    };
    /**
     * Same as {@link #compileModuleAsync} but also creates ComponentFactories for all components.
     */
    /**
     * Same as {\@link #compileModuleAsync} but also creates ComponentFactories for all components.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    Compiler.prototype.compileModuleAndAllComponentsAsync = /**
     * Same as {\@link #compileModuleAsync} but also creates ComponentFactories for all components.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    function (moduleType) {
        throw _throwError();
    };
    /**
     * Clears all caches.
     */
    /**
     * Clears all caches.
     * @return {?}
     */
    Compiler.prototype.clearCache = /**
     * Clears all caches.
     * @return {?}
     */
    function () { };
    /**
     * Clears the cache for the given component/ngModule.
     */
    /**
     * Clears the cache for the given component/ngModule.
     * @param {?} type
     * @return {?}
     */
    Compiler.prototype.clearCacheFor = /**
     * Clears the cache for the given component/ngModule.
     * @param {?} type
     * @return {?}
     */
    function (type) { };
    Compiler.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    Compiler.ctorParameters = function () { return []; };
    return Compiler;
}());
export { Compiler };
function Compiler_tsickle_Closure_declarations() {
    /** @type {!Array<{type: !Function, args: (undefined|!Array<?>)}>} */
    Compiler.decorators;
    /**
     * @nocollapse
     * @type {function(): !Array<(null|{type: ?, decorators: (undefined|!Array<{type: !Function, args: (undefined|!Array<?>)}>)})>}
     */
    Compiler.ctorParameters;
}
/**
 * Token to provide CompilerOptions in the platform injector.
 *
 * \@experimental
 */
export var /** @type {?} */ COMPILER_OPTIONS = new InjectionToken('compilerOptions');
/**
 * A factory for creating a Compiler
 *
 * \@experimental
 * @abstract
 */
var /**
 * A factory for creating a Compiler
 *
 * \@experimental
 * @abstract
 */
CompilerFactory = /** @class */ (function () {
    function CompilerFactory() {
    }
    return CompilerFactory;
}());
/**
 * A factory for creating a Compiler
 *
 * \@experimental
 * @abstract
 */
export { CompilerFactory };
function CompilerFactory_tsickle_Closure_declarations() {
    /**
     * @abstract
     * @param {?=} options
     * @return {?}
     */
    CompilerFactory.prototype.createCompiler = function (options) { };
}
//# sourceMappingURL=compiler.js.map