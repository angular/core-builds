/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/testbed-teardown/util" />
import ts from 'typescript';
/** Result of a full-program analysis looking for `initTestEnvironment` calls. */
export interface InitTestEnvironmentAnalysis {
    /** Total number of calls that were found. */
    totalCalls: number;
    /** Calls that need to be migrated. */
    callsToMigrate: ts.CallExpression[];
}
/** Finds the `initTestEnvironment` calls that need to be migrated. */
export declare function findInitTestEnvironmentCalls(typeChecker: ts.TypeChecker, allSourceFiles: ts.SourceFile[]): InitTestEnvironmentAnalysis;
/** Finds the `configureTestingModule` and `withModule` calls that need to be migrated. */
export declare function findTestModuleMetadataNodes(typeChecker: ts.TypeChecker, sourceFile: ts.SourceFile): ts.ObjectLiteralExpression[];
/** Migrates a call to `TestBed.initTestEnvironment`. */
export declare function migrateInitTestEnvironment(node: ts.CallExpression): ts.CallExpression;
/** Migrates an object literal that is passed into `configureTestingModule` or `withModule`. */
export declare function migrateTestModuleMetadataLiteral(node: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression;
