/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createScope, detectWTF, endTimeRange, leave, startTimeRange } from './wtf_impl';
/**
 * True if WTF is enabled.
 */
export const /** @type {?} */ wtfEnabled = detectWTF();
/**
 * @param {?=} arg0
 * @param {?=} arg1
 * @return {?}
 */
function noopScope(arg0, arg1) {
    return null;
}
/**
 * Create trace scope.
 *
 * Scopes must be strictly nested and are analogous to stack frames, but
 * do not have to follow the stack frames. Instead it is recommended that they follow logical
 * nesting. You may want to use
 * [Event
 * Signatures](http://google.github.io/tracing-framework/instrumenting-code.html#custom-events)
 * as they are defined in WTF.
 *
 * Used to mark scope entry. The return value is used to leave the scope.
 *
 *     var myScope = wtfCreateScope('MyClass#myMethod(ascii someVal)');
 *
 *     someMethod() {
 *        var s = myScope('Foo'); // 'Foo' gets stored in tracing UI
 *        // DO SOME WORK HERE
 *        return wtfLeave(s, 123); // Return value 123
 *     }
 *
 * Note, adding try-finally block around the work to ensure that `wtfLeave` gets called can
 * negatively impact the performance of your application. For this reason we recommend that
 * you don't add them to ensure that `wtfLeave` gets called. In production `wtfLeave` is a noop and
 * so try-finally block has no value. When debugging perf issues, skipping `wtfLeave`, do to
 * exception, will produce incorrect trace, but presence of exception signifies logic error which
 * needs to be fixed before the app should be profiled. Add try-finally only when you expect that
 * an exception is expected during normal execution while profiling.
 *
 * \@experimental
 */
export const /** @type {?} */ wtfCreateScope = wtfEnabled ? createScope : (signature, flags) => noopScope;
/**
 * Used to mark end of Scope.
 *
 * - `scope` to end.
 * - `returnValue` (optional) to be passed to the WTF.
 *
 * Returns the `returnValue for easy chaining.
 * \@experimental
 */
export const /** @type {?} */ wtfLeave = wtfEnabled ? leave : (s, r) => r;
/**
 * Used to mark Async start. Async are similar to scope but they don't have to be strictly nested.
 * The return value is used in the call to [endAsync]. Async ranges only work if WTF has been
 * enabled.
 *
 *     someMethod() {
 *        var s = wtfStartTimeRange('HTTP:GET', 'some.url');
 *        var future = new Future.delay(5).then((_) {
 *          wtfEndTimeRange(s);
 *        });
 *     }
 * \@experimental
 */
export const /** @type {?} */ wtfStartTimeRange = wtfEnabled ? startTimeRange : (rangeType, action) => null;
/**
 * Ends a async time range operation.
 * [range] is the return value from [wtfStartTimeRange] Async ranges only work if WTF has been
 * enabled.
 * \@experimental
 */
