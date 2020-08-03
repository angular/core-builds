/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Wraps a test function in an asynchronous test zone. The test will automatically
 * complete when all asynchronous calls within this zone are done. Can be used
 * to wrap an {@link inject} call.
 *
 * Example:
 *
 * ```
 * it('...', waitForAsync(inject([AClass], (object) => {
 *   object.doSomething.then(() => {
 *     expect(...);
 *   })
 * });
 * ```
 *
 * @publicApi
 */
export declare function waitForAsync(fn: Function): (done: any) => any;
/**
 * @deprecated use `waitForAsync()`, (expected removal in v12)
 * @see {@link waitForAsync}
 * @publicApi
 * */
export declare function async(fn: Function): (done: any) => any;
