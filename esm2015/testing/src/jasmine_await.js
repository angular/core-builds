/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Converts an `async` function, with `await`, into a function which is compatible with Jasmine test
 * framework.
 *
 * For asynchronous function blocks, Jasmine expects `it` (and friends) to take a function which
 * takes a `done` callback. (Jasmine does not understand functions which return `Promise`.) The
 * `jasmineAwait()` wrapper converts the test function returning `Promise` into a function which
 * Jasmine understands.
 *
 *
 * Example:
 * ```
 * it('...', jasmineAwait(async() => {
 *   doSomething();
 *   await asyncFn();
 *   doSomethingAfter();
 * }));
 * ```
 *
 */
export function jasmineAwait(fn) {
    return function (done) {
        fn().then(done, done.fail);
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamFzbWluZV9hd2FpdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvamFzbWluZV9hd2FpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sdUJBQXVCLEVBQXNCO0lBRWpELE9BQU8sVUFBUyxJQUEyRDtRQUN6RSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIENvbnZlcnRzIGFuIGBhc3luY2AgZnVuY3Rpb24sIHdpdGggYGF3YWl0YCwgaW50byBhIGZ1bmN0aW9uIHdoaWNoIGlzIGNvbXBhdGlibGUgd2l0aCBKYXNtaW5lIHRlc3RcbiAqIGZyYW1ld29yay5cbiAqXG4gKiBGb3IgYXN5bmNocm9ub3VzIGZ1bmN0aW9uIGJsb2NrcywgSmFzbWluZSBleHBlY3RzIGBpdGAgKGFuZCBmcmllbmRzKSB0byB0YWtlIGEgZnVuY3Rpb24gd2hpY2hcbiAqIHRha2VzIGEgYGRvbmVgIGNhbGxiYWNrLiAoSmFzbWluZSBkb2VzIG5vdCB1bmRlcnN0YW5kIGZ1bmN0aW9ucyB3aGljaCByZXR1cm4gYFByb21pc2VgLikgVGhlXG4gKiBgamFzbWluZUF3YWl0KClgIHdyYXBwZXIgY29udmVydHMgdGhlIHRlc3QgZnVuY3Rpb24gcmV0dXJuaW5nIGBQcm9taXNlYCBpbnRvIGEgZnVuY3Rpb24gd2hpY2hcbiAqIEphc21pbmUgdW5kZXJzdGFuZHMuXG4gKlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIGl0KCcuLi4nLCBqYXNtaW5lQXdhaXQoYXN5bmMoKSA9PiB7XG4gKiAgIGRvU29tZXRoaW5nKCk7XG4gKiAgIGF3YWl0IGFzeW5jRm4oKTtcbiAqICAgZG9Tb21ldGhpbmdBZnRlcigpO1xuICogfSkpO1xuICogYGBgXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gamFzbWluZUF3YWl0KGZuOiAoKSA9PiBQcm9taXNlPGFueT4pOlxuICAgIChkb25lOiB7KCk6IHZvaWQ7IGZhaWw6IChtZXNzYWdlPzogRXJyb3IgfCBzdHJpbmcpID0+IHZvaWQ7fSkgPT4gdm9pZCB7XG4gIHJldHVybiBmdW5jdGlvbihkb25lOiB7KCk6IHZvaWQ7IGZhaWw6IChtZXNzYWdlPzogRXJyb3IgfCBzdHJpbmcpID0+IHZvaWQ7fSkge1xuICAgIGZuKCkudGhlbihkb25lLCBkb25lLmZhaWwpO1xuICB9O1xufVxuIl19