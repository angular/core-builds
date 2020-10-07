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
        return (tree) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate AbstractControl.parent accesses.');
            }
            for (const tsconfigPath of allPaths) {
                runNativeAbstractControlParentMigration(tree, tsconfigPath, basePath);
            }
        };
    }
    exports.default = default_1;
    function runNativeAbstractControlParentMigration(tree, tsconfigPath, basePath) {
        const { program } = compiler_host_1.createMigrationProgram(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9hYnN0cmFjdC1jb250cm9sLXBhcmVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJEQUEyRTtJQUMzRSwrQkFBOEI7SUFFOUIsa0dBQTJFO0lBQzNFLDJGQUE0RTtJQUM1RSwyRkFBMEM7SUFHMUMsNkVBQTZFO0lBQzdFO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxFQUFFO1lBQ3BCLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUUvQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixtRkFBbUYsQ0FBQyxDQUFDO2FBQzFGO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxRQUFRLEVBQUU7Z0JBQ25DLHVDQUF1QyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDdkU7UUFDSCxDQUFDLENBQUM7SUFDSixDQUFDO0lBZkQsNEJBZUM7SUFFRCxTQUFTLHVDQUF1QyxDQUM1QyxJQUFVLEVBQUUsWUFBb0IsRUFBRSxRQUFnQjtRQUNwRCxNQUFNLEVBQUMsT0FBTyxFQUFDLEdBQUcsc0NBQXNCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FDL0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTlFLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDL0IsMkZBQTJGO1lBQzNGLHVGQUF1RjtZQUN2Rix5RkFBeUY7WUFDekYseUZBQXlGO1lBQ3pGLHNGQUFzRjtZQUN0Riw0RUFBNEU7WUFDNUUseUJBQWtCLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQztpQkFDdEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztpQkFDM0MsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQVEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFDVCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcblxuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2NyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5pbXBvcnQge2ZpbmRQYXJlbnRBY2Nlc3Nlc30gZnJvbSAnLi91dGlsJztcblxuXG4vKiogTWlncmF0aW9uIHRoYXQgbWFya3MgYWNjZXNzZXMgb2YgYEFic3RyYWN0Q29udHJvbC5wYXJlbnRgIGFzIG5vbi1udWxsLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBBYnN0cmFjdENvbnRyb2wucGFyZW50IGFjY2Vzc2VzLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGFsbFBhdGhzKSB7XG4gICAgICBydW5OYXRpdmVBYnN0cmFjdENvbnRyb2xQYXJlbnRNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5OYXRpdmVBYnN0cmFjdENvbnRyb2xQYXJlbnRNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3Qge3Byb2dyYW19ID0gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbSh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICAvLyBXZSBzb3J0IHRoZSBub2RlcyBiYXNlZCBvbiB0aGVpciBwb3NpdGlvbiBpbiB0aGUgZmlsZSBhbmQgd2Ugb2Zmc2V0IHRoZSBwb3NpdGlvbnMgYnkgb25lXG4gICAgLy8gZm9yIGVhY2ggbm9uLW51bGwgYXNzZXJ0aW9uIHRoYXQgd2UndmUgYWRkZWQuIFdlIGhhdmUgdG8gZG8gaXQgdGhpcyB3YXksIHJhdGhlciB0aGFuXG4gICAgLy8gY3JlYXRpbmcgYW5kIHByaW50aW5nIGEgbmV3IEFTVCBub2RlIGxpa2UgaW4gb3RoZXIgbWlncmF0aW9ucywgYmVjYXVzZSBwcm9wZXJ0eSBhY2Nlc3NcbiAgICAvLyBleHByZXNzaW9ucyBjYW4gYmUgbmVzdGVkIChlLmcuIGBjb250cm9sLnBhcmVudC5wYXJlbnQudmFsdWVgKSwgYnV0IHRoZSBub2RlIHBvc2l0aW9uc1xuICAgIC8vIGFyZW4ndCBiZWluZyB1cGRhdGVkIGFzIHdlJ3JlIGluc2VydGluZyBuZXcgY29kZS4gSWYgd2Ugd2VyZSB0byBnbyB0aHJvdWdoIHRoZSBBU1QsXG4gICAgLy8gd2UnZCBoYXZlIHRvIHVwZGF0ZSB0aGUgYFNvdXJjZUZpbGVgIGFuZCBzdGFydCBvdmVyIGFmdGVyIGVhY2ggb3BlcmF0aW9uLlxuICAgIGZpbmRQYXJlbnRBY2Nlc3Nlcyh0eXBlQ2hlY2tlciwgc291cmNlRmlsZSlcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuZ2V0U3RhcnQoKSAtIGIuZ2V0U3RhcnQoKSlcbiAgICAgICAgLmZvckVhY2goKG5vZGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgICAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCkgKyBub2RlLmdldFdpZHRoKCkgKyBpbmRleCwgJyEnKTtcbiAgICAgICAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICAgICAgICB9KTtcbiAgfSk7XG59XG4iXX0=