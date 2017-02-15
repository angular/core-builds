/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WrappedValue, devModeEqual } from '../change_detection/change_detection';
import { looseIdentical, stringify } from '../facade/lang';
import { expressionChangedAfterItHasBeenCheckedError } from './errors';
import { NodeFlags, NodeType, Services, ViewFlags, ViewState, asElementData, asProviderData, asTextData } from './types';
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
        return asElementData(parentView, view.parentIndex);
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
export function viewParentElIndex(view) {
    var /** @type {?} */ parentView = view.parent;
    if (parentView) {
        return parentView.def.nodes[view.parentIndex].parent;
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
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function nodeValue(view, index) {
    var /** @type {?} */ def = view.def.nodes[index];
    switch (def.type) {
        case NodeType.Element:
            return asElementData(view, def.index).renderElement;
        case NodeType.Text:
            return asTextData(view, def.index).renderText;
        case NodeType.Directive:
        case NodeType.Pipe:
        case NodeType.Provider:
            return asProviderData(view, def.index).instance;
    }
    return undefined;
}
/**
 * @param {?} queryId
 * @return {?}
 */
export function queryIdIsReference(queryId) {
    return queryId.startsWith('#');
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
        parentNode = view.root.renderer.parentNode(renderNode(view, view.def.lastRootNode));
    }
    var /** @type {?} */ len = view.def.nodes.length;
    for (var /** @type {?} */ i = 0; i < len; i++) {
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
    var /** @type {?} */ hostElDef = hostView.def.nodes[viewParentElIndex(compView)];
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
    var /** @type {?} */ renderer = view.root.renderer;
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
//# sourceMappingURL=util.js.map