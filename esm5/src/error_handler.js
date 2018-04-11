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
 *
 * \@description
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
 * \@NgModule({
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 * class MyModule {}
 * ```
 *
 *
 */
var /**
 *
 * \@description
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
 * \@NgModule({
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 * class MyModule {}
 * ```
 *
 *
 */
ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
        /**
         * \@internal
         */
        this._console = console;
    }
    /**
     * @param {?} error
     * @return {?}
     */
    ErrorHandler.prototype.handleError = /**
     * @param {?} error
     * @return {?}
     */
    function (error) {
        var /** @type {?} */ originalError = this._findOriginalError(error);
        var /** @type {?} */ context = this._findContext(error);
        // Note: Browser consoles show the place from where console.error was called.
        // We can use this to give users additional information about the error.
        var /** @type {?} */ errorLogger = getErrorLogger(error);
        errorLogger(this._console, "ERROR", error);
        if (originalError) {
            errorLogger(this._console, "ORIGINAL ERROR", originalError);
        }
        if (context) {
            errorLogger(this._console, 'ERROR CONTEXT', context);
        }
    };
    /** @internal */
    /**
     * \@internal
     * @param {?} error
     * @return {?}
     */
    ErrorHandler.prototype._findContext = /**
     * \@internal
     * @param {?} error
     * @return {?}
     */
    function (error) {
        if (error) {
            return getDebugContext(error) ? getDebugContext(error) :
                this._findContext(getOriginalError(error));
        }
        return null;
    };
    /** @internal */
    /**
     * \@internal
     * @param {?} error
     * @return {?}
     */
    ErrorHandler.prototype._findOriginalError = /**
     * \@internal
     * @param {?} error
     * @return {?}
     */
    function (error) {
        var /** @type {?} */ e = getOriginalError(error);
        while (e && getOriginalError(e)) {
            e = getOriginalError(e);
        }
        return e;
    };
    return ErrorHandler;
}());
/**
 *
 * \@description
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
 * \@NgModule({
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 * class MyModule {}
 * ```
 *
 *
 */
export { ErrorHandler };
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
    var /** @type {?} */ msg = message + " caused by: " + (originalError instanceof Error ? originalError.message : originalError);
    var /** @type {?} */ error = Error(msg);
    (/** @type {?} */ (error))[ERROR_ORIGINAL_ERROR] = originalError;
    return error;
}
//# sourceMappingURL=error_handler.js.map