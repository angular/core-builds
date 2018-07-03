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
import { InjectionToken } from '../di';
/**
 * @deprecated Use `RendererType2` (and `Renderer2`) instead.
 */
export class RenderComponentType {
    /**
     * @param {?} id
     * @param {?} templateUrl
     * @param {?} slotCount
     * @param {?} encapsulation
     * @param {?} styles
     * @param {?} animations
     */
    constructor(id, templateUrl, slotCount, encapsulation, styles, animations) {
        this.id = id;
        this.templateUrl = templateUrl;
        this.slotCount = slotCount;
        this.encapsulation = encapsulation;
        this.styles = styles;
        this.animations = animations;
    }
}
if (false) {
    /** @type {?} */
    RenderComponentType.prototype.id;
    /** @type {?} */
    RenderComponentType.prototype.templateUrl;
    /** @type {?} */
    RenderComponentType.prototype.slotCount;
    /** @type {?} */
    RenderComponentType.prototype.encapsulation;
    /** @type {?} */
    RenderComponentType.prototype.styles;
    /** @type {?} */
    RenderComponentType.prototype.animations;
}
/**
 * @deprecated Debug info is handeled internally in the view engine now.
 * @abstract
 */
export class RenderDebugInfo {
}
if (false) {
    /**
     * @abstract
     * @return {?}
     */
    RenderDebugInfo.prototype.injector = function () { };
    /**
     * @abstract
     * @return {?}
     */
    RenderDebugInfo.prototype.component = function () { };
    /**
     * @abstract
     * @return {?}
     */
    RenderDebugInfo.prototype.providerTokens = function () { };
    /**
     * @abstract
     * @return {?}
     */
    RenderDebugInfo.prototype.references = function () { };
    /**
     * @abstract
     * @return {?}
     */
    RenderDebugInfo.prototype.context = function () { };
    /**
     * @abstract
     * @return {?}
     */
    RenderDebugInfo.prototype.source = function () { };
}
/**
 * @deprecated Use the `Renderer2` instead.
 * @record
 */
export function DirectRenderer() { }
/** @type {?} */
DirectRenderer.prototype.remove;
/** @type {?} */
DirectRenderer.prototype.appendChild;
/** @type {?} */
DirectRenderer.prototype.insertBefore;
/** @type {?} */
DirectRenderer.prototype.nextSibling;
/** @type {?} */
DirectRenderer.prototype.parentElement;
/**
 * @deprecated Use the `Renderer2` instead.
 * @abstract
 */
