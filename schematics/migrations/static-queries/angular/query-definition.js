/**
 * @license
 * Copyright Google LLC All Rights Reserved.
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
        define("@angular/core/schematics/migrations/static-queries/angular/query-definition", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QueryType = exports.QueryTiming = void 0;
    /** Timing of a given query. Either static or dynamic. */
    var QueryTiming;
    (function (QueryTiming) {
        QueryTiming[QueryTiming["STATIC"] = 0] = "STATIC";
        QueryTiming[QueryTiming["DYNAMIC"] = 1] = "DYNAMIC";
    })(QueryTiming = exports.QueryTiming || (exports.QueryTiming = {}));
    /** Type of a given query. */
    var QueryType;
    (function (QueryType) {
        QueryType[QueryType["ViewChild"] = 0] = "ViewChild";
        QueryType[QueryType["ContentChild"] = 1] = "ContentChild";
    })(QueryType = exports.QueryType || (exports.QueryType = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnktZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFLSCx5REFBeUQ7SUFDekQsSUFBWSxXQUdYO0lBSEQsV0FBWSxXQUFXO1FBQ3JCLGlEQUFNLENBQUE7UUFDTixtREFBTyxDQUFBO0lBQ1QsQ0FBQyxFQUhXLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBR3RCO0lBRUQsNkJBQTZCO0lBQzdCLElBQVksU0FHWDtJQUhELFdBQVksU0FBUztRQUNuQixtREFBUyxDQUFBO1FBQ1QseURBQVksQ0FBQTtJQUNkLENBQUMsRUFIVyxTQUFTLEdBQVQsaUJBQVMsS0FBVCxpQkFBUyxRQUdwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge05nRGVjb3JhdG9yfSBmcm9tICcuLi8uLi8uLi91dGlscy9uZ19kZWNvcmF0b3JzJztcblxuLyoqIFRpbWluZyBvZiBhIGdpdmVuIHF1ZXJ5LiBFaXRoZXIgc3RhdGljIG9yIGR5bmFtaWMuICovXG5leHBvcnQgZW51bSBRdWVyeVRpbWluZyB7XG4gIFNUQVRJQyxcbiAgRFlOQU1JQyxcbn1cblxuLyoqIFR5cGUgb2YgYSBnaXZlbiBxdWVyeS4gKi9cbmV4cG9ydCBlbnVtIFF1ZXJ5VHlwZSB7XG4gIFZpZXdDaGlsZCxcbiAgQ29udGVudENoaWxkXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmdRdWVyeURlZmluaXRpb24ge1xuICAvKiogTmFtZSBvZiB0aGUgcXVlcnkuIFNldCB0byBcIm51bGxcIiBpbiBjYXNlIHRoZSBxdWVyeSBuYW1lIGlzIG5vdCBzdGF0aWNhbGx5IGFuYWx5emFibGUuICovXG4gIG5hbWU6IHN0cmluZ3xudWxsO1xuICAvKiogVHlwZSBvZiB0aGUgcXVlcnkgZGVmaW5pdGlvbi4gKi9cbiAgdHlwZTogUXVlcnlUeXBlO1xuICAvKiogTm9kZSB0aGF0IGRlY2xhcmVzIHRoaXMgcXVlcnkuICovXG4gIG5vZGU6IHRzLk5vZGU7XG4gIC8qKlxuICAgKiBQcm9wZXJ0eSBkZWNsYXJhdGlvbiB0aGF0IHJlZmVycyB0byB0aGUgcXVlcnkgdmFsdWUuIEZvciBhY2Nlc3NvcnMgdGhlcmVcbiAgICogaXMgbm8gcHJvcGVydHkgdGhhdCBpcyBndWFyYW50ZWVkIHRvIGFjY2VzcyB0aGUgcXVlcnkgdmFsdWUuXG4gICAqL1xuICBwcm9wZXJ0eTogdHMuUHJvcGVydHlEZWNsYXJhdGlvbnxudWxsO1xuICAvKiogRGVjb3JhdG9yIHRoYXQgZGVjbGFyZXMgdGhpcyBhcyBhIHF1ZXJ5LiAqL1xuICBkZWNvcmF0b3I6IE5nRGVjb3JhdG9yO1xuICAvKiogQ2xhc3MgZGVjbGFyYXRpb24gdGhhdCBob2xkcyB0aGlzIHF1ZXJ5LiAqL1xuICBjb250YWluZXI6IHRzLkNsYXNzRGVjbGFyYXRpb247XG59XG4iXX0=