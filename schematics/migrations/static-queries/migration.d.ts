/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/static-queries/migration" />
import { Tree } from '@angular-devkit/schematics';
/**
 * Runs the static query migration for the given TypeScript project. The schematic
 * analyzes all queries within the project and sets up the query timing based on
 * the current usage of the query property. e.g. a view query that is not used in any
 * lifecycle hook does not need to be static and can be set up with "static: false".
 */
export declare function runStaticQueryMigration(tree: Tree, tsconfigPath: string, basePath: string): void;
