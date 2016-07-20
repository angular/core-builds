/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
var index_1 = require('../index');
var collection_1 = require('../src/facade/collection');
var exceptions_1 = require('../src/facade/exceptions');
var lang_1 = require('../src/facade/lang');
var async_test_completer_1 = require('./async_test_completer');
var UNDEFINED = new Object();
/**
 * @experimental
 */
var TestBed = (function () {
    function TestBed() {
        this._instantiated = false;
        this._compiler = null;
        this._moduleRef = null;
        this._appModuleFactory = null;
        this._compilerProviders = [];
        this._compilerUseJit = true;
        this._providers = [];
        this._directives = [];
        this._pipes = [];
        this._modules = [];
        this._precompile = [];
        this.platform = null;
        this.appModule = null;
    }
    TestBed.prototype.reset = function () {
        this._compiler = null;
        this._moduleRef = null;
        this._appModuleFactory = null;
        this._compilerProviders = [];
        this._compilerUseJit = true;
        this._providers = [];
        this._directives = [];
        this._pipes = [];
        this._modules = [];
        this._precompile = [];
        this._instantiated = false;
    };
    TestBed.prototype.configureCompiler = function (config) {
        if (this._instantiated) {
            throw new exceptions_1.BaseException('Cannot add configuration after test injector is instantiated');
        }
        if (config.providers) {
            this._compilerProviders = collection_1.ListWrapper.concat(this._compilerProviders, config.providers);
        }
        if (config.useJit !== undefined) {
            this._compilerUseJit = config.useJit;
        }
    };
    TestBed.prototype.configureModule = function (moduleDef) {
        if (this._instantiated) {
            throw new exceptions_1.BaseException('Cannot add configuration after test injector is instantiated');
        }
        if (moduleDef.providers) {
            this._providers = collection_1.ListWrapper.concat(this._providers, moduleDef.providers);
        }
        if (moduleDef.directives) {
            this._directives = collection_1.ListWrapper.concat(this._directives, moduleDef.directives);
        }
        if (moduleDef.pipes) {
            this._pipes = collection_1.ListWrapper.concat(this._pipes, moduleDef.pipes);
        }
        if (moduleDef.precompile) {
            this._precompile = collection_1.ListWrapper.concat(this._precompile, moduleDef.precompile);
        }
        if (moduleDef.modules) {
            this._modules = collection_1.ListWrapper.concat(this._modules, moduleDef.modules);
        }
    };
    TestBed.prototype.createAppModuleFactory = function () {
        var _this = this;
        if (this._instantiated) {
            throw new exceptions_1.BaseException('Cannot run precompilation when the test AppModule has already been instantiated. ' +
                'Make sure you are not using `inject` before `doAsyncPrecompilation`.');
        }
        if (this._appModuleFactory) {
            return Promise.resolve(this._appModuleFactory);
        }
        var moduleMeta = this._createCompilerAndModuleMeta();
        return this._compiler.compileAppModuleAsync(_NoopModule, moduleMeta)
            .then(function (appModuleFactory) {
            _this._appModuleFactory = appModuleFactory;
            return appModuleFactory;
        });
    };
    TestBed.prototype.initTestAppModule = function () {
        if (this._instantiated) {
            return;
        }
        if (this._appModuleFactory) {
            this._createFromModuleFactory(this._appModuleFactory);
        }
        else {
            var moduleMeta = this._createCompilerAndModuleMeta();
            this._createFromModuleFactory(this._compiler.compileAppModuleSync(_NoopModule, moduleMeta));
        }
    };
    /**
     * @internal
     */
    TestBed.prototype._createInjectorAsync = function () {
        var _this = this;
        if (this._instantiated) {
            return Promise.resolve(this);
        }
        var moduleMeta = this._createCompilerAndModuleMeta();
        return this._compiler.compileAppModuleAsync(_NoopModule, moduleMeta)
            .then(function (appModuleFactory) { return _this._createFromModuleFactory(appModuleFactory); });
    };
    TestBed.prototype._createCompilerAndModuleMeta = function () {
        var compilerFactory = this.platform.injector.get(index_1.CompilerFactory);
        this._compiler = compilerFactory.createCompiler({
            providers: this._compilerProviders,
            useJit: this._compilerUseJit,
            deprecatedAppProviders: this._providers
        });
        var moduleMeta = new index_1.AppModuleMetadata({
            providers: this._providers.concat([{ provide: TestBed, useValue: this }]),
            modules: this._modules.concat([this.appModule]),
            directives: this._directives,
            pipes: this._pipes,
            precompile: this._precompile
        });
        return moduleMeta;
    };
    TestBed.prototype._createFromModuleFactory = function (appModuleFactory) {
        this._moduleRef = appModuleFactory.create(this.platform.injector);
        this._instantiated = true;
        return this;
    };
    TestBed.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = index_1.Injector.THROW_IF_NOT_FOUND; }
        if (!this._instantiated) {
            throw new exceptions_1.BaseException('Illegal state: The test bed\'s injector has not yet been created. Call initTestAppModule first!');
        }
        if (token === TestBed) {
            return this;
        }
        // Tests can inject things from the app module and from the compiler,
        // but the app module can't inject things from the compiler and vice versa.
        var result = this._moduleRef.injector.get(token, UNDEFINED);
        return result === UNDEFINED ? this._compiler.injector.get(token, notFoundValue) : result;
    };
    TestBed.prototype.execute = function (tokens, fn) {
        var _this = this;
        if (!this._instantiated) {
            throw new exceptions_1.BaseException('Illegal state: The test bed\'s injector has not yet been created. Call initTestAppModule first!');
        }
        var params = tokens.map(function (t) { return _this.get(t); });
        return lang_1.FunctionWrapper.apply(fn, params);
    };
    return TestBed;
}());
exports.TestBed = TestBed;
var _testBed = null;
/**
 * @experimental
 */
