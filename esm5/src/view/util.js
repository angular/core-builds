/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { WrappedValue, devModeEqual } from '../change_detection/change_detection';
import { SOURCE } from '../di/injector';
import { ViewEncapsulation } from '../metadata/view';
import { looseIdentical, stringify } from '../util';
import { expressionChangedAfterItHasBeenCheckedError } from './errors';
import { Services, asElementData, asTextData } from './types';
export var NOOP = function () { };
var _tokenKeyCache = new Map();
export function tokenKey(token) {
    var key = _tokenKeyCache.get(token);
    if (!key) {
        key = stringify(token) + '_' + _tokenKeyCache.size;
        _tokenKeyCache.set(token, key);
    }
    return key;
}
export function unwrapValue(view, nodeIdx, bindingIdx, value) {
    if (WrappedValue.isWrapped(value)) {
        value = WrappedValue.unwrap(value);
        var globalBindingIdx = view.def.nodes[nodeIdx].bindingIndex + bindingIdx;
        var oldValue = WrappedValue.unwrap(view.oldValues[globalBindingIdx]);
        view.oldValues[globalBindingIdx] = new WrappedValue(oldValue);
    }
    return value;
}
var UNDEFINED_RENDERER_TYPE_ID = '$$undefined';
var EMPTY_RENDERER_TYPE_ID = '$$empty';
// Attention: this function is called as top level function.
// Putting any logic in here will destroy closure tree shaking!
export function createRendererType2(values) {
    return {
        id: UNDEFINED_RENDERER_TYPE_ID,
        styles: values.styles,
        encapsulation: values.encapsulation,
        data: values.data
    };
}
var _renderCompCount = 0;
export function resolveRendererType2(type) {
    if (type && type.id === UNDEFINED_RENDERER_TYPE_ID) {
        // first time we see this RendererType2. Initialize it...
        var isFilled = ((type.encapsulation != null && type.encapsulation !== ViewEncapsulation.None) ||
            type.styles.length || Object.keys(type.data).length);
        if (isFilled) {
            type.id = "c" + _renderCompCount++;
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
export function checkBinding(view, def, bindingIdx, value) {
    var oldValues = view.oldValues;
    if ((view.state & 2 /* FirstCheck */) ||
        !looseIdentical(oldValues[def.bindingIndex + bindingIdx], value)) {
        return true;
    }
    return false;
}
export function checkAndUpdateBinding(view, def, bindingIdx, value) {
    if (checkBinding(view, def, bindingIdx, value)) {
        view.oldValues[def.bindingIndex + bindingIdx] = value;
        return true;
    }
    return false;
}
export function checkBindingNoChanges(view, def, bindingIdx, value) {
    var oldValue = view.oldValues[def.bindingIndex + bindingIdx];
    if ((view.state & 1 /* BeforeFirstCheck */) || !devModeEqual(oldValue, value)) {
        var bindingName = def.bindings[bindingIdx].name;
        throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, def.nodeIndex), bindingName + ": " + oldValue, bindingName + ": " + value, (view.state & 1 /* BeforeFirstCheck */) !== 0);
    }
}
export function markParentViewsForCheck(view) {
    var currView = view;
    while (currView) {
        if (currView.def.flags & 2 /* OnPush */) {
            currView.state |= 8 /* ChecksEnabled */;
        }
        currView = currView.viewContainerParent || currView.parent;
    }
}
export function markParentViewsForCheckProjectedViews(view, endView) {
    var currView = view;
    while (currView && currView !== endView) {
        currView.state |= 64 /* CheckProjectedViews */;
        currView = currView.viewContainerParent || currView.parent;
    }
}
export function dispatchEvent(view, nodeIndex, eventName, event) {
    try {
        var nodeDef = view.def.nodes[nodeIndex];
        var startView = nodeDef.flags & 33554432 /* ComponentView */ ?
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
export function declaredViewContainer(view) {
    if (view.parent) {
        var parentView = view.parent;
        return asElementData(parentView, view.parentNodeDef.nodeIndex);
    }
    return null;
}
/**
 * for component views, this is the host element.
 * for embedded views, this is the index of the parent node
 * that contains the view container.
 */
export function viewParentEl(view) {
    var parentView = view.parent;
    if (parentView) {
        return view.parentNodeDef.parent;
    }
    else {
        return null;
    }
}
export function renderNode(view, def) {
    switch (def.flags & 201347067 /* Types */) {
        case 1 /* TypeElement */:
            return asElementData(view, def.nodeIndex).renderElement;
        case 2 /* TypeText */:
            return asTextData(view, def.nodeIndex).renderText;
    }
}
export function elementEventFullName(target, name) {
    return target ? target + ":" + name : name;
}
export function isComponentView(view) {
    return !!view.parent && !!(view.parentNodeDef.flags & 32768 /* Component */);
}
export function isEmbeddedView(view) {
    return !!view.parent && !(view.parentNodeDef.flags & 32768 /* Component */);
}
export function filterQueryId(queryId) {
    return 1 << (queryId % 32);
}
export function splitMatchedQueriesDsl(matchedQueriesDsl) {
    var matchedQueries = {};
    var matchedQueryIds = 0;
    var references = {};
    if (matchedQueriesDsl) {
        matchedQueriesDsl.forEach(function (_a) {
            var _b = tslib_1.__read(_a, 2), queryId = _b[0], valueType = _b[1];
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
export function splitDepsDsl(deps, sourceName) {
    return deps.map(function (value) {
        var token;
        var flags;
        if (Array.isArray(value)) {
            _a = tslib_1.__read(value, 2), flags = _a[0], token = _a[1];
        }
        else {
            flags = 0 /* None */;
            token = value;
        }
        if (token && (typeof token === 'function' || typeof token === 'object') && sourceName) {
            Object.defineProperty(token, SOURCE, { value: sourceName, configurable: true });
        }
        return { flags: flags, token: token, tokenKey: tokenKey(token) };
        var _a;
    });
}
export function getParentRenderElement(view, renderHost, def) {
    var renderParent = def.renderParent;
    if (renderParent) {
        if ((renderParent.flags & 1 /* TypeElement */) === 0 ||
            (renderParent.flags & 33554432 /* ComponentView */) === 0 ||
            (renderParent.element.componentRendererType &&
                renderParent.element.componentRendererType.encapsulation ===
                    ViewEncapsulation.Native)) {
            // only children of non components, or children of components with native encapsulation should
            // be attached.
            return asElementData(view, def.renderParent.nodeIndex).renderElement;
        }
    }
    else {
        return renderHost;
    }
}
var DEFINITION_CACHE = new WeakMap();
export function resolveDefinition(factory) {
    var value = DEFINITION_CACHE.get(factory);
    if (!value) {
        value = factory(function () { return NOOP; });
        value.factory = factory;
        DEFINITION_CACHE.set(factory, value);
    }
    return value;
}
export function rootRenderNodes(view) {
    var renderNodes = [];
    visitRootRenderNodes(view, 0 /* Collect */, undefined, undefined, renderNodes);
    return renderNodes;
}
export function visitRootRenderNodes(view, action, parentNode, nextSibling, target) {
    // We need to re-compute the parent node in case the nodes have been moved around manually
    if (action === 3 /* RemoveChild */) {
        parentNode = view.renderer.parentNode(renderNode(view, (view.def.lastRenderRootNode)));
    }
    visitSiblingRenderNodes(view, action, 0, view.def.nodes.length - 1, parentNode, nextSibling, target);
}
export function visitSiblingRenderNodes(view, action, startIndex, endIndex, parentNode, nextSibling, target) {
    for (var i = startIndex; i <= endIndex; i++) {
        var nodeDef = view.def.nodes[i];
        if (nodeDef.flags & (1 /* TypeElement */ | 2 /* TypeText */ | 8 /* TypeNgContent */)) {
            visitRenderNode(view, nodeDef, action, parentNode, nextSibling, target);
        }
        // jump to next sibling
        i += nodeDef.childCount;
    }
}
export function visitProjectedRenderNodes(view, ngContentIndex, action, parentNode, nextSibling, target) {
    var compView = view;
    while (compView && !isComponentView(compView)) {
        compView = compView.parent;
    }
    var hostView = compView.parent;
    var hostElDef = viewParentEl((compView));
    var startIndex = hostElDef.nodeIndex + 1;
    var endIndex = hostElDef.nodeIndex + hostElDef.childCount;
    for (var i = startIndex; i <= endIndex; i++) {
        var nodeDef = hostView.def.nodes[i];
        if (nodeDef.ngContentIndex === ngContentIndex) {
            visitRenderNode((hostView), nodeDef, action, parentNode, nextSibling, target);
        }
        // jump to next sibling
        i += nodeDef.childCount;
    }
    if (!hostView.parent) {
        // a root view
        var projectedNodes = view.root.projectableNodes[ngContentIndex];
        if (projectedNodes) {
            for (var i = 0; i < projectedNodes.length; i++) {
                execRenderNodeAction(view, projectedNodes[i], action, parentNode, nextSibling, target);
            }
        }
    }
}
function visitRenderNode(view, nodeDef, action, parentNode, nextSibling, target) {
    if (nodeDef.flags & 8 /* TypeNgContent */) {
        visitProjectedRenderNodes(view, nodeDef.ngContent.index, action, parentNode, nextSibling, target);
    }
    else {
        var rn = renderNode(view, nodeDef);
        if (action === 3 /* RemoveChild */ && (nodeDef.flags & 33554432 /* ComponentView */) &&
            (nodeDef.bindingFlags & 48 /* CatSyntheticProperty */)) {
            // Note: we might need to do both actions.
            if (nodeDef.bindingFlags & (16 /* SyntheticProperty */)) {
                execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
            }
            if (nodeDef.bindingFlags & (32 /* SyntheticHostProperty */)) {
                var compView = asElementData(view, nodeDef.nodeIndex).componentView;
                execRenderNodeAction(compView, rn, action, parentNode, nextSibling, target);
            }
        }
        else {
            execRenderNodeAction(view, rn, action, parentNode, nextSibling, target);
        }
        if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
            var embeddedViews = asElementData(view, nodeDef.nodeIndex).viewContainer._embeddedViews;
            for (var k = 0; k < embeddedViews.length; k++) {
                visitRootRenderNodes(embeddedViews[k], action, parentNode, nextSibling, target);
            }
        }
        if (nodeDef.flags & 1 /* TypeElement */ && !nodeDef.element.name) {
            visitSiblingRenderNodes(view, action, nodeDef.nodeIndex + 1, nodeDef.nodeIndex + nodeDef.childCount, parentNode, nextSibling, target);
        }
    }
}
function execRenderNodeAction(view, renderNode, action, parentNode, nextSibling, target) {
    var renderer = view.renderer;
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
            target.push(renderNode);
            break;
    }
}
var NS_PREFIX_RE = /^:([^:]+):(.+)$/;
export function splitNamespace(name) {
    if (name[0] === ':') {
        var match = (name.match(NS_PREFIX_RE));
        return [match[1], match[2]];
    }
    return ['', name];
}
export function calcBindingFlags(bindings) {
    var flags = 0;
    for (var i = 0; i < bindings.length; i++) {
        flags |= bindings[i].flags;
    }
    return flags;
}
export function interpolate(valueCount, constAndInterp) {
    var result = '';
    for (var i = 0; i < valueCount * 2; i = i + 2) {
        result = result + constAndInterp[i] + _toStringWithNull(constAndInterp[i + 1]);
    }
    return result + constAndInterp[valueCount * 2];
}
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
            throw new Error("Does not support more than 9 expressions");
    }
}
function _toStringWithNull(v) {
    return v != null ? v.toString() : '';
}
export var EMPTY_ARRAY = [];
export var EMPTY_MAP = {};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUUsWUFBWSxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDaEYsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRW5ELE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xELE9BQU8sRUFBQywyQ0FBMkMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRSxPQUFPLEVBQTZILFFBQVEsRUFBeUUsYUFBYSxFQUFFLFVBQVUsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUvUCxNQUFNLENBQUMsSUFBTSxJQUFJLEdBQVEsZUFBUSxDQUFDO0FBRWxDLElBQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7QUFFOUMsTUFBTSxtQkFBbUIsS0FBVTtJQUNqQyxJQUFJLEdBQUcsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDUixHQUFHLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDO1FBQ25ELGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ2hDO0lBQ0QsT0FBTyxHQUFHLENBQUM7Q0FDWjtBQUVELE1BQU0sc0JBQXNCLElBQWMsRUFBRSxPQUFlLEVBQUUsVUFBa0IsRUFBRSxLQUFVO0lBQ3pGLElBQUksWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNqQyxLQUFLLEdB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QkFBaUIsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDaEc7WUFDRSxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7S0FDL0Q7Q0FDRjtBQUVELDJCQUEyQixDQUFNO0lBQy9CLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Q0FDdEM7QUFFRCxNQUFNLENBQUMsSUFBTSxXQUFXLEdBQVUsRUFBRSxDQUFDO0FBQ3JDLE1BQU0sQ0FBQyxJQUFNLFNBQVMsR0FBeUIsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1dyYXBwZWRWYWx1ZSwgZGV2TW9kZUVxdWFsfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtTT1VSQ0V9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHtSZW5kZXJlclR5cGUyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7bG9vc2VJZGVudGljYWwsIHN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5pbXBvcnQge2V4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7QmluZGluZ0RlZiwgQmluZGluZ0ZsYWdzLCBEZWZpbml0aW9uLCBEZWZpbml0aW9uRmFjdG9yeSwgRGVwRGVmLCBEZXBGbGFncywgRWxlbWVudERhdGEsIE5vZGVEZWYsIE5vZGVGbGFncywgUXVlcnlWYWx1ZVR5cGUsIFNlcnZpY2VzLCBWaWV3RGF0YSwgVmlld0RlZmluaXRpb24sIFZpZXdEZWZpbml0aW9uRmFjdG9yeSwgVmlld0ZsYWdzLCBWaWV3U3RhdGUsIGFzRWxlbWVudERhdGEsIGFzVGV4dERhdGF9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgY29uc3QgTk9PUDogYW55ID0gKCkgPT4ge307XG5cbmNvbnN0IF90b2tlbktleUNhY2hlID0gbmV3IE1hcDxhbnksIHN0cmluZz4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuS2V5KHRva2VuOiBhbnkpOiBzdHJpbmcge1xuICBsZXQga2V5ID0gX3Rva2VuS2V5Q2FjaGUuZ2V0KHRva2VuKTtcbiAgaWYgKCFrZXkpIHtcbiAgICBrZXkgPSBzdHJpbmdpZnkodG9rZW4pICsgJ18nICsgX3Rva2VuS2V5Q2FjaGUuc2l6ZTtcbiAgICBfdG9rZW5LZXlDYWNoZS5zZXQodG9rZW4sIGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcFZhbHVlKHZpZXc6IFZpZXdEYXRhLCBub2RlSWR4OiBudW1iZXIsIGJpbmRpbmdJZHg6IG51bWJlciwgdmFsdWU6IGFueSk6IGFueSB7XG4gIGlmIChXcmFwcGVkVmFsdWUuaXNXcmFwcGVkKHZhbHVlKSkge1xuICAgIHZhbHVlID0gV3JhcHBlZFZhbHVlLnVud3JhcCh2YWx1ZSk7XG4gICAgY29uc3QgZ2xvYmFsQmluZGluZ0lkeCA9IHZpZXcuZGVmLm5vZGVzW25vZGVJZHhdLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHg7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSBXcmFwcGVkVmFsdWUudW53cmFwKHZpZXcub2xkVmFsdWVzW2dsb2JhbEJpbmRpbmdJZHhdKTtcbiAgICB2aWV3Lm9sZFZhbHVlc1tnbG9iYWxCaW5kaW5nSWR4XSA9IG5ldyBXcmFwcGVkVmFsdWUob2xkVmFsdWUpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuY29uc3QgVU5ERUZJTkVEX1JFTkRFUkVSX1RZUEVfSUQgPSAnJCR1bmRlZmluZWQnO1xuY29uc3QgRU1QVFlfUkVOREVSRVJfVFlQRV9JRCA9ICckJGVtcHR5JztcblxuLy8gQXR0ZW50aW9uOiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhcyB0b3AgbGV2ZWwgZnVuY3Rpb24uXG4vLyBQdXR0aW5nIGFueSBsb2dpYyBpbiBoZXJlIHdpbGwgZGVzdHJveSBjbG9zdXJlIHRyZWUgc2hha2luZyFcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZW5kZXJlclR5cGUyKHZhbHVlczoge1xuICBzdHlsZXM6IChzdHJpbmcgfCBhbnlbXSlbXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24sXG4gIGRhdGE6IHtba2luZDogc3RyaW5nXTogYW55W119XG59KTogUmVuZGVyZXJUeXBlMiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IFVOREVGSU5FRF9SRU5ERVJFUl9UWVBFX0lELFxuICAgIHN0eWxlczogdmFsdWVzLnN0eWxlcyxcbiAgICBlbmNhcHN1bGF0aW9uOiB2YWx1ZXMuZW5jYXBzdWxhdGlvbixcbiAgICBkYXRhOiB2YWx1ZXMuZGF0YVxuICB9O1xufVxuXG5sZXQgX3JlbmRlckNvbXBDb3VudCA9IDA7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlUmVuZGVyZXJUeXBlMih0eXBlPzogUmVuZGVyZXJUeXBlMiB8IG51bGwpOiBSZW5kZXJlclR5cGUyfG51bGwge1xuICBpZiAodHlwZSAmJiB0eXBlLmlkID09PSBVTkRFRklORURfUkVOREVSRVJfVFlQRV9JRCkge1xuICAgIC8vIGZpcnN0IHRpbWUgd2Ugc2VlIHRoaXMgUmVuZGVyZXJUeXBlMi4gSW5pdGlhbGl6ZSBpdC4uLlxuICAgIGNvbnN0IGlzRmlsbGVkID1cbiAgICAgICAgKCh0eXBlLmVuY2Fwc3VsYXRpb24gIT0gbnVsbCAmJiB0eXBlLmVuY2Fwc3VsYXRpb24gIT09IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUpIHx8XG4gICAgICAgICB0eXBlLnN0eWxlcy5sZW5ndGggfHwgT2JqZWN0LmtleXModHlwZS5kYXRhKS5sZW5ndGgpO1xuICAgIGlmIChpc0ZpbGxlZCkge1xuICAgICAgdHlwZS5pZCA9IGBjJHtfcmVuZGVyQ29tcENvdW50Kyt9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZS5pZCA9IEVNUFRZX1JFTkRFUkVSX1RZUEVfSUQ7XG4gICAgfVxuICB9XG4gIGlmICh0eXBlICYmIHR5cGUuaWQgPT09IEVNUFRZX1JFTkRFUkVSX1RZUEVfSUQpIHtcbiAgICB0eXBlID0gbnVsbDtcbiAgfVxuICByZXR1cm4gdHlwZSB8fCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tCaW5kaW5nKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIGJpbmRpbmdJZHg6IG51bWJlciwgdmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBvbGRWYWx1ZXMgPSB2aWV3Lm9sZFZhbHVlcztcbiAgaWYgKCh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkZpcnN0Q2hlY2spIHx8XG4gICAgICAhbG9vc2VJZGVudGljYWwob2xkVmFsdWVzW2RlZi5iaW5kaW5nSW5kZXggKyBiaW5kaW5nSWR4XSwgdmFsdWUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVCaW5kaW5nKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIGJpbmRpbmdJZHg6IG51bWJlciwgdmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBpZiAoY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgYmluZGluZ0lkeCwgdmFsdWUpKSB7XG4gICAgdmlldy5vbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdID0gdmFsdWU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIGJpbmRpbmdJZHg6IG51bWJlciwgdmFsdWU6IGFueSkge1xuICBjb25zdCBvbGRWYWx1ZSA9IHZpZXcub2xkVmFsdWVzW2RlZi5iaW5kaW5nSW5kZXggKyBiaW5kaW5nSWR4XTtcbiAgaWYgKCh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkJlZm9yZUZpcnN0Q2hlY2spIHx8ICFkZXZNb2RlRXF1YWwob2xkVmFsdWUsIHZhbHVlKSkge1xuICAgIGNvbnN0IGJpbmRpbmdOYW1lID0gZGVmLmJpbmRpbmdzW2JpbmRpbmdJZHhdLm5hbWU7XG4gICAgdGhyb3cgZXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcihcbiAgICAgICAgU2VydmljZXMuY3JlYXRlRGVidWdDb250ZXh0KHZpZXcsIGRlZi5ub2RlSW5kZXgpLCBgJHtiaW5kaW5nTmFtZX06ICR7b2xkVmFsdWV9YCxcbiAgICAgICAgYCR7YmluZGluZ05hbWV9OiAke3ZhbHVlfWAsICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkJlZm9yZUZpcnN0Q2hlY2spICE9PSAwKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFya1BhcmVudFZpZXdzRm9yQ2hlY2sodmlldzogVmlld0RhdGEpIHtcbiAgbGV0IGN1cnJWaWV3OiBWaWV3RGF0YXxudWxsID0gdmlldztcbiAgd2hpbGUgKGN1cnJWaWV3KSB7XG4gICAgaWYgKGN1cnJWaWV3LmRlZi5mbGFncyAmIFZpZXdGbGFncy5PblB1c2gpIHtcbiAgICAgIGN1cnJWaWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5DaGVja3NFbmFibGVkO1xuICAgIH1cbiAgICBjdXJyVmlldyA9IGN1cnJWaWV3LnZpZXdDb250YWluZXJQYXJlbnQgfHwgY3VyclZpZXcucGFyZW50O1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXJrUGFyZW50Vmlld3NGb3JDaGVja1Byb2plY3RlZFZpZXdzKHZpZXc6IFZpZXdEYXRhLCBlbmRWaWV3OiBWaWV3RGF0YSkge1xuICBsZXQgY3VyclZpZXc6IFZpZXdEYXRhfG51bGwgPSB2aWV3O1xuICB3aGlsZSAoY3VyclZpZXcgJiYgY3VyclZpZXcgIT09IGVuZFZpZXcpIHtcbiAgICBjdXJyVmlldy5zdGF0ZSB8PSBWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3cztcbiAgICBjdXJyVmlldyA9IGN1cnJWaWV3LnZpZXdDb250YWluZXJQYXJlbnQgfHwgY3VyclZpZXcucGFyZW50O1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNwYXRjaEV2ZW50KFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50OiBhbnkpOiBib29sZWFufHVuZGVmaW5lZCB7XG4gIHRyeSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IHZpZXcuZGVmLm5vZGVzW25vZGVJbmRleF07XG4gICAgY29uc3Qgc3RhcnRWaWV3ID0gbm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnRWaWV3ID9cbiAgICAgICAgYXNFbGVtZW50RGF0YSh2aWV3LCBub2RlSW5kZXgpLmNvbXBvbmVudFZpZXcgOlxuICAgICAgICB2aWV3O1xuICAgIG1hcmtQYXJlbnRWaWV3c0ZvckNoZWNrKHN0YXJ0Vmlldyk7XG4gICAgcmV0dXJuIFNlcnZpY2VzLmhhbmRsZUV2ZW50KHZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBBdHRlbnRpb246IERvbid0IHJldGhyb3csIGFzIGl0IHdvdWxkIGNhbmNlbCBPYnNlcnZhYmxlIHN1YnNjcmlwdGlvbnMhXG4gICAgdmlldy5yb290LmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjbGFyZWRWaWV3Q29udGFpbmVyKHZpZXc6IFZpZXdEYXRhKTogRWxlbWVudERhdGF8bnVsbCB7XG4gIGlmICh2aWV3LnBhcmVudCkge1xuICAgIGNvbnN0IHBhcmVudFZpZXcgPSB2aWV3LnBhcmVudDtcbiAgICByZXR1cm4gYXNFbGVtZW50RGF0YShwYXJlbnRWaWV3LCB2aWV3LnBhcmVudE5vZGVEZWYgIS5ub2RlSW5kZXgpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIGZvciBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgdGhlIGhvc3QgZWxlbWVudC5cbiAqIGZvciBlbWJlZGRlZCB2aWV3cywgdGhpcyBpcyB0aGUgaW5kZXggb2YgdGhlIHBhcmVudCBub2RlXG4gKiB0aGF0IGNvbnRhaW5zIHRoZSB2aWV3IGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdQYXJlbnRFbCh2aWV3OiBWaWV3RGF0YSk6IE5vZGVEZWZ8bnVsbCB7XG4gIGNvbnN0IHBhcmVudFZpZXcgPSB2aWV3LnBhcmVudDtcbiAgaWYgKHBhcmVudFZpZXcpIHtcbiAgICByZXR1cm4gdmlldy5wYXJlbnROb2RlRGVmICEucGFyZW50O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJOb2RlKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBhbnkge1xuICBzd2l0Y2ggKGRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlcykge1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVFbGVtZW50OlxuICAgICAgcmV0dXJuIGFzRWxlbWVudERhdGEodmlldywgZGVmLm5vZGVJbmRleCkucmVuZGVyRWxlbWVudDtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVGV4dDpcbiAgICAgIHJldHVybiBhc1RleHREYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpLnJlbmRlclRleHQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRFdmVudEZ1bGxOYW1lKHRhcmdldDogc3RyaW5nIHwgbnVsbCwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRhcmdldCA/IGAke3RhcmdldH06JHtuYW1lfWAgOiBuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnRWaWV3KHZpZXc6IFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIXZpZXcucGFyZW50ICYmICEhKHZpZXcucGFyZW50Tm9kZURlZiAhLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0VtYmVkZGVkVmlldyh2aWV3OiBWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICByZXR1cm4gISF2aWV3LnBhcmVudCAmJiAhKHZpZXcucGFyZW50Tm9kZURlZiAhLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJRdWVyeUlkKHF1ZXJ5SWQ6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAxIDw8IChxdWVyeUlkICUgMzIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRNYXRjaGVkUXVlcmllc0RzbChcbiAgICBtYXRjaGVkUXVlcmllc0RzbDogW3N0cmluZyB8IG51bWJlciwgUXVlcnlWYWx1ZVR5cGVdW10gfCBudWxsKToge1xuICBtYXRjaGVkUXVlcmllczoge1txdWVyeUlkOiBzdHJpbmddOiBRdWVyeVZhbHVlVHlwZX0sXG4gIHJlZmVyZW5jZXM6IHtbcmVmSWQ6IHN0cmluZ106IFF1ZXJ5VmFsdWVUeXBlfSxcbiAgbWF0Y2hlZFF1ZXJ5SWRzOiBudW1iZXJcbn0ge1xuICBjb25zdCBtYXRjaGVkUXVlcmllczoge1txdWVyeUlkOiBzdHJpbmddOiBRdWVyeVZhbHVlVHlwZX0gPSB7fTtcbiAgbGV0IG1hdGNoZWRRdWVyeUlkcyA9IDA7XG4gIGNvbnN0IHJlZmVyZW5jZXM6IHtbcmVmSWQ6IHN0cmluZ106IFF1ZXJ5VmFsdWVUeXBlfSA9IHt9O1xuICBpZiAobWF0Y2hlZFF1ZXJpZXNEc2wpIHtcbiAgICBtYXRjaGVkUXVlcmllc0RzbC5mb3JFYWNoKChbcXVlcnlJZCwgdmFsdWVUeXBlXSkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBxdWVyeUlkID09PSAnbnVtYmVyJykge1xuICAgICAgICBtYXRjaGVkUXVlcmllc1txdWVyeUlkXSA9IHZhbHVlVHlwZTtcbiAgICAgICAgbWF0Y2hlZFF1ZXJ5SWRzIHw9IGZpbHRlclF1ZXJ5SWQocXVlcnlJZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWZlcmVuY2VzW3F1ZXJ5SWRdID0gdmFsdWVUeXBlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybiB7bWF0Y2hlZFF1ZXJpZXMsIHJlZmVyZW5jZXMsIG1hdGNoZWRRdWVyeUlkc307XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdERlcHNEc2woZGVwczogKFtEZXBGbGFncywgYW55XSB8IGFueSlbXSwgc291cmNlTmFtZT86IHN0cmluZyk6IERlcERlZltdIHtcbiAgcmV0dXJuIGRlcHMubWFwKHZhbHVlID0+IHtcbiAgICBsZXQgdG9rZW46IGFueTtcbiAgICBsZXQgZmxhZ3M6IERlcEZsYWdzO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgW2ZsYWdzLCB0b2tlbl0gPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhZ3MgPSBEZXBGbGFncy5Ob25lO1xuICAgICAgdG9rZW4gPSB2YWx1ZTtcbiAgICB9XG4gICAgaWYgKHRva2VuICYmICh0eXBlb2YgdG9rZW4gPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHRva2VuID09PSAnb2JqZWN0JykgJiYgc291cmNlTmFtZSkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRva2VuLCBTT1VSQ0UsIHt2YWx1ZTogc291cmNlTmFtZSwgY29uZmlndXJhYmxlOiB0cnVlfSk7XG4gICAgfVxuICAgIHJldHVybiB7ZmxhZ3MsIHRva2VuLCB0b2tlbktleTogdG9rZW5LZXkodG9rZW4pfTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRSZW5kZXJFbGVtZW50KHZpZXc6IFZpZXdEYXRhLCByZW5kZXJIb3N0OiBhbnksIGRlZjogTm9kZURlZik6IGFueSB7XG4gIGxldCByZW5kZXJQYXJlbnQgPSBkZWYucmVuZGVyUGFyZW50O1xuICBpZiAocmVuZGVyUGFyZW50KSB7XG4gICAgaWYgKChyZW5kZXJQYXJlbnQuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQpID09PSAwIHx8XG4gICAgICAgIChyZW5kZXJQYXJlbnQuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50VmlldykgPT09IDAgfHxcbiAgICAgICAgKHJlbmRlclBhcmVudC5lbGVtZW50ICEuY29tcG9uZW50UmVuZGVyZXJUeXBlICYmXG4gICAgICAgICByZW5kZXJQYXJlbnQuZWxlbWVudCAhLmNvbXBvbmVudFJlbmRlcmVyVHlwZSAhLmVuY2Fwc3VsYXRpb24gPT09XG4gICAgICAgICAgICAgVmlld0VuY2Fwc3VsYXRpb24uTmF0aXZlKSkge1xuICAgICAgLy8gb25seSBjaGlsZHJlbiBvZiBub24gY29tcG9uZW50cywgb3IgY2hpbGRyZW4gb2YgY29tcG9uZW50cyB3aXRoIG5hdGl2ZSBlbmNhcHN1bGF0aW9uIHNob3VsZFxuICAgICAgLy8gYmUgYXR0YWNoZWQuXG4gICAgICByZXR1cm4gYXNFbGVtZW50RGF0YSh2aWV3LCBkZWYucmVuZGVyUGFyZW50ICEubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcmVuZGVySG9zdDtcbiAgfVxufVxuXG5jb25zdCBERUZJTklUSU9OX0NBQ0hFID0gbmV3IFdlYWtNYXA8YW55LCBEZWZpbml0aW9uPGFueT4+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGVmaW5pdGlvbjxEIGV4dGVuZHMgRGVmaW5pdGlvbjxhbnk+PihmYWN0b3J5OiBEZWZpbml0aW9uRmFjdG9yeTxEPik6IEQge1xuICBsZXQgdmFsdWUgPSBERUZJTklUSU9OX0NBQ0hFLmdldChmYWN0b3J5KSAhYXMgRDtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHZhbHVlID0gZmFjdG9yeSgoKSA9PiBOT09QKTtcbiAgICB2YWx1ZS5mYWN0b3J5ID0gZmFjdG9yeTtcbiAgICBERUZJTklUSU9OX0NBQ0hFLnNldChmYWN0b3J5LCB2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm9vdFJlbmRlck5vZGVzKHZpZXc6IFZpZXdEYXRhKTogYW55W10ge1xuICBjb25zdCByZW5kZXJOb2RlczogYW55W10gPSBbXTtcbiAgdmlzaXRSb290UmVuZGVyTm9kZXModmlldywgUmVuZGVyTm9kZUFjdGlvbi5Db2xsZWN0LCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgcmVuZGVyTm9kZXMpO1xuICByZXR1cm4gcmVuZGVyTm9kZXM7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFJlbmRlck5vZGVBY3Rpb24ge0NvbGxlY3QsIEFwcGVuZENoaWxkLCBJbnNlcnRCZWZvcmUsIFJlbW92ZUNoaWxkfVxuXG5leHBvcnQgZnVuY3Rpb24gdmlzaXRSb290UmVuZGVyTm9kZXMoXG4gICAgdmlldzogVmlld0RhdGEsIGFjdGlvbjogUmVuZGVyTm9kZUFjdGlvbiwgcGFyZW50Tm9kZTogYW55LCBuZXh0U2libGluZzogYW55LCB0YXJnZXQ/OiBhbnlbXSkge1xuICAvLyBXZSBuZWVkIHRvIHJlLWNvbXB1dGUgdGhlIHBhcmVudCBub2RlIGluIGNhc2UgdGhlIG5vZGVzIGhhdmUgYmVlbiBtb3ZlZCBhcm91bmQgbWFudWFsbHlcbiAgaWYgKGFjdGlvbiA9PT0gUmVuZGVyTm9kZUFjdGlvbi5SZW1vdmVDaGlsZCkge1xuICAgIHBhcmVudE5vZGUgPSB2aWV3LnJlbmRlcmVyLnBhcmVudE5vZGUocmVuZGVyTm9kZSh2aWV3LCB2aWV3LmRlZi5sYXN0UmVuZGVyUm9vdE5vZGUgISkpO1xuICB9XG4gIHZpc2l0U2libGluZ1JlbmRlck5vZGVzKFxuICAgICAgdmlldywgYWN0aW9uLCAwLCB2aWV3LmRlZi5ub2Rlcy5sZW5ndGggLSAxLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZpc2l0U2libGluZ1JlbmRlck5vZGVzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBhY3Rpb246IFJlbmRlck5vZGVBY3Rpb24sIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg6IG51bWJlciwgcGFyZW50Tm9kZTogYW55LFxuICAgIG5leHRTaWJsaW5nOiBhbnksIHRhcmdldD86IGFueVtdKSB7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDw9IGVuZEluZGV4OyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiAoTm9kZUZsYWdzLlR5cGVFbGVtZW50IHwgTm9kZUZsYWdzLlR5cGVUZXh0IHwgTm9kZUZsYWdzLlR5cGVOZ0NvbnRlbnQpKSB7XG4gICAgICB2aXNpdFJlbmRlck5vZGUodmlldywgbm9kZURlZiwgYWN0aW9uLCBwYXJlbnROb2RlLCBuZXh0U2libGluZywgdGFyZ2V0KTtcbiAgICB9XG4gICAgLy8ganVtcCB0byBuZXh0IHNpYmxpbmdcbiAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdmlzaXRQcm9qZWN0ZWRSZW5kZXJOb2RlcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgbmdDb250ZW50SW5kZXg6IG51bWJlciwgYWN0aW9uOiBSZW5kZXJOb2RlQWN0aW9uLCBwYXJlbnROb2RlOiBhbnksXG4gICAgbmV4dFNpYmxpbmc6IGFueSwgdGFyZ2V0PzogYW55W10pIHtcbiAgbGV0IGNvbXBWaWV3OiBWaWV3RGF0YXxudWxsID0gdmlldztcbiAgd2hpbGUgKGNvbXBWaWV3ICYmICFpc0NvbXBvbmVudFZpZXcoY29tcFZpZXcpKSB7XG4gICAgY29tcFZpZXcgPSBjb21wVmlldy5wYXJlbnQ7XG4gIH1cbiAgY29uc3QgaG9zdFZpZXcgPSBjb21wVmlldyAhLnBhcmVudDtcbiAgY29uc3QgaG9zdEVsRGVmID0gdmlld1BhcmVudEVsKGNvbXBWaWV3ICEpO1xuICBjb25zdCBzdGFydEluZGV4ID0gaG9zdEVsRGVmICEubm9kZUluZGV4ICsgMTtcbiAgY29uc3QgZW5kSW5kZXggPSBob3N0RWxEZWYgIS5ub2RlSW5kZXggKyBob3N0RWxEZWYgIS5jaGlsZENvdW50O1xuICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA8PSBlbmRJbmRleDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IGhvc3RWaWV3ICEuZGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLm5nQ29udGVudEluZGV4ID09PSBuZ0NvbnRlbnRJbmRleCkge1xuICAgICAgdmlzaXRSZW5kZXJOb2RlKGhvc3RWaWV3ICEsIG5vZGVEZWYsIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgfVxuICAgIC8vIGp1bXAgdG8gbmV4dCBzaWJsaW5nXG4gICAgaSArPSBub2RlRGVmLmNoaWxkQ291bnQ7XG4gIH1cbiAgaWYgKCFob3N0VmlldyAhLnBhcmVudCkge1xuICAgIC8vIGEgcm9vdCB2aWV3XG4gICAgY29uc3QgcHJvamVjdGVkTm9kZXMgPSB2aWV3LnJvb3QucHJvamVjdGFibGVOb2Rlc1tuZ0NvbnRlbnRJbmRleF07XG4gICAgaWYgKHByb2plY3RlZE5vZGVzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb2plY3RlZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV4ZWNSZW5kZXJOb2RlQWN0aW9uKHZpZXcsIHByb2plY3RlZE5vZGVzW2ldLCBhY3Rpb24sIHBhcmVudE5vZGUsIG5leHRTaWJsaW5nLCB0YXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2aXNpdFJlbmRlck5vZGUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIGFjdGlvbjogUmVuZGVyTm9kZUFjdGlvbiwgcGFyZW50Tm9kZTogYW55LCBuZXh0U2libGluZzogYW55LFxuICAgIHRhcmdldD86IGFueVtdKSB7XG4gIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVOZ0NvbnRlbnQpIHtcbiAgICB2aXNpdFByb2plY3RlZFJlbmRlck5vZGVzKFxuICAgICAgICB2aWV3LCBub2RlRGVmLm5nQ29udGVudCAhLmluZGV4LCBhY3Rpb24sIHBhcmVudE5vZGUsIG5leHRTaWJsaW5nLCB0YXJnZXQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJuID0gcmVuZGVyTm9kZSh2aWV3LCBub2RlRGVmKTtcbiAgICBpZiAoYWN0aW9uID09PSBSZW5kZXJOb2RlQWN0aW9uLlJlbW92ZUNoaWxkICYmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudFZpZXcpICYmXG4gICAgICAgIChub2RlRGVmLmJpbmRpbmdGbGFncyAmIEJpbmRpbmdGbGFncy5DYXRTeW50aGV0aWNQcm9wZXJ0eSkpIHtcbiAgICAgIC8vIE5vdGU6IHdlIG1pZ2h0IG5lZWQgdG8gZG8gYm90aCBhY3Rpb25zLlxuICAgICAgaWYgKG5vZGVEZWYuYmluZGluZ0ZsYWdzICYgKEJpbmRpbmdGbGFncy5TeW50aGV0aWNQcm9wZXJ0eSkpIHtcbiAgICAgICAgZXhlY1JlbmRlck5vZGVBY3Rpb24odmlldywgcm4sIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZURlZi5iaW5kaW5nRmxhZ3MgJiAoQmluZGluZ0ZsYWdzLlN5bnRoZXRpY0hvc3RQcm9wZXJ0eSkpIHtcbiAgICAgICAgY29uc3QgY29tcFZpZXcgPSBhc0VsZW1lbnREYXRhKHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KS5jb21wb25lbnRWaWV3O1xuICAgICAgICBleGVjUmVuZGVyTm9kZUFjdGlvbihjb21wVmlldywgcm4sIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4ZWNSZW5kZXJOb2RlQWN0aW9uKHZpZXcsIHJuLCBhY3Rpb24sIHBhcmVudE5vZGUsIG5leHRTaWJsaW5nLCB0YXJnZXQpO1xuICAgIH1cbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5FbWJlZGRlZFZpZXdzKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZFZpZXdzID0gYXNFbGVtZW50RGF0YSh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCkudmlld0NvbnRhaW5lciAhLl9lbWJlZGRlZFZpZXdzO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBlbWJlZGRlZFZpZXdzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHZpc2l0Um9vdFJlbmRlck5vZGVzKGVtYmVkZGVkVmlld3Nba10sIGFjdGlvbiwgcGFyZW50Tm9kZSwgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50ICYmICFub2RlRGVmLmVsZW1lbnQgIS5uYW1lKSB7XG4gICAgICB2aXNpdFNpYmxpbmdSZW5kZXJOb2RlcyhcbiAgICAgICAgICB2aWV3LCBhY3Rpb24sIG5vZGVEZWYubm9kZUluZGV4ICsgMSwgbm9kZURlZi5ub2RlSW5kZXggKyBub2RlRGVmLmNoaWxkQ291bnQsIHBhcmVudE5vZGUsXG4gICAgICAgICAgbmV4dFNpYmxpbmcsIHRhcmdldCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWNSZW5kZXJOb2RlQWN0aW9uKFxuICAgIHZpZXc6IFZpZXdEYXRhLCByZW5kZXJOb2RlOiBhbnksIGFjdGlvbjogUmVuZGVyTm9kZUFjdGlvbiwgcGFyZW50Tm9kZTogYW55LCBuZXh0U2libGluZzogYW55LFxuICAgIHRhcmdldD86IGFueVtdKSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlldy5yZW5kZXJlcjtcbiAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICBjYXNlIFJlbmRlck5vZGVBY3Rpb24uQXBwZW5kQ2hpbGQ6XG4gICAgICByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnROb2RlLCByZW5kZXJOb2RlKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgUmVuZGVyTm9kZUFjdGlvbi5JbnNlcnRCZWZvcmU6XG4gICAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50Tm9kZSwgcmVuZGVyTm9kZSwgbmV4dFNpYmxpbmcpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBSZW5kZXJOb2RlQWN0aW9uLlJlbW92ZUNoaWxkOlxuICAgICAgcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50Tm9kZSwgcmVuZGVyTm9kZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFJlbmRlck5vZGVBY3Rpb24uQ29sbGVjdDpcbiAgICAgIHRhcmdldCAhLnB1c2gocmVuZGVyTm9kZSk7XG4gICAgICBicmVhaztcbiAgfVxufVxuXG5jb25zdCBOU19QUkVGSVhfUkUgPSAvXjooW146XSspOiguKykkLztcblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0TmFtZXNwYWNlKG5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgaWYgKG5hbWVbMF0gPT09ICc6Jykge1xuICAgIGNvbnN0IG1hdGNoID0gbmFtZS5tYXRjaChOU19QUkVGSVhfUkUpICE7XG4gICAgcmV0dXJuIFttYXRjaFsxXSwgbWF0Y2hbMl1dO1xuICB9XG4gIHJldHVybiBbJycsIG5hbWVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY0JpbmRpbmdGbGFncyhiaW5kaW5nczogQmluZGluZ0RlZltdKTogQmluZGluZ0ZsYWdzIHtcbiAgbGV0IGZsYWdzID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7IGkrKykge1xuICAgIGZsYWdzIHw9IGJpbmRpbmdzW2ldLmZsYWdzO1xuICB9XG4gIHJldHVybiBmbGFncztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRlKHZhbHVlQ291bnQ6IG51bWJlciwgY29uc3RBbmRJbnRlcnA6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlQ291bnQgKiAyOyBpID0gaSArIDIpIHtcbiAgICByZXN1bHQgPSByZXN1bHQgKyBjb25zdEFuZEludGVycFtpXSArIF90b1N0cmluZ1dpdGhOdWxsKGNvbnN0QW5kSW50ZXJwW2kgKyAxXSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdCArIGNvbnN0QW5kSW50ZXJwW3ZhbHVlQ291bnQgKiAyXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlubGluZUludGVycG9sYXRlKFxuICAgIHZhbHVlQ291bnQ6IG51bWJlciwgYzA6IHN0cmluZywgYTE6IGFueSwgYzE6IHN0cmluZywgYTI/OiBhbnksIGMyPzogc3RyaW5nLCBhMz86IGFueSxcbiAgICBjMz86IHN0cmluZywgYTQ/OiBhbnksIGM0Pzogc3RyaW5nLCBhNT86IGFueSwgYzU/OiBzdHJpbmcsIGE2PzogYW55LCBjNj86IHN0cmluZywgYTc/OiBhbnksXG4gICAgYzc/OiBzdHJpbmcsIGE4PzogYW55LCBjOD86IHN0cmluZywgYTk/OiBhbnksIGM5Pzogc3RyaW5nKTogc3RyaW5nIHtcbiAgc3dpdGNoICh2YWx1ZUNvdW50KSB7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIGMwICsgX3RvU3RyaW5nV2l0aE51bGwoYTEpICsgYzE7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIGMwICsgX3RvU3RyaW5nV2l0aE51bGwoYTEpICsgYzEgKyBfdG9TdHJpbmdXaXRoTnVsbChhMikgKyBjMjtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyICsgX3RvU3RyaW5nV2l0aE51bGwoYTMpICtcbiAgICAgICAgICBjMztcbiAgICBjYXNlIDQ6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyICsgX3RvU3RyaW5nV2l0aE51bGwoYTMpICtcbiAgICAgICAgICBjMyArIF90b1N0cmluZ1dpdGhOdWxsKGE0KSArIGM0O1xuICAgIGNhc2UgNTpcbiAgICAgIHJldHVybiBjMCArIF90b1N0cmluZ1dpdGhOdWxsKGExKSArIGMxICsgX3RvU3RyaW5nV2l0aE51bGwoYTIpICsgYzIgKyBfdG9TdHJpbmdXaXRoTnVsbChhMykgK1xuICAgICAgICAgIGMzICsgX3RvU3RyaW5nV2l0aE51bGwoYTQpICsgYzQgKyBfdG9TdHJpbmdXaXRoTnVsbChhNSkgKyBjNTtcbiAgICBjYXNlIDY6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyICsgX3RvU3RyaW5nV2l0aE51bGwoYTMpICtcbiAgICAgICAgICBjMyArIF90b1N0cmluZ1dpdGhOdWxsKGE0KSArIGM0ICsgX3RvU3RyaW5nV2l0aE51bGwoYTUpICsgYzUgKyBfdG9TdHJpbmdXaXRoTnVsbChhNikgKyBjNjtcbiAgICBjYXNlIDc6XG4gICAgICByZXR1cm4gYzAgKyBfdG9TdHJpbmdXaXRoTnVsbChhMSkgKyBjMSArIF90b1N0cmluZ1dpdGhOdWxsKGEyKSArIGMyICsgX3RvU3RyaW5nV2l0aE51bGwoYTMpICtcbiAgICAgICAgICBjMyArIF90b1N0cmluZ1dpdGhOdWxsKGE0KSArIGM0ICsgX3RvU3RyaW5nV2l0aE51bGwoYTUpICsgYzUgKyBfdG9TdHJpbmdXaXRoTnVsbChhNikgK1xuICAgICAgICAgIGM2ICsgX3RvU3RyaW5nV2l0aE51bGwoYTcpICsgYzc7XG4gICAgY2FzZSA4OlxuICAgICAgcmV0dXJuIGMwICsgX3RvU3RyaW5nV2l0aE51bGwoYTEpICsgYzEgKyBfdG9TdHJpbmdXaXRoTnVsbChhMikgKyBjMiArIF90b1N0cmluZ1dpdGhOdWxsKGEzKSArXG4gICAgICAgICAgYzMgKyBfdG9TdHJpbmdXaXRoTnVsbChhNCkgKyBjNCArIF90b1N0cmluZ1dpdGhOdWxsKGE1KSArIGM1ICsgX3RvU3RyaW5nV2l0aE51bGwoYTYpICtcbiAgICAgICAgICBjNiArIF90b1N0cmluZ1dpdGhOdWxsKGE3KSArIGM3ICsgX3RvU3RyaW5nV2l0aE51bGwoYTgpICsgYzg7XG4gICAgY2FzZSA5OlxuICAgICAgcmV0dXJuIGMwICsgX3RvU3RyaW5nV2l0aE51bGwoYTEpICsgYzEgKyBfdG9TdHJpbmdXaXRoTnVsbChhMikgKyBjMiArIF90b1N0cmluZ1dpdGhOdWxsKGEzKSArXG4gICAgICAgICAgYzMgKyBfdG9TdHJpbmdXaXRoTnVsbChhNCkgKyBjNCArIF90b1N0cmluZ1dpdGhOdWxsKGE1KSArIGM1ICsgX3RvU3RyaW5nV2l0aE51bGwoYTYpICtcbiAgICAgICAgICBjNiArIF90b1N0cmluZ1dpdGhOdWxsKGE3KSArIGM3ICsgX3RvU3RyaW5nV2l0aE51bGwoYTgpICsgYzggKyBfdG9TdHJpbmdXaXRoTnVsbChhOSkgKyBjOTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2VzIG5vdCBzdXBwb3J0IG1vcmUgdGhhbiA5IGV4cHJlc3Npb25zYCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX3RvU3RyaW5nV2l0aE51bGwodjogYW55KTogc3RyaW5nIHtcbiAgcmV0dXJuIHYgIT0gbnVsbCA/IHYudG9TdHJpbmcoKSA6ICcnO1xufVxuXG5leHBvcnQgY29uc3QgRU1QVFlfQVJSQVk6IGFueVtdID0gW107XG5leHBvcnQgY29uc3QgRU1QVFlfTUFQOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuIl19