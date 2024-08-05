/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const _Zone = typeof Zone !== 'undefined' ? Zone : null;
const fakeAsyncTestModule = _Zone && _Zone[_Zone.__symbol__('fakeAsyncTest')];
const fakeAsyncTestModuleNotLoadedErrorMessage = `zone-testing.js is needed for the fakeAsync() test helper but could not be found.
        Please make sure that your environment includes zone.js/testing`;
/**
 * Clears out the shared fake async zone for a test.
 * To be called in a global `beforeEach`.
 *
 * @publicApi
 */
export function resetFakeAsyncZone() {
    if (fakeAsyncTestModule) {
        return fakeAsyncTestModule.resetFakeAsyncZone();
    }
    throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}
export function resetFakeAsyncZoneIfExists() {
    if (fakeAsyncTestModule) {
        fakeAsyncTestModule.resetFakeAsyncZone();
    }
}
/**
 * Wraps a function to be executed in the `fakeAsync` zone:
 * - Microtasks are manually executed by calling `flushMicrotasks()`.
 * - Timers are synchronous; `tick()` simulates the asynchronous passage of time.
 *
 * Can be used to wrap `inject()` calls.
 *
 * @param fn The function that you want to wrap in the `fakeAsync` zone.
 * @param options
 *   - flush: When true, will drain the macrotask queue after the test function completes.
 *     When false, will throw an exception at the end of the function if there are pending timers.
 *
 * @usageNotes
 * ### Example
 *
 * {@example core/testing/ts/fake_async.ts region='basic'}
 *
 *
 * @returns The function wrapped to be executed in the `fakeAsync` zone.
 * Any arguments passed when calling this returned function will be passed through to the `fn`
 * function in the parameters when it is called.
 *
 * @publicApi
 */
export function fakeAsync(fn, options) {
    if (fakeAsyncTestModule) {
        return fakeAsyncTestModule.fakeAsync(fn, options);
    }
    throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}
/**
 * Simulates the asynchronous passage of time for the timers in the `fakeAsync` zone.
 *
 * The microtasks queue is drained at the very start of this function and after any timer callback
 * has been executed.
 *
 * @param millis The number of milliseconds to advance the virtual timer.
 * @param tickOptions The options to pass to the `tick()` function.
 *
 * @usageNotes
 *
 * The `tick()` option is a flag called `processNewMacroTasksSynchronously`,
 * which determines whether or not to invoke new macroTasks.
 *
 * If you provide a `tickOptions` object, but do not specify a
 * `processNewMacroTasksSynchronously` property (`tick(100, {})`),
 * then `processNewMacroTasksSynchronously` defaults to true.
 *
 * If you omit the `tickOptions` parameter (`tick(100))`), then
 * `tickOptions` defaults to `{processNewMacroTasksSynchronously: true}`.
 *
 * ### Example
 *
 * {@example core/testing/ts/fake_async.ts region='basic'}
 *
 * The following example includes a nested timeout (new macroTask), and
 * the `tickOptions` parameter is allowed to default. In this case,
 * `processNewMacroTasksSynchronously` defaults to true, and the nested
 * function is executed on each tick.
 *
 * ```
 * it ('test with nested setTimeout', fakeAsync(() => {
 *   let nestedTimeoutInvoked = false;
 *   function funcWithNestedTimeout() {
 *     setTimeout(() => {
 *       nestedTimeoutInvoked = true;
 *     });
 *   };
 *   setTimeout(funcWithNestedTimeout);
 *   tick();
 *   expect(nestedTimeoutInvoked).toBe(true);
 * }));
 * ```
 *
 * In the following case, `processNewMacroTasksSynchronously` is explicitly
 * set to false, so the nested timeout function is not invoked.
 *
 * ```
 * it ('test with nested setTimeout', fakeAsync(() => {
 *   let nestedTimeoutInvoked = false;
 *   function funcWithNestedTimeout() {
 *     setTimeout(() => {
 *       nestedTimeoutInvoked = true;
 *     });
 *   };
 *   setTimeout(funcWithNestedTimeout);
 *   tick(0, {processNewMacroTasksSynchronously: false});
 *   expect(nestedTimeoutInvoked).toBe(false);
 * }));
 * ```
 *
 *
 * @publicApi
 */
export function tick(millis = 0, tickOptions = {
    processNewMacroTasksSynchronously: true,
}) {
    if (fakeAsyncTestModule) {
        return fakeAsyncTestModule.tick(millis, tickOptions);
    }
    throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}
