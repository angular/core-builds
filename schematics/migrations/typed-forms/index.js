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
        define("@angular/core/schematics/migrations/typed-forms", ["require", "exports", "@angular-devkit/schematics", "path", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/typed-forms/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.insertAnyImport = exports.migrateNode = void 0;
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const util_1 = require("@angular/core/schematics/migrations/typed-forms/util");
    function default_1() {
        return (tree) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate to Typed Forms.');
            }
            for (const tsconfigPath of allPaths) {
                runTypedFormsMigration(tree, tsconfigPath, basePath);
            }
        });
    }
    exports.default = default_1;
    function runTypedFormsMigration(tree, tsconfigPath, basePath) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        for (const sourceFile of sourceFiles) {
            const controlClassImports = (0, util_1.getControlClassImports)(sourceFile);
            const formBuilderImport = (0, util_1.getFormBuilderImport)(sourceFile);
            // If no relevant classes are imported, we can exit early.
            if (controlClassImports.length === 0 && formBuilderImport === null)
                return;
            const update = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            // For each control class, migrate all of its uses.
            for (const importSpecifier of controlClassImports) {
                const usages = (0, util_1.findControlClassUsages)(sourceFile, typeChecker, importSpecifier);
                for (const node of usages) {
                    migrateNode(update, node, importSpecifier);
                }
            }
            // For each FormBuilder method, migrate all of its uses.
            const nodes = (0, util_1.findFormBuilderCalls)(sourceFile, typeChecker, formBuilderImport);
            for (const n of nodes) {
                migrateNode(update, n, formBuilderImport);
            }
            // Add the any symbol used by the migrated calls.
            if ((0, util_1.getAnyImport)(sourceFile) === null) {
                const firstValidFormsImport = [...controlClassImports, formBuilderImport].sort().filter(i => i !== null)[0];
                insertAnyImport(update, firstValidFormsImport);
            }
            tree.commitUpdate(update);
        }
    }
    function migrateNode(update, node, importd) {
        if (importd === null)
            return;
        update.insertRight(node.node.getEnd(), node.generic);
    }
    exports.migrateNode = migrateNode;
    function insertAnyImport(update, importd) {
        update.insertLeft(importd.getStart(), `${util_1.anySymbolName}, `);
    }
    exports.insertAnyImport = insertAnyImport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90eXBlZC1mb3Jtcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCwyREFBMkY7SUFDM0YsK0JBQThCO0lBRzlCLGtHQUEyRTtJQUMzRSwyRkFBNEY7SUFFNUYsK0VBQStKO0lBRS9KO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxFQUFFO1lBQzFCLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxJQUFBLGdEQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFFL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsa0VBQWtFLENBQUMsQ0FBQzthQUN6RTtZQUVELEtBQUssTUFBTSxZQUFZLElBQUksUUFBUSxFQUFFO2dCQUNuQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ3REO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBZkQsNEJBZUM7SUFFRCxTQUFTLHNCQUFzQixDQUFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCO1FBQ2hGLE1BQU0sRUFBQyxPQUFPLEVBQUMsR0FBRyxJQUFBLHNDQUFzQixFQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sV0FBVyxHQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFjLEVBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRWpHLEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFO1lBQ3BDLE1BQU0sbUJBQW1CLEdBQUcsSUFBQSw2QkFBc0IsRUFBQyxVQUFVLENBQUMsQ0FBQztZQUMvRCxNQUFNLGlCQUFpQixHQUFHLElBQUEsMkJBQW9CLEVBQUMsVUFBVSxDQUFDLENBQUM7WUFFM0QsMERBQTBEO1lBQzFELElBQUksbUJBQW1CLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxpQkFBaUIsS0FBSyxJQUFJO2dCQUFFLE9BQU87WUFFM0UsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGVBQVEsRUFBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFekUsbURBQW1EO1lBQ25ELEtBQUssTUFBTSxlQUFlLElBQUksbUJBQW1CLEVBQUU7Z0JBQ2pELE1BQU0sTUFBTSxHQUFHLElBQUEsNkJBQXNCLEVBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQztnQkFDaEYsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLEVBQUU7b0JBQ3pCLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2lCQUM1QzthQUNGO1lBRUQsd0RBQXdEO1lBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUEsMkJBQW9CLEVBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQy9FLEtBQUssTUFBTSxDQUFDLElBQUksS0FBSyxFQUFFO2dCQUNyQixXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2FBQzNDO1lBRUQsaURBQWlEO1lBQ2pELElBQUksSUFBQSxtQkFBWSxFQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDckMsTUFBTSxxQkFBcUIsR0FDdkIsQ0FBQyxHQUFHLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO2dCQUNuRixlQUFlLENBQUMsTUFBTSxFQUFFLHFCQUFxQixDQUFDLENBQUM7YUFDaEQ7WUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzNCO0lBQ0gsQ0FBQztJQUVELFNBQWdCLFdBQVcsQ0FDdkIsTUFBc0IsRUFBRSxJQUFvQixFQUFFLE9BQWdDO1FBQ2hGLElBQUksT0FBTyxLQUFLLElBQUk7WUFBRSxPQUFPO1FBQzdCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUpELGtDQUlDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLE1BQXNCLEVBQUUsT0FBMkI7UUFDakYsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxvQkFBYSxJQUFJLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRkQsMENBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlLCBVcGRhdGVSZWNvcmRlcn0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtyZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjYW5NaWdyYXRlRmlsZSwgY3JlYXRlTWlncmF0aW9uUHJvZ3JhbX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcblxuaW1wb3J0IHthbnlTeW1ib2xOYW1lLCBmaW5kQ29udHJvbENsYXNzVXNhZ2VzLCBmaW5kRm9ybUJ1aWxkZXJDYWxscywgZ2V0QW55SW1wb3J0LCBnZXRDb250cm9sQ2xhc3NJbXBvcnRzLCBnZXRGb3JtQnVpbGRlckltcG9ydCwgTWlncmF0YWJsZU5vZGV9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGF3YWl0IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBhbGxQYXRocyA9IFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdO1xuXG4gICAgaWYgKCFhbGxQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgdG8gVHlwZWQgRm9ybXMuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYWxsUGF0aHMpIHtcbiAgICAgIHJ1blR5cGVkRm9ybXNNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5UeXBlZEZvcm1zTWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHtwcm9ncmFtfSA9IGNyZWF0ZU1pZ3JhdGlvblByb2dyYW0odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9XG4gICAgICBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKHNvdXJjZUZpbGUgPT4gY2FuTWlncmF0ZUZpbGUoYmFzZVBhdGgsIHNvdXJjZUZpbGUsIHByb2dyYW0pKTtcblxuICBmb3IgKGNvbnN0IHNvdXJjZUZpbGUgb2Ygc291cmNlRmlsZXMpIHtcbiAgICBjb25zdCBjb250cm9sQ2xhc3NJbXBvcnRzID0gZ2V0Q29udHJvbENsYXNzSW1wb3J0cyhzb3VyY2VGaWxlKTtcbiAgICBjb25zdCBmb3JtQnVpbGRlckltcG9ydCA9IGdldEZvcm1CdWlsZGVySW1wb3J0KHNvdXJjZUZpbGUpO1xuXG4gICAgLy8gSWYgbm8gcmVsZXZhbnQgY2xhc3NlcyBhcmUgaW1wb3J0ZWQsIHdlIGNhbiBleGl0IGVhcmx5LlxuICAgIGlmIChjb250cm9sQ2xhc3NJbXBvcnRzLmxlbmd0aCA9PT0gMCAmJiBmb3JtQnVpbGRlckltcG9ydCA9PT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuXG4gICAgLy8gRm9yIGVhY2ggY29udHJvbCBjbGFzcywgbWlncmF0ZSBhbGwgb2YgaXRzIHVzZXMuXG4gICAgZm9yIChjb25zdCBpbXBvcnRTcGVjaWZpZXIgb2YgY29udHJvbENsYXNzSW1wb3J0cykge1xuICAgICAgY29uc3QgdXNhZ2VzID0gZmluZENvbnRyb2xDbGFzc1VzYWdlcyhzb3VyY2VGaWxlLCB0eXBlQ2hlY2tlciwgaW1wb3J0U3BlY2lmaWVyKTtcbiAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiB1c2FnZXMpIHtcbiAgICAgICAgbWlncmF0ZU5vZGUodXBkYXRlLCBub2RlLCBpbXBvcnRTcGVjaWZpZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvciBlYWNoIEZvcm1CdWlsZGVyIG1ldGhvZCwgbWlncmF0ZSBhbGwgb2YgaXRzIHVzZXMuXG4gICAgY29uc3Qgbm9kZXMgPSBmaW5kRm9ybUJ1aWxkZXJDYWxscyhzb3VyY2VGaWxlLCB0eXBlQ2hlY2tlciwgZm9ybUJ1aWxkZXJJbXBvcnQpO1xuICAgIGZvciAoY29uc3QgbiBvZiBub2Rlcykge1xuICAgICAgbWlncmF0ZU5vZGUodXBkYXRlLCBuLCBmb3JtQnVpbGRlckltcG9ydCk7XG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBhbnkgc3ltYm9sIHVzZWQgYnkgdGhlIG1pZ3JhdGVkIGNhbGxzLlxuICAgIGlmIChnZXRBbnlJbXBvcnQoc291cmNlRmlsZSkgPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGZpcnN0VmFsaWRGb3Jtc0ltcG9ydCA9XG4gICAgICAgICAgWy4uLmNvbnRyb2xDbGFzc0ltcG9ydHMsIGZvcm1CdWlsZGVySW1wb3J0XS5zb3J0KCkuZmlsdGVyKGkgPT4gaSAhPT0gbnVsbClbMF0hO1xuICAgICAgaW5zZXJ0QW55SW1wb3J0KHVwZGF0ZSwgZmlyc3RWYWxpZEZvcm1zSW1wb3J0KTtcbiAgICB9XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtaWdyYXRlTm9kZShcbiAgICB1cGRhdGU6IFVwZGF0ZVJlY29yZGVyLCBub2RlOiBNaWdyYXRhYmxlTm9kZSwgaW1wb3J0ZDogdHMuSW1wb3J0U3BlY2lmaWVyfG51bGwpIHtcbiAgaWYgKGltcG9ydGQgPT09IG51bGwpIHJldHVybjtcbiAgdXBkYXRlLmluc2VydFJpZ2h0KG5vZGUubm9kZS5nZXRFbmQoKSwgbm9kZS5nZW5lcmljKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc2VydEFueUltcG9ydCh1cGRhdGU6IFVwZGF0ZVJlY29yZGVyLCBpbXBvcnRkOiB0cy5JbXBvcnRTcGVjaWZpZXIpIHtcbiAgdXBkYXRlLmluc2VydExlZnQoaW1wb3J0ZC5nZXRTdGFydCgpLCBgJHthbnlTeW1ib2xOYW1lfSwgYCk7XG59XG4iXX0=