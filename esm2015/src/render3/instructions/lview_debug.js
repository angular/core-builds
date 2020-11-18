/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { assertNodeInjector } from '../assert';
import { getInjectorIndex } from '../di';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS, NATIVE } from '../interfaces/container';
import { NO_PARENT_INJECTOR } from '../interfaces/injector';
import { toTNodeTypeAsString } from '../interfaces/node';
import { getTStylingRangeNext, getTStylingRangeNextDuplicate, getTStylingRangePrev, getTStylingRangePrevDuplicate } from '../interfaces/styling';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TVIEW, TViewTypeAsString } from '../interfaces/view';
import { attachDebugObject } from '../util/debug_utils';
import { getParentInjectorIndex, getParentInjectorView } from '../util/injector_utils';
import { unwrapRNode } from '../util/view_utils';
const NG_DEV_MODE = ((typeof ngDevMode === 'undefined' || !!ngDevMode) && initNgDevMode());
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
function getLViewToClone(type, name) {
    switch (type) {
        case 0 /* Root */:
            if (LVIEW_ROOT === undefined)
                LVIEW_ROOT = new (createNamedArrayType('LRootView'))();
            return LVIEW_ROOT;
        case 1 /* Component */:
            if (LVIEW_COMPONENT_CACHE === undefined)
                LVIEW_COMPONENT_CACHE = new Map();
            let componentArray = LVIEW_COMPONENT_CACHE.get(name);
            if (componentArray === undefined) {
                componentArray = new (createNamedArrayType('LComponentView' + nameSuffix(name)))();
                LVIEW_COMPONENT_CACHE.set(name, componentArray);
            }
            return componentArray;
        case 2 /* Embedded */:
            if (LVIEW_EMBEDDED_CACHE === undefined)
                LVIEW_EMBEDDED_CACHE = new Map();
            let embeddedArray = LVIEW_EMBEDDED_CACHE.get(name);
            if (embeddedArray === undefined) {
                embeddedArray = new (createNamedArrayType('LEmbeddedView' + nameSuffix(name)))();
                LVIEW_EMBEDDED_CACHE.set(name, embeddedArray);
            }
            return embeddedArray;
    }
    throw new Error('unreachable code');
}
function nameSuffix(text) {
    if (text == null)
        return '';
    const index = text.lastIndexOf('_Template');
    return '_' + (index === -1 ? text : text.substr(0, index));
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
        ngDevMode && assertNodeInjector(lView, injectorIndex);
        while (injectorIndex !== -1) {
            const tNode = lView[TVIEW].data[injectorIndex + 8 /* TNODE */];
            path.push(buildDebugNode(tNode, lView));
            const parentLocation = lView[injectorIndex + 8 /* PARENT */];
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
        if (this.flags & 16 /* hasClassInput */)
            flags.push('TNodeFlags.hasClassInput');
        if (this.flags & 8 /* hasContentQuery */)
            flags.push('TNodeFlags.hasContentQuery');
        if (this.flags & 32 /* hasStyleInput */)
            flags.push('TNodeFlags.hasStyleInput');
        if (this.flags & 128 /* hasHostBindings */)
            flags.push('TNodeFlags.hasHostBindings');
        if (this.flags & 2 /* isComponentHost */)
            flags.push('TNodeFlags.isComponentHost');
        if (this.flags & 1 /* isDirectiveHost */)
            flags.push('TNodeFlags.isDirectiveHost');
        if (this.flags & 64 /* isDetached */)
            flags.push('TNodeFlags.isDetached');
        if (this.flags & 4 /* isProjected */)
            flags.push('TNodeFlags.isProjected');
        return flags.join('|');
    }
    get template_() {
        if (this.type & 1 /* Text */)
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
        return this.providerIndexes & 1048575 /* ProvidersStartIndexMask */;
    }
    get providerIndexEnd_() {
        return this.providerIndexStart_ +
            (this.providerIndexes >>> 20 /* CptViewProvidersCountShift */);
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
const TViewData = NG_DEV_MODE && createNamedArrayType('TViewData') || null;
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
export const LViewBlueprint = NG_DEV_MODE && createNamedArrayType('LViewBlueprint') || null;
export const MatchesArray = NG_DEV_MODE && createNamedArrayType('MatchesArray') || null;
export const TViewComponents = NG_DEV_MODE && createNamedArrayType('TViewComponents') || null;
export const TNodeLocalNames = NG_DEV_MODE && createNamedArrayType('TNodeLocalNames') || null;
export const TNodeInitialInputs = NG_DEV_MODE && createNamedArrayType('TNodeInitialInputs') || null;
export const TNodeInitialData = NG_DEV_MODE && createNamedArrayType('TNodeInitialData') || null;
export const LCleanup = NG_DEV_MODE && createNamedArrayType('LCleanup') || null;
export const TCleanup = NG_DEV_MODE && createNamedArrayType('TCleanup') || null;
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
            initPhaseState: flags & 3 /* InitPhaseStateMask */,
            creationMode: !!(flags & 4 /* CreationMode */),
            firstViewPass: !!(flags & 8 /* FirstLViewPass */),
            checkAlways: !!(flags & 16 /* CheckAlways */),
            dirty: !!(flags & 64 /* Dirty */),
            attached: !!(flags & 128 /* Attached */),
            destroyed: !!(flags & 256 /* Destroyed */),
            isRoot: !!(flags & 512 /* IsRoot */),
            indexWithinInitPhase: flags >> 11 /* IndexWithinInitPhaseShift */,
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
        native: native,
        children: toDebugNodes(tNode.child, lView),
        factories,
        instances,
        injector: buildNodeInjectorDebug(tNode, tView, lView)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFPSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDdkMsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFjLFdBQVcsRUFBRSxNQUFNLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUV6SCxPQUFPLEVBQUMsa0JBQWtCLEVBQXFCLE1BQU0sd0JBQXdCLENBQUM7QUFDOUUsT0FBTyxFQUE4SixtQkFBbUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBSXBOLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBRSxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBNkIsTUFBTSx1QkFBdUIsQ0FBQztBQUMzSyxPQUFPLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFhLGdCQUFnQixFQUFtQixLQUFLLEVBQUUsYUFBYSxFQUFZLElBQUksRUFBc0IsUUFBUSxFQUE4SCxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBMEIsS0FBSyxFQUFvQixpQkFBaUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3BjLE9BQU8sRUFBQyxpQkFBaUIsRUFB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ZUFBZTtJQUMxQixZQUE2QixlQUEyQjtRQUEzQixvQkFBZSxHQUFmLGVBQWUsQ0FBWTtJQUFHLENBQUM7SUFFNUQsSUFBSSxvQkFBb0I7UUFDdEIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUNELElBQUksS0FBSztRQUNQLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUM7YUFDckQsR0FBRyxDQUFDLE9BQW9DLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQ0QsSUFBSSxNQUFNO1FBQ1IsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFDRCxJQUFJLFVBQVU7UUFDWixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUNELElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBQ0QsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxJQUFJLElBQUk7UUFDTixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemVyJztcbmltcG9ydCB7S2V5VmFsdWVBcnJheX0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge2luaXROZ0Rldk1vZGV9IGZyb20gJy4uLy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuaW1wb3J0IHthc3NlcnROb2RlSW5qZWN0b3J9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2dldEluamVjdG9ySW5kZXh9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIEhBU19UUkFOU1BMQU5URURfVklFV1MsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTLCBOQVRJVkV9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3QsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05PX1BBUkVOVF9JTkpFQ1RPUiwgTm9kZUluamVjdG9yT2Zmc2V0fSBmcm9tICcuLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbnNlcnRCZWZvcmVJbmRleCwgUHJvcGVydHlBbGlhc2VzLCBUQ29uc3RhbnRzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSBhcyBJVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIHRvVE5vZGVUeXBlQXNTdHJpbmd9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1NlbGVjdG9yRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge0xRdWVyaWVzLCBUUXVlcmllc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBSTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2dldFRTdHlsaW5nUmFuZ2VOZXh0LCBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSwgZ2V0VFN0eWxpbmdSYW5nZVByZXYsIGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlLCBUU3R5bGluZ0tleSwgVFN0eWxpbmdSYW5nZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgRGVidWdOb2RlLCBERUNMQVJBVElPTl9WSUVXLCBEZXN0cm95SG9va0RhdGEsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIb29rRGF0YSwgSE9TVCwgSG9zdEJpbmRpbmdPcENvZGVzLCBJTkpFQ1RPUiwgTENvbnRhaW5lckRlYnVnIGFzIElMQ29udGFpbmVyRGVidWcsIExWaWV3LCBMVmlld0RlYnVnIGFzIElMVmlld0RlYnVnLCBMVmlld0RlYnVnUmFuZ2UsIExWaWV3RGVidWdSYW5nZUNvbnRlbnQsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFNBTklUSVpFUiwgVF9IT1NULCBURGF0YSwgVFZpZXcgYXMgSVRWaWV3LCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZSwgVFZpZXdUeXBlQXNTdHJpbmd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3fSBmcm9tICcuLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7dW53cmFwUk5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmNvbnN0IE5HX0RFVl9NT0RFID0gKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCAhIW5nRGV2TW9kZSkgJiYgaW5pdE5nRGV2TW9kZSgpKTtcblxuLypcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjb25kaXRpb25hbGx5IGF0dGFjaGVkIGNsYXNzZXMgd2hpY2ggcHJvdmlkZSBodW1hbiByZWFkYWJsZSAoZGVidWcpIGxldmVsXG4gKiBpbmZvcm1hdGlvbiBmb3IgYExWaWV3YCwgYExDb250YWluZXJgIGFuZCBvdGhlciBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMuIFRoZXNlIGRhdGEgc3RydWN0dXJlc1xuICogYXJlIHN0b3JlZCBpbnRlcm5hbGx5IGFzIGFycmF5IHdoaWNoIG1ha2VzIGl0IHZlcnkgZGlmZmljdWx0IGR1cmluZyBkZWJ1Z2dpbmcgdG8gcmVhc29uIGFib3V0IHRoZVxuICogY3VycmVudCBzdGF0ZSBvZiB0aGUgc3lzdGVtLlxuICpcbiAqIFBhdGNoaW5nIHRoZSBhcnJheSB3aXRoIGV4dHJhIHByb3BlcnR5IGRvZXMgY2hhbmdlIHRoZSBhcnJheSdzIGhpZGRlbiBjbGFzcycgYnV0IGl0IGRvZXMgbm90XG4gKiBjaGFuZ2UgdGhlIGNvc3Qgb2YgYWNjZXNzLCB0aGVyZWZvcmUgdGhpcyBwYXRjaGluZyBzaG91bGQgbm90IGhhdmUgc2lnbmlmaWNhbnQgaWYgYW55IGltcGFjdCBpblxuICogYG5nRGV2TW9kZWAgbW9kZS4gKHNlZTogaHR0cHM6Ly9qc3BlcmYuY29tL2FycmF5LXZzLW1vbmtleS1wYXRjaC1hcnJheSlcbiAqXG4gKiBTbyBpbnN0ZWFkIG9mIHNlZWluZzpcbiAqIGBgYFxuICogQXJyYXkoMzApIFtPYmplY3QsIDY1OSwgbnVsbCwg4oCmXVxuICogYGBgXG4gKlxuICogWW91IGdldCB0byBzZWU6XG4gKiBgYGBcbiAqIExWaWV3RGVidWcge1xuICogICB2aWV3czogWy4uLl0sXG4gKiAgIGZsYWdzOiB7YXR0YWNoZWQ6IHRydWUsIC4uLn1cbiAqICAgbm9kZXM6IFtcbiAqICAgICB7aHRtbDogJzxkaXYgaWQ9XCIxMjNcIj4nLCAuLi4sIG5vZGVzOiBbXG4gKiAgICAgICB7aHRtbDogJzxzcGFuPicsIC4uLiwgbm9kZXM6IG51bGx9XG4gKiAgICAgXX1cbiAqICAgXVxuICogfVxuICogYGBgXG4gKi9cblxubGV0IExWSUVXX0NPTVBPTkVOVF9DQUNIRSE6IE1hcDxzdHJpbmd8bnVsbCwgQXJyYXk8YW55Pj47XG5sZXQgTFZJRVdfRU1CRURERURfQ0FDSEUhOiBNYXA8c3RyaW5nfG51bGwsIEFycmF5PGFueT4+O1xubGV0IExWSUVXX1JPT1QhOiBBcnJheTxhbnk+O1xuXG5pbnRlcmZhY2UgVFZpZXdEZWJ1ZyBleHRlbmRzIElUVmlldyB7XG4gIHR5cGU6IFRWaWV3VHlwZTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNsb25lcyBhIGJsdWVwcmludCBhbmQgY3JlYXRlcyBMVmlldy5cbiAqXG4gKiBTaW1wbGUgc2xpY2Ugd2lsbCBrZWVwIHRoZSBzYW1lIHR5cGUsIGFuZCB3ZSBuZWVkIGl0IHRvIGJlIExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZVRvTFZpZXdGcm9tVFZpZXdCbHVlcHJpbnQodFZpZXc6IFRWaWV3KTogTFZpZXcge1xuICBjb25zdCBkZWJ1Z1RWaWV3ID0gdFZpZXcgYXMgVFZpZXdEZWJ1ZztcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlld1RvQ2xvbmUoZGVidWdUVmlldy50eXBlLCB0Vmlldy50ZW1wbGF0ZSAmJiB0Vmlldy50ZW1wbGF0ZS5uYW1lKTtcbiAgcmV0dXJuIGxWaWV3LmNvbmNhdCh0Vmlldy5ibHVlcHJpbnQpIGFzIGFueTtcbn1cblxuZnVuY3Rpb24gZ2V0TFZpZXdUb0Nsb25lKHR5cGU6IFRWaWV3VHlwZSwgbmFtZTogc3RyaW5nfG51bGwpOiBBcnJheTxhbnk+IHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBUVmlld1R5cGUuUm9vdDpcbiAgICAgIGlmIChMVklFV19ST09UID09PSB1bmRlZmluZWQpIExWSUVXX1JPT1QgPSBuZXcgKGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMUm9vdFZpZXcnKSkoKTtcbiAgICAgIHJldHVybiBMVklFV19ST09UO1xuICAgIGNhc2UgVFZpZXdUeXBlLkNvbXBvbmVudDpcbiAgICAgIGlmIChMVklFV19DT01QT05FTlRfQ0FDSEUgPT09IHVuZGVmaW5lZCkgTFZJRVdfQ09NUE9ORU5UX0NBQ0hFID0gbmV3IE1hcCgpO1xuICAgICAgbGV0IGNvbXBvbmVudEFycmF5ID0gTFZJRVdfQ09NUE9ORU5UX0NBQ0hFLmdldChuYW1lKTtcbiAgICAgIGlmIChjb21wb25lbnRBcnJheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudEFycmF5ID0gbmV3IChjcmVhdGVOYW1lZEFycmF5VHlwZSgnTENvbXBvbmVudFZpZXcnICsgbmFtZVN1ZmZpeChuYW1lKSkpKCk7XG4gICAgICAgIExWSUVXX0NPTVBPTkVOVF9DQUNIRS5zZXQobmFtZSwgY29tcG9uZW50QXJyYXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbXBvbmVudEFycmF5O1xuICAgIGNhc2UgVFZpZXdUeXBlLkVtYmVkZGVkOlxuICAgICAgaWYgKExWSUVXX0VNQkVEREVEX0NBQ0hFID09PSB1bmRlZmluZWQpIExWSUVXX0VNQkVEREVEX0NBQ0hFID0gbmV3IE1hcCgpO1xuICAgICAgbGV0IGVtYmVkZGVkQXJyYXkgPSBMVklFV19FTUJFRERFRF9DQUNIRS5nZXQobmFtZSk7XG4gICAgICBpZiAoZW1iZWRkZWRBcnJheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGVtYmVkZGVkQXJyYXkgPSBuZXcgKGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMRW1iZWRkZWRWaWV3JyArIG5hbWVTdWZmaXgobmFtZSkpKSgpO1xuICAgICAgICBMVklFV19FTUJFRERFRF9DQUNIRS5zZXQobmFtZSwgZW1iZWRkZWRBcnJheSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1iZWRkZWRBcnJheTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3VucmVhY2hhYmxlIGNvZGUnKTtcbn1cblxuZnVuY3Rpb24gbmFtZVN1ZmZpeCh0ZXh0OiBzdHJpbmd8bnVsbHx1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAodGV4dCA9PSBudWxsKSByZXR1cm4gJyc7XG4gIGNvbnN0IGluZGV4ID0gdGV4dC5sYXN0SW5kZXhPZignX1RlbXBsYXRlJyk7XG4gIHJldHVybiAnXycgKyAoaW5kZXggPT09IC0xID8gdGV4dCA6IHRleHQuc3Vic3RyKDAsIGluZGV4KSk7XG59XG5cbi8qKlxuICogVGhpcyBjbGFzcyBpcyBhIGRlYnVnIHZlcnNpb24gb2YgT2JqZWN0IGxpdGVyYWwgc28gdGhhdCB3ZSBjYW4gaGF2ZSBjb25zdHJ1Y3RvciBuYW1lIHNob3cgdXBcbiAqIGluXG4gKiBkZWJ1ZyB0b29scyBpbiBuZ0Rldk1vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBUVmlld0NvbnN0cnVjdG9yID0gY2xhc3MgVFZpZXcgaW1wbGVtZW50cyBJVFZpZXcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyB0eXBlOiBUVmlld1R5cGUsXG4gICAgICBwdWJsaWMgYmx1ZXByaW50OiBMVmlldyxcbiAgICAgIHB1YmxpYyB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsXG4gICAgICBwdWJsaWMgcXVlcmllczogVFF1ZXJpZXN8bnVsbCxcbiAgICAgIHB1YmxpYyB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+fG51bGwsXG4gICAgICBwdWJsaWMgZGVjbFROb2RlOiBJVE5vZGV8bnVsbCxcbiAgICAgIHB1YmxpYyBkYXRhOiBURGF0YSxcbiAgICAgIHB1YmxpYyBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgcHVibGljIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIsXG4gICAgICBwdWJsaWMgaG9zdEJpbmRpbmdPcENvZGVzOiBIb3N0QmluZGluZ09wQ29kZXN8bnVsbCxcbiAgICAgIHB1YmxpYyBmaXJzdENyZWF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICBwdWJsaWMgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuLFxuICAgICAgcHVibGljIHN0YXRpY1ZpZXdRdWVyaWVzOiBib29sZWFuLFxuICAgICAgcHVibGljIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBib29sZWFuLFxuICAgICAgcHVibGljIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgcHJlT3JkZXJDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgcHVibGljIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgIHB1YmxpYyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgIHB1YmxpYyB2aWV3SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICBwdWJsaWMgZGVzdHJveUhvb2tzOiBEZXN0cm95SG9va0RhdGF8bnVsbCxcbiAgICAgIHB1YmxpYyBjbGVhbnVwOiBhbnlbXXxudWxsLFxuICAgICAgcHVibGljIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLFxuICAgICAgcHVibGljIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwsXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCxcbiAgICAgIHB1YmxpYyBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGwsXG4gICAgICBwdWJsaWMgZmlyc3RDaGlsZDogSVROb2RlfG51bGwsXG4gICAgICBwdWJsaWMgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLFxuICAgICAgcHVibGljIGNvbnN0czogVENvbnN0YW50c3xudWxsLFxuICAgICAgcHVibGljIGluY29tcGxldGVGaXJzdFBhc3M6IGJvb2xlYW4sXG4gICAgICBwdWJsaWMgX2RlY2xzOiBudW1iZXIsXG4gICAgICBwdWJsaWMgX3ZhcnM6IG51bWJlcixcblxuICApIHt9XG5cbiAgZ2V0IHRlbXBsYXRlXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICBwcm9jZXNzVE5vZGVDaGlsZHJlbih0aGlzLmZpcnN0Q2hpbGQsIGJ1Zik7XG4gICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbiAgfVxuXG4gIGdldCB0eXBlXygpOiBzdHJpbmcge1xuICAgIHJldHVybiBUVmlld1R5cGVBc1N0cmluZ1t0aGlzLnR5cGVdIHx8IGBUVmlld1R5cGUuPyR7dGhpcy50eXBlfT9gO1xuICB9XG59O1xuXG5jbGFzcyBUTm9kZSBpbXBsZW1lbnRzIElUTm9kZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHRWaWV3XzogVFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdHlwZTogVE5vZGVUeXBlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluc2VydEJlZm9yZUluZGV4OiBJbnNlcnRCZWZvcmVJbmRleCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5qZWN0b3JJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVTdGFydDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZUVuZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlU3R5bGluZ0xhc3Q6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZsYWdzOiBUTm9kZUZsYWdzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlcywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2YWx1ZTogc3RyaW5nfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbCwgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbWVyZ2VkQXR0cnM6IChzdHJpbmd8QXR0cmlidXRlTWFya2VyfChzdHJpbmd8U2VsZWN0b3JGbGFncylbXSlbXXxudWxsLCAgLy9cbiAgICAgIHB1YmxpYyBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRWaWV3czogSVRWaWV3fElUVmlld1tdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNoaWxkOiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uOiBudW1iZXJ8KElUTm9kZXxSTm9kZVtdKVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlczogc3RyaW5nfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3R5bGVzV2l0aG91dEhvc3Q6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyByZXNpZHVhbFN0eWxlczogS2V5VmFsdWVBcnJheTxhbnk+fHVuZGVmaW5lZHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzZXM6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2xhc3Nlc1dpdGhvdXRIb3N0OiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyByZXNpZHVhbENsYXNzZXM6IEtleVZhbHVlQXJyYXk8YW55Pnx1bmRlZmluZWR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3R5bGVCaW5kaW5nczogVFN0eWxpbmdSYW5nZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgKSB7fVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBodW1hbiBkZWJ1ZyB2ZXJzaW9uIG9mIHRoZSBzZXQgb2YgYE5vZGVJbmplY3RvcmBzIHdoaWNoIHdpbGwgYmUgY29uc3VsdGVkIHdoZW5cbiAgICogcmVzb2x2aW5nIHRva2VucyBmcm9tIHRoaXMgYFROb2RlYC5cbiAgICpcbiAgICogV2hlbiBkZWJ1Z2dpbmcgYXBwbGljYXRpb25zLCBpdCBpcyBvZnRlbiBkaWZmaWN1bHQgdG8gZGV0ZXJtaW5lIHdoaWNoIGBOb2RlSW5qZWN0b3JgcyB3aWxsIGJlXG4gICAqIGNvbnN1bHRlZC4gVGhpcyBtZXRob2Qgc2hvd3MgYSBsaXN0IG9mIGBEZWJ1Z05vZGVgcyByZXByZXNlbnRpbmcgdGhlIGBUTm9kZWBzIHdoaWNoIHdpbGwgYmVcbiAgICogY29uc3VsdGVkIGluIG9yZGVyIHdoZW4gcmVzb2x2aW5nIGEgdG9rZW4gc3RhcnRpbmcgYXQgdGhpcyBgVE5vZGVgLlxuICAgKlxuICAgKiBUaGUgb3JpZ2luYWwgZGF0YSBpcyBzdG9yZWQgaW4gYExWaWV3YCBhbmQgYFRWaWV3YCB3aXRoIGEgbG90IG9mIG9mZnNldCBpbmRleGVzLCBhbmQgc28gaXQgaXNcbiAgICogZGlmZmljdWx0IHRvIHJlYXNvbiBhYm91dC5cbiAgICpcbiAgICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIGluc3RhbmNlIGZvciB0aGlzIGBUTm9kZWAuXG4gICAqL1xuICBkZWJ1Z05vZGVJbmplY3RvclBhdGgobFZpZXc6IExWaWV3KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IHBhdGg6IERlYnVnTm9kZVtdID0gW107XG4gICAgbGV0IGluamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHRoaXMsIGxWaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZUluamVjdG9yKGxWaWV3LCBpbmplY3RvckluZGV4KTtcbiAgICB3aGlsZSAoaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5UTk9ERV0gYXMgVE5vZGU7XG4gICAgICBwYXRoLnB1c2goYnVpbGREZWJ1Z05vZGUodE5vZGUsIGxWaWV3KSk7XG4gICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGxWaWV3W2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuUEFSRU5UXTtcbiAgICAgIGlmIChwYXJlbnRMb2NhdGlvbiA9PT0gTk9fUEFSRU5UX0lOSkVDVE9SKSB7XG4gICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgbFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBnZXQgdHlwZV8oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdG9UTm9kZVR5cGVBc1N0cmluZyh0aGlzLnR5cGUpIHx8IGBUTm9kZVR5cGUuPyR7dGhpcy50eXBlfT9gO1xuICB9XG5cbiAgZ2V0IGZsYWdzXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZsYWdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeScpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncycpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3QnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNEZXRhY2hlZCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RldGFjaGVkJyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzUHJvamVjdGVkJyk7XG4gICAgcmV0dXJuIGZsYWdzLmpvaW4oJ3wnKTtcbiAgfVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBpZiAodGhpcy50eXBlICYgVE5vZGVUeXBlLlRleHQpIHJldHVybiB0aGlzLnZhbHVlITtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgY29uc3QgdGFnTmFtZSA9IHR5cGVvZiB0aGlzLnZhbHVlID09PSAnc3RyaW5nJyAmJiB0aGlzLnZhbHVlIHx8IHRoaXMudHlwZV87XG4gICAgYnVmLnB1c2goJzwnLCB0YWdOYW1lKTtcbiAgICBpZiAodGhpcy5mbGFncykge1xuICAgICAgYnVmLnB1c2goJyAnLCB0aGlzLmZsYWdzXyk7XG4gICAgfVxuICAgIGlmICh0aGlzLmF0dHJzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXR0cnMubGVuZ3RoOykge1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHRoaXMuYXR0cnNbaSsrXTtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyTmFtZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IHRoaXMuYXR0cnNbaSsrXTtcbiAgICAgICAgYnVmLnB1c2goJyAnLCBhdHRyTmFtZSBhcyBzdHJpbmcsICc9XCInLCBhdHRyVmFsdWUgYXMgc3RyaW5nLCAnXCInKTtcbiAgICAgIH1cbiAgICB9XG4gICAgYnVmLnB1c2goJz4nKTtcbiAgICBwcm9jZXNzVE5vZGVDaGlsZHJlbih0aGlzLmNoaWxkLCBidWYpO1xuICAgIGJ1Zi5wdXNoKCc8LycsIHRhZ05hbWUsICc+Jyk7XG4gICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbiAgfVxuXG4gIGdldCBzdHlsZUJpbmRpbmdzXygpOiBEZWJ1Z1N0eWxlQmluZGluZ3Mge1xuICAgIHJldHVybiB0b0RlYnVnU3R5bGVCaW5kaW5nKHRoaXMsIGZhbHNlKTtcbiAgfVxuICBnZXQgY2xhc3NCaW5kaW5nc18oKTogRGVidWdTdHlsZUJpbmRpbmdzIHtcbiAgICByZXR1cm4gdG9EZWJ1Z1N0eWxlQmluZGluZyh0aGlzLCB0cnVlKTtcbiAgfVxuXG4gIGdldCBwcm92aWRlckluZGV4U3RhcnRfKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gIH1cbiAgZ2V0IHByb3ZpZGVySW5kZXhFbmRfKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJJbmRleFN0YXJ0XyArXG4gICAgICAgICh0aGlzLnByb3ZpZGVySW5kZXhlcyA+Pj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQpO1xuICB9XG59XG5leHBvcnQgY29uc3QgVE5vZGVEZWJ1ZyA9IFROb2RlO1xuZXhwb3J0IHR5cGUgVE5vZGVEZWJ1ZyA9IFROb2RlO1xuXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGVCaW5kaW5ncyBleHRlbmRzXG4gICAgQXJyYXk8S2V5VmFsdWVBcnJheTxhbnk+fERlYnVnU3R5bGVCaW5kaW5nfHN0cmluZ3xudWxsPiB7fVxuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxlQmluZGluZyB7XG4gIGtleTogVFN0eWxpbmdLZXk7XG4gIGluZGV4OiBudW1iZXI7XG4gIGlzVGVtcGxhdGU6IGJvb2xlYW47XG4gIHByZXZEdXBsaWNhdGU6IGJvb2xlYW47XG4gIG5leHREdXBsaWNhdGU6IGJvb2xlYW47XG4gIHByZXZJbmRleDogbnVtYmVyO1xuICBuZXh0SW5kZXg6IG51bWJlcjtcbn1cblxuZnVuY3Rpb24gdG9EZWJ1Z1N0eWxlQmluZGluZyh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IERlYnVnU3R5bGVCaW5kaW5ncyB7XG4gIGNvbnN0IHREYXRhID0gdE5vZGUudFZpZXdfLmRhdGE7XG4gIGNvbnN0IGJpbmRpbmdzOiBEZWJ1Z1N0eWxlQmluZGluZ3MgPSBbXSBhcyBhbnk7XG4gIGNvbnN0IHJhbmdlID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3M7XG4gIGNvbnN0IHByZXYgPSBnZXRUU3R5bGluZ1JhbmdlUHJldihyYW5nZSk7XG4gIGNvbnN0IG5leHQgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dChyYW5nZSk7XG4gIGxldCBpc1RlbXBsYXRlID0gbmV4dCAhPT0gMDtcbiAgbGV0IGN1cnNvciA9IGlzVGVtcGxhdGUgPyBuZXh0IDogcHJldjtcbiAgd2hpbGUgKGN1cnNvciAhPT0gMCkge1xuICAgIGNvbnN0IGl0ZW1LZXkgPSB0RGF0YVtjdXJzb3JdIGFzIFRTdHlsaW5nS2V5O1xuICAgIGNvbnN0IGl0ZW1SYW5nZSA9IHREYXRhW2N1cnNvciArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgYmluZGluZ3MudW5zaGlmdCh7XG4gICAgICBrZXk6IGl0ZW1LZXksXG4gICAgICBpbmRleDogY3Vyc29yLFxuICAgICAgaXNUZW1wbGF0ZTogaXNUZW1wbGF0ZSxcbiAgICAgIHByZXZEdXBsaWNhdGU6IGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKGl0ZW1SYW5nZSksXG4gICAgICBuZXh0RHVwbGljYXRlOiBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZShpdGVtUmFuZ2UpLFxuICAgICAgbmV4dEluZGV4OiBnZXRUU3R5bGluZ1JhbmdlTmV4dChpdGVtUmFuZ2UpLFxuICAgICAgcHJldkluZGV4OiBnZXRUU3R5bGluZ1JhbmdlUHJldihpdGVtUmFuZ2UpLFxuICAgIH0pO1xuICAgIGlmIChjdXJzb3IgPT09IHByZXYpIGlzVGVtcGxhdGUgPSBmYWxzZTtcbiAgICBjdXJzb3IgPSBnZXRUU3R5bGluZ1JhbmdlUHJldihpdGVtUmFuZ2UpO1xuICB9XG4gIGJpbmRpbmdzLnB1c2goKGlzQ2xhc3NCYXNlZCA/IHROb2RlLnJlc2lkdWFsQ2xhc3NlcyA6IHROb2RlLnJlc2lkdWFsU3R5bGVzKSB8fCBudWxsKTtcbiAgcmV0dXJuIGJpbmRpbmdzO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzVE5vZGVDaGlsZHJlbih0Tm9kZTogSVROb2RlfG51bGwsIGJ1Zjogc3RyaW5nW10pIHtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgYnVmLnB1c2goKHROb2RlIGFzIGFueSBhcyB7dGVtcGxhdGVfOiBzdHJpbmd9KS50ZW1wbGF0ZV8pO1xuICAgIHROb2RlID0gdE5vZGUubmV4dDtcbiAgfVxufVxuXG5jb25zdCBUVmlld0RhdGEgPSBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVFZpZXdEYXRhJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmxldCBUVklFV0RBVEFfRU1QVFk6IHVua25vd25bXTsgIC8vIGNhbid0IGluaXRpYWxpemUgaGVyZSBvciBpdCB3aWxsIG5vdCBiZSB0cmVlIHNoYWtlbiwgYmVjYXVzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYExWaWV3YCBjb25zdHJ1Y3RvciBjb3VsZCBoYXZlIHNpZGUtZWZmZWN0cy5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgVERhdGEuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBURGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb1RWaWV3RGF0YShsaXN0OiBhbnlbXSk6IFREYXRhIHtcbiAgaWYgKFRWSUVXREFUQV9FTVBUWSA9PT0gdW5kZWZpbmVkKSBUVklFV0RBVEFfRU1QVFkgPSBuZXcgVFZpZXdEYXRhKCk7XG4gIHJldHVybiBUVklFV0RBVEFfRU1QVFkuY29uY2F0KGxpc3QpIGFzIGFueTtcbn1cblxuZXhwb3J0IGNvbnN0IExWaWV3Qmx1ZXByaW50ID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFZpZXdCbHVlcHJpbnQnKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IE1hdGNoZXNBcnJheSA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ01hdGNoZXNBcnJheScpIHx8IG51bGwhIGFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVFZpZXdDb21wb25lbnRzID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVFZpZXdDb21wb25lbnRzJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUTm9kZUxvY2FsTmFtZXMgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUxvY2FsTmFtZXMnKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbElucHV0cyA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbElucHV0cycpIHx8IG51bGwhIGFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVE5vZGVJbml0aWFsRGF0YSA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbERhdGEnKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IExDbGVhbnVwID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTENsZWFudXAnKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFRDbGVhbnVwID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVENsZWFudXAnKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExWaWV3RGVidWcobFZpZXc6IExWaWV3KSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxWaWV3LCBuZXcgTFZpZXdEZWJ1ZyhsVmlldykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoTENvbnRhaW5lckRlYnVnKGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobENvbnRhaW5lciwgbmV3IExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcpOiBJTFZpZXdEZWJ1ZztcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXd8bnVsbCk6IElMVmlld0RlYnVnfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3fExDb250YWluZXJ8bnVsbCk6IElMVmlld0RlYnVnfElMQ29udGFpbmVyRGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogYW55KTogYW55IHtcbiAgaWYgKG9iaikge1xuICAgIGNvbnN0IGRlYnVnID0gKG9iaiBhcyBhbnkpLmRlYnVnO1xuICAgIGFzc2VydERlZmluZWQoZGVidWcsICdPYmplY3QgZG9lcyBub3QgaGF2ZSBhIGRlYnVnIHJlcHJlc2VudGF0aW9uLicpO1xuICAgIHJldHVybiBkZWJ1ZztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG59XG5cbi8qKlxuICogVXNlIHRoaXMgbWV0aG9kIHRvIHVud3JhcCBhIG5hdGl2ZSBlbGVtZW50IGluIGBMVmlld2AgYW5kIGNvbnZlcnQgaXQgaW50byBIVE1MIGZvciBlYXNpZXJcbiAqIHJlYWRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIHBvc3NpYmx5IHdyYXBwZWQgbmF0aXZlIERPTSBub2RlLlxuICogQHBhcmFtIGluY2x1ZGVDaGlsZHJlbiBJZiBgdHJ1ZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBpbmNsdWRlIGNoaWxkIGVsZW1lbnRzXG4gKiAoc2FtZVxuICogYXMgYG91dGVySFRNTGApLiBJZiBgZmFsc2VgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgb25seSBjb250YWluIHRoZSBlbGVtZW50XG4gKiBpdHNlbGZcbiAqICh3aWxsIG5vdCBzZXJpYWxpemUgY2hpbGQgZWxlbWVudHMpLlxuICovXG5mdW5jdGlvbiB0b0h0bWwodmFsdWU6IGFueSwgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IG5vZGU6IE5vZGV8bnVsbCA9IHVud3JhcFJOb2RlKHZhbHVlKSBhcyBhbnk7XG4gIGlmIChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudDtcbiAgICAgIGNhc2UgTm9kZS5DT01NRU5UX05PREU6XG4gICAgICAgIHJldHVybiBgPCEtLSR7KG5vZGUgYXMgQ29tbWVudCkudGV4dENvbnRlbnR9LS0+YDtcbiAgICAgIGNhc2UgTm9kZS5FTEVNRU5UX05PREU6XG4gICAgICAgIGNvbnN0IG91dGVySFRNTCA9IChub2RlIGFzIEVsZW1lbnQpLm91dGVySFRNTDtcbiAgICAgICAgaWYgKGluY2x1ZGVDaGlsZHJlbikge1xuICAgICAgICAgIHJldHVybiBvdXRlckhUTUw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgaW5uZXJIVE1MID0gJz4nICsgKG5vZGUgYXMgRWxlbWVudCkuaW5uZXJIVE1MICsgJzwnO1xuICAgICAgICAgIHJldHVybiAob3V0ZXJIVE1MLnNwbGl0KGlubmVySFRNTClbMF0pICsgJz4nO1xuICAgICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgTFZpZXdEZWJ1ZyBpbXBsZW1lbnRzIElMVmlld0RlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfcmF3X2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogRmxhZ3MgYXNzb2NpYXRlZCB3aXRoIHRoZSBgTFZpZXdgIHVucGFja2VkIGludG8gYSBtb3JlIHJlYWRhYmxlIHN0YXRlLlxuICAgKi9cbiAgZ2V0IGZsYWdzKCkge1xuICAgIGNvbnN0IGZsYWdzID0gdGhpcy5fcmF3X2xWaWV3W0ZMQUdTXTtcbiAgICByZXR1cm4ge1xuICAgICAgX19yYXdfX2ZsYWdzX186IGZsYWdzLFxuICAgICAgaW5pdFBoYXNlU3RhdGU6IGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2ssXG4gICAgICBjcmVhdGlvbk1vZGU6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpLFxuICAgICAgZmlyc3RWaWV3UGFzczogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSxcbiAgICAgIGNoZWNrQWx3YXlzOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpLFxuICAgICAgZGlydHk6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EaXJ0eSksXG4gICAgICBhdHRhY2hlZDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSxcbiAgICAgIGRlc3Ryb3llZDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCksXG4gICAgICBpc1Jvb3Q6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5Jc1Jvb3QpLFxuICAgICAgaW5kZXhXaXRoaW5Jbml0UGhhc2U6IGZsYWdzID4+IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VTaGlmdCxcbiAgICB9O1xuICB9XG4gIGdldCBwYXJlbnQoKTogSUxWaWV3RGVidWd8SUxDb250YWluZXJEZWJ1Z3xudWxsIHtcbiAgICByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbUEFSRU5UXSk7XG4gIH1cbiAgZ2V0IGhvc3RIVE1MKCk6IHN0cmluZ3xudWxsIHtcbiAgICByZXR1cm4gdG9IdG1sKHRoaXMuX3Jhd19sVmlld1tIT1NUXSwgdHJ1ZSk7XG4gIH1cbiAgZ2V0IGh0bWwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKHRoaXMubm9kZXMgfHwgW10pLm1hcChtYXBUb0hUTUwpLmpvaW4oJycpO1xuICB9XG4gIGdldCBjb250ZXh0KCk6IHt9fG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQ09OVEVYVF07XG4gIH1cbiAgLyoqXG4gICAqIFRoZSB0cmVlIG9mIG5vZGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBgTFZpZXdgLiBUaGUgbm9kZXMgaGF2ZSBiZWVuIG5vcm1hbGl6ZWQgaW50b1xuICAgKiBhIHRyZWUgc3RydWN0dXJlIHdpdGggcmVsZXZhbnQgZGV0YWlscyBwdWxsZWQgb3V0IGZvciByZWFkYWJpbGl0eS5cbiAgICovXG4gIGdldCBub2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yYXdfbFZpZXc7XG4gICAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgICByZXR1cm4gdG9EZWJ1Z05vZGVzKHROb2RlLCBsVmlldyk7XG4gIH1cbiAgZ2V0IHRlbXBsYXRlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICh0aGlzLnRWaWV3IGFzIGFueSBhcyB7dGVtcGxhdGVfOiBzdHJpbmd9KS50ZW1wbGF0ZV87XG4gIH1cbiAgZ2V0IHRWaWV3KCk6IElUVmlldyB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tUVklFV107XG4gIH1cbiAgZ2V0IGNsZWFudXAoKTogYW55W118bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tDTEVBTlVQXTtcbiAgfVxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3J8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tJTkpFQ1RPUl07XG4gIH1cbiAgZ2V0IHJlbmRlcmVyRmFjdG9yeSgpOiBSZW5kZXJlckZhY3RvcnkzIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICB9XG4gIGdldCByZW5kZXJlcigpOiBSZW5kZXJlcjMge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJdO1xuICB9XG4gIGdldCBzYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbU0FOSVRJWkVSXTtcbiAgfVxuICBnZXQgY2hpbGRIZWFkKCk6IElMVmlld0RlYnVnfElMQ29udGFpbmVyRGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX0hFQURdKTtcbiAgfVxuICBnZXQgbmV4dCgpOiBJTFZpZXdEZWJ1Z3xJTENvbnRhaW5lckRlYnVnfG51bGwge1xuICAgIHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tORVhUXSk7XG4gIH1cbiAgZ2V0IGNoaWxkVGFpbCgpOiBJTFZpZXdEZWJ1Z3xJTENvbnRhaW5lckRlYnVnfG51bGwge1xuICAgIHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tDSElMRF9UQUlMXSk7XG4gIH1cbiAgZ2V0IGRlY2xhcmF0aW9uVmlldygpOiBJTFZpZXdEZWJ1Z3xudWxsIHtcbiAgICByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbREVDTEFSQVRJT05fVklFV10pO1xuICB9XG4gIGdldCBxdWVyaWVzKCk6IExRdWVyaWVzfG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUVVFUklFU107XG4gIH1cbiAgZ2V0IHRIb3N0KCk6IElUTm9kZXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1RfSE9TVF07XG4gIH1cblxuICBnZXQgZGVjbHMoKTogTFZpZXdEZWJ1Z1JhbmdlIHtcbiAgICByZXR1cm4gdG9MVmlld1JhbmdlKHRoaXMudFZpZXcsIHRoaXMuX3Jhd19sVmlldywgSEVBREVSX09GRlNFVCwgdGhpcy50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCk7XG4gIH1cblxuICBnZXQgdmFycygpOiBMVmlld0RlYnVnUmFuZ2Uge1xuICAgIHJldHVybiB0b0xWaWV3UmFuZ2UoXG4gICAgICAgIHRoaXMudFZpZXcsIHRoaXMuX3Jhd19sVmlldywgdGhpcy50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCwgdGhpcy50Vmlldy5leHBhbmRvU3RhcnRJbmRleCk7XG4gIH1cblxuICBnZXQgZXhwYW5kbygpOiBMVmlld0RlYnVnUmFuZ2Uge1xuICAgIHJldHVybiB0b0xWaWV3UmFuZ2UoXG4gICAgICAgIHRoaXMudFZpZXcsIHRoaXMuX3Jhd19sVmlldywgdGhpcy50Vmlldy5leHBhbmRvU3RhcnRJbmRleCwgdGhpcy5fcmF3X2xWaWV3Lmxlbmd0aCk7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplZCB2aWV3IG9mIGNoaWxkIHZpZXdzIChhbmQgY29udGFpbmVycykgYXR0YWNoZWQgYXQgdGhpcyBsb2NhdGlvbi5cbiAgICovXG4gIGdldCBjaGlsZFZpZXdzKCk6IEFycmF5PElMVmlld0RlYnVnfElMQ29udGFpbmVyRGVidWc+IHtcbiAgICBjb25zdCBjaGlsZFZpZXdzOiBBcnJheTxJTFZpZXdEZWJ1Z3xJTENvbnRhaW5lckRlYnVnPiA9IFtdO1xuICAgIGxldCBjaGlsZCA9IHRoaXMuY2hpbGRIZWFkO1xuICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgY2hpbGRWaWV3cy5wdXNoKGNoaWxkKTtcbiAgICAgIGNoaWxkID0gY2hpbGQubmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkVmlld3M7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFwVG9IVE1MKG5vZGU6IERlYnVnTm9kZSk6IHN0cmluZyB7XG4gIGlmIChub2RlLnR5cGUgPT09ICdFbGVtZW50Q29udGFpbmVyJykge1xuICAgIHJldHVybiAobm9kZS5jaGlsZHJlbiB8fCBbXSkubWFwKG1hcFRvSFRNTCkuam9pbignJyk7XG4gIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSAnSWN1Q29udGFpbmVyJykge1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRvSHRtbChub2RlLm5hdGl2ZSwgdHJ1ZSkgfHwgJyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9MVmlld1JhbmdlKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6IExWaWV3RGVidWdSYW5nZSB7XG4gIGxldCBjb250ZW50OiBMVmlld0RlYnVnUmFuZ2VDb250ZW50W10gPSBbXTtcbiAgZm9yIChsZXQgaW5kZXggPSBzdGFydDsgaW5kZXggPCBlbmQ7IGluZGV4KyspIHtcbiAgICBjb250ZW50LnB1c2goe2luZGV4OiBpbmRleCwgdDogdFZpZXcuZGF0YVtpbmRleF0sIGw6IGxWaWV3W2luZGV4XX0pO1xuICB9XG4gIHJldHVybiB7c3RhcnQ6IHN0YXJ0LCBlbmQ6IGVuZCwgbGVuZ3RoOiBlbmQgLSBzdGFydCwgY29udGVudDogY29udGVudH07XG59XG5cbi8qKlxuICogVHVybnMgYSBmbGF0IGxpc3Qgb2Ygbm9kZXMgaW50byBhIHRyZWUgYnkgd2Fsa2luZyB0aGUgYXNzb2NpYXRlZCBgVE5vZGVgIHRyZWUuXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWdOb2Rlcyh0Tm9kZTogSVROb2RlfG51bGwsIGxWaWV3OiBMVmlldyk6IERlYnVnTm9kZVtdIHtcbiAgaWYgKHROb2RlKSB7XG4gICAgY29uc3QgZGVidWdOb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBsZXQgdE5vZGVDdXJzb3I6IElUTm9kZXxudWxsID0gdE5vZGU7XG4gICAgd2hpbGUgKHROb2RlQ3Vyc29yKSB7XG4gICAgICBkZWJ1Z05vZGVzLnB1c2goYnVpbGREZWJ1Z05vZGUodE5vZGVDdXJzb3IsIGxWaWV3KSk7XG4gICAgICB0Tm9kZUN1cnNvciA9IHROb2RlQ3Vyc29yLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiBkZWJ1Z05vZGVzO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGREZWJ1Z05vZGUodE5vZGU6IElUTm9kZSwgbFZpZXc6IExWaWV3KTogRGVidWdOb2RlIHtcbiAgY29uc3QgcmF3VmFsdWUgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIGNvbnN0IG5hdGl2ZSA9IHVud3JhcFJOb2RlKHJhd1ZhbHVlKTtcbiAgY29uc3QgZmFjdG9yaWVzOiBUeXBlPGFueT5bXSA9IFtdO1xuICBjb25zdCBpbnN0YW5jZXM6IGFueVtdID0gW107XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7IGkgPCB0Tm9kZS5kaXJlY3RpdmVFbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgZmFjdG9yaWVzLnB1c2goZGVmLnR5cGUpO1xuICAgIGluc3RhbmNlcy5wdXNoKGxWaWV3W2ldKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGh0bWw6IHRvSHRtbChuYXRpdmUpLFxuICAgIHR5cGU6IHRvVE5vZGVUeXBlQXNTdHJpbmcodE5vZGUudHlwZSksXG4gICAgbmF0aXZlOiBuYXRpdmUgYXMgYW55LFxuICAgIGNoaWxkcmVuOiB0b0RlYnVnTm9kZXModE5vZGUuY2hpbGQsIGxWaWV3KSxcbiAgICBmYWN0b3JpZXMsXG4gICAgaW5zdGFuY2VzLFxuICAgIGluamVjdG9yOiBidWlsZE5vZGVJbmplY3RvckRlYnVnKHROb2RlLCB0VmlldywgbFZpZXcpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkTm9kZUluamVjdG9yRGVidWcodE5vZGU6IElUTm9kZSwgdFZpZXc6IElUVmlldywgbFZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IHZpZXdQcm92aWRlcnM6IFR5cGU8YW55PltdID0gW107XG4gIGZvciAobGV0IGkgPSAodE5vZGUgYXMgVE5vZGUpLnByb3ZpZGVySW5kZXhTdGFydF87IGkgPCAodE5vZGUgYXMgVE5vZGUpLnByb3ZpZGVySW5kZXhFbmRfOyBpKyspIHtcbiAgICB2aWV3UHJvdmlkZXJzLnB1c2godFZpZXcuZGF0YVtpXSBhcyBUeXBlPGFueT4pO1xuICB9XG4gIGNvbnN0IHByb3ZpZGVyczogVHlwZTxhbnk+W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9ICh0Tm9kZSBhcyBUTm9kZSkucHJvdmlkZXJJbmRleEVuZF87IGkgPCAodE5vZGUgYXMgVE5vZGUpLmRpcmVjdGl2ZUVuZDsgaSsrKSB7XG4gICAgcHJvdmlkZXJzLnB1c2godFZpZXcuZGF0YVtpXSBhcyBUeXBlPGFueT4pO1xuICB9XG4gIGNvbnN0IG5vZGVJbmplY3RvckRlYnVnID0ge1xuICAgIGJsb29tOiB0b0Jsb29tKGxWaWV3LCB0Tm9kZS5pbmplY3RvckluZGV4KSxcbiAgICBjdW11bGF0aXZlQmxvb206IHRvQmxvb20odFZpZXcuZGF0YSwgdE5vZGUuaW5qZWN0b3JJbmRleCksXG4gICAgcHJvdmlkZXJzLFxuICAgIHZpZXdQcm92aWRlcnMsXG4gICAgcGFyZW50SW5qZWN0b3JJbmRleDogbFZpZXdbKHROb2RlIGFzIFROb2RlKS5wcm92aWRlckluZGV4U3RhcnRfIC0gMV0sXG4gIH07XG4gIHJldHVybiBub2RlSW5qZWN0b3JEZWJ1Zztcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgbnVtYmVyIGF0IGBpZHhgIGxvY2F0aW9uIGluIGBhcnJheWAgaW50byBiaW5hcnkgcmVwcmVzZW50YXRpb24uXG4gKlxuICogQHBhcmFtIGFycmF5XG4gKiBAcGFyYW0gaWR4XG4gKi9cbmZ1bmN0aW9uIGJpbmFyeShhcnJheTogYW55W10sIGlkeDogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgdmFsdWUgPSBhcnJheVtpZHhdO1xuICAvLyBJZiBub3QgYSBudW1iZXIgd2UgcHJpbnQgOCBgP2AgdG8gcmV0YWluIGFsaWdubWVudCBidXQgbGV0IHVzZXIga25vdyB0aGF0IGl0IHdhcyBjYWxsZWQgb25cbiAgLy8gd3JvbmcgdHlwZS5cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHJldHVybiAnPz8/Pz8/Pz8nO1xuICAvLyBXZSBwcmVmaXggMHMgc28gdGhhdCB3ZSBoYXZlIGNvbnN0YW50IGxlbmd0aCBudW1iZXJcbiAgY29uc3QgdGV4dCA9ICcwMDAwMDAwMCcgKyB2YWx1ZS50b1N0cmluZygyKTtcbiAgcmV0dXJuIHRleHQuc3Vic3RyaW5nKHRleHQubGVuZ3RoIC0gOCk7XG59XG5cbi8qKlxuICogQ29udmVydCBhIGJsb29tIGZpbHRlciBhdCBsb2NhdGlvbiBgaWR4YCBpbiBgYXJyYXlgIGludG8gYmluYXJ5IHJlcHJlc2VudGF0aW9uLlxuICpcbiAqIEBwYXJhbSBhcnJheVxuICogQHBhcmFtIGlkeFxuICovXG5mdW5jdGlvbiB0b0Jsb29tKGFycmF5OiBhbnlbXSwgaWR4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7YmluYXJ5KGFycmF5LCBpZHggKyA3KX1fJHtiaW5hcnkoYXJyYXksIGlkeCArIDYpfV8ke2JpbmFyeShhcnJheSwgaWR4ICsgNSl9XyR7XG4gICAgICBiaW5hcnkoYXJyYXksIGlkeCArIDQpfV8ke2JpbmFyeShhcnJheSwgaWR4ICsgMyl9XyR7YmluYXJ5KGFycmF5LCBpZHggKyAyKX1fJHtcbiAgICAgIGJpbmFyeShhcnJheSwgaWR4ICsgMSl9XyR7YmluYXJ5KGFycmF5LCBpZHggKyAwKX1gO1xufVxuXG5leHBvcnQgY2xhc3MgTENvbnRhaW5lckRlYnVnIGltcGxlbWVudHMgSUxDb250YWluZXJEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7fVxuXG4gIGdldCBoYXNUcmFuc3BsYW50ZWRWaWV3cygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbSEFTX1RSQU5TUExBTlRFRF9WSUVXU107XG4gIH1cbiAgZ2V0IHZpZXdzKCk6IElMVmlld0RlYnVnW10ge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lci5zbGljZShDT05UQUlORVJfSEVBREVSX09GRlNFVClcbiAgICAgICAgLm1hcCh0b0RlYnVnIGFzIChsOiBMVmlldykgPT4gSUxWaWV3RGVidWcpO1xuICB9XG4gIGdldCBwYXJlbnQoKTogSUxWaWV3RGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xDb250YWluZXJbUEFSRU5UXSk7XG4gIH1cbiAgZ2V0IG1vdmVkVmlld3MoKTogTFZpZXdbXXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbTU9WRURfVklFV1NdO1xuICB9XG4gIGdldCBob3N0KCk6IFJFbGVtZW50fFJDb21tZW50fExWaWV3IHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbSE9TVF07XG4gIH1cbiAgZ2V0IG5hdGl2ZSgpOiBSQ29tbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW05BVElWRV07XG4gIH1cbiAgZ2V0IG5leHQoKSB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xDb250YWluZXJbTkVYVF0pO1xuICB9XG59XG4iXX0=