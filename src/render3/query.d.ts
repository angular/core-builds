/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '../interface/type';
import { QueryList } from '../linker/query_list';
/**
 * Refreshes a query by combining matches from all active views and removing matches from deleted
 * views.
 *
 * @returns `true` if a query got dirty during change detection or if this is a static query
 * resolving in creation mode, `false` otherwise.
 *
 * @codeGenApi
 */
export declare function ɵɵqueryRefresh(queryList: QueryList<any>): boolean;
/**
 * Creates new QueryList for a static view query.
 *
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 *
 * @codeGenApi
 */
export declare function ɵɵstaticViewQuery<T>(predicate: Type<any> | string[], descend: boolean, read?: any): void;
/**
 * Creates new QueryList, stores the reference in LView and returns QueryList.
 *
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 *
 * @codeGenApi
 */
export declare function ɵɵviewQuery<T>(predicate: Type<any> | string[], descend: boolean, read?: any): void;
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 *
 * @param directiveIndex Current directive index
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 * @returns QueryList<T>
 *
 * @codeGenApi
 */
export declare function ɵɵcontentQuery<T>(directiveIndex: number, predicate: Type<any> | string[], descend: boolean, read?: any): void;
/**
 * Registers a QueryList, associated with a static content query, for later refresh
 * (part of a view refresh).
 *
 * @param directiveIndex Current directive index
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 * @returns QueryList<T>
 *
 * @codeGenApi
 */
export declare function ɵɵstaticContentQuery<T>(directiveIndex: number, predicate: Type<any> | string[], descend: boolean, read?: any): void;
/**
 * Loads a QueryList corresponding to the current view or content query.
 *
 * @codeGenApi
 */
export declare function ɵɵloadQuery<T>(): QueryList<T>;
