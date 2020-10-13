/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview
 * A module to facilitate use of a Trusted Types policy internally within
 * Angular. It lazily constructs the Trusted Types policy, providing helper
 * utilities for promoting strings to Trusted Types. When Trusted Types are not
 * available, strings are used as a fallback.
 * @security All use of this module is security-sensitive and should go through
 * security review.
 */
import { global } from '../global';
/**
 * The Trusted Types policy, or null if Trusted Types are not
 * enabled/supported, or undefined if the policy has not been created yet.
 */
let policy;
/**
 * Returns the Trusted Types policy, or null if Trusted Types are not
 * enabled/supported. The first call to this function will create the policy.
 */
function getPolicy() {
    if (policy === undefined) {
        policy = null;
        if (global.trustedTypes) {
            try {
                policy = global.trustedTypes.createPolicy('angular', {
                    createHTML: (s) => s,
                    createScript: (s) => s,
                    createScriptURL: (s) => s,
                });
            }
            catch (_a) {
                // trustedTypes.createPolicy throws if called with a name that is
                // already registered, even in report-only mode. Until the API changes,
                // catch the error not to break the applications functionally. In such
                // cases, the code will fall back to using strings.
            }
        }
    }
    return policy;
}
/**
 * Unsafely promote a string to a TrustedHTML, falling back to strings when
 * Trusted Types are not available.
 * @security This is a security-sensitive function; any use of this function
 * must go through security review. In particular, it must be assured that the
 * provided string will never cause an XSS vulnerability if used in a context
 * that will be interpreted as HTML by a browser, e.g. when assigning to
 * element.innerHTML.
 */
export function trustedHTMLFromString(html) {
    var _a;
    return ((_a = getPolicy()) === null || _a === void 0 ? void 0 : _a.createHTML(html)) || html;
}
/**
 * Unsafely promote a string to a TrustedScript, falling back to strings when
 * Trusted Types are not available.
 * @security In particular, it must be assured that the provided string will
 * never cause an XSS vulnerability if used in a context that will be
 * interpreted and executed as a script by a browser, e.g. when calling eval.
 */
export function trustedScriptFromString(script) {
    var _a;
    return ((_a = getPolicy()) === null || _a === void 0 ? void 0 : _a.createScript(script)) || script;
}
/**
 * Unsafely promote a string to a TrustedScriptURL, falling back to strings
 * when Trusted Types are not available.
 * @security This is a security-sensitive function; any use of this function
 * must go through security review. In particular, it must be assured that the
 * provided string will never cause an XSS vulnerability if used in a context
 * that will cause a browser to load and execute a resource, e.g. when
 * assigning to script.src.
 */
