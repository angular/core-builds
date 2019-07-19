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
import { isComponent, isLContainer } from '../render3/interfaces/type_checks';
import { PARENT, TVIEW, T_HOST } from '../render3/interfaces/view';
import { getProp, getValue, isClassBasedValue } from '../render3/styling/class_and_style_bindings';
import { getStylingContextFromLView } from '../render3/styling/util';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext, loadLContextFromNode } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER, isPropMetadataString, renderStringify } from '../render3/util/misc_utils';
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
        if (elementsOnly && debugNode instanceof DebugElement__POST_R3__ && predicate(debugNode)) {
            matches.push(debugNode);
        }
        else if (!elementsOnly && ((/** @type {?} */ (predicate)))(debugNode)) {
            ((/** @type {?} */ (matches))).push(debugNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsdUJBQXVCLEVBQWMsTUFBTSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFHNUYsT0FBTyxFQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM1RSxPQUFPLEVBQVEsTUFBTSxFQUFTLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMvRSxPQUFPLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLDZDQUE2QyxDQUFDO0FBQ2pHLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ25FLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUMzTCxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsb0JBQW9CLEVBQUUsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDMUcsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDdkUsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0YsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7O0FBUTdDLE1BQU0sT0FBTyxrQkFBa0I7Ozs7O0lBQzdCLFlBQW1CLElBQVksRUFBUyxRQUFrQjtRQUF2QyxTQUFJLEdBQUosSUFB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QWtCeUU7Ozs7QUFFekYsTUFBTSxVQUFVLGdCQUFnQjtJQUM5QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsSUFBZTtJQUM1QyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNwRCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxJQUFlO0lBQ3RELHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakQsQ0FBQzs7Ozs7Ozs7O0FBUUQsK0JBQXNEOzs7OztBQUt0RCxNQUFNLE9BQU8sU0FBUyxHQW5oQmhCLG9CQW1oQnlFOzs7OztBQUsvRSxNQUFNLE9BQU8sWUFBWSxHQTFmbkIsdUJBMGZrRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRWaWV3Q29tcG9uZW50fSBmcm9tICcuLi9yZW5kZXIzL2dsb2JhbF91dGlsc19hcGknO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1N0eWxpbmdJbmRleH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtMVmlldywgUEFSRU5ULCBURGF0YSwgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRQcm9wLCBnZXRWYWx1ZSwgaXNDbGFzc0Jhc2VkVmFsdWV9IGZyb20gJy4uL3JlbmRlcjMvc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlld30gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldEluamVjdGlvblRva2VucywgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0TG9jYWxSZWZzLCBpc0Jyb3dzZXJFdmVudHMsIGxvYWRMQ29udGV4dCwgbG9hZExDb250ZXh0RnJvbU5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9kaXNjb3ZlcnlfdXRpbHMnO1xuaW1wb3J0IHtJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiwgaXNQcm9wTWV0YWRhdGFTdHJpbmcsIHJlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50Vmlld30gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGVPck51bGx9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RG9tTm9kZX0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4uL3ZpZXcvaW5kZXgnO1xuXG5cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWJ1Z0V2ZW50TGlzdGVuZXIge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7fVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGUge1xuICByZWFkb25seSBsaXN0ZW5lcnM6IERlYnVnRXZlbnRMaXN0ZW5lcltdO1xuICByZWFkb25seSBwYXJlbnQ6IERlYnVnRWxlbWVudHxudWxsO1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBhbnk7XG4gIHJlYWRvbmx5IGluamVjdG9yOiBJbmplY3RvcjtcbiAgcmVhZG9ubHkgY29tcG9uZW50SW5zdGFuY2U6IGFueTtcbiAgcmVhZG9ubHkgY29udGV4dDogYW55O1xuICByZWFkb25seSByZWZlcmVuY2VzOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgcmVhZG9ubHkgcHJvdmlkZXJUb2tlbnM6IGFueVtdO1xufVxuZXhwb3J0IGNsYXNzIERlYnVnTm9kZV9fUFJFX1IzX18ge1xuICByZWFkb25seSBsaXN0ZW5lcnM6IERlYnVnRXZlbnRMaXN0ZW5lcltdID0gW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGwgPSBudWxsO1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBhbnk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBEZWJ1Z05vZGV8bnVsbCwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgdGhpcy5fZGVidWdDb250ZXh0ID0gX2RlYnVnQ29udGV4dDtcbiAgICB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlO1xuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50IGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgcGFyZW50LmFkZENoaWxkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuaW5qZWN0b3I7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb21wb25lbnQ7IH1cblxuICBnZXQgY29udGV4dCgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbnRleHQ7IH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQucmVmZXJlbmNlczsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQucHJvdmlkZXJUb2tlbnM7IH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdFbGVtZW50IGV4dGVuZHMgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgcmVhZG9ubHkgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn07XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuICByZWFkb25seSBjaGlsZHJlbjogRGVidWdFbGVtZW50W107XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudDtcbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdO1xuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXTtcbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQ7XG59XG5leHBvcnQgY2xhc3MgRGVidWdFbGVtZW50X19QUkVfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUFJFX1IzX18gaW1wbGVtZW50cyBEZWJ1Z0VsZW1lbnQge1xuICByZWFkb25seSBuYW1lICE6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgcmVhZG9ubHkgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IGFueSwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgc3VwZXIobmF0aXZlTm9kZSwgcGFyZW50LCBfZGVidWdDb250ZXh0KTtcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSBuYXRpdmVOb2RlO1xuICB9XG5cbiAgYWRkQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGlmIChjaGlsZCkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnB1c2goY2hpbGQpO1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICB9XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgY29uc3QgY2hpbGRJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoY2hpbGRJbmRleCAhPT0gLTEpIHtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZSB8IG51bGx9KS5wYXJlbnQgPSBudWxsO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShjaGlsZEluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRDaGlsZHJlbkFmdGVyKGNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkcmVuOiBEZWJ1Z05vZGVbXSkge1xuICAgIGNvbnN0IHNpYmxpbmdJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoc2libGluZ0luZGV4ICE9PSAtMSkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShzaWJsaW5nSW5kZXggKyAxLCAwLCAuLi5uZXdDaGlsZHJlbik7XG4gICAgICBuZXdDaGlsZHJlbi5mb3JFYWNoKGMgPT4ge1xuICAgICAgICBpZiAoYy5wYXJlbnQpIHtcbiAgICAgICAgICAoYy5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQoYyk7XG4gICAgICAgIH1cbiAgICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydEJlZm9yZShyZWZDaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZDogRGVidWdOb2RlKTogdm9pZCB7XG4gICAgY29uc3QgcmVmSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihyZWZDaGlsZCk7XG4gICAgaWYgKHJlZkluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5hZGRDaGlsZChuZXdDaGlsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZXdDaGlsZC5wYXJlbnQpIHtcbiAgICAgICAgKG5ld0NoaWxkLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChuZXdDaGlsZCk7XG4gICAgICB9XG4gICAgICAobmV3Q2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShyZWZJbmRleCwgMCwgbmV3Q2hpbGQpO1xuICAgIH1cbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlFbGVtZW50Q2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgICAuY2hpbGROb2RlcyAgLy9cbiAgICAgICAgLmZpbHRlcigobm9kZSkgPT4gbm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIGFzIERlYnVnRWxlbWVudFtdO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBpZiAobGlzdGVuZXIubmFtZSA9PSBldmVudE5hbWUpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNOYXRpdmVFbGVtZW50cyhkZWJ1Z0VsczogRGVidWdFbGVtZW50W10pOiBhbnkge1xuICByZXR1cm4gZGVidWdFbHMubWFwKChlbCkgPT4gZWwubmF0aXZlRWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihcbiAgICBlbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4sIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdKSB7XG4gIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBfcXVlcnlFbGVtZW50Q2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW4oXG4gICAgcGFyZW50Tm9kZTogRGVidWdOb2RlLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSkge1xuICBpZiAocGFyZW50Tm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICBwYXJlbnROb2RlLmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5jbGFzcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IE5vZGU7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogTm9kZSkgeyB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlOyB9XG5cbiAgZ2V0IHBhcmVudCgpOiBEZWJ1Z0VsZW1lbnR8bnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5uYXRpdmVOb2RlLnBhcmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICByZXR1cm4gcGFyZW50ID8gbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKHBhcmVudCkgOiBudWxsO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGdldEluamVjdG9yKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVOb2RlO1xuICAgIHJldHVybiBuYXRpdmVFbGVtZW50ICYmXG4gICAgICAgIChnZXRDb21wb25lbnQobmF0aXZlRWxlbWVudCBhcyBFbGVtZW50KSB8fCBnZXRWaWV3Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQpKTtcbiAgfVxuICBnZXQgY29udGV4dCgpOiBhbnkge1xuICAgIHJldHVybiBnZXRDb21wb25lbnQodGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpIHx8IGdldENvbnRleHQodGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpO1xuICB9XG5cbiAgZ2V0IGxpc3RlbmVycygpOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXSB7XG4gICAgcmV0dXJuIGdldExpc3RlbmVycyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCkuZmlsdGVyKGlzQnJvd3NlckV2ZW50cyk7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55O30geyByZXR1cm4gZ2V0TG9jYWxSZWZzKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gZ2V0SW5qZWN0aW9uVG9rZW5zKHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTsgfVxufVxuXG5jbGFzcyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogRWxlbWVudCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKG5hdGl2ZU5vZGUpO1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUpO1xuICB9XG5cbiAgZ2V0IG5hdGl2ZUVsZW1lbnQoKTogRWxlbWVudHxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID8gdGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQgOiBudWxsO1xuICB9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMubmF0aXZlRWxlbWVudCAhLm5vZGVOYW1lOyB9XG5cbiAgLyoqXG4gICAqICBHZXRzIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHByb3BlcnR5IHZhbHVlcyBmb3IgYW4gZWxlbWVudC5cbiAgICpcbiAgICogIFRoaXMgbWFwIGluY2x1ZGVzOlxuICAgKiAgLSBSZWd1bGFyIHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbaWRdPVwiaWRcImApXG4gICAqICAtIEhvc3QgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGhvc3Q6IHsgJ1tpZF0nOiBcImlkXCIgfWApXG4gICAqICAtIEludGVycG9sYXRlZCBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgaWQ9XCJ7eyB2YWx1ZSB9fVwiKVxuICAgKlxuICAgKiAgSXQgZG9lcyBub3QgaW5jbHVkZTpcbiAgICogIC0gaW5wdXQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYFtteUN1c3RvbUlucHV0XT1cInZhbHVlXCJgKVxuICAgKiAgLSBhdHRyaWJ1dGUgYmluZGluZ3MgKGUuZy4gYFthdHRyLnJvbGVdPVwibWVudVwiYClcbiAgICovXG4gIGdldCBwcm9wZXJ0aWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7XG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0aGlzLm5hdGl2ZU5vZGUpICE7XG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG5cbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gY29sbGVjdFByb3BlcnR5QmluZGluZ3ModE5vZGUsIGxWaWV3LCB0RGF0YSk7XG4gICAgY29uc3QgaG9zdFByb3BlcnRpZXMgPSBjb2xsZWN0SG9zdFByb3BlcnR5QmluZGluZ3ModE5vZGUsIGxWaWV3LCB0RGF0YSk7XG4gICAgY29uc3QgY2xhc3NOYW1lID0gY29sbGVjdENsYXNzTmFtZXModGhpcyk7XG4gICAgY29uc3Qgb3V0cHV0ID0gey4uLnByb3BlcnRpZXMsIC4uLmhvc3RQcm9wZXJ0aWVzfTtcblxuICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgIG91dHB1dFsnY2xhc3NOYW1lJ10gPSBvdXRwdXRbJ2NsYXNzTmFtZSddID8gb3V0cHV0WydjbGFzc05hbWUnXSArIGAgJHtjbGFzc05hbWV9YCA6IGNsYXNzTmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgZ2V0IGF0dHJpYnV0ZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3QgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSA9IHt9O1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQoZWxlbWVudCk7XG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgIGNvbnN0IHROb2RlQXR0cnMgPSAobFZpZXdbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlKS5hdHRycztcbiAgICBjb25zdCBsb3dlcmNhc2VUTm9kZUF0dHJzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8gRm9yIGRlYnVnIG5vZGVzIHdlIHRha2UgdGhlIGVsZW1lbnQncyBhdHRyaWJ1dGUgZGlyZWN0bHkgZnJvbSB0aGUgRE9NIHNpbmNlIGl0IGFsbG93cyB1c1xuICAgIC8vIHRvIGFjY291bnQgZm9yIG9uZXMgdGhhdCB3ZXJlbid0IHNldCB2aWEgYmluZGluZ3MgKGUuZy4gVmlld0VuZ2luZSBrZWVwcyB0cmFjayBvZiB0aGUgb25lc1xuICAgIC8vIHRoYXQgYXJlIHNldCB0aHJvdWdoIGBSZW5kZXJlcjJgKS4gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGUgYnJvd3NlciB3aWxsIGxvd2VyY2FzZSBhbGwgbmFtZXMsXG4gICAgLy8gaG93ZXZlciBzaW5jZSB3ZSBoYXZlIHRoZSBhdHRyaWJ1dGVzIGFscmVhZHkgb24gdGhlIFROb2RlLCB3ZSBjYW4gcHJlc2VydmUgdGhlIGNhc2UgYnkgZ29pbmdcbiAgICAvLyB0aHJvdWdoIHRoZW0gb25jZSwgYWRkaW5nIHRoZW0gdG8gdGhlIGBhdHRyaWJ1dGVzYCBtYXAgYW5kIHB1dHRpbmcgdGhlaXIgbG93ZXItY2FzZWQgbmFtZVxuICAgIC8vIGludG8gYW4gYXJyYXkuIEFmdGVyd2FyZHMgd2hlbiB3ZSdyZSBnb2luZyB0aHJvdWdoIHRoZSBuYXRpdmUgRE9NIGF0dHJpYnV0ZXMsIHdlIGNhbiBjaGVja1xuICAgIC8vIHdoZXRoZXIgd2UgaGF2ZW4ndCBydW4gaW50byBhbiBhdHRyaWJ1dGUgYWxyZWFkeSB0aHJvdWdoIHRoZSBUTm9kZS5cbiAgICBpZiAodE5vZGVBdHRycykge1xuICAgICAgbGV0IGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCB0Tm9kZUF0dHJzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHROb2RlQXR0cnNbaV07XG5cbiAgICAgICAgLy8gU3RvcCBhcyBzb29uIGFzIHdlIGhpdCBhIG1hcmtlci4gV2Ugb25seSBjYXJlIGFib3V0IHRoZSByZWd1bGFyIGF0dHJpYnV0ZXMuIEV2ZXJ5dGhpbmdcbiAgICAgICAgLy8gZWxzZSB3aWxsIGJlIGhhbmRsZWQgYmVsb3cgd2hlbiB3ZSByZWFkIHRoZSBmaW5hbCBhdHRyaWJ1dGVzIG9mZiB0aGUgRE9NLlxuICAgICAgICBpZiAodHlwZW9mIGF0dHJOYW1lICE9PSAnc3RyaW5nJykgYnJlYWs7XG5cbiAgICAgICAgY29uc3QgYXR0clZhbHVlID0gdE5vZGVBdHRyc1tpICsgMV07XG4gICAgICAgIGF0dHJpYnV0ZXNbYXR0ck5hbWVdID0gYXR0clZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgbG93ZXJjYXNlVE5vZGVBdHRycy5wdXNoKGF0dHJOYW1lLnRvTG93ZXJDYXNlKCkpO1xuXG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBlQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHIgPSBlQXR0cnNbaV07XG4gICAgICAvLyBNYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBhc3NpZ24gdGhlIHNhbWUgYXR0cmlidXRlIGJvdGggaW4gaXRzXG4gICAgICAvLyBjYXNlLXNlbnNpdGl2ZSBmb3JtIGFuZCB0aGUgbG93ZXItY2FzZWQgb25lIGZyb20gdGhlIGJyb3dzZXIuXG4gICAgICBpZiAobG93ZXJjYXNlVE5vZGVBdHRycy5pbmRleE9mKGF0dHIubmFtZSkgPT09IC0xKSB7XG4gICAgICAgIGF0dHJpYnV0ZXNbYXR0ci5uYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gIH1cblxuICBnZXQgY2xhc3NlcygpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9IHtcbiAgICBjb25zdCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcobENvbnRleHQubm9kZUluZGV4LCBsQ29udGV4dC5sVmlldyk7XG4gICAgICBpZiAoc3R5bGluZ0NvbnRleHQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ0NvbnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgICBpZiAoaXNDbGFzc0Jhc2VkVmFsdWUoc3R5bGluZ0NvbnRleHQsIGkpKSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc05hbWUgPSBnZXRQcm9wKHN0eWxpbmdDb250ZXh0LCBpKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoc3R5bGluZ0NvbnRleHQsIGkpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgLy8gd2Ugd2FudCB0byBpZ25vcmUgYG51bGxgIHNpbmNlIHRob3NlIGRvbid0IG92ZXJ3cml0ZSB0aGUgdmFsdWVzLlxuICAgICAgICAgICAgICBjbGFzc2VzW2NsYXNzTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrLCBqdXN0IHJlYWQgRE9NLlxuICAgICAgICBjb25zdCBlQ2xhc3NlcyA9IGVsZW1lbnQuY2xhc3NMaXN0O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY2xhc3Nlc1tlQ2xhc3Nlc1tpXV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbGFzc2VzO1xuICB9XG5cbiAgZ2V0IHN0eWxlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICBjb25zdCBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBjb25zdCBsQ29udGV4dCA9IGxvYWRMQ29udGV4dEZyb21Ob2RlKGVsZW1lbnQpO1xuICAgICAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlldyhsQ29udGV4dC5ub2RlSW5kZXgsIGxDb250ZXh0LmxWaWV3KTtcbiAgICAgIGlmIChzdHlsaW5nQ29udGV4dCkge1xuICAgICAgICBmb3IgKGxldCBpID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247IGkgPCBzdHlsaW5nQ29udGV4dC5sZW5ndGg7XG4gICAgICAgICAgICAgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgICAgICAgIGlmICghaXNDbGFzc0Jhc2VkVmFsdWUoc3R5bGluZ0NvbnRleHQsIGkpKSB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZU5hbWUgPSBnZXRQcm9wKHN0eWxpbmdDb250ZXh0LCBpKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoc3R5bGluZ0NvbnRleHQsIGkpIGFzIHN0cmluZyB8IG51bGw7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgLy8gd2Ugd2FudCB0byBpZ25vcmUgYG51bGxgIHNpbmNlIHRob3NlIGRvbid0IG92ZXJ3cml0ZSB0aGUgdmFsdWVzLlxuICAgICAgICAgICAgICBzdHlsZXNbc3R5bGVOYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmFsbGJhY2ssIGp1c3QgcmVhZCBET00uXG4gICAgICAgIGNvbnN0IGVTdHlsZXMgPSAoZWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGU7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZVN0eWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBlU3R5bGVzLml0ZW0oaSk7XG4gICAgICAgICAgc3R5bGVzW25hbWVdID0gZVN0eWxlcy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZXM7XG4gIH1cblxuICBnZXQgY2hpbGROb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IHRoaXMubmF0aXZlTm9kZS5jaGlsZE5vZGVzO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZV9fUE9TVF9SM19fKGVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuICAgIGlmICghbmF0aXZlRWxlbWVudCkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBuYXRpdmVFbGVtZW50LmNoaWxkcmVuO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZV9fUE9TVF9SM19fKGVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeUFsbFIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgdHJ1ZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlBbGxSMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGZhbHNlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT09IGV2ZW50TmFtZSkge1xuICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayhldmVudE9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBXYWxrIHRoZSBUTm9kZSB0cmVlIHRvIGZpbmQgbWF0Y2hlcyBmb3IgdGhlIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50RWxlbWVudCB0aGUgZWxlbWVudCBmcm9tIHdoaWNoIHRoZSB3YWxrIGlzIHN0YXJ0ZWRcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeUFsbFIzKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10sXG4gICAgZWxlbWVudHNPbmx5OiB0cnVlKTogdm9pZDtcbmZ1bmN0aW9uIF9xdWVyeUFsbFIzKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10sXG4gICAgZWxlbWVudHNPbmx5OiBmYWxzZSk6IHZvaWQ7XG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSkgITtcbiAgY29uc3QgcGFyZW50VE5vZGUgPSBjb250ZXh0LmxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICBwYXJlbnRUTm9kZSwgY29udGV4dC5sVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSk7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgbWF0Y2ggdGhlIGN1cnJlbnQgVE5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLCBhbmQgZ29lcyBvbiB3aXRoIHRoZSBuZXh0IG9uZXMuXG4gKlxuICogQHBhcmFtIHROb2RlIHRoZSBjdXJyZW50IFROb2RlXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IG9mIHRoaXMgVE5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGNvbnN0IG5hdGl2ZU5vZGUgPSBnZXROYXRpdmVCeVROb2RlT3JOdWxsKHROb2RlLCBsVmlldyk7XG4gIC8vIEZvciBlYWNoIHR5cGUgb2YgVE5vZGUsIHNwZWNpZmljIGxvZ2ljIGlzIGV4ZWN1dGVkLlxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAvLyBDYXNlIDE6IHRoZSBUTm9kZSBpcyBhbiBlbGVtZW50XG4gICAgLy8gVGhlIG5hdGl2ZSBub2RlIGhhcyB0byBiZSBjaGVja2VkLlxuICAgIF9hZGRRdWVyeU1hdGNoUjMobmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICBpZiAoaXNDb21wb25lbnQodE5vZGUpKSB7XG4gICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyB0aGUgaG9zdCBvZiBhIGNvbXBvbmVudCwgdGhlbiBhbGwgbm9kZXMgaW4gaXRzIHZpZXcgaGF2ZSB0byBiZSBwcm9jZXNzZWQuXG4gICAgICAvLyBOb3RlOiB0aGUgY29tcG9uZW50J3MgY29udGVudCAodE5vZGUuY2hpbGQpIHdpbGwgYmUgcHJvY2Vzc2VkIGZyb20gdGhlIGluc2VydGlvbiBwb2ludHMuXG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIGlmIChjb21wb25lbnRWaWV3ICYmIGNvbXBvbmVudFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICAgICAgICBjb21wb25lbnRWaWV3W1RWSUVXXS5maXJzdENoaWxkICEsIGNvbXBvbmVudFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LFxuICAgICAgICAgICAgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICAgIC8vIE90aGVyd2lzZSwgaXRzIGNoaWxkcmVuIGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModE5vZGUuY2hpbGQsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgICAvLyBJbiBhbGwgY2FzZXMsIGlmIGEgZHluYW1pYyBjb250YWluZXIgZXhpc3RzIGZvciB0aGlzIG5vZGUsIGVhY2ggdmlldyBpbnNpZGUgaXQgaGFzIHRvIGJlXG4gICAgLy8gcHJvY2Vzc2VkLlxuICAgIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMoXG4gICAgICAgICAgbm9kZU9yQ29udGFpbmVyLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gQ2FzZSAyOiB0aGUgVE5vZGUgaXMgYSBjb250YWluZXJcbiAgICAvLyBUaGUgbmF0aXZlIG5vZGUgaGFzIHRvIGJlIGNoZWNrZWQuXG4gICAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBfYWRkUXVlcnlNYXRjaFIzKGxDb250YWluZXJbTkFUSVZFXSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAvLyBFYWNoIHZpZXcgaW5zaWRlIHRoZSBjb250YWluZXIgaGFzIHRvIGJlIHByb2Nlc3NlZC5cbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKGxDb250YWluZXIsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAvLyBDYXNlIDM6IHRoZSBUTm9kZSBpcyBhIHByb2plY3Rpb24gaW5zZXJ0aW9uIHBvaW50IChpLmUuIGEgPG5nLWNvbnRlbnQ+KS5cbiAgICAvLyBUaGUgbm9kZXMgcHJvamVjdGVkIGF0IHRoaXMgbG9jYXRpb24gYWxsIG5lZWQgdG8gYmUgcHJvY2Vzc2VkLlxuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhsVmlldyAhKTtcbiAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICBjb25zdCBoZWFkOiBUTm9kZXxudWxsID1cbiAgICAgICAgKGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGhlYWQpKSB7XG4gICAgICBmb3IgKGxldCBuYXRpdmVOb2RlIG9mIGhlYWQpIHtcbiAgICAgICAgX2FkZFF1ZXJ5TWF0Y2hSMyhuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaGVhZCkge1xuICAgICAgY29uc3QgbmV4dExWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICFhcyBMVmlldztcbiAgICAgIGNvbnN0IG5leHRUTm9kZSA9IG5leHRMVmlld1tUVklFV10uZGF0YVtoZWFkLmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKG5leHRUTm9kZSwgbmV4dExWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIC8vIENhc2UgNDogdGhlIFROb2RlIGlzIGEgdmlldy5cbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0Tm9kZS5jaGlsZCwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gIH1cblxuICAvLyBXZSBkb24ndCB3YW50IHRvIGdvIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHJvb3Qgbm9kZS5cbiAgaWYgKHJvb3ROYXRpdmVOb2RlICE9PSBuYXRpdmVOb2RlKSB7XG4gICAgLy8gVG8gZGV0ZXJtaW5lIHRoZSBuZXh0IG5vZGUgdG8gYmUgcHJvY2Vzc2VkLCB3ZSBuZWVkIHRvIHVzZSB0aGUgbmV4dCBvciB0aGUgcHJvamVjdGlvbk5leHRcbiAgICAvLyBsaW5rLCBkZXBlbmRpbmcgb24gd2hldGhlciB0aGUgY3VycmVudCBub2RlIGhhcyBiZWVuIHByb2plY3RlZC5cbiAgICBjb25zdCBuZXh0VE5vZGUgPSAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSA/IHROb2RlLnByb2plY3Rpb25OZXh0IDogdE5vZGUubmV4dDtcbiAgICBpZiAobmV4dFROb2RlKSB7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhuZXh0VE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3MgYWxsIFROb2RlcyBpbiBhIGdpdmVuIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0aGUgY29udGFpbmVyIHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZFZpZXcgPSBsQ29udGFpbmVyW2ldO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgICBjaGlsZFZpZXdbVFZJRVddLm5vZGUgISwgY2hpbGRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2ggdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLlxuICpcbiAqIEBwYXJhbSBuYXRpdmVOb2RlIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2F0ZSBzaG91bGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX2FkZFF1ZXJ5TWF0Y2hSMyhcbiAgICBuYXRpdmVOb2RlOiBhbnksIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBpZiAocm9vdE5hdGl2ZU5vZGUgIT09IG5hdGl2ZU5vZGUpIHtcbiAgICBjb25zdCBkZWJ1Z05vZGUgPSBnZXREZWJ1Z05vZGUobmF0aXZlTm9kZSk7XG4gICAgaWYgKCFkZWJ1Z05vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVHlwZSBvZiB0aGUgXCJwcmVkaWNhdGUgYW5kIFwibWF0Y2hlc1wiIGFycmF5IGFyZSBzZXQgYmFzZWQgb24gdGhlIHZhbHVlIG9mXG4gICAgLy8gdGhlIFwiZWxlbWVudHNPbmx5XCIgcGFyYW1ldGVyLiBUeXBlU2NyaXB0IGlzIG5vdCBhYmxlIHRvIHByb3Blcmx5IGluZmVyIHRoZXNlXG4gICAgLy8gdHlwZXMgd2l0aCBnZW5lcmljcywgc28gd2UgbWFudWFsbHkgY2FzdCB0aGUgcGFyYW1ldGVycyBhY2NvcmRpbmdseS5cbiAgICBpZiAoZWxlbWVudHNPbmx5ICYmIGRlYnVnTm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fICYmIHByZWRpY2F0ZShkZWJ1Z05vZGUpKSB7XG4gICAgICBtYXRjaGVzLnB1c2goZGVidWdOb2RlKTtcbiAgICB9IGVsc2UgaWYgKCFlbGVtZW50c09ubHkgJiYgKHByZWRpY2F0ZSBhcyBQcmVkaWNhdGU8RGVidWdOb2RlPikoZGVidWdOb2RlKSkge1xuICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLnB1c2goZGVidWdOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBwcm9wZXJ0eSBiaW5kaW5ncyBmb3IgYSBnaXZlbiBub2RlIGFuZCBnZW5lcmF0ZXNcbiAqIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHZhbHVlcy4gVGhpcyBtYXAgb25seSBjb250YWlucyBwcm9wZXJ0eSBiaW5kaW5nc1xuICogZGVmaW5lZCBpbiB0ZW1wbGF0ZXMsIG5vdCBpbiBob3N0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UHJvcGVydHlCaW5kaW5ncyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBsZXQgYmluZGluZ0luZGV4ID0gZ2V0Rmlyc3RCaW5kaW5nSW5kZXgodE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXgsIHREYXRhKTtcblxuICB3aGlsZSAoYmluZGluZ0luZGV4IDwgdE5vZGUucHJvcGVydHlNZXRhZGF0YUVuZEluZGV4KSB7XG4gICAgbGV0IHZhbHVlOiBhbnk7XG4gICAgbGV0IHByb3BNZXRhZGF0YSA9IHREYXRhW2JpbmRpbmdJbmRleF0gYXMgc3RyaW5nO1xuICAgIHdoaWxlICghaXNQcm9wTWV0YWRhdGFTdHJpbmcocHJvcE1ldGFkYXRhKSkge1xuICAgICAgLy8gVGhpcyBpcyB0aGUgZmlyc3QgdmFsdWUgZm9yIGFuIGludGVycG9sYXRpb24uIFdlIG5lZWQgdG8gYnVpbGQgdXBcbiAgICAgIC8vIHRoZSBmdWxsIGludGVycG9sYXRpb24gYnkgY29tYmluaW5nIHJ1bnRpbWUgdmFsdWVzIGluIExWaWV3IHdpdGhcbiAgICAgIC8vIHRoZSBzdGF0aWMgaW50ZXJzdGl0aWFsIHZhbHVlcyBzdG9yZWQgaW4gVERhdGEuXG4gICAgICB2YWx1ZSA9ICh2YWx1ZSB8fCAnJykgKyByZW5kZXJTdHJpbmdpZnkobFZpZXdbYmluZGluZ0luZGV4XSkgKyB0RGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgcHJvcE1ldGFkYXRhID0gdERhdGFbKytiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICB9XG4gICAgdmFsdWUgPSB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gbFZpZXdbYmluZGluZ0luZGV4XSA6IHZhbHVlICs9IGxWaWV3W2JpbmRpbmdJbmRleF07XG4gICAgLy8gUHJvcGVydHkgbWV0YWRhdGEgc3RyaW5nIGhhcyAzIHBhcnRzOiBwcm9wZXJ0eSBuYW1lLCBwcmVmaXgsIGFuZCBzdWZmaXhcbiAgICBjb25zdCBtZXRhZGF0YVBhcnRzID0gcHJvcE1ldGFkYXRhLnNwbGl0KElOVEVSUE9MQVRJT05fREVMSU1JVEVSKTtcbiAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSBtZXRhZGF0YVBhcnRzWzBdO1xuICAgIC8vIEF0dHIgYmluZGluZ3MgZG9uJ3QgaGF2ZSBwcm9wZXJ0eSBuYW1lcyBhbmQgc2hvdWxkIGJlIHNraXBwZWRcbiAgICBpZiAocHJvcGVydHlOYW1lKSB7XG4gICAgICAvLyBXcmFwIHZhbHVlIHdpdGggcHJlZml4IGFuZCBzdWZmaXggKHdpbGwgYmUgJycgZm9yIG5vcm1hbCBiaW5kaW5ncyksIGlmIHRoZXkncmUgZGVmaW5lZC5cbiAgICAgIC8vIEF2b2lkIHdyYXBwaW5nIGZvciBub3JtYWwgYmluZGluZ3Mgc28gdGhhdCB0aGUgdmFsdWUgZG9lc24ndCBnZXQgY2FzdCB0byBhIHN0cmluZy5cbiAgICAgIHByb3BlcnRpZXNbcHJvcGVydHlOYW1lXSA9IChtZXRhZGF0YVBhcnRzWzFdICYmIG1ldGFkYXRhUGFydHNbMl0pID9cbiAgICAgICAgICBtZXRhZGF0YVBhcnRzWzFdICsgdmFsdWUgKyBtZXRhZGF0YVBhcnRzWzJdIDpcbiAgICAgICAgICB2YWx1ZTtcbiAgICB9XG4gICAgYmluZGluZ0luZGV4Kys7XG4gIH1cbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBmaXJzdCBiaW5kaW5nIGluZGV4IHRoYXQgaG9sZHMgdmFsdWVzIGZvciB0aGlzIHByb3BlcnR5XG4gKiBiaW5kaW5nLlxuICpcbiAqIEZvciBub3JtYWwgYmluZGluZ3MgKGUuZy4gYFtpZF09XCJpZFwiYCksIHRoZSBiaW5kaW5nIGluZGV4IGlzIHRoZVxuICogc2FtZSBhcyB0aGUgbWV0YWRhdGEgaW5kZXguIEZvciBpbnRlcnBvbGF0aW9ucyAoZS5nLiBgaWQ9XCJ7e2lkfX0te3tuYW1lfX1cImApLFxuICogdGhlcmUgY2FuIGJlIG11bHRpcGxlIGJpbmRpbmcgdmFsdWVzLCBzbyB3ZSBtaWdodCBoYXZlIHRvIGxvb3AgYmFja3dhcmRzXG4gKiBmcm9tIHRoZSBtZXRhZGF0YSBpbmRleCB1bnRpbCB3ZSBmaW5kIHRoZSBmaXJzdCBvbmUuXG4gKlxuICogQHBhcmFtIG1ldGFkYXRhSW5kZXggVGhlIGluZGV4IG9mIHRoZSBmaXJzdCBwcm9wZXJ0eSBtZXRhZGF0YSBzdHJpbmcgZm9yXG4gKiB0aGlzIG5vZGUuXG4gKiBAcGFyYW0gdERhdGEgVGhlIGRhdGEgYXJyYXkgZm9yIHRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcmV0dXJucyBUaGUgZmlyc3QgYmluZGluZyBpbmRleCBmb3IgdGhpcyBiaW5kaW5nXG4gKi9cbmZ1bmN0aW9uIGdldEZpcnN0QmluZGluZ0luZGV4KG1ldGFkYXRhSW5kZXg6IG51bWJlciwgdERhdGE6IFREYXRhKTogbnVtYmVyIHtcbiAgbGV0IGN1cnJlbnRCaW5kaW5nSW5kZXggPSBtZXRhZGF0YUluZGV4IC0gMTtcblxuICAvLyBJZiB0aGUgc2xvdCBiZWZvcmUgdGhlIG1ldGFkYXRhIGhvbGRzIGEgc3RyaW5nLCB3ZSBrbm93IHRoYXQgdGhpc1xuICAvLyBtZXRhZGF0YSBhcHBsaWVzIHRvIGFuIGludGVycG9sYXRpb24gd2l0aCBhdCBsZWFzdCAyIGJpbmRpbmdzLCBhbmRcbiAgLy8gd2UgbmVlZCB0byBzZWFyY2ggZnVydGhlciB0byBhY2Nlc3MgdGhlIGZpcnN0IGJpbmRpbmcgdmFsdWUuXG4gIGxldCBjdXJyZW50VmFsdWUgPSB0RGF0YVtjdXJyZW50QmluZGluZ0luZGV4XTtcblxuICAvLyBXZSBuZWVkIHRvIGl0ZXJhdGUgdW50aWwgd2UgaGl0IGVpdGhlciBhOlxuICAvLyAtIFROb2RlIChpdCBpcyBhbiBlbGVtZW50IHNsb3QgbWFya2luZyB0aGUgZW5kIG9mIGBjb25zdHNgIHNlY3Rpb24pLCBPUiBhXG4gIC8vIC0gbWV0YWRhdGEgc3RyaW5nIChzbG90IGlzIGF0dHJpYnV0ZSBtZXRhZGF0YSBvciBhIHByZXZpb3VzIG5vZGUncyBwcm9wZXJ0eSBtZXRhZGF0YSlcbiAgd2hpbGUgKHR5cGVvZiBjdXJyZW50VmFsdWUgPT09ICdzdHJpbmcnICYmICFpc1Byb3BNZXRhZGF0YVN0cmluZyhjdXJyZW50VmFsdWUpKSB7XG4gICAgY3VycmVudFZhbHVlID0gdERhdGFbLS1jdXJyZW50QmluZGluZ0luZGV4XTtcbiAgfVxuICByZXR1cm4gY3VycmVudEJpbmRpbmdJbmRleCArIDE7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RIb3N0UHJvcGVydHlCaW5kaW5ncyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4gIC8vIEhvc3QgYmluZGluZyB2YWx1ZXMgZm9yIGEgbm9kZSBhcmUgc3RvcmVkIGFmdGVyIGRpcmVjdGl2ZXMgb24gdGhhdCBub2RlXG4gIGxldCBob3N0UHJvcEluZGV4ID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBsZXQgcHJvcE1ldGFkYXRhID0gdERhdGFbaG9zdFByb3BJbmRleF0gYXMgYW55O1xuXG4gIC8vIFdoZW4gd2UgcmVhY2ggYSB2YWx1ZSBpbiBUVmlldy5kYXRhIHRoYXQgaXMgbm90IGEgc3RyaW5nLCB3ZSBrbm93IHdlJ3ZlXG4gIC8vIGhpdCB0aGUgbmV4dCBub2RlJ3MgcHJvdmlkZXJzIGFuZCBkaXJlY3RpdmVzIGFuZCBzaG91bGQgc3RvcCBjb3B5aW5nIGRhdGEuXG4gIHdoaWxlICh0eXBlb2YgcHJvcE1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHByb3BNZXRhZGF0YS5zcGxpdChJTlRFUlBPTEFUSU9OX0RFTElNSVRFUilbMF07XG4gICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gbFZpZXdbaG9zdFByb3BJbmRleF07XG4gICAgcHJvcE1ldGFkYXRhID0gdERhdGFbKytob3N0UHJvcEluZGV4XTtcbiAgfVxuICByZXR1cm4gcHJvcGVydGllcztcbn1cblxuXG5mdW5jdGlvbiBjb2xsZWN0Q2xhc3NOYW1lcyhkZWJ1Z0VsZW1lbnQ6IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKTogc3RyaW5nIHtcbiAgY29uc3QgY2xhc3NlcyA9IGRlYnVnRWxlbWVudC5jbGFzc2VzO1xuICBsZXQgb3V0cHV0ID0gJyc7XG5cbiAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgT2JqZWN0LmtleXMoY2xhc3NlcykpIHtcbiAgICBpZiAoY2xhc3Nlc1tjbGFzc05hbWVdKSB7XG4gICAgICBvdXRwdXQgPSBvdXRwdXQgPyBvdXRwdXQgKyBgICR7Y2xhc3NOYW1lfWAgOiBjbGFzc05hbWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG4vLyBOZWVkIHRvIGtlZXAgdGhlIG5vZGVzIGluIGEgZ2xvYmFsIE1hcCBzbyB0aGF0IG11bHRpcGxlIGFuZ3VsYXIgYXBwcyBhcmUgc3VwcG9ydGVkLlxuY29uc3QgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZSA9IG5ldyBNYXA8YW55LCBEZWJ1Z05vZGU+KCk7XG5cbmZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUFJFX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICByZXR1cm4gX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5nZXQobmF0aXZlTm9kZSkgfHwgbnVsbDtcbn1cblxuY29uc3QgTkdfREVCVUdfUFJPUEVSVFkgPSAnX19uZ19kZWJ1Z19fJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IEVsZW1lbnQpOiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBOb2RlKTogRGVidWdOb2RlX19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogbnVsbCk6IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICBpZiAobmF0aXZlTm9kZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICBpZiAoIShuYXRpdmVOb2RlLmhhc093blByb3BlcnR5KE5HX0RFQlVHX1BST1BFUlRZKSkpIHtcbiAgICAgIChuYXRpdmVOb2RlIGFzIGFueSlbTkdfREVCVUdfUFJPUEVSVFldID0gbmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/XG4gICAgICAgICAgbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKG5hdGl2ZU5vZGUgYXMgRWxlbWVudCkgOlxuICAgICAgICAgIG5ldyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIChuYXRpdmVOb2RlIGFzIGFueSlbTkdfREVCVUdfUFJPUEVSVFldO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGdldERlYnVnTm9kZTogKG5hdGl2ZU5vZGU6IGFueSkgPT4gRGVidWdOb2RlIHwgbnVsbCA9IGdldERlYnVnTm9kZV9fUFJFX1IzX187XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxEZWJ1Z05vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS52YWx1ZXMoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleERlYnVnTm9kZShub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5zZXQobm9kZS5uYXRpdmVOb2RlLCBub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5kZWxldGUobm9kZS5uYXRpdmVOb2RlKTtcbn1cblxuLyoqXG4gKiBBIGJvb2xlYW4tdmFsdWVkIGZ1bmN0aW9uIG92ZXIgYSB2YWx1ZSwgcG9zc2libHkgaW5jbHVkaW5nIGNvbnRleHQgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyB0aGF0IHZhbHVlJ3MgcG9zaXRpb24gaW4gYW4gYXJyYXkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFByZWRpY2F0ZTxUPiB7ICh2YWx1ZTogVCk6IGJvb2xlYW47IH1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z05vZGU6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdOb2RlfSA9IERlYnVnTm9kZV9fUFJFX1IzX187XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdFbGVtZW50OiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnRWxlbWVudH0gPSBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fO1xuIl19