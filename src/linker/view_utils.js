/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationQueue } from '../animation/animation_queue';
import { SimpleChange, devModeEqual } from '../change_detection/change_detection';
import { Injectable } from '../di';
import { isPresent, looseIdentical } from '../facade/lang';
import { RenderComponentType, RootRenderer } from '../render/api';
import { Sanitizer } from '../security';
import { VERSION } from '../version';
import { ExpressionChangedAfterItHasBeenCheckedError } from './errors';
export class ViewUtils {
    /**
     * @param {?} _renderer
     * @param {?} sanitizer
     * @param {?} animationQueue
     */
    constructor(_renderer, sanitizer, animationQueue) {
        this._renderer = _renderer;
        this.animationQueue = animationQueue;
        this.sanitizer = sanitizer;
    }
    /**
     * \@internal
     * @param {?} renderComponentType
     * @return {?}
     */
    renderComponent(renderComponentType) {
        return this._renderer.renderComponent(renderComponentType);
    }
}
ViewUtils.decorators = [
    { type: Injectable },
];
/** @nocollapse */
ViewUtils.ctorParameters = () => [
    { type: RootRenderer, },
    { type: Sanitizer, },
    { type: AnimationQueue, },
];
function ViewUtils_tsickle_Closure_declarations() {
    /** @type {?} */
    ViewUtils.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    ViewUtils.ctorParameters;
    /** @type {?} */
    ViewUtils.prototype.sanitizer;
    /** @type {?} */
    ViewUtils.prototype._renderer;
    /** @type {?} */
    ViewUtils.prototype.animationQueue;
}
let /** @type {?} */ nextRenderComponentTypeId = 0;
/**
 * @param {?} templateUrl
 * @param {?} slotCount
 * @param {?} encapsulation
 * @param {?} styles
 * @param {?} animations
 * @return {?}
 */
export function createRenderComponentType(templateUrl, slotCount, encapsulation, styles, animations) {
    return new RenderComponentType(`${nextRenderComponentTypeId++}`, templateUrl, slotCount, encapsulation, styles, animations);
}
/**
 * @param {?} e
 * @param {?} array
 * @return {?}
 */
