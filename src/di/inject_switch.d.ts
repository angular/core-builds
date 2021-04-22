/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectFlags } from './interface/injector';
import { ProviderToken } from './provider_token';
export declare function getInjectImplementation(): (<T>(token: ProviderToken<T>, flags?: InjectFlags | undefined) => T | null) | undefined;
/**
 * Sets the current inject implementation.
 */
export declare function setInjectImplementation(impl: (<T>(token: ProviderToken<T>, flags?: InjectFlags) => T | null) | undefined): (<T>(token: ProviderToken<T>, flags?: InjectFlags) => T | null) | undefined;
/**
 * Injects `root` tokens in limp mode.
 *
 * If no injector exists, we can still inject tree-shakable providers which have `providedIn` set to
 * `"root"`. This is known as the limp mode injection. In such case the value is stored in the
 * injectable definition.
 */
export declare function injectRootLimpMode<T>(token: ProviderToken<T>, notFoundValue: T | undefined, flags: InjectFlags): T | null;
/**
 * Assert that `_injectImplementation` is not `fn`.
 *
 * This is useful, to prevent infinite recursion.
 *
 * @param fn Function which it should not equal to
 */
export declare function assertInjectImplementationNotEqual(fn: (<T>(token: ProviderToken<T>, flags?: InjectFlags) => T | null)): void;
