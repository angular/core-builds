/**
 * @fileoverview added by tsickle
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
 * Most of the use of `document` in Angular is from within the DI system so it is possible to simply
 * inject the `DOCUMENT` token and are done.
 *
 * Ivy is special because it does not rely upon the DI and must get hold of the document some other
 * way.
 *
 * The solution is to define `getDocument()` and `setDocument()` top-level functions for ivy.
 * Wherever ivy needs the global document, it calls `getDocument()` instead.
 *
 * When running ivy outside of a browser environment, it is necessary to call `setDocument()` to
 * tell ivy what the global `document` is.
 *
 * Angular does this for us in each of the standard platforms (`Browser`, `Server`, and `WebWorker`)
 * by calling `setDocument()` when providing the `DOCUMENT` token.
 * @type {?}
 */
let DOCUMENT = undefined;
/**
 * Tell ivy what the `document` is for this platform.
 *
 * It is only necessary to call this if the current platform is not a browser.
 *
 * @param {?} document The object representing the global `document` in this environment.
 * @return {?}
 */
export function setDocument(document) {
    DOCUMENT = document;
}
/**
 * Access the object that represents the `document` for this platform.
 *
 * Ivy calls this whenever it needs to access the `document` object.
 * For example to create the renderer or to do sanitization.
 * @return {?}
 */
