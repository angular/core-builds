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
 *
 * @returns a function to cancel the scheduled callback
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
        return () => {
            executeCallback = false;
        };
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbGJhY2tfc2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9jYWxsYmFja19zY2hlZHVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVoQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlCRztBQUNILE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsa0dBQWtHO0lBQ2xHLDJGQUEyRjtJQUMzRixnR0FBZ0c7SUFDaEcsZ0VBQWdFO0lBQ2hFLE1BQU0sd0JBQXdCLEdBQUcsT0FBTyxNQUFNLENBQUMsdUJBQXVCLENBQUMsS0FBSyxVQUFVLENBQUM7SUFDdkYsSUFBSSwyQkFBMkIsR0FDM0Isd0JBQXdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDdEUsSUFBSSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7SUFFNUMsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLEVBQUUsQ0FBQztRQUNoQyx5RUFBeUU7UUFDekUsMkZBQTJGO1FBQzNGLGdHQUFnRztRQUNoRywwRkFBMEY7UUFDMUYsMkZBQTJGO1FBQzNGLG9CQUFvQjtRQUNwQixNQUFNLHdCQUF3QixHQUFJLElBQVksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUM5RSxJQUFJLDJCQUEyQixFQUFFLENBQUM7WUFDaEMsMkJBQTJCO2dCQUN0QiwyQkFBbUMsQ0FBQyx3QkFBd0IsQ0FBQztvQkFDOUQsMkJBQTJCLENBQUM7UUFDbEMsQ0FBQztRQUNELGdCQUFnQixHQUFJLGdCQUF3QixDQUFDLHdCQUF3QixDQUFDLElBQUksZ0JBQWdCLENBQUM7SUFDN0YsQ0FBQztJQUVELE9BQU8sQ0FBQyxRQUFrQixFQUFFLEVBQUU7UUFDNUIsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzNCLGdCQUFnQixDQUFDLEdBQUcsRUFBRTtZQUNwQixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDVCxDQUFDO1lBQ0QsZUFBZSxHQUFHLEtBQUssQ0FBQztZQUN4QixRQUFRLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO1FBQ0gsMkJBQTJCLEVBQUUsQ0FBQyxHQUFHLEVBQUU7WUFDakMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1QsQ0FBQztZQUNELGVBQWUsR0FBRyxLQUFLLENBQUM7WUFDeEIsUUFBUSxFQUFFLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxFQUFFO1lBQ1YsZUFBZSxHQUFHLEtBQUssQ0FBQztRQUMxQixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuL2dsb2JhbCc7XG5cbi8qKlxuICogR2V0cyBhIHNjaGVkdWxpbmcgZnVuY3Rpb24gdGhhdCBydW5zIHRoZSBjYWxsYmFjayBhZnRlciB0aGUgZmlyc3Qgb2Ygc2V0VGltZW91dCBhbmRcbiAqIHJlcXVlc3RBbmltYXRpb25GcmFtZSByZXNvbHZlcy5cbiAqXG4gKiAtIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGVuc3VyZXMgdGhhdCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgYWhlYWQgb2YgYSBicm93c2VyIHJlcGFpbnQuXG4gKiBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgY3JlYXRlIGFuZCB1cGRhdGUgcGFzc2VzIG9mIGEgY2hhbmdlIGRldGVjdGlvbiBhbHdheXMgaGFwcGVuXG4gKiBpbiB0aGUgc2FtZSBmcmFtZS5cbiAqIC0gV2hlbiB0aGUgYnJvd3NlciBpcyByZXNvdXJjZS1zdGFydmVkLCBgckFGYCBjYW4gZXhlY3V0ZSBfYmVmb3JlXyBhIGBzZXRUaW1lb3V0YCBiZWNhdXNlXG4gKiByZW5kZXJpbmcgaXMgYSB2ZXJ5IGhpZ2ggcHJpb3JpdHkgcHJvY2Vzcy4gVGhpcyBtZWFucyB0aGF0IGBzZXRUaW1lb3V0YCBjYW5ub3QgZ3VhcmFudGVlXG4gKiBzYW1lLWZyYW1lIGNyZWF0ZSBhbmQgdXBkYXRlIHBhc3MsIHdoZW4gYHNldFRpbWVvdXRgIGlzIHVzZWQgdG8gc2NoZWR1bGUgdGhlIHVwZGF0ZSBwaGFzZS5cbiAqIC0gV2hpbGUgYHJBRmAgZ2l2ZXMgdXMgdGhlIGRlc2lyYWJsZSBzYW1lLWZyYW1lIHVwZGF0ZXMsIGl0IGhhcyB0d28gbGltaXRhdGlvbnMgdGhhdFxuICogcHJldmVudCBpdCBmcm9tIGJlaW5nIHVzZWQgYWxvbmUuIEZpcnN0LCBpdCBkb2VzIG5vdCBydW4gaW4gYmFja2dyb3VuZCB0YWJzLCB3aGljaCB3b3VsZFxuICogcHJldmVudCBBbmd1bGFyIGZyb20gaW5pdGlhbGl6aW5nIGFuIGFwcGxpY2F0aW9uIHdoZW4gb3BlbmVkIGluIGEgbmV3IHRhYiAoZm9yIGV4YW1wbGUpLlxuICogU2Vjb25kLCByZXBlYXRlZCBjYWxscyB0byByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgd2lsbCBleGVjdXRlIGF0IHRoZSByZWZyZXNoIHJhdGUgb2YgdGhlXG4gKiBoYXJkd2FyZSAofjE2bXMgZm9yIGEgNjBIeiBkaXNwbGF5KS4gVGhpcyB3b3VsZCBjYXVzZSBzaWduaWZpY2FudCBzbG93ZG93biBvZiB0ZXN0cyB0aGF0XG4gKiBhcmUgd3JpdHRlbiB3aXRoIHNldmVyYWwgdXBkYXRlcyBhbmQgYXNzZXJ0cyBpbiB0aGUgZm9ybSBvZiBcInVwZGF0ZTsgYXdhaXQgc3RhYmxlOyBhc3NlcnQ7XCIuXG4gKiAtIEJvdGggYHNldFRpbWVvdXRgIGFuZCBgckFGYCBhcmUgYWJsZSB0byBcImNvYWxlc2NlXCIgc2V2ZXJhbCBldmVudHMgZnJvbSBhIHNpbmdsZSB1c2VyXG4gKiBpbnRlcmFjdGlvbiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uIEltcG9ydGFudGx5LCB0aGlzIHJlZHVjZXMgdmlldyB0cmVlIHRyYXZlcnNhbHMgd2hlblxuICogY29tcGFyZWQgdG8gYW4gYWx0ZXJuYXRpdmUgdGltaW5nIG1lY2hhbmlzbSBsaWtlIGBxdWV1ZU1pY3JvdGFza2AsIHdoZXJlIGNoYW5nZSBkZXRlY3Rpb24gd291bGRcbiAqIHRoZW4gYmUgaW50ZXJsZWF2ZXMgYmV0d2VlbiBlYWNoIGV2ZW50LlxuICpcbiAqIEJ5IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBhZnRlciB0aGUgZmlyc3Qgb2YgYHNldFRpbWVvdXRgIGFuZCBgckFGYCB0byBleGVjdXRlLCB3ZSBnZXQgdGhlXG4gKiBiZXN0IG9mIGJvdGggd29ybGRzLlxuICpcbiAqIEByZXR1cm5zIGEgZnVuY3Rpb24gdG8gY2FuY2VsIHRoZSBzY2hlZHVsZWQgY2FsbGJhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENhbGxiYWNrU2NoZWR1bGVyKCk6IChjYWxsYmFjazogRnVuY3Rpb24pID0+ICgpID0+IHZvaWQge1xuICAvLyBOb3RlOiB0aGUgYGdldE5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZWAgaXMgdXNlZCBpbiB0aGUgYE5nWm9uZWAgY2xhc3MsIGJ1dCB3ZSBjYW5ub3QgdXNlIHRoZVxuICAvLyBgaW5qZWN0YCBmdW5jdGlvbi4gVGhlIGBOZ1pvbmVgIGluc3RhbmNlIG1heSBiZSBjcmVhdGVkIG1hbnVhbGx5LCBhbmQgdGh1cyB0aGUgaW5qZWN0aW9uXG4gIC8vIGNvbnRleHQgd2lsbCBiZSB1bmF2YWlsYWJsZS4gVGhpcyBtaWdodCBiZSBlbm91Z2ggdG8gY2hlY2sgd2hldGhlciBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBpc1xuICAvLyBhdmFpbGFibGUgYmVjYXVzZSBvdGhlcndpc2UsIHdlJ2xsIGZhbGwgYmFjayB0byBgc2V0VGltZW91dGAuXG4gIGNvbnN0IGhhc1JlcXVlc3RBbmltYXRpb25GcmFtZSA9IHR5cGVvZiBnbG9iYWxbJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddID09PSAnZnVuY3Rpb24nO1xuICBsZXQgbmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lID1cbiAgICAgIGhhc1JlcXVlc3RBbmltYXRpb25GcmFtZSA/IGdsb2JhbFsncmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10gOiBudWxsO1xuICBsZXQgbmF0aXZlU2V0VGltZW91dCA9IGdsb2JhbFsnc2V0VGltZW91dCddO1xuXG4gIGlmICh0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBOb3RlOiB6b25lLmpzIHNldHMgb3JpZ2luYWwgaW1wbGVtZW50YXRpb25zIG9uIHBhdGNoZWQgQVBJcyBiZWhpbmQgdGhlXG4gICAgLy8gYF9fem9uZV9zeW1ib2xfX09yaWdpbmFsRGVsZWdhdGVgIGtleSAoc2VlIGBhdHRhY2hPcmlnaW5Ub1BhdGNoZWRgKS4gR2l2ZW4gdGhlIGZvbGxvd2luZ1xuICAgIC8vIGV4YW1wbGU6IGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lLl9fem9uZV9zeW1ib2xfX09yaWdpbmFsRGVsZWdhdGVgOyB0aGlzIHdvdWxkIHJldHVybiBhblxuICAgIC8vIHVucGF0Y2hlZCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAsIHdoaWNoIGlzbid0IGludGVyY2VwdGVkIGJ5IHRoZVxuICAgIC8vIEFuZ3VsYXIgem9uZS4gV2UgdXNlIHRoZSB1bnBhdGNoZWQgaW1wbGVtZW50YXRpb24gdG8gYXZvaWQgYW5vdGhlciBjaGFuZ2UgZGV0ZWN0aW9uIHdoZW5cbiAgICAvLyBjb2FsZXNjaW5nIHRhc2tzLlxuICAgIGNvbnN0IE9SSUdJTkFMX0RFTEVHQVRFX1NZTUJPTCA9IChab25lIGFzIGFueSkuX19zeW1ib2xfXygnT3JpZ2luYWxEZWxlZ2F0ZScpO1xuICAgIGlmIChuYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgIG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZSA9XG4gICAgICAgICAgKG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZSBhcyBhbnkpW09SSUdJTkFMX0RFTEVHQVRFX1NZTUJPTF0gPz9cbiAgICAgICAgICBuYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgfVxuICAgIG5hdGl2ZVNldFRpbWVvdXQgPSAobmF0aXZlU2V0VGltZW91dCBhcyBhbnkpW09SSUdJTkFMX0RFTEVHQVRFX1NZTUJPTF0gPz8gbmF0aXZlU2V0VGltZW91dDtcbiAgfVxuXG4gIHJldHVybiAoY2FsbGJhY2s6IEZ1bmN0aW9uKSA9PiB7XG4gICAgbGV0IGV4ZWN1dGVDYWxsYmFjayA9IHRydWU7XG4gICAgbmF0aXZlU2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoIWV4ZWN1dGVDYWxsYmFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBleGVjdXRlQ2FsbGJhY2sgPSBmYWxzZTtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gICAgbmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lPy4oKCkgPT4ge1xuICAgICAgaWYgKCFleGVjdXRlQ2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXhlY3V0ZUNhbGxiYWNrID0gZmFsc2U7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGV4ZWN1dGVDYWxsYmFjayA9IGZhbHNlO1xuICAgIH07XG4gIH07XG59XG4iXX0=