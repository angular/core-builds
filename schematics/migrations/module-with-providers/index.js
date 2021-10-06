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
        define("@angular/core/schematics/migrations/module-with-providers", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/load_esm", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/module-with-providers/collector", "@angular/core/schematics/migrations/module-with-providers/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const typescript_1 = __importDefault(require("typescript"));
    const load_esm_1 = require("@angular/core/schematics/utils/load_esm");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const collector_1 = require("@angular/core/schematics/migrations/module-with-providers/collector");
    const transform_1 = require("@angular/core/schematics/migrations/module-with-providers/transform");
    /**
     * Runs the ModuleWithProviders migration for all TypeScript projects in the current CLI workspace.
     */
    function default_1() {
        return (tree, ctx) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            const failures = [];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate ModuleWithProviders.');
            }
            let compilerCliMigrationsModule;
            try {
                // Load ESM `@angular/compiler/private/migrations` using the TypeScript dynamic import
                // workaround. Once TypeScript provides support for keeping the dynamic import this workaround
                // can be changed to a direct dynamic import.
                compilerCliMigrationsModule = yield (0, load_esm_1.loadCompilerCliMigrationsModule)();
            }
            catch (e) {
                throw new schematics_1.SchematicsException(`Unable to load the '@angular/compiler-cli' package. Details: ${e.message}`);
            }
            for (const tsconfigPath of allPaths) {
                failures.push(...runModuleWithProvidersMigration(tree, tsconfigPath, basePath, compilerCliMigrationsModule));
            }
            if (failures.length) {
                ctx.logger.info('Could not migrate all instances of ModuleWithProviders');
                ctx.logger.info('Please manually fix the following failures:');
                failures.forEach(message => ctx.logger.warn(`⮑   ${message}`));
            }
        });
    }
    exports.default = default_1;
    function runModuleWithProvidersMigration(tree, tsconfigPath, basePath, compilerCliMigrationsModule) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const failures = [];
        const typeChecker = program.getTypeChecker();
        const collector = new collector_1.Collector(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        // Analyze source files by detecting all modules.
        sourceFiles.forEach(sourceFile => collector.visitNode(sourceFile));
        const { resolvedModules, resolvedNonGenerics } = collector;
        const transformer = new transform_1.ModuleWithProvidersTransform(typeChecker, getUpdateRecorder, compilerCliMigrationsModule);
        const updateRecorders = new Map();
        [...resolvedModules.reduce((failures, m) => failures.concat(transformer.migrateModule(m)), []),
            ...resolvedNonGenerics.reduce((failures, t) => failures.concat(transformer.migrateType(t)), [])]
            .forEach(({ message, node }) => {
            const nodeSourceFile = node.getSourceFile();
            const relativeFilePath = (0, path_1.relative)(basePath, nodeSourceFile.fileName);
            const { line, character } = typescript_1.default.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
            failures.push(`${relativeFilePath}@${line + 1}:${character + 1}: ${message}`);
        });
        // Walk through each update recorder and commit the update. We need to commit the
        // updates in batches per source file as there can be only one recorder per source
        // file in order to avoid shift character offsets.
        updateRecorders.forEach(recorder => tree.commitUpdate(recorder));
        return failures;
        /** Gets the update recorder for the specified source file. */
        function getUpdateRecorder(sourceFile) {
            if (updateRecorders.has(sourceFile)) {
                return updateRecorders.get(sourceFile);
            }
            const recorder = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            updateRecorders.set(sourceFile, recorder);
            return recorder;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9tb2R1bGUtd2l0aC1wcm92aWRlcnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCwyREFBNkc7SUFDN0csK0JBQThCO0lBQzlCLDREQUE0QjtJQUU1QixzRUFBb0Y7SUFDcEYsa0dBQTJFO0lBQzNFLDJGQUE0RjtJQUU1RixtR0FBc0M7SUFDdEMsbUdBQTBFO0lBRzFFOztPQUVHO0lBQ0g7UUFDRSxPQUFPLENBQU8sSUFBVSxFQUFFLEdBQXFCLEVBQUUsRUFBRTtZQUNqRCxNQUFNLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBQyxHQUFHLE1BQU0sSUFBQSxnREFBdUIsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUNwRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztZQUU5QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsTUFBTSxJQUFJLGdDQUFtQixDQUN6Qix1RUFBdUUsQ0FBQyxDQUFDO2FBQzlFO1lBRUQsSUFBSSwyQkFBMkIsQ0FBQztZQUNoQyxJQUFJO2dCQUNGLHNGQUFzRjtnQkFDdEYsOEZBQThGO2dCQUM5Riw2Q0FBNkM7Z0JBQzdDLDJCQUEyQixHQUFHLE1BQU0sSUFBQSwwQ0FBK0IsR0FBRSxDQUFDO2FBQ3ZFO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixnRUFBZ0UsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7YUFDbEY7WUFF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QUFDLENBQUMsQ0FBQztRQUVQLGlGQUFpRjtRQUNqRixrRkFBa0Y7UUFDbEYsa0RBQWtEO1FBQ2xELGVBQWUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFakUsT0FBTyxRQUFRLENBQUM7UUFFaEIsOERBQThEO1FBQzlELFNBQVMsaUJBQWlCLENBQUMsVUFBeUI7WUFDbEQsSUFBSSxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUNuQyxPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFFLENBQUM7YUFDekM7WUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUEsZUFBUSxFQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMzRSxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMxQyxPQUFPLFFBQVEsQ0FBQztRQUNsQixDQUFDO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWUsIFVwZGF0ZVJlY29yZGVyfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtsb2FkQ29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlLCBsb2FkRXNtTW9kdWxlfSBmcm9tICcuLi8uLi91dGlscy9sb2FkX2VzbSc7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5cbmltcG9ydCB7Q29sbGVjdG9yfSBmcm9tICcuL2NvbGxlY3Rvcic7XG5pbXBvcnQge0FuYWx5c2lzRmFpbHVyZSwgTW9kdWxlV2l0aFByb3ZpZGVyc1RyYW5zZm9ybX0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuXG5cbi8qKlxuICogUnVucyB0aGUgTW9kdWxlV2l0aFByb3ZpZGVycyBtaWdyYXRpb24gZm9yIGFsbCBUeXBlU2NyaXB0IHByb2plY3RzIGluIHRoZSBjdXJyZW50IENMSSB3b3Jrc3BhY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGN0eDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG4gICAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBNb2R1bGVXaXRoUHJvdmlkZXJzLicpO1xuICAgIH1cblxuICAgIGxldCBjb21waWxlckNsaU1pZ3JhdGlvbnNNb2R1bGU7XG4gICAgdHJ5IHtcbiAgICAgIC8vIExvYWQgRVNNIGBAYW5ndWxhci9jb21waWxlci9wcml2YXRlL21pZ3JhdGlvbnNgIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0XG4gICAgICAvLyB3b3JrYXJvdW5kLiBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kXG4gICAgICAvLyBjYW4gYmUgY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICAgIGNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZSA9IGF3YWl0IGxvYWRDb21waWxlckNsaU1pZ3JhdGlvbnNNb2R1bGUoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICBgVW5hYmxlIHRvIGxvYWQgdGhlICdAYW5ndWxhci9jb21waWxlci1jbGknIHBhY2thZ2UuIERldGFpbHM6ICR7ZS5tZXNzYWdlfWApO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGFsbFBhdGhzKSB7XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLnJ1bk1vZHVsZVdpdGhQcm92aWRlcnNNaWdyYXRpb24oXG4gICAgICAgICAgdHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlKSk7XG4gICAgfVxuXG4gICAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdDb3VsZCBub3QgbWlncmF0ZSBhbGwgaW5zdGFuY2VzIG9mIE1vZHVsZVdpdGhQcm92aWRlcnMnKTtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnUGxlYXNlIG1hbnVhbGx5IGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzOicpO1xuICAgICAgZmFpbHVyZXMuZm9yRWFjaChtZXNzYWdlID0+IGN0eC5sb2dnZXIud2Fybihg4q6RICAgJHttZXNzYWdlfWApKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bk1vZHVsZVdpdGhQcm92aWRlcnNNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsXG4gICAgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGkvcHJpdmF0ZS9taWdyYXRpb25zJykpIHtcbiAgY29uc3Qge3Byb2dyYW19ID0gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbSh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBjb2xsZWN0b3IgPSBuZXcgQ29sbGVjdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIGFsbCBtb2R1bGVzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gY29sbGVjdG9yLnZpc2l0Tm9kZShzb3VyY2VGaWxlKSk7XG5cbiAgY29uc3Qge3Jlc29sdmVkTW9kdWxlcywgcmVzb2x2ZWROb25HZW5lcmljc30gPSBjb2xsZWN0b3I7XG4gIGNvbnN0IHRyYW5zZm9ybWVyID1cbiAgICAgIG5ldyBNb2R1bGVXaXRoUHJvdmlkZXJzVHJhbnNmb3JtKHR5cGVDaGVja2VyLCBnZXRVcGRhdGVSZWNvcmRlciwgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlKTtcbiAgY29uc3QgdXBkYXRlUmVjb3JkZXJzID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICBbLi4ucmVzb2x2ZWRNb2R1bGVzLnJlZHVjZShcbiAgICAgICAoZmFpbHVyZXMsIG0pID0+IGZhaWx1cmVzLmNvbmNhdCh0cmFuc2Zvcm1lci5taWdyYXRlTW9kdWxlKG0pKSwgW10gYXMgQW5hbHlzaXNGYWlsdXJlW10pLFxuICAgLi4ucmVzb2x2ZWROb25HZW5lcmljcy5yZWR1Y2UoXG4gICAgICAgKGZhaWx1cmVzLCB0KSA9PiBmYWlsdXJlcy5jb25jYXQodHJhbnNmb3JtZXIubWlncmF0ZVR5cGUodCkpLCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSldXG4gICAgICAuZm9yRWFjaCgoe21lc3NhZ2UsIG5vZGV9KSA9PiB7XG4gICAgICAgIGNvbnN0IG5vZGVTb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlRmlsZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgbm9kZVNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihub2RlLmdldFNvdXJjZUZpbGUoKSwgbm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgZmFpbHVyZXMucHVzaChgJHtyZWxhdGl2ZUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke21lc3NhZ2V9YCk7XG4gICAgICB9KTtcblxuICAvLyBXYWxrIHRocm91Z2ggZWFjaCB1cGRhdGUgcmVjb3JkZXIgYW5kIGNvbW1pdCB0aGUgdXBkYXRlLiBXZSBuZWVkIHRvIGNvbW1pdCB0aGVcbiAgLy8gdXBkYXRlcyBpbiBiYXRjaGVzIHBlciBzb3VyY2UgZmlsZSBhcyB0aGVyZSBjYW4gYmUgb25seSBvbmUgcmVjb3JkZXIgcGVyIHNvdXJjZVxuICAvLyBmaWxlIGluIG9yZGVyIHRvIGF2b2lkIHNoaWZ0IGNoYXJhY3RlciBvZmZzZXRzLlxuICB1cGRhdGVSZWNvcmRlcnMuZm9yRWFjaChyZWNvcmRlciA9PiB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcikpO1xuXG4gIHJldHVybiBmYWlsdXJlcztcblxuICAvKiogR2V0cyB0aGUgdXBkYXRlIHJlY29yZGVyIGZvciB0aGUgc3BlY2lmaWVkIHNvdXJjZSBmaWxlLiAqL1xuICBmdW5jdGlvbiBnZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGlmICh1cGRhdGVSZWNvcmRlcnMuaGFzKHNvdXJjZUZpbGUpKSB7XG4gICAgICByZXR1cm4gdXBkYXRlUmVjb3JkZXJzLmdldChzb3VyY2VGaWxlKSE7XG4gICAgfVxuICAgIGNvbnN0IHJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuIl19