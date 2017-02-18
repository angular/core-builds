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
import { checkAndUpdateBinding, dispatchEvent, elementEventFullName, getParentRenderElement, resolveViewDefinition, sliceErrorStack, splitMatchedQueriesDsl, splitNamespace } from './util';
/**
 * @param {?} flags
 * @param {?} matchedQueriesDsl
 * @param {?} ngContentIndex
 * @param {?} childCount
 * @param {?=} templateFactory
 * @return {?}
 */
export function anchorDef(flags, matchedQueriesDsl, ngContentIndex, childCount, templateFactory) {
    const { matchedQueries, references, matchedQueryIds } = splitMatchedQueriesDsl(matchedQueriesDsl);
    // skip the call to sliceErrorStack itself + the call to this function.
    const /** @type {?} */ source = isDevMode() ? sliceErrorStack(2, 3) : '';
    const /** @type {?} */ template = templateFactory ? resolveViewDefinition(templateFactory) : null;
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
        flags,
        childFlags: 0,
        childMatchedQueries: 0, matchedQueries, matchedQueryIds, references, ngContentIndex, childCount,
        bindings: [],
        disposableCount: 0,
        element: {
            ns: undefined,
            name: undefined,
            attrs: undefined,
            outputs: [], template, source,
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
 * @param {?} namespaceAndName
 * @param {?=} fixedAttrs
 * @param {?=} bindings
 * @param {?=} outputs
 * @return {?}
 */
export function elementDef(flags, matchedQueriesDsl, ngContentIndex, childCount, namespaceAndName, fixedAttrs = [], bindings, outputs) {
    // skip the call to sliceErrorStack itself + the call to this function.
    const /** @type {?} */ source = isDevMode() ? sliceErrorStack(2, 3) : '';
    const { matchedQueries, references, matchedQueryIds } = splitMatchedQueriesDsl(matchedQueriesDsl);
    let /** @type {?} */ ns;
    let /** @type {?} */ name;
    if (namespaceAndName) {
        [ns, name] = splitNamespace(namespaceAndName);
    }
    bindings = bindings || [];
    const /** @type {?} */ bindingDefs = new Array(bindings.length);
    for (let /** @type {?} */ i = 0; i < bindings.length; i++) {
        const /** @type {?} */ entry = bindings[i];
        let /** @type {?} */ bindingDef;
        const /** @type {?} */ bindingType = entry[0];
        const [ns, name] = splitNamespace(entry[1]);
        let /** @type {?} */ securityContext;
        let /** @type {?} */ suffix;
        switch (bindingType) {
            case BindingType.ElementStyle:
                suffix = (entry[2]);
                break;
            case BindingType.ElementAttribute:
            case BindingType.ElementProperty:
                securityContext = (entry[2]);
                break;
        }
        bindingDefs[i] = { type: bindingType, ns, name, nonMinifiedName: name, securityContext, suffix };
    }
    outputs = outputs || [];
    const /** @type {?} */ outputDefs = new Array(outputs.length);
    for (let /** @type {?} */ i = 0; i < outputs.length; i++) {
        const /** @type {?} */ output = outputs[i];
        let /** @type {?} */ target;
        let /** @type {?} */ eventName;
        if (Array.isArray(output)) {
            [target, eventName] = output;
        }
        else {
            eventName = output;
        }
        outputDefs[i] = { eventName: eventName, target: target };
    }
    fixedAttrs = fixedAttrs || [];
    const /** @type {?} */ attrs = (fixedAttrs.map(([namespaceAndName, value]) => {
        const [ns, name] = splitNamespace(namespaceAndName);
        return [ns, name, value];
    }));
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
        flags,
        childFlags: 0,
        childMatchedQueries: 0, matchedQueries, matchedQueryIds, references, ngContentIndex, childCount,
        bindings: bindingDefs,
        disposableCount: outputDefs.length,
        element: {
            ns,
            name,
            attrs,
            outputs: outputDefs, source,
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
    const /** @type {?} */ elDef = def.element;
    const /** @type {?} */ rootSelectorOrNode = view.root.selectorOrNode;
    const /** @type {?} */ renderer = view.renderer;
    let /** @type {?} */ el;
    if (view.parent || !rootSelectorOrNode) {
        if (elDef.name) {
            el = renderer.createElement(elDef.name, elDef.ns);
        }
        else {
            el = renderer.createComment('');
        }
        const /** @type {?} */ parentEl = getParentRenderElement(view, renderHost, def);
        if (parentEl) {
            renderer.appendChild(parentEl, el);
        }
    }
    else {
        el = renderer.selectRootElement(rootSelectorOrNode);
    }
    if (elDef.attrs) {
        for (let /** @type {?} */ i = 0; i < elDef.attrs.length; i++) {
            const [ns, name, value] = elDef.attrs[i];
            renderer.setAttribute(el, name, value, ns);
        }
    }
    if (elDef.outputs.length) {
        for (let /** @type {?} */ i = 0; i < elDef.outputs.length; i++) {
            const /** @type {?} */ output = elDef.outputs[i];
            const /** @type {?} */ handleEventClosure = renderEventHandlerClosure(view, def.index, elementEventFullName(output.target, output.eventName));
            const /** @type {?} */ disposable = (renderer.listen(output.target || el, output.eventName, handleEventClosure));
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
    return (event) => dispatchEvent(view, index, eventName, event);
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
    for (let /** @type {?} */ i = 0; i < values.length; i++) {
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
    const /** @type {?} */ binding = def.bindings[bindingIdx];
    const /** @type {?} */ renderNode = asElementData(view, def.index).renderElement;
    const /** @type {?} */ name = binding.name;
    switch (binding.type) {
        case BindingType.ElementAttribute:
            setElementAttribute(view, binding, renderNode, binding.ns, name, value);
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
 * @param {?} ns
 * @param {?} name
 * @param {?} value
 * @return {?}
 */
function setElementAttribute(view, binding, renderNode, ns, name, value) {
    const /** @type {?} */ securityContext = binding.securityContext;
    let /** @type {?} */ renderValue = securityContext ? view.root.sanitizer.sanitize(securityContext, value) : value;
    renderValue = renderValue != null ? renderValue.toString() : null;
    const /** @type {?} */ renderer = view.renderer;
    if (value != null) {
        renderer.setAttribute(renderNode, name, renderValue, ns);
    }
    else {
        renderer.removeAttribute(renderNode, name, ns);
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
    const /** @type {?} */ renderer = view.renderer;
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
    let /** @type {?} */ renderValue = view.root.sanitizer.sanitize(SecurityContext.STYLE, value);
    if (renderValue != null) {
        renderValue = renderValue.toString();
        const /** @type {?} */ unit = binding.suffix;
        if (unit != null) {
            renderValue = renderValue + unit;
        }
    }
    else {
        renderValue = null;
    }
    const /** @type {?} */ renderer = view.renderer;
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
    const /** @type {?} */ securityContext = binding.securityContext;
    let /** @type {?} */ renderValue = securityContext ? view.root.sanitizer.sanitize(securityContext, value) : value;
    view.renderer.setProperty(renderNode, name, renderValue);
}
//# sourceMappingURL=element.js.map