export function addToArray(e, array) {
    array.push(e);
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
/**
 * @param {?} view
 * @param {?} oldValue
 * @param {?} newValue
 * @param {?} forceUpdate
 * @return {?}
 */
export function checkBinding(view, oldValue, newValue, forceUpdate) {
    const /** @type {?} */ isFirstCheck = view.numberOfChecks === 0;
    if (view.throwOnChange) {
        if (isFirstCheck || !devModeEqual(oldValue, newValue)) {
            throw new ExpressionChangedAfterItHasBeenCheckedError(oldValue, newValue, isFirstCheck);
        }
        return false;
    }
    else {
        return isFirstCheck || forceUpdate || !looseIdentical(oldValue, newValue);
    }
}
/**
 * @param {?} view
 * @param {?} oldValue
 * @param {?} newValue
 * @param {?} forceUpdate
 * @return {?}
 */
export function checkBindingChange(view, oldValue, newValue, forceUpdate) {
    if (checkBinding(view, oldValue, newValue, forceUpdate)) {
        return new SimpleChange(oldValue, newValue, view.numberOfChecks === 0);
    }
}
/**
 * @param {?} view
 * @param {?} renderElement
 * @param {?} oldValue
 * @param {?} newValue
 * @param {?} forceUpdate
 * @return {?}
 */
export function checkRenderText(view, renderElement, oldValue, newValue, forceUpdate) {
    if (checkBinding(view, oldValue, newValue, forceUpdate)) {
        view.renderer.setText(renderElement, newValue);
    }
}
/**
 * @param {?} view
 * @param {?} renderElement
 * @param {?} propName
 * @param {?} oldValue
 * @param {?} newValue
 * @param {?} forceUpdate
 * @param {?} securityContext
 * @return {?}
 */
export function checkRenderProperty(view, renderElement, propName, oldValue, newValue, forceUpdate, securityContext) {
    if (checkBinding(view, oldValue, newValue, forceUpdate)) {
        let /** @type {?} */ renderValue = securityContext ? view.viewUtils.sanitizer.sanitize(securityContext, newValue) : newValue;
        view.renderer.setElementProperty(renderElement, propName, renderValue);
    }
}
/**
 * @param {?} view
 * @param {?} renderElement
 * @param {?} attrName
 * @param {?} oldValue
 * @param {?} newValue
 * @param {?} forceUpdate
 * @param {?} securityContext
 * @return {?}
 */
export function checkRenderAttribute(view, renderElement, attrName, oldValue, newValue, forceUpdate, securityContext) {
    if (checkBinding(view, oldValue, newValue, forceUpdate)) {
        let /** @type {?} */ renderValue = securityContext ? view.viewUtils.sanitizer.sanitize(securityContext, newValue) : newValue;
        renderValue = renderValue != null ? renderValue.toString() : null;
        view.renderer.setElementAttribute(renderElement, attrName, renderValue);
    }
}
/**
 * @param {?} view
 * @param {?} renderElement
 * @param {?} className
 * @param {?} oldValue
 * @param {?} newValue
 * @param {?} forceUpdate
 * @return {?}
 */
export function checkRenderClass(view, renderElement, className, oldValue, newValue, forceUpdate) {
    if (checkBinding(view, oldValue, newValue, forceUpdate)) {
        view.renderer.setElementClass(renderElement, className, newValue);
    }
}
/**
 * @param {?} view
 * @param {?} renderElement
 * @param {?} styleName
 * @param {?} unit
 * @param {?} oldValue
 * @param {?} newValue
 * @param {?} forceUpdate
 * @param {?} securityContext
 * @return {?}
 */
export function checkRenderStyle(view, renderElement, styleName, unit, oldValue, newValue, forceUpdate, securityContext) {
    if (checkBinding(view, oldValue, newValue, forceUpdate)) {
        let /** @type {?} */ renderValue = securityContext ? view.viewUtils.sanitizer.sanitize(securityContext, newValue) : newValue;
        if (renderValue != null) {
            renderValue = renderValue.toString();
            if (unit != null) {
                renderValue = renderValue + unit;
            }
        }
        else {
            renderValue = null;
        }
        view.renderer.setElementStyle(renderElement, styleName, renderValue);
    }
}
/**
 * @param {?} input
 * @param {?} value
 * @return {?}
 */
export function castByValue(input, value) {
    return (input);
}
export const /** @type {?} */ EMPTY_ARRAY = [];
export const /** @type {?} */ EMPTY_MAP = {};
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy1(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0;
    return (p0) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0)) {
            v0 = p0;
            result = fn(p0);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy2(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0;
    let /** @type {?} */ v1;
    return (p0, p1) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1)) {
            v0 = p0;
            v1 = p1;
            result = fn(p0, p1);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy3(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0;
    let /** @type {?} */ v1;
    let /** @type {?} */ v2;
    return (p0, p1, p2) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1) ||
            !looseIdentical(v2, p2)) {
            v0 = p0;
            v1 = p1;
            v2 = p2;
            result = fn(p0, p1, p2);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy4(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0, /** @type {?} */ v1, /** @type {?} */ v2, /** @type {?} */ v3;
    v0 = v1 = v2 = v3;
    return (p0, p1, p2, p3) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1) ||
            !looseIdentical(v2, p2) || !looseIdentical(v3, p3)) {
            v0 = p0;
            v1 = p1;
            v2 = p2;
            v3 = p3;
            result = fn(p0, p1, p2, p3);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy5(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0, /** @type {?} */ v1, /** @type {?} */ v2, /** @type {?} */ v3, /** @type {?} */ v4;
    v0 = v1 = v2 = v3 = v4;
    return (p0, p1, p2, p3, p4) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1) ||
            !looseIdentical(v2, p2) || !looseIdentical(v3, p3) || !looseIdentical(v4, p4)) {
            v0 = p0;
            v1 = p1;
            v2 = p2;
            v3 = p3;
            v4 = p4;
            result = fn(p0, p1, p2, p3, p4);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy6(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0, /** @type {?} */ v1, /** @type {?} */ v2, /** @type {?} */ v3, /** @type {?} */ v4, /** @type {?} */ v5;
    v0 = v1 = v2 = v3 = v4 = v5;
    return (p0, p1, p2, p3, p4, p5) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1) ||
            !looseIdentical(v2, p2) || !looseIdentical(v3, p3) || !looseIdentical(v4, p4) ||
            !looseIdentical(v5, p5)) {
            v0 = p0;
            v1 = p1;
            v2 = p2;
            v3 = p3;
            v4 = p4;
            v5 = p5;
            result = fn(p0, p1, p2, p3, p4, p5);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy7(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0, /** @type {?} */ v1, /** @type {?} */ v2, /** @type {?} */ v3, /** @type {?} */ v4, /** @type {?} */ v5, /** @type {?} */ v6;
    v0 = v1 = v2 = v3 = v4 = v5 = v6;
    return (p0, p1, p2, p3, p4, p5, p6) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1) ||
            !looseIdentical(v2, p2) || !looseIdentical(v3, p3) || !looseIdentical(v4, p4) ||
            !looseIdentical(v5, p5) || !looseIdentical(v6, p6)) {
            v0 = p0;
            v1 = p1;
            v2 = p2;
            v3 = p3;
            v4 = p4;
            v5 = p5;
            v6 = p6;
            result = fn(p0, p1, p2, p3, p4, p5, p6);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy8(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0, /** @type {?} */ v1, /** @type {?} */ v2, /** @type {?} */ v3, /** @type {?} */ v4, /** @type {?} */ v5, /** @type {?} */ v6, /** @type {?} */ v7;
    v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7;
    return (p0, p1, p2, p3, p4, p5, p6, p7) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1) ||
            !looseIdentical(v2, p2) || !looseIdentical(v3, p3) || !looseIdentical(v4, p4) ||
            !looseIdentical(v5, p5) || !looseIdentical(v6, p6) || !looseIdentical(v7, p7)) {
            v0 = p0;
            v1 = p1;
            v2 = p2;
            v3 = p3;
            v4 = p4;
            v5 = p5;
            v6 = p6;
            v7 = p7;
            result = fn(p0, p1, p2, p3, p4, p5, p6, p7);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy9(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0, /** @type {?} */ v1, /** @type {?} */ v2, /** @type {?} */ v3, /** @type {?} */ v4, /** @type {?} */ v5, /** @type {?} */ v6, /** @type {?} */ v7, /** @type {?} */ v8;
    v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8;
    return (p0, p1, p2, p3, p4, p5, p6, p7, p8) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1) ||
            !looseIdentical(v2, p2) || !looseIdentical(v3, p3) || !looseIdentical(v4, p4) ||
            !looseIdentical(v5, p5) || !looseIdentical(v6, p6) || !looseIdentical(v7, p7) ||
            !looseIdentical(v8, p8)) {
            v0 = p0;
            v1 = p1;
            v2 = p2;
            v3 = p3;
            v4 = p4;
            v5 = p5;
            v6 = p6;
            v7 = p7;
            v8 = p8;
            result = fn(p0, p1, p2, p3, p4, p5, p6, p7, p8);
        }
        return result;
    };
}
/**
 * @param {?} fn
 * @return {?}
 */
