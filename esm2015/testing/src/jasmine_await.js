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
 * @param {?} fn
 * @return {?}
 */
export function jasmineAwait(fn) {
    return function (done) {
        fn().then(done, done.fail);
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamFzbWluZV9hd2FpdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvamFzbWluZV9hd2FpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkEsTUFBTSx1QkFBdUIsRUFBc0I7SUFFakQsT0FBTyxVQUFTLElBQTJEO1FBQ3pFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzVCLENBQUM7Q0FDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBDb252ZXJ0cyBhbiBgYXN5bmNgIGZ1bmN0aW9uLCB3aXRoIGBhd2FpdGAsIGludG8gYSBmdW5jdGlvbiB3aGljaCBpcyBjb21wYXRpYmxlIHdpdGggSmFzbWluZSB0ZXN0XG4gKiBmcmFtZXdvcmsuXG4gKlxuICogRm9yIGFzeW5jaHJvbm91cyBmdW5jdGlvbiBibG9ja3MsIEphc21pbmUgZXhwZWN0cyBgaXRgIChhbmQgZnJpZW5kcykgdG8gdGFrZSBhIGZ1bmN0aW9uIHdoaWNoXG4gKiB0YWtlcyBhIGBkb25lYCBjYWxsYmFjay4gKEphc21pbmUgZG9lcyBub3QgdW5kZXJzdGFuZCBmdW5jdGlvbnMgd2hpY2ggcmV0dXJuIGBQcm9taXNlYC4pIFRoZVxuICogYGphc21pbmVBd2FpdCgpYCB3cmFwcGVyIGNvbnZlcnRzIHRoZSB0ZXN0IGZ1bmN0aW9uIHJldHVybmluZyBgUHJvbWlzZWAgaW50byBhIGZ1bmN0aW9uIHdoaWNoXG4gKiBKYXNtaW5lIHVuZGVyc3RhbmRzLlxuICpcbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiBpdCgnLi4uJywgamFzbWluZUF3YWl0KGFzeW5jKCkgPT4ge1xuICogICBkb1NvbWV0aGluZygpO1xuICogICBhd2FpdCBhc3luY0ZuKCk7XG4gKiAgIGRvU29tZXRoaW5nQWZ0ZXIoKTtcbiAqIH0pKTtcbiAqIGBgYFxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGphc21pbmVBd2FpdChmbjogKCkgPT4gUHJvbWlzZTxhbnk+KTpcbiAgICAoZG9uZTogeygpOiB2b2lkOyBmYWlsOiAobWVzc2FnZT86IEVycm9yIHwgc3RyaW5nKSA9PiB2b2lkO30pID0+IHZvaWQge1xuICByZXR1cm4gZnVuY3Rpb24oZG9uZTogeygpOiB2b2lkOyBmYWlsOiAobWVzc2FnZT86IEVycm9yIHwgc3RyaW5nKSA9PiB2b2lkO30pIHtcbiAgICBmbigpLnRoZW4oZG9uZSwgZG9uZS5mYWlsKTtcbiAgfTtcbn1cbiJdfQ==