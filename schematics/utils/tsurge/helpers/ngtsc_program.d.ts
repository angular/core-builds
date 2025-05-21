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
/**
 * Parses the configuration of the given TypeScript project and creates
 * an instance of the Angular compiler for the project.
 */
export declare function createNgtscProgram(tsHost: ts.CompilerHost, tsconfig: ParsedConfiguration, optionOverrides: NgCompilerOptions): BaseProgramInfo;
