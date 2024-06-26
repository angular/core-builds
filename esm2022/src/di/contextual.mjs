/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { setInjectorProfilerContext, } from '../render3/debug/injector_profiler';
import { getInjectImplementation, setInjectImplementation } from './inject_switch';
import { getCurrentInjector, setCurrentInjector } from './injector_compatibility';
import { R3Injector } from './r3_injector';
/**
 * Runs the given function in the [context](guide/di/dependency-injection-context) of the given
 * `Injector`.
 *
 * Within the function's stack frame, [`inject`](api/core/inject) can be used to inject dependencies
 * from the given `Injector`. Note that `inject` is only usable synchronously, and cannot be used in
 * any asynchronous callbacks or after any `await` points.
 *
 * @param injector the injector which will satisfy calls to [`inject`](api/core/inject) while `fn`
 *     is executing
 * @param fn the closure to be run in the context of `injector`
 * @returns the return value of the function, if any
 * @publicApi
 */
export function runInInjectionContext(injector, fn) {
    if (injector instanceof R3Injector) {
        injector.assertNotDestroyed();
    }
    let prevInjectorProfilerContext;
    if (ngDevMode) {
        prevInjectorProfilerContext = setInjectorProfilerContext({ injector, token: null });
    }
    const prevInjector = setCurrentInjector(injector);
    const previousInjectImplementation = setInjectImplementation(undefined);
    try {
        return fn();
    }
    finally {
        setCurrentInjector(prevInjector);
        ngDevMode && setInjectorProfilerContext(prevInjectorProfilerContext);
        setInjectImplementation(previousInjectImplementation);
    }
}
/**
 * Whether the current stack frame is inside an injection context.
 */
export function isInInjectionContext() {
    return getInjectImplementation() !== undefined || getCurrentInjector() != null;
}
/**
 * Asserts that the current stack frame is within an [injection
 * context](guide/di/dependency-injection-context) and has access to `inject`.
 *
 * @param debugFn a reference to the function making the assertion (used for the error message).
 *
 * @publicApi
 */
