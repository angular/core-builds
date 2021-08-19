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
        define("@angular/core/schematics/migrations/router-link-empty-expression", ["require", "exports", "@angular-devkit/core", "@angular-devkit/schematics", "path", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/router-link-empty-expression/analyze_template"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular-devkit/core");
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ng_component_template_1 = require("@angular/core/schematics/utils/ng_component_template");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const analyze_template_1 = require("@angular/core/schematics/migrations/router-link-empty-expression/analyze_template");
    const README_URL = 'https://github.com/angular/angular/blob/master/packages/core/schematics/migrations/router-link-empty-expression/README.md';
    /** Entry point for the RouterLink empty expression migration. */
    function default_1() {
        return (tree, context) => {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot check templates for empty routerLinks.');
            }
            for (const tsconfigPath of [...buildPaths, ...testPaths]) {
                runEmptyRouterLinkExpressionMigration(tree, tsconfigPath, basePath, context.logger);
            }
        };
    }
    exports.default = default_1;
    /**
     * Runs the routerLink migration, changing routerLink="" to routerLink="[]" and notifying developers
     * which templates received updates.
     */
    function runEmptyRouterLinkExpressionMigration(tree, tsconfigPath, basePath, logger) {
        const { program } = compiler_host_1.createMigrationProgram(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => compiler_host_1.canMigrateFile(basePath, sourceFile, program));
        // Analyze source files by detecting HTML templates.
        sourceFiles.forEach(sourceFile => templateVisitor.visitNode(sourceFile));
        const { resolvedTemplates } = templateVisitor;
        fixEmptyRouterlinks(resolvedTemplates, tree, logger);
    }
    function fixEmptyRouterlinks(resolvedTemplates, tree, logger) {
        var _a;
        const basePath = process.cwd();
        const collectedFixes = [];
        const fixesByFile = getFixesByFile(resolvedTemplates);
        for (const [absFilePath, fixes] of fixesByFile) {
            const treeFilePath = path_1.relative(core_1.normalize(basePath), core_1.normalize(absFilePath));
            const originalFileContent = (_a = tree.read(treeFilePath)) === null || _a === void 0 ? void 0 : _a.toString();
            if (originalFileContent === undefined) {
                logger.error(`Failed to read file containing template; cannot apply fixes for empty routerLink expressions in ${treeFilePath}.`);
                continue;
            }
            const updater = tree.beginUpdate(treeFilePath);
            for (const fix of fixes) {
                const displayFilePath = core_1.normalize(path_1.relative(basePath, fix.originalTemplate.filePath));
                updater.remove(fix.originalTemplate.start, fix.originalTemplate.content.length);
                updater.insertLeft(fix.originalTemplate.start, fix.newContent);
                for (const n of fix.emptyRouterlinkExpressions) {
                    const { line, character } = fix.originalTemplate.getCharacterAndLineOfPosition(n.sourceSpan.start.offset);
                    collectedFixes.push(`${displayFilePath}@${line + 1}:${character + 1}`);
                }
                tree.commitUpdate(updater);
            }
        }
        if (collectedFixes.length > 0) {
            logger.info('---- RouterLink empty assignment schematic ----');
            logger.info('The behavior of empty/`undefined` inputs for `routerLink` has changed');
            logger.info('from linking to the current page to instead completely disable the link.');
            logger.info(`Read more about this change here: ${README_URL}`);
            logger.info('');
            logger.info('The following empty `routerLink` inputs were found and fixed:');
            collectedFixes.forEach(fix => logger.warn(`⮑   ${fix}`));
        }
    }
    /**
     * Returns fixes for nodes in templates which contain empty routerLink assignments, grouped by file.
     */
    function getFixesByFile(templates) {
        const fixesByFile = new Map();
        for (const template of templates) {
            const templateFix = fixEmptyRouterlinksInTemplate(template);
            if (templateFix === null) {
                continue;
            }
            const file = template.filePath;
            if (fixesByFile.has(file)) {
                if (template.inline) {
                    // External templates may be referenced multiple times in the project
                    // (e.g. if shared between components), but we only want to record them
                    // once. On the other hand, an inline template resides in a TS file that
                    // may contain multiple inline templates.
                    fixesByFile.get(file).push(templateFix);
                }
            }
            else {
                fixesByFile.set(file, [templateFix]);
            }
        }
        return fixesByFile;
    }
    function fixEmptyRouterlinksInTemplate(template) {
        const emptyRouterlinkExpressions = analyze_template_1.analyzeResolvedTemplate(template);
        if (!emptyRouterlinkExpressions) {
            return null;
        }
        // Sort backwards so string replacements do not conflict
        emptyRouterlinkExpressions.sort((a, b) => b.value.sourceSpan.start - a.value.sourceSpan.start);
        let newContent = template.content;
        for (const expr of emptyRouterlinkExpressions) {
            if (expr.valueSpan) {
                newContent = newContent.substr(0, expr.value.sourceSpan.start) + '[]' +
                    newContent.substr(expr.value.sourceSpan.start);
            }
            else {
                newContent = newContent.substr(0, expr.sourceSpan.end.offset) + '="[]"' +
                    newContent.substr(expr.sourceSpan.end.offset);
            }
        }
        return { originalTemplate: template, newContent, emptyRouterlinkExpressions };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9yb3V0ZXItbGluay1lbXB0eS1leHByZXNzaW9uL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQXdEO0lBQ3hELDJEQUE2RjtJQUU3RiwrQkFBOEI7SUFFOUIsZ0dBQStGO0lBQy9GLGtHQUEyRTtJQUMzRSwyRkFBNEY7SUFFNUYsd0hBQTJEO0lBSTNELE1BQU0sVUFBVSxHQUNaLDJIQUEySCxDQUFDO0lBUWhJLGlFQUFpRTtJQUNqRTtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixpRkFBaUYsQ0FBQyxDQUFDO2FBQ3hGO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hELHFDQUFxQyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNyRjtRQUNILENBQUMsQ0FBQztJQUNKLENBQUM7SUFkRCw0QkFjQztJQUVEOzs7T0FHRztJQUNILFNBQVMscUNBQXFDLENBQzFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCLEVBQUUsTUFBYztRQUNwRSxNQUFNLEVBQUMsT0FBTyxFQUFDLEdB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QjtRQUMvRCxNQUFNLDBCQUEwQixHQUFHLDBDQUF1QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXJFLElBQUksQ0FBQywwQkFBMEIsRUFBRTtZQUMvQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsd0RBQXdEO1FBQ3hELDBCQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvRixJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDO1FBQ2xDLEtBQUssTUFBTSxJQUFJLElBQUksMEJBQTBCLEVBQUU7WUFDN0MsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNsQixVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSTtvQkFDakUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNwRDtpQkFBTTtnQkFDTCxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsT0FBTztvQkFDbkUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNuRDtTQUNGO1FBRUQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsMEJBQTBCLEVBQUMsQ0FBQztJQUM5RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9nZ2luZywgbm9ybWFsaXplfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7RW1wdHlFeHByLCBUbXBsQXN0Qm91bmRBdHRyaWJ1dGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7cmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yLCBSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2Nhbk1pZ3JhdGVGaWxlLCBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuXG5pbXBvcnQge2FuYWx5emVSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuL2FuYWx5emVfdGVtcGxhdGUnO1xuXG50eXBlIExvZ2dlciA9IGxvZ2dpbmcuTG9nZ2VyQXBpO1xuXG5jb25zdCBSRUFETUVfVVJMID1cbiAgICAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iL21hc3Rlci9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9yb3V0ZXItbGluay1lbXB0eS1leHByZXNzaW9uL1JFQURNRS5tZCc7XG5cbmludGVyZmFjZSBGaXhlZFRlbXBsYXRlIHtcbiAgb3JpZ2luYWxUZW1wbGF0ZTogUmVzb2x2ZWRUZW1wbGF0ZTtcbiAgbmV3Q29udGVudDogc3RyaW5nO1xuICBlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9uczogVG1wbEFzdEJvdW5kQXR0cmlidXRlW107XG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFJvdXRlckxpbmsgZW1wdHkgZXhwcmVzc2lvbiBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBjaGVjayB0ZW1wbGF0ZXMgZm9yIGVtcHR5IHJvdXRlckxpbmtzLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdKSB7XG4gICAgICBydW5FbXB0eVJvdXRlckxpbmtFeHByZXNzaW9uTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGNvbnRleHQubG9nZ2VyKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUnVucyB0aGUgcm91dGVyTGluayBtaWdyYXRpb24sIGNoYW5naW5nIHJvdXRlckxpbms9XCJcIiB0byByb3V0ZXJMaW5rPVwiW11cIiBhbmQgbm90aWZ5aW5nIGRldmVsb3BlcnNcbiAqIHdoaWNoIHRlbXBsYXRlcyByZWNlaXZlZCB1cGRhdGVzLlxuICovXG5mdW5jdGlvbiBydW5FbXB0eVJvdXRlckxpbmtFeHByZXNzaW9uTWlncmF0aW9uKFxuICAgIHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nLCBsb2dnZXI6IExvZ2dlcikge1xuICBjb25zdCB7cHJvZ3JhbX0gPSBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgdGVtcGxhdGVWaXNpdG9yID0gbmV3IE5nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIEhUTUwgdGVtcGxhdGVzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gdGVtcGxhdGVWaXNpdG9yLnZpc2l0Tm9kZShzb3VyY2VGaWxlKSk7XG5cbiAgY29uc3Qge3Jlc29sdmVkVGVtcGxhdGVzfSA9IHRlbXBsYXRlVmlzaXRvcjtcbiAgZml4RW1wdHlSb3V0ZXJsaW5rcyhyZXNvbHZlZFRlbXBsYXRlcywgdHJlZSwgbG9nZ2VyKTtcbn1cblxuZnVuY3Rpb24gZml4RW1wdHlSb3V0ZXJsaW5rcyhyZXNvbHZlZFRlbXBsYXRlczogUmVzb2x2ZWRUZW1wbGF0ZVtdLCB0cmVlOiBUcmVlLCBsb2dnZXI6IExvZ2dlcikge1xuICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IGNvbGxlY3RlZEZpeGVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBmaXhlc0J5RmlsZSA9IGdldEZpeGVzQnlGaWxlKHJlc29sdmVkVGVtcGxhdGVzKTtcblxuICBmb3IgKGNvbnN0IFthYnNGaWxlUGF0aCwgZml4ZXNdIG9mIGZpeGVzQnlGaWxlKSB7XG4gICAgY29uc3QgdHJlZUZpbGVQYXRoID0gcmVsYXRpdmUobm9ybWFsaXplKGJhc2VQYXRoKSwgbm9ybWFsaXplKGFic0ZpbGVQYXRoKSk7XG4gICAgY29uc3Qgb3JpZ2luYWxGaWxlQ29udGVudCA9IHRyZWUucmVhZCh0cmVlRmlsZVBhdGgpPy50b1N0cmluZygpO1xuICAgIGlmIChvcmlnaW5hbEZpbGVDb250ZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgRmFpbGVkIHRvIHJlYWQgZmlsZSBjb250YWluaW5nIHRlbXBsYXRlOyBjYW5ub3QgYXBwbHkgZml4ZXMgZm9yIGVtcHR5IHJvdXRlckxpbmsgZXhwcmVzc2lvbnMgaW4gJHtcbiAgICAgICAgICAgICAgdHJlZUZpbGVQYXRofS5gKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHRyZWVGaWxlUGF0aCk7XG4gICAgZm9yIChjb25zdCBmaXggb2YgZml4ZXMpIHtcbiAgICAgIGNvbnN0IGRpc3BsYXlGaWxlUGF0aCA9IG5vcm1hbGl6ZShyZWxhdGl2ZShiYXNlUGF0aCwgZml4Lm9yaWdpbmFsVGVtcGxhdGUuZmlsZVBhdGgpKTtcbiAgICAgIHVwZGF0ZXIucmVtb3ZlKGZpeC5vcmlnaW5hbFRlbXBsYXRlLnN0YXJ0LCBmaXgub3JpZ2luYWxUZW1wbGF0ZS5jb250ZW50Lmxlbmd0aCk7XG4gICAgICB1cGRhdGVyLmluc2VydExlZnQoZml4Lm9yaWdpbmFsVGVtcGxhdGUuc3RhcnQsIGZpeC5uZXdDb250ZW50KTtcblxuICAgICAgZm9yIChjb25zdCBuIG9mIGZpeC5lbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9ucykge1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICBmaXgub3JpZ2luYWxUZW1wbGF0ZS5nZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbihuLnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0KTtcbiAgICAgICAgY29sbGVjdGVkRml4ZXMucHVzaChgJHtkaXNwbGF5RmlsZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX1gKTtcbiAgICAgIH1cbiAgICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZXIpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb2xsZWN0ZWRGaXhlcy5sZW5ndGggPiAwKSB7XG4gICAgbG9nZ2VyLmluZm8oJy0tLS0gUm91dGVyTGluayBlbXB0eSBhc3NpZ25tZW50IHNjaGVtYXRpYyAtLS0tJyk7XG4gICAgbG9nZ2VyLmluZm8oJ1RoZSBiZWhhdmlvciBvZiBlbXB0eS9gdW5kZWZpbmVkYCBpbnB1dHMgZm9yIGByb3V0ZXJMaW5rYCBoYXMgY2hhbmdlZCcpO1xuICAgIGxvZ2dlci5pbmZvKCdmcm9tIGxpbmtpbmcgdG8gdGhlIGN1cnJlbnQgcGFnZSB0byBpbnN0ZWFkIGNvbXBsZXRlbHkgZGlzYWJsZSB0aGUgbGluay4nKTtcbiAgICBsb2dnZXIuaW5mbyhgUmVhZCBtb3JlIGFib3V0IHRoaXMgY2hhbmdlIGhlcmU6ICR7UkVBRE1FX1VSTH1gKTtcbiAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgbG9nZ2VyLmluZm8oJ1RoZSBmb2xsb3dpbmcgZW1wdHkgYHJvdXRlckxpbmtgIGlucHV0cyB3ZXJlIGZvdW5kIGFuZCBmaXhlZDonKTtcbiAgICBjb2xsZWN0ZWRGaXhlcy5mb3JFYWNoKGZpeCA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmaXh9YCkpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBmaXhlcyBmb3Igbm9kZXMgaW4gdGVtcGxhdGVzIHdoaWNoIGNvbnRhaW4gZW1wdHkgcm91dGVyTGluayBhc3NpZ25tZW50cywgZ3JvdXBlZCBieSBmaWxlLlxuICovXG5mdW5jdGlvbiBnZXRGaXhlc0J5RmlsZSh0ZW1wbGF0ZXM6IFJlc29sdmVkVGVtcGxhdGVbXSk6IE1hcDxzdHJpbmcsIEZpeGVkVGVtcGxhdGVbXT4ge1xuICBjb25zdCBmaXhlc0J5RmlsZSA9IG5ldyBNYXA8c3RyaW5nLCBGaXhlZFRlbXBsYXRlW10+KCk7XG4gIGZvciAoY29uc3QgdGVtcGxhdGUgb2YgdGVtcGxhdGVzKSB7XG4gICAgY29uc3QgdGVtcGxhdGVGaXggPSBmaXhFbXB0eVJvdXRlcmxpbmtzSW5UZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgaWYgKHRlbXBsYXRlRml4ID09PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gdGVtcGxhdGUuZmlsZVBhdGg7XG4gICAgaWYgKGZpeGVzQnlGaWxlLmhhcyhmaWxlKSkge1xuICAgICAgaWYgKHRlbXBsYXRlLmlubGluZSkge1xuICAgICAgICAvLyBFeHRlcm5hbCB0ZW1wbGF0ZXMgbWF5IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMgaW4gdGhlIHByb2plY3RcbiAgICAgICAgLy8gKGUuZy4gaWYgc2hhcmVkIGJldHdlZW4gY29tcG9uZW50cyksIGJ1dCB3ZSBvbmx5IHdhbnQgdG8gcmVjb3JkIHRoZW1cbiAgICAgICAgLy8gb25jZS4gT24gdGhlIG90aGVyIGhhbmQsIGFuIGlubGluZSB0ZW1wbGF0ZSByZXNpZGVzIGluIGEgVFMgZmlsZSB0aGF0XG4gICAgICAgIC8vIG1heSBjb250YWluIG11bHRpcGxlIGlubGluZSB0ZW1wbGF0ZXMuXG4gICAgICAgIGZpeGVzQnlGaWxlLmdldChmaWxlKSEucHVzaCh0ZW1wbGF0ZUZpeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpeGVzQnlGaWxlLnNldChmaWxlLCBbdGVtcGxhdGVGaXhdKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZml4ZXNCeUZpbGU7XG59XG5cbmZ1bmN0aW9uIGZpeEVtcHR5Um91dGVybGlua3NJblRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlKTogRml4ZWRUZW1wbGF0ZXxudWxsIHtcbiAgY29uc3QgZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnMgPSBhbmFseXplUmVzb2x2ZWRUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG5cbiAgaWYgKCFlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9ucykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gU29ydCBiYWNrd2FyZHMgc28gc3RyaW5nIHJlcGxhY2VtZW50cyBkbyBub3QgY29uZmxpY3RcbiAgZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnMuc29ydCgoYSwgYikgPT4gYi52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0IC0gYS52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0KTtcbiAgbGV0IG5ld0NvbnRlbnQgPSB0ZW1wbGF0ZS5jb250ZW50O1xuICBmb3IgKGNvbnN0IGV4cHIgb2YgZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnMpIHtcbiAgICBpZiAoZXhwci52YWx1ZVNwYW4pIHtcbiAgICAgIG5ld0NvbnRlbnQgPSBuZXdDb250ZW50LnN1YnN0cigwLCBleHByLnZhbHVlLnNvdXJjZVNwYW4uc3RhcnQpICsgJ1tdJyArXG4gICAgICAgICAgbmV3Q29udGVudC5zdWJzdHIoZXhwci52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3Q29udGVudCA9IG5ld0NvbnRlbnQuc3Vic3RyKDAsIGV4cHIuc291cmNlU3Bhbi5lbmQub2Zmc2V0KSArICc9XCJbXVwiJyArXG4gICAgICAgICAgbmV3Q29udGVudC5zdWJzdHIoZXhwci5zb3VyY2VTcGFuLmVuZC5vZmZzZXQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7b3JpZ2luYWxUZW1wbGF0ZTogdGVtcGxhdGUsIG5ld0NvbnRlbnQsIGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zfTtcbn1cbiJdfQ==