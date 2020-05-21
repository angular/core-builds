(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/utils/typescript/compiler_host", ["require", "exports", "path", "typescript", "@angular/core/schematics/utils/typescript/parse_tsconfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createMigrationCompilerHost = exports.createMigrationProgram = void 0;
    const path_1 = require("path");
    const ts = require("typescript");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    /**
     * Creates a TypeScript program instance for a TypeScript project within
     * the virtual file system tree.
     * @param tree Virtual file system tree that contains the source files.
     * @param tsconfigPath Virtual file system path that resolves to the TypeScript project.
     * @param basePath Base path for the virtual file system tree.
     * @param fakeFileRead Optional file reader function. Can be used to overwrite files in
     *   the TypeScript program, or to add in-memory files (e.g. to add global types).
     * @param additionalFiles Additional file paths that should be added to the program.
     */
    function createMigrationProgram(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles) {
        // Resolve the tsconfig path to an absolute path. This is needed as TypeScript otherwise
        // is not able to resolve root directories in the given tsconfig. More details can be found
        // in the following issue: https://github.com/microsoft/TypeScript/issues/37731.
        tsconfigPath = path_1.resolve(basePath, tsconfigPath);
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = createMigrationCompilerHost(tree, parsed.options, basePath, fakeFileRead);
        const program = ts.createProgram(parsed.fileNames.concat(additionalFiles || []), parsed.options, host);
        return { parsed, host, program };
    }
    exports.createMigrationProgram = createMigrationProgram;
    function createMigrationCompilerHost(tree, options, basePath, fakeRead) {
        const host = ts.createCompilerHost(options, true);
        // We need to overwrite the host "readFile" method, as we want the TypeScript
        // program to be based on the file contents in the virtual file tree. Otherwise
        // if we run multiple migrations we might have intersecting changes and
        // source files.
        host.readFile = fileName => {
            const treeRelativePath = path_1.relative(basePath, fileName);
            const fakeOutput = fakeRead ? fakeRead(treeRelativePath) : null;
            const buffer = fakeOutput === null ? tree.read(treeRelativePath) : fakeOutput;
            // Strip BOM as otherwise TSC methods (Ex: getWidth) will return an offset,
            // which breaks the CLI UpdateRecorder.
            // See: https://github.com/angular/angular/pull/30719
            return buffer ? buffer.toString().replace(/^\uFEFF/, '') : undefined;
        };
        return host;
    }
    exports.createMigrationCompilerHost = createMigrationCompilerHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBUUEsK0JBQWdEO0lBQ2hELGlDQUFpQztJQUNqQyw2RkFBbUQ7SUFJbkQ7Ozs7Ozs7OztPQVNHO0lBQ0gsU0FBZ0Isc0JBQXNCLENBQ2xDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCLEVBQUUsWUFBNkIsRUFDakYsZUFBMEI7UUFDNUIsd0ZBQXdGO1FBQ3hGLDJGQUEyRjtRQUMzRixnRkFBZ0Y7UUFDaEYsWUFBWSxHQUFHLGNBQU8sQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDL0MsTUFBTSxNQUFNLEdBQUcsa0NBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLDJCQUEyQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN2RixNQUFNLE9BQU8sR0FDVCxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGVBQWUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNGLE9BQU8sRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQyxDQUFDO0lBQ2pDLENBQUM7SUFaRCx3REFZQztJQUVELFNBQWdCLDJCQUEyQixDQUN2QyxJQUFVLEVBQUUsT0FBMkIsRUFBRSxRQUFnQixFQUN6RCxRQUF5QjtRQUMzQixNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWxELDZFQUE2RTtRQUM3RSwrRUFBK0U7UUFDL0UsdUVBQXVFO1FBQ3ZFLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sZ0JBQWdCLEdBQUcsZUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN0RCxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDaEUsTUFBTSxNQUFNLEdBQUcsVUFBVSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFDOUUsMkVBQTJFO1lBQzNFLHVDQUF1QztZQUN2QyxxREFBcUQ7WUFDckQsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDdkUsQ0FBQyxDQUFDO1FBRUYsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBcEJELGtFQW9CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7VHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtkaXJuYW1lLCByZWxhdGl2ZSwgcmVzb2x2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4vcGFyc2VfdHNjb25maWcnO1xuXG5leHBvcnQgdHlwZSBGYWtlUmVhZEZpbGVGbiA9IChmaWxlTmFtZTogc3RyaW5nKSA9PiBzdHJpbmd8bnVsbDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVHlwZVNjcmlwdCBwcm9ncmFtIGluc3RhbmNlIGZvciBhIFR5cGVTY3JpcHQgcHJvamVjdCB3aXRoaW5cbiAqIHRoZSB2aXJ0dWFsIGZpbGUgc3lzdGVtIHRyZWUuXG4gKiBAcGFyYW0gdHJlZSBWaXJ0dWFsIGZpbGUgc3lzdGVtIHRyZWUgdGhhdCBjb250YWlucyB0aGUgc291cmNlIGZpbGVzLlxuICogQHBhcmFtIHRzY29uZmlnUGF0aCBWaXJ0dWFsIGZpbGUgc3lzdGVtIHBhdGggdGhhdCByZXNvbHZlcyB0byB0aGUgVHlwZVNjcmlwdCBwcm9qZWN0LlxuICogQHBhcmFtIGJhc2VQYXRoIEJhc2UgcGF0aCBmb3IgdGhlIHZpcnR1YWwgZmlsZSBzeXN0ZW0gdHJlZS5cbiAqIEBwYXJhbSBmYWtlRmlsZVJlYWQgT3B0aW9uYWwgZmlsZSByZWFkZXIgZnVuY3Rpb24uIENhbiBiZSB1c2VkIHRvIG92ZXJ3cml0ZSBmaWxlcyBpblxuICogICB0aGUgVHlwZVNjcmlwdCBwcm9ncmFtLCBvciB0byBhZGQgaW4tbWVtb3J5IGZpbGVzIChlLmcuIHRvIGFkZCBnbG9iYWwgdHlwZXMpLlxuICogQHBhcmFtIGFkZGl0aW9uYWxGaWxlcyBBZGRpdGlvbmFsIGZpbGUgcGF0aHMgdGhhdCBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHByb2dyYW0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKFxuICAgIHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nLCBmYWtlRmlsZVJlYWQ/OiBGYWtlUmVhZEZpbGVGbixcbiAgICBhZGRpdGlvbmFsRmlsZXM/OiBzdHJpbmdbXSkge1xuICAvLyBSZXNvbHZlIHRoZSB0c2NvbmZpZyBwYXRoIHRvIGFuIGFic29sdXRlIHBhdGguIFRoaXMgaXMgbmVlZGVkIGFzIFR5cGVTY3JpcHQgb3RoZXJ3aXNlXG4gIC8vIGlzIG5vdCBhYmxlIHRvIHJlc29sdmUgcm9vdCBkaXJlY3RvcmllcyBpbiB0aGUgZ2l2ZW4gdHNjb25maWcuIE1vcmUgZGV0YWlscyBjYW4gYmUgZm91bmRcbiAgLy8gaW4gdGhlIGZvbGxvd2luZyBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8zNzczMS5cbiAgdHNjb25maWdQYXRoID0gcmVzb2x2ZShiYXNlUGF0aCwgdHNjb25maWdQYXRoKTtcbiAgY29uc3QgcGFyc2VkID0gcGFyc2VUc2NvbmZpZ0ZpbGUodHNjb25maWdQYXRoLCBkaXJuYW1lKHRzY29uZmlnUGF0aCkpO1xuICBjb25zdCBob3N0ID0gY3JlYXRlTWlncmF0aW9uQ29tcGlsZXJIb3N0KHRyZWUsIHBhcnNlZC5vcHRpb25zLCBiYXNlUGF0aCwgZmFrZUZpbGVSZWFkKTtcbiAgY29uc3QgcHJvZ3JhbSA9XG4gICAgICB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMuY29uY2F0KGFkZGl0aW9uYWxGaWxlcyB8fCBbXSksIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgcmV0dXJuIHtwYXJzZWQsIGhvc3QsIHByb2dyYW19O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWlncmF0aW9uQ29tcGlsZXJIb3N0KFxuICAgIHRyZWU6IFRyZWUsIG9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucywgYmFzZVBhdGg6IHN0cmluZyxcbiAgICBmYWtlUmVhZD86IEZha2VSZWFkRmlsZUZuKTogdHMuQ29tcGlsZXJIb3N0IHtcbiAgY29uc3QgaG9zdCA9IHRzLmNyZWF0ZUNvbXBpbGVySG9zdChvcHRpb25zLCB0cnVlKTtcblxuICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gIC8vIHByb2dyYW0gdG8gYmUgYmFzZWQgb24gdGhlIGZpbGUgY29udGVudHMgaW4gdGhlIHZpcnR1YWwgZmlsZSB0cmVlLiBPdGhlcndpc2VcbiAgLy8gaWYgd2UgcnVuIG11bHRpcGxlIG1pZ3JhdGlvbnMgd2UgbWlnaHQgaGF2ZSBpbnRlcnNlY3RpbmcgY2hhbmdlcyBhbmRcbiAgLy8gc291cmNlIGZpbGVzLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IHRyZWVSZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpO1xuICAgIGNvbnN0IGZha2VPdXRwdXQgPSBmYWtlUmVhZCA/IGZha2VSZWFkKHRyZWVSZWxhdGl2ZVBhdGgpIDogbnVsbDtcbiAgICBjb25zdCBidWZmZXIgPSBmYWtlT3V0cHV0ID09PSBudWxsID8gdHJlZS5yZWFkKHRyZWVSZWxhdGl2ZVBhdGgpIDogZmFrZU91dHB1dDtcbiAgICAvLyBTdHJpcCBCT00gYXMgb3RoZXJ3aXNlIFRTQyBtZXRob2RzIChFeDogZ2V0V2lkdGgpIHdpbGwgcmV0dXJuIGFuIG9mZnNldCxcbiAgICAvLyB3aGljaCBicmVha3MgdGhlIENMSSBVcGRhdGVSZWNvcmRlci5cbiAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC8zMDcxOVxuICAgIHJldHVybiBidWZmZXIgPyBidWZmZXIudG9TdHJpbmcoKS5yZXBsYWNlKC9eXFx1RkVGRi8sICcnKSA6IHVuZGVmaW5lZDtcbiAgfTtcblxuICByZXR1cm4gaG9zdDtcbn1cbiJdfQ==