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
/**
 * Represents an instance of an NgModule created via a {\@link NgModuleFactory}.
 *
 * `NgModuleRef` provides access to the NgModule Instance as well other objects related to this
 * NgModule Instance.
 *
 *
 * @abstract
 * @template T
 */
var /**
 * Represents an instance of an NgModule created via a {\@link NgModuleFactory}.
 *
 * `NgModuleRef` provides access to the NgModule Instance as well other objects related to this
 * NgModule Instance.
 *
 *
 * @abstract
 * @template T
 */
NgModuleRef = /** @class */ (function () {
    function NgModuleRef() {
    }
    return NgModuleRef;
}());
/**
 * Represents an instance of an NgModule created via a {\@link NgModuleFactory}.
 *
 * `NgModuleRef` provides access to the NgModule Instance as well other objects related to this
 * NgModule Instance.
 *
 *
 * @abstract
 * @template T
 */
export { NgModuleRef };
function NgModuleRef_tsickle_Closure_declarations() {
    /**
     * The injector that contains all of the providers of the NgModule.
     * @abstract
     * @return {?}
     */
    NgModuleRef.prototype.injector = function () { };
    /**
     * The ComponentFactoryResolver to get hold of the ComponentFactories
     * declared in the `entryComponents` property of the module.
     * @abstract
     * @return {?}
     */
    NgModuleRef.prototype.componentFactoryResolver = function () { };
    /**
     * The NgModule instance.
     * @abstract
     * @return {?}
     */
    NgModuleRef.prototype.instance = function () { };
    /**
     * Destroys the module instance and all of the data structures associated with it.
     * @abstract
     * @return {?}
     */
    NgModuleRef.prototype.destroy = function () { };
    /**
     * Allows to register a callback that will be called when the module is destroyed.
     * @abstract
     * @param {?} callback
     * @return {?}
     */
    NgModuleRef.prototype.onDestroy = function (callback) { };
}
/**
 * @record
 * @template T
 */
export function InternalNgModuleRef() { }
function InternalNgModuleRef_tsickle_Closure_declarations() {
    /** @type {?} */
    InternalNgModuleRef.prototype._bootstrapComponents;
}
/**
 * \@experimental
 * @abstract
 * @template T
 */
var /**
 * \@experimental
 * @abstract
 * @template T
 */
NgModuleFactory = /** @class */ (function () {
    function NgModuleFactory() {
    }
    return NgModuleFactory;
}());
/**
 * \@experimental
 * @abstract
 * @template T
 */
export { NgModuleFactory };
function NgModuleFactory_tsickle_Closure_declarations() {
    /**
     * @abstract
     * @return {?}
     */
    NgModuleFactory.prototype.moduleType = function () { };
    /**
     * @abstract
     * @param {?} parentInjector
     * @return {?}
     */
    NgModuleFactory.prototype.create = function (parentInjector) { };
}
//# sourceMappingURL=ng_module_factory.js.map