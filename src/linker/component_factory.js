/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { unimplemented } from '../facade/errors';
import { ElementRef } from './element_ref';
import { ViewUtils } from './view_utils';
/**
 * Represents an instance of a Component created via a {\@link ComponentFactory}.
 *
 * `ComponentRef` provides access to the Component Instance as well other objects related to this
 * Component Instance and allows you to destroy the Component Instance via the {\@link #destroy}
 * method.
 * \@stable
 * @abstract
 */
export class ComponentRef {
    /**
     * Location of the Host Element of this Component Instance.
     * @return {?}
     */
    get location() { return unimplemented(); }
    /**
     * The injector on which the component instance exists.
     * @return {?}
     */
    get injector() { return unimplemented(); }
    /**
     * The instance of the Component.
     * @return {?}
     */
    get instance() { return unimplemented(); }
    ;
    /**
     * The {\@link ViewRef} of the Host View of this Component instance.
     * @return {?}
     */
    get hostView() { return unimplemented(); }
    ;
    /**
     * The {\@link ChangeDetectorRef} of the Component instance.
     * @return {?}
     */
    get changeDetectorRef() { return unimplemented(); }
    /**
     * The component type.
     * @return {?}
     */
    get componentType() { return unimplemented(); }
    /**
     * Destroys the component instance and all of the data structures associated with it.
     * @abstract
     * @return {?}
     */
    destroy() { }
    /**
     * Allows to register a callback that will be called when the component is destroyed.
     * @abstract
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { }
}
export class ComponentRef_ extends ComponentRef {
    /**
     * @param {?} _index
     * @param {?} _parentView
     * @param {?} _nativeElement
     * @param {?} _component
     */
    constructor(_index, _parentView, _nativeElement, _component) {
        super();
        this._index = _index;
        this._parentView = _parentView;
        this._nativeElement = _nativeElement;
        this._component = _component;
    }
    /**
     * @return {?}
     */
    get location() { return new ElementRef(this._nativeElement); }
    /**
     * @return {?}
     */
    get injector() { return this._parentView.injector(this._index); }
    /**
     * @return {?}
     */
    get instance() { return this._component; }
    ;
    /**
     * @return {?}
     */
    get hostView() { return this._parentView.ref; }
    ;
    /**
     * @return {?}
     */
    get changeDetectorRef() { return this._parentView.ref; }
    ;
    /**
     * @return {?}
     */
    get componentType() { return (this._component.constructor); }
    /**
     * @return {?}
     */
    destroy() { this._parentView.detachAndDestroy(); }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { this.hostView.onDestroy(callback); }
}
function ComponentRef__tsickle_Closure_declarations() {
    /** @type {?} */
    ComponentRef_.prototype._index;
    /** @type {?} */
    ComponentRef_.prototype._parentView;
    /** @type {?} */
    ComponentRef_.prototype._nativeElement;
    /** @type {?} */
    ComponentRef_.prototype._component;
}
/**
 * \@stable
 */
export class ComponentFactory {
    /**
     * @param {?} selector
     * @param {?} _viewClass
     * @param {?} _componentType
     */
    constructor(selector, _viewClass, _componentType) {
        this.selector = selector;
        this._componentType = _componentType;
        this._viewClass = _viewClass;
    }
    /**
     * @return {?}
     */
    get componentType() { return this._componentType; }
    /**
     * Creates a new component.
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @return {?}
     */
    create(injector, projectableNodes = null, rootSelectorOrNode = null) {
        const /** @type {?} */ vu = injector.get(ViewUtils);
        if (!projectableNodes) {
            projectableNodes = [];
        }
        const /** @type {?} */ hostView = new this._viewClass(vu, null, null, null);
        return hostView.createHostView(rootSelectorOrNode, injector, projectableNodes);
    }
}
function ComponentFactory_tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ComponentFactory.prototype._viewClass;
    /** @type {?} */
    ComponentFactory.prototype.selector;
    /** @type {?} */
    ComponentFactory.prototype._componentType;
}
//# sourceMappingURL=component_factory.js.map