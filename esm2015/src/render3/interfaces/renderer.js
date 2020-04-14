/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/interfaces/renderer.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
 * We do this by defining a subset of DOM API to be the renderer and then
 * use that at runtime for rendering.
 *
 * At runtime we can then use the DOM api directly, in server or web-worker
 * it will be easy to implement such API.
 */
import { getDocument } from './document';
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
     * @param {?=} isHostElement
     * @return {?}
     */
    ProceduralRenderer3.prototype.removeChild = function (parent, oldChild, isHostElement) { };
    /**
     * @param {?} selectorOrNode
     * @param {?=} preserveContent
     * @return {?}
     */
    ProceduralRenderer3.prototype.selectRootElement = function (selectorOrNode, preserveContent) { };
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
    createRenderer: (/**
     * @param {?} hostElement
     * @param {?} rendererType
     * @return {?}
     */
    (hostElement, rendererType) => {
        return getDocument();
    })
};
/**
 * Subset of API needed for appending elements and text nodes.
 * @record
 */
export function RNode() { }
if (false) {
    /**
     * Returns the parent Element, Document, or DocumentFragment
     * @type {?}
     */
    RNode.prototype.parentNode;
    /**
     * Returns the parent Element if there is one
     * @type {?}
     */
    RNode.prototype.parentElement;
    /**
     * Gets the Node immediately following this one in the parent's childNodes
     * @type {?}
     */
    RNode.prototype.nextSibling;
    /**
     * Removes a child from the current node and returns the removed node
     * @param {?} oldChild the child node to remove
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
    /** @type {?} */
    RElement.prototype.textContent;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFlBQVksQ0FBQzs7QUFHdkMsTUFBWSxtQkFBbUI7SUFDN0IsU0FBUyxHQUFTO0lBQ2xCLFFBQVEsR0FBUztFQUNsQjs7Ozs7Ozs7Ozs7OztBQWlCRCw2Q0FPQzs7Ozs7O0lBTkMsc0VBQXNDOzs7OztJQUN0Qyx5RUFBeUM7Ozs7OztJQUN6QyxzRkFBOEQ7Ozs7O0lBQzlELHVFQUFvQzs7Ozs7SUFFcEMsMkVBQWdEOzs7Ozs7O0FBSWxELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxRQUN1QjtJQUMxRCxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsUUFBUSxFQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxDQUFDOzs7Ozs7Ozs7QUFTRCx5Q0FrQ0M7Ozs7Ozs7O0lBeEJDLDBDQUEyQzs7OztJQVQzQyx3REFBZ0I7Ozs7O0lBQ2hCLG1FQUF1Qzs7Ozs7O0lBQ3ZDLDZFQUErRDs7Ozs7SUFDL0QsZ0VBQWlDOzs7Ozs7SUFPakMsNEVBQXFEOzs7Ozs7O0lBQ3JELHVGQUF5RTs7Ozs7OztJQUN6RSwyRkFBOEU7Ozs7OztJQUM5RSxpR0FBbUY7Ozs7O0lBRW5GLCtEQUF1Qzs7Ozs7SUFDdkMsZ0VBQXFDOzs7Ozs7OztJQUVyQyx1RkFBdUY7Ozs7Ozs7SUFDdkYsbUZBQTJFOzs7Ozs7SUFDM0UsaUVBQTJDOzs7Ozs7SUFDM0Msb0VBQThDOzs7Ozs7OztJQUM5QyxnRkFFMkQ7Ozs7Ozs7SUFDM0QsNEVBQWdHOzs7Ozs7O0lBQ2hHLDJFQUEwRDs7Ozs7O0lBQzFELG9FQUFvRDs7Ozs7OztJQUdwRCxrRkFFMEQ7Ozs7O0FBRzVELHNDQUlDOzs7Ozs7O0lBSEMscUZBQXdGOzs7O0lBQ3hGLG1EQUFlOzs7O0lBQ2YsaURBQWE7OztBQUdmLE1BQU0sT0FBTyxtQkFBbUIsR0FBcUI7SUFDbkQsY0FBYzs7Ozs7SUFBRSxDQUFDLFdBQTBCLEVBQUUsWUFBZ0MsRUFBYSxFQUFFO1FBQzFGLE9BQU8sV0FBVyxFQUFFLENBQUM7SUFDdkIsQ0FBQyxDQUFBO0NBQ0Y7Ozs7O0FBR0QsMkJBb0NDOzs7Ozs7SUFoQ0MsMkJBQXVCOzs7OztJQU12Qiw4QkFBNkI7Ozs7O0lBSzdCLDRCQUF3Qjs7Ozs7O0lBTXhCLHNEQUFvQzs7Ozs7Ozs7OztJQU9wQyw2RUFBK0U7Ozs7Ozs7O0lBTy9FLHNEQUFvQzs7Ozs7OztBQU90Qyw4QkFZQzs7O0lBWEMseUJBQTRCOztJQUM1Qiw2QkFBeUI7O0lBQ3pCLDZCQUFrQjs7SUFDbEIsK0JBQXlCOzs7Ozs7SUFDekIsNkRBQWdEOzs7OztJQUNoRCx5REFBb0M7Ozs7Ozs7SUFDcEMsc0ZBQWlGOzs7Ozs7O0lBQ2pGLGdGQUFvRjs7Ozs7OztJQUNwRixnRkFBcUY7Ozs7OztJQUVyRiw0REFBNkM7Ozs7O0FBRy9DLDBDQUdDOzs7Ozs7SUFGQyw0RUFBNkM7Ozs7Ozs7SUFDN0MsMEZBQStFOzs7OztBQUdqRixtQ0FHQzs7Ozs7O0lBRkMsbURBQXlCOzs7OztJQUN6QixzREFBNEI7Ozs7O0FBRzlCLDJCQUVDOzs7SUFEQyw0QkFBeUI7Ozs7O0FBRzNCLDhCQUVDOzs7SUFEQywrQkFBeUI7Ozs7O0FBSzNCLE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRoZSBnb2FsIGhlcmUgaXMgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJyb3dzZXIgRE9NIEFQSSBpcyB0aGUgUmVuZGVyZXIuXG4gKiBXZSBkbyB0aGlzIGJ5IGRlZmluaW5nIGEgc3Vic2V0IG9mIERPTSBBUEkgdG8gYmUgdGhlIHJlbmRlcmVyIGFuZCB0aGVuXG4gKiB1c2UgdGhhdCBhdCBydW50aW1lIGZvciByZW5kZXJpbmcuXG4gKlxuICogQXQgcnVudGltZSB3ZSBjYW4gdGhlbiB1c2UgdGhlIERPTSBhcGkgZGlyZWN0bHksIGluIHNlcnZlciBvciB3ZWItd29ya2VyXG4gKiBpdCB3aWxsIGJlIGVhc3kgdG8gaW1wbGVtZW50IHN1Y2ggQVBJLlxuICovXG5cbmltcG9ydCB7UmVuZGVyZXJTdHlsZUZsYWdzMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuL2RvY3VtZW50JztcblxuLy8gVE9ETzogY2xlYW51cCBvbmNlIHRoZSBjb2RlIGlzIG1lcmdlZCBpbiBhbmd1bGFyL2FuZ3VsYXJcbmV4cG9ydCBlbnVtIFJlbmRlcmVyU3R5bGVGbGFnczMge1xuICBJbXBvcnRhbnQgPSAxIDw8IDAsXG4gIERhc2hDYXNlID0gMSA8PCAxXG59XG5cbmV4cG9ydCB0eXBlIFJlbmRlcmVyMyA9IE9iamVjdE9yaWVudGVkUmVuZGVyZXIzfFByb2NlZHVyYWxSZW5kZXJlcjM7XG5cbmV4cG9ydCB0eXBlIEdsb2JhbFRhcmdldE5hbWUgPSAnZG9jdW1lbnQnfCd3aW5kb3cnfCdib2R5JztcblxuZXhwb3J0IHR5cGUgR2xvYmFsVGFyZ2V0UmVzb2x2ZXIgPSAoZWxlbWVudDogYW55KSA9PiB7XG4gIG5hbWU6IEdsb2JhbFRhcmdldE5hbWUsIHRhcmdldDogRXZlbnRUYXJnZXRcbn07XG5cbi8qKlxuICogT2JqZWN0IE9yaWVudGVkIHN0eWxlIG9mIEFQSSBuZWVkZWQgdG8gY3JlYXRlIGVsZW1lbnRzIGFuZCB0ZXh0IG5vZGVzLlxuICpcbiAqIFRoaXMgaXMgdGhlIG5hdGl2ZSBicm93c2VyIEFQSSBzdHlsZSwgZS5nLiBvcGVyYXRpb25zIGFyZSBtZXRob2RzIG9uIGluZGl2aWR1YWwgb2JqZWN0c1xuICogbGlrZSBIVE1MRWxlbWVudC4gV2l0aCB0aGlzIHN0eWxlLCBubyBhZGRpdGlvbmFsIGNvZGUgaXMgbmVlZGVkIGFzIGEgZmFjYWRlXG4gKiAocmVkdWNpbmcgcGF5bG9hZCBzaXplKS5cbiAqICovXG5leHBvcnQgaW50ZXJmYWNlIE9iamVjdE9yaWVudGVkUmVuZGVyZXIzIHtcbiAgY3JlYXRlQ29tbWVudChkYXRhOiBzdHJpbmcpOiBSQ29tbWVudDtcbiAgY3JlYXRlRWxlbWVudCh0YWdOYW1lOiBzdHJpbmcpOiBSRWxlbWVudDtcbiAgY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZTogc3RyaW5nLCB0YWdOYW1lOiBzdHJpbmcpOiBSRWxlbWVudDtcbiAgY3JlYXRlVGV4dE5vZGUoZGF0YTogc3RyaW5nKTogUlRleHQ7XG5cbiAgcXVlcnlTZWxlY3RvcihzZWxlY3RvcnM6IHN0cmluZyk6IFJFbGVtZW50fG51bGw7XG59XG5cbi8qKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGByZW5kZXJlcmAgaXMgYSBgUHJvY2VkdXJhbFJlbmRlcmVyM2AgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcjogUHJvY2VkdXJhbFJlbmRlcmVyM3xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3RPcmllbnRlZFJlbmRlcmVyMyk6IHJlbmRlcmVyIGlzIFByb2NlZHVyYWxSZW5kZXJlcjMge1xuICByZXR1cm4gISEoKHJlbmRlcmVyIGFzIGFueSkubGlzdGVuKTtcbn1cblxuLyoqXG4gKiBQcm9jZWR1cmFsIHN0eWxlIG9mIEFQSSBuZWVkZWQgdG8gY3JlYXRlIGVsZW1lbnRzIGFuZCB0ZXh0IG5vZGVzLlxuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZVxuICogZmFjYWRlIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gKiB3aXRoIFJlbmRlcmVyMi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm9jZWR1cmFsUmVuZGVyZXIzIHtcbiAgZGVzdHJveSgpOiB2b2lkO1xuICBjcmVhdGVDb21tZW50KHZhbHVlOiBzdHJpbmcpOiBSQ29tbWVudDtcbiAgY3JlYXRlRWxlbWVudChuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZ3xudWxsKTogUkVsZW1lbnQ7XG4gIGNyZWF0ZVRleHQodmFsdWU6IHN0cmluZyk6IFJUZXh0O1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBhbGxvd2VkIHRvIGJlIG51bGwgLyB1bmRlZmluZWQsXG4gICAqIGluIHdoaWNoIGNhc2UgdGhlIHZpZXcgZW5naW5lIHdvbid0IGNhbGwgaXQuXG4gICAqIFRoaXMgaXMgdXNlZCBhcyBhIHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbiBmb3IgcHJvZHVjdGlvbiBtb2RlLlxuICAgKi9cbiAgZGVzdHJveU5vZGU/OiAoKG5vZGU6IFJOb2RlKSA9PiB2b2lkKXxudWxsO1xuICBhcHBlbmRDaGlsZChwYXJlbnQ6IFJFbGVtZW50LCBuZXdDaGlsZDogUk5vZGUpOiB2b2lkO1xuICBpbnNlcnRCZWZvcmUocGFyZW50OiBSTm9kZSwgbmV3Q2hpbGQ6IFJOb2RlLCByZWZDaGlsZDogUk5vZGV8bnVsbCk6IHZvaWQ7XG4gIHJlbW92ZUNoaWxkKHBhcmVudDogUkVsZW1lbnQsIG9sZENoaWxkOiBSTm9kZSwgaXNIb3N0RWxlbWVudD86IGJvb2xlYW4pOiB2b2lkO1xuICBzZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZTogc3RyaW5nfGFueSwgcHJlc2VydmVDb250ZW50PzogYm9vbGVhbik6IFJFbGVtZW50O1xuXG4gIHBhcmVudE5vZGUobm9kZTogUk5vZGUpOiBSRWxlbWVudHxudWxsO1xuICBuZXh0U2libGluZyhub2RlOiBSTm9kZSk6IFJOb2RlfG51bGw7XG5cbiAgc2V0QXR0cmlidXRlKGVsOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmd8bnVsbCk6IHZvaWQ7XG4gIHJlbW92ZUF0dHJpYnV0ZShlbDogUkVsZW1lbnQsIG5hbWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nfG51bGwpOiB2b2lkO1xuICBhZGRDbGFzcyhlbDogUkVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIHJlbW92ZUNsYXNzKGVsOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nKTogdm9pZDtcbiAgc2V0U3R5bGUoXG4gICAgICBlbDogUkVsZW1lbnQsIHN0eWxlOiBzdHJpbmcsIHZhbHVlOiBhbnksXG4gICAgICBmbGFncz86IFJlbmRlcmVyU3R5bGVGbGFnczJ8UmVuZGVyZXJTdHlsZUZsYWdzMyk6IHZvaWQ7XG4gIHJlbW92ZVN0eWxlKGVsOiBSRWxlbWVudCwgc3R5bGU6IHN0cmluZywgZmxhZ3M/OiBSZW5kZXJlclN0eWxlRmxhZ3MyfFJlbmRlcmVyU3R5bGVGbGFnczMpOiB2b2lkO1xuICBzZXRQcm9wZXJ0eShlbDogUkVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQ7XG4gIHNldFZhbHVlKG5vZGU6IFJUZXh0fFJDb21tZW50LCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcblxuICAvLyBUT0RPKG1pc2tvKTogRGVwcmVjYXRlIGluIGZhdm9yIG9mIGFkZEV2ZW50TGlzdGVuZXIvcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICBsaXN0ZW4oXG4gICAgICB0YXJnZXQ6IEdsb2JhbFRhcmdldE5hbWV8Uk5vZGUsIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgICAgY2FsbGJhY2s6IChldmVudDogYW55KSA9PiBib29sZWFuIHwgdm9pZCk6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyZXJGYWN0b3J5MyB7XG4gIGNyZWF0ZVJlbmRlcmVyKGhvc3RFbGVtZW50OiBSRWxlbWVudHxudWxsLCByZW5kZXJlclR5cGU6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMztcbiAgYmVnaW4/KCk6IHZvaWQ7XG4gIGVuZD8oKTogdm9pZDtcbn1cblxuZXhwb3J0IGNvbnN0IGRvbVJlbmRlcmVyRmFjdG9yeTM6IFJlbmRlcmVyRmFjdG9yeTMgPSB7XG4gIGNyZWF0ZVJlbmRlcmVyOiAoaG9zdEVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIHJlbmRlcmVyVHlwZTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIzID0+IHtcbiAgICByZXR1cm4gZ2V0RG9jdW1lbnQoKTtcbiAgfVxufTtcblxuLyoqIFN1YnNldCBvZiBBUEkgbmVlZGVkIGZvciBhcHBlbmRpbmcgZWxlbWVudHMgYW5kIHRleHQgbm9kZXMuICovXG5leHBvcnQgaW50ZXJmYWNlIFJOb2RlIHtcbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBhcmVudCBFbGVtZW50LCBEb2N1bWVudCwgb3IgRG9jdW1lbnRGcmFnbWVudFxuICAgKi9cbiAgcGFyZW50Tm9kZTogUk5vZGV8bnVsbDtcblxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXJlbnQgRWxlbWVudCBpZiB0aGVyZSBpcyBvbmVcbiAgICovXG4gIHBhcmVudEVsZW1lbnQ6IFJFbGVtZW50fG51bGw7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIE5vZGUgaW1tZWRpYXRlbHkgZm9sbG93aW5nIHRoaXMgb25lIGluIHRoZSBwYXJlbnQncyBjaGlsZE5vZGVzXG4gICAqL1xuICBuZXh0U2libGluZzogUk5vZGV8bnVsbDtcblxuICAvKipcbiAgICogUmVtb3ZlcyBhIGNoaWxkIGZyb20gdGhlIGN1cnJlbnQgbm9kZSBhbmQgcmV0dXJucyB0aGUgcmVtb3ZlZCBub2RlXG4gICAqIEBwYXJhbSBvbGRDaGlsZCB0aGUgY2hpbGQgbm9kZSB0byByZW1vdmVcbiAgICovXG4gIHJlbW92ZUNoaWxkKG9sZENoaWxkOiBSTm9kZSk6IFJOb2RlO1xuXG4gIC8qKlxuICAgKiBJbnNlcnQgYSBjaGlsZCBub2RlLlxuICAgKlxuICAgKiBVc2VkIGV4Y2x1c2l2ZWx5IGZvciBhZGRpbmcgVmlldyByb290IG5vZGVzIGludG8gVmlld0FuY2hvciBsb2NhdGlvbi5cbiAgICovXG4gIGluc2VydEJlZm9yZShuZXdDaGlsZDogUk5vZGUsIHJlZkNoaWxkOiBSTm9kZXxudWxsLCBpc1ZpZXdSb290OiBib29sZWFuKTogdm9pZDtcblxuICAvKipcbiAgICogQXBwZW5kIGEgY2hpbGQgbm9kZS5cbiAgICpcbiAgICogVXNlZCBleGNsdXNpdmVseSBmb3IgYnVpbGRpbmcgdXAgRE9NIHdoaWNoIGFyZSBzdGF0aWMgKGllIG5vdCBWaWV3IHJvb3RzKVxuICAgKi9cbiAgYXBwZW5kQ2hpbGQobmV3Q2hpbGQ6IFJOb2RlKTogUk5vZGU7XG59XG5cbi8qKlxuICogU3Vic2V0IG9mIEFQSSBuZWVkZWQgZm9yIHdyaXRpbmcgYXR0cmlidXRlcywgcHJvcGVydGllcywgYW5kIHNldHRpbmcgdXBcbiAqIGxpc3RlbmVycyBvbiBFbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJFbGVtZW50IGV4dGVuZHMgUk5vZGUge1xuICBzdHlsZTogUkNzc1N0eWxlRGVjbGFyYXRpb247XG4gIGNsYXNzTGlzdDogUkRvbVRva2VuTGlzdDtcbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIHRleHRDb250ZW50OiBzdHJpbmd8bnVsbDtcbiAgc2V0QXR0cmlidXRlKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIHJlbW92ZUF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICBzZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkk6IHN0cmluZywgcXVhbGlmaWVkTmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbiAgYWRkRXZlbnRMaXN0ZW5lcih0eXBlOiBzdHJpbmcsIGxpc3RlbmVyOiBFdmVudExpc3RlbmVyLCB1c2VDYXB0dXJlPzogYm9vbGVhbik6IHZvaWQ7XG4gIHJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZTogc3RyaW5nLCBsaXN0ZW5lcj86IEV2ZW50TGlzdGVuZXIsIG9wdGlvbnM/OiBib29sZWFuKTogdm9pZDtcblxuICBzZXRQcm9wZXJ0eT8obmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSQ3NzU3R5bGVEZWNsYXJhdGlvbiB7XG4gIHJlbW92ZVByb3BlcnR5KHByb3BlcnR5TmFtZTogc3RyaW5nKTogc3RyaW5nO1xuICBzZXRQcm9wZXJ0eShwcm9wZXJ0eU5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xudWxsLCBwcmlvcml0eT86IHN0cmluZyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUkRvbVRva2VuTGlzdCB7XG4gIGFkZCh0b2tlbjogc3RyaW5nKTogdm9pZDtcbiAgcmVtb3ZlKHRva2VuOiBzdHJpbmcpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJUZXh0IGV4dGVuZHMgUk5vZGUge1xuICB0ZXh0Q29udGVudDogc3RyaW5nfG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUkNvbW1lbnQgZXh0ZW5kcyBSTm9kZSB7XG4gIHRleHRDb250ZW50OiBzdHJpbmd8bnVsbDtcbn1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==