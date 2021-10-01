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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
    const typescript_1 = __importDefault(require("typescript"));
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
            const { line, character } = typescript_1.default.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9taXNzaW5nLWluamVjdGFibGUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCwyREFBNkY7SUFDN0YsK0JBQThCO0lBQzlCLDREQUE0QjtJQUM1QixrR0FBMkU7SUFDM0UsMkZBQTRGO0lBQzVGLHNIQUE2RDtJQUM3RCxnR0FBdUQ7SUFHdkQsOERBQThEO0lBQzlEO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxHQUFxQixFQUFFLEVBQUU7WUFDakQsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxNQUFNLElBQUEsZ0RBQXVCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztZQUU5QixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsd0ZBQXdGO29CQUN4Rix1Q0FBdUMsQ0FBQyxDQUFDO2FBQzlDO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hELFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyw2QkFBNkIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7YUFDL0U7WUFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ25CLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHVEQUF1RCxDQUFDLENBQUM7Z0JBQ3pFLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7Z0JBQzdELFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNoRTtRQUNILENBQUMsQ0FBQSxDQUFDO0lBQ0osQ0FBQztJQXRCRCw0QkFzQkM7SUFFRCxTQUFTLDZCQUE2QixDQUNsQyxJQUFVLEVBQUUsWUFBb0IsRUFBRSxRQUFnQjtRQUNwRCxNQUFNLEVBQUMsT0FBTyxFQUFDLEdBQUcsSUFBQSxzQ0FBc0IsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztRQUM5QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLDRDQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sV0FBVyxHQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFjLEVBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRWpHLDRFQUE0RTtRQUM1RSxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFN0UsTUFBTSxFQUFDLGVBQWUsRUFBRSxrQkFBa0IsRUFBQyxHQUFHLG1CQUFtQixDQUFDO1FBQ2xFLE1BQU0sV0FBVyxHQUFHLElBQUksc0NBQTBCLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDbkYsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLEVBQWlDLENBQUM7UUFFakUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO1lBQzlDLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDO1NBQ3BELENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBRTtZQUM1QixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDNUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLGVBQVEsRUFBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDLEdBQ25CLG9CQUFFLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzVFLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxnQkFBZ0IsSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLFNBQVMsR0FBRyxDQUFDLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNoRixDQUFDLENBQUMsQ0FBQztRQUVILHNFQUFzRTtRQUN0RSxXQUFXLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFNUIsaUZBQWlGO1FBQ2pGLGtGQUFrRjtRQUNsRixrREFBa0Q7UUFDbEQsZUFBZSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBRTdELE9BQU8sUUFBUSxDQUFDO1FBRWhCLDhEQUE4RDtRQUM5RCxTQUFTLGlCQUFpQixDQUFDLFVBQXlCO1lBQ2xELElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDbkMsT0FBTyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBRSxDQUFDO2FBQ3pDO1lBQ0QsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGVBQVEsRUFBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDL0UsTUFBTSxRQUFRLEdBQW1CO2dCQUMvQixpQkFBaUIsQ0FBQyxJQUF5QixFQUFFLElBQVk7b0JBQ3ZELGlGQUFpRjtvQkFDakYsaUZBQWlGO29CQUNqRiwwRUFBMEU7b0JBQzFFLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDekQsQ0FBQztnQkFDRCxnQkFBZ0IsQ0FBQyxTQUF1QixFQUFFLE9BQWU7b0JBQ3ZELFlBQVksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO29CQUNoRSxZQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDMUQsQ0FBQztnQkFDRCxZQUFZLENBQUMsS0FBYSxFQUFFLFVBQWtCO29CQUM1QyxpRkFBaUY7b0JBQ2pGLGlGQUFpRjtvQkFDakYsMEVBQTBFO29CQUMxRSxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDN0MsQ0FBQztnQkFDRCxvQkFBb0IsQ0FBQyxhQUE4QixFQUFFLGdCQUF3QjtvQkFDM0UsWUFBWSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ3hFLFlBQVksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7Z0JBQ0QsbUJBQW1CLENBQUMsSUFBZ0MsRUFBRSxPQUFlO29CQUNuRSxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDdEQsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3JELENBQUM7Z0JBQ0QsWUFBWTtvQkFDVixJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2FBQ0YsQ0FBQztZQUNGLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtyZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge05nRGVmaW5pdGlvbkNvbGxlY3Rvcn0gZnJvbSAnLi9kZWZpbml0aW9uX2NvbGxlY3Rvcic7XG5pbXBvcnQge01pc3NpbmdJbmplY3RhYmxlVHJhbnNmb3JtfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFY5IFwibWlzc2luZyBASW5qZWN0YWJsZVwiIHNjaGVtYXRpYy4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGN0eDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGZhaWx1cmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgYWRkIHRoZSBcIkBJbmplY3RhYmxlXCIgZGVjb3JhdG9yIHRvIHByb3ZpZGVycyAnICtcbiAgICAgICAgICAnd2hpY2ggZG9uXFwndCBoYXZlIHRoYXQgZGVjb3JhdG9yIHNldC4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXSkge1xuICAgICAgZmFpbHVyZXMucHVzaCguLi5ydW5NaXNzaW5nSW5qZWN0YWJsZU1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKSk7XG4gICAgfVxuXG4gICAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdDb3VsZCBub3QgbWlncmF0ZSBhbGwgcHJvdmlkZXJzIGF1dG9tYXRpY2FsbHkuIFBsZWFzZScpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdtYW51YWxseSBtaWdyYXRlIHRoZSBmb2xsb3dpbmcgaW5zdGFuY2VzOicpO1xuICAgICAgZmFpbHVyZXMuZm9yRWFjaChtZXNzYWdlID0+IGN0eC5sb2dnZXIud2Fybihg4q6RICAgJHttZXNzYWdlfWApKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bk1pc3NpbmdJbmplY3RhYmxlTWlncmF0aW9uKFxuICAgIHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKTogc3RyaW5nW10ge1xuICBjb25zdCB7cHJvZ3JhbX0gPSBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IGRlZmluaXRpb25Db2xsZWN0b3IgPSBuZXcgTmdEZWZpbml0aW9uQ29sbGVjdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIGFsbCBtb2R1bGVzLCBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gZGVmaW5pdGlvbkNvbGxlY3Rvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtyZXNvbHZlZE1vZHVsZXMsIHJlc29sdmVkRGlyZWN0aXZlc30gPSBkZWZpbml0aW9uQ29sbGVjdG9yO1xuICBjb25zdCB0cmFuc2Zvcm1lciA9IG5ldyBNaXNzaW5nSW5qZWN0YWJsZVRyYW5zZm9ybSh0eXBlQ2hlY2tlciwgZ2V0VXBkYXRlUmVjb3JkZXIpO1xuICBjb25zdCB1cGRhdGVSZWNvcmRlcnMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIFVwZGF0ZVJlY29yZGVyPigpO1xuXG4gIFsuLi50cmFuc2Zvcm1lci5taWdyYXRlTW9kdWxlcyhyZXNvbHZlZE1vZHVsZXMpLFxuICAgLi4udHJhbnNmb3JtZXIubWlncmF0ZURpcmVjdGl2ZXMocmVzb2x2ZWREaXJlY3RpdmVzKSxcbiAgXS5mb3JFYWNoKCh7bWVzc2FnZSwgbm9kZX0pID0+IHtcbiAgICBjb25zdCBub2RlU291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IHJlbGF0aXZlRmlsZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgbm9kZVNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgIGNvbnN0IHtsaW5lLCBjaGFyYWN0ZXJ9ID1cbiAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24obm9kZS5nZXRTb3VyY2VGaWxlKCksIG5vZGUuZ2V0U3RhcnQoKSk7XG4gICAgZmFpbHVyZXMucHVzaChgJHtyZWxhdGl2ZUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke21lc3NhZ2V9YCk7XG4gIH0pO1xuXG4gIC8vIFJlY29yZCB0aGUgY2hhbmdlcyBjb2xsZWN0ZWQgaW4gdGhlIGltcG9ydCBtYW5hZ2VyIGFuZCB0cmFuc2Zvcm1lci5cbiAgdHJhbnNmb3JtZXIucmVjb3JkQ2hhbmdlcygpO1xuXG4gIC8vIFdhbGsgdGhyb3VnaCBlYWNoIHVwZGF0ZSByZWNvcmRlciBhbmQgY29tbWl0IHRoZSB1cGRhdGUuIFdlIG5lZWQgdG8gY29tbWl0IHRoZVxuICAvLyB1cGRhdGVzIGluIGJhdGNoZXMgcGVyIHNvdXJjZSBmaWxlIGFzIHRoZXJlIGNhbiBiZSBvbmx5IG9uZSByZWNvcmRlciBwZXIgc291cmNlXG4gIC8vIGZpbGUgaW4gb3JkZXIgdG8gYXZvaWQgc2hpZnQgY2hhcmFjdGVyIG9mZnNldHMuXG4gIHVwZGF0ZVJlY29yZGVycy5mb3JFYWNoKHJlY29yZGVyID0+IHJlY29yZGVyLmNvbW1pdFVwZGF0ZSgpKTtcblxuICByZXR1cm4gZmFpbHVyZXM7XG5cbiAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgdGhlIHNwZWNpZmllZCBzb3VyY2UgZmlsZS4gKi9cbiAgZnVuY3Rpb24gZ2V0VXBkYXRlUmVjb3JkZXIoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBpZiAodXBkYXRlUmVjb3JkZXJzLmhhcyhzb3VyY2VGaWxlKSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVJlY29yZGVycy5nZXQoc291cmNlRmlsZSkhO1xuICAgIH1cbiAgICBjb25zdCB0cmVlUmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG4gICAgY29uc3QgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyID0ge1xuICAgICAgYWRkQ2xhc3NEZWNvcmF0b3Iobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KG5vZGUuZ2V0U3RhcnQoKSwgYCR7dGV4dH1cXG5gKTtcbiAgICAgIH0sXG4gICAgICByZXBsYWNlRGVjb3JhdG9yKGRlY29yYXRvcjogdHMuRGVjb3JhdG9yLCBuZXdUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLnJlbW92ZShkZWNvcmF0b3IuZ2V0U3RhcnQoKSwgZGVjb3JhdG9yLmdldFdpZHRoKCkpO1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQoZGVjb3JhdG9yLmdldFN0YXJ0KCksIG5ld1RleHQpO1xuICAgICAgfSxcbiAgICAgIGFkZE5ld0ltcG9ydChzdGFydDogbnVtYmVyLCBpbXBvcnRUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgLy8gTmV3IGltcG9ydHMgc2hvdWxkIGJlIGluc2VydGVkIGF0IHRoZSBsZWZ0IHdoaWxlIGRlY29yYXRvcnMgc2hvdWxkIGJlIGluc2VydGVkXG4gICAgICAgIC8vIGF0IHRoZSByaWdodCBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCBpbXBvcnRzIGFyZSBpbnNlcnRlZCBiZWZvcmUgdGhlIGRlY29yYXRvclxuICAgICAgICAvLyBpZiB0aGUgc3RhcnQgcG9zaXRpb24gb2YgaW1wb3J0IGFuZCBkZWNvcmF0b3IgaXMgdGhlIHNvdXJjZSBmaWxlIHN0YXJ0LlxuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0TGVmdChzdGFydCwgaW1wb3J0VGV4dCk7XG4gICAgICB9LFxuICAgICAgdXBkYXRlRXhpc3RpbmdJbXBvcnQobmFtZWRCaW5kaW5nczogdHMuTmFtZWRJbXBvcnRzLCBuZXdOYW1lZEJpbmRpbmdzOiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLnJlbW92ZShuYW1lZEJpbmRpbmdzLmdldFN0YXJ0KCksIG5hbWVkQmluZGluZ3MuZ2V0V2lkdGgoKSk7XG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChuYW1lZEJpbmRpbmdzLmdldFN0YXJ0KCksIG5ld05hbWVkQmluZGluZ3MpO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZU9iamVjdExpdGVyYWwobm9kZTogdHMuT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24sIG5ld1RleHQ6IHN0cmluZykge1xuICAgICAgICB0cmVlUmVjb3JkZXIucmVtb3ZlKG5vZGUuZ2V0U3RhcnQoKSwgbm9kZS5nZXRXaWR0aCgpKTtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KG5vZGUuZ2V0U3RhcnQoKSwgbmV3VGV4dCk7XG4gICAgICB9LFxuICAgICAgY29tbWl0VXBkYXRlKCkge1xuICAgICAgICB0cmVlLmNvbW1pdFVwZGF0ZSh0cmVlUmVjb3JkZXIpO1xuICAgICAgfVxuICAgIH07XG4gICAgdXBkYXRlUmVjb3JkZXJzLnNldChzb3VyY2VGaWxlLCByZWNvcmRlcik7XG4gICAgcmV0dXJuIHJlY29yZGVyO1xuICB9XG59XG4iXX0=