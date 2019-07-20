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
import { assertDefined } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET, MOVED_VIEWS, NATIVE } from '../interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from '../interfaces/i18n';
import { BINDING_INDEX, CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { NodeStylingDebug } from '../styling_next/styling_debug';
import { isStylingContext } from '../styling_next/util';
import { attachDebugObject } from '../util/debug_utils';
import { getTNode, unwrapRNode } from '../util/view_utils';
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
export const LViewArray = ngDevMode && createNamedArrayType('LView');
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
        LVIEW_EMPTY = new (/** @type {?} */ (LViewArray))();
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
    schemas) {
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
     * @param {?} propertyMetadataStartIndex
     * @param {?} propertyMetadataEndIndex
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
     * @param {?} stylingTemplate
     * @param {?} projection
     * @param {?} onElementCreationFns
     * @param {?} styles
     * @param {?} classes
     */
    constructor(tView_, //
    type, //
    index, //
    injectorIndex, //
    directiveStart, //
    directiveEnd, //
    propertyMetadataStartIndex, //
    propertyMetadataEndIndex, //
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
    stylingTemplate, //
    projection, //
    onElementCreationFns, //
    styles, //
    classes) {
        this.tView_ = tView_;
        this.type = type;
        this.index = index;
        this.injectorIndex = injectorIndex;
        this.directiveStart = directiveStart;
        this.directiveEnd = directiveEnd;
        this.propertyMetadataStartIndex = propertyMetadataStartIndex;
        this.propertyMetadataEndIndex = propertyMetadataEndIndex;
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
        this.stylingTemplate = stylingTemplate;
        this.projection = projection;
        this.onElementCreationFns = onElementCreationFns;
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
        if (this.flags & 8 /* hasClassInput */)
            flags.push('TNodeFlags.hasClassInput');
        if (this.flags & 4 /* hasContentQuery */)
            flags.push('TNodeFlags.hasContentQuery');
        if (this.flags & 16 /* hasStyleInput */)
            flags.push('TNodeFlags.hasStyleInput');
        if (this.flags & 1 /* isComponent */)
            flags.push('TNodeFlags.isComponent');
        if (this.flags & 32 /* isDetached */)
            flags.push('TNodeFlags.isDetached');
        if (this.flags & 2 /* isProjected */)
            flags.push('TNodeFlags.isProjected');
        return flags.join('|');
    }
};
/** @type {?} */
const TViewData = ngDevMode && createNamedArrayType('TViewData');
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
        TVIEWDATA_EMPTY = new (/** @type {?} */ (TViewData))();
    return (/** @type {?} */ (TVIEWDATA_EMPTY.concat(list)));
}
/** @type {?} */
export const LViewBlueprint = ngDevMode && createNamedArrayType('LViewBlueprint');
/** @type {?} */
export const MatchesArray = ngDevMode && createNamedArrayType('MatchesArray');
/** @type {?} */
export const TViewComponents = ngDevMode && createNamedArrayType('TViewComponents');
/** @type {?} */
export const TNodeLocalNames = ngDevMode && createNamedArrayType('TNodeLocalNames');
/** @type {?} */
export const TNodeInitialInputs = ngDevMode && createNamedArrayType('TNodeInitialInputs');
/** @type {?} */
export const TNodeInitialData = ngDevMode && createNamedArrayType('TNodeInitialData');
/** @type {?} */
export const LCleanup = ngDevMode && createNamedArrayType('LCleanup');
/** @type {?} */
export const TCleanup = ngDevMode && createNamedArrayType('TCleanup');
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
            const innerHTML = node.innerHTML;
            return outerHTML.split(innerHTML)[0] || null;
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
     * Additional information which is hidden behind a property. The extra level of indirection is
     * done so that the debug view would not be cluttered with properties which are only rarely
     * relevant to the developer.
     * @return {?}
     */
    get __other__() {
        return {
            tView: this._raw_lView[TVIEW],
            cleanup: this._raw_lView[CLEANUP],
            injector: this._raw_lView[INJECTOR],
            rendererFactory: this._raw_lView[RENDERER_FACTORY],
            renderer: this._raw_lView[RENDERER],
            sanitizer: this._raw_lView[SANITIZER],
            childHead: toDebug(this._raw_lView[CHILD_HEAD]),
            next: toDebug(this._raw_lView[NEXT]),
            childTail: toDebug(this._raw_lView[CHILD_TAIL]),
            declarationView: toDebug(this._raw_lView[DECLARATION_VIEW]),
            queries: null,
            tHost: this._raw_lView[T_HOST],
            bindingIndex: this._raw_lView[BINDING_INDEX],
        };
    }
    /**
     * Normalized view of child views (and containers) attached at this location.
     * @return {?}
     */
    get childViews() {
        /** @type {?} */
        const childViews = [];
        /** @type {?} */
        let child = this.__other__.childHead;
        while (child) {
            childViews.push(child);
            child = child.__other__.next;
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
            /** @type {?} */
            const rawValue = lView[tNode.index];
            /** @type {?} */
            const native = unwrapRNode(rawValue);
            /** @type {?} */
            const componentLViewDebug = toDebug(readLViewValue(rawValue));
            /** @type {?} */
            const styles = isStylingContext(tNode.styles) ?
                new NodeStylingDebug((/** @type {?} */ ((/** @type {?} */ (tNode.styles)))), lView) :
                null;
            /** @type {?} */
            const classes = isStylingContext(tNode.classes) ?
                new NodeStylingDebug((/** @type {?} */ ((/** @type {?} */ (tNode.classes)))), lView, true) :
                null;
            debugNodes.push({
                html: toHtml(native),
                native: (/** @type {?} */ (native)), styles, classes,
                nodes: toDebugNodes(tNode.child, lView),
                component: componentLViewDebug,
            });
            tNodeCursor = tNodeCursor.next;
        }
        return debugNodes;
    }
    else {
        return null;
    }
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
    get __other__() {
        return {
            next: toDebug(this._raw_lContainer[NEXT]),
        };
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFjLFdBQVcsRUFBRSxNQUFNLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUUvRyxPQUFPLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBaUYsTUFBTSxvQkFBb0IsQ0FBQztBQU9sSixPQUFPLEVBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBdUIsS0FBSyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQVksUUFBUSxFQUFxQixJQUFJLEVBQUUsTUFBTSxFQUFXLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQVMsS0FBSyxFQUEwQixNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVqVCxPQUFPLEVBQWtDLGdCQUFnQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDaEcsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUN6RCxNQUFNLE9BQU8sVUFBVSxHQUFHLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7O0lBQ2hFLFdBQXNCOzs7Ozs7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QixDQUFDO0NBQ0Y7Ozs7OztJQTNFSywrQ0FBaUQ7Ozs7O0lBQUUsc0NBQWtDOzs7OztJQUNyRix5Q0FBK0I7Ozs7O0FBNEVyQyxzQ0FBd0Q7OztJQUFwQixzQ0FBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBDb21wb25lbnRUZW1wbGF0ZX0gZnJvbSAnLi4nO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vY29yZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTLCBOQVRJVkV9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3QsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTU1FTlRfTUFSS0VSLCBFTEVNRU5UX01BUktFUiwgSTE4bk11dGF0ZU9wQ29kZSwgSTE4bk11dGF0ZU9wQ29kZXMsIEkxOG5VcGRhdGVPcENvZGUsIEkxOG5VcGRhdGVPcENvZGVzLCBUSWN1fSBmcm9tICcuLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzZXMsIFRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlIGFzIElUTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2VsZWN0b3JGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7VFF1ZXJpZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5cbmltcG9ydCB7QklORElOR19JTkRFWCwgQ0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRXhwYW5kb0luc3RydWN0aW9ucywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEhvb2tEYXRhLCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFNBTklUSVpFUiwgVERhdGEsIFRWSUVXLCBUVmlldyBhcyBJVFZpZXcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1RTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L2ludGVyZmFjZXMnO1xuaW1wb3J0IHtEZWJ1Z1N0eWxpbmcgYXMgRGVidWdOZXdTdHlsaW5nLCBOb2RlU3R5bGluZ0RlYnVnfSBmcm9tICcuLi9zdHlsaW5nX25leHQvc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC91dGlsJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuaW1wb3J0IHtnZXRUTm9kZSwgdW53cmFwUk5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cblxuLypcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjb25kaXRpb25hbGx5IGF0dGFjaGVkIGNsYXNzZXMgd2hpY2ggcHJvdmlkZSBodW1hbiByZWFkYWJsZSAoZGVidWcpIGxldmVsXG4gKiBpbmZvcm1hdGlvbiBmb3IgYExWaWV3YCwgYExDb250YWluZXJgIGFuZCBvdGhlciBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMuIFRoZXNlIGRhdGEgc3RydWN0dXJlc1xuICogYXJlIHN0b3JlZCBpbnRlcm5hbGx5IGFzIGFycmF5IHdoaWNoIG1ha2VzIGl0IHZlcnkgZGlmZmljdWx0IGR1cmluZyBkZWJ1Z2dpbmcgdG8gcmVhc29uIGFib3V0IHRoZVxuICogY3VycmVudCBzdGF0ZSBvZiB0aGUgc3lzdGVtLlxuICpcbiAqIFBhdGNoaW5nIHRoZSBhcnJheSB3aXRoIGV4dHJhIHByb3BlcnR5IGRvZXMgY2hhbmdlIHRoZSBhcnJheSdzIGhpZGRlbiBjbGFzcycgYnV0IGl0IGRvZXMgbm90XG4gKiBjaGFuZ2UgdGhlIGNvc3Qgb2YgYWNjZXNzLCB0aGVyZWZvcmUgdGhpcyBwYXRjaGluZyBzaG91bGQgbm90IGhhdmUgc2lnbmlmaWNhbnQgaWYgYW55IGltcGFjdCBpblxuICogYG5nRGV2TW9kZWAgbW9kZS4gKHNlZTogaHR0cHM6Ly9qc3BlcmYuY29tL2FycmF5LXZzLW1vbmtleS1wYXRjaC1hcnJheSlcbiAqXG4gKiBTbyBpbnN0ZWFkIG9mIHNlZWluZzpcbiAqIGBgYFxuICogQXJyYXkoMzApIFtPYmplY3QsIDY1OSwgbnVsbCwg4oCmXVxuICogYGBgXG4gKlxuICogWW91IGdldCB0byBzZWU6XG4gKiBgYGBcbiAqIExWaWV3RGVidWcge1xuICogICB2aWV3czogWy4uLl0sXG4gKiAgIGZsYWdzOiB7YXR0YWNoZWQ6IHRydWUsIC4uLn1cbiAqICAgbm9kZXM6IFtcbiAqICAgICB7aHRtbDogJzxkaXYgaWQ9XCIxMjNcIj4nLCAuLi4sIG5vZGVzOiBbXG4gKiAgICAgICB7aHRtbDogJzxzcGFuPicsIC4uLiwgbm9kZXM6IG51bGx9XG4gKiAgICAgXX1cbiAqICAgXVxuICogfVxuICogYGBgXG4gKi9cblxuXG5leHBvcnQgY29uc3QgTFZpZXdBcnJheSA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFZpZXcnKTtcbmxldCBMVklFV19FTVBUWTogdW5rbm93bltdOyAgLy8gY2FuJ3QgaW5pdGlhbGl6ZSBoZXJlIG9yIGl0IHdpbGwgbm90IGJlIHRyZWUgc2hha2VuLCBiZWNhdXNlIGBMVmlld2BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc3RydWN0b3IgY291bGQgaGF2ZSBzaWRlLWVmZmVjdHMuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY2xvbmVzIGEgYmx1ZXByaW50IGFuZCBjcmVhdGVzIExWaWV3LlxuICpcbiAqIFNpbXBsZSBzbGljZSB3aWxsIGtlZXAgdGhlIHNhbWUgdHlwZSwgYW5kIHdlIG5lZWQgaXQgdG8gYmUgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lVG9MVmlldyhsaXN0OiBhbnlbXSk6IExWaWV3IHtcbiAgaWYgKExWSUVXX0VNUFRZID09PSB1bmRlZmluZWQpIExWSUVXX0VNUFRZID0gbmV3IExWaWV3QXJyYXkgISgpO1xuICByZXR1cm4gTFZJRVdfRU1QVFkuY29uY2F0KGxpc3QpIGFzIGFueTtcbn1cblxuLyoqXG4gKiBUaGlzIGNsYXNzIGlzIGEgZGVidWcgdmVyc2lvbiBvZiBPYmplY3QgbGl0ZXJhbCBzbyB0aGF0IHdlIGNhbiBoYXZlIGNvbnN0cnVjdG9yIG5hbWUgc2hvdyB1cCBpblxuICogZGVidWcgdG9vbHMgaW4gbmdEZXZNb2RlLlxuICovXG5leHBvcnQgY29uc3QgVFZpZXdDb25zdHJ1Y3RvciA9IGNsYXNzIFRWaWV3IGltcGxlbWVudHMgSVRWaWV3IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaWQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBibHVlcHJpbnQ6IExWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCwgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcXVlcmllczogVFF1ZXJpZXN8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+fG51bGwsICAgICAgICAvL1xuICAgICAgcHVibGljIG5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbCwgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGF0YTogVERhdGEsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZXhwYW5kb0luc3RydWN0aW9uczogRXhwYW5kb0luc3RydWN0aW9uc3xudWxsLCAgLy9cbiAgICAgIHB1YmxpYyBmaXJzdFRlbXBsYXRlUGFzczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0YXRpY1ZpZXdRdWVyaWVzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3RhdGljQ29udGVudFF1ZXJpZXM6IGJvb2xlYW4sICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcmVPcmRlckhvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29udGVudEhvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsZWFudXA6IGFueVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29udGVudFF1ZXJpZXM6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGwsICAgICAgIC8vXG4gICAgICBwdWJsaWMgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsLCAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCwgICAgICAgICAgICAgICAgIC8vXG4gICAgICApIHt9XG59O1xuXG5leHBvcnQgY29uc3QgVE5vZGVDb25zdHJ1Y3RvciA9IGNsYXNzIFROb2RlIGltcGxlbWVudHMgSVROb2RlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgdFZpZXdfOiBUVmlldywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0eXBlOiBUTm9kZVR5cGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5qZWN0b3JJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVTdGFydDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZUVuZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9wZXJ0eU1ldGFkYXRhRW5kSW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZsYWdzOiBUTm9kZUZsYWdzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlcywgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbCwgIC8vXG4gICAgICBwdWJsaWMgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbml0aWFsSW5wdXRzOiAoc3RyaW5nW118bnVsbClbXXxudWxsfHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIG5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjaGlsZDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3R5bGluZ1RlbXBsYXRlOiBTdHlsaW5nQ29udGV4dHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uOiBudW1iZXJ8KElUTm9kZXxSTm9kZVtdKVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIG9uRWxlbWVudENyZWF0aW9uRm5zOiBGdW5jdGlvbltdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3R5bGVzOiBUU3R5bGluZ0NvbnRleHR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGFzc2VzOiBUU3R5bGluZ0NvbnRleHR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgKSB7fVxuXG4gIGdldCB0eXBlXygpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICBjYXNlIFROb2RlVHlwZS5Db250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkNvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5FbGVtZW50JztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5JY3VDb250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuUHJvamVjdGlvbjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuUHJvamVjdGlvbic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5WaWV3OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5WaWV3JztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLj8/Pyc7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZsYWdzXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZsYWdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeScpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNDb21wb25lbnQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNEZXRhY2hlZCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RldGFjaGVkJyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzUHJvamVjdGVkJyk7XG4gICAgcmV0dXJuIGZsYWdzLmpvaW4oJ3wnKTtcbiAgfVxufTtcblxuY29uc3QgVFZpZXdEYXRhID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUVmlld0RhdGEnKTtcbmxldCBUVklFV0RBVEFfRU1QVFk6XG4gICAgdW5rbm93bltdOyAgLy8gY2FuJ3QgaW5pdGlhbGl6ZSBoZXJlIG9yIGl0IHdpbGwgbm90IGJlIHRyZWUgc2hha2VuLCBiZWNhdXNlIGBMVmlld2BcbiAgICAgICAgICAgICAgICAvLyBjb25zdHJ1Y3RvciBjb3VsZCBoYXZlIHNpZGUtZWZmZWN0cy5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgVERhdGEuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBURGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb1RWaWV3RGF0YShsaXN0OiBhbnlbXSk6IFREYXRhIHtcbiAgaWYgKFRWSUVXREFUQV9FTVBUWSA9PT0gdW5kZWZpbmVkKSBUVklFV0RBVEFfRU1QVFkgPSBuZXcgVFZpZXdEYXRhICEoKTtcbiAgcmV0dXJuIFRWSUVXREFUQV9FTVBUWS5jb25jYXQobGlzdCkgYXMgYW55O1xufVxuXG5leHBvcnQgY29uc3QgTFZpZXdCbHVlcHJpbnQgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xWaWV3Qmx1ZXByaW50Jyk7XG5leHBvcnQgY29uc3QgTWF0Y2hlc0FycmF5ID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdNYXRjaGVzQXJyYXknKTtcbmV4cG9ydCBjb25zdCBUVmlld0NvbXBvbmVudHMgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3Q29tcG9uZW50cycpO1xuZXhwb3J0IGNvbnN0IFROb2RlTG9jYWxOYW1lcyA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVE5vZGVMb2NhbE5hbWVzJyk7XG5leHBvcnQgY29uc3QgVE5vZGVJbml0aWFsSW5wdXRzID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxJbnB1dHMnKTtcbmV4cG9ydCBjb25zdCBUTm9kZUluaXRpYWxEYXRhID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxEYXRhJyk7XG5leHBvcnQgY29uc3QgTENsZWFudXAgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDbGVhbnVwJyk7XG5leHBvcnQgY29uc3QgVENsZWFudXAgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RDbGVhbnVwJyk7XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoTFZpZXdEZWJ1ZyhsVmlldzogTFZpZXcpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobFZpZXcsIG5ldyBMVmlld0RlYnVnKGxWaWV3KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsQ29udGFpbmVyLCBuZXcgTENvbnRhaW5lckRlYnVnKGxDb250YWluZXIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyk6IExWaWV3RGVidWc7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3IHwgbnVsbCk6IExWaWV3RGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcgfCBMQ29udGFpbmVyIHwgbnVsbCk6IExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IGFueSk6IGFueSB7XG4gIGlmIChvYmopIHtcbiAgICBjb25zdCBkZWJ1ZyA9IChvYmogYXMgYW55KS5kZWJ1ZztcbiAgICBhc3NlcnREZWZpbmVkKGRlYnVnLCAnT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBkZWJ1ZyByZXByZXNlbnRhdGlvbi4nKTtcbiAgICByZXR1cm4gZGVidWc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxufVxuXG4vKipcbiAqIFVzZSB0aGlzIG1ldGhvZCB0byB1bndyYXAgYSBuYXRpdmUgZWxlbWVudCBpbiBgTFZpZXdgIGFuZCBjb252ZXJ0IGl0IGludG8gSFRNTCBmb3IgZWFzaWVyXG4gKiByZWFkaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBwb3NzaWJseSB3cmFwcGVkIG5hdGl2ZSBET00gbm9kZS5cbiAqIEBwYXJhbSBpbmNsdWRlQ2hpbGRyZW4gSWYgYHRydWVgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgaW5jbHVkZSBjaGlsZCBlbGVtZW50cyAoc2FtZVxuICogYXMgYG91dGVySFRNTGApLiBJZiBgZmFsc2VgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgb25seSBjb250YWluIHRoZSBlbGVtZW50IGl0c2VsZlxuICogKHdpbGwgbm90IHNlcmlhbGl6ZSBjaGlsZCBlbGVtZW50cykuXG4gKi9cbmZ1bmN0aW9uIHRvSHRtbCh2YWx1ZTogYW55LCBpbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3Qgbm9kZTogSFRNTEVsZW1lbnR8bnVsbCA9IHVud3JhcFJOb2RlKHZhbHVlKSBhcyBhbnk7XG4gIGlmIChub2RlKSB7XG4gICAgY29uc3QgaXNUZXh0Tm9kZSA9IG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFO1xuICAgIGNvbnN0IG91dGVySFRNTCA9IChpc1RleHROb2RlID8gbm9kZS50ZXh0Q29udGVudCA6IG5vZGUub3V0ZXJIVE1MKSB8fCAnJztcbiAgICBpZiAoaW5jbHVkZUNoaWxkcmVuIHx8IGlzVGV4dE5vZGUpIHtcbiAgICAgIHJldHVybiBvdXRlckhUTUw7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlubmVySFRNTCA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgcmV0dXJuIG91dGVySFRNTC5zcGxpdChpbm5lckhUTUwpWzBdIHx8IG51bGw7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMVmlld0RlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfcmF3X2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogRmxhZ3MgYXNzb2NpYXRlZCB3aXRoIHRoZSBgTFZpZXdgIHVucGFja2VkIGludG8gYSBtb3JlIHJlYWRhYmxlIHN0YXRlLlxuICAgKi9cbiAgZ2V0IGZsYWdzKCkge1xuICAgIGNvbnN0IGZsYWdzID0gdGhpcy5fcmF3X2xWaWV3W0ZMQUdTXTtcbiAgICByZXR1cm4ge1xuICAgICAgX19yYXdfX2ZsYWdzX186IGZsYWdzLFxuICAgICAgaW5pdFBoYXNlU3RhdGU6IGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2ssXG4gICAgICBjcmVhdGlvbk1vZGU6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpLFxuICAgICAgZmlyc3RWaWV3UGFzczogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSxcbiAgICAgIGNoZWNrQWx3YXlzOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpLFxuICAgICAgZGlydHk6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EaXJ0eSksXG4gICAgICBhdHRhY2hlZDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSxcbiAgICAgIGRlc3Ryb3llZDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCksXG4gICAgICBpc1Jvb3Q6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5Jc1Jvb3QpLFxuICAgICAgaW5kZXhXaXRoaW5Jbml0UGhhc2U6IGZsYWdzID4+IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VTaGlmdCxcbiAgICB9O1xuICB9XG4gIGdldCBwYXJlbnQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tQQVJFTlRdKTsgfVxuICBnZXQgaG9zdCgpOiBzdHJpbmd8bnVsbCB7IHJldHVybiB0b0h0bWwodGhpcy5fcmF3X2xWaWV3W0hPU1RdLCB0cnVlKTsgfVxuICBnZXQgY29udGV4dCgpOiB7fXxudWxsIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tDT05URVhUXTsgfVxuICAvKipcbiAgICogVGhlIHRyZWUgb2Ygbm9kZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGBMVmlld2AuIFRoZSBub2RlcyBoYXZlIGJlZW4gbm9ybWFsaXplZCBpbnRvIGFcbiAgICogdHJlZSBzdHJ1Y3R1cmUgd2l0aCByZWxldmFudCBkZXRhaWxzIHB1bGxlZCBvdXQgZm9yIHJlYWRhYmlsaXR5LlxuICAgKi9cbiAgZ2V0IG5vZGVzKCk6IERlYnVnTm9kZVtdfG51bGwge1xuICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fcmF3X2xWaWV3O1xuICAgIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgcmV0dXJuIHRvRGVidWdOb2Rlcyh0Tm9kZSwgbFZpZXcpO1xuICB9XG4gIC8qKlxuICAgKiBBZGRpdGlvbmFsIGluZm9ybWF0aW9uIHdoaWNoIGlzIGhpZGRlbiBiZWhpbmQgYSBwcm9wZXJ0eS4gVGhlIGV4dHJhIGxldmVsIG9mIGluZGlyZWN0aW9uIGlzXG4gICAqIGRvbmUgc28gdGhhdCB0aGUgZGVidWcgdmlldyB3b3VsZCBub3QgYmUgY2x1dHRlcmVkIHdpdGggcHJvcGVydGllcyB3aGljaCBhcmUgb25seSByYXJlbHlcbiAgICogcmVsZXZhbnQgdG8gdGhlIGRldmVsb3Blci5cbiAgICovXG4gIGdldCBfX290aGVyX18oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRWaWV3OiB0aGlzLl9yYXdfbFZpZXdbVFZJRVddLFxuICAgICAgY2xlYW51cDogdGhpcy5fcmF3X2xWaWV3W0NMRUFOVVBdLFxuICAgICAgaW5qZWN0b3I6IHRoaXMuX3Jhd19sVmlld1tJTkpFQ1RPUl0sXG4gICAgICByZW5kZXJlckZhY3Rvcnk6IHRoaXMuX3Jhd19sVmlld1tSRU5ERVJFUl9GQUNUT1JZXSxcbiAgICAgIHJlbmRlcmVyOiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJdLFxuICAgICAgc2FuaXRpemVyOiB0aGlzLl9yYXdfbFZpZXdbU0FOSVRJWkVSXSxcbiAgICAgIGNoaWxkSGVhZDogdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbQ0hJTERfSEVBRF0pLFxuICAgICAgbmV4dDogdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbTkVYVF0pLFxuICAgICAgY2hpbGRUYWlsOiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tDSElMRF9UQUlMXSksXG4gICAgICBkZWNsYXJhdGlvblZpZXc6IHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddKSxcbiAgICAgIHF1ZXJpZXM6IG51bGwsXG4gICAgICB0SG9zdDogdGhpcy5fcmF3X2xWaWV3W1RfSE9TVF0sXG4gICAgICBiaW5kaW5nSW5kZXg6IHRoaXMuX3Jhd19sVmlld1tCSU5ESU5HX0lOREVYXSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZWQgdmlldyBvZiBjaGlsZCB2aWV3cyAoYW5kIGNvbnRhaW5lcnMpIGF0dGFjaGVkIGF0IHRoaXMgbG9jYXRpb24uXG4gICAqL1xuICBnZXQgY2hpbGRWaWV3cygpOiBBcnJheTxMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Zz4ge1xuICAgIGNvbnN0IGNoaWxkVmlld3M6IEFycmF5PExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnPiA9IFtdO1xuICAgIGxldCBjaGlsZCA9IHRoaXMuX19vdGhlcl9fLmNoaWxkSGVhZDtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIGNoaWxkVmlld3MucHVzaChjaGlsZCk7XG4gICAgICBjaGlsZCA9IGNoaWxkLl9fb3RoZXJfXy5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRWaWV3cztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIGh0bWw6IHN0cmluZ3xudWxsO1xuICBuYXRpdmU6IE5vZGU7XG4gIHN0eWxlczogRGVidWdOZXdTdHlsaW5nfG51bGw7XG4gIGNsYXNzZXM6IERlYnVnTmV3U3R5bGluZ3xudWxsO1xuICBub2RlczogRGVidWdOb2RlW118bnVsbDtcbiAgY29tcG9uZW50OiBMVmlld0RlYnVnfG51bGw7XG59XG5cbi8qKlxuICogVHVybnMgYSBmbGF0IGxpc3Qgb2Ygbm9kZXMgaW50byBhIHRyZWUgYnkgd2Fsa2luZyB0aGUgYXNzb2NpYXRlZCBgVE5vZGVgIHRyZWUuXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWdOb2Rlcyh0Tm9kZTogVE5vZGUgfCBudWxsLCBsVmlldzogTFZpZXcpOiBEZWJ1Z05vZGVbXXxudWxsIHtcbiAgaWYgKHROb2RlKSB7XG4gICAgY29uc3QgZGVidWdOb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBsZXQgdE5vZGVDdXJzb3I6IFROb2RlfG51bGwgPSB0Tm9kZTtcbiAgICB3aGlsZSAodE5vZGVDdXJzb3IpIHtcbiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgICAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUocmF3VmFsdWUpO1xuICAgICAgY29uc3QgY29tcG9uZW50TFZpZXdEZWJ1ZyA9IHRvRGVidWcocmVhZExWaWV3VmFsdWUocmF3VmFsdWUpKTtcblxuICAgICAgY29uc3Qgc3R5bGVzID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5zdHlsZXMpID9cbiAgICAgICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5zdHlsZXMgYXMgYW55IGFzIFRTdHlsaW5nQ29udGV4dCwgbFZpZXcpIDpcbiAgICAgICAgICBudWxsO1xuICAgICAgY29uc3QgY2xhc3NlcyA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuY2xhc3NlcykgP1xuICAgICAgICAgIG5ldyBOb2RlU3R5bGluZ0RlYnVnKHROb2RlLmNsYXNzZXMgYXMgYW55IGFzIFRTdHlsaW5nQ29udGV4dCwgbFZpZXcsIHRydWUpIDpcbiAgICAgICAgICBudWxsO1xuICAgICAgZGVidWdOb2Rlcy5wdXNoKHtcbiAgICAgICAgaHRtbDogdG9IdG1sKG5hdGl2ZSksXG4gICAgICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSwgc3R5bGVzLCBjbGFzc2VzLFxuICAgICAgICBub2RlczogdG9EZWJ1Z05vZGVzKHROb2RlLmNoaWxkLCBsVmlldyksXG4gICAgICAgIGNvbXBvbmVudDogY29tcG9uZW50TFZpZXdEZWJ1ZyxcbiAgICAgIH0pO1xuICAgICAgdE5vZGVDdXJzb3IgPSB0Tm9kZUN1cnNvci5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gZGVidWdOb2RlcztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTENvbnRhaW5lckRlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfcmF3X2xDb250YWluZXI6IExDb250YWluZXIpIHt9XG5cbiAgZ2V0IGFjdGl2ZUluZGV4KCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdOyB9XG4gIGdldCB2aWV3cygpOiBMVmlld0RlYnVnW10ge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lci5zbGljZShDT05UQUlORVJfSEVBREVSX09GRlNFVClcbiAgICAgICAgLm1hcCh0b0RlYnVnIGFzKGw6IExWaWV3KSA9PiBMVmlld0RlYnVnKTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnfG51bGwgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbENvbnRhaW5lcltQQVJFTlRdKTsgfVxuICBnZXQgbW92ZWRWaWV3cygpOiBMVmlld1tdfG51bGwgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbTU9WRURfVklFV1NdOyB9XG4gIGdldCBob3N0KCk6IFJFbGVtZW50fFJDb21tZW50fFN0eWxpbmdDb250ZXh0fExWaWV3IHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0hPU1RdOyB9XG4gIGdldCBuYXRpdmUoKTogUkNvbW1lbnQgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbTkFUSVZFXTsgfVxuICBnZXQgX19vdGhlcl9fKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuZXh0OiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW05FWFRdKSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGBMVmlld2AgdmFsdWUgaWYgZm91bmQuXG4gKlxuICogQHBhcmFtIHZhbHVlIGBMVmlld2AgaWYgYW55XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkTFZpZXdWYWx1ZSh2YWx1ZTogYW55KTogTFZpZXd8bnVsbCB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFRoaXMgY2hlY2sgaXMgbm90IHF1aXRlIHJpZ2h0LCBhcyBpdCBkb2VzIG5vdCB0YWtlIGludG8gYWNjb3VudCBgU3R5bGluZ0NvbnRleHRgXG4gICAgLy8gVGhpcyBpcyB3aHkgaXQgaXMgaW4gZGVidWcsIG5vdCBpbiB1dGlsLnRzXG4gICAgaWYgKHZhbHVlLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUIC0gMSkgcmV0dXJuIHZhbHVlIGFzIExWaWV3O1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBJMThORGVidWdJdGVtIHtcbiAgW2tleTogc3RyaW5nXTogYW55O1xuXG4gIGdldCB0Tm9kZSgpIHsgcmV0dXJuIGdldFROb2RlKHRoaXMubm9kZUluZGV4LCB0aGlzLl9sVmlldyk7IH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBfX3Jhd19vcENvZGU6IGFueSwgcHJpdmF0ZSBfbFZpZXc6IExWaWV3LCBwdWJsaWMgbm9kZUluZGV4OiBudW1iZXIsXG4gICAgICBwdWJsaWMgdHlwZTogc3RyaW5nKSB7fVxufVxuXG4vKipcbiAqIFR1cm5zIGEgbGlzdCBvZiBcIkNyZWF0ZVwiICYgXCJVcGRhdGVcIiBPcENvZGVzIGludG8gYSBodW1hbi1yZWFkYWJsZSBsaXN0IG9mIG9wZXJhdGlvbnMgZm9yXG4gKiBkZWJ1Z2dpbmcgcHVycG9zZXMuXG4gKiBAcGFyYW0gbXV0YXRlT3BDb2RlcyBtdXRhdGlvbiBvcENvZGVzIHRvIHJlYWRcbiAqIEBwYXJhbSB1cGRhdGVPcENvZGVzIHVwZGF0ZSBvcENvZGVzIHRvIHJlYWRcbiAqIEBwYXJhbSBpY3VzIGxpc3Qgb2YgSUNVIGV4cHJlc3Npb25zXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdGhlIG9wQ29kZXMgYXJlIGFjdGluZyBvblxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoSTE4bk9wQ29kZXNEZWJ1ZyhcbiAgICBtdXRhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXSB8IG51bGwsXG4gICAgbFZpZXc6IExWaWV3KSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KG11dGF0ZU9wQ29kZXMsIG5ldyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnKG11dGF0ZU9wQ29kZXMsIGxWaWV3KSk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KHVwZGF0ZU9wQ29kZXMsIG5ldyBJMThuVXBkYXRlT3BDb2Rlc0RlYnVnKHVwZGF0ZU9wQ29kZXMsIGljdXMsIGxWaWV3KSk7XG5cbiAgaWYgKGljdXMpIHtcbiAgICBpY3VzLmZvckVhY2goaWN1ID0+IHtcbiAgICAgIGljdS5jcmVhdGUuZm9yRWFjaChcbiAgICAgICAgICBpY3VDYXNlID0+IHsgYXR0YWNoRGVidWdPYmplY3QoaWN1Q2FzZSwgbmV3IEkxOG5NdXRhdGVPcENvZGVzRGVidWcoaWN1Q2FzZSwgbFZpZXcpKTsgfSk7XG4gICAgICBpY3UudXBkYXRlLmZvckVhY2goaWN1Q2FzZSA9PiB7XG4gICAgICAgIGF0dGFjaERlYnVnT2JqZWN0KGljdUNhc2UsIG5ldyBJMThuVXBkYXRlT3BDb2Rlc0RlYnVnKGljdUNhc2UsIGljdXMsIGxWaWV3KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyBpbXBsZW1lbnRzIEkxOG5PcENvZGVzRGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9fcmF3X29wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCBwcml2YXRlIHJlYWRvbmx5IF9fbFZpZXc6IExWaWV3KSB7fVxuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2Ygb3BlcmF0aW9uIGluZm9ybWF0aW9uIGFib3V0IGhvdyB0aGUgT3BDb2RlcyB3aWxsIGFjdCBvbiB0aGUgdmlldy5cbiAgICovXG4gIGdldCBvcGVyYXRpb25zKCkge1xuICAgIGNvbnN0IHtfX2xWaWV3LCBfX3Jhd19vcENvZGVzfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgX19yYXdfb3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgb3BDb2RlID0gX19yYXdfb3BDb2Rlc1tpXTtcbiAgICAgIGxldCByZXN1bHQ6IGFueTtcbiAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgdHlwZTogJ0NyZWF0ZSBUZXh0IE5vZGUnLFxuICAgICAgICAgIG5vZGVJbmRleDogX19yYXdfb3BDb2Rlc1srK2ldLFxuICAgICAgICAgIHRleHQ6IG9wQ29kZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZDpcbiAgICAgICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uTm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVDtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgZGVzdGluYXRpb25Ob2RlSW5kZXgsICdBcHBlbmRDaGlsZCcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdDpcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ1NlbGVjdCcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQ6XG4gICAgICAgICAgICBsZXQgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgZWxlbWVudEluZGV4LCAnRWxlbWVudEVuZCcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgICBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBlbGVtZW50SW5kZXgsICdBdHRyJyk7XG4gICAgICAgICAgICByZXN1bHRbJ2F0dHJOYW1lJ10gPSBfX3Jhd19vcENvZGVzWysraV07XG4gICAgICAgICAgICByZXN1bHRbJ2F0dHJWYWx1ZSddID0gX19yYXdfb3BDb2Rlc1srK2ldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgICAgICBjYXNlIENPTU1FTlRfTUFSS0VSOlxuICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgdHlwZTogJ0NPTU1FTlRfTUFSS0VSJyxcbiAgICAgICAgICAgICAgY29tbWVudFZhbHVlOiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgICAgIG5vZGVJbmRleDogX19yYXdfb3BDb2Rlc1srK2ldLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRUxFTUVOVF9NQVJLRVI6XG4gICAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICB0eXBlOiAnRUxFTUVOVF9NQVJLRVInLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICB0eXBlOiAnVW5rbm93biBPcCBDb2RlJyxcbiAgICAgICAgICBjb2RlOiBvcENvZGUsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJMThuVXBkYXRlT3BDb2Rlc0RlYnVnIGltcGxlbWVudHMgSTE4bk9wQ29kZXNEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfX3Jhd19vcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgcHJpdmF0ZSByZWFkb25seSBpY3VzOiBUSWN1W118bnVsbCxcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBvcGVyYXRpb24gaW5mb3JtYXRpb24gYWJvdXQgaG93IHRoZSBPcENvZGVzIHdpbGwgYWN0IG9uIHRoZSB2aWV3LlxuICAgKi9cbiAgZ2V0IG9wZXJhdGlvbnMoKSB7XG4gICAgY29uc3Qge19fbFZpZXcsIF9fcmF3X29wQ29kZXMsIGljdXN9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBfX3Jhd19vcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBiaXQgY29kZSB0byBjaGVjayBpZiB3ZSBzaG91bGQgYXBwbHkgdGhlIG5leHQgdXBkYXRlXG4gICAgICBjb25zdCBjaGVja0JpdCA9IF9fcmF3X29wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgICAgLy8gTnVtYmVyIG9mIG9wQ29kZXMgdG8gc2tpcCB1bnRpbCBuZXh0IHNldCBvZiB1cGRhdGUgY29kZXNcbiAgICAgIGNvbnN0IHNraXBDb2RlcyA9IF9fcmF3X29wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICBsZXQgdmFsdWUgPSAnJztcbiAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8PSAoaSArIHNraXBDb2Rlcyk7IGorKykge1xuICAgICAgICBjb25zdCBvcENvZGUgPSBfX3Jhd19vcENvZGVzW2pdO1xuICAgICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSArPSBvcENvZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgYmluZGluZyBpbmRleCB3aG9zZSB2YWx1ZSBpcyBuZWdhdGl2ZVxuICAgICAgICAgICAgLy8gV2UgY2Fubm90IGtub3cgdGhlIHZhbHVlIG9mIHRoZSBiaW5kaW5nIHNvIHdlIG9ubHkgc2hvdyB0aGUgaW5kZXhcbiAgICAgICAgICAgIHZhbHVlICs9IGDvv70key1vcENvZGUgLSAxfe+/vWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICBsZXQgdEljdUluZGV4OiBudW1iZXI7XG4gICAgICAgICAgICBsZXQgdEljdTogVEljdTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IF9fcmF3X29wQ29kZXNbKytqXTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgICAgICBjaGVja0JpdCxcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdBdHRyJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJWYWx1ZTogdmFsdWUsIGF0dHJOYW1lLCBzYW5pdGl6ZUZuLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuVGV4dDpcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgICAgICBjaGVja0JpdCxcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdUZXh0Jywgbm9kZUluZGV4LFxuICAgICAgICAgICAgICAgICAgdGV4dDogdmFsdWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnSWN1U3dpdGNoJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1SW5kZXgnXSA9IHRJY3VJbmRleDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ2NoZWNrQml0J10gPSBjaGVja0JpdDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ21haW5CaW5kaW5nJ10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3UnXSA9IHRJY3U7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdJY3VVcGRhdGUnKTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3VJbmRleCddID0gdEljdUluZGV4O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnY2hlY2tCaXQnXSA9IGNoZWNrQml0O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdSddID0gdEljdTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGkgKz0gc2tpcENvZGVzO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEkxOG5PcENvZGVzRGVidWcgeyBvcGVyYXRpb25zOiBhbnlbXTsgfVxuIl19