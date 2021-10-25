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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/path_format", ["require", "exports", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPosixPath = void 0;
    const path_1 = require("path");
    /** Normalizes the specified path to conform with the posix path format. */
    function getPosixPath(pathString) {
        const normalized = (0, path_1.normalize)(pathString).replace(/\\/g, '/');
        if (!normalized.startsWith('.')) {
            return `./${normalized}`;
        }
        return normalized;
    }
    exports.getPosixPath = getPosixPath;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aF9mb3JtYXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvZGVjb3JhdG9yX3Jld3JpdGUvcGF0aF9mb3JtYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQStCO0lBRS9CLDJFQUEyRTtJQUMzRSxTQUFnQixZQUFZLENBQUMsVUFBa0I7UUFDN0MsTUFBTSxVQUFVLEdBQUcsSUFBQSxnQkFBUyxFQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDL0IsT0FBTyxLQUFLLFVBQVUsRUFBRSxDQUFDO1NBQzFCO1FBQ0QsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQU5ELG9DQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bm9ybWFsaXplfSBmcm9tICdwYXRoJztcblxuLyoqIE5vcm1hbGl6ZXMgdGhlIHNwZWNpZmllZCBwYXRoIHRvIGNvbmZvcm0gd2l0aCB0aGUgcG9zaXggcGF0aCBmb3JtYXQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9zaXhQYXRoKHBhdGhTdHJpbmc6IHN0cmluZykge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplKHBhdGhTdHJpbmcpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgaWYgKCFub3JtYWxpemVkLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgIHJldHVybiBgLi8ke25vcm1hbGl6ZWR9YDtcbiAgfVxuICByZXR1cm4gbm9ybWFsaXplZDtcbn1cbiJdfQ==