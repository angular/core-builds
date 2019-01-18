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
 * class MyComponnent{
 * }
 *
 * // Calling `renderComponent` will fail because `MyComponent`'s `@Compenent.templateUrl`
 * // needs to be resolved because `renderComponent` is synchronous process.
 * // renderComponent(MyComponent);
 *
 * // Calling `resolveComponentResources` will resolve `@Compenent.templateUrl` into
 * // `@Compenent.template`, which would allow `renderComponent` to proceed in synchronous manner.
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
 * @param resourceResolver a function which is responsible to returning a `Promise` of the resolved
 * URL. Browser's `fetch` method is a good default implementation.
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
                component.templateUrl = undefined;
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
    return component.templateUrl || component.styleUrls && component.styleUrls.length;
}
export function clearResolutionOfComponentResourcesQueue() {
    componentResourceResolutionQueue.clear();
}
function unwrapResponse(response) {
    return typeof response == 'string' ? response : response.text();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VfbG9hZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErQkc7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLGdCQUE4RTtJQUNoRix1REFBdUQ7SUFDdkQsSUFBTSxVQUFVLEdBQXNCLEVBQUUsQ0FBQztJQUV6QyxpRUFBaUU7SUFDakUsSUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7SUFDbEQsU0FBUyxxQkFBcUIsQ0FBQyxHQUFXO1FBQ3hDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLElBQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMxQjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxnQ0FBZ0MsQ0FBQyxPQUFPLENBQUMsVUFBQyxTQUFvQjtRQUM1RCxJQUFJLFNBQVMsQ0FBQyxXQUFXLEVBQUU7WUFDekIscUJBQXFCLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQVE7Z0JBQ3pELFNBQVMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2dCQUM5QixTQUFTLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQztTQUNKO1FBQ0QsSUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUN0QyxJQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztRQUMzRCxJQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM1QyxTQUFTLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFFBQVEsRUFBRSxLQUFLO1lBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBRSxzQkFBc0I7WUFDeEMscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsS0FBSztnQkFDekMsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQ3BDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakQsSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtvQkFDekIsU0FBUyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7aUJBQ2pDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsd0NBQXdDLEVBQUUsQ0FBQztJQUMzQyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQU0sT0FBQSxJQUFJLEVBQUosQ0FBSSxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELElBQU0sZ0NBQWdDLEdBQW1CLElBQUksR0FBRyxFQUFFLENBQUM7QUFFbkUsTUFBTSxVQUFVLHdDQUF3QyxDQUFDLFFBQW1CO0lBQzFFLElBQUksd0JBQXdCLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDdEMsZ0NBQWdDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2hEO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxTQUFvQjtJQUMzRCxPQUFPLFNBQVMsQ0FBQyxXQUFXLElBQUksU0FBUyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUNwRixDQUFDO0FBQ0QsTUFBTSxVQUFVLHdDQUF3QztJQUN0RCxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMzQyxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsUUFBNEM7SUFDbEUsT0FBTyxPQUFPLFFBQVEsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2xFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuL2RpcmVjdGl2ZXMnO1xuXG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHJlc291cmNlIFVSTHMgb24gYEBDb21wb25lbnRgIHdoZW4gdXNlZCB3aXRoIEpJVCBjb21waWxhdGlvbi5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jb21wJyxcbiAqICAgdGVtcGxhdGVVcmw6ICdteS1jb21wLmh0bWwnLCAvLyBUaGlzIHJlcXVpcmVzIGFzeW5jaHJvbm91cyByZXNvbHV0aW9uXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25uZW50e1xuICogfVxuICpcbiAqIC8vIENhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgd2lsbCBmYWlsIGJlY2F1c2UgYE15Q29tcG9uZW50YCdzIGBAQ29tcGVuZW50LnRlbXBsYXRlVXJsYFxuICogLy8gbmVlZHMgdG8gYmUgcmVzb2x2ZWQgYmVjYXVzZSBgcmVuZGVyQ29tcG9uZW50YCBpcyBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICogLy8gcmVuZGVyQ29tcG9uZW50KE15Q29tcG9uZW50KTtcbiAqXG4gKiAvLyBDYWxsaW5nIGByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzYCB3aWxsIHJlc29sdmUgYEBDb21wZW5lbnQudGVtcGxhdGVVcmxgIGludG9cbiAqIC8vIGBAQ29tcGVuZW50LnRlbXBsYXRlYCwgd2hpY2ggd291bGQgYWxsb3cgYHJlbmRlckNvbXBvbmVudGAgdG8gcHJvY2VlZCBpbiBzeW5jaHJvbm91cyBtYW5uZXIuXG4gKiAvLyBVc2UgYnJvd3NlcidzIGBmZXRjaGAgZnVuY3Rpb24gYXMgdGhlIGRlZmF1bHQgcmVzb3VyY2UgcmVzb2x1dGlvbiBzdHJhdGVneS5cbiAqIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMoZmV0Y2gpLnRoZW4oKCkgPT4ge1xuICogICAvLyBBZnRlciByZXNvbHV0aW9uIGFsbCBVUkxzIGhhdmUgYmVlbiBjb252ZXJ0ZWQgaW50byBzdHJpbmdzLlxuICogICByZW5kZXJDb21wb25lbnQoTXlDb21wb25lbnQpO1xuICogfSk7XG4gKlxuICogYGBgXG4gKlxuICogTk9URTogSW4gQU9UIHRoZSByZXNvbHV0aW9uIGhhcHBlbnMgZHVyaW5nIGNvbXBpbGF0aW9uLCBhbmQgc28gdGhlcmUgc2hvdWxkIGJlIG5vIG5lZWRcbiAqIHRvIGNhbGwgdGhpcyBtZXRob2Qgb3V0c2lkZSBKSVQgbW9kZS5cbiAqXG4gKiBAcGFyYW0gcmVzb3VyY2VSZXNvbHZlciBhIGZ1bmN0aW9uIHdoaWNoIGlzIHJlc3BvbnNpYmxlIHRvIHJldHVybmluZyBhIGBQcm9taXNlYCBvZiB0aGUgcmVzb2x2ZWRcbiAqIFVSTC4gQnJvd3NlcidzIGBmZXRjaGAgbWV0aG9kIGlzIGEgZ29vZCBkZWZhdWx0IGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhcbiAgICByZXNvdXJjZVJlc29sdmVyOiAodXJsOiBzdHJpbmcpID0+IChQcm9taXNlPHN0cmluZ3x7dGV4dCgpOiBQcm9taXNlPHN0cmluZz59PikpOiBQcm9taXNlPG51bGw+IHtcbiAgLy8gU3RvcmUgYWxsIHByb21pc2VzIHdoaWNoIGFyZSBmZXRjaGluZyB0aGUgcmVzb3VyY2VzLlxuICBjb25zdCB1cmxGZXRjaGVzOiBQcm9taXNlPHN0cmluZz5bXSA9IFtdO1xuXG4gIC8vIENhY2hlIHNvIHRoYXQgd2UgZG9uJ3QgZmV0Y2ggdGhlIHNhbWUgcmVzb3VyY2UgbW9yZSB0aGFuIG9uY2UuXG4gIGNvbnN0IHVybE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBQcm9taXNlPHN0cmluZz4+KCk7XG4gIGZ1bmN0aW9uIGNhY2hlZFJlc291cmNlUmVzb2x2ZSh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHByb21pc2UgPSB1cmxNYXAuZ2V0KHVybCk7XG4gICAgaWYgKCFwcm9taXNlKSB7XG4gICAgICBjb25zdCByZXNwID0gcmVzb3VyY2VSZXNvbHZlcih1cmwpO1xuICAgICAgdXJsTWFwLnNldCh1cmwsIHByb21pc2UgPSByZXNwLnRoZW4odW53cmFwUmVzcG9uc2UpKTtcbiAgICAgIHVybEZldGNoZXMucHVzaChwcm9taXNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5mb3JFYWNoKChjb21wb25lbnQ6IENvbXBvbmVudCkgPT4ge1xuICAgIGlmIChjb21wb25lbnQudGVtcGxhdGVVcmwpIHtcbiAgICAgIGNhY2hlZFJlc291cmNlUmVzb2x2ZShjb21wb25lbnQudGVtcGxhdGVVcmwpLnRoZW4oKHRlbXBsYXRlKSA9PiB7XG4gICAgICAgIGNvbXBvbmVudC50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgICBjb21wb25lbnQudGVtcGxhdGVVcmwgPSB1bmRlZmluZWQ7XG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgc3R5bGVVcmxzID0gY29tcG9uZW50LnN0eWxlVXJscztcbiAgICBjb25zdCBzdHlsZXMgPSBjb21wb25lbnQuc3R5bGVzIHx8IChjb21wb25lbnQuc3R5bGVzID0gW10pO1xuICAgIGNvbnN0IHN0eWxlT2Zmc2V0ID0gY29tcG9uZW50LnN0eWxlcy5sZW5ndGg7XG4gICAgc3R5bGVVcmxzICYmIHN0eWxlVXJscy5mb3JFYWNoKChzdHlsZVVybCwgaW5kZXgpID0+IHtcbiAgICAgIHN0eWxlcy5wdXNoKCcnKTsgIC8vIHByZS1hbGxvY2F0ZSBhcnJheS5cbiAgICAgIGNhY2hlZFJlc291cmNlUmVzb2x2ZShzdHlsZVVybCkudGhlbigoc3R5bGUpID0+IHtcbiAgICAgICAgc3R5bGVzW3N0eWxlT2Zmc2V0ICsgaW5kZXhdID0gc3R5bGU7XG4gICAgICAgIHN0eWxlVXJscy5zcGxpY2Uoc3R5bGVVcmxzLmluZGV4T2Yoc3R5bGVVcmwpLCAxKTtcbiAgICAgICAgaWYgKHN0eWxlVXJscy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgIGNvbXBvbmVudC5zdHlsZVVybHMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbiAgY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpO1xuICByZXR1cm4gUHJvbWlzZS5hbGwodXJsRmV0Y2hlcykudGhlbigoKSA9PiBudWxsKTtcbn1cblxuY29uc3QgY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWU6IFNldDxDb21wb25lbnQ+ID0gbmV3IFNldCgpO1xuXG5leHBvcnQgZnVuY3Rpb24gbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlcyhtZXRhZGF0YTogQ29tcG9uZW50KSB7XG4gIGlmIChjb21wb25lbnROZWVkc1Jlc29sdXRpb24obWV0YWRhdGEpKSB7XG4gICAgY29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWUuYWRkKG1ldGFkYXRhKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uKGNvbXBvbmVudDogQ29tcG9uZW50KSB7XG4gIHJldHVybiBjb21wb25lbnQudGVtcGxhdGVVcmwgfHwgY29tcG9uZW50LnN0eWxlVXJscyAmJiBjb21wb25lbnQuc3R5bGVVcmxzLmxlbmd0aDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlKCkge1xuICBjb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZS5jbGVhcigpO1xufVxuXG5mdW5jdGlvbiB1bndyYXBSZXNwb25zZShyZXNwb25zZTogc3RyaW5nIHwge3RleHQoKTogUHJvbWlzZTxzdHJpbmc+fSk6IHN0cmluZ3xQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gdHlwZW9mIHJlc3BvbnNlID09ICdzdHJpbmcnID8gcmVzcG9uc2UgOiByZXNwb25zZS50ZXh0KCk7XG59Il19