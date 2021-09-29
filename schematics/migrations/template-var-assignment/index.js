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
        define("@angular/core/schematics/migrations/template-var-assignment", ["require", "exports", "@angular-devkit/core", "@angular-devkit/schematics", "path", "@angular/core/schematics/utils/load_esm", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/template-var-assignment/analyze_template"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const load_esm_1 = require("@angular/core/schematics/utils/load_esm");
    const ng_component_template_1 = require("@angular/core/schematics/utils/ng_component_template");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const analyze_template_1 = require("@angular/core/schematics/migrations/template-var-assignment/analyze_template");
    const README_URL = 'https://v8.angular.io/guide/deprecations#cannot-assign-to-template-variables';
    const FAILURE_MESSAGE = `Found assignment to template variable.`;
    /** Entry point for the V8 template variable assignment schematic. */
    function default_1() {
        return (tree, context) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot check templates for template variable ' +
                    'assignments.');
            }
            let compilerModule;
            try {
                // Load ESM `@angular/compiler` using the TypeScript dynamic import workaround.
                // Once TypeScript provides support for keeping the dynamic import this workaround can be
                // changed to a direct dynamic import.
                compilerModule = yield (0, load_esm_1.loadEsmModule)('@angular/compiler');
            }
            catch (e) {
                throw new schematics_1.SchematicsException(`Unable to load the '@angular/compiler' package. Details: ${e.message}`);
            }
            for (const tsconfigPath of [...buildPaths, ...testPaths]) {
                runTemplateVariableAssignmentCheck(tree, tsconfigPath, basePath, context.logger, compilerModule);
            }
        });
    }
    exports.default = default_1;
    /**
     * Runs the template variable assignment check. Warns developers
     * if values are assigned to template variables within output bindings.
     */
    function runTemplateVariableAssignmentCheck(tree, tsconfigPath, basePath, logger, compilerModule) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        // Analyze source files by detecting HTML templates.
        sourceFiles.forEach(sourceFile => templateVisitor.visitNode(sourceFile));
        const { resolvedTemplates } = templateVisitor;
        const collectedFailures = [];
        // Analyze each resolved template and print a warning for property writes to
        // template variables.
        resolvedTemplates.forEach(template => {
            const filePath = template.filePath;
            const nodes = (0, analyze_template_1.analyzeResolvedTemplate)(template, compilerModule);
            if (!nodes) {
                return;
            }
            const displayFilePath = (0, core_1.normalize)((0, path_1.relative)(basePath, filePath));
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
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUVILCtDQUF3RDtJQUN4RCwyREFBNkY7SUFDN0YsK0JBQThCO0lBRTlCLHNFQUFtRDtJQUNuRCxnR0FBNkU7SUFDN0Usa0dBQTJFO0lBQzNFLDJGQUE0RjtJQUU1RixtSEFBMkQ7SUFJM0QsTUFBTSxVQUFVLEdBQUcsOEVBQThFLENBQUM7SUFDbEcsTUFBTSxlQUFlLEdBQUcsd0NBQXdDLENBQUM7SUFFakUscUVBQXFFO0lBQ3JFO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDckQsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxNQUFNLElBQUEsZ0RBQXVCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixpRkFBaUY7b0JBQ2pGLGNBQWMsQ0FBQyxDQUFDO2FBQ3JCO1lBRUQsSUFBSSxjQUFjLENBQUM7WUFDbkIsSUFBSTtnQkFDRiwrRUFBK0U7Z0JBQy9FLHlGQUF5RjtnQkFDekYsc0NBQXNDO2dCQUN0QyxjQUFjLEdBQUcsTUFBTSxJQUFBLHdCQUFhLEVBQXFDLG1CQUFtQixDQUFDLENBQUM7YUFDL0Y7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDVixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLDREQUE0RCxDQUFDLENBQUMsT0FBTyxFQUFF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QGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmcsIG5vcm1hbGl6ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcblxuaW1wb3J0IHtsb2FkRXNtTW9kdWxlfSBmcm9tICcuLi8uLi91dGlscy9sb2FkX2VzbSc7XG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2Nhbk1pZ3JhdGVGaWxlLCBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuXG5pbXBvcnQge2FuYWx5emVSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuL2FuYWx5emVfdGVtcGxhdGUnO1xuXG50eXBlIExvZ2dlciA9IGxvZ2dpbmcuTG9nZ2VyQXBpO1xuXG5jb25zdCBSRUFETUVfVVJMID0gJ2h0dHBzOi8vdjguYW5ndWxhci5pby9ndWlkZS9kZXByZWNhdGlvbnMjY2Fubm90LWFzc2lnbi10by10ZW1wbGF0ZS12YXJpYWJsZXMnO1xuY29uc3QgRkFJTFVSRV9NRVNTQUdFID0gYEZvdW5kIGFzc2lnbm1lbnQgdG8gdGVtcGxhdGUgdmFyaWFibGUuYDtcblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjggdGVtcGxhdGUgdmFyaWFibGUgYXNzaWdubWVudCBzY2hlbWF0aWMuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBhd2FpdCBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBjaGVjayB0ZW1wbGF0ZXMgZm9yIHRlbXBsYXRlIHZhcmlhYmxlICcgK1xuICAgICAgICAgICdhc3NpZ25tZW50cy4nKTtcbiAgICB9XG5cbiAgICBsZXQgY29tcGlsZXJNb2R1bGU7XG4gICAgdHJ5IHtcbiAgICAgIC8vIExvYWQgRVNNIGBAYW5ndWxhci9jb21waWxlcmAgdXNpbmcgdGhlIFR5cGVTY3JpcHQgZHluYW1pYyBpbXBvcnQgd29ya2Fyb3VuZC5cbiAgICAgIC8vIE9uY2UgVHlwZVNjcmlwdCBwcm92aWRlcyBzdXBwb3J0IGZvciBrZWVwaW5nIHRoZSBkeW5hbWljIGltcG9ydCB0aGlzIHdvcmthcm91bmQgY2FuIGJlXG4gICAgICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICAgICAgY29tcGlsZXJNb2R1bGUgPSBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJyk+KCdAYW5ndWxhci9jb21waWxlcicpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgIGBVbmFibGUgdG8gbG9hZCB0aGUgJ0Bhbmd1bGFyL2NvbXBpbGVyJyBwYWNrYWdlLiBEZXRhaWxzOiAke2UubWVzc2FnZX1gKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXSkge1xuICAgICAgcnVuVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRDaGVjayhcbiAgICAgICAgICB0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBjb250ZXh0LmxvZ2dlciwgY29tcGlsZXJNb2R1bGUpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSB0ZW1wbGF0ZSB2YXJpYWJsZSBhc3NpZ25tZW50IGNoZWNrLiBXYXJucyBkZXZlbG9wZXJzXG4gKiBpZiB2YWx1ZXMgYXJlIGFzc2lnbmVkIHRvIHRlbXBsYXRlIHZhcmlhYmxlcyB3aXRoaW4gb3V0cHV0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBydW5UZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudENoZWNrKFxuICAgIHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nLCBsb2dnZXI6IExvZ2dlcixcbiAgICBjb21waWxlck1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKSkge1xuICBjb25zdCB7cHJvZ3JhbX0gPSBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgdGVtcGxhdGVWaXNpdG9yID0gbmV3IE5nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIEhUTUwgdGVtcGxhdGVzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gdGVtcGxhdGVWaXNpdG9yLnZpc2l0Tm9kZShzb3VyY2VGaWxlKSk7XG5cbiAgY29uc3Qge3Jlc29sdmVkVGVtcGxhdGVzfSA9IHRlbXBsYXRlVmlzaXRvcjtcbiAgY29uc3QgY29sbGVjdGVkRmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gQW5hbHl6ZSBlYWNoIHJlc29sdmVkIHRlbXBsYXRlIGFuZCBwcmludCBhIHdhcm5pbmcgZm9yIHByb3BlcnR5IHdyaXRlcyB0b1xuICAvLyB0ZW1wbGF0ZSB2YXJpYWJsZXMuXG4gIHJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gdGVtcGxhdGUuZmlsZVBhdGg7XG4gICAgY29uc3Qgbm9kZXMgPSBhbmFseXplUmVzb2x2ZWRUZW1wbGF0ZSh0ZW1wbGF0ZSwgY29tcGlsZXJNb2R1bGUpO1xuXG4gICAgaWYgKCFub2Rlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpc3BsYXlGaWxlUGF0aCA9IG5vcm1hbGl6ZShyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZVBhdGgpKTtcblxuICAgIG5vZGVzLmZvckVhY2gobiA9PiB7XG4gICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9IHRlbXBsYXRlLmdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uKG4uc3RhcnQpO1xuICAgICAgY29sbGVjdGVkRmFpbHVyZXMucHVzaChgJHtkaXNwbGF5RmlsZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX06ICR7RkFJTFVSRV9NRVNTQUdFfWApO1xuICAgIH0pO1xuICB9KTtcblxuICBpZiAoY29sbGVjdGVkRmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgbG9nZ2VyLmluZm8oJy0tLS0gVGVtcGxhdGUgVmFyaWFibGUgQXNzaWdubWVudCBzY2hlbWF0aWMgLS0tLScpO1xuICAgIGxvZ2dlci5pbmZvKCdBc3NpZ25tZW50cyB0byB0ZW1wbGF0ZSB2YXJpYWJsZXMgd2lsbCBubyBsb25nZXIgd29yayB3aXRoIEl2eSBhcycpO1xuICAgIGxvZ2dlci5pbmZvKCd0ZW1wbGF0ZSB2YXJpYWJsZXMgYXJlIGVmZmVjdGl2ZWx5IGNvbnN0YW50cyBpbiBJdnkuIFJlYWQgbW9yZSBhYm91dCcpO1xuICAgIGxvZ2dlci5pbmZvKGB0aGlzIGNoYW5nZSBoZXJlOiAke1JFQURNRV9VUkx9YCk7XG4gICAgbG9nZ2VyLmluZm8oJycpO1xuICAgIGxvZ2dlci5pbmZvKCdUaGUgZm9sbG93aW5nIHRlbXBsYXRlIGFzc2lnbm1lbnRzIHdlcmUgZm91bmQ6Jyk7XG4gICAgY29sbGVjdGVkRmFpbHVyZXMuZm9yRWFjaChmYWlsdXJlID0+IGxvZ2dlci53YXJuKGDirpEgICAke2ZhaWx1cmV9YCkpO1xuICB9XG59XG4iXX0=