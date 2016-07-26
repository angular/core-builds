/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectableMetadata } from '../di/metadata';
/**
 * Declares an Angular Module.
 * @experimental
 */
export class NgModuleMetadata extends InjectableMetadata {
    constructor({ providers, declarations, imports, exports, precompile } = {}) {
        super();
        this._providers = providers;
        this.declarations = declarations;
        this.imports = imports;
        this.exports = exports;
        this.precompile = precompile;
    }
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
     * @NgModule({
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
    get providers() { return this._providers; }
}
//# sourceMappingURL=ng_module.js.map