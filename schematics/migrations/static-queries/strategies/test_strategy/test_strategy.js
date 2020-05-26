/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/static-queries/strategies/test_strategy/test_strategy", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueryTestStrategy = void 0;
    /**
     * Query timing strategy that is used for queries used within test files. The query
     * timing is not analyzed for test files as the template strategy cannot work within
     * spec files (due to missing component modules) and the usage strategy is not capable
     * of detecting the timing of queries based on how they are used in tests.
     */
    class QueryTestStrategy {
        setup() { }
        /**
         * Detects the timing for a given query. For queries within tests, we always
         * add a TODO and print a message saying that the timing can't be detected for tests.
         */
        detectTiming(query) {
            return { timing: null, message: 'Timing within tests cannot be detected.' };
        }
    }
    exports.QueryTestStrategy = QueryTestStrategy;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9zdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdGVzdF9zdHJhdGVneS90ZXN0X3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUtIOzs7OztPQUtHO0lBQ0gsTUFBYSxpQkFBaUI7UUFDNUIsS0FBSyxLQUFJLENBQUM7UUFFVjs7O1dBR0c7UUFDSCxZQUFZLENBQUMsS0FBd0I7WUFDbkMsT0FBTyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLHlDQUF5QyxFQUFDLENBQUM7UUFDNUUsQ0FBQztLQUNGO0lBVkQsOENBVUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb259IGZyb20gJy4uLy4uL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbic7XG5pbXBvcnQge1RpbWluZ1Jlc3VsdCwgVGltaW5nU3RyYXRlZ3l9IGZyb20gJy4uL3RpbWluZy1zdHJhdGVneSc7XG5cbi8qKlxuICogUXVlcnkgdGltaW5nIHN0cmF0ZWd5IHRoYXQgaXMgdXNlZCBmb3IgcXVlcmllcyB1c2VkIHdpdGhpbiB0ZXN0IGZpbGVzLiBUaGUgcXVlcnlcbiAqIHRpbWluZyBpcyBub3QgYW5hbHl6ZWQgZm9yIHRlc3QgZmlsZXMgYXMgdGhlIHRlbXBsYXRlIHN0cmF0ZWd5IGNhbm5vdCB3b3JrIHdpdGhpblxuICogc3BlYyBmaWxlcyAoZHVlIHRvIG1pc3NpbmcgY29tcG9uZW50IG1vZHVsZXMpIGFuZCB0aGUgdXNhZ2Ugc3RyYXRlZ3kgaXMgbm90IGNhcGFibGVcbiAqIG9mIGRldGVjdGluZyB0aGUgdGltaW5nIG9mIHF1ZXJpZXMgYmFzZWQgb24gaG93IHRoZXkgYXJlIHVzZWQgaW4gdGVzdHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBRdWVyeVRlc3RTdHJhdGVneSBpbXBsZW1lbnRzIFRpbWluZ1N0cmF0ZWd5IHtcbiAgc2V0dXAoKSB7fVxuXG4gIC8qKlxuICAgKiBEZXRlY3RzIHRoZSB0aW1pbmcgZm9yIGEgZ2l2ZW4gcXVlcnkuIEZvciBxdWVyaWVzIHdpdGhpbiB0ZXN0cywgd2UgYWx3YXlzXG4gICAqIGFkZCBhIFRPRE8gYW5kIHByaW50IGEgbWVzc2FnZSBzYXlpbmcgdGhhdCB0aGUgdGltaW5nIGNhbid0IGJlIGRldGVjdGVkIGZvciB0ZXN0cy5cbiAgICovXG4gIGRldGVjdFRpbWluZyhxdWVyeTogTmdRdWVyeURlZmluaXRpb24pOiBUaW1pbmdSZXN1bHQge1xuICAgIHJldHVybiB7dGltaW5nOiBudWxsLCBtZXNzYWdlOiAnVGltaW5nIHdpdGhpbiB0ZXN0cyBjYW5ub3QgYmUgZGV0ZWN0ZWQuJ307XG4gIH1cbn1cbiJdfQ==