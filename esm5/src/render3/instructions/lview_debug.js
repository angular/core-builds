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
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { NodeStylingDebug } from '../styling/styling_debug';
import { attachDebugObject } from '../util/debug_utils';
import { isStylingContext } from '../util/styling_utils';
import { getLContainerActiveIndex, getTNode, unwrapRNode } from '../util/view_utils';
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
var LVIEW_COMPONENT_CACHE;
var LVIEW_EMBEDDED_CACHE;
var LVIEW_ROOT;
/**
 * This function clones a blueprint and creates LView.
 *
 * Simple slice will keep the same type, and we need it to be LView
 */
export function cloneToLViewFromTViewBlueprint(tView) {
    var debugTView = tView;
    var lView = getLViewToClone(debugTView.type, tView.template && tView.template.name);
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
            var componentArray = LVIEW_COMPONENT_CACHE.get(name);
            if (componentArray === undefined) {
                componentArray = new (createNamedArrayType('LComponentView' + nameSuffix(name)))();
                LVIEW_COMPONENT_CACHE.set(name, componentArray);
            }
            return componentArray;
        case 2 /* Embedded */:
            if (LVIEW_EMBEDDED_CACHE === undefined)
                LVIEW_EMBEDDED_CACHE = new Map();
            var embeddedArray = LVIEW_EMBEDDED_CACHE.get(name);
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
    var index = text.lastIndexOf('_Template');
    return '_' + (index === -1 ? text : text.substr(0, index));
}
/**
 * This class is a debug version of Object literal so that we can have constructor name show up
 * in
 * debug tools in ngDevMode.
 */
