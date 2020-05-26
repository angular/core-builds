/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleType } from '../render3/ng_module_ref';
import { NgModuleFactory } from './ng_module_factory';
/**
 * Registers a loaded module. Should only be called from generated NgModuleFactory code.
 * @publicApi
 */
export declare function registerModuleFactory(id: string, factory: NgModuleFactory<any>): void;
export declare function registerNgModuleType(ngModuleType: NgModuleType): void;
export declare function clearModulesForTest(): void;
export declare function getRegisteredNgModuleType(id: string): NgModuleFactory<any> | NgModuleType<any>;
