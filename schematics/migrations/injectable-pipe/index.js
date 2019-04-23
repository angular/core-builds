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
        define("@angular/core/schematics/migrations/injectable-pipe", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/injectable-pipe/angular/injectable_pipe_visitor", "@angular/core/schematics/migrations/injectable-pipe/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const injectable_pipe_visitor_1 = require("@angular/core/schematics/migrations/injectable-pipe/angular/injectable_pipe_visitor");
    const util_1 = require("@angular/core/schematics/migrations/injectable-pipe/util");
    /**
     * Runs a migration over a TypeScript project that adds an `@Injectable`
     * annotation to all classes that have `@Pipe`.
     */
    function default_1() {
        return (tree) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot add Injectable annotation to pipes.');
            }
            for (const tsconfigPath of allPaths) {
                runInjectablePipeMigration(tree, tsconfigPath, basePath);
            }
        };
    }
    exports.default = default_1;
    function runInjectablePipeMigration(tree, tsconfigPath, basePath) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = ts.createCompilerHost(parsed.options, true);
        // We need to overwrite the host "readFile" method, as we want the TypeScript
        // program to be based on the file contents in the virtual file tree. Otherwise
        // if we run the migration for multiple tsconfig files which have intersecting
        // source files, it can end up updating query definitions multiple times.
        host.readFile = fileName => {
            const buffer = tree.read(path_1.relative(basePath, fileName));
            return buffer ? buffer.toString() : undefined;
        };
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const visitor = new injectable_pipe_visitor_1.InjectablePipeVisitor(typeChecker);
        const rootSourceFiles = program.getRootFileNames().map(f => program.getSourceFile(f));
        const printer = ts.createPrinter();
        rootSourceFiles.forEach(sourceFile => visitor.visitNode(sourceFile));
        visitor.missingInjectablePipes.forEach(data => {
            const { classDeclaration, importDeclarationMissingImport } = data;
            const sourceFile = classDeclaration.getSourceFile();
            const update = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
            // Note that we don't need to go through the AST to insert the decorator, because the change
            // is pretty basic. Also this has a better chance of preserving the user's formatting.
            update.insertLeft(classDeclaration.getStart(), `@${util_1.INJECTABLE_DECORATOR_NAME}()\n`);
            // Add @Injectable to the imports if it isn't imported already. Note that this doesn't deal with
            // the case where there aren't any imports for `@angular/core` at all. We don't need to handle
            // it because the Pipe decorator won't be recognized if it hasn't been imported from Angular.
            if (importDeclarationMissingImport) {
                const namedImports = util_1.getNamedImports(importDeclarationMissingImport);
                if (namedImports) {
                    update.remove(namedImports.getStart(), namedImports.getWidth());
                    update.insertRight(namedImports.getStart(), printer.printNode(ts.EmitHint.Unspecified, util_1.addNamedImport(importDeclarationMissingImport, util_1.INJECTABLE_DECORATOR_NAME), sourceFile));
                }
            }
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9pbmplY3RhYmxlLXBpcGUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyREFBMkU7SUFDM0UsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxrR0FBMkU7SUFDM0UsNkZBQXdFO0lBRXhFLGlJQUF3RTtJQUN4RSxtRkFBa0Y7SUFFbEY7OztPQUdHO0lBQ0g7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLEVBQUU7WUFDcEIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBRS9DLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNwQixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLDhFQUE4RSxDQUFDLENBQUM7YUFDckY7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUMxRDtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFmRCw0QkFlQztJQUVELFNBQVMsMEJBQTBCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDcEYsTUFBTSxNQUFNLEdBQUcsa0NBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpELDZFQUE2RTtRQUM3RSwrRUFBK0U7UUFDL0UsOEVBQThFO1FBQzlFLHlFQUF5RTtRQUN6RSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNoRCxDQUFDLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSwrQ0FBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2RCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBRyxDQUFDLENBQUM7UUFDeEYsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRW5DLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFckUsT0FBTyxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM1QyxNQUFNLEVBQUMsZ0JBQWdCLEVBQUUsOEJBQThCLEVBQUMsR0FBRyxJQUFJLENBQUM7WUFDaEUsTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDcEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRXpFLDRGQUE0RjtZQUM1RixzRkFBc0Y7WUFDdEYsTUFBTSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLGdDQUF5QixNQUFNLENBQUMsQ0FBQztZQUVwRixnR0FBZ0c7WUFDaEcsOEZBQThGO1lBQzlGLDZGQUE2RjtZQUM3RixJQUFJLDhCQUE4QixFQUFFO2dCQUNsQyxNQUFNLFlBQVksR0FBRyxzQkFBZSxDQUFDLDhCQUE4QixDQUFDLENBQUM7Z0JBRXJFLElBQUksWUFBWSxFQUFFO29CQUNoQixNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FDZCxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQ3ZCLE9BQU8sQ0FBQyxTQUFTLENBQ2IsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQ3ZCLHFCQUFjLENBQUMsOEJBQThCLEVBQUUsZ0NBQXlCLENBQUMsRUFDekUsVUFBVSxDQUFDLENBQUMsQ0FBQztpQkFDdEI7YUFDRjtZQUVELElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZyc7XG5cbmltcG9ydCB7SW5qZWN0YWJsZVBpcGVWaXNpdG9yfSBmcm9tICcuL2FuZ3VsYXIvaW5qZWN0YWJsZV9waXBlX3Zpc2l0b3InO1xuaW1wb3J0IHtJTkpFQ1RBQkxFX0RFQ09SQVRPUl9OQU1FLCBhZGROYW1lZEltcG9ydCwgZ2V0TmFtZWRJbXBvcnRzfSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIFJ1bnMgYSBtaWdyYXRpb24gb3ZlciBhIFR5cGVTY3JpcHQgcHJvamVjdCB0aGF0IGFkZHMgYW4gYEBJbmplY3RhYmxlYFxuICogYW5ub3RhdGlvbiB0byBhbGwgY2xhc3NlcyB0aGF0IGhhdmUgYEBQaXBlYC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgYWRkIEluamVjdGFibGUgYW5ub3RhdGlvbiB0byBwaXBlcy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBhbGxQYXRocykge1xuICAgICAgcnVuSW5qZWN0YWJsZVBpcGVNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5JbmplY3RhYmxlUGlwZU1pZ3JhdGlvbih0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBob3N0IFwicmVhZEZpbGVcIiBtZXRob2QsIGFzIHdlIHdhbnQgdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuIE90aGVyd2lzZVxuICAvLyBpZiB3ZSBydW4gdGhlIG1pZ3JhdGlvbiBmb3IgbXVsdGlwbGUgdHNjb25maWcgZmlsZXMgd2hpY2ggaGF2ZSBpbnRlcnNlY3RpbmdcbiAgLy8gc291cmNlIGZpbGVzLCBpdCBjYW4gZW5kIHVwIHVwZGF0aW5nIHF1ZXJ5IGRlZmluaXRpb25zIG11bHRpcGxlIHRpbWVzLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgdmlzaXRvciA9IG5ldyBJbmplY3RhYmxlUGlwZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCByb290U291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFJvb3RGaWxlTmFtZXMoKS5tYXAoZiA9PiBwcm9ncmFtLmdldFNvdXJjZUZpbGUoZikgISk7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG5cbiAgcm9vdFNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB2aXNpdG9yLnZpc2l0Tm9kZShzb3VyY2VGaWxlKSk7XG5cbiAgdmlzaXRvci5taXNzaW5nSW5qZWN0YWJsZVBpcGVzLmZvckVhY2goZGF0YSA9PiB7XG4gICAgY29uc3Qge2NsYXNzRGVjbGFyYXRpb24sIGltcG9ydERlY2xhcmF0aW9uTWlzc2luZ0ltcG9ydH0gPSBkYXRhO1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBjbGFzc0RlY2xhcmF0aW9uLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgd2UgZG9uJ3QgbmVlZCB0byBnbyB0aHJvdWdoIHRoZSBBU1QgdG8gaW5zZXJ0IHRoZSBkZWNvcmF0b3IsIGJlY2F1c2UgdGhlIGNoYW5nZVxuICAgIC8vIGlzIHByZXR0eSBiYXNpYy4gQWxzbyB0aGlzIGhhcyBhIGJldHRlciBjaGFuY2Ugb2YgcHJlc2VydmluZyB0aGUgdXNlcidzIGZvcm1hdHRpbmcuXG4gICAgdXBkYXRlLmluc2VydExlZnQoY2xhc3NEZWNsYXJhdGlvbi5nZXRTdGFydCgpLCBgQCR7SU5KRUNUQUJMRV9ERUNPUkFUT1JfTkFNRX0oKVxcbmApO1xuXG4gICAgLy8gQWRkIEBJbmplY3RhYmxlIHRvIHRoZSBpbXBvcnRzIGlmIGl0IGlzbid0IGltcG9ydGVkIGFscmVhZHkuIE5vdGUgdGhhdCB0aGlzIGRvZXNuJ3QgZGVhbCB3aXRoXG4gICAgLy8gdGhlIGNhc2Ugd2hlcmUgdGhlcmUgYXJlbid0IGFueSBpbXBvcnRzIGZvciBgQGFuZ3VsYXIvY29yZWAgYXQgYWxsLiBXZSBkb24ndCBuZWVkIHRvIGhhbmRsZVxuICAgIC8vIGl0IGJlY2F1c2UgdGhlIFBpcGUgZGVjb3JhdG9yIHdvbid0IGJlIHJlY29nbml6ZWQgaWYgaXQgaGFzbid0IGJlZW4gaW1wb3J0ZWQgZnJvbSBBbmd1bGFyLlxuICAgIGlmIChpbXBvcnREZWNsYXJhdGlvbk1pc3NpbmdJbXBvcnQpIHtcbiAgICAgIGNvbnN0IG5hbWVkSW1wb3J0cyA9IGdldE5hbWVkSW1wb3J0cyhpbXBvcnREZWNsYXJhdGlvbk1pc3NpbmdJbXBvcnQpO1xuXG4gICAgICBpZiAobmFtZWRJbXBvcnRzKSB7XG4gICAgICAgIHVwZGF0ZS5yZW1vdmUobmFtZWRJbXBvcnRzLmdldFN0YXJ0KCksIG5hbWVkSW1wb3J0cy5nZXRXaWR0aCgpKTtcbiAgICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KFxuICAgICAgICAgICAgbmFtZWRJbXBvcnRzLmdldFN0YXJ0KCksXG4gICAgICAgICAgICBwcmludGVyLnByaW50Tm9kZShcbiAgICAgICAgICAgICAgICB0cy5FbWl0SGludC5VbnNwZWNpZmllZCxcbiAgICAgICAgICAgICAgICBhZGROYW1lZEltcG9ydChpbXBvcnREZWNsYXJhdGlvbk1pc3NpbmdJbXBvcnQsIElOSkVDVEFCTEVfREVDT1JBVE9SX05BTUUpLFxuICAgICAgICAgICAgICAgIHNvdXJjZUZpbGUpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcbn1cbiJdfQ==