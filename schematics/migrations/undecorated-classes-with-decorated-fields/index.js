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
        define("@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const utils_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields/utils");
    /**
     * Migration that adds an Angular decorator to classes that have Angular field decorators.
     * https://hackmd.io/vuQfavzfRG6KUCtU7oK_EA
     */
    function default_1() {
        return (tree, context) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            const logger = context.logger;
            logger.info('------ Undecorated classes with decorated fields migration ------');
            logger.info('As of Angular 9, it is no longer supported to have Angular field ' +
                'decorators on a class that does not have an Angular decorator.');
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot add an Angular decorator to undecorated classes.');
            }
            for (const tsconfigPath of allPaths) {
                runUndecoratedClassesMigration(tree, tsconfigPath, basePath);
            }
        };
    }
    exports.default = default_1;
    function runUndecoratedClassesMigration(tree, tsconfigPath, basePath) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = compiler_host_1.createMigrationCompilerHost(tree, parsed.options, basePath);
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const printer = ts.createPrinter();
        const sourceFiles = program.getSourceFiles().filter(file => !file.isDeclarationFile && !program.isSourceFileFromExternalLibrary(file));
        sourceFiles.forEach(sourceFile => {
            const classes = utils_1.getUndecoratedClassesWithDecoratedFields(sourceFile, typeChecker);
            if (classes.length === 0) {
                return;
            }
            const update = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
            classes.forEach((current, index) => {
                // If it's the first class that we're processing in this file, add `Directive` to the imports.
                if (index === 0 && !utils_1.hasNamedImport(current.importDeclaration, utils_1.FALLBACK_DECORATOR)) {
                    const namedImports = utils_1.getNamedImports(current.importDeclaration);
                    if (namedImports) {
                        update.remove(namedImports.getStart(), namedImports.getWidth());
                        update.insertRight(namedImports.getStart(), printer.printNode(ts.EmitHint.Unspecified, utils_1.addImport(namedImports, utils_1.FALLBACK_DECORATOR), sourceFile));
                    }
                }
                // We don't need to go through the AST to insert the decorator, because the change
                // is pretty basic. Also this has a better chance of preserving the user's formatting.
                update.insertLeft(current.classDeclaration.getStart(), `@${utils_1.FALLBACK_DECORATOR}()\n`);
            });
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGVjb3JhdGVkLWZpZWxkcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJEQUE2RjtJQUM3RiwrQkFBdUM7SUFDdkMsaUNBQWlDO0lBQ2pDLGtHQUEyRTtJQUMzRSwyRkFBaUY7SUFDakYsNkZBQXdFO0lBQ3hFLCtHQUFpSTtJQUdqSTs7O09BR0c7SUFDSDtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUMvQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUVBQW1FLENBQUMsQ0FBQztZQUNqRixNQUFNLENBQUMsSUFBSSxDQUNQLG1FQUFtRTtnQkFDbkUsZ0VBQWdFLENBQUMsQ0FBQztZQUV0RSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsTUFBTSxJQUFJLGdDQUFtQixDQUN6QiwyRkFBMkYsQ0FBQyxDQUFDO2FBQ2xHO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxRQUFRLEVBQUU7Z0JBQ25DLDhCQUE4QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDOUQ7UUFDSCxDQUFDLENBQUM7SUFDSixDQUFDO0lBckJELDRCQXFCQztJQUVELFNBQVMsOEJBQThCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDeEYsTUFBTSxNQUFNLEdBQUcsa0NBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLDJDQUEyQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbkMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FDL0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXZGLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDL0IsTUFBTSxPQUFPLEdBQUcsZ0RBQXdDLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWxGLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3hCLE9BQU87YUFDUjtZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBUSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUV6RSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNqQyw4RkFBOEY7Z0JBQzlGLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLHNCQUFjLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLDBCQUFrQixDQUFDLEVBQUU7b0JBQ2pGLE1BQU0sWUFBWSxHQUFHLHVCQUFlLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBRWhFLElBQUksWUFBWSxFQUFFO3dCQUNoQixNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzt3QkFDaEUsTUFBTSxDQUFDLFdBQVcsQ0FDZCxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQ3ZCLE9BQU8sQ0FBQyxTQUFTLENBQ2IsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsaUJBQVMsQ0FBQyxZQUFZLEVBQUUsMEJBQWtCLENBQUMsRUFDcEUsVUFBVSxDQUFDLENBQUMsQ0FBQztxQkFDdEI7aUJBQ0Y7Z0JBRUQsa0ZBQWtGO2dCQUNsRixzRkFBc0Y7Z0JBQ3RGLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksMEJBQWtCLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtkaXJuYW1lLCByZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3R9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3BhcnNlX3RzY29uZmlnJztcbmltcG9ydCB7RkFMTEJBQ0tfREVDT1JBVE9SLCBhZGRJbXBvcnQsIGdldE5hbWVkSW1wb3J0cywgZ2V0VW5kZWNvcmF0ZWRDbGFzc2VzV2l0aERlY29yYXRlZEZpZWxkcywgaGFzTmFtZWRJbXBvcnR9IGZyb20gJy4vdXRpbHMnO1xuXG5cbi8qKlxuICogTWlncmF0aW9uIHRoYXQgYWRkcyBhbiBBbmd1bGFyIGRlY29yYXRvciB0byBjbGFzc2VzIHRoYXQgaGF2ZSBBbmd1bGFyIGZpZWxkIGRlY29yYXRvcnMuXG4gKiBodHRwczovL2hhY2ttZC5pby92dVFmYXZ6ZlJHNktVQ3RVN29LX0VBXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBhbGxQYXRocyA9IFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdO1xuICAgIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuXG4gICAgbG9nZ2VyLmluZm8oJy0tLS0tLSBVbmRlY29yYXRlZCBjbGFzc2VzIHdpdGggZGVjb3JhdGVkIGZpZWxkcyBtaWdyYXRpb24gLS0tLS0tJyk7XG4gICAgbG9nZ2VyLmluZm8oXG4gICAgICAgICdBcyBvZiBBbmd1bGFyIDksIGl0IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgdG8gaGF2ZSBBbmd1bGFyIGZpZWxkICcgK1xuICAgICAgICAnZGVjb3JhdG9ycyBvbiBhIGNsYXNzIHRoYXQgZG9lcyBub3QgaGF2ZSBhbiBBbmd1bGFyIGRlY29yYXRvci4nKTtcblxuICAgIGlmICghYWxsUGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBhZGQgYW4gQW5ndWxhciBkZWNvcmF0b3IgdG8gdW5kZWNvcmF0ZWQgY2xhc3Nlcy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBhbGxQYXRocykge1xuICAgICAgcnVuVW5kZWNvcmF0ZWRDbGFzc2VzTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuVW5kZWNvcmF0ZWRDbGFzc2VzTWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IGNyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdCh0cmVlLCBwYXJzZWQub3B0aW9ucywgYmFzZVBhdGgpO1xuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBmaWxlID0+ICFmaWxlLmlzRGVjbGFyYXRpb25GaWxlICYmICFwcm9ncmFtLmlzU291cmNlRmlsZUZyb21FeHRlcm5hbExpYnJhcnkoZmlsZSkpO1xuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgY29uc3QgY2xhc3NlcyA9IGdldFVuZGVjb3JhdGVkQ2xhc3Nlc1dpdGhEZWNvcmF0ZWRGaWVsZHMoc291cmNlRmlsZSwgdHlwZUNoZWNrZXIpO1xuXG4gICAgaWYgKGNsYXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuXG4gICAgY2xhc3Nlcy5mb3JFYWNoKChjdXJyZW50LCBpbmRleCkgPT4ge1xuICAgICAgLy8gSWYgaXQncyB0aGUgZmlyc3QgY2xhc3MgdGhhdCB3ZSdyZSBwcm9jZXNzaW5nIGluIHRoaXMgZmlsZSwgYWRkIGBEaXJlY3RpdmVgIHRvIHRoZSBpbXBvcnRzLlxuICAgICAgaWYgKGluZGV4ID09PSAwICYmICFoYXNOYW1lZEltcG9ydChjdXJyZW50LmltcG9ydERlY2xhcmF0aW9uLCBGQUxMQkFDS19ERUNPUkFUT1IpKSB7XG4gICAgICAgIGNvbnN0IG5hbWVkSW1wb3J0cyA9IGdldE5hbWVkSW1wb3J0cyhjdXJyZW50LmltcG9ydERlY2xhcmF0aW9uKTtcblxuICAgICAgICBpZiAobmFtZWRJbXBvcnRzKSB7XG4gICAgICAgICAgdXBkYXRlLnJlbW92ZShuYW1lZEltcG9ydHMuZ2V0U3RhcnQoKSwgbmFtZWRJbXBvcnRzLmdldFdpZHRoKCkpO1xuICAgICAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChcbiAgICAgICAgICAgICAgbmFtZWRJbXBvcnRzLmdldFN0YXJ0KCksXG4gICAgICAgICAgICAgIHByaW50ZXIucHJpbnROb2RlKFxuICAgICAgICAgICAgICAgICAgdHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIGFkZEltcG9ydChuYW1lZEltcG9ydHMsIEZBTExCQUNLX0RFQ09SQVRPUiksXG4gICAgICAgICAgICAgICAgICBzb3VyY2VGaWxlKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBnbyB0aHJvdWdoIHRoZSBBU1QgdG8gaW5zZXJ0IHRoZSBkZWNvcmF0b3IsIGJlY2F1c2UgdGhlIGNoYW5nZVxuICAgICAgLy8gaXMgcHJldHR5IGJhc2ljLiBBbHNvIHRoaXMgaGFzIGEgYmV0dGVyIGNoYW5jZSBvZiBwcmVzZXJ2aW5nIHRoZSB1c2VyJ3MgZm9ybWF0dGluZy5cbiAgICAgIHVwZGF0ZS5pbnNlcnRMZWZ0KGN1cnJlbnQuY2xhc3NEZWNsYXJhdGlvbi5nZXRTdGFydCgpLCBgQCR7RkFMTEJBQ0tfREVDT1JBVE9SfSgpXFxuYCk7XG4gICAgfSk7XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcbn1cbiJdfQ==