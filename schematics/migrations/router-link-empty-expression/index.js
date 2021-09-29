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
        const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9yb3V0ZXItbGluay1lbXB0eS1leHByZXNzaW9uL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0NBQXdEO0lBQ3hELDJEQUE2RjtJQUU3RiwrQkFBOEI7SUFDOUIsc0VBQW1EO0lBRW5ELGdHQUErRjtJQUMvRixrR0FBMkU7SUFDM0UsMkZBQTRGO0lBRTVGLHdIQUEyRDtJQUkzRCxNQUFNLFVBQVUsR0FDWiwySEFBMkgsQ0FBQztJQWFoSSxpRUFBaUU7SUFDakU7UUFDRSxPQUFPLENBQU8sSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUNyRCxNQUFNLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBQyxHQUFHLE1BQU0sSUFBQSxnREFBdUIsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUNwRSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxNQUFNLElBQUksZ0NBQW1CLENBQ3pCLGlGQUFpRixDQUFDLENBQUM7YUFDeEY7WUFFRCxJQUFJLGNBQWMsQ0FBQztZQUNuQixJQUFJO2dCQUNGLCtFQUErRTtnQkFDL0UseUZBQXlGO2dCQUN6RixzQ0FBc0M7Z0JBQ3RDLGNBQWMsR0FBRyxNQUFNLElBQUEsd0JBQWEsRUFBcUMsbUJBQW1CLENBQUMsQ0FBQzthQUMvRjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsNERBQTRELENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2FBQzlFO1lBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxDQUFDLEdBQUcsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hELHFDQUFxQyxDQUNqQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQ25FO1FBQ0gsQ0FBQyxDQUFBLENBQUM7SUFDSixDQUFDO0lBMUJELDRCQTBCQztJQUVEOzs7T0FHRztJQUNILFNBQVMscUNBQXFDLENBQzFDLElBQVUsRUFBRSxZQUFvQixFQUFFLFFBQWdCLEVBQUUsTUFBYyxFQUNsRSxjQUFrRDtRQUNwRCxNQUFNLEVBQUMsT0FBTyxFQUFDLEdBQUcsSUFBQSxzQ0FBc0IsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUM3QyxNQUFNLGVBQWUsR0FBRyxJQUFJLGtEQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sV0FBVyxHQUNiLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDhCQUFjLEVBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRWpHLG9EQUFvRDtRQUNwRCxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRXpFLE1BQU0sRUFBQyxpQkFBaUIsRUFBQyxHQUFHLGVBQWUsQ0FBQztRQUM1QyxtQkFBbUIsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxTQUFTLG1CQUFtQixDQUN4QixpQkFBcUMsRUFBRSxJQUFVLEVBQUUsTUFBYyxFQUNqRSxjQUFrRDs7UUFDcEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQy9CLE1BQU0sY0FBYyxHQUFhLEVBQUUsQ0FBQztRQUNwQyxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFdEUsS0FBSyxNQUFNLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxJQUFJLFdBQVcsRUFBRTtZQUN0RCxNQUFNLFlBQVksR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFBLGdCQUFTLEVBQUMsUUFBUSxDQUFDLEVBQUUsSUFBQSxnQkFBUyxFQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDM0UsTUFBTSxtQkFBbUIsR0FBRyxNQUFBLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLDBDQUFFLFFBQVEsRUFBRSxDQUFDO1lBQ2hFLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFO2dCQUNyQyxNQUFNLENBQUMsS0FBSyxDQUNSLG1HQUNJLFlBQVksR0FBRyxDQUFDLENBQUM7Z0JBQ3pCLFNBQVM7YUFDVjtZQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0MsS0FBSyxNQUFNLFdBQVcsSUFBSSxhQUFhLEVBQUU7Z0JBQ3ZDLHdEQUF3RDtnQkFDeEQsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0QsS0FBSyxNQUFNLFdBQVcsSUFBSSxXQUFXLENBQUMsWUFBWSxFQUFFO29CQUNsRCxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLEdBQUcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3ZFLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQy9EO2dCQUNELE1BQU0sZUFBZSxHQUFHLElBQUEsZ0JBQVMsRUFBQyxJQUFBLGVBQVEsRUFBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzdGLEtBQUssTUFBTSxDQUFDLElBQUksV0FBVyxDQUFDLDBCQUEwQixFQUFFO29CQUN0RCxNQUFNLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxHQUNuQixXQUFXLENBQUMsZ0JBQWdCLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzFGLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDeEU7Z0JBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUM1QjtTQUNGO1FBRUQsSUFBSSxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLGlEQUFpRCxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLElBQUksQ0FBQyx1RUFBdUUsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxJQUFJLENBQUMsMEVBQTBFLENBQUMsQ0FBQztZQUN4RixNQUFNLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDaEIsTUFBTSxDQUFDLElBQUksQ0FBQywrREFBK0QsQ0FBQyxDQUFDO1lBQzdFLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQzFEO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUyxjQUFjLENBQ25CLFNBQTZCLEVBQzdCLGNBQWtEO1FBQ3BELE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1FBQ3ZELEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFO1lBQ2hDLE1BQU0sV0FBVyxHQUFHLDZCQUE2QixDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM1RSxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7Z0JBQ3hCLFNBQVM7YUFDVjtZQUVELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFDL0IsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN6QixJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7b0JBQ25CLHFFQUFxRTtvQkFDckUsdUVBQXVFO29CQUN2RSx3RUFBd0U7b0JBQ3hFLHlDQUF5QztvQkFDekMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQzFDO2FBQ0Y7aUJBQU07Z0JBQ0wsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2FBQ3RDO1NBQ0Y7UUFFRCxPQUFPLFdBQVcsQ0FBQztJQUNyQixDQUFDO0lBRUQsU0FBUyw2QkFBNkIsQ0FDbEMsUUFBMEIsRUFBRSxjQUFrRDtRQUVoRixNQUFNLDBCQUEwQixHQUFHLElBQUEsMENBQXVCLEVBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRXJGLElBQUksQ0FBQywwQkFBMEIsSUFBSSwwQkFBMEIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzFFLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLFlBQVksR0FBa0IsRUFBRSxDQUFDO1FBQ3ZDLEtBQUssTUFBTSxJQUFJLElBQUksMEJBQTBCLEVBQUU7WUFDN0MsSUFBSSxXQUF3QixDQUFDO1lBQzdCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDbEIsV0FBVyxHQUFHO29CQUNaLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUs7b0JBQ25ELEdBQUcsRUFBRSxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUc7b0JBQy9DLFVBQVUsRUFBRSxJQUFJO2lCQUNqQixDQUFDO2FBQ0g7aUJBQU07Z0JBQ0wsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDN0UsOEZBQThGO2dCQUM5RixjQUFjO2dCQUNkLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQztnQkFDNUUsV0FBVyxHQUFHO29CQUNaLEtBQUssRUFBRSxTQUFTO29CQUNoQixHQUFHLEVBQUUsU0FBUztvQkFDZCxVQUFVLEVBQUUsT0FBTztpQkFDcEIsQ0FBQzthQUNIO1lBQ0QsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNoQztRQUVELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLDBCQUEwQixFQUFDLENBQUM7SUFDaEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmcsIG5vcm1hbGl6ZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgdHlwZSB7VG1wbEFzdEJvdW5kQXR0cmlidXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCB7bG9hZEVzbU1vZHVsZX0gZnJvbSAnLi4vLi4vdXRpbHMvbG9hZF9lc20nO1xuXG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yLCBSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2Nhbk1pZ3JhdGVGaWxlLCBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuXG5pbXBvcnQge2FuYWx5emVSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuL2FuYWx5emVfdGVtcGxhdGUnO1xuXG50eXBlIExvZ2dlciA9IGxvZ2dpbmcuTG9nZ2VyQXBpO1xuXG5jb25zdCBSRUFETUVfVVJMID1cbiAgICAnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iL21hc3Rlci9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9yb3V0ZXItbGluay1lbXB0eS1leHByZXNzaW9uL1JFQURNRS5tZCc7XG5cbmludGVyZmFjZSBSZXBsYWNlbWVudCB7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGVuZDogbnVtYmVyO1xuICBuZXdDb250ZW50OiBzdHJpbmc7XG59XG5pbnRlcmZhY2UgRml4ZWRUZW1wbGF0ZSB7XG4gIG9yaWdpbmFsVGVtcGxhdGU6IFJlc29sdmVkVGVtcGxhdGU7XG4gIHJlcGxhY2VtZW50czogUmVwbGFjZW1lbnRbXTtcbiAgZW1wdHlSb3V0ZXJsaW5rRXhwcmVzc2lvbnM6IFRtcGxBc3RCb3VuZEF0dHJpYnV0ZVtdO1xufVxuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBSb3V0ZXJMaW5rIGVtcHR5IGV4cHJlc3Npb24gbWlncmF0aW9uLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgY2hlY2sgdGVtcGxhdGVzIGZvciBlbXB0eSByb3V0ZXJMaW5rcy4nKTtcbiAgICB9XG5cbiAgICBsZXQgY29tcGlsZXJNb2R1bGU7XG4gICAgdHJ5IHtcbiAgICAgIC8vIExvYWQgRVNNIGBAYW5ndWxhci9jb21waWxlcmAgdXNpbmcgdGhlIFR5cGVTY3JpcHQgZHluYW1pYyBpbXBvcnQgd29ya2Fyb3VuZC5cbiAgICAgIC8vIE9uY2UgVHlwZVNjcmlwdCBwcm92aWRlcyBzdXBwb3J0IGZvciBrZWVwaW5nIHRoZSBkeW5hbWljIGltcG9ydCB0aGlzIHdvcmthcm91bmQgY2FuIGJlXG4gICAgICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICAgICAgY29tcGlsZXJNb2R1bGUgPSBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJyk+KCdAYW5ndWxhci9jb21waWxlcicpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgIGBVbmFibGUgdG8gbG9hZCB0aGUgJ0Bhbmd1bGFyL2NvbXBpbGVyJyBwYWNrYWdlLiBEZXRhaWxzOiAke2UubWVzc2FnZX1gKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBbLi4uYnVpbGRQYXRocywgLi4udGVzdFBhdGhzXSkge1xuICAgICAgcnVuRW1wdHlSb3V0ZXJMaW5rRXhwcmVzc2lvbk1pZ3JhdGlvbihcbiAgICAgICAgICB0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBjb250ZXh0LmxvZ2dlciwgY29tcGlsZXJNb2R1bGUpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSByb3V0ZXJMaW5rIG1pZ3JhdGlvbiwgY2hhbmdpbmcgcm91dGVyTGluaz1cIlwiIHRvIHJvdXRlckxpbms9XCJbXVwiIGFuZCBub3RpZnlpbmcgZGV2ZWxvcGVyc1xuICogd2hpY2ggdGVtcGxhdGVzIHJlY2VpdmVkIHVwZGF0ZXMuXG4gKi9cbmZ1bmN0aW9uIHJ1bkVtcHR5Um91dGVyTGlua0V4cHJlc3Npb25NaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGxvZ2dlcjogTG9nZ2VyLFxuICAgIGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpKSB7XG4gIGNvbnN0IHtwcm9ncmFtfSA9IGNyZWF0ZU1pZ3JhdGlvblByb2dyYW0odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCB0ZW1wbGF0ZVZpc2l0b3IgPSBuZXcgTmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9XG4gICAgICBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKHNvdXJjZUZpbGUgPT4gY2FuTWlncmF0ZUZpbGUoYmFzZVBhdGgsIHNvdXJjZUZpbGUsIHByb2dyYW0pKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgSFRNTCB0ZW1wbGF0ZXMuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB0ZW1wbGF0ZVZpc2l0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7cmVzb2x2ZWRUZW1wbGF0ZXN9ID0gdGVtcGxhdGVWaXNpdG9yO1xuICBmaXhFbXB0eVJvdXRlcmxpbmtzKHJlc29sdmVkVGVtcGxhdGVzLCB0cmVlLCBsb2dnZXIsIGNvbXBpbGVyTW9kdWxlKTtcbn1cblxuZnVuY3Rpb24gZml4RW1wdHlSb3V0ZXJsaW5rcyhcbiAgICByZXNvbHZlZFRlbXBsYXRlczogUmVzb2x2ZWRUZW1wbGF0ZVtdLCB0cmVlOiBUcmVlLCBsb2dnZXI6IExvZ2dlcixcbiAgICBjb21waWxlck1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKSkge1xuICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IGNvbGxlY3RlZEZpeGVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBmaXhlc0J5RmlsZSA9IGdldEZpeGVzQnlGaWxlKHJlc29sdmVkVGVtcGxhdGVzLCBjb21waWxlck1vZHVsZSk7XG5cbiAgZm9yIChjb25zdCBbYWJzRmlsZVBhdGgsIHRlbXBsYXRlRml4ZXNdIG9mIGZpeGVzQnlGaWxlKSB7XG4gICAgY29uc3QgdHJlZUZpbGVQYXRoID0gcmVsYXRpdmUobm9ybWFsaXplKGJhc2VQYXRoKSwgbm9ybWFsaXplKGFic0ZpbGVQYXRoKSk7XG4gICAgY29uc3Qgb3JpZ2luYWxGaWxlQ29udGVudCA9IHRyZWUucmVhZCh0cmVlRmlsZVBhdGgpPy50b1N0cmluZygpO1xuICAgIGlmIChvcmlnaW5hbEZpbGVDb250ZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgRmFpbGVkIHRvIHJlYWQgZmlsZSBjb250YWluaW5nIHRlbXBsYXRlOyBjYW5ub3QgYXBwbHkgZml4ZXMgZm9yIGVtcHR5IHJvdXRlckxpbmsgZXhwcmVzc2lvbnMgaW4gJHtcbiAgICAgICAgICAgICAgdHJlZUZpbGVQYXRofS5gKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHRyZWVGaWxlUGF0aCk7XG4gICAgZm9yIChjb25zdCB0ZW1wbGF0ZUZpeCBvZiB0ZW1wbGF0ZUZpeGVzKSB7XG4gICAgICAvLyBTb3J0IGJhY2t3YXJkcyBzbyBzdHJpbmcgcmVwbGFjZW1lbnRzIGRvIG5vdCBjb25mbGljdFxuICAgICAgdGVtcGxhdGVGaXgucmVwbGFjZW1lbnRzLnNvcnQoKGEsIGIpID0+IGIuc3RhcnQgLSBhLnN0YXJ0KTtcbiAgICAgIGZvciAoY29uc3QgcmVwbGFjZW1lbnQgb2YgdGVtcGxhdGVGaXgucmVwbGFjZW1lbnRzKSB7XG4gICAgICAgIHVwZGF0ZXIucmVtb3ZlKHJlcGxhY2VtZW50LnN0YXJ0LCByZXBsYWNlbWVudC5lbmQgLSByZXBsYWNlbWVudC5zdGFydCk7XG4gICAgICAgIHVwZGF0ZXIuaW5zZXJ0TGVmdChyZXBsYWNlbWVudC5zdGFydCwgcmVwbGFjZW1lbnQubmV3Q29udGVudCk7XG4gICAgICB9XG4gICAgICBjb25zdCBkaXNwbGF5RmlsZVBhdGggPSBub3JtYWxpemUocmVsYXRpdmUoYmFzZVBhdGgsIHRlbXBsYXRlRml4Lm9yaWdpbmFsVGVtcGxhdGUuZmlsZVBhdGgpKTtcbiAgICAgIGZvciAoY29uc3QgbiBvZiB0ZW1wbGF0ZUZpeC5lbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9ucykge1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICB0ZW1wbGF0ZUZpeC5vcmlnaW5hbFRlbXBsYXRlLmdldENoYXJhY3RlckFuZExpbmVPZlBvc2l0aW9uKG4uc291cmNlU3Bhbi5zdGFydC5vZmZzZXQpO1xuICAgICAgICBjb2xsZWN0ZWRGaXhlcy5wdXNoKGAke2Rpc3BsYXlGaWxlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfWApO1xuICAgICAgfVxuICAgICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlcik7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbGxlY3RlZEZpeGVzLmxlbmd0aCA+IDApIHtcbiAgICBsb2dnZXIuaW5mbygnLS0tLSBSb3V0ZXJMaW5rIGVtcHR5IGFzc2lnbm1lbnQgc2NoZW1hdGljIC0tLS0nKTtcbiAgICBsb2dnZXIuaW5mbygnVGhlIGJlaGF2aW9yIG9mIGVtcHR5L2B1bmRlZmluZWRgIGlucHV0cyBmb3IgYHJvdXRlckxpbmtgIGhhcyBjaGFuZ2VkJyk7XG4gICAgbG9nZ2VyLmluZm8oJ2Zyb20gbGlua2luZyB0byB0aGUgY3VycmVudCBwYWdlIHRvIGluc3RlYWQgY29tcGxldGVseSBkaXNhYmxlIHRoZSBsaW5rLicpO1xuICAgIGxvZ2dlci5pbmZvKGBSZWFkIG1vcmUgYWJvdXQgdGhpcyBjaGFuZ2UgaGVyZTogJHtSRUFETUVfVVJMfWApO1xuICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICBsb2dnZXIuaW5mbygnVGhlIGZvbGxvd2luZyBlbXB0eSBgcm91dGVyTGlua2AgaW5wdXRzIHdlcmUgZm91bmQgYW5kIGZpeGVkOicpO1xuICAgIGNvbGxlY3RlZEZpeGVzLmZvckVhY2goZml4ID0+IGxvZ2dlci53YXJuKGDirpEgICAke2ZpeH1gKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGZpeGVzIGZvciBub2RlcyBpbiB0ZW1wbGF0ZXMgd2hpY2ggY29udGFpbiBlbXB0eSByb3V0ZXJMaW5rIGFzc2lnbm1lbnRzLCBncm91cGVkIGJ5IGZpbGUuXG4gKi9cbmZ1bmN0aW9uIGdldEZpeGVzQnlGaWxlKFxuICAgIHRlbXBsYXRlczogUmVzb2x2ZWRUZW1wbGF0ZVtdLFxuICAgIGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpKTogTWFwPHN0cmluZywgRml4ZWRUZW1wbGF0ZVtdPiB7XG4gIGNvbnN0IGZpeGVzQnlGaWxlID0gbmV3IE1hcDxzdHJpbmcsIEZpeGVkVGVtcGxhdGVbXT4oKTtcbiAgZm9yIChjb25zdCB0ZW1wbGF0ZSBvZiB0ZW1wbGF0ZXMpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZUZpeCA9IGZpeEVtcHR5Um91dGVybGlua3NJblRlbXBsYXRlKHRlbXBsYXRlLCBjb21waWxlck1vZHVsZSk7XG4gICAgaWYgKHRlbXBsYXRlRml4ID09PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gdGVtcGxhdGUuZmlsZVBhdGg7XG4gICAgaWYgKGZpeGVzQnlGaWxlLmhhcyhmaWxlKSkge1xuICAgICAgaWYgKHRlbXBsYXRlLmlubGluZSkge1xuICAgICAgICAvLyBFeHRlcm5hbCB0ZW1wbGF0ZXMgbWF5IGJlIHJlZmVyZW5jZWQgbXVsdGlwbGUgdGltZXMgaW4gdGhlIHByb2plY3RcbiAgICAgICAgLy8gKGUuZy4gaWYgc2hhcmVkIGJldHdlZW4gY29tcG9uZW50cyksIGJ1dCB3ZSBvbmx5IHdhbnQgdG8gcmVjb3JkIHRoZW1cbiAgICAgICAgLy8gb25jZS4gT24gdGhlIG90aGVyIGhhbmQsIGFuIGlubGluZSB0ZW1wbGF0ZSByZXNpZGVzIGluIGEgVFMgZmlsZSB0aGF0XG4gICAgICAgIC8vIG1heSBjb250YWluIG11bHRpcGxlIGlubGluZSB0ZW1wbGF0ZXMuXG4gICAgICAgIGZpeGVzQnlGaWxlLmdldChmaWxlKSEucHVzaCh0ZW1wbGF0ZUZpeCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpeGVzQnlGaWxlLnNldChmaWxlLCBbdGVtcGxhdGVGaXhdKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZml4ZXNCeUZpbGU7XG59XG5cbmZ1bmN0aW9uIGZpeEVtcHR5Um91dGVybGlua3NJblRlbXBsYXRlKFxuICAgIHRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlLCBjb21waWxlck1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKSk6IEZpeGVkVGVtcGxhdGV8XG4gICAgbnVsbCB7XG4gIGNvbnN0IGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zID0gYW5hbHl6ZVJlc29sdmVkVGVtcGxhdGUodGVtcGxhdGUsIGNvbXBpbGVyTW9kdWxlKTtcblxuICBpZiAoIWVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zIHx8IGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcmVwbGFjZW1lbnRzOiBSZXBsYWNlbWVudFtdID0gW107XG4gIGZvciAoY29uc3QgZXhwciBvZiBlbXB0eVJvdXRlcmxpbmtFeHByZXNzaW9ucykge1xuICAgIGxldCByZXBsYWNlbWVudDogUmVwbGFjZW1lbnQ7XG4gICAgaWYgKGV4cHIudmFsdWVTcGFuKSB7XG4gICAgICByZXBsYWNlbWVudCA9IHtcbiAgICAgICAgc3RhcnQ6IHRlbXBsYXRlLnN0YXJ0ICsgZXhwci52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0LFxuICAgICAgICBlbmQ6IHRlbXBsYXRlLnN0YXJ0ICsgZXhwci52YWx1ZS5zb3VyY2VTcGFuLmVuZCxcbiAgICAgICAgbmV3Q29udGVudDogJ1tdJyxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNwYW5MZW5ndGggPSBleHByLnNvdXJjZVNwYW4uZW5kLm9mZnNldCAtIGV4cHIuc291cmNlU3Bhbi5zdGFydC5vZmZzZXQ7XG4gICAgICAvLyBgZXhwci52YWx1ZS5zb3VyY2VTcGFuLnN0YXJ0YCBpcyB0aGUgc3RhcnQgb2YgdGhlIHZlcnkgYmVnaW5uaW5nIG9mIHRoZSBiaW5kaW5nIHNpbmNlIHRoZXJlXG4gICAgICAvLyBpcyBubyB2YWx1ZVxuICAgICAgY29uc3QgZW5kT2ZFeHByID0gdGVtcGxhdGUuc3RhcnQgKyBleHByLnZhbHVlLnNvdXJjZVNwYW4uc3RhcnQgKyBzcGFuTGVuZ3RoO1xuICAgICAgcmVwbGFjZW1lbnQgPSB7XG4gICAgICAgIHN0YXJ0OiBlbmRPZkV4cHIsXG4gICAgICAgIGVuZDogZW5kT2ZFeHByLFxuICAgICAgICBuZXdDb250ZW50OiAnPVwiW11cIicsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXBsYWNlbWVudHMucHVzaChyZXBsYWNlbWVudCk7XG4gIH1cblxuICByZXR1cm4ge29yaWdpbmFsVGVtcGxhdGU6IHRlbXBsYXRlLCByZXBsYWNlbWVudHMsIGVtcHR5Um91dGVybGlua0V4cHJlc3Npb25zfTtcbn1cbiJdfQ==