function getTestBed() {
    if (_testBed == null) {
        _testBed = new TestBed();
    }
    return _testBed;
}
exports.getTestBed = getTestBed;
/**
 * @deprecated use getTestBed instead.
 */
function getTestInjector() {
    return getTestBed();
}
exports.getTestInjector = getTestInjector;
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
function setBaseTestProviders(platformProviders, applicationProviders) {
    // Create a platform based on the Platform Providers.
    var platformRef = index_1.createPlatform(index_1.ReflectiveInjector.resolveAndCreate(platformProviders));
    var TestAppModule = (function () {
        function TestAppModule() {
        }
        /** @nocollapse */
        TestAppModule.decorators = [
            { type: index_1.AppModule, args: [{ providers: applicationProviders },] },
        ];
        return TestAppModule;
    }());
    initTestEnvironment(TestAppModule, platformRef);
}
exports.setBaseTestProviders = setBaseTestProviders;
/**
 * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
 * application module. These are common to every test in the suite.
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
function initTestEnvironment(appModule, platform) {
    var testBed = getTestBed();
    if (testBed.platform || testBed.appModule) {
        throw new exceptions_1.BaseException('Cannot set base providers because it has already been called');
    }
    testBed.platform = platform;
    testBed.appModule = appModule;
}
exports.initTestEnvironment = initTestEnvironment;
/**
 * Reset the providers for the test injector.
 *
 * @deprecated Use resetTestEnvironment instead.
 */
function resetBaseTestProviders() {
    resetTestEnvironment();
}
exports.resetBaseTestProviders = resetBaseTestProviders;
/**
 * Reset the providers for the test injector.
 *
 * @experimental
 */
function resetTestEnvironment() {
    var testBed = getTestBed();
    testBed.platform = null;
    testBed.appModule = null;
    testBed.reset();
}
exports.resetTestEnvironment = resetTestEnvironment;
/**
 * Run asynchronous precompilation for the test's AppModule. It is necessary to call this function
 * if your test is using an AppModule which has precompiled components that require an asynchronous
 * call, such as an XHR. Should be called once before the test case.
 *
 * @experimental
 */
function doAsyncPrecompilation() {
    var testBed = getTestBed();
    return testBed.createAppModuleFactory();
}
exports.doAsyncPrecompilation = doAsyncPrecompilation;
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
function inject(tokens, fn) {
    var testBed = getTestBed();
    if (tokens.indexOf(async_test_completer_1.AsyncTestCompleter) >= 0) {
        return function () {
            // Return an async test method that returns a Promise if AsyncTestCompleter is one of the
            // injected tokens.
            return testBed._createInjectorAsync().then(function () {
                var completer = testBed.get(async_test_completer_1.AsyncTestCompleter);
                testBed.execute(tokens, fn);
                return completer.promise;
            });
        };
    }
    else {
        return function () {
            try {
                testBed.initTestAppModule();
            }
            catch (e) {
                if (e instanceof index_1.ComponentStillLoadingError) {
                    throw new Error(("This test module precompiles the component " + lang_1.stringify(e.compType) + " which is using a \"templateUrl\", but precompilation was never done. ") +
                        "Please call \"doAsyncPrecompilation\" before \"inject\".");
                }
                else {
                    throw e;
                }
            }
            return testBed.execute(tokens, fn);
        };
    }
}
exports.inject = inject;
/**
 * @experimental
 */
var InjectSetupWrapper = (function () {
    function InjectSetupWrapper(_moduleDef) {
        this._moduleDef = _moduleDef;
    }
    InjectSetupWrapper.prototype._addModule = function () {
        var moduleDef = this._moduleDef();
        if (moduleDef) {
            getTestBed().configureModule(moduleDef);
        }
    };
    InjectSetupWrapper.prototype.inject = function (tokens, fn) {
        var _this = this;
        return function () {
            _this._addModule();
            return inject(tokens, fn)();
        };
    };
    return InjectSetupWrapper;
}());
exports.InjectSetupWrapper = InjectSetupWrapper;
/**
 * @experimental
 */
function withProviders(providers) {
    return new InjectSetupWrapper(function () { {
        return { providers: providers() };
    } });
}
exports.withProviders = withProviders;
/**
 * @experimental
 */
function withModule(moduleDef) {
    return new InjectSetupWrapper(moduleDef);
}
exports.withModule = withModule;
var _NoopModule = (function () {
    function _NoopModule() {
    }
    return _NoopModule;
}());
//# sourceMappingURL=test_bed.js.map