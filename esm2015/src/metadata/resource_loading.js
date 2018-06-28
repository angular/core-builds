/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
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
    const /** @type {?} */ urlFetches = [];
    // Cache so that we don't fetch the same resource more than once.
    const /** @type {?} */ urlMap = new Map();
    /**
     * @param {?} url
     * @return {?}
     */
    function cachedResourceResolve(url) {
        let /** @type {?} */ promise = urlMap.get(url);
        if (!promise) {
            const /** @type {?} */ resp = resourceResolver(url);
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
        const /** @type {?} */ styleUrls = component.styleUrls;
        const /** @type {?} */ styles = component.styles || (component.styles = []);
        const /** @type {?} */ styleOffset = component.styles.length;
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
    componentResourceResolutionQueue.clear();
    return Promise.all(urlFetches).then(() => null);
}
const /** @type {?} */ componentResourceResolutionQueue = new Set();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQ0EsTUFBTSxvQ0FDRixnQkFBOEU7O0lBRWhGLHVCQUFNLFVBQVUsR0FBc0IsRUFBRSxDQUFDOztJQUd6Qyx1QkFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7Ozs7O0lBQ2xELCtCQUErQixHQUFXO1FBQ3hDLHFCQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWix1QkFBTSxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUNyRCxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzFCO1FBQ0QsT0FBTyxPQUFPLENBQUM7S0FDaEI7SUFFRCxnQ0FBZ0MsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7UUFDaEUsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFO1lBQ3pCLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDN0QsU0FBUyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7Z0JBQzlCLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO2FBQ25DLENBQUMsQ0FBQztTQUNKO1FBQ0QsdUJBQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7UUFDdEMsdUJBQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzNELHVCQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM1QyxTQUFTLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNqRCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hCLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUM3QyxNQUFNLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDcEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO29CQUN6QixTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztpQkFDakM7YUFDRixDQUFDLENBQUM7U0FDSixDQUFDLENBQUM7S0FDSixDQUFDLENBQUM7SUFDSCxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN6QyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ2pEO0FBRUQsdUJBQU0sZ0NBQWdDLEdBQW1CLElBQUksR0FBRyxFQUFFLENBQUM7Ozs7O0FBRW5FLE1BQU0sbURBQW1ELFFBQW1CO0lBQzFFLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDdEMsZ0NBQWdDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2hEO0NBQ0Y7Ozs7O0FBRUQsTUFBTSxtQ0FBbUMsU0FBb0I7SUFDM0QsT0FBTyxTQUFTLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7Q0FDbkY7Ozs7QUFDRCxNQUFNO0lBQ0osZ0NBQWdDLENBQUMsS0FBSyxFQUFFLENBQUM7Q0FDMUM7Ozs7O0FBRUQsd0JBQXdCLFFBQTRDO0lBQ2xFLE9BQU8sT0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNqRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4vZGlyZWN0aXZlcyc7XG5cblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgcmVzb3VyY2UgVVJMcyBvbiBgQENvbXBvbmVudGAgd2hlbiB1c2VkIHdpdGggSklUIGNvbXBpbGF0aW9uLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNvbXAnLFxuICogICB0ZW1wbGF0ZVVybDogJ215LWNvbXAuaHRtbCcsIC8vIFRoaXMgcmVxdWlyZXMgYXN5bmNocm9ub3VzIHJlc29sdXRpb25cbiAqIH0pXG4gKiBjbGFzcyBNeUNvbXBvbm5lbnR7XG4gKiB9XG4gKlxuICogLy8gQ2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGZhaWwgYmVjYXVzZSBgTXlDb21wb25lbnRgJ3MgYEBDb21wZW5lbnQudGVtcGxhdGVVcmxgXG4gKiAvLyBuZWVkcyB0byBiZSByZXNvbHZlZCBiZWNhdXNlIGByZW5kZXJDb21wb25lbnRgIGlzIHN5bmNocm9ub3VzIHByb2Nlc3MuXG4gKiAvLyByZW5kZXJDb21wb25lbnQoTXlDb21wb25lbnQpO1xuICpcbiAqIC8vIENhbGxpbmcgYHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNgIHdpbGwgcmVzb2x2ZSBgQENvbXBlbmVudC50ZW1wbGF0ZVVybGAgaW50b1xuICogLy8gYEBDb21wZW5lbnQudGVtcGxhdGVgLCB3aGljaCB3b3VsZCBhbGxvdyBgcmVuZGVyQ29tcG9uZW50YCB0byBwcm9jZWVkIGluIHN5bmNocm9ub3VzIG1hbm5lci5cbiAqIC8vIFVzZSBicm93c2VyJ3MgYGZldGNoYCBmdW5jdGlvbiBhcyB0aGUgZGVmYXVsdCByZXNvdXJjZSByZXNvbHV0aW9uIHN0cmF0ZWd5LlxuICogcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhmZXRjaCkudGhlbigoKSA9PiB7XG4gKiAgIC8vIEFmdGVyIHJlc29sdXRpb24gYWxsIFVSTHMgaGF2ZSBiZWVuIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3MuXG4gKiAgIHJlbmRlckNvbXBvbmVudChNeUNvbXBvbmVudCk7XG4gKiB9KTtcbiAqXG4gKiBgYGBcbiAqXG4gKiBOT1RFOiBJbiBBT1QgdGhlIHJlc29sdXRpb24gaGFwcGVucyBkdXJpbmcgY29tcGlsYXRpb24sIGFuZCBzbyB0aGVyZSBzaG91bGQgYmUgbm8gbmVlZFxuICogdG8gY2FsbCB0aGlzIG1ldGhvZCBvdXRzaWRlIEpJVCBtb2RlLlxuICpcbiAqIEBwYXJhbSByZXNvdXJjZVJlc29sdmVyIGEgZnVuY3Rpb24gd2hpY2ggaXMgcmVzcG9uc2libGUgdG8gcmV0dXJuaW5nIGEgYFByb21pc2VgIG9mIHRoZSByZXNvbHZlZFxuICogVVJMLiBCcm93c2VyJ3MgYGZldGNoYCBtZXRob2QgaXMgYSBnb29kIGRlZmF1bHQgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKFxuICAgIHJlc291cmNlUmVzb2x2ZXI6ICh1cmw6IHN0cmluZykgPT4gKFByb21pc2U8c3RyaW5nfHt0ZXh0KCk6IFByb21pc2U8c3RyaW5nPn0+KSk6IFByb21pc2U8bnVsbD4ge1xuICAvLyBTdG9yZSBhbGwgcHJvbWlzZXMgd2hpY2ggYXJlIGZldGNoaW5nIHRoZSByZXNvdXJjZXMuXG4gIGNvbnN0IHVybEZldGNoZXM6IFByb21pc2U8c3RyaW5nPltdID0gW107XG5cbiAgLy8gQ2FjaGUgc28gdGhhdCB3ZSBkb24ndCBmZXRjaCB0aGUgc2FtZSByZXNvdXJjZSBtb3JlIHRoYW4gb25jZS5cbiAgY29uc3QgdXJsTWFwID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8c3RyaW5nPj4oKTtcbiAgZnVuY3Rpb24gY2FjaGVkUmVzb3VyY2VSZXNvbHZlKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcHJvbWlzZSA9IHVybE1hcC5nZXQodXJsKTtcbiAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgIGNvbnN0IHJlc3AgPSByZXNvdXJjZVJlc29sdmVyKHVybCk7XG4gICAgICB1cmxNYXAuc2V0KHVybCwgcHJvbWlzZSA9IHJlc3AudGhlbih1bndyYXBSZXNwb25zZSkpO1xuICAgICAgdXJsRmV0Y2hlcy5wdXNoKHByb21pc2UpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlLmZvckVhY2goKGNvbXBvbmVudDogQ29tcG9uZW50KSA9PiB7XG4gICAgaWYgKGNvbXBvbmVudC50ZW1wbGF0ZVVybCkge1xuICAgICAgY2FjaGVkUmVzb3VyY2VSZXNvbHZlKGNvbXBvbmVudC50ZW1wbGF0ZVVybCkudGhlbigodGVtcGxhdGUpID0+IHtcbiAgICAgICAgY29tcG9uZW50LnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICAgIGNvbXBvbmVudC50ZW1wbGF0ZVVybCA9IHVuZGVmaW5lZDtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBzdHlsZVVybHMgPSBjb21wb25lbnQuc3R5bGVVcmxzO1xuICAgIGNvbnN0IHN0eWxlcyA9IGNvbXBvbmVudC5zdHlsZXMgfHwgKGNvbXBvbmVudC5zdHlsZXMgPSBbXSk7XG4gICAgY29uc3Qgc3R5bGVPZmZzZXQgPSBjb21wb25lbnQuc3R5bGVzLmxlbmd0aDtcbiAgICBzdHlsZVVybHMgJiYgc3R5bGVVcmxzLmZvckVhY2goKHN0eWxlVXJsLCBpbmRleCkgPT4ge1xuICAgICAgc3R5bGVzLnB1c2goJycpOyAgLy8gcHJlLWFsbG9jYXRlIGFycmF5LlxuICAgICAgY2FjaGVkUmVzb3VyY2VSZXNvbHZlKHN0eWxlVXJsKS50aGVuKChzdHlsZSkgPT4ge1xuICAgICAgICBzdHlsZXNbc3R5bGVPZmZzZXQgKyBpbmRleF0gPSBzdHlsZTtcbiAgICAgICAgc3R5bGVVcmxzLnNwbGljZShzdHlsZVVybHMuaW5kZXhPZihzdHlsZVVybCksIDEpO1xuICAgICAgICBpZiAoc3R5bGVVcmxzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgY29tcG9uZW50LnN0eWxlVXJscyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5jbGVhcigpO1xuICByZXR1cm4gUHJvbWlzZS5hbGwodXJsRmV0Y2hlcykudGhlbigoKSA9PiBudWxsKTtcbn1cblxuY29uc3QgY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWU6IFNldDxDb21wb25lbnQ+ID0gbmV3IFNldCgpO1xuXG5leHBvcnQgZnVuY3Rpb24gbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlcyhtZXRhZGF0YTogQ29tcG9uZW50KSB7XG4gIGlmIChjb21wb25lbnROZWVkc1Jlc29sdXRpb24obWV0YWRhdGEpKSB7XG4gICAgY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWUuYWRkKG1ldGFkYXRhKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uKGNvbXBvbmVudDogQ29tcG9uZW50KSB7XG4gIHJldHVybiBjb21wb25lbnQudGVtcGxhdGVVcmwgfHwgY29tcG9uZW50LnN0eWxlVXJscyAmJiBjb21wb25lbnQuc3R5bGVVcmxzLmxlbmd0aDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlKCkge1xuICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5jbGVhcigpO1xufVxuXG5mdW5jdGlvbiB1bndyYXBSZXNwb25zZShyZXNwb25zZTogc3RyaW5nIHwge3RleHQoKTogUHJvbWlzZTxzdHJpbmc+fSk6IHN0cmluZ3xQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gdHlwZW9mIHJlc3BvbnNlID09ICdzdHJpbmcnID8gcmVzcG9uc2UgOiByZXNwb25zZS50ZXh0KCk7XG59Il19