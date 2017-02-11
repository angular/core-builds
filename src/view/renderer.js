/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../metadata/view';
import * as v1 from '../render/api';
var DirectDomRenderer = (function () {
    function DirectDomRenderer() {
    }
    /**
     * @param {?} name
     * @return {?}
     */
    DirectDomRenderer.prototype.createElement = function (name) { return document.createElement(name); };
    /**
     * @param {?} value
     * @return {?}
     */
    DirectDomRenderer.prototype.createComment = function (value) { return document.createComment(value); };
    /**
     * @param {?} value
     * @return {?}
     */
    DirectDomRenderer.prototype.createText = function (value) { return document.createTextNode(value); };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    DirectDomRenderer.prototype.appendChild = function (parent, newChild) { parent.appendChild(newChild); };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    DirectDomRenderer.prototype.insertBefore = function (parent, newChild, refChild) {
        if (parent) {
            parent.insertBefore(newChild, refChild);
        }
    };
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    DirectDomRenderer.prototype.removeChild = function (parent, oldChild) {
        if (parent) {
            parent.removeChild(oldChild);
        }
    };
    /**
     * @param {?} selectorOrNode
     * @param {?=} debugInfo
     * @return {?}
     */
    DirectDomRenderer.prototype.selectRootElement = function (selectorOrNode, debugInfo) {
        var /** @type {?} */ el;
        if (typeof selectorOrNode === 'string') {
            el = document.querySelector(selectorOrNode);
        }
        else {
            el = selectorOrNode;
        }
        el.textContent = '';
        return el;
    };
    /**
     * @param {?} node
     * @return {?}
     */
    DirectDomRenderer.prototype.parentNode = function (node) { return node.parentNode; };
    /**
     * @param {?} node
     * @return {?}
     */
    DirectDomRenderer.prototype.nextSibling = function (node) { return node.nextSiblibng; };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DirectDomRenderer.prototype.setAttribute = function (el, name, value) { return el.setAttribute(name, value); };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DirectDomRenderer.prototype.removeAttribute = function (el, name) { el.removeAttribute(name); };
    /**
     * @param {?} el
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    DirectDomRenderer.prototype.setBindingDebugInfo = function (el, propertyName, propertyValue) { };
    /**
     * @param {?} el
     * @param {?} propertyName
     * @return {?}
     */
    DirectDomRenderer.prototype.removeBindingDebugInfo = function (el, propertyName) { };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DirectDomRenderer.prototype.addClass = function (el, name) { el.classList.add(name); };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DirectDomRenderer.prototype.removeClass = function (el, name) { el.classList.remove(name); };
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @return {?}
     */
    DirectDomRenderer.prototype.setStyle = function (el, style, value) { el.style[style] = value; };
    /**
     * @param {?} el
     * @param {?} style
     * @return {?}
     */
    DirectDomRenderer.prototype.removeStyle = function (el, style) {
        // IE requires '' instead of null
        // see https://github.com/angular/angular/issues/7916
        ((el.style))[style] = '';
    };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DirectDomRenderer.prototype.setProperty = function (el, name, value) { el[name] = value; };
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    DirectDomRenderer.prototype.setText = function (node, value) { node.nodeValue = value; };
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    DirectDomRenderer.prototype.listen = function (target, eventName, callback) {
        var /** @type {?} */ renderTarget;
        switch (target) {
            case 'window':
                renderTarget = window;
                break;
            case 'document':
                renderTarget = document;
                break;
            default:
                renderTarget = target;
        }
        var /** @type {?} */ closure = function (event) {
            if (callback(event) === false) {
                event.preventDefault();
            }
        };
        renderTarget.addEventListener(eventName, closure);
        return function () { return renderTarget.removeEventListener(eventName, closure); };
    };
    return DirectDomRenderer;
}());
export { DirectDomRenderer };
var /** @type {?} */ EMPTY_V1_RENDER_COMPONENT_TYPE = new v1.RenderComponentType('EMPTY', '', 0, ViewEncapsulation.None, [], {});
/**
 * A temporal implementation of `Renderer` until we migrated our current renderer
 * in all packages to the new API.
 *
 * Note that this is not complete, e.g. does not support shadow dom, view encapsulation, ...!
 */
