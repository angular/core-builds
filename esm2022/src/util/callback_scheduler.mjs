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
export function scheduleCallbackWithRafRace(callback, useNativeTimers = true) {
    // Note: the `scheduleCallback` is used in the `NgZone` class, but we cannot use the
    // `inject` function. The `NgZone` instance may be created manually, and thus the injection
    // context will be unavailable. This might be enough to check whether `requestAnimationFrame` is
    // available because otherwise, we'll fall back to `setTimeout`.
    const hasRequestAnimationFrame = typeof global['requestAnimationFrame'] === 'function';
    let nativeRequestAnimationFrame = hasRequestAnimationFrame ? global['requestAnimationFrame'] : null;
    let nativeSetTimeout = global['setTimeout'];
    if (typeof Zone !== 'undefined' && useNativeTimers) {
        if (hasRequestAnimationFrame) {
            nativeRequestAnimationFrame =
                global[Zone.__symbol__('requestAnimationFrame')] ?? nativeRequestAnimationFrame;
        }
        nativeSetTimeout = global[Zone.__symbol__('setTimeout')] ?? nativeSetTimeout;
    }
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
}
export function scheduleCallbackWithMicrotask(callback) {
    let executeCallback = true;
    queueMicrotask(() => {
        if (executeCallback) {
            callback();
        }
    });
    return () => {
        executeCallback = false;
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbGJhY2tfc2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9jYWxsYmFja19zY2hlZHVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVoQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlCRztBQUNILE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxRQUFrQixFQUFFLGVBQWUsR0FBRyxJQUFJO0lBRXBGLG9GQUFvRjtJQUNwRiwyRkFBMkY7SUFDM0YsZ0dBQWdHO0lBQ2hHLGdFQUFnRTtJQUNoRSxNQUFNLHdCQUF3QixHQUFHLE9BQU8sTUFBTSxDQUFDLHVCQUF1QixDQUFDLEtBQUssVUFBVSxDQUFDO0lBQ3ZGLElBQUksMkJBQTJCLEdBQzNCLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3RFLElBQUksZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzVDLElBQUksT0FBTyxJQUFJLEtBQUssV0FBVyxJQUFJLGVBQWUsRUFBRSxDQUFDO1FBQ25ELElBQUksd0JBQXdCLEVBQUUsQ0FBQztZQUM3QiwyQkFBMkI7Z0JBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDLENBQUMsSUFBSSwyQkFBMkIsQ0FBQztRQUN0RixDQUFDO1FBQ0QsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQztJQUMvRSxDQUFDO0lBRUQsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDO0lBQzNCLGdCQUFnQixDQUFDLEdBQUcsRUFBRTtRQUNwQixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDckIsT0FBTztRQUNULENBQUM7UUFDRCxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLFFBQVEsRUFBRSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQUM7SUFDSCwyQkFBMkIsRUFBRSxDQUFDLEdBQUcsRUFBRTtRQUNqQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDckIsT0FBTztRQUNULENBQUM7UUFDRCxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLFFBQVEsRUFBRSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLEdBQUcsRUFBRTtRQUNWLGVBQWUsR0FBRyxLQUFLLENBQUM7SUFDMUIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sVUFBVSw2QkFBNkIsQ0FBQyxRQUFrQjtJQUM5RCxJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUM7SUFDM0IsY0FBYyxDQUFDLEdBQUcsRUFBRTtRQUNsQixJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3BCLFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxHQUFHLEVBQUU7UUFDVixlQUFlLEdBQUcsS0FBSyxDQUFDO0lBQzFCLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4vZ2xvYmFsJztcblxuLyoqXG4gKiBHZXRzIGEgc2NoZWR1bGluZyBmdW5jdGlvbiB0aGF0IHJ1bnMgdGhlIGNhbGxiYWNrIGFmdGVyIHRoZSBmaXJzdCBvZiBzZXRUaW1lb3V0IGFuZFxuICogcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHJlc29sdmVzLlxuICpcbiAqIC0gYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgZW5zdXJlcyB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gcnVucyBhaGVhZCBvZiBhIGJyb3dzZXIgcmVwYWludC5cbiAqIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBjcmVhdGUgYW5kIHVwZGF0ZSBwYXNzZXMgb2YgYSBjaGFuZ2UgZGV0ZWN0aW9uIGFsd2F5cyBoYXBwZW5cbiAqIGluIHRoZSBzYW1lIGZyYW1lLlxuICogLSBXaGVuIHRoZSBicm93c2VyIGlzIHJlc291cmNlLXN0YXJ2ZWQsIGByQUZgIGNhbiBleGVjdXRlIF9iZWZvcmVfIGEgYHNldFRpbWVvdXRgIGJlY2F1c2VcbiAqIHJlbmRlcmluZyBpcyBhIHZlcnkgaGlnaCBwcmlvcml0eSBwcm9jZXNzLiBUaGlzIG1lYW5zIHRoYXQgYHNldFRpbWVvdXRgIGNhbm5vdCBndWFyYW50ZWVcbiAqIHNhbWUtZnJhbWUgY3JlYXRlIGFuZCB1cGRhdGUgcGFzcywgd2hlbiBgc2V0VGltZW91dGAgaXMgdXNlZCB0byBzY2hlZHVsZSB0aGUgdXBkYXRlIHBoYXNlLlxuICogLSBXaGlsZSBgckFGYCBnaXZlcyB1cyB0aGUgZGVzaXJhYmxlIHNhbWUtZnJhbWUgdXBkYXRlcywgaXQgaGFzIHR3byBsaW1pdGF0aW9ucyB0aGF0XG4gKiBwcmV2ZW50IGl0IGZyb20gYmVpbmcgdXNlZCBhbG9uZS4gRmlyc3QsIGl0IGRvZXMgbm90IHJ1biBpbiBiYWNrZ3JvdW5kIHRhYnMsIHdoaWNoIHdvdWxkXG4gKiBwcmV2ZW50IEFuZ3VsYXIgZnJvbSBpbml0aWFsaXppbmcgYW4gYXBwbGljYXRpb24gd2hlbiBvcGVuZWQgaW4gYSBuZXcgdGFiIChmb3IgZXhhbXBsZSkuXG4gKiBTZWNvbmQsIHJlcGVhdGVkIGNhbGxzIHRvIHJlcXVlc3RBbmltYXRpb25GcmFtZSB3aWxsIGV4ZWN1dGUgYXQgdGhlIHJlZnJlc2ggcmF0ZSBvZiB0aGVcbiAqIGhhcmR3YXJlICh+MTZtcyBmb3IgYSA2MEh6IGRpc3BsYXkpLiBUaGlzIHdvdWxkIGNhdXNlIHNpZ25pZmljYW50IHNsb3dkb3duIG9mIHRlc3RzIHRoYXRcbiAqIGFyZSB3cml0dGVuIHdpdGggc2V2ZXJhbCB1cGRhdGVzIGFuZCBhc3NlcnRzIGluIHRoZSBmb3JtIG9mIFwidXBkYXRlOyBhd2FpdCBzdGFibGU7IGFzc2VydDtcIi5cbiAqIC0gQm90aCBgc2V0VGltZW91dGAgYW5kIGByQUZgIGFyZSBhYmxlIHRvIFwiY29hbGVzY2VcIiBzZXZlcmFsIGV2ZW50cyBmcm9tIGEgc2luZ2xlIHVzZXJcbiAqIGludGVyYWN0aW9uIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi4gSW1wb3J0YW50bHksIHRoaXMgcmVkdWNlcyB2aWV3IHRyZWUgdHJhdmVyc2FscyB3aGVuXG4gKiBjb21wYXJlZCB0byBhbiBhbHRlcm5hdGl2ZSB0aW1pbmcgbWVjaGFuaXNtIGxpa2UgYHF1ZXVlTWljcm90YXNrYCwgd2hlcmUgY2hhbmdlIGRldGVjdGlvbiB3b3VsZFxuICogdGhlbiBiZSBpbnRlcmxlYXZlcyBiZXR3ZWVuIGVhY2ggZXZlbnQuXG4gKlxuICogQnkgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGFmdGVyIHRoZSBmaXJzdCBvZiBgc2V0VGltZW91dGAgYW5kIGByQUZgIHRvIGV4ZWN1dGUsIHdlIGdldCB0aGVcbiAqIGJlc3Qgb2YgYm90aCB3b3JsZHMuXG4gKlxuICogQHJldHVybnMgYSBmdW5jdGlvbiB0byBjYW5jZWwgdGhlIHNjaGVkdWxlZCBjYWxsYmFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlKGNhbGxiYWNrOiBGdW5jdGlvbiwgdXNlTmF0aXZlVGltZXJzID0gdHJ1ZSk6ICgpID0+XG4gICAgdm9pZCB7XG4gIC8vIE5vdGU6IHRoZSBgc2NoZWR1bGVDYWxsYmFja2AgaXMgdXNlZCBpbiB0aGUgYE5nWm9uZWAgY2xhc3MsIGJ1dCB3ZSBjYW5ub3QgdXNlIHRoZVxuICAvLyBgaW5qZWN0YCBmdW5jdGlvbi4gVGhlIGBOZ1pvbmVgIGluc3RhbmNlIG1heSBiZSBjcmVhdGVkIG1hbnVhbGx5LCBhbmQgdGh1cyB0aGUgaW5qZWN0aW9uXG4gIC8vIGNvbnRleHQgd2lsbCBiZSB1bmF2YWlsYWJsZS4gVGhpcyBtaWdodCBiZSBlbm91Z2ggdG8gY2hlY2sgd2hldGhlciBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBpc1xuICAvLyBhdmFpbGFibGUgYmVjYXVzZSBvdGhlcndpc2UsIHdlJ2xsIGZhbGwgYmFjayB0byBgc2V0VGltZW91dGAuXG4gIGNvbnN0IGhhc1JlcXVlc3RBbmltYXRpb25GcmFtZSA9IHR5cGVvZiBnbG9iYWxbJ3JlcXVlc3RBbmltYXRpb25GcmFtZSddID09PSAnZnVuY3Rpb24nO1xuICBsZXQgbmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lID1cbiAgICAgIGhhc1JlcXVlc3RBbmltYXRpb25GcmFtZSA/IGdsb2JhbFsncmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10gOiBudWxsO1xuICBsZXQgbmF0aXZlU2V0VGltZW91dCA9IGdsb2JhbFsnc2V0VGltZW91dCddO1xuICBpZiAodHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnICYmIHVzZU5hdGl2ZVRpbWVycykge1xuICAgIGlmIChoYXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgIG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZSA9XG4gICAgICAgICAgZ2xvYmFsW1pvbmUuX19zeW1ib2xfXygncmVxdWVzdEFuaW1hdGlvbkZyYW1lJyldID8/IG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICB9XG4gICAgbmF0aXZlU2V0VGltZW91dCA9IGdsb2JhbFtab25lLl9fc3ltYm9sX18oJ3NldFRpbWVvdXQnKV0gPz8gbmF0aXZlU2V0VGltZW91dDtcbiAgfVxuXG4gIGxldCBleGVjdXRlQ2FsbGJhY2sgPSB0cnVlO1xuICBuYXRpdmVTZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZiAoIWV4ZWN1dGVDYWxsYmFjaykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBleGVjdXRlQ2FsbGJhY2sgPSBmYWxzZTtcbiAgICBjYWxsYmFjaygpO1xuICB9KTtcbiAgbmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lPy4oKCkgPT4ge1xuICAgIGlmICghZXhlY3V0ZUNhbGxiYWNrKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGV4ZWN1dGVDYWxsYmFjayA9IGZhbHNlO1xuICAgIGNhbGxiYWNrKCk7XG4gIH0pO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgZXhlY3V0ZUNhbGxiYWNrID0gZmFsc2U7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzayhjYWxsYmFjazogRnVuY3Rpb24pOiAoKSA9PiB2b2lkIHtcbiAgbGV0IGV4ZWN1dGVDYWxsYmFjayA9IHRydWU7XG4gIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICBpZiAoZXhlY3V0ZUNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBleGVjdXRlQ2FsbGJhY2sgPSBmYWxzZTtcbiAgfTtcbn1cbiJdfQ==