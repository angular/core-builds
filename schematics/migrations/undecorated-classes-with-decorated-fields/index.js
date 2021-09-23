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
        define("@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const transform_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields/transform");
    /**
     * Migration that adds an Angular decorator to classes that have Angular field decorators.
     * https://hackmd.io/vuQfavzfRG6KUCtU7oK_EA
     */
    function default_1() {
        return (tree, ctx) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            const failures = [];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot add an Angular decorator to undecorated classes.');
            }
            for (const tsconfigPath of allPaths) {
                failures.push(...runUndecoratedClassesMigration(tree, tsconfigPath, basePath));
            }
            if (failures.length) {
                ctx.logger.info('Could not migrate all undecorated classes that use Angular features.');
                ctx.logger.info('Please manually fix the following failures:');
                failures.forEach(message => ctx.logger.warn(`⮑   ${message}`));
            }
        });
    }
    exports.default = default_1;
    function runUndecoratedClassesMigration(tree, tsconfigPath, basePath) {
        const failures = [];
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        const updateRecorders = new Map();
        const transform = new transform_1.UndecoratedClassesWithDecoratedFieldsTransform(typeChecker, getUpdateRecorder);
        // Migrate all source files in the project.
        transform.migrate(sourceFiles).forEach(({ node, message }) => {
            const nodeSourceFile = node.getSourceFile();
            const relativeFilePath = (0, path_1.relative)(basePath, nodeSourceFile.fileName);
            const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
            failures.push(`${relativeFilePath}@${line + 1}:${character + 1}: ${message}`);
        });
        // Record the changes collected in the import manager.
        transform.recordChanges();
        // Walk through each update recorder and commit the update. We need to commit the
        // updates in batches per source file as there can be only one recorder per source
        // file in order to avoid shifted character offsets.
        updateRecorders.forEach(recorder => recorder.commitUpdate());
        return failures;
        /** Gets the update recorder for the specified source file. */
        function getUpdateRecorder(sourceFile) {
            if (updateRecorders.has(sourceFile)) {
                return updateRecorders.get(sourceFile);
            }
            const treeRecorder = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            const recorder = {
                addClassTodo(node, message) {
                    treeRecorder.insertRight(node.getStart(), `// TODO: ${message}\n`);
                },
                addClassDecorator(node, text) {
                    // New imports should be inserted at the left while decorators should be inserted
                    // at the right in order to ensure that imports are inserted before the decorator
                    // if the start position of import and decorator is the source file start.
                    treeRecorder.insertRight(node.getStart(), `${text}\n`);
                },
                addNewImport(start, importText) {
                    // New imports should be inserted at the left while decorators should be inserted
                    // at the right in order to ensure that imports are inserted before the decorator
                    // if the start position of import and decorator is the source file start.
                    treeRecorder.insertLeft(start, importText);
                },
                updateExistingImport(namedBindings, newNamedBindings) {
                    treeRecorder.remove(namedBindings.getStart(), namedBindings.getWidth());
                    treeRecorder.insertRight(namedBindings.getStart(), newNamedBindings);
                },
                commitUpdate() {
                    tree.commitUpdate(treeRecorder);
                }
            };
            updateRecorders.set(sourceFile, recorder);
            return recorder;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGVjb3JhdGVkLWZpZWxkcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDJEQUE4RjtJQUM5RiwrQkFBOEI7SUFDOUIsaUNBQWlDO0lBRWpDLGtHQUEyRTtJQUMzRSwyRkFBNEY7SUFFNUYsdUhBQTJFO0lBRzNFOzs7T0FHRztJQUNIO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxHQUFxQixFQUFFLEVBQUU7WUFDakQsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxNQUFNLElBQUEsZ0RBQXVCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUMvQyxNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7WUFFOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsMkZBQTJGLENBQUMsQ0FBQzthQUNsRztZQUVELEtBQUssTUFBTSxZQUFZLElBQUksUUFBUSxFQUFFO2dCQUNuQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsOEJBQThCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQ2hGO1lBRUQsSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNuQixHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxzRUFBc0UsQ0FBQyxDQUFDO2dCQUN4RixHQUFHLENBQUMsTUFB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SSxJQUFJLENBQUMsQ0FBQztnQkFDekQsQ0FBQztnQkFDRCxZQUFZLENBQUMsS0FBYSxFQUFFLFVBQWtCO29CQUM1QyxpRkFBaUY7b0JBQ2pGLGlGQUFpRjtvQkFDakYsMEVBQTBFO29CQUMxRSxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDN0MsQ0FBQztnQkFDRCxvQkFBb0IsQ0FBQyxhQUE4QixFQUFFLGdCQUF3QjtvQkFDM0UsWUFBWSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ3hFLFlBQVksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7Z0JBQ0QsWUFBWTtvQkFDVixJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2FBQ0YsQ0FBQztZQUNGLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZSx9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7cmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjYW5NaWdyYXRlRmlsZSwgY3JlYXRlTWlncmF0aW9uUHJvZ3JhbX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcblxuaW1wb3J0IHtVbmRlY29yYXRlZENsYXNzZXNXaXRoRGVjb3JhdGVkRmllbGRzVHJhbnNmb3JtfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbi8qKlxuICogTWlncmF0aW9uIHRoYXQgYWRkcyBhbiBBbmd1bGFyIGRlY29yYXRvciB0byBjbGFzc2VzIHRoYXQgaGF2ZSBBbmd1bGFyIGZpZWxkIGRlY29yYXRvcnMuXG4gKiBodHRwczovL2hhY2ttZC5pby92dVFmYXZ6ZlJHNktVQ3RVN29LX0VBXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGN0eDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG4gICAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgYWRkIGFuIEFuZ3VsYXIgZGVjb3JhdG9yIHRvIHVuZGVjb3JhdGVkIGNsYXNzZXMuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYWxsUGF0aHMpIHtcbiAgICAgIGZhaWx1cmVzLnB1c2goLi4ucnVuVW5kZWNvcmF0ZWRDbGFzc2VzTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ0NvdWxkIG5vdCBtaWdyYXRlIGFsbCB1bmRlY29yYXRlZCBjbGFzc2VzIHRoYXQgdXNlIEFuZ3VsYXIgZmVhdHVyZXMuJyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ1BsZWFzZSBtYW51YWxseSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlczonKTtcbiAgICAgIGZhaWx1cmVzLmZvckVhY2gobWVzc2FnZSA9PiBjdHgubG9nZ2VyLndhcm4oYOKukSAgICR7bWVzc2FnZX1gKSk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZhaWx1cmVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB7cHJvZ3JhbX0gPSBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG4gIGNvbnN0IHVwZGF0ZVJlY29yZGVycyA9IG5ldyBNYXA8dHMuU291cmNlRmlsZSwgVXBkYXRlUmVjb3JkZXI+KCk7XG4gIGNvbnN0IHRyYW5zZm9ybSA9XG4gICAgICBuZXcgVW5kZWNvcmF0ZWRDbGFzc2VzV2l0aERlY29yYXRlZEZpZWxkc1RyYW5zZm9ybSh0eXBlQ2hlY2tlciwgZ2V0VXBkYXRlUmVjb3JkZXIpO1xuXG4gIC8vIE1pZ3JhdGUgYWxsIHNvdXJjZSBmaWxlcyBpbiB0aGUgcHJvamVjdC5cbiAgdHJhbnNmb3JtLm1pZ3JhdGUoc291cmNlRmlsZXMpLmZvckVhY2goKHtub2RlLCBtZXNzYWdlfSkgPT4ge1xuICAgIGNvbnN0IG5vZGVTb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgcmVsYXRpdmVGaWxlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBub2RlU291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihub2RlLmdldFNvdXJjZUZpbGUoKSwgbm9kZS5nZXRTdGFydCgpKTtcbiAgICBmYWlsdXJlcy5wdXNoKGAke3JlbGF0aXZlRmlsZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX06ICR7bWVzc2FnZX1gKTtcbiAgfSk7XG5cbiAgLy8gUmVjb3JkIHRoZSBjaGFuZ2VzIGNvbGxlY3RlZCBpbiB0aGUgaW1wb3J0IG1hbmFnZXIuXG4gIHRyYW5zZm9ybS5yZWNvcmRDaGFuZ2VzKCk7XG5cbiAgLy8gV2FsayB0aHJvdWdoIGVhY2ggdXBkYXRlIHJlY29yZGVyIGFuZCBjb21taXQgdGhlIHVwZGF0ZS4gV2UgbmVlZCB0byBjb21taXQgdGhlXG4gIC8vIHVwZGF0ZXMgaW4gYmF0Y2hlcyBwZXIgc291cmNlIGZpbGUgYXMgdGhlcmUgY2FuIGJlIG9ubHkgb25lIHJlY29yZGVyIHBlciBzb3VyY2VcbiAgLy8gZmlsZSBpbiBvcmRlciB0byBhdm9pZCBzaGlmdGVkIGNoYXJhY3RlciBvZmZzZXRzLlxuICB1cGRhdGVSZWNvcmRlcnMuZm9yRWFjaChyZWNvcmRlciA9PiByZWNvcmRlci5jb21taXRVcGRhdGUoKSk7XG5cbiAgcmV0dXJuIGZhaWx1cmVzO1xuXG4gIC8qKiBHZXRzIHRoZSB1cGRhdGUgcmVjb3JkZXIgZm9yIHRoZSBzcGVjaWZpZWQgc291cmNlIGZpbGUuICovXG4gIGZ1bmN0aW9uIGdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBVcGRhdGVSZWNvcmRlciB7XG4gICAgaWYgKHVwZGF0ZVJlY29yZGVycy5oYXMoc291cmNlRmlsZSkpIHtcbiAgICAgIHJldHVybiB1cGRhdGVSZWNvcmRlcnMuZ2V0KHNvdXJjZUZpbGUpITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgIGNvbnN0IHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlciA9IHtcbiAgICAgIGFkZENsYXNzVG9kbyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KG5vZGUuZ2V0U3RhcnQoKSwgYC8vIFRPRE86ICR7bWVzc2FnZX1cXG5gKTtcbiAgICAgIH0sXG4gICAgICBhZGRDbGFzc0RlY29yYXRvcihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgLy8gTmV3IGltcG9ydHMgc2hvdWxkIGJlIGluc2VydGVkIGF0IHRoZSBsZWZ0IHdoaWxlIGRlY29yYXRvcnMgc2hvdWxkIGJlIGluc2VydGVkXG4gICAgICAgIC8vIGF0IHRoZSByaWdodCBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCBpbXBvcnRzIGFyZSBpbnNlcnRlZCBiZWZvcmUgdGhlIGRlY29yYXRvclxuICAgICAgICAvLyBpZiB0aGUgc3RhcnQgcG9zaXRpb24gb2YgaW1wb3J0IGFuZCBkZWNvcmF0b3IgaXMgdGhlIHNvdXJjZSBmaWxlIHN0YXJ0LlxuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobm9kZS5nZXRTdGFydCgpLCBgJHt0ZXh0fVxcbmApO1xuICAgICAgfSxcbiAgICAgIGFkZE5ld0ltcG9ydChzdGFydDogbnVtYmVyLCBpbXBvcnRUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgLy8gTmV3IGltcG9ydHMgc2hvdWxkIGJlIGluc2VydGVkIGF0IHRoZSBsZWZ0IHdoaWxlIGRlY29yYXRvcnMgc2hvdWxkIGJlIGluc2VydGVkXG4gICAgICAgIC8vIGF0IHRoZSByaWdodCBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCBpbXBvcnRzIGFyZSBpbnNlcnRlZCBiZWZvcmUgdGhlIGRlY29yYXRvclxuICAgICAgICAvLyBpZiB0aGUgc3RhcnQgcG9zaXRpb24gb2YgaW1wb3J0IGFuZCBkZWNvcmF0b3IgaXMgdGhlIHNvdXJjZSBmaWxlIHN0YXJ0LlxuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0TGVmdChzdGFydCwgaW1wb3J0VGV4dCk7XG4gICAgICB9LFxuICAgICAgdXBkYXRlRXhpc3RpbmdJbXBvcnQobmFtZWRCaW5kaW5nczogdHMuTmFtZWRJbXBvcnRzLCBuZXdOYW1lZEJpbmRpbmdzOiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLnJlbW92ZShuYW1lZEJpbmRpbmdzLmdldFN0YXJ0KCksIG5hbWVkQmluZGluZ3MuZ2V0V2lkdGgoKSk7XG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChuYW1lZEJpbmRpbmdzLmdldFN0YXJ0KCksIG5ld05hbWVkQmluZGluZ3MpO1xuICAgICAgfSxcbiAgICAgIGNvbW1pdFVwZGF0ZSgpIHtcbiAgICAgICAgdHJlZS5jb21taXRVcGRhdGUodHJlZVJlY29yZGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuIl19