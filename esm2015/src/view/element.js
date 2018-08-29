/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SecurityContext } from '../sanitization/security';
import { asElementData } from './types';
import { NOOP, calcBindingFlags, checkAndUpdateBinding, dispatchEvent, elementEventFullName, getParentRenderElement, resolveDefinition, resolveRendererType2, splitMatchedQueriesDsl, splitNamespace } from './util';
/**
 * @param {?} flags
 * @param {?} matchedQueriesDsl
 * @param {?} ngContentIndex
 * @param {?} childCount
 * @param {?=} handleEvent
 * @param {?=} templateFactory
 * @return {?}
 */
export function anchorDef(flags, matchedQueriesDsl, ngContentIndex, childCount, handleEvent, templateFactory) {
    flags |= 1 /* TypeElement */;
    const { matchedQueries, references, matchedQueryIds } = splitMatchedQueriesDsl(matchedQueriesDsl);
    /** @type {?} */
    const template = templateFactory ? resolveDefinition(templateFactory) : null;
    return {
        // will bet set by the view definition
        nodeIndex: -1,
        parent: null,
        renderParent: null,
        bindingIndex: -1,
        outputIndex: -1,
        // regular values
        flags,
        checkIndex: -1,
        childFlags: 0,
        directChildFlags: 0,
        childMatchedQueries: 0, matchedQueries, matchedQueryIds, references, ngContentIndex, childCount,
        bindings: [],
        bindingFlags: 0,
        outputs: [],
        element: {
            ns: null,
            name: null,
            attrs: null, template,
            componentProvider: null,
            componentView: null,
            componentRendererType: null,
            publicProviders: null,
            allProviders: null,
            handleEvent: handleEvent || NOOP
        },
        provider: null,
        text: null,
        query: null,
        ngContent: null
    };
}
/**
 * @param {?} checkIndex
 * @param {?} flags
 * @param {?} matchedQueriesDsl
 * @param {?} ngContentIndex
 * @param {?} childCount
 * @param {?} namespaceAndName
 * @param {?=} fixedAttrs
 * @param {?=} bindings
 * @param {?=} outputs
 * @param {?=} handleEvent
 * @param {?=} componentView
 * @param {?=} componentRendererType
 * @return {?}
 */
export function elementDef(checkIndex, flags, matchedQueriesDsl, ngContentIndex, childCount, namespaceAndName, fixedAttrs = [], bindings, outputs, handleEvent, componentView, componentRendererType) {
    if (!handleEvent) {
        handleEvent = NOOP;
    }
    const { matchedQueries, references, matchedQueryIds } = splitMatchedQueriesDsl(matchedQueriesDsl);
    /** @type {?} */
    let ns = /** @type {?} */ ((null));
    /** @type {?} */
    let name = /** @type {?} */ ((null));
    if (namespaceAndName) {
        [ns, name] = splitNamespace(namespaceAndName);
    }
    bindings = bindings || [];
    /** @type {?} */
    const bindingDefs = new Array(bindings.length);
    for (let i = 0; i < bindings.length; i++) {
        const [bindingFlags, namespaceAndName, suffixOrSecurityContext] = bindings[i];
        const [ns, name] = splitNamespace(namespaceAndName);
        /** @type {?} */
        let securityContext = /** @type {?} */ ((undefined));
        /** @type {?} */
        let suffix = /** @type {?} */ ((undefined));
        switch (bindingFlags & 15 /* Types */) {
            case 4 /* TypeElementStyle */:
                suffix = /** @type {?} */ (suffixOrSecurityContext);
                break;
            case 1 /* TypeElementAttribute */:
            case 8 /* TypeProperty */:
                securityContext = /** @type {?} */ (suffixOrSecurityContext);
                break;
        }
        bindingDefs[i] =
            { flags: bindingFlags, ns, name, nonMinifiedName: name, securityContext, suffix };
    }
    outputs = outputs || [];
    /** @type {?} */
    const outputDefs = new Array(outputs.length);
    for (let i = 0; i < outputs.length; i++) {
        const [target, eventName] = outputs[i];
        outputDefs[i] = {
            type: 0 /* ElementOutput */,
            target: /** @type {?} */ (target), eventName,
            propName: null
        };
    }
    fixedAttrs = fixedAttrs || [];
    /** @type {?} */
    const attrs = /** @type {?} */ (fixedAttrs.map(([namespaceAndName, value]) => {
        const [ns, name] = splitNamespace(namespaceAndName);
        return [ns, name, value];
    }));
    componentRendererType = resolveRendererType2(componentRendererType);
    if (componentView) {
        flags |= 33554432 /* ComponentView */;
    }
    flags |= 1 /* TypeElement */;
    return {
        // will bet set by the view definition
        nodeIndex: -1,
        parent: null,
        renderParent: null,
        bindingIndex: -1,
        outputIndex: -1,
        // regular values
        checkIndex,
        flags,
        childFlags: 0,
        directChildFlags: 0,
        childMatchedQueries: 0, matchedQueries, matchedQueryIds, references, ngContentIndex, childCount,
        bindings: bindingDefs,
        bindingFlags: calcBindingFlags(bindingDefs),
        outputs: outputDefs,
        element: {
            ns,
            name,
            attrs,
            template: null,
            // will bet set by the view definition
            componentProvider: null,
            componentView: componentView || null,
            componentRendererType: componentRendererType,
            publicProviders: null,
            allProviders: null,
            handleEvent: handleEvent || NOOP,
        },
        provider: null,
        text: null,
        query: null,
        ngContent: null
    };
}
/**
 * @param {?} view
 * @param {?} renderHost
 * @param {?} def
 * @return {?}
 */
