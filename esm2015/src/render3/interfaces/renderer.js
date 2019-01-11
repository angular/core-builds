/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * The goal here is to make sure that the browser DOM API is the Renderer.
 * We do this by defining a subset of DOM API to be the renderer and than
 * use that time for rendering.
 *
 * At runtime we can than use the DOM api directly, in server or web-worker
 * it will be easy to implement such API.
 */
/** @enum {number} */
const RendererStyleFlags3 = {
    Important: 1,
    DashCase: 2,
};
export { RendererStyleFlags3 };
RendererStyleFlags3[RendererStyleFlags3.Important] = 'Important';
RendererStyleFlags3[RendererStyleFlags3.DashCase] = 'DashCase';
/**
 * Object Oriented style of API needed to create elements and text nodes.
 *
 * This is the native browser API style, e.g. operations are methods on individual objects
 * like HTMLElement. With this style, no additional code is needed as a facade
 * (reducing payload size).
 *
 * @record
 */
export function ObjectOrientedRenderer3() { }
if (false) {
    /**
     * @param {?} data
     * @return {?}
     */
    ObjectOrientedRenderer3.prototype.createComment = function (data) { };
    /**
     * @param {?} tagName
     * @return {?}
     */
    ObjectOrientedRenderer3.prototype.createElement = function (tagName) { };
    /**
     * @param {?} namespace
     * @param {?} tagName
     * @return {?}
     */
    ObjectOrientedRenderer3.prototype.createElementNS = function (namespace, tagName) { };
    /**
     * @param {?} data
     * @return {?}
     */
    ObjectOrientedRenderer3.prototype.createTextNode = function (data) { };
    /**
     * @param {?} selectors
     * @return {?}
     */
    ObjectOrientedRenderer3.prototype.querySelector = function (selectors) { };
}
/**
 * Returns whether the `renderer` is a `ProceduralRenderer3`
 * @param {?} renderer
 * @return {?}
 */
export function isProceduralRenderer(renderer) {
    return !!(((/** @type {?} */ (renderer))).listen);
}
/**
 * Procedural style of API needed to create elements and text nodes.
 *
 * In non-native browser environments (e.g. platforms such as web-workers), this is the
 * facade that enables element manipulation. This also facilitates backwards compatibility
 * with Renderer2.
 * @record
 */
export function ProceduralRenderer3() { }
if (false) {
    /**
     * This property is allowed to be null / undefined,
     * in which case the view engine won't call it.
     * This is used as a performance optimization for production mode.
     * @type {?|undefined}
     */
    ProceduralRenderer3.prototype.destroyNode;
    /**
     * @return {?}
     */
    ProceduralRenderer3.prototype.destroy = function () { };
    /**
     * @param {?} value
     * @return {?}
     */
    ProceduralRenderer3.prototype.createComment = function (value) { };
    /**
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    ProceduralRenderer3.prototype.createElement = function (name, namespace) { };
    /**
     * @param {?} value
     * @return {?}
     */
    ProceduralRenderer3.prototype.createText = function (value) { };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @return {?}
     */
    ProceduralRenderer3.prototype.appendChild = function (parent, newChild) { };
    /**
     * @param {?} parent
     * @param {?} newChild
     * @param {?} refChild
     * @return {?}
     */
    ProceduralRenderer3.prototype.insertBefore = function (parent, newChild, refChild) { };
    /**
     * @param {?} parent
     * @param {?} oldChild
     * @return {?}
     */
    ProceduralRenderer3.prototype.removeChild = function (parent, oldChild) { };
    /**
     * @param {?} selectorOrNode
     * @return {?}
     */
    ProceduralRenderer3.prototype.selectRootElement = function (selectorOrNode) { };
    /**
     * @param {?} node
     * @return {?}
     */
    ProceduralRenderer3.prototype.parentNode = function (node) { };
    /**
     * @param {?} node
     * @return {?}
     */
    ProceduralRenderer3.prototype.nextSibling = function (node) { };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @param {?=} namespace
     * @return {?}
     */
    ProceduralRenderer3.prototype.setAttribute = function (el, name, value, namespace) { };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?=} namespace
     * @return {?}
     */
    ProceduralRenderer3.prototype.removeAttribute = function (el, name, namespace) { };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    ProceduralRenderer3.prototype.addClass = function (el, name) { };
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    ProceduralRenderer3.prototype.removeClass = function (el, name) { };
    /**
     * @param {?} el
     * @param {?} style
     * @param {?} value
     * @param {?=} flags
     * @return {?}
     */
    ProceduralRenderer3.prototype.setStyle = function (el, style, value, flags) { };
    /**
     * @param {?} el
     * @param {?} style
     * @param {?=} flags
     * @return {?}
     */
    ProceduralRenderer3.prototype.removeStyle = function (el, style, flags) { };
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    ProceduralRenderer3.prototype.setProperty = function (el, name, value) { };
    /**
     * @param {?} node
     * @param {?} value
     * @return {?}
     */
    ProceduralRenderer3.prototype.setValue = function (node, value) { };
    /**
     * @param {?} target
     * @param {?} eventName
     * @param {?} callback
     * @return {?}
     */
    ProceduralRenderer3.prototype.listen = function (target, eventName, callback) { };
}
/**
 * @record
 */
