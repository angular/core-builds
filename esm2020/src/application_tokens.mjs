/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from './di/injection_token';
import { getDocument } from './render3/interfaces/document';
/**
 * A [DI token](guide/glossary#di-token "DI token definition") representing a string ID, used
 * primarily for prefixing application attributes and CSS styles when
 * {@link ViewEncapsulation#Emulated ViewEncapsulation.Emulated} is being used.
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
        return getDocument().body.querySelector('[ngCspNonce]')?.getAttribute('ngCspNonce') || null;
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fdG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFFMUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFHLElBQUksY0FBYyxDQUFTLE9BQU8sRUFBRTtJQUN4RCxVQUFVLEVBQUUsTUFBTTtJQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztDQUM5QixDQUFDLENBQUM7QUFFSCwyQ0FBMkM7QUFDM0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBRTVCOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLElBQUksY0FBYyxDQUFvQixzQkFBc0IsQ0FBQyxDQUFDO0FBRWxHOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRyxJQUFJLGNBQWMsQ0FBUyxhQUFhLEVBQUU7SUFDbkUsVUFBVSxFQUFFLFVBQVU7SUFDdEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRyx3REFBd0Q7Q0FDcEYsQ0FBQyxDQUFDO0FBRUg7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLGdCQUFnQixHQUFHLElBQUksY0FBYyxDQUFTLCtCQUErQixDQUFDLENBQUM7QUFFNUYsOEZBQThGO0FBQzlGLDJGQUEyRjtBQUMzRiwyREFBMkQ7QUFFM0Q7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUM5QixJQUFJLGNBQWMsQ0FBdUMscUJBQXFCLENBQUMsQ0FBQztBQUVwRiwwQ0FBMEM7QUFDMUM7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFHLElBQUksY0FBYyxDQUFjLFdBQVcsRUFBRTtJQUNwRSxVQUFVLEVBQUUsTUFBTTtJQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFO1FBQ1osK0ZBQStGO1FBQy9GLDBGQUEwRjtRQUMxRiw2RkFBNkY7UUFDN0Ysc0ZBQXNGO1FBQ3RGLDhGQUE4RjtRQUM5Riw2RkFBNkY7UUFDN0YsdUJBQXVCO1FBQ3ZCLHlGQUF5RjtRQUN6RiwrRkFBK0Y7UUFDL0Ysa0NBQWtDO1FBQ2xDLCtGQUErRjtRQUMvRiw0RkFBNEY7UUFDNUYsK0ZBQStGO1FBQy9GLDBCQUEwQjtRQUMxQiw2RkFBNkY7UUFDN0YsOEZBQThGO1FBQzlGLCtFQUErRTtRQUMvRSxPQUFPLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLEVBQUUsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQztJQUM5RixDQUFDO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4vcmVuZGVyMy9pbnRlcmZhY2VzL2RvY3VtZW50JztcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHJlcHJlc2VudGluZyBhIHN0cmluZyBJRCwgdXNlZFxuICogcHJpbWFyaWx5IGZvciBwcmVmaXhpbmcgYXBwbGljYXRpb24gYXR0cmlidXRlcyBhbmQgQ1NTIHN0eWxlcyB3aGVuXG4gKiB7QGxpbmsgVmlld0VuY2Fwc3VsYXRpb24jRW11bGF0ZWQgVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWR9IGlzIGJlaW5nIHVzZWQuXG4gKlxuICogVGhlIHRva2VuIGlzIG5lZWRlZCBpbiBjYXNlcyB3aGVuIG11bHRpcGxlIGFwcGxpY2F0aW9ucyBhcmUgYm9vdHN0cmFwcGVkIG9uIGEgcGFnZVxuICogKGZvciBleGFtcGxlLCB1c2luZyBgYm9vdHN0cmFwQXBwbGljYXRpb25gIGNhbGxzKS4gSW4gdGhpcyBjYXNlLCBlbnN1cmUgdGhhdCB0aG9zZSBhcHBsaWNhdGlvbnNcbiAqIGhhdmUgZGlmZmVyZW50IGBBUFBfSURgIHZhbHVlIHNldHVwLiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKENvbXBvbmVudEEsIHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgeyBwcm92aWRlOiBBUFBfSUQsIHVzZVZhbHVlOiAnYXBwLWEnIH0sXG4gKiAgICAgLy8gLi4uIG90aGVyIHByb3ZpZGVycyAuLi5cbiAqICAgXVxuICogfSk7XG4gKlxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQ29tcG9uZW50Qiwge1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICB7IHByb3ZpZGU6IEFQUF9JRCwgdXNlVmFsdWU6ICdhcHAtYicgfSxcbiAqICAgICAvLyAuLi4gb3RoZXIgcHJvdmlkZXJzIC4uLlxuICogICBdXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEJ5IGRlZmF1bHQsIHdoZW4gdGhlcmUgaXMgb25seSBvbmUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkLCB5b3UgZG9uJ3QgbmVlZCB0byBwcm92aWRlIHRoZVxuICogYEFQUF9JRGAgdG9rZW4gKHRoZSBgbmdgIHdpbGwgYmUgdXNlZCBhcyBhbiBhcHAgSUQpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9JRCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdBcHBJZCcsIHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICBmYWN0b3J5OiAoKSA9PiBERUZBVUxUX0FQUF9JRCxcbn0pO1xuXG4vKiogRGVmYXVsdCB2YWx1ZSBvZiB0aGUgYEFQUF9JRGAgdG9rZW4uICovXG5jb25zdCBERUZBVUxUX0FQUF9JRCA9ICduZyc7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IGlzIGV4ZWN1dGVkIHdoZW4gYSBwbGF0Zm9ybSBpcyBpbml0aWFsaXplZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX0lOSVRJQUxJWkVSID0gbmV3IEluamVjdGlvblRva2VuPEFycmF5PCgpID0+IHZvaWQ+PignUGxhdGZvcm0gSW5pdGlhbGl6ZXInKTtcblxuLyoqXG4gKiBBIHRva2VuIHRoYXQgaW5kaWNhdGVzIGFuIG9wYXF1ZSBwbGF0Zm9ybSBJRC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX0lEID0gbmV3IEluamVjdGlvblRva2VuPE9iamVjdD4oJ1BsYXRmb3JtIElEJywge1xuICBwcm92aWRlZEluOiAncGxhdGZvcm0nLFxuICBmYWN0b3J5OiAoKSA9PiAndW5rbm93bicsICAvLyBzZXQgYSBkZWZhdWx0IHBsYXRmb3JtIG5hbWUsIHdoZW4gbm9uZSBzZXQgZXhwbGljaXRseVxufSk7XG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSB0aGF0IGluZGljYXRlcyB0aGUgcm9vdCBkaXJlY3Rvcnkgb2ZcbiAqIHRoZSBhcHBsaWNhdGlvblxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgUEFDS0FHRV9ST09UX1VSTCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdBcHBsaWNhdGlvbiBQYWNrYWdlcyBSb290IFVSTCcpO1xuXG4vLyBXZSBrZWVwIHRoaXMgdG9rZW4gaGVyZSwgcmF0aGVyIHRoYW4gdGhlIGFuaW1hdGlvbnMgcGFja2FnZSwgc28gdGhhdCBtb2R1bGVzIHRoYXQgb25seSBjYXJlXG4vLyBhYm91dCB3aGljaCBhbmltYXRpb25zIG1vZHVsZSBpcyBsb2FkZWQgKGUuZy4gdGhlIENESykgY2FuIHJldHJpZXZlIGl0IHdpdGhvdXQgaGF2aW5nIHRvXG4vLyBpbmNsdWRlIGV4dHJhIGRlcGVuZGVuY2llcy4gU2VlICM0NDk3MCBmb3IgbW9yZSBjb250ZXh0LlxuXG4vKipcbiAqIEEgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbiBcIkRJIHRva2VuIGRlZmluaXRpb25cIikgdGhhdCBpbmRpY2F0ZXMgd2hpY2ggYW5pbWF0aW9uc1xuICogbW9kdWxlIGhhcyBiZWVuIGxvYWRlZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFOSU1BVElPTl9NT0RVTEVfVFlQRSA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPCdOb29wQW5pbWF0aW9ucyd8J0Jyb3dzZXJBbmltYXRpb25zJz4oJ0FuaW1hdGlvbk1vZHVsZVR5cGUnKTtcblxuLy8gVE9ETyhjcmlzYmV0byk6IGxpbmsgdG8gQ1NQIGd1aWRlIGhlcmUuXG4vKipcbiAqIFRva2VuIHVzZWQgdG8gY29uZmlndXJlIHRoZSBbQ29udGVudCBTZWN1cml0eSBQb2xpY3ldKGh0dHBzOi8vd2ViLmRldi9zdHJpY3QtY3NwLykgbm9uY2UgdGhhdFxuICogQW5ndWxhciB3aWxsIGFwcGx5IHdoZW4gaW5zZXJ0aW5nIGlubGluZSBzdHlsZXMuIElmIG5vdCBwcm92aWRlZCwgQW5ndWxhciB3aWxsIGxvb2sgdXAgaXRzIHZhbHVlXG4gKiBmcm9tIHRoZSBgbmdDc3BOb25jZWAgYXR0cmlidXRlIG9mIHRoZSBhcHBsaWNhdGlvbiByb290IG5vZGUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQ1NQX05PTkNFID0gbmV3IEluamVjdGlvblRva2VuPHN0cmluZ3xudWxsPignQ1NQIG5vbmNlJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+IHtcbiAgICAvLyBJZGVhbGx5IHdlIHdvdWxkbid0IGhhdmUgdG8gdXNlIGBxdWVyeVNlbGVjdG9yYCBoZXJlIHNpbmNlIHdlIGtub3cgdGhhdCB0aGUgbm9uY2Ugd2lsbCBiZSBvblxuICAgIC8vIHRoZSByb290IG5vZGUsIGJ1dCBiZWNhdXNlIHRoZSB0b2tlbiB2YWx1ZSBpcyB1c2VkIGluIHJlbmRlcmVycywgaXQgaGFzIHRvIGJlIGF2YWlsYWJsZVxuICAgIC8vICp2ZXJ5KiBlYXJseSBpbiB0aGUgYm9vdHN0cmFwcGluZyBwcm9jZXNzLiBUaGlzIHNob3VsZCBiZSBhIGZhaXJseSBzaGFsbG93IHNlYXJjaCwgYmVjYXVzZVxuICAgIC8vIHRoZSBhcHAgd29uJ3QgaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBET00geWV0LiBTb21lIGFwcHJvYWNoZXMgdGhhdCB3ZXJlIGNvbnNpZGVyZWQ6XG4gICAgLy8gMS4gRmluZCB0aGUgcm9vdCBub2RlIHRocm91Z2ggYEFwcGxpY2F0aW9uUmVmLmNvbXBvbmVudHNbaV0ubG9jYXRpb25gIC0gbm9ybWFsbHkgdGhpcyB3b3VsZFxuICAgIC8vIGJlIGVub3VnaCBmb3Igb3VyIHB1cnBvc2VzLCBidXQgdGhlIHRva2VuIGlzIGluamVjdGVkIHZlcnkgZWFybHkgc28gdGhlIGBjb21wb25lbnRzYCBhcnJheVxuICAgIC8vIGlzbid0IHBvcHVsYXRlZCB5ZXQuXG4gICAgLy8gMi4gRmluZCB0aGUgcm9vdCBgTFZpZXdgIHRocm91Z2ggdGhlIGN1cnJlbnQgYExWaWV3YCAtIHJlbmRlcmVycyBhcmUgYSBwcmVyZXF1aXNpdGUgdG9cbiAgICAvLyBjcmVhdGluZyB0aGUgYExWaWV3YC4gVGhpcyBtZWFucyB0aGF0IG5vIGBMVmlld2Agd2lsbCBoYXZlIGJlZW4gZW50ZXJlZCB3aGVuIHRoaXMgZmFjdG9yeSBpc1xuICAgIC8vIGludm9rZWQgZm9yIHRoZSByb290IGNvbXBvbmVudC5cbiAgICAvLyAzLiBIYXZlIHRoZSB0b2tlbiBmYWN0b3J5IHJldHVybiBgKCkgPT4gc3RyaW5nYCB3aGljaCBpcyBpbnZva2VkIHdoZW4gYSBub25jZSBpcyByZXF1ZXN0ZWQgLVxuICAgIC8vIHRoZSBzbGlnaHRseSBsYXRlciBleGVjdXRpb24gZG9lcyBhbGxvdyB1cyB0byBnZXQgYW4gYExWaWV3YCByZWZlcmVuY2UsIGJ1dCB0aGUgZmFjdCB0aGF0XG4gICAgLy8gaXQgaXMgYSBmdW5jdGlvbiBtZWFucyB0aGF0IGl0IGNvdWxkIGJlIGV4ZWN1dGVkIGF0ICphbnkqIHRpbWUgKGluY2x1ZGluZyBpbW1lZGlhdGVseSkgd2hpY2hcbiAgICAvLyBtYXkgbGVhZCB0byB3ZWlyZCBidWdzLlxuICAgIC8vIDQuIEhhdmUgdGhlIGBDb21wb25lbnRGYWN0b3J5YCByZWFkIHRoZSBhdHRyaWJ1dGUgYW5kIHByb3ZpZGUgaXQgdG8gdGhlIGluamVjdG9yIHVuZGVyIHRoZVxuICAgIC8vIGhvb2QgLSBoYXMgdGhlIHNhbWUgcHJvYmxlbSBhcyAjMSBhbmQgIzIgaW4gdGhhdCB0aGUgcmVuZGVyZXIgaXMgdXNlZCB0byBxdWVyeSBmb3IgdGhlIHJvb3RcbiAgICAvLyBub2RlIGFuZCB0aGUgbm9uY2UgdmFsdWUgbmVlZHMgdG8gYmUgYXZhaWxhYmxlIHdoZW4gdGhlIHJlbmRlcmVyIGlzIGNyZWF0ZWQuXG4gICAgcmV0dXJuIGdldERvY3VtZW50KCkuYm9keS5xdWVyeVNlbGVjdG9yKCdbbmdDc3BOb25jZV0nKT8uZ2V0QXR0cmlidXRlKCduZ0NzcE5vbmNlJykgfHwgbnVsbDtcbiAgfSxcbn0pO1xuIl19