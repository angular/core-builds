/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { createBaseProgramInfo, getProgramInfoFromBaseInfo } from './helpers/create_program';
/**
 * @private
 *
 * Base class for the possible Tsurge migration variants.
 *
 * For example, this class exposes methods to conveniently create
 * TypeScript programs, while also allowing migration authors to override.
 */
export class TsurgeBaseMigration {
    /**
     * Creates the TypeScript program for a given compilation unit.
     *
     * By default:
     *  - In 3P: Ngtsc programs are being created.
     *  - In 1P: Ngtsc or TS programs are created based on the Blaze target.
     */
    createProgram(tsconfigAbsPath, fs, optionsOverride) {
        return getProgramInfoFromBaseInfo(createBaseProgramInfo(tsconfigAbsPath, fs, optionsOverride));
    }
}
//# sourceMappingURL=base_migration.js.map