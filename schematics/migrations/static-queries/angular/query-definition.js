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
        define("@angular/core/schematics/migrations/static-queries/angular/query-definition", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnktZGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQU1ILHlEQUF5RDtJQUN6RCxJQUFZLFdBR1g7SUFIRCxXQUFZLFdBQVc7UUFDckIsaURBQU0sQ0FBQTtRQUNOLG1EQUFPLENBQUE7SUFDVCxDQUFDLEVBSFcsV0FBVyxHQUFYLG1CQUFXLEtBQVgsbUJBQVcsUUFHdEI7SUFFRCw2QkFBNkI7SUFDN0IsSUFBWSxTQUdYO0lBSEQsV0FBWSxTQUFTO1FBQ25CLG1EQUFTLENBQUE7UUFDVCx5REFBWSxDQUFBO0lBQ2QsQ0FBQyxFQUhXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBR3BCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7TmdEZWNvcmF0b3J9IGZyb20gJy4vZGVjb3JhdG9ycyc7XG5cblxuLyoqIFRpbWluZyBvZiBhIGdpdmVuIHF1ZXJ5LiBFaXRoZXIgc3RhdGljIG9yIGR5bmFtaWMuICovXG5leHBvcnQgZW51bSBRdWVyeVRpbWluZyB7XG4gIFNUQVRJQyxcbiAgRFlOQU1JQ1xufVxuXG4vKiogVHlwZSBvZiBhIGdpdmVuIHF1ZXJ5LiAqL1xuZXhwb3J0IGVudW0gUXVlcnlUeXBlIHtcbiAgVmlld0NoaWxkLFxuICBDb250ZW50Q2hpbGRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOZ1F1ZXJ5RGVmaW5pdGlvbiB7XG4gIC8qKiBUeXBlIG9mIHRoZSBxdWVyeSBkZWZpbml0aW9uLiAqL1xuICB0eXBlOiBRdWVyeVR5cGU7XG5cbiAgLyoqIFByb3BlcnR5IHRoYXQgZGVjbGFyZXMgdGhlIHF1ZXJ5LiAqL1xuICBwcm9wZXJ0eTogdHMuUHJvcGVydHlEZWNsYXJhdGlvbjtcblxuICAvKiogRGVjb3JhdG9yIHRoYXQgZGVjbGFyZXMgdGhpcyBhcyBhIHF1ZXJ5LiAqL1xuICBkZWNvcmF0b3I6IE5nRGVjb3JhdG9yO1xuXG4gIC8qKiBDbGFzcyBkZWNsYXJhdGlvbiB0aGF0IGhvbGRzIHRoaXMgcXVlcnkuICovXG4gIGNvbnRhaW5lcjogdHMuQ2xhc3NEZWNsYXJhdGlvbjtcbn1cbiJdfQ==