/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Console } from '../console';
import { Type } from '../facade/lang';
import { ComponentFactory } from './component_factory';
/**
 * Low-level service for loading {@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 *
 * @deprecated Use {@link ComponentFactoryResolver} together with {@link
 * AppModule}.precompile}/{@link Component}.precompile or
 * {@link ANALYZE_FOR_PRECOMPILE} provider for dynamic component creation.
 * Use {@link AppModuleFactoryLoader} for lazy loading.
 */
export declare abstract class ComponentResolver {
    static DynamicCompilationDeprecationMsg: string;
    static LazyLoadingDeprecationMsg: string;
    abstract resolveComponent(component: Type | string): Promise<ComponentFactory<any>>;
    abstract clearCache(): void;
}
export declare class ReflectorComponentResolver extends ComponentResolver {
    private _console;
    constructor(_console: Console);
    resolveComponent(component: Type | string): Promise<ComponentFactory<any>>;
    clearCache(): void;
}
