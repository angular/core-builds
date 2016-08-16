/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { ConcreteType } from '../facade/lang';
import { ComponentFactory } from './component_factory';
import { CodegenComponentFactoryResolver, ComponentFactoryResolver } from './component_factory_resolver';
/**
 * Represents an instance of an AppModule created via a {@link AppModuleFactory}.
 *
 * `AppModuleRef` provides access to the AppModule Instance as well other objects related to this
 * AppModule Instance.
 * @stable
 */
export declare abstract class AppModuleRef<T> {
    /**
     * The injector that contains all of the providers of the AppModule.
     */
    readonly injector: Injector;
    /**
     * The ComponentFactoryResolver to get hold of the ComponentFactories
     * delcared in the `precompile` property of the module.
     */
    readonly componentFactoryResolver: ComponentFactoryResolver;
    /**
     * The AppModule instance.
     */
    readonly instance: T;
}
/**
 * @stable
 */
export declare class AppModuleFactory<T> {
    private _injectorClass;
    private _moduleype;
    constructor(_injectorClass: {
        new (parentInjector: Injector): AppModuleInjector<T>;
    }, _moduleype: ConcreteType<T>);
    readonly moduleType: ConcreteType<T>;
    create(parentInjector?: Injector): AppModuleRef<T>;
}
export declare abstract class AppModuleInjector<T> extends CodegenComponentFactoryResolver implements Injector, AppModuleRef<T> {
    parent: Injector;
    instance: T;
    constructor(parent: Injector, factories: ComponentFactory<any>[]);
    create(): void;
    abstract createInternal(): T;
    get(token: any, notFoundValue?: any): any;
    abstract getInternal(token: any, notFoundValue: any): any;
    readonly injector: Injector;
    readonly componentFactoryResolver: ComponentFactoryResolver;
}
