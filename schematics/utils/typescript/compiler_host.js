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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7SUFRQSwrQkFBZ0Q7SUFDaEQsaUNBQWlDO0lBQ2pDLDZGQUFtRDtJQUluRDs7Ozs7Ozs7O09BU0c7SUFDSCxTQUFnQixzQkFBc0IsQ0FDbEMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0IsRUFBRSxZQUE2QixFQUNqRixlQUEwQjtRQUM1Qix3RkFBd0Y7UUFDeEYsMkZBQTJGO1FBQzNGLGdGQUFnRjtRQUNoRixZQUFZLEdBQUcsY0FBTyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMvQyxNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FBQyxZQUFZLEVBQUUsY0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsMkJBQTJCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZGLE1BQU0sT0FBTyxHQUNULEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDM0YsT0FBTyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDLENBQUM7SUFDakMsQ0FBQztJQVpELHdEQVlDO0lBRUQsU0FBZ0IsMkJBQTJCLENBQ3ZDLElBQVUsRUFBRSxPQUEyQixFQUFFLFFBQWdCLEVBQ3pELFFBQXlCO1FBQzNCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFbEQsNkVBQTZFO1FBQzdFLCtFQUErRTtRQUMvRSx1RUFBdUU7UUFDdkUsZ0JBQWdCO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxnQkFBZ0IsR0FBRyxlQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNoRSxNQUFNLE1BQU0sR0FBRyxVQUFVLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztZQUM5RSwyRUFBMkU7WUFDM0UsdUNBQXVDO1lBQ3ZDLHFEQUFxRDtZQUNyRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN2RSxDQUFDLENBQUM7UUFFRixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFwQkQsa0VBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlLCByZXNvbHZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi9wYXJzZV90c2NvbmZpZyc7XG5cbmV4cG9ydCB0eXBlIEZha2VSZWFkRmlsZUZuID0gKGZpbGVOYW1lOiBzdHJpbmcpID0+IHN0cmluZyB8IG51bGw7XG5cbi8qKlxuICogQ3JlYXRlcyBhIFR5cGVTY3JpcHQgcHJvZ3JhbSBpbnN0YW5jZSBmb3IgYSBUeXBlU2NyaXB0IHByb2plY3Qgd2l0aGluXG4gKiB0aGUgdmlydHVhbCBmaWxlIHN5c3RlbSB0cmVlLlxuICogQHBhcmFtIHRyZWUgVmlydHVhbCBmaWxlIHN5c3RlbSB0cmVlIHRoYXQgY29udGFpbnMgdGhlIHNvdXJjZSBmaWxlcy5cbiAqIEBwYXJhbSB0c2NvbmZpZ1BhdGggVmlydHVhbCBmaWxlIHN5c3RlbSBwYXRoIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIFR5cGVTY3JpcHQgcHJvamVjdC5cbiAqIEBwYXJhbSBiYXNlUGF0aCBCYXNlIHBhdGggZm9yIHRoZSB2aXJ0dWFsIGZpbGUgc3lzdGVtIHRyZWUuXG4gKiBAcGFyYW0gZmFrZUZpbGVSZWFkIE9wdGlvbmFsIGZpbGUgcmVhZGVyIGZ1bmN0aW9uLiBDYW4gYmUgdXNlZCB0byBvdmVyd3JpdGUgZmlsZXMgaW5cbiAqICAgdGhlIFR5cGVTY3JpcHQgcHJvZ3JhbSwgb3IgdG8gYWRkIGluLW1lbW9yeSBmaWxlcyAoZS5nLiB0byBhZGQgZ2xvYmFsIHR5cGVzKS5cbiAqIEBwYXJhbSBhZGRpdGlvbmFsRmlsZXMgQWRkaXRpb25hbCBmaWxlIHBhdGhzIHRoYXQgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSBwcm9ncmFtLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbShcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZywgZmFrZUZpbGVSZWFkPzogRmFrZVJlYWRGaWxlRm4sXG4gICAgYWRkaXRpb25hbEZpbGVzPzogc3RyaW5nW10pIHtcbiAgLy8gUmVzb2x2ZSB0aGUgdHNjb25maWcgcGF0aCB0byBhbiBhYnNvbHV0ZSBwYXRoLiBUaGlzIGlzIG5lZWRlZCBhcyBUeXBlU2NyaXB0IG90aGVyd2lzZVxuICAvLyBpcyBub3QgYWJsZSB0byByZXNvbHZlIHJvb3QgZGlyZWN0b3JpZXMgaW4gdGhlIGdpdmVuIHRzY29uZmlnLiBNb3JlIGRldGFpbHMgY2FuIGJlIGZvdW5kXG4gIC8vIGluIHRoZSBmb2xsb3dpbmcgaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzc3MzEuXG4gIHRzY29uZmlnUGF0aCA9IHJlc29sdmUoYmFzZVBhdGgsIHRzY29uZmlnUGF0aCk7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IGNyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdCh0cmVlLCBwYXJzZWQub3B0aW9ucywgYmFzZVBhdGgsIGZha2VGaWxlUmVhZCk7XG4gIGNvbnN0IHByb2dyYW0gPVxuICAgICAgdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLmNvbmNhdChhZGRpdGlvbmFsRmlsZXMgfHwgW10pLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIHJldHVybiB7cGFyc2VkLCBob3N0LCBwcm9ncmFtfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdChcbiAgICB0cmVlOiBUcmVlLCBvcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnMsIGJhc2VQYXRoOiBzdHJpbmcsXG4gICAgZmFrZVJlYWQ/OiBGYWtlUmVhZEZpbGVGbik6IHRzLkNvbXBpbGVySG9zdCB7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3Qob3B0aW9ucywgdHJ1ZSk7XG5cbiAgLy8gV2UgbmVlZCB0byBvdmVyd3JpdGUgdGhlIGhvc3QgXCJyZWFkRmlsZVwiIG1ldGhvZCwgYXMgd2Ugd2FudCB0aGUgVHlwZVNjcmlwdFxuICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS4gT3RoZXJ3aXNlXG4gIC8vIGlmIHdlIHJ1biBtdWx0aXBsZSBtaWdyYXRpb25zIHdlIG1pZ2h0IGhhdmUgaW50ZXJzZWN0aW5nIGNoYW5nZXMgYW5kXG4gIC8vIHNvdXJjZSBmaWxlcy5cbiAgaG9zdC5yZWFkRmlsZSA9IGZpbGVOYW1lID0+IHtcbiAgICBjb25zdCB0cmVlUmVsYXRpdmVQYXRoID0gcmVsYXRpdmUoYmFzZVBhdGgsIGZpbGVOYW1lKTtcbiAgICBjb25zdCBmYWtlT3V0cHV0ID0gZmFrZVJlYWQgPyBmYWtlUmVhZCh0cmVlUmVsYXRpdmVQYXRoKSA6IG51bGw7XG4gICAgY29uc3QgYnVmZmVyID0gZmFrZU91dHB1dCA9PT0gbnVsbCA/IHRyZWUucmVhZCh0cmVlUmVsYXRpdmVQYXRoKSA6IGZha2VPdXRwdXQ7XG4gICAgLy8gU3RyaXAgQk9NIGFzIG90aGVyd2lzZSBUU0MgbWV0aG9kcyAoRXg6IGdldFdpZHRoKSB3aWxsIHJldHVybiBhbiBvZmZzZXQsXG4gICAgLy8gd2hpY2ggYnJlYWtzIHRoZSBDTEkgVXBkYXRlUmVjb3JkZXIuXG4gICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMzA3MTlcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkucmVwbGFjZSgvXlxcdUZFRkYvLCAnJykgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgcmV0dXJuIGhvc3Q7XG59XG4iXX0=