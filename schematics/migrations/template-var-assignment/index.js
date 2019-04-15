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
        define("@angular/core/schematics/migrations/template-var-assignment", ["require", "exports", "@angular-devkit/core", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/utils/typescript/visit_nodes", "@angular/core/schematics/migrations/template-var-assignment/analyze_template"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const ng_component_template_1 = require("@angular/core/schematics/utils/ng_component_template");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const visit_nodes_1 = require("@angular/core/schematics/utils/typescript/visit_nodes");
    const analyze_template_1 = require("@angular/core/schematics/migrations/template-var-assignment/analyze_template");
    const README_URL = 'https://github.com/angular/angular/tree/master/packages/core/schematics/migrations/template-var-assignment/README.md';
    const FAILURE_MESSAGE = `Found assignment to template variable.`;
    /** Entry point for the V8 template variable assignment schematic. */
    function default_1() {
        return (tree, context) => {
            const projectTsConfigPaths = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            if (!projectTsConfigPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot check templates for template variable ' +
                    'assignments.');
            }
            for (const tsconfigPath of projectTsConfigPaths) {
                runTemplateVariableAssignmentCheck(tree, tsconfigPath, basePath, context.logger);
            }
        };
    }
    exports.default = default_1;
    /**
     * Runs the template variable assignment check. Warns developers
     * if values are assigned to template variables within output bindings.
     */
    function runTemplateVariableAssignmentCheck(tree, tsconfigPath, basePath, logger) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = ts.createCompilerHost(parsed.options, true);
        // We need to overwrite the host "readFile" method, as we want the TypeScript
        // program to be based on the file contents in the virtual file tree.
        host.readFile = fileName => {
            const buffer = tree.read(path_1.relative(basePath, fileName));
            return buffer ? buffer.toString() : undefined;
        };
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
        const typeChecker = program.getTypeChecker();
        const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker);
        const rootSourceFiles = program.getRootFileNames().map(f => program.getSourceFile(f));
        // Analyze source files by detecting HTML templates.
        rootSourceFiles.forEach(sourceFile => visit_nodes_1.visitAllNodes(sourceFile, [templateVisitor]));
        const { resolvedTemplates } = templateVisitor;
        const collectedFailures = [];
        // Analyze each resolved template and print a warning for property writes to
        // template variables.
        resolvedTemplates.forEach(template => {
            const filePath = template.filePath;
            const nodes = analyze_template_1.analyzeResolvedTemplate(template);
            if (!nodes) {
                return;
            }
            const displayFilePath = core_1.normalize(path_1.relative(basePath, filePath));
            nodes.forEach(n => {
                const { line, character } = template.getCharacterAndLineOfPosition(n.start);
                collectedFailures.push(`${displayFilePath}@${line + 1}:${character + 1}: ${FAILURE_MESSAGE}`);
            });
        });
        if (collectedFailures.length) {
            logger.info('---- Template Variable Assignment schematic ----');
            logger.info('Assignments to template variables will no longer work with Ivy as');
            logger.info('template variables are effectively constants in Ivy. Read more about');
            logger.info(`this change here: ${README_URL}`);
            logger.info('');
            logger.info('The following template assignments were found:');
            collectedFailures.forEach(failure => logger.warn(`⮑   ${failure}`));
            logger.info('------------------------------------------------');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtDQUF3RDtJQUN4RCwyREFBNkY7SUFDN0YsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxnR0FBNkU7SUFDN0Usa0dBQTJFO0lBQzNFLDZGQUF3RTtJQUN4RSx1RkFBaUU7SUFFakUsbUhBQTJEO0lBSTNELE1BQU0sVUFBVSxHQUNaLHNIQUFzSCxDQUFDO0lBQzNILE1BQU0sZUFBZSxHQUFHLHdDQUF3QyxDQUFDO0lBRWpFLHFFQUFxRTtJQUNyRTtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLE1BQU0sb0JBQW9CLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsaUZBQWlGO29CQUNqRixjQUFjLENBQUMsQ0FBQzthQUNyQjtZQUVELEtBQUssTUFBTSxZQUFZLElBQUksb0JBQW9CLEVBQUU7Z0JBQy9DLGtDQUFrQyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNsRjtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFmRCw0QkFlQztJQUVEOzs7T0FHRztJQUNILFNBQVMsa0NBQWtDLENBQ3ZDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCLEVBQUUsTUFBYztRQUNwRSxNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FB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WUFDcEUsTUFBTSxDQUFDLElBQUksQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1NBQ2pFO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nLCBub3JtYWxpemV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtkaXJuYW1lLCByZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcn0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZyc7XG5pbXBvcnQge3Zpc2l0QWxsTm9kZXN9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvdmlzaXRfbm9kZXMnO1xuXG5pbXBvcnQge2FuYWx5emVSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuL2FuYWx5emVfdGVtcGxhdGUnO1xuXG50eXBlIExvZ2dlciA9IGxvZ2dpbmcuTG9nZ2VyQXBpO1xuXG5jb25zdCBSRUFETUVfVVJMID1cbiAgICAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci90cmVlL21hc3Rlci9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9SRUFETUUubWQnO1xuY29uc3QgRkFJTFVSRV9NRVNTQUdFID0gYEZvdW5kIGFzc2lnbm1lbnQgdG8gdGVtcGxhdGUgdmFyaWFibGUuYDtcblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjggdGVtcGxhdGUgdmFyaWFibGUgYXNzaWdubWVudCBzY2hlbWF0aWMuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3QgcHJvamVjdFRzQ29uZmlnUGF0aHMgPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG5cbiAgICBpZiAoIXByb2plY3RUc0NvbmZpZ1BhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgY2hlY2sgdGVtcGxhdGVzIGZvciB0ZW1wbGF0ZSB2YXJpYWJsZSAnICtcbiAgICAgICAgICAnYXNzaWdubWVudHMuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgcHJvamVjdFRzQ29uZmlnUGF0aHMpIHtcbiAgICAgIHJ1blRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50Q2hlY2sodHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgY29udGV4dC5sb2dnZXIpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSB0ZW1wbGF0ZSB2YXJpYWJsZSBhc3NpZ25tZW50IGNoZWNrLiBXYXJucyBkZXZlbG9wZXJzXG4gKiBpZiB2YWx1ZXMgYXJlIGFzc2lnbmVkIHRvIHRlbXBsYXRlIHZhcmlhYmxlcyB3aXRoaW4gb3V0cHV0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBydW5UZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudENoZWNrKFxuICAgIHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nLCBsb2dnZXI6IExvZ2dlcikge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gIC8vIFdlIG5lZWQgdG8gb3ZlcndyaXRlIHRoZSBob3N0IFwicmVhZEZpbGVcIiBtZXRob2QsIGFzIHdlIHdhbnQgdGhlIFR5cGVTY3JpcHRcbiAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuXG4gIGhvc3QucmVhZEZpbGUgPSBmaWxlTmFtZSA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gdHJlZS5yZWFkKHJlbGF0aXZlKGJhc2VQYXRoLCBmaWxlTmFtZSkpO1xuICAgIHJldHVybiBidWZmZXIgPyBidWZmZXIudG9TdHJpbmcoKSA6IHVuZGVmaW5lZDtcbiAgfTtcblxuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCB0ZW1wbGF0ZVZpc2l0b3IgPSBuZXcgTmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCByb290U291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFJvb3RGaWxlTmFtZXMoKS5tYXAoZiA9PiBwcm9ncmFtLmdldFNvdXJjZUZpbGUoZikgISk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIEhUTUwgdGVtcGxhdGVzLlxuICByb290U291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHZpc2l0QWxsTm9kZXMoc291cmNlRmlsZSwgW3RlbXBsYXRlVmlzaXRvcl0pKTtcblxuICBjb25zdCB7cmVzb2x2ZWRUZW1wbGF0ZXN9ID0gdGVtcGxhdGVWaXNpdG9yO1xuICBjb25zdCBjb2xsZWN0ZWRGYWlsdXJlczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBBbmFseXplIGVhY2ggcmVzb2x2ZWQgdGVtcGxhdGUgYW5kIHByaW50IGEgd2FybmluZyBmb3IgcHJvcGVydHkgd3JpdGVzIHRvXG4gIC8vIHRlbXBsYXRlIHZhcmlhYmxlcy5cbiAgcmVzb2x2ZWRUZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB7XG4gICAgY29uc3QgZmlsZVBhdGggPSB0ZW1wbGF0ZS5maWxlUGF0aDtcbiAgICBjb25zdCBub2RlcyA9IGFuYWx5emVSZXNvbHZlZFRlbXBsYXRlKHRlbXBsYXRlKTtcblxuICAgIGlmICghbm9kZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkaXNwbGF5RmlsZVBhdGggPSBub3JtYWxpemUocmVsYXRpdmUoYmFzZVBhdGgsIGZpbGVQYXRoKSk7XG5cbiAgICBub2Rlcy5mb3JFYWNoKG4gPT4ge1xuICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPSB0ZW1wbGF0ZS5nZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbihuLnN0YXJ0KTtcbiAgICAgIGNvbGxlY3RlZEZhaWx1cmVzLnB1c2goYCR7ZGlzcGxheUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke0ZBSUxVUkVfTUVTU0FHRX1gKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaWYgKGNvbGxlY3RlZEZhaWx1cmVzLmxlbmd0aCkge1xuICAgIGxvZ2dlci5pbmZvKCctLS0tIFRlbXBsYXRlIFZhcmlhYmxlIEFzc2lnbm1lbnQgc2NoZW1hdGljIC0tLS0nKTtcbiAgICBsb2dnZXIuaW5mbygnQXNzaWdubWVudHMgdG8gdGVtcGxhdGUgdmFyaWFibGVzIHdpbGwgbm8gbG9uZ2VyIHdvcmsgd2l0aCBJdnkgYXMnKTtcbiAgICBsb2dnZXIuaW5mbygndGVtcGxhdGUgdmFyaWFibGVzIGFyZSBlZmZlY3RpdmVseSBjb25zdGFudHMgaW4gSXZ5LiBSZWFkIG1vcmUgYWJvdXQnKTtcbiAgICBsb2dnZXIuaW5mbyhgdGhpcyBjaGFuZ2UgaGVyZTogJHtSRUFETUVfVVJMfWApO1xuICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICBsb2dnZXIuaW5mbygnVGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBhc3NpZ25tZW50cyB3ZXJlIGZvdW5kOicpO1xuICAgIGNvbGxlY3RlZEZhaWx1cmVzLmZvckVhY2goZmFpbHVyZSA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmYWlsdXJlfWApKTtcbiAgICBsb2dnZXIuaW5mbygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gIH1cbn1cbiJdfQ==