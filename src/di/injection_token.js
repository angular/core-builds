var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Creates a token that can be used in a DI Provider.
 *
 * ### Example ([live demo](http://plnkr.co/edit/Ys9ezXpj2Mnoy3Uc8KBp?p=preview))
 *
 * ```typescript
 * var t = new OpaqueToken("value");
 *
 * var injector = Injector.resolveAndCreate([
 *   {provide: t, useValue: "bindingValue"}
 * ]);
 *
 * expect(injector.get(t)).toEqual("bindingValue");
 * ```
 *
 * Using an `OpaqueToken` is preferable to using strings as tokens because of possible collisions
 * caused by multiple providers using the same string as two different tokens.
 *
 * Using an `OpaqueToken` is preferable to using an `Object` as tokens because it provides better
 * error messages.
 * @deprecated since v4.0.0 because it does not support type information, use `InjectionToken<?>`
 * instead.
 */
var OpaqueToken = (function () {
    /**
     * @param {?} _desc
     */
    function OpaqueToken(_desc) {
        this._desc = _desc;
    }
    /**
     * @return {?}
     */
    OpaqueToken.prototype.toString = function () { return "Token " + this._desc; };
    return OpaqueToken;
}());
export { OpaqueToken };
function OpaqueToken_tsickle_Closure_declarations() {
    /** @type {?} */
    OpaqueToken.prototype._desc;
}
/**
 * Creates a token that can be used in a DI Provider.
 *
 * Use an `InjectionToken` whenever the type you are injecting is not reified (does not have a
 * runtime representation) such as when injecting an interface, callable type, array or
 * parametrized type.
 *
 * `InjectionToken` is parametrize on `T` which is the type of object which will be returned by the
 * `Injector`. This provides additional level of type safety.
 *
 * ```
 * interface MyInterface {...}
 * var myInterface = injector.get(new InjectionToken<MyInterface>('SomeToken'));
 * // myInterface is inferred to be MyInterface.
 * ```
 *
 * ### Example
 *
 * {\@example core/di/ts/injector_spec.ts region='Injector'}
 *
 * \@stable
 */
var InjectionToken = (function (_super) {
    __extends(InjectionToken, _super);
    /**
     * @param {?} desc
     */
    function InjectionToken(desc) {
        return _super.call(this, desc) || this;
    }
    /**
     * @return {?}
     */
    InjectionToken.prototype.toString = function () { return "InjectionToken " + this._desc; };
    return InjectionToken;
}(OpaqueToken));
export { InjectionToken };
function InjectionToken_tsickle_Closure_declarations() {
    /** @type {?} */
    InjectionToken.prototype._differentiate_from_OpaqueToken_structurally;
}
//# sourceMappingURL=injection_token.js.map