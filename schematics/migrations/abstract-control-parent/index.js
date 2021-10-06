/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/abstract-control-parent", ["require", "exports", "@angular-devkit/schematics", "path", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/abstract-control-parent/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const util_1 = require("@angular/core/schematics/migrations/abstract-control-parent/util");
    /** Migration that marks accesses of `AbstractControl.parent` as non-null. */
    function default_1() {
        return (tree) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate AbstractControl.parent accesses.');
            }
            for (const tsconfigPath of allPaths) {
                runNativeAbstractControlParentMigration(tree, tsconfigPath, basePath);
            }
        });
    }
    exports.default = default_1;
    function runNativeAbstractControlParentMigration(tree, tsconfigPath, basePath) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        sourceFiles.forEach(sourceFile => {
            // We sort the nodes based on their position in the file and we offset the positions by one
            // for each non-null assertion that we've added. We have to do it this way, rather than
            // creating and printing a new AST node like in other migrations, because property access
            // expressions can be nested (e.g. `control.parent.parent.value`), but the node positions
            // aren't being updated as we're inserting new code. If we were to go through the AST,
            // we'd have to update the `SourceFile` and start over after each operation.
            (0, util_1.findParentAccesses)(typeChecker, sourceFile)
                .sort((a, b) => a.getStart() - b.getStart())
                .forEach((node, index) => {
                const update = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
                update.insertRight(node.getStart() + node.getWidth() + index, '!');
                tree.commitUpdate(update);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9hYnN0cmFjdC1jb250cm9sLXBhcmVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDJEQUEyRTtJQUMzRSwrQkFBOEI7SUFFOUIsa0dBQTJFO0lBQzNFLDJGQUE0RjtJQUM1RiwyRkFBMEM7SUFHMUMsNkVBQTZFO0lBQzdFO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxFQUFFO1lBQzFCLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxJQUFBLGdEQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFFL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsbUZBQW1GLENBQUMsQ0FBQzthQUMxRjtZQUVELEtBQUssTUFBTSxZQUFZLElBQUksUUFBUSxFQUFFO2dCQUNuQyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ3ZFO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBZkQsNEJBZUM7SUFFRCxTQUFTLHVDQUF1QyxDQUM1QyxJQUFVLEVBQUUsWUFBb0IsRUFBRSxRQUFnQjtRQUNwRCxNQUFNLEVBQUMsT0FBTyxFQUFDLEdBQUcsSUFBQSxzQ0FBc0IsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3QyxNQUFNLFdBQVcsR0FDYixPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBQSw4QkFBYyxFQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUVqRyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQy9CLDJGQUEyRjtZQUMzRix1RkFBdUY7WUFDdkYseUZBQXlGO1lBQ3pGLHlGQUF5RjtZQUN6RixzRkFBc0Y7WUFDdEYsNEVBQTRFO1lBQzVFLElBQUEseUJBQWtCLEVBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQztpQkFDdEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztpQkFDM0MsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUEsZUFBUSxFQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDekUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQztRQUNULENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7cmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge2ZpbmRQYXJlbnRBY2Nlc3Nlc30gZnJvbSAnLi91dGlsJztcblxuXG4vKiogTWlncmF0aW9uIHRoYXQgbWFya3MgYWNjZXNzZXMgb2YgYEFic3RyYWN0Q29udHJvbC5wYXJlbnRgIGFzIG5vbi1udWxsLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAodHJlZTogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBBYnN0cmFjdENvbnRyb2wucGFyZW50IGFjY2Vzc2VzLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGFsbFBhdGhzKSB7XG4gICAgICBydW5OYXRpdmVBYnN0cmFjdENvbnRyb2xQYXJlbnRNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5OYXRpdmVBYnN0cmFjdENvbnRyb2xQYXJlbnRNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3Qge3Byb2dyYW19ID0gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbSh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID1cbiAgICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoc291cmNlRmlsZSA9PiBjYW5NaWdyYXRlRmlsZShiYXNlUGF0aCwgc291cmNlRmlsZSwgcHJvZ3JhbSkpO1xuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgLy8gV2Ugc29ydCB0aGUgbm9kZXMgYmFzZWQgb24gdGhlaXIgcG9zaXRpb24gaW4gdGhlIGZpbGUgYW5kIHdlIG9mZnNldCB0aGUgcG9zaXRpb25zIGJ5IG9uZVxuICAgIC8vIGZvciBlYWNoIG5vbi1udWxsIGFzc2VydGlvbiB0aGF0IHdlJ3ZlIGFkZGVkLiBXZSBoYXZlIHRvIGRvIGl0IHRoaXMgd2F5LCByYXRoZXIgdGhhblxuICAgIC8vIGNyZWF0aW5nIGFuZCBwcmludGluZyBhIG5ldyBBU1Qgbm9kZSBsaWtlIGluIG90aGVyIG1pZ3JhdGlvbnMsIGJlY2F1c2UgcHJvcGVydHkgYWNjZXNzXG4gICAgLy8gZXhwcmVzc2lvbnMgY2FuIGJlIG5lc3RlZCAoZS5nLiBgY29udHJvbC5wYXJlbnQucGFyZW50LnZhbHVlYCksIGJ1dCB0aGUgbm9kZSBwb3NpdGlvbnNcbiAgICAvLyBhcmVuJ3QgYmVpbmcgdXBkYXRlZCBhcyB3ZSdyZSBpbnNlcnRpbmcgbmV3IGNvZGUuIElmIHdlIHdlcmUgdG8gZ28gdGhyb3VnaCB0aGUgQVNULFxuICAgIC8vIHdlJ2QgaGF2ZSB0byB1cGRhdGUgdGhlIGBTb3VyY2VGaWxlYCBhbmQgc3RhcnQgb3ZlciBhZnRlciBlYWNoIG9wZXJhdGlvbi5cbiAgICBmaW5kUGFyZW50QWNjZXNzZXModHlwZUNoZWNrZXIsIHNvdXJjZUZpbGUpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLmdldFN0YXJ0KCkgLSBiLmdldFN0YXJ0KCkpXG4gICAgICAgIC5mb3JFYWNoKChub2RlLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHVwZGF0ZSA9IHRyZWUuYmVnaW5VcGRhdGUocmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcbiAgICAgICAgICB1cGRhdGUuaW5zZXJ0UmlnaHQobm9kZS5nZXRTdGFydCgpICsgbm9kZS5nZXRXaWR0aCgpICsgaW5kZXgsICchJyk7XG4gICAgICAgICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlKTtcbiAgICAgICAgfSk7XG4gIH0pO1xufVxuIl19