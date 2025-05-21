/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { ParsedConfiguration } from '@angular/compiler-cli/src/perform_compile';
import { FileSystem } from '@angular/compiler-cli/src/ngtsc/file_system';
/** Parses the given tsconfig file, supporting Angular compiler options. */
export declare function parseTsconfigOrDie(absoluteTsconfigPath: string, fs: FileSystem): ParsedConfiguration;
