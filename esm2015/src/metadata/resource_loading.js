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
 * Used to resolve resource URLs on `\@Component` when used with JIT compilation.
 *
 * Example:
 * ```
 * \@Component({
 *   selector: 'my-comp',
 *   templateUrl: 'my-comp.html', // This requires asynchronous resolution
 * })
 * class MyComponnent{
 * }
 *
 * // Calling `renderComponent` will fail because `MyComponent`'s `\@Compenent.templateUrl`
 * // needs to be resolved because `renderComponent` is synchronous process.
 * // renderComponent(MyComponent);
 *
 * // Calling `resolveComponentResources` will resolve `\@Compenent.templateUrl` into
 * // `\@Compenent.template`, which would allow `renderComponent` to proceed in synchronous manner.
 * // Use browser's `fetch` function as the default resource resolution strategy.
 * resolveComponentResources(fetch).then(() => {
 *   // After resolution all URLs have been converted into strings.
 *   renderComponent(MyComponent);
 * });
 *
 * ```
 *
 * NOTE: In AOT the resolution happens during compilation, and so there should be no need
 * to call this method outside JIT mode.
 *
 * @param {?} resourceResolver a function which is responsible to returning a `Promise` of the resolved
 * URL. Browser's `fetch` method is a good default implementation.
 * @return {?}
 */
export function resolveComponentResources(resourceResolver) {
    // Store all promises which are fetching the resources.
    /** @type {?} */
    const urlFetches = [];
    // Cache so that we don't fetch the same resource more than once.
    /** @type {?} */
    const urlMap = new Map();
    /**
     * @param {?} url
     * @return {?}
     */
    function cachedResourceResolve(url) {
        /** @type {?} */
        let promise = urlMap.get(url);
        if (!promise) {
            /** @type {?} */
            const resp = resourceResolver(url);
            urlMap.set(url, promise = resp.then(unwrapResponse));
            urlFetches.push(promise);
        }
        return promise;
    }
    componentResourceResolutionQueue.forEach((component) => {
        if (component.templateUrl) {
            cachedResourceResolve(component.templateUrl).then((template) => {
                component.template = template;
                component.templateUrl = undefined;
            });
        }
        /** @type {?} */
        const styleUrls = component.styleUrls;
        /** @type {?} */
        const styles = component.styles || (component.styles = []);
        /** @type {?} */
        const styleOffset = component.styles.length;
        styleUrls && styleUrls.forEach((styleUrl, index) => {
            styles.push(''); // pre-allocate array.
            cachedResourceResolve(styleUrl).then((style) => {
                styles[styleOffset + index] = style;
                styleUrls.splice(styleUrls.indexOf(styleUrl), 1);
                if (styleUrls.length == 0) {
                    component.styleUrls = undefined;
                }
            });
        });
    });
    clearResolutionOfComponentResourcesQueue();
    return Promise.all(urlFetches).then(() => null);
}
/** @type {?} */
const componentResourceResolutionQueue = new Set();
/**
 * @param {?} metadata
 * @return {?}
 */
export function maybeQueueResolutionOfComponentResources(metadata) {
    if (componentNeedsResolution(metadata)) {
        componentResourceResolutionQueue.add(metadata);
    }
}
/**
 * @param {?} component
 * @return {?}
 */
export function componentNeedsResolution(component) {
    return component.templateUrl || component.styleUrls && component.styleUrls.length;
}
/**
 * @return {?}
 */
export function clearResolutionOfComponentResourcesQueue() {
    componentResourceResolutionQueue.clear();
}
/**
 * @param {?} response
 * @return {?}
 */
