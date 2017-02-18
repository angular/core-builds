/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WrappedValue, devModeEqual } from '../change_detection/change_detection';
import { looseIdentical, stringify } from '../facade/lang';
import { ViewEncapsulation } from '../metadata/view';
import { expressionChangedAfterItHasBeenCheckedError } from './errors';
import { NodeFlags, NodeType, Services, ViewFlags, ViewState, asElementData, asTextData } from './types';
var /** @type {?} */ _tokenKeyCache = new Map();
/**
 * @param {?} token
 * @return {?}
 */
export function tokenKey(token) {
    var /** @type {?} */ key = _tokenKeyCache.get(token);
    if (!key) {
        key = stringify(token) + '_' + _tokenKeyCache.size;
        _tokenKeyCache.set(token, key);
    }
    return key;
}
var /** @type {?} */ unwrapCounter = 0;
/**
 * @param {?} value
 * @return {?}
 */
export function unwrapValue(value) {
    if (value instanceof WrappedValue) {
        value = value.wrapped;
        unwrapCounter++;
    }
    return value;
}
var /** @type {?} */ _renderCompCount = 0;
/**
 * @param {?} values
 * @return {?}
 */
export function createRendererTypeV2(values) {
    var /** @type {?} */ isFilled = values && (values.encapsulation !== ViewEncapsulation.None ||
        values.styles.length || Object.keys(values.data).length);
    if (isFilled) {
        var /** @type {?} */ id = "c" + _renderCompCount++;
        return { id: id, styles: values.styles, encapsulation: values.encapsulation, data: values.data };
    }
    else {
        return null;
    }
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} bindingIdx
 * @param {?} value
 * @return {?}
 */
export function checkBinding(view, def, bindingIdx, value) {
    var /** @type {?} */ oldValue = view.oldValues[def.bindingIndex + bindingIdx];
    return unwrapCounter > 0 || !!(view.state & ViewState.FirstCheck) ||
        !devModeEqual(oldValue, value);
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} bindingIdx
 * @param {?} value
 * @return {?}
 */
export function checkBindingNoChanges(view, def, bindingIdx, value) {
    var /** @type {?} */ oldValue = view.oldValues[def.bindingIndex + bindingIdx];
    if (unwrapCounter || (view.state & ViewState.FirstCheck) || !devModeEqual(oldValue, value)) {
        unwrapCounter = 0;
        throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, def.index), oldValue, value, (view.state & ViewState.FirstCheck) !== 0);
    }
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} bindingIdx
 * @param {?} value
 * @return {?}
 */
