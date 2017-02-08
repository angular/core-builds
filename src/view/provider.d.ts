import { DepDef, DepFlags, NodeDef, NodeFlags, ProviderType, QueryValueType, ViewData, ViewDefinition } from './types';
export declare function directiveDef(flags: NodeFlags, matchedQueries: [string, QueryValueType][], childCount: number, ctor: any, deps: ([DepFlags, any] | any)[], props?: {
    [name: string]: [number, string];
}, outputs?: {
    [name: string]: string;
}, component?: () => ViewDefinition): NodeDef;
export declare function providerDef(flags: NodeFlags, matchedQueries: [string, QueryValueType][], type: ProviderType, token: any, value: any, deps: ([DepFlags, any] | any)[]): NodeDef;
export declare function _providerDef(flags: NodeFlags, matchedQueries: [string, QueryValueType][], childCount: number, type: ProviderType, token: any, value: any, deps: ([DepFlags, any] | any)[], props?: {
    [name: string]: [number, string];
}, outputs?: {
    [name: string]: string;
}, component?: () => ViewDefinition): NodeDef;
export declare function tokenKey(token: any): string;
export declare function createProviderInstance(view: ViewData, def: NodeDef): any;
export declare function checkAndUpdateProviderInline(view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any): void;
export declare function checkAndUpdateProviderDynamic(view: ViewData, def: NodeDef, values: any[]): void;
export declare function resolveDep(view: ViewData, requestNodeIndex: number, elIndex: number, depDef: DepDef, notFoundValue?: Object): any;
export declare function callLifecycleHooksChildrenFirst(view: ViewData, lifecycles: NodeFlags): void;
