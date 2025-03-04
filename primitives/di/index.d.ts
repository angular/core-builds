/**
 * @license Angular v19.2.0+sha-080fb08
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */


export declare function getCurrentInjector(): Injector | undefined | null;

/**
 * A `Type` which has a `ɵprov: ɵɵInjectableDeclaration` static field.
 *
 * `InjectableType`s contain their own Dependency Injection metadata and are usable in an
 * `InjectorDef`-based `StaticInjector`.
 *
 * @publicApi
 */
export declare interface InjectionToken<T> extends Type<T> {
    ɵprov: ɵɵInjectableDeclaration<T>;
}

export declare interface Injector {
    retrieve?<T>(token: InjectionToken<T>, options?: unknown): T | NotFound;
}

/**
 * Type guard for checking if an unknown value is a NotFound.
 */
export declare function isNotFound(e: unknown): e is NotFound;

/**
 * Value returned if the key-value pair couldn't be found in the context
 * hierarchy.
 */
export declare const NOT_FOUND: unique symbol;

/**
 * Type union of NotFound and NotFoundError.
 */
export declare type NotFound = typeof NOT_FOUND | NotFoundError;

/**
 * Error thrown when the key-value pair couldn't be found in the context
 * hierarchy. Context can be attached below.
 */
export declare class NotFoundError extends Error {
    constructor(message: string);
}

export declare function setCurrentInjector(injector: Injector | null | undefined): Injector | undefined | null;

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

declare interface Type<T> extends Function {
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
export declare interface ɵɵInjectableDeclaration<T> {
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

export { }