/**
 * Flushes any pending microtasks and simulates the asynchronous passage of time for the timers in
 * the `fakeAsync` zone by
 * draining the macrotask queue until it is empty.
 *
 * @param maxTurns The maximum number of times the scheduler attempts to clear its queue before
 *     throwing an error.
 * @returns The simulated time elapsed, in milliseconds.
 *
 * @publicApi
 */
export function flush(maxTurns) {
    if (fakeAsyncTestModule) {
        return fakeAsyncTestModule.flush(maxTurns);
    }
    throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}
/**
 * Discard all remaining periodic tasks.
 *
 * @publicApi
 */
export function discardPeriodicTasks() {
    if (fakeAsyncTestModule) {
        return fakeAsyncTestModule.discardPeriodicTasks();
    }
    throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}
/**
 * Flush any pending microtasks.
 *
 * @publicApi
 */
export function flushMicrotasks() {
    if (fakeAsyncTestModule) {
        return fakeAsyncTestModule.flushMicrotasks();
    }
    throw new Error(fakeAsyncTestModuleNotLoadedErrorMessage);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFrZV9hc3luYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvZmFrZV9hc3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxNQUFNLEtBQUssR0FBUSxPQUFPLElBQUksS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzdELE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7QUFFOUUsTUFBTSx3Q0FBd0MsR0FBRzt3RUFDdUIsQ0FBQztBQUV6RTs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxrQkFBa0I7SUFDaEMsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sbUJBQW1CLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUNsRCxDQUFDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRCxNQUFNLFVBQVUsMEJBQTBCO0lBQ3hDLElBQUksbUJBQW1CLEVBQUUsQ0FBQztRQUN4QixtQkFBbUIsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQzNDLENBQUM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUJHO0FBQ0gsTUFBTSxVQUFVLFNBQVMsQ0FBQyxFQUFZLEVBQUUsT0FBMkI7SUFDakUsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sbUJBQW1CLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBK0RHO0FBQ0gsTUFBTSxVQUFVLElBQUksQ0FDbEIsU0FBaUIsQ0FBQyxFQUNsQixjQUE0RDtJQUMxRCxpQ0FBaUMsRUFBRSxJQUFJO0NBQ3hDO0lBRUQsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsTUFBTSxVQUFVLEtBQUssQ0FBQyxRQUFpQjtJQUNyQyxJQUFJLG1CQUFtQixFQUFFLENBQUM7UUFDeEIsT0FBTyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sbUJBQW1CLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUNwRCxDQUFDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGVBQWU7SUFDN0IsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sbUJBQW1CLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDL0MsQ0FBQztJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztBQUM1RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5jb25zdCBfWm9uZTogYW55ID0gdHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnID8gWm9uZSA6IG51bGw7XG5jb25zdCBmYWtlQXN5bmNUZXN0TW9kdWxlID0gX1pvbmUgJiYgX1pvbmVbX1pvbmUuX19zeW1ib2xfXygnZmFrZUFzeW5jVGVzdCcpXTtcblxuY29uc3QgZmFrZUFzeW5jVGVzdE1vZHVsZU5vdExvYWRlZEVycm9yTWVzc2FnZSA9IGB6b25lLXRlc3RpbmcuanMgaXMgbmVlZGVkIGZvciB0aGUgZmFrZUFzeW5jKCkgdGVzdCBoZWxwZXIgYnV0IGNvdWxkIG5vdCBiZSBmb3VuZC5cbiAgICAgICAgUGxlYXNlIG1ha2Ugc3VyZSB0aGF0IHlvdXIgZW52aXJvbm1lbnQgaW5jbHVkZXMgem9uZS5qcy90ZXN0aW5nYDtcblxuLyoqXG4gKiBDbGVhcnMgb3V0IHRoZSBzaGFyZWQgZmFrZSBhc3luYyB6b25lIGZvciBhIHRlc3QuXG4gKiBUbyBiZSBjYWxsZWQgaW4gYSBnbG9iYWwgYGJlZm9yZUVhY2hgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0RmFrZUFzeW5jWm9uZSgpOiB2b2lkIHtcbiAgaWYgKGZha2VBc3luY1Rlc3RNb2R1bGUpIHtcbiAgICByZXR1cm4gZmFrZUFzeW5jVGVzdE1vZHVsZS5yZXNldEZha2VBc3luY1pvbmUoKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoZmFrZUFzeW5jVGVzdE1vZHVsZU5vdExvYWRlZEVycm9yTWVzc2FnZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldEZha2VBc3luY1pvbmVJZkV4aXN0cygpOiB2b2lkIHtcbiAgaWYgKGZha2VBc3luY1Rlc3RNb2R1bGUpIHtcbiAgICBmYWtlQXN5bmNUZXN0TW9kdWxlLnJlc2V0RmFrZUFzeW5jWm9uZSgpO1xuICB9XG59XG5cbi8qKlxuICogV3JhcHMgYSBmdW5jdGlvbiB0byBiZSBleGVjdXRlZCBpbiB0aGUgYGZha2VBc3luY2Agem9uZTpcbiAqIC0gTWljcm90YXNrcyBhcmUgbWFudWFsbHkgZXhlY3V0ZWQgYnkgY2FsbGluZyBgZmx1c2hNaWNyb3Rhc2tzKClgLlxuICogLSBUaW1lcnMgYXJlIHN5bmNocm9ub3VzOyBgdGljaygpYCBzaW11bGF0ZXMgdGhlIGFzeW5jaHJvbm91cyBwYXNzYWdlIG9mIHRpbWUuXG4gKlxuICogQ2FuIGJlIHVzZWQgdG8gd3JhcCBgaW5qZWN0KClgIGNhbGxzLlxuICpcbiAqIEBwYXJhbSBmbiBUaGUgZnVuY3Rpb24gdGhhdCB5b3Ugd2FudCB0byB3cmFwIGluIHRoZSBgZmFrZUFzeW5jYCB6b25lLlxuICogQHBhcmFtIG9wdGlvbnNcbiAqICAgLSBmbHVzaDogV2hlbiB0cnVlLCB3aWxsIGRyYWluIHRoZSBtYWNyb3Rhc2sgcXVldWUgYWZ0ZXIgdGhlIHRlc3QgZnVuY3Rpb24gY29tcGxldGVzLlxuICogICAgIFdoZW4gZmFsc2UsIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGF0IHRoZSBlbmQgb2YgdGhlIGZ1bmN0aW9uIGlmIHRoZXJlIGFyZSBwZW5kaW5nIHRpbWVycy5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS90ZXN0aW5nL3RzL2Zha2VfYXN5bmMudHMgcmVnaW9uPSdiYXNpYyd9XG4gKlxuICpcbiAqIEByZXR1cm5zIFRoZSBmdW5jdGlvbiB3cmFwcGVkIHRvIGJlIGV4ZWN1dGVkIGluIHRoZSBgZmFrZUFzeW5jYCB6b25lLlxuICogQW55IGFyZ3VtZW50cyBwYXNzZWQgd2hlbiBjYWxsaW5nIHRoaXMgcmV0dXJuZWQgZnVuY3Rpb24gd2lsbCBiZSBwYXNzZWQgdGhyb3VnaCB0byB0aGUgYGZuYFxuICogZnVuY3Rpb24gaW4gdGhlIHBhcmFtZXRlcnMgd2hlbiBpdCBpcyBjYWxsZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmFrZUFzeW5jKGZuOiBGdW5jdGlvbiwgb3B0aW9ucz86IHtmbHVzaD86IGJvb2xlYW59KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkge1xuICBpZiAoZmFrZUFzeW5jVGVzdE1vZHVsZSkge1xuICAgIHJldHVybiBmYWtlQXN5bmNUZXN0TW9kdWxlLmZha2VBc3luYyhmbiwgb3B0aW9ucyk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGZha2VBc3luY1Rlc3RNb2R1bGVOb3RMb2FkZWRFcnJvck1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIFNpbXVsYXRlcyB0aGUgYXN5bmNocm9ub3VzIHBhc3NhZ2Ugb2YgdGltZSBmb3IgdGhlIHRpbWVycyBpbiB0aGUgYGZha2VBc3luY2Agem9uZS5cbiAqXG4gKiBUaGUgbWljcm90YXNrcyBxdWV1ZSBpcyBkcmFpbmVkIGF0IHRoZSB2ZXJ5IHN0YXJ0IG9mIHRoaXMgZnVuY3Rpb24gYW5kIGFmdGVyIGFueSB0aW1lciBjYWxsYmFja1xuICogaGFzIGJlZW4gZXhlY3V0ZWQuXG4gKlxuICogQHBhcmFtIG1pbGxpcyBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBhZHZhbmNlIHRoZSB2aXJ0dWFsIHRpbWVyLlxuICogQHBhcmFtIHRpY2tPcHRpb25zIFRoZSBvcHRpb25zIHRvIHBhc3MgdG8gdGhlIGB0aWNrKClgIGZ1bmN0aW9uLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVGhlIGB0aWNrKClgIG9wdGlvbiBpcyBhIGZsYWcgY2FsbGVkIGBwcm9jZXNzTmV3TWFjcm9UYXNrc1N5bmNocm9ub3VzbHlgLFxuICogd2hpY2ggZGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byBpbnZva2UgbmV3IG1hY3JvVGFza3MuXG4gKlxuICogSWYgeW91IHByb3ZpZGUgYSBgdGlja09wdGlvbnNgIG9iamVjdCwgYnV0IGRvIG5vdCBzcGVjaWZ5IGFcbiAqIGBwcm9jZXNzTmV3TWFjcm9UYXNrc1N5bmNocm9ub3VzbHlgIHByb3BlcnR5IChgdGljaygxMDAsIHt9KWApLFxuICogdGhlbiBgcHJvY2Vzc05ld01hY3JvVGFza3NTeW5jaHJvbm91c2x5YCBkZWZhdWx0cyB0byB0cnVlLlxuICpcbiAqIElmIHlvdSBvbWl0IHRoZSBgdGlja09wdGlvbnNgIHBhcmFtZXRlciAoYHRpY2soMTAwKSlgKSwgdGhlblxuICogYHRpY2tPcHRpb25zYCBkZWZhdWx0cyB0byBge3Byb2Nlc3NOZXdNYWNyb1Rhc2tzU3luY2hyb25vdXNseTogdHJ1ZX1gLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvdGVzdGluZy90cy9mYWtlX2FzeW5jLnRzIHJlZ2lvbj0nYmFzaWMnfVxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBpbmNsdWRlcyBhIG5lc3RlZCB0aW1lb3V0IChuZXcgbWFjcm9UYXNrKSwgYW5kXG4gKiB0aGUgYHRpY2tPcHRpb25zYCBwYXJhbWV0ZXIgaXMgYWxsb3dlZCB0byBkZWZhdWx0LiBJbiB0aGlzIGNhc2UsXG4gKiBgcHJvY2Vzc05ld01hY3JvVGFza3NTeW5jaHJvbm91c2x5YCBkZWZhdWx0cyB0byB0cnVlLCBhbmQgdGhlIG5lc3RlZFxuICogZnVuY3Rpb24gaXMgZXhlY3V0ZWQgb24gZWFjaCB0aWNrLlxuICpcbiAqIGBgYFxuICogaXQgKCd0ZXN0IHdpdGggbmVzdGVkIHNldFRpbWVvdXQnLCBmYWtlQXN5bmMoKCkgPT4ge1xuICogICBsZXQgbmVzdGVkVGltZW91dEludm9rZWQgPSBmYWxzZTtcbiAqICAgZnVuY3Rpb24gZnVuY1dpdGhOZXN0ZWRUaW1lb3V0KCkge1xuICogICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICogICAgICAgbmVzdGVkVGltZW91dEludm9rZWQgPSB0cnVlO1xuICogICAgIH0pO1xuICogICB9O1xuICogICBzZXRUaW1lb3V0KGZ1bmNXaXRoTmVzdGVkVGltZW91dCk7XG4gKiAgIHRpY2soKTtcbiAqICAgZXhwZWN0KG5lc3RlZFRpbWVvdXRJbnZva2VkKS50b0JlKHRydWUpO1xuICogfSkpO1xuICogYGBgXG4gKlxuICogSW4gdGhlIGZvbGxvd2luZyBjYXNlLCBgcHJvY2Vzc05ld01hY3JvVGFza3NTeW5jaHJvbm91c2x5YCBpcyBleHBsaWNpdGx5XG4gKiBzZXQgdG8gZmFsc2UsIHNvIHRoZSBuZXN0ZWQgdGltZW91dCBmdW5jdGlvbiBpcyBub3QgaW52b2tlZC5cbiAqXG4gKiBgYGBcbiAqIGl0ICgndGVzdCB3aXRoIG5lc3RlZCBzZXRUaW1lb3V0JywgZmFrZUFzeW5jKCgpID0+IHtcbiAqICAgbGV0IG5lc3RlZFRpbWVvdXRJbnZva2VkID0gZmFsc2U7XG4gKiAgIGZ1bmN0aW9uIGZ1bmNXaXRoTmVzdGVkVGltZW91dCgpIHtcbiAqICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAqICAgICAgIG5lc3RlZFRpbWVvdXRJbnZva2VkID0gdHJ1ZTtcbiAqICAgICB9KTtcbiAqICAgfTtcbiAqICAgc2V0VGltZW91dChmdW5jV2l0aE5lc3RlZFRpbWVvdXQpO1xuICogICB0aWNrKDAsIHtwcm9jZXNzTmV3TWFjcm9UYXNrc1N5bmNocm9ub3VzbHk6IGZhbHNlfSk7XG4gKiAgIGV4cGVjdChuZXN0ZWRUaW1lb3V0SW52b2tlZCkudG9CZShmYWxzZSk7XG4gKiB9KSk7XG4gKiBgYGBcbiAqXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljayhcbiAgbWlsbGlzOiBudW1iZXIgPSAwLFxuICB0aWNrT3B0aW9uczoge3Byb2Nlc3NOZXdNYWNyb1Rhc2tzU3luY2hyb25vdXNseTogYm9vbGVhbn0gPSB7XG4gICAgcHJvY2Vzc05ld01hY3JvVGFza3NTeW5jaHJvbm91c2x5OiB0cnVlLFxuICB9LFxuKTogdm9pZCB7XG4gIGlmIChmYWtlQXN5bmNUZXN0TW9kdWxlKSB7XG4gICAgcmV0dXJuIGZha2VBc3luY1Rlc3RNb2R1bGUudGljayhtaWxsaXMsIHRpY2tPcHRpb25zKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoZmFrZUFzeW5jVGVzdE1vZHVsZU5vdExvYWRlZEVycm9yTWVzc2FnZSk7XG59XG5cbi8qKlxuICogRmx1c2hlcyBhbnkgcGVuZGluZyBtaWNyb3Rhc2tzIGFuZCBzaW11bGF0ZXMgdGhlIGFzeW5jaHJvbm91cyBwYXNzYWdlIG9mIHRpbWUgZm9yIHRoZSB0aW1lcnMgaW5cbiAqIHRoZSBgZmFrZUFzeW5jYCB6b25lIGJ5XG4gKiBkcmFpbmluZyB0aGUgbWFjcm90YXNrIHF1ZXVlIHVudGlsIGl0IGlzIGVtcHR5LlxuICpcbiAqIEBwYXJhbSBtYXhUdXJucyBUaGUgbWF4aW11bSBudW1iZXIgb2YgdGltZXMgdGhlIHNjaGVkdWxlciBhdHRlbXB0cyB0byBjbGVhciBpdHMgcXVldWUgYmVmb3JlXG4gKiAgICAgdGhyb3dpbmcgYW4gZXJyb3IuXG4gKiBAcmV0dXJucyBUaGUgc2ltdWxhdGVkIHRpbWUgZWxhcHNlZCwgaW4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoKG1heFR1cm5zPzogbnVtYmVyKTogbnVtYmVyIHtcbiAgaWYgKGZha2VBc3luY1Rlc3RNb2R1bGUpIHtcbiAgICByZXR1cm4gZmFrZUFzeW5jVGVzdE1vZHVsZS5mbHVzaChtYXhUdXJucyk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGZha2VBc3luY1Rlc3RNb2R1bGVOb3RMb2FkZWRFcnJvck1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIERpc2NhcmQgYWxsIHJlbWFpbmluZyBwZXJpb2RpYyB0YXNrcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNjYXJkUGVyaW9kaWNUYXNrcygpOiB2b2lkIHtcbiAgaWYgKGZha2VBc3luY1Rlc3RNb2R1bGUpIHtcbiAgICByZXR1cm4gZmFrZUFzeW5jVGVzdE1vZHVsZS5kaXNjYXJkUGVyaW9kaWNUYXNrcygpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihmYWtlQXN5bmNUZXN0TW9kdWxlTm90TG9hZGVkRXJyb3JNZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBGbHVzaCBhbnkgcGVuZGluZyBtaWNyb3Rhc2tzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoTWljcm90YXNrcygpOiB2b2lkIHtcbiAgaWYgKGZha2VBc3luY1Rlc3RNb2R1bGUpIHtcbiAgICByZXR1cm4gZmFrZUFzeW5jVGVzdE1vZHVsZS5mbHVzaE1pY3JvdGFza3MoKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoZmFrZUFzeW5jVGVzdE1vZHVsZU5vdExvYWRlZEVycm9yTWVzc2FnZSk7XG59XG4iXX0=