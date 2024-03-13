/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { global } from './global';
/**
 * Gets a scheduling function that runs the callback after the first of setTimeout and
 * requestAnimationFrame resolves.
 *
 * - `requestAnimationFrame` ensures that change detection runs ahead of a browser repaint.
 * This ensures that the create and update passes of a change detection always happen
 * in the same frame.
 * - When the browser is resource-starved, `rAF` can execute _before_ a `setTimeout` because
 * rendering is a very high priority process. This means that `setTimeout` cannot guarantee
 * same-frame create and update pass, when `setTimeout` is used to schedule the update phase.
 * - While `rAF` gives us the desirable same-frame updates, it has two limitations that
 * prevent it from being used alone. First, it does not run in background tabs, which would
 * prevent Angular from initializing an application when opened in a new tab (for example).
 * Second, repeated calls to requestAnimationFrame will execute at the refresh rate of the
 * hardware (~16ms for a 60Hz display). This would cause significant slowdown of tests that
 * are written with several updates and asserts in the form of "update; await stable; assert;".
 * - Both `setTimeout` and `rAF` are able to "coalesce" several events from a single user
 * interaction into a single change detection. Importantly, this reduces view tree traversals when
 * compared to an alternative timing mechanism like `queueMicrotask`, where change detection would
 * then be interleaves between each event.
 *
 * By running change detection after the first of `setTimeout` and `rAF` to execute, we get the
 * best of both worlds.
 */