export function trustedScriptURLFromString(url) {
    var _a;
    return ((_a = getPolicy()) === null || _a === void 0 ? void 0 : _a.createScriptURL(url)) || url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1c3RlZF90eXBlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3V0aWwvc2VjdXJpdHkvdHJ1c3RlZF90eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7R0FRRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFakM7OztHQUdHO0FBQ0gsSUFBSSxNQUF3QyxDQUFDO0FBRTdDOzs7R0FHRztBQUNILFNBQVMsU0FBUztJQUNoQixJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7UUFDeEIsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNkLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRTtZQUN2QixJQUFJO2dCQUNGLE1BQU0sR0FBSSxNQUFNLENBQUMsWUFBeUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFO29CQUNqRixVQUFVLEVBQUUsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzVCLFlBQVksRUFBRSxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDOUIsZUFBZSxFQUFFLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2lCQUNsQyxDQUFDLENBQUM7YUFDSjtZQUFDLFdBQU07Z0JBQ04saUVBQWlFO2dCQUNqRSx1RUFBdUU7Z0JBQ3ZFLHNFQUFzRTtnQkFDdEUsbURBQW1EO2FBQ3BEO1NBQ0Y7S0FDRjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxJQUFZOztJQUNoRCxPQUFPLE9BQUEsU0FBUyxFQUFFLDBDQUFFLFVBQVUsQ0FBQyxJQUFJLE1BQUssSUFBSSxDQUFDO0FBQy9DLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsTUFBYzs7SUFDcEQsT0FBTyxPQUFBLFNBQVMsRUFBRSwwQ0FBRSxZQUFZLENBQUMsTUFBTSxNQUFLLE1BQU0sQ0FBQztBQUNyRCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsR0FBVzs7SUFDcEQsT0FBTyxPQUFBLFNBQVMsRUFBRSwwQ0FBRSxlQUFlLENBQUMsR0FBRyxNQUFLLEdBQUcsQ0FBQztBQUNsRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlld1xuICogQSBtb2R1bGUgdG8gZmFjaWxpdGF0ZSB1c2Ugb2YgYSBUcnVzdGVkIFR5cGVzIHBvbGljeSBpbnRlcm5hbGx5IHdpdGhpblxuICogQW5ndWxhci4gSXQgbGF6aWx5IGNvbnN0cnVjdHMgdGhlIFRydXN0ZWQgVHlwZXMgcG9saWN5LCBwcm92aWRpbmcgaGVscGVyXG4gKiB1dGlsaXRpZXMgZm9yIHByb21vdGluZyBzdHJpbmdzIHRvIFRydXN0ZWQgVHlwZXMuIFdoZW4gVHJ1c3RlZCBUeXBlcyBhcmUgbm90XG4gKiBhdmFpbGFibGUsIHN0cmluZ3MgYXJlIHVzZWQgYXMgYSBmYWxsYmFjay5cbiAqIEBzZWN1cml0eSBBbGwgdXNlIG9mIHRoaXMgbW9kdWxlIGlzIHNlY3VyaXR5LXNlbnNpdGl2ZSBhbmQgc2hvdWxkIGdvIHRocm91Z2hcbiAqIHNlY3VyaXR5IHJldmlldy5cbiAqL1xuXG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi4vZ2xvYmFsJztcblxuLyoqXG4gKiBUaGUgVHJ1c3RlZCBUeXBlcyBwb2xpY3ksIG9yIG51bGwgaWYgVHJ1c3RlZCBUeXBlcyBhcmUgbm90XG4gKiBlbmFibGVkL3N1cHBvcnRlZCwgb3IgdW5kZWZpbmVkIGlmIHRoZSBwb2xpY3kgaGFzIG5vdCBiZWVuIGNyZWF0ZWQgeWV0LlxuICovXG5sZXQgcG9saWN5OiBUcnVzdGVkVHlwZVBvbGljeXxudWxsfHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBUcnVzdGVkIFR5cGVzIHBvbGljeSwgb3IgbnVsbCBpZiBUcnVzdGVkIFR5cGVzIGFyZSBub3RcbiAqIGVuYWJsZWQvc3VwcG9ydGVkLiBUaGUgZmlyc3QgY2FsbCB0byB0aGlzIGZ1bmN0aW9uIHdpbGwgY3JlYXRlIHRoZSBwb2xpY3kuXG4gKi9cbmZ1bmN0aW9uIGdldFBvbGljeSgpOiBUcnVzdGVkVHlwZVBvbGljeXxudWxsIHtcbiAgaWYgKHBvbGljeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcG9saWN5ID0gbnVsbDtcbiAgICBpZiAoZ2xvYmFsLnRydXN0ZWRUeXBlcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcG9saWN5ID0gKGdsb2JhbC50cnVzdGVkVHlwZXMgYXMgVHJ1c3RlZFR5cGVQb2xpY3lGYWN0b3J5KS5jcmVhdGVQb2xpY3koJ2FuZ3VsYXInLCB7XG4gICAgICAgICAgY3JlYXRlSFRNTDogKHM6IHN0cmluZykgPT4gcyxcbiAgICAgICAgICBjcmVhdGVTY3JpcHQ6IChzOiBzdHJpbmcpID0+IHMsXG4gICAgICAgICAgY3JlYXRlU2NyaXB0VVJMOiAoczogc3RyaW5nKSA9PiBzLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyB0cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5IHRocm93cyBpZiBjYWxsZWQgd2l0aCBhIG5hbWUgdGhhdCBpc1xuICAgICAgICAvLyBhbHJlYWR5IHJlZ2lzdGVyZWQsIGV2ZW4gaW4gcmVwb3J0LW9ubHkgbW9kZS4gVW50aWwgdGhlIEFQSSBjaGFuZ2VzLFxuICAgICAgICAvLyBjYXRjaCB0aGUgZXJyb3Igbm90IHRvIGJyZWFrIHRoZSBhcHBsaWNhdGlvbnMgZnVuY3Rpb25hbGx5LiBJbiBzdWNoXG4gICAgICAgIC8vIGNhc2VzLCB0aGUgY29kZSB3aWxsIGZhbGwgYmFjayB0byB1c2luZyBzdHJpbmdzLlxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcG9saWN5O1xufVxuXG4vKipcbiAqIFVuc2FmZWx5IHByb21vdGUgYSBzdHJpbmcgdG8gYSBUcnVzdGVkSFRNTCwgZmFsbGluZyBiYWNrIHRvIHN0cmluZ3Mgd2hlblxuICogVHJ1c3RlZCBUeXBlcyBhcmUgbm90IGF2YWlsYWJsZS5cbiAqIEBzZWN1cml0eSBUaGlzIGlzIGEgc2VjdXJpdHktc2Vuc2l0aXZlIGZ1bmN0aW9uOyBhbnkgdXNlIG9mIHRoaXMgZnVuY3Rpb25cbiAqIG11c3QgZ28gdGhyb3VnaCBzZWN1cml0eSByZXZpZXcuIEluIHBhcnRpY3VsYXIsIGl0IG11c3QgYmUgYXNzdXJlZCB0aGF0IHRoZVxuICogcHJvdmlkZWQgc3RyaW5nIHdpbGwgbmV2ZXIgY2F1c2UgYW4gWFNTIHZ1bG5lcmFiaWxpdHkgaWYgdXNlZCBpbiBhIGNvbnRleHRcbiAqIHRoYXQgd2lsbCBiZSBpbnRlcnByZXRlZCBhcyBIVE1MIGJ5IGEgYnJvd3NlciwgZS5nLiB3aGVuIGFzc2lnbmluZyB0b1xuICogZWxlbWVudC5pbm5lckhUTUwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnVzdGVkSFRNTEZyb21TdHJpbmcoaHRtbDogc3RyaW5nKTogVHJ1c3RlZEhUTUx8c3RyaW5nIHtcbiAgcmV0dXJuIGdldFBvbGljeSgpPy5jcmVhdGVIVE1MKGh0bWwpIHx8IGh0bWw7XG59XG5cbi8qKlxuICogVW5zYWZlbHkgcHJvbW90ZSBhIHN0cmluZyB0byBhIFRydXN0ZWRTY3JpcHQsIGZhbGxpbmcgYmFjayB0byBzdHJpbmdzIHdoZW5cbiAqIFRydXN0ZWQgVHlwZXMgYXJlIG5vdCBhdmFpbGFibGUuXG4gKiBAc2VjdXJpdHkgSW4gcGFydGljdWxhciwgaXQgbXVzdCBiZSBhc3N1cmVkIHRoYXQgdGhlIHByb3ZpZGVkIHN0cmluZyB3aWxsXG4gKiBuZXZlciBjYXVzZSBhbiBYU1MgdnVsbmVyYWJpbGl0eSBpZiB1c2VkIGluIGEgY29udGV4dCB0aGF0IHdpbGwgYmVcbiAqIGludGVycHJldGVkIGFuZCBleGVjdXRlZCBhcyBhIHNjcmlwdCBieSBhIGJyb3dzZXIsIGUuZy4gd2hlbiBjYWxsaW5nIGV2YWwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnVzdGVkU2NyaXB0RnJvbVN0cmluZyhzY3JpcHQ6IHN0cmluZyk6IFRydXN0ZWRTY3JpcHR8c3RyaW5nIHtcbiAgcmV0dXJuIGdldFBvbGljeSgpPy5jcmVhdGVTY3JpcHQoc2NyaXB0KSB8fCBzY3JpcHQ7XG59XG5cbi8qKlxuICogVW5zYWZlbHkgcHJvbW90ZSBhIHN0cmluZyB0byBhIFRydXN0ZWRTY3JpcHRVUkwsIGZhbGxpbmcgYmFjayB0byBzdHJpbmdzXG4gKiB3aGVuIFRydXN0ZWQgVHlwZXMgYXJlIG5vdCBhdmFpbGFibGUuXG4gKiBAc2VjdXJpdHkgVGhpcyBpcyBhIHNlY3VyaXR5LXNlbnNpdGl2ZSBmdW5jdGlvbjsgYW55IHVzZSBvZiB0aGlzIGZ1bmN0aW9uXG4gKiBtdXN0IGdvIHRocm91Z2ggc2VjdXJpdHkgcmV2aWV3LiBJbiBwYXJ0aWN1bGFyLCBpdCBtdXN0IGJlIGFzc3VyZWQgdGhhdCB0aGVcbiAqIHByb3ZpZGVkIHN0cmluZyB3aWxsIG5ldmVyIGNhdXNlIGFuIFhTUyB2dWxuZXJhYmlsaXR5IGlmIHVzZWQgaW4gYSBjb250ZXh0XG4gKiB0aGF0IHdpbGwgY2F1c2UgYSBicm93c2VyIHRvIGxvYWQgYW5kIGV4ZWN1dGUgYSByZXNvdXJjZSwgZS5nLiB3aGVuXG4gKiBhc3NpZ25pbmcgdG8gc2NyaXB0LnNyYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRydXN0ZWRTY3JpcHRVUkxGcm9tU3RyaW5nKHVybDogc3RyaW5nKTogVHJ1c3RlZFNjcmlwdFVSTHxzdHJpbmcge1xuICByZXR1cm4gZ2V0UG9saWN5KCk/LmNyZWF0ZVNjcmlwdFVSTCh1cmwpIHx8IHVybDtcbn1cbiJdfQ==