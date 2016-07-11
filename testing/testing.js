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
var test_injector_1 = require('./test_injector');
var _global = (typeof window === 'undefined' ? global : window);
var testInjector = test_injector_1.getTestInjector();
// Reset the test providers before each test.
if (_global.beforeEach) {
    _global.beforeEach(function () { testInjector.reset(); });
}
/**
 * Allows overriding default providers of the test injector,
 * which are defined in test_injector.js
 *
 * @stable
 */
function addProviders(providers) {
    if (!providers)
        return;
    try {
        testInjector.configureModule({ providers: providers });
    }
    catch (e) {
        throw new Error('addProviders can\'t be called after the injector has been already created for this test. ' +
            'This is most likely because you\'ve already used the injector to inject a beforeEach or the ' +
            'current `it` function.');
    }
}
exports.addProviders = addProviders;
/**
 * Allows overriding default providers, directives, pipes, modules of the test injector,
 * which are defined in test_injector.js
 *
 * @stable
 */
function configureModule(moduleDef) {
    if (!moduleDef)
        return;
    try {
        testInjector.configureModule(moduleDef);
    }
    catch (e) {
        throw new Error('configureModule can\'t be called after the injector has been already created for this test. ' +
            'This is most likely because you\'ve already used the injector to inject a beforeEach or the ' +
            'current `it` function.');
    }
}
exports.configureModule = configureModule;
/**
 * Allows overriding default compiler providers and settings
 * which are defined in test_injector.js
 *
 * @stable
 */
function configureCompiler(config) {
    if (!config)
        return;
    try {
        testInjector.configureCompiler(config);
    }
    catch (e) {
        throw new Error('configureCompiler can\'t be called after the injector has been already created for this test. ' +
            'This is most likely because you\'ve already used the injector to inject a beforeEach or the ' +
            'current `it` function.');
    }
}
exports.configureCompiler = configureCompiler;
//# sourceMappingURL=testing.js.map