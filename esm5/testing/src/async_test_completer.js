/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Injectable completer that allows signaling completion of an asynchronous test. Used internally.
 */
var /**
 * Injectable completer that allows signaling completion of an asynchronous test. Used internally.
 */
AsyncTestCompleter = /** @class */ (function () {
    function AsyncTestCompleter() {
        var _this = this;
        this._promise = new Promise(function (res, rej) {
            _this._resolve = res;
            _this._reject = rej;
        });
    }
    AsyncTestCompleter.prototype.done = function (value) { this._resolve(value); };
    AsyncTestCompleter.prototype.fail = function (error, stackTrace) { this._reject(error); };
    Object.defineProperty(AsyncTestCompleter.prototype, "promise", {
        get: function () { return this._promise; },
        enumerable: true,
        configurable: true
    });
    return AsyncTestCompleter;
}());
/**
 * Injectable completer that allows signaling completion of an asynchronous test. Used internally.
 */
export { AsyncTestCompleter };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNfdGVzdF9jb21wbGV0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2FzeW5jX3Rlc3RfY29tcGxldGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFXQTs7O0FBQUE7Ozt3QkFHbUMsSUFBSSxPQUFPLENBQUMsVUFBQyxHQUFHLEVBQUUsR0FBRztZQUNwRCxLQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQztZQUNwQixLQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztTQUNwQixDQUFDOztJQUNGLGlDQUFJLEdBQUosVUFBSyxLQUFXLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0lBRTNDLGlDQUFJLEdBQUosVUFBSyxLQUFXLEVBQUUsVUFBbUIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7SUFFL0Qsc0JBQUksdUNBQU87YUFBWCxjQUE4QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTs7O09BQUE7NkJBdEJ2RDtJQXVCQyxDQUFBOzs7O0FBWkQsOEJBWUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogSW5qZWN0YWJsZSBjb21wbGV0ZXIgdGhhdCBhbGxvd3Mgc2lnbmFsaW5nIGNvbXBsZXRpb24gb2YgYW4gYXN5bmNocm9ub3VzIHRlc3QuIFVzZWQgaW50ZXJuYWxseS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFzeW5jVGVzdENvbXBsZXRlciB7XG4gIHByaXZhdGUgX3Jlc29sdmU6IChyZXN1bHQ6IGFueSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBfcmVqZWN0OiAoZXJyOiBhbnkpID0+IHZvaWQ7XG4gIHByaXZhdGUgX3Byb21pc2U6IFByb21pc2U8YW55PiA9IG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgIHRoaXMuX3Jlc29sdmUgPSByZXM7XG4gICAgdGhpcy5fcmVqZWN0ID0gcmVqO1xuICB9KTtcbiAgZG9uZSh2YWx1ZT86IGFueSkgeyB0aGlzLl9yZXNvbHZlKHZhbHVlKTsgfVxuXG4gIGZhaWwoZXJyb3I/OiBhbnksIHN0YWNrVHJhY2U/OiBzdHJpbmcpIHsgdGhpcy5fcmVqZWN0KGVycm9yKTsgfVxuXG4gIGdldCBwcm9taXNlKCk6IFByb21pc2U8YW55PiB7IHJldHVybiB0aGlzLl9wcm9taXNlOyB9XG59XG4iXX0=