/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '../interface/type';
import { InjectionToken } from './injection_token';
import { InjectFlags } from './interface/injector';
export declare function getInjectImplementation(): (<T>(token: Type<T> | InjectionToken<T>, flags?: InjectFlags | undefined) => T | null) | undefined;
/**
 * Sets the current inject implementation.
 */
export declare function setInjectImplementation(impl: (<T>(token: Type<T> | InjectionToken<T>, flags?: InjectFlags) => T | null) | undefined): (<T>(token: Type<T> | InjectionToken<T>, flags?: InjectFlags) => T | null) | undefined;
/**
 * Injects `root` tokens in limp mode.
 *
 * If no injector exists, we can still inject tree-shakable providers which have `providedIn` set to
 * `"root"`. This is known as the limp mode injection. In such case the value is stored in the
 * `InjectableDef`.
 */
export declare function injectRootLimpMode<T>(token: Type<T> | InjectionToken<T>, notFoundValue: T | undefined, flags: InjectFlags): T | null;
/**
 * Assert that `_injectImplementation` is not `fn`.
 *
 * This is useful, to prevent infinite recursion.
 *
 * @param fn Function which it should not equal to
 */
export declare function assertInjectImplementationNotEqual(fn: (<T>(token: Type<T> | InjectionToken<T>, flags?: InjectFlags) => T | null)): void;
