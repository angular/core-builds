import { AppModuleFactory } from './app_module_factory';
import { AppModuleFactoryLoader } from './app_module_factory_loader';
import { Compiler } from './compiler';
/**
 * AppModuleFactoryLoader that uses SystemJS to load AppModuleFactory
 * @experimental
 */
export declare class SystemJsAppModuleLoader implements AppModuleFactoryLoader {
    private _compiler;
    constructor(_compiler: Compiler);
    load(path: string): Promise<AppModuleFactory<any>>;
    private loadAndCompile(path);
    private loadFactory(path);
}
