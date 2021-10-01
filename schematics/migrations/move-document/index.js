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
        define("@angular/core/schematics/migrations/move-document", ["require", "exports", "@angular-devkit/schematics", "path", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/move-document/document_import_visitor", "@angular/core/schematics/migrations/move-document/move-import"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const document_import_visitor_1 = require("@angular/core/schematics/migrations/move-document/document_import_visitor");
    const move_import_1 = require("@angular/core/schematics/migrations/move-document/move-import");
    /** Entry point for the V8 move-document migration. */
    function default_1() {
        return (tree) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException(`Could not find any tsconfig file. Cannot migrate DOCUMENT
          to new import source.`);
            }
            for (const tsconfigPath of [...buildPaths, ...testPaths]) {
                runMoveDocumentMigration(tree, tsconfigPath, basePath);
            }
        });
    }
    exports.default = default_1;
    /**
     * Runs the DOCUMENT InjectionToken import migration for the given TypeScript project. The
     * schematic analyzes the imports within the project and moves the deprecated symbol to the
     * new import source.
     */
    function runMoveDocumentMigration(tree, tsconfigPath, basePath) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const visitor = new document_import_visitor_1.DocumentImportVisitor(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        // Analyze source files by finding imports.
        sourceFiles.forEach(sourceFile => visitor.visitNode(sourceFile));
        const { importsMap } = visitor;
        // Walk through all source files that contain resolved queries and update
        // the source files if needed. Note that we need to update multiple queries
        // within a source file within the same recorder in order to not throw off
        // the TypeScript node offsets.
        importsMap.forEach((resolvedImport, sourceFile) => {
            const { platformBrowserImport, commonImport, documentElement } = resolvedImport;
            if (!documentElement || !platformBrowserImport) {
                return;
            }
            const update = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            const platformBrowserDeclaration = platformBrowserImport.parent.parent;
            const newPlatformBrowserText = (0, move_import_1.removeFromImport)(platformBrowserImport, sourceFile, document_import_visitor_1.DOCUMENT_TOKEN_NAME);
            const newCommonText = commonImport ?
                (0, move_import_1.addToImport)(commonImport, sourceFile, documentElement.name, documentElement.propertyName) :
                (0, move_import_1.createImport)(document_import_visitor_1.COMMON_IMPORT, sourceFile, documentElement.name, documentElement.propertyName);
            // Replace the existing query decorator call expression with the updated
            // call expression node.
            update.remove(platformBrowserDeclaration.getStart(), platformBrowserDeclaration.getWidth());
            update.insertRight(platformBrowserDeclaration.getStart(), newPlatformBrowserText);
            if (commonImport) {
                const commonDeclaration = commonImport.parent.parent;
                update.remove(commonDeclaration.getStart(), commonDeclaration.getWidth());
                update.insertRight(commonDeclaration.getStart(), newCommonText);
            }
            else {
                update.insertRight(platformBrowserDeclaration.getStart(), newCommonText);
            }
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9tb3ZlLWRvY3VtZW50L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsMkRBQTJFO0lBQzNFLCtCQUE4QjtJQUc5QixrR0FBMkU7SUFDM0UsMkZBQTRGO0lBRTVGLHVIQUE0SDtJQUM1SCwrRkFBMEU7SUFHMUUsc0RBQXNEO0lBQ3REO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxFQUFFO1lBQzFCLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxJQUFBLGdEQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUUvQixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FBQztnQ0FDSixDQUFDLENBQUM7YUFDN0I7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRTtnQkFDeEQsd0JBQXdCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN4RDtRQUNILENBQUMsQ0FBQSxDQUFDO0lBQ0osQ0FBQztJQWRELDRCQWNDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQVMsd0JBQXdCLENBQUMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0I7UUFDbEYsTUFBTSxFQUFDLE9BQU8sRUFBQyxHQUFHLElBQUEsc0NBQXNCLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSwrQ0FBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2RCxNQUFNLFdBQVcsR0FDYixPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBQSw4QkFBYyxFQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUVqRywyQ0FBMkM7UUFDM0MsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUVqRSxNQUFNLEVBQUMsVUFBVSxFQUFDLEdBQUcsT0FBTyxDQUFDO1FBRTdCLHlFQUF5RTtRQUN6RSwyRUFBMkU7UUFDM0UsMEVBQTBFO1FBQzFFLCtCQUErQjtRQUMvQixVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsY0FBc0MsRUFBRSxVQUF5QixFQUFFLEVBQUU7WUFDdkYsTUFBTSxFQUFDLHFCQUFxQixFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUMsR0FBRyxjQUFjLENBQUM7WUFDOUUsSUFBSSxDQUFDLGVBQWUsSUFBSSxDQUFDLHFCQUFxQixFQUFFO2dCQUM5QyxPQUFPO2FBQ1I7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUEsZUFBUSxFQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUV6RSxNQUFNLDBCQUEwQixHQUFHLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDdkUsTUFBTSxzQkFBc0IsR0FDeEIsSUFBQSw4QkFBZ0IsRUFBQyxxQkFBcUIsRUFBRSxVQUFVLEVBQUUsNkNBQW1CLENBQUMsQ0FBQztZQUM3RSxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsQ0FBQztnQkFDaEMsSUFBQSx5QkFBVyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsZUFBZSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDM0YsSUFBQSwwQkFBWSxFQUFDLHVDQUFhLEVBQUUsVUFBVSxFQUFFLGVBQWUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRWhHLHdFQUF3RTtZQUN4RSx3QkFBd0I7WUFDeEIsTUFBTSxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsRUFBRSwwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sQ0FBQyxXQUFXLENBQUMsMEJBQTBCLENBQUMsUUFBUSxFQUFFLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUVsRixJQUFJLFlBQVksRUFBRTtnQkFDaEIsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDckQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQ2pFO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxXQUFXLENBQUMsMEJBQTBCLENBQUMsUUFBUSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDMUU7WUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7cmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5cbmltcG9ydCB7Q09NTU9OX0lNUE9SVCwgRE9DVU1FTlRfVE9LRU5fTkFNRSwgRG9jdW1lbnRJbXBvcnRWaXNpdG9yLCBSZXNvbHZlZERvY3VtZW50SW1wb3J0fSBmcm9tICcuL2RvY3VtZW50X2ltcG9ydF92aXNpdG9yJztcbmltcG9ydCB7YWRkVG9JbXBvcnQsIGNyZWF0ZUltcG9ydCwgcmVtb3ZlRnJvbUltcG9ydH0gZnJvbSAnLi9tb3ZlLWltcG9ydCc7XG5cblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjggbW92ZS1kb2N1bWVudCBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlKSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBhd2FpdCBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihgQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBtaWdyYXRlIERPQ1VNRU5UXG4gICAgICAgICAgdG8gbmV3IGltcG9ydCBzb3VyY2UuYCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc10pIHtcbiAgICAgIHJ1bk1vdmVEb2N1bWVudE1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUnVucyB0aGUgRE9DVU1FTlQgSW5qZWN0aW9uVG9rZW4gaW1wb3J0IG1pZ3JhdGlvbiBmb3IgdGhlIGdpdmVuIFR5cGVTY3JpcHQgcHJvamVjdC4gVGhlXG4gKiBzY2hlbWF0aWMgYW5hbHl6ZXMgdGhlIGltcG9ydHMgd2l0aGluIHRoZSBwcm9qZWN0IGFuZCBtb3ZlcyB0aGUgZGVwcmVjYXRlZCBzeW1ib2wgdG8gdGhlXG4gKiBuZXcgaW1wb3J0IHNvdXJjZS5cbiAqL1xuZnVuY3Rpb24gcnVuTW92ZURvY3VtZW50TWlncmF0aW9uKHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHtwcm9ncmFtfSA9IGNyZWF0ZU1pZ3JhdGlvblByb2dyYW0odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCB2aXNpdG9yID0gbmV3IERvY3VtZW50SW1wb3J0VmlzaXRvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID1cbiAgICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoc291cmNlRmlsZSA9PiBjYW5NaWdyYXRlRmlsZShiYXNlUGF0aCwgc291cmNlRmlsZSwgcHJvZ3JhbSkpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGZpbmRpbmcgaW1wb3J0cy5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHZpc2l0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7aW1wb3J0c01hcH0gPSB2aXNpdG9yO1xuXG4gIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIHRoYXQgY29udGFpbiByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGVcbiAgLy8gdGhlIHNvdXJjZSBmaWxlcyBpZiBuZWVkZWQuIE5vdGUgdGhhdCB3ZSBuZWVkIHRvIHVwZGF0ZSBtdWx0aXBsZSBxdWVyaWVzXG4gIC8vIHdpdGhpbiBhIHNvdXJjZSBmaWxlIHdpdGhpbiB0aGUgc2FtZSByZWNvcmRlciBpbiBvcmRlciB0byBub3QgdGhyb3cgb2ZmXG4gIC8vIHRoZSBUeXBlU2NyaXB0IG5vZGUgb2Zmc2V0cy5cbiAgaW1wb3J0c01hcC5mb3JFYWNoKChyZXNvbHZlZEltcG9ydDogUmVzb2x2ZWREb2N1bWVudEltcG9ydCwgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSkgPT4ge1xuICAgIGNvbnN0IHtwbGF0Zm9ybUJyb3dzZXJJbXBvcnQsIGNvbW1vbkltcG9ydCwgZG9jdW1lbnRFbGVtZW50fSA9IHJlc29sdmVkSW1wb3J0O1xuICAgIGlmICghZG9jdW1lbnRFbGVtZW50IHx8ICFwbGF0Zm9ybUJyb3dzZXJJbXBvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuXG4gICAgY29uc3QgcGxhdGZvcm1Ccm93c2VyRGVjbGFyYXRpb24gPSBwbGF0Zm9ybUJyb3dzZXJJbXBvcnQucGFyZW50LnBhcmVudDtcbiAgICBjb25zdCBuZXdQbGF0Zm9ybUJyb3dzZXJUZXh0ID1cbiAgICAgICAgcmVtb3ZlRnJvbUltcG9ydChwbGF0Zm9ybUJyb3dzZXJJbXBvcnQsIHNvdXJjZUZpbGUsIERPQ1VNRU5UX1RPS0VOX05BTUUpO1xuICAgIGNvbnN0IG5ld0NvbW1vblRleHQgPSBjb21tb25JbXBvcnQgP1xuICAgICAgICBhZGRUb0ltcG9ydChjb21tb25JbXBvcnQsIHNvdXJjZUZpbGUsIGRvY3VtZW50RWxlbWVudC5uYW1lLCBkb2N1bWVudEVsZW1lbnQucHJvcGVydHlOYW1lKSA6XG4gICAgICAgIGNyZWF0ZUltcG9ydChDT01NT05fSU1QT1JULCBzb3VyY2VGaWxlLCBkb2N1bWVudEVsZW1lbnQubmFtZSwgZG9jdW1lbnRFbGVtZW50LnByb3BlcnR5TmFtZSk7XG5cbiAgICAvLyBSZXBsYWNlIHRoZSBleGlzdGluZyBxdWVyeSBkZWNvcmF0b3IgY2FsbCBleHByZXNzaW9uIHdpdGggdGhlIHVwZGF0ZWRcbiAgICAvLyBjYWxsIGV4cHJlc3Npb24gbm9kZS5cbiAgICB1cGRhdGUucmVtb3ZlKHBsYXRmb3JtQnJvd3NlckRlY2xhcmF0aW9uLmdldFN0YXJ0KCksIHBsYXRmb3JtQnJvd3NlckRlY2xhcmF0aW9uLmdldFdpZHRoKCkpO1xuICAgIHVwZGF0ZS5pbnNlcnRSaWdodChwbGF0Zm9ybUJyb3dzZXJEZWNsYXJhdGlvbi5nZXRTdGFydCgpLCBuZXdQbGF0Zm9ybUJyb3dzZXJUZXh0KTtcblxuICAgIGlmIChjb21tb25JbXBvcnQpIHtcbiAgICAgIGNvbnN0IGNvbW1vbkRlY2xhcmF0aW9uID0gY29tbW9uSW1wb3J0LnBhcmVudC5wYXJlbnQ7XG4gICAgICB1cGRhdGUucmVtb3ZlKGNvbW1vbkRlY2xhcmF0aW9uLmdldFN0YXJ0KCksIGNvbW1vbkRlY2xhcmF0aW9uLmdldFdpZHRoKCkpO1xuICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KGNvbW1vbkRlY2xhcmF0aW9uLmdldFN0YXJ0KCksIG5ld0NvbW1vblRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGUuaW5zZXJ0UmlnaHQocGxhdGZvcm1Ccm93c2VyRGVjbGFyYXRpb24uZ2V0U3RhcnQoKSwgbmV3Q29tbW9uVGV4dCk7XG4gICAgfVxuXG4gICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlKTtcbiAgfSk7XG59XG4iXX0=