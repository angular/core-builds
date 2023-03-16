/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from './di/injection_token';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fdG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fdG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVwRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7QUFDSCxNQUFNLENBQUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxjQUFjLENBQVMsT0FBTyxFQUFFO0lBQ3hELFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO0NBQzlCLENBQUMsQ0FBQztBQUVILDJDQUEyQztBQUMzQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFFNUI7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxjQUFjLENBQW9CLHNCQUFzQixDQUFDLENBQUM7QUFFbEc7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHLElBQUksY0FBYyxDQUFTLGFBQWEsRUFBRTtJQUNuRSxVQUFVLEVBQUUsVUFBVTtJQUN0QixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFHLHdEQUF3RDtDQUNwRixDQUFDLENBQUM7QUFFSDs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQVMsK0JBQStCLENBQUMsQ0FBQztBQUU1Riw4RkFBOEY7QUFDOUYsMkZBQTJGO0FBQzNGLDJEQUEyRDtBQUUzRDs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQzlCLElBQUksY0FBYyxDQUF1QyxxQkFBcUIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vZGkvaW5qZWN0aW9uX3Rva2VuJztcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHJlcHJlc2VudGluZyBhIHN0cmluZyBJRCwgdXNlZFxuICogcHJpbWFyaWx5IGZvciBwcmVmaXhpbmcgYXBwbGljYXRpb24gYXR0cmlidXRlcyBhbmQgQ1NTIHN0eWxlcyB3aGVuXG4gKiB7QGxpbmsgVmlld0VuY2Fwc3VsYXRpb24jRW11bGF0ZWQgVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWR9IGlzIGJlaW5nIHVzZWQuXG4gKlxuICogVGhlIHRva2VuIGlzIG5lZWRlZCBpbiBjYXNlcyB3aGVuIG11bHRpcGxlIGFwcGxpY2F0aW9ucyBhcmUgYm9vdHN0cmFwcGVkIG9uIGEgcGFnZVxuICogKGZvciBleGFtcGxlLCB1c2luZyBgYm9vdHN0cmFwQXBwbGljYXRpb25gIGNhbGxzKS4gSW4gdGhpcyBjYXNlLCBlbnN1cmUgdGhhdCB0aG9zZSBhcHBsaWNhdGlvbnNcbiAqIGhhdmUgZGlmZmVyZW50IGBBUFBfSURgIHZhbHVlIHNldHVwLiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKENvbXBvbmVudEEsIHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgeyBwcm92aWRlOiBBUFBfSUQsIHVzZVZhbHVlOiAnYXBwLWEnIH0sXG4gKiAgICAgLy8gLi4uIG90aGVyIHByb3ZpZGVycyAuLi5cbiAqICAgXVxuICogfSk7XG4gKlxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQ29tcG9uZW50Qiwge1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICB7IHByb3ZpZGU6IEFQUF9JRCwgdXNlVmFsdWU6ICdhcHAtYicgfSxcbiAqICAgICAvLyAuLi4gb3RoZXIgcHJvdmlkZXJzIC4uLlxuICogICBdXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEJ5IGRlZmF1bHQsIHdoZW4gdGhlcmUgaXMgb25seSBvbmUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkLCB5b3UgZG9uJ3QgbmVlZCB0byBwcm92aWRlIHRoZVxuICogYEFQUF9JRGAgdG9rZW4gKHRoZSBgbmdgIHdpbGwgYmUgdXNlZCBhcyBhbiBhcHAgSUQpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9JRCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdBcHBJZCcsIHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICBmYWN0b3J5OiAoKSA9PiBERUZBVUxUX0FQUF9JRCxcbn0pO1xuXG4vKiogRGVmYXVsdCB2YWx1ZSBvZiB0aGUgYEFQUF9JRGAgdG9rZW4uICovXG5jb25zdCBERUZBVUxUX0FQUF9JRCA9ICduZyc7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IGlzIGV4ZWN1dGVkIHdoZW4gYSBwbGF0Zm9ybSBpcyBpbml0aWFsaXplZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX0lOSVRJQUxJWkVSID0gbmV3IEluamVjdGlvblRva2VuPEFycmF5PCgpID0+IHZvaWQ+PignUGxhdGZvcm0gSW5pdGlhbGl6ZXInKTtcblxuLyoqXG4gKiBBIHRva2VuIHRoYXQgaW5kaWNhdGVzIGFuIG9wYXF1ZSBwbGF0Zm9ybSBJRC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX0lEID0gbmV3IEluamVjdGlvblRva2VuPE9iamVjdD4oJ1BsYXRmb3JtIElEJywge1xuICBwcm92aWRlZEluOiAncGxhdGZvcm0nLFxuICBmYWN0b3J5OiAoKSA9PiAndW5rbm93bicsICAvLyBzZXQgYSBkZWZhdWx0IHBsYXRmb3JtIG5hbWUsIHdoZW4gbm9uZSBzZXQgZXhwbGljaXRseVxufSk7XG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSB0aGF0IGluZGljYXRlcyB0aGUgcm9vdCBkaXJlY3Rvcnkgb2ZcbiAqIHRoZSBhcHBsaWNhdGlvblxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgUEFDS0FHRV9ST09UX1VSTCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdBcHBsaWNhdGlvbiBQYWNrYWdlcyBSb290IFVSTCcpO1xuXG4vLyBXZSBrZWVwIHRoaXMgdG9rZW4gaGVyZSwgcmF0aGVyIHRoYW4gdGhlIGFuaW1hdGlvbnMgcGFja2FnZSwgc28gdGhhdCBtb2R1bGVzIHRoYXQgb25seSBjYXJlXG4vLyBhYm91dCB3aGljaCBhbmltYXRpb25zIG1vZHVsZSBpcyBsb2FkZWQgKGUuZy4gdGhlIENESykgY2FuIHJldHJpZXZlIGl0IHdpdGhvdXQgaGF2aW5nIHRvXG4vLyBpbmNsdWRlIGV4dHJhIGRlcGVuZGVuY2llcy4gU2VlICM0NDk3MCBmb3IgbW9yZSBjb250ZXh0LlxuXG4vKipcbiAqIEEgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbiBcIkRJIHRva2VuIGRlZmluaXRpb25cIikgdGhhdCBpbmRpY2F0ZXMgd2hpY2ggYW5pbWF0aW9uc1xuICogbW9kdWxlIGhhcyBiZWVuIGxvYWRlZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFOSU1BVElPTl9NT0RVTEVfVFlQRSA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPCdOb29wQW5pbWF0aW9ucyd8J0Jyb3dzZXJBbmltYXRpb25zJz4oJ0FuaW1hdGlvbk1vZHVsZVR5cGUnKTtcbiJdfQ==