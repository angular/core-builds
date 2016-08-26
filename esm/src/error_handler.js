/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Provides a hook for centralized exception handling.
 *
 * The default implementation of `ErrorHandler` prints error messages to the `Console`. To
 * intercept error handling,
 * write a custom exception handler that replaces this default as appropriate for your app.
 *
 * ### Example
 *
 * ```javascript
 *
 * class MyExceptionHandler implements ErrorHandler {
 *   call(error, stackTrace = null, reason = null) {
 *     // do something with the exception
 *   }
 * }
 *
 * @NgModule({
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 * class MyModule {}
 * ```
 * @stable
 */
export class ErrorHandler {
    constructor(rethrowError = true) {
        /**
         * @internal
         */
        this._console = console;
        this.rethrowError = rethrowError;
    }
    handleError(error) {
        var originalError = this._findOriginalError(error);
        var originalStack = this._findOriginalStack(error);
        var context = this._findContext(error);
        this._console.error(`EXCEPTION: ${this._extractMessage(error)}`);
        if (originalError) {
            this._console.error(`ORIGINAL EXCEPTION: ${this._extractMessage(originalError)}`);
        }
        if (originalStack) {
            this._console.error('ORIGINAL STACKTRACE:');
            this._console.error(originalStack);
        }
        if (context) {
            this._console.error('ERROR CONTEXT:');
            this._console.error(context);
        }
        // We rethrow exceptions, so operations like 'bootstrap' will result in an error
        // when an error happens. If we do not rethrow, bootstrap will always succeed.
        if (this.rethrowError)
            throw error;
    }
    /** @internal */
    _extractMessage(error) {
        return error instanceof Error ? error.message : error.toString();
    }
    /** @internal */
    _findContext(error) {
        if (error) {
            return error.context ? error.context :
                this._findContext(error.originalError);
        }
        else {
            return null;
        }
    }
    /** @internal */
    _findOriginalError(error) {
        var e = error.originalError;
        while (e && e.originalError) {
            e = e.originalError;
        }
        return e;
    }
    /** @internal */
    _findOriginalStack(error) {
        if (!(error instanceof Error))
            return null;
        var e = error;
        var stack = e.stack;
        while (e instanceof Error && e.originalError) {
            e = e.originalError;
            if (e instanceof Error && e.stack) {
                stack = e.stack;
            }
        }
        return stack;
    }
}
//# sourceMappingURL=error_handler.js.map