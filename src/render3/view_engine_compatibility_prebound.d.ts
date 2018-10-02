/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef as ViewEngine_ElementRef } from '../linker/element_ref';
import { TemplateRef as ViewEngine_TemplateRef } from '../linker/template_ref';
import { ViewContainerRef as ViewEngine_ViewContainerRef } from '../linker/view_container_ref';
import { TNode } from './interfaces/node';
import { QueryReadType } from './interfaces/query';
import { LViewData } from './interfaces/view';
/**
 * Retrieves `TemplateRef` instance from `Injector` when a local reference is placed on the
 * `<ng-template>` element.
 */
export declare function templateRefExtractor(tNode: TNode, currentView: LViewData): ViewEngine_TemplateRef<{}>;
export declare const QUERY_READ_ELEMENT_REF: QueryReadType<ViewEngine_ElementRef<any>>;
export declare const QUERY_READ_TEMPLATE_REF: any;
export declare const QUERY_READ_CONTAINER_REF: QueryReadType<ViewEngine_ViewContainerRef>;
export declare const QUERY_READ_FROM_NODE: QueryReadType<any>;