export function getDocument() {
    if (DOCUMENT !== undefined) {
        return DOCUMENT;
    }
    else if (typeof document !== 'undefined') {
        return document;
    }
    // No "document" can be found. This should only happen if we are running ivy outside Angular and
    // the current platform is not a browser. Since this is not a supported scenario at the moment
    // this should not happen in Angular apps.
    // Once we support running ivy outside of Angular we will need to publish `setDocument()` as a
    // public API. Meanwhile we just return `undefined` and let the application fail.
    return (/** @type {?} */ (undefined));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvZG9jdW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXdCSSxRQUFRLEdBQXVCLFNBQVM7Ozs7Ozs7OztBQVM1QyxNQUFNLFVBQVUsV0FBVyxDQUFDLFFBQThCO0lBQ3hELFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDdEIsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsV0FBVztJQUN6QixJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7UUFDMUIsT0FBTyxRQUFRLENBQUM7S0FDakI7U0FBTSxJQUFJLE9BQU8sUUFBUSxLQUFLLFdBQVcsRUFBRTtRQUMxQyxPQUFPLFFBQVEsQ0FBQztLQUNqQjtJQUNELGdHQUFnRztJQUNoRyw4RkFBOEY7SUFDOUYsMENBQTBDO0lBQzFDLDhGQUE4RjtJQUM5RixpRkFBaUY7SUFDakYsT0FBTyxtQkFBQSxTQUFTLEVBQUUsQ0FBQztBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIE1vc3Qgb2YgdGhlIHVzZSBvZiBgZG9jdW1lbnRgIGluIEFuZ3VsYXIgaXMgZnJvbSB3aXRoaW4gdGhlIERJIHN5c3RlbSBzbyBpdCBpcyBwb3NzaWJsZSB0byBzaW1wbHlcbiAqIGluamVjdCB0aGUgYERPQ1VNRU5UYCB0b2tlbiBhbmQgYXJlIGRvbmUuXG4gKlxuICogSXZ5IGlzIHNwZWNpYWwgYmVjYXVzZSBpdCBkb2VzIG5vdCByZWx5IHVwb24gdGhlIERJIGFuZCBtdXN0IGdldCBob2xkIG9mIHRoZSBkb2N1bWVudCBzb21lIG90aGVyXG4gKiB3YXkuXG4gKlxuICogVGhlIHNvbHV0aW9uIGlzIHRvIGRlZmluZSBgZ2V0RG9jdW1lbnQoKWAgYW5kIGBzZXREb2N1bWVudCgpYCB0b3AtbGV2ZWwgZnVuY3Rpb25zIGZvciBpdnkuXG4gKiBXaGVyZXZlciBpdnkgbmVlZHMgdGhlIGdsb2JhbCBkb2N1bWVudCwgaXQgY2FsbHMgYGdldERvY3VtZW50KClgIGluc3RlYWQuXG4gKlxuICogV2hlbiBydW5uaW5nIGl2eSBvdXRzaWRlIG9mIGEgYnJvd3NlciBlbnZpcm9ubWVudCwgaXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgYHNldERvY3VtZW50KClgIHRvXG4gKiB0ZWxsIGl2eSB3aGF0IHRoZSBnbG9iYWwgYGRvY3VtZW50YCBpcy5cbiAqXG4gKiBBbmd1bGFyIGRvZXMgdGhpcyBmb3IgdXMgaW4gZWFjaCBvZiB0aGUgc3RhbmRhcmQgcGxhdGZvcm1zIChgQnJvd3NlcmAsIGBTZXJ2ZXJgLCBhbmQgYFdlYldvcmtlcmApXG4gKiBieSBjYWxsaW5nIGBzZXREb2N1bWVudCgpYCB3aGVuIHByb3ZpZGluZyB0aGUgYERPQ1VNRU5UYCB0b2tlbi5cbiAqL1xubGV0IERPQ1VNRU5UOiBEb2N1bWVudHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbi8qKlxuICogVGVsbCBpdnkgd2hhdCB0aGUgYGRvY3VtZW50YCBpcyBmb3IgdGhpcyBwbGF0Zm9ybS5cbiAqXG4gKiBJdCBpcyBvbmx5IG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgaWYgdGhlIGN1cnJlbnQgcGxhdGZvcm0gaXMgbm90IGEgYnJvd3Nlci5cbiAqXG4gKiBAcGFyYW0gZG9jdW1lbnQgVGhlIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGdsb2JhbCBgZG9jdW1lbnRgIGluIHRoaXMgZW52aXJvbm1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXREb2N1bWVudChkb2N1bWVudDogRG9jdW1lbnQgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgRE9DVU1FTlQgPSBkb2N1bWVudDtcbn1cblxuLyoqXG4gKiBBY2Nlc3MgdGhlIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIGBkb2N1bWVudGAgZm9yIHRoaXMgcGxhdGZvcm0uXG4gKlxuICogSXZ5IGNhbGxzIHRoaXMgd2hlbmV2ZXIgaXQgbmVlZHMgdG8gYWNjZXNzIHRoZSBgZG9jdW1lbnRgIG9iamVjdC5cbiAqIEZvciBleGFtcGxlIHRvIGNyZWF0ZSB0aGUgcmVuZGVyZXIgb3IgdG8gZG8gc2FuaXRpemF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RG9jdW1lbnQoKTogRG9jdW1lbnQge1xuICBpZiAoRE9DVU1FTlQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBET0NVTUVOVDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50O1xuICB9XG4gIC8vIE5vIFwiZG9jdW1lbnRcIiBjYW4gYmUgZm91bmQuIFRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGlmIHdlIGFyZSBydW5uaW5nIGl2eSBvdXRzaWRlIEFuZ3VsYXIgYW5kXG4gIC8vIHRoZSBjdXJyZW50IHBsYXRmb3JtIGlzIG5vdCBhIGJyb3dzZXIuIFNpbmNlIHRoaXMgaXMgbm90IGEgc3VwcG9ydGVkIHNjZW5hcmlvIGF0IHRoZSBtb21lbnRcbiAgLy8gdGhpcyBzaG91bGQgbm90IGhhcHBlbiBpbiBBbmd1bGFyIGFwcHMuXG4gIC8vIE9uY2Ugd2Ugc3VwcG9ydCBydW5uaW5nIGl2eSBvdXRzaWRlIG9mIEFuZ3VsYXIgd2Ugd2lsbCBuZWVkIHRvIHB1Ymxpc2ggYHNldERvY3VtZW50KClgIGFzIGFcbiAgLy8gcHVibGljIEFQSS4gTWVhbndoaWxlIHdlIGp1c3QgcmV0dXJuIGB1bmRlZmluZWRgIGFuZCBsZXQgdGhlIGFwcGxpY2F0aW9uIGZhaWwuXG4gIHJldHVybiB1bmRlZmluZWQgITtcbn1cbiJdfQ==