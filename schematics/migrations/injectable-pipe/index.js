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
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        const printer = ts.createPrinter();
        sourceFiles.forEach(sourceFile => visitor.visitNode(sourceFile));
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
                    update.insertRight(namedImports.getStart(), printer.printNode(ts.EmitHint.Unspecified, util_1.addImport(namedImports, util_1.INJECTABLE_DECORATOR_NAME), sourceFile));
                }
            }
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9pbmplY3RhYmxlLXBpcGUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyREFBMkU7SUFDM0UsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxrR0FBMkU7SUFDM0UsNkZBQXdFO0lBRXhFLGlJQUF3RTtJQUN4RSxtRkFBNkU7SUFFN0U7OztPQUdHO0lBQ0g7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLEVBQUU7WUFDcEIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBRS9DLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNwQixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLDhFQUE4RSxDQUFDLENBQUM7YUFDckY7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUMxRDtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFmRCw0QkFlQztJQUVELFNBQVMsMEJBQTBCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDcEYsTUFBTSxNQUFNLEdBQUcsa0NBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpELDZFQUE2RTtRQUM3RSwrRUFBK0U7UUFDL0UsOEVBQThFO1FBQzlFLHlFQUF5RTtRQUN6RSxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNoRCxDQUFDLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSwrQ0FBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUMvQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixJQUFJLENBQUMsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUUsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRW5DLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFakUsT0FBTyxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM1QyxNQUFNLEVBQUMsZ0JBQWdCLEVBQUUsOEJBQThCLEVBQUMsR0FBRyxJQUFJLENBQUM7WUFDaEUsTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDcEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRXpFLDRGQUE0RjtZQUM1RixzRkFBc0Y7WUFDdEYsTUFBTSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLGdDQUF5QixNQUFNLENBQUMsQ0FBQztZQUVwRixnR0FBZ0c7WUFDaEcsOEZBQThGO1lBQzlGLDZGQUE2RjtZQUM3RixJQUFJLDhCQUE4QixFQUFFO2dCQUNsQyxNQUFNLFlBQVksR0FBRyxzQkFBZSxDQUFDLDhCQUE4QixDQUFDLENBQUM7Z0JBRXJFLElBQUksWUFBWSxFQUFFO29CQUNoQixNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FDZCxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQ3ZCLE9BQU8sQ0FBQyxTQUFTLENBQ2IsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsZ0JBQVMsQ0FBQyxZQUFZLEVBQUUsZ0NBQXlCLENBQUMsRUFDM0UsVUFBVSxDQUFDLENBQUMsQ0FBQztpQkFDdEI7YUFDRjtZQUVELElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZyc7XG5cbmltcG9ydCB7SW5qZWN0YWJsZVBpcGVWaXNpdG9yfSBmcm9tICcuL2FuZ3VsYXIvaW5qZWN0YWJsZV9waXBlX3Zpc2l0b3InO1xuaW1wb3J0IHtJTkpFQ1RBQkxFX0RFQ09SQVRPUl9OQU1FLCBhZGRJbXBvcnQsIGdldE5hbWVkSW1wb3J0c30gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBSdW5zIGEgbWlncmF0aW9uIG92ZXIgYSBUeXBlU2NyaXB0IHByb2plY3QgdGhhdCBhZGRzIGFuIGBASW5qZWN0YWJsZWBcbiAqIGFubm90YXRpb24gdG8gYWxsIGNsYXNzZXMgdGhhdCBoYXZlIGBAUGlwZWAuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBhbGxQYXRocyA9IFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdO1xuXG4gICAgaWYgKCFhbGxQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IGFkZCBJbmplY3RhYmxlIGFubm90YXRpb24gdG8gcGlwZXMuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYWxsUGF0aHMpIHtcbiAgICAgIHJ1bkluamVjdGFibGVQaXBlTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuSW5qZWN0YWJsZVBpcGVNaWdyYXRpb24odHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3QgcGFyc2VkID0gcGFyc2VUc2NvbmZpZ0ZpbGUodHNjb25maWdQYXRoLCBkaXJuYW1lKHRzY29uZmlnUGF0aCkpO1xuICBjb25zdCBob3N0ID0gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KHBhcnNlZC5vcHRpb25zLCB0cnVlKTtcblxuICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gIC8vIHByb2dyYW0gdG8gYmUgYmFzZWQgb24gdGhlIGZpbGUgY29udGVudHMgaW4gdGhlIHZpcnR1YWwgZmlsZSB0cmVlLiBPdGhlcndpc2VcbiAgLy8gaWYgd2UgcnVuIHRoZSBtaWdyYXRpb24gZm9yIG11bHRpcGxlIHRzY29uZmlnIGZpbGVzIHdoaWNoIGhhdmUgaW50ZXJzZWN0aW5nXG4gIC8vIHNvdXJjZSBmaWxlcywgaXQgY2FuIGVuZCB1cCB1cGRhdGluZyBxdWVyeSBkZWZpbml0aW9ucyBtdWx0aXBsZSB0aW1lcy5cbiAgaG9zdC5yZWFkRmlsZSA9IGZpbGVOYW1lID0+IHtcbiAgICBjb25zdCBidWZmZXIgPSB0cmVlLnJlYWQocmVsYXRpdmUoYmFzZVBhdGgsIGZpbGVOYW1lKSk7XG4gICAgcmV0dXJuIGJ1ZmZlciA/IGJ1ZmZlci50b1N0cmluZygpIDogdW5kZWZpbmVkO1xuICB9O1xuXG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHZpc2l0b3IgPSBuZXcgSW5qZWN0YWJsZVBpcGVWaXNpdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKFxuICAgICAgZiA9PiAhZi5pc0RlY2xhcmF0aW9uRmlsZSAmJiAhcHJvZ3JhbS5pc1NvdXJjZUZpbGVGcm9tRXh0ZXJuYWxMaWJyYXJ5KGYpKTtcbiAgY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcblxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gdmlzaXRvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIHZpc2l0b3IubWlzc2luZ0luamVjdGFibGVQaXBlcy5mb3JFYWNoKGRhdGEgPT4ge1xuICAgIGNvbnN0IHtjbGFzc0RlY2xhcmF0aW9uLCBpbXBvcnREZWNsYXJhdGlvbk1pc3NpbmdJbXBvcnR9ID0gZGF0YTtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gY2xhc3NEZWNsYXJhdGlvbi5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuXG4gICAgLy8gTm90ZSB0aGF0IHdlIGRvbid0IG5lZWQgdG8gZ28gdGhyb3VnaCB0aGUgQVNUIHRvIGluc2VydCB0aGUgZGVjb3JhdG9yLCBiZWNhdXNlIHRoZSBjaGFuZ2VcbiAgICAvLyBpcyBwcmV0dHkgYmFzaWMuIEFsc28gdGhpcyBoYXMgYSBiZXR0ZXIgY2hhbmNlIG9mIHByZXNlcnZpbmcgdGhlIHVzZXIncyBmb3JtYXR0aW5nLlxuICAgIHVwZGF0ZS5pbnNlcnRMZWZ0KGNsYXNzRGVjbGFyYXRpb24uZ2V0U3RhcnQoKSwgYEAke0lOSkVDVEFCTEVfREVDT1JBVE9SX05BTUV9KClcXG5gKTtcblxuICAgIC8vIEFkZCBASW5qZWN0YWJsZSB0byB0aGUgaW1wb3J0cyBpZiBpdCBpc24ndCBpbXBvcnRlZCBhbHJlYWR5LiBOb3RlIHRoYXQgdGhpcyBkb2Vzbid0IGRlYWwgd2l0aFxuICAgIC8vIHRoZSBjYXNlIHdoZXJlIHRoZXJlIGFyZW4ndCBhbnkgaW1wb3J0cyBmb3IgYEBhbmd1bGFyL2NvcmVgIGF0IGFsbC4gV2UgZG9uJ3QgbmVlZCB0byBoYW5kbGVcbiAgICAvLyBpdCBiZWNhdXNlIHRoZSBQaXBlIGRlY29yYXRvciB3b24ndCBiZSByZWNvZ25pemVkIGlmIGl0IGhhc24ndCBiZWVuIGltcG9ydGVkIGZyb20gQW5ndWxhci5cbiAgICBpZiAoaW1wb3J0RGVjbGFyYXRpb25NaXNzaW5nSW1wb3J0KSB7XG4gICAgICBjb25zdCBuYW1lZEltcG9ydHMgPSBnZXROYW1lZEltcG9ydHMoaW1wb3J0RGVjbGFyYXRpb25NaXNzaW5nSW1wb3J0KTtcblxuICAgICAgaWYgKG5hbWVkSW1wb3J0cykge1xuICAgICAgICB1cGRhdGUucmVtb3ZlKG5hbWVkSW1wb3J0cy5nZXRTdGFydCgpLCBuYW1lZEltcG9ydHMuZ2V0V2lkdGgoKSk7XG4gICAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChcbiAgICAgICAgICAgIG5hbWVkSW1wb3J0cy5nZXRTdGFydCgpLFxuICAgICAgICAgICAgcHJpbnRlci5wcmludE5vZGUoXG4gICAgICAgICAgICAgICAgdHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIGFkZEltcG9ydChuYW1lZEltcG9ydHMsIElOSkVDVEFCTEVfREVDT1JBVE9SX05BTUUpLFxuICAgICAgICAgICAgICAgIHNvdXJjZUZpbGUpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcbn1cbiJdfQ==