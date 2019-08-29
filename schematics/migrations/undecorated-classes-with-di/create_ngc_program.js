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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/create_ngc_program", ["require", "exports", "@angular/compiler", "@angular/compiler-cli"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const compiler_1 = require("@angular/compiler");
    const compiler_cli_1 = require("@angular/compiler-cli");
    /** Creates an NGC program that can be used to read and parse metadata for files. */
    function createNgcProgram(createHost, tsconfigPath) {
        const { rootNames, options } = compiler_cli_1.readConfiguration(tsconfigPath);
        // https://github.com/angular/angular/commit/ec4381dd401f03bded652665b047b6b90f2b425f made Ivy
        // the default. This breaks the assumption that "createProgram" from compiler-cli returns the
        // NGC program. In order to ensure that the migration runs properly, we set "enableIvy" to false.
        options.enableIvy = false;
        const host = createHost(options);
        const ngcProgram = compiler_cli_1.createProgram({ rootNames, options, host });
        const program = ngcProgram.getTsProgram();
        // The "AngularCompilerProgram" does not expose the "AotCompiler" instance, nor does it
        // expose the logic that is necessary to analyze the determined modules. We work around
        // this by just accessing the necessary private properties using the bracket notation.
        const compiler = ngcProgram['compiler'];
        const metadataResolver = compiler['_metadataResolver'];
        // Modify the "DirectiveNormalizer" to not normalize any referenced external stylesheets.
        // This is necessary because in CLI projects preprocessor files are commonly referenced
        // and we don't want to parse them in order to extract relative style references. This
        // breaks the analysis of the project because we instantiate a standalone AOT compiler
        // program which does not contain the custom logic by the Angular CLI Webpack compiler plugin.
        const directiveNormalizer = metadataResolver['_directiveNormalizer'];
        directiveNormalizer['_normalizeStylesheet'] = function (metadata) {
            return new compiler_1.CompileStylesheetMetadata({ styles: metadata.styles, styleUrls: [], moduleUrl: metadata.moduleUrl });
        };
        return { host, ngcProgram, program, compiler };
    }
    exports.createNgcProgram = createNgcProgram;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlX25nY19wcm9ncmFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL2NyZWF0ZV9uZ2NfcHJvZ3JhbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGdEQUF5RTtJQUN6RSx3REFBdUU7SUFHdkUsb0ZBQW9GO0lBQ3BGLFNBQWdCLGdCQUFnQixDQUM1QixVQUE0RCxFQUFFLFlBQW9CO1FBQ3BGLE1BQU0sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLEdBQUcsZ0NBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFN0QsOEZBQThGO1FBQzlGLDZGQUE2RjtRQUM3RixpR0FBaUc7UUFDakcsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFFMUIsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sVUFBVSxHQUFHLDRCQUFhLENBQUMsRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDN0QsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRTFDLHVGQUF1RjtRQUN2Rix1RkFBdUY7UUFDdkYsc0ZBQXNGO1FBQ3RGLE1BQU0sUUFBUSxHQUFpQixVQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDdkQseUZBQXlGO1FBQ3pGLHVGQUF1RjtRQUN2RixzRkFBc0Y7UUFDdEYsc0ZBQXNGO1FBQ3RGLDhGQUE4RjtRQUM5RixNQUFNLG1CQUFtQixHQUFHLGdCQUFrQixDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDdkUsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsR0FBRyxVQUFTLFFBQW1DO1lBQ3hGLE9BQU8sSUFBSSxvQ0FBeUIsQ0FDaEMsRUFBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBVyxFQUFDLENBQUMsQ0FBQztRQUNqRixDQUFDLENBQUM7UUFFRixPQUFPLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7SUFDL0MsQ0FBQztJQTlCRCw0Q0E4QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QW90Q29tcGlsZXIsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGF9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Y3JlYXRlUHJvZ3JhbSwgcmVhZENvbmZpZ3VyYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqIENyZWF0ZXMgYW4gTkdDIHByb2dyYW0gdGhhdCBjYW4gYmUgdXNlZCB0byByZWFkIGFuZCBwYXJzZSBtZXRhZGF0YSBmb3IgZmlsZXMuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmdjUHJvZ3JhbShcbiAgICBjcmVhdGVIb3N0OiAob3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zKSA9PiB0cy5Db21waWxlckhvc3QsIHRzY29uZmlnUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHtyb290TmFtZXMsIG9wdGlvbnN9ID0gcmVhZENvbmZpZ3VyYXRpb24odHNjb25maWdQYXRoKTtcblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2NvbW1pdC9lYzQzODFkZDQwMWYwM2JkZWQ2NTI2NjViMDQ3YjZiOTBmMmI0MjVmIG1hZGUgSXZ5XG4gIC8vIHRoZSBkZWZhdWx0LiBUaGlzIGJyZWFrcyB0aGUgYXNzdW1wdGlvbiB0aGF0IFwiY3JlYXRlUHJvZ3JhbVwiIGZyb20gY29tcGlsZXItY2xpIHJldHVybnMgdGhlXG4gIC8vIE5HQyBwcm9ncmFtLiBJbiBvcmRlciB0byBlbnN1cmUgdGhhdCB0aGUgbWlncmF0aW9uIHJ1bnMgcHJvcGVybHksIHdlIHNldCBcImVuYWJsZUl2eVwiIHRvIGZhbHNlLlxuICBvcHRpb25zLmVuYWJsZUl2eSA9IGZhbHNlO1xuXG4gIGNvbnN0IGhvc3QgPSBjcmVhdGVIb3N0KG9wdGlvbnMpO1xuICBjb25zdCBuZ2NQcm9ncmFtID0gY3JlYXRlUHJvZ3JhbSh7cm9vdE5hbWVzLCBvcHRpb25zLCBob3N0fSk7XG4gIGNvbnN0IHByb2dyYW0gPSBuZ2NQcm9ncmFtLmdldFRzUHJvZ3JhbSgpO1xuXG4gIC8vIFRoZSBcIkFuZ3VsYXJDb21waWxlclByb2dyYW1cIiBkb2VzIG5vdCBleHBvc2UgdGhlIFwiQW90Q29tcGlsZXJcIiBpbnN0YW5jZSwgbm9yIGRvZXMgaXRcbiAgLy8gZXhwb3NlIHRoZSBsb2dpYyB0aGF0IGlzIG5lY2Vzc2FyeSB0byBhbmFseXplIHRoZSBkZXRlcm1pbmVkIG1vZHVsZXMuIFdlIHdvcmsgYXJvdW5kXG4gIC8vIHRoaXMgYnkganVzdCBhY2Nlc3NpbmcgdGhlIG5lY2Vzc2FyeSBwcml2YXRlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGJyYWNrZXQgbm90YXRpb24uXG4gIGNvbnN0IGNvbXBpbGVyOiBBb3RDb21waWxlciA9IChuZ2NQcm9ncmFtIGFzIGFueSlbJ2NvbXBpbGVyJ107XG4gIGNvbnN0IG1ldGFkYXRhUmVzb2x2ZXIgPSBjb21waWxlclsnX21ldGFkYXRhUmVzb2x2ZXInXTtcbiAgLy8gTW9kaWZ5IHRoZSBcIkRpcmVjdGl2ZU5vcm1hbGl6ZXJcIiB0byBub3Qgbm9ybWFsaXplIGFueSByZWZlcmVuY2VkIGV4dGVybmFsIHN0eWxlc2hlZXRzLlxuICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGluIENMSSBwcm9qZWN0cyBwcmVwcm9jZXNzb3IgZmlsZXMgYXJlIGNvbW1vbmx5IHJlZmVyZW5jZWRcbiAgLy8gYW5kIHdlIGRvbid0IHdhbnQgdG8gcGFyc2UgdGhlbSBpbiBvcmRlciB0byBleHRyYWN0IHJlbGF0aXZlIHN0eWxlIHJlZmVyZW5jZXMuIFRoaXNcbiAgLy8gYnJlYWtzIHRoZSBhbmFseXNpcyBvZiB0aGUgcHJvamVjdCBiZWNhdXNlIHdlIGluc3RhbnRpYXRlIGEgc3RhbmRhbG9uZSBBT1QgY29tcGlsZXJcbiAgLy8gcHJvZ3JhbSB3aGljaCBkb2VzIG5vdCBjb250YWluIHRoZSBjdXN0b20gbG9naWMgYnkgdGhlIEFuZ3VsYXIgQ0xJIFdlYnBhY2sgY29tcGlsZXIgcGx1Z2luLlxuICBjb25zdCBkaXJlY3RpdmVOb3JtYWxpemVyID0gbWV0YWRhdGFSZXNvbHZlciAhWydfZGlyZWN0aXZlTm9ybWFsaXplciddO1xuICBkaXJlY3RpdmVOb3JtYWxpemVyWydfbm9ybWFsaXplU3R5bGVzaGVldCddID0gZnVuY3Rpb24obWV0YWRhdGE6IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEpIHtcbiAgICByZXR1cm4gbmV3IENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGEoXG4gICAgICAgIHtzdHlsZXM6IG1ldGFkYXRhLnN0eWxlcywgc3R5bGVVcmxzOiBbXSwgbW9kdWxlVXJsOiBtZXRhZGF0YS5tb2R1bGVVcmwgIX0pO1xuICB9O1xuXG4gIHJldHVybiB7aG9zdCwgbmdjUHJvZ3JhbSwgcHJvZ3JhbSwgY29tcGlsZXJ9O1xufVxuIl19