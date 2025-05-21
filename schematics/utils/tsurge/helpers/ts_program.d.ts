/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { NgCompilerOptions } from '@angular/compiler-cli/src/ngtsc/core/api';
import { ParsedConfiguration } from '@angular/compiler-cli/src/perform_compile';
import ts from 'typescript';
import { BaseProgramInfo } from '../program_info';
/** Options that are good defaults for Tsurge migrations. */
export declare const defaultMigrationTsOptions: Partial<ts.CompilerOptions>;
/**
 * Creates an instance of a TypeScript program for the given project.
 */
export declare function createPlainTsProgram(tsHost: ts.CompilerHost, tsconfig: ParsedConfiguration, optionOverrides: NgCompilerOptions): BaseProgramInfo;
