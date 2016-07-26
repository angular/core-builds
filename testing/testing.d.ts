/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Public Test Library for unit testing Angular2 Applications. Assumes that you are running
 * with Jasmine, Mocha, or a similar framework which exports a beforeEach function and
 * allows tests to be asynchronous by either returning a promise or using a 'done' parameter.
 */
import { SchemaMetadata } from '../index';
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
    declarations?: any[];
    imports?: any[];
    entryComponents?: any[];
    schemas?: Array<SchemaMetadata | any[]>;
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
