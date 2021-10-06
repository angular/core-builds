/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    const path = __importStar(require("path"));
    const typescript_1 = __importDefault(require("typescript"));
    function parseTsconfigFile(tsconfigPath, basePath) {
        const { config } = typescript_1.default.readConfigFile(tsconfigPath, typescript_1.default.sys.readFile);
        const parseConfigHost = {
            useCaseSensitiveFileNames: typescript_1.default.sys.useCaseSensitiveFileNames,
            fileExists: typescript_1.default.sys.fileExists,
            readDirectory: typescript_1.default.sys.readDirectory,
            readFile: typescript_1.default.sys.readFile,
        };
        // Throw if incorrect arguments are passed to this function. Passing relative base paths
        // results in root directories not being resolved and in later type checking runtime errors.
        // More details can be found here: https://github.com/microsoft/TypeScript/issues/37731.
        if (!path.isAbsolute(basePath)) {
            throw Error('Unexpected relative base path has been specified.');
        }
        return typescript_1.default.parseJsonConfigFileContent(config, parseConfigHost, basePath, {});
    }
    exports.parseTsconfigFile = parseTsconfigFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VfdHNjb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsMkNBQTZCO0lBQzdCLDREQUE0QjtJQUU1QixTQUFnQixpQkFBaUIsQ0FBQyxZQUFvQixFQUFFLFFBQWdCO1FBQ3RFLE1BQU0sRUFBQyxNQUFNLEVBQUMsR0FBRyxvQkFBRSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsb0JBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEUsTUFBTSxlQUFlLEdBQUc7WUFDdEIseUJBQXlCLEVBQUUsb0JBQUUsQ0FBQyxHQUFHLENBQUMseUJBQXlCO1lBQzNELFVBQVUsRUFBRSxvQkFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVO1lBQzdCLGFBQWEsRUFBRSxvQkFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhO1lBQ25DLFFBQVEsRUFBRSxvQkFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRO1NBQzFCLENBQUM7UUFFRix3RkFBd0Y7UUFDeEYsNEZBQTRGO1FBQzVGLHdGQUF3RjtRQUN4RixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUM5QixNQUFNLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsT0FBTyxvQkFBRSxDQUFDLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzlFLENBQUM7SUFqQkQsOENBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZyk6IHRzLlBhcnNlZENvbW1hbmRMaW5lIHtcbiAgY29uc3Qge2NvbmZpZ30gPSB0cy5yZWFkQ29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIHRzLnN5cy5yZWFkRmlsZSk7XG4gIGNvbnN0IHBhcnNlQ29uZmlnSG9zdCA9IHtcbiAgICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzOiB0cy5zeXMudXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcyxcbiAgICBmaWxlRXhpc3RzOiB0cy5zeXMuZmlsZUV4aXN0cyxcbiAgICByZWFkRGlyZWN0b3J5OiB0cy5zeXMucmVhZERpcmVjdG9yeSxcbiAgICByZWFkRmlsZTogdHMuc3lzLnJlYWRGaWxlLFxuICB9O1xuXG4gIC8vIFRocm93IGlmIGluY29ycmVjdCBhcmd1bWVudHMgYXJlIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uLiBQYXNzaW5nIHJlbGF0aXZlIGJhc2UgcGF0aHNcbiAgLy8gcmVzdWx0cyBpbiByb290IGRpcmVjdG9yaWVzIG5vdCBiZWluZyByZXNvbHZlZCBhbmQgaW4gbGF0ZXIgdHlwZSBjaGVja2luZyBydW50aW1lIGVycm9ycy5cbiAgLy8gTW9yZSBkZXRhaWxzIGNhbiBiZSBmb3VuZCBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzM3NzMxLlxuICBpZiAoIXBhdGguaXNBYnNvbHV0ZShiYXNlUGF0aCkpIHtcbiAgICB0aHJvdyBFcnJvcignVW5leHBlY3RlZCByZWxhdGl2ZSBiYXNlIHBhdGggaGFzIGJlZW4gc3BlY2lmaWVkLicpO1xuICB9XG5cbiAgcmV0dXJuIHRzLnBhcnNlSnNvbkNvbmZpZ0ZpbGVDb250ZW50KGNvbmZpZywgcGFyc2VDb25maWdIb3N0LCBiYXNlUGF0aCwge30pO1xufVxuIl19