export function assertInInjectionContext(debugFn) {
    // Taking a `Function` instead of a string name here prevents the unminified name of the function
    // from being retained in the bundle regardless of minification.
    if (!isInInjectionContext()) {
        throw new RuntimeError(-203 /* RuntimeErrorCode.MISSING_INJECTION_CONTEXT */, ngDevMode &&
            debugFn.name +
                '() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dHVhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2NvbnRleHR1YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUVMLDBCQUEwQixHQUMzQixNQUFNLG9DQUFvQyxDQUFDO0FBRTVDLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRWpGLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFekM7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBVSxRQUFrQixFQUFFLEVBQWlCO0lBQ2xGLElBQUksUUFBUSxZQUFZLFVBQVUsRUFBRSxDQUFDO1FBQ25DLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxJQUFJLDJCQUFvRCxDQUFDO0lBQ3pELElBQUksU0FBUyxFQUFFLENBQUM7UUFDZCwyQkFBMkIsR0FBRywwQkFBMEIsQ0FBQyxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBQ0QsTUFBTSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEQsTUFBTSw0QkFBNEIsR0FBRyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4RSxJQUFJLENBQUM7UUFDSCxPQUFPLEVBQUUsRUFBRSxDQUFDO0lBQ2QsQ0FBQztZQUFTLENBQUM7UUFDVCxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqQyxTQUFTLElBQUksMEJBQTBCLENBQUMsMkJBQTRCLENBQUMsQ0FBQztRQUN0RSx1QkFBdUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQ3hELENBQUM7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE9BQU8sdUJBQXVCLEVBQUUsS0FBSyxTQUFTLElBQUksa0JBQWtCLEVBQUUsSUFBSSxJQUFJLENBQUM7QUFDakYsQ0FBQztBQUNEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsT0FBaUI7SUFDeEQsaUdBQWlHO0lBQ2pHLGdFQUFnRTtJQUNoRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDO1FBQzVCLE1BQU0sSUFBSSxZQUFZLHdEQUVwQixTQUFTO1lBQ1AsT0FBTyxDQUFDLElBQUk7Z0JBQ1YsaUtBQWlLLENBQ3RLLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7XG4gIEluamVjdG9yUHJvZmlsZXJDb250ZXh0LFxuICBzZXRJbmplY3RvclByb2ZpbGVyQ29udGV4dCxcbn0gZnJvbSAnLi4vcmVuZGVyMy9kZWJ1Zy9pbmplY3Rvcl9wcm9maWxlcic7XG5cbmltcG9ydCB7Z2V0SW5qZWN0SW1wbGVtZW50YXRpb24sIHNldEluamVjdEltcGxlbWVudGF0aW9ufSBmcm9tICcuL2luamVjdF9zd2l0Y2gnO1xuaW1wb3J0IHR5cGUge0luamVjdG9yfSBmcm9tICcuL2luamVjdG9yJztcbmltcG9ydCB7Z2V0Q3VycmVudEluamVjdG9yLCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1IzSW5qZWN0b3J9IGZyb20gJy4vcjNfaW5qZWN0b3InO1xuXG4vKipcbiAqIFJ1bnMgdGhlIGdpdmVuIGZ1bmN0aW9uIGluIHRoZSBbY29udGV4dF0oZ3VpZGUvZGkvZGVwZW5kZW5jeS1pbmplY3Rpb24tY29udGV4dCkgb2YgdGhlIGdpdmVuXG4gKiBgSW5qZWN0b3JgLlxuICpcbiAqIFdpdGhpbiB0aGUgZnVuY3Rpb24ncyBzdGFjayBmcmFtZSwgW2BpbmplY3RgXShhcGkvY29yZS9pbmplY3QpIGNhbiBiZSB1c2VkIHRvIGluamVjdCBkZXBlbmRlbmNpZXNcbiAqIGZyb20gdGhlIGdpdmVuIGBJbmplY3RvcmAuIE5vdGUgdGhhdCBgaW5qZWN0YCBpcyBvbmx5IHVzYWJsZSBzeW5jaHJvbm91c2x5LCBhbmQgY2Fubm90IGJlIHVzZWQgaW5cbiAqIGFueSBhc3luY2hyb25vdXMgY2FsbGJhY2tzIG9yIGFmdGVyIGFueSBgYXdhaXRgIHBvaW50cy5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgdGhlIGluamVjdG9yIHdoaWNoIHdpbGwgc2F0aXNmeSBjYWxscyB0byBbYGluamVjdGBdKGFwaS9jb3JlL2luamVjdCkgd2hpbGUgYGZuYFxuICogICAgIGlzIGV4ZWN1dGluZ1xuICogQHBhcmFtIGZuIHRoZSBjbG9zdXJlIHRvIGJlIHJ1biBpbiB0aGUgY29udGV4dCBvZiBgaW5qZWN0b3JgXG4gKiBAcmV0dXJucyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiwgaWYgYW55XG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBydW5JbkluamVjdGlvbkNvbnRleHQ8UmV0dXJuVD4oaW5qZWN0b3I6IEluamVjdG9yLCBmbjogKCkgPT4gUmV0dXJuVCk6IFJldHVyblQge1xuICBpZiAoaW5qZWN0b3IgaW5zdGFuY2VvZiBSM0luamVjdG9yKSB7XG4gICAgaW5qZWN0b3IuYXNzZXJ0Tm90RGVzdHJveWVkKCk7XG4gIH1cblxuICBsZXQgcHJldkluamVjdG9yUHJvZmlsZXJDb250ZXh0OiBJbmplY3RvclByb2ZpbGVyQ29udGV4dDtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIHByZXZJbmplY3RvclByb2ZpbGVyQ29udGV4dCA9IHNldEluamVjdG9yUHJvZmlsZXJDb250ZXh0KHtpbmplY3RvciwgdG9rZW46IG51bGx9KTtcbiAgfVxuICBjb25zdCBwcmV2SW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IoaW5qZWN0b3IpO1xuICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZm4oKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDdXJyZW50SW5qZWN0b3IocHJldkluamVjdG9yKTtcbiAgICBuZ0Rldk1vZGUgJiYgc2V0SW5qZWN0b3JQcm9maWxlckNvbnRleHQocHJldkluamVjdG9yUHJvZmlsZXJDb250ZXh0ISk7XG4gICAgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gIH1cbn1cblxuLyoqXG4gKiBXaGV0aGVyIHRoZSBjdXJyZW50IHN0YWNrIGZyYW1lIGlzIGluc2lkZSBhbiBpbmplY3Rpb24gY29udGV4dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSW5JbmplY3Rpb25Db250ZXh0KCk6IGJvb2xlYW4ge1xuICByZXR1cm4gZ2V0SW5qZWN0SW1wbGVtZW50YXRpb24oKSAhPT0gdW5kZWZpbmVkIHx8IGdldEN1cnJlbnRJbmplY3RvcigpICE9IG51bGw7XG59XG4vKipcbiAqIEFzc2VydHMgdGhhdCB0aGUgY3VycmVudCBzdGFjayBmcmFtZSBpcyB3aXRoaW4gYW4gW2luamVjdGlvblxuICogY29udGV4dF0oZ3VpZGUvZGkvZGVwZW5kZW5jeS1pbmplY3Rpb24tY29udGV4dCkgYW5kIGhhcyBhY2Nlc3MgdG8gYGluamVjdGAuXG4gKlxuICogQHBhcmFtIGRlYnVnRm4gYSByZWZlcmVuY2UgdG8gdGhlIGZ1bmN0aW9uIG1ha2luZyB0aGUgYXNzZXJ0aW9uICh1c2VkIGZvciB0aGUgZXJyb3IgbWVzc2FnZSkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGRlYnVnRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIC8vIFRha2luZyBhIGBGdW5jdGlvbmAgaW5zdGVhZCBvZiBhIHN0cmluZyBuYW1lIGhlcmUgcHJldmVudHMgdGhlIHVubWluaWZpZWQgbmFtZSBvZiB0aGUgZnVuY3Rpb25cbiAgLy8gZnJvbSBiZWluZyByZXRhaW5lZCBpbiB0aGUgYnVuZGxlIHJlZ2FyZGxlc3Mgb2YgbWluaWZpY2F0aW9uLlxuICBpZiAoIWlzSW5JbmplY3Rpb25Db250ZXh0KCkpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX0lOSkVDVElPTl9DT05URVhULFxuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGRlYnVnRm4ubmFtZSArXG4gICAgICAgICAgJygpIGNhbiBvbmx5IGJlIHVzZWQgd2l0aGluIGFuIGluamVjdGlvbiBjb250ZXh0IHN1Y2ggYXMgYSBjb25zdHJ1Y3RvciwgYSBmYWN0b3J5IGZ1bmN0aW9uLCBhIGZpZWxkIGluaXRpYWxpemVyLCBvciBhIGZ1bmN0aW9uIHVzZWQgd2l0aCBgcnVuSW5JbmplY3Rpb25Db250ZXh0YCcsXG4gICAgKTtcbiAgfVxufVxuIl19