/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/static-queries/strategy_prompt" />
import { logging } from '@angular-devkit/core';
export declare enum SELECTED_STRATEGY {
    TEMPLATE = 0,
    USAGE = 1,
    TESTS = 2
}
/**
 * Prompts the user for the migration strategy that should be used. Defaults to the
 * template strategy as it provides a migration with rare manual corrections.
 * */
export declare function promptForMigrationStrategy(logger: logging.LoggerApi): Promise<SELECTED_STRATEGY.TEMPLATE | SELECTED_STRATEGY.USAGE>;