export function pureProxy10(fn) {
    let /** @type {?} */ numberOfChecks = 0;
    let /** @type {?} */ result;
    let /** @type {?} */ v0, /** @type {?} */ v1, /** @type {?} */ v2, /** @type {?} */ v3, /** @type {?} */ v4, /** @type {?} */ v5, /** @type {?} */ v6, /** @type {?} */ v7, /** @type {?} */ v8, /** @type {?} */ v9;
    v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8 = v9;
    return (p0, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
        if (!numberOfChecks++ || !looseIdentical(v0, p0) || !looseIdentical(v1, p1) ||
            !looseIdentical(v2, p2) || !looseIdentical(v3, p3) || !looseIdentical(v4, p4) ||
            !looseIdentical(v5, p5) || !looseIdentical(v6, p6) || !looseIdentical(v7, p7) ||
            !looseIdentical(v8, p8) || !looseIdentical(v9, p9)) {
            v0 = p0;
            v1 = p1;
            v2 = p2;
            v3 = p3;
            v4 = p4;
            v5 = p5;
            v6 = p6;
            v7 = p7;
            v8 = p8;
            v9 = p9;
            result = fn(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9);
        }
        return result;
    };
}
/**
 * @param {?} renderer
 * @param {?} el
 * @param {?} changes
 * @return {?}
 */
export function setBindingDebugInfoForChanges(renderer, el, changes) {
    Object.keys(changes).forEach((propName) => {
        setBindingDebugInfo(renderer, el, propName, changes[propName].currentValue);
    });
}
/**
 * @param {?} renderer
 * @param {?} el
 * @param {?} propName
 * @param {?} value
 * @return {?}
 */
