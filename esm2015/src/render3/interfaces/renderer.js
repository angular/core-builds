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
const RendererStyleFlags3 = {
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
export const unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQXNCRSxZQUFrQjtJQUNsQixXQUFpQjs7O3dDQURqQixTQUFTO3dDQUNULFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JWLE1BQU0sK0JBQStCLFFBQXVEO0lBRTFGLE9BQU8sQ0FBQyxDQUFDLENBQUMsbUJBQUMsUUFBZSxFQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7Q0FDckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOENELGFBQWEsbUJBQW1CLEdBQXFCO0lBQ25ELGNBQWMsRUFBRSxDQUFDLFdBQTRCLEVBQUUsWUFBa0MsRUFDbkQsRUFBRSxHQUFHLE9BQU8sUUFBUSxDQUFDLEVBQUM7Q0FDckQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNERixhQUFhLDZCQUE2QixHQUFHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBUaGUgZ29hbCBoZXJlIGlzIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBicm93c2VyIERPTSBBUEkgaXMgdGhlIFJlbmRlcmVyLlxuICogV2UgZG8gdGhpcyBieSBkZWZpbmluZyBhIHN1YnNldCBvZiBET00gQVBJIHRvIGJlIHRoZSByZW5kZXJlciBhbmQgdGhhblxuICogdXNlIHRoYXQgdGltZSBmb3IgcmVuZGVyaW5nLlxuICpcbiAqIEF0IHJ1bnRpbWUgd2UgY2FuIHRoYW4gdXNlIHRoZSBET00gYXBpIGRpcmVjdGx5LCBpbiBzZXJ2ZXIgb3Igd2ViLXdvcmtlclxuICogaXQgd2lsbCBiZSBlYXN5IHRvIGltcGxlbWVudCBzdWNoIEFQSS5cbiAqL1xuXG5pbXBvcnQge1JlbmRlcmVyU3R5bGVGbGFnczIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uLy4uL3JlbmRlci9hcGknO1xuXG5cbi8vIFRPRE86IGNsZWFudXAgb25jZSB0aGUgY29kZSBpcyBtZXJnZWQgaW4gYW5ndWxhci9hbmd1bGFyXG5leHBvcnQgZW51bSBSZW5kZXJlclN0eWxlRmxhZ3MzIHtcbiAgSW1wb3J0YW50ID0gMSA8PCAwLFxuICBEYXNoQ2FzZSA9IDEgPDwgMVxufVxuXG5leHBvcnQgdHlwZSBSZW5kZXJlcjMgPSBPYmplY3RPcmllbnRlZFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjM7XG5cbi8qKlxuICogT2JqZWN0IE9yaWVudGVkIHN0eWxlIG9mIEFQSSBuZWVkZWQgdG8gY3JlYXRlIGVsZW1lbnRzIGFuZCB0ZXh0IG5vZGVzLlxuICpcbiAqIFRoaXMgaXMgdGhlIG5hdGl2ZSBicm93c2VyIEFQSSBzdHlsZSwgZS5nLiBvcGVyYXRpb25zIGFyZSBtZXRob2RzIG9uIGluZGl2aWR1YWwgb2JqZWN0c1xuICogbGlrZSBIVE1MRWxlbWVudC4gV2l0aCB0aGlzIHN0eWxlLCBubyBhZGRpdGlvbmFsIGNvZGUgaXMgbmVlZGVkIGFzIGEgZmFjYWRlXG4gKiAocmVkdWNpbmcgcGF5bG9hZCBzaXplKS5cbiAqICovXG5leHBvcnQgaW50ZXJmYWNlIE9iamVjdE9yaWVudGVkUmVuZGVyZXIzIHtcbiAgY3JlYXRlQ29tbWVudChkYXRhOiBzdHJpbmcpOiBSQ29tbWVudDtcbiAgY3JlYXRlRWxlbWVudCh0YWdOYW1lOiBzdHJpbmcpOiBSRWxlbWVudDtcbiAgY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZTogc3RyaW5nLCB0YWdOYW1lOiBzdHJpbmcpOiBSRWxlbWVudDtcbiAgY3JlYXRlVGV4dE5vZGUoZGF0YTogc3RyaW5nKTogUlRleHQ7XG5cbiAgcXVlcnlTZWxlY3RvcihzZWxlY3RvcnM6IHN0cmluZyk6IFJFbGVtZW50fG51bGw7XG59XG5cbi8qKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGByZW5kZXJlcmAgaXMgYSBgUHJvY2VkdXJhbFJlbmRlcmVyM2AgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcjogUHJvY2VkdXJhbFJlbmRlcmVyMyB8IE9iamVjdE9yaWVudGVkUmVuZGVyZXIzKTpcbiAgICByZW5kZXJlciBpcyBQcm9jZWR1cmFsUmVuZGVyZXIzIHtcbiAgcmV0dXJuICEhKChyZW5kZXJlciBhcyBhbnkpLmxpc3Rlbik7XG59XG5cbi8qKlxuICogUHJvY2VkdXJhbCBzdHlsZSBvZiBBUEkgbmVlZGVkIHRvIGNyZWF0ZSBlbGVtZW50cyBhbmQgdGV4dCBub2Rlcy5cbiAqXG4gKiBJbiBub24tbmF0aXZlIGJyb3dzZXIgZW52aXJvbm1lbnRzIChlLmcuIHBsYXRmb3JtcyBzdWNoIGFzIHdlYi13b3JrZXJzKSwgdGhpcyBpcyB0aGVcbiAqIGZhY2FkZSB0aGF0IGVuYWJsZXMgZWxlbWVudCBtYW5pcHVsYXRpb24uIFRoaXMgYWxzbyBmYWNpbGl0YXRlcyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICogd2l0aCBSZW5kZXJlcjIuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJvY2VkdXJhbFJlbmRlcmVyMyB7XG4gIGRlc3Ryb3koKTogdm9pZDtcbiAgY3JlYXRlQ29tbWVudCh2YWx1ZTogc3RyaW5nKTogUkNvbW1lbnQ7XG4gIGNyZWF0ZUVsZW1lbnQobmFtZTogc3RyaW5nLCBuYW1lc3BhY2U/OiBzdHJpbmd8bnVsbCk6IFJFbGVtZW50O1xuICBjcmVhdGVUZXh0KHZhbHVlOiBzdHJpbmcpOiBSVGV4dDtcbiAgLyoqXG4gICAqIFRoaXMgcHJvcGVydHkgaXMgYWxsb3dlZCB0byBiZSBudWxsIC8gdW5kZWZpbmVkLFxuICAgKiBpbiB3aGljaCBjYXNlIHRoZSB2aWV3IGVuZ2luZSB3b24ndCBjYWxsIGl0LlxuICAgKiBUaGlzIGlzIHVzZWQgYXMgYSBwZXJmb3JtYW5jZSBvcHRpbWl6YXRpb24gZm9yIHByb2R1Y3Rpb24gbW9kZS5cbiAgICovXG4gIGRlc3Ryb3lOb2RlPzogKChub2RlOiBSTm9kZSkgPT4gdm9pZCl8bnVsbDtcbiAgYXBwZW5kQ2hpbGQocGFyZW50OiBSRWxlbWVudCwgbmV3Q2hpbGQ6IFJOb2RlKTogdm9pZDtcbiAgaW5zZXJ0QmVmb3JlKHBhcmVudDogUk5vZGUsIG5ld0NoaWxkOiBSTm9kZSwgcmVmQ2hpbGQ6IFJOb2RlfG51bGwpOiB2b2lkO1xuICByZW1vdmVDaGlsZChwYXJlbnQ6IFJFbGVtZW50LCBvbGRDaGlsZDogUk5vZGUpOiB2b2lkO1xuICBzZWxlY3RSb290RWxlbWVudChzZWxlY3Rvck9yTm9kZTogc3RyaW5nfGFueSk6IFJFbGVtZW50O1xuXG4gIHNldEF0dHJpYnV0ZShlbDogUkVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZywgbmFtZXNwYWNlPzogc3RyaW5nfG51bGwpOiB2b2lkO1xuICByZW1vdmVBdHRyaWJ1dGUoZWw6IFJFbGVtZW50LCBuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZT86IHN0cmluZ3xudWxsKTogdm9pZDtcbiAgYWRkQ2xhc3MoZWw6IFJFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICByZW1vdmVDbGFzcyhlbDogUkVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIHNldFN0eWxlKFxuICAgICAgZWw6IFJFbGVtZW50LCBzdHlsZTogc3RyaW5nLCB2YWx1ZTogYW55LFxuICAgICAgZmxhZ3M/OiBSZW5kZXJlclN0eWxlRmxhZ3MyfFJlbmRlcmVyU3R5bGVGbGFnczMpOiB2b2lkO1xuICByZW1vdmVTdHlsZShlbDogUkVsZW1lbnQsIHN0eWxlOiBzdHJpbmcsIGZsYWdzPzogUmVuZGVyZXJTdHlsZUZsYWdzMnxSZW5kZXJlclN0eWxlRmxhZ3MzKTogdm9pZDtcbiAgc2V0UHJvcGVydHkoZWw6IFJFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkO1xuICBzZXRWYWx1ZShub2RlOiBSVGV4dCwgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG5cbiAgLy8gVE9ETyhtaXNrbyk6IERlcHJlY2F0ZSBpbiBmYXZvciBvZiBhZGRFdmVudExpc3RlbmVyL3JlbW92ZUV2ZW50TGlzdGVuZXJcbiAgbGlzdGVuKHRhcmdldDogUk5vZGUsIGV2ZW50TmFtZTogc3RyaW5nLCBjYWxsYmFjazogKGV2ZW50OiBhbnkpID0+IGJvb2xlYW4gfCB2b2lkKTogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZW5kZXJlckZhY3RvcnkzIHtcbiAgY3JlYXRlUmVuZGVyZXIoaG9zdEVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIHJlbmRlcmVyVHlwZTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIzO1xuICBiZWdpbj8oKTogdm9pZDtcbiAgZW5kPygpOiB2b2lkO1xufVxuXG5leHBvcnQgY29uc3QgZG9tUmVuZGVyZXJGYWN0b3J5MzogUmVuZGVyZXJGYWN0b3J5MyA9IHtcbiAgY3JlYXRlUmVuZGVyZXI6IChob3N0RWxlbWVudDogUkVsZW1lbnQgfCBudWxsLCByZW5kZXJlclR5cGU6IFJlbmRlcmVyVHlwZTIgfCBudWxsKTpcbiAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJlcjMgPT4geyByZXR1cm4gZG9jdW1lbnQ7fVxufTtcblxuLyoqIFN1YnNldCBvZiBBUEkgbmVlZGVkIGZvciBhcHBlbmRpbmcgZWxlbWVudHMgYW5kIHRleHQgbm9kZXMuICovXG5leHBvcnQgaW50ZXJmYWNlIFJOb2RlIHtcbiAgcmVtb3ZlQ2hpbGQob2xkQ2hpbGQ6IFJOb2RlKTogdm9pZDtcblxuICAvKipcbiAgICogSW5zZXJ0IGEgY2hpbGQgbm9kZS5cbiAgICpcbiAgICogVXNlZCBleGNsdXNpdmVseSBmb3IgYWRkaW5nIFZpZXcgcm9vdCBub2RlcyBpbnRvIFZpZXdBbmNob3IgbG9jYXRpb24uXG4gICAqL1xuICBpbnNlcnRCZWZvcmUobmV3Q2hpbGQ6IFJOb2RlLCByZWZDaGlsZDogUk5vZGV8bnVsbCwgaXNWaWV3Um9vdDogYm9vbGVhbik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEFwcGVuZCBhIGNoaWxkIG5vZGUuXG4gICAqXG4gICAqIFVzZWQgZXhjbHVzaXZlbHkgZm9yIGJ1aWxkaW5nIHVwIERPTSB3aGljaCBhcmUgc3RhdGljIChpZSBub3QgVmlldyByb290cylcbiAgICovXG4gIGFwcGVuZENoaWxkKG5ld0NoaWxkOiBSTm9kZSk6IFJOb2RlO1xufVxuXG4vKipcbiAqIFN1YnNldCBvZiBBUEkgbmVlZGVkIGZvciB3cml0aW5nIGF0dHJpYnV0ZXMsIHByb3BlcnRpZXMsIGFuZCBzZXR0aW5nIHVwXG4gKiBsaXN0ZW5lcnMgb24gRWxlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSRWxlbWVudCBleHRlbmRzIFJOb2RlIHtcbiAgc3R5bGU6IFJDc3NTdHlsZURlY2xhcmF0aW9uO1xuICBjbGFzc0xpc3Q6IFJEb21Ub2tlbkxpc3Q7XG4gIGNsYXNzTmFtZTogc3RyaW5nO1xuICBzZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbiAgcmVtb3ZlQXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIHNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSTogc3RyaW5nLCBxdWFsaWZpZWROYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICBhZGRFdmVudExpc3RlbmVyKHR5cGU6IHN0cmluZywgbGlzdGVuZXI6IEV2ZW50TGlzdGVuZXIsIHVzZUNhcHR1cmU/OiBib29sZWFuKTogdm9pZDtcbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlOiBzdHJpbmcsIGxpc3RlbmVyPzogRXZlbnRMaXN0ZW5lciwgb3B0aW9ucz86IGJvb2xlYW4pOiB2b2lkO1xuXG4gIHNldFByb3BlcnR5PyhuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJDc3NTdHlsZURlY2xhcmF0aW9uIHtcbiAgcmVtb3ZlUHJvcGVydHkocHJvcGVydHlOYW1lOiBzdHJpbmcpOiBzdHJpbmc7XG4gIHNldFByb3BlcnR5KHByb3BlcnR5TmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bGwsIHByaW9yaXR5Pzogc3RyaW5nKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSRG9tVG9rZW5MaXN0IHtcbiAgYWRkKHRva2VuOiBzdHJpbmcpOiB2b2lkO1xuICByZW1vdmUodG9rZW46IHN0cmluZyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUlRleHQgZXh0ZW5kcyBSTm9kZSB7IHRleHRDb250ZW50OiBzdHJpbmd8bnVsbDsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIFJDb21tZW50IGV4dGVuZHMgUk5vZGUge31cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==