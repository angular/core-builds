/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CompilerFactory, ComponentStillLoadingError, Injector, NgModule } from '../index';
import { ListWrapper } from '../src/facade/collection';
import { BaseException } from '../src/facade/exceptions';
import { FunctionWrapper, stringify } from '../src/facade/lang';
import { AsyncTestCompleter } from './async_test_completer';
const UNDEFINED = new Object();
/**
 * @experimental
 */
export class TestBed {
    constructor() {
        this._instantiated = false;
        this._compiler = null;
        this._moduleRef = null;
        this._ngModuleFactory = null;
        this._compilerOptions = [];
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._entryComponents = [];
        this._schemas = [];
        this.platform = null;
        this.ngModule = null;
    }
    reset() {
        this._compiler = null;
        this._moduleRef = null;
        this._ngModuleFactory = null;
        this._compilerOptions = [];
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._entryComponents = [];
        this._schemas = [];
        this._instantiated = false;
    }
    configureCompiler(config) {
        if (this._instantiated) {
            throw new BaseException('Cannot add configuration after test injector is instantiated');
        }
        this._compilerOptions.push(config);
    }
    configureModule(moduleDef) {
        if (this._instantiated) {
            throw new BaseException('Cannot add configuration after test injector is instantiated');
        }
        if (moduleDef.providers) {
            this._providers = ListWrapper.concat(this._providers, moduleDef.providers);
        }
        if (moduleDef.declarations) {
            this._declarations = ListWrapper.concat(this._declarations, moduleDef.declarations);
        }
        if (moduleDef.imports) {
            this._imports = ListWrapper.concat(this._imports, moduleDef.imports);
        }
        if (moduleDef.entryComponents) {
            this._entryComponents = ListWrapper.concat(this._entryComponents, moduleDef.entryComponents);
        }
        if (moduleDef.schemas) {
            this._schemas = ListWrapper.concat(this._schemas, moduleDef.schemas);
        }
    }
    createModuleFactory() {
        if (this._instantiated) {
            throw new BaseException('Cannot compile entryComponents when the test NgModule has already been instantiated. ' +
                'Make sure you are not using `inject` before `doAsyncEntryPointCompilation`.');
        }
        if (this._ngModuleFactory) {
            return Promise.resolve(this._ngModuleFactory);
        }
        const moduleType = this._createCompilerAndModule();
        return this._compiler.compileModuleAsync(moduleType).then((ngModuleFactory) => {
            this._ngModuleFactory = ngModuleFactory;
            return ngModuleFactory;
        });
    }
    initTestModule() {
        if (this._instantiated) {
            return;
        }
        if (this._ngModuleFactory) {
            this._createFromModuleFactory(this._ngModuleFactory);
        }
        else {
            let moduleType = this._createCompilerAndModule();
            this._createFromModuleFactory(this._compiler.compileModuleSync(moduleType));
        }
    }
    /**
     * @internal
     */
    _createInjectorAsync() {
        if (this._instantiated) {
            return Promise.resolve(this);
        }
        let ngModule = this._createCompilerAndModule();
        return this._compiler.compileModuleAsync(ngModule).then((ngModuleFactory) => this._createFromModuleFactory(ngModuleFactory));
    }
    _createCompilerAndModule() {
        const providers = this._providers.concat([{ provide: TestBed, useValue: this }]);
        const declarations = this._declarations;
        const imports = [this.ngModule, this._imports];
        const entryComponents = this._entryComponents;
        const schemas = this._schemas;
        class DynamicTestModule {
        }
        /** @nocollapse */
        DynamicTestModule.decorators = [
            { type: NgModule, args: [{
                        providers: providers,
                        declarations: declarations,
                        imports: imports,
                        entryComponents: entryComponents,
                        schemas: schemas
                    },] },
        ];
        const compilerFactory = this.platform.injector.get(CompilerFactory);
        this._compiler =
            compilerFactory.createCompiler(this._compilerOptions.concat([{ useDebug: true }]));
        return DynamicTestModule;
    }
    _createFromModuleFactory(ngModuleFactory) {
        this._moduleRef = ngModuleFactory.create(this.platform.injector);
        this._instantiated = true;
        return this;
    }
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        if (!this._instantiated) {
            throw new BaseException('Illegal state: The test bed\'s injector has not yet been created. Call initTestModule first!');
        }
        if (token === TestBed) {
            return this;
        }
        // Tests can inject things from the ng module and from the compiler,
        // but the ng module can't inject things from the compiler and vice versa.
        let result = this._moduleRef.injector.get(token, UNDEFINED);
        return result === UNDEFINED ? this._compiler.injector.get(token, notFoundValue) : result;
    }
    execute(tokens, fn) {
        if (!this._instantiated) {
            throw new BaseException('Illegal state: The test bed\'s injector has not yet been created. Call initTestModule first!');
        }
        var params = tokens.map(t => this.get(t));
        return FunctionWrapper.apply(fn, params);
    }
}
var _testBed = null;
/**
 * @experimental
 */
