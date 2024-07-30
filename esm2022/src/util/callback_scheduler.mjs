/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { noop } from './noop';
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
export function scheduleCallbackWithRafRace(callback) {
    let timeoutId;
    let animationFrameId;
    function cleanup() {
        callback = noop;
        try {
            if (animationFrameId !== undefined && typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(animationFrameId);
            }
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        }
        catch {
            // Clearing/canceling can fail in tests due to the timing of functions being patched and unpatched
            // Just ignore the errors - we protect ourselves from this issue by also making the callback a no-op.
        }
    }
    timeoutId = setTimeout(() => {
        callback();
        cleanup();
    });
    if (typeof requestAnimationFrame === 'function') {
        animationFrameId = requestAnimationFrame(() => {
            callback();
            cleanup();
        });
    }
    return () => cleanup();
}
export function scheduleCallbackWithMicrotask(callback) {
    queueMicrotask(() => callback());
    return () => {
        callback = noop;
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbGJhY2tfc2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9jYWxsYmFja19zY2hlZHVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUU1Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlCRztBQUNILE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxRQUFrQjtJQUM1RCxJQUFJLFNBQWlCLENBQUM7SUFDdEIsSUFBSSxnQkFBd0IsQ0FBQztJQUM3QixTQUFTLE9BQU87UUFDZCxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQztZQUNILElBQUksZ0JBQWdCLEtBQUssU0FBUyxJQUFJLE9BQU8sb0JBQW9CLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ2pGLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDekMsQ0FBQztZQUNELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDMUIsQ0FBQztRQUNILENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCxrR0FBa0c7WUFDbEcscUdBQXFHO1FBQ3ZHLENBQUM7SUFDSCxDQUFDO0lBQ0QsU0FBUyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDMUIsUUFBUSxFQUFFLENBQUM7UUFDWCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUMsQ0FBc0IsQ0FBQztJQUN4QixJQUFJLE9BQU8scUJBQXFCLEtBQUssVUFBVSxFQUFFLENBQUM7UUFDaEQsZ0JBQWdCLEdBQUcscUJBQXFCLENBQUMsR0FBRyxFQUFFO1lBQzVDLFFBQVEsRUFBRSxDQUFDO1lBQ1gsT0FBTyxFQUFFLENBQUM7UUFDWixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3pCLENBQUM7QUFFRCxNQUFNLFVBQVUsNkJBQTZCLENBQUMsUUFBa0I7SUFDOUQsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFFakMsT0FBTyxHQUFHLEVBQUU7UUFDVixRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtub29wfSBmcm9tICcuL25vb3AnO1xuXG4vKipcbiAqIEdldHMgYSBzY2hlZHVsaW5nIGZ1bmN0aW9uIHRoYXQgcnVucyB0aGUgY2FsbGJhY2sgYWZ0ZXIgdGhlIGZpcnN0IG9mIHNldFRpbWVvdXQgYW5kXG4gKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcmVzb2x2ZXMuXG4gKlxuICogLSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBlbnN1cmVzIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBydW5zIGFoZWFkIG9mIGEgYnJvd3NlciByZXBhaW50LlxuICogVGhpcyBlbnN1cmVzIHRoYXQgdGhlIGNyZWF0ZSBhbmQgdXBkYXRlIHBhc3NlcyBvZiBhIGNoYW5nZSBkZXRlY3Rpb24gYWx3YXlzIGhhcHBlblxuICogaW4gdGhlIHNhbWUgZnJhbWUuXG4gKiAtIFdoZW4gdGhlIGJyb3dzZXIgaXMgcmVzb3VyY2Utc3RhcnZlZCwgYHJBRmAgY2FuIGV4ZWN1dGUgX2JlZm9yZV8gYSBgc2V0VGltZW91dGAgYmVjYXVzZVxuICogcmVuZGVyaW5nIGlzIGEgdmVyeSBoaWdoIHByaW9yaXR5IHByb2Nlc3MuIFRoaXMgbWVhbnMgdGhhdCBgc2V0VGltZW91dGAgY2Fubm90IGd1YXJhbnRlZVxuICogc2FtZS1mcmFtZSBjcmVhdGUgYW5kIHVwZGF0ZSBwYXNzLCB3aGVuIGBzZXRUaW1lb3V0YCBpcyB1c2VkIHRvIHNjaGVkdWxlIHRoZSB1cGRhdGUgcGhhc2UuXG4gKiAtIFdoaWxlIGByQUZgIGdpdmVzIHVzIHRoZSBkZXNpcmFibGUgc2FtZS1mcmFtZSB1cGRhdGVzLCBpdCBoYXMgdHdvIGxpbWl0YXRpb25zIHRoYXRcbiAqIHByZXZlbnQgaXQgZnJvbSBiZWluZyB1c2VkIGFsb25lLiBGaXJzdCwgaXQgZG9lcyBub3QgcnVuIGluIGJhY2tncm91bmQgdGFicywgd2hpY2ggd291bGRcbiAqIHByZXZlbnQgQW5ndWxhciBmcm9tIGluaXRpYWxpemluZyBhbiBhcHBsaWNhdGlvbiB3aGVuIG9wZW5lZCBpbiBhIG5ldyB0YWIgKGZvciBleGFtcGxlKS5cbiAqIFNlY29uZCwgcmVwZWF0ZWQgY2FsbHMgdG8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHdpbGwgZXhlY3V0ZSBhdCB0aGUgcmVmcmVzaCByYXRlIG9mIHRoZVxuICogaGFyZHdhcmUgKH4xNm1zIGZvciBhIDYwSHogZGlzcGxheSkuIFRoaXMgd291bGQgY2F1c2Ugc2lnbmlmaWNhbnQgc2xvd2Rvd24gb2YgdGVzdHMgdGhhdFxuICogYXJlIHdyaXR0ZW4gd2l0aCBzZXZlcmFsIHVwZGF0ZXMgYW5kIGFzc2VydHMgaW4gdGhlIGZvcm0gb2YgXCJ1cGRhdGU7IGF3YWl0IHN0YWJsZTsgYXNzZXJ0O1wiLlxuICogLSBCb3RoIGBzZXRUaW1lb3V0YCBhbmQgYHJBRmAgYXJlIGFibGUgdG8gXCJjb2FsZXNjZVwiIHNldmVyYWwgZXZlbnRzIGZyb20gYSBzaW5nbGUgdXNlclxuICogaW50ZXJhY3Rpb24gaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLiBJbXBvcnRhbnRseSwgdGhpcyByZWR1Y2VzIHZpZXcgdHJlZSB0cmF2ZXJzYWxzIHdoZW5cbiAqIGNvbXBhcmVkIHRvIGFuIGFsdGVybmF0aXZlIHRpbWluZyBtZWNoYW5pc20gbGlrZSBgcXVldWVNaWNyb3Rhc2tgLCB3aGVyZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvdWxkXG4gKiB0aGVuIGJlIGludGVybGVhdmVzIGJldHdlZW4gZWFjaCBldmVudC5cbiAqXG4gKiBCeSBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gYWZ0ZXIgdGhlIGZpcnN0IG9mIGBzZXRUaW1lb3V0YCBhbmQgYHJBRmAgdG8gZXhlY3V0ZSwgd2UgZ2V0IHRoZVxuICogYmVzdCBvZiBib3RoIHdvcmxkcy5cbiAqXG4gKiBAcmV0dXJucyBhIGZ1bmN0aW9uIHRvIGNhbmNlbCB0aGUgc2NoZWR1bGVkIGNhbGxiYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2UoY2FsbGJhY2s6IEZ1bmN0aW9uKTogKCkgPT4gdm9pZCB7XG4gIGxldCB0aW1lb3V0SWQ6IG51bWJlcjtcbiAgbGV0IGFuaW1hdGlvbkZyYW1lSWQ6IG51bWJlcjtcbiAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICBjYWxsYmFjayA9IG5vb3A7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChhbmltYXRpb25GcmFtZUlkICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGNhbmNlbEFuaW1hdGlvbkZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvbkZyYW1lSWQpO1xuICAgICAgfVxuICAgICAgaWYgKHRpbWVvdXRJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gQ2xlYXJpbmcvY2FuY2VsaW5nIGNhbiBmYWlsIGluIHRlc3RzIGR1ZSB0byB0aGUgdGltaW5nIG9mIGZ1bmN0aW9ucyBiZWluZyBwYXRjaGVkIGFuZCB1bnBhdGNoZWRcbiAgICAgIC8vIEp1c3QgaWdub3JlIHRoZSBlcnJvcnMgLSB3ZSBwcm90ZWN0IG91cnNlbHZlcyBmcm9tIHRoaXMgaXNzdWUgYnkgYWxzbyBtYWtpbmcgdGhlIGNhbGxiYWNrIGEgbm8tb3AuXG4gICAgfVxuICB9XG4gIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGNhbGxiYWNrKCk7XG4gICAgY2xlYW51cCgpO1xuICB9KSBhcyB1bmtub3duIGFzIG51bWJlcjtcbiAgaWYgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBhbmltYXRpb25GcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gKCkgPT4gY2xlYW51cCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2soY2FsbGJhY2s6IEZ1bmN0aW9uKTogKCkgPT4gdm9pZCB7XG4gIHF1ZXVlTWljcm90YXNrKCgpID0+IGNhbGxiYWNrKCkpO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY2FsbGJhY2sgPSBub29wO1xuICB9O1xufVxuIl19