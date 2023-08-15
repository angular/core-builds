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
/**
 * Internal token to collect all SSR-related features enabled for this application.
 *
 * Note: the token is in `core` to let other packages register features (the `core`
 * package is imported in other packages).
 */
export const ENABLED_SSR_FEATURES = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'ENABLED_SSR_FEATURES' : '', {
    providedIn: 'root',
    factory: () => new Set(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fdG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFFMUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFHLElBQUksY0FBYyxDQUFTLE9BQU8sRUFBRTtJQUN4RCxVQUFVLEVBQUUsTUFBTTtJQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztDQUM5QixDQUFDLENBQUM7QUFFSCwyQ0FBMkM7QUFDM0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBRTVCOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUM3QixJQUFJLGNBQWMsQ0FBNEIsc0JBQXNCLENBQUMsQ0FBQztBQUUxRTs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxjQUFjLENBQVMsYUFBYSxFQUFFO0lBQ25FLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUcsd0RBQXdEO0NBQ3BGLENBQUMsQ0FBQztBQUVIOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQVMsK0JBQStCLENBQUMsQ0FBQztBQUU1Riw4RkFBOEY7QUFDOUYsMkZBQTJGO0FBQzNGLDJEQUEyRDtBQUUzRDs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQzlCLElBQUksY0FBYyxDQUF1QyxxQkFBcUIsQ0FBQyxDQUFDO0FBRXBGLDBDQUEwQztBQUMxQzs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxjQUFjLENBQWMsV0FBVyxFQUFFO0lBQ3BFLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUU7UUFDWiwrRkFBK0Y7UUFDL0YsMEZBQTBGO1FBQzFGLDZGQUE2RjtRQUM3RixzRkFBc0Y7UUFDdEYsOEZBQThGO1FBQzlGLDZGQUE2RjtRQUM3Rix1QkFBdUI7UUFDdkIseUZBQXlGO1FBQ3pGLCtGQUErRjtRQUMvRixrQ0FBa0M7UUFDbEMsK0ZBQStGO1FBQy9GLDRGQUE0RjtRQUM1RiwrRkFBK0Y7UUFDL0YsMEJBQTBCO1FBQzFCLDZGQUE2RjtRQUM3Riw4RkFBOEY7UUFDOUYsK0VBQStFO1FBQy9FLE9BQU8sV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxjQUFjLENBQUMsRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDO0lBQy9GLENBQUM7Q0FDRixDQUFDLENBQUM7QUFFSDs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLElBQUksY0FBYyxDQUNsRCxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUM3RSxVQUFVLEVBQUUsTUFBTTtJQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUU7Q0FDekIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4vcmVuZGVyMy9pbnRlcmZhY2VzL2RvY3VtZW50JztcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHJlcHJlc2VudGluZyBhIHN0cmluZyBJRCwgdXNlZFxuICogcHJpbWFyaWx5IGZvciBwcmVmaXhpbmcgYXBwbGljYXRpb24gYXR0cmlidXRlcyBhbmQgQ1NTIHN0eWxlcyB3aGVuXG4gKiB7QGxpbmsgVmlld0VuY2Fwc3VsYXRpb24jRW11bGF0ZWR9IGlzIGJlaW5nIHVzZWQuXG4gKlxuICogVGhlIHRva2VuIGlzIG5lZWRlZCBpbiBjYXNlcyB3aGVuIG11bHRpcGxlIGFwcGxpY2F0aW9ucyBhcmUgYm9vdHN0cmFwcGVkIG9uIGEgcGFnZVxuICogKGZvciBleGFtcGxlLCB1c2luZyBgYm9vdHN0cmFwQXBwbGljYXRpb25gIGNhbGxzKS4gSW4gdGhpcyBjYXNlLCBlbnN1cmUgdGhhdCB0aG9zZSBhcHBsaWNhdGlvbnNcbiAqIGhhdmUgZGlmZmVyZW50IGBBUFBfSURgIHZhbHVlIHNldHVwLiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKENvbXBvbmVudEEsIHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgeyBwcm92aWRlOiBBUFBfSUQsIHVzZVZhbHVlOiAnYXBwLWEnIH0sXG4gKiAgICAgLy8gLi4uIG90aGVyIHByb3ZpZGVycyAuLi5cbiAqICAgXVxuICogfSk7XG4gKlxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQ29tcG9uZW50Qiwge1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICB7IHByb3ZpZGU6IEFQUF9JRCwgdXNlVmFsdWU6ICdhcHAtYicgfSxcbiAqICAgICAvLyAuLi4gb3RoZXIgcHJvdmlkZXJzIC4uLlxuICogICBdXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEJ5IGRlZmF1bHQsIHdoZW4gdGhlcmUgaXMgb25seSBvbmUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkLCB5b3UgZG9uJ3QgbmVlZCB0byBwcm92aWRlIHRoZVxuICogYEFQUF9JRGAgdG9rZW4gKHRoZSBgbmdgIHdpbGwgYmUgdXNlZCBhcyBhbiBhcHAgSUQpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9JRCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdBcHBJZCcsIHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICBmYWN0b3J5OiAoKSA9PiBERUZBVUxUX0FQUF9JRCxcbn0pO1xuXG4vKiogRGVmYXVsdCB2YWx1ZSBvZiB0aGUgYEFQUF9JRGAgdG9rZW4uICovXG5jb25zdCBERUZBVUxUX0FQUF9JRCA9ICduZyc7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IGlzIGV4ZWN1dGVkIHdoZW4gYSBwbGF0Zm9ybSBpcyBpbml0aWFsaXplZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX0lOSVRJQUxJWkVSID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48UmVhZG9ubHlBcnJheTwoKSA9PiB2b2lkPj4oJ1BsYXRmb3JtIEluaXRpYWxpemVyJyk7XG5cbi8qKlxuICogQSB0b2tlbiB0aGF0IGluZGljYXRlcyBhbiBvcGFxdWUgcGxhdGZvcm0gSUQuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBQTEFURk9STV9JRCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxPYmplY3Q+KCdQbGF0Zm9ybSBJRCcsIHtcbiAgcHJvdmlkZWRJbjogJ3BsYXRmb3JtJyxcbiAgZmFjdG9yeTogKCkgPT4gJ3Vua25vd24nLCAgLy8gc2V0IGEgZGVmYXVsdCBwbGF0Zm9ybSBuYW1lLCB3aGVuIG5vbmUgc2V0IGV4cGxpY2l0bHlcbn0pO1xuXG4vKipcbiAqIEEgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbiBcIkRJIHRva2VuIGRlZmluaXRpb25cIikgdGhhdCBpbmRpY2F0ZXMgdGhlIHJvb3QgZGlyZWN0b3J5IG9mXG4gKiB0aGUgYXBwbGljYXRpb25cbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXByZWNhdGVkXG4gKi9cbmV4cG9ydCBjb25zdCBQQUNLQUdFX1JPT1RfVVJMID0gbmV3IEluamVjdGlvblRva2VuPHN0cmluZz4oJ0FwcGxpY2F0aW9uIFBhY2thZ2VzIFJvb3QgVVJMJyk7XG5cbi8vIFdlIGtlZXAgdGhpcyB0b2tlbiBoZXJlLCByYXRoZXIgdGhhbiB0aGUgYW5pbWF0aW9ucyBwYWNrYWdlLCBzbyB0aGF0IG1vZHVsZXMgdGhhdCBvbmx5IGNhcmVcbi8vIGFib3V0IHdoaWNoIGFuaW1hdGlvbnMgbW9kdWxlIGlzIGxvYWRlZCAoZS5nLiB0aGUgQ0RLKSBjYW4gcmV0cmlldmUgaXQgd2l0aG91dCBoYXZpbmcgdG9cbi8vIGluY2x1ZGUgZXh0cmEgZGVwZW5kZW5jaWVzLiBTZWUgIzQ0OTcwIGZvciBtb3JlIGNvbnRleHQuXG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSB0aGF0IGluZGljYXRlcyB3aGljaCBhbmltYXRpb25zXG4gKiBtb2R1bGUgaGFzIGJlZW4gbG9hZGVkLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQU5JTUFUSU9OX01PRFVMRV9UWVBFID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48J05vb3BBbmltYXRpb25zJ3wnQnJvd3NlckFuaW1hdGlvbnMnPignQW5pbWF0aW9uTW9kdWxlVHlwZScpO1xuXG4vLyBUT0RPKGNyaXNiZXRvKTogbGluayB0byBDU1AgZ3VpZGUgaGVyZS5cbi8qKlxuICogVG9rZW4gdXNlZCB0byBjb25maWd1cmUgdGhlIFtDb250ZW50IFNlY3VyaXR5IFBvbGljeV0oaHR0cHM6Ly93ZWIuZGV2L3N0cmljdC1jc3AvKSBub25jZSB0aGF0XG4gKiBBbmd1bGFyIHdpbGwgYXBwbHkgd2hlbiBpbnNlcnRpbmcgaW5saW5lIHN0eWxlcy4gSWYgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHdpbGwgbG9vayB1cCBpdHMgdmFsdWVcbiAqIGZyb20gdGhlIGBuZ0NzcE5vbmNlYCBhdHRyaWJ1dGUgb2YgdGhlIGFwcGxpY2F0aW9uIHJvb3Qgbm9kZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBDU1BfTk9OQ0UgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nfG51bGw+KCdDU1Agbm9uY2UnLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4ge1xuICAgIC8vIElkZWFsbHkgd2Ugd291bGRuJ3QgaGF2ZSB0byB1c2UgYHF1ZXJ5U2VsZWN0b3JgIGhlcmUgc2luY2Ugd2Uga25vdyB0aGF0IHRoZSBub25jZSB3aWxsIGJlIG9uXG4gICAgLy8gdGhlIHJvb3Qgbm9kZSwgYnV0IGJlY2F1c2UgdGhlIHRva2VuIHZhbHVlIGlzIHVzZWQgaW4gcmVuZGVyZXJzLCBpdCBoYXMgdG8gYmUgYXZhaWxhYmxlXG4gICAgLy8gKnZlcnkqIGVhcmx5IGluIHRoZSBib290c3RyYXBwaW5nIHByb2Nlc3MuIFRoaXMgc2hvdWxkIGJlIGEgZmFpcmx5IHNoYWxsb3cgc2VhcmNoLCBiZWNhdXNlXG4gICAgLy8gdGhlIGFwcCB3b24ndCBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIERPTSB5ZXQuIFNvbWUgYXBwcm9hY2hlcyB0aGF0IHdlcmUgY29uc2lkZXJlZDpcbiAgICAvLyAxLiBGaW5kIHRoZSByb290IG5vZGUgdGhyb3VnaCBgQXBwbGljYXRpb25SZWYuY29tcG9uZW50c1tpXS5sb2NhdGlvbmAgLSBub3JtYWxseSB0aGlzIHdvdWxkXG4gICAgLy8gYmUgZW5vdWdoIGZvciBvdXIgcHVycG9zZXMsIGJ1dCB0aGUgdG9rZW4gaXMgaW5qZWN0ZWQgdmVyeSBlYXJseSBzbyB0aGUgYGNvbXBvbmVudHNgIGFycmF5XG4gICAgLy8gaXNuJ3QgcG9wdWxhdGVkIHlldC5cbiAgICAvLyAyLiBGaW5kIHRoZSByb290IGBMVmlld2AgdGhyb3VnaCB0aGUgY3VycmVudCBgTFZpZXdgIC0gcmVuZGVyZXJzIGFyZSBhIHByZXJlcXVpc2l0ZSB0b1xuICAgIC8vIGNyZWF0aW5nIHRoZSBgTFZpZXdgLiBUaGlzIG1lYW5zIHRoYXQgbm8gYExWaWV3YCB3aWxsIGhhdmUgYmVlbiBlbnRlcmVkIHdoZW4gdGhpcyBmYWN0b3J5IGlzXG4gICAgLy8gaW52b2tlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50LlxuICAgIC8vIDMuIEhhdmUgdGhlIHRva2VuIGZhY3RvcnkgcmV0dXJuIGAoKSA9PiBzdHJpbmdgIHdoaWNoIGlzIGludm9rZWQgd2hlbiBhIG5vbmNlIGlzIHJlcXVlc3RlZCAtXG4gICAgLy8gdGhlIHNsaWdodGx5IGxhdGVyIGV4ZWN1dGlvbiBkb2VzIGFsbG93IHVzIHRvIGdldCBhbiBgTFZpZXdgIHJlZmVyZW5jZSwgYnV0IHRoZSBmYWN0IHRoYXRcbiAgICAvLyBpdCBpcyBhIGZ1bmN0aW9uIG1lYW5zIHRoYXQgaXQgY291bGQgYmUgZXhlY3V0ZWQgYXQgKmFueSogdGltZSAoaW5jbHVkaW5nIGltbWVkaWF0ZWx5KSB3aGljaFxuICAgIC8vIG1heSBsZWFkIHRvIHdlaXJkIGJ1Z3MuXG4gICAgLy8gNC4gSGF2ZSB0aGUgYENvbXBvbmVudEZhY3RvcnlgIHJlYWQgdGhlIGF0dHJpYnV0ZSBhbmQgcHJvdmlkZSBpdCB0byB0aGUgaW5qZWN0b3IgdW5kZXIgdGhlXG4gICAgLy8gaG9vZCAtIGhhcyB0aGUgc2FtZSBwcm9ibGVtIGFzICMxIGFuZCAjMiBpbiB0aGF0IHRoZSByZW5kZXJlciBpcyB1c2VkIHRvIHF1ZXJ5IGZvciB0aGUgcm9vdFxuICAgIC8vIG5vZGUgYW5kIHRoZSBub25jZSB2YWx1ZSBuZWVkcyB0byBiZSBhdmFpbGFibGUgd2hlbiB0aGUgcmVuZGVyZXIgaXMgY3JlYXRlZC5cbiAgICByZXR1cm4gZ2V0RG9jdW1lbnQoKS5ib2R5Py5xdWVyeVNlbGVjdG9yKCdbbmdDc3BOb25jZV0nKT8uZ2V0QXR0cmlidXRlKCduZ0NzcE5vbmNlJykgfHwgbnVsbDtcbiAgfSxcbn0pO1xuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHRvIGNvbGxlY3QgYWxsIFNTUi1yZWxhdGVkIGZlYXR1cmVzIGVuYWJsZWQgZm9yIHRoaXMgYXBwbGljYXRpb24uXG4gKlxuICogTm90ZTogdGhlIHRva2VuIGlzIGluIGBjb3JlYCB0byBsZXQgb3RoZXIgcGFja2FnZXMgcmVnaXN0ZXIgZmVhdHVyZXMgKHRoZSBgY29yZWBcbiAqIHBhY2thZ2UgaXMgaW1wb3J0ZWQgaW4gb3RoZXIgcGFja2FnZXMpLlxuICovXG5leHBvcnQgY29uc3QgRU5BQkxFRF9TU1JfRkVBVFVSRVMgPSBuZXcgSW5qZWN0aW9uVG9rZW48U2V0PHN0cmluZz4+KFxuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID8gJ0VOQUJMRURfU1NSX0ZFQVRVUkVTJyA6ICcnLCB7XG4gICAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgICBmYWN0b3J5OiAoKSA9PiBuZXcgU2V0KCksXG4gICAgfSk7XG4iXX0=