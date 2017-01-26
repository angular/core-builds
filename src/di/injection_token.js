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
export class OpaqueToken {
    /**
     * @param {?} _desc
     */
    constructor(_desc) {
        this._desc = _desc;
    }
    /**
     * @return {?}
     */
    toString() { return `Token ${this._desc}`; }
}
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
export class InjectionToken extends OpaqueToken {
    /**
     * @param {?} desc
     */
    constructor(desc) {
        super(desc);
    }
    /**
     * @return {?}
     */
    toString() { return `InjectionToken ${this._desc}`; }
}
function InjectionToken_tsickle_Closure_declarations() {
    /** @type {?} */
    InjectionToken.prototype._differentiate_from_OpaqueToken_structurally;
}
//# sourceMappingURL=injection_token.js.map