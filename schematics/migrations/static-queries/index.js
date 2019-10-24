/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "rxjs", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", "@angular/core/schematics/migrations/static-queries/strategies/test_strategy/test_strategy", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy", "@angular/core/schematics/migrations/static-queries/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const rxjs_1 = require("rxjs");
    const ts = require("typescript");
    const ng_component_template_1 = require("@angular/core/schematics/utils/ng_component_template");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
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
        return (tree, context) => {
            // We need to cast the returned "Observable" to "any" as there is a
            // RxJS version mismatch that breaks the TS compilation.
            return rxjs_1.from(runMigration(tree, context).then(() => tree));
        };
    }
    exports.default = default_1;
    /** Runs the V8 migration static-query migration for all determined TypeScript projects. */
    function runMigration(tree, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const { buildPaths, testPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const logger = context.logger;
            logger.info('------ Static Query Migration ------');
            logger.info('With Angular version 8, developers need to');
            logger.info('explicitly specify the timing of ViewChild and');
            logger.info('ContentChild queries. Read more about this here:');
            logger.info('https://v8.angular.io/guide/static-query-migration');
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
            if (buildProjects.size) {
                for (let project of Array.from(buildProjects.values())) {
                    failures.push(...yield runStaticQueryMigration(tree, project, strategy, logger));
                }
            }
            // For the "test" tsconfig projects we always want to use the test strategy as
            // we can't detect the proper timing within spec files.
            for (const tsconfigPath of testPaths) {
                const project = yield analyzeProject(tree, tsconfigPath, basePath, analyzedFiles, logger);
                if (project) {
                    failures.push(...yield runStaticQueryMigration(tree, project, SELECTED_STRATEGY.TESTS, logger));
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
            logger.info('------------------------------------------------');
        });
    }
    /**
     * Analyzes the given TypeScript project by looking for queries that need to be
     * migrated. In case there are no queries that can be migrated, null is returned.
     */
    function analyzeProject(tree, tsconfigPath, basePath, analyzedFiles, logger) {
        const parsed = parse_tsconfig_1.parseTsconfigFile(tsconfigPath, path_1.dirname(tsconfigPath));
        const host = compiler_host_1.createMigrationCompilerHost(tree, parsed.options, basePath);
        const program = ts.createProgram(parsed.fileNames, parsed.options, host);
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
        const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile && !program.isSourceFileFromExternalLibrary(f));
        const queryVisitor = new ng_query_visitor_1.NgQueryResolveVisitor(typeChecker);
        // Analyze all project source-files and collect all queries that
        // need to be migrated.
        sourceFiles.forEach(sourceFile => {
            const relativePath = path_1.relative(basePath, sourceFile.fileName);
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
    function runStaticQueryMigration(tree, project, selectedStrategy, logger) {
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
                strategy = new usage_strategy_1.QueryUsageStrategy(classMetadata, typeChecker);
            }
            else if (selectedStrategy === SELECTED_STRATEGY.TESTS) {
                strategy = new test_strategy_1.QueryTestStrategy();
            }
            else {
                strategy = new template_strategy_1.QueryTemplateStrategy(tsconfigPath, classMetadata, host);
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
                const relativePath = path_1.relative(basePath, sourceFile.fileName);
                const update = tree.beginUpdate(relativePath);
                // Compute the query timing for all resolved queries and update the
                // query definitions to explicitly set the determined query timing.
                queries.forEach(q => {
                    const queryExpr = q.decorator.node.expression;
                    const { timing, message } = strategy.detectTiming(q);
                    const result = transform_1.getTransformedQueryCallExpr(q, timing, !!message);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdILDJEQUE2RjtJQUM3RiwrQkFBdUM7SUFDdkMsK0JBQTBCO0lBQzFCLGlDQUFpQztJQUVqQyxnR0FBNkU7SUFDN0Usa0dBQTJFO0lBQzNFLDJGQUFpRjtJQUNqRiw2RkFBd0U7SUFFeEUsa0hBQWlFO0lBQ2pFLHlJQUF1RjtJQUN2Riw2SEFBMkU7SUFFM0UsZ0lBQThFO0lBQzlFLDRGQUF3RDtJQUV4RCxJQUFLLGlCQUlKO0lBSkQsV0FBSyxpQkFBaUI7UUFDcEIsaUVBQVEsQ0FBQTtRQUNSLDJEQUFLLENBQUE7UUFDTCwyREFBSyxDQUFBO0lBQ1AsQ0FBQyxFQUpJLGlCQUFpQixLQUFqQixpQkFBaUIsUUFJckI7SUFZRCxxREFBcUQ7SUFDckQ7UUFDRSxPQUFPLENBQUMsSUFBVSxFQUFFLE9BQXlCLEVBQUUsRUFBRTtZQUMvQyxtRUFBbUU7WUFDbkUsd0RBQXdEO1lBQ3hELE9BQU8sV0FBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFRLENBQUM7UUFDbkUsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQU5ELDRCQU1DO0lBRUQsMkZBQTJGO0lBQzNGLFNBQWUsWUFBWSxDQUFDLElBQVUsRUFBRSxPQUF5Qjs7WUFDL0QsTUFBTSxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxNQUFNLEdB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b0JBRXBGLHdFQUF3RTtvQkFDeEUsd0JBQXdCO29CQUN4QixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBRWxELElBQUksTUFBTSxDQUFDLGNBQWMsSUFBSSxPQUFPLEVBQUU7d0JBQ3BDLE1BQU0sRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDLEdBQ25CLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzt3QkFDOUUsZUFBZSxDQUFDLElBQUksQ0FDaEIsR0FBRyxZQUFZLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxjQUFjLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQztxQkFDMUY7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sZUFBZSxDQUFDO1FBQ3pCLENBQUM7S0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtmcm9tfSBmcm9tICdyeGpzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2NyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcGFyc2VfdHNjb25maWcnO1xuXG5pbXBvcnQge05nUXVlcnlSZXNvbHZlVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtRdWVyeVRlbXBsYXRlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90ZW1wbGF0ZV9zdHJhdGVneS90ZW1wbGF0ZV9zdHJhdGVneSc7XG5pbXBvcnQge1F1ZXJ5VGVzdFN0cmF0ZWd5fSBmcm9tICcuL3N0cmF0ZWdpZXMvdGVzdF9zdHJhdGVneS90ZXN0X3N0cmF0ZWd5JztcbmltcG9ydCB7VGltaW5nU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90aW1pbmctc3RyYXRlZ3knO1xuaW1wb3J0IHtRdWVyeVVzYWdlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy91c2FnZV9zdHJhdGVneS91c2FnZV9zdHJhdGVneSc7XG5pbXBvcnQge2dldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcn0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuXG5lbnVtIFNFTEVDVEVEX1NUUkFURUdZIHtcbiAgVEVNUExBVEUsXG4gIFVTQUdFLFxuICBURVNUUyxcbn1cblxuaW50ZXJmYWNlIEFuYWx5emVkUHJvamVjdCB7XG4gIHByb2dyYW06IHRzLlByb2dyYW07XG4gIGhvc3Q6IHRzLkNvbXBpbGVySG9zdDtcbiAgcXVlcnlWaXNpdG9yOiBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3I7XG4gIHNvdXJjZUZpbGVzOiB0cy5Tb3VyY2VGaWxlW107XG4gIGJhc2VQYXRoOiBzdHJpbmc7XG4gIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcjtcbiAgdHNjb25maWdQYXRoOiBzdHJpbmc7XG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFY4IHN0YXRpYy1xdWVyeSBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgLy8gV2UgbmVlZCB0byBjYXN0IHRoZSByZXR1cm5lZCBcIk9ic2VydmFibGVcIiB0byBcImFueVwiIGFzIHRoZXJlIGlzIGFcbiAgICAvLyBSeEpTIHZlcnNpb24gbWlzbWF0Y2ggdGhhdCBicmVha3MgdGhlIFRTIGNvbXBpbGF0aW9uLlxuICAgIHJldHVybiBmcm9tKHJ1bk1pZ3JhdGlvbih0cmVlLCBjb250ZXh0KS50aGVuKCgpID0+IHRyZWUpKSBhcyBhbnk7XG4gIH07XG59XG5cbi8qKiBSdW5zIHRoZSBWOCBtaWdyYXRpb24gc3RhdGljLXF1ZXJ5IG1pZ3JhdGlvbiBmb3IgYWxsIGRldGVybWluZWQgVHlwZVNjcmlwdCBwcm9qZWN0cy4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bk1pZ3JhdGlvbih0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSB7XG4gIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG5cbiAgbG9nZ2VyLmluZm8oJy0tLS0tLSBTdGF0aWMgUXVlcnkgTWlncmF0aW9uIC0tLS0tLScpO1xuICBsb2dnZXIuaW5mbygnV2l0aCBBbmd1bGFyIHZlcnNpb24gOCwgZGV2ZWxvcGVycyBuZWVkIHRvJyk7XG4gIGxvZ2dlci5pbmZvKCdleHBsaWNpdGx5IHNwZWNpZnkgdGhlIHRpbWluZyBvZiBWaWV3Q2hpbGQgYW5kJyk7XG4gIGxvZ2dlci5pbmZvKCdDb250ZW50Q2hpbGQgcXVlcmllcy4gUmVhZCBtb3JlIGFib3V0IHRoaXMgaGVyZTonKTtcbiAgbG9nZ2VyLmluZm8oJ2h0dHBzOi8vdjguYW5ndWxhci5pby9ndWlkZS9zdGF0aWMtcXVlcnktbWlncmF0aW9uJyk7XG5cbiAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBtaWdyYXRlIHF1ZXJpZXMgJyArXG4gICAgICAgICd0byBhZGQgc3RhdGljIGZsYWcuJyk7XG4gIH1cblxuICBjb25zdCBhbmFseXplZEZpbGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGJ1aWxkUHJvamVjdHMgPSBuZXcgU2V0PEFuYWx5emVkUHJvamVjdD4oKTtcbiAgY29uc3QgZmFpbHVyZXMgPSBbXTtcbiAgY29uc3Qgc3RyYXRlZ3kgPSBwcm9jZXNzLmVudlsnTkdfU1RBVElDX1FVRVJZX1VTQUdFX1NUUkFURUdZJ10gPT09ICd0cnVlJyA/XG4gICAgICBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSA6XG4gICAgICBTRUxFQ1RFRF9TVFJBVEVHWS5URU1QTEFURTtcblxuICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBidWlsZFBhdGhzKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGFuYWx5emVQcm9qZWN0KHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGFuYWx5emVkRmlsZXMsIGxvZ2dlcik7XG4gICAgaWYgKHByb2plY3QpIHtcbiAgICAgIGJ1aWxkUHJvamVjdHMuYWRkKHByb2plY3QpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChidWlsZFByb2plY3RzLnNpemUpIHtcbiAgICBmb3IgKGxldCBwcm9qZWN0IG9mIEFycmF5LmZyb20oYnVpbGRQcm9qZWN0cy52YWx1ZXMoKSkpIHtcbiAgICAgIGZhaWx1cmVzLnB1c2goLi4uYXdhaXQgcnVuU3RhdGljUXVlcnlNaWdyYXRpb24odHJlZSwgcHJvamVjdCwgc3RyYXRlZ3ksIGxvZ2dlcikpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEZvciB0aGUgXCJ0ZXN0XCIgdHNjb25maWcgcHJvamVjdHMgd2UgYWx3YXlzIHdhbnQgdG8gdXNlIHRoZSB0ZXN0IHN0cmF0ZWd5IGFzXG4gIC8vIHdlIGNhbid0IGRldGVjdCB0aGUgcHJvcGVyIHRpbWluZyB3aXRoaW4gc3BlYyBmaWxlcy5cbiAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgdGVzdFBhdGhzKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IGFuYWx5emVQcm9qZWN0KHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGFuYWx5emVkRmlsZXMsIGxvZ2dlcik7XG4gICAgaWYgKHByb2plY3QpIHtcbiAgICAgIGZhaWx1cmVzLnB1c2goXG4gICAgICAgICAgLi4uYXdhaXQgcnVuU3RhdGljUXVlcnlNaWdyYXRpb24odHJlZSwgcHJvamVjdCwgU0VMRUNURURfU1RSQVRFR1kuVEVTVFMsIGxvZ2dlcikpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgbG9nZ2VyLmluZm8oJ1NvbWUgcXVlcmllcyBjb3VsZCBub3QgYmUgbWlncmF0ZWQgYXV0b21hdGljYWxseS4gUGxlYXNlIGdvJyk7XG4gICAgbG9nZ2VyLmluZm8oJ3Rocm91Z2ggdGhlc2UgbWFudWFsbHkgYW5kIGFwcGx5IHRoZSBhcHByb3ByaWF0ZSB0aW1pbmcuJyk7XG4gICAgbG9nZ2VyLmluZm8oJ0ZvciBtb3JlIGluZm8gb24gaG93IHRvIGNob29zZSBhIGZsYWcsIHBsZWFzZSBzZWU6ICcpO1xuICAgIGxvZ2dlci5pbmZvKCdodHRwczovL3Y4LmFuZ3VsYXIuaW8vZ3VpZGUvc3RhdGljLXF1ZXJ5LW1pZ3JhdGlvbicpO1xuICAgIGZhaWx1cmVzLmZvckVhY2goZmFpbHVyZSA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmYWlsdXJlfWApKTtcbiAgfVxuXG4gIGxvZ2dlci5pbmZvKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbn1cblxuLyoqXG4gKiBBbmFseXplcyB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBwcm9qZWN0IGJ5IGxvb2tpbmcgZm9yIHF1ZXJpZXMgdGhhdCBuZWVkIHRvIGJlXG4gKiBtaWdyYXRlZC4gSW4gY2FzZSB0aGVyZSBhcmUgbm8gcXVlcmllcyB0aGF0IGNhbiBiZSBtaWdyYXRlZCwgbnVsbCBpcyByZXR1cm5lZC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVByb2plY3QoXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGFuYWx5emVkRmlsZXM6IFNldDxzdHJpbmc+LFxuICAgIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGkpOlxuICAgIEFuYWx5emVkUHJvamVjdHxudWxsIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgICAgIGNvbnN0IGhvc3QgPSBjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3QodHJlZSwgcGFyc2VkLm9wdGlvbnMsIGJhc2VQYXRoKTtcbiAgICAgIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgICAgIGNvbnN0IHN5bnRhY3RpY0RpYWdub3N0aWNzID0gcHJvZ3JhbS5nZXRTeW50YWN0aWNEaWFnbm9zdGljcygpO1xuXG4gICAgICAvLyBTeW50YWN0aWMgVHlwZVNjcmlwdCBlcnJvcnMgY2FuIHRocm93IG9mZiB0aGUgcXVlcnkgYW5hbHlzaXMgYW5kIHRoZXJlZm9yZSB3ZSB3YW50XG4gICAgICAvLyB0byBub3RpZnkgdGhlIGRldmVsb3BlciB0aGF0IHdlIGNvdWxkbid0IGFuYWx5emUgcGFydHMgb2YgdGhlIHByb2plY3QuIERldmVsb3BlcnNcbiAgICAgIC8vIGNhbiBqdXN0IHJlLXJ1biB0aGUgbWlncmF0aW9uIGFmdGVyIGZpeGluZyB0aGVzZSBmYWlsdXJlcy5cbiAgICAgIGlmIChzeW50YWN0aWNEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgICAgICBgXFxuVHlwZVNjcmlwdCBwcm9qZWN0IFwiJHt0c2NvbmZpZ1BhdGh9XCIgaGFzIHN5bnRhY3RpY2FsIGVycm9ycyB3aGljaCBjb3VsZCBjYXVzZSBgICtcbiAgICAgICAgICAgIGBhbiBpbmNvbXBsZXRlIG1pZ3JhdGlvbi4gUGxlYXNlIGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uOmApO1xuICAgICAgICBsb2dnZXIuZXJyb3IodHMuZm9ybWF0RGlhZ25vc3RpY3Moc3ludGFjdGljRGlhZ25vc3RpY3MsIGhvc3QpKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAnTWlncmF0aW9uIGNhbiBiZSByZXJ1biB3aXRoOiBcIm5nIHVwZGF0ZSBAYW5ndWxhci9jb3JlIC0tZnJvbSA3IC0tdG8gOCAtLW1pZ3JhdGUtb25seVwiXFxuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICAgICAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKFxuICAgICAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG4gICAgICBjb25zdCBxdWVyeVZpc2l0b3IgPSBuZXcgTmdRdWVyeVJlc29sdmVWaXNpdG9yKHR5cGVDaGVja2VyKTtcblxuICAgICAgLy8gQW5hbHl6ZSBhbGwgcHJvamVjdCBzb3VyY2UtZmlsZXMgYW5kIGNvbGxlY3QgYWxsIHF1ZXJpZXMgdGhhdFxuICAgICAgLy8gbmVlZCB0byBiZSBtaWdyYXRlZC5cbiAgICAgIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcblxuICAgICAgICAvLyBPbmx5IGxvb2sgZm9yIHF1ZXJpZXMgd2l0aGluIHRoZSBjdXJyZW50IHNvdXJjZSBmaWxlcyBpZiB0aGVcbiAgICAgICAgLy8gZmlsZSBoYXMgbm90IGJlZW4gYW5hbHl6ZWQgYmVmb3JlLlxuICAgICAgICBpZiAoIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgICAgICAgIHF1ZXJ5VmlzaXRvci52aXNpdE5vZGUoc291cmNlRmlsZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAocXVlcnlWaXNpdG9yLnJlc29sdmVkUXVlcmllcy5zaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge3Byb2dyYW0sIGhvc3QsIHRzY29uZmlnUGF0aCwgdHlwZUNoZWNrZXIsIGJhc2VQYXRoLCBxdWVyeVZpc2l0b3IsIHNvdXJjZUZpbGVzfTtcbiAgICB9XG5cbi8qKlxuICogUnVucyB0aGUgc3RhdGljIHF1ZXJ5IG1pZ3JhdGlvbiBmb3IgdGhlIGdpdmVuIHByb2plY3QuIFRoZSBzY2hlbWF0aWMgYW5hbHl6ZXMgYWxsXG4gKiBxdWVyaWVzIHdpdGhpbiB0aGUgcHJvamVjdCBhbmQgc2V0cyB1cCB0aGUgcXVlcnkgdGltaW5nIGJhc2VkIG9uIHRoZSBjdXJyZW50IHVzYWdlXG4gKiBvZiB0aGUgcXVlcnkgcHJvcGVydHkuIGUuZy4gYSB2aWV3IHF1ZXJ5IHRoYXQgaXMgbm90IHVzZWQgaW4gYW55IGxpZmVjeWNsZSBob29rIGRvZXNcbiAqIG5vdCBuZWVkIHRvIGJlIHN0YXRpYyBhbmQgY2FuIGJlIHNldCB1cCB3aXRoIFwic3RhdGljOiBmYWxzZVwiLlxuICovXG5hc3luYyBmdW5jdGlvbiBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCBwcm9qZWN0OiBBbmFseXplZFByb2plY3QsIHNlbGVjdGVkU3RyYXRlZ3k6IFNFTEVDVEVEX1NUUkFURUdZLFxuICAgIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IHtzb3VyY2VGaWxlcywgdHlwZUNoZWNrZXIsIGhvc3QsIHF1ZXJ5VmlzaXRvciwgdHNjb25maWdQYXRoLCBiYXNlUGF0aH0gPSBwcm9qZWN0O1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBjb25zdCBmYWlsdXJlTWVzc2FnZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHRlbXBsYXRlVmlzaXRvciA9IG5ldyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG5cbiAgLy8gSWYgdGhlIFwidXNhZ2VcIiBzdHJhdGVneSBpcyBzZWxlY3RlZCwgd2UgYWxzbyBuZWVkIHRvIGFkZCB0aGUgcXVlcnkgdmlzaXRvclxuICAvLyB0byB0aGUgYW5hbHlzaXMgdmlzaXRvcnMgc28gdGhhdCBxdWVyeSB1c2FnZSBpbiB0ZW1wbGF0ZXMgY2FuIGJlIGFsc28gY2hlY2tlZC5cbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgc291cmNlRmlsZXMuZm9yRWFjaChzID0+IHRlbXBsYXRlVmlzaXRvci52aXNpdE5vZGUocykpO1xuICB9XG5cbiAgY29uc3Qge3Jlc29sdmVkUXVlcmllcywgY2xhc3NNZXRhZGF0YX0gPSBxdWVyeVZpc2l0b3I7XG4gIGNvbnN0IHtyZXNvbHZlZFRlbXBsYXRlc30gPSB0ZW1wbGF0ZVZpc2l0b3I7XG5cbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgLy8gQWRkIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgdG8gdGhlIGNsYXNzIG1ldGFkYXRhIGlmIHRoZSB1c2FnZSBzdHJhdGVneSBpcyB1c2VkLiBUaGlzXG4gICAgLy8gaXMgbmVjZXNzYXJ5IGluIG9yZGVyIHRvIGJlIGFibGUgdG8gY2hlY2sgY29tcG9uZW50IHRlbXBsYXRlcyBmb3Igc3RhdGljIHF1ZXJ5IHVzYWdlLlxuICAgIHJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgICAgaWYgKGNsYXNzTWV0YWRhdGEuaGFzKHRlbXBsYXRlLmNvbnRhaW5lcikpIHtcbiAgICAgICAgY2xhc3NNZXRhZGF0YS5nZXQodGVtcGxhdGUuY29udGFpbmVyKSAhLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBsZXQgc3RyYXRlZ3k6IFRpbWluZ1N0cmF0ZWd5O1xuICBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVVNBR0UpIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVVzYWdlU3RyYXRlZ3koY2xhc3NNZXRhZGF0YSwgdHlwZUNoZWNrZXIpO1xuICB9IGVsc2UgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlRFU1RTKSB7XG4gICAgc3RyYXRlZ3kgPSBuZXcgUXVlcnlUZXN0U3RyYXRlZ3koKTtcbiAgfSBlbHNlIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVRlbXBsYXRlU3RyYXRlZ3kodHNjb25maWdQYXRoLCBjbGFzc01ldGFkYXRhLCBob3N0KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgc3RyYXRlZ3kuc2V0dXAoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5URU1QTEFURSkge1xuICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgICAgYFxcblRoZSB0ZW1wbGF0ZSBtaWdyYXRpb24gc3RyYXRlZ3kgdXNlcyB0aGUgQW5ndWxhciBjb21waWxlciBgICtcbiAgICAgICAgICBgaW50ZXJuYWxseSBhbmQgdGhlcmVmb3JlIHByb2plY3RzIHRoYXQgbm8gbG9uZ2VyIGJ1aWxkIHN1Y2Nlc3NmdWxseSBhZnRlciBgICtcbiAgICAgICAgICBgdGhlIHVwZGF0ZSBjYW5ub3QgdXNlIHRoZSB0ZW1wbGF0ZSBtaWdyYXRpb24gc3RyYXRlZ3kuIFBsZWFzZSBlbnN1cmUgYCArXG4gICAgICAgICAgYHRoZXJlIGFyZSBubyBBT1QgY29tcGlsYXRpb24gZXJyb3JzLlxcbmApO1xuICAgIH1cbiAgICAvLyBJbiBjYXNlIHRoZSBzdHJhdGVneSBjb3VsZCBub3QgYmUgc2V0IHVwIHByb3Blcmx5LCB3ZSBqdXN0IGV4aXQgdGhlXG4gICAgLy8gbWlncmF0aW9uLiBXZSBkb24ndCB3YW50IHRvIHRocm93IGFuIGV4Y2VwdGlvbiBhcyB0aGlzIGNvdWxkIG1lYW5cbiAgICAvLyB0aGF0IG90aGVyIG1pZ3JhdGlvbnMgYXJlIGludGVycnVwdGVkLlxuICAgIGxvZ2dlci53YXJuKFxuICAgICAgICBgQ291bGQgbm90IHNldHVwIG1pZ3JhdGlvbiBzdHJhdGVneSBmb3IgXCIke3Byb2plY3QudHNjb25maWdQYXRofVwiLiBUaGUgYCArXG4gICAgICAgIGBmb2xsb3dpbmcgZXJyb3IgaGFzIGJlZW4gcmVwb3J0ZWQ6XFxuYCk7XG4gICAgbG9nZ2VyLmVycm9yKGAke2UudG9TdHJpbmcoKX1cXG5gKTtcbiAgICBsb2dnZXIuaW5mbyhcbiAgICAgICAgJ01pZ3JhdGlvbiBjYW4gYmUgcmVydW4gd2l0aDogXCJuZyB1cGRhdGUgQGFuZ3VsYXIvY29yZSAtLWZyb20gNyAtLXRvIDggLS1taWdyYXRlLW9ubHlcIlxcbicpO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIHRoYXQgY29udGFpbiByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGVcbiAgLy8gdGhlIHNvdXJjZSBmaWxlcyBpZiBuZWVkZWQuIE5vdGUgdGhhdCB3ZSBuZWVkIHRvIHVwZGF0ZSBtdWx0aXBsZSBxdWVyaWVzXG4gIC8vIHdpdGhpbiBhIHNvdXJjZSBmaWxlIHdpdGhpbiB0aGUgc2FtZSByZWNvcmRlciBpbiBvcmRlciB0byBub3QgdGhyb3cgb2ZmXG4gIC8vIHRoZSBUeXBlU2NyaXB0IG5vZGUgb2Zmc2V0cy5cbiAgcmVzb2x2ZWRRdWVyaWVzLmZvckVhY2goKHF1ZXJpZXMsIHNvdXJjZUZpbGUpID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZVBhdGgpO1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgcXVlcnkgdGltaW5nIGZvciBhbGwgcmVzb2x2ZWQgcXVlcmllcyBhbmQgdXBkYXRlIHRoZVxuICAgIC8vIHF1ZXJ5IGRlZmluaXRpb25zIHRvIGV4cGxpY2l0bHkgc2V0IHRoZSBkZXRlcm1pbmVkIHF1ZXJ5IHRpbWluZy5cbiAgICBxdWVyaWVzLmZvckVhY2gocSA9PiB7XG4gICAgICBjb25zdCBxdWVyeUV4cHIgPSBxLmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgICBjb25zdCB7dGltaW5nLCBtZXNzYWdlfSA9IHN0cmF0ZWd5LmRldGVjdFRpbWluZyhxKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcihxLCB0aW1pbmcsICEhbWVzc2FnZSk7XG5cbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3VGV4dCA9IHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCByZXN1bHQubm9kZSwgc291cmNlRmlsZSk7XG5cbiAgICAgIC8vIFJlcGxhY2UgdGhlIGV4aXN0aW5nIHF1ZXJ5IGRlY29yYXRvciBjYWxsIGV4cHJlc3Npb24gd2l0aCB0aGUgdXBkYXRlZFxuICAgICAgLy8gY2FsbCBleHByZXNzaW9uIG5vZGUuXG4gICAgICB1cGRhdGUucmVtb3ZlKHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBxdWVyeUV4cHIuZ2V0V2lkdGgoKSk7XG4gICAgICB1cGRhdGUuaW5zZXJ0UmlnaHQocXVlcnlFeHByLmdldFN0YXJ0KCksIG5ld1RleHQpO1xuXG4gICAgICBpZiAocmVzdWx0LmZhaWx1cmVNZXNzYWdlIHx8IG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgcS5kZWNvcmF0b3Iubm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgZmFpbHVyZU1lc3NhZ2VzLnB1c2goXG4gICAgICAgICAgICBgJHtyZWxhdGl2ZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX06ICR7cmVzdWx0LmZhaWx1cmVNZXNzYWdlIHx8IG1lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcblxuICByZXR1cm4gZmFpbHVyZU1lc3NhZ2VzO1xufVxuIl19