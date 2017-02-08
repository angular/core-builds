import { ElementData, NodeDef, ViewData, ViewDefinition, ViewDefinitionFactory } from './types';
export declare function tokenKey(token: any): string;
export declare function checkBinding(view: ViewData, def: NodeDef, bindingIdx: number, value: any): boolean;
export declare function checkBindingNoChanges(view: ViewData, def: NodeDef, bindingIdx: number, value: any): void;
export declare function checkAndUpdateBinding(view: ViewData, def: NodeDef, bindingIdx: number, value: any): boolean;
export declare function dispatchEvent(view: ViewData, nodeIndex: number, eventName: string, event: any): boolean;
export declare function unwrapValue(value: any): any;
export declare function declaredViewContainer(view: ViewData): ElementData;
/**
 * for component views, this is the same as parentIndex.
 * for embedded views, this is the index of the parent node
 * that contains the view container.
 */
export declare function parentDiIndex(view: ViewData): number;
export declare function findElementDef(view: ViewData, nodeIndex: number): NodeDef;
export declare function renderNode(view: ViewData, def: NodeDef): any;
export declare function isComponentView(view: ViewData): boolean;
export declare function resolveViewDefinition(factory: ViewDefinitionFactory): ViewDefinition;
export declare function sliceErrorStack(start: number, end: number): string;
export declare function rootRenderNodes(view: ViewData): any[];
export declare enum RenderNodeAction {
    Collect = 0,
    AppendChild = 1,
    InsertBefore = 2,
    RemoveChild = 3,
}
export declare function visitRootRenderNodes(view: ViewData, action: RenderNodeAction, parentNode: any, nextSibling: any, target: any[]): void;
export declare function visitProjectedRenderNodes(view: ViewData, ngContentIndex: number, action: RenderNodeAction, parentNode: any, nextSibling: any, target: any[]): void;
