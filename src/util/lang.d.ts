/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable, Subscribable } from 'rxjs';
/**
 * Determine if the argument is shaped like a Promise
 */
export declare function isPromise<T = any>(obj: any): obj is Promise<T>;
/**
 * Determine if the argument is a Subscribable
 */
export declare function isSubscribable(obj: any | Subscribable<any>): obj is Subscribable<any>;
/**
 * Determine if the argument is an Observable
 *
 * Strictly this tests that the `obj` is `Subscribable`, since `Observable`
 * types need additional methods, such as `lift()`. But it is adequate for our
 * needs since within the Angular framework code we only ever need to use the
 * `subscribe()` method, and RxJS has mechanisms to wrap `Subscribable` objects
 * into `Observable` as needed.
 */
export declare const isObservable: (obj: any | Observable<any>) => obj is Observable<any>;
