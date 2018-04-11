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
import { ReflectionCapabilities } from '../reflection/reflection_capabilities';
import { makeDecorator } from '../util/decorators';
import { getClosureSafeProperty } from '../util/property';
import { defineInjectable } from './defs';
import { inject, injectArgs } from './injector';
const /** @type {?} */ GET_PROPERTY_NAME = /** @type {?} */ ({});
const ɵ0 = GET_PROPERTY_NAME;
const /** @type {?} */ USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 }, GET_PROPERTY_NAME);
/**
 * Type of the Injectable decorator / constructor function.
 *
 *
 * @record
 */
export function InjectableDecorator() { }
function InjectableDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (): any;
    */
    /* TODO: handle strange member:
    (options?: {providedIn: Type<any>| 'root' | null}&InjectableProvider): any;
    */
    /* TODO: handle strange member:
    new (): Injectable;
    */
    /* TODO: handle strange member:
    new (options?: {providedIn: Type<any>| 'root' | null}&InjectableProvider): Injectable;
    */
}
const /** @type {?} */ EMPTY_ARRAY = [];
/**
 * @param {?} type
 * @param {?=} provider
 * @return {?}
 */
export function convertInjectableProviderToFactory(type, provider) {
    if (!provider) {
        const /** @type {?} */ reflectionCapabilities = new ReflectionCapabilities();
        const /** @type {?} */ deps = reflectionCapabilities.parameters(type);
        // TODO - convert to flags.
        return () => new type(...injectArgs(/** @type {?} */ (deps)));
    }
    if (USE_VALUE in provider) {
        const /** @type {?} */ valueProvider = (/** @type {?} */ (provider));
        return () => valueProvider.useValue;
    }
    else if ((/** @type {?} */ (provider)).useExisting) {
        const /** @type {?} */ existingProvider = (/** @type {?} */ (provider));
        return () => inject(existingProvider.useExisting);
    }
    else if ((/** @type {?} */ (provider)).useFactory) {
        const /** @type {?} */ factoryProvider = (/** @type {?} */ (provider));
        return () => factoryProvider.useFactory(...injectArgs(factoryProvider.deps || EMPTY_ARRAY));
    }
    else if ((/** @type {?} */ (provider)).useClass) {
        const /** @type {?} */ classProvider = (/** @type {?} */ (provider));
        let /** @type {?} */ deps = (/** @type {?} */ (provider)).deps;
        if (!deps) {
            const /** @type {?} */ reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return () => new classProvider.useClass(...injectArgs(deps));
    }
    else {
        let /** @type {?} */ deps = (/** @type {?} */ (provider)).deps;
        if (!deps) {
            const /** @type {?} */ reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return () => new type(...injectArgs(/** @type {?} */ ((deps))));
    }
}
/**
 * Injectable decorator and metadata.
 *
 *
 * \@Annotation
 */
export const /** @type {?} */ Injectable = makeDecorator('Injectable', undefined, undefined, undefined, (injectableType, options) => {
    if (options && options.providedIn !== undefined &&
        injectableType.ngInjectableDef === undefined) {
        /** @nocollapse */ injectableType.ngInjectableDef = defineInjectable({
            providedIn: options.providedIn,
            factory: convertInjectableProviderToFactory(injectableType, options)
        });
    }
});
/**
 * Type representing injectable service.
 *
 * \@experimental
 * @record
 * @template T
 */
export function InjectableType() { }
function InjectableType_tsickle_Closure_declarations() {
    /** @type {?} */
    InjectableType.prototype.ngInjectableDef;
}
export { ɵ0 };
//# sourceMappingURL=injectable.js.map