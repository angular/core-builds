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
var TestInjector = (function () {
    function TestInjector() {
        this._instantiated = false;
        this._compiler = null;
        this._moduleRef = null;
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
    TestInjector.prototype.reset = function () {
        this._compiler = null;
        this._moduleRef = null;
        this._compilerProviders = [];
        this._compilerUseJit = true;
        this._providers = [];
        this._directives = [];
        this._pipes = [];
        this._modules = [];
        this._precompile = [];
        this._instantiated = false;
    };
    TestInjector.prototype.configureCompiler = function (config) {
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
    TestInjector.prototype.configureModule = function (moduleDef) {
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
    TestInjector.prototype.createInjectorSync = function () {
        if (this._instantiated) {
            return this;
        }
        var moduleMeta = this._createCompilerAndModuleMeta();
        return this._createFromModuleFactory(this._compiler.compileAppModuleSync(_NoopModule, moduleMeta));
    };
    TestInjector.prototype.createInjectorAsync = function () {
        var _this = this;
        if (this._instantiated) {
            return Promise.resolve(this);
        }
        var moduleMeta = this._createCompilerAndModuleMeta();
        return this._compiler.compileAppModuleAsync(_NoopModule, moduleMeta)
            .then(function (appModuleFactory) { return _this._createFromModuleFactory(appModuleFactory); });
    };
    TestInjector.prototype._createCompilerAndModuleMeta = function () {
        var compilerFactory = this.platform.injector.get(index_1.CompilerFactory);
        this._compiler = compilerFactory.createCompiler({
            providers: this._compilerProviders,
            useJit: this._compilerUseJit,
            deprecatedAppProviders: this._providers
        });
        var moduleMeta = new index_1.AppModuleMetadata({
            providers: this._providers.concat([{ provide: TestInjector, useValue: this }]),
            modules: this._modules.concat([this.appModule]),
            directives: this._directives,
            pipes: this._pipes,
            precompile: this._precompile
        });
        return moduleMeta;
    };
    TestInjector.prototype._createFromModuleFactory = function (appModuleFactory) {
        this._moduleRef = appModuleFactory.create(this.platform.injector);
        this._instantiated = true;
        return this;
    };
    TestInjector.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = index_1.Injector.THROW_IF_NOT_FOUND; }
        if (!this._instantiated) {
            throw new exceptions_1.BaseException('Illegal state: The TestInjector has not yet been created. Call createInjectorSync/Async first!');
        }
        if (token === TestInjector) {
            return this;
        }
        // Tests can inject things from the app module and from the compiler,
        // but the app module can't inject things from the compiler and vice versa.
        var result = this._moduleRef.injector.get(token, UNDEFINED);
        return result === UNDEFINED ? this._compiler.injector.get(token, notFoundValue) : result;
    };
    TestInjector.prototype.execute = function (tokens, fn) {
        var _this = this;
        if (!this._instantiated) {
            throw new exceptions_1.BaseException('Illegal state: The TestInjector has not yet been created. Call createInjectorSync/Async first!');
        }
        var params = tokens.map(function (t) { return _this.get(t); });
        return lang_1.FunctionWrapper.apply(fn, params);
    };
    return TestInjector;
}());
exports.TestInjector = TestInjector;
var _testInjector = null;
/**
 * @experimental
 */
function getTestInjector() {
    if (_testInjector == null) {
        _testInjector = new TestInjector();
    }
    return _testInjector;
}
exports.getTestInjector = getTestInjector;
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
function initTestEnvironment(appModule, platform) {
    var testInjector = getTestInjector();
    if (testInjector.platform || testInjector.appModule) {
        throw new exceptions_1.BaseException('Cannot set base providers because it has already been called');
    }
    testInjector.platform = platform;
    testInjector.appModule = appModule;
}
exports.initTestEnvironment = initTestEnvironment;
/**
 * Reset the providers for the test injector.
 *
 * @experimental
 */
function resetTestEnvironment() {
    var testInjector = getTestInjector();
    testInjector.platform = null;
    testInjector.appModule = null;
    testInjector.reset();
}
exports.resetTestEnvironment = resetTestEnvironment;
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
    var testInjector = getTestInjector();
    if (tokens.indexOf(async_test_completer_1.AsyncTestCompleter) >= 0) {
        return function () {
            // Return an async test method that returns a Promise if AsyncTestCompleter is one of the
            // injected tokens.
            return testInjector.createInjectorAsync().then(function () {
                var completer = testInjector.get(async_test_completer_1.AsyncTestCompleter);
                testInjector.execute(tokens, fn);
                return completer.promise;
            });
        };
    }
    else {
        return function () {
            // Return a asynchronous test method with the injected tokens.
            // TODO(tbosch): Right now, we can only detect the AsyncTestZoneSpec via its name.
            // (see https://github.com/angular/zone.js/issues/370)
            if (Zone.current.name.toLowerCase().indexOf('asynctestzone') >= 0) {
                return testInjector.createInjectorAsync().then(function () { return testInjector.execute(tokens, fn); });
            }
            else {
                // Return a synchronous test method with the injected tokens.
                try {
                    testInjector.createInjectorSync();
                }
                catch (e) {
                    if (e instanceof index_1.ComponentStillLoadingError) {
                        throw new Error(("This test module precompiles the component " + lang_1.stringify(e.compType) + " which is using a \"templateUrl\", but the test is synchronous. ") +
                            "Please use the \"async(...)\" or \"fakeAsync(...)\" helper functions to make the test asynchronous.");
                    }
                    else {
                        throw e;
                    }
                }
                return testInjector.execute(tokens, fn);
            }
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
            getTestInjector().configureModule(moduleDef);
        }
    };
    InjectSetupWrapper.prototype.inject = function (tokens, fn) {
        var _this = this;
        return function () {
            _this._addModule();
            return inject_impl(tokens, fn)();
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
// This is to ensure inject(Async) within InjectSetupWrapper doesn't call itself
// when transpiled to Dart.
var inject_impl = inject;
var _NoopModule = (function () {
    function _NoopModule() {
    }
    return _NoopModule;
}());
//# sourceMappingURL=test_injector.js.map