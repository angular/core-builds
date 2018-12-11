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
import { InjectionToken } from '../di/injection_token';
import { injectRenderer2 as render3InjectRenderer2 } from '../render3/view_engine_compatibility';
import { noop } from '../util/noop';
/**
 * @deprecated Use `RendererType2` (and `Renderer2`) instead.
 * \@publicApi
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
 * @deprecated Debug info is handled internally in the view engine now.
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
 * \@publicApi
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
     * @param {?=} attributeValue
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
     * @param {?=} styleValue
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
 * \@publicApi
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
 * Used by `RendererFactory2` to associate custom rendering data and styles
 * with a rendering implementation.
 * \@publicApi
 * @record
 */
export function RendererType2() { }
/**
 * A unique identifying string for the new renderer, used when creating
 * unique styles for encapsulation.
 * @type {?}
 */
RendererType2.prototype.id;
/**
 * The view encapsulation type, which determines how styles are applied to
 * DOM elements. One of
 * - `Emulated` (default): Emulate native scoping of styles.
 * - `Native`: Use the native encapsulation mechanism of the renderer.
 * - `ShadowDom`: Use modern [Shadow
 * DOM](https://w3c.github.io/webcomponents/spec/shadow/) and
 * create a ShadowRoot for component's host element.
 * - `None`: Do not provide any template or style encapsulation.
 * @type {?}
 */
RendererType2.prototype.encapsulation;
/**
 * Defines CSS styles to be stored on a renderer instance.
 * @type {?}
 */
RendererType2.prototype.styles;
/**
 * Defines arbitrary developer-defined data to be stored on a renderer instance.
 * This is useful for renderers that delegate to other renderers.
 * @type {?}
 */
RendererType2.prototype.data;
/**
 * Creates and initializes a custom renderer that implements the `Renderer2` base class.
 *
 * \@publicApi
 * @abstract
 */
export class RendererFactory2 {
}
if (false) {
    /**
     * Creates and initializes a custom renderer for a host DOM element.
     * @abstract
     * @param {?} hostElement The element to render.
     * @param {?} type The base class to implement.
     * @return {?} The new custom renderer instance.
     */
    RendererFactory2.prototype.createRenderer = function (hostElement, type) { };
    /**
     * A callback invoked when rendering has begun.
     * @abstract
     * @return {?}
     */
    RendererFactory2.prototype.begin = function () { };
    /**
     * A callback invoked when rendering has completed.
     * @abstract
     * @return {?}
     */
    RendererFactory2.prototype.end = function () { };
    /**
     * Use with animations test-only mode. Notifies the test when rendering has completed.
     * @abstract
     * @return {?} The asynchronous result of the developer-defined function.
     */
    RendererFactory2.prototype.whenRenderingDone = function () { };
}
/** @enum {number} */
var RendererStyleFlags2 = {
    /**
       * Marks a style as important.
       */
    Important: 1,
    /**
       * Marks a style as using dash case naming (this-is-dash-case).
       */
    DashCase: 2,
};
export { RendererStyleFlags2 };
RendererStyleFlags2[RendererStyleFlags2.Important] = 'Important';
RendererStyleFlags2[RendererStyleFlags2.DashCase] = 'DashCase';
/**
 * Extend this base class to implement custom rendering. By default, Angular
 * renders a template into DOM. You can use custom rendering to intercept
 * rendering calls, or to render to something other than DOM.
 *
 * Create your custom renderer using `RendererFactory2`.
 *
 * Use a custom renderer to bypass Angular's templating and
 * make custom UI changes that can't be expressed declaratively.
 * For example if you need to set a property or an attribute whose name is
 * not statically known, use the `setProperty()` or
 * `setAttribute()` method.
 *
 * \@publicApi
 * @abstract
 */
export class Renderer2 {
}
/**
 * \@internal
 */
