/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from './di';
import { ComponentRef } from './linker/component_factory';
/**
 * A [DI token](guide/glossary#di-token "DI token definition") representing a unique string ID, used
 * primarily for prefixing application attributes and CSS styles when
 * {@link ViewEncapsulation#Emulated ViewEncapsulation.Emulated} is being used.
 *
 * BY default, the value is randomly generated and assigned to the application by Angular.
 * To provide a custom ID value, use a DI provider <!-- TODO: provider --> to configure
 * the root {@link Injector} that uses this token.
 *
 * @publicApi
 */
export declare const APP_ID: InjectionToken<string>;
export declare function _appIdRandomProviderFactory(): string;
/**
 * Providers that generate a random `APP_ID_TOKEN`.
 * @publicApi
 */
export declare const APP_ID_RANDOM_PROVIDER: {
    provide: InjectionToken<string>;
    useFactory: typeof _appIdRandomProviderFactory;
    deps: any[];
};
/**
 * A function that is executed when a platform is initialized.
 * @publicApi
 */
export declare const PLATFORM_INITIALIZER: InjectionToken<(() => void)[]>;
/**
 * A token that indicates an opaque platform ID.
 * @publicApi
 */
export declare const PLATFORM_ID: InjectionToken<Object>;
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that provides a set of callbacks to
 * be called for every component that is bootstrapped.
 *
 * Each callback must take a `ComponentRef` instance and return nothing.
 *
 * `(componentRef: ComponentRef) => void`
 *
 * @publicApi
 */
export declare const APP_BOOTSTRAP_LISTENER: InjectionToken<((compRef: ComponentRef<any>) => void)[]>;
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that indicates the root directory of
 * the application
 * @publicApi
 */
export declare const PACKAGE_ROOT_URL: InjectionToken<string>;
