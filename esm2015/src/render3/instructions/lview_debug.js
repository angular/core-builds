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
import { assertDefined } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET, MOVED_VIEWS, NATIVE } from '../interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from '../interfaces/i18n';
import { BINDING_INDEX, CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { NodeStylingDebug } from '../styling/styling_debug';
import { attachDebugObject } from '../util/debug_utils';
import { isStylingContext } from '../util/styling_utils';
import { getTNode, unwrapRNode } from '../util/view_utils';
/** @type {?} */
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
/** @type {?} */
export const LViewArray = NG_DEV_MODE && createNamedArrayType('LView') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
let LVIEW_EMPTY;
// can't initialize here or it will not be tree shaken, because `LView`
// constructor could have side-effects.
/**
 * This function clones a blueprint and creates LView.
 *
 * Simple slice will keep the same type, and we need it to be LView
 * @param {?} list
 * @return {?}
 */
export function cloneToLView(list) {
    if (LVIEW_EMPTY === undefined)
        LVIEW_EMPTY = new LViewArray();
    return (/** @type {?} */ (LVIEW_EMPTY.concat(list)));
}
/**
 * This class is a debug version of Object literal so that we can have constructor name show up in
 * debug tools in ngDevMode.
 * @type {?}
 */
export const TViewConstructor = class TView {
    /**
     * @param {?} id
     * @param {?} blueprint
     * @param {?} template
     * @param {?} queries
     * @param {?} viewQuery
     * @param {?} node
     * @param {?} data
     * @param {?} bindingStartIndex
     * @param {?} expandoStartIndex
     * @param {?} expandoInstructions
     * @param {?} firstTemplatePass
     * @param {?} staticViewQueries
     * @param {?} staticContentQueries
     * @param {?} preOrderHooks
     * @param {?} preOrderCheckHooks
     * @param {?} contentHooks
     * @param {?} contentCheckHooks
     * @param {?} viewHooks
     * @param {?} viewCheckHooks
     * @param {?} destroyHooks
     * @param {?} cleanup
     * @param {?} contentQueries
     * @param {?} components
     * @param {?} directiveRegistry
     * @param {?} pipeRegistry
     * @param {?} firstChild
     * @param {?} schemas
     * @param {?} consts
     */
    constructor(id, //
    blueprint, //
    template, //
    queries, //
    viewQuery, //
    node, //
    data, //
    bindingStartIndex, //
    expandoStartIndex, //
    expandoInstructions, //
    firstTemplatePass, //
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
    consts) {
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
        this.firstTemplatePass = firstTemplatePass;
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
    }
    /**
     * @return {?}
     */
    get template_() {
        /** @type {?} */
        const buf = [];
        processTNodeChildren(this.firstChild, buf);
        return buf.join('');
    }
};
/** @type {?} */
export const TNodeConstructor = class TNode {
    /**
     * @param {?} tView_
     * @param {?} type
     * @param {?} index
     * @param {?} injectorIndex
     * @param {?} directiveStart
     * @param {?} directiveEnd
     * @param {?} propertyBindings
     * @param {?} flags
     * @param {?} providerIndexes
     * @param {?} tagName
     * @param {?} attrs
     * @param {?} localNames
     * @param {?} initialInputs
     * @param {?} inputs
     * @param {?} outputs
     * @param {?} tViews
     * @param {?} next
     * @param {?} projectionNext
     * @param {?} child
     * @param {?} parent
     * @param {?} projection
     * @param {?} styles
     * @param {?} classes
     */
    constructor(tView_, //
    type, //
    index, //
    injectorIndex, //
    directiveStart, //
    directiveEnd, //
    propertyBindings, //
    flags, //
    providerIndexes, //
    tagName, //
    attrs, //
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
    classes) {
        this.tView_ = tView_;
        this.type = type;
        this.index = index;
        this.injectorIndex = injectorIndex;
        this.directiveStart = directiveStart;
        this.directiveEnd = directiveEnd;
        this.propertyBindings = propertyBindings;
        this.flags = flags;
        this.providerIndexes = providerIndexes;
        this.tagName = tagName;
        this.attrs = attrs;
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
        this.classes = classes;
    }
    /**
     * @return {?}
     */
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
    /**
     * @return {?}
     */
    get flags_() {
        /** @type {?} */
        const flags = [];
        if (this.flags & 16 /* hasClassInput */)
            flags.push('TNodeFlags.hasClassInput');
        if (this.flags & 8 /* hasContentQuery */)
            flags.push('TNodeFlags.hasContentQuery');
        if (this.flags & 32 /* hasStyleInput */)
            flags.push('TNodeFlags.hasStyleInput');
        if (this.flags & 64 /* hasInitialStyling */)
            flags.push('TNodeFlags.hasInitialStyling');
        if (this.flags & 256 /* hasHostBindings */)
            flags.push('TNodeFlags.hasHostBindings');
        if (this.flags & 2 /* isComponentHost */)
            flags.push('TNodeFlags.isComponentHost');
        if (this.flags & 1 /* isDirectiveHost */)
            flags.push('TNodeFlags.isDirectiveHost');
        if (this.flags & 128 /* isDetached */)
            flags.push('TNodeFlags.isDetached');
        if (this.flags & 4 /* isProjected */)
            flags.push('TNodeFlags.isProjected');
        return flags.join('|');
    }
    /**
     * @return {?}
     */
    get template_() {
        /** @type {?} */
        const buf = [];
        buf.push('<', this.tagName || this.type_);
        if (this.attrs) {
            for (let i = 0; i < this.attrs.length;) {
                /** @type {?} */
                const attrName = this.attrs[i++];
                if (typeof attrName == 'number') {
                    break;
                }
                /** @type {?} */
                const attrValue = this.attrs[i++];
                buf.push(' ', (/** @type {?} */ (attrName)), '="', (/** @type {?} */ (attrValue)), '"');
            }
        }
        buf.push('>');
        processTNodeChildren(this.child, buf);
        buf.push('</', this.tagName || this.type_, '>');
        return buf.join('');
    }
};
/**
 * @param {?} tNode
 * @param {?} buf
 * @return {?}
 */
function processTNodeChildren(tNode, buf) {
    while (tNode) {
        buf.push(((/** @type {?} */ ((/** @type {?} */ (tNode))))).template_);
        tNode = tNode.next;
    }
}
/** @type {?} */
const TViewData = NG_DEV_MODE && createNamedArrayType('TViewData') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
let TVIEWDATA_EMPTY;
// can't initialize here or it will not be tree shaken, because `LView`
// constructor could have side-effects.
/**
 * This function clones a blueprint and creates TData.
 *
 * Simple slice will keep the same type, and we need it to be TData
 * @param {?} list
 * @return {?}
 */
export function cloneToTViewData(list) {
    if (TVIEWDATA_EMPTY === undefined)
        TVIEWDATA_EMPTY = new TViewData();
    return (/** @type {?} */ (TVIEWDATA_EMPTY.concat(list)));
}
/** @type {?} */
export const LViewBlueprint = NG_DEV_MODE && createNamedArrayType('LViewBlueprint') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
export const MatchesArray = NG_DEV_MODE && createNamedArrayType('MatchesArray') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
export const TViewComponents = NG_DEV_MODE && createNamedArrayType('TViewComponents') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
export const TNodeLocalNames = NG_DEV_MODE && createNamedArrayType('TNodeLocalNames') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
export const TNodeInitialInputs = NG_DEV_MODE && createNamedArrayType('TNodeInitialInputs') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
export const TNodeInitialData = NG_DEV_MODE && createNamedArrayType('TNodeInitialData') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
export const LCleanup = NG_DEV_MODE && createNamedArrayType('LCleanup') || (/** @type {?} */ ((/** @type {?} */ (null))));
/** @type {?} */
export const TCleanup = NG_DEV_MODE && createNamedArrayType('TCleanup') || (/** @type {?} */ ((/** @type {?} */ (null))));
/**
 * @param {?} lView
 * @return {?}
 */
export function attachLViewDebug(lView) {
    attachDebugObject(lView, new LViewDebug(lView));
}
/**
 * @param {?} lContainer
 * @return {?}
 */
export function attachLContainerDebug(lContainer) {
    attachDebugObject(lContainer, new LContainerDebug(lContainer));
}
/**
 * @param {?} obj
 * @return {?}
 */
export function toDebug(obj) {
    if (obj) {
        /** @type {?} */
        const debug = ((/** @type {?} */ (obj))).debug;
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
 * @param {?} value possibly wrapped native DOM node.
 * @param {?=} includeChildren If `true` then the serialized HTML form will include child elements (same
 * as `outerHTML`). If `false` then the serialized HTML form will only contain the element itself
 * (will not serialize child elements).
 * @return {?}
 */
function toHtml(value, includeChildren = false) {
    /** @type {?} */
    const node = (/** @type {?} */ (unwrapRNode(value)));
    if (node) {
        /** @type {?} */
        const isTextNode = node.nodeType === Node.TEXT_NODE;
        /** @type {?} */
        const outerHTML = (isTextNode ? node.textContent : node.outerHTML) || '';
        if (includeChildren || isTextNode) {
            return outerHTML;
        }
        else {
            /** @type {?} */
            const innerHTML = '>' + node.innerHTML + '<';
            return (outerHTML.split(innerHTML)[0]) + '>';
        }
    }
    else {
        return null;
    }
}
export class LViewDebug {
    /**
     * @param {?} _raw_lView
     */
    constructor(_raw_lView) {
        this._raw_lView = _raw_lView;
    }
    /**
     * Flags associated with the `LView` unpacked into a more readable state.
     * @return {?}
     */
    get flags() {
        /** @type {?} */
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
            indexWithinInitPhase: flags >> 10 /* IndexWithinInitPhaseShift */,
        };
    }
    /**
     * @return {?}
     */
    get parent() { return toDebug(this._raw_lView[PARENT]); }
    /**
     * @return {?}
     */
    get host() { return toHtml(this._raw_lView[HOST], true); }
    /**
     * @return {?}
     */
    get html() { return (this.nodes || []).map((/**
     * @param {?} node
     * @return {?}
     */
    node => toHtml(node.native, true))).join(''); }
    /**
     * @return {?}
     */
    get context() { return this._raw_lView[CONTEXT]; }
    /**
     * The tree of nodes associated with the current `LView`. The nodes have been normalized into a
     * tree structure with relevant details pulled out for readability.
     * @return {?}
     */
    get nodes() {
        /** @type {?} */
        const lView = this._raw_lView;
        /** @type {?} */
        const tNode = lView[TVIEW].firstChild;
        return toDebugNodes(tNode, lView);
    }
    /**
     * @return {?}
     */
    get tView() { return this._raw_lView[TVIEW]; }
    /**
     * @return {?}
     */
    get cleanup() { return this._raw_lView[CLEANUP]; }
    /**
     * @return {?}
     */
    get injector() { return this._raw_lView[INJECTOR]; }
    /**
     * @return {?}
     */
    get rendererFactory() { return this._raw_lView[RENDERER_FACTORY]; }
    /**
     * @return {?}
     */
    get renderer() { return this._raw_lView[RENDERER]; }
    /**
     * @return {?}
     */
    get sanitizer() { return this._raw_lView[SANITIZER]; }
    /**
     * @return {?}
     */
    get childHead() { return toDebug(this._raw_lView[CHILD_HEAD]); }
    /**
     * @return {?}
     */
    get next() { return toDebug(this._raw_lView[NEXT]); }
    /**
     * @return {?}
     */
    get childTail() { return toDebug(this._raw_lView[CHILD_TAIL]); }
    /**
     * @return {?}
     */
    get declarationView() { return toDebug(this._raw_lView[DECLARATION_VIEW]); }
    /**
     * @return {?}
     */
    get queries() { return this._raw_lView[QUERIES]; }
    /**
     * @return {?}
     */
    get tHost() { return this._raw_lView[T_HOST]; }
    /**
     * @return {?}
     */
    get bindingIndex() { return this._raw_lView[BINDING_INDEX]; }
    /**
     * Normalized view of child views (and containers) attached at this location.
     * @return {?}
     */
    get childViews() {
        /** @type {?} */
        const childViews = [];
        /** @type {?} */
        let child = this.childHead;
        while (child) {
            childViews.push(child);
            child = child.next;
        }
        return childViews;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    LViewDebug.prototype._raw_lView;
}
/**
 * @record
 */
export function DebugNode() { }
if (false) {
    /** @type {?} */
    DebugNode.prototype.html;
    /** @type {?} */
    DebugNode.prototype.native;
    /** @type {?} */
    DebugNode.prototype.styles;
    /** @type {?} */
    DebugNode.prototype.classes;
    /** @type {?} */
    DebugNode.prototype.nodes;
    /** @type {?} */
    DebugNode.prototype.component;
}
/**
 * Turns a flat list of nodes into a tree by walking the associated `TNode` tree.
 *
 * @param {?} tNode
 * @param {?} lView
 * @return {?}
 */
export function toDebugNodes(tNode, lView) {
    if (tNode) {
        /** @type {?} */
        const debugNodes = [];
        /** @type {?} */
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
/**
 * @param {?} tNode
 * @param {?} lView
 * @param {?} nodeIndex
 * @return {?}
 */
export function buildDebugNode(tNode, lView, nodeIndex) {
    /** @type {?} */
    const rawValue = lView[nodeIndex];
    /** @type {?} */
    const native = unwrapRNode(rawValue);
    /** @type {?} */
    const componentLViewDebug = toDebug(readLViewValue(rawValue));
    /** @type {?} */
    const styles = isStylingContext(tNode.styles) ?
        new NodeStylingDebug((/** @type {?} */ ((/** @type {?} */ (tNode.styles)))), lView, false) :
        null;
    /** @type {?} */
    const classes = isStylingContext(tNode.classes) ?
        new NodeStylingDebug((/** @type {?} */ ((/** @type {?} */ (tNode.classes)))), lView, true) :
        null;
    return {
        html: toHtml(native),
        native: (/** @type {?} */ (native)), styles, classes,
        nodes: toDebugNodes(tNode.child, lView),
        component: componentLViewDebug,
    };
}
export class LContainerDebug {
    /**
     * @param {?} _raw_lContainer
     */
    constructor(_raw_lContainer) {
        this._raw_lContainer = _raw_lContainer;
    }
    /**
     * @return {?}
     */
    get activeIndex() { return this._raw_lContainer[ACTIVE_INDEX]; }
    /**
     * @return {?}
     */
    get views() {
        return this._raw_lContainer.slice(CONTAINER_HEADER_OFFSET)
            .map((/** @type {?} */ (toDebug)));
    }
    /**
     * @return {?}
     */
    get parent() { return toDebug(this._raw_lContainer[PARENT]); }
    /**
     * @return {?}
     */
    get movedViews() { return this._raw_lContainer[MOVED_VIEWS]; }
    /**
     * @return {?}
     */
    get host() { return this._raw_lContainer[HOST]; }
    /**
     * @return {?}
     */
    get native() { return this._raw_lContainer[NATIVE]; }
    /**
     * @return {?}
     */
    get next() { return toDebug(this._raw_lContainer[NEXT]); }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    LContainerDebug.prototype._raw_lContainer;
}
/**
 * Return an `LView` value if found.
 *
 * @param {?} value `LView` if any
 * @return {?}
 */
export function readLViewValue(value) {
    while (Array.isArray(value)) {
        // This check is not quite right, as it does not take into account `StylingContext`
        // This is why it is in debug, not in util.ts
        if (value.length >= HEADER_OFFSET - 1)
            return (/** @type {?} */ (value));
        value = value[HOST];
    }
    return null;
}
export class I18NDebugItem {
    /**
     * @param {?} __raw_opCode
     * @param {?} _lView
     * @param {?} nodeIndex
     * @param {?} type
     */
    constructor(__raw_opCode, _lView, nodeIndex, type) {
        this.__raw_opCode = __raw_opCode;
        this._lView = _lView;
        this.nodeIndex = nodeIndex;
        this.type = type;
    }
    /**
     * @return {?}
     */
    get tNode() { return getTNode(this.nodeIndex, this._lView); }
}
if (false) {
    /** @type {?} */
    I18NDebugItem.prototype.__raw_opCode;
    /**
     * @type {?}
     * @private
     */
    I18NDebugItem.prototype._lView;
    /** @type {?} */
    I18NDebugItem.prototype.nodeIndex;
    /** @type {?} */
    I18NDebugItem.prototype.type;
    /* Skipping unhandled member: [key: string]: any;*/
}
/**
 * Turns a list of "Create" & "Update" OpCodes into a human-readable list of operations for
 * debugging purposes.
 * @param {?} mutateOpCodes mutation opCodes to read
 * @param {?} updateOpCodes update opCodes to read
 * @param {?} icus list of ICU expressions
 * @param {?} lView The view the opCodes are acting on
 * @return {?}
 */
export function attachI18nOpCodesDebug(mutateOpCodes, updateOpCodes, icus, lView) {
    attachDebugObject(mutateOpCodes, new I18nMutateOpCodesDebug(mutateOpCodes, lView));
    attachDebugObject(updateOpCodes, new I18nUpdateOpCodesDebug(updateOpCodes, icus, lView));
    if (icus) {
        icus.forEach((/**
         * @param {?} icu
         * @return {?}
         */
        icu => {
            icu.create.forEach((/**
             * @param {?} icuCase
             * @return {?}
             */
            icuCase => { attachDebugObject(icuCase, new I18nMutateOpCodesDebug(icuCase, lView)); }));
            icu.update.forEach((/**
             * @param {?} icuCase
             * @return {?}
             */
            icuCase => {
                attachDebugObject(icuCase, new I18nUpdateOpCodesDebug(icuCase, icus, lView));
            }));
        }));
    }
}
export class I18nMutateOpCodesDebug {
    /**
     * @param {?} __raw_opCodes
     * @param {?} __lView
     */
    constructor(__raw_opCodes, __lView) {
        this.__raw_opCodes = __raw_opCodes;
        this.__lView = __lView;
    }
    /**
     * A list of operation information about how the OpCodes will act on the view.
     * @return {?}
     */
    get operations() {
        const { __lView, __raw_opCodes } = this;
        /** @type {?} */
        const results = [];
        for (let i = 0; i < __raw_opCodes.length; i++) {
            /** @type {?} */
            const opCode = __raw_opCodes[i];
            /** @type {?} */
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
                        /** @type {?} */
                        const destinationNodeIndex = opCode >>> 17 /* SHIFT_PARENT */;
                        result = new I18NDebugItem(opCode, __lView, destinationNodeIndex, 'AppendChild');
                        break;
                    case 0 /* Select */:
                        /** @type {?} */
                        const nodeIndex = opCode >>> 3 /* SHIFT_REF */;
                        result = new I18NDebugItem(opCode, __lView, nodeIndex, 'Select');
                        break;
                    case 5 /* ElementEnd */:
                        /** @type {?} */
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
if (false) {
    /**
     * @type {?}
     * @private
     */
    I18nMutateOpCodesDebug.prototype.__raw_opCodes;
    /**
     * @type {?}
     * @private
     */
    I18nMutateOpCodesDebug.prototype.__lView;
}
export class I18nUpdateOpCodesDebug {
    /**
     * @param {?} __raw_opCodes
     * @param {?} icus
     * @param {?} __lView
     */
    constructor(__raw_opCodes, icus, __lView) {
        this.__raw_opCodes = __raw_opCodes;
        this.icus = icus;
        this.__lView = __lView;
    }
    /**
     * A list of operation information about how the OpCodes will act on the view.
     * @return {?}
     */
    get operations() {
        const { __lView, __raw_opCodes, icus } = this;
        /** @type {?} */
        const results = [];
        for (let i = 0; i < __raw_opCodes.length; i++) {
            // bit code to check if we should apply the next update
            /** @type {?} */
            const checkBit = (/** @type {?} */ (__raw_opCodes[i]));
            // Number of opCodes to skip until next set of update codes
            /** @type {?} */
            const skipCodes = (/** @type {?} */ (__raw_opCodes[++i]));
            /** @type {?} */
            let value = '';
            for (let j = i + 1; j <= (i + skipCodes); j++) {
                /** @type {?} */
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
                        /** @type {?} */
                        const nodeIndex = opCode >>> 2 /* SHIFT_REF */;
                        /** @type {?} */
                        let tIcuIndex;
                        /** @type {?} */
                        let tIcu;
                        switch (opCode & 3 /* MASK_OPCODE */) {
                            case 1 /* Attr */:
                                /** @type {?} */
                                const attrName = (/** @type {?} */ (__raw_opCodes[++j]));
                                /** @type {?} */
                                const sanitizeFn = __raw_opCodes[++j];
                                results.push({
                                    __raw_opCode: opCode,
                                    checkBit,
                                    type: 'Attr',
                                    attrValue: value, attrName, sanitizeFn,
                                });
                                break;
                            case 0 /* Text */:
                                results.push({
                                    __raw_opCode: opCode,
                                    checkBit,
                                    type: 'Text', nodeIndex,
                                    text: value,
                                });
                                break;
                            case 2 /* IcuSwitch */:
                                tIcuIndex = (/** @type {?} */ (__raw_opCodes[++j]));
                                tIcu = (/** @type {?} */ (icus))[tIcuIndex];
                                /** @type {?} */
                                let result = new I18NDebugItem(opCode, __lView, nodeIndex, 'IcuSwitch');
                                result['tIcuIndex'] = tIcuIndex;
                                result['checkBit'] = checkBit;
                                result['mainBinding'] = value;
                                result['tIcu'] = tIcu;
                                results.push(result);
                                break;
                            case 3 /* IcuUpdate */:
                                tIcuIndex = (/** @type {?} */ (__raw_opCodes[++j]));
                                tIcu = (/** @type {?} */ (icus))[tIcuIndex];
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
if (false) {
    /**
     * @type {?}
     * @private
     */
    I18nUpdateOpCodesDebug.prototype.__raw_opCodes;
    /**
     * @type {?}
     * @private
     */
    I18nUpdateOpCodesDebug.prototype.icus;
    /**
     * @type {?}
     * @private
     */
    I18nUpdateOpCodesDebug.prototype.__lView;
}
/**
 * @record
 */
export function I18nOpCodesDebug() { }
if (false) {
    /** @type {?} */
    I18nOpCodesDebug.prototype.operations;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDckQsT0FBTyxFQUFDLFlBQVksRUFBRSx1QkFBdUIsRUFBYyxXQUFXLEVBQUUsTUFBTSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFL0csT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlGLE1BQU0sb0JBQW9CLENBQUM7QUFNbEosT0FBTyxFQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQXVCLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFZLFFBQVEsRUFBcUIsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBUyxLQUFLLEVBQTBCLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2pULE9BQU8sRUFBbUIsZ0JBQWdCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2RCxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBQyxNQUFNLG9CQUFvQixDQUFDOztNQUVuRCxXQUFXLEdBQUcsQ0FBQyxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxD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T0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQ0FDckIsTUFBTTs0QkFDUjtnQ0FDRSxTQUFTLEdBQUcsbUJBQUEsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQVUsQ0FBQztnQ0FDekMsSUFBSSxHQUFHLG1CQUFBLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dDQUN6QixNQUFNLEdBQUcsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0NBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxTQUFTLENBQUM7Z0NBQ2hDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxRQUFRLENBQUM7Z0NBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7Z0NBQ3RCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQ3JCLE1BQU07eUJBQ1Q7cUJBQ0Y7aUJBQ0Y7YUFDRjtZQUNELENBQUMsSUFBSSxTQUFTLENBQUM7U0FDaEI7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0NBQ0Y7Ozs7OztJQTNFSywrQ0FBaUQ7Ozs7O0lBQUUsc0NBQWtDOzs7OztJQUNyRix5Q0FBK0I7Ozs7O0FBNEVyQyxzQ0FBd0Q7OztJQUFwQixzQ0FBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBDb21wb25lbnRUZW1wbGF0ZX0gZnJvbSAnLi4nO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vY29yZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge2luaXROZ0Rldk1vZGV9IGZyb20gJy4uLy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXUywgTkFUSVZFfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0LCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT01NRU5UX01BUktFUiwgRUxFTUVOVF9NQVJLRVIsIEkxOG5NdXRhdGVPcENvZGUsIEkxOG5NdXRhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgVEljdX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7UHJvcGVydHlBbGlhc2VzLCBUQXR0cmlidXRlcywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUgYXMgSVROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTZWxlY3RvckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtUUXVlcmllc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIb29rRGF0YSwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBTQU5JVElaRVIsIFREYXRhLCBUVklFVywgVFZpZXcgYXMgSVRWaWV3LCBUVmlldywgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z05vZGVTdHlsaW5nLCBOb2RlU3R5bGluZ0RlYnVnfSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldFROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuY29uc3QgTkdfREVWX01PREUgPSAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8ICEhbmdEZXZNb2RlKSAmJiBpbml0TmdEZXZNb2RlKCkpO1xuXG4vKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGNvbmRpdGlvbmFsbHkgYXR0YWNoZWQgY2xhc3NlcyB3aGljaCBwcm92aWRlIGh1bWFuIHJlYWRhYmxlIChkZWJ1ZykgbGV2ZWxcbiAqIGluZm9ybWF0aW9uIGZvciBgTFZpZXdgLCBgTENvbnRhaW5lcmAgYW5kIG90aGVyIGludGVybmFsIGRhdGEgc3RydWN0dXJlcy4gVGhlc2UgZGF0YSBzdHJ1Y3R1cmVzXG4gKiBhcmUgc3RvcmVkIGludGVybmFsbHkgYXMgYXJyYXkgd2hpY2ggbWFrZXMgaXQgdmVyeSBkaWZmaWN1bHQgZHVyaW5nIGRlYnVnZ2luZyB0byByZWFzb24gYWJvdXQgdGhlXG4gKiBjdXJyZW50IHN0YXRlIG9mIHRoZSBzeXN0ZW0uXG4gKlxuICogUGF0Y2hpbmcgdGhlIGFycmF5IHdpdGggZXh0cmEgcHJvcGVydHkgZG9lcyBjaGFuZ2UgdGhlIGFycmF5J3MgaGlkZGVuIGNsYXNzJyBidXQgaXQgZG9lcyBub3RcbiAqIGNoYW5nZSB0aGUgY29zdCBvZiBhY2Nlc3MsIHRoZXJlZm9yZSB0aGlzIHBhdGNoaW5nIHNob3VsZCBub3QgaGF2ZSBzaWduaWZpY2FudCBpZiBhbnkgaW1wYWN0IGluXG4gKiBgbmdEZXZNb2RlYCBtb2RlLiAoc2VlOiBodHRwczovL2pzcGVyZi5jb20vYXJyYXktdnMtbW9ua2V5LXBhdGNoLWFycmF5KVxuICpcbiAqIFNvIGluc3RlYWQgb2Ygc2VlaW5nOlxuICogYGBgXG4gKiBBcnJheSgzMCkgW09iamVjdCwgNjU5LCBudWxsLCDigKZdXG4gKiBgYGBcbiAqXG4gKiBZb3UgZ2V0IHRvIHNlZTpcbiAqIGBgYFxuICogTFZpZXdEZWJ1ZyB7XG4gKiAgIHZpZXdzOiBbLi4uXSxcbiAqICAgZmxhZ3M6IHthdHRhY2hlZDogdHJ1ZSwgLi4ufVxuICogICBub2RlczogW1xuICogICAgIHtodG1sOiAnPGRpdiBpZD1cIjEyM1wiPicsIC4uLiwgbm9kZXM6IFtcbiAqICAgICAgIHtodG1sOiAnPHNwYW4+JywgLi4uLCBub2RlczogbnVsbH1cbiAqICAgICBdfVxuICogICBdXG4gKiB9XG4gKiBgYGBcbiAqL1xuXG5leHBvcnQgY29uc3QgTFZpZXdBcnJheSA9IE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMVmlldycpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5sZXQgTFZJRVdfRU1QVFk6IHVua25vd25bXTsgIC8vIGNhbid0IGluaXRpYWxpemUgaGVyZSBvciBpdCB3aWxsIG5vdCBiZSB0cmVlIHNoYWtlbiwgYmVjYXVzZSBgTFZpZXdgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0cnVjdG9yIGNvdWxkIGhhdmUgc2lkZS1lZmZlY3RzLlxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNsb25lcyBhIGJsdWVwcmludCBhbmQgY3JlYXRlcyBMVmlldy5cbiAqXG4gKiBTaW1wbGUgc2xpY2Ugd2lsbCBrZWVwIHRoZSBzYW1lIHR5cGUsIGFuZCB3ZSBuZWVkIGl0IHRvIGJlIExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZVRvTFZpZXcobGlzdDogYW55W10pOiBMVmlldyB7XG4gIGlmIChMVklFV19FTVBUWSA9PT0gdW5kZWZpbmVkKSBMVklFV19FTVBUWSA9IG5ldyBMVmlld0FycmF5KCk7XG4gIHJldHVybiBMVklFV19FTVBUWS5jb25jYXQobGlzdCkgYXMgYW55O1xufVxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgYSBkZWJ1ZyB2ZXJzaW9uIG9mIE9iamVjdCBsaXRlcmFsIHNvIHRoYXQgd2UgY2FuIGhhdmUgY29uc3RydWN0b3IgbmFtZSBzaG93IHVwIGluXG4gKiBkZWJ1ZyB0b29scyBpbiBuZ0Rldk1vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBUVmlld0NvbnN0cnVjdG9yID0gY2xhc3MgVFZpZXcgaW1wbGVtZW50cyBJVFZpZXcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBpZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJsdWVwcmludDogTFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBxdWVyaWVzOiBUUXVlcmllc3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCwgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkYXRhOiBURGF0YSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsICAvL1xuICAgICAgcHVibGljIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJlT3JkZXJDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2xlYW51cDogYW55W118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCwgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGwsICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLCAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb25zdHM6IFRBdHRyaWJ1dGVzW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgKSB7fVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5maXJzdENoaWxkLCBidWYpO1xuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBUTm9kZUNvbnN0cnVjdG9yID0gY2xhc3MgVE5vZGUgaW1wbGVtZW50cyBJVE5vZGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyB0Vmlld186IFRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHR5cGU6IFROb2RlVHlwZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbmplY3RvckluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlRW5kOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZsYWdzOiBUTm9kZUZsYWdzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlcywgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbCwgIC8vXG4gICAgICBwdWJsaWMgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbml0aWFsSW5wdXRzOiAoc3RyaW5nW118bnVsbClbXXxudWxsfHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIG5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjaGlsZDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdHlsZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICApIHt9XG5cbiAgZ2V0IHR5cGVfKCk6IHN0cmluZyB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkNvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuQ29udGFpbmVyJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnQ6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkVsZW1lbnQnO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5JY3VDb250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkljdUNvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5Qcm9qZWN0aW9uOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5Qcm9qZWN0aW9uJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLlZpZXc6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLlZpZXcnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuPz8/JztcbiAgICB9XG4gIH1cblxuICBnZXQgZmxhZ3NfKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZmxhZ3M6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnkpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZykgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZycpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzJyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzRGV0YWNoZWQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQnKTtcbiAgICByZXR1cm4gZmxhZ3Muam9pbignfCcpO1xuICB9XG5cbiAgZ2V0IHRlbXBsYXRlXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICBidWYucHVzaCgnPCcsIHRoaXMudGFnTmFtZSB8fCB0aGlzLnR5cGVfKTtcbiAgICBpZiAodGhpcy5hdHRycykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dHJzLmxlbmd0aDspIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGJ1Zi5wdXNoKCcgJywgYXR0ck5hbWUgYXMgc3RyaW5nLCAnPVwiJywgYXR0clZhbHVlIGFzIHN0cmluZywgJ1wiJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGJ1Zi5wdXNoKCc+Jyk7XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5jaGlsZCwgYnVmKTtcbiAgICBidWYucHVzaCgnPC8nLCB0aGlzLnRhZ05hbWUgfHwgdGhpcy50eXBlXywgJz4nKTtcbiAgICByZXR1cm4gYnVmLmpvaW4oJycpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBwcm9jZXNzVE5vZGVDaGlsZHJlbih0Tm9kZTogVE5vZGUgfCBudWxsLCBidWY6IHN0cmluZ1tdKSB7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGJ1Zi5wdXNoKCh0Tm9kZSBhcyBhbnkgYXN7dGVtcGxhdGVfOiBzdHJpbmd9KS50ZW1wbGF0ZV8pO1xuICAgIHROb2RlID0gdE5vZGUubmV4dDtcbiAgfVxufVxuXG5jb25zdCBUVmlld0RhdGEgPSBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVFZpZXdEYXRhJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmxldCBUVklFV0RBVEFfRU1QVFk6XG4gICAgdW5rbm93bltdOyAgLy8gY2FuJ3QgaW5pdGlhbGl6ZSBoZXJlIG9yIGl0IHdpbGwgbm90IGJlIHRyZWUgc2hha2VuLCBiZWNhdXNlIGBMVmlld2BcbiAgICAgICAgICAgICAgICAvLyBjb25zdHJ1Y3RvciBjb3VsZCBoYXZlIHNpZGUtZWZmZWN0cy5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgVERhdGEuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBURGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb1RWaWV3RGF0YShsaXN0OiBhbnlbXSk6IFREYXRhIHtcbiAgaWYgKFRWSUVXREFUQV9FTVBUWSA9PT0gdW5kZWZpbmVkKSBUVklFV0RBVEFfRU1QVFkgPSBuZXcgVFZpZXdEYXRhKCk7XG4gIHJldHVybiBUVklFV0RBVEFfRU1QVFkuY29uY2F0KGxpc3QpIGFzIGFueTtcbn1cblxuZXhwb3J0IGNvbnN0IExWaWV3Qmx1ZXByaW50ID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFZpZXdCbHVlcHJpbnQnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IE1hdGNoZXNBcnJheSA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ01hdGNoZXNBcnJheScpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVFZpZXdDb21wb25lbnRzID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVFZpZXdDb21wb25lbnRzJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUTm9kZUxvY2FsTmFtZXMgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUxvY2FsTmFtZXMnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbElucHV0cyA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbElucHV0cycpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVE5vZGVJbml0aWFsRGF0YSA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbERhdGEnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IExDbGVhbnVwID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTENsZWFudXAnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFRDbGVhbnVwID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVENsZWFudXAnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExWaWV3RGVidWcobFZpZXc6IExWaWV3KSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxWaWV3LCBuZXcgTFZpZXdEZWJ1ZyhsVmlldykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoTENvbnRhaW5lckRlYnVnKGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobENvbnRhaW5lciwgbmV3IExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcpOiBMVmlld0RlYnVnO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyB8IG51bGwpOiBMVmlld0RlYnVnfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3IHwgTENvbnRhaW5lciB8IG51bGwpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBhbnkpOiBhbnkge1xuICBpZiAob2JqKSB7XG4gICAgY29uc3QgZGVidWcgPSAob2JqIGFzIGFueSkuZGVidWc7XG4gICAgYXNzZXJ0RGVmaW5lZChkZWJ1ZywgJ09iamVjdCBkb2VzIG5vdCBoYXZlIGEgZGVidWcgcmVwcmVzZW50YXRpb24uJyk7XG4gICAgcmV0dXJuIGRlYnVnO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmo7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2UgdGhpcyBtZXRob2QgdG8gdW53cmFwIGEgbmF0aXZlIGVsZW1lbnQgaW4gYExWaWV3YCBhbmQgY29udmVydCBpdCBpbnRvIEhUTUwgZm9yIGVhc2llclxuICogcmVhZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgcG9zc2libHkgd3JhcHBlZCBuYXRpdmUgRE9NIG5vZGUuXG4gKiBAcGFyYW0gaW5jbHVkZUNoaWxkcmVuIElmIGB0cnVlYCB0aGVuIHRoZSBzZXJpYWxpemVkIEhUTUwgZm9ybSB3aWxsIGluY2x1ZGUgY2hpbGQgZWxlbWVudHMgKHNhbWVcbiAqIGFzIGBvdXRlckhUTUxgKS4gSWYgYGZhbHNlYCB0aGVuIHRoZSBzZXJpYWxpemVkIEhUTUwgZm9ybSB3aWxsIG9ubHkgY29udGFpbiB0aGUgZWxlbWVudCBpdHNlbGZcbiAqICh3aWxsIG5vdCBzZXJpYWxpemUgY2hpbGQgZWxlbWVudHMpLlxuICovXG5mdW5jdGlvbiB0b0h0bWwodmFsdWU6IGFueSwgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IG5vZGU6IEhUTUxFbGVtZW50fG51bGwgPSB1bndyYXBSTm9kZSh2YWx1ZSkgYXMgYW55O1xuICBpZiAobm9kZSkge1xuICAgIGNvbnN0IGlzVGV4dE5vZGUgPSBub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERTtcbiAgICBjb25zdCBvdXRlckhUTUwgPSAoaXNUZXh0Tm9kZSA/IG5vZGUudGV4dENvbnRlbnQgOiBub2RlLm91dGVySFRNTCkgfHwgJyc7XG4gICAgaWYgKGluY2x1ZGVDaGlsZHJlbiB8fCBpc1RleHROb2RlKSB7XG4gICAgICByZXR1cm4gb3V0ZXJIVE1MO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbm5lckhUTUwgPSAnPicgKyBub2RlLmlubmVySFRNTCArICc8JztcbiAgICAgIHJldHVybiAob3V0ZXJIVE1MLnNwbGl0KGlubmVySFRNTClbMF0pICsgJz4nO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTFZpZXdEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEZsYWdzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYExWaWV3YCB1bnBhY2tlZCBpbnRvIGEgbW9yZSByZWFkYWJsZSBzdGF0ZS5cbiAgICovXG4gIGdldCBmbGFncygpIHtcbiAgICBjb25zdCBmbGFncyA9IHRoaXMuX3Jhd19sVmlld1tGTEFHU107XG4gICAgcmV0dXJuIHtcbiAgICAgIF9fcmF3X19mbGFnc19fOiBmbGFncyxcbiAgICAgIGluaXRQaGFzZVN0YXRlOiBmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrLFxuICAgICAgY3JlYXRpb25Nb2RlOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSxcbiAgICAgIGZpcnN0Vmlld1Bhc3M6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyksXG4gICAgICBjaGVja0Fsd2F5czogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSxcbiAgICAgIGRpcnR5OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkpLFxuICAgICAgYXR0YWNoZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5BdHRhY2hlZCksXG4gICAgICBkZXN0cm95ZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpLFxuICAgICAgaXNSb290OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuSXNSb290KSxcbiAgICAgIGluZGV4V2l0aGluSW5pdFBoYXNlOiBmbGFncyA+PiBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlU2hpZnQsXG4gICAgfTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnfG51bGwgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbUEFSRU5UXSk7IH1cbiAgZ2V0IGhvc3QoKTogc3RyaW5nfG51bGwgeyByZXR1cm4gdG9IdG1sKHRoaXMuX3Jhd19sVmlld1tIT1NUXSwgdHJ1ZSk7IH1cbiAgZ2V0IGh0bWwoKTogc3RyaW5nIHsgcmV0dXJuICh0aGlzLm5vZGVzIHx8IFtdKS5tYXAobm9kZSA9PiB0b0h0bWwobm9kZS5uYXRpdmUsIHRydWUpKS5qb2luKCcnKTsgfVxuICBnZXQgY29udGV4dCgpOiB7fXxudWxsIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tDT05URVhUXTsgfVxuICAvKipcbiAgICogVGhlIHRyZWUgb2Ygbm9kZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGBMVmlld2AuIFRoZSBub2RlcyBoYXZlIGJlZW4gbm9ybWFsaXplZCBpbnRvIGFcbiAgICogdHJlZSBzdHJ1Y3R1cmUgd2l0aCByZWxldmFudCBkZXRhaWxzIHB1bGxlZCBvdXQgZm9yIHJlYWRhYmlsaXR5LlxuICAgKi9cbiAgZ2V0IG5vZGVzKCk6IERlYnVnTm9kZVtdfG51bGwge1xuICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fcmF3X2xWaWV3O1xuICAgIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgcmV0dXJuIHRvRGVidWdOb2Rlcyh0Tm9kZSwgbFZpZXcpO1xuICB9XG5cbiAgZ2V0IHRWaWV3KCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1RWSUVXXTsgfVxuICBnZXQgY2xlYW51cCgpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tDTEVBTlVQXTsgfVxuICBnZXQgaW5qZWN0b3IoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbSU5KRUNUT1JdOyB9XG4gIGdldCByZW5kZXJlckZhY3RvcnkoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07IH1cbiAgZ2V0IHJlbmRlcmVyKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSXTsgfVxuICBnZXQgc2FuaXRpemVyKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1NBTklUSVpFUl07IH1cbiAgZ2V0IGNoaWxkSGVhZCgpIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX0hFQURdKTsgfVxuICBnZXQgbmV4dCgpIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W05FWFRdKTsgfVxuICBnZXQgY2hpbGRUYWlsKCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbQ0hJTERfVEFJTF0pOyB9XG4gIGdldCBkZWNsYXJhdGlvblZpZXcoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tERUNMQVJBVElPTl9WSUVXXSk7IH1cbiAgZ2V0IHF1ZXJpZXMoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUVVFUklFU107IH1cbiAgZ2V0IHRIb3N0KCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1RfSE9TVF07IH1cbiAgZ2V0IGJpbmRpbmdJbmRleCgpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tCSU5ESU5HX0lOREVYXTsgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVkIHZpZXcgb2YgY2hpbGQgdmlld3MgKGFuZCBjb250YWluZXJzKSBhdHRhY2hlZCBhdCB0aGlzIGxvY2F0aW9uLlxuICAgKi9cbiAgZ2V0IGNoaWxkVmlld3MoKTogQXJyYXk8TFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWc+IHtcbiAgICBjb25zdCBjaGlsZFZpZXdzOiBBcnJheTxMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Zz4gPSBbXTtcbiAgICBsZXQgY2hpbGQgPSB0aGlzLmNoaWxkSGVhZDtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIGNoaWxkVmlld3MucHVzaChjaGlsZCk7XG4gICAgICBjaGlsZCA9IGNoaWxkLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZFZpZXdzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgaHRtbDogc3RyaW5nfG51bGw7XG4gIG5hdGl2ZTogTm9kZTtcbiAgc3R5bGVzOiBEZWJ1Z05vZGVTdHlsaW5nfG51bGw7XG4gIGNsYXNzZXM6IERlYnVnTm9kZVN0eWxpbmd8bnVsbDtcbiAgbm9kZXM6IERlYnVnTm9kZVtdfG51bGw7XG4gIGNvbXBvbmVudDogTFZpZXdEZWJ1Z3xudWxsO1xufVxuXG4vKipcbiAqIFR1cm5zIGEgZmxhdCBsaXN0IG9mIG5vZGVzIGludG8gYSB0cmVlIGJ5IHdhbGtpbmcgdGhlIGFzc29jaWF0ZWQgYFROb2RlYCB0cmVlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnTm9kZXModE5vZGU6IFROb2RlIHwgbnVsbCwgbFZpZXc6IExWaWV3KTogRGVidWdOb2RlW118bnVsbCB7XG4gIGlmICh0Tm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgbGV0IHROb2RlQ3Vyc29yOiBUTm9kZXxudWxsID0gdE5vZGU7XG4gICAgd2hpbGUgKHROb2RlQ3Vyc29yKSB7XG4gICAgICBkZWJ1Z05vZGVzLnB1c2goYnVpbGREZWJ1Z05vZGUodE5vZGVDdXJzb3IsIGxWaWV3LCB0Tm9kZUN1cnNvci5pbmRleCkpO1xuICAgICAgdE5vZGVDdXJzb3IgPSB0Tm9kZUN1cnNvci5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gZGVidWdOb2RlcztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGREZWJ1Z05vZGUodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyKTogRGVidWdOb2RlIHtcbiAgY29uc3QgcmF3VmFsdWUgPSBsVmlld1tub2RlSW5kZXhdO1xuICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShyYXdWYWx1ZSk7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3RGVidWcgPSB0b0RlYnVnKHJlYWRMVmlld1ZhbHVlKHJhd1ZhbHVlKSk7XG4gIGNvbnN0IHN0eWxlcyA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuc3R5bGVzKSA/XG4gICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5zdHlsZXMgYXMgYW55IGFzIFRTdHlsaW5nQ29udGV4dCwgbFZpZXcsIGZhbHNlKSA6XG4gICAgICBudWxsO1xuICBjb25zdCBjbGFzc2VzID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5jbGFzc2VzKSA/XG4gICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5jbGFzc2VzIGFzIGFueSBhcyBUU3R5bGluZ0NvbnRleHQsIGxWaWV3LCB0cnVlKSA6XG4gICAgICBudWxsO1xuICByZXR1cm4ge1xuICAgIGh0bWw6IHRvSHRtbChuYXRpdmUpLFxuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSwgc3R5bGVzLCBjbGFzc2VzLFxuICAgIG5vZGVzOiB0b0RlYnVnTm9kZXModE5vZGUuY2hpbGQsIGxWaWV3KSxcbiAgICBjb21wb25lbnQ6IGNvbXBvbmVudExWaWV3RGVidWcsXG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBMQ29udGFpbmVyRGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbENvbnRhaW5lcjogTENvbnRhaW5lcikge31cblxuICBnZXQgYWN0aXZlSW5kZXgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0FDVElWRV9JTkRFWF07IH1cbiAgZ2V0IHZpZXdzKCk6IExWaWV3RGVidWdbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyLnNsaWNlKENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKVxuICAgICAgICAubWFwKHRvRGVidWcgYXMobDogTFZpZXcpID0+IExWaWV3RGVidWcpO1xuICB9XG4gIGdldCBwYXJlbnQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW1BBUkVOVF0pOyB9XG4gIGdldCBtb3ZlZFZpZXdzKCk6IExWaWV3W118bnVsbCB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltNT1ZFRF9WSUVXU107IH1cbiAgZ2V0IGhvc3QoKTogUkVsZW1lbnR8UkNvbW1lbnR8TFZpZXcgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbSE9TVF07IH1cbiAgZ2V0IG5hdGl2ZSgpOiBSQ29tbWVudCB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltOQVRJVkVdOyB9XG4gIGdldCBuZXh0KCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbENvbnRhaW5lcltORVhUXSk7IH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYExWaWV3YCB2YWx1ZSBpZiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgYExWaWV3YCBpZiBhbnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRMVmlld1ZhbHVlKHZhbHVlOiBhbnkpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gVGhpcyBjaGVjayBpcyBub3QgcXVpdGUgcmlnaHQsIGFzIGl0IGRvZXMgbm90IHRha2UgaW50byBhY2NvdW50IGBTdHlsaW5nQ29udGV4dGBcbiAgICAvLyBUaGlzIGlzIHdoeSBpdCBpcyBpbiBkZWJ1Zywgbm90IGluIHV0aWwudHNcbiAgICBpZiAodmFsdWUubGVuZ3RoID49IEhFQURFUl9PRkZTRVQgLSAxKSByZXR1cm4gdmFsdWUgYXMgTFZpZXc7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIEkxOE5EZWJ1Z0l0ZW0ge1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG5cbiAgZ2V0IHROb2RlKCkgeyByZXR1cm4gZ2V0VE5vZGUodGhpcy5ub2RlSW5kZXgsIHRoaXMuX2xWaWV3KTsgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIF9fcmF3X29wQ29kZTogYW55LCBwcml2YXRlIF9sVmlldzogTFZpZXcsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlcixcbiAgICAgIHB1YmxpYyB0eXBlOiBzdHJpbmcpIHt9XG59XG5cbi8qKlxuICogVHVybnMgYSBsaXN0IG9mIFwiQ3JlYXRlXCIgJiBcIlVwZGF0ZVwiIE9wQ29kZXMgaW50byBhIGh1bWFuLXJlYWRhYmxlIGxpc3Qgb2Ygb3BlcmF0aW9ucyBmb3JcbiAqIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBtdXRhdGVPcENvZGVzIG11dGF0aW9uIG9wQ29kZXMgdG8gcmVhZFxuICogQHBhcmFtIHVwZGF0ZU9wQ29kZXMgdXBkYXRlIG9wQ29kZXMgdG8gcmVhZFxuICogQHBhcmFtIGljdXMgbGlzdCBvZiBJQ1UgZXhwcmVzc2lvbnNcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0aGUgb3BDb2RlcyBhcmUgYWN0aW5nIG9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hJMThuT3BDb2Rlc0RlYnVnKFxuICAgIG11dGF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCxcbiAgICBsVmlldzogTFZpZXcpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobXV0YXRlT3BDb2RlcywgbmV3IEkxOG5NdXRhdGVPcENvZGVzRGVidWcobXV0YXRlT3BDb2RlcywgbFZpZXcpKTtcbiAgYXR0YWNoRGVidWdPYmplY3QodXBkYXRlT3BDb2RlcywgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcodXBkYXRlT3BDb2RlcywgaWN1cywgbFZpZXcpKTtcblxuICBpZiAoaWN1cykge1xuICAgIGljdXMuZm9yRWFjaChpY3UgPT4ge1xuICAgICAgaWN1LmNyZWF0ZS5mb3JFYWNoKFxuICAgICAgICAgIGljdUNhc2UgPT4geyBhdHRhY2hEZWJ1Z09iamVjdChpY3VDYXNlLCBuZXcgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyhpY3VDYXNlLCBsVmlldykpOyB9KTtcbiAgICAgIGljdS51cGRhdGUuZm9yRWFjaChpY3VDYXNlID0+IHtcbiAgICAgICAgYXR0YWNoRGVidWdPYmplY3QoaWN1Q2FzZSwgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcoaWN1Q2FzZSwgaWN1cywgbFZpZXcpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnIGltcGxlbWVudHMgSTE4bk9wQ29kZXNEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX19yYXdfb3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIHByaXZhdGUgcmVhZG9ubHkgX19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBvcGVyYXRpb24gaW5mb3JtYXRpb24gYWJvdXQgaG93IHRoZSBPcENvZGVzIHdpbGwgYWN0IG9uIHRoZSB2aWV3LlxuICAgKi9cbiAgZ2V0IG9wZXJhdGlvbnMoKSB7XG4gICAgY29uc3Qge19fbFZpZXcsIF9fcmF3X29wQ29kZXN9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBfX3Jhd19vcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvcENvZGUgPSBfX3Jhd19vcENvZGVzW2ldO1xuICAgICAgbGV0IHJlc3VsdDogYW55O1xuICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICB0eXBlOiAnQ3JlYXRlIFRleHQgTm9kZScsXG4gICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgdGV4dDogb3BDb2RlLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBkZXN0aW5hdGlvbk5vZGVJbmRleCwgJ0FwcGVuZENoaWxkJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnU2VsZWN0Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZDpcbiAgICAgICAgICAgIGxldCBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBlbGVtZW50SW5kZXgsICdFbGVtZW50RW5kJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgIGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGVsZW1lbnRJbmRleCwgJ0F0dHInKTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0ck5hbWUnXSA9IF9fcmF3X29wQ29kZXNbKytpXTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0clZhbHVlJ10gPSBfX3Jhd19vcENvZGVzWysraV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICBzd2l0Y2ggKG9wQ29kZSkge1xuICAgICAgICAgIGNhc2UgQ09NTUVOVF9NQVJLRVI6XG4gICAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICB0eXBlOiAnQ09NTUVOVF9NQVJLRVInLFxuICAgICAgICAgICAgICBjb21tZW50VmFsdWU6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgIHR5cGU6ICdFTEVNRU5UX01BUktFUicsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgIHR5cGU6ICdVbmtub3duIE9wIENvZGUnLFxuICAgICAgICAgIGNvZGU6IG9wQ29kZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEkxOG5VcGRhdGVPcENvZGVzRGVidWcgaW1wbGVtZW50cyBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9fcmF3X29wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBwcml2YXRlIHJlYWRvbmx5IGljdXM6IFRJY3VbXXxudWxsLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfX2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogQSBsaXN0IG9mIG9wZXJhdGlvbiBpbmZvcm1hdGlvbiBhYm91dCBob3cgdGhlIE9wQ29kZXMgd2lsbCBhY3Qgb24gdGhlIHZpZXcuXG4gICAqL1xuICBnZXQgb3BlcmF0aW9ucygpIHtcbiAgICBjb25zdCB7X19sVmlldywgX19yYXdfb3BDb2RlcywgaWN1c30gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9fcmF3X29wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICAgIGNvbnN0IGNoZWNrQml0ID0gX19yYXdfb3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgICAgY29uc3Qgc2tpcENvZGVzID0gX19yYXdfb3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IF9fcmF3X29wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlICs9IG9wQ29kZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKG9wQ29kZSA8IDApIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBiaW5kaW5nIGluZGV4IHdob3NlIHZhbHVlIGlzIG5lZ2F0aXZlXG4gICAgICAgICAgICAvLyBXZSBjYW5ub3Qga25vdyB0aGUgdmFsdWUgb2YgdGhlIGJpbmRpbmcgc28gd2Ugb25seSBzaG93IHRoZSBpbmRleFxuICAgICAgICAgICAgdmFsdWUgKz0gYO+/vSR7LW9wQ29kZSAtIDF977+9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIGxldCB0SWN1SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCB0SWN1OiBUSWN1O1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gX19yYXdfb3BDb2Rlc1srK2pdO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ0F0dHInLFxuICAgICAgICAgICAgICAgICAgYXR0clZhbHVlOiB2YWx1ZSwgYXR0ck5hbWUsIHNhbml0aXplRm4sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ1RleHQnLCBub2RlSW5kZXgsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiB2YWx1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaDpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdJY3VTd2l0Y2gnKTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3VJbmRleCddID0gdEljdUluZGV4O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnY2hlY2tCaXQnXSA9IGNoZWNrQml0O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnbWFpbkJpbmRpbmcnXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdSddID0gdEljdTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ0ljdVVwZGF0ZScpO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdUluZGV4J10gPSB0SWN1SW5kZXg7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydjaGVja0JpdCddID0gY2hlY2tCaXQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1J10gPSB0SWN1O1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaSArPSBza2lwQ29kZXM7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSTE4bk9wQ29kZXNEZWJ1ZyB7IG9wZXJhdGlvbnM6IGFueVtdOyB9XG4iXX0=