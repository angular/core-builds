/**
 * @license
 * Copyright Google LLC All Rights Reserved.
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
        define("@angular/core/schematics/migrations/wait-for-async", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/utils/typescript/nodes", "@angular/core/schematics/migrations/wait-for-async/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const nodes_1 = require("@angular/core/schematics/utils/typescript/nodes");
    const util_1 = require("@angular/core/schematics/migrations/wait-for-async/util");
    const MODULE_AUGMENTATION_FILENAME = 'ɵɵASYNC_MIGRATION_CORE_AUGMENTATION.d.ts';
    /** Migration that switches from `async` to `waitForAsync`. */
    function default_1() {
        return (tree) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate async usages to waitForAsync.');
            }
            for (const tsconfigPath of allPaths) {
                runWaitForAsyncMigration(tree, tsconfigPath, basePath);
            }
        };
    }
    exports.default = default_1;
    function runWaitForAsyncMigration(tree, tsconfigPath, basePath) {
        const { program } = compiler_host_1.createMigrationProgram(tree, tsconfigPath, basePath, fileName => {
            // In case the module augmentation file has been requested, we return a source file that
            // augments "@angular/core/testing" to include a named export called "async". This ensures that
            // we can rely on the type checker for this migration after `async` has been removed.
            if (fileName === MODULE_AUGMENTATION_FILENAME) {
                return `
        import '@angular/core/testing';
        declare module "@angular/core/testing" {
          function async(fn: Function): any;
        }
      `;
            }
            return null;
        }, [MODULE_AUGMENTATION_FILENAME]);
        const typeChecker = program.getTypeChecker();
        const printer = ts.createPrinter();
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        const deprecatedFunction = 'async';
        const newFunction = 'waitForAsync';
        sourceFiles.forEach(sourceFile => {
            const asyncImportSpecifier = imports_1.getImportSpecifier(sourceFile, '@angular/core/testing', deprecatedFunction);
            const asyncImport = asyncImportSpecifier ?
                nodes_1.closestNode(asyncImportSpecifier, ts.SyntaxKind.NamedImports) :
                null;
            // If there are no imports for `async`, we can exit early.
            if (!asyncImportSpecifier || !asyncImport) {
                return;
            }
            const update = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
            // Change the `async` import to `waitForAsync`.
            update.remove(asyncImport.getStart(), asyncImport.getWidth());
            update.insertRight(asyncImport.getStart(), printer.printNode(ts.EmitHint.Unspecified, imports_1.replaceImport(asyncImport, deprecatedFunction, newFunction), sourceFile));
            // Change `async` calls to `waitForAsync`.
            util_1.findAsyncReferences(sourceFile, typeChecker, asyncImportSpecifier).forEach(node => {
                update.remove(node.getStart(), node.getWidth());
                update.insertRight(node.getStart(), newFunction);
            });
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy93YWl0LWZvci1hc3luYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJEQUEyRTtJQUMzRSwrQkFBOEI7SUFDOUIsaUNBQWlDO0lBRWpDLGtHQUEyRTtJQUMzRSwyRkFBNEU7SUFDNUUsK0VBQWlGO0lBQ2pGLDJFQUF5RDtJQUV6RCxrRkFBMkM7SUFFM0MsTUFBTSw0QkFBNEIsR0FBRywwQ0FBMEMsQ0FBQztJQUVoRiw4REFBOEQ7SUFDOUQ7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLEVBQUU7WUFDcEIsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBRS9DLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNwQixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLGdGQUFnRixDQUFDLENBQUM7YUFDdkY7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN4RDtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFmRCw0QkFlQztJQUVELFNBQVMsd0JBQXdCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDbEYsTUFBTSxFQUFDLE9BQU8sRUFBQyxHQUFHLHNDQUFzQixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ2hGLHdGQUF3RjtZQUN4RiwrRkFBK0Y7WUFDL0YscUZBQXFGO1lBQ3JGLElBQUksUUFBUSxLQUFLLDRCQUE0QixFQUFFO2dCQUM3QyxPQUFPOzs7OztPQUtOLENBQUM7YUFDSDtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxFQUFFLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO1FBQ25DLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3QyxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDbkMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FDL0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDO1FBQ25DLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQztRQUVuQyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQy9CLE1BQU0sb0JBQW9CLEdBQ3RCLDRCQUFrQixDQUFDLFVBQVUsRUFBRSx1QkFBdUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sV0FBVyxHQUFHLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3RDLG1CQUFXLENBQWtCLG9CQUFvQixFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDaEYsSUFBSSxDQUFDO1lBRVQsMERBQTBEO1lBQzFELElBQUksQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDekMsT0FBTzthQUNSO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRXpFLCtDQUErQztZQUMvQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM5RCxNQUFNLENBQUMsV0FBVyxDQUNkLFdBQVcsQ0FBQyxRQUFRLEVBQUUsRUFDdEIsT0FBTyxDQUFDLFNBQVMsQ0FDYixFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSx1QkFBYSxDQUFDLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLENBQUMsRUFDcEYsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUVyQiwwQ0FBMEM7WUFDMUMsMEJBQW1CLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDaEYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y3JlYXRlTWlncmF0aW9uUHJvZ3JhbX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7Z2V0SW1wb3J0U3BlY2lmaWVyLCByZXBsYWNlSW1wb3J0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuaW1wb3J0IHtjbG9zZXN0Tm9kZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9ub2Rlcyc7XG5cbmltcG9ydCB7ZmluZEFzeW5jUmVmZXJlbmNlc30gZnJvbSAnLi91dGlsJztcblxuY29uc3QgTU9EVUxFX0FVR01FTlRBVElPTl9GSUxFTkFNRSA9ICfJtcm1QVNZTkNfTUlHUkFUSU9OX0NPUkVfQVVHTUVOVEFUSU9OLmQudHMnO1xuXG4vKiogTWlncmF0aW9uIHRoYXQgc3dpdGNoZXMgZnJvbSBgYXN5bmNgIHRvIGB3YWl0Rm9yQXN5bmNgLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBhc3luYyB1c2FnZXMgdG8gd2FpdEZvckFzeW5jLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGFsbFBhdGhzKSB7XG4gICAgICBydW5XYWl0Rm9yQXN5bmNNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5XYWl0Rm9yQXN5bmNNaWdyYXRpb24odHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3Qge3Byb2dyYW19ID0gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbSh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBmaWxlTmFtZSA9PiB7XG4gICAgLy8gSW4gY2FzZSB0aGUgbW9kdWxlIGF1Z21lbnRhdGlvbiBmaWxlIGhhcyBiZWVuIHJlcXVlc3RlZCwgd2UgcmV0dXJuIGEgc291cmNlIGZpbGUgdGhhdFxuICAgIC8vIGF1Z21lbnRzIFwiQGFuZ3VsYXIvY29yZS90ZXN0aW5nXCIgdG8gaW5jbHVkZSBhIG5hbWVkIGV4cG9ydCBjYWxsZWQgXCJhc3luY1wiLiBUaGlzIGVuc3VyZXMgdGhhdFxuICAgIC8vIHdlIGNhbiByZWx5IG9uIHRoZSB0eXBlIGNoZWNrZXIgZm9yIHRoaXMgbWlncmF0aW9uIGFmdGVyIGBhc3luY2AgaGFzIGJlZW4gcmVtb3ZlZC5cbiAgICBpZiAoZmlsZU5hbWUgPT09IE1PRFVMRV9BVUdNRU5UQVRJT05fRklMRU5BTUUpIHtcbiAgICAgIHJldHVybiBgXG4gICAgICAgIGltcG9ydCAnQGFuZ3VsYXIvY29yZS90ZXN0aW5nJztcbiAgICAgICAgZGVjbGFyZSBtb2R1bGUgXCJAYW5ndWxhci9jb3JlL3Rlc3RpbmdcIiB7XG4gICAgICAgICAgZnVuY3Rpb24gYXN5bmMoZm46IEZ1bmN0aW9uKTogYW55O1xuICAgICAgICB9XG4gICAgICBgO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSwgW01PRFVMRV9BVUdNRU5UQVRJT05fRklMRU5BTUVdKTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG4gIGNvbnN0IGRlcHJlY2F0ZWRGdW5jdGlvbiA9ICdhc3luYyc7XG4gIGNvbnN0IG5ld0Z1bmN0aW9uID0gJ3dhaXRGb3JBc3luYyc7XG5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICBjb25zdCBhc3luY0ltcG9ydFNwZWNpZmllciA9XG4gICAgICAgIGdldEltcG9ydFNwZWNpZmllcihzb3VyY2VGaWxlLCAnQGFuZ3VsYXIvY29yZS90ZXN0aW5nJywgZGVwcmVjYXRlZEZ1bmN0aW9uKTtcbiAgICBjb25zdCBhc3luY0ltcG9ydCA9IGFzeW5jSW1wb3J0U3BlY2lmaWVyID9cbiAgICAgICAgY2xvc2VzdE5vZGU8dHMuTmFtZWRJbXBvcnRzPihhc3luY0ltcG9ydFNwZWNpZmllciwgdHMuU3ludGF4S2luZC5OYW1lZEltcG9ydHMpIDpcbiAgICAgICAgbnVsbDtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBubyBpbXBvcnRzIGZvciBgYXN5bmNgLCB3ZSBjYW4gZXhpdCBlYXJseS5cbiAgICBpZiAoIWFzeW5jSW1wb3J0U3BlY2lmaWVyIHx8ICFhc3luY0ltcG9ydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZSA9IHRyZWUuYmVnaW5VcGRhdGUocmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcblxuICAgIC8vIENoYW5nZSB0aGUgYGFzeW5jYCBpbXBvcnQgdG8gYHdhaXRGb3JBc3luY2AuXG4gICAgdXBkYXRlLnJlbW92ZShhc3luY0ltcG9ydC5nZXRTdGFydCgpLCBhc3luY0ltcG9ydC5nZXRXaWR0aCgpKTtcbiAgICB1cGRhdGUuaW5zZXJ0UmlnaHQoXG4gICAgICAgIGFzeW5jSW1wb3J0LmdldFN0YXJ0KCksXG4gICAgICAgIHByaW50ZXIucHJpbnROb2RlKFxuICAgICAgICAgICAgdHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHJlcGxhY2VJbXBvcnQoYXN5bmNJbXBvcnQsIGRlcHJlY2F0ZWRGdW5jdGlvbiwgbmV3RnVuY3Rpb24pLFxuICAgICAgICAgICAgc291cmNlRmlsZSkpO1xuXG4gICAgLy8gQ2hhbmdlIGBhc3luY2AgY2FsbHMgdG8gYHdhaXRGb3JBc3luY2AuXG4gICAgZmluZEFzeW5jUmVmZXJlbmNlcyhzb3VyY2VGaWxlLCB0eXBlQ2hlY2tlciwgYXN5bmNJbXBvcnRTcGVjaWZpZXIpLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICB1cGRhdGUucmVtb3ZlKG5vZGUuZ2V0U3RhcnQoKSwgbm9kZS5nZXRXaWR0aCgpKTtcbiAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIG5ld0Z1bmN0aW9uKTtcbiAgICB9KTtcblxuICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gIH0pO1xufVxuIl19