/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/missing-injectable/transform" />
import * as ts from 'typescript';
import { ResolvedNgModule } from './module_collector';
import { UpdateRecorder } from './update_recorder';
export interface AnalysisFailure {
    node: ts.Node;
    message: string;
}
export declare class MissingInjectableTransform {
    private typeChecker;
    private getUpdateRecorder;
    private printer;
    private importManager;
    private partialEvaluator;
    /** Set of provider class declarations which were already checked or migrated. */
    private visitedProviderClasses;
    constructor(typeChecker: ts.TypeChecker, getUpdateRecorder: (sf: ts.SourceFile) => UpdateRecorder);
    recordChanges(): void;
    /** Migrates a given NgModule by walking through the referenced providers. */
    migrateModule(module: ResolvedNgModule): AnalysisFailure[];
    /**
     * Migrates a given provider class if it is not decorated with
     * any Angular decorator.
     */
    migrateProviderClass(node: ts.ClassDeclaration, module: ResolvedNgModule): void;
    /**
     * Visits the given resolved value of a provider. Providers can be nested in
     * arrays and we need to recursively walk through the providers to be able to
     * migrate all referenced provider classes. e.g. "providers: [[A, [B]]]".
     */
    private _visitProviderResolvedValue;
}
