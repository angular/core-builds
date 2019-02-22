/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getViewComponent } from '../render3/global_utils_api';
import { TVIEW } from '../render3/interfaces/view';
import { getProp, getValue, isClassBasedValue } from '../render3/styling/class_and_style_bindings';
import { getStylingContext } from '../render3/styling/util';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext, loadLContextFromNode } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER, isPropMetadataString, renderStringify } from '../render3/util/misc_utils';
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
            newChildren.forEach(c => {
                if (c.parent) {
                    ((/** @type {?} */ (c.parent))).removeChild(c);
                }
                ((/** @type {?} */ (child))).parent = this;
            });
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
            .filter((node) => node instanceof DebugElement__PRE_R3__)));
    }
    /**
     * @param {?} eventName
     * @param {?} eventObj
     * @return {?}
     */
    triggerEventHandler(eventName, eventObj) {
        this.listeners.forEach((listener) => {
            if (listener.name == eventName) {
                listener.callback(eventObj);
            }
        });
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
    return debugEls.map((el) => el.nativeElement);
}
/**
 * @param {?} element
 * @param {?} predicate
 * @param {?} matches
 * @return {?}
 */
function _queryElementChildren(element, predicate, matches) {
    element.childNodes.forEach(node => {
        if (node instanceof DebugElement__PRE_R3__) {
            if (predicate(node)) {
                matches.push(node);
            }
            _queryElementChildren(node, predicate, matches);
        }
    });
}
/**
 * @param {?} parentNode
 * @param {?} predicate
 * @param {?} matches
 * @return {?}
 */
