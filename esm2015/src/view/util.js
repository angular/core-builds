/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WrappedValue, devModeEqual } from '../change_detection/change_detection';
import { SOURCE } from '../di/injector';
import { ViewEncapsulation } from '../metadata/view';
import { looseIdentical } from '../util/comparison';
import { stringify } from '../util/stringify';
import { expressionChangedAfterItHasBeenCheckedError } from './errors';
import { Services, asElementData, asTextData } from './types';
/** @type {?} */
export const NOOP = () => { };
/** @type {?} */
const _tokenKeyCache = new Map();
/**
 * @param {?} token
 * @return {?}
 */
export function tokenKey(token) {
    /** @type {?} */
    let key = _tokenKeyCache.get(token);
    if (!key) {
        key = stringify(token) + '_' + _tokenKeyCache.size;
        _tokenKeyCache.set(token, key);
    }
    return key;
}
/**
 * @param {?} view
 * @param {?} nodeIdx
 * @param {?} bindingIdx
 * @param {?} value
 * @return {?}
 */
export function unwrapValue(view, nodeIdx, bindingIdx, value) {
    if (WrappedValue.isWrapped(value)) {
        value = WrappedValue.unwrap(value);
        /** @type {?} */
        const globalBindingIdx = view.def.nodes[nodeIdx].bindingIndex + bindingIdx;
        /** @type {?} */
        const oldValue = WrappedValue.unwrap(view.oldValues[globalBindingIdx]);
        view.oldValues[globalBindingIdx] = new WrappedValue(oldValue);
    }
    return value;
}
/** @type {?} */
const UNDEFINED_RENDERER_TYPE_ID = '$$undefined';
/** @type {?} */
const EMPTY_RENDERER_TYPE_ID = '$$empty';
// Attention: this function is called as top level function.
// Putting any logic in here will destroy closure tree shaking!
/**
 * @param {?} values
 * @return {?}
 */
export function createRendererType2(values) {
    return {
        id: UNDEFINED_RENDERER_TYPE_ID,
        styles: values.styles,
        encapsulation: values.encapsulation,
        data: values.data
    };
}
/** @type {?} */
let _renderCompCount = 0;
/**
 * @param {?=} type
 * @return {?}
 */
export function resolveRendererType2(type) {
    if (type && type.id === UNDEFINED_RENDERER_TYPE_ID) {
        // first time we see this RendererType2. Initialize it...
        /** @type {?} */
        const isFilled = ((type.encapsulation != null && type.encapsulation !== ViewEncapsulation.None) ||
            type.styles.length || Object.keys(type.data).length);
        if (isFilled) {
            type.id = `c${_renderCompCount++}`;
        }
        else {
            type.id = EMPTY_RENDERER_TYPE_ID;
        }
    }
    if (type && type.id === EMPTY_RENDERER_TYPE_ID) {
        type = null;
    }
    return type || null;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} bindingIdx
 * @param {?} value
 * @return {?}
 */
export function checkBinding(view, def, bindingIdx, value) {
    /** @type {?} */
    const oldValues = view.oldValues;
    if ((view.state & 2 /* FirstCheck */) ||
        !looseIdentical(oldValues[def.bindingIndex + bindingIdx], value)) {
        return true;
    }
    return false;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} bindingIdx
 * @param {?} value
 * @return {?}
 */
export function checkAndUpdateBinding(view, def, bindingIdx, value) {
    if (checkBinding(view, def, bindingIdx, value)) {
        view.oldValues[def.bindingIndex + bindingIdx] = value;
        return true;
    }
    return false;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} bindingIdx
 * @param {?} value
 * @return {?}
 */
export function checkBindingNoChanges(view, def, bindingIdx, value) {
    /** @type {?} */
    const oldValue = view.oldValues[def.bindingIndex + bindingIdx];
    if ((view.state & 1 /* BeforeFirstCheck */) || !devModeEqual(oldValue, value)) {
        /** @type {?} */
        const bindingName = def.bindings[bindingIdx].name;
        throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, def.nodeIndex), `${bindingName}: ${oldValue}`, `${bindingName}: ${value}`, (view.state & 1 /* BeforeFirstCheck */) !== 0);
    }
}
/**
 * @param {?} view
 * @return {?}
 */
export function markParentViewsForCheck(view) {
    /** @type {?} */
    let currView = view;
    while (currView) {
        if (currView.def.flags & 2 /* OnPush */) {
            currView.state |= 8 /* ChecksEnabled */;
        }
        currView = currView.viewContainerParent || currView.parent;
    }
}
/**
 * @param {?} view
 * @param {?} endView
 * @return {?}
 */
