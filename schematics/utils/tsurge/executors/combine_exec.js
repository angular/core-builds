/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * 1P Logic: Executes the combine phase for the given migration against
 * two unit analyses.
 *
 * @returns the serializable combined unit data.
 */
export async function executeCombinePhase(migration, unitA, unitB) {
    return await migration.combine(unitA, unitB);
}
//# sourceMappingURL=combine_exec.js.map