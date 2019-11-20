/**
 * @fileoverview added by tsickle
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
import { createProxy } from './proxy';
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
            // Make sure that we don't assign the same attribute both in its
            // case-sensitive form and the lower-cased one from the browser.
            if (lowercaseTNodeAttrs.indexOf(attr.name) === -1) {
                attributes[attr.name] = attr.value;
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
        if (!this._classesProxy) {
            /** @type {?} */
            const element = this.nativeElement;
            // we use a proxy here because VE code expects `.classes` to keep
            // track of which classes have been added and removed. Because we
            // do not make use of a debug renderer anymore, the return value
            // must always be `false` in the event that a class does not exist
            // on the element (even if it wasn't added and removed beforehand).
            this._classesProxy = createProxy({
                /**
                 * @param {?} target
                 * @param {?} prop
                 * @return {?}
                 */
                get(target, prop) {
                    return element ? element.classList.contains(prop) : false;
                },
                /**
                 * @param {?} target
                 * @param {?} prop
                 * @param {?} value
                 * @return {?}
                 */
                set(target, prop, value) {
                    return element ? element.classList.toggle(prop, !!value) : false;
                },
                /**
                 * @return {?}
                 */
                ownKeys() { return element ? Array.from(element.classList).sort() : []; },
                /**
                 * @param {?} k
                 * @return {?}
                 */
                getOwnPropertyDescriptor(k) {
                    // we use a special property descriptor here so that enumeration operations
                    // such as `Object.keys` will work on this proxy.
                    return {
                        enumerable: true,
                        configurable: true,
                    };
                },
            });
        }
        return this._classesProxy;
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
if (false) {
    /**
     * @type {?}
     * @private
     */
    DebugElement__POST_R3__.prototype._classesProxy;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsdUJBQXVCLEVBQWMsTUFBTSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFNUYsT0FBTyxFQUFDLGVBQWUsRUFBRSxZQUFZLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNoRixPQUFPLEVBQUMsMEJBQTBCLEVBQVMsTUFBTSxFQUFTLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRyxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDckssT0FBTyxFQUFDLHVCQUF1QixFQUFFLGVBQWUsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BGLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUc3QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sU0FBUyxDQUFDOzs7O0FBT3BDLE1BQU0sT0FBTyxrQkFBa0I7Ozs7O0lBQzdCLFlBQW1CLElBQVksRUFBUyxRQUFrQjtRQUF2QyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBVTtJQUFHLENBQUM7Q0FDL0Q7OztJQURhLGtDQUFtQjs7SUFBRSxzQ0FBeUI7OztBQWdCNUQsTUFBTSxPQUFPLG1CQUFtQjs7Ozs7O0lBTTlCLFlBQVksVUFBZSxFQUFF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L0UsTUFBTSxPQUFPLFlBQVksR0FBeUMsc0JBQXNCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2dldFZpZXdDb21wb25lbnR9IGZyb20gJy4uL3JlbmRlcjMvZ2xvYmFsX3V0aWxzX2FwaSc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBOQVRJVkV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNDb21wb25lbnRIb3N0LCBpc0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBMVmlldywgUEFSRU5ULCBURGF0YSwgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldEluamVjdGlvblRva2VucywgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0TG9jYWxSZWZzLCBpc0Jyb3dzZXJFdmVudHMsIGxvYWRMQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlT3JOdWxsfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3L2luZGV4JztcblxuaW1wb3J0IHtjcmVhdGVQcm94eX0gZnJvbSAnLi9wcm94eSc7XG5cblxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIERlYnVnRXZlbnRMaXN0ZW5lciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyBjYWxsYmFjazogRnVuY3Rpb24pIHt9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRGVidWdFdmVudExpc3RlbmVyW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yO1xuICByZWFkb25seSBjb21wb25lbnRJbnN0YW5jZTogYW55O1xuICByZWFkb25seSBjb250ZXh0OiBhbnk7XG4gIHJlYWRvbmx5IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBwcm92aWRlclRva2VuczogYW55W107XG59XG5leHBvcnQgY2xhc3MgRGVidWdOb2RlX19QUkVfUjNfXyB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRGVidWdFdmVudExpc3RlbmVyW10gPSBbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IERlYnVnTm9kZXxudWxsLCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBfZGVidWdDb250ZXh0O1xuICAgIHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7XG4gICAgaWYgKHBhcmVudCAmJiBwYXJlbnQgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBwYXJlbnQuYWRkQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5pbmplY3RvcjsgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbXBvbmVudDsgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29udGV4dDsgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5yZWZlcmVuY2VzOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5wcm92aWRlclRva2VuczsgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z0VsZW1lbnQgZXh0ZW5kcyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG4gIHJlYWRvbmx5IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXTtcblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50O1xuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W107XG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdO1xuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZDtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fIGV4dGVuZHMgRGVidWdOb2RlX19QUkVfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIHJlYWRvbmx5IG5hbWUgITogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogYW55LCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICBzdXBlcihuYXRpdmVOb2RlLCBwYXJlbnQsIF9kZWJ1Z0NvbnRleHQpO1xuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZU5vZGU7XG4gIH1cblxuICBhZGRDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMucHVzaChjaGlsZCk7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBjb25zdCBjaGlsZEluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChjaGlsZEluZGV4ICE9PSAtMSkge1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlIHwgbnVsbH0pLnBhcmVudCA9IG51bGw7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKGNoaWxkSW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydENoaWxkcmVuQWZ0ZXIoY2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGRyZW46IERlYnVnTm9kZVtdKSB7XG4gICAgY29uc3Qgc2libGluZ0luZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChzaWJsaW5nSW5kZXggIT09IC0xKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHNpYmxpbmdJbmRleCArIDEsIDAsIC4uLm5ld0NoaWxkcmVuKTtcbiAgICAgIG5ld0NoaWxkcmVuLmZvckVhY2goYyA9PiB7XG4gICAgICAgIGlmIChjLnBhcmVudCkge1xuICAgICAgICAgIChjLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChjKTtcbiAgICAgICAgfVxuICAgICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0QmVmb3JlKHJlZkNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkOiBEZWJ1Z05vZGUpOiB2b2lkIHtcbiAgICBjb25zdCByZWZJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKHJlZkNoaWxkKTtcbiAgICBpZiAocmVmSW5kZXggPT09IC0xKSB7XG4gICAgICB0aGlzLmFkZENoaWxkKG5ld0NoaWxkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5ld0NoaWxkLnBhcmVudCkge1xuICAgICAgICAobmV3Q2hpbGQucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcbiAgICAgIH1cbiAgICAgIChuZXdDaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHJlZkluZGV4LCAwLCBuZXdDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5jaGlsZE5vZGVzICAvL1xuICAgICAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykgYXMgRGVidWdFbGVtZW50W107XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09IGV2ZW50TmFtZSkge1xuICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayhldmVudE9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc05hdGl2ZUVsZW1lbnRzKGRlYnVnRWxzOiBEZWJ1Z0VsZW1lbnRbXSk6IGFueSB7XG4gIHJldHVybiBkZWJ1Z0Vscy5tYXAoKGVsKSA9PiBlbC5uYXRpdmVFbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5RWxlbWVudENoaWxkcmVuKFxuICAgIGVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10pIHtcbiAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbihcbiAgICBwYXJlbnROb2RlOiBEZWJ1Z05vZGUsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdKSB7XG4gIGlmIChwYXJlbnROb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgIHBhcmVudE5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbmNsYXNzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogTm9kZTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBOb2RlKSB7IHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7IH1cblxuICBnZXQgcGFyZW50KCk6IERlYnVnRWxlbWVudHxudWxsIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm5hdGl2ZU5vZGUucGFyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgIHJldHVybiBwYXJlbnQgPyBuZXcgRGVidWdFbGVtZW50X19QT1NUX1IzX18ocGFyZW50KSA6IG51bGw7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gZ2V0SW5qZWN0b3IodGhpcy5uYXRpdmVOb2RlKTsgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZU5vZGU7XG4gICAgcmV0dXJuIG5hdGl2ZUVsZW1lbnQgJiZcbiAgICAgICAgKGdldENvbXBvbmVudChuYXRpdmVFbGVtZW50IGFzIEVsZW1lbnQpIHx8IGdldFZpZXdDb21wb25lbnQobmF0aXZlRWxlbWVudCkpO1xuICB9XG4gIGdldCBjb250ZXh0KCk6IGFueSB7XG4gICAgcmV0dXJuIGdldENvbXBvbmVudCh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCkgfHwgZ2V0Q29udGV4dCh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7XG4gIH1cblxuICBnZXQgbGlzdGVuZXJzKCk6IERlYnVnRXZlbnRMaXN0ZW5lcltdIHtcbiAgICByZXR1cm4gZ2V0TGlzdGVuZXJzKHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KS5maWx0ZXIoaXNCcm93c2VyRXZlbnRzKTtcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7IHJldHVybiBnZXRMb2NhbFJlZnModGhpcy5uYXRpdmVOb2RlKTsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7IHJldHVybiBnZXRJbmplY3Rpb25Ub2tlbnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpOyB9XG59XG5cbmNsYXNzIERlYnVnRWxlbWVudF9fUE9TVF9SM19fIGV4dGVuZHMgRGVidWdOb2RlX19QT1NUX1IzX18gaW1wbGVtZW50cyBEZWJ1Z0VsZW1lbnQge1xuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBFbGVtZW50KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUobmF0aXZlTm9kZSk7XG4gICAgc3VwZXIobmF0aXZlTm9kZSk7XG4gIH1cblxuICBnZXQgbmF0aXZlRWxlbWVudCgpOiBFbGVtZW50fG51bGwge1xuICAgIHJldHVybiB0aGlzLm5hdGl2ZU5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUgPyB0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCA6IG51bGw7XG4gIH1cblxuICBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KHRoaXMubmF0aXZlTm9kZSkgITtcbiAgICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgICAgIHJldHVybiB0Tm9kZS50YWdOYW1lICE7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlTmFtZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogIEdldHMgYSBtYXAgb2YgcHJvcGVydHkgbmFtZXMgdG8gcHJvcGVydHkgdmFsdWVzIGZvciBhbiBlbGVtZW50LlxuICAgKlxuICAgKiAgVGhpcyBtYXAgaW5jbHVkZXM6XG4gICAqICAtIFJlZ3VsYXIgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYFtpZF09XCJpZFwiYClcbiAgICogIC0gSG9zdCBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgaG9zdDogeyAnW2lkXSc6IFwiaWRcIiB9YClcbiAgICogIC0gSW50ZXJwb2xhdGVkIHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBpZD1cInt7IHZhbHVlIH19XCIpXG4gICAqXG4gICAqICBJdCBkb2VzIG5vdCBpbmNsdWRlOlxuICAgKiAgLSBpbnB1dCBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgW215Q3VzdG9tSW5wdXRdPVwidmFsdWVcImApXG4gICAqICAtIGF0dHJpYnV0ZSBiaW5kaW5ncyAoZS5nLiBgW2F0dHIucm9sZV09XCJtZW51XCJgKVxuICAgKi9cbiAgZ2V0IHByb3BlcnRpZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KHRoaXMubmF0aXZlTm9kZSwgZmFsc2UpO1xuICAgIGlmIChjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICBjb25zdCBsVmlldyA9IGNvbnRleHQubFZpZXc7XG4gICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcblxuICAgIGNvbnN0IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gICAgLy8gQ29sbGVjdCBwcm9wZXJ0aWVzIGZyb20gdGhlIERPTS5cbiAgICBjb3B5RG9tUHJvcGVydGllcyh0aGlzLm5hdGl2ZUVsZW1lbnQsIHByb3BlcnRpZXMpO1xuICAgIC8vIENvbGxlY3QgcHJvcGVydGllcyBmcm9tIHRoZSBiaW5kaW5ncy4gVGhpcyBpcyBuZWVkZWQgZm9yIGFuaW1hdGlvbiByZW5kZXJlciB3aGljaCBoYXNcbiAgICAvLyBzeW50aGV0aWMgcHJvcGVydGllcyB3aGljaCBkb24ndCBnZXQgcmVmbGVjdGVkIGludG8gdGhlIERPTS5cbiAgICBjb2xsZWN0UHJvcGVydHlCaW5kaW5ncyhwcm9wZXJ0aWVzLCB0Tm9kZSwgbFZpZXcsIHREYXRhKTtcbiAgICByZXR1cm4gcHJvcGVydGllcztcbiAgfVxuXG4gIGdldCBhdHRyaWJ1dGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30ge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KGVsZW1lbnQsIGZhbHNlKTtcbiAgICBpZiAoY29udGV4dCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgIGNvbnN0IHROb2RlQXR0cnMgPSAobFZpZXdbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlKS5hdHRycztcbiAgICBjb25zdCBsb3dlcmNhc2VUTm9kZUF0dHJzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8gRm9yIGRlYnVnIG5vZGVzIHdlIHRha2UgdGhlIGVsZW1lbnQncyBhdHRyaWJ1dGUgZGlyZWN0bHkgZnJvbSB0aGUgRE9NIHNpbmNlIGl0IGFsbG93cyB1c1xuICAgIC8vIHRvIGFjY291bnQgZm9yIG9uZXMgdGhhdCB3ZXJlbid0IHNldCB2aWEgYmluZGluZ3MgKGUuZy4gVmlld0VuZ2luZSBrZWVwcyB0cmFjayBvZiB0aGUgb25lc1xuICAgIC8vIHRoYXQgYXJlIHNldCB0aHJvdWdoIGBSZW5kZXJlcjJgKS4gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGUgYnJvd3NlciB3aWxsIGxvd2VyY2FzZSBhbGwgbmFtZXMsXG4gICAgLy8gaG93ZXZlciBzaW5jZSB3ZSBoYXZlIHRoZSBhdHRyaWJ1dGVzIGFscmVhZHkgb24gdGhlIFROb2RlLCB3ZSBjYW4gcHJlc2VydmUgdGhlIGNhc2UgYnkgZ29pbmdcbiAgICAvLyB0aHJvdWdoIHRoZW0gb25jZSwgYWRkaW5nIHRoZW0gdG8gdGhlIGBhdHRyaWJ1dGVzYCBtYXAgYW5kIHB1dHRpbmcgdGhlaXIgbG93ZXItY2FzZWQgbmFtZVxuICAgIC8vIGludG8gYW4gYXJyYXkuIEFmdGVyd2FyZHMgd2hlbiB3ZSdyZSBnb2luZyB0aHJvdWdoIHRoZSBuYXRpdmUgRE9NIGF0dHJpYnV0ZXMsIHdlIGNhbiBjaGVja1xuICAgIC8vIHdoZXRoZXIgd2UgaGF2ZW4ndCBydW4gaW50byBhbiBhdHRyaWJ1dGUgYWxyZWFkeSB0aHJvdWdoIHRoZSBUTm9kZS5cbiAgICBpZiAodE5vZGVBdHRycykge1xuICAgICAgbGV0IGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCB0Tm9kZUF0dHJzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHROb2RlQXR0cnNbaV07XG5cbiAgICAgICAgLy8gU3RvcCBhcyBzb29uIGFzIHdlIGhpdCBhIG1hcmtlci4gV2Ugb25seSBjYXJlIGFib3V0IHRoZSByZWd1bGFyIGF0dHJpYnV0ZXMuIEV2ZXJ5dGhpbmdcbiAgICAgICAgLy8gZWxzZSB3aWxsIGJlIGhhbmRsZWQgYmVsb3cgd2hlbiB3ZSByZWFkIHRoZSBmaW5hbCBhdHRyaWJ1dGVzIG9mZiB0aGUgRE9NLlxuICAgICAgICBpZiAodHlwZW9mIGF0dHJOYW1lICE9PSAnc3RyaW5nJykgYnJlYWs7XG5cbiAgICAgICAgY29uc3QgYXR0clZhbHVlID0gdE5vZGVBdHRyc1tpICsgMV07XG4gICAgICAgIGF0dHJpYnV0ZXNbYXR0ck5hbWVdID0gYXR0clZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgbG93ZXJjYXNlVE5vZGVBdHRycy5wdXNoKGF0dHJOYW1lLnRvTG93ZXJDYXNlKCkpO1xuXG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBlQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHIgPSBlQXR0cnNbaV07XG4gICAgICAvLyBNYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBhc3NpZ24gdGhlIHNhbWUgYXR0cmlidXRlIGJvdGggaW4gaXRzXG4gICAgICAvLyBjYXNlLXNlbnNpdGl2ZSBmb3JtIGFuZCB0aGUgbG93ZXItY2FzZWQgb25lIGZyb20gdGhlIGJyb3dzZXIuXG4gICAgICBpZiAobG93ZXJjYXNlVE5vZGVBdHRycy5pbmRleE9mKGF0dHIubmFtZSkgPT09IC0xKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNbYXR0ci5uYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gIH1cblxuICBnZXQgc3R5bGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSB7XG4gICAgaWYgKHRoaXMubmF0aXZlRWxlbWVudCAmJiAodGhpcy5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZSkge1xuICAgICAgcmV0dXJuICh0aGlzLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlIGFze1trZXk6IHN0cmluZ106IGFueX07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIHByaXZhdGUgX2NsYXNzZXNQcm94eSAhOiB7fTtcbiAgZ2V0IGNsYXNzZXMoKToge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSB7XG4gICAgaWYgKCF0aGlzLl9jbGFzc2VzUHJveHkpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgIC8vIHdlIHVzZSBhIHByb3h5IGhlcmUgYmVjYXVzZSBWRSBjb2RlIGV4cGVjdHMgYC5jbGFzc2VzYCB0byBrZWVwXG4gICAgICAvLyB0cmFjayBvZiB3aGljaCBjbGFzc2VzIGhhdmUgYmVlbiBhZGRlZCBhbmQgcmVtb3ZlZC4gQmVjYXVzZSB3ZVxuICAgICAgLy8gZG8gbm90IG1ha2UgdXNlIG9mIGEgZGVidWcgcmVuZGVyZXIgYW55bW9yZSwgdGhlIHJldHVybiB2YWx1ZVxuICAgICAgLy8gbXVzdCBhbHdheXMgYmUgYGZhbHNlYCBpbiB0aGUgZXZlbnQgdGhhdCBhIGNsYXNzIGRvZXMgbm90IGV4aXN0XG4gICAgICAvLyBvbiB0aGUgZWxlbWVudCAoZXZlbiBpZiBpdCB3YXNuJ3QgYWRkZWQgYW5kIHJlbW92ZWQgYmVmb3JlaGFuZCkuXG4gICAgICB0aGlzLl9jbGFzc2VzUHJveHkgPSBjcmVhdGVQcm94eSh7XG4gICAgICAgIGdldCh0YXJnZXQ6IHt9LCBwcm9wOiBzdHJpbmcpIHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKHByb3ApIDogZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNldCh0YXJnZXQ6IHt9LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShwcm9wLCAhIXZhbHVlKSA6IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBvd25LZXlzKCkgeyByZXR1cm4gZWxlbWVudCA/IEFycmF5LmZyb20oZWxlbWVudC5jbGFzc0xpc3QpLnNvcnQoKSA6IFtdOyB9LFxuICAgICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoazogYW55KSB7XG4gICAgICAgICAgLy8gd2UgdXNlIGEgc3BlY2lhbCBwcm9wZXJ0eSBkZXNjcmlwdG9yIGhlcmUgc28gdGhhdCBlbnVtZXJhdGlvbiBvcGVyYXRpb25zXG4gICAgICAgICAgLy8gc3VjaCBhcyBgT2JqZWN0LmtleXNgIHdpbGwgd29yayBvbiB0aGlzIHByb3h5LlxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2NsYXNzZXNQcm94eTtcbiAgfVxuXG4gIGdldCBjaGlsZE5vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gdGhpcy5uYXRpdmVOb2RlLmNoaWxkTm9kZXM7XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnTm9kZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCFuYXRpdmVFbGVtZW50KSByZXR1cm4gW107XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IG5hdGl2ZUVsZW1lbnQuY2hpbGRyZW47XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5QWxsUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCB0cnVlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeUFsbFIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZmFsc2UpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5hdGl2ZU5vZGUgYXMgYW55O1xuICAgIGNvbnN0IGludm9rZWRMaXN0ZW5lcnM6IEZ1bmN0aW9uW10gPSBbXTtcblxuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT09IGV2ZW50TmFtZSkge1xuICAgICAgICBjb25zdCBjYWxsYmFjayA9IGxpc3RlbmVyLmNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhldmVudE9iaik7XG4gICAgICAgIGludm9rZWRMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIHdoZXRoZXIgYGV2ZW50TGlzdGVuZXJzYCBleGlzdHMsIGJlY2F1c2UgaXQncyBzb21ldGhpbmdcbiAgICAvLyB0aGF0IFpvbmUuanMgb25seSBhZGRzIHRvIGBFdmVudFRhcmdldGAgaW4gYnJvd3NlciBlbnZpcm9ubWVudHMuXG4gICAgaWYgKHR5cGVvZiBub2RlLmV2ZW50TGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgaW4gSXZ5IHdlIHdyYXAgZXZlbnQgbGlzdGVuZXJzIHdpdGggYSBjYWxsIHRvIGBldmVudC5wcmV2ZW50RGVmYXVsdGAgaW4gc29tZVxuICAgICAgLy8gY2FzZXMuIFdlIHVzZSBgRnVuY3Rpb25gIGFzIGEgc3BlY2lhbCB0b2tlbiB0aGF0IGdpdmVzIHVzIGFjY2VzcyB0byB0aGUgYWN0dWFsIGV2ZW50XG4gICAgICAvLyBsaXN0ZW5lci5cbiAgICAgIG5vZGUuZXZlbnRMaXN0ZW5lcnMoZXZlbnROYW1lKS5mb3JFYWNoKChsaXN0ZW5lcjogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgY29uc3QgdW53cmFwcGVkTGlzdGVuZXIgPSBsaXN0ZW5lcihGdW5jdGlvbik7XG4gICAgICAgIHJldHVybiBpbnZva2VkTGlzdGVuZXJzLmluZGV4T2YodW53cmFwcGVkTGlzdGVuZXIpID09PSAtMSAmJiB1bndyYXBwZWRMaXN0ZW5lcihldmVudE9iaik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY29weURvbVByb3BlcnRpZXMoZWxlbWVudDogRWxlbWVudCB8IG51bGwsIHByb3BlcnRpZXM6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSk6IHZvaWQge1xuICBpZiAoZWxlbWVudCkge1xuICAgIC8vIFNraXAgb3duIHByb3BlcnRpZXMgKGFzIHRob3NlIGFyZSBwYXRjaGVkKVxuICAgIGxldCBvYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoZWxlbWVudCk7XG4gICAgY29uc3QgTm9kZVByb3RvdHlwZTogYW55ID0gTm9kZS5wcm90b3R5cGU7XG4gICAgd2hpbGUgKG9iaiAhPT0gbnVsbCAmJiBvYmogIT09IE5vZGVQcm90b3R5cGUpIHtcbiAgICAgIGNvbnN0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMob2JqKTtcbiAgICAgIGZvciAobGV0IGtleSBpbiBkZXNjcmlwdG9ycykge1xuICAgICAgICBpZiAoIWtleS5zdGFydHNXaXRoKCdfXycpICYmICFrZXkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgICAgICAgIC8vIGRvbid0IGluY2x1ZGUgcHJvcGVydGllcyBzdGFydGluZyB3aXRoIGBfX2AgYW5kIGBvbmAuXG4gICAgICAgICAgLy8gYF9fYCBhcmUgcGF0Y2hlZCB2YWx1ZXMgd2hpY2ggc2hvdWxkIG5vdCBiZSBpbmNsdWRlZC5cbiAgICAgICAgICAvLyBgb25gIGFyZSBsaXN0ZW5lcnMgd2hpY2ggYWxzbyBzaG91bGQgbm90IGJlIGluY2x1ZGVkLlxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gKGVsZW1lbnQgYXMgYW55KVtrZXldO1xuICAgICAgICAgIGlmIChpc1ByaW1pdGl2ZVZhbHVlKHZhbHVlKSkge1xuICAgICAgICAgICAgcHJvcGVydGllc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBvYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHxcbiAgICAgIHZhbHVlID09PSBudWxsO1xufVxuXG4vKipcbiAqIFdhbGsgdGhlIFROb2RlIHRyZWUgdG8gZmluZCBtYXRjaGVzIGZvciB0aGUgcHJlZGljYXRlLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRFbGVtZW50IHRoZSBlbGVtZW50IGZyb20gd2hpY2ggdGhlIHdhbGsgaXMgc3RhcnRlZFxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5QWxsUjMoXG4gICAgcGFyZW50RWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+LCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSxcbiAgICBlbGVtZW50c09ubHk6IHRydWUpOiB2b2lkO1xuZnVuY3Rpb24gX3F1ZXJ5QWxsUjMoXG4gICAgcGFyZW50RWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSxcbiAgICBlbGVtZW50c09ubHk6IGZhbHNlKTogdm9pZDtcbmZ1bmN0aW9uIF9xdWVyeUFsbFIzKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuKSB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQocGFyZW50RWxlbWVudC5uYXRpdmVOb2RlKSAhO1xuICBjb25zdCBwYXJlbnRUTm9kZSA9IGNvbnRleHQubFZpZXdbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgIHBhcmVudFROb2RlLCBjb250ZXh0LmxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcGFyZW50RWxlbWVudC5uYXRpdmVOb2RlKTtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBtYXRjaCB0aGUgY3VycmVudCBUTm9kZSBhZ2FpbnN0IHRoZSBwcmVkaWNhdGUsIGFuZCBnb2VzIG9uIHdpdGggdGhlIG5leHQgb25lcy5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgdGhlIGN1cnJlbnQgVE5vZGVcbiAqIEBwYXJhbSBsVmlldyB0aGUgTFZpZXcgb2YgdGhpcyBUTm9kZVxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgY29uc3QgbmF0aXZlTm9kZSA9IGdldE5hdGl2ZUJ5VE5vZGVPck51bGwodE5vZGUsIGxWaWV3KTtcbiAgLy8gRm9yIGVhY2ggdHlwZSBvZiBUTm9kZSwgc3BlY2lmaWMgbG9naWMgaXMgZXhlY3V0ZWQuXG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIC8vIENhc2UgMTogdGhlIFROb2RlIGlzIGFuIGVsZW1lbnRcbiAgICAvLyBUaGUgbmF0aXZlIG5vZGUgaGFzIHRvIGJlIGNoZWNrZWQuXG4gICAgX2FkZFF1ZXJ5TWF0Y2hSMyhuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIGlmIChpc0NvbXBvbmVudEhvc3QodE5vZGUpKSB7XG4gICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyB0aGUgaG9zdCBvZiBhIGNvbXBvbmVudCwgdGhlbiBhbGwgbm9kZXMgaW4gaXRzIHZpZXcgaGF2ZSB0byBiZSBwcm9jZXNzZWQuXG4gICAgICAvLyBOb3RlOiB0aGUgY29tcG9uZW50J3MgY29udGVudCAodE5vZGUuY2hpbGQpIHdpbGwgYmUgcHJvY2Vzc2VkIGZyb20gdGhlIGluc2VydGlvbiBwb2ludHMuXG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgICBpZiAoY29tcG9uZW50VmlldyAmJiBjb21wb25lbnRWaWV3W1RWSUVXXS5maXJzdENoaWxkKSB7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgICAgICAgY29tcG9uZW50Vmlld1tUVklFV10uZmlyc3RDaGlsZCAhLCBjb21wb25lbnRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSxcbiAgICAgICAgICAgIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgaXRzIGNoaWxkcmVuIGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0Tm9kZS5jaGlsZCwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGFsc28gaGF2ZSB0byBxdWVyeSB0aGUgRE9NIGRpcmVjdGx5IGluIG9yZGVyIHRvIGNhdGNoIGVsZW1lbnRzIGluc2VydGVkIHRocm91Z2hcbiAgICAgIC8vIFJlbmRlcmVyMi4gTm90ZSB0aGF0IHRoaXMgaXMgX19ub3RfXyBvcHRpbWFsLCBiZWNhdXNlIHdlJ3JlIHdhbGtpbmcgc2ltaWxhciB0cmVlcyBtdWx0aXBsZVxuICAgICAgLy8gdGltZXMuIFZpZXdFbmdpbmUgY291bGQgZG8gaXQgbW9yZSBlZmZpY2llbnRseSwgYmVjYXVzZSBhbGwgdGhlIGluc2VydGlvbnMgZ28gdGhyb3VnaFxuICAgICAgLy8gUmVuZGVyZXIyLCBob3dldmVyIHRoYXQncyBub3QgdGhlIGNhc2UgaW4gSXZ5LiBUaGlzIGFwcHJvYWNoIGlzIGJlaW5nIHVzZWQgYmVjYXVzZTpcbiAgICAgIC8vIDEuIE1hdGNoaW5nIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yIHdvdWxkIG1lYW4gcG90ZW50aWFsbHkgaW50cm9kdWNpbmcgYSBkZXBlZGVuY3lcbiAgICAgIC8vICAgIGZyb20gYFJlbmRlcmVyMmAgdG8gSXZ5IHdoaWNoIGNvdWxkIGJyaW5nIEl2eSBjb2RlIGludG8gVmlld0VuZ2luZS5cbiAgICAgIC8vIDIuIFdlIHdvdWxkIGhhdmUgdG8gbWFrZSBgUmVuZGVyZXIzYCBcImtub3dcIiBhYm91dCBkZWJ1ZyBub2Rlcy5cbiAgICAgIC8vIDMuIEl0IGFsbG93cyB1cyB0byBjYXB0dXJlIG5vZGVzIHRoYXQgd2VyZSBpbnNlcnRlZCBkaXJlY3RseSB2aWEgdGhlIERPTS5cbiAgICAgIG5hdGl2ZU5vZGUgJiYgX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5KTtcbiAgICB9XG4gICAgLy8gSW4gYWxsIGNhc2VzLCBpZiBhIGR5bmFtaWMgY29udGFpbmVyIGV4aXN0cyBmb3IgdGhpcyBub2RlLCBlYWNoIHZpZXcgaW5zaWRlIGl0IGhhcyB0byBiZVxuICAgIC8vIHByb2Nlc3NlZC5cbiAgICBjb25zdCBub2RlT3JDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgaWYgKGlzTENvbnRhaW5lcihub2RlT3JDb250YWluZXIpKSB7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKFxuICAgICAgICAgIG5vZGVPckNvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIENhc2UgMjogdGhlIFROb2RlIGlzIGEgY29udGFpbmVyXG4gICAgLy8gVGhlIG5hdGl2ZSBub2RlIGhhcyB0byBiZSBjaGVja2VkLlxuICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgX2FkZFF1ZXJ5TWF0Y2hSMyhsQ29udGFpbmVyW05BVElWRV0sIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgLy8gRWFjaCB2aWV3IGluc2lkZSB0aGUgY29udGFpbmVyIGhhcyB0byBiZSBwcm9jZXNzZWQuXG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhsQ29udGFpbmVyLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgLy8gQ2FzZSAzOiB0aGUgVE5vZGUgaXMgYSBwcm9qZWN0aW9uIGluc2VydGlvbiBwb2ludCAoaS5lLiBhIDxuZy1jb250ZW50PikuXG4gICAgLy8gVGhlIG5vZGVzIHByb2plY3RlZCBhdCB0aGlzIGxvY2F0aW9uIGFsbCBuZWVkIHRvIGJlIHByb2Nlc3NlZC5cbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gbFZpZXcgIVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV107XG4gICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVt0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShoZWFkKSkge1xuICAgICAgZm9yIChsZXQgbmF0aXZlTm9kZSBvZiBoZWFkKSB7XG4gICAgICAgIF9hZGRRdWVyeU1hdGNoUjMobmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGhlYWQpIHtcbiAgICAgIGNvbnN0IG5leHRMVmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhYXMgTFZpZXc7XG4gICAgICBjb25zdCBuZXh0VE5vZGUgPSBuZXh0TFZpZXdbVFZJRVddLmRhdGFbaGVhZC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhuZXh0VE5vZGUsIG5leHRMVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICAvLyBDYXNlIDQ6IHRoZSBUTm9kZSBpcyBhIHZpZXcuXG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModE5vZGUuY2hpbGQsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9XG5cbiAgLy8gV2UgZG9uJ3Qgd2FudCB0byBnbyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSByb290IG5vZGUuXG4gIGlmIChyb290TmF0aXZlTm9kZSAhPT0gbmF0aXZlTm9kZSkge1xuICAgIC8vIFRvIGRldGVybWluZSB0aGUgbmV4dCBub2RlIHRvIGJlIHByb2Nlc3NlZCwgd2UgbmVlZCB0byB1c2UgdGhlIG5leHQgb3IgdGhlIHByb2plY3Rpb25OZXh0XG4gICAgLy8gbGluaywgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIGN1cnJlbnQgbm9kZSBoYXMgYmVlbiBwcm9qZWN0ZWQuXG4gICAgY29uc3QgbmV4dFROb2RlID0gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkgPyB0Tm9kZS5wcm9qZWN0aW9uTmV4dCA6IHROb2RlLm5leHQ7XG4gICAgaWYgKG5leHRUTm9kZSkge1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobmV4dFROb2RlLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzIGFsbCBUTm9kZXMgaW4gYSBnaXZlbiBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdGhlIGNvbnRhaW5lciB0byBiZSBwcm9jZXNzZWRcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGRWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgY2hpbGRWaWV3W1RWSUVXXS5ub2RlICEsIGNoaWxkVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hdGNoIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlTm9kZSB0aGUgY3VycmVudCBuYXRpdmUgbm9kZVxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9hZGRRdWVyeU1hdGNoUjMoXG4gICAgbmF0aXZlTm9kZTogYW55LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgaWYgKHJvb3ROYXRpdmVOb2RlICE9PSBuYXRpdmVOb2RlKSB7XG4gICAgY29uc3QgZGVidWdOb2RlID0gZ2V0RGVidWdOb2RlKG5hdGl2ZU5vZGUpO1xuICAgIGlmICghZGVidWdOb2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFR5cGUgb2YgdGhlIFwicHJlZGljYXRlIGFuZCBcIm1hdGNoZXNcIiBhcnJheSBhcmUgc2V0IGJhc2VkIG9uIHRoZSB2YWx1ZSBvZlxuICAgIC8vIHRoZSBcImVsZW1lbnRzT25seVwiIHBhcmFtZXRlci4gVHlwZVNjcmlwdCBpcyBub3QgYWJsZSB0byBwcm9wZXJseSBpbmZlciB0aGVzZVxuICAgIC8vIHR5cGVzIHdpdGggZ2VuZXJpY3MsIHNvIHdlIG1hbnVhbGx5IGNhc3QgdGhlIHBhcmFtZXRlcnMgYWNjb3JkaW5nbHkuXG4gICAgaWYgKGVsZW1lbnRzT25seSAmJiBkZWJ1Z05vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyAmJiBwcmVkaWNhdGUoZGVidWdOb2RlKSAmJlxuICAgICAgICBtYXRjaGVzLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgIG1hdGNoZXMucHVzaChkZWJ1Z05vZGUpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICFlbGVtZW50c09ubHkgJiYgKHByZWRpY2F0ZSBhcyBQcmVkaWNhdGU8RGVidWdOb2RlPikoZGVidWdOb2RlKSAmJlxuICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLnB1c2goZGVidWdOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNYXRjaCBhbGwgdGhlIGRlc2NlbmRhbnRzIG9mIGEgRE9NIG5vZGUgYWdhaW5zdCBhIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlTm9kZSB0aGUgY3VycmVudCBuYXRpdmUgbm9kZVxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKFxuICAgIHBhcmVudE5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuKSB7XG4gIGNvbnN0IG5vZGVzID0gcGFyZW50Tm9kZS5jaGlsZE5vZGVzO1xuICBjb25zdCBsZW5ndGggPSBub2Rlcy5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICBjb25zdCBkZWJ1Z05vZGUgPSBnZXREZWJ1Z05vZGUobm9kZSk7XG5cbiAgICBpZiAoZGVidWdOb2RlKSB7XG4gICAgICBpZiAoZWxlbWVudHNPbmx5ICYmIGRlYnVnTm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fICYmIHByZWRpY2F0ZShkZWJ1Z05vZGUpICYmXG4gICAgICAgICAgbWF0Y2hlcy5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChkZWJ1Z05vZGUpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAhZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkucHVzaChkZWJ1Z05vZGUpO1xuICAgICAgfVxuXG4gICAgICBfcXVlcnlOYXRpdmVOb2RlRGVzY2VuZGFudHMobm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIHByb3BlcnR5IGJpbmRpbmdzIGZvciBhIGdpdmVuIG5vZGUgYW5kIGdlbmVyYXRlc1xuICogYSBtYXAgb2YgcHJvcGVydHkgbmFtZXMgdG8gdmFsdWVzLiBUaGlzIG1hcCBvbmx5IGNvbnRhaW5zIHByb3BlcnR5IGJpbmRpbmdzXG4gKiBkZWZpbmVkIGluIHRlbXBsYXRlcywgbm90IGluIGhvc3QgYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKFxuICAgIHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKTogdm9pZCB7XG4gIGxldCBiaW5kaW5nSW5kZXhlcyA9IHROb2RlLnByb3BlcnR5QmluZGluZ3M7XG5cbiAgaWYgKGJpbmRpbmdJbmRleGVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5nSW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gYmluZGluZ0luZGV4ZXNbaV07XG4gICAgICBjb25zdCBwcm9wTWV0YWRhdGEgPSB0RGF0YVtiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IG1ldGFkYXRhUGFydHMgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gbWV0YWRhdGFQYXJ0c1swXTtcbiAgICAgIGlmIChtZXRhZGF0YVBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gbWV0YWRhdGFQYXJ0c1sxXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPCBtZXRhZGF0YVBhcnRzLmxlbmd0aCAtIDE7IGorKykge1xuICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeShsVmlld1tiaW5kaW5nSW5kZXggKyBqIC0gMV0pICsgbWV0YWRhdGFQYXJ0c1tqICsgMV07XG4gICAgICAgIH1cbiAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8vIE5lZWQgdG8ga2VlcCB0aGUgbm9kZXMgaW4gYSBnbG9iYWwgTWFwIHNvIHRoYXQgbXVsdGlwbGUgYW5ndWxhciBhcHBzIGFyZSBzdXBwb3J0ZWQuXG5jb25zdCBfbmF0aXZlTm9kZVRvRGVidWdOb2RlID0gbmV3IE1hcDxhbnksIERlYnVnTm9kZT4oKTtcblxuZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QUkVfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIHJldHVybiBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmdldChuYXRpdmVOb2RlKSB8fCBudWxsO1xufVxuXG5jb25zdCBOR19ERUJVR19QUk9QRVJUWSA9ICdfX25nX2RlYnVnX18nO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogRWxlbWVudCk6IERlYnVnRWxlbWVudF9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IE5vZGUpOiBEZWJ1Z05vZGVfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBudWxsKTogbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIGlmIChuYXRpdmVOb2RlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICghKG5hdGl2ZU5vZGUuaGFzT3duUHJvcGVydHkoTkdfREVCVUdfUFJPUEVSVFkpKSkge1xuICAgICAgKG5hdGl2ZU5vZGUgYXMgYW55KVtOR19ERUJVR19QUk9QRVJUWV0gPSBuYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID9cbiAgICAgICAgICBuZXcgRGVidWdFbGVtZW50X19QT1NUX1IzX18obmF0aXZlTm9kZSBhcyBFbGVtZW50KSA6XG4gICAgICAgICAgbmV3IERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gKG5hdGl2ZU5vZGUgYXMgYW55KVtOR19ERUJVR19QUk9QRVJUWV07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGVidWdOb2RlOiAobmF0aXZlTm9kZTogYW55KSA9PiBEZWJ1Z05vZGUgfCBudWxsID0gZ2V0RGVidWdOb2RlX19QUkVfUjNfXztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbERlYnVnTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnZhbHVlcygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4RGVidWdOb2RlKG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnNldChub2RlLm5hdGl2ZU5vZGUsIG5vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4KG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmRlbGV0ZShub2RlLm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIEEgYm9vbGVhbi12YWx1ZWQgZnVuY3Rpb24gb3ZlciBhIHZhbHVlLCBwb3NzaWJseSBpbmNsdWRpbmcgY29udGV4dCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIHRoYXQgdmFsdWUncyBwb3NpdGlvbiBpbiBhbiBhcnJheS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJlZGljYXRlPFQ+IHsgKHZhbHVlOiBUKTogYm9vbGVhbjsgfVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnTm9kZToge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z05vZGV9ID0gRGVidWdOb2RlX19QUkVfUjNfXztcblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z0VsZW1lbnQ6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdFbGVtZW50fSA9IERlYnVnRWxlbWVudF9fUFJFX1IzX187XG4iXX0=