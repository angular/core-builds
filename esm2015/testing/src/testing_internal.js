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
export * from './logger';
export * from './ng_zone_mock';
export const proxy = (t) => t;
const _global = (typeof window === 'undefined' ? global : window);
export const afterEach = _global.afterEach;
export const expect = _global.expect;
const jsmBeforeEach = _global.beforeEach;
const jsmDescribe = _global.describe;
const jsmDDescribe = _global.fdescribe;
const jsmXDescribe = _global.xdescribe;
const jsmIt = _global.it;
const jsmFIt = _global.fit;
const jsmXIt = _global.xit;
const runnerStack = [];
jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000;
const globalTimeOut = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const testBed = getTestBed();
/**
 * Mechanism to run `beforeEach()` functions of Angular tests.
 *
 * Note: Jasmine own `beforeEach` is used by this library to handle DI providers.
 */
class BeforeEachRunner {
    constructor(_parent) {
        this._parent = _parent;
        this._fns = [];
    }
    beforeEach(fn) { this._fns.push(fn); }
    run() {
        if (this._parent)
            this._parent.run();
        this._fns.forEach((fn) => { fn(); });
    }
}
// Reset the test providers before each test
jsmBeforeEach(() => { testBed.resetTestingModule(); });
function _describe(jsmFn, ...args) {
    const parentRunner = runnerStack.length === 0 ? null : runnerStack[runnerStack.length - 1];
    const runner = new BeforeEachRunner(parentRunner);
    runnerStack.push(runner);
    const suite = jsmFn(...args);
    runnerStack.pop();
    return suite;
}
export function describe(...args) {
    return _describe(jsmDescribe, ...args);
}
export function ddescribe(...args) {
    return _describe(jsmDDescribe, ...args);
}
export function xdescribe(...args) {
    return _describe(jsmXDescribe, ...args);
}
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
 */
