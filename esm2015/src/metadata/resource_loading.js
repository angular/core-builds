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
 * class MyComponent{
 * }
 *
 * // Calling `renderComponent` will fail because `renderComponent` is a synchronous process
 * // and `MyComponent`'s `\@Component.templateUrl` needs to be resolved asynchronously.
 *
 * // Calling `resolveComponentResources()` will resolve `\@Component.templateUrl` into
 * // `\@Component.template`, which allows `renderComponent` to proceed in a synchronous manner.
 *
 * // Use browser's `fetch()` function as the default resource resolution strategy.
 * resolveComponentResources(fetch).then(() => {
 *   // After resolution all URLs have been converted into `template` strings.
 *   renderComponent(MyComponent);
 * });
 *
 * ```
 *
 * NOTE: In AOT the resolution happens during compilation, and so there should be no need
 * to call this method outside JIT mode.
 *
 * @param {?} resourceResolver a function which is responsible for returning a `Promise` to the
 * contents of the resolved URL. Browser's `fetch()` method is a good default implementation.
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
    return !!((component.templateUrl && !component.template) ||
        component.styleUrls && component.styleUrls.length);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQ0EsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxnQkFBOEU7OztVQUUxRSxVQUFVLEdBQXNCLEVBQUU7OztVQUdsQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTJCOzs7OztJQUNqRCxTQUFTLHFCQUFxQixDQUFDLEdBQVc7O1lBQ3BDLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUM3QixJQUFJLENBQUMsT0FBTyxFQUFFOztrQkFDTixJQUFJLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMxQjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxnQ0FBZ0MsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7UUFDaEUsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFO1lBQ3pCLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDN0QsU0FBUyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUM7U0FDSjs7Y0FDSyxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVM7O2NBQy9CLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7O2NBQ3BELFdBQVcsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU07UUFDM0MsU0FBUyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDakQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFFLHNCQUFzQjtZQUN4QyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQ3BDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakQsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtvQkFDekIsU0FBUyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7aUJBQ2pDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsd0NBQXdDLEVBQUUsQ0FBQztJQUMzQyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xELENBQUM7O01BRUssZ0NBQWdDLEdBQW1CLElBQUksR0FBRyxFQUFFOzs7OztBQUVsRSxNQUFNLFVBQVUsd0NBQXdDLENBQUMsUUFBbUI7SUFDMUUsSUFBSSx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUN0QyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDaEQ7QUFDSCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxTQUFvQjtJQUMzRCxPQUFPLENBQUMsQ0FBQyxDQUNMLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7UUFDOUMsU0FBUyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3pELENBQUM7Ozs7QUFDRCxNQUFNLFVBQVUsd0NBQXdDO0lBQ3RELGdDQUFnQyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzNDLENBQUM7Ozs7O0FBRUQsU0FBUyxjQUFjLENBQUMsUUFBNEM7SUFDbEUsT0FBTyxPQUFPLFFBQVEsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2xFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuL2RpcmVjdGl2ZXMnO1xuXG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHJlc291cmNlIFVSTHMgb24gYEBDb21wb25lbnRgIHdoZW4gdXNlZCB3aXRoIEpJVCBjb21waWxhdGlvbi5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jb21wJyxcbiAqICAgdGVtcGxhdGVVcmw6ICdteS1jb21wLmh0bWwnLCAvLyBUaGlzIHJlcXVpcmVzIGFzeW5jaHJvbm91cyByZXNvbHV0aW9uXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnR7XG4gKiB9XG4gKlxuICogLy8gQ2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGZhaWwgYmVjYXVzZSBgcmVuZGVyQ29tcG9uZW50YCBpcyBhIHN5bmNocm9ub3VzIHByb2Nlc3NcbiAqIC8vIGFuZCBgTXlDb21wb25lbnRgJ3MgYEBDb21wb25lbnQudGVtcGxhdGVVcmxgIG5lZWRzIHRvIGJlIHJlc29sdmVkIGFzeW5jaHJvbm91c2x5LlxuICpcbiAqIC8vIENhbGxpbmcgYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMoKWAgd2lsbCByZXNvbHZlIGBAQ29tcG9uZW50LnRlbXBsYXRlVXJsYCBpbnRvXG4gKiAvLyBgQENvbXBvbmVudC50ZW1wbGF0ZWAsIHdoaWNoIGFsbG93cyBgcmVuZGVyQ29tcG9uZW50YCB0byBwcm9jZWVkIGluIGEgc3luY2hyb25vdXMgbWFubmVyLlxuICpcbiAqIC8vIFVzZSBicm93c2VyJ3MgYGZldGNoKClgIGZ1bmN0aW9uIGFzIHRoZSBkZWZhdWx0IHJlc291cmNlIHJlc29sdXRpb24gc3RyYXRlZ3kuXG4gKiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKGZldGNoKS50aGVuKCgpID0+IHtcbiAqICAgLy8gQWZ0ZXIgcmVzb2x1dGlvbiBhbGwgVVJMcyBoYXZlIGJlZW4gY29udmVydGVkIGludG8gYHRlbXBsYXRlYCBzdHJpbmdzLlxuICogICByZW5kZXJDb21wb25lbnQoTXlDb21wb25lbnQpO1xuICogfSk7XG4gKlxuICogYGBgXG4gKlxuICogTk9URTogSW4gQU9UIHRoZSByZXNvbHV0aW9uIGhhcHBlbnMgZHVyaW5nIGNvbXBpbGF0aW9uLCBhbmQgc28gdGhlcmUgc2hvdWxkIGJlIG5vIG5lZWRcbiAqIHRvIGNhbGwgdGhpcyBtZXRob2Qgb3V0c2lkZSBKSVQgbW9kZS5cbiAqXG4gKiBAcGFyYW0gcmVzb3VyY2VSZXNvbHZlciBhIGZ1bmN0aW9uIHdoaWNoIGlzIHJlc3BvbnNpYmxlIGZvciByZXR1cm5pbmcgYSBgUHJvbWlzZWAgdG8gdGhlXG4gKiBjb250ZW50cyBvZiB0aGUgcmVzb2x2ZWQgVVJMLiBCcm93c2VyJ3MgYGZldGNoKClgIG1ldGhvZCBpcyBhIGdvb2QgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMoXG4gICAgcmVzb3VyY2VSZXNvbHZlcjogKHVybDogc3RyaW5nKSA9PiAoUHJvbWlzZTxzdHJpbmd8e3RleHQoKTogUHJvbWlzZTxzdHJpbmc+fT4pKTogUHJvbWlzZTxudWxsPiB7XG4gIC8vIFN0b3JlIGFsbCBwcm9taXNlcyB3aGljaCBhcmUgZmV0Y2hpbmcgdGhlIHJlc291cmNlcy5cbiAgY29uc3QgdXJsRmV0Y2hlczogUHJvbWlzZTxzdHJpbmc+W10gPSBbXTtcblxuICAvLyBDYWNoZSBzbyB0aGF0IHdlIGRvbid0IGZldGNoIHRoZSBzYW1lIHJlc291cmNlIG1vcmUgdGhhbiBvbmNlLlxuICBjb25zdCB1cmxNYXAgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxzdHJpbmc+PigpO1xuICBmdW5jdGlvbiBjYWNoZWRSZXNvdXJjZVJlc29sdmUodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBwcm9taXNlID0gdXJsTWFwLmdldCh1cmwpO1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgY29uc3QgcmVzcCA9IHJlc291cmNlUmVzb2x2ZXIodXJsKTtcbiAgICAgIHVybE1hcC5zZXQodXJsLCBwcm9taXNlID0gcmVzcC50aGVuKHVud3JhcFJlc3BvbnNlKSk7XG4gICAgICB1cmxGZXRjaGVzLnB1c2gocHJvbWlzZSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWUuZm9yRWFjaCgoY29tcG9uZW50OiBDb21wb25lbnQpID0+IHtcbiAgICBpZiAoY29tcG9uZW50LnRlbXBsYXRlVXJsKSB7XG4gICAgICBjYWNoZWRSZXNvdXJjZVJlc29sdmUoY29tcG9uZW50LnRlbXBsYXRlVXJsKS50aGVuKCh0ZW1wbGF0ZSkgPT4ge1xuICAgICAgICBjb21wb25lbnQudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBzdHlsZVVybHMgPSBjb21wb25lbnQuc3R5bGVVcmxzO1xuICAgIGNvbnN0IHN0eWxlcyA9IGNvbXBvbmVudC5zdHlsZXMgfHwgKGNvbXBvbmVudC5zdHlsZXMgPSBbXSk7XG4gICAgY29uc3Qgc3R5bGVPZmZzZXQgPSBjb21wb25lbnQuc3R5bGVzLmxlbmd0aDtcbiAgICBzdHlsZVVybHMgJiYgc3R5bGVVcmxzLmZvckVhY2goKHN0eWxlVXJsLCBpbmRleCkgPT4ge1xuICAgICAgc3R5bGVzLnB1c2goJycpOyAgLy8gcHJlLWFsbG9jYXRlIGFycmF5LlxuICAgICAgY2FjaGVkUmVzb3VyY2VSZXNvbHZlKHN0eWxlVXJsKS50aGVuKChzdHlsZSkgPT4ge1xuICAgICAgICBzdHlsZXNbc3R5bGVPZmZzZXQgKyBpbmRleF0gPSBzdHlsZTtcbiAgICAgICAgc3R5bGVVcmxzLnNwbGljZShzdHlsZVVybHMuaW5kZXhPZihzdHlsZVVybCksIDEpO1xuICAgICAgICBpZiAoc3R5bGVVcmxzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgY29tcG9uZW50LnN0eWxlVXJscyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICBjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlKCk7XG4gIHJldHVybiBQcm9taXNlLmFsbCh1cmxGZXRjaGVzKS50aGVuKCgpID0+IG51bGwpO1xufVxuXG5jb25zdCBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZTogU2V0PENvbXBvbmVudD4gPSBuZXcgU2V0KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzKG1ldGFkYXRhOiBDb21wb25lbnQpIHtcbiAgaWYgKGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihtZXRhZGF0YSkpIHtcbiAgICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5hZGQobWV0YWRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnROZWVkc1Jlc29sdXRpb24oY29tcG9uZW50OiBDb21wb25lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhKFxuICAgICAgKGNvbXBvbmVudC50ZW1wbGF0ZVVybCAmJiAhY29tcG9uZW50LnRlbXBsYXRlKSB8fFxuICAgICAgY29tcG9uZW50LnN0eWxlVXJscyAmJiBjb21wb25lbnQuc3R5bGVVcmxzLmxlbmd0aCk7XG59XG5leHBvcnQgZnVuY3Rpb24gY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpIHtcbiAgY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWUuY2xlYXIoKTtcbn1cblxuZnVuY3Rpb24gdW53cmFwUmVzcG9uc2UocmVzcG9uc2U6IHN0cmluZyB8IHt0ZXh0KCk6IFByb21pc2U8c3RyaW5nPn0pOiBzdHJpbmd8UHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHR5cGVvZiByZXNwb25zZSA9PSAnc3RyaW5nJyA/IHJlc3BvbnNlIDogcmVzcG9uc2UudGV4dCgpO1xufVxuIl19