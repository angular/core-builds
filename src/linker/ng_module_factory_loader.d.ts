/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleFactory } from './ng_module_factory';
/**
 * Used to load ng module factories.
 *
 * @publicApi
 * @deprecated the `string` form of `loadChildren` is deprecated, and `NgModuleFactoryLoader` is
 * part of its implementation. See `LoadChildren` for more details.
 */
export declare abstract class NgModuleFactoryLoader {
    abstract load(path: string): Promise<NgModuleFactory<any>>;
}
export declare function getModuleFactory__PRE_R3__(id: string): NgModuleFactory<any>;
export declare function getModuleFactory__POST_R3__(id: string): NgModuleFactory<any>;
/**
 * Returns the NgModuleFactory with the given id, if it exists and has been loaded.
 * Factories for modules that do not specify an `id` cannot be retrieved. Throws if the module
 * cannot be found.
 * @publicApi
 */
export declare const getModuleFactory: (id: string) => NgModuleFactory<any>;
