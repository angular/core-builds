import { QueryList as viewEngine_QueryList } from '../linker/query_list';
import { Type } from '../type';
import { LNode } from './interfaces/node';
import { LQuery, QueryReadType } from './interfaces/query';
/**
 * A predicate which determines if a given element/directive should be included in the query
 */
export interface QueryPredicate<T> {
    /**
     * Next predicate
     */
    next: QueryPredicate<any> | null;
    /**
     * Destination to which the value should be added.
     */
    list: QueryList<T>;
    /**
     * If looking for directives then it contains the directive type.
     */
    type: Type<T> | null;
    /**
     * If selector then contains local names to query for.
     */
    selector: string[] | null;
    /**
     * Indicates which token should be read from DI for this query.
     */
    read: QueryReadType<T> | Type<T> | null;
    /**
     * Values which have been located.
     *
     * this is what builds up the `QueryList._valuesTree`.
     */
    values: any[];
}
export declare class LQuery_ implements LQuery {
    shallow: QueryPredicate<any> | null;
    deep: QueryPredicate<any> | null;
    constructor(deep?: QueryPredicate<any>);
    track<T>(queryList: viewEngine_QueryList<T>, predicate: Type<T> | string[], descend?: boolean, read?: QueryReadType<T> | Type<T>): void;
    child(): LQuery | null;
    container(): LQuery | null;
    enterView(index: number): LQuery | null;
    addNode(node: LNode): void;
    removeView(index: number): void;
    /**
     * Clone LQuery by taking all the deep query predicates and cloning those using a provided clone
     * function.
     * Shallow predicates are ignored.
     */
    private _clonePredicates(predicateCloneFn);
}
export declare type QueryList<T> = viewEngine_QueryList<T>;
export declare const QueryList: typeof viewEngine_QueryList;
export declare function query<T>(predicate: Type<any> | string[], descend?: boolean, read?: QueryReadType<T> | Type<T>): QueryList<T>;
/**
 * Refreshes a query by combining matches from all active views and removing matches from deleted
 * views.
 * Returns true if a query got dirty during change detection, false otherwise.
 */
export declare function queryRefresh(query: QueryList<any>): boolean;
