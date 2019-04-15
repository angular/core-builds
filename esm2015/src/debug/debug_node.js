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
import { NATIVE, VIEWS } from '../render3/interfaces/container';
import { PARENT, TVIEW, T_HOST } from '../render3/interfaces/view';
import { getProp, getValue, isClassBasedValue } from '../render3/styling/class_and_style_bindings';
import { getStylingContext } from '../render3/styling/util';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext, loadLContextFromNode } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER, isPropMetadataString, renderStringify } from '../render3/util/misc_utils';
import { findComponentView } from '../render3/util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByTNode, isComponent, isLContainer } from '../render3/util/view_utils';
import { assertDomNode } from '../util/assert';
export class EventListener {
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
    EventListener.prototype.name;
    /** @type {?} */
    EventListener.prototype.callback;
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
        if (element) {
            /** @type {?} */
            const eAttrs = element.attributes;
            for (let i = 0; i < eAttrs.length; i++) {
                /** @type {?} */
                const attr = eAttrs[i];
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
            const stylingContext = getStylingContext(lContext.nodeIndex, lContext.lView);
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
            const stylingContext = getStylingContext(lContext.nodeIndex, lContext.lView);
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
    // For each type of TNode, specific logic is executed.
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        // Case 1: the TNode is an element
        // The native node has to be checked.
        _addQueryMatchR3(getNativeByTNode(tNode, lView), predicate, matches, elementsOnly, rootNativeNode);
        if (isComponent(tNode)) {
            // If the element is the host of a component, then all nodes in its view have to be processed.
            // Note: the component's content (tNode.child) will be processed from the insertion points.
            /** @type {?} */
            const componentView = getComponentViewByIndex(tNode.index, lView);
            if (componentView && componentView[TVIEW].firstChild)
                _queryNodeChildrenR3((/** @type {?} */ (componentView[TVIEW].firstChild)), componentView, predicate, matches, elementsOnly, rootNativeNode);
        }
        else {
            // Otherwise, its children have to be processed.
            if (tNode.child)
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
        else {
            if (head) {
                /** @type {?} */
                const nextLView = (/** @type {?} */ ((/** @type {?} */ (componentView[PARENT]))));
                /** @type {?} */
                const nextTNode = (/** @type {?} */ (nextLView[TVIEW].data[head.index]));
                _queryNodeChildrenR3(nextTNode, nextLView, predicate, matches, elementsOnly, rootNativeNode);
            }
        }
    }
    else {
        // Case 4: the TNode is a view.
        if (tNode.child) {
            _queryNodeChildrenR3(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
    // To determine the next node to be processed, we need to use the next or the projectionNext link,
    // depending on whether the current node has been projected.
    /** @type {?} */
    const nextTNode = (tNode.flags & 2 /* isProjected */) ? tNode.projectionNext : tNode.next;
    if (nextTNode) {
        _queryNodeChildrenR3(nextTNode, lView, predicate, matches, elementsOnly, rootNativeNode);
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
    for (let i = 0; i < lContainer[VIEWS].length; i++) {
        /** @type {?} */
        const childView = lContainer[VIEWS][i];
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
        let value = '';
        /** @type {?} */
        let propMetadata = (/** @type {?} */ (tData[bindingIndex]));
        while (!isPropMetadataString(propMetadata)) {
            // This is the first value for an interpolation. We need to build up
            // the full interpolation by combining runtime values in LView with
            // the static interstitial values stored in TData.
            value += renderStringify(lView[bindingIndex]) + tData[bindingIndex];
            propMetadata = (/** @type {?} */ (tData[++bindingIndex]));
        }
        value += lView[bindingIndex];
        // Property metadata string has 3 parts: property name, prefix, and suffix
        /** @type {?} */
        const metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
        /** @type {?} */
        const propertyName = metadataParts[0];
        // Attr bindings don't have property names and should be skipped
        if (propertyName) {
            // Wrap value with prefix and suffix (will be '' for normal bindings)
            properties[propertyName] = metadataParts[1] + value + metadataParts[2];
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
/**
 * @param {?} nativeNode
 * @return {?}
 */
export function getDebugNode__POST_R3__(nativeNode) {
    if (nativeNode instanceof Node) {
        return nativeNode.nodeType == Node.ELEMENT_NODE ?
            new DebugElement__POST_R3__((/** @type {?} */ (nativeNode))) :
            new DebugNode__POST_R3__(nativeNode);
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
export const DebugNode = (/** @type {?} */ (DebugNode__PRE_R3__));
/**
 * \@publicApi
 * @type {?}
 */
export const DebugElement = (/** @type {?} */ (DebugElement__PRE_R3__));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RCxPQUFPLEVBQWEsTUFBTSxFQUFFLEtBQUssRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRzFFLE9BQU8sRUFBYyxNQUFNLEVBQVMsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3JGLE9BQU8sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sNkNBQTZDLENBQUM7QUFDakcsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDMUQsT0FBTyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQzNMLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxvQkFBb0IsRUFBRSxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMxRyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUN2RSxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2hILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUc3QyxNQUFNLE9BQU8sYUFBYTs7Ozs7SUFDeEIsWUFBbUIsSUFBWSxFQUFTLFFBQWtCO1FBQXZDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFVO0lBQUcsQ0FB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Q0FBQyxJQUFJLElBQUksQ0FBQztBQUN4RCxDQUFDOzs7OztBQUtELE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxVQUFlO0lBQ3JELElBQUksVUFBVSxZQUFZLElBQUksRUFBRTtRQUM5QixPQUFPLFVBQVUsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzdDLElBQUksdUJBQXVCLENBQUMsbUJBQUEsVUFBVSxFQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3BELElBQUksb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDMUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7O0FBS0QsTUFBTSxPQUFPLFlBQVksR0FBMEMsc0JBQXNCOzs7O0FBRXpGLE1BQU0sVUFBVSxnQkFBZ0I7SUFDOUIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLElBQWU7SUFDNUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDcEQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsSUFBZTtJQUN0RCxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2pELENBQUM7Ozs7Ozs7OztBQVFELCtCQUFzRDs7Ozs7QUFLdEQsTUFBTSxPQUFPLFNBQVMsR0FBc0MsbUJBQUEsbUJBQW1CLEVBQU87Ozs7O0FBS3RGLE1BQU0sT0FBTyxZQUFZLEdBQXlDLG1CQUFBLHNCQUFzQixFQUFPIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2dldFZpZXdDb21wb25lbnR9IGZyb20gJy4uL3JlbmRlcjMvZ2xvYmFsX3V0aWxzX2FwaSc7XG5pbXBvcnQge0xDb250YWluZXIsIE5BVElWRSwgVklFV1N9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U3R5bGluZ0luZGV4fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBORVhULCBQQVJFTlQsIFREYXRhLCBUVklFVywgVF9IT1NUfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldFByb3AsIGdldFZhbHVlLCBpc0NsYXNzQmFzZWRWYWx1ZX0gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge2dldFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9yZW5kZXIzL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge2dldENvbXBvbmVudCwgZ2V0Q29udGV4dCwgZ2V0SW5qZWN0aW9uVG9rZW5zLCBnZXRJbmplY3RvciwgZ2V0TGlzdGVuZXJzLCBnZXRMb2NhbFJlZnMsIGlzQnJvd3NlckV2ZW50cywgbG9hZExDb250ZXh0LCBsb2FkTENvbnRleHRGcm9tTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCBpc1Byb3BNZXRhZGF0YVN0cmluZywgcmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2ZpbmRDb21wb25lbnRWaWV3fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgaXNDb21wb25lbnQsIGlzTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREb21Ob2RlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldy9pbmRleCc7XG5cbmV4cG9ydCBjbGFzcyBFdmVudExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGNhbGxiYWNrOiBGdW5jdGlvbikge31cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBFdmVudExpc3RlbmVyW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yO1xuICByZWFkb25seSBjb21wb25lbnRJbnN0YW5jZTogYW55O1xuICByZWFkb25seSBjb250ZXh0OiBhbnk7XG4gIHJlYWRvbmx5IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBwcm92aWRlclRva2VuczogYW55W107XG59XG5leHBvcnQgY2xhc3MgRGVidWdOb2RlX19QUkVfUjNfXyB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRXZlbnRMaXN0ZW5lcltdID0gW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGwgPSBudWxsO1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBhbnk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBEZWJ1Z05vZGV8bnVsbCwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgdGhpcy5fZGVidWdDb250ZXh0ID0gX2RlYnVnQ29udGV4dDtcbiAgICB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlO1xuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50IGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgcGFyZW50LmFkZENoaWxkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuaW5qZWN0b3I7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb21wb25lbnQ7IH1cblxuICBnZXQgY29udGV4dCgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbnRleHQ7IH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQucmVmZXJlbmNlczsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQucHJvdmlkZXJUb2tlbnM7IH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdFbGVtZW50IGV4dGVuZHMgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgcmVhZG9ubHkgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn07XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuICByZWFkb25seSBjaGlsZHJlbjogRGVidWdFbGVtZW50W107XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudDtcbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdO1xuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXTtcbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQ7XG59XG5leHBvcnQgY2xhc3MgRGVidWdFbGVtZW50X19QUkVfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUFJFX1IzX18gaW1wbGVtZW50cyBEZWJ1Z0VsZW1lbnQge1xuICByZWFkb25seSBuYW1lICE6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgcmVhZG9ubHkgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IGFueSwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgc3VwZXIobmF0aXZlTm9kZSwgcGFyZW50LCBfZGVidWdDb250ZXh0KTtcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSBuYXRpdmVOb2RlO1xuICB9XG5cbiAgYWRkQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGlmIChjaGlsZCkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnB1c2goY2hpbGQpO1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICB9XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgY29uc3QgY2hpbGRJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoY2hpbGRJbmRleCAhPT0gLTEpIHtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZSB8IG51bGx9KS5wYXJlbnQgPSBudWxsO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShjaGlsZEluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRDaGlsZHJlbkFmdGVyKGNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkcmVuOiBEZWJ1Z05vZGVbXSkge1xuICAgIGNvbnN0IHNpYmxpbmdJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoc2libGluZ0luZGV4ICE9PSAtMSkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShzaWJsaW5nSW5kZXggKyAxLCAwLCAuLi5uZXdDaGlsZHJlbik7XG4gICAgICBuZXdDaGlsZHJlbi5mb3JFYWNoKGMgPT4ge1xuICAgICAgICBpZiAoYy5wYXJlbnQpIHtcbiAgICAgICAgICAoYy5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQoYyk7XG4gICAgICAgIH1cbiAgICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydEJlZm9yZShyZWZDaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZDogRGVidWdOb2RlKTogdm9pZCB7XG4gICAgY29uc3QgcmVmSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihyZWZDaGlsZCk7XG4gICAgaWYgKHJlZkluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5hZGRDaGlsZChuZXdDaGlsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZXdDaGlsZC5wYXJlbnQpIHtcbiAgICAgICAgKG5ld0NoaWxkLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChuZXdDaGlsZCk7XG4gICAgICB9XG4gICAgICAobmV3Q2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShyZWZJbmRleCwgMCwgbmV3Q2hpbGQpO1xuICAgIH1cbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlFbGVtZW50Q2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgICAuY2hpbGROb2RlcyAgLy9cbiAgICAgICAgLmZpbHRlcigobm9kZSkgPT4gbm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIGFzIERlYnVnRWxlbWVudFtdO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBpZiAobGlzdGVuZXIubmFtZSA9PSBldmVudE5hbWUpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNOYXRpdmVFbGVtZW50cyhkZWJ1Z0VsczogRGVidWdFbGVtZW50W10pOiBhbnkge1xuICByZXR1cm4gZGVidWdFbHMubWFwKChlbCkgPT4gZWwubmF0aXZlRWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihcbiAgICBlbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4sIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdKSB7XG4gIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBfcXVlcnlFbGVtZW50Q2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW4oXG4gICAgcGFyZW50Tm9kZTogRGVidWdOb2RlLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSkge1xuICBpZiAocGFyZW50Tm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICBwYXJlbnROb2RlLmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5jbGFzcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IE5vZGU7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogTm9kZSkgeyB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlOyB9XG5cbiAgZ2V0IHBhcmVudCgpOiBEZWJ1Z0VsZW1lbnR8bnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5uYXRpdmVOb2RlLnBhcmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICByZXR1cm4gcGFyZW50ID8gbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKHBhcmVudCkgOiBudWxsO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGdldEluamVjdG9yKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVOb2RlO1xuICAgIHJldHVybiBuYXRpdmVFbGVtZW50ICYmXG4gICAgICAgIChnZXRDb21wb25lbnQobmF0aXZlRWxlbWVudCBhcyBFbGVtZW50KSB8fCBnZXRWaWV3Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQpKTtcbiAgfVxuICBnZXQgY29udGV4dCgpOiBhbnkgeyByZXR1cm4gZ2V0Q29udGV4dCh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cblxuICBnZXQgbGlzdGVuZXJzKCk6IEV2ZW50TGlzdGVuZXJbXSB7XG4gICAgcmV0dXJuIGdldExpc3RlbmVycyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCkuZmlsdGVyKGlzQnJvd3NlckV2ZW50cyk7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55O30geyByZXR1cm4gZ2V0TG9jYWxSZWZzKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gZ2V0SW5qZWN0aW9uVG9rZW5zKHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTsgfVxufVxuXG5jbGFzcyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogRWxlbWVudCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKG5hdGl2ZU5vZGUpO1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUpO1xuICB9XG5cbiAgZ2V0IG5hdGl2ZUVsZW1lbnQoKTogRWxlbWVudHxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID8gdGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQgOiBudWxsO1xuICB9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMubmF0aXZlRWxlbWVudCAhLm5vZGVOYW1lOyB9XG5cbiAgLyoqXG4gICAqICBHZXRzIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHByb3BlcnR5IHZhbHVlcyBmb3IgYW4gZWxlbWVudC5cbiAgICpcbiAgICogIFRoaXMgbWFwIGluY2x1ZGVzOlxuICAgKiAgLSBSZWd1bGFyIHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbaWRdPVwiaWRcImApXG4gICAqICAtIEhvc3QgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGhvc3Q6IHsgJ1tpZF0nOiBcImlkXCIgfWApXG4gICAqICAtIEludGVycG9sYXRlZCBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgaWQ9XCJ7eyB2YWx1ZSB9fVwiKVxuICAgKlxuICAgKiAgSXQgZG9lcyBub3QgaW5jbHVkZTpcbiAgICogIC0gaW5wdXQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYFtteUN1c3RvbUlucHV0XT1cInZhbHVlXCJgKVxuICAgKiAgLSBhdHRyaWJ1dGUgYmluZGluZ3MgKGUuZy4gYFthdHRyLnJvbGVdPVwibWVudVwiYClcbiAgICovXG4gIGdldCBwcm9wZXJ0aWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7XG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0aGlzLm5hdGl2ZU5vZGUpICE7XG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG5cbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gY29sbGVjdFByb3BlcnR5QmluZGluZ3ModE5vZGUsIGxWaWV3LCB0RGF0YSk7XG4gICAgY29uc3QgaG9zdFByb3BlcnRpZXMgPSBjb2xsZWN0SG9zdFByb3BlcnR5QmluZGluZ3ModE5vZGUsIGxWaWV3LCB0RGF0YSk7XG4gICAgY29uc3QgY2xhc3NOYW1lID0gY29sbGVjdENsYXNzTmFtZXModGhpcyk7XG4gICAgY29uc3Qgb3V0cHV0ID0gey4uLnByb3BlcnRpZXMsIC4uLmhvc3RQcm9wZXJ0aWVzfTtcblxuICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgIG91dHB1dFsnY2xhc3NOYW1lJ10gPSBvdXRwdXRbJ2NsYXNzTmFtZSddID8gb3V0cHV0WydjbGFzc05hbWUnXSArIGAgJHtjbGFzc05hbWV9YCA6IGNsYXNzTmFtZTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgZ2V0IGF0dHJpYnV0ZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3QgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSA9IHt9O1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGVBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGF0dHIgPSBlQXR0cnNbaV07XG4gICAgICAgIGF0dHJpYnV0ZXNbYXR0ci5uYW1lXSA9IGF0dHIudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgZ2V0IGNsYXNzZXMoKToge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSB7XG4gICAgY29uc3QgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW47fSA9IHt9O1xuICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGxDb250ZXh0ID0gbG9hZExDb250ZXh0RnJvbU5vZGUoZWxlbWVudCk7XG4gICAgICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGxDb250ZXh0Lm5vZGVJbmRleCwgbENvbnRleHQubFZpZXcpO1xuICAgICAgaWYgKHN0eWxpbmdDb250ZXh0KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdDb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgICAgaWYgKGlzQ2xhc3NCYXNlZFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSkge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gZ2V0UHJvcChzdHlsaW5nQ29udGV4dCwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgY2xhc3Nlc1tjbGFzc05hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjaywganVzdCByZWFkIERPTS5cbiAgICAgICAgY29uc3QgZUNsYXNzZXMgPSBlbGVtZW50LmNsYXNzTGlzdDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQ2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNsYXNzZXNbZUNsYXNzZXNbaV1dID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xhc3NlcztcbiAgfVxuXG4gIGdldCBzdHlsZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgY29uc3Qgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQobENvbnRleHQubm9kZUluZGV4LCBsQ29udGV4dC5sVmlldyk7XG4gICAgICBpZiAoc3R5bGluZ0NvbnRleHQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ0NvbnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgICBpZiAoIWlzQ2xhc3NCYXNlZFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSkge1xuICAgICAgICAgICAgY29uc3Qgc3R5bGVOYW1lID0gZ2V0UHJvcChzdHlsaW5nQ29udGV4dCwgaSk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKHN0eWxpbmdDb250ZXh0LCBpKSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIC8vIHdlIHdhbnQgdG8gaWdub3JlIGBudWxsYCBzaW5jZSB0aG9zZSBkb24ndCBvdmVyd3JpdGUgdGhlIHZhbHVlcy5cbiAgICAgICAgICAgICAgc3R5bGVzW3N0eWxlTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrLCBqdXN0IHJlYWQgRE9NLlxuICAgICAgICBjb25zdCBlU3R5bGVzID0gKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVTdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBuYW1lID0gZVN0eWxlcy5pdGVtKGkpO1xuICAgICAgICAgIHN0eWxlc1tuYW1lXSA9IGVTdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3R5bGVzO1xuICB9XG5cbiAgZ2V0IGNoaWxkTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLm5hdGl2ZU5vZGUuY2hpbGROb2RlcztcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdOb2RlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoIW5hdGl2ZUVsZW1lbnQpIHJldHVybiBbXTtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gbmF0aXZlRWxlbWVudC5jaGlsZHJlbjtcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlBbGxSMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIHRydWUpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5QWxsUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCBmYWxzZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZCB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09PSBldmVudE5hbWUpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogV2FsayB0aGUgVE5vZGUgdHJlZSB0byBmaW5kIG1hdGNoZXMgZm9yIHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIHBhcmVudEVsZW1lbnQgdGhlIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgd2FsayBpcyBzdGFydGVkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZExDb250ZXh0KHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSkgITtcbiAgY29uc3QgcGFyZW50VE5vZGUgPSBjb250ZXh0LmxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICBwYXJlbnRUTm9kZSwgY29udGV4dC5sVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSk7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgbWF0Y2ggdGhlIGN1cnJlbnQgVE5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLCBhbmQgZ29lcyBvbiB3aXRoIHRoZSBuZXh0IG9uZXMuXG4gKlxuICogQHBhcmFtIHROb2RlIHRoZSBjdXJyZW50IFROb2RlXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IG9mIHRoaXMgVE5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljY2F0ZSBzaG91b2xkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSxcbiAgICBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgLy8gRm9yIGVhY2ggdHlwZSBvZiBUTm9kZSwgc3BlY2lmaWMgbG9naWMgaXMgZXhlY3V0ZWQuXG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIC8vIENhc2UgMTogdGhlIFROb2RlIGlzIGFuIGVsZW1lbnRcbiAgICAvLyBUaGUgbmF0aXZlIG5vZGUgaGFzIHRvIGJlIGNoZWNrZWQuXG4gICAgX2FkZFF1ZXJ5TWF0Y2hSMyhcbiAgICAgICAgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIGlmIChpc0NvbXBvbmVudCh0Tm9kZSkpIHtcbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIHRoZSBob3N0IG9mIGEgY29tcG9uZW50LCB0aGVuIGFsbCBub2RlcyBpbiBpdHMgdmlldyBoYXZlIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgIC8vIE5vdGU6IHRoZSBjb21wb25lbnQncyBjb250ZW50ICh0Tm9kZS5jaGlsZCkgd2lsbCBiZSBwcm9jZXNzZWQgZnJvbSB0aGUgaW5zZXJ0aW9uIHBvaW50cy5cbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgaWYgKGNvbXBvbmVudFZpZXcgJiYgY29tcG9uZW50Vmlld1tUVklFV10uZmlyc3RDaGlsZClcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgICAgICAgICBjb21wb25lbnRWaWV3W1RWSUVXXS5maXJzdENoaWxkICEsIGNvbXBvbmVudFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LFxuICAgICAgICAgICAgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UsIGl0cyBjaGlsZHJlbiBoYXZlIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgIGlmICh0Tm9kZS5jaGlsZClcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModE5vZGUuY2hpbGQsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgICAvLyBJbiBhbGwgY2FzZXMsIGlmIGEgZHluYW1pYyBjb250YWluZXIgZXhpc3RzIGZvciB0aGlzIG5vZGUsIGVhY2ggdmlldyBpbnNpZGUgaXQgaGFzIHRvIGJlXG4gICAgLy8gcHJvY2Vzc2VkLlxuICAgIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMoXG4gICAgICAgICAgbm9kZU9yQ29udGFpbmVyLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gQ2FzZSAyOiB0aGUgVE5vZGUgaXMgYSBjb250YWluZXJcbiAgICAvLyBUaGUgbmF0aXZlIG5vZGUgaGFzIHRvIGJlIGNoZWNrZWQuXG4gICAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBfYWRkUXVlcnlNYXRjaFIzKGxDb250YWluZXJbTkFUSVZFXSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAvLyBFYWNoIHZpZXcgaW5zaWRlIHRoZSBjb250YWluZXIgaGFzIHRvIGJlIHByb2Nlc3NlZC5cbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKGxDb250YWluZXIsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAvLyBDYXNlIDM6IHRoZSBUTm9kZSBpcyBhIHByb2plY3Rpb24gaW5zZXJ0aW9uIHBvaW50IChpLmUuIGEgPG5nLWNvbnRlbnQ+KS5cbiAgICAvLyBUaGUgbm9kZXMgcHJvamVjdGVkIGF0IHRoaXMgbG9jYXRpb24gYWxsIG5lZWQgdG8gYmUgcHJvY2Vzc2VkLlxuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhsVmlldyAhKTtcbiAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICBjb25zdCBoZWFkOiBUTm9kZXxudWxsID1cbiAgICAgICAgKGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGhlYWQpKSB7XG4gICAgICBmb3IgKGxldCBuYXRpdmVOb2RlIG9mIGhlYWQpIHtcbiAgICAgICAgX2FkZFF1ZXJ5TWF0Y2hSMyhuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaGVhZCkge1xuICAgICAgICBjb25zdCBuZXh0TFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gIWFzIExWaWV3O1xuICAgICAgICBjb25zdCBuZXh0VE5vZGUgPSBuZXh0TFZpZXdbVFZJRVddLmRhdGFbaGVhZC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgICAgICAgbmV4dFROb2RlLCBuZXh0TFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENhc2UgNDogdGhlIFROb2RlIGlzIGEgdmlldy5cbiAgICBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHROb2RlLmNoaWxkLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH1cbiAgLy8gVG8gZGV0ZXJtaW5lIHRoZSBuZXh0IG5vZGUgdG8gYmUgcHJvY2Vzc2VkLCB3ZSBuZWVkIHRvIHVzZSB0aGUgbmV4dCBvciB0aGUgcHJvamVjdGlvbk5leHQgbGluayxcbiAgLy8gZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIGN1cnJlbnQgbm9kZSBoYXMgYmVlbiBwcm9qZWN0ZWQuXG4gIGNvbnN0IG5leHRUTm9kZSA9ICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpID8gdE5vZGUucHJvamVjdGlvbk5leHQgOiB0Tm9kZS5uZXh0O1xuICBpZiAobmV4dFROb2RlKSB7XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobmV4dFROb2RlLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3MgYWxsIFROb2RlcyBpbiBhIGdpdmVuIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0aGUgY29udGFpbmVyIHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNjYXRlIHNob3VvbGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSxcbiAgICBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkVmlldyA9IGxDb250YWluZXJbVklFV1NdW2ldO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgICBjaGlsZFZpZXdbVFZJRVddLm5vZGUgISwgY2hpbGRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2ggdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLlxuICpcbiAqIEBwYXJhbSBuYXRpdmVOb2RlIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2NhdGUgc2hvdW9sZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfYWRkUXVlcnlNYXRjaFIzKFxuICAgIG5hdGl2ZU5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbixcbiAgICByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGlmIChyb290TmF0aXZlTm9kZSAhPT0gbmF0aXZlTm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZSA9IGdldERlYnVnTm9kZShuYXRpdmVOb2RlKTtcbiAgICBpZiAoZGVidWdOb2RlICYmIChlbGVtZW50c09ubHkgPyBkZWJ1Z05vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyA6IHRydWUpICYmXG4gICAgICAgIHByZWRpY2F0ZShkZWJ1Z05vZGUpKSB7XG4gICAgICBtYXRjaGVzLnB1c2goZGVidWdOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBwcm9wZXJ0eSBiaW5kaW5ncyBmb3IgYSBnaXZlbiBub2RlIGFuZCBnZW5lcmF0ZXNcbiAqIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHZhbHVlcy4gVGhpcyBtYXAgb25seSBjb250YWlucyBwcm9wZXJ0eSBiaW5kaW5nc1xuICogZGVmaW5lZCBpbiB0ZW1wbGF0ZXMsIG5vdCBpbiBob3N0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UHJvcGVydHlCaW5kaW5ncyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBsZXQgYmluZGluZ0luZGV4ID0gZ2V0Rmlyc3RCaW5kaW5nSW5kZXgodE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXgsIHREYXRhKTtcblxuICB3aGlsZSAoYmluZGluZ0luZGV4IDwgdE5vZGUucHJvcGVydHlNZXRhZGF0YUVuZEluZGV4KSB7XG4gICAgbGV0IHZhbHVlID0gJyc7XG4gICAgbGV0IHByb3BNZXRhZGF0YSA9IHREYXRhW2JpbmRpbmdJbmRleF0gYXMgc3RyaW5nO1xuICAgIHdoaWxlICghaXNQcm9wTWV0YWRhdGFTdHJpbmcocHJvcE1ldGFkYXRhKSkge1xuICAgICAgLy8gVGhpcyBpcyB0aGUgZmlyc3QgdmFsdWUgZm9yIGFuIGludGVycG9sYXRpb24uIFdlIG5lZWQgdG8gYnVpbGQgdXBcbiAgICAgIC8vIHRoZSBmdWxsIGludGVycG9sYXRpb24gYnkgY29tYmluaW5nIHJ1bnRpbWUgdmFsdWVzIGluIExWaWV3IHdpdGhcbiAgICAgIC8vIHRoZSBzdGF0aWMgaW50ZXJzdGl0aWFsIHZhbHVlcyBzdG9yZWQgaW4gVERhdGEuXG4gICAgICB2YWx1ZSArPSByZW5kZXJTdHJpbmdpZnkobFZpZXdbYmluZGluZ0luZGV4XSkgKyB0RGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgcHJvcE1ldGFkYXRhID0gdERhdGFbKytiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICB9XG4gICAgdmFsdWUgKz0gbFZpZXdbYmluZGluZ0luZGV4XTtcbiAgICAvLyBQcm9wZXJ0eSBtZXRhZGF0YSBzdHJpbmcgaGFzIDMgcGFydHM6IHByb3BlcnR5IG5hbWUsIHByZWZpeCwgYW5kIHN1ZmZpeFxuICAgIGNvbnN0IG1ldGFkYXRhUGFydHMgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IG1ldGFkYXRhUGFydHNbMF07XG4gICAgLy8gQXR0ciBiaW5kaW5ncyBkb24ndCBoYXZlIHByb3BlcnR5IG5hbWVzIGFuZCBzaG91bGQgYmUgc2tpcHBlZFxuICAgIGlmIChwcm9wZXJ0eU5hbWUpIHtcbiAgICAgIC8vIFdyYXAgdmFsdWUgd2l0aCBwcmVmaXggYW5kIHN1ZmZpeCAod2lsbCBiZSAnJyBmb3Igbm9ybWFsIGJpbmRpbmdzKVxuICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gbWV0YWRhdGFQYXJ0c1sxXSArIHZhbHVlICsgbWV0YWRhdGFQYXJ0c1syXTtcbiAgICB9XG4gICAgYmluZGluZ0luZGV4Kys7XG4gIH1cbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBmaXJzdCBiaW5kaW5nIGluZGV4IHRoYXQgaG9sZHMgdmFsdWVzIGZvciB0aGlzIHByb3BlcnR5XG4gKiBiaW5kaW5nLlxuICpcbiAqIEZvciBub3JtYWwgYmluZGluZ3MgKGUuZy4gYFtpZF09XCJpZFwiYCksIHRoZSBiaW5kaW5nIGluZGV4IGlzIHRoZVxuICogc2FtZSBhcyB0aGUgbWV0YWRhdGEgaW5kZXguIEZvciBpbnRlcnBvbGF0aW9ucyAoZS5nLiBgaWQ9XCJ7e2lkfX0te3tuYW1lfX1cImApLFxuICogdGhlcmUgY2FuIGJlIG11bHRpcGxlIGJpbmRpbmcgdmFsdWVzLCBzbyB3ZSBtaWdodCBoYXZlIHRvIGxvb3AgYmFja3dhcmRzXG4gKiBmcm9tIHRoZSBtZXRhZGF0YSBpbmRleCB1bnRpbCB3ZSBmaW5kIHRoZSBmaXJzdCBvbmUuXG4gKlxuICogQHBhcmFtIG1ldGFkYXRhSW5kZXggVGhlIGluZGV4IG9mIHRoZSBmaXJzdCBwcm9wZXJ0eSBtZXRhZGF0YSBzdHJpbmcgZm9yXG4gKiB0aGlzIG5vZGUuXG4gKiBAcGFyYW0gdERhdGEgVGhlIGRhdGEgYXJyYXkgZm9yIHRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcmV0dXJucyBUaGUgZmlyc3QgYmluZGluZyBpbmRleCBmb3IgdGhpcyBiaW5kaW5nXG4gKi9cbmZ1bmN0aW9uIGdldEZpcnN0QmluZGluZ0luZGV4KG1ldGFkYXRhSW5kZXg6IG51bWJlciwgdERhdGE6IFREYXRhKTogbnVtYmVyIHtcbiAgbGV0IGN1cnJlbnRCaW5kaW5nSW5kZXggPSBtZXRhZGF0YUluZGV4IC0gMTtcblxuICAvLyBJZiB0aGUgc2xvdCBiZWZvcmUgdGhlIG1ldGFkYXRhIGhvbGRzIGEgc3RyaW5nLCB3ZSBrbm93IHRoYXQgdGhpc1xuICAvLyBtZXRhZGF0YSBhcHBsaWVzIHRvIGFuIGludGVycG9sYXRpb24gd2l0aCBhdCBsZWFzdCAyIGJpbmRpbmdzLCBhbmRcbiAgLy8gd2UgbmVlZCB0byBzZWFyY2ggZnVydGhlciB0byBhY2Nlc3MgdGhlIGZpcnN0IGJpbmRpbmcgdmFsdWUuXG4gIGxldCBjdXJyZW50VmFsdWUgPSB0RGF0YVtjdXJyZW50QmluZGluZ0luZGV4XTtcblxuICAvLyBXZSBuZWVkIHRvIGl0ZXJhdGUgdW50aWwgd2UgaGl0IGVpdGhlciBhOlxuICAvLyAtIFROb2RlIChpdCBpcyBhbiBlbGVtZW50IHNsb3QgbWFya2luZyB0aGUgZW5kIG9mIGBjb25zdHNgIHNlY3Rpb24pLCBPUiBhXG4gIC8vIC0gbWV0YWRhdGEgc3RyaW5nIChzbG90IGlzIGF0dHJpYnV0ZSBtZXRhZGF0YSBvciBhIHByZXZpb3VzIG5vZGUncyBwcm9wZXJ0eSBtZXRhZGF0YSlcbiAgd2hpbGUgKHR5cGVvZiBjdXJyZW50VmFsdWUgPT09ICdzdHJpbmcnICYmICFpc1Byb3BNZXRhZGF0YVN0cmluZyhjdXJyZW50VmFsdWUpKSB7XG4gICAgY3VycmVudFZhbHVlID0gdERhdGFbLS1jdXJyZW50QmluZGluZ0luZGV4XTtcbiAgfVxuICByZXR1cm4gY3VycmVudEJpbmRpbmdJbmRleCArIDE7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RIb3N0UHJvcGVydHlCaW5kaW5ncyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4gIC8vIEhvc3QgYmluZGluZyB2YWx1ZXMgZm9yIGEgbm9kZSBhcmUgc3RvcmVkIGFmdGVyIGRpcmVjdGl2ZXMgb24gdGhhdCBub2RlXG4gIGxldCBob3N0UHJvcEluZGV4ID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBsZXQgcHJvcE1ldGFkYXRhID0gdERhdGFbaG9zdFByb3BJbmRleF0gYXMgYW55O1xuXG4gIC8vIFdoZW4gd2UgcmVhY2ggYSB2YWx1ZSBpbiBUVmlldy5kYXRhIHRoYXQgaXMgbm90IGEgc3RyaW5nLCB3ZSBrbm93IHdlJ3ZlXG4gIC8vIGhpdCB0aGUgbmV4dCBub2RlJ3MgcHJvdmlkZXJzIGFuZCBkaXJlY3RpdmVzIGFuZCBzaG91bGQgc3RvcCBjb3B5aW5nIGRhdGEuXG4gIHdoaWxlICh0eXBlb2YgcHJvcE1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHByb3BNZXRhZGF0YS5zcGxpdChJTlRFUlBPTEFUSU9OX0RFTElNSVRFUilbMF07XG4gICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gbFZpZXdbaG9zdFByb3BJbmRleF07XG4gICAgcHJvcE1ldGFkYXRhID0gdERhdGFbKytob3N0UHJvcEluZGV4XTtcbiAgfVxuICByZXR1cm4gcHJvcGVydGllcztcbn1cblxuXG5mdW5jdGlvbiBjb2xsZWN0Q2xhc3NOYW1lcyhkZWJ1Z0VsZW1lbnQ6IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKTogc3RyaW5nIHtcbiAgY29uc3QgY2xhc3NlcyA9IGRlYnVnRWxlbWVudC5jbGFzc2VzO1xuICBsZXQgb3V0cHV0ID0gJyc7XG5cbiAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgT2JqZWN0LmtleXMoY2xhc3NlcykpIHtcbiAgICBpZiAoY2xhc3Nlc1tjbGFzc05hbWVdKSB7XG4gICAgICBvdXRwdXQgPSBvdXRwdXQgPyBvdXRwdXQgKyBgICR7Y2xhc3NOYW1lfWAgOiBjbGFzc05hbWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG4vLyBOZWVkIHRvIGtlZXAgdGhlIG5vZGVzIGluIGEgZ2xvYmFsIE1hcCBzbyB0aGF0IG11bHRpcGxlIGFuZ3VsYXIgYXBwcyBhcmUgc3VwcG9ydGVkLlxuY29uc3QgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZSA9IG5ldyBNYXA8YW55LCBEZWJ1Z05vZGU+KCk7XG5cbmZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUFJFX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICByZXR1cm4gX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5nZXQobmF0aXZlTm9kZSkgfHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IEVsZW1lbnQpOiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBOb2RlKTogRGVidWdOb2RlX19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogbnVsbCk6IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICBpZiAobmF0aXZlTm9kZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICByZXR1cm4gbmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/XG4gICAgICAgIG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhuYXRpdmVOb2RlIGFzIEVsZW1lbnQpIDpcbiAgICAgICAgbmV3IERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGdldERlYnVnTm9kZTogKG5hdGl2ZU5vZGU6IGFueSkgPT4gRGVidWdOb2RlIHwgbnVsbCA9IGdldERlYnVnTm9kZV9fUFJFX1IzX187XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxEZWJ1Z05vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS52YWx1ZXMoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleERlYnVnTm9kZShub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5zZXQobm9kZS5uYXRpdmVOb2RlLCBub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5kZWxldGUobm9kZS5uYXRpdmVOb2RlKTtcbn1cblxuLyoqXG4gKiBBIGJvb2xlYW4tdmFsdWVkIGZ1bmN0aW9uIG92ZXIgYSB2YWx1ZSwgcG9zc2libHkgaW5jbHVkaW5nIGNvbnRleHQgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyB0aGF0IHZhbHVlJ3MgcG9zaXRpb24gaW4gYW4gYXJyYXkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFByZWRpY2F0ZTxUPiB7ICh2YWx1ZTogVCk6IGJvb2xlYW47IH1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z05vZGU6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdOb2RlfSA9IERlYnVnTm9kZV9fUFJFX1IzX18gYXMgYW55O1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnRWxlbWVudDoge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z0VsZW1lbnR9ID0gRGVidWdFbGVtZW50X19QUkVfUjNfXyBhcyBhbnk7XG4iXX0=