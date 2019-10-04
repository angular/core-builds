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
        define("@angular/core/schematics/migrations/missing-injectable", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/missing-injectable/module_collector", "@angular/core/schematics/migrations/missing-injectable/transform"], factory);
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
    const module_collector_1 = require("@angular/core/schematics/migrations/missing-injectable/module_collector");
    const transform_1 = require("@angular/core/schematics/migrations/missing-injectable/transform");
    /** Entry point for the V9 "missing @Injectable" schematic. */
    function default_1() {
        return (tree, ctx) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const failures = [];
            ctx.logger.info('------ Missing @Injectable migration ------');
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
        const moduleCollector = new module_collector_1.NgModuleCollector(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        // Analyze source files by detecting all modules.
        sourceFiles.forEach(sourceFile => moduleCollector.visitNode(sourceFile));
        const { resolvedModules } = moduleCollector;
        const transformer = new transform_1.MissingInjectableTransform(typeChecker, getUpdateRecorder);
        const updateRecorders = new Map();
        resolvedModules.forEach(module => {
            transformer.migrateModule(module).forEach(({ message, node }) => {
                const nodeSourceFile = node.getSourceFile();
                const relativeFilePath = path_1.relative(basePath, nodeSourceFile.fileName);
                const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
                failures.push(`${relativeFilePath}@${line + 1}:${character + 1}: ${message}`);
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9taXNzaW5nLWluamVjdGFibGUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyREFBNkY7SUFDN0YsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUNqQyxrR0FBMkU7SUFDM0UsMkZBQWlGO0lBQ2pGLDZGQUF3RTtJQUN4RSw4R0FBcUQ7SUFDckQsZ0dBQXVEO0lBR3ZELDhEQUE4RDtJQUM5RDtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsR0FBcUIsRUFBRSxFQUFFO1lBQzNDLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztZQUU5QixHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6Qix3RkFBd0Y7b0JBQ3hGLHVDQUF1QyxDQUFDLENBQUM7YUFDOUM7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRTtnQkFDeEQsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLDZCQUE2QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQzthQUMvRTtZQUVELElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDbkIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJ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LEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ3hFLFlBQVksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7Z0JBQ0QsWUFBWSxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BELENBQUM7WUFDRixlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMxQyxPQUFPLFFBQVEsQ0FBQztRQUNsQixDQUFDO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2NyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcGFyc2VfdHNjb25maWcnO1xuaW1wb3J0IHtOZ01vZHVsZUNvbGxlY3Rvcn0gZnJvbSAnLi9tb2R1bGVfY29sbGVjdG9yJztcbmltcG9ydCB7TWlzc2luZ0luamVjdGFibGVUcmFuc2Zvcm19IGZyb20gJy4vdHJhbnNmb3JtJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjkgXCJtaXNzaW5nIEBJbmplY3RhYmxlXCIgc2NoZW1hdGljLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY3R4OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBjdHgubG9nZ2VyLmluZm8oJy0tLS0tLSBNaXNzaW5nIEBJbmplY3RhYmxlIG1pZ3JhdGlvbiAtLS0tLS0nKTtcbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBhZGQgdGhlIFwiQEluamVjdGFibGVcIiBkZWNvcmF0b3IgdG8gcHJvdmlkZXJzICcgK1xuICAgICAgICAgICd3aGljaCBkb25cXCd0IGhhdmUgdGhhdCBkZWNvcmF0b3Igc2V0LicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdKSB7XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLnJ1bk1pc3NpbmdJbmplY3RhYmxlTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ0NvdWxkIG5vdCBtaWdyYXRlIGFsbCBwcm92aWRlcnMgYXV0b21hdGljYWxseS4gUGxlYXNlJyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ21hbnVhbGx5IG1pZ3JhdGUgdGhlIGZvbGxvd2luZyBpbnN0YW5jZXM6Jyk7XG4gICAgICBmYWlsdXJlcy5mb3JFYWNoKG1lc3NhZ2UgPT4gY3R4LmxvZ2dlci53YXJuKGDirpEgICAke21lc3NhZ2V9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ1N1Y2Nlc3NmdWxseSBtaWdyYXRlZCBhbGwgdW5kZWNvcmF0ZWQgcHJvdmlkZXJzLicpO1xuICAgIH1cbiAgICBjdHgubG9nZ2VyLmluZm8oJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuTWlzc2luZ0luamVjdGFibGVNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IGNyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdCh0cmVlLCBwYXJzZWQub3B0aW9ucywgYmFzZVBhdGgpO1xuICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBtb2R1bGVDb2xsZWN0b3IgPSBuZXcgTmdNb2R1bGVDb2xsZWN0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBmID0+ICFmLmlzRGVjbGFyYXRpb25GaWxlICYmICFwcm9ncmFtLmlzU291cmNlRmlsZUZyb21FeHRlcm5hbExpYnJhcnkoZikpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBhbGwgbW9kdWxlcy5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IG1vZHVsZUNvbGxlY3Rvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtyZXNvbHZlZE1vZHVsZXN9ID0gbW9kdWxlQ29sbGVjdG9yO1xuICBjb25zdCB0cmFuc2Zvcm1lciA9IG5ldyBNaXNzaW5nSW5qZWN0YWJsZVRyYW5zZm9ybSh0eXBlQ2hlY2tlciwgZ2V0VXBkYXRlUmVjb3JkZXIpO1xuICBjb25zdCB1cGRhdGVSZWNvcmRlcnMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIFVwZGF0ZVJlY29yZGVyPigpO1xuXG4gIHJlc29sdmVkTW9kdWxlcy5mb3JFYWNoKG1vZHVsZSA9PiB7XG4gICAgdHJhbnNmb3JtZXIubWlncmF0ZU1vZHVsZShtb2R1bGUpLmZvckVhY2goKHttZXNzYWdlLCBub2RlfSkgPT4ge1xuICAgICAgY29uc3Qgbm9kZVNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIGNvbnN0IHJlbGF0aXZlRmlsZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgbm9kZVNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKG5vZGUuZ2V0U291cmNlRmlsZSgpLCBub2RlLmdldFN0YXJ0KCkpO1xuICAgICAgZmFpbHVyZXMucHVzaChgJHtyZWxhdGl2ZUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke21lc3NhZ2V9YCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIFJlY29yZCB0aGUgY2hhbmdlcyBjb2xsZWN0ZWQgaW4gdGhlIGltcG9ydCBtYW5hZ2VyIGFuZCB0cmFuc2Zvcm1lci5cbiAgdHJhbnNmb3JtZXIucmVjb3JkQ2hhbmdlcygpO1xuXG4gIC8vIFdhbGsgdGhyb3VnaCBlYWNoIHVwZGF0ZSByZWNvcmRlciBhbmQgY29tbWl0IHRoZSB1cGRhdGUuIFdlIG5lZWQgdG8gY29tbWl0IHRoZVxuICAvLyB1cGRhdGVzIGluIGJhdGNoZXMgcGVyIHNvdXJjZSBmaWxlIGFzIHRoZXJlIGNhbiBiZSBvbmx5IG9uZSByZWNvcmRlciBwZXIgc291cmNlXG4gIC8vIGZpbGUgaW4gb3JkZXIgdG8gYXZvaWQgc2hpZnQgY2hhcmFjdGVyIG9mZnNldHMuXG4gIHVwZGF0ZVJlY29yZGVycy5mb3JFYWNoKHJlY29yZGVyID0+IHJlY29yZGVyLmNvbW1pdFVwZGF0ZSgpKTtcblxuICByZXR1cm4gZmFpbHVyZXM7XG5cbiAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgdGhlIHNwZWNpZmllZCBzb3VyY2UgZmlsZS4gKi9cbiAgZnVuY3Rpb24gZ2V0VXBkYXRlUmVjb3JkZXIoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBpZiAodXBkYXRlUmVjb3JkZXJzLmhhcyhzb3VyY2VGaWxlKSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVJlY29yZGVycy5nZXQoc291cmNlRmlsZSkgITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgIGNvbnN0IHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlciA9IHtcbiAgICAgIGFkZENsYXNzRGVjb3JhdG9yKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHRleHQ6IHN0cmluZykge1xuICAgICAgICAvLyBOZXcgaW1wb3J0cyBzaG91bGQgYmUgaW5zZXJ0ZWQgYXQgdGhlIGxlZnQgd2hpbGUgZGVjb3JhdG9ycyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAgICAgICAgLy8gYXQgdGhlIHJpZ2h0IGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IGltcG9ydHMgYXJlIGluc2VydGVkIGJlZm9yZSB0aGUgZGVjb3JhdG9yXG4gICAgICAgIC8vIGlmIHRoZSBzdGFydCBwb3NpdGlvbiBvZiBpbXBvcnQgYW5kIGRlY29yYXRvciBpcyB0aGUgc291cmNlIGZpbGUgc3RhcnQuXG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIGAke3RleHR9XFxuYCk7XG4gICAgICB9LFxuICAgICAgcmVwbGFjZURlY29yYXRvcihkZWNvcmF0b3I6IHRzLkRlY29yYXRvciwgbmV3VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUoZGVjb3JhdG9yLmdldFN0YXJ0KCksIGRlY29yYXRvci5nZXRXaWR0aCgpKTtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KGRlY29yYXRvci5nZXRTdGFydCgpLCBuZXdUZXh0KTtcbiAgICAgIH0sXG4gICAgICBhZGROZXdJbXBvcnQoc3RhcnQ6IG51bWJlciwgaW1wb3J0VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydExlZnQoc3RhcnQsIGltcG9ydFRleHQpO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZUV4aXN0aW5nSW1wb3J0KG5hbWVkQmluZGluZ3M6IHRzLk5hbWVkSW1wb3J0cywgbmV3TmFtZWRCaW5kaW5nczogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuYW1lZEJpbmRpbmdzLmdldFdpZHRoKCkpO1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuZXdOYW1lZEJpbmRpbmdzKTtcbiAgICAgIH0sXG4gICAgICBjb21taXRVcGRhdGUoKSB7IHRyZWUuY29tbWl0VXBkYXRlKHRyZWVSZWNvcmRlcik7IH1cbiAgICB9O1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuIl19