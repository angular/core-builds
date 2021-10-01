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
        define("@angular/core/schematics/migrations/initial-navigation", ["require", "exports", "@angular-devkit/schematics", "path", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/initial-navigation/collector", "@angular/core/schematics/migrations/initial-navigation/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const collector_1 = require("@angular/core/schematics/migrations/initial-navigation/collector");
    const transform_1 = require("@angular/core/schematics/migrations/initial-navigation/transform");
    /** Entry point for the v10 "initialNavigation RouterModule options" schematic. */
    function default_1() {
        return (tree) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot update the "initialNavigation" option for RouterModule');
            }
            for (const tsconfigPath of [...buildPaths, ...testPaths]) {
                runInitialNavigationMigration(tree, tsconfigPath, basePath);
            }
        });
    }
    exports.default = default_1;
    function runInitialNavigationMigration(tree, tsconfigPath, basePath) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const initialNavigationCollector = new collector_1.InitialNavigationCollector(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        // Analyze source files by detecting all modules.
        sourceFiles.forEach(sourceFile => initialNavigationCollector.visitNode(sourceFile));
        const { assignments } = initialNavigationCollector;
        const transformer = new transform_1.InitialNavigationTransform(getUpdateRecorder);
        const updateRecorders = new Map();
        transformer.migrateInitialNavigationAssignments(Array.from(assignments));
        // Walk through each update recorder and commit the update. We need to commit the
        // updates in batches per source file as there can be only one recorder per source
        // file in order to avoid shift character offsets.
        updateRecorders.forEach(recorder => recorder.commitUpdate());
        /** Gets the update recorder for the specified source file. */
        function getUpdateRecorder(sourceFile) {
            if (updateRecorders.has(sourceFile)) {
                return updateRecorders.get(sourceFile);
            }
            const treeRecorder = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            const recorder = {
                updateNode(node, newText) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9pbml0aWFsLW5hdmlnYXRpb24vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCwyREFBMkU7SUFDM0UsK0JBQThCO0lBRTlCLGtHQUEyRTtJQUMzRSwyRkFBNEY7SUFDNUYsZ0dBQXVEO0lBQ3ZELGdHQUF1RDtJQUd2RCxrRkFBa0Y7SUFDbEY7UUFDRSxPQUFPLENBQU8sSUFBVSxFQUFFLEVBQUU7WUFDMUIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxNQUFNLElBQUEsZ0RBQXVCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixpR0FBaUcsQ0FBQyxDQUFDO2FBQ3hHO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hELDZCQUE2QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDN0Q7UUFDSCxDQUFDLENBQUEsQ0FBQztJQUNKLENBQUM7SUFkRCw0QkFjQztJQUVELFNBQVMsNkJBQTZCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDdkYsTUFBTSxFQUFDLE9BQU8sRUFBQyxHQUFHLElBQUEsc0NBQXNCLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLHNDQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sV0FBVyxHQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFjLEVBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRWpHLGlEQUFpRDtRQUNqRCxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsMEJBQTBCLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFcEYsTUFBTSxFQUFDLFdBQVcsRUFBQyxHQUFHLDBCQUEwQixDQUFDO1FBQ2pELE1BQU0sV0FBVyxHQUFHLElBQUksc0NBQTBCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN0RSxNQUFNLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBaUMsQ0FBQztRQUNqRSxXQUFXLENBQUMsbUNBQW1DLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRXpFLGlGQUFpRjtRQUNqRixrRkFBa0Y7UUFDbEYsa0RBQWtEO1FBQ2xELGVBQWUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUU3RCw4REFBOEQ7UUFDOUQsU0FBUyxpQkFBaUIsQ0FBQyxVQUF5QjtZQUNsRCxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ25DLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUUsQ0FBQzthQUN6QztZQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBQSxlQUFRLEVBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sUUFBUSxHQUFtQjtnQkFDL0IsVUFBVSxDQUFDLElBQWEsRUFBRSxPQUFlO29CQUN2QyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDdEQsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3JELENBQUM7Z0JBQ0QsWUFBWTtvQkFDVixJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2FBQ0YsQ0FBQztZQUNGLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtyZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge0luaXRpYWxOYXZpZ2F0aW9uQ29sbGVjdG9yfSBmcm9tICcuL2NvbGxlY3Rvcic7XG5pbXBvcnQge0luaXRpYWxOYXZpZ2F0aW9uVHJhbnNmb3JtfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIHYxMCBcImluaXRpYWxOYXZpZ2F0aW9uIFJvdXRlck1vZHVsZSBvcHRpb25zXCIgc2NoZW1hdGljLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAodHJlZTogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgdXBkYXRlIHRoZSBcImluaXRpYWxOYXZpZ2F0aW9uXCIgb3B0aW9uIGZvciBSb3V0ZXJNb2R1bGUnKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXSkge1xuICAgICAgcnVuSW5pdGlhbE5hdmlnYXRpb25NaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5Jbml0aWFsTmF2aWdhdGlvbk1pZ3JhdGlvbih0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCB7cHJvZ3JhbX0gPSBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgaW5pdGlhbE5hdmlnYXRpb25Db2xsZWN0b3IgPSBuZXcgSW5pdGlhbE5hdmlnYXRpb25Db2xsZWN0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9XG4gICAgICBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKHNvdXJjZUZpbGUgPT4gY2FuTWlncmF0ZUZpbGUoYmFzZVBhdGgsIHNvdXJjZUZpbGUsIHByb2dyYW0pKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgYWxsIG1vZHVsZXMuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiBpbml0aWFsTmF2aWdhdGlvbkNvbGxlY3Rvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHthc3NpZ25tZW50c30gPSBpbml0aWFsTmF2aWdhdGlvbkNvbGxlY3RvcjtcbiAgY29uc3QgdHJhbnNmb3JtZXIgPSBuZXcgSW5pdGlhbE5hdmlnYXRpb25UcmFuc2Zvcm0oZ2V0VXBkYXRlUmVjb3JkZXIpO1xuICBjb25zdCB1cGRhdGVSZWNvcmRlcnMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIFVwZGF0ZVJlY29yZGVyPigpO1xuICB0cmFuc2Zvcm1lci5taWdyYXRlSW5pdGlhbE5hdmlnYXRpb25Bc3NpZ25tZW50cyhBcnJheS5mcm9tKGFzc2lnbm1lbnRzKSk7XG5cbiAgLy8gV2FsayB0aHJvdWdoIGVhY2ggdXBkYXRlIHJlY29yZGVyIGFuZCBjb21taXQgdGhlIHVwZGF0ZS4gV2UgbmVlZCB0byBjb21taXQgdGhlXG4gIC8vIHVwZGF0ZXMgaW4gYmF0Y2hlcyBwZXIgc291cmNlIGZpbGUgYXMgdGhlcmUgY2FuIGJlIG9ubHkgb25lIHJlY29yZGVyIHBlciBzb3VyY2VcbiAgLy8gZmlsZSBpbiBvcmRlciB0byBhdm9pZCBzaGlmdCBjaGFyYWN0ZXIgb2Zmc2V0cy5cbiAgdXBkYXRlUmVjb3JkZXJzLmZvckVhY2gocmVjb3JkZXIgPT4gcmVjb3JkZXIuY29tbWl0VXBkYXRlKCkpO1xuXG4gIC8qKiBHZXRzIHRoZSB1cGRhdGUgcmVjb3JkZXIgZm9yIHRoZSBzcGVjaWZpZWQgc291cmNlIGZpbGUuICovXG4gIGZ1bmN0aW9uIGdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBVcGRhdGVSZWNvcmRlciB7XG4gICAgaWYgKHVwZGF0ZVJlY29yZGVycy5oYXMoc291cmNlRmlsZSkpIHtcbiAgICAgIHJldHVybiB1cGRhdGVSZWNvcmRlcnMuZ2V0KHNvdXJjZUZpbGUpITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgIGNvbnN0IHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlciA9IHtcbiAgICAgIHVwZGF0ZU5vZGUobm9kZTogdHMuTm9kZSwgbmV3VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUobm9kZS5nZXRTdGFydCgpLCBub2RlLmdldFdpZHRoKCkpO1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobm9kZS5nZXRTdGFydCgpLCBuZXdUZXh0KTtcbiAgICAgIH0sXG4gICAgICBjb21taXRVcGRhdGUoKSB7XG4gICAgICAgIHRyZWUuY29tbWl0VXBkYXRlKHRyZWVSZWNvcmRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgICB1cGRhdGVSZWNvcmRlcnMuc2V0KHNvdXJjZUZpbGUsIHJlY29yZGVyKTtcbiAgICByZXR1cm4gcmVjb3JkZXI7XG4gIH1cbn1cbiJdfQ==