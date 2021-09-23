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
        define("@angular/core/schematics/migrations/missing-injectable", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/missing-injectable/definition_collector", "@angular/core/schematics/migrations/missing-injectable/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const definition_collector_1 = require("@angular/core/schematics/migrations/missing-injectable/definition_collector");
    const transform_1 = require("@angular/core/schematics/migrations/missing-injectable/transform");
    /** Entry point for the V9 "missing @Injectable" schematic. */
    function default_1() {
        return (tree, ctx) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const failures = [];
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot add the "@Injectable" decorator to providers ' +
                    'which don\'t have that decorator set.');
            }
            for (const tsconfigPath of [...buildPaths, ...testPaths]) {
                failures.push(...runMissingInjectableMigration(tree, tsconfigPath, basePath));
            }
            if (failures.length) {
                ctx.logger.info('Could not migrate all providers automatically. Please');
                ctx.logger.info('manually migrate the following instances:');
                failures.forEach(message => ctx.logger.warn(`⮑   ${message}`));
            }
        });
    }
    exports.default = default_1;
    function runMissingInjectableMigration(tree, tsconfigPath, basePath) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const failures = [];
        const typeChecker = program.getTypeChecker();
        const definitionCollector = new definition_collector_1.NgDefinitionCollector(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        // Analyze source files by detecting all modules, directives and components.
        sourceFiles.forEach(sourceFile => definitionCollector.visitNode(sourceFile));
        const { resolvedModules, resolvedDirectives } = definitionCollector;
        const transformer = new transform_1.MissingInjectableTransform(typeChecker, getUpdateRecorder);
        const updateRecorders = new Map();
        [...transformer.migrateModules(resolvedModules),
            ...transformer.migrateDirectives(resolvedDirectives),
        ].forEach(({ message, node }) => {
            const nodeSourceFile = node.getSourceFile();
            const relativeFilePath = (0, path_1.relative)(basePath, nodeSourceFile.fileName);
            const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
            failures.push(`${relativeFilePath}@${line + 1}:${character + 1}: ${message}`);
        });
        // Record the changes collected in the import manager and transformer.
        transformer.recordChanges();
        // Walk through each update recorder and commit the update. We need to commit the
        // updates in batches per source file as there can be only one recorder per source
        // file in order to avoid shift character offsets.
        updateRecorders.forEach(recorder => recorder.commitUpdate());
        return failures;
        /** Gets the update recorder for the specified source file. */
        function getUpdateRecorder(sourceFile) {
            if (updateRecorders.has(sourceFile)) {
                return updateRecorders.get(sourceFile);
            }
            const treeRecorder = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            const recorder = {
                addClassDecorator(node, text) {
                    // New imports should be inserted at the left while decorators should be inserted
                    // at the right in order to ensure that imports are inserted before the decorator
                    // if the start position of import and decorator is the source file start.
                    treeRecorder.insertRight(node.getStart(), `${text}\n`);
                },
                replaceDecorator(decorator, newText) {
                    treeRecorder.remove(decorator.getStart(), decorator.getWidth());
                    treeRecorder.insertRight(decorator.getStart(), newText);
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
                updateObjectLiteral(node, newText) {
                    treeRecorder.remove(node.getStart(), node.getWidth());
                    treeRecorder.insertRight(node.getStart(), newText);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9taXNzaW5nLWluamVjdGFibGUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCwyREFBNkY7SUFDN0YsK0JBQThCO0lBQzlCLGlDQUFpQztJQUNqQyxrR0FBMkU7SUFDM0UsMkZBQTRGO0lBQzVGLHNIQUE2RDtJQUM3RCxnR0FBdUQ7SUFHdkQsOERBQThEO0lBQzlEO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxHQUFxQixFQUFFLEVBQUU7WUFDakQsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxNQUFNLElBQUEsZ0RBQXVCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztZQUU5QixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsd0ZBQXdGO29CQUN4Rix1Q0FBdUMsQ0FBQyxDQUFDO2FBQzlDO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hELFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyw2QkFBNkIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7YUFDL0U7WUFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ25CLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHVEQUF1RCxDQUFDLENBQUM7Z0JBQ3pFLEdBQUcsQ0FBQyxNQUFN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QUFZO29CQUNWLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7YUFDRixDQUFDO1lBQ0YsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDMUMsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQztJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2Nhbk1pZ3JhdGVGaWxlLCBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuaW1wb3J0IHtOZ0RlZmluaXRpb25Db2xsZWN0b3J9IGZyb20gJy4vZGVmaW5pdGlvbl9jb2xsZWN0b3InO1xuaW1wb3J0IHtNaXNzaW5nSW5qZWN0YWJsZVRyYW5zZm9ybX0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuaW1wb3J0IHtVcGRhdGVSZWNvcmRlcn0gZnJvbSAnLi91cGRhdGVfcmVjb3JkZXInO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOSBcIm1pc3NpbmcgQEluamVjdGFibGVcIiBzY2hlbWF0aWMuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlLCBjdHg6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGF3YWl0IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmICghYnVpbGRQYXRocy5sZW5ndGggJiYgIXRlc3RQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IGFkZCB0aGUgXCJASW5qZWN0YWJsZVwiIGRlY29yYXRvciB0byBwcm92aWRlcnMgJyArXG4gICAgICAgICAgJ3doaWNoIGRvblxcJ3QgaGF2ZSB0aGF0IGRlY29yYXRvciBzZXQuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc10pIHtcbiAgICAgIGZhaWx1cmVzLnB1c2goLi4ucnVuTWlzc2luZ0luamVjdGFibGVNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCkpO1xuICAgIH1cblxuICAgIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnQ291bGQgbm90IG1pZ3JhdGUgYWxsIHByb3ZpZGVycyBhdXRvbWF0aWNhbGx5LiBQbGVhc2UnKTtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnbWFudWFsbHkgbWlncmF0ZSB0aGUgZm9sbG93aW5nIGluc3RhbmNlczonKTtcbiAgICAgIGZhaWx1cmVzLmZvckVhY2gobWVzc2FnZSA9PiBjdHgubG9nZ2VyLndhcm4oYOKukSAgICR7bWVzc2FnZX1gKSk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5NaXNzaW5nSW5qZWN0YWJsZU1pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3Qge3Byb2dyYW19ID0gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbSh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBkZWZpbml0aW9uQ29sbGVjdG9yID0gbmV3IE5nRGVmaW5pdGlvbkNvbGxlY3Rvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID1cbiAgICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoc291cmNlRmlsZSA9PiBjYW5NaWdyYXRlRmlsZShiYXNlUGF0aCwgc291cmNlRmlsZSwgcHJvZ3JhbSkpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBhbGwgbW9kdWxlcywgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cy5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IGRlZmluaXRpb25Db2xsZWN0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7cmVzb2x2ZWRNb2R1bGVzLCByZXNvbHZlZERpcmVjdGl2ZXN9ID0gZGVmaW5pdGlvbkNvbGxlY3RvcjtcbiAgY29uc3QgdHJhbnNmb3JtZXIgPSBuZXcgTWlzc2luZ0luamVjdGFibGVUcmFuc2Zvcm0odHlwZUNoZWNrZXIsIGdldFVwZGF0ZVJlY29yZGVyKTtcbiAgY29uc3QgdXBkYXRlUmVjb3JkZXJzID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICBbLi4udHJhbnNmb3JtZXIubWlncmF0ZU1vZHVsZXMocmVzb2x2ZWRNb2R1bGVzKSxcbiAgIC4uLnRyYW5zZm9ybWVyLm1pZ3JhdGVEaXJlY3RpdmVzKHJlc29sdmVkRGlyZWN0aXZlcyksXG4gIF0uZm9yRWFjaCgoe21lc3NhZ2UsIG5vZGV9KSA9PiB7XG4gICAgY29uc3Qgbm9kZVNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCByZWxhdGl2ZUZpbGVQYXRoID0gcmVsYXRpdmUoYmFzZVBhdGgsIG5vZGVTb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKG5vZGUuZ2V0U291cmNlRmlsZSgpLCBub2RlLmdldFN0YXJ0KCkpO1xuICAgIGZhaWx1cmVzLnB1c2goYCR7cmVsYXRpdmVGaWxlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfTogJHttZXNzYWdlfWApO1xuICB9KTtcblxuICAvLyBSZWNvcmQgdGhlIGNoYW5nZXMgY29sbGVjdGVkIGluIHRoZSBpbXBvcnQgbWFuYWdlciBhbmQgdHJhbnNmb3JtZXIuXG4gIHRyYW5zZm9ybWVyLnJlY29yZENoYW5nZXMoKTtcblxuICAvLyBXYWxrIHRocm91Z2ggZWFjaCB1cGRhdGUgcmVjb3JkZXIgYW5kIGNvbW1pdCB0aGUgdXBkYXRlLiBXZSBuZWVkIHRvIGNvbW1pdCB0aGVcbiAgLy8gdXBkYXRlcyBpbiBiYXRjaGVzIHBlciBzb3VyY2UgZmlsZSBhcyB0aGVyZSBjYW4gYmUgb25seSBvbmUgcmVjb3JkZXIgcGVyIHNvdXJjZVxuICAvLyBmaWxlIGluIG9yZGVyIHRvIGF2b2lkIHNoaWZ0IGNoYXJhY3RlciBvZmZzZXRzLlxuICB1cGRhdGVSZWNvcmRlcnMuZm9yRWFjaChyZWNvcmRlciA9PiByZWNvcmRlci5jb21taXRVcGRhdGUoKSk7XG5cbiAgcmV0dXJuIGZhaWx1cmVzO1xuXG4gIC8qKiBHZXRzIHRoZSB1cGRhdGUgcmVjb3JkZXIgZm9yIHRoZSBzcGVjaWZpZWQgc291cmNlIGZpbGUuICovXG4gIGZ1bmN0aW9uIGdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBVcGRhdGVSZWNvcmRlciB7XG4gICAgaWYgKHVwZGF0ZVJlY29yZGVycy5oYXMoc291cmNlRmlsZSkpIHtcbiAgICAgIHJldHVybiB1cGRhdGVSZWNvcmRlcnMuZ2V0KHNvdXJjZUZpbGUpITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgIGNvbnN0IHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlciA9IHtcbiAgICAgIGFkZENsYXNzRGVjb3JhdG9yKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHRleHQ6IHN0cmluZykge1xuICAgICAgICAvLyBOZXcgaW1wb3J0cyBzaG91bGQgYmUgaW5zZXJ0ZWQgYXQgdGhlIGxlZnQgd2hpbGUgZGVjb3JhdG9ycyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAgICAgICAgLy8gYXQgdGhlIHJpZ2h0IGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IGltcG9ydHMgYXJlIGluc2VydGVkIGJlZm9yZSB0aGUgZGVjb3JhdG9yXG4gICAgICAgIC8vIGlmIHRoZSBzdGFydCBwb3NpdGlvbiBvZiBpbXBvcnQgYW5kIGRlY29yYXRvciBpcyB0aGUgc291cmNlIGZpbGUgc3RhcnQuXG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIGAke3RleHR9XFxuYCk7XG4gICAgICB9LFxuICAgICAgcmVwbGFjZURlY29yYXRvcihkZWNvcmF0b3I6IHRzLkRlY29yYXRvciwgbmV3VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUoZGVjb3JhdG9yLmdldFN0YXJ0KCksIGRlY29yYXRvci5nZXRXaWR0aCgpKTtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KGRlY29yYXRvci5nZXRTdGFydCgpLCBuZXdUZXh0KTtcbiAgICAgIH0sXG4gICAgICBhZGROZXdJbXBvcnQoc3RhcnQ6IG51bWJlciwgaW1wb3J0VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydExlZnQoc3RhcnQsIGltcG9ydFRleHQpO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZUV4aXN0aW5nSW1wb3J0KG5hbWVkQmluZGluZ3M6IHRzLk5hbWVkSW1wb3J0cywgbmV3TmFtZWRCaW5kaW5nczogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuYW1lZEJpbmRpbmdzLmdldFdpZHRoKCkpO1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuZXdOYW1lZEJpbmRpbmdzKTtcbiAgICAgIH0sXG4gICAgICB1cGRhdGVPYmplY3RMaXRlcmFsKG5vZGU6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uLCBuZXdUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLnJlbW92ZShub2RlLmdldFN0YXJ0KCksIG5vZGUuZ2V0V2lkdGgoKSk7XG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIG5ld1RleHQpO1xuICAgICAgfSxcbiAgICAgIGNvbW1pdFVwZGF0ZSgpIHtcbiAgICAgICAgdHJlZS5jb21taXRVcGRhdGUodHJlZVJlY29yZGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuIl19