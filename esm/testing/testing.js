/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TestBed } from './test_bed';
var _global = (typeof window === 'undefined' ? global : window);
// Reset the test providers before each test.
if (_global.beforeEach) {
    _global.beforeEach(() => { TestBed.resetTestingModule(); });
}
/**
 * Allows overriding default providers of the test injector,
 * which are defined in test_injector.js
 *
 * @deprecated Use `TestBed.configureTestingModule instead.
 */
export function addProviders(providers) {
    if (!providers)
        return;
    TestBed.configureTestingModule({ providers: providers });
}
//# sourceMappingURL=testing.js.map