export function createElement(view, renderHost, def) {
    /** @type {?} */
    const elDef = /** @type {?} */ ((def.element));
    /** @type {?} */
    const rootSelectorOrNode = view.root.selectorOrNode;
    /** @type {?} */
    const renderer = view.renderer;
    /** @type {?} */
    let el;
    if (view.parent || !rootSelectorOrNode) {
        if (elDef.name) {
            el = renderer.createElement(elDef.name, elDef.ns);
        }
        else {
            el = renderer.createComment('');
        }
        /** @type {?} */
        const parentEl = getParentRenderElement(view, renderHost, def);
        if (parentEl) {
            renderer.appendChild(parentEl, el);
        }
    }
    else {
        el = renderer.selectRootElement(rootSelectorOrNode);
    }
    if (elDef.attrs) {
        for (let i = 0; i < elDef.attrs.length; i++) {
            const [ns, name, value] = elDef.attrs[i];
            renderer.setAttribute(el, name, value, ns);
        }
    }
    return el;
}
/**
 * @param {?} view
 * @param {?} compView
 * @param {?} def
 * @param {?} el
 * @return {?}
 */
export function listenToElementOutputs(view, compView, def, el) {
    for (let i = 0; i < def.outputs.length; i++) {
        /** @type {?} */
        const output = def.outputs[i];
        /** @type {?} */
        const handleEventClosure = renderEventHandlerClosure(view, def.nodeIndex, elementEventFullName(output.target, output.eventName));
        /** @type {?} */
        let listenTarget = output.target;
        /** @type {?} */
        let listenerView = view;
        if (output.target === 'component') {
            listenTarget = null;
            listenerView = compView;
        }
        /** @type {?} */
        const disposable = /** @type {?} */ (listenerView.renderer.listen(listenTarget || el, output.eventName, handleEventClosure)); /** @type {?} */
        ((view.disposables))[def.outputIndex + i] = disposable;
    }
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
    /** @type {?} */
    const bindLen = def.bindings.length;
    /** @type {?} */
    let changed = false;
    if (bindLen > 0 && checkAndUpdateElementValue(view, def, 0, v0))
        changed = true;
    if (bindLen > 1 && checkAndUpdateElementValue(view, def, 1, v1))
        changed = true;
    if (bindLen > 2 && checkAndUpdateElementValue(view, def, 2, v2))
        changed = true;
    if (bindLen > 3 && checkAndUpdateElementValue(view, def, 3, v3))
        changed = true;
    if (bindLen > 4 && checkAndUpdateElementValue(view, def, 4, v4))
        changed = true;
    if (bindLen > 5 && checkAndUpdateElementValue(view, def, 5, v5))
        changed = true;
    if (bindLen > 6 && checkAndUpdateElementValue(view, def, 6, v6))
        changed = true;
    if (bindLen > 7 && checkAndUpdateElementValue(view, def, 7, v7))
        changed = true;
    if (bindLen > 8 && checkAndUpdateElementValue(view, def, 8, v8))
        changed = true;
    if (bindLen > 9 && checkAndUpdateElementValue(view, def, 9, v9))
        changed = true;
    return changed;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} values
 * @return {?}
 */
