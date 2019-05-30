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
import { assertDefined } from '../util/assert';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET, NATIVE } from './interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from './interfaces/i18n';
import { BINDING_INDEX, CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTENT_QUERIES, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from './interfaces/view';
import { runtimeIsNewStylingInUse } from './styling_next/state';
import { NodeStylingDebug } from './styling_next/styling_debug';
import { attachDebugObject } from './util/debug_utils';
import { getTNode, isStylingContext, unwrapRNode } from './util/view_utils';
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
            contentQueries: this._raw_lView[CONTENT_QUERIES],
            queries: this._raw_lView[QUERIES],
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
            const componentLViewDebug = isStylingContext(rawValue) ? null : toDebug(readLViewValue(rawValue));
            /** @type {?} */
            let styles = null;
            /** @type {?} */
            let classes = null;
            if (runtimeIsNewStylingInUse()) {
                styles = tNode.newStyles ? new NodeStylingDebug(tNode.newStyles, lView, false) : null;
                classes = tNode.newClasses ? new NodeStylingDebug(tNode.newClasses, lView, true) : null;
            }
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
    get queries() { return this._raw_lContainer[QUERIES]; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxZQUFZLEVBQUUsdUJBQXVCLEVBQWMsTUFBTSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDakcsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlGLE1BQU0sbUJBQW1CLENBQUM7QUFLakosT0FBTyxFQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBcUIsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDblEsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUQsT0FBTyxFQUFrQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQy9GLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdDMUUsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQVk7SUFDM0MsaUJBQWlCLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUs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a0M7Ozs7O0lBQ3JGLHlDQUErQjs7Ozs7QUE0RXJDLHNDQUF3RDs7O0lBQXBCLHNDQUFrQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBJMThuTXV0YXRlT3BDb2RlLCBJMThuTXV0YXRlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIFRJY3V9IGZyb20gJy4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVOVF9RVUVSSUVTLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBTQU5JVElaRVIsIFRWSUVXLCBUX0hPU1R9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7cnVudGltZUlzTmV3U3R5bGluZ0luVXNlfSBmcm9tICcuL3N0eWxpbmdfbmV4dC9zdGF0ZSc7XG5pbXBvcnQge0RlYnVnU3R5bGluZyBhcyBEZWJ1Z05ld1N0eWxpbmcsIE5vZGVTdHlsaW5nRGVidWd9IGZyb20gJy4vc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi91dGlsL2RlYnVnX3V0aWxzJztcbmltcG9ydCB7Z2V0VE5vZGUsIGlzU3R5bGluZ0NvbnRleHQsIHVud3JhcFJOb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cbi8qXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgY29uZGl0aW9uYWxseSBhdHRhY2hlZCBjbGFzc2VzIHdoaWNoIHByb3ZpZGUgaHVtYW4gcmVhZGFibGUgKGRlYnVnKSBsZXZlbFxuICogaW5mb3JtYXRpb24gZm9yIGBMVmlld2AsIGBMQ29udGFpbmVyYCBhbmQgb3RoZXIgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzLiBUaGVzZSBkYXRhIHN0cnVjdHVyZXNcbiAqIGFyZSBzdG9yZWQgaW50ZXJuYWxseSBhcyBhcnJheSB3aGljaCBtYWtlcyBpdCB2ZXJ5IGRpZmZpY3VsdCBkdXJpbmcgZGVidWdnaW5nIHRvIHJlYXNvbiBhYm91dCB0aGVcbiAqIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHN5c3RlbS5cbiAqXG4gKiBQYXRjaGluZyB0aGUgYXJyYXkgd2l0aCBleHRyYSBwcm9wZXJ0eSBkb2VzIGNoYW5nZSB0aGUgYXJyYXkncyBoaWRkZW4gY2xhc3MnIGJ1dCBpdCBkb2VzIG5vdFxuICogY2hhbmdlIHRoZSBjb3N0IG9mIGFjY2VzcywgdGhlcmVmb3JlIHRoaXMgcGF0Y2hpbmcgc2hvdWxkIG5vdCBoYXZlIHNpZ25pZmljYW50IGlmIGFueSBpbXBhY3QgaW5cbiAqIGBuZ0Rldk1vZGVgIG1vZGUuIChzZWU6IGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS12cy1tb25rZXktcGF0Y2gtYXJyYXkpXG4gKlxuICogU28gaW5zdGVhZCBvZiBzZWVpbmc6XG4gKiBgYGBcbiAqIEFycmF5KDMwKSBbT2JqZWN0LCA2NTksIG51bGwsIOKApl1cbiAqIGBgYFxuICpcbiAqIFlvdSBnZXQgdG8gc2VlOlxuICogYGBgXG4gKiBMVmlld0RlYnVnIHtcbiAqICAgdmlld3M6IFsuLi5dLFxuICogICBmbGFnczoge2F0dGFjaGVkOiB0cnVlLCAuLi59XG4gKiAgIG5vZGVzOiBbXG4gKiAgICAge2h0bWw6ICc8ZGl2IGlkPVwiMTIzXCI+JywgLi4uLCBub2RlczogW1xuICogICAgICAge2h0bWw6ICc8c3Bhbj4nLCAuLi4sIG5vZGVzOiBudWxsfVxuICogICAgIF19XG4gKiAgIF1cbiAqIH1cbiAqIGBgYFxuICovXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaExWaWV3RGVidWcobFZpZXc6IExWaWV3KSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGxWaWV3LCBuZXcgTFZpZXdEZWJ1ZyhsVmlldykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoTENvbnRhaW5lckRlYnVnKGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgYXR0YWNoRGVidWdPYmplY3QobENvbnRhaW5lciwgbmV3IExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0RlYnVnKG9iajogTFZpZXcpOiBMVmlld0RlYnVnO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBMVmlldyB8IG51bGwpOiBMVmlld0RlYnVnfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gdG9EZWJ1ZyhvYmo6IExWaWV3IHwgTENvbnRhaW5lciB8IG51bGwpOiBMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Z3xudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWcob2JqOiBhbnkpOiBhbnkge1xuICBpZiAob2JqKSB7XG4gICAgY29uc3QgZGVidWcgPSAob2JqIGFzIGFueSkuZGVidWc7XG4gICAgYXNzZXJ0RGVmaW5lZChkZWJ1ZywgJ09iamVjdCBkb2VzIG5vdCBoYXZlIGEgZGVidWcgcmVwcmVzZW50YXRpb24uJyk7XG4gICAgcmV0dXJuIGRlYnVnO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmo7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2UgdGhpcyBtZXRob2QgdG8gdW53cmFwIGEgbmF0aXZlIGVsZW1lbnQgaW4gYExWaWV3YCBhbmQgY29udmVydCBpdCBpbnRvIEhUTUwgZm9yIGVhc2llclxuICogcmVhZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgcG9zc2libHkgd3JhcHBlZCBuYXRpdmUgRE9NIG5vZGUuXG4gKiBAcGFyYW0gaW5jbHVkZUNoaWxkcmVuIElmIGB0cnVlYCB0aGVuIHRoZSBzZXJpYWxpemVkIEhUTUwgZm9ybSB3aWxsIGluY2x1ZGUgY2hpbGQgZWxlbWVudHMgKHNhbWVcbiAqIGFzIGBvdXRlckhUTUxgKS4gSWYgYGZhbHNlYCB0aGVuIHRoZSBzZXJpYWxpemVkIEhUTUwgZm9ybSB3aWxsIG9ubHkgY29udGFpbiB0aGUgZWxlbWVudCBpdHNlbGZcbiAqICh3aWxsIG5vdCBzZXJpYWxpemUgY2hpbGQgZWxlbWVudHMpLlxuICovXG5mdW5jdGlvbiB0b0h0bWwodmFsdWU6IGFueSwgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gZmFsc2UpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IG5vZGU6IEhUTUxFbGVtZW50fG51bGwgPSB1bndyYXBSTm9kZSh2YWx1ZSkgYXMgYW55O1xuICBpZiAobm9kZSkge1xuICAgIGNvbnN0IGlzVGV4dE5vZGUgPSBub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERTtcbiAgICBjb25zdCBvdXRlckhUTUwgPSAoaXNUZXh0Tm9kZSA/IG5vZGUudGV4dENvbnRlbnQgOiBub2RlLm91dGVySFRNTCkgfHwgJyc7XG4gICAgaWYgKGluY2x1ZGVDaGlsZHJlbiB8fCBpc1RleHROb2RlKSB7XG4gICAgICByZXR1cm4gb3V0ZXJIVE1MO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbm5lckhUTUwgPSBub2RlLmlubmVySFRNTDtcbiAgICAgIHJldHVybiBvdXRlckhUTUwuc3BsaXQoaW5uZXJIVE1MKVswXSB8fCBudWxsO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTFZpZXdEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgX3Jhd19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEZsYWdzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYExWaWV3YCB1bnBhY2tlZCBpbnRvIGEgbW9yZSByZWFkYWJsZSBzdGF0ZS5cbiAgICovXG4gIGdldCBmbGFncygpIHtcbiAgICBjb25zdCBmbGFncyA9IHRoaXMuX3Jhd19sVmlld1tGTEFHU107XG4gICAgcmV0dXJuIHtcbiAgICAgIF9fcmF3X19mbGFnc19fOiBmbGFncyxcbiAgICAgIGluaXRQaGFzZVN0YXRlOiBmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrLFxuICAgICAgY3JlYXRpb25Nb2RlOiAhIShmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSxcbiAgICAgIGZpcnN0Vmlld1Bhc3M6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyksXG4gICAgICBjaGVja0Fsd2F5czogISEoZmxhZ3MgJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSxcbiAgICAgIGRpcnR5OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkpLFxuICAgICAgYXR0YWNoZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5BdHRhY2hlZCksXG4gICAgICBkZXN0cm95ZWQ6ICEhKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpLFxuICAgICAgaXNSb290OiAhIShmbGFncyAmIExWaWV3RmxhZ3MuSXNSb290KSxcbiAgICAgIGluZGV4V2l0aGluSW5pdFBoYXNlOiBmbGFncyA+PiBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlU2hpZnQsXG4gICAgfTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnfG51bGwgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbUEFSRU5UXSk7IH1cbiAgZ2V0IGhvc3QoKTogc3RyaW5nfG51bGwgeyByZXR1cm4gdG9IdG1sKHRoaXMuX3Jhd19sVmlld1tIT1NUXSwgdHJ1ZSk7IH1cbiAgZ2V0IGNvbnRleHQoKToge318bnVsbCB7IHJldHVybiB0aGlzLl9yYXdfbFZpZXdbQ09OVEVYVF07IH1cbiAgLyoqXG4gICAqIFRoZSB0cmVlIG9mIG5vZGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBgTFZpZXdgLiBUaGUgbm9kZXMgaGF2ZSBiZWVuIG5vcm1hbGl6ZWQgaW50byBhXG4gICAqIHRyZWUgc3RydWN0dXJlIHdpdGggcmVsZXZhbnQgZGV0YWlscyBwdWxsZWQgb3V0IGZvciByZWFkYWJpbGl0eS5cbiAgICovXG4gIGdldCBub2RlcygpOiBEZWJ1Z05vZGVbXXxudWxsIHtcbiAgICBjb25zdCBsVmlldyA9IHRoaXMuX3Jhd19sVmlldztcbiAgICBjb25zdCB0Tm9kZSA9IGxWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICAgIHJldHVybiB0b0RlYnVnTm9kZXModE5vZGUsIGxWaWV3KTtcbiAgfVxuICAvKipcbiAgICogQWRkaXRpb25hbCBpbmZvcm1hdGlvbiB3aGljaCBpcyBoaWRkZW4gYmVoaW5kIGEgcHJvcGVydHkuIFRoZSBleHRyYSBsZXZlbCBvZiBpbmRpcmVjdGlvbiBpc1xuICAgKiBkb25lIHNvIHRoYXQgdGhlIGRlYnVnIHZpZXcgd291bGQgbm90IGJlIGNsdXR0ZXJlZCB3aXRoIHByb3BlcnRpZXMgd2hpY2ggYXJlIG9ubHkgcmFyZWx5XG4gICAqIHJlbGV2YW50IHRvIHRoZSBkZXZlbG9wZXIuXG4gICAqL1xuICBnZXQgX19vdGhlcl9fKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0VmlldzogdGhpcy5fcmF3X2xWaWV3W1RWSUVXXSxcbiAgICAgIGNsZWFudXA6IHRoaXMuX3Jhd19sVmlld1tDTEVBTlVQXSxcbiAgICAgIGluamVjdG9yOiB0aGlzLl9yYXdfbFZpZXdbSU5KRUNUT1JdLFxuICAgICAgcmVuZGVyZXJGYWN0b3J5OiB0aGlzLl9yYXdfbFZpZXdbUkVOREVSRVJfRkFDVE9SWV0sXG4gICAgICByZW5kZXJlcjogdGhpcy5fcmF3X2xWaWV3W1JFTkRFUkVSXSxcbiAgICAgIHNhbml0aXplcjogdGhpcy5fcmF3X2xWaWV3W1NBTklUSVpFUl0sXG4gICAgICBjaGlsZEhlYWQ6IHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W0NISUxEX0hFQURdKSxcbiAgICAgIG5leHQ6IHRvRGVidWcodGhpcy5fcmF3X2xWaWV3W05FWFRdKSxcbiAgICAgIGNoaWxkVGFpbDogdG9EZWJ1Zyh0aGlzLl9yYXdfbFZpZXdbQ0hJTERfVEFJTF0pLFxuICAgICAgZGVjbGFyYXRpb25WaWV3OiB0b0RlYnVnKHRoaXMuX3Jhd19sVmlld1tERUNMQVJBVElPTl9WSUVXXSksXG4gICAgICBjb250ZW50UXVlcmllczogdGhpcy5fcmF3X2xWaWV3W0NPTlRFTlRfUVVFUklFU10sXG4gICAgICBxdWVyaWVzOiB0aGlzLl9yYXdfbFZpZXdbUVVFUklFU10sXG4gICAgICB0SG9zdDogdGhpcy5fcmF3X2xWaWV3W1RfSE9TVF0sXG4gICAgICBiaW5kaW5nSW5kZXg6IHRoaXMuX3Jhd19sVmlld1tCSU5ESU5HX0lOREVYXSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZWQgdmlldyBvZiBjaGlsZCB2aWV3cyAoYW5kIGNvbnRhaW5lcnMpIGF0dGFjaGVkIGF0IHRoaXMgbG9jYXRpb24uXG4gICAqL1xuICBnZXQgY2hpbGRWaWV3cygpOiBBcnJheTxMVmlld0RlYnVnfExDb250YWluZXJEZWJ1Zz4ge1xuICAgIGNvbnN0IGNoaWxkVmlld3M6IEFycmF5PExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnPiA9IFtdO1xuICAgIGxldCBjaGlsZCA9IHRoaXMuX19vdGhlcl9fLmNoaWxkSGVhZDtcbiAgICB3aGlsZSAoY2hpbGQpIHtcbiAgICAgIGNoaWxkVmlld3MucHVzaChjaGlsZCk7XG4gICAgICBjaGlsZCA9IGNoaWxkLl9fb3RoZXJfXy5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRWaWV3cztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIGh0bWw6IHN0cmluZ3xudWxsO1xuICBuYXRpdmU6IE5vZGU7XG4gIHN0eWxlczogRGVidWdOZXdTdHlsaW5nfG51bGw7XG4gIGNsYXNzZXM6IERlYnVnTmV3U3R5bGluZ3xudWxsO1xuICBub2RlczogRGVidWdOb2RlW118bnVsbDtcbiAgY29tcG9uZW50OiBMVmlld0RlYnVnfG51bGw7XG59XG5cbi8qKlxuICogVHVybnMgYSBmbGF0IGxpc3Qgb2Ygbm9kZXMgaW50byBhIHRyZWUgYnkgd2Fsa2luZyB0aGUgYXNzb2NpYXRlZCBgVE5vZGVgIHRyZWUuXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRGVidWdOb2Rlcyh0Tm9kZTogVE5vZGUgfCBudWxsLCBsVmlldzogTFZpZXcpOiBEZWJ1Z05vZGVbXXxudWxsIHtcbiAgaWYgKHROb2RlKSB7XG4gICAgY29uc3QgZGVidWdOb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBsZXQgdE5vZGVDdXJzb3I6IFROb2RlfG51bGwgPSB0Tm9kZTtcbiAgICB3aGlsZSAodE5vZGVDdXJzb3IpIHtcbiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgICAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUocmF3VmFsdWUpO1xuICAgICAgY29uc3QgY29tcG9uZW50TFZpZXdEZWJ1ZyA9XG4gICAgICAgICAgaXNTdHlsaW5nQ29udGV4dChyYXdWYWx1ZSkgPyBudWxsIDogdG9EZWJ1ZyhyZWFkTFZpZXdWYWx1ZShyYXdWYWx1ZSkpO1xuXG4gICAgICBsZXQgc3R5bGVzOiBEZWJ1Z05ld1N0eWxpbmd8bnVsbCA9IG51bGw7XG4gICAgICBsZXQgY2xhc3NlczogRGVidWdOZXdTdHlsaW5nfG51bGwgPSBudWxsO1xuICAgICAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgICAgIHN0eWxlcyA9IHROb2RlLm5ld1N0eWxlcyA/IG5ldyBOb2RlU3R5bGluZ0RlYnVnKHROb2RlLm5ld1N0eWxlcywgbFZpZXcsIGZhbHNlKSA6IG51bGw7XG4gICAgICAgIGNsYXNzZXMgPSB0Tm9kZS5uZXdDbGFzc2VzID8gbmV3IE5vZGVTdHlsaW5nRGVidWcodE5vZGUubmV3Q2xhc3NlcywgbFZpZXcsIHRydWUpIDogbnVsbDtcbiAgICAgIH1cblxuICAgICAgZGVidWdOb2Rlcy5wdXNoKHtcbiAgICAgICAgaHRtbDogdG9IdG1sKG5hdGl2ZSksXG4gICAgICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSwgc3R5bGVzLCBjbGFzc2VzLFxuICAgICAgICBub2RlczogdG9EZWJ1Z05vZGVzKHROb2RlLmNoaWxkLCBsVmlldyksXG4gICAgICAgIGNvbXBvbmVudDogY29tcG9uZW50TFZpZXdEZWJ1ZyxcbiAgICAgIH0pO1xuICAgICAgdE5vZGVDdXJzb3IgPSB0Tm9kZUN1cnNvci5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gZGVidWdOb2RlcztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTENvbnRhaW5lckRlYnVnIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBfcmF3X2xDb250YWluZXI6IExDb250YWluZXIpIHt9XG5cbiAgZ2V0IGFjdGl2ZUluZGV4KCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdOyB9XG4gIGdldCB2aWV3cygpOiBMVmlld0RlYnVnW10ge1xuICAgIHJldHVybiB0aGlzLl9yYXdfbENvbnRhaW5lci5zbGljZShDT05UQUlORVJfSEVBREVSX09GRlNFVClcbiAgICAgICAgLm1hcCh0b0RlYnVnIGFzKGw6IExWaWV3KSA9PiBMVmlld0RlYnVnKTtcbiAgfVxuICBnZXQgcGFyZW50KCk6IExWaWV3RGVidWd8TENvbnRhaW5lckRlYnVnfG51bGwgeyByZXR1cm4gdG9EZWJ1Zyh0aGlzLl9yYXdfbENvbnRhaW5lcltQQVJFTlRdKTsgfVxuICBnZXQgcXVlcmllcygpOiBMUXVlcmllc3xudWxsIHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW1FVRVJJRVNdOyB9XG4gIGdldCBob3N0KCk6IFJFbGVtZW50fFJDb21tZW50fFN0eWxpbmdDb250ZXh0fExWaWV3IHsgcmV0dXJuIHRoaXMuX3Jhd19sQ29udGFpbmVyW0hPU1RdOyB9XG4gIGdldCBuYXRpdmUoKTogUkNvbW1lbnQgeyByZXR1cm4gdGhpcy5fcmF3X2xDb250YWluZXJbTkFUSVZFXTsgfVxuICBnZXQgX19vdGhlcl9fKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuZXh0OiB0b0RlYnVnKHRoaXMuX3Jhd19sQ29udGFpbmVyW05FWFRdKSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGBMVmlld2AgdmFsdWUgaWYgZm91bmQuXG4gKlxuICogQHBhcmFtIHZhbHVlIGBMVmlld2AgaWYgYW55XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkTFZpZXdWYWx1ZSh2YWx1ZTogYW55KTogTFZpZXd8bnVsbCB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFRoaXMgY2hlY2sgaXMgbm90IHF1aXRlIHJpZ2h0LCBhcyBpdCBkb2VzIG5vdCB0YWtlIGludG8gYWNjb3VudCBgU3R5bGluZ0NvbnRleHRgXG4gICAgLy8gVGhpcyBpcyB3aHkgaXQgaXMgaW4gZGVidWcsIG5vdCBpbiB1dGlsLnRzXG4gICAgaWYgKHZhbHVlLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUIC0gMSkgcmV0dXJuIHZhbHVlIGFzIExWaWV3O1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBJMThORGVidWdJdGVtIHtcbiAgW2tleTogc3RyaW5nXTogYW55O1xuXG4gIGdldCB0Tm9kZSgpIHsgcmV0dXJuIGdldFROb2RlKHRoaXMubm9kZUluZGV4LCB0aGlzLl9sVmlldyk7IH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBfX3Jhd19vcENvZGU6IGFueSwgcHJpdmF0ZSBfbFZpZXc6IExWaWV3LCBwdWJsaWMgbm9kZUluZGV4OiBudW1iZXIsXG4gICAgICBwdWJsaWMgdHlwZTogc3RyaW5nKSB7fVxufVxuXG4vKipcbiAqIFR1cm5zIGEgbGlzdCBvZiBcIkNyZWF0ZVwiICYgXCJVcGRhdGVcIiBPcENvZGVzIGludG8gYSBodW1hbi1yZWFkYWJsZSBsaXN0IG9mIG9wZXJhdGlvbnMgZm9yXG4gKiBkZWJ1Z2dpbmcgcHVycG9zZXMuXG4gKiBAcGFyYW0gbXV0YXRlT3BDb2RlcyBtdXRhdGlvbiBvcENvZGVzIHRvIHJlYWRcbiAqIEBwYXJhbSB1cGRhdGVPcENvZGVzIHVwZGF0ZSBvcENvZGVzIHRvIHJlYWRcbiAqIEBwYXJhbSBpY3VzIGxpc3Qgb2YgSUNVIGV4cHJlc3Npb25zXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdGhlIG9wQ29kZXMgYXJlIGFjdGluZyBvblxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoSTE4bk9wQ29kZXNEZWJ1ZyhcbiAgICBtdXRhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXSB8IG51bGwsXG4gICAgbFZpZXc6IExWaWV3KSB7XG4gIGF0dGFjaERlYnVnT2JqZWN0KG11dGF0ZU9wQ29kZXMsIG5ldyBJMThuTXV0YXRlT3BDb2Rlc0RlYnVnKG11dGF0ZU9wQ29kZXMsIGxWaWV3KSk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KHVwZGF0ZU9wQ29kZXMsIG5ldyBJMThuVXBkYXRlT3BDb2Rlc0RlYnVnKHVwZGF0ZU9wQ29kZXMsIGljdXMsIGxWaWV3KSk7XG5cbiAgaWYgKGljdXMpIHtcbiAgICBpY3VzLmZvckVhY2goaWN1ID0+IHtcbiAgICAgIGljdS5jcmVhdGUuZm9yRWFjaChcbiAgICAgICAgICBpY3VDYXNlID0+IHsgYXR0YWNoRGVidWdPYmplY3QoaWN1Q2FzZSwgbmV3IEkxOG5NdXRhdGVPcENvZGVzRGVidWcoaWN1Q2FzZSwgbFZpZXcpKTsgfSk7XG4gICAgICBpY3UudXBkYXRlLmZvckVhY2goaWN1Q2FzZSA9PiB7XG4gICAgICAgIGF0dGFjaERlYnVnT2JqZWN0KGljdUNhc2UsIG5ldyBJMThuVXBkYXRlT3BDb2Rlc0RlYnVnKGljdUNhc2UsIGljdXMsIGxWaWV3KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSTE4bk11dGF0ZU9wQ29kZXNEZWJ1ZyBpbXBsZW1lbnRzIEkxOG5PcENvZGVzRGVidWcge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IF9fcmF3X29wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCBwcml2YXRlIHJlYWRvbmx5IF9fbFZpZXc6IExWaWV3KSB7fVxuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2Ygb3BlcmF0aW9uIGluZm9ybWF0aW9uIGFib3V0IGhvdyB0aGUgT3BDb2RlcyB3aWxsIGFjdCBvbiB0aGUgdmlldy5cbiAgICovXG4gIGdldCBvcGVyYXRpb25zKCkge1xuICAgIGNvbnN0IHtfX2xWaWV3LCBfX3Jhd19vcENvZGVzfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgX19yYXdfb3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgb3BDb2RlID0gX19yYXdfb3BDb2Rlc1tpXTtcbiAgICAgIGxldCByZXN1bHQ6IGFueTtcbiAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgdHlwZTogJ0NyZWF0ZSBUZXh0IE5vZGUnLFxuICAgICAgICAgIG5vZGVJbmRleDogX19yYXdfb3BDb2Rlc1srK2ldLFxuICAgICAgICAgIHRleHQ6IG9wQ29kZSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZDpcbiAgICAgICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uTm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVDtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgZGVzdGluYXRpb25Ob2RlSW5kZXgsICdBcHBlbmRDaGlsZCcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdDpcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICByZXN1bHQgPSBuZXcgSTE4TkRlYnVnSXRlbShvcENvZGUsIF9fbFZpZXcsIG5vZGVJbmRleCwgJ1NlbGVjdCcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQ6XG4gICAgICAgICAgICBsZXQgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgZWxlbWVudEluZGV4LCAnRWxlbWVudEVuZCcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgICBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBlbGVtZW50SW5kZXgsICdBdHRyJyk7XG4gICAgICAgICAgICByZXN1bHRbJ2F0dHJOYW1lJ10gPSBfX3Jhd19vcENvZGVzWysraV07XG4gICAgICAgICAgICByZXN1bHRbJ2F0dHJWYWx1ZSddID0gX19yYXdfb3BDb2Rlc1srK2ldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgICAgICBjYXNlIENPTU1FTlRfTUFSS0VSOlxuICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICAgICAgdHlwZTogJ0NPTU1FTlRfTUFSS0VSJyxcbiAgICAgICAgICAgICAgY29tbWVudFZhbHVlOiBfX3Jhd19vcENvZGVzWysraV0sXG4gICAgICAgICAgICAgIG5vZGVJbmRleDogX19yYXdfb3BDb2Rlc1srK2ldLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRUxFTUVOVF9NQVJLRVI6XG4gICAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICAgIF9fcmF3X29wQ29kZTogb3BDb2RlLFxuICAgICAgICAgICAgICB0eXBlOiAnRUxFTUVOVF9NQVJLRVInLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBfX3Jhd19vcENvZGU6IG9wQ29kZSxcbiAgICAgICAgICB0eXBlOiAnVW5rbm93biBPcCBDb2RlJyxcbiAgICAgICAgICBjb2RlOiBvcENvZGUsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJMThuVXBkYXRlT3BDb2Rlc0RlYnVnIGltcGxlbWVudHMgSTE4bk9wQ29kZXNEZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBfX3Jhd19vcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgcHJpdmF0ZSByZWFkb25seSBpY3VzOiBUSWN1W118bnVsbCxcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgX19sVmlldzogTFZpZXcpIHt9XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBvcGVyYXRpb24gaW5mb3JtYXRpb24gYWJvdXQgaG93IHRoZSBPcENvZGVzIHdpbGwgYWN0IG9uIHRoZSB2aWV3LlxuICAgKi9cbiAgZ2V0IG9wZXJhdGlvbnMoKSB7XG4gICAgY29uc3Qge19fbFZpZXcsIF9fcmF3X29wQ29kZXMsIGljdXN9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHRzOiBhbnlbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBfX3Jhd19vcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBiaXQgY29kZSB0byBjaGVjayBpZiB3ZSBzaG91bGQgYXBwbHkgdGhlIG5leHQgdXBkYXRlXG4gICAgICBjb25zdCBjaGVja0JpdCA9IF9fcmF3X29wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgICAgLy8gTnVtYmVyIG9mIG9wQ29kZXMgdG8gc2tpcCB1bnRpbCBuZXh0IHNldCBvZiB1cGRhdGUgY29kZXNcbiAgICAgIGNvbnN0IHNraXBDb2RlcyA9IF9fcmF3X29wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICBsZXQgdmFsdWUgPSAnJztcbiAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8PSAoaSArIHNraXBDb2Rlcyk7IGorKykge1xuICAgICAgICBjb25zdCBvcENvZGUgPSBfX3Jhd19vcENvZGVzW2pdO1xuICAgICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSArPSBvcENvZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgYmluZGluZyBpbmRleCB3aG9zZSB2YWx1ZSBpcyBuZWdhdGl2ZVxuICAgICAgICAgICAgLy8gV2UgY2Fubm90IGtub3cgdGhlIHZhbHVlIG9mIHRoZSBiaW5kaW5nIHNvIHdlIG9ubHkgc2hvdyB0aGUgaW5kZXhcbiAgICAgICAgICAgIHZhbHVlICs9IGDvv70key1vcENvZGUgLSAxfe+/vWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICBsZXQgdEljdUluZGV4OiBudW1iZXI7XG4gICAgICAgICAgICBsZXQgdEljdTogVEljdTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IF9fcmF3X29wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IF9fcmF3X29wQ29kZXNbKytqXTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgICAgICBjaGVja0JpdCxcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdBdHRyJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJWYWx1ZTogdmFsdWUsIGF0dHJOYW1lLCBzYW5pdGl6ZUZuLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuVGV4dDpcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgX19yYXdfb3BDb2RlOiBvcENvZGUsXG4gICAgICAgICAgICAgICAgICBjaGVja0JpdCxcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdUZXh0Jywgbm9kZUluZGV4LFxuICAgICAgICAgICAgICAgICAgdGV4dDogdmFsdWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IG5ldyBJMThORGVidWdJdGVtKG9wQ29kZSwgX19sVmlldywgbm9kZUluZGV4LCAnSWN1U3dpdGNoJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0Wyd0SWN1SW5kZXgnXSA9IHRJY3VJbmRleDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ2NoZWNrQml0J10gPSBjaGVja0JpdDtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ21haW5CaW5kaW5nJ10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3UnXSA9IHRJY3U7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gX19yYXdfb3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IEkxOE5EZWJ1Z0l0ZW0ob3BDb2RlLCBfX2xWaWV3LCBub2RlSW5kZXgsICdJY3VVcGRhdGUnKTtcbiAgICAgICAgICAgICAgICByZXN1bHRbJ3RJY3VJbmRleCddID0gdEljdUluZGV4O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsnY2hlY2tCaXQnXSA9IGNoZWNrQml0O1xuICAgICAgICAgICAgICAgIHJlc3VsdFsndEljdSddID0gdEljdTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGkgKz0gc2tpcENvZGVzO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEkxOG5PcENvZGVzRGVidWcgeyBvcGVyYXRpb25zOiBhbnlbXTsgfVxuIl19