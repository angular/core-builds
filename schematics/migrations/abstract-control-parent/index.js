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
            const { buildPaths, testPaths } = yield project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
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
        const { program } = compiler_host_1.createMigrationProgram(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const sourceFiles = program.getSourceFiles().filter(sourceFile => compiler_host_1.canMigrateFile(basePath, sourceFile, program));
        sourceFiles.forEach(sourceFile => {
            // We sort the nodes based on their position in the file and we offset the positions by one
            // for each non-null assertion that we've added. We have to do it this way, rather than
            // creating and printing a new AST node like in other migrations, because property access
            // expressions can be nested (e.g. `control.parent.parent.value`), but the node positions
            // aren't being updated as we're inserting new code. If we were to go through the AST,
            // we'd have to update the `SourceFile` and start over after each operation.
            util_1.findParentAccesses(typeChecker, sourceFile)
                .sort((a, b) => a.getStart() - b.getStart())
                .forEach((node, index) => {
                const update = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
                update.insertRight(node.getStart() + node.getWidth() + index, '!');
                tree.commitUpdate(update);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9hYnN0cmFjdC1jb250cm9sLXBhcmVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDJEQUEyRTtJQUMzRSwrQkFBOEI7SUFFOUIsa0dBQTJFO0lBQzNFLDJGQUE0RjtJQUM1RiwyRkFBMEM7SUFHMUMsNkVBQTZFO0lBQzdFO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxFQUFFO1lBQzFCLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBRS9DLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNwQixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLG1GQUFtRixDQUFDLENBQUM7YUFDMUY7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMsdUNBQXVDLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN2RTtRQUNILENBQUMsQ0FBQSxDQUFDO0lBQ0osQ0FBQztJQWZELDRCQWVDO0lBRUQsU0FBUyx1Q0FBdUMsQ0FDNUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDcEQsTUFBTSxFQUFDLE9BQU8sRUFBQyxHQUFHLHNDQUFzQixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sV0FBVyxHQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyw4QkFBYyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUVqRyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQy9CLDJGQUEyRjtZQUMzRix1RkFBdUY7WUFDdkYseUZBQXlGO1lBQ3pGLHlGQUF5RjtZQUN6RixzRkFBc0Y7WUFDdEYsNEVBQTRFO1lBQzVFLHlCQUFrQixDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUM7aUJBQ3RDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7aUJBQzNDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1FBQ1QsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtyZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjYW5NaWdyYXRlRmlsZSwgY3JlYXRlTWlncmF0aW9uUHJvZ3JhbX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7ZmluZFBhcmVudEFjY2Vzc2VzfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKiBNaWdyYXRpb24gdGhhdCBtYXJrcyBhY2Nlc3NlcyBvZiBgQWJzdHJhY3RDb250cm9sLnBhcmVudGAgYXMgbm9uLW51bGwuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlKSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBhd2FpdCBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgYWxsUGF0aHMgPSBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXTtcblxuICAgIGlmICghYWxsUGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBtaWdyYXRlIEFic3RyYWN0Q29udHJvbC5wYXJlbnQgYWNjZXNzZXMuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYWxsUGF0aHMpIHtcbiAgICAgIHJ1bk5hdGl2ZUFic3RyYWN0Q29udHJvbFBhcmVudE1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bk5hdGl2ZUFic3RyYWN0Q29udHJvbFBhcmVudE1pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCB7cHJvZ3JhbX0gPSBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICAvLyBXZSBzb3J0IHRoZSBub2RlcyBiYXNlZCBvbiB0aGVpciBwb3NpdGlvbiBpbiB0aGUgZmlsZSBhbmQgd2Ugb2Zmc2V0IHRoZSBwb3NpdGlvbnMgYnkgb25lXG4gICAgLy8gZm9yIGVhY2ggbm9uLW51bGwgYXNzZXJ0aW9uIHRoYXQgd2UndmUgYWRkZWQuIFdlIGhhdmUgdG8gZG8gaXQgdGhpcyB3YXksIHJhdGhlciB0aGFuXG4gICAgLy8gY3JlYXRpbmcgYW5kIHByaW50aW5nIGEgbmV3IEFTVCBub2RlIGxpa2UgaW4gb3RoZXIgbWlncmF0aW9ucywgYmVjYXVzZSBwcm9wZXJ0eSBhY2Nlc3NcbiAgICAvLyBleHByZXNzaW9ucyBjYW4gYmUgbmVzdGVkIChlLmcuIGBjb250cm9sLnBhcmVudC5wYXJlbnQudmFsdWVgKSwgYnV0IHRoZSBub2RlIHBvc2l0aW9uc1xuICAgIC8vIGFyZW4ndCBiZWluZyB1cGRhdGVkIGFzIHdlJ3JlIGluc2VydGluZyBuZXcgY29kZS4gSWYgd2Ugd2VyZSB0byBnbyB0aHJvdWdoIHRoZSBBU1QsXG4gICAgLy8gd2UnZCBoYXZlIHRvIHVwZGF0ZSB0aGUgYFNvdXJjZUZpbGVgIGFuZCBzdGFydCBvdmVyIGFmdGVyIGVhY2ggb3BlcmF0aW9uLlxuICAgIGZpbmRQYXJlbnRBY2Nlc3Nlcyh0eXBlQ2hlY2tlciwgc291cmNlRmlsZSlcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuZ2V0U3RhcnQoKSAtIGIuZ2V0U3RhcnQoKSlcbiAgICAgICAgLmZvckVhY2goKG5vZGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgICAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCkgKyBub2RlLmdldFdpZHRoKCkgKyBpbmRleCwgJyEnKTtcbiAgICAgICAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICAgICAgICB9KTtcbiAgfSk7XG59XG4iXX0=