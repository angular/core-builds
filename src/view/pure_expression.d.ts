import { NodeDef, PureExpressionData, ViewData } from './types';
export declare function purePipeDef(pipeToken: any, argCount: number): NodeDef;
export declare function pureArrayDef(argCount: number): NodeDef;
export declare function pureObjectDef(propertyNames: string[]): NodeDef;
export declare function createPureExpression(view: ViewData, def: NodeDef): PureExpressionData;
export declare function checkAndUpdatePureExpressionInline(view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any): void;
export declare function checkAndUpdatePureExpressionDynamic(view: ViewData, def: NodeDef, values: any[]): void;
