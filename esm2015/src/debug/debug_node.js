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
import { PARENT, TVIEW, T_HOST } from '../render3/interfaces/view';
import { stylingMapToStringMap } from '../render3/styling_next/map_based_bindings';
import { NodeStylingDebug } from '../render3/styling_next/styling_debug';
import { isStylingContext } from '../render3/styling_next/util';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER, renderStringify } from '../render3/util/misc_utils';
import { findComponentView } from '../render3/util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByTNodeOrNull } from '../render3/util/view_utils';
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
        const properties = collectPropertyBindings(tNode, lView, tData);
        /** @type {?} */
        const className = collectClassNames(this);
        if (className) {
            properties['className'] =
                properties['className'] ? properties['className'] + ` ${className}` : className;
        }
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
        return _getStylingDebugInfo(this.nativeElement, false);
    }
    /**
     * @return {?}
     */
    get classes() {
        return _getStylingDebugInfo(this.nativeElement, true);
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
 * @param {?} isClassBased
 * @return {?}
 */
function _getStylingDebugInfo(element, isClassBased) {
    /** @type {?} */
    const context = loadLContext(element, false);
    if (!context) {
        return {};
    }
    /** @type {?} */
    const lView = context.lView;
    /** @type {?} */
    const tData = lView[TVIEW].data;
    /** @type {?} */
    const tNode = (/** @type {?} */ (tData[context.nodeIndex]));
    if (isClassBased) {
        return isStylingContext(tNode.classes) ?
            new NodeStylingDebug((/** @type {?} */ (tNode.classes)), lView, true).values :
            stylingMapToStringMap(tNode.classes);
    }
    else {
        return isStylingContext(tNode.styles) ?
            new NodeStylingDebug((/** @type {?} */ (tNode.styles)), lView, false).values :
            stylingMapToStringMap(tNode.styles);
    }
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
            const componentView = getComponentViewByIndex(tNode.index, lView);
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
        const componentView = findComponentView((/** @type {?} */ (lView)));
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
 * @param {?} tNode
 * @param {?} lView
 * @param {?} tData
 * @return {?}
 */
function collectPropertyBindings(tNode, lView, tData) {
    /** @type {?} */
    const properties = {};
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
    return properties;
}
/**
 * @param {?} debugElement
 * @return {?}
 */
function collectClassNames(debugElement) {
    /** @type {?} */
    const classes = debugElement.classes;
    /** @type {?} */
    let output = '';
    for (const className of Object.keys(classes)) {
        if (classes[className]) {
            output = output ? output + ` ${className}` : className;
        }
    }
    return output;
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
export const getDebugNode = getDebugNode__POST_R3__;
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
export const DebugNode = DebugNode__POST_R3__;
/**
 * \@publicApi
 * @type {?}
 */
export const DebugElement = DebugElement__POST_R3__;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsdUJBQXVCLEVBQWMsTUFBTSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFNUYsT0FBTyxFQUFDLGVBQWUsRUFBRSxZQUFZLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNoRixPQUFPLEVBQVEsTUFBTSxFQUFTLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSw0Q0FBNEMsQ0FBQztBQUNqRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUN2RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDckssT0FBTyxFQUFDLHVCQUF1QixFQUFFLGVBQWUsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzNGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7OztBQVE3QyxNQUFNLE9BQU8sa0JBQWtCOzs7OztJQUM3QixZQUFtQixJQUFZLEVBQVMsUUFBa0I7UUFBdkMsU0FBSSxHQUFKLElB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QUNELE9BQU8sQ0FBQyxtQkFBQSxVQUFVLEVBQU8sQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7O0FBS0QsTUFBTSxPQUFPLFlBQVksR0FsQlQsdUJBa0J5RTs7OztBQUV6RixNQUFNLFVBQVUsZ0JBQWdCO0lBQzlCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxJQUFlO0lBQzVDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUFDLElBQWU7SUFDdEQsc0JBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqRCxDQUFDOzs7Ozs7Ozs7QUFRRCwrQkFBc0Q7Ozs7O0FBS3RELE1BQU0sT0FBTyxTQUFTLEdBL2dCaEIsb0JBK2dCeUU7Ozs7O0FBSy9FLE1BQU0sT0FBTyxZQUFZLEdBdGZuQix1QkFzZmtGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2dldFZpZXdDb21wb25lbnR9IGZyb20gJy4uL3JlbmRlcjMvZ2xvYmFsX3V0aWxzX2FwaSc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBOQVRJVkV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNDb21wb25lbnRIb3N0LCBpc0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0xWaWV3LCBQQVJFTlQsIFREYXRhLCBUVklFVywgVF9IT1NUfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1RTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nX25leHQvaW50ZXJmYWNlcyc7XG5pbXBvcnQge3N0eWxpbmdNYXBUb1N0cmluZ01hcH0gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzJztcbmltcG9ydCB7Tm9kZVN0eWxpbmdEZWJ1Z30gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nX25leHQvc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3JlbmRlcjMvc3R5bGluZ19uZXh0L3V0aWwnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldEluamVjdGlvblRva2VucywgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0TG9jYWxSZWZzLCBpc0Jyb3dzZXJFdmVudHMsIGxvYWRMQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlT3JOdWxsfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3L2luZGV4JztcblxuXG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgRGVidWdFdmVudExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGNhbGxiYWNrOiBGdW5jdGlvbikge31cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICByZWFkb25seSBpbmplY3RvcjogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IGNvbXBvbmVudEluc3RhbmNlOiBhbnk7XG4gIHJlYWRvbmx5IGNvbnRleHQ6IGFueTtcbiAgcmVhZG9ubHkgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IHByb3ZpZGVyVG9rZW5zOiBhbnlbXTtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z05vZGVfX1BSRV9SM19fIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXSA9IFtdO1xuICByZWFkb25seSBwYXJlbnQ6IERlYnVnRWxlbWVudHxudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogRGVidWdOb2RlfG51bGwsIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHRoaXMuX2RlYnVnQ29udGV4dCA9IF9kZWJ1Z0NvbnRleHQ7XG4gICAgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTtcbiAgICBpZiAocGFyZW50ICYmIHBhcmVudCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIHBhcmVudC5hZGRDaGlsZCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmluamVjdG9yOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29tcG9uZW50OyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb250ZXh0OyB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnJlZmVyZW5jZXM7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnByb3ZpZGVyVG9rZW5zOyB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnRWxlbWVudCBleHRlbmRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgcmVhZG9ubHkgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdO1xuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQ7XG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXTtcbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW107XG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkO1xufVxuZXhwb3J0IGNsYXNzIERlYnVnRWxlbWVudF9fUFJFX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BSRV9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgcmVhZG9ubHkgbmFtZSAhOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBhbnksIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUsIHBhcmVudCwgX2RlYnVnQ29udGV4dCk7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlTm9kZTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5wdXNoKGNoaWxkKTtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGNvbnN0IGNoaWxkSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKGNoaWxkSW5kZXggIT09IC0xKSB7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGUgfCBudWxsfSkucGFyZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UoY2hpbGRJbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0Q2hpbGRyZW5BZnRlcihjaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZHJlbjogRGVidWdOb2RlW10pIHtcbiAgICBjb25zdCBzaWJsaW5nSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKHNpYmxpbmdJbmRleCAhPT0gLTEpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2Uoc2libGluZ0luZGV4ICsgMSwgMCwgLi4ubmV3Q2hpbGRyZW4pO1xuICAgICAgbmV3Q2hpbGRyZW4uZm9yRWFjaChjID0+IHtcbiAgICAgICAgaWYgKGMucGFyZW50KSB7XG4gICAgICAgICAgKGMucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKGMpO1xuICAgICAgICB9XG4gICAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocmVmQ2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGQ6IERlYnVnTm9kZSk6IHZvaWQge1xuICAgIGNvbnN0IHJlZkluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YocmVmQ2hpbGQpO1xuICAgIGlmIChyZWZJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQobmV3Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV3Q2hpbGQucGFyZW50KSB7XG4gICAgICAgIChuZXdDaGlsZC5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQobmV3Q2hpbGQpO1xuICAgICAgfVxuICAgICAgKG5ld0NoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UocmVmSW5kZXgsIDAsIG5ld0NoaWxkKTtcbiAgICB9XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgICAgICAgLmNoaWxkTm9kZXMgIC8vXG4gICAgICAgIC5maWx0ZXIoKG5vZGUpID0+IG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSBhcyBEZWJ1Z0VsZW1lbnRbXTtcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT0gZXZlbnROYW1lKSB7XG4gICAgICAgIGxpc3RlbmVyLmNhbGxiYWNrKGV2ZW50T2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzTmF0aXZlRWxlbWVudHMoZGVidWdFbHM6IERlYnVnRWxlbWVudFtdKTogYW55IHtcbiAgcmV0dXJuIGRlYnVnRWxzLm1hcCgoZWwpID0+IGVsLm5hdGl2ZUVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlFbGVtZW50Q2hpbGRyZW4oXG4gICAgZWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+LCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSkge1xuICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuKFxuICAgIHBhcmVudE5vZGU6IERlYnVnTm9kZSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10pIHtcbiAgaWYgKHBhcmVudE5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuY2xhc3MgRGVidWdOb2RlX19QT1NUX1IzX18gaW1wbGVtZW50cyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBOb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IE5vZGUpIHsgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTsgfVxuXG4gIGdldCBwYXJlbnQoKTogRGVidWdFbGVtZW50fG51bGwge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubmF0aXZlTm9kZS5wYXJlbnROb2RlIGFzIEVsZW1lbnQ7XG4gICAgcmV0dXJuIHBhcmVudCA/IG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhwYXJlbnQpIDogbnVsbDtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBnZXRJbmplY3Rvcih0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlTm9kZTtcbiAgICByZXR1cm4gbmF0aXZlRWxlbWVudCAmJlxuICAgICAgICAoZ2V0Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQgYXMgRWxlbWVudCkgfHwgZ2V0Vmlld0NvbXBvbmVudChuYXRpdmVFbGVtZW50KSk7XG4gIH1cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICByZXR1cm4gZ2V0Q29tcG9uZW50KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KSB8fCBnZXRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTtcbiAgfVxuXG4gIGdldCBsaXN0ZW5lcnMoKTogRGVidWdFdmVudExpc3RlbmVyW10ge1xuICAgIHJldHVybiBnZXRMaXN0ZW5lcnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpLmZpbHRlcihpc0Jyb3dzZXJFdmVudHMpO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHsgcmV0dXJuIGdldExvY2FsUmVmcyh0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIGdldEluamVjdGlvblRva2Vucyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cbn1cblxuY2xhc3MgRGVidWdFbGVtZW50X19QT1NUX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBuYXRpdmVFbGVtZW50KCk6IEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/IHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50IDogbnVsbDtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlKSAhO1xuICAgICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICAgICAgcmV0dXJuIHROb2RlLnRhZ05hbWUgITtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVOYW1lO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiAgR2V0cyBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byBwcm9wZXJ0eSB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqICBUaGlzIG1hcCBpbmNsdWRlczpcbiAgICogIC0gUmVndWxhciBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgW2lkXT1cImlkXCJgKVxuICAgKiAgLSBIb3N0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBob3N0OiB7ICdbaWRdJzogXCJpZFwiIH1gKVxuICAgKiAgLSBJbnRlcnBvbGF0ZWQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGlkPVwie3sgdmFsdWUgfX1cIilcbiAgICpcbiAgICogIEl0IGRvZXMgbm90IGluY2x1ZGU6XG4gICAqICAtIGlucHV0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbbXlDdXN0b21JbnB1dF09XCJ2YWx1ZVwiYClcbiAgICogIC0gYXR0cmlidXRlIGJpbmRpbmdzIChlLmcuIGBbYXR0ci5yb2xlXT1cIm1lbnVcImApXG4gICAqL1xuICBnZXQgcHJvcGVydGllcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlLCBmYWxzZSk7XG4gICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuXG4gICAgY29uc3QgcHJvcGVydGllcyA9IGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNvbGxlY3RDbGFzc05hbWVzKHRoaXMpO1xuXG4gICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgcHJvcGVydGllc1snY2xhc3NOYW1lJ10gPVxuICAgICAgICAgIHByb3BlcnRpZXNbJ2NsYXNzTmFtZSddID8gcHJvcGVydGllc1snY2xhc3NOYW1lJ10gKyBgICR7Y2xhc3NOYW1lfWAgOiBjbGFzc05hbWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH1cblxuICBnZXQgYXR0cmlidXRlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChlbGVtZW50LCBmYWxzZSk7XG4gICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0Tm9kZUF0dHJzID0gKGxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZSkuYXR0cnM7XG4gICAgY29uc3QgbG93ZXJjYXNlVE5vZGVBdHRyczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIEZvciBkZWJ1ZyBub2RlcyB3ZSB0YWtlIHRoZSBlbGVtZW50J3MgYXR0cmlidXRlIGRpcmVjdGx5IGZyb20gdGhlIERPTSBzaW5jZSBpdCBhbGxvd3MgdXNcbiAgICAvLyB0byBhY2NvdW50IGZvciBvbmVzIHRoYXQgd2VyZW4ndCBzZXQgdmlhIGJpbmRpbmdzIChlLmcuIFZpZXdFbmdpbmUga2VlcHMgdHJhY2sgb2YgdGhlIG9uZXNcbiAgICAvLyB0aGF0IGFyZSBzZXQgdGhyb3VnaCBgUmVuZGVyZXIyYCkuIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhlIGJyb3dzZXIgd2lsbCBsb3dlcmNhc2UgYWxsIG5hbWVzLFxuICAgIC8vIGhvd2V2ZXIgc2luY2Ugd2UgaGF2ZSB0aGUgYXR0cmlidXRlcyBhbHJlYWR5IG9uIHRoZSBUTm9kZSwgd2UgY2FuIHByZXNlcnZlIHRoZSBjYXNlIGJ5IGdvaW5nXG4gICAgLy8gdGhyb3VnaCB0aGVtIG9uY2UsIGFkZGluZyB0aGVtIHRvIHRoZSBgYXR0cmlidXRlc2AgbWFwIGFuZCBwdXR0aW5nIHRoZWlyIGxvd2VyLWNhc2VkIG5hbWVcbiAgICAvLyBpbnRvIGFuIGFycmF5LiBBZnRlcndhcmRzIHdoZW4gd2UncmUgZ29pbmcgdGhyb3VnaCB0aGUgbmF0aXZlIERPTSBhdHRyaWJ1dGVzLCB3ZSBjYW4gY2hlY2tcbiAgICAvLyB3aGV0aGVyIHdlIGhhdmVuJ3QgcnVuIGludG8gYW4gYXR0cmlidXRlIGFscmVhZHkgdGhyb3VnaCB0aGUgVE5vZGUuXG4gICAgaWYgKHROb2RlQXR0cnMpIHtcbiAgICAgIGxldCBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgdE5vZGVBdHRycy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0Tm9kZUF0dHJzW2ldO1xuXG4gICAgICAgIC8vIFN0b3AgYXMgc29vbiBhcyB3ZSBoaXQgYSBtYXJrZXIuIFdlIG9ubHkgY2FyZSBhYm91dCB0aGUgcmVndWxhciBhdHRyaWJ1dGVzLiBFdmVyeXRoaW5nXG4gICAgICAgIC8vIGVsc2Ugd2lsbCBiZSBoYW5kbGVkIGJlbG93IHdoZW4gd2UgcmVhZCB0aGUgZmluYWwgYXR0cmlidXRlcyBvZmYgdGhlIERPTS5cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyTmFtZSAhPT0gJ3N0cmluZycpIGJyZWFrO1xuXG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IHROb2RlQXR0cnNbaSArIDFdO1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHJOYW1lXSA9IGF0dHJWYWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgIGxvd2VyY2FzZVROb2RlQXR0cnMucHVzaChhdHRyTmFtZS50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZUF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRyID0gZUF0dHJzW2ldO1xuICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgYXNzaWduIHRoZSBzYW1lIGF0dHJpYnV0ZSBib3RoIGluIGl0c1xuICAgICAgLy8gY2FzZS1zZW5zaXRpdmUgZm9ybSBhbmQgdGhlIGxvd2VyLWNhc2VkIG9uZSBmcm9tIHRoZSBicm93c2VyLlxuICAgICAgaWYgKGxvd2VyY2FzZVROb2RlQXR0cnMuaW5kZXhPZihhdHRyLm5hbWUpID09PSAtMSkge1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHIubmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgZ2V0IHN0eWxlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICByZXR1cm4gX2dldFN0eWxpbmdEZWJ1Z0luZm8odGhpcy5uYXRpdmVFbGVtZW50LCBmYWxzZSk7XG4gIH1cblxuICBnZXQgY2xhc3NlcygpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9IHtcbiAgICByZXR1cm4gX2dldFN0eWxpbmdEZWJ1Z0luZm8odGhpcy5uYXRpdmVFbGVtZW50LCB0cnVlKTtcbiAgfVxuXG4gIGdldCBjaGlsZE5vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gdGhpcy5uYXRpdmVOb2RlLmNoaWxkTm9kZXM7XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnTm9kZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCFuYXRpdmVFbGVtZW50KSByZXR1cm4gW107XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IG5hdGl2ZUVsZW1lbnQuY2hpbGRyZW47XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5QWxsUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCB0cnVlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeUFsbFIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZmFsc2UpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5hdGl2ZU5vZGUgYXMgYW55O1xuICAgIGNvbnN0IGludm9rZWRMaXN0ZW5lcnM6IEZ1bmN0aW9uW10gPSBbXTtcblxuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT09IGV2ZW50TmFtZSkge1xuICAgICAgICBjb25zdCBjYWxsYmFjayA9IGxpc3RlbmVyLmNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhldmVudE9iaik7XG4gICAgICAgIGludm9rZWRMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIHdoZXRoZXIgYGV2ZW50TGlzdGVuZXJzYCBleGlzdHMsIGJlY2F1c2UgaXQncyBzb21ldGhpbmdcbiAgICAvLyB0aGF0IFpvbmUuanMgb25seSBhZGRzIHRvIGBFdmVudFRhcmdldGAgaW4gYnJvd3NlciBlbnZpcm9ubWVudHMuXG4gICAgaWYgKHR5cGVvZiBub2RlLmV2ZW50TGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgaW4gSXZ5IHdlIHdyYXAgZXZlbnQgbGlzdGVuZXJzIHdpdGggYSBjYWxsIHRvIGBldmVudC5wcmV2ZW50RGVmYXVsdGAgaW4gc29tZVxuICAgICAgLy8gY2FzZXMuIFdlIHVzZSBgRnVuY3Rpb25gIGFzIGEgc3BlY2lhbCB0b2tlbiB0aGF0IGdpdmVzIHVzIGFjY2VzcyB0byB0aGUgYWN0dWFsIGV2ZW50XG4gICAgICAvLyBsaXN0ZW5lci5cbiAgICAgIG5vZGUuZXZlbnRMaXN0ZW5lcnMoZXZlbnROYW1lKS5mb3JFYWNoKChsaXN0ZW5lcjogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgY29uc3QgdW53cmFwcGVkTGlzdGVuZXIgPSBsaXN0ZW5lcihGdW5jdGlvbik7XG4gICAgICAgIHJldHVybiBpbnZva2VkTGlzdGVuZXJzLmluZGV4T2YodW53cmFwcGVkTGlzdGVuZXIpID09PSAtMSAmJiB1bndyYXBwZWRMaXN0ZW5lcihldmVudE9iaik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gX2dldFN0eWxpbmdEZWJ1Z0luZm8oZWxlbWVudDogYW55LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChlbGVtZW50LCBmYWxzZSk7XG4gIGlmICghY29udGV4dCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICByZXR1cm4gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5jbGFzc2VzKSA/XG4gICAgICAgIG5ldyBOb2RlU3R5bGluZ0RlYnVnKHROb2RlLmNsYXNzZXMgYXMgVFN0eWxpbmdDb250ZXh0LCBsVmlldywgdHJ1ZSkudmFsdWVzIDpcbiAgICAgICAgc3R5bGluZ01hcFRvU3RyaW5nTWFwKHROb2RlLmNsYXNzZXMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBpc1N0eWxpbmdDb250ZXh0KHROb2RlLnN0eWxlcykgP1xuICAgICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5zdHlsZXMgYXMgVFN0eWxpbmdDb250ZXh0LCBsVmlldywgZmFsc2UpLnZhbHVlcyA6XG4gICAgICAgIHN0eWxpbmdNYXBUb1N0cmluZ01hcCh0Tm9kZS5zdHlsZXMpO1xuICB9XG59XG5cbi8qKlxuICogV2FsayB0aGUgVE5vZGUgdHJlZSB0byBmaW5kIG1hdGNoZXMgZm9yIHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIHBhcmVudEVsZW1lbnQgdGhlIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgd2FsayBpcyBzdGFydGVkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4sIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdLFxuICAgIGVsZW1lbnRzT25seTogdHJ1ZSk6IHZvaWQ7XG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogZmFsc2UpOiB2b2lkO1xuZnVuY3Rpb24gX3F1ZXJ5QWxsUjMoXG4gICAgcGFyZW50RWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4pIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpICE7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gY29udGV4dC5sVmlld1tUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgcGFyZW50VE5vZGUsIGNvbnRleHQubFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCBwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IG1hdGNoIHRoZSBjdXJyZW50IFROb2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZSwgYW5kIGdvZXMgb24gd2l0aCB0aGUgbmV4dCBvbmVzLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSB0aGUgY3VycmVudCBUTm9kZVxuICogQHBhcmFtIGxWaWV3IHRoZSBMVmlldyBvZiB0aGlzIFROb2RlXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2F0ZSBzaG91bGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBjb25zdCBuYXRpdmVOb2RlID0gZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCh0Tm9kZSwgbFZpZXcpO1xuICAvLyBGb3IgZWFjaCB0eXBlIG9mIFROb2RlLCBzcGVjaWZpYyBsb2dpYyBpcyBleGVjdXRlZC5cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgLy8gQ2FzZSAxOiB0aGUgVE5vZGUgaXMgYW4gZWxlbWVudFxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBfYWRkUXVlcnlNYXRjaFIzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkpIHtcbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIHRoZSBob3N0IG9mIGEgY29tcG9uZW50LCB0aGVuIGFsbCBub2RlcyBpbiBpdHMgdmlldyBoYXZlIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgIC8vIE5vdGU6IHRoZSBjb21wb25lbnQncyBjb250ZW50ICh0Tm9kZS5jaGlsZCkgd2lsbCBiZSBwcm9jZXNzZWQgZnJvbSB0aGUgaW5zZXJ0aW9uIHBvaW50cy5cbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgaWYgKGNvbXBvbmVudFZpZXcgJiYgY29tcG9uZW50Vmlld1tUVklFV10uZmlyc3RDaGlsZCkge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgICAgIGNvbXBvbmVudFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQgISwgY29tcG9uZW50VmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksXG4gICAgICAgICAgICByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgICAgICAvLyBPdGhlcndpc2UsIGl0cyBjaGlsZHJlbiBoYXZlIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModE5vZGUuY2hpbGQsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBhbHNvIGhhdmUgdG8gcXVlcnkgdGhlIERPTSBkaXJlY3RseSBpbiBvcmRlciB0byBjYXRjaCBlbGVtZW50cyBpbnNlcnRlZCB0aHJvdWdoXG4gICAgICAvLyBSZW5kZXJlcjIuIE5vdGUgdGhhdCB0aGlzIGlzIF9fbm90X18gb3B0aW1hbCwgYmVjYXVzZSB3ZSdyZSB3YWxraW5nIHNpbWlsYXIgdHJlZXMgbXVsdGlwbGVcbiAgICAgIC8vIHRpbWVzLiBWaWV3RW5naW5lIGNvdWxkIGRvIGl0IG1vcmUgZWZmaWNpZW50bHksIGJlY2F1c2UgYWxsIHRoZSBpbnNlcnRpb25zIGdvIHRocm91Z2hcbiAgICAgIC8vIFJlbmRlcmVyMiwgaG93ZXZlciB0aGF0J3Mgbm90IHRoZSBjYXNlIGluIEl2eS4gVGhpcyBhcHByb2FjaCBpcyBiZWluZyB1c2VkIGJlY2F1c2U6XG4gICAgICAvLyAxLiBNYXRjaGluZyB0aGUgVmlld0VuZ2luZSBiZWhhdmlvciB3b3VsZCBtZWFuIHBvdGVudGlhbGx5IGludHJvZHVjaW5nIGEgZGVwZWRlbmN5XG4gICAgICAvLyAgICBmcm9tIGBSZW5kZXJlcjJgIHRvIEl2eSB3aGljaCBjb3VsZCBicmluZyBJdnkgY29kZSBpbnRvIFZpZXdFbmdpbmUuXG4gICAgICAvLyAyLiBXZSB3b3VsZCBoYXZlIHRvIG1ha2UgYFJlbmRlcmVyM2AgXCJrbm93XCIgYWJvdXQgZGVidWcgbm9kZXMuXG4gICAgICAvLyAzLiBJdCBhbGxvd3MgdXMgdG8gY2FwdHVyZSBub2RlcyB0aGF0IHdlcmUgaW5zZXJ0ZWQgZGlyZWN0bHkgdmlhIHRoZSBET00uXG4gICAgICBuYXRpdmVOb2RlICYmIF9xdWVyeU5hdGl2ZU5vZGVEZXNjZW5kYW50cyhuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSk7XG4gICAgfVxuICAgIC8vIEluIGFsbCBjYXNlcywgaWYgYSBkeW5hbWljIGNvbnRhaW5lciBleGlzdHMgZm9yIHRoaXMgbm9kZSwgZWFjaCB2aWV3IGluc2lkZSBpdCBoYXMgdG8gYmVcbiAgICAvLyBwcm9jZXNzZWQuXG4gICAgY29uc3Qgbm9kZU9yQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhcbiAgICAgICAgICBub2RlT3JDb250YWluZXIsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBDYXNlIDI6IHRoZSBUTm9kZSBpcyBhIGNvbnRhaW5lclxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIF9hZGRRdWVyeU1hdGNoUjMobENvbnRhaW5lcltOQVRJVkVdLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIC8vIEVhY2ggdmlldyBpbnNpZGUgdGhlIGNvbnRhaW5lciBoYXMgdG8gYmUgcHJvY2Vzc2VkLlxuICAgIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMobENvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgIC8vIENhc2UgMzogdGhlIFROb2RlIGlzIGEgcHJvamVjdGlvbiBpbnNlcnRpb24gcG9pbnQgKGkuZS4gYSA8bmctY29udGVudD4pLlxuICAgIC8vIFRoZSBub2RlcyBwcm9qZWN0ZWQgYXQgdGhpcyBsb2NhdGlvbiBhbGwgbmVlZCB0byBiZSBwcm9jZXNzZWQuXG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGxWaWV3ICEpO1xuICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICAgIGNvbnN0IGhlYWQ6IFROb2RlfG51bGwgPVxuICAgICAgICAoY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbdE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaGVhZCkpIHtcbiAgICAgIGZvciAobGV0IG5hdGl2ZU5vZGUgb2YgaGVhZCkge1xuICAgICAgICBfYWRkUXVlcnlNYXRjaFIzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChoZWFkKSB7XG4gICAgICBjb25zdCBuZXh0TFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gIWFzIExWaWV3O1xuICAgICAgY29uc3QgbmV4dFROb2RlID0gbmV4dExWaWV3W1RWSUVXXS5kYXRhW2hlYWQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobmV4dFROb2RlLCBuZXh0TFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgLy8gQ2FzZSA0OiB0aGUgVE5vZGUgaXMgYSB2aWV3LlxuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHROb2RlLmNoaWxkLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxuXG4gIC8vIFdlIGRvbid0IHdhbnQgdG8gZ28gdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcm9vdCBub2RlLlxuICBpZiAocm9vdE5hdGl2ZU5vZGUgIT09IG5hdGl2ZU5vZGUpIHtcbiAgICAvLyBUbyBkZXRlcm1pbmUgdGhlIG5leHQgbm9kZSB0byBiZSBwcm9jZXNzZWQsIHdlIG5lZWQgdG8gdXNlIHRoZSBuZXh0IG9yIHRoZSBwcm9qZWN0aW9uTmV4dFxuICAgIC8vIGxpbmssIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBjdXJyZW50IG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkLlxuICAgIGNvbnN0IG5leHRUTm9kZSA9ICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpID8gdE5vZGUucHJvamVjdGlvbk5leHQgOiB0Tm9kZS5uZXh0O1xuICAgIGlmIChuZXh0VE5vZGUpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKG5leHRUTm9kZSwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJvY2VzcyBhbGwgVE5vZGVzIGluIGEgZ2l2ZW4gY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRoZSBjb250YWluZXIgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2F0ZSBzaG91bGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkVmlldyA9IGxDb250YWluZXJbaV07XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICAgIGNoaWxkVmlld1tUVklFV10ubm9kZSAhLCBjaGlsZFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXRjaCB0aGUgY3VycmVudCBuYXRpdmUgbm9kZSBhZ2FpbnN0IHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIG5hdGl2ZU5vZGUgdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfYWRkUXVlcnlNYXRjaFIzKFxuICAgIG5hdGl2ZU5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGlmIChyb290TmF0aXZlTm9kZSAhPT0gbmF0aXZlTm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZSA9IGdldERlYnVnTm9kZShuYXRpdmVOb2RlKTtcbiAgICBpZiAoIWRlYnVnTm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUeXBlIG9mIHRoZSBcInByZWRpY2F0ZSBhbmQgXCJtYXRjaGVzXCIgYXJyYXkgYXJlIHNldCBiYXNlZCBvbiB0aGUgdmFsdWUgb2ZcbiAgICAvLyB0aGUgXCJlbGVtZW50c09ubHlcIiBwYXJhbWV0ZXIuIFR5cGVTY3JpcHQgaXMgbm90IGFibGUgdG8gcHJvcGVybHkgaW5mZXIgdGhlc2VcbiAgICAvLyB0eXBlcyB3aXRoIGdlbmVyaWNzLCBzbyB3ZSBtYW51YWxseSBjYXN0IHRoZSBwYXJhbWV0ZXJzIGFjY29yZGluZ2x5LlxuICAgIGlmIChlbGVtZW50c09ubHkgJiYgZGVidWdOb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QT1NUX1IzX18gJiYgcHJlZGljYXRlKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgbWF0Y2hlcy5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICBtYXRjaGVzLnB1c2goZGVidWdOb2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgIChtYXRjaGVzIGFzIERlYnVnTm9kZVtdKS5wdXNoKGRlYnVnTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWF0Y2ggYWxsIHRoZSBkZXNjZW5kYW50cyBvZiBhIERPTSBub2RlIGFnYWluc3QgYSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIG5hdGl2ZU5vZGUgdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5hdGl2ZU5vZGVEZXNjZW5kYW50cyhcbiAgICBwYXJlbnROb2RlOiBhbnksIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBjb25zdCBub2RlcyA9IHBhcmVudE5vZGUuY2hpbGROb2RlcztcbiAgY29uc3QgbGVuZ3RoID0gbm9kZXMubGVuZ3RoO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgY29uc3QgZGVidWdOb2RlID0gZ2V0RGVidWdOb2RlKG5vZGUpO1xuXG4gICAgaWYgKGRlYnVnTm9kZSkge1xuICAgICAgaWYgKGVsZW1lbnRzT25seSAmJiBkZWJ1Z05vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyAmJiBwcmVkaWNhdGUoZGVidWdOb2RlKSAmJlxuICAgICAgICAgIG1hdGNoZXMuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgICBtYXRjaGVzLnB1c2goZGVidWdOb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgIWVsZW1lbnRzT25seSAmJiAocHJlZGljYXRlIGFzIFByZWRpY2F0ZTxEZWJ1Z05vZGU+KShkZWJ1Z05vZGUpICYmXG4gICAgICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLnB1c2goZGVidWdOb2RlKTtcbiAgICAgIH1cblxuICAgICAgX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBwcm9wZXJ0eSBiaW5kaW5ncyBmb3IgYSBnaXZlbiBub2RlIGFuZCBnZW5lcmF0ZXNcbiAqIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHZhbHVlcy4gVGhpcyBtYXAgb25seSBjb250YWlucyBwcm9wZXJ0eSBiaW5kaW5nc1xuICogZGVmaW5lZCBpbiB0ZW1wbGF0ZXMsIG5vdCBpbiBob3N0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UHJvcGVydHlCaW5kaW5ncyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBsZXQgYmluZGluZ0luZGV4ZXMgPSB0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzO1xuXG4gIGlmIChiaW5kaW5nSW5kZXhlcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ0luZGV4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGJpbmRpbmdJbmRleGVzW2ldO1xuICAgICAgY29uc3QgcHJvcE1ldGFkYXRhID0gdERhdGFbYmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBtZXRhZGF0YVBhcnRzID0gcHJvcE1ldGFkYXRhLnNwbGl0KElOVEVSUE9MQVRJT05fREVMSU1JVEVSKTtcbiAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IG1ldGFkYXRhUGFydHNbMF07XG4gICAgICBpZiAobWV0YWRhdGFQYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IG1ldGFkYXRhUGFydHNbMV07XG4gICAgICAgIGZvciAobGV0IGogPSAxOyBqIDwgbWV0YWRhdGFQYXJ0cy5sZW5ndGggLSAxOyBqKyspIHtcbiAgICAgICAgICB2YWx1ZSArPSByZW5kZXJTdHJpbmdpZnkobFZpZXdbYmluZGluZ0luZGV4ICsgaiAtIDFdKSArIG1ldGFkYXRhUGFydHNbaiArIDFdO1xuICAgICAgICB9XG4gICAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gbFZpZXdbYmluZGluZ0luZGV4XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJvcGVydGllcztcbn1cblxuXG5mdW5jdGlvbiBjb2xsZWN0Q2xhc3NOYW1lcyhkZWJ1Z0VsZW1lbnQ6IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKTogc3RyaW5nIHtcbiAgY29uc3QgY2xhc3NlcyA9IGRlYnVnRWxlbWVudC5jbGFzc2VzO1xuICBsZXQgb3V0cHV0ID0gJyc7XG5cbiAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgT2JqZWN0LmtleXMoY2xhc3NlcykpIHtcbiAgICBpZiAoY2xhc3Nlc1tjbGFzc05hbWVdKSB7XG4gICAgICBvdXRwdXQgPSBvdXRwdXQgPyBvdXRwdXQgKyBgICR7Y2xhc3NOYW1lfWAgOiBjbGFzc05hbWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG4vLyBOZWVkIHRvIGtlZXAgdGhlIG5vZGVzIGluIGEgZ2xvYmFsIE1hcCBzbyB0aGF0IG11bHRpcGxlIGFuZ3VsYXIgYXBwcyBhcmUgc3VwcG9ydGVkLlxuY29uc3QgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZSA9IG5ldyBNYXA8YW55LCBEZWJ1Z05vZGU+KCk7XG5cbmZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUFJFX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICByZXR1cm4gX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5nZXQobmF0aXZlTm9kZSkgfHwgbnVsbDtcbn1cblxuY29uc3QgTkdfREVCVUdfUFJPUEVSVFkgPSAnX19uZ19kZWJ1Z19fJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IEVsZW1lbnQpOiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBOb2RlKTogRGVidWdOb2RlX19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogbnVsbCk6IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICBpZiAobmF0aXZlTm9kZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAoIShuYXRpdmVOb2RlLmhhc093blByb3BlcnR5KE5HX0RFQlVHX1BST1BFUlRZKSkpIHtcbiAgICAgIChuYXRpdmVOb2RlIGFzIGFueSlbTkdfREVCVUdfUFJPUEVSVFldID0gbmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/XG4gICAgICAgICAgbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKG5hdGl2ZU5vZGUgYXMgRWxlbWVudCkgOlxuICAgICAgICAgIG5ldyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIChuYXRpdmVOb2RlIGFzIGFueSlbTkdfREVCVUdfUFJPUEVSVFldO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGdldERlYnVnTm9kZTogKG5hdGl2ZU5vZGU6IGFueSkgPT4gRGVidWdOb2RlIHwgbnVsbCA9IGdldERlYnVnTm9kZV9fUFJFX1IzX187XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxEZWJ1Z05vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS52YWx1ZXMoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleERlYnVnTm9kZShub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5zZXQobm9kZS5uYXRpdmVOb2RlLCBub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5kZWxldGUobm9kZS5uYXRpdmVOb2RlKTtcbn1cblxuLyoqXG4gKiBBIGJvb2xlYW4tdmFsdWVkIGZ1bmN0aW9uIG92ZXIgYSB2YWx1ZSwgcG9zc2libHkgaW5jbHVkaW5nIGNvbnRleHQgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyB0aGF0IHZhbHVlJ3MgcG9zaXRpb24gaW4gYW4gYXJyYXkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFByZWRpY2F0ZTxUPiB7ICh2YWx1ZTogVCk6IGJvb2xlYW47IH1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z05vZGU6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdOb2RlfSA9IERlYnVnTm9kZV9fUFJFX1IzX187XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdFbGVtZW50OiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnRWxlbWVudH0gPSBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fO1xuIl19