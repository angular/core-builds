/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { assertNodeInjector } from '../assert';
import { getInjectorIndex, getParentInjectorLocation } from '../di';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS, NATIVE } from '../interfaces/container';
import { NO_PARENT_INJECTOR } from '../interfaces/injector';
import { toTNodeTypeAsString } from '../interfaces/node';
import { getTStylingRangeNext, getTStylingRangeNextDuplicate, getTStylingRangePrev, getTStylingRangePrevDuplicate } from '../interfaces/styling';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, ID, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TVIEW, TViewTypeAsString } from '../interfaces/view';
import { attachDebugObject } from '../util/debug_utils';
import { getParentInjectorIndex, getParentInjectorView } from '../util/injector_utils';
import { unwrapRNode } from '../util/view_utils';
/*
 * This file contains conditionally attached classes which provide human readable (debug) level
 * information for `LView`, `LContainer` and other internal data structures. These data structures
 * are stored internally as array which makes it very difficult during debugging to reason about the
 * current state of the system.
 *
 * Patching the array with extra property does change the array's hidden class' but it does not
 * change the cost of access, therefore this patching should not have significant if any impact in
 * `ngDevMode` mode. (see: https://jsperf.com/array-vs-monkey-patch-array)
 *
 * So instead of seeing:
 * ```
 * Array(30) [Object, 659, null, …]
 * ```
 *
 * You get to see:
 * ```
 * LViewDebug {
 *   views: [...],
 *   flags: {attached: true, ...}
 *   nodes: [
 *     {html: '<div id="123">', ..., nodes: [
 *       {html: '<span>', ..., nodes: null}
 *     ]}
 *   ]
 * }
 * ```
 */
let LVIEW_COMPONENT_CACHE;
let LVIEW_EMBEDDED_CACHE;
let LVIEW_ROOT;
let LVIEW_COMPONENT;
let LVIEW_EMBEDDED;
/**
 * This function clones a blueprint and creates LView.
 *
 * Simple slice will keep the same type, and we need it to be LView
 */
export function cloneToLViewFromTViewBlueprint(tView) {
    const debugTView = tView;
    const lView = getLViewToClone(debugTView.type, tView.template && tView.template.name);
    return lView.concat(tView.blueprint);
}
class LRootView extends Array {
}
class LComponentView extends Array {
}
class LEmbeddedView extends Array {
}
function getLViewToClone(type, name) {
    switch (type) {
        case 0 /* TViewType.Root */:
            if (LVIEW_ROOT === undefined)
                LVIEW_ROOT = new LRootView();
            return LVIEW_ROOT;
        case 1 /* TViewType.Component */:
            if (!ngDevMode || !ngDevMode.namedConstructors) {
                if (LVIEW_COMPONENT === undefined)
                    LVIEW_COMPONENT = new LComponentView();
                return LVIEW_COMPONENT;
            }
            if (LVIEW_COMPONENT_CACHE === undefined)
                LVIEW_COMPONENT_CACHE = new Map();
            let componentArray = LVIEW_COMPONENT_CACHE.get(name);
            if (componentArray === undefined) {
                componentArray = new (createNamedArrayType('LComponentView' + nameSuffix(name)))();
                LVIEW_COMPONENT_CACHE.set(name, componentArray);
            }
            return componentArray;
        case 2 /* TViewType.Embedded */:
            if (!ngDevMode || !ngDevMode.namedConstructors) {
                if (LVIEW_EMBEDDED === undefined)
                    LVIEW_EMBEDDED = new LEmbeddedView();
                return LVIEW_EMBEDDED;
            }
            if (LVIEW_EMBEDDED_CACHE === undefined)
                LVIEW_EMBEDDED_CACHE = new Map();
            let embeddedArray = LVIEW_EMBEDDED_CACHE.get(name);
            if (embeddedArray === undefined) {
                embeddedArray = new (createNamedArrayType('LEmbeddedView' + nameSuffix(name)))();
                LVIEW_EMBEDDED_CACHE.set(name, embeddedArray);
            }
            return embeddedArray;
    }
}
function nameSuffix(text) {
    if (text == null)
        return '';
    const index = text.lastIndexOf('_Template');
    return '_' + (index === -1 ? text : text.slice(0, index));
}
/**
 * This class is a debug version of Object literal so that we can have constructor name show up
 * in
 * debug tools in ngDevMode.
 */
export const TViewConstructor = class TView {
    constructor(type, blueprint, template, queries, viewQuery, declTNode, data, bindingStartIndex, expandoStartIndex, hostBindingOpCodes, firstCreatePass, firstUpdatePass, staticViewQueries, staticContentQueries, preOrderHooks, preOrderCheckHooks, contentHooks, contentCheckHooks, viewHooks, viewCheckHooks, destroyHooks, cleanup, contentQueries, components, directiveRegistry, pipeRegistry, firstChild, schemas, consts, incompleteFirstPass, _decls, _vars) {
        this.type = type;
        this.blueprint = blueprint;
        this.template = template;
        this.queries = queries;
        this.viewQuery = viewQuery;
        this.declTNode = declTNode;
        this.data = data;
        this.bindingStartIndex = bindingStartIndex;
        this.expandoStartIndex = expandoStartIndex;
        this.hostBindingOpCodes = hostBindingOpCodes;
        this.firstCreatePass = firstCreatePass;
        this.firstUpdatePass = firstUpdatePass;
        this.staticViewQueries = staticViewQueries;
        this.staticContentQueries = staticContentQueries;
        this.preOrderHooks = preOrderHooks;
        this.preOrderCheckHooks = preOrderCheckHooks;
        this.contentHooks = contentHooks;
        this.contentCheckHooks = contentCheckHooks;
        this.viewHooks = viewHooks;
        this.viewCheckHooks = viewCheckHooks;
        this.destroyHooks = destroyHooks;
        this.cleanup = cleanup;
        this.contentQueries = contentQueries;
        this.components = components;
        this.directiveRegistry = directiveRegistry;
        this.pipeRegistry = pipeRegistry;
        this.firstChild = firstChild;
        this.schemas = schemas;
        this.consts = consts;
        this.incompleteFirstPass = incompleteFirstPass;
        this._decls = _decls;
        this._vars = _vars;
    }
    get template_() {
        const buf = [];
        processTNodeChildren(this.firstChild, buf);
        return buf.join('');
    }
    get type_() {
        return TViewTypeAsString[this.type] || `TViewType.?${this.type}?`;
    }
};
class TNode {
    constructor(tView_, //
    type, //
    index, //
    insertBeforeIndex, //
    injectorIndex, //
    directiveStart, //
    directiveEnd, //
    directiveStylingLast, //
    propertyBindings, //
    flags, //
    providerIndexes, //
    value, //
    attrs, //
    mergedAttrs, //
    localNames, //
    initialInputs, //
    inputs, //
    outputs, //
    tViews, //
    next, //
    projectionNext, //
    child, //
    parent, //
    projection, //
    styles, //
    stylesWithoutHost, //
    residualStyles, //
    classes, //
    classesWithoutHost, //
    residualClasses, //
    classBindings, //
    styleBindings) {
        this.tView_ = tView_;
        this.type = type;
        this.index = index;
        this.insertBeforeIndex = insertBeforeIndex;
        this.injectorIndex = injectorIndex;
        this.directiveStart = directiveStart;
        this.directiveEnd = directiveEnd;
        this.directiveStylingLast = directiveStylingLast;
        this.propertyBindings = propertyBindings;
        this.flags = flags;
        this.providerIndexes = providerIndexes;
        this.value = value;
        this.attrs = attrs;
        this.mergedAttrs = mergedAttrs;
        this.localNames = localNames;
        this.initialInputs = initialInputs;
        this.inputs = inputs;
        this.outputs = outputs;
        this.tViews = tViews;
        this.next = next;
        this.projectionNext = projectionNext;
        this.child = child;
        this.parent = parent;
        this.projection = projection;
        this.styles = styles;
        this.stylesWithoutHost = stylesWithoutHost;
        this.residualStyles = residualStyles;
        this.classes = classes;
        this.classesWithoutHost = classesWithoutHost;
        this.residualClasses = residualClasses;
        this.classBindings = classBindings;
        this.styleBindings = styleBindings;
    }
    /**
     * Return a human debug version of the set of `NodeInjector`s which will be consulted when
     * resolving tokens from this `TNode`.
     *
     * When debugging applications, it is often difficult to determine which `NodeInjector`s will be
     * consulted. This method shows a list of `DebugNode`s representing the `TNode`s which will be
     * consulted in order when resolving a token starting at this `TNode`.
     *
     * The original data is stored in `LView` and `TView` with a lot of offset indexes, and so it is
     * difficult to reason about.
     *
     * @param lView The `LView` instance for this `TNode`.
     */
    debugNodeInjectorPath(lView) {
        const path = [];
        let injectorIndex = getInjectorIndex(this, lView);
        if (injectorIndex === -1) {
            // Looks like the current `TNode` does not have `NodeInjector` associated with it => look for
            // parent NodeInjector.
            const parentLocation = getParentInjectorLocation(this, lView);
            if (parentLocation !== NO_PARENT_INJECTOR) {
                // We found a parent, so start searching from the parent location.
                injectorIndex = getParentInjectorIndex(parentLocation);
                lView = getParentInjectorView(parentLocation, lView);
            }
            else {
                // No parents have been found, so there are no `NodeInjector`s to consult.
            }
        }
        while (injectorIndex !== -1) {
            ngDevMode && assertNodeInjector(lView, injectorIndex);
            const tNode = lView[TVIEW].data[injectorIndex + 8 /* NodeInjectorOffset.TNODE */];
            path.push(buildDebugNode(tNode, lView));
            const parentLocation = lView[injectorIndex + 8 /* NodeInjectorOffset.PARENT */];
            if (parentLocation === NO_PARENT_INJECTOR) {
                injectorIndex = -1;
            }
            else {
                injectorIndex = getParentInjectorIndex(parentLocation);
                lView = getParentInjectorView(parentLocation, lView);
            }
        }
        return path;
    }
    get type_() {
        return toTNodeTypeAsString(this.type) || `TNodeType.?${this.type}?`;
    }
    get flags_() {
        const flags = [];
        if (this.flags & 16 /* TNodeFlags.hasClassInput */)
            flags.push('TNodeFlags.hasClassInput');
        if (this.flags & 8 /* TNodeFlags.hasContentQuery */)
            flags.push('TNodeFlags.hasContentQuery');
        if (this.flags & 32 /* TNodeFlags.hasStyleInput */)
            flags.push('TNodeFlags.hasStyleInput');
        if (this.flags & 128 /* TNodeFlags.hasHostBindings */)
            flags.push('TNodeFlags.hasHostBindings');
        if (this.flags & 2 /* TNodeFlags.isComponentHost */)
            flags.push('TNodeFlags.isComponentHost');
        if (this.flags & 1 /* TNodeFlags.isDirectiveHost */)
            flags.push('TNodeFlags.isDirectiveHost');
        if (this.flags & 64 /* TNodeFlags.isDetached */)
            flags.push('TNodeFlags.isDetached');
        if (this.flags & 4 /* TNodeFlags.isProjected */)
            flags.push('TNodeFlags.isProjected');
        return flags.join('|');
    }
    get template_() {
        if (this.type & 1 /* TNodeType.Text */)
            return this.value;
        const buf = [];
        const tagName = typeof this.value === 'string' && this.value || this.type_;
        buf.push('<', tagName);
        if (this.flags) {
            buf.push(' ', this.flags_);
        }
        if (this.attrs) {
            for (let i = 0; i < this.attrs.length;) {
                const attrName = this.attrs[i++];
                if (typeof attrName == 'number') {
                    break;
                }
                const attrValue = this.attrs[i++];
                buf.push(' ', attrName, '="', attrValue, '"');
            }
        }
        buf.push('>');
        processTNodeChildren(this.child, buf);
        buf.push('</', tagName, '>');
        return buf.join('');
    }
    get styleBindings_() {
        return toDebugStyleBinding(this, false);
    }
    get classBindings_() {
        return toDebugStyleBinding(this, true);
    }
    get providerIndexStart_() {
        return this.providerIndexes & 1048575 /* TNodeProviderIndexes.ProvidersStartIndexMask */;
    }
    get providerIndexEnd_() {
        return this.providerIndexStart_ +
            (this.providerIndexes >>> 20 /* TNodeProviderIndexes.CptViewProvidersCountShift */);
    }
}
export const TNodeDebug = TNode;
function toDebugStyleBinding(tNode, isClassBased) {
    const tData = tNode.tView_.data;
    const bindings = [];
    const range = isClassBased ? tNode.classBindings : tNode.styleBindings;
    const prev = getTStylingRangePrev(range);
    const next = getTStylingRangeNext(range);
    let isTemplate = next !== 0;
    let cursor = isTemplate ? next : prev;
    while (cursor !== 0) {
        const itemKey = tData[cursor];
        const itemRange = tData[cursor + 1];
        bindings.unshift({
            key: itemKey,
            index: cursor,
            isTemplate: isTemplate,
            prevDuplicate: getTStylingRangePrevDuplicate(itemRange),
            nextDuplicate: getTStylingRangeNextDuplicate(itemRange),
            nextIndex: getTStylingRangeNext(itemRange),
            prevIndex: getTStylingRangePrev(itemRange),
        });
        if (cursor === prev)
            isTemplate = false;
        cursor = getTStylingRangePrev(itemRange);
    }
    bindings.push((isClassBased ? tNode.residualClasses : tNode.residualStyles) || null);
    return bindings;
}
function processTNodeChildren(tNode, buf) {
    while (tNode) {
        buf.push(tNode.template_);
        tNode = tNode.next;
    }
}
class TViewData extends Array {
}
let TVIEWDATA_EMPTY; // can't initialize here or it will not be tree shaken, because
// `LView` constructor could have side-effects.
/**
 * This function clones a blueprint and creates TData.
 *
 * Simple slice will keep the same type, and we need it to be TData
 */
