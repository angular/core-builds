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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxZQUFZLEVBQUUsdUJBQXVCLEVBQWMsV0FBVyxFQUFFLE1BQU0sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRS9HLE9BQU8sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFpRixNQUFNLG9CQUFvQixDQUFDO0FBTWxKLE9BQU8sRUFBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUF1QixLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBWSxRQUFRLEVBQXFCLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQVMsS0FBSyxFQUEwQixNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNqVCxPQUFPLEVBQWtDLGdCQUFnQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDM0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkQsT0FBTyxFQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV6RCxJQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsT0FBTyxTQUFT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ekMsSUFBSSxHQUFHLElBQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQ0FDekIsSUFBSSxNQUFNLEdBQUcsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7b0NBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxTQUFTLENBQUM7b0NBQ2hDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxRQUFRLENBQUM7b0NBQzlCLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUM7b0NBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7b0NBQ3RCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0NBQ3JCLE1BQU07Z0NBQ1I7b0NBQ0UsU0FBUyxHQUFHLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBVyxDQUFDO29DQUN6QyxJQUFJLEdBQUcsSUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29DQUN6QixNQUFNLEdBQUcsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7b0NBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxTQUFTLENBQUM7b0NBQ2hDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxRQUFRLENBQUM7b0NBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7b0NBQ3RCLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0NBQ3JCLE1BQU07NkJBQ1Q7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7Z0JBQ0QsQ0FBQyxJQUFJLFNBQVMsQ0FBQzthQUNoQjtZQUNELE9BQU8sT0FBTyxDQUFDO1FBQ2pCLENBQUM7OztPQUFBO0lBQ0gsNkJBQUM7QUFBRCxDQUFDLEFBN0VELElBNkVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgQ29tcG9uZW50VGVtcGxhdGV9IGZyb20gJy4uJztcbmltcG9ydCB7U2NoZW1hTWV0YWRhdGF9IGZyb20gJy4uLy4uL2NvcmUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2NyZWF0ZU5hbWVkQXJyYXlUeXBlfSBmcm9tICcuLi8uLi91dGlsL25hbWVkX2FycmF5X3R5cGUnO1xuaW1wb3J0IHtpbml0TmdEZXZNb2RlfSBmcm9tICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1MsIE5BVElWRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdCwgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBJMThuTXV0YXRlT3BDb2RlLCBJMThuTXV0YXRlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIFRJY3V9IGZyb20gJy4uL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1Byb3BlcnR5QWxpYXNlcywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUgYXMgSVROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTZWxlY3RvckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtUUXVlcmllc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIb29rRGF0YSwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBTQU5JVElaRVIsIFREYXRhLCBUVklFVywgVFZpZXcgYXMgSVRWaWV3LCBUVmlldywgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z1N0eWxpbmcgYXMgRGVidWdOZXdTdHlsaW5nLCBOb2RlU3R5bGluZ0RlYnVnfSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldFROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuY29uc3QgTkdfREVWX01PREUgPSAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8ICEhbmdEZXZNb2RlKSAmJiBpbml0TmdEZXZNb2RlKCkpO1xuXG4vKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGNvbmRpdGlvbmFsbHkgYXR0YWNoZWQgY2xhc3NlcyB3aGljaCBwcm92aWRlIGh1bWFuIHJlYWRhYmxlIChkZWJ1ZykgbGV2ZWxcbiAqIGluZm9ybWF0aW9uIGZvciBgTFZpZXdgLCBgTENvbnRhaW5lcmAgYW5kIG90aGVyIGludGVybmFsIGRhdGEgc3RydWN0dXJlcy4gVGhlc2UgZGF0YSBzdHJ1Y3R1cmVzXG4gKiBhcmUgc3RvcmVkIGludGVybmFsbHkgYXMgYXJyYXkgd2hpY2ggbWFrZXMgaXQgdmVyeSBkaWZmaWN1bHQgZHVyaW5nIGRlYnVnZ2luZyB0byByZWFzb24gYWJvdXQgdGhlXG4gKiBjdXJyZW50IHN0YXRlIG9mIHRoZSBzeXN0ZW0uXG4gKlxuICogUGF0Y2hpbmcgdGhlIGFycmF5IHdpdGggZXh0cmEgcHJvcGVydHkgZG9lcyBjaGFuZ2UgdGhlIGFycmF5J3MgaGlkZGVuIGNsYXNzJyBidXQgaXQgZG9lcyBub3RcbiAqIGNoYW5nZSB0aGUgY29zdCBvZiBhY2Nlc3MsIHRoZXJlZm9yZSB0aGlzIHBhdGNoaW5nIHNob3VsZCBub3QgaGF2ZSBzaWduaWZpY2FudCBpZiBhbnkgaW1wYWN0IGluXG4gKiBgbmdEZXZNb2RlYCBtb2RlLiAoc2VlOiBodHRwczovL2pzcGVyZi5jb20vYXJyYXktdnMtbW9ua2V5LXBhdGNoLWFycmF5KVxuICpcbiAqIFNvIGluc3RlYWQgb2Ygc2VlaW5nOlxuICogYGBgXG4gKiBBcnJheSgzMCkgW09iamVjdCwgNjU5LCBudWxsLCDigKZdXG4gKiBgYGBcbiAqXG4gKiBZb3UgZ2V0IHRvIHNlZTpcbiAqIGBgYFxuICogTFZpZXdEZWJ1ZyB7XG4gKiAgIHZpZXdzOiBbLi4uXSxcbiAqICAgZmxhZ3M6IHthdHRhY2hlZDogdHJ1ZSwgLi4ufVxuICogICBub2RlczogW1xuICogICAgIHtodG1sOiAnPGRpdiBpZD1cIjEyM1wiPicsIC4uLiwgbm9kZXM6IFtcbiAqICAgICAgIHtodG1sOiAnPHNwYW4+JywgLi4uLCBub2RlczogbnVsbH1cbiAqICAgICBdfVxuICogICBdXG4gKiB9XG4gKiBgYGBcbiAqL1xuXG5leHBvcnQgY29uc3QgTFZpZXdBcnJheSA9IE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMVmlldycpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5sZXQgTFZJRVdfRU1QVFk6IHVua25vd25bXTsgIC8vIGNhbid0IGluaXRpYWxpemUgaGVyZSBvciBpdCB3aWxsIG5vdCBiZSB0cmVlIHNoYWtlbiwgYmVjYXVzZSBgTFZpZXdgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0cnVjdG9yIGNvdWxkIGhhdmUgc2lkZS1lZmZlY3RzLlxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNsb25lcyBhIGJsdWVwcmludCBhbmQgY3JlYXRlcyBMVmlldy5cbiAqXG4gKiBTaW1wbGUgc2xpY2Ugd2lsbCBrZWVwIHRoZSBzYW1lIHR5cGUsIGFuZCB3ZSBuZWVkIGl0IHRvIGJlIExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZVRvTFZpZXcobGlzdDogYW55W10pOiBMVmlldyB7XG4gIGlmIChMVklFV19FTVBUWSA9PT0gdW5kZWZpbmVkKSBMVklFV19FTVBUWSA9IG5ldyBMVmlld0FycmF5KCk7XG4gIHJldHVybiBMVklFV19FTVBUWS5jb25jYXQobGlzdCkgYXMgYW55O1xufVxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgYSBkZWJ1ZyB2ZXJzaW9uIG9mIE9iamVjdCBsaXRlcmFsIHNvIHRoYXQgd2UgY2FuIGhhdmUgY29uc3RydWN0b3IgbmFtZSBzaG93IHVwIGluXG4gKiBkZWJ1ZyB0b29scyBpbiBuZ0Rldk1vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBUVmlld0NvbnN0cnVjdG9yID0gY2xhc3MgVFZpZXcgaW1wbGVtZW50cyBJVFZpZXcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBpZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJsdWVwcmludDogTFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBxdWVyaWVzOiBUUXVlcmllc3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCwgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkYXRhOiBURGF0YSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsICAvL1xuICAgICAgcHVibGljIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJlT3JkZXJDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2xlYW51cDogYW55W118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCwgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGwsICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLCAgICAgICAgICAgICAgICAgLy9cbiAgICAgICkge31cblxuICBnZXQgdGVtcGxhdGVfKCk6IHN0cmluZyB7XG4gICAgY29uc3QgYnVmOiBzdHJpbmdbXSA9IFtdO1xuICAgIHByb2Nlc3NUTm9kZUNoaWxkcmVuKHRoaXMuZmlyc3RDaGlsZCwgYnVmKTtcbiAgICByZXR1cm4gYnVmLmpvaW4oJycpO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgVE5vZGVDb25zdHJ1Y3RvciA9IGNsYXNzIFROb2RlIGltcGxlbWVudHMgSVROb2RlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgdFZpZXdfOiBUVmlldywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0eXBlOiBUTm9kZVR5cGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5qZWN0b3JJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVTdGFydDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZUVuZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBmbGFnczogVE5vZGVGbGFncywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdGFnTmFtZTogc3RyaW5nfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBhdHRyczogKHN0cmluZ3xBdHRyaWJ1dGVNYXJrZXJ8KHN0cmluZ3xTZWxlY3RvckZsYWdzKVtdKVtdfG51bGwsICAvL1xuICAgICAgcHVibGljIGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5pdGlhbElucHV0czogKHN0cmluZ1tdfG51bGwpW118bnVsbHx1bmRlZmluZWQsICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbnB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZCwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdFZpZXdzOiBJVFZpZXd8SVRWaWV3W118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBuZXh0OiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb2plY3Rpb25OZXh0OiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2hpbGQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb2plY3Rpb246IG51bWJlcnwoSVROb2RlfFJOb2RlW10pW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3R5bGVzOiBUU3R5bGluZ0NvbnRleHR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGFzc2VzOiBUU3R5bGluZ0NvbnRleHR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgKSB7fVxuXG4gIGdldCB0eXBlXygpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICBjYXNlIFROb2RlVHlwZS5Db250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkNvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5FbGVtZW50JztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5JY3VDb250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuUHJvamVjdGlvbjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuUHJvamVjdGlvbic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5WaWV3OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5WaWV3JztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLj8/Pyc7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZsYWdzXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZsYWdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeScpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmcpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmcnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3QpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGV0YWNoZWQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNEZXRhY2hlZCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc1Byb2plY3RlZCcpO1xuICAgIHJldHVybiBmbGFncy5qb2luKCd8Jyk7XG4gIH1cblxuICBnZXQgdGVtcGxhdGVfKCk6IHN0cmluZyB7XG4gICAgY29uc3QgYnVmOiBzdHJpbmdbXSA9IFtdO1xuICAgIGJ1Zi5wdXNoKCc8JywgdGhpcy50YWdOYW1lIHx8IHRoaXMudHlwZV8pO1xuICAgIGlmICh0aGlzLmF0dHJzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXR0cnMubGVuZ3RoOykge1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHRoaXMuYXR0cnNbaSsrXTtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyTmFtZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IHRoaXMuYXR0cnNbaSsrXTtcbiAgICAgICAgYnVmLnB1c2goJyAnLCBhdHRyTmFtZSBhcyBzdHJpbmcsICc9XCInLCBhdHRyVmFsdWUgYXMgc3RyaW5nLCAnXCInKTtcbiAgICAgIH1cbiAgICB9XG4gICAgYnVmLnB1c2goJz4nKTtcbiAgICBwcm9jZXNzVE5vZGVDaGlsZHJlbih0aGlzLmNoaWxkLCBidWYpO1xuICAgIGJ1Zi5wdXNoKCc8LycsIHRoaXMudGFnTmFtZSB8fCB0aGlzLnR5cGVfLCAnPicpO1xuICAgIHJldHVybiBidWYuam9pbignJyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHByb2Nlc3NUTm9kZUNoaWxkcmVuKHROb2RlOiBUTm9kZSB8IG51bGwsIGJ1Zjogc3RyaW5nW10pIHtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgYnVmLnB1c2goKHROb2RlIGFzIGFueSBhc3t0ZW1wbGF0ZV86IHN0cmluZ30pLnRlbXBsYXRlXyk7XG4gICAgdE5vZGUgPSB0Tm9kZS5uZXh0O1xuICB9XG59XG5cbmNvbnN0IFRWaWV3RGF0YSA9IE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUVmlld0RhdGEnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xubGV0IFRWSUVXREFUQV9FTVBUWTpcbiAgICB1bmtub3duW107ICAvLyBjYW4ndCBpbml0aWFsaXplIGhlcmUgb3IgaXQgd2lsbCBub3QgYmUgdHJlZSBzaGFrZW4sIGJlY2F1c2UgYExWaWV3YFxuICAgICAgICAgICAgICAgIC8vIGNvbnN0cnVjdG9yIGNvdWxkIGhhdmUgc2lkZS1lZmZlY3RzLlxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNsb25lcyBhIGJsdWVwcmludCBhbmQgY3JlYXRlcyBURGF0YS5cbiAqXG4gKiBTaW1wbGUgc2xpY2Ugd2lsbCBrZWVwIHRoZSBzYW1lIHR5cGUsIGFuZCB3ZSBuZWVkIGl0IHRvIGJlIFREYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZVRvVFZpZXdEYXRhKGxpc3Q6IGFueVtdKTogVERhdGEge1xuICBpZiAoVFZJRVdEQVRBX0VNUFRZID09PSB1bmRlZmluZWQpIFRWSUVXREFUQV9FTVBUWSA9IG5ldyBUVmlld0RhdGEoKTtcbiAgcmV0dXJuIFRWSUVXREFUQV9FTVBUWS5jb25jYXQobGlzdCkgYXMgYW55O1xufVxuXG5leHBvcnQgY29uc3QgTFZpZXdCbHVlcHJpbnQgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMVmlld0JsdWVwcmludCcpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgTWF0Y2hlc0FycmF5ID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTWF0Y2hlc0FycmF5JykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUVmlld0NvbXBvbmVudHMgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUVmlld0NvbXBvbmVudHMnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFROb2RlTG9jYWxOYW1lcyA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlTG9jYWxOYW1lcycpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVE5vZGVJbml0aWFsSW5wdXRzID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVE5vZGVJbml0aWFsSW5wdXRzJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUTm9kZUluaXRpYWxEYXRhID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVE5vZGVJbml0aWFsRGF0YScpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgTENsZWFudXAgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMQ2xlYW51cCcpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVENsZWFudXAgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUQ2xlYW51cCcpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoTFZpZXdEZWJ1ZyhsVmlldzogTFZpZXcpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobFZpZXcsIG5ldyBMVmlld0RlYnVnKGxWaWV3KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsQ29udGFpbmVyLCBuZXcgTENvbnRhaW5lckRlYnVnKGxDb250YWluZXIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyk6IExWaWV3RGVidWc7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3IHwgbnVsbCk6IExWaWV3RGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcgfCBMQ29udGFpbmVyIHwgbnVsbCk6IExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IGFueSk6IGFueSB7XG4gIGlmIChvYmopIHtcbiAgICBjb25zdCBkZWJ1ZyA9IChvYmogYXMgYW55KS5kZWJ1ZztcbiAgICBhc3NlcnREZWZpbmVkKGRlYnVnLCAnT2JqZWN0IGRvZXMgbm90IGhhdmUgYSBkZWJ1ZyByZXByZXNlbnRhdGlvbi4nKTtcbiAgICByZXR1cm4gZGVidWc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxufVxuXG4vKipcbiAqIFVzZSB0aGlzIG1ldGhvZCB0byB1bndyYXAgYSBuYXRpdmUgZWxlbWVudCBpbiBgTFZpZXdgIGFuZCBjb252ZXJ0IGl0IGludG8gSFRNTCBmb3IgZWFzaWVyXG4gKiByZWFkaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBwb3NzaWJseSB3cmFwcGVkIG5hdGl2ZSBET00gbm9kZS5cbiAqIEBwYXJhbSBpbmNsdWRlQ2hpbGRyZW4gSWYgYHRydWVgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgaW5jbHVkZSBjaGlsZCBlbGVtZW50cyAoc2FtZVxuICogYXMgYG91dGVySFRNTGApLiBJZiBgZmFsc2VgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgb25seSBjb250YWluIHRoZSBlbGVtZW50IGl0c2VsZlxuICogKHdpbGwgbm90IHNlcmlhbGl6ZSBjaGlsZCBlbGVtZW50cykuXG4gKi9cbmZ1bmN0aW9uIHRvSHRtbCh2YWx1ZTogYW55LCBpbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3Qgbm9kZTogSFRNTEVsZW1lbnR8bnVsbCA9IHVud3JhcFJOb2RlKHZhbHVlKSBhcyBhbnk7XG4gIGlmIChub2RlKSB7XG4gICAgY29uc3QgaXNUZXh0Tm9kZSA9IG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFO1xuICAgIGNvbnN0IG91dGVySFRNTCA9IChpc1RleHROb2RlID8gbm9kZS50ZXh0Q29udGVudCA6IG5vZGUub3V0ZXJIVE1MKSB8fCAnJztcbiAgICBpZiAoaW5jbHVkZUNoaWxkcmVuIHx8IGlzVGV4dE5vZGUpIHtcbiAgICAgIHJldHVybiBvdXRlckhUTUw7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlubmVySFRNTCA9ICc+JyArIG5vZGUuaW5uZXJIVE1MICsgJzwnO1xuICAgICAgcmV0dXJuIChvdXRlckhUTUwuc3BsaXQoaW5uZXJIVE1MKVswXSkgKyAnPic7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMVmlld0RlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfcmF3X2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogRmxhZ3MgYXNzb2NpYXRlZCB3aXRoIHRoZSBgTFZpZXdgIHVucGFja2VkIGludG8gYSBtb3JlIHJlYWRhYmxlIHN0YXRlLlxuICAgKi9cbiAgZ2V0IGZsYWdzKCkge1xuICAgIGNvbnN0IGZsYWdzID0gdGhpcy5fcmF3X2xWaWV3W0ZMQUdTXTtcbiAgICByZXR1cm4ge1xuICAgICAgX19yYXdfX2ZsYWdzX186IGZsYWdzLFxuICAgICAgaW5pdFBoYXNlU3RhdGU6IGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2ssXG4gICAgICBjcmVhdGlvbk1vZGU6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpLFxuICAgICAgZmlyc3RWaWV3UGFzczogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSxcbiAgICAgIGNoZWNrQWx3YXlzOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpLFxuICAgICAgZGlydHk6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EaXJ0eSksXG4gICAgICBhdHRhY2hlZDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSxcbiAgICAgIGRlc3Ryb3llZDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCksXG4gICAgICBpc1Jvb3Q6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5Jc1Jvb3QpLFxuICAgICAgaW5kZXhXaXRoaW5Jbml0UGhhc2U6IGZsYWdzID4+IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VTaGlmdCxcbiAgICB9O1xuICB9XG4gIGdldCBwYXJlbnQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tQQVJFTlRdKTsgfVxuICBnZXQgaG9zdCgpOiBzdHJpbmd8bnVsbCB7IHJldHVybiB0b0h0bWwodGhpcy5fcmF3X2xWaWV3W0hPU1RdLCB0cnVlKTsgfVxuICBnZXQgaHRtbCgpOiBzdHJpbmcgeyByZXR1cm4gKHRoaXMubm9kZXMgfHwgW10pLm1hcChub2RlID0+IHRvSHRtbChub2RlLm5hdGl2ZSwgdHJ1ZSkpLmpvaW4oJycpOyB9XG4gIGdldCBjb250ZXh0KCk6IHt9fG51bGwgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0NPTlRFWFRdOyB9XG4gIC8qKlxuICAgKiBUaGUgdHJlZSBvZiBub2RlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC4gVGhlIG5vZGVzIGhhdmUgYmVlbiBub3JtYWxpemVkIGludG8gYVxuICAgKiB0cmVlIHN0cnVjdHVyZSB3aXRoIHJlbGV2YW50IGRldGFpbHMgcHVsbGVkIG91dCBmb3IgcmVhZGFiaWxpdHkuXG4gICAqL1xuICBnZXQgbm9kZXMoKTogRGVidWdOb2RlW118bnVsbCB7XG4gICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yYXdfbFZpZXc7XG4gICAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgICByZXR1cm4gdG9EZWJ1Z05vZGVzKHROb2RlLCBsVmlldyk7XG4gIH1cblxuICBnZXQgdFZpZXcoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbVFZJRVddOyB9XG4gIGdldCBjbGVhbnVwKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0NMRUFOVVBdOyB9XG4gIGdldCBpbmplY3RvcigpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tJTkpFQ1RPUl07IH1cbiAgZ2V0IHJlbmRlcmVyRmFjdG9yeSgpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tSRU5ERVJFUl9GQUNUT1JZXTsgfVxuICBnZXQgcmVuZGVyZXIoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJdOyB9XG4gIGdldCBzYW5pdGl6ZXIoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbU0FOSVRJWkVSXTsgfVxuICBnZXQgY2hpbGRIZWFkKCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbQ0hJTERfSEVBRF0pOyB9XG4gIGdldCBuZXh0KCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbTkVYVF0pOyB9XG4gIGdldCBjaGlsZFRhaWwoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tDSElMRF9UQUlMXSk7IH1cbiAgZ2V0IGRlY2xhcmF0aW9uVmlldygpIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddKTsgfVxuICBnZXQgcXVlcmllcygpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tRVUVSSUVTXTsgfVxuICBnZXQgdEhvc3QoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbVF9IT1NUXTsgfVxuICBnZXQgYmluZGluZ0luZGV4KCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0JJTkRJTkdfSU5ERVhdOyB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZWQgdmlldyBvZiBjaGlsZCB2aWV3cyAoYW5kIGNvbnRhaW5lcnMpIGF0dGFjaGVkIGF0IHRoaXMgbG9jYXRpb24uXG4gICAqL1xuICBnZXQgY2hpbGRWaWV3cygpOiBBcnJheTxMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Zz4ge1xuICAgIGNvbnN0IGNoaWxkVmlld3M6IEFycmF5PExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnPiA9IFtdO1xuICAgIGxldCBjaGlsZCA9IHRoaXMuY2hpbGRIZWFkO1xuICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgY2hpbGRWaWV3cy5wdXNoKGNoaWxkKTtcbiAgICAgIGNoaWxkID0gY2hpbGQubmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkVmlld3M7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGUge1xuICBodG1sOiBzdHJpbmd8bnVsbDtcbiAgbmF0aXZlOiBOb2RlO1xuICBzdHlsZXM6IERlYnVnTmV3U3R5bGluZ3xudWxsO1xuICBjbGFzc2VzOiBEZWJ1Z05ld1N0eWxpbmd8bnVsbDtcbiAgbm9kZXM6IERlYnVnTm9kZVtdfG51bGw7XG4gIGNvbXBvbmVudDogTFZpZXdEZWJ1Z3xudWxsO1xufVxuXG4vKipcbiAqIFR1cm5zIGEgZmxhdCBsaXN0IG9mIG5vZGVzIGludG8gYSB0cmVlIGJ5IHdhbGtpbmcgdGhlIGFzc29jaWF0ZWQgYFROb2RlYCB0cmVlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnTm9kZXModE5vZGU6IFROb2RlIHwgbnVsbCwgbFZpZXc6IExWaWV3KTogRGVidWdOb2RlW118bnVsbCB7XG4gIGlmICh0Tm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgbGV0IHROb2RlQ3Vyc29yOiBUTm9kZXxudWxsID0gdE5vZGU7XG4gICAgd2hpbGUgKHROb2RlQ3Vyc29yKSB7XG4gICAgICBkZWJ1Z05vZGVzLnB1c2goYnVpbGREZWJ1Z05vZGUodE5vZGVDdXJzb3IsIGxWaWV3LCB0Tm9kZUN1cnNvci5pbmRleCkpO1xuICAgICAgdE5vZGVDdXJzb3IgPSB0Tm9kZUN1cnNvci5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gZGVidWdOb2RlcztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGREZWJ1Z05vZGUodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyKTogRGVidWdOb2RlIHtcbiAgY29uc3QgcmF3VmFsdWUgPSBsVmlld1tub2RlSW5kZXhdO1xuICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShyYXdWYWx1ZSk7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3RGVidWcgPSB0b0RlYnVnKHJlYWRMVmlld1ZhbHVlKHJhd1ZhbHVlKSk7XG4gIGNvbnN0IHN0eWxlcyA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuc3R5bGVzKSA/XG4gICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5zdHlsZXMgYXMgYW55IGFzIFRTdHlsaW5nQ29udGV4dCwgbFZpZXcpIDpcbiAgICAgIG51bGw7XG4gIGNvbnN0IGNsYXNzZXMgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLmNsYXNzZXMpID9cbiAgICAgIG5ldyBOb2RlU3R5bGluZ0RlYnVnKHROb2RlLmNsYXNzZXMgYXMgYW55IGFzIFRTdHlsaW5nQ29udGV4dCwgbFZpZXcsIHRydWUpIDpcbiAgICAgIG51bGw7XG4gIHJldHVybiB7XG4gICAgaHRtbDogdG9IdG1sKG5hdGl2ZSksXG4gICAgbmF0aXZlOiBuYXRpdmUgYXMgYW55LCBzdHlsZXMsIGNsYXNzZXMsXG4gICAgbm9kZXM6IHRvRGVidWdOb2Rlcyh0Tm9kZS5jaGlsZCwgbFZpZXcpLFxuICAgIGNvbXBvbmVudDogY29tcG9uZW50TFZpZXdEZWJ1ZyxcbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIExDb250YWluZXJEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7fVxuXG4gIGdldCBhY3RpdmVJbmRleCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbQUNUSVZFX0lOREVYXTsgfVxuICBnZXQgdmlld3MoKTogTFZpZXdEZWJ1Z1tdIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXIuc2xpY2UoQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpXG4gICAgICAgIC5tYXAodG9EZWJ1ZyBhcyhsOiBMVmlldykgPT4gTFZpZXdEZWJ1Zyk7XG4gIH1cbiAgZ2V0IHBhcmVudCgpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xDb250YWluZXJbUEFSRU5UXSk7IH1cbiAgZ2V0IG1vdmVkVmlld3MoKTogTFZpZXdbXXxudWxsIHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW01PVkVEX1ZJRVdTXTsgfVxuICBnZXQgaG9zdCgpOiBSRWxlbWVudHxSQ29tbWVudHxMVmlldyB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltIT1NUXTsgfVxuICBnZXQgbmF0aXZlKCk6IFJDb21tZW50IHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW05BVElWRV07IH1cbiAgZ2V0IG5leHQoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW05FWFRdKTsgfVxufVxuXG4vKipcbiAqIFJldHVybiBhbiBgTFZpZXdgIHZhbHVlIGlmIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBgTFZpZXdgIGlmIGFueVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZExWaWV3VmFsdWUodmFsdWU6IGFueSk6IExWaWV3fG51bGwge1xuICB3aGlsZSAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAvLyBUaGlzIGNoZWNrIGlzIG5vdCBxdWl0ZSByaWdodCwgYXMgaXQgZG9lcyBub3QgdGFrZSBpbnRvIGFjY291bnQgYFN0eWxpbmdDb250ZXh0YFxuICAgIC8vIFRoaXMgaXMgd2h5IGl0IGlzIGluIGRlYnVnLCBub3QgaW4gdXRpbC50c1xuICAgIGlmICh2YWx1ZS5sZW5ndGggPj0gSEVBREVSX09GRlNFVCAtIDEpIHJldHVybiB2YWx1ZSBhcyBMVmlldztcbiAgICB2YWx1ZSA9IHZhbHVlW0hPU1RdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgSTE4TkRlYnVnSXRlbSB7XG4gIFtrZXk6IHN0cmluZ106IGFueTtcblxuICBnZXQgdE5vZGUoKSB7IHJldHVybiBnZXRUTm9kZSh0aGlzLm5vZGVJbmRleCwgdGhpcy5fbFZpZXcpOyB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgX19yYXdfb3BDb2RlOiBhbnksIHByaXZhdGUgX2xWaWV3OiBMVmlldywgcHVibGljIG5vZGVJbmRleDogbnVtYmVyLFxuICAgICAgcHVibGljIHR5cGU6IHN0cmluZykge31cbn1cblxuLyoqXG4gKiBUdXJucyBhIGxpc3Qgb2YgXCJDcmVhdGVcIiAmIFwiVXBkYXRlXCIgT3BDb2RlcyBpbnRvIGEgaHVtYW4tcmVhZGFibGUgbGlzdCBvZiBvcGVyYXRpb25zIGZvclxuICogZGVidWdnaW5nIHB1cnBvc2VzLlxuICogQHBhcmFtIG11dGF0ZU9wQ29kZXMgbXV0YXRpb24gb3BDb2RlcyB0byByZWFkXG4gKiBAcGFyYW0gdXBkYXRlT3BDb2RlcyB1cGRhdGUgb3BDb2RlcyB0byByZWFkXG4gKiBAcGFyYW0gaWN1cyBsaXN0IG9mIElDVSBleHByZXNzaW9uc1xuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRoZSBvcENvZGVzIGFyZSBhY3Rpbmcgb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaEkxOG5PcENvZGVzRGVidWcoXG4gICAgbXV0YXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBpY3VzOiBUSWN1W10gfCBudWxsLFxuICAgIGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChtdXRhdGVPcENvZGVzLCBuZXcgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyhtdXRhdGVPcENvZGVzLCBsVmlldykpO1xuICBhdHRhY2hEZWJ1Z09iamVjdCh1cGRhdGVPcENvZGVzLCBuZXcgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1Zyh1cGRhdGVPcENvZGVzLCBpY3VzLCBsVmlldykpO1xuXG4gIGlmIChpY3VzKSB7XG4gICAgaWN1cy5mb3JFYWNoKGljdSA9PiB7XG4gICAgICBpY3UuY3JlYXRlLmZvckVhY2goXG4gICAgICAgICAgaWN1Q2FzZSA9PiB7IGF0dGFjaERlYnVnT2JqZWN0KGljdUNhc2UsIG5ldyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnKGljdUNhc2UsIGxWaWV3KSk7IH0pO1xuICAgICAgaWN1LnVwZGF0ZS5mb3JFYWNoKGljdUNhc2UgPT4ge1xuICAgICAgICBhdHRhY2hEZWJ1Z09iamVjdChpY3VDYXNlLCBuZXcgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1ZyhpY3VDYXNlLCBpY3VzLCBsVmlldykpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEkxOG5NdXRhdGVPcENvZGVzRGVidWcgaW1wbGVtZW50cyBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfX3Jhd19vcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgcHJpdmF0ZSByZWFkb25seSBfX2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogQSBsaXN0IG9mIG9wZXJhdGlvbiBpbmZvcm1hdGlvbiBhYm91dCBob3cgdGhlIE9wQ29kZXMgd2lsbCBhY3Qgb24gdGhlIHZpZXcuXG4gICAqL1xuICBnZXQgb3BlcmF0aW9ucygpIHtcbiAgICBjb25zdCB7X19sVmlldywgX19yYXdfb3BDb2Rlc30gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9fcmF3X29wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG9wQ29kZSA9IF9fcmF3X29wQ29kZXNbaV07XG4gICAgICBsZXQgcmVzdWx0OiBhbnk7XG4gICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgIHR5cGU6ICdDcmVhdGUgVGV4dCBOb2RlJyxcbiAgICAgICAgICBub2RlSW5kZXg6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICB0ZXh0OiBvcENvZGUsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnbnVtYmVyJykge1xuICAgICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgICBjb25zdCBkZXN0aW5hdGlvbk5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQ7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGRlc3RpbmF0aW9uTm9kZUluZGV4LCAnQXBwZW5kQ2hpbGQnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3Q6XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdTZWxlY3QnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kOlxuICAgICAgICAgICAgbGV0IGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGVsZW1lbnRJbmRleCwgJ0VsZW1lbnRFbmQnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgZWxlbWVudEluZGV4LCAnQXR0cicpO1xuICAgICAgICAgICAgcmVzdWx0WydhdHRyTmFtZSddID0gX19yYXdfb3BDb2Rlc1srK2ldO1xuICAgICAgICAgICAgcmVzdWx0WydhdHRyVmFsdWUnXSA9IF9fcmF3X29wQ29kZXNbKytpXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHN3aXRjaCAob3BDb2RlKSB7XG4gICAgICAgICAgY2FzZSBDT01NRU5UX01BUktFUjpcbiAgICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgIHR5cGU6ICdDT01NRU5UX01BUktFUicsXG4gICAgICAgICAgICAgIGNvbW1lbnRWYWx1ZTogX19yYXdfb3BDb2Rlc1srK2ldLFxuICAgICAgICAgICAgICBub2RlSW5kZXg6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEVMRU1FTlRfTUFSS0VSOlxuICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgdHlwZTogJ0VMRU1FTlRfTUFSS0VSJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgdHlwZTogJ1Vua25vd24gT3AgQ29kZScsXG4gICAgICAgICAgY29kZTogb3BDb2RlLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1ZyBpbXBsZW1lbnRzIEkxOG5PcENvZGVzRGVidWcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX19yYXdfb3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIHByaXZhdGUgcmVhZG9ubHkgaWN1czogVEljdVtdfG51bGwsXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9fbFZpZXc6IExWaWV3KSB7fVxuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2Ygb3BlcmF0aW9uIGluZm9ybWF0aW9uIGFib3V0IGhvdyB0aGUgT3BDb2RlcyB3aWxsIGFjdCBvbiB0aGUgdmlldy5cbiAgICovXG4gIGdldCBvcGVyYXRpb25zKCkge1xuICAgIGNvbnN0IHtfX2xWaWV3LCBfX3Jhd19vcENvZGVzLCBpY3VzfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgX19yYXdfb3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gYml0IGNvZGUgdG8gY2hlY2sgaWYgd2Ugc2hvdWxkIGFwcGx5IHRoZSBuZXh0IHVwZGF0ZVxuICAgICAgY29uc3QgY2hlY2tCaXQgPSBfX3Jhd19vcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgICBjb25zdCBza2lwQ29kZXMgPSBfX3Jhd19vcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gX19yYXdfb3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gSXQncyBhIGJpbmRpbmcgaW5kZXggd2hvc2UgdmFsdWUgaXMgbmVnYXRpdmVcbiAgICAgICAgICAgIC8vIFdlIGNhbm5vdCBrbm93IHRoZSB2YWx1ZSBvZiB0aGUgYmluZGluZyBzbyB3ZSBvbmx5IHNob3cgdGhlIGluZGV4XG4gICAgICAgICAgICB2YWx1ZSArPSBg77+9JHstb3BDb2RlIC0gMX3vv71gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgbGV0IHRJY3VJbmRleDogbnVtYmVyO1xuICAgICAgICAgICAgbGV0IHRJY3U6IFRJY3U7XG4gICAgICAgICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5VcGRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBfX3Jhd19vcENvZGVzWysral0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNhbml0aXplRm4gPSBfX3Jhd19vcENvZGVzWysral07XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICAgICAgY2hlY2tCaXQsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnQXR0cicsXG4gICAgICAgICAgICAgICAgICBhdHRyVmFsdWU6IHZhbHVlLCBhdHRyTmFtZSwgc2FuaXRpemVGbixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICAgICAgY2hlY2tCaXQsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnVGV4dCcsIG5vZGVJbmRleCxcbiAgICAgICAgICAgICAgICAgIHRleHQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ0ljdVN3aXRjaCcpO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdUluZGV4J10gPSB0SWN1SW5kZXg7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydjaGVja0JpdCddID0gY2hlY2tCaXQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydtYWluQmluZGluZyddID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1J10gPSB0SWN1O1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnSWN1VXBkYXRlJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1SW5kZXgnXSA9IHRJY3VJbmRleDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ2NoZWNrQml0J10gPSBjaGVja0JpdDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3UnXSA9IHRJY3U7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpICs9IHNraXBDb2RlcztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJMThuT3BDb2Rlc0RlYnVnIHsgb3BlcmF0aW9uczogYW55W107IH1cbiJdfQ==