Renderer2.__NG_ELEMENT_ID__ = () => SWITCH_RENDERER2_FACTORY();
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    Renderer2.__NG_ELEMENT_ID__;
    /**
     * If null or undefined, the view engine won't call it.
     * This is used as a performance optimization for production mode.
     * @type {?}
     */
    Renderer2.prototype.destroyNode;
    /**
     * Use to store arbitrary developer-defined data on a renderer instance,
     * as an object containing key-value pairs.
     * This is useful for renderers that delegate to other renderers.
     * @abstract
     * @return {?}
     */
    Renderer2.prototype.data = function () { };
    /**
     * Implement this callback to destroy the renderer or the host element.
     * @abstract
     * @return {?}
     */
    Renderer2.prototype.destroy = function () { };
    /**
     * Implement this callback to create an instance of the host element.
     * @abstract
     * @param {?} name An identifying name for the new element, unique within the namespace.
     * @param {?=} namespace The namespace for the new element.
     * @return {?} The new element.
     */
    Renderer2.prototype.createElement = function (name, namespace) { };
    /**
     * Implement this callback to add a comment to the DOM of the host element.
     * @abstract
     * @param {?} value The comment text.
     * @return {?} The modified element.
     */
    Renderer2.prototype.createComment = function (value) { };
    /**
     * Implement this callback to add text to the DOM of the host element.
     * @abstract
     * @param {?} value The text string.
     * @return {?} The modified element.
     */
    Renderer2.prototype.createText = function (value) { };
    /**
     * Appends a child to a given parent node in the host element DOM.
     * @abstract
     * @param {?} parent The parent node.
     * @param {?} newChild The new child node.
     * @return {?}
     */
    Renderer2.prototype.appendChild = function (parent, newChild) { };
    /**
     * Implement this callback to insert a child node at a given position in a parent node
     * in the host element DOM.
     * @abstract
     * @param {?} parent The parent node.
     * @param {?} newChild The new child nodes.
     * @param {?} refChild The existing child node that should precede the new node.
     * @return {?}
     */
    Renderer2.prototype.insertBefore = function (parent, newChild, refChild) { };
    /**
     * Implement this callback to remove a child node from the host element's DOM.
     * @abstract
     * @param {?} parent The parent node.
     * @param {?} oldChild The child node to remove.
     * @return {?}
     */
    Renderer2.prototype.removeChild = function (parent, oldChild) { };
    /**
     * Implement this callback to prepare an element to be bootstrapped
     * as a root element, and return the element instance.
     * @abstract
     * @param {?} selectorOrNode The DOM element.
     * @param {?=} preserveContent Whether the contents of the root element
     * should be preserved, or cleared upon bootstrap (default behavior).
     * Use with `ViewEncapsulation.ShadowDom` to allow simple native
     * content projection via `<slot>` elements.
     * @return {?} The root element.
     */
    Renderer2.prototype.selectRootElement = function (selectorOrNode, preserveContent) { };
    /**
     * Implement this callback to get the parent of a given node
     * in the host element's DOM.
     * @abstract
     * @param {?} node The child node to query.
     * @return {?} The parent node, or null if there is no parent.
     * For WebWorkers, always returns true.
     * This is because the check is synchronous,
     * and the caller can't rely on checking for null.
     */
    Renderer2.prototype.parentNode = function (node) { };
    /**
     * Implement this callback to get the next sibling node of a given node
     * in the host element's DOM.
     * @abstract
     * @param {?} node
     * @return {?} The sibling node, or null if there is no sibling.
     * For WebWorkers, always returns a value.
     * This is because the check is synchronous,
     * and the caller can't rely on checking for null.
     */
    Renderer2.prototype.nextSibling = function (node) { };
    /**
     * Implement this callback to set an attribute value for an element in the DOM.
     * @abstract
     * @param {?} el The element.
     * @param {?} name The attribute name.
     * @param {?} value The new value.
     * @param {?=} namespace The namespace.
     * @return {?}
     */
    Renderer2.prototype.setAttribute = function (el, name, value, namespace) { };
    /**
     * Implement this callback to remove an attribute from an element in the DOM.
     * @abstract
     * @param {?} el The element.
     * @param {?} name The attribute name.
     * @param {?=} namespace The namespace.
     * @return {?}
     */
    Renderer2.prototype.removeAttribute = function (el, name, namespace) { };
    /**
     * Implement this callback to add a class to an element in the DOM.
     * @abstract
     * @param {?} el The element.
     * @param {?} name The class name.
     * @return {?}
     */
    Renderer2.prototype.addClass = function (el, name) { };
    /**
     * Implement this callback to remove a class from an element in the DOM.
     * @abstract
     * @param {?} el The element.
     * @param {?} name The class name.
     * @return {?}
     */
    Renderer2.prototype.removeClass = function (el, name) { };
    /**
     * Implement this callback to set a CSS style for an element in the DOM.
     * @abstract
     * @param {?} el The element.
     * @param {?} style The name of the style.
     * @param {?} value The new value.
     * @param {?=} flags Flags for style variations. No flags are set by default.
     * @return {?}
     */
    Renderer2.prototype.setStyle = function (el, style, value, flags) { };
    /**
     * Implement this callback to remove the value from a CSS style for an element in the DOM.
     * @abstract
     * @param {?} el The element.
     * @param {?} style The name of the style.
     * @param {?=} flags Flags for style variations to remove, if set. ???
     * @return {?}
     */
    Renderer2.prototype.removeStyle = function (el, style, flags) { };
    /**
     * Implement this callback to set the value of a property of an element in the DOM.
     * @abstract
     * @param {?} el The element.
     * @param {?} name The property name.
     * @param {?} value The new value.
     * @return {?}
     */
    Renderer2.prototype.setProperty = function (el, name, value) { };
    /**
     * Implement this callback to set the value of a node in the host element.
     * @abstract
     * @param {?} node The node.
     * @param {?} value The new value.
     * @return {?}
     */
    Renderer2.prototype.setValue = function (node, value) { };
    /**
     * Implement this callback to start an event listener.
     * @abstract
     * @param {?} target The context in which to listen for events. Can be
     * the entire window or document, the body of the document, or a specific
     * DOM element.
     * @param {?} eventName The event to listen for.
     * @param {?} callback A handler function to invoke when the event occurs.
     * @return {?} An "unlisten" function for disposing of this handler.
     */
    Renderer2.prototype.listen = function (target, eventName, callback) { };
}
/** @type {?} */
export const SWITCH_RENDERER2_FACTORY__POST_R3__ = render3InjectRenderer2;
/** @type {?} */
const SWITCH_RENDERER2_FACTORY__PRE_R3__ = noop;
/** @type {?} */
const SWITCH_RENDERER2_FACTORY = SWITCH_RENDERER2_FACTORY__PRE_R3__;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvcmVuZGVyL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUdyRCxPQUFPLEVBQUMsZUFBZSxJQUFJLHNCQUFzQixFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDL0YsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7QUFPbEMsTUFBTSxPQUFPLG1CQUFtQjs7Ozs7Ozs7O0lBQzlCLFlBQ1csSUFBbUIsV0FBbUIsRUFBUyxTQUFpQixFQUNoRSxlQUF5QyxNQUEyQixFQUNwRTtRQUZBLE9BQUUsR0FBRixFQUFFO1FBQWlCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1FBQVMsY0FBUyxHQUFULFNBQVMsQ0FBUTtRQUNoRSxrQkFBYSxHQUFiLGFBQWE7UUFBNEIsV0FBTSxHQUFOLE1BQU0sQ0FBcUI7UUFDcEUsZUFBVSxHQUFWLFVBQVU7S0FBUztDQUMvQjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUtELE1BQU0sT0FBZ0IsZUFBZTtDQU9wQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkQsTUFBTSxPQUFnQixRQUFRO0NBNkM3Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVELGFBQWEsb0JBQW9CLEdBQUcsSUFBSSxjQUFjLENBQWMsc0JBQXNCLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQjVGLE1BQU0sT0FBZ0IsWUFBWTtDQUVqQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0NELE1BQU0sT0FBZ0IsZ0JBQWdCO0NBcUJyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQVVDLFlBQWtCOzs7O0lBSWxCLFdBQWlCOzs7d0NBSmpCLFNBQVM7d0NBSVQsUUFBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQlYsTUFBTSxPQUFnQixTQUFTOzs7OztBQW9LN0IsOEJBQTRDLEdBQUcsRUFBRSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJL0UsYUFBYSxtQ0FBbUMsR0FBRyxzQkFBc0IsQ0FBQzs7QUFDMUUsTUFBTSxrQ0FBa0MsR0FBRyxJQUFJLENBQUM7O0FBQ2hELE1BQU0sd0JBQXdCLEdBQWtDLGtDQUFrQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge2luamVjdFJlbmRlcmVyMiBhcyByZW5kZXIzSW5qZWN0UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIzL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtub29wfSBmcm9tICcuLi91dGlsL25vb3AnO1xuXG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBSZW5kZXJlclR5cGUyYCAoYW5kIGBSZW5kZXJlcjJgKSBpbnN0ZWFkLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyQ29tcG9uZW50VHlwZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGlkOiBzdHJpbmcsIHB1YmxpYyB0ZW1wbGF0ZVVybDogc3RyaW5nLCBwdWJsaWMgc2xvdENvdW50OiBudW1iZXIsXG4gICAgICBwdWJsaWMgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24sIHB1YmxpYyBzdHlsZXM6IEFycmF5PHN0cmluZ3xhbnlbXT4sXG4gICAgICBwdWJsaWMgYW5pbWF0aW9uczogYW55KSB7fVxufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIERlYnVnIGluZm8gaXMgaGFuZGxlZCBpbnRlcm5hbGx5IGluIHRoZSB2aWV3IGVuZ2luZSBub3cuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZW5kZXJEZWJ1Z0luZm8ge1xuICBhYnN0cmFjdCBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3I7XG4gIGFic3RyYWN0IGdldCBjb21wb25lbnQoKTogYW55O1xuICBhYnN0cmFjdCBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W107XG4gIGFic3RyYWN0IGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICBhYnN0cmFjdCBnZXQgY29udGV4dCgpOiBhbnk7XG4gIGFic3RyYWN0IGdldCBzb3VyY2UoKTogc3RyaW5nO1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIFVzZSB0aGUgYFJlbmRlcmVyMmAgaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXJlY3RSZW5kZXJlciB7XG4gIHJlbW92ZShub2RlOiBhbnkpOiB2b2lkO1xuICBhcHBlbmRDaGlsZChub2RlOiBhbnksIHBhcmVudDogYW55KTogdm9pZDtcbiAgaW5zZXJ0QmVmb3JlKG5vZGU6IGFueSwgcmVmTm9kZTogYW55KTogdm9pZDtcbiAgbmV4dFNpYmxpbmcobm9kZTogYW55KTogYW55O1xuICBwYXJlbnRFbGVtZW50KG5vZGU6IGFueSk6IGFueTtcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgdGhlIGBSZW5kZXJlcjJgIGluc3RlYWQuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZW5kZXJlciB7XG4gIGFic3RyYWN0IHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55LCBkZWJ1Z0luZm8/OiBSZW5kZXJEZWJ1Z0luZm8pOiBhbnk7XG5cbiAgYWJzdHJhY3QgY3JlYXRlRWxlbWVudChwYXJlbnRFbGVtZW50OiBhbnksIG5hbWU6IHN0cmluZywgZGVidWdJbmZvPzogUmVuZGVyRGVidWdJbmZvKTogYW55O1xuXG4gIGFic3RyYWN0IGNyZWF0ZVZpZXdSb290KGhvc3RFbGVtZW50OiBhbnkpOiBhbnk7XG5cbiAgYWJzdHJhY3QgY3JlYXRlVGVtcGxhdGVBbmNob3IocGFyZW50RWxlbWVudDogYW55LCBkZWJ1Z0luZm8/OiBSZW5kZXJEZWJ1Z0luZm8pOiBhbnk7XG5cbiAgYWJzdHJhY3QgY3JlYXRlVGV4dChwYXJlbnRFbGVtZW50OiBhbnksIHZhbHVlOiBzdHJpbmcsIGRlYnVnSW5mbz86IFJlbmRlckRlYnVnSW5mbyk6IGFueTtcblxuICBhYnN0cmFjdCBwcm9qZWN0Tm9kZXMocGFyZW50RWxlbWVudDogYW55LCBub2RlczogYW55W10pOiB2b2lkO1xuXG4gIGFic3RyYWN0IGF0dGFjaFZpZXdBZnRlcihub2RlOiBhbnksIHZpZXdSb290Tm9kZXM6IGFueVtdKTogdm9pZDtcblxuICBhYnN0cmFjdCBkZXRhY2hWaWV3KHZpZXdSb290Tm9kZXM6IGFueVtdKTogdm9pZDtcblxuICBhYnN0cmFjdCBkZXN0cm95Vmlldyhob3N0RWxlbWVudDogYW55LCB2aWV3QWxsTm9kZXM6IGFueVtdKTogdm9pZDtcblxuICBhYnN0cmFjdCBsaXN0ZW4ocmVuZGVyRWxlbWVudDogYW55LCBuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IEZ1bmN0aW9uO1xuXG4gIGFic3RyYWN0IGxpc3Rlbkdsb2JhbCh0YXJnZXQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBjYWxsYmFjazogRnVuY3Rpb24pOiBGdW5jdGlvbjtcblxuICBhYnN0cmFjdCBzZXRFbGVtZW50UHJvcGVydHkocmVuZGVyRWxlbWVudDogYW55LCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgcHJvcGVydHlWYWx1ZTogYW55KTogdm9pZDtcblxuICBhYnN0cmFjdCBzZXRFbGVtZW50QXR0cmlidXRlKHJlbmRlckVsZW1lbnQ6IGFueSwgYXR0cmlidXRlTmFtZTogc3RyaW5nLCBhdHRyaWJ1dGVWYWx1ZT86IHN0cmluZyk6XG4gICAgICB2b2lkO1xuXG4gIC8qKlxuICAgKiBVc2VkIG9ubHkgaW4gZGVidWcgbW9kZSB0byBzZXJpYWxpemUgcHJvcGVydHkgY2hhbmdlcyB0byBkb20gbm9kZXMgYXMgYXR0cmlidXRlcy5cbiAgICovXG4gIGFic3RyYWN0IHNldEJpbmRpbmdEZWJ1Z0luZm8ocmVuZGVyRWxlbWVudDogYW55LCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgcHJvcGVydHlWYWx1ZTogc3RyaW5nKTpcbiAgICAgIHZvaWQ7XG5cbiAgYWJzdHJhY3Qgc2V0RWxlbWVudENsYXNzKHJlbmRlckVsZW1lbnQ6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcsIGlzQWRkOiBib29sZWFuKTogdm9pZDtcblxuICBhYnN0cmFjdCBzZXRFbGVtZW50U3R5bGUocmVuZGVyRWxlbWVudDogYW55LCBzdHlsZU5hbWU6IHN0cmluZywgc3R5bGVWYWx1ZT86IHN0cmluZyk6IHZvaWQ7XG5cbiAgYWJzdHJhY3QgaW52b2tlRWxlbWVudE1ldGhvZChyZW5kZXJFbGVtZW50OiBhbnksIG1ldGhvZE5hbWU6IHN0cmluZywgYXJncz86IGFueVtdKTogdm9pZDtcblxuICBhYnN0cmFjdCBzZXRUZXh0KHJlbmRlck5vZGU6IGFueSwgdGV4dDogc3RyaW5nKTogdm9pZDtcblxuICBhYnN0cmFjdCBhbmltYXRlKFxuICAgICAgZWxlbWVudDogYW55LCBzdGFydGluZ1N0eWxlczogYW55LCBrZXlmcmFtZXM6IGFueVtdLCBkdXJhdGlvbjogbnVtYmVyLCBkZWxheTogbnVtYmVyLFxuICAgICAgZWFzaW5nOiBzdHJpbmcsIHByZXZpb3VzUGxheWVycz86IGFueVtdKTogYW55O1xufVxuXG5leHBvcnQgY29uc3QgUmVuZGVyZXIySW50ZXJjZXB0b3IgPSBuZXcgSW5qZWN0aW9uVG9rZW48UmVuZGVyZXIyW10+KCdSZW5kZXJlcjJJbnRlcmNlcHRvcicpO1xuXG4vKipcbiAqIEluamVjdGFibGUgc2VydmljZSB0aGF0IHByb3ZpZGVzIGEgbG93LWxldmVsIGludGVyZmFjZSBmb3IgbW9kaWZ5aW5nIHRoZSBVSS5cbiAqXG4gKiBVc2UgdGhpcyBzZXJ2aWNlIHRvIGJ5cGFzcyBBbmd1bGFyJ3MgdGVtcGxhdGluZyBhbmQgbWFrZSBjdXN0b20gVUkgY2hhbmdlcyB0aGF0IGNhbid0IGJlXG4gKiBleHByZXNzZWQgZGVjbGFyYXRpdmVseS4gRm9yIGV4YW1wbGUgaWYgeW91IG5lZWQgdG8gc2V0IGEgcHJvcGVydHkgb3IgYW4gYXR0cmlidXRlIHdob3NlIG5hbWUgaXNcbiAqIG5vdCBzdGF0aWNhbGx5IGtub3duLCB1c2Uge0BsaW5rIFJlbmRlcmVyI3NldEVsZW1lbnRQcm9wZXJ0eSBzZXRFbGVtZW50UHJvcGVydHl9IG9yXG4gKiB7QGxpbmsgUmVuZGVyZXIjc2V0RWxlbWVudEF0dHJpYnV0ZSBzZXRFbGVtZW50QXR0cmlidXRlfSByZXNwZWN0aXZlbHkuXG4gKlxuICogSWYgeW91IGFyZSBpbXBsZW1lbnRpbmcgYSBjdXN0b20gcmVuZGVyZXIsIHlvdSBtdXN0IGltcGxlbWVudCB0aGlzIGludGVyZmFjZS5cbiAqXG4gKiBUaGUgZGVmYXVsdCBSZW5kZXJlciBpbXBsZW1lbnRhdGlvbiBpcyBgRG9tUmVuZGVyZXJgLiBBbHNvIGF2YWlsYWJsZSBpcyBgV2ViV29ya2VyUmVuZGVyZXJgLlxuICpcbiAqIEBkZXByZWNhdGVkIFVzZSBgUmVuZGVyZXJGYWN0b3J5MmAgaW5zdGVhZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJvb3RSZW5kZXJlciB7XG4gIGFic3RyYWN0IHJlbmRlckNvbXBvbmVudChjb21wb25lbnRUeXBlOiBSZW5kZXJDb21wb25lbnRUeXBlKTogUmVuZGVyZXI7XG59XG5cbi8qKlxuICogVXNlZCBieSBgUmVuZGVyZXJGYWN0b3J5MmAgdG8gYXNzb2NpYXRlIGN1c3RvbSByZW5kZXJpbmcgZGF0YSBhbmQgc3R5bGVzXG4gKiB3aXRoIGEgcmVuZGVyaW5nIGltcGxlbWVudGF0aW9uLlxuICogIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJlclR5cGUyIHtcbiAgLyoqXG4gICAqIEEgdW5pcXVlIGlkZW50aWZ5aW5nIHN0cmluZyBmb3IgdGhlIG5ldyByZW5kZXJlciwgdXNlZCB3aGVuIGNyZWF0aW5nXG4gICAqIHVuaXF1ZSBzdHlsZXMgZm9yIGVuY2Fwc3VsYXRpb24uXG4gICAqL1xuICBpZDogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIHZpZXcgZW5jYXBzdWxhdGlvbiB0eXBlLCB3aGljaCBkZXRlcm1pbmVzIGhvdyBzdHlsZXMgYXJlIGFwcGxpZWQgdG9cbiAgICogRE9NIGVsZW1lbnRzLiBPbmUgb2ZcbiAgICogLSBgRW11bGF0ZWRgIChkZWZhdWx0KTogRW11bGF0ZSBuYXRpdmUgc2NvcGluZyBvZiBzdHlsZXMuXG4gICAqIC0gYE5hdGl2ZWA6IFVzZSB0aGUgbmF0aXZlIGVuY2Fwc3VsYXRpb24gbWVjaGFuaXNtIG9mIHRoZSByZW5kZXJlci5cbiAgICogLSBgU2hhZG93RG9tYDogVXNlIG1vZGVybiBbU2hhZG93XG4gICAqIERPTV0oaHR0cHM6Ly93M2MuZ2l0aHViLmlvL3dlYmNvbXBvbmVudHMvc3BlYy9zaGFkb3cvKSBhbmRcbiAgICogY3JlYXRlIGEgU2hhZG93Um9vdCBmb3IgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50LlxuICAgKiAtIGBOb25lYDogRG8gbm90IHByb3ZpZGUgYW55IHRlbXBsYXRlIG9yIHN0eWxlIGVuY2Fwc3VsYXRpb24uXG4gICAqL1xuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbjtcbiAgLyoqXG4gICAqIERlZmluZXMgQ1NTIHN0eWxlcyB0byBiZSBzdG9yZWQgb24gYSByZW5kZXJlciBpbnN0YW5jZS5cbiAgICovXG4gIHN0eWxlczogKHN0cmluZ3xhbnlbXSlbXTtcbiAgLyoqXG4gICAqIERlZmluZXMgYXJiaXRyYXJ5IGRldmVsb3Blci1kZWZpbmVkIGRhdGEgdG8gYmUgc3RvcmVkIG9uIGEgcmVuZGVyZXIgaW5zdGFuY2UuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciByZW5kZXJlcnMgdGhhdCBkZWxlZ2F0ZSB0byBvdGhlciByZW5kZXJlcnMuXG4gICAqL1xuICBkYXRhOiB7W2tpbmQ6IHN0cmluZ106IGFueX07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgaW5pdGlhbGl6ZXMgYSBjdXN0b20gcmVuZGVyZXIgdGhhdCBpbXBsZW1lbnRzIHRoZSBgUmVuZGVyZXIyYCBiYXNlIGNsYXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlbmRlcmVyRmFjdG9yeTIge1xuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgaW5pdGlhbGl6ZXMgYSBjdXN0b20gcmVuZGVyZXIgZm9yIGEgaG9zdCBET00gZWxlbWVudC5cbiAgICogQHBhcmFtIGhvc3RFbGVtZW50IFRoZSBlbGVtZW50IHRvIHJlbmRlci5cbiAgICogQHBhcmFtIHR5cGUgVGhlIGJhc2UgY2xhc3MgdG8gaW1wbGVtZW50LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGN1c3RvbSByZW5kZXJlciBpbnN0YW5jZS5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZVJlbmRlcmVyKGhvc3RFbGVtZW50OiBhbnksIHR5cGU6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMjtcbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgaW52b2tlZCB3aGVuIHJlbmRlcmluZyBoYXMgYmVndW4uXG4gICAqL1xuICBhYnN0cmFjdCBiZWdpbj8oKTogdm9pZDtcbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgaW52b2tlZCB3aGVuIHJlbmRlcmluZyBoYXMgY29tcGxldGVkLlxuICAgKi9cbiAgYWJzdHJhY3QgZW5kPygpOiB2b2lkO1xuICAvKipcbiAgICogVXNlIHdpdGggYW5pbWF0aW9ucyB0ZXN0LW9ubHkgbW9kZS4gTm90aWZpZXMgdGhlIHRlc3Qgd2hlbiByZW5kZXJpbmcgaGFzIGNvbXBsZXRlZC5cbiAgICogQHJldHVybnMgVGhlIGFzeW5jaHJvbm91cyByZXN1bHQgb2YgdGhlIGRldmVsb3Blci1kZWZpbmVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgYWJzdHJhY3Qgd2hlblJlbmRlcmluZ0RvbmU/KCk6IFByb21pc2U8YW55Pjtcbn1cblxuLyoqXG4gKiBGbGFncyBmb3IgcmVuZGVyZXItc3BlY2lmaWMgc3R5bGUgbW9kaWZpZXJzLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZW51bSBSZW5kZXJlclN0eWxlRmxhZ3MyIHtcbiAgLyoqXG4gICAqIE1hcmtzIGEgc3R5bGUgYXMgaW1wb3J0YW50LlxuICAgKi9cbiAgSW1wb3J0YW50ID0gMSA8PCAwLFxuICAvKipcbiAgICogTWFya3MgYSBzdHlsZSBhcyB1c2luZyBkYXNoIGNhc2UgbmFtaW5nICh0aGlzLWlzLWRhc2gtY2FzZSkuXG4gICAqL1xuICBEYXNoQ2FzZSA9IDEgPDwgMVxufVxuXG4vKipcbiAqIEV4dGVuZCB0aGlzIGJhc2UgY2xhc3MgdG8gaW1wbGVtZW50IGN1c3RvbSByZW5kZXJpbmcuIEJ5IGRlZmF1bHQsIEFuZ3VsYXJcbiAqIHJlbmRlcnMgYSB0ZW1wbGF0ZSBpbnRvIERPTS4gWW91IGNhbiB1c2UgY3VzdG9tIHJlbmRlcmluZyB0byBpbnRlcmNlcHRcbiAqIHJlbmRlcmluZyBjYWxscywgb3IgdG8gcmVuZGVyIHRvIHNvbWV0aGluZyBvdGhlciB0aGFuIERPTS5cbiAqXG4gKiBDcmVhdGUgeW91ciBjdXN0b20gcmVuZGVyZXIgdXNpbmcgYFJlbmRlcmVyRmFjdG9yeTJgLlxuICpcbiAqIFVzZSBhIGN1c3RvbSByZW5kZXJlciB0byBieXBhc3MgQW5ndWxhcidzIHRlbXBsYXRpbmcgYW5kXG4gKiBtYWtlIGN1c3RvbSBVSSBjaGFuZ2VzIHRoYXQgY2FuJ3QgYmUgZXhwcmVzc2VkIGRlY2xhcmF0aXZlbHkuXG4gKiBGb3IgZXhhbXBsZSBpZiB5b3UgbmVlZCB0byBzZXQgYSBwcm9wZXJ0eSBvciBhbiBhdHRyaWJ1dGUgd2hvc2UgbmFtZSBpc1xuICogbm90IHN0YXRpY2FsbHkga25vd24sIHVzZSB0aGUgYHNldFByb3BlcnR5KClgIG9yXG4gKiBgc2V0QXR0cmlidXRlKClgIG1ldGhvZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZW5kZXJlcjIge1xuICAvKipcbiAgICogVXNlIHRvIHN0b3JlIGFyYml0cmFyeSBkZXZlbG9wZXItZGVmaW5lZCBkYXRhIG9uIGEgcmVuZGVyZXIgaW5zdGFuY2UsXG4gICAqIGFzIGFuIG9iamVjdCBjb250YWluaW5nIGtleS12YWx1ZSBwYWlycy5cbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIHJlbmRlcmVycyB0aGF0IGRlbGVnYXRlIHRvIG90aGVyIHJlbmRlcmVycy5cbiAgICovXG4gIGFic3RyYWN0IGdldCBkYXRhKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBkZXN0cm95IHRoZSByZW5kZXJlciBvciB0aGUgaG9zdCBlbGVtZW50LlxuICAgKi9cbiAgYWJzdHJhY3QgZGVzdHJveSgpOiB2b2lkO1xuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gY3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBob3N0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSBuYW1lIEFuIGlkZW50aWZ5aW5nIG5hbWUgZm9yIHRoZSBuZXcgZWxlbWVudCwgdW5pcXVlIHdpdGhpbiB0aGUgbmFtZXNwYWNlLlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgZm9yIHRoZSBuZXcgZWxlbWVudC5cbiAgICogQHJldHVybnMgVGhlIG5ldyBlbGVtZW50LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlRWxlbWVudChuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZ3xudWxsKTogYW55O1xuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gYWRkIGEgY29tbWVudCB0byB0aGUgRE9NIG9mIHRoZSBob3N0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgY29tbWVudCB0ZXh0LlxuICAgKiBAcmV0dXJucyBUaGUgbW9kaWZpZWQgZWxlbWVudC5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNvbW1lbnQodmFsdWU6IHN0cmluZyk6IGFueTtcblxuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gYWRkIHRleHQgdG8gdGhlIERPTSBvZiB0aGUgaG9zdCBlbGVtZW50LlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHRleHQgc3RyaW5nLlxuICAgKiBAcmV0dXJucyBUaGUgbW9kaWZpZWQgZWxlbWVudC5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZVRleHQodmFsdWU6IHN0cmluZyk6IGFueTtcbiAgLyoqXG4gICAqIElmIG51bGwgb3IgdW5kZWZpbmVkLCB0aGUgdmlldyBlbmdpbmUgd29uJ3QgY2FsbCBpdC5cbiAgICogVGhpcyBpcyB1c2VkIGFzIGEgcGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uIGZvciBwcm9kdWN0aW9uIG1vZGUuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZGVzdHJveU5vZGUgITogKChub2RlOiBhbnkpID0+IHZvaWQpIHwgbnVsbDtcbiAgLyoqXG4gICAqIEFwcGVuZHMgYSBjaGlsZCB0byBhIGdpdmVuIHBhcmVudCBub2RlIGluIHRoZSBob3N0IGVsZW1lbnQgRE9NLlxuICAgKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgbm9kZS5cbiAgICogQHBhcmFtIG5ld0NoaWxkIFRoZSBuZXcgY2hpbGQgbm9kZS5cbiAgICovXG4gIGFic3RyYWN0IGFwcGVuZENoaWxkKHBhcmVudDogYW55LCBuZXdDaGlsZDogYW55KTogdm9pZDtcbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIGluc2VydCBhIGNoaWxkIG5vZGUgYXQgYSBnaXZlbiBwb3NpdGlvbiBpbiBhIHBhcmVudCBub2RlXG4gICAqIGluIHRoZSBob3N0IGVsZW1lbnQgRE9NLlxuICAgKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgbm9kZS5cbiAgICogQHBhcmFtIG5ld0NoaWxkIFRoZSBuZXcgY2hpbGQgbm9kZXMuXG4gICAqIEBwYXJhbSByZWZDaGlsZCBUaGUgZXhpc3RpbmcgY2hpbGQgbm9kZSB0aGF0IHNob3VsZCBwcmVjZWRlIHRoZSBuZXcgbm9kZS5cbiAgICovXG4gIGFic3RyYWN0IGluc2VydEJlZm9yZShwYXJlbnQ6IGFueSwgbmV3Q2hpbGQ6IGFueSwgcmVmQ2hpbGQ6IGFueSk6IHZvaWQ7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byByZW1vdmUgYSBjaGlsZCBub2RlIGZyb20gdGhlIGhvc3QgZWxlbWVudCdzIERPTS5cbiAgICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG5vZGUuXG4gICAqIEBwYXJhbSBvbGRDaGlsZCBUaGUgY2hpbGQgbm9kZSB0byByZW1vdmUuXG4gICAqL1xuICBhYnN0cmFjdCByZW1vdmVDaGlsZChwYXJlbnQ6IGFueSwgb2xkQ2hpbGQ6IGFueSk6IHZvaWQ7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBwcmVwYXJlIGFuIGVsZW1lbnQgdG8gYmUgYm9vdHN0cmFwcGVkXG4gICAqIGFzIGEgcm9vdCBlbGVtZW50LCBhbmQgcmV0dXJuIHRoZSBlbGVtZW50IGluc3RhbmNlLlxuICAgKiBAcGFyYW0gc2VsZWN0b3JPck5vZGUgVGhlIERPTSBlbGVtZW50LlxuICAgKiBAcGFyYW0gcHJlc2VydmVDb250ZW50IFdoZXRoZXIgdGhlIGNvbnRlbnRzIG9mIHRoZSByb290IGVsZW1lbnRcbiAgICogc2hvdWxkIGJlIHByZXNlcnZlZCwgb3IgY2xlYXJlZCB1cG9uIGJvb3RzdHJhcCAoZGVmYXVsdCBiZWhhdmlvcikuXG4gICAqIFVzZSB3aXRoIGBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb21gIHRvIGFsbG93IHNpbXBsZSBuYXRpdmVcbiAgICogY29udGVudCBwcm9qZWN0aW9uIHZpYSBgPHNsb3Q+YCBlbGVtZW50cy5cbiAgICogQHJldHVybnMgVGhlIHJvb3QgZWxlbWVudC5cbiAgICovXG4gIGFic3RyYWN0IHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55LCBwcmVzZXJ2ZUNvbnRlbnQ/OiBib29sZWFuKTogYW55O1xuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gZ2V0IHRoZSBwYXJlbnQgb2YgYSBnaXZlbiBub2RlXG4gICAqIGluIHRoZSBob3N0IGVsZW1lbnQncyBET00uXG4gICAqIEBwYXJhbSBub2RlIFRoZSBjaGlsZCBub2RlIHRvIHF1ZXJ5LlxuICAgKiBAcmV0dXJucyBUaGUgcGFyZW50IG5vZGUsIG9yIG51bGwgaWYgdGhlcmUgaXMgbm8gcGFyZW50LlxuICAgKiBGb3IgV2ViV29ya2VycywgYWx3YXlzIHJldHVybnMgdHJ1ZS5cbiAgICogVGhpcyBpcyBiZWNhdXNlIHRoZSBjaGVjayBpcyBzeW5jaHJvbm91cyxcbiAgICogYW5kIHRoZSBjYWxsZXIgY2FuJ3QgcmVseSBvbiBjaGVja2luZyBmb3IgbnVsbC5cbiAgICovXG4gIGFic3RyYWN0IHBhcmVudE5vZGUobm9kZTogYW55KTogYW55O1xuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gZ2V0IHRoZSBuZXh0IHNpYmxpbmcgbm9kZSBvZiBhIGdpdmVuIG5vZGVcbiAgICogaW4gdGhlIGhvc3QgZWxlbWVudCdzIERPTS5cbiAgICogQHJldHVybnMgVGhlIHNpYmxpbmcgbm9kZSwgb3IgbnVsbCBpZiB0aGVyZSBpcyBubyBzaWJsaW5nLlxuICAgKiBGb3IgV2ViV29ya2VycywgYWx3YXlzIHJldHVybnMgYSB2YWx1ZS5cbiAgICogVGhpcyBpcyBiZWNhdXNlIHRoZSBjaGVjayBpcyBzeW5jaHJvbm91cyxcbiAgICogYW5kIHRoZSBjYWxsZXIgY2FuJ3QgcmVseSBvbiBjaGVja2luZyBmb3IgbnVsbC5cbiAgICovXG4gIGFic3RyYWN0IG5leHRTaWJsaW5nKG5vZGU6IGFueSk6IGFueTtcbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIHNldCBhbiBhdHRyaWJ1dGUgdmFsdWUgZm9yIGFuIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgYXR0cmlidXRlIG5hbWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgbmV3IHZhbHVlLlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UuXG4gICAqL1xuICBhYnN0cmFjdCBzZXRBdHRyaWJ1dGUoZWw6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmd8bnVsbCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIHJlbW92ZSBhbiBhdHRyaWJ1dGUgZnJvbSBhbiBlbGVtZW50IGluIHRoZSBET00uXG4gICAqIEBwYXJhbSBlbCBUaGUgZWxlbWVudC5cbiAgICogQHBhcmFtIG5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UuXG4gICAqL1xuICBhYnN0cmFjdCByZW1vdmVBdHRyaWJ1dGUoZWw6IGFueSwgbmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmd8bnVsbCk6IHZvaWQ7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBhZGQgYSBjbGFzcyB0byBhbiBlbGVtZW50IGluIHRoZSBET00uXG4gICAqIEBwYXJhbSBlbCBUaGUgZWxlbWVudC5cbiAgICogQHBhcmFtIG5hbWUgVGhlIGNsYXNzIG5hbWUuXG4gICAqL1xuICBhYnN0cmFjdCBhZGRDbGFzcyhlbDogYW55LCBuYW1lOiBzdHJpbmcpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byByZW1vdmUgYSBjbGFzcyBmcm9tIGFuIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgY2xhc3MgbmFtZS5cbiAgICovXG4gIGFic3RyYWN0IHJlbW92ZUNsYXNzKGVsOiBhbnksIG5hbWU6IHN0cmluZyk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIHNldCBhIENTUyBzdHlsZSBmb3IgYW4gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcGFyYW0gZWwgVGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBzdHlsZSBUaGUgbmFtZSBvZiB0aGUgc3R5bGUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgbmV3IHZhbHVlLlxuICAgKiBAcGFyYW0gZmxhZ3MgRmxhZ3MgZm9yIHN0eWxlIHZhcmlhdGlvbnMuIE5vIGZsYWdzIGFyZSBzZXQgYnkgZGVmYXVsdC5cbiAgICovXG4gIGFic3RyYWN0IHNldFN0eWxlKGVsOiBhbnksIHN0eWxlOiBzdHJpbmcsIHZhbHVlOiBhbnksIGZsYWdzPzogUmVuZGVyZXJTdHlsZUZsYWdzMik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIHJlbW92ZSB0aGUgdmFsdWUgZnJvbSBhIENTUyBzdHlsZSBmb3IgYW4gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcGFyYW0gZWwgVGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBzdHlsZSBUaGUgbmFtZSBvZiB0aGUgc3R5bGUuXG4gICAqIEBwYXJhbSBmbGFncyBGbGFncyBmb3Igc3R5bGUgdmFyaWF0aW9ucyB0byByZW1vdmUsIGlmIHNldC4gPz8/XG4gICAqL1xuICBhYnN0cmFjdCByZW1vdmVTdHlsZShlbDogYW55LCBzdHlsZTogc3RyaW5nLCBmbGFncz86IFJlbmRlcmVyU3R5bGVGbGFnczIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBzZXQgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgb2YgYW4gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcGFyYW0gZWwgVGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBwcm9wZXJ0eSBuYW1lLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZS5cbiAgICovXG4gIGFic3RyYWN0IHNldFByb3BlcnR5KGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIHNldCB0aGUgdmFsdWUgb2YgYSBub2RlIGluIHRoZSBob3N0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSBub2RlIFRoZSBub2RlLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZS5cbiAgICovXG4gIGFic3RyYWN0IHNldFZhbHVlKG5vZGU6IGFueSwgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIHN0YXJ0IGFuIGV2ZW50IGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSBjb250ZXh0IGluIHdoaWNoIHRvIGxpc3RlbiBmb3IgZXZlbnRzLiBDYW4gYmVcbiAgICogdGhlIGVudGlyZSB3aW5kb3cgb3IgZG9jdW1lbnQsIHRoZSBib2R5IG9mIHRoZSBkb2N1bWVudCwgb3IgYSBzcGVjaWZpY1xuICAgKiBET00gZWxlbWVudC5cbiAgICogQHBhcmFtIGV2ZW50TmFtZSBUaGUgZXZlbnQgdG8gbGlzdGVuIGZvci5cbiAgICogQHBhcmFtIGNhbGxiYWNrIEEgaGFuZGxlciBmdW5jdGlvbiB0byBpbnZva2Ugd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxuICAgKiBAcmV0dXJucyBBbiBcInVubGlzdGVuXCIgZnVuY3Rpb24gZm9yIGRpc3Bvc2luZyBvZiB0aGlzIGhhbmRsZXIuXG4gICAqL1xuICBhYnN0cmFjdCBsaXN0ZW4oXG4gICAgICB0YXJnZXQ6ICd3aW5kb3cnfCdkb2N1bWVudCd8J2JvZHknfGFueSwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGJvb2xlYW4gfCB2b2lkKTogKCkgPT4gdm9pZDtcblxuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBfX05HX0VMRU1FTlRfSURfXzogKCkgPT4gUmVuZGVyZXIyID0gKCkgPT4gU1dJVENIX1JFTkRFUkVSMl9GQUNUT1JZKCk7XG59XG5cblxuZXhwb3J0IGNvbnN0IFNXSVRDSF9SRU5ERVJFUjJfRkFDVE9SWV9fUE9TVF9SM19fID0gcmVuZGVyM0luamVjdFJlbmRlcmVyMjtcbmNvbnN0IFNXSVRDSF9SRU5ERVJFUjJfRkFDVE9SWV9fUFJFX1IzX18gPSBub29wO1xuY29uc3QgU1dJVENIX1JFTkRFUkVSMl9GQUNUT1JZOiB0eXBlb2YgcmVuZGVyM0luamVjdFJlbmRlcmVyMiA9IFNXSVRDSF9SRU5ERVJFUjJfRkFDVE9SWV9fUFJFX1IzX187XG4iXX0=