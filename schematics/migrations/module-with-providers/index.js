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
        define("@angular/core/schematics/migrations/module-with-providers", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/module-with-providers/collector", "@angular/core/schematics/migrations/module-with-providers/transform"], factory);
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
    const collector_1 = require("@angular/core/schematics/migrations/module-with-providers/collector");
    const transform_1 = require("@angular/core/schematics/migrations/module-with-providers/transform");
    /**
     * Runs the ModuleWithProviders migration for all TypeScript projects in the current CLI workspace.
     */
    function default_1() {
        return (tree, ctx) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            const failures = [];
            ctx.logger.info('------ ModuleWithProviders migration ------');
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate ModuleWithProviders.');
            }
            for (const tsconfigPath of allPaths) {
                failures.push(...runModuleWithProvidersMigration(tree, tsconfigPath, basePath));
            }
            if (failures.length) {
                ctx.logger.info('Could not migrate all instances of ModuleWithProviders');
                ctx.logger.info('Please manually fix the following failures:');
                failures.forEach(message => ctx.logger.warn(`⮑   ${message}`));
            }
            else {
                ctx.logger.info('Successfully migrated all found ModuleWithProviders.');
            }
            ctx.logger.info('----------------------------------------------');
        };
    }
    exports.default = default_1;
    function runModuleWithProvidersMigration(tree, tsconfigPath, basePath) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = compiler_host_1.createMigrationCompilerHost(tree, parsed.options, basePath);
        const failures = [];
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const collector = new collector_1.Collector(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        // Analyze source files by detecting all modules.
        sourceFiles.forEach(sourceFile => collector.visitNode(sourceFile));
        const { resolvedModules, resolvedNonGenerics } = collector;
        const transformer = new transform_1.ModuleWithProvidersTransform(typeChecker, getUpdateRecorder);
        const updateRecorders = new Map();
        [...resolvedModules.reduce((failures, m) => failures.concat(transformer.migrateModule(m)), []),
            ...resolvedNonGenerics.reduce((failures, t) => failures.concat(transformer.migrateType(t)), [])]
            .forEach(({ message, node }) => {
            const nodeSourceFile = node.getSourceFile();
            const relativeFilePath = path_1.relative(basePath, nodeSourceFile.fileName);
            const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
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
            const recorder = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
            updateRecorders.set(sourceFile, recorder);
            return recorder;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9tb2R1bGUtd2l0aC1wcm92aWRlcnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyREFBNkc7SUFDN0csK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxrR0FBMkU7SUFDM0UsMkZBQWlGO0lBQ2pGLDZGQUF3RTtJQUV4RSxtR0FBc0M7SUFDdEMsbUdBQTBFO0lBSTFFOztPQUVHO0lBQ0g7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLEdBQXFCLEVBQUUsRUFBRTtZQUMzQyxNQUFNLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBQyxHQUFHLGdEQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFDL0MsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBRTlCLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDZDQUE2QyxDQUFDLENBQUM7WUFFL0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsdUVBQXVFLENBQUMsQ0FBQzthQUM5RTtZQUVELEtBQUssTUFBTSxZQUFZLElBQUksUUFBUSxFQUFFO2dCQUNuQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsK0JBQStCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2FBQ2pGO1lBRUQsSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNuQixHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FB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SSxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFDLENBQUM7UUFFUCxpRkFBaUY7UUFDakYsa0ZBQWtGO1FBQ2xGLGtEQUFrRDtRQUNsRCxlQUFlLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRWpFLE9BQU8sUUFBUSxDQUFDO1FBRWhCLDhEQUE4RDtRQUM5RCxTQUFTLGlCQUFpQixDQUFDLFVBQXlCO1lBQ2xELElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDbkMsT0FBTyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBRyxDQUFDO2FBQzFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzNFLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWUsIFVwZGF0ZVJlY29yZGVyfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y3JlYXRlTWlncmF0aW9uQ29tcGlsZXJIb3N0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZyc7XG5cbmltcG9ydCB7Q29sbGVjdG9yfSBmcm9tICcuL2NvbGxlY3Rvcic7XG5pbXBvcnQge0FuYWx5c2lzRmFpbHVyZSwgTW9kdWxlV2l0aFByb3ZpZGVyc1RyYW5zZm9ybX0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuXG5cblxuLyoqXG4gKiBSdW5zIHRoZSBNb2R1bGVXaXRoUHJvdmlkZXJzIG1pZ3JhdGlvbiBmb3IgYWxsIFR5cGVTY3JpcHQgcHJvamVjdHMgaW4gdGhlIGN1cnJlbnQgQ0xJIHdvcmtzcGFjZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY3R4OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgYWxsUGF0aHMgPSBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXTtcbiAgICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcblxuICAgIGN0eC5sb2dnZXIuaW5mbygnLS0tLS0tIE1vZHVsZVdpdGhQcm92aWRlcnMgbWlncmF0aW9uIC0tLS0tLScpO1xuXG4gICAgaWYgKCFhbGxQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgTW9kdWxlV2l0aFByb3ZpZGVycy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBhbGxQYXRocykge1xuICAgICAgZmFpbHVyZXMucHVzaCguLi5ydW5Nb2R1bGVXaXRoUHJvdmlkZXJzTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpKTtcbiAgICB9XG5cbiAgICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ0NvdWxkIG5vdCBtaWdyYXRlIGFsbCBpbnN0YW5jZXMgb2YgTW9kdWxlV2l0aFByb3ZpZGVycycpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdQbGVhc2UgbWFudWFsbHkgZml4IHRoZSBmb2xsb3dpbmcgZmFpbHVyZXM6Jyk7XG4gICAgICBmYWlsdXJlcy5mb3JFYWNoKG1lc3NhZ2UgPT4gY3R4LmxvZ2dlci53YXJuKGDirpEgICAke21lc3NhZ2V9YCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ1N1Y2Nlc3NmdWxseSBtaWdyYXRlZCBhbGwgZm91bmQgTW9kdWxlV2l0aFByb3ZpZGVycy4nKTtcbiAgICB9XG5cbiAgICBjdHgubG9nZ2VyLmluZm8oJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuTW9kdWxlV2l0aFByb3ZpZGVyc01pZ3JhdGlvbih0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSBjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3QodHJlZSwgcGFyc2VkLm9wdGlvbnMsIGJhc2VQYXRoKTtcbiAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgY29sbGVjdG9yID0gbmV3IENvbGxlY3Rvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIGFsbCBtb2R1bGVzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gY29sbGVjdG9yLnZpc2l0Tm9kZShzb3VyY2VGaWxlKSk7XG5cbiAgY29uc3Qge3Jlc29sdmVkTW9kdWxlcywgcmVzb2x2ZWROb25HZW5lcmljc30gPSBjb2xsZWN0b3I7XG4gIGNvbnN0IHRyYW5zZm9ybWVyID0gbmV3IE1vZHVsZVdpdGhQcm92aWRlcnNUcmFuc2Zvcm0odHlwZUNoZWNrZXIsIGdldFVwZGF0ZVJlY29yZGVyKTtcbiAgY29uc3QgdXBkYXRlUmVjb3JkZXJzID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICBbLi4ucmVzb2x2ZWRNb2R1bGVzLnJlZHVjZShcbiAgICAgICAoZmFpbHVyZXMsIG0pID0+IGZhaWx1cmVzLmNvbmNhdCh0cmFuc2Zvcm1lci5taWdyYXRlTW9kdWxlKG0pKSwgW10gYXMgQW5hbHlzaXNGYWlsdXJlW10pLFxuICAgLi4ucmVzb2x2ZWROb25HZW5lcmljcy5yZWR1Y2UoXG4gICAgICAgKGZhaWx1cmVzLCB0KSA9PiBmYWlsdXJlcy5jb25jYXQodHJhbnNmb3JtZXIubWlncmF0ZVR5cGUodCkpLCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSldXG4gICAgICAuZm9yRWFjaCgoe21lc3NhZ2UsIG5vZGV9KSA9PiB7XG4gICAgICAgIGNvbnN0IG5vZGVTb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlRmlsZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgbm9kZVNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihub2RlLmdldFNvdXJjZUZpbGUoKSwgbm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgZmFpbHVyZXMucHVzaChgJHtyZWxhdGl2ZUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke21lc3NhZ2V9YCk7XG4gICAgICB9KTtcblxuICAvLyBXYWxrIHRocm91Z2ggZWFjaCB1cGRhdGUgcmVjb3JkZXIgYW5kIGNvbW1pdCB0aGUgdXBkYXRlLiBXZSBuZWVkIHRvIGNvbW1pdCB0aGVcbiAgLy8gdXBkYXRlcyBpbiBiYXRjaGVzIHBlciBzb3VyY2UgZmlsZSBhcyB0aGVyZSBjYW4gYmUgb25seSBvbmUgcmVjb3JkZXIgcGVyIHNvdXJjZVxuICAvLyBmaWxlIGluIG9yZGVyIHRvIGF2b2lkIHNoaWZ0IGNoYXJhY3RlciBvZmZzZXRzLlxuICB1cGRhdGVSZWNvcmRlcnMuZm9yRWFjaChyZWNvcmRlciA9PiB0cmVlLmNvbW1pdFVwZGF0ZShyZWNvcmRlcikpO1xuXG4gIHJldHVybiBmYWlsdXJlcztcblxuICAvKiogR2V0cyB0aGUgdXBkYXRlIHJlY29yZGVyIGZvciB0aGUgc3BlY2lmaWVkIHNvdXJjZSBmaWxlLiAqL1xuICBmdW5jdGlvbiBnZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGlmICh1cGRhdGVSZWNvcmRlcnMuaGFzKHNvdXJjZUZpbGUpKSB7XG4gICAgICByZXR1cm4gdXBkYXRlUmVjb3JkZXJzLmdldChzb3VyY2VGaWxlKSAhO1xuICAgIH1cbiAgICBjb25zdCByZWNvcmRlciA9IHRyZWUuYmVnaW5VcGRhdGUocmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcbiAgICB1cGRhdGVSZWNvcmRlcnMuc2V0KHNvdXJjZUZpbGUsIHJlY29yZGVyKTtcbiAgICByZXR1cm4gcmVjb3JkZXI7XG4gIH1cbn1cbiJdfQ==