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
    function createNgcProgram(createHost, tsconfigPath, parseConfig = () => compiler_cli_1.readConfiguration(tsconfigPath)) {
        const { rootNames, options } = parseConfig();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlX25nY19wcm9ncmFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL2NyZWF0ZV9uZ2NfcHJvZ3JhbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGdEQUF5RTtJQUN6RSx3REFBdUU7SUFHdkUsb0ZBQW9GO0lBQ3BGLFNBQWdCLGdCQUFnQixDQUM1QixVQUE0RCxFQUFFLFlBQTJCLEVBQ3pGLGNBR0ksR0FBRyxFQUFFLENBQUMsZ0NBQWlCLENBQUMsWUFBYyxDQUFDO1FBQzdDLE1BQU0sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLEdBQUcsV0FBVyxFQUFFLENBQUM7UUFDM0MsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sVUFBVSxHQUFHLDRCQUFhLENBQUMsRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDN0QsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRTFDLHVGQUF1RjtRQUN2Rix1RkFBdUY7UUFDdkYsc0ZBQXNGO1FBQ3RGLE1BQU0sUUFBUSxHQUFpQixVQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDdkQseUZBQXlGO1FBQ3pGLHVGQUF1RjtRQUN2RixzRkFBc0Y7UUFDdEYsc0ZBQXNGO1FBQ3RGLDhGQUE4RjtRQUM5RixNQUFNLG1CQUFtQixHQUFHLGdCQUFrQixDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDdkUsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsR0FBRyxVQUFTLFFBQW1DO1lBQ3hGLE9BQU8sSUFBSSxvQ0FBeUIsQ0FDaEMsRUFBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBVyxFQUFDLENBQUMsQ0FBQztRQUNqRixDQUFDLENBQUM7UUFFRixPQUFPLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7SUFDL0MsQ0FBQztJQTVCRCw0Q0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QW90Q29tcGlsZXIsIENvbXBpbGVTdHlsZXNoZWV0TWV0YWRhdGF9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Y3JlYXRlUHJvZ3JhbSwgcmVhZENvbmZpZ3VyYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqIENyZWF0ZXMgYW4gTkdDIHByb2dyYW0gdGhhdCBjYW4gYmUgdXNlZCB0byByZWFkIGFuZCBwYXJzZSBtZXRhZGF0YSBmb3IgZmlsZXMuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmdjUHJvZ3JhbShcbiAgICBjcmVhdGVIb3N0OiAob3B0aW9uczogdHMuQ29tcGlsZXJPcHRpb25zKSA9PiB0cy5Db21waWxlckhvc3QsIHRzY29uZmlnUGF0aDogc3RyaW5nIHwgbnVsbCxcbiAgICBwYXJzZUNvbmZpZzogKCkgPT4ge1xuICAgICAgcm9vdE5hbWVzOiByZWFkb25seSBzdHJpbmdbXSxcbiAgICAgIG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9uc1xuICAgIH0gPSAoKSA9PiByZWFkQ29uZmlndXJhdGlvbih0c2NvbmZpZ1BhdGggISkpIHtcbiAgY29uc3Qge3Jvb3ROYW1lcywgb3B0aW9uc30gPSBwYXJzZUNvbmZpZygpO1xuICBjb25zdCBob3N0ID0gY3JlYXRlSG9zdChvcHRpb25zKTtcbiAgY29uc3QgbmdjUHJvZ3JhbSA9IGNyZWF0ZVByb2dyYW0oe3Jvb3ROYW1lcywgb3B0aW9ucywgaG9zdH0pO1xuICBjb25zdCBwcm9ncmFtID0gbmdjUHJvZ3JhbS5nZXRUc1Byb2dyYW0oKTtcblxuICAvLyBUaGUgXCJBbmd1bGFyQ29tcGlsZXJQcm9ncmFtXCIgZG9lcyBub3QgZXhwb3NlIHRoZSBcIkFvdENvbXBpbGVyXCIgaW5zdGFuY2UsIG5vciBkb2VzIGl0XG4gIC8vIGV4cG9zZSB0aGUgbG9naWMgdGhhdCBpcyBuZWNlc3NhcnkgdG8gYW5hbHl6ZSB0aGUgZGV0ZXJtaW5lZCBtb2R1bGVzLiBXZSB3b3JrIGFyb3VuZFxuICAvLyB0aGlzIGJ5IGp1c3QgYWNjZXNzaW5nIHRoZSBuZWNlc3NhcnkgcHJpdmF0ZSBwcm9wZXJ0aWVzIHVzaW5nIHRoZSBicmFja2V0IG5vdGF0aW9uLlxuICBjb25zdCBjb21waWxlcjogQW90Q29tcGlsZXIgPSAobmdjUHJvZ3JhbSBhcyBhbnkpWydjb21waWxlciddO1xuICBjb25zdCBtZXRhZGF0YVJlc29sdmVyID0gY29tcGlsZXJbJ19tZXRhZGF0YVJlc29sdmVyJ107XG4gIC8vIE1vZGlmeSB0aGUgXCJEaXJlY3RpdmVOb3JtYWxpemVyXCIgdG8gbm90IG5vcm1hbGl6ZSBhbnkgcmVmZXJlbmNlZCBleHRlcm5hbCBzdHlsZXNoZWV0cy5cbiAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBpbiBDTEkgcHJvamVjdHMgcHJlcHJvY2Vzc29yIGZpbGVzIGFyZSBjb21tb25seSByZWZlcmVuY2VkXG4gIC8vIGFuZCB3ZSBkb24ndCB3YW50IHRvIHBhcnNlIHRoZW0gaW4gb3JkZXIgdG8gZXh0cmFjdCByZWxhdGl2ZSBzdHlsZSByZWZlcmVuY2VzLiBUaGlzXG4gIC8vIGJyZWFrcyB0aGUgYW5hbHlzaXMgb2YgdGhlIHByb2plY3QgYmVjYXVzZSB3ZSBpbnN0YW50aWF0ZSBhIHN0YW5kYWxvbmUgQU9UIGNvbXBpbGVyXG4gIC8vIHByb2dyYW0gd2hpY2ggZG9lcyBub3QgY29udGFpbiB0aGUgY3VzdG9tIGxvZ2ljIGJ5IHRoZSBBbmd1bGFyIENMSSBXZWJwYWNrIGNvbXBpbGVyIHBsdWdpbi5cbiAgY29uc3QgZGlyZWN0aXZlTm9ybWFsaXplciA9IG1ldGFkYXRhUmVzb2x2ZXIgIVsnX2RpcmVjdGl2ZU5vcm1hbGl6ZXInXTtcbiAgZGlyZWN0aXZlTm9ybWFsaXplclsnX25vcm1hbGl6ZVN0eWxlc2hlZXQnXSA9IGZ1bmN0aW9uKG1ldGFkYXRhOiBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKSB7XG4gICAgcmV0dXJuIG5ldyBDb21waWxlU3R5bGVzaGVldE1ldGFkYXRhKFxuICAgICAgICB7c3R5bGVzOiBtZXRhZGF0YS5zdHlsZXMsIHN0eWxlVXJsczogW10sIG1vZHVsZVVybDogbWV0YWRhdGEubW9kdWxlVXJsICF9KTtcbiAgfTtcblxuICByZXR1cm4ge2hvc3QsIG5nY1Byb2dyYW0sIHByb2dyYW0sIGNvbXBpbGVyfTtcbn1cbiJdfQ==