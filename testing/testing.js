/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
/**
 * Public Test Library for unit testing Angular2 Applications. Assumes that you are running
 * with Jasmine, Mocha, or a similar framework which exports a beforeEach function and
 * allows tests to be asynchronous by either returning a promise or using a 'done' parameter.
 */
var fake_async_1 = require('./fake_async');
var test_bed_1 = require('./test_bed');
var _global = (typeof window === 'undefined' ? global : window);
// Reset the test providers and the fake async zone before each test.
if (_global.beforeEach) {
    _global.beforeEach(function () {
        test_bed_1.TestBed.resetTestingModule();
        fake_async_1.resetFakeAsyncZone();
    });
}
/**
 * Allows overriding default providers of the test injector,
 * which are defined in test_injector.js
 *
 * @deprecated Use `TestBed.configureTestingModule instead.
 */
function addProviders(providers) {
    if (!providers)
        return;
    test_bed_1.TestBed.configureTestingModule({ providers: providers });
}
exports.addProviders = addProviders;
//# sourceMappingURL=testing.js.map