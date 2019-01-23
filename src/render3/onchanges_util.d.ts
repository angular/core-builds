/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SimpleChanges } from '../interface/simple_change';
declare type Constructor<T> = new (...args: any[]) => T;
/**
 * Checks an object to see if it's an exact instance of a particular type
 * without traversing the inheritance hierarchy like `instanceof` does.
 * @param obj The object to check
 * @param type The type to check the object against
 */
export declare function isExactInstanceOf<T>(obj: any, type: Constructor<T>): obj is T;
/**
 * Checks to see if an object is an instance of {@link OnChangesDirectiveWrapper}
 * @param obj the object to check (generally from `LView`)
 */
export declare function isOnChangesDirectiveWrapper(obj: any): obj is OnChangesDirectiveWrapper<any>;
/**
 * Removes the `OnChangesDirectiveWrapper` if present.
 *
 * @param obj to unwrap.
 */
export declare function unwrapOnChangesDirectiveWrapper<T>(obj: T | OnChangesDirectiveWrapper<T>): T;
/**
 * A class that wraps directive instances for storage in LView when directives
 * have onChanges hooks to deal with.
 */
export declare class OnChangesDirectiveWrapper<T = any> {
    instance: T;
    seenProps: Set<string>;
    previous: SimpleChanges;
    changes: SimpleChanges | null;
    constructor(instance: T);
}
/**
 * Updates the `changes` property on the `wrapper` instance, such that when it's
 * checked in {@link callHooks} it will fire the related `onChanges` hook.
 * @param wrapper the wrapper for the directive instance
 * @param declaredName the declared name to be used in `SimpleChange`
 * @param value The new value for the property
 */
export declare function recordChange(wrapper: OnChangesDirectiveWrapper, declaredName: string, value: any): void;
export {};
