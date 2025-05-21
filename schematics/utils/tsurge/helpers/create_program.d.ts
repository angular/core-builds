/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { NgCompilerOptions } from '@angular/compiler-cli/src/ngtsc/core/api';
import { FileSystem } from '@angular/compiler-cli/src/ngtsc/file_system';
import { BaseProgramInfo, ProgramInfo } from '../program_info';
/** Creates the base program info for the given tsconfig path. */
export declare function createBaseProgramInfo(absoluteTsconfigPath: string, fs: FileSystem, optionOverrides?: NgCompilerOptions): BaseProgramInfo;
/**
 * Creates the {@link ProgramInfo} from the given base information.
 *
 * This function purely exists to support custom programs that are
 * intended to be injected into Tsurge migrations. e.g. for language
 * service refactorings.
 */
export declare function getProgramInfoFromBaseInfo(baseInfo: BaseProgramInfo): ProgramInfo;
