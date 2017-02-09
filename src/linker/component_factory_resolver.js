/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../facade/lang';
/**
 * @param {?} component
 * @return {?}
 */
export function noComponentFactoryError(component) {
    const /** @type {?} */ error = Error(`No component factory found for ${stringify(component)}. Did you add it to @NgModule.entryComponents?`);
    ((error))[ERROR_COMPONENT] = component;
    return error;
}
const /** @type {?} */ ERROR_COMPONENT = 'ngComponent';
/**
 * @param {?} error
 * @return {?}
 */
export function getComponent(error) {
    return ((error))[ERROR_COMPONENT];
}
class _NullComponentFactoryResolver {
    /**
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        throw noComponentFactoryError(component);
    }
}
/**
 * \@stable
 * @abstract
 */
export class ComponentFactoryResolver {
    /**
     * @abstract
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) { }
}
ComponentFactoryResolver.NULL = new _NullComponentFactoryResolver();
function ComponentFactoryResolver_tsickle_Closure_declarations() {
    /** @type {?} */
    ComponentFactoryResolver.NULL;
}
export class CodegenComponentFactoryResolver {
    /**
     * @param {?} factories
     * @param {?} _parent
     */
    constructor(factories, _parent) {
        this._parent = _parent;
        this._factories = new Map();
        for (let i = 0; i < factories.length; i++) {
            const factory = factories[i];
            this._factories.set(factory.componentType, factory);
        }
    }
    /**
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        let /** @type {?} */ result = this._factories.get(component);
        if (!result) {
            result = this._parent.resolveComponentFactory(component);
        }
        return result;
    }
}
function CodegenComponentFactoryResolver_tsickle_Closure_declarations() {
    /** @type {?} */
    CodegenComponentFactoryResolver.prototype._factories;
    /** @type {?} */
    CodegenComponentFactoryResolver.prototype._parent;
}
//# sourceMappingURL=component_factory_resolver.js.map