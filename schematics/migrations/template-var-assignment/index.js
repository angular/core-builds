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
        define("@angular/core/schematics/migrations/template-var-assignment", ["require", "exports", "@angular-devkit/core", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/template-var-assignment/analyze_template"], factory);
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
    const analyze_template_1 = require("@angular/core/schematics/migrations/template-var-assignment/analyze_template");
    const README_URL = 'https://github.com/angular/angular/tree/master/packages/core/schematics/migrations/template-var-assignment/README.md';
    const FAILURE_MESSAGE = `Found assignment to template variable.`;
    /** Entry point for the V8 template variable assignment schematic. */
    function default_1() {
        return (tree, context) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot check templates for template variable ' +
                    'assignments.');
            }
            for (const tsconfigPath of [...buildPaths, ...testPaths]) {
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
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        // Analyze source files by detecting HTML templates.
        sourceFiles.forEach(sourceFile => templateVisitor.visitNode(sourceFile));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtDQUF3RDtJQUN4RCwyREFBNkY7SUFDN0YsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxnR0FBNkU7SUFDN0Usa0dBQTJFO0lBQzNFLDZGQUF3RTtJQUV4RSxtSEFBMkQ7SUFJM0QsTUFBTSxVQUFVLEdBQ1osc0hBQXNILENBQUM7SUFDM0gsTUFBTSxlQUFlLEdBQUcsd0NBQXdDLENBQUM7SUFFakUscUVBQXFFO0lBQ3JFO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDL0MsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxNQUFNLElBQUksZ0NBQW1CLENBQ3pCLGlGQUFpRjtvQkFDakYsY0FBYyxDQUFDLENBQUM7YUFDckI7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRTtnQkFDeEQsa0NBQWtDLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ2xGO1FBQ0gsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQWZELDRCQWVDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUyxrQ0FBa0MsQ0FDdkMsSUFBVSxFQUFFLFlB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QU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLElBQUksQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1NBQ2pFO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nLCBub3JtYWxpemV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtkaXJuYW1lLCByZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcn0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZyc7XG5cbmltcG9ydCB7YW5hbHl6ZVJlc29sdmVkVGVtcGxhdGV9IGZyb20gJy4vYW5hbHl6ZV90ZW1wbGF0ZSc7XG5cbnR5cGUgTG9nZ2VyID0gbG9nZ2luZy5Mb2dnZXJBcGk7XG5cbmNvbnN0IFJFQURNRV9VUkwgPVxuICAgICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3RyZWUvbWFzdGVyL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3RlbXBsYXRlLXZhci1hc3NpZ25tZW50L1JFQURNRS5tZCc7XG5jb25zdCBGQUlMVVJFX01FU1NBR0UgPSBgRm91bmQgYXNzaWdubWVudCB0byB0ZW1wbGF0ZSB2YXJpYWJsZS5gO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOCB0ZW1wbGF0ZSB2YXJpYWJsZSBhc3NpZ25tZW50IHNjaGVtYXRpYy4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcblxuICAgIGlmICghYnVpbGRQYXRocy5sZW5ndGggJiYgIXRlc3RQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IGNoZWNrIHRlbXBsYXRlcyBmb3IgdGVtcGxhdGUgdmFyaWFibGUgJyArXG4gICAgICAgICAgJ2Fzc2lnbm1lbnRzLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdKSB7XG4gICAgICBydW5UZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudENoZWNrKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGNvbnRleHQubG9nZ2VyKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUnVucyB0aGUgdGVtcGxhdGUgdmFyaWFibGUgYXNzaWdubWVudCBjaGVjay4gV2FybnMgZGV2ZWxvcGVyc1xuICogaWYgdmFsdWVzIGFyZSBhc3NpZ25lZCB0byB0ZW1wbGF0ZSB2YXJpYWJsZXMgd2l0aGluIG91dHB1dCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gcnVuVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRDaGVjayhcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZywgbG9nZ2VyOiBMb2dnZXIpIHtcbiAgY29uc3QgcGFyc2VkID0gcGFyc2VUc2NvbmZpZ0ZpbGUodHNjb25maWdQYXRoLCBkaXJuYW1lKHRzY29uZmlnUGF0aCkpO1xuICBjb25zdCBob3N0ID0gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KHBhcnNlZC5vcHRpb25zLCB0cnVlKTtcblxuICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gIC8vIHByb2dyYW0gdG8gYmUgYmFzZWQgb24gdGhlIGZpbGUgY29udGVudHMgaW4gdGhlIHZpcnR1YWwgZmlsZSB0cmVlLlxuICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICByZXR1cm4gYnVmZmVyID8gYnVmZmVyLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgdGVtcGxhdGVWaXNpdG9yID0gbmV3IE5nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKFxuICAgICAgZiA9PiAhZi5pc0RlY2xhcmF0aW9uRmlsZSAmJiAhcHJvZ3JhbS5pc1NvdXJjZUZpbGVGcm9tRXh0ZXJuYWxMaWJyYXJ5KGYpKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgSFRNTCB0ZW1wbGF0ZXMuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB0ZW1wbGF0ZVZpc2l0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7cmVzb2x2ZWRUZW1wbGF0ZXN9ID0gdGVtcGxhdGVWaXNpdG9yO1xuICBjb25zdCBjb2xsZWN0ZWRGYWlsdXJlczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBBbmFseXplIGVhY2ggcmVzb2x2ZWQgdGVtcGxhdGUgYW5kIHByaW50IGEgd2FybmluZyBmb3IgcHJvcGVydHkgd3JpdGVzIHRvXG4gIC8vIHRlbXBsYXRlIHZhcmlhYmxlcy5cbiAgcmVzb2x2ZWRUZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB7XG4gICAgY29uc3QgZmlsZVBhdGggPSB0ZW1wbGF0ZS5maWxlUGF0aDtcbiAgICBjb25zdCBub2RlcyA9IGFuYWx5emVSZXNvbHZlZFRlbXBsYXRlKHRlbXBsYXRlKTtcblxuICAgIGlmICghbm9kZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkaXNwbGF5RmlsZVBhdGggPSBub3JtYWxpemUocmVsYXRpdmUoYmFzZVBhdGgsIGZpbGVQYXRoKSk7XG5cbiAgICBub2Rlcy5mb3JFYWNoKG4gPT4ge1xuICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPSB0ZW1wbGF0ZS5nZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbihuLnN0YXJ0KTtcbiAgICAgIGNvbGxlY3RlZEZhaWx1cmVzLnB1c2goYCR7ZGlzcGxheUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke0ZBSUxVUkVfTUVTU0FHRX1gKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaWYgKGNvbGxlY3RlZEZhaWx1cmVzLmxlbmd0aCkge1xuICAgIGxvZ2dlci5pbmZvKCctLS0tIFRlbXBsYXRlIFZhcmlhYmxlIEFzc2lnbm1lbnQgc2NoZW1hdGljIC0tLS0nKTtcbiAgICBsb2dnZXIuaW5mbygnQXNzaWdubWVudHMgdG8gdGVtcGxhdGUgdmFyaWFibGVzIHdpbGwgbm8gbG9uZ2VyIHdvcmsgd2l0aCBJdnkgYXMnKTtcbiAgICBsb2dnZXIuaW5mbygndGVtcGxhdGUgdmFyaWFibGVzIGFyZSBlZmZlY3RpdmVseSBjb25zdGFudHMgaW4gSXZ5LiBSZWFkIG1vcmUgYWJvdXQnKTtcbiAgICBsb2dnZXIuaW5mbyhgdGhpcyBjaGFuZ2UgaGVyZTogJHtSRUFETUVfVVJMfWApO1xuICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICBsb2dnZXIuaW5mbygnVGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBhc3NpZ25tZW50cyB3ZXJlIGZvdW5kOicpO1xuICAgIGNvbGxlY3RlZEZhaWx1cmVzLmZvckVhY2goZmFpbHVyZSA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmYWlsdXJlfWApKTtcbiAgICBsb2dnZXIuaW5mbygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gIH1cbn1cbiJdfQ==