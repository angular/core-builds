/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef } from '../change_detection/change_detection';
import { Injector } from '../di/injector';
import { Type } from '../type';
import { ElementRef } from './element_ref';
import { AppView } from './view';
import { ViewRef } from './view_ref';
/**
 * Represents an instance of a Component created via a {@link ComponentFactory}.
 *
 * `ComponentRef` provides access to the Component Instance as well other objects related to this
 * Component Instance and allows you to destroy the Component Instance via the {@link #destroy}
 * method.
 * @stable
 */
export declare abstract class ComponentRef<C> {
    /**
     * Location of the Host Element of this Component Instance.
     */
    readonly location: ElementRef;
    /**
     * The injector on which the component instance exists.
     */
    readonly injector: Injector;
    /**
     * The instance of the Component.
     */
    readonly instance: C;
    /**
     * The {@link ViewRef} of the Host View of this Component instance.
     */
    readonly hostView: ViewRef;
    /**
     * The {@link ChangeDetectorRef} of the Component instance.
     */
    readonly changeDetectorRef: ChangeDetectorRef;
    /**
     * The component type.
     */
    readonly componentType: Type<any>;
    /**
     * Destroys the component instance and all of the data structures associated with it.
     */
    abstract destroy(): void;
    /**
     * Allows to register a callback that will be called when the component is destroyed.
     */
    abstract onDestroy(callback: Function): void;
}
export declare class ComponentRef_<C> extends ComponentRef<C> {
    private _index;
    private _parentView;
    private _nativeElement;
    private _component;
    constructor(_index: number, _parentView: AppView<any>, _nativeElement: any, _component: C);
    readonly location: ElementRef;
    readonly injector: Injector;
    readonly instance: C;
    readonly hostView: ViewRef;
    readonly changeDetectorRef: ChangeDetectorRef;
    readonly componentType: Type<any>;
    destroy(): void;
    onDestroy(callback: Function): void;
}
/**
 * @stable
 */
export declare class ComponentFactory<C> {
    selector: string;
    private _componentType;
    constructor(selector: string, _viewClass: Type<AppView<any>>, _componentType: Type<any>);
    readonly componentType: Type<any>;
    /**
     * Creates a new component.
     */
    create(injector: Injector, projectableNodes?: any[][], rootSelectorOrNode?: string | any): ComponentRef<C>;
}
