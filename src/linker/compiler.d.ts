import { ConcreteType, Type } from '../facade/lang';
import { AppModuleMetadata } from '../metadata/app_module';
import { AppModuleFactory } from './app_module_factory';
import { ComponentFactory } from './component_factory';
/**
 * Low-level service for running the angular compiler duirng runtime
 * to create {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 * @stable
 */
export declare class Compiler {
    /**
     * Loads the template and styles of a component and returns the associated `ComponentFactory`.
     */
    compileComponentAsync<T>(component: ConcreteType<T>, {moduleDirectives, modulePipes}?: {
        moduleDirectives?: ConcreteType<any>[];
        modulePipes?: ConcreteType<any>[];
    }): Promise<ComponentFactory<T>>;
    /**
     * Compiles the given component. All templates have to be either inline or compiled via
     * `compileComponentAsync` before.
     */
    compileComponentSync<T>(component: ConcreteType<T>, {moduleDirectives, modulePipes}?: {
        moduleDirectives?: ConcreteType<any>[];
        modulePipes?: ConcreteType<any>[];
    }): ComponentFactory<T>;
    /**
     * Compiles the given App Module. All templates of the components listed in `precompile`
     * have to be either inline or compiled before via `compileComponentAsync` /
     * `compileAppModuleAsync`.
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
