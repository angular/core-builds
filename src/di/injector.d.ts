/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '../type';
import { InjectionToken } from './injection_token';
import { StaticProvider } from './provider';
export declare const SOURCE = "__source";
export declare const THROW_IF_NOT_FOUND: Object;
/**
 * @whatItDoes Injector interface
 * @howToUse
 * ```
 * const injector: Injector = ...;
 * injector.get(...);
 * ```
 *
 * @description
 * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {@example core/di/ts/injector_spec.ts region='Injector'}
 *
 * `Injector` returns itself when given `Injector` as a token:
 * {@example core/di/ts/injector_spec.ts region='injectInjector'}
 *
 * @stable
 */
export declare abstract class Injector {
    static THROW_IF_NOT_FOUND: Object;
    static NULL: Injector;
    /**
     * Retrieves an instance from the injector based on the provided token.
     * If not found:
     * - Throws an error if no `notFoundValue` that is not equal to
     * Injector.THROW_IF_NOT_FOUND is given
     * - Returns the `notFoundValue` otherwise
     */
    abstract get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
    /**
     * @deprecated from v4.0.0 use Type<T> or InjectionToken<T>
     * @suppress {duplicate}
     */
    abstract get(token: any, notFoundValue?: any): any;
    /**
     * @deprecated from v5 use the new signature Injector.create(options)
     */
    static create(providers: StaticProvider[], parent?: Injector): Injector;
    static create(options: {
        providers: StaticProvider[];
        parent?: Injector;
        name?: string;
    }): Injector;
}
export declare class StaticInjector implements Injector {
    readonly parent: Injector;
    readonly source: string | null;
    private _records;
    constructor(providers: StaticProvider[], parent?: Injector, source?: string | null);
    get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
    get(token: any, notFoundValue?: any): any;
    toString(): string;
}
/**
 * Injection flags for DI.
 *
 * @stable
 */
export declare const enum InjectFlags {
    Default = 0,
    /** Skip the node that is requesting injection. */
    SkipSelf = 1,
    /** Don't descend into ancestors of the node requesting injection. */
    Self = 2,
}
export declare function setCurrentInjector(injector: Injector | null): Injector | null;
export declare function inject<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: undefined, flags?: InjectFlags): T;
export declare function inject<T>(token: Type<T> | InjectionToken<T>, notFoundValue: T | null, flags?: InjectFlags): T | null;
export declare function injectArgs(types: (Type<any> | InjectionToken<any> | any[])[]): any[];
