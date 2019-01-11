/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getDebugContext, getErrorLogger, getOriginalError } from './errors';
import { ERROR_ORIGINAL_ERROR } from './util/errors';
/**
 * Provides a hook for centralized exception handling.
 *
 * The default implementation of `ErrorHandler` prints error messages to the `console`. To
 * intercept error handling, write a custom exception handler that replaces this default as
 * appropriate for your app.
 *
 * \@usageNotes
 * ### Example
 *
 * ```
 * class MyErrorHandler implements ErrorHandler {
 *   handleError(error) {
 *     // do something with the exception
 *   }
 * }
 *
 * \@NgModule({
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 * class MyModule {}
 * ```
 *
 * \@publicApi
 */
export class ErrorHandler {
    constructor() {
        /**
         * \@internal
         */
        this._console = console;
    }
    /**
     * @param {?} error
     * @return {?}
     */
    handleError(error) {
        /** @type {?} */
        const originalError = this._findOriginalError(error);
        /** @type {?} */
        const context = this._findContext(error);
        // Note: Browser consoles show the place from where console.error was called.
        // We can use this to give users additional information about the error.
        /** @type {?} */
        const errorLogger = getErrorLogger(error);
        errorLogger(this._console, `ERROR`, error);
        if (originalError) {
            errorLogger(this._console, `ORIGINAL ERROR`, originalError);
        }
        if (context) {
            errorLogger(this._console, 'ERROR CONTEXT', context);
        }
    }
    /**
     * \@internal
     * @param {?} error
     * @return {?}
     */
    _findContext(error) {
        if (error) {
            return getDebugContext(error) ? getDebugContext(error) :
                this._findContext(getOriginalError(error));
        }
        return null;
    }
    /**
     * \@internal
     * @param {?} error
     * @return {?}
     */
    _findOriginalError(error) {
        /** @type {?} */
        let e = getOriginalError(error);
        while (e && getOriginalError(e)) {
            e = getOriginalError(e);
        }
        return e;
    }
}
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    ErrorHandler.prototype._console;
}
/**
 * @param {?} message
 * @param {?} originalError
 * @return {?}
 */
export function wrappedError(message, originalError) {
    /** @type {?} */
    const msg = `${message} caused by: ${originalError instanceof Error ? originalError.message : originalError}`;
    /** @type {?} */
    const error = Error(msg);
    ((/** @type {?} */ (error)))[ERROR_ORIGINAL_ERROR] = originalError;
    return error;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2Vycm9yX2hhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMzRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJuRCxNQUFNLE9BQU8sWUFBWTtJQUF6Qjs7OztRQUlFLGFBQVEsR0FBWSxPQUFPLENBQUM7SUFxQzlCLENBQUM7Ozs7O0lBbkNDLFdBQVcsQ0FBQyxLQUFVOztjQUNkLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDOztjQUM5QyxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7Ozs7Y0FHbEMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUM7UUFFekMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNDLElBQUksYUFBYSxFQUFFO1lBQ2pCLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQzdEO1FBQ0QsSUFBSSxPQUFPLEVBQUU7WUFDWCxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDdEQ7SUFDSCxDQUFDOzs7Ozs7SUFHRCxZQUFZLENBQUMsS0FBVTtRQUNyQixJQUFJLEtBQUssRUFBRTtZQUNULE9BQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVFO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDOzs7Ozs7SUFHRCxrQkFBa0IsQ0FBQyxLQUFZOztZQUN6QixDQUFDLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1FBQy9CLE9BQU8sQ0FBQyxJQUFJLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQy9CLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN6QjtRQUVELE9BQU8sQ0FBQyxDQUFDO0lBQ1gsQ0FBQztDQUNGOzs7Ozs7SUFyQ0MsZ0NBQTRCOzs7Ozs7O0FBdUM5QixNQUFNLFVBQVUsWUFBWSxDQUFDLE9BQWUsRUFBRSxhQUFrQjs7VUFDeEQsR0FBRyxHQUNMLEdBQUcsT0FBTyxlQUFlLGFBQWEsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUEsQ0FBQyxDQUFDLGFBQWMsRUFBRTs7VUFDL0YsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7SUFDeEIsQ0FBQyxtQkFBQSxLQUFLLEVBQU8sQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsYUFBYSxDQUFDO0lBQ3JELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXREZWJ1Z0NvbnRleHQsIGdldEVycm9yTG9nZ2VyLCBnZXRPcmlnaW5hbEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge0VSUk9SX09SSUdJTkFMX0VSUk9SfSBmcm9tICcuL3V0aWwvZXJyb3JzJztcblxuXG5cbi8qKlxuICogUHJvdmlkZXMgYSBob29rIGZvciBjZW50cmFsaXplZCBleGNlcHRpb24gaGFuZGxpbmcuXG4gKlxuICogVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgYEVycm9ySGFuZGxlcmAgcHJpbnRzIGVycm9yIG1lc3NhZ2VzIHRvIHRoZSBgY29uc29sZWAuIFRvXG4gKiBpbnRlcmNlcHQgZXJyb3IgaGFuZGxpbmcsIHdyaXRlIGEgY3VzdG9tIGV4Y2VwdGlvbiBoYW5kbGVyIHRoYXQgcmVwbGFjZXMgdGhpcyBkZWZhdWx0IGFzXG4gKiBhcHByb3ByaWF0ZSBmb3IgeW91ciBhcHAuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBjbGFzcyBNeUVycm9ySGFuZGxlciBpbXBsZW1lbnRzIEVycm9ySGFuZGxlciB7XG4gKiAgIGhhbmRsZUVycm9yKGVycm9yKSB7XG4gKiAgICAgLy8gZG8gc29tZXRoaW5nIHdpdGggdGhlIGV4Y2VwdGlvblxuICogICB9XG4gKiB9XG4gKlxuICogQE5nTW9kdWxlKHtcbiAqICAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IEVycm9ySGFuZGxlciwgdXNlQ2xhc3M6IE15RXJyb3JIYW5kbGVyfV1cbiAqIH0pXG4gKiBjbGFzcyBNeU1vZHVsZSB7fVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgRXJyb3JIYW5kbGVyIHtcbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NvbnNvbGU6IENvbnNvbGUgPSBjb25zb2xlO1xuXG4gIGhhbmRsZUVycm9yKGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvcmlnaW5hbEVycm9yID0gdGhpcy5fZmluZE9yaWdpbmFsRXJyb3IoZXJyb3IpO1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLl9maW5kQ29udGV4dChlcnJvcik7XG4gICAgLy8gTm90ZTogQnJvd3NlciBjb25zb2xlcyBzaG93IHRoZSBwbGFjZSBmcm9tIHdoZXJlIGNvbnNvbGUuZXJyb3Igd2FzIGNhbGxlZC5cbiAgICAvLyBXZSBjYW4gdXNlIHRoaXMgdG8gZ2l2ZSB1c2VycyBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHRoZSBlcnJvci5cbiAgICBjb25zdCBlcnJvckxvZ2dlciA9IGdldEVycm9yTG9nZ2VyKGVycm9yKTtcblxuICAgIGVycm9yTG9nZ2VyKHRoaXMuX2NvbnNvbGUsIGBFUlJPUmAsIGVycm9yKTtcbiAgICBpZiAob3JpZ2luYWxFcnJvcikge1xuICAgICAgZXJyb3JMb2dnZXIodGhpcy5fY29uc29sZSwgYE9SSUdJTkFMIEVSUk9SYCwgb3JpZ2luYWxFcnJvcik7XG4gICAgfVxuICAgIGlmIChjb250ZXh0KSB7XG4gICAgICBlcnJvckxvZ2dlcih0aGlzLl9jb25zb2xlLCAnRVJST1IgQ09OVEVYVCcsIGNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2ZpbmRDb250ZXh0KGVycm9yOiBhbnkpOiBhbnkge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgcmV0dXJuIGdldERlYnVnQ29udGV4dChlcnJvcikgPyBnZXREZWJ1Z0NvbnRleHQoZXJyb3IpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmluZENvbnRleHQoZ2V0T3JpZ2luYWxFcnJvcihlcnJvcikpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfZmluZE9yaWdpbmFsRXJyb3IoZXJyb3I6IEVycm9yKTogYW55IHtcbiAgICBsZXQgZSA9IGdldE9yaWdpbmFsRXJyb3IoZXJyb3IpO1xuICAgIHdoaWxlIChlICYmIGdldE9yaWdpbmFsRXJyb3IoZSkpIHtcbiAgICAgIGUgPSBnZXRPcmlnaW5hbEVycm9yKGUpO1xuICAgIH1cblxuICAgIHJldHVybiBlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwcGVkRXJyb3IobWVzc2FnZTogc3RyaW5nLCBvcmlnaW5hbEVycm9yOiBhbnkpOiBFcnJvciB7XG4gIGNvbnN0IG1zZyA9XG4gICAgICBgJHttZXNzYWdlfSBjYXVzZWQgYnk6ICR7b3JpZ2luYWxFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gb3JpZ2luYWxFcnJvci5tZXNzYWdlOiBvcmlnaW5hbEVycm9yIH1gO1xuICBjb25zdCBlcnJvciA9IEVycm9yKG1zZyk7XG4gIChlcnJvciBhcyBhbnkpW0VSUk9SX09SSUdJTkFMX0VSUk9SXSA9IG9yaWdpbmFsRXJyb3I7XG4gIHJldHVybiBlcnJvcjtcbn1cbiJdfQ==