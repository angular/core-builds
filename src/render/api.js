/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export class RenderComponentType {
    /**
     * @param {?} id
     * @param {?} templateUrl
     * @param {?} slotCount
     * @param {?} encapsulation
     * @param {?} styles
     * @param {?} animations
     */
    constructor(id, templateUrl, slotCount, encapsulation, styles, animations) {
        this.id = id;
        this.templateUrl = templateUrl;
        this.slotCount = slotCount;
        this.encapsulation = encapsulation;
        this.styles = styles;
        this.animations = animations;
    }
}
function RenderComponentType_tsickle_Closure_declarations() {
    /** @type {?} */
    RenderComponentType.prototype.id;
    /** @type {?} */
    RenderComponentType.prototype.templateUrl;
    /** @type {?} */
    RenderComponentType.prototype.slotCount;
    /** @type {?} */
    RenderComponentType.prototype.encapsulation;
    /** @type {?} */
    RenderComponentType.prototype.styles;
    /** @type {?} */
    RenderComponentType.prototype.animations;
}
/**
 * @abstract
 */
export class RenderDebugInfo {
    /**
     * @abstract
     * @return {?}
     */
    injector() { }
    /**
     * @abstract
     * @return {?}
     */
    component() { }
    /**
     * @abstract
     * @return {?}
     */
    providerTokens() { }
    /**
     * @abstract
     * @return {?}
     */
    references() { }
    /**
     * @abstract
     * @return {?}
     */
    context() { }
    /**
     * @abstract
     * @return {?}
     */
    source() { }
}
/**
 * \@experimental
 * @abstract
 */
export class Renderer {
    /**
     * @abstract
     * @param {?} selectorOrNode
     * @param {?=} debugInfo
     * @return {?}
     */
    selectRootElement(selectorOrNode, debugInfo) { }
    /**
     * @abstract
     * @param {?} parentElement
     * @param {?} name
     * @param {?=} debugInfo
     * @return {?}
     */
    createElement(parentElement, name, debugInfo) { }
    /**
     * @abstract
     * @param {?} hostElement
     * @return {?}
     */
    createViewRoot(hostElement) { }
    /**
     * @abstract
     * @param {?} parentElement
     * @param {?=} debugInfo
     * @return {?}
     */
    createTemplateAnchor(parentElement, debugInfo) { }
    /**
     * @abstract
     * @param {?} parentElement
     * @param {?} value
     * @param {?=} debugInfo
     * @return {?}
     */
    createText(parentElement, value, debugInfo) { }
    /**
     * @abstract
     * @param {?} parentElement
     * @param {?} nodes
     * @return {?}
     */
    projectNodes(parentElement, nodes) { }
    /**
     * @abstract
     * @param {?} node
     * @param {?} viewRootNodes
     * @return {?}
     */
    attachViewAfter(node, viewRootNodes) { }
    /**
     * @abstract
     * @param {?} viewRootNodes
     * @return {?}
     */
    detachView(viewRootNodes) { }
    /**
     * @abstract
     * @param {?} hostElement
     * @param {?} viewAllNodes
     * @return {?}
     */
    destroyView(hostElement, viewAllNodes) { }
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} name
     * @param {?} callback
     * @return {?}
     */
    listen(renderElement, name, callback) { }
    /**
     * @abstract
     * @param {?} target
     * @param {?} name
     * @param {?} callback
     * @return {?}
     */
    listenGlobal(target, name, callback) { }
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    setElementProperty(renderElement, propertyName, propertyValue) { }
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} attributeName
     * @param {?} attributeValue
     * @return {?}
     */
    setElementAttribute(renderElement, attributeName, attributeValue) { }
    /**
     * Used only in debug mode to serialize property changes to dom nodes as attributes.
     * @abstract
     * @param {?} renderElement
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    setBindingDebugInfo(renderElement, propertyName, propertyValue) { }
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} className
     * @param {?} isAdd
     * @return {?}
     */
    setElementClass(renderElement, className, isAdd) { }
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} styleName
     * @param {?} styleValue
     * @return {?}
     */
    setElementStyle(renderElement, styleName, styleValue) { }
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} methodName
     * @param {?=} args
     * @return {?}
     */
    invokeElementMethod(renderElement, methodName, args) { }
    /**
     * @abstract
     * @param {?} renderNode
     * @param {?} text
     * @return {?}
     */
    setText(renderNode, text) { }
    /**
     * @abstract
     * @param {?} element
     * @param {?} startingStyles
     * @param {?} keyframes
     * @param {?} duration
     * @param {?} delay
     * @param {?} easing
     * @param {?=} previousPlayers
     * @return {?}
     */
    animate(element, startingStyles, keyframes, duration, delay, easing, previousPlayers) { }
}
/**
 * Injectable service that provides a low-level interface for modifying the UI.
 *
 * Use this service to bypass Angular's templating and make custom UI changes that can't be
 * expressed declaratively. For example if you need to set a property or an attribute whose name is
 * not statically known, use {\@link #setElementProperty} or {\@link #setElementAttribute}
 * respectively.
 *
 * If you are implementing a custom renderer, you must implement this interface.
 *
 * The default Renderer implementation is `DomRenderer`. Also available is `WebWorkerRenderer`.
 * \@experimental
 * @abstract
 */
