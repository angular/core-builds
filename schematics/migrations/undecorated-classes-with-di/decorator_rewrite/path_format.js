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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/path_format", ["require", "exports", "path"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPosixPath = void 0;
    const path_1 = require("path");
    /** Normalizes the specified path to conform with the posix path format. */
    function getPosixPath(pathString) {
        const normalized = path_1.normalize(pathString).replace(/\\/g, '/');
        if (!normalized.startsWith('.')) {
            return `./${normalized}`;
        }
        return normalized;
    }
    exports.getPosixPath = getPosixPath;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aF9mb3JtYXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvZGVjb3JhdG9yX3Jld3JpdGUvcGF0aF9mb3JtYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQStCO0lBRS9CLDJFQUEyRTtJQUMzRSxTQUFnQixZQUFZLENBQUMsVUFBa0I7UUFDN0MsTUFBTSxVQUFVLEdBQUcsZ0JBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQy9CLE9BQU8sS0FBSyxVQUFVLEVBQUUsQ0FBQztTQUMxQjtRQUNELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFORCxvQ0FNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtub3JtYWxpemV9IGZyb20gJ3BhdGgnO1xuXG4vKiogTm9ybWFsaXplcyB0aGUgc3BlY2lmaWVkIHBhdGggdG8gY29uZm9ybSB3aXRoIHRoZSBwb3NpeCBwYXRoIGZvcm1hdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQb3NpeFBhdGgocGF0aFN0cmluZzogc3RyaW5nKSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemUocGF0aFN0cmluZykucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICBpZiAoIW5vcm1hbGl6ZWQuc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgcmV0dXJuIGAuLyR7bm9ybWFsaXplZH1gO1xuICB9XG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuIl19