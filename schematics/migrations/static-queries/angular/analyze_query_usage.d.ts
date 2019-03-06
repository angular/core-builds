/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage" />
import * as ts from 'typescript';
import { ClassMetadataMap } from './ng_query_visitor';
import { NgQueryDefinition, QueryTiming } from './query-definition';
/**
 * Analyzes the usage of the given query and determines the query timing based
 * on the current usage of the query.
 */
export declare function analyzeNgQueryUsage(query: NgQueryDefinition, classMetadata: ClassMetadataMap, typeChecker: ts.TypeChecker): QueryTiming;