export function setBindingDebugInfo(renderer, el, propName, value) {
    try {
        renderer.setBindingDebugInfo(el, `ng-reflect-${camelCaseToDashCase(propName)}`, value ? value.toString() : null);
    }
    catch (e) {
        renderer.setBindingDebugInfo(el, `ng-reflect-${camelCaseToDashCase(propName)}`, '[ERROR] Exception while trying to serialize the value');
    }
}
const /** @type {?} */ CAMEL_CASE_REGEXP = /([A-Z])/g;
/**
 * @param {?} input
 * @return {?}
 */
function camelCaseToDashCase(input) {
    return input.replace(CAMEL_CASE_REGEXP, (...m) => '-' + m[1].toLowerCase());
}
/**
 * @param {?} renderer
 * @param {?} parentElement
 * @param {?} name
 * @param {?} attrs
 * @param {?=} debugInfo
 * @return {?}
 */
export function createRenderElement(renderer, parentElement, name, attrs, debugInfo) {
    const /** @type {?} */ el = renderer.createElement(parentElement, name, debugInfo);
    for (let /** @type {?} */ i = 0; i < attrs.length; i += 2) {
        renderer.setElementAttribute(el, attrs.get(i), attrs.get(i + 1));
    }
    return el;
}
/**
 * @param {?} renderer
 * @param {?} elementName
 * @param {?} attrs
 * @param {?} rootSelectorOrNode
 * @param {?=} debugInfo
 * @return {?}
 */
export function selectOrCreateRenderHostElement(renderer, elementName, attrs, rootSelectorOrNode, debugInfo) {
    let /** @type {?} */ hostElement;
    if (isPresent(rootSelectorOrNode)) {
        hostElement = renderer.selectRootElement(rootSelectorOrNode, debugInfo);
        for (let /** @type {?} */ i = 0; i < attrs.length; i += 2) {
            renderer.setElementAttribute(hostElement, attrs.get(i), attrs.get(i + 1));
        }
        renderer.setElementAttribute(hostElement, 'ng-version', VERSION.full);
    }
    else {
        hostElement = createRenderElement(renderer, null, elementName, attrs, debugInfo);
    }
    return hostElement;
}
/**
 * @param {?} view
 * @param {?} element
 * @param {?} eventNamesAndTargets
 * @param {?} listener
 * @return {?}
 */
export function subscribeToRenderElement(view, element, eventNamesAndTargets, listener) {
    const /** @type {?} */ disposables = createEmptyInlineArray(eventNamesAndTargets.length / 2);
    for (let /** @type {?} */ i = 0; i < eventNamesAndTargets.length; i += 2) {
        const /** @type {?} */ eventName = eventNamesAndTargets.get(i);
        const /** @type {?} */ eventTarget = eventNamesAndTargets.get(i + 1);
        let /** @type {?} */ disposable;
        if (eventTarget) {
            disposable = view.renderer.listenGlobal(eventTarget, eventName, listener.bind(view, `${eventTarget}:${eventName}`));
        }
        else {
            disposable = view.renderer.listen(element, eventName, listener.bind(view, eventName));
        }
        disposables.set(i / 2, disposable);
    }
    return disposeInlineArray.bind(null, disposables);
}
/**
 * @param {?} disposables
 * @return {?}
 */
function disposeInlineArray(disposables) {
    for (let /** @type {?} */ i = 0; i < disposables.length; i++) {
        disposables.get(i)();
    }
}
/**
 * @return {?}
 */
export function noop() { }
/**
 * @param {?} length
 * @return {?}
 */
