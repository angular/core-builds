/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/debug/debug_node.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getViewComponent } from '../render3/global_utils_api';
import { CONTAINER_HEADER_OFFSET, NATIVE } from '../render3/interfaces/container';
import { isComponentHost, isLContainer } from '../render3/interfaces/type_checks';
import { DECLARATION_COMPONENT_VIEW, PARENT, TVIEW, T_HOST } from '../render3/interfaces/view';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER, renderStringify } from '../render3/util/misc_utils';
import { getComponentLViewByIndex, getNativeByTNodeOrNull } from '../render3/util/view_utils';
import { assertDomNode } from '../util/assert';
/**
 * \@publicApi
 */
export class DebugEventListener {
    /**
     * @param {?} name
     * @param {?} callback
     */
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}
if (false) {
    /** @type {?} */
    DebugEventListener.prototype.name;
    /** @type {?} */
    DebugEventListener.prototype.callback;
}
// WARNING: interface has both a type and a value, skipping emit
export class DebugNode__PRE_R3__ {
    /**
     * @param {?} nativeNode
     * @param {?} parent
     * @param {?} _debugContext
     */
    constructor(nativeNode, parent, _debugContext) {
        this.listeners = [];
        this.parent = null;
        this._debugContext = _debugContext;
        this.nativeNode = nativeNode;
        if (parent && parent instanceof DebugElement__PRE_R3__) {
            parent.addChild(this);
        }
    }
    /**
     * @return {?}
     */
    get injector() { return this._debugContext.injector; }
    /**
     * @return {?}
     */
    get componentInstance() { return this._debugContext.component; }
    /**
     * @return {?}
     */
    get context() { return this._debugContext.context; }
    /**
     * @return {?}
     */
    get references() { return this._debugContext.references; }
    /**
     * @return {?}
     */
    get providerTokens() { return this._debugContext.providerTokens; }
}
if (false) {
    /** @type {?} */
    DebugNode__PRE_R3__.prototype.listeners;
    /** @type {?} */
    DebugNode__PRE_R3__.prototype.parent;
    /** @type {?} */
    DebugNode__PRE_R3__.prototype.nativeNode;
    /**
     * @type {?}
     * @private
     */
    DebugNode__PRE_R3__.prototype._debugContext;
}
// WARNING: interface has both a type and a value, skipping emit
export class DebugElement__PRE_R3__ extends DebugNode__PRE_R3__ {
    /**
     * @param {?} nativeNode
     * @param {?} parent
     * @param {?} _debugContext
     */
    constructor(nativeNode, parent, _debugContext) {
        super(nativeNode, parent, _debugContext);
        this.properties = {};
        this.attributes = {};
        this.classes = {};
        this.styles = {};
        this.childNodes = [];
        this.nativeElement = nativeNode;
    }
    /**
     * @param {?} child
     * @return {?}
     */
    addChild(child) {
        if (child) {
            this.childNodes.push(child);
            ((/** @type {?} */ (child))).parent = this;
        }
    }
    /**
     * @param {?} child
     * @return {?}
     */
    removeChild(child) {
        /** @type {?} */
        const childIndex = this.childNodes.indexOf(child);
        if (childIndex !== -1) {
            ((/** @type {?} */ (child))).parent = null;
            this.childNodes.splice(childIndex, 1);
        }
    }
    /**
     * @param {?} child
     * @param {?} newChildren
     * @return {?}
     */
    insertChildrenAfter(child, newChildren) {
        /** @type {?} */
        const siblingIndex = this.childNodes.indexOf(child);
        if (siblingIndex !== -1) {
            this.childNodes.splice(siblingIndex + 1, 0, ...newChildren);
            newChildren.forEach((/**
             * @param {?} c
             * @return {?}
             */
            c => {
                if (c.parent) {
                    ((/** @type {?} */ (c.parent))).removeChild(c);
                }
                ((/** @type {?} */ (child))).parent = this;
            }));
        }
    }
    /**
     * @param {?} refChild
     * @param {?} newChild
     * @return {?}
     */
    insertBefore(refChild, newChild) {
        /** @type {?} */
        const refIndex = this.childNodes.indexOf(refChild);
        if (refIndex === -1) {
            this.addChild(newChild);
        }
        else {
            if (newChild.parent) {
                ((/** @type {?} */ (newChild.parent))).removeChild(newChild);
            }
            ((/** @type {?} */ (newChild))).parent = this;
            this.childNodes.splice(refIndex, 0, newChild);
        }
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    query(predicate) {
        /** @type {?} */
        const results = this.queryAll(predicate);
        return results[0] || null;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAll(predicate) {
        /** @type {?} */
        const matches = [];
        _queryElementChildren(this, predicate, matches);
        return matches;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAllNodes(predicate) {
        /** @type {?} */
        const matches = [];
        _queryNodeChildren(this, predicate, matches);
        return matches;
    }
    /**
     * @return {?}
     */
    get children() {
        return (/** @type {?} */ (this
            .childNodes //
            .filter((/**
         * @param {?} node
         * @return {?}
         */
        (node) => node instanceof DebugElement__PRE_R3__))));
    }
    /**
     * @param {?} eventName
     * @param {?} eventObj
     * @return {?}
     */
    triggerEventHandler(eventName, eventObj) {
        this.listeners.forEach((/**
         * @param {?} listener
         * @return {?}
         */
        (listener) => {
            if (listener.name == eventName) {
                listener.callback(eventObj);
            }
        }));
    }
}
if (false) {
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.name;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.properties;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.attributes;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.classes;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.styles;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.childNodes;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.nativeElement;
}
/**
 * \@publicApi
 * @param {?} debugEls
 * @return {?}
 */
export function asNativeElements(debugEls) {
    return debugEls.map((/**
     * @param {?} el
     * @return {?}
     */
    (el) => el.nativeElement));
}
/**
 * @param {?} element
 * @param {?} predicate
 * @param {?} matches
 * @return {?}
 */
function _queryElementChildren(element, predicate, matches) {
    element.childNodes.forEach((/**
     * @param {?} node
     * @return {?}
     */
    node => {
        if (node instanceof DebugElement__PRE_R3__) {
            if (predicate(node)) {
                matches.push(node);
            }
            _queryElementChildren(node, predicate, matches);
        }
    }));
}
/**
 * @param {?} parentNode
 * @param {?} predicate
 * @param {?} matches
 * @return {?}
 */
function _queryNodeChildren(parentNode, predicate, matches) {
    if (parentNode instanceof DebugElement__PRE_R3__) {
        parentNode.childNodes.forEach((/**
         * @param {?} node
         * @return {?}
         */
        node => {
            if (predicate(node)) {
                matches.push(node);
            }
            if (node instanceof DebugElement__PRE_R3__) {
                _queryNodeChildren(node, predicate, matches);
            }
        }));
    }
}
class DebugNode__POST_R3__ {
    /**
     * @param {?} nativeNode
     */
    constructor(nativeNode) { this.nativeNode = nativeNode; }
    /**
     * @return {?}
     */
    get parent() {
        /** @type {?} */
        const parent = (/** @type {?} */ (this.nativeNode.parentNode));
        return parent ? new DebugElement__POST_R3__(parent) : null;
    }
    /**
     * @return {?}
     */
    get injector() { return getInjector(this.nativeNode); }
    /**
     * @return {?}
     */
    get componentInstance() {
        /** @type {?} */
        const nativeElement = this.nativeNode;
        return nativeElement &&
            (getComponent((/** @type {?} */ (nativeElement))) || getViewComponent(nativeElement));
    }
    /**
     * @return {?}
     */
    get context() {
        return getComponent((/** @type {?} */ (this.nativeNode))) || getContext((/** @type {?} */ (this.nativeNode)));
    }
    /**
     * @return {?}
     */
    get listeners() {
        return getListeners((/** @type {?} */ (this.nativeNode))).filter(isBrowserEvents);
    }
    /**
     * @return {?}
     */
    get references() { return getLocalRefs(this.nativeNode); }
    /**
     * @return {?}
     */
    get providerTokens() { return getInjectionTokens((/** @type {?} */ (this.nativeNode))); }
}
if (false) {
    /** @type {?} */
    DebugNode__POST_R3__.prototype.nativeNode;
}
class DebugElement__POST_R3__ extends DebugNode__POST_R3__ {
    /**
     * @param {?} nativeNode
     */
    constructor(nativeNode) {
        ngDevMode && assertDomNode(nativeNode);
        super(nativeNode);
    }
    /**
     * @return {?}
     */
    get nativeElement() {
        return this.nativeNode.nodeType == Node.ELEMENT_NODE ? (/** @type {?} */ (this.nativeNode)) : null;
    }
    /**
     * @return {?}
     */
    get name() {
        try {
            /** @type {?} */
            const context = (/** @type {?} */ (loadLContext(this.nativeNode)));
            /** @type {?} */
            const lView = context.lView;
            /** @type {?} */
            const tData = lView[TVIEW].data;
            /** @type {?} */
            const tNode = (/** @type {?} */ (tData[context.nodeIndex]));
            return (/** @type {?} */ (tNode.tagName));
        }
        catch (e) {
            return this.nativeNode.nodeName;
        }
    }
    /**
     *  Gets a map of property names to property values for an element.
     *
     *  This map includes:
     *  - Regular property bindings (e.g. `[id]="id"`)
     *  - Host property bindings (e.g. `host: { '[id]': "id" }`)
     *  - Interpolated property bindings (e.g. `id="{{ value }}")
     *
     *  It does not include:
     *  - input property bindings (e.g. `[myCustomInput]="value"`)
     *  - attribute bindings (e.g. `[attr.role]="menu"`)
     * @return {?}
     */
    get properties() {
        /** @type {?} */
        const context = loadLContext(this.nativeNode, false);
        if (context == null) {
            return {};
        }
        /** @type {?} */
        const lView = context.lView;
        /** @type {?} */
        const tData = lView[TVIEW].data;
        /** @type {?} */
        const tNode = (/** @type {?} */ (tData[context.nodeIndex]));
        /** @type {?} */
        const properties = {};
        // Collect properties from the DOM.
        copyDomProperties(this.nativeElement, properties);
        // Collect properties from the bindings. This is needed for animation renderer which has
        // synthetic properties which don't get reflected into the DOM.
        collectPropertyBindings(properties, tNode, lView, tData);
        return properties;
    }
    /**
     * @return {?}
     */
    get attributes() {
        /** @type {?} */
        const attributes = {};
        /** @type {?} */
        const element = this.nativeElement;
        if (!element) {
            return attributes;
        }
        /** @type {?} */
        const context = loadLContext(element, false);
        if (context == null) {
            return {};
        }
        /** @type {?} */
        const lView = context.lView;
        /** @type {?} */
        const tNodeAttrs = ((/** @type {?} */ (lView[TVIEW].data[context.nodeIndex]))).attrs;
        /** @type {?} */
        const lowercaseTNodeAttrs = [];
        // For debug nodes we take the element's attribute directly from the DOM since it allows us
        // to account for ones that weren't set via bindings (e.g. ViewEngine keeps track of the ones
        // that are set through `Renderer2`). The problem is that the browser will lowercase all names,
        // however since we have the attributes already on the TNode, we can preserve the case by going
        // through them once, adding them to the `attributes` map and putting their lower-cased name
        // into an array. Afterwards when we're going through the native DOM attributes, we can check
        // whether we haven't run into an attribute already through the TNode.
        if (tNodeAttrs) {
            /** @type {?} */
            let i = 0;
            while (i < tNodeAttrs.length) {
                /** @type {?} */
                const attrName = tNodeAttrs[i];
                // Stop as soon as we hit a marker. We only care about the regular attributes. Everything
                // else will be handled below when we read the final attributes off the DOM.
                if (typeof attrName !== 'string')
                    break;
                /** @type {?} */
                const attrValue = tNodeAttrs[i + 1];
                attributes[attrName] = (/** @type {?} */ (attrValue));
                lowercaseTNodeAttrs.push(attrName.toLowerCase());
                i += 2;
            }
        }
        /** @type {?} */
        const eAttrs = element.attributes;
        for (let i = 0; i < eAttrs.length; i++) {
            /** @type {?} */
            const attr = eAttrs[i];
            /** @type {?} */
            const lowercaseName = attr.name.toLowerCase();
            // Make sure that we don't assign the same attribute both in its
            // case-sensitive form and the lower-cased one from the browser.
            if (lowercaseTNodeAttrs.indexOf(lowercaseName) === -1) {
                // Save the lowercase name to align the behavior between browsers.
                // IE preserves the case, while all other browser convert it to lower case.
                attributes[lowercaseName] = attr.value;
            }
        }
        return attributes;
    }
    /**
     * @return {?}
     */
    get styles() {
        if (this.nativeElement && ((/** @type {?} */ (this.nativeElement))).style) {
            return (/** @type {?} */ (((/** @type {?} */ (this.nativeElement))).style));
        }
        return {};
    }
    /**
     * @return {?}
     */
    get classes() {
        /** @type {?} */
        const result = {};
        /** @type {?} */
        const element = (/** @type {?} */ (this.nativeElement));
        // SVG elements return an `SVGAnimatedString` instead of a plain string for the `className`.
        /** @type {?} */
        const className = (/** @type {?} */ (element.className));
        /** @type {?} */
        const classes = className && typeof className !== 'string' ? className.baseVal.split(' ') :
            className.split(' ');
        classes.forEach((/**
         * @param {?} value
         * @return {?}
         */
        (value) => result[value] = true));
        return result;
    }
    /**
     * @return {?}
     */
    get childNodes() {
        /** @type {?} */
        const childNodes = this.nativeNode.childNodes;
        /** @type {?} */
        const children = [];
        for (let i = 0; i < childNodes.length; i++) {
            /** @type {?} */
            const element = childNodes[i];
            children.push(getDebugNode__POST_R3__(element));
        }
        return children;
    }
    /**
     * @return {?}
     */
    get children() {
        /** @type {?} */
        const nativeElement = this.nativeElement;
        if (!nativeElement)
            return [];
        /** @type {?} */
        const childNodes = nativeElement.children;
        /** @type {?} */
        const children = [];
        for (let i = 0; i < childNodes.length; i++) {
            /** @type {?} */
            const element = childNodes[i];
            children.push(getDebugNode__POST_R3__(element));
        }
        return children;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    query(predicate) {
        /** @type {?} */
        const results = this.queryAll(predicate);
        return results[0] || null;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAll(predicate) {
        /** @type {?} */
        const matches = [];
        _queryAllR3(this, predicate, matches, true);
        return matches;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAllNodes(predicate) {
        /** @type {?} */
        const matches = [];
        _queryAllR3(this, predicate, matches, false);
        return matches;
    }
    /**
     * @param {?} eventName
     * @param {?} eventObj
     * @return {?}
     */
    triggerEventHandler(eventName, eventObj) {
        /** @type {?} */
        const node = (/** @type {?} */ (this.nativeNode));
        /** @type {?} */
        const invokedListeners = [];
        this.listeners.forEach((/**
         * @param {?} listener
         * @return {?}
         */
        listener => {
            if (listener.name === eventName) {
                /** @type {?} */
                const callback = listener.callback;
                callback(eventObj);
                invokedListeners.push(callback);
            }
        }));
        // We need to check whether `eventListeners` exists, because it's something
        // that Zone.js only adds to `EventTarget` in browser environments.
        if (typeof node.eventListeners === 'function') {
            // Note that in Ivy we wrap event listeners with a call to `event.preventDefault` in some
            // cases. We use `Function` as a special token that gives us access to the actual event
            // listener.
            node.eventListeners(eventName).forEach((/**
             * @param {?} listener
             * @return {?}
             */
            (listener) => {
                /** @type {?} */
                const unwrappedListener = listener(Function);
                return invokedListeners.indexOf(unwrappedListener) === -1 && unwrappedListener(eventObj);
            }));
        }
    }
}
/**
 * @param {?} element
 * @param {?} properties
 * @return {?}
 */
function copyDomProperties(element, properties) {
    if (element) {
        // Skip own properties (as those are patched)
        /** @type {?} */
        let obj = Object.getPrototypeOf(element);
        /** @type {?} */
        const NodePrototype = Node.prototype;
        while (obj !== null && obj !== NodePrototype) {
            /** @type {?} */
            const descriptors = Object.getOwnPropertyDescriptors(obj);
            for (let key in descriptors) {
                if (!key.startsWith('__') && !key.startsWith('on')) {
                    // don't include properties starting with `__` and `on`.
                    // `__` are patched values which should not be included.
                    // `on` are listeners which also should not be included.
                    /** @type {?} */
                    const value = ((/** @type {?} */ (element)))[key];
                    if (isPrimitiveValue(value)) {
                        properties[key] = value;
                    }
                }
            }
            obj = Object.getPrototypeOf(obj);
        }
    }
}
/**
 * @param {?} value
 * @return {?}
 */
function isPrimitiveValue(value) {
    return typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' ||
        value === null;
}
/**
 * @param {?} parentElement
 * @param {?} predicate
 * @param {?} matches
 * @param {?} elementsOnly
 * @return {?}
 */
function _queryAllR3(parentElement, predicate, matches, elementsOnly) {
    /** @type {?} */
    const context = loadLContext(parentElement.nativeNode, false);
    if (context !== null) {
        /** @type {?} */
        const parentTNode = (/** @type {?} */ (context.lView[TVIEW].data[context.nodeIndex]));
        _queryNodeChildrenR3(parentTNode, context.lView, predicate, matches, elementsOnly, parentElement.nativeNode);
    }
    else {
        // If the context is null, then `parentElement` was either created with Renderer2 or native DOM
        // APIs.
        _queryNativeNodeDescendants(parentElement.nativeNode, predicate, matches, elementsOnly);
    }
}
/**
 * Recursively match the current TNode against the predicate, and goes on with the next ones.
 *
 * @param {?} tNode the current TNode
 * @param {?} lView the LView of this TNode
 * @param {?} predicate the predicate to match
 * @param {?} matches the list of positive matches
 * @param {?} elementsOnly whether only elements should be searched
 * @param {?} rootNativeNode the root native node on which predicate should not be matched
 * @return {?}
 */
function _queryNodeChildrenR3(tNode, lView, predicate, matches, elementsOnly, rootNativeNode) {
    /** @type {?} */
    const nativeNode = getNativeByTNodeOrNull(tNode, lView);
    // For each type of TNode, specific logic is executed.
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        // Case 1: the TNode is an element
        // The native node has to be checked.
        _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
        if (isComponentHost(tNode)) {
            // If the element is the host of a component, then all nodes in its view have to be processed.
            // Note: the component's content (tNode.child) will be processed from the insertion points.
            /** @type {?} */
            const componentView = getComponentLViewByIndex(tNode.index, lView);
            if (componentView && componentView[TVIEW].firstChild) {
                _queryNodeChildrenR3((/** @type {?} */ (componentView[TVIEW].firstChild)), componentView, predicate, matches, elementsOnly, rootNativeNode);
            }
        }
        else {
            if (tNode.child) {
                // Otherwise, its children have to be processed.
                _queryNodeChildrenR3(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
            }
            // We also have to query the DOM directly in order to catch elements inserted through
            // Renderer2. Note that this is __not__ optimal, because we're walking similar trees multiple
            // times. ViewEngine could do it more efficiently, because all the insertions go through
            // Renderer2, however that's not the case in Ivy. This approach is being used because:
            // 1. Matching the ViewEngine behavior would mean potentially introducing a depedency
            //    from `Renderer2` to Ivy which could bring Ivy code into ViewEngine.
            // 2. We would have to make `Renderer3` "know" about debug nodes.
            // 3. It allows us to capture nodes that were inserted directly via the DOM.
            nativeNode && _queryNativeNodeDescendants(nativeNode, predicate, matches, elementsOnly);
        }
        // In all cases, if a dynamic container exists for this node, each view inside it has to be
        // processed.
        /** @type {?} */
        const nodeOrContainer = lView[tNode.index];
        if (isLContainer(nodeOrContainer)) {
            _queryNodeChildrenInContainerR3(nodeOrContainer, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
    else if (tNode.type === 0 /* Container */) {
        // Case 2: the TNode is a container
        // The native node has to be checked.
        /** @type {?} */
        const lContainer = lView[tNode.index];
        _addQueryMatchR3(lContainer[NATIVE], predicate, matches, elementsOnly, rootNativeNode);
        // Each view inside the container has to be processed.
        _queryNodeChildrenInContainerR3(lContainer, predicate, matches, elementsOnly, rootNativeNode);
    }
    else if (tNode.type === 1 /* Projection */) {
        // Case 3: the TNode is a projection insertion point (i.e. a <ng-content>).
        // The nodes projected at this location all need to be processed.
        /** @type {?} */
        const componentView = (/** @type {?} */ (lView))[DECLARATION_COMPONENT_VIEW];
        /** @type {?} */
        const componentHost = (/** @type {?} */ (componentView[T_HOST]));
        /** @type {?} */
        const head = ((/** @type {?} */ (componentHost.projection)))[(/** @type {?} */ (tNode.projection))];
        if (Array.isArray(head)) {
            for (let nativeNode of head) {
                _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
            }
        }
        else if (head) {
            /** @type {?} */
            const nextLView = (/** @type {?} */ ((/** @type {?} */ (componentView[PARENT]))));
            /** @type {?} */
            const nextTNode = (/** @type {?} */ (nextLView[TVIEW].data[head.index]));
            _queryNodeChildrenR3(nextTNode, nextLView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
    else if (tNode.child) {
        // Case 4: the TNode is a view.
        _queryNodeChildrenR3(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
    }
    // We don't want to go to the next sibling of the root node.
    if (rootNativeNode !== nativeNode) {
        // To determine the next node to be processed, we need to use the next or the projectionNext
        // link, depending on whether the current node has been projected.
        /** @type {?} */
        const nextTNode = (tNode.flags & 4 /* isProjected */) ? tNode.projectionNext : tNode.next;
        if (nextTNode) {
            _queryNodeChildrenR3(nextTNode, lView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
}
/**
 * Process all TNodes in a given container.
 *
 * @param {?} lContainer the container to be processed
 * @param {?} predicate the predicate to match
 * @param {?} matches the list of positive matches
 * @param {?} elementsOnly whether only elements should be searched
 * @param {?} rootNativeNode the root native node on which predicate should not be matched
 * @return {?}
 */
function _queryNodeChildrenInContainerR3(lContainer, predicate, matches, elementsOnly, rootNativeNode) {
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        /** @type {?} */
        const childView = lContainer[i];
        _queryNodeChildrenR3((/** @type {?} */ (childView[TVIEW].node)), childView, predicate, matches, elementsOnly, rootNativeNode);
    }
}
/**
 * Match the current native node against the predicate.
 *
 * @param {?} nativeNode the current native node
 * @param {?} predicate the predicate to match
 * @param {?} matches the list of positive matches
 * @param {?} elementsOnly whether only elements should be searched
 * @param {?} rootNativeNode the root native node on which predicate should not be matched
 * @return {?}
 */
function _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode) {
    if (rootNativeNode !== nativeNode) {
        /** @type {?} */
        const debugNode = getDebugNode(nativeNode);
        if (!debugNode) {
            return;
        }
        // Type of the "predicate and "matches" array are set based on the value of
        // the "elementsOnly" parameter. TypeScript is not able to properly infer these
        // types with generics, so we manually cast the parameters accordingly.
        if (elementsOnly && debugNode instanceof DebugElement__POST_R3__ && predicate(debugNode) &&
            matches.indexOf(debugNode) === -1) {
            matches.push(debugNode);
        }
        else if (!elementsOnly && ((/** @type {?} */ (predicate)))(debugNode) &&
            ((/** @type {?} */ (matches))).indexOf(debugNode) === -1) {
            ((/** @type {?} */ (matches))).push(debugNode);
        }
    }
}
/**
 * Match all the descendants of a DOM node against a predicate.
 *
 * @param {?} parentNode
 * @param {?} predicate the predicate to match
 * @param {?} matches the list of positive matches
 * @param {?} elementsOnly whether only elements should be searched
 * @return {?}
 */
function _queryNativeNodeDescendants(parentNode, predicate, matches, elementsOnly) {
    /** @type {?} */
    const nodes = parentNode.childNodes;
    /** @type {?} */
    const length = nodes.length;
    for (let i = 0; i < length; i++) {
        /** @type {?} */
        const node = nodes[i];
        /** @type {?} */
        const debugNode = getDebugNode(node);
        if (debugNode) {
            if (elementsOnly && debugNode instanceof DebugElement__POST_R3__ && predicate(debugNode) &&
                matches.indexOf(debugNode) === -1) {
                matches.push(debugNode);
            }
            else if (!elementsOnly && ((/** @type {?} */ (predicate)))(debugNode) &&
                ((/** @type {?} */ (matches))).indexOf(debugNode) === -1) {
                ((/** @type {?} */ (matches))).push(debugNode);
            }
            _queryNativeNodeDescendants(node, predicate, matches, elementsOnly);
        }
    }
}
/**
 * Iterates through the property bindings for a given node and generates
 * a map of property names to values. This map only contains property bindings
 * defined in templates, not in host bindings.
 * @param {?} properties
 * @param {?} tNode
 * @param {?} lView
 * @param {?} tData
 * @return {?}
 */
function collectPropertyBindings(properties, tNode, lView, tData) {
    /** @type {?} */
    let bindingIndexes = tNode.propertyBindings;
    if (bindingIndexes !== null) {
        for (let i = 0; i < bindingIndexes.length; i++) {
            /** @type {?} */
            const bindingIndex = bindingIndexes[i];
            /** @type {?} */
            const propMetadata = (/** @type {?} */ (tData[bindingIndex]));
            /** @type {?} */
            const metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
            /** @type {?} */
            const propertyName = metadataParts[0];
            if (metadataParts.length > 1) {
                /** @type {?} */
                let value = metadataParts[1];
                for (let j = 1; j < metadataParts.length - 1; j++) {
                    value += renderStringify(lView[bindingIndex + j - 1]) + metadataParts[j + 1];
                }
                properties[propertyName] = value;
            }
            else {
                properties[propertyName] = lView[bindingIndex];
            }
        }
    }
}
// Need to keep the nodes in a global Map so that multiple angular apps are supported.
/** @type {?} */
const _nativeNodeToDebugNode = new Map();
/**
 * @param {?} nativeNode
 * @return {?}
 */
function getDebugNode__PRE_R3__(nativeNode) {
    return _nativeNodeToDebugNode.get(nativeNode) || null;
}
/** @type {?} */
const NG_DEBUG_PROPERTY = '__ng_debug__';
/**
 * @param {?} nativeNode
 * @return {?}
 */
export function getDebugNode__POST_R3__(nativeNode) {
    if (nativeNode instanceof Node) {
        if (!(nativeNode.hasOwnProperty(NG_DEBUG_PROPERTY))) {
            ((/** @type {?} */ (nativeNode)))[NG_DEBUG_PROPERTY] = nativeNode.nodeType == Node.ELEMENT_NODE ?
                new DebugElement__POST_R3__((/** @type {?} */ (nativeNode))) :
                new DebugNode__POST_R3__(nativeNode);
        }
        return ((/** @type {?} */ (nativeNode)))[NG_DEBUG_PROPERTY];
    }
    return null;
}
/**
 * \@publicApi
 * @type {?}
 */
export const getDebugNode = getDebugNode__PRE_R3__;
/**
 * @return {?}
 */
export function getAllDebugNodes() {
    return Array.from(_nativeNodeToDebugNode.values());
}
/**
 * @param {?} node
 * @return {?}
 */
export function indexDebugNode(node) {
    _nativeNodeToDebugNode.set(node.nativeNode, node);
}
/**
 * @param {?} node
 * @return {?}
 */
export function removeDebugNodeFromIndex(node) {
    _nativeNodeToDebugNode.delete(node.nativeNode);
}
/**
 * A boolean-valued function over a value, possibly including context information
 * regarding that value's position in an array.
 *
 * \@publicApi
 * @record
 * @template T
 */
export function Predicate() { }
/**
 * \@publicApi
 * @type {?}
 */
export const DebugNode = DebugNode__PRE_R3__;
/**
 * \@publicApi
 * @type {?}
 */
export const DebugElement = DebugElement__PRE_R3__;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDN0QsT0FBTyxFQUFDLHVCQUF1QixFQUFjLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRTVGLE9BQU8sRUFBQyxlQUFlLEVBQUUsWUFBWSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDaEYsT0FBTyxFQUFDLDBCQUEwQixFQUFTLE1BQU0sRUFBUyxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0csT0FBTyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3JLLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNwRixPQUFPLEVBQUMsd0JBQXdCLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM1RixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7QUFPN0MsTUFBTSxPQUFPLGtCQUFrQjs7Ozs7SUFDN0IsWUFBbUIsSUFBWSxFQUFTLFFBQWtCO1FBQXZDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFVO0lBQUcsQ0FBQztDQUMvRDs7O0lBRGEsa0NBQW1COztJQUFFLHNDQUF5Qjs7O0FBZ0I1RCxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFNOUIsWUFBWSxVQUFlLEVBQUUsTUFBc0IsRUFBRSxhQUEyQjtRQUx2RSxjQUFTLEdBQXlCLEVBQUUs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L0UsSUFBSSx1QkFBdUIsQ0FBQyxtQkFBQSxVQUFVLEVBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELElBQUksb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDMUM7UUFDRCxPQUFPLENBQUMsbUJBQUEsVUFBVSxFQUFPLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQy9DO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDOzs7OztBQUtELE1BQU0sT0FBTyxZQUFZLEdBQTBDLHNCQUFzQjs7OztBQUV6RixNQUFNLFVBQVUsZ0JBQWdCO0lBQzlCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxJQUFlO0lBQzVDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUFDLElBQWU7SUFDdEQsc0JBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqRCxDQUFDOzs7Ozs7Ozs7QUFRRCwrQkFBc0Q7Ozs7O0FBS3RELE1BQU0sT0FBTyxTQUFTLEdBQXNDLG1CQUFtQjs7Ozs7QUFLL0UsTUFBTSxPQUFPLFlBQVksR0FBeUMsc0JBQXNCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2dldFZpZXdDb21wb25lbnR9IGZyb20gJy4uL3JlbmRlcjMvZ2xvYmFsX3V0aWxzX2FwaSc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBOQVRJVkV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNDb21wb25lbnRIb3N0LCBpc0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBMVmlldywgUEFSRU5ULCBURGF0YSwgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldEluamVjdGlvblRva2VucywgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0TG9jYWxSZWZzLCBpc0Jyb3dzZXJFdmVudHMsIGxvYWRMQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlT3JOdWxsfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3L2luZGV4JztcblxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIERlYnVnRXZlbnRMaXN0ZW5lciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyBjYWxsYmFjazogRnVuY3Rpb24pIHt9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRGVidWdFdmVudExpc3RlbmVyW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yO1xuICByZWFkb25seSBjb21wb25lbnRJbnN0YW5jZTogYW55O1xuICByZWFkb25seSBjb250ZXh0OiBhbnk7XG4gIHJlYWRvbmx5IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBwcm92aWRlclRva2VuczogYW55W107XG59XG5leHBvcnQgY2xhc3MgRGVidWdOb2RlX19QUkVfUjNfXyB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRGVidWdFdmVudExpc3RlbmVyW10gPSBbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IERlYnVnTm9kZXxudWxsLCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBfZGVidWdDb250ZXh0O1xuICAgIHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7XG4gICAgaWYgKHBhcmVudCAmJiBwYXJlbnQgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBwYXJlbnQuYWRkQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5pbmplY3RvcjsgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbXBvbmVudDsgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29udGV4dDsgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5yZWZlcmVuY2VzOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5wcm92aWRlclRva2VuczsgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z0VsZW1lbnQgZXh0ZW5kcyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG4gIHJlYWRvbmx5IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXTtcblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50O1xuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W107XG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdO1xuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZDtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fIGV4dGVuZHMgRGVidWdOb2RlX19QUkVfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIHJlYWRvbmx5IG5hbWUgITogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogYW55LCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICBzdXBlcihuYXRpdmVOb2RlLCBwYXJlbnQsIF9kZWJ1Z0NvbnRleHQpO1xuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZU5vZGU7XG4gIH1cblxuICBhZGRDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMucHVzaChjaGlsZCk7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBjb25zdCBjaGlsZEluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChjaGlsZEluZGV4ICE9PSAtMSkge1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlIHwgbnVsbH0pLnBhcmVudCA9IG51bGw7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKGNoaWxkSW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydENoaWxkcmVuQWZ0ZXIoY2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGRyZW46IERlYnVnTm9kZVtdKSB7XG4gICAgY29uc3Qgc2libGluZ0luZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChzaWJsaW5nSW5kZXggIT09IC0xKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHNpYmxpbmdJbmRleCArIDEsIDAsIC4uLm5ld0NoaWxkcmVuKTtcbiAgICAgIG5ld0NoaWxkcmVuLmZvckVhY2goYyA9PiB7XG4gICAgICAgIGlmIChjLnBhcmVudCkge1xuICAgICAgICAgIChjLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChjKTtcbiAgICAgICAgfVxuICAgICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0QmVmb3JlKHJlZkNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkOiBEZWJ1Z05vZGUpOiB2b2lkIHtcbiAgICBjb25zdCByZWZJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKHJlZkNoaWxkKTtcbiAgICBpZiAocmVmSW5kZXggPT09IC0xKSB7XG4gICAgICB0aGlzLmFkZENoaWxkKG5ld0NoaWxkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5ld0NoaWxkLnBhcmVudCkge1xuICAgICAgICAobmV3Q2hpbGQucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcbiAgICAgIH1cbiAgICAgIChuZXdDaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHJlZkluZGV4LCAwLCBuZXdDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5jaGlsZE5vZGVzICAvL1xuICAgICAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykgYXMgRGVidWdFbGVtZW50W107XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09IGV2ZW50TmFtZSkge1xuICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayhldmVudE9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc05hdGl2ZUVsZW1lbnRzKGRlYnVnRWxzOiBEZWJ1Z0VsZW1lbnRbXSk6IGFueSB7XG4gIHJldHVybiBkZWJ1Z0Vscy5tYXAoKGVsKSA9PiBlbC5uYXRpdmVFbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5RWxlbWVudENoaWxkcmVuKFxuICAgIGVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10pIHtcbiAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbihcbiAgICBwYXJlbnROb2RlOiBEZWJ1Z05vZGUsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdKSB7XG4gIGlmIChwYXJlbnROb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgIHBhcmVudE5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgRGVidWdOb2RlX19QT1NUX1IzX18gaW1wbGVtZW50cyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBOb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IE5vZGUpIHsgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTsgfVxuXG4gIGdldCBwYXJlbnQoKTogRGVidWdFbGVtZW50fG51bGwge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubmF0aXZlTm9kZS5wYXJlbnROb2RlIGFzIEVsZW1lbnQ7XG4gICAgcmV0dXJuIHBhcmVudCA/IG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhwYXJlbnQpIDogbnVsbDtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBnZXRJbmplY3Rvcih0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlTm9kZTtcbiAgICByZXR1cm4gbmF0aXZlRWxlbWVudCAmJlxuICAgICAgICAoZ2V0Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQgYXMgRWxlbWVudCkgfHwgZ2V0Vmlld0NvbXBvbmVudChuYXRpdmVFbGVtZW50KSk7XG4gIH1cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICByZXR1cm4gZ2V0Q29tcG9uZW50KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KSB8fCBnZXRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTtcbiAgfVxuXG4gIGdldCBsaXN0ZW5lcnMoKTogRGVidWdFdmVudExpc3RlbmVyW10ge1xuICAgIHJldHVybiBnZXRMaXN0ZW5lcnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpLmZpbHRlcihpc0Jyb3dzZXJFdmVudHMpO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHsgcmV0dXJuIGdldExvY2FsUmVmcyh0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIGdldEluamVjdGlvblRva2Vucyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cbn1cblxuY2xhc3MgRGVidWdFbGVtZW50X19QT1NUX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBuYXRpdmVFbGVtZW50KCk6IEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/IHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50IDogbnVsbDtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlKSAhO1xuICAgICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICAgICAgcmV0dXJuIHROb2RlLnRhZ05hbWUgITtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVOYW1lO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiAgR2V0cyBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byBwcm9wZXJ0eSB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqICBUaGlzIG1hcCBpbmNsdWRlczpcbiAgICogIC0gUmVndWxhciBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgW2lkXT1cImlkXCJgKVxuICAgKiAgLSBIb3N0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBob3N0OiB7ICdbaWRdJzogXCJpZFwiIH1gKVxuICAgKiAgLSBJbnRlcnBvbGF0ZWQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGlkPVwie3sgdmFsdWUgfX1cIilcbiAgICpcbiAgICogIEl0IGRvZXMgbm90IGluY2x1ZGU6XG4gICAqICAtIGlucHV0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbbXlDdXN0b21JbnB1dF09XCJ2YWx1ZVwiYClcbiAgICogIC0gYXR0cmlidXRlIGJpbmRpbmdzIChlLmcuIGBbYXR0ci5yb2xlXT1cIm1lbnVcImApXG4gICAqL1xuICBnZXQgcHJvcGVydGllcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlLCBmYWxzZSk7XG4gICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuXG4gICAgY29uc3QgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgICAvLyBDb2xsZWN0IHByb3BlcnRpZXMgZnJvbSB0aGUgRE9NLlxuICAgIGNvcHlEb21Qcm9wZXJ0aWVzKHRoaXMubmF0aXZlRWxlbWVudCwgcHJvcGVydGllcyk7XG4gICAgLy8gQ29sbGVjdCBwcm9wZXJ0aWVzIGZyb20gdGhlIGJpbmRpbmdzLiBUaGlzIGlzIG5lZWRlZCBmb3IgYW5pbWF0aW9uIHJlbmRlcmVyIHdoaWNoIGhhc1xuICAgIC8vIHN5bnRoZXRpYyBwcm9wZXJ0aWVzIHdoaWNoIGRvbid0IGdldCByZWZsZWN0ZWQgaW50byB0aGUgRE9NLlxuICAgIGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKHByb3BlcnRpZXMsIHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xuICB9XG5cbiAgZ2V0IGF0dHJpYnV0ZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3QgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSA9IHt9O1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQoZWxlbWVudCwgZmFsc2UpO1xuICAgIGlmIChjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICBjb25zdCBsVmlldyA9IGNvbnRleHQubFZpZXc7XG4gICAgY29uc3QgdE5vZGVBdHRycyA9IChsVmlld1tUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGUpLmF0dHJzO1xuICAgIGNvbnN0IGxvd2VyY2FzZVROb2RlQXR0cnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyBGb3IgZGVidWcgbm9kZXMgd2UgdGFrZSB0aGUgZWxlbWVudCdzIGF0dHJpYnV0ZSBkaXJlY3RseSBmcm9tIHRoZSBET00gc2luY2UgaXQgYWxsb3dzIHVzXG4gICAgLy8gdG8gYWNjb3VudCBmb3Igb25lcyB0aGF0IHdlcmVuJ3Qgc2V0IHZpYSBiaW5kaW5ncyAoZS5nLiBWaWV3RW5naW5lIGtlZXBzIHRyYWNrIG9mIHRoZSBvbmVzXG4gICAgLy8gdGhhdCBhcmUgc2V0IHRocm91Z2ggYFJlbmRlcmVyMmApLiBUaGUgcHJvYmxlbSBpcyB0aGF0IHRoZSBicm93c2VyIHdpbGwgbG93ZXJjYXNlIGFsbCBuYW1lcyxcbiAgICAvLyBob3dldmVyIHNpbmNlIHdlIGhhdmUgdGhlIGF0dHJpYnV0ZXMgYWxyZWFkeSBvbiB0aGUgVE5vZGUsIHdlIGNhbiBwcmVzZXJ2ZSB0aGUgY2FzZSBieSBnb2luZ1xuICAgIC8vIHRocm91Z2ggdGhlbSBvbmNlLCBhZGRpbmcgdGhlbSB0byB0aGUgYGF0dHJpYnV0ZXNgIG1hcCBhbmQgcHV0dGluZyB0aGVpciBsb3dlci1jYXNlZCBuYW1lXG4gICAgLy8gaW50byBhbiBhcnJheS4gQWZ0ZXJ3YXJkcyB3aGVuIHdlJ3JlIGdvaW5nIHRocm91Z2ggdGhlIG5hdGl2ZSBET00gYXR0cmlidXRlcywgd2UgY2FuIGNoZWNrXG4gICAgLy8gd2hldGhlciB3ZSBoYXZlbid0IHJ1biBpbnRvIGFuIGF0dHJpYnV0ZSBhbHJlYWR5IHRocm91Z2ggdGhlIFROb2RlLlxuICAgIGlmICh0Tm9kZUF0dHJzKSB7XG4gICAgICBsZXQgaSA9IDA7XG4gICAgICB3aGlsZSAoaSA8IHROb2RlQXR0cnMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gdE5vZGVBdHRyc1tpXTtcblxuICAgICAgICAvLyBTdG9wIGFzIHNvb24gYXMgd2UgaGl0IGEgbWFya2VyLiBXZSBvbmx5IGNhcmUgYWJvdXQgdGhlIHJlZ3VsYXIgYXR0cmlidXRlcy4gRXZlcnl0aGluZ1xuICAgICAgICAvLyBlbHNlIHdpbGwgYmUgaGFuZGxlZCBiZWxvdyB3aGVuIHdlIHJlYWQgdGhlIGZpbmFsIGF0dHJpYnV0ZXMgb2ZmIHRoZSBET00uXG4gICAgICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgIT09ICdzdHJpbmcnKSBicmVhaztcblxuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSB0Tm9kZUF0dHJzW2kgKyAxXTtcbiAgICAgICAgYXR0cmlidXRlc1thdHRyTmFtZV0gPSBhdHRyVmFsdWUgYXMgc3RyaW5nO1xuICAgICAgICBsb3dlcmNhc2VUTm9kZUF0dHJzLnB1c2goYXR0ck5hbWUudG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGVBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVBdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYXR0ciA9IGVBdHRyc1tpXTtcbiAgICAgIGNvbnN0IGxvd2VyY2FzZU5hbWUgPSBhdHRyLm5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgYXNzaWduIHRoZSBzYW1lIGF0dHJpYnV0ZSBib3RoIGluIGl0c1xuICAgICAgLy8gY2FzZS1zZW5zaXRpdmUgZm9ybSBhbmQgdGhlIGxvd2VyLWNhc2VkIG9uZSBmcm9tIHRoZSBicm93c2VyLlxuICAgICAgaWYgKGxvd2VyY2FzZVROb2RlQXR0cnMuaW5kZXhPZihsb3dlcmNhc2VOYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gU2F2ZSB0aGUgbG93ZXJjYXNlIG5hbWUgdG8gYWxpZ24gdGhlIGJlaGF2aW9yIGJldHdlZW4gYnJvd3NlcnMuXG4gICAgICAgIC8vIElFIHByZXNlcnZlcyB0aGUgY2FzZSwgd2hpbGUgYWxsIG90aGVyIGJyb3dzZXIgY29udmVydCBpdCB0byBsb3dlciBjYXNlLlxuICAgICAgICBhdHRyaWJ1dGVzW2xvd2VyY2FzZU5hbWVdID0gYXR0ci52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgfVxuXG4gIGdldCBzdHlsZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9IHtcbiAgICBpZiAodGhpcy5uYXRpdmVFbGVtZW50ICYmICh0aGlzLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlKSB7XG4gICAgICByZXR1cm4gKHRoaXMubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGUgYXN7W2tleTogc3RyaW5nXTogYW55fTtcbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgZ2V0IGNsYXNzZXMoKToge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSB7XG4gICAgY29uc3QgcmVzdWx0OiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQ7XG5cbiAgICAvLyBTVkcgZWxlbWVudHMgcmV0dXJuIGFuIGBTVkdBbmltYXRlZFN0cmluZ2AgaW5zdGVhZCBvZiBhIHBsYWluIHN0cmluZyBmb3IgdGhlIGBjbGFzc05hbWVgLlxuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NOYW1lIGFzIHN0cmluZyB8IFNWR0FuaW1hdGVkU3RyaW5nO1xuICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc05hbWUgJiYgdHlwZW9mIGNsYXNzTmFtZSAhPT0gJ3N0cmluZycgPyBjbGFzc05hbWUuYmFzZVZhbC5zcGxpdCgnICcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgICBjbGFzc2VzLmZvckVhY2goKHZhbHVlOiBzdHJpbmcpID0+IHJlc3VsdFt2YWx1ZV0gPSB0cnVlKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXQgY2hpbGROb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IHRoaXMubmF0aXZlTm9kZS5jaGlsZE5vZGVzO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZV9fUE9TVF9SM19fKGVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuICAgIGlmICghbmF0aXZlRWxlbWVudCkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBuYXRpdmVFbGVtZW50LmNoaWxkcmVuO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZV9fUE9TVF9SM19fKGVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeUFsbFIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgdHJ1ZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlBbGxSMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGZhbHNlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBub2RlID0gdGhpcy5uYXRpdmVOb2RlIGFzIGFueTtcbiAgICBjb25zdCBpbnZva2VkTGlzdGVuZXJzOiBGdW5jdGlvbltdID0gW107XG5cbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09PSBldmVudE5hbWUpIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSBsaXN0ZW5lci5jYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgICBpbnZva2VkTGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2UgbmVlZCB0byBjaGVjayB3aGV0aGVyIGBldmVudExpc3RlbmVyc2AgZXhpc3RzLCBiZWNhdXNlIGl0J3Mgc29tZXRoaW5nXG4gICAgLy8gdGhhdCBab25lLmpzIG9ubHkgYWRkcyB0byBgRXZlbnRUYXJnZXRgIGluIGJyb3dzZXIgZW52aXJvbm1lbnRzLlxuICAgIGlmICh0eXBlb2Ygbm9kZS5ldmVudExpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gTm90ZSB0aGF0IGluIEl2eSB3ZSB3cmFwIGV2ZW50IGxpc3RlbmVycyB3aXRoIGEgY2FsbCB0byBgZXZlbnQucHJldmVudERlZmF1bHRgIGluIHNvbWVcbiAgICAgIC8vIGNhc2VzLiBXZSB1c2UgYEZ1bmN0aW9uYCBhcyBhIHNwZWNpYWwgdG9rZW4gdGhhdCBnaXZlcyB1cyBhY2Nlc3MgdG8gdGhlIGFjdHVhbCBldmVudFxuICAgICAgLy8gbGlzdGVuZXIuXG4gICAgICBub2RlLmV2ZW50TGlzdGVuZXJzKGV2ZW50TmFtZSkuZm9yRWFjaCgobGlzdGVuZXI6IEZ1bmN0aW9uKSA9PiB7XG4gICAgICAgIGNvbnN0IHVud3JhcHBlZExpc3RlbmVyID0gbGlzdGVuZXIoRnVuY3Rpb24pO1xuICAgICAgICByZXR1cm4gaW52b2tlZExpc3RlbmVycy5pbmRleE9mKHVud3JhcHBlZExpc3RlbmVyKSA9PT0gLTEgJiYgdW53cmFwcGVkTGlzdGVuZXIoZXZlbnRPYmopO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvcHlEb21Qcm9wZXJ0aWVzKGVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsLCBwcm9wZXJ0aWVzOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30pOiB2b2lkIHtcbiAgaWYgKGVsZW1lbnQpIHtcbiAgICAvLyBTa2lwIG93biBwcm9wZXJ0aWVzIChhcyB0aG9zZSBhcmUgcGF0Y2hlZClcbiAgICBsZXQgb2JqID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGVsZW1lbnQpO1xuICAgIGNvbnN0IE5vZGVQcm90b3R5cGU6IGFueSA9IE5vZGUucHJvdG90eXBlO1xuICAgIHdoaWxlIChvYmogIT09IG51bGwgJiYgb2JqICE9PSBOb2RlUHJvdG90eXBlKSB7XG4gICAgICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG9iaik7XG4gICAgICBmb3IgKGxldCBrZXkgaW4gZGVzY3JpcHRvcnMpIHtcbiAgICAgICAgaWYgKCFrZXkuc3RhcnRzV2l0aCgnX18nKSAmJiAha2V5LnN0YXJ0c1dpdGgoJ29uJykpIHtcbiAgICAgICAgICAvLyBkb24ndCBpbmNsdWRlIHByb3BlcnRpZXMgc3RhcnRpbmcgd2l0aCBgX19gIGFuZCBgb25gLlxuICAgICAgICAgIC8vIGBfX2AgYXJlIHBhdGNoZWQgdmFsdWVzIHdoaWNoIHNob3VsZCBub3QgYmUgaW5jbHVkZWQuXG4gICAgICAgICAgLy8gYG9uYCBhcmUgbGlzdGVuZXJzIHdoaWNoIGFsc28gc2hvdWxkIG5vdCBiZSBpbmNsdWRlZC5cbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IChlbGVtZW50IGFzIGFueSlba2V5XTtcbiAgICAgICAgICBpZiAoaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXNba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgb2JqID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlVmFsdWUodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInIHx8XG4gICAgICB2YWx1ZSA9PT0gbnVsbDtcbn1cblxuLyoqXG4gKiBXYWxrIHRoZSBUTm9kZSB0cmVlIHRvIGZpbmQgbWF0Y2hlcyBmb3IgdGhlIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50RWxlbWVudCB0aGUgZWxlbWVudCBmcm9tIHdoaWNoIHRoZSB3YWxrIGlzIHN0YXJ0ZWRcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeUFsbFIzKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10sXG4gICAgZWxlbWVudHNPbmx5OiB0cnVlKTogdm9pZDtcbmZ1bmN0aW9uIF9xdWVyeUFsbFIzKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10sXG4gICAgZWxlbWVudHNPbmx5OiBmYWxzZSk6IHZvaWQ7XG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSwgZmFsc2UpO1xuICBpZiAoY29udGV4dCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHBhcmVudFROb2RlID0gY29udGV4dC5sVmlld1tUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICAgIHBhcmVudFROb2RlLCBjb250ZXh0LmxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcGFyZW50RWxlbWVudC5uYXRpdmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiB0aGUgY29udGV4dCBpcyBudWxsLCB0aGVuIGBwYXJlbnRFbGVtZW50YCB3YXMgZWl0aGVyIGNyZWF0ZWQgd2l0aCBSZW5kZXJlcjIgb3IgbmF0aXZlIERPTVxuICAgIC8vIEFQSXMuXG4gICAgX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICB9XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgbWF0Y2ggdGhlIGN1cnJlbnQgVE5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLCBhbmQgZ29lcyBvbiB3aXRoIHRoZSBuZXh0IG9uZXMuXG4gKlxuICogQHBhcmFtIHROb2RlIHRoZSBjdXJyZW50IFROb2RlXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IG9mIHRoaXMgVE5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGNvbnN0IG5hdGl2ZU5vZGUgPSBnZXROYXRpdmVCeVROb2RlT3JOdWxsKHROb2RlLCBsVmlldyk7XG4gIC8vIEZvciBlYWNoIHR5cGUgb2YgVE5vZGUsIHNwZWNpZmljIGxvZ2ljIGlzIGV4ZWN1dGVkLlxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAvLyBDYXNlIDE6IHRoZSBUTm9kZSBpcyBhbiBlbGVtZW50XG4gICAgLy8gVGhlIG5hdGl2ZSBub2RlIGhhcyB0byBiZSBjaGVja2VkLlxuICAgIF9hZGRRdWVyeU1hdGNoUjMobmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgdGhlIGhvc3Qgb2YgYSBjb21wb25lbnQsIHRoZW4gYWxsIG5vZGVzIGluIGl0cyB2aWV3IGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgLy8gTm90ZTogdGhlIGNvbXBvbmVudCdzIGNvbnRlbnQgKHROb2RlLmNoaWxkKSB3aWxsIGJlIHByb2Nlc3NlZCBmcm9tIHRoZSBpbnNlcnRpb24gcG9pbnRzLlxuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgaWYgKGNvbXBvbmVudFZpZXcgJiYgY29tcG9uZW50Vmlld1tUVklFV10uZmlyc3RDaGlsZCkge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgICAgIGNvbXBvbmVudFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQgISwgY29tcG9uZW50VmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksXG4gICAgICAgICAgICByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgICAgICAvLyBPdGhlcndpc2UsIGl0cyBjaGlsZHJlbiBoYXZlIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModE5vZGUuY2hpbGQsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBhbHNvIGhhdmUgdG8gcXVlcnkgdGhlIERPTSBkaXJlY3RseSBpbiBvcmRlciB0byBjYXRjaCBlbGVtZW50cyBpbnNlcnRlZCB0aHJvdWdoXG4gICAgICAvLyBSZW5kZXJlcjIuIE5vdGUgdGhhdCB0aGlzIGlzIF9fbm90X18gb3B0aW1hbCwgYmVjYXVzZSB3ZSdyZSB3YWxraW5nIHNpbWlsYXIgdHJlZXMgbXVsdGlwbGVcbiAgICAgIC8vIHRpbWVzLiBWaWV3RW5naW5lIGNvdWxkIGRvIGl0IG1vcmUgZWZmaWNpZW50bHksIGJlY2F1c2UgYWxsIHRoZSBpbnNlcnRpb25zIGdvIHRocm91Z2hcbiAgICAgIC8vIFJlbmRlcmVyMiwgaG93ZXZlciB0aGF0J3Mgbm90IHRoZSBjYXNlIGluIEl2eS4gVGhpcyBhcHByb2FjaCBpcyBiZWluZyB1c2VkIGJlY2F1c2U6XG4gICAgICAvLyAxLiBNYXRjaGluZyB0aGUgVmlld0VuZ2luZSBiZWhhdmlvciB3b3VsZCBtZWFuIHBvdGVudGlhbGx5IGludHJvZHVjaW5nIGEgZGVwZWRlbmN5XG4gICAgICAvLyAgICBmcm9tIGBSZW5kZXJlcjJgIHRvIEl2eSB3aGljaCBjb3VsZCBicmluZyBJdnkgY29kZSBpbnRvIFZpZXdFbmdpbmUuXG4gICAgICAvLyAyLiBXZSB3b3VsZCBoYXZlIHRvIG1ha2UgYFJlbmRlcmVyM2AgXCJrbm93XCIgYWJvdXQgZGVidWcgbm9kZXMuXG4gICAgICAvLyAzLiBJdCBhbGxvd3MgdXMgdG8gY2FwdHVyZSBub2RlcyB0aGF0IHdlcmUgaW5zZXJ0ZWQgZGlyZWN0bHkgdmlhIHRoZSBET00uXG4gICAgICBuYXRpdmVOb2RlICYmIF9xdWVyeU5hdGl2ZU5vZGVEZXNjZW5kYW50cyhuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSk7XG4gICAgfVxuICAgIC8vIEluIGFsbCBjYXNlcywgaWYgYSBkeW5hbWljIGNvbnRhaW5lciBleGlzdHMgZm9yIHRoaXMgbm9kZSwgZWFjaCB2aWV3IGluc2lkZSBpdCBoYXMgdG8gYmVcbiAgICAvLyBwcm9jZXNzZWQuXG4gICAgY29uc3Qgbm9kZU9yQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhcbiAgICAgICAgICBub2RlT3JDb250YWluZXIsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBDYXNlIDI6IHRoZSBUTm9kZSBpcyBhIGNvbnRhaW5lclxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIF9hZGRRdWVyeU1hdGNoUjMobENvbnRhaW5lcltOQVRJVkVdLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIC8vIEVhY2ggdmlldyBpbnNpZGUgdGhlIGNvbnRhaW5lciBoYXMgdG8gYmUgcHJvY2Vzc2VkLlxuICAgIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMobENvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgIC8vIENhc2UgMzogdGhlIFROb2RlIGlzIGEgcHJvamVjdGlvbiBpbnNlcnRpb24gcG9pbnQgKGkuZS4gYSA8bmctY29udGVudD4pLlxuICAgIC8vIFRoZSBub2RlcyBwcm9qZWN0ZWQgYXQgdGhpcyBsb2NhdGlvbiBhbGwgbmVlZCB0byBiZSBwcm9jZXNzZWQuXG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGxWaWV3ICFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICAgIGNvbnN0IGhlYWQ6IFROb2RlfG51bGwgPVxuICAgICAgICAoY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbdE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaGVhZCkpIHtcbiAgICAgIGZvciAobGV0IG5hdGl2ZU5vZGUgb2YgaGVhZCkge1xuICAgICAgICBfYWRkUXVlcnlNYXRjaFIzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChoZWFkKSB7XG4gICAgICBjb25zdCBuZXh0TFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gIWFzIExWaWV3O1xuICAgICAgY29uc3QgbmV4dFROb2RlID0gbmV4dExWaWV3W1RWSUVXXS5kYXRhW2hlYWQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobmV4dFROb2RlLCBuZXh0TFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgLy8gQ2FzZSA0OiB0aGUgVE5vZGUgaXMgYSB2aWV3LlxuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHROb2RlLmNoaWxkLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxuXG4gIC8vIFdlIGRvbid0IHdhbnQgdG8gZ28gdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcm9vdCBub2RlLlxuICBpZiAocm9vdE5hdGl2ZU5vZGUgIT09IG5hdGl2ZU5vZGUpIHtcbiAgICAvLyBUbyBkZXRlcm1pbmUgdGhlIG5leHQgbm9kZSB0byBiZSBwcm9jZXNzZWQsIHdlIG5lZWQgdG8gdXNlIHRoZSBuZXh0IG9yIHRoZSBwcm9qZWN0aW9uTmV4dFxuICAgIC8vIGxpbmssIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBjdXJyZW50IG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkLlxuICAgIGNvbnN0IG5leHRUTm9kZSA9ICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpID8gdE5vZGUucHJvamVjdGlvbk5leHQgOiB0Tm9kZS5uZXh0O1xuICAgIGlmIChuZXh0VE5vZGUpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKG5leHRUTm9kZSwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJvY2VzcyBhbGwgVE5vZGVzIGluIGEgZ2l2ZW4gY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRoZSBjb250YWluZXIgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2F0ZSBzaG91bGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkVmlldyA9IGxDb250YWluZXJbaV07XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICAgIGNoaWxkVmlld1tUVklFV10ubm9kZSAhLCBjaGlsZFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXRjaCB0aGUgY3VycmVudCBuYXRpdmUgbm9kZSBhZ2FpbnN0IHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIG5hdGl2ZU5vZGUgdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfYWRkUXVlcnlNYXRjaFIzKFxuICAgIG5hdGl2ZU5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGlmIChyb290TmF0aXZlTm9kZSAhPT0gbmF0aXZlTm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZSA9IGdldERlYnVnTm9kZShuYXRpdmVOb2RlKTtcbiAgICBpZiAoIWRlYnVnTm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUeXBlIG9mIHRoZSBcInByZWRpY2F0ZSBhbmQgXCJtYXRjaGVzXCIgYXJyYXkgYXJlIHNldCBiYXNlZCBvbiB0aGUgdmFsdWUgb2ZcbiAgICAvLyB0aGUgXCJlbGVtZW50c09ubHlcIiBwYXJhbWV0ZXIuIFR5cGVTY3JpcHQgaXMgbm90IGFibGUgdG8gcHJvcGVybHkgaW5mZXIgdGhlc2VcbiAgICAvLyB0eXBlcyB3aXRoIGdlbmVyaWNzLCBzbyB3ZSBtYW51YWxseSBjYXN0IHRoZSBwYXJhbWV0ZXJzIGFjY29yZGluZ2x5LlxuICAgIGlmIChlbGVtZW50c09ubHkgJiYgZGVidWdOb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QT1NUX1IzX18gJiYgcHJlZGljYXRlKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgbWF0Y2hlcy5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICBtYXRjaGVzLnB1c2goZGVidWdOb2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgIChtYXRjaGVzIGFzIERlYnVnTm9kZVtdKS5wdXNoKGRlYnVnTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWF0Y2ggYWxsIHRoZSBkZXNjZW5kYW50cyBvZiBhIERPTSBub2RlIGFnYWluc3QgYSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIG5hdGl2ZU5vZGUgdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5hdGl2ZU5vZGVEZXNjZW5kYW50cyhcbiAgICBwYXJlbnROb2RlOiBhbnksIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBjb25zdCBub2RlcyA9IHBhcmVudE5vZGUuY2hpbGROb2RlcztcbiAgY29uc3QgbGVuZ3RoID0gbm9kZXMubGVuZ3RoO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgY29uc3QgZGVidWdOb2RlID0gZ2V0RGVidWdOb2RlKG5vZGUpO1xuXG4gICAgaWYgKGRlYnVnTm9kZSkge1xuICAgICAgaWYgKGVsZW1lbnRzT25seSAmJiBkZWJ1Z05vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyAmJiBwcmVkaWNhdGUoZGVidWdOb2RlKSAmJlxuICAgICAgICAgIG1hdGNoZXMuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgICBtYXRjaGVzLnB1c2goZGVidWdOb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgIWVsZW1lbnRzT25seSAmJiAocHJlZGljYXRlIGFzIFByZWRpY2F0ZTxEZWJ1Z05vZGU+KShkZWJ1Z05vZGUpICYmXG4gICAgICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLnB1c2goZGVidWdOb2RlKTtcbiAgICAgIH1cblxuICAgICAgX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBwcm9wZXJ0eSBiaW5kaW5ncyBmb3IgYSBnaXZlbiBub2RlIGFuZCBnZW5lcmF0ZXNcbiAqIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHZhbHVlcy4gVGhpcyBtYXAgb25seSBjb250YWlucyBwcm9wZXJ0eSBiaW5kaW5nc1xuICogZGVmaW5lZCBpbiB0ZW1wbGF0ZXMsIG5vdCBpbiBob3N0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UHJvcGVydHlCaW5kaW5ncyhcbiAgICBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHREYXRhOiBURGF0YSk6IHZvaWQge1xuICBsZXQgYmluZGluZ0luZGV4ZXMgPSB0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzO1xuXG4gIGlmIChiaW5kaW5nSW5kZXhlcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ0luZGV4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGJpbmRpbmdJbmRleGVzW2ldO1xuICAgICAgY29uc3QgcHJvcE1ldGFkYXRhID0gdERhdGFbYmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBtZXRhZGF0YVBhcnRzID0gcHJvcE1ldGFkYXRhLnNwbGl0KElOVEVSUE9MQVRJT05fREVMSU1JVEVSKTtcbiAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IG1ldGFkYXRhUGFydHNbMF07XG4gICAgICBpZiAobWV0YWRhdGFQYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IG1ldGFkYXRhUGFydHNbMV07XG4gICAgICAgIGZvciAobGV0IGogPSAxOyBqIDwgbWV0YWRhdGFQYXJ0cy5sZW5ndGggLSAxOyBqKyspIHtcbiAgICAgICAgICB2YWx1ZSArPSByZW5kZXJTdHJpbmdpZnkobFZpZXdbYmluZGluZ0luZGV4ICsgaiAtIDFdKSArIG1ldGFkYXRhUGFydHNbaiArIDFdO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gbFZpZXdbYmluZGluZ0luZGV4XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vLyBOZWVkIHRvIGtlZXAgdGhlIG5vZGVzIGluIGEgZ2xvYmFsIE1hcCBzbyB0aGF0IG11bHRpcGxlIGFuZ3VsYXIgYXBwcyBhcmUgc3VwcG9ydGVkLlxuY29uc3QgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZSA9IG5ldyBNYXA8YW55LCBEZWJ1Z05vZGU+KCk7XG5cbmZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUFJFX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICByZXR1cm4gX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5nZXQobmF0aXZlTm9kZSkgfHwgbnVsbDtcbn1cblxuY29uc3QgTkdfREVCVUdfUFJPUEVSVFkgPSAnX19uZ19kZWJ1Z19fJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IEVsZW1lbnQpOiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBOb2RlKTogRGVidWdOb2RlX19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogbnVsbCk6IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICBpZiAobmF0aXZlTm9kZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAoIShuYXRpdmVOb2RlLmhhc093blByb3BlcnR5KE5HX0RFQlVHX1BST1BFUlRZKSkpIHtcbiAgICAgIChuYXRpdmVOb2RlIGFzIGFueSlbTkdfREVCVUdfUFJPUEVSVFldID0gbmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/XG4gICAgICAgICAgbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKG5hdGl2ZU5vZGUgYXMgRWxlbWVudCkgOlxuICAgICAgICAgIG5ldyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIChuYXRpdmVOb2RlIGFzIGFueSlbTkdfREVCVUdfUFJPUEVSVFldO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGdldERlYnVnTm9kZTogKG5hdGl2ZU5vZGU6IGFueSkgPT4gRGVidWdOb2RlIHwgbnVsbCA9IGdldERlYnVnTm9kZV9fUFJFX1IzX187XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxEZWJ1Z05vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS52YWx1ZXMoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleERlYnVnTm9kZShub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5zZXQobm9kZS5uYXRpdmVOb2RlLCBub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5kZWxldGUobm9kZS5uYXRpdmVOb2RlKTtcbn1cblxuLyoqXG4gKiBBIGJvb2xlYW4tdmFsdWVkIGZ1bmN0aW9uIG92ZXIgYSB2YWx1ZSwgcG9zc2libHkgaW5jbHVkaW5nIGNvbnRleHQgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyB0aGF0IHZhbHVlJ3MgcG9zaXRpb24gaW4gYW4gYXJyYXkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFByZWRpY2F0ZTxUPiB7ICh2YWx1ZTogVCk6IGJvb2xlYW47IH1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z05vZGU6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdOb2RlfSA9IERlYnVnTm9kZV9fUFJFX1IzX187XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdFbGVtZW50OiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnRWxlbWVudH0gPSBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fO1xuIl19