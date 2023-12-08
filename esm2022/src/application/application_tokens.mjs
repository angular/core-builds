/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
import { getDocument } from '../render3/interfaces/document';
/**
 * A [DI token](guide/glossary#di-token "DI token definition") representing a string ID, used
 * primarily for prefixing application attributes and CSS styles when
 * {@link ViewEncapsulation#Emulated} is being used.
 *
 * The token is needed in cases when multiple applications are bootstrapped on a page
 * (for example, using `bootstrapApplication` calls). In this case, ensure that those applications
 * have different `APP_ID` value setup. For example:
 *
 * ```
 * bootstrapApplication(ComponentA, {
 *   providers: [
 *     { provide: APP_ID, useValue: 'app-a' },
 *     // ... other providers ...
 *   ]
 * });
 *
 * bootstrapApplication(ComponentB, {
 *   providers: [
 *     { provide: APP_ID, useValue: 'app-b' },
 *     // ... other providers ...
 *   ]
 * });
 * ```
 *
 * By default, when there is only one application bootstrapped, you don't need to provide the
 * `APP_ID` token (the `ng` will be used as an app ID).
 *
 * @publicApi
 */
export const APP_ID = new InjectionToken('AppId', {
    providedIn: 'root',
    factory: () => DEFAULT_APP_ID,
});
/** Default value of the `APP_ID` token. */
const DEFAULT_APP_ID = 'ng';
/**
 * A function that is executed when a platform is initialized.
 * @publicApi
 */
export const PLATFORM_INITIALIZER = new InjectionToken('Platform Initializer');
/**
 * A token that indicates an opaque platform ID.
 * @publicApi
 */
export const PLATFORM_ID = new InjectionToken('Platform ID', {
    providedIn: 'platform',
    factory: () => 'unknown', // set a default platform name, when none set explicitly
});
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that indicates the root directory of
 * the application
 * @publicApi
 * @deprecated
 */
export const PACKAGE_ROOT_URL = new InjectionToken('Application Packages Root URL');
// We keep this token here, rather than the animations package, so that modules that only care
// about which animations module is loaded (e.g. the CDK) can retrieve it without having to
// include extra dependencies. See #44970 for more context.
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that indicates which animations
 * module has been loaded.
 * @publicApi
 */
export const ANIMATION_MODULE_TYPE = new InjectionToken('AnimationModuleType');
// TODO(crisbeto): link to CSP guide here.
/**
 * Token used to configure the [Content Security Policy](https://web.dev/strict-csp/) nonce that
 * Angular will apply when inserting inline styles. If not provided, Angular will look up its value
 * from the `ngCspNonce` attribute of the application root node.
 *
 * @publicApi
 */