function unwrapResponse(response) {
    return typeof response == 'string' ? response : response.text();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQ0EsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxnQkFBOEU7OztVQUUxRSxVQUFVLEdBQXNCLEVBQUU7OztVQUdsQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTJCOzs7OztJQUNqRCxTQUFTLHFCQUFxQixDQUFDLEdBQVc7O1lBQ3BDLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUM3QixJQUFJLENBQUMsT0FBTyxFQUFFOztrQkFDTixJQUFJLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMxQjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxnQ0FBZ0MsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7UUFDaEUsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFO1lBQ3pCLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDN0QsU0FBUyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7Z0JBQzlCLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1NBQ0o7O2NBQ0ssU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTOztjQUMvQixNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDOztjQUNwRCxXQUFXLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNO1FBQzNDLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ2pELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBRSxzQkFBc0I7WUFDeEMscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzdDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO2dCQUNwQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQ3pCLFNBQVMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2lCQUNqQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUNILHdDQUF3QyxFQUFFLENBQUM7SUFDM0MsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsRCxDQUFDOztNQUVLLGdDQUFnQyxHQUFtQixJQUFJLEdBQUcsRUFBRTs7Ozs7QUFFbEUsTUFBTSxVQUFVLHdDQUF3QyxDQUFDLFFBQW1CO0lBQzFFLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDdEMsZ0NBQWdDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2hEO0FBQ0gsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsU0FBb0I7SUFDM0QsT0FBTyxTQUFTLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDcEYsQ0FBQzs7OztBQUNELE1BQU0sVUFBVSx3Q0FBd0M7SUFDdEQsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDM0MsQ0FBQzs7Ozs7QUFFRCxTQUFTLGNBQWMsQ0FBQyxRQUE0QztJQUNsRSxPQUFPLE9BQU8sUUFBUSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4vZGlyZWN0aXZlcyc7XG5cblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgcmVzb3VyY2UgVVJMcyBvbiBgQENvbXBvbmVudGAgd2hlbiB1c2VkIHdpdGggSklUIGNvbXBpbGF0aW9uLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNvbXAnLFxuICogICB0ZW1wbGF0ZVVybDogJ215LWNvbXAuaHRtbCcsIC8vIFRoaXMgcmVxdWlyZXMgYXN5bmNocm9ub3VzIHJlc29sdXRpb25cbiAqIH0pXG4gKiBjbGFzcyBNeUNvbXBvbm5lbnR7XG4gKiB9XG4gKlxuICogLy8gQ2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGZhaWwgYmVjYXVzZSBgTXlDb21wb25lbnRgJ3MgYEBDb21wZW5lbnQudGVtcGxhdGVVcmxgXG4gKiAvLyBuZWVkcyB0byBiZSByZXNvbHZlZCBiZWNhdXNlIGByZW5kZXJDb21wb25lbnRgIGlzIHN5bmNocm9ub3VzIHByb2Nlc3MuXG4gKiAvLyByZW5kZXJDb21wb25lbnQoTXlDb21wb25lbnQpO1xuICpcbiAqIC8vIENhbGxpbmcgYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNgIHdpbGwgcmVzb2x2ZSBgQENvbXBlbmVudC50ZW1wbGF0ZVVybGAgaW50b1xuICogLy8gYEBDb21wZW5lbnQudGVtcGxhdGVgLCB3aGljaCB3b3VsZCBhbGxvdyBgcmVuZGVyQ29tcG9uZW50YCB0byBwcm9jZWVkIGluIHN5bmNocm9ub3VzIG1hbm5lci5cbiAqIC8vIFVzZSBicm93c2VyJ3MgYGZldGNoYCBmdW5jdGlvbiBhcyB0aGUgZGVmYXVsdCByZXNvdXJjZSByZXNvbHV0aW9uIHN0cmF0ZWd5LlxuICogcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhmZXRjaCkudGhlbigoKSA9PiB7XG4gKiAgIC8vIEFmdGVyIHJlc29sdXRpb24gYWxsIFVSTHMgaGF2ZSBiZWVuIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3MuXG4gKiAgIHJlbmRlckNvbXBvbmVudChNeUNvbXBvbmVudCk7XG4gKiB9KTtcbiAqXG4gKiBgYGBcbiAqXG4gKiBOT1RFOiBJbiBBT1QgdGhlIHJlc29sdXRpb24gaGFwcGVucyBkdXJpbmcgY29tcGlsYXRpb24sIGFuZCBzbyB0aGVyZSBzaG91bGQgYmUgbm8gbmVlZFxuICogdG8gY2FsbCB0aGlzIG1ldGhvZCBvdXRzaWRlIEpJVCBtb2RlLlxuICpcbiAqIEBwYXJhbSByZXNvdXJjZVJlc29sdmVyIGEgZnVuY3Rpb24gd2hpY2ggaXMgcmVzcG9uc2libGUgdG8gcmV0dXJuaW5nIGEgYFByb21pc2VgIG9mIHRoZSByZXNvbHZlZFxuICogVVJMLiBCcm93c2VyJ3MgYGZldGNoYCBtZXRob2QgaXMgYSBnb29kIGRlZmF1bHQgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKFxuICAgIHJlc291cmNlUmVzb2x2ZXI6ICh1cmw6IHN0cmluZykgPT4gKFByb21pc2U8c3RyaW5nfHt0ZXh0KCk6IFByb21pc2U8c3RyaW5nPn0+KSk6IFByb21pc2U8bnVsbD4ge1xuICAvLyBTdG9yZSBhbGwgcHJvbWlzZXMgd2hpY2ggYXJlIGZldGNoaW5nIHRoZSByZXNvdXJjZXMuXG4gIGNvbnN0IHVybEZldGNoZXM6IFByb21pc2U8c3RyaW5nPltdID0gW107XG5cbiAgLy8gQ2FjaGUgc28gdGhhdCB3ZSBkb24ndCBmZXRjaCB0aGUgc2FtZSByZXNvdXJjZSBtb3JlIHRoYW4gb25jZS5cbiAgY29uc3QgdXJsTWFwID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8c3RyaW5nPj4oKTtcbiAgZnVuY3Rpb24gY2FjaGVkUmVzb3VyY2VSZXNvbHZlKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcHJvbWlzZSA9IHVybE1hcC5nZXQodXJsKTtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgIGNvbnN0IHJlc3AgPSByZXNvdXJjZVJlc29sdmVyKHVybCk7XG4gICAgICB1cmxNYXAuc2V0KHVybCwgcHJvbWlzZSA9IHJlc3AudGhlbih1bndyYXBSZXNwb25zZSkpO1xuICAgICAgdXJsRmV0Y2hlcy5wdXNoKHByb21pc2UpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlLmZvckVhY2goKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgaWYgKGNvbXBvbmVudC50ZW1wbGF0ZVVybCkge1xuICAgICAgY2FjaGVkUmVzb3VyY2VSZXNvbHZlKGNvbXBvbmVudC50ZW1wbGF0ZVVybCkudGhlbigodGVtcGxhdGUpID0+IHtcbiAgICAgICAgY29tcG9uZW50LnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICAgIGNvbXBvbmVudC50ZW1wbGF0ZVVybCA9IHVuZGVmaW5lZDtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBzdHlsZVVybHMgPSBjb21wb25lbnQuc3R5bGVVcmxzO1xuICAgIGNvbnN0IHN0eWxlcyA9IGNvbXBvbmVudC5zdHlsZXMgfHwgKGNvbXBvbmVudC5zdHlsZXMgPSBbXSk7XG4gICAgY29uc3Qgc3R5bGVPZmZzZXQgPSBjb21wb25lbnQuc3R5bGVzLmxlbmd0aDtcbiAgICBzdHlsZVVybHMgJiYgc3R5bGVVcmxzLmZvckVhY2goKHN0eWxlVXJsLCBpbmRleCkgPT4ge1xuICAgICAgc3R5bGVzLnB1c2goJycpOyAgLy8gcHJlLWFsbG9jYXRlIGFycmF5LlxuICAgICAgY2FjaGVkUmVzb3VyY2VSZXNvbHZlKHN0eWxlVXJsKS50aGVuKChzdHlsZSkgPT4ge1xuICAgICAgICBzdHlsZXNbc3R5bGVPZmZzZXQgKyBpbmRleF0gPSBzdHlsZTtcbiAgICAgICAgc3R5bGVVcmxzLnNwbGljZShzdHlsZVVybHMuaW5kZXhPZihzdHlsZVVybCksIDEpO1xuICAgICAgICBpZiAoc3R5bGVVcmxzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgY29tcG9uZW50LnN0eWxlVXJscyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICBjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlKCk7XG4gIHJldHVybiBQcm9taXNlLmFsbCh1cmxGZXRjaGVzKS50aGVuKCgpID0+IG51bGwpO1xufVxuXG5jb25zdCBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZTogU2V0PENvbXBvbmVudD4gPSBuZXcgU2V0KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzKG1ldGFkYXRhOiBDb21wb25lbnQpIHtcbiAgaWYgKGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihtZXRhZGF0YSkpIHtcbiAgICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5hZGQobWV0YWRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnROZWVkc1Jlc29sdXRpb24oY29tcG9uZW50OiBDb21wb25lbnQpIHtcbiAgcmV0dXJuIGNvbXBvbmVudC50ZW1wbGF0ZVVybCB8fCBjb21wb25lbnQuc3R5bGVVcmxzICYmIGNvbXBvbmVudC5zdHlsZVVybHMubGVuZ3RoO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKSB7XG4gIGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlLmNsZWFyKCk7XG59XG5cbmZ1bmN0aW9uIHVud3JhcFJlc3BvbnNlKHJlc3BvbnNlOiBzdHJpbmcgfCB7dGV4dCgpOiBQcm9taXNlPHN0cmluZz59KTogc3RyaW5nfFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiB0eXBlb2YgcmVzcG9uc2UgPT0gJ3N0cmluZycgPyByZXNwb25zZSA6IHJlc3BvbnNlLnRleHQoKTtcbn0iXX0=