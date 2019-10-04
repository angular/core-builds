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
        define("@angular/core/schematics/migrations/template-var-assignment", ["require", "exports", "@angular-devkit/core", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/template-var-assignment/analyze_template"], factory);
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
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const analyze_template_1 = require("@angular/core/schematics/migrations/template-var-assignment/analyze_template");
    const README_URL = 'https://v8.angular.io/guide/deprecations#cannot-assign-to-template-variables';
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
        const host = compiler_host_1.createMigrationCompilerHost(tree, parsed.options, basePath);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILCtDQUF3RDtJQUN4RCwyREFBNkY7SUFDN0YsK0JBQXVDO0lBQ3ZDLGlDQUFpQztJQUVqQyxnR0FBNkU7SUFDN0Usa0dBQTJFO0lBQzNFLDJGQUFpRjtJQUNqRiw2RkFBd0U7SUFFeEUsbUhBQTJEO0lBSTNELE1BQU0sVUFBVSxHQUFHLDhFQUE4RSxDQUFDO0lBQ2xHLE1BQU0sZUFBZSxHQUFHLHdDQUF3QyxDQUFDO0lBRWpFLHFFQUFxRTtJQUNyRTtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixpRkFBaUY7b0JBQ2pGLGNBQWMsQ0FBQyxDQUFDO2FBQ3JCO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hELGtDQUFrQyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNsRjtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFmRCw0QkFlQztJQUVEOzs7T0FHRztJQUNILFNBQVMsa0NBQWtDLENBQ3ZDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCLEVBQUUsTUFBYztRQUNwRSxNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FBQyxZQUFZLEVBQUUsY0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsMkNBQTJCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDekUsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzdDLE1BQU0sZUFBZSxHQUFHLElBQUksa0RBQTBCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FDL0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTlFLG9EQUFvRDtRQUNwRCxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRXpFLE1BQU0sRUFBQyxpQkFBaUIsRUFBQyxHQUFHLGVBQWUsQ0FBQztRQUM1QyxNQUFNLGlCQUFpQixHQUFhLEVBQUUsQ0FBQztRQUV2Qyw0RUFBNEU7UUFDNUUsc0JBQXNCO1FBQ3RCLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNuQyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQ25DLE1BQU0sS0FBSyxHQUFHLDBDQUF1QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRWhELElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1YsT0FBTzthQUNSO1lBRUQsTUFBTSxlQUFlLEdBQUcsZ0JBQVMsQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFFaEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEIsTUFBTSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsR0FBRyxRQUFRLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMxRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxLQUFLLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFDaEcsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFO1lBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0RBQWtELENBQUMsQ0FBQztZQUNoRSxNQUFNLENBQUMsSUFBSSxDQUFDLG1FQUFtRSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLElBQUksQ0FBQyxzRUFBc0UsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLGdEQUFnRCxDQUFDLENBQUM7WUFDOUQsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxDQUFDLENBQUM7U0FDakU7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmcsIG5vcm1hbGl6ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2NyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcGFyc2VfdHNjb25maWcnO1xuXG5pbXBvcnQge2FuYWx5emVSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuL2FuYWx5emVfdGVtcGxhdGUnO1xuXG50eXBlIExvZ2dlciA9IGxvZ2dpbmcuTG9nZ2VyQXBpO1xuXG5jb25zdCBSRUFETUVfVVJMID0gJ2h0dHBzOi8vdjguYW5ndWxhci5pby9ndWlkZS9kZXByZWNhdGlvbnMjY2Fubm90LWFzc2lnbi10by10ZW1wbGF0ZS12YXJpYWJsZXMnO1xuY29uc3QgRkFJTFVSRV9NRVNTQUdFID0gYEZvdW5kIGFzc2lnbm1lbnQgdG8gdGVtcGxhdGUgdmFyaWFibGUuYDtcblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjggdGVtcGxhdGUgdmFyaWFibGUgYXNzaWdubWVudCBzY2hlbWF0aWMuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBjaGVjayB0ZW1wbGF0ZXMgZm9yIHRlbXBsYXRlIHZhcmlhYmxlICcgK1xuICAgICAgICAgICdhc3NpZ25tZW50cy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXSkge1xuICAgICAgcnVuVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRDaGVjayh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBjb250ZXh0LmxvZ2dlcik7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJ1bnMgdGhlIHRlbXBsYXRlIHZhcmlhYmxlIGFzc2lnbm1lbnQgY2hlY2suIFdhcm5zIGRldmVsb3BlcnNcbiAqIGlmIHZhbHVlcyBhcmUgYXNzaWduZWQgdG8gdGVtcGxhdGUgdmFyaWFibGVzIHdpdGhpbiBvdXRwdXQgYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIHJ1blRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50Q2hlY2soXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGxvZ2dlcjogTG9nZ2VyKSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IGNyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdCh0cmVlLCBwYXJzZWQub3B0aW9ucywgYmFzZVBhdGgpO1xuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCB0ZW1wbGF0ZVZpc2l0b3IgPSBuZXcgTmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBmID0+ICFmLmlzRGVjbGFyYXRpb25GaWxlICYmICFwcm9ncmFtLmlzU291cmNlRmlsZUZyb21FeHRlcm5hbExpYnJhcnkoZikpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBIVE1MIHRlbXBsYXRlcy5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHRlbXBsYXRlVmlzaXRvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtyZXNvbHZlZFRlbXBsYXRlc30gPSB0ZW1wbGF0ZVZpc2l0b3I7XG4gIGNvbnN0IGNvbGxlY3RlZEZhaWx1cmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIEFuYWx5emUgZWFjaCByZXNvbHZlZCB0ZW1wbGF0ZSBhbmQgcHJpbnQgYSB3YXJuaW5nIGZvciBwcm9wZXJ0eSB3cml0ZXMgdG9cbiAgLy8gdGVtcGxhdGUgdmFyaWFibGVzLlxuICByZXNvbHZlZFRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRlbXBsYXRlLmZpbGVQYXRoO1xuICAgIGNvbnN0IG5vZGVzID0gYW5hbHl6ZVJlc29sdmVkVGVtcGxhdGUodGVtcGxhdGUpO1xuXG4gICAgaWYgKCFub2Rlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpc3BsYXlGaWxlUGF0aCA9IG5vcm1hbGl6ZShyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZVBhdGgpKTtcblxuICAgIG5vZGVzLmZvckVhY2gobiA9PiB7XG4gICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9IHRlbXBsYXRlLmdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uKG4uc3RhcnQpO1xuICAgICAgY29sbGVjdGVkRmFpbHVyZXMucHVzaChgJHtkaXNwbGF5RmlsZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX06ICR7RkFJTFVSRV9NRVNTQUdFfWApO1xuICAgIH0pO1xuICB9KTtcblxuICBpZiAoY29sbGVjdGVkRmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgbG9nZ2VyLmluZm8oJy0tLS0gVGVtcGxhdGUgVmFyaWFibGUgQXNzaWdubWVudCBzY2hlbWF0aWMgLS0tLScpO1xuICAgIGxvZ2dlci5pbmZvKCdBc3NpZ25tZW50cyB0byB0ZW1wbGF0ZSB2YXJpYWJsZXMgd2lsbCBubyBsb25nZXIgd29yayB3aXRoIEl2eSBhcycpO1xuICAgIGxvZ2dlci5pbmZvKCd0ZW1wbGF0ZSB2YXJpYWJsZXMgYXJlIGVmZmVjdGl2ZWx5IGNvbnN0YW50cyBpbiBJdnkuIFJlYWQgbW9yZSBhYm91dCcpO1xuICAgIGxvZ2dlci5pbmZvKGB0aGlzIGNoYW5nZSBoZXJlOiAke1JFQURNRV9VUkx9YCk7XG4gICAgbG9nZ2VyLmluZm8oJycpO1xuICAgIGxvZ2dlci5pbmZvKCdUaGUgZm9sbG93aW5nIHRlbXBsYXRlIGFzc2lnbm1lbnRzIHdlcmUgZm91bmQ6Jyk7XG4gICAgY29sbGVjdGVkRmFpbHVyZXMuZm9yRWFjaChmYWlsdXJlID0+IGxvZ2dlci53YXJuKGDirpEgICAke2ZhaWx1cmV9YCkpO1xuICAgIGxvZ2dlci5pbmZvKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgfVxufVxuIl19