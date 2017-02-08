/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../application_ref';
import { SecurityContext } from '../security';
import { BindingType, EntryAction, NodeFlags, NodeType, Refs, ViewFlags, asElementData } from './types';
import { checkAndUpdateBinding, dispatchEvent, entryAction, setBindingDebugInfo, sliceErrorStack, unwrapValue } from './util';
/**
 * @param {?} flags
 * @param {?} matchedQueries
 * @param {?} ngContentIndex
 * @param {?} childCount
 * @param {?=} template
 * @return {?}
 */
export function anchorDef(flags, matchedQueries, ngContentIndex, childCount, template) {
    var /** @type {?} */ matchedQueryDefs = {};
    if (matchedQueries) {
        matchedQueries.forEach(function (_a) {
            var queryId = _a[0], valueType = _a[1];
            matchedQueryDefs[queryId] = valueType;
        });
    }
    // skip the call to sliceErrorStack itself + the call to this function.
    var /** @type {?} */ source = isDevMode() ? sliceErrorStack(2, 3) : '';
    return {
        type: NodeType.Element,
        // will bet set by the view definition
        index: undefined,
        reverseChildIndex: undefined,
        parent: undefined,
        childFlags: undefined,
        childMatchedQueries: undefined,
        bindingIndex: undefined,
        disposableIndex: undefined,
        // regular values
        flags: flags,
        matchedQueries: matchedQueryDefs, ngContentIndex: ngContentIndex, childCount: childCount,
        bindings: [],
        disposableCount: 0,
        element: {
            name: undefined,
            attrs: undefined,
            outputs: [], template: template,
            // will bet set by the view definition
            providerIndices: undefined, source: source,
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
 * @param {?} matchedQueries
 * @param {?} ngContentIndex
 * @param {?} childCount
 * @param {?} name
 * @param {?=} fixedAttrs
 * @param {?=} bindings
 * @param {?=} outputs
 * @return {?}
 */
export function elementDef(flags, matchedQueries, ngContentIndex, childCount, name, fixedAttrs, bindings, outputs) {
    if (fixedAttrs === void 0) { fixedAttrs = {}; }
    // skip the call to sliceErrorStack itself + the call to this function.
    var /** @type {?} */ source = isDevMode() ? sliceErrorStack(2, 3) : '';
    var /** @type {?} */ matchedQueryDefs = {};
    if (matchedQueries) {
        matchedQueries.forEach(function (_a) {
            var queryId = _a[0], valueType = _a[1];
            matchedQueryDefs[queryId] = valueType;
        });
    }
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
        bindingDefs[i] = { type: bindingType, name: name_1, nonMinfiedName: name_1, securityContext: securityContext, suffix: suffix };
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
        childFlags: undefined,
        childMatchedQueries: undefined,
        bindingIndex: undefined,
        disposableIndex: undefined,
        // regular values
        flags: flags,
        matchedQueries: matchedQueryDefs, ngContentIndex: ngContentIndex, childCount: childCount,
        bindings: bindingDefs,
        disposableCount: outputDefs.length,
        element: {
            name: name,
            attrs: fixedAttrs,
            outputs: outputDefs,
            template: undefined,
            // will bet set by the view definition
            providerIndices: undefined, source: source,
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
    var /** @type {?} */ el;
    if (view.parent || !rootSelectorOrNode) {
        var /** @type {?} */ parentNode = def.parent != null ? asElementData(view, def.parent).renderElement : renderHost;
        if (view.renderer) {
            var /** @type {?} */ debugContext = isDevMode() ? Refs.createDebugContext(view, def.index) : undefined;
            el = elDef.name ? view.renderer.createElement(parentNode, elDef.name, debugContext) :
                view.renderer.createTemplateAnchor(parentNode, debugContext);
        }
        else {
            el = elDef.name ? document.createElement(elDef.name) : document.createComment('');
            if (parentNode) {
                parentNode.appendChild(el);
            }
        }
    }
    else {
        if (view.renderer) {
            var /** @type {?} */ debugContext = isDevMode() ? Refs.createDebugContext(view, def.index) : undefined;
            el = view.renderer.selectRootElement(rootSelectorOrNode, debugContext);
        }
        else {
            el = typeof rootSelectorOrNode === 'string' ? document.querySelector(rootSelectorOrNode) :
                rootSelectorOrNode;
            el.textContent = '';
        }
    }
    if (elDef.attrs) {
        for (var /** @type {?} */ attrName in elDef.attrs) {
            if (view.renderer) {
                view.renderer.setElementAttribute(el, attrName, elDef.attrs[attrName]);
            }
            else {
                el.setAttribute(attrName, elDef.attrs[attrName]);
            }
        }
    }
    if (elDef.outputs.length) {
        for (var /** @type {?} */ i = 0; i < elDef.outputs.length; i++) {
            var /** @type {?} */ output = elDef.outputs[i];
            var /** @type {?} */ disposable = void 0;
            if (view.renderer) {
                var /** @type {?} */ handleEventClosure = renderEventHandlerClosure(view, def.index, output.eventName);
                if (output.target) {
                    disposable = (view.renderer.listenGlobal(output.target, output.eventName, handleEventClosure));
                }
                else {
                    disposable = (view.renderer.listen(el, output.eventName, handleEventClosure));
                }
            }
            else {
                var /** @type {?} */ target = void 0;
                switch (output.target) {
                    case 'window':
                        target = window;
                        break;
                    case 'document':
                        target = document;
                        break;
                    default:
                        target = el;
                }
                var /** @type {?} */ handleEventClosure = directDomEventHandlerClosure(view, def.index, output.eventName);
                target.addEventListener(output.eventName, handleEventClosure);
                disposable = target.removeEventListener.bind(target, output.eventName, handleEventClosure);
            }
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
    return entryAction(EntryAction.HandleEvent, function (event) { return dispatchEvent(view, index, eventName, event); });
}
/**
 * @param {?} view
 * @param {?} index
 * @param {?} eventName
 * @return {?}
 */
function directDomEventHandlerClosure(view, index, eventName) {
    return entryAction(EntryAction.HandleEvent, function (event) {
        var /** @type {?} */ result = dispatchEvent(view, index, eventName, event);
        if (result === false) {
            event.preventDefault();
        }
        return result;
    });
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
    value = unwrapValue(value);
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
    if (view.renderer) {
        view.renderer.setElementAttribute(renderNode, name, renderValue);
    }
    else {
        if (value != null) {
            renderNode.setAttribute(name, renderValue);
        }
        else {
            renderNode.removeAttribute(name);
        }
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
    if (view.renderer) {
        view.renderer.setElementClass(renderNode, name, value);
    }
    else {
        if (value) {
            renderNode.classList.add(name);
        }
        else {
            renderNode.classList.remove(name);
        }
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
    if (view.renderer) {
        view.renderer.setElementStyle(renderNode, name, renderValue);
    }
    else {
        if (renderValue != null) {
            renderNode.style[name] = renderValue;
        }
        else {
            // IE requires '' instead of null
            // see https://github.com/angular/angular/issues/7916
            ((renderNode.style))[name] = '';
        }
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
    if (view.renderer) {
        view.renderer.setElementProperty(renderNode, name, renderValue);
        if (isDevMode() && (view.def.flags & ViewFlags.DirectDom) === 0) {
            setBindingDebugInfo(view.renderer, renderNode, name, renderValue);
        }
    }
    else {
        renderNode[name] = renderValue;
    }
}
//# sourceMappingURL=element.js.map