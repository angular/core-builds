/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
declare global {
    namespace jasmine {
        interface Matchers<T> {
            toMatchWithDiff(expected: string): void;
        }
    }
}
export declare function setupTsurgeJasmineHelpers(): void;
