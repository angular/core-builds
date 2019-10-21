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
        define("@angular/core/schematics/migrations/missing-injectable", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/missing-injectable/definition_collector", "@angular/core/schematics/migrations/missing-injectable/transform"], factory);
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
    const definition_collector_1 = require("@angular/core/schematics/migrations/missing-injectable/definition_collector");
    const transform_1 = require("@angular/core/schematics/migrations/missing-injectable/transform");
    /** Entry point for the V9 "missing @Injectable" schematic. */
    function default_1() {
        return (tree, ctx) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const failures = [];
            ctx.logger.info('------ Missing @Injectable migration ------');
            ctx.logger.info('In Angular 9, enforcement of @Injectable decorators for DI is a bit ');
            ctx.logger.info('stricter. Read more about this in the dedicated guide: ');
            ctx.logger.info('https://v9.angular.io/guide/migration-injectable');
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
            else {
                ctx.logger.info('Successfully migrated all undecorated providers.');
            }
            ctx.logger.info('-------------------------------------------');
        };
    }
    exports.default = default_1;
    function runMissingInjectableMigration(tree, tsconfigPath, basePath) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = compiler_host_1.createMigrationCompilerHost(tree, parsed.options, basePath);
        const failures = [];
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const definitionCollector = new definition_collector_1.NgDefinitionCollector(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        // Analyze source files by detecting all modules, directives and components.
        sourceFiles.forEach(sourceFile => definitionCollector.visitNode(sourceFile));
        const { resolvedModules, resolvedDirectives } = definitionCollector;
        const transformer = new transform_1.MissingInjectableTransform(typeChecker, getUpdateRecorder);
        const updateRecorders = new Map();
        [...transformer.migrateModules(resolvedModules),
            ...transformer.migrateDirectives(resolvedDirectives),
        ].forEach(({ message, node }) => {
            const nodeSourceFile = node.getSourceFile();
            const relativeFilePath = path_1.relative(basePath, nodeSourceFile.fileName);
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
            const treeRecorder = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
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
                commitUpdate() { tree.commitUpdate(treeRecorder); }
            };
            updateRecorders.set(sourceFile, recorder);
            return recorder;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9taXNzaW5nLWluamVjdGFibGUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyREFBNkY7SUFDN0YsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUNqQyxrR0FBMkU7SUFDM0UsMkZBQWlGO0lBQ2pGLDZGQUF3RTtJQUN4RSxzSEFBNkQ7SUFDN0QsZ0dBQXVEO0lBR3ZELDhEQUE4RDtJQUM5RDtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsR0FBcUIsRUFBRSxFQUFFO1lBQzNDLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztZQUU5QixHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1lBQy9ELEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHNFQUFzRSxDQUFDLENBQUM7WUFDeEYsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMseURBQXlELENBQUMsQ0FBQztZQUMzRSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1lBRXBFLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6Qix3RkFBd0Y7b0JBQ3hGLHVDQUF1QyxDQUFDLENBQUM7YUFDOUM7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRTtnQkFDeEQsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLDZCQUE2QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQzthQUMvRTtZQUVELElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDbkIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsdURBQXVELENBQUMsQ0FBQztnQkFDekUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsMkNBQTJDLENBQUMsQ0FBQztnQkFDN0QsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ2hFO2lCQUFNO2dCQUNMLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxDQUFDLENBQUM7YUFDckU7WUFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQztJQUNKLENBQUM7SUE5QkQsNEJBOEJDO0lBRUQsU0FBUyw2QkFBNkIsQ0FDbEMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDcEQsTUFBTSxNQUFNLEdBQUcsa0NBQWlCLENBQUMsWUFBWSxFQUFFLGNBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sSUFBSSxHQUFHLDJDQUEyQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztRQUU5QixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLDRDQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQy9DLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLElBQUksQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU5RSw0RUFBNEU7UUFDNUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRTdFLE1BQU0sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLEVBQUMsR0FBRyxtQkFBbUIsQ0FBQztRQUNsRSxNQUFNLFdBQVcsR0FBRyxJQUFJLHNDQUEwQixDQUFDLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25GLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1FBRWpFLENBQUMsR0FBRyxXQUFXLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQztZQUM5QyxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQztTQUNwRCxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxFQUFFLEVBQUU7WUFDNUIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzVDLE1BQU0sZ0JBQWdCLEdBQUcsZUFBUSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckUsTUFBTSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsR0FDbkIsRUFBRSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM1RSxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsZ0JBQWdCLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxzRUFBc0U7UUFDdEUsV0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRTVCLGlGQUFpRjtRQUNqRixrRkFBa0Y7UUFDbEYsa0RBQWtEO1FBQ2xELGVBQWUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUU3RCxPQUFPLFFBQVEsQ0FBQztRQUVoQiw4REFBOEQ7UUFDOUQsU0FBUyxpQkFBaUIsQ0FBQyxVQUF5QjtZQUNsRCxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ25DLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUcsQ0FBQzthQUMxQztZQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBUSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMvRSxNQUFNLFFBQVEsR0FBbUI7Z0JBQy9CLGlCQUFpQixDQUFDLElBQXlCLEVBQUUsSUFBWTtvQkFDdkQsaUZBQWlGO29CQUNqRixpRkFBaUY7b0JBQ2pGLDBFQUEwRTtvQkFDMUUsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO2dCQUNELGdCQUFnQixDQUFDLFNBQXVCLEVBQUUsT0FBZTtvQkFDdkQsWUFBWSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ2hFLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMxRCxDQUFDO2dCQUNELFlBQVksQ0FBQyxLQUFhLEVBQUUsVUFBa0I7b0JBQzVDLGlGQUFpRjtvQkFDakYsaUZBQWlGO29CQUNqRiwwRUFBMEU7b0JBQzFFLFlBQVksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO2dCQUNELG9CQUFvQixDQUFDLGFBQThCLEVBQUUsZ0JBQXdCO29CQUMzRSxZQUFZLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDeEUsWUFBWSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztnQkFDdkUsQ0FBQztnQkFDRCxZQUFZLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDcEQsQ0FBQztZQUNGLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y3JlYXRlTWlncmF0aW9uQ29tcGlsZXJIb3N0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZyc7XG5pbXBvcnQge05nRGVmaW5pdGlvbkNvbGxlY3Rvcn0gZnJvbSAnLi9kZWZpbml0aW9uX2NvbGxlY3Rvcic7XG5pbXBvcnQge01pc3NpbmdJbmplY3RhYmxlVHJhbnNmb3JtfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFY5IFwibWlzc2luZyBASW5qZWN0YWJsZVwiIHNjaGVtYXRpYy4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGN0eDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGZhaWx1cmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgY3R4LmxvZ2dlci5pbmZvKCctLS0tLS0gTWlzc2luZyBASW5qZWN0YWJsZSBtaWdyYXRpb24gLS0tLS0tJyk7XG4gICAgY3R4LmxvZ2dlci5pbmZvKCdJbiBBbmd1bGFyIDksIGVuZm9yY2VtZW50IG9mIEBJbmplY3RhYmxlIGRlY29yYXRvcnMgZm9yIERJIGlzIGEgYml0ICcpO1xuICAgIGN0eC5sb2dnZXIuaW5mbygnc3RyaWN0ZXIuIFJlYWQgbW9yZSBhYm91dCB0aGlzIGluIHRoZSBkZWRpY2F0ZWQgZ3VpZGU6ICcpO1xuICAgIGN0eC5sb2dnZXIuaW5mbygnaHR0cHM6Ly92OS5hbmd1bGFyLmlvL2d1aWRlL21pZ3JhdGlvbi1pbmplY3RhYmxlJyk7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBhZGQgdGhlIFwiQEluamVjdGFibGVcIiBkZWNvcmF0b3IgdG8gcHJvdmlkZXJzICcgK1xuICAgICAgICAgICd3aGljaCBkb25cXCd0IGhhdmUgdGhhdCBkZWNvcmF0b3Igc2V0LicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdKSB7XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLnJ1bk1pc3NpbmdJbmplY3RhYmxlTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ0NvdWxkIG5vdCBtaWdyYXRlIGFsbCBwcm92aWRlcnMgYXV0b21hdGljYWxseS4gUGxlYXNlJyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ21hbnVhbGx5IG1pZ3JhdGUgdGhlIGZvbGxvd2luZyBpbnN0YW5jZXM6Jyk7XG4gICAgICBmYWlsdXJlcy5mb3JFYWNoKG1lc3NhZ2UgPT4gY3R4LmxvZ2dlci53YXJuKGDirpEgICAke21lc3NhZ2V9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ1N1Y2Nlc3NmdWxseSBtaWdyYXRlZCBhbGwgdW5kZWNvcmF0ZWQgcHJvdmlkZXJzLicpO1xuICAgIH1cbiAgICBjdHgubG9nZ2VyLmluZm8oJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuTWlzc2luZ0luamVjdGFibGVNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IGNyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdCh0cmVlLCBwYXJzZWQub3B0aW9ucywgYmFzZVBhdGgpO1xuICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBkZWZpbml0aW9uQ29sbGVjdG9yID0gbmV3IE5nRGVmaW5pdGlvbkNvbGxlY3Rvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIGFsbCBtb2R1bGVzLCBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gZGVmaW5pdGlvbkNvbGxlY3Rvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtyZXNvbHZlZE1vZHVsZXMsIHJlc29sdmVkRGlyZWN0aXZlc30gPSBkZWZpbml0aW9uQ29sbGVjdG9yO1xuICBjb25zdCB0cmFuc2Zvcm1lciA9IG5ldyBNaXNzaW5nSW5qZWN0YWJsZVRyYW5zZm9ybSh0eXBlQ2hlY2tlciwgZ2V0VXBkYXRlUmVjb3JkZXIpO1xuICBjb25zdCB1cGRhdGVSZWNvcmRlcnMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIFVwZGF0ZVJlY29yZGVyPigpO1xuXG4gIFsuLi50cmFuc2Zvcm1lci5taWdyYXRlTW9kdWxlcyhyZXNvbHZlZE1vZHVsZXMpLFxuICAgLi4udHJhbnNmb3JtZXIubWlncmF0ZURpcmVjdGl2ZXMocmVzb2x2ZWREaXJlY3RpdmVzKSxcbiAgXS5mb3JFYWNoKCh7bWVzc2FnZSwgbm9kZX0pID0+IHtcbiAgICBjb25zdCBub2RlU291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IHJlbGF0aXZlRmlsZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgbm9kZVNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgIGNvbnN0IHtsaW5lLCBjaGFyYWN0ZXJ9ID1cbiAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24obm9kZS5nZXRTb3VyY2VGaWxlKCksIG5vZGUuZ2V0U3RhcnQoKSk7XG4gICAgZmFpbHVyZXMucHVzaChgJHtyZWxhdGl2ZUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke21lc3NhZ2V9YCk7XG4gIH0pO1xuXG4gIC8vIFJlY29yZCB0aGUgY2hhbmdlcyBjb2xsZWN0ZWQgaW4gdGhlIGltcG9ydCBtYW5hZ2VyIGFuZCB0cmFuc2Zvcm1lci5cbiAgdHJhbnNmb3JtZXIucmVjb3JkQ2hhbmdlcygpO1xuXG4gIC8vIFdhbGsgdGhyb3VnaCBlYWNoIHVwZGF0ZSByZWNvcmRlciBhbmQgY29tbWl0IHRoZSB1cGRhdGUuIFdlIG5lZWQgdG8gY29tbWl0IHRoZVxuICAvLyB1cGRhdGVzIGluIGJhdGNoZXMgcGVyIHNvdXJjZSBmaWxlIGFzIHRoZXJlIGNhbiBiZSBvbmx5IG9uZSByZWNvcmRlciBwZXIgc291cmNlXG4gIC8vIGZpbGUgaW4gb3JkZXIgdG8gYXZvaWQgc2hpZnQgY2hhcmFjdGVyIG9mZnNldHMuXG4gIHVwZGF0ZVJlY29yZGVycy5mb3JFYWNoKHJlY29yZGVyID0+IHJlY29yZGVyLmNvbW1pdFVwZGF0ZSgpKTtcblxuICByZXR1cm4gZmFpbHVyZXM7XG5cbiAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgdGhlIHNwZWNpZmllZCBzb3VyY2UgZmlsZS4gKi9cbiAgZnVuY3Rpb24gZ2V0VXBkYXRlUmVjb3JkZXIoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBpZiAodXBkYXRlUmVjb3JkZXJzLmhhcyhzb3VyY2VGaWxlKSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVJlY29yZGVycy5nZXQoc291cmNlRmlsZSkgITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgIGNvbnN0IHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlciA9IHtcbiAgICAgIGFkZENsYXNzRGVjb3JhdG9yKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHRleHQ6IHN0cmluZykge1xuICAgICAgICAvLyBOZXcgaW1wb3J0cyBzaG91bGQgYmUgaW5zZXJ0ZWQgYXQgdGhlIGxlZnQgd2hpbGUgZGVjb3JhdG9ycyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAgICAgICAgLy8gYXQgdGhlIHJpZ2h0IGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IGltcG9ydHMgYXJlIGluc2VydGVkIGJlZm9yZSB0aGUgZGVjb3JhdG9yXG4gICAgICAgIC8vIGlmIHRoZSBzdGFydCBwb3NpdGlvbiBvZiBpbXBvcnQgYW5kIGRlY29yYXRvciBpcyB0aGUgc291cmNlIGZpbGUgc3RhcnQuXG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIGAke3RleHR9XFxuYCk7XG4gICAgICB9LFxuICAgICAgcmVwbGFjZURlY29yYXRvcihkZWNvcmF0b3I6IHRzLkRlY29yYXRvciwgbmV3VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUoZGVjb3JhdG9yLmdldFN0YXJ0KCksIGRlY29yYXRvci5nZXRXaWR0aCgpKTtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KGRlY29yYXRvci5nZXRTdGFydCgpLCBuZXdUZXh0KTtcbiAgICAgIH0sXG4gICAgICBhZGROZXdJbXBvcnQoc3RhcnQ6IG51bWJlciwgaW1wb3J0VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydExlZnQoc3RhcnQsIGltcG9ydFRleHQpO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZUV4aXN0aW5nSW1wb3J0KG5hbWVkQmluZGluZ3M6IHRzLk5hbWVkSW1wb3J0cywgbmV3TmFtZWRCaW5kaW5nczogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuYW1lZEJpbmRpbmdzLmdldFdpZHRoKCkpO1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuZXdOYW1lZEJpbmRpbmdzKTtcbiAgICAgIH0sXG4gICAgICBjb21taXRVcGRhdGUoKSB7IHRyZWUuY29tbWl0VXBkYXRlKHRyZWVSZWNvcmRlcik7IH1cbiAgICB9O1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuIl19