/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var expect: Function;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var afterEach: Function;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var describe: Function;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var fdescribe: any;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var ddescribe: any;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var xdescribe: Function;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var beforeEach: any;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var it: any;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var fit: any;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var iit: any;
/**
 * @deprecated you no longer need to import jasmine functions from @angular/core/testing. Simply use
 * the globals.
 *
 * See http://jasmine.github.io/ for more details.
 */
export declare var xit: any;
/**
 * Allows overriding default providers of the test injector,
 * which are defined in test_injector.js
 *
 * @stable
 */
export declare function addProviders(providers: Array<any>): void;
/**
 * Allows overriding default providers, directives, pipes, modules of the test injector,
 * which are defined in test_injector.js
 *
 * @stable
 */
export declare function configureModule(moduleDef: {
    providers?: any[];
    directives?: any[];
    pipes?: any[];
    precompile?: any[];
    modules?: any[];
}): void;
/**
 * Allows overriding default compiler providers and settings
 * which are defined in test_injector.js
 *
 * @stable
 */
export declare function configureCompiler(config: {
    providers?: any[];
    useJit?: boolean;
}): void;
/**
 * @deprecated Use beforeEach(() => addProviders())
 */
export declare function beforeEachProviders(fn: () => Array<any>): void;
