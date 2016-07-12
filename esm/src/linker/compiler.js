/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseException } from '../facade/exceptions';
import { stringify } from '../facade/lang';
/**
 * Indicates that a component is still being loaded in a synchronous compile.
 *
 * @stable
 */
export class ComponentStillLoadingError extends BaseException {
    constructor(compType) {
        super(`Can't compile synchronously as ${stringify(compType)} is still being loaded!`);
        this.compType = compType;
    }
}
/**
 * Low-level service for running the angular compiler duirng runtime
 * to create {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 *
 * Each `@AppModule` provides an own `Compiler` to its injector,
 * that will use the directives/pipes of the app module for compilation
 * of components.
 * @stable
 */
export class Compiler {
    /**
     * Returns the injector with which the compiler has been created.
     */
    get injector() {
        throw new BaseException(`Runtime compiler is not loaded. Tried to read the injector.`);
    }
    /**
     * Loads the template and styles of a component and returns the associated `ComponentFactory`.
     */
    compileComponentAsync(component) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(component)}`);
    }
    /**
     * Compiles the given component. All templates have to be either inline or compiled via
     * `compileComponentAsync` before. Otherwise throws a {@link ComponentStillLoadingError}.
     */
    compileComponentSync(component) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(component)}`);
    }
    /**
     * Compiles the given App Module. All templates of the components listed in `precompile`
     * have to be either inline or compiled before via `compileComponentAsync` /
     * `compileAppModuleAsync`. Otherwise throws a {@link ComponentStillLoadingError}.
     */
    compileAppModuleSync(moduleType, metadata = null) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(moduleType)}`);
    }
    compileAppModuleAsync(moduleType, metadata = null) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(moduleType)}`);
    }
    /**
     * Clears all caches
     */
    clearCache() { }
    /**
     * Clears the cache for the given component/appModule.
     */
    clearCacheFor(type) { }
}
/**
 * A factory for creating a Compiler
 *
 * @experimental
 */
export class CompilerFactory {
    static mergeOptions(defaultOptions = {}, newOptions = {}) {
        return {
            useDebug: _firstDefined(newOptions.useDebug, defaultOptions.useDebug),
            useJit: _firstDefined(newOptions.useJit, defaultOptions.useJit),
            defaultEncapsulation: _firstDefined(newOptions.defaultEncapsulation, defaultOptions.defaultEncapsulation),
            providers: _mergeArrays(defaultOptions.providers, newOptions.providers),
            deprecatedAppProviders: _mergeArrays(defaultOptions.deprecatedAppProviders, newOptions.deprecatedAppProviders)
        };
    }
    withDefaults(options = {}) {
        return new _DefaultApplyingCompilerFactory(this, options);
    }
}
class _DefaultApplyingCompilerFactory extends CompilerFactory {
    constructor(_delegate, _options) {
        super();
        this._delegate = _delegate;
        this._options = _options;
    }
    createCompiler(options = {}) {
        return this._delegate.createCompiler(CompilerFactory.mergeOptions(this._options, options));
    }
}
function _firstDefined(...args) {
    for (var i = 0; i < args.length; i++) {
        if (args[i] !== undefined) {
            return args[i];
        }
    }
    return undefined;
}
function _mergeArrays(...parts) {
    let result = [];
    parts.forEach((part) => result.push.apply(result, part));
    return result;
}
//# sourceMappingURL=compiler.js.map