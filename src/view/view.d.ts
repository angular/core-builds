import { NodeDef, RootData, ViewData, ViewDefinition, ViewFlags, ViewHandleEventFn, ViewUpdateFn } from './types';
export declare function viewDef(flags: ViewFlags, nodes: NodeDef[], updateDirectives?: ViewUpdateFn, updateRenderer?: ViewUpdateFn, handleEvent?: ViewHandleEventFn): ViewDefinition;
export declare function createEmbeddedView(parent: ViewData, anchorDef: NodeDef, context?: any): ViewData;
export declare function createRootView(root: RootData, def: ViewDefinition, context?: any): ViewData;
export declare function checkNoChangesView(view: ViewData): void;
export declare function checkAndUpdateView(view: ViewData): void;
export declare function destroyView(view: ViewData): void;
