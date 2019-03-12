/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Used to resolve resource URLs on `@Component` when used with JIT compilation.
 *
 * Example:
 * ```
 * @Component({
 *   selector: 'my-comp',
 *   templateUrl: 'my-comp.html', // This requires asynchronous resolution
 * })
 * class MyComponent{
 * }
 *
 * // Calling `renderComponent` will fail because `renderComponent` is a synchronous process
 * // and `MyComponent`'s `@Component.templateUrl` needs to be resolved asynchronously.
 *
 * // Calling `resolveComponentResources()` will resolve `@Component.templateUrl` into
 * // `@Component.template`, which allows `renderComponent` to proceed in a synchronous manner.
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
 * @param resourceResolver a function which is responsible for returning a `Promise` to the
 * contents of the resolved URL. Browser's `fetch()` method is a good default implementation.
 */
export function resolveComponentResources(resourceResolver) {
    // Store all promises which are fetching the resources.
    var urlFetches = [];
    // Cache so that we don't fetch the same resource more than once.
    var urlMap = new Map();
    function cachedResourceResolve(url) {
        var promise = urlMap.get(url);
        if (!promise) {
            var resp = resourceResolver(url);
            urlMap.set(url, promise = resp.then(unwrapResponse));
            urlFetches.push(promise);
        }
        return promise;
    }
    componentResourceResolutionQueue.forEach(function (component) {
        if (component.templateUrl) {
            cachedResourceResolve(component.templateUrl).then(function (template) {
                component.template = template;
            });
        }
        var styleUrls = component.styleUrls;
        var styles = component.styles || (component.styles = []);
        var styleOffset = component.styles.length;
        styleUrls && styleUrls.forEach(function (styleUrl, index) {
            styles.push(''); // pre-allocate array.
            cachedResourceResolve(styleUrl).then(function (style) {
                styles[styleOffset + index] = style;
                styleUrls.splice(styleUrls.indexOf(styleUrl), 1);
                if (styleUrls.length == 0) {
                    component.styleUrls = undefined;
                }
            });
        });
    });
    clearResolutionOfComponentResourcesQueue();
    return Promise.all(urlFetches).then(function () { return null; });
}
var componentResourceResolutionQueue = new Set();
export function maybeQueueResolutionOfComponentResources(metadata) {
    if (componentNeedsResolution(metadata)) {
        componentResourceResolutionQueue.add(metadata);
    }
}
export function componentNeedsResolution(component) {
    return !!((component.templateUrl && !component.template) ||
        component.styleUrls && component.styleUrls.length);
}
export function clearResolutionOfComponentResourcesQueue() {
    componentResourceResolutionQueue.clear();
}
export function isComponentResourceResolutionQueueEmpty() {
    return componentResourceResolutionQueue.size === 0;
}
function unwrapResponse(response) {
    return typeof response == 'string' ? response : response.text();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErQkc7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLGdCQUE4RTtJQUNoRix1REFBdUQ7SUFDdkQsSUFBTSxVQUFVLEdBQXNCLEVBQUUsQ0FBQztJQUV6QyxpRUFBaUU7SUFDakUsSUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7SUFDbEQsU0FBUyxxQkFBcUIsQ0FBQyxHQUFXO1FBQ3hDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLElBQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMxQjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxnQ0FBZ0MsQ0FBQyxPQUFPLENBQUMsVUFBQyxTQUFvQjtRQUM1RCxJQUFJLFNBQVMsQ0FBQyxXQUFXLEVBQUU7WUFDekIscUJBQXFCLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQVE7Z0JBQ3pELFNBQVMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxJQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDO1FBQ3RDLElBQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzNELElBQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzVDLFNBQVMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQUMsUUFBUSxFQUFFLEtBQUs7WUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFFLHNCQUFzQjtZQUN4QyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxLQUFLO2dCQUN6QyxNQUFNLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDcEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO29CQUN6QixTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztpQkFDakM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDSCx3Q0FBd0MsRUFBRSxDQUFDO0lBQzNDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBTSxPQUFBLElBQUksRUFBSixDQUFJLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQsSUFBTSxnQ0FBZ0MsR0FBbUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUVuRSxNQUFNLFVBQVUsd0NBQXdDLENBQUMsUUFBbUI7SUFDMUUsSUFBSSx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUN0QyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDaEQ7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUFDLFNBQW9CO0lBQzNELE9BQU8sQ0FBQyxDQUFDLENBQ0wsQ0FBQyxTQUFTLENBQUMsV0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUM5QyxTQUFTLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUNELE1BQU0sVUFBVSx3Q0FBd0M7SUFDdEQsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDM0MsQ0FBQztBQUVELE1BQU0sVUFBVSx1Q0FBdUM7SUFDckQsT0FBTyxnQ0FBZ0MsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxRQUE0QztJQUNsRSxPQUFPLE9BQU8sUUFBUSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4vZGlyZWN0aXZlcyc7XG5cblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgcmVzb3VyY2UgVVJMcyBvbiBgQENvbXBvbmVudGAgd2hlbiB1c2VkIHdpdGggSklUIGNvbXBpbGF0aW9uLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNvbXAnLFxuICogICB0ZW1wbGF0ZVVybDogJ215LWNvbXAuaHRtbCcsIC8vIFRoaXMgcmVxdWlyZXMgYXN5bmNocm9ub3VzIHJlc29sdXRpb25cbiAqIH0pXG4gKiBjbGFzcyBNeUNvbXBvbmVudHtcbiAqIH1cbiAqXG4gKiAvLyBDYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIHdpbGwgZmFpbCBiZWNhdXNlIGByZW5kZXJDb21wb25lbnRgIGlzIGEgc3luY2hyb25vdXMgcHJvY2Vzc1xuICogLy8gYW5kIGBNeUNvbXBvbmVudGAncyBgQENvbXBvbmVudC50ZW1wbGF0ZVVybGAgbmVlZHMgdG8gYmUgcmVzb2x2ZWQgYXN5bmNocm9ub3VzbHkuXG4gKlxuICogLy8gQ2FsbGluZyBgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcygpYCB3aWxsIHJlc29sdmUgYEBDb21wb25lbnQudGVtcGxhdGVVcmxgIGludG9cbiAqIC8vIGBAQ29tcG9uZW50LnRlbXBsYXRlYCwgd2hpY2ggYWxsb3dzIGByZW5kZXJDb21wb25lbnRgIHRvIHByb2NlZWQgaW4gYSBzeW5jaHJvbm91cyBtYW5uZXIuXG4gKlxuICogLy8gVXNlIGJyb3dzZXIncyBgZmV0Y2goKWAgZnVuY3Rpb24gYXMgdGhlIGRlZmF1bHQgcmVzb3VyY2UgcmVzb2x1dGlvbiBzdHJhdGVneS5cbiAqIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMoZmV0Y2gpLnRoZW4oKCkgPT4ge1xuICogICAvLyBBZnRlciByZXNvbHV0aW9uIGFsbCBVUkxzIGhhdmUgYmVlbiBjb252ZXJ0ZWQgaW50byBgdGVtcGxhdGVgIHN0cmluZ3MuXG4gKiAgIHJlbmRlckNvbXBvbmVudChNeUNvbXBvbmVudCk7XG4gKiB9KTtcbiAqXG4gKiBgYGBcbiAqXG4gKiBOT1RFOiBJbiBBT1QgdGhlIHJlc29sdXRpb24gaGFwcGVucyBkdXJpbmcgY29tcGlsYXRpb24sIGFuZCBzbyB0aGVyZSBzaG91bGQgYmUgbm8gbmVlZFxuICogdG8gY2FsbCB0aGlzIG1ldGhvZCBvdXRzaWRlIEpJVCBtb2RlLlxuICpcbiAqIEBwYXJhbSByZXNvdXJjZVJlc29sdmVyIGEgZnVuY3Rpb24gd2hpY2ggaXMgcmVzcG9uc2libGUgZm9yIHJldHVybmluZyBhIGBQcm9taXNlYCB0byB0aGVcbiAqIGNvbnRlbnRzIG9mIHRoZSByZXNvbHZlZCBVUkwuIEJyb3dzZXIncyBgZmV0Y2goKWAgbWV0aG9kIGlzIGEgZ29vZCBkZWZhdWx0IGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhcbiAgICByZXNvdXJjZVJlc29sdmVyOiAodXJsOiBzdHJpbmcpID0+IChQcm9taXNlPHN0cmluZ3x7dGV4dCgpOiBQcm9taXNlPHN0cmluZz59PikpOiBQcm9taXNlPG51bGw+IHtcbiAgLy8gU3RvcmUgYWxsIHByb21pc2VzIHdoaWNoIGFyZSBmZXRjaGluZyB0aGUgcmVzb3VyY2VzLlxuICBjb25zdCB1cmxGZXRjaGVzOiBQcm9taXNlPHN0cmluZz5bXSA9IFtdO1xuXG4gIC8vIENhY2hlIHNvIHRoYXQgd2UgZG9uJ3QgZmV0Y2ggdGhlIHNhbWUgcmVzb3VyY2UgbW9yZSB0aGFuIG9uY2UuXG4gIGNvbnN0IHVybE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBQcm9taXNlPHN0cmluZz4+KCk7XG4gIGZ1bmN0aW9uIGNhY2hlZFJlc291cmNlUmVzb2x2ZSh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHByb21pc2UgPSB1cmxNYXAuZ2V0KHVybCk7XG4gICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICBjb25zdCByZXNwID0gcmVzb3VyY2VSZXNvbHZlcih1cmwpO1xuICAgICAgdXJsTWFwLnNldCh1cmwsIHByb21pc2UgPSByZXNwLnRoZW4odW53cmFwUmVzcG9uc2UpKTtcbiAgICAgIHVybEZldGNoZXMucHVzaChwcm9taXNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5mb3JFYWNoKChjb21wb25lbnQ6IENvbXBvbmVudCkgPT4ge1xuICAgIGlmIChjb21wb25lbnQudGVtcGxhdGVVcmwpIHtcbiAgICAgIGNhY2hlZFJlc291cmNlUmVzb2x2ZShjb21wb25lbnQudGVtcGxhdGVVcmwpLnRoZW4oKHRlbXBsYXRlKSA9PiB7XG4gICAgICAgIGNvbXBvbmVudC50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHN0eWxlVXJscyA9IGNvbXBvbmVudC5zdHlsZVVybHM7XG4gICAgY29uc3Qgc3R5bGVzID0gY29tcG9uZW50LnN0eWxlcyB8fCAoY29tcG9uZW50LnN0eWxlcyA9IFtdKTtcbiAgICBjb25zdCBzdHlsZU9mZnNldCA9IGNvbXBvbmVudC5zdHlsZXMubGVuZ3RoO1xuICAgIHN0eWxlVXJscyAmJiBzdHlsZVVybHMuZm9yRWFjaCgoc3R5bGVVcmwsIGluZGV4KSA9PiB7XG4gICAgICBzdHlsZXMucHVzaCgnJyk7ICAvLyBwcmUtYWxsb2NhdGUgYXJyYXkuXG4gICAgICBjYWNoZWRSZXNvdXJjZVJlc29sdmUoc3R5bGVVcmwpLnRoZW4oKHN0eWxlKSA9PiB7XG4gICAgICAgIHN0eWxlc1tzdHlsZU9mZnNldCArIGluZGV4XSA9IHN0eWxlO1xuICAgICAgICBzdHlsZVVybHMuc3BsaWNlKHN0eWxlVXJscy5pbmRleE9mKHN0eWxlVXJsKSwgMSk7XG4gICAgICAgIGlmIChzdHlsZVVybHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICBjb21wb25lbnQuc3R5bGVVcmxzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKTtcbiAgcmV0dXJuIFByb21pc2UuYWxsKHVybEZldGNoZXMpLnRoZW4oKCkgPT4gbnVsbCk7XG59XG5cbmNvbnN0IGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlOiBTZXQ8Q29tcG9uZW50PiA9IG5ldyBTZXQoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXMobWV0YWRhdGE6IENvbXBvbmVudCkge1xuICBpZiAoY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uKG1ldGFkYXRhKSkge1xuICAgIGNvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlLmFkZChtZXRhZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihjb21wb25lbnQ6IENvbXBvbmVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gISEoXG4gICAgICAoY29tcG9uZW50LnRlbXBsYXRlVXJsICYmICFjb21wb25lbnQudGVtcGxhdGUpIHx8XG4gICAgICBjb21wb25lbnQuc3R5bGVVcmxzICYmIGNvbXBvbmVudC5zdHlsZVVybHMubGVuZ3RoKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlKCkge1xuICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5jbGVhcigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5KCkge1xuICByZXR1cm4gY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWUuc2l6ZSA9PT0gMDtcbn1cblxuZnVuY3Rpb24gdW53cmFwUmVzcG9uc2UocmVzcG9uc2U6IHN0cmluZyB8IHt0ZXh0KCk6IFByb21pc2U8c3RyaW5nPn0pOiBzdHJpbmd8UHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHR5cGVvZiByZXNwb25zZSA9PSAnc3RyaW5nJyA/IHJlc3BvbnNlIDogcmVzcG9uc2UudGV4dCgpO1xufVxuIl19