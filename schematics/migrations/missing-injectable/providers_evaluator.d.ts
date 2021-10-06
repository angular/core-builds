/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/missing-injectable/providers_evaluator" />
import ts from 'typescript';
import type { ResolvedValue, TypeScriptReflectionHost } from '@angular/compiler-cli/private/migrations';
export interface ProviderLiteral {
    node: ts.ObjectLiteralExpression;
    resolvedValue: ResolvedValue;
}
/**
 * A factory function to create an evaluator for providers. This is required to be a
 * factory function because the underlying class extends a class that is only available
 * from within a dynamically imported module (`@angular/compiler-cli/private/migrations`)
 * and is therefore not available at module evaluation time.
 */
export declare function createProvidersEvaluator(compilerCliMigrationsModule: typeof import('@angular/compiler-cli/private/migrations'), host: TypeScriptReflectionHost, checker: ts.TypeChecker): {
    evaluate: (expr: ts.Expression) => {
        resolvedValue: ResolvedValue;
        literals: ProviderLiteral[];
    };
};
