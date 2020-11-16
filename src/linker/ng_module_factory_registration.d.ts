/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleType } from '../metadata/ng_module_def';
import { NgModuleFactory } from './ng_module_factory';
/**
 * Registers a loaded module. Should only be called from generated NgModuleFactory code.
 * @publicApi
 */
export declare function registerModuleFactory(id: string, factory: NgModuleFactory<any>): void;
export declare function registerNgModuleType(ngModuleType: NgModuleType): void;
export declare function clearModulesForTest(): void;
export declare function getRegisteredNgModuleType(id: string): NgModuleType<any> | NgModuleFactory<any>;
