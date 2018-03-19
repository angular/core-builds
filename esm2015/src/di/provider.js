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
/**
 * \@whatItDoes Configures the {\@link Injector} to return a value for a token.
 * \@howToUse
 * ```
 * \@Injectable(SomeModule, {useValue: 'someValue'})
 * class SomeClass {}
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ValueSansProvider'}
 *
 * \@experimental
 * @record
 */
export function ValueSansProvider() { }
function ValueSansProvider_tsickle_Closure_declarations() {
    /**
     * The value to inject.
     * @type {?}
     */
    ValueSansProvider.prototype.useValue;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return a value for a token.
 * \@howToUse
 * ```
 * const provider: ValueProvider = {provide: 'someToken', useValue: 'someValue'};
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ValueProvider'}
 *
 * \@stable
 * @record
 */
export function ValueProvider() { }
function ValueProvider_tsickle_Closure_declarations() {
    /**
     * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
     * @type {?}
     */
    ValueProvider.prototype.provide;
    /**
     * If true, then injector returns an array of instances. This is useful to allow multiple
     * providers spread across many files to provide configuration information to a common token.
     *
     * ### Example
     *
     * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
     * @type {?|undefined}
     */
    ValueProvider.prototype.multi;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return an instance of `useClass` for a token.
 * \@howToUse
 * ```
 * \@Injectable(SomeModule, {useClass: MyService, deps: []})
 * class MyService {}
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='StaticClassSansProvider'}
 *
 * \@experimental
 * @record
 */