export function markParentViewsForCheckProjectedViews(view, endView) {
    /** @type {?} */
    let currView = view;
    while (currView && currView !== endView) {
        currView.state |= 64 /* CheckProjectedViews */;
        currView = currView.viewContainerParent || currView.parent;
    }
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @param {?} eventName
 * @param {?} event
 * @return {?}
 */
export function dispatchEvent(view, nodeIndex, eventName, event) {
    try {
        /** @type {?} */
        const nodeDef = view.def.nodes[nodeIndex];
        /** @type {?} */
        const startView = nodeDef.flags & 33554432 /* ComponentView */ ?
            asElementData(view, nodeIndex).componentView :
            view;
        markParentViewsForCheck(startView);
        return Services.handleEvent(view, nodeIndex, eventName, event);
    }
    catch (e) {
        // Attention: Don't rethrow, as it would cancel Observable subscriptions!
        view.root.errorHandler.handleError(e);
    }
}
/**
 * @param {?} view
 * @return {?}
 */
export function declaredViewContainer(view) {
    if (view.parent) {
        /** @type {?} */
        const parentView = view.parent;
        return asElementData(parentView, (/** @type {?} */ (view.parentNodeDef)).nodeIndex);
    }
    return null;
}
/**
 * for component views, this is the host element.
 * for embedded views, this is the index of the parent node
 * that contains the view container.
 * @param {?} view
 * @return {?}
 */
export function viewParentEl(view) {
    /** @type {?} */
    const parentView = view.parent;
    if (parentView) {
        return (/** @type {?} */ (view.parentNodeDef)).parent;
    }
    else {
        return null;
    }
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function renderNode(view, def) {
    switch (def.flags & 201347067 /* Types */) {
        case 1 /* TypeElement */:
            return asElementData(view, def.nodeIndex).renderElement;
        case 2 /* TypeText */:
            return asTextData(view, def.nodeIndex).renderText;
    }
}
/**
 * @param {?} target
 * @param {?} name
 * @return {?}
 */
export function elementEventFullName(target, name) {
    return target ? `${target}:${name}` : name;
}
/**
 * @param {?} view
 * @return {?}
 */
export function isComponentView(view) {
    return !!view.parent && !!((/** @type {?} */ (view.parentNodeDef)).flags & 32768 /* Component */);
}
/**
 * @param {?} view
 * @return {?}
 */
export function isEmbeddedView(view) {
    return !!view.parent && !((/** @type {?} */ (view.parentNodeDef)).flags & 32768 /* Component */);
}
/**
 * @param {?} queryId
 * @return {?}
 */
export function filterQueryId(queryId) {
    return 1 << (queryId % 32);
}
/**
 * @param {?} matchedQueriesDsl
 * @return {?}
 */
export function splitMatchedQueriesDsl(matchedQueriesDsl) {
    /** @type {?} */
    const matchedQueries = {};
    /** @type {?} */
    let matchedQueryIds = 0;
    /** @type {?} */
    const references = {};
    if (matchedQueriesDsl) {
        matchedQueriesDsl.forEach(([queryId, valueType]) => {
            if (typeof queryId === 'number') {
                matchedQueries[queryId] = valueType;
                matchedQueryIds |= filterQueryId(queryId);
            }
            else {
                references[queryId] = valueType;
            }
        });
    }
    return { matchedQueries, references, matchedQueryIds };
}
/**
 * @param {?} deps
 * @param {?=} sourceName
 * @return {?}
 */
export function splitDepsDsl(deps, sourceName) {
    return deps.map(value => {
        /** @type {?} */
        let token;
        /** @type {?} */
        let flags;
        if (Array.isArray(value)) {
            [flags, token] = value;
        }
        else {
            flags = 0 /* None */;
            token = value;
        }
        if (token && (typeof token === 'function' || typeof token === 'object') && sourceName) {
            Object.defineProperty(token, SOURCE, { value: sourceName, configurable: true });
        }
        return { flags, token, tokenKey: tokenKey(token) };
    });
}
/**
 * @param {?} view
 * @param {?} renderHost
 * @param {?} def
 * @return {?}
 */
export function getParentRenderElement(view, renderHost, def) {
    /** @type {?} */
    let renderParent = def.renderParent;
    if (renderParent) {
        if ((renderParent.flags & 1 /* TypeElement */) === 0 ||
            (renderParent.flags & 33554432 /* ComponentView */) === 0 ||
            ((/** @type {?} */ (renderParent.element)).componentRendererType &&
                (/** @type {?} */ ((/** @type {?} */ (renderParent.element)).componentRendererType)).encapsulation ===
                    ViewEncapsulation.Native)) {
            // only children of non components, or children of components with native encapsulation should
            // be attached.
            return asElementData(view, (/** @type {?} */ (def.renderParent)).nodeIndex).renderElement;
        }
    }
    else {
        return renderHost;
    }
}
/** @type {?} */
const DEFINITION_CACHE = new WeakMap();
/**
 * @template D
 * @param {?} factory
 * @return {?}
 */
export function resolveDefinition(factory) {
    /** @type {?} */
    let value = (/** @type {?} */ ((/** @type {?} */ (DEFINITION_CACHE.get(factory)))));
    if (!value) {
        value = factory(() => NOOP);
        value.factory = factory;
        DEFINITION_CACHE.set(factory, value);
    }
    return value;
}
/**
 * @param {?} view
 * @return {?}
 */
export function rootRenderNodes(view) {
    /** @type {?} */
    const renderNodes = [];
    visitRootRenderNodes(view, 0 /* Collect */, undefined, undefined, renderNodes);
    return renderNodes;
}
/** @enum {number} */
const RenderNodeAction = {
    Collect: 0, AppendChild: 1, InsertBefore: 2, RemoveChild: 3,
};
export { RenderNodeAction };
/**
 * @param {?} view
 * @param {?} action
 * @param {?} parentNode
 * @param {?} nextSibling
 * @param {?=} target
 * @return {?}
 */
export function visitRootRenderNodes(view, action, parentNode, nextSibling, target) {
    // We need to re-compute the parent node in case the nodes have been moved around manually
    if (action === 3 /* RemoveChild */) {
        parentNode = view.renderer.parentNode(renderNode(view, (/** @type {?} */ (view.def.lastRenderRootNode))));
    }
    visitSiblingRenderNodes(view, action, 0, view.def.nodes.length - 1, parentNode, nextSibling, target);
}
/**
 * @param {?} view
 * @param {?} action
 * @param {?} startIndex
 * @param {?} endIndex
 * @param {?} parentNode
 * @param {?} nextSibling
 * @param {?=} target
 * @return {?}
 */
export function visitSiblingRenderNodes(view, action, startIndex, endIndex, parentNode, nextSibling, target) {
    for (let i = startIndex; i <= endIndex; i++) {
        /** @type {?} */
        const nodeDef = view.def.nodes[i];
        if (nodeDef.flags & (1 /* TypeElement */ | 2 /* TypeText */ | 8 /* TypeNgContent */)) {
            visitRenderNode(view, nodeDef, action, parentNode, nextSibling, target);
        }
        // jump to next sibling
        i += nodeDef.childCount;
    }
}
/**
 * @param {?} view
 * @param {?} ngContentIndex
 * @param {?} action
 * @param {?} parentNode
 * @param {?} nextSibling
 * @param {?=} target
 * @return {?}
 */
export function visitProjectedRenderNodes(view, ngContentIndex, action, parentNode, nextSibling, target) {
    /** @type {?} */
    let compView = view;
    while (compView && !isComponentView(compView)) {
        compView = compView.parent;
    }
    /** @type {?} */
    const hostView = (/** @type {?} */ (compView)).parent;
    /** @type {?} */
    const hostElDef = viewParentEl((/** @type {?} */ (compView)));
    /** @type {?} */
    const startIndex = (/** @type {?} */ (hostElDef)).nodeIndex + 1;
    /** @type {?} */
    const endIndex = (/** @type {?} */ (hostElDef)).nodeIndex + (/** @type {?} */ (hostElDef)).childCount;
    for (let i = startIndex; i <= endIndex; i++) {
        /** @type {?} */
        const nodeDef = (/** @type {?} */ (hostView)).def.nodes[i];
        if (nodeDef.ngContentIndex === ngContentIndex) {
            visitRenderNode((/** @type {?} */ (hostView)), nodeDef, action, parentNode, nextSibling, target);
        }
        // jump to next sibling
        i += nodeDef.childCount;
    }
    if (!(/** @type {?} */ (hostView)).parent) {
        // a root view
        /** @type {?} */
        const projectedNodes = view.root.projectableNodes[ngContentIndex];
        if (projectedNodes) {
            for (let i = 0; i < projectedNodes.length; i++) {
                execRenderNodeAction(view, projectedNodes[i], action, parentNode, nextSibling, target);
            }
        }
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} action
 * @param {?} parentNode
 * @param {?} nextSibling
 * @param {?=} target
 * @return {?}
 */
function visitRenderNode(view, nodeDef, action, parentNode, nextSibling, target) {
    if (nodeDef.flags & 8 /* TypeNgContent */) {
        visitProjectedRenderNodes(view, (/** @type {?} */ (nodeDef.ngContent)).index, action, parentNode, nextSibling, target);
    }
    else {
        /** @type {?} */
        const rn = renderNode(view, nodeDef);
        if (action === 3 /* RemoveChild */ && (nodeDef.flags & 33554432 /* ComponentView */) &&
            (nodeDef.bindingFlags & 48 /* CatSyntheticProperty */)) {
            // Note: we might need to do both actions.
            if (nodeDef.bindingFlags & (16 /* SyntheticProperty */)) {
                execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
            }
            if (nodeDef.bindingFlags & (32 /* SyntheticHostProperty */)) {
                /** @type {?} */
                const compView = asElementData(view, nodeDef.nodeIndex).componentView;
                execRenderNodeAction(compView, rn, action, parentNode, nextSibling, target);
            }
        }
        else {
            execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
        }
        if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
            /** @type {?} */
            const embeddedViews = (/** @type {?} */ (asElementData(view, nodeDef.nodeIndex).viewContainer))._embeddedViews;
            for (let k = 0; k < embeddedViews.length; k++) {
                visitRootRenderNodes(embeddedViews[k], action, parentNode, nextSibling, target);
            }
        }
        if (nodeDef.flags & 1 /* TypeElement */ && !(/** @type {?} */ (nodeDef.element)).name) {
            visitSiblingRenderNodes(view, action, nodeDef.nodeIndex + 1, nodeDef.nodeIndex + nodeDef.childCount, parentNode, nextSibling, target);
        }
    }
}
/**
 * @param {?} view
 * @param {?} renderNode
 * @param {?} action
 * @param {?} parentNode
 * @param {?} nextSibling
 * @param {?=} target
 * @return {?}
 */
function execRenderNodeAction(view, renderNode, action, parentNode, nextSibling, target) {
    /** @type {?} */
    const renderer = view.renderer;
    switch (action) {
        case 1 /* AppendChild */:
            renderer.appendChild(parentNode, renderNode);
            break;
        case 2 /* InsertBefore */:
            renderer.insertBefore(parentNode, renderNode, nextSibling);
            break;
        case 3 /* RemoveChild */:
            renderer.removeChild(parentNode, renderNode);
            break;
        case 0 /* Collect */:
            (/** @type {?} */ (target)).push(renderNode);
            break;
    }
}
/** @type {?} */
const NS_PREFIX_RE = /^:([^:]+):(.+)$/;
/**
 * @param {?} name
 * @return {?}
 */
export function splitNamespace(name) {
    if (name[0] === ':') {
        /** @type {?} */
        const match = (/** @type {?} */ (name.match(NS_PREFIX_RE)));
        return [match[1], match[2]];
    }
    return ['', name];
}
/**
 * @param {?} bindings
 * @return {?}
 */
export function calcBindingFlags(bindings) {
    /** @type {?} */
    let flags = 0;
    for (let i = 0; i < bindings.length; i++) {
        flags |= bindings[i].flags;
    }
    return flags;
}
/**
 * @param {?} valueCount
 * @param {?} constAndInterp
 * @return {?}
 */
export function interpolate(valueCount, constAndInterp) {
    /** @type {?} */
    let result = '';
    for (let i = 0; i < valueCount * 2; i = i + 2) {
        result = result + constAndInterp[i] + _toStringWithNull(constAndInterp[i + 1]);
    }
    return result + constAndInterp[valueCount * 2];
}
/**
 * @param {?} valueCount
 * @param {?} c0
 * @param {?} a1
 * @param {?} c1
 * @param {?=} a2
 * @param {?=} c2
 * @param {?=} a3
 * @param {?=} c3
 * @param {?=} a4
 * @param {?=} c4
 * @param {?=} a5
 * @param {?=} c5
 * @param {?=} a6
 * @param {?=} c6
 * @param {?=} a7
 * @param {?=} c7
 * @param {?=} a8
 * @param {?=} c8
 * @param {?=} a9
 * @param {?=} c9
 * @return {?}
 */
export function inlineInterpolate(valueCount, c0, a1, c1, a2, c2, a3, c3, a4, c4, a5, c5, a6, c6, a7, c7, a8, c8, a9, c9) {
    switch (valueCount) {
        case 1:
            return c0 + _toStringWithNull(a1) + c1;
        case 2:
            return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2;
        case 3:
            return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                c3;
        case 4:
            return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                c3 + _toStringWithNull(a4) + c4;
        case 5:
            return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5;
        case 6:
            return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) + c6;
        case 7:
            return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
                c6 + _toStringWithNull(a7) + c7;
        case 8:
            return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
                c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8;
        case 9:
            return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
                c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
                c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8 + _toStringWithNull(a9) + c9;
        default:
            throw new Error(`Does not support more than 9 expressions`);
    }
}
/**
 * @param {?} v
 * @return {?}
 */
function _toStringWithNull(v) {
    return v != null ? v.toString() : '';
}
/** @type {?} */
export const EMPTY_ARRAY = [];
/** @type {?} */
export const EMPTY_MAP = {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUUsWUFBWSxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDaEYsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRW5ELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUMsT0FBTyxFQUFDLDJDQUEyQyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBNkgsUUFBUSxFQUF5RSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sU0FBUyxDQUFDOztBQUUvUCxNQUFNLE9BQU8sSUFBSSxHQUFRLEdBQUcsRUFBRSxHQUFFLENBQUM7O01BRTNCLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBZTs7Ozs7QUFFN0MsTUFBTSxVQUFVLFFBQVEsQ0FBQyxLQUFVOztRQUM3QixHQUFHLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7SUFDbkMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNSLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUM7UUFDbkQsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDaEM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7Ozs7Ozs7O0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxJQUFjLEVBQUUsT0FBZSxFQUFFLFVBQWtCLEVBQUUsS0FBVTtJQUN6RixJQUFJ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LE1BQU0sT0FBTyxXQUFXLEdBQVUsRUFBRTs7QUFDcEMsTUFBTSxPQUFPLFNBQVMsR0FBeUIsRUFBRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtXcmFwcGVkVmFsdWUsIGRldk1vZGVFcXVhbH0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7U09VUkNFfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7UmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge2xvb3NlSWRlbnRpY2FsfSBmcm9tICcuLi91dGlsL2NvbXBhcmlzb24nO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7ZXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtCaW5kaW5nRGVmLCBCaW5kaW5nRmxhZ3MsIERlZmluaXRpb24sIERlZmluaXRpb25GYWN0b3J5LCBEZXBEZWYsIERlcEZsYWdzLCBFbGVtZW50RGF0YSwgTm9kZURlZiwgTm9kZUZsYWdzLCBRdWVyeVZhbHVlVHlwZSwgU2VydmljZXMsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbiwgVmlld0RlZmluaXRpb25GYWN0b3J5LCBWaWV3RmxhZ3MsIFZpZXdTdGF0ZSwgYXNFbGVtZW50RGF0YSwgYXNUZXh0RGF0YX0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBjb25zdCBOT09QOiBhbnkgPSAoKSA9PiB7fTtcblxuY29uc3QgX3Rva2VuS2V5Q2FjaGUgPSBuZXcgTWFwPGFueSwgc3RyaW5nPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5LZXkodG9rZW46IGFueSk6IHN0cmluZyB7XG4gIGxldCBrZXkgPSBfdG9rZW5LZXlDYWNoZS5nZXQodG9rZW4pO1xuICBpZiAoIWtleSkge1xuICAgIGtleSA9IHN0cmluZ2lmeSh0b2tlbikgKyAnXycgKyBfdG9rZW5LZXlDYWNoZS5zaXplO1xuICAgIF90b2tlbktleUNhY2hlLnNldCh0b2tlbiwga2V5KTtcbiAgfVxuICByZXR1cm4ga2V5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwVmFsdWUodmlldzogVmlld0RhdGEsIG5vZGVJZHg6IG51bWJlciwgYmluZGluZ0lkeDogbnVtYmVyLCB2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKFdyYXBwZWRWYWx1ZS5pc1dyYXBwZWQodmFsdWUpKSB7XG4gICAgdmFsdWUgPSBXcmFwcGVkVmFsdWUudW53cmFwKHZhbHVlKTtcbiAgICBjb25zdCBnbG9iYWxCaW5kaW5nSWR4ID0gdmlldy5kZWYubm9kZXNbbm9kZUlkeF0uYmluZGluZ0luZGV4ICsgYmluZGluZ0lkeDtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IFdyYXBwZWRWYWx1ZS51bndyYXAodmlldy5vbGRWYWx1ZXNbZ2xvYmFsQmluZGluZ0lkeF0pO1xuICAgIHZpZXcub2xkVmFsdWVzW2dsb2JhbEJpbmRpbmdJZHhdID0gbmV3IFdyYXBwZWRWYWx1ZShvbGRWYWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5jb25zdCBVTkRFRklORURfUkVOREVSRVJfVFlQRV9JRCA9ICckJHVuZGVmaW5lZCc7XG5jb25zdCBFTVBUWV9SRU5ERVJFUl9UWVBFX0lEID0gJyQkZW1wdHknO1xuXG4vLyBBdHRlbnRpb246IHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGFzIHRvcCBsZXZlbCBmdW5jdGlvbi5cbi8vIFB1dHRpbmcgYW55IGxvZ2ljIGluIGhlcmUgd2lsbCBkZXN0cm95IGNsb3N1cmUgdHJlZSBzaGFraW5nIVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlbmRlcmVyVHlwZTIodmFsdWVzOiB7XG4gIHN0eWxlczogKHN0cmluZyB8IGFueVtdKVtdLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbixcbiAgZGF0YToge1traW5kOiBzdHJpbmddOiBhbnlbXX1cbn0pOiBSZW5kZXJlclR5cGUyIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogVU5ERUZJTkVEX1JFTkRFUkVSX1RZUEVfSUQsXG4gICAgc3R5bGVzOiB2YWx1ZXMuc3R5bGVzLFxuICAgIGVuY2Fwc3VsYXRpb246IHZhbHVlcy5lbmNhcHN1bGF0aW9uLFxuICAgIGRhdGE6IHZhbHVlcy5kYXRhXG4gIH07XG59XG5cbmxldCBfcmVuZGVyQ29tcENvdW50ID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVSZW5kZXJlclR5cGUyKHR5cGU/OiBSZW5kZXJlclR5cGUyIHwgbnVsbCk6IFJlbmRlcmVyVHlwZTJ8bnVsbCB7XG4gIGlmICh0eXBlICYmIHR5cGUuaWQgPT09IFVOREVGSU5FRF9SRU5ERVJFUl9UWVBFX0lEKSB7XG4gICAgLy8gZmlyc3QgdGltZSB3ZSBzZWUgdGhpcyBSZW5kZXJlclR5cGUyLiBJbml0aWFsaXplIGl0Li4uXG4gICAgY29uc3QgaXNGaWxsZWQgPVxuICAgICAgICAoKHR5cGUuZW5jYXBzdWxhdGlvbiAhPSBudWxsICYmIHR5cGUuZW5jYXBzdWxhdGlvbiAhPT0gVmlld0VuY2Fwc3VsYXRpb24uTm9uZSkgfHxcbiAgICAgICAgIHR5cGUuc3R5bGVzLmxlbmd0aCB8fCBPYmplY3Qua2V5cyh0eXBlLmRhdGEpLmxlbmd0aCk7XG4gICAgaWYgKGlzRmlsbGVkKSB7XG4gICAgICB0eXBlLmlkID0gYGMke19yZW5kZXJDb21wQ291bnQrK31gO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eXBlLmlkID0gRU1QVFlfUkVOREVSRVJfVFlQRV9JRDtcbiAgICB9XG4gIH1cbiAgaWYgKHR5cGUgJiYgdHlwZS5pZCA9PT0gRU1QVFlfUkVOREVSRVJfVFlQRV9JRCkge1xuICAgIHR5cGUgPSBudWxsO1xuICB9XG4gIHJldHVybiB0eXBlIHx8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0JpbmRpbmcoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgYmluZGluZ0lkeDogbnVtYmVyLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IG9sZFZhbHVlcyA9IHZpZXcub2xkVmFsdWVzO1xuICBpZiAoKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuRmlyc3RDaGVjaykgfHxcbiAgICAgICFsb29zZUlkZW50aWNhbChvbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdLCB2YWx1ZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgYmluZGluZ0lkeDogbnVtYmVyLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIGlmIChjaGVja0JpbmRpbmcodmlldywgZGVmLCBiaW5kaW5nSWR4LCB2YWx1ZSkpIHtcbiAgICB2aWV3Lm9sZFZhbHVlc1tkZWYuYmluZGluZ0luZGV4ICsgYmluZGluZ0lkeF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0JpbmRpbmdOb0NoYW5nZXMoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgYmluZGluZ0lkeDogbnVtYmVyLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IG9sZFZhbHVlID0gdmlldy5vbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdO1xuICBpZiAoKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuQmVmb3JlRmlyc3RDaGVjaykgfHwgIWRldk1vZGVFcXVhbChvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgY29uc3QgYmluZGluZ05hbWUgPSBkZWYuYmluZGluZ3NbYmluZGluZ0lkeF0ubmFtZTtcbiAgICB0aHJvdyBleHByZXNzaW9uQ2hhbmdlZEFmdGVySXRIYXNCZWVuQ2hlY2tlZEVycm9yKFxuICAgICAgICBTZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQodmlldywgZGVmLm5vZGVJbmRleCksIGAke2JpbmRpbmdOYW1lfTogJHtvbGRWYWx1ZX1gLFxuICAgICAgICBgJHtiaW5kaW5nTmFtZX06ICR7dmFsdWV9YCwgKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuQmVmb3JlRmlyc3RDaGVjaykgIT09IDApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXJrUGFyZW50Vmlld3NGb3JDaGVjayh2aWV3OiBWaWV3RGF0YSkge1xuICBsZXQgY3VyclZpZXc6IFZpZXdEYXRhfG51bGwgPSB2aWV3O1xuICB3aGlsZSAoY3VyclZpZXcpIHtcbiAgICBpZiAoY3VyclZpZXcuZGVmLmZsYWdzICYgVmlld0ZsYWdzLk9uUHVzaCkge1xuICAgICAgY3VyclZpZXcuc3RhdGUgfD0gVmlld1N0YXRlLkNoZWNrc0VuYWJsZWQ7XG4gICAgfVxuICAgIGN1cnJWaWV3ID0gY3VyclZpZXcudmlld0NvbnRhaW5lclBhcmVudCB8fCBjdXJyVmlldy5wYXJlbnQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcmtQYXJlbnRWaWV3c0ZvckNoZWNrUHJvamVjdGVkVmlld3ModmlldzogVmlld0RhdGEsIGVuZFZpZXc6IFZpZXdEYXRhKSB7XG4gIGxldCBjdXJyVmlldzogVmlld0RhdGF8bnVsbCA9IHZpZXc7XG4gIHdoaWxlIChjdXJyVmlldyAmJiBjdXJyVmlldyAhPT0gZW5kVmlldykge1xuICAgIGN1cnJWaWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXdzO1xuICAgIGN1cnJWaWV3ID0gY3VyclZpZXcudmlld0NvbnRhaW5lclBhcmVudCB8fCBjdXJyVmlldy5wYXJlbnQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSk6IGJvb2xlYW58dW5kZWZpbmVkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbbm9kZUluZGV4XTtcbiAgICBjb25zdCBzdGFydFZpZXcgPSBub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudFZpZXcgP1xuICAgICAgICBhc0VsZW1lbnREYXRhKHZpZXcsIG5vZGVJbmRleCkuY29tcG9uZW50VmlldyA6XG4gICAgICAgIHZpZXc7XG4gICAgbWFya1BhcmVudFZpZXdzRm9yQ2hlY2soc3RhcnRWaWV3KTtcbiAgICByZXR1cm4gU2VydmljZXMuaGFuZGxlRXZlbnQodmlldywgbm9kZUluZGV4LCBldmVudE5hbWUsIGV2ZW50KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIEF0dGVudGlvbjogRG9uJ3QgcmV0aHJvdywgYXMgaXQgd291bGQgY2FuY2VsIE9ic2VydmFibGUgc3Vic2NyaXB0aW9ucyFcbiAgICB2aWV3LnJvb3QuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNsYXJlZFZpZXdDb250YWluZXIodmlldzogVmlld0RhdGEpOiBFbGVtZW50RGF0YXxudWxsIHtcbiAgaWYgKHZpZXcucGFyZW50KSB7XG4gICAgY29uc3QgcGFyZW50VmlldyA9IHZpZXcucGFyZW50O1xuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHBhcmVudFZpZXcsIHZpZXcucGFyZW50Tm9kZURlZiAhLm5vZGVJbmRleCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogZm9yIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyB0aGUgaG9zdCBlbGVtZW50LlxuICogZm9yIGVtYmVkZGVkIHZpZXdzLCB0aGlzIGlzIHRoZSBpbmRleCBvZiB0aGUgcGFyZW50IG5vZGVcbiAqIHRoYXQgY29udGFpbnMgdGhlIHZpZXcgY29udGFpbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdmlld1BhcmVudEVsKHZpZXc6IFZpZXdEYXRhKTogTm9kZURlZnxudWxsIHtcbiAgY29uc3QgcGFyZW50VmlldyA9IHZpZXcucGFyZW50O1xuICBpZiAocGFyZW50Vmlldykge1xuICAgIHJldHVybiB2aWV3LnBhcmVudE5vZGVEZWYgIS5wYXJlbnQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlck5vZGUodmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZik6IGFueSB7XG4gIHN3aXRjaCAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQ6XG4gICAgICByZXR1cm4gYXNFbGVtZW50RGF0YSh2aWV3LCBkZWYubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50O1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVUZXh0OlxuICAgICAgcmV0dXJuIGFzVGV4dERhdGEodmlldywgZGVmLm5vZGVJbmRleCkucmVuZGVyVGV4dDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEV2ZW50RnVsbE5hbWUodGFyZ2V0OiBzdHJpbmcgfCBudWxsLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGFyZ2V0ID8gYCR7dGFyZ2V0fToke25hbWV9YCA6IG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudFZpZXcodmlldzogVmlld0RhdGEpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhdmlldy5wYXJlbnQgJiYgISEodmlldy5wYXJlbnROb2RlRGVmICEuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRW1iZWRkZWRWaWV3KHZpZXc6IFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIXZpZXcucGFyZW50ICYmICEodmlldy5wYXJlbnROb2RlRGVmICEuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclF1ZXJ5SWQocXVlcnlJZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIDEgPDwgKHF1ZXJ5SWQgJSAzMik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdE1hdGNoZWRRdWVyaWVzRHNsKFxuICAgIG1hdGNoZWRRdWVyaWVzRHNsOiBbc3RyaW5nIHwgbnVtYmVyLCBRdWVyeVZhbHVlVHlwZV1bXSB8IG51bGwpOiB7XG4gIG1hdGNoZWRRdWVyaWVzOiB7W3F1ZXJ5SWQ6IHN0cmluZ106IFF1ZXJ5VmFsdWVUeXBlfSxcbiAgcmVmZXJlbmNlczoge1tyZWZJZDogc3RyaW5nXTogUXVlcnlWYWx1ZVR5cGV9LFxuICBtYXRjaGVkUXVlcnlJZHM6IG51bWJlclxufSB7XG4gIGNvbnN0IG1hdGNoZWRRdWVyaWVzOiB7W3F1ZXJ5SWQ6IHN0cmluZ106IFF1ZXJ5VmFsdWVUeXBlfSA9IHt9O1xuICBsZXQgbWF0Y2hlZFF1ZXJ5SWRzID0gMDtcbiAgY29uc3QgcmVmZXJlbmNlczoge1tyZWZJZDogc3RyaW5nXTogUXVlcnlWYWx1ZVR5cGV9ID0ge307XG4gIGlmIChtYXRjaGVkUXVlcmllc0RzbCkge1xuICAgIG1hdGNoZWRRdWVyaWVzRHNsLmZvckVhY2goKFtxdWVyeUlkLCB2YWx1ZVR5cGVdKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHF1ZXJ5SWQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIG1hdGNoZWRRdWVyaWVzW3F1ZXJ5SWRdID0gdmFsdWVUeXBlO1xuICAgICAgICBtYXRjaGVkUXVlcnlJZHMgfD0gZmlsdGVyUXVlcnlJZChxdWVyeUlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZmVyZW5jZXNbcXVlcnlJZF0gPSB2YWx1ZVR5cGU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHttYXRjaGVkUXVlcmllcywgcmVmZXJlbmNlcywgbWF0Y2hlZFF1ZXJ5SWRzfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0RGVwc0RzbChkZXBzOiAoW0RlcEZsYWdzLCBhbnldIHwgYW55KVtdLCBzb3VyY2VOYW1lPzogc3RyaW5nKTogRGVwRGVmW10ge1xuICByZXR1cm4gZGVwcy5tYXAodmFsdWUgPT4ge1xuICAgIGxldCB0b2tlbjogYW55O1xuICAgIGxldCBmbGFnczogRGVwRmxhZ3M7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBbZmxhZ3MsIHRva2VuXSA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGFncyA9IERlcEZsYWdzLk5vbmU7XG4gICAgICB0b2tlbiA9IHZhbHVlO1xuICAgIH1cbiAgICBpZiAodG9rZW4gJiYgKHR5cGVvZiB0b2tlbiA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgdG9rZW4gPT09ICdvYmplY3QnKSAmJiBzb3VyY2VOYW1lKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodG9rZW4sIFNPVVJDRSwge3ZhbHVlOiBzb3VyY2VOYW1lLCBjb25maWd1cmFibGU6IHRydWV9KTtcbiAgICB9XG4gICAgcmV0dXJuIHtmbGFncywgdG9rZW4sIHRva2VuS2V5OiB0b2tlbktleSh0b2tlbil9O1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFJlbmRlckVsZW1lbnQodmlldzogVmlld0RhdGEsIHJlbmRlckhvc3Q6IGFueSwgZGVmOiBOb2RlRGVmKTogYW55IHtcbiAgbGV0IHJlbmRlclBhcmVudCA9IGRlZi5yZW5kZXJQYXJlbnQ7XG4gIGlmIChyZW5kZXJQYXJlbnQpIHtcbiAgICBpZiAoKHJlbmRlclBhcmVudC5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkgPT09IDAgfHxcbiAgICAgICAgKHJlbmRlclBhcmVudC5mbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnRWaWV3KSA9PT0gMCB8fFxuICAgICAgICAocmVuZGVyUGFyZW50LmVsZW1lbnQgIS5jb21wb25lbnRSZW5kZXJlclR5cGUgJiZcbiAgICAgICAgIHJlbmRlclBhcmVudC5lbGVtZW50ICEuY29tcG9uZW50UmVuZGVyZXJUeXBlICEuZW5jYXBzdWxhdGlvbiA9PT1cbiAgICAgICAgICAgICBWaWV3RW5jYXBzdWxhdGlvbi5OYXRpdmUpKSB7XG4gICAgICAvLyBvbmx5IGNoaWxkcmVuIG9mIG5vbiBjb21wb25lbnRzLCBvciBjaGlsZHJlbiBvZiBjb21wb25lbnRzIHdpdGggbmF0aXZlIGVuY2Fwc3VsYXRpb24gc2hvdWxkXG4gICAgICAvLyBiZSBhdHRhY2hlZC5cbiAgICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHZpZXcsIGRlZi5yZW5kZXJQYXJlbnQgIS5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiByZW5kZXJIb3N0O1xuICB9XG59XG5cbmNvbnN0IERFRklOSVRJT05fQ0FDSEUgPSBuZXcgV2Vha01hcDxhbnksIERlZmluaXRpb248YW55Pj4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEZWZpbml0aW9uPEQgZXh0ZW5kcyBEZWZpbml0aW9uPGFueT4+KGZhY3Rvcnk6IERlZmluaXRpb25GYWN0b3J5PEQ+KTogRCB7XG4gIGxldCB2YWx1ZSA9IERFRklOSVRJT05fQ0FDSEUuZ2V0KGZhY3RvcnkpICFhcyBEO1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdmFsdWUgPSBmYWN0b3J5KCgpID0+IE5PT1ApO1xuICAgIHZhbHVlLmZhY3RvcnkgPSBmYWN0b3J5O1xuICAgIERFRklOSVRJT05fQ0FDSEUuc2V0KGZhY3RvcnksIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb290UmVuZGVyTm9kZXModmlldzogVmlld0RhdGEpOiBhbnlbXSB7XG4gIGNvbnN0IHJlbmRlck5vZGVzOiBhbnlbXSA9IFtdO1xuICB2aXNpdFJvb3RSZW5kZXJOb2Rlcyh2aWV3LCBSZW5kZXJOb2RlQWN0aW9uLkNvbGxlY3QsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCByZW5kZXJOb2Rlcyk7XG4gIHJldHVybiByZW5kZXJOb2Rlcztcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gUmVuZGVyTm9kZUFjdGlvbiB7Q29sbGVjdCwgQXBwZW5kQ2hpbGQsIEluc2VydEJlZm9yZSwgUmVtb3ZlQ2hpbGR9XG5cbmV4cG9ydCBmdW5jdGlvbiB2aXNpdFJvb3RSZW5kZXJOb2RlcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgYWN0aW9uOiBSZW5kZXJOb2RlQWN0aW9uLCBwYXJlbnROb2RlOiBhbnksIG5leHRTaWJsaW5nOiBhbnksIHRhcmdldD86IGFueVtdKSB7XG4gIC8vIFdlIG5lZWQgdG8gcmUtY29tcHV0ZSB0aGUgcGFyZW50IG5vZGUgaW4gY2FzZSB0aGUgbm9kZXMgaGF2ZSBiZWVuIG1vdmVkIGFyb3VuZCBtYW51YWxseVxuICBpZiAoYWN0aW9uID09PSBSZW5kZXJOb2RlQWN0aW9uLlJlbW92ZUNoaWxkKSB7XG4gICAgcGFyZW50Tm9kZSA9IHZpZXcucmVuZGVyZXIucGFyZW50Tm9kZShyZW5kZXJOb2RlKHZpZXcsIHZpZXcuZGVmLmxhc3RSZW5kZXJSb290Tm9kZSAhKSk7XG4gIH1cbiAgdmlzaXRTaWJsaW5nUmVuZGVyTm9kZXMoXG4gICAgICB2aWV3LCBhY3Rpb24sIDAsIHZpZXcuZGVmLm5vZGVzLmxlbmd0aCAtIDEsIHBhcmVudE5vZGUsIG5leHRTaWJsaW5nLCB0YXJnZXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmlzaXRTaWJsaW5nUmVuZGVyTm9kZXMoXG4gICAgdmlldzogVmlld0RhdGEsIGFjdGlvbjogUmVuZGVyTm9kZUFjdGlvbiwgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyLCBwYXJlbnROb2RlOiBhbnksXG4gICAgbmV4dFNpYmxpbmc6IGFueSwgdGFyZ2V0PzogYW55W10pIHtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPD0gZW5kSW5kZXg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIChOb2RlRmxhZ3MuVHlwZUVsZW1lbnQgfCBOb2RlRmxhZ3MuVHlwZVRleHQgfCBOb2RlRmxhZ3MuVHlwZU5nQ29udGVudCkpIHtcbiAgICAgIHZpc2l0UmVuZGVyTm9kZSh2aWV3LCBub2RlRGVmLCBhY3Rpb24sIHBhcmVudE5vZGUsIG5leHRTaWJsaW5nLCB0YXJnZXQpO1xuICAgIH1cbiAgICAvLyBqdW1wIHRvIG5leHQgc2libGluZ1xuICAgIGkgKz0gbm9kZURlZi5jaGlsZENvdW50O1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2aXNpdFByb2plY3RlZFJlbmRlck5vZGVzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBuZ0NvbnRlbnRJbmRleDogbnVtYmVyLCBhY3Rpb246IFJlbmRlck5vZGVBY3Rpb24sIHBhcmVudE5vZGU6IGFueSxcbiAgICBuZXh0U2libGluZzogYW55LCB0YXJnZXQ/OiBhbnlbXSkge1xuICBsZXQgY29tcFZpZXc6IFZpZXdEYXRhfG51bGwgPSB2aWV3O1xuICB3aGlsZSAoY29tcFZpZXcgJiYgIWlzQ29tcG9uZW50Vmlldyhjb21wVmlldykpIHtcbiAgICBjb21wVmlldyA9IGNvbXBWaWV3LnBhcmVudDtcbiAgfVxuICBjb25zdCBob3N0VmlldyA9IGNvbXBWaWV3ICEucGFyZW50O1xuICBjb25zdCBob3N0RWxEZWYgPSB2aWV3UGFyZW50RWwoY29tcFZpZXcgISk7XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSBob3N0RWxEZWYgIS5ub2RlSW5kZXggKyAxO1xuICBjb25zdCBlbmRJbmRleCA9IGhvc3RFbERlZiAhLm5vZGVJbmRleCArIGhvc3RFbERlZiAhLmNoaWxkQ291bnQ7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDw9IGVuZEluZGV4OyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gaG9zdFZpZXcgIS5kZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYubmdDb250ZW50SW5kZXggPT09IG5nQ29udGVudEluZGV4KSB7XG4gICAgICB2aXNpdFJlbmRlck5vZGUoaG9zdFZpZXcgISwgbm9kZURlZiwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICB9XG4gICAgLy8ganVtcCB0byBuZXh0IHNpYmxpbmdcbiAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgfVxuICBpZiAoIWhvc3RWaWV3ICEucGFyZW50KSB7XG4gICAgLy8gYSByb290IHZpZXdcbiAgICBjb25zdCBwcm9qZWN0ZWROb2RlcyA9IHZpZXcucm9vdC5wcm9qZWN0YWJsZU5vZGVzW25nQ29udGVudEluZGV4XTtcbiAgICBpZiAocHJvamVjdGVkTm9kZXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvamVjdGVkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhlY1JlbmRlck5vZGVBY3Rpb24odmlldywgcHJvamVjdGVkTm9kZXNbaV0sIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHZpc2l0UmVuZGVyTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgYWN0aW9uOiBSZW5kZXJOb2RlQWN0aW9uLCBwYXJlbnROb2RlOiBhbnksIG5leHRTaWJsaW5nOiBhbnksXG4gICAgdGFyZ2V0PzogYW55W10pIHtcbiAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZU5nQ29udGVudCkge1xuICAgIHZpc2l0UHJvamVjdGVkUmVuZGVyTm9kZXMoXG4gICAgICAgIHZpZXcsIG5vZGVEZWYubmdDb250ZW50ICEuaW5kZXgsIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgcm4gPSByZW5kZXJOb2RlKHZpZXcsIG5vZGVEZWYpO1xuICAgIGlmIChhY3Rpb24gPT09IFJlbmRlck5vZGVBY3Rpb24uUmVtb3ZlQ2hpbGQgJiYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50VmlldykgJiZcbiAgICAgICAgKG5vZGVEZWYuYmluZGluZ0ZsYWdzICYgQmluZGluZ0ZsYWdzLkNhdFN5bnRoZXRpY1Byb3BlcnR5KSkge1xuICAgICAgLy8gTm90ZTogd2UgbWlnaHQgbmVlZCB0byBkbyBib3RoIGFjdGlvbnMuXG4gICAgICBpZiAobm9kZURlZi5iaW5kaW5nRmxhZ3MgJiAoQmluZGluZ0ZsYWdzLlN5bnRoZXRpY1Byb3BlcnR5KSkge1xuICAgICAgICBleGVjUmVuZGVyTm9kZUFjdGlvbih2aWV3LCBybiwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlRGVmLmJpbmRpbmdGbGFncyAmIChCaW5kaW5nRmxhZ3MuU3ludGhldGljSG9zdFByb3BlcnR5KSkge1xuICAgICAgICBjb25zdCBjb21wVmlldyA9IGFzRWxlbWVudERhdGEodmlldywgbm9kZURlZi5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXc7XG4gICAgICAgIGV4ZWNSZW5kZXJOb2RlQWN0aW9uKGNvbXBWaWV3LCBybiwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZXhlY1JlbmRlck5vZGVBY3Rpb24odmlldywgcm4sIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgfVxuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkVtYmVkZGVkVmlld3MpIHtcbiAgICAgIGNvbnN0IGVtYmVkZGVkVmlld3MgPSBhc0VsZW1lbnREYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS52aWV3Q29udGFpbmVyICEuX2VtYmVkZGVkVmlld3M7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGVtYmVkZGVkVmlld3MubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgdmlzaXRSb290UmVuZGVyTm9kZXMoZW1iZWRkZWRWaWV3c1trXSwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQgJiYgIW5vZGVEZWYuZWxlbWVudCAhLm5hbWUpIHtcbiAgICAgIHZpc2l0U2libGluZ1JlbmRlck5vZGVzKFxuICAgICAgICAgIHZpZXcsIGFjdGlvbiwgbm9kZURlZi5ub2RlSW5kZXggKyAxLCBub2RlRGVmLm5vZGVJbmRleCArIG5vZGVEZWYuY2hpbGRDb3VudCwgcGFyZW50Tm9kZSxcbiAgICAgICAgICBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY1JlbmRlck5vZGVBY3Rpb24oXG4gICAgdmlldzogVmlld0RhdGEsIHJlbmRlck5vZGU6IGFueSwgYWN0aW9uOiBSZW5kZXJOb2RlQWN0aW9uLCBwYXJlbnROb2RlOiBhbnksIG5leHRTaWJsaW5nOiBhbnksXG4gICAgdGFyZ2V0PzogYW55W10pIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3LnJlbmRlcmVyO1xuICBzd2l0Y2ggKGFjdGlvbikge1xuICAgIGNhc2UgUmVuZGVyTm9kZUFjdGlvbi5BcHBlbmRDaGlsZDpcbiAgICAgIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudE5vZGUsIHJlbmRlck5vZGUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBSZW5kZXJOb2RlQWN0aW9uLkluc2VydEJlZm9yZTpcbiAgICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnROb2RlLCByZW5kZXJOb2RlLCBuZXh0U2libGluZyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFJlbmRlck5vZGVBY3Rpb24uUmVtb3ZlQ2hpbGQ6XG4gICAgICByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnROb2RlLCByZW5kZXJOb2RlKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgUmVuZGVyTm9kZUFjdGlvbi5Db2xsZWN0OlxuICAgICAgdGFyZ2V0ICEucHVzaChyZW5kZXJOb2RlKTtcbiAgICAgIGJyZWFrO1xuICB9XG59XG5cbmNvbnN0IE5TX1BSRUZJWF9SRSA9IC9eOihbXjpdKyk6KC4rKSQvO1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXROYW1lc3BhY2UobmFtZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICBpZiAobmFtZVswXSA9PT0gJzonKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKE5TX1BSRUZJWF9SRSkgITtcbiAgICByZXR1cm4gW21hdGNoWzFdLCBtYXRjaFsyXV07XG4gIH1cbiAgcmV0dXJuIFsnJywgbmFtZV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjQmluZGluZ0ZsYWdzKGJpbmRpbmdzOiBCaW5kaW5nRGVmW10pOiBCaW5kaW5nRmxhZ3Mge1xuICBsZXQgZmxhZ3MgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgZmxhZ3MgfD0gYmluZGluZ3NbaV0uZmxhZ3M7XG4gIH1cbiAgcmV0dXJuIGZsYWdzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGUodmFsdWVDb3VudDogbnVtYmVyLCBjb25zdEFuZEludGVycDogc3RyaW5nW10pOiBzdHJpbmcge1xuICBsZXQgcmVzdWx0ID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVDb3VudCAqIDI7IGkgPSBpICsgMikge1xuICAgIHJlc3VsdCA9IHJlc3VsdCArIGNvbnN0QW5kSW50ZXJwW2ldICsgX3RvU3RyaW5nV2l0aE51bGwoY29uc3RBbmRJbnRlcnBbaSArIDFdKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0ICsgY29uc3RBbmRJbnRlcnBbdmFsdWVDb3VudCAqIDJdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5saW5lSW50ZXJwb2xhdGUoXG4gICAgdmFsdWVDb3VudDogbnVtYmVyLCBjMDogc3RyaW5nLCBhMTogYW55LCBjMTogc3RyaW5nLCBhMj86IGFueSwgYzI/OiBzdHJpbmcsIGEzPzogYW55LFxuICAgIGMzPzogc3RyaW5nLCBhND86IGFueSwgYzQ/OiBzdHJpbmcsIGE1PzogYW55LCBjNT86IHN0cmluZywgYTY/OiBhbnksIGM2Pzogc3RyaW5nLCBhNz86IGFueSxcbiAgICBjNz86IHN0cmluZywgYTg/OiBhbnksIGM4Pzogc3RyaW5nLCBhOT86IGFueSwgYzk/OiBzdHJpbmcpOiBzdHJpbmcge1xuICBzd2l0Y2ggKHZhbHVlQ291bnQpIHtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMTtcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzICsgX3RvU3RyaW5nV2l0aE51bGwoYTQpICsgYzQ7XG4gICAgY2FzZSA1OlxuICAgICAgcmV0dXJuIGMwICsgX3RvU3RyaW5nV2l0aE51bGwoYTEpICsgYzEgKyBfdG9TdHJpbmdXaXRoTnVsbChhMikgKyBjMiArIF90b1N0cmluZ1dpdGhOdWxsKGEzKSArXG4gICAgICAgICAgYzMgKyBfdG9TdHJpbmdXaXRoTnVsbChhNCkgKyBjNCArIF90b1N0cmluZ1dpdGhOdWxsKGE1KSArIGM1O1xuICAgIGNhc2UgNjpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzICsgX3RvU3RyaW5nV2l0aE51bGwoYTQpICsgYzQgKyBfdG9TdHJpbmdXaXRoTnVsbChhNSkgKyBjNSArIF90b1N0cmluZ1dpdGhOdWxsKGE2KSArIGM2O1xuICAgIGNhc2UgNzpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzICsgX3RvU3RyaW5nV2l0aE51bGwoYTQpICsgYzQgKyBfdG9TdHJpbmdXaXRoTnVsbChhNSkgKyBjNSArIF90b1N0cmluZ1dpdGhOdWxsKGE2KSArXG4gICAgICAgICAgYzYgKyBfdG9TdHJpbmdXaXRoTnVsbChhNykgKyBjNztcbiAgICBjYXNlIDg6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyICsgX3RvU3RyaW5nV2l0aE51bGwoYTMpICtcbiAgICAgICAgICBjMyArIF90b1N0cmluZ1dpdGhOdWxsKGE0KSArIGM0ICsgX3RvU3RyaW5nV2l0aE51bGwoYTUpICsgYzUgKyBfdG9TdHJpbmdXaXRoTnVsbChhNikgK1xuICAgICAgICAgIGM2ICsgX3RvU3RyaW5nV2l0aE51bGwoYTcpICsgYzcgKyBfdG9TdHJpbmdXaXRoTnVsbChhOCkgKyBjODtcbiAgICBjYXNlIDk6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyICsgX3RvU3RyaW5nV2l0aE51bGwoYTMpICtcbiAgICAgICAgICBjMyArIF90b1N0cmluZ1dpdGhOdWxsKGE0KSArIGM0ICsgX3RvU3RyaW5nV2l0aE51bGwoYTUpICsgYzUgKyBfdG9TdHJpbmdXaXRoTnVsbChhNikgK1xuICAgICAgICAgIGM2ICsgX3RvU3RyaW5nV2l0aE51bGwoYTcpICsgYzcgKyBfdG9TdHJpbmdXaXRoTnVsbChhOCkgKyBjOCArIF90b1N0cmluZ1dpdGhOdWxsKGE5KSArIGM5O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYERvZXMgbm90IHN1cHBvcnQgbW9yZSB0aGFuIDkgZXhwcmVzc2lvbnNgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfdG9TdHJpbmdXaXRoTnVsbCh2OiBhbnkpOiBzdHJpbmcge1xuICByZXR1cm4gdiAhPSBudWxsID8gdi50b1N0cmluZygpIDogJyc7XG59XG5cbmV4cG9ydCBjb25zdCBFTVBUWV9BUlJBWTogYW55W10gPSBbXTtcbmV4cG9ydCBjb25zdCBFTVBUWV9NQVA6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4iXX0=