export function getCallbackScheduler() {
    // Note: the `getNativeRequestAnimationFrame` is used in the `NgZone` class, but we cannot use the
    // `inject` function. The `NgZone` instance may be created manually, and thus the injection
    // context will be unavailable. This might be enough to check whether `requestAnimationFrame` is
    // available because otherwise, we'll fall back to `setTimeout`.
    const hasRequestAnimationFrame = typeof global['requestAnimationFrame'] === 'function';
    let nativeRequestAnimationFrame = hasRequestAnimationFrame ? global['requestAnimationFrame'] : null;
    let nativeSetTimeout = global['setTimeout'];
    if (typeof Zone !== 'undefined') {
        // Note: zone.js sets original implementations on patched APIs behind the
        // `__zone_symbol__OriginalDelegate` key (see `attachOriginToPatched`). Given the following
        // example: `window.requestAnimationFrame.__zone_symbol__OriginalDelegate`; this would return an
        // unpatched implementation of the `requestAnimationFrame`, which isn't intercepted by the
        // Angular zone. We use the unpatched implementation to avoid another change detection when
        // coalescing tasks.
        const ORIGINAL_DELEGATE_SYMBOL = Zone.__symbol__('OriginalDelegate');
        if (nativeRequestAnimationFrame) {
            nativeRequestAnimationFrame =
                nativeRequestAnimationFrame[ORIGINAL_DELEGATE_SYMBOL] ??
                    nativeRequestAnimationFrame;
        }
        nativeSetTimeout = nativeSetTimeout[ORIGINAL_DELEGATE_SYMBOL] ?? nativeSetTimeout;
    }
    return (callback) => {
        let executeCallback = true;
        nativeSetTimeout(() => {
            if (!executeCallback) {
                return;
            }
            executeCallback = false;
            callback();
        });
        nativeRequestAnimationFrame?.(() => {
            if (!executeCallback) {
                return;
            }
            executeCallback = false;
            callback();
        });
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbGJhY2tfc2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9jYWxsYmFja19zY2hlZHVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVoQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F1Qkc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLGtHQUFrRztJQUNsRywyRkFBMkY7SUFDM0YsZ0dBQWdHO0lBQ2hHLGdFQUFnRTtJQUNoRSxNQUFNLHdCQUF3QixHQUFHLE9BQU8sTUFBTSxDQUFDLHVCQUF1QixDQUFDLEtBQUssVUFBVSxDQUFDO0lBQ3ZGLElBQUksMkJBQTJCLEdBQzNCLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3RFLElBQUksZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRTVDLElBQUksT0FBTyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDaEMseUVBQXlFO1FBQ3pFLDJGQUEyRjtRQUMzRixnR0FBZ0c7UUFDaEcsMEZBQTBGO1FBQzFGLDJGQUEyRjtRQUMzRixvQkFBb0I7UUFDcEIsTUFBTSx3QkFBd0IsR0FBSSxJQUFZLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDOUUsSUFBSSwyQkFBMkIsRUFBRSxDQUFDO1lBQ2hDLDJCQUEyQjtnQkFDdEIsMkJBQW1DLENBQUMsd0JBQXdCLENBQUM7b0JBQzlELDJCQUEyQixDQUFDO1FBQ2xDLENBQUM7UUFDRCxnQkFBZ0IsR0FBSSxnQkFBd0IsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO0lBQzdGLENBQUM7SUFFRCxPQUFPLENBQUMsUUFBa0IsRUFBRSxFQUFFO1FBQzVCLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQztRQUMzQixnQkFBZ0IsQ0FBQyxHQUFHLEVBQUU7WUFDcEIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1QsQ0FBQztZQUNELGVBQWUsR0FBRyxLQUFLLENBQUM7WUFDeEIsUUFBUSxFQUFFLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztRQUNILDJCQUEyQixFQUFFLENBQUMsR0FBRyxFQUFFO1lBQ2pDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNULENBQUM7WUFDRCxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuL2dsb2JhbCc7XG5cbi8qKlxuICogR2V0cyBhIHNjaGVkdWxpbmcgZnVuY3Rpb24gdGhhdCBydW5zIHRoZSBjYWxsYmFjayBhZnRlciB0aGUgZmlyc3Qgb2Ygc2V0VGltZW91dCBhbmRcbiAqIHJlcXVlc3RBbmltYXRpb25GcmFtZSByZXNvbHZlcy5cbiAqXG4gKiAtIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGVuc3VyZXMgdGhhdCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgYWhlYWQgb2YgYSBicm93c2VyIHJlcGFpbnQuXG4gKiBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgY3JlYXRlIGFuZCB1cGRhdGUgcGFzc2VzIG9mIGEgY2hhbmdlIGRldGVjdGlvbiBhbHdheXMgaGFwcGVuXG4gKiBpbiB0aGUgc2FtZSBmcmFtZS5cbiAqIC0gV2hlbiB0aGUgYnJvd3NlciBpcyByZXNvdXJjZS1zdGFydmVkLCBgckFGYCBjYW4gZXhlY3V0ZSBfYmVmb3JlXyBhIGBzZXRUaW1lb3V0YCBiZWNhdXNlXG4gKiByZW5kZXJpbmcgaXMgYSB2ZXJ5IGhpZ2ggcHJpb3JpdHkgcHJvY2Vzcy4gVGhpcyBtZWFucyB0aGF0IGBzZXRUaW1lb3V0YCBjYW5ub3QgZ3VhcmFudGVlXG4gKiBzYW1lLWZyYW1lIGNyZWF0ZSBhbmQgdXBkYXRlIHBhc3MsIHdoZW4gYHNldFRpbWVvdXRgIGlzIHVzZWQgdG8gc2NoZWR1bGUgdGhlIHVwZGF0ZSBwaGFzZS5cbiAqIC0gV2hpbGUgYHJBRmAgZ2l2ZXMgdXMgdGhlIGRlc2lyYWJsZSBzYW1lLWZyYW1lIHVwZGF0ZXMsIGl0IGhhcyB0d28gbGltaXRhdGlvbnMgdGhhdFxuICogcHJldmVudCBpdCBmcm9tIGJlaW5nIHVzZWQgYWxvbmUuIEZpcnN0LCBpdCBkb2VzIG5vdCBydW4gaW4gYmFja2dyb3VuZCB0YWJzLCB3aGljaCB3b3VsZFxuICogcHJldmVudCBBbmd1bGFyIGZyb20gaW5pdGlhbGl6aW5nIGFuIGFwcGxpY2F0aW9uIHdoZW4gb3BlbmVkIGluIGEgbmV3IHRhYiAoZm9yIGV4YW1wbGUpLlxuICogU2Vjb25kLCByZXBlYXRlZCBjYWxscyB0byByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgd2lsbCBleGVjdXRlIGF0IHRoZSByZWZyZXNoIHJhdGUgb2YgdGhlXG4gKiBoYXJkd2FyZSAofjE2bXMgZm9yIGEgNjBIeiBkaXNwbGF5KS4gVGhpcyB3b3VsZCBjYXVzZSBzaWduaWZpY2FudCBzbG93ZG93biBvZiB0ZXN0cyB0aGF0XG4gKiBhcmUgd3JpdHRlbiB3aXRoIHNldmVyYWwgdXBkYXRlcyBhbmQgYXNzZXJ0cyBpbiB0aGUgZm9ybSBvZiBcInVwZGF0ZTsgYXdhaXQgc3RhYmxlOyBhc3NlcnQ7XCIuXG4gKiAtIEJvdGggYHNldFRpbWVvdXRgIGFuZCBgckFGYCBhcmUgYWJsZSB0byBcImNvYWxlc2NlXCIgc2V2ZXJhbCBldmVudHMgZnJvbSBhIHNpbmdsZSB1c2VyXG4gKiBpbnRlcmFjdGlvbiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uIEltcG9ydGFudGx5LCB0aGlzIHJlZHVjZXMgdmlldyB0cmVlIHRyYXZlcnNhbHMgd2hlblxuICogY29tcGFyZWQgdG8gYW4gYWx0ZXJuYXRpdmUgdGltaW5nIG1lY2hhbmlzbSBsaWtlIGBxdWV1ZU1pY3JvdGFza2AsIHdoZXJlIGNoYW5nZSBkZXRlY3Rpb24gd291bGRcbiAqIHRoZW4gYmUgaW50ZXJsZWF2ZXMgYmV0d2VlbiBlYWNoIGV2ZW50LlxuICpcbiAqIEJ5IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBhZnRlciB0aGUgZmlyc3Qgb2YgYHNldFRpbWVvdXRgIGFuZCBgckFGYCB0byBleGVjdXRlLCB3ZSBnZXQgdGhlXG4gKiBiZXN0IG9mIGJvdGggd29ybGRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FsbGJhY2tTY2hlZHVsZXIoKTogKGNhbGxiYWNrOiBGdW5jdGlvbikgPT4gdm9pZCB7XG4gIC8vIE5vdGU6IHRoZSBgZ2V0TmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBpcyB1c2VkIGluIHRoZSBgTmdab25lYCBjbGFzcywgYnV0IHdlIGNhbm5vdCB1c2UgdGhlXG4gIC8vIGBpbmplY3RgIGZ1bmN0aW9uLiBUaGUgYE5nWm9uZWAgaW5zdGFuY2UgbWF5IGJlIGNyZWF0ZWQgbWFudWFsbHksIGFuZCB0aHVzIHRoZSBpbmplY3Rpb25cbiAgLy8gY29udGV4dCB3aWxsIGJlIHVuYXZhaWxhYmxlLiBUaGlzIG1pZ2h0IGJlIGVub3VnaCB0byBjaGVjayB3aGV0aGVyIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGlzXG4gIC8vIGF2YWlsYWJsZSBiZWNhdXNlIG90aGVyd2lzZSwgd2UnbGwgZmFsbCBiYWNrIHRvIGBzZXRUaW1lb3V0YC5cbiAgY29uc3QgaGFzUmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gdHlwZW9mIGdsb2JhbFsncmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10gPT09ICdmdW5jdGlvbic7XG4gIGxldCBuYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPVxuICAgICAgaGFzUmVxdWVzdEFuaW1hdGlvbkZyYW1lID8gZ2xvYmFsWydyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSA6IG51bGw7XG4gIGxldCBuYXRpdmVTZXRUaW1lb3V0ID0gZ2xvYmFsWydzZXRUaW1lb3V0J107XG5cbiAgaWYgKHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJykge1xuICAgIC8vIE5vdGU6IHpvbmUuanMgc2V0cyBvcmlnaW5hbCBpbXBsZW1lbnRhdGlvbnMgb24gcGF0Y2hlZCBBUElzIGJlaGluZCB0aGVcbiAgICAvLyBgX196b25lX3N5bWJvbF9fT3JpZ2luYWxEZWxlZ2F0ZWAga2V5IChzZWUgYGF0dGFjaE9yaWdpblRvUGF0Y2hlZGApLiBHaXZlbiB0aGUgZm9sbG93aW5nXG4gICAgLy8gZXhhbXBsZTogYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUuX196b25lX3N5bWJvbF9fT3JpZ2luYWxEZWxlZ2F0ZWA7IHRoaXMgd291bGQgcmV0dXJuIGFuXG4gICAgLy8gdW5wYXRjaGVkIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgd2hpY2ggaXNuJ3QgaW50ZXJjZXB0ZWQgYnkgdGhlXG4gICAgLy8gQW5ndWxhciB6b25lLiBXZSB1c2UgdGhlIHVucGF0Y2hlZCBpbXBsZW1lbnRhdGlvbiB0byBhdm9pZCBhbm90aGVyIGNoYW5nZSBkZXRlY3Rpb24gd2hlblxuICAgIC8vIGNvYWxlc2NpbmcgdGFza3MuXG4gICAgY29uc3QgT1JJR0lOQUxfREVMRUdBVEVfU1lNQk9MID0gKFpvbmUgYXMgYW55KS5fX3N5bWJvbF9fKCdPcmlnaW5hbERlbGVnYXRlJyk7XG4gICAgaWYgKG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgICAgbmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lID1cbiAgICAgICAgICAobmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lIGFzIGFueSlbT1JJR0lOQUxfREVMRUdBVEVfU1lNQk9MXSA/P1xuICAgICAgICAgIG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICB9XG4gICAgbmF0aXZlU2V0VGltZW91dCA9IChuYXRpdmVTZXRUaW1lb3V0IGFzIGFueSlbT1JJR0lOQUxfREVMRUdBVEVfU1lNQk9MXSA/PyBuYXRpdmVTZXRUaW1lb3V0O1xuICB9XG5cbiAgcmV0dXJuIChjYWxsYmFjazogRnVuY3Rpb24pID0+IHtcbiAgICBsZXQgZXhlY3V0ZUNhbGxiYWNrID0gdHJ1ZTtcbiAgICBuYXRpdmVTZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICghZXhlY3V0ZUNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGV4ZWN1dGVDYWxsYmFjayA9IGZhbHNlO1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgICBuYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWU/LigoKSA9PiB7XG4gICAgICBpZiAoIWV4ZWN1dGVDYWxsYmFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBleGVjdXRlQ2FsbGJhY2sgPSBmYWxzZTtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH07XG59XG4iXX0=