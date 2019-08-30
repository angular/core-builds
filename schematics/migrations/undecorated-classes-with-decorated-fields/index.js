/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
        define("@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const utils_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields/utils");
    /**
     * Migration that adds an Angular decorator to classes that have Angular field decorators.
     * https://hackmd.io/vuQfavzfRG6KUCtU7oK_EA
     */
    function default_1() {
        return (tree, context) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            const logger = context.logger;
            logger.info('------ Undecorated classes with decorated fields migration ------');
            logger.info('As of Angular 9, it is no longer supported to have Angular field ' +
                'decorators on a class that does not have an Angular decorator.');
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot add an Angular decorator to undecorated classes.');
            }
            for (const tsconfigPath of allPaths) {
                runUndecoratedClassesMigration(tree, tsconfigPath, basePath);
            }
        };
    }
    exports.default = default_1;
    function runUndecoratedClassesMigration(tree, tsconfigPath, basePath) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = ts.createCompilerHost(parsed.options, true);
        // We need to overwrite the host "readFile" method, as we want the TypeScript
        // program to be based on the file contents in the virtual file tree. Otherwise
        // if we run the migration for multiple tsconfig files which have intersecting
        // source files, it can end up updating them multiple times.
        host.readFile = fileName => {
            const buffer = tree.read(path_1.relative(basePath, fileName));
            // Strip BOM as otherwise TSC methods (Ex: getWidth) will return an offset which
            // which breaks the CLI UpdateRecorder.
            // See: https://github.com/angular/angular/pull/30719
            return buffer ? buffer.toString().replace(/^\uFEFF/, '') : undefined;
        };
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const printer = ts.createPrinter();
        const sourceFiles = program.getSourceFiles().filter(file => !file.isDeclarationFile && !program.isSourceFileFromExternalLibrary(file));
        sourceFiles.forEach(sourceFile => {
            const classes = utils_1.getUndecoratedClassesWithDecoratedFields(sourceFile, typeChecker);
            if (classes.length === 0) {
                return;
            }
            const update = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
            classes.forEach((current, index) => {
                // If it's the first class that we're processing in this file, add `Directive` to the imports.
                if (index === 0 && !utils_1.hasNamedImport(current.importDeclaration, utils_1.FALLBACK_DECORATOR)) {
                    const namedImports = utils_1.getNamedImports(current.importDeclaration);
                    if (namedImports) {
                        update.remove(namedImports.getStart(), namedImports.getWidth());
                        update.insertRight(namedImports.getStart(), printer.printNode(ts.EmitHint.Unspecified, utils_1.addImport(namedImports, utils_1.FALLBACK_DECORATOR), sourceFile));
                    }
                }
                // We don't need to go through the AST to insert the decorator, because the change
                // is pretty basic. Also this has a better chance of preserving the user's formatting.
                update.insertLeft(current.classDeclaration.getStart(), `@${utils_1.FALLBACK_DECORATOR}()\n`);
            });
            tree.commitUpdate(update);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGVjb3JhdGVkLWZpZWxkcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDJEQUE2RjtJQUM3RiwrQkFBdUM7SUFDdkMsaUNBQWlDO0lBRWpDLGtHQUEyRTtJQUMzRSw2RkFBd0U7SUFDeEUsK0dBQWlJO0lBR2pJOzs7T0FHRztJQUNIO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDL0MsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxtRUFBbUUsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxJQUFJLENBQ1AsbUVBQW1FO2dCQUNuRSxnRUFBZ0UsQ0FBQyxDQUFDO1lBRXRFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNwQixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLDJGQUEyRixDQUFDLENBQUM7YUFDbEc7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFFBQVEsRUFBRTtnQkFDbkMsOEJBQThCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUM5RDtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFyQkQsNEJBcUJDO0lBRUQs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LENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcGFyc2VfdHNjb25maWcnO1xuaW1wb3J0IHtGQUxMQkFDS19ERUNPUkFUT1IsIGFkZEltcG9ydCwgZ2V0TmFtZWRJbXBvcnRzLCBnZXRVbmRlY29yYXRlZENsYXNzZXNXaXRoRGVjb3JhdGVkRmllbGRzLCBoYXNOYW1lZEltcG9ydH0gZnJvbSAnLi91dGlscyc7XG5cblxuLyoqXG4gKiBNaWdyYXRpb24gdGhhdCBhZGRzIGFuIEFuZ3VsYXIgZGVjb3JhdG9yIHRvIGNsYXNzZXMgdGhhdCBoYXZlIEFuZ3VsYXIgZmllbGQgZGVjb3JhdG9ycy5cbiAqIGh0dHBzOi8vaGFja21kLmlvL3Z1UWZhdnpmUkc2S1VDdFU3b0tfRUFcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGFsbFBhdGhzID0gWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc107XG4gICAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG5cbiAgICBsb2dnZXIuaW5mbygnLS0tLS0tIFVuZGVjb3JhdGVkIGNsYXNzZXMgd2l0aCBkZWNvcmF0ZWQgZmllbGRzIG1pZ3JhdGlvbiAtLS0tLS0nKTtcbiAgICBsb2dnZXIuaW5mbyhcbiAgICAgICAgJ0FzIG9mIEFuZ3VsYXIgOSwgaXQgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCB0byBoYXZlIEFuZ3VsYXIgZmllbGQgJyArXG4gICAgICAgICdkZWNvcmF0b3JzIG9uIGEgY2xhc3MgdGhhdCBkb2VzIG5vdCBoYXZlIGFuIEFuZ3VsYXIgZGVjb3JhdG9yLicpO1xuXG4gICAgaWYgKCFhbGxQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IGFkZCBhbiBBbmd1bGFyIGRlY29yYXRvciB0byB1bmRlY29yYXRlZCBjbGFzc2VzLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGFsbFBhdGhzKSB7XG4gICAgICBydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24odHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3QgcGFyc2VkID0gcGFyc2VUc2NvbmZpZ0ZpbGUodHNjb25maWdQYXRoLCBkaXJuYW1lKHRzY29uZmlnUGF0aCkpO1xuICBjb25zdCBob3N0ID0gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KHBhcnNlZC5vcHRpb25zLCB0cnVlKTtcblxuICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gIC8vIHByb2dyYW0gdG8gYmUgYmFzZWQgb24gdGhlIGZpbGUgY29udGVudHMgaW4gdGhlIHZpcnR1YWwgZmlsZSB0cmVlLiBPdGhlcndpc2VcbiAgLy8gaWYgd2UgcnVuIHRoZSBtaWdyYXRpb24gZm9yIG11bHRpcGxlIHRzY29uZmlnIGZpbGVzIHdoaWNoIGhhdmUgaW50ZXJzZWN0aW5nXG4gIC8vIHNvdXJjZSBmaWxlcywgaXQgY2FuIGVuZCB1cCB1cGRhdGluZyB0aGVtIG11bHRpcGxlIHRpbWVzLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICAvLyBTdHJpcCBCT00gYXMgb3RoZXJ3aXNlIFRTQyBtZXRob2RzIChFeDogZ2V0V2lkdGgpIHdpbGwgcmV0dXJuIGFuIG9mZnNldCB3aGljaFxuICAgIC8vIHdoaWNoIGJyZWFrcyB0aGUgQ0xJIFVwZGF0ZVJlY29yZGVyLlxuICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzMwNzE5XG4gICAgcmV0dXJuIGJ1ZmZlciA/IGJ1ZmZlci50b1N0cmluZygpLnJlcGxhY2UoL15cXHVGRUZGLywgJycpIDogdW5kZWZpbmVkO1xuICB9O1xuXG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGZpbGUgPT4gIWZpbGUuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmaWxlKSk7XG5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICBjb25zdCBjbGFzc2VzID0gZ2V0VW5kZWNvcmF0ZWRDbGFzc2VzV2l0aERlY29yYXRlZEZpZWxkcyhzb3VyY2VGaWxlLCB0eXBlQ2hlY2tlcik7XG5cbiAgICBpZiAoY2xhc3Nlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG5cbiAgICBjbGFzc2VzLmZvckVhY2goKGN1cnJlbnQsIGluZGV4KSA9PiB7XG4gICAgICAvLyBJZiBpdCdzIHRoZSBmaXJzdCBjbGFzcyB0aGF0IHdlJ3JlIHByb2Nlc3NpbmcgaW4gdGhpcyBmaWxlLCBhZGQgYERpcmVjdGl2ZWAgdG8gdGhlIGltcG9ydHMuXG4gICAgICBpZiAoaW5kZXggPT09IDAgJiYgIWhhc05hbWVkSW1wb3J0KGN1cnJlbnQuaW1wb3J0RGVjbGFyYXRpb24sIEZBTExCQUNLX0RFQ09SQVRPUikpIHtcbiAgICAgICAgY29uc3QgbmFtZWRJbXBvcnRzID0gZ2V0TmFtZWRJbXBvcnRzKGN1cnJlbnQuaW1wb3J0RGVjbGFyYXRpb24pO1xuXG4gICAgICAgIGlmIChuYW1lZEltcG9ydHMpIHtcbiAgICAgICAgICB1cGRhdGUucmVtb3ZlKG5hbWVkSW1wb3J0cy5nZXRTdGFydCgpLCBuYW1lZEltcG9ydHMuZ2V0V2lkdGgoKSk7XG4gICAgICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KFxuICAgICAgICAgICAgICBuYW1lZEltcG9ydHMuZ2V0U3RhcnQoKSxcbiAgICAgICAgICAgICAgcHJpbnRlci5wcmludE5vZGUoXG4gICAgICAgICAgICAgICAgICB0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgYWRkSW1wb3J0KG5hbWVkSW1wb3J0cywgRkFMTEJBQ0tfREVDT1JBVE9SKSxcbiAgICAgICAgICAgICAgICAgIHNvdXJjZUZpbGUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGdvIHRocm91Z2ggdGhlIEFTVCB0byBpbnNlcnQgdGhlIGRlY29yYXRvciwgYmVjYXVzZSB0aGUgY2hhbmdlXG4gICAgICAvLyBpcyBwcmV0dHkgYmFzaWMuIEFsc28gdGhpcyBoYXMgYSBiZXR0ZXIgY2hhbmNlIG9mIHByZXNlcnZpbmcgdGhlIHVzZXIncyBmb3JtYXR0aW5nLlxuICAgICAgdXBkYXRlLmluc2VydExlZnQoY3VycmVudC5jbGFzc0RlY2xhcmF0aW9uLmdldFN0YXJ0KCksIGBAJHtGQUxMQkFDS19ERUNPUkFUT1J9KClcXG5gKTtcbiAgICB9KTtcblxuICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gIH0pO1xufVxuIl19