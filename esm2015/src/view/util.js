/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
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
import { looseIdentical, stringify } from '../util';
import { expressionChangedAfterItHasBeenCheckedError } from './errors';
import { Services, asElementData, asTextData } from './types';
export const /** @type {?} */ NOOP = () => { };
const /** @type {?} */ _tokenKeyCache = new Map();
/**
 * @param {?} token
 * @return {?}
 */
export function tokenKey(token) {
    let /** @type {?} */ key = _tokenKeyCache.get(token);
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
        const /** @type {?} */ globalBindingIdx = view.def.nodes[nodeIdx].bindingIndex + bindingIdx;
        const /** @type {?} */ oldValue = WrappedValue.unwrap(view.oldValues[globalBindingIdx]);
        view.oldValues[globalBindingIdx] = new WrappedValue(oldValue);
    }
    return value;
}
const /** @type {?} */ UNDEFINED_RENDERER_TYPE_ID = '$$undefined';
const /** @type {?} */ EMPTY_RENDERER_TYPE_ID = '$$empty';
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
let /** @type {?} */ _renderCompCount = 0;
/**
 * @param {?=} type
 * @return {?}
 */
export function resolveRendererType2(type) {
    if (type && type.id === UNDEFINED_RENDERER_TYPE_ID) {
        // first time we see this RendererType2. Initialize it...
        const /** @type {?} */ isFilled = ((type.encapsulation != null && type.encapsulation !== ViewEncapsulation.None) ||
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
    const /** @type {?} */ oldValues = view.oldValues;
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
    const /** @type {?} */ oldValue = view.oldValues[def.bindingIndex + bindingIdx];
    if ((view.state & 1 /* BeforeFirstCheck */) || !devModeEqual(oldValue, value)) {
        const /** @type {?} */ bindingName = def.bindings[bindingIdx].name;
        throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, def.nodeIndex), `${bindingName}: ${oldValue}`, `${bindingName}: ${value}`, (view.state & 1 /* BeforeFirstCheck */) !== 0);
    }
}
/**
 * @param {?} view
 * @return {?}
 */
