import { AppModuleFactory } from './app_module_factory';
import { AppModuleFactoryLoader } from './app_module_factory_loader';
import { Compiler } from './compiler';
/**
 * AppModuleFactoryLoader that uses SystemJS to load AppModule type and then compiles them.
 * @experimental
 */
export declare class SystemJsAppModuleLoader implements AppModuleFactoryLoader {
    private _compiler;
    constructor(_compiler: Compiler);
    load(path: string): Promise<AppModuleFactory<any>>;
}
/**
 * AppModuleFactoryLoader that uses SystemJS to load AppModuleFactories
 * @experimental
 */
export declare class SystemJsAppModuleFactoryLoader implements AppModuleFactoryLoader {
    load(path: string): Promise<AppModuleFactory<any>>;
}
