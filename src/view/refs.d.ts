/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef } from '../change_detection/change_detection';
import { Injector } from '../di';
import { ComponentFactory } from '../linker/component_factory';
import { TemplateRef } from '../linker/template_ref';
import { ViewContainerRef } from '../linker/view_container_ref';
import { Type } from '../type';
import { NodeDef, ViewData, ViewDefinitionFactory } from './types';
export declare function createComponentFactory(selector: string, componentType: Type<any>, viewDefFactory: ViewDefinitionFactory): ComponentFactory<any>;
export declare function createViewContainerRef(view: ViewData, elIndex: number): ViewContainerRef;
export declare function createChangeDetectorRef(view: ViewData): ChangeDetectorRef;
export declare function createTemplateRef(view: ViewData, def: NodeDef): TemplateRef<any>;
export declare function createInjector(view: ViewData, elIndex: number): Injector;