export class RootRenderer {
    /**
     * @abstract
     * @param {?} componentType
     * @return {?}
     */
    renderComponent(componentType) { }
}
/**
 * \@experimental
 * @abstract
 */
export class RendererFactoryV2 {
    /**
     * @abstract
     * @param {?} hostElement
     * @param {?} type
     * @return {?}
     */
    createRenderer(hostElement, type) { }
}
/**
 * \@experimental
 * @abstract
 */
export class RendererV2 {
    /**
     * @abstract
     * @return {?}
     */
    destroy() { }
    /**
     * @abstract
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    createElement(name, namespace) { }
    /**
     * @abstract
     * @param {?} value
     * @return {?}
     */
    createComment(value) { }
    /**
     * @abstract
     * @param {?} value
     * @return {?}
     */
    createText(value) { }
    /**
     * @abstract
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    appendChild(parent, newChild) { }
    /**
     * @abstract
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    insertBefore(parent, newChild, refChild) { }
    /**
     * @abstract
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    removeChild(parent, oldChild) { }
    /**
     * @abstract
     * @param {?} selectorOrNode
     * @return {?}
     */
    selectRootElement(selectorOrNode) { }
    /**
     * Attention: On WebWorkers, this will always return a value,
     * as we are asking for a result synchronously. I.e.
     * the caller can't rely on checking whether this is null or not.
     * @abstract
     * @param {?} node
     * @return {?}
     */
    parentNode(node) { }
    /**
     * Attention: On WebWorkers, this will always return a value,
     * as we are asking for a result synchronously. I.e.
     * the caller can't rely on checking whether this is null or not.
     * @abstract
     * @param {?} node
     * @return {?}
     */
    nextSibling(node) { }
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @param {?=} namespace
     * @return {?}
     */
    setAttribute(el, name, value, namespace) { }
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    removeAttribute(el, name, namespace) { }
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    addClass(el, name) { }
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    removeClass(el, name) { }
    /**
     * @abstract
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @param {?} hasVendorPrefix
     * @param {?} hasImportant
     * @return {?}
     */
    setStyle(el, style, value, hasVendorPrefix, hasImportant) { }
    /**
     * @abstract
     * @param {?} el
     * @param {?} style
     * @param {?} hasVendorPrefix
     * @return {?}
     */
    removeStyle(el, style, hasVendorPrefix) { }
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setProperty(el, name, value) { }
    /**
     * @abstract
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    setValue(node, value) { }
    /**
     * @abstract
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    listen(target, eventName, callback) { }
}
function RendererV2_tsickle_Closure_declarations() {
    /**
     * This property is allowed to be null / undefined,
     * in which case the view engine won't call it.
     * This is used as a performance optimization for production mode.
     * @type {?}
     */
    RendererV2.prototype.destroyNode;
}
//# sourceMappingURL=api.js.map