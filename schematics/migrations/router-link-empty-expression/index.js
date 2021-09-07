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
        return (tree, context) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot check templates for empty routerLinks.');
            }
            for (const tsconfigPath of [...buildPaths, ...testPaths]) {
                runEmptyRouterLinkExpressionMigration(tree, tsconfigPath, basePath, context.logger);
            }
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9yb3V0ZXItbGluay1lbXB0eS1leHByZXNzaW9uL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQXdEO0lBQ3hELDJEQUE2RjtJQUU3RiwrQkFBOEI7SUFFOUIsZ0dBQStGO0lBQy9GLGtHQUEyRTtJQUMzRSwyRkFBNEY7SUFFNUYsd0hBQTJEO0lBSTNELE1BQU0sVUFBVSxHQUNaLDJIQUEySCxDQUFDO0lBUWhJLGlFQUFpRTtJQUNqRTtRQUNFLE9BQU8sQ0FBTyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQ3JELE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxNQUFNLElBQUksZ0NBQW1CLENBQ3pCLGlGQUFpRixDQUFDLENBQUM7YUFDeEY7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRTtnQkFDeEQscUNBQXFDLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3JGO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBZEQsNEJBY0M7SUFFRDs7O09BR0c7SUFDSCxTQUFTLHFDQUFxQyxDQUMxQyxJQUFVLEVBQUUsWUFBb0IsRUFBRSxRQUFnQixFQUFFLE1BQWM7UUFDcEUsTUFB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QVMsNkJBQTZCLENBQUMsUUFBMEI7UUFDL0QsTUFBTSwwQkFBMEIsR0FBRywwQ0FBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVyRSxJQUFJLENBQUMsMEJBQTBCLEVBQUU7WUFDL0IsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELHdEQUF3RDtRQUN4RCwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0YsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztRQUNsQyxLQUFLLE1BQU0sSUFBSSxJQUFJLDBCQUEwQixFQUFFO1lBQzdDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDbEIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUk7b0JBQ2pFLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDcEQ7aUJBQU07Z0JBQ0wsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLE9BQU87b0JBQ25FLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDbkQ7U0FDRjtRQUVELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLDBCQUEwQixFQUFDLENBQUM7SUFDOUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmcsIG5vcm1hbGl6ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge0VtcHR5RXhwciwgVG1wbEFzdEJvdW5kQXR0cmlidXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcblxuaW1wb3J0IHtOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvciwgUmVzb2x2ZWRUZW1wbGF0ZX0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjYW5NaWdyYXRlRmlsZSwgY3JlYXRlTWlncmF0aW9uUHJvZ3JhbX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcblxuaW1wb3J0IHthbmFseXplUmVzb2x2ZWRUZW1wbGF0ZX0gZnJvbSAnLi9hbmFseXplX3RlbXBsYXRlJztcblxudHlwZSBMb2dnZXIgPSBsb2dnaW5nLkxvZ2dlckFwaTtcblxuY29uc3QgUkVBRE1FX1VSTCA9XG4gICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi9tYXN0ZXIvcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvcm91dGVyLWxpbmstZW1wdHktZXhwcmVzc2lvbi9SRUFETUUubWQnO1xuXG5pbnRlcmZhY2UgRml4ZWRUZW1wbGF0ZSB7XG4gIG9yaWdpbmFsVGVtcGxhdGU6IFJlc29sdmVkVGVtcGxhdGU7XG4gIG5ld0NvbnRlbnQ6IHN0cmluZztcbiAgZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnM6IFRtcGxBc3RCb3VuZEF0dHJpYnV0ZVtdO1xufVxuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBSb3V0ZXJMaW5rIGVtcHR5IGV4cHJlc3Npb24gbWlncmF0aW9uLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgY2hlY2sgdGVtcGxhdGVzIGZvciBlbXB0eSByb3V0ZXJMaW5rcy4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXSkge1xuICAgICAgcnVuRW1wdHlSb3V0ZXJMaW5rRXhwcmVzc2lvbk1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBjb250ZXh0LmxvZ2dlcik7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJ1bnMgdGhlIHJvdXRlckxpbmsgbWlncmF0aW9uLCBjaGFuZ2luZyByb3V0ZXJMaW5rPVwiXCIgdG8gcm91dGVyTGluaz1cIltdXCIgYW5kIG5vdGlmeWluZyBkZXZlbG9wZXJzXG4gKiB3aGljaCB0ZW1wbGF0ZXMgcmVjZWl2ZWQgdXBkYXRlcy5cbiAqL1xuZnVuY3Rpb24gcnVuRW1wdHlSb3V0ZXJMaW5rRXhwcmVzc2lvbk1pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZywgbG9nZ2VyOiBMb2dnZXIpIHtcbiAgY29uc3Qge3Byb2dyYW19ID0gY3JlYXRlTWlncmF0aW9uUHJvZ3JhbSh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHRlbXBsYXRlVmlzaXRvciA9IG5ldyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID1cbiAgICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoc291cmNlRmlsZSA9PiBjYW5NaWdyYXRlRmlsZShiYXNlUGF0aCwgc291cmNlRmlsZSwgcHJvZ3JhbSkpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBIVE1MIHRlbXBsYXRlcy5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHRlbXBsYXRlVmlzaXRvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtyZXNvbHZlZFRlbXBsYXRlc30gPSB0ZW1wbGF0ZVZpc2l0b3I7XG4gIGZpeEVtcHR5Um91dGVybGlua3MocmVzb2x2ZWRUZW1wbGF0ZXMsIHRyZWUsIGxvZ2dlcik7XG59XG5cbmZ1bmN0aW9uIGZpeEVtcHR5Um91dGVybGlua3MocmVzb2x2ZWRUZW1wbGF0ZXM6IFJlc29sdmVkVGVtcGxhdGVbXSwgdHJlZTogVHJlZSwgbG9nZ2VyOiBMb2dnZXIpIHtcbiAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICBjb25zdCBjb2xsZWN0ZWRGaXhlczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZml4ZXNCeUZpbGUgPSBnZXRGaXhlc0J5RmlsZShyZXNvbHZlZFRlbXBsYXRlcyk7XG5cbiAgZm9yIChjb25zdCBbYWJzRmlsZVBhdGgsIGZpeGVzXSBvZiBmaXhlc0J5RmlsZSkge1xuICAgIGNvbnN0IHRyZWVGaWxlUGF0aCA9IHJlbGF0aXZlKG5vcm1hbGl6ZShiYXNlUGF0aCksIG5vcm1hbGl6ZShhYnNGaWxlUGF0aCkpO1xuICAgIGNvbnN0IG9yaWdpbmFsRmlsZUNvbnRlbnQgPSB0cmVlLnJlYWQodHJlZUZpbGVQYXRoKT8udG9TdHJpbmcoKTtcbiAgICBpZiAob3JpZ2luYWxGaWxlQ29udGVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoXG4gICAgICAgICAgYEZhaWxlZCB0byByZWFkIGZpbGUgY29udGFpbmluZyB0ZW1wbGF0ZTsgY2Fubm90IGFwcGx5IGZpeGVzIGZvciBlbXB0eSByb3V0ZXJMaW5rIGV4cHJlc3Npb25zIGluICR7XG4gICAgICAgICAgICAgIHRyZWVGaWxlUGF0aH0uYCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVyID0gdHJlZS5iZWdpblVwZGF0ZSh0cmVlRmlsZVBhdGgpO1xuICAgIGZvciAoY29uc3QgZml4IG9mIGZpeGVzKSB7XG4gICAgICBjb25zdCBkaXNwbGF5RmlsZVBhdGggPSBub3JtYWxpemUocmVsYXRpdmUoYmFzZVBhdGgsIGZpeC5vcmlnaW5hbFRlbXBsYXRlLmZpbGVQYXRoKSk7XG4gICAgICB1cGRhdGVyLnJlbW92ZShmaXgub3JpZ2luYWxUZW1wbGF0ZS5zdGFydCwgZml4Lm9yaWdpbmFsVGVtcGxhdGUuY29udGVudC5sZW5ndGgpO1xuICAgICAgdXBkYXRlci5pbnNlcnRMZWZ0KGZpeC5vcmlnaW5hbFRlbXBsYXRlLnN0YXJ0LCBmaXgubmV3Q29udGVudCk7XG5cbiAgICAgIGZvciAoY29uc3QgbiBvZiBmaXguZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnMpIHtcbiAgICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICAgZml4Lm9yaWdpbmFsVGVtcGxhdGUuZ2V0Q2hhcmFjdGVyQW5kTGluZU9mUG9zaXRpb24obi5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCk7XG4gICAgICAgIGNvbGxlY3RlZEZpeGVzLnB1c2goYCR7ZGlzcGxheUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9YCk7XG4gICAgICB9XG4gICAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGVyKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29sbGVjdGVkRml4ZXMubGVuZ3RoID4gMCkge1xuICAgIGxvZ2dlci5pbmZvKCctLS0tIFJvdXRlckxpbmsgZW1wdHkgYXNzaWdubWVudCBzY2hlbWF0aWMgLS0tLScpO1xuICAgIGxvZ2dlci5pbmZvKCdUaGUgYmVoYXZpb3Igb2YgZW1wdHkvYHVuZGVmaW5lZGAgaW5wdXRzIGZvciBgcm91dGVyTGlua2AgaGFzIGNoYW5nZWQnKTtcbiAgICBsb2dnZXIuaW5mbygnZnJvbSBsaW5raW5nIHRvIHRoZSBjdXJyZW50IHBhZ2UgdG8gaW5zdGVhZCBjb21wbGV0ZWx5IGRpc2FibGUgdGhlIGxpbmsuJyk7XG4gICAgbG9nZ2VyLmluZm8oYFJlYWQgbW9yZSBhYm91dCB0aGlzIGNoYW5nZSBoZXJlOiAke1JFQURNRV9VUkx9YCk7XG4gICAgbG9nZ2VyLmluZm8oJycpO1xuICAgIGxvZ2dlci5pbmZvKCdUaGUgZm9sbG93aW5nIGVtcHR5IGByb3V0ZXJMaW5rYCBpbnB1dHMgd2VyZSBmb3VuZCBhbmQgZml4ZWQ6Jyk7XG4gICAgY29sbGVjdGVkRml4ZXMuZm9yRWFjaChmaXggPT4gbG9nZ2VyLndhcm4oYOKukSAgICR7Zml4fWApKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgZml4ZXMgZm9yIG5vZGVzIGluIHRlbXBsYXRlcyB3aGljaCBjb250YWluIGVtcHR5IHJvdXRlckxpbmsgYXNzaWdubWVudHMsIGdyb3VwZWQgYnkgZmlsZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Rml4ZXNCeUZpbGUodGVtcGxhdGVzOiBSZXNvbHZlZFRlbXBsYXRlW10pOiBNYXA8c3RyaW5nLCBGaXhlZFRlbXBsYXRlW10+IHtcbiAgY29uc3QgZml4ZXNCeUZpbGUgPSBuZXcgTWFwPHN0cmluZywgRml4ZWRUZW1wbGF0ZVtdPigpO1xuICBmb3IgKGNvbnN0IHRlbXBsYXRlIG9mIHRlbXBsYXRlcykge1xuICAgIGNvbnN0IHRlbXBsYXRlRml4ID0gZml4RW1wdHlSb3V0ZXJsaW5rc0luVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgIGlmICh0ZW1wbGF0ZUZpeCA9PT0gbnVsbCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IHRlbXBsYXRlLmZpbGVQYXRoO1xuICAgIGlmIChmaXhlc0J5RmlsZS5oYXMoZmlsZSkpIHtcbiAgICAgIGlmICh0ZW1wbGF0ZS5pbmxpbmUpIHtcbiAgICAgICAgLy8gRXh0ZXJuYWwgdGVtcGxhdGVzIG1heSBiZSByZWZlcmVuY2VkIG11bHRpcGxlIHRpbWVzIGluIHRoZSBwcm9qZWN0XG4gICAgICAgIC8vIChlLmcuIGlmIHNoYXJlZCBiZXR3ZWVuIGNvbXBvbmVudHMpLCBidXQgd2Ugb25seSB3YW50IHRvIHJlY29yZCB0aGVtXG4gICAgICAgIC8vIG9uY2UuIE9uIHRoZSBvdGhlciBoYW5kLCBhbiBpbmxpbmUgdGVtcGxhdGUgcmVzaWRlcyBpbiBhIFRTIGZpbGUgdGhhdFxuICAgICAgICAvLyBtYXkgY29udGFpbiBtdWx0aXBsZSBpbmxpbmUgdGVtcGxhdGVzLlxuICAgICAgICBmaXhlc0J5RmlsZS5nZXQoZmlsZSkhLnB1c2godGVtcGxhdGVGaXgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmaXhlc0J5RmlsZS5zZXQoZmlsZSwgW3RlbXBsYXRlRml4XSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZpeGVzQnlGaWxlO1xufVxuXG5mdW5jdGlvbiBmaXhFbXB0eVJvdXRlcmxpbmtzSW5UZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRUZW1wbGF0ZSk6IEZpeGVkVGVtcGxhdGV8bnVsbCB7XG4gIGNvbnN0IGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zID0gYW5hbHl6ZVJlc29sdmVkVGVtcGxhdGUodGVtcGxhdGUpO1xuXG4gIGlmICghZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFNvcnQgYmFja3dhcmRzIHNvIHN0cmluZyByZXBsYWNlbWVudHMgZG8gbm90IGNvbmZsaWN0XG4gIGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zLnNvcnQoKGEsIGIpID0+IGIudmFsdWUuc291cmNlU3Bhbi5zdGFydCAtIGEudmFsdWUuc291cmNlU3Bhbi5zdGFydCk7XG4gIGxldCBuZXdDb250ZW50ID0gdGVtcGxhdGUuY29udGVudDtcbiAgZm9yIChjb25zdCBleHByIG9mIGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zKSB7XG4gICAgaWYgKGV4cHIudmFsdWVTcGFuKSB7XG4gICAgICBuZXdDb250ZW50ID0gbmV3Q29udGVudC5zdWJzdHIoMCwgZXhwci52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0KSArICdbXScgK1xuICAgICAgICAgIG5ld0NvbnRlbnQuc3Vic3RyKGV4cHIudmFsdWUuc291cmNlU3Bhbi5zdGFydCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0NvbnRlbnQgPSBuZXdDb250ZW50LnN1YnN0cigwLCBleHByLnNvdXJjZVNwYW4uZW5kLm9mZnNldCkgKyAnPVwiW11cIicgK1xuICAgICAgICAgIG5ld0NvbnRlbnQuc3Vic3RyKGV4cHIuc291cmNlU3Bhbi5lbmQub2Zmc2V0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge29yaWdpbmFsVGVtcGxhdGU6IHRlbXBsYXRlLCBuZXdDb250ZW50LCBlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9uc307XG59XG4iXX0=