/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { TsurgeMigration } from '../migration';
import { AbsoluteFsPath } from '@angular/compiler-cli/src/ngtsc/file_system';
import ts from 'typescript';
import { TestRun } from './test_run';
/**
 * Runs the given migration against a fake set of files, emulating
 * migration of a real TypeScript Angular project.
 *
 * Note: This helper does not execute the migration in batch mode, where
 * e.g. the migration runs per single file and merges the unit data.
 *
 * TODO: Add helper/solution to test batch execution, like with Tsunami.
 *
 * @returns a mock file system with the applied replacements of the migration.
 */
export declare function runTsurgeMigration<Stats>(migration: TsurgeMigration<unknown, unknown, Stats>, files: {
    name: AbsoluteFsPath;
    contents: string;
    isProgramRootFile?: boolean;
}[], compilerOptions?: ts.CompilerOptions): Promise<TestRun<Stats>>;
