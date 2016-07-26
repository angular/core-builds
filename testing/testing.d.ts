/**
 * Allows overriding default providers of the test injector,
 * which are defined in test_injector.js
 *
 * @stable
 */
export declare function addProviders(providers: Array<any>): void;
/**
 * Allows overriding default providers, directives, pipes, modules of the test injector,
 * which are defined in test_injector.js
 *
 * @stable
 */
export declare function configureModule(moduleDef: {
    providers?: any[];
    declarations?: any[];
    imports?: any[];
    precompile?: any[];
}): void;
/**
 * Allows overriding default compiler providers and settings
 * which are defined in test_injector.js
 *
 * @stable
 */
export declare function configureCompiler(config: {
    providers?: any[];
    useJit?: boolean;
}): void;
