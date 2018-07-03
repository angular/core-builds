/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵisPromise as isPromise } from '@angular/core';
import { global } from '@angular/core/src/util';
import { AsyncTestCompleter } from './async_test_completer';
import { getTestBed } from './test_bed';
export { AsyncTestCompleter } from './async_test_completer';
export { inject } from './test_bed';
export { Log } from './logger';
export { MockNgZone } from './ng_zone_mock';
export const /** @type {?} */ proxy = (t) => t;
const /** @type {?} */ _global = /** @type {?} */ ((typeof window === 'undefined' ? global : window));
export const /** @type {?} */ afterEach = _global.afterEach;
export const /** @type {?} */ expect = _global.expect;
const /** @type {?} */ jsmBeforeEach = _global.beforeEach;
const /** @type {?} */ jsmDescribe = _global.describe;
const /** @type {?} */ jsmDDescribe = _global.fdescribe;
const /** @type {?} */ jsmXDescribe = _global.xdescribe;
const /** @type {?} */ jsmIt = _global.it;
const /** @type {?} */ jsmIIt = _global.fit;
const /** @type {?} */ jsmXIt = _global.xit;
const /** @type {?} */ runnerStack = [];
jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000;
const /** @type {?} */ globalTimeOut = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const /** @type {?} */ testBed = getTestBed();
/**
 * Mechanism to run `beforeEach()` functions of Angular tests.
 *
 * Note: Jasmine own `beforeEach` is used by this library to handle DI providers.
 */