export function checkAndUpdateBinding(view, def, bindingIdx, value) {
    var /** @type {?} */ oldValues = view.oldValues;
    if (unwrapCounter || (view.state & ViewState.FirstCheck) ||
        !looseIdentical(oldValues[def.bindingIndex + bindingIdx], value)) {
        unwrapCounter = 0;
        oldValues[def.bindingIndex + bindingIdx] = value;
        return true;
    }
    return false;
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @param {?} eventName
 * @param {?} event
 * @return {?}
 */
export function dispatchEvent(view, nodeIndex, eventName, event) {
    var /** @type {?} */ currView = view;
    while (currView) {
        if (currView.def.flags & ViewFlags.OnPush) {
            currView.state |= ViewState.ChecksEnabled;
        }
        currView = currView.parent;
    }
    return Services.handleEvent(view, nodeIndex, eventName, event);
}
/**
 * @param {?} view
 * @return {?}
 */
export function declaredViewContainer(view) {
    if (view.parent) {
        var /** @type {?} */ parentView = view.parent;
        return asElementData(parentView, view.parentNodeDef.index);
    }
    return undefined;
}
/**
 * for component views, this is the host element.
 * for embedded views, this is the index of the parent node
 * that contains the view container.
 * @param {?} view
 * @return {?}
 */
export function viewParentEl(view) {
    var /** @type {?} */ parentView = view.parent;
    if (parentView) {
        return view.parentNodeDef.parent;
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
    switch (def.type) {
        case NodeType.Element:
            return asElementData(view, def.index).renderElement;
        case NodeType.Text:
            return asTextData(view, def.index).renderText;
    }
}
/**
 * @param {?} target
 * @param {?} name
 * @return {?}
 */
export function elementEventFullName(target, name) {
    return target ? target + ":" + name : name;
}
/**
 * @param {?} view
 * @return {?}
 */
export function isComponentView(view) {
    return view.component === view.context && !!view.parent;
}
/**
 * @param {?} view
 * @return {?}
 */
export function isEmbeddedView(view) {
    return view.component !== view.context && !!view.parent;
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
    var /** @type {?} */ matchedQueries = {};
    var /** @type {?} */ matchedQueryIds = 0;
    var /** @type {?} */ references = {};
    if (matchedQueriesDsl) {
        matchedQueriesDsl.forEach(function (_a) {
            var queryId = _a[0], valueType = _a[1];
            if (typeof queryId === 'number') {
                matchedQueries[queryId] = valueType;
                matchedQueryIds |= filterQueryId(queryId);
            }
            else {
                references[queryId] = valueType;
            }
        });
    }
    return { matchedQueries: matchedQueries, references: references, matchedQueryIds: matchedQueryIds };
}
/**
 * @param {?} view
 * @param {?} renderHost
 * @param {?} def
 * @return {?}
 */
export function getParentRenderElement(view, renderHost, def) {
    var /** @type {?} */ renderParent = def.renderParent;
    if (renderParent) {
        var /** @type {?} */ parent_1 = def.parent;
        if (parent_1 && (parent_1.type !== NodeType.Element || !parent_1.element.component ||
            (parent_1.element.component.provider.rendererType &&
                parent_1.element.component.provider.rendererType.encapsulation ===
                    ViewEncapsulation.Native))) {
            // only children of non components, or children of components with native encapsulation should
            // be attached.
            return asElementData(view, def.renderParent.index).renderElement;
        }
    }
    else {
        return renderHost;
    }
}
var /** @type {?} */ VIEW_DEFINITION_CACHE = new WeakMap();
/**
 * @param {?} factory
 * @return {?}
 */
export function resolveViewDefinition(factory) {
    var /** @type {?} */ value = VIEW_DEFINITION_CACHE.get(factory);
    if (!value) {
        value = factory();
        VIEW_DEFINITION_CACHE.set(factory, value);
    }
    return value;
}
/**
 * @param {?} start
 * @param {?} end
 * @return {?}
 */
export function sliceErrorStack(start, end) {
    var /** @type {?} */ err;
    try {
        throw new Error();
    }
    catch (e) {
        err = e;
    }
    var /** @type {?} */ stack = err.stack || '';
    var /** @type {?} */ lines = stack.split('\n');
    if (lines[0].startsWith('Error')) {
        // Chrome always adds the message to the stack as well...
        start++;
        end++;
    }
    return lines.slice(start, end).join('\n');
}
/**
 * @param {?} view
 * @return {?}
 */
export function rootRenderNodes(view) {
    var /** @type {?} */ renderNodes = [];
    visitRootRenderNodes(view, RenderNodeAction.Collect, undefined, undefined, renderNodes);
    return renderNodes;
}
export var RenderNodeAction = {};
RenderNodeAction.Collect = 0;
RenderNodeAction.AppendChild = 1;
RenderNodeAction.InsertBefore = 2;
RenderNodeAction.RemoveChild = 3;
RenderNodeAction[RenderNodeAction.Collect] = "Collect";
RenderNodeAction[RenderNodeAction.AppendChild] = "AppendChild";
RenderNodeAction[RenderNodeAction.InsertBefore] = "InsertBefore";
RenderNodeAction[RenderNodeAction.RemoveChild] = "RemoveChild";
/**
 * @param {?} view
 * @param {?} action
 * @param {?} parentNode
 * @param {?} nextSibling
 * @param {?} target
 * @return {?}
 */
export function visitRootRenderNodes(view, action, parentNode, nextSibling, target) {
    // We need to re-compute the parent node in case the nodes have been moved around manually
    if (action === RenderNodeAction.RemoveChild) {
        parentNode = view.renderer.parentNode(renderNode(view, view.def.lastRootNode));
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
 * @param {?} target
 * @return {?}
 */
export function visitSiblingRenderNodes(view, action, startIndex, endIndex, parentNode, nextSibling, target) {
    for (var /** @type {?} */ i = startIndex; i <= endIndex; i++) {
        var /** @type {?} */ nodeDef = view.def.nodes[i];
        if (nodeDef.type === NodeType.Element || nodeDef.type === NodeType.Text ||
            nodeDef.type === NodeType.NgContent) {
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
 * @param {?} target
 * @return {?}
 */
export function visitProjectedRenderNodes(view, ngContentIndex, action, parentNode, nextSibling, target) {
    var /** @type {?} */ compView = view;
    while (compView && !isComponentView(compView)) {
        compView = compView.parent;
    }
    var /** @type {?} */ hostView = compView.parent;
    var /** @type {?} */ hostElDef = viewParentEl(compView);
    var /** @type {?} */ startIndex = hostElDef.index + 1;
    var /** @type {?} */ endIndex = hostElDef.index + hostElDef.childCount;
    for (var /** @type {?} */ i = startIndex; i <= endIndex; i++) {
        var /** @type {?} */ nodeDef = hostView.def.nodes[i];
        if (nodeDef.ngContentIndex === ngContentIndex) {
            visitRenderNode(hostView, nodeDef, action, parentNode, nextSibling, target);
        }
        // jump to next sibling
        i += nodeDef.childCount;
    }
    if (!hostView.parent) {
        // a root view
        var /** @type {?} */ projectedNodes = view.root.projectableNodes[ngContentIndex];
        if (projectedNodes) {
            for (var /** @type {?} */ i = 0; i < projectedNodes.length; i++) {
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
 * @param {?} target
 * @return {?}
 */
function visitRenderNode(view, nodeDef, action, parentNode, nextSibling, target) {
    if (nodeDef.type === NodeType.NgContent) {
        visitProjectedRenderNodes(view, nodeDef.ngContent.index, action, parentNode, nextSibling, target);
    }
    else {
        var /** @type {?} */ rn = renderNode(view, nodeDef);
        execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
        if (nodeDef.flags & NodeFlags.HasEmbeddedViews) {
            var /** @type {?} */ embeddedViews = asElementData(view, nodeDef.index).embeddedViews;
            if (embeddedViews) {
                for (var /** @type {?} */ k = 0; k < embeddedViews.length; k++) {
                    visitRootRenderNodes(embeddedViews[k], action, parentNode, nextSibling, target);
                }
            }
        }
        if (nodeDef.type === NodeType.Element && !nodeDef.element.name) {
            visitSiblingRenderNodes(view, action, nodeDef.index + 1, nodeDef.index + nodeDef.childCount, parentNode, nextSibling, target);
        }
    }
}
/**
 * @param {?} view
 * @param {?} renderNode
 * @param {?} action
 * @param {?} parentNode
 * @param {?} nextSibling
 * @param {?} target
 * @return {?}
 */
function execRenderNodeAction(view, renderNode, action, parentNode, nextSibling, target) {
    var /** @type {?} */ renderer = view.renderer;
    switch (action) {
        case RenderNodeAction.AppendChild:
            renderer.appendChild(parentNode, renderNode);
            break;
        case RenderNodeAction.InsertBefore:
            renderer.insertBefore(parentNode, renderNode, nextSibling);
            break;
        case RenderNodeAction.RemoveChild:
            renderer.removeChild(parentNode, renderNode);
            break;
        case RenderNodeAction.Collect:
            target.push(renderNode);
            break;
    }
}
var /** @type {?} */ NS_PREFIX_RE = /^:([^:]+):(.+)$/;
/**
 * @param {?} name
 * @return {?}
 */
export function splitNamespace(name) {
    if (name[0] === ':') {
        var /** @type {?} */ match = name.match(NS_PREFIX_RE);
        return [match[1], match[2]];
    }
    return ['', name];
}
//# sourceMappingURL=util.js.map