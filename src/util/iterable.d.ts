/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare function isIterable(obj: any): obj is Iterable<any>;
export declare function isListLikeIterable(obj: any): boolean;
export declare function areIterablesEqual(a: any, b: any, comparator: (a: any, b: any) => boolean): boolean;
export declare function iterateListLike(obj: any, fn: (p: any) => any): void;
export declare function isJsObject(o: any): boolean;
