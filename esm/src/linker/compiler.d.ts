/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector, OpaqueToken } from '../di';
import { BaseException } from '../facade/exceptions';
import { ConcreteType, Type } from '../facade/lang';
import { ViewEncapsulation } from '../metadata';
import { ComponentFactory } from './component_factory';
import { NgModuleFactory } from './ng_module_factory';
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
 * Each `@NgModule` provides an own `Compiler` to its injector,
 * that will use the directives/pipes of the ng module for compilation
 * of components.
 * @stable
 */
export declare class Compiler {
    /**
     * Returns the injector with which the compiler has been created.
     */
    readonly _injector: Injector;
    /**
     * Loads the template and styles of a component and returns the associated `ComponentFactory`.
     */
    compileComponentAsync<T>(component: ConcreteType<T>, ngModule?: Type): Promise<ComponentFactory<T>>;
    /**
     * Compiles the given component. All templates have to be either inline or compiled via
     * `compileComponentAsync` before. Otherwise throws a {@link ComponentStillLoadingError}.
     */
    compileComponentSync<T>(component: ConcreteType<T>, ngModule?: Type): ComponentFactory<T>;
    /**
     * Compiles the given NgModule. All templates of the components listed in `entryComponents`
     * have to be either inline or compiled before via `compileComponentAsync` /
     * `compileModuleAsync`. Otherwise throws a {@link ComponentStillLoadingError}.
     */
    compileModuleSync<T>(moduleType: ConcreteType<T>): NgModuleFactory<T>;
    compileModuleAsync<T>(moduleType: ConcreteType<T>): Promise<NgModuleFactory<T>>;
    /**
     * Clears all caches
     */
    clearCache(): void;
    /**
     * Clears the cache for the given component/ngModule.
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
};
/**
 * Token to provide CompilerOptions in the platform injector.
 *
 * @experimental
 */
export declare const CompilerOptions: OpaqueToken;
/**
 * A factory for creating a Compiler
 *
 * @experimental
 */
export declare abstract class CompilerFactory {
    abstract createCompiler(options?: CompilerOptions[]): Compiler;
}
