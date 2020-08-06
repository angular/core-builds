/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export { ɵɵinject } from './di/injector_compatibility';
export { ɵɵdefineInjectable, ɵɵdefineInjector, ɵɵInjectableDef, ɵɵInjectorDef } from './di/interface/defs';
export { NgModuleDef, ɵɵNgModuleDefWithMeta } from './metadata/ng_module';
export { ɵɵdefineNgModule } from './render3/definition';
export { ɵɵFactoryDef } from './render3/interfaces/definition';
export { setClassMetadata } from './render3/metadata';
export { NgModuleFactory } from './render3/ng_module_ref';
export { noSideEffects as ɵnoSideEffects } from './util/closure';
/**
 * The existence of this constant (in this particular file) informs the Angular compiler that the
 * current program is actually @angular/core, which needs to be compiled specially.
 */
export declare const ITS_JUST_ANGULAR = true;
