/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OpaqueToken } from '../di';
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
 * Each `@NgModule` provides an own `Compiler` to its injector,
 * that will use the directives/pipes of the ng module for compilation
 * of components.
 * @stable
 */
export class Compiler {
    /**
     * Returns the injector with which the compiler has been created.
     */
    get _injector() {
        throw new BaseException(`Runtime compiler is not loaded. Tried to read the injector.`);
    }
    /**
     * Loads the template and styles of a component and returns the associated `ComponentFactory`.
     */
    compileComponentAsync(component, ngModule = null) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(component)}`);
    }
    /**
     * Compiles the given component. All templates have to be either inline or compiled via
     * `compileComponentAsync` before. Otherwise throws a {@link ComponentStillLoadingError}.
     */
    compileComponentSync(component, ngModule = null) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(component)}`);
    }
    /**
     * Compiles the given NgModule. All templates of the components listed in `entryComponents`
     * have to be either inline or compiled before via `compileComponentAsync` /
     * `compileModuleAsync`. Otherwise throws a {@link ComponentStillLoadingError}.
     */
    compileModuleSync(moduleType) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(moduleType)}`);
    }
    compileModuleAsync(moduleType) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(moduleType)}`);
    }
    /**
     * Clears all caches
     */
    clearCache() { }
    /**
     * Clears the cache for the given component/ngModule.
     */
    clearCacheFor(type) { }
}
/**
 * Token to provide CompilerOptions in the platform injector.
 *
 * @experimental
 */
export const CompilerOptions = new OpaqueToken('compilerOptions');
/**
 * A factory for creating a Compiler
 *
 * @experimental
 */
export class CompilerFactory {
}
//# sourceMappingURL=compiler.js.map