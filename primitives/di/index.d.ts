/**
 * @license Angular v20.0.0-next.2+sha-cd7c170
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

/**
 * @description
 *
 * Represents a type that a Component or other object is instances of.
 *
 * An example of a `Type` is `MyCustomComponent` class, which in JavaScript is represented by
 * the `MyCustomComponent` constructor function.
 *
 * @publicApi
 */
declare const Type: FunctionConstructor;
interface Type<T> extends Function {
    new (...args: any[]): T;
}

/**
 * Information about how a type or `InjectionToken` interfaces with the DI system.
 *
 * At a minimum, this includes a `factory` which defines how to create the given type `T`, possibly
 * requesting injection of other types if necessary.
 *
 * Optionally, a `providedIn` parameter specifies that the given type belongs to a particular
 * `Injector`, `NgModule`, or a special scope (e.g. `'root'`). A value of `null` indicates
 * that the injectable does not belong to any scope.
 */
interface ɵɵInjectableDeclaration<T> {
    /**
     * Specifies that the given type belongs to a particular injector:
     */
    providedIn: Type<any> | 'root' | 'platform' | 'any' | null;
    /**
     * The token to which this definition belongs.
     *
     * Note that this may not be the same as the type that the `factory` will create.
     */
    token: unknown;
    /**
     * Factory method to execute to create an instance of the injectable.
     */
    factory: (t?: Type<any>) => T;
    /**
     * In a case of no explicit injector, a location where the instance of the injectable is stored.
     */
    value: T | undefined;
}
/**
 * A `Type` which has a `ɵprov: ɵɵInjectableDeclaration` static field.
 *
 * `InjectableType`s contain their own Dependency Injection metadata and are usable in an
 * `InjectorDef`-based `StaticInjector`.
 *
 * @publicApi
 */
interface InjectionToken<T> {
    ɵprov: ɵɵInjectableDeclaration<T>;
}

/**
 * Value returned if the key-value pair couldn't be found in the context
 * hierarchy.
 */
declare const NOT_FOUND: unique symbol;
/**
 * Error thrown when the key-value pair couldn't be found in the context
 * hierarchy. Context can be attached below.
 */
declare class NotFoundError extends Error {
    constructor(message: string);
}
/**
 * Type guard for checking if an unknown value is a NotFound.
 */
declare function isNotFound(e: unknown): e is NotFound;
/**
 * Type union of NotFound and NotFoundError.
 */
type NotFound = typeof NOT_FOUND | NotFoundError;

interface Injector {
    retrieve<T>(token: InjectionToken<T>, options?: unknown): T | NotFound;
}
declare function getCurrentInjector(): Injector | undefined | null;
declare function setCurrentInjector(injector: Injector | null | undefined): Injector | undefined | null;

export { type InjectionToken, type Injector, NOT_FOUND, type NotFound, NotFoundError, getCurrentInjector, isNotFound, setCurrentInjector, type ɵɵInjectableDeclaration };