export const CSP_NONCE = new InjectionToken('CSP nonce', {
    providedIn: 'root',
    factory: () => {
        // Ideally we wouldn't have to use `querySelector` here since we know that the nonce will be on
        // the root node, but because the token value is used in renderers, it has to be available
        // *very* early in the bootstrapping process. This should be a fairly shallow search, because
        // the app won't have been added to the DOM yet. Some approaches that were considered:
        // 1. Find the root node through `ApplicationRef.components[i].location` - normally this would
        // be enough for our purposes, but the token is injected very early so the `components` array
        // isn't populated yet.
        // 2. Find the root `LView` through the current `LView` - renderers are a prerequisite to
        // creating the `LView`. This means that no `LView` will have been entered when this factory is
        // invoked for the root component.
        // 3. Have the token factory return `() => string` which is invoked when a nonce is requested -
        // the slightly later execution does allow us to get an `LView` reference, but the fact that
        // it is a function means that it could be executed at *any* time (including immediately) which
        // may lead to weird bugs.
        // 4. Have the `ComponentFactory` read the attribute and provide it to the injector under the
        // hood - has the same problem as #1 and #2 in that the renderer is used to query for the root
        // node and the nonce value needs to be available when the renderer is created.
        return getDocument().body?.querySelector('[ngCspNonce]')?.getAttribute('ngCspNonce') || null;
    },
});
export const IMAGE_CONFIG_DEFAULTS = {
    breakpoints: [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    disableImageSizeWarning: false,
    disableImageLazyLoadWarning: false,
};
/**
 * Injection token that configures the image optimized image functionality.
 * See {@link ImageConfig} for additional information about parameters that
 * can be used.
 *
 * @see {@link NgOptimizedImage}
 * @see {@link ImageConfig}
 * @publicApi
 */
export const IMAGE_CONFIG = new InjectionToken('ImageConfig', { providedIn: 'root', factory: () => IMAGE_CONFIG_DEFAULTS });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fdG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb24vYXBwbGljYXRpb25fdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFHLElBQUksY0FBYyxDQUFTLE9BQU8sRUFBRTtJQUN4RCxVQUFVLEVBQUUsTUFBTTtJQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztDQUM5QixDQUFDLENBQUM7QUFFSCwyQ0FBMkM7QUFDM0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBRTVCOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUM3QixJQUFJLGNBQWMsQ0FBNEIsc0JBQXNCLENBQUMsQ0FBQztBQUUxRTs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxjQUFjLENBQVMsYUFBYSxFQUFFO0lBQ25FLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUcsd0RBQXdEO0NBQ3BGLENBQUMsQ0FBQztBQUVIOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQVMsK0JBQStCLENBQUMsQ0FBQztBQUU1Riw4RkFBOEY7QUFDOUYsMkZBQTJGO0FBQzNGLDJEQUEyRDtBQUUzRDs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQzlCLElBQUksY0FBYyxDQUF1QyxxQkFBcUIsQ0FBQyxDQUFDO0FBRXBGLDBDQUEwQztBQUMxQzs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxjQUFjLENBQWMsV0FBVyxFQUFFO0lBQ3BFLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUU7UUFDWiwrRkFBK0Y7UUFDL0YsMEZBQTBGO1FBQzFGLDZGQUE2RjtRQUM3RixzRkFBc0Y7UUFDdEYsOEZBQThGO1FBQzlGLDZGQUE2RjtRQUM3Rix1QkFBdUI7UUFDdkIseUZBQXlGO1FBQ3pGLCtGQUErRjtRQUMvRixrQ0FBa0M7UUFDbEMsK0ZBQStGO1FBQy9GLDRGQUE0RjtRQUM1RiwrRkFBK0Y7UUFDL0YsMEJBQTBCO1FBQzFCLDZGQUE2RjtRQUM3Riw4RkFBOEY7UUFDOUYsK0VBQStFO1FBQy9FLE9BQU8sV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxjQUFjLENBQUMsRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDO0lBQy9GLENBQUM7Q0FDRixDQUFDLENBQUM7QUFxQkgsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQWdCO0lBQ2hELFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQztJQUM3Rix1QkFBdUIsRUFBRSxLQUFLO0lBQzlCLDJCQUEyQixFQUFFLEtBQUs7Q0FDbkMsQ0FBQztBQUVGOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLElBQUksY0FBYyxDQUMxQyxhQUFhLEVBQUUsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsRUFBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSByZXByZXNlbnRpbmcgYSBzdHJpbmcgSUQsIHVzZWRcbiAqIHByaW1hcmlseSBmb3IgcHJlZml4aW5nIGFwcGxpY2F0aW9uIGF0dHJpYnV0ZXMgYW5kIENTUyBzdHlsZXMgd2hlblxuICoge0BsaW5rIFZpZXdFbmNhcHN1bGF0aW9uI0VtdWxhdGVkfSBpcyBiZWluZyB1c2VkLlxuICpcbiAqIFRoZSB0b2tlbiBpcyBuZWVkZWQgaW4gY2FzZXMgd2hlbiBtdWx0aXBsZSBhcHBsaWNhdGlvbnMgYXJlIGJvb3RzdHJhcHBlZCBvbiBhIHBhZ2VcbiAqIChmb3IgZXhhbXBsZSwgdXNpbmcgYGJvb3RzdHJhcEFwcGxpY2F0aW9uYCBjYWxscykuIEluIHRoaXMgY2FzZSwgZW5zdXJlIHRoYXQgdGhvc2UgYXBwbGljYXRpb25zXG4gKiBoYXZlIGRpZmZlcmVudCBgQVBQX0lEYCB2YWx1ZSBzZXR1cC4gRm9yIGV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihDb21wb25lbnRBLCB7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIHsgcHJvdmlkZTogQVBQX0lELCB1c2VWYWx1ZTogJ2FwcC1hJyB9LFxuICogICAgIC8vIC4uLiBvdGhlciBwcm92aWRlcnMgLi4uXG4gKiAgIF1cbiAqIH0pO1xuICpcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKENvbXBvbmVudEIsIHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgeyBwcm92aWRlOiBBUFBfSUQsIHVzZVZhbHVlOiAnYXBwLWInIH0sXG4gKiAgICAgLy8gLi4uIG90aGVyIHByb3ZpZGVycyAuLi5cbiAqICAgXVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBCeSBkZWZhdWx0LCB3aGVuIHRoZXJlIGlzIG9ubHkgb25lIGFwcGxpY2F0aW9uIGJvb3RzdHJhcHBlZCwgeW91IGRvbid0IG5lZWQgdG8gcHJvdmlkZSB0aGVcbiAqIGBBUFBfSURgIHRva2VuICh0aGUgYG5nYCB3aWxsIGJlIHVzZWQgYXMgYW4gYXBwIElEKS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBfSUQgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nPignQXBwSWQnLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4gREVGQVVMVF9BUFBfSUQsXG59KTtcblxuLyoqIERlZmF1bHQgdmFsdWUgb2YgdGhlIGBBUFBfSURgIHRva2VuLiAqL1xuY29uc3QgREVGQVVMVF9BUFBfSUQgPSAnbmcnO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBpcyBleGVjdXRlZCB3aGVuIGEgcGxhdGZvcm0gaXMgaW5pdGlhbGl6ZWQuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBQTEFURk9STV9JTklUSUFMSVpFUiA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPFJlYWRvbmx5QXJyYXk8KCkgPT4gdm9pZD4+KCdQbGF0Zm9ybSBJbml0aWFsaXplcicpO1xuXG4vKipcbiAqIEEgdG9rZW4gdGhhdCBpbmRpY2F0ZXMgYW4gb3BhcXVlIHBsYXRmb3JtIElELlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgUExBVEZPUk1fSUQgPSBuZXcgSW5qZWN0aW9uVG9rZW48T2JqZWN0PignUGxhdGZvcm0gSUQnLCB7XG4gIHByb3ZpZGVkSW46ICdwbGF0Zm9ybScsXG4gIGZhY3Rvcnk6ICgpID0+ICd1bmtub3duJywgIC8vIHNldCBhIGRlZmF1bHQgcGxhdGZvcm0gbmFtZSwgd2hlbiBub25lIHNldCBleHBsaWNpdGx5XG59KTtcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHRoYXQgaW5kaWNhdGVzIHRoZSByb290IGRpcmVjdG9yeSBvZlxuICogdGhlIGFwcGxpY2F0aW9uXG4gKiBAcHVibGljQXBpXG4gKiBAZGVwcmVjYXRlZFxuICovXG5leHBvcnQgY29uc3QgUEFDS0FHRV9ST09UX1VSTCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdBcHBsaWNhdGlvbiBQYWNrYWdlcyBSb290IFVSTCcpO1xuXG4vLyBXZSBrZWVwIHRoaXMgdG9rZW4gaGVyZSwgcmF0aGVyIHRoYW4gdGhlIGFuaW1hdGlvbnMgcGFja2FnZSwgc28gdGhhdCBtb2R1bGVzIHRoYXQgb25seSBjYXJlXG4vLyBhYm91dCB3aGljaCBhbmltYXRpb25zIG1vZHVsZSBpcyBsb2FkZWQgKGUuZy4gdGhlIENESykgY2FuIHJldHJpZXZlIGl0IHdpdGhvdXQgaGF2aW5nIHRvXG4vLyBpbmNsdWRlIGV4dHJhIGRlcGVuZGVuY2llcy4gU2VlICM0NDk3MCBmb3IgbW9yZSBjb250ZXh0LlxuXG4vKipcbiAqIEEgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbiBcIkRJIHRva2VuIGRlZmluaXRpb25cIikgdGhhdCBpbmRpY2F0ZXMgd2hpY2ggYW5pbWF0aW9uc1xuICogbW9kdWxlIGhhcyBiZWVuIGxvYWRlZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFOSU1BVElPTl9NT0RVTEVfVFlQRSA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPCdOb29wQW5pbWF0aW9ucyd8J0Jyb3dzZXJBbmltYXRpb25zJz4oJ0FuaW1hdGlvbk1vZHVsZVR5cGUnKTtcblxuLy8gVE9ETyhjcmlzYmV0byk6IGxpbmsgdG8gQ1NQIGd1aWRlIGhlcmUuXG4vKipcbiAqIFRva2VuIHVzZWQgdG8gY29uZmlndXJlIHRoZSBbQ29udGVudCBTZWN1cml0eSBQb2xpY3ldKGh0dHBzOi8vd2ViLmRldi9zdHJpY3QtY3NwLykgbm9uY2UgdGhhdFxuICogQW5ndWxhciB3aWxsIGFwcGx5IHdoZW4gaW5zZXJ0aW5nIGlubGluZSBzdHlsZXMuIElmIG5vdCBwcm92aWRlZCwgQW5ndWxhciB3aWxsIGxvb2sgdXAgaXRzIHZhbHVlXG4gKiBmcm9tIHRoZSBgbmdDc3BOb25jZWAgYXR0cmlidXRlIG9mIHRoZSBhcHBsaWNhdGlvbiByb290IG5vZGUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQ1NQX05PTkNFID0gbmV3IEluamVjdGlvblRva2VuPHN0cmluZ3xudWxsPignQ1NQIG5vbmNlJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+IHtcbiAgICAvLyBJZGVhbGx5IHdlIHdvdWxkbid0IGhhdmUgdG8gdXNlIGBxdWVyeVNlbGVjdG9yYCBoZXJlIHNpbmNlIHdlIGtub3cgdGhhdCB0aGUgbm9uY2Ugd2lsbCBiZSBvblxuICAgIC8vIHRoZSByb290IG5vZGUsIGJ1dCBiZWNhdXNlIHRoZSB0b2tlbiB2YWx1ZSBpcyB1c2VkIGluIHJlbmRlcmVycywgaXQgaGFzIHRvIGJlIGF2YWlsYWJsZVxuICAgIC8vICp2ZXJ5KiBlYXJseSBpbiB0aGUgYm9vdHN0cmFwcGluZyBwcm9jZXNzLiBUaGlzIHNob3VsZCBiZSBhIGZhaXJseSBzaGFsbG93IHNlYXJjaCwgYmVjYXVzZVxuICAgIC8vIHRoZSBhcHAgd29uJ3QgaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBET00geWV0LiBTb21lIGFwcHJvYWNoZXMgdGhhdCB3ZXJlIGNvbnNpZGVyZWQ6XG4gICAgLy8gMS4gRmluZCB0aGUgcm9vdCBub2RlIHRocm91Z2ggYEFwcGxpY2F0aW9uUmVmLmNvbXBvbmVudHNbaV0ubG9jYXRpb25gIC0gbm9ybWFsbHkgdGhpcyB3b3VsZFxuICAgIC8vIGJlIGVub3VnaCBmb3Igb3VyIHB1cnBvc2VzLCBidXQgdGhlIHRva2VuIGlzIGluamVjdGVkIHZlcnkgZWFybHkgc28gdGhlIGBjb21wb25lbnRzYCBhcnJheVxuICAgIC8vIGlzbid0IHBvcHVsYXRlZCB5ZXQuXG4gICAgLy8gMi4gRmluZCB0aGUgcm9vdCBgTFZpZXdgIHRocm91Z2ggdGhlIGN1cnJlbnQgYExWaWV3YCAtIHJlbmRlcmVycyBhcmUgYSBwcmVyZXF1aXNpdGUgdG9cbiAgICAvLyBjcmVhdGluZyB0aGUgYExWaWV3YC4gVGhpcyBtZWFucyB0aGF0IG5vIGBMVmlld2Agd2lsbCBoYXZlIGJlZW4gZW50ZXJlZCB3aGVuIHRoaXMgZmFjdG9yeSBpc1xuICAgIC8vIGludm9rZWQgZm9yIHRoZSByb290IGNvbXBvbmVudC5cbiAgICAvLyAzLiBIYXZlIHRoZSB0b2tlbiBmYWN0b3J5IHJldHVybiBgKCkgPT4gc3RyaW5nYCB3aGljaCBpcyBpbnZva2VkIHdoZW4gYSBub25jZSBpcyByZXF1ZXN0ZWQgLVxuICAgIC8vIHRoZSBzbGlnaHRseSBsYXRlciBleGVjdXRpb24gZG9lcyBhbGxvdyB1cyB0byBnZXQgYW4gYExWaWV3YCByZWZlcmVuY2UsIGJ1dCB0aGUgZmFjdCB0aGF0XG4gICAgLy8gaXQgaXMgYSBmdW5jdGlvbiBtZWFucyB0aGF0IGl0IGNvdWxkIGJlIGV4ZWN1dGVkIGF0ICphbnkqIHRpbWUgKGluY2x1ZGluZyBpbW1lZGlhdGVseSkgd2hpY2hcbiAgICAvLyBtYXkgbGVhZCB0byB3ZWlyZCBidWdzLlxuICAgIC8vIDQuIEhhdmUgdGhlIGBDb21wb25lbnRGYWN0b3J5YCByZWFkIHRoZSBhdHRyaWJ1dGUgYW5kIHByb3ZpZGUgaXQgdG8gdGhlIGluamVjdG9yIHVuZGVyIHRoZVxuICAgIC8vIGhvb2QgLSBoYXMgdGhlIHNhbWUgcHJvYmxlbSBhcyAjMSBhbmQgIzIgaW4gdGhhdCB0aGUgcmVuZGVyZXIgaXMgdXNlZCB0byBxdWVyeSBmb3IgdGhlIHJvb3RcbiAgICAvLyBub2RlIGFuZCB0aGUgbm9uY2UgdmFsdWUgbmVlZHMgdG8gYmUgYXZhaWxhYmxlIHdoZW4gdGhlIHJlbmRlcmVyIGlzIGNyZWF0ZWQuXG4gICAgcmV0dXJuIGdldERvY3VtZW50KCkuYm9keT8ucXVlcnlTZWxlY3RvcignW25nQ3NwTm9uY2VdJyk/LmdldEF0dHJpYnV0ZSgnbmdDc3BOb25jZScpIHx8IG51bGw7XG4gIH0sXG59KTtcblxuLyoqXG4gKiBBIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0aGUgaW1hZ2UtcmVsYXRlZCBvcHRpb25zLiBDb250YWluczpcbiAqIC0gYnJlYWtwb2ludHM6IEFuIGFycmF5IG9mIGludGVnZXIgYnJlYWtwb2ludHMgdXNlZCB0byBnZW5lcmF0ZVxuICogICAgICBzcmNzZXRzIGZvciByZXNwb25zaXZlIGltYWdlcy5cbiAqIC0gZGlzYWJsZUltYWdlU2l6ZVdhcm5pbmc6IEEgYm9vbGVhbiB2YWx1ZS4gU2V0dGluZyB0aGlzIHRvIHRydWUgd2lsbFxuICogICAgICBkaXNhYmxlIGNvbnNvbGUgd2FybmluZ3MgYWJvdXQgb3ZlcnNpemVkIGltYWdlcy5cbiAqIC0gZGlzYWJsZUltYWdlTGF6eUxvYWRXYXJuaW5nOiBBIGJvb2xlYW4gdmFsdWUuIFNldHRpbmcgdGhpcyB0byB0cnVlIHdpbGxcbiAqICAgICAgZGlzYWJsZSBjb25zb2xlIHdhcm5pbmdzIGFib3V0IExDUCBpbWFnZXMgY29uZmlndXJlZCB3aXRoIGBsb2FkaW5nPVwibGF6eVwiYC5cbiAqIExlYXJuIG1vcmUgYWJvdXQgdGhlIHJlc3BvbnNpdmUgaW1hZ2UgY29uZmlndXJhdGlvbiBpbiBbdGhlIE5nT3B0aW1pemVkSW1hZ2VcbiAqIGd1aWRlXShndWlkZS9pbWFnZS1kaXJlY3RpdmUpLlxuICogTGVhcm4gbW9yZSBhYm91dCBpbWFnZSB3YXJuaW5nIG9wdGlvbnMgaW4gW3RoZSByZWxhdGVkIGVycm9yIHBhZ2VdKGVycm9ycy9ORzA5MTMpLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBJbWFnZUNvbmZpZyA9IHtcbiAgYnJlYWtwb2ludHM/OiBudW1iZXJbXSxcbiAgZGlzYWJsZUltYWdlU2l6ZVdhcm5pbmc/OiBib29sZWFuLFxuICBkaXNhYmxlSW1hZ2VMYXp5TG9hZFdhcm5pbmc/OiBib29sZWFuLFxufTtcblxuZXhwb3J0IGNvbnN0IElNQUdFX0NPTkZJR19ERUZBVUxUUzogSW1hZ2VDb25maWcgPSB7XG4gIGJyZWFrcG9pbnRzOiBbMTYsIDMyLCA0OCwgNjQsIDk2LCAxMjgsIDI1NiwgMzg0LCA2NDAsIDc1MCwgODI4LCAxMDgwLCAxMjAwLCAxOTIwLCAyMDQ4LCAzODQwXSxcbiAgZGlzYWJsZUltYWdlU2l6ZVdhcm5pbmc6IGZhbHNlLFxuICBkaXNhYmxlSW1hZ2VMYXp5TG9hZFdhcm5pbmc6IGZhbHNlLFxufTtcblxuLyoqXG4gKiBJbmplY3Rpb24gdG9rZW4gdGhhdCBjb25maWd1cmVzIHRoZSBpbWFnZSBvcHRpbWl6ZWQgaW1hZ2UgZnVuY3Rpb25hbGl0eS5cbiAqIFNlZSB7QGxpbmsgSW1hZ2VDb25maWd9IGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHBhcmFtZXRlcnMgdGhhdFxuICogY2FuIGJlIHVzZWQuXG4gKlxuICogQHNlZSB7QGxpbmsgTmdPcHRpbWl6ZWRJbWFnZX1cbiAqIEBzZWUge0BsaW5rIEltYWdlQ29uZmlnfVxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgSU1BR0VfQ09ORklHID0gbmV3IEluamVjdGlvblRva2VuPEltYWdlQ29uZmlnPihcbiAgICAnSW1hZ2VDb25maWcnLCB7cHJvdmlkZWRJbjogJ3Jvb3QnLCBmYWN0b3J5OiAoKSA9PiBJTUFHRV9DT05GSUdfREVGQVVMVFN9KTtcbiJdfQ==