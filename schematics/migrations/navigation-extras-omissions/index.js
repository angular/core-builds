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
        define("@angular/core/schematics/migrations/navigation-extras-omissions", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/navigation-extras-omissions/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const typescript_1 = __importDefault(require("typescript"));
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const util_1 = require("@angular/core/schematics/migrations/navigation-extras-omissions/util");
    /** Migration that switches `Router.navigateByUrl` and `Router.createUrlTree` to a new signature. */
    function default_1() {
        return (tree) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate ' +
                    'Router.navigateByUrl and Router.createUrlTree calls.');
            }
            for (const tsconfigPath of allPaths) {
                runNavigationExtrasOmissionsMigration(tree, tsconfigPath, basePath);
            }
        });
    }
    exports.default = default_1;
    function runNavigationExtrasOmissionsMigration(tree, tsconfigPath, basePath) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const printer = typescript_1.default.createPrinter();
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        sourceFiles.forEach(sourceFile => {
            const literalsToMigrate = (0, util_1.findLiteralsToMigrate)(sourceFile, typeChecker);
            const update = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            literalsToMigrate.forEach((instances, methodName) => instances.forEach(instance => {
                const migratedNode = (0, util_1.migrateLiteral)(methodName, instance);
                if (migratedNode !== instance) {
                    update.remove(instance.getStart(), instance.getWidth());
                    update.insertRight(instance.getStart(), printer.printNode(typescript_1.default.EmitHint.Unspecified, migratedNode, sourceFile));
                }
            }));
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9uYXZpZ2F0aW9uLWV4dHJhcy1vbWlzc2lvbnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCwyREFBMkU7SUFDM0UsK0JBQThCO0lBQzlCLDREQUE0QjtJQUU1QixrR0FBMkU7SUFDM0UsMkZBQTRGO0lBQzVGLCtGQUE2RDtJQUc3RCxvR0FBb0c7SUFDcEc7UUFDRSxPQUFPLENBQU8sSUFBVSxFQUFFLEVBQUU7WUFDMUIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxNQUFNLElBQUEsZ0RBQXVCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUUvQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixtREFBbUQ7b0JBQ25ELHNEQUFzRCxDQUFDLENBQUM7YUFDN0Q7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMscUNBQXFDLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUNyRTtRQUNILENBQUMsQ0FBQSxDQUFDO0lBQ0osQ0FBQztJQWhCRCw0QkFnQkM7SUFFRCxTQUFTLHFDQUFxQyxDQUFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCO1FBQy9GLE1BQU0sRUFBQyxPQUFPLEVBQUMsR0FBRyxJQUFBLHNDQUFzQixFQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sT0FBTyxHQUFHLG9CQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbkMsTUFBTSxXQUFXLEdBQ2IsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUEsOEJBQWMsRUFBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFakcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMvQixNQUFNLGlCQUFpQixHQUFHLElBQUEsNEJBQXFCLEVBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBQSxlQUFRLEVBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRXpFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ2hGLE1BQU0sWUFBWSxHQUFHLElBQUEscUJBQWMsRUFBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBRTFELElBQUksWUFBWSxLQUFLLFFBQVEsRUFBRTtvQkFDN0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQ2QsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUNuQixPQUFPLENBQUMsU0FBUyxDQUFDLG9CQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztpQkFDM0U7WUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2Nhbk1pZ3JhdGVGaWxlLCBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuaW1wb3J0IHtmaW5kTGl0ZXJhbHNUb01pZ3JhdGUsIG1pZ3JhdGVMaXRlcmFsfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKiBNaWdyYXRpb24gdGhhdCBzd2l0Y2hlcyBgUm91dGVyLm5hdmlnYXRlQnlVcmxgIGFuZCBgUm91dGVyLmNyZWF0ZVVybFRyZWVgIHRvIGEgbmV3IHNpZ25hdHVyZS4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGF3YWl0IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBhbGxQYXRocyA9IFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdO1xuXG4gICAgaWYgKCFhbGxQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgJyArXG4gICAgICAgICAgJ1JvdXRlci5uYXZpZ2F0ZUJ5VXJsIGFuZCBSb3V0ZXIuY3JlYXRlVXJsVHJlZSBjYWxscy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBhbGxQYXRocykge1xuICAgICAgcnVuTmF2aWdhdGlvbkV4dHJhc09taXNzaW9uc01pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bk5hdmlnYXRpb25FeHRyYXNPbWlzc2lvbnNNaWdyYXRpb24odHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3Qge3Byb2dyYW19ID0gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbSh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID1cbiAgICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoc291cmNlRmlsZSA9PiBjYW5NaWdyYXRlRmlsZShiYXNlUGF0aCwgc291cmNlRmlsZSwgcHJvZ3JhbSkpO1xuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgY29uc3QgbGl0ZXJhbHNUb01pZ3JhdGUgPSBmaW5kTGl0ZXJhbHNUb01pZ3JhdGUoc291cmNlRmlsZSwgdHlwZUNoZWNrZXIpO1xuICAgIGNvbnN0IHVwZGF0ZSA9IHRyZWUuYmVnaW5VcGRhdGUocmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcblxuICAgIGxpdGVyYWxzVG9NaWdyYXRlLmZvckVhY2goKGluc3RhbmNlcywgbWV0aG9kTmFtZSkgPT4gaW5zdGFuY2VzLmZvckVhY2goaW5zdGFuY2UgPT4ge1xuICAgICAgY29uc3QgbWlncmF0ZWROb2RlID0gbWlncmF0ZUxpdGVyYWwobWV0aG9kTmFtZSwgaW5zdGFuY2UpO1xuXG4gICAgICBpZiAobWlncmF0ZWROb2RlICE9PSBpbnN0YW5jZSkge1xuICAgICAgICB1cGRhdGUucmVtb3ZlKGluc3RhbmNlLmdldFN0YXJ0KCksIGluc3RhbmNlLmdldFdpZHRoKCkpO1xuICAgICAgICB1cGRhdGUuaW5zZXJ0UmlnaHQoXG4gICAgICAgICAgICBpbnN0YW5jZS5nZXRTdGFydCgpLFxuICAgICAgICAgICAgcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG1pZ3JhdGVkTm9kZSwgc291cmNlRmlsZSkpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gIH0pO1xufVxuIl19