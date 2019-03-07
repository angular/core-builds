/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/static-queries/typescript/decorators" />
import * as ts from 'typescript';
import { Import } from './imports';
export declare function getCallDecoratorImport(typeChecker: ts.TypeChecker, decorator: ts.Decorator): Import | null;