export function markParentViewsForCheck(view) {
    let /** @type {?} */ currView = view;
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
    let /** @type {?} */ currView = view;
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
        const /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
        const /** @type {?} */ startView = nodeDef.flags & 33554432 /* ComponentView */ ?
            asElementData(view, nodeIndex).componentView :
            view;
        markParentViewsForCheck(startView);
        return Services.handleEvent(view, nodeIndex, eventName, event);
    }
    catch (/** @type {?} */ e) {
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
        const /** @type {?} */ parentView = view.parent;
        return asElementData(parentView, /** @type {?} */ ((view.parentNodeDef)).nodeIndex);
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
    const /** @type {?} */ parentView = view.parent;
    if (parentView) {
        return /** @type {?} */ ((view.parentNodeDef)).parent;
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
    return !!view.parent && !!(/** @type {?} */ ((view.parentNodeDef)).flags & 32768 /* Component */);
}
/**
 * @param {?} view
 * @return {?}
 */
export function isEmbeddedView(view) {
    return !!view.parent && !(/** @type {?} */ ((view.parentNodeDef)).flags & 32768 /* Component */);
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
    const /** @type {?} */ matchedQueries = {};
    let /** @type {?} */ matchedQueryIds = 0;
    const /** @type {?} */ references = {};
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
        let /** @type {?} */ token;
        let /** @type {?} */ flags;
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
    let /** @type {?} */ renderParent = def.renderParent;
    if (renderParent) {
        if ((renderParent.flags & 1 /* TypeElement */) === 0 ||
            (renderParent.flags & 33554432 /* ComponentView */) === 0 ||
            (/** @type {?} */ ((renderParent.element)).componentRendererType && /** @type {?} */ ((/** @type {?} */ ((renderParent.element)).componentRendererType)).encapsulation === ViewEncapsulation.Native)) {
            // only children of non components, or children of components with native encapsulation should
            // be attached.
            return asElementData(view, /** @type {?} */ ((def.renderParent)).nodeIndex).renderElement;
        }
    }
    else {
        return renderHost;
    }
}
const /** @type {?} */ DEFINITION_CACHE = new WeakMap();
/**
 * @template D
 * @param {?} factory
 * @return {?}
 */
export function resolveDefinition(factory) {
    let /** @type {?} */ value = /** @type {?} */ (((DEFINITION_CACHE.get(factory))));
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
    const /** @type {?} */ renderNodes = [];
    visitRootRenderNodes(view, 0 /* Collect */, undefined, undefined, renderNodes);
    return renderNodes;
}
/** @enum {number} */
const RenderNodeAction = { Collect: 0, AppendChild: 1, InsertBefore: 2, RemoveChild: 3, };
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
        parentNode = view.renderer.parentNode(renderNode(view, /** @type {?} */ ((view.def.lastRenderRootNode))));
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
    for (let /** @type {?} */ i = startIndex; i <= endIndex; i++) {
        const /** @type {?} */ nodeDef = view.def.nodes[i];
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
    let /** @type {?} */ compView = view;
    while (compView && !isComponentView(compView)) {
        compView = compView.parent;
    }
    const /** @type {?} */ hostView = /** @type {?} */ ((compView)).parent;
    const /** @type {?} */ hostElDef = viewParentEl(/** @type {?} */ ((compView)));
    const /** @type {?} */ startIndex = /** @type {?} */ ((hostElDef)).nodeIndex + 1;
    const /** @type {?} */ endIndex = /** @type {?} */ ((hostElDef)).nodeIndex + /** @type {?} */ ((hostElDef)).childCount;
    for (let /** @type {?} */ i = startIndex; i <= endIndex; i++) {
        const /** @type {?} */ nodeDef = /** @type {?} */ ((hostView)).def.nodes[i];
        if (nodeDef.ngContentIndex === ngContentIndex) {
            visitRenderNode(/** @type {?} */ ((hostView)), nodeDef, action, parentNode, nextSibling, target);
        }
        // jump to next sibling
        i += nodeDef.childCount;
    }
    if (!/** @type {?} */ ((hostView)).parent) {
        // a root view
        const /** @type {?} */ projectedNodes = view.root.projectableNodes[ngContentIndex];
        if (projectedNodes) {
            for (let /** @type {?} */ i = 0; i < projectedNodes.length; i++) {
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
        visitProjectedRenderNodes(view, /** @type {?} */ ((nodeDef.ngContent)).index, action, parentNode, nextSibling, target);
    }
    else {
        const /** @type {?} */ rn = renderNode(view, nodeDef);
        if (action === 3 /* RemoveChild */ && (nodeDef.flags & 33554432 /* ComponentView */) &&
            (nodeDef.bindingFlags & 48 /* CatSyntheticProperty */)) {
            // Note: we might need to do both actions.
            if (nodeDef.bindingFlags & (16 /* SyntheticProperty */)) {
                execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
            }
            if (nodeDef.bindingFlags & (32 /* SyntheticHostProperty */)) {
                const /** @type {?} */ compView = asElementData(view, nodeDef.nodeIndex).componentView;
                execRenderNodeAction(compView, rn, action, parentNode, nextSibling, target);
            }
        }
        else {
            execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
        }
        if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
            const /** @type {?} */ embeddedViews = /** @type {?} */ ((asElementData(view, nodeDef.nodeIndex).viewContainer))._embeddedViews;
            for (let /** @type {?} */ k = 0; k < embeddedViews.length; k++) {
                visitRootRenderNodes(embeddedViews[k], action, parentNode, nextSibling, target);
            }
        }
        if (nodeDef.flags & 1 /* TypeElement */ && !/** @type {?} */ ((nodeDef.element)).name) {
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
    const /** @type {?} */ renderer = view.renderer;
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
            /** @type {?} */ ((target)).push(renderNode);
            break;
    }
}
const /** @type {?} */ NS_PREFIX_RE = /^:([^:]+):(.+)$/;
/**
 * @param {?} name
 * @return {?}
 */
export function splitNamespace(name) {
    if (name[0] === ':') {
        const /** @type {?} */ match = /** @type {?} */ ((name.match(NS_PREFIX_RE)));
        return [match[1], match[2]];
    }
    return ['', name];
}
/**
 * @param {?} bindings
 * @return {?}
 */
export function calcBindingFlags(bindings) {
    let /** @type {?} */ flags = 0;
    for (let /** @type {?} */ i = 0; i < bindings.length; i++) {
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
    let /** @type {?} */ result = '';
    for (let /** @type {?} */ i = 0; i < valueCount * 2; i = i + 2) {
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
export const /** @type {?} */ EMPTY_ARRAY = [];
export const /** @type {?} */ EMPTY_MAP = {};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUUsWUFBWSxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDaEYsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRW5ELE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xELE9BQU8sRUFBQywyQ0FBMkMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRSxPQUFPLEVBQTZILFFBQVEsRUFBeUUsYUFBYSxFQUFFLFVBQVUsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUvUCxNQUFNLENBQUMsdUJBQU0sSUFBSSxHQUFRLEdBQUcsRUFBRSxJQUFHLENBQUM7QUFFbEMsdUJBQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7Ozs7O0FBRTlDLE1BQU0sbUJBQW1CLEtBQVU7SUFDakMscUJBQUksR0FBRyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNSLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUM7UUFDbkQsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDaEM7SUFDRCxPQUFPLEdBQUcsQ0FBQztDQUNaOzs7Ozs7OztBQUVELE1BQU0sc0JBQXNCLElBQWMsRUFBRSxPQUFlLEVBQUUsVUFBa0IsRUFBRSxLQUFVO0lBQ3pGLElBQUksWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMs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LENBQUMsRUFBRSxDQUFDO2dCQUN2RixFQUFFLEdBQUcsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BGLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNoRztZQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztLQUMvRDtDQUNGOzs7OztBQUVELDJCQUEyQixDQUFNO0lBQy9CLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Q0FDdEM7QUFFRCxNQUFNLENBQUMsdUJBQU0sV0FBVyxHQUFVLEVBQUUsQ0FBQztBQUNyQyxNQUFNLENBQUMsdUJBQU0sU0FBUyxHQUF5QixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7V3JhcHBlZFZhbHVlLCBkZXZNb2RlRXF1YWx9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge1NPVVJDRX0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge1JlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtsb29zZUlkZW50aWNhbCwgc3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7ZXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtCaW5kaW5nRGVmLCBCaW5kaW5nRmxhZ3MsIERlZmluaXRpb24sIERlZmluaXRpb25GYWN0b3J5LCBEZXBEZWYsIERlcEZsYWdzLCBFbGVtZW50RGF0YSwgTm9kZURlZiwgTm9kZUZsYWdzLCBRdWVyeVZhbHVlVHlwZSwgU2VydmljZXMsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbiwgVmlld0RlZmluaXRpb25GYWN0b3J5LCBWaWV3RmxhZ3MsIFZpZXdTdGF0ZSwgYXNFbGVtZW50RGF0YSwgYXNUZXh0RGF0YX0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBjb25zdCBOT09QOiBhbnkgPSAoKSA9PiB7fTtcblxuY29uc3QgX3Rva2VuS2V5Q2FjaGUgPSBuZXcgTWFwPGFueSwgc3RyaW5nPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5LZXkodG9rZW46IGFueSk6IHN0cmluZyB7XG4gIGxldCBrZXkgPSBfdG9rZW5LZXlDYWNoZS5nZXQodG9rZW4pO1xuICBpZiAoIWtleSkge1xuICAgIGtleSA9IHN0cmluZ2lmeSh0b2tlbikgKyAnXycgKyBfdG9rZW5LZXlDYWNoZS5zaXplO1xuICAgIF90b2tlbktleUNhY2hlLnNldCh0b2tlbiwga2V5KTtcbiAgfVxuICByZXR1cm4ga2V5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwVmFsdWUodmlldzogVmlld0RhdGEsIG5vZGVJZHg6IG51bWJlciwgYmluZGluZ0lkeDogbnVtYmVyLCB2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKFdyYXBwZWRWYWx1ZS5pc1dyYXBwZWQodmFsdWUpKSB7XG4gICAgdmFsdWUgPSBXcmFwcGVkVmFsdWUudW53cmFwKHZhbHVlKTtcbiAgICBjb25zdCBnbG9iYWxCaW5kaW5nSWR4ID0gdmlldy5kZWYubm9kZXNbbm9kZUlkeF0uYmluZGluZ0luZGV4ICsgYmluZGluZ0lkeDtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IFdyYXBwZWRWYWx1ZS51bndyYXAodmlldy5vbGRWYWx1ZXNbZ2xvYmFsQmluZGluZ0lkeF0pO1xuICAgIHZpZXcub2xkVmFsdWVzW2dsb2JhbEJpbmRpbmdJZHhdID0gbmV3IFdyYXBwZWRWYWx1ZShvbGRWYWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5jb25zdCBVTkRFRklORURfUkVOREVSRVJfVFlQRV9JRCA9ICckJHVuZGVmaW5lZCc7XG5jb25zdCBFTVBUWV9SRU5ERVJFUl9UWVBFX0lEID0gJyQkZW1wdHknO1xuXG4vLyBBdHRlbnRpb246IHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGFzIHRvcCBsZXZlbCBmdW5jdGlvbi5cbi8vIFB1dHRpbmcgYW55IGxvZ2ljIGluIGhlcmUgd2lsbCBkZXN0cm95IGNsb3N1cmUgdHJlZSBzaGFraW5nIVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlbmRlcmVyVHlwZTIodmFsdWVzOiB7XG4gIHN0eWxlczogKHN0cmluZyB8IGFueVtdKVtdLFxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbixcbiAgZGF0YToge1traW5kOiBzdHJpbmddOiBhbnlbXX1cbn0pOiBSZW5kZXJlclR5cGUyIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogVU5ERUZJTkVEX1JFTkRFUkVSX1RZUEVfSUQsXG4gICAgc3R5bGVzOiB2YWx1ZXMuc3R5bGVzLFxuICAgIGVuY2Fwc3VsYXRpb246IHZhbHVlcy5lbmNhcHN1bGF0aW9uLFxuICAgIGRhdGE6IHZhbHVlcy5kYXRhXG4gIH07XG59XG5cbmxldCBfcmVuZGVyQ29tcENvdW50ID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVSZW5kZXJlclR5cGUyKHR5cGU/OiBSZW5kZXJlclR5cGUyIHwgbnVsbCk6IFJlbmRlcmVyVHlwZTJ8bnVsbCB7XG4gIGlmICh0eXBlICYmIHR5cGUuaWQgPT09IFVOREVGSU5FRF9SRU5ERVJFUl9UWVBFX0lEKSB7XG4gICAgLy8gZmlyc3QgdGltZSB3ZSBzZWUgdGhpcyBSZW5kZXJlclR5cGUyLiBJbml0aWFsaXplIGl0Li4uXG4gICAgY29uc3QgaXNGaWxsZWQgPVxuICAgICAgICAoKHR5cGUuZW5jYXBzdWxhdGlvbiAhPSBudWxsICYmIHR5cGUuZW5jYXBzdWxhdGlvbiAhPT0gVmlld0VuY2Fwc3VsYXRpb24uTm9uZSkgfHxcbiAgICAgICAgIHR5cGUuc3R5bGVzLmxlbmd0aCB8fCBPYmplY3Qua2V5cyh0eXBlLmRhdGEpLmxlbmd0aCk7XG4gICAgaWYgKGlzRmlsbGVkKSB7XG4gICAgICB0eXBlLmlkID0gYGMke19yZW5kZXJDb21wQ291bnQrK31gO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eXBlLmlkID0gRU1QVFlfUkVOREVSRVJfVFlQRV9JRDtcbiAgICB9XG4gIH1cbiAgaWYgKHR5cGUgJiYgdHlwZS5pZCA9PT0gRU1QVFlfUkVOREVSRVJfVFlQRV9JRCkge1xuICAgIHR5cGUgPSBudWxsO1xuICB9XG4gIHJldHVybiB0eXBlIHx8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0JpbmRpbmcoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgYmluZGluZ0lkeDogbnVtYmVyLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IG9sZFZhbHVlcyA9IHZpZXcub2xkVmFsdWVzO1xuICBpZiAoKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuRmlyc3RDaGVjaykgfHxcbiAgICAgICFsb29zZUlkZW50aWNhbChvbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdLCB2YWx1ZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgYmluZGluZ0lkeDogbnVtYmVyLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIGlmIChjaGVja0JpbmRpbmcodmlldywgZGVmLCBiaW5kaW5nSWR4LCB2YWx1ZSkpIHtcbiAgICB2aWV3Lm9sZFZhbHVlc1tkZWYuYmluZGluZ0luZGV4ICsgYmluZGluZ0lkeF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0JpbmRpbmdOb0NoYW5nZXMoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgYmluZGluZ0lkeDogbnVtYmVyLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IG9sZFZhbHVlID0gdmlldy5vbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdO1xuICBpZiAoKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuQmVmb3JlRmlyc3RDaGVjaykgfHwgIWRldk1vZGVFcXVhbChvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgY29uc3QgYmluZGluZ05hbWUgPSBkZWYuYmluZGluZ3NbYmluZGluZ0lkeF0ubmFtZTtcbiAgICB0aHJvdyBleHByZXNzaW9uQ2hhbmdlZEFmdGVySXRIYXNCZWVuQ2hlY2tlZEVycm9yKFxuICAgICAgICBTZXJ2aWNlcy5jcmVhdGVEZWJ1Z0NvbnRleHQodmlldywgZGVmLm5vZGVJbmRleCksIGAke2JpbmRpbmdOYW1lfTogJHtvbGRWYWx1ZX1gLFxuICAgICAgICBgJHtiaW5kaW5nTmFtZX06ICR7dmFsdWV9YCwgKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuQmVmb3JlRmlyc3RDaGVjaykgIT09IDApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXJrUGFyZW50Vmlld3NGb3JDaGVjayh2aWV3OiBWaWV3RGF0YSkge1xuICBsZXQgY3VyclZpZXc6IFZpZXdEYXRhfG51bGwgPSB2aWV3O1xuICB3aGlsZSAoY3VyclZpZXcpIHtcbiAgICBpZiAoY3VyclZpZXcuZGVmLmZsYWdzICYgVmlld0ZsYWdzLk9uUHVzaCkge1xuICAgICAgY3VyclZpZXcuc3RhdGUgfD0gVmlld1N0YXRlLkNoZWNrc0VuYWJsZWQ7XG4gICAgfVxuICAgIGN1cnJWaWV3ID0gY3VyclZpZXcudmlld0NvbnRhaW5lclBhcmVudCB8fCBjdXJyVmlldy5wYXJlbnQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcmtQYXJlbnRWaWV3c0ZvckNoZWNrUHJvamVjdGVkVmlld3ModmlldzogVmlld0RhdGEsIGVuZFZpZXc6IFZpZXdEYXRhKSB7XG4gIGxldCBjdXJyVmlldzogVmlld0RhdGF8bnVsbCA9IHZpZXc7XG4gIHdoaWxlIChjdXJyVmlldyAmJiBjdXJyVmlldyAhPT0gZW5kVmlldykge1xuICAgIGN1cnJWaWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXdzO1xuICAgIGN1cnJWaWV3ID0gY3VyclZpZXcudmlld0NvbnRhaW5lclBhcmVudCB8fCBjdXJyVmlldy5wYXJlbnQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSk6IGJvb2xlYW58dW5kZWZpbmVkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbbm9kZUluZGV4XTtcbiAgICBjb25zdCBzdGFydFZpZXcgPSBub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudFZpZXcgP1xuICAgICAgICBhc0VsZW1lbnREYXRhKHZpZXcsIG5vZGVJbmRleCkuY29tcG9uZW50VmlldyA6XG4gICAgICAgIHZpZXc7XG4gICAgbWFya1BhcmVudFZpZXdzRm9yQ2hlY2soc3RhcnRWaWV3KTtcbiAgICByZXR1cm4gU2VydmljZXMuaGFuZGxlRXZlbnQodmlldywgbm9kZUluZGV4LCBldmVudE5hbWUsIGV2ZW50KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIEF0dGVudGlvbjogRG9uJ3QgcmV0aHJvdywgYXMgaXQgd291bGQgY2FuY2VsIE9ic2VydmFibGUgc3Vic2NyaXB0aW9ucyFcbiAgICB2aWV3LnJvb3QuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNsYXJlZFZpZXdDb250YWluZXIodmlldzogVmlld0RhdGEpOiBFbGVtZW50RGF0YXxudWxsIHtcbiAgaWYgKHZpZXcucGFyZW50KSB7XG4gICAgY29uc3QgcGFyZW50VmlldyA9IHZpZXcucGFyZW50O1xuICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHBhcmVudFZpZXcsIHZpZXcucGFyZW50Tm9kZURlZiAhLm5vZGVJbmRleCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogZm9yIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyB0aGUgaG9zdCBlbGVtZW50LlxuICogZm9yIGVtYmVkZGVkIHZpZXdzLCB0aGlzIGlzIHRoZSBpbmRleCBvZiB0aGUgcGFyZW50IG5vZGVcbiAqIHRoYXQgY29udGFpbnMgdGhlIHZpZXcgY29udGFpbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdmlld1BhcmVudEVsKHZpZXc6IFZpZXdEYXRhKTogTm9kZURlZnxudWxsIHtcbiAgY29uc3QgcGFyZW50VmlldyA9IHZpZXcucGFyZW50O1xuICBpZiAocGFyZW50Vmlldykge1xuICAgIHJldHVybiB2aWV3LnBhcmVudE5vZGVEZWYgIS5wYXJlbnQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlck5vZGUodmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZik6IGFueSB7XG4gIHN3aXRjaCAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQ6XG4gICAgICByZXR1cm4gYXNFbGVtZW50RGF0YSh2aWV3LCBkZWYubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50O1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVUZXh0OlxuICAgICAgcmV0dXJuIGFzVGV4dERhdGEodmlldywgZGVmLm5vZGVJbmRleCkucmVuZGVyVGV4dDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEV2ZW50RnVsbE5hbWUodGFyZ2V0OiBzdHJpbmcgfCBudWxsLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGFyZ2V0ID8gYCR7dGFyZ2V0fToke25hbWV9YCA6IG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudFZpZXcodmlldzogVmlld0RhdGEpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhdmlldy5wYXJlbnQgJiYgISEodmlldy5wYXJlbnROb2RlRGVmICEuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRW1iZWRkZWRWaWV3KHZpZXc6IFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIXZpZXcucGFyZW50ICYmICEodmlldy5wYXJlbnROb2RlRGVmICEuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlclF1ZXJ5SWQocXVlcnlJZDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIDEgPDwgKHF1ZXJ5SWQgJSAzMik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdE1hdGNoZWRRdWVyaWVzRHNsKFxuICAgIG1hdGNoZWRRdWVyaWVzRHNsOiBbc3RyaW5nIHwgbnVtYmVyLCBRdWVyeVZhbHVlVHlwZV1bXSB8IG51bGwpOiB7XG4gIG1hdGNoZWRRdWVyaWVzOiB7W3F1ZXJ5SWQ6IHN0cmluZ106IFF1ZXJ5VmFsdWVUeXBlfSxcbiAgcmVmZXJlbmNlczoge1tyZWZJZDogc3RyaW5nXTogUXVlcnlWYWx1ZVR5cGV9LFxuICBtYXRjaGVkUXVlcnlJZHM6IG51bWJlclxufSB7XG4gIGNvbnN0IG1hdGNoZWRRdWVyaWVzOiB7W3F1ZXJ5SWQ6IHN0cmluZ106IFF1ZXJ5VmFsdWVUeXBlfSA9IHt9O1xuICBsZXQgbWF0Y2hlZFF1ZXJ5SWRzID0gMDtcbiAgY29uc3QgcmVmZXJlbmNlczoge1tyZWZJZDogc3RyaW5nXTogUXVlcnlWYWx1ZVR5cGV9ID0ge307XG4gIGlmIChtYXRjaGVkUXVlcmllc0RzbCkge1xuICAgIG1hdGNoZWRRdWVyaWVzRHNsLmZvckVhY2goKFtxdWVyeUlkLCB2YWx1ZVR5cGVdKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHF1ZXJ5SWQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIG1hdGNoZWRRdWVyaWVzW3F1ZXJ5SWRdID0gdmFsdWVUeXBlO1xuICAgICAgICBtYXRjaGVkUXVlcnlJZHMgfD0gZmlsdGVyUXVlcnlJZChxdWVyeUlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZmVyZW5jZXNbcXVlcnlJZF0gPSB2YWx1ZVR5cGU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIHttYXRjaGVkUXVlcmllcywgcmVmZXJlbmNlcywgbWF0Y2hlZFF1ZXJ5SWRzfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0RGVwc0RzbChkZXBzOiAoW0RlcEZsYWdzLCBhbnldIHwgYW55KVtdLCBzb3VyY2VOYW1lPzogc3RyaW5nKTogRGVwRGVmW10ge1xuICByZXR1cm4gZGVwcy5tYXAodmFsdWUgPT4ge1xuICAgIGxldCB0b2tlbjogYW55O1xuICAgIGxldCBmbGFnczogRGVwRmxhZ3M7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBbZmxhZ3MsIHRva2VuXSA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGFncyA9IERlcEZsYWdzLk5vbmU7XG4gICAgICB0b2tlbiA9IHZhbHVlO1xuICAgIH1cbiAgICBpZiAodG9rZW4gJiYgKHR5cGVvZiB0b2tlbiA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgdG9rZW4gPT09ICdvYmplY3QnKSAmJiBzb3VyY2VOYW1lKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodG9rZW4sIFNPVVJDRSwge3ZhbHVlOiBzb3VyY2VOYW1lLCBjb25maWd1cmFibGU6IHRydWV9KTtcbiAgICB9XG4gICAgcmV0dXJuIHtmbGFncywgdG9rZW4sIHRva2VuS2V5OiB0b2tlbktleSh0b2tlbil9O1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFJlbmRlckVsZW1lbnQodmlldzogVmlld0RhdGEsIHJlbmRlckhvc3Q6IGFueSwgZGVmOiBOb2RlRGVmKTogYW55IHtcbiAgbGV0IHJlbmRlclBhcmVudCA9IGRlZi5yZW5kZXJQYXJlbnQ7XG4gIGlmIChyZW5kZXJQYXJlbnQpIHtcbiAgICBpZiAoKHJlbmRlclBhcmVudC5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkgPT09IDAgfHxcbiAgICAgICAgKHJlbmRlclBhcmVudC5mbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnRWaWV3KSA9PT0gMCB8fFxuICAgICAgICAocmVuZGVyUGFyZW50LmVsZW1lbnQgIS5jb21wb25lbnRSZW5kZXJlclR5cGUgJiZcbiAgICAgICAgIHJlbmRlclBhcmVudC5lbGVtZW50ICEuY29tcG9uZW50UmVuZGVyZXJUeXBlICEuZW5jYXBzdWxhdGlvbiA9PT1cbiAgICAgICAgICAgICBWaWV3RW5jYXBzdWxhdGlvbi5OYXRpdmUpKSB7XG4gICAgICAvLyBvbmx5IGNoaWxkcmVuIG9mIG5vbiBjb21wb25lbnRzLCBvciBjaGlsZHJlbiBvZiBjb21wb25lbnRzIHdpdGggbmF0aXZlIGVuY2Fwc3VsYXRpb24gc2hvdWxkXG4gICAgICAvLyBiZSBhdHRhY2hlZC5cbiAgICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHZpZXcsIGRlZi5yZW5kZXJQYXJlbnQgIS5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiByZW5kZXJIb3N0O1xuICB9XG59XG5cbmNvbnN0IERFRklOSVRJT05fQ0FDSEUgPSBuZXcgV2Vha01hcDxhbnksIERlZmluaXRpb248YW55Pj4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEZWZpbml0aW9uPEQgZXh0ZW5kcyBEZWZpbml0aW9uPGFueT4+KGZhY3Rvcnk6IERlZmluaXRpb25GYWN0b3J5PEQ+KTogRCB7XG4gIGxldCB2YWx1ZSA9IERFRklOSVRJT05fQ0FDSEUuZ2V0KGZhY3RvcnkpICFhcyBEO1xuICBpZiAoIXZhbHVlKSB7XG4gICAgdmFsdWUgPSBmYWN0b3J5KCgpID0+IE5PT1ApO1xuICAgIHZhbHVlLmZhY3RvcnkgPSBmYWN0b3J5O1xuICAgIERFRklOSVRJT05fQ0FDSEUuc2V0KGZhY3RvcnksIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb290UmVuZGVyTm9kZXModmlldzogVmlld0RhdGEpOiBhbnlbXSB7XG4gIGNvbnN0IHJlbmRlck5vZGVzOiBhbnlbXSA9IFtdO1xuICB2aXNpdFJvb3RSZW5kZXJOb2Rlcyh2aWV3LCBSZW5kZXJOb2RlQWN0aW9uLkNvbGxlY3QsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCByZW5kZXJOb2Rlcyk7XG4gIHJldHVybiByZW5kZXJOb2Rlcztcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gUmVuZGVyTm9kZUFjdGlvbiB7Q29sbGVjdCwgQXBwZW5kQ2hpbGQsIEluc2VydEJlZm9yZSwgUmVtb3ZlQ2hpbGR9XG5cbmV4cG9ydCBmdW5jdGlvbiB2aXNpdFJvb3RSZW5kZXJOb2RlcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgYWN0aW9uOiBSZW5kZXJOb2RlQWN0aW9uLCBwYXJlbnROb2RlOiBhbnksIG5leHRTaWJsaW5nOiBhbnksIHRhcmdldD86IGFueVtdKSB7XG4gIC8vIFdlIG5lZWQgdG8gcmUtY29tcHV0ZSB0aGUgcGFyZW50IG5vZGUgaW4gY2FzZSB0aGUgbm9kZXMgaGF2ZSBiZWVuIG1vdmVkIGFyb3VuZCBtYW51YWxseVxuICBpZiAoYWN0aW9uID09PSBSZW5kZXJOb2RlQWN0aW9uLlJlbW92ZUNoaWxkKSB7XG4gICAgcGFyZW50Tm9kZSA9IHZpZXcucmVuZGVyZXIucGFyZW50Tm9kZShyZW5kZXJOb2RlKHZpZXcsIHZpZXcuZGVmLmxhc3RSZW5kZXJSb290Tm9kZSAhKSk7XG4gIH1cbiAgdmlzaXRTaWJsaW5nUmVuZGVyTm9kZXMoXG4gICAgICB2aWV3LCBhY3Rpb24sIDAsIHZpZXcuZGVmLm5vZGVzLmxlbmd0aCAtIDEsIHBhcmVudE5vZGUsIG5leHRTaWJsaW5nLCB0YXJnZXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmlzaXRTaWJsaW5nUmVuZGVyTm9kZXMoXG4gICAgdmlldzogVmlld0RhdGEsIGFjdGlvbjogUmVuZGVyTm9kZUFjdGlvbiwgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyLCBwYXJlbnROb2RlOiBhbnksXG4gICAgbmV4dFNpYmxpbmc6IGFueSwgdGFyZ2V0PzogYW55W10pIHtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPD0gZW5kSW5kZXg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIChOb2RlRmxhZ3MuVHlwZUVsZW1lbnQgfCBOb2RlRmxhZ3MuVHlwZVRleHQgfCBOb2RlRmxhZ3MuVHlwZU5nQ29udGVudCkpIHtcbiAgICAgIHZpc2l0UmVuZGVyTm9kZSh2aWV3LCBub2RlRGVmLCBhY3Rpb24sIHBhcmVudE5vZGUsIG5leHRTaWJsaW5nLCB0YXJnZXQpO1xuICAgIH1cbiAgICAvLyBqdW1wIHRvIG5leHQgc2libGluZ1xuICAgIGkgKz0gbm9kZURlZi5jaGlsZENvdW50O1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2aXNpdFByb2plY3RlZFJlbmRlck5vZGVzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBuZ0NvbnRlbnRJbmRleDogbnVtYmVyLCBhY3Rpb246IFJlbmRlck5vZGVBY3Rpb24sIHBhcmVudE5vZGU6IGFueSxcbiAgICBuZXh0U2libGluZzogYW55LCB0YXJnZXQ/OiBhbnlbXSkge1xuICBsZXQgY29tcFZpZXc6IFZpZXdEYXRhfG51bGwgPSB2aWV3O1xuICB3aGlsZSAoY29tcFZpZXcgJiYgIWlzQ29tcG9uZW50Vmlldyhjb21wVmlldykpIHtcbiAgICBjb21wVmlldyA9IGNvbXBWaWV3LnBhcmVudDtcbiAgfVxuICBjb25zdCBob3N0VmlldyA9IGNvbXBWaWV3ICEucGFyZW50O1xuICBjb25zdCBob3N0RWxEZWYgPSB2aWV3UGFyZW50RWwoY29tcFZpZXcgISk7XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSBob3N0RWxEZWYgIS5ub2RlSW5kZXggKyAxO1xuICBjb25zdCBlbmRJbmRleCA9IGhvc3RFbERlZiAhLm5vZGVJbmRleCArIGhvc3RFbERlZiAhLmNoaWxkQ291bnQ7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDw9IGVuZEluZGV4OyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gaG9zdFZpZXcgIS5kZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYubmdDb250ZW50SW5kZXggPT09IG5nQ29udGVudEluZGV4KSB7XG4gICAgICB2aXNpdFJlbmRlck5vZGUoaG9zdFZpZXcgISwgbm9kZURlZiwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICB9XG4gICAgLy8ganVtcCB0byBuZXh0IHNpYmxpbmdcbiAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgfVxuICBpZiAoIWhvc3RWaWV3ICEucGFyZW50KSB7XG4gICAgLy8gYSByb290IHZpZXdcbiAgICBjb25zdCBwcm9qZWN0ZWROb2RlcyA9IHZpZXcucm9vdC5wcm9qZWN0YWJsZU5vZGVzW25nQ29udGVudEluZGV4XTtcbiAgICBpZiAocHJvamVjdGVkTm9kZXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvamVjdGVkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhlY1JlbmRlck5vZGVBY3Rpb24odmlldywgcHJvamVjdGVkTm9kZXNbaV0sIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHZpc2l0UmVuZGVyTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgYWN0aW9uOiBSZW5kZXJOb2RlQWN0aW9uLCBwYXJlbnROb2RlOiBhbnksIG5leHRTaWJsaW5nOiBhbnksXG4gICAgdGFyZ2V0PzogYW55W10pIHtcbiAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZU5nQ29udGVudCkge1xuICAgIHZpc2l0UHJvamVjdGVkUmVuZGVyTm9kZXMoXG4gICAgICAgIHZpZXcsIG5vZGVEZWYubmdDb250ZW50ICEuaW5kZXgsIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgcm4gPSByZW5kZXJOb2RlKHZpZXcsIG5vZGVEZWYpO1xuICAgIGlmIChhY3Rpb24gPT09IFJlbmRlck5vZGVBY3Rpb24uUmVtb3ZlQ2hpbGQgJiYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50VmlldykgJiZcbiAgICAgICAgKG5vZGVEZWYuYmluZGluZ0ZsYWdzICYgQmluZGluZ0ZsYWdzLkNhdFN5bnRoZXRpY1Byb3BlcnR5KSkge1xuICAgICAgLy8gTm90ZTogd2UgbWlnaHQgbmVlZCB0byBkbyBib3RoIGFjdGlvbnMuXG4gICAgICBpZiAobm9kZURlZi5iaW5kaW5nRmxhZ3MgJiAoQmluZGluZ0ZsYWdzLlN5bnRoZXRpY1Byb3BlcnR5KSkge1xuICAgICAgICBleGVjUmVuZGVyTm9kZUFjdGlvbih2aWV3LCBybiwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlRGVmLmJpbmRpbmdGbGFncyAmIChCaW5kaW5nRmxhZ3MuU3ludGhldGljSG9zdFByb3BlcnR5KSkge1xuICAgICAgICBjb25zdCBjb21wVmlldyA9IGFzRWxlbWVudERhdGEodmlldywgbm9kZURlZi5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXc7XG4gICAgICAgIGV4ZWNSZW5kZXJOb2RlQWN0aW9uKGNvbXBWaWV3LCBybiwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZXhlY1JlbmRlck5vZGVBY3Rpb24odmlldywgcm4sIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgfVxuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkVtYmVkZGVkVmlld3MpIHtcbiAgICAgIGNvbnN0IGVtYmVkZGVkVmlld3MgPSBhc0VsZW1lbnREYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS52aWV3Q29udGFpbmVyICEuX2VtYmVkZGVkVmlld3M7XG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IGVtYmVkZGVkVmlld3MubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgdmlzaXRSb290UmVuZGVyTm9kZXMoZW1iZWRkZWRWaWV3c1trXSwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQgJiYgIW5vZGVEZWYuZWxlbWVudCAhLm5hbWUpIHtcbiAgICAgIHZpc2l0U2libGluZ1JlbmRlck5vZGVzKFxuICAgICAgICAgIHZpZXcsIGFjdGlvbiwgbm9kZURlZi5ub2RlSW5kZXggKyAxLCBub2RlRGVmLm5vZGVJbmRleCArIG5vZGVEZWYuY2hpbGRDb3VudCwgcGFyZW50Tm9kZSxcbiAgICAgICAgICBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY1JlbmRlck5vZGVBY3Rpb24oXG4gICAgdmlldzogVmlld0RhdGEsIHJlbmRlck5vZGU6IGFueSwgYWN0aW9uOiBSZW5kZXJOb2RlQWN0aW9uLCBwYXJlbnROb2RlOiBhbnksIG5leHRTaWJsaW5nOiBhbnksXG4gICAgdGFyZ2V0PzogYW55W10pIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3LnJlbmRlcmVyO1xuICBzd2l0Y2ggKGFjdGlvbikge1xuICAgIGNhc2UgUmVuZGVyTm9kZUFjdGlvbi5BcHBlbmRDaGlsZDpcbiAgICAgIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudE5vZGUsIHJlbmRlck5vZGUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBSZW5kZXJOb2RlQWN0aW9uLkluc2VydEJlZm9yZTpcbiAgICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnROb2RlLCByZW5kZXJOb2RlLCBuZXh0U2libGluZyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFJlbmRlck5vZGVBY3Rpb24uUmVtb3ZlQ2hpbGQ6XG4gICAgICByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnROb2RlLCByZW5kZXJOb2RlKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgUmVuZGVyTm9kZUFjdGlvbi5Db2xsZWN0OlxuICAgICAgdGFyZ2V0ICEucHVzaChyZW5kZXJOb2RlKTtcbiAgICAgIGJyZWFrO1xuICB9XG59XG5cbmNvbnN0IE5TX1BSRUZJWF9SRSA9IC9eOihbXjpdKyk6KC4rKSQvO1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXROYW1lc3BhY2UobmFtZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICBpZiAobmFtZVswXSA9PT0gJzonKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKE5TX1BSRUZJWF9SRSkgITtcbiAgICByZXR1cm4gW21hdGNoWzFdLCBtYXRjaFsyXV07XG4gIH1cbiAgcmV0dXJuIFsnJywgbmFtZV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjQmluZGluZ0ZsYWdzKGJpbmRpbmdzOiBCaW5kaW5nRGVmW10pOiBCaW5kaW5nRmxhZ3Mge1xuICBsZXQgZmxhZ3MgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgZmxhZ3MgfD0gYmluZGluZ3NbaV0uZmxhZ3M7XG4gIH1cbiAgcmV0dXJuIGZsYWdzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGUodmFsdWVDb3VudDogbnVtYmVyLCBjb25zdEFuZEludGVycDogc3RyaW5nW10pOiBzdHJpbmcge1xuICBsZXQgcmVzdWx0ID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVDb3VudCAqIDI7IGkgPSBpICsgMikge1xuICAgIHJlc3VsdCA9IHJlc3VsdCArIGNvbnN0QW5kSW50ZXJwW2ldICsgX3RvU3RyaW5nV2l0aE51bGwoY29uc3RBbmRJbnRlcnBbaSArIDFdKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0ICsgY29uc3RBbmRJbnRlcnBbdmFsdWVDb3VudCAqIDJdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5saW5lSW50ZXJwb2xhdGUoXG4gICAgdmFsdWVDb3VudDogbnVtYmVyLCBjMDogc3RyaW5nLCBhMTogYW55LCBjMTogc3RyaW5nLCBhMj86IGFueSwgYzI/OiBzdHJpbmcsIGEzPzogYW55LFxuICAgIGMzPzogc3RyaW5nLCBhND86IGFueSwgYzQ/OiBzdHJpbmcsIGE1PzogYW55LCBjNT86IHN0cmluZywgYTY/OiBhbnksIGM2Pzogc3RyaW5nLCBhNz86IGFueSxcbiAgICBjNz86IHN0cmluZywgYTg/OiBhbnksIGM4Pzogc3RyaW5nLCBhOT86IGFueSwgYzk/OiBzdHJpbmcpOiBzdHJpbmcge1xuICBzd2l0Y2ggKHZhbHVlQ291bnQpIHtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMTtcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzICsgX3RvU3RyaW5nV2l0aE51bGwoYTQpICsgYzQ7XG4gICAgY2FzZSA1OlxuICAgICAgcmV0dXJuIGMwICsgX3RvU3RyaW5nV2l0aE51bGwoYTEpICsgYzEgKyBfdG9TdHJpbmdXaXRoTnVsbChhMikgKyBjMiArIF90b1N0cmluZ1dpdGhOdWxsKGEzKSArXG4gICAgICAgICAgYzMgKyBfdG9TdHJpbmdXaXRoTnVsbChhNCkgKyBjNCArIF90b1N0cmluZ1dpdGhOdWxsKGE1KSArIGM1O1xuICAgIGNhc2UgNjpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzICsgX3RvU3RyaW5nV2l0aE51bGwoYTQpICsgYzQgKyBfdG9TdHJpbmdXaXRoTnVsbChhNSkgKyBjNSArIF90b1N0cmluZ1dpdGhOdWxsKGE2KSArIGM2O1xuICAgIGNhc2UgNzpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzICsgX3RvU3RyaW5nV2l0aE51bGwoYTQpICsgYzQgKyBfdG9TdHJpbmdXaXRoTnVsbChhNSkgKyBjNSArIF90b1N0cmluZ1dpdGhOdWxsKGE2KSArXG4gICAgICAgICAgYzYgKyBfdG9TdHJpbmdXaXRoTnVsbChhNykgKyBjNztcbiAgICBjYXNlIDg6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyICsgX3RvU3RyaW5nV2l0aE51bGwoYTMpICtcbiAgICAgICAgICBjMyArIF90b1N0cmluZ1dpdGhOdWxsKGE0KSArIGM0ICsgX3RvU3RyaW5nV2l0aE51bGwoYTUpICsgYzUgKyBfdG9TdHJpbmdXaXRoTnVsbChhNikgK1xuICAgICAgICAgIGM2ICsgX3RvU3RyaW5nV2l0aE51bGwoYTcpICsgYzcgKyBfdG9TdHJpbmdXaXRoTnVsbChhOCkgKyBjODtcbiAgICBjYXNlIDk6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyICsgX3RvU3RyaW5nV2l0aE51bGwoYTMpICtcbiAgICAgICAgICBjMyArIF90b1N0cmluZ1dpdGhOdWxsKGE0KSArIGM0ICsgX3RvU3RyaW5nV2l0aE51bGwoYTUpICsgYzUgKyBfdG9TdHJpbmdXaXRoTnVsbChhNikgK1xuICAgICAgICAgIGM2ICsgX3RvU3RyaW5nV2l0aE51bGwoYTcpICsgYzcgKyBfdG9TdHJpbmdXaXRoTnVsbChhOCkgKyBjOCArIF90b1N0cmluZ1dpdGhOdWxsKGE5KSArIGM5O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYERvZXMgbm90IHN1cHBvcnQgbW9yZSB0aGFuIDkgZXhwcmVzc2lvbnNgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfdG9TdHJpbmdXaXRoTnVsbCh2OiBhbnkpOiBzdHJpbmcge1xuICByZXR1cm4gdiAhPSBudWxsID8gdi50b1N0cmluZygpIDogJyc7XG59XG5cbmV4cG9ydCBjb25zdCBFTVBUWV9BUlJBWTogYW55W10gPSBbXTtcbmV4cG9ydCBjb25zdCBFTVBUWV9NQVA6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4iXX0=