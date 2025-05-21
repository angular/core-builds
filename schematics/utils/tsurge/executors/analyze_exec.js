/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { NodeJSFileSystem } from '@angular/compiler-cli/src/ngtsc/file_system';
/**
 * 1P Logic: Executes the analyze phase of the given migration against
 * the specified TypeScript project.
 *
 * @returns the serializable migration unit data.
 */
export async function executeAnalyzePhase(migration, tsconfigAbsolutePath) {
    const info = migration.createProgram(tsconfigAbsolutePath, new NodeJSFileSystem());
    return await migration.analyze(info);
}
//# sourceMappingURL=analyze_exec.js.map