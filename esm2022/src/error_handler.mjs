/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, InjectionToken } from './di';
import { getOriginalError } from './util/errors';
import { NgZone } from './zone';
/**
 * Provides a hook for centralized exception handling.
 *
 * The default implementation of `ErrorHandler` prints error messages to the `console`. To
 * intercept error handling, write a custom exception handler that replaces this default as
 * appropriate for your app.
 *
 * @usageNotes
 * ### Example
 *
 * ```
 * class MyErrorHandler implements ErrorHandler {
 *   handleError(error) {
 *     // do something with the exception
 *   }
 * }
 *
 * @NgModule({
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 * class MyModule {}
 * ```
 *
 * @publicApi
 */
export class ErrorHandler {
    constructor() {
        /**
         * @internal
         */
        this._console = console;
    }
    handleError(error) {
        const originalError = this._findOriginalError(error);
        this._console.error('ERROR', error);
        if (originalError) {
            this._console.error('ORIGINAL ERROR', originalError);
        }
    }
    /** @internal */
    _findOriginalError(error) {
        let e = error && getOriginalError(error);
        while (e && getOriginalError(e)) {
            e = getOriginalError(e);
        }
        return e || null;
    }
}
/**
 * `InjectionToken` used to configure how to call the `ErrorHandler`.
 *
 * `NgZone` is provided by default today so the default (and only) implementation for this
 * is calling `ErrorHandler.handleError` outside of the Angular zone.
 */
export const INTERNAL_APPLICATION_ERROR_HANDLER = new InjectionToken(typeof ngDevMode === 'undefined' || ngDevMode ? 'internal error handler' : '', {
    providedIn: 'root',
    factory: () => {
        const zone = inject(NgZone);
        const userErrorHandler = inject(ErrorHandler);
        return (e) => zone.runOutsideAngular(() => userErrorHandler.handleError(e));
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2Vycm9yX2hhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDNUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFOUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXdCRztBQUNILE1BQU0sT0FBTyxZQUFZO0lBQXpCO1FBQ0U7O1dBRUc7UUFDSCxhQUFRLEdBQVksT0FBTyxDQUFDO0lBb0I5QixDQUFDO0lBbEJDLFdBQVcsQ0FBQyxLQUFVO1FBQ3BCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEMsSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN2RCxDQUFDO0lBQ0gsQ0FBQztJQUVELGdCQUFnQjtJQUNoQixrQkFBa0IsQ0FBQyxLQUFVO1FBQzNCLElBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxPQUFPLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2hDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRUQsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sa0NBQWtDLEdBQUcsSUFBSSxjQUFjLENBQ2xFLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQzdFO0lBQ0UsVUFBVSxFQUFFLE1BQU07SUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRTtRQUNaLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM5QyxPQUFPLENBQUMsQ0FBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkYsQ0FBQztDQUNGLENBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2luamVjdCwgSW5qZWN0aW9uVG9rZW59IGZyb20gJy4vZGknO1xuaW1wb3J0IHtnZXRPcmlnaW5hbEVycm9yfSBmcm9tICcuL3V0aWwvZXJyb3JzJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuL3pvbmUnO1xuXG4vKipcbiAqIFByb3ZpZGVzIGEgaG9vayBmb3IgY2VudHJhbGl6ZWQgZXhjZXB0aW9uIGhhbmRsaW5nLlxuICpcbiAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIGBFcnJvckhhbmRsZXJgIHByaW50cyBlcnJvciBtZXNzYWdlcyB0byB0aGUgYGNvbnNvbGVgLiBUb1xuICogaW50ZXJjZXB0IGVycm9yIGhhbmRsaW5nLCB3cml0ZSBhIGN1c3RvbSBleGNlcHRpb24gaGFuZGxlciB0aGF0IHJlcGxhY2VzIHRoaXMgZGVmYXVsdCBhc1xuICogYXBwcm9wcmlhdGUgZm9yIHlvdXIgYXBwLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYFxuICogY2xhc3MgTXlFcnJvckhhbmRsZXIgaW1wbGVtZW50cyBFcnJvckhhbmRsZXIge1xuICogICBoYW5kbGVFcnJvcihlcnJvcikge1xuICogICAgIC8vIGRvIHNvbWV0aGluZyB3aXRoIHRoZSBleGNlcHRpb25cbiAqICAgfVxuICogfVxuICpcbiAqIEBOZ01vZHVsZSh7XG4gKiAgIHByb3ZpZGVyczogW3twcm92aWRlOiBFcnJvckhhbmRsZXIsIHVzZUNsYXNzOiBNeUVycm9ySGFuZGxlcn1dXG4gKiB9KVxuICogY2xhc3MgTXlNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIEVycm9ySGFuZGxlciB7XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb25zb2xlOiBDb25zb2xlID0gY29uc29sZTtcblxuICBoYW5kbGVFcnJvcihlcnJvcjogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgb3JpZ2luYWxFcnJvciA9IHRoaXMuX2ZpbmRPcmlnaW5hbEVycm9yKGVycm9yKTtcblxuICAgIHRoaXMuX2NvbnNvbGUuZXJyb3IoJ0VSUk9SJywgZXJyb3IpO1xuICAgIGlmIChvcmlnaW5hbEVycm9yKSB7XG4gICAgICB0aGlzLl9jb25zb2xlLmVycm9yKCdPUklHSU5BTCBFUlJPUicsIG9yaWdpbmFsRXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2ZpbmRPcmlnaW5hbEVycm9yKGVycm9yOiBhbnkpOiBFcnJvciB8IG51bGwge1xuICAgIGxldCBlID0gZXJyb3IgJiYgZ2V0T3JpZ2luYWxFcnJvcihlcnJvcik7XG4gICAgd2hpbGUgKGUgJiYgZ2V0T3JpZ2luYWxFcnJvcihlKSkge1xuICAgICAgZSA9IGdldE9yaWdpbmFsRXJyb3IoZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGUgfHwgbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIGBJbmplY3Rpb25Ub2tlbmAgdXNlZCB0byBjb25maWd1cmUgaG93IHRvIGNhbGwgdGhlIGBFcnJvckhhbmRsZXJgLlxuICpcbiAqIGBOZ1pvbmVgIGlzIHByb3ZpZGVkIGJ5IGRlZmF1bHQgdG9kYXkgc28gdGhlIGRlZmF1bHQgKGFuZCBvbmx5KSBpbXBsZW1lbnRhdGlvbiBmb3IgdGhpc1xuICogaXMgY2FsbGluZyBgRXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yYCBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gKi9cbmV4cG9ydCBjb25zdCBJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSID0gbmV3IEluamVjdGlvblRva2VuPChlOiBhbnkpID0+IHZvaWQ+KFxuICB0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUgPyAnaW50ZXJuYWwgZXJyb3IgaGFuZGxlcicgOiAnJyxcbiAge1xuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiB7XG4gICAgICBjb25zdCB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gICAgICBjb25zdCB1c2VyRXJyb3JIYW5kbGVyID0gaW5qZWN0KEVycm9ySGFuZGxlcik7XG4gICAgICByZXR1cm4gKGU6IHVua25vd24pID0+IHpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdXNlckVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgfSxcbiAgfSxcbik7XG4iXX0=