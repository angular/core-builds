/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
var ComponentRef = (function () {
    function ComponentRef() {
    }
    /**
     * Location of the Host Element of this Component Instance.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.location = function () { };
    /**
     * The injector on which the component instance exists.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.injector = function () { };
    /**
     * The instance of the Component.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.instance = function () { };
    /**
     * The {\@link ViewRef} of the Host View of this Component instance.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.hostView = function () { };
    /**
     * The {\@link ChangeDetectorRef} of the Component instance.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.changeDetectorRef = function () { };
    /**
     * The component type.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.componentType = function () { };
    /**
     * Destroys the component instance and all of the data structures associated with it.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.destroy = function () { };
    /**
     * Allows to register a callback that will be called when the component is destroyed.
     * @abstract
     * @param {?} callback
     * @return {?}
     */
    ComponentRef.prototype.onDestroy = function (callback) { };
    return ComponentRef;
}());
export { ComponentRef };
/**
 * workaround https://github.com/angular/tsickle/issues/350
 * @suppress {checkTypes}
 */
var ComponentRef_ = (function (_super) {
    __extends(ComponentRef_, _super);
    /**
     * @param {?} _index
     * @param {?} _parentView
     * @param {?} _nativeElement
     * @param {?} _component
     */
    function ComponentRef_(_index, _parentView, _nativeElement, _component) {
        var _this = _super.call(this) || this;
        _this._index = _index;
        _this._parentView = _parentView;
        _this._nativeElement = _nativeElement;
        _this._component = _component;
        return _this;
    }
    Object.defineProperty(ComponentRef_.prototype, "location", {
        /**
         * @return {?}
         */
        get: function () { return new ElementRef(this._nativeElement); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "injector", {
        /**
         * @return {?}
         */
        get: function () { return this._parentView.injector(this._index); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "instance", {
        /**
         * @return {?}
         */
        get: function () { return this._component; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "hostView", {
        /**
         * @return {?}
         */
        get: function () { return this._parentView.ref; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "changeDetectorRef", {
        /**
         * @return {?}
         */
        get: function () { return this._parentView.ref; },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "componentType", {
        /**
         * @return {?}
         */
        get: function () { return (this._component.constructor); },
        enumerable: true,
        configurable: true
    });
    /**
     * @return {?}
     */
    ComponentRef_.prototype.destroy = function () { this._parentView.detachAndDestroy(); };
    /**
     * @param {?} callback
     * @return {?}
     */
    ComponentRef_.prototype.onDestroy = function (callback) { this.hostView.onDestroy(callback); };
    return ComponentRef_;
}(ComponentRef));
export { ComponentRef_ };
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
var ComponentFactory = (function () {
    /**
     * @param {?} selector
     * @param {?} _viewClass
     * @param {?} componentType
     */
    function ComponentFactory(selector, _viewClass, componentType) {
        this.selector = selector;
        this.componentType = componentType;
        this._viewClass = _viewClass;
    }
    /**
     * Creates a new component.
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @return {?}
     */
    ComponentFactory.prototype.create = function (injector, projectableNodes, rootSelectorOrNode) {
        if (projectableNodes === void 0) { projectableNodes = null; }
        if (rootSelectorOrNode === void 0) { rootSelectorOrNode = null; }
        var /** @type {?} */ vu = injector.get(ViewUtils);
        if (!projectableNodes) {
            projectableNodes = [];
        }
        var /** @type {?} */ hostView = new this._viewClass(vu, null, null, null);
        return hostView.createHostView(rootSelectorOrNode, injector, projectableNodes);
    };
    return ComponentFactory;
}());
export { ComponentFactory };
function ComponentFactory_tsickle_Closure_declarations() {
    /**
     * TODO(tbosch): type this properly to ViewDefinitionFactory again once the view engine
     * is the default.
     * \@internal
     * @type {?}
     */
    ComponentFactory.prototype._viewClass;
    /** @type {?} */
    ComponentFactory.prototype.selector;
    /** @type {?} */
    ComponentFactory.prototype.componentType;
}
//# sourceMappingURL=component_factory.js.map