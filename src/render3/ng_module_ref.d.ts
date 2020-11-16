/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { InjectFlags } from '../di/interface/injector';
import { R3Injector } from '../di/r3_injector';
import { Type } from '../interface/type';
import { InternalNgModuleRef, NgModuleFactory as viewEngine_NgModuleFactory, NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { ComponentFactoryResolver } from './component_ref';
export declare class NgModuleRef<T> extends viewEngine_NgModuleRef<T> implements InternalNgModuleRef<T> {
    _parent: Injector | null;
    _bootstrapComponents: Type<any>[];
    _r3Injector: R3Injector;
    injector: Injector;
    instance: T;
    destroyCbs: (() => void)[] | null;
    readonly componentFactoryResolver: ComponentFactoryResolver;
    constructor(ngModuleType: Type<T>, _parent: Injector | null);
    get(token: any, notFoundValue?: any, injectFlags?: InjectFlags): any;
    destroy(): void;
    onDestroy(callback: () => void): void;
}
export declare class NgModuleFactory<T> extends viewEngine_NgModuleFactory<T> {
    moduleType: Type<T>;
    constructor(moduleType: Type<T>);
    create(parentInjector: Injector | null): viewEngine_NgModuleRef<T>;
}