export var TViewConstructor = /** @class */ (function () {
    function TView(type, //
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
    consts) {
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
            if (this.flags & 256 /* hasInitialStyling */)
                flags.push('TNodeFlags.hasInitialStyling');
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
 * @param includeChildren If `true` then the serialized HTML form will include child elements
 * (same
 * as `outerHTML`). If `false` then the serialized HTML form will only contain the element
 * itself
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
         * The tree of nodes associated with the current `LView`. The nodes have been normalized into
         * a
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
        new NodeStylingDebug(tNode.styles, tNode, lView, false) :
        null;
    var classes = isStylingContext(tNode.classes) ?
        new NodeStylingDebug(tNode.classes, tNode, lView, true) :
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
        get: function () { return getLContainerActiveIndex(this._raw_lContainer); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LContainerDebug.prototype, "hasTransplantedViews", {
        get: function () {
            return (this._raw_lContainer[ACTIVE_INDEX] & 1 /* HAS_TRANSPLANTED_VIEWS */) ===
                1 /* HAS_TRANSPLANTED_VIEWS */;
        },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxZQUFZLEVBQW1CLHVCQUF1QixFQUFjLFdBQVcsRUFBRSxNQUFNLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUVoSSxPQUFPLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBaUYsTUFBTSxvQkFBb0IsQ0FBQztBQU1sSixPQUFPLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUF1QixLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBWSxRQUFRLEVBQXFCLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQVMsS0FBSyxFQUFxQyxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUM3UyxPQUFPLEVBQW1CLGdCQUFnQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkQsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVuRixJQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsT0FBTyxT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QUFDO29DQUNyQixNQUFNO2dDQUNSO29DQUNFLFNBQVMsR0FBRyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQVcsQ0FBQztvQ0FDekMsSUFBSSxHQUFHLElBQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQ0FDekIsTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO29DQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsU0FBUyxDQUFDO29DQUNoQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDO29DQUM5QixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO29DQUN0QixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUNyQixNQUFNOzZCQUNUO3lCQUNGO3FCQUNGO2lCQUNGO2dCQUNELENBQUMsSUFBSSxTQUFTLENBQUM7YUFDaEI7WUFDRCxPQUFPLE9BQU8sQ0FBQztRQUNqQixDQUFDOzs7T0FBQTtJQUNILDZCQUFDO0FBQUQsQ0FBQyxBQTdFRCxJQTZFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIENvbXBvbmVudFRlbXBsYXRlfSBmcm9tICcuLic7XG5pbXBvcnQge1NjaGVtYU1ldGFkYXRhfSBmcm9tICcuLi8uLi9jb3JlJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtjcmVhdGVOYW1lZEFycmF5VHlwZX0gZnJvbSAnLi4vLi4vdXRpbC9uYW1lZF9hcnJheV90eXBlJztcbmltcG9ydCB7aW5pdE5nRGV2TW9kZX0gZnJvbSAnLi4vLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgQWN0aXZlSW5kZXhGbGFnLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1MsIE5BVElWRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdCwgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBJMThuTXV0YXRlT3BDb2RlLCBJMThuTXV0YXRlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIFRJY3V9IGZyb20gJy4uL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1Byb3BlcnR5QWxpYXNlcywgVENvbnN0YW50cywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUgYXMgSVROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTZWxlY3RvckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtUUXVlcmllc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0NISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIb29rRGF0YSwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBTQU5JVElaRVIsIFREYXRhLCBUVklFVywgVFZpZXcgYXMgSVRWaWV3LCBUVmlldywgVFZpZXdUeXBlLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge0RlYnVnTm9kZVN0eWxpbmcsIE5vZGVTdHlsaW5nRGVidWd9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcbmltcG9ydCB7aXNTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcbmltcG9ydCB7Z2V0TENvbnRhaW5lckFjdGl2ZUluZGV4LCBnZXRUTm9kZSwgdW53cmFwUk5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmNvbnN0IE5HX0RFVl9NT0RFID0gKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCAhIW5nRGV2TW9kZSkgJiYgaW5pdE5nRGV2TW9kZSgpKTtcblxuLypcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjb25kaXRpb25hbGx5IGF0dGFjaGVkIGNsYXNzZXMgd2hpY2ggcHJvdmlkZSBodW1hbiByZWFkYWJsZSAoZGVidWcpIGxldmVsXG4gKiBpbmZvcm1hdGlvbiBmb3IgYExWaWV3YCwgYExDb250YWluZXJgIGFuZCBvdGhlciBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMuIFRoZXNlIGRhdGEgc3RydWN0dXJlc1xuICogYXJlIHN0b3JlZCBpbnRlcm5hbGx5IGFzIGFycmF5IHdoaWNoIG1ha2VzIGl0IHZlcnkgZGlmZmljdWx0IGR1cmluZyBkZWJ1Z2dpbmcgdG8gcmVhc29uIGFib3V0IHRoZVxuICogY3VycmVudCBzdGF0ZSBvZiB0aGUgc3lzdGVtLlxuICpcbiAqIFBhdGNoaW5nIHRoZSBhcnJheSB3aXRoIGV4dHJhIHByb3BlcnR5IGRvZXMgY2hhbmdlIHRoZSBhcnJheSdzIGhpZGRlbiBjbGFzcycgYnV0IGl0IGRvZXMgbm90XG4gKiBjaGFuZ2UgdGhlIGNvc3Qgb2YgYWNjZXNzLCB0aGVyZWZvcmUgdGhpcyBwYXRjaGluZyBzaG91bGQgbm90IGhhdmUgc2lnbmlmaWNhbnQgaWYgYW55IGltcGFjdCBpblxuICogYG5nRGV2TW9kZWAgbW9kZS4gKHNlZTogaHR0cHM6Ly9qc3BlcmYuY29tL2FycmF5LXZzLW1vbmtleS1wYXRjaC1hcnJheSlcbiAqXG4gKiBTbyBpbnN0ZWFkIG9mIHNlZWluZzpcbiAqIGBgYFxuICogQXJyYXkoMzApIFtPYmplY3QsIDY1OSwgbnVsbCwg4oCmXVxuICogYGBgXG4gKlxuICogWW91IGdldCB0byBzZWU6XG4gKiBgYGBcbiAqIExWaWV3RGVidWcge1xuICogICB2aWV3czogWy4uLl0sXG4gKiAgIGZsYWdzOiB7YXR0YWNoZWQ6IHRydWUsIC4uLn1cbiAqICAgbm9kZXM6IFtcbiAqICAgICB7aHRtbDogJzxkaXYgaWQ9XCIxMjNcIj4nLCAuLi4sIG5vZGVzOiBbXG4gKiAgICAgICB7aHRtbDogJzxzcGFuPicsIC4uLiwgbm9kZXM6IG51bGx9XG4gKiAgICAgXX1cbiAqICAgXVxuICogfVxuICogYGBgXG4gKi9cblxubGV0IExWSUVXX0NPTVBPTkVOVF9DQUNIRSAhOiBNYXA8c3RyaW5nfG51bGwsIEFycmF5PGFueT4+O1xubGV0IExWSUVXX0VNQkVEREVEX0NBQ0hFICE6IE1hcDxzdHJpbmd8bnVsbCwgQXJyYXk8YW55Pj47XG5sZXQgTFZJRVdfUk9PVCAhOiBBcnJheTxhbnk+O1xuXG5pbnRlcmZhY2UgVFZpZXdEZWJ1ZyBleHRlbmRzIElUVmlldyB7XG4gIHR5cGU6IFRWaWV3VHlwZTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNsb25lcyBhIGJsdWVwcmludCBhbmQgY3JlYXRlcyBMVmlldy5cbiAqXG4gKiBTaW1wbGUgc2xpY2Ugd2lsbCBrZWVwIHRoZSBzYW1lIHR5cGUsIGFuZCB3ZSBuZWVkIGl0IHRvIGJlIExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZVRvTFZpZXdGcm9tVFZpZXdCbHVlcHJpbnQodFZpZXc6IFRWaWV3KTogTFZpZXcge1xuICBjb25zdCBkZWJ1Z1RWaWV3ID0gdFZpZXcgYXMgVFZpZXdEZWJ1ZztcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlld1RvQ2xvbmUoZGVidWdUVmlldy50eXBlLCB0Vmlldy50ZW1wbGF0ZSAmJiB0Vmlldy50ZW1wbGF0ZS5uYW1lKTtcbiAgcmV0dXJuIGxWaWV3LmNvbmNhdCh0Vmlldy5ibHVlcHJpbnQpIGFzIGFueTtcbn1cblxuZnVuY3Rpb24gZ2V0TFZpZXdUb0Nsb25lKHR5cGU6IFRWaWV3VHlwZSwgbmFtZTogc3RyaW5nIHwgbnVsbCk6IEFycmF5PGFueT4ge1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIFRWaWV3VHlwZS5Sb290OlxuICAgICAgaWYgKExWSUVXX1JPT1QgPT09IHVuZGVmaW5lZCkgTFZJRVdfUk9PVCA9IG5ldyAoY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xSb290VmlldycpKSgpO1xuICAgICAgcmV0dXJuIExWSUVXX1JPT1Q7XG4gICAgY2FzZSBUVmlld1R5cGUuQ29tcG9uZW50OlxuICAgICAgaWYgKExWSUVXX0NPTVBPTkVOVF9DQUNIRSA9PT0gdW5kZWZpbmVkKSBMVklFV19DT01QT05FTlRfQ0FDSEUgPSBuZXcgTWFwKCk7XG4gICAgICBsZXQgY29tcG9uZW50QXJyYXkgPSBMVklFV19DT01QT05FTlRfQ0FDSEUuZ2V0KG5hbWUpO1xuICAgICAgaWYgKGNvbXBvbmVudEFycmF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcG9uZW50QXJyYXkgPSBuZXcgKGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMQ29tcG9uZW50VmlldycgKyBuYW1lU3VmZml4KG5hbWUpKSkoKTtcbiAgICAgICAgTFZJRVdfQ09NUE9ORU5UX0NBQ0hFLnNldChuYW1lLCBjb21wb25lbnRBcnJheSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29tcG9uZW50QXJyYXk7XG4gICAgY2FzZSBUVmlld1R5cGUuRW1iZWRkZWQ6XG4gICAgICBpZiAoTFZJRVdfRU1CRURERURfQ0FDSEUgPT09IHVuZGVmaW5lZCkgTFZJRVdfRU1CRURERURfQ0FDSEUgPSBuZXcgTWFwKCk7XG4gICAgICBsZXQgZW1iZWRkZWRBcnJheSA9IExWSUVXX0VNQkVEREVEX0NBQ0hFLmdldChuYW1lKTtcbiAgICAgIGlmIChlbWJlZGRlZEFycmF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZW1iZWRkZWRBcnJheSA9IG5ldyAoY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xFbWJlZGRlZFZpZXcnICsgbmFtZVN1ZmZpeChuYW1lKSkpKCk7XG4gICAgICAgIExWSUVXX0VNQkVEREVEX0NBQ0hFLnNldChuYW1lLCBlbWJlZGRlZEFycmF5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbWJlZGRlZEFycmF5O1xuICB9XG4gIHRocm93IG5ldyBFcnJvcigndW5yZWFjaGFibGUgY29kZScpO1xufVxuXG5mdW5jdGlvbiBuYW1lU3VmZml4KHRleHQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAodGV4dCA9PSBudWxsKSByZXR1cm4gJyc7XG4gIGNvbnN0IGluZGV4ID0gdGV4dC5sYXN0SW5kZXhPZignX1RlbXBsYXRlJyk7XG4gIHJldHVybiAnXycgKyAoaW5kZXggPT09IC0xID8gdGV4dCA6IHRleHQuc3Vic3RyKDAsIGluZGV4KSk7XG59XG5cbi8qKlxuICogVGhpcyBjbGFzcyBpcyBhIGRlYnVnIHZlcnNpb24gb2YgT2JqZWN0IGxpdGVyYWwgc28gdGhhdCB3ZSBjYW4gaGF2ZSBjb25zdHJ1Y3RvciBuYW1lIHNob3cgdXBcbiAqIGluXG4gKiBkZWJ1ZyB0b29scyBpbiBuZ0Rldk1vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBUVmlld0NvbnN0cnVjdG9yID0gY2xhc3MgVFZpZXcgaW1wbGVtZW50cyBJVFZpZXcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyB0eXBlOiBUVmlld1R5cGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGlkOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgYmx1ZXByaW50OiBMVmlldywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHF1ZXJpZXM6IFRRdWVyaWVzfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPHt9PnxudWxsLCAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBub2RlOiBUVmlld05vZGV8VEVsZW1lbnROb2RlfG51bGwsICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRhdGE6IFREYXRhLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGV4cGFuZG9JbnN0cnVjdGlvbnM6IEV4cGFuZG9JbnN0cnVjdGlvbnN8bnVsbCwgIC8vXG4gICAgICBwdWJsaWMgZmlyc3RDcmVhdGVQYXNzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0YXRpY1ZpZXdRdWVyaWVzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3RhdGljQ29udGVudFF1ZXJpZXM6IGJvb2xlYW4sICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcmVPcmRlckhvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29udGVudEhvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsZWFudXA6IGFueVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29udGVudFF1ZXJpZXM6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGwsICAgICAgIC8vXG4gICAgICBwdWJsaWMgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsLCAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCwgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29uc3RzOiBUQ29uc3RhbnRzfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICkge31cblxuICBnZXQgdGVtcGxhdGVfKCk6IHN0cmluZyB7XG4gICAgY29uc3QgYnVmOiBzdHJpbmdbXSA9IFtdO1xuICAgIHByb2Nlc3NUTm9kZUNoaWxkcmVuKHRoaXMuZmlyc3RDaGlsZCwgYnVmKTtcbiAgICByZXR1cm4gYnVmLmpvaW4oJycpO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgVE5vZGVDb25zdHJ1Y3RvciA9IGNsYXNzIFROb2RlIGltcGxlbWVudHMgSVROb2RlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgdFZpZXdfOiBUVmlldywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB0eXBlOiBUTm9kZVR5cGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5qZWN0b3JJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVTdGFydDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZUVuZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBmbGFnczogVE5vZGVGbGFncywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdGFnTmFtZTogc3RyaW5nfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBhdHRyczogKHN0cmluZ3xBdHRyaWJ1dGVNYXJrZXJ8KHN0cmluZ3xTZWxlY3RvckZsYWdzKVtdKVtdfG51bGwsICAvL1xuICAgICAgcHVibGljIGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5pdGlhbElucHV0czogKHN0cmluZ1tdfG51bGwpW118bnVsbHx1bmRlZmluZWQsICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbnB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdFZpZXdzOiBJVFZpZXd8SVRWaWV3W118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBuZXh0OiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb2plY3Rpb25OZXh0OiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2hpbGQ6IElUTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb2plY3Rpb246IG51bWJlcnwoSVROb2RlfFJOb2RlW10pW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3R5bGVzOiBUU3R5bGluZ0NvbnRleHR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGFzc2VzOiBUU3R5bGluZ0NvbnRleHR8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgKSB7fVxuXG4gIGdldCB0eXBlXygpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICBjYXNlIFROb2RlVHlwZS5Db250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkNvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5FbGVtZW50JztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5JY3VDb250YWluZXInO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuUHJvamVjdGlvbjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuUHJvamVjdGlvbic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5WaWV3OlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5WaWV3JztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLj8/Pyc7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZsYWdzXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGZsYWdzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeScpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmcpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmcnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncycpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3QnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNEZXRhY2hlZCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0RldGFjaGVkJyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzUHJvamVjdGVkJyk7XG4gICAgcmV0dXJuIGZsYWdzLmpvaW4oJ3wnKTtcbiAgfVxuXG4gIGdldCB0ZW1wbGF0ZV8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBidWY6IHN0cmluZ1tdID0gW107XG4gICAgYnVmLnB1c2goJzwnLCB0aGlzLnRhZ05hbWUgfHwgdGhpcy50eXBlXyk7XG4gICAgaWYgKHRoaXMuYXR0cnMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hdHRycy5sZW5ndGg7KSB7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gdGhpcy5hdHRyc1tpKytdO1xuICAgICAgICBpZiAodHlwZW9mIGF0dHJOYW1lID09ICdudW1iZXInKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXR0clZhbHVlID0gdGhpcy5hdHRyc1tpKytdO1xuICAgICAgICBidWYucHVzaCgnICcsIGF0dHJOYW1lIGFzIHN0cmluZywgJz1cIicsIGF0dHJWYWx1ZSBhcyBzdHJpbmcsICdcIicpO1xuICAgICAgfVxuICAgIH1cbiAgICBidWYucHVzaCgnPicpO1xuICAgIHByb2Nlc3NUTm9kZUNoaWxkcmVuKHRoaXMuY2hpbGQsIGJ1Zik7XG4gICAgYnVmLnB1c2goJzwvJywgdGhpcy50YWdOYW1lIHx8IHRoaXMudHlwZV8sICc+Jyk7XG4gICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odE5vZGU6IFROb2RlIHwgbnVsbCwgYnVmOiBzdHJpbmdbXSkge1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBidWYucHVzaCgodE5vZGUgYXMgYW55IGFze3RlbXBsYXRlXzogc3RyaW5nfSkudGVtcGxhdGVfKTtcbiAgICB0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIH1cbn1cblxuY29uc3QgVFZpZXdEYXRhID0gTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3RGF0YScpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5sZXQgVFZJRVdEQVRBX0VNUFRZOlxuICAgIHVua25vd25bXTsgIC8vIGNhbid0IGluaXRpYWxpemUgaGVyZSBvciBpdCB3aWxsIG5vdCBiZSB0cmVlIHNoYWtlbiwgYmVjYXVzZSBgTFZpZXdgXG4gICAgICAgICAgICAgICAgLy8gY29uc3RydWN0b3IgY291bGQgaGF2ZSBzaWRlLWVmZmVjdHMuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gY2xvbmVzIGEgYmx1ZXByaW50IGFuZCBjcmVhdGVzIFREYXRhLlxuICpcbiAqIFNpbXBsZSBzbGljZSB3aWxsIGtlZXAgdGhlIHNhbWUgdHlwZSwgYW5kIHdlIG5lZWQgaXQgdG8gYmUgVERhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lVG9UVmlld0RhdGEobGlzdDogYW55W10pOiBURGF0YSB7XG4gIGlmIChUVklFV0RBVEFfRU1QVFkgPT09IHVuZGVmaW5lZCkgVFZJRVdEQVRBX0VNUFRZID0gbmV3IFRWaWV3RGF0YSgpO1xuICByZXR1cm4gVFZJRVdEQVRBX0VNUFRZLmNvbmNhdChsaXN0KSBhcyBhbnk7XG59XG5cbmV4cG9ydCBjb25zdCBMVmlld0JsdWVwcmludCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xWaWV3Qmx1ZXByaW50JykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBNYXRjaGVzQXJyYXkgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdNYXRjaGVzQXJyYXknKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFRWaWV3Q29tcG9uZW50cyA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3Q29tcG9uZW50cycpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVE5vZGVMb2NhbE5hbWVzID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVE5vZGVMb2NhbE5hbWVzJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUTm9kZUluaXRpYWxJbnB1dHMgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxJbnB1dHMnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbERhdGEgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUluaXRpYWxEYXRhJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBMQ2xlYW51cCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDbGVhbnVwJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUQ2xlYW51cCA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RDbGVhbnVwJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsVmlldywgbmV3IExWaWV3RGVidWcobFZpZXcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxDb250YWluZXIsIG5ldyBMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3KTogTFZpZXdEZWJ1ZztcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcgfCBudWxsKTogTFZpZXdEZWJ1Z3xudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyB8IExDb250YWluZXIgfCBudWxsKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogYW55KTogYW55IHtcbiAgaWYgKG9iaikge1xuICAgIGNvbnN0IGRlYnVnID0gKG9iaiBhcyBhbnkpLmRlYnVnO1xuICAgIGFzc2VydERlZmluZWQoZGVidWcsICdPYmplY3QgZG9lcyBub3QgaGF2ZSBhIGRlYnVnIHJlcHJlc2VudGF0aW9uLicpO1xuICAgIHJldHVybiBkZWJ1ZztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG59XG5cbi8qKlxuICogVXNlIHRoaXMgbWV0aG9kIHRvIHVud3JhcCBhIG5hdGl2ZSBlbGVtZW50IGluIGBMVmlld2AgYW5kIGNvbnZlcnQgaXQgaW50byBIVE1MIGZvciBlYXNpZXJcbiAqIHJlYWRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIHBvc3NpYmx5IHdyYXBwZWQgbmF0aXZlIERPTSBub2RlLlxuICogQHBhcmFtIGluY2x1ZGVDaGlsZHJlbiBJZiBgdHJ1ZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBpbmNsdWRlIGNoaWxkIGVsZW1lbnRzXG4gKiAoc2FtZVxuICogYXMgYG91dGVySFRNTGApLiBJZiBgZmFsc2VgIHRoZW4gdGhlIHNlcmlhbGl6ZWQgSFRNTCBmb3JtIHdpbGwgb25seSBjb250YWluIHRoZSBlbGVtZW50XG4gKiBpdHNlbGZcbiAqICh3aWxsIG5vdCBzZXJpYWxpemUgY2hpbGQgZWxlbWVudHMpLlxuICovXG5mdW5jdGlvbiB0b0h0bWwodmFsdWU6IGFueSwgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IG5vZGU6IEhUTUxFbGVtZW50fG51bGwgPSB1bndyYXBSTm9kZSh2YWx1ZSkgYXMgYW55O1xuICBpZiAobm9kZSkge1xuICAgIGNvbnN0IGlzVGV4dE5vZGUgPSBub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERTtcbiAgICBjb25zdCBvdXRlckhUTUwgPSAoaXNUZXh0Tm9kZSA/IG5vZGUudGV4dENvbnRlbnQgOiBub2RlLm91dGVySFRNTCkgfHwgJyc7XG4gICAgaWYgKGluY2x1ZGVDaGlsZHJlbiB8fCBpc1RleHROb2RlKSB7XG4gICAgICByZXR1cm4gb3V0ZXJIVE1MO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbm5lckhUTUwgPSAnPicgKyBub2RlLmlubmVySFRNTCArICc8JztcbiAgICAgIHJldHVybiAob3V0ZXJIVE1MLnNwbGl0KGlubmVySFRNTClbMF0pICsgJz4nO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTFZpZXdEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEZsYWdzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYExWaWV3YCB1bnBhY2tlZCBpbnRvIGEgbW9yZSByZWFkYWJsZSBzdGF0ZS5cbiAgICovXG4gIGdldCBmbGFncygpIHtcbiAgICBjb25zdCBmbGFncyA9IHRoaXMuX3Jhd19sVmlld1tGTEFHU107XG4gICAgcmV0dXJuIHtcbiAgICAgIF9fcmF3X19mbGFnc19fOiBmbGFncyxcbiAgICAgIGluaXRQaGFzZVN0YXRlOiBmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrLFxuICAgICAgY3JlYXRpb25Nb2RlOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSxcbiAgICAgIGZpcnN0Vmlld1Bhc3M6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyksXG4gICAgICBjaGVja0Fsd2F5czogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSxcbiAgICAgIGRpcnR5OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkpLFxuICAgICAgYXR0YWNoZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5BdHRhY2hlZCksXG4gICAgICBkZXN0cm95ZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpLFxuICAgICAgaXNSb290OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuSXNSb290KSxcbiAgICAgIGluZGV4V2l0aGluSW5pdFBoYXNlOiBmbGFncyA+PiBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlU2hpZnQsXG4gICAgfTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnfG51bGwgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbUEFSRU5UXSk7IH1cbiAgZ2V0IGhvc3QoKTogc3RyaW5nfG51bGwgeyByZXR1cm4gdG9IdG1sKHRoaXMuX3Jhd19sVmlld1tIT1NUXSwgdHJ1ZSk7IH1cbiAgZ2V0IGh0bWwoKTogc3RyaW5nIHsgcmV0dXJuICh0aGlzLm5vZGVzIHx8IFtdKS5tYXAobm9kZSA9PiB0b0h0bWwobm9kZS5uYXRpdmUsIHRydWUpKS5qb2luKCcnKTsgfVxuICBnZXQgY29udGV4dCgpOiB7fXxudWxsIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tDT05URVhUXTsgfVxuICAvKipcbiAgICogVGhlIHRyZWUgb2Ygbm9kZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGBMVmlld2AuIFRoZSBub2RlcyBoYXZlIGJlZW4gbm9ybWFsaXplZCBpbnRvXG4gICAqIGFcbiAgICogdHJlZSBzdHJ1Y3R1cmUgd2l0aCByZWxldmFudCBkZXRhaWxzIHB1bGxlZCBvdXQgZm9yIHJlYWRhYmlsaXR5LlxuICAgKi9cbiAgZ2V0IG5vZGVzKCk6IERlYnVnTm9kZVtdfG51bGwge1xuICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fcmF3X2xWaWV3O1xuICAgIGNvbnN0IHROb2RlID0gbFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgcmV0dXJuIHRvRGVidWdOb2Rlcyh0Tm9kZSwgbFZpZXcpO1xuICB9XG5cbiAgZ2V0IHRWaWV3KCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1RWSUVXXTsgfVxuICBnZXQgY2xlYW51cCgpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tDTEVBTlVQXTsgfVxuICBnZXQgaW5qZWN0b3IoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbSU5KRUNUT1JdOyB9XG4gIGdldCByZW5kZXJlckZhY3RvcnkoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07IH1cbiAgZ2V0IHJlbmRlcmVyKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSXTsgfVxuICBnZXQgc2FuaXRpemVyKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1NBTklUSVpFUl07IH1cbiAgZ2V0IGNoaWxkSGVhZCgpIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX0hFQURdKTsgfVxuICBnZXQgbmV4dCgpIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W05FWFRdKTsgfVxuICBnZXQgY2hpbGRUYWlsKCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbQ0hJTERfVEFJTF0pOyB9XG4gIGdldCBkZWNsYXJhdGlvblZpZXcoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tERUNMQVJBVElPTl9WSUVXXSk7IH1cbiAgZ2V0IHF1ZXJpZXMoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUVVFUklFU107IH1cbiAgZ2V0IHRIb3N0KCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W1RfSE9TVF07IH1cblxuICAvKipcbiAgICogTm9ybWFsaXplZCB2aWV3IG9mIGNoaWxkIHZpZXdzIChhbmQgY29udGFpbmVycykgYXR0YWNoZWQgYXQgdGhpcyBsb2NhdGlvbi5cbiAgICovXG4gIGdldCBjaGlsZFZpZXdzKCk6IEFycmF5PExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnPiB7XG4gICAgY29uc3QgY2hpbGRWaWV3czogQXJyYXk8TFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWc+ID0gW107XG4gICAgbGV0IGNoaWxkID0gdGhpcy5jaGlsZEhlYWQ7XG4gICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICBjaGlsZFZpZXdzLnB1c2goY2hpbGQpO1xuICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRWaWV3cztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIGh0bWw6IHN0cmluZ3xudWxsO1xuICBuYXRpdmU6IE5vZGU7XG4gIHN0eWxlczogRGVidWdOb2RlU3R5bGluZ3xudWxsO1xuICBjbGFzc2VzOiBEZWJ1Z05vZGVTdHlsaW5nfG51bGw7XG4gIG5vZGVzOiBEZWJ1Z05vZGVbXXxudWxsO1xuICBjb21wb25lbnQ6IExWaWV3RGVidWd8bnVsbDtcbn1cblxuLyoqXG4gKiBUdXJucyBhIGZsYXQgbGlzdCBvZiBub2RlcyBpbnRvIGEgdHJlZSBieSB3YWxraW5nIHRoZSBhc3NvY2lhdGVkIGBUTm9kZWAgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGVcbiAqIEBwYXJhbSBsVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1Z05vZGVzKHROb2RlOiBUTm9kZSB8IG51bGwsIGxWaWV3OiBMVmlldyk6IERlYnVnTm9kZVtdfG51bGwge1xuICBpZiAodE5vZGUpIHtcbiAgICBjb25zdCBkZWJ1Z05vZGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGxldCB0Tm9kZUN1cnNvcjogVE5vZGV8bnVsbCA9IHROb2RlO1xuICAgIHdoaWxlICh0Tm9kZUN1cnNvcikge1xuICAgICAgZGVidWdOb2Rlcy5wdXNoKGJ1aWxkRGVidWdOb2RlKHROb2RlQ3Vyc29yLCBsVmlldywgdE5vZGVDdXJzb3IuaW5kZXgpKTtcbiAgICAgIHROb2RlQ3Vyc29yID0gdE5vZGVDdXJzb3IubmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIGRlYnVnTm9kZXM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRGVidWdOb2RlKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBub2RlSW5kZXg6IG51bWJlcik6IERlYnVnTm9kZSB7XG4gIGNvbnN0IHJhd1ZhbHVlID0gbFZpZXdbbm9kZUluZGV4XTtcbiAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUocmF3VmFsdWUpO1xuICBjb25zdCBjb21wb25lbnRMVmlld0RlYnVnID0gdG9EZWJ1ZyhyZWFkTFZpZXdWYWx1ZShyYXdWYWx1ZSkpO1xuICBjb25zdCBzdHlsZXMgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLnN0eWxlcykgP1xuICAgICAgbmV3IE5vZGVTdHlsaW5nRGVidWcodE5vZGUuc3R5bGVzIGFzIGFueSBhcyBUU3R5bGluZ0NvbnRleHQsIHROb2RlLCBsVmlldywgZmFsc2UpIDpcbiAgICAgIG51bGw7XG4gIGNvbnN0IGNsYXNzZXMgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLmNsYXNzZXMpID9cbiAgICAgIG5ldyBOb2RlU3R5bGluZ0RlYnVnKHROb2RlLmNsYXNzZXMgYXMgYW55IGFzIFRTdHlsaW5nQ29udGV4dCwgdE5vZGUsIGxWaWV3LCB0cnVlKSA6XG4gICAgICBudWxsO1xuICByZXR1cm4ge1xuICAgIGh0bWw6IHRvSHRtbChuYXRpdmUpLFxuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSwgc3R5bGVzLCBjbGFzc2VzLFxuICAgIG5vZGVzOiB0b0RlYnVnTm9kZXModE5vZGUuY2hpbGQsIGxWaWV3KSxcbiAgICBjb21wb25lbnQ6IGNvbXBvbmVudExWaWV3RGVidWcsXG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBMQ29udGFpbmVyRGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbENvbnRhaW5lcjogTENvbnRhaW5lcikge31cblxuICBnZXQgYWN0aXZlSW5kZXgoKTogbnVtYmVyIHsgcmV0dXJuIGdldExDb250YWluZXJBY3RpdmVJbmRleCh0aGlzLl9yYXdfbENvbnRhaW5lcik7IH1cbiAgZ2V0IGhhc1RyYW5zcGxhbnRlZFZpZXdzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy5fcmF3X2xDb250YWluZXJbQUNUSVZFX0lOREVYXSAmIEFjdGl2ZUluZGV4RmxhZy5IQVNfVFJBTlNQTEFOVEVEX1ZJRVdTKSA9PT1cbiAgICAgICAgQWN0aXZlSW5kZXhGbGFnLkhBU19UUkFOU1BMQU5URURfVklFV1M7XG4gIH1cbiAgZ2V0IHZpZXdzKCk6IExWaWV3RGVidWdbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyLnNsaWNlKENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKVxuICAgICAgICAubWFwKHRvRGVidWcgYXMobDogTFZpZXcpID0+IExWaWV3RGVidWcpO1xuICB9XG4gIGdldCBwYXJlbnQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW1BBUkVOVF0pOyB9XG4gIGdldCBtb3ZlZFZpZXdzKCk6IExWaWV3W118bnVsbCB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltNT1ZFRF9WSUVXU107IH1cbiAgZ2V0IGhvc3QoKTogUkVsZW1lbnR8UkNvbW1lbnR8TFZpZXcgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbSE9TVF07IH1cbiAgZ2V0IG5hdGl2ZSgpOiBSQ29tbWVudCB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltOQVRJVkVdOyB9XG4gIGdldCBuZXh0KCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbENvbnRhaW5lcltORVhUXSk7IH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYExWaWV3YCB2YWx1ZSBpZiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgYExWaWV3YCBpZiBhbnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRMVmlld1ZhbHVlKHZhbHVlOiBhbnkpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gVGhpcyBjaGVjayBpcyBub3QgcXVpdGUgcmlnaHQsIGFzIGl0IGRvZXMgbm90IHRha2UgaW50byBhY2NvdW50IGBTdHlsaW5nQ29udGV4dGBcbiAgICAvLyBUaGlzIGlzIHdoeSBpdCBpcyBpbiBkZWJ1Zywgbm90IGluIHV0aWwudHNcbiAgICBpZiAodmFsdWUubGVuZ3RoID49IEhFQURFUl9PRkZTRVQgLSAxKSByZXR1cm4gdmFsdWUgYXMgTFZpZXc7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIEkxOE5EZWJ1Z0l0ZW0ge1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG5cbiAgZ2V0IHROb2RlKCkgeyByZXR1cm4gZ2V0VE5vZGUodGhpcy5ub2RlSW5kZXgsIHRoaXMuX2xWaWV3KTsgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIF9fcmF3X29wQ29kZTogYW55LCBwcml2YXRlIF9sVmlldzogTFZpZXcsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlcixcbiAgICAgIHB1YmxpYyB0eXBlOiBzdHJpbmcpIHt9XG59XG5cbi8qKlxuICogVHVybnMgYSBsaXN0IG9mIFwiQ3JlYXRlXCIgJiBcIlVwZGF0ZVwiIE9wQ29kZXMgaW50byBhIGh1bWFuLXJlYWRhYmxlIGxpc3Qgb2Ygb3BlcmF0aW9ucyBmb3JcbiAqIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBtdXRhdGVPcENvZGVzIG11dGF0aW9uIG9wQ29kZXMgdG8gcmVhZFxuICogQHBhcmFtIHVwZGF0ZU9wQ29kZXMgdXBkYXRlIG9wQ29kZXMgdG8gcmVhZFxuICogQHBhcmFtIGljdXMgbGlzdCBvZiBJQ1UgZXhwcmVzc2lvbnNcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0aGUgb3BDb2RlcyBhcmUgYWN0aW5nIG9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hJMThuT3BDb2Rlc0RlYnVnKFxuICAgIG11dGF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCxcbiAgICBsVmlldzogTFZpZXcpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobXV0YXRlT3BDb2RlcywgbmV3IEkxOG5NdXRhdGVPcENvZGVzRGVidWcobXV0YXRlT3BDb2RlcywgbFZpZXcpKTtcbiAgYXR0YWNoRGVidWdPYmplY3QodXBkYXRlT3BDb2RlcywgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcodXBkYXRlT3BDb2RlcywgaWN1cywgbFZpZXcpKTtcblxuICBpZiAoaWN1cykge1xuICAgIGljdXMuZm9yRWFjaChpY3UgPT4ge1xuICAgICAgaWN1LmNyZWF0ZS5mb3JFYWNoKFxuICAgICAgICAgIGljdUNhc2UgPT4geyBhdHRhY2hEZWJ1Z09iamVjdChpY3VDYXNlLCBuZXcgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyhpY3VDYXNlLCBsVmlldykpOyB9KTtcbiAgICAgIGljdS51cGRhdGUuZm9yRWFjaChpY3VDYXNlID0+IHtcbiAgICAgICAgYXR0YWNoRGVidWdPYmplY3QoaWN1Q2FzZSwgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcoaWN1Q2FzZSwgaWN1cywgbFZpZXcpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnIGltcGxlbWVudHMgSTE4bk9wQ29kZXNEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX19yYXdfb3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIHByaXZhdGUgcmVhZG9ubHkgX19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBvcGVyYXRpb24gaW5mb3JtYXRpb24gYWJvdXQgaG93IHRoZSBPcENvZGVzIHdpbGwgYWN0IG9uIHRoZSB2aWV3LlxuICAgKi9cbiAgZ2V0IG9wZXJhdGlvbnMoKSB7XG4gICAgY29uc3Qge19fbFZpZXcsIF9fcmF3X29wQ29kZXN9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBfX3Jhd19vcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvcENvZGUgPSBfX3Jhd19vcENvZGVzW2ldO1xuICAgICAgbGV0IHJlc3VsdDogYW55O1xuICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICB0eXBlOiAnQ3JlYXRlIFRleHQgTm9kZScsXG4gICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgdGV4dDogb3BDb2RlLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBkZXN0aW5hdGlvbk5vZGVJbmRleCwgJ0FwcGVuZENoaWxkJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnU2VsZWN0Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZDpcbiAgICAgICAgICAgIGxldCBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBlbGVtZW50SW5kZXgsICdFbGVtZW50RW5kJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgIGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGVsZW1lbnRJbmRleCwgJ0F0dHInKTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0ck5hbWUnXSA9IF9fcmF3X29wQ29kZXNbKytpXTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0clZhbHVlJ10gPSBfX3Jhd19vcENvZGVzWysraV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICBzd2l0Y2ggKG9wQ29kZSkge1xuICAgICAgICAgIGNhc2UgQ09NTUVOVF9NQVJLRVI6XG4gICAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICB0eXBlOiAnQ09NTUVOVF9NQVJLRVInLFxuICAgICAgICAgICAgICBjb21tZW50VmFsdWU6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgIHR5cGU6ICdFTEVNRU5UX01BUktFUicsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgIHR5cGU6ICdVbmtub3duIE9wIENvZGUnLFxuICAgICAgICAgIGNvZGU6IG9wQ29kZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEkxOG5VcGRhdGVPcENvZGVzRGVidWcgaW1wbGVtZW50cyBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9fcmF3X29wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBwcml2YXRlIHJlYWRvbmx5IGljdXM6IFRJY3VbXXxudWxsLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfX2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogQSBsaXN0IG9mIG9wZXJhdGlvbiBpbmZvcm1hdGlvbiBhYm91dCBob3cgdGhlIE9wQ29kZXMgd2lsbCBhY3Qgb24gdGhlIHZpZXcuXG4gICAqL1xuICBnZXQgb3BlcmF0aW9ucygpIHtcbiAgICBjb25zdCB7X19sVmlldywgX19yYXdfb3BDb2RlcywgaWN1c30gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9fcmF3X29wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICAgIGNvbnN0IGNoZWNrQml0ID0gX19yYXdfb3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgICAgY29uc3Qgc2tpcENvZGVzID0gX19yYXdfb3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IF9fcmF3X29wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlICs9IG9wQ29kZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKG9wQ29kZSA8IDApIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBiaW5kaW5nIGluZGV4IHdob3NlIHZhbHVlIGlzIG5lZ2F0aXZlXG4gICAgICAgICAgICAvLyBXZSBjYW5ub3Qga25vdyB0aGUgdmFsdWUgb2YgdGhlIGJpbmRpbmcgc28gd2Ugb25seSBzaG93IHRoZSBpbmRleFxuICAgICAgICAgICAgdmFsdWUgKz0gYO+/vSR7LW9wQ29kZSAtIDF977+9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIGxldCB0SWN1SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCB0SWN1OiBUSWN1O1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gX19yYXdfb3BDb2Rlc1srK2pdO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ0F0dHInLFxuICAgICAgICAgICAgICAgICAgYXR0clZhbHVlOiB2YWx1ZSwgYXR0ck5hbWUsIHNhbml0aXplRm4sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ1RleHQnLCBub2RlSW5kZXgsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiB2YWx1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaDpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdJY3VTd2l0Y2gnKTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3VJbmRleCddID0gdEljdUluZGV4O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnY2hlY2tCaXQnXSA9IGNoZWNrQml0O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnbWFpbkJpbmRpbmcnXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdSddID0gdEljdTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ0ljdVVwZGF0ZScpO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdUluZGV4J10gPSB0SWN1SW5kZXg7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydjaGVja0JpdCddID0gY2hlY2tCaXQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1J10gPSB0SWN1O1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaSArPSBza2lwQ29kZXM7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSTE4bk9wQ29kZXNEZWJ1ZyB7IG9wZXJhdGlvbnM6IGFueVtdOyB9XG4iXX0=