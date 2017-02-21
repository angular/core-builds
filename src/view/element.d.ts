import { SecurityContext } from '../security';
import { BindingType, ElementData, ElementHandleEventFn, NodeDef, NodeFlags, QueryValueType, ViewData, ViewDefinitionFactory } from './types';
export declare function anchorDef(flags: NodeFlags, matchedQueriesDsl: [string | number, QueryValueType][], ngContentIndex: number, childCount: number, handleEvent?: ElementHandleEventFn, templateFactory?: ViewDefinitionFactory): NodeDef;
export declare function elementDef(flags: NodeFlags, matchedQueriesDsl: [string | number, QueryValueType][], ngContentIndex: number, childCount: number, namespaceAndName: string, fixedAttrs?: [string, string][], bindings?: ([BindingType.ElementClass, string] | [BindingType.ElementStyle, string, string] | [BindingType.ElementAttribute | BindingType.ElementProperty, string, SecurityContext])[], outputs?: (string | [string, string])[], handleEvent?: ElementHandleEventFn): NodeDef;
export declare function createElement(view: ViewData, renderHost: any, def: NodeDef): ElementData;
export declare function checkAndUpdateElementInline(view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any): void;
export declare function checkAndUpdateElementDynamic(view: ViewData, def: NodeDef, values: any[]): void;