export function cloneToTViewData(list) {
    if (TVIEWDATA_EMPTY === undefined)
        TVIEWDATA_EMPTY = new TViewData();
    return TVIEWDATA_EMPTY.concat(list);
}
export class LViewBlueprint extends Array {
}
export class MatchesArray extends Array {
}
export class TViewComponents extends Array {
}
export class TNodeLocalNames extends Array {
}
export class TNodeInitialInputs extends Array {
}
export class LCleanup extends Array {
}
export class TCleanup extends Array {
}
export function attachLViewDebug(lView) {
    attachDebugObject(lView, new LViewDebug(lView));
}
export function attachLContainerDebug(lContainer) {
    attachDebugObject(lContainer, new LContainerDebug(lContainer));
}
export function toDebug(obj) {
    if (obj) {
        const debug = obj.debug;
        assertDefined(debug, 'Object does not have a debug representation.');
        return debug;
    }
    else {
        return obj;
    }
}
/**
 * Use this method to unwrap a native element in `LView` and convert it into HTML for easier
 * reading.
 *
 * @param value possibly wrapped native DOM node.
 * @param includeChildren If `true` then the serialized HTML form will include child elements
 * (same
 * as `outerHTML`). If `false` then the serialized HTML form will only contain the element
 * itself
 * (will not serialize child elements).
 */
function toHtml(value, includeChildren = false) {
    const node = unwrapRNode(value);
    if (node) {
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                return node.textContent;
            case Node.COMMENT_NODE:
                return `<!--${node.textContent}-->`;
            case Node.ELEMENT_NODE:
                const outerHTML = node.outerHTML;
                if (includeChildren) {
                    return outerHTML;
                }
                else {
                    const innerHTML = '>' + node.innerHTML + '<';
                    return (outerHTML.split(innerHTML)[0]) + '>';
                }
        }
    }
    return null;
}
export class LViewDebug {
    constructor(_raw_lView) {
        this._raw_lView = _raw_lView;
    }
    /**
     * Flags associated with the `LView` unpacked into a more readable state.
     */
    get flags() {
        const flags = this._raw_lView[FLAGS];
        return {
            __raw__flags__: flags,
            initPhaseState: flags & 3 /* LViewFlags.InitPhaseStateMask */,
            creationMode: !!(flags & 4 /* LViewFlags.CreationMode */),
            firstViewPass: !!(flags & 8 /* LViewFlags.FirstLViewPass */),
            checkAlways: !!(flags & 16 /* LViewFlags.CheckAlways */),
            dirty: !!(flags & 32 /* LViewFlags.Dirty */),
            attached: !!(flags & 64 /* LViewFlags.Attached */),
            destroyed: !!(flags & 128 /* LViewFlags.Destroyed */),
            isRoot: !!(flags & 256 /* LViewFlags.IsRoot */),
            indexWithinInitPhase: flags >> 11 /* LViewFlags.IndexWithinInitPhaseShift */,
        };
    }
    get parent() {
        return toDebug(this._raw_lView[PARENT]);
    }
    get hostHTML() {
        return toHtml(this._raw_lView[HOST], true);
    }
    get html() {
        return (this.nodes || []).map(mapToHTML).join('');
    }
    get context() {
        return this._raw_lView[CONTEXT];
    }
    /**
     * The tree of nodes associated with the current `LView`. The nodes have been normalized into
     * a tree structure with relevant details pulled out for readability.
     */
    get nodes() {
        const lView = this._raw_lView;
        const tNode = lView[TVIEW].firstChild;
        return toDebugNodes(tNode, lView);
    }
    get template() {
        return this.tView.template_;
    }
    get tView() {
        return this._raw_lView[TVIEW];
    }
    get cleanup() {
        return this._raw_lView[CLEANUP];
    }
    get injector() {
        return this._raw_lView[INJECTOR];
    }
    get rendererFactory() {
        return this._raw_lView[RENDERER_FACTORY];
    }
    get renderer() {
        return this._raw_lView[RENDERER];
    }
    get sanitizer() {
        return this._raw_lView[SANITIZER];
    }
    get childHead() {
        return toDebug(this._raw_lView[CHILD_HEAD]);
    }
    get next() {
        return toDebug(this._raw_lView[NEXT]);
    }
    get childTail() {
        return toDebug(this._raw_lView[CHILD_TAIL]);
    }
    get declarationView() {
        return toDebug(this._raw_lView[DECLARATION_VIEW]);
    }
    get queries() {
        return this._raw_lView[QUERIES];
    }
    get tHost() {
        return this._raw_lView[T_HOST];
    }
    get id() {
        return this._raw_lView[ID];
    }
    get decls() {
        return toLViewRange(this.tView, this._raw_lView, HEADER_OFFSET, this.tView.bindingStartIndex);
    }
    get vars() {
        return toLViewRange(this.tView, this._raw_lView, this.tView.bindingStartIndex, this.tView.expandoStartIndex);
    }
    get expando() {
        return toLViewRange(this.tView, this._raw_lView, this.tView.expandoStartIndex, this._raw_lView.length);
    }
    /**
     * Normalized view of child views (and containers) attached at this location.
     */
    get childViews() {
        const childViews = [];
        let child = this.childHead;
        while (child) {
            childViews.push(child);
            child = child.next;
        }
        return childViews;
    }
}
function mapToHTML(node) {
    if (node.type === 'ElementContainer') {
        return (node.children || []).map(mapToHTML).join('');
    }
    else if (node.type === 'IcuContainer') {
        throw new Error('Not implemented');
    }
    else {
        return toHtml(node.native, true) || '';
    }
}
function toLViewRange(tView, lView, start, end) {
    let content = [];
    for (let index = start; index < end; index++) {
        content.push({ index: index, t: tView.data[index], l: lView[index] });
    }
    return { start: start, end: end, length: end - start, content: content };
}
/**
 * Turns a flat list of nodes into a tree by walking the associated `TNode` tree.
 *
 * @param tNode
 * @param lView
 */
