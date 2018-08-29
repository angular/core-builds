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
 */
var ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
        /**
         * @internal
         */
        this._console = console;
    }
    ErrorHandler.prototype.handleError = function (error) {
        var originalError = this._findOriginalError(error);
        var context = this._findContext(error);
        // Note: Browser consoles show the place from where console.error was called.
        // We can use this to give users additional information about the error.
        var errorLogger = getErrorLogger(error);
        errorLogger(this._console, "ERROR", error);
        if (originalError) {
            errorLogger(this._console, "ORIGINAL ERROR", originalError);
        }
        if (context) {
            errorLogger(this._console, 'ERROR CONTEXT', context);
        }
    };
    /** @internal */
    ErrorHandler.prototype._findContext = function (error) {
        if (error) {
            return getDebugContext(error) ? getDebugContext(error) :
                this._findContext(getOriginalError(error));
        }
        return null;
    };
    /** @internal */
    ErrorHandler.prototype._findOriginalError = function (error) {
        var e = getOriginalError(error);
        while (e && getOriginalError(e)) {
            e = getOriginalError(e);
        }
        return e;
    };
    return ErrorHandler;
}());
export { ErrorHandler };
export function wrappedError(message, originalError) {
    var msg = message + " caused by: " + (originalError instanceof Error ? originalError.message : originalError);
    var error = Error(msg);
    error[ERROR_ORIGINAL_ERROR] = originalError;
    return error;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2Vycm9yX2hhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFJakc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFDSDtJQUFBO1FBQ0U7O1dBRUc7UUFDSCxhQUFRLEdBQVksT0FBTyxDQUFDO0lBcUM5QixDQUFDO0lBbkNDLGtDQUFXLEdBQVgsVUFBWSxLQUFVO1FBQ3BCLElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRCxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLDZFQUE2RTtRQUM3RSx3RUFBd0U7UUFDeEUsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLGFBQWEsRUFBRTtZQUNqQixXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztTQUM3RDtRQUNELElBQUksT0FBTyxFQUFFO1lBQ1gsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3REO0lBQ0gsQ0FBQztJQUVELGdCQUFnQjtJQUNoQixtQ0FBWSxHQUFaLFVBQWEsS0FBVTtRQUNyQixJQUFJLEtBQUssRUFBRTtZQUNULE9BQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVFO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLHlDQUFrQixHQUFsQixVQUFtQixLQUFZO1FBQzdCLElBQUksQ0FBQyxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxJQUFJLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQy9CLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN6QjtRQUVELE9BQU8sQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQXpDRCxJQXlDQzs7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUFDLE9BQWUsRUFBRSxhQUFrQjtJQUM5RCxJQUFNLEdBQUcsR0FDRixPQUFPLHFCQUFlLGFBQWEsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUEsQ0FBQyxDQUFDLGFBQWEsQ0FBRyxDQUFDO0lBQ3RHLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN4QixLQUFhLENBQUMsb0JBQW9CLENBQUMsR0FBRyxhQUFhLENBQUM7SUFDckQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0VSUk9SX09SSUdJTkFMX0VSUk9SLCBnZXREZWJ1Z0NvbnRleHQsIGdldEVycm9yTG9nZ2VyLCBnZXRPcmlnaW5hbEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5cblxuXG4vKipcbiAqIFByb3ZpZGVzIGEgaG9vayBmb3IgY2VudHJhbGl6ZWQgZXhjZXB0aW9uIGhhbmRsaW5nLlxuICpcbiAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIGBFcnJvckhhbmRsZXJgIHByaW50cyBlcnJvciBtZXNzYWdlcyB0byB0aGUgYGNvbnNvbGVgLiBUb1xuICogaW50ZXJjZXB0IGVycm9yIGhhbmRsaW5nLCB3cml0ZSBhIGN1c3RvbSBleGNlcHRpb24gaGFuZGxlciB0aGF0IHJlcGxhY2VzIHRoaXMgZGVmYXVsdCBhc1xuICogYXBwcm9wcmlhdGUgZm9yIHlvdXIgYXBwLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYFxuICogY2xhc3MgTXlFcnJvckhhbmRsZXIgaW1wbGVtZW50cyBFcnJvckhhbmRsZXIge1xuICogICBoYW5kbGVFcnJvcihlcnJvcikge1xuICogICAgIC8vIGRvIHNvbWV0aGluZyB3aXRoIHRoZSBleGNlcHRpb25cbiAqICAgfVxuICogfVxuICpcbiAqIEBOZ01vZHVsZSh7XG4gKiAgIHByb3ZpZGVyczogW3twcm92aWRlOiBFcnJvckhhbmRsZXIsIHVzZUNsYXNzOiBNeUVycm9ySGFuZGxlcn1dXG4gKiB9KVxuICogY2xhc3MgTXlNb2R1bGUge31cbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgRXJyb3JIYW5kbGVyIHtcbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NvbnNvbGU6IENvbnNvbGUgPSBjb25zb2xlO1xuXG4gIGhhbmRsZUVycm9yKGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvcmlnaW5hbEVycm9yID0gdGhpcy5fZmluZE9yaWdpbmFsRXJyb3IoZXJyb3IpO1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLl9maW5kQ29udGV4dChlcnJvcik7XG4gICAgLy8gTm90ZTogQnJvd3NlciBjb25zb2xlcyBzaG93IHRoZSBwbGFjZSBmcm9tIHdoZXJlIGNvbnNvbGUuZXJyb3Igd2FzIGNhbGxlZC5cbiAgICAvLyBXZSBjYW4gdXNlIHRoaXMgdG8gZ2l2ZSB1c2VycyBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHRoZSBlcnJvci5cbiAgICBjb25zdCBlcnJvckxvZ2dlciA9IGdldEVycm9yTG9nZ2VyKGVycm9yKTtcblxuICAgIGVycm9yTG9nZ2VyKHRoaXMuX2NvbnNvbGUsIGBFUlJPUmAsIGVycm9yKTtcbiAgICBpZiAob3JpZ2luYWxFcnJvcikge1xuICAgICAgZXJyb3JMb2dnZXIodGhpcy5fY29uc29sZSwgYE9SSUdJTkFMIEVSUk9SYCwgb3JpZ2luYWxFcnJvcik7XG4gICAgfVxuICAgIGlmIChjb250ZXh0KSB7XG4gICAgICBlcnJvckxvZ2dlcih0aGlzLl9jb25zb2xlLCAnRVJST1IgQ09OVEVYVCcsIGNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2ZpbmRDb250ZXh0KGVycm9yOiBhbnkpOiBhbnkge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgcmV0dXJuIGdldERlYnVnQ29udGV4dChlcnJvcikgPyBnZXREZWJ1Z0NvbnRleHQoZXJyb3IpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmluZENvbnRleHQoZ2V0T3JpZ2luYWxFcnJvcihlcnJvcikpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfZmluZE9yaWdpbmFsRXJyb3IoZXJyb3I6IEVycm9yKTogYW55IHtcbiAgICBsZXQgZSA9IGdldE9yaWdpbmFsRXJyb3IoZXJyb3IpO1xuICAgIHdoaWxlIChlICYmIGdldE9yaWdpbmFsRXJyb3IoZSkpIHtcbiAgICAgIGUgPSBnZXRPcmlnaW5hbEVycm9yKGUpO1xuICAgIH1cblxuICAgIHJldHVybiBlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwcGVkRXJyb3IobWVzc2FnZTogc3RyaW5nLCBvcmlnaW5hbEVycm9yOiBhbnkpOiBFcnJvciB7XG4gIGNvbnN0IG1zZyA9XG4gICAgICBgJHttZXNzYWdlfSBjYXVzZWQgYnk6ICR7b3JpZ2luYWxFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gb3JpZ2luYWxFcnJvci5tZXNzYWdlOiBvcmlnaW5hbEVycm9yIH1gO1xuICBjb25zdCBlcnJvciA9IEVycm9yKG1zZyk7XG4gIChlcnJvciBhcyBhbnkpW0VSUk9SX09SSUdJTkFMX0VSUk9SXSA9IG9yaWdpbmFsRXJyb3I7XG4gIHJldHVybiBlcnJvcjtcbn1cbiJdfQ==