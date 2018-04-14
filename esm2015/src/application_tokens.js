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
import { InjectionToken } from './di';
/**
 * A DI Token representing a unique string id assigned to the application by Angular and used
 * primarily for prefixing application attributes and CSS styles when
 * {\@link ViewEncapsulation#Emulated ViewEncapsulation.Emulated} is being used.
 *
 * If you need to avoid randomly generated value to be used as an application id, you can provide
 * a custom value via a DI provider <!-- TODO: provider --> configuring the root {\@link Injector}
 * using this token.
 * \@experimental
 */
export const /** @type {?} */ APP_ID = new InjectionToken('AppId');
/**
 * @return {?}
 */
export function _appIdRandomProviderFactory() {
    return `${_randomChar()}${_randomChar()}${_randomChar()}`;
}
/**
 * Providers that will generate a random APP_ID_TOKEN.
 * \@experimental
 */
export const /** @type {?} */ APP_ID_RANDOM_PROVIDER = {
    provide: APP_ID,
    useFactory: _appIdRandomProviderFactory,
    deps: /** @type {?} */ ([]),
};
/**
 * @return {?}
 */
function _randomChar() {
    return String.fromCharCode(97 + Math.floor(Math.random() * 25));
}
/**
 * A function that will be executed when a platform is initialized.
 * \@experimental
 */
export const /** @type {?} */ PLATFORM_INITIALIZER = new InjectionToken('Platform Initializer');
/**
 * A token that indicates an opaque platform id.
 * \@experimental
 */
export const /** @type {?} */ PLATFORM_ID = new InjectionToken('Platform ID');
/**
 * All callbacks provided via this token will be called for every component that is bootstrapped.
 * Signature of the callback:
 *
 * `(componentRef: ComponentRef) => void`.
 *
 * \@experimental
 */
export const /** @type {?} */ APP_BOOTSTRAP_LISTENER = new InjectionToken('appBootstrapListener');
/**
 * A token which indicates the root directory of the application
 * \@experimental
 */
export const /** @type {?} */ PACKAGE_ROOT_URL = new InjectionToken('Application Packages Root URL');
//# sourceMappingURL=application_tokens.js.map