function createEmptyInlineArray(length) {
    let /** @type {?} */ ctor;
    if (length <= 2) {
        ctor = InlineArray2;
    }
    else if (length <= 4) {
        ctor = InlineArray4;
    }
    else if (length <= 8) {
        ctor = InlineArray8;
    }
    else if (length <= 16) {
        ctor = InlineArray16;
    }
    else {
        ctor = InlineArrayDynamic;
    }
    return new ctor(length);
}
class InlineArray0 {
    constructor() {
        this.length = 0;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) { return undefined; }
    /**
     * @param {?} index
     * @param {?} value
     * @return {?}
     */
    set(index, value) { }
}
function InlineArray0_tsickle_Closure_declarations() {
    /** @type {?} */
    InlineArray0.prototype.length;
}
export class InlineArray2 {
    /**
     * @param {?} length
     * @param {?=} _v0
     * @param {?=} _v1
     */
    constructor(length, _v0, _v1) {
        this.length = length;
        this._v0 = _v0;
        this._v1 = _v1;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) {
        switch (index) {
            case 0:
                return this._v0;
            case 1:
                return this._v1;
            default:
                return undefined;
        }
    }
    /**
     * @param {?} index
     * @param {?} value
     * @return {?}
     */
    set(index, value) {
        switch (index) {
            case 0:
                this._v0 = value;
                break;
            case 1:
                this._v1 = value;
                break;
        }
    }
}
function InlineArray2_tsickle_Closure_declarations() {
    /** @type {?} */
    InlineArray2.prototype.length;
    /** @type {?} */
    InlineArray2.prototype._v0;
    /** @type {?} */
    InlineArray2.prototype._v1;
}
export class InlineArray4 {
    /**
     * @param {?} length
     * @param {?=} _v0
     * @param {?=} _v1
     * @param {?=} _v2
     * @param {?=} _v3
     */
    constructor(length, _v0, _v1, _v2, _v3) {
        this.length = length;
        this._v0 = _v0;
        this._v1 = _v1;
        this._v2 = _v2;
        this._v3 = _v3;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) {
        switch (index) {
            case 0:
                return this._v0;
            case 1:
                return this._v1;
            case 2:
                return this._v2;
            case 3:
                return this._v3;
            default:
                return undefined;
        }
    }
    /**
     * @param {?} index
     * @param {?} value
     * @return {?}
     */
    set(index, value) {
        switch (index) {
            case 0:
                this._v0 = value;
                break;
            case 1:
                this._v1 = value;
                break;
            case 2:
                this._v2 = value;
                break;
            case 3:
                this._v3 = value;
                break;
        }
    }
}
function InlineArray4_tsickle_Closure_declarations() {
    /** @type {?} */
    InlineArray4.prototype.length;
    /** @type {?} */
    InlineArray4.prototype._v0;
    /** @type {?} */
    InlineArray4.prototype._v1;
    /** @type {?} */
    InlineArray4.prototype._v2;
    /** @type {?} */
    InlineArray4.prototype._v3;
}
export class InlineArray8 {
    /**
     * @param {?} length
     * @param {?=} _v0
     * @param {?=} _v1
     * @param {?=} _v2
     * @param {?=} _v3
     * @param {?=} _v4
     * @param {?=} _v5
     * @param {?=} _v6
     * @param {?=} _v7
     */
    constructor(length, _v0, _v1, _v2, _v3, _v4, _v5, _v6, _v7) {
        this.length = length;
        this._v0 = _v0;
        this._v1 = _v1;
        this._v2 = _v2;
        this._v3 = _v3;
        this._v4 = _v4;
        this._v5 = _v5;
        this._v6 = _v6;
        this._v7 = _v7;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) {
        switch (index) {
            case 0:
                return this._v0;
            case 1:
                return this._v1;
            case 2:
                return this._v2;
            case 3:
                return this._v3;
            case 4:
                return this._v4;
            case 5:
                return this._v5;
            case 6:
                return this._v6;
            case 7:
                return this._v7;
            default:
                return undefined;
        }
    }
    /**
     * @param {?} index
     * @param {?} value
     * @return {?}
     */
    set(index, value) {
        switch (index) {
            case 0:
                this._v0 = value;
                break;
            case 1:
                this._v1 = value;
                break;
            case 2:
                this._v2 = value;
                break;
            case 3:
                this._v3 = value;
                break;
            case 4:
                this._v4 = value;
                break;
            case 5:
                this._v5 = value;
                break;
            case 6:
                this._v6 = value;
                break;
            case 7:
                this._v7 = value;
                break;
        }
    }
}
function InlineArray8_tsickle_Closure_declarations() {
    /** @type {?} */
    InlineArray8.prototype.length;
    /** @type {?} */
    InlineArray8.prototype._v0;
    /** @type {?} */
    InlineArray8.prototype._v1;
    /** @type {?} */
    InlineArray8.prototype._v2;
    /** @type {?} */
    InlineArray8.prototype._v3;
    /** @type {?} */
    InlineArray8.prototype._v4;
    /** @type {?} */
    InlineArray8.prototype._v5;
    /** @type {?} */
    InlineArray8.prototype._v6;
    /** @type {?} */
    InlineArray8.prototype._v7;
}
export class InlineArray16 {
    /**
     * @param {?} length
     * @param {?=} _v0
     * @param {?=} _v1
     * @param {?=} _v2
     * @param {?=} _v3
     * @param {?=} _v4
     * @param {?=} _v5
     * @param {?=} _v6
     * @param {?=} _v7
     * @param {?=} _v8
     * @param {?=} _v9
     * @param {?=} _v10
     * @param {?=} _v11
     * @param {?=} _v12
     * @param {?=} _v13
     * @param {?=} _v14
     * @param {?=} _v15
     */
    constructor(length, _v0, _v1, _v2, _v3, _v4, _v5, _v6, _v7, _v8, _v9, _v10, _v11, _v12, _v13, _v14, _v15) {
        this.length = length;
        this._v0 = _v0;
        this._v1 = _v1;
        this._v2 = _v2;
        this._v3 = _v3;
        this._v4 = _v4;
        this._v5 = _v5;
        this._v6 = _v6;
        this._v7 = _v7;
        this._v8 = _v8;
        this._v9 = _v9;
        this._v10 = _v10;
        this._v11 = _v11;
        this._v12 = _v12;
        this._v13 = _v13;
        this._v14 = _v14;
        this._v15 = _v15;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) {
        switch (index) {
            case 0:
                return this._v0;
            case 1:
                return this._v1;
            case 2:
                return this._v2;
            case 3:
                return this._v3;
            case 4:
                return this._v4;
            case 5:
                return this._v5;
            case 6:
                return this._v6;
            case 7:
                return this._v7;
            case 8:
                return this._v8;
            case 9:
                return this._v9;
            case 10:
                return this._v10;
            case 11:
                return this._v11;
            case 12:
                return this._v12;
            case 13:
                return this._v13;
            case 14:
                return this._v14;
            case 15:
                return this._v15;
            default:
                return undefined;
        }
    }
    /**
     * @param {?} index
     * @param {?} value
     * @return {?}
     */
    set(index, value) {
        switch (index) {
            case 0:
                this._v0 = value;
                break;
            case 1:
                this._v1 = value;
                break;
            case 2:
                this._v2 = value;
                break;
            case 3:
                this._v3 = value;
                break;
            case 4:
                this._v4 = value;
                break;
            case 5:
                this._v5 = value;
                break;
            case 6:
                this._v6 = value;
                break;
            case 7:
                this._v7 = value;
                break;
            case 8:
                this._v8 = value;
                break;
            case 9:
                this._v9 = value;
                break;
            case 10:
                this._v10 = value;
                break;
            case 11:
                this._v11 = value;
                break;
            case 12:
                this._v12 = value;
                break;
            case 13:
                this._v13 = value;
                break;
            case 14:
                this._v14 = value;
                break;
            case 15:
                this._v15 = value;
                break;
        }
    }
}
function InlineArray16_tsickle_Closure_declarations() {
    /** @type {?} */
    InlineArray16.prototype.length;
    /** @type {?} */
    InlineArray16.prototype._v0;
    /** @type {?} */
    InlineArray16.prototype._v1;
    /** @type {?} */
    InlineArray16.prototype._v2;
    /** @type {?} */
    InlineArray16.prototype._v3;
    /** @type {?} */
    InlineArray16.prototype._v4;
    /** @type {?} */
    InlineArray16.prototype._v5;
    /** @type {?} */
    InlineArray16.prototype._v6;
    /** @type {?} */
    InlineArray16.prototype._v7;
    /** @type {?} */
    InlineArray16.prototype._v8;
    /** @type {?} */
    InlineArray16.prototype._v9;
    /** @type {?} */
    InlineArray16.prototype._v10;
    /** @type {?} */
    InlineArray16.prototype._v11;
    /** @type {?} */
    InlineArray16.prototype._v12;
    /** @type {?} */
    InlineArray16.prototype._v13;
    /** @type {?} */
    InlineArray16.prototype._v14;
    /** @type {?} */
    InlineArray16.prototype._v15;
}
export class InlineArrayDynamic {
    /**
     * @param {?} length
     * @param {...?} values
     */
    constructor(length, ...values) {
        this.length = length;
        this._values = values;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) { return this._values[index]; }
    /**
     * @param {?} index
     * @param {?} value
     * @return {?}
     */
    set(index, value) { this._values[index] = value; }
}
function InlineArrayDynamic_tsickle_Closure_declarations() {
    /** @type {?} */
    InlineArrayDynamic.prototype._values;
    /** @type {?} */
    InlineArrayDynamic.prototype.length;
}
export const /** @type {?} */ EMPTY_INLINE_ARRAY = new InlineArray0();
/**
 * This is a private API only used by the compiler to read the view class.
 * @param {?} componentFactory
 * @return {?}
 */
export function getComponentFactoryViewClass(componentFactory) {
    return componentFactory._viewClass;
}
//# sourceMappingURL=view_utils.js.map