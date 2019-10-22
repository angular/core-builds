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
            logger.info('Read more about this in the dedicated guide: ');
            logger.info('https://v9.angular.io/guide/migration-undecorated-classes');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGVjb3JhdGVkLWZpZWxkcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJEQUE2RjtJQUM3RiwrQkFBdUM7SUFDdkMsaUNBQWlDO0lBQ2pDLGtHQUEyRTtJQUMzRSwyRkFBaUY7SUFDakYsNkZBQXdFO0lBQ3hFLCtHQUFpSTtJQUdqSTs7O09BR0c7SUFDSDtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUMvQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUVBQW1FLENBQUMsQ0FBQztZQUNqRixNQUFNLENBQUMsSUFBSSxDQUNQLG1FQUFtRTtnQkFDbkUsZ0VBQWdFLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsSUFBSSxDQUFDLCtDQUErQyxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLElBQUksQ0FBQywyREFBMkQsQ0FBQyxDQUFDO1lBR3pFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNwQixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLDJGQUEyRixDQUFDLENBQUM7YUFDbEc7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMsOEJBQThCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUM5RDtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUF4QkQsNEJBd0JDO0lBRUQsU0FBUyw4QkFBOEIsQ0FBQyxJQUFVLEVBQUUsWUFBb0IsRUFBRSxRQUFnQjtRQUN4RixNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FBQyxZQUFZLEVBQUUsY0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsMkNBQTJCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDekUsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUMvQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsT0FBTyxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFdkYsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMvQixNQUFNLE9BQU8sR0FBRyxnREFBd0MsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFbEYsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDeEIsT0FBTzthQUNSO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRXpFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ2pDLDhGQUE4RjtnQkFDOUYsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsc0JBQWMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsMEJBQWtCLENBQUMsRUFBRTtvQkFDakYsTUFBTSxZQUFZLEdBQUcsdUJBQWUsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFFaEUsSUFBSSxZQUFZLEVBQUU7d0JBQ2hCLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO3dCQUNoRSxNQUFNLENBQUMsV0FBVyxDQUNkLFlBQVksQ0FBQyxRQUFRLEVBQUUsRUFDdkIsT0FBTyxDQUFDLFNBQVMsQ0FDYixFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxpQkFBUyxDQUFDLFlBQVksRUFBRSwwQkFBa0IsQ0FBQyxFQUNwRSxVQUFVLENBQUMsQ0FBQyxDQUFDO3FCQUN0QjtpQkFDRjtnQkFFRCxrRkFBa0Y7Z0JBQ2xGLHNGQUFzRjtnQkFDdEYsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSwwQkFBa0IsTUFBTSxDQUFDLENBQUM7WUFDdkYsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2NyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcGFyc2VfdHNjb25maWcnO1xuaW1wb3J0IHtGQUxMQkFDS19ERUNPUkFUT1IsIGFkZEltcG9ydCwgZ2V0TmFtZWRJbXBvcnRzLCBnZXRVbmRlY29yYXRlZENsYXNzZXNXaXRoRGVjb3JhdGVkRmllbGRzLCBoYXNOYW1lZEltcG9ydH0gZnJvbSAnLi91dGlscyc7XG5cblxuLyoqXG4gKiBNaWdyYXRpb24gdGhhdCBhZGRzIGFuIEFuZ3VsYXIgZGVjb3JhdG9yIHRvIGNsYXNzZXMgdGhhdCBoYXZlIEFuZ3VsYXIgZmllbGQgZGVjb3JhdG9ycy5cbiAqIGh0dHBzOi8vaGFja21kLmlvL3Z1UWZhdnpmUkc2S1VDdFU3b0tfRUFcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG4gICAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG5cbiAgICBsb2dnZXIuaW5mbygnLS0tLS0tIFVuZGVjb3JhdGVkIGNsYXNzZXMgd2l0aCBkZWNvcmF0ZWQgZmllbGRzIG1pZ3JhdGlvbiAtLS0tLS0nKTtcbiAgICBsb2dnZXIuaW5mbyhcbiAgICAgICAgJ0FzIG9mIEFuZ3VsYXIgOSwgaXQgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCB0byBoYXZlIEFuZ3VsYXIgZmllbGQgJyArXG4gICAgICAgICdkZWNvcmF0b3JzIG9uIGEgY2xhc3MgdGhhdCBkb2VzIG5vdCBoYXZlIGFuIEFuZ3VsYXIgZGVjb3JhdG9yLicpO1xuICAgIGxvZ2dlci5pbmZvKCdSZWFkIG1vcmUgYWJvdXQgdGhpcyBpbiB0aGUgZGVkaWNhdGVkIGd1aWRlOiAnKTtcbiAgICBsb2dnZXIuaW5mbygnaHR0cHM6Ly92OS5hbmd1bGFyLmlvL2d1aWRlL21pZ3JhdGlvbi11bmRlY29yYXRlZC1jbGFzc2VzJyk7XG5cblxuICAgIGlmICghYWxsUGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBhZGQgYW4gQW5ndWxhciBkZWNvcmF0b3IgdG8gdW5kZWNvcmF0ZWQgY2xhc3Nlcy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBhbGxQYXRocykge1xuICAgICAgcnVuVW5kZWNvcmF0ZWRDbGFzc2VzTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuVW5kZWNvcmF0ZWRDbGFzc2VzTWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IGNyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdCh0cmVlLCBwYXJzZWQub3B0aW9ucywgYmFzZVBhdGgpO1xuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBmaWxlID0+ICFmaWxlLmlzRGVjbGFyYXRpb25GaWxlICYmICFwcm9ncmFtLmlzU291cmNlRmlsZUZyb21FeHRlcm5hbExpYnJhcnkoZmlsZSkpO1xuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgY29uc3QgY2xhc3NlcyA9IGdldFVuZGVjb3JhdGVkQ2xhc3Nlc1dpdGhEZWNvcmF0ZWRGaWVsZHMoc291cmNlRmlsZSwgdHlwZUNoZWNrZXIpO1xuXG4gICAgaWYgKGNsYXNzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuXG4gICAgY2xhc3Nlcy5mb3JFYWNoKChjdXJyZW50LCBpbmRleCkgPT4ge1xuICAgICAgLy8gSWYgaXQncyB0aGUgZmlyc3QgY2xhc3MgdGhhdCB3ZSdyZSBwcm9jZXNzaW5nIGluIHRoaXMgZmlsZSwgYWRkIGBEaXJlY3RpdmVgIHRvIHRoZSBpbXBvcnRzLlxuICAgICAgaWYgKGluZGV4ID09PSAwICYmICFoYXNOYW1lZEltcG9ydChjdXJyZW50LmltcG9ydERlY2xhcmF0aW9uLCBGQUxMQkFDS19ERUNPUkFUT1IpKSB7XG4gICAgICAgIGNvbnN0IG5hbWVkSW1wb3J0cyA9IGdldE5hbWVkSW1wb3J0cyhjdXJyZW50LmltcG9ydERlY2xhcmF0aW9uKTtcblxuICAgICAgICBpZiAobmFtZWRJbXBvcnRzKSB7XG4gICAgICAgICAgdXBkYXRlLnJlbW92ZShuYW1lZEltcG9ydHMuZ2V0U3RhcnQoKSwgbmFtZWRJbXBvcnRzLmdldFdpZHRoKCkpO1xuICAgICAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChcbiAgICAgICAgICAgICAgbmFtZWRJbXBvcnRzLmdldFN0YXJ0KCksXG4gICAgICAgICAgICAgIHByaW50ZXIucHJpbnROb2RlKFxuICAgICAgICAgICAgICAgICAgdHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIGFkZEltcG9ydChuYW1lZEltcG9ydHMsIEZBTExCQUNLX0RFQ09SQVRPUiksXG4gICAgICAgICAgICAgICAgICBzb3VyY2VGaWxlKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBnbyB0aHJvdWdoIHRoZSBBU1QgdG8gaW5zZXJ0IHRoZSBkZWNvcmF0b3IsIGJlY2F1c2UgdGhlIGNoYW5nZVxuICAgICAgLy8gaXMgcHJldHR5IGJhc2ljLiBBbHNvIHRoaXMgaGFzIGEgYmV0dGVyIGNoYW5jZSBvZiBwcmVzZXJ2aW5nIHRoZSB1c2VyJ3MgZm9ybWF0dGluZy5cbiAgICAgIHVwZGF0ZS5pbnNlcnRMZWZ0KGN1cnJlbnQuY2xhc3NEZWNsYXJhdGlvbi5nZXRTdGFydCgpLCBgQCR7RkFMTEJBQ0tfREVDT1JBVE9SfSgpXFxuYCk7XG4gICAgfSk7XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcbn1cbiJdfQ==