class BeforeEachRunner {
    /**
     * @param {?} _parent
     */
    constructor(_parent) {
        this._parent = _parent;
        this._fns = [];
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    beforeEach(fn) { this._fns.push(fn); }
    /**
     * @return {?}
     */
    run() {
        if (this._parent)
            this._parent.run();
        this._fns.forEach((fn) => { fn(); });
    }
}
function BeforeEachRunner_tsickle_Closure_declarations() {
    /** @type {?} */
    BeforeEachRunner.prototype._fns;
    /** @type {?} */
    BeforeEachRunner.prototype._parent;
}
// Reset the test providers before each test
jsmBeforeEach(() => { testBed.resetTestingModule(); });
/**
 * @param {?} jsmFn
 * @param {...?} args
 * @return {?}
 */
function _describe(jsmFn, ...args) {
    const /** @type {?} */ parentRunner = runnerStack.length === 0 ? null : runnerStack[runnerStack.length - 1];
    const /** @type {?} */ runner = new BeforeEachRunner(/** @type {?} */ ((parentRunner)));
    runnerStack.push(runner);
    const /** @type {?} */ suite = jsmFn(...args);
    runnerStack.pop();
    return suite;
}
/**
 * @param {...?} args
 * @return {?}
 */
export function describe(...args) {
    return _describe(jsmDescribe, ...args);
}
/**
 * @param {...?} args
 * @return {?}
 */
export function ddescribe(...args) {
    return _describe(jsmDDescribe, ...args);
}
/**
 * @param {...?} args
 * @return {?}
 */
export function xdescribe(...args) {
    return _describe(jsmXDescribe, ...args);
}
/**
 * @param {?} fn
 * @return {?}
 */
export function beforeEach(fn) {
    if (runnerStack.length > 0) {
        // Inside a describe block, beforeEach() uses a BeforeEachRunner
        runnerStack[runnerStack.length - 1].beforeEach(fn);
    }
    else {
        // Top level beforeEach() are delegated to jasmine
        jsmBeforeEach(fn);
    }
}
/**
 * Allows overriding default providers defined in test_injector.js.
 *
 * The given function must return a list of DI providers.
 *
 * Example:
 *
 *   beforeEachProviders(() => [
 *     {provide: Compiler, useClass: MockCompiler},
 *     {provide: SomeToken, useValue: myValue},
 *   ]);
 * @param {?} fn
 * @return {?}
 */
export function beforeEachProviders(fn) {
    jsmBeforeEach(() => {
        const /** @type {?} */ providers = fn();
        if (!providers)
            return;
        testBed.configureTestingModule({ providers: providers });
    });
}
/**
 * @param {?} jsmFn
 * @param {?} name
 * @param {?} testFn
 * @param {?} testTimeOut
 * @return {?}
 */
function _it(jsmFn, name, testFn, testTimeOut) {
    if (runnerStack.length == 0) {
        // This left here intentionally, as we should never get here, and it aids debugging.
        debugger;
        throw new Error('Empty Stack!');
    }
    const /** @type {?} */ runner = runnerStack[runnerStack.length - 1];
    const /** @type {?} */ timeOut = Math.max(globalTimeOut, testTimeOut);
    jsmFn(name, (done) => {
        const /** @type {?} */ completerProvider = {
            provide: AsyncTestCompleter,
            useFactory: () => {
                // Mark the test as async when an AsyncTestCompleter is injected in an it()
                return new AsyncTestCompleter();
            }
        };
        testBed.configureTestingModule({ providers: [completerProvider] });
        runner.run();
        if (testFn.length == 0) {
            const /** @type {?} */ retVal = testFn();
            if (isPromise(retVal)) {
                // Asynchronous test function that returns a Promise - wait for completion.
                (/** @type {?} */ (retVal)).then(done, done.fail);
            }
            else {
                // Synchronous test function - complete immediately.
                done();
            }
        }
        else {
            // Asynchronous test function that takes in 'done' parameter.
            testFn(done);
        }
    }, timeOut);
}
/**
 * @param {?} name
 * @param {?} fn
 * @param {?=} timeOut
 * @return {?}
 */
export function it(name, fn, timeOut = null) {
    return _it(jsmIt, name, fn, timeOut);
}
/**
 * @param {?} name
 * @param {?} fn
 * @param {?=} timeOut
 * @return {?}
 */
export function xit(name, fn, timeOut = null) {
    return _it(jsmXIt, name, fn, timeOut);
}
/**
 * @param {?} name
 * @param {?} fn
 * @param {?=} timeOut
 * @return {?}
 */
export function iit(name, fn, timeOut = null) {
    return _it(jsmIIt, name, fn, timeOut);
}
export class SpyObject {
    /**
     * @param {?=} type
     */
    constructor(type) {
        if (type) {
            for (const /** @type {?} */ prop in type.prototype) {
                let /** @type {?} */ m = null;
                try {
                    m = type.prototype[prop];
                }
                catch (/** @type {?} */ e) {
                    // As we are creating spys for abstract classes,
                    // these classes might have getters that throw when they are accessed.
                    // As we are only auto creating spys for methods, this
                    // should not matter.
                }
                if (typeof m === 'function') {
                    this.spy(prop);
                }
            }
        }
    }
    /**
     * @param {?} name
     * @return {?}
     */
    spy(name) {
        if (!(/** @type {?} */ (this))[name]) {
            (/** @type {?} */ (this))[name] = jasmine.createSpy(name);
        }
        return (/** @type {?} */ (this))[name];
    }
    /**
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    prop(name, value) { (/** @type {?} */ (this))[name] = value; }
    /**
     * @param {?=} object
     * @param {?=} config
     * @param {?=} overrides
     * @return {?}
     */
    static stub(object = null, config = null, overrides = null) {
        if (!(object instanceof SpyObject)) {
            overrides = config;
            config = object;
            object = new SpyObject();
        }
        const /** @type {?} */ m = Object.assign({}, config, overrides);
        Object.keys(m).forEach(key => { object.spy(key).and.returnValue(m[key]); });
        return object;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ19pbnRlcm5hbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvdGVzdGluZ19pbnRlcm5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLElBQUksU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUU5QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsVUFBVSxFQUFTLE1BQU0sWUFBWSxDQUFDO0FBRTlDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFbEMsb0JBQWMsVUFBVSxDQUFDO0FBQ3pCLDJCQUFjLGdCQUFnQixDQUFDO0FBRS9CLE1BQU0sQ0FBQyx1QkFBTSxLQUFLLEdBQW1CLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFbkQsdUJBQU0sT0FBTyxxQkFBUSxDQUFDLE9BQU8sTUFBTSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQSxDQUFDO0FBRXZFLE1BQU0sQ0FBQyx1QkFBTSxTQUFTLEdBQWEsT0FBTyxDQUFDLFNBQVMsQ0FBQztBQUNyRCxNQUFNLENBQUMsdUJBQU0sTUFBTSxHQUFzQyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBRXhFLHVCQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQ3pDLHVCQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3JDLHVCQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQ3ZDLHVCQUFNLFlB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QyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsRUFBRTs7Ozs7OztJQUUvRCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQWMsSUFBSSxFQUFFLFNBQWMsSUFBSSxFQUFFLFlBQWlCLElBQUk7UUFDdkUsSUFBSSxDQUFDLENBQUMsTUFBTSxZQUFZLFNBQVMsQ0FBQyxFQUFFO1lBQ2xDLFNBQVMsR0FBRyxNQUFNLENBQUM7WUFDbkIsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNoQixNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztTQUMxQjtRQUVELHVCQUFNLENBQUMscUJBQU8sTUFBTSxFQUFLLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVFLE9BQU8sTUFBTSxDQUFDO0tBQ2Y7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHvJtWlzUHJvbWlzZSBhcyBpc1Byb21pc2V9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvc3JjL3V0aWwnO1xuXG5pbXBvcnQge0FzeW5jVGVzdENvbXBsZXRlcn0gZnJvbSAnLi9hc3luY190ZXN0X2NvbXBsZXRlcic7XG5pbXBvcnQge2dldFRlc3RCZWQsIGluamVjdH0gZnJvbSAnLi90ZXN0X2JlZCc7XG5cbmV4cG9ydCB7QXN5bmNUZXN0Q29tcGxldGVyfSBmcm9tICcuL2FzeW5jX3Rlc3RfY29tcGxldGVyJztcbmV4cG9ydCB7aW5qZWN0fSBmcm9tICcuL3Rlc3RfYmVkJztcblxuZXhwb3J0ICogZnJvbSAnLi9sb2dnZXInO1xuZXhwb3J0ICogZnJvbSAnLi9uZ196b25lX21vY2snO1xuXG5leHBvcnQgY29uc3QgcHJveHk6IENsYXNzRGVjb3JhdG9yID0gKHQ6IGFueSkgPT4gdDtcblxuY29uc3QgX2dsb2JhbCA9IDxhbnk+KHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogd2luZG93KTtcblxuZXhwb3J0IGNvbnN0IGFmdGVyRWFjaDogRnVuY3Rpb24gPSBfZ2xvYmFsLmFmdGVyRWFjaDtcbmV4cG9ydCBjb25zdCBleHBlY3Q6IChhY3R1YWw6IGFueSkgPT4gamFzbWluZS5NYXRjaGVycyA9IF9nbG9iYWwuZXhwZWN0O1xuXG5jb25zdCBqc21CZWZvcmVFYWNoID0gX2dsb2JhbC5iZWZvcmVFYWNoO1xuY29uc3QganNtRGVzY3JpYmUgPSBfZ2xvYmFsLmRlc2NyaWJlO1xuY29uc3QganNtRERlc2NyaWJlID0gX2dsb2JhbC5mZGVzY3JpYmU7XG5jb25zdCBqc21YRGVzY3JpYmUgPSBfZ2xvYmFsLnhkZXNjcmliZTtcbmNvbnN0IGpzbUl0ID0gX2dsb2JhbC5pdDtcbmNvbnN0IGpzbUlJdCA9IF9nbG9iYWwuZml0O1xuY29uc3QganNtWEl0ID0gX2dsb2JhbC54aXQ7XG5cbmNvbnN0IHJ1bm5lclN0YWNrOiBCZWZvcmVFYWNoUnVubmVyW10gPSBbXTtcbmphc21pbmUuREVGQVVMVF9USU1FT1VUX0lOVEVSVkFMID0gMzAwMDtcbmNvbnN0IGdsb2JhbFRpbWVPdXQgPSBqYXNtaW5lLkRFRkFVTFRfVElNRU9VVF9JTlRFUlZBTDtcblxuY29uc3QgdGVzdEJlZCA9IGdldFRlc3RCZWQoKTtcblxuLyoqXG4gKiBNZWNoYW5pc20gdG8gcnVuIGBiZWZvcmVFYWNoKClgIGZ1bmN0aW9ucyBvZiBBbmd1bGFyIHRlc3RzLlxuICpcbiAqIE5vdGU6IEphc21pbmUgb3duIGBiZWZvcmVFYWNoYCBpcyB1c2VkIGJ5IHRoaXMgbGlicmFyeSB0byBoYW5kbGUgREkgcHJvdmlkZXJzLlxuICovXG5jbGFzcyBCZWZvcmVFYWNoUnVubmVyIHtcbiAgcHJpdmF0ZSBfZm5zOiBBcnJheTxGdW5jdGlvbj4gPSBbXTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wYXJlbnQ6IEJlZm9yZUVhY2hSdW5uZXIpIHt9XG5cbiAgYmVmb3JlRWFjaChmbjogRnVuY3Rpb24pOiB2b2lkIHsgdGhpcy5fZm5zLnB1c2goZm4pOyB9XG5cbiAgcnVuKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9wYXJlbnQpIHRoaXMuX3BhcmVudC5ydW4oKTtcbiAgICB0aGlzLl9mbnMuZm9yRWFjaCgoZm4pID0+IHsgZm4oKTsgfSk7XG4gIH1cbn1cblxuLy8gUmVzZXQgdGhlIHRlc3QgcHJvdmlkZXJzIGJlZm9yZSBlYWNoIHRlc3RcbmpzbUJlZm9yZUVhY2goKCkgPT4geyB0ZXN0QmVkLnJlc2V0VGVzdGluZ01vZHVsZSgpOyB9KTtcblxuZnVuY3Rpb24gX2Rlc2NyaWJlKGpzbUZuOiBGdW5jdGlvbiwgLi4uYXJnczogYW55W10pIHtcbiAgY29uc3QgcGFyZW50UnVubmVyID0gcnVubmVyU3RhY2subGVuZ3RoID09PSAwID8gbnVsbCA6IHJ1bm5lclN0YWNrW3J1bm5lclN0YWNrLmxlbmd0aCAtIDFdO1xuICBjb25zdCBydW5uZXIgPSBuZXcgQmVmb3JlRWFjaFJ1bm5lcihwYXJlbnRSdW5uZXIgISk7XG4gIHJ1bm5lclN0YWNrLnB1c2gocnVubmVyKTtcbiAgY29uc3Qgc3VpdGUgPSBqc21GbiguLi5hcmdzKTtcbiAgcnVubmVyU3RhY2sucG9wKCk7XG4gIHJldHVybiBzdWl0ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlc2NyaWJlKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gIHJldHVybiBfZGVzY3JpYmUoanNtRGVzY3JpYmUsIC4uLmFyZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGRlc2NyaWJlKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gIHJldHVybiBfZGVzY3JpYmUoanNtRERlc2NyaWJlLCAuLi5hcmdzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHhkZXNjcmliZSguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICByZXR1cm4gX2Rlc2NyaWJlKGpzbVhEZXNjcmliZSwgLi4uYXJncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZWZvcmVFYWNoKGZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBpZiAocnVubmVyU3RhY2subGVuZ3RoID4gMCkge1xuICAgIC8vIEluc2lkZSBhIGRlc2NyaWJlIGJsb2NrLCBiZWZvcmVFYWNoKCkgdXNlcyBhIEJlZm9yZUVhY2hSdW5uZXJcbiAgICBydW5uZXJTdGFja1tydW5uZXJTdGFjay5sZW5ndGggLSAxXS5iZWZvcmVFYWNoKGZuKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUb3AgbGV2ZWwgYmVmb3JlRWFjaCgpIGFyZSBkZWxlZ2F0ZWQgdG8gamFzbWluZVxuICAgIGpzbUJlZm9yZUVhY2goZm4pO1xuICB9XG59XG5cbi8qKlxuICogQWxsb3dzIG92ZXJyaWRpbmcgZGVmYXVsdCBwcm92aWRlcnMgZGVmaW5lZCBpbiB0ZXN0X2luamVjdG9yLmpzLlxuICpcbiAqIFRoZSBnaXZlbiBmdW5jdGlvbiBtdXN0IHJldHVybiBhIGxpc3Qgb2YgREkgcHJvdmlkZXJzLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogICBiZWZvcmVFYWNoUHJvdmlkZXJzKCgpID0+IFtcbiAqICAgICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUNsYXNzOiBNb2NrQ29tcGlsZXJ9LFxuICogICAgIHtwcm92aWRlOiBTb21lVG9rZW4sIHVzZVZhbHVlOiBteVZhbHVlfSxcbiAqICAgXSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZWZvcmVFYWNoUHJvdmlkZXJzKGZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBqc21CZWZvcmVFYWNoKCgpID0+IHtcbiAgICBjb25zdCBwcm92aWRlcnMgPSBmbigpO1xuICAgIGlmICghcHJvdmlkZXJzKSByZXR1cm47XG4gICAgdGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlKHtwcm92aWRlcnM6IHByb3ZpZGVyc30pO1xuICB9KTtcbn1cblxuXG5mdW5jdGlvbiBfaXQoanNtRm46IEZ1bmN0aW9uLCBuYW1lOiBzdHJpbmcsIHRlc3RGbjogRnVuY3Rpb24sIHRlc3RUaW1lT3V0OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKHJ1bm5lclN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgLy8gVGhpcyBsZWZ0IGhlcmUgaW50ZW50aW9uYWxseSwgYXMgd2Ugc2hvdWxkIG5ldmVyIGdldCBoZXJlLCBhbmQgaXQgYWlkcyBkZWJ1Z2dpbmcuXG4gICAgZGVidWdnZXI7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFbXB0eSBTdGFjayEnKTtcbiAgfVxuICBjb25zdCBydW5uZXIgPSBydW5uZXJTdGFja1tydW5uZXJTdGFjay5sZW5ndGggLSAxXTtcbiAgY29uc3QgdGltZU91dCA9IE1hdGgubWF4KGdsb2JhbFRpbWVPdXQsIHRlc3RUaW1lT3V0KTtcblxuICBqc21GbihuYW1lLCAoZG9uZTogYW55KSA9PiB7XG4gICAgY29uc3QgY29tcGxldGVyUHJvdmlkZXIgPSB7XG4gICAgICBwcm92aWRlOiBBc3luY1Rlc3RDb21wbGV0ZXIsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIC8vIE1hcmsgdGhlIHRlc3QgYXMgYXN5bmMgd2hlbiBhbiBBc3luY1Rlc3RDb21wbGV0ZXIgaXMgaW5qZWN0ZWQgaW4gYW4gaXQoKVxuICAgICAgICByZXR1cm4gbmV3IEFzeW5jVGVzdENvbXBsZXRlcigpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlKHtwcm92aWRlcnM6IFtjb21wbGV0ZXJQcm92aWRlcl19KTtcbiAgICBydW5uZXIucnVuKCk7XG5cbiAgICBpZiAodGVzdEZuLmxlbmd0aCA9PSAwKSB7XG4gICAgICBjb25zdCByZXRWYWwgPSB0ZXN0Rm4oKTtcbiAgICAgIGlmIChpc1Byb21pc2UocmV0VmFsKSkge1xuICAgICAgICAvLyBBc3luY2hyb25vdXMgdGVzdCBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBQcm9taXNlIC0gd2FpdCBmb3IgY29tcGxldGlvbi5cbiAgICAgICAgKDxQcm9taXNlPGFueT4+cmV0VmFsKS50aGVuKGRvbmUsIGRvbmUuZmFpbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTeW5jaHJvbm91cyB0ZXN0IGZ1bmN0aW9uIC0gY29tcGxldGUgaW1tZWRpYXRlbHkuXG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQXN5bmNocm9ub3VzIHRlc3QgZnVuY3Rpb24gdGhhdCB0YWtlcyBpbiAnZG9uZScgcGFyYW1ldGVyLlxuICAgICAgdGVzdEZuKGRvbmUpO1xuICAgIH1cbiAgfSwgdGltZU91dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpdChuYW1lOiBhbnksIGZuOiBhbnksIHRpbWVPdXQ6IGFueSA9IG51bGwpOiB2b2lkIHtcbiAgcmV0dXJuIF9pdChqc21JdCwgbmFtZSwgZm4sIHRpbWVPdXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24geGl0KG5hbWU6IGFueSwgZm46IGFueSwgdGltZU91dDogYW55ID0gbnVsbCk6IHZvaWQge1xuICByZXR1cm4gX2l0KGpzbVhJdCwgbmFtZSwgZm4sIHRpbWVPdXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaWl0KG5hbWU6IGFueSwgZm46IGFueSwgdGltZU91dDogYW55ID0gbnVsbCk6IHZvaWQge1xuICByZXR1cm4gX2l0KGpzbUlJdCwgbmFtZSwgZm4sIHRpbWVPdXQpO1xufVxuXG5leHBvcnQgY2xhc3MgU3B5T2JqZWN0IHtcbiAgY29uc3RydWN0b3IodHlwZT86IGFueSkge1xuICAgIGlmICh0eXBlKSB7XG4gICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdHlwZS5wcm90b3R5cGUpIHtcbiAgICAgICAgbGV0IG06IGFueSA9IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbSA9IHR5cGUucHJvdG90eXBlW3Byb3BdO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLy8gQXMgd2UgYXJlIGNyZWF0aW5nIHNweXMgZm9yIGFic3RyYWN0IGNsYXNzZXMsXG4gICAgICAgICAgLy8gdGhlc2UgY2xhc3NlcyBtaWdodCBoYXZlIGdldHRlcnMgdGhhdCB0aHJvdyB3aGVuIHRoZXkgYXJlIGFjY2Vzc2VkLlxuICAgICAgICAgIC8vIEFzIHdlIGFyZSBvbmx5IGF1dG8gY3JlYXRpbmcgc3B5cyBmb3IgbWV0aG9kcywgdGhpc1xuICAgICAgICAgIC8vIHNob3VsZCBub3QgbWF0dGVyLlxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRoaXMuc3B5KHByb3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3B5KG5hbWU6IHN0cmluZykge1xuICAgIGlmICghKHRoaXMgYXMgYW55KVtuYW1lXSkge1xuICAgICAgKHRoaXMgYXMgYW55KVtuYW1lXSA9IGphc21pbmUuY3JlYXRlU3B5KG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gKHRoaXMgYXMgYW55KVtuYW1lXTtcbiAgfVxuXG4gIHByb3AobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7ICh0aGlzIGFzIGFueSlbbmFtZV0gPSB2YWx1ZTsgfVxuXG4gIHN0YXRpYyBzdHViKG9iamVjdDogYW55ID0gbnVsbCwgY29uZmlnOiBhbnkgPSBudWxsLCBvdmVycmlkZXM6IGFueSA9IG51bGwpIHtcbiAgICBpZiAoIShvYmplY3QgaW5zdGFuY2VvZiBTcHlPYmplY3QpKSB7XG4gICAgICBvdmVycmlkZXMgPSBjb25maWc7XG4gICAgICBjb25maWcgPSBvYmplY3Q7XG4gICAgICBvYmplY3QgPSBuZXcgU3B5T2JqZWN0KCk7XG4gICAgfVxuXG4gICAgY29uc3QgbSA9IHsuLi5jb25maWcsIC4uLm92ZXJyaWRlc307XG4gICAgT2JqZWN0LmtleXMobSkuZm9yRWFjaChrZXkgPT4geyBvYmplY3Quc3B5KGtleSkuYW5kLnJldHVyblZhbHVlKG1ba2V5XSk7IH0pO1xuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cbn1cbiJdfQ==