export function beforeEachProviders(fn) {
    jsmBeforeEach(() => {
        const providers = fn();
        if (!providers)
            return;
        testBed.configureTestingModule({ providers: providers });
    });
}
function _it(jsmFn, testName, testFn, testTimeout = 0) {
    if (runnerStack.length == 0) {
        // This left here intentionally, as we should never get here, and it aids debugging.
        // tslint:disable-next-line
        debugger;
        throw new Error('Empty Stack!');
    }
    const runner = runnerStack[runnerStack.length - 1];
    const timeout = Math.max(globalTimeOut, testTimeout);
    jsmFn(testName, (done) => {
        const completerProvider = {
            provide: AsyncTestCompleter,
            useFactory: () => {
                // Mark the test as async when an AsyncTestCompleter is injected in an it()
                return new AsyncTestCompleter();
            }
        };
        testBed.configureTestingModule({ providers: [completerProvider] });
        runner.run();
        if (testFn.length === 0) {
            const retVal = testFn();
            if (isPromise(retVal)) {
                // Asynchronous test function that returns a Promise - wait for completion.
                retVal.then(done, done.fail);
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
    }, timeout);
}
export function it(expectation, assertion, timeout) {
    return _it(jsmIt, expectation, assertion, timeout);
}
export function fit(expectation, assertion, timeout) {
    return _it(jsmFIt, expectation, assertion, timeout);
}
export function xit(expectation, assertion, timeout) {
    return _it(jsmXIt, expectation, assertion, timeout);
}
export class SpyObject {
    constructor(type) {
        if (type) {
            for (const prop in type.prototype) {
                let m = null;
                try {
                    m = type.prototype[prop];
                }
                catch (e) {
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
    spy(name) {
        if (!this[name]) {
            this[name] = jasmine.createSpy(name);
        }
        return this[name];
    }
    prop(name, value) { this[name] = value; }
    static stub(object = null, config = null, overrides = null) {
        if (!(object instanceof SpyObject)) {
            overrides = config;
            config = object;
            object = new SpyObject();
        }
        const m = Object.assign({}, config, overrides);
        Object.keys(m).forEach(key => { object.spy(key).and.returnValue(m[key]); });
        return object;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ19pbnRlcm5hbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvdGVzdGluZ19pbnRlcm5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxJQUFJLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN0RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFOUMsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLFVBQVUsRUFBUyxNQUFNLFlBQVksQ0FBQztBQUU5QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRWxDLGNBQWMsVUFBVSxDQUFDO0FBQ3pCLGNBQWMsZ0JBQWdCLENBQUM7QUFFL0IsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFtQixDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBRW5ELE1BQU0sT0FBTyxHQUFRLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBRXZFLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBYSxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQ3JELE1BQU0sQ0FBQyxNQUFNLE1BQU0sR0FBMEMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUU1RSxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQ3pDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7QUFDckMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztBQUN2QyxNQUFNLFlBQVksR0FBRyxPQUFP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QUFDLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMvQztRQUNELE9BQVEsSUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRCxJQUFJLENBQUMsSUFBWSxFQUFFLEtBQVUsSUFBSyxJQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUUvRCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQWMsSUFBSSxFQUFFLFNBQWMsSUFBSSxFQUFFLFlBQWlCLElBQUk7UUFDdkUsSUFBSSxDQUFDLENBQUMsTUFBTSxZQUFZLFNBQVMsQ0FBQyxFQUFFO1lBQ2xDLFNBQVMsR0FBRyxNQUFNLENBQUM7WUFDbkIsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNoQixNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sQ0FBQyxxQkFBTyxNQUFNLEVBQUssU0FBUyxDQUFDLENBQUM7UUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RSxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7ybVpc1Byb21pc2UgYXMgaXNQcm9taXNlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICdAYW5ndWxhci9jb3JlL3NyYy91dGlsJztcblxuaW1wb3J0IHtBc3luY1Rlc3RDb21wbGV0ZXJ9IGZyb20gJy4vYXN5bmNfdGVzdF9jb21wbGV0ZXInO1xuaW1wb3J0IHtnZXRUZXN0QmVkLCBpbmplY3R9IGZyb20gJy4vdGVzdF9iZWQnO1xuXG5leHBvcnQge0FzeW5jVGVzdENvbXBsZXRlcn0gZnJvbSAnLi9hc3luY190ZXN0X2NvbXBsZXRlcic7XG5leHBvcnQge2luamVjdH0gZnJvbSAnLi90ZXN0X2JlZCc7XG5cbmV4cG9ydCAqIGZyb20gJy4vbG9nZ2VyJztcbmV4cG9ydCAqIGZyb20gJy4vbmdfem9uZV9tb2NrJztcblxuZXhwb3J0IGNvbnN0IHByb3h5OiBDbGFzc0RlY29yYXRvciA9ICh0OiBhbnkpID0+IHQ7XG5cbmNvbnN0IF9nbG9iYWwgPSA8YW55Pih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHdpbmRvdyk7XG5cbmV4cG9ydCBjb25zdCBhZnRlckVhY2g6IEZ1bmN0aW9uID0gX2dsb2JhbC5hZnRlckVhY2g7XG5leHBvcnQgY29uc3QgZXhwZWN0OiA8VD4oYWN0dWFsOiBUKSA9PiBqYXNtaW5lLk1hdGNoZXJzPFQ+ID0gX2dsb2JhbC5leHBlY3Q7XG5cbmNvbnN0IGpzbUJlZm9yZUVhY2ggPSBfZ2xvYmFsLmJlZm9yZUVhY2g7XG5jb25zdCBqc21EZXNjcmliZSA9IF9nbG9iYWwuZGVzY3JpYmU7XG5jb25zdCBqc21ERGVzY3JpYmUgPSBfZ2xvYmFsLmZkZXNjcmliZTtcbmNvbnN0IGpzbVhEZXNjcmliZSA9IF9nbG9iYWwueGRlc2NyaWJlO1xuY29uc3QganNtSXQgPSBfZ2xvYmFsLml0O1xuY29uc3QganNtRkl0ID0gX2dsb2JhbC5maXQ7XG5jb25zdCBqc21YSXQgPSBfZ2xvYmFsLnhpdDtcblxuY29uc3QgcnVubmVyU3RhY2s6IEJlZm9yZUVhY2hSdW5uZXJbXSA9IFtdO1xuamFzbWluZS5ERUZBVUxUX1RJTUVPVVRfSU5URVJWQUwgPSAzMDAwO1xuY29uc3QgZ2xvYmFsVGltZU91dCA9IGphc21pbmUuREVGQVVMVF9USU1FT1VUX0lOVEVSVkFMO1xuXG5jb25zdCB0ZXN0QmVkID0gZ2V0VGVzdEJlZCgpO1xuXG4vKipcbiAqIE1lY2hhbmlzbSB0byBydW4gYGJlZm9yZUVhY2goKWAgZnVuY3Rpb25zIG9mIEFuZ3VsYXIgdGVzdHMuXG4gKlxuICogTm90ZTogSmFzbWluZSBvd24gYGJlZm9yZUVhY2hgIGlzIHVzZWQgYnkgdGhpcyBsaWJyYXJ5IHRvIGhhbmRsZSBESSBwcm92aWRlcnMuXG4gKi9cbmNsYXNzIEJlZm9yZUVhY2hSdW5uZXIge1xuICBwcml2YXRlIF9mbnM6IEFycmF5PEZ1bmN0aW9uPiA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BhcmVudDogQmVmb3JlRWFjaFJ1bm5lcikge31cblxuICBiZWZvcmVFYWNoKGZuOiBGdW5jdGlvbik6IHZvaWQgeyB0aGlzLl9mbnMucHVzaChmbik7IH1cblxuICBydW4oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3BhcmVudCkgdGhpcy5fcGFyZW50LnJ1bigpO1xuICAgIHRoaXMuX2Zucy5mb3JFYWNoKChmbikgPT4geyBmbigpOyB9KTtcbiAgfVxufVxuXG4vLyBSZXNldCB0aGUgdGVzdCBwcm92aWRlcnMgYmVmb3JlIGVhY2ggdGVzdFxuanNtQmVmb3JlRWFjaCgoKSA9PiB7IHRlc3RCZWQucmVzZXRUZXN0aW5nTW9kdWxlKCk7IH0pO1xuXG5mdW5jdGlvbiBfZGVzY3JpYmUoanNtRm46IEZ1bmN0aW9uLCAuLi5hcmdzOiBhbnlbXSkge1xuICBjb25zdCBwYXJlbnRSdW5uZXIgPSBydW5uZXJTdGFjay5sZW5ndGggPT09IDAgPyBudWxsIDogcnVubmVyU3RhY2tbcnVubmVyU3RhY2subGVuZ3RoIC0gMV07XG4gIGNvbnN0IHJ1bm5lciA9IG5ldyBCZWZvcmVFYWNoUnVubmVyKHBhcmVudFJ1bm5lciAhKTtcbiAgcnVubmVyU3RhY2sucHVzaChydW5uZXIpO1xuICBjb25zdCBzdWl0ZSA9IGpzbUZuKC4uLmFyZ3MpO1xuICBydW5uZXJTdGFjay5wb3AoKTtcbiAgcmV0dXJuIHN1aXRlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVzY3JpYmUoLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgcmV0dXJuIF9kZXNjcmliZShqc21EZXNjcmliZSwgLi4uYXJncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZGVzY3JpYmUoLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgcmV0dXJuIF9kZXNjcmliZShqc21ERGVzY3JpYmUsIC4uLmFyZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24geGRlc2NyaWJlKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gIHJldHVybiBfZGVzY3JpYmUoanNtWERlc2NyaWJlLCAuLi5hcmdzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJlZm9yZUVhY2goZm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGlmIChydW5uZXJTdGFjay5sZW5ndGggPiAwKSB7XG4gICAgLy8gSW5zaWRlIGEgZGVzY3JpYmUgYmxvY2ssIGJlZm9yZUVhY2goKSB1c2VzIGEgQmVmb3JlRWFjaFJ1bm5lclxuICAgIHJ1bm5lclN0YWNrW3J1bm5lclN0YWNrLmxlbmd0aCAtIDFdLmJlZm9yZUVhY2goZm4pO1xuICB9IGVsc2Uge1xuICAgIC8vIFRvcCBsZXZlbCBiZWZvcmVFYWNoKCkgYXJlIGRlbGVnYXRlZCB0byBqYXNtaW5lXG4gICAganNtQmVmb3JlRWFjaChmbik7XG4gIH1cbn1cblxuLyoqXG4gKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IHByb3ZpZGVycyBkZWZpbmVkIGluIHRlc3RfaW5qZWN0b3IuanMuXG4gKlxuICogVGhlIGdpdmVuIGZ1bmN0aW9uIG11c3QgcmV0dXJuIGEgbGlzdCBvZiBESSBwcm92aWRlcnMuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiAgIGJlZm9yZUVhY2hQcm92aWRlcnMoKCkgPT4gW1xuICogICAgIHtwcm92aWRlOiBDb21waWxlciwgdXNlQ2xhc3M6IE1vY2tDb21waWxlcn0sXG4gKiAgICAge3Byb3ZpZGU6IFNvbWVUb2tlbiwgdXNlVmFsdWU6IG15VmFsdWV9LFxuICogICBdKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJlZm9yZUVhY2hQcm92aWRlcnMoZm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGpzbUJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGNvbnN0IHByb3ZpZGVycyA9IGZuKCk7XG4gICAgaWYgKCFwcm92aWRlcnMpIHJldHVybjtcbiAgICB0ZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUoe3Byb3ZpZGVyczogcHJvdmlkZXJzfSk7XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIF9pdChcbiAgICBqc21GbjogRnVuY3Rpb24sIHRlc3ROYW1lOiBzdHJpbmcsIHRlc3RGbjogKGRvbmU/OiBEb25lRm4pID0+IGFueSwgdGVzdFRpbWVvdXQgPSAwKTogdm9pZCB7XG4gIGlmIChydW5uZXJTdGFjay5sZW5ndGggPT0gMCkge1xuICAgIC8vIFRoaXMgbGVmdCBoZXJlIGludGVudGlvbmFsbHksIGFzIHdlIHNob3VsZCBuZXZlciBnZXQgaGVyZSwgYW5kIGl0IGFpZHMgZGVidWdnaW5nLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuICAgIGRlYnVnZ2VyO1xuICAgIHRocm93IG5ldyBFcnJvcignRW1wdHkgU3RhY2shJyk7XG4gIH1cbiAgY29uc3QgcnVubmVyID0gcnVubmVyU3RhY2tbcnVubmVyU3RhY2subGVuZ3RoIC0gMV07XG4gIGNvbnN0IHRpbWVvdXQgPSBNYXRoLm1heChnbG9iYWxUaW1lT3V0LCB0ZXN0VGltZW91dCk7XG5cbiAganNtRm4odGVzdE5hbWUsIChkb25lOiBEb25lRm4pID0+IHtcbiAgICBjb25zdCBjb21wbGV0ZXJQcm92aWRlciA9IHtcbiAgICAgIHByb3ZpZGU6IEFzeW5jVGVzdENvbXBsZXRlcixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgLy8gTWFyayB0aGUgdGVzdCBhcyBhc3luYyB3aGVuIGFuIEFzeW5jVGVzdENvbXBsZXRlciBpcyBpbmplY3RlZCBpbiBhbiBpdCgpXG4gICAgICAgIHJldHVybiBuZXcgQXN5bmNUZXN0Q29tcGxldGVyKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0ZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUoe3Byb3ZpZGVyczogW2NvbXBsZXRlclByb3ZpZGVyXX0pO1xuICAgIHJ1bm5lci5ydW4oKTtcblxuICAgIGlmICh0ZXN0Rm4ubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCByZXRWYWwgPSB0ZXN0Rm4oKTtcbiAgICAgIGlmIChpc1Byb21pc2UocmV0VmFsKSkge1xuICAgICAgICAvLyBBc3luY2hyb25vdXMgdGVzdCBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBQcm9taXNlIC0gd2FpdCBmb3IgY29tcGxldGlvbi5cbiAgICAgICAgcmV0VmFsLnRoZW4oZG9uZSwgZG9uZS5mYWlsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFN5bmNocm9ub3VzIHRlc3QgZnVuY3Rpb24gLSBjb21wbGV0ZSBpbW1lZGlhdGVseS5cbiAgICAgICAgZG9uZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBc3luY2hyb25vdXMgdGVzdCBmdW5jdGlvbiB0aGF0IHRha2VzIGluICdkb25lJyBwYXJhbWV0ZXIuXG4gICAgICB0ZXN0Rm4oZG9uZSk7XG4gICAgfVxuICB9LCB0aW1lb3V0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGl0KGV4cGVjdGF0aW9uOiBzdHJpbmcsIGFzc2VydGlvbjogKGRvbmU6IERvbmVGbikgPT4gYW55LCB0aW1lb3V0PzogbnVtYmVyKTogdm9pZCB7XG4gIHJldHVybiBfaXQoanNtSXQsIGV4cGVjdGF0aW9uLCBhc3NlcnRpb24sIHRpbWVvdXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZml0KGV4cGVjdGF0aW9uOiBzdHJpbmcsIGFzc2VydGlvbjogKGRvbmU6IERvbmVGbikgPT4gYW55LCB0aW1lb3V0PzogbnVtYmVyKTogdm9pZCB7XG4gIHJldHVybiBfaXQoanNtRkl0LCBleHBlY3RhdGlvbiwgYXNzZXJ0aW9uLCB0aW1lb3V0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHhpdChleHBlY3RhdGlvbjogc3RyaW5nLCBhc3NlcnRpb246IChkb25lOiBEb25lRm4pID0+IGFueSwgdGltZW91dD86IG51bWJlcik6IHZvaWQge1xuICByZXR1cm4gX2l0KGpzbVhJdCwgZXhwZWN0YXRpb24sIGFzc2VydGlvbiwgdGltZW91dCk7XG59XG5cbmV4cG9ydCBjbGFzcyBTcHlPYmplY3Qge1xuICBjb25zdHJ1Y3Rvcih0eXBlPzogYW55KSB7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGZvciAoY29uc3QgcHJvcCBpbiB0eXBlLnByb3RvdHlwZSkge1xuICAgICAgICBsZXQgbTogYW55ID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBtID0gdHlwZS5wcm90b3R5cGVbcHJvcF07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBBcyB3ZSBhcmUgY3JlYXRpbmcgc3B5cyBmb3IgYWJzdHJhY3QgY2xhc3NlcyxcbiAgICAgICAgICAvLyB0aGVzZSBjbGFzc2VzIG1pZ2h0IGhhdmUgZ2V0dGVycyB0aGF0IHRocm93IHdoZW4gdGhleSBhcmUgYWNjZXNzZWQuXG4gICAgICAgICAgLy8gQXMgd2UgYXJlIG9ubHkgYXV0byBjcmVhdGluZyBzcHlzIGZvciBtZXRob2RzLCB0aGlzXG4gICAgICAgICAgLy8gc2hvdWxkIG5vdCBtYXR0ZXIuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBtID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdGhpcy5zcHkocHJvcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzcHkobmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKCEodGhpcyBhcyBhbnkpW25hbWVdKSB7XG4gICAgICAodGhpcyBhcyBhbnkpW25hbWVdID0gamFzbWluZS5jcmVhdGVTcHkobmFtZSk7XG4gICAgfVxuICAgIHJldHVybiAodGhpcyBhcyBhbnkpW25hbWVdO1xuICB9XG5cbiAgcHJvcChuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHsgKHRoaXMgYXMgYW55KVtuYW1lXSA9IHZhbHVlOyB9XG5cbiAgc3RhdGljIHN0dWIob2JqZWN0OiBhbnkgPSBudWxsLCBjb25maWc6IGFueSA9IG51bGwsIG92ZXJyaWRlczogYW55ID0gbnVsbCkge1xuICAgIGlmICghKG9iamVjdCBpbnN0YW5jZW9mIFNweU9iamVjdCkpIHtcbiAgICAgIG92ZXJyaWRlcyA9IGNvbmZpZztcbiAgICAgIGNvbmZpZyA9IG9iamVjdDtcbiAgICAgIG9iamVjdCA9IG5ldyBTcHlPYmplY3QoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtID0gey4uLmNvbmZpZywgLi4ub3ZlcnJpZGVzfTtcbiAgICBPYmplY3Qua2V5cyhtKS5mb3JFYWNoKGtleSA9PiB7IG9iamVjdC5zcHkoa2V5KS5hbmQucmV0dXJuVmFsdWUobVtrZXldKTsgfSk7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxufVxuIl19