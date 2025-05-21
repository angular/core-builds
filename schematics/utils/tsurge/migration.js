/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { TsurgeBaseMigration } from './base_migration';
/**
 * A simpler variant of a {@link TsurgeComplexMigration} that does not
 * fan-out into multiple workers per compilation unit to compute
 * the final migration replacements.
 *
 * This is faster and less resource intensive as workers and TS programs
 * are only ever created once.
 *
 * This is commonly the case when migrations are refactored to eagerly
 * compute replacements in the analyze stage, and then leverage the
 * global unit data to filter replacements that turned out to be "invalid".
 */
export class TsurgeFunnelMigration extends TsurgeBaseMigration {
}
/**
 * Complex variant of a `Tsurge` migration.
 *
 * For example, every analyze worker may contribute to a list of TS
 * references that are later combined. The migrate phase can then compute actual
 * file updates for all individual compilation units, leveraging the global metadata
 * to e.g. see if there are any references from other compilation units that may be
 * problematic and prevent migration of a given file.
 */
export class TsurgeComplexMigration extends TsurgeBaseMigration {
}
//# sourceMappingURL=migration.js.map