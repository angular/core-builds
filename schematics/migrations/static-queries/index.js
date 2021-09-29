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
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/load_esm", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", "@angular/core/schematics/migrations/static-queries/strategies/test_strategy/test_strategy", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy", "@angular/core/schematics/migrations/static-queries/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const ts = require("typescript");
    const load_esm_1 = require("@angular/core/schematics/utils/load_esm");
    const ng_component_template_1 = require("@angular/core/schematics/utils/ng_component_template");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const ng_query_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor");
    const template_strategy_1 = require("@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy");
    const test_strategy_1 = require("@angular/core/schematics/migrations/static-queries/strategies/test_strategy/test_strategy");
    const usage_strategy_1 = require("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy");
    const transform_1 = require("@angular/core/schematics/migrations/static-queries/transform");
    var SELECTED_STRATEGY;
    (function (SELECTED_STRATEGY) {
        SELECTED_STRATEGY[SELECTED_STRATEGY["TEMPLATE"] = 0] = "TEMPLATE";
        SELECTED_STRATEGY[SELECTED_STRATEGY["USAGE"] = 1] = "USAGE";
        SELECTED_STRATEGY[SELECTED_STRATEGY["TESTS"] = 2] = "TESTS";
    })(SELECTED_STRATEGY || (SELECTED_STRATEGY = {}));
    /** Entry point for the V8 static-query migration. */
    function default_1() {
        return runMigration;
    }
    exports.default = default_1;
    /** Runs the V8 migration static-query migration for all determined TypeScript projects. */
    function runMigration(tree, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const logger = context.logger;
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate queries ' +
                    'to add static flag.');
            }
            const analyzedFiles = new Set();
            const buildProjects = new Set();
            const failures = [];
            const strategy = process.env['NG_STATIC_QUERY_USAGE_STRATEGY'] === 'true' ?
                SELECTED_STRATEGY.USAGE :
                SELECTED_STRATEGY.TEMPLATE;
            for (const tsconfigPath of buildPaths) {
                const project = analyzeProject(tree, tsconfigPath, basePath, analyzedFiles, logger);
                if (project) {
                    buildProjects.add(project);
                }
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
            if (buildProjects.size) {
                for (let project of Array.from(buildProjects.values())) {
                    failures.push(...yield runStaticQueryMigration(tree, project, strategy, logger, compilerModule));
                }
            }
            // For the "test" tsconfig projects we always want to use the test strategy as
            // we can't detect the proper timing within spec files.
            for (const tsconfigPath of testPaths) {
                const project = yield analyzeProject(tree, tsconfigPath, basePath, analyzedFiles, logger);
                if (project) {
                    failures.push(...yield runStaticQueryMigration(tree, project, SELECTED_STRATEGY.TESTS, logger, compilerModule));
                }
            }
            if (failures.length) {
                logger.info('');
                logger.info('Some queries could not be migrated automatically. Please go');
                logger.info('through these manually and apply the appropriate timing.');
                logger.info('For more info on how to choose a flag, please see: ');
                logger.info('https://v8.angular.io/guide/static-query-migration');
                failures.forEach(failure => logger.warn(`⮑   ${failure}`));
            }
        });
    }
    /**
     * Analyzes the given TypeScript project by looking for queries that need to be
     * migrated. In case there are no queries that can be migrated, null is returned.
     */
    function analyzeProject(tree, tsconfigPath, basePath, analyzedFiles, logger) {
        const { program, host } = (0, compiler_host_1.createMigrationProgram)(tree, tsconfigPath, basePath);
        const syntacticDiagnostics = program.getSyntacticDiagnostics();
        // Syntactic TypeScript errors can throw off the query analysis and therefore we want
        // to notify the developer that we couldn't analyze parts of the project. Developers
        // can just re-run the migration after fixing these failures.
        if (syntacticDiagnostics.length) {
            logger.warn(`\nTypeScript project "${tsconfigPath}" has syntactical errors which could cause ` +
                `an incomplete migration. Please fix the following failures and rerun the migration:`);
            logger.error(ts.formatDiagnostics(syntacticDiagnostics, host));
            logger.info('Migration can be rerun with: "ng update @angular/core --from 7 --to 8 --migrate-only"\n');
        }
        const typeChecker = program.getTypeChecker();
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        const queryVisitor = new ng_query_visitor_1.NgQueryResolveVisitor(typeChecker);
        // Analyze all project source-files and collect all queries that
        // need to be migrated.
        sourceFiles.forEach(sourceFile => {
            const relativePath = (0, path_1.relative)(basePath, sourceFile.fileName);
            // Only look for queries within the current source files if the
            // file has not been analyzed before.
            if (!analyzedFiles.has(relativePath)) {
                analyzedFiles.add(relativePath);
                queryVisitor.visitNode(sourceFile);
            }
        });
        if (queryVisitor.resolvedQueries.size === 0) {
            return null;
        }
        return { program, host, tsconfigPath, typeChecker, basePath, queryVisitor, sourceFiles };
    }
    /**
     * Runs the static query migration for the given project. The schematic analyzes all
     * queries within the project and sets up the query timing based on the current usage
     * of the query property. e.g. a view query that is not used in any lifecycle hook does
     * not need to be static and can be set up with "static: false".
     */
    function runStaticQueryMigration(tree, project, selectedStrategy, logger, compilerModule) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sourceFiles, typeChecker, host, queryVisitor, tsconfigPath, basePath } = project;
            const printer = ts.createPrinter();
            const failureMessages = [];
            const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker);
            // If the "usage" strategy is selected, we also need to add the query visitor
            // to the analysis visitors so that query usage in templates can be also checked.
            if (selectedStrategy === SELECTED_STRATEGY.USAGE) {
                sourceFiles.forEach(s => templateVisitor.visitNode(s));
            }
            const { resolvedQueries, classMetadata } = queryVisitor;
            const { resolvedTemplates } = templateVisitor;
            if (selectedStrategy === SELECTED_STRATEGY.USAGE) {
                // Add all resolved templates to the class metadata if the usage strategy is used. This
                // is necessary in order to be able to check component templates for static query usage.
                resolvedTemplates.forEach(template => {
                    if (classMetadata.has(template.container)) {
                        classMetadata.get(template.container).template = template;
                    }
                });
            }
            let strategy;
            if (selectedStrategy === SELECTED_STRATEGY.USAGE) {
                strategy = new usage_strategy_1.QueryUsageStrategy(classMetadata, typeChecker, compilerModule);
            }
            else if (selectedStrategy === SELECTED_STRATEGY.TESTS) {
                strategy = new test_strategy_1.QueryTestStrategy();
            }
            else {
                strategy = new template_strategy_1.QueryTemplateStrategy(tsconfigPath, classMetadata, host, compilerModule);
            }
            try {
                strategy.setup();
            }
            catch (e) {
                if (selectedStrategy === SELECTED_STRATEGY.TEMPLATE) {
                    logger.warn(`\nThe template migration strategy uses the Angular compiler ` +
                        `internally and therefore projects that no longer build successfully after ` +
                        `the update cannot use the template migration strategy. Please ensure ` +
                        `there are no AOT compilation errors.\n`);
                }
                // In case the strategy could not be set up properly, we just exit the
                // migration. We don't want to throw an exception as this could mean
                // that other migrations are interrupted.
                logger.warn(`Could not setup migration strategy for "${project.tsconfigPath}". The ` +
                    `following error has been reported:\n`);
                logger.error(`${e.toString()}\n`);
                logger.info('Migration can be rerun with: "ng update @angular/core --from 7 --to 8 --migrate-only"\n');
                return [];
            }
            // Walk through all source files that contain resolved queries and update
            // the source files if needed. Note that we need to update multiple queries
            // within a source file within the same recorder in order to not throw off
            // the TypeScript node offsets.
            resolvedQueries.forEach((queries, sourceFile) => {
                const relativePath = (0, path_1.relative)(basePath, sourceFile.fileName);
                const update = tree.beginUpdate(relativePath);
                // Compute the query timing for all resolved queries and update the
                // query definitions to explicitly set the determined query timing.
                queries.forEach(q => {
                    const queryExpr = q.decorator.node.expression;
                    const { timing, message } = strategy.detectTiming(q);
                    const result = (0, transform_1.getTransformedQueryCallExpr)(q, timing, !!message);
                    if (!result) {
                        return;
                    }
                    const newText = printer.printNode(ts.EmitHint.Unspecified, result.node, sourceFile);
                    // Replace the existing query decorator call expression with the updated
                    // call expression node.
                    update.remove(queryExpr.getStart(), queryExpr.getWidth());
                    update.insertRight(queryExpr.getStart(), newText);
                    if (result.failureMessage || message) {
                        const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, q.decorator.node.getStart());
                        failureMessages.push(`${relativePath}@${line + 1}:${character + 1}: ${result.failureMessage || message}`);
                    }
                });
                tree.commitUpdate(update);
            });
            return failureMessages;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdILDJEQUE2RjtJQUM3RiwrQkFBOEI7SUFDOUIsaUNBQWlDO0lBRWpDLHNFQUFtRDtJQUNuRCxnR0FBNkU7SUFDN0Usa0dBQTJFO0lBQzNFLDJGQUE0RjtJQUU1RixrSEFBaUU7SUFDakUseUlBQXVGO0lBQ3ZGLDZIQUEyRTtJQUUzRSxnSUFBOEU7SUFDOUUsNEZBQXdEO0lBRXhELElBQUssaUJBSUo7SUFKRCxXQUFLLGlCQUFpQjtRQUNwQixpRUFBUSxDQUFBO1FBQ1IsMkRBQUssQ0FBQTtRQUNMLDJEQUFLLENBQUE7SUFDUCxDQUFDLEVBSkksaUJBQWlCLEtBQWpCLGlCQUFpQixRQUlyQjtJQVlELHFEQUFxRDtJQUNyRDtRQUNFLE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFGRCw0QkFFQztJQUVELDJGQUEyRjtJQUMzRixTQUFlLFlBQVksQ0FBQyxJQUFVLEVBQUUsT0FBeUI7O1lBQy9ELE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxJQUFBLGdEQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTlCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6QiwyREFBMkQ7b0JBQzNELHFCQUFxQixDQUFDLENBQUM7YUFDNUI7WUFFRCxNQUFNLGFBQWEs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LFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzt3QkFDOUUsZUFBZSxDQUFDLElBQUksQ0FDaEIsR0FBRyxZQUFZLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxjQUFjLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQztxQkFDMUY7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sZUFBZSxDQUFDO1FBQ3pCLENBQUM7S0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmd9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtyZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtsb2FkRXNtTW9kdWxlfSBmcm9tICcuLi8uLi91dGlscy9sb2FkX2VzbSc7XG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2Nhbk1pZ3JhdGVGaWxlLCBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuXG5pbXBvcnQge05nUXVlcnlSZXNvbHZlVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtRdWVyeVRlbXBsYXRlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90ZW1wbGF0ZV9zdHJhdGVneS90ZW1wbGF0ZV9zdHJhdGVneSc7XG5pbXBvcnQge1F1ZXJ5VGVzdFN0cmF0ZWd5fSBmcm9tICcuL3N0cmF0ZWdpZXMvdGVzdF9zdHJhdGVneS90ZXN0X3N0cmF0ZWd5JztcbmltcG9ydCB7VGltaW5nU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90aW1pbmctc3RyYXRlZ3knO1xuaW1wb3J0IHtRdWVyeVVzYWdlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy91c2FnZV9zdHJhdGVneS91c2FnZV9zdHJhdGVneSc7XG5pbXBvcnQge2dldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcn0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuXG5lbnVtIFNFTEVDVEVEX1NUUkFURUdZIHtcbiAgVEVNUExBVEUsXG4gIFVTQUdFLFxuICBURVNUUyxcbn1cblxuaW50ZXJmYWNlIEFuYWx5emVkUHJvamVjdCB7XG4gIHByb2dyYW06IHRzLlByb2dyYW07XG4gIGhvc3Q6IHRzLkNvbXBpbGVySG9zdDtcbiAgcXVlcnlWaXNpdG9yOiBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3I7XG4gIHNvdXJjZUZpbGVzOiB0cy5Tb3VyY2VGaWxlW107XG4gIGJhc2VQYXRoOiBzdHJpbmc7XG4gIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcjtcbiAgdHNjb25maWdQYXRoOiBzdHJpbmc7XG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFY4IHN0YXRpYy1xdWVyeSBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIHJ1bk1pZ3JhdGlvbjtcbn1cblxuLyoqIFJ1bnMgdGhlIFY4IG1pZ3JhdGlvbiBzdGF0aWMtcXVlcnkgbWlncmF0aW9uIGZvciBhbGwgZGV0ZXJtaW5lZCBUeXBlU2NyaXB0IHByb2plY3RzLiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuTWlncmF0aW9uKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpIHtcbiAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBhd2FpdCBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcblxuICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgcXVlcmllcyAnICtcbiAgICAgICAgJ3RvIGFkZCBzdGF0aWMgZmxhZy4nKTtcbiAgfVxuXG4gIGNvbnN0IGFuYWx5emVkRmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgYnVpbGRQcm9qZWN0cyA9IG5ldyBTZXQ8QW5hbHl6ZWRQcm9qZWN0PigpO1xuICBjb25zdCBmYWlsdXJlcyA9IFtdO1xuICBjb25zdCBzdHJhdGVneSA9IHByb2Nlc3MuZW52WydOR19TVEFUSUNfUVVFUllfVVNBR0VfU1RSQVRFR1knXSA9PT0gJ3RydWUnID9cbiAgICAgIFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFIDpcbiAgICAgIFNFTEVDVEVEX1NUUkFURUdZLlRFTVBMQVRFO1xuXG4gIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGJ1aWxkUGF0aHMpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gYW5hbHl6ZVByb2plY3QodHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgYW5hbHl6ZWRGaWxlcywgbG9nZ2VyKTtcbiAgICBpZiAocHJvamVjdCkge1xuICAgICAgYnVpbGRQcm9qZWN0cy5hZGQocHJvamVjdCk7XG4gICAgfVxuICB9XG5cbiAgbGV0IGNvbXBpbGVyTW9kdWxlO1xuICB0cnkge1xuICAgIC8vIExvYWQgRVNNIGBAYW5ndWxhci9jb21waWxlcmAgdXNpbmcgdGhlIFR5cGVTY3JpcHQgZHluYW1pYyBpbXBvcnQgd29ya2Fyb3VuZC5cbiAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAgIC8vIGNoYW5nZWQgdG8gYSBkaXJlY3QgZHluYW1pYyBpbXBvcnQuXG4gICAgY29tcGlsZXJNb2R1bGUgPSBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJyk+KCdAYW5ndWxhci9jb21waWxlcicpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgIGBVbmFibGUgdG8gbG9hZCB0aGUgJ0Bhbmd1bGFyL2NvbXBpbGVyJyBwYWNrYWdlLiBEZXRhaWxzOiAke2UubWVzc2FnZX1gKTtcbiAgfVxuXG4gIGlmIChidWlsZFByb2plY3RzLnNpemUpIHtcbiAgICBmb3IgKGxldCBwcm9qZWN0IG9mIEFycmF5LmZyb20oYnVpbGRQcm9qZWN0cy52YWx1ZXMoKSkpIHtcbiAgICAgIGZhaWx1cmVzLnB1c2goXG4gICAgICAgICAgLi4uYXdhaXQgcnVuU3RhdGljUXVlcnlNaWdyYXRpb24odHJlZSwgcHJvamVjdCwgc3RyYXRlZ3ksIGxvZ2dlciwgY29tcGlsZXJNb2R1bGUpKTtcbiAgICB9XG4gIH1cblxuICAvLyBGb3IgdGhlIFwidGVzdFwiIHRzY29uZmlnIHByb2plY3RzIHdlIGFsd2F5cyB3YW50IHRvIHVzZSB0aGUgdGVzdCBzdHJhdGVneSBhc1xuICAvLyB3ZSBjYW4ndCBkZXRlY3QgdGhlIHByb3BlciB0aW1pbmcgd2l0aGluIHNwZWMgZmlsZXMuXG4gIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIHRlc3RQYXRocykge1xuICAgIGNvbnN0IHByb2plY3QgPSBhd2FpdCBhbmFseXplUHJvamVjdCh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBhbmFseXplZEZpbGVzLCBsb2dnZXIpO1xuICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLmF3YWl0IHJ1blN0YXRpY1F1ZXJ5TWlncmF0aW9uKFxuICAgICAgICAgIHRyZWUsIHByb2plY3QsIFNFTEVDVEVEX1NUUkFURUdZLlRFU1RTLCBsb2dnZXIsIGNvbXBpbGVyTW9kdWxlKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICBsb2dnZXIuaW5mbygnU29tZSBxdWVyaWVzIGNvdWxkIG5vdCBiZSBtaWdyYXRlZCBhdXRvbWF0aWNhbGx5LiBQbGVhc2UgZ28nKTtcbiAgICBsb2dnZXIuaW5mbygndGhyb3VnaCB0aGVzZSBtYW51YWxseSBhbmQgYXBwbHkgdGhlIGFwcHJvcHJpYXRlIHRpbWluZy4nKTtcbiAgICBsb2dnZXIuaW5mbygnRm9yIG1vcmUgaW5mbyBvbiBob3cgdG8gY2hvb3NlIGEgZmxhZywgcGxlYXNlIHNlZTogJyk7XG4gICAgbG9nZ2VyLmluZm8oJ2h0dHBzOi8vdjguYW5ndWxhci5pby9ndWlkZS9zdGF0aWMtcXVlcnktbWlncmF0aW9uJyk7XG4gICAgZmFpbHVyZXMuZm9yRWFjaChmYWlsdXJlID0+IGxvZ2dlci53YXJuKGDirpEgICAke2ZhaWx1cmV9YCkpO1xuICB9XG59XG5cbi8qKlxuICogQW5hbHl6ZXMgdGhlIGdpdmVuIFR5cGVTY3JpcHQgcHJvamVjdCBieSBsb29raW5nIGZvciBxdWVyaWVzIHRoYXQgbmVlZCB0byBiZVxuICogbWlncmF0ZWQuIEluIGNhc2UgdGhlcmUgYXJlIG5vIHF1ZXJpZXMgdGhhdCBjYW4gYmUgbWlncmF0ZWQsIG51bGwgaXMgcmV0dXJuZWQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQcm9qZWN0KFxuICAgIHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nLCBhbmFseXplZEZpbGVzOiBTZXQ8c3RyaW5nPixcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpKTogQW5hbHl6ZWRQcm9qZWN0fG51bGwge1xuICBjb25zdCB7cHJvZ3JhbSwgaG9zdH0gPSBjcmVhdGVNaWdyYXRpb25Qcm9ncmFtKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICBjb25zdCBzeW50YWN0aWNEaWFnbm9zdGljcyA9IHByb2dyYW0uZ2V0U3ludGFjdGljRGlhZ25vc3RpY3MoKTtcblxuICAvLyBTeW50YWN0aWMgVHlwZVNjcmlwdCBlcnJvcnMgY2FuIHRocm93IG9mZiB0aGUgcXVlcnkgYW5hbHlzaXMgYW5kIHRoZXJlZm9yZSB3ZSB3YW50XG4gIC8vIHRvIG5vdGlmeSB0aGUgZGV2ZWxvcGVyIHRoYXQgd2UgY291bGRuJ3QgYW5hbHl6ZSBwYXJ0cyBvZiB0aGUgcHJvamVjdC4gRGV2ZWxvcGVyc1xuICAvLyBjYW4ganVzdCByZS1ydW4gdGhlIG1pZ3JhdGlvbiBhZnRlciBmaXhpbmcgdGhlc2UgZmFpbHVyZXMuXG4gIGlmIChzeW50YWN0aWNEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICBsb2dnZXIud2FybihcbiAgICAgICAgYFxcblR5cGVTY3JpcHQgcHJvamVjdCBcIiR7dHNjb25maWdQYXRofVwiIGhhcyBzeW50YWN0aWNhbCBlcnJvcnMgd2hpY2ggY291bGQgY2F1c2UgYCArXG4gICAgICAgIGBhbiBpbmNvbXBsZXRlIG1pZ3JhdGlvbi4gUGxlYXNlIGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uOmApO1xuICAgIGxvZ2dlci5lcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhzeW50YWN0aWNEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgIGxvZ2dlci5pbmZvKFxuICAgICAgICAnTWlncmF0aW9uIGNhbiBiZSByZXJ1biB3aXRoOiBcIm5nIHVwZGF0ZSBAYW5ndWxhci9jb3JlIC0tZnJvbSA3IC0tdG8gOCAtLW1pZ3JhdGUtb25seVwiXFxuJyk7XG4gIH1cblxuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG4gIGNvbnN0IHF1ZXJ5VmlzaXRvciA9IG5ldyBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuXG4gIC8vIEFuYWx5emUgYWxsIHByb2plY3Qgc291cmNlLWZpbGVzIGFuZCBjb2xsZWN0IGFsbCBxdWVyaWVzIHRoYXRcbiAgLy8gbmVlZCB0byBiZSBtaWdyYXRlZC5cbiAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSk7XG5cbiAgICAvLyBPbmx5IGxvb2sgZm9yIHF1ZXJpZXMgd2l0aGluIHRoZSBjdXJyZW50IHNvdXJjZSBmaWxlcyBpZiB0aGVcbiAgICAvLyBmaWxlIGhhcyBub3QgYmVlbiBhbmFseXplZCBiZWZvcmUuXG4gICAgaWYgKCFhbmFseXplZEZpbGVzLmhhcyhyZWxhdGl2ZVBhdGgpKSB7XG4gICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgICAgcXVlcnlWaXNpdG9yLnZpc2l0Tm9kZShzb3VyY2VGaWxlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChxdWVyeVZpc2l0b3IucmVzb2x2ZWRRdWVyaWVzLnNpemUgPT09IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7cHJvZ3JhbSwgaG9zdCwgdHNjb25maWdQYXRoLCB0eXBlQ2hlY2tlciwgYmFzZVBhdGgsIHF1ZXJ5VmlzaXRvciwgc291cmNlRmlsZXN9O1xufVxuXG4vKipcbiAqIFJ1bnMgdGhlIHN0YXRpYyBxdWVyeSBtaWdyYXRpb24gZm9yIHRoZSBnaXZlbiBwcm9qZWN0LiBUaGUgc2NoZW1hdGljIGFuYWx5emVzIGFsbFxuICogcXVlcmllcyB3aXRoaW4gdGhlIHByb2plY3QgYW5kIHNldHMgdXAgdGhlIHF1ZXJ5IHRpbWluZyBiYXNlZCBvbiB0aGUgY3VycmVudCB1c2FnZVxuICogb2YgdGhlIHF1ZXJ5IHByb3BlcnR5LiBlLmcuIGEgdmlldyBxdWVyeSB0aGF0IGlzIG5vdCB1c2VkIGluIGFueSBsaWZlY3ljbGUgaG9vayBkb2VzXG4gKiBub3QgbmVlZCB0byBiZSBzdGF0aWMgYW5kIGNhbiBiZSBzZXQgdXAgd2l0aCBcInN0YXRpYzogZmFsc2VcIi5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuU3RhdGljUXVlcnlNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgcHJvamVjdDogQW5hbHl6ZWRQcm9qZWN0LCBzZWxlY3RlZFN0cmF0ZWd5OiBTRUxFQ1RFRF9TVFJBVEVHWSxcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuICAgIGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCB7c291cmNlRmlsZXMsIHR5cGVDaGVja2VyLCBob3N0LCBxdWVyeVZpc2l0b3IsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGh9ID0gcHJvamVjdDtcbiAgY29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcbiAgY29uc3QgZmFpbHVyZU1lc3NhZ2VzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCB0ZW1wbGF0ZVZpc2l0b3IgPSBuZXcgTmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuXG4gIC8vIElmIHRoZSBcInVzYWdlXCIgc3RyYXRlZ3kgaXMgc2VsZWN0ZWQsIHdlIGFsc28gbmVlZCB0byBhZGQgdGhlIHF1ZXJ5IHZpc2l0b3JcbiAgLy8gdG8gdGhlIGFuYWx5c2lzIHZpc2l0b3JzIHNvIHRoYXQgcXVlcnkgdXNhZ2UgaW4gdGVtcGxhdGVzIGNhbiBiZSBhbHNvIGNoZWNrZWQuXG4gIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSkge1xuICAgIHNvdXJjZUZpbGVzLmZvckVhY2gocyA9PiB0ZW1wbGF0ZVZpc2l0b3IudmlzaXROb2RlKHMpKTtcbiAgfVxuXG4gIGNvbnN0IHtyZXNvbHZlZFF1ZXJpZXMsIGNsYXNzTWV0YWRhdGF9ID0gcXVlcnlWaXNpdG9yO1xuICBjb25zdCB7cmVzb2x2ZWRUZW1wbGF0ZXN9ID0gdGVtcGxhdGVWaXNpdG9yO1xuXG4gIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSkge1xuICAgIC8vIEFkZCBhbGwgcmVzb2x2ZWQgdGVtcGxhdGVzIHRvIHRoZSBjbGFzcyBtZXRhZGF0YSBpZiB0aGUgdXNhZ2Ugc3RyYXRlZ3kgaXMgdXNlZC4gVGhpc1xuICAgIC8vIGlzIG5lY2Vzc2FyeSBpbiBvcmRlciB0byBiZSBhYmxlIHRvIGNoZWNrIGNvbXBvbmVudCB0ZW1wbGF0ZXMgZm9yIHN0YXRpYyBxdWVyeSB1c2FnZS5cbiAgICByZXNvbHZlZFRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHtcbiAgICAgIGlmIChjbGFzc01ldGFkYXRhLmhhcyh0ZW1wbGF0ZS5jb250YWluZXIpKSB7XG4gICAgICAgIGNsYXNzTWV0YWRhdGEuZ2V0KHRlbXBsYXRlLmNvbnRhaW5lcikhLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBsZXQgc3RyYXRlZ3k6IFRpbWluZ1N0cmF0ZWd5O1xuICBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVVNBR0UpIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVVzYWdlU3RyYXRlZ3koY2xhc3NNZXRhZGF0YSwgdHlwZUNoZWNrZXIsIGNvbXBpbGVyTW9kdWxlKTtcbiAgfSBlbHNlIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5URVNUUykge1xuICAgIHN0cmF0ZWd5ID0gbmV3IFF1ZXJ5VGVzdFN0cmF0ZWd5KCk7XG4gIH0gZWxzZSB7XG4gICAgc3RyYXRlZ3kgPSBuZXcgUXVlcnlUZW1wbGF0ZVN0cmF0ZWd5KHRzY29uZmlnUGF0aCwgY2xhc3NNZXRhZGF0YSwgaG9zdCwgY29tcGlsZXJNb2R1bGUpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBzdHJhdGVneS5zZXR1cCgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlRFTVBMQVRFKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICBgXFxuVGhlIHRlbXBsYXRlIG1pZ3JhdGlvbiBzdHJhdGVneSB1c2VzIHRoZSBBbmd1bGFyIGNvbXBpbGVyIGAgK1xuICAgICAgICAgIGBpbnRlcm5hbGx5IGFuZCB0aGVyZWZvcmUgcHJvamVjdHMgdGhhdCBubyBsb25nZXIgYnVpbGQgc3VjY2Vzc2Z1bGx5IGFmdGVyIGAgK1xuICAgICAgICAgIGB0aGUgdXBkYXRlIGNhbm5vdCB1c2UgdGhlIHRlbXBsYXRlIG1pZ3JhdGlvbiBzdHJhdGVneS4gUGxlYXNlIGVuc3VyZSBgICtcbiAgICAgICAgICBgdGhlcmUgYXJlIG5vIEFPVCBjb21waWxhdGlvbiBlcnJvcnMuXFxuYCk7XG4gICAgfVxuICAgIC8vIEluIGNhc2UgdGhlIHN0cmF0ZWd5IGNvdWxkIG5vdCBiZSBzZXQgdXAgcHJvcGVybHksIHdlIGp1c3QgZXhpdCB0aGVcbiAgICAvLyBtaWdyYXRpb24uIFdlIGRvbid0IHdhbnQgdG8gdGhyb3cgYW4gZXhjZXB0aW9uIGFzIHRoaXMgY291bGQgbWVhblxuICAgIC8vIHRoYXQgb3RoZXIgbWlncmF0aW9ucyBhcmUgaW50ZXJydXB0ZWQuXG4gICAgbG9nZ2VyLndhcm4oXG4gICAgICAgIGBDb3VsZCBub3Qgc2V0dXAgbWlncmF0aW9uIHN0cmF0ZWd5IGZvciBcIiR7cHJvamVjdC50c2NvbmZpZ1BhdGh9XCIuIFRoZSBgICtcbiAgICAgICAgYGZvbGxvd2luZyBlcnJvciBoYXMgYmVlbiByZXBvcnRlZDpcXG5gKTtcbiAgICBsb2dnZXIuZXJyb3IoYCR7ZS50b1N0cmluZygpfVxcbmApO1xuICAgIGxvZ2dlci5pbmZvKFxuICAgICAgICAnTWlncmF0aW9uIGNhbiBiZSByZXJ1biB3aXRoOiBcIm5nIHVwZGF0ZSBAYW5ndWxhci9jb3JlIC0tZnJvbSA3IC0tdG8gOCAtLW1pZ3JhdGUtb25seVwiXFxuJyk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gV2FsayB0aHJvdWdoIGFsbCBzb3VyY2UgZmlsZXMgdGhhdCBjb250YWluIHJlc29sdmVkIHF1ZXJpZXMgYW5kIHVwZGF0ZVxuICAvLyB0aGUgc291cmNlIGZpbGVzIGlmIG5lZWRlZC4gTm90ZSB0aGF0IHdlIG5lZWQgdG8gdXBkYXRlIG11bHRpcGxlIHF1ZXJpZXNcbiAgLy8gd2l0aGluIGEgc291cmNlIGZpbGUgd2l0aGluIHRoZSBzYW1lIHJlY29yZGVyIGluIG9yZGVyIHRvIG5vdCB0aHJvdyBvZmZcbiAgLy8gdGhlIFR5cGVTY3JpcHQgbm9kZSBvZmZzZXRzLlxuICByZXNvbHZlZFF1ZXJpZXMuZm9yRWFjaCgocXVlcmllcywgc291cmNlRmlsZSkgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlUGF0aCk7XG5cbiAgICAvLyBDb21wdXRlIHRoZSBxdWVyeSB0aW1pbmcgZm9yIGFsbCByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGUgdGhlXG4gICAgLy8gcXVlcnkgZGVmaW5pdGlvbnMgdG8gZXhwbGljaXRseSBzZXQgdGhlIGRldGVybWluZWQgcXVlcnkgdGltaW5nLlxuICAgIHF1ZXJpZXMuZm9yRWFjaChxID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5RXhwciA9IHEuZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcbiAgICAgIGNvbnN0IHt0aW1pbmcsIG1lc3NhZ2V9ID0gc3RyYXRlZ3kuZGV0ZWN0VGltaW5nKHEpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByKHEsIHRpbWluZywgISFtZXNzYWdlKTtcblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdUZXh0ID0gcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHJlc3VsdC5ub2RlLCBzb3VyY2VGaWxlKTtcblxuICAgICAgLy8gUmVwbGFjZSB0aGUgZXhpc3RpbmcgcXVlcnkgZGVjb3JhdG9yIGNhbGwgZXhwcmVzc2lvbiB3aXRoIHRoZSB1cGRhdGVkXG4gICAgICAvLyBjYWxsIGV4cHJlc3Npb24gbm9kZS5cbiAgICAgIHVwZGF0ZS5yZW1vdmUocXVlcnlFeHByLmdldFN0YXJ0KCksIHF1ZXJ5RXhwci5nZXRXaWR0aCgpKTtcbiAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChxdWVyeUV4cHIuZ2V0U3RhcnQoKSwgbmV3VGV4dCk7XG5cbiAgICAgIGlmIChyZXN1bHQuZmFpbHVyZU1lc3NhZ2UgfHwgbWVzc2FnZSkge1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihzb3VyY2VGaWxlLCBxLmRlY29yYXRvci5ub2RlLmdldFN0YXJ0KCkpO1xuICAgICAgICBmYWlsdXJlTWVzc2FnZXMucHVzaChcbiAgICAgICAgICAgIGAke3JlbGF0aXZlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfTogJHtyZXN1bHQuZmFpbHVyZU1lc3NhZ2UgfHwgbWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gIH0pO1xuXG4gIHJldHVybiBmYWlsdXJlTWVzc2FnZXM7XG59XG4iXX0=