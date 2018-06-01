/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ERROR_ORIGINAL_ERROR, getDebugContext, getErrorLogger, getOriginalError } from './errors';
/**
 *
 * @description
 * Provides a hook for centralized exception handling.
 *
 * The default implementation of `ErrorHandler` prints error messages to the `console`. To
 * intercept error handling, write a custom exception handler that replaces this default as
 * appropriate for your app.
 *
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
 *
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2Vycm9yX2hhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFJakc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5Qkc7QUFDSDtJQUFBO1FBQ0U7O1dBRUc7UUFDSCxhQUFRLEdBQVksT0FBTyxDQUFDO0lBcUM5QixDQUFDO0lBbkNDLGtDQUFXLEdBQVgsVUFBWSxLQUFVO1FBQ3BCLElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRCxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLDZFQUE2RTtRQUM3RSx3RUFBd0U7UUFDeEUsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLGFBQWEsRUFBRTtZQUNqQixXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztTQUM3RDtRQUNELElBQUksT0FBTyxFQUFFO1lBQ1gsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3REO0lBQ0gsQ0FBQztJQUVELGdCQUFnQjtJQUNoQixtQ0FBWSxHQUFaLFVBQWEsS0FBVTtRQUNyQixJQUFJLEtBQUssRUFBRTtZQUNULE9BQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzVFO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLHlDQUFrQixHQUFsQixVQUFtQixLQUFZO1FBQzdCLElBQUksQ0FBQyxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxJQUFJLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQy9CLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN6QjtRQUVELE9BQU8sQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQXpDRCxJQXlDQzs7QUFFRCxNQUFNLHVCQUF1QixPQUFlLEVBQUUsYUFBa0I7SUFDOUQsSUFBTSxHQUFHLEdBQ0YsT0FBTyxxQkFBZSxhQUFhLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFBLENBQUMsQ0FBQyxhQUFhLENBQUcsQ0FBQztJQUN0RyxJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEIsS0FBYSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsYUFBYSxDQUFDO0lBQ3JELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFUlJPUl9PUklHSU5BTF9FUlJPUiwgZ2V0RGVidWdDb250ZXh0LCBnZXRFcnJvckxvZ2dlciwgZ2V0T3JpZ2luYWxFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuXG5cblxuLyoqXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBQcm92aWRlcyBhIGhvb2sgZm9yIGNlbnRyYWxpemVkIGV4Y2VwdGlvbiBoYW5kbGluZy5cbiAqXG4gKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBvZiBgRXJyb3JIYW5kbGVyYCBwcmludHMgZXJyb3IgbWVzc2FnZXMgdG8gdGhlIGBjb25zb2xlYC4gVG9cbiAqIGludGVyY2VwdCBlcnJvciBoYW5kbGluZywgd3JpdGUgYSBjdXN0b20gZXhjZXB0aW9uIGhhbmRsZXIgdGhhdCByZXBsYWNlcyB0aGlzIGRlZmF1bHQgYXNcbiAqIGFwcHJvcHJpYXRlIGZvciB5b3VyIGFwcC5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYFxuICogY2xhc3MgTXlFcnJvckhhbmRsZXIgaW1wbGVtZW50cyBFcnJvckhhbmRsZXIge1xuICogICBoYW5kbGVFcnJvcihlcnJvcikge1xuICogICAgIC8vIGRvIHNvbWV0aGluZyB3aXRoIHRoZSBleGNlcHRpb25cbiAqICAgfVxuICogfVxuICpcbiAqIEBOZ01vZHVsZSh7XG4gKiAgIHByb3ZpZGVyczogW3twcm92aWRlOiBFcnJvckhhbmRsZXIsIHVzZUNsYXNzOiBNeUVycm9ySGFuZGxlcn1dXG4gKiB9KVxuICogY2xhc3MgTXlNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJvckhhbmRsZXIge1xuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29uc29sZTogQ29uc29sZSA9IGNvbnNvbGU7XG5cbiAgaGFuZGxlRXJyb3IoZXJyb3I6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG9yaWdpbmFsRXJyb3IgPSB0aGlzLl9maW5kT3JpZ2luYWxFcnJvcihlcnJvcik7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuX2ZpbmRDb250ZXh0KGVycm9yKTtcbiAgICAvLyBOb3RlOiBCcm93c2VyIGNvbnNvbGVzIHNob3cgdGhlIHBsYWNlIGZyb20gd2hlcmUgY29uc29sZS5lcnJvciB3YXMgY2FsbGVkLlxuICAgIC8vIFdlIGNhbiB1c2UgdGhpcyB0byBnaXZlIHVzZXJzIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGVycm9yLlxuICAgIGNvbnN0IGVycm9yTG9nZ2VyID0gZ2V0RXJyb3JMb2dnZXIoZXJyb3IpO1xuXG4gICAgZXJyb3JMb2dnZXIodGhpcy5fY29uc29sZSwgYEVSUk9SYCwgZXJyb3IpO1xuICAgIGlmIChvcmlnaW5hbEVycm9yKSB7XG4gICAgICBlcnJvckxvZ2dlcih0aGlzLl9jb25zb2xlLCBgT1JJR0lOQUwgRVJST1JgLCBvcmlnaW5hbEVycm9yKTtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgIGVycm9yTG9nZ2VyKHRoaXMuX2NvbnNvbGUsICdFUlJPUiBDT05URVhUJywgY29udGV4dCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfZmluZENvbnRleHQoZXJyb3I6IGFueSk6IGFueSB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICByZXR1cm4gZ2V0RGVidWdDb250ZXh0KGVycm9yKSA/IGdldERlYnVnQ29udGV4dChlcnJvcikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9maW5kQ29udGV4dChnZXRPcmlnaW5hbEVycm9yKGVycm9yKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9maW5kT3JpZ2luYWxFcnJvcihlcnJvcjogRXJyb3IpOiBhbnkge1xuICAgIGxldCBlID0gZ2V0T3JpZ2luYWxFcnJvcihlcnJvcik7XG4gICAgd2hpbGUgKGUgJiYgZ2V0T3JpZ2luYWxFcnJvcihlKSkge1xuICAgICAgZSA9IGdldE9yaWdpbmFsRXJyb3IoZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyYXBwZWRFcnJvcihtZXNzYWdlOiBzdHJpbmcsIG9yaWdpbmFsRXJyb3I6IGFueSk6IEVycm9yIHtcbiAgY29uc3QgbXNnID1cbiAgICAgIGAke21lc3NhZ2V9IGNhdXNlZCBieTogJHtvcmlnaW5hbEVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBvcmlnaW5hbEVycm9yLm1lc3NhZ2U6IG9yaWdpbmFsRXJyb3IgfWA7XG4gIGNvbnN0IGVycm9yID0gRXJyb3IobXNnKTtcbiAgKGVycm9yIGFzIGFueSlbRVJST1JfT1JJR0lOQUxfRVJST1JdID0gb3JpZ2luYWxFcnJvcjtcbiAgcmV0dXJuIGVycm9yO1xufVxuIl19