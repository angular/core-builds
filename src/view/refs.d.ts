import { Injector } from '../di';
import { ComponentFactory } from '../linker/component_factory';
import { TemplateRef } from '../linker/template_ref';
import { ViewContainerRef } from '../linker/view_container_ref';
import { ViewRef } from '../linker/view_ref';
import { DebugContext, NodeDef, Refs, ViewData, ViewDefinitionFactory } from './types';
export declare function createRefs(): Refs_;
export declare class Refs_ implements Refs {
    createComponentFactory(selector: string, viewDefFactory: ViewDefinitionFactory): ComponentFactory<any>;
    createViewRef(data: ViewData): ViewRef;
    createViewContainerRef(view: ViewData, elIndex: number): ViewContainerRef;
    createTemplateRef(parentView: ViewData, def: NodeDef): TemplateRef<any>;
    createInjector(view: ViewData, elIndex: number): Injector;
    createDebugContext(view: ViewData, nodeIndex: number): DebugContext;
}
