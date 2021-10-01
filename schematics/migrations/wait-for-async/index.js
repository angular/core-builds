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
        define("@angular/core/schematics/migrations/wait-for-async", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/utils/typescript/nodes", "@angular/core/schematics/migrations/wait-for-async/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const typescript_1 = __importDefault(require("typescript"));
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const nodes_1 = require("@angular/core/schematics/utils/typescript/nodes");
    const util_1 = require("@angular/core/schematics/migrations/wait-for-async/util");
    const MODULE_AUGMENTATION_FILENAME = 'ɵɵASYNC_MIGRATION_CORE_AUGMENTATION.d.ts';
    /** Migration that switches from `async` to `waitForAsync`. */
    function default_1() {
        return (tree) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate async usages to waitForAsync.');
            }
            for (const tsconfigPath of allPaths) {
                runWaitForAsyncMigration(tree, tsconfigPath, basePath);
            }
        });
    }
    exports.default = default_1;
    function runWaitForAsyncMigration(tree, tsconfigPath, basePath) {
        // Technically we can get away with using `MODULE_AUGMENTATION_FILENAME` as the path, but as of
        // TS 4.2, the module resolution caching seems to be more aggressive which causes the file to be
        // retained between test runs. We can avoid it by using the full path.
        const augmentedFilePath = (0, path_1.join)(basePath, MODULE_AUGMENTATION_FILENAME);
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath, fileName => {
            // In case the module augmentation file has been requested, we return a source file that
            // augments "@angular/core/testing" to include a named export called "async". This ensures that
            // we can rely on the type checker for this migration after `async` has been removed.
            if ((0, path_1.basename)(fileName) === MODULE_AUGMENTATION_FILENAME) {
                return `
        import '@angular/core/testing';
        declare module "@angular/core/testing" {
          function async(fn: Function): any;
        }
      `;
            }
            return undefined;
        }, [augmentedFilePath]);
        const typeChecker = program.getTypeChecker();
        const printer = typescript_1.default.createPrinter();
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        const deprecatedFunction = 'async';
        const newFunction = 'waitForAsync';
        sourceFiles.forEach(sourceFile => {
            const asyncImportSpecifier = (0, imports_1.getImportSpecifier)(sourceFile, '@angular/core/testing', deprecatedFunction);
            const asyncImport = asyncImportSpecifier ?
                (0, nodes_1.closestNode)(asyncImportSpecifier, typescript_1.default.SyntaxKind.NamedImports) :
                null;
            // If there are no imports for `async`, we can exit early.
            if (!asyncImportSpecifier || !asyncImport) {
                return;
            }
            const update = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            // Change the `async` import to `waitForAsync`.
            update.remove(asyncImport.getStart(), asyncImport.getWidth());
            update.insertRight(asyncImport.getStart(), printer.printNode(typescript_1.default.EmitHint.Unspecified, (0, imports_1.replaceImport)(asyncImport, deprecatedFunction, newFunction), sourceFile));
            // Change `async` calls to `waitForAsync`.
            (0, util_1.findAsyncReferences)(sourceFile, typeChecker, asyncImportSpecifier).forEach(node => {
                update.remove(node.getStart(), node.getWidth());
                update.insertRight(node.getStart(), newFunction);
            });
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy93YWl0LWZvci1hc3luYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDJEQUEyRTtJQUMzRSwrQkFBOEM7SUFDOUMsNERBQTRCO0lBRTVCLGtHQUEyRTtJQUMzRSwyRkFBNEY7SUFDNUYsK0VBQWlGO0lBQ2pGLDJFQUF5RDtJQUV6RCxrRkFBMkM7SUFFM0MsTUFBTSw0QkFBNEIsR0FBRywwQ0FBMEMsQ0FBQztJQUVoRiw4REFBOEQ7SUFDOUQ7UUFDRSxPQUFPLENBQU8sSUFBVSxFQUFFLEVBQUU7WUFDMUIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxNQUFNLElBQUEsZ0RBQXVCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUUvQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixnRkFBZ0YsQ0FBQyxDQUFDO2FBQ3ZGO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxRQUFRLEVBQUU7Z0JBQ25DLHdCQUF3QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDeEQ7UUFDSCxDQUFDLENBQUEsQ0FBQztJQUNKLENBQUM7SUFmRCw0QkFlQztJQUVELFNBQVMsd0JBQXdCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDbEYsK0ZBQStGO1FBQy9GLGdHQUFnRztRQUNoRyxzRUFBc0U7UUFDdEUsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLFdBQUksRUFBQyxRQUFRLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUN2RSxNQUFNLEVBQUMsT0FBTyxFQUFDLEdBQUcsSUFBQSxzQ0FBc0IsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRTtZQUNoRix3RkFBd0Y7WUFDeEYsK0ZBQStGO1lBQy9GLHFGQUFxRjtZQUNyRixJQUFJLElBQUEsZUFBUSxFQUFDLFFBQVEsQ0FBQyxLQUFLLDRCQUE0QixFQUFFO2dCQUN2RCxPQUFPOzs7OztPQUtOLENBQUM7YUFDSDtZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUN4QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxPQUFPLEdBQUcsb0JBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFdBQVcsR0FDYixPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBQSw4QkFBYyxFQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNqRyxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQztRQUNuQyxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUM7UUFFbkMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMvQixNQUFNLG9CQUFvQixHQUN0QixJQUFBLDRCQUFrQixFQUFDLFVBQVUsRUFBRSx1QkFBdUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sV0FBVyxHQUFHLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3RDLElBQUEsbUJBQVcsRUFBa0Isb0JBQW9CLEVBQUUsb0JBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDaEYsSUFBSSxDQUFDO1lBRVQsMERBQTBEO1lBQzFELElBQUksQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDekMsT0FBTzthQUNSO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGVBQVEsRUFBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFekUsK0NBQStDO1lBQy9DLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxFQUFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxXQUFXLENBQ2QsV0FBVyxDQUFDLFFBQVEsRUFBRSxFQUN0QixPQUFPLENBQUMsU0FBUyxDQUNiLG9CQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxJQUFBLHVCQUFhLEVBQUMsV0FBVyxFQUFFLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxFQUNwRixVQUFVLENBQUMsQ0FBQyxDQUFDO1lBRXJCLDBDQUEwQztZQUMxQyxJQUFBLDBCQUFtQixFQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2hGLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtiYXNlbmFtZSwgam9pbiwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge2dldEltcG9ydFNwZWNpZmllciwgcmVwbGFjZUltcG9ydH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9pbXBvcnRzJztcbmltcG9ydCB7Y2xvc2VzdE5vZGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvbm9kZXMnO1xuXG5pbXBvcnQge2ZpbmRBc3luY1JlZmVyZW5jZXN9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IE1PRFVMRV9BVUdNRU5UQVRJT05fRklMRU5BTUUgPSAnybXJtUFTWU5DX01JR1JBVElPTl9DT1JFX0FVR01FTlRBVElPTi5kLnRzJztcblxuLyoqIE1pZ3JhdGlvbiB0aGF0IHN3aXRjaGVzIGZyb20gYGFzeW5jYCB0byBgd2FpdEZvckFzeW5jYC4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGF3YWl0IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBhbGxQYXRocyA9IFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdO1xuXG4gICAgaWYgKCFhbGxQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgYXN5bmMgdXNhZ2VzIHRvIHdhaXRGb3JBc3luYy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBhbGxQYXRocykge1xuICAgICAgcnVuV2FpdEZvckFzeW5jTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gcnVuV2FpdEZvckFzeW5jTWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIC8vIFRlY2huaWNhbGx5IHdlIGNhbiBnZXQgYXdheSB3aXRoIHVzaW5nIGBNT0RVTEVfQVVHTUVOVEFUSU9OX0ZJTEVOQU1FYCBhcyB0aGUgcGF0aCwgYnV0IGFzIG9mXG4gIC8vIFRTIDQuMiwgdGhlIG1vZHVsZSByZXNvbHV0aW9uIGNhY2hpbmcgc2VlbXMgdG8gYmUgbW9yZSBhZ2dyZXNzaXZlIHdoaWNoIGNhdXNlcyB0aGUgZmlsZSB0byBiZVxuICAvLyByZXRhaW5lZCBiZXR3ZWVuIHRlc3QgcnVucy4gV2UgY2FuIGF2b2lkIGl0IGJ5IHVzaW5nIHRoZSBmdWxsIHBhdGguXG4gIGNvbnN0IGF1Z21lbnRlZEZpbGVQYXRoID0gam9pbihiYXNlUGF0aCwgTU9EVUxFX0FVR01FTlRBVElPTl9GSUxFTkFNRSk7XG4gIGNvbnN0IHtwcm9ncmFtfSA9IGNyZWF0ZU1pZ3JhdGlvblByb2dyYW0odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgZmlsZU5hbWUgPT4ge1xuICAgIC8vIEluIGNhc2UgdGhlIG1vZHVsZSBhdWdtZW50YXRpb24gZmlsZSBoYXMgYmVlbiByZXF1ZXN0ZWQsIHdlIHJldHVybiBhIHNvdXJjZSBmaWxlIHRoYXRcbiAgICAvLyBhdWdtZW50cyBcIkBhbmd1bGFyL2NvcmUvdGVzdGluZ1wiIHRvIGluY2x1ZGUgYSBuYW1lZCBleHBvcnQgY2FsbGVkIFwiYXN5bmNcIi4gVGhpcyBlbnN1cmVzIHRoYXRcbiAgICAvLyB3ZSBjYW4gcmVseSBvbiB0aGUgdHlwZSBjaGVja2VyIGZvciB0aGlzIG1pZ3JhdGlvbiBhZnRlciBgYXN5bmNgIGhhcyBiZWVuIHJlbW92ZWQuXG4gICAgaWYgKGJhc2VuYW1lKGZpbGVOYW1lKSA9PT0gTU9EVUxFX0FVR01FTlRBVElPTl9GSUxFTkFNRSkge1xuICAgICAgcmV0dXJuIGBcbiAgICAgICAgaW1wb3J0ICdAYW5ndWxhci9jb3JlL3Rlc3RpbmcnO1xuICAgICAgICBkZWNsYXJlIG1vZHVsZSBcIkBhbmd1bGFyL2NvcmUvdGVzdGluZ1wiIHtcbiAgICAgICAgICBmdW5jdGlvbiBhc3luYyhmbjogRnVuY3Rpb24pOiBhbnk7XG4gICAgICAgIH1cbiAgICAgIGA7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0sIFthdWdtZW50ZWRGaWxlUGF0aF0pO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG4gIGNvbnN0IGRlcHJlY2F0ZWRGdW5jdGlvbiA9ICdhc3luYyc7XG4gIGNvbnN0IG5ld0Z1bmN0aW9uID0gJ3dhaXRGb3JBc3luYyc7XG5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICBjb25zdCBhc3luY0ltcG9ydFNwZWNpZmllciA9XG4gICAgICAgIGdldEltcG9ydFNwZWNpZmllcihzb3VyY2VGaWxlLCAnQGFuZ3VsYXIvY29yZS90ZXN0aW5nJywgZGVwcmVjYXRlZEZ1bmN0aW9uKTtcbiAgICBjb25zdCBhc3luY0ltcG9ydCA9IGFzeW5jSW1wb3J0U3BlY2lmaWVyID9cbiAgICAgICAgY2xvc2VzdE5vZGU8dHMuTmFtZWRJbXBvcnRzPihhc3luY0ltcG9ydFNwZWNpZmllciwgdHMuU3ludGF4S2luZC5OYW1lZEltcG9ydHMpIDpcbiAgICAgICAgbnVsbDtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBubyBpbXBvcnRzIGZvciBgYXN5bmNgLCB3ZSBjYW4gZXhpdCBlYXJseS5cbiAgICBpZiAoIWFzeW5jSW1wb3J0U3BlY2lmaWVyIHx8ICFhc3luY0ltcG9ydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZSA9IHRyZWUuYmVnaW5VcGRhdGUocmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcblxuICAgIC8vIENoYW5nZSB0aGUgYGFzeW5jYCBpbXBvcnQgdG8gYHdhaXRGb3JBc3luY2AuXG4gICAgdXBkYXRlLnJlbW92ZShhc3luY0ltcG9ydC5nZXRTdGFydCgpLCBhc3luY0ltcG9ydC5nZXRXaWR0aCgpKTtcbiAgICB1cGRhdGUuaW5zZXJ0UmlnaHQoXG4gICAgICAgIGFzeW5jSW1wb3J0LmdldFN0YXJ0KCksXG4gICAgICAgIHByaW50ZXIucHJpbnROb2RlKFxuICAgICAgICAgICAgdHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHJlcGxhY2VJbXBvcnQoYXN5bmNJbXBvcnQsIGRlcHJlY2F0ZWRGdW5jdGlvbiwgbmV3RnVuY3Rpb24pLFxuICAgICAgICAgICAgc291cmNlRmlsZSkpO1xuXG4gICAgLy8gQ2hhbmdlIGBhc3luY2AgY2FsbHMgdG8gYHdhaXRGb3JBc3luY2AuXG4gICAgZmluZEFzeW5jUmVmZXJlbmNlcyhzb3VyY2VGaWxlLCB0eXBlQ2hlY2tlciwgYXN5bmNJbXBvcnRTcGVjaWZpZXIpLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICB1cGRhdGUucmVtb3ZlKG5vZGUuZ2V0U3RhcnQoKSwgbm9kZS5nZXRXaWR0aCgpKTtcbiAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIG5ld0Z1bmN0aW9uKTtcbiAgICB9KTtcblxuICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gIH0pO1xufVxuIl19