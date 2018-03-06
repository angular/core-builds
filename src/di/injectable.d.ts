import { Type } from '../type';
import { ClassSansProvider, ConstructorSansProvider, ExistingSansProvider, FactorySansProvider, StaticClassSansProvider, ValueSansProvider } from './provider';
/**
 * Injectable providers used in `@Injectable` decorator.
 *
 * @experimental
 */
export declare type InjectableProvider = ValueSansProvider | ExistingSansProvider | StaticClassSansProvider | ConstructorSansProvider | FactorySansProvider | ClassSansProvider;
/**
 * Type of the Injectable decorator / constructor function.
 *
 * @stable
 */
export interface InjectableDecorator {
    /**
     * @whatItDoes A marker metadata that marks a class as available to {@link Injector} for creation.
     * @howToUse
     * ```
     * @Injectable()
     * class Car {}
     * ```
     *
     * @description
     * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
     *
     * ### Example
     *
     * {@example core/di/ts/metadata_spec.ts region='Injectable'}
     *
     * {@link Injector} will throw an error when trying to instantiate a class that
     * does not have `@Injectable` marker, as shown in the example below.
     *
     * {@example core/di/ts/metadata_spec.ts region='InjectableThrows'}
     *
     * @stable
     */
    (): any;
    (options?: {
        scope: Type<any>;
    } & InjectableProvider): any;
    new (): Injectable;
    new (options?: {
        scope: Type<any>;
    } & InjectableProvider): Injectable;
}
/**
 * Type of the Injectable metadata.
 *
 * @experimental
 */
export interface Injectable {
    scope?: Type<any>;
    factory: () => any;
}
export declare function convertInjectableProviderToFactory(type: Type<any>, provider?: InjectableProvider): () => any;
/**
* Define injectable
*
* @experimental
*/
export declare function defineInjectable(opts: Injectable): Injectable;
/**
* Injectable decorator and metadata.
*
* @stable
* @Annotation
*/
export declare const Injectable: InjectableDecorator;
/**
 * Type representing injectable service.
 *
 * @experimental
 */
export interface InjectableType<T> extends Type<T> {
    ngInjectableDef?: Injectable;
}
