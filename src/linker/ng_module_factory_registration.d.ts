/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NgModuleType } from '../render3/ng_module_ref';
import { NgModuleFactory } from './ng_module_factory';
export declare type ModuleRegistrationMap = Map<string, NgModuleFactory<any> | NgModuleType>;
/**
 * Registers a loaded module. Should only be called from generated NgModuleFactory code.
 * @publicApi
 */
export declare function registerModuleFactory(id: string, factory: NgModuleFactory<any>): void;
export declare function registerNgModuleType(ngModuleType: NgModuleType): void;
export declare function clearRegisteredModuleState(): void;
export declare function getRegisteredModulesState(): ModuleRegistrationMap;
export declare function restoreRegisteredModulesState(moduleMap: ModuleRegistrationMap): void;
export declare function getRegisteredNgModuleType(id: string): NgModuleFactory<any> | NgModuleType<any> | undefined;
