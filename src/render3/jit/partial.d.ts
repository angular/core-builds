/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { R3DeclareComponentFacade, R3DeclareDirectiveFacade, R3DeclareFactoryFacade, R3DeclareInjectorFacade, R3DeclareNgModuleFacade, R3DeclarePipeFacade } from '../../compiler/compiler_facade';
/**
 * Compiles a partial directive declaration object into a full directive definition object.
 *
 * @codeGenApi
 */
export declare function ɵɵngDeclareDirective(decl: R3DeclareDirectiveFacade): unknown;
/**
 * Compiles a partial component declaration object into a full component definition object.
 *
 * @codeGenApi
 */
export declare function ɵɵngDeclareComponent(decl: R3DeclareComponentFacade): unknown;
/**
 * Compiles a partial pipe declaration object into a full pipe definition object.
 *
 * @codeGenApi
 */
export declare function ɵɵngDeclareFactory(decl: R3DeclareFactoryFacade): unknown;
/**
 * These enums are used in the partial factory declaration calls.
 */
export { FactoryTarget } from '../../compiler/compiler_facade';
/**
 * Compiles a partial injector declaration object into a full injector definition object.
 *
 * @codeGenApi
 */
export declare function ɵɵngDeclareInjector(decl: R3DeclareInjectorFacade): unknown;
/**
 * Compiles a partial NgModule declaration object into a full NgModule definition object.
 *
 * @codeGenApi
 */
export declare function ɵɵngDeclareNgModule(decl: R3DeclareNgModuleFacade): unknown;
/**
 * Compiles a partial pipe declaration object into a full pipe definition object.
 *
 * @codeGenApi
 */
export declare function ɵɵngDeclarePipe(decl: R3DeclarePipeFacade): unknown;
