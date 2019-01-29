import { Compiler } from './compiler';
import { NgModuleFactory } from './ng_module_factory';
import { NgModuleFactoryLoader } from './ng_module_factory_loader';
import * as i0 from "../r3_symbols";
/**
 * Configuration for SystemJsNgModuleLoader.
 * token.
 *
 * @publicApi
 */
export declare abstract class SystemJsNgModuleLoaderConfig {
    /**
     * Prefix to add when computing the name of the factory module for a given module name.
     */
    factoryPathPrefix: string;
    /**
     * Suffix to add when computing the name of the factory module for a given module name.
     */
    factoryPathSuffix: string;
}
/**
 * NgModuleFactoryLoader that uses SystemJS to load NgModuleFactory
 * @publicApi
 */
export declare class SystemJsNgModuleLoader implements NgModuleFactoryLoader {
    private _compiler;
    private _config;
    constructor(_compiler: Compiler, config?: SystemJsNgModuleLoaderConfig);
    load(path: string): Promise<NgModuleFactory<any>>;
    private loadAndCompile;
    private loadFactory;
    static ngInjectableDef: i0.InjectableDef<SystemJsNgModuleLoader>;
}