export function getTestBed() {
    if (_testBed == null) {
        _testBed = new TestBed();
    }
    return _testBed;
}
/**
 * @deprecated use getTestBed instead.
 */
export function getTestInjector() {
    return getTestBed();
}
/**
 * Set the providers that the test injector should use. These should be providers
 * common to every test in the suite.
 *
 * This may only be called once, to set up the common providers for the current test
 * suite on the current platform. If you absolutely need to change the providers,
 * first use `resetBaseTestProviders`.
 *
 * Test modules and platforms for individual platforms are available from
 * 'angular2/platform/testing/<platform_name>'.
 *
 * @deprecated Use initTestEnvironment instead
 */
export function setBaseTestProviders(platformProviders, applicationProviders) {
    if (platformProviders.length === 1 && typeof platformProviders[0] === 'function') {
        platformProviders[0](applicationProviders);
    }
    else {
        throw new Error(`setBaseTestProviders is deprecated and only supports platformProviders that are predefined by Angular. Use 'initTestEnvironment' instead.`);
    }
}
/**
 * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
 * angular module. These are common to every test in the suite.
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
export function initTestEnvironment(ngModule, platform) {
    var testBed = getTestBed();
    if (testBed.platform || testBed.ngModule) {
        throw new BaseException('Cannot set base providers because it has already been called');
    }
    testBed.platform = platform;
    testBed.ngModule = ngModule;
    return testBed;
}
/**
 * Reset the providers for the test injector.
 *
 * @deprecated Use resetTestEnvironment instead.
 */
export function resetBaseTestProviders() {
    resetTestEnvironment();
}
/**
 * Reset the providers for the test injector.
 *
 * @experimental
 */
export function resetTestEnvironment() {
    var testBed = getTestBed();
    testBed.platform = null;
    testBed.ngModule = null;
    testBed.reset();
}
/**
 * Compile entryComponents with a `templateUrl` for the test's NgModule.
 * It is necessary to call this function
 * as fetching urls is asynchronous.
 *
 * @experimental
 */
export function doAsyncEntryPointCompilation() {
    let testBed = getTestBed();
    return testBed.createModuleFactory();
}
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
export function inject(tokens, fn) {
    let testBed = getTestBed();
    if (tokens.indexOf(AsyncTestCompleter) >= 0) {
        return () => {
            // Return an async test method that returns a Promise if AsyncTestCompleter is one of the
            // injected tokens.
            return testBed._createInjectorAsync().then(() => {
                let completer = testBed.get(AsyncTestCompleter);
                testBed.execute(tokens, fn);
                return completer.promise;
            });
        };
    }
    else {
        return () => {
            try {
                testBed.initTestModule();
            }
            catch (e) {
                if (e instanceof ComponentStillLoadingError) {
                    throw new Error(`This test module uses the entryComponents ${stringify(e.compType)} which is using a "templateUrl", but they were never compiled. ` +
                        `Please call "doAsyncEntryPointCompilation" before "inject".`);
                }
                else {
                    throw e;
                }
            }
            return testBed.execute(tokens, fn);
        };
    }
}
/**
 * @experimental
 */
export class InjectSetupWrapper {
    constructor(_moduleDef) {
        this._moduleDef = _moduleDef;
    }
    _addModule() {
        var moduleDef = this._moduleDef();
        if (moduleDef) {
            getTestBed().configureModule(moduleDef);
        }
    }
    inject(tokens, fn) {
        return () => {
            this._addModule();
            return inject(tokens, fn)();
        };
    }
}
/**
 * @experimental
 */
export function withProviders(providers) {
    return new InjectSetupWrapper(() => { {
        return { providers: providers() };
    } });
}
/**
 * @experimental
 */
export function withModule(moduleDef) {
    return new InjectSetupWrapper(moduleDef);
}
//# sourceMappingURL=test_bed.js.map