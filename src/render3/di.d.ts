/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
import { InjectFlags, Injector } from '../di/injector';
import { Renderer2 } from '../render';
import { Type } from '../type';
import { DirectiveDefInternal } from './interfaces/definition';
import { LInjector } from './interfaces/injector';
import { LContainerNode, LElementContainerNode, LElementNode, TContainerNode, TElementContainerNode, TElementNode } from './interfaces/node';
import { LViewData } from './interfaces/view';
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param injector The node injector in which the directive should be registered
 * @param type The directive to register
 */
export declare function bloomAdd(injector: LInjector, type: Type<any>): void;
export declare function getOrCreateNodeInjector(): LInjector;
/**
 * Creates (or gets an existing) injector for a given element or container.
 *
 * @param node for which an injector should be retrieved / created.
 * @param tNode for which an injector should be retrieved / created.
 * @param hostView View where the node is stored
 * @returns Node injector
 */
export declare function getOrCreateNodeInjectorForNode(node: LElementNode | LElementContainerNode | LContainerNode, tNode: TElementNode | TContainerNode | TElementContainerNode, hostView: LViewData): LInjector;
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param di The node injector in which a directive will be added
 * @param def The definition of the directive to be made public
 */
export declare function diPublicInInjector(di: LInjector, def: DirectiveDefInternal<any>): void;
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param def The definition of the directive to be made public
 */
export declare function diPublic(def: DirectiveDefInternal<any>): void;
/**
 * Returns the value associated to the given token from the injectors.
 *
 * `directiveInject` is intended to be used for directive, component and pipe factories.
 *  All other injection use `inject` which does not walk the node injector tree.
 *
 * Usage example (in factory function):
 *
 * class SomeDirective {
 *   constructor(directive: DirectiveA) {}
 *
 *   static ngDirectiveDef = defineDirective({
 *     type: SomeDirective,
 *     factory: () => new SomeDirective(directiveInject(DirectiveA))
 *   });
 * }
 *
 * @param token the type or token to inject
 * @param flags Injection flags
 * @returns the value from the injector or `null` when not found
 */
export declare function directiveInject<T>(token: Type<T> | InjectionToken<T>): T;
export declare function directiveInject<T>(token: Type<T> | InjectionToken<T>, flags: InjectFlags): T;
export declare function injectRenderer2(): Renderer2;
/**
 * Inject static attribute value into directive constructor.
 *
 * This method is used with `factory` functions which are generated as part of
 * `defineDirective` or `defineComponent`. The method retrieves the static value
 * of an attribute. (Dynamic attributes are not supported since they are not resolved
 *  at the time of injection and can change over time.)
 *
 * # Example
 * Given:
 * ```
 * @Component(...)
 * class MyComponent {
 *   constructor(@Attribute('title') title: string) { ... }
 * }
 * ```
 * When instantiated with
 * ```
 * <my-component title="Hello"></my-component>
 * ```
 *
 * Then factory method generated is:
 * ```
 * MyComponent.ngComponentDef = defineComponent({
 *   factory: () => new MyComponent(injectAttribute('title'))
 *   ...
 * })
 * ```
 *
 * @experimental
 */
export declare function injectAttribute(attrNameToInject: string): string | undefined;
/**
 * Returns the value associated to the given token from the injectors.
 *
 * Look for the injector providing the token by walking up the node injector tree and then
 * the module injector tree.
 *
 * @param nodeInjector Node injector where the search should start
 * @param token The token to look for
 * @param flags Injection flags
 * @returns the value from the injector or `null` when not found
 */
export declare function getOrCreateInjectable<T>(nodeInjector: LInjector, token: Type<T> | InjectionToken<T>, flags?: InjectFlags): T | null;
/**
 * Finds the closest injector that might have a certain directive.
 *
 * Each directive corresponds to a bit in an injector's bloom filter. Given the bloom bit to
 * check and a starting injector, this function traverses up injectors until it finds an
 * injector that contains a 1 for that bit in its bloom filter. A 1 indicates that the
 * injector may have that directive. It only *may* have the directive because directives begin
 * to share bloom filter bits after the BLOOM_SIZE is reached, and it could correspond to a
 * different directive sharing the bit.
 *
 * Note: We can skip checking further injectors up the tree if an injector's cbf structure
 * has a 0 for that bloom bit. Since cbf contains the merged value of all the parent
 * injectors, a 0 in the bloom bit indicates that the parents definitely do not contain
 * the directive and do not need to be checked.
 *
 * @param injector The starting node injector to check
 * @param  bloomBit The bit to check in each injector's bloom filter
 * @param  flags The injection flags for this injection site (e.g. Optional or SkipSelf)
 * @returns An injector that might have the directive
 */
export declare function bloomFindPossibleInjector(startInjector: LInjector, bloomBit: number, flags: InjectFlags): LInjector | null;
export declare class NodeInjector implements Injector {
    private _lInjector;
    constructor(_lInjector: LInjector);
    get(token: any): any;
}
export declare function getFactoryOf<T>(type: Type<any>): ((type?: Type<T>) => T) | null;
export declare function getInheritedFactory<T>(type: Type<any>): (type: Type<T>) => T;
