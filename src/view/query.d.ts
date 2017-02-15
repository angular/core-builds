import { QueryList } from '../linker/query_list';
import { NodeDef, NodeFlags, QueryBindingType, ViewData } from './types';
export declare function queryDef(flags: NodeFlags, id: string, bindings: {
    [propName: string]: QueryBindingType;
}): NodeDef;
export declare function createQuery(): QueryList<any>;
export declare function dirtyParentQuery(queryId: string, view: ViewData): void;
export declare function checkAndUpdateQuery(view: ViewData, nodeDef: NodeDef): void;
export declare function getQueryValue(view: ViewData, nodeDef: NodeDef, queryId: string): any;