export function toDebugNodes(tNode, lView) {
    if (tNode) {
        const debugNodes = [];
        let tNodeCursor = tNode;
        while (tNodeCursor) {
            debugNodes.push(buildDebugNode(tNodeCursor, lView));
            tNodeCursor = tNodeCursor.next;
        }
        return debugNodes;
    }
    else {
        return [];
    }
}
export function buildDebugNode(tNode, lView) {
    const rawValue = lView[tNode.index];
    const native = unwrapRNode(rawValue);
    const factories = [];
    const instances = [];
    const tView = lView[TVIEW];
    for (let i = tNode.directiveStart; i < tNode.directiveEnd; i++) {
        const def = tView.data[i];
        factories.push(def.type);
        instances.push(lView[i]);
    }
    return {
        html: toHtml(native),
        type: toTNodeTypeAsString(tNode.type),
        tNode,
        native: native,
        children: toDebugNodes(tNode.child, lView),
        factories,
        instances,
        injector: buildNodeInjectorDebug(tNode, tView, lView),
        get injectorResolutionPath() {
            return tNode.debugNodeInjectorPath(lView);
        },
    };
}
function buildNodeInjectorDebug(tNode, tView, lView) {
    const viewProviders = [];
    for (let i = tNode.providerIndexStart_; i < tNode.providerIndexEnd_; i++) {
        viewProviders.push(tView.data[i]);
    }
    const providers = [];
    for (let i = tNode.providerIndexEnd_; i < tNode.directiveEnd; i++) {
        providers.push(tView.data[i]);
    }
    const nodeInjectorDebug = {
        bloom: toBloom(lView, tNode.injectorIndex),
        cumulativeBloom: toBloom(tView.data, tNode.injectorIndex),
        providers,
        viewProviders,
        parentInjectorIndex: lView[tNode.providerIndexStart_ - 1],
    };
    return nodeInjectorDebug;
}
/**
 * Convert a number at `idx` location in `array` into binary representation.
 *
 * @param array
 * @param idx
 */
function binary(array, idx) {
    const value = array[idx];
    // If not a number we print 8 `?` to retain alignment but let user know that it was called on
    // wrong type.
    if (typeof value !== 'number')
        return '????????';
    // We prefix 0s so that we have constant length number
    const text = '00000000' + value.toString(2);
    return text.substring(text.length - 8);
}
/**
 * Convert a bloom filter at location `idx` in `array` into binary representation.
 *
 * @param array
 * @param idx
 */