export function checkAndUpdateElementDynamic(view, def, values) {
    /** @type {?} */
    let changed = false;
    for (let i = 0; i < values.length; i++) {
        if (checkAndUpdateElementValue(view, def, i, values[i]))
            changed = true;
    }
    return changed;
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
        return false;
    }
    /** @type {?} */
    const binding = def.bindings[bindingIdx];
    /** @type {?} */
    const elData = asElementData(view, def.nodeIndex);
    /** @type {?} */
    const renderNode = elData.renderElement;
    /** @type {?} */
    const name = /** @type {?} */ ((binding.name));
    switch (binding.flags & 15 /* Types */) {
        case 1 /* TypeElementAttribute */:
            setElementAttribute(view, binding, renderNode, binding.ns, name, value);
            break;
        case 2 /* TypeElementClass */:
            setElementClass(view, renderNode, name, value);
            break;
        case 4 /* TypeElementStyle */:
            setElementStyle(view, binding, renderNode, name, value);
            break;
        case 8 /* TypeProperty */:
            /** @type {?} */
            const bindView = (def.flags & 33554432 /* ComponentView */ &&
                binding.flags & 32 /* SyntheticHostProperty */) ?
                elData.componentView :
                view;
            setElementProperty(bindView, binding, renderNode, name, value);
            break;
    }
    return true;
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
    /** @type {?} */
    const securityContext = binding.securityContext;
    /** @type {?} */
    let renderValue = securityContext ? view.root.sanitizer.sanitize(securityContext, value) : value;
    renderValue = renderValue != null ? renderValue.toString() : null;
    /** @type {?} */
    const renderer = view.renderer;
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
    /** @type {?} */
    const renderer = view.renderer;
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
    /** @type {?} */
    let renderValue = view.root.sanitizer.sanitize(SecurityContext.STYLE, /** @type {?} */ (value));
    if (renderValue != null) {
        renderValue = renderValue.toString();
        /** @type {?} */
        const unit = binding.suffix;
        if (unit != null) {
            renderValue = renderValue + unit;
        }
    }
    else {
        renderValue = null;
    }
    /** @type {?} */
    const renderer = view.renderer;
    if (renderValue != null) {
        renderer.setStyle(renderNode, name, renderValue);
    }
    else {
        renderer.removeStyle(renderNode, name);
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
    /** @type {?} */
    const securityContext = binding.securityContext;
    /** @type {?} */
    let renderValue = securityContext ? view.root.sanitizer.sanitize(securityContext, value) : value;
    view.renderer.setProperty(renderNode, name, renderValue);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUV6RCxPQUFPLEVBQTBKLGFBQWEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMvTCxPQUFPLEVBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxzQkFBc0IsRUFBRSxpQkFBaUIsRUFBRSxvQkFBb0IsRUFBRSxzQkFBc0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7Ozs7QUFFbk4sTUFBTSxVQUFVLFNBQVMsQ0FDckIsS0FBZ0IsRUFBRSxpQkFBNkQsRUFDL0UsY0FBNkIsRUFBRSxVQUFrQixFQUFFLFdBQXlDLEVBQzVGLGVBQXVDO0lBQ3pDLEtBQUssdUJBQXlCLENBQUM7SUFDL0IsTUFBTSxFQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUsZUFBZSxFQUFDLEdBQUcsc0JBQXNCLENBQUMsaUJBQWlCLENBQUMsQ0FBQzs7SUFDaEcsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRTdFLE9BQU87O1FBRUwsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUNiLE1BQU0sRUFBRSxJQUFJO1FBQ1osWUFBWSxFQUFFLElBQUk7UUFDbEIsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUNoQixXQUFXLEVBQUUsQ0FBQyxDQUFDOztRQUVmLEtBQUs7UUFDTCxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ2QsVUFBVSxFQUFFLENBQUM7UUFDYixnQkFBZ0IsRUFBRSxDQUFDO1FBQ25CLG1CQUFtQixFQUFFLENB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QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDakcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztDQUMxRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZW5kZXJlclR5cGUyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7U2VjdXJpdHlDb250ZXh0fSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuXG5pbXBvcnQge0JpbmRpbmdEZWYsIEJpbmRpbmdGbGFncywgRWxlbWVudERhdGEsIEVsZW1lbnRIYW5kbGVFdmVudEZuLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIE91dHB1dERlZiwgT3V0cHV0VHlwZSwgUXVlcnlWYWx1ZVR5cGUsIFZpZXdEYXRhLCBWaWV3RGVmaW5pdGlvbkZhY3RvcnksIGFzRWxlbWVudERhdGF9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtOT09QLCBjYWxjQmluZGluZ0ZsYWdzLCBjaGVja0FuZFVwZGF0ZUJpbmRpbmcsIGRpc3BhdGNoRXZlbnQsIGVsZW1lbnRFdmVudEZ1bGxOYW1lLCBnZXRQYXJlbnRSZW5kZXJFbGVtZW50LCByZXNvbHZlRGVmaW5pdGlvbiwgcmVzb2x2ZVJlbmRlcmVyVHlwZTIsIHNwbGl0TWF0Y2hlZFF1ZXJpZXNEc2wsIHNwbGl0TmFtZXNwYWNlfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gYW5jaG9yRGVmKFxuICAgIGZsYWdzOiBOb2RlRmxhZ3MsIG1hdGNoZWRRdWVyaWVzRHNsOiBudWxsIHwgW3N0cmluZyB8IG51bWJlciwgUXVlcnlWYWx1ZVR5cGVdW10sXG4gICAgbmdDb250ZW50SW5kZXg6IG51bGwgfCBudW1iZXIsIGNoaWxkQ291bnQ6IG51bWJlciwgaGFuZGxlRXZlbnQ/OiBudWxsIHwgRWxlbWVudEhhbmRsZUV2ZW50Rm4sXG4gICAgdGVtcGxhdGVGYWN0b3J5PzogVmlld0RlZmluaXRpb25GYWN0b3J5KTogTm9kZURlZiB7XG4gIGZsYWdzIHw9IE5vZGVGbGFncy5UeXBlRWxlbWVudDtcbiAgY29uc3Qge21hdGNoZWRRdWVyaWVzLCByZWZlcmVuY2VzLCBtYXRjaGVkUXVlcnlJZHN9ID0gc3BsaXRNYXRjaGVkUXVlcmllc0RzbChtYXRjaGVkUXVlcmllc0RzbCk7XG4gIGNvbnN0IHRlbXBsYXRlID0gdGVtcGxhdGVGYWN0b3J5ID8gcmVzb2x2ZURlZmluaXRpb24odGVtcGxhdGVGYWN0b3J5KSA6IG51bGw7XG5cbiAgcmV0dXJuIHtcbiAgICAvLyB3aWxsIGJldCBzZXQgYnkgdGhlIHZpZXcgZGVmaW5pdGlvblxuICAgIG5vZGVJbmRleDogLTEsXG4gICAgcGFyZW50OiBudWxsLFxuICAgIHJlbmRlclBhcmVudDogbnVsbCxcbiAgICBiaW5kaW5nSW5kZXg6IC0xLFxuICAgIG91dHB1dEluZGV4OiAtMSxcbiAgICAvLyByZWd1bGFyIHZhbHVlc1xuICAgIGZsYWdzLFxuICAgIGNoZWNrSW5kZXg6IC0xLFxuICAgIGNoaWxkRmxhZ3M6IDAsXG4gICAgZGlyZWN0Q2hpbGRGbGFnczogMCxcbiAgICBjaGlsZE1hdGNoZWRRdWVyaWVzOiAwLCBtYXRjaGVkUXVlcmllcywgbWF0Y2hlZFF1ZXJ5SWRzLCByZWZlcmVuY2VzLCBuZ0NvbnRlbnRJbmRleCwgY2hpbGRDb3VudCxcbiAgICBiaW5kaW5nczogW10sXG4gICAgYmluZGluZ0ZsYWdzOiAwLFxuICAgIG91dHB1dHM6IFtdLFxuICAgIGVsZW1lbnQ6IHtcbiAgICAgIG5zOiBudWxsLFxuICAgICAgbmFtZTogbnVsbCxcbiAgICAgIGF0dHJzOiBudWxsLCB0ZW1wbGF0ZSxcbiAgICAgIGNvbXBvbmVudFByb3ZpZGVyOiBudWxsLFxuICAgICAgY29tcG9uZW50VmlldzogbnVsbCxcbiAgICAgIGNvbXBvbmVudFJlbmRlcmVyVHlwZTogbnVsbCxcbiAgICAgIHB1YmxpY1Byb3ZpZGVyczogbnVsbCxcbiAgICAgIGFsbFByb3ZpZGVyczogbnVsbCxcbiAgICAgIGhhbmRsZUV2ZW50OiBoYW5kbGVFdmVudCB8fCBOT09QXG4gICAgfSxcbiAgICBwcm92aWRlcjogbnVsbCxcbiAgICB0ZXh0OiBudWxsLFxuICAgIHF1ZXJ5OiBudWxsLFxuICAgIG5nQ29udGVudDogbnVsbFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudERlZihcbiAgICBjaGVja0luZGV4OiBudW1iZXIsIGZsYWdzOiBOb2RlRmxhZ3MsXG4gICAgbWF0Y2hlZFF1ZXJpZXNEc2w6IG51bGwgfCBbc3RyaW5nIHwgbnVtYmVyLCBRdWVyeVZhbHVlVHlwZV1bXSwgbmdDb250ZW50SW5kZXg6IG51bGwgfCBudW1iZXIsXG4gICAgY2hpbGRDb3VudDogbnVtYmVyLCBuYW1lc3BhY2VBbmROYW1lOiBzdHJpbmcgfCBudWxsLCBmaXhlZEF0dHJzOiBudWxsIHwgW3N0cmluZywgc3RyaW5nXVtdID0gW10sXG4gICAgYmluZGluZ3M/OiBudWxsIHwgW0JpbmRpbmdGbGFncywgc3RyaW5nLCBzdHJpbmcgfCBTZWN1cml0eUNvbnRleHQgfCBudWxsXVtdLFxuICAgIG91dHB1dHM/OiBudWxsIHwgKFtzdHJpbmcsIHN0cmluZ10pW10sIGhhbmRsZUV2ZW50PzogbnVsbCB8IEVsZW1lbnRIYW5kbGVFdmVudEZuLFxuICAgIGNvbXBvbmVudFZpZXc/OiBudWxsIHwgVmlld0RlZmluaXRpb25GYWN0b3J5LFxuICAgIGNvbXBvbmVudFJlbmRlcmVyVHlwZT86IFJlbmRlcmVyVHlwZTIgfCBudWxsKTogTm9kZURlZiB7XG4gIGlmICghaGFuZGxlRXZlbnQpIHtcbiAgICBoYW5kbGVFdmVudCA9IE5PT1A7XG4gIH1cbiAgY29uc3Qge21hdGNoZWRRdWVyaWVzLCByZWZlcmVuY2VzLCBtYXRjaGVkUXVlcnlJZHN9ID0gc3BsaXRNYXRjaGVkUXVlcmllc0RzbChtYXRjaGVkUXVlcmllc0RzbCk7XG4gIGxldCBuczogc3RyaW5nID0gbnVsbCAhO1xuICBsZXQgbmFtZTogc3RyaW5nID0gbnVsbCAhO1xuICBpZiAobmFtZXNwYWNlQW5kTmFtZSkge1xuICAgIFtucywgbmFtZV0gPSBzcGxpdE5hbWVzcGFjZShuYW1lc3BhY2VBbmROYW1lKTtcbiAgfVxuICBiaW5kaW5ncyA9IGJpbmRpbmdzIHx8IFtdO1xuICBjb25zdCBiaW5kaW5nRGVmczogQmluZGluZ0RlZltdID0gbmV3IEFycmF5KGJpbmRpbmdzLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBbYmluZGluZ0ZsYWdzLCBuYW1lc3BhY2VBbmROYW1lLCBzdWZmaXhPclNlY3VyaXR5Q29udGV4dF0gPSBiaW5kaW5nc1tpXTtcblxuICAgIGNvbnN0IFtucywgbmFtZV0gPSBzcGxpdE5hbWVzcGFjZShuYW1lc3BhY2VBbmROYW1lKTtcbiAgICBsZXQgc2VjdXJpdHlDb250ZXh0OiBTZWN1cml0eUNvbnRleHQgPSB1bmRlZmluZWQgITtcbiAgICBsZXQgc3VmZml4OiBzdHJpbmcgPSB1bmRlZmluZWQgITtcbiAgICBzd2l0Y2ggKGJpbmRpbmdGbGFncyAmIEJpbmRpbmdGbGFncy5UeXBlcykge1xuICAgICAgY2FzZSBCaW5kaW5nRmxhZ3MuVHlwZUVsZW1lbnRTdHlsZTpcbiAgICAgICAgc3VmZml4ID0gPHN0cmluZz5zdWZmaXhPclNlY3VyaXR5Q29udGV4dDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEJpbmRpbmdGbGFncy5UeXBlRWxlbWVudEF0dHJpYnV0ZTpcbiAgICAgIGNhc2UgQmluZGluZ0ZsYWdzLlR5cGVQcm9wZXJ0eTpcbiAgICAgICAgc2VjdXJpdHlDb250ZXh0ID0gPFNlY3VyaXR5Q29udGV4dD5zdWZmaXhPclNlY3VyaXR5Q29udGV4dDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGJpbmRpbmdEZWZzW2ldID1cbiAgICAgICAge2ZsYWdzOiBiaW5kaW5nRmxhZ3MsIG5zLCBuYW1lLCBub25NaW5pZmllZE5hbWU6IG5hbWUsIHNlY3VyaXR5Q29udGV4dCwgc3VmZml4fTtcbiAgfVxuICBvdXRwdXRzID0gb3V0cHV0cyB8fCBbXTtcbiAgY29uc3Qgb3V0cHV0RGVmczogT3V0cHV0RGVmW10gPSBuZXcgQXJyYXkob3V0cHV0cy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBbdGFyZ2V0LCBldmVudE5hbWVdID0gb3V0cHV0c1tpXTtcbiAgICBvdXRwdXREZWZzW2ldID0ge1xuICAgICAgdHlwZTogT3V0cHV0VHlwZS5FbGVtZW50T3V0cHV0LFxuICAgICAgdGFyZ2V0OiA8YW55PnRhcmdldCwgZXZlbnROYW1lLFxuICAgICAgcHJvcE5hbWU6IG51bGxcbiAgICB9O1xuICB9XG4gIGZpeGVkQXR0cnMgPSBmaXhlZEF0dHJzIHx8IFtdO1xuICBjb25zdCBhdHRycyA9IDxbc3RyaW5nLCBzdHJpbmcsIHN0cmluZ11bXT5maXhlZEF0dHJzLm1hcCgoW25hbWVzcGFjZUFuZE5hbWUsIHZhbHVlXSkgPT4ge1xuICAgIGNvbnN0IFtucywgbmFtZV0gPSBzcGxpdE5hbWVzcGFjZShuYW1lc3BhY2VBbmROYW1lKTtcbiAgICByZXR1cm4gW25zLCBuYW1lLCB2YWx1ZV07XG4gIH0pO1xuICBjb21wb25lbnRSZW5kZXJlclR5cGUgPSByZXNvbHZlUmVuZGVyZXJUeXBlMihjb21wb25lbnRSZW5kZXJlclR5cGUpO1xuICBpZiAoY29tcG9uZW50Vmlldykge1xuICAgIGZsYWdzIHw9IE5vZGVGbGFncy5Db21wb25lbnRWaWV3O1xuICB9XG4gIGZsYWdzIHw9IE5vZGVGbGFncy5UeXBlRWxlbWVudDtcbiAgcmV0dXJuIHtcbiAgICAvLyB3aWxsIGJldCBzZXQgYnkgdGhlIHZpZXcgZGVmaW5pdGlvblxuICAgIG5vZGVJbmRleDogLTEsXG4gICAgcGFyZW50OiBudWxsLFxuICAgIHJlbmRlclBhcmVudDogbnVsbCxcbiAgICBiaW5kaW5nSW5kZXg6IC0xLFxuICAgIG91dHB1dEluZGV4OiAtMSxcbiAgICAvLyByZWd1bGFyIHZhbHVlc1xuICAgIGNoZWNrSW5kZXgsXG4gICAgZmxhZ3MsXG4gICAgY2hpbGRGbGFnczogMCxcbiAgICBkaXJlY3RDaGlsZEZsYWdzOiAwLFxuICAgIGNoaWxkTWF0Y2hlZFF1ZXJpZXM6IDAsIG1hdGNoZWRRdWVyaWVzLCBtYXRjaGVkUXVlcnlJZHMsIHJlZmVyZW5jZXMsIG5nQ29udGVudEluZGV4LCBjaGlsZENvdW50LFxuICAgIGJpbmRpbmdzOiBiaW5kaW5nRGVmcyxcbiAgICBiaW5kaW5nRmxhZ3M6IGNhbGNCaW5kaW5nRmxhZ3MoYmluZGluZ0RlZnMpLFxuICAgIG91dHB1dHM6IG91dHB1dERlZnMsXG4gICAgZWxlbWVudDoge1xuICAgICAgbnMsXG4gICAgICBuYW1lLFxuICAgICAgYXR0cnMsXG4gICAgICB0ZW1wbGF0ZTogbnVsbCxcbiAgICAgIC8vIHdpbGwgYmV0IHNldCBieSB0aGUgdmlldyBkZWZpbml0aW9uXG4gICAgICBjb21wb25lbnRQcm92aWRlcjogbnVsbCxcbiAgICAgIGNvbXBvbmVudFZpZXc6IGNvbXBvbmVudFZpZXcgfHwgbnVsbCxcbiAgICAgIGNvbXBvbmVudFJlbmRlcmVyVHlwZTogY29tcG9uZW50UmVuZGVyZXJUeXBlLFxuICAgICAgcHVibGljUHJvdmlkZXJzOiBudWxsLFxuICAgICAgYWxsUHJvdmlkZXJzOiBudWxsLFxuICAgICAgaGFuZGxlRXZlbnQ6IGhhbmRsZUV2ZW50IHx8IE5PT1AsXG4gICAgfSxcbiAgICBwcm92aWRlcjogbnVsbCxcbiAgICB0ZXh0OiBudWxsLFxuICAgIHF1ZXJ5OiBudWxsLFxuICAgIG5nQ29udGVudDogbnVsbFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh2aWV3OiBWaWV3RGF0YSwgcmVuZGVySG9zdDogYW55LCBkZWY6IE5vZGVEZWYpOiBFbGVtZW50RGF0YSB7XG4gIGNvbnN0IGVsRGVmID0gZGVmLmVsZW1lbnQgITtcbiAgY29uc3Qgcm9vdFNlbGVjdG9yT3JOb2RlID0gdmlldy5yb290LnNlbGVjdG9yT3JOb2RlO1xuICBjb25zdCByZW5kZXJlciA9IHZpZXcucmVuZGVyZXI7XG4gIGxldCBlbDogYW55O1xuICBpZiAodmlldy5wYXJlbnQgfHwgIXJvb3RTZWxlY3Rvck9yTm9kZSkge1xuICAgIGlmIChlbERlZi5uYW1lKSB7XG4gICAgICBlbCA9IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQoZWxEZWYubmFtZSwgZWxEZWYubnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbCA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQoJycpO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRFbCA9IGdldFBhcmVudFJlbmRlckVsZW1lbnQodmlldywgcmVuZGVySG9zdCwgZGVmKTtcbiAgICBpZiAocGFyZW50RWwpIHtcbiAgICAgIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudEVsLCBlbCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGVsID0gcmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQocm9vdFNlbGVjdG9yT3JOb2RlKTtcbiAgfVxuICBpZiAoZWxEZWYuYXR0cnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsRGVmLmF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBbbnMsIG5hbWUsIHZhbHVlXSA9IGVsRGVmLmF0dHJzW2ldO1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsLCBuYW1lLCB2YWx1ZSwgbnMpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0ZW5Ub0VsZW1lbnRPdXRwdXRzKHZpZXc6IFZpZXdEYXRhLCBjb21wVmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgZWw6IGFueSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5vdXRwdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3V0cHV0ID0gZGVmLm91dHB1dHNbaV07XG4gICAgY29uc3QgaGFuZGxlRXZlbnRDbG9zdXJlID0gcmVuZGVyRXZlbnRIYW5kbGVyQ2xvc3VyZShcbiAgICAgICAgdmlldywgZGVmLm5vZGVJbmRleCwgZWxlbWVudEV2ZW50RnVsbE5hbWUob3V0cHV0LnRhcmdldCwgb3V0cHV0LmV2ZW50TmFtZSkpO1xuICAgIGxldCBsaXN0ZW5UYXJnZXQ6ICd3aW5kb3cnfCdkb2N1bWVudCd8J2JvZHknfCdjb21wb25lbnQnfG51bGwgPSBvdXRwdXQudGFyZ2V0O1xuICAgIGxldCBsaXN0ZW5lclZpZXcgPSB2aWV3O1xuICAgIGlmIChvdXRwdXQudGFyZ2V0ID09PSAnY29tcG9uZW50Jykge1xuICAgICAgbGlzdGVuVGFyZ2V0ID0gbnVsbDtcbiAgICAgIGxpc3RlbmVyVmlldyA9IGNvbXBWaWV3O1xuICAgIH1cbiAgICBjb25zdCBkaXNwb3NhYmxlID1cbiAgICAgICAgPGFueT5saXN0ZW5lclZpZXcucmVuZGVyZXIubGlzdGVuKGxpc3RlblRhcmdldCB8fCBlbCwgb3V0cHV0LmV2ZW50TmFtZSwgaGFuZGxlRXZlbnRDbG9zdXJlKTtcbiAgICB2aWV3LmRpc3Bvc2FibGVzICFbZGVmLm91dHB1dEluZGV4ICsgaV0gPSBkaXNwb3NhYmxlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckV2ZW50SGFuZGxlckNsb3N1cmUodmlldzogVmlld0RhdGEsIGluZGV4OiBudW1iZXIsIGV2ZW50TmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiAoZXZlbnQ6IGFueSkgPT4gZGlzcGF0Y2hFdmVudCh2aWV3LCBpbmRleCwgZXZlbnROYW1lLCBldmVudCk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlRWxlbWVudElubGluZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55LFxuICAgIHY3OiBhbnksIHY4OiBhbnksIHY5OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgYmluZExlbiA9IGRlZi5iaW5kaW5ncy5sZW5ndGg7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGlmIChiaW5kTGVuID4gMCAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDAsIHYwKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gMSAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDEsIHYxKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gMiAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDIsIHYyKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gMyAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDMsIHYzKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNCAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDQsIHY0KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNSAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDUsIHY1KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNiAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDYsIHY2KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNyAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDcsIHY3KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gOCAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDgsIHY4KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gOSAmJiBjaGVja0FuZFVwZGF0ZUVsZW1lbnRWYWx1ZSh2aWV3LCBkZWYsIDksIHY5KSkgY2hhbmdlZCA9IHRydWU7XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVFbGVtZW50RHluYW1pYyh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmLCB2YWx1ZXM6IGFueVtdKTogYm9vbGVhbiB7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNoZWNrQW5kVXBkYXRlRWxlbWVudFZhbHVlKHZpZXcsIGRlZiwgaSwgdmFsdWVzW2ldKSkgY2hhbmdlZCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbmZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlRWxlbWVudFZhbHVlKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIGJpbmRpbmdJZHg6IG51bWJlciwgdmFsdWU6IGFueSkge1xuICBpZiAoIWNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIGJpbmRpbmdJZHgsIHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBiaW5kaW5nID0gZGVmLmJpbmRpbmdzW2JpbmRpbmdJZHhdO1xuICBjb25zdCBlbERhdGEgPSBhc0VsZW1lbnREYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICBjb25zdCByZW5kZXJOb2RlID0gZWxEYXRhLnJlbmRlckVsZW1lbnQ7XG4gIGNvbnN0IG5hbWUgPSBiaW5kaW5nLm5hbWUgITtcbiAgc3dpdGNoIChiaW5kaW5nLmZsYWdzICYgQmluZGluZ0ZsYWdzLlR5cGVzKSB7XG4gICAgY2FzZSBCaW5kaW5nRmxhZ3MuVHlwZUVsZW1lbnRBdHRyaWJ1dGU6XG4gICAgICBzZXRFbGVtZW50QXR0cmlidXRlKHZpZXcsIGJpbmRpbmcsIHJlbmRlck5vZGUsIGJpbmRpbmcubnMsIG5hbWUsIHZhbHVlKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQmluZGluZ0ZsYWdzLlR5cGVFbGVtZW50Q2xhc3M6XG4gICAgICBzZXRFbGVtZW50Q2xhc3ModmlldywgcmVuZGVyTm9kZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBCaW5kaW5nRmxhZ3MuVHlwZUVsZW1lbnRTdHlsZTpcbiAgICAgIHNldEVsZW1lbnRTdHlsZSh2aWV3LCBiaW5kaW5nLCByZW5kZXJOb2RlLCBuYW1lLCB2YWx1ZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIEJpbmRpbmdGbGFncy5UeXBlUHJvcGVydHk6XG4gICAgICBjb25zdCBiaW5kVmlldyA9IChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50VmlldyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZy5mbGFncyAmIEJpbmRpbmdGbGFncy5TeW50aGV0aWNIb3N0UHJvcGVydHkpID9cbiAgICAgICAgICBlbERhdGEuY29tcG9uZW50VmlldyA6XG4gICAgICAgICAgdmlldztcbiAgICAgIHNldEVsZW1lbnRQcm9wZXJ0eShiaW5kVmlldywgYmluZGluZywgcmVuZGVyTm9kZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHNldEVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgdmlldzogVmlld0RhdGEsIGJpbmRpbmc6IEJpbmRpbmdEZWYsIHJlbmRlck5vZGU6IGFueSwgbnM6IHN0cmluZyB8IG51bGwsIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IHNlY3VyaXR5Q29udGV4dCA9IGJpbmRpbmcuc2VjdXJpdHlDb250ZXh0O1xuICBsZXQgcmVuZGVyVmFsdWUgPSBzZWN1cml0eUNvbnRleHQgPyB2aWV3LnJvb3Quc2FuaXRpemVyLnNhbml0aXplKHNlY3VyaXR5Q29udGV4dCwgdmFsdWUpIDogdmFsdWU7XG4gIHJlbmRlclZhbHVlID0gcmVuZGVyVmFsdWUgIT0gbnVsbCA/IHJlbmRlclZhbHVlLnRvU3RyaW5nKCkgOiBudWxsO1xuICBjb25zdCByZW5kZXJlciA9IHZpZXcucmVuZGVyZXI7XG4gIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKHJlbmRlck5vZGUsIG5hbWUsIHJlbmRlclZhbHVlLCBucyk7XG4gIH0gZWxzZSB7XG4gICAgcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKHJlbmRlck5vZGUsIG5hbWUsIG5zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRFbGVtZW50Q2xhc3ModmlldzogVmlld0RhdGEsIHJlbmRlck5vZGU6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbikge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXcucmVuZGVyZXI7XG4gIGlmICh2YWx1ZSkge1xuICAgIHJlbmRlcmVyLmFkZENsYXNzKHJlbmRlck5vZGUsIG5hbWUpO1xuICB9IGVsc2Uge1xuICAgIHJlbmRlcmVyLnJlbW92ZUNsYXNzKHJlbmRlck5vZGUsIG5hbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldEVsZW1lbnRTdHlsZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgYmluZGluZzogQmluZGluZ0RlZiwgcmVuZGVyTm9kZTogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgbGV0IHJlbmRlclZhbHVlOiBzdHJpbmd8bnVsbCA9XG4gICAgICB2aWV3LnJvb3Quc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TVFlMRSwgdmFsdWUgYXN7fSB8IHN0cmluZyk7XG4gIGlmIChyZW5kZXJWYWx1ZSAhPSBudWxsKSB7XG4gICAgcmVuZGVyVmFsdWUgPSByZW5kZXJWYWx1ZS50b1N0cmluZygpO1xuICAgIGNvbnN0IHVuaXQgPSBiaW5kaW5nLnN1ZmZpeDtcbiAgICBpZiAodW5pdCAhPSBudWxsKSB7XG4gICAgICByZW5kZXJWYWx1ZSA9IHJlbmRlclZhbHVlICsgdW5pdDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmVuZGVyVmFsdWUgPSBudWxsO1xuICB9XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlldy5yZW5kZXJlcjtcbiAgaWYgKHJlbmRlclZhbHVlICE9IG51bGwpIHtcbiAgICByZW5kZXJlci5zZXRTdHlsZShyZW5kZXJOb2RlLCBuYW1lLCByZW5kZXJWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUocmVuZGVyTm9kZSwgbmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0RWxlbWVudFByb3BlcnR5KFxuICAgIHZpZXc6IFZpZXdEYXRhLCBiaW5kaW5nOiBCaW5kaW5nRGVmLCByZW5kZXJOb2RlOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBjb25zdCBzZWN1cml0eUNvbnRleHQgPSBiaW5kaW5nLnNlY3VyaXR5Q29udGV4dDtcbiAgbGV0IHJlbmRlclZhbHVlID0gc2VjdXJpdHlDb250ZXh0ID8gdmlldy5yb290LnNhbml0aXplci5zYW5pdGl6ZShzZWN1cml0eUNvbnRleHQsIHZhbHVlKSA6IHZhbHVlO1xuICB2aWV3LnJlbmRlcmVyLnNldFByb3BlcnR5KHJlbmRlck5vZGUsIG5hbWUsIHJlbmRlclZhbHVlKTtcbn1cbiJdfQ==