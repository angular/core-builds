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
        define("@angular/core/schematics/migrations/testbed-teardown", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/testbed-teardown/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const typescript_1 = __importDefault(require("typescript"));
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const util_1 = require("@angular/core/schematics/migrations/testbed-teardown/util");
    /** Migration that adds the `teardown` flag to `TestBed` calls. */
    function default_1() {
        return (tree) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot add `teardown` flag to `TestBed`.');
            }
            for (const tsconfigPath of allPaths) {
                runTestbedTeardownMigration(tree, tsconfigPath, basePath);
            }
        });
    }
    exports.default = default_1;
    function runTestbedTeardownMigration(tree, tsconfigPath, basePath) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        const initTestEnvironmentResult = (0, util_1.findInitTestEnvironmentCalls)(typeChecker, sourceFiles);
        const printer = typescript_1.default.createPrinter();
        // If we identified at least one call to `initTestEnvironment` (can be migrated or unmigrated),
        // we don't need to migrate `configureTestingModule` or `withModule` calls, because they'll take
        // the default teardown behavior from the environment. This is preferrable, because it'll result
        // in the least number of changes to users' code.
        if (initTestEnvironmentResult.totalCalls > 0) {
            // Migrate all of the unmigrated calls `initTestEnvironment`. This could be zero
            // if the user has already opted into the new teardown behavior themselves.
            initTestEnvironmentResult.callsToMigrate.forEach(call => {
                migrate(call, util_1.migrateInitTestEnvironment, tree, basePath, printer);
            });
        }
        else {
            // Otherwise migrate the metadata passed into the `configureTestingModule` and `withModule`
            // calls. This scenario is less likely, but it could happen if `initTestEnvironment` has been
            // abstracted away or is inside a .js file.
            sourceFiles.forEach(sourceFile => {
                (0, util_1.findTestModuleMetadataNodes)(typeChecker, sourceFile).forEach(literal => {
                    migrate(literal, util_1.migrateTestModuleMetadataLiteral, tree, basePath, printer);
                });
            });
        }
    }
    function migrate(node, migrator, tree, basePath, printer) {
        const migrated = migrator(node);
        const update = tree.beginUpdate((0, path_1.relative)(basePath, node.getSourceFile().fileName));
        update.remove(node.getStart(), node.getWidth());
        update.insertRight(node.getStart(), printer.printNode(typescript_1.default.EmitHint.Unspecified, migrated, node.getSourceFile()));
        tree.commitUpdate(update);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZXN0YmVkLXRlYXJkb3duL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsMkRBQTJFO0lBQzNFLCtCQUE4QjtJQUM5Qiw0REFBNEI7SUFFNUIsa0dBQTJFO0lBQzNFLDJGQUE0RjtJQUM1RixvRkFBK0k7SUFHL0ksa0VBQWtFO0lBQ2xFO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxFQUFFO1lBQzFCLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxJQUFBLGdEQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFFL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsNEVBQTRFLENBQUMsQ0FBQzthQUNuRjtZQUVELEtBQUssTUFBTSxZQUFZLElBQUksUUFBUSxFQUFFO2dCQUNuQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzNEO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBZkQsNEJBZUM7SUFFRCxTQUFTLDJCQUEyQixDQUFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCO1FBQ3JGLE1BQU0sRUFBQyxPQUFPLEVBQUMsR0FBRyxJQUFBLHNDQUFzQixFQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sV0FBVyxHQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFjLEVBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLE1BQU0seUJBQXlCLEdBQUcsSUFBQSxtQ0FBNEIsRUFBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDekYsTUFBTSxPQUFPLEdBQUcsb0JBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUVuQywrRkFBK0Y7UUFDL0YsZ0dBQWdHO1FBQ2hHLGdHQUFnRztRQUNoRyxpREFBaUQ7UUFDakQsSUFBSSx5QkFBeUIsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFO1lBQzVDLGdGQUFnRjtZQUNoRiwyRUFBMkU7WUFDM0UseUJBQXlCLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdEQsT0FBTyxDQUFDLElBQUksRUFBRSxpQ0FBMEIsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3JFLENBQUMsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLDJGQUEyRjtZQUMzRiw2RkFBNkY7WUFDN0YsMkNBQTJDO1lBQzNDLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQy9CLElBQUEsa0NBQTJCLEVBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDckUsT0FBTyxDQUFDLE9BQU8sRUFBRSx1Q0FBZ0MsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM5RSxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0lBR0QsU0FBUyxPQUFPLENBQ1osSUFBTyxFQUFFLFFBQXdCLEVBQUUsSUFBVSxFQUFFLFFBQWdCLEVBQUUsT0FBbUI7UUFDdEYsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBQSxlQUFRLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ25GLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQ2QsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsb0JBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7cmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge2ZpbmRJbml0VGVzdEVudmlyb25tZW50Q2FsbHMsIGZpbmRUZXN0TW9kdWxlTWV0YWRhdGFOb2RlcywgbWlncmF0ZUluaXRUZXN0RW52aXJvbm1lbnQsIG1pZ3JhdGVUZXN0TW9kdWxlTWV0YWRhdGFMaXRlcmFsfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKiBNaWdyYXRpb24gdGhhdCBhZGRzIHRoZSBgdGVhcmRvd25gIGZsYWcgdG8gYFRlc3RCZWRgIGNhbGxzLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAodHJlZTogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgYWRkIGB0ZWFyZG93bmAgZmxhZyB0byBgVGVzdEJlZGAuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYWxsUGF0aHMpIHtcbiAgICAgIHJ1blRlc3RiZWRUZWFyZG93bk1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1blRlc3RiZWRUZWFyZG93bk1pZ3JhdGlvbih0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCB7cHJvZ3JhbX0gPSBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG4gIGNvbnN0IGluaXRUZXN0RW52aXJvbm1lbnRSZXN1bHQgPSBmaW5kSW5pdFRlc3RFbnZpcm9ubWVudENhbGxzKHR5cGVDaGVja2VyLCBzb3VyY2VGaWxlcyk7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG5cbiAgLy8gSWYgd2UgaWRlbnRpZmllZCBhdCBsZWFzdCBvbmUgY2FsbCB0byBgaW5pdFRlc3RFbnZpcm9ubWVudGAgKGNhbiBiZSBtaWdyYXRlZCBvciB1bm1pZ3JhdGVkKSxcbiAgLy8gd2UgZG9uJ3QgbmVlZCB0byBtaWdyYXRlIGBjb25maWd1cmVUZXN0aW5nTW9kdWxlYCBvciBgd2l0aE1vZHVsZWAgY2FsbHMsIGJlY2F1c2UgdGhleSdsbCB0YWtlXG4gIC8vIHRoZSBkZWZhdWx0IHRlYXJkb3duIGJlaGF2aW9yIGZyb20gdGhlIGVudmlyb25tZW50LiBUaGlzIGlzIHByZWZlcnJhYmxlLCBiZWNhdXNlIGl0J2xsIHJlc3VsdFxuICAvLyBpbiB0aGUgbGVhc3QgbnVtYmVyIG9mIGNoYW5nZXMgdG8gdXNlcnMnIGNvZGUuXG4gIGlmIChpbml0VGVzdEVudmlyb25tZW50UmVzdWx0LnRvdGFsQ2FsbHMgPiAwKSB7XG4gICAgLy8gTWlncmF0ZSBhbGwgb2YgdGhlIHVubWlncmF0ZWQgY2FsbHMgYGluaXRUZXN0RW52aXJvbm1lbnRgLiBUaGlzIGNvdWxkIGJlIHplcm9cbiAgICAvLyBpZiB0aGUgdXNlciBoYXMgYWxyZWFkeSBvcHRlZCBpbnRvIHRoZSBuZXcgdGVhcmRvd24gYmVoYXZpb3IgdGhlbXNlbHZlcy5cbiAgICBpbml0VGVzdEVudmlyb25tZW50UmVzdWx0LmNhbGxzVG9NaWdyYXRlLmZvckVhY2goY2FsbCA9PiB7XG4gICAgICBtaWdyYXRlKGNhbGwsIG1pZ3JhdGVJbml0VGVzdEVudmlyb25tZW50LCB0cmVlLCBiYXNlUGF0aCwgcHJpbnRlcik7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gT3RoZXJ3aXNlIG1pZ3JhdGUgdGhlIG1ldGFkYXRhIHBhc3NlZCBpbnRvIHRoZSBgY29uZmlndXJlVGVzdGluZ01vZHVsZWAgYW5kIGB3aXRoTW9kdWxlYFxuICAgIC8vIGNhbGxzLiBUaGlzIHNjZW5hcmlvIGlzIGxlc3MgbGlrZWx5LCBidXQgaXQgY291bGQgaGFwcGVuIGlmIGBpbml0VGVzdEVudmlyb25tZW50YCBoYXMgYmVlblxuICAgIC8vIGFic3RyYWN0ZWQgYXdheSBvciBpcyBpbnNpZGUgYSAuanMgZmlsZS5cbiAgICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgICAgZmluZFRlc3RNb2R1bGVNZXRhZGF0YU5vZGVzKHR5cGVDaGVja2VyLCBzb3VyY2VGaWxlKS5mb3JFYWNoKGxpdGVyYWwgPT4ge1xuICAgICAgICBtaWdyYXRlKGxpdGVyYWwsIG1pZ3JhdGVUZXN0TW9kdWxlTWV0YWRhdGFMaXRlcmFsLCB0cmVlLCBiYXNlUGF0aCwgcHJpbnRlcik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIG1pZ3JhdGU8VCBleHRlbmRzIHRzLk5vZGU+KFxuICAgIG5vZGU6IFQsIG1pZ3JhdG9yOiAobm9kZTogVCkgPT4gVCwgdHJlZTogVHJlZSwgYmFzZVBhdGg6IHN0cmluZywgcHJpbnRlcjogdHMuUHJpbnRlcikge1xuICBjb25zdCBtaWdyYXRlZCA9IG1pZ3JhdG9yKG5vZGUpO1xuICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBub2RlLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZSkpO1xuICB1cGRhdGUucmVtb3ZlKG5vZGUuZ2V0U3RhcnQoKSwgbm9kZS5nZXRXaWR0aCgpKTtcbiAgdXBkYXRlLmluc2VydFJpZ2h0KFxuICAgICAgbm9kZS5nZXRTdGFydCgpLCBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbWlncmF0ZWQsIG5vZGUuZ2V0U291cmNlRmlsZSgpKSk7XG4gIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG59XG4iXX0=