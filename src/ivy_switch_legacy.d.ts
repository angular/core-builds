/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export interface DirectiveCompiler {
    (type: any, meta: any): void;
}
export declare const ivyEnabled: boolean;
export declare let R3_COMPILE_COMPONENT: DirectiveCompiler;
export declare let R3_COMPILE_DIRECTIVE: DirectiveCompiler;
export declare let R3_COMPILE_INJECTABLE: DirectiveCompiler;
export declare let R3_COMPILE_NGMODULE: DirectiveCompiler;
export declare let R3_COMPILE_PIPE: DirectiveCompiler;