export function StaticClassSansProvider() { }
function StaticClassSansProvider_tsickle_Closure_declarations() {
    /**
     * An optional class to instantiate for the `token`. (If not provided `provide` is assumed to be a
     * class to instantiate)
     * @type {?}
     */
    StaticClassSansProvider.prototype.useClass;
    /**
     * A list of `token`s which need to be resolved by the injector. The list of values is then
     * used as arguments to the `useClass` constructor.
     * @type {?}
     */
    StaticClassSansProvider.prototype.deps;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return an instance of `useClass` for a token.
 * \@howToUse
 * ```
 * \@Injectable()
 * class MyService {}
 *
 * const provider: ClassProvider = {provide: 'someToken', useClass: MyService, deps: []};
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='StaticClassProvider'}
 *
 * Note that following two providers are not equal:
 * {\@example core/di/ts/provider_spec.ts region='StaticClassProviderDifference'}
 *
 * \@stable
 * @record
 */
export function StaticClassProvider() { }
function StaticClassProvider_tsickle_Closure_declarations() {
    /**
     * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
     * @type {?}
     */
    StaticClassProvider.prototype.provide;
    /**
     * If true, then injector returns an array of instances. This is useful to allow multiple
     * providers spread across many files to provide configuration information to a common token.
     *
     * ### Example
     *
     * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
     * @type {?|undefined}
     */
    StaticClassProvider.prototype.multi;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return an instance of a token.
 * \@howToUse
 * ```
 * \@Injectable(SomeModule, {deps: []})
 * class MyService {}
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ConstructorSansProvider'}
 *
 * \@experimental
 * @record
 */
export function ConstructorSansProvider() { }
function ConstructorSansProvider_tsickle_Closure_declarations() {
    /**
     * A list of `token`s which need to be resolved by the injector. The list of values is then
     * used as arguments to the `useClass` constructor.
     * @type {?|undefined}
     */
    ConstructorSansProvider.prototype.deps;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return an instance of a token.
 * \@howToUse
 * ```
 * \@Injectable()
 * class MyService {}
 *
 * const provider: ClassProvider = {provide: MyClass, deps: []};
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
 *
 * \@stable
 * @record
 */
export function ConstructorProvider() { }
function ConstructorProvider_tsickle_Closure_declarations() {
    /**
     * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
     * @type {?}
     */
    ConstructorProvider.prototype.provide;
    /**
     * If true, then injector returns an array of instances. This is useful to allow multiple
     * providers spread across many files to provide configuration information to a common token.
     *
     * ### Example
     *
     * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
     * @type {?|undefined}
     */
    ConstructorProvider.prototype.multi;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return a value of another `useExisting` token.
 * \@howToUse
 * ```
 * \@Injectable(SomeModule, {useExisting: 'someOtherToken'})
 * class SomeClass {}
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ExistingSansProvider'}
 *
 * \@stable
 * @record
 */
export function ExistingSansProvider() { }
function ExistingSansProvider_tsickle_Closure_declarations() {
    /**
     * Existing `token` to return. (equivalent to `injector.get(useExisting)`)
     * @type {?}
     */
    ExistingSansProvider.prototype.useExisting;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return a value of another `useExisting` token.
 * \@howToUse
 * ```
 * const provider: ExistingProvider = {provide: 'someToken', useExisting: 'someOtherToken'};
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ExistingProvider'}
 *
 * \@stable
 * @record
 */
export function ExistingProvider() { }
function ExistingProvider_tsickle_Closure_declarations() {
    /**
     * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
     * @type {?}
     */
    ExistingProvider.prototype.provide;
    /**
     * If true, then injector returns an array of instances. This is useful to allow multiple
     * providers spread across many files to provide configuration information to a common token.
     *
     * ### Example
     *
     * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
     * @type {?|undefined}
     */
    ExistingProvider.prototype.multi;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return a value by invoking a `useFactory`
 * function.
 * \@howToUse
 * ```
 * function serviceFactory() { ... }
 *
 * \@Injectable(SomeModule, {useFactory: serviceFactory, deps: []})
 * class SomeClass {}
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='FactorySansProvider'}
 *
 * \@experimental
 * @record
 */
export function FactorySansProvider() { }
function FactorySansProvider_tsickle_Closure_declarations() {
    /**
     * A function to invoke to create a value for this `token`. The function is invoked with
     * resolved values of `token`s in the `deps` field.
     * @type {?}
     */
    FactorySansProvider.prototype.useFactory;
    /**
     * A list of `token`s which need to be resolved by the injector. The list of values is then
     * used as arguments to the `useFactory` function.
     * @type {?|undefined}
     */
    FactorySansProvider.prototype.deps;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return a value by invoking a `useFactory`
 * function.
 * \@howToUse
 * ```
 * function serviceFactory() { ... }
 *
 * const provider: FactoryProvider = {provide: 'someToken', useFactory: serviceFactory, deps: []};
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='FactoryProvider'}
 *
 * Dependencies can also be marked as optional:
 * {\@example core/di/ts/provider_spec.ts region='FactoryProviderOptionalDeps'}
 *
 * \@stable
 * @record
 */
export function FactoryProvider() { }
function FactoryProvider_tsickle_Closure_declarations() {
    /**
     * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
     * @type {?}
     */
    FactoryProvider.prototype.provide;
    /**
     * If true, then injector returns an array of instances. This is useful to allow multiple
     * providers spread across many files to provide configuration information to a common token.
     *
     * ### Example
     *
     * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
     * @type {?|undefined}
     */
    FactoryProvider.prototype.multi;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return an instance of `Type` when `Type' is used
 * as token.
 * \@howToUse
 * ```
 * \@Injectable()
 * class MyService {}
 *
 * const provider: TypeProvider = MyService;
 * ```
 *
 * \@description
 *
 * Create an instance by invoking the `new` operator and supplying additional arguments.
 * This form is a short form of `TypeProvider`;
 *
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='TypeProvider'}
 *
 * \@stable
 * @record
 */
export function TypeProvider() { }
function TypeProvider_tsickle_Closure_declarations() {
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return a value by invoking a `useClass`
 * function.
 * \@howToUse
 * ```
 *
 * class SomeClassImpl {}
 *
 * \@Injectable(SomeModule, {useClass: SomeClassImpl})
 * class SomeClass {}
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ClassSansProvider'}
 *
 * \@experimental
 * @record
 */
export function ClassSansProvider() { }
function ClassSansProvider_tsickle_Closure_declarations() {
    /**
     * Class to instantiate for the `token`.
     * @type {?}
     */
    ClassSansProvider.prototype.useClass;
}
/**
 * \@whatItDoes Configures the {\@link Injector} to return an instance of `useClass` for a token.
 * \@howToUse
 * ```
 * \@Injectable()
 * class MyService {}
 *
 * const provider: ClassProvider = {provide: 'someToken', useClass: MyService};
 * ```
 *
 * \@description
 * For more details, see the {\@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ClassProvider'}
 *
 * Note that following two providers are not equal:
 * {\@example core/di/ts/provider_spec.ts region='ClassProviderDifference'}
 *
 * \@stable
 * @record
 */
export function ClassProvider() { }
function ClassProvider_tsickle_Closure_declarations() {
    /**
     * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
     * @type {?}
     */
    ClassProvider.prototype.provide;
    /**
     * If true, then injector returns an array of instances. This is useful to allow multiple
     * providers spread across many files to provide configuration information to a common token.
     *
     * ### Example
     *
     * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
     * @type {?|undefined}
     */
    ClassProvider.prototype.multi;
}
//# sourceMappingURL=provider.js.map