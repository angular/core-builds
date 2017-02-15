/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../application_ref';
import { SecurityContext } from '../security';
import { BindingType, NodeFlags, NodeType, asElementData } from './types';
import { checkAndUpdateBinding, dispatchEvent, elementEventFullName, getParentRenderElement, resolveViewDefinition, sliceErrorStack, splitMatchedQueriesDsl } from './util';
/**
 * @param {?} flags
 * @param {?} matchedQueriesDsl
 * @param {?} ngContentIndex
 * @param {?} childCount
 * @param {?=} templateFactory
 * @return {?}
 */
export function anchorDef(flags, matchedQueriesDsl, ngContentIndex, childCount, templateFactory) {
    var _a = splitMatchedQueriesDsl(matchedQueriesDsl), matchedQueries = _a.matchedQueries, references = _a.references, matchedQueryIds = _a.matchedQueryIds;
    // skip the call to sliceErrorStack itself + the call to this function.
    var /** @type {?} */ source = isDevMode() ? sliceErrorStack(2, 3) : '';
    var /** @type {?} */ template = templateFactory ? resolveViewDefinition(templateFactory) : null;
    return {
        type: NodeType.Element,
        // will bet set by the view definition
        index: undefined,
        reverseChildIndex: undefined,
        parent: undefined,
        renderParent: undefined,
        bindingIndex: undefined,
        disposableIndex: undefined,
        // regular values
        flags: flags,
        childFlags: 0,
        childMatchedQueries: 0, matchedQueries: matchedQueries, matchedQueryIds: matchedQueryIds, references: references, ngContentIndex: ngContentIndex, childCount: childCount,
        bindings: [],
        disposableCount: 0,
        element: {
            name: undefined,
            attrs: undefined,
            outputs: [], template: template, source: source,
            // will bet set by the view definition
            component: undefined,
            publicProviders: undefined,
            allProviders: undefined,
        },
        provider: undefined,
        text: undefined,
        pureExpression: undefined,
        query: undefined,
        ngContent: undefined
    };
}
/**
 * @param {?} flags
 * @param {?} matchedQueriesDsl
 * @param {?} ngContentIndex
 * @param {?} childCount
 * @param {?} name
 * @param {?=} fixedAttrs
 * @param {?=} bindings
 * @param {?=} outputs
 * @return {?}
 */
export function elementDef(flags, matchedQueriesDsl, ngContentIndex, childCount, name, fixedAttrs, bindings, outputs) {
    if (fixedAttrs === void 0) { fixedAttrs = {}; }
    // skip the call to sliceErrorStack itself + the call to this function.
    var /** @type {?} */ source = isDevMode() ? sliceErrorStack(2, 3) : '';
    var _a = splitMatchedQueriesDsl(matchedQueriesDsl), matchedQueries = _a.matchedQueries, references = _a.references, matchedQueryIds = _a.matchedQueryIds;
    bindings = bindings || [];
    var /** @type {?} */ bindingDefs = new Array(bindings.length);
    for (var /** @type {?} */ i = 0; i < bindings.length; i++) {
        var /** @type {?} */ entry = bindings[i];
        var /** @type {?} */ bindingDef = void 0;
        var /** @type {?} */ bindingType = entry[0];
        var /** @type {?} */ name_1 = entry[1];
        var /** @type {?} */ securityContext = void 0;
        var /** @type {?} */ suffix = void 0;
        switch (bindingType) {
            case BindingType.ElementStyle:
                suffix = (entry[2]);
                break;
            case BindingType.ElementAttribute:
            case BindingType.ElementProperty:
                securityContext = (entry[2]);
                break;
        }
        bindingDefs[i] = { type: bindingType, name: name_1, nonMinifiedName: name_1, securityContext: securityContext, suffix: suffix };
    }
    outputs = outputs || [];
    var /** @type {?} */ outputDefs = new Array(outputs.length);
    for (var /** @type {?} */ i = 0; i < outputs.length; i++) {
        var /** @type {?} */ output = outputs[i];
        var /** @type {?} */ target = void 0;
        var /** @type {?} */ eventName = void 0;
        if (Array.isArray(output)) {
            target = output[0], eventName = output[1];
        }
        else {
            eventName = output;
        }
        outputDefs[i] = { eventName: eventName, target: target };
    }
    return {
        type: NodeType.Element,
        // will bet set by the view definition
        index: undefined,
        reverseChildIndex: undefined,
        parent: undefined,
        renderParent: undefined,
        bindingIndex: undefined,
        disposableIndex: undefined,
        // regular values
        flags: flags,
        childFlags: 0,
        childMatchedQueries: 0, matchedQueries: matchedQueries, matchedQueryIds: matchedQueryIds, references: references, ngContentIndex: ngContentIndex, childCount: childCount,
        bindings: bindingDefs,
        disposableCount: outputDefs.length,
        element: {
            name: name,
            attrs: fixedAttrs,
            outputs: outputDefs, source: source,
            template: undefined,
            // will bet set by the view definition
            component: undefined,
            publicProviders: undefined,
            allProviders: undefined,
        },
        provider: undefined,
        text: undefined,
        pureExpression: undefined,
        query: undefined,
        ngContent: undefined
    };
}
/**
 * @param {?} view
 * @param {?} renderHost
 * @param {?} def
 * @return {?}
 */
export function createElement(view, renderHost, def) {
    var /** @type {?} */ elDef = def.element;
    var /** @type {?} */ rootSelectorOrNode = view.root.selectorOrNode;
    var /** @type {?} */ renderer = view.root.renderer;
    var /** @type {?} */ el;
    if (view.parent || !rootSelectorOrNode) {
        if (elDef.name) {
            // TODO(vicb): move the namespace to the node definition
            var /** @type {?} */ nsAndName = splitNamespace(elDef.name);
            el = renderer.createElement(nsAndName[1], nsAndName[0]);
        }
        else {
            el = renderer.createComment('');
        }
        var /** @type {?} */ parentEl = getParentRenderElement(view, renderHost, def);
        if (parentEl) {
            renderer.appendChild(parentEl, el);
        }
    }
    else {
        el = renderer.selectRootElement(rootSelectorOrNode);
    }
    if (elDef.attrs) {
        for (var /** @type {?} */ attrName in elDef.attrs) {
            // TODO(vicb): move the namespace to the node definition
            var /** @type {?} */ nsAndName = splitNamespace(attrName);
            renderer.setAttribute(el, nsAndName[1], elDef.attrs[attrName], nsAndName[0]);
        }
    }
    if (elDef.outputs.length) {
        for (var /** @type {?} */ i = 0; i < elDef.outputs.length; i++) {
            var /** @type {?} */ output = elDef.outputs[i];
            var /** @type {?} */ handleEventClosure = renderEventHandlerClosure(view, def.index, elementEventFullName(output.target, output.eventName));
            var /** @type {?} */ disposable = (renderer.listen(output.target || el, output.eventName, handleEventClosure));
            view.disposables[def.disposableIndex + i] = disposable;
        }
    }
    return {
        renderElement: el,
        embeddedViews: (def.flags & NodeFlags.HasEmbeddedViews) ? [] : undefined,
        projectedViews: undefined
    };
}
/**
 * @param {?} view
 * @param {?} index
 * @param {?} eventName
 * @return {?}
 */
function renderEventHandlerClosure(view, index, eventName) {
    return function (event) { return dispatchEvent(view, index, eventName, event); };
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} v0
 * @param {?} v1
 * @param {?} v2
 * @param {?} v3
 * @param {?} v4
 * @param {?} v5
 * @param {?} v6
 * @param {?} v7
 * @param {?} v8
 * @param {?} v9
 * @return {?}
 */
export function checkAndUpdateElementInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    // Note: fallthrough is intended!
    switch (def.bindings.length) {
        case 10:
            checkAndUpdateElementValue(view, def, 9, v9);
        case 9:
            checkAndUpdateElementValue(view, def, 8, v8);
        case 8:
            checkAndUpdateElementValue(view, def, 7, v7);
        case 7:
            checkAndUpdateElementValue(view, def, 6, v6);
        case 6:
            checkAndUpdateElementValue(view, def, 5, v5);
        case 5:
            checkAndUpdateElementValue(view, def, 4, v4);
        case 4:
            checkAndUpdateElementValue(view, def, 3, v3);
        case 3:
            checkAndUpdateElementValue(view, def, 2, v2);
        case 2:
            checkAndUpdateElementValue(view, def, 1, v1);
        case 1:
            checkAndUpdateElementValue(view, def, 0, v0);
    }
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} values
 * @return {?}
 */
export function checkAndUpdateElementDynamic(view, def, values) {
    for (var /** @type {?} */ i = 0; i < values.length; i++) {
        checkAndUpdateElementValue(view, def, i, values[i]);
    }
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} bindingIdx
 * @param {?} value
 * @return {?}
 */
function checkAndUpdateElementValue(view, def, bindingIdx, value) {
    if (!checkAndUpdateBinding(view, def, bindingIdx, value)) {
        return;
    }
    var /** @type {?} */ binding = def.bindings[bindingIdx];
    var /** @type {?} */ name = binding.name;
    var /** @type {?} */ renderNode = asElementData(view, def.index).renderElement;
    switch (binding.type) {
        case BindingType.ElementAttribute:
            setElementAttribute(view, binding, renderNode, name, value);
            break;
        case BindingType.ElementClass:
            setElementClass(view, renderNode, name, value);
            break;
        case BindingType.ElementStyle:
            setElementStyle(view, binding, renderNode, name, value);
            break;
        case BindingType.ElementProperty:
            setElementProperty(view, binding, renderNode, name, value);
            break;
    }
}
/**
 * @param {?} view
 * @param {?} binding
 * @param {?} renderNode
 * @param {?} name
 * @param {?} value
 * @return {?}
 */
function setElementAttribute(view, binding, renderNode, name, value) {
    var /** @type {?} */ securityContext = binding.securityContext;
    var /** @type {?} */ renderValue = securityContext ? view.root.sanitizer.sanitize(securityContext, value) : value;
    renderValue = renderValue != null ? renderValue.toString() : null;
    var /** @type {?} */ renderer = view.root.renderer;
    // TODO(vicb): move the namespace to the node definition
    var /** @type {?} */ nsAndName = splitNamespace(name);
    if (value != null) {
        renderer.setAttribute(renderNode, nsAndName[1], renderValue, nsAndName[0]);
    }
    else {
        renderer.removeAttribute(renderNode, nsAndName[1], nsAndName[0]);
    }
}
/**
 * @param {?} view
 * @param {?} renderNode
 * @param {?} name
 * @param {?} value
 * @return {?}
 */
function setElementClass(view, renderNode, name, value) {
    var /** @type {?} */ renderer = view.root.renderer;
    if (value) {
        renderer.addClass(renderNode, name);
    }
    else {
        renderer.removeClass(renderNode, name);
    }
}
/**
 * @param {?} view
 * @param {?} binding
 * @param {?} renderNode
 * @param {?} name
 * @param {?} value
 * @return {?}
 */
function setElementStyle(view, binding, renderNode, name, value) {
    var /** @type {?} */ renderValue = view.root.sanitizer.sanitize(SecurityContext.STYLE, value);
    if (renderValue != null) {
        renderValue = renderValue.toString();
        var /** @type {?} */ unit = binding.suffix;
        if (unit != null) {
            renderValue = renderValue + unit;
        }
    }
    else {
        renderValue = null;
    }
    var /** @type {?} */ renderer = view.root.renderer;
    if (renderValue != null) {
        renderer.setStyle(renderNode, name, renderValue, false, false);
    }
    else {
        renderer.removeStyle(renderNode, name, false);
    }
}
/**
 * @param {?} view
 * @param {?} binding
 * @param {?} renderNode
 * @param {?} name
 * @param {?} value
 * @return {?}
 */
function setElementProperty(view, binding, renderNode, name, value) {
    var /** @type {?} */ securityContext = binding.securityContext;
    var /** @type {?} */ renderValue = securityContext ? view.root.sanitizer.sanitize(securityContext, value) : value;
    view.root.renderer.setProperty(renderNode, name, renderValue);
}
var /** @type {?} */ NS_PREFIX_RE = /^:([^:]+):(.+)$/;
/**
 * @param {?} name
 * @return {?}
 */
function splitNamespace(name) {
    if (name[0] === ':') {
        var /** @type {?} */ match = name.match(NS_PREFIX_RE);
        return [match[1], match[2]];
    }
    return ['', name];
}
//# sourceMappingURL=element.js.map