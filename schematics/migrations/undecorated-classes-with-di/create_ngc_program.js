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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/create_ngc_program", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createNgcProgram = void 0;
    /** Creates an NGC program that can be used to read and parse metadata for files. */
    function createNgcProgram(compilerCliModule, createHost, tsconfigPath) {
        const { rootNames, options } = compilerCliModule.readConfiguration(tsconfigPath);
        // https://github.com/angular/angular/commit/ec4381dd401f03bded652665b047b6b90f2b425f made Ivy
        // the default. This breaks the assumption that "createProgram" from compiler-cli returns the
        // NGC program. In order to ensure that the migration runs properly, we set "enableIvy" to false.
        options.enableIvy = false;
        // Libraries which have been generated with CLI versions past v6.2.0, explicitly set the
        // flat-module options in their tsconfig files. This is problematic because by default,
        // those tsconfig files do not specify explicit source files which can be considered as
        // entry point for the flat-module bundle. Therefore the `@angular/compiler-cli` is unable
        // to determine the flat module entry point and throws a compile error. This is not an issue
        // for the libraries built with `ng-packagr`, because the tsconfig files are modified in-memory
        // to specify an explicit flat module entry-point. Our migrations don't distinguish between
        // libraries and applications, and also don't run `ng-packagr`. To ensure that such libraries
        // can be successfully migrated, we remove the flat-module options to eliminate the flat module
        // entry-point requirement. More context: https://github.com/angular/angular/issues/34985.
        options.flatModuleId = undefined;
        options.flatModuleOutFile = undefined;
        const host = createHost(options);
        // For this migration, we never need to read resources and can just return
        // an empty string for requested resources. We need to handle requested resources
        // because our created NGC compiler program does not know about special resolutions
        // which are set up by the Angular CLI. i.e. resolving stylesheets through "tilde".
        host.readResource = () => '';
        host.resourceNameToFileName = () => '$fake-file$';
        const ngcProgram = compilerCliModule.createProgram({ rootNames, options, host });
        // The "AngularCompilerProgram" does not expose the "AotCompiler" instance, nor does it
        // expose the logic that is necessary to analyze the determined modules. We work around
        // this by just accessing the necessary private properties using the bracket notation.
        const compiler = ngcProgram['compiler'];
        const program = ngcProgram.getTsProgram();
        return { host, ngcProgram, program, compiler };
    }
    exports.createNgcProgram = createNgcProgram;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlX25nY19wcm9ncmFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL2NyZWF0ZV9uZ2NfcHJvZ3JhbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFNSCxvRkFBb0Y7SUFDcEYsU0FBZ0IsZ0JBQWdCLENBQzVCLGlCQUF5RCxFQUN6RCxVQUF5RCxFQUFFLFlBQW9CO1FBQ2pGLE1BQU0sRUFBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLEdBQUcsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFL0UsOEZBQThGO1FBQzlGLDZGQUE2RjtRQUM3RixpR0FBaUc7UUFDakcsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFFMUIsd0ZBQXdGO1FBQ3hGLHVGQUF1RjtRQUN2Rix1RkFBdUY7UUFDdkYsMEZBQTBGO1FBQzFGLDRGQUE0RjtRQUM1RiwrRkFBK0Y7UUFDL0YsMkZBQTJGO1FBQzNGLDZGQUE2RjtRQUM3RiwrRkFBK0Y7UUFDL0YsMEZBQTBGO1FBQzFGLE9BQU8sQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7UUFFdEMsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWpDLDBFQUEwRTtRQUMxRSxpRkFBaUY7UUFDakYsbUZBQW1GO1FBQ25GLG1GQUFtRjtRQUNuRixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDO1FBRWxELE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUUvRSx1RkFBdUY7UUFDdkYsdUZBQXVGO1FBQ3ZGLHNGQUFzRjtRQUN0RixNQUFNLFFBQVEsR0FBaUIsVUFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM5RCxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFMUMsT0FBTyxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBQyxDQUFDO0lBQy9DLENBQUM7SUF6Q0QsNENBeUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtBb3RDb21waWxlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHR5cGUge0NvbXBpbGVySG9zdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqIENyZWF0ZXMgYW4gTkdDIHByb2dyYW0gdGhhdCBjYW4gYmUgdXNlZCB0byByZWFkIGFuZCBwYXJzZSBtZXRhZGF0YSBmb3IgZmlsZXMuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmdjUHJvZ3JhbShcbiAgICBjb21waWxlckNsaU1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXItY2xpJyksXG4gICAgY3JlYXRlSG9zdDogKG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucykgPT4gQ29tcGlsZXJIb3N0LCB0c2NvbmZpZ1BhdGg6IHN0cmluZykge1xuICBjb25zdCB7cm9vdE5hbWVzLCBvcHRpb25zfSA9IGNvbXBpbGVyQ2xpTW9kdWxlLnJlYWRDb25maWd1cmF0aW9uKHRzY29uZmlnUGF0aCk7XG5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9jb21taXQvZWM0MzgxZGQ0MDFmMDNiZGVkNjUyNjY1YjA0N2I2YjkwZjJiNDI1ZiBtYWRlIEl2eVxuICAvLyB0aGUgZGVmYXVsdC4gVGhpcyBicmVha3MgdGhlIGFzc3VtcHRpb24gdGhhdCBcImNyZWF0ZVByb2dyYW1cIiBmcm9tIGNvbXBpbGVyLWNsaSByZXR1cm5zIHRoZVxuICAvLyBOR0MgcHJvZ3JhbS4gSW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgdGhlIG1pZ3JhdGlvbiBydW5zIHByb3Blcmx5LCB3ZSBzZXQgXCJlbmFibGVJdnlcIiB0byBmYWxzZS5cbiAgb3B0aW9ucy5lbmFibGVJdnkgPSBmYWxzZTtcblxuICAvLyBMaWJyYXJpZXMgd2hpY2ggaGF2ZSBiZWVuIGdlbmVyYXRlZCB3aXRoIENMSSB2ZXJzaW9ucyBwYXN0IHY2LjIuMCwgZXhwbGljaXRseSBzZXQgdGhlXG4gIC8vIGZsYXQtbW9kdWxlIG9wdGlvbnMgaW4gdGhlaXIgdHNjb25maWcgZmlsZXMuIFRoaXMgaXMgcHJvYmxlbWF0aWMgYmVjYXVzZSBieSBkZWZhdWx0LFxuICAvLyB0aG9zZSB0c2NvbmZpZyBmaWxlcyBkbyBub3Qgc3BlY2lmeSBleHBsaWNpdCBzb3VyY2UgZmlsZXMgd2hpY2ggY2FuIGJlIGNvbnNpZGVyZWQgYXNcbiAgLy8gZW50cnkgcG9pbnQgZm9yIHRoZSBmbGF0LW1vZHVsZSBidW5kbGUuIFRoZXJlZm9yZSB0aGUgYEBhbmd1bGFyL2NvbXBpbGVyLWNsaWAgaXMgdW5hYmxlXG4gIC8vIHRvIGRldGVybWluZSB0aGUgZmxhdCBtb2R1bGUgZW50cnkgcG9pbnQgYW5kIHRocm93cyBhIGNvbXBpbGUgZXJyb3IuIFRoaXMgaXMgbm90IGFuIGlzc3VlXG4gIC8vIGZvciB0aGUgbGlicmFyaWVzIGJ1aWx0IHdpdGggYG5nLXBhY2thZ3JgLCBiZWNhdXNlIHRoZSB0c2NvbmZpZyBmaWxlcyBhcmUgbW9kaWZpZWQgaW4tbWVtb3J5XG4gIC8vIHRvIHNwZWNpZnkgYW4gZXhwbGljaXQgZmxhdCBtb2R1bGUgZW50cnktcG9pbnQuIE91ciBtaWdyYXRpb25zIGRvbid0IGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAgLy8gbGlicmFyaWVzIGFuZCBhcHBsaWNhdGlvbnMsIGFuZCBhbHNvIGRvbid0IHJ1biBgbmctcGFja2FncmAuIFRvIGVuc3VyZSB0aGF0IHN1Y2ggbGlicmFyaWVzXG4gIC8vIGNhbiBiZSBzdWNjZXNzZnVsbHkgbWlncmF0ZWQsIHdlIHJlbW92ZSB0aGUgZmxhdC1tb2R1bGUgb3B0aW9ucyB0byBlbGltaW5hdGUgdGhlIGZsYXQgbW9kdWxlXG4gIC8vIGVudHJ5LXBvaW50IHJlcXVpcmVtZW50LiBNb3JlIGNvbnRleHQ6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzM0OTg1LlxuICBvcHRpb25zLmZsYXRNb2R1bGVJZCA9IHVuZGVmaW5lZDtcbiAgb3B0aW9ucy5mbGF0TW9kdWxlT3V0RmlsZSA9IHVuZGVmaW5lZDtcblxuICBjb25zdCBob3N0ID0gY3JlYXRlSG9zdChvcHRpb25zKTtcblxuICAvLyBGb3IgdGhpcyBtaWdyYXRpb24sIHdlIG5ldmVyIG5lZWQgdG8gcmVhZCByZXNvdXJjZXMgYW5kIGNhbiBqdXN0IHJldHVyblxuICAvLyBhbiBlbXB0eSBzdHJpbmcgZm9yIHJlcXVlc3RlZCByZXNvdXJjZXMuIFdlIG5lZWQgdG8gaGFuZGxlIHJlcXVlc3RlZCByZXNvdXJjZXNcbiAgLy8gYmVjYXVzZSBvdXIgY3JlYXRlZCBOR0MgY29tcGlsZXIgcHJvZ3JhbSBkb2VzIG5vdCBrbm93IGFib3V0IHNwZWNpYWwgcmVzb2x1dGlvbnNcbiAgLy8gd2hpY2ggYXJlIHNldCB1cCBieSB0aGUgQW5ndWxhciBDTEkuIGkuZS4gcmVzb2x2aW5nIHN0eWxlc2hlZXRzIHRocm91Z2ggXCJ0aWxkZVwiLlxuICBob3N0LnJlYWRSZXNvdXJjZSA9ICgpID0+ICcnO1xuICBob3N0LnJlc291cmNlTmFtZVRvRmlsZU5hbWUgPSAoKSA9PiAnJGZha2UtZmlsZSQnO1xuXG4gIGNvbnN0IG5nY1Byb2dyYW0gPSBjb21waWxlckNsaU1vZHVsZS5jcmVhdGVQcm9ncmFtKHtyb290TmFtZXMsIG9wdGlvbnMsIGhvc3R9KTtcblxuICAvLyBUaGUgXCJBbmd1bGFyQ29tcGlsZXJQcm9ncmFtXCIgZG9lcyBub3QgZXhwb3NlIHRoZSBcIkFvdENvbXBpbGVyXCIgaW5zdGFuY2UsIG5vciBkb2VzIGl0XG4gIC8vIGV4cG9zZSB0aGUgbG9naWMgdGhhdCBpcyBuZWNlc3NhcnkgdG8gYW5hbHl6ZSB0aGUgZGV0ZXJtaW5lZCBtb2R1bGVzLiBXZSB3b3JrIGFyb3VuZFxuICAvLyB0aGlzIGJ5IGp1c3QgYWNjZXNzaW5nIHRoZSBuZWNlc3NhcnkgcHJpdmF0ZSBwcm9wZXJ0aWVzIHVzaW5nIHRoZSBicmFja2V0IG5vdGF0aW9uLlxuICBjb25zdCBjb21waWxlcjogQW90Q29tcGlsZXIgPSAobmdjUHJvZ3JhbSBhcyBhbnkpWydjb21waWxlciddO1xuICBjb25zdCBwcm9ncmFtID0gbmdjUHJvZ3JhbS5nZXRUc1Byb2dyYW0oKTtcblxuICByZXR1cm4ge2hvc3QsIG5nY1Byb2dyYW0sIHByb2dyYW0sIGNvbXBpbGVyfTtcbn1cbiJdfQ==