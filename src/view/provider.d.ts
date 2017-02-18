import { RendererTypeV2 } from '../render/api';
import { BindingDef, DepDef, DepFlags, DirectiveOutputDef, NodeDef, NodeFlags, NodeType, ProviderType, QueryValueType, ViewData, ViewDefinition } from './types';
export declare function directiveDef(flags: NodeFlags, matchedQueries: [string | number, QueryValueType][], childCount: number, ctor: any, deps: ([DepFlags, any] | any)[], props?: {
    [name: string]: [number, string];
}, outputs?: {
    [name: string]: string;
}, component?: () => ViewDefinition, rendererType?: RendererTypeV2): NodeDef;
export declare function pipeDef(flags: NodeFlags, ctor: any, deps: ([DepFlags, any] | any)[]): NodeDef;
export declare function providerDef(flags: NodeFlags, matchedQueries: [string | number, QueryValueType][], type: ProviderType, token: any, value: any, deps: ([DepFlags, any] | any)[]): NodeDef;
export declare function _def(type: NodeType, flags: NodeFlags, matchedQueriesDsl: [string | number, QueryValueType][], childCount: number, providerType: ProviderType, token: any, value: any, deps: ([DepFlags, any] | any)[], bindings?: BindingDef[], outputs?: DirectiveOutputDef[], component?: () => ViewDefinition, rendererType?: RendererTypeV2): NodeDef;
export declare function createProviderInstance(view: ViewData, def: NodeDef): any;
export declare function createPipeInstance(view: ViewData, def: NodeDef): any;
export declare function createDirectiveInstance(view: ViewData, def: NodeDef): any;
export declare function checkAndUpdateDirectiveInline(view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any): void;
export declare function checkAndUpdateDirectiveDynamic(view: ViewData, def: NodeDef, values: any[]): void;
export declare function resolveDep(view: ViewData, elDef: NodeDef, allowPrivateServices: boolean, depDef: DepDef, notFoundValue?: Object): any;
export declare function callLifecycleHooksChildrenFirst(view: ViewData, lifecycles: NodeFlags): void;
