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
/** @enum {number} */
var RendererStyleFlags3 = {
    Important: 1,
    DashCase: 2,
};
export { RendererStyleFlags3 };
RendererStyleFlags3[RendererStyleFlags3.Important] = 'Important';
RendererStyleFlags3[RendererStyleFlags3.DashCase] = 'DashCase';
/** @typedef {?} */
var Renderer3;
export { Renderer3 };
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
/** @type {?} */
ObjectOrientedRenderer3.prototype.createComment;
/** @type {?} */
ObjectOrientedRenderer3.prototype.createElement;
/** @type {?} */
ObjectOrientedRenderer3.prototype.createElementNS;
/** @type {?} */
ObjectOrientedRenderer3.prototype.createTextNode;
/** @type {?} */
ObjectOrientedRenderer3.prototype.querySelector;
/**
 * Returns whether the `renderer` is a `ProceduralRenderer3`
 * @param {?} renderer
 * @return {?}
 */
export function isProceduralRenderer(renderer) {
    return !!((/** @type {?} */ (renderer)).listen);
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
/** @type {?} */
ProceduralRenderer3.prototype.destroy;
/** @type {?} */
ProceduralRenderer3.prototype.createComment;
/** @type {?} */
ProceduralRenderer3.prototype.createElement;
/** @type {?} */
ProceduralRenderer3.prototype.createText;
/**
 * This property is allowed to be null / undefined,
 * in which case the view engine won't call it.
 * This is used as a performance optimization for production mode.
 * @type {?|undefined}
 */
ProceduralRenderer3.prototype.destroyNode;
/** @type {?} */
ProceduralRenderer3.prototype.appendChild;
/** @type {?} */
ProceduralRenderer3.prototype.insertBefore;
/** @type {?} */
ProceduralRenderer3.prototype.removeChild;
/** @type {?} */
ProceduralRenderer3.prototype.selectRootElement;
/** @type {?} */
ProceduralRenderer3.prototype.parentNode;
/** @type {?} */
ProceduralRenderer3.prototype.nextSibling;
/** @type {?} */
ProceduralRenderer3.prototype.setAttribute;
/** @type {?} */
ProceduralRenderer3.prototype.removeAttribute;
/** @type {?} */
ProceduralRenderer3.prototype.addClass;
/** @type {?} */
ProceduralRenderer3.prototype.removeClass;
/** @type {?} */
ProceduralRenderer3.prototype.setStyle;
/** @type {?} */
ProceduralRenderer3.prototype.removeStyle;
/** @type {?} */
ProceduralRenderer3.prototype.setProperty;
/** @type {?} */
ProceduralRenderer3.prototype.setValue;
/** @type {?} */
ProceduralRenderer3.prototype.listen;
/**
 * @record
 */
export function RendererFactory3() { }
/** @type {?} */
RendererFactory3.prototype.createRenderer;
/** @type {?|undefined} */
RendererFactory3.prototype.begin;
/** @type {?|undefined} */
RendererFactory3.prototype.end;
/** @type {?} */
export const domRendererFactory3 = {
    createRenderer: (hostElement, rendererType) => { return document; }
};
/**
 * Subset of API needed for appending elements and text nodes.
 * @record
 */
export function RNode() { }
/** @type {?} */
RNode.prototype.parentNode;
/** @type {?} */
RNode.prototype.nextSibling;
/** @type {?} */
RNode.prototype.removeChild;
/**
 * Insert a child node.
 *
 * Used exclusively for adding View root nodes into ViewAnchor location.
 * @type {?}
 */
RNode.prototype.insertBefore;
/**
 * Append a child node.
 *
 * Used exclusively for building up DOM which are static (ie not View roots)
 * @type {?}
 */
RNode.prototype.appendChild;
/**
 * Subset of API needed for writing attributes, properties, and setting up
 * listeners on Element.
 * @record
 */
export function RElement() { }
/** @type {?} */
RElement.prototype.style;
/** @type {?} */
RElement.prototype.classList;
/** @type {?} */
RElement.prototype.className;
/** @type {?} */
RElement.prototype.setAttribute;
/** @type {?} */
RElement.prototype.removeAttribute;
/** @type {?} */
RElement.prototype.setAttributeNS;
/** @type {?} */
RElement.prototype.addEventListener;
/** @type {?} */
RElement.prototype.removeEventListener;
/** @type {?|undefined} */
RElement.prototype.setProperty;
/**
 * @record
 */
export function RCssStyleDeclaration() { }
/** @type {?} */
RCssStyleDeclaration.prototype.removeProperty;
/** @type {?} */
RCssStyleDeclaration.prototype.setProperty;
/**
 * @record
 */
export function RDomTokenList() { }
/** @type {?} */
RDomTokenList.prototype.add;
/** @type {?} */
RDomTokenList.prototype.remove;
/**
 * @record
 */
export function RText() { }
/** @type {?} */
RText.prototype.textContent;
/**
 * @record
 */
export function RComment() { }
/** @type {?} */
RComment.prototype.textContent;
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQXNCRSxZQUFrQjtJQUNsQixXQUFpQjs7O3dDQURqQixTQUFTO3dDQUNULFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JWLE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxRQUF1RDtJQUUxRixPQUFPLENBQUMsQ0FBQyxDQUFDLG1CQUFDLFFBQWUsRUFBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQ3JDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpREQsYUFBYSxtQkFBbUIsR0FBcUI7SUFDbkQsY0FBYyxFQUFFLENBQUMsV0FBNEIsRUFBRSxZQUFrQyxFQUNuRCxFQUFFLEdBQUcsT0FBTyxRQUFRLENBQUMsRUFBQztDQUNyRCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMERGLGFBQWEsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRoZSBnb2FsIGhlcmUgaXMgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJyb3dzZXIgRE9NIEFQSSBpcyB0aGUgUmVuZGVyZXIuXG4gKiBXZSBkbyB0aGlzIGJ5IGRlZmluaW5nIGEgc3Vic2V0IG9mIERPTSBBUEkgdG8gYmUgdGhlIHJlbmRlcmVyIGFuZCB0aGFuXG4gKiB1c2UgdGhhdCB0aW1lIGZvciByZW5kZXJpbmcuXG4gKlxuICogQXQgcnVudGltZSB3ZSBjYW4gdGhhbiB1c2UgdGhlIERPTSBhcGkgZGlyZWN0bHksIGluIHNlcnZlciBvciB3ZWItd29ya2VyXG4gKiBpdCB3aWxsIGJlIGVhc3kgdG8gaW1wbGVtZW50IHN1Y2ggQVBJLlxuICovXG5cbmltcG9ydCB7UmVuZGVyZXJTdHlsZUZsYWdzMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vLi4vcmVuZGVyL2FwaSc7XG5cblxuLy8gVE9ETzogY2xlYW51cCBvbmNlIHRoZSBjb2RlIGlzIG1lcmdlZCBpbiBhbmd1bGFyL2FuZ3VsYXJcbmV4cG9ydCBlbnVtIFJlbmRlcmVyU3R5bGVGbGFnczMge1xuICBJbXBvcnRhbnQgPSAxIDw8IDAsXG4gIERhc2hDYXNlID0gMSA8PCAxXG59XG5cbmV4cG9ydCB0eXBlIFJlbmRlcmVyMyA9IE9iamVjdE9yaWVudGVkUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMztcblxuLyoqXG4gKiBPYmplY3QgT3JpZW50ZWQgc3R5bGUgb2YgQVBJIG5lZWRlZCB0byBjcmVhdGUgZWxlbWVudHMgYW5kIHRleHQgbm9kZXMuXG4gKlxuICogVGhpcyBpcyB0aGUgbmF0aXZlIGJyb3dzZXIgQVBJIHN0eWxlLCBlLmcuIG9wZXJhdGlvbnMgYXJlIG1ldGhvZHMgb24gaW5kaXZpZHVhbCBvYmplY3RzXG4gKiBsaWtlIEhUTUxFbGVtZW50LiBXaXRoIHRoaXMgc3R5bGUsIG5vIGFkZGl0aW9uYWwgY29kZSBpcyBuZWVkZWQgYXMgYSBmYWNhZGVcbiAqIChyZWR1Y2luZyBwYXlsb2FkIHNpemUpLlxuICogKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2JqZWN0T3JpZW50ZWRSZW5kZXJlcjMge1xuICBjcmVhdGVDb21tZW50KGRhdGE6IHN0cmluZyk6IFJDb21tZW50O1xuICBjcmVhdGVFbGVtZW50KHRhZ05hbWU6IHN0cmluZyk6IFJFbGVtZW50O1xuICBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlOiBzdHJpbmcsIHRhZ05hbWU6IHN0cmluZyk6IFJFbGVtZW50O1xuICBjcmVhdGVUZXh0Tm9kZShkYXRhOiBzdHJpbmcpOiBSVGV4dDtcblxuICBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yczogc3RyaW5nKTogUkVsZW1lbnR8bnVsbDtcbn1cblxuLyoqIFJldHVybnMgd2hldGhlciB0aGUgYHJlbmRlcmVyYCBpcyBhIGBQcm9jZWR1cmFsUmVuZGVyZXIzYCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyOiBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgT2JqZWN0T3JpZW50ZWRSZW5kZXJlcjMpOlxuICAgIHJlbmRlcmVyIGlzIFByb2NlZHVyYWxSZW5kZXJlcjMge1xuICByZXR1cm4gISEoKHJlbmRlcmVyIGFzIGFueSkubGlzdGVuKTtcbn1cblxuLyoqXG4gKiBQcm9jZWR1cmFsIHN0eWxlIG9mIEFQSSBuZWVkZWQgdG8gY3JlYXRlIGVsZW1lbnRzIGFuZCB0ZXh0IG5vZGVzLlxuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZVxuICogZmFjYWRlIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gKiB3aXRoIFJlbmRlcmVyMi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm9jZWR1cmFsUmVuZGVyZXIzIHtcbiAgZGVzdHJveSgpOiB2b2lkO1xuICBjcmVhdGVDb21tZW50KHZhbHVlOiBzdHJpbmcpOiBSQ29tbWVudDtcbiAgY3JlYXRlRWxlbWVudChuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZ3xudWxsKTogUkVsZW1lbnQ7XG4gIGNyZWF0ZVRleHQodmFsdWU6IHN0cmluZyk6IFJUZXh0O1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBhbGxvd2VkIHRvIGJlIG51bGwgLyB1bmRlZmluZWQsXG4gICAqIGluIHdoaWNoIGNhc2UgdGhlIHZpZXcgZW5naW5lIHdvbid0IGNhbGwgaXQuXG4gICAqIFRoaXMgaXMgdXNlZCBhcyBhIHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbiBmb3IgcHJvZHVjdGlvbiBtb2RlLlxuICAgKi9cbiAgZGVzdHJveU5vZGU/OiAoKG5vZGU6IFJOb2RlKSA9PiB2b2lkKXxudWxsO1xuICBhcHBlbmRDaGlsZChwYXJlbnQ6IFJFbGVtZW50LCBuZXdDaGlsZDogUk5vZGUpOiB2b2lkO1xuICBpbnNlcnRCZWZvcmUocGFyZW50OiBSTm9kZSwgbmV3Q2hpbGQ6IFJOb2RlLCByZWZDaGlsZDogUk5vZGV8bnVsbCk6IHZvaWQ7XG4gIHJlbW92ZUNoaWxkKHBhcmVudDogUkVsZW1lbnQsIG9sZENoaWxkOiBSTm9kZSk6IHZvaWQ7XG4gIHNlbGVjdFJvb3RFbGVtZW50KHNlbGVjdG9yT3JOb2RlOiBzdHJpbmd8YW55KTogUkVsZW1lbnQ7XG5cbiAgcGFyZW50Tm9kZShub2RlOiBSTm9kZSk6IFJFbGVtZW50fG51bGw7XG4gIG5leHRTaWJsaW5nKG5vZGU6IFJOb2RlKTogUk5vZGV8bnVsbDtcblxuICBzZXRBdHRyaWJ1dGUoZWw6IFJFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZ3xudWxsKTogdm9pZDtcbiAgcmVtb3ZlQXR0cmlidXRlKGVsOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmd8bnVsbCk6IHZvaWQ7XG4gIGFkZENsYXNzKGVsOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nKTogdm9pZDtcbiAgcmVtb3ZlQ2xhc3MoZWw6IFJFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICBzZXRTdHlsZShcbiAgICAgIGVsOiBSRWxlbWVudCwgc3R5bGU6IHN0cmluZywgdmFsdWU6IGFueSxcbiAgICAgIGZsYWdzPzogUmVuZGVyZXJTdHlsZUZsYWdzMnxSZW5kZXJlclN0eWxlRmxhZ3MzKTogdm9pZDtcbiAgcmVtb3ZlU3R5bGUoZWw6IFJFbGVtZW50LCBzdHlsZTogc3RyaW5nLCBmbGFncz86IFJlbmRlcmVyU3R5bGVGbGFnczJ8UmVuZGVyZXJTdHlsZUZsYWdzMyk6IHZvaWQ7XG4gIHNldFByb3BlcnR5KGVsOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZDtcbiAgc2V0VmFsdWUobm9kZTogUlRleHR8UkNvbW1lbnQsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuXG4gIC8vIFRPRE8obWlza28pOiBEZXByZWNhdGUgaW4gZmF2b3Igb2YgYWRkRXZlbnRMaXN0ZW5lci9yZW1vdmVFdmVudExpc3RlbmVyXG4gIGxpc3Rlbih0YXJnZXQ6IFJOb2RlLCBldmVudE5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogYW55KSA9PiBib29sZWFuIHwgdm9pZCk6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyZXJGYWN0b3J5MyB7XG4gIGNyZWF0ZVJlbmRlcmVyKGhvc3RFbGVtZW50OiBSRWxlbWVudHxudWxsLCByZW5kZXJlclR5cGU6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMztcbiAgYmVnaW4/KCk6IHZvaWQ7XG4gIGVuZD8oKTogdm9pZDtcbn1cblxuZXhwb3J0IGNvbnN0IGRvbVJlbmRlcmVyRmFjdG9yeTM6IFJlbmRlcmVyRmFjdG9yeTMgPSB7XG4gIGNyZWF0ZVJlbmRlcmVyOiAoaG9zdEVsZW1lbnQ6IFJFbGVtZW50IHwgbnVsbCwgcmVuZGVyZXJUeXBlOiBSZW5kZXJlclR5cGUyIHwgbnVsbCk6XG4gICAgICAgICAgICAgICAgICAgICAgUmVuZGVyZXIzID0+IHsgcmV0dXJuIGRvY3VtZW50O31cbn07XG5cbi8qKiBTdWJzZXQgb2YgQVBJIG5lZWRlZCBmb3IgYXBwZW5kaW5nIGVsZW1lbnRzIGFuZCB0ZXh0IG5vZGVzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBSTm9kZSB7XG4gIHBhcmVudE5vZGU6IFJOb2RlfG51bGw7XG5cbiAgbmV4dFNpYmxpbmc6IFJOb2RlfG51bGw7XG5cbiAgcmVtb3ZlQ2hpbGQob2xkQ2hpbGQ6IFJOb2RlKTogdm9pZDtcblxuICAvKipcbiAgICogSW5zZXJ0IGEgY2hpbGQgbm9kZS5cbiAgICpcbiAgICogVXNlZCBleGNsdXNpdmVseSBmb3IgYWRkaW5nIFZpZXcgcm9vdCBub2RlcyBpbnRvIFZpZXdBbmNob3IgbG9jYXRpb24uXG4gICAqL1xuICBpbnNlcnRCZWZvcmUobmV3Q2hpbGQ6IFJOb2RlLCByZWZDaGlsZDogUk5vZGV8bnVsbCwgaXNWaWV3Um9vdDogYm9vbGVhbik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEFwcGVuZCBhIGNoaWxkIG5vZGUuXG4gICAqXG4gICAqIFVzZWQgZXhjbHVzaXZlbHkgZm9yIGJ1aWxkaW5nIHVwIERPTSB3aGljaCBhcmUgc3RhdGljIChpZSBub3QgVmlldyByb290cylcbiAgICovXG4gIGFwcGVuZENoaWxkKG5ld0NoaWxkOiBSTm9kZSk6IFJOb2RlO1xufVxuXG4vKipcbiAqIFN1YnNldCBvZiBBUEkgbmVlZGVkIGZvciB3cml0aW5nIGF0dHJpYnV0ZXMsIHByb3BlcnRpZXMsIGFuZCBzZXR0aW5nIHVwXG4gKiBsaXN0ZW5lcnMgb24gRWxlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSRWxlbWVudCBleHRlbmRzIFJOb2RlIHtcbiAgc3R5bGU6IFJDc3NTdHlsZURlY2xhcmF0aW9uO1xuICBjbGFzc0xpc3Q6IFJEb21Ub2tlbkxpc3Q7XG4gIGNsYXNzTmFtZTogc3RyaW5nO1xuICBzZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbiAgcmVtb3ZlQXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIHNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSTogc3RyaW5nLCBxdWFsaWZpZWROYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICBhZGRFdmVudExpc3RlbmVyKHR5cGU6IHN0cmluZywgbGlzdGVuZXI6IEV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmU/OiBib29sZWFuKTogdm9pZDtcbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlOiBzdHJpbmcsIGxpc3RlbmVyPzogRXZlbnRMaXN0ZW5lciwgb3B0aW9ucz86IGJvb2xlYW4pOiB2b2lkO1xuXG4gIHNldFByb3BlcnR5PyhuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJDc3NTdHlsZURlY2xhcmF0aW9uIHtcbiAgcmVtb3ZlUHJvcGVydHkocHJvcGVydHlOYW1lOiBzdHJpbmcpOiBzdHJpbmc7XG4gIHNldFByb3BlcnR5KHByb3BlcnR5TmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bGwsIHByaW9yaXR5Pzogc3RyaW5nKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSRG9tVG9rZW5MaXN0IHtcbiAgYWRkKHRva2VuOiBzdHJpbmcpOiB2b2lkO1xuICByZW1vdmUodG9rZW46IHN0cmluZyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUlRleHQgZXh0ZW5kcyBSTm9kZSB7IHRleHRDb250ZW50OiBzdHJpbmd8bnVsbDsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIFJDb21tZW50IGV4dGVuZHMgUk5vZGUgeyB0ZXh0Q29udGVudDogc3RyaW5nfG51bGw7IH1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==