var LegacyRendererAdapter = (function () {
    /**
     * @param {?} rootDelegate
     */
    function LegacyRendererAdapter(rootDelegate) {
        this._delegate = rootDelegate.renderComponent(EMPTY_V1_RENDER_COMPONENT_TYPE);
    }
    /**
     * @param {?} name
     * @param {?=} debugInfo
     * @return {?}
     */
    LegacyRendererAdapter.prototype.createElement = function (name, debugInfo) {
        return this._delegate.createElement(null, name, debugInfo);
    };
    /**
     * @param {?} value
     * @param {?=} debugInfo
     * @return {?}
     */
    LegacyRendererAdapter.prototype.createComment = function (value, debugInfo) {
        return this._delegate.createTemplateAnchor(null, debugInfo);
    };
    /**
     * @param {?} value
     * @param {?=} debugInfo
     * @return {?}
     */
    LegacyRendererAdapter.prototype.createText = function (value, debugInfo) {
        return this._delegate.createText(null, value, debugInfo);
    };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    LegacyRendererAdapter.prototype.appendChild = function (parent, newChild) { this._delegate.projectNodes(parent, [newChild]); };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    LegacyRendererAdapter.prototype.insertBefore = function (parent, newChild, refChild) {
        if (refChild) {
            this._delegate.attachViewAfter(refChild.previousSibling, [newChild]);
        }
        else {
            this.appendChild(parent, newChild);
        }
    };
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    LegacyRendererAdapter.prototype.removeChild = function (parent, oldChild) {
        if (parent) {
            this._delegate.detachView([oldChild]);
        }
    };
    /**
     * @param {?} selectorOrNode
     * @param {?=} debugInfo
     * @return {?}
     */
    LegacyRendererAdapter.prototype.selectRootElement = function (selectorOrNode, debugInfo) {
        return this._delegate.selectRootElement(selectorOrNode, debugInfo);
    };
    /**
     * @param {?} node
     * @return {?}
     */
    LegacyRendererAdapter.prototype.parentNode = function (node) { return node.parentNode; };
    /**
     * @param {?} node
     * @return {?}
     */
    LegacyRendererAdapter.prototype.nextSibling = function (node) { return node.nextSibling; };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    LegacyRendererAdapter.prototype.setAttribute = function (el, name, value) {
        this._delegate.setElementAttribute(el, name, value);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    LegacyRendererAdapter.prototype.removeAttribute = function (el, name) {
        this._delegate.setElementAttribute(el, name, null);
    };
    /**
     * @param {?} el
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    LegacyRendererAdapter.prototype.setBindingDebugInfo = function (el, propertyName, propertyValue) {
        this._delegate.setBindingDebugInfo(el, propertyName, propertyValue);
    };
    /**
     * @param {?} el
     * @param {?} propertyName
     * @return {?}
     */
    LegacyRendererAdapter.prototype.removeBindingDebugInfo = function (el, propertyName) {
        this._delegate.setBindingDebugInfo(el, propertyName, null);
    };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    LegacyRendererAdapter.prototype.addClass = function (el, name) { this._delegate.setElementClass(el, name, true); };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    LegacyRendererAdapter.prototype.removeClass = function (el, name) { this._delegate.setElementClass(el, name, false); };
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @return {?}
     */
    LegacyRendererAdapter.prototype.setStyle = function (el, style, value) {
        this._delegate.setElementStyle(el, style, value);
    };
    /**
     * @param {?} el
     * @param {?} style
     * @return {?}
     */
    LegacyRendererAdapter.prototype.removeStyle = function (el, style) { this._delegate.setElementStyle(el, style, null); };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    LegacyRendererAdapter.prototype.setProperty = function (el, name, value) {
        this._delegate.setElementProperty(el, name, value);
    };
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    LegacyRendererAdapter.prototype.setText = function (node, value) { this._delegate.setText(node, value); };
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    LegacyRendererAdapter.prototype.listen = function (target, eventName, callback) {
        if (typeof target === 'string') {
            return (this._delegate.listenGlobal(target, eventName, callback));
        }
        else {
            return (this._delegate.listen(target, eventName, callback));
        }
    };
    return LegacyRendererAdapter;
}());
export { LegacyRendererAdapter };
function LegacyRendererAdapter_tsickle_Closure_declarations() {
    /** @type {?} */
    LegacyRendererAdapter.prototype._delegate;
}
//# sourceMappingURL=renderer.js.map