function _queryNodeChildren(parentNode, predicate, matches) {
    if (parentNode instanceof DebugElement__PRE_R3__) {
        parentNode.childNodes.forEach(node => {
            if (predicate(node)) {
                matches.push(node);
            }
            if (node instanceof DebugElement__PRE_R3__) {
                _queryNodeChildren(node, predicate, matches);
            }
        });
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
        return Object.assign({}, properties, hostProperties);
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
                for (let i = 9 /* SingleStylesStartPosition */; i < stylingContext.length; i += 4 /* Size */) {
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
                for (let i = 9 /* SingleStylesStartPosition */; i < stylingContext.length; i += 4 /* Size */) {
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
        _queryNodeChildrenR3(this, predicate, matches, true);
        return matches;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAllNodes(predicate) {
        /** @type {?} */
        const matches = [];
        _queryNodeChildrenR3(this, predicate, matches, false);
        return matches;
    }
    /**
     * @param {?} eventName
     * @param {?} eventObj
     * @return {?}
     */
    triggerEventHandler(eventName, eventObj) {
        this.listeners.forEach((listener) => {
            if (listener.name === eventName) {
                listener.callback(eventObj);
            }
        });
    }
}
/**
 * @param {?} parentNode
 * @param {?} predicate
 * @param {?} matches
 * @param {?} elementsOnly
 * @return {?}
 */
function _queryNodeChildrenR3(parentNode, predicate, matches, elementsOnly) {
    if (parentNode instanceof DebugElement__POST_R3__) {
        parentNode.childNodes.forEach(node => {
            if (predicate(node)) {
                matches.push(node);
            }
            if (node instanceof DebugElement__POST_R3__) {
                if (elementsOnly ? node.nativeElement : true) {
                    _queryNodeChildrenR3(node, predicate, matches, elementsOnly);
                }
            }
        });
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
export const DebugNode = (/** @type {?} */ (DebugNode__PRE_R3__));
/**
 * \@publicApi
 * @type {?}
 */
export const DebugElement = (/** @type {?} */ (DebugElement__PRE_R3__));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUc3RCxPQUFPLEVBQWUsS0FBSyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDL0QsT0FBTyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSw2Q0FBNkMsQ0FBQztBQUNqRyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDM0wsT0FBTyxFQUFDLHVCQUF1QixFQUFFLG9CQUFvQixFQUFFLGVBQWUsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzFHLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUc3QyxNQUFNLE9BQU8sYUFBYTs7Ozs7SUFDeEIsWUFBbUIsSUFBWSxFQUFTLFFBQWtCO1FBQXZDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFVO0lBQUcsQ0FBQztDQUMvRDs7O0lBRGEsNkJBQW1COztJQUFFLGlDQUF5Qjs7O0FBZ0I1RCxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFNOUIsWUFBWSxVQUFlLEVBQUUsTUFBc0IsRUFBRSxhQUEyQjtRQUx2RSxjQUFTLEdBQW9CLEVBQUUsQ0FBQztRQUNoQyxXQUFNLEdBQXNCLElBQUksQ0FBQztRQUt4QyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztR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LEVBQWtCOzs7OztBQUV4RCxTQUFTLHNCQUFzQixDQUFDLFVBQWU7SUFDN0MsT0FBTyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDO0FBQ3hELENBQUM7Ozs7O0FBS0QsTUFBTSxVQUFVLHVCQUF1QixDQUFDLFVBQWU7SUFDckQsSUFBSSxVQUFVLFlBQVksSUFBSSxFQUFFO1FBQzlCLE9BQU8sVUFBVSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDN0MsSUFBSSx1QkFBdUIsQ0FBQyxtQkFBQSxVQUFVLEVBQVcsQ0FBQyxDQUFDLENBQUM7WUFDcEQsSUFBSSxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUMxQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7QUFLRCxNQUFNLE9BQU8sWUFBWSxHQWZULHVCQWV5RTs7OztBQUV6RixNQUFNLFVBQVUsZ0JBQWdCO0lBQzlCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxJQUFlO0lBQzVDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUFDLElBQWU7SUFDdEQsc0JBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqRCxDQUFDOzs7Ozs7Ozs7QUFRRCwrQkFBc0Q7Ozs7O0FBS3RELE1BQU0sT0FBTyxTQUFTLEdBQXNDLG1CQUFBLG1CQUFtQixFQUFPOzs7OztBQUt0RixNQUFNLE9BQU8sWUFBWSxHQUF5QyxtQkFBQSxzQkFBc0IsRUFBTyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRWaWV3Q29tcG9uZW50fSBmcm9tICcuLi9yZW5kZXIzL2dsb2JhbF91dGlsc19hcGknO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTdHlsaW5nSW5kZXh9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFREYXRhLCBUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRQcm9wLCBnZXRWYWx1ZSwgaXNDbGFzc0Jhc2VkVmFsdWV9IGZyb20gJy4uL3JlbmRlcjMvc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldEluamVjdGlvblRva2VucywgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0TG9jYWxSZWZzLCBpc0Jyb3dzZXJFdmVudHMsIGxvYWRMQ29udGV4dCwgbG9hZExDb250ZXh0RnJvbU5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9kaXNjb3ZlcnlfdXRpbHMnO1xuaW1wb3J0IHtJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiwgaXNQcm9wTWV0YWRhdGFTdHJpbmcsIHJlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREb21Ob2RlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldy9pbmRleCc7XG5cbmV4cG9ydCBjbGFzcyBFdmVudExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGNhbGxiYWNrOiBGdW5jdGlvbikge31cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBFdmVudExpc3RlbmVyW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yO1xuICByZWFkb25seSBjb21wb25lbnRJbnN0YW5jZTogYW55O1xuICByZWFkb25seSBjb250ZXh0OiBhbnk7XG4gIHJlYWRvbmx5IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBwcm92aWRlclRva2VuczogYW55W107XG59XG5leHBvcnQgY2xhc3MgRGVidWdOb2RlX19QUkVfUjNfXyB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRXZlbnRMaXN0ZW5lcltdID0gW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGwgPSBudWxsO1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBhbnk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBEZWJ1Z05vZGV8bnVsbCwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgdGhpcy5fZGVidWdDb250ZXh0ID0gX2RlYnVnQ29udGV4dDtcbiAgICB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlO1xuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50IGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgcGFyZW50LmFkZENoaWxkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuaW5qZWN0b3I7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb21wb25lbnQ7IH1cblxuICBnZXQgY29udGV4dCgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbnRleHQ7IH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQucmVmZXJlbmNlczsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQucHJvdmlkZXJUb2tlbnM7IH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdFbGVtZW50IGV4dGVuZHMgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgcmVhZG9ubHkgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn07XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuICByZWFkb25seSBjaGlsZHJlbjogRGVidWdFbGVtZW50W107XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudDtcbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdO1xuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXTtcbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQ7XG59XG5leHBvcnQgY2xhc3MgRGVidWdFbGVtZW50X19QUkVfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUFJFX1IzX18gaW1wbGVtZW50cyBEZWJ1Z0VsZW1lbnQge1xuICByZWFkb25seSBuYW1lICE6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgcmVhZG9ubHkgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IGFueSwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgc3VwZXIobmF0aXZlTm9kZSwgcGFyZW50LCBfZGVidWdDb250ZXh0KTtcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSBuYXRpdmVOb2RlO1xuICB9XG5cbiAgYWRkQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGlmIChjaGlsZCkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnB1c2goY2hpbGQpO1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICB9XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgY29uc3QgY2hpbGRJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoY2hpbGRJbmRleCAhPT0gLTEpIHtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZSB8IG51bGx9KS5wYXJlbnQgPSBudWxsO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShjaGlsZEluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRDaGlsZHJlbkFmdGVyKGNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkcmVuOiBEZWJ1Z05vZGVbXSkge1xuICAgIGNvbnN0IHNpYmxpbmdJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoc2libGluZ0luZGV4ICE9PSAtMSkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShzaWJsaW5nSW5kZXggKyAxLCAwLCAuLi5uZXdDaGlsZHJlbik7XG4gICAgICBuZXdDaGlsZHJlbi5mb3JFYWNoKGMgPT4ge1xuICAgICAgICBpZiAoYy5wYXJlbnQpIHtcbiAgICAgICAgICAoYy5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQoYyk7XG4gICAgICAgIH1cbiAgICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydEJlZm9yZShyZWZDaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZDogRGVidWdOb2RlKTogdm9pZCB7XG4gICAgY29uc3QgcmVmSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihyZWZDaGlsZCk7XG4gICAgaWYgKHJlZkluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5hZGRDaGlsZChuZXdDaGlsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZXdDaGlsZC5wYXJlbnQpIHtcbiAgICAgICAgKG5ld0NoaWxkLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChuZXdDaGlsZCk7XG4gICAgICB9XG4gICAgICAobmV3Q2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShyZWZJbmRleCwgMCwgbmV3Q2hpbGQpO1xuICAgIH1cbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlFbGVtZW50Q2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgICAuY2hpbGROb2RlcyAgLy9cbiAgICAgICAgLmZpbHRlcigobm9kZSkgPT4gbm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIGFzIERlYnVnRWxlbWVudFtdO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBpZiAobGlzdGVuZXIubmFtZSA9PSBldmVudE5hbWUpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNOYXRpdmVFbGVtZW50cyhkZWJ1Z0VsczogRGVidWdFbGVtZW50W10pOiBhbnkge1xuICByZXR1cm4gZGVidWdFbHMubWFwKChlbCkgPT4gZWwubmF0aXZlRWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihcbiAgICBlbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4sIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdKSB7XG4gIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBfcXVlcnlFbGVtZW50Q2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW4oXG4gICAgcGFyZW50Tm9kZTogRGVidWdOb2RlLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSkge1xuICBpZiAocGFyZW50Tm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICBwYXJlbnROb2RlLmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5jbGFzcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IE5vZGU7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogTm9kZSkgeyB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlOyB9XG5cbiAgZ2V0IHBhcmVudCgpOiBEZWJ1Z0VsZW1lbnR8bnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5uYXRpdmVOb2RlLnBhcmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICByZXR1cm4gcGFyZW50ID8gbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKHBhcmVudCkgOiBudWxsO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGdldEluamVjdG9yKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVOb2RlO1xuICAgIHJldHVybiBuYXRpdmVFbGVtZW50ICYmXG4gICAgICAgIChnZXRDb21wb25lbnQobmF0aXZlRWxlbWVudCBhcyBFbGVtZW50KSB8fCBnZXRWaWV3Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQpKTtcbiAgfVxuICBnZXQgY29udGV4dCgpOiBhbnkgeyByZXR1cm4gZ2V0Q29udGV4dCh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cblxuICBnZXQgbGlzdGVuZXJzKCk6IEV2ZW50TGlzdGVuZXJbXSB7XG4gICAgcmV0dXJuIGdldExpc3RlbmVycyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCkuZmlsdGVyKGlzQnJvd3NlckV2ZW50cyk7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55O30geyByZXR1cm4gZ2V0TG9jYWxSZWZzKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gZ2V0SW5qZWN0aW9uVG9rZW5zKHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTsgfVxufVxuXG5jbGFzcyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogRWxlbWVudCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKG5hdGl2ZU5vZGUpO1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUpO1xuICB9XG5cbiAgZ2V0IG5hdGl2ZUVsZW1lbnQoKTogRWxlbWVudHxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID8gdGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQgOiBudWxsO1xuICB9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMubmF0aXZlRWxlbWVudCAhLm5vZGVOYW1lOyB9XG5cbiAgLyoqXG4gICAqICBHZXRzIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHByb3BlcnR5IHZhbHVlcyBmb3IgYW4gZWxlbWVudC5cbiAgICpcbiAgICogIFRoaXMgbWFwIGluY2x1ZGVzOlxuICAgKiAgLSBSZWd1bGFyIHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbaWRdPVwiaWRcImApXG4gICAqICAtIEhvc3QgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGhvc3Q6IHsgJ1tpZF0nOiBcImlkXCIgfWApXG4gICAqICAtIEludGVycG9sYXRlZCBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgaWQ9XCJ7eyB2YWx1ZSB9fVwiKVxuICAgKlxuICAgKiAgSXQgZG9lcyBub3QgaW5jbHVkZTpcbiAgICogIC0gaW5wdXQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYFtteUN1c3RvbUlucHV0XT1cInZhbHVlXCJgKVxuICAgKiAgLSBhdHRyaWJ1dGUgYmluZGluZ3MgKGUuZy4gYFthdHRyLnJvbGVdPVwibWVudVwiYClcbiAgICovXG4gIGdldCBwcm9wZXJ0aWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7XG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dCh0aGlzLm5hdGl2ZU5vZGUpICE7XG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG5cbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gY29sbGVjdFByb3BlcnR5QmluZGluZ3ModE5vZGUsIGxWaWV3LCB0RGF0YSk7XG4gICAgY29uc3QgaG9zdFByb3BlcnRpZXMgPSBjb2xsZWN0SG9zdFByb3BlcnR5QmluZGluZ3ModE5vZGUsIGxWaWV3LCB0RGF0YSk7XG4gICAgcmV0dXJuIHsuLi5wcm9wZXJ0aWVzLCAuLi5ob3N0UHJvcGVydGllc307XG4gIH1cblxuICBnZXQgYXR0cmlidXRlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgZUF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgYXR0ciA9IGVBdHRyc1tpXTtcbiAgICAgICAgYXR0cmlidXRlc1thdHRyLm5hbWVdID0gYXR0ci52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gIH1cblxuICBnZXQgY2xhc3NlcygpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9IHtcbiAgICBjb25zdCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgbENvbnRleHQgPSBsb2FkTENvbnRleHRGcm9tTm9kZShlbGVtZW50KTtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQobENvbnRleHQubm9kZUluZGV4LCBsQ29udGV4dC5sVmlldyk7XG4gICAgICBpZiAoc3R5bGluZ0NvbnRleHQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ0NvbnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgICBpZiAoaXNDbGFzc0Jhc2VkVmFsdWUoc3R5bGluZ0NvbnRleHQsIGkpKSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc05hbWUgPSBnZXRQcm9wKHN0eWxpbmdDb250ZXh0LCBpKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoc3R5bGluZ0NvbnRleHQsIGkpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgLy8gd2Ugd2FudCB0byBpZ25vcmUgYG51bGxgIHNpbmNlIHRob3NlIGRvbid0IG92ZXJ3cml0ZSB0aGUgdmFsdWVzLlxuICAgICAgICAgICAgICBjbGFzc2VzW2NsYXNzTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrLCBqdXN0IHJlYWQgRE9NLlxuICAgICAgICBjb25zdCBlQ2xhc3NlcyA9IGVsZW1lbnQuY2xhc3NMaXN0O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY2xhc3Nlc1tlQ2xhc3Nlc1tpXV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbGFzc2VzO1xuICB9XG5cbiAgZ2V0IHN0eWxlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICBjb25zdCBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBjb25zdCBsQ29udGV4dCA9IGxvYWRMQ29udGV4dEZyb21Ob2RlKGVsZW1lbnQpO1xuICAgICAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChsQ29udGV4dC5ub2RlSW5kZXgsIGxDb250ZXh0LmxWaWV3KTtcbiAgICAgIGlmIChzdHlsaW5nQ29udGV4dCkge1xuICAgICAgICBmb3IgKGxldCBpID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247IGkgPCBzdHlsaW5nQ29udGV4dC5sZW5ndGg7XG4gICAgICAgICAgICAgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgICAgICAgIGlmICghaXNDbGFzc0Jhc2VkVmFsdWUoc3R5bGluZ0NvbnRleHQsIGkpKSB7XG4gICAgICAgICAgICBjb25zdCBzdHlsZU5hbWUgPSBnZXRQcm9wKHN0eWxpbmdDb250ZXh0LCBpKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoc3R5bGluZ0NvbnRleHQsIGkpIGFzIHN0cmluZyB8IG51bGw7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgLy8gd2Ugd2FudCB0byBpZ25vcmUgYG51bGxgIHNpbmNlIHRob3NlIGRvbid0IG92ZXJ3cml0ZSB0aGUgdmFsdWVzLlxuICAgICAgICAgICAgICBzdHlsZXNbc3R5bGVOYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmFsbGJhY2ssIGp1c3QgcmVhZCBET00uXG4gICAgICAgIGNvbnN0IGVTdHlsZXMgPSAoZWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGU7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZVN0eWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBlU3R5bGVzLml0ZW0oaSk7XG4gICAgICAgICAgc3R5bGVzW25hbWVdID0gZVN0eWxlcy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZXM7XG4gIH1cblxuICBnZXQgY2hpbGROb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IHRoaXMubmF0aXZlTm9kZS5jaGlsZE5vZGVzO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZV9fUE9TVF9SM19fKGVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuICAgIGlmICghbmF0aXZlRWxlbWVudCkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBuYXRpdmVFbGVtZW50LmNoaWxkcmVuO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZV9fUE9TVF9SM19fKGVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgdHJ1ZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGZhbHNlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT09IGV2ZW50TmFtZSkge1xuICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayhldmVudE9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgcGFyZW50Tm9kZTogRGVidWdOb2RlLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSxcbiAgICBlbGVtZW50c09ubHk6IGJvb2xlYW4pIHtcbiAgaWYgKHBhcmVudE5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXykge1xuICAgIHBhcmVudE5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fKSB7XG4gICAgICAgIGlmIChlbGVtZW50c09ubHkgPyBub2RlLm5hdGl2ZUVsZW1lbnQgOiB0cnVlKSB7XG4gICAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBwcm9wZXJ0eSBiaW5kaW5ncyBmb3IgYSBnaXZlbiBub2RlIGFuZCBnZW5lcmF0ZXNcbiAqIGEgbWFwIG9mIHByb3BlcnR5IG5hbWVzIHRvIHZhbHVlcy4gVGhpcyBtYXAgb25seSBjb250YWlucyBwcm9wZXJ0eSBiaW5kaW5nc1xuICogZGVmaW5lZCBpbiB0ZW1wbGF0ZXMsIG5vdCBpbiBob3N0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UHJvcGVydHlCaW5kaW5ncyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBsZXQgYmluZGluZ0luZGV4ID0gZ2V0Rmlyc3RCaW5kaW5nSW5kZXgodE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXgsIHREYXRhKTtcblxuICB3aGlsZSAoYmluZGluZ0luZGV4IDwgdE5vZGUucHJvcGVydHlNZXRhZGF0YUVuZEluZGV4KSB7XG4gICAgbGV0IHZhbHVlID0gJyc7XG4gICAgbGV0IHByb3BNZXRhZGF0YSA9IHREYXRhW2JpbmRpbmdJbmRleF0gYXMgc3RyaW5nO1xuICAgIHdoaWxlICghaXNQcm9wTWV0YWRhdGFTdHJpbmcocHJvcE1ldGFkYXRhKSkge1xuICAgICAgLy8gVGhpcyBpcyB0aGUgZmlyc3QgdmFsdWUgZm9yIGFuIGludGVycG9sYXRpb24uIFdlIG5lZWQgdG8gYnVpbGQgdXBcbiAgICAgIC8vIHRoZSBmdWxsIGludGVycG9sYXRpb24gYnkgY29tYmluaW5nIHJ1bnRpbWUgdmFsdWVzIGluIExWaWV3IHdpdGhcbiAgICAgIC8vIHRoZSBzdGF0aWMgaW50ZXJzdGl0aWFsIHZhbHVlcyBzdG9yZWQgaW4gVERhdGEuXG4gICAgICB2YWx1ZSArPSByZW5kZXJTdHJpbmdpZnkobFZpZXdbYmluZGluZ0luZGV4XSkgKyB0RGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgcHJvcE1ldGFkYXRhID0gdERhdGFbKytiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICB9XG4gICAgdmFsdWUgKz0gbFZpZXdbYmluZGluZ0luZGV4XTtcbiAgICAvLyBQcm9wZXJ0eSBtZXRhZGF0YSBzdHJpbmcgaGFzIDMgcGFydHM6IHByb3BlcnR5IG5hbWUsIHByZWZpeCwgYW5kIHN1ZmZpeFxuICAgIGNvbnN0IG1ldGFkYXRhUGFydHMgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IG1ldGFkYXRhUGFydHNbMF07XG4gICAgLy8gQXR0ciBiaW5kaW5ncyBkb24ndCBoYXZlIHByb3BlcnR5IG5hbWVzIGFuZCBzaG91bGQgYmUgc2tpcHBlZFxuICAgIGlmIChwcm9wZXJ0eU5hbWUpIHtcbiAgICAgIC8vIFdyYXAgdmFsdWUgd2l0aCBwcmVmaXggYW5kIHN1ZmZpeCAod2lsbCBiZSAnJyBmb3Igbm9ybWFsIGJpbmRpbmdzKVxuICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gbWV0YWRhdGFQYXJ0c1sxXSArIHZhbHVlICsgbWV0YWRhdGFQYXJ0c1syXTtcbiAgICB9XG4gICAgYmluZGluZ0luZGV4Kys7XG4gIH1cbiAgcmV0dXJuIHByb3BlcnRpZXM7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBmaXJzdCBiaW5kaW5nIGluZGV4IHRoYXQgaG9sZHMgdmFsdWVzIGZvciB0aGlzIHByb3BlcnR5XG4gKiBiaW5kaW5nLlxuICpcbiAqIEZvciBub3JtYWwgYmluZGluZ3MgKGUuZy4gYFtpZF09XCJpZFwiYCksIHRoZSBiaW5kaW5nIGluZGV4IGlzIHRoZVxuICogc2FtZSBhcyB0aGUgbWV0YWRhdGEgaW5kZXguIEZvciBpbnRlcnBvbGF0aW9ucyAoZS5nLiBgaWQ9XCJ7e2lkfX0te3tuYW1lfX1cImApLFxuICogdGhlcmUgY2FuIGJlIG11bHRpcGxlIGJpbmRpbmcgdmFsdWVzLCBzbyB3ZSBtaWdodCBoYXZlIHRvIGxvb3AgYmFja3dhcmRzXG4gKiBmcm9tIHRoZSBtZXRhZGF0YSBpbmRleCB1bnRpbCB3ZSBmaW5kIHRoZSBmaXJzdCBvbmUuXG4gKlxuICogQHBhcmFtIG1ldGFkYXRhSW5kZXggVGhlIGluZGV4IG9mIHRoZSBmaXJzdCBwcm9wZXJ0eSBtZXRhZGF0YSBzdHJpbmcgZm9yXG4gKiB0aGlzIG5vZGUuXG4gKiBAcGFyYW0gdERhdGEgVGhlIGRhdGEgYXJyYXkgZm9yIHRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcmV0dXJucyBUaGUgZmlyc3QgYmluZGluZyBpbmRleCBmb3IgdGhpcyBiaW5kaW5nXG4gKi9cbmZ1bmN0aW9uIGdldEZpcnN0QmluZGluZ0luZGV4KG1ldGFkYXRhSW5kZXg6IG51bWJlciwgdERhdGE6IFREYXRhKTogbnVtYmVyIHtcbiAgbGV0IGN1cnJlbnRCaW5kaW5nSW5kZXggPSBtZXRhZGF0YUluZGV4IC0gMTtcblxuICAvLyBJZiB0aGUgc2xvdCBiZWZvcmUgdGhlIG1ldGFkYXRhIGhvbGRzIGEgc3RyaW5nLCB3ZSBrbm93IHRoYXQgdGhpc1xuICAvLyBtZXRhZGF0YSBhcHBsaWVzIHRvIGFuIGludGVycG9sYXRpb24gd2l0aCBhdCBsZWFzdCAyIGJpbmRpbmdzLCBhbmRcbiAgLy8gd2UgbmVlZCB0byBzZWFyY2ggZnVydGhlciB0byBhY2Nlc3MgdGhlIGZpcnN0IGJpbmRpbmcgdmFsdWUuXG4gIGxldCBjdXJyZW50VmFsdWUgPSB0RGF0YVtjdXJyZW50QmluZGluZ0luZGV4XTtcblxuICAvLyBXZSBuZWVkIHRvIGl0ZXJhdGUgdW50aWwgd2UgaGl0IGVpdGhlciBhOlxuICAvLyAtIFROb2RlIChpdCBpcyBhbiBlbGVtZW50IHNsb3QgbWFya2luZyB0aGUgZW5kIG9mIGBjb25zdHNgIHNlY3Rpb24pLCBPUiBhXG4gIC8vIC0gbWV0YWRhdGEgc3RyaW5nIChzbG90IGlzIGF0dHJpYnV0ZSBtZXRhZGF0YSBvciBhIHByZXZpb3VzIG5vZGUncyBwcm9wZXJ0eSBtZXRhZGF0YSlcbiAgd2hpbGUgKHR5cGVvZiBjdXJyZW50VmFsdWUgPT09ICdzdHJpbmcnICYmICFpc1Byb3BNZXRhZGF0YVN0cmluZyhjdXJyZW50VmFsdWUpKSB7XG4gICAgY3VycmVudFZhbHVlID0gdERhdGFbLS1jdXJyZW50QmluZGluZ0luZGV4XTtcbiAgfVxuICByZXR1cm4gY3VycmVudEJpbmRpbmdJbmRleCArIDE7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RIb3N0UHJvcGVydHlCaW5kaW5ncyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4gIC8vIEhvc3QgYmluZGluZyB2YWx1ZXMgZm9yIGEgbm9kZSBhcmUgc3RvcmVkIGFmdGVyIGRpcmVjdGl2ZXMgb24gdGhhdCBub2RlXG4gIGxldCBob3N0UHJvcEluZGV4ID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBsZXQgcHJvcE1ldGFkYXRhID0gdERhdGFbaG9zdFByb3BJbmRleF0gYXMgYW55O1xuXG4gIC8vIFdoZW4gd2UgcmVhY2ggYSB2YWx1ZSBpbiBUVmlldy5kYXRhIHRoYXQgaXMgbm90IGEgc3RyaW5nLCB3ZSBrbm93IHdlJ3ZlXG4gIC8vIGhpdCB0aGUgbmV4dCBub2RlJ3MgcHJvdmlkZXJzIGFuZCBkaXJlY3RpdmVzIGFuZCBzaG91bGQgc3RvcCBjb3B5aW5nIGRhdGEuXG4gIHdoaWxlICh0eXBlb2YgcHJvcE1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHByb3BNZXRhZGF0YS5zcGxpdChJTlRFUlBPTEFUSU9OX0RFTElNSVRFUilbMF07XG4gICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gbFZpZXdbaG9zdFByb3BJbmRleF07XG4gICAgcHJvcE1ldGFkYXRhID0gdERhdGFbKytob3N0UHJvcEluZGV4XTtcbiAgfVxuICByZXR1cm4gcHJvcGVydGllcztcbn1cblxuXG4vLyBOZWVkIHRvIGtlZXAgdGhlIG5vZGVzIGluIGEgZ2xvYmFsIE1hcCBzbyB0aGF0IG11bHRpcGxlIGFuZ3VsYXIgYXBwcyBhcmUgc3VwcG9ydGVkLlxuY29uc3QgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZSA9IG5ldyBNYXA8YW55LCBEZWJ1Z05vZGU+KCk7XG5cbmZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUFJFX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICByZXR1cm4gX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5nZXQobmF0aXZlTm9kZSkgfHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IEVsZW1lbnQpOiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBOb2RlKTogRGVidWdOb2RlX19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogbnVsbCk6IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICBpZiAobmF0aXZlTm9kZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICByZXR1cm4gbmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/XG4gICAgICAgIG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhuYXRpdmVOb2RlIGFzIEVsZW1lbnQpIDpcbiAgICAgICAgbmV3IERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGdldERlYnVnTm9kZTogKG5hdGl2ZU5vZGU6IGFueSkgPT4gRGVidWdOb2RlIHwgbnVsbCA9IGdldERlYnVnTm9kZV9fUFJFX1IzX187XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxEZWJ1Z05vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS52YWx1ZXMoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleERlYnVnTm9kZShub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5zZXQobm9kZS5uYXRpdmVOb2RlLCBub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5kZWxldGUobm9kZS5uYXRpdmVOb2RlKTtcbn1cblxuLyoqXG4gKiBBIGJvb2xlYW4tdmFsdWVkIGZ1bmN0aW9uIG92ZXIgYSB2YWx1ZSwgcG9zc2libHkgaW5jbHVkaW5nIGNvbnRleHQgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyB0aGF0IHZhbHVlJ3MgcG9zaXRpb24gaW4gYW4gYXJyYXkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFByZWRpY2F0ZTxUPiB7ICh2YWx1ZTogVCk6IGJvb2xlYW47IH1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z05vZGU6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdOb2RlfSA9IERlYnVnTm9kZV9fUFJFX1IzX18gYXMgYW55O1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnRWxlbWVudDoge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z0VsZW1lbnR9ID0gRGVidWdFbGVtZW50X19QUkVfUjNfXyBhcyBhbnk7XG4iXX0=