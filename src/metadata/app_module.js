/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var metadata_1 = require('../di/metadata');
/**
 * Declares an Application Module.
 * @stable
 */
var AppModuleMetadata = (function (_super) {
    __extends(AppModuleMetadata, _super);
    function AppModuleMetadata(_a) {
        var _b = _a === void 0 ? {} : _a, providers = _b.providers, directives = _b.directives, pipes = _b.pipes, precompile = _b.precompile, modules = _b.modules;
        _super.call(this);
        this._providers = providers;
        this.directives = directives;
        this.pipes = pipes;
        this.precompile = precompile;
        this.modules = modules;
    }
    Object.defineProperty(AppModuleMetadata.prototype, "providers", {
        /**
         * Defines the set of injectable objects that are available in the injector
         * of this module.
         *
         * ## Simple Example
         *
         * Here is an example of a class that can be injected:
         *
         * ```
         * class Greeter {
         *    greet(name:string) {
         *      return 'Hello ' + name + '!';
         *    }
         * }
         *
         * @AppModule({
         *   providers: [
         *     Greeter
         *   ]
         * })
         * class HelloWorld {
         *   greeter:Greeter;
         *
         *   constructor(greeter:Greeter) {
         *     this.greeter = greeter;
         *   }
         * }
         * ```
         */
        get: function () { return this._providers; },
        enumerable: true,
        configurable: true
    });
    return AppModuleMetadata;
}(metadata_1.InjectableMetadata));
exports.AppModuleMetadata = AppModuleMetadata;
//# sourceMappingURL=app_module.js.map