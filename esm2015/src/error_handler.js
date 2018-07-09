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
import { ERROR_ORIGINAL_ERROR, getDebugContext, getErrorLogger, getOriginalError } from './errors';
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
        const /** @type {?} */ originalError = this._findOriginalError(error);
        const /** @type {?} */ context = this._findContext(error);
        // Note: Browser consoles show the place from where console.error was called.
        // We can use this to give users additional information about the error.
        const /** @type {?} */ errorLogger = getErrorLogger(error);
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
        let /** @type {?} */ e = getOriginalError(error);
        while (e && getOriginalError(e)) {
            e = getOriginalError(e);
        }
        return e;
    }
}
function ErrorHandler_tsickle_Closure_declarations() {
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
    const /** @type {?} */ msg = `${message} caused by: ${originalError instanceof Error ? originalError.message : originalError}`;
    const /** @type {?} */ error = Error(msg);
    (/** @type {?} */ (error))[ERROR_ORIGINAL_ERROR] = originalError;
    return error;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2Vycm9yX2hhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsZUFBZSxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJqRyxNQUFNOzs7Ozt3QkFJZ0IsT0FBTzs7Ozs7O0lBRTNCLFdBQVcsQ0FBQyxLQUFVO1FBQ3BCLHVCQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckQsdUJBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7OztRQUd6Qyx1QkFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLGFBQWEsRUFBRTtZQUNqQixXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztTQUM3RDtRQUNELElBQUksT0FBTyxFQUFFO1lBQ1gsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3REO0tBQ0Y7Ozs7OztJQUdELFlBQVksQ0FBQyxLQUFVO1FBQ3JCLElBQUksS0FBSyxFQUFFO1lBQ1QsT0FBTyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDNUU7UUFFRCxPQUFPLElBQUksQ0FBQztLQUNiOzs7Ozs7SUFHRCxrQkFBa0IsQ0FBQyxLQUFZO1FBQzdCLHFCQUFJLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxPQUFPLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUMvQixDQUFDLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDekI7UUFFRCxPQUFPLENBQUMsQ0FBQztLQUNWO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7QUFFRCxNQUFNLHVCQUF1QixPQUFlLEVBQUUsYUFBa0I7SUFDOUQsdUJBQU0sR0FBRyxHQUNMLEdBQUcsT0FBTyxlQUFlLGFBQWEsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUEsQ0FBQyxDQUFDLGFBQWMsRUFBRSxDQUFDO0lBQ3RHLHVCQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekIsbUJBQUMsS0FBWSxFQUFDLENBQUMsb0JBQW9CLENBQUMsR0FBRyxhQUFhLENBQUM7SUFDckQsT0FBTyxLQUFLLENBQUM7Q0FDZCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFUlJPUl9PUklHSU5BTF9FUlJPUiwgZ2V0RGVidWdDb250ZXh0LCBnZXRFcnJvckxvZ2dlciwgZ2V0T3JpZ2luYWxFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuXG5cblxuLyoqXG4gKiBQcm92aWRlcyBhIGhvb2sgZm9yIGNlbnRyYWxpemVkIGV4Y2VwdGlvbiBoYW5kbGluZy5cbiAqXG4gKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiBgRXJyb3JIYW5kbGVyYCBwcmludHMgZXJyb3IgbWVzc2FnZXMgdG8gdGhlIGBjb25zb2xlYC4gVG9cbiAqIGludGVyY2VwdCBlcnJvciBoYW5kbGluZywgd3JpdGUgYSBjdXN0b20gZXhjZXB0aW9uIGhhbmRsZXIgdGhhdCByZXBsYWNlcyB0aGlzIGRlZmF1bHQgYXNcbiAqIGFwcHJvcHJpYXRlIGZvciB5b3VyIGFwcC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBcbiAqIGNsYXNzIE15RXJyb3JIYW5kbGVyIGltcGxlbWVudHMgRXJyb3JIYW5kbGVyIHtcbiAqICAgaGFuZGxlRXJyb3IoZXJyb3IpIHtcbiAqICAgICAvLyBkbyBzb21ldGhpbmcgd2l0aCB0aGUgZXhjZXB0aW9uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBATmdNb2R1bGUoe1xuICogICBwcm92aWRlcnM6IFt7cHJvdmlkZTogRXJyb3JIYW5kbGVyLCB1c2VDbGFzczogTXlFcnJvckhhbmRsZXJ9XVxuICogfSlcbiAqIGNsYXNzIE15TW9kdWxlIHt9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEVycm9ySGFuZGxlciB7XG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb25zb2xlOiBDb25zb2xlID0gY29uc29sZTtcblxuICBoYW5kbGVFcnJvcihlcnJvcjogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgb3JpZ2luYWxFcnJvciA9IHRoaXMuX2ZpbmRPcmlnaW5hbEVycm9yKGVycm9yKTtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5fZmluZENvbnRleHQoZXJyb3IpO1xuICAgIC8vIE5vdGU6IEJyb3dzZXIgY29uc29sZXMgc2hvdyB0aGUgcGxhY2UgZnJvbSB3aGVyZSBjb25zb2xlLmVycm9yIHdhcyBjYWxsZWQuXG4gICAgLy8gV2UgY2FuIHVzZSB0aGlzIHRvIGdpdmUgdXNlcnMgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZXJyb3IuXG4gICAgY29uc3QgZXJyb3JMb2dnZXIgPSBnZXRFcnJvckxvZ2dlcihlcnJvcik7XG5cbiAgICBlcnJvckxvZ2dlcih0aGlzLl9jb25zb2xlLCBgRVJST1JgLCBlcnJvcik7XG4gICAgaWYgKG9yaWdpbmFsRXJyb3IpIHtcbiAgICAgIGVycm9yTG9nZ2VyKHRoaXMuX2NvbnNvbGUsIGBPUklHSU5BTCBFUlJPUmAsIG9yaWdpbmFsRXJyb3IpO1xuICAgIH1cbiAgICBpZiAoY29udGV4dCkge1xuICAgICAgZXJyb3JMb2dnZXIodGhpcy5fY29uc29sZSwgJ0VSUk9SIENPTlRFWFQnLCBjb250ZXh0KTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9maW5kQ29udGV4dChlcnJvcjogYW55KTogYW55IHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJldHVybiBnZXREZWJ1Z0NvbnRleHQoZXJyb3IpID8gZ2V0RGVidWdDb250ZXh0KGVycm9yKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZpbmRDb250ZXh0KGdldE9yaWdpbmFsRXJyb3IoZXJyb3IpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2ZpbmRPcmlnaW5hbEVycm9yKGVycm9yOiBFcnJvcik6IGFueSB7XG4gICAgbGV0IGUgPSBnZXRPcmlnaW5hbEVycm9yKGVycm9yKTtcbiAgICB3aGlsZSAoZSAmJiBnZXRPcmlnaW5hbEVycm9yKGUpKSB7XG4gICAgICBlID0gZ2V0T3JpZ2luYWxFcnJvcihlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcHBlZEVycm9yKG1lc3NhZ2U6IHN0cmluZywgb3JpZ2luYWxFcnJvcjogYW55KTogRXJyb3Ige1xuICBjb25zdCBtc2cgPVxuICAgICAgYCR7bWVzc2FnZX0gY2F1c2VkIGJ5OiAke29yaWdpbmFsRXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IG9yaWdpbmFsRXJyb3IubWVzc2FnZTogb3JpZ2luYWxFcnJvciB9YDtcbiAgY29uc3QgZXJyb3IgPSBFcnJvcihtc2cpO1xuICAoZXJyb3IgYXMgYW55KVtFUlJPUl9PUklHSU5BTF9FUlJPUl0gPSBvcmlnaW5hbEVycm9yO1xuICByZXR1cm4gZXJyb3I7XG59XG4iXX0=