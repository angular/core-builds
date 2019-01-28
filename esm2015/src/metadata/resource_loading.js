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
    return !!(component.templateUrl || component.styleUrls && component.styleUrls.length);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQ0EsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxnQkFBOEU7OztVQUUxRSxVQUFVLEdBQXNCLEVBQUU7OztVQUdsQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTJCOzs7OztJQUNqRCxTQUFTLHFCQUFxQixDQUFDLEdBQVc7O1lBQ3BDLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUM3QixJQUFJLENBQUMsT0FBTyxFQUFFOztrQkFDTixJQUFJLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMxQjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxnQ0FBZ0MsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7UUFDaEUsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFO1lBQ3pCLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDN0QsU0FBUyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7Z0JBQzlCLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1NBQ0o7O2NBQ0ssU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTOztjQUMvQixNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDOztjQUNwRCxXQUFXLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNO1FBQzNDLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ2pELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBRSxzQkFBc0I7WUFDeEMscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzdDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO2dCQUNwQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7b0JBQ3pCLFNBQVMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2lCQUNqQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUNILHdDQUF3QyxFQUFFLENBQUM7SUFDM0MsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsRCxDQUFDOztNQUVLLGdDQUFnQyxHQUFtQixJQUFJLEdBQUcsRUFBRTs7Ozs7QUFFbEUsTUFBTSxVQUFVLHdDQUF3QyxDQUFDLFFBQW1CO0lBQzFFLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDdEMsZ0NBQWdDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2hEO0FBQ0gsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsU0FBb0I7SUFDM0QsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN4RixDQUFDOzs7O0FBQ0QsTUFBTSxVQUFVLHdDQUF3QztJQUN0RCxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMzQyxDQUFDOzs7OztBQUVELFNBQVMsY0FBYyxDQUFDLFFBQTRDO0lBQ2xFLE9BQU8sT0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnLi9kaXJlY3RpdmVzJztcblxuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSByZXNvdXJjZSBVUkxzIG9uIGBAQ29tcG9uZW50YCB3aGVuIHVzZWQgd2l0aCBKSVQgY29tcGlsYXRpb24uXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY29tcCcsXG4gKiAgIHRlbXBsYXRlVXJsOiAnbXktY29tcC5odG1sJywgLy8gVGhpcyByZXF1aXJlcyBhc3luY2hyb25vdXMgcmVzb2x1dGlvblxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9ubmVudHtcbiAqIH1cbiAqXG4gKiAvLyBDYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIHdpbGwgZmFpbCBiZWNhdXNlIGBNeUNvbXBvbmVudGAncyBgQENvbXBlbmVudC50ZW1wbGF0ZVVybGBcbiAqIC8vIG5lZWRzIHRvIGJlIHJlc29sdmVkIGJlY2F1c2UgYHJlbmRlckNvbXBvbmVudGAgaXMgc3luY2hyb25vdXMgcHJvY2Vzcy5cbiAqIC8vIHJlbmRlckNvbXBvbmVudChNeUNvbXBvbmVudCk7XG4gKlxuICogLy8gQ2FsbGluZyBgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlc2Agd2lsbCByZXNvbHZlIGBAQ29tcGVuZW50LnRlbXBsYXRlVXJsYCBpbnRvXG4gKiAvLyBgQENvbXBlbmVudC50ZW1wbGF0ZWAsIHdoaWNoIHdvdWxkIGFsbG93IGByZW5kZXJDb21wb25lbnRgIHRvIHByb2NlZWQgaW4gc3luY2hyb25vdXMgbWFubmVyLlxuICogLy8gVXNlIGJyb3dzZXIncyBgZmV0Y2hgIGZ1bmN0aW9uIGFzIHRoZSBkZWZhdWx0IHJlc291cmNlIHJlc29sdXRpb24gc3RyYXRlZ3kuXG4gKiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKGZldGNoKS50aGVuKCgpID0+IHtcbiAqICAgLy8gQWZ0ZXIgcmVzb2x1dGlvbiBhbGwgVVJMcyBoYXZlIGJlZW4gY29udmVydGVkIGludG8gc3RyaW5ncy5cbiAqICAgcmVuZGVyQ29tcG9uZW50KE15Q29tcG9uZW50KTtcbiAqIH0pO1xuICpcbiAqIGBgYFxuICpcbiAqIE5PVEU6IEluIEFPVCB0aGUgcmVzb2x1dGlvbiBoYXBwZW5zIGR1cmluZyBjb21waWxhdGlvbiwgYW5kIHNvIHRoZXJlIHNob3VsZCBiZSBubyBuZWVkXG4gKiB0byBjYWxsIHRoaXMgbWV0aG9kIG91dHNpZGUgSklUIG1vZGUuXG4gKlxuICogQHBhcmFtIHJlc291cmNlUmVzb2x2ZXIgYSBmdW5jdGlvbiB3aGljaCBpcyByZXNwb25zaWJsZSB0byByZXR1cm5pbmcgYSBgUHJvbWlzZWAgb2YgdGhlIHJlc29sdmVkXG4gKiBVUkwuIEJyb3dzZXIncyBgZmV0Y2hgIG1ldGhvZCBpcyBhIGdvb2QgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMoXG4gICAgcmVzb3VyY2VSZXNvbHZlcjogKHVybDogc3RyaW5nKSA9PiAoUHJvbWlzZTxzdHJpbmd8e3RleHQoKTogUHJvbWlzZTxzdHJpbmc+fT4pKTogUHJvbWlzZTxudWxsPiB7XG4gIC8vIFN0b3JlIGFsbCBwcm9taXNlcyB3aGljaCBhcmUgZmV0Y2hpbmcgdGhlIHJlc291cmNlcy5cbiAgY29uc3QgdXJsRmV0Y2hlczogUHJvbWlzZTxzdHJpbmc+W10gPSBbXTtcblxuICAvLyBDYWNoZSBzbyB0aGF0IHdlIGRvbid0IGZldGNoIHRoZSBzYW1lIHJlc291cmNlIG1vcmUgdGhhbiBvbmNlLlxuICBjb25zdCB1cmxNYXAgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxzdHJpbmc+PigpO1xuICBmdW5jdGlvbiBjYWNoZWRSZXNvdXJjZVJlc29sdmUodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBwcm9taXNlID0gdXJsTWFwLmdldCh1cmwpO1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgY29uc3QgcmVzcCA9IHJlc291cmNlUmVzb2x2ZXIodXJsKTtcbiAgICAgIHVybE1hcC5zZXQodXJsLCBwcm9taXNlID0gcmVzcC50aGVuKHVud3JhcFJlc3BvbnNlKSk7XG4gICAgICB1cmxGZXRjaGVzLnB1c2gocHJvbWlzZSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWUuZm9yRWFjaCgoY29tcG9uZW50OiBDb21wb25lbnQpID0+IHtcbiAgICBpZiAoY29tcG9uZW50LnRlbXBsYXRlVXJsKSB7XG4gICAgICBjYWNoZWRSZXNvdXJjZVJlc29sdmUoY29tcG9uZW50LnRlbXBsYXRlVXJsKS50aGVuKCh0ZW1wbGF0ZSkgPT4ge1xuICAgICAgICBjb21wb25lbnQudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgICAgY29tcG9uZW50LnRlbXBsYXRlVXJsID0gdW5kZWZpbmVkO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHN0eWxlVXJscyA9IGNvbXBvbmVudC5zdHlsZVVybHM7XG4gICAgY29uc3Qgc3R5bGVzID0gY29tcG9uZW50LnN0eWxlcyB8fCAoY29tcG9uZW50LnN0eWxlcyA9IFtdKTtcbiAgICBjb25zdCBzdHlsZU9mZnNldCA9IGNvbXBvbmVudC5zdHlsZXMubGVuZ3RoO1xuICAgIHN0eWxlVXJscyAmJiBzdHlsZVVybHMuZm9yRWFjaCgoc3R5bGVVcmwsIGluZGV4KSA9PiB7XG4gICAgICBzdHlsZXMucHVzaCgnJyk7ICAvLyBwcmUtYWxsb2NhdGUgYXJyYXkuXG4gICAgICBjYWNoZWRSZXNvdXJjZVJlc29sdmUoc3R5bGVVcmwpLnRoZW4oKHN0eWxlKSA9PiB7XG4gICAgICAgIHN0eWxlc1tzdHlsZU9mZnNldCArIGluZGV4XSA9IHN0eWxlO1xuICAgICAgICBzdHlsZVVybHMuc3BsaWNlKHN0eWxlVXJscy5pbmRleE9mKHN0eWxlVXJsKSwgMSk7XG4gICAgICAgIGlmIChzdHlsZVVybHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICBjb21wb25lbnQuc3R5bGVVcmxzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKTtcbiAgcmV0dXJuIFByb21pc2UuYWxsKHVybEZldGNoZXMpLnRoZW4oKCkgPT4gbnVsbCk7XG59XG5cbmNvbnN0IGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlOiBTZXQ8Q29tcG9uZW50PiA9IG5ldyBTZXQoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXMobWV0YWRhdGE6IENvbXBvbmVudCkge1xuICBpZiAoY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uKG1ldGFkYXRhKSkge1xuICAgIGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlLmFkZChtZXRhZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihjb21wb25lbnQ6IENvbXBvbmVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gISEoY29tcG9uZW50LnRlbXBsYXRlVXJsIHx8IGNvbXBvbmVudC5zdHlsZVVybHMgJiYgY29tcG9uZW50LnN0eWxlVXJscy5sZW5ndGgpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKSB7XG4gIGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlLmNsZWFyKCk7XG59XG5cbmZ1bmN0aW9uIHVud3JhcFJlc3BvbnNlKHJlc3BvbnNlOiBzdHJpbmcgfCB7dGV4dCgpOiBQcm9taXNlPHN0cmluZz59KTogc3RyaW5nfFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiB0eXBlb2YgcmVzcG9uc2UgPT0gJ3N0cmluZycgPyByZXNwb25zZSA6IHJlc3BvbnNlLnRleHQoKTtcbn1cbiJdfQ==