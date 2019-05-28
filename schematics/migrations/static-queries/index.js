/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "rxjs", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", "@angular/core/schematics/migrations/static-queries/strategies/test_strategy/test_strategy", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy", "@angular/core/schematics/migrations/static-queries/transform"], factory);
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
        const host = ts.createCompilerHost(parsed.options, true);
        // We need to overwrite the host "readFile" method, as we want the TypeScript
        // program to be based on the file contents in the virtual file tree. Otherwise
        // if we run the migration for multiple tsconfig files which have intersecting
        // source files, it can end up updating query definitions multiple times.
        host.readFile = fileName => {
            const buffer = tree.read(path_1.relative(basePath, fileName));
            return buffer ? buffer.toString() : undefined;
        };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBR0gsMkRBQTZGO0lBQzdGLCtCQUF1QztJQUN2QywrQkFBMEI7SUFDMUIsaUNBQWlDO0lBRWpDLGdHQUE2RTtJQUM3RSxrR0FBMkU7SUFDM0UsNkZBQXdFO0lBRXhFLGtIQUFpRTtJQUNqRSx5SUFBdUY7SUFDdkYsNkhBQTJFO0lBRTNFLGdJQUE4RTtJQUM5RSw0RkFBd0Q7SUFFeEQsSUFBSyxpQkFJSjtJQUpELFdBQUssaUJBQWlCO1FBQ3BCLGlFQUFRLENBQUE7UUFDUiwyREFBSyxDQUFBO1FBQ0wsMkRBQUssQ0FBQTtJQUNQLENBQUMsRUFKSSxpQkFBaUIsS0FBakIsaUJBQWlCLFFBSXJCO0lBWUQscURBQXFEO0lBQ3JEO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDL0MsbUVBQW1FO1lBQ25FLHdEQUF3RDtZQUN4RCxPQUFPLFdBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBUSxDQUFDO1FBQ25FLENBQUMsQ0FBQztJQUNKLENBQUM7SUFORCw0QkFNQztJQUVELDJGQUEyRjtJQUMzRixTQUFlLFlBQVksQ0FBQyxJQUFVLEVBQUUsT0FBeUI7O1lBQy9ELE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxN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ZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmd9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtkaXJuYW1lLCByZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQge2Zyb219IGZyb20gJ3J4anMnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7TmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3J9IGZyb20gJy4uLy4uL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZSc7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7cGFyc2VUc2NvbmZpZ0ZpbGV9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcGFyc2VfdHNjb25maWcnO1xuXG5pbXBvcnQge05nUXVlcnlSZXNvbHZlVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtRdWVyeVRlbXBsYXRlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90ZW1wbGF0ZV9zdHJhdGVneS90ZW1wbGF0ZV9zdHJhdGVneSc7XG5pbXBvcnQge1F1ZXJ5VGVzdFN0cmF0ZWd5fSBmcm9tICcuL3N0cmF0ZWdpZXMvdGVzdF9zdHJhdGVneS90ZXN0X3N0cmF0ZWd5JztcbmltcG9ydCB7VGltaW5nU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90aW1pbmctc3RyYXRlZ3knO1xuaW1wb3J0IHtRdWVyeVVzYWdlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy91c2FnZV9zdHJhdGVneS91c2FnZV9zdHJhdGVneSc7XG5pbXBvcnQge2dldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcn0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuXG5lbnVtIFNFTEVDVEVEX1NUUkFURUdZIHtcbiAgVEVNUExBVEUsXG4gIFVTQUdFLFxuICBURVNUUyxcbn1cblxuaW50ZXJmYWNlIEFuYWx5emVkUHJvamVjdCB7XG4gIHByb2dyYW06IHRzLlByb2dyYW07XG4gIGhvc3Q6IHRzLkNvbXBpbGVySG9zdDtcbiAgcXVlcnlWaXNpdG9yOiBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3I7XG4gIHNvdXJjZUZpbGVzOiB0cy5Tb3VyY2VGaWxlW107XG4gIGJhc2VQYXRoOiBzdHJpbmc7XG4gIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcjtcbiAgdHNjb25maWdQYXRoOiBzdHJpbmc7XG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFY4IHN0YXRpYy1xdWVyeSBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgLy8gV2UgbmVlZCB0byBjYXN0IHRoZSByZXR1cm5lZCBcIk9ic2VydmFibGVcIiB0byBcImFueVwiIGFzIHRoZXJlIGlzIGFcbiAgICAvLyBSeEpTIHZlcnNpb24gbWlzbWF0Y2ggdGhhdCBicmVha3MgdGhlIFRTIGNvbXBpbGF0aW9uLlxuICAgIHJldHVybiBmcm9tKHJ1bk1pZ3JhdGlvbih0cmVlLCBjb250ZXh0KS50aGVuKCgpID0+IHRyZWUpKSBhcyBhbnk7XG4gIH07XG59XG5cbi8qKiBSdW5zIHRoZSBWOCBtaWdyYXRpb24gc3RhdGljLXF1ZXJ5IG1pZ3JhdGlvbiBmb3IgYWxsIGRldGVybWluZWQgVHlwZVNjcmlwdCBwcm9qZWN0cy4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bk1pZ3JhdGlvbih0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSB7XG4gIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG5cbiAgbG9nZ2VyLmluZm8oJy0tLS0tLSBTdGF0aWMgUXVlcnkgTWlncmF0aW9uIC0tLS0tLScpO1xuICBsb2dnZXIuaW5mbygnV2l0aCBBbmd1bGFyIHZlcnNpb24gOCwgZGV2ZWxvcGVycyBuZWVkIHRvJyk7XG4gIGxvZ2dlci5pbmZvKCdleHBsaWNpdGx5IHNwZWNpZnkgdGhlIHRpbWluZyBvZiBWaWV3Q2hpbGQgYW5kJyk7XG4gIGxvZ2dlci5pbmZvKCdDb250ZW50Q2hpbGQgcXVlcmllcy4gUmVhZCBtb3JlIGFib3V0IHRoaXMgaGVyZTonKTtcbiAgbG9nZ2VyLmluZm8oJ2h0dHBzOi8vdjguYW5ndWxhci5pby9ndWlkZS9zdGF0aWMtcXVlcnktbWlncmF0aW9uJyk7XG5cbiAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBtaWdyYXRlIHF1ZXJpZXMgJyArXG4gICAgICAgICd0byBhZGQgc3RhdGljIGZsYWcuJyk7XG4gIH1cblxuICBjb25zdCBhbmFseXplZEZpbGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGJ1aWxkUHJvamVjdHMgPSBuZXcgU2V0PEFuYWx5emVkUHJvamVjdD4oKTtcbiAgY29uc3QgZmFpbHVyZXMgPSBbXTtcbiAgY29uc3Qgc3RyYXRlZ3kgPSBwcm9jZXNzLmVudlsnTkdfU1RBVElDX1FVRVJZX1VTQUdFX1NUUkFURUdZJ10gPT09ICd0cnVlJyA/XG4gICAgICBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSA6XG4gICAgICBTRUxFQ1RFRF9TVFJBVEVHWS5URU1QTEFURTtcblxuICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBidWlsZFBhdGhzKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGFuYWx5emVQcm9qZWN0KHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGFuYWx5emVkRmlsZXMsIGxvZ2dlcik7XG4gICAgaWYgKHByb2plY3QpIHtcbiAgICAgIGJ1aWxkUHJvamVjdHMuYWRkKHByb2plY3QpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChidWlsZFByb2plY3RzLnNpemUpIHtcbiAgICBmb3IgKGxldCBwcm9qZWN0IG9mIEFycmF5LmZyb20oYnVpbGRQcm9qZWN0cy52YWx1ZXMoKSkpIHtcbiAgICAgIGZhaWx1cmVzLnB1c2goLi4uYXdhaXQgcnVuU3RhdGljUXVlcnlNaWdyYXRpb24odHJlZSwgcHJvamVjdCwgc3RyYXRlZ3ksIGxvZ2dlcikpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEZvciB0aGUgXCJ0ZXN0XCIgdHNjb25maWcgcHJvamVjdHMgd2UgYWx3YXlzIHdhbnQgdG8gdXNlIHRoZSB0ZXN0IHN0cmF0ZWd5IGFzXG4gIC8vIHdlIGNhbid0IGRldGVjdCB0aGUgcHJvcGVyIHRpbWluZyB3aXRoaW4gc3BlYyBmaWxlcy5cbiAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgdGVzdFBhdGhzKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IGFuYWx5emVQcm9qZWN0KHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGFuYWx5emVkRmlsZXMsIGxvZ2dlcik7XG4gICAgaWYgKHByb2plY3QpIHtcbiAgICAgIGZhaWx1cmVzLnB1c2goXG4gICAgICAgICAgLi4uYXdhaXQgcnVuU3RhdGljUXVlcnlNaWdyYXRpb24odHJlZSwgcHJvamVjdCwgU0VMRUNURURfU1RSQVRFR1kuVEVTVFMsIGxvZ2dlcikpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICBsb2dnZXIuaW5mbygnJyk7XG4gICAgbG9nZ2VyLmluZm8oJ1NvbWUgcXVlcmllcyBjb3VsZCBub3QgYmUgbWlncmF0ZWQgYXV0b21hdGljYWxseS4gUGxlYXNlIGdvJyk7XG4gICAgbG9nZ2VyLmluZm8oJ3Rocm91Z2ggdGhlc2UgbWFudWFsbHkgYW5kIGFwcGx5IHRoZSBhcHByb3ByaWF0ZSB0aW1pbmcuJyk7XG4gICAgbG9nZ2VyLmluZm8oJ0ZvciBtb3JlIGluZm8gb24gaG93IHRvIGNob29zZSBhIGZsYWcsIHBsZWFzZSBzZWU6ICcpO1xuICAgIGxvZ2dlci5pbmZvKCdodHRwczovL3Y4LmFuZ3VsYXIuaW8vZ3VpZGUvc3RhdGljLXF1ZXJ5LW1pZ3JhdGlvbicpO1xuICAgIGZhaWx1cmVzLmZvckVhY2goZmFpbHVyZSA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmYWlsdXJlfWApKTtcbiAgfVxuXG4gIGxvZ2dlci5pbmZvKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbn1cblxuLyoqXG4gKiBBbmFseXplcyB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBwcm9qZWN0IGJ5IGxvb2tpbmcgZm9yIHF1ZXJpZXMgdGhhdCBuZWVkIHRvIGJlXG4gKiBtaWdyYXRlZC4gSW4gY2FzZSB0aGVyZSBhcmUgbm8gcXVlcmllcyB0aGF0IGNhbiBiZSBtaWdyYXRlZCwgbnVsbCBpcyByZXR1cm5lZC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVByb2plY3QoXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGFuYWx5emVkRmlsZXM6IFNldDxzdHJpbmc+LFxuICAgIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGkpOlxuICAgIEFuYWx5emVkUHJvamVjdHxudWxsIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgICAgIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gICAgICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gICAgICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS4gT3RoZXJ3aXNlXG4gICAgICAvLyBpZiB3ZSBydW4gdGhlIG1pZ3JhdGlvbiBmb3IgbXVsdGlwbGUgdHNjb25maWcgZmlsZXMgd2hpY2ggaGF2ZSBpbnRlcnNlY3RpbmdcbiAgICAgIC8vIHNvdXJjZSBmaWxlcywgaXQgY2FuIGVuZCB1cCB1cGRhdGluZyBxdWVyeSBkZWZpbml0aW9ucyBtdWx0aXBsZSB0aW1lcy5cbiAgICAgIGhvc3QucmVhZEZpbGUgPSBmaWxlTmFtZSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICAgICAgcmV0dXJuIGJ1ZmZlciA/IGJ1ZmZlci50b1N0cmluZygpIDogdW5kZWZpbmVkO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICAgICAgY29uc3Qgc3ludGFjdGljRGlhZ25vc3RpY3MgPSBwcm9ncmFtLmdldFN5bnRhY3RpY0RpYWdub3N0aWNzKCk7XG5cbiAgICAgIC8vIFN5bnRhY3RpYyBUeXBlU2NyaXB0IGVycm9ycyBjYW4gdGhyb3cgb2ZmIHRoZSBxdWVyeSBhbmFseXNpcyBhbmQgdGhlcmVmb3JlIHdlIHdhbnRcbiAgICAgIC8vIHRvIG5vdGlmeSB0aGUgZGV2ZWxvcGVyIHRoYXQgd2UgY291bGRuJ3QgYW5hbHl6ZSBwYXJ0cyBvZiB0aGUgcHJvamVjdC4gRGV2ZWxvcGVyc1xuICAgICAgLy8gY2FuIGp1c3QgcmUtcnVuIHRoZSBtaWdyYXRpb24gYWZ0ZXIgZml4aW5nIHRoZXNlIGZhaWx1cmVzLlxuICAgICAgaWYgKHN5bnRhY3RpY0RpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICAgIGBcXG5UeXBlU2NyaXB0IHByb2plY3QgXCIke3RzY29uZmlnUGF0aH1cIiBoYXMgc3ludGFjdGljYWwgZXJyb3JzIHdoaWNoIGNvdWxkIGNhdXNlIGAgK1xuICAgICAgICAgICAgYGFuIGluY29tcGxldGUgbWlncmF0aW9uLiBQbGVhc2UgZml4IHRoZSBmb2xsb3dpbmcgZmFpbHVyZXMgYW5kIHJlcnVuIHRoZSBtaWdyYXRpb246YCk7XG4gICAgICAgIGxvZ2dlci5lcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhzeW50YWN0aWNEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgICAgICBsb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICdNaWdyYXRpb24gY2FuIGJlIHJlcnVuIHdpdGg6IFwibmcgdXBkYXRlIEBhbmd1bGFyL2NvcmUgLS1mcm9tIDcgLS10byA4IC0tbWlncmF0ZS1vbmx5XCJcXG4nKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gICAgICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICAgICAgZiA9PiAhZi5pc0RlY2xhcmF0aW9uRmlsZSAmJiAhcHJvZ3JhbS5pc1NvdXJjZUZpbGVGcm9tRXh0ZXJuYWxMaWJyYXJ5KGYpKTtcbiAgICAgIGNvbnN0IHF1ZXJ5VmlzaXRvciA9IG5ldyBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuXG4gICAgICAvLyBBbmFseXplIGFsbCBwcm9qZWN0IHNvdXJjZS1maWxlcyBhbmQgY29sbGVjdCBhbGwgcXVlcmllcyB0aGF0XG4gICAgICAvLyBuZWVkIHRvIGJlIG1pZ3JhdGVkLlxuICAgICAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuXG4gICAgICAgIC8vIE9ubHkgbG9vayBmb3IgcXVlcmllcyB3aXRoaW4gdGhlIGN1cnJlbnQgc291cmNlIGZpbGVzIGlmIHRoZVxuICAgICAgICAvLyBmaWxlIGhhcyBub3QgYmVlbiBhbmFseXplZCBiZWZvcmUuXG4gICAgICAgIGlmICghYW5hbHl6ZWRGaWxlcy5oYXMocmVsYXRpdmVQYXRoKSkge1xuICAgICAgICAgIGFuYWx5emVkRmlsZXMuYWRkKHJlbGF0aXZlUGF0aCk7XG4gICAgICAgICAgcXVlcnlWaXNpdG9yLnZpc2l0Tm9kZShzb3VyY2VGaWxlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChxdWVyeVZpc2l0b3IucmVzb2x2ZWRRdWVyaWVzLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7cHJvZ3JhbSwgaG9zdCwgdHNjb25maWdQYXRoLCB0eXBlQ2hlY2tlciwgYmFzZVBhdGgsIHF1ZXJ5VmlzaXRvciwgc291cmNlRmlsZXN9O1xuICAgIH1cblxuLyoqXG4gKiBSdW5zIHRoZSBzdGF0aWMgcXVlcnkgbWlncmF0aW9uIGZvciB0aGUgZ2l2ZW4gcHJvamVjdC4gVGhlIHNjaGVtYXRpYyBhbmFseXplcyBhbGxcbiAqIHF1ZXJpZXMgd2l0aGluIHRoZSBwcm9qZWN0IGFuZCBzZXRzIHVwIHRoZSBxdWVyeSB0aW1pbmcgYmFzZWQgb24gdGhlIGN1cnJlbnQgdXNhZ2VcbiAqIG9mIHRoZSBxdWVyeSBwcm9wZXJ0eS4gZS5nLiBhIHZpZXcgcXVlcnkgdGhhdCBpcyBub3QgdXNlZCBpbiBhbnkgbGlmZWN5Y2xlIGhvb2sgZG9lc1xuICogbm90IG5lZWQgdG8gYmUgc3RhdGljIGFuZCBjYW4gYmUgc2V0IHVwIHdpdGggXCJzdGF0aWM6IGZhbHNlXCIuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1blN0YXRpY1F1ZXJ5TWlncmF0aW9uKFxuICAgIHRyZWU6IFRyZWUsIHByb2plY3Q6IEFuYWx5emVkUHJvamVjdCwgc2VsZWN0ZWRTdHJhdGVneTogU0VMRUNURURfU1RSQVRFR1ksXG4gICAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgY29uc3Qge3NvdXJjZUZpbGVzLCB0eXBlQ2hlY2tlciwgaG9zdCwgcXVlcnlWaXNpdG9yLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRofSA9IHByb2plY3Q7XG4gIGNvbnN0IHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIGNvbnN0IGZhaWx1cmVNZXNzYWdlczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgdGVtcGxhdGVWaXNpdG9yID0gbmV3IE5nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yKHR5cGVDaGVja2VyKTtcblxuICAvLyBJZiB0aGUgXCJ1c2FnZVwiIHN0cmF0ZWd5IGlzIHNlbGVjdGVkLCB3ZSBhbHNvIG5lZWQgdG8gYWRkIHRoZSBxdWVyeSB2aXNpdG9yXG4gIC8vIHRvIHRoZSBhbmFseXNpcyB2aXNpdG9ycyBzbyB0aGF0IHF1ZXJ5IHVzYWdlIGluIHRlbXBsYXRlcyBjYW4gYmUgYWxzbyBjaGVja2VkLlxuICBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVVNBR0UpIHtcbiAgICBzb3VyY2VGaWxlcy5mb3JFYWNoKHMgPT4gdGVtcGxhdGVWaXNpdG9yLnZpc2l0Tm9kZShzKSk7XG4gIH1cblxuICBjb25zdCB7cmVzb2x2ZWRRdWVyaWVzLCBjbGFzc01ldGFkYXRhfSA9IHF1ZXJ5VmlzaXRvcjtcbiAgY29uc3Qge3Jlc29sdmVkVGVtcGxhdGVzfSA9IHRlbXBsYXRlVmlzaXRvcjtcblxuICBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVVNBR0UpIHtcbiAgICAvLyBBZGQgYWxsIHJlc29sdmVkIHRlbXBsYXRlcyB0byB0aGUgY2xhc3MgbWV0YWRhdGEgaWYgdGhlIHVzYWdlIHN0cmF0ZWd5IGlzIHVzZWQuIFRoaXNcbiAgICAvLyBpcyBuZWNlc3NhcnkgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBjaGVjayBjb21wb25lbnQgdGVtcGxhdGVzIGZvciBzdGF0aWMgcXVlcnkgdXNhZ2UuXG4gICAgcmVzb2x2ZWRUZW1wbGF0ZXMuZm9yRWFjaCh0ZW1wbGF0ZSA9PiB7XG4gICAgICBpZiAoY2xhc3NNZXRhZGF0YS5oYXModGVtcGxhdGUuY29udGFpbmVyKSkge1xuICAgICAgICBjbGFzc01ldGFkYXRhLmdldCh0ZW1wbGF0ZS5jb250YWluZXIpICEudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGxldCBzdHJhdGVneTogVGltaW5nU3RyYXRlZ3k7XG4gIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSkge1xuICAgIHN0cmF0ZWd5ID0gbmV3IFF1ZXJ5VXNhZ2VTdHJhdGVneShjbGFzc01ldGFkYXRhLCB0eXBlQ2hlY2tlcik7XG4gIH0gZWxzZSBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVEVTVFMpIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVRlc3RTdHJhdGVneSgpO1xuICB9IGVsc2Uge1xuICAgIHN0cmF0ZWd5ID0gbmV3IFF1ZXJ5VGVtcGxhdGVTdHJhdGVneSh0c2NvbmZpZ1BhdGgsIGNsYXNzTWV0YWRhdGEsIGhvc3QpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBzdHJhdGVneS5zZXR1cCgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlRFTVBMQVRFKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICBgXFxuVGhlIHRlbXBsYXRlIG1pZ3JhdGlvbiBzdHJhdGVneSB1c2VzIHRoZSBBbmd1bGFyIGNvbXBpbGVyIGAgK1xuICAgICAgICAgIGBpbnRlcm5hbGx5IGFuZCB0aGVyZWZvcmUgcHJvamVjdHMgdGhhdCBubyBsb25nZXIgYnVpbGQgc3VjY2Vzc2Z1bGx5IGFmdGVyIGAgK1xuICAgICAgICAgIGB0aGUgdXBkYXRlIGNhbm5vdCB1c2UgdGhlIHRlbXBsYXRlIG1pZ3JhdGlvbiBzdHJhdGVneS4gUGxlYXNlIGVuc3VyZSBgICtcbiAgICAgICAgICBgdGhlcmUgYXJlIG5vIEFPVCBjb21waWxhdGlvbiBlcnJvcnMuXFxuYCk7XG4gICAgfVxuICAgIC8vIEluIGNhc2UgdGhlIHN0cmF0ZWd5IGNvdWxkIG5vdCBiZSBzZXQgdXAgcHJvcGVybHksIHdlIGp1c3QgZXhpdCB0aGVcbiAgICAvLyBtaWdyYXRpb24uIFdlIGRvbid0IHdhbnQgdG8gdGhyb3cgYW4gZXhjZXB0aW9uIGFzIHRoaXMgY291bGQgbWVhblxuICAgIC8vIHRoYXQgb3RoZXIgbWlncmF0aW9ucyBhcmUgaW50ZXJydXB0ZWQuXG4gICAgbG9nZ2VyLndhcm4oXG4gICAgICAgIGBDb3VsZCBub3Qgc2V0dXAgbWlncmF0aW9uIHN0cmF0ZWd5IGZvciBcIiR7cHJvamVjdC50c2NvbmZpZ1BhdGh9XCIuIFRoZSBgICtcbiAgICAgICAgYGZvbGxvd2luZyBlcnJvciBoYXMgYmVlbiByZXBvcnRlZDpcXG5gKTtcbiAgICBsb2dnZXIuZXJyb3IoYCR7ZS50b1N0cmluZygpfVxcbmApO1xuICAgIGxvZ2dlci5pbmZvKFxuICAgICAgICAnTWlncmF0aW9uIGNhbiBiZSByZXJ1biB3aXRoOiBcIm5nIHVwZGF0ZSBAYW5ndWxhci9jb3JlIC0tZnJvbSA3IC0tdG8gOCAtLW1pZ3JhdGUtb25seVwiXFxuJyk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gV2FsayB0aHJvdWdoIGFsbCBzb3VyY2UgZmlsZXMgdGhhdCBjb250YWluIHJlc29sdmVkIHF1ZXJpZXMgYW5kIHVwZGF0ZVxuICAvLyB0aGUgc291cmNlIGZpbGVzIGlmIG5lZWRlZC4gTm90ZSB0aGF0IHdlIG5lZWQgdG8gdXBkYXRlIG11bHRpcGxlIHF1ZXJpZXNcbiAgLy8gd2l0aGluIGEgc291cmNlIGZpbGUgd2l0aGluIHRoZSBzYW1lIHJlY29yZGVyIGluIG9yZGVyIHRvIG5vdCB0aHJvdyBvZmZcbiAgLy8gdGhlIFR5cGVTY3JpcHQgbm9kZSBvZmZzZXRzLlxuICByZXNvbHZlZFF1ZXJpZXMuZm9yRWFjaCgocXVlcmllcywgc291cmNlRmlsZSkgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlUGF0aCk7XG5cbiAgICAvLyBDb21wdXRlIHRoZSBxdWVyeSB0aW1pbmcgZm9yIGFsbCByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGUgdGhlXG4gICAgLy8gcXVlcnkgZGVmaW5pdGlvbnMgdG8gZXhwbGljaXRseSBzZXQgdGhlIGRldGVybWluZWQgcXVlcnkgdGltaW5nLlxuICAgIHF1ZXJpZXMuZm9yRWFjaChxID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5RXhwciA9IHEuZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcbiAgICAgIGNvbnN0IHt0aW1pbmcsIG1lc3NhZ2V9ID0gc3RyYXRlZ3kuZGV0ZWN0VGltaW5nKHEpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByKHEsIHRpbWluZywgISFtZXNzYWdlKTtcblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdUZXh0ID0gcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHJlc3VsdC5ub2RlLCBzb3VyY2VGaWxlKTtcblxuICAgICAgLy8gUmVwbGFjZSB0aGUgZXhpc3RpbmcgcXVlcnkgZGVjb3JhdG9yIGNhbGwgZXhwcmVzc2lvbiB3aXRoIHRoZSB1cGRhdGVkXG4gICAgICAvLyBjYWxsIGV4cHJlc3Npb24gbm9kZS5cbiAgICAgIHVwZGF0ZS5yZW1vdmUocXVlcnlFeHByLmdldFN0YXJ0KCksIHF1ZXJ5RXhwci5nZXRXaWR0aCgpKTtcbiAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChxdWVyeUV4cHIuZ2V0U3RhcnQoKSwgbmV3VGV4dCk7XG5cbiAgICAgIGlmIChyZXN1bHQuZmFpbHVyZU1lc3NhZ2UgfHwgbWVzc2FnZSkge1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihzb3VyY2VGaWxlLCBxLmRlY29yYXRvci5ub2RlLmdldFN0YXJ0KCkpO1xuICAgICAgICBmYWlsdXJlTWVzc2FnZXMucHVzaChcbiAgICAgICAgICAgIGAke3JlbGF0aXZlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfTogJHtyZXN1bHQuZmFpbHVyZU1lc3NhZ2UgfHwgbWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gIH0pO1xuXG4gIHJldHVybiBmYWlsdXJlTWVzc2FnZXM7XG59XG4iXX0=