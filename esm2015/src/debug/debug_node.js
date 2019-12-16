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
        /** @type {?} */
        const classNames = element.className.split(' ');
        classNames.forEach((/**
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
    const context = (/** @type {?} */ (loadLContext(parentElement.nativeNode)));
    /** @type {?} */
    const parentTNode = (/** @type {?} */ (context.lView[TVIEW].data[context.nodeIndex]));
    _queryNodeChildrenR3(parentTNode, context.lView, predicate, matches, elementsOnly, parentElement.nativeNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDN0QsT0FBTyxFQUFDLHVCQUF1QixFQUFjLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRTVGLE9BQU8sRUFBQyxlQUFlLEVBQUUsWUFBWSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDaEYsT0FBTyxFQUFDLDBCQUEwQixFQUFTLE1BQU0sRUFBUyxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0csT0FBTyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3JLLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNwRixPQUFPLEVBQUMsd0JBQXdCLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM1RixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7QUFPN0MsTUFBTSxPQUFPLGtCQUFrQjs7Ozs7SUFDN0IsWUFBbUIsSUFBWSxFQUFTLFFBQWtCO1FBQXZDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFVO0lBQUcsQ0FBQztDQUMvRDs7O0lBRGEsa0NBQW1COztJQUFFLHNDQUF5Qjs7O0FBZ0I1RCxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFNOUIsWUFBWSxVQUFlLEVBQUUsTUFBc0IsRUFBRSxhQUEyQjtRQUx2RSxjQUFTLEdBQXlCLEVBQUUs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SSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLElBQWU7SUFDNUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDcEQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsSUFBZTtJQUN0RCxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2pELENBQUM7Ozs7Ozs7OztBQVFELCtCQUFzRDs7Ozs7QUFLdEQsTUFBTSxPQUFPLFNBQVMsR0FBc0MsbUJBQW1COzs7OztBQUsvRSxNQUFNLE9BQU8sWUFBWSxHQUF5QyxzQkFBc0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7Z2V0Vmlld0NvbXBvbmVudH0gZnJvbSAnLi4vcmVuZGVyMy9nbG9iYWxfdXRpbHNfYXBpJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE5BVElWRX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudEhvc3QsIGlzTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7REVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIExWaWV3LCBQQVJFTlQsIFREYXRhLCBUVklFVywgVF9IT1NUfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENvbXBvbmVudCwgZ2V0Q29udGV4dCwgZ2V0SW5qZWN0aW9uVG9rZW5zLCBnZXRJbmplY3RvciwgZ2V0TGlzdGVuZXJzLCBnZXRMb2NhbFJlZnMsIGlzQnJvd3NlckV2ZW50cywgbG9hZExDb250ZXh0fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvZGlzY292ZXJ5X3V0aWxzJztcbmltcG9ydCB7SU5URVJQT0xBVElPTl9ERUxJTUlURVIsIHJlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGVPck51bGx9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RG9tTm9kZX0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4uL3ZpZXcvaW5kZXgnO1xuXG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgRGVidWdFdmVudExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGNhbGxiYWNrOiBGdW5jdGlvbikge31cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICByZWFkb25seSBpbmplY3RvcjogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IGNvbXBvbmVudEluc3RhbmNlOiBhbnk7XG4gIHJlYWRvbmx5IGNvbnRleHQ6IGFueTtcbiAgcmVhZG9ubHkgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IHByb3ZpZGVyVG9rZW5zOiBhbnlbXTtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z05vZGVfX1BSRV9SM19fIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXSA9IFtdO1xuICByZWFkb25seSBwYXJlbnQ6IERlYnVnRWxlbWVudHxudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogRGVidWdOb2RlfG51bGwsIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHRoaXMuX2RlYnVnQ29udGV4dCA9IF9kZWJ1Z0NvbnRleHQ7XG4gICAgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTtcbiAgICBpZiAocGFyZW50ICYmIHBhcmVudCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIHBhcmVudC5hZGRDaGlsZCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmluamVjdG9yOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29tcG9uZW50OyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb250ZXh0OyB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnJlZmVyZW5jZXM7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnByb3ZpZGVyVG9rZW5zOyB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnRWxlbWVudCBleHRlbmRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgcmVhZG9ubHkgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdO1xuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQ7XG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXTtcbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW107XG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkO1xufVxuZXhwb3J0IGNsYXNzIERlYnVnRWxlbWVudF9fUFJFX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BSRV9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgcmVhZG9ubHkgbmFtZSAhOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBhbnksIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUsIHBhcmVudCwgX2RlYnVnQ29udGV4dCk7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlTm9kZTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5wdXNoKGNoaWxkKTtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGNvbnN0IGNoaWxkSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKGNoaWxkSW5kZXggIT09IC0xKSB7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGUgfCBudWxsfSkucGFyZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UoY2hpbGRJbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0Q2hpbGRyZW5BZnRlcihjaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZHJlbjogRGVidWdOb2RlW10pIHtcbiAgICBjb25zdCBzaWJsaW5nSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKHNpYmxpbmdJbmRleCAhPT0gLTEpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2Uoc2libGluZ0luZGV4ICsgMSwgMCwgLi4ubmV3Q2hpbGRyZW4pO1xuICAgICAgbmV3Q2hpbGRyZW4uZm9yRWFjaChjID0+IHtcbiAgICAgICAgaWYgKGMucGFyZW50KSB7XG4gICAgICAgICAgKGMucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKGMpO1xuICAgICAgICB9XG4gICAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocmVmQ2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGQ6IERlYnVnTm9kZSk6IHZvaWQge1xuICAgIGNvbnN0IHJlZkluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YocmVmQ2hpbGQpO1xuICAgIGlmIChyZWZJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQobmV3Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV3Q2hpbGQucGFyZW50KSB7XG4gICAgICAgIChuZXdDaGlsZC5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQobmV3Q2hpbGQpO1xuICAgICAgfVxuICAgICAgKG5ld0NoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UocmVmSW5kZXgsIDAsIG5ld0NoaWxkKTtcbiAgICB9XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgICAgICAgLmNoaWxkTm9kZXMgIC8vXG4gICAgICAgIC5maWx0ZXIoKG5vZGUpID0+IG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSBhcyBEZWJ1Z0VsZW1lbnRbXTtcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT0gZXZlbnROYW1lKSB7XG4gICAgICAgIGxpc3RlbmVyLmNhbGxiYWNrKGV2ZW50T2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzTmF0aXZlRWxlbWVudHMoZGVidWdFbHM6IERlYnVnRWxlbWVudFtdKTogYW55IHtcbiAgcmV0dXJuIGRlYnVnRWxzLm1hcCgoZWwpID0+IGVsLm5hdGl2ZUVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlFbGVtZW50Q2hpbGRyZW4oXG4gICAgZWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+LCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSkge1xuICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuKFxuICAgIHBhcmVudE5vZGU6IERlYnVnTm9kZSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10pIHtcbiAgaWYgKHBhcmVudE5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IE5vZGU7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogTm9kZSkgeyB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlOyB9XG5cbiAgZ2V0IHBhcmVudCgpOiBEZWJ1Z0VsZW1lbnR8bnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5uYXRpdmVOb2RlLnBhcmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICByZXR1cm4gcGFyZW50ID8gbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKHBhcmVudCkgOiBudWxsO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGdldEluamVjdG9yKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVOb2RlO1xuICAgIHJldHVybiBuYXRpdmVFbGVtZW50ICYmXG4gICAgICAgIChnZXRDb21wb25lbnQobmF0aXZlRWxlbWVudCBhcyBFbGVtZW50KSB8fCBnZXRWaWV3Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQpKTtcbiAgfVxuICBnZXQgY29udGV4dCgpOiBhbnkge1xuICAgIHJldHVybiBnZXRDb21wb25lbnQodGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpIHx8IGdldENvbnRleHQodGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpO1xuICB9XG5cbiAgZ2V0IGxpc3RlbmVycygpOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXSB7XG4gICAgcmV0dXJuIGdldExpc3RlbmVycyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCkuZmlsdGVyKGlzQnJvd3NlckV2ZW50cyk7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55O30geyByZXR1cm4gZ2V0TG9jYWxSZWZzKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gZ2V0SW5qZWN0aW9uVG9rZW5zKHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTsgfVxufVxuXG5jbGFzcyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogRWxlbWVudCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKG5hdGl2ZU5vZGUpO1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUpO1xuICB9XG5cbiAgZ2V0IG5hdGl2ZUVsZW1lbnQoKTogRWxlbWVudHxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID8gdGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQgOiBudWxsO1xuICB9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0aGlzLm5hdGl2ZU5vZGUpICE7XG4gICAgICBjb25zdCBsVmlldyA9IGNvbnRleHQubFZpZXc7XG4gICAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gICAgICByZXR1cm4gdE5vZGUudGFnTmFtZSAhO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZU5vZGUubm9kZU5hbWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqICBHZXRzIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHByb3BlcnR5IHZhbHVlcyBmb3IgYW4gZWxlbWVudC5cbiAgICpcbiAgICogIFRoaXMgbWFwIGluY2x1ZGVzOlxuICAgKiAgLSBSZWd1bGFyIHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbaWRdPVwiaWRcImApXG4gICAqICAtIEhvc3QgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGhvc3Q6IHsgJ1tpZF0nOiBcImlkXCIgfWApXG4gICAqICAtIEludGVycG9sYXRlZCBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgaWQ9XCJ7eyB2YWx1ZSB9fVwiKVxuICAgKlxuICAgKiAgSXQgZG9lcyBub3QgaW5jbHVkZTpcbiAgICogIC0gaW5wdXQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYFtteUN1c3RvbUlucHV0XT1cInZhbHVlXCJgKVxuICAgKiAgLSBhdHRyaWJ1dGUgYmluZGluZ3MgKGUuZy4gYFthdHRyLnJvbGVdPVwibWVudVwiYClcbiAgICovXG4gIGdldCBwcm9wZXJ0aWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7XG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0aGlzLm5hdGl2ZU5vZGUsIGZhbHNlKTtcbiAgICBpZiAoY29udGV4dCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG5cbiAgICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICAgIC8vIENvbGxlY3QgcHJvcGVydGllcyBmcm9tIHRoZSBET00uXG4gICAgY29weURvbVByb3BlcnRpZXModGhpcy5uYXRpdmVFbGVtZW50LCBwcm9wZXJ0aWVzKTtcbiAgICAvLyBDb2xsZWN0IHByb3BlcnRpZXMgZnJvbSB0aGUgYmluZGluZ3MuIFRoaXMgaXMgbmVlZGVkIGZvciBhbmltYXRpb24gcmVuZGVyZXIgd2hpY2ggaGFzXG4gICAgLy8gc3ludGhldGljIHByb3BlcnRpZXMgd2hpY2ggZG9uJ3QgZ2V0IHJlZmxlY3RlZCBpbnRvIHRoZSBET00uXG4gICAgY29sbGVjdFByb3BlcnR5QmluZGluZ3MocHJvcGVydGllcywgdE5vZGUsIGxWaWV3LCB0RGF0YSk7XG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH1cblxuICBnZXQgYXR0cmlidXRlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChlbGVtZW50LCBmYWxzZSk7XG4gICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0Tm9kZUF0dHJzID0gKGxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZSkuYXR0cnM7XG4gICAgY29uc3QgbG93ZXJjYXNlVE5vZGVBdHRyczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIEZvciBkZWJ1ZyBub2RlcyB3ZSB0YWtlIHRoZSBlbGVtZW50J3MgYXR0cmlidXRlIGRpcmVjdGx5IGZyb20gdGhlIERPTSBzaW5jZSBpdCBhbGxvd3MgdXNcbiAgICAvLyB0byBhY2NvdW50IGZvciBvbmVzIHRoYXQgd2VyZW4ndCBzZXQgdmlhIGJpbmRpbmdzIChlLmcuIFZpZXdFbmdpbmUga2VlcHMgdHJhY2sgb2YgdGhlIG9uZXNcbiAgICAvLyB0aGF0IGFyZSBzZXQgdGhyb3VnaCBgUmVuZGVyZXIyYCkuIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhlIGJyb3dzZXIgd2lsbCBsb3dlcmNhc2UgYWxsIG5hbWVzLFxuICAgIC8vIGhvd2V2ZXIgc2luY2Ugd2UgaGF2ZSB0aGUgYXR0cmlidXRlcyBhbHJlYWR5IG9uIHRoZSBUTm9kZSwgd2UgY2FuIHByZXNlcnZlIHRoZSBjYXNlIGJ5IGdvaW5nXG4gICAgLy8gdGhyb3VnaCB0aGVtIG9uY2UsIGFkZGluZyB0aGVtIHRvIHRoZSBgYXR0cmlidXRlc2AgbWFwIGFuZCBwdXR0aW5nIHRoZWlyIGxvd2VyLWNhc2VkIG5hbWVcbiAgICAvLyBpbnRvIGFuIGFycmF5LiBBZnRlcndhcmRzIHdoZW4gd2UncmUgZ29pbmcgdGhyb3VnaCB0aGUgbmF0aXZlIERPTSBhdHRyaWJ1dGVzLCB3ZSBjYW4gY2hlY2tcbiAgICAvLyB3aGV0aGVyIHdlIGhhdmVuJ3QgcnVuIGludG8gYW4gYXR0cmlidXRlIGFscmVhZHkgdGhyb3VnaCB0aGUgVE5vZGUuXG4gICAgaWYgKHROb2RlQXR0cnMpIHtcbiAgICAgIGxldCBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgdE5vZGVBdHRycy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0Tm9kZUF0dHJzW2ldO1xuXG4gICAgICAgIC8vIFN0b3AgYXMgc29vbiBhcyB3ZSBoaXQgYSBtYXJrZXIuIFdlIG9ubHkgY2FyZSBhYm91dCB0aGUgcmVndWxhciBhdHRyaWJ1dGVzLiBFdmVyeXRoaW5nXG4gICAgICAgIC8vIGVsc2Ugd2lsbCBiZSBoYW5kbGVkIGJlbG93IHdoZW4gd2UgcmVhZCB0aGUgZmluYWwgYXR0cmlidXRlcyBvZmYgdGhlIERPTS5cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyTmFtZSAhPT0gJ3N0cmluZycpIGJyZWFrO1xuXG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IHROb2RlQXR0cnNbaSArIDFdO1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHJOYW1lXSA9IGF0dHJWYWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgIGxvd2VyY2FzZVROb2RlQXR0cnMucHVzaChhdHRyTmFtZS50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZUF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRyID0gZUF0dHJzW2ldO1xuICAgICAgY29uc3QgbG93ZXJjYXNlTmFtZSA9IGF0dHIubmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAvLyBNYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBhc3NpZ24gdGhlIHNhbWUgYXR0cmlidXRlIGJvdGggaW4gaXRzXG4gICAgICAvLyBjYXNlLXNlbnNpdGl2ZSBmb3JtIGFuZCB0aGUgbG93ZXItY2FzZWQgb25lIGZyb20gdGhlIGJyb3dzZXIuXG4gICAgICBpZiAobG93ZXJjYXNlVE5vZGVBdHRycy5pbmRleE9mKGxvd2VyY2FzZU5hbWUpID09PSAtMSkge1xuICAgICAgICAvLyBTYXZlIHRoZSBsb3dlcmNhc2UgbmFtZSB0byBhbGlnbiB0aGUgYmVoYXZpb3IgYmV0d2VlbiBicm93c2Vycy5cbiAgICAgICAgLy8gSUUgcHJlc2VydmVzIHRoZSBjYXNlLCB3aGlsZSBhbGwgb3RoZXIgYnJvd3NlciBjb252ZXJ0IGl0IHRvIGxvd2VyIGNhc2UuXG4gICAgICAgIGF0dHJpYnV0ZXNbbG93ZXJjYXNlTmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgZ2V0IHN0eWxlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0ge1xuICAgIGlmICh0aGlzLm5hdGl2ZUVsZW1lbnQgJiYgKHRoaXMubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGUpIHtcbiAgICAgIHJldHVybiAodGhpcy5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZSBhc3tba2V5OiBzdHJpbmddOiBhbnl9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cblxuICBnZXQgY2xhc3NlcygpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9IHtcbiAgICBjb25zdCByZXN1bHQ6IHtba2V5OiBzdHJpbmddOiBib29sZWFuO30gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IGNsYXNzTmFtZXMgPSBlbGVtZW50LmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuXG4gICAgY2xhc3NOYW1lcy5mb3JFYWNoKCh2YWx1ZTogc3RyaW5nKSA9PiByZXN1bHRbdmFsdWVdID0gdHJ1ZSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0IGNoaWxkTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLm5hdGl2ZU5vZGUuY2hpbGROb2RlcztcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdOb2RlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoIW5hdGl2ZUVsZW1lbnQpIHJldHVybiBbXTtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gbmF0aXZlRWxlbWVudC5jaGlsZHJlbjtcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlBbGxSMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIHRydWUpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5QWxsUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCBmYWxzZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgbm9kZSA9IHRoaXMubmF0aXZlTm9kZSBhcyBhbnk7XG4gICAgY29uc3QgaW52b2tlZExpc3RlbmVyczogRnVuY3Rpb25bXSA9IFtdO1xuXG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiB7XG4gICAgICBpZiAobGlzdGVuZXIubmFtZSA9PT0gZXZlbnROYW1lKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrID0gbGlzdGVuZXIuY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrKGV2ZW50T2JqKTtcbiAgICAgICAgaW52b2tlZExpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFdlIG5lZWQgdG8gY2hlY2sgd2hldGhlciBgZXZlbnRMaXN0ZW5lcnNgIGV4aXN0cywgYmVjYXVzZSBpdCdzIHNvbWV0aGluZ1xuICAgIC8vIHRoYXQgWm9uZS5qcyBvbmx5IGFkZHMgdG8gYEV2ZW50VGFyZ2V0YCBpbiBicm93c2VyIGVudmlyb25tZW50cy5cbiAgICBpZiAodHlwZW9mIG5vZGUuZXZlbnRMaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIE5vdGUgdGhhdCBpbiBJdnkgd2Ugd3JhcCBldmVudCBsaXN0ZW5lcnMgd2l0aCBhIGNhbGwgdG8gYGV2ZW50LnByZXZlbnREZWZhdWx0YCBpbiBzb21lXG4gICAgICAvLyBjYXNlcy4gV2UgdXNlIGBGdW5jdGlvbmAgYXMgYSBzcGVjaWFsIHRva2VuIHRoYXQgZ2l2ZXMgdXMgYWNjZXNzIHRvIHRoZSBhY3R1YWwgZXZlbnRcbiAgICAgIC8vIGxpc3RlbmVyLlxuICAgICAgbm9kZS5ldmVudExpc3RlbmVycyhldmVudE5hbWUpLmZvckVhY2goKGxpc3RlbmVyOiBGdW5jdGlvbikgPT4ge1xuICAgICAgICBjb25zdCB1bndyYXBwZWRMaXN0ZW5lciA9IGxpc3RlbmVyKEZ1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIGludm9rZWRMaXN0ZW5lcnMuaW5kZXhPZih1bndyYXBwZWRMaXN0ZW5lcikgPT09IC0xICYmIHVud3JhcHBlZExpc3RlbmVyKGV2ZW50T2JqKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjb3B5RG9tUHJvcGVydGllcyhlbGVtZW50OiBFbGVtZW50IHwgbnVsbCwgcHJvcGVydGllczoge1tuYW1lOiBzdHJpbmddOiBzdHJpbmd9KTogdm9pZCB7XG4gIGlmIChlbGVtZW50KSB7XG4gICAgLy8gU2tpcCBvd24gcHJvcGVydGllcyAoYXMgdGhvc2UgYXJlIHBhdGNoZWQpXG4gICAgbGV0IG9iaiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihlbGVtZW50KTtcbiAgICBjb25zdCBOb2RlUHJvdG90eXBlOiBhbnkgPSBOb2RlLnByb3RvdHlwZTtcbiAgICB3aGlsZSAob2JqICE9PSBudWxsICYmIG9iaiAhPT0gTm9kZVByb3RvdHlwZSkge1xuICAgICAgY29uc3QgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhvYmopO1xuICAgICAgZm9yIChsZXQga2V5IGluIGRlc2NyaXB0b3JzKSB7XG4gICAgICAgIGlmICgha2V5LnN0YXJ0c1dpdGgoJ19fJykgJiYgIWtleS5zdGFydHNXaXRoKCdvbicpKSB7XG4gICAgICAgICAgLy8gZG9uJ3QgaW5jbHVkZSBwcm9wZXJ0aWVzIHN0YXJ0aW5nIHdpdGggYF9fYCBhbmQgYG9uYC5cbiAgICAgICAgICAvLyBgX19gIGFyZSBwYXRjaGVkIHZhbHVlcyB3aGljaCBzaG91bGQgbm90IGJlIGluY2x1ZGVkLlxuICAgICAgICAgIC8vIGBvbmAgYXJlIGxpc3RlbmVycyB3aGljaCBhbHNvIHNob3VsZCBub3QgYmUgaW5jbHVkZWQuXG4gICAgICAgICAgY29uc3QgdmFsdWUgPSAoZWxlbWVudCBhcyBhbnkpW2tleV07XG4gICAgICAgICAgaWYgKGlzUHJpbWl0aXZlVmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG9iaiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZVZhbHVlKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicgfHwgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyB8fFxuICAgICAgdmFsdWUgPT09IG51bGw7XG59XG5cbi8qKlxuICogV2FsayB0aGUgVE5vZGUgdHJlZSB0byBmaW5kIG1hdGNoZXMgZm9yIHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIHBhcmVudEVsZW1lbnQgdGhlIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgd2FsayBpcyBzdGFydGVkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4sIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdLFxuICAgIGVsZW1lbnRzT25seTogdHJ1ZSk6IHZvaWQ7XG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogZmFsc2UpOiB2b2lkO1xuZnVuY3Rpb24gX3F1ZXJ5QWxsUjMoXG4gICAgcGFyZW50RWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4pIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpICE7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gY29udGV4dC5sVmlld1tUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgcGFyZW50VE5vZGUsIGNvbnRleHQubFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCBwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IG1hdGNoIHRoZSBjdXJyZW50IFROb2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZSwgYW5kIGdvZXMgb24gd2l0aCB0aGUgbmV4dCBvbmVzLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSB0aGUgY3VycmVudCBUTm9kZVxuICogQHBhcmFtIGxWaWV3IHRoZSBMVmlldyBvZiB0aGlzIFROb2RlXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2F0ZSBzaG91bGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBjb25zdCBuYXRpdmVOb2RlID0gZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCh0Tm9kZSwgbFZpZXcpO1xuICAvLyBGb3IgZWFjaCB0eXBlIG9mIFROb2RlLCBzcGVjaWZpYyBsb2dpYyBpcyBleGVjdXRlZC5cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgLy8gQ2FzZSAxOiB0aGUgVE5vZGUgaXMgYW4gZWxlbWVudFxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBfYWRkUXVlcnlNYXRjaFIzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkpIHtcbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIHRoZSBob3N0IG9mIGEgY29tcG9uZW50LCB0aGVuIGFsbCBub2RlcyBpbiBpdHMgdmlldyBoYXZlIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgIC8vIE5vdGU6IHRoZSBjb21wb25lbnQncyBjb250ZW50ICh0Tm9kZS5jaGlsZCkgd2lsbCBiZSBwcm9jZXNzZWQgZnJvbSB0aGUgaW5zZXJ0aW9uIHBvaW50cy5cbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIGlmIChjb21wb25lbnRWaWV3ICYmIGNvbXBvbmVudFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICAgICAgICBjb21wb25lbnRWaWV3W1RWSUVXXS5maXJzdENoaWxkICEsIGNvbXBvbmVudFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LFxuICAgICAgICAgICAgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdHMgY2hpbGRyZW4gaGF2ZSB0byBiZSBwcm9jZXNzZWQuXG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHROb2RlLmNoaWxkLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgYWxzbyBoYXZlIHRvIHF1ZXJ5IHRoZSBET00gZGlyZWN0bHkgaW4gb3JkZXIgdG8gY2F0Y2ggZWxlbWVudHMgaW5zZXJ0ZWQgdGhyb3VnaFxuICAgICAgLy8gUmVuZGVyZXIyLiBOb3RlIHRoYXQgdGhpcyBpcyBfX25vdF9fIG9wdGltYWwsIGJlY2F1c2Ugd2UncmUgd2Fsa2luZyBzaW1pbGFyIHRyZWVzIG11bHRpcGxlXG4gICAgICAvLyB0aW1lcy4gVmlld0VuZ2luZSBjb3VsZCBkbyBpdCBtb3JlIGVmZmljaWVudGx5LCBiZWNhdXNlIGFsbCB0aGUgaW5zZXJ0aW9ucyBnbyB0aHJvdWdoXG4gICAgICAvLyBSZW5kZXJlcjIsIGhvd2V2ZXIgdGhhdCdzIG5vdCB0aGUgY2FzZSBpbiBJdnkuIFRoaXMgYXBwcm9hY2ggaXMgYmVpbmcgdXNlZCBiZWNhdXNlOlxuICAgICAgLy8gMS4gTWF0Y2hpbmcgdGhlIFZpZXdFbmdpbmUgYmVoYXZpb3Igd291bGQgbWVhbiBwb3RlbnRpYWxseSBpbnRyb2R1Y2luZyBhIGRlcGVkZW5jeVxuICAgICAgLy8gICAgZnJvbSBgUmVuZGVyZXIyYCB0byBJdnkgd2hpY2ggY291bGQgYnJpbmcgSXZ5IGNvZGUgaW50byBWaWV3RW5naW5lLlxuICAgICAgLy8gMi4gV2Ugd291bGQgaGF2ZSB0byBtYWtlIGBSZW5kZXJlcjNgIFwia25vd1wiIGFib3V0IGRlYnVnIG5vZGVzLlxuICAgICAgLy8gMy4gSXQgYWxsb3dzIHVzIHRvIGNhcHR1cmUgbm9kZXMgdGhhdCB3ZXJlIGluc2VydGVkIGRpcmVjdGx5IHZpYSB0aGUgRE9NLlxuICAgICAgbmF0aXZlTm9kZSAmJiBfcXVlcnlOYXRpdmVOb2RlRGVzY2VuZGFudHMobmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICAgIH1cbiAgICAvLyBJbiBhbGwgY2FzZXMsIGlmIGEgZHluYW1pYyBjb250YWluZXIgZXhpc3RzIGZvciB0aGlzIG5vZGUsIGVhY2ggdmlldyBpbnNpZGUgaXQgaGFzIHRvIGJlXG4gICAgLy8gcHJvY2Vzc2VkLlxuICAgIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMoXG4gICAgICAgICAgbm9kZU9yQ29udGFpbmVyLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gQ2FzZSAyOiB0aGUgVE5vZGUgaXMgYSBjb250YWluZXJcbiAgICAvLyBUaGUgbmF0aXZlIG5vZGUgaGFzIHRvIGJlIGNoZWNrZWQuXG4gICAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBfYWRkUXVlcnlNYXRjaFIzKGxDb250YWluZXJbTkFUSVZFXSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAvLyBFYWNoIHZpZXcgaW5zaWRlIHRoZSBjb250YWluZXIgaGFzIHRvIGJlIHByb2Nlc3NlZC5cbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKGxDb250YWluZXIsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAvLyBDYXNlIDM6IHRoZSBUTm9kZSBpcyBhIHByb2plY3Rpb24gaW5zZXJ0aW9uIHBvaW50IChpLmUuIGEgPG5nLWNvbnRlbnQ+KS5cbiAgICAvLyBUaGUgbm9kZXMgcHJvamVjdGVkIGF0IHRoaXMgbG9jYXRpb24gYWxsIG5lZWQgdG8gYmUgcHJvY2Vzc2VkLlxuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBsVmlldyAhW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXTtcbiAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICBjb25zdCBoZWFkOiBUTm9kZXxudWxsID1cbiAgICAgICAgKGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGhlYWQpKSB7XG4gICAgICBmb3IgKGxldCBuYXRpdmVOb2RlIG9mIGhlYWQpIHtcbiAgICAgICAgX2FkZFF1ZXJ5TWF0Y2hSMyhuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaGVhZCkge1xuICAgICAgY29uc3QgbmV4dExWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICFhcyBMVmlldztcbiAgICAgIGNvbnN0IG5leHRUTm9kZSA9IG5leHRMVmlld1tUVklFV10uZGF0YVtoZWFkLmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKG5leHRUTm9kZSwgbmV4dExWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIC8vIENhc2UgNDogdGhlIFROb2RlIGlzIGEgdmlldy5cbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0Tm9kZS5jaGlsZCwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gIH1cblxuICAvLyBXZSBkb24ndCB3YW50IHRvIGdvIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHJvb3Qgbm9kZS5cbiAgaWYgKHJvb3ROYXRpdmVOb2RlICE9PSBuYXRpdmVOb2RlKSB7XG4gICAgLy8gVG8gZGV0ZXJtaW5lIHRoZSBuZXh0IG5vZGUgdG8gYmUgcHJvY2Vzc2VkLCB3ZSBuZWVkIHRvIHVzZSB0aGUgbmV4dCBvciB0aGUgcHJvamVjdGlvbk5leHRcbiAgICAvLyBsaW5rLCBkZXBlbmRpbmcgb24gd2hldGhlciB0aGUgY3VycmVudCBub2RlIGhhcyBiZWVuIHByb2plY3RlZC5cbiAgICBjb25zdCBuZXh0VE5vZGUgPSAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSA/IHROb2RlLnByb2plY3Rpb25OZXh0IDogdE5vZGUubmV4dDtcbiAgICBpZiAobmV4dFROb2RlKSB7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhuZXh0VE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3MgYWxsIFROb2RlcyBpbiBhIGdpdmVuIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0aGUgY29udGFpbmVyIHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZFZpZXcgPSBsQ29udGFpbmVyW2ldO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgICBjaGlsZFZpZXdbVFZJRVddLm5vZGUgISwgY2hpbGRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2ggdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLlxuICpcbiAqIEBwYXJhbSBuYXRpdmVOb2RlIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2F0ZSBzaG91bGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX2FkZFF1ZXJ5TWF0Y2hSMyhcbiAgICBuYXRpdmVOb2RlOiBhbnksIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBpZiAocm9vdE5hdGl2ZU5vZGUgIT09IG5hdGl2ZU5vZGUpIHtcbiAgICBjb25zdCBkZWJ1Z05vZGUgPSBnZXREZWJ1Z05vZGUobmF0aXZlTm9kZSk7XG4gICAgaWYgKCFkZWJ1Z05vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVHlwZSBvZiB0aGUgXCJwcmVkaWNhdGUgYW5kIFwibWF0Y2hlc1wiIGFycmF5IGFyZSBzZXQgYmFzZWQgb24gdGhlIHZhbHVlIG9mXG4gICAgLy8gdGhlIFwiZWxlbWVudHNPbmx5XCIgcGFyYW1ldGVyLiBUeXBlU2NyaXB0IGlzIG5vdCBhYmxlIHRvIHByb3Blcmx5IGluZmVyIHRoZXNlXG4gICAgLy8gdHlwZXMgd2l0aCBnZW5lcmljcywgc28gd2UgbWFudWFsbHkgY2FzdCB0aGUgcGFyYW1ldGVycyBhY2NvcmRpbmdseS5cbiAgICBpZiAoZWxlbWVudHNPbmx5ICYmIGRlYnVnTm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fICYmIHByZWRpY2F0ZShkZWJ1Z05vZGUpICYmXG4gICAgICAgIG1hdGNoZXMuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgbWF0Y2hlcy5wdXNoKGRlYnVnTm9kZSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgIWVsZW1lbnRzT25seSAmJiAocHJlZGljYXRlIGFzIFByZWRpY2F0ZTxEZWJ1Z05vZGU+KShkZWJ1Z05vZGUpICYmXG4gICAgICAgIChtYXRjaGVzIGFzIERlYnVnTm9kZVtdKS5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkucHVzaChkZWJ1Z05vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hdGNoIGFsbCB0aGUgZGVzY2VuZGFudHMgb2YgYSBET00gbm9kZSBhZ2FpbnN0IGEgcHJlZGljYXRlLlxuICpcbiAqIEBwYXJhbSBuYXRpdmVOb2RlIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOYXRpdmVOb2RlRGVzY2VuZGFudHMoXG4gICAgcGFyZW50Tm9kZTogYW55LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4pIHtcbiAgY29uc3Qgbm9kZXMgPSBwYXJlbnROb2RlLmNoaWxkTm9kZXM7XG4gIGNvbnN0IGxlbmd0aCA9IG5vZGVzLmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVzW2ldO1xuICAgIGNvbnN0IGRlYnVnTm9kZSA9IGdldERlYnVnTm9kZShub2RlKTtcblxuICAgIGlmIChkZWJ1Z05vZGUpIHtcbiAgICAgIGlmIChlbGVtZW50c09ubHkgJiYgZGVidWdOb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QT1NUX1IzX18gJiYgcHJlZGljYXRlKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgICBtYXRjaGVzLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKGRlYnVnTm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICFlbGVtZW50c09ubHkgJiYgKHByZWRpY2F0ZSBhcyBQcmVkaWNhdGU8RGVidWdOb2RlPikoZGVidWdOb2RlKSAmJlxuICAgICAgICAgIChtYXRjaGVzIGFzIERlYnVnTm9kZVtdKS5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICAgIChtYXRjaGVzIGFzIERlYnVnTm9kZVtdKS5wdXNoKGRlYnVnTm9kZSk7XG4gICAgICB9XG5cbiAgICAgIF9xdWVyeU5hdGl2ZU5vZGVEZXNjZW5kYW50cyhub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgcHJvcGVydHkgYmluZGluZ3MgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgZ2VuZXJhdGVzXG4gKiBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byB2YWx1ZXMuIFRoaXMgbWFwIG9ubHkgY29udGFpbnMgcHJvcGVydHkgYmluZGluZ3NcbiAqIGRlZmluZWQgaW4gdGVtcGxhdGVzLCBub3QgaW4gaG9zdCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gY29sbGVjdFByb3BlcnR5QmluZGluZ3MoXG4gICAgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCB0RGF0YTogVERhdGEpOiB2b2lkIHtcbiAgbGV0IGJpbmRpbmdJbmRleGVzID0gdE5vZGUucHJvcGVydHlCaW5kaW5ncztcblxuICBpZiAoYmluZGluZ0luZGV4ZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdJbmRleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBiaW5kaW5nSW5kZXhlc1tpXTtcbiAgICAgIGNvbnN0IHByb3BNZXRhZGF0YSA9IHREYXRhW2JpbmRpbmdJbmRleF0gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgbWV0YWRhdGFQYXJ0cyA9IHByb3BNZXRhZGF0YS5zcGxpdChJTlRFUlBPTEFUSU9OX0RFTElNSVRFUik7XG4gICAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBtZXRhZGF0YVBhcnRzWzBdO1xuICAgICAgaWYgKG1ldGFkYXRhUGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBtZXRhZGF0YVBhcnRzWzFdO1xuICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8IG1ldGFkYXRhUGFydHMubGVuZ3RoIC0gMTsgaisrKSB7XG4gICAgICAgICAgdmFsdWUgKz0gcmVuZGVyU3RyaW5naWZ5KGxWaWV3W2JpbmRpbmdJbmRleCArIGogLSAxXSkgKyBtZXRhZGF0YVBhcnRzW2ogKyAxXTtcbiAgICAgICAgfVxuICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IGxWaWV3W2JpbmRpbmdJbmRleF07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLy8gTmVlZCB0byBrZWVwIHRoZSBub2RlcyBpbiBhIGdsb2JhbCBNYXAgc28gdGhhdCBtdWx0aXBsZSBhbmd1bGFyIGFwcHMgYXJlIHN1cHBvcnRlZC5cbmNvbnN0IF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUgPSBuZXcgTWFwPGFueSwgRGVidWdOb2RlPigpO1xuXG5mdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BSRV9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgcmV0dXJuIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZ2V0KG5hdGl2ZU5vZGUpIHx8IG51bGw7XG59XG5cbmNvbnN0IE5HX0RFQlVHX1BST1BFUlRZID0gJ19fbmdfZGVidWdfXyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBFbGVtZW50KTogRGVidWdFbGVtZW50X19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogTm9kZSk6IERlYnVnTm9kZV9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IG51bGwpOiBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgaWYgKG5hdGl2ZU5vZGUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKCEobmF0aXZlTm9kZS5oYXNPd25Qcm9wZXJ0eShOR19ERUJVR19QUk9QRVJUWSkpKSB7XG4gICAgICAobmF0aXZlTm9kZSBhcyBhbnkpW05HX0RFQlVHX1BST1BFUlRZXSA9IG5hdGl2ZU5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUgP1xuICAgICAgICAgIG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhuYXRpdmVOb2RlIGFzIEVsZW1lbnQpIDpcbiAgICAgICAgICBuZXcgRGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZSk7XG4gICAgfVxuICAgIHJldHVybiAobmF0aXZlTm9kZSBhcyBhbnkpW05HX0RFQlVHX1BST1BFUlRZXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBnZXREZWJ1Z05vZGU6IChuYXRpdmVOb2RlOiBhbnkpID0+IERlYnVnTm9kZSB8IG51bGwgPSBnZXREZWJ1Z05vZGVfX1BSRV9SM19fO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsRGVidWdOb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUudmFsdWVzKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhEZWJ1Z05vZGUobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuc2V0KG5vZGUubmF0aXZlTm9kZSwgbm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEZWJ1Z05vZGVGcm9tSW5kZXgobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZGVsZXRlKG5vZGUubmF0aXZlTm9kZSk7XG59XG5cbi8qKlxuICogQSBib29sZWFuLXZhbHVlZCBmdW5jdGlvbiBvdmVyIGEgdmFsdWUsIHBvc3NpYmx5IGluY2x1ZGluZyBjb250ZXh0IGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgdGhhdCB2YWx1ZSdzIHBvc2l0aW9uIGluIGFuIGFycmF5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcmVkaWNhdGU8VD4geyAodmFsdWU6IFQpOiBib29sZWFuOyB9XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdOb2RlOiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnTm9kZX0gPSBEZWJ1Z05vZGVfX1BSRV9SM19fO1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnRWxlbWVudDoge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z0VsZW1lbnR9ID0gRGVidWdFbGVtZW50X19QUkVfUjNfXztcbiJdfQ==