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
            initTestEnvironmentResult.callsToMigrate.forEach(node => {
                const { span, text } = (0, util_1.getInitTestEnvironmentLiteralReplacement)(node, printer);
                const update = tree.beginUpdate((0, path_1.relative)(basePath, node.getSourceFile().fileName));
                // The update appears to break if we try to call `remove` with a zero length.
                if (span.length > 0) {
                    update.remove(span.start, span.length);
                }
                update.insertRight(span.start, text);
                tree.commitUpdate(update);
            });
        }
        else {
            // Otherwise migrate the metadata passed into the `configureTestingModule` and `withModule`
            // calls. This scenario is less likely, but it could happen if `initTestEnvironment` has been
            // abstracted away or is inside a .js file.
            sourceFiles.forEach(sourceFile => {
                (0, util_1.findTestModuleMetadataNodes)(typeChecker, sourceFile).forEach(node => {
                    const migrated = (0, util_1.migrateTestModuleMetadataLiteral)(node);
                    const update = tree.beginUpdate((0, path_1.relative)(basePath, node.getSourceFile().fileName));
                    update.remove(node.getStart(), node.getWidth());
                    update.insertRight(node.getStart(), printer.printNode(typescript_1.default.EmitHint.Unspecified, migrated, node.getSourceFile()));
                    tree.commitUpdate(update);
                });
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZXN0YmVkLXRlYXJkb3duL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsMkRBQTJFO0lBQzNFLCtCQUE4QjtJQUM5Qiw0REFBNEI7SUFFNUIsa0dBQTJFO0lBQzNFLDJGQUE0RjtJQUM1RixvRkFBNko7SUFHN0osa0VBQWtFO0lBQ2xFO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxFQUFFO1lBQzFCLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxJQUFBLGdEQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFFL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsNEVBQTRFLENBQUMsQ0FBQzthQUNuRjtZQUVELEtBQUssTUFBTSxZQUFZLElBQUksUUFBUSxFQUFFO2dCQUNuQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzNEO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBZkQsNEJBZUM7SUFFRCxTQUFTLDJCQUEyQixDQUFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCO1FBQ3JGLE1BQU0sRUFBQyxPQUFPLEVBQUMsR0FBRyxJQUFBLHNDQUFzQixFQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sV0FBVyxHQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFjLEVBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLE1BQU0seUJBQXlCLEdBQUcsSUFBQSxtQ0FBNEIsRUFBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDekYsTUFBTSxPQUFPLEdBQUcsb0JBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUVuQywrRkFBK0Y7UUFDL0YsZ0dBQWdHO1FBQ2hHLGdHQUFnRztRQUNoRyxpREFBaUQ7UUFDakQsSUFBSSx5QkFBeUIsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFO1lBQzVDLGdGQUFnRjtZQUNoRiwyRUFBMkU7WUFDM0UseUJBQXlCLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdEQsTUFBTSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsR0FBRyxJQUFBLCtDQUF3QyxFQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDN0UsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGVBQVEsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ25GLDZFQUE2RTtnQkFDN0UsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDbkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDeEM7Z0JBQ0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLDJGQUEyRjtZQUMzRiw2RkFBNkY7WUFDN0YsMkNBQTJDO1lBQzNDLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQy9CLElBQUEsa0NBQTJCLEVBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDbEUsTUFBTSxRQUFRLEdBQUcsSUFBQSx1Q0FBZ0MsRUFBQyxJQUFJLENBQUMsQ0FBQztvQkFDeEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGVBQVEsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ25GLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO29CQUNoRCxNQUFNLENBQUMsV0FBVyxDQUNkLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFDZixPQUFPLENBQUMsU0FBUyxDQUFDLG9CQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDaEYsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7cmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge2ZpbmRJbml0VGVzdEVudmlyb25tZW50Q2FsbHMsIGZpbmRUZXN0TW9kdWxlTWV0YWRhdGFOb2RlcywgZ2V0SW5pdFRlc3RFbnZpcm9ubWVudExpdGVyYWxSZXBsYWNlbWVudCwgbWlncmF0ZVRlc3RNb2R1bGVNZXRhZGF0YUxpdGVyYWx9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqIE1pZ3JhdGlvbiB0aGF0IGFkZHMgdGhlIGB0ZWFyZG93bmAgZmxhZyB0byBgVGVzdEJlZGAgY2FsbHMuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlKSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBhd2FpdCBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgYWxsUGF0aHMgPSBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXTtcblxuICAgIGlmICghYWxsUGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBhZGQgYHRlYXJkb3duYCBmbGFnIHRvIGBUZXN0QmVkYC4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBhbGxQYXRocykge1xuICAgICAgcnVuVGVzdGJlZFRlYXJkb3duTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuVGVzdGJlZFRlYXJkb3duTWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHtwcm9ncmFtfSA9IGNyZWF0ZU1pZ3JhdGlvblByb2dyYW0odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9XG4gICAgICBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKHNvdXJjZUZpbGUgPT4gY2FuTWlncmF0ZUZpbGUoYmFzZVBhdGgsIHNvdXJjZUZpbGUsIHByb2dyYW0pKTtcbiAgY29uc3QgaW5pdFRlc3RFbnZpcm9ubWVudFJlc3VsdCA9IGZpbmRJbml0VGVzdEVudmlyb25tZW50Q2FsbHModHlwZUNoZWNrZXIsIHNvdXJjZUZpbGVzKTtcbiAgY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcblxuICAvLyBJZiB3ZSBpZGVudGlmaWVkIGF0IGxlYXN0IG9uZSBjYWxsIHRvIGBpbml0VGVzdEVudmlyb25tZW50YCAoY2FuIGJlIG1pZ3JhdGVkIG9yIHVubWlncmF0ZWQpLFxuICAvLyB3ZSBkb24ndCBuZWVkIHRvIG1pZ3JhdGUgYGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVgIG9yIGB3aXRoTW9kdWxlYCBjYWxscywgYmVjYXVzZSB0aGV5J2xsIHRha2VcbiAgLy8gdGhlIGRlZmF1bHQgdGVhcmRvd24gYmVoYXZpb3IgZnJvbSB0aGUgZW52aXJvbm1lbnQuIFRoaXMgaXMgcHJlZmVycmFibGUsIGJlY2F1c2UgaXQnbGwgcmVzdWx0XG4gIC8vIGluIHRoZSBsZWFzdCBudW1iZXIgb2YgY2hhbmdlcyB0byB1c2VycycgY29kZS5cbiAgaWYgKGluaXRUZXN0RW52aXJvbm1lbnRSZXN1bHQudG90YWxDYWxscyA+IDApIHtcbiAgICAvLyBNaWdyYXRlIGFsbCBvZiB0aGUgdW5taWdyYXRlZCBjYWxscyBgaW5pdFRlc3RFbnZpcm9ubWVudGAuIFRoaXMgY291bGQgYmUgemVyb1xuICAgIC8vIGlmIHRoZSB1c2VyIGhhcyBhbHJlYWR5IG9wdGVkIGludG8gdGhlIG5ldyB0ZWFyZG93biBiZWhhdmlvciB0aGVtc2VsdmVzLlxuICAgIGluaXRUZXN0RW52aXJvbm1lbnRSZXN1bHQuY2FsbHNUb01pZ3JhdGUuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGNvbnN0IHtzcGFuLCB0ZXh0fSA9IGdldEluaXRUZXN0RW52aXJvbm1lbnRMaXRlcmFsUmVwbGFjZW1lbnQobm9kZSwgcHJpbnRlcik7XG4gICAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBub2RlLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZSkpO1xuICAgICAgLy8gVGhlIHVwZGF0ZSBhcHBlYXJzIHRvIGJyZWFrIGlmIHdlIHRyeSB0byBjYWxsIGByZW1vdmVgIHdpdGggYSB6ZXJvIGxlbmd0aC5cbiAgICAgIGlmIChzcGFuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdXBkYXRlLnJlbW92ZShzcGFuLnN0YXJ0LCBzcGFuLmxlbmd0aCk7XG4gICAgICB9XG4gICAgICB1cGRhdGUuaW5zZXJ0UmlnaHQoc3Bhbi5zdGFydCwgdGV4dCk7XG4gICAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIC8vIE90aGVyd2lzZSBtaWdyYXRlIHRoZSBtZXRhZGF0YSBwYXNzZWQgaW50byB0aGUgYGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVgIGFuZCBgd2l0aE1vZHVsZWBcbiAgICAvLyBjYWxscy4gVGhpcyBzY2VuYXJpbyBpcyBsZXNzIGxpa2VseSwgYnV0IGl0IGNvdWxkIGhhcHBlbiBpZiBgaW5pdFRlc3RFbnZpcm9ubWVudGAgaGFzIGJlZW5cbiAgICAvLyBhYnN0cmFjdGVkIGF3YXkgb3IgaXMgaW5zaWRlIGEgLmpzIGZpbGUuXG4gICAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICAgIGZpbmRUZXN0TW9kdWxlTWV0YWRhdGFOb2Rlcyh0eXBlQ2hlY2tlciwgc291cmNlRmlsZSkuZm9yRWFjaChub2RlID0+IHtcbiAgICAgICAgY29uc3QgbWlncmF0ZWQgPSBtaWdyYXRlVGVzdE1vZHVsZU1ldGFkYXRhTGl0ZXJhbChub2RlKTtcbiAgICAgICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgbm9kZS5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWUpKTtcbiAgICAgICAgdXBkYXRlLnJlbW92ZShub2RlLmdldFN0YXJ0KCksIG5vZGUuZ2V0V2lkdGgoKSk7XG4gICAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChcbiAgICAgICAgICAgIG5vZGUuZ2V0U3RhcnQoKSxcbiAgICAgICAgICAgIHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBtaWdyYXRlZCwgbm9kZS5nZXRTb3VyY2VGaWxlKCkpKTtcbiAgICAgICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG4iXX0=