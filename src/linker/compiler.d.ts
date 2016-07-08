/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di';
import { BaseException } from '../facade/exceptions';
import { ConcreteType, Type } from '../facade/lang';
import { ViewEncapsulation } from '../metadata';
import { AppModuleMetadata } from '../metadata/app_module';
import { AppModuleFactory } from './app_module_factory';
import { ComponentFactory } from './component_factory';
/**
 * Indicates that a component is still being loaded in a synchronous compile.
 *
 * @stable
 */
export declare class ComponentStillLoadingError extends BaseException {
    compType: Type;
    constructor(compType: Type);
}
/**
 * Low-level service for running the angular compiler duirng runtime
 * to create {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 *
 * Each `@AppModule` provides an own `Compiler` to its injector,
 * that will use the directives/pipes of the app module for compilation
 * of components.
 * @stable
 */
export declare class Compiler {
    /**
     * Returns the injector with which the compiler has been created.
     */
    injector: Injector;
    /**
     * Loads the template and styles of a component and returns the associated `ComponentFactory`.
     */
    compileComponentAsync<T>(component: ConcreteType<T>): Promise<ComponentFactory<T>>;
    /**
     * Compiles the given component. All templates have to be either inline or compiled via
     * `compileComponentAsync` before. Otherwise throws a {@link ComponentStillLoadingError}.
     */
    compileComponentSync<T>(component: ConcreteType<T>): ComponentFactory<T>;
    /**
     * Compiles the given App Module. All templates of the components listed in `precompile`
     * have to be either inline or compiled before via `compileComponentAsync` /
     * `compileAppModuleAsync`. Otherwise throws a {@link ComponentStillLoadingError}.
     */
    compileAppModuleSync<T>(moduleType: ConcreteType<T>, metadata?: AppModuleMetadata): AppModuleFactory<T>;
    compileAppModuleAsync<T>(moduleType: ConcreteType<T>, metadata?: AppModuleMetadata): Promise<AppModuleFactory<T>>;
    /**
     * Clears all caches
     */
    clearCache(): void;
    /**
     * Clears the cache for the given component/appModule.
     */
    clearCacheFor(type: Type): void;
}
/**
 * Options for creating a compiler
 *
 * @experimental
 */
export declare type CompilerOptions = {
    useDebug?: boolean;
    useJit?: boolean;
    defaultEncapsulation?: ViewEncapsulation;
    providers?: any[];
    deprecatedAppProviders?: any[];
};
/**
 * A factory for creating a Compiler
 *
 * @experimental
 */
export declare abstract class CompilerFactory {
    static mergeOptions(defaultOptions?: CompilerOptions, newOptions?: CompilerOptions): CompilerOptions;
    withDefaults(options?: CompilerOptions): CompilerFactory;
    abstract createCompiler(options?: CompilerOptions): Compiler;
}
