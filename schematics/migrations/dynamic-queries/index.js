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
        define("@angular/core/schematics/migrations/dynamic-queries", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/dynamic-queries/util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const util_1 = require("@angular/core/schematics/migrations/dynamic-queries/util");
    /**
     * Runs the dynamic queries migration for all TypeScript projects in the current CLI workspace.
     */
    function default_1() {
        return (tree, ctx) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const allPaths = [...buildPaths, ...testPaths];
            ctx.logger.info('------ Dynamic queries migration ------');
            if (!allPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate dynamic queries.');
            }
            for (const tsconfigPath of allPaths) {
                runDynamicQueryMigration(tree, tsconfigPath, basePath);
            }
        };
    }
    exports.default = default_1;
    function runDynamicQueryMigration(tree, tsconfigPath, basePath) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = ts.createCompilerHost(parsed.options, true);
        // We need to overwrite the host "readFile" method, as we want the TypeScript
        // program to be based on the file contents in the virtual file tree. Otherwise
        // if we run the migration for multiple tsconfig files which have intersecting
        // source files, it can end up updating query definitions multiple times.
        host.readFile = fileName => {
            const buffer = tree.read(path_1.relative(basePath, fileName));
            // Strip BOM as otherwise TSC methods (Ex: getWidth) will return an offset which
            // which breaks the CLI UpdateRecorder.
            // See: https://github.com/angular/angular/pull/30719
            return buffer ? buffer.toString().replace(/^\uFEFF/, '') : undefined;
        };
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        const printer = ts.createPrinter();
        sourceFiles.forEach(sourceFile => {
            const result = util_1.identifyDynamicQueryNodes(typeChecker, sourceFile);
            if (result.removeProperty.length || result.removeParameter.length) {
                const update = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
                result.removeProperty.forEach(node => {
                    update.remove(node.getStart(), node.getWidth());
                    update.insertRight(node.getStart(), printer.printNode(ts.EmitHint.Unspecified, util_1.removeStaticFlag(node), sourceFile));
                });
                result.removeParameter.forEach(node => {
                    update.remove(node.getStart(), node.getWidth());
                    update.insertRight(node.getStart(), printer.printNode(ts.EmitHint.Unspecified, util_1.removeOptionsParameter(node), sourceFile));
                });
                tree.commitUpdate(update);
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9keW5hbWljLXF1ZXJpZXMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwyREFBNkY7SUFDN0YsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxrR0FBMkU7SUFDM0UsNkZBQXdFO0lBQ3hFLG1GQUEyRjtJQUczRjs7T0FFRztJQUNIO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxHQUFxQixFQUFFLEVBQUU7WUFDM0MsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFVBQVUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBRS9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxDQUFDLENBQUM7WUFFM0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsbUVBQW1FLENBQUMsQ0FBQzthQUMxRTtZQUVELEtBQUssTUFBTSxZQUFZLElBQUksUUFBUSxFQUFFO2dCQUNuQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ3hEO1FBQ0gsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQWpCRCw0QkFpQkM7SUFFRCxTQUFTLHdCQUF3QixDQUFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCO1FBQ2xGLE1BQU0sTUFBTSxHQUFHLGtDQUFpQixDQUFDLFlBQVksRUFBRSxjQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV6RCw2RUFBNkU7UUFDN0UsK0VBQStFO1FBQy9FLDhFQUE4RTtRQUM5RSx5RUFBeUU7UUFDekUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsRUFBRTtZQUN6QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN2RCxnRkFBZ0Y7WUFDaEYsdUNBQXVDO1lBQ3ZDLHFEQUFxRDtZQUNyRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN2RSxDQUFDLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FDL0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUVuQyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQy9CLE1BQU0sTUFBTSxHQUFHLGdDQUF5QixDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVsRSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFO2dCQUNqRSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQVEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBRXpFLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNuQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FDZCxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQ2YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSx1QkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUN0RixDQUFDLENBQUMsQ0FBQztnQkFFSCxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDcEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQ2QsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUNmLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsNkJBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDNUYsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUMzQjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcGFyc2VfdHNjb25maWcnO1xuaW1wb3J0IHtpZGVudGlmeUR5bmFtaWNRdWVyeU5vZGVzLCByZW1vdmVPcHRpb25zUGFyYW1ldGVyLCByZW1vdmVTdGF0aWNGbGFnfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogUnVucyB0aGUgZHluYW1pYyBxdWVyaWVzIG1pZ3JhdGlvbiBmb3IgYWxsIFR5cGVTY3JpcHQgcHJvamVjdHMgaW4gdGhlIGN1cnJlbnQgQ0xJIHdvcmtzcGFjZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY3R4OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgYWxsUGF0aHMgPSBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXTtcblxuICAgIGN0eC5sb2dnZXIuaW5mbygnLS0tLS0tIER5bmFtaWMgcXVlcmllcyBtaWdyYXRpb24gLS0tLS0tJyk7XG5cbiAgICBpZiAoIWFsbFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBkeW5hbWljIHF1ZXJpZXMuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYWxsUGF0aHMpIHtcbiAgICAgIHJ1bkR5bmFtaWNRdWVyeU1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bkR5bmFtaWNRdWVyeU1pZ3JhdGlvbih0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZykge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBob3N0IFwicmVhZEZpbGVcIiBtZXRob2QsIGFzIHdlIHdhbnQgdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuIE90aGVyd2lzZVxuICAvLyBpZiB3ZSBydW4gdGhlIG1pZ3JhdGlvbiBmb3IgbXVsdGlwbGUgdHNjb25maWcgZmlsZXMgd2hpY2ggaGF2ZSBpbnRlcnNlY3RpbmdcbiAgLy8gc291cmNlIGZpbGVzLCBpdCBjYW4gZW5kIHVwIHVwZGF0aW5nIHF1ZXJ5IGRlZmluaXRpb25zIG11bHRpcGxlIHRpbWVzLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICAvLyBTdHJpcCBCT00gYXMgb3RoZXJ3aXNlIFRTQyBtZXRob2RzIChFeDogZ2V0V2lkdGgpIHdpbGwgcmV0dXJuIGFuIG9mZnNldCB3aGljaFxuICAgIC8vIHdoaWNoIGJyZWFrcyB0aGUgQ0xJIFVwZGF0ZVJlY29yZGVyLlxuICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzMwNzE5XG4gICAgcmV0dXJuIGJ1ZmZlciA/IGJ1ZmZlci50b1N0cmluZygpLnJlcGxhY2UoL15cXHVGRUZGLywgJycpIDogdW5kZWZpbmVkO1xuICB9O1xuXG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBpZGVudGlmeUR5bmFtaWNRdWVyeU5vZGVzKHR5cGVDaGVja2VyLCBzb3VyY2VGaWxlKTtcblxuICAgIGlmIChyZXN1bHQucmVtb3ZlUHJvcGVydHkubGVuZ3RoIHx8IHJlc3VsdC5yZW1vdmVQYXJhbWV0ZXIubGVuZ3RoKSB7XG4gICAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG5cbiAgICAgIHJlc3VsdC5yZW1vdmVQcm9wZXJ0eS5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgICB1cGRhdGUucmVtb3ZlKG5vZGUuZ2V0U3RhcnQoKSwgbm9kZS5nZXRXaWR0aCgpKTtcbiAgICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KFxuICAgICAgICAgICAgbm9kZS5nZXRTdGFydCgpLFxuICAgICAgICAgICAgcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHJlbW92ZVN0YXRpY0ZsYWcobm9kZSksIHNvdXJjZUZpbGUpKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXN1bHQucmVtb3ZlUGFyYW1ldGVyLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIHVwZGF0ZS5yZW1vdmUobm9kZS5nZXRTdGFydCgpLCBub2RlLmdldFdpZHRoKCkpO1xuICAgICAgICB1cGRhdGUuaW5zZXJ0UmlnaHQoXG4gICAgICAgICAgICBub2RlLmdldFN0YXJ0KCksXG4gICAgICAgICAgICBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgcmVtb3ZlT3B0aW9uc1BhcmFtZXRlcihub2RlKSwgc291cmNlRmlsZSkpO1xuICAgICAgfSk7XG5cbiAgICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==