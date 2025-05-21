/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { TsurgeMigration } from '../migration';
/**
 * Synchronously combines unit data for the given migration.
 *
 * Note: This helper is useful for testing and execution of
 * Tsurge migrations in non-batchable environments. In general,
 * prefer parallel execution of combining via e.g. Beam combiners.
 */
export declare function synchronouslyCombineUnitData<UnitData>(migration: TsurgeMigration<UnitData, unknown, unknown>, unitDatas: UnitData[]): Promise<UnitData | null>;
