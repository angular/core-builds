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
var NG_DEV_MODE = ((typeof ngDevMode === 'undefined' || !!ngDevMode) && initNgDevMode());
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
export var LViewArray = NG_DEV_MODE && createNamedArrayType('LView') || null;
var LVIEW_EMPTY; // can't initialize here or it will not be tree shaken, because `LView`
// constructor could have side-effects.
/**
 * This function clones a blueprint and creates LView.
 *
 * Simple slice will keep the same type, and we need it to be LView
 */
export function cloneToLView(list) {
    if (LVIEW_EMPTY === undefined)
        LVIEW_EMPTY = new LViewArray();
    return LVIEW_EMPTY.concat(list);
}
/**
 * This class is a debug version of Object literal so that we can have constructor name show up in
 * debug tools in ngDevMode.
 */
export var TViewConstructor = /** @class */ (function () {
    function TView(id, //
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
    Object.defineProperty(TView.prototype, "template_", {
        get: function () {
            var buf = [];
            processTNodeChildren(this.firstChild, buf);
            return buf.join('');
        },
        enumerable: true,
        configurable: true
    });
    return TView;
}());
export var TNodeConstructor = /** @class */ (function () {
    function TNode(tView_, //
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
    Object.defineProperty(TNode.prototype, "type_", {
        get: function () {
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TNode.prototype, "flags_", {
        get: function () {
            var flags = [];
            if (this.flags & 16 /* hasClassInput */)
                flags.push('TNodeFlags.hasClassInput');
            if (this.flags & 8 /* hasContentQuery */)
                flags.push('TNodeFlags.hasContentQuery');
            if (this.flags & 32 /* hasStyleInput */)
                flags.push('TNodeFlags.hasStyleInput');
            if (this.flags & 64 /* hasInitialStyling */)
                flags.push('TNodeFlags.hasInitialStyling');
            if (this.flags & 2 /* isComponentHost */)
                flags.push('TNodeFlags.isComponentHost');
            if (this.flags & 1 /* isDirectiveHost */)
                flags.push('TNodeFlags.isDirectiveHost');
            if (this.flags & 128 /* isDetached */)
                flags.push('TNodeFlags.isDetached');
            if (this.flags & 4 /* isProjected */)
                flags.push('TNodeFlags.isProjected');
            return flags.join('|');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TNode.prototype, "template_", {
        get: function () {
            var buf = [];
            buf.push('<', this.tagName || this.type_);
            if (this.attrs) {
                for (var i = 0; i < this.attrs.length;) {
                    var attrName = this.attrs[i++];
                    if (typeof attrName == 'number') {
                        break;
                    }
                    var attrValue = this.attrs[i++];
                    buf.push(' ', attrName, '="', attrValue, '"');
                }
            }
            buf.push('>');
            processTNodeChildren(this.child, buf);
            buf.push('</', this.tagName || this.type_, '>');
            return buf.join('');
        },
        enumerable: true,
        configurable: true
    });
    return TNode;
}());
function processTNodeChildren(tNode, buf) {
    while (tNode) {
        buf.push(tNode.template_);
        tNode = tNode.next;
    }
}
var TViewData = NG_DEV_MODE && createNamedArrayType('TViewData') || null;
var TVIEWDATA_EMPTY; // can't initialize here or it will not be tree shaken, because `LView`
// constructor could have side-effects.
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
export var LViewBlueprint = NG_DEV_MODE && createNamedArrayType('LViewBlueprint') || null;
export var MatchesArray = NG_DEV_MODE && createNamedArrayType('MatchesArray') || null;
export var TViewComponents = NG_DEV_MODE && createNamedArrayType('TViewComponents') || null;
export var TNodeLocalNames = NG_DEV_MODE && createNamedArrayType('TNodeLocalNames') || null;
export var TNodeInitialInputs = NG_DEV_MODE && createNamedArrayType('TNodeInitialInputs') || null;
export var TNodeInitialData = NG_DEV_MODE && createNamedArrayType('TNodeInitialData') || null;
export var LCleanup = NG_DEV_MODE && createNamedArrayType('LCleanup') || null;
export var TCleanup = NG_DEV_MODE && createNamedArrayType('TCleanup') || null;
export function attachLViewDebug(lView) {
    attachDebugObject(lView, new LViewDebug(lView));
}
export function attachLContainerDebug(lContainer) {
    attachDebugObject(lContainer, new LContainerDebug(lContainer));
}
export function toDebug(obj) {
    if (obj) {
        var debug = obj.debug;
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
 * @param includeChildren If `true` then the serialized HTML form will include child elements (same
 * as `outerHTML`). If `false` then the serialized HTML form will only contain the element itself
 * (will not serialize child elements).
 */
function toHtml(value, includeChildren) {
    if (includeChildren === void 0) { includeChildren = false; }
    var node = unwrapRNode(value);
    if (node) {
        var isTextNode = node.nodeType === Node.TEXT_NODE;
        var outerHTML = (isTextNode ? node.textContent : node.outerHTML) || '';
        if (includeChildren || isTextNode) {
            return outerHTML;
        }
        else {
            var innerHTML = '>' + node.innerHTML + '<';
            return (outerHTML.split(innerHTML)[0]) + '>';
        }
    }
    else {
        return null;
    }
}
var LViewDebug = /** @class */ (function () {
    function LViewDebug(_raw_lView) {
        this._raw_lView = _raw_lView;
    }
    Object.defineProperty(LViewDebug.prototype, "flags", {
        /**
         * Flags associated with the `LView` unpacked into a more readable state.
         */
        get: function () {
            var flags = this._raw_lView[FLAGS];
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "parent", {
        get: function () { return toDebug(this._raw_lView[PARENT]); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "host", {
        get: function () { return toHtml(this._raw_lView[HOST], true); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "html", {
        get: function () { return (this.nodes || []).map(function (node) { return toHtml(node.native, true); }).join(''); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "context", {
        get: function () { return this._raw_lView[CONTEXT]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "nodes", {
        /**
         * The tree of nodes associated with the current `LView`. The nodes have been normalized into a
         * tree structure with relevant details pulled out for readability.
         */
        get: function () {
            var lView = this._raw_lView;
            var tNode = lView[TVIEW].firstChild;
            return toDebugNodes(tNode, lView);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "tView", {
        get: function () { return this._raw_lView[TVIEW]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "cleanup", {
        get: function () { return this._raw_lView[CLEANUP]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "injector", {
        get: function () { return this._raw_lView[INJECTOR]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "rendererFactory", {
        get: function () { return this._raw_lView[RENDERER_FACTORY]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "renderer", {
        get: function () { return this._raw_lView[RENDERER]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "sanitizer", {
        get: function () { return this._raw_lView[SANITIZER]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "childHead", {
        get: function () { return toDebug(this._raw_lView[CHILD_HEAD]); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "next", {
        get: function () { return toDebug(this._raw_lView[NEXT]); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "childTail", {
        get: function () { return toDebug(this._raw_lView[CHILD_TAIL]); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "declarationView", {
        get: function () { return toDebug(this._raw_lView[DECLARATION_VIEW]); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "queries", {
        get: function () { return this._raw_lView[QUERIES]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "tHost", {
        get: function () { return this._raw_lView[T_HOST]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "bindingIndex", {
        get: function () { return this._raw_lView[BINDING_INDEX]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "childViews", {
        /**
         * Normalized view of child views (and containers) attached at this location.
         */
        get: function () {
            var childViews = [];
            var child = this.childHead;
            while (child) {
                childViews.push(child);
                child = child.next;
            }
            return childViews;
        },
        enumerable: true,
        configurable: true
    });
    return LViewDebug;
}());
export { LViewDebug };
/**
 * Turns a flat list of nodes into a tree by walking the associated `TNode` tree.
 *
 * @param tNode
 * @param lView
 */
export function toDebugNodes(tNode, lView) {
    if (tNode) {
        var debugNodes = [];
        var tNodeCursor = tNode;
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
    var rawValue = lView[nodeIndex];
    var native = unwrapRNode(rawValue);
    var componentLViewDebug = toDebug(readLViewValue(rawValue));
    var styles = isStylingContext(tNode.styles) ?
        new NodeStylingDebug(tNode.styles, lView) :
        null;
    var classes = isStylingContext(tNode.classes) ?
        new NodeStylingDebug(tNode.classes, lView, true) :
        null;
    return {
        html: toHtml(native),
        native: native, styles: styles, classes: classes,
        nodes: toDebugNodes(tNode.child, lView),
        component: componentLViewDebug,
    };
}
var LContainerDebug = /** @class */ (function () {
    function LContainerDebug(_raw_lContainer) {
        this._raw_lContainer = _raw_lContainer;
    }
    Object.defineProperty(LContainerDebug.prototype, "activeIndex", {
        get: function () { return this._raw_lContainer[ACTIVE_INDEX]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LContainerDebug.prototype, "views", {
        get: function () {
            return this._raw_lContainer.slice(CONTAINER_HEADER_OFFSET)
                .map(toDebug);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LContainerDebug.prototype, "parent", {
        get: function () { return toDebug(this._raw_lContainer[PARENT]); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LContainerDebug.prototype, "movedViews", {
        get: function () { return this._raw_lContainer[MOVED_VIEWS]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LContainerDebug.prototype, "host", {
        get: function () { return this._raw_lContainer[HOST]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LContainerDebug.prototype, "native", {
        get: function () { return this._raw_lContainer[NATIVE]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LContainerDebug.prototype, "next", {
        get: function () { return toDebug(this._raw_lContainer[NEXT]); },
        enumerable: true,
        configurable: true
    });
    return LContainerDebug;
}());
export { LContainerDebug };
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
var I18NDebugItem = /** @class */ (function () {
    function I18NDebugItem(__raw_opCode, _lView, nodeIndex, type) {
        this.__raw_opCode = __raw_opCode;
        this._lView = _lView;
        this.nodeIndex = nodeIndex;
        this.type = type;
    }
    Object.defineProperty(I18NDebugItem.prototype, "tNode", {
        get: function () { return getTNode(this.nodeIndex, this._lView); },
        enumerable: true,
        configurable: true
    });
    return I18NDebugItem;
}());
export { I18NDebugItem };
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
        icus.forEach(function (icu) {
            icu.create.forEach(function (icuCase) { attachDebugObject(icuCase, new I18nMutateOpCodesDebug(icuCase, lView)); });
            icu.update.forEach(function (icuCase) {
                attachDebugObject(icuCase, new I18nUpdateOpCodesDebug(icuCase, icus, lView));
            });
        });
    }
}
var I18nMutateOpCodesDebug = /** @class */ (function () {
    function I18nMutateOpCodesDebug(__raw_opCodes, __lView) {
        this.__raw_opCodes = __raw_opCodes;
        this.__lView = __lView;
    }
    Object.defineProperty(I18nMutateOpCodesDebug.prototype, "operations", {
        /**
         * A list of operation information about how the OpCodes will act on the view.
         */
        get: function () {
            var _a = this, __lView = _a.__lView, __raw_opCodes = _a.__raw_opCodes;
            var results = [];
            for (var i = 0; i < __raw_opCodes.length; i++) {
                var opCode = __raw_opCodes[i];
                var result = void 0;
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
                            var destinationNodeIndex = opCode >>> 17 /* SHIFT_PARENT */;
                            result = new I18NDebugItem(opCode, __lView, destinationNodeIndex, 'AppendChild');
                            break;
                        case 0 /* Select */:
                            var nodeIndex = opCode >>> 3 /* SHIFT_REF */;
                            result = new I18NDebugItem(opCode, __lView, nodeIndex, 'Select');
                            break;
                        case 5 /* ElementEnd */:
                            var elementIndex = opCode >>> 3 /* SHIFT_REF */;
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
        },
        enumerable: true,
        configurable: true
    });
    return I18nMutateOpCodesDebug;
}());
export { I18nMutateOpCodesDebug };
var I18nUpdateOpCodesDebug = /** @class */ (function () {
    function I18nUpdateOpCodesDebug(__raw_opCodes, icus, __lView) {
        this.__raw_opCodes = __raw_opCodes;
        this.icus = icus;
        this.__lView = __lView;
    }
    Object.defineProperty(I18nUpdateOpCodesDebug.prototype, "operations", {
        /**
         * A list of operation information about how the OpCodes will act on the view.
         */
        get: function () {
            var _a = this, __lView = _a.__lView, __raw_opCodes = _a.__raw_opCodes, icus = _a.icus;
            var results = [];
            for (var i = 0; i < __raw_opCodes.length; i++) {
                // bit code to check if we should apply the next update
                var checkBit = __raw_opCodes[i];
                // Number of opCodes to skip until next set of update codes
                var skipCodes = __raw_opCodes[++i];
                var value = '';
                for (var j = i + 1; j <= (i + skipCodes); j++) {
                    var opCode = __raw_opCodes[j];
                    if (typeof opCode === 'string') {
                        value += opCode;
                    }
                    else if (typeof opCode == 'number') {
                        if (opCode < 0) {
                            // It's a binding index whose value is negative
                            // We cannot know the value of the binding so we only show the index
                            value += "\uFFFD" + (-opCode - 1) + "\uFFFD";
                        }
                        else {
                            var nodeIndex = opCode >>> 2 /* SHIFT_REF */;
                            var tIcuIndex = void 0;
                            var tIcu = void 0;
                            switch (opCode & 3 /* MASK_OPCODE */) {
                                case 1 /* Attr */:
                                    var attrName = __raw_opCodes[++j];
                                    var sanitizeFn = __raw_opCodes[++j];
                                    results.push({
                                        __raw_opCode: opCode,
                                        checkBit: checkBit,
                                        type: 'Attr',
                                        attrValue: value, attrName: attrName, sanitizeFn: sanitizeFn,
                                    });
                                    break;
                                case 0 /* Text */:
                                    results.push({
                                        __raw_opCode: opCode,
                                        checkBit: checkBit,
                                        type: 'Text', nodeIndex: nodeIndex,
                                        text: value,
                                    });
                                    break;
                                case 2 /* IcuSwitch */:
                                    tIcuIndex = __raw_opCodes[++j];
                                    tIcu = icus[tIcuIndex];
                                    var result = new I18NDebugItem(opCode, __lView, nodeIndex, 'IcuSwitch');
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
        },
        enumerable: true,
        configurable: true
    });
    return I18nUpdateOpCodesDebug;
}());
export { I18nUpdateOpCodesDebug };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxZQUFZLEVBQUUsdUJBQXVCLEVBQWMsV0FBVyxFQUFFLE1BQU0sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRS9HLE9BQU8sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFpRixNQUFNLG9CQUFvQixDQUFDO0FBTWxKLE9BQU8sRUFBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUF1QixLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBWSxRQUFRLEVBQXFCLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQVMsS0FBSyxFQUEwQixNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNqVCxPQUFPLEVBQW1CLGdCQUFnQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV6RCxJQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxhQUFhLEVBQUUsQ0FBQyxDQUFDO0FBRTNGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EyQkc7QUFFSCxNQUFNLENBQUMsSUFBTSxVQUFVLEdBQUcsV0FBVyxJQUFJLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQXlCLENBQUM7QUFDcEcsSUFBSSxXQUFzQixDQUFDLENBQUUsdUVBQXVFO0FBQ3ZFLHVDQUF1QztBQUNwRTs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxJQUFXO0lBQ3RDLElBQUksV0FBVyxLQUFLLFNBQVM7UUFBRSxXQUFXLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztJQUM5RCxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFRLENBQUM7QUFDekMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxJQUFNLGdCQUFnQjtJQUMzQixlQUNXLEVBQVUsRUFBc0MsRUFBRTtJQUNsRCxTQUFnQixFQUFnQyxFQUFFO0lBQ2xELFFBQW9DLEVBQVksRUFBRTtJQUNsRCxPQUFzQixFQUEwQixFQUFFO0lBQ2xELFNBQXVDLEVBQVMsRUFBRTtJQUNsRCxJQUFpQyxFQUFlLEVBQUU7SUFDbEQsSUFBVyxFQUFxQyxFQUFFO0lBQ2xELGlCQUF5QixFQUF1QixFQUFFO0lBQ2xELGlCQUF5QixFQUF1QixFQUFFO0lBQ2xELG1CQUE2QyxFQUFHLEVBQUU7SUFDbEQsaUJBQTBCLEVBQXNCLEVBQUU7SUFDbEQsaUJBQTBCLEVBQXNCLEVBQUU7SUFDbEQsb0JBQTZCLEVBQW1CLEVBQUU7SUFDbEQsYUFBNEIsRUFBb0IsRUFBRTtJQUNsRCxrQkFBaUMsRUFBZSxFQUFFO0lBQ2xELFlBQTJCLEVBQXFCLEVBQUU7SUFDbEQsaUJBQWdDLEVBQWdCLEVBQUU7SUFDbEQsU0FBd0IsRUFBd0IsRUFBRTtJQUNsRCxjQUE2QixFQUFtQixFQUFFO0lBQ2xELFlBQTJCLEVBQXFCLEVBQUU7SUFDbEQsT0FBbUIsRUFBNkIsRUFBRTtJQUNsRCxjQUE2QixFQUFtQixFQUFFO0lBQ2xELFVBQXlCLEVBQXVCLEVBQUU7SUFDbEQsaUJBQXdDLEVBQVEsRUFBRTtJQUNsRCxZQUE4QixFQUFrQixFQUFFO0lBQ2xELFVBQXNCLEVBQTBCLEVBQUU7SUFDbEQsT0FBOEIsRUFBa0IsRUFBRTtJQUNsRCxNQUEwQjtRQTNCMUIsT0FBRSxHQUFGLEVBQUUsQ0FBUTtRQUNWLGNBQVMsR0FBVCxTQUFTLENBQU87UUFDaEIsYUFBUSxHQUFSLFFBQVEsQ0FBNEI7UUFDcEMsWUFBTyxHQUFQLE9BQU8sQ0FBZTtRQUN0QixjQUFTLEdBQVQsU0FBUyxDQUE4QjtRQUN2QyxTQUFJLEdBQUosSUFBSSxDQUE2QjtRQUNqQyxTQUFJLEdBQUosSUFBSSxDQUFPO1FBQ1gsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFRO1FBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtRQUN6Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQTBCO1FBQzdDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUztRQUMxQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQVM7UUFDMUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFTO1FBQzdCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1FBQzVCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBZTtRQUNqQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtRQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQWU7UUFDaEMsY0FBUyxHQUFULFNBQVMsQ0FBZTtRQUN4QixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQUM3QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtRQUMzQixZQUFPLEdBQVAsT0FBTyxDQUFZO1FBQ25CLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1FBQzdCLGVBQVUsR0FBVixVQUFVLENBQWU7UUFDekIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF1QjtRQUN4QyxpQkFBWSxHQUFaLFlBQVksQ0FBa0I7UUFDOUIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUN0QixZQUFPLEdBQVAsT0FBTyxDQUF1QjtRQUM5QixXQUFNLEdBQU4sTUFBTSxDQUFvQjtJQUM5QixDQUFDO0lBRVIsc0JBQUksNEJBQVM7YUFBYjtZQUNFLElBQU0sR0FBRyxHQUFhLEVBQUUsQ0FBQztZQUN6QixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0QixDQUFDOzs7T0FBQTtJQUNILFlBQUM7QUFBRCxDQUFDLEFBckMrQixHQXFDL0IsQ0FBQztBQUVGLE1BQU0sQ0FBQyxJQUFNLGdCQUFnQjtJQUMzQixlQUNXLE1BQWEsRUFBcUQsRUFBRTtJQUNwRSxJQUFlLEVBQW1ELEVBQUU7SUFDcEUsS0FBYSxFQUFxRCxFQUFFO0lBQ3BFLGFBQXFCLEVBQTZDLEVBQUU7SUFDcEUsY0FBc0IsRUFBNEMsRUFBRTtJQUNwRSxZQUFvQixFQUE4QyxFQUFFO0lBQ3BFLGdCQUErQixFQUFtQyxFQUFFO0lBQ3BFLEtBQWlCLEVBQWlELEVBQUU7SUFDcEUsZUFBcUMsRUFBNkIsRUFBRTtJQUNwRSxPQUFvQixFQUE4QyxFQUFFO0lBQ3BFLEtBQStELEVBQUcsRUFBRTtJQUNwRSxVQUFrQyxFQUFnQyxFQUFFO0lBQ3BFLGFBQStDLEVBQW1CLEVBQUU7SUFDcEUsTUFBc0MsRUFBNEIsRUFBRTtJQUNwRSxPQUF1QyxFQUEyQixFQUFFO0lBQ3BFLE1BQTRCLEVBQXNDLEVBQUU7SUFDcEUsSUFBaUIsRUFBaUQsRUFBRTtJQUNwRSxjQUEyQixFQUF1QyxFQUFFO0lBQ3BFLEtBQWtCLEVBQWdELEVBQUU7SUFDcEUsTUFBd0MsRUFBMEIsRUFBRTtJQUNwRSxVQUEwQyxFQUF3QixFQUFFO0lBQ3BFLE1BQTRCLEVBQXNDLEVBQUU7SUFDcEUsT0FBNkI7UUF0QjdCLFdBQU0sR0FBTixNQUFNLENBQU87UUFDYixTQUFJLEdBQUosSUFBSSxDQUFXO1FBQ2YsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ3JCLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1FBQ3RCLGlCQUFZLEdBQVosWUFBWSxDQUFRO1FBQ3BCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBZTtRQUMvQixVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQ2pCLG9CQUFlLEdBQWYsZUFBZSxDQUFzQjtRQUNyQyxZQUFPLEdBQVAsT0FBTyxDQUFhO1FBQ3BCLFVBQUssR0FBTCxLQUFLLENBQTBEO1FBQy9ELGVBQVUsR0FBVixVQUFVLENBQXdCO1FBQ2xDLGtCQUFhLEdBQWIsYUFBYSxDQUFrQztRQUMvQyxXQUFNLEdBQU4sTUFBTSxDQUFnQztRQUN0QyxZQUFPLEdBQVAsT0FBTyxDQUFnQztRQUN2QyxXQUFNLEdBQU4sTUFBTSxDQUFzQjtRQUM1QixTQUFJLEdBQUosSUFBSSxDQUFhO1FBQ2pCLG1CQUFjLEdBQWQsY0FBYyxDQUFhO1FBQzNCLFVBQUssR0FBTCxLQUFLLENBQWE7UUFDbEIsV0FBTSxHQUFOLE1BQU0sQ0FBa0M7UUFDeEMsZUFBVSxHQUFWLFVBQVUsQ0FBZ0M7UUFDMUMsV0FBTSxHQUFOLE1BQU0sQ0FBc0I7UUFDNUIsWUFBTyxHQUFQLE9BQU8sQ0FBc0I7SUFDakMsQ0FBQztJQUVSLHNCQUFJLHdCQUFLO2FBQVQ7WUFDRSxRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ2pCO29CQUNFLE9BQU8scUJBQXFCLENBQUM7Z0JBQy9CO29CQUNFLE9BQU8sbUJBQW1CLENBQUM7Z0JBQzdCO29CQUNFLE9BQU8sNEJBQTRCLENBQUM7Z0JBQ3RDO29CQUNFLE9BQU8sd0JBQXdCLENBQUM7Z0JBQ2xDO29CQUNFLE9BQU8sc0JBQXNCLENBQUM7Z0JBQ2hDO29CQUNFLE9BQU8sZ0JBQWdCLENBQUM7Z0JBQzFCO29CQUNFLE9BQU8sZUFBZSxDQUFDO2FBQzFCO1FBQ0gsQ0FBQzs7O09BQUE7SUFFRCxzQkFBSSx5QkFBTTthQUFWO1lBQ0UsSUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO1lBQzNCLElBQUksSUFBSSxDQUFDLEtBQUsseUJBQTJCO2dCQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUNsRixJQUFJLElBQUksQ0FBQyxLQUFLLDBCQUE2QjtnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDdEYsSUFBSSxJQUFJLENBQUMsS0FBSyx5QkFBMkI7Z0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQ2xGLElBQUksSUFBSSxDQUFDLEtBQUssNkJBQStCO2dCQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUMxRixJQUFJLElBQUksQ0FBQyxLQUFLLDBCQUE2QjtnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDdEYsSUFBSSxJQUFJLENBQUMsS0FBSywwQkFBNkI7Z0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1lBQ3RGLElBQUksSUFBSSxDQUFDLEtBQUssdUJBQXdCO2dCQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUM1RSxJQUFJLElBQUksQ0FBQyxLQUFLLHNCQUF5QjtnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDOUUsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7OztPQUFBO0lBRUQsc0JBQUksNEJBQVM7YUFBYjtZQUNFLElBQU0sR0FBRyxHQUFhLEVBQUUsQ0FBQztZQUN6QixHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHO29CQUN0QyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2pDLElBQUksT0FBTyxRQUFRLElBQUksUUFBUSxFQUFFO3dCQUMvQixNQUFNO3FCQUNQO29CQUNELElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDbEMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBa0IsRUFBRSxJQUFJLEVBQUUsU0FBbUIsRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDbkU7YUFDRjtZQUNELEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNoRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdEIsQ0FBQzs7O09BQUE7SUFDSCxZQUFDO0FBQUQsQ0FBQyxBQTdFK0IsR0E2RS9CLENBQUM7QUFFRixTQUFTLG9CQUFvQixDQUFDLEtBQW1CLEVBQUUsR0FBYTtJQUM5RCxPQUFPLEtBQUssRUFBRTtRQUNaLEdBQUcsQ0FBQyxJQUFJLENBQUUsS0FBbUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6RCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztLQUNwQjtBQUNILENBQUM7QUFFRCxJQUFNLFNBQVMsR0FBRyxXQUFXLElBQUksb0JBQW9CLENBQUMsV0FBVyxDQUFDLElBQUksSUFBeUIsQ0FBQztBQUNoRyxJQUFJLGVBQ1MsQ0FBQyxDQUFFLHVFQUF1RTtBQUN2RSx1Q0FBdUM7QUFDdkQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFXO0lBQzFDLElBQUksZUFBZSxLQUFLLFNBQVM7UUFBRSxlQUFlLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztJQUNyRSxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFRLENBQUM7QUFDN0MsQ0FBQztBQUVELE1BQU0sQ0FBQyxJQUFNLGNBQWMsR0FDdkIsV0FBVyxJQUFJLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLElBQUksSUFBeUIsQ0FBQztBQUN2RixNQUFNLENBQUMsSUFBTSxZQUFZLEdBQ3JCLFdBQVcsSUFBSSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxJQUF5QixDQUFDO0FBQ3JGLE1BQU0sQ0FBQyxJQUFNLGVBQWUsR0FDeEIsV0FBVyxJQUFJLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLElBQUksSUFBeUIsQ0FBQztBQUN4RixNQUFNLENBQUMsSUFBTSxlQUFlLEdBQ3hCLFdBQVcsSUFBSSxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLElBQXlCLENBQUM7QUFDeEYsTUFBTSxDQUFDLElBQU0sa0JBQWtCLEdBQzNCLFdBQVcsSUFBSSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLElBQXlCLENBQUM7QUFDM0YsTUFBTSxDQUFDLElBQU0sZ0JBQWdCLEdBQ3pCLFdBQVcsSUFBSSxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLElBQXlCLENBQUM7QUFDekYsTUFBTSxDQUFDLElBQU0sUUFBUSxHQUNqQixXQUFXLElBQUksb0JBQW9CLENBQUMsVUFBVSxDQUFDLElBQUksSUFBeUIsQ0FBQztBQUNqRixNQUFNLENBQUMsSUFBTSxRQUFRLEdBQ2pCLFdBQVcsSUFBSSxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUF5QixDQUFDO0FBSWpGLE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFZO0lBQzNDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFFRCxNQUFNLFVBQVUscUJBQXFCLENBQUMsVUFBc0I7SUFDMUQsaUJBQWlCLENBQUMsVUFBVSxFQUFFLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUtELE1BQU0sVUFBVSxPQUFPLENBQUMsR0FBUTtJQUM5QixJQUFJLEdBQUcsRUFBRTtRQUNQLElBQU0sS0FBSyxHQUFJLEdBQVcsQ0FBQyxLQUFLLENBQUM7UUFDakMsYUFBYSxDQUFDLEtBQUssRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7U0FBTTtRQUNMLE9BQU8sR0FBRyxDQUFDO0tBQ1o7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLE1BQU0sQ0FBQyxLQUFVLEVBQUUsZUFBZ0M7SUFBaEMsZ0NBQUEsRUFBQSx1QkFBZ0M7SUFDMUQsSUFBTSxJQUFJLEdBQXFCLFdBQVcsQ0FBQyxLQUFLLENBQVEsQ0FBQztJQUN6RCxJQUFJLElBQUksRUFBRTtRQUNSLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNwRCxJQUFNLFNBQVMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6RSxJQUFJLGVBQWUsSUFBSSxVQUFVLEVBQUU7WUFDakMsT0FBTyxTQUFTLENBQUM7U0FDbEI7YUFBTTtZQUNMLElBQU0sU0FBUyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztZQUM3QyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUM5QztLQUNGO1NBQU07UUFDTCxPQUFPLElBQUksQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQUVEO0lBQ0Usb0JBQTZCLFVBQWlCO1FBQWpCLGVBQVUsR0FBVixVQUFVLENBQU87SUFBRyxDQUFDO0lBS2xELHNCQUFJLDZCQUFLO1FBSFQ7O1dBRUc7YUFDSDtZQUNFLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckMsT0FBTztnQkFDTCxjQUFjLEVBQUUsS0FBSztnQkFDckIsY0FBYyxFQUFFLEtBQUssNkJBQWdDO2dCQUNyRCxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyx1QkFBMEIsQ0FBQztnQkFDakQsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUsseUJBQTRCLENBQUM7Z0JBQ3BELFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLHVCQUF5QixDQUFDO2dCQUMvQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxpQkFBbUIsQ0FBQztnQkFDbkMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUsscUJBQXNCLENBQUM7Z0JBQ3pDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUF1QixDQUFDO2dCQUMzQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxtQkFBb0IsQ0FBQztnQkFDckMsb0JBQW9CLEVBQUUsS0FBSyxzQ0FBd0M7YUFDcEUsQ0FBQztRQUNKLENBQUM7OztPQUFBO0lBQ0Qsc0JBQUksOEJBQU07YUFBVixjQUFnRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUMxRixzQkFBSSw0QkFBSTthQUFSLGNBQTBCLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUN2RSxzQkFBSSw0QkFBSTthQUFSLGNBQXFCLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUF6QixDQUF5QixDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDakcsc0JBQUksK0JBQU87YUFBWCxjQUF5QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUszRCxzQkFBSSw2QkFBSztRQUpUOzs7V0FHRzthQUNIO1lBQ0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM5QixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDO1lBQ3RDLE9BQU8sWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwQyxDQUFDOzs7T0FBQTtJQUVELHNCQUFJLDZCQUFLO2FBQVQsY0FBYyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUM5QyxzQkFBSSwrQkFBTzthQUFYLGNBQWdCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQ2xELHNCQUFJLGdDQUFRO2FBQVosY0FBaUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDcEQsc0JBQUksdUNBQWU7YUFBbkIsY0FBd0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNuRSxzQkFBSSxnQ0FBUTthQUFaLGNBQWlCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQ3BELHNCQUFJLGlDQUFTO2FBQWIsY0FBa0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDdEQsc0JBQUksaUNBQVM7YUFBYixjQUFrQixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNoRSxzQkFBSSw0QkFBSTthQUFSLGNBQWEsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDckQsc0JBQUksaUNBQVM7YUFBYixjQUFrQixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUNoRSxzQkFBSSx1Q0FBZTthQUFuQixjQUF3QixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQzVFLHNCQUFJLCtCQUFPO2FBQVgsY0FBZ0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDbEQsc0JBQUksNkJBQUs7YUFBVCxjQUFjLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQy9DLHNCQUFJLG9DQUFZO2FBQWhCLGNBQXFCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBSzdELHNCQUFJLGtDQUFVO1FBSGQ7O1dBRUc7YUFDSDtZQUNFLElBQU0sVUFBVSxHQUFzQyxFQUFFLENBQUM7WUFDekQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUMzQixPQUFPLEtBQUssRUFBRTtnQkFDWixVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN2QixLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQzthQUNwQjtZQUNELE9BQU8sVUFBVSxDQUFDO1FBQ3BCLENBQUM7OztPQUFBO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBN0RELElBNkRDOztBQVdEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxLQUFtQixFQUFFLEtBQVk7SUFDNUQsSUFBSSxLQUFLLEVBQUU7UUFDVCxJQUFNLFVBQVUsR0FBZ0IsRUFBRSxDQUFDO1FBQ25DLElBQUksV0FBVyxHQUFlLEtBQUssQ0FBQztRQUNwQyxPQUFPLFdBQVcsRUFBRTtZQUNsQixVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLFdBQVcsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDO1NBQ2hDO1FBQ0QsT0FBTyxVQUFVLENBQUM7S0FDbkI7U0FBTTtRQUNMLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLFNBQWlCO0lBQzFFLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNsQyxJQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDckMsSUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDOUQsSUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsTUFBZ0MsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksQ0FBQztJQUNULElBQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzdDLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE9BQWlDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDNUUsSUFBSSxDQUFDO0lBQ1QsT0FBTztRQUNMLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3BCLE1BQU0sRUFBRSxNQUFhLEVBQUUsTUFBTSxRQUFBLEVBQUUsT0FBTyxTQUFBO1FBQ3RDLEtBQUssRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7UUFDdkMsU0FBUyxFQUFFLG1CQUFtQjtLQUMvQixDQUFDO0FBQ0osQ0FBQztBQUVEO0lBQ0UseUJBQTZCLGVBQTJCO1FBQTNCLG9CQUFlLEdBQWYsZUFBZSxDQUFZO0lBQUcsQ0FBQztJQUU1RCxzQkFBSSx3Q0FBVzthQUFmLGNBQTRCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQ3hFLHNCQUFJLGtDQUFLO2FBQVQ7WUFDRSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDO2lCQUNyRCxHQUFHLENBQUMsT0FBa0MsQ0FBQyxDQUFDO1FBQy9DLENBQUM7OztPQUFBO0lBQ0Qsc0JBQUksbUNBQU07YUFBVixjQUFnRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUMvRixzQkFBSSx1Q0FBVTthQUFkLGNBQWlDLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQzVFLHNCQUFJLGlDQUFJO2FBQVIsY0FBc0MsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDMUUsc0JBQUksbUNBQU07YUFBVixjQUF5QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUMvRCxzQkFBSSxpQ0FBSTthQUFSLGNBQWEsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDNUQsc0JBQUM7QUFBRCxDQUFDLEFBYkQsSUFhQzs7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFVO0lBQ3ZDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMzQixtRkFBbUY7UUFDbkYsNkNBQTZDO1FBQzdDLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxhQUFhLEdBQUcsQ0FBQztZQUFFLE9BQU8sS0FBYyxDQUFDO1FBQzdELEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDckI7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDtJQUtFLHVCQUNXLFlBQWlCLEVBQVUsTUFBYSxFQUFTLFNBQWlCLEVBQ2xFLElBQVk7UUFEWixpQkFBWSxHQUFaLFlBQVksQ0FBSztRQUFVLFdBQU0sR0FBTixNQUFNLENBQU87UUFBUyxjQUFTLEdBQVQsU0FBUyxDQUFRO1FBQ2xFLFNBQUksR0FBSixJQUFJLENBQVE7SUFBRyxDQUFDO0lBSjNCLHNCQUFJLGdDQUFLO2FBQVQsY0FBYyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBSy9ELG9CQUFDO0FBQUQsQ0FBQyxBQVJELElBUUM7O0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsYUFBZ0MsRUFBRSxhQUFnQyxFQUFFLElBQW1CLEVBQ3ZGLEtBQVk7SUFDZCxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxzQkFBc0IsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNuRixpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxzQkFBc0IsQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFekYsSUFBSSxJQUFJLEVBQUU7UUFDUixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRztZQUNkLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUNkLFVBQUEsT0FBTyxJQUFNLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUYsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBQSxPQUFPO2dCQUN4QixpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDL0UsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQztBQUVEO0lBQ0UsZ0NBQTZCLGFBQWdDLEVBQW1CLE9BQWM7UUFBakUsa0JBQWEsR0FBYixhQUFhLENBQW1CO1FBQW1CLFlBQU8sR0FBUCxPQUFPLENBQU87SUFBRyxDQUFDO0lBS2xHLHNCQUFJLDhDQUFVO1FBSGQ7O1dBRUc7YUFDSDtZQUNRLElBQUEsU0FBK0IsRUFBOUIsb0JBQU8sRUFBRSxnQ0FBcUIsQ0FBQztZQUN0QyxJQUFNLE9BQU8sR0FBVSxFQUFFLENBQUM7WUFFMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLElBQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxNQUFNLFNBQUssQ0FBQztnQkFDaEIsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7b0JBQzlCLE1BQU0sR0FBRzt3QkFDUCxZQUFZLEVBQUUsTUFBTTt3QkFDcEIsSUFBSSxFQUFFLGtCQUFrQjt3QkFDeEIsU0FBUyxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDN0IsSUFBSSxFQUFFLE1BQU07cUJBQ2IsQ0FBQztpQkFDSDtnQkFFRCxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtvQkFDOUIsUUFBUSxNQUFNLHNCQUErQixFQUFFO3dCQUM3Qzs0QkFDRSxJQUFNLG9CQUFvQixHQUFHLE1BQU0sMEJBQWtDLENBQUM7NEJBQ3RFLE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLGFBQWEsQ0FBQyxDQUFDOzRCQUNqRixNQUFNO3dCQUNSOzRCQUNFLElBQU0sU0FBUyxHQUFHLE1BQU0sc0JBQStCLENBQUM7NEJBQ3hELE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQzs0QkFDakUsTUFBTTt3QkFDUjs0QkFDRSxJQUFJLFlBQVksR0FBRyxNQUFNLHNCQUErQixDQUFDOzRCQUN6RCxNQUFNLEdBQUcsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7NEJBQ3hFLE1BQU07d0JBQ1I7NEJBQ0UsWUFBWSxHQUFHLE1BQU0sc0JBQStCLENBQUM7NEJBQ3JELE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQzs0QkFDbEUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3pDLE1BQU07cUJBQ1Q7aUJBQ0Y7Z0JBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDWCxRQUFRLE1BQU0sRUFBRTt3QkFDZCxLQUFLLGNBQWM7NEJBQ2pCLE1BQU0sR0FBRztnQ0FDUCxZQUFZLEVBQUUsTUFBTTtnQ0FDcEIsSUFBSSxFQUFFLGdCQUFnQjtnQ0FDdEIsWUFBWSxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQ0FDaEMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQzs2QkFDOUIsQ0FBQzs0QkFDRixNQUFNO3dCQUNSLEtBQUssY0FBYzs0QkFDakIsTUFBTSxHQUFHO2dDQUNQLFlBQVksRUFBRSxNQUFNO2dDQUNwQixJQUFJLEVBQUUsZ0JBQWdCOzZCQUN2QixDQUFDOzRCQUNGLE1BQU07cUJBQ1Q7aUJBQ0Y7Z0JBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDWCxNQUFNLEdBQUc7d0JBQ1AsWUFBWSxFQUFFLE1BQU07d0JBQ3BCLElBQUksRUFBRSxpQkFBaUI7d0JBQ3ZCLElBQUksRUFBRSxNQUFNO3FCQUNiLENBQUM7aUJBQ0g7Z0JBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN0QjtZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2pCLENBQUM7OztPQUFBO0lBQ0gsNkJBQUM7QUFBRCxDQUFDLEFBN0VELElBNkVDOztBQUVEO0lBQ0UsZ0NBQ3FCLGFBQWdDLEVBQW1CLElBQWlCLEVBQ3BFLE9BQWM7UUFEZCxrQkFBYSxHQUFiLGFBQWEsQ0FBbUI7UUFBbUIsU0FBSSxHQUFKLElBQUksQ0FBYTtRQUNwRSxZQUFPLEdBQVAsT0FBTyxDQUFPO0lBQUcsQ0FBQztJQUt2QyxzQkFBSSw4Q0FBVTtRQUhkOztXQUVHO2FBQ0g7WUFDUSxJQUFBLFNBQXFDLEVBQXBDLG9CQUFPLEVBQUUsZ0NBQWEsRUFBRSxjQUFZLENBQUM7WUFDNUMsSUFBTSxPQUFPLEdBQVUsRUFBRSxDQUFDO1lBRTFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM3Qyx1REFBdUQ7Z0JBQ3ZELElBQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQVcsQ0FBQztnQkFDNUMsMkRBQTJEO2dCQUMzRCxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQVcsQ0FBQztnQkFDL0MsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQzdDLElBQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEMsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7d0JBQzlCLEtBQUssSUFBSSxNQUFNLENBQUM7cUJBQ2pCO3lCQUFNLElBQUksT0FBTyxNQUFNLElBQUksUUFBUSxFQUFFO3dCQUNwQyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUU7NEJBQ2QsK0NBQStDOzRCQUMvQyxvRUFBb0U7NEJBQ3BFLEtBQUssSUFBSSxZQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsWUFBRyxDQUFDO3lCQUM3Qjs2QkFBTTs0QkFDTCxJQUFNLFNBQVMsR0FBRyxNQUFNLHNCQUErQixDQUFDOzRCQUN4RCxJQUFJLFNBQVMsU0FBUSxDQUFDOzRCQUN0QixJQUFJLElBQUksU0FBTSxDQUFDOzRCQUNmLFFBQVEsTUFBTSxzQkFBK0IsRUFBRTtnQ0FDN0M7b0NBQ0UsSUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFXLENBQUM7b0NBQzlDLElBQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29DQUN0QyxPQUFPLENBQUMsSUFBSSxDQUFDO3dDQUNYLFlBQVksRUFBRSxNQUFNO3dDQUNwQixRQUFRLFVBQUE7d0NBQ1IsSUFBSSxFQUFFLE1BQU07d0NBQ1osU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLFVBQUEsRUFBRSxVQUFVLFlBQUE7cUNBQ3ZDLENBQUMsQ0FBQztvQ0FDSCxNQUFNO2dDQUNSO29DQUNFLE9BQU8sQ0FBQyxJQUFJLENBQUM7d0NBQ1gsWUFBWSxFQUFFLE1BQU07d0NBQ3BCLFFBQVEsVUFBQTt3Q0FDUixJQUFJLEVBQUUsTUFBTSxFQUFFLFNBQVMsV0FBQTt3Q0FDdkIsSUFBSSxFQUFFLEtBQUs7cUNBQ1osQ0FBQyxDQUFDO29DQUNILE1BQU07Z0NBQ1I7b0NBQ0UsU0FBUyxHQUFHLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBVyxDQUFDO29DQUN6QyxJQUFJLEdBQUcsSUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29DQUN6QixJQUFJLE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztvQ0FDeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztvQ0FDaEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztvQ0FDOUIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEtBQUssQ0FBQztvQ0FDOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztvQ0FDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDckIsTUFBTTtnQ0FDUjtvQ0FDRSxTQUFTLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFXLENBQUM7b0NBQ3pDLElBQUksR0FBRyxJQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0NBQ3pCLE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztvQ0FDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztvQ0FDaEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztvQ0FDOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztvQ0FDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDckIsTUFBTTs2QkFDVDt5QkFDRjtxQkFDRjtpQkFDRjtnQkFDRCxDQUFDLElBQUksU0FBUyxDQUFDO2FBQ2hCO1lBQ0QsT0FBTyxPQUFPLENBQUM7UUFDakIsQ0FBQzs7O09BQUE7SUFDSCw2QkFBQztBQUFELENBQUMsQUE3RUQsSUE2RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBDb21wb25lbnRUZW1wbGF0ZX0gZnJvbSAnLi4nO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vY29yZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge2luaXROZ0Rldk1vZGV9IGZyb20gJy4uLy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXUywgTkFUSVZFfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0LCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT01NRU5UX01BUktFUiwgRUxFTUVOVF9NQVJLRVIsIEkxOG5NdXRhdGVPcENvZGUsIEkxOG5NdXRhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgVEljdX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7UHJvcGVydHlBbGlhc2VzLCBUQXR0cmlidXRlcywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUgYXMgSVROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTZWxlY3RvckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtUUXVlcmllc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIb29rRGF0YSwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBTQU5JVElaRVIsIFREYXRhLCBUVklFVywgVFZpZXcgYXMgSVRWaWV3LCBUVmlldywgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z05vZGVTdHlsaW5nLCBOb2RlU3R5bGluZ0RlYnVnfSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldFROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuY29uc3QgTkdfREVWX01PREUgPSAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8ICEhbmdEZXZNb2RlKSAmJiBpbml0TmdEZXZNb2RlKCkpO1xuXG4vKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGNvbmRpdGlvbmFsbHkgYXR0YWNoZWQgY2xhc3NlcyB3aGljaCBwcm92aWRlIGh1bWFuIHJlYWRhYmxlIChkZWJ1ZykgbGV2ZWxcbiAqIGluZm9ybWF0aW9uIGZvciBgTFZpZXdgLCBgTENvbnRhaW5lcmAgYW5kIG90aGVyIGludGVybmFsIGRhdGEgc3RydWN0dXJlcy4gVGhlc2UgZGF0YSBzdHJ1Y3R1cmVzXG4gKiBhcmUgc3RvcmVkIGludGVybmFsbHkgYXMgYXJyYXkgd2hpY2ggbWFrZXMgaXQgdmVyeSBkaWZmaWN1bHQgZHVyaW5nIGRlYnVnZ2luZyB0byByZWFzb24gYWJvdXQgdGhlXG4gKiBjdXJyZW50IHN0YXRlIG9mIHRoZSBzeXN0ZW0uXG4gKlxuICogUGF0Y2hpbmcgdGhlIGFycmF5IHdpdGggZXh0cmEgcHJvcGVydHkgZG9lcyBjaGFuZ2UgdGhlIGFycmF5J3MgaGlkZGVuIGNsYXNzJyBidXQgaXQgZG9lcyBub3RcbiAqIGNoYW5nZSB0aGUgY29zdCBvZiBhY2Nlc3MsIHRoZXJlZm9yZSB0aGlzIHBhdGNoaW5nIHNob3VsZCBub3QgaGF2ZSBzaWduaWZpY2FudCBpZiBhbnkgaW1wYWN0IGluXG4gKiBgbmdEZXZNb2RlYCBtb2RlLiAoc2VlOiBodHRwczovL2pzcGVyZi5jb20vYXJyYXktdnMtbW9ua2V5LXBhdGNoLWFycmF5KVxuICpcbiAqIFNvIGluc3RlYWQgb2Ygc2VlaW5nOlxuICogYGBgXG4gKiBBcnJheSgzMCkgW09iamVjdCwgNjU5LCBudWxsLCDigKZdXG4gKiBgYGBcbiAqXG4gKiBZb3UgZ2V0IHRvIHNlZTpcbiAqIGBgYFxuICogTFZpZXdEZWJ1ZyB7XG4gKiAgIHZpZXdzOiBbLi4uXSxcbiAqICAgZmxhZ3M6IHthdHRhY2hlZDogdHJ1ZSwgLi4ufVxuICogICBub2RlczogW1xuICogICAgIHtodG1sOiAnPGRpdiBpZD1cIjEyM1wiPicsIC4uLiwgbm9kZXM6IFtcbiAqICAgICAgIHtodG1sOiAnPHNwYW4+JywgLi4uLCBub2RlczogbnVsbH1cbiAqICAgICBdfVxuICogICBdXG4gKiB9XG4gKiBgYGBcbiAqL1xuXG5leHBvcnQgY29uc3QgTFZpZXdBcnJheSA9IE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMVmlldycpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5sZXQgTFZJRVdfRU1QVFk6IHVua25vd25bXTsgIC8vIGNhbid0IGluaXRpYWxpemUgaGVyZSBvciBpdCB3aWxsIG5vdCBiZSB0cmVlIHNoYWtlbiwgYmVjYXVzZSBgTFZpZXdgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0cnVjdG9yIGNvdWxkIGhhdmUgc2lkZS1lZmZlY3RzLlxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNsb25lcyBhIGJsdWVwcmludCBhbmQgY3JlYXRlcyBMVmlldy5cbiAqXG4gKiBTaW1wbGUgc2xpY2Ugd2lsbCBrZWVwIHRoZSBzYW1lIHR5cGUsIGFuZCB3ZSBuZWVkIGl0IHRvIGJlIExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZVRvTFZpZXcobGlzdDogYW55W10pOiBMVmlldyB7XG4gIGlmIChMVklFV19FTVBUWSA9PT0gdW5kZWZpbmVkKSBMVklFV19FTVBUWSA9IG5ldyBMVmlld0FycmF5KCk7XG4gIHJldHVybiBMVklFV19FTVBUWS5jb25jYXQobGlzdCkgYXMgYW55O1xufVxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgYSBkZWJ1ZyB2ZXJzaW9uIG9mIE9iamVjdCBsaXRlcmFsIHNvIHRoYXQgd2UgY2FuIGhhdmUgY29uc3RydWN0b3IgbmFtZSBzaG93IHVwIGluXG4gKiBkZWJ1ZyB0b29scyBpbiBuZ0Rldk1vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBUVmlld0NvbnN0cnVjdG9yID0gY2xhc3MgVFZpZXcgaW1wbGVtZW50cyBJVFZpZXcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBpZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJsdWVwcmludDogTFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBxdWVyaWVzOiBUUXVlcmllc3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCwgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkYXRhOiBURGF0YSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsICAvL1xuICAgICAgcHVibGljIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJlT3JkZXJDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2xlYW51cDogYW55W118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCwgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGwsICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLCAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb25zdHM6IFRBdHRyaWJ1dGVzW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgKSB7fVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5maXJzdENoaWxkLCBidWYpO1xuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBUTm9kZUNvbnN0cnVjdG9yID0gY2xhc3MgVE5vZGUgaW1wbGVtZW50cyBJVE5vZGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyB0Vmlld186IFRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHR5cGU6IFROb2RlVHlwZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbmplY3RvckluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlRW5kOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZsYWdzOiBUTm9kZUZsYWdzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlcywgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbCwgIC8vXG4gICAgICBwdWJsaWMgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbml0aWFsSW5wdXRzOiAoc3RyaW5nW118bnVsbClbXXxudWxsfHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIG5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjaGlsZDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdHlsZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICApIHt9XG5cbiAgZ2V0IHR5cGVfKCk6IHN0cmluZyB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkNvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuQ29udGFpbmVyJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnQ6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkVsZW1lbnQnO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5JY3VDb250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkljdUNvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5Qcm9qZWN0aW9uOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5Qcm9qZWN0aW9uJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLlZpZXc6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLlZpZXcnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuPz8/JztcbiAgICB9XG4gIH1cblxuICBnZXQgZmxhZ3NfKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZmxhZ3M6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnkpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZykgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZycpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3QnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNEZXRhY2hlZCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RldGFjaGVkJyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzUHJvamVjdGVkJyk7XG4gICAgcmV0dXJuIGZsYWdzLmpvaW4oJ3wnKTtcbiAgfVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgYnVmLnB1c2goJzwnLCB0aGlzLnRhZ05hbWUgfHwgdGhpcy50eXBlXyk7XG4gICAgaWYgKHRoaXMuYXR0cnMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hdHRycy5sZW5ndGg7KSB7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gdGhpcy5hdHRyc1tpKytdO1xuICAgICAgICBpZiAodHlwZW9mIGF0dHJOYW1lID09ICdudW1iZXInKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXR0clZhbHVlID0gdGhpcy5hdHRyc1tpKytdO1xuICAgICAgICBidWYucHVzaCgnICcsIGF0dHJOYW1lIGFzIHN0cmluZywgJz1cIicsIGF0dHJWYWx1ZSBhcyBzdHJpbmcsICdcIicpO1xuICAgICAgfVxuICAgIH1cbiAgICBidWYucHVzaCgnPicpO1xuICAgIHByb2Nlc3NUTm9kZUNoaWxkcmVuKHRoaXMuY2hpbGQsIGJ1Zik7XG4gICAgYnVmLnB1c2goJzwvJywgdGhpcy50YWdOYW1lIHx8IHRoaXMudHlwZV8sICc+Jyk7XG4gICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odE5vZGU6IFROb2RlIHwgbnVsbCwgYnVmOiBzdHJpbmdbXSkge1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBidWYucHVzaCgodE5vZGUgYXMgYW55IGFze3RlbXBsYXRlXzogc3RyaW5nfSkudGVtcGxhdGVfKTtcbiAgICB0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIH1cbn1cblxuY29uc3QgVFZpZXdEYXRhID0gTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3RGF0YScpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5sZXQgVFZJRVdEQVRBX0VNUFRZOlxuICAgIHVua25vd25bXTsgIC8vIGNhbid0IGluaXRpYWxpemUgaGVyZSBvciBpdCB3aWxsIG5vdCBiZSB0cmVlIHNoYWtlbiwgYmVjYXVzZSBgTFZpZXdgXG4gICAgICAgICAgICAgICAgLy8gY29uc3RydWN0b3IgY291bGQgaGF2ZSBzaWRlLWVmZmVjdHMuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY2xvbmVzIGEgYmx1ZXByaW50IGFuZCBjcmVhdGVzIFREYXRhLlxuICpcbiAqIFNpbXBsZSBzbGljZSB3aWxsIGtlZXAgdGhlIHNhbWUgdHlwZSwgYW5kIHdlIG5lZWQgaXQgdG8gYmUgVERhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lVG9UVmlld0RhdGEobGlzdDogYW55W10pOiBURGF0YSB7XG4gIGlmIChUVklFV0RBVEFfRU1QVFkgPT09IHVuZGVmaW5lZCkgVFZJRVdEQVRBX0VNUFRZID0gbmV3IFRWaWV3RGF0YSgpO1xuICByZXR1cm4gVFZJRVdEQVRBX0VNUFRZLmNvbmNhdChsaXN0KSBhcyBhbnk7XG59XG5cbmV4cG9ydCBjb25zdCBMVmlld0JsdWVwcmludCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xWaWV3Qmx1ZXByaW50JykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBNYXRjaGVzQXJyYXkgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdNYXRjaGVzQXJyYXknKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFRWaWV3Q29tcG9uZW50cyA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3Q29tcG9uZW50cycpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVE5vZGVMb2NhbE5hbWVzID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVE5vZGVMb2NhbE5hbWVzJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUTm9kZUluaXRpYWxJbnB1dHMgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxJbnB1dHMnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbERhdGEgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxEYXRhJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBMQ2xlYW51cCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDbGVhbnVwJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUQ2xlYW51cCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RDbGVhbnVwJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsVmlldywgbmV3IExWaWV3RGVidWcobFZpZXcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxDb250YWluZXIsIG5ldyBMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3KTogTFZpZXdEZWJ1ZztcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcgfCBudWxsKTogTFZpZXdEZWJ1Z3xudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyB8IExDb250YWluZXIgfCBudWxsKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogYW55KTogYW55IHtcbiAgaWYgKG9iaikge1xuICAgIGNvbnN0IGRlYnVnID0gKG9iaiBhcyBhbnkpLmRlYnVnO1xuICAgIGFzc2VydERlZmluZWQoZGVidWcsICdPYmplY3QgZG9lcyBub3QgaGF2ZSBhIGRlYnVnIHJlcHJlc2VudGF0aW9uLicpO1xuICAgIHJldHVybiBkZWJ1ZztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG59XG5cbi8qKlxuICogVXNlIHRoaXMgbWV0aG9kIHRvIHVud3JhcCBhIG5hdGl2ZSBlbGVtZW50IGluIGBMVmlld2AgYW5kIGNvbnZlcnQgaXQgaW50byBIVE1MIGZvciBlYXNpZXJcbiAqIHJlYWRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIHBvc3NpYmx5IHdyYXBwZWQgbmF0aXZlIERPTSBub2RlLlxuICogQHBhcmFtIGluY2x1ZGVDaGlsZHJlbiBJZiBgdHJ1ZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBpbmNsdWRlIGNoaWxkIGVsZW1lbnRzIChzYW1lXG4gKiBhcyBgb3V0ZXJIVE1MYCkuIElmIGBmYWxzZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBvbmx5IGNvbnRhaW4gdGhlIGVsZW1lbnQgaXRzZWxmXG4gKiAod2lsbCBub3Qgc2VyaWFsaXplIGNoaWxkIGVsZW1lbnRzKS5cbiAqL1xuZnVuY3Rpb24gdG9IdG1sKHZhbHVlOiBhbnksIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlOiBIVE1MRWxlbWVudHxudWxsID0gdW53cmFwUk5vZGUodmFsdWUpIGFzIGFueTtcbiAgaWYgKG5vZGUpIHtcbiAgICBjb25zdCBpc1RleHROb2RlID0gbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREU7XG4gICAgY29uc3Qgb3V0ZXJIVE1MID0gKGlzVGV4dE5vZGUgPyBub2RlLnRleHRDb250ZW50IDogbm9kZS5vdXRlckhUTUwpIHx8ICcnO1xuICAgIGlmIChpbmNsdWRlQ2hpbGRyZW4gfHwgaXNUZXh0Tm9kZSkge1xuICAgICAgcmV0dXJuIG91dGVySFRNTDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5uZXJIVE1MID0gJz4nICsgbm9kZS5pbm5lckhUTUwgKyAnPCc7XG4gICAgICByZXR1cm4gKG91dGVySFRNTC5zcGxpdChpbm5lckhUTUwpWzBdKSArICc+JztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExWaWV3RGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbFZpZXc6IExWaWV3KSB7fVxuXG4gIC8qKlxuICAgKiBGbGFncyBhc3NvY2lhdGVkIHdpdGggdGhlIGBMVmlld2AgdW5wYWNrZWQgaW50byBhIG1vcmUgcmVhZGFibGUgc3RhdGUuXG4gICAqL1xuICBnZXQgZmxhZ3MoKSB7XG4gICAgY29uc3QgZmxhZ3MgPSB0aGlzLl9yYXdfbFZpZXdbRkxBR1NdO1xuICAgIHJldHVybiB7XG4gICAgICBfX3Jhd19fZmxhZ3NfXzogZmxhZ3MsXG4gICAgICBpbml0UGhhc2VTdGF0ZTogZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzayxcbiAgICAgIGNyZWF0aW9uTW9kZTogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSksXG4gICAgICBmaXJzdFZpZXdQYXNzOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpLFxuICAgICAgY2hlY2tBbHdheXM6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyksXG4gICAgICBkaXJ0eTogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkRpcnR5KSxcbiAgICAgIGF0dGFjaGVkOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpLFxuICAgICAgZGVzdHJveWVkOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSxcbiAgICAgIGlzUm9vdDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLklzUm9vdCksXG4gICAgICBpbmRleFdpdGhpbkluaXRQaGFzZTogZmxhZ3MgPj4gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0LFxuICAgIH07XG4gIH1cbiAgZ2V0IHBhcmVudCgpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W1BBUkVOVF0pOyB9XG4gIGdldCBob3N0KCk6IHN0cmluZ3xudWxsIHsgcmV0dXJuIHRvSHRtbCh0aGlzLl9yYXdfbFZpZXdbSE9TVF0sIHRydWUpOyB9XG4gIGdldCBodG1sKCk6IHN0cmluZyB7IHJldHVybiAodGhpcy5ub2RlcyB8fCBbXSkubWFwKG5vZGUgPT4gdG9IdG1sKG5vZGUubmF0aXZlLCB0cnVlKSkuam9pbignJyk7IH1cbiAgZ2V0IGNvbnRleHQoKToge318bnVsbCB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQ09OVEVYVF07IH1cbiAgLyoqXG4gICAqIFRoZSB0cmVlIG9mIG5vZGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBgTFZpZXdgLiBUaGUgbm9kZXMgaGF2ZSBiZWVuIG5vcm1hbGl6ZWQgaW50byBhXG4gICAqIHRyZWUgc3RydWN0dXJlIHdpdGggcmVsZXZhbnQgZGV0YWlscyBwdWxsZWQgb3V0IGZvciByZWFkYWJpbGl0eS5cbiAgICovXG4gIGdldCBub2RlcygpOiBEZWJ1Z05vZGVbXXxudWxsIHtcbiAgICBjb25zdCBsVmlldyA9IHRoaXMuX3Jhd19sVmlldztcbiAgICBjb25zdCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICAgIHJldHVybiB0b0RlYnVnTm9kZXModE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGdldCB0VmlldygpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tUVklFV107IH1cbiAgZ2V0IGNsZWFudXAoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQ0xFQU5VUF07IH1cbiAgZ2V0IGluamVjdG9yKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0lOSkVDVE9SXTsgfVxuICBnZXQgcmVuZGVyZXJGYWN0b3J5KCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldOyB9XG4gIGdldCByZW5kZXJlcigpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tSRU5ERVJFUl07IH1cbiAgZ2V0IHNhbml0aXplcigpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tTQU5JVElaRVJdOyB9XG4gIGdldCBjaGlsZEhlYWQoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tDSElMRF9IRUFEXSk7IH1cbiAgZ2V0IG5leHQoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tORVhUXSk7IH1cbiAgZ2V0IGNoaWxkVGFpbCgpIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX1RBSUxdKTsgfVxuICBnZXQgZGVjbGFyYXRpb25WaWV3KCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbREVDTEFSQVRJT05fVklFV10pOyB9XG4gIGdldCBxdWVyaWVzKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1FVRVJJRVNdOyB9XG4gIGdldCB0SG9zdCgpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tUX0hPU1RdOyB9XG4gIGdldCBiaW5kaW5nSW5kZXgoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQklORElOR19JTkRFWF07IH1cblxuICAvKipcbiAgICogTm9ybWFsaXplZCB2aWV3IG9mIGNoaWxkIHZpZXdzIChhbmQgY29udGFpbmVycykgYXR0YWNoZWQgYXQgdGhpcyBsb2NhdGlvbi5cbiAgICovXG4gIGdldCBjaGlsZFZpZXdzKCk6IEFycmF5PExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnPiB7XG4gICAgY29uc3QgY2hpbGRWaWV3czogQXJyYXk8TFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWc+ID0gW107XG4gICAgbGV0IGNoaWxkID0gdGhpcy5jaGlsZEhlYWQ7XG4gICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICBjaGlsZFZpZXdzLnB1c2goY2hpbGQpO1xuICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRWaWV3cztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIGh0bWw6IHN0cmluZ3xudWxsO1xuICBuYXRpdmU6IE5vZGU7XG4gIHN0eWxlczogRGVidWdOb2RlU3R5bGluZ3xudWxsO1xuICBjbGFzc2VzOiBEZWJ1Z05vZGVTdHlsaW5nfG51bGw7XG4gIG5vZGVzOiBEZWJ1Z05vZGVbXXxudWxsO1xuICBjb21wb25lbnQ6IExWaWV3RGVidWd8bnVsbDtcbn1cblxuLyoqXG4gKiBUdXJucyBhIGZsYXQgbGlzdCBvZiBub2RlcyBpbnRvIGEgdHJlZSBieSB3YWxraW5nIHRoZSBhc3NvY2lhdGVkIGBUTm9kZWAgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGVcbiAqIEBwYXJhbSBsVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1Z05vZGVzKHROb2RlOiBUTm9kZSB8IG51bGwsIGxWaWV3OiBMVmlldyk6IERlYnVnTm9kZVtdfG51bGwge1xuICBpZiAodE5vZGUpIHtcbiAgICBjb25zdCBkZWJ1Z05vZGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGxldCB0Tm9kZUN1cnNvcjogVE5vZGV8bnVsbCA9IHROb2RlO1xuICAgIHdoaWxlICh0Tm9kZUN1cnNvcikge1xuICAgICAgZGVidWdOb2Rlcy5wdXNoKGJ1aWxkRGVidWdOb2RlKHROb2RlQ3Vyc29yLCBsVmlldywgdE5vZGVDdXJzb3IuaW5kZXgpKTtcbiAgICAgIHROb2RlQ3Vyc29yID0gdE5vZGVDdXJzb3IubmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIGRlYnVnTm9kZXM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRGVidWdOb2RlKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBub2RlSW5kZXg6IG51bWJlcik6IERlYnVnTm9kZSB7XG4gIGNvbnN0IHJhd1ZhbHVlID0gbFZpZXdbbm9kZUluZGV4XTtcbiAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUocmF3VmFsdWUpO1xuICBjb25zdCBjb21wb25lbnRMVmlld0RlYnVnID0gdG9EZWJ1ZyhyZWFkTFZpZXdWYWx1ZShyYXdWYWx1ZSkpO1xuICBjb25zdCBzdHlsZXMgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLnN0eWxlcykgP1xuICAgICAgbmV3IE5vZGVTdHlsaW5nRGVidWcodE5vZGUuc3R5bGVzIGFzIGFueSBhcyBUU3R5bGluZ0NvbnRleHQsIGxWaWV3KSA6XG4gICAgICBudWxsO1xuICBjb25zdCBjbGFzc2VzID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5jbGFzc2VzKSA/XG4gICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5jbGFzc2VzIGFzIGFueSBhcyBUU3R5bGluZ0NvbnRleHQsIGxWaWV3LCB0cnVlKSA6XG4gICAgICBudWxsO1xuICByZXR1cm4ge1xuICAgIGh0bWw6IHRvSHRtbChuYXRpdmUpLFxuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSwgc3R5bGVzLCBjbGFzc2VzLFxuICAgIG5vZGVzOiB0b0RlYnVnTm9kZXModE5vZGUuY2hpbGQsIGxWaWV3KSxcbiAgICBjb21wb25lbnQ6IGNvbXBvbmVudExWaWV3RGVidWcsXG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBMQ29udGFpbmVyRGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbENvbnRhaW5lcjogTENvbnRhaW5lcikge31cblxuICBnZXQgYWN0aXZlSW5kZXgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0FDVElWRV9JTkRFWF07IH1cbiAgZ2V0IHZpZXdzKCk6IExWaWV3RGVidWdbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyLnNsaWNlKENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKVxuICAgICAgICAubWFwKHRvRGVidWcgYXMobDogTFZpZXcpID0+IExWaWV3RGVidWcpO1xuICB9XG4gIGdldCBwYXJlbnQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW1BBUkVOVF0pOyB9XG4gIGdldCBtb3ZlZFZpZXdzKCk6IExWaWV3W118bnVsbCB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltNT1ZFRF9WSUVXU107IH1cbiAgZ2V0IGhvc3QoKTogUkVsZW1lbnR8UkNvbW1lbnR8TFZpZXcgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbSE9TVF07IH1cbiAgZ2V0IG5hdGl2ZSgpOiBSQ29tbWVudCB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltOQVRJVkVdOyB9XG4gIGdldCBuZXh0KCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbENvbnRhaW5lcltORVhUXSk7IH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYExWaWV3YCB2YWx1ZSBpZiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgYExWaWV3YCBpZiBhbnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRMVmlld1ZhbHVlKHZhbHVlOiBhbnkpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gVGhpcyBjaGVjayBpcyBub3QgcXVpdGUgcmlnaHQsIGFzIGl0IGRvZXMgbm90IHRha2UgaW50byBhY2NvdW50IGBTdHlsaW5nQ29udGV4dGBcbiAgICAvLyBUaGlzIGlzIHdoeSBpdCBpcyBpbiBkZWJ1Zywgbm90IGluIHV0aWwudHNcbiAgICBpZiAodmFsdWUubGVuZ3RoID49IEhFQURFUl9PRkZTRVQgLSAxKSByZXR1cm4gdmFsdWUgYXMgTFZpZXc7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIEkxOE5EZWJ1Z0l0ZW0ge1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG5cbiAgZ2V0IHROb2RlKCkgeyByZXR1cm4gZ2V0VE5vZGUodGhpcy5ub2RlSW5kZXgsIHRoaXMuX2xWaWV3KTsgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIF9fcmF3X29wQ29kZTogYW55LCBwcml2YXRlIF9sVmlldzogTFZpZXcsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlcixcbiAgICAgIHB1YmxpYyB0eXBlOiBzdHJpbmcpIHt9XG59XG5cbi8qKlxuICogVHVybnMgYSBsaXN0IG9mIFwiQ3JlYXRlXCIgJiBcIlVwZGF0ZVwiIE9wQ29kZXMgaW50byBhIGh1bWFuLXJlYWRhYmxlIGxpc3Qgb2Ygb3BlcmF0aW9ucyBmb3JcbiAqIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBtdXRhdGVPcENvZGVzIG11dGF0aW9uIG9wQ29kZXMgdG8gcmVhZFxuICogQHBhcmFtIHVwZGF0ZU9wQ29kZXMgdXBkYXRlIG9wQ29kZXMgdG8gcmVhZFxuICogQHBhcmFtIGljdXMgbGlzdCBvZiBJQ1UgZXhwcmVzc2lvbnNcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0aGUgb3BDb2RlcyBhcmUgYWN0aW5nIG9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hJMThuT3BDb2Rlc0RlYnVnKFxuICAgIG11dGF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCxcbiAgICBsVmlldzogTFZpZXcpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobXV0YXRlT3BDb2RlcywgbmV3IEkxOG5NdXRhdGVPcENvZGVzRGVidWcobXV0YXRlT3BDb2RlcywgbFZpZXcpKTtcbiAgYXR0YWNoRGVidWdPYmplY3QodXBkYXRlT3BDb2RlcywgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcodXBkYXRlT3BDb2RlcywgaWN1cywgbFZpZXcpKTtcblxuICBpZiAoaWN1cykge1xuICAgIGljdXMuZm9yRWFjaChpY3UgPT4ge1xuICAgICAgaWN1LmNyZWF0ZS5mb3JFYWNoKFxuICAgICAgICAgIGljdUNhc2UgPT4geyBhdHRhY2hEZWJ1Z09iamVjdChpY3VDYXNlLCBuZXcgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyhpY3VDYXNlLCBsVmlldykpOyB9KTtcbiAgICAgIGljdS51cGRhdGUuZm9yRWFjaChpY3VDYXNlID0+IHtcbiAgICAgICAgYXR0YWNoRGVidWdPYmplY3QoaWN1Q2FzZSwgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcoaWN1Q2FzZSwgaWN1cywgbFZpZXcpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnIGltcGxlbWVudHMgSTE4bk9wQ29kZXNEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX19yYXdfb3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIHByaXZhdGUgcmVhZG9ubHkgX19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBvcGVyYXRpb24gaW5mb3JtYXRpb24gYWJvdXQgaG93IHRoZSBPcENvZGVzIHdpbGwgYWN0IG9uIHRoZSB2aWV3LlxuICAgKi9cbiAgZ2V0IG9wZXJhdGlvbnMoKSB7XG4gICAgY29uc3Qge19fbFZpZXcsIF9fcmF3X29wQ29kZXN9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBfX3Jhd19vcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvcENvZGUgPSBfX3Jhd19vcENvZGVzW2ldO1xuICAgICAgbGV0IHJlc3VsdDogYW55O1xuICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICB0eXBlOiAnQ3JlYXRlIFRleHQgTm9kZScsXG4gICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgdGV4dDogb3BDb2RlLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBkZXN0aW5hdGlvbk5vZGVJbmRleCwgJ0FwcGVuZENoaWxkJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnU2VsZWN0Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZDpcbiAgICAgICAgICAgIGxldCBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBlbGVtZW50SW5kZXgsICdFbGVtZW50RW5kJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgIGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGVsZW1lbnRJbmRleCwgJ0F0dHInKTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0ck5hbWUnXSA9IF9fcmF3X29wQ29kZXNbKytpXTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0clZhbHVlJ10gPSBfX3Jhd19vcENvZGVzWysraV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICBzd2l0Y2ggKG9wQ29kZSkge1xuICAgICAgICAgIGNhc2UgQ09NTUVOVF9NQVJLRVI6XG4gICAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICB0eXBlOiAnQ09NTUVOVF9NQVJLRVInLFxuICAgICAgICAgICAgICBjb21tZW50VmFsdWU6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgIHR5cGU6ICdFTEVNRU5UX01BUktFUicsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgIHR5cGU6ICdVbmtub3duIE9wIENvZGUnLFxuICAgICAgICAgIGNvZGU6IG9wQ29kZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEkxOG5VcGRhdGVPcENvZGVzRGVidWcgaW1wbGVtZW50cyBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9fcmF3X29wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBwcml2YXRlIHJlYWRvbmx5IGljdXM6IFRJY3VbXXxudWxsLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfX2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogQSBsaXN0IG9mIG9wZXJhdGlvbiBpbmZvcm1hdGlvbiBhYm91dCBob3cgdGhlIE9wQ29kZXMgd2lsbCBhY3Qgb24gdGhlIHZpZXcuXG4gICAqL1xuICBnZXQgb3BlcmF0aW9ucygpIHtcbiAgICBjb25zdCB7X19sVmlldywgX19yYXdfb3BDb2RlcywgaWN1c30gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9fcmF3X29wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICAgIGNvbnN0IGNoZWNrQml0ID0gX19yYXdfb3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgICAgY29uc3Qgc2tpcENvZGVzID0gX19yYXdfb3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IF9fcmF3X29wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlICs9IG9wQ29kZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKG9wQ29kZSA8IDApIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBiaW5kaW5nIGluZGV4IHdob3NlIHZhbHVlIGlzIG5lZ2F0aXZlXG4gICAgICAgICAgICAvLyBXZSBjYW5ub3Qga25vdyB0aGUgdmFsdWUgb2YgdGhlIGJpbmRpbmcgc28gd2Ugb25seSBzaG93IHRoZSBpbmRleFxuICAgICAgICAgICAgdmFsdWUgKz0gYO+/vSR7LW9wQ29kZSAtIDF977+9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIGxldCB0SWN1SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCB0SWN1OiBUSWN1O1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gX19yYXdfb3BDb2Rlc1srK2pdO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ0F0dHInLFxuICAgICAgICAgICAgICAgICAgYXR0clZhbHVlOiB2YWx1ZSwgYXR0ck5hbWUsIHNhbml0aXplRm4sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ1RleHQnLCBub2RlSW5kZXgsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiB2YWx1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaDpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdJY3VTd2l0Y2gnKTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3VJbmRleCddID0gdEljdUluZGV4O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnY2hlY2tCaXQnXSA9IGNoZWNrQml0O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnbWFpbkJpbmRpbmcnXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdSddID0gdEljdTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ0ljdVVwZGF0ZScpO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdUluZGV4J10gPSB0SWN1SW5kZXg7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydjaGVja0JpdCddID0gY2hlY2tCaXQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1J10gPSB0SWN1O1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaSArPSBza2lwQ29kZXM7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSTE4bk9wQ29kZXNEZWJ1ZyB7IG9wZXJhdGlvbnM6IGFueVtdOyB9XG4iXX0=