/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * 1P Logic: Executes the `globalMeta` stage for the given migration
 * to convert the combined unit data into global meta.
 *
 * @returns the serializable global meta.
 */
export async function executeGlobalMetaPhase(migration, combinedUnitData) {
    return await migration.globalMeta(combinedUnitData);
}
//# sourceMappingURL=global_meta_exec.js.map