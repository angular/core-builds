/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../metadata/view';
import * as v1 from '../render/api';
export class DirectDomRenderer {
    /**
     * @param {?} name
     * @return {?}
     */
    createElement(name) { return document.createElement(name); }
    /**
     * @param {?} value
     * @return {?}
     */
    createComment(value) { return document.createComment(value); }
    /**
     * @param {?} value
     * @return {?}
     */
    createText(value) { return document.createTextNode(value); }
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    appendChild(parent, newChild) { parent.appendChild(newChild); }
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    insertBefore(parent, newChild, refChild) {
        if (parent) {
            parent.insertBefore(newChild, refChild);
        }
    }
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    removeChild(parent, oldChild) {
        if (parent) {
            parent.removeChild(oldChild);
        }
    }
    /**
     * @param {?} selectorOrNode
     * @param {?=} debugInfo
     * @return {?}
     */
    selectRootElement(selectorOrNode, debugInfo) {
        let /** @type {?} */ el;
        if (typeof selectorOrNode === 'string') {
            el = document.querySelector(selectorOrNode);
        }
        else {
            el = selectorOrNode;
        }
        el.textContent = '';
        return el;
    }
    /**
     * @param {?} node
     * @return {?}
     */
    parentNode(node) { return node.parentNode; }
    /**
     * @param {?} node
     * @return {?}
     */
    nextSibling(node) { return node.nextSiblibng; }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setAttribute(el, name, value) { return el.setAttribute(name, value); }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    removeAttribute(el, name) { el.removeAttribute(name); }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    addClass(el, name) { el.classList.add(name); }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    removeClass(el, name) { el.classList.remove(name); }
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @return {?}
     */
    setStyle(el, style, value) { el.style[style] = value; }
    /**
     * @param {?} el
     * @param {?} style
     * @return {?}
     */
    removeStyle(el, style) {
        // IE requires '' instead of null
        // see https://github.com/angular/angular/issues/7916
        ((el.style))[style] = '';
    }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setProperty(el, name, value) { el[name] = value; }
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    setText(node, value) { node.nodeValue = value; }
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    listen(target, eventName, callback) {
        let /** @type {?} */ renderTarget;
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
        const /** @type {?} */ closure = (event) => {
            if (callback(event) === false) {
                event.preventDefault();
            }
        };
        renderTarget.addEventListener(eventName, closure);
        return () => renderTarget.removeEventListener(eventName, closure);
    }
}
const /** @type {?} */ EMPTY_V1_RENDER_COMPONENT_TYPE = new v1.RenderComponentType('EMPTY', '', 0, ViewEncapsulation.None, [], {});
/**
 * A temporal implementation of `Renderer` until we migrated our current renderer
 * in all packages to the new API.
 *
 * Note that this is not complete, e.g. does not support shadow dom, view encapsulation, ...!
 */
export class LegacyRendererAdapter {
    /**
     * @param {?} rootDelegate
     */
    constructor(rootDelegate) {
        this._delegate = rootDelegate.renderComponent(EMPTY_V1_RENDER_COMPONENT_TYPE);
    }
    /**
     * @param {?} name
     * @param {?=} debugInfo
     * @return {?}
     */
    createElement(name, debugInfo) {
        return this._delegate.createElement(null, name, debugInfo);
    }
    /**
     * @param {?} value
     * @param {?=} debugInfo
     * @return {?}
     */
    createComment(value, debugInfo) {
        return this._delegate.createTemplateAnchor(null, debugInfo);
    }
    /**
     * @param {?} value
     * @param {?=} debugInfo
     * @return {?}
     */
    createText(value, debugInfo) {
        return this._delegate.createText(null, value, debugInfo);
    }
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    appendChild(parent, newChild) { this._delegate.projectNodes(parent, [newChild]); }
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    insertBefore(parent, newChild, refChild) {
        const /** @type {?} */ beforeSibling = refChild.nextSiblingOf ? refChild.nextSiblingOf : refChild;
        this._delegate.attachViewAfter(beforeSibling, [newChild]);
    }
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    removeChild(parent, oldChild) {
        if (parent) {
            this._delegate.detachView([oldChild]);
        }
    }
    /**
     * @param {?} selectorOrNode
     * @param {?=} debugInfo
     * @return {?}
     */
    selectRootElement(selectorOrNode, debugInfo) {
        return this._delegate.selectRootElement(selectorOrNode, debugInfo);
    }
    /**
     * @param {?} node
     * @return {?}
     */
    parentNode(node) { return { parentOf: node }; }
    /**
     * @param {?} node
     * @return {?}
     */
    nextSibling(node) { return { nextSiblingOf: node }; }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setAttribute(el, name, value) {
        this._delegate.setElementAttribute(el, name, value);
    }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    removeAttribute(el, name) {
        this._delegate.setElementAttribute(el, name, null);
    }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    addClass(el, name) { this._delegate.setElementClass(el, name, true); }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    removeClass(el, name) { this._delegate.setElementClass(el, name, false); }
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @return {?}
     */
    setStyle(el, style, value) {
        this._delegate.setElementStyle(el, style, value);
    }
    /**
     * @param {?} el
     * @param {?} style
     * @return {?}
     */
    removeStyle(el, style) { this._delegate.setElementStyle(el, style, null); }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setProperty(el, name, value) {
        this._delegate.setElementProperty(el, name, value);
    }
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    setText(node, value) { this._delegate.setText(node, value); }
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    listen(target, eventName, callback) {
        if (typeof target === 'string') {
            return (this._delegate.listenGlobal(target, eventName, callback));
        }
        else {
            return (this._delegate.listen(target, eventName, callback));
        }
    }
}
function LegacyRendererAdapter_tsickle_Closure_declarations() {
    /** @type {?} */
    LegacyRendererAdapter.prototype._delegate;
}
//# sourceMappingURL=renderer.js.map