/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
var exceptions_1 = require('../facade/exceptions');
var lang_1 = require('../facade/lang');
/**
 * Low-level service for running the angular compiler duirng runtime
 * to create {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 * @stable
 */
var Compiler = (function () {
    function Compiler() {
    }
    /**
     * Loads the template and styles of a component and returns the associated `ComponentFactory`.
     */
    Compiler.prototype.compileComponentAsync = function (component, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.moduleDirectives, moduleDirectives = _c === void 0 ? [] : _c, _d = _b.modulePipes, modulePipes = _d === void 0 ? [] : _d;
        throw new exceptions_1.BaseException("Runtime compiler is not loaded. Tried to compile " + lang_1.stringify(component));
    };
    /**
     * Compiles the given component. All templates have to be either inline or compiled via
     * `compileComponentAsync` before.
     */
    Compiler.prototype.compileComponentSync = function (component, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.moduleDirectives, moduleDirectives = _c === void 0 ? [] : _c, _d = _b.modulePipes, modulePipes = _d === void 0 ? [] : _d;
        throw new exceptions_1.BaseException("Runtime compiler is not loaded. Tried to compile " + lang_1.stringify(component));
    };
    /**
     * Compiles the given App Module. All templates of the components listed in `precompile`
     * have to be either inline or compiled before via `compileComponentAsync` /
     * `compileAppModuleAsync`.
     */
    Compiler.prototype.compileAppModuleSync = function (moduleType, metadata) {
        if (metadata === void 0) { metadata = null; }
        throw new exceptions_1.BaseException("Runtime compiler is not loaded. Tried to compile " + lang_1.stringify(moduleType));
    };
    Compiler.prototype.compileAppModuleAsync = function (moduleType, metadata) {
        if (metadata === void 0) { metadata = null; }
        throw new exceptions_1.BaseException("Runtime compiler is not loaded. Tried to compile " + lang_1.stringify(moduleType));
    };
    /**
     * Clears all caches
     */
    Compiler.prototype.clearCache = function () { };
    /**
     * Clears the cache for the given component/appModule.
     */
    Compiler.prototype.clearCacheFor = function (type) { };
    return Compiler;
}());
exports.Compiler = Compiler;
//# sourceMappingURL=compiler.js.map