export const /** @type {?} */ wtfEndTimeRange = wtfEnabled ? endTimeRange : (r) => null;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Byb2ZpbGUvcHJvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBYSxXQUFXLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7O0FBUW5HLE1BQU0sQ0FBQyx1QkFBTSxVQUFVLEdBQUcsU0FBUyxFQUFFLENBQUM7Ozs7OztBQUV0QyxtQkFBbUIsSUFBVSxFQUFFLElBQVU7SUFDdkMsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdDRCxNQUFNLENBQUMsdUJBQU0sY0FBYyxHQUN2QixVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFpQixFQUFFLEtBQVcsRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDOzs7Ozs7Ozs7O0FBVzdFLE1BQU0sQ0FBQyx1QkFBTSxRQUFRLEdBQ2pCLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQU0sRUFBRSxDQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFlaEQsTUFBTSxDQUFDLHVCQUFNLGlCQUFpQixHQUMxQixVQUFVLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFpQixFQUFFLE1BQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDOzs7Ozs7O0FBUTlFLE1BQU0sQ0FBQyx1QkFBTSxlQUFlLEdBQXlCLFVBQVUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1d0ZlNjb3BlRm4sIGNyZWF0ZVNjb3BlLCBkZXRlY3RXVEYsIGVuZFRpbWVSYW5nZSwgbGVhdmUsIHN0YXJ0VGltZVJhbmdlfSBmcm9tICcuL3d0Zl9pbXBsJztcblxuZXhwb3J0IHtXdGZTY29wZUZufSBmcm9tICcuL3d0Zl9pbXBsJztcblxuXG4vKipcbiAqIFRydWUgaWYgV1RGIGlzIGVuYWJsZWQuXG4gKi9cbmV4cG9ydCBjb25zdCB3dGZFbmFibGVkID0gZGV0ZWN0V1RGKCk7XG5cbmZ1bmN0aW9uIG5vb3BTY29wZShhcmcwPzogYW55LCBhcmcxPzogYW55KTogYW55IHtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRyYWNlIHNjb3BlLlxuICpcbiAqIFNjb3BlcyBtdXN0IGJlIHN0cmljdGx5IG5lc3RlZCBhbmQgYXJlIGFuYWxvZ291cyB0byBzdGFjayBmcmFtZXMsIGJ1dFxuICogZG8gbm90IGhhdmUgdG8gZm9sbG93IHRoZSBzdGFjayBmcmFtZXMuIEluc3RlYWQgaXQgaXMgcmVjb21tZW5kZWQgdGhhdCB0aGV5IGZvbGxvdyBsb2dpY2FsXG4gKiBuZXN0aW5nLiBZb3UgbWF5IHdhbnQgdG8gdXNlXG4gKiBbRXZlbnRcbiAqIFNpZ25hdHVyZXNdKGh0dHA6Ly9nb29nbGUuZ2l0aHViLmlvL3RyYWNpbmctZnJhbWV3b3JrL2luc3RydW1lbnRpbmctY29kZS5odG1sI2N1c3RvbS1ldmVudHMpXG4gKiBhcyB0aGV5IGFyZSBkZWZpbmVkIGluIFdURi5cbiAqXG4gKiBVc2VkIHRvIG1hcmsgc2NvcGUgZW50cnkuIFRoZSByZXR1cm4gdmFsdWUgaXMgdXNlZCB0byBsZWF2ZSB0aGUgc2NvcGUuXG4gKlxuICogICAgIHZhciBteVNjb3BlID0gd3RmQ3JlYXRlU2NvcGUoJ015Q2xhc3MjbXlNZXRob2QoYXNjaWkgc29tZVZhbCknKTtcbiAqXG4gKiAgICAgc29tZU1ldGhvZCgpIHtcbiAqICAgICAgICB2YXIgcyA9IG15U2NvcGUoJ0ZvbycpOyAvLyAnRm9vJyBnZXRzIHN0b3JlZCBpbiB0cmFjaW5nIFVJXG4gKiAgICAgICAgLy8gRE8gU09NRSBXT1JLIEhFUkVcbiAqICAgICAgICByZXR1cm4gd3RmTGVhdmUocywgMTIzKTsgLy8gUmV0dXJuIHZhbHVlIDEyM1xuICogICAgIH1cbiAqXG4gKiBOb3RlLCBhZGRpbmcgdHJ5LWZpbmFsbHkgYmxvY2sgYXJvdW5kIHRoZSB3b3JrIHRvIGVuc3VyZSB0aGF0IGB3dGZMZWF2ZWAgZ2V0cyBjYWxsZWQgY2FuXG4gKiBuZWdhdGl2ZWx5IGltcGFjdCB0aGUgcGVyZm9ybWFuY2Ugb2YgeW91ciBhcHBsaWNhdGlvbi4gRm9yIHRoaXMgcmVhc29uIHdlIHJlY29tbWVuZCB0aGF0XG4gKiB5b3UgZG9uJ3QgYWRkIHRoZW0gdG8gZW5zdXJlIHRoYXQgYHd0ZkxlYXZlYCBnZXRzIGNhbGxlZC4gSW4gcHJvZHVjdGlvbiBgd3RmTGVhdmVgIGlzIGEgbm9vcCBhbmRcbiAqIHNvIHRyeS1maW5hbGx5IGJsb2NrIGhhcyBubyB2YWx1ZS4gV2hlbiBkZWJ1Z2dpbmcgcGVyZiBpc3N1ZXMsIHNraXBwaW5nIGB3dGZMZWF2ZWAsIGRvIHRvXG4gKiBleGNlcHRpb24sIHdpbGwgcHJvZHVjZSBpbmNvcnJlY3QgdHJhY2UsIGJ1dCBwcmVzZW5jZSBvZiBleGNlcHRpb24gc2lnbmlmaWVzIGxvZ2ljIGVycm9yIHdoaWNoXG4gKiBuZWVkcyB0byBiZSBmaXhlZCBiZWZvcmUgdGhlIGFwcCBzaG91bGQgYmUgcHJvZmlsZWQuIEFkZCB0cnktZmluYWxseSBvbmx5IHdoZW4geW91IGV4cGVjdCB0aGF0XG4gKiBhbiBleGNlcHRpb24gaXMgZXhwZWN0ZWQgZHVyaW5nIG5vcm1hbCBleGVjdXRpb24gd2hpbGUgcHJvZmlsaW5nLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNvbnN0IHd0ZkNyZWF0ZVNjb3BlOiAoc2lnbmF0dXJlOiBzdHJpbmcsIGZsYWdzPzogYW55KSA9PiBXdGZTY29wZUZuID1cbiAgICB3dGZFbmFibGVkID8gY3JlYXRlU2NvcGUgOiAoc2lnbmF0dXJlOiBzdHJpbmcsIGZsYWdzPzogYW55KSA9PiBub29wU2NvcGU7XG5cbi8qKlxuICogVXNlZCB0byBtYXJrIGVuZCBvZiBTY29wZS5cbiAqXG4gKiAtIGBzY29wZWAgdG8gZW5kLlxuICogLSBgcmV0dXJuVmFsdWVgIChvcHRpb25hbCkgdG8gYmUgcGFzc2VkIHRvIHRoZSBXVEYuXG4gKlxuICogUmV0dXJucyB0aGUgYHJldHVyblZhbHVlIGZvciBlYXN5IGNoYWluaW5nLlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY29uc3Qgd3RmTGVhdmU6IDxUPihzY29wZTogYW55LCByZXR1cm5WYWx1ZT86IFQpID0+IFQgPVxuICAgIHd0ZkVuYWJsZWQgPyBsZWF2ZSA6IChzOiBhbnksIHI/OiBhbnkpID0+IHI7XG5cbi8qKlxuICogVXNlZCB0byBtYXJrIEFzeW5jIHN0YXJ0LiBBc3luYyBhcmUgc2ltaWxhciB0byBzY29wZSBidXQgdGhleSBkb24ndCBoYXZlIHRvIGJlIHN0cmljdGx5IG5lc3RlZC5cbiAqIFRoZSByZXR1cm4gdmFsdWUgaXMgdXNlZCBpbiB0aGUgY2FsbCB0byBbZW5kQXN5bmNdLiBBc3luYyByYW5nZXMgb25seSB3b3JrIGlmIFdURiBoYXMgYmVlblxuICogZW5hYmxlZC5cbiAqXG4gKiAgICAgc29tZU1ldGhvZCgpIHtcbiAqICAgICAgICB2YXIgcyA9IHd0ZlN0YXJ0VGltZVJhbmdlKCdIVFRQOkdFVCcsICdzb21lLnVybCcpO1xuICogICAgICAgIHZhciBmdXR1cmUgPSBuZXcgRnV0dXJlLmRlbGF5KDUpLnRoZW4oKF8pIHtcbiAqICAgICAgICAgIHd0ZkVuZFRpbWVSYW5nZShzKTtcbiAqICAgICAgICB9KTtcbiAqICAgICB9XG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjb25zdCB3dGZTdGFydFRpbWVSYW5nZTogKHJhbmdlVHlwZTogc3RyaW5nLCBhY3Rpb246IHN0cmluZykgPT4gYW55ID1cbiAgICB3dGZFbmFibGVkID8gc3RhcnRUaW1lUmFuZ2UgOiAocmFuZ2VUeXBlOiBzdHJpbmcsIGFjdGlvbjogc3RyaW5nKSA9PiBudWxsO1xuXG4vKipcbiAqIEVuZHMgYSBhc3luYyB0aW1lIHJhbmdlIG9wZXJhdGlvbi5cbiAqIFtyYW5nZV0gaXMgdGhlIHJldHVybiB2YWx1ZSBmcm9tIFt3dGZTdGFydFRpbWVSYW5nZV0gQXN5bmMgcmFuZ2VzIG9ubHkgd29yayBpZiBXVEYgaGFzIGJlZW5cbiAqIGVuYWJsZWQuXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjb25zdCB3dGZFbmRUaW1lUmFuZ2U6IChyYW5nZTogYW55KSA9PiB2b2lkID0gd3RmRW5hYmxlZCA/IGVuZFRpbWVSYW5nZSA6IChyOiBhbnkpID0+IG51bGw7XG4iXX0=