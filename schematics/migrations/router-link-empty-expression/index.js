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
        for (const [absFilePath, templateFixes] of fixesByFile) {
            const treeFilePath = path_1.relative(core_1.normalize(basePath), core_1.normalize(absFilePath));
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
                const displayFilePath = core_1.normalize(path_1.relative(basePath, templateFix.originalTemplate.filePath));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9yb3V0ZXItbGluay1lbXB0eS1leHByZXNzaW9uL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQXdEO0lBQ3hELDJEQUE2RjtJQUU3RiwrQkFBOEI7SUFFOUIsZ0dBQStGO0lBQy9GLGtHQUEyRTtJQUMzRSwyRkFBNEY7SUFFNUYsd0hBQTJEO0lBSTNELE1BQU0sVUFBVSxHQUNaLDJIQUEySCxDQUFDO0lBYWhJLGlFQUFpRTtJQUNqRTtRQUNFLE9BQU8sQ0FBTyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQ3JELE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxNQUFNLElBQUksZ0NBQW1CLENBQ3pCLGlGQUFpRixDQUFDLENBQUM7YUFDeEY7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRTtnQkFDeEQscUNBQXFDLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3JGO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBZEQsNEJBY0M7SUFFRDs7O09BR0c7SUFDSCxTQUFTLHFDQUFxQyxDQUMxQyxJQUFVLEVBQUUsWUFBb0IsRUFBRSxRQUFnQixFQUFFLE1BQWM7UUFDcEUsTUFB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QUNoQixHQUFHLEVBQUUsU0FBUztvQkFDZCxVQUFVLEVBQUUsT0FBTztpQkFDcEIsQ0FBQzthQUNIO1lBQ0QsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNoQztRQUVELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLDBCQUEwQixFQUFDLENBQUM7SUFDaEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmcsIG5vcm1hbGl6ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge0VtcHR5RXhwciwgVG1wbEFzdEJvdW5kQXR0cmlidXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcblxuaW1wb3J0IHtOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvciwgUmVzb2x2ZWRUZW1wbGF0ZX0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjYW5NaWdyYXRlRmlsZSwgY3JlYXRlTWlncmF0aW9uUHJvZ3JhbX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcblxuaW1wb3J0IHthbmFseXplUmVzb2x2ZWRUZW1wbGF0ZX0gZnJvbSAnLi9hbmFseXplX3RlbXBsYXRlJztcblxudHlwZSBMb2dnZXIgPSBsb2dnaW5nLkxvZ2dlckFwaTtcblxuY29uc3QgUkVBRE1FX1VSTCA9XG4gICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi9tYXN0ZXIvcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvcm91dGVyLWxpbmstZW1wdHktZXhwcmVzc2lvbi9SRUFETUUubWQnO1xuXG5pbnRlcmZhY2UgUmVwbGFjZW1lbnQge1xuICBzdGFydDogbnVtYmVyO1xuICBlbmQ6IG51bWJlcjtcbiAgbmV3Q29udGVudDogc3RyaW5nO1xufVxuaW50ZXJmYWNlIEZpeGVkVGVtcGxhdGUge1xuICBvcmlnaW5hbFRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlO1xuICByZXBsYWNlbWVudHM6IFJlcGxhY2VtZW50W107XG4gIGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zOiBUbXBsQXN0Qm91bmRBdHRyaWJ1dGVbXTtcbn1cblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgUm91dGVyTGluayBlbXB0eSBleHByZXNzaW9uIG1pZ3JhdGlvbi4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGF3YWl0IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcblxuICAgIGlmICghYnVpbGRQYXRocy5sZW5ndGggJiYgIXRlc3RQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IGNoZWNrIHRlbXBsYXRlcyBmb3IgZW1wdHkgcm91dGVyTGlua3MuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgWy4uLmJ1aWxkUGF0aHMsIC4uLnRlc3RQYXRoc10pIHtcbiAgICAgIHJ1bkVtcHR5Um91dGVyTGlua0V4cHJlc3Npb25NaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgY29udGV4dC5sb2dnZXIpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSByb3V0ZXJMaW5rIG1pZ3JhdGlvbiwgY2hhbmdpbmcgcm91dGVyTGluaz1cIlwiIHRvIHJvdXRlckxpbms9XCJbXVwiIGFuZCBub3RpZnlpbmcgZGV2ZWxvcGVyc1xuICogd2hpY2ggdGVtcGxhdGVzIHJlY2VpdmVkIHVwZGF0ZXMuXG4gKi9cbmZ1bmN0aW9uIHJ1bkVtcHR5Um91dGVyTGlua0V4cHJlc3Npb25NaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGxvZ2dlcjogTG9nZ2VyKSB7XG4gIGNvbnN0IHtwcm9ncmFtfSA9IGNyZWF0ZU1pZ3JhdGlvblByb2dyYW0odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCB0ZW1wbGF0ZVZpc2l0b3IgPSBuZXcgTmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9XG4gICAgICBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKHNvdXJjZUZpbGUgPT4gY2FuTWlncmF0ZUZpbGUoYmFzZVBhdGgsIHNvdXJjZUZpbGUsIHByb2dyYW0pKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgSFRNTCB0ZW1wbGF0ZXMuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB0ZW1wbGF0ZVZpc2l0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7cmVzb2x2ZWRUZW1wbGF0ZXN9ID0gdGVtcGxhdGVWaXNpdG9yO1xuICBmaXhFbXB0eVJvdXRlcmxpbmtzKHJlc29sdmVkVGVtcGxhdGVzLCB0cmVlLCBsb2dnZXIpO1xufVxuXG5mdW5jdGlvbiBmaXhFbXB0eVJvdXRlcmxpbmtzKHJlc29sdmVkVGVtcGxhdGVzOiBSZXNvbHZlZFRlbXBsYXRlW10sIHRyZWU6IFRyZWUsIGxvZ2dlcjogTG9nZ2VyKSB7XG4gIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgY29uc3QgY29sbGVjdGVkRml4ZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGZpeGVzQnlGaWxlID0gZ2V0Rml4ZXNCeUZpbGUocmVzb2x2ZWRUZW1wbGF0ZXMpO1xuXG4gIGZvciAoY29uc3QgW2Fic0ZpbGVQYXRoLCB0ZW1wbGF0ZUZpeGVzXSBvZiBmaXhlc0J5RmlsZSkge1xuICAgIGNvbnN0IHRyZWVGaWxlUGF0aCA9IHJlbGF0aXZlKG5vcm1hbGl6ZShiYXNlUGF0aCksIG5vcm1hbGl6ZShhYnNGaWxlUGF0aCkpO1xuICAgIGNvbnN0IG9yaWdpbmFsRmlsZUNvbnRlbnQgPSB0cmVlLnJlYWQodHJlZUZpbGVQYXRoKT8udG9TdHJpbmcoKTtcbiAgICBpZiAob3JpZ2luYWxGaWxlQ29udGVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoXG4gICAgICAgICAgYEZhaWxlZCB0byByZWFkIGZpbGUgY29udGFpbmluZyB0ZW1wbGF0ZTsgY2Fubm90IGFwcGx5IGZpeGVzIGZvciBlbXB0eSByb3V0ZXJMaW5rIGV4cHJlc3Npb25zIGluICR7XG4gICAgICAgICAgICAgIHRyZWVGaWxlUGF0aH0uYCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB1cGRhdGVyID0gdHJlZS5iZWdpblVwZGF0ZSh0cmVlRmlsZVBhdGgpO1xuICAgIGZvciAoY29uc3QgdGVtcGxhdGVGaXggb2YgdGVtcGxhdGVGaXhlcykge1xuICAgICAgLy8gU29ydCBiYWNrd2FyZHMgc28gc3RyaW5nIHJlcGxhY2VtZW50cyBkbyBub3QgY29uZmxpY3RcbiAgICAgIHRlbXBsYXRlRml4LnJlcGxhY2VtZW50cy5zb3J0KChhLCBiKSA9PiBiLnN0YXJ0IC0gYS5zdGFydCk7XG4gICAgICBmb3IgKGNvbnN0IHJlcGxhY2VtZW50IG9mIHRlbXBsYXRlRml4LnJlcGxhY2VtZW50cykge1xuICAgICAgICB1cGRhdGVyLnJlbW92ZShyZXBsYWNlbWVudC5zdGFydCwgcmVwbGFjZW1lbnQuZW5kIC0gcmVwbGFjZW1lbnQuc3RhcnQpO1xuICAgICAgICB1cGRhdGVyLmluc2VydExlZnQocmVwbGFjZW1lbnQuc3RhcnQsIHJlcGxhY2VtZW50Lm5ld0NvbnRlbnQpO1xuICAgICAgfVxuICAgICAgY29uc3QgZGlzcGxheUZpbGVQYXRoID0gbm9ybWFsaXplKHJlbGF0aXZlKGJhc2VQYXRoLCB0ZW1wbGF0ZUZpeC5vcmlnaW5hbFRlbXBsYXRlLmZpbGVQYXRoKSk7XG4gICAgICBmb3IgKGNvbnN0IG4gb2YgdGVtcGxhdGVGaXguZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnMpIHtcbiAgICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICAgdGVtcGxhdGVGaXgub3JpZ2luYWxUZW1wbGF0ZS5nZXRDaGFyYWN0ZXJBbmRMaW5lT2ZQb3NpdGlvbihuLnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0KTtcbiAgICAgICAgY29sbGVjdGVkRml4ZXMucHVzaChgJHtkaXNwbGF5RmlsZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX1gKTtcbiAgICAgIH1cbiAgICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZXIpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb2xsZWN0ZWRGaXhlcy5sZW5ndGggPiAwKSB7XG4gICAgbG9nZ2VyLmluZm8oJy0tLS0gUm91dGVyTGluayBlbXB0eSBhc3NpZ25tZW50IHNjaGVtYXRpYyAtLS0tJyk7XG4gICAgbG9nZ2VyLmluZm8oJ1RoZSBiZWhhdmlvciBvZiBlbXB0eS9gdW5kZWZpbmVkYCBpbnB1dHMgZm9yIGByb3V0ZXJMaW5rYCBoYXMgY2hhbmdlZCcpO1xuICAgIGxvZ2dlci5pbmZvKCdmcm9tIGxpbmtpbmcgdG8gdGhlIGN1cnJlbnQgcGFnZSB0byBpbnN0ZWFkIGNvbXBsZXRlbHkgZGlzYWJsZSB0aGUgbGluay4nKTtcbiAgICBsb2dnZXIuaW5mbyhgUmVhZCBtb3JlIGFib3V0IHRoaXMgY2hhbmdlIGhlcmU6ICR7UkVBRE1FX1VSTH1gKTtcbiAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgbG9nZ2VyLmluZm8oJ1RoZSBmb2xsb3dpbmcgZW1wdHkgYHJvdXRlckxpbmtgIGlucHV0cyB3ZXJlIGZvdW5kIGFuZCBmaXhlZDonKTtcbiAgICBjb2xsZWN0ZWRGaXhlcy5mb3JFYWNoKGZpeCA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmaXh9YCkpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBmaXhlcyBmb3Igbm9kZXMgaW4gdGVtcGxhdGVzIHdoaWNoIGNvbnRhaW4gZW1wdHkgcm91dGVyTGluayBhc3NpZ25tZW50cywgZ3JvdXBlZCBieSBmaWxlLlxuICovXG5mdW5jdGlvbiBnZXRGaXhlc0J5RmlsZSh0ZW1wbGF0ZXM6IFJlc29sdmVkVGVtcGxhdGVbXSk6IE1hcDxzdHJpbmcsIEZpeGVkVGVtcGxhdGVbXT4ge1xuICBjb25zdCBmaXhlc0J5RmlsZSA9IG5ldyBNYXA8c3RyaW5nLCBGaXhlZFRlbXBsYXRlW10+KCk7XG4gIGZvciAoY29uc3QgdGVtcGxhdGUgb2YgdGVtcGxhdGVzKSB7XG4gICAgY29uc3QgdGVtcGxhdGVGaXggPSBmaXhFbXB0eVJvdXRlcmxpbmtzSW5UZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgaWYgKHRlbXBsYXRlRml4ID09PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gdGVtcGxhdGUuZmlsZVBhdGg7XG4gICAgaWYgKGZpeGVzQnlGaWxlLmhhcyhmaWxlKSkge1xuICAgICAgaWYgKHRlbXBsYXRlLmlubGluZSkge1xuICAgICAgICAvLyBFeHRlcm5hbCB0ZW1wbGF0ZXMgbWF5IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMgaW4gdGhlIHByb2plY3RcbiAgICAgICAgLy8gKGUuZy4gaWYgc2hhcmVkIGJldHdlZW4gY29tcG9uZW50cyksIGJ1dCB3ZSBvbmx5IHdhbnQgdG8gcmVjb3JkIHRoZW1cbiAgICAgICAgLy8gb25jZS4gT24gdGhlIG90aGVyIGhhbmQsIGFuIGlubGluZSB0ZW1wbGF0ZSByZXNpZGVzIGluIGEgVFMgZmlsZSB0aGF0XG4gICAgICAgIC8vIG1heSBjb250YWluIG11bHRpcGxlIGlubGluZSB0ZW1wbGF0ZXMuXG4gICAgICAgIGZpeGVzQnlGaWxlLmdldChmaWxlKSEucHVzaCh0ZW1wbGF0ZUZpeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpeGVzQnlGaWxlLnNldChmaWxlLCBbdGVtcGxhdGVGaXhdKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZml4ZXNCeUZpbGU7XG59XG5cbmZ1bmN0aW9uIGZpeEVtcHR5Um91dGVybGlua3NJblRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlKTogRml4ZWRUZW1wbGF0ZXxudWxsIHtcbiAgY29uc3QgZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnMgPSBhbmFseXplUmVzb2x2ZWRUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG5cbiAgaWYgKCFlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9ucyB8fCBlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9ucy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHJlcGxhY2VtZW50czogUmVwbGFjZW1lbnRbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGV4cHIgb2YgZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnMpIHtcbiAgICBsZXQgcmVwbGFjZW1lbnQ6IFJlcGxhY2VtZW50O1xuICAgIGlmIChleHByLnZhbHVlU3Bhbikge1xuICAgICAgcmVwbGFjZW1lbnQgPSB7XG4gICAgICAgIHN0YXJ0OiB0ZW1wbGF0ZS5zdGFydCArIGV4cHIudmFsdWUuc291cmNlU3Bhbi5zdGFydCxcbiAgICAgICAgZW5kOiB0ZW1wbGF0ZS5zdGFydCArIGV4cHIudmFsdWUuc291cmNlU3Bhbi5lbmQsXG4gICAgICAgIG5ld0NvbnRlbnQ6ICdbXScsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzcGFuTGVuZ3RoID0gZXhwci5zb3VyY2VTcGFuLmVuZC5vZmZzZXQgLSBleHByLnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0O1xuICAgICAgLy8gYGV4cHIudmFsdWUuc291cmNlU3Bhbi5zdGFydGAgaXMgdGhlIHN0YXJ0IG9mIHRoZSB2ZXJ5IGJlZ2lubmluZyBvZiB0aGUgYmluZGluZyBzaW5jZSB0aGVyZVxuICAgICAgLy8gaXMgbm8gdmFsdWVcbiAgICAgIGNvbnN0IGVuZE9mRXhwciA9IHRlbXBsYXRlLnN0YXJ0ICsgZXhwci52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0ICsgc3Bhbkxlbmd0aDtcbiAgICAgIHJlcGxhY2VtZW50ID0ge1xuICAgICAgICBzdGFydDogZW5kT2ZFeHByLFxuICAgICAgICBlbmQ6IGVuZE9mRXhwcixcbiAgICAgICAgbmV3Q29udGVudDogJz1cIltdXCInLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmVwbGFjZW1lbnRzLnB1c2gocmVwbGFjZW1lbnQpO1xuICB9XG5cbiAgcmV0dXJuIHtvcmlnaW5hbFRlbXBsYXRlOiB0ZW1wbGF0ZSwgcmVwbGFjZW1lbnRzLCBlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9uc307XG59XG4iXX0=