function toBloom(array, idx) {
    if (idx < 0) {
        return 'NO_NODE_INJECTOR';
    }
    return `${binary(array, idx + 7)}_${binary(array, idx + 6)}_${binary(array, idx + 5)}_${binary(array, idx + 4)}_${binary(array, idx + 3)}_${binary(array, idx + 2)}_${binary(array, idx + 1)}_${binary(array, idx + 0)}`;
}
export class LContainerDebug {
    constructor(_raw_lContainer) {
        this._raw_lContainer = _raw_lContainer;
    }
    get hasTransplantedViews() {
        return this._raw_lContainer[HAS_TRANSPLANTED_VIEWS];
    }
    get views() {
        return this._raw_lContainer.slice(CONTAINER_HEADER_OFFSET)
            .map(toDebug);
    }
    get parent() {
        return toDebug(this._raw_lContainer[PARENT]);
    }
    get movedViews() {
        return this._raw_lContainer[MOVED_VIEWS];
    }
    get host() {
        return this._raw_lContainer[HOST];
    }
    get native() {
        return this._raw_lContainer[NATIVE];
    }
    get next() {
        return toDebug(this._raw_lContainer[NEXT]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFPSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUNsRSxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsc0JBQXNCLEVBQWMsV0FBVyxFQUFFLE1BQU0sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRXpILE9BQU8sRUFBQyxrQkFBa0IsRUFBcUIsTUFBTSx3QkFBd0IsQ0FBQztBQUM5RSxPQUFPLEVBQThKLG1CQUFtQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFLcE4sT0FBTyxFQUFDLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUE2QixNQUFNLHVCQUF1QixDQUFDO0FBQzNLLE9BQU8sRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQWEsZ0JBQWdCLEVBQW1CLEtBQUssRUFBRSxhQUFhLEVBQVksSUFBSSxFQUFzQixFQUFFLEVBQUUsUUFBUSxFQUE4SCxJQUFJLEVBQXFCLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQTBCLEtBQUssRUFBb0IsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMzZCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztB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LENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemVyJztcbmltcG9ydCB7S2V5VmFsdWVBcnJheX0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge2Fzc2VydE5vZGVJbmplY3Rvcn0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgSEFTX1RSQU5TUExBTlRFRF9WSUVXUywgTENvbnRhaW5lciwgTU9WRURfVklFV1MsIE5BVElWRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdCwgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tk9fUEFSRU5UX0lOSkVDVE9SLCBOb2RlSW5qZWN0b3JPZmZzZXR9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluc2VydEJlZm9yZUluZGV4LCBQcm9wZXJ0eUFsaWFzZXMsIFRDb25zdGFudHMsIFRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlIGFzIElUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgdG9UTm9kZVR5cGVBc1N0cmluZ30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2VsZWN0b3JGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXMsIFRRdWVyaWVzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7UmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtnZXRUU3R5bGluZ1JhbmdlTmV4dCwgZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUsIGdldFRTdHlsaW5nUmFuZ2VQcmV2LCBnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSwgVFN0eWxpbmdLZXksIFRTdHlsaW5nUmFuZ2V9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0NISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERlYnVnTm9kZSwgREVDTEFSQVRJT05fVklFVywgRGVzdHJveUhvb2tEYXRhLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSG9va0RhdGEsIEhPU1QsIEhvc3RCaW5kaW5nT3BDb2RlcywgSUQsIElOSkVDVE9SLCBMQ29udGFpbmVyRGVidWcgYXMgSUxDb250YWluZXJEZWJ1ZywgTFZpZXcsIExWaWV3RGVidWcgYXMgSUxWaWV3RGVidWcsIExWaWV3RGVidWdSYW5nZSwgTFZpZXdEZWJ1Z1JhbmdlQ29udGVudCwgTFZpZXdGbGFncywgTkVYVCwgTm9kZUluamVjdG9yRGVidWcsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFNBTklUSVpFUiwgVF9IT1NULCBURGF0YSwgVFZpZXcgYXMgSVRWaWV3LCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZSwgVFZpZXdUeXBlQXNTdHJpbmd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3fSBmcm9tICcuLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7dW53cmFwUk5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbi8qXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgY29uZGl0aW9uYWxseSBhdHRhY2hlZCBjbGFzc2VzIHdoaWNoIHByb3ZpZGUgaHVtYW4gcmVhZGFibGUgKGRlYnVnKSBsZXZlbFxuICogaW5mb3JtYXRpb24gZm9yIGBMVmlld2AsIGBMQ29udGFpbmVyYCBhbmQgb3RoZXIgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzLiBUaGVzZSBkYXRhIHN0cnVjdHVyZXNcbiAqIGFyZSBzdG9yZWQgaW50ZXJuYWxseSBhcyBhcnJheSB3aGljaCBtYWtlcyBpdCB2ZXJ5IGRpZmZpY3VsdCBkdXJpbmcgZGVidWdnaW5nIHRvIHJlYXNvbiBhYm91dCB0aGVcbiAqIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHN5c3RlbS5cbiAqXG4gKiBQYXRjaGluZyB0aGUgYXJyYXkgd2l0aCBleHRyYSBwcm9wZXJ0eSBkb2VzIGNoYW5nZSB0aGUgYXJyYXkncyBoaWRkZW4gY2xhc3MnIGJ1dCBpdCBkb2VzIG5vdFxuICogY2hhbmdlIHRoZSBjb3N0IG9mIGFjY2VzcywgdGhlcmVmb3JlIHRoaXMgcGF0Y2hpbmcgc2hvdWxkIG5vdCBoYXZlIHNpZ25pZmljYW50IGlmIGFueSBpbXBhY3QgaW5cbiAqIGBuZ0Rldk1vZGVgIG1vZGUuIChzZWU6IGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS12cy1tb25rZXktcGF0Y2gtYXJyYXkpXG4gKlxuICogU28gaW5zdGVhZCBvZiBzZWVpbmc6XG4gKiBgYGBcbiAqIEFycmF5KDMwKSBbT2JqZWN0LCA2NTksIG51bGwsIOKApl1cbiAqIGBgYFxuICpcbiAqIFlvdSBnZXQgdG8gc2VlOlxuICogYGBgXG4gKiBMVmlld0RlYnVnIHtcbiAqICAgdmlld3M6IFsuLi5dLFxuICogICBmbGFnczoge2F0dGFjaGVkOiB0cnVlLCAuLi59XG4gKiAgIG5vZGVzOiBbXG4gKiAgICAge2h0bWw6ICc8ZGl2IGlkPVwiMTIzXCI+JywgLi4uLCBub2RlczogW1xuICogICAgICAge2h0bWw6ICc8c3Bhbj4nLCAuLi4sIG5vZGVzOiBudWxsfVxuICogICAgIF19XG4gKiAgIF1cbiAqIH1cbiAqIGBgYFxuICovXG5cbmxldCBMVklFV19DT01QT05FTlRfQ0FDSEU6IE1hcDxzdHJpbmd8bnVsbCwgQXJyYXk8YW55Pj58dW5kZWZpbmVkO1xubGV0IExWSUVXX0VNQkVEREVEX0NBQ0hFOiBNYXA8c3RyaW5nfG51bGwsIEFycmF5PGFueT4+fHVuZGVmaW5lZDtcbmxldCBMVklFV19ST09UOiBBcnJheTxhbnk+fHVuZGVmaW5lZDtcbmxldCBMVklFV19DT01QT05FTlQ6IEFycmF5PGFueT58dW5kZWZpbmVkO1xubGV0IExWSUVXX0VNQkVEREVEOiBBcnJheTxhbnk+fHVuZGVmaW5lZDtcblxuaW50ZXJmYWNlIFRWaWV3RGVidWcgZXh0ZW5kcyBJVFZpZXcge1xuICB0eXBlOiBUVmlld1R5cGU7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgTFZpZXcuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb0xWaWV3RnJvbVRWaWV3Qmx1ZXByaW50PFQ+KHRWaWV3OiBUVmlldyk6IExWaWV3PFQ+IHtcbiAgY29uc3QgZGVidWdUVmlldyA9IHRWaWV3IGFzIFRWaWV3RGVidWc7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXdUb0Nsb25lKGRlYnVnVFZpZXcudHlwZSwgdFZpZXcudGVtcGxhdGUgJiYgdFZpZXcudGVtcGxhdGUubmFtZSk7XG4gIHJldHVybiBsVmlldy5jb25jYXQodFZpZXcuYmx1ZXByaW50KSBhcyBhbnk7XG59XG5cbmNsYXNzIExSb290VmlldyBleHRlbmRzIEFycmF5IHt9XG5jbGFzcyBMQ29tcG9uZW50VmlldyBleHRlbmRzIEFycmF5IHt9XG5jbGFzcyBMRW1iZWRkZWRWaWV3IGV4dGVuZHMgQXJyYXkge31cblxuZnVuY3Rpb24gZ2V0TFZpZXdUb0Nsb25lKHR5cGU6IFRWaWV3VHlwZSwgbmFtZTogc3RyaW5nfG51bGwpOiBBcnJheTxhbnk+IHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBUVmlld1R5cGUuUm9vdDpcbiAgICAgIGlmIChMVklFV19ST09UID09PSB1bmRlZmluZWQpIExWSUVXX1JPT1QgPSBuZXcgTFJvb3RWaWV3KCk7XG4gICAgICByZXR1cm4gTFZJRVdfUk9PVDtcbiAgICBjYXNlIFRWaWV3VHlwZS5Db21wb25lbnQ6XG4gICAgICBpZiAoIW5nRGV2TW9kZSB8fCAhbmdEZXZNb2RlLm5hbWVkQ29uc3RydWN0b3JzKSB7XG4gICAgICAgIGlmIChMVklFV19DT01QT05FTlQgPT09IHVuZGVmaW5lZCkgTFZJRVdfQ09NUE9ORU5UID0gbmV3IExDb21wb25lbnRWaWV3KCk7XG4gICAgICAgIHJldHVybiBMVklFV19DT01QT05FTlQ7XG4gICAgICB9XG4gICAgICBpZiAoTFZJRVdfQ09NUE9ORU5UX0NBQ0hFID09PSB1bmRlZmluZWQpIExWSUVXX0NPTVBPTkVOVF9DQUNIRSA9IG5ldyBNYXAoKTtcbiAgICAgIGxldCBjb21wb25lbnRBcnJheSA9IExWSUVXX0NPTVBPTkVOVF9DQUNIRS5nZXQobmFtZSk7XG4gICAgICBpZiAoY29tcG9uZW50QXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnRBcnJheSA9IG5ldyAoY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDb21wb25lbnRWaWV3JyArIG5hbWVTdWZmaXgobmFtZSkpKSgpO1xuICAgICAgICBMVklFV19DT01QT05FTlRfQ0FDSEUuc2V0KG5hbWUsIGNvbXBvbmVudEFycmF5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb21wb25lbnRBcnJheTtcbiAgICBjYXNlIFRWaWV3VHlwZS5FbWJlZGRlZDpcbiAgICAgIGlmICghbmdEZXZNb2RlIHx8ICFuZ0Rldk1vZGUubmFtZWRDb25zdHJ1Y3RvcnMpIHtcbiAgICAgICAgaWYgKExWSUVXX0VNQkVEREVEID09PSB1bmRlZmluZWQpIExWSUVXX0VNQkVEREVEID0gbmV3IExFbWJlZGRlZFZpZXcoKTtcbiAgICAgICAgcmV0dXJuIExWSUVXX0VNQkVEREVEO1xuICAgICAgfVxuICAgICAgaWYgKExWSUVXX0VNQkVEREVEX0NBQ0hFID09PSB1bmRlZmluZWQpIExWSUVXX0VNQkVEREVEX0NBQ0hFID0gbmV3IE1hcCgpO1xuICAgICAgbGV0IGVtYmVkZGVkQXJyYXkgPSBMVklFV19FTUJFRERFRF9DQUNIRS5nZXQobmFtZSk7XG4gICAgICBpZiAoZW1iZWRkZWRBcnJheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGVtYmVkZGVkQXJyYXkgPSBuZXcgKGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMRW1iZWRkZWRWaWV3JyArIG5hbWVTdWZmaXgobmFtZSkpKSgpO1xuICAgICAgICBMVklFV19FTUJFRERFRF9DQUNIRS5zZXQobmFtZSwgZW1iZWRkZWRBcnJheSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1iZWRkZWRBcnJheTtcbiAgfVxufVxuXG5mdW5jdGlvbiBuYW1lU3VmZml4KHRleHQ6IHN0cmluZ3xudWxsfHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIGlmICh0ZXh0ID09IG51bGwpIHJldHVybiAnJztcbiAgY29uc3QgaW5kZXggPSB0ZXh0Lmxhc3RJbmRleE9mKCdfVGVtcGxhdGUnKTtcbiAgcmV0dXJuICdfJyArIChpbmRleCA9PT0gLTEgPyB0ZXh0IDogdGV4dC5zbGljZSgwLCBpbmRleCkpO1xufVxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgYSBkZWJ1ZyB2ZXJzaW9uIG9mIE9iamVjdCBsaXRlcmFsIHNvIHRoYXQgd2UgY2FuIGhhdmUgY29uc3RydWN0b3IgbmFtZSBzaG93IHVwXG4gKiBpblxuICogZGVidWcgdG9vbHMgaW4gbmdEZXZNb2RlLlxuICovXG5leHBvcnQgY29uc3QgVFZpZXdDb25zdHJ1Y3RvciA9IGNsYXNzIFRWaWV3IGltcGxlbWVudHMgSVRWaWV3IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgdHlwZTogVFZpZXdUeXBlLFxuICAgICAgcHVibGljIGJsdWVwcmludDogTFZpZXcsXG4gICAgICBwdWJsaWMgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLFxuICAgICAgcHVibGljIHF1ZXJpZXM6IFRRdWVyaWVzfG51bGwsXG4gICAgICBwdWJsaWMgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPHt9PnxudWxsLFxuICAgICAgcHVibGljIGRlY2xUTm9kZTogSVROb2RlfG51bGwsXG4gICAgICBwdWJsaWMgZGF0YTogVERhdGEsXG4gICAgICBwdWJsaWMgYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgIHB1YmxpYyBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgcHVibGljIGhvc3RCaW5kaW5nT3BDb2RlczogSG9zdEJpbmRpbmdPcENvZGVzfG51bGwsXG4gICAgICBwdWJsaWMgZmlyc3RDcmVhdGVQYXNzOiBib29sZWFuLFxuICAgICAgcHVibGljIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBwcmVPcmRlckhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgcHVibGljIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgIHB1YmxpYyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgcHVibGljIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgcHVibGljIGRlc3Ryb3lIb29rczogRGVzdHJveUhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgY2xlYW51cDogYW55W118bnVsbCxcbiAgICAgIHB1YmxpYyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCxcbiAgICAgIHB1YmxpYyBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsLFxuICAgICAgcHVibGljIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGwsXG4gICAgICBwdWJsaWMgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsLFxuICAgICAgcHVibGljIGZpcnN0Q2hpbGQ6IElUTm9kZXxudWxsLFxuICAgICAgcHVibGljIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICAgIHB1YmxpYyBjb25zdHM6IFRDb25zdGFudHN8bnVsbCxcbiAgICAgIHB1YmxpYyBpbmNvbXBsZXRlRmlyc3RQYXNzOiBib29sZWFuLFxuICAgICAgcHVibGljIF9kZWNsczogbnVtYmVyLFxuICAgICAgcHVibGljIF92YXJzOiBudW1iZXIsXG5cbiAgKSB7fVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5maXJzdENoaWxkLCBidWYpO1xuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cblxuICBnZXQgdHlwZV8oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gVFZpZXdUeXBlQXNTdHJpbmdbdGhpcy50eXBlXSB8fCBgVFZpZXdUeXBlLj8ke3RoaXMudHlwZX0/YDtcbiAgfVxufTtcblxuY2xhc3MgVE5vZGUgaW1wbGVtZW50cyBJVE5vZGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyB0Vmlld186IFRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHR5cGU6IFROb2RlVHlwZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbnNlcnRCZWZvcmVJbmRleDogSW5zZXJ0QmVmb3JlSW5kZXgsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluamVjdG9ySW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlU3RhcnQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVFbmQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBmbGFnczogVE5vZGVGbGFncywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmFsdWU6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBhdHRyczogKHN0cmluZ3xBdHRyaWJ1dGVNYXJrZXJ8KHN0cmluZ3xTZWxlY3RvckZsYWdzKVtdKVtdfG51bGwsICAgICAgICAvL1xuICAgICAgcHVibGljIG1lcmdlZEF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbCwgIC8vXG4gICAgICBwdWJsaWMgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbml0aWFsSW5wdXRzOiAoc3RyaW5nW118bnVsbClbXXxudWxsfHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIG5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjaGlsZDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdHlsZXM6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlc1dpdGhvdXRIb3N0OiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcmVzaWR1YWxTdHlsZXM6IEtleVZhbHVlQXJyYXk8YW55Pnx1bmRlZmluZWR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGFzc2VzOiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzZXNXaXRob3V0SG9zdDogc3RyaW5nfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcmVzaWR1YWxDbGFzc2VzOiBLZXlWYWx1ZUFycmF5PGFueT58dW5kZWZpbmVkfG51bGwsICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGFzc0JpbmRpbmdzOiBUU3R5bGluZ1JhbmdlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICkge31cblxuICAvKipcbiAgICogUmV0dXJuIGEgaHVtYW4gZGVidWcgdmVyc2lvbiBvZiB0aGUgc2V0IG9mIGBOb2RlSW5qZWN0b3JgcyB3aGljaCB3aWxsIGJlIGNvbnN1bHRlZCB3aGVuXG4gICAqIHJlc29sdmluZyB0b2tlbnMgZnJvbSB0aGlzIGBUTm9kZWAuXG4gICAqXG4gICAqIFdoZW4gZGVidWdnaW5nIGFwcGxpY2F0aW9ucywgaXQgaXMgb2Z0ZW4gZGlmZmljdWx0IHRvIGRldGVybWluZSB3aGljaCBgTm9kZUluamVjdG9yYHMgd2lsbCBiZVxuICAgKiBjb25zdWx0ZWQuIFRoaXMgbWV0aG9kIHNob3dzIGEgbGlzdCBvZiBgRGVidWdOb2RlYHMgcmVwcmVzZW50aW5nIHRoZSBgVE5vZGVgcyB3aGljaCB3aWxsIGJlXG4gICAqIGNvbnN1bHRlZCBpbiBvcmRlciB3aGVuIHJlc29sdmluZyBhIHRva2VuIHN0YXJ0aW5nIGF0IHRoaXMgYFROb2RlYC5cbiAgICpcbiAgICogVGhlIG9yaWdpbmFsIGRhdGEgaXMgc3RvcmVkIGluIGBMVmlld2AgYW5kIGBUVmlld2Agd2l0aCBhIGxvdCBvZiBvZmZzZXQgaW5kZXhlcywgYW5kIHNvIGl0IGlzXG4gICAqIGRpZmZpY3VsdCB0byByZWFzb24gYWJvdXQuXG4gICAqXG4gICAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCBpbnN0YW5jZSBmb3IgdGhpcyBgVE5vZGVgLlxuICAgKi9cbiAgZGVidWdOb2RlSW5qZWN0b3JQYXRoKGxWaWV3OiBMVmlldyk6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBwYXRoOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGxldCBpbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0aGlzLCBsVmlldyk7XG4gICAgaWYgKGluamVjdG9ySW5kZXggPT09IC0xKSB7XG4gICAgICAvLyBMb29rcyBsaWtlIHRoZSBjdXJyZW50IGBUTm9kZWAgZG9lcyBub3QgaGF2ZSBgTm9kZUluamVjdG9yYCBhc3NvY2lhdGVkIHdpdGggaXQgPT4gbG9vayBmb3JcbiAgICAgIC8vIHBhcmVudCBOb2RlSW5qZWN0b3IuXG4gICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odGhpcywgbFZpZXcpO1xuICAgICAgaWYgKHBhcmVudExvY2F0aW9uICE9PSBOT19QQVJFTlRfSU5KRUNUT1IpIHtcbiAgICAgICAgLy8gV2UgZm91bmQgYSBwYXJlbnQsIHNvIHN0YXJ0IHNlYXJjaGluZyBmcm9tIHRoZSBwYXJlbnQgbG9jYXRpb24uXG4gICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgbFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5vIHBhcmVudHMgaGF2ZSBiZWVuIGZvdW5kLCBzbyB0aGVyZSBhcmUgbm8gYE5vZGVJbmplY3RvcmBzIHRvIGNvbnN1bHQuXG4gICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVJbmplY3RvcihsVmlldywgaW5qZWN0b3JJbmRleCk7XG4gICAgICBjb25zdCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFROb2RlO1xuICAgICAgcGF0aC5wdXNoKGJ1aWxkRGVidWdOb2RlKHROb2RlLCBsVmlldykpO1xuICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBsVmlld1tpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlBBUkVOVF07XG4gICAgICBpZiAocGFyZW50TG9jYXRpb24gPT09IE5PX1BBUkVOVF9JTkpFQ1RPUikge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgIGxWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgZ2V0IHR5cGVfKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRvVE5vZGVUeXBlQXNTdHJpbmcodGhpcy50eXBlKSB8fCBgVE5vZGVUeXBlLj8ke3RoaXMudHlwZX0/YDtcbiAgfVxuXG4gIGdldCBmbGFnc18oKTogc3RyaW5nIHtcbiAgICBjb25zdCBmbGFnczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeSkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnknKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3QpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGV0YWNoZWQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNEZXRhY2hlZCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc1Byb2plY3RlZCcpO1xuICAgIHJldHVybiBmbGFncy5qb2luKCd8Jyk7XG4gIH1cblxuICBnZXQgdGVtcGxhdGVfKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMudHlwZSAmIFROb2RlVHlwZS5UZXh0KSByZXR1cm4gdGhpcy52YWx1ZSE7XG4gICAgY29uc3QgYnVmOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHRhZ05hbWUgPSB0eXBlb2YgdGhpcy52YWx1ZSA9PT0gJ3N0cmluZycgJiYgdGhpcy52YWx1ZSB8fCB0aGlzLnR5cGVfO1xuICAgIGJ1Zi5wdXNoKCc8JywgdGFnTmFtZSk7XG4gICAgaWYgKHRoaXMuZmxhZ3MpIHtcbiAgICAgIGJ1Zi5wdXNoKCcgJywgdGhpcy5mbGFnc18pO1xuICAgIH1cbiAgICBpZiAodGhpcy5hdHRycykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dHJzLmxlbmd0aDspIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGJ1Zi5wdXNoKCcgJywgYXR0ck5hbWUgYXMgc3RyaW5nLCAnPVwiJywgYXR0clZhbHVlIGFzIHN0cmluZywgJ1wiJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGJ1Zi5wdXNoKCc+Jyk7XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5jaGlsZCwgYnVmKTtcbiAgICBidWYucHVzaCgnPC8nLCB0YWdOYW1lLCAnPicpO1xuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cblxuICBnZXQgc3R5bGVCaW5kaW5nc18oKTogRGVidWdTdHlsZUJpbmRpbmdzIHtcbiAgICByZXR1cm4gdG9EZWJ1Z1N0eWxlQmluZGluZyh0aGlzLCBmYWxzZSk7XG4gIH1cbiAgZ2V0IGNsYXNzQmluZGluZ3NfKCk6IERlYnVnU3R5bGVCaW5kaW5ncyB7XG4gICAgcmV0dXJuIHRvRGVidWdTdHlsZUJpbmRpbmcodGhpcywgdHJ1ZSk7XG4gIH1cblxuICBnZXQgcHJvdmlkZXJJbmRleFN0YXJ0XygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICB9XG4gIGdldCBwcm92aWRlckluZGV4RW5kXygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVySW5kZXhTdGFydF8gK1xuICAgICAgICAodGhpcy5wcm92aWRlckluZGV4ZXMgPj4+IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0KTtcbiAgfVxufVxuZXhwb3J0IGNvbnN0IFROb2RlRGVidWcgPSBUTm9kZTtcbmV4cG9ydCB0eXBlIFROb2RlRGVidWcgPSBUTm9kZTtcblxuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxlQmluZGluZ3MgZXh0ZW5kc1xuICAgIEFycmF5PEtleVZhbHVlQXJyYXk8YW55PnxEZWJ1Z1N0eWxlQmluZGluZ3xzdHJpbmd8bnVsbD4ge31cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsZUJpbmRpbmcge1xuICBrZXk6IFRTdHlsaW5nS2V5O1xuICBpbmRleDogbnVtYmVyO1xuICBpc1RlbXBsYXRlOiBib29sZWFuO1xuICBwcmV2RHVwbGljYXRlOiBib29sZWFuO1xuICBuZXh0RHVwbGljYXRlOiBib29sZWFuO1xuICBwcmV2SW5kZXg6IG51bWJlcjtcbiAgbmV4dEluZGV4OiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHRvRGVidWdTdHlsZUJpbmRpbmcodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBEZWJ1Z1N0eWxlQmluZGluZ3Mge1xuICBjb25zdCB0RGF0YSA9IHROb2RlLnRWaWV3Xy5kYXRhO1xuICBjb25zdCBiaW5kaW5nczogRGVidWdTdHlsZUJpbmRpbmdzID0gW10gYXMgYW55O1xuICBjb25zdCByYW5nZSA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBjb25zdCBwcmV2ID0gZ2V0VFN0eWxpbmdSYW5nZVByZXYocmFuZ2UpO1xuICBjb25zdCBuZXh0ID0gZ2V0VFN0eWxpbmdSYW5nZU5leHQocmFuZ2UpO1xuICBsZXQgaXNUZW1wbGF0ZSA9IG5leHQgIT09IDA7XG4gIGxldCBjdXJzb3IgPSBpc1RlbXBsYXRlID8gbmV4dCA6IHByZXY7XG4gIHdoaWxlIChjdXJzb3IgIT09IDApIHtcbiAgICBjb25zdCBpdGVtS2V5ID0gdERhdGFbY3Vyc29yXSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCBpdGVtUmFuZ2UgPSB0RGF0YVtjdXJzb3IgKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAgIGJpbmRpbmdzLnVuc2hpZnQoe1xuICAgICAga2V5OiBpdGVtS2V5LFxuICAgICAgaW5kZXg6IGN1cnNvcixcbiAgICAgIGlzVGVtcGxhdGU6IGlzVGVtcGxhdGUsXG4gICAgICBwcmV2RHVwbGljYXRlOiBnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZShpdGVtUmFuZ2UpLFxuICAgICAgbmV4dER1cGxpY2F0ZTogZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUoaXRlbVJhbmdlKSxcbiAgICAgIG5leHRJbmRleDogZ2V0VFN0eWxpbmdSYW5nZU5leHQoaXRlbVJhbmdlKSxcbiAgICAgIHByZXZJbmRleDogZ2V0VFN0eWxpbmdSYW5nZVByZXYoaXRlbVJhbmdlKSxcbiAgICB9KTtcbiAgICBpZiAoY3Vyc29yID09PSBwcmV2KSBpc1RlbXBsYXRlID0gZmFsc2U7XG4gICAgY3Vyc29yID0gZ2V0VFN0eWxpbmdSYW5nZVByZXYoaXRlbVJhbmdlKTtcbiAgfVxuICBiaW5kaW5ncy5wdXNoKChpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcykgfHwgbnVsbCk7XG4gIHJldHVybiBiaW5kaW5ncztcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odE5vZGU6IElUTm9kZXxudWxsLCBidWY6IHN0cmluZ1tdKSB7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGJ1Zi5wdXNoKCh0Tm9kZSBhcyBhbnkgYXMge3RlbXBsYXRlXzogc3RyaW5nfSkudGVtcGxhdGVfKTtcbiAgICB0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIH1cbn1cblxuY2xhc3MgVFZpZXdEYXRhIGV4dGVuZHMgQXJyYXkge31cbmxldCBUVklFV0RBVEFfRU1QVFk6IHVua25vd25bXTsgIC8vIGNhbid0IGluaXRpYWxpemUgaGVyZSBvciBpdCB3aWxsIG5vdCBiZSB0cmVlIHNoYWtlbiwgYmVjYXVzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYExWaWV3YCBjb25zdHJ1Y3RvciBjb3VsZCBoYXZlIHNpZGUtZWZmZWN0cy5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgVERhdGEuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBURGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb1RWaWV3RGF0YShsaXN0OiBhbnlbXSk6IFREYXRhIHtcbiAgaWYgKFRWSUVXREFUQV9FTVBUWSA9PT0gdW5kZWZpbmVkKSBUVklFV0RBVEFfRU1QVFkgPSBuZXcgVFZpZXdEYXRhKCk7XG4gIHJldHVybiBUVklFV0RBVEFfRU1QVFkuY29uY2F0KGxpc3QpIGFzIGFueTtcbn1cblxuZXhwb3J0IGNsYXNzIExWaWV3Qmx1ZXByaW50IGV4dGVuZHMgQXJyYXkge31cbmV4cG9ydCBjbGFzcyBNYXRjaGVzQXJyYXkgZXh0ZW5kcyBBcnJheSB7fVxuZXhwb3J0IGNsYXNzIFRWaWV3Q29tcG9uZW50cyBleHRlbmRzIEFycmF5IHt9XG5leHBvcnQgY2xhc3MgVE5vZGVMb2NhbE5hbWVzIGV4dGVuZHMgQXJyYXkge31cbmV4cG9ydCBjbGFzcyBUTm9kZUluaXRpYWxJbnB1dHMgZXh0ZW5kcyBBcnJheSB7fVxuZXhwb3J0IGNsYXNzIExDbGVhbnVwIGV4dGVuZHMgQXJyYXkge31cbmV4cG9ydCBjbGFzcyBUQ2xlYW51cCBleHRlbmRzIEFycmF5IHt9XG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsVmlldywgbmV3IExWaWV3RGVidWcobFZpZXcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxDb250YWluZXIsIG5ldyBMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZzxUPihvYmo6IExWaWV3PFQ+KTogSUxWaWV3RGVidWc8VD47XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZzxUPihvYmo6IExWaWV3PFQ+fG51bGwpOiBJTFZpZXdEZWJ1ZzxUPnxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWc8VD4ob2JqOiBMVmlldzxUPnxMQ29udGFpbmVyfG51bGwpOiBJTFZpZXdEZWJ1ZzxUPnxJTENvbnRhaW5lckRlYnVnfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IGFueSk6IGFueSB7XG4gIGlmIChvYmopIHtcbiAgICBjb25zdCBkZWJ1ZyA9IChvYmogYXMgYW55KS5kZWJ1ZztcbiAgICBhc3NlcnREZWZpbmVkKGRlYnVnLCAnT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBkZWJ1ZyByZXByZXNlbnRhdGlvbi4nKTtcbiAgICByZXR1cm4gZGVidWc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxufVxuXG4vKipcbiAqIFVzZSB0aGlzIG1ldGhvZCB0byB1bndyYXAgYSBuYXRpdmUgZWxlbWVudCBpbiBgTFZpZXdgIGFuZCBjb252ZXJ0IGl0IGludG8gSFRNTCBmb3IgZWFzaWVyXG4gKiByZWFkaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBwb3NzaWJseSB3cmFwcGVkIG5hdGl2ZSBET00gbm9kZS5cbiAqIEBwYXJhbSBpbmNsdWRlQ2hpbGRyZW4gSWYgYHRydWVgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgaW5jbHVkZSBjaGlsZCBlbGVtZW50c1xuICogKHNhbWVcbiAqIGFzIGBvdXRlckhUTUxgKS4gSWYgYGZhbHNlYCB0aGVuIHRoZSBzZXJpYWxpemVkIEhUTUwgZm9ybSB3aWxsIG9ubHkgY29udGFpbiB0aGUgZWxlbWVudFxuICogaXRzZWxmXG4gKiAod2lsbCBub3Qgc2VyaWFsaXplIGNoaWxkIGVsZW1lbnRzKS5cbiAqL1xuZnVuY3Rpb24gdG9IdG1sKHZhbHVlOiBhbnksIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlOiBOb2RlfG51bGwgPSB1bndyYXBSTm9kZSh2YWx1ZSkgYXMgYW55O1xuICBpZiAobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS5ub2RlVHlwZSkge1xuICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ7XG4gICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICByZXR1cm4gYDwhLS0keyhub2RlIGFzIENvbW1lbnQpLnRleHRDb250ZW50fS0tPmA7XG4gICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICBjb25zdCBvdXRlckhUTUwgPSAobm9kZSBhcyBFbGVtZW50KS5vdXRlckhUTUw7XG4gICAgICAgIGlmIChpbmNsdWRlQ2hpbGRyZW4pIHtcbiAgICAgICAgICByZXR1cm4gb3V0ZXJIVE1MO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGlubmVySFRNTCA9ICc+JyArIChub2RlIGFzIEVsZW1lbnQpLmlubmVySFRNTCArICc8JztcbiAgICAgICAgICByZXR1cm4gKG91dGVySFRNTC5zcGxpdChpbm5lckhUTUwpWzBdKSArICc+JztcbiAgICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIExWaWV3RGVidWc8VCA9IHVua25vd24+IGltcGxlbWVudHMgSUxWaWV3RGVidWc8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbFZpZXc6IExWaWV3PFQ+KSB7fVxuXG4gIC8qKlxuICAgKiBGbGFncyBhc3NvY2lhdGVkIHdpdGggdGhlIGBMVmlld2AgdW5wYWNrZWQgaW50byBhIG1vcmUgcmVhZGFibGUgc3RhdGUuXG4gICAqL1xuICBnZXQgZmxhZ3MoKSB7XG4gICAgY29uc3QgZmxhZ3MgPSB0aGlzLl9yYXdfbFZpZXdbRkxBR1NdO1xuICAgIHJldHVybiB7XG4gICAgICBfX3Jhd19fZmxhZ3NfXzogZmxhZ3MsXG4gICAgICBpbml0UGhhc2VTdGF0ZTogZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzayxcbiAgICAgIGNyZWF0aW9uTW9kZTogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSksXG4gICAgICBmaXJzdFZpZXdQYXNzOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpLFxuICAgICAgY2hlY2tBbHdheXM6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyksXG4gICAgICBkaXJ0eTogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkRpcnR5KSxcbiAgICAgIGF0dGFjaGVkOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpLFxuICAgICAgZGVzdHJveWVkOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSxcbiAgICAgIGlzUm9vdDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLklzUm9vdCksXG4gICAgICBpbmRleFdpdGhpbkluaXRQaGFzZTogZmxhZ3MgPj4gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0LFxuICAgIH07XG4gIH1cbiAgZ2V0IHBhcmVudCgpOiBJTFZpZXdEZWJ1ZzxUPnxJTENvbnRhaW5lckRlYnVnfG51bGwge1xuICAgIHJldHVybiB0b0RlYnVnPFQ+KHRoaXMuX3Jhd19sVmlld1tQQVJFTlRdIGFzIExWaWV3PFQ+fCBMQ29udGFpbmVyIHwgbnVsbCk7XG4gIH1cbiAgZ2V0IGhvc3RIVE1MKCk6IHN0cmluZ3xudWxsIHtcbiAgICByZXR1cm4gdG9IdG1sKHRoaXMuX3Jhd19sVmlld1tIT1NUXSwgdHJ1ZSk7XG4gIH1cbiAgZ2V0IGh0bWwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKHRoaXMubm9kZXMgfHwgW10pLm1hcChtYXBUb0hUTUwpLmpvaW4oJycpO1xuICB9XG4gIGdldCBjb250ZXh0KCk6IFQge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQ09OVEVYVF07XG4gIH1cbiAgLyoqXG4gICAqIFRoZSB0cmVlIG9mIG5vZGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBgTFZpZXdgLiBUaGUgbm9kZXMgaGF2ZSBiZWVuIG5vcm1hbGl6ZWQgaW50b1xuICAgKiBhIHRyZWUgc3RydWN0dXJlIHdpdGggcmVsZXZhbnQgZGV0YWlscyBwdWxsZWQgb3V0IGZvciByZWFkYWJpbGl0eS5cbiAgICovXG4gIGdldCBub2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yYXdfbFZpZXc7XG4gICAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgICByZXR1cm4gdG9EZWJ1Z05vZGVzKHROb2RlLCBsVmlldyk7XG4gIH1cbiAgZ2V0IHRlbXBsYXRlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICh0aGlzLnRWaWV3IGFzIGFueSBhcyB7dGVtcGxhdGVfOiBzdHJpbmd9KS50ZW1wbGF0ZV87XG4gIH1cbiAgZ2V0IHRWaWV3KCk6IElUVmlldyB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tUVklFV107XG4gIH1cbiAgZ2V0IGNsZWFudXAoKTogYW55W118bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tDTEVBTlVQXTtcbiAgfVxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3J8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tJTkpFQ1RPUl07XG4gIH1cbiAgZ2V0IHJlbmRlcmVyRmFjdG9yeSgpOiBSZW5kZXJlckZhY3RvcnkzIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICB9XG4gIGdldCByZW5kZXJlcigpOiBSZW5kZXJlcjMge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJdO1xuICB9XG4gIGdldCBzYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbU0FOSVRJWkVSXTtcbiAgfVxuICBnZXQgY2hpbGRIZWFkKCk6IElMVmlld0RlYnVnfElMQ29udGFpbmVyRGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX0hFQURdKTtcbiAgfVxuICBnZXQgbmV4dCgpOiBJTFZpZXdEZWJ1ZzxUPnxJTENvbnRhaW5lckRlYnVnfG51bGwge1xuICAgIHJldHVybiB0b0RlYnVnPFQ+KHRoaXMuX3Jhd19sVmlld1tORVhUXSBhcyBMVmlldzxUPnwgTENvbnRhaW5lciB8IG51bGwpO1xuICB9XG4gIGdldCBjaGlsZFRhaWwoKTogSUxWaWV3RGVidWd8SUxDb250YWluZXJEZWJ1Z3xudWxsIHtcbiAgICByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbQ0hJTERfVEFJTF0pO1xuICB9XG4gIGdldCBkZWNsYXJhdGlvblZpZXcoKTogSUxWaWV3RGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddKTtcbiAgfVxuICBnZXQgcXVlcmllcygpOiBMUXVlcmllc3xudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1FVRVJJRVNdO1xuICB9XG4gIGdldCB0SG9zdCgpOiBJVE5vZGV8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tUX0hPU1RdO1xuICB9XG4gIGdldCBpZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbSURdO1xuICB9XG5cbiAgZ2V0IGRlY2xzKCk6IExWaWV3RGVidWdSYW5nZSB7XG4gICAgcmV0dXJuIHRvTFZpZXdSYW5nZSh0aGlzLnRWaWV3LCB0aGlzLl9yYXdfbFZpZXcsIEhFQURFUl9PRkZTRVQsIHRoaXMudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICB9XG5cbiAgZ2V0IHZhcnMoKTogTFZpZXdEZWJ1Z1JhbmdlIHtcbiAgICByZXR1cm4gdG9MVmlld1JhbmdlKFxuICAgICAgICB0aGlzLnRWaWV3LCB0aGlzLl9yYXdfbFZpZXcsIHRoaXMudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsIHRoaXMudFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICB9XG5cbiAgZ2V0IGV4cGFuZG8oKTogTFZpZXdEZWJ1Z1JhbmdlIHtcbiAgICByZXR1cm4gdG9MVmlld1JhbmdlKFxuICAgICAgICB0aGlzLnRWaWV3LCB0aGlzLl9yYXdfbFZpZXcsIHRoaXMudFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXgsIHRoaXMuX3Jhd19sVmlldy5sZW5ndGgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZWQgdmlldyBvZiBjaGlsZCB2aWV3cyAoYW5kIGNvbnRhaW5lcnMpIGF0dGFjaGVkIGF0IHRoaXMgbG9jYXRpb24uXG4gICAqL1xuICBnZXQgY2hpbGRWaWV3cygpOiBBcnJheTxJTFZpZXdEZWJ1ZzxUPnxJTENvbnRhaW5lckRlYnVnPiB7XG4gICAgY29uc3QgY2hpbGRWaWV3czogQXJyYXk8SUxWaWV3RGVidWc8VD58SUxDb250YWluZXJEZWJ1Zz4gPSBbXTtcbiAgICBsZXQgY2hpbGQgPSB0aGlzLmNoaWxkSGVhZDtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIGNoaWxkVmlld3MucHVzaChjaGlsZCBhcyBJTFZpZXdEZWJ1ZzxUPnwgSUxDb250YWluZXJEZWJ1Zyk7XG4gICAgICBjaGlsZCA9IGNoaWxkLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZFZpZXdzO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hcFRvSFRNTChub2RlOiBEZWJ1Z05vZGUpOiBzdHJpbmcge1xuICBpZiAobm9kZS50eXBlID09PSAnRWxlbWVudENvbnRhaW5lcicpIHtcbiAgICByZXR1cm4gKG5vZGUuY2hpbGRyZW4gfHwgW10pLm1hcChtYXBUb0hUTUwpLmpvaW4oJycpO1xuICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gJ0ljdUNvbnRhaW5lcicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0b0h0bWwobm9kZS5uYXRpdmUsIHRydWUpIHx8ICcnO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvTFZpZXdSYW5nZSh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOiBMVmlld0RlYnVnUmFuZ2Uge1xuICBsZXQgY29udGVudDogTFZpZXdEZWJ1Z1JhbmdlQ29udGVudFtdID0gW107XG4gIGZvciAobGV0IGluZGV4ID0gc3RhcnQ7IGluZGV4IDwgZW5kOyBpbmRleCsrKSB7XG4gICAgY29udGVudC5wdXNoKHtpbmRleDogaW5kZXgsIHQ6IHRWaWV3LmRhdGFbaW5kZXhdLCBsOiBsVmlld1tpbmRleF19KTtcbiAgfVxuICByZXR1cm4ge3N0YXJ0OiBzdGFydCwgZW5kOiBlbmQsIGxlbmd0aDogZW5kIC0gc3RhcnQsIGNvbnRlbnQ6IGNvbnRlbnR9O1xufVxuXG4vKipcbiAqIFR1cm5zIGEgZmxhdCBsaXN0IG9mIG5vZGVzIGludG8gYSB0cmVlIGJ5IHdhbGtpbmcgdGhlIGFzc29jaWF0ZWQgYFROb2RlYCB0cmVlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnTm9kZXModE5vZGU6IElUTm9kZXxudWxsLCBsVmlldzogTFZpZXcpOiBEZWJ1Z05vZGVbXSB7XG4gIGlmICh0Tm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgbGV0IHROb2RlQ3Vyc29yOiBJVE5vZGV8bnVsbCA9IHROb2RlO1xuICAgIHdoaWxlICh0Tm9kZUN1cnNvcikge1xuICAgICAgZGVidWdOb2Rlcy5wdXNoKGJ1aWxkRGVidWdOb2RlKHROb2RlQ3Vyc29yLCBsVmlldykpO1xuICAgICAgdE5vZGVDdXJzb3IgPSB0Tm9kZUN1cnNvci5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gZGVidWdOb2RlcztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRGVidWdOb2RlKHROb2RlOiBJVE5vZGUsIGxWaWV3OiBMVmlldyk6IERlYnVnTm9kZSB7XG4gIGNvbnN0IHJhd1ZhbHVlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShyYXdWYWx1ZSk7XG4gIGNvbnN0IGZhY3RvcmllczogVHlwZTxhbnk+W10gPSBbXTtcbiAgY29uc3QgaW5zdGFuY2VzOiBhbnlbXSA9IFtdO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0OyBpIDwgdE5vZGUuZGlyZWN0aXZlRW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGZhY3Rvcmllcy5wdXNoKGRlZi50eXBlKTtcbiAgICBpbnN0YW5jZXMucHVzaChsVmlld1tpXSk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBodG1sOiB0b0h0bWwobmF0aXZlKSxcbiAgICB0eXBlOiB0b1ROb2RlVHlwZUFzU3RyaW5nKHROb2RlLnR5cGUpLFxuICAgIHROb2RlLFxuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSxcbiAgICBjaGlsZHJlbjogdG9EZWJ1Z05vZGVzKHROb2RlLmNoaWxkLCBsVmlldyksXG4gICAgZmFjdG9yaWVzLFxuICAgIGluc3RhbmNlcyxcbiAgICBpbmplY3RvcjogYnVpbGROb2RlSW5qZWN0b3JEZWJ1Zyh0Tm9kZSwgdFZpZXcsIGxWaWV3KSxcbiAgICBnZXQgaW5qZWN0b3JSZXNvbHV0aW9uUGF0aCgpIHtcbiAgICAgIHJldHVybiAodE5vZGUgYXMgVE5vZGUpLmRlYnVnTm9kZUluamVjdG9yUGF0aChsVmlldyk7XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYnVpbGROb2RlSW5qZWN0b3JEZWJ1Zyh0Tm9kZTogSVROb2RlLCB0VmlldzogSVRWaWV3LCBsVmlldzogTFZpZXcpOiBOb2RlSW5qZWN0b3JEZWJ1ZyB7XG4gIGNvbnN0IHZpZXdQcm92aWRlcnM6IFR5cGU8YW55PltdID0gW107XG4gIGZvciAobGV0IGkgPSAodE5vZGUgYXMgVE5vZGUpLnByb3ZpZGVySW5kZXhTdGFydF87IGkgPCAodE5vZGUgYXMgVE5vZGUpLnByb3ZpZGVySW5kZXhFbmRfOyBpKyspIHtcbiAgICB2aWV3UHJvdmlkZXJzLnB1c2godFZpZXcuZGF0YVtpXSBhcyBUeXBlPGFueT4pO1xuICB9XG4gIGNvbnN0IHByb3ZpZGVyczogVHlwZTxhbnk+W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9ICh0Tm9kZSBhcyBUTm9kZSkucHJvdmlkZXJJbmRleEVuZF87IGkgPCAodE5vZGUgYXMgVE5vZGUpLmRpcmVjdGl2ZUVuZDsgaSsrKSB7XG4gICAgcHJvdmlkZXJzLnB1c2godFZpZXcuZGF0YVtpXSBhcyBUeXBlPGFueT4pO1xuICB9XG4gIGNvbnN0IG5vZGVJbmplY3RvckRlYnVnID0ge1xuICAgIGJsb29tOiB0b0Jsb29tKGxWaWV3LCB0Tm9kZS5pbmplY3RvckluZGV4KSxcbiAgICBjdW11bGF0aXZlQmxvb206IHRvQmxvb20odFZpZXcuZGF0YSwgdE5vZGUuaW5qZWN0b3JJbmRleCksXG4gICAgcHJvdmlkZXJzLFxuICAgIHZpZXdQcm92aWRlcnMsXG4gICAgcGFyZW50SW5qZWN0b3JJbmRleDogbFZpZXdbKHROb2RlIGFzIFROb2RlKS5wcm92aWRlckluZGV4U3RhcnRfIC0gMV0sXG4gIH07XG4gIHJldHVybiBub2RlSW5qZWN0b3JEZWJ1Zztcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgbnVtYmVyIGF0IGBpZHhgIGxvY2F0aW9uIGluIGBhcnJheWAgaW50byBiaW5hcnkgcmVwcmVzZW50YXRpb24uXG4gKlxuICogQHBhcmFtIGFycmF5XG4gKiBAcGFyYW0gaWR4XG4gKi9cbmZ1bmN0aW9uIGJpbmFyeShhcnJheTogYW55W10sIGlkeDogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgdmFsdWUgPSBhcnJheVtpZHhdO1xuICAvLyBJZiBub3QgYSBudW1iZXIgd2UgcHJpbnQgOCBgP2AgdG8gcmV0YWluIGFsaWdubWVudCBidXQgbGV0IHVzZXIga25vdyB0aGF0IGl0IHdhcyBjYWxsZWQgb25cbiAgLy8gd3JvbmcgdHlwZS5cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHJldHVybiAnPz8/Pz8/Pz8nO1xuICAvLyBXZSBwcmVmaXggMHMgc28gdGhhdCB3ZSBoYXZlIGNvbnN0YW50IGxlbmd0aCBudW1iZXJcbiAgY29uc3QgdGV4dCA9ICcwMDAwMDAwMCcgKyB2YWx1ZS50b1N0cmluZygyKTtcbiAgcmV0dXJuIHRleHQuc3Vic3RyaW5nKHRleHQubGVuZ3RoIC0gOCk7XG59XG5cbi8qKlxuICogQ29udmVydCBhIGJsb29tIGZpbHRlciBhdCBsb2NhdGlvbiBgaWR4YCBpbiBgYXJyYXlgIGludG8gYmluYXJ5IHJlcHJlc2VudGF0aW9uLlxuICpcbiAqIEBwYXJhbSBhcnJheVxuICogQHBhcmFtIGlkeFxuICovXG5mdW5jdGlvbiB0b0Jsb29tKGFycmF5OiBhbnlbXSwgaWR4OiBudW1iZXIpOiBzdHJpbmcge1xuICBpZiAoaWR4IDwgMCkge1xuICAgIHJldHVybiAnTk9fTk9ERV9JTkpFQ1RPUic7XG4gIH1cbiAgcmV0dXJuIGAke2JpbmFyeShhcnJheSwgaWR4ICsgNyl9XyR7YmluYXJ5KGFycmF5LCBpZHggKyA2KX1fJHtiaW5hcnkoYXJyYXksIGlkeCArIDUpfV8ke1xuICAgICAgYmluYXJ5KGFycmF5LCBpZHggKyA0KX1fJHtiaW5hcnkoYXJyYXksIGlkeCArIDMpfV8ke2JpbmFyeShhcnJheSwgaWR4ICsgMil9XyR7XG4gICAgICBiaW5hcnkoYXJyYXksIGlkeCArIDEpfV8ke2JpbmFyeShhcnJheSwgaWR4ICsgMCl9YDtcbn1cblxuZXhwb3J0IGNsYXNzIExDb250YWluZXJEZWJ1ZyBpbXBsZW1lbnRzIElMQ29udGFpbmVyRGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbENvbnRhaW5lcjogTENvbnRhaW5lcikge31cblxuICBnZXQgaGFzVHJhbnNwbGFudGVkVmlld3MoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0hBU19UUkFOU1BMQU5URURfVklFV1NdO1xuICB9XG4gIGdldCB2aWV3cygpOiBJTFZpZXdEZWJ1Z1tdIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXIuc2xpY2UoQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpXG4gICAgICAgIC5tYXAodG9EZWJ1ZyBhcyAobDogTFZpZXcpID0+IElMVmlld0RlYnVnKTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IElMVmlld0RlYnVnfG51bGwge1xuICAgIHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW1BBUkVOVF0pO1xuICB9XG4gIGdldCBtb3ZlZFZpZXdzKCk6IExWaWV3W118bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW01PVkVEX1ZJRVdTXTtcbiAgfVxuICBnZXQgaG9zdCgpOiBSRWxlbWVudHxSQ29tbWVudHxMVmlldyB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0hPU1RdO1xuICB9XG4gIGdldCBuYXRpdmUoKTogUkNvbW1lbnQge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltOQVRJVkVdO1xuICB9XG4gIGdldCBuZXh0KCkge1xuICAgIHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW05FWFRdKTtcbiAgfVxufVxuIl19