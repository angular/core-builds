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
    let nativeRequestAnimationFrame = hasRequestAnimationFrame
        ? global['requestAnimationFrame']
        : null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbGJhY2tfc2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9jYWxsYmFja19zY2hlZHVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVoQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlCRztBQUNILE1BQU0sVUFBVSwyQkFBMkIsQ0FDekMsUUFBa0IsRUFDbEIsZUFBZSxHQUFHLElBQUk7SUFFdEIsb0ZBQW9GO0lBQ3BGLDJGQUEyRjtJQUMzRixnR0FBZ0c7SUFDaEcsZ0VBQWdFO0lBQ2hFLE1BQU0sd0JBQXdCLEdBQUcsT0FBTyxNQUFNLENBQUMsdUJBQXVCLENBQUMsS0FBSyxVQUFVLENBQUM7SUFDdkYsSUFBSSwyQkFBMkIsR0FBRyx3QkFBd0I7UUFDeEQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQztRQUNqQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ1QsSUFBSSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDNUMsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksZUFBZSxFQUFFLENBQUM7UUFDbkQsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO1lBQzdCLDJCQUEyQjtnQkFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxJQUFJLDJCQUEyQixDQUFDO1FBQ3BGLENBQUM7UUFDRCxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO0lBQy9FLENBQUM7SUFFRCxJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUM7SUFDM0IsZ0JBQWdCLENBQUMsR0FBRyxFQUFFO1FBQ3BCLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNyQixPQUFPO1FBQ1QsQ0FBQztRQUNELGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDeEIsUUFBUSxFQUFFLENBQUM7SUFDYixDQUFDLENBQUMsQ0FBQztJQUNILDJCQUEyQixFQUFFLENBQUMsR0FBRyxFQUFFO1FBQ2pDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNyQixPQUFPO1FBQ1QsQ0FBQztRQUNELGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDeEIsUUFBUSxFQUFFLENBQUM7SUFDYixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sR0FBRyxFQUFFO1FBQ1YsZUFBZSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxVQUFVLDZCQUE2QixDQUFDLFFBQWtCO0lBQzlELElBQUksZUFBZSxHQUFHLElBQUksQ0FBQztJQUMzQixjQUFjLENBQUMsR0FBRyxFQUFFO1FBQ2xCLElBQUksZUFBZSxFQUFFLENBQUM7WUFDcEIsUUFBUSxFQUFFLENBQUM7UUFDYixDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLEdBQUcsRUFBRTtRQUNWLGVBQWUsR0FBRyxLQUFLLENBQUM7SUFDMUIsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi9nbG9iYWwnO1xuXG4vKipcbiAqIEdldHMgYSBzY2hlZHVsaW5nIGZ1bmN0aW9uIHRoYXQgcnVucyB0aGUgY2FsbGJhY2sgYWZ0ZXIgdGhlIGZpcnN0IG9mIHNldFRpbWVvdXQgYW5kXG4gKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcmVzb2x2ZXMuXG4gKlxuICogLSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBlbnN1cmVzIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBydW5zIGFoZWFkIG9mIGEgYnJvd3NlciByZXBhaW50LlxuICogVGhpcyBlbnN1cmVzIHRoYXQgdGhlIGNyZWF0ZSBhbmQgdXBkYXRlIHBhc3NlcyBvZiBhIGNoYW5nZSBkZXRlY3Rpb24gYWx3YXlzIGhhcHBlblxuICogaW4gdGhlIHNhbWUgZnJhbWUuXG4gKiAtIFdoZW4gdGhlIGJyb3dzZXIgaXMgcmVzb3VyY2Utc3RhcnZlZCwgYHJBRmAgY2FuIGV4ZWN1dGUgX2JlZm9yZV8gYSBgc2V0VGltZW91dGAgYmVjYXVzZVxuICogcmVuZGVyaW5nIGlzIGEgdmVyeSBoaWdoIHByaW9yaXR5IHByb2Nlc3MuIFRoaXMgbWVhbnMgdGhhdCBgc2V0VGltZW91dGAgY2Fubm90IGd1YXJhbnRlZVxuICogc2FtZS1mcmFtZSBjcmVhdGUgYW5kIHVwZGF0ZSBwYXNzLCB3aGVuIGBzZXRUaW1lb3V0YCBpcyB1c2VkIHRvIHNjaGVkdWxlIHRoZSB1cGRhdGUgcGhhc2UuXG4gKiAtIFdoaWxlIGByQUZgIGdpdmVzIHVzIHRoZSBkZXNpcmFibGUgc2FtZS1mcmFtZSB1cGRhdGVzLCBpdCBoYXMgdHdvIGxpbWl0YXRpb25zIHRoYXRcbiAqIHByZXZlbnQgaXQgZnJvbSBiZWluZyB1c2VkIGFsb25lLiBGaXJzdCwgaXQgZG9lcyBub3QgcnVuIGluIGJhY2tncm91bmQgdGFicywgd2hpY2ggd291bGRcbiAqIHByZXZlbnQgQW5ndWxhciBmcm9tIGluaXRpYWxpemluZyBhbiBhcHBsaWNhdGlvbiB3aGVuIG9wZW5lZCBpbiBhIG5ldyB0YWIgKGZvciBleGFtcGxlKS5cbiAqIFNlY29uZCwgcmVwZWF0ZWQgY2FsbHMgdG8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHdpbGwgZXhlY3V0ZSBhdCB0aGUgcmVmcmVzaCByYXRlIG9mIHRoZVxuICogaGFyZHdhcmUgKH4xNm1zIGZvciBhIDYwSHogZGlzcGxheSkuIFRoaXMgd291bGQgY2F1c2Ugc2lnbmlmaWNhbnQgc2xvd2Rvd24gb2YgdGVzdHMgdGhhdFxuICogYXJlIHdyaXR0ZW4gd2l0aCBzZXZlcmFsIHVwZGF0ZXMgYW5kIGFzc2VydHMgaW4gdGhlIGZvcm0gb2YgXCJ1cGRhdGU7IGF3YWl0IHN0YWJsZTsgYXNzZXJ0O1wiLlxuICogLSBCb3RoIGBzZXRUaW1lb3V0YCBhbmQgYHJBRmAgYXJlIGFibGUgdG8gXCJjb2FsZXNjZVwiIHNldmVyYWwgZXZlbnRzIGZyb20gYSBzaW5nbGUgdXNlclxuICogaW50ZXJhY3Rpb24gaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLiBJbXBvcnRhbnRseSwgdGhpcyByZWR1Y2VzIHZpZXcgdHJlZSB0cmF2ZXJzYWxzIHdoZW5cbiAqIGNvbXBhcmVkIHRvIGFuIGFsdGVybmF0aXZlIHRpbWluZyBtZWNoYW5pc20gbGlrZSBgcXVldWVNaWNyb3Rhc2tgLCB3aGVyZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvdWxkXG4gKiB0aGVuIGJlIGludGVybGVhdmVzIGJldHdlZW4gZWFjaCBldmVudC5cbiAqXG4gKiBCeSBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gYWZ0ZXIgdGhlIGZpcnN0IG9mIGBzZXRUaW1lb3V0YCBhbmQgYHJBRmAgdG8gZXhlY3V0ZSwgd2UgZ2V0IHRoZVxuICogYmVzdCBvZiBib3RoIHdvcmxkcy5cbiAqXG4gKiBAcmV0dXJucyBhIGZ1bmN0aW9uIHRvIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGNhbGxiYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2UoXG4gIGNhbGxiYWNrOiBGdW5jdGlvbixcbiAgdXNlTmF0aXZlVGltZXJzID0gdHJ1ZSxcbik6ICgpID0+IHZvaWQge1xuICAvLyBOb3RlOiB0aGUgYHNjaGVkdWxlQ2FsbGJhY2tgIGlzIHVzZWQgaW4gdGhlIGBOZ1pvbmVgIGNsYXNzLCBidXQgd2UgY2Fubm90IHVzZSB0aGVcbiAgLy8gYGluamVjdGAgZnVuY3Rpb24uIFRoZSBgTmdab25lYCBpbnN0YW5jZSBtYXkgYmUgY3JlYXRlZCBtYW51YWxseSwgYW5kIHRodXMgdGhlIGluamVjdGlvblxuICAvLyBjb250ZXh0IHdpbGwgYmUgdW5hdmFpbGFibGUuIFRoaXMgbWlnaHQgYmUgZW5vdWdoIHRvIGNoZWNrIHdoZXRoZXIgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgaXNcbiAgLy8gYXZhaWxhYmxlIGJlY2F1c2Ugb3RoZXJ3aXNlLCB3ZSdsbCBmYWxsIGJhY2sgdG8gYHNldFRpbWVvdXRgLlxuICBjb25zdCBoYXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB0eXBlb2YgZ2xvYmFsWydyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSA9PT0gJ2Z1bmN0aW9uJztcbiAgbGV0IG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGhhc1JlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgID8gZ2xvYmFsWydyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXVxuICAgIDogbnVsbDtcbiAgbGV0IG5hdGl2ZVNldFRpbWVvdXQgPSBnbG9iYWxbJ3NldFRpbWVvdXQnXTtcbiAgaWYgKHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJyAmJiB1c2VOYXRpdmVUaW1lcnMpIHtcbiAgICBpZiAoaGFzUmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICBuYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPVxuICAgICAgICBnbG9iYWxbWm9uZS5fX3N5bWJvbF9fKCdyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnKV0gPz8gbmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgIH1cbiAgICBuYXRpdmVTZXRUaW1lb3V0ID0gZ2xvYmFsW1pvbmUuX19zeW1ib2xfXygnc2V0VGltZW91dCcpXSA/PyBuYXRpdmVTZXRUaW1lb3V0O1xuICB9XG5cbiAgbGV0IGV4ZWN1dGVDYWxsYmFjayA9IHRydWU7XG4gIG5hdGl2ZVNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmICghZXhlY3V0ZUNhbGxiYWNrKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGV4ZWN1dGVDYWxsYmFjayA9IGZhbHNlO1xuICAgIGNhbGxiYWNrKCk7XG4gIH0pO1xuICBuYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWU/LigoKSA9PiB7XG4gICAgaWYgKCFleGVjdXRlQ2FsbGJhY2spIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZXhlY3V0ZUNhbGxiYWNrID0gZmFsc2U7XG4gICAgY2FsbGJhY2soKTtcbiAgfSk7XG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBleGVjdXRlQ2FsbGJhY2sgPSBmYWxzZTtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrKGNhbGxiYWNrOiBGdW5jdGlvbik6ICgpID0+IHZvaWQge1xuICBsZXQgZXhlY3V0ZUNhbGxiYWNrID0gdHJ1ZTtcbiAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgIGlmIChleGVjdXRlQ2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGV4ZWN1dGVDYWxsYmFjayA9IGZhbHNlO1xuICB9O1xufVxuIl19