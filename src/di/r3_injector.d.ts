/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { Type } from '../interface/type';
import { InjectionToken } from './injection_token';
import { Injector } from './injector';
import { InjectorType } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { ClassProvider, ConstructorProvider, ExistingProvider, FactoryProvider, StaticClassProvider, StaticProvider, TypeProvider, ValueProvider } from './interface/provider';
/**
 * Internal type for a single provider in a deep provider array.
 */
declare type SingleProvider = TypeProvider | ValueProvider | ClassProvider | ConstructorProvider | ExistingProvider | FactoryProvider | StaticClassProvider;
/**
 * Create a new `Injector` which is configured using a `defType` of `InjectorType<any>`s.
 *
 * @publicApi
 */
export declare function createInjector(defType: any, parent?: Injector | null, additionalProviders?: StaticProvider[] | null, name?: string): Injector;
/**
 * Creates a new injector without eagerly resolving its injector types. Can be used in places
 * where resolving the injector types immediately can lead to an infinite loop. The injector types
 * should be resolved at a later point by calling `_resolveInjectorDefTypes`.
 */
export declare function createInjectorWithoutInjectorInstances(defType: any, parent?: Injector | null, additionalProviders?: StaticProvider[] | null, name?: string): R3Injector;
export declare class R3Injector {
    readonly parent: Injector;
    /**
     * Map of tokens to records which contain the instances of those tokens.
     * - `null` value implies that we don't have the record. Used by tree-shakable injectors
     * to prevent further searches.
     */
    private records;
    /**
     * The transitive set of `InjectorType`s which define this injector.
     */
    private injectorDefTypes;
    /**
     * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
     */
    private onDestroy;
    /**
     * Flag indicating this injector provides the APP_ROOT_SCOPE token, and thus counts as the
     * root scope.
     */
    private readonly scope;
    readonly source: string | null;
    /**
     * Flag indicating that this injector was previously destroyed.
     */
    get destroyed(): boolean;
    private _destroyed;
    constructor(def: InjectorType<any>, additionalProviders: StaticProvider[] | null, parent: Injector, source?: string | null);
    /**
     * Destroy the injector and release references to every instance or provider associated with it.
     *
     * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
     * hook was found.
     */
    destroy(): void;
    get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: any, flags?: InjectFlags): T;
    toString(): string;
    private assertNotDestroyed;
    /**
     * Add an `InjectorType` or `InjectorTypeWithProviders` and all of its transitive providers
     * to this injector.
     *
     * If an `InjectorTypeWithProviders` that declares providers besides the type is specified,
     * the function will return "true" to indicate that the providers of the type definition need
     * to be processed. This allows us to process providers of injector types after all imports of
     * an injector definition are processed. (following View Engine semantics: see FW-1349)
     */
    private processInjectorType;
    /**
     * Process a `SingleProvider` and add it.
     */
    private processProvider;
    private hydrate;
    private injectableDefInScope;
}
/**
 * Converts a `SingleProvider` into a factory function.
 *
 * @param provider provider to convert to factory
 */
export declare function providerToFactory(provider: SingleProvider, ngModuleType?: InjectorType<any>, providers?: any[]): () => any;
export declare function isTypeProvider(value: SingleProvider): value is TypeProvider;
export declare function isClassProvider(value: SingleProvider): value is ClassProvider;
export {};
