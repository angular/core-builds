/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS, NATIVE } from '../interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from '../interfaces/i18n';
import { getTStylingRangeNext, getTStylingRangeNextDuplicate, getTStylingRangePrev, getTStylingRangePrevDuplicate } from '../interfaces/styling';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TVIEW } from '../interfaces/view';
import { attachDebugObject } from '../util/debug_utils';
import { getTNode, unwrapRNode } from '../util/view_utils';
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
    constructor(type, //
    id, //
    blueprint, //
    template, //
    queries, //
    viewQuery, //
    node, //
    data, //
    bindingStartIndex, //
    expandoStartIndex, //
    expandoInstructions, //
    firstCreatePass, //
    firstUpdatePass, //
    staticViewQueries, //
    staticContentQueries, //
    preOrderHooks, //
    preOrderCheckHooks, //
    contentHooks, //
    contentCheckHooks, //
    viewHooks, //
    viewCheckHooks, //
    destroyHooks, //
    cleanup, //
    contentQueries, //
    components, //
    directiveRegistry, //
    pipeRegistry, //
    firstChild, //
    schemas, //
    consts, //
    incompleteFirstPass //
    ) {
        this.type = type;
        this.id = id;
        this.blueprint = blueprint;
        this.template = template;
        this.queries = queries;
        this.viewQuery = viewQuery;
        this.node = node;
        this.data = data;
        this.bindingStartIndex = bindingStartIndex;
        this.expandoStartIndex = expandoStartIndex;
        this.expandoInstructions = expandoInstructions;
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
    }
    get template_() {
        const buf = [];
        processTNodeChildren(this.firstChild, buf);
        return buf.join('');
    }
};
class TNode {
    constructor(tView_, //
    type, //
    index, //
    injectorIndex, //
    directiveStart, //
    directiveEnd, //
    directiveStylingLast, //
    propertyBindings, //
    flags, //
    providerIndexes, //
    tagName, //
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
        this.injectorIndex = injectorIndex;
        this.directiveStart = directiveStart;
        this.directiveEnd = directiveEnd;
        this.directiveStylingLast = directiveStylingLast;
        this.propertyBindings = propertyBindings;
        this.flags = flags;
        this.providerIndexes = providerIndexes;
        this.tagName = tagName;
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
    get type_() {
        switch (this.type) {
            case 0 /* Container */:
                return 'TNodeType.Container';
            case 3 /* Element */:
                return 'TNodeType.Element';
            case 4 /* ElementContainer */:
                return 'TNodeType.ElementContainer';
            case 5 /* IcuContainer */:
                return 'TNodeType.IcuContainer';
            case 1 /* Projection */:
                return 'TNodeType.Projection';
            case 2 /* View */:
                return 'TNodeType.View';
            default:
                return 'TNodeType.???';
        }
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
        const buf = [];
        buf.push('<', this.tagName || this.type_);
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
        buf.push('</', this.tagName || this.type_, '>');
        return buf.join('');
    }
    get styleBindings_() {
        return toDebugStyleBinding(this, false);
    }
    get classBindings_() {
        return toDebugStyleBinding(this, true);
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
        const isTextNode = node.nodeType === Node.TEXT_NODE;
        const outerHTML = (isTextNode ? node.textContent : node.outerHTML) || '';
        if (includeChildren || isTextNode) {
            return outerHTML;
        }
        else {
            const innerHTML = '>' + node.innerHTML + '<';
            return (outerHTML.split(innerHTML)[0]) + '>';
        }
    }
    else {
        return null;
    }
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
    get host() {
        return toHtml(this._raw_lView[HOST], true);
    }
    get html() {
        return (this.nodes || []).map(node => toHtml(node.native, true)).join('');
    }
    get context() {
        return this._raw_lView[CONTEXT];
    }
    /**
     * The tree of nodes associated with the current `LView`. The nodes have been normalized into
     * a
     * tree structure with relevant details pulled out for readability.
     */
    get nodes() {
        const lView = this._raw_lView;
        const tNode = lView[TVIEW].firstChild;
        return toDebugNodes(tNode, lView);
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
            debugNodes.push(buildDebugNode(tNodeCursor, lView, tNodeCursor.index));
            tNodeCursor = tNodeCursor.next;
        }
        return debugNodes;
    }
    else {
        return null;
    }
}
export function buildDebugNode(tNode, lView, nodeIndex) {
    const rawValue = lView[nodeIndex];
    const native = unwrapRNode(rawValue);
    const componentLViewDebug = toDebug(readLViewValue(rawValue));
    return {
        html: toHtml(native),
        native: native,
        nodes: toDebugNodes(tNode.child, lView),
        component: componentLViewDebug,
    };
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
/**
 * Return an `LView` value if found.
 *
 * @param value `LView` if any
 */
export function readLViewValue(value) {
    while (Array.isArray(value)) {
        // This check is not quite right, as it does not take into account `StylingContext`
        // This is why it is in debug, not in util.ts
        if (value.length >= HEADER_OFFSET - 1)
            return value;
        value = value[HOST];
    }
    return null;
}
export class I18NDebugItem {
    constructor(__raw_opCode, _lView, nodeIndex, type) {
        this.__raw_opCode = __raw_opCode;
        this._lView = _lView;
        this.nodeIndex = nodeIndex;
        this.type = type;
    }
    get tNode() {
        return getTNode(this._lView[TVIEW], this.nodeIndex);
    }
}
/**
 * Turns a list of "Create" & "Update" OpCodes into a human-readable list of operations for
 * debugging purposes.
 * @param mutateOpCodes mutation opCodes to read
 * @param updateOpCodes update opCodes to read
 * @param icus list of ICU expressions
 * @param lView The view the opCodes are acting on
 */
export function attachI18nOpCodesDebug(mutateOpCodes, updateOpCodes, icus, lView) {
    attachDebugObject(mutateOpCodes, new I18nMutateOpCodesDebug(mutateOpCodes, lView));
    attachDebugObject(updateOpCodes, new I18nUpdateOpCodesDebug(updateOpCodes, icus, lView));
    if (icus) {
        icus.forEach(icu => {
            icu.create.forEach(icuCase => {
                attachDebugObject(icuCase, new I18nMutateOpCodesDebug(icuCase, lView));
            });
            icu.update.forEach(icuCase => {
                attachDebugObject(icuCase, new I18nUpdateOpCodesDebug(icuCase, icus, lView));
            });
        });
    }
}
export class I18nMutateOpCodesDebug {
    constructor(__raw_opCodes, __lView) {
        this.__raw_opCodes = __raw_opCodes;
        this.__lView = __lView;
    }
    /**
     * A list of operation information about how the OpCodes will act on the view.
     */
    get operations() {
        const { __lView, __raw_opCodes } = this;
        const results = [];
        for (let i = 0; i < __raw_opCodes.length; i++) {
            const opCode = __raw_opCodes[i];
            let result;
            if (typeof opCode === 'string') {
                result = {
                    __raw_opCode: opCode,
                    type: 'Create Text Node',
                    nodeIndex: __raw_opCodes[++i],
                    text: opCode,
                };
            }
            if (typeof opCode === 'number') {
                switch (opCode & 7 /* MASK_OPCODE */) {
                    case 1 /* AppendChild */:
                        const destinationNodeIndex = opCode >>> 17 /* SHIFT_PARENT */;
                        result = new I18NDebugItem(opCode, __lView, destinationNodeIndex, 'AppendChild');
                        break;
                    case 0 /* Select */:
                        const nodeIndex = opCode >>> 3 /* SHIFT_REF */;
                        result = new I18NDebugItem(opCode, __lView, nodeIndex, 'Select');
                        break;
                    case 5 /* ElementEnd */:
                        let elementIndex = opCode >>> 3 /* SHIFT_REF */;
                        result = new I18NDebugItem(opCode, __lView, elementIndex, 'ElementEnd');
                        break;
                    case 4 /* Attr */:
                        elementIndex = opCode >>> 3 /* SHIFT_REF */;
                        result = new I18NDebugItem(opCode, __lView, elementIndex, 'Attr');
                        result['attrName'] = __raw_opCodes[++i];
                        result['attrValue'] = __raw_opCodes[++i];
                        break;
                }
            }
            if (!result) {
                switch (opCode) {
                    case COMMENT_MARKER:
                        result = {
                            __raw_opCode: opCode,
                            type: 'COMMENT_MARKER',
                            commentValue: __raw_opCodes[++i],
                            nodeIndex: __raw_opCodes[++i],
                        };
                        break;
                    case ELEMENT_MARKER:
                        result = {
                            __raw_opCode: opCode,
                            type: 'ELEMENT_MARKER',
                        };
                        break;
                }
            }
            if (!result) {
                result = {
                    __raw_opCode: opCode,
                    type: 'Unknown Op Code',
                    code: opCode,
                };
            }
            results.push(result);
        }
        return results;
    }
}
export class I18nUpdateOpCodesDebug {
    constructor(__raw_opCodes, icus, __lView) {
        this.__raw_opCodes = __raw_opCodes;
        this.icus = icus;
        this.__lView = __lView;
    }
    /**
     * A list of operation information about how the OpCodes will act on the view.
     */
    get operations() {
        const { __lView, __raw_opCodes, icus } = this;
        const results = [];
        for (let i = 0; i < __raw_opCodes.length; i++) {
            // bit code to check if we should apply the next update
            const checkBit = __raw_opCodes[i];
            // Number of opCodes to skip until next set of update codes
            const skipCodes = __raw_opCodes[++i];
            let value = '';
            for (let j = i + 1; j <= (i + skipCodes); j++) {
                const opCode = __raw_opCodes[j];
                if (typeof opCode === 'string') {
                    value += opCode;
                }
                else if (typeof opCode == 'number') {
                    if (opCode < 0) {
                        // It's a binding index whose value is negative
                        // We cannot know the value of the binding so we only show the index
                        value += `�${-opCode - 1}�`;
                    }
                    else {
                        const nodeIndex = opCode >>> 2 /* SHIFT_REF */;
                        let tIcuIndex;
                        let tIcu;
                        switch (opCode & 3 /* MASK_OPCODE */) {
                            case 1 /* Attr */:
                                const attrName = __raw_opCodes[++j];
                                const sanitizeFn = __raw_opCodes[++j];
                                results.push({
                                    __raw_opCode: opCode,
                                    checkBit,
                                    type: 'Attr',
                                    attrValue: value,
                                    attrName,
                                    sanitizeFn,
                                });
                                break;
                            case 0 /* Text */:
                                results.push({
                                    __raw_opCode: opCode,
                                    checkBit,
                                    type: 'Text',
                                    nodeIndex,
                                    text: value,
                                });
                                break;
                            case 2 /* IcuSwitch */:
                                tIcuIndex = __raw_opCodes[++j];
                                tIcu = icus[tIcuIndex];
                                let result = new I18NDebugItem(opCode, __lView, nodeIndex, 'IcuSwitch');
                                result['tIcuIndex'] = tIcuIndex;
                                result['checkBit'] = checkBit;
                                result['mainBinding'] = value;
                                result['tIcu'] = tIcu;
                                results.push(result);
                                break;
                            case 3 /* IcuUpdate */:
                                tIcuIndex = __raw_opCodes[++j];
                                tIcu = icus[tIcuIndex];
                                result = new I18NDebugItem(opCode, __lView, nodeIndex, 'IcuUpdate');
                                result['tIcuIndex'] = tIcuIndex;
                                result['checkBit'] = checkBit;
                                result['tIcu'] = tIcu;
                                results.push(result);
                                break;
                        }
                    }
                }
            }
            i += skipCodes;
        }
        return results;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFNSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxzQkFBc0IsRUFBYyxXQUFXLEVBQUUsTUFBTSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFekgsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlGLE1BQU0sb0JBQW9CLENBQUM7QUFLbEosT0FBTyxFQUFDLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUE2QixNQUFNLHVCQUF1QixDQUFDO0FBQzNLLE9BQU8sRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQXdDLEtBQUssRUFBRSxhQUFhLEVBQVksSUFBSSxFQUFFLFFBQVEsRUFBcUIsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQVMsS0FBSyxFQUFvQyxNQUFNLG9CQUFvQixDQUFDO0FBQzlULE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxRQUFRLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUMs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cUJBQ0Y7aUJBQ0Y7YUFDRjtZQUNELENBQUMsSUFBSSxTQUFTLENBQUM7U0FDaEI7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBDb21wb25lbnRUZW1wbGF0ZX0gZnJvbSAnLi4nO1xuaW1wb3J0IHtJbmplY3RvciwgU2NoZW1hTWV0YWRhdGF9IGZyb20gJy4uLy4uL2NvcmUnO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHtLZXlWYWx1ZUFycmF5fSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtjcmVhdGVOYW1lZEFycmF5VHlwZX0gZnJvbSAnLi4vLi4vdXRpbC9uYW1lZF9hcnJheV90eXBlJztcbmltcG9ydCB7aW5pdE5nRGV2TW9kZX0gZnJvbSAnLi4vLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTLCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXUywgTkFUSVZFfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0LCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT01NRU5UX01BUktFUiwgRUxFTUVOVF9NQVJLRVIsIEkxOG5NdXRhdGVPcENvZGUsIEkxOG5NdXRhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgVEljdX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7UHJvcGVydHlBbGlhc2VzLCBUQ29uc3RhbnRzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSBhcyBJVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2VsZWN0b3JGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXMsIFRRdWVyaWVzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIFJOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Z2V0VFN0eWxpbmdSYW5nZU5leHQsIGdldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlLCBnZXRUU3R5bGluZ1JhbmdlUHJldiwgZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUsIFRTdHlsaW5nS2V5LCBUU3R5bGluZ1JhbmdlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDSElMRF9UQUlMLCBDTEVBTlVQLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBEZXN0cm95SG9va0RhdGEsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIb29rRGF0YSwgSE9TVCwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBTQU5JVElaRVIsIFRfSE9TVCwgVERhdGEsIFRWSUVXLCBUVmlldyBhcyBJVFZpZXcsIFRWaWV3LCBUVmlld1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcbmltcG9ydCB7Z2V0VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5jb25zdCBOR19ERVZfTU9ERSA9ICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgISFuZ0Rldk1vZGUpICYmIGluaXROZ0Rldk1vZGUoKSk7XG5cbi8qXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgY29uZGl0aW9uYWxseSBhdHRhY2hlZCBjbGFzc2VzIHdoaWNoIHByb3ZpZGUgaHVtYW4gcmVhZGFibGUgKGRlYnVnKSBsZXZlbFxuICogaW5mb3JtYXRpb24gZm9yIGBMVmlld2AsIGBMQ29udGFpbmVyYCBhbmQgb3RoZXIgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzLiBUaGVzZSBkYXRhIHN0cnVjdHVyZXNcbiAqIGFyZSBzdG9yZWQgaW50ZXJuYWxseSBhcyBhcnJheSB3aGljaCBtYWtlcyBpdCB2ZXJ5IGRpZmZpY3VsdCBkdXJpbmcgZGVidWdnaW5nIHRvIHJlYXNvbiBhYm91dCB0aGVcbiAqIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHN5c3RlbS5cbiAqXG4gKiBQYXRjaGluZyB0aGUgYXJyYXkgd2l0aCBleHRyYSBwcm9wZXJ0eSBkb2VzIGNoYW5nZSB0aGUgYXJyYXkncyBoaWRkZW4gY2xhc3MnIGJ1dCBpdCBkb2VzIG5vdFxuICogY2hhbmdlIHRoZSBjb3N0IG9mIGFjY2VzcywgdGhlcmVmb3JlIHRoaXMgcGF0Y2hpbmcgc2hvdWxkIG5vdCBoYXZlIHNpZ25pZmljYW50IGlmIGFueSBpbXBhY3QgaW5cbiAqIGBuZ0Rldk1vZGVgIG1vZGUuIChzZWU6IGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS12cy1tb25rZXktcGF0Y2gtYXJyYXkpXG4gKlxuICogU28gaW5zdGVhZCBvZiBzZWVpbmc6XG4gKiBgYGBcbiAqIEFycmF5KDMwKSBbT2JqZWN0LCA2NTksIG51bGwsIOKApl1cbiAqIGBgYFxuICpcbiAqIFlvdSBnZXQgdG8gc2VlOlxuICogYGBgXG4gKiBMVmlld0RlYnVnIHtcbiAqICAgdmlld3M6IFsuLi5dLFxuICogICBmbGFnczoge2F0dGFjaGVkOiB0cnVlLCAuLi59XG4gKiAgIG5vZGVzOiBbXG4gKiAgICAge2h0bWw6ICc8ZGl2IGlkPVwiMTIzXCI+JywgLi4uLCBub2RlczogW1xuICogICAgICAge2h0bWw6ICc8c3Bhbj4nLCAuLi4sIG5vZGVzOiBudWxsfVxuICogICAgIF19XG4gKiAgIF1cbiAqIH1cbiAqIGBgYFxuICovXG5cbmxldCBMVklFV19DT01QT05FTlRfQ0FDSEUhOiBNYXA8c3RyaW5nfG51bGwsIEFycmF5PGFueT4+O1xubGV0IExWSUVXX0VNQkVEREVEX0NBQ0hFITogTWFwPHN0cmluZ3xudWxsLCBBcnJheTxhbnk+PjtcbmxldCBMVklFV19ST09UITogQXJyYXk8YW55PjtcblxuaW50ZXJmYWNlIFRWaWV3RGVidWcgZXh0ZW5kcyBJVFZpZXcge1xuICB0eXBlOiBUVmlld1R5cGU7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgTFZpZXcuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb0xWaWV3RnJvbVRWaWV3Qmx1ZXByaW50KHRWaWV3OiBUVmlldyk6IExWaWV3IHtcbiAgY29uc3QgZGVidWdUVmlldyA9IHRWaWV3IGFzIFRWaWV3RGVidWc7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXdUb0Nsb25lKGRlYnVnVFZpZXcudHlwZSwgdFZpZXcudGVtcGxhdGUgJiYgdFZpZXcudGVtcGxhdGUubmFtZSk7XG4gIHJldHVybiBsVmlldy5jb25jYXQodFZpZXcuYmx1ZXByaW50KSBhcyBhbnk7XG59XG5cbmZ1bmN0aW9uIGdldExWaWV3VG9DbG9uZSh0eXBlOiBUVmlld1R5cGUsIG5hbWU6IHN0cmluZ3xudWxsKTogQXJyYXk8YW55PiB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgVFZpZXdUeXBlLlJvb3Q6XG4gICAgICBpZiAoTFZJRVdfUk9PVCA9PT0gdW5kZWZpbmVkKSBMVklFV19ST09UID0gbmV3IChjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFJvb3RWaWV3JykpKCk7XG4gICAgICByZXR1cm4gTFZJRVdfUk9PVDtcbiAgICBjYXNlIFRWaWV3VHlwZS5Db21wb25lbnQ6XG4gICAgICBpZiAoTFZJRVdfQ09NUE9ORU5UX0NBQ0hFID09PSB1bmRlZmluZWQpIExWSUVXX0NPTVBPTkVOVF9DQUNIRSA9IG5ldyBNYXAoKTtcbiAgICAgIGxldCBjb21wb25lbnRBcnJheSA9IExWSUVXX0NPTVBPTkVOVF9DQUNIRS5nZXQobmFtZSk7XG4gICAgICBpZiAoY29tcG9uZW50QXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21wb25lbnRBcnJheSA9IG5ldyAoY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDb21wb25lbnRWaWV3JyArIG5hbWVTdWZmaXgobmFtZSkpKSgpO1xuICAgICAgICBMVklFV19DT01QT05FTlRfQ0FDSEUuc2V0KG5hbWUsIGNvbXBvbmVudEFycmF5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb21wb25lbnRBcnJheTtcbiAgICBjYXNlIFRWaWV3VHlwZS5FbWJlZGRlZDpcbiAgICAgIGlmIChMVklFV19FTUJFRERFRF9DQUNIRSA9PT0gdW5kZWZpbmVkKSBMVklFV19FTUJFRERFRF9DQUNIRSA9IG5ldyBNYXAoKTtcbiAgICAgIGxldCBlbWJlZGRlZEFycmF5ID0gTFZJRVdfRU1CRURERURfQ0FDSEUuZ2V0KG5hbWUpO1xuICAgICAgaWYgKGVtYmVkZGVkQXJyYXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlbWJlZGRlZEFycmF5ID0gbmV3IChjcmVhdGVOYW1lZEFycmF5VHlwZSgnTEVtYmVkZGVkVmlldycgKyBuYW1lU3VmZml4KG5hbWUpKSkoKTtcbiAgICAgICAgTFZJRVdfRU1CRURERURfQ0FDSEUuc2V0KG5hbWUsIGVtYmVkZGVkQXJyYXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVtYmVkZGVkQXJyYXk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnJlYWNoYWJsZSBjb2RlJyk7XG59XG5cbmZ1bmN0aW9uIG5hbWVTdWZmaXgodGV4dDogc3RyaW5nfG51bGx8dW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKHRleHQgPT0gbnVsbCkgcmV0dXJuICcnO1xuICBjb25zdCBpbmRleCA9IHRleHQubGFzdEluZGV4T2YoJ19UZW1wbGF0ZScpO1xuICByZXR1cm4gJ18nICsgKGluZGV4ID09PSAtMSA/IHRleHQgOiB0ZXh0LnN1YnN0cigwLCBpbmRleCkpO1xufVxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgYSBkZWJ1ZyB2ZXJzaW9uIG9mIE9iamVjdCBsaXRlcmFsIHNvIHRoYXQgd2UgY2FuIGhhdmUgY29uc3RydWN0b3IgbmFtZSBzaG93IHVwXG4gKiBpblxuICogZGVidWcgdG9vbHMgaW4gbmdEZXZNb2RlLlxuICovXG5leHBvcnQgY29uc3QgVFZpZXdDb25zdHJ1Y3RvciA9IGNsYXNzIFRWaWV3IGltcGxlbWVudHMgSVRWaWV3IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgdHlwZTogVFZpZXdUeXBlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJsdWVwcmludDogTFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBxdWVyaWVzOiBUUXVlcmllc3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCwgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkYXRhOiBURGF0YSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsICAvL1xuICAgICAgcHVibGljIGZpcnN0Q3JlYXRlUGFzczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJlT3JkZXJIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcmVPcmRlckNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2aWV3SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGVzdHJveUhvb2tzOiBEZXN0cm95SG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGVhbnVwOiBhbnlbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29tcG9uZW50czogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsLCAgICAgICAvL1xuICAgICAgcHVibGljIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbCwgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZmlyc3RDaGlsZDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnN0czogVENvbnN0YW50c3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5jb21wbGV0ZUZpcnN0UGFzczogYm9vbGVhbiAgICAgICAgICAgICAgICAgICAgLy9cbiAgKSB7fVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5maXJzdENoaWxkLCBidWYpO1xuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cbn07XG5cbmNsYXNzIFROb2RlIGltcGxlbWVudHMgSVROb2RlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgdFZpZXdfOiBUVmlldywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0eXBlOiBUTm9kZVR5cGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5qZWN0b3JJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVTdGFydDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZUVuZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlU3R5bGluZ0xhc3Q6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZsYWdzOiBUTm9kZUZsYWdzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlcywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbCwgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbWVyZ2VkQXR0cnM6IChzdHJpbmd8QXR0cmlidXRlTWFya2VyfChzdHJpbmd8U2VsZWN0b3JGbGFncylbXSlbXXxudWxsLCAgLy9cbiAgICAgIHB1YmxpYyBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRWaWV3czogSVRWaWV3fElUVmlld1tdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNoaWxkOiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uOiBudW1iZXJ8KElUTm9kZXxSTm9kZVtdKVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlczogc3RyaW5nfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3R5bGVzV2l0aG91dEhvc3Q6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyByZXNpZHVhbFN0eWxlczogS2V5VmFsdWVBcnJheTxhbnk+fHVuZGVmaW5lZHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzZXM6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2xhc3Nlc1dpdGhvdXRIb3N0OiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyByZXNpZHVhbENsYXNzZXM6IEtleVZhbHVlQXJyYXk8YW55Pnx1bmRlZmluZWR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3R5bGVCaW5kaW5nczogVFN0eWxpbmdSYW5nZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgKSB7fVxuXG4gIGdldCB0eXBlXygpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICBjYXNlIFROb2RlVHlwZS5Db250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkNvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5FbGVtZW50JztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5JY3VDb250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuUHJvamVjdGlvbjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuUHJvamVjdGlvbic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5WaWV3OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5WaWV3JztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLj8/Pyc7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZsYWdzXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZsYWdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeScpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncycpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3QnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNEZXRhY2hlZCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RldGFjaGVkJyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzUHJvamVjdGVkJyk7XG4gICAgcmV0dXJuIGZsYWdzLmpvaW4oJ3wnKTtcbiAgfVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgYnVmLnB1c2goJzwnLCB0aGlzLnRhZ05hbWUgfHwgdGhpcy50eXBlXyk7XG4gICAgaWYgKHRoaXMuYXR0cnMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hdHRycy5sZW5ndGg7KSB7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gdGhpcy5hdHRyc1tpKytdO1xuICAgICAgICBpZiAodHlwZW9mIGF0dHJOYW1lID09ICdudW1iZXInKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXR0clZhbHVlID0gdGhpcy5hdHRyc1tpKytdO1xuICAgICAgICBidWYucHVzaCgnICcsIGF0dHJOYW1lIGFzIHN0cmluZywgJz1cIicsIGF0dHJWYWx1ZSBhcyBzdHJpbmcsICdcIicpO1xuICAgICAgfVxuICAgIH1cbiAgICBidWYucHVzaCgnPicpO1xuICAgIHByb2Nlc3NUTm9kZUNoaWxkcmVuKHRoaXMuY2hpbGQsIGJ1Zik7XG4gICAgYnVmLnB1c2goJzwvJywgdGhpcy50YWdOYW1lIHx8IHRoaXMudHlwZV8sICc+Jyk7XG4gICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbiAgfVxuXG4gIGdldCBzdHlsZUJpbmRpbmdzXygpOiBEZWJ1Z1N0eWxlQmluZGluZ3Mge1xuICAgIHJldHVybiB0b0RlYnVnU3R5bGVCaW5kaW5nKHRoaXMsIGZhbHNlKTtcbiAgfVxuICBnZXQgY2xhc3NCaW5kaW5nc18oKTogRGVidWdTdHlsZUJpbmRpbmdzIHtcbiAgICByZXR1cm4gdG9EZWJ1Z1N0eWxlQmluZGluZyh0aGlzLCB0cnVlKTtcbiAgfVxufVxuZXhwb3J0IGNvbnN0IFROb2RlRGVidWcgPSBUTm9kZTtcbmV4cG9ydCB0eXBlIFROb2RlRGVidWcgPSBUTm9kZTtcblxuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxlQmluZGluZ3MgZXh0ZW5kc1xuICAgIEFycmF5PEtleVZhbHVlQXJyYXk8YW55PnxEZWJ1Z1N0eWxlQmluZGluZ3xzdHJpbmd8bnVsbD4ge31cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsZUJpbmRpbmcge1xuICBrZXk6IFRTdHlsaW5nS2V5O1xuICBpbmRleDogbnVtYmVyO1xuICBpc1RlbXBsYXRlOiBib29sZWFuO1xuICBwcmV2RHVwbGljYXRlOiBib29sZWFuO1xuICBuZXh0RHVwbGljYXRlOiBib29sZWFuO1xuICBwcmV2SW5kZXg6IG51bWJlcjtcbiAgbmV4dEluZGV4OiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHRvRGVidWdTdHlsZUJpbmRpbmcodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBEZWJ1Z1N0eWxlQmluZGluZ3Mge1xuICBjb25zdCB0RGF0YSA9IHROb2RlLnRWaWV3Xy5kYXRhO1xuICBjb25zdCBiaW5kaW5nczogRGVidWdTdHlsZUJpbmRpbmdzID0gW10gYXMgYW55O1xuICBjb25zdCByYW5nZSA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBjb25zdCBwcmV2ID0gZ2V0VFN0eWxpbmdSYW5nZVByZXYocmFuZ2UpO1xuICBjb25zdCBuZXh0ID0gZ2V0VFN0eWxpbmdSYW5nZU5leHQocmFuZ2UpO1xuICBsZXQgaXNUZW1wbGF0ZSA9IG5leHQgIT09IDA7XG4gIGxldCBjdXJzb3IgPSBpc1RlbXBsYXRlID8gbmV4dCA6IHByZXY7XG4gIHdoaWxlIChjdXJzb3IgIT09IDApIHtcbiAgICBjb25zdCBpdGVtS2V5ID0gdERhdGFbY3Vyc29yXSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCBpdGVtUmFuZ2UgPSB0RGF0YVtjdXJzb3IgKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAgIGJpbmRpbmdzLnVuc2hpZnQoe1xuICAgICAga2V5OiBpdGVtS2V5LFxuICAgICAgaW5kZXg6IGN1cnNvcixcbiAgICAgIGlzVGVtcGxhdGU6IGlzVGVtcGxhdGUsXG4gICAgICBwcmV2RHVwbGljYXRlOiBnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZShpdGVtUmFuZ2UpLFxuICAgICAgbmV4dER1cGxpY2F0ZTogZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUoaXRlbVJhbmdlKSxcbiAgICAgIG5leHRJbmRleDogZ2V0VFN0eWxpbmdSYW5nZU5leHQoaXRlbVJhbmdlKSxcbiAgICAgIHByZXZJbmRleDogZ2V0VFN0eWxpbmdSYW5nZVByZXYoaXRlbVJhbmdlKSxcbiAgICB9KTtcbiAgICBpZiAoY3Vyc29yID09PSBwcmV2KSBpc1RlbXBsYXRlID0gZmFsc2U7XG4gICAgY3Vyc29yID0gZ2V0VFN0eWxpbmdSYW5nZVByZXYoaXRlbVJhbmdlKTtcbiAgfVxuICBiaW5kaW5ncy5wdXNoKChpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcykgfHwgbnVsbCk7XG4gIHJldHVybiBiaW5kaW5ncztcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odE5vZGU6IElUTm9kZXxudWxsLCBidWY6IHN0cmluZ1tdKSB7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGJ1Zi5wdXNoKCh0Tm9kZSBhcyBhbnkgYXMge3RlbXBsYXRlXzogc3RyaW5nfSkudGVtcGxhdGVfKTtcbiAgICB0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIH1cbn1cblxuY29uc3QgVFZpZXdEYXRhID0gTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3RGF0YScpIHx8IG51bGwhIGFzIEFycmF5Q29uc3RydWN0b3I7XG5sZXQgVFZJRVdEQVRBX0VNUFRZOiB1bmtub3duW107ICAvLyBjYW4ndCBpbml0aWFsaXplIGhlcmUgb3IgaXQgd2lsbCBub3QgYmUgdHJlZSBzaGFrZW4sIGJlY2F1c2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGBMVmlld2AgY29uc3RydWN0b3IgY291bGQgaGF2ZSBzaWRlLWVmZmVjdHMuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY2xvbmVzIGEgYmx1ZXByaW50IGFuZCBjcmVhdGVzIFREYXRhLlxuICpcbiAqIFNpbXBsZSBzbGljZSB3aWxsIGtlZXAgdGhlIHNhbWUgdHlwZSwgYW5kIHdlIG5lZWQgaXQgdG8gYmUgVERhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lVG9UVmlld0RhdGEobGlzdDogYW55W10pOiBURGF0YSB7XG4gIGlmIChUVklFV0RBVEFfRU1QVFkgPT09IHVuZGVmaW5lZCkgVFZJRVdEQVRBX0VNUFRZID0gbmV3IFRWaWV3RGF0YSgpO1xuICByZXR1cm4gVFZJRVdEQVRBX0VNUFRZLmNvbmNhdChsaXN0KSBhcyBhbnk7XG59XG5cbmV4cG9ydCBjb25zdCBMVmlld0JsdWVwcmludCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xWaWV3Qmx1ZXByaW50JykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBNYXRjaGVzQXJyYXkgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdNYXRjaGVzQXJyYXknKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFRWaWV3Q29tcG9uZW50cyA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3Q29tcG9uZW50cycpIHx8IG51bGwhIGFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVE5vZGVMb2NhbE5hbWVzID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVE5vZGVMb2NhbE5hbWVzJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUTm9kZUluaXRpYWxJbnB1dHMgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxJbnB1dHMnKSB8fCBudWxsISBhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbERhdGEgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxEYXRhJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBMQ2xlYW51cCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDbGVhbnVwJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUQ2xlYW51cCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RDbGVhbnVwJykgfHwgbnVsbCEgYXMgQXJyYXlDb25zdHJ1Y3RvcjtcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsVmlldywgbmV3IExWaWV3RGVidWcobFZpZXcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxDb250YWluZXIsIG5ldyBMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3KTogTFZpZXdEZWJ1ZztcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXd8bnVsbCk6IExWaWV3RGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXd8TENvbnRhaW5lcnxudWxsKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogYW55KTogYW55IHtcbiAgaWYgKG9iaikge1xuICAgIGNvbnN0IGRlYnVnID0gKG9iaiBhcyBhbnkpLmRlYnVnO1xuICAgIGFzc2VydERlZmluZWQoZGVidWcsICdPYmplY3QgZG9lcyBub3QgaGF2ZSBhIGRlYnVnIHJlcHJlc2VudGF0aW9uLicpO1xuICAgIHJldHVybiBkZWJ1ZztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG59XG5cbi8qKlxuICogVXNlIHRoaXMgbWV0aG9kIHRvIHVud3JhcCBhIG5hdGl2ZSBlbGVtZW50IGluIGBMVmlld2AgYW5kIGNvbnZlcnQgaXQgaW50byBIVE1MIGZvciBlYXNpZXJcbiAqIHJlYWRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIHBvc3NpYmx5IHdyYXBwZWQgbmF0aXZlIERPTSBub2RlLlxuICogQHBhcmFtIGluY2x1ZGVDaGlsZHJlbiBJZiBgdHJ1ZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBpbmNsdWRlIGNoaWxkIGVsZW1lbnRzXG4gKiAoc2FtZVxuICogYXMgYG91dGVySFRNTGApLiBJZiBgZmFsc2VgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgb25seSBjb250YWluIHRoZSBlbGVtZW50XG4gKiBpdHNlbGZcbiAqICh3aWxsIG5vdCBzZXJpYWxpemUgY2hpbGQgZWxlbWVudHMpLlxuICovXG5mdW5jdGlvbiB0b0h0bWwodmFsdWU6IGFueSwgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IG5vZGU6IEhUTUxFbGVtZW50fG51bGwgPSB1bndyYXBSTm9kZSh2YWx1ZSkgYXMgYW55O1xuICBpZiAobm9kZSkge1xuICAgIGNvbnN0IGlzVGV4dE5vZGUgPSBub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERTtcbiAgICBjb25zdCBvdXRlckhUTUwgPSAoaXNUZXh0Tm9kZSA/IG5vZGUudGV4dENvbnRlbnQgOiBub2RlLm91dGVySFRNTCkgfHwgJyc7XG4gICAgaWYgKGluY2x1ZGVDaGlsZHJlbiB8fCBpc1RleHROb2RlKSB7XG4gICAgICByZXR1cm4gb3V0ZXJIVE1MO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbm5lckhUTUwgPSAnPicgKyBub2RlLmlubmVySFRNTCArICc8JztcbiAgICAgIHJldHVybiAob3V0ZXJIVE1MLnNwbGl0KGlubmVySFRNTClbMF0pICsgJz4nO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTFZpZXdEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEZsYWdzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYExWaWV3YCB1bnBhY2tlZCBpbnRvIGEgbW9yZSByZWFkYWJsZSBzdGF0ZS5cbiAgICovXG4gIGdldCBmbGFncygpIHtcbiAgICBjb25zdCBmbGFncyA9IHRoaXMuX3Jhd19sVmlld1tGTEFHU107XG4gICAgcmV0dXJuIHtcbiAgICAgIF9fcmF3X19mbGFnc19fOiBmbGFncyxcbiAgICAgIGluaXRQaGFzZVN0YXRlOiBmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrLFxuICAgICAgY3JlYXRpb25Nb2RlOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSxcbiAgICAgIGZpcnN0Vmlld1Bhc3M6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyksXG4gICAgICBjaGVja0Fsd2F5czogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSxcbiAgICAgIGRpcnR5OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkpLFxuICAgICAgYXR0YWNoZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5BdHRhY2hlZCksXG4gICAgICBkZXN0cm95ZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpLFxuICAgICAgaXNSb290OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuSXNSb290KSxcbiAgICAgIGluZGV4V2l0aGluSW5pdFBoYXNlOiBmbGFncyA+PiBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlU2hpZnQsXG4gICAgfTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnfG51bGwge1xuICAgIHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tQQVJFTlRdKTtcbiAgfVxuICBnZXQgaG9zdCgpOiBzdHJpbmd8bnVsbCB7XG4gICAgcmV0dXJuIHRvSHRtbCh0aGlzLl9yYXdfbFZpZXdbSE9TVF0sIHRydWUpO1xuICB9XG4gIGdldCBodG1sKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICh0aGlzLm5vZGVzIHx8IFtdKS5tYXAobm9kZSA9PiB0b0h0bWwobm9kZS5uYXRpdmUsIHRydWUpKS5qb2luKCcnKTtcbiAgfVxuICBnZXQgY29udGV4dCgpOiB7fXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0NPTlRFWFRdO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgdHJlZSBvZiBub2RlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC4gVGhlIG5vZGVzIGhhdmUgYmVlbiBub3JtYWxpemVkIGludG9cbiAgICogYVxuICAgKiB0cmVlIHN0cnVjdHVyZSB3aXRoIHJlbGV2YW50IGRldGFpbHMgcHVsbGVkIG91dCBmb3IgcmVhZGFiaWxpdHkuXG4gICAqL1xuICBnZXQgbm9kZXMoKTogRGVidWdOb2RlW118bnVsbCB7XG4gICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yYXdfbFZpZXc7XG4gICAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgICByZXR1cm4gdG9EZWJ1Z05vZGVzKHROb2RlLCBsVmlldyk7XG4gIH1cblxuICBnZXQgdFZpZXcoKTogSVRWaWV3IHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1RWSUVXXTtcbiAgfVxuICBnZXQgY2xlYW51cCgpOiBhbnlbXXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0NMRUFOVVBdO1xuICB9XG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvcnxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0lOSkVDVE9SXTtcbiAgfVxuICBnZXQgcmVuZGVyZXJGYWN0b3J5KCk6IFJlbmRlcmVyRmFjdG9yeTMge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIH1cbiAgZ2V0IHJlbmRlcmVyKCk6IFJlbmRlcmVyMyB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tSRU5ERVJFUl07XG4gIH1cbiAgZ2V0IHNhbml0aXplcigpOiBTYW5pdGl6ZXJ8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tTQU5JVElaRVJdO1xuICB9XG4gIGdldCBjaGlsZEhlYWQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX0hFQURdKTtcbiAgfVxuICBnZXQgbmV4dCgpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsIHtcbiAgICByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbTkVYVF0pO1xuICB9XG4gIGdldCBjaGlsZFRhaWwoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX1RBSUxdKTtcbiAgfVxuICBnZXQgZGVjbGFyYXRpb25WaWV3KCk6IExWaWV3RGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddKTtcbiAgfVxuICBnZXQgcXVlcmllcygpOiBMUXVlcmllc3xudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1FVRVJJRVNdO1xuICB9XG4gIGdldCB0SG9zdCgpOiBUVmlld05vZGV8VEVsZW1lbnROb2RlfG51bGwge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbFZpZXdbVF9IT1NUXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVkIHZpZXcgb2YgY2hpbGQgdmlld3MgKGFuZCBjb250YWluZXJzKSBhdHRhY2hlZCBhdCB0aGlzIGxvY2F0aW9uLlxuICAgKi9cbiAgZ2V0IGNoaWxkVmlld3MoKTogQXJyYXk8TFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWc+IHtcbiAgICBjb25zdCBjaGlsZFZpZXdzOiBBcnJheTxMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Zz4gPSBbXTtcbiAgICBsZXQgY2hpbGQgPSB0aGlzLmNoaWxkSGVhZDtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIGNoaWxkVmlld3MucHVzaChjaGlsZCk7XG4gICAgICBjaGlsZCA9IGNoaWxkLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZFZpZXdzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgaHRtbDogc3RyaW5nfG51bGw7XG4gIG5hdGl2ZTogTm9kZTtcbiAgbm9kZXM6IERlYnVnTm9kZVtdfG51bGw7XG4gIGNvbXBvbmVudDogTFZpZXdEZWJ1Z3xudWxsO1xufVxuXG4vKipcbiAqIFR1cm5zIGEgZmxhdCBsaXN0IG9mIG5vZGVzIGludG8gYSB0cmVlIGJ5IHdhbGtpbmcgdGhlIGFzc29jaWF0ZWQgYFROb2RlYCB0cmVlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnTm9kZXModE5vZGU6IElUTm9kZXxudWxsLCBsVmlldzogTFZpZXcpOiBEZWJ1Z05vZGVbXXxudWxsIHtcbiAgaWYgKHROb2RlKSB7XG4gICAgY29uc3QgZGVidWdOb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBsZXQgdE5vZGVDdXJzb3I6IElUTm9kZXxudWxsID0gdE5vZGU7XG4gICAgd2hpbGUgKHROb2RlQ3Vyc29yKSB7XG4gICAgICBkZWJ1Z05vZGVzLnB1c2goYnVpbGREZWJ1Z05vZGUodE5vZGVDdXJzb3IsIGxWaWV3LCB0Tm9kZUN1cnNvci5pbmRleCkpO1xuICAgICAgdE5vZGVDdXJzb3IgPSB0Tm9kZUN1cnNvci5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gZGVidWdOb2RlcztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGREZWJ1Z05vZGUodE5vZGU6IElUTm9kZSwgbFZpZXc6IExWaWV3LCBub2RlSW5kZXg6IG51bWJlcik6IERlYnVnTm9kZSB7XG4gIGNvbnN0IHJhd1ZhbHVlID0gbFZpZXdbbm9kZUluZGV4XTtcbiAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUocmF3VmFsdWUpO1xuICBjb25zdCBjb21wb25lbnRMVmlld0RlYnVnID0gdG9EZWJ1ZyhyZWFkTFZpZXdWYWx1ZShyYXdWYWx1ZSkpO1xuICByZXR1cm4ge1xuICAgIGh0bWw6IHRvSHRtbChuYXRpdmUpLFxuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSxcbiAgICBub2RlczogdG9EZWJ1Z05vZGVzKHROb2RlLmNoaWxkLCBsVmlldyksXG4gICAgY29tcG9uZW50OiBjb21wb25lbnRMVmlld0RlYnVnLFxuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgTENvbnRhaW5lckRlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfcmF3X2xDb250YWluZXI6IExDb250YWluZXIpIHt9XG5cbiAgZ2V0IGhhc1RyYW5zcGxhbnRlZFZpZXdzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTXTtcbiAgfVxuICBnZXQgdmlld3MoKTogTFZpZXdEZWJ1Z1tdIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXIuc2xpY2UoQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpXG4gICAgICAgIC5tYXAodG9EZWJ1ZyBhcyAobDogTFZpZXcpID0+IExWaWV3RGVidWcpO1xuICB9XG4gIGdldCBwYXJlbnQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xDb250YWluZXJbUEFSRU5UXSk7XG4gIH1cbiAgZ2V0IG1vdmVkVmlld3MoKTogTFZpZXdbXXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbTU9WRURfVklFV1NdO1xuICB9XG4gIGdldCBob3N0KCk6IFJFbGVtZW50fFJDb21tZW50fExWaWV3IHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbSE9TVF07XG4gIH1cbiAgZ2V0IG5hdGl2ZSgpOiBSQ29tbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW05BVElWRV07XG4gIH1cbiAgZ2V0IG5leHQoKSB7XG4gICAgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xDb250YWluZXJbTkVYVF0pO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGBMVmlld2AgdmFsdWUgaWYgZm91bmQuXG4gKlxuICogQHBhcmFtIHZhbHVlIGBMVmlld2AgaWYgYW55XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkTFZpZXdWYWx1ZSh2YWx1ZTogYW55KTogTFZpZXd8bnVsbCB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFRoaXMgY2hlY2sgaXMgbm90IHF1aXRlIHJpZ2h0LCBhcyBpdCBkb2VzIG5vdCB0YWtlIGludG8gYWNjb3VudCBgU3R5bGluZ0NvbnRleHRgXG4gICAgLy8gVGhpcyBpcyB3aHkgaXQgaXMgaW4gZGVidWcsIG5vdCBpbiB1dGlsLnRzXG4gICAgaWYgKHZhbHVlLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUIC0gMSkgcmV0dXJuIHZhbHVlIGFzIExWaWV3O1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBJMThORGVidWdJdGVtIHtcbiAgW2tleTogc3RyaW5nXTogYW55O1xuXG4gIGdldCB0Tm9kZSgpIHtcbiAgICByZXR1cm4gZ2V0VE5vZGUodGhpcy5fbFZpZXdbVFZJRVddLCB0aGlzLm5vZGVJbmRleCk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBfX3Jhd19vcENvZGU6IGFueSwgcHJpdmF0ZSBfbFZpZXc6IExWaWV3LCBwdWJsaWMgbm9kZUluZGV4OiBudW1iZXIsXG4gICAgICBwdWJsaWMgdHlwZTogc3RyaW5nKSB7fVxufVxuXG4vKipcbiAqIFR1cm5zIGEgbGlzdCBvZiBcIkNyZWF0ZVwiICYgXCJVcGRhdGVcIiBPcENvZGVzIGludG8gYSBodW1hbi1yZWFkYWJsZSBsaXN0IG9mIG9wZXJhdGlvbnMgZm9yXG4gKiBkZWJ1Z2dpbmcgcHVycG9zZXMuXG4gKiBAcGFyYW0gbXV0YXRlT3BDb2RlcyBtdXRhdGlvbiBvcENvZGVzIHRvIHJlYWRcbiAqIEBwYXJhbSB1cGRhdGVPcENvZGVzIHVwZGF0ZSBvcENvZGVzIHRvIHJlYWRcbiAqIEBwYXJhbSBpY3VzIGxpc3Qgb2YgSUNVIGV4cHJlc3Npb25zXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdGhlIG9wQ29kZXMgYXJlIGFjdGluZyBvblxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoSTE4bk9wQ29kZXNEZWJ1ZyhcbiAgICBtdXRhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXXxudWxsLFxuICAgIGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChtdXRhdGVPcENvZGVzLCBuZXcgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyhtdXRhdGVPcENvZGVzLCBsVmlldykpO1xuICBhdHRhY2hEZWJ1Z09iamVjdCh1cGRhdGVPcENvZGVzLCBuZXcgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1Zyh1cGRhdGVPcENvZGVzLCBpY3VzLCBsVmlldykpO1xuXG4gIGlmIChpY3VzKSB7XG4gICAgaWN1cy5mb3JFYWNoKGljdSA9PiB7XG4gICAgICBpY3UuY3JlYXRlLmZvckVhY2goaWN1Q2FzZSA9PiB7XG4gICAgICAgIGF0dGFjaERlYnVnT2JqZWN0KGljdUNhc2UsIG5ldyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnKGljdUNhc2UsIGxWaWV3KSk7XG4gICAgICB9KTtcbiAgICAgIGljdS51cGRhdGUuZm9yRWFjaChpY3VDYXNlID0+IHtcbiAgICAgICAgYXR0YWNoRGVidWdPYmplY3QoaWN1Q2FzZSwgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcoaWN1Q2FzZSwgaWN1cywgbFZpZXcpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnIGltcGxlbWVudHMgSTE4bk9wQ29kZXNEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX19yYXdfb3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIHByaXZhdGUgcmVhZG9ubHkgX19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBvcGVyYXRpb24gaW5mb3JtYXRpb24gYWJvdXQgaG93IHRoZSBPcENvZGVzIHdpbGwgYWN0IG9uIHRoZSB2aWV3LlxuICAgKi9cbiAgZ2V0IG9wZXJhdGlvbnMoKSB7XG4gICAgY29uc3Qge19fbFZpZXcsIF9fcmF3X29wQ29kZXN9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBfX3Jhd19vcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvcENvZGUgPSBfX3Jhd19vcENvZGVzW2ldO1xuICAgICAgbGV0IHJlc3VsdDogYW55O1xuICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICB0eXBlOiAnQ3JlYXRlIFRleHQgTm9kZScsXG4gICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgdGV4dDogb3BDb2RlLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBkZXN0aW5hdGlvbk5vZGVJbmRleCwgJ0FwcGVuZENoaWxkJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnU2VsZWN0Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZDpcbiAgICAgICAgICAgIGxldCBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBlbGVtZW50SW5kZXgsICdFbGVtZW50RW5kJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgIGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGVsZW1lbnRJbmRleCwgJ0F0dHInKTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0ck5hbWUnXSA9IF9fcmF3X29wQ29kZXNbKytpXTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0clZhbHVlJ10gPSBfX3Jhd19vcENvZGVzWysraV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICBzd2l0Y2ggKG9wQ29kZSkge1xuICAgICAgICAgIGNhc2UgQ09NTUVOVF9NQVJLRVI6XG4gICAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICB0eXBlOiAnQ09NTUVOVF9NQVJLRVInLFxuICAgICAgICAgICAgICBjb21tZW50VmFsdWU6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgIHR5cGU6ICdFTEVNRU5UX01BUktFUicsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgIHR5cGU6ICdVbmtub3duIE9wIENvZGUnLFxuICAgICAgICAgIGNvZGU6IG9wQ29kZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEkxOG5VcGRhdGVPcENvZGVzRGVidWcgaW1wbGVtZW50cyBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9fcmF3X29wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBwcml2YXRlIHJlYWRvbmx5IGljdXM6IFRJY3VbXXxudWxsLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfX2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogQSBsaXN0IG9mIG9wZXJhdGlvbiBpbmZvcm1hdGlvbiBhYm91dCBob3cgdGhlIE9wQ29kZXMgd2lsbCBhY3Qgb24gdGhlIHZpZXcuXG4gICAqL1xuICBnZXQgb3BlcmF0aW9ucygpIHtcbiAgICBjb25zdCB7X19sVmlldywgX19yYXdfb3BDb2RlcywgaWN1c30gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9fcmF3X29wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICAgIGNvbnN0IGNoZWNrQml0ID0gX19yYXdfb3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgICAgY29uc3Qgc2tpcENvZGVzID0gX19yYXdfb3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IF9fcmF3X29wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlICs9IG9wQ29kZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKG9wQ29kZSA8IDApIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBiaW5kaW5nIGluZGV4IHdob3NlIHZhbHVlIGlzIG5lZ2F0aXZlXG4gICAgICAgICAgICAvLyBXZSBjYW5ub3Qga25vdyB0aGUgdmFsdWUgb2YgdGhlIGJpbmRpbmcgc28gd2Ugb25seSBzaG93IHRoZSBpbmRleFxuICAgICAgICAgICAgdmFsdWUgKz0gYO+/vSR7LSBvcENvZGUgLSAxfe+/vWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICBsZXQgdEljdUluZGV4OiBudW1iZXI7XG4gICAgICAgICAgICBsZXQgdEljdTogVEljdTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IF9fcmF3X29wQ29kZXNbKytqXTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgICAgICBjaGVja0JpdCxcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdBdHRyJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJWYWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgICBhdHRyTmFtZSxcbiAgICAgICAgICAgICAgICAgIHNhbml0aXplRm4sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ1RleHQnLFxuICAgICAgICAgICAgICAgICAgbm9kZUluZGV4LFxuICAgICAgICAgICAgICAgICAgdGV4dDogdmFsdWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdJY3VTd2l0Y2gnKTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3VJbmRleCddID0gdEljdUluZGV4O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnY2hlY2tCaXQnXSA9IGNoZWNrQml0O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnbWFpbkJpbmRpbmcnXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdSddID0gdEljdTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnSWN1VXBkYXRlJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1SW5kZXgnXSA9IHRJY3VJbmRleDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ2NoZWNrQml0J10gPSBjaGVja0JpdDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3UnXSA9IHRJY3U7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpICs9IHNraXBDb2RlcztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgb3BlcmF0aW9uczogYW55W107XG59XG4iXX0=