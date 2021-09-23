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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9pbml0aWFsLW5hdmlnYXRpb24vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCwyREFBMkU7SUFDM0UsK0JBQThCO0lBRTlCLGtHQUEyRTtJQUMzRSwyRkFBNEY7SUFDNUYsZ0dBQXVEO0lBQ3ZELGdHQUF1RDtJQUd2RCxrRkFBa0Y7SUFDbEY7UUFDRSxPQUFPLENBQU8sSUFBVSxFQUFFLEVBQUU7WUFDMUIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxNQUFNLElBQUEsZ0RBQXVCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixpR0FBaUcsQ0FBQyxDQUFDO2FBQ3hHO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hELDZCQUE2QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDN0Q7UUFDSCxDQUFDLENBQUEsQ0FBQztJQUNKLENBQUM7SUFkRCw0QkFjQztJQUVELFNBQVMsNkJBQTZCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDdkYsTUFBTSxFQUFDLE9BQU8sRUFBQyxHQUFHLElBQUEsc0NBQXNCLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLHNDQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sV0FBVyxHQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFjLEVBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRWpHLGlEQUFpRDtRQUNqRCxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsMEJBQTBCLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFcEYsTUFBTSxFQUFDLFdBQVcsRUFBQyxHQUFHLDBCQUEwQixDQUFDO1FBQ2pELE1BQU0sV0FBVyxHQUFHLElBQUksc0NBQTBCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN0RSxNQUFNLGVBQWUsR0FBRyxJQUFJLEdBQUcsRUFBaUMsQ0FBQztRQUNqRSxXQUFXLENBQUMsbUNBQW1DLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRXpFLGlGQUFpRjtRQUNqRixrRkFBa0Y7UUFDbEYsa0RBQWtEO1FBQ2xELGVBQWUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUU3RCw4REFBOEQ7UUFDOUQsU0FBUyxpQkFBaUIsQ0FBQyxVQUF5QjtZQUNsRCxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ25DLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUUsQ0FBQzthQUN6QztZQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBQSxlQUFRLEVBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sUUFBUSxHQUFtQjtnQkFDL0IsVUFBVSxDQUFDLElBQWEsRUFBRSxPQUFlO29CQUN2QyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDdEQsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3JELENBQUM7Z0JBQ0QsWUFBWTtvQkFDVixJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2FBQ0YsQ0FBQztZQUNGLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLENBQUM7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtyZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjYW5NaWdyYXRlRmlsZSwgY3JlYXRlTWlncmF0aW9uUHJvZ3JhbX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7SW5pdGlhbE5hdmlnYXRpb25Db2xsZWN0b3J9IGZyb20gJy4vY29sbGVjdG9yJztcbmltcG9ydCB7SW5pdGlhbE5hdmlnYXRpb25UcmFuc2Zvcm19IGZyb20gJy4vdHJhbnNmb3JtJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgdjEwIFwiaW5pdGlhbE5hdmlnYXRpb24gUm91dGVyTW9kdWxlIG9wdGlvbnNcIiBzY2hlbWF0aWMuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlKSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBhd2FpdCBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCB1cGRhdGUgdGhlIFwiaW5pdGlhbE5hdmlnYXRpb25cIiBvcHRpb24gZm9yIFJvdXRlck1vZHVsZScpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdKSB7XG4gICAgICBydW5Jbml0aWFsTmF2aWdhdGlvbk1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bkluaXRpYWxOYXZpZ2F0aW9uTWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHtwcm9ncmFtfSA9IGNyZWF0ZU1pZ3JhdGlvblByb2dyYW0odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBpbml0aWFsTmF2aWdhdGlvbkNvbGxlY3RvciA9IG5ldyBJbml0aWFsTmF2aWdhdGlvbkNvbGxlY3Rvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID1cbiAgICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoc291cmNlRmlsZSA9PiBjYW5NaWdyYXRlRmlsZShiYXNlUGF0aCwgc291cmNlRmlsZSwgcHJvZ3JhbSkpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBhbGwgbW9kdWxlcy5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IGluaXRpYWxOYXZpZ2F0aW9uQ29sbGVjdG9yLnZpc2l0Tm9kZShzb3VyY2VGaWxlKSk7XG5cbiAgY29uc3Qge2Fzc2lnbm1lbnRzfSA9IGluaXRpYWxOYXZpZ2F0aW9uQ29sbGVjdG9yO1xuICBjb25zdCB0cmFuc2Zvcm1lciA9IG5ldyBJbml0aWFsTmF2aWdhdGlvblRyYW5zZm9ybShnZXRVcGRhdGVSZWNvcmRlcik7XG4gIGNvbnN0IHVwZGF0ZVJlY29yZGVycyA9IG5ldyBNYXA8dHMuU291cmNlRmlsZSwgVXBkYXRlUmVjb3JkZXI+KCk7XG4gIHRyYW5zZm9ybWVyLm1pZ3JhdGVJbml0aWFsTmF2aWdhdGlvbkFzc2lnbm1lbnRzKEFycmF5LmZyb20oYXNzaWdubWVudHMpKTtcblxuICAvLyBXYWxrIHRocm91Z2ggZWFjaCB1cGRhdGUgcmVjb3JkZXIgYW5kIGNvbW1pdCB0aGUgdXBkYXRlLiBXZSBuZWVkIHRvIGNvbW1pdCB0aGVcbiAgLy8gdXBkYXRlcyBpbiBiYXRjaGVzIHBlciBzb3VyY2UgZmlsZSBhcyB0aGVyZSBjYW4gYmUgb25seSBvbmUgcmVjb3JkZXIgcGVyIHNvdXJjZVxuICAvLyBmaWxlIGluIG9yZGVyIHRvIGF2b2lkIHNoaWZ0IGNoYXJhY3RlciBvZmZzZXRzLlxuICB1cGRhdGVSZWNvcmRlcnMuZm9yRWFjaChyZWNvcmRlciA9PiByZWNvcmRlci5jb21taXRVcGRhdGUoKSk7XG5cbiAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgdGhlIHNwZWNpZmllZCBzb3VyY2UgZmlsZS4gKi9cbiAgZnVuY3Rpb24gZ2V0VXBkYXRlUmVjb3JkZXIoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBpZiAodXBkYXRlUmVjb3JkZXJzLmhhcyhzb3VyY2VGaWxlKSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVJlY29yZGVycy5nZXQoc291cmNlRmlsZSkhO1xuICAgIH1cbiAgICBjb25zdCB0cmVlUmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG4gICAgY29uc3QgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyID0ge1xuICAgICAgdXBkYXRlTm9kZShub2RlOiB0cy5Ob2RlLCBuZXdUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLnJlbW92ZShub2RlLmdldFN0YXJ0KCksIG5vZGUuZ2V0V2lkdGgoKSk7XG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIG5ld1RleHQpO1xuICAgICAgfSxcbiAgICAgIGNvbW1pdFVwZGF0ZSgpIHtcbiAgICAgICAgdHJlZS5jb21taXRVcGRhdGUodHJlZVJlY29yZGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuIl19