/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { PARENT, TVIEW, T_HOST } from '../render3/interfaces/view';
import { getProp, getValue, isClassBasedValue } from '../render3/styling/class_and_style_bindings';
import { getStylingContextFromLView } from '../render3/styling/util';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext, loadLContextFromNode } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER, isPropMetadataString, renderStringify } from '../render3/util/misc_utils';
import { findComponentView } from '../render3/util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByTNode, isComponent, isLContainer } from '../render3/util/view_utils';
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
    get context() { return getContext((/** @type {?} */ (this.nativeNode))); }
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
    get name() { return (/** @type {?} */ (this.nativeElement)).nodeName; }
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
        const context = (/** @type {?} */ (loadLContext(this.nativeNode)));
        /** @type {?} */
        const lView = context.lView;
        /** @type {?} */
        const tData = lView[TVIEW].data;
        /** @type {?} */
        const tNode = (/** @type {?} */ (tData[context.nodeIndex]));
        /** @type {?} */
        const properties = collectPropertyBindings(tNode, lView, tData);
        /** @type {?} */
        const hostProperties = collectHostPropertyBindings(tNode, lView, tData);
        /** @type {?} */
        const className = collectClassNames(this);
        /** @type {?} */
        const output = Object.assign({}, properties, hostProperties);
        if (className) {
            output['className'] = output['className'] ? output['className'] + ` ${className}` : className;
        }
        return output;
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
        const context = loadLContext(element);
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
    get classes() {
        /** @type {?} */
        const classes = {};
        /** @type {?} */
        const element = this.nativeElement;
        if (element) {
            /** @type {?} */
            const lContext = loadLContextFromNode(element);
            /** @type {?} */
            const stylingContext = getStylingContextFromLView(lContext.nodeIndex, lContext.lView);
            if (stylingContext) {
                for (let i = 10 /* SingleStylesStartPosition */; i < stylingContext.length; i += 4 /* Size */) {
                    if (isClassBasedValue(stylingContext, i)) {
                        /** @type {?} */
                        const className = getProp(stylingContext, i);
                        /** @type {?} */
                        const value = getValue(stylingContext, i);
                        if (typeof value == 'boolean') {
                            // we want to ignore `null` since those don't overwrite the values.
                            classes[className] = value;
                        }
                    }
                }
            }
            else {
                // Fallback, just read DOM.
                /** @type {?} */
                const eClasses = element.classList;
                for (let i = 0; i < eClasses.length; i++) {
                    classes[eClasses[i]] = true;
                }
            }
        }
        return classes;
    }
    /**
     * @return {?}
     */
    get styles() {
        /** @type {?} */
        const styles = {};
        /** @type {?} */
        const element = this.nativeElement;
        if (element) {
            /** @type {?} */
            const lContext = loadLContextFromNode(element);
            /** @type {?} */
            const stylingContext = getStylingContextFromLView(lContext.nodeIndex, lContext.lView);
            if (stylingContext) {
                for (let i = 10 /* SingleStylesStartPosition */; i < stylingContext.length; i += 4 /* Size */) {
                    if (!isClassBasedValue(stylingContext, i)) {
                        /** @type {?} */
                        const styleName = getProp(stylingContext, i);
                        /** @type {?} */
                        const value = (/** @type {?} */ (getValue(stylingContext, i)));
                        if (value !== null) {
                            // we want to ignore `null` since those don't overwrite the values.
                            styles[styleName] = value;
                        }
                    }
                }
            }
            else {
                // Fallback, just read DOM.
                /** @type {?} */
                const eStyles = ((/** @type {?} */ (element))).style;
                for (let i = 0; i < eStyles.length; i++) {
                    /** @type {?} */
                    const name = eStyles.item(i);
                    styles[name] = eStyles.getPropertyValue(name);
                }
            }
        }
        return styles;
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
        this.listeners.forEach((/**
         * @param {?} listener
         * @return {?}
         */
        (listener) => {
            if (listener.name === eventName) {
                listener.callback(eventObj);
            }
        }));
    }
}
/**
 * Walk the TNode tree to find matches for the predicate.
 *
 * @param {?} parentElement the element from which the walk is started
 * @param {?} predicate the predicate to match
 * @param {?} matches the list of positive matches
 * @param {?} elementsOnly whether only elements should be searched
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
 * @param {?} rootNativeNode the root native node on which prediccate shouold not be matched
 * @return {?}
 */
function _queryNodeChildrenR3(tNode, lView, predicate, matches, elementsOnly, rootNativeNode) {
    /** @type {?} */
    const nativeNode = getNativeByTNode(tNode, lView);
    // For each type of TNode, specific logic is executed.
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        // Case 1: the TNode is an element
        // The native node has to be checked.
        _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
        if (isComponent(tNode)) {
            // If the element is the host of a component, then all nodes in its view have to be processed.
            // Note: the component's content (tNode.child) will be processed from the insertion points.
            /** @type {?} */
            const componentView = getComponentViewByIndex(tNode.index, lView);
            if (componentView && componentView[TVIEW].firstChild) {
                _queryNodeChildrenR3((/** @type {?} */ (componentView[TVIEW].firstChild)), componentView, predicate, matches, elementsOnly, rootNativeNode);
            }
        }
        else if (tNode.child) {
            // Otherwise, its children have to be processed.
            _queryNodeChildrenR3(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
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
        const nextTNode = (tNode.flags & 2 /* isProjected */) ? tNode.projectionNext : tNode.next;
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
 * @param {?} rootNativeNode the root native node on which prediccate shouold not be matched
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
 * @param {?} rootNativeNode the root native node on which prediccate shouold not be matched
 * @return {?}
 */
function _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode) {
    if (rootNativeNode !== nativeNode) {
        /** @type {?} */
        const debugNode = getDebugNode(nativeNode);
        if (debugNode && (elementsOnly ? debugNode instanceof DebugElement__POST_R3__ : true) &&
            predicate(debugNode)) {
            matches.push(debugNode);
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
    let bindingIndex = getFirstBindingIndex(tNode.propertyMetadataStartIndex, tData);
    while (bindingIndex < tNode.propertyMetadataEndIndex) {
        /** @type {?} */
        let value;
        /** @type {?} */
        let propMetadata = (/** @type {?} */ (tData[bindingIndex]));
        while (!isPropMetadataString(propMetadata)) {
            // This is the first value for an interpolation. We need to build up
            // the full interpolation by combining runtime values in LView with
            // the static interstitial values stored in TData.
            value = (value || '') + renderStringify(lView[bindingIndex]) + tData[bindingIndex];
            propMetadata = (/** @type {?} */ (tData[++bindingIndex]));
        }
        value = value === undefined ? lView[bindingIndex] : value += lView[bindingIndex];
        // Property metadata string has 3 parts: property name, prefix, and suffix
        /** @type {?} */
        const metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
        /** @type {?} */
        const propertyName = metadataParts[0];
        // Attr bindings don't have property names and should be skipped
        if (propertyName) {
            // Wrap value with prefix and suffix (will be '' for normal bindings), if they're defined.
            // Avoid wrapping for normal bindings so that the value doesn't get cast to a string.
            properties[propertyName] = (metadataParts[1] && metadataParts[2]) ?
                metadataParts[1] + value + metadataParts[2] :
                value;
        }
        bindingIndex++;
    }
    return properties;
}
/**
 * Retrieves the first binding index that holds values for this property
 * binding.
 *
 * For normal bindings (e.g. `[id]="id"`), the binding index is the
 * same as the metadata index. For interpolations (e.g. `id="{{id}}-{{name}}"`),
 * there can be multiple binding values, so we might have to loop backwards
 * from the metadata index until we find the first one.
 *
 * @param {?} metadataIndex The index of the first property metadata string for
 * this node.
 * @param {?} tData The data array for the current TView
 * @return {?} The first binding index for this binding
 */
function getFirstBindingIndex(metadataIndex, tData) {
    /** @type {?} */
    let currentBindingIndex = metadataIndex - 1;
    // If the slot before the metadata holds a string, we know that this
    // metadata applies to an interpolation with at least 2 bindings, and
    // we need to search further to access the first binding value.
    /** @type {?} */
    let currentValue = tData[currentBindingIndex];
    // We need to iterate until we hit either a:
    // - TNode (it is an element slot marking the end of `consts` section), OR a
    // - metadata string (slot is attribute metadata or a previous node's property metadata)
    while (typeof currentValue === 'string' && !isPropMetadataString(currentValue)) {
        currentValue = tData[--currentBindingIndex];
    }
    return currentBindingIndex + 1;
}
/**
 * @param {?} tNode
 * @param {?} lView
 * @param {?} tData
 * @return {?}
 */
function collectHostPropertyBindings(tNode, lView, tData) {
    /** @type {?} */
    const properties = {};
    // Host binding values for a node are stored after directives on that node
    /** @type {?} */
    let hostPropIndex = tNode.directiveEnd;
    /** @type {?} */
    let propMetadata = (/** @type {?} */ (tData[hostPropIndex]));
    // When we reach a value in TView.data that is not a string, we know we've
    // hit the next node's providers and directives and should stop copying data.
    while (typeof propMetadata === 'string') {
        /** @type {?} */
        const propertyName = propMetadata.split(INTERPOLATION_DELIMITER)[0];
        properties[propertyName] = lView[hostPropIndex];
        propMetadata = tData[++hostPropIndex];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsdUJBQXVCLEVBQWMsTUFBTSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFHNUYsT0FBTyxFQUFRLE1BQU0sRUFBUyxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDL0UsT0FBTyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSw2Q0FBNkMsQ0FBQztBQUNqRyxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNuRSxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDM0wsT0FBTyxFQUFDLHVCQUF1QixFQUFFLG9CQUFvQixFQUFFLGVBQWUsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzFHLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDaEgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7O0FBTTdDLE1BQU0sT0FBTyxrQkFBa0I7Ozs7O0lBQzdCLFlBQW1CLElBQVksRUFBUyxRQUFrQjtRQUF2QyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBVTtJ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QUFlO0lBQ3RELHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakQsQ0FBQzs7Ozs7Ozs7O0FBUUQsK0JBQXNEOzs7OztBQUt0RCxNQUFNLE9BQU8sU0FBUyxHQXBnQmhCLG9CQW9nQnlFOzs7OztBQUsvRSxNQUFNLE9BQU8sWUFBWSxHQTdlbkIsdUJBNmVrRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRWaWV3Q29tcG9uZW50fSBmcm9tICcuLi9yZW5kZXIzL2dsb2JhbF91dGlsc19hcGknO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1N0eWxpbmdJbmRleH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtMVmlldywgUEFSRU5ULCBURGF0YSwgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRQcm9wLCBnZXRWYWx1ZSwgaXNDbGFzc0Jhc2VkVmFsdWV9IGZyb20gJy4uL3JlbmRlcjMvc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlld30gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldEluamVjdGlvblRva2VucywgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0TG9jYWxSZWZzLCBpc0Jyb3dzZXJFdmVudHMsIGxvYWRMQ29udGV4dCwgbG9hZExDb250ZXh0RnJvbU5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9kaXNjb3ZlcnlfdXRpbHMnO1xuaW1wb3J0IHtJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiwgaXNQcm9wTWV0YWRhdGFTdHJpbmcsIHJlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50Vmlld30gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGlzQ29tcG9uZW50LCBpc0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RG9tTm9kZX0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4uL3ZpZXcvaW5kZXgnO1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIERlYnVnRXZlbnRMaXN0ZW5lciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyBjYWxsYmFjazogRnVuY3Rpb24pIHt9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRGVidWdFdmVudExpc3RlbmVyW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yO1xuICByZWFkb25seSBjb21wb25lbnRJbnN0YW5jZTogYW55O1xuICByZWFkb25seSBjb250ZXh0OiBhbnk7XG4gIHJlYWRvbmx5IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBwcm92aWRlclRva2VuczogYW55W107XG59XG5leHBvcnQgY2xhc3MgRGVidWdOb2RlX19QUkVfUjNfXyB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRGVidWdFdmVudExpc3RlbmVyW10gPSBbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcHJpdmF0ZSByZWFkb25seSBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IERlYnVnTm9kZXxudWxsLCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBfZGVidWdDb250ZXh0O1xuICAgIHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7XG4gICAgaWYgKHBhcmVudCAmJiBwYXJlbnQgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBwYXJlbnQuYWRkQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5pbmplY3RvcjsgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbXBvbmVudDsgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29udGV4dDsgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5yZWZlcmVuY2VzOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5wcm92aWRlclRva2VuczsgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z0VsZW1lbnQgZXh0ZW5kcyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG4gIHJlYWRvbmx5IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXTtcblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50O1xuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W107XG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdO1xuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZDtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fIGV4dGVuZHMgRGVidWdOb2RlX19QUkVfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIHJlYWRvbmx5IG5hbWUgITogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNoaWxkTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogYW55LCBfZGVidWdDb250ZXh0OiBEZWJ1Z0NvbnRleHQpIHtcbiAgICBzdXBlcihuYXRpdmVOb2RlLCBwYXJlbnQsIF9kZWJ1Z0NvbnRleHQpO1xuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZU5vZGU7XG4gIH1cblxuICBhZGRDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMucHVzaChjaGlsZCk7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBjb25zdCBjaGlsZEluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChjaGlsZEluZGV4ICE9PSAtMSkge1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlIHwgbnVsbH0pLnBhcmVudCA9IG51bGw7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKGNoaWxkSW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydENoaWxkcmVuQWZ0ZXIoY2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGRyZW46IERlYnVnTm9kZVtdKSB7XG4gICAgY29uc3Qgc2libGluZ0luZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChzaWJsaW5nSW5kZXggIT09IC0xKSB7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHNpYmxpbmdJbmRleCArIDEsIDAsIC4uLm5ld0NoaWxkcmVuKTtcbiAgICAgIG5ld0NoaWxkcmVuLmZvckVhY2goYyA9PiB7XG4gICAgICAgIGlmIChjLnBhcmVudCkge1xuICAgICAgICAgIChjLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChjKTtcbiAgICAgICAgfVxuICAgICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0QmVmb3JlKHJlZkNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkOiBEZWJ1Z05vZGUpOiB2b2lkIHtcbiAgICBjb25zdCByZWZJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKHJlZkNoaWxkKTtcbiAgICBpZiAocmVmSW5kZXggPT09IC0xKSB7XG4gICAgICB0aGlzLmFkZENoaWxkKG5ld0NoaWxkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5ld0NoaWxkLnBhcmVudCkge1xuICAgICAgICAobmV3Q2hpbGQucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcbiAgICAgIH1cbiAgICAgIChuZXdDaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHJlZkluZGV4LCAwLCBuZXdDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzXG4gICAgICAgIC5jaGlsZE5vZGVzICAvL1xuICAgICAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykgYXMgRGVidWdFbGVtZW50W107XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09IGV2ZW50TmFtZSkge1xuICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayhldmVudE9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc05hdGl2ZUVsZW1lbnRzKGRlYnVnRWxzOiBEZWJ1Z0VsZW1lbnRbXSk6IGFueSB7XG4gIHJldHVybiBkZWJ1Z0Vscy5tYXAoKGVsKSA9PiBlbC5uYXRpdmVFbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5RWxlbWVudENoaWxkcmVuKFxuICAgIGVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10pIHtcbiAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbihcbiAgICBwYXJlbnROb2RlOiBEZWJ1Z05vZGUsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdKSB7XG4gIGlmIChwYXJlbnROb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgIHBhcmVudE5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbmNsYXNzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogTm9kZTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBOb2RlKSB7IHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7IH1cblxuICBnZXQgcGFyZW50KCk6IERlYnVnRWxlbWVudHxudWxsIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm5hdGl2ZU5vZGUucGFyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgIHJldHVybiBwYXJlbnQgPyBuZXcgRGVidWdFbGVtZW50X19QT1NUX1IzX18ocGFyZW50KSA6IG51bGw7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gZ2V0SW5qZWN0b3IodGhpcy5uYXRpdmVOb2RlKTsgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZU5vZGU7XG4gICAgcmV0dXJuIG5hdGl2ZUVsZW1lbnQgJiZcbiAgICAgICAgKGdldENvbXBvbmVudChuYXRpdmVFbGVtZW50IGFzIEVsZW1lbnQpIHx8IGdldFZpZXdDb21wb25lbnQobmF0aXZlRWxlbWVudCkpO1xuICB9XG4gIGdldCBjb250ZXh0KCk6IGFueSB7IHJldHVybiBnZXRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTsgfVxuXG4gIGdldCBsaXN0ZW5lcnMoKTogRGVidWdFdmVudExpc3RlbmVyW10ge1xuICAgIHJldHVybiBnZXRMaXN0ZW5lcnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpLmZpbHRlcihpc0Jyb3dzZXJFdmVudHMpO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHsgcmV0dXJuIGdldExvY2FsUmVmcyh0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIGdldEluamVjdGlvblRva2Vucyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cbn1cblxuY2xhc3MgRGVidWdFbGVtZW50X19QT1NUX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBuYXRpdmVFbGVtZW50KCk6IEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/IHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50IDogbnVsbDtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLm5hdGl2ZUVsZW1lbnQgIS5ub2RlTmFtZTsgfVxuXG4gIC8qKlxuICAgKiAgR2V0cyBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byBwcm9wZXJ0eSB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqICBUaGlzIG1hcCBpbmNsdWRlczpcbiAgICogIC0gUmVndWxhciBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgW2lkXT1cImlkXCJgKVxuICAgKiAgLSBIb3N0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBob3N0OiB7ICdbaWRdJzogXCJpZFwiIH1gKVxuICAgKiAgLSBJbnRlcnBvbGF0ZWQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGlkPVwie3sgdmFsdWUgfX1cIilcbiAgICpcbiAgICogIEl0IGRvZXMgbm90IGluY2x1ZGU6XG4gICAqICAtIGlucHV0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbbXlDdXN0b21JbnB1dF09XCJ2YWx1ZVwiYClcbiAgICogIC0gYXR0cmlidXRlIGJpbmRpbmdzIChlLmcuIGBbYXR0ci5yb2xlXT1cIm1lbnVcImApXG4gICAqL1xuICBnZXQgcHJvcGVydGllcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlKSAhO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuXG4gICAgY29uc3QgcHJvcGVydGllcyA9IGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIGNvbnN0IGhvc3RQcm9wZXJ0aWVzID0gY29sbGVjdEhvc3RQcm9wZXJ0eUJpbmRpbmdzKHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNvbGxlY3RDbGFzc05hbWVzKHRoaXMpO1xuICAgIGNvbnN0IG91dHB1dCA9IHsuLi5wcm9wZXJ0aWVzLCAuLi5ob3N0UHJvcGVydGllc307XG5cbiAgICBpZiAoY2xhc3NOYW1lKSB7XG4gICAgICBvdXRwdXRbJ2NsYXNzTmFtZSddID0gb3V0cHV0WydjbGFzc05hbWUnXSA/IG91dHB1dFsnY2xhc3NOYW1lJ10gKyBgICR7Y2xhc3NOYW1lfWAgOiBjbGFzc05hbWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIGdldCBhdHRyaWJ1dGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30ge1xuICAgIGNvbnN0IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KGVsZW1lbnQpO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0Tm9kZUF0dHJzID0gKGxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZSkuYXR0cnM7XG4gICAgY29uc3QgbG93ZXJjYXNlVE5vZGVBdHRyczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIEZvciBkZWJ1ZyBub2RlcyB3ZSB0YWtlIHRoZSBlbGVtZW50J3MgYXR0cmlidXRlIGRpcmVjdGx5IGZyb20gdGhlIERPTSBzaW5jZSBpdCBhbGxvd3MgdXNcbiAgICAvLyB0byBhY2NvdW50IGZvciBvbmVzIHRoYXQgd2VyZW4ndCBzZXQgdmlhIGJpbmRpbmdzIChlLmcuIFZpZXdFbmdpbmUga2VlcHMgdHJhY2sgb2YgdGhlIG9uZXNcbiAgICAvLyB0aGF0IGFyZSBzZXQgdGhyb3VnaCBgUmVuZGVyZXIyYCkuIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhlIGJyb3dzZXIgd2lsbCBsb3dlcmNhc2UgYWxsIG5hbWVzLFxuICAgIC8vIGhvd2V2ZXIgc2luY2Ugd2UgaGF2ZSB0aGUgYXR0cmlidXRlcyBhbHJlYWR5IG9uIHRoZSBUTm9kZSwgd2UgY2FuIHByZXNlcnZlIHRoZSBjYXNlIGJ5IGdvaW5nXG4gICAgLy8gdGhyb3VnaCB0aGVtIG9uY2UsIGFkZGluZyB0aGVtIHRvIHRoZSBgYXR0cmlidXRlc2AgbWFwIGFuZCBwdXR0aW5nIHRoZWlyIGxvd2VyLWNhc2VkIG5hbWVcbiAgICAvLyBpbnRvIGFuIGFycmF5LiBBZnRlcndhcmRzIHdoZW4gd2UncmUgZ29pbmcgdGhyb3VnaCB0aGUgbmF0aXZlIERPTSBhdHRyaWJ1dGVzLCB3ZSBjYW4gY2hlY2tcbiAgICAvLyB3aGV0aGVyIHdlIGhhdmVuJ3QgcnVuIGludG8gYW4gYXR0cmlidXRlIGFscmVhZHkgdGhyb3VnaCB0aGUgVE5vZGUuXG4gICAgaWYgKHROb2RlQXR0cnMpIHtcbiAgICAgIGxldCBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgdE5vZGVBdHRycy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0Tm9kZUF0dHJzW2ldO1xuXG4gICAgICAgIC8vIFN0b3AgYXMgc29vbiBhcyB3ZSBoaXQgYSBtYXJrZXIuIFdlIG9ubHkgY2FyZSBhYm91dCB0aGUgcmVndWxhciBhdHRyaWJ1dGVzLiBFdmVyeXRoaW5nXG4gICAgICAgIC8vIGVsc2Ugd2lsbCBiZSBoYW5kbGVkIGJlbG93IHdoZW4gd2UgcmVhZCB0aGUgZmluYWwgYXR0cmlidXRlcyBvZmYgdGhlIERPTS5cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyTmFtZSAhPT0gJ3N0cmluZycpIGJyZWFrO1xuXG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IHROb2RlQXR0cnNbaSArIDFdO1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHJOYW1lXSA9IGF0dHJWYWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgIGxvd2VyY2FzZVROb2RlQXR0cnMucHVzaChhdHRyTmFtZS50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZUF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRyID0gZUF0dHJzW2ldO1xuICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgYXNzaWduIHRoZSBzYW1lIGF0dHJpYnV0ZSBib3RoIGluIGl0c1xuICAgICAgLy8gY2FzZS1zZW5zaXRpdmUgZm9ybSBhbmQgdGhlIGxvd2VyLWNhc2VkIG9uZSBmcm9tIHRoZSBicm93c2VyLlxuICAgICAgaWYgKGxvd2VyY2FzZVROb2RlQXR0cnMuaW5kZXhPZihhdHRyLm5hbWUpID09PSAtMSkge1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHIubmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgZ2V0IGNsYXNzZXMoKToge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSB7XG4gICAgY29uc3QgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSA9IHt9O1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGxDb250ZXh0ID0gbG9hZExDb250ZXh0RnJvbU5vZGUoZWxlbWVudCk7XG4gICAgICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0RnJvbUxWaWV3KGxDb250ZXh0Lm5vZGVJbmRleCwgbENvbnRleHQubFZpZXcpO1xuICAgICAgaWYgKHN0eWxpbmdDb250ZXh0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdDb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgICAgaWYgKGlzQ2xhc3NCYXNlZFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSkge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gZ2V0UHJvcChzdHlsaW5nQ29udGV4dCwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgY2xhc3Nlc1tjbGFzc05hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjaywganVzdCByZWFkIERPTS5cbiAgICAgICAgY29uc3QgZUNsYXNzZXMgPSBlbGVtZW50LmNsYXNzTGlzdDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQ2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNsYXNzZXNbZUNsYXNzZXNbaV1dID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xhc3NlcztcbiAgfVxuXG4gIGdldCBzdHlsZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3Qgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcobENvbnRleHQubm9kZUluZGV4LCBsQ29udGV4dC5sVmlldyk7XG4gICAgICBpZiAoc3R5bGluZ0NvbnRleHQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ0NvbnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgICBpZiAoIWlzQ2xhc3NCYXNlZFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSkge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGVOYW1lID0gZ2V0UHJvcChzdHlsaW5nQ29udGV4dCwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgc3R5bGVzW3N0eWxlTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrLCBqdXN0IHJlYWQgRE9NLlxuICAgICAgICBjb25zdCBlU3R5bGVzID0gKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVTdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gZVN0eWxlcy5pdGVtKGkpO1xuICAgICAgICAgIHN0eWxlc1tuYW1lXSA9IGVTdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3R5bGVzO1xuICB9XG5cbiAgZ2V0IGNoaWxkTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLm5hdGl2ZU5vZGUuY2hpbGROb2RlcztcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdOb2RlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoIW5hdGl2ZUVsZW1lbnQpIHJldHVybiBbXTtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gbmF0aXZlRWxlbWVudC5jaGlsZHJlbjtcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlBbGxSMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIHRydWUpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5QWxsUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCBmYWxzZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZCB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09PSBldmVudE5hbWUpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogV2FsayB0aGUgVE5vZGUgdHJlZSB0byBmaW5kIG1hdGNoZXMgZm9yIHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIHBhcmVudEVsZW1lbnQgdGhlIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgd2FsayBpcyBzdGFydGVkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSkgITtcbiAgY29uc3QgcGFyZW50VE5vZGUgPSBjb250ZXh0LmxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICBwYXJlbnRUTm9kZSwgY29udGV4dC5sVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSk7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgbWF0Y2ggdGhlIGN1cnJlbnQgVE5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLCBhbmQgZ29lcyBvbiB3aXRoIHRoZSBuZXh0IG9uZXMuXG4gKlxuICogQHBhcmFtIHROb2RlIHRoZSBjdXJyZW50IFROb2RlXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IG9mIHRoaXMgVE5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljY2F0ZSBzaG91b2xkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSxcbiAgICBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgY29uc3QgbmF0aXZlTm9kZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KTtcbiAgLy8gRm9yIGVhY2ggdHlwZSBvZiBUTm9kZSwgc3BlY2lmaWMgbG9naWMgaXMgZXhlY3V0ZWQuXG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIC8vIENhc2UgMTogdGhlIFROb2RlIGlzIGFuIGVsZW1lbnRcbiAgICAvLyBUaGUgbmF0aXZlIG5vZGUgaGFzIHRvIGJlIGNoZWNrZWQuXG4gICAgX2FkZFF1ZXJ5TWF0Y2hSMyhuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIGlmIChpc0NvbXBvbmVudCh0Tm9kZSkpIHtcbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIHRoZSBob3N0IG9mIGEgY29tcG9uZW50LCB0aGVuIGFsbCBub2RlcyBpbiBpdHMgdmlldyBoYXZlIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgIC8vIE5vdGU6IHRoZSBjb21wb25lbnQncyBjb250ZW50ICh0Tm9kZS5jaGlsZCkgd2lsbCBiZSBwcm9jZXNzZWQgZnJvbSB0aGUgaW5zZXJ0aW9uIHBvaW50cy5cbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgaWYgKGNvbXBvbmVudFZpZXcgJiYgY29tcG9uZW50Vmlld1tUVklFV10uZmlyc3RDaGlsZCkge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgICAgIGNvbXBvbmVudFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQgISwgY29tcG9uZW50VmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksXG4gICAgICAgICAgICByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgICAgLy8gT3RoZXJ3aXNlLCBpdHMgY2hpbGRyZW4gaGF2ZSB0byBiZSBwcm9jZXNzZWQuXG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0Tm9kZS5jaGlsZCwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICAgIC8vIEluIGFsbCBjYXNlcywgaWYgYSBkeW5hbWljIGNvbnRhaW5lciBleGlzdHMgZm9yIHRoaXMgbm9kZSwgZWFjaCB2aWV3IGluc2lkZSBpdCBoYXMgdG8gYmVcbiAgICAvLyBwcm9jZXNzZWQuXG4gICAgY29uc3Qgbm9kZU9yQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhcbiAgICAgICAgICBub2RlT3JDb250YWluZXIsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBDYXNlIDI6IHRoZSBUTm9kZSBpcyBhIGNvbnRhaW5lclxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIF9hZGRRdWVyeU1hdGNoUjMobENvbnRhaW5lcltOQVRJVkVdLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIC8vIEVhY2ggdmlldyBpbnNpZGUgdGhlIGNvbnRhaW5lciBoYXMgdG8gYmUgcHJvY2Vzc2VkLlxuICAgIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMobENvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgIC8vIENhc2UgMzogdGhlIFROb2RlIGlzIGEgcHJvamVjdGlvbiBpbnNlcnRpb24gcG9pbnQgKGkuZS4gYSA8bmctY29udGVudD4pLlxuICAgIC8vIFRoZSBub2RlcyBwcm9qZWN0ZWQgYXQgdGhpcyBsb2NhdGlvbiBhbGwgbmVlZCB0byBiZSBwcm9jZXNzZWQuXG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGxWaWV3ICEpO1xuICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICAgIGNvbnN0IGhlYWQ6IFROb2RlfG51bGwgPVxuICAgICAgICAoY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbdE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaGVhZCkpIHtcbiAgICAgIGZvciAobGV0IG5hdGl2ZU5vZGUgb2YgaGVhZCkge1xuICAgICAgICBfYWRkUXVlcnlNYXRjaFIzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChoZWFkKSB7XG4gICAgICBjb25zdCBuZXh0TFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gIWFzIExWaWV3O1xuICAgICAgY29uc3QgbmV4dFROb2RlID0gbmV4dExWaWV3W1RWSUVXXS5kYXRhW2hlYWQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobmV4dFROb2RlLCBuZXh0TFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgLy8gQ2FzZSA0OiB0aGUgVE5vZGUgaXMgYSB2aWV3LlxuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHROb2RlLmNoaWxkLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxuXG4gIC8vIFdlIGRvbid0IHdhbnQgdG8gZ28gdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcm9vdCBub2RlLlxuICBpZiAocm9vdE5hdGl2ZU5vZGUgIT09IG5hdGl2ZU5vZGUpIHtcbiAgICAvLyBUbyBkZXRlcm1pbmUgdGhlIG5leHQgbm9kZSB0byBiZSBwcm9jZXNzZWQsIHdlIG5lZWQgdG8gdXNlIHRoZSBuZXh0IG9yIHRoZSBwcm9qZWN0aW9uTmV4dFxuICAgIC8vIGxpbmssIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBjdXJyZW50IG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkLlxuICAgIGNvbnN0IG5leHRUTm9kZSA9ICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpID8gdE5vZGUucHJvamVjdGlvbk5leHQgOiB0Tm9kZS5uZXh0O1xuICAgIGlmIChuZXh0VE5vZGUpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKG5leHRUTm9kZSwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJvY2VzcyBhbGwgVE5vZGVzIGluIGEgZ2l2ZW4gY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRoZSBjb250YWluZXIgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2NhdGUgc2hvdW9sZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGRWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgY2hpbGRWaWV3W1RWSUVXXS5ub2RlICEsIGNoaWxkVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hdGNoIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlTm9kZSB0aGUgY3VycmVudCBuYXRpdmUgbm9kZVxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNjYXRlIHNob3VvbGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX2FkZFF1ZXJ5TWF0Y2hSMyhcbiAgICBuYXRpdmVOb2RlOiBhbnksIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4sXG4gICAgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBpZiAocm9vdE5hdGl2ZU5vZGUgIT09IG5hdGl2ZU5vZGUpIHtcbiAgICBjb25zdCBkZWJ1Z05vZGUgPSBnZXREZWJ1Z05vZGUobmF0aXZlTm9kZSk7XG4gICAgaWYgKGRlYnVnTm9kZSAmJiAoZWxlbWVudHNPbmx5ID8gZGVidWdOb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QT1NUX1IzX18gOiB0cnVlKSAmJlxuICAgICAgICBwcmVkaWNhdGUoZGVidWdOb2RlKSkge1xuICAgICAgbWF0Y2hlcy5wdXNoKGRlYnVnTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgcHJvcGVydHkgYmluZGluZ3MgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgZ2VuZXJhdGVzXG4gKiBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byB2YWx1ZXMuIFRoaXMgbWFwIG9ubHkgY29udGFpbnMgcHJvcGVydHkgYmluZGluZ3NcbiAqIGRlZmluZWQgaW4gdGVtcGxhdGVzLCBub3QgaW4gaG9zdCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gY29sbGVjdFByb3BlcnR5QmluZGluZ3MoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHREYXRhOiBURGF0YSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgY29uc3QgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbiAgbGV0IGJpbmRpbmdJbmRleCA9IGdldEZpcnN0QmluZGluZ0luZGV4KHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4LCB0RGF0YSk7XG5cbiAgd2hpbGUgKGJpbmRpbmdJbmRleCA8IHROb2RlLnByb3BlcnR5TWV0YWRhdGFFbmRJbmRleCkge1xuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIGxldCBwcm9wTWV0YWRhdGEgPSB0RGF0YVtiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICB3aGlsZSAoIWlzUHJvcE1ldGFkYXRhU3RyaW5nKHByb3BNZXRhZGF0YSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgdGhlIGZpcnN0IHZhbHVlIGZvciBhbiBpbnRlcnBvbGF0aW9uLiBXZSBuZWVkIHRvIGJ1aWxkIHVwXG4gICAgICAvLyB0aGUgZnVsbCBpbnRlcnBvbGF0aW9uIGJ5IGNvbWJpbmluZyBydW50aW1lIHZhbHVlcyBpbiBMVmlldyB3aXRoXG4gICAgICAvLyB0aGUgc3RhdGljIGludGVyc3RpdGlhbCB2YWx1ZXMgc3RvcmVkIGluIFREYXRhLlxuICAgICAgdmFsdWUgPSAodmFsdWUgfHwgJycpICsgcmVuZGVyU3RyaW5naWZ5KGxWaWV3W2JpbmRpbmdJbmRleF0pICsgdERhdGFbYmluZGluZ0luZGV4XTtcbiAgICAgIHByb3BNZXRhZGF0YSA9IHREYXRhWysrYmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gICAgfVxuICAgIHZhbHVlID0gdmFsdWUgPT09IHVuZGVmaW5lZCA/IGxWaWV3W2JpbmRpbmdJbmRleF0gOiB2YWx1ZSArPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICAgIC8vIFByb3BlcnR5IG1ldGFkYXRhIHN0cmluZyBoYXMgMyBwYXJ0czogcHJvcGVydHkgbmFtZSwgcHJlZml4LCBhbmQgc3VmZml4XG4gICAgY29uc3QgbWV0YWRhdGFQYXJ0cyA9IHByb3BNZXRhZGF0YS5zcGxpdChJTlRFUlBPTEFUSU9OX0RFTElNSVRFUik7XG4gICAgY29uc3QgcHJvcGVydHlOYW1lID0gbWV0YWRhdGFQYXJ0c1swXTtcbiAgICAvLyBBdHRyIGJpbmRpbmdzIGRvbid0IGhhdmUgcHJvcGVydHkgbmFtZXMgYW5kIHNob3VsZCBiZSBza2lwcGVkXG4gICAgaWYgKHByb3BlcnR5TmFtZSkge1xuICAgICAgLy8gV3JhcCB2YWx1ZSB3aXRoIHByZWZpeCBhbmQgc3VmZml4ICh3aWxsIGJlICcnIGZvciBub3JtYWwgYmluZGluZ3MpLCBpZiB0aGV5J3JlIGRlZmluZWQuXG4gICAgICAvLyBBdm9pZCB3cmFwcGluZyBmb3Igbm9ybWFsIGJpbmRpbmdzIHNvIHRoYXQgdGhlIHZhbHVlIGRvZXNuJ3QgZ2V0IGNhc3QgdG8gYSBzdHJpbmcuXG4gICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSAobWV0YWRhdGFQYXJ0c1sxXSAmJiBtZXRhZGF0YVBhcnRzWzJdKSA/XG4gICAgICAgICAgbWV0YWRhdGFQYXJ0c1sxXSArIHZhbHVlICsgbWV0YWRhdGFQYXJ0c1syXSA6XG4gICAgICAgICAgdmFsdWU7XG4gICAgfVxuICAgIGJpbmRpbmdJbmRleCsrO1xuICB9XG4gIHJldHVybiBwcm9wZXJ0aWVzO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgZmlyc3QgYmluZGluZyBpbmRleCB0aGF0IGhvbGRzIHZhbHVlcyBmb3IgdGhpcyBwcm9wZXJ0eVxuICogYmluZGluZy5cbiAqXG4gKiBGb3Igbm9ybWFsIGJpbmRpbmdzIChlLmcuIGBbaWRdPVwiaWRcImApLCB0aGUgYmluZGluZyBpbmRleCBpcyB0aGVcbiAqIHNhbWUgYXMgdGhlIG1ldGFkYXRhIGluZGV4LiBGb3IgaW50ZXJwb2xhdGlvbnMgKGUuZy4gYGlkPVwie3tpZH19LXt7bmFtZX19XCJgKSxcbiAqIHRoZXJlIGNhbiBiZSBtdWx0aXBsZSBiaW5kaW5nIHZhbHVlcywgc28gd2UgbWlnaHQgaGF2ZSB0byBsb29wIGJhY2t3YXJkc1xuICogZnJvbSB0aGUgbWV0YWRhdGEgaW5kZXggdW50aWwgd2UgZmluZCB0aGUgZmlyc3Qgb25lLlxuICpcbiAqIEBwYXJhbSBtZXRhZGF0YUluZGV4IFRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvcGVydHkgbWV0YWRhdGEgc3RyaW5nIGZvclxuICogdGhpcyBub2RlLlxuICogQHBhcmFtIHREYXRhIFRoZSBkYXRhIGFycmF5IGZvciB0aGUgY3VycmVudCBUVmlld1xuICogQHJldHVybnMgVGhlIGZpcnN0IGJpbmRpbmcgaW5kZXggZm9yIHRoaXMgYmluZGluZ1xuICovXG5mdW5jdGlvbiBnZXRGaXJzdEJpbmRpbmdJbmRleChtZXRhZGF0YUluZGV4OiBudW1iZXIsIHREYXRhOiBURGF0YSk6IG51bWJlciB7XG4gIGxldCBjdXJyZW50QmluZGluZ0luZGV4ID0gbWV0YWRhdGFJbmRleCAtIDE7XG5cbiAgLy8gSWYgdGhlIHNsb3QgYmVmb3JlIHRoZSBtZXRhZGF0YSBob2xkcyBhIHN0cmluZywgd2Uga25vdyB0aGF0IHRoaXNcbiAgLy8gbWV0YWRhdGEgYXBwbGllcyB0byBhbiBpbnRlcnBvbGF0aW9uIHdpdGggYXQgbGVhc3QgMiBiaW5kaW5ncywgYW5kXG4gIC8vIHdlIG5lZWQgdG8gc2VhcmNoIGZ1cnRoZXIgdG8gYWNjZXNzIHRoZSBmaXJzdCBiaW5kaW5nIHZhbHVlLlxuICBsZXQgY3VycmVudFZhbHVlID0gdERhdGFbY3VycmVudEJpbmRpbmdJbmRleF07XG5cbiAgLy8gV2UgbmVlZCB0byBpdGVyYXRlIHVudGlsIHdlIGhpdCBlaXRoZXIgYTpcbiAgLy8gLSBUTm9kZSAoaXQgaXMgYW4gZWxlbWVudCBzbG90IG1hcmtpbmcgdGhlIGVuZCBvZiBgY29uc3RzYCBzZWN0aW9uKSwgT1IgYVxuICAvLyAtIG1ldGFkYXRhIHN0cmluZyAoc2xvdCBpcyBhdHRyaWJ1dGUgbWV0YWRhdGEgb3IgYSBwcmV2aW91cyBub2RlJ3MgcHJvcGVydHkgbWV0YWRhdGEpXG4gIHdoaWxlICh0eXBlb2YgY3VycmVudFZhbHVlID09PSAnc3RyaW5nJyAmJiAhaXNQcm9wTWV0YWRhdGFTdHJpbmcoY3VycmVudFZhbHVlKSkge1xuICAgIGN1cnJlbnRWYWx1ZSA9IHREYXRhWy0tY3VycmVudEJpbmRpbmdJbmRleF07XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRCaW5kaW5nSW5kZXggKyAxO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0SG9zdFByb3BlcnR5QmluZGluZ3MoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHREYXRhOiBURGF0YSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgY29uc3QgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcblxuICAvLyBIb3N0IGJpbmRpbmcgdmFsdWVzIGZvciBhIG5vZGUgYXJlIHN0b3JlZCBhZnRlciBkaXJlY3RpdmVzIG9uIHRoYXQgbm9kZVxuICBsZXQgaG9zdFByb3BJbmRleCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgbGV0IHByb3BNZXRhZGF0YSA9IHREYXRhW2hvc3RQcm9wSW5kZXhdIGFzIGFueTtcblxuICAvLyBXaGVuIHdlIHJlYWNoIGEgdmFsdWUgaW4gVFZpZXcuZGF0YSB0aGF0IGlzIG5vdCBhIHN0cmluZywgd2Uga25vdyB3ZSd2ZVxuICAvLyBoaXQgdGhlIG5leHQgbm9kZSdzIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhbmQgc2hvdWxkIHN0b3AgY29weWluZyBkYXRhLlxuICB3aGlsZSAodHlwZW9mIHByb3BNZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpWzBdO1xuICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IGxWaWV3W2hvc3RQcm9wSW5kZXhdO1xuICAgIHByb3BNZXRhZGF0YSA9IHREYXRhWysraG9zdFByb3BJbmRleF07XG4gIH1cbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cblxuZnVuY3Rpb24gY29sbGVjdENsYXNzTmFtZXMoZGVidWdFbGVtZW50OiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyk6IHN0cmluZyB7XG4gIGNvbnN0IGNsYXNzZXMgPSBkZWJ1Z0VsZW1lbnQuY2xhc3NlcztcbiAgbGV0IG91dHB1dCA9ICcnO1xuXG4gIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIE9iamVjdC5rZXlzKGNsYXNzZXMpKSB7XG4gICAgaWYgKGNsYXNzZXNbY2xhc3NOYW1lXSkge1xuICAgICAgb3V0cHV0ID0gb3V0cHV0ID8gb3V0cHV0ICsgYCAke2NsYXNzTmFtZX1gIDogY2xhc3NOYW1lO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuLy8gTmVlZCB0byBrZWVwIHRoZSBub2RlcyBpbiBhIGdsb2JhbCBNYXAgc28gdGhhdCBtdWx0aXBsZSBhbmd1bGFyIGFwcHMgYXJlIHN1cHBvcnRlZC5cbmNvbnN0IF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUgPSBuZXcgTWFwPGFueSwgRGVidWdOb2RlPigpO1xuXG5mdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BSRV9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgcmV0dXJuIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZ2V0KG5hdGl2ZU5vZGUpIHx8IG51bGw7XG59XG5cbmNvbnN0IE5HX0RFQlVHX1BST1BFUlRZID0gJ19fbmdfZGVidWdfXyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBFbGVtZW50KTogRGVidWdFbGVtZW50X19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogTm9kZSk6IERlYnVnTm9kZV9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IG51bGwpOiBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgaWYgKG5hdGl2ZU5vZGUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgaWYgKCEobmF0aXZlTm9kZS5oYXNPd25Qcm9wZXJ0eShOR19ERUJVR19QUk9QRVJUWSkpKSB7XG4gICAgICAobmF0aXZlTm9kZSBhcyBhbnkpW05HX0RFQlVHX1BST1BFUlRZXSA9IG5hdGl2ZU5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUgP1xuICAgICAgICAgIG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhuYXRpdmVOb2RlIGFzIEVsZW1lbnQpIDpcbiAgICAgICAgICBuZXcgRGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZSk7XG4gICAgfVxuICAgIHJldHVybiAobmF0aXZlTm9kZSBhcyBhbnkpW05HX0RFQlVHX1BST1BFUlRZXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBnZXREZWJ1Z05vZGU6IChuYXRpdmVOb2RlOiBhbnkpID0+IERlYnVnTm9kZSB8IG51bGwgPSBnZXREZWJ1Z05vZGVfX1BSRV9SM19fO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsRGVidWdOb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUudmFsdWVzKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhEZWJ1Z05vZGUobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuc2V0KG5vZGUubmF0aXZlTm9kZSwgbm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVEZWJ1Z05vZGVGcm9tSW5kZXgobm9kZTogRGVidWdOb2RlKSB7XG4gIF9uYXRpdmVOb2RlVG9EZWJ1Z05vZGUuZGVsZXRlKG5vZGUubmF0aXZlTm9kZSk7XG59XG5cbi8qKlxuICogQSBib29sZWFuLXZhbHVlZCBmdW5jdGlvbiBvdmVyIGEgdmFsdWUsIHBvc3NpYmx5IGluY2x1ZGluZyBjb250ZXh0IGluZm9ybWF0aW9uXG4gKiByZWdhcmRpbmcgdGhhdCB2YWx1ZSdzIHBvc2l0aW9uIGluIGFuIGFycmF5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcmVkaWNhdGU8VD4geyAodmFsdWU6IFQpOiBib29sZWFuOyB9XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdOb2RlOiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnTm9kZX0gPSBEZWJ1Z05vZGVfX1BSRV9SM19fO1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnRWxlbWVudDoge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z0VsZW1lbnR9ID0gRGVidWdFbGVtZW50X19QUkVfUjNfXztcbiJdfQ==