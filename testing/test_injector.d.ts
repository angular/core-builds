/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector, PlatformRef, Type } from '../index';
/**
 * @experimental
 */
export declare class TestInjector implements Injector {
    private _instantiated;
    private _compiler;
    private _moduleRef;
    private _compilerProviders;
    private _compilerUseJit;
    private _providers;
    private _directives;
    private _pipes;
    private _modules;
    private _precompile;
    reset(): void;
    platform: PlatformRef;
    appModule: Type;
    configureCompiler(config: {
        providers?: any[];
        useJit?: boolean;
    }): void;
    configureModule(moduleDef: {
        providers?: any[];
        directives?: any[];
        pipes?: any[];
        precompile?: any[];
        modules?: any[];
    }): void;
    createInjectorSync(): Injector;
    createInjectorAsync(): Promise<Injector>;
    private _createCompilerAndModuleMeta();
    private _createFromModuleFactory(appModuleFactory);
    get(token: any, notFoundValue?: any): any;
    execute(tokens: any[], fn: Function): any;
}
/**
 * @experimental
 */
export declare function getTestInjector(): TestInjector;
/**
 * Set the providers that the test injector should use. These should be providers
 * common to every test in the suite.
 *
 * This may only be called once, to set up the common providers for the current test
 * suite on the current platform. If you absolutely need to change the providers,
 * first use `resetTestEnvironment`.
 *
 * Test modules and platforms for individual platforms are available from
 * 'angular2/platform/testing/<platform_name>'.
 *
 * @experimental
 */
export declare function initTestEnvironment(appModule: Type, platform: PlatformRef): void;
/**
 * Reset the providers for the test injector.
 *
 * @experimental
 */
export declare function resetTestEnvironment(): void;
/**
 * Allows injecting dependencies in `beforeEach()` and `it()`.
 *
 * Example:
 *
 * ```
 * beforeEach(inject([Dependency, AClass], (dep, object) => {
 *   // some code that uses `dep` and `object`
 *   // ...
 * }));
 *
 * it('...', inject([AClass], (object) => {
 *   object.doSomething();
 *   expect(...);
 * })
 * ```
 *
 * Notes:
 * - inject is currently a function because of some Traceur limitation the syntax should
 * eventually
 *   becomes `it('...', @Inject (object: AClass, async: AsyncTestCompleter) => { ... });`
 *
 * @stable
 */
export declare function inject(tokens: any[], fn: Function): () => any;
/**
 * @experimental
 */
export declare class InjectSetupWrapper {
    private _moduleDef;
    constructor(_moduleDef: () => {
        providers?: any[];
        directives?: any[];
        pipes?: any[];
        precompile?: any[];
        modules?: any[];
    });
    private _addModule();
    inject(tokens: any[], fn: Function): () => any;
}
/**
 * @experimental
 */
export declare function withProviders(providers: () => any): InjectSetupWrapper;
/**
 * @experimental
 */
export declare function withModule(moduleDef: () => {
    providers?: any[];
    directives?: any[];
    pipes?: any[];
    precompile?: any[];
    modules?: any[];
}): InjectSetupWrapper;
