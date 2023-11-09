/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getOriginalError } from './util/errors';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2Vycm9yX2hhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRS9DOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F3Qkc7QUFDSCxNQUFNLE9BQU8sWUFBWTtJQUF6QjtRQUNFOztXQUVHO1FBQ0gsYUFBUSxHQUFZLE9BQU8sQ0FBQztJQW9COUIsQ0FBQztJQWxCQyxXQUFXLENBQUMsS0FBVTtRQUNwQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFckQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLElBQUksYUFBYSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDdkQsQ0FBQztJQUNILENBQUM7SUFFRCxnQkFBZ0I7SUFDaEIsa0JBQWtCLENBQUMsS0FBVTtRQUMzQixJQUFJLENBQUMsR0FBRyxLQUFLLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMsT0FBTyxDQUFDLElBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQztJQUNuQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRPcmlnaW5hbEVycm9yfSBmcm9tICcuL3V0aWwvZXJyb3JzJztcblxuLyoqXG4gKiBQcm92aWRlcyBhIGhvb2sgZm9yIGNlbnRyYWxpemVkIGV4Y2VwdGlvbiBoYW5kbGluZy5cbiAqXG4gKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiBgRXJyb3JIYW5kbGVyYCBwcmludHMgZXJyb3IgbWVzc2FnZXMgdG8gdGhlIGBjb25zb2xlYC4gVG9cbiAqIGludGVyY2VwdCBlcnJvciBoYW5kbGluZywgd3JpdGUgYSBjdXN0b20gZXhjZXB0aW9uIGhhbmRsZXIgdGhhdCByZXBsYWNlcyB0aGlzIGRlZmF1bHQgYXNcbiAqIGFwcHJvcHJpYXRlIGZvciB5b3VyIGFwcC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBcbiAqIGNsYXNzIE15RXJyb3JIYW5kbGVyIGltcGxlbWVudHMgRXJyb3JIYW5kbGVyIHtcbiAqICAgaGFuZGxlRXJyb3IoZXJyb3IpIHtcbiAqICAgICAvLyBkbyBzb21ldGhpbmcgd2l0aCB0aGUgZXhjZXB0aW9uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBATmdNb2R1bGUoe1xuICogICBwcm92aWRlcnM6IFt7cHJvdmlkZTogRXJyb3JIYW5kbGVyLCB1c2VDbGFzczogTXlFcnJvckhhbmRsZXJ9XVxuICogfSlcbiAqIGNsYXNzIE15TW9kdWxlIHt9XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJvckhhbmRsZXIge1xuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29uc29sZTogQ29uc29sZSA9IGNvbnNvbGU7XG5cbiAgaGFuZGxlRXJyb3IoZXJyb3I6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG9yaWdpbmFsRXJyb3IgPSB0aGlzLl9maW5kT3JpZ2luYWxFcnJvcihlcnJvcik7XG5cbiAgICB0aGlzLl9jb25zb2xlLmVycm9yKCdFUlJPUicsIGVycm9yKTtcbiAgICBpZiAob3JpZ2luYWxFcnJvcikge1xuICAgICAgdGhpcy5fY29uc29sZS5lcnJvcignT1JJR0lOQUwgRVJST1InLCBvcmlnaW5hbEVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9maW5kT3JpZ2luYWxFcnJvcihlcnJvcjogYW55KTogRXJyb3J8bnVsbCB7XG4gICAgbGV0IGUgPSBlcnJvciAmJiBnZXRPcmlnaW5hbEVycm9yKGVycm9yKTtcbiAgICB3aGlsZSAoZSAmJiBnZXRPcmlnaW5hbEVycm9yKGUpKSB7XG4gICAgICBlID0gZ2V0T3JpZ2luYWxFcnJvcihlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZSB8fCBudWxsO1xuICB9XG59XG4iXX0=