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
        resolvedTemplates.forEach((template, filePath) => {
            const nodes = analyze_template_1.analyzeResolvedTemplate(filePath, template);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtDQUF3RDtJQUN4RCwyREFBNkY7SUFDN0YsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxnR0FBNkU7SUFDN0Usa0dBQTJFO0lBQzNFLDZGQUF3RTtJQUN4RSx1RkFBaUU7SUFFakUsbUhBQTJEO0lBSTNELE1BQU0sVUFBVSxHQUNaLHNIQUFzSCxDQUFDO0lBQzNILE1BQU0sZUFBZSxHQUFHLHdDQUF3QyxDQUFDO0lBRWpFLHFFQUFxRTtJQUNyRTtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLE1BQU0sb0JBQW9CLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsaUZBQWlGO29CQUNqRixjQUFjLENBQUMsQ0FBQzthQUNyQjtZQUVELEtBQUssTUFBTSxZQUFZLElBQUksb0JBQW9CLEVBQUU7Z0JBQy9DLGtDQUFrQyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNsRjtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFmRCw0QkFlQztJQUVEOzs7T0FHRztJQUNILFNBQVMsa0NBQWtDLENBQ3ZDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCLEVBQUUsTUFBYztRQUNwRSxNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FB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SUFBSSxDQUFDLGtEQUFrRCxDQUFDLENBQUM7U0FDakU7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmcsIG5vcm1hbGl6ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3BhcnNlX3RzY29uZmlnJztcbmltcG9ydCB7dmlzaXRBbGxOb2Rlc30gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC92aXNpdF9ub2Rlcyc7XG5cbmltcG9ydCB7YW5hbHl6ZVJlc29sdmVkVGVtcGxhdGV9IGZyb20gJy4vYW5hbHl6ZV90ZW1wbGF0ZSc7XG5cbnR5cGUgTG9nZ2VyID0gbG9nZ2luZy5Mb2dnZXJBcGk7XG5cbmNvbnN0IFJFQURNRV9VUkwgPVxuICAgICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3RyZWUvbWFzdGVyL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3RlbXBsYXRlLXZhci1hc3NpZ25tZW50L1JFQURNRS5tZCc7XG5jb25zdCBGQUlMVVJFX01FU1NBR0UgPSBgRm91bmQgYXNzaWdubWVudCB0byB0ZW1wbGF0ZSB2YXJpYWJsZS5gO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOCB0ZW1wbGF0ZSB2YXJpYWJsZSBhc3NpZ25tZW50IHNjaGVtYXRpYy4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCBwcm9qZWN0VHNDb25maWdQYXRocyA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcblxuICAgIGlmICghcHJvamVjdFRzQ29uZmlnUGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBjaGVjayB0ZW1wbGF0ZXMgZm9yIHRlbXBsYXRlIHZhcmlhYmxlICcgK1xuICAgICAgICAgICdhc3NpZ25tZW50cy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBwcm9qZWN0VHNDb25maWdQYXRocykge1xuICAgICAgcnVuVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRDaGVjayh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBjb250ZXh0LmxvZ2dlcik7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJ1bnMgdGhlIHRlbXBsYXRlIHZhcmlhYmxlIGFzc2lnbm1lbnQgY2hlY2suIFdhcm5zIGRldmVsb3BlcnNcbiAqIGlmIHZhbHVlcyBhcmUgYXNzaWduZWQgdG8gdGVtcGxhdGUgdmFyaWFibGVzIHdpdGhpbiBvdXRwdXQgYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIHJ1blRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50Q2hlY2soXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGxvZ2dlcjogTG9nZ2VyKSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IHRzLmNyZWF0ZUNvbXBpbGVySG9zdChwYXJzZWQub3B0aW9ucywgdHJ1ZSk7XG5cbiAgLy8gV2UgbmVlZCB0byBvdmVyd3JpdGUgdGhlIGhvc3QgXCJyZWFkRmlsZVwiIG1ldGhvZCwgYXMgd2Ugd2FudCB0aGUgVHlwZVNjcmlwdFxuICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS5cbiAgaG9zdC5yZWFkRmlsZSA9IGZpbGVOYW1lID0+IHtcbiAgICBjb25zdCBidWZmZXIgPSB0cmVlLnJlYWQocmVsYXRpdmUoYmFzZVBhdGgsIGZpbGVOYW1lKSk7XG4gICAgcmV0dXJuIGJ1ZmZlciA/IGJ1ZmZlci50b1N0cmluZygpIDogdW5kZWZpbmVkO1xuICB9O1xuXG4gIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHRlbXBsYXRlVmlzaXRvciA9IG5ldyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHJvb3RTb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0Um9vdEZpbGVOYW1lcygpLm1hcChmID0+IHByb2dyYW0uZ2V0U291cmNlRmlsZShmKSAhKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgSFRNTCB0ZW1wbGF0ZXMuXG4gIHJvb3RTb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gdmlzaXRBbGxOb2Rlcyhzb3VyY2VGaWxlLCBbdGVtcGxhdGVWaXNpdG9yXSkpO1xuXG4gIGNvbnN0IHtyZXNvbHZlZFRlbXBsYXRlc30gPSB0ZW1wbGF0ZVZpc2l0b3I7XG4gIGNvbnN0IGNvbGxlY3RlZEZhaWx1cmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIEFuYWx5emUgZWFjaCByZXNvbHZlZCB0ZW1wbGF0ZSBhbmQgcHJpbnQgYSB3YXJuaW5nIGZvciBwcm9wZXJ0eSB3cml0ZXMgdG9cbiAgLy8gdGVtcGxhdGUgdmFyaWFibGVzLlxuICByZXNvbHZlZFRlbXBsYXRlcy5mb3JFYWNoKCh0ZW1wbGF0ZSwgZmlsZVBhdGgpID0+IHtcbiAgICBjb25zdCBub2RlcyA9IGFuYWx5emVSZXNvbHZlZFRlbXBsYXRlKGZpbGVQYXRoLCB0ZW1wbGF0ZSk7XG5cbiAgICBpZiAoIW5vZGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGlzcGxheUZpbGVQYXRoID0gbm9ybWFsaXplKHJlbGF0aXZlKGJhc2VQYXRoLCBmaWxlUGF0aCkpO1xuXG4gICAgbm9kZXMuZm9yRWFjaChuID0+IHtcbiAgICAgIGNvbnN0IHtsaW5lLCBjaGFyYWN0ZXJ9ID0gdGVtcGxhdGUuZ2V0Q2hhcmFjdGVyQW5kTGluZU9mUG9zaXRpb24obi5zdGFydCk7XG4gICAgICBjb2xsZWN0ZWRGYWlsdXJlcy5wdXNoKGAke2Rpc3BsYXlGaWxlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfTogJHtGQUlMVVJFX01FU1NBR0V9YCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGlmIChjb2xsZWN0ZWRGYWlsdXJlcy5sZW5ndGgpIHtcbiAgICBsb2dnZXIuaW5mbygnLS0tLSBUZW1wbGF0ZSBWYXJpYWJsZSBBc3NpZ25tZW50IHNjaGVtYXRpYyAtLS0tJyk7XG4gICAgbG9nZ2VyLmluZm8oJ0Fzc2lnbm1lbnRzIHRvIHRlbXBsYXRlIHZhcmlhYmxlcyB3aWxsIG5vIGxvbmdlciB3b3JrIHdpdGggSXZ5IGFzJyk7XG4gICAgbG9nZ2VyLmluZm8oJ3RlbXBsYXRlIHZhcmlhYmxlcyBhcmUgZWZmZWN0aXZlbHkgY29uc3RhbnRzIGluIEl2eS4gUmVhZCBtb3JlIGFib3V0Jyk7XG4gICAgbG9nZ2VyLmluZm8oYHRoaXMgY2hhbmdlIGhlcmU6ICR7UkVBRE1FX1VSTH1gKTtcbiAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgbG9nZ2VyLmluZm8oJ1RoZSBmb2xsb3dpbmcgdGVtcGxhdGUgYXNzaWdubWVudHMgd2VyZSBmb3VuZDonKTtcbiAgICBjb2xsZWN0ZWRGYWlsdXJlcy5mb3JFYWNoKGZhaWx1cmUgPT4gbG9nZ2VyLndhcm4oYOKukSAgICR7ZmFpbHVyZX1gKSk7XG4gICAgbG9nZ2VyLmluZm8oJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICB9XG59XG4iXX0=