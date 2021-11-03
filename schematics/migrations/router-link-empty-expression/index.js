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
        define("@angular/core/schematics/migrations/router-link-empty-expression", ["require", "exports", "@angular-devkit/core", "@angular-devkit/schematics", "path", "@angular/core/schematics/utils/load_esm", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/router-link-empty-expression/analyze_template"], factory);
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
    const analyze_template_1 = require("@angular/core/schematics/migrations/router-link-empty-expression/analyze_template");
    const README_URL = 'https://github.com/angular/angular/blob/master/packages/core/schematics/migrations/router-link-empty-expression/README.md';
    /** Entry point for the RouterLink empty expression migration. */
    function default_1() {
        return (tree, context) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot check templates for empty routerLinks.');
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
                runEmptyRouterLinkExpressionMigration(tree, tsconfigPath, basePath, context.logger, compilerModule);
            }
        });
    }
    exports.default = default_1;
    /**
     * Runs the routerLink migration, changing routerLink="" to routerLink="[]" and notifying developers
     * which templates received updates.
     */
    function runEmptyRouterLinkExpressionMigration(tree, tsconfigPath, basePath, logger, compilerModule) {
        const { program } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const typeChecker = program.getTypeChecker();
        const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker, basePath, tree);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        // Analyze source files by detecting HTML templates.
        sourceFiles.forEach(sourceFile => templateVisitor.visitNode(sourceFile));
        const { resolvedTemplates } = templateVisitor;
        fixEmptyRouterlinks(resolvedTemplates, tree, logger, compilerModule);
    }
    function fixEmptyRouterlinks(resolvedTemplates, tree, logger, compilerModule) {
        var _a;
        const basePath = process.cwd();
        const collectedFixes = [];
        const fixesByFile = getFixesByFile(resolvedTemplates, compilerModule);
        for (const [absFilePath, templateFixes] of fixesByFile) {
            const treeFilePath = (0, path_1.relative)((0, core_1.normalize)(basePath), (0, core_1.normalize)(absFilePath));
            const originalFileContent = (_a = tree.read(treeFilePath)) === null || _a === void 0 ? void 0 : _a.toString();
            if (originalFileContent === undefined) {
                logger.error(`Failed to read file containing template; cannot apply fixes for empty routerLink expressions in ${treeFilePath}.`);
                continue;
            }
            const updater = tree.beginUpdate(treeFilePath);
            for (const templateFix of templateFixes) {
                // Sort backwards so string replacements do not conflict
                templateFix.replacements.sort((a, b) => b.start - a.start);
                for (const replacement of templateFix.replacements) {
                    updater.remove(replacement.start, replacement.end - replacement.start);
                    updater.insertLeft(replacement.start, replacement.newContent);
                }
                const displayFilePath = (0, core_1.normalize)((0, path_1.relative)(basePath, templateFix.originalTemplate.filePath));
                for (const n of templateFix.emptyRouterlinkExpressions) {
                    const { line, character } = templateFix.originalTemplate.getCharacterAndLineOfPosition(n.sourceSpan.start.offset);
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
    function getFixesByFile(templates, compilerModule) {
        const fixesByFile = new Map();
        for (const template of templates) {
            const templateFix = fixEmptyRouterlinksInTemplate(template, compilerModule);
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
    function fixEmptyRouterlinksInTemplate(template, compilerModule) {
        const emptyRouterlinkExpressions = (0, analyze_template_1.analyzeResolvedTemplate)(template, compilerModule);
        if (!emptyRouterlinkExpressions || emptyRouterlinkExpressions.length === 0) {
            return null;
        }
        const replacements = [];
        for (const expr of emptyRouterlinkExpressions) {
            let replacement;
            if (expr.valueSpan) {
                replacement = {
                    start: template.start + expr.value.sourceSpan.start,
                    end: template.start + expr.value.sourceSpan.end,
                    newContent: '[]',
                };
            }
            else {
                const spanLength = expr.sourceSpan.end.offset - expr.sourceSpan.start.offset;
                // `expr.value.sourceSpan.start` is the start of the very beginning of the binding since there
                // is no value
                const endOfExpr = template.start + expr.value.sourceSpan.start + spanLength;
                replacement = {
                    start: endOfExpr,
                    end: endOfExpr,
                    newContent: '="[]"',
                };
            }
            replacements.push(replacement);
        }
        return { originalTemplate: template, replacements, emptyRouterlinkExpressions };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9yb3V0ZXItbGluay1lbXB0eS1leHByZXNzaW9uL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQXdEO0lBQ3hELDJEQUE2RjtJQUU3RiwrQkFBOEI7SUFDOUIsc0VBQW1EO0lBRW5ELGdHQUErRjtJQUMvRixrR0FBMkU7SUFDM0UsMkZBQTRGO0lBRTVGLHdIQUEyRDtJQUkzRCxNQUFNLFVBQVUsR0FDWiwySEFBMkgsQ0FBQztJQWFoSSxpRUFBaUU7SUFDakU7UUFDRSxPQUFPLENBQU8sSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUNyRCxNQUFNLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBQyxHQUFHLE1BQU0sSUFBQSxnREFBdUIsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUNwRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxNQUFNLElBQUksZ0NBQW1CLENBQ3pCLGlGQUFpRixDQUFDLENBQUM7YUFDeEY7WUFFRCxJQUFJLGNBQWMsQ0FBQztZQUNuQixJQUFJO2dCQUNGLCtFQUErRTtnQkFDL0UseUZBQXlGO2dCQUN6RixzQ0FBc0M7Z0JBQ3RDLGNBQWMsR0FBRyxNQUFNLElBQUEsd0JBQWEsRUFBcUMsbUJBQW1CLENBQUMsQ0FBQzthQUMvRjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsNERBQTRELENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2FBQzlFO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFB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SSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSztvQkFDbkQsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRztvQkFDL0MsVUFBVSxFQUFFLElBQUk7aUJBQ2pCLENBQUM7YUFDSDtpQkFBTTtnQkFDTCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO2dCQUM3RSw4RkFBOEY7Z0JBQzlGLGNBQWM7Z0JBQ2QsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDO2dCQUM1RSxXQUFXLEdBQUc7b0JBQ1osS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLEdBQUcsRUFBRSxTQUFTO29CQUNkLFVBQVUsRUFBRSxPQUFPO2lCQUNwQixDQUFDO2FBQ0g7WUFDRCxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ2hDO1FBRUQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsMEJBQTBCLEVBQUMsQ0FBQztJQUNoRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9nZ2luZywgbm9ybWFsaXplfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB0eXBlIHtUbXBsQXN0Qm91bmRBdHRyaWJ1dGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7cmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtsb2FkRXNtTW9kdWxlfSBmcm9tICcuLi8uLi91dGlscy9sb2FkX2VzbSc7XG5cbmltcG9ydCB7TmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3IsIFJlc29sdmVkVGVtcGxhdGV9IGZyb20gJy4uLy4uL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZSc7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5cbmltcG9ydCB7YW5hbHl6ZVJlc29sdmVkVGVtcGxhdGV9IGZyb20gJy4vYW5hbHl6ZV90ZW1wbGF0ZSc7XG5cbnR5cGUgTG9nZ2VyID0gbG9nZ2luZy5Mb2dnZXJBcGk7XG5cbmNvbnN0IFJFQURNRV9VUkwgPVxuICAgICdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvbWFzdGVyL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JvdXRlci1saW5rLWVtcHR5LWV4cHJlc3Npb24vUkVBRE1FLm1kJztcblxuaW50ZXJmYWNlIFJlcGxhY2VtZW50IHtcbiAgc3RhcnQ6IG51bWJlcjtcbiAgZW5kOiBudW1iZXI7XG4gIG5ld0NvbnRlbnQ6IHN0cmluZztcbn1cbmludGVyZmFjZSBGaXhlZFRlbXBsYXRlIHtcbiAgb3JpZ2luYWxUZW1wbGF0ZTogUmVzb2x2ZWRUZW1wbGF0ZTtcbiAgcmVwbGFjZW1lbnRzOiBSZXBsYWNlbWVudFtdO1xuICBlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9uczogVG1wbEFzdEJvdW5kQXR0cmlidXRlW107XG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFJvdXRlckxpbmsgZW1wdHkgZXhwcmVzc2lvbiBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBhd2FpdCBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBjaGVjayB0ZW1wbGF0ZXMgZm9yIGVtcHR5IHJvdXRlckxpbmtzLicpO1xuICAgIH1cblxuICAgIGxldCBjb21waWxlck1vZHVsZTtcbiAgICB0cnkge1xuICAgICAgLy8gTG9hZCBFU00gYEBhbmd1bGFyL2NvbXBpbGVyYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAgICAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW4gYmVcbiAgICAgIC8vIGNoYW5nZWQgdG8gYSBkaXJlY3QgZHluYW1pYyBpbXBvcnQuXG4gICAgICBjb21waWxlck1vZHVsZSA9IGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKT4oJ0Bhbmd1bGFyL2NvbXBpbGVyJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgYFVuYWJsZSB0byBsb2FkIHRoZSAnQGFuZ3VsYXIvY29tcGlsZXInIHBhY2thZ2UuIERldGFpbHM6ICR7ZS5tZXNzYWdlfWApO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIFsuLi5idWlsZFBhdGhzLCAuLi50ZXN0UGF0aHNdKSB7XG4gICAgICBydW5FbXB0eVJvdXRlckxpbmtFeHByZXNzaW9uTWlncmF0aW9uKFxuICAgICAgICAgIHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGNvbnRleHQubG9nZ2VyLCBjb21waWxlck1vZHVsZSk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJ1bnMgdGhlIHJvdXRlckxpbmsgbWlncmF0aW9uLCBjaGFuZ2luZyByb3V0ZXJMaW5rPVwiXCIgdG8gcm91dGVyTGluaz1cIltdXCIgYW5kIG5vdGlmeWluZyBkZXZlbG9wZXJzXG4gKiB3aGljaCB0ZW1wbGF0ZXMgcmVjZWl2ZWQgdXBkYXRlcy5cbiAqL1xuZnVuY3Rpb24gcnVuRW1wdHlSb3V0ZXJMaW5rRXhwcmVzc2lvbk1pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZywgbG9nZ2VyOiBMb2dnZXIsXG4gICAgY29tcGlsZXJNb2R1bGU6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJykpIHtcbiAgY29uc3Qge3Byb2dyYW19ID0gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbSh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHRlbXBsYXRlVmlzaXRvciA9IG5ldyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcih0eXBlQ2hlY2tlciwgYmFzZVBhdGgsIHRyZWUpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9XG4gICAgICBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKHNvdXJjZUZpbGUgPT4gY2FuTWlncmF0ZUZpbGUoYmFzZVBhdGgsIHNvdXJjZUZpbGUsIHByb2dyYW0pKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgSFRNTCB0ZW1wbGF0ZXMuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB0ZW1wbGF0ZVZpc2l0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7cmVzb2x2ZWRUZW1wbGF0ZXN9ID0gdGVtcGxhdGVWaXNpdG9yO1xuICBmaXhFbXB0eVJvdXRlcmxpbmtzKHJlc29sdmVkVGVtcGxhdGVzLCB0cmVlLCBsb2dnZXIsIGNvbXBpbGVyTW9kdWxlKTtcbn1cblxuZnVuY3Rpb24gZml4RW1wdHlSb3V0ZXJsaW5rcyhcbiAgICByZXNvbHZlZFRlbXBsYXRlczogUmVzb2x2ZWRUZW1wbGF0ZVtdLCB0cmVlOiBUcmVlLCBsb2dnZXI6IExvZ2dlcixcbiAgICBjb21waWxlck1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKSkge1xuICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IGNvbGxlY3RlZEZpeGVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBmaXhlc0J5RmlsZSA9IGdldEZpeGVzQnlGaWxlKHJlc29sdmVkVGVtcGxhdGVzLCBjb21waWxlck1vZHVsZSk7XG5cbiAgZm9yIChjb25zdCBbYWJzRmlsZVBhdGgsIHRlbXBsYXRlRml4ZXNdIG9mIGZpeGVzQnlGaWxlKSB7XG4gICAgY29uc3QgdHJlZUZpbGVQYXRoID0gcmVsYXRpdmUobm9ybWFsaXplKGJhc2VQYXRoKSwgbm9ybWFsaXplKGFic0ZpbGVQYXRoKSk7XG4gICAgY29uc3Qgb3JpZ2luYWxGaWxlQ29udGVudCA9IHRyZWUucmVhZCh0cmVlRmlsZVBhdGgpPy50b1N0cmluZygpO1xuICAgIGlmIChvcmlnaW5hbEZpbGVDb250ZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgRmFpbGVkIHRvIHJlYWQgZmlsZSBjb250YWluaW5nIHRlbXBsYXRlOyBjYW5ub3QgYXBwbHkgZml4ZXMgZm9yIGVtcHR5IHJvdXRlckxpbmsgZXhwcmVzc2lvbnMgaW4gJHtcbiAgICAgICAgICAgICAgdHJlZUZpbGVQYXRofS5gKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHRyZWVGaWxlUGF0aCk7XG4gICAgZm9yIChjb25zdCB0ZW1wbGF0ZUZpeCBvZiB0ZW1wbGF0ZUZpeGVzKSB7XG4gICAgICAvLyBTb3J0IGJhY2t3YXJkcyBzbyBzdHJpbmcgcmVwbGFjZW1lbnRzIGRvIG5vdCBjb25mbGljdFxuICAgICAgdGVtcGxhdGVGaXgucmVwbGFjZW1lbnRzLnNvcnQoKGEsIGIpID0+IGIuc3RhcnQgLSBhLnN0YXJ0KTtcbiAgICAgIGZvciAoY29uc3QgcmVwbGFjZW1lbnQgb2YgdGVtcGxhdGVGaXgucmVwbGFjZW1lbnRzKSB7XG4gICAgICAgIHVwZGF0ZXIucmVtb3ZlKHJlcGxhY2VtZW50LnN0YXJ0LCByZXBsYWNlbWVudC5lbmQgLSByZXBsYWNlbWVudC5zdGFydCk7XG4gICAgICAgIHVwZGF0ZXIuaW5zZXJ0TGVmdChyZXBsYWNlbWVudC5zdGFydCwgcmVwbGFjZW1lbnQubmV3Q29udGVudCk7XG4gICAgICB9XG4gICAgICBjb25zdCBkaXNwbGF5RmlsZVBhdGggPSBub3JtYWxpemUocmVsYXRpdmUoYmFzZVBhdGgsIHRlbXBsYXRlRml4Lm9yaWdpbmFsVGVtcGxhdGUuZmlsZVBhdGgpKTtcbiAgICAgIGZvciAoY29uc3QgbiBvZiB0ZW1wbGF0ZUZpeC5lbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9ucykge1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICB0ZW1wbGF0ZUZpeC5vcmlnaW5hbFRlbXBsYXRlLmdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uKG4uc291cmNlU3Bhbi5zdGFydC5vZmZzZXQpO1xuICAgICAgICBjb2xsZWN0ZWRGaXhlcy5wdXNoKGAke2Rpc3BsYXlGaWxlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfWApO1xuICAgICAgfVxuICAgICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlcik7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbGxlY3RlZEZpeGVzLmxlbmd0aCA+IDApIHtcbiAgICBsb2dnZXIuaW5mbygnLS0tLSBSb3V0ZXJMaW5rIGVtcHR5IGFzc2lnbm1lbnQgc2NoZW1hdGljIC0tLS0nKTtcbiAgICBsb2dnZXIuaW5mbygnVGhlIGJlaGF2aW9yIG9mIGVtcHR5L2B1bmRlZmluZWRgIGlucHV0cyBmb3IgYHJvdXRlckxpbmtgIGhhcyBjaGFuZ2VkJyk7XG4gICAgbG9nZ2VyLmluZm8oJ2Zyb20gbGlua2luZyB0byB0aGUgY3VycmVudCBwYWdlIHRvIGluc3RlYWQgY29tcGxldGVseSBkaXNhYmxlIHRoZSBsaW5rLicpO1xuICAgIGxvZ2dlci5pbmZvKGBSZWFkIG1vcmUgYWJvdXQgdGhpcyBjaGFuZ2UgaGVyZTogJHtSRUFETUVfVVJMfWApO1xuICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICBsb2dnZXIuaW5mbygnVGhlIGZvbGxvd2luZyBlbXB0eSBgcm91dGVyTGlua2AgaW5wdXRzIHdlcmUgZm91bmQgYW5kIGZpeGVkOicpO1xuICAgIGNvbGxlY3RlZEZpeGVzLmZvckVhY2goZml4ID0+IGxvZ2dlci53YXJuKGDirpEgICAke2ZpeH1gKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGZpeGVzIGZvciBub2RlcyBpbiB0ZW1wbGF0ZXMgd2hpY2ggY29udGFpbiBlbXB0eSByb3V0ZXJMaW5rIGFzc2lnbm1lbnRzLCBncm91cGVkIGJ5IGZpbGUuXG4gKi9cbmZ1bmN0aW9uIGdldEZpeGVzQnlGaWxlKFxuICAgIHRlbXBsYXRlczogUmVzb2x2ZWRUZW1wbGF0ZVtdLFxuICAgIGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpKTogTWFwPHN0cmluZywgRml4ZWRUZW1wbGF0ZVtdPiB7XG4gIGNvbnN0IGZpeGVzQnlGaWxlID0gbmV3IE1hcDxzdHJpbmcsIEZpeGVkVGVtcGxhdGVbXT4oKTtcbiAgZm9yIChjb25zdCB0ZW1wbGF0ZSBvZiB0ZW1wbGF0ZXMpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZUZpeCA9IGZpeEVtcHR5Um91dGVybGlua3NJblRlbXBsYXRlKHRlbXBsYXRlLCBjb21waWxlck1vZHVsZSk7XG4gICAgaWYgKHRlbXBsYXRlRml4ID09PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gdGVtcGxhdGUuZmlsZVBhdGg7XG4gICAgaWYgKGZpeGVzQnlGaWxlLmhhcyhmaWxlKSkge1xuICAgICAgaWYgKHRlbXBsYXRlLmlubGluZSkge1xuICAgICAgICAvLyBFeHRlcm5hbCB0ZW1wbGF0ZXMgbWF5IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMgaW4gdGhlIHByb2plY3RcbiAgICAgICAgLy8gKGUuZy4gaWYgc2hhcmVkIGJldHdlZW4gY29tcG9uZW50cyksIGJ1dCB3ZSBvbmx5IHdhbnQgdG8gcmVjb3JkIHRoZW1cbiAgICAgICAgLy8gb25jZS4gT24gdGhlIG90aGVyIGhhbmQsIGFuIGlubGluZSB0ZW1wbGF0ZSByZXNpZGVzIGluIGEgVFMgZmlsZSB0aGF0XG4gICAgICAgIC8vIG1heSBjb250YWluIG11bHRpcGxlIGlubGluZSB0ZW1wbGF0ZXMuXG4gICAgICAgIGZpeGVzQnlGaWxlLmdldChmaWxlKSEucHVzaCh0ZW1wbGF0ZUZpeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpeGVzQnlGaWxlLnNldChmaWxlLCBbdGVtcGxhdGVGaXhdKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZml4ZXNCeUZpbGU7XG59XG5cbmZ1bmN0aW9uIGZpeEVtcHR5Um91dGVybGlua3NJblRlbXBsYXRlKFxuICAgIHRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlLCBjb21waWxlck1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKSk6IEZpeGVkVGVtcGxhdGV8XG4gICAgbnVsbCB7XG4gIGNvbnN0IGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zID0gYW5hbHl6ZVJlc29sdmVkVGVtcGxhdGUodGVtcGxhdGUsIGNvbXBpbGVyTW9kdWxlKTtcblxuICBpZiAoIWVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zIHx8IGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcmVwbGFjZW1lbnRzOiBSZXBsYWNlbWVudFtdID0gW107XG4gIGZvciAoY29uc3QgZXhwciBvZiBlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9ucykge1xuICAgIGxldCByZXBsYWNlbWVudDogUmVwbGFjZW1lbnQ7XG4gICAgaWYgKGV4cHIudmFsdWVTcGFuKSB7XG4gICAgICByZXBsYWNlbWVudCA9IHtcbiAgICAgICAgc3RhcnQ6IHRlbXBsYXRlLnN0YXJ0ICsgZXhwci52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0LFxuICAgICAgICBlbmQ6IHRlbXBsYXRlLnN0YXJ0ICsgZXhwci52YWx1ZS5zb3VyY2VTcGFuLmVuZCxcbiAgICAgICAgbmV3Q29udGVudDogJ1tdJyxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNwYW5MZW5ndGggPSBleHByLnNvdXJjZVNwYW4uZW5kLm9mZnNldCAtIGV4cHIuc291cmNlU3Bhbi5zdGFydC5vZmZzZXQ7XG4gICAgICAvLyBgZXhwci52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0YCBpcyB0aGUgc3RhcnQgb2YgdGhlIHZlcnkgYmVnaW5uaW5nIG9mIHRoZSBiaW5kaW5nIHNpbmNlIHRoZXJlXG4gICAgICAvLyBpcyBubyB2YWx1ZVxuICAgICAgY29uc3QgZW5kT2ZFeHByID0gdGVtcGxhdGUuc3RhcnQgKyBleHByLnZhbHVlLnNvdXJjZVNwYW4uc3RhcnQgKyBzcGFuTGVuZ3RoO1xuICAgICAgcmVwbGFjZW1lbnQgPSB7XG4gICAgICAgIHN0YXJ0OiBlbmRPZkV4cHIsXG4gICAgICAgIGVuZDogZW5kT2ZFeHByLFxuICAgICAgICBuZXdDb250ZW50OiAnPVwiW11cIicsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXBsYWNlbWVudHMucHVzaChyZXBsYWNlbWVudCk7XG4gIH1cblxuICByZXR1cm4ge29yaWdpbmFsVGVtcGxhdGU6IHRlbXBsYXRlLCByZXBsYWNlbWVudHMsIGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zfTtcbn1cbiJdfQ==