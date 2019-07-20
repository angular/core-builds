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
    return TView;
}());
export var TNodeConstructor = /** @class */ (function () {
    function TNode(tView_, //
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
        },
        enumerable: true,
        configurable: true
    });
    return TNode;
}());
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
            var innerHTML = node.innerHTML;
            return outerHTML.split(innerHTML)[0] || null;
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
    Object.defineProperty(LViewDebug.prototype, "__other__", {
        /**
         * Additional information which is hidden behind a property. The extra level of indirection is
         * done so that the debug view would not be cluttered with properties which are only rarely
         * relevant to the developer.
         */
        get: function () {
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LViewDebug.prototype, "childViews", {
        /**
         * Normalized view of child views (and containers) attached at this location.
         */
        get: function () {
            var childViews = [];
            var child = this.__other__.childHead;
            while (child) {
                childViews.push(child);
                child = child.__other__.next;
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
    Object.defineProperty(LContainerDebug.prototype, "__other__", {
        get: function () {
            return {
                next: toDebug(this._raw_lContainer[NEXT]),
            };
        },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibHZpZXdfZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLFlBQVksRUFBRSx1QkFBdUIsRUFBYyxXQUFXLEVBQUUsTUFBTSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFL0csT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlGLE1BQU0sb0JBQW9CLENBQUM7QUFPbEosT0FBTyxFQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQXVCLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFZLFFBQVEsRUFBcUIsSUFBSSxFQUFFLE1BQU0sRUFBVyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFTLEtBQUssRUFBMEIsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFalQsT0FBTyxFQUFrQyxnQkFBZ0IsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxRQUFRLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFHekQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTJCRztBQUdILE1BQU0sQ0FBQyxJQUFNLFVBQVUsR0FBRyxTQUFTLElBQUksb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDckUsSUFBSSxXQUFzQixDQUFDLENBQUUsdUVBQXVFO0FBQ3ZFLHVDQUF1QztBQUNwRTs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxJQUFXO0lBQ3RDLElBQUksV0FBVyxLQUFLLFNBQVM7UUFBRSxXQUFXLEdBQUcsSUFBSSxVQUFZLEVBQUUsQ0FBQztJQUNoRSxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFRLENBQUM7QUFDekMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxJQUFNLGdCQUFnQjtJQUMzQixlQUNXLEVBQVUsRUFBc0MsRUFBRTtJQUNsRCxTQUFnQixFQUFnQyxFQUFFO0lBQ2xELFFBQW9DLEVBQVksRUFBRTtJQUNsRCxPQUFzQixFQUEwQixFQUFFO0lBQ2xELFNBQXVDLEVBQVMsRUFBRTtJQUNsRCxJQUFpQyxFQUFlLEVBQUU7SUFDbEQsSUFBVyxFQUFxQyxFQUFFO0lBQ2xELGlCQUF5QixFQUF1QixFQUFFO0lBQ2xELGlCQUF5QixFQUF1QixFQUFFO0lBQ2xELG1CQUE2QyxFQUFHLEVBQUU7SUFDbEQsaUJBQTBCLEVBQXNCLEVBQUU7SUFDbEQsaUJBQTBCLEVBQXNCLEVBQUU7SUFDbEQsb0JBQTZCLEVBQW1CLEVBQUU7SUFDbEQsYUFBNEIsRUFBb0IsRUFBRTtJQUNsRCxrQkFBaUMsRUFBZSxFQUFFO0lBQ2xELFlBQTJCLEVBQXFCLEVBQUU7SUFDbEQsaUJBQWdDLEVBQWdCLEVBQUU7SUFDbEQsU0FBd0IsRUFBd0IsRUFBRTtJQUNsRCxjQUE2QixFQUFtQixFQUFFO0lBQ2xELFlBQTJCLEVBQXFCLEVBQUU7SUFDbEQsT0FBbUIsRUFBNkIsRUFBRTtJQUNsRCxjQUE2QixFQUFtQixFQUFFO0lBQ2xELFVBQXlCLEVBQXVCLEVBQUU7SUFDbEQsaUJBQXdDLEVBQVEsRUFBRTtJQUNsRCxZQUE4QixFQUFrQixFQUFFO0lBQ2xELFVBQXNCLEVBQTBCLEVBQUU7SUFDbEQsT0FBOEI7UUExQjlCLE9BQUUsR0FBRixFQUFFLENBQVE7UUFDVixjQUFTLEdBQVQsU0FBUyxDQUFPO1FBQ2hCLGFBQVEsR0FBUixRQUFRLENBQTRCO1FBQ3BDLFlBQU8sR0FBUCxPQUFPLENBQWU7UUFDdEIsY0FBUyxHQUFULFNBQVMsQ0FBOEI7UUFDdkMsU0FBSSxHQUFKLElBQUksQ0FBNkI7UUFDakMsU0FBSSxHQUFKLElBQUksQ0FBTztRQUNYLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtRQUN6QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQVE7UUFDekIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUEwQjtRQUM3QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQVM7UUFDMUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFTO1FBQzFCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBUztRQUM3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtRQUM1Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQWU7UUFDakMsaUJBQVksR0FBWixZQUFZLENBQWU7UUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFlO1FBQ2hDLGNBQVMsR0FBVCxTQUFTLENBQWU7UUFDeEIsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFDN0IsaUJBQVksR0FBWixZQUFZLENBQWU7UUFDM0IsWUFBTyxHQUFQLE9BQU8sQ0FBWTtRQUNuQixtQkFBYyxHQUFkLGNBQWMsQ0FBZTtRQUM3QixlQUFVLEdBQVYsVUFBVSxDQUFlO1FBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUI7UUFDeEMsaUJBQVksR0FBWixZQUFZLENBQWtCO1FBQzlCLGVBQVUsR0FBVixVQUFVLENBQVk7UUFDdEIsWUFBTyxHQUFQLE9BQU8sQ0FBdUI7SUFDbEMsQ0FBQztJQUNWLFlBQUM7QUFBRCxDQUFDLEFBOUIrQixHQThCL0IsQ0FBQztBQUVGLE1BQU0sQ0FBQyxJQUFNLGdCQUFnQjtJQUMzQixlQUNXLE1BQWEsRUFBcUQsRUFBRTtJQUNwRSxJQUFlLEVBQW1ELEVBQUU7SUFDcEUsS0FBYSxFQUFxRCxFQUFFO0lBQ3BFLGFBQXFCLEVBQTZDLEVBQUU7SUFDcEUsY0FBc0IsRUFBNEMsRUFBRTtJQUNwRSxZQUFvQixFQUE4QyxFQUFFO0lBQ3BFLDBCQUFrQyxFQUFnQyxFQUFFO0lBQ3BFLHdCQUFnQyxFQUFrQyxFQUFFO0lBQ3BFLEtBQWlCLEVBQWlELEVBQUU7SUFDcEUsZUFBcUMsRUFBNkIsRUFBRTtJQUNwRSxPQUFvQixFQUE4QyxFQUFFO0lBQ3BFLEtBQStELEVBQUcsRUFBRTtJQUNwRSxVQUFrQyxFQUFnQyxFQUFFO0lBQ3BFLGFBQStDLEVBQW1CLEVBQUU7SUFDcEUsTUFBc0MsRUFBNEIsRUFBRTtJQUNwRSxPQUF1QyxFQUEyQixFQUFFO0lBQ3BFLE1BQTRCLEVBQXNDLEVBQUU7SUFDcEUsSUFBaUIsRUFBaUQsRUFBRTtJQUNwRSxjQUEyQixFQUF1QyxFQUFFO0lBQ3BFLEtBQWtCLEVBQWdELEVBQUU7SUFDcEUsTUFBd0MsRUFBMEIsRUFBRTtJQUNwRSxlQUFvQyxFQUE4QixFQUFFO0lBQ3BFLFVBQTBDLEVBQXdCLEVBQUU7SUFDcEUsb0JBQXFDLEVBQTZCLEVBQUU7SUFDcEUsTUFBNEIsRUFBc0MsRUFBRTtJQUNwRSxPQUE2QjtRQXpCN0IsV0FBTSxHQUFOLE1BQU0sQ0FBTztRQUNiLFNBQUksR0FBSixJQUFJLENBQVc7UUFDZixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2Isa0JBQWEsR0FBYixhQUFhLENBQVE7UUFDckIsbUJBQWMsR0FBZCxjQUFjLENBQVE7UUFDdEIsaUJBQVksR0FBWixZQUFZLENBQVE7UUFDcEIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFRO1FBQ2xDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBUTtRQUNoQyxVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQ2pCLG9CQUFlLEdBQWYsZUFBZSxDQUFzQjtRQUNyQyxZQUFPLEdBQVAsT0FBTyxDQUFhO1FBQ3BCLFVBQUssR0FBTCxLQUFLLENBQTBEO1FBQy9ELGVBQVUsR0FBVixVQUFVLENBQXdCO1FBQ2xDLGtCQUFhLEdBQWIsYUFBYSxDQUFrQztRQUMvQyxXQUFNLEdBQU4sTUFBTSxDQUFnQztRQUN0QyxZQUFPLEdBQVAsT0FBTyxDQUFnQztRQUN2QyxXQUFNLEdBQU4sTUFBTSxDQUFzQjtRQUM1QixTQUFJLEdBQUosSUFBSSxDQUFhO1FBQ2pCLG1CQUFjLEdBQWQsY0FBYyxDQUFhO1FBQzNCLFVBQUssR0FBTCxLQUFLLENBQWE7UUFDbEIsV0FBTSxHQUFOLE1BQU0sQ0FBa0M7UUFDeEMsb0JBQWUsR0FBZixlQUFlLENBQXFCO1FBQ3BDLGVBQVUsR0FBVixVQUFVLENBQWdDO1FBQzFDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBaUI7UUFDckMsV0FBTSxHQUFOLE1BQU0sQ0FBc0I7UUFDNUIsWUFBTyxHQUFQLE9BQU8sQ0FBc0I7SUFDakMsQ0FBQztJQUVSLHNCQUFJLHdCQUFLO2FBQVQ7WUFDRSxRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ2pCO29CQUNFLE9BQU8scUJBQXFCLENBQUM7Z0JBQy9CO29CQUNFLE9BQU8sbUJBQW1CLENBQUM7Z0JBQzdCO29CQUNFLE9BQU8sNEJBQTRCLENBQUM7Z0JBQ3RDO29CQUNFLE9BQU8sd0JBQXdCLENBQUM7Z0JBQ2xDO29CQUNFLE9BQU8sc0JBQXNCLENBQUM7Z0JBQ2hDO29CQUNFLE9BQU8sZ0JBQWdCLENBQUM7Z0JBQzFCO29CQUNFLE9BQU8sZUFBZSxDQUFDO2FBQzFCO1FBQ0gsQ0FBQzs7O09BQUE7SUFFRCxzQkFBSSx5QkFBTTthQUFWO1lBQ0UsSUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO1lBQzNCLElBQUksSUFBSSxDQUFDLEtBQUssd0JBQTJCO2dCQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUNsRixJQUFJLElBQUksQ0FBQyxLQUFLLDBCQUE2QjtnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDdEYsSUFBSSxJQUFJLENBQUMsS0FBSyx5QkFBMkI7Z0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQ2xGLElBQUksSUFBSSxDQUFDLEtBQUssc0JBQXlCO2dCQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUM5RSxJQUFJLElBQUksQ0FBQyxLQUFLLHNCQUF3QjtnQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDNUUsSUFBSSxJQUFJLENBQUMsS0FBSyxzQkFBeUI7Z0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQzlFLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QixDQUFDOzs7T0FBQTtJQUNILFlBQUM7QUFBRCxDQUFDLEFBM0QrQixHQTJEL0IsQ0FBQztBQUVGLElBQU0sU0FBUyxHQUFHLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNqRSxJQUFJLGVBQ1MsQ0FBQyxDQUFFLHVFQUF1RTtBQUN2RSx1Q0FBdUM7QUFDdkQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFXO0lBQzFDLElBQUksZUFBZSxLQUFLLFNBQVM7UUFBRSxlQUFlLEdBQUcsSUFBSSxTQUFXLEVBQUUsQ0FBQztJQUN2RSxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFRLENBQUM7QUFDN0MsQ0FBQztBQUVELE1BQU0sQ0FBQyxJQUFNLGNBQWMsR0FBRyxTQUFTLElBQUksb0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUNsRixNQUFNLENBQUMsSUFBTSxZQUFZLEdBQUcsU0FBUyxJQUFJLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQzlFLE1BQU0sQ0FBQyxJQUFNLGVBQWUsR0FBRyxTQUFTLElBQUksb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNwRixNQUFNLENBQUMsSUFBTSxlQUFlLEdBQUcsU0FBUyxJQUFJLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDcEYsTUFBTSxDQUFDLElBQU0sa0JBQWtCLEdBQUcsU0FBUyxJQUFJLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDMUYsTUFBTSxDQUFDLElBQU0sZ0JBQWdCLEdBQUcsU0FBUyxJQUFJLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDdEYsTUFBTSxDQUFDLElBQU0sUUFBUSxHQUFHLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN0RSxNQUFNLENBQUMsSUFBTSxRQUFRLEdBQUcsU0FBUyxJQUFJLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBSXRFLE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFZO0lBQzNDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFFRCxNQUFNLFVBQVUscUJBQXFCLENBQUMsVUFBc0I7SUFDMUQsaUJBQWlCLENBQUMsVUFBVSxFQUFFLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUtELE1BQU0sVUFBVSxPQUFPLENBQUMsR0FBUTtJQUM5QixJQUFJLEdBQUcsRUFBRTtRQUNQLElBQU0sS0FBSyxHQUFJLEdBQVcsQ0FBQyxLQUFLLENBQUM7UUFDakMsYUFBYSxDQUFDLEtBQUssRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7U0FBTTtRQUNMLE9BQU8sR0FBRyxDQUFDO0tBQ1o7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLE1BQU0sQ0FBQyxLQUFVLEVBQUUsZUFBZ0M7SUFBaEMsZ0NBQUEsRUFBQSx1QkFBZ0M7SUFDMUQsSUFBTSxJQUFJLEdBQXFCLFdBQVcsQ0FBQyxLQUFLLENBQVEsQ0FBQztJQUN6RCxJQUFJLElBQUksRUFBRTtRQUNSLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNwRCxJQUFNLFNBQVMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6RSxJQUFJLGVBQWUsSUFBSSxVQUFVLEVBQUU7WUFDakMsT0FBTyxTQUFTLENBQUM7U0FDbEI7YUFBTTtZQUNMLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDakMsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztTQUM5QztLQUNGO1NBQU07UUFDTCxPQUFPLElBQUksQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQUVEO0lBQ0Usb0JBQTZCLFVBQWlCO1FBQWpCLGVBQVUsR0FBVixVQUFVLENBQU87SUFBRyxDQUFDO0lBS2xELHNCQUFJLDZCQUFLO1FBSFQ7O1dBRUc7YUFDSDtZQUNFLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckMsT0FBTztnQkFDTCxjQUFjLEVBQUUsS0FBSztnQkFDckIsY0FBYyxFQUFFLEtBQUssNkJBQWdDO2dCQUNyRCxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyx1QkFBMEIsQ0FBQztnQkFDakQsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUsseUJBQTRCLENBQUM7Z0JBQ3BELFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLHVCQUF5QixDQUFDO2dCQUMvQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxpQkFBbUIsQ0FBQztnQkFDbkMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUsscUJBQXNCLENBQUM7Z0JBQ3pDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUF1QixDQUFDO2dCQUMzQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxtQkFBb0IsQ0FBQztnQkFDckMsb0JBQW9CLEVBQUUsS0FBSyxzQ0FBd0M7YUFDcEUsQ0FBQztRQUNKLENBQUM7OztPQUFBO0lBQ0Qsc0JBQUksOEJBQU07YUFBVixjQUFnRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUMxRixzQkFBSSw0QkFBSTthQUFSLGNBQTBCLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUN2RSxzQkFBSSwrQkFBTzthQUFYLGNBQXlCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBSzNELHNCQUFJLDZCQUFLO1FBSlQ7OztXQUdHO2FBQ0g7WUFDRSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzlCLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFDdEMsT0FBTyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLENBQUM7OztPQUFBO0lBTUQsc0JBQUksaUNBQVM7UUFMYjs7OztXQUlHO2FBQ0g7WUFDRSxPQUFPO2dCQUNMLEtBQUssRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztnQkFDN0IsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUNqQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7Z0JBQ25DLGVBQWUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDO2dCQUNsRCxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7Z0JBQ25DLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztnQkFDckMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BDLFNBQVMsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDL0MsZUFBZSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQzNELE9BQU8sRUFBRSxJQUFJO2dCQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztnQkFDOUIsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO2FBQzdDLENBQUM7UUFDSixDQUFDOzs7T0FBQTtJQUtELHNCQUFJLGtDQUFVO1FBSGQ7O1dBRUc7YUFDSDtZQUNFLElBQU0sVUFBVSxHQUFzQyxFQUFFLENBQUM7WUFDekQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDckMsT0FBTyxLQUFLLEVBQUU7Z0JBQ1osVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkIsS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO2FBQzlCO1lBQ0QsT0FBTyxVQUFVLENBQUM7UUFDcEIsQ0FBQzs7O09BQUE7SUFDSCxpQkFBQztBQUFELENBQUMsQUFwRUQsSUFvRUM7O0FBV0Q7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFDLEtBQW1CLEVBQUUsS0FBWTtJQUM1RCxJQUFJLEtBQUssRUFBRTtRQUNULElBQU0sVUFBVSxHQUFnQixFQUFFLENBQUM7UUFDbkMsSUFBSSxXQUFXLEdBQWUsS0FBSyxDQUFDO1FBQ3BDLE9BQU8sV0FBVyxFQUFFO1lBQ2xCLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsSUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JDLElBQU0sbUJBQW1CLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRTlELElBQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxNQUFnQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3JFLElBQUksQ0FBQztZQUNULElBQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUM3QyxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxPQUFpQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM1RSxJQUFJLENBQUM7WUFDVCxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUNkLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUNwQixNQUFNLEVBQUUsTUFBYSxFQUFFLE1BQU0sUUFBQSxFQUFFLE9BQU8sU0FBQTtnQkFDdEMsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztnQkFDdkMsU0FBUyxFQUFFLG1CQUFtQjthQUMvQixDQUFDLENBQUM7WUFDSCxXQUFXLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQztTQUNoQztRQUNELE9BQU8sVUFBVSxDQUFDO0tBQ25CO1NBQU07UUFDTCxPQUFPLElBQUksQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQUVEO0lBQ0UseUJBQTZCLGVBQTJCO1FBQTNCLG9CQUFlLEdBQWYsZUFBZSxDQUFZO0lBQUcsQ0FBQztJQUU1RCxzQkFBSSx3Q0FBVzthQUFmLGNBQTRCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQ3hFLHNCQUFJLGtDQUFLO2FBQVQ7WUFDRSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDO2lCQUNyRCxHQUFHLENBQUMsT0FBa0MsQ0FBQyxDQUFDO1FBQy9DLENBQUM7OztPQUFBO0lBQ0Qsc0JBQUksbUNBQU07YUFBVixjQUFnRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUMvRixzQkFBSSx1Q0FBVTthQUFkLGNBQWlDLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQzVFLHNCQUFJLGlDQUFJO2FBQVIsY0FBcUQsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDekYsc0JBQUksbUNBQU07YUFBVixjQUF5QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUMvRCxzQkFBSSxzQ0FBUzthQUFiO1lBQ0UsT0FBTztnQkFDTCxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUMsQ0FBQztRQUNKLENBQUM7OztPQUFBO0lBQ0gsc0JBQUM7QUFBRCxDQUFDLEFBakJELElBaUJDOztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVU7SUFDdkMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzNCLG1GQUFtRjtRQUNuRiw2Q0FBNkM7UUFDN0MsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLGFBQWEsR0FBRyxDQUFDO1lBQUUsT0FBTyxLQUFjLENBQUM7UUFDN0QsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEO0lBS0UsdUJBQ1csWUFBaUIsRUFBVSxNQUFhLEVBQVMsU0FBaUIsRUFDbEUsSUFBWTtRQURaLGlCQUFZLEdBQVosWUFBWSxDQUFLO1FBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBTztRQUFTLGNBQVMsR0FBVCxTQUFTLENBQVE7UUFDbEUsU0FBSSxHQUFKLElBQUksQ0FBUTtJQUFHLENBQUM7SUFKM0Isc0JBQUksZ0NBQUs7YUFBVCxjQUFjLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFLL0Qsb0JBQUM7QUFBRCxDQUFDLEFBUkQsSUFRQzs7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUNsQyxhQUFnQyxFQUFFLGFBQWdDLEVBQUUsSUFBbUIsRUFDdkYsS0FBWTtJQUNkLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxJQUFJLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ25GLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxJQUFJLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUV6RixJQUFJLElBQUksRUFBRTtRQUNSLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHO1lBQ2QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQ2QsVUFBQSxPQUFPLElBQU0saUJBQWlCLENBQUMsT0FBTyxFQUFFLElBQUksc0JBQXNCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RixHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFBLE9BQU87Z0JBQ3hCLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMvRSxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0tBQ0o7QUFDSCxDQUFDO0FBRUQ7SUFDRSxnQ0FBNkIsYUFBZ0MsRUFBbUIsT0FBYztRQUFqRSxrQkFBYSxHQUFiLGFBQWEsQ0FBbUI7UUFBbUIsWUFBTyxHQUFQLE9BQU8sQ0FBTztJQUFHLENBQUM7SUFLbEcsc0JBQUksOENBQVU7UUFIZDs7V0FFRzthQUNIO1lBQ1EsSUFBQSxTQUErQixFQUE5QixvQkFBTyxFQUFFLGdDQUFxQixDQUFDO1lBQ3RDLElBQU0sT0FBTyxHQUFVLEVBQUUsQ0FBQztZQUUxQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsSUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE1BQU0sU0FBSyxDQUFDO2dCQUNoQixJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtvQkFDOUIsTUFBTSxHQUFHO3dCQUNQLFlBQVksRUFBRSxNQUFNO3dCQUNwQixJQUFJLEVBQUUsa0JBQWtCO3dCQUN4QixTQUFTLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM3QixJQUFJLEVBQUUsTUFBTTtxQkFDYixDQUFDO2lCQUNIO2dCQUVELElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO29CQUM5QixRQUFRLE1BQU0sc0JBQStCLEVBQUU7d0JBQzdDOzRCQUNFLElBQU0sb0JBQW9CLEdBQUcsTUFBTSwwQkFBa0MsQ0FBQzs0QkFDdEUsTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxDQUFDLENBQUM7NEJBQ2pGLE1BQU07d0JBQ1I7NEJBQ0UsSUFBTSxTQUFTLEdBQUcsTUFBTSxzQkFBK0IsQ0FBQzs0QkFDeEQsTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDOzRCQUNqRSxNQUFNO3dCQUNSOzRCQUNFLElBQUksWUFBWSxHQUFHLE1BQU0sc0JBQStCLENBQUM7NEJBQ3pELE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQzs0QkFDeEUsTUFBTTt3QkFDUjs0QkFDRSxZQUFZLEdBQUcsTUFBTSxzQkFBK0IsQ0FBQzs0QkFDckQsTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDOzRCQUNsRSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDekMsTUFBTTtxQkFDVDtpQkFDRjtnQkFFRCxJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNYLFFBQVEsTUFBTSxFQUFFO3dCQUNkLEtBQUssY0FBYzs0QkFDakIsTUFBTSxHQUFHO2dDQUNQLFlBQVksRUFBRSxNQUFNO2dDQUNwQixJQUFJLEVBQUUsZ0JBQWdCO2dDQUN0QixZQUFZLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dDQUNoQyxTQUFTLEVBQUUsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDOzZCQUM5QixDQUFDOzRCQUNGLE1BQU07d0JBQ1IsS0FBSyxjQUFjOzRCQUNqQixNQUFNLEdBQUc7Z0NBQ1AsWUFBWSxFQUFFLE1BQU07Z0NBQ3BCLElBQUksRUFBRSxnQkFBZ0I7NkJBQ3ZCLENBQUM7NEJBQ0YsTUFBTTtxQkFDVDtpQkFDRjtnQkFFRCxJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNYLE1BQU0sR0FBRzt3QkFDUCxZQUFZLEVBQUUsTUFBTTt3QkFDcEIsSUFBSSxFQUFFLGlCQUFpQjt3QkFDdkIsSUFBSSxFQUFFLE1BQU07cUJBQ2IsQ0FBQztpQkFDSDtnQkFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3RCO1lBRUQsT0FBTyxPQUFPLENBQUM7UUFDakIsQ0FBQzs7O09BQUE7SUFDSCw2QkFBQztBQUFELENBQUMsQUE3RUQsSUE2RUM7O0FBRUQ7SUFDRSxnQ0FDcUIsYUFBZ0MsRUFBbUIsSUFBaUIsRUFDcEUsT0FBYztRQURkLGtCQUFhLEdBQWIsYUFBYSxDQUFtQjtRQUFtQixTQUFJLEdBQUosSUFBSSxDQUFhO1FBQ3BFLFlBQU8sR0FBUCxPQUFPLENBQU87SUFBRyxDQUFDO0lBS3ZDLHNCQUFJLDhDQUFVO1FBSGQ7O1dBRUc7YUFDSDtZQUNRLElBQUEsU0FBcUMsRUFBcEMsb0JBQU8sRUFBRSxnQ0FBYSxFQUFFLGNBQVksQ0FBQztZQUM1QyxJQUFNLE9BQU8sR0FBVSxFQUFFLENBQUM7WUFFMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLHVEQUF1RDtnQkFDdkQsSUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBVyxDQUFDO2dCQUM1QywyREFBMkQ7Z0JBQzNELElBQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBVyxDQUFDO2dCQUMvQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDN0MsSUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNoQyxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTt3QkFDOUIsS0FBSyxJQUFJLE1BQU0sQ0FBQztxQkFDakI7eUJBQU0sSUFBSSxPQUFPLE1BQU0sSUFBSSxRQUFRLEVBQUU7d0JBQ3BDLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDZCwrQ0FBK0M7NEJBQy9DLG9FQUFvRTs0QkFDcEUsS0FBSyxJQUFJLFlBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxZQUFHLENBQUM7eUJBQzdCOzZCQUFNOzRCQUNMLElBQU0sU0FBUyxHQUFHLE1BQU0sc0JBQStCLENBQUM7NEJBQ3hELElBQUksU0FBUyxTQUFRLENBQUM7NEJBQ3RCLElBQUksSUFBSSxTQUFNLENBQUM7NEJBQ2YsUUFBUSxNQUFNLHNCQUErQixFQUFFO2dDQUM3QztvQ0FDRSxJQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQVcsQ0FBQztvQ0FDOUMsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0NBQ3RDLE9BQU8sQ0FBQyxJQUFJLENBQUM7d0NBQ1gsWUFBWSxFQUFFLE1BQU07d0NBQ3BCLFFBQVEsVUFBQTt3Q0FDUixJQUFJLEVBQUUsTUFBTTt3Q0FDWixTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsVUFBQSxFQUFFLFVBQVUsWUFBQTtxQ0FDdkMsQ0FBQyxDQUFDO29DQUNILE1BQU07Z0NBQ1I7b0NBQ0UsT0FBTyxDQUFDLElBQUksQ0FBQzt3Q0FDWCxZQUFZLEVBQUUsTUFBTTt3Q0FDcEIsUUFBUSxVQUFBO3dDQUNSLElBQUksRUFBRSxNQUFNLEVBQUUsU0FBUyxXQUFBO3dDQUN2QixJQUFJLEVBQUUsS0FBSztxQ0FDWixDQUFDLENBQUM7b0NBQ0gsTUFBTTtnQ0FDUjtvQ0FDRSxTQUFTLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFXLENBQUM7b0NBQ3pDLElBQUksR0FBRyxJQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0NBQ3pCLElBQUksTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO29DQUN4RSxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsU0FBUyxDQUFDO29DQUNoQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDO29DQUM5QixNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDO29DQUM5QixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO29DQUN0QixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUNyQixNQUFNO2dDQUNSO29DQUNFLFNBQVMsR0FBRyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQVcsQ0FBQztvQ0FDekMsSUFBSSxHQUFHLElBQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQ0FDekIsTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO29DQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsU0FBUyxDQUFDO29DQUNoQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDO29DQUM5QixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO29DQUN0QixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUNyQixNQUFNOzZCQUNUO3lCQUNGO3FCQUNGO2lCQUNGO2dCQUNELENBQUMsSUFBSSxTQUFTLENBQUM7YUFDaEI7WUFDRCxPQUFPLE9BQU8sQ0FBQztRQUNqQixDQUFDOzs7T0FBQTtJQUNILDZCQUFDO0FBQUQsQ0FBQyxBQTdFRCxJQTZFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIENvbXBvbmVudFRlbXBsYXRlfSBmcm9tICcuLic7XG5pbXBvcnQge1NjaGVtYU1ldGFkYXRhfSBmcm9tICcuLi8uLi9jb3JlJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtjcmVhdGVOYW1lZEFycmF5VHlwZX0gZnJvbSAnLi4vLi4vdXRpbC9uYW1lZF9hcnJheV90eXBlJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1MsIE5BVElWRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdCwgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBJMThuTXV0YXRlT3BDb2RlLCBJMThuTXV0YXRlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIFRJY3V9IGZyb20gJy4uL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1Byb3BlcnR5QWxpYXNlcywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUgYXMgSVROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTZWxlY3RvckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtUUXVlcmllc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcblxuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDSElMRF9IRUFELCBDSElMRF9UQUlMLCBDTEVBTlVQLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBFeHBhbmRvSW5zdHJ1Y3Rpb25zLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgSG9va0RhdGEsIElOSkVDVE9SLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgUkVOREVSRVJfRkFDVE9SWSwgU0FOSVRJWkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3IGFzIElUVmlldywgVFZpZXcsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7VFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9zdHlsaW5nX25leHQvaW50ZXJmYWNlcyc7XG5pbXBvcnQge0RlYnVnU3R5bGluZyBhcyBEZWJ1Z05ld1N0eWxpbmcsIE5vZGVTdHlsaW5nRGVidWd9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9zdHlsaW5nX2RlYnVnJztcbmltcG9ydCB7aXNTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L3V0aWwnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge2dldFROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuXG4vKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGNvbmRpdGlvbmFsbHkgYXR0YWNoZWQgY2xhc3NlcyB3aGljaCBwcm92aWRlIGh1bWFuIHJlYWRhYmxlIChkZWJ1ZykgbGV2ZWxcbiAqIGluZm9ybWF0aW9uIGZvciBgTFZpZXdgLCBgTENvbnRhaW5lcmAgYW5kIG90aGVyIGludGVybmFsIGRhdGEgc3RydWN0dXJlcy4gVGhlc2UgZGF0YSBzdHJ1Y3R1cmVzXG4gKiBhcmUgc3RvcmVkIGludGVybmFsbHkgYXMgYXJyYXkgd2hpY2ggbWFrZXMgaXQgdmVyeSBkaWZmaWN1bHQgZHVyaW5nIGRlYnVnZ2luZyB0byByZWFzb24gYWJvdXQgdGhlXG4gKiBjdXJyZW50IHN0YXRlIG9mIHRoZSBzeXN0ZW0uXG4gKlxuICogUGF0Y2hpbmcgdGhlIGFycmF5IHdpdGggZXh0cmEgcHJvcGVydHkgZG9lcyBjaGFuZ2UgdGhlIGFycmF5J3MgaGlkZGVuIGNsYXNzJyBidXQgaXQgZG9lcyBub3RcbiAqIGNoYW5nZSB0aGUgY29zdCBvZiBhY2Nlc3MsIHRoZXJlZm9yZSB0aGlzIHBhdGNoaW5nIHNob3VsZCBub3QgaGF2ZSBzaWduaWZpY2FudCBpZiBhbnkgaW1wYWN0IGluXG4gKiBgbmdEZXZNb2RlYCBtb2RlLiAoc2VlOiBodHRwczovL2pzcGVyZi5jb20vYXJyYXktdnMtbW9ua2V5LXBhdGNoLWFycmF5KVxuICpcbiAqIFNvIGluc3RlYWQgb2Ygc2VlaW5nOlxuICogYGBgXG4gKiBBcnJheSgzMCkgW09iamVjdCwgNjU5LCBudWxsLCDigKZdXG4gKiBgYGBcbiAqXG4gKiBZb3UgZ2V0IHRvIHNlZTpcbiAqIGBgYFxuICogTFZpZXdEZWJ1ZyB7XG4gKiAgIHZpZXdzOiBbLi4uXSxcbiAqICAgZmxhZ3M6IHthdHRhY2hlZDogdHJ1ZSwgLi4ufVxuICogICBub2RlczogW1xuICogICAgIHtodG1sOiAnPGRpdiBpZD1cIjEyM1wiPicsIC4uLiwgbm9kZXM6IFtcbiAqICAgICAgIHtodG1sOiAnPHNwYW4+JywgLi4uLCBub2RlczogbnVsbH1cbiAqICAgICBdfVxuICogICBdXG4gKiB9XG4gKiBgYGBcbiAqL1xuXG5cbmV4cG9ydCBjb25zdCBMVmlld0FycmF5ID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMVmlldycpO1xubGV0IExWSUVXX0VNUFRZOiB1bmtub3duW107ICAvLyBjYW4ndCBpbml0aWFsaXplIGhlcmUgb3IgaXQgd2lsbCBub3QgYmUgdHJlZSBzaGFrZW4sIGJlY2F1c2UgYExWaWV3YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdHJ1Y3RvciBjb3VsZCBoYXZlIHNpZGUtZWZmZWN0cy5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBjbG9uZXMgYSBibHVlcHJpbnQgYW5kIGNyZWF0ZXMgTFZpZXcuXG4gKlxuICogU2ltcGxlIHNsaWNlIHdpbGwga2VlcCB0aGUgc2FtZSB0eXBlLCBhbmQgd2UgbmVlZCBpdCB0byBiZSBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvbmVUb0xWaWV3KGxpc3Q6IGFueVtdKTogTFZpZXcge1xuICBpZiAoTFZJRVdfRU1QVFkgPT09IHVuZGVmaW5lZCkgTFZJRVdfRU1QVFkgPSBuZXcgTFZpZXdBcnJheSAhKCk7XG4gIHJldHVybiBMVklFV19FTVBUWS5jb25jYXQobGlzdCkgYXMgYW55O1xufVxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaXMgYSBkZWJ1ZyB2ZXJzaW9uIG9mIE9iamVjdCBsaXRlcmFsIHNvIHRoYXQgd2UgY2FuIGhhdmUgY29uc3RydWN0b3IgbmFtZSBzaG93IHVwIGluXG4gKiBkZWJ1ZyB0b29scyBpbiBuZ0Rldk1vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBUVmlld0NvbnN0cnVjdG9yID0gY2xhc3MgVFZpZXcgaW1wbGVtZW50cyBJVFZpZXcge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBpZDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJsdWVwcmludDogTFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBxdWVyaWVzOiBUUXVlcmllc3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCwgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBkYXRhOiBURGF0YSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsICAvL1xuICAgICAgcHVibGljIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuLCAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbiwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcHJlT3JkZXJDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbCwgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgY2xlYW51cDogYW55W118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCwgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwsICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCwgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGwsICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLCAgICAgICAgICAgICAgICAgLy9cbiAgICAgICkge31cbn07XG5cbmV4cG9ydCBjb25zdCBUTm9kZUNvbnN0cnVjdG9yID0gY2xhc3MgVE5vZGUgaW1wbGVtZW50cyBJVE5vZGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyB0Vmlld186IFRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHR5cGU6IFROb2RlVHlwZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5kZXg6IG51bWJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBpbmplY3RvckluZGV4OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZGlyZWN0aXZlRW5kOiBudW1iZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9wZXJ0eU1ldGFkYXRhU3RhcnRJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb3BlcnR5TWV0YWRhdGFFbmRJbmRleDogbnVtYmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgZmxhZ3M6IFROb2RlRmxhZ3MsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRhZ05hbWU6IHN0cmluZ3xudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgYXR0cnM6IChzdHJpbmd8QXR0cmlidXRlTWFya2VyfChzdHJpbmd8U2VsZWN0b3JGbGFncylbXSlbXXxudWxsLCAgLy9cbiAgICAgIHB1YmxpYyBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQsICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHRWaWV3czogSVRWaWV3fElUVmlld1tdfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgbmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNoaWxkOiBJVE5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdHlsaW5nVGVtcGxhdGU6IFN0eWxpbmdDb250ZXh0fG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIHByb2plY3Rpb246IG51bWJlcnwoSVROb2RlfFJOb2RlW10pW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICBwdWJsaWMgb25FbGVtZW50Q3JlYXRpb25GbnM6IEZ1bmN0aW9uW118bnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgIHB1YmxpYyBzdHlsZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgcHVibGljIGNsYXNzZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICApIHt9XG5cbiAgZ2V0IHR5cGVfKCk6IHN0cmluZyB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkNvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuQ29udGFpbmVyJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnQ6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkVsZW1lbnQnO1xuICAgICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcjpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5JY3VDb250YWluZXI6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLkljdUNvbnRhaW5lcic7XG4gICAgICBjYXNlIFROb2RlVHlwZS5Qcm9qZWN0aW9uOlxuICAgICAgICByZXR1cm4gJ1ROb2RlVHlwZS5Qcm9qZWN0aW9uJztcbiAgICAgIGNhc2UgVE5vZGVUeXBlLlZpZXc6XG4gICAgICAgIHJldHVybiAnVE5vZGVUeXBlLlZpZXcnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdUTm9kZVR5cGUuPz8/JztcbiAgICB9XG4gIH1cblxuICBnZXQgZmxhZ3NfKCk6IHN0cmluZyB7XG4gICAgY29uc3QgZmxhZ3M6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnkpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5Jyk7XG4gICAgaWYgKHRoaXMuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgZmxhZ3MucHVzaCgnVE5vZGVGbGFncy5pc0NvbXBvbmVudCcpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSBmbGFncy5wdXNoKCdUTm9kZUZsYWdzLmlzRGV0YWNoZWQnKTtcbiAgICBpZiAodGhpcy5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpIGZsYWdzLnB1c2goJ1ROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQnKTtcbiAgICByZXR1cm4gZmxhZ3Muam9pbignfCcpO1xuICB9XG59O1xuXG5jb25zdCBUVmlld0RhdGEgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1RWaWV3RGF0YScpO1xubGV0IFRWSUVXREFUQV9FTVBUWTpcbiAgICB1bmtub3duW107ICAvLyBjYW4ndCBpbml0aWFsaXplIGhlcmUgb3IgaXQgd2lsbCBub3QgYmUgdHJlZSBzaGFrZW4sIGJlY2F1c2UgYExWaWV3YFxuICAgICAgICAgICAgICAgIC8vIGNvbnN0cnVjdG9yIGNvdWxkIGhhdmUgc2lkZS1lZmZlY3RzLlxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGNsb25lcyBhIGJsdWVwcmludCBhbmQgY3JlYXRlcyBURGF0YS5cbiAqXG4gKiBTaW1wbGUgc2xpY2Ugd2lsbCBrZWVwIHRoZSBzYW1lIHR5cGUsIGFuZCB3ZSBuZWVkIGl0IHRvIGJlIFREYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZVRvVFZpZXdEYXRhKGxpc3Q6IGFueVtdKTogVERhdGEge1xuICBpZiAoVFZJRVdEQVRBX0VNUFRZID09PSB1bmRlZmluZWQpIFRWSUVXREFUQV9FTVBUWSA9IG5ldyBUVmlld0RhdGEgISgpO1xuICByZXR1cm4gVFZJRVdEQVRBX0VNUFRZLmNvbmNhdChsaXN0KSBhcyBhbnk7XG59XG5cbmV4cG9ydCBjb25zdCBMVmlld0JsdWVwcmludCA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTFZpZXdCbHVlcHJpbnQnKTtcbmV4cG9ydCBjb25zdCBNYXRjaGVzQXJyYXkgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ01hdGNoZXNBcnJheScpO1xuZXhwb3J0IGNvbnN0IFRWaWV3Q29tcG9uZW50cyA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVFZpZXdDb21wb25lbnRzJyk7XG5leHBvcnQgY29uc3QgVE5vZGVMb2NhbE5hbWVzID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdUTm9kZUxvY2FsTmFtZXMnKTtcbmV4cG9ydCBjb25zdCBUTm9kZUluaXRpYWxJbnB1dHMgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbElucHV0cycpO1xuZXhwb3J0IGNvbnN0IFROb2RlSW5pdGlhbERhdGEgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ1ROb2RlSW5pdGlhbERhdGEnKTtcbmV4cG9ydCBjb25zdCBMQ2xlYW51cCA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTENsZWFudXAnKTtcbmV4cG9ydCBjb25zdCBUQ2xlYW51cCA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnVENsZWFudXAnKTtcblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3OiBMVmlldykge1xuICBhdHRhY2hEZWJ1Z09iamVjdChsVmlldywgbmV3IExWaWV3RGVidWcobFZpZXcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxDb250YWluZXIsIG5ldyBMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3KTogTFZpZXdEZWJ1ZztcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcgfCBudWxsKTogTFZpZXdEZWJ1Z3xudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyB8IExDb250YWluZXIgfCBudWxsKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogYW55KTogYW55IHtcbiAgaWYgKG9iaikge1xuICAgIGNvbnN0IGRlYnVnID0gKG9iaiBhcyBhbnkpLmRlYnVnO1xuICAgIGFzc2VydERlZmluZWQoZGVidWcsICdPYmplY3QgZG9lcyBub3QgaGF2ZSBhIGRlYnVnIHJlcHJlc2VudGF0aW9uLicpO1xuICAgIHJldHVybiBkZWJ1ZztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG59XG5cbi8qKlxuICogVXNlIHRoaXMgbWV0aG9kIHRvIHVud3JhcCBhIG5hdGl2ZSBlbGVtZW50IGluIGBMVmlld2AgYW5kIGNvbnZlcnQgaXQgaW50byBIVE1MIGZvciBlYXNpZXJcbiAqIHJlYWRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIHBvc3NpYmx5IHdyYXBwZWQgbmF0aXZlIERPTSBub2RlLlxuICogQHBhcmFtIGluY2x1ZGVDaGlsZHJlbiBJZiBgdHJ1ZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBpbmNsdWRlIGNoaWxkIGVsZW1lbnRzIChzYW1lXG4gKiBhcyBgb3V0ZXJIVE1MYCkuIElmIGBmYWxzZWAgdGhlbiB0aGUgc2VyaWFsaXplZCBIVE1MIGZvcm0gd2lsbCBvbmx5IGNvbnRhaW4gdGhlIGVsZW1lbnQgaXRzZWxmXG4gKiAod2lsbCBub3Qgc2VyaWFsaXplIGNoaWxkIGVsZW1lbnRzKS5cbiAqL1xuZnVuY3Rpb24gdG9IdG1sKHZhbHVlOiBhbnksIGluY2x1ZGVDaGlsZHJlbjogYm9vbGVhbiA9IGZhbHNlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlOiBIVE1MRWxlbWVudHxudWxsID0gdW53cmFwUk5vZGUodmFsdWUpIGFzIGFueTtcbiAgaWYgKG5vZGUpIHtcbiAgICBjb25zdCBpc1RleHROb2RlID0gbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREU7XG4gICAgY29uc3Qgb3V0ZXJIVE1MID0gKGlzVGV4dE5vZGUgPyBub2RlLnRleHRDb250ZW50IDogbm9kZS5vdXRlckhUTUwpIHx8ICcnO1xuICAgIGlmIChpbmNsdWRlQ2hpbGRyZW4gfHwgaXNUZXh0Tm9kZSkge1xuICAgICAgcmV0dXJuIG91dGVySFRNTDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5uZXJIVE1MID0gbm9kZS5pbm5lckhUTUw7XG4gICAgICByZXR1cm4gb3V0ZXJIVE1MLnNwbGl0KGlubmVySFRNTClbMF0gfHwgbnVsbDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExWaWV3RGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbFZpZXc6IExWaWV3KSB7fVxuXG4gIC8qKlxuICAgKiBGbGFncyBhc3NvY2lhdGVkIHdpdGggdGhlIGBMVmlld2AgdW5wYWNrZWQgaW50byBhIG1vcmUgcmVhZGFibGUgc3RhdGUuXG4gICAqL1xuICBnZXQgZmxhZ3MoKSB7XG4gICAgY29uc3QgZmxhZ3MgPSB0aGlzLl9yYXdfbFZpZXdbRkxBR1NdO1xuICAgIHJldHVybiB7XG4gICAgICBfX3Jhd19fZmxhZ3NfXzogZmxhZ3MsXG4gICAgICBpbml0UGhhc2VTdGF0ZTogZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzayxcbiAgICAgIGNyZWF0aW9uTW9kZTogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSksXG4gICAgICBmaXJzdFZpZXdQYXNzOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpLFxuICAgICAgY2hlY2tBbHdheXM6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyksXG4gICAgICBkaXJ0eTogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkRpcnR5KSxcbiAgICAgIGF0dGFjaGVkOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpLFxuICAgICAgZGVzdHJveWVkOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSxcbiAgICAgIGlzUm9vdDogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLklzUm9vdCksXG4gICAgICBpbmRleFdpdGhpbkluaXRQaGFzZTogZmxhZ3MgPj4gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0LFxuICAgIH07XG4gIH1cbiAgZ2V0IHBhcmVudCgpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsIHsgcmV0dXJuIHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W1BBUkVOVF0pOyB9XG4gIGdldCBob3N0KCk6IHN0cmluZ3xudWxsIHsgcmV0dXJuIHRvSHRtbCh0aGlzLl9yYXdfbFZpZXdbSE9TVF0sIHRydWUpOyB9XG4gIGdldCBjb250ZXh0KCk6IHt9fG51bGwgeyByZXR1cm4gdGhpcy5fcmF3X2xWaWV3W0NPTlRFWFRdOyB9XG4gIC8qKlxuICAgKiBUaGUgdHJlZSBvZiBub2RlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC4gVGhlIG5vZGVzIGhhdmUgYmVlbiBub3JtYWxpemVkIGludG8gYVxuICAgKiB0cmVlIHN0cnVjdHVyZSB3aXRoIHJlbGV2YW50IGRldGFpbHMgcHVsbGVkIG91dCBmb3IgcmVhZGFiaWxpdHkuXG4gICAqL1xuICBnZXQgbm9kZXMoKTogRGVidWdOb2RlW118bnVsbCB7XG4gICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yYXdfbFZpZXc7XG4gICAgY29uc3QgdE5vZGUgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgICByZXR1cm4gdG9EZWJ1Z05vZGVzKHROb2RlLCBsVmlldyk7XG4gIH1cbiAgLyoqXG4gICAqIEFkZGl0aW9uYWwgaW5mb3JtYXRpb24gd2hpY2ggaXMgaGlkZGVuIGJlaGluZCBhIHByb3BlcnR5LiBUaGUgZXh0cmEgbGV2ZWwgb2YgaW5kaXJlY3Rpb24gaXNcbiAgICogZG9uZSBzbyB0aGF0IHRoZSBkZWJ1ZyB2aWV3IHdvdWxkIG5vdCBiZSBjbHV0dGVyZWQgd2l0aCBwcm9wZXJ0aWVzIHdoaWNoIGFyZSBvbmx5IHJhcmVseVxuICAgKiByZWxldmFudCB0byB0aGUgZGV2ZWxvcGVyLlxuICAgKi9cbiAgZ2V0IF9fb3RoZXJfXygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdFZpZXc6IHRoaXMuX3Jhd19sVmlld1tUVklFV10sXG4gICAgICBjbGVhbnVwOiB0aGlzLl9yYXdfbFZpZXdbQ0xFQU5VUF0sXG4gICAgICBpbmplY3RvcjogdGhpcy5fcmF3X2xWaWV3W0lOSkVDVE9SXSxcbiAgICAgIHJlbmRlcmVyRmFjdG9yeTogdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldLFxuICAgICAgcmVuZGVyZXI6IHRoaXMuX3Jhd19sVmlld1tSRU5ERVJFUl0sXG4gICAgICBzYW5pdGl6ZXI6IHRoaXMuX3Jhd19sVmlld1tTQU5JVElaRVJdLFxuICAgICAgY2hpbGRIZWFkOiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tDSElMRF9IRUFEXSksXG4gICAgICBuZXh0OiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tORVhUXSksXG4gICAgICBjaGlsZFRhaWw6IHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX1RBSUxdKSxcbiAgICAgIGRlY2xhcmF0aW9uVmlldzogdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbREVDTEFSQVRJT05fVklFV10pLFxuICAgICAgcXVlcmllczogbnVsbCxcbiAgICAgIHRIb3N0OiB0aGlzLl9yYXdfbFZpZXdbVF9IT1NUXSxcbiAgICAgIGJpbmRpbmdJbmRleDogdGhpcy5fcmF3X2xWaWV3W0JJTkRJTkdfSU5ERVhdLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplZCB2aWV3IG9mIGNoaWxkIHZpZXdzIChhbmQgY29udGFpbmVycykgYXR0YWNoZWQgYXQgdGhpcyBsb2NhdGlvbi5cbiAgICovXG4gIGdldCBjaGlsZFZpZXdzKCk6IEFycmF5PExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnPiB7XG4gICAgY29uc3QgY2hpbGRWaWV3czogQXJyYXk8TFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWc+ID0gW107XG4gICAgbGV0IGNoaWxkID0gdGhpcy5fX290aGVyX18uY2hpbGRIZWFkO1xuICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgY2hpbGRWaWV3cy5wdXNoKGNoaWxkKTtcbiAgICAgIGNoaWxkID0gY2hpbGQuX19vdGhlcl9fLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZFZpZXdzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgaHRtbDogc3RyaW5nfG51bGw7XG4gIG5hdGl2ZTogTm9kZTtcbiAgc3R5bGVzOiBEZWJ1Z05ld1N0eWxpbmd8bnVsbDtcbiAgY2xhc3NlczogRGVidWdOZXdTdHlsaW5nfG51bGw7XG4gIG5vZGVzOiBEZWJ1Z05vZGVbXXxudWxsO1xuICBjb21wb25lbnQ6IExWaWV3RGVidWd8bnVsbDtcbn1cblxuLyoqXG4gKiBUdXJucyBhIGZsYXQgbGlzdCBvZiBub2RlcyBpbnRvIGEgdHJlZSBieSB3YWxraW5nIHRoZSBhc3NvY2lhdGVkIGBUTm9kZWAgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGVcbiAqIEBwYXJhbSBsVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1Z05vZGVzKHROb2RlOiBUTm9kZSB8IG51bGwsIGxWaWV3OiBMVmlldyk6IERlYnVnTm9kZVtdfG51bGwge1xuICBpZiAodE5vZGUpIHtcbiAgICBjb25zdCBkZWJ1Z05vZGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGxldCB0Tm9kZUN1cnNvcjogVE5vZGV8bnVsbCA9IHROb2RlO1xuICAgIHdoaWxlICh0Tm9kZUN1cnNvcikge1xuICAgICAgY29uc3QgcmF3VmFsdWUgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShyYXdWYWx1ZSk7XG4gICAgICBjb25zdCBjb21wb25lbnRMVmlld0RlYnVnID0gdG9EZWJ1ZyhyZWFkTFZpZXdWYWx1ZShyYXdWYWx1ZSkpO1xuXG4gICAgICBjb25zdCBzdHlsZXMgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLnN0eWxlcykgP1xuICAgICAgICAgIG5ldyBOb2RlU3R5bGluZ0RlYnVnKHROb2RlLnN0eWxlcyBhcyBhbnkgYXMgVFN0eWxpbmdDb250ZXh0LCBsVmlldykgOlxuICAgICAgICAgIG51bGw7XG4gICAgICBjb25zdCBjbGFzc2VzID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5jbGFzc2VzKSA/XG4gICAgICAgICAgbmV3IE5vZGVTdHlsaW5nRGVidWcodE5vZGUuY2xhc3NlcyBhcyBhbnkgYXMgVFN0eWxpbmdDb250ZXh0LCBsVmlldywgdHJ1ZSkgOlxuICAgICAgICAgIG51bGw7XG4gICAgICBkZWJ1Z05vZGVzLnB1c2goe1xuICAgICAgICBodG1sOiB0b0h0bWwobmF0aXZlKSxcbiAgICAgICAgbmF0aXZlOiBuYXRpdmUgYXMgYW55LCBzdHlsZXMsIGNsYXNzZXMsXG4gICAgICAgIG5vZGVzOiB0b0RlYnVnTm9kZXModE5vZGUuY2hpbGQsIGxWaWV3KSxcbiAgICAgICAgY29tcG9uZW50OiBjb21wb25lbnRMVmlld0RlYnVnLFxuICAgICAgfSk7XG4gICAgICB0Tm9kZUN1cnNvciA9IHROb2RlQ3Vyc29yLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiBkZWJ1Z05vZGVzO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMQ29udGFpbmVyRGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9yYXdfbENvbnRhaW5lcjogTENvbnRhaW5lcikge31cblxuICBnZXQgYWN0aXZlSW5kZXgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0FDVElWRV9JTkRFWF07IH1cbiAgZ2V0IHZpZXdzKCk6IExWaWV3RGVidWdbXSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyLnNsaWNlKENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKVxuICAgICAgICAubWFwKHRvRGVidWcgYXMobDogTFZpZXcpID0+IExWaWV3RGVidWcpO1xuICB9XG4gIGdldCBwYXJlbnQoKTogTFZpZXdEZWJ1Z3xMQ29udGFpbmVyRGVidWd8bnVsbCB7IHJldHVybiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW1BBUkVOVF0pOyB9XG4gIGdldCBtb3ZlZFZpZXdzKCk6IExWaWV3W118bnVsbCB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltNT1ZFRF9WSUVXU107IH1cbiAgZ2V0IGhvc3QoKTogUkVsZW1lbnR8UkNvbW1lbnR8U3R5bGluZ0NvbnRleHR8TFZpZXcgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbSE9TVF07IH1cbiAgZ2V0IG5hdGl2ZSgpOiBSQ29tbWVudCB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltOQVRJVkVdOyB9XG4gIGdldCBfX290aGVyX18oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5leHQ6IHRvRGVidWcodGhpcy5fcmF3X2xDb250YWluZXJbTkVYVF0pLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYExWaWV3YCB2YWx1ZSBpZiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgYExWaWV3YCBpZiBhbnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRMVmlld1ZhbHVlKHZhbHVlOiBhbnkpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gVGhpcyBjaGVjayBpcyBub3QgcXVpdGUgcmlnaHQsIGFzIGl0IGRvZXMgbm90IHRha2UgaW50byBhY2NvdW50IGBTdHlsaW5nQ29udGV4dGBcbiAgICAvLyBUaGlzIGlzIHdoeSBpdCBpcyBpbiBkZWJ1Zywgbm90IGluIHV0aWwudHNcbiAgICBpZiAodmFsdWUubGVuZ3RoID49IEhFQURFUl9PRkZTRVQgLSAxKSByZXR1cm4gdmFsdWUgYXMgTFZpZXc7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIEkxOE5EZWJ1Z0l0ZW0ge1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG5cbiAgZ2V0IHROb2RlKCkgeyByZXR1cm4gZ2V0VE5vZGUodGhpcy5ub2RlSW5kZXgsIHRoaXMuX2xWaWV3KTsgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIF9fcmF3X29wQ29kZTogYW55LCBwcml2YXRlIF9sVmlldzogTFZpZXcsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlcixcbiAgICAgIHB1YmxpYyB0eXBlOiBzdHJpbmcpIHt9XG59XG5cbi8qKlxuICogVHVybnMgYSBsaXN0IG9mIFwiQ3JlYXRlXCIgJiBcIlVwZGF0ZVwiIE9wQ29kZXMgaW50byBhIGh1bWFuLXJlYWRhYmxlIGxpc3Qgb2Ygb3BlcmF0aW9ucyBmb3JcbiAqIGRlYnVnZ2luZyBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBtdXRhdGVPcENvZGVzIG11dGF0aW9uIG9wQ29kZXMgdG8gcmVhZFxuICogQHBhcmFtIHVwZGF0ZU9wQ29kZXMgdXBkYXRlIG9wQ29kZXMgdG8gcmVhZFxuICogQHBhcmFtIGljdXMgbGlzdCBvZiBJQ1UgZXhwcmVzc2lvbnNcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0aGUgb3BDb2RlcyBhcmUgYWN0aW5nIG9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hJMThuT3BDb2Rlc0RlYnVnKFxuICAgIG11dGF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCxcbiAgICBsVmlldzogTFZpZXcpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobXV0YXRlT3BDb2RlcywgbmV3IEkxOG5NdXRhdGVPcENvZGVzRGVidWcobXV0YXRlT3BDb2RlcywgbFZpZXcpKTtcbiAgYXR0YWNoRGVidWdPYmplY3QodXBkYXRlT3BDb2RlcywgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcodXBkYXRlT3BDb2RlcywgaWN1cywgbFZpZXcpKTtcblxuICBpZiAoaWN1cykge1xuICAgIGljdXMuZm9yRWFjaChpY3UgPT4ge1xuICAgICAgaWN1LmNyZWF0ZS5mb3JFYWNoKFxuICAgICAgICAgIGljdUNhc2UgPT4geyBhdHRhY2hEZWJ1Z09iamVjdChpY3VDYXNlLCBuZXcgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyhpY3VDYXNlLCBsVmlldykpOyB9KTtcbiAgICAgIGljdS51cGRhdGUuZm9yRWFjaChpY3VDYXNlID0+IHtcbiAgICAgICAgYXR0YWNoRGVidWdPYmplY3QoaWN1Q2FzZSwgbmV3IEkxOG5VcGRhdGVPcENvZGVzRGVidWcoaWN1Q2FzZSwgaWN1cywgbFZpZXcpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnIGltcGxlbWVudHMgSTE4bk9wQ29kZXNEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX19yYXdfb3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIHByaXZhdGUgcmVhZG9ubHkgX19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBvcGVyYXRpb24gaW5mb3JtYXRpb24gYWJvdXQgaG93IHRoZSBPcENvZGVzIHdpbGwgYWN0IG9uIHRoZSB2aWV3LlxuICAgKi9cbiAgZ2V0IG9wZXJhdGlvbnMoKSB7XG4gICAgY29uc3Qge19fbFZpZXcsIF9fcmF3X29wQ29kZXN9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBfX3Jhd19vcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvcENvZGUgPSBfX3Jhd19vcENvZGVzW2ldO1xuICAgICAgbGV0IHJlc3VsdDogYW55O1xuICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICB0eXBlOiAnQ3JlYXRlIFRleHQgTm9kZScsXG4gICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgdGV4dDogb3BDb2RlLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBkZXN0aW5hdGlvbk5vZGVJbmRleCwgJ0FwcGVuZENoaWxkJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnU2VsZWN0Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZDpcbiAgICAgICAgICAgIGxldCBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBlbGVtZW50SW5kZXgsICdFbGVtZW50RW5kJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgIGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIGVsZW1lbnRJbmRleCwgJ0F0dHInKTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0ck5hbWUnXSA9IF9fcmF3X29wQ29kZXNbKytpXTtcbiAgICAgICAgICAgIHJlc3VsdFsnYXR0clZhbHVlJ10gPSBfX3Jhd19vcENvZGVzWysraV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICBzd2l0Y2ggKG9wQ29kZSkge1xuICAgICAgICAgIGNhc2UgQ09NTUVOVF9NQVJLRVI6XG4gICAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICB0eXBlOiAnQ09NTUVOVF9NQVJLRVInLFxuICAgICAgICAgICAgICBjb21tZW50VmFsdWU6IF9fcmF3X29wQ29kZXNbKytpXSxcbiAgICAgICAgICAgICAgbm9kZUluZGV4OiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgIHR5cGU6ICdFTEVNRU5UX01BUktFUicsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgIHR5cGU6ICdVbmtub3duIE9wIENvZGUnLFxuICAgICAgICAgIGNvZGU6IG9wQ29kZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEkxOG5VcGRhdGVPcENvZGVzRGVidWcgaW1wbGVtZW50cyBJMThuT3BDb2Rlc0RlYnVnIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IF9fcmF3X29wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBwcml2YXRlIHJlYWRvbmx5IGljdXM6IFRJY3VbXXxudWxsLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfX2xWaWV3OiBMVmlldykge31cblxuICAvKipcbiAgICogQSBsaXN0IG9mIG9wZXJhdGlvbiBpbmZvcm1hdGlvbiBhYm91dCBob3cgdGhlIE9wQ29kZXMgd2lsbCBhY3Qgb24gdGhlIHZpZXcuXG4gICAqL1xuICBnZXQgb3BlcmF0aW9ucygpIHtcbiAgICBjb25zdCB7X19sVmlldywgX19yYXdfb3BDb2RlcywgaWN1c30gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF9fcmF3X29wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICAgIGNvbnN0IGNoZWNrQml0ID0gX19yYXdfb3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgICAgY29uc3Qgc2tpcENvZGVzID0gX19yYXdfb3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IF9fcmF3X29wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlICs9IG9wQ29kZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKG9wQ29kZSA8IDApIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBiaW5kaW5nIGluZGV4IHdob3NlIHZhbHVlIGlzIG5lZ2F0aXZlXG4gICAgICAgICAgICAvLyBXZSBjYW5ub3Qga25vdyB0aGUgdmFsdWUgb2YgdGhlIGJpbmRpbmcgc28gd2Ugb25seSBzaG93IHRoZSBpbmRleFxuICAgICAgICAgICAgdmFsdWUgKz0gYO+/vSR7LW9wQ29kZSAtIDF977+9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIGxldCB0SWN1SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCB0SWN1OiBUSWN1O1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gX19yYXdfb3BDb2Rlc1srK2pdO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ0F0dHInLFxuICAgICAgICAgICAgICAgICAgYXR0clZhbHVlOiB2YWx1ZSwgYXR0ck5hbWUsIHNhbml0aXplRm4sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgICAgIGNoZWNrQml0LFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ1RleHQnLCBub2RlSW5kZXgsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiB2YWx1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaDpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdJY3VTd2l0Y2gnKTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3VJbmRleCddID0gdEljdUluZGV4O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnY2hlY2tCaXQnXSA9IGNoZWNrQml0O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnbWFpbkJpbmRpbmcnXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdSddID0gdEljdTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSBfX3Jhd19vcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ0ljdVVwZGF0ZScpO1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdUluZGV4J10gPSB0SWN1SW5kZXg7XG4gICAgICAgICAgICAgICAgcmVzdWx0WydjaGVja0JpdCddID0gY2hlY2tCaXQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1J10gPSB0SWN1O1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaSArPSBza2lwQ29kZXM7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSTE4bk9wQ29kZXNEZWJ1ZyB7IG9wZXJhdGlvbnM6IGFueVtdOyB9XG4iXX0=