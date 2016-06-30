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
 * Low-level service for running the angular compiler duirng runtime
 * to create {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 * @stable
 */
export class Compiler {
    /**
     * Loads the template and styles of a component and returns the associated `ComponentFactory`.
     */
    compileComponentAsync(component, { moduleDirectives = [], modulePipes = [] } = {}) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(component)}`);
    }
    /**
     * Compiles the given component. All templates have to be either inline or compiled via
     * `compileComponentAsync` before.
     */
    compileComponentSync(component, { moduleDirectives = [], modulePipes = [] } = {}) {
        throw new BaseException(`Runtime compiler is not loaded. Tried to compile ${stringify(component)}`);
    }
    /**
     * Compiles the given App Module. All templates of the components listed in `precompile`
     * have to be either inline or compiled before via `compileComponentAsync` /
     * `compileAppModuleAsync`.
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
//# sourceMappingURL=compiler.js.map