/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '../interface/type';
import { TypeDecorator } from '../util/decorators';
import { ɵɵInjectableDef } from './interface/defs';
import { ClassSansProvider, ConstructorSansProvider, ExistingSansProvider, FactorySansProvider, StaticClassSansProvider, ValueSansProvider } from './interface/provider';
import { compileInjectable as render3CompileInjectable } from './jit/injectable';
/**
 * Injectable providers used in `@Injectable` decorator.
 *
 * @publicApi
 */
export declare type InjectableProvider = ValueSansProvider | ExistingSansProvider | StaticClassSansProvider | ConstructorSansProvider | FactorySansProvider | ClassSansProvider;
/**
 * Type of the Injectable decorator / constructor function.
 *
 * @publicApi
 */
export interface InjectableDecorator {
    /**
     * Decorator that marks a class as available to `Injector` for creation.
     *
     * @see [Introduction to Services and DI](guide/architecture-services)
     * @see [Dependency Injection Guide](guide/dependency-injection)
     *
     * @usageNotes
     *
     * The following example shows how service classes are properly marked as
     * injectable.
     *
     * <code-example path="core/di/ts/metadata_spec.ts" region="Injectable"
     *  linenums="false"></code-example>
     *
     */
    (): TypeDecorator;
    (options?: {
        providedIn: Type<any> | 'root' | null;
    } & InjectableProvider): TypeDecorator;
    new (): Injectable;
    new (options?: {
        providedIn: Type<any> | 'root' | null;
    } & InjectableProvider): Injectable;
}
/**
 * Type of the Injectable metadata.
 *
 * @publicApi
 */
export interface Injectable {
    /**
     * Determines which injectors will provide the injectable,
     * by either associating it with an @NgModule or other `InjectorType`,
     * or by specifying that this injectable should be provided in the
     * 'root' injector, which will be the application-level injector in most apps.
     */
    providedIn?: Type<any> | 'root' | null;
}
/**
 * Injectable decorator and metadata.
 *
 * @Annotation
 * @publicApi
 */
export declare const Injectable: InjectableDecorator;
/**
 * Type representing injectable service.
 *
 * @publicApi
 */
export interface InjectableType<T> extends Type<T> {
    ngInjectableDef: ɵɵInjectableDef<T>;
}
export declare const SWITCH_COMPILE_INJECTABLE__POST_R3__: typeof render3CompileInjectable;
