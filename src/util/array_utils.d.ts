/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
* Equivalent to ES6 spread, add each item to an array.
*
* @param items The items to add
* @param arr The array to which you want to add the items
*/
export declare function addAllToArray(items: any[], arr: any[]): void;
/**
 * Flattens an array.
 */
export declare function flatten(list: any[], dst?: any[]): any[];
export declare function deepForEach<T>(input: (T | any[])[], fn: (value: T) => void): void;
