/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Patch a `debug` property on top of the existing object.
 *
 * NOTE: always call this method with `ngDevMode && attachDebugObject(...)`
 *
 * @param obj Object to patch
 * @param debug Value to patch
 */
export declare function attachDebugObject(obj: any, debug: any): void;
/**
 * Patch a `debug` property getter on top of the existing object.
 *
 * NOTE: always call this method with `ngDevMode && attachDebugObject(...)`
 *
 * @param obj Object to patch
 * @param debugGetter Getter returning a value to patch
 */
export declare function attachDebugGetter(obj: any, debugGetter: () => any): void;
