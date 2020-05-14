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
        define("@angular/core/schematics/utils/typescript/parse_tsconfig", ["require", "exports", "path", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseTsconfigFile = void 0;
    const path = require("path");
    const ts = require("typescript");
    function parseTsconfigFile(tsconfigPath, basePath) {
        const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
        const parseConfigHost = {
            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
            fileExists: ts.sys.fileExists,
            readDirectory: ts.sys.readDirectory,
            readFile: ts.sys.readFile,
        };
        // Throw if incorrect arguments are passed to this function. Passing relative base paths
        // results in root directories not being resolved and in later type checking runtime errors.
        // More details can be found here: https://github.com/microsoft/TypeScript/issues/37731.
        if (!path.isAbsolute(basePath)) {
            throw Error('Unexpected relative base path has been specified.');
        }
        return ts.parseJsonConfigFileContent(config, parseConfigHost, basePath, {});
    }
    exports.parseTsconfigFile = parseTsconfigFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VfdHNjb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCw2QkFBNkI7SUFDN0IsaUNBQWlDO0lBRWpDLFNBQWdCLGlCQUFpQixDQUFDLFlBQW9CLEVBQUUsUUFBZ0I7UUFDdEUsTUFBTSxFQUFDLE1BQU0sRUFBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEUsTUFBTSxlQUFlLEdBQUc7WUFDdEIseUJBQXlCLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyx5QkFBeUI7WUFDM0QsVUFBVSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVTtZQUM3QixhQUFhLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhO1lBQ25DLFFBQVEsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVE7U0FDMUIsQ0FBQztRQUVGLHdGQUF3RjtRQUN4Riw0RkFBNEY7UUFDNUYsd0ZBQXdGO1FBQ3hGLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzlCLE1BQU0sS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7U0FDbEU7UUFFRCxPQUFPLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBakJELDhDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUc2NvbmZpZ0ZpbGUodHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpOiB0cy5QYXJzZWRDb21tYW5kTGluZSB7XG4gIGNvbnN0IHtjb25maWd9ID0gdHMucmVhZENvbmZpZ0ZpbGUodHNjb25maWdQYXRoLCB0cy5zeXMucmVhZEZpbGUpO1xuICBjb25zdCBwYXJzZUNvbmZpZ0hvc3QgPSB7XG4gICAgdXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lczogdHMuc3lzLnVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXMsXG4gICAgZmlsZUV4aXN0czogdHMuc3lzLmZpbGVFeGlzdHMsXG4gICAgcmVhZERpcmVjdG9yeTogdHMuc3lzLnJlYWREaXJlY3RvcnksXG4gICAgcmVhZEZpbGU6IHRzLnN5cy5yZWFkRmlsZSxcbiAgfTtcblxuICAvLyBUaHJvdyBpZiBpbmNvcnJlY3QgYXJndW1lbnRzIGFyZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbi4gUGFzc2luZyByZWxhdGl2ZSBiYXNlIHBhdGhzXG4gIC8vIHJlc3VsdHMgaW4gcm9vdCBkaXJlY3RvcmllcyBub3QgYmVpbmcgcmVzb2x2ZWQgYW5kIGluIGxhdGVyIHR5cGUgY2hlY2tpbmcgcnVudGltZSBlcnJvcnMuXG4gIC8vIE1vcmUgZGV0YWlscyBjYW4gYmUgZm91bmQgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8zNzczMS5cbiAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoYmFzZVBhdGgpKSB7XG4gICAgdGhyb3cgRXJyb3IoJ1VuZXhwZWN0ZWQgcmVsYXRpdmUgYmFzZSBwYXRoIGhhcyBiZWVuIHNwZWNpZmllZC4nKTtcbiAgfVxuXG4gIHJldHVybiB0cy5wYXJzZUpzb25Db25maWdGaWxlQ29udGVudChjb25maWcsIHBhcnNlQ29uZmlnSG9zdCwgYmFzZVBhdGgsIHt9KTtcbn1cbiJdfQ==