export function RendererFactory3() { }
if (false) {
    /**
     * @param {?} hostElement
     * @param {?} rendererType
     * @return {?}
     */
    RendererFactory3.prototype.createRenderer = function (hostElement, rendererType) { };
    /**
     * @return {?}
     */
    RendererFactory3.prototype.begin = function () { };
    /**
     * @return {?}
     */
    RendererFactory3.prototype.end = function () { };
}
/** @type {?} */
export const domRendererFactory3 = {
    createRenderer: (hostElement, rendererType) => { return document; }
};
/**
 * Subset of API needed for appending elements and text nodes.
 * @record
 */
export function RNode() { }
if (false) {
    /** @type {?} */
    RNode.prototype.parentNode;
    /** @type {?} */
    RNode.prototype.nextSibling;
    /**
     * @param {?} oldChild
     * @return {?}
     */
    RNode.prototype.removeChild = function (oldChild) { };
    /**
     * Insert a child node.
     *
     * Used exclusively for adding View root nodes into ViewAnchor location.
     * @param {?} newChild
     * @param {?} refChild
     * @param {?} isViewRoot
     * @return {?}
     */
    RNode.prototype.insertBefore = function (newChild, refChild, isViewRoot) { };
    /**
     * Append a child node.
     *
     * Used exclusively for building up DOM which are static (ie not View roots)
     * @param {?} newChild
     * @return {?}
     */
    RNode.prototype.appendChild = function (newChild) { };
}
/**
 * Subset of API needed for writing attributes, properties, and setting up
 * listeners on Element.
 * @record
 */
