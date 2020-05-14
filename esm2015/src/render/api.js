/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render/api.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
/** @type {?} */
export const Renderer2Interceptor = new InjectionToken('Renderer2Interceptor');
/**
 * Used by `RendererFactory2` to associate custom rendering data and styles
 * with a rendering implementation.
 * \@publicApi
 * @record
 */
export function RendererType2() { }
if (false) {
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
}
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
const RendererStyleFlags2 = {
    // TODO(misko): This needs to be refactored into a separate file so that it can be imported from
    // `node_manipulation.ts` Currently doing the import cause resolution order to change and fails
    // the tests. The work around is to have hard coded value in `node_manipulation.ts` for now.
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
let Renderer2 = /** @class */ (() => {
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
    class Renderer2 {
    }
    /**
     * \@internal
     * @nocollapse
     */
    Renderer2.__NG_ELEMENT_ID__ = (/**
     * @return {?}
     */
    () => SWITCH_RENDERER2_FACTORY());
    return Renderer2;
})();
export { Renderer2 };
if (false) {
    /**
     * \@internal
     * @nocollapse
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
     * @param {?} refChild The existing child node before which `newChild` is inserted.
     * @return {?}
     */
    Renderer2.prototype.insertBefore = function (parent, newChild, refChild) { };
    /**
     * Implement this callback to remove a child node from the host element's DOM.
     * @abstract
     * @param {?} parent The parent node.
     * @param {?} oldChild The child node to remove.
     * @param {?=} isHostElement Optionally signal to the renderer whether this element is a host element
     * or not
     * @return {?}
     */
    Renderer2.prototype.removeChild = function (parent, oldChild, isHostElement) { };
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
const SWITCH_RENDERER2_FACTORY = SWITCH_RENDERER2_FACTORY__POST_R3__;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFckQsT0FBTyxFQUFDLGVBQWUsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQy9GLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxjQUFjLENBQUM7O0FBR2xDLE1BQU0sT0FBTyxvQkFBb0IsR0FBRyxJQUFJLGNBQWMsQ0FBYyxzQkFBc0IsQ0FBQzs7Ozs7OztBQU8zRixtQ0EwQkM7Ozs7Ozs7SUFyQkMsMkJBQVc7Ozs7Ozs7Ozs7OztJQVdYLHNDQUFpQzs7Ozs7SUFJakMsK0JBQXlCOzs7Ozs7SUFLekIsNkJBQTRCOzs7Ozs7OztBQVE5QixNQUFNLE9BQWdCLGdCQUFnQjtDQXFCckM7Ozs7Ozs7OztJQWRDLDZFQUErRTs7Ozs7O0lBSS9FLG1EQUF3Qjs7Ozs7O0lBSXhCLGlEQUFzQjs7Ozs7O0lBS3RCLCtEQUE0Qzs7O0FBTzlDLE1BQVksbUJBQW1CO0lBQzdCLGdHQUFnRztJQUNoRywrRkFBK0Y7SUFDL0YsNEZBQTRGO0lBQzVGOztPQUVHO0lBQ0gsU0FBUyxHQUFTO0lBQ2xCOztPQUVHO0lBQ0gsUUFBUSxHQUFTO0VBQ2xCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRDs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFBQSxNQUFzQixTQUFTOzs7Ozs7SUF5S3RCLDJCQUFpQjs7O0lBQW9CLEdBQUcsRUFBRSxDQUFDLHdCQUF3QixFQUFFLEVBQUM7SUFDL0UsZ0JBQUM7S0FBQTtTQTFLcUIsU0FBUzs7Ozs7OztJQXlLN0IsNEJBQTZFOzs7Ozs7SUFwSTdFLGdDQUF5Qzs7Ozs7Ozs7SUEvQnpDLDJDQUEwQzs7Ozs7O0lBSzFDLDhDQUF5Qjs7Ozs7Ozs7SUFPekIsbUVBQW1FOzs7Ozs7O0lBTW5FLHlEQUEyQzs7Ozs7OztJQU8zQyxzREFBd0M7Ozs7Ozs7O0lBWXhDLGtFQUF1RDs7Ozs7Ozs7OztJQVF2RCw2RUFBdUU7Ozs7Ozs7Ozs7SUFRdkUsaUZBQWdGOzs7Ozs7Ozs7Ozs7SUFXaEYsdUZBQXVGOzs7Ozs7Ozs7OztJQVV2RixxREFBb0M7Ozs7Ozs7Ozs7O0lBU3BDLHNEQUFxQzs7Ozs7Ozs7OztJQVFyQyw2RUFBMkY7Ozs7Ozs7OztJQVEzRix5RUFBK0U7Ozs7Ozs7O0lBTS9FLHVEQUErQzs7Ozs7Ozs7SUFPL0MsMERBQWtEOzs7Ozs7Ozs7O0lBU2xELHNFQUF5Rjs7Ozs7Ozs7O0lBUXpGLGtFQUFnRjs7Ozs7Ozs7O0lBUWhGLGlFQUE4RDs7Ozs7Ozs7SUFPOUQsMERBQWtEOzs7Ozs7Ozs7OztJQVdsRCx3RUFFMEQ7OztBQVU1RCxNQUFNLE9BQU8sbUNBQW1DLEdBQUcsc0JBQXNCOztNQUNuRSxrQ0FBa0MsR0FBRyxJQUFJOztNQUN6Qyx3QkFBd0IsR0FGakIsbUNBRXFGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge2luamVjdFJlbmRlcmVyMiBhcyByZW5kZXIzSW5qZWN0UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIzL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtub29wfSBmcm9tICcuLi91dGlsL25vb3AnO1xuXG5cbmV4cG9ydCBjb25zdCBSZW5kZXJlcjJJbnRlcmNlcHRvciA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSZW5kZXJlcjJbXT4oJ1JlbmRlcmVyMkludGVyY2VwdG9yJyk7XG5cbi8qKlxuICogVXNlZCBieSBgUmVuZGVyZXJGYWN0b3J5MmAgdG8gYXNzb2NpYXRlIGN1c3RvbSByZW5kZXJpbmcgZGF0YSBhbmQgc3R5bGVzXG4gKiB3aXRoIGEgcmVuZGVyaW5nIGltcGxlbWVudGF0aW9uLlxuICogIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJlclR5cGUyIHtcbiAgLyoqXG4gICAqIEEgdW5pcXVlIGlkZW50aWZ5aW5nIHN0cmluZyBmb3IgdGhlIG5ldyByZW5kZXJlciwgdXNlZCB3aGVuIGNyZWF0aW5nXG4gICAqIHVuaXF1ZSBzdHlsZXMgZm9yIGVuY2Fwc3VsYXRpb24uXG4gICAqL1xuICBpZDogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIHZpZXcgZW5jYXBzdWxhdGlvbiB0eXBlLCB3aGljaCBkZXRlcm1pbmVzIGhvdyBzdHlsZXMgYXJlIGFwcGxpZWQgdG9cbiAgICogRE9NIGVsZW1lbnRzLiBPbmUgb2ZcbiAgICogLSBgRW11bGF0ZWRgIChkZWZhdWx0KTogRW11bGF0ZSBuYXRpdmUgc2NvcGluZyBvZiBzdHlsZXMuXG4gICAqIC0gYE5hdGl2ZWA6IFVzZSB0aGUgbmF0aXZlIGVuY2Fwc3VsYXRpb24gbWVjaGFuaXNtIG9mIHRoZSByZW5kZXJlci5cbiAgICogLSBgU2hhZG93RG9tYDogVXNlIG1vZGVybiBbU2hhZG93XG4gICAqIERPTV0oaHR0cHM6Ly93M2MuZ2l0aHViLmlvL3dlYmNvbXBvbmVudHMvc3BlYy9zaGFkb3cvKSBhbmRcbiAgICogY3JlYXRlIGEgU2hhZG93Um9vdCBmb3IgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50LlxuICAgKiAtIGBOb25lYDogRG8gbm90IHByb3ZpZGUgYW55IHRlbXBsYXRlIG9yIHN0eWxlIGVuY2Fwc3VsYXRpb24uXG4gICAqL1xuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbjtcbiAgLyoqXG4gICAqIERlZmluZXMgQ1NTIHN0eWxlcyB0byBiZSBzdG9yZWQgb24gYSByZW5kZXJlciBpbnN0YW5jZS5cbiAgICovXG4gIHN0eWxlczogKHN0cmluZ3xhbnlbXSlbXTtcbiAgLyoqXG4gICAqIERlZmluZXMgYXJiaXRyYXJ5IGRldmVsb3Blci1kZWZpbmVkIGRhdGEgdG8gYmUgc3RvcmVkIG9uIGEgcmVuZGVyZXIgaW5zdGFuY2UuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciByZW5kZXJlcnMgdGhhdCBkZWxlZ2F0ZSB0byBvdGhlciByZW5kZXJlcnMuXG4gICAqL1xuICBkYXRhOiB7W2tpbmQ6IHN0cmluZ106IGFueX07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgaW5pdGlhbGl6ZXMgYSBjdXN0b20gcmVuZGVyZXIgdGhhdCBpbXBsZW1lbnRzIHRoZSBgUmVuZGVyZXIyYCBiYXNlIGNsYXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlbmRlcmVyRmFjdG9yeTIge1xuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgaW5pdGlhbGl6ZXMgYSBjdXN0b20gcmVuZGVyZXIgZm9yIGEgaG9zdCBET00gZWxlbWVudC5cbiAgICogQHBhcmFtIGhvc3RFbGVtZW50IFRoZSBlbGVtZW50IHRvIHJlbmRlci5cbiAgICogQHBhcmFtIHR5cGUgVGhlIGJhc2UgY2xhc3MgdG8gaW1wbGVtZW50LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGN1c3RvbSByZW5kZXJlciBpbnN0YW5jZS5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZVJlbmRlcmVyKGhvc3RFbGVtZW50OiBhbnksIHR5cGU6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMjtcbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgaW52b2tlZCB3aGVuIHJlbmRlcmluZyBoYXMgYmVndW4uXG4gICAqL1xuICBhYnN0cmFjdCBiZWdpbj8oKTogdm9pZDtcbiAgLyoqXG4gICAqIEEgY2FsbGJhY2sgaW52b2tlZCB3aGVuIHJlbmRlcmluZyBoYXMgY29tcGxldGVkLlxuICAgKi9cbiAgYWJzdHJhY3QgZW5kPygpOiB2b2lkO1xuICAvKipcbiAgICogVXNlIHdpdGggYW5pbWF0aW9ucyB0ZXN0LW9ubHkgbW9kZS4gTm90aWZpZXMgdGhlIHRlc3Qgd2hlbiByZW5kZXJpbmcgaGFzIGNvbXBsZXRlZC5cbiAgICogQHJldHVybnMgVGhlIGFzeW5jaHJvbm91cyByZXN1bHQgb2YgdGhlIGRldmVsb3Blci1kZWZpbmVkIGZ1bmN0aW9uLlxuICAgKi9cbiAgYWJzdHJhY3Qgd2hlblJlbmRlcmluZ0RvbmU/KCk6IFByb21pc2U8YW55Pjtcbn1cblxuLyoqXG4gKiBGbGFncyBmb3IgcmVuZGVyZXItc3BlY2lmaWMgc3R5bGUgbW9kaWZpZXJzLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZW51bSBSZW5kZXJlclN0eWxlRmxhZ3MyIHtcbiAgLy8gVE9ETyhtaXNrbyk6IFRoaXMgbmVlZHMgdG8gYmUgcmVmYWN0b3JlZCBpbnRvIGEgc2VwYXJhdGUgZmlsZSBzbyB0aGF0IGl0IGNhbiBiZSBpbXBvcnRlZCBmcm9tXG4gIC8vIGBub2RlX21hbmlwdWxhdGlvbi50c2AgQ3VycmVudGx5IGRvaW5nIHRoZSBpbXBvcnQgY2F1c2UgcmVzb2x1dGlvbiBvcmRlciB0byBjaGFuZ2UgYW5kIGZhaWxzXG4gIC8vIHRoZSB0ZXN0cy4gVGhlIHdvcmsgYXJvdW5kIGlzIHRvIGhhdmUgaGFyZCBjb2RlZCB2YWx1ZSBpbiBgbm9kZV9tYW5pcHVsYXRpb24udHNgIGZvciBub3cuXG4gIC8qKlxuICAgKiBNYXJrcyBhIHN0eWxlIGFzIGltcG9ydGFudC5cbiAgICovXG4gIEltcG9ydGFudCA9IDEgPDwgMCxcbiAgLyoqXG4gICAqIE1hcmtzIGEgc3R5bGUgYXMgdXNpbmcgZGFzaCBjYXNlIG5hbWluZyAodGhpcy1pcy1kYXNoLWNhc2UpLlxuICAgKi9cbiAgRGFzaENhc2UgPSAxIDw8IDFcbn1cblxuLyoqXG4gKiBFeHRlbmQgdGhpcyBiYXNlIGNsYXNzIHRvIGltcGxlbWVudCBjdXN0b20gcmVuZGVyaW5nLiBCeSBkZWZhdWx0LCBBbmd1bGFyXG4gKiByZW5kZXJzIGEgdGVtcGxhdGUgaW50byBET00uIFlvdSBjYW4gdXNlIGN1c3RvbSByZW5kZXJpbmcgdG8gaW50ZXJjZXB0XG4gKiByZW5kZXJpbmcgY2FsbHMsIG9yIHRvIHJlbmRlciB0byBzb21ldGhpbmcgb3RoZXIgdGhhbiBET00uXG4gKlxuICogQ3JlYXRlIHlvdXIgY3VzdG9tIHJlbmRlcmVyIHVzaW5nIGBSZW5kZXJlckZhY3RvcnkyYC5cbiAqXG4gKiBVc2UgYSBjdXN0b20gcmVuZGVyZXIgdG8gYnlwYXNzIEFuZ3VsYXIncyB0ZW1wbGF0aW5nIGFuZFxuICogbWFrZSBjdXN0b20gVUkgY2hhbmdlcyB0aGF0IGNhbid0IGJlIGV4cHJlc3NlZCBkZWNsYXJhdGl2ZWx5LlxuICogRm9yIGV4YW1wbGUgaWYgeW91IG5lZWQgdG8gc2V0IGEgcHJvcGVydHkgb3IgYW4gYXR0cmlidXRlIHdob3NlIG5hbWUgaXNcbiAqIG5vdCBzdGF0aWNhbGx5IGtub3duLCB1c2UgdGhlIGBzZXRQcm9wZXJ0eSgpYCBvclxuICogYHNldEF0dHJpYnV0ZSgpYCBtZXRob2QuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVuZGVyZXIyIHtcbiAgLyoqXG4gICAqIFVzZSB0byBzdG9yZSBhcmJpdHJhcnkgZGV2ZWxvcGVyLWRlZmluZWQgZGF0YSBvbiBhIHJlbmRlcmVyIGluc3RhbmNlLFxuICAgKiBhcyBhbiBvYmplY3QgY29udGFpbmluZyBrZXktdmFsdWUgcGFpcnMuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciByZW5kZXJlcnMgdGhhdCBkZWxlZ2F0ZSB0byBvdGhlciByZW5kZXJlcnMuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgZGF0YSgpOiB7W2tleTogc3RyaW5nXTogYW55fTtcblxuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gZGVzdHJveSB0aGUgcmVuZGVyZXIgb3IgdGhlIGhvc3QgZWxlbWVudC5cbiAgICovXG4gIGFic3RyYWN0IGRlc3Ryb3koKTogdm9pZDtcbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgaG9zdCBlbGVtZW50LlxuICAgKiBAcGFyYW0gbmFtZSBBbiBpZGVudGlmeWluZyBuYW1lIGZvciB0aGUgbmV3IGVsZW1lbnQsIHVuaXF1ZSB3aXRoaW4gdGhlIG5hbWVzcGFjZS5cbiAgICogQHBhcmFtIG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIGZvciB0aGUgbmV3IGVsZW1lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBuZXcgZWxlbWVudC5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUVsZW1lbnQobmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmd8bnVsbCk6IGFueTtcbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIGFkZCBhIGNvbW1lbnQgdG8gdGhlIERPTSBvZiB0aGUgaG9zdCBlbGVtZW50LlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIGNvbW1lbnQgdGV4dC5cbiAgICogQHJldHVybnMgVGhlIG1vZGlmaWVkIGVsZW1lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVDb21tZW50KHZhbHVlOiBzdHJpbmcpOiBhbnk7XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIGFkZCB0ZXh0IHRvIHRoZSBET00gb2YgdGhlIGhvc3QgZWxlbWVudC5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB0ZXh0IHN0cmluZy5cbiAgICogQHJldHVybnMgVGhlIG1vZGlmaWVkIGVsZW1lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVUZXh0KHZhbHVlOiBzdHJpbmcpOiBhbnk7XG4gIC8qKlxuICAgKiBJZiBudWxsIG9yIHVuZGVmaW5lZCwgdGhlIHZpZXcgZW5naW5lIHdvbid0IGNhbGwgaXQuXG4gICAqIFRoaXMgaXMgdXNlZCBhcyBhIHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbiBmb3IgcHJvZHVjdGlvbiBtb2RlLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGRlc3Ryb3lOb2RlITogKChub2RlOiBhbnkpID0+IHZvaWQpfG51bGw7XG4gIC8qKlxuICAgKiBBcHBlbmRzIGEgY2hpbGQgdG8gYSBnaXZlbiBwYXJlbnQgbm9kZSBpbiB0aGUgaG9zdCBlbGVtZW50IERPTS5cbiAgICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG5vZGUuXG4gICAqIEBwYXJhbSBuZXdDaGlsZCBUaGUgbmV3IGNoaWxkIG5vZGUuXG4gICAqL1xuICBhYnN0cmFjdCBhcHBlbmRDaGlsZChwYXJlbnQ6IGFueSwgbmV3Q2hpbGQ6IGFueSk6IHZvaWQ7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBpbnNlcnQgYSBjaGlsZCBub2RlIGF0IGEgZ2l2ZW4gcG9zaXRpb24gaW4gYSBwYXJlbnQgbm9kZVxuICAgKiBpbiB0aGUgaG9zdCBlbGVtZW50IERPTS5cbiAgICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG5vZGUuXG4gICAqIEBwYXJhbSBuZXdDaGlsZCBUaGUgbmV3IGNoaWxkIG5vZGVzLlxuICAgKiBAcGFyYW0gcmVmQ2hpbGQgVGhlIGV4aXN0aW5nIGNoaWxkIG5vZGUgYmVmb3JlIHdoaWNoIGBuZXdDaGlsZGAgaXMgaW5zZXJ0ZWQuXG4gICAqL1xuICBhYnN0cmFjdCBpbnNlcnRCZWZvcmUocGFyZW50OiBhbnksIG5ld0NoaWxkOiBhbnksIHJlZkNoaWxkOiBhbnkpOiB2b2lkO1xuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gcmVtb3ZlIGEgY2hpbGQgbm9kZSBmcm9tIHRoZSBob3N0IGVsZW1lbnQncyBET00uXG4gICAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBub2RlLlxuICAgKiBAcGFyYW0gb2xkQ2hpbGQgVGhlIGNoaWxkIG5vZGUgdG8gcmVtb3ZlLlxuICAgKiBAcGFyYW0gaXNIb3N0RWxlbWVudCBPcHRpb25hbGx5IHNpZ25hbCB0byB0aGUgcmVuZGVyZXIgd2hldGhlciB0aGlzIGVsZW1lbnQgaXMgYSBob3N0IGVsZW1lbnRcbiAgICogb3Igbm90XG4gICAqL1xuICBhYnN0cmFjdCByZW1vdmVDaGlsZChwYXJlbnQ6IGFueSwgb2xkQ2hpbGQ6IGFueSwgaXNIb3N0RWxlbWVudD86IGJvb2xlYW4pOiB2b2lkO1xuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gcHJlcGFyZSBhbiBlbGVtZW50IHRvIGJlIGJvb3RzdHJhcHBlZFxuICAgKiBhcyBhIHJvb3QgZWxlbWVudCwgYW5kIHJldHVybiB0aGUgZWxlbWVudCBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHNlbGVjdG9yT3JOb2RlIFRoZSBET00gZWxlbWVudC5cbiAgICogQHBhcmFtIHByZXNlcnZlQ29udGVudCBXaGV0aGVyIHRoZSBjb250ZW50cyBvZiB0aGUgcm9vdCBlbGVtZW50XG4gICAqIHNob3VsZCBiZSBwcmVzZXJ2ZWQsIG9yIGNsZWFyZWQgdXBvbiBib290c3RyYXAgKGRlZmF1bHQgYmVoYXZpb3IpLlxuICAgKiBVc2Ugd2l0aCBgVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tYCB0byBhbGxvdyBzaW1wbGUgbmF0aXZlXG4gICAqIGNvbnRlbnQgcHJvamVjdGlvbiB2aWEgYDxzbG90PmAgZWxlbWVudHMuXG4gICAqIEByZXR1cm5zIFRoZSByb290IGVsZW1lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBzZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZTogc3RyaW5nfGFueSwgcHJlc2VydmVDb250ZW50PzogYm9vbGVhbik6IGFueTtcbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIGdldCB0aGUgcGFyZW50IG9mIGEgZ2l2ZW4gbm9kZVxuICAgKiBpbiB0aGUgaG9zdCBlbGVtZW50J3MgRE9NLlxuICAgKiBAcGFyYW0gbm9kZSBUaGUgY2hpbGQgbm9kZSB0byBxdWVyeS5cbiAgICogQHJldHVybnMgVGhlIHBhcmVudCBub2RlLCBvciBudWxsIGlmIHRoZXJlIGlzIG5vIHBhcmVudC5cbiAgICogRm9yIFdlYldvcmtlcnMsIGFsd2F5cyByZXR1cm5zIHRydWUuXG4gICAqIFRoaXMgaXMgYmVjYXVzZSB0aGUgY2hlY2sgaXMgc3luY2hyb25vdXMsXG4gICAqIGFuZCB0aGUgY2FsbGVyIGNhbid0IHJlbHkgb24gY2hlY2tpbmcgZm9yIG51bGwuXG4gICAqL1xuICBhYnN0cmFjdCBwYXJlbnROb2RlKG5vZGU6IGFueSk6IGFueTtcbiAgLyoqXG4gICAqIEltcGxlbWVudCB0aGlzIGNhbGxiYWNrIHRvIGdldCB0aGUgbmV4dCBzaWJsaW5nIG5vZGUgb2YgYSBnaXZlbiBub2RlXG4gICAqIGluIHRoZSBob3N0IGVsZW1lbnQncyBET00uXG4gICAqIEByZXR1cm5zIFRoZSBzaWJsaW5nIG5vZGUsIG9yIG51bGwgaWYgdGhlcmUgaXMgbm8gc2libGluZy5cbiAgICogRm9yIFdlYldvcmtlcnMsIGFsd2F5cyByZXR1cm5zIGEgdmFsdWUuXG4gICAqIFRoaXMgaXMgYmVjYXVzZSB0aGUgY2hlY2sgaXMgc3luY2hyb25vdXMsXG4gICAqIGFuZCB0aGUgY2FsbGVyIGNhbid0IHJlbHkgb24gY2hlY2tpbmcgZm9yIG51bGwuXG4gICAqL1xuICBhYnN0cmFjdCBuZXh0U2libGluZyhub2RlOiBhbnkpOiBhbnk7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBzZXQgYW4gYXR0cmlidXRlIHZhbHVlIGZvciBhbiBlbGVtZW50IGluIHRoZSBET00uXG4gICAqIEBwYXJhbSBlbCBUaGUgZWxlbWVudC5cbiAgICogQHBhcmFtIG5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZS5cbiAgICogQHBhcmFtIG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlLlxuICAgKi9cbiAgYWJzdHJhY3Qgc2V0QXR0cmlidXRlKGVsOiBhbnksIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nfG51bGwpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byByZW1vdmUgYW4gYXR0cmlidXRlIGZyb20gYW4gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcGFyYW0gZWwgVGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBhdHRyaWJ1dGUgbmFtZS5cbiAgICogQHBhcmFtIG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlLlxuICAgKi9cbiAgYWJzdHJhY3QgcmVtb3ZlQXR0cmlidXRlKGVsOiBhbnksIG5hbWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nfG51bGwpOiB2b2lkO1xuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gYWRkIGEgY2xhc3MgdG8gYW4gZWxlbWVudCBpbiB0aGUgRE9NLlxuICAgKiBAcGFyYW0gZWwgVGhlIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBjbGFzcyBuYW1lLlxuICAgKi9cbiAgYWJzdHJhY3QgYWRkQ2xhc3MoZWw6IGFueSwgbmFtZTogc3RyaW5nKTogdm9pZDtcblxuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gcmVtb3ZlIGEgY2xhc3MgZnJvbSBhbiBlbGVtZW50IGluIHRoZSBET00uXG4gICAqIEBwYXJhbSBlbCBUaGUgZWxlbWVudC5cbiAgICogQHBhcmFtIG5hbWUgVGhlIGNsYXNzIG5hbWUuXG4gICAqL1xuICBhYnN0cmFjdCByZW1vdmVDbGFzcyhlbDogYW55LCBuYW1lOiBzdHJpbmcpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBzZXQgYSBDU1Mgc3R5bGUgZm9yIGFuIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gc3R5bGUgVGhlIG5hbWUgb2YgdGhlIHN0eWxlLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZS5cbiAgICogQHBhcmFtIGZsYWdzIEZsYWdzIGZvciBzdHlsZSB2YXJpYXRpb25zLiBObyBmbGFncyBhcmUgc2V0IGJ5IGRlZmF1bHQuXG4gICAqL1xuICBhYnN0cmFjdCBzZXRTdHlsZShlbDogYW55LCBzdHlsZTogc3RyaW5nLCB2YWx1ZTogYW55LCBmbGFncz86IFJlbmRlcmVyU3R5bGVGbGFnczIpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byByZW1vdmUgdGhlIHZhbHVlIGZyb20gYSBDU1Mgc3R5bGUgZm9yIGFuIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gc3R5bGUgVGhlIG5hbWUgb2YgdGhlIHN0eWxlLlxuICAgKiBAcGFyYW0gZmxhZ3MgRmxhZ3MgZm9yIHN0eWxlIHZhcmlhdGlvbnMgdG8gcmVtb3ZlLCBpZiBzZXQuID8/P1xuICAgKi9cbiAgYWJzdHJhY3QgcmVtb3ZlU3R5bGUoZWw6IGFueSwgc3R5bGU6IHN0cmluZywgZmxhZ3M/OiBSZW5kZXJlclN0eWxlRmxhZ3MyKTogdm9pZDtcblxuICAvKipcbiAgICogSW1wbGVtZW50IHRoaXMgY2FsbGJhY2sgdG8gc2V0IHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9mIGFuIGVsZW1lbnQgaW4gdGhlIERPTS5cbiAgICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgcHJvcGVydHkgbmFtZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSBuZXcgdmFsdWUuXG4gICAqL1xuICBhYnN0cmFjdCBzZXRQcm9wZXJ0eShlbDogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBzZXQgdGhlIHZhbHVlIG9mIGEgbm9kZSBpbiB0aGUgaG9zdCBlbGVtZW50LlxuICAgKiBAcGFyYW0gbm9kZSBUaGUgbm9kZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSBuZXcgdmFsdWUuXG4gICAqL1xuICBhYnN0cmFjdCBzZXRWYWx1ZShub2RlOiBhbnksIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnQgdGhpcyBjYWxsYmFjayB0byBzdGFydCBhbiBldmVudCBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHRhcmdldCBUaGUgY29udGV4dCBpbiB3aGljaCB0byBsaXN0ZW4gZm9yIGV2ZW50cy4gQ2FuIGJlXG4gICAqIHRoZSBlbnRpcmUgd2luZG93IG9yIGRvY3VtZW50LCB0aGUgYm9keSBvZiB0aGUgZG9jdW1lbnQsIG9yIGEgc3BlY2lmaWNcbiAgICogRE9NIGVsZW1lbnQuXG4gICAqIEBwYXJhbSBldmVudE5hbWUgVGhlIGV2ZW50IHRvIGxpc3RlbiBmb3IuXG4gICAqIEBwYXJhbSBjYWxsYmFjayBBIGhhbmRsZXIgZnVuY3Rpb24gdG8gaW52b2tlIHdoZW4gdGhlIGV2ZW50IG9jY3Vycy5cbiAgICogQHJldHVybnMgQW4gXCJ1bmxpc3RlblwiIGZ1bmN0aW9uIGZvciBkaXNwb3Npbmcgb2YgdGhpcyBoYW5kbGVyLlxuICAgKi9cbiAgYWJzdHJhY3QgbGlzdGVuKFxuICAgICAgdGFyZ2V0OiAnd2luZG93J3wnZG9jdW1lbnQnfCdib2R5J3xhbnksIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgICAgY2FsbGJhY2s6IChldmVudDogYW55KSA9PiBib29sZWFuIHwgdm9pZCk6ICgpID0+IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAbm9jb2xsYXBzZVxuICAgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fOiAoKSA9PiBSZW5kZXJlcjIgPSAoKSA9PiBTV0lUQ0hfUkVOREVSRVIyX0ZBQ1RPUlkoKTtcbn1cblxuXG5leHBvcnQgY29uc3QgU1dJVENIX1JFTkRFUkVSMl9GQUNUT1JZX19QT1NUX1IzX18gPSByZW5kZXIzSW5qZWN0UmVuZGVyZXIyO1xuY29uc3QgU1dJVENIX1JFTkRFUkVSMl9GQUNUT1JZX19QUkVfUjNfXyA9IG5vb3A7XG5jb25zdCBTV0lUQ0hfUkVOREVSRVIyX0ZBQ1RPUlk6IHR5cGVvZiByZW5kZXIzSW5qZWN0UmVuZGVyZXIyID0gU1dJVENIX1JFTkRFUkVSMl9GQUNUT1JZX19QUkVfUjNfXztcbiJdfQ==