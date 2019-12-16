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
    classes, //
    classBindings, //
    styleBindings) {
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
        this.classBindings = classBindings;
        this.styleBindings = styleBindings;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxZQUFZLEVBQW1CLHVCQUF1QixFQUFjLFdBQVcsRUFBRSxNQUFNLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUVoSSxPQUFPLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBaUYsTUFBTSxvQkFBb0IsQ0FBQztBQU1sSixPQUFPLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUF1QixLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBWSxRQUFRLEVBQXFCLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQVMsS0FBSyxFQUFxQyxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUM3UyxPQUFPLEVBQW1CLGdCQUFnQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkQsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVuRixJQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsT0FBTyxT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Q0FBQyxHQUFHLEtBQUssQ0FBQztvQ0FDOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztvQ0FDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDckIsTUFBTTtnQ0FDUjtvQ0FDRSxTQUFTLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFXLENBQUM7b0NBQ3pDLElBQUksR0FBRyxJQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0NBQ3pCLE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztvQ0FDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztvQ0FDaEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztvQ0FDOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztvQ0FDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDckIsTUFBTTs2QkFDVDt5QkFDRjtxQkFDRjtpQkFDRjtnQkFDRCxDQUFDLElBQUksU0FBUyxDQUFDO2FBQ2hCO1lBQ0QsT0FBTyxPQUFPLENBQUM7UUFDakIsQ0FBQzs7O09BQUE7SUFDSCw2QkFBQztBQUFELENBQUMsQUE3RUQsSUE2RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBDb21wb25lbnRUZW1wbGF0ZX0gZnJvbSAnLi4nO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vY29yZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge2luaXROZ0Rldk1vZGV9IGZyb20gJy4uLy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIEFjdGl2ZUluZGV4RmxhZywgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTLCBOQVRJVkV9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3QsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTU1FTlRfTUFSS0VSLCBFTEVNRU5UX01BUktFUiwgSTE4bk11dGF0ZU9wQ29kZSwgSTE4bk11dGF0ZU9wQ29kZXMsIEkxOG5VcGRhdGVPcENvZGUsIEkxOG5VcGRhdGVPcENvZGVzLCBUSWN1fSBmcm9tICcuLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzZXMsIFRDb25zdGFudHMsIFRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlIGFzIElUTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2VsZWN0b3JGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7VFF1ZXJpZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7VFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ1JhbmdlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDSElMRF9UQUlMLCBDTEVBTlVQLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBFeHBhbmRvSW5zdHJ1Y3Rpb25zLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgSG9va0RhdGEsIElOSkVDVE9SLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgUkVOREVSRVJfRkFDVE9SWSwgU0FOSVRJWkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3IGFzIElUVmlldywgVFZpZXcsIFRWaWV3VHlwZSwgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z05vZGVTdHlsaW5nLCBOb2RlU3R5bGluZ0RlYnVnfSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldExDb250YWluZXJBY3RpdmVJbmRleCwgZ2V0VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5jb25zdCBOR19ERVZfTU9ERSA9ICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgISFuZ0Rldk1vZGUpICYmIGluaXROZ0Rldk1vZGUoKSk7XG5cbi8qXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgY29uZGl0aW9uYWxseSBhdHRhY2hlZCBjbGFzc2VzIHdoaWNoIHByb3ZpZGUgaHVtYW4gcmVhZGFibGUgKGRlYnVnKSBsZXZlbFxuICogaW5mb3JtYXRpb24gZm9yIGBMVmlld2AsIGBMQ29udGFpbmVyYCBhbmQgb3RoZXIgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzLiBUaGVzZSBkYXRhIHN0cnVjdHVyZXNcbiAqIGFyZSBzdG9yZWQgaW50ZXJuYWxseSBhcyBhcnJheSB3aGljaCBtYWtlcyBpdCB2ZXJ5IGRpZmZpY3VsdCBkdXJpbmcgZGVidWdnaW5nIHRvIHJlYXNvbiBhYm91dCB0aGVcbiAqIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHN5c3RlbS5cbiAqXG4gKiBQYXRjaGluZyB0aGUgYXJyYXkgd2l0aCBleHRyYSBwcm9wZXJ0eSBkb2VzIGNoYW5nZSB0aGUgYXJyYXkncyBoaWRkZW4gY2xhc3MnIGJ1dCBpdCBkb2VzIG5vdFxuICogY2hhbmdlIHRoZSBjb3N0IG9mIGFjY2VzcywgdGhlcmVmb3JlIHRoaXMgcGF0Y2hpbmcgc2hvdWxkIG5vdCBoYXZlIHNpZ25pZmljYW50IGlmIGFueSBpbXBhY3QgaW5cbiAqIGBuZ0Rldk1vZGVgIG1vZGUuIChzZWU6IGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS12cy1tb25rZXktcGF0Y2gtYXJyYXkpXG4gKlxuICogU28gaW5zdGVhZCBvZiBzZWVpbmc6XG4gKiBgYGBcbiAqIEFycmF5KDMwKSBbT2JqZWN0LCA2NTksIG51bGwsIOKApl1cbiAqIGBgYFxuICpcbiAqIFlvdSBnZXQgdG8gc2VlOlxuICogYGBgXG4gKiBMVmlld0RlYnVnIHtcbiAqICAgdmlld3M6IFsuLi5dLFxuICogICBmbGFnczoge2F0dGFjaGVkOiB0cnVlLCAuLi59XG4gKiAgIG5vZGVzOiBbXG4gKiAgICAge2h0bWw6ICc8ZGl2IGlkPVwiMTIzXCI+JywgLi4uLCBub2RlczogW1xuICogICAgICAge2h0bWw6ICc8c3Bhbj4nLCAuLi4sIG5vZGVzOiBudWxsfVxuICogICAgIF19XG4gKiAgIF1cbiAqIH1cbiAqIGBgYFxuICovXG5cbmxldCBMVklFV19DT01QT05FTlRfQ0FDSEUgITogTWFwPHN0cmluZ3xudWxsLCBBcnJheTxhbnk+PjtcbmxldCBMVklFV19FTUJFRERFRF9DQUNIRSAhOiBNYXA8c3RyaW5nfG51bGwsIEFycmF5PGFueT4+O1xubGV0IExWSUVXX1JPT1QgITogQXJyYXk8YW55PjtcblxuaW50ZXJmYWNlIFRWaWV3RGVidWcgZXh0ZW5kcyBJVFZpZXcge1xuICB0eXBlOiBUVmlld1R5cGU7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgTFZpZXcuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb0xWaWV3RnJvbVRWaWV3Qmx1ZXByaW50KHRWaWV3OiBUVmlldyk6IExWaWV3IHtcbiAgY29uc3QgZGVidWdUVmlldyA9IHRWaWV3IGFzIFRWaWV3RGVidWc7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXdUb0Nsb25lKGRlYnVnVFZpZXcudHlwZSwgdFZpZXcudGVtcGxhdGUgJiYgdFZpZXcudGVtcGxhdGUubmFtZSk7XG4gIHJldHVybiBsVmlldy5jb25jYXQodFZpZXcuYmx1ZXByaW50KSBhcyBhbnk7XG59XG5cbmZ1bmN0aW9uIGdldExWaWV3VG9DbG9uZSh0eXBlOiBUVmlld1R5cGUsIG5hbWU6IHN0cmluZyB8IG51bGwpOiBBcnJheTxhbnk+IHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBUVmlld1R5cGUuUm9vdDpcbiAgICAgIGlmIChMVklFV19ST09UID09PSB1bmRlZmluZWQpIExWSUVXX1JPT1QgPSBuZXcgKGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMUm9vdFZpZXcnKSkoKTtcbiAgICAgIHJldHVybiBMVklFV19ST09UO1xuICAgIGNhc2UgVFZpZXdUeXBlLkNvbXBvbmVudDpcbiAgICAgIGlmIChMVklFV19DT01QT05FTlRfQ0FDSEUgPT09IHVuZGVmaW5lZCkgTFZJRVdfQ09NUE9ORU5UX0NBQ0hFID0gbmV3IE1hcCgpO1xuICAgICAgbGV0IGNvbXBvbmVudEFycmF5ID0gTFZJRVdfQ09NUE9ORU5UX0NBQ0hFLmdldChuYW1lKTtcbiAgICAgIGlmIChjb21wb25lbnRBcnJheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudEFycmF5ID0gbmV3IChjcmVhdGVOYW1lZEFycmF5VHlwZSgnTENvbXBvbmVudFZpZXcnICsgbmFtZVN1ZmZpeChuYW1lKSkpKCk7XG4gICAgICAgIExWSUVXX0NPTVBPTkVOVF9DQUNIRS5zZXQobmFtZSwgY29tcG9uZW50QXJyYXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbXBvbmVudEFycmF5O1xuICAgIGNhc2UgVFZpZXdUeXBlLkVtYmVkZGVkOlxuICAgICAgaWYgKExWSUVXX0VNQkVEREVEX0NBQ0hFID09PSB1bmRlZmluZWQpIExWSUVXX0VNQkVEREVEX0NBQ0hFID0gbmV3IE1hcCgpO1xuICAgICAgbGV0IGVtYmVkZGVkQXJyYXkgPSBMVklFV19FTUJFRERFRF9DQUNIRS5nZXQobmFtZSk7XG4gICAgICBpZiAoZW1iZWRkZWRBcnJheSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGVtYmVkZGVkQXJyYXkgPSBuZXcgKGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMRW1iZWRkZWRWaWV3JyArIG5hbWVTdWZmaXgobmFtZSkpKSgpO1xuICAgICAgICBMVklFV19FTUJFRERFRF9DQUNIRS5zZXQobmFtZSwgZW1iZWRkZWRBcnJheSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1iZWRkZWRBcnJheTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3VucmVhY2hhYmxlIGNvZGUnKTtcbn1cblxuZnVuY3Rpb24gbmFtZVN1ZmZpeCh0ZXh0OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKHRleHQgPT0gbnVsbCkgcmV0dXJuICcnO1xuICBjb25zdCBpbmRleCA9IHRleHQubGFzdEluZGV4T2YoJ19UZW1wbGF0ZScpO1xuICByZXR1cm4gJ18nICsgKGluZGV4ID09PSAtMSA/IHRleHQgOiB0ZXh0LnN1YnN0cigwLCBpbmRleCkpO1xufVxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgYSBkZWJ1ZyB2ZXJzaW9uIG9mIE9iamVjdCBsaXRlcmFsIHNvIHRoYXQgd2UgY2FuIGhhdmUgY29uc3RydWN0b3IgbmFtZSBzaG93IHVwXG4gKiBpblxuICogZGVidWcgdG9vbHMgaW4gbmdEZXZNb2RlLlxuICovXG5leHBvcnQgY29uc3QgVFZpZXdDb25zdHJ1Y3RvciA9IGNsYXNzIFRWaWV3IGltcGxlbWVudHMgSVRWaWV3IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgdHlwZTogVFZpZXdUeXBlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJsdWVwcmludDogTFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBxdWVyaWVzOiBUUXVlcmllc3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCwgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkYXRhOiBURGF0YSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsICAvL1xuICAgICAgcHVibGljIGZpcnN0Q3JlYXRlUGFzczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJlT3JkZXJIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcmVPcmRlckNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2aWV3SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGVhbnVwOiBhbnlbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY29tcG9uZW50czogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsLCAgICAgICAvL1xuICAgICAgcHVibGljIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbCwgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZmlyc3RDaGlsZDogVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnN0czogVENvbnN0YW50c3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICApIHt9XG5cbiAgZ2V0IHRlbXBsYXRlXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICBwcm9jZXNzVE5vZGVDaGlsZHJlbih0aGlzLmZpcnN0Q2hpbGQsIGJ1Zik7XG4gICAgcmV0dXJuIGJ1Zi5qb2luKCcnKTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IFROb2RlQ29uc3RydWN0b3IgPSBjbGFzcyBUTm9kZSBpbXBsZW1lbnRzIElUTm9kZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHRWaWV3XzogVFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdHlwZTogVE5vZGVUeXBlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluamVjdG9ySW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlU3RhcnQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkaXJlY3RpdmVFbmQ6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb3BlcnR5QmluZGluZ3M6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZmxhZ3M6IFROb2RlRmxhZ3MsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRhZ05hbWU6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgYXR0cnM6IChzdHJpbmd8QXR0cmlidXRlTWFya2VyfChzdHJpbmd8U2VsZWN0b3JGbGFncylbXSlbXXxudWxsLCAgLy9cbiAgICAgIHB1YmxpYyBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRWaWV3czogSVRWaWV3fElUVmlld1tdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNoaWxkOiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uOiBudW1iZXJ8KElUTm9kZXxSTm9kZVtdKVtdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlczogVFN0eWxpbmdDb250ZXh0fG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2xhc3NlczogVFN0eWxpbmdDb250ZXh0fG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjbGFzc0JpbmRpbmdzOiBUU3R5bGluZ1JhbmdlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHN0eWxlQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICApIHt9XG5cbiAgZ2V0IHR5cGVfKCk6IHN0cmluZyB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkNvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuQ29udGFpbmVyJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnQ6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkVsZW1lbnQnO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5JY3VDb250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkljdUNvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5Qcm9qZWN0aW9uOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5Qcm9qZWN0aW9uJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLlZpZXc6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLlZpZXcnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuPz8/JztcbiAgICB9XG4gIH1cblxuICBnZXQgZmxhZ3NfKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZmxhZ3M6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnkpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZykgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZycpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzJyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0KSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzRGV0YWNoZWQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQnKTtcbiAgICByZXR1cm4gZmxhZ3Muam9pbignfCcpO1xuICB9XG5cbiAgZ2V0IHRlbXBsYXRlXygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICBidWYucHVzaCgnPCcsIHRoaXMudGFnTmFtZSB8fCB0aGlzLnR5cGVfKTtcbiAgICBpZiAodGhpcy5hdHRycykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dHJzLmxlbmd0aDspIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSB0aGlzLmF0dHJzW2krK107XG4gICAgICAgIGJ1Zi5wdXNoKCcgJywgYXR0ck5hbWUgYXMgc3RyaW5nLCAnPVwiJywgYXR0clZhbHVlIGFzIHN0cmluZywgJ1wiJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGJ1Zi5wdXNoKCc+Jyk7XG4gICAgcHJvY2Vzc1ROb2RlQ2hpbGRyZW4odGhpcy5jaGlsZCwgYnVmKTtcbiAgICBidWYucHVzaCgnPC8nLCB0aGlzLnRhZ05hbWUgfHwgdGhpcy50eXBlXywgJz4nKTtcbiAgICByZXR1cm4gYnVmLmpvaW4oJycpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBwcm9jZXNzVE5vZGVDaGlsZHJlbih0Tm9kZTogVE5vZGUgfCBudWxsLCBidWY6IHN0cmluZ1tdKSB7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGJ1Zi5wdXNoKCh0Tm9kZSBhcyBhbnkgYXN7dGVtcGxhdGVfOiBzdHJpbmd9KS50ZW1wbGF0ZV8pO1xuICAgIHROb2RlID0gdE5vZGUubmV4dDtcbiAgfVxufVxuXG5jb25zdCBUVmlld0RhdGEgPSBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVFZpZXdEYXRhJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmxldCBUVklFV0RBVEFfRU1QVFk6XG4gICAgdW5rbm93bltdOyAgLy8gY2FuJ3QgaW5pdGlhbGl6ZSBoZXJlIG9yIGl0IHdpbGwgbm90IGJlIHRyZWUgc2hha2VuLCBiZWNhdXNlIGBMVmlld2BcbiAgICAgICAgICAgICAgICAvLyBjb25zdHJ1Y3RvciBjb3VsZCBoYXZlIHNpZGUtZWZmZWN0cy5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgVERhdGEuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBURGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb1RWaWV3RGF0YShsaXN0OiBhbnlbXSk6IFREYXRhIHtcbiAgaWYgKFRWSUVXREFUQV9FTVBUWSA9PT0gdW5kZWZpbmVkKSBUVklFV0RBVEFfRU1QVFkgPSBuZXcgVFZpZXdEYXRhKCk7XG4gIHJldHVybiBUVklFV0RBVEFfRU1QVFkuY29uY2F0KGxpc3QpIGFzIGFueTtcbn1cblxuZXhwb3J0IGNvbnN0IExWaWV3Qmx1ZXByaW50ID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFZpZXdCbHVlcHJpbnQnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IE1hdGNoZXNBcnJheSA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ01hdGNoZXNBcnJheScpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVFZpZXdDb21wb25lbnRzID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVFZpZXdDb21wb25lbnRzJykgfHwgbnVsbCAhYXMgQXJyYXlDb25zdHJ1Y3RvcjtcbmV4cG9ydCBjb25zdCBUTm9kZUxvY2FsTmFtZXMgPVxuICAgIE5HX0RFVl9NT0RFICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUxvY2FsTmFtZXMnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbElucHV0cyA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbElucHV0cycpIHx8IG51bGwgIWFzIEFycmF5Q29uc3RydWN0b3I7XG5leHBvcnQgY29uc3QgVE5vZGVJbml0aWFsRGF0YSA9XG4gICAgTkdfREVWX01PREUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbERhdGEnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IExDbGVhbnVwID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTENsZWFudXAnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuZXhwb3J0IGNvbnN0IFRDbGVhbnVwID1cbiAgICBOR19ERVZfTU9ERSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVENsZWFudXAnKSB8fCBudWxsICFhcyBBcnJheUNvbnN0cnVjdG9yO1xuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExWaWV3RGVidWcobFZpZXc6IExWaWV3KSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxWaWV3LCBuZXcgTFZpZXdEZWJ1ZyhsVmlldykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoTENvbnRhaW5lckRlYnVnKGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobENvbnRhaW5lciwgbmV3IExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcpOiBMVmlld0RlYnVnO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyB8IG51bGwpOiBMVmlld0RlYnVnfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3IHwgTENvbnRhaW5lciB8IG51bGwpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBhbnkpOiBhbnkge1xuICBpZiAob2JqKSB7XG4gICAgY29uc3QgZGVidWcgPSAob2JqIGFzIGFueSkuZGVidWc7XG4gICAgYXNzZXJ0RGVmaW5lZChkZWJ1ZywgJ09iamVjdCBkb2VzIG5vdCBoYXZlIGEgZGVidWcgcmVwcmVzZW50YXRpb24uJyk7XG4gICAgcmV0dXJuIGRlYnVnO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmo7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2UgdGhpcyBtZXRob2QgdG8gdW53cmFwIGEgbmF0aXZlIGVsZW1lbnQgaW4gYExWaWV3YCBhbmQgY29udmVydCBpdCBpbnRvIEhUTUwgZm9yIGVhc2llclxuICogcmVhZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgcG9zc2libHkgd3JhcHBlZCBuYXRpdmUgRE9NIG5vZGUuXG4gKiBAcGFyYW0gaW5jbHVkZUNoaWxkcmVuIElmIGB0cnVlYCB0aGVuIHRoZSBzZXJpYWxpemVkIEhUTUwgZm9ybSB3aWxsIGluY2x1ZGUgY2hpbGQgZWxlbWVudHNcbiAqIChzYW1lXG4gKiBhcyBgb3V0ZXJIVE1MYCkuIElmIGBmYWxzZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBvbmx5IGNvbnRhaW4gdGhlIGVsZW1lbnRcbiAqIGl0c2VsZlxuICogKHdpbGwgbm90IHNlcmlhbGl6ZSBjaGlsZCBlbGVtZW50cykuXG4gKi9cbmZ1bmN0aW9uIHRvSHRtbCh2YWx1ZTogYW55LCBpbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3Qgbm9kZTogSFRNTEVsZW1lbnR8bnVsbCA9IHVud3JhcFJOb2RlKHZhbHVlKSBhcyBhbnk7XG4gIGlmIChub2RlKSB7XG4gICAgY29uc3QgaXNUZXh0Tm9kZSA9IG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFO1xuICAgIGNvbnN0IG91dGVySFRNTCA9IChpc1RleHROb2RlID8gbm9kZS50ZXh0Q29udGVudCA6IG5vZGUub3V0ZXJIVE1MKSB8fCAnJztcbiAgICBpZiAoaW5jbHVkZUNoaWxkcmVuIHx8IGlzVGV4dE5vZGUpIHtcbiAgICAgIHJldHVybiBvdXRlckhUTUw7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlubmVySFRNTCA9ICc+JyArIG5vZGUuaW5uZXJIVE1MICsgJzwnO1xuICAgICAgcmV0dXJuIChvdXRlckhUTUwuc3BsaXQoaW5uZXJIVE1MKVswXSkgKyAnPic7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMVmlld0RlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfcmF3X2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogRmxhZ3MgYXNzb2NpYXRlZCB3aXRoIHRoZSBgTFZpZXdgIHVucGFja2VkIGludG8gYSBtb3JlIHJlYWRhYmxlIHN0YXRlLlxuICAgKi9cbiAgZ2V0IGZsYWdzKCkge1xuICAgIGNvbnN0IGZsYWdzID0gdGhpcy5fcmF3X2xWaWV3W0ZMQUdTXTtcbiAgICByZXR1cm4ge1xuICAgICAgX19yYXdfX2ZsYWdzX186IGZsYWdzLFxuICAgICAgaW5pdFBoYXNlU3RhdGU6IGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2ssXG4gICAgICBjcmVhdGlvbk1vZGU6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpLFxuICAgICAgZmlyc3RWaWV3UGFzczogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSxcbiAgICAgIGNoZWNrQWx3YXlzOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpLFxuICAgICAgZGlydHk6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EaXJ0eSksXG4gICAgICBhdHRhY2hlZDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSxcbiAgICAgIGRlc3Ryb3llZDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCksXG4gICAgICBpc1Jvb3Q6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5Jc1Jvb3QpLFxuICAgICAgaW5kZXhXaXRoaW5Jbml0UGhhc2U6IGZsYWdzID4+IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VTaGlmdCxcbiAgICB9O1xuICB9XG4gIGdldCBwYXJlbnQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tQQVJFTlRdKTsgfVxuICBnZXQgaG9zdCgpOiBzdHJpbmd8bnVsbCB7IHJldHVybiB0b0h0bWwodGhpcy5fcmF3X2xWaWV3W0hPU1RdLCB0cnVlKTsgfVxuICBnZXQgaHRtbCgpOiBzdHJpbmcgeyByZXR1cm4gKHRoaXMubm9kZXMgfHwgW10pLm1hcChub2RlID0+IHRvSHRtbChub2RlLm5hdGl2ZSwgdHJ1ZSkpLmpvaW4oJycpOyB9XG4gIGdldCBjb250ZXh0KCk6IHt9fG51bGwgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0NPTlRFWFRdOyB9XG4gIC8qKlxuICAgKiBUaGUgdHJlZSBvZiBub2RlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC4gVGhlIG5vZGVzIGhhdmUgYmVlbiBub3JtYWxpemVkIGludG9cbiAgICogYVxuICAgKiB0cmVlIHN0cnVjdHVyZSB3aXRoIHJlbGV2YW50IGRldGFpbHMgcHVsbGVkIG91dCBmb3IgcmVhZGFiaWxpdHkuXG4gICAqL1xuICBnZXQgbm9kZXMoKTogRGVidWdOb2RlW118bnVsbCB7XG4gICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yYXdfbFZpZXc7XG4gICAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgICByZXR1cm4gdG9EZWJ1Z05vZGVzKHROb2RlLCBsVmlldyk7XG4gIH1cblxuICBnZXQgdFZpZXcoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbVFZJRVddOyB9XG4gIGdldCBjbGVhbnVwKCkgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0NMRUFOVVBdOyB9XG4gIGdldCBpbmplY3RvcigpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tJTkpFQ1RPUl07IH1cbiAgZ2V0IHJlbmRlcmVyRmFjdG9yeSgpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tSRU5ERVJFUl9GQUNUT1JZXTsgfVxuICBnZXQgcmVuZGVyZXIoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJdOyB9XG4gIGdldCBzYW5pdGl6ZXIoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbU0FOSVRJWkVSXTsgfVxuICBnZXQgY2hpbGRIZWFkKCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbQ0hJTERfSEVBRF0pOyB9XG4gIGdldCBuZXh0KCkgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbTkVYVF0pOyB9XG4gIGdldCBjaGlsZFRhaWwoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tDSElMRF9UQUlMXSk7IH1cbiAgZ2V0IGRlY2xhcmF0aW9uVmlldygpIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddKTsgfVxuICBnZXQgcXVlcmllcygpIHsgcmV0dXJuIHRoaXMuX3Jhd19sVmlld1tRVUVSSUVTXTsgfVxuICBnZXQgdEhvc3QoKSB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbVF9IT1NUXTsgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVkIHZpZXcgb2YgY2hpbGQgdmlld3MgKGFuZCBjb250YWluZXJzKSBhdHRhY2hlZCBhdCB0aGlzIGxvY2F0aW9uLlxuICAgKi9cbiAgZ2V0IGNoaWxkVmlld3MoKTogQXJyYXk8TFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWc+IHtcbiAgICBjb25zdCBjaGlsZFZpZXdzOiBBcnJheTxMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Zz4gPSBbXTtcbiAgICBsZXQgY2hpbGQgPSB0aGlzLmNoaWxkSGVhZDtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIGNoaWxkVmlld3MucHVzaChjaGlsZCk7XG4gICAgICBjaGlsZCA9IGNoaWxkLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZFZpZXdzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgaHRtbDogc3RyaW5nfG51bGw7XG4gIG5hdGl2ZTogTm9kZTtcbiAgc3R5bGVzOiBEZWJ1Z05vZGVTdHlsaW5nfG51bGw7XG4gIGNsYXNzZXM6IERlYnVnTm9kZVN0eWxpbmd8bnVsbDtcbiAgbm9kZXM6IERlYnVnTm9kZVtdfG51bGw7XG4gIGNvbXBvbmVudDogTFZpZXdEZWJ1Z3xudWxsO1xufVxuXG4vKipcbiAqIFR1cm5zIGEgZmxhdCBsaXN0IG9mIG5vZGVzIGludG8gYSB0cmVlIGJ5IHdhbGtpbmcgdGhlIGFzc29jaWF0ZWQgYFROb2RlYCB0cmVlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnTm9kZXModE5vZGU6IFROb2RlIHwgbnVsbCwgbFZpZXc6IExWaWV3KTogRGVidWdOb2RlW118bnVsbCB7XG4gIGlmICh0Tm9kZSkge1xuICAgIGNvbnN0IGRlYnVnTm9kZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgbGV0IHROb2RlQ3Vyc29yOiBUTm9kZXxudWxsID0gdE5vZGU7XG4gICAgd2hpbGUgKHROb2RlQ3Vyc29yKSB7XG4gICAgICBkZWJ1Z05vZGVzLnB1c2goYnVpbGREZWJ1Z05vZGUodE5vZGVDdXJzb3IsIGxWaWV3LCB0Tm9kZUN1cnNvci5pbmRleCkpO1xuICAgICAgdE5vZGVDdXJzb3IgPSB0Tm9kZUN1cnNvci5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gZGVidWdOb2RlcztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGREZWJ1Z05vZGUodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyKTogRGVidWdOb2RlIHtcbiAgY29uc3QgcmF3VmFsdWUgPSBsVmlld1tub2RlSW5kZXhdO1xuICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShyYXdWYWx1ZSk7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3RGVidWcgPSB0b0RlYnVnKHJlYWRMVmlld1ZhbHVlKHJhd1ZhbHVlKSk7XG4gIGNvbnN0IHN0eWxlcyA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuc3R5bGVzKSA/XG4gICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5zdHlsZXMgYXMgYW55IGFzIFRTdHlsaW5nQ29udGV4dCwgdE5vZGUsIGxWaWV3LCBmYWxzZSkgOlxuICAgICAgbnVsbDtcbiAgY29uc3QgY2xhc3NlcyA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuY2xhc3NlcykgP1xuICAgICAgbmV3IE5vZGVTdHlsaW5nRGVidWcodE5vZGUuY2xhc3NlcyBhcyBhbnkgYXMgVFN0eWxpbmdDb250ZXh0LCB0Tm9kZSwgbFZpZXcsIHRydWUpIDpcbiAgICAgIG51bGw7XG4gIHJldHVybiB7XG4gICAgaHRtbDogdG9IdG1sKG5hdGl2ZSksXG4gICAgbmF0aXZlOiBuYXRpdmUgYXMgYW55LCBzdHlsZXMsIGNsYXNzZXMsXG4gICAgbm9kZXM6IHRvRGVidWdOb2Rlcyh0Tm9kZS5jaGlsZCwgbFZpZXcpLFxuICAgIGNvbXBvbmVudDogY29tcG9uZW50TFZpZXdEZWJ1ZyxcbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIExDb250YWluZXJEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7fVxuXG4gIGdldCBhY3RpdmVJbmRleCgpOiBudW1iZXIgeyByZXR1cm4gZ2V0TENvbnRhaW5lckFjdGl2ZUluZGV4KHRoaXMuX3Jhd19sQ29udGFpbmVyKTsgfVxuICBnZXQgaGFzVHJhbnNwbGFudGVkVmlld3MoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICh0aGlzLl9yYXdfbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICYgQWN0aXZlSW5kZXhGbGFnLkhBU19UUkFOU1BMQU5URURfVklFV1MpID09PVxuICAgICAgICBBY3RpdmVJbmRleEZsYWcuSEFTX1RSQU5TUExBTlRFRF9WSUVXUztcbiAgfVxuICBnZXQgdmlld3MoKTogTFZpZXdEZWJ1Z1tdIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXIuc2xpY2UoQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpXG4gICAgICAgIC5tYXAodG9EZWJ1ZyBhcyhsOiBMVmlldykgPT4gTFZpZXdEZWJ1Zyk7XG4gIH1cbiAgZ2V0IHBhcmVudCgpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xDb250YWluZXJbUEFSRU5UXSk7IH1cbiAgZ2V0IG1vdmVkVmlld3MoKTogTFZpZXdbXXxudWxsIHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW01PVkVEX1ZJRVdTXTsgfVxuICBnZXQgaG9zdCgpOiBSRWxlbWVudHxSQ29tbWVudHxMVmlldyB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltIT1NUXTsgfVxuICBnZXQgbmF0aXZlKCk6IFJDb21tZW50IHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW05BVElWRV07IH1cbiAgZ2V0IG5leHQoKSB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW05FWFRdKTsgfVxufVxuXG4vKipcbiAqIFJldHVybiBhbiBgTFZpZXdgIHZhbHVlIGlmIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBgTFZpZXdgIGlmIGFueVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZExWaWV3VmFsdWUodmFsdWU6IGFueSk6IExWaWV3fG51bGwge1xuICB3aGlsZSAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAvLyBUaGlzIGNoZWNrIGlzIG5vdCBxdWl0ZSByaWdodCwgYXMgaXQgZG9lcyBub3QgdGFrZSBpbnRvIGFjY291bnQgYFN0eWxpbmdDb250ZXh0YFxuICAgIC8vIFRoaXMgaXMgd2h5IGl0IGlzIGluIGRlYnVnLCBub3QgaW4gdXRpbC50c1xuICAgIGlmICh2YWx1ZS5sZW5ndGggPj0gSEVBREVSX09GRlNFVCAtIDEpIHJldHVybiB2YWx1ZSBhcyBMVmlldztcbiAgICB2YWx1ZSA9IHZhbHVlW0hPU1RdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgSTE4TkRlYnVnSXRlbSB7XG4gIFtrZXk6IHN0cmluZ106IGFueTtcblxuICBnZXQgdE5vZGUoKSB7IHJldHVybiBnZXRUTm9kZSh0aGlzLm5vZGVJbmRleCwgdGhpcy5fbFZpZXcpOyB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgX19yYXdfb3BDb2RlOiBhbnksIHByaXZhdGUgX2xWaWV3OiBMVmlldywgcHVibGljIG5vZGVJbmRleDogbnVtYmVyLFxuICAgICAgcHVibGljIHR5cGU6IHN0cmluZykge31cbn1cblxuLyoqXG4gKiBUdXJucyBhIGxpc3Qgb2YgXCJDcmVhdGVcIiAmIFwiVXBkYXRlXCIgT3BDb2RlcyBpbnRvIGEgaHVtYW4tcmVhZGFibGUgbGlzdCBvZiBvcGVyYXRpb25zIGZvclxuICogZGVidWdnaW5nIHB1cnBvc2VzLlxuICogQHBhcmFtIG11dGF0ZU9wQ29kZXMgbXV0YXRpb24gb3BDb2RlcyB0byByZWFkXG4gKiBAcGFyYW0gdXBkYXRlT3BDb2RlcyB1cGRhdGUgb3BDb2RlcyB0byByZWFkXG4gKiBAcGFyYW0gaWN1cyBsaXN0IG9mIElDVSBleHByZXNzaW9uc1xuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRoZSBvcENvZGVzIGFyZSBhY3Rpbmcgb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaEkxOG5PcENvZGVzRGVidWcoXG4gICAgbXV0YXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBpY3VzOiBUSWN1W10gfCBudWxsLFxuICAgIGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChtdXRhdGVPcENvZGVzLCBuZXcgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyhtdXRhdGVPcENvZGVzLCBsVmlldykpO1xuICBhdHRhY2hEZWJ1Z09iamVjdCh1cGRhdGVPcENvZGVzLCBuZXcgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1Zyh1cGRhdGVPcENvZGVzLCBpY3VzLCBsVmlldykpO1xuXG4gIGlmIChpY3VzKSB7XG4gICAgaWN1cy5mb3JFYWNoKGljdSA9PiB7XG4gICAgICBpY3UuY3JlYXRlLmZvckVhY2goXG4gICAgICAgICAgaWN1Q2FzZSA9PiB7IGF0dGFjaERlYnVnT2JqZWN0KGljdUNhc2UsIG5ldyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnKGljdUNhc2UsIGxWaWV3KSk7IH0pO1xuICAgICAgaWN1LnVwZGF0ZS5mb3JFYWNoKGljdUNhc2UgPT4ge1xuICAgICAgICBhdHRhY2hEZWJ1Z09iamVjdChpY3VDYXNlLCBuZXcgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1ZyhpY3VDYXNlLCBpY3VzLCBsVmlldykpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEkxOG5NdXRhdGVPcENvZGVzRGVidWcgaW1wbGVtZW50cyBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfX3Jhd19vcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgcHJpdmF0ZSByZWFkb25seSBfX2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogQSBsaXN0IG9mIG9wZXJhdGlvbiBpbmZvcm1hdGlvbiBhYm91dCBob3cgdGhlIE9wQ29kZXMgd2lsbCBhY3Qgb24gdGhlIHZpZXcuXG4gICAqL1xuICBnZXQgb3BlcmF0aW9ucygpIHtcbiAgICBjb25zdCB7X19sVmlldywgX19yYXdfb3BDb2Rlc30gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9fcmF3X29wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG9wQ29kZSA9IF9fcmF3X29wQ29kZXNbaV07XG4gICAgICBsZXQgcmVzdWx0OiBhbnk7XG4gICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgIHR5cGU6ICdDcmVhdGUgVGV4dCBOb2RlJyxcbiAgICAgICAgICBub2RlSW5kZXg6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICB0ZXh0OiBvcENvZGUsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnbnVtYmVyJykge1xuICAgICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgICBjb25zdCBkZXN0aW5hdGlvbk5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQ7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGRlc3RpbmF0aW9uTm9kZUluZGV4LCAnQXBwZW5kQ2hpbGQnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3Q6XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdTZWxlY3QnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kOlxuICAgICAgICAgICAgbGV0IGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGVsZW1lbnRJbmRleCwgJ0VsZW1lbnRFbmQnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgZWxlbWVudEluZGV4LCAnQXR0cicpO1xuICAgICAgICAgICAgcmVzdWx0WydhdHRyTmFtZSddID0gX19yYXdfb3BDb2Rlc1srK2ldO1xuICAgICAgICAgICAgcmVzdWx0WydhdHRyVmFsdWUnXSA9IF9fcmF3X29wQ29kZXNbKytpXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHN3aXRjaCAob3BDb2RlKSB7XG4gICAgICAgICAgY2FzZSBDT01NRU5UX01BUktFUjpcbiAgICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgIHR5cGU6ICdDT01NRU5UX01BUktFUicsXG4gICAgICAgICAgICAgIGNvbW1lbnRWYWx1ZTogX19yYXdfb3BDb2Rlc1srK2ldLFxuICAgICAgICAgICAgICBub2RlSW5kZXg6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEVMRU1FTlRfTUFSS0VSOlxuICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgdHlwZTogJ0VMRU1FTlRfTUFSS0VSJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgdHlwZTogJ1Vua25vd24gT3AgQ29kZScsXG4gICAgICAgICAgY29kZTogb3BDb2RlLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSTE4blVwZGF0ZU9wQ29kZXNEZWJ1ZyBpbXBsZW1lbnRzIEkxOG5PcENvZGVzRGVidWcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX19yYXdfb3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIHByaXZhdGUgcmVhZG9ubHkgaWN1czogVEljdVtdfG51bGwsXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9fbFZpZXc6IExWaWV3KSB7fVxuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2Ygb3BlcmF0aW9uIGluZm9ybWF0aW9uIGFib3V0IGhvdyB0aGUgT3BDb2RlcyB3aWxsIGFjdCBvbiB0aGUgdmlldy5cbiAgICovXG4gIGdldCBvcGVyYXRpb25zKCkge1xuICAgIGNvbnN0IHtfX2xWaWV3LCBfX3Jhd19vcENvZGVzLCBpY3VzfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgX19yYXdfb3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gYml0IGNvZGUgdG8gY2hlY2sgaWYgd2Ugc2hvdWxkIGFwcGx5IHRoZSBuZXh0IHVwZGF0ZVxuICAgICAgY29uc3QgY2hlY2tCaXQgPSBfX3Jhd19vcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgICBjb25zdCBza2lwQ29kZXMgPSBfX3Jhd19vcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gX19yYXdfb3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gSXQncyBhIGJpbmRpbmcgaW5kZXggd2hvc2UgdmFsdWUgaXMgbmVnYXRpdmVcbiAgICAgICAgICAgIC8vIFdlIGNhbm5vdCBrbm93IHRoZSB2YWx1ZSBvZiB0aGUgYmluZGluZyBzbyB3ZSBvbmx5IHNob3cgdGhlIGluZGV4XG4gICAgICAgICAgICB2YWx1ZSArPSBg77+9JHstb3BDb2RlIC0gMX3vv71gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgbGV0IHRJY3VJbmRleDogbnVtYmVyO1xuICAgICAgICAgICAgbGV0IHRJY3U6IFRJY3U7XG4gICAgICAgICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5VcGRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBfX3Jhd19vcENvZGVzWysral0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNhbml0aXplRm4gPSBfX3Jhd19vcENvZGVzWysral07XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICAgICAgY2hlY2tCaXQsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnQXR0cicsXG4gICAgICAgICAgICAgICAgICBhdHRyVmFsdWU6IHZhbHVlLCBhdHRyTmFtZSwgc2FuaXRpemVGbixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICAgICAgY2hlY2tCaXQsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnVGV4dCcsIG5vZGVJbmRleCxcbiAgICAgICAgICAgICAgICAgIHRleHQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ0ljdVN3aXRjaCcpO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdUluZGV4J10gPSB0SWN1SW5kZXg7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydjaGVja0JpdCddID0gY2hlY2tCaXQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydtYWluQmluZGluZyddID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1J10gPSB0SWN1O1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnSWN1VXBkYXRlJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1SW5kZXgnXSA9IHRJY3VJbmRleDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ2NoZWNrQml0J10gPSBjaGVja0JpdDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3UnXSA9IHRJY3U7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpICs9IHNraXBDb2RlcztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJMThuT3BDb2Rlc0RlYnVnIHsgb3BlcmF0aW9uczogYW55W107IH1cbiJdfQ==