export function RElement() { }
if (false) {
    /** @type {?} */
    RElement.prototype.style;
    /** @type {?} */
    RElement.prototype.classList;
    /** @type {?} */
    RElement.prototype.className;
    /**
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    RElement.prototype.setAttribute = function (name, value) { };
    /**
     * @param {?} name
     * @return {?}
     */
    RElement.prototype.removeAttribute = function (name) { };
    /**
     * @param {?} namespaceURI
     * @param {?} qualifiedName
     * @param {?} value
     * @return {?}
     */
    RElement.prototype.setAttributeNS = function (namespaceURI, qualifiedName, value) { };
    /**
     * @param {?} type
     * @param {?} listener
     * @param {?=} useCapture
     * @return {?}
     */
    RElement.prototype.addEventListener = function (type, listener, useCapture) { };
    /**
     * @param {?} type
     * @param {?=} listener
     * @param {?=} options
     * @return {?}
     */
    RElement.prototype.removeEventListener = function (type, listener, options) { };
    /**
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    RElement.prototype.setProperty = function (name, value) { };
}
/**
 * @record
 */
export function RCssStyleDeclaration() { }
if (false) {
    /**
     * @param {?} propertyName
     * @return {?}
     */
    RCssStyleDeclaration.prototype.removeProperty = function (propertyName) { };
    /**
     * @param {?} propertyName
     * @param {?} value
     * @param {?=} priority
     * @return {?}
     */
    RCssStyleDeclaration.prototype.setProperty = function (propertyName, value, priority) { };
}
/**
 * @record
 */
export function RDomTokenList() { }
if (false) {
    /**
     * @param {?} token
     * @return {?}
     */
    RDomTokenList.prototype.add = function (token) { };
    /**
     * @param {?} token
     * @return {?}
     */
    RDomTokenList.prototype.remove = function (token) { };
}
/**
 * @record
 */
export function RText() { }
if (false) {
    /** @type {?} */
    RText.prototype.textContent;
}
/**
 * @record
 */
export function RComment() { }
if (false) {
    /** @type {?} */
    RComment.prototype.textContent;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBc0JFLFlBQWtCO0lBQ2xCLFdBQWlCOzs7Ozs7Ozs7Ozs7OztBQWtCbkIsNkNBT0M7Ozs7OztJQU5DLHNFQUFzQzs7Ozs7SUFDdEMseUVBQXlDOzs7Ozs7SUFDekMsc0ZBQThEOzs7OztJQUM5RCx1RUFBb0M7Ozs7O0lBRXBDLDJFQUFnRDs7Ozs7OztBQUlsRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsUUFBdUQ7SUFFMUYsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFBLFFBQVEsRUFBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsQ0FBQzs7Ozs7Ozs7O0FBU0QseUNBa0NDOzs7Ozs7OztJQXhCQywwQ0FBMkM7Ozs7SUFUM0Msd0RBQWdCOzs7OztJQUNoQixtRUFBdUM7Ozs7OztJQUN2Qyw2RUFBK0Q7Ozs7O0lBQy9ELGdFQUFpQzs7Ozs7O0lBT2pDLDRFQUFxRDs7Ozs7OztJQUNyRCx1RkFBeUU7Ozs7OztJQUN6RSw0RUFBcUQ7Ozs7O0lBQ3JELGdGQUF3RDs7Ozs7SUFFeEQsK0RBQXVDOzs7OztJQUN2QyxnRUFBcUM7Ozs7Ozs7O0lBRXJDLHVGQUF1Rjs7Ozs7OztJQUN2RixtRkFBMkU7Ozs7OztJQUMzRSxpRUFBMkM7Ozs7OztJQUMzQyxvRUFBOEM7Ozs7Ozs7O0lBQzlDLGdGQUUyRDs7Ozs7OztJQUMzRCw0RUFBZ0c7Ozs7Ozs7SUFDaEcsMkVBQTBEOzs7Ozs7SUFDMUQsb0VBQW9EOzs7Ozs7O0lBR3BELGtGQUUwRDs7Ozs7QUFHNUQsc0NBSUM7Ozs7Ozs7SUFIQyxxRkFBd0Y7Ozs7SUFDeEYsbURBQWU7Ozs7SUFDZixpREFBYTs7O0FBR2YsTUFBTSxPQUFPLG1CQUFtQixHQUFxQjtJQUNuRCxjQUFjLEVBQUUsQ0FBQyxXQUE0QixFQUFFLFlBQWtDLEVBQ25ELEVBQUUsR0FBRyxPQUFPLFFBQVEsQ0FBQyxDQUFBLENBQUM7Q0FDckQ7Ozs7O0FBR0QsMkJBb0JDOzs7SUFuQkMsMkJBQXVCOztJQUV2Qiw0QkFBd0I7Ozs7O0lBRXhCLHNEQUFtQzs7Ozs7Ozs7OztJQU9uQyw2RUFBK0U7Ozs7Ozs7O0lBTy9FLHNEQUFvQzs7Ozs7OztBQU90Qyw4QkFXQzs7O0lBVkMseUJBQTRCOztJQUM1Qiw2QkFBeUI7O0lBQ3pCLDZCQUFrQjs7Ozs7O0lBQ2xCLDZEQUFnRDs7Ozs7SUFDaEQseURBQW9DOzs7Ozs7O0lBQ3BDLHNGQUFpRjs7Ozs7OztJQUNqRixnRkFBb0Y7Ozs7Ozs7SUFDcEYsZ0ZBQXFGOzs7Ozs7SUFFckYsNERBQTZDOzs7OztBQUcvQywwQ0FHQzs7Ozs7O0lBRkMsNEVBQTZDOzs7Ozs7O0lBQzdDLDBGQUErRTs7Ozs7QUFHakYsbUNBR0M7Ozs7OztJQUZDLG1EQUF5Qjs7Ozs7SUFDekIsc0RBQTRCOzs7OztBQUc5QiwyQkFBa0U7OztJQUEzQiw0QkFBeUI7Ozs7O0FBRWhFLDhCQUFxRTs7O0lBQTNCLCtCQUF5Qjs7Ozs7QUFJbkUsTUFBTSxPQUFPLDZCQUE2QixHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogVGhlIGdvYWwgaGVyZSBpcyB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnJvd3NlciBET00gQVBJIGlzIHRoZSBSZW5kZXJlci5cbiAqIFdlIGRvIHRoaXMgYnkgZGVmaW5pbmcgYSBzdWJzZXQgb2YgRE9NIEFQSSB0byBiZSB0aGUgcmVuZGVyZXIgYW5kIHRoYW5cbiAqIHVzZSB0aGF0IHRpbWUgZm9yIHJlbmRlcmluZy5cbiAqXG4gKiBBdCBydW50aW1lIHdlIGNhbiB0aGFuIHVzZSB0aGUgRE9NIGFwaSBkaXJlY3RseSwgaW4gc2VydmVyIG9yIHdlYi13b3JrZXJcbiAqIGl0IHdpbGwgYmUgZWFzeSB0byBpbXBsZW1lbnQgc3VjaCBBUEkuXG4gKi9cblxuaW1wb3J0IHtSZW5kZXJlclN0eWxlRmxhZ3MyLCBSZW5kZXJlclR5cGUyfSBmcm9tICcuLi8uLi9yZW5kZXIvYXBpJztcblxuXG4vLyBUT0RPOiBjbGVhbnVwIG9uY2UgdGhlIGNvZGUgaXMgbWVyZ2VkIGluIGFuZ3VsYXIvYW5ndWxhclxuZXhwb3J0IGVudW0gUmVuZGVyZXJTdHlsZUZsYWdzMyB7XG4gIEltcG9ydGFudCA9IDEgPDwgMCxcbiAgRGFzaENhc2UgPSAxIDw8IDFcbn1cblxuZXhwb3J0IHR5cGUgUmVuZGVyZXIzID0gT2JqZWN0T3JpZW50ZWRSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzO1xuXG5leHBvcnQgdHlwZSBHbG9iYWxUYXJnZXROYW1lID0gJ2RvY3VtZW50JyB8ICd3aW5kb3cnIHwgJ2JvZHknO1xuXG5leHBvcnQgdHlwZSBHbG9iYWxUYXJnZXRSZXNvbHZlciA9IChlbGVtZW50OiBhbnkpID0+IHtcbiAgbmFtZTogR2xvYmFsVGFyZ2V0TmFtZSwgdGFyZ2V0OiBFdmVudFRhcmdldFxufTtcblxuLyoqXG4gKiBPYmplY3QgT3JpZW50ZWQgc3R5bGUgb2YgQVBJIG5lZWRlZCB0byBjcmVhdGUgZWxlbWVudHMgYW5kIHRleHQgbm9kZXMuXG4gKlxuICogVGhpcyBpcyB0aGUgbmF0aXZlIGJyb3dzZXIgQVBJIHN0eWxlLCBlLmcuIG9wZXJhdGlvbnMgYXJlIG1ldGhvZHMgb24gaW5kaXZpZHVhbCBvYmplY3RzXG4gKiBsaWtlIEhUTUxFbGVtZW50LiBXaXRoIHRoaXMgc3R5bGUsIG5vIGFkZGl0aW9uYWwgY29kZSBpcyBuZWVkZWQgYXMgYSBmYWNhZGVcbiAqIChyZWR1Y2luZyBwYXlsb2FkIHNpemUpLlxuICogKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2JqZWN0T3JpZW50ZWRSZW5kZXJlcjMge1xuICBjcmVhdGVDb21tZW50KGRhdGE6IHN0cmluZyk6IFJDb21tZW50O1xuICBjcmVhdGVFbGVtZW50KHRhZ05hbWU6IHN0cmluZyk6IFJFbGVtZW50O1xuICBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlOiBzdHJpbmcsIHRhZ05hbWU6IHN0cmluZyk6IFJFbGVtZW50O1xuICBjcmVhdGVUZXh0Tm9kZShkYXRhOiBzdHJpbmcpOiBSVGV4dDtcblxuICBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yczogc3RyaW5nKTogUkVsZW1lbnR8bnVsbDtcbn1cblxuLyoqIFJldHVybnMgd2hldGhlciB0aGUgYHJlbmRlcmVyYCBpcyBhIGBQcm9jZWR1cmFsUmVuZGVyZXIzYCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyOiBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgT2JqZWN0T3JpZW50ZWRSZW5kZXJlcjMpOlxuICAgIHJlbmRlcmVyIGlzIFByb2NlZHVyYWxSZW5kZXJlcjMge1xuICByZXR1cm4gISEoKHJlbmRlcmVyIGFzIGFueSkubGlzdGVuKTtcbn1cblxuLyoqXG4gKiBQcm9jZWR1cmFsIHN0eWxlIG9mIEFQSSBuZWVkZWQgdG8gY3JlYXRlIGVsZW1lbnRzIGFuZCB0ZXh0IG5vZGVzLlxuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZVxuICogZmFjYWRlIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gKiB3aXRoIFJlbmRlcmVyMi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm9jZWR1cmFsUmVuZGVyZXIzIHtcbiAgZGVzdHJveSgpOiB2b2lkO1xuICBjcmVhdGVDb21tZW50KHZhbHVlOiBzdHJpbmcpOiBSQ29tbWVudDtcbiAgY3JlYXRlRWxlbWVudChuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZ3xudWxsKTogUkVsZW1lbnQ7XG4gIGNyZWF0ZVRleHQodmFsdWU6IHN0cmluZyk6IFJUZXh0O1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBhbGxvd2VkIHRvIGJlIG51bGwgLyB1bmRlZmluZWQsXG4gICAqIGluIHdoaWNoIGNhc2UgdGhlIHZpZXcgZW5naW5lIHdvbid0IGNhbGwgaXQuXG4gICAqIFRoaXMgaXMgdXNlZCBhcyBhIHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbiBmb3IgcHJvZHVjdGlvbiBtb2RlLlxuICAgKi9cbiAgZGVzdHJveU5vZGU/OiAoKG5vZGU6IFJOb2RlKSA9PiB2b2lkKXxudWxsO1xuICBhcHBlbmRDaGlsZChwYXJlbnQ6IFJFbGVtZW50LCBuZXdDaGlsZDogUk5vZGUpOiB2b2lkO1xuICBpbnNlcnRCZWZvcmUocGFyZW50OiBSTm9kZSwgbmV3Q2hpbGQ6IFJOb2RlLCByZWZDaGlsZDogUk5vZGV8bnVsbCk6IHZvaWQ7XG4gIHJlbW92ZUNoaWxkKHBhcmVudDogUkVsZW1lbnQsIG9sZENoaWxkOiBSTm9kZSk6IHZvaWQ7XG4gIHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55KTogUkVsZW1lbnQ7XG5cbiAgcGFyZW50Tm9kZShub2RlOiBSTm9kZSk6IFJFbGVtZW50fG51bGw7XG4gIG5leHRTaWJsaW5nKG5vZGU6IFJOb2RlKTogUk5vZGV8bnVsbDtcblxuICBzZXRBdHRyaWJ1dGUoZWw6IFJFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZ3xudWxsKTogdm9pZDtcbiAgcmVtb3ZlQXR0cmlidXRlKGVsOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmd8bnVsbCk6IHZvaWQ7XG4gIGFkZENsYXNzKGVsOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nKTogdm9pZDtcbiAgcmVtb3ZlQ2xhc3MoZWw6IFJFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICBzZXRTdHlsZShcbiAgICAgIGVsOiBSRWxlbWVudCwgc3R5bGU6IHN0cmluZywgdmFsdWU6IGFueSxcbiAgICAgIGZsYWdzPzogUmVuZGVyZXJTdHlsZUZsYWdzMnxSZW5kZXJlclN0eWxlRmxhZ3MzKTogdm9pZDtcbiAgcmVtb3ZlU3R5bGUoZWw6IFJFbGVtZW50LCBzdHlsZTogc3RyaW5nLCBmbGFncz86IFJlbmRlcmVyU3R5bGVGbGFnczJ8UmVuZGVyZXJTdHlsZUZsYWdzMyk6IHZvaWQ7XG4gIHNldFByb3BlcnR5KGVsOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZDtcbiAgc2V0VmFsdWUobm9kZTogUlRleHR8UkNvbW1lbnQsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuXG4gIC8vIFRPRE8obWlza28pOiBEZXByZWNhdGUgaW4gZmF2b3Igb2YgYWRkRXZlbnRMaXN0ZW5lci9yZW1vdmVFdmVudExpc3RlbmVyXG4gIGxpc3RlbihcbiAgICAgIHRhcmdldDogR2xvYmFsVGFyZ2V0TmFtZXxSTm9kZSwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGJvb2xlYW4gfCB2b2lkKTogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJlckZhY3RvcnkzIHtcbiAgY3JlYXRlUmVuZGVyZXIoaG9zdEVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIHJlbmRlcmVyVHlwZTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIzO1xuICBiZWdpbj8oKTogdm9pZDtcbiAgZW5kPygpOiB2b2lkO1xufVxuXG5leHBvcnQgY29uc3QgZG9tUmVuZGVyZXJGYWN0b3J5MzogUmVuZGVyZXJGYWN0b3J5MyA9IHtcbiAgY3JlYXRlUmVuZGVyZXI6IChob3N0RWxlbWVudDogUkVsZW1lbnQgfCBudWxsLCByZW5kZXJlclR5cGU6IFJlbmRlcmVyVHlwZTIgfCBudWxsKTpcbiAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJlcjMgPT4geyByZXR1cm4gZG9jdW1lbnQ7fVxufTtcblxuLyoqIFN1YnNldCBvZiBBUEkgbmVlZGVkIGZvciBhcHBlbmRpbmcgZWxlbWVudHMgYW5kIHRleHQgbm9kZXMuICovXG5leHBvcnQgaW50ZXJmYWNlIFJOb2RlIHtcbiAgcGFyZW50Tm9kZTogUk5vZGV8bnVsbDtcblxuICBuZXh0U2libGluZzogUk5vZGV8bnVsbDtcblxuICByZW1vdmVDaGlsZChvbGRDaGlsZDogUk5vZGUpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJbnNlcnQgYSBjaGlsZCBub2RlLlxuICAgKlxuICAgKiBVc2VkIGV4Y2x1c2l2ZWx5IGZvciBhZGRpbmcgVmlldyByb290IG5vZGVzIGludG8gVmlld0FuY2hvciBsb2NhdGlvbi5cbiAgICovXG4gIGluc2VydEJlZm9yZShuZXdDaGlsZDogUk5vZGUsIHJlZkNoaWxkOiBSTm9kZXxudWxsLCBpc1ZpZXdSb290OiBib29sZWFuKTogdm9pZDtcblxuICAvKipcbiAgICogQXBwZW5kIGEgY2hpbGQgbm9kZS5cbiAgICpcbiAgICogVXNlZCBleGNsdXNpdmVseSBmb3IgYnVpbGRpbmcgdXAgRE9NIHdoaWNoIGFyZSBzdGF0aWMgKGllIG5vdCBWaWV3IHJvb3RzKVxuICAgKi9cbiAgYXBwZW5kQ2hpbGQobmV3Q2hpbGQ6IFJOb2RlKTogUk5vZGU7XG59XG5cbi8qKlxuICogU3Vic2V0IG9mIEFQSSBuZWVkZWQgZm9yIHdyaXRpbmcgYXR0cmlidXRlcywgcHJvcGVydGllcywgYW5kIHNldHRpbmcgdXBcbiAqIGxpc3RlbmVycyBvbiBFbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJFbGVtZW50IGV4dGVuZHMgUk5vZGUge1xuICBzdHlsZTogUkNzc1N0eWxlRGVjbGFyYXRpb247XG4gIGNsYXNzTGlzdDogUkRvbVRva2VuTGlzdDtcbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIHNldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICByZW1vdmVBdHRyaWJ1dGUobmFtZTogc3RyaW5nKTogdm9pZDtcbiAgc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJOiBzdHJpbmcsIHF1YWxpZmllZE5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIGFkZEV2ZW50TGlzdGVuZXIodHlwZTogc3RyaW5nLCBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lciwgdXNlQ2FwdHVyZT86IGJvb2xlYW4pOiB2b2lkO1xuICByZW1vdmVFdmVudExpc3RlbmVyKHR5cGU6IHN0cmluZywgbGlzdGVuZXI/OiBFdmVudExpc3RlbmVyLCBvcHRpb25zPzogYm9vbGVhbik6IHZvaWQ7XG5cbiAgc2V0UHJvcGVydHk/KG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUkNzc1N0eWxlRGVjbGFyYXRpb24ge1xuICByZW1vdmVQcm9wZXJ0eShwcm9wZXJ0eU5hbWU6IHN0cmluZyk6IHN0cmluZztcbiAgc2V0UHJvcGVydHkocHJvcGVydHlOYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8bnVsbCwgcHJpb3JpdHk/OiBzdHJpbmcpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJEb21Ub2tlbkxpc3Qge1xuICBhZGQodG9rZW46IHN0cmluZyk6IHZvaWQ7XG4gIHJlbW92ZSh0b2tlbjogc3RyaW5nKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSVGV4dCBleHRlbmRzIFJOb2RlIHsgdGV4dENvbnRlbnQ6IHN0cmluZ3xudWxsOyB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgUkNvbW1lbnQgZXh0ZW5kcyBSTm9kZSB7IHRleHRDb250ZW50OiBzdHJpbmd8bnVsbDsgfVxuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19