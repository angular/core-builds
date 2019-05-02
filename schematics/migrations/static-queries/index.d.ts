/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/static-queries" />
import { Rule } from '@angular-devkit/schematics';
export declare enum SELECTED_STRATEGY {
    TEMPLATE = 0,
    USAGE = 1,
    TESTS = 2
}
/** Entry point for the V8 static-query migration. */
export default function (): Rule;
