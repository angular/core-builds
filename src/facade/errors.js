/**
 * Convenience to throw an Error with 'unimplemented' as the message.
 * @return {?}
 */
export function unimplemented() {
    throw new Error('unimplemented');
}
/**
 * \@stable
 */
export class BaseError extends Error {
    /**
     * @param {?} message
     */
    constructor(message) {
        super(message);
        // Errors don't use current this, instead they create a new instance.
        // We have to do forward all of our api to the nativeInstance.
        // TODO(bradfordcsmith): Remove this hack when
        //     google/closure-compiler/issues/2102 is fixed.
        const nativeError = new Error(message);
        this._nativeError = nativeError;
    }
    /**
     * @return {?}
     */
    get message() { return this._nativeError.message; }
    /**
     * @param {?} message
     * @return {?}
     */
    set message(message) { this._nativeError.message = message; }
    /**
     * @return {?}
     */
    get name() { return this._nativeError.name; }
    /**
     * @return {?}
     */
    get stack() { return ((this._nativeError)).stack; }
    /**
     * @param {?} value
     * @return {?}
     */
    set stack(value) { ((this._nativeError)).stack = value; }
    /**
     * @return {?}
     */
    toString() { return this._nativeError.toString(); }
}
function BaseError_tsickle_Closure_declarations() {
    /**
     * \@internal *
     * @type {?}
     */
    BaseError.prototype._nativeError;
}
/**
 * \@stable
 */
export class WrappedError extends BaseError {
    /**
     * @param {?} message
     * @param {?} error
     */
    constructor(message, error) {
        super(`${message} caused by: ${error instanceof Error ? error.message : error}`);
        this.originalError = error;
    }
    /**
     * @return {?}
     */
    get stack() {
        return (((this.originalError instanceof Error ? this.originalError : this._nativeError)))
            .stack;
    }
}
function WrappedError_tsickle_Closure_declarations() {
    /** @type {?} */
    WrappedError.prototype.originalError;
}
//# sourceMappingURL=errors.js.map