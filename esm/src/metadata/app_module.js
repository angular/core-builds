/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectableMetadata } from '../di/metadata';
/**
 * Declares an Application Module.
 * @stable
 */
export class AppModuleMetadata extends InjectableMetadata {
    constructor({ providers, directives, pipes, precompile, modules } = {}) {
        super();
        this._providers = providers;
        this.directives = directives;
        this.pipes = pipes;
        this.precompile = precompile;
        this.modules = modules;
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
    get providers() { return this._providers; }
}
//# sourceMappingURL=app_module.js.map