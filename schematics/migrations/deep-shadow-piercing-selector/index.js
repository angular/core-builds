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
        define("@angular/core/schematics/migrations/deep-shadow-piercing-selector", ["require", "exports", "@angular-devkit/core"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    const VALID_EXTENSIONS = ['.scss', '.sass', '.css', '.styl', '.less', '.ts'];
    function* visitFiles(directory) {
        for (const path of directory.subfiles) {
            const extension = (0, core_1.extname)(path);
            if (VALID_EXTENSIONS.includes(extension)) {
                yield (0, core_1.join)(directory.path, path);
            }
        }
        for (const path of directory.subdirs) {
            if (path === 'node_modules' || path.startsWith('.') || path === 'dist') {
                continue;
            }
            yield* visitFiles(directory.dir(path));
        }
    }
    function default_1() {
        return (tree) => {
            var _a;
            // Visit all files in an Angular workspace monorepo.
            for (const file of visitFiles(tree.root)) {
                const content = (_a = tree.read(file)) === null || _a === void 0 ? void 0 : _a.toString();
                if (content === null || content === void 0 ? void 0 : content.includes('/deep/ ')) {
                    tree.overwrite(file, content.replace(/\/deep\/ /g, '::ng-deep '));
                }
            }
        };
    }
    exports.default = default_1;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9kZWVwLXNoYWRvdy1waWVyY2luZy1zZWxlY3Rvci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtDQUFtRDtJQUduRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUU3RSxRQUFRLENBQUMsQ0FBQyxVQUFVLENBQUMsU0FBbUI7UUFDdEMsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFO1lBQ3JDLE1BQU0sU0FBUyxHQUFHLElBQUEsY0FBTyxFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLElBQUksZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUN4QyxNQUFNLElBQUEsV0FBSSxFQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDbEM7U0FDRjtRQUVELEtBQUssTUFBTSxJQUFJLElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRTtZQUNwQyxJQUFJLElBQUksS0FBSyxjQUFjLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEtBQUssTUFBTSxFQUFFO2dCQUN0RSxTQUFTO2FBQ1Y7WUFFRCxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ3hDO0lBQ0gsQ0FBQztJQUVEO1FBQ0UsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFOztZQUNkLG9EQUFvRDtZQUNwRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3hDLE1BQU0sT0FBTyxHQUFHLE1BQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsMENBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQzVDLElBQUksT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztpQkFDbkU7YUFDRjtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFWRCw0QkFVQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2V4dG5hbWUsIGpvaW59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7RGlyRW50cnksIFJ1bGV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcblxuY29uc3QgVkFMSURfRVhURU5TSU9OUyA9IFsnLnNjc3MnLCAnLnNhc3MnLCAnLmNzcycsICcuc3R5bCcsICcubGVzcycsICcudHMnXTtcblxuZnVuY3Rpb24qIHZpc2l0RmlsZXMoZGlyZWN0b3J5OiBEaXJFbnRyeSk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gIGZvciAoY29uc3QgcGF0aCBvZiBkaXJlY3Rvcnkuc3ViZmlsZXMpIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBleHRuYW1lKHBhdGgpO1xuICAgIGlmIChWQUxJRF9FWFRFTlNJT05TLmluY2x1ZGVzKGV4dGVuc2lvbikpIHtcbiAgICAgIHlpZWxkIGpvaW4oZGlyZWN0b3J5LnBhdGgsIHBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgcGF0aCBvZiBkaXJlY3Rvcnkuc3ViZGlycykge1xuICAgIGlmIChwYXRoID09PSAnbm9kZV9tb2R1bGVzJyB8fCBwYXRoLnN0YXJ0c1dpdGgoJy4nKSB8fCBwYXRoID09PSAnZGlzdCcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHlpZWxkKiB2aXNpdEZpbGVzKGRpcmVjdG9yeS5kaXIocGF0aCkpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWUpID0+IHtcbiAgICAvLyBWaXNpdCBhbGwgZmlsZXMgaW4gYW4gQW5ndWxhciB3b3Jrc3BhY2UgbW9ub3JlcG8uXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIHZpc2l0RmlsZXModHJlZS5yb290KSkge1xuICAgICAgY29uc3QgY29udGVudCA9IHRyZWUucmVhZChmaWxlKT8udG9TdHJpbmcoKTtcbiAgICAgIGlmIChjb250ZW50Py5pbmNsdWRlcygnL2RlZXAvICcpKSB7XG4gICAgICAgIHRyZWUub3ZlcndyaXRlKGZpbGUsIGNvbnRlbnQucmVwbGFjZSgvXFwvZGVlcFxcLyAvZywgJzo6bmctZGVlcCAnKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuIl19