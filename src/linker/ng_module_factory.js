/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector, THROW_IF_NOT_FOUND } from '../di/injector';
import { unimplemented } from '../facade/errors';
import { stringify } from '../facade/lang';
import { CodegenComponentFactoryResolver, ComponentFactoryResolver } from './component_factory_resolver';
/**
 * Represents an instance of an NgModule created via a {\@link NgModuleFactory}.
 *
 * `NgModuleRef` provides access to the NgModule Instance as well other objects related to this
 * NgModule Instance.
 *
 * \@stable
 * @abstract
 */
export class NgModuleRef {
    /**
     * The injector that contains all of the providers of the NgModule.
     * @return {?}
     */
    get injector() { return unimplemented(); }
    /**
     * The ComponentFactoryResolver to get hold of the ComponentFactories
     * declared in the `entryComponents` property of the module.
     * @return {?}
     */
    get componentFactoryResolver() { return unimplemented(); }
    /**
     * The NgModule instance.
     * @return {?}
     */
    get instance() { return unimplemented(); }
    /**
     * Destroys the module instance and all of the data structures associated with it.
     * @abstract
     * @return {?}
     */
    destroy() { }
    /**
     * Allows to register a callback that will be called when the module is destroyed.
     * @abstract
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { }
}
/**
 * \@experimental
 */
export class NgModuleFactory {
    /**
     * @param {?} _injectorClass
     * @param {?} _moduleType
     */
    constructor(_injectorClass, _moduleType) {
        this._injectorClass = _injectorClass;
        this._moduleType = _moduleType;
    }
    /**
     * @return {?}
     */
    get moduleType() { return this._moduleType; }
    /**
     * @param {?} parentInjector
     * @return {?}
     */
    create(parentInjector) {
        if (!parentInjector) {
            parentInjector = Injector.NULL;
        }
        const /** @type {?} */ instance = new this._injectorClass(parentInjector);
        instance.create();
        return instance;
    }
}
function NgModuleFactory_tsickle_Closure_declarations() {
    /** @type {?} */
    NgModuleFactory.prototype._injectorClass;
    /** @type {?} */
    NgModuleFactory.prototype._moduleType;
}
const /** @type {?} */ _UNDEFINED = new Object();
/**
 * @abstract
 */
export class NgModuleInjector extends CodegenComponentFactoryResolver {
    /**
     * @param {?} parent
     * @param {?} factories
     * @param {?} bootstrapFactories
     */
    constructor(parent, factories, bootstrapFactories) {
        super(factories, parent.get(ComponentFactoryResolver, ComponentFactoryResolver.NULL));
        this.parent = parent;
        this.bootstrapFactories = bootstrapFactories;
        this._destroyListeners = [];
        this._destroyed = false;
    }
    /**
     * @return {?}
     */
    create() { this.instance = this.createInternal(); }
    /**
     * @abstract
     * @return {?}
     */
    createInternal() { }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue = THROW_IF_NOT_FOUND) {
        if (token === Injector || token === ComponentFactoryResolver) {
            return this;
        }
        const /** @type {?} */ result = this.getInternal(token, _UNDEFINED);
        return result === _UNDEFINED ? this.parent.get(token, notFoundValue) : result;
    }
    /**
     * @abstract
     * @param {?} token
     * @param {?} notFoundValue
     * @return {?}
     */
    getInternal(token, notFoundValue) { }
    /**
     * @return {?}
     */
    get injector() { return this; }
    /**
     * @return {?}
     */
    get componentFactoryResolver() { return this; }
    /**
     * @return {?}
     */
    destroy() {
        if (this._destroyed) {
            throw new Error(`The ng module ${stringify(this.instance.constructor)} has already been destroyed.`);
        }
        this._destroyed = true;
        this.destroyInternal();
        this._destroyListeners.forEach((listener) => listener());
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { this._destroyListeners.push(callback); }
    /**
     * @abstract
     * @return {?}
     */
    destroyInternal() { }
}
function NgModuleInjector_tsickle_Closure_declarations() {
    /** @type {?} */
    NgModuleInjector.prototype._destroyListeners;
    /** @type {?} */
    NgModuleInjector.prototype._destroyed;
    /** @type {?} */
    NgModuleInjector.prototype.instance;
    /** @type {?} */
    NgModuleInjector.prototype.parent;
    /** @type {?} */
    NgModuleInjector.prototype.bootstrapFactories;
}
//# sourceMappingURL=ng_module_factory.js.map