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
import { BINDING_INDEX, CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
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
export var LViewArray = ngDevMode && createNamedArrayType('LView');
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
            if (this.flags & 2 /* isComponentHost */)
                flags.push('TNodeFlags.isComponentHost');
            if (this.flags & 1 /* isDirectiveHost */)
                flags.push('TNodeFlags.isDirectiveHost');
            if (this.flags & 64 /* isDetached */)
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
var TViewData = ngDevMode && createNamedArrayType('TViewData');
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
export var LViewBlueprint = ngDevMode && createNamedArrayType('LViewBlueprint');
export var MatchesArray = ngDevMode && createNamedArrayType('MatchesArray');
export var TViewComponents = ngDevMode && createNamedArrayType('TViewComponents');
export var TNodeLocalNames = ngDevMode && createNamedArrayType('TNodeLocalNames');
export var TNodeInitialInputs = ngDevMode && createNamedArrayType('TNodeInitialInputs');
export var TNodeInitialData = ngDevMode && createNamedArrayType('TNodeInitialData');
export var LCleanup = ngDevMode && createNamedArrayType('LCleanup');
export var TCleanup = ngDevMode && createNamedArrayType('TCleanup');
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
            var rawValue = lView[tNode.index];
            var native = unwrapRNode(rawValue);
            var componentLViewDebug = toDebug(readLViewValue(rawValue));
            var styles = isStylingContext(tNode.styles) ?
                new NodeStylingDebug(tNode.styles, lView) :
                null;
            var classes = isStylingContext(tNode.classes) ?
                new NodeStylingDebug(tNode.classes, lView, true) :
                null;
            debugNodes.push({
                html: toHtml(native),
                native: native, styles: styles, classes: classes,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLFlBQVksRUFBRSx1QkFBdUIsRUFBYyxXQUFXLEVBQUUsTUFBTSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFL0csT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlGLE1BQU0sb0JBQW9CLENBQUM7QUFLbEosT0FBTyxFQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQXVCLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFZLFFBQVEsRUFBcUIsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBUyxLQUFLLEVBQTBCLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRWpULE9BQU8sRUFBa0MsZ0JBQWdCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNoRyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN0RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBR3pEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EyQkc7QUFHSCxNQUFNLENBQUMsSUFBTSxVQUFVLEdBQUcsU0FBUyxJQUFJLG9CQUFv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R0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztvQ0FDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztvQ0FDaEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztvQ0FDOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztvQ0FDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDckIsTUFBTTs2QkFDVDt5QkFDRjtxQkFDRjtpQkFDRjtnQkFDRCxDQUFDLElBQUksU0FBUyxDQUFDO2FBQ2hCO1lBQ0QsT0FBTyxPQUFPLENBQUM7UUFDakIsQ0FBQzs7O09BQUE7SUFDSCw2QkFBQztBQUFELENBQUMsQUE3RUQsSUE2RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBDb21wb25lbnRUZW1wbGF0ZX0gZnJvbSAnLi4nO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vY29yZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTLCBOQVRJVkV9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3QsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTU1FTlRfTUFSS0VSLCBFTEVNRU5UX01BUktFUiwgSTE4bk11dGF0ZU9wQ29kZSwgSTE4bk11dGF0ZU9wQ29kZXMsIEkxOG5VcGRhdGVPcENvZGUsIEkxOG5VcGRhdGVPcENvZGVzLCBUSWN1fSBmcm9tICcuLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzZXMsIFRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlIGFzIElUTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2VsZWN0b3JGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7VFF1ZXJpZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRXhwYW5kb0luc3RydWN0aW9ucywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEhvb2tEYXRhLCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFNBTklUSVpFUiwgVERhdGEsIFRWSUVXLCBUVmlldyBhcyBJVFZpZXcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1RTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L2ludGVyZmFjZXMnO1xuaW1wb3J0IHtEZWJ1Z1N0eWxpbmcgYXMgRGVidWdOZXdTdHlsaW5nLCBOb2RlU3R5bGluZ0RlYnVnfSBmcm9tICcuLi9zdHlsaW5nX25leHQvc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC91dGlsJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuaW1wb3J0IHtnZXRUTm9kZSwgdW53cmFwUk5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cblxuLypcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjb25kaXRpb25hbGx5IGF0dGFjaGVkIGNsYXNzZXMgd2hpY2ggcHJvdmlkZSBodW1hbiByZWFkYWJsZSAoZGVidWcpIGxldmVsXG4gKiBpbmZvcm1hdGlvbiBmb3IgYExWaWV3YCwgYExDb250YWluZXJgIGFuZCBvdGhlciBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMuIFRoZXNlIGRhdGEgc3RydWN0dXJlc1xuICogYXJlIHN0b3JlZCBpbnRlcm5hbGx5IGFzIGFycmF5IHdoaWNoIG1ha2VzIGl0IHZlcnkgZGlmZmljdWx0IGR1cmluZyBkZWJ1Z2dpbmcgdG8gcmVhc29uIGFib3V0IHRoZVxuICogY3VycmVudCBzdGF0ZSBvZiB0aGUgc3lzdGVtLlxuICpcbiAqIFBhdGNoaW5nIHRoZSBhcnJheSB3aXRoIGV4dHJhIHByb3BlcnR5IGRvZXMgY2hhbmdlIHRoZSBhcnJheSdzIGhpZGRlbiBjbGFzcycgYnV0IGl0IGRvZXMgbm90XG4gKiBjaGFuZ2UgdGhlIGNvc3Qgb2YgYWNjZXNzLCB0aGVyZWZvcmUgdGhpcyBwYXRjaGluZyBzaG91bGQgbm90IGhhdmUgc2lnbmlmaWNhbnQgaWYgYW55IGltcGFjdCBpblxuICogYG5nRGV2TW9kZWAgbW9kZS4gKHNlZTogaHR0cHM6Ly9qc3BlcmYuY29tL2FycmF5LXZzLW1vbmtleS1wYXRjaC1hcnJheSlcbiAqXG4gKiBTbyBpbnN0ZWFkIG9mIHNlZWluZzpcbiAqIGBgYFxuICogQXJyYXkoMzApIFtPYmplY3QsIDY1OSwgbnVsbCwg4oCmXVxuICogYGBgXG4gKlxuICogWW91IGdldCB0byBzZWU6XG4gKiBgYGBcbiAqIExWaWV3RGVidWcge1xuICogICB2aWV3czogWy4uLl0sXG4gKiAgIGZsYWdzOiB7YXR0YWNoZWQ6IHRydWUsIC4uLn1cbiAqICAgbm9kZXM6IFtcbiAqICAgICB7aHRtbDogJzxkaXYgaWQ9XCIxMjNcIj4nLCAuLi4sIG5vZGVzOiBbXG4gKiAgICAgICB7aHRtbDogJzxzcGFuPicsIC4uLiwgbm9kZXM6IG51bGx9XG4gKiAgICAgXX1cbiAqICAgXVxuICogfVxuICogYGBgXG4gKi9cblxuXG5leHBvcnQgY29uc3QgTFZpZXdBcnJheSA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFZpZXcnKTtcbmxldCBMVklFV19FTVBUWTogdW5rbm93bltdOyAgLy8gY2FuJ3QgaW5pdGlhbGl6ZSBoZXJlIG9yIGl0IHdpbGwgbm90IGJlIHRyZWUgc2hha2VuLCBiZWNhdXNlIGBMVmlld2BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc3RydWN0b3IgY291bGQgaGF2ZSBzaWRlLWVmZmVjdHMuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY2xvbmVzIGEgYmx1ZXByaW50IGFuZCBjcmVhdGVzIExWaWV3LlxuICpcbiAqIFNpbXBsZSBzbGljZSB3aWxsIGtlZXAgdGhlIHNhbWUgdHlwZSwgYW5kIHdlIG5lZWQgaXQgdG8gYmUgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lVG9MVmlldyhsaXN0OiBhbnlbXSk6IExWaWV3IHtcbiAgaWYgKExWSUVXX0VNUFRZID09PSB1bmRlZmluZWQpIExWSUVXX0VNUFRZID0gbmV3IExWaWV3QXJyYXkgISgpO1xuICByZXR1cm4gTFZJRVdfRU1QVFkuY29uY2F0KGxpc3QpIGFzIGFueTtcbn1cblxuLyoqXG4gKiBUaGlzIGNsYXNzIGlzIGEgZGVidWcgdmVyc2lvbiBvZiBPYmplY3QgbGl0ZXJhbCBzbyB0aGF0IHdlIGNhbiBoYXZlIGNvbnN0cnVjdG9yIG5hbWUgc2hvdyB1cCBpblxuICogZGVidWcgdG9vbHMgaW4gbmdEZXZNb2RlLlxuICovXG5leHBvcnQgY29uc3QgVFZpZXdDb25zdHJ1Y3RvciA9IGNsYXNzIFRWaWV3IGltcGxlbWVudHMgSVRWaWV3IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaWQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBibHVlcHJpbnQ6IExWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCwgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcXVlcmllczogVFF1ZXJpZXN8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+fG51bGwsICAgICAgICAvL1xuICAgICAgcHVibGljIG5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbCwgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGF0YTogVERhdGEsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZXhwYW5kb0luc3RydWN0aW9uczogRXhwYW5kb0luc3RydWN0aW9uc3xudWxsLCAgLy9cbiAgICAgIHB1YmxpYyBmaXJzdFRlbXBsYXRlUGFzczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0YXRpY1ZpZXdRdWVyaWVzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3RhdGljQ29udGVudFF1ZXJpZXM6IGJvb2xlYW4sICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcmVPcmRlckhvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29udGVudEhvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsZWFudXA6IGFueVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29udGVudFF1ZXJpZXM6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGwsICAgICAgIC8vXG4gICAgICBwdWJsaWMgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsLCAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCwgICAgICAgICAgICAgICAgIC8vXG4gICAgICApIHt9XG5cbiAgZ2V0IHRlbXBsYXRlXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICBwcm9jZXNzVE5vZGVDaGlsZHJlbih0aGlzLmZpcnN0Q2hpbGQsIGJ1Zik7XG4gICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IFROb2RlQ29uc3RydWN0b3IgPSBjbGFzcyBUTm9kZSBpbXBsZW1lbnRzIElUTm9kZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHRWaWV3XzogVFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdHlwZTogVE5vZGVUeXBlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluamVjdG9ySW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlU3RhcnQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVFbmQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb3BlcnR5QmluZGluZ3M6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZmxhZ3M6IFROb2RlRmxhZ3MsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRhZ05hbWU6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgYXR0cnM6IChzdHJpbmd8QXR0cmlidXRlTWFya2VyfChzdHJpbmd8U2VsZWN0b3JGbGFncylbXSlbXXxudWxsLCAgLy9cbiAgICAgIHB1YmxpYyBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQsICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRWaWV3czogSVRWaWV3fElUVmlld1tdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNoaWxkOiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uOiBudW1iZXJ8KElUTm9kZXxSTm9kZVtdKVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlczogVFN0eWxpbmdDb250ZXh0fG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2xhc3NlczogVFN0eWxpbmdDb250ZXh0fG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICkge31cblxuICBnZXQgdHlwZV8oKTogc3RyaW5nIHtcbiAgICBzd2l0Y2ggKHRoaXMudHlwZSkge1xuICAgICAgY2FzZSBUTm9kZVR5cGUuQ29udGFpbmVyOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5Db250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudDpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuRWxlbWVudCc7XG4gICAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkljdUNvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuSWN1Q29udGFpbmVyJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLlByb2plY3Rpb246XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLlByb2plY3Rpb24nO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuVmlldzpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuVmlldyc7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS4/Pz8nO1xuICAgIH1cbiAgfVxuXG4gIGdldCBmbGFnc18oKTogc3RyaW5nIHtcbiAgICBjb25zdCBmbGFnczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeSkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnknKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzRGV0YWNoZWQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQnKTtcbiAgICByZXR1cm4gZmxhZ3Muam9pbignfCcpO1xuICB9XG5cbiAgZ2V0IHRlbXBsYXRlXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICBidWYucHVzaCgnPCcsIHRoaXMudGFnTmFtZSB8fCB0aGlzLnR5cGVfKTtcbiAgICBpZiAodGhpcy5hdHRycykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dHJzLmxlbmd0aDspIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGJ1Zi5wdXNoKCcgJywgYXR0ck5hbWUgYXMgc3RyaW5nLCAnPVwiJywgYXR0clZhbHVlIGFzIHN0cmluZywgJ1wiJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGJ1Zi5wdXNoKCc+Jyk7XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5jaGlsZCwgYnVmKTtcbiAgICBidWYucHVzaCgnPC8nLCB0aGlzLnRhZ05hbWUgfHwgdGhpcy50eXBlXywgJz4nKTtcbiAgICByZXR1cm4gYnVmLmpvaW4oJycpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBwcm9jZXNzVE5vZGVDaGlsZHJlbih0Tm9kZTogVE5vZGUgfCBudWxsLCBidWY6IHN0cmluZ1tdKSB7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGJ1Zi5wdXNoKCh0Tm9kZSBhcyBhbnkgYXN7dGVtcGxhdGVfOiBzdHJpbmd9KS50ZW1wbGF0ZV8pO1xuICAgIHROb2RlID0gdE5vZGUubmV4dDtcbiAgfVxufVxuXG5jb25zdCBUVmlld0RhdGEgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3RGF0YScpO1xubGV0IFRWSUVXREFUQV9FTVBUWTpcbiAgICB1bmtub3duW107ICAvLyBjYW4ndCBpbml0aWFsaXplIGhlcmUgb3IgaXQgd2lsbCBub3QgYmUgdHJlZSBzaGFrZW4sIGJlY2F1c2UgYExWaWV3YFxuICAgICAgICAgICAgICAgIC8vIGNvbnN0cnVjdG9yIGNvdWxkIGhhdmUgc2lkZS1lZmZlY3RzLlxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNsb25lcyBhIGJsdWVwcmludCBhbmQgY3JlYXRlcyBURGF0YS5cbiAqXG4gKiBTaW1wbGUgc2xpY2Ugd2lsbCBrZWVwIHRoZSBzYW1lIHR5cGUsIGFuZCB3ZSBuZWVkIGl0IHRvIGJlIFREYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZVRvVFZpZXdEYXRhKGxpc3Q6IGFueVtdKTogVERhdGEge1xuICBpZiAoVFZJRVdEQVRBX0VNUFRZID09PSB1bmRlZmluZWQpIFRWSUVXREFUQV9FTVBUWSA9IG5ldyBUVmlld0RhdGEgISgpO1xuICByZXR1cm4gVFZJRVdEQVRBX0VNUFRZLmNvbmNhdChsaXN0KSBhcyBhbnk7XG59XG5cbmV4cG9ydCBjb25zdCBMVmlld0JsdWVwcmludCA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFZpZXdCbHVlcHJpbnQnKTtcbmV4cG9ydCBjb25zdCBNYXRjaGVzQXJyYXkgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ01hdGNoZXNBcnJheScpO1xuZXhwb3J0IGNvbnN0IFRWaWV3Q29tcG9uZW50cyA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVFZpZXdDb21wb25lbnRzJyk7XG5leHBvcnQgY29uc3QgVE5vZGVMb2NhbE5hbWVzID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUxvY2FsTmFtZXMnKTtcbmV4cG9ydCBjb25zdCBUTm9kZUluaXRpYWxJbnB1dHMgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbElucHV0cycpO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbERhdGEgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbERhdGEnKTtcbmV4cG9ydCBjb25zdCBMQ2xlYW51cCA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTENsZWFudXAnKTtcbmV4cG9ydCBjb25zdCBUQ2xlYW51cCA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVENsZWFudXAnKTtcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsVmlldywgbmV3IExWaWV3RGVidWcobFZpZXcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxDb250YWluZXIsIG5ldyBMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3KTogTFZpZXdEZWJ1ZztcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcgfCBudWxsKTogTFZpZXdEZWJ1Z3xudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyB8IExDb250YWluZXIgfCBudWxsKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogYW55KTogYW55IHtcbiAgaWYgKG9iaikge1xuICAgIGNvbnN0IGRlYnVnID0gKG9iaiBhcyBhbnkpLmRlYnVnO1xuICAgIGFzc2VydERlZmluZWQoZGVidWcsICdPYmplY3QgZG9lcyBub3QgaGF2ZSBhIGRlYnVnIHJlcHJlc2VudGF0aW9uLicpO1xuICAgIHJldHVybiBkZWJ1ZztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG59XG5cbi8qKlxuICogVXNlIHRoaXMgbWV0aG9kIHRvIHVud3JhcCBhIG5hdGl2ZSBlbGVtZW50IGluIGBMVmlld2AgYW5kIGNvbnZlcnQgaXQgaW50byBIVE1MIGZvciBlYXNpZXJcbiAqIHJlYWRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIHBvc3NpYmx5IHdyYXBwZWQgbmF0aXZlIERPTSBub2RlLlxuICogQHBhcmFtIGluY2x1ZGVDaGlsZHJlbiBJZiBgdHJ1ZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBpbmNsdWRlIGNoaWxkIGVsZW1lbnRzIChzYW1lXG4gKiBhcyBgb3V0ZXJIVE1MYCkuIElmIGBmYWxzZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBvbmx5IGNvbnRhaW4gdGhlIGVsZW1lbnQgaXRzZWxmXG4gKiAod2lsbCBub3Qgc2VyaWFsaXplIGNoaWxkIGVsZW1lbnRzKS5cbiAqL1xuZnVuY3Rpb24gdG9IdG1sKHZhbHVlOiBhbnksIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlOiBIVE1MRWxlbWVudHxudWxsID0gdW53cmFwUk5vZGUodmFsdWUpIGFzIGFueTtcbiAgaWYgKG5vZGUpIHtcbiAgICBjb25zdCBpc1RleHROb2RlID0gbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREU7XG4gICAgY29uc3Qgb3V0ZXJIVE1MID0gKGlzVGV4dE5vZGUgPyBub2RlLnRleHRDb250ZW50IDogbm9kZS5vdXRlckhUTUwpIHx8ICcnO1xuICAgIGlmIChpbmNsdWRlQ2hpbGRyZW4gfHwgaXNUZXh0Tm9kZSkge1xuICAgICAgcmV0dXJuIG91dGVySFRNTDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5uZXJIVE1MID0gJz4nICsgbm9kZS5pbm5lckhUTUwgKyAnPCc7XG4gICAgICByZXR1cm4gKG91dGVySFRNTC5zcGxpdChpbm5lckhUTUwpWzBdKSArICc+JztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExWaWV3RGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbFZpZXc6IExWaWV3KSB7fVxuXG4gIC8qKlxuICAgKiBGbGFncyBhc3NvY2lhdGVkIHdpdGggdGhlIGBMVmlld2AgdW5wYWNrZWQgaW50byBhIG1vcmUgcmVhZGFibGUgc3RhdGUuXG4gICAqL1xuICBnZXQgZmxhZ3MoKSB7XG4gICAgY29uc3QgZmxhZ3MgPSB0aGlzLl9yYXdfbFZpZXdbRkxBR1NdO1xuICAgIHJldHVybiB7XG4gICAgICBfX3Jhd19fZmxhZ3NfXzogZmxhZ3MsXG4gICAgICBpbml0UGhhc2VTdGF0ZTogZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzayxcbiAgICAgIGNyZWF0aW9uTW9kZTogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSksXG4gICAgICBmaXJzdFZpZXdQYXNzOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpLFxuICAgICAgY2hlY2tBbHdheXM6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyksXG4gICAgICBkaXJ0eTogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkRpcnR5KSxcbiAgICAgIGF0dGFjaGVkOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpLFxuICAgICAgZGVzdHJveWVkOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSxcbiAgICAgIGlzUm9vdDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLklzUm9vdCksXG4gICAgICBpbmRleFdpdGhpbkluaXRQaGFzZTogZmxhZ3MgPj4gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0LFxuICAgIH07XG4gIH1cbiAgZ2V0IHBhcmVudCgpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W1BBUkVOVF0pOyB9XG4gIGdldCBob3N0KCk6IHN0cmluZ3xudWxsIHsgcmV0dXJuIHRvSHRtbCh0aGlzLl9yYXdfbFZpZXdbSE9TVF0sIHRydWUpOyB9XG4gIGdldCBodG1sKCk6IHN0cmluZyB7IHJldHVybiAodGhpcy5ub2RlcyB8fCBbXSkubWFwKG5vZGUgPT4gdG9IdG1sKG5vZGUubmF0aXZlLCB0cnVlKSkuam9pbignJyk7IH1cbiAgZ2V0IGNvbnRleHQoKToge318bnVsbCB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQ09OVEVYVF07IH1cbiAgLyoqXG4gICAqIFRoZSB0cmVlIG9mIG5vZGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBgTFZpZXdgLiBUaGUgbm9kZXMgaGF2ZSBiZWVuIG5vcm1hbGl6ZWQgaW50byBhXG4gICAqIHRyZWUgc3RydWN0dXJlIHdpdGggcmVsZXZhbnQgZGV0YWlscyBwdWxsZWQgb3V0IGZvciByZWFkYWJpbGl0eS5cbiAgICovXG4gIGdldCBub2RlcygpOiBEZWJ1Z05vZGVbXXxudWxsIHtcbiAgICBjb25zdCBsVmlldyA9IHRoaXMuX3Jhd19sVmlldztcbiAgICBjb25zdCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICAgIHJldHVybiB0b0RlYnVnTm9kZXModE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGdldCB0VmlldygpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tUVklFV107IH1cbiAgZ2V0IGNsZWFudXAoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQ0xFQU5VUF07IH1cbiAgZ2V0IGluamVjdG9yKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0lOSkVDVE9SXTsgfVxuICBnZXQgcmVuZGVyZXJGYWN0b3J5KCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldOyB9XG4gIGdldCByZW5kZXJlcigpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tSRU5ERVJFUl07IH1cbiAgZ2V0IHNhbml0aXplcigpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tTQU5JVElaRVJdOyB9XG4gIGdldCBjaGlsZEhlYWQoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tDSElMRF9IRUFEXSk7IH1cbiAgZ2V0IG5leHQoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tORVhUXSk7IH1cbiAgZ2V0IGNoaWxkVGFpbCgpIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX1RBSUxdKTsgfVxuICBnZXQgZGVjbGFyYXRpb25WaWV3KCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbREVDTEFSQVRJT05fVklFV10pOyB9XG4gIGdldCBxdWVyaWVzKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1FVRVJJRVNdOyB9XG4gIGdldCB0SG9zdCgpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tUX0hPU1RdOyB9XG4gIGdldCBiaW5kaW5nSW5kZXgoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQklORElOR19JTkRFWF07IH1cblxuICAvKipcbiAgICogTm9ybWFsaXplZCB2aWV3IG9mIGNoaWxkIHZpZXdzIChhbmQgY29udGFpbmVycykgYXR0YWNoZWQgYXQgdGhpcyBsb2NhdGlvbi5cbiAgICovXG4gIGdldCBjaGlsZFZpZXdzKCk6IEFycmF5PExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnPiB7XG4gICAgY29uc3QgY2hpbGRWaWV3czogQXJyYXk8TFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWc+ID0gW107XG4gICAgbGV0IGNoaWxkID0gdGhpcy5jaGlsZEhlYWQ7XG4gICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICBjaGlsZFZpZXdzLnB1c2goY2hpbGQpO1xuICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRWaWV3cztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIGh0bWw6IHN0cmluZ3xudWxsO1xuICBuYXRpdmU6IE5vZGU7XG4gIHN0eWxlczogRGVidWdOZXdTdHlsaW5nfG51bGw7XG4gIGNsYXNzZXM6IERlYnVnTmV3U3R5bGluZ3xudWxsO1xuICBub2RlczogRGVidWdOb2RlW118bnVsbDtcbiAgY29tcG9uZW50OiBMVmlld0RlYnVnfG51bGw7XG59XG5cbi8qKlxuICogVHVybnMgYSBmbGF0IGxpc3Qgb2Ygbm9kZXMgaW50byBhIHRyZWUgYnkgd2Fsa2luZyB0aGUgYXNzb2NpYXRlZCBgVE5vZGVgIHRyZWUuXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWdOb2Rlcyh0Tm9kZTogVE5vZGUgfCBudWxsLCBsVmlldzogTFZpZXcpOiBEZWJ1Z05vZGVbXXxudWxsIHtcbiAgaWYgKHROb2RlKSB7XG4gICAgY29uc3QgZGVidWdOb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBsZXQgdE5vZGVDdXJzb3I6IFROb2RlfG51bGwgPSB0Tm9kZTtcbiAgICB3aGlsZSAodE5vZGVDdXJzb3IpIHtcbiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgICAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUocmF3VmFsdWUpO1xuICAgICAgY29uc3QgY29tcG9uZW50TFZpZXdEZWJ1ZyA9IHRvRGVidWcocmVhZExWaWV3VmFsdWUocmF3VmFsdWUpKTtcbiAgICAgIGNvbnN0IHN0eWxlcyA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuc3R5bGVzKSA/XG4gICAgICAgICAgbmV3IE5vZGVTdHlsaW5nRGVidWcodE5vZGUuc3R5bGVzIGFzIGFueSBhcyBUU3R5bGluZ0NvbnRleHQsIGxWaWV3KSA6XG4gICAgICAgICAgbnVsbDtcbiAgICAgIGNvbnN0IGNsYXNzZXMgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLmNsYXNzZXMpID9cbiAgICAgICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5jbGFzc2VzIGFzIGFueSBhcyBUU3R5bGluZ0NvbnRleHQsIGxWaWV3LCB0cnVlKSA6XG4gICAgICAgICAgbnVsbDtcbiAgICAgIGRlYnVnTm9kZXMucHVzaCh7XG4gICAgICAgIGh0bWw6IHRvSHRtbChuYXRpdmUpLFxuICAgICAgICBuYXRpdmU6IG5hdGl2ZSBhcyBhbnksIHN0eWxlcywgY2xhc3NlcyxcbiAgICAgICAgbm9kZXM6IHRvRGVidWdOb2Rlcyh0Tm9kZS5jaGlsZCwgbFZpZXcpLFxuICAgICAgICBjb21wb25lbnQ6IGNvbXBvbmVudExWaWV3RGVidWcsXG4gICAgICB9KTtcbiAgICAgIHROb2RlQ3Vyc29yID0gdE5vZGVDdXJzb3IubmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIGRlYnVnTm9kZXM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExDb250YWluZXJEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7fVxuXG4gIGdldCBhY3RpdmVJbmRleCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbQUNUSVZFX0lOREVYXTsgfVxuICBnZXQgdmlld3MoKTogTFZpZXdEZWJ1Z1tdIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXIuc2xpY2UoQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpXG4gICAgICAgIC5tYXAodG9EZWJ1ZyBhcyhsOiBMVmlldykgPT4gTFZpZXdEZWJ1Zyk7XG4gIH1cbiAgZ2V0IHBhcmVudCgpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xDb250YWluZXJbUEFSRU5UXSk7IH1cbiAgZ2V0IG1vdmVkVmlld3MoKTogTFZpZXdbXXxudWxsIHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW01PVkVEX1ZJRVdTXTsgfVxuICBnZXQgaG9zdCgpOiBSRWxlbWVudHxSQ29tbWVudHxMVmlldyB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltIT1NUXTsgfVxuICBnZXQgbmF0aXZlKCk6IFJDb21tZW50IHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW05BVElWRV07IH1cbiAgZ2V0IG5leHQoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW05FWFRdKTsgfVxufVxuXG4vKipcbiAqIFJldHVybiBhbiBgTFZpZXdgIHZhbHVlIGlmIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBgTFZpZXdgIGlmIGFueVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZExWaWV3VmFsdWUodmFsdWU6IGFueSk6IExWaWV3fG51bGwge1xuICB3aGlsZSAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAvLyBUaGlzIGNoZWNrIGlzIG5vdCBxdWl0ZSByaWdodCwgYXMgaXQgZG9lcyBub3QgdGFrZSBpbnRvIGFjY291bnQgYFN0eWxpbmdDb250ZXh0YFxuICAgIC8vIFRoaXMgaXMgd2h5IGl0IGlzIGluIGRlYnVnLCBub3QgaW4gdXRpbC50c1xuICAgIGlmICh2YWx1ZS5sZW5ndGggPj0gSEVBREVSX09GRlNFVCAtIDEpIHJldHVybiB2YWx1ZSBhcyBMVmlldztcbiAgICB2YWx1ZSA9IHZhbHVlW0hPU1RdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgSTE4TkRlYnVnSXRlbSB7XG4gIFtrZXk6IHN0cmluZ106IGFueTtcblxuICBnZXQgdE5vZGUoKSB7IHJldHVybiBnZXRUTm9kZSh0aGlzLm5vZGVJbmRleCwgdGhpcy5fbFZpZXcpOyB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgX19yYXdfb3BDb2RlOiBhbnksIHByaXZhdGUgX2xWaWV3OiBMVmlldywgcHVibGljIG5vZGVJbmRleDogbnVtYmVyLFxuICAgICAgcHVibGljIHR5cGU6IHN0cmluZykge31cbn1cblxuLyoqXG4gKiBUdXJucyBhIGxpc3Qgb2YgXCJDcmVhdGVcIiAmIFwiVXBkYXRlXCIgT3BDb2RlcyBpbnRvIGEgaHVtYW4tcmVhZGFibGUgbGlzdCBvZiBvcGVyYXRpb25zIGZvclxuICogZGVidWdnaW5nIHB1cnBvc2VzLlxuICogQHBhcmFtIG11dGF0ZU9wQ29kZXMgbXV0YXRpb24gb3BDb2RlcyB0byByZWFkXG4gKiBAcGFyYW0gdXBkYXRlT3BDb2RlcyB1cGRhdGUgb3BDb2RlcyB0byByZWFkXG4gKiBAcGFyYW0gaWN1cyBsaXN0IG9mIElDVSBleHByZXNzaW9uc1xuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRoZSBvcENvZGVzIGFyZSBhY3Rpbmcgb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaEkxOG5PcENvZGVzRGVidWcoXG4gICAgbXV0YXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBpY3VzOiBUSWN1W10gfCBudWxsLFxuICAgIGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChtdXRhdGVPcENvZGVzLCBuZXcgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyhtdXRhdGVPcENvZGVzLCBsVmlldykpO1xuICBhdHRhY2hEZWJ1Z09iamVjdCh1cGRhdGVPcENvZGVzLCBuZXcgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1Zyh1cGRhdGVPcENvZGVzLCBpY3VzLCBsVmlldykpO1xuXG4gIGlmIChpY3VzKSB7XG4gICAgaWN1cy5mb3JFYWNoKGljdSA9PiB7XG4gICAgICBpY3UuY3JlYXRlLmZvckVhY2goXG4gICAgICAgICAgaWN1Q2FzZSA9PiB7IGF0dGFjaERlYnVnT2JqZWN0KGljdUNhc2UsIG5ldyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnKGljdUNhc2UsIGxWaWV3KSk7IH0pO1xuICAgICAgaWN1LnVwZGF0ZS5mb3JFYWNoKGljdUNhc2UgPT4ge1xuICAgICAgICBhdHRhY2hEZWJ1Z09iamVjdChpY3VDYXNlLCBuZXcgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1ZyhpY3VDYXNlLCBpY3VzLCBsVmlldykpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEkxOG5NdXRhdGVPcENvZGVzRGVidWcgaW1wbGVtZW50cyBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfX3Jhd19vcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgcHJpdmF0ZSByZWFkb25seSBfX2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogQSBsaXN0IG9mIG9wZXJhdGlvbiBpbmZvcm1hdGlvbiBhYm91dCBob3cgdGhlIE9wQ29kZXMgd2lsbCBhY3Qgb24gdGhlIHZpZXcuXG4gICAqL1xuICBnZXQgb3BlcmF0aW9ucygpIHtcbiAgICBjb25zdCB7X19sVmlldywgX19yYXdfb3BDb2Rlc30gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9fcmF3X29wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG9wQ29kZSA9IF9fcmF3X29wQ29kZXNbaV07XG4gICAgICBsZXQgcmVzdWx0OiBhbnk7XG4gICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgIHR5cGU6ICdDcmVhdGUgVGV4dCBOb2RlJyxcbiAgICAgICAgICBub2RlSW5kZXg6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICB0ZXh0OiBvcENvZGUsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnbnVtYmVyJykge1xuICAgICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgICBjb25zdCBkZXN0aW5hdGlvbk5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQ7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGRlc3RpbmF0aW9uTm9kZUluZGV4LCAnQXBwZW5kQ2hpbGQnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3Q6XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdTZWxlY3QnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kOlxuICAgICAgICAgICAgbGV0IGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGVsZW1lbnRJbmRleCwgJ0VsZW1lbnRFbmQnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgZWxlbWVudEluZGV4LCAnQXR0cicpO1xuICAgICAgICAgICAgcmVzdWx0WydhdHRyTmFtZSddID0gX19yYXdfb3BDb2Rlc1srK2ldO1xuICAgICAgICAgICAgcmVzdWx0WydhdHRyVmFsdWUnXSA9IF9fcmF3X29wQ29kZXNbKytpXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHN3aXRjaCAob3BDb2RlKSB7XG4gICAgICAgICAgY2FzZSBDT01NRU5UX01BUktFUjpcbiAgICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgIHR5cGU6ICdDT01NRU5UX01BUktFUicsXG4gICAgICAgICAgICAgIGNvbW1lbnRWYWx1ZTogX19yYXdfb3BDb2Rlc1srK2ldLFxuICAgICAgICAgICAgICBub2RlSW5kZXg6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEVMRU1FTlRfTUFSS0VSOlxuICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgdHlwZTogJ0VMRU1FTlRfTUFSS0VSJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgdHlwZTogJ1Vua25vd24gT3AgQ29kZScsXG4gICAgICAgICAgY29kZTogb3BDb2RlLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1ZyBpbXBsZW1lbnRzIEkxOG5PcENvZGVzRGVidWcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX19yYXdfb3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIHByaXZhdGUgcmVhZG9ubHkgaWN1czogVEljdVtdfG51bGwsXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9fbFZpZXc6IExWaWV3KSB7fVxuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2Ygb3BlcmF0aW9uIGluZm9ybWF0aW9uIGFib3V0IGhvdyB0aGUgT3BDb2RlcyB3aWxsIGFjdCBvbiB0aGUgdmlldy5cbiAgICovXG4gIGdldCBvcGVyYXRpb25zKCkge1xuICAgIGNvbnN0IHtfX2xWaWV3LCBfX3Jhd19vcENvZGVzLCBpY3VzfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgX19yYXdfb3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gYml0IGNvZGUgdG8gY2hlY2sgaWYgd2Ugc2hvdWxkIGFwcGx5IHRoZSBuZXh0IHVwZGF0ZVxuICAgICAgY29uc3QgY2hlY2tCaXQgPSBfX3Jhd19vcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgICBjb25zdCBza2lwQ29kZXMgPSBfX3Jhd19vcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gX19yYXdfb3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gSXQncyBhIGJpbmRpbmcgaW5kZXggd2hvc2UgdmFsdWUgaXMgbmVnYXRpdmVcbiAgICAgICAgICAgIC8vIFdlIGNhbm5vdCBrbm93IHRoZSB2YWx1ZSBvZiB0aGUgYmluZGluZyBzbyB3ZSBvbmx5IHNob3cgdGhlIGluZGV4XG4gICAgICAgICAgICB2YWx1ZSArPSBg77+9JHstb3BDb2RlIC0gMX3vv71gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgbGV0IHRJY3VJbmRleDogbnVtYmVyO1xuICAgICAgICAgICAgbGV0IHRJY3U6IFRJY3U7XG4gICAgICAgICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5VcGRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBfX3Jhd19vcENvZGVzWysral0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNhbml0aXplRm4gPSBfX3Jhd19vcENvZGVzWysral07XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICAgICAgY2hlY2tCaXQsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnQXR0cicsXG4gICAgICAgICAgICAgICAgICBhdHRyVmFsdWU6IHZhbHVlLCBhdHRyTmFtZSwgc2FuaXRpemVGbixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICAgICAgY2hlY2tCaXQsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnVGV4dCcsIG5vZGVJbmRleCxcbiAgICAgICAgICAgICAgICAgIHRleHQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ0ljdVN3aXRjaCcpO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdUluZGV4J10gPSB0SWN1SW5kZXg7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydjaGVja0JpdCddID0gY2hlY2tCaXQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydtYWluQmluZGluZyddID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1J10gPSB0SWN1O1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnSWN1VXBkYXRlJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1SW5kZXgnXSA9IHRJY3VJbmRleDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ2NoZWNrQml0J10gPSBjaGVja0JpdDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3UnXSA9IHRJY3U7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpICs9IHNraXBDb2RlcztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJMThuT3BDb2Rlc0RlYnVnIHsgb3BlcmF0aW9uczogYW55W107IH1cbiJdfQ==