export class Renderer {
}
if (false) {
    /**
     * @abstract
     * @param {?} selectorOrNode
     * @param {?=} debugInfo
     * @return {?}
     */
    Renderer.prototype.selectRootElement = function (selectorOrNode, debugInfo) { };
    /**
     * @abstract
     * @param {?} parentElement
     * @param {?} name
     * @param {?=} debugInfo
     * @return {?}
     */
    Renderer.prototype.createElement = function (parentElement, name, debugInfo) { };
    /**
     * @abstract
     * @param {?} hostElement
     * @return {?}
     */
    Renderer.prototype.createViewRoot = function (hostElement) { };
    /**
     * @abstract
     * @param {?} parentElement
     * @param {?=} debugInfo
     * @return {?}
     */
    Renderer.prototype.createTemplateAnchor = function (parentElement, debugInfo) { };
    /**
     * @abstract
     * @param {?} parentElement
     * @param {?} value
     * @param {?=} debugInfo
     * @return {?}
     */
    Renderer.prototype.createText = function (parentElement, value, debugInfo) { };
    /**
     * @abstract
     * @param {?} parentElement
     * @param {?} nodes
     * @return {?}
     */
    Renderer.prototype.projectNodes = function (parentElement, nodes) { };
    /**
     * @abstract
     * @param {?} node
     * @param {?} viewRootNodes
     * @return {?}
     */
    Renderer.prototype.attachViewAfter = function (node, viewRootNodes) { };
    /**
     * @abstract
     * @param {?} viewRootNodes
     * @return {?}
     */
    Renderer.prototype.detachView = function (viewRootNodes) { };
    /**
     * @abstract
     * @param {?} hostElement
     * @param {?} viewAllNodes
     * @return {?}
     */
    Renderer.prototype.destroyView = function (hostElement, viewAllNodes) { };
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} name
     * @param {?} callback
     * @return {?}
     */
    Renderer.prototype.listen = function (renderElement, name, callback) { };
    /**
     * @abstract
     * @param {?} target
     * @param {?} name
     * @param {?} callback
     * @return {?}
     */
    Renderer.prototype.listenGlobal = function (target, name, callback) { };
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    Renderer.prototype.setElementProperty = function (renderElement, propertyName, propertyValue) { };
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} attributeName
     * @param {?} attributeValue
     * @return {?}
     */
    Renderer.prototype.setElementAttribute = function (renderElement, attributeName, attributeValue) { };
    /**
     * Used only in debug mode to serialize property changes to dom nodes as attributes.
     * @abstract
     * @param {?} renderElement
     * @param {?} propertyName
     * @param {?} propertyValue
     * @return {?}
     */
    Renderer.prototype.setBindingDebugInfo = function (renderElement, propertyName, propertyValue) { };
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} className
     * @param {?} isAdd
     * @return {?}
     */
    Renderer.prototype.setElementClass = function (renderElement, className, isAdd) { };
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} styleName
     * @param {?} styleValue
     * @return {?}
     */
    Renderer.prototype.setElementStyle = function (renderElement, styleName, styleValue) { };
    /**
     * @abstract
     * @param {?} renderElement
     * @param {?} methodName
     * @param {?=} args
     * @return {?}
     */
    Renderer.prototype.invokeElementMethod = function (renderElement, methodName, args) { };
    /**
     * @abstract
     * @param {?} renderNode
     * @param {?} text
     * @return {?}
     */
    Renderer.prototype.setText = function (renderNode, text) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} startingStyles
     * @param {?} keyframes
     * @param {?} duration
     * @param {?} delay
     * @param {?} easing
     * @param {?=} previousPlayers
     * @return {?}
     */
    Renderer.prototype.animate = function (element, startingStyles, keyframes, duration, delay, easing, previousPlayers) { };
}
/** @type {?} */
export const Renderer2Interceptor = new InjectionToken('Renderer2Interceptor');
/**
 * Injectable service that provides a low-level interface for modifying the UI.
 *
 * Use this service to bypass Angular's templating and make custom UI changes that can't be
 * expressed declaratively. For example if you need to set a property or an attribute whose name is
 * not statically known, use {\@link Renderer#setElementProperty setElementProperty} or
 * {\@link Renderer#setElementAttribute setElementAttribute} respectively.
 *
 * If you are implementing a custom renderer, you must implement this interface.
 *
 * The default Renderer implementation is `DomRenderer`. Also available is `WebWorkerRenderer`.
 *
 * @deprecated Use `RendererFactory2` instead.
 * @abstract
 */
export class RootRenderer {
}
if (false) {
    /**
     * @abstract
     * @param {?} componentType
     * @return {?}
     */
    RootRenderer.prototype.renderComponent = function (componentType) { };
}
/**
 * \@experimental
 * @record
 */
export function RendererType2() { }
/** @type {?} */
RendererType2.prototype.id;
/** @type {?} */
RendererType2.prototype.encapsulation;
/** @type {?} */
RendererType2.prototype.styles;
/** @type {?} */
RendererType2.prototype.data;
/**
 * \@experimental
 * @abstract
 */
export class RendererFactory2 {
}
if (false) {
    /**
     * @abstract
     * @param {?} hostElement
     * @param {?} type
     * @return {?}
     */
    RendererFactory2.prototype.createRenderer = function (hostElement, type) { };
    /**
     * @abstract
     * @return {?}
     */
    RendererFactory2.prototype.begin = function () { };
    /**
     * @abstract
     * @return {?}
     */
    RendererFactory2.prototype.end = function () { };
    /**
     * @abstract
     * @return {?}
     */
    RendererFactory2.prototype.whenRenderingDone = function () { };
}
/** @enum {number} */
const RendererStyleFlags2 = {
    Important: 1,
    DashCase: 2,
};
export { RendererStyleFlags2 };
RendererStyleFlags2[RendererStyleFlags2.Important] = 'Important';
RendererStyleFlags2[RendererStyleFlags2.DashCase] = 'DashCase';
/**
 * \@experimental
 * @abstract
 */
export class Renderer2 {
}
if (false) {
    /**
     * This property is allowed to be null / undefined,
     * in which case the view engine won't call it.
     * This is used as a performance optimization for production mode.
     * @type {?}
     */
    Renderer2.prototype.destroyNode;
    /**
     * This field can be used to store arbitrary data on this renderer instance.
     * This is useful for renderers that delegate to other renderers.
     * @abstract
     * @return {?}
     */
    Renderer2.prototype.data = function () { };
    /**
     * @abstract
     * @return {?}
     */
    Renderer2.prototype.destroy = function () { };
    /**
     * @abstract
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    Renderer2.prototype.createElement = function (name, namespace) { };
    /**
     * @abstract
     * @param {?} value
     * @return {?}
     */
    Renderer2.prototype.createComment = function (value) { };
    /**
     * @abstract
     * @param {?} value
     * @return {?}
     */
    Renderer2.prototype.createText = function (value) { };
    /**
     * @abstract
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    Renderer2.prototype.appendChild = function (parent, newChild) { };
    /**
     * @abstract
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    Renderer2.prototype.insertBefore = function (parent, newChild, refChild) { };
    /**
     * @abstract
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    Renderer2.prototype.removeChild = function (parent, oldChild) { };
    /**
     * @abstract
     * @param {?} selectorOrNode
     * @return {?}
     */
    Renderer2.prototype.selectRootElement = function (selectorOrNode) { };
    /**
     * Attention: On WebWorkers, this will always return a value,
     * as we are asking for a result synchronously. I.e.
     * the caller can't rely on checking whether this is null or not.
     * @abstract
     * @param {?} node
     * @return {?}
     */
    Renderer2.prototype.parentNode = function (node) { };
    /**
     * Attention: On WebWorkers, this will always return a value,
     * as we are asking for a result synchronously. I.e.
     * the caller can't rely on checking whether this is null or not.
     * @abstract
     * @param {?} node
     * @return {?}
     */
    Renderer2.prototype.nextSibling = function (node) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @param {?=} namespace
     * @return {?}
     */
    Renderer2.prototype.setAttribute = function (el, name, value, namespace) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    Renderer2.prototype.removeAttribute = function (el, name, namespace) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    Renderer2.prototype.addClass = function (el, name) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    Renderer2.prototype.removeClass = function (el, name) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @param {?=} flags
     * @return {?}
     */
    Renderer2.prototype.setStyle = function (el, style, value, flags) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} style
     * @param {?=} flags
     * @return {?}
     */
    Renderer2.prototype.removeStyle = function (el, style, flags) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    Renderer2.prototype.setProperty = function (el, name, value) { };
    /**
     * @abstract
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    Renderer2.prototype.setValue = function (node, value) { };
    /**
     * @abstract
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    Renderer2.prototype.listen = function (target, eventName, callback) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQVcsTUFBTSxPQUFPLENBQUM7Ozs7QUFNL0MsTUFBTTs7Ozs7Ozs7O0lBQ0osWUFDVyxJQUFtQixXQUFtQixFQUFTLFNBQWlCLEVBQ2hFLGVBQXlDLE1BQTJCLEVBQ3BFO1FBRkEsT0FBRSxHQUFGLEVBQUU7UUFBaUIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7UUFBUyxjQUFTLEdBQVQsU0FBUyxDQUFRO1FBQ2hFLGtCQUFhLEdBQWIsYUFBYTtRQUE0QixXQUFNLEdBQU4sTUFBTSxDQUFxQjtRQUNwRSxlQUFVLEdBQVYsVUFBVTtLQUFTO0NBQy9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS0QsTUFBTTtDQU9MOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELE1BQU07Q0E2Q0w7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxhQUFhLG9CQUFvQixHQUFHLElBQUksY0FBYyxDQUFjLHNCQUFzQixDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQjVGLE1BQU07Q0FFTDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlRCxNQUFNO0NBS0w7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQU1DLFlBQWtCO0lBQ2xCLFdBQWlCOzs7d0NBRGpCLFNBQVM7d0NBQ1QsUUFBUTs7Ozs7QUFNVixNQUFNO0NBNkNMIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VuLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBSZW5kZXJlclR5cGUyYCAoYW5kIGBSZW5kZXJlcjJgKSBpbnN0ZWFkLlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyQ29tcG9uZW50VHlwZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGlkOiBzdHJpbmcsIHB1YmxpYyB0ZW1wbGF0ZVVybDogc3RyaW5nLCBwdWJsaWMgc2xvdENvdW50OiBudW1iZXIsXG4gICAgICBwdWJsaWMgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24sIHB1YmxpYyBzdHlsZXM6IEFycmF5PHN0cmluZ3xhbnlbXT4sXG4gICAgICBwdWJsaWMgYW5pbWF0aW9uczogYW55KSB7fVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIERlYnVnIGluZm8gaXMgaGFuZGVsZWQgaW50ZXJuYWxseSBpbiB0aGUgdmlldyBlbmdpbmUgbm93LlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVuZGVyRGVidWdJbmZvIHtcbiAgYWJzdHJhY3QgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yO1xuICBhYnN0cmFjdCBnZXQgY29tcG9uZW50KCk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdO1xuICBhYnN0cmFjdCBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgYWJzdHJhY3QgZ2V0IGNvbnRleHQoKTogYW55O1xuICBhYnN0cmFjdCBnZXQgc291cmNlKCk6IHN0cmluZztcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgdGhlIGBSZW5kZXJlcjJgIGluc3RlYWQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0UmVuZGVyZXIge1xuICByZW1vdmUobm9kZTogYW55KTogdm9pZDtcbiAgYXBwZW5kQ2hpbGQobm9kZTogYW55LCBwYXJlbnQ6IGFueSk6IHZvaWQ7XG4gIGluc2VydEJlZm9yZShub2RlOiBhbnksIHJlZk5vZGU6IGFueSk6IHZvaWQ7XG4gIG5leHRTaWJsaW5nKG5vZGU6IGFueSk6IGFueTtcbiAgcGFyZW50RWxlbWVudChub2RlOiBhbnkpOiBhbnk7XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIHRoZSBgUmVuZGVyZXIyYCBpbnN0ZWFkLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVuZGVyZXIge1xuICBhYnN0cmFjdCBzZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZTogc3RyaW5nfGFueSwgZGVidWdJbmZvPzogUmVuZGVyRGVidWdJbmZvKTogYW55O1xuXG4gIGFic3RyYWN0IGNyZWF0ZUVsZW1lbnQocGFyZW50RWxlbWVudDogYW55LCBuYW1lOiBzdHJpbmcsIGRlYnVnSW5mbz86IFJlbmRlckRlYnVnSW5mbyk6IGFueTtcblxuICBhYnN0cmFjdCBjcmVhdGVWaWV3Um9vdChob3N0RWxlbWVudDogYW55KTogYW55O1xuXG4gIGFic3RyYWN0IGNyZWF0ZVRlbXBsYXRlQW5jaG9yKHBhcmVudEVsZW1lbnQ6IGFueSwgZGVidWdJbmZvPzogUmVuZGVyRGVidWdJbmZvKTogYW55O1xuXG4gIGFic3RyYWN0IGNyZWF0ZVRleHQocGFyZW50RWxlbWVudDogYW55LCB2YWx1ZTogc3RyaW5nLCBkZWJ1Z0luZm8/OiBSZW5kZXJEZWJ1Z0luZm8pOiBhbnk7XG5cbiAgYWJzdHJhY3QgcHJvamVjdE5vZGVzKHBhcmVudEVsZW1lbnQ6IGFueSwgbm9kZXM6IGFueVtdKTogdm9pZDtcblxuICBhYnN0cmFjdCBhdHRhY2hWaWV3QWZ0ZXIobm9kZTogYW55LCB2aWV3Um9vdE5vZGVzOiBhbnlbXSk6IHZvaWQ7XG5cbiAgYWJzdHJhY3QgZGV0YWNoVmlldyh2aWV3Um9vdE5vZGVzOiBhbnlbXSk6IHZvaWQ7XG5cbiAgYWJzdHJhY3QgZGVzdHJveVZpZXcoaG9zdEVsZW1lbnQ6IGFueSwgdmlld0FsbE5vZGVzOiBhbnlbXSk6IHZvaWQ7XG5cbiAgYWJzdHJhY3QgbGlzdGVuKHJlbmRlckVsZW1lbnQ6IGFueSwgbmFtZTogc3RyaW5nLCBjYWxsYmFjazogRnVuY3Rpb24pOiBGdW5jdGlvbjtcblxuICBhYnN0cmFjdCBsaXN0ZW5HbG9iYWwodGFyZ2V0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKTogRnVuY3Rpb247XG5cbiAgYWJzdHJhY3Qgc2V0RWxlbWVudFByb3BlcnR5KHJlbmRlckVsZW1lbnQ6IGFueSwgcHJvcGVydHlOYW1lOiBzdHJpbmcsIHByb3BlcnR5VmFsdWU6IGFueSk6IHZvaWQ7XG5cbiAgYWJzdHJhY3Qgc2V0RWxlbWVudEF0dHJpYnV0ZShyZW5kZXJFbGVtZW50OiBhbnksIGF0dHJpYnV0ZU5hbWU6IHN0cmluZywgYXR0cmlidXRlVmFsdWU6IHN0cmluZyk6XG4gICAgICB2b2lkO1xuXG4gIC8qKlxuICAgKiBVc2VkIG9ubHkgaW4gZGVidWcgbW9kZSB0byBzZXJpYWxpemUgcHJvcGVydHkgY2hhbmdlcyB0byBkb20gbm9kZXMgYXMgYXR0cmlidXRlcy5cbiAgICovXG4gIGFic3RyYWN0IHNldEJpbmRpbmdEZWJ1Z0luZm8ocmVuZGVyRWxlbWVudDogYW55LCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgcHJvcGVydHlWYWx1ZTogc3RyaW5nKTpcbiAgICAgIHZvaWQ7XG5cbiAgYWJzdHJhY3Qgc2V0RWxlbWVudENsYXNzKHJlbmRlckVsZW1lbnQ6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcsIGlzQWRkOiBib29sZWFuKTogdm9pZDtcblxuICBhYnN0cmFjdCBzZXRFbGVtZW50U3R5bGUocmVuZGVyRWxlbWVudDogYW55LCBzdHlsZU5hbWU6IHN0cmluZywgc3R5bGVWYWx1ZTogc3RyaW5nKTogdm9pZDtcblxuICBhYnN0cmFjdCBpbnZva2VFbGVtZW50TWV0aG9kKHJlbmRlckVsZW1lbnQ6IGFueSwgbWV0aG9kTmFtZTogc3RyaW5nLCBhcmdzPzogYW55W10pOiB2b2lkO1xuXG4gIGFic3RyYWN0IHNldFRleHQocmVuZGVyTm9kZTogYW55LCB0ZXh0OiBzdHJpbmcpOiB2b2lkO1xuXG4gIGFic3RyYWN0IGFuaW1hdGUoXG4gICAgICBlbGVtZW50OiBhbnksIHN0YXJ0aW5nU3R5bGVzOiBhbnksIGtleWZyYW1lczogYW55W10sIGR1cmF0aW9uOiBudW1iZXIsIGRlbGF5OiBudW1iZXIsXG4gICAgICBlYXNpbmc6IHN0cmluZywgcHJldmlvdXNQbGF5ZXJzPzogYW55W10pOiBhbnk7XG59XG5cbmV4cG9ydCBjb25zdCBSZW5kZXJlcjJJbnRlcmNlcHRvciA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSZW5kZXJlcjJbXT4oJ1JlbmRlcmVyMkludGVyY2VwdG9yJyk7XG5cbi8qKlxuICogSW5qZWN0YWJsZSBzZXJ2aWNlIHRoYXQgcHJvdmlkZXMgYSBsb3ctbGV2ZWwgaW50ZXJmYWNlIGZvciBtb2RpZnlpbmcgdGhlIFVJLlxuICpcbiAqIFVzZSB0aGlzIHNlcnZpY2UgdG8gYnlwYXNzIEFuZ3VsYXIncyB0ZW1wbGF0aW5nIGFuZCBtYWtlIGN1c3RvbSBVSSBjaGFuZ2VzIHRoYXQgY2FuJ3QgYmVcbiAqIGV4cHJlc3NlZCBkZWNsYXJhdGl2ZWx5LiBGb3IgZXhhbXBsZSBpZiB5b3UgbmVlZCB0byBzZXQgYSBwcm9wZXJ0eSBvciBhbiBhdHRyaWJ1dGUgd2hvc2UgbmFtZSBpc1xuICogbm90IHN0YXRpY2FsbHkga25vd24sIHVzZSB7QGxpbmsgUmVuZGVyZXIjc2V0RWxlbWVudFByb3BlcnR5IHNldEVsZW1lbnRQcm9wZXJ0eX0gb3JcbiAqIHtAbGluayBSZW5kZXJlciNzZXRFbGVtZW50QXR0cmlidXRlIHNldEVsZW1lbnRBdHRyaWJ1dGV9IHJlc3BlY3RpdmVseS5cbiAqXG4gKiBJZiB5b3UgYXJlIGltcGxlbWVudGluZyBhIGN1c3RvbSByZW5kZXJlciwgeW91IG11c3QgaW1wbGVtZW50IHRoaXMgaW50ZXJmYWNlLlxuICpcbiAqIFRoZSBkZWZhdWx0IFJlbmRlcmVyIGltcGxlbWVudGF0aW9uIGlzIGBEb21SZW5kZXJlcmAuIEFsc28gYXZhaWxhYmxlIGlzIGBXZWJXb3JrZXJSZW5kZXJlcmAuXG4gKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBSZW5kZXJlckZhY3RvcnkyYCBpbnN0ZWFkLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUm9vdFJlbmRlcmVyIHtcbiAgYWJzdHJhY3QgcmVuZGVyQ29tcG9uZW50KGNvbXBvbmVudFR5cGU6IFJlbmRlckNvbXBvbmVudFR5cGUpOiBSZW5kZXJlcjtcbn1cblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyZXJUeXBlMiB7XG4gIGlkOiBzdHJpbmc7XG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uO1xuICBzdHlsZXM6IChzdHJpbmd8YW55W10pW107XG4gIGRhdGE6IHtba2luZDogc3RyaW5nXTogYW55fTtcbn1cblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZW5kZXJlckZhY3RvcnkyIHtcbiAgYWJzdHJhY3QgY3JlYXRlUmVuZGVyZXIoaG9zdEVsZW1lbnQ6IGFueSwgdHlwZTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyO1xuICBhYnN0cmFjdCBiZWdpbj8oKTogdm9pZDtcbiAgYWJzdHJhY3QgZW5kPygpOiB2b2lkO1xuICBhYnN0cmFjdCB3aGVuUmVuZGVyaW5nRG9uZT8oKTogUHJvbWlzZTxhbnk+O1xufVxuXG4vKipcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGVudW0gUmVuZGVyZXJTdHlsZUZsYWdzMiB7XG4gIEltcG9ydGFudCA9IDEgPDwgMCxcbiAgRGFzaENhc2UgPSAxIDw8IDFcbn1cblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZW5kZXJlcjIge1xuICAvKipcbiAgICogVGhpcyBmaWVsZCBjYW4gYmUgdXNlZCB0byBzdG9yZSBhcmJpdHJhcnkgZGF0YSBvbiB0aGlzIHJlbmRlcmVyIGluc3RhbmNlLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgcmVuZGVyZXJzIHRoYXQgZGVsZWdhdGUgdG8gb3RoZXIgcmVuZGVyZXJzLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGRhdGEoKToge1trZXk6IHN0cmluZ106IGFueX07XG5cbiAgYWJzdHJhY3QgZGVzdHJveSgpOiB2b2lkO1xuICBhYnN0cmFjdCBjcmVhdGVFbGVtZW50KG5hbWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nfG51bGwpOiBhbnk7XG4gIGFic3RyYWN0IGNyZWF0ZUNvbW1lbnQodmFsdWU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgY3JlYXRlVGV4dCh2YWx1ZTogc3RyaW5nKTogYW55O1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBhbGxvd2VkIHRvIGJlIG51bGwgLyB1bmRlZmluZWQsXG4gICAqIGluIHdoaWNoIGNhc2UgdGhlIHZpZXcgZW5naW5lIHdvbid0IGNhbGwgaXQuXG4gICAqIFRoaXMgaXMgdXNlZCBhcyBhIHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbiBmb3IgcHJvZHVjdGlvbiBtb2RlLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGRlc3Ryb3lOb2RlICE6ICgobm9kZTogYW55KSA9PiB2b2lkKSB8IG51bGw7XG4gIGFic3RyYWN0IGFwcGVuZENoaWxkKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55KTogdm9pZDtcbiAgYWJzdHJhY3QgaW5zZXJ0QmVmb3JlKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55LCByZWZDaGlsZDogYW55KTogdm9pZDtcbiAgYWJzdHJhY3QgcmVtb3ZlQ2hpbGQocGFyZW50OiBhbnksIG9sZENoaWxkOiBhbnkpOiB2b2lkO1xuICBhYnN0cmFjdCBzZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZTogc3RyaW5nfGFueSk6IGFueTtcbiAgLyoqXG4gICAqIEF0dGVudGlvbjogT24gV2ViV29ya2VycywgdGhpcyB3aWxsIGFsd2F5cyByZXR1cm4gYSB2YWx1ZSxcbiAgICogYXMgd2UgYXJlIGFza2luZyBmb3IgYSByZXN1bHQgc3luY2hyb25vdXNseS4gSS5lLlxuICAgKiB0aGUgY2FsbGVyIGNhbid0IHJlbHkgb24gY2hlY2tpbmcgd2hldGhlciB0aGlzIGlzIG51bGwgb3Igbm90LlxuICAgKi9cbiAgYWJzdHJhY3QgcGFyZW50Tm9kZShub2RlOiBhbnkpOiBhbnk7XG4gIC8qKlxuICAgKiBBdHRlbnRpb246IE9uIFdlYldvcmtlcnMsIHRoaXMgd2lsbCBhbHdheXMgcmV0dXJuIGEgdmFsdWUsXG4gICAqIGFzIHdlIGFyZSBhc2tpbmcgZm9yIGEgcmVzdWx0IHN5bmNocm9ub3VzbHkuIEkuZS5cbiAgICogdGhlIGNhbGxlciBjYW4ndCByZWx5IG9uIGNoZWNraW5nIHdoZXRoZXIgdGhpcyBpcyBudWxsIG9yIG5vdC5cbiAgICovXG4gIGFic3RyYWN0IG5leHRTaWJsaW5nKG5vZGU6IGFueSk6IGFueTtcbiAgYWJzdHJhY3Qgc2V0QXR0cmlidXRlKGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nfG51bGwpOiB2b2lkO1xuICBhYnN0cmFjdCByZW1vdmVBdHRyaWJ1dGUoZWw6IGFueSwgbmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmd8bnVsbCk6IHZvaWQ7XG4gIGFic3RyYWN0IGFkZENsYXNzKGVsOiBhbnksIG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIGFic3RyYWN0IHJlbW92ZUNsYXNzKGVsOiBhbnksIG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIGFic3RyYWN0IHNldFN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIHZhbHVlOiBhbnksIGZsYWdzPzogUmVuZGVyZXJTdHlsZUZsYWdzMik6IHZvaWQ7XG4gIGFic3RyYWN0IHJlbW92ZVN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIGZsYWdzPzogUmVuZGVyZXJTdHlsZUZsYWdzMik6IHZvaWQ7XG4gIGFic3RyYWN0IHNldFByb3BlcnR5KGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQ7XG4gIGFic3RyYWN0IHNldFZhbHVlKG5vZGU6IGFueSwgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIGFic3RyYWN0IGxpc3RlbihcbiAgICAgIHRhcmdldDogJ3dpbmRvdyd8J2RvY3VtZW50J3wnYm9keSd8YW55LCBldmVudE5hbWU6IHN0cmluZyxcbiAgICAgIGNhbGxiYWNrOiAoZXZlbnQ6IGFueSkgPT4gYm9vbGVhbiB8IHZvaWQpOiAoKSA9PiB2b2lkO1xufVxuIl19