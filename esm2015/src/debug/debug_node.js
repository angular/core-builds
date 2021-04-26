import { assertTNodeForLView } from '../render3/assert';
import { getLContext } from '../render3/context_discovery';
import { CONTAINER_HEADER_OFFSET, NATIVE } from '../render3/interfaces/container';
import { isComponentHost, isLContainer } from '../render3/interfaces/type_checks';
import { DECLARATION_COMPONENT_VIEW, PARENT, T_HOST, TVIEW } from '../render3/interfaces/view';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, getOwningComponent } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER } from '../render3/util/misc_utils';
import { renderStringify } from '../render3/util/stringify_utils';
import { getComponentLViewByIndex, getNativeByTNodeOrNull } from '../render3/util/view_utils';
import { assertDomNode } from '../util/assert';
/**
 * @publicApi
 */
export class DebugEventListener {
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}
export class DebugNode__PRE_R3__ {
    constructor(nativeNode, parent, _debugContext) {
        this.listeners = [];
        this.parent = null;
        this._debugContext = _debugContext;
        this.nativeNode = nativeNode;
        if (parent && parent instanceof DebugElement__PRE_R3__) {
            parent.addChild(this);
        }
    }
    get injector() {
        return this._debugContext.injector;
    }
    get componentInstance() {
        return this._debugContext.component;
    }
    get context() {
        return this._debugContext.context;
    }
    get references() {
        return this._debugContext.references;
    }
    get providerTokens() {
        return this._debugContext.providerTokens;
    }
}
export class DebugElement__PRE_R3__ extends DebugNode__PRE_R3__ {
    constructor(nativeNode, parent, _debugContext) {
        super(nativeNode, parent, _debugContext);
        this.properties = {};
        this.attributes = {};
        this.classes = {};
        this.styles = {};
        this.childNodes = [];
        this.nativeElement = nativeNode;
    }
    addChild(child) {
        if (child) {
            this.childNodes.push(child);
            child.parent = this;
        }
    }
    removeChild(child) {
        const childIndex = this.childNodes.indexOf(child);
        if (childIndex !== -1) {
            child.parent = null;
            this.childNodes.splice(childIndex, 1);
        }
    }
    insertChildrenAfter(child, newChildren) {
        const siblingIndex = this.childNodes.indexOf(child);
        if (siblingIndex !== -1) {
            this.childNodes.splice(siblingIndex + 1, 0, ...newChildren);
            newChildren.forEach(c => {
                if (c.parent) {
                    c.parent.removeChild(c);
                }
                child.parent = this;
            });
        }
    }
    insertBefore(refChild, newChild) {
        const refIndex = this.childNodes.indexOf(refChild);
        if (refIndex === -1) {
            this.addChild(newChild);
        }
        else {
            if (newChild.parent) {
                newChild.parent.removeChild(newChild);
            }
            newChild.parent = this;
            this.childNodes.splice(refIndex, 0, newChild);
        }
    }
    query(predicate) {
        const results = this.queryAll(predicate);
        return results[0] || null;
    }
    queryAll(predicate) {
        const matches = [];
        _queryElementChildren(this, predicate, matches);
        return matches;
    }
    queryAllNodes(predicate) {
        const matches = [];
        _queryNodeChildren(this, predicate, matches);
        return matches;
    }
    get children() {
        return this.childNodes //
            .filter((node) => node instanceof DebugElement__PRE_R3__);
    }
    triggerEventHandler(eventName, eventObj) {
        this.listeners.forEach((listener) => {
            if (listener.name == eventName) {
                listener.callback(eventObj);
            }
        });
    }
}
/**
 * @publicApi
 */
export function asNativeElements(debugEls) {
    return debugEls.map((el) => el.nativeElement);
}
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
    constructor(nativeNode) {
        this.nativeNode = nativeNode;
    }
    get parent() {
        const parent = this.nativeNode.parentNode;
        return parent ? new DebugElement__POST_R3__(parent) : null;
    }
    get injector() {
        return getInjector(this.nativeNode);
    }
    get componentInstance() {
        const nativeElement = this.nativeNode;
        return nativeElement &&
            (getComponent(nativeElement) || getOwningComponent(nativeElement));
    }
    get context() {
        return getComponent(this.nativeNode) || getContext(this.nativeNode);
    }
    get listeners() {
        return getListeners(this.nativeNode).filter(listener => listener.type === 'dom');
    }
    get references() {
        return getLocalRefs(this.nativeNode);
    }
    get providerTokens() {
        return getInjectionTokens(this.nativeNode);
    }
}
class DebugElement__POST_R3__ extends DebugNode__POST_R3__ {
    constructor(nativeNode) {
        ngDevMode && assertDomNode(nativeNode);
        super(nativeNode);
    }
    get nativeElement() {
        return this.nativeNode.nodeType == Node.ELEMENT_NODE ? this.nativeNode : null;
    }
    get name() {
        const context = getLContext(this.nativeNode);
        const lView = context ? context.lView : null;
        if (lView !== null) {
            const tData = lView[TVIEW].data;
            const tNode = tData[context.nodeIndex];
            return tNode.value;
        }
        else {
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
     */
    get properties() {
        const context = getLContext(this.nativeNode);
        const lView = context ? context.lView : null;
        if (lView === null) {
            return {};
        }
        const tData = lView[TVIEW].data;
        const tNode = tData[context.nodeIndex];
        const properties = {};
        // Collect properties from the DOM.
        copyDomProperties(this.nativeElement, properties);
        // Collect properties from the bindings. This is needed for animation renderer which has
        // synthetic properties which don't get reflected into the DOM.
        collectPropertyBindings(properties, tNode, lView, tData);
        return properties;
    }
    get attributes() {
        const attributes = {};
        const element = this.nativeElement;
        if (!element) {
            return attributes;
        }
        const context = getLContext(element);
        const lView = context ? context.lView : null;
        if (lView === null) {
            return {};
        }
        const tNodeAttrs = lView[TVIEW].data[context.nodeIndex].attrs;
        const lowercaseTNodeAttrs = [];
        // For debug nodes we take the element's attribute directly from the DOM since it allows us
        // to account for ones that weren't set via bindings (e.g. ViewEngine keeps track of the ones
        // that are set through `Renderer2`). The problem is that the browser will lowercase all names,
        // however since we have the attributes already on the TNode, we can preserve the case by going
        // through them once, adding them to the `attributes` map and putting their lower-cased name
        // into an array. Afterwards when we're going through the native DOM attributes, we can check
        // whether we haven't run into an attribute already through the TNode.
        if (tNodeAttrs) {
            let i = 0;
            while (i < tNodeAttrs.length) {
                const attrName = tNodeAttrs[i];
                // Stop as soon as we hit a marker. We only care about the regular attributes. Everything
                // else will be handled below when we read the final attributes off the DOM.
                if (typeof attrName !== 'string')
                    break;
                const attrValue = tNodeAttrs[i + 1];
                attributes[attrName] = attrValue;
                lowercaseTNodeAttrs.push(attrName.toLowerCase());
                i += 2;
            }
        }
        const eAttrs = element.attributes;
        for (let i = 0; i < eAttrs.length; i++) {
            const attr = eAttrs[i];
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
    get styles() {
        if (this.nativeElement && this.nativeElement.style) {
            return this.nativeElement.style;
        }
        return {};
    }
    get classes() {
        const result = {};
        const element = this.nativeElement;
        // SVG elements return an `SVGAnimatedString` instead of a plain string for the `className`.
        const className = element.className;
        const classes = className && typeof className !== 'string' ? className.baseVal.split(' ') :
            className.split(' ');
        classes.forEach((value) => result[value] = true);
        return result;
    }
    get childNodes() {
        const childNodes = this.nativeNode.childNodes;
        const children = [];
        for (let i = 0; i < childNodes.length; i++) {
            const element = childNodes[i];
            children.push(getDebugNode__POST_R3__(element));
        }
        return children;
    }
    get children() {
        const nativeElement = this.nativeElement;
        if (!nativeElement)
            return [];
        const childNodes = nativeElement.children;
        const children = [];
        for (let i = 0; i < childNodes.length; i++) {
            const element = childNodes[i];
            children.push(getDebugNode__POST_R3__(element));
        }
        return children;
    }
    query(predicate) {
        const results = this.queryAll(predicate);
        return results[0] || null;
    }
    queryAll(predicate) {
        const matches = [];
        _queryAllR3(this, predicate, matches, true);
        return matches;
    }
    queryAllNodes(predicate) {
        const matches = [];
        _queryAllR3(this, predicate, matches, false);
        return matches;
    }
    triggerEventHandler(eventName, eventObj) {
        const node = this.nativeNode;
        const invokedListeners = [];
        this.listeners.forEach(listener => {
            if (listener.name === eventName) {
                const callback = listener.callback;
                callback.call(node, eventObj);
                invokedListeners.push(callback);
            }
        });
        // We need to check whether `eventListeners` exists, because it's something
        // that Zone.js only adds to `EventTarget` in browser environments.
        if (typeof node.eventListeners === 'function') {
            // Note that in Ivy we wrap event listeners with a call to `event.preventDefault` in some
            // cases. We use '__ngUnwrap__' as a special token that gives us access to the actual event
            // listener.
            node.eventListeners(eventName).forEach((listener) => {
                // In order to ensure that we can detect the special __ngUnwrap__ token described above, we
                // use `toString` on the listener and see if it contains the token. We use this approach to
                // ensure that it still worked with compiled code since it cannot remove or rename string
                // literals. We also considered using a special function name (i.e. if(listener.name ===
                // special)) but that was more cumbersome and we were also concerned the compiled code could
                // strip the name, turning the condition in to ("" === "") and always returning true.
                if (listener.toString().indexOf('__ngUnwrap__') !== -1) {
                    const unwrappedListener = listener('__ngUnwrap__');
                    return invokedListeners.indexOf(unwrappedListener) === -1 &&
                        unwrappedListener.call(node, eventObj);
                }
            });
        }
    }
}
function copyDomProperties(element, properties) {
    if (element) {
        // Skip own properties (as those are patched)
        let obj = Object.getPrototypeOf(element);
        const NodePrototype = Node.prototype;
        while (obj !== null && obj !== NodePrototype) {
            const descriptors = Object.getOwnPropertyDescriptors(obj);
            for (let key in descriptors) {
                if (!key.startsWith('__') && !key.startsWith('on')) {
                    // don't include properties starting with `__` and `on`.
                    // `__` are patched values which should not be included.
                    // `on` are listeners which also should not be included.
                    const value = element[key];
                    if (isPrimitiveValue(value)) {
                        properties[key] = value;
                    }
                }
            }
            obj = Object.getPrototypeOf(obj);
        }
    }
}
function isPrimitiveValue(value) {
    return typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' ||
        value === null;
}
function _queryAllR3(parentElement, predicate, matches, elementsOnly) {
    const context = getLContext(parentElement.nativeNode);
    const lView = context ? context.lView : null;
    if (lView !== null) {
        const parentTNode = lView[TVIEW].data[context.nodeIndex];
        _queryNodeChildrenR3(parentTNode, lView, predicate, matches, elementsOnly, parentElement.nativeNode);
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
 * @param tNode the current TNode
 * @param lView the LView of this TNode
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _queryNodeChildrenR3(tNode, lView, predicate, matches, elementsOnly, rootNativeNode) {
    ngDevMode && assertTNodeForLView(tNode, lView);
    const nativeNode = getNativeByTNodeOrNull(tNode, lView);
    // For each type of TNode, specific logic is executed.
    if (tNode.type & (3 /* AnyRNode */ | 8 /* ElementContainer */)) {
        // Case 1: the TNode is an element
        // The native node has to be checked.
        _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
        if (isComponentHost(tNode)) {
            // If the element is the host of a component, then all nodes in its view have to be processed.
            // Note: the component's content (tNode.child) will be processed from the insertion points.
            const componentView = getComponentLViewByIndex(tNode.index, lView);
            if (componentView && componentView[TVIEW].firstChild) {
                _queryNodeChildrenR3(componentView[TVIEW].firstChild, componentView, predicate, matches, elementsOnly, rootNativeNode);
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
        const nodeOrContainer = lView[tNode.index];
        if (isLContainer(nodeOrContainer)) {
            _queryNodeChildrenInContainerR3(nodeOrContainer, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
    else if (tNode.type & 4 /* Container */) {
        // Case 2: the TNode is a container
        // The native node has to be checked.
        const lContainer = lView[tNode.index];
        _addQueryMatchR3(lContainer[NATIVE], predicate, matches, elementsOnly, rootNativeNode);
        // Each view inside the container has to be processed.
        _queryNodeChildrenInContainerR3(lContainer, predicate, matches, elementsOnly, rootNativeNode);
    }
    else if (tNode.type & 16 /* Projection */) {
        // Case 3: the TNode is a projection insertion point (i.e. a <ng-content>).
        // The nodes projected at this location all need to be processed.
        const componentView = lView[DECLARATION_COMPONENT_VIEW];
        const componentHost = componentView[T_HOST];
        const head = componentHost.projection[tNode.projection];
        if (Array.isArray(head)) {
            for (let nativeNode of head) {
                _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
            }
        }
        else if (head) {
            const nextLView = componentView[PARENT];
            const nextTNode = nextLView[TVIEW].data[head.index];
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
        const nextTNode = (tNode.flags & 4 /* isProjected */) ? tNode.projectionNext : tNode.next;
        if (nextTNode) {
            _queryNodeChildrenR3(nextTNode, lView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
}
/**
 * Process all TNodes in a given container.
 *
 * @param lContainer the container to be processed
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _queryNodeChildrenInContainerR3(lContainer, predicate, matches, elementsOnly, rootNativeNode) {
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        const childView = lContainer[i];
        const firstChild = childView[TVIEW].firstChild;
        if (firstChild) {
            _queryNodeChildrenR3(firstChild, childView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
}
/**
 * Match the current native node against the predicate.
 *
 * @param nativeNode the current native node
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode) {
    if (rootNativeNode !== nativeNode) {
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
        else if (!elementsOnly && predicate(debugNode) &&
            matches.indexOf(debugNode) === -1) {
            matches.push(debugNode);
        }
    }
}
/**
 * Match all the descendants of a DOM node against a predicate.
 *
 * @param nativeNode the current native node
 * @param predicate the predicate to match
 * @param matches the list where matches are stored
 * @param elementsOnly whether only elements should be searched
 */
function _queryNativeNodeDescendants(parentNode, predicate, matches, elementsOnly) {
    const nodes = parentNode.childNodes;
    const length = nodes.length;
    for (let i = 0; i < length; i++) {
        const node = nodes[i];
        const debugNode = getDebugNode(node);
        if (debugNode) {
            if (elementsOnly && debugNode instanceof DebugElement__POST_R3__ && predicate(debugNode) &&
                matches.indexOf(debugNode) === -1) {
                matches.push(debugNode);
            }
            else if (!elementsOnly && predicate(debugNode) &&
                matches.indexOf(debugNode) === -1) {
                matches.push(debugNode);
            }
            _queryNativeNodeDescendants(node, predicate, matches, elementsOnly);
        }
    }
}
/**
 * Iterates through the property bindings for a given node and generates
 * a map of property names to values. This map only contains property bindings
 * defined in templates, not in host bindings.
 */
function collectPropertyBindings(properties, tNode, lView, tData) {
    let bindingIndexes = tNode.propertyBindings;
    if (bindingIndexes !== null) {
        for (let i = 0; i < bindingIndexes.length; i++) {
            const bindingIndex = bindingIndexes[i];
            const propMetadata = tData[bindingIndex];
            const metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
            const propertyName = metadataParts[0];
            if (metadataParts.length > 1) {
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
const _nativeNodeToDebugNode = new Map();
function getDebugNode__PRE_R3__(nativeNode) {
    return _nativeNodeToDebugNode.get(nativeNode) || null;
}
const NG_DEBUG_PROPERTY = '__ng_debug__';
export function getDebugNode__POST_R3__(nativeNode) {
    if (nativeNode instanceof Node) {
        if (!(nativeNode.hasOwnProperty(NG_DEBUG_PROPERTY))) {
            nativeNode[NG_DEBUG_PROPERTY] = nativeNode.nodeType == Node.ELEMENT_NODE ?
                new DebugElement__POST_R3__(nativeNode) :
                new DebugNode__POST_R3__(nativeNode);
        }
        return nativeNode[NG_DEBUG_PROPERTY];
    }
    return null;
}
/**
 * @publicApi
 */
export const getDebugNode = getDebugNode__POST_R3__;
export function getDebugNodeR2__PRE_R3__(nativeNode) {
    return getDebugNode__PRE_R3__(nativeNode);
}
export function getDebugNodeR2__POST_R3__(_nativeNode) {
    return null;
}
export const getDebugNodeR2 = getDebugNodeR2__POST_R3__;
export function getAllDebugNodes() {
    return Array.from(_nativeNodeToDebugNode.values());
}
export function indexDebugNode(node) {
    _nativeNodeToDebugNode.set(node.nativeNode, node);
}
export function removeDebugNodeFromIndex(node) {
    _nativeNodeToDebugNode.delete(node.nativeNode);
}
/**
 * @publicApi
 */
export const DebugNode = DebugNode__POST_R3__;
/**
 * @publicApi
 */
export const DebugElement = DebugElement__POST_R3__;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3pELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUU1RixPQUFPLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQ2hGLE9BQU8sRUFBQywwQkFBMEIsRUFBUyxNQUFNLEVBQUUsTUFBTSxFQUFTLEtBQUssRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzNHLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDMUosT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDbkUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ2hFLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUk3Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxrQkFBa0I7SUFDN0IsWUFBbUIsSUFBWSxFQUFTLFFBQWtCO1FBQXZDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFVO0lBQUcsQ0FBQztDQUMvRDtBQWVELE1BQU0sT0FBTyxtQkFBbUI7SUFNOUIsWUFBWSxVQUFlLEVBQUUsTUFBc0IsRUFBRSxhQUEyQjtRQUx2RSxjQUFTLEdBQXlCLEVBQUUsQ0FBQztRQUNyQyxXQUFNLEdBQXNCLElBQUksQ0FBQztRQUt4QyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLE1BQU0sSUFBSSxNQUFNLFlBQVksc0JBQXNCLEVBQUU7WUFDdEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2QjtJQUNILENBQUM7SUFFRCxJQUFJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO0lBQ3JDLENBQUM7SUFFRCxJQUFJLGlCQUFpQjtRQUNuQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDWixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxJQUFJLGNBQWM7UUFDaEIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQztJQUMzQyxDQUFDO0NBQ0Y7QUFvQkQsTUFBTSxPQUFPLHNCQUF1QixTQUFRLG1CQUFtQjtJQVM3RCxZQUFZLFVBQWUsRUFBRSxNQUFXLEVBQUUsYUFBMkI7UUFDbkUsS0FBSyxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFSbEMsZUFBVSxHQUF5QixFQUFFLENBQUM7UUFDdEMsZUFBVSxHQUFpQyxFQUFFLENBQUM7UUFDOUMsWUFBTyxHQUE2QixFQUFFLENBQUM7UUFDdkMsV0FBTSxHQUFpQyxFQUFFLENBQUM7UUFDMUMsZUFBVSxHQUFnQixFQUFFLENBQUM7UUFLcEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUM7SUFDbEMsQ0FBQztJQUVELFFBQVEsQ0FBQyxLQUFnQjtRQUN2QixJQUFJLEtBQUssRUFBRTtZQUNULElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLEtBQTZCLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztTQUM5QztJQUNILENBQUM7SUFFRCxXQUFXLENBQUMsS0FBZ0I7UUFDMUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEQsSUFBSSxVQUFVLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDcEIsS0FBb0MsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ3BELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN2QztJQUNILENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxLQUFnQixFQUFFLFdBQXdCO1FBQzVELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BELElBQUksWUFBWSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsV0FBVyxDQUFDLENBQUM7WUFDNUQsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEIsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO29CQUNYLENBQUMsQ0FBQyxNQUFpQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDckQ7Z0JBQ0EsS0FBNkIsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQy9DLENBQUMsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0lBRUQsWUFBWSxDQUFDLFFBQW1CLEVBQUUsUUFBbUI7UUFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkQsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6QjthQUFNO1lBQ0wsSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNsQixRQUFRLENBQUMsTUFBaUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDbkU7WUFDQSxRQUFnQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDaEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUMvQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsU0FBa0M7UUFDdEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELFFBQVEsQ0FBQyxTQUFrQztRQUN6QyxNQUFNLE9BQU8sR0FBbUIsRUFBRSxDQUFDO1FBQ25DLHFCQUFxQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEQsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVELGFBQWEsQ0FBQyxTQUErQjtRQUMzQyxNQUFNLE9BQU8sR0FBZ0IsRUFBRSxDQUFDO1FBQ2hDLGtCQUFrQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0MsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVELElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBRSxFQUFFO2FBQ2QsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFlBQVksc0JBQXNCLENBQW1CLENBQUM7SUFDekYsQ0FBQztJQUVELG1CQUFtQixDQUFDLFNBQWlCLEVBQUUsUUFBYTtRQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQ2xDLElBQUksUUFBUSxDQUFDLElBQUksSUFBSSxTQUFTLEVBQUU7Z0JBQzlCLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDN0I7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLFFBQXdCO0lBQ3ZELE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2hELENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUMxQixPQUFxQixFQUFFLFNBQWtDLEVBQUUsT0FBdUI7SUFDcEYsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDaEMsSUFBSSxJQUFJLFlBQVksc0JBQXNCLEVBQUU7WUFDMUMsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ25CLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEI7WUFDRCxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2pEO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FDdkIsVUFBcUIsRUFBRSxTQUErQixFQUFFLE9BQW9CO0lBQzlFLElBQUksVUFBVSxZQUFZLHNCQUFzQixFQUFFO1FBQ2hELFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ25DLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNuQixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3BCO1lBQ0QsSUFBSSxJQUFJLFlBQVksc0JBQXNCLEVBQUU7Z0JBQzFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDOUM7UUFDSCxDQUFDLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQztBQUVELE1BQU0sb0JBQW9CO0lBR3hCLFlBQVksVUFBZ0I7UUFDMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVELElBQUksTUFBTTtRQUNSLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBcUIsQ0FBQztRQUNyRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQzdELENBQUM7SUFFRCxJQUFJLFFBQVE7UUFDVixPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELElBQUksaUJBQWlCO1FBQ25CLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDdEMsT0FBTyxhQUFhO1lBQ2hCLENBQUMsWUFBWSxDQUFDLGFBQXdCLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7SUFDRCxJQUFJLE9BQU87UUFDVCxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBcUIsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBcUIsQ0FBQyxDQUFDO0lBQzVGLENBQUM7SUFFRCxJQUFJLFNBQVM7UUFDWCxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBcUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUM7SUFDOUYsQ0FBQztJQUVELElBQUksVUFBVTtRQUNaLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsSUFBSSxjQUFjO1FBQ2hCLE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDLFVBQXFCLENBQUMsQ0FBQztJQUN4RCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLHVCQUF3QixTQUFRLG9CQUFvQjtJQUN4RCxZQUFZLFVBQW1CO1FBQzdCLFNBQVMsSUFBSSxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxJQUFJLGFBQWE7UUFDZixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDM0YsQ0FBQztJQUVELElBQUksSUFBSTtRQUNOLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFFLENBQUM7UUFDOUMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFN0MsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ2xCLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDaEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVUsQ0FBQztZQUNoRCxPQUFPLEtBQUssQ0FBQyxLQUFNLENBQUM7U0FDckI7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7U0FDakM7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxJQUFJLFVBQVU7UUFDWixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBRSxDQUFDO1FBQzlDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRTdDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtZQUNsQixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBRUQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNoQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBVSxDQUFDO1FBRWhELE1BQU0sVUFBVSxHQUE0QixFQUFFLENBQUM7UUFDL0MsbUNBQW1DO1FBQ25DLGlCQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbEQsd0ZBQXdGO1FBQ3hGLCtEQUErRDtRQUMvRCx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1osTUFBTSxVQUFVLEdBQWtDLEVBQUUsQ0FBQztRQUNyRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBRW5DLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixPQUFPLFVBQVUsQ0FBQztTQUNuQjtRQUVELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUN0QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUU3QyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7WUFDbEIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUVELE1BQU0sVUFBVSxHQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBVyxDQUFDLEtBQUssQ0FBQztRQUN6RSxNQUFNLG1CQUFtQixHQUFhLEVBQUUsQ0FBQztRQUV6QywyRkFBMkY7UUFDM0YsNkZBQTZGO1FBQzdGLCtGQUErRjtRQUMvRiwrRkFBK0Y7UUFDL0YsNEZBQTRGO1FBQzVGLDZGQUE2RjtRQUM3RixzRUFBc0U7UUFDdEUsSUFBSSxVQUFVLEVBQUU7WUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixPQUFPLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUM1QixNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRS9CLHlGQUF5RjtnQkFDekYsNEVBQTRFO2dCQUM1RSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVE7b0JBQUUsTUFBTTtnQkFFeEMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFNBQW1CLENBQUM7Z0JBQzNDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFFakQsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNSO1NBQ0Y7UUFFRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRTlDLGdFQUFnRTtZQUNoRSxnRUFBZ0U7WUFDaEUsSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JELGtFQUFrRTtnQkFDbEUsMkVBQTJFO2dCQUMzRSxVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzthQUN4QztTQUNGO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVELElBQUksTUFBTTtRQUNSLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSyxJQUFJLENBQUMsYUFBNkIsQ0FBQyxLQUFLLEVBQUU7WUFDbkUsT0FBUSxJQUFJLENBQUMsYUFBNkIsQ0FBQyxLQUE2QixDQUFDO1NBQzFFO1FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQsSUFBSSxPQUFPO1FBQ1QsTUFBTSxNQUFNLEdBQThCLEVBQUUsQ0FBQztRQUM3QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBeUMsQ0FBQztRQUUvRCw0RkFBNEY7UUFDNUYsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQXVDLENBQUM7UUFDbEUsTUFBTSxPQUFPLEdBQUcsU0FBUyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM5QixTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRWxGLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUV6RCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1osTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDOUMsTUFBTSxRQUFRLEdBQWdCLEVBQUUsQ0FBQztRQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsUUFBUSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQ2pEO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVELElBQUksUUFBUTtRQUNWLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDekMsSUFBSSxDQUFDLGFBQWE7WUFBRSxPQUFPLEVBQUUsQ0FBQztRQUM5QixNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDO1FBQzFDLE1BQU0sUUFBUSxHQUFtQixFQUFFLENBQUM7UUFDcEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDMUMsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNqRDtRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxLQUFLLENBQUMsU0FBa0M7UUFDdEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELFFBQVEsQ0FBQyxTQUFrQztRQUN6QyxNQUFNLE9BQU8sR0FBbUIsRUFBRSxDQUFDO1FBQ25DLFdBQVcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1QyxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQsYUFBYSxDQUFDLFNBQStCO1FBQzNDLE1BQU0sT0FBTyxHQUFnQixFQUFFLENBQUM7UUFDaEMsV0FBVyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxTQUFpQixFQUFFLFFBQWE7UUFDbEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQWlCLENBQUM7UUFDcEMsTUFBTSxnQkFBZ0IsR0FBZSxFQUFFLENBQUM7UUFFeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDaEMsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFDL0IsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQztnQkFDbkMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzlCLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNqQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsMkVBQTJFO1FBQzNFLG1FQUFtRTtRQUNuRSxJQUFJLE9BQU8sSUFBSSxDQUFDLGNBQWMsS0FBSyxVQUFVLEVBQUU7WUFDN0MseUZBQXlGO1lBQ3pGLDJGQUEyRjtZQUMzRixZQUFZO1lBQ1osSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFrQixFQUFFLEVBQUU7Z0JBQzVELDJGQUEyRjtnQkFDM0YsMkZBQTJGO2dCQUMzRix5RkFBeUY7Z0JBQ3pGLHdGQUF3RjtnQkFDeEYsNEZBQTRGO2dCQUM1RixxRkFBcUY7Z0JBQ3JGLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtvQkFDdEQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ25ELE9BQU8sZ0JBQWdCLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNyRCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUM1QztZQUNILENBQUMsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxTQUFTLGlCQUFpQixDQUFDLE9BQXFCLEVBQUUsVUFBb0M7SUFDcEYsSUFBSSxPQUFPLEVBQUU7UUFDWCw2Q0FBNkM7UUFDN0MsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QyxNQUFNLGFBQWEsR0FBUSxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzFDLE9BQU8sR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLEtBQUssYUFBYSxFQUFFO1lBQzVDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxRCxLQUFLLElBQUksR0FBRyxJQUFJLFdBQVcsRUFBRTtnQkFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNsRCx3REFBd0Q7b0JBQ3hELHdEQUF3RDtvQkFDeEQsd0RBQXdEO29CQUN4RCxNQUFNLEtBQUssR0FBSSxPQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3BDLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQzNCLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7cUJBQ3pCO2lCQUNGO2FBQ0Y7WUFDRCxHQUFHLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNsQztLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsS0FBVTtJQUNsQyxPQUFPLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtRQUN2RixLQUFLLEtBQUssSUFBSSxDQUFDO0FBQ3JCLENBQUM7QUFnQkQsU0FBUyxXQUFXLENBQ2hCLGFBQTJCLEVBQUUsU0FBdUQsRUFDcEYsT0FBbUMsRUFBRSxZQUFxQjtJQUM1RCxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBRSxDQUFDO0lBQ3ZELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQzdDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNsQixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVUsQ0FBQztRQUNsRSxvQkFBb0IsQ0FDaEIsV0FBVyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDckY7U0FBTTtRQUNMLCtGQUErRjtRQUMvRixRQUFRO1FBQ1IsMkJBQTJCLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ3pGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILFNBQVMsb0JBQW9CLENBQ3pCLEtBQVksRUFBRSxLQUFZLEVBQUUsU0FBdUQsRUFDbkYsT0FBbUMsRUFBRSxZQUFxQixFQUFFLGNBQW1CO0lBQ2pGLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDL0MsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3hELHNEQUFzRDtJQUN0RCxJQUFJLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQywyQ0FBK0MsQ0FBQyxFQUFFO1FBQ2xFLGtDQUFrQztRQUNsQyxxQ0FBcUM7UUFDckMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQy9FLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzFCLDhGQUE4RjtZQUM5RiwyRkFBMkY7WUFDM0YsTUFBTSxhQUFhLEdBQUcsd0JBQXdCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuRSxJQUFJLGFBQWEsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxFQUFFO2dCQUNwRCxvQkFBb0IsQ0FDaEIsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVcsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQ2pGLGNBQWMsQ0FBQyxDQUFDO2FBQ3JCO1NBQ0Y7YUFBTTtZQUNMLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtnQkFDZixnREFBZ0Q7Z0JBQ2hELG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQzVGO1lBRUQscUZBQXFGO1lBQ3JGLDZGQUE2RjtZQUM3Rix3RkFBd0Y7WUFDeEYsc0ZBQXNGO1lBQ3RGLHFGQUFxRjtZQUNyRix5RUFBeUU7WUFDekUsaUVBQWlFO1lBQ2pFLDRFQUE0RTtZQUM1RSxVQUFVLElBQUksMkJBQTJCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDekY7UUFDRCwyRkFBMkY7UUFDM0YsYUFBYTtRQUNiLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDakMsK0JBQStCLENBQzNCLGVBQWUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN4RTtLQUNGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxvQkFBc0IsRUFBRTtRQUMzQyxtQ0FBbUM7UUFDbkMscUNBQXFDO1FBQ3JDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3ZGLHNEQUFzRDtRQUN0RCwrQkFBK0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDL0Y7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLHNCQUF1QixFQUFFO1FBQzVDLDJFQUEyRTtRQUMzRSxpRUFBaUU7UUFDakUsTUFBTSxhQUFhLEdBQUcsS0FBTSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDekQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBaUIsQ0FBQztRQUM1RCxNQUFNLElBQUksR0FDTCxhQUFhLENBQUMsVUFBK0IsQ0FBQyxLQUFLLENBQUMsVUFBb0IsQ0FBQyxDQUFDO1FBRS9FLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2QixLQUFLLElBQUksVUFBVSxJQUFJLElBQUksRUFBRTtnQkFDM0IsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQ2hGO1NBQ0Y7YUFBTSxJQUFJLElBQUksRUFBRTtZQUNmLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQVcsQ0FBQztZQUNsRCxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQVUsQ0FBQztZQUM3RCxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQzlGO0tBQ0Y7U0FBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDdEIsK0JBQStCO1FBQy9CLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQzVGO0lBRUQsNERBQTREO0lBQzVELElBQUksY0FBYyxLQUFLLFVBQVUsRUFBRTtRQUNqQyw0RkFBNEY7UUFDNUYsa0VBQWtFO1FBQ2xFLE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssc0JBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztRQUM3RixJQUFJLFNBQVMsRUFBRTtZQUNiLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDMUY7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsK0JBQStCLENBQ3BDLFVBQXNCLEVBQUUsU0FBdUQsRUFDL0UsT0FBbUMsRUFBRSxZQUFxQixFQUFFLGNBQW1CO0lBQ2pGLEtBQUssSUFBSSxDQUFDLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEUsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBVSxDQUFDO1FBQ3pDLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFDL0MsSUFBSSxVQUFVLEVBQUU7WUFDZCxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQy9GO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLGdCQUFnQixDQUNyQixVQUFlLEVBQUUsU0FBdUQsRUFDeEUsT0FBbUMsRUFBRSxZQUFxQixFQUFFLGNBQW1CO0lBQ2pGLElBQUksY0FBYyxLQUFLLFVBQVUsRUFBRTtRQUNqQyxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE9BQU87U0FDUjtRQUNELDJFQUEyRTtRQUMzRSwrRUFBK0U7UUFDL0UsdUVBQXVFO1FBQ3ZFLElBQUksWUFBWSxJQUFJLFNBQVMsWUFBWSx1QkFBdUIsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQ3BGLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDckMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN6QjthQUFNLElBQ0gsQ0FBQyxZQUFZLElBQUssU0FBa0MsQ0FBQyxTQUFTLENBQUM7WUFDOUQsT0FBdUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDckQsT0FBdUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDMUM7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsU0FBUywyQkFBMkIsQ0FDaEMsVUFBZSxFQUFFLFNBQXVELEVBQ3hFLE9BQW1DLEVBQUUsWUFBcUI7SUFDNUQsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQztJQUNwQyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBRTVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDL0IsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyQyxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksWUFBWSxJQUFJLFNBQVMsWUFBWSx1QkFBdUIsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDO2dCQUNwRixPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3pCO2lCQUFNLElBQ0gsQ0FBQyxZQUFZLElBQUssU0FBa0MsQ0FBQyxTQUFTLENBQUM7Z0JBQzlELE9BQXVCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUNyRCxPQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUMxQztZQUVELDJCQUEyQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1NBQ3JFO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsdUJBQXVCLENBQzVCLFVBQW1DLEVBQUUsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFZO0lBQy9FLElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztJQUU1QyxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsTUFBTSxZQUFZLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQVcsQ0FBQztZQUNuRCxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDbEUsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzVCLElBQUksS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNqRCxLQUFLLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDOUU7Z0JBQ0QsVUFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLEtBQUssQ0FBQzthQUNsQztpQkFBTTtnQkFDTCxVQUFVLENBQUMsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO2FBQ2hEO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFHRCxzRkFBc0Y7QUFDdEYsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztBQUV6RCxTQUFTLHNCQUFzQixDQUFDLFVBQWU7SUFDN0MsT0FBTyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDO0FBQ3hELENBQUM7QUFFRCxNQUFNLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztBQUt6QyxNQUFNLFVBQVUsdUJBQXVCLENBQUMsVUFBZTtJQUNyRCxJQUFJLFVBQVUsWUFBWSxJQUFJLEVBQUU7UUFDOUIsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUU7WUFDbEQsVUFBa0IsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUMvRSxJQUFJLHVCQUF1QixDQUFDLFVBQXFCLENBQUMsQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsT0FBUSxVQUFrQixDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FsQlQsdUJBa0J5RSxDQUFDO0FBRzFGLE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxVQUFlO0lBQ3RELE9BQU8sc0JBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVELE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxXQUFnQjtJQUN4RCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBSlgseUJBSTZFLENBQUM7QUFHOUYsTUFBTSxVQUFVLGdCQUFnQjtJQUM5QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxJQUFlO0lBQzVDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsSUFBZTtJQUN0RCxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFZRDs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0Fqa0JoQixvQkFpa0J5RSxDQUFDO0FBRWhGOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQWhpQm5CLHVCQWdpQmtGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHthc3NlcnRUTm9kZUZvckxWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2Fzc2VydCc7XG5pbXBvcnQge2dldExDb250ZXh0fSBmcm9tICcuLi9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE5BVElWRX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudEhvc3QsIGlzTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7REVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIExWaWV3LCBQQVJFTlQsIFRfSE9TVCwgVERhdGEsIFRWSUVXfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENvbXBvbmVudCwgZ2V0Q29udGV4dCwgZ2V0SW5qZWN0aW9uVG9rZW5zLCBnZXRJbmplY3RvciwgZ2V0TGlzdGVuZXJzLCBnZXRMb2NhbFJlZnMsIGdldE93bmluZ0NvbXBvbmVudH0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbH0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREb21Ob2RlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldy90eXBlcyc7XG5cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWJ1Z0V2ZW50TGlzdGVuZXIge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgY2FsbGJhY2s6IEZ1bmN0aW9uKSB7fVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGUge1xuICByZWFkb25seSBsaXN0ZW5lcnM6IERlYnVnRXZlbnRMaXN0ZW5lcltdO1xuICByZWFkb25seSBwYXJlbnQ6IERlYnVnRWxlbWVudHxudWxsO1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBhbnk7XG4gIHJlYWRvbmx5IGluamVjdG9yOiBJbmplY3RvcjtcbiAgcmVhZG9ubHkgY29tcG9uZW50SW5zdGFuY2U6IGFueTtcbiAgcmVhZG9ubHkgY29udGV4dDogYW55O1xuICByZWFkb25seSByZWZlcmVuY2VzOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgcmVhZG9ubHkgcHJvdmlkZXJUb2tlbnM6IGFueVtdO1xufVxuZXhwb3J0IGNsYXNzIERlYnVnTm9kZV9fUFJFX1IzX18ge1xuICByZWFkb25seSBsaXN0ZW5lcnM6IERlYnVnRXZlbnRMaXN0ZW5lcltdID0gW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGwgPSBudWxsO1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBhbnk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBEZWJ1Z05vZGV8bnVsbCwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgdGhpcy5fZGVidWdDb250ZXh0ID0gX2RlYnVnQ29udGV4dDtcbiAgICB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlO1xuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50IGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgcGFyZW50LmFkZENoaWxkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5pbmplY3RvcjtcbiAgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29tcG9uZW50O1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbnRleHQ7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5yZWZlcmVuY2VzO1xuICB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnByb3ZpZGVyVG9rZW5zO1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnRWxlbWVudCBleHRlbmRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd8bnVsbH07XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfG51bGx9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuICByZWFkb25seSBjaGlsZHJlbjogRGVidWdFbGVtZW50W107XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudDtcbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdO1xuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXTtcbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQ7XG59XG5leHBvcnQgY2xhc3MgRGVidWdFbGVtZW50X19QUkVfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUFJFX1IzX18gaW1wbGVtZW50cyBEZWJ1Z0VsZW1lbnQge1xuICByZWFkb25seSBuYW1lITogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICByZWFkb25seSBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd8bnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBhbnksIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUsIHBhcmVudCwgX2RlYnVnQ29udGV4dCk7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlTm9kZTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5wdXNoKGNoaWxkKTtcbiAgICAgIChjaGlsZCBhcyB7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBjb25zdCBjaGlsZEluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChjaGlsZEluZGV4ICE9PSAtMSkge1xuICAgICAgKGNoaWxkIGFzIHtwYXJlbnQ6IERlYnVnTm9kZSB8IG51bGx9KS5wYXJlbnQgPSBudWxsO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShjaGlsZEluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRDaGlsZHJlbkFmdGVyKGNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkcmVuOiBEZWJ1Z05vZGVbXSkge1xuICAgIGNvbnN0IHNpYmxpbmdJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoc2libGluZ0luZGV4ICE9PSAtMSkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShzaWJsaW5nSW5kZXggKyAxLCAwLCAuLi5uZXdDaGlsZHJlbik7XG4gICAgICBuZXdDaGlsZHJlbi5mb3JFYWNoKGMgPT4ge1xuICAgICAgICBpZiAoYy5wYXJlbnQpIHtcbiAgICAgICAgICAoYy5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQoYyk7XG4gICAgICAgIH1cbiAgICAgICAgKGNoaWxkIGFzIHtwYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocmVmQ2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGQ6IERlYnVnTm9kZSk6IHZvaWQge1xuICAgIGNvbnN0IHJlZkluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YocmVmQ2hpbGQpO1xuICAgIGlmIChyZWZJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQobmV3Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV3Q2hpbGQucGFyZW50KSB7XG4gICAgICAgIChuZXdDaGlsZC5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQobmV3Q2hpbGQpO1xuICAgICAgfVxuICAgICAgKG5ld0NoaWxkIGFzIHtwYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB0aGlzLmNoaWxkTm9kZXMuc3BsaWNlKHJlZkluZGV4LCAwLCBuZXdDaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTm9kZXMgIC8vXG4gICAgICAgICAgICAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykgYXMgRGVidWdFbGVtZW50W107XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGlmIChsaXN0ZW5lci5uYW1lID09IGV2ZW50TmFtZSkge1xuICAgICAgICBsaXN0ZW5lci5jYWxsYmFjayhldmVudE9iaik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc05hdGl2ZUVsZW1lbnRzKGRlYnVnRWxzOiBEZWJ1Z0VsZW1lbnRbXSk6IGFueSB7XG4gIHJldHVybiBkZWJ1Z0Vscy5tYXAoKGVsKSA9PiBlbC5uYXRpdmVFbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5RWxlbWVudENoaWxkcmVuKFxuICAgIGVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10pIHtcbiAgZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbihcbiAgICBwYXJlbnROb2RlOiBEZWJ1Z05vZGUsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdKSB7XG4gIGlmIChwYXJlbnROb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgIHBhcmVudE5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgRGVidWdOb2RlX19QT1NUX1IzX18gaW1wbGVtZW50cyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBOb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IE5vZGUpIHtcbiAgICB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlO1xuICB9XG5cbiAgZ2V0IHBhcmVudCgpOiBEZWJ1Z0VsZW1lbnR8bnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5uYXRpdmVOb2RlLnBhcmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICByZXR1cm4gcGFyZW50ID8gbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKHBhcmVudCkgOiBudWxsO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICByZXR1cm4gZ2V0SW5qZWN0b3IodGhpcy5uYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBjb21wb25lbnRJbnN0YW5jZSgpOiBhbnkge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZU5vZGU7XG4gICAgcmV0dXJuIG5hdGl2ZUVsZW1lbnQgJiZcbiAgICAgICAgKGdldENvbXBvbmVudChuYXRpdmVFbGVtZW50IGFzIEVsZW1lbnQpIHx8IGdldE93bmluZ0NvbXBvbmVudChuYXRpdmVFbGVtZW50KSk7XG4gIH1cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICByZXR1cm4gZ2V0Q29tcG9uZW50KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KSB8fCBnZXRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTtcbiAgfVxuXG4gIGdldCBsaXN0ZW5lcnMoKTogRGVidWdFdmVudExpc3RlbmVyW10ge1xuICAgIHJldHVybiBnZXRMaXN0ZW5lcnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpLmZpbHRlcihsaXN0ZW5lciA9PiBsaXN0ZW5lci50eXBlID09PSAnZG9tJyk7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIHJldHVybiBnZXRMb2NhbFJlZnModGhpcy5uYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIGdldEluamVjdGlvblRva2Vucyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7XG4gIH1cbn1cblxuY2xhc3MgRGVidWdFbGVtZW50X19QT1NUX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBuYXRpdmVFbGVtZW50KCk6IEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/IHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50IDogbnVsbDtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgY29uc3QgY29udGV4dCA9IGdldExDb250ZXh0KHRoaXMubmF0aXZlTm9kZSkhO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dCA/IGNvbnRleHQubFZpZXcgOiBudWxsO1xuXG4gICAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gICAgICByZXR1cm4gdE5vZGUudmFsdWUhO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVOYW1lO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiAgR2V0cyBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byBwcm9wZXJ0eSB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqICBUaGlzIG1hcCBpbmNsdWRlczpcbiAgICogIC0gUmVndWxhciBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgW2lkXT1cImlkXCJgKVxuICAgKiAgLSBIb3N0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBob3N0OiB7ICdbaWRdJzogXCJpZFwiIH1gKVxuICAgKiAgLSBJbnRlcnBvbGF0ZWQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGlkPVwie3sgdmFsdWUgfX1cIilcbiAgICpcbiAgICogIEl0IGRvZXMgbm90IGluY2x1ZGU6XG4gICAqICAtIGlucHV0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbbXlDdXN0b21JbnB1dF09XCJ2YWx1ZVwiYClcbiAgICogIC0gYXR0cmlidXRlIGJpbmRpbmdzIChlLmcuIGBbYXR0ci5yb2xlXT1cIm1lbnVcImApXG4gICAqL1xuICBnZXQgcHJvcGVydGllcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBnZXRMQ29udGV4dCh0aGlzLm5hdGl2ZU5vZGUpITtcbiAgICBjb25zdCBsVmlldyA9IGNvbnRleHQgPyBjb250ZXh0LmxWaWV3IDogbnVsbDtcblxuICAgIGlmIChsVmlldyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG5cbiAgICBjb25zdCBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICAgIC8vIENvbGxlY3QgcHJvcGVydGllcyBmcm9tIHRoZSBET00uXG4gICAgY29weURvbVByb3BlcnRpZXModGhpcy5uYXRpdmVFbGVtZW50LCBwcm9wZXJ0aWVzKTtcbiAgICAvLyBDb2xsZWN0IHByb3BlcnRpZXMgZnJvbSB0aGUgYmluZGluZ3MuIFRoaXMgaXMgbmVlZGVkIGZvciBhbmltYXRpb24gcmVuZGVyZXIgd2hpY2ggaGFzXG4gICAgLy8gc3ludGhldGljIHByb3BlcnRpZXMgd2hpY2ggZG9uJ3QgZ2V0IHJlZmxlY3RlZCBpbnRvIHRoZSBET00uXG4gICAgY29sbGVjdFByb3BlcnR5QmluZGluZ3MocHJvcGVydGllcywgdE5vZGUsIGxWaWV3LCB0RGF0YSk7XG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH1cblxuICBnZXQgYXR0cmlidXRlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfG51bGw7fSB7XG4gICAgY29uc3QgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZ3xudWxsO30gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZXh0ID0gZ2V0TENvbnRleHQoZWxlbWVudCkhO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dCA/IGNvbnRleHQubFZpZXcgOiBudWxsO1xuXG4gICAgaWYgKGxWaWV3ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgY29uc3QgdE5vZGVBdHRycyA9IChsVmlld1tUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGUpLmF0dHJzO1xuICAgIGNvbnN0IGxvd2VyY2FzZVROb2RlQXR0cnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyBGb3IgZGVidWcgbm9kZXMgd2UgdGFrZSB0aGUgZWxlbWVudCdzIGF0dHJpYnV0ZSBkaXJlY3RseSBmcm9tIHRoZSBET00gc2luY2UgaXQgYWxsb3dzIHVzXG4gICAgLy8gdG8gYWNjb3VudCBmb3Igb25lcyB0aGF0IHdlcmVuJ3Qgc2V0IHZpYSBiaW5kaW5ncyAoZS5nLiBWaWV3RW5naW5lIGtlZXBzIHRyYWNrIG9mIHRoZSBvbmVzXG4gICAgLy8gdGhhdCBhcmUgc2V0IHRocm91Z2ggYFJlbmRlcmVyMmApLiBUaGUgcHJvYmxlbSBpcyB0aGF0IHRoZSBicm93c2VyIHdpbGwgbG93ZXJjYXNlIGFsbCBuYW1lcyxcbiAgICAvLyBob3dldmVyIHNpbmNlIHdlIGhhdmUgdGhlIGF0dHJpYnV0ZXMgYWxyZWFkeSBvbiB0aGUgVE5vZGUsIHdlIGNhbiBwcmVzZXJ2ZSB0aGUgY2FzZSBieSBnb2luZ1xuICAgIC8vIHRocm91Z2ggdGhlbSBvbmNlLCBhZGRpbmcgdGhlbSB0byB0aGUgYGF0dHJpYnV0ZXNgIG1hcCBhbmQgcHV0dGluZyB0aGVpciBsb3dlci1jYXNlZCBuYW1lXG4gICAgLy8gaW50byBhbiBhcnJheS4gQWZ0ZXJ3YXJkcyB3aGVuIHdlJ3JlIGdvaW5nIHRocm91Z2ggdGhlIG5hdGl2ZSBET00gYXR0cmlidXRlcywgd2UgY2FuIGNoZWNrXG4gICAgLy8gd2hldGhlciB3ZSBoYXZlbid0IHJ1biBpbnRvIGFuIGF0dHJpYnV0ZSBhbHJlYWR5IHRocm91Z2ggdGhlIFROb2RlLlxuICAgIGlmICh0Tm9kZUF0dHJzKSB7XG4gICAgICBsZXQgaSA9IDA7XG4gICAgICB3aGlsZSAoaSA8IHROb2RlQXR0cnMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gdE5vZGVBdHRyc1tpXTtcblxuICAgICAgICAvLyBTdG9wIGFzIHNvb24gYXMgd2UgaGl0IGEgbWFya2VyLiBXZSBvbmx5IGNhcmUgYWJvdXQgdGhlIHJlZ3VsYXIgYXR0cmlidXRlcy4gRXZlcnl0aGluZ1xuICAgICAgICAvLyBlbHNlIHdpbGwgYmUgaGFuZGxlZCBiZWxvdyB3aGVuIHdlIHJlYWQgdGhlIGZpbmFsIGF0dHJpYnV0ZXMgb2ZmIHRoZSBET00uXG4gICAgICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgIT09ICdzdHJpbmcnKSBicmVhaztcblxuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSB0Tm9kZUF0dHJzW2kgKyAxXTtcbiAgICAgICAgYXR0cmlidXRlc1thdHRyTmFtZV0gPSBhdHRyVmFsdWUgYXMgc3RyaW5nO1xuICAgICAgICBsb3dlcmNhc2VUTm9kZUF0dHJzLnB1c2goYXR0ck5hbWUudG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGVBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVBdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYXR0ciA9IGVBdHRyc1tpXTtcbiAgICAgIGNvbnN0IGxvd2VyY2FzZU5hbWUgPSBhdHRyLm5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgYXNzaWduIHRoZSBzYW1lIGF0dHJpYnV0ZSBib3RoIGluIGl0c1xuICAgICAgLy8gY2FzZS1zZW5zaXRpdmUgZm9ybSBhbmQgdGhlIGxvd2VyLWNhc2VkIG9uZSBmcm9tIHRoZSBicm93c2VyLlxuICAgICAgaWYgKGxvd2VyY2FzZVROb2RlQXR0cnMuaW5kZXhPZihsb3dlcmNhc2VOYW1lKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gU2F2ZSB0aGUgbG93ZXJjYXNlIG5hbWUgdG8gYWxpZ24gdGhlIGJlaGF2aW9yIGJldHdlZW4gYnJvd3NlcnMuXG4gICAgICAgIC8vIElFIHByZXNlcnZlcyB0aGUgY2FzZSwgd2hpbGUgYWxsIG90aGVyIGJyb3dzZXIgY29udmVydCBpdCB0byBsb3dlciBjYXNlLlxuICAgICAgICBhdHRyaWJ1dGVzW2xvd2VyY2FzZU5hbWVdID0gYXR0ci52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlcztcbiAgfVxuXG4gIGdldCBzdHlsZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZ3xudWxsfSB7XG4gICAgaWYgKHRoaXMubmF0aXZlRWxlbWVudCAmJiAodGhpcy5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZSkge1xuICAgICAgcmV0dXJuICh0aGlzLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlIGFzIHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cblxuICBnZXQgY2xhc3NlcygpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9IHtcbiAgICBjb25zdCByZXN1bHQ6IHtba2V5OiBzdHJpbmddOiBib29sZWFuO30gPSB7fTtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudDtcblxuICAgIC8vIFNWRyBlbGVtZW50cyByZXR1cm4gYW4gYFNWR0FuaW1hdGVkU3RyaW5nYCBpbnN0ZWFkIG9mIGEgcGxhaW4gc3RyaW5nIGZvciB0aGUgYGNsYXNzTmFtZWAuXG4gICAgY29uc3QgY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUgYXMgc3RyaW5nIHwgU1ZHQW5pbWF0ZWRTdHJpbmc7XG4gICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZSAmJiB0eXBlb2YgY2xhc3NOYW1lICE9PSAnc3RyaW5nJyA/IGNsYXNzTmFtZS5iYXNlVmFsLnNwbGl0KCcgJykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUuc3BsaXQoJyAnKTtcblxuICAgIGNsYXNzZXMuZm9yRWFjaCgodmFsdWU6IHN0cmluZykgPT4gcmVzdWx0W3ZhbHVlXSA9IHRydWUpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGdldCBjaGlsZE5vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gdGhpcy5uYXRpdmVOb2RlLmNoaWxkTm9kZXM7XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnTm9kZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCFuYXRpdmVFbGVtZW50KSByZXR1cm4gW107XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IG5hdGl2ZUVsZW1lbnQuY2hpbGRyZW47XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5QWxsUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCB0cnVlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeUFsbFIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZmFsc2UpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5hdGl2ZU5vZGUgYXMgYW55O1xuICAgIGNvbnN0IGludm9rZWRMaXN0ZW5lcnM6IEZ1bmN0aW9uW10gPSBbXTtcblxuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT09IGV2ZW50TmFtZSkge1xuICAgICAgICBjb25zdCBjYWxsYmFjayA9IGxpc3RlbmVyLmNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjay5jYWxsKG5vZGUsIGV2ZW50T2JqKTtcbiAgICAgICAgaW52b2tlZExpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFdlIG5lZWQgdG8gY2hlY2sgd2hldGhlciBgZXZlbnRMaXN0ZW5lcnNgIGV4aXN0cywgYmVjYXVzZSBpdCdzIHNvbWV0aGluZ1xuICAgIC8vIHRoYXQgWm9uZS5qcyBvbmx5IGFkZHMgdG8gYEV2ZW50VGFyZ2V0YCBpbiBicm93c2VyIGVudmlyb25tZW50cy5cbiAgICBpZiAodHlwZW9mIG5vZGUuZXZlbnRMaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIE5vdGUgdGhhdCBpbiBJdnkgd2Ugd3JhcCBldmVudCBsaXN0ZW5lcnMgd2l0aCBhIGNhbGwgdG8gYGV2ZW50LnByZXZlbnREZWZhdWx0YCBpbiBzb21lXG4gICAgICAvLyBjYXNlcy4gV2UgdXNlICdfX25nVW53cmFwX18nIGFzIGEgc3BlY2lhbCB0b2tlbiB0aGF0IGdpdmVzIHVzIGFjY2VzcyB0byB0aGUgYWN0dWFsIGV2ZW50XG4gICAgICAvLyBsaXN0ZW5lci5cbiAgICAgIG5vZGUuZXZlbnRMaXN0ZW5lcnMoZXZlbnROYW1lKS5mb3JFYWNoKChsaXN0ZW5lcjogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgLy8gSW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgd2UgY2FuIGRldGVjdCB0aGUgc3BlY2lhbCBfX25nVW53cmFwX18gdG9rZW4gZGVzY3JpYmVkIGFib3ZlLCB3ZVxuICAgICAgICAvLyB1c2UgYHRvU3RyaW5nYCBvbiB0aGUgbGlzdGVuZXIgYW5kIHNlZSBpZiBpdCBjb250YWlucyB0aGUgdG9rZW4uIFdlIHVzZSB0aGlzIGFwcHJvYWNoIHRvXG4gICAgICAgIC8vIGVuc3VyZSB0aGF0IGl0IHN0aWxsIHdvcmtlZCB3aXRoIGNvbXBpbGVkIGNvZGUgc2luY2UgaXQgY2Fubm90IHJlbW92ZSBvciByZW5hbWUgc3RyaW5nXG4gICAgICAgIC8vIGxpdGVyYWxzLiBXZSBhbHNvIGNvbnNpZGVyZWQgdXNpbmcgYSBzcGVjaWFsIGZ1bmN0aW9uIG5hbWUgKGkuZS4gaWYobGlzdGVuZXIubmFtZSA9PT1cbiAgICAgICAgLy8gc3BlY2lhbCkpIGJ1dCB0aGF0IHdhcyBtb3JlIGN1bWJlcnNvbWUgYW5kIHdlIHdlcmUgYWxzbyBjb25jZXJuZWQgdGhlIGNvbXBpbGVkIGNvZGUgY291bGRcbiAgICAgICAgLy8gc3RyaXAgdGhlIG5hbWUsIHR1cm5pbmcgdGhlIGNvbmRpdGlvbiBpbiB0byAoXCJcIiA9PT0gXCJcIikgYW5kIGFsd2F5cyByZXR1cm5pbmcgdHJ1ZS5cbiAgICAgICAgaWYgKGxpc3RlbmVyLnRvU3RyaW5nKCkuaW5kZXhPZignX19uZ1Vud3JhcF9fJykgIT09IC0xKSB7XG4gICAgICAgICAgY29uc3QgdW53cmFwcGVkTGlzdGVuZXIgPSBsaXN0ZW5lcignX19uZ1Vud3JhcF9fJyk7XG4gICAgICAgICAgcmV0dXJuIGludm9rZWRMaXN0ZW5lcnMuaW5kZXhPZih1bndyYXBwZWRMaXN0ZW5lcikgPT09IC0xICYmXG4gICAgICAgICAgICAgIHVud3JhcHBlZExpc3RlbmVyLmNhbGwobm9kZSwgZXZlbnRPYmopO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY29weURvbVByb3BlcnRpZXMoZWxlbWVudDogRWxlbWVudHxudWxsLCBwcm9wZXJ0aWVzOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30pOiB2b2lkIHtcbiAgaWYgKGVsZW1lbnQpIHtcbiAgICAvLyBTa2lwIG93biBwcm9wZXJ0aWVzIChhcyB0aG9zZSBhcmUgcGF0Y2hlZClcbiAgICBsZXQgb2JqID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGVsZW1lbnQpO1xuICAgIGNvbnN0IE5vZGVQcm90b3R5cGU6IGFueSA9IE5vZGUucHJvdG90eXBlO1xuICAgIHdoaWxlIChvYmogIT09IG51bGwgJiYgb2JqICE9PSBOb2RlUHJvdG90eXBlKSB7XG4gICAgICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG9iaik7XG4gICAgICBmb3IgKGxldCBrZXkgaW4gZGVzY3JpcHRvcnMpIHtcbiAgICAgICAgaWYgKCFrZXkuc3RhcnRzV2l0aCgnX18nKSAmJiAha2V5LnN0YXJ0c1dpdGgoJ29uJykpIHtcbiAgICAgICAgICAvLyBkb24ndCBpbmNsdWRlIHByb3BlcnRpZXMgc3RhcnRpbmcgd2l0aCBgX19gIGFuZCBgb25gLlxuICAgICAgICAgIC8vIGBfX2AgYXJlIHBhdGNoZWQgdmFsdWVzIHdoaWNoIHNob3VsZCBub3QgYmUgaW5jbHVkZWQuXG4gICAgICAgICAgLy8gYG9uYCBhcmUgbGlzdGVuZXJzIHdoaWNoIGFsc28gc2hvdWxkIG5vdCBiZSBpbmNsdWRlZC5cbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IChlbGVtZW50IGFzIGFueSlba2V5XTtcbiAgICAgICAgICBpZiAoaXNQcmltaXRpdmVWYWx1ZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHByb3BlcnRpZXNba2V5XSA9IHZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgb2JqID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlVmFsdWUodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInIHx8XG4gICAgICB2YWx1ZSA9PT0gbnVsbDtcbn1cblxuLyoqXG4gKiBXYWxrIHRoZSBUTm9kZSB0cmVlIHRvIGZpbmQgbWF0Y2hlcyBmb3IgdGhlIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50RWxlbWVudCB0aGUgZWxlbWVudCBmcm9tIHdoaWNoIHRoZSB3YWxrIGlzIHN0YXJ0ZWRcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeUFsbFIzKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PiwgbWF0Y2hlczogRGVidWdFbGVtZW50W10sXG4gICAgZWxlbWVudHNPbmx5OiB0cnVlKTogdm9pZDtcbmZ1bmN0aW9uIF9xdWVyeUFsbFIzKFxuICAgIHBhcmVudEVsZW1lbnQ6IERlYnVnRWxlbWVudCwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10sXG4gICAgZWxlbWVudHNPbmx5OiBmYWxzZSk6IHZvaWQ7XG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58UHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W118RGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0TENvbnRleHQocGFyZW50RWxlbWVudC5uYXRpdmVOb2RlKSE7XG4gIGNvbnN0IGxWaWV3ID0gY29udGV4dCA/IGNvbnRleHQubFZpZXcgOiBudWxsO1xuICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICBjb25zdCBwYXJlbnRUTm9kZSA9IGxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgcGFyZW50VE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcGFyZW50RWxlbWVudC5uYXRpdmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiB0aGUgY29udGV4dCBpcyBudWxsLCB0aGVuIGBwYXJlbnRFbGVtZW50YCB3YXMgZWl0aGVyIGNyZWF0ZWQgd2l0aCBSZW5kZXJlcjIgb3IgbmF0aXZlIERPTVxuICAgIC8vIEFQSXMuXG4gICAgX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKHBhcmVudEVsZW1lbnQubmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICB9XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgbWF0Y2ggdGhlIGN1cnJlbnQgVE5vZGUgYWdhaW5zdCB0aGUgcHJlZGljYXRlLCBhbmQgZ29lcyBvbiB3aXRoIHRoZSBuZXh0IG9uZXMuXG4gKlxuICogQHBhcmFtIHROb2RlIHRoZSBjdXJyZW50IFROb2RlXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IG9mIHRoaXMgVE5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnxQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXXxEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZU5vZGUgPSBnZXROYXRpdmVCeVROb2RlT3JOdWxsKHROb2RlLCBsVmlldyk7XG4gIC8vIEZvciBlYWNoIHR5cGUgb2YgVE5vZGUsIHNwZWNpZmljIGxvZ2ljIGlzIGV4ZWN1dGVkLlxuICBpZiAodE5vZGUudHlwZSAmIChUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikpIHtcbiAgICAvLyBDYXNlIDE6IHRoZSBUTm9kZSBpcyBhbiBlbGVtZW50XG4gICAgLy8gVGhlIG5hdGl2ZSBub2RlIGhhcyB0byBiZSBjaGVja2VkLlxuICAgIF9hZGRRdWVyeU1hdGNoUjMobmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgdGhlIGhvc3Qgb2YgYSBjb21wb25lbnQsIHRoZW4gYWxsIG5vZGVzIGluIGl0cyB2aWV3IGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgLy8gTm90ZTogdGhlIGNvbXBvbmVudCdzIGNvbnRlbnQgKHROb2RlLmNoaWxkKSB3aWxsIGJlIHByb2Nlc3NlZCBmcm9tIHRoZSBpbnNlcnRpb24gcG9pbnRzLlxuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgaWYgKGNvbXBvbmVudFZpZXcgJiYgY29tcG9uZW50Vmlld1tUVklFV10uZmlyc3RDaGlsZCkge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgICAgIGNvbXBvbmVudFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQhLCBjb21wb25lbnRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSxcbiAgICAgICAgICAgIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgaXRzIGNoaWxkcmVuIGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0Tm9kZS5jaGlsZCwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGFsc28gaGF2ZSB0byBxdWVyeSB0aGUgRE9NIGRpcmVjdGx5IGluIG9yZGVyIHRvIGNhdGNoIGVsZW1lbnRzIGluc2VydGVkIHRocm91Z2hcbiAgICAgIC8vIFJlbmRlcmVyMi4gTm90ZSB0aGF0IHRoaXMgaXMgX19ub3RfXyBvcHRpbWFsLCBiZWNhdXNlIHdlJ3JlIHdhbGtpbmcgc2ltaWxhciB0cmVlcyBtdWx0aXBsZVxuICAgICAgLy8gdGltZXMuIFZpZXdFbmdpbmUgY291bGQgZG8gaXQgbW9yZSBlZmZpY2llbnRseSwgYmVjYXVzZSBhbGwgdGhlIGluc2VydGlvbnMgZ28gdGhyb3VnaFxuICAgICAgLy8gUmVuZGVyZXIyLCBob3dldmVyIHRoYXQncyBub3QgdGhlIGNhc2UgaW4gSXZ5LiBUaGlzIGFwcHJvYWNoIGlzIGJlaW5nIHVzZWQgYmVjYXVzZTpcbiAgICAgIC8vIDEuIE1hdGNoaW5nIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yIHdvdWxkIG1lYW4gcG90ZW50aWFsbHkgaW50cm9kdWNpbmcgYSBkZXBlZGVuY3lcbiAgICAgIC8vICAgIGZyb20gYFJlbmRlcmVyMmAgdG8gSXZ5IHdoaWNoIGNvdWxkIGJyaW5nIEl2eSBjb2RlIGludG8gVmlld0VuZ2luZS5cbiAgICAgIC8vIDIuIFdlIHdvdWxkIGhhdmUgdG8gbWFrZSBgUmVuZGVyZXIzYCBcImtub3dcIiBhYm91dCBkZWJ1ZyBub2Rlcy5cbiAgICAgIC8vIDMuIEl0IGFsbG93cyB1cyB0byBjYXB0dXJlIG5vZGVzIHRoYXQgd2VyZSBpbnNlcnRlZCBkaXJlY3RseSB2aWEgdGhlIERPTS5cbiAgICAgIG5hdGl2ZU5vZGUgJiYgX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5KTtcbiAgICB9XG4gICAgLy8gSW4gYWxsIGNhc2VzLCBpZiBhIGR5bmFtaWMgY29udGFpbmVyIGV4aXN0cyBmb3IgdGhpcyBub2RlLCBlYWNoIHZpZXcgaW5zaWRlIGl0IGhhcyB0byBiZVxuICAgIC8vIHByb2Nlc3NlZC5cbiAgICBjb25zdCBub2RlT3JDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgaWYgKGlzTENvbnRhaW5lcihub2RlT3JDb250YWluZXIpKSB7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKFxuICAgICAgICAgIG5vZGVPckNvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBDYXNlIDI6IHRoZSBUTm9kZSBpcyBhIGNvbnRhaW5lclxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIF9hZGRRdWVyeU1hdGNoUjMobENvbnRhaW5lcltOQVRJVkVdLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIC8vIEVhY2ggdmlldyBpbnNpZGUgdGhlIGNvbnRhaW5lciBoYXMgdG8gYmUgcHJvY2Vzc2VkLlxuICAgIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMobENvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAvLyBDYXNlIDM6IHRoZSBUTm9kZSBpcyBhIHByb2plY3Rpb24gaW5zZXJ0aW9uIHBvaW50IChpLmUuIGEgPG5nLWNvbnRlbnQ+KS5cbiAgICAvLyBUaGUgbm9kZXMgcHJvamVjdGVkIGF0IHRoaXMgbG9jYXRpb24gYWxsIG5lZWQgdG8gYmUgcHJvY2Vzc2VkLlxuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBsVmlldyFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICAgIGNvbnN0IGhlYWQ6IFROb2RlfG51bGwgPVxuICAgICAgICAoY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzIChUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGhlYWQpKSB7XG4gICAgICBmb3IgKGxldCBuYXRpdmVOb2RlIG9mIGhlYWQpIHtcbiAgICAgICAgX2FkZFF1ZXJ5TWF0Y2hSMyhuYXRpdmVOb2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaGVhZCkge1xuICAgICAgY29uc3QgbmV4dExWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdISBhcyBMVmlldztcbiAgICAgIGNvbnN0IG5leHRUTm9kZSA9IG5leHRMVmlld1tUVklFV10uZGF0YVtoZWFkLmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKG5leHRUTm9kZSwgbmV4dExWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS5jaGlsZCkge1xuICAgIC8vIENhc2UgNDogdGhlIFROb2RlIGlzIGEgdmlldy5cbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0Tm9kZS5jaGlsZCwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gIH1cblxuICAvLyBXZSBkb24ndCB3YW50IHRvIGdvIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHJvb3Qgbm9kZS5cbiAgaWYgKHJvb3ROYXRpdmVOb2RlICE9PSBuYXRpdmVOb2RlKSB7XG4gICAgLy8gVG8gZGV0ZXJtaW5lIHRoZSBuZXh0IG5vZGUgdG8gYmUgcHJvY2Vzc2VkLCB3ZSBuZWVkIHRvIHVzZSB0aGUgbmV4dCBvciB0aGUgcHJvamVjdGlvbk5leHRcbiAgICAvLyBsaW5rLCBkZXBlbmRpbmcgb24gd2hldGhlciB0aGUgY3VycmVudCBub2RlIGhhcyBiZWVuIHByb2plY3RlZC5cbiAgICBjb25zdCBuZXh0VE5vZGUgPSAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSA/IHROb2RlLnByb2plY3Rpb25OZXh0IDogdE5vZGUubmV4dDtcbiAgICBpZiAobmV4dFROb2RlKSB7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhuZXh0VE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3MgYWxsIFROb2RlcyBpbiBhIGdpdmVuIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0aGUgY29udGFpbmVyIHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9xdWVyeU5vZGVDaGlsZHJlbkluQ29udGFpbmVyUjMoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnxQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXXxEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZFZpZXcgPSBsQ29udGFpbmVyW2ldIGFzIExWaWV3O1xuICAgIGNvbnN0IGZpcnN0Q2hpbGQgPSBjaGlsZFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgaWYgKGZpcnN0Q2hpbGQpIHtcbiAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKGZpcnN0Q2hpbGQsIGNoaWxkVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNYXRjaCB0aGUgY3VycmVudCBuYXRpdmUgbm9kZSBhZ2FpbnN0IHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIG5hdGl2ZU5vZGUgdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfYWRkUXVlcnlNYXRjaFIzKFxuICAgIG5hdGl2ZU5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnxQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXXxEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuLCByb290TmF0aXZlTm9kZTogYW55KSB7XG4gIGlmIChyb290TmF0aXZlTm9kZSAhPT0gbmF0aXZlTm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZSA9IGdldERlYnVnTm9kZShuYXRpdmVOb2RlKTtcbiAgICBpZiAoIWRlYnVnTm9kZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUeXBlIG9mIHRoZSBcInByZWRpY2F0ZSBhbmQgXCJtYXRjaGVzXCIgYXJyYXkgYXJlIHNldCBiYXNlZCBvbiB0aGUgdmFsdWUgb2ZcbiAgICAvLyB0aGUgXCJlbGVtZW50c09ubHlcIiBwYXJhbWV0ZXIuIFR5cGVTY3JpcHQgaXMgbm90IGFibGUgdG8gcHJvcGVybHkgaW5mZXIgdGhlc2VcbiAgICAvLyB0eXBlcyB3aXRoIGdlbmVyaWNzLCBzbyB3ZSBtYW51YWxseSBjYXN0IHRoZSBwYXJhbWV0ZXJzIGFjY29yZGluZ2x5LlxuICAgIGlmIChlbGVtZW50c09ubHkgJiYgZGVidWdOb2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QT1NUX1IzX18gJiYgcHJlZGljYXRlKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgbWF0Y2hlcy5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICBtYXRjaGVzLnB1c2goZGVidWdOb2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICAhZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgIChtYXRjaGVzIGFzIERlYnVnTm9kZVtdKS5wdXNoKGRlYnVnTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWF0Y2ggYWxsIHRoZSBkZXNjZW5kYW50cyBvZiBhIERPTSBub2RlIGFnYWluc3QgYSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIG5hdGl2ZU5vZGUgdGhlIGN1cnJlbnQgbmF0aXZlIG5vZGVcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgd2hlcmUgbWF0Y2hlcyBhcmUgc3RvcmVkXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKFxuICAgIHBhcmVudE5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnxQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXXxEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuKSB7XG4gIGNvbnN0IG5vZGVzID0gcGFyZW50Tm9kZS5jaGlsZE5vZGVzO1xuICBjb25zdCBsZW5ndGggPSBub2Rlcy5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICBjb25zdCBkZWJ1Z05vZGUgPSBnZXREZWJ1Z05vZGUobm9kZSk7XG5cbiAgICBpZiAoZGVidWdOb2RlKSB7XG4gICAgICBpZiAoZWxlbWVudHNPbmx5ICYmIGRlYnVnTm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fICYmIHByZWRpY2F0ZShkZWJ1Z05vZGUpICYmXG4gICAgICAgICAgbWF0Y2hlcy5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChkZWJ1Z05vZGUpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAhZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkucHVzaChkZWJ1Z05vZGUpO1xuICAgICAgfVxuXG4gICAgICBfcXVlcnlOYXRpdmVOb2RlRGVzY2VuZGFudHMobm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIHByb3BlcnR5IGJpbmRpbmdzIGZvciBhIGdpdmVuIG5vZGUgYW5kIGdlbmVyYXRlc1xuICogYSBtYXAgb2YgcHJvcGVydHkgbmFtZXMgdG8gdmFsdWVzLiBUaGlzIG1hcCBvbmx5IGNvbnRhaW5zIHByb3BlcnR5IGJpbmRpbmdzXG4gKiBkZWZpbmVkIGluIHRlbXBsYXRlcywgbm90IGluIGhvc3QgYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKFxuICAgIHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdERhdGE6IFREYXRhKTogdm9pZCB7XG4gIGxldCBiaW5kaW5nSW5kZXhlcyA9IHROb2RlLnByb3BlcnR5QmluZGluZ3M7XG5cbiAgaWYgKGJpbmRpbmdJbmRleGVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5nSW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gYmluZGluZ0luZGV4ZXNbaV07XG4gICAgICBjb25zdCBwcm9wTWV0YWRhdGEgPSB0RGF0YVtiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IG1ldGFkYXRhUGFydHMgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gbWV0YWRhdGFQYXJ0c1swXTtcbiAgICAgIGlmIChtZXRhZGF0YVBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gbWV0YWRhdGFQYXJ0c1sxXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPCBtZXRhZGF0YVBhcnRzLmxlbmd0aCAtIDE7IGorKykge1xuICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeShsVmlld1tiaW5kaW5nSW5kZXggKyBqIC0gMV0pICsgbWV0YWRhdGFQYXJ0c1tqICsgMV07XG4gICAgICAgIH1cbiAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8vIE5lZWQgdG8ga2VlcCB0aGUgbm9kZXMgaW4gYSBnbG9iYWwgTWFwIHNvIHRoYXQgbXVsdGlwbGUgYW5ndWxhciBhcHBzIGFyZSBzdXBwb3J0ZWQuXG5jb25zdCBfbmF0aXZlTm9kZVRvRGVidWdOb2RlID0gbmV3IE1hcDxhbnksIERlYnVnTm9kZT4oKTtcblxuZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QUkVfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIHJldHVybiBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmdldChuYXRpdmVOb2RlKSB8fCBudWxsO1xufVxuXG5jb25zdCBOR19ERUJVR19QUk9QRVJUWSA9ICdfX25nX2RlYnVnX18nO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogRWxlbWVudCk6IERlYnVnRWxlbWVudF9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IE5vZGUpOiBEZWJ1Z05vZGVfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBudWxsKTogbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIGlmIChuYXRpdmVOb2RlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICghKG5hdGl2ZU5vZGUuaGFzT3duUHJvcGVydHkoTkdfREVCVUdfUFJPUEVSVFkpKSkge1xuICAgICAgKG5hdGl2ZU5vZGUgYXMgYW55KVtOR19ERUJVR19QUk9QRVJUWV0gPSBuYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID9cbiAgICAgICAgICBuZXcgRGVidWdFbGVtZW50X19QT1NUX1IzX18obmF0aXZlTm9kZSBhcyBFbGVtZW50KSA6XG4gICAgICAgICAgbmV3IERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gKG5hdGl2ZU5vZGUgYXMgYW55KVtOR19ERUJVR19QUk9QRVJUWV07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGVidWdOb2RlOiAobmF0aXZlTm9kZTogYW55KSA9PiBEZWJ1Z05vZGUgfCBudWxsID0gZ2V0RGVidWdOb2RlX19QUkVfUjNfXztcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlUjJfX1BSRV9SM19fKG5hdGl2ZU5vZGU6IGFueSk6IERlYnVnTm9kZXxudWxsIHtcbiAgcmV0dXJuIGdldERlYnVnTm9kZV9fUFJFX1IzX18obmF0aXZlTm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVSMl9fUE9TVF9SM19fKF9uYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgY29uc3QgZ2V0RGVidWdOb2RlUjI6IChuYXRpdmVOb2RlOiBhbnkpID0+IERlYnVnTm9kZSB8IG51bGwgPSBnZXREZWJ1Z05vZGVSMl9fUFJFX1IzX187XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbERlYnVnTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnZhbHVlcygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4RGVidWdOb2RlKG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnNldChub2RlLm5hdGl2ZU5vZGUsIG5vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4KG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmRlbGV0ZShub2RlLm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIEEgYm9vbGVhbi12YWx1ZWQgZnVuY3Rpb24gb3ZlciBhIHZhbHVlLCBwb3NzaWJseSBpbmNsdWRpbmcgY29udGV4dCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIHRoYXQgdmFsdWUncyBwb3NpdGlvbiBpbiBhbiBhcnJheS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJlZGljYXRlPFQ+IHtcbiAgKHZhbHVlOiBUKTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z05vZGU6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdOb2RlfSA9IERlYnVnTm9kZV9fUFJFX1IzX187XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdFbGVtZW50OiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnRWxlbWVudH0gPSBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fO1xuIl19