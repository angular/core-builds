/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import ts from 'typescript';
import { ImportManager } from '@angular/compiler-cli/src/ngtsc/translator';
import { Replacement } from '../replacement';
import { ProgramInfo } from '../program_info';
/**
 * Applies import manager changes, and writes them as replacements the
 * given result array.
 */
export declare function applyImportManagerChanges(importManager: ImportManager, replacements: Replacement[], sourceFiles: readonly ts.SourceFile[], info: Pick<ProgramInfo, 'sortedRootDirs' | 'projectRoot'>): void;
