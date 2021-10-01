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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
    const typescript_1 = __importDefault(require("typescript"));
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
            logger.error(typescript_1.default.formatDiagnostics(syntacticDiagnostics, host));
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
            const printer = typescript_1.default.createPrinter();
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
                    const newText = printer.printNode(typescript_1.default.EmitHint.Unspecified, result.node, sourceFile);
                    // Replace the existing query decorator call expression with the updated
                    // call expression node.
                    update.remove(queryExpr.getStart(), queryExpr.getWidth());
                    update.insertRight(queryExpr.getStart(), newText);
                    if (result.failureMessage || message) {
                        const { line, character } = typescript_1.default.getLineAndCharacterOfPosition(sourceFile, q.decorator.node.getStart());
                        failureMessages.push(`${relativePath}@${line + 1}:${character + 1}: ${result.failureMessage || message}`);
                    }
                });
                tree.commitUpdate(update);
            });
            return failureMessages;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdILDJEQUE2RjtJQUM3RiwrQkFBOEI7SUFDOUIsNERBQTRCO0lBRTVCLHNFQUFtRDtJQUNuRCxnR0FBNkU7SUFDN0Usa0dBQTJFO0lBQzNFLDJGQUE0RjtJQUU1RixrSEFBaUU7SUFDakUseUlBQXVGO0lBQ3ZGLDZIQUEyRTtJQUUzRSxnSUFBOEU7SUFDOUUsNEZBQXdEO0lBRXhELElBQUssaUJBSUo7SUFKRCxXQUFLLGlCQUFpQjtRQUNwQixpRUFBUSxDQUFBO1FBQ1IsMkRBQUssQ0FBQTtRQUNMLDJEQUFLLENBQUE7SUFDUCxDQUFDLEVBSkksaUJBQWlCLEtBQWpCLGlCQUFpQixRQUlyQjtJQVlELHFEQUFxRDtJQUNyRDtRQUNFLE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFGRCw0QkFFQztJQUVELDJGQUEyRjtJQUMzRixTQUFlLFlBQVksQ0FBQyxJQUFVLEVBQUUsT0FBeUI7O1lBQy9ELE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsTUFBTSxJQUFBLGdEQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTlCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxJQUFJLGdDQUFtQixDQUN6QiwyREFBMkQ7b0JBQzNELHFCQUFxQixDQUFDLENBQUM7YUFDNUI7WUFFRCxNQUFNLGFB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QUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7d0JBQzlFLGVBQWUsQ0FBQyxJQUFJLENBQ2hCLEdBQUcsWUFBWSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksU0FBUyxHQUFHLENBQUMsS0FBSyxNQUFNLENBQUMsY0FBYyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7cUJBQzFGO2dCQUNILENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLGVBQWUsQ0FBQztRQUN6QixDQUFDO0tBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7cmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2xvYWRFc21Nb2R1bGV9IGZyb20gJy4uLy4uL3V0aWxzL2xvYWRfZXNtJztcbmltcG9ydCB7TmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3J9IGZyb20gJy4uLy4uL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZSc7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvblByb2dyYW19IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5cbmltcG9ydCB7TmdRdWVyeVJlc29sdmVWaXNpdG9yfSBmcm9tICcuL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvcic7XG5pbXBvcnQge1F1ZXJ5VGVtcGxhdGVTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5JztcbmltcG9ydCB7UXVlcnlUZXN0U3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90ZXN0X3N0cmF0ZWd5L3Rlc3Rfc3RyYXRlZ3knO1xuaW1wb3J0IHtUaW1pbmdTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3RpbWluZy1zdHJhdGVneSc7XG5pbXBvcnQge1F1ZXJ5VXNhZ2VTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3VzYWdlX3N0cmF0ZWd5L3VzYWdlX3N0cmF0ZWd5JztcbmltcG9ydCB7Z2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5cbmVudW0gU0VMRUNURURfU1RSQVRFR1kge1xuICBURU1QTEFURSxcbiAgVVNBR0UsXG4gIFRFU1RTLFxufVxuXG5pbnRlcmZhY2UgQW5hbHl6ZWRQcm9qZWN0IHtcbiAgcHJvZ3JhbTogdHMuUHJvZ3JhbTtcbiAgaG9zdDogdHMuQ29tcGlsZXJIb3N0O1xuICBxdWVyeVZpc2l0b3I6IE5nUXVlcnlSZXNvbHZlVmlzaXRvcjtcbiAgc291cmNlRmlsZXM6IHRzLlNvdXJjZUZpbGVbXTtcbiAgYmFzZVBhdGg6IHN0cmluZztcbiAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyO1xuICB0c2NvbmZpZ1BhdGg6IHN0cmluZztcbn1cblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjggc3RhdGljLXF1ZXJ5IG1pZ3JhdGlvbi4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gcnVuTWlncmF0aW9uO1xufVxuXG4vKiogUnVucyB0aGUgVjggbWlncmF0aW9uIHN0YXRpYy1xdWVyeSBtaWdyYXRpb24gZm9yIGFsbCBkZXRlcm1pbmVkIFR5cGVTY3JpcHQgcHJvamVjdHMuICovXG5hc3luYyBmdW5jdGlvbiBydW5NaWdyYXRpb24odHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkge1xuICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGF3YWl0IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuXG4gIGlmICghYnVpbGRQYXRocy5sZW5ndGggJiYgIXRlc3RQYXRocy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSBxdWVyaWVzICcgK1xuICAgICAgICAndG8gYWRkIHN0YXRpYyBmbGFnLicpO1xuICB9XG5cbiAgY29uc3QgYW5hbHl6ZWRGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBidWlsZFByb2plY3RzID0gbmV3IFNldDxBbmFseXplZFByb2plY3Q+KCk7XG4gIGNvbnN0IGZhaWx1cmVzID0gW107XG4gIGNvbnN0IHN0cmF0ZWd5ID0gcHJvY2Vzcy5lbnZbJ05HX1NUQVRJQ19RVUVSWV9VU0FHRV9TVFJBVEVHWSddID09PSAndHJ1ZScgP1xuICAgICAgU0VMRUNURURfU1RSQVRFR1kuVVNBR0UgOlxuICAgICAgU0VMRUNURURfU1RSQVRFR1kuVEVNUExBVEU7XG5cbiAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYnVpbGRQYXRocykge1xuICAgIGNvbnN0IHByb2plY3QgPSBhbmFseXplUHJvamVjdCh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBhbmFseXplZEZpbGVzLCBsb2dnZXIpO1xuICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICBidWlsZFByb2plY3RzLmFkZChwcm9qZWN0KTtcbiAgICB9XG4gIH1cblxuICBsZXQgY29tcGlsZXJNb2R1bGU7XG4gIHRyeSB7XG4gICAgLy8gTG9hZCBFU00gYEBhbmd1bGFyL2NvbXBpbGVyYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAgIC8vIE9uY2UgVHlwZVNjcmlwdCBwcm92aWRlcyBzdXBwb3J0IGZvciBrZWVwaW5nIHRoZSBkeW5hbWljIGltcG9ydCB0aGlzIHdvcmthcm91bmQgY2FuIGJlXG4gICAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICBjb21waWxlck1vZHVsZSA9IGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKT4oJ0Bhbmd1bGFyL2NvbXBpbGVyJyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgYFVuYWJsZSB0byBsb2FkIHRoZSAnQGFuZ3VsYXIvY29tcGlsZXInIHBhY2thZ2UuIERldGFpbHM6ICR7ZS5tZXNzYWdlfWApO1xuICB9XG5cbiAgaWYgKGJ1aWxkUHJvamVjdHMuc2l6ZSkge1xuICAgIGZvciAobGV0IHByb2plY3Qgb2YgQXJyYXkuZnJvbShidWlsZFByb2plY3RzLnZhbHVlcygpKSkge1xuICAgICAgZmFpbHVyZXMucHVzaChcbiAgICAgICAgICAuLi5hd2FpdCBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlLCBwcm9qZWN0LCBzdHJhdGVneSwgbG9nZ2VyLCBjb21waWxlck1vZHVsZSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEZvciB0aGUgXCJ0ZXN0XCIgdHNjb25maWcgcHJvamVjdHMgd2UgYWx3YXlzIHdhbnQgdG8gdXNlIHRoZSB0ZXN0IHN0cmF0ZWd5IGFzXG4gIC8vIHdlIGNhbid0IGRldGVjdCB0aGUgcHJvcGVyIHRpbWluZyB3aXRoaW4gc3BlYyBmaWxlcy5cbiAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgdGVzdFBhdGhzKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IGFuYWx5emVQcm9qZWN0KHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGFuYWx5emVkRmlsZXMsIGxvZ2dlcik7XG4gICAgaWYgKHByb2plY3QpIHtcbiAgICAgIGZhaWx1cmVzLnB1c2goLi4uYXdhaXQgcnVuU3RhdGljUXVlcnlNaWdyYXRpb24oXG4gICAgICAgICAgdHJlZSwgcHJvamVjdCwgU0VMRUNURURfU1RSQVRFR1kuVEVTVFMsIGxvZ2dlciwgY29tcGlsZXJNb2R1bGUpKTtcbiAgICB9XG4gIH1cblxuICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgbG9nZ2VyLmluZm8oJycpO1xuICAgIGxvZ2dlci5pbmZvKCdTb21lIHF1ZXJpZXMgY291bGQgbm90IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuIFBsZWFzZSBnbycpO1xuICAgIGxvZ2dlci5pbmZvKCd0aHJvdWdoIHRoZXNlIG1hbnVhbGx5IGFuZCBhcHBseSB0aGUgYXBwcm9wcmlhdGUgdGltaW5nLicpO1xuICAgIGxvZ2dlci5pbmZvKCdGb3IgbW9yZSBpbmZvIG9uIGhvdyB0byBjaG9vc2UgYSBmbGFnLCBwbGVhc2Ugc2VlOiAnKTtcbiAgICBsb2dnZXIuaW5mbygnaHR0cHM6Ly92OC5hbmd1bGFyLmlvL2d1aWRlL3N0YXRpYy1xdWVyeS1taWdyYXRpb24nKTtcbiAgICBmYWlsdXJlcy5mb3JFYWNoKGZhaWx1cmUgPT4gbG9nZ2VyLndhcm4oYOKukSAgICR7ZmFpbHVyZX1gKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBbmFseXplcyB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBwcm9qZWN0IGJ5IGxvb2tpbmcgZm9yIHF1ZXJpZXMgdGhhdCBuZWVkIHRvIGJlXG4gKiBtaWdyYXRlZC4gSW4gY2FzZSB0aGVyZSBhcmUgbm8gcXVlcmllcyB0aGF0IGNhbiBiZSBtaWdyYXRlZCwgbnVsbCBpcyByZXR1cm5lZC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVByb2plY3QoXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGFuYWx5emVkRmlsZXM6IFNldDxzdHJpbmc+LFxuICAgIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGkpOiBBbmFseXplZFByb2plY3R8bnVsbCB7XG4gIGNvbnN0IHtwcm9ncmFtLCBob3N0fSA9IGNyZWF0ZU1pZ3JhdGlvblByb2dyYW0odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCk7XG4gIGNvbnN0IHN5bnRhY3RpY0RpYWdub3N0aWNzID0gcHJvZ3JhbS5nZXRTeW50YWN0aWNEaWFnbm9zdGljcygpO1xuXG4gIC8vIFN5bnRhY3RpYyBUeXBlU2NyaXB0IGVycm9ycyBjYW4gdGhyb3cgb2ZmIHRoZSBxdWVyeSBhbmFseXNpcyBhbmQgdGhlcmVmb3JlIHdlIHdhbnRcbiAgLy8gdG8gbm90aWZ5IHRoZSBkZXZlbG9wZXIgdGhhdCB3ZSBjb3VsZG4ndCBhbmFseXplIHBhcnRzIG9mIHRoZSBwcm9qZWN0LiBEZXZlbG9wZXJzXG4gIC8vIGNhbiBqdXN0IHJlLXJ1biB0aGUgbWlncmF0aW9uIGFmdGVyIGZpeGluZyB0aGVzZSBmYWlsdXJlcy5cbiAgaWYgKHN5bnRhY3RpY0RpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgIGxvZ2dlci53YXJuKFxuICAgICAgICBgXFxuVHlwZVNjcmlwdCBwcm9qZWN0IFwiJHt0c2NvbmZpZ1BhdGh9XCIgaGFzIHN5bnRhY3RpY2FsIGVycm9ycyB3aGljaCBjb3VsZCBjYXVzZSBgICtcbiAgICAgICAgYGFuIGluY29tcGxldGUgbWlncmF0aW9uLiBQbGVhc2UgZml4IHRoZSBmb2xsb3dpbmcgZmFpbHVyZXMgYW5kIHJlcnVuIHRoZSBtaWdyYXRpb246YCk7XG4gICAgbG9nZ2VyLmVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKHN5bnRhY3RpY0RpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgbG9nZ2VyLmluZm8oXG4gICAgICAgICdNaWdyYXRpb24gY2FuIGJlIHJlcnVuIHdpdGg6IFwibmcgdXBkYXRlIEBhbmd1bGFyL2NvcmUgLS1mcm9tIDcgLS10byA4IC0tbWlncmF0ZS1vbmx5XCJcXG4nKTtcbiAgfVxuXG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9XG4gICAgICBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKHNvdXJjZUZpbGUgPT4gY2FuTWlncmF0ZUZpbGUoYmFzZVBhdGgsIHNvdXJjZUZpbGUsIHByb2dyYW0pKTtcbiAgY29uc3QgcXVlcnlWaXNpdG9yID0gbmV3IE5nUXVlcnlSZXNvbHZlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG5cbiAgLy8gQW5hbHl6ZSBhbGwgcHJvamVjdCBzb3VyY2UtZmlsZXMgYW5kIGNvbGxlY3QgYWxsIHF1ZXJpZXMgdGhhdFxuICAvLyBuZWVkIHRvIGJlIG1pZ3JhdGVkLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcblxuICAgIC8vIE9ubHkgbG9vayBmb3IgcXVlcmllcyB3aXRoaW4gdGhlIGN1cnJlbnQgc291cmNlIGZpbGVzIGlmIHRoZVxuICAgIC8vIGZpbGUgaGFzIG5vdCBiZWVuIGFuYWx5emVkIGJlZm9yZS5cbiAgICBpZiAoIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgIGFuYWx5emVkRmlsZXMuYWRkKHJlbGF0aXZlUGF0aCk7XG4gICAgICBxdWVyeVZpc2l0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKHF1ZXJ5VmlzaXRvci5yZXNvbHZlZFF1ZXJpZXMuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtwcm9ncmFtLCBob3N0LCB0c2NvbmZpZ1BhdGgsIHR5cGVDaGVja2VyLCBiYXNlUGF0aCwgcXVlcnlWaXNpdG9yLCBzb3VyY2VGaWxlc307XG59XG5cbi8qKlxuICogUnVucyB0aGUgc3RhdGljIHF1ZXJ5IG1pZ3JhdGlvbiBmb3IgdGhlIGdpdmVuIHByb2plY3QuIFRoZSBzY2hlbWF0aWMgYW5hbHl6ZXMgYWxsXG4gKiBxdWVyaWVzIHdpdGhpbiB0aGUgcHJvamVjdCBhbmQgc2V0cyB1cCB0aGUgcXVlcnkgdGltaW5nIGJhc2VkIG9uIHRoZSBjdXJyZW50IHVzYWdlXG4gKiBvZiB0aGUgcXVlcnkgcHJvcGVydHkuIGUuZy4gYSB2aWV3IHF1ZXJ5IHRoYXQgaXMgbm90IHVzZWQgaW4gYW55IGxpZmVjeWNsZSBob29rIGRvZXNcbiAqIG5vdCBuZWVkIHRvIGJlIHN0YXRpYyBhbmQgY2FuIGJlIHNldCB1cCB3aXRoIFwic3RhdGljOiBmYWxzZVwiLlxuICovXG5hc3luYyBmdW5jdGlvbiBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCBwcm9qZWN0OiBBbmFseXplZFByb2plY3QsIHNlbGVjdGVkU3RyYXRlZ3k6IFNFTEVDVEVEX1NUUkFURUdZLFxuICAgIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4gICAgY29tcGlsZXJNb2R1bGU6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJykpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IHtzb3VyY2VGaWxlcywgdHlwZUNoZWNrZXIsIGhvc3QsIHF1ZXJ5VmlzaXRvciwgdHNjb25maWdQYXRoLCBiYXNlUGF0aH0gPSBwcm9qZWN0O1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBjb25zdCBmYWlsdXJlTWVzc2FnZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHRlbXBsYXRlVmlzaXRvciA9IG5ldyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG5cbiAgLy8gSWYgdGhlIFwidXNhZ2VcIiBzdHJhdGVneSBpcyBzZWxlY3RlZCwgd2UgYWxzbyBuZWVkIHRvIGFkZCB0aGUgcXVlcnkgdmlzaXRvclxuICAvLyB0byB0aGUgYW5hbHlzaXMgdmlzaXRvcnMgc28gdGhhdCBxdWVyeSB1c2FnZSBpbiB0ZW1wbGF0ZXMgY2FuIGJlIGFsc28gY2hlY2tlZC5cbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgc291cmNlRmlsZXMuZm9yRWFjaChzID0+IHRlbXBsYXRlVmlzaXRvci52aXNpdE5vZGUocykpO1xuICB9XG5cbiAgY29uc3Qge3Jlc29sdmVkUXVlcmllcywgY2xhc3NNZXRhZGF0YX0gPSBxdWVyeVZpc2l0b3I7XG4gIGNvbnN0IHtyZXNvbHZlZFRlbXBsYXRlc30gPSB0ZW1wbGF0ZVZpc2l0b3I7XG5cbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgLy8gQWRkIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgdG8gdGhlIGNsYXNzIG1ldGFkYXRhIGlmIHRoZSB1c2FnZSBzdHJhdGVneSBpcyB1c2VkLiBUaGlzXG4gICAgLy8gaXMgbmVjZXNzYXJ5IGluIG9yZGVyIHRvIGJlIGFibGUgdG8gY2hlY2sgY29tcG9uZW50IHRlbXBsYXRlcyBmb3Igc3RhdGljIHF1ZXJ5IHVzYWdlLlxuICAgIHJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgICAgaWYgKGNsYXNzTWV0YWRhdGEuaGFzKHRlbXBsYXRlLmNvbnRhaW5lcikpIHtcbiAgICAgICAgY2xhc3NNZXRhZGF0YS5nZXQodGVtcGxhdGUuY29udGFpbmVyKSEudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGxldCBzdHJhdGVneTogVGltaW5nU3RyYXRlZ3k7XG4gIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSkge1xuICAgIHN0cmF0ZWd5ID0gbmV3IFF1ZXJ5VXNhZ2VTdHJhdGVneShjbGFzc01ldGFkYXRhLCB0eXBlQ2hlY2tlciwgY29tcGlsZXJNb2R1bGUpO1xuICB9IGVsc2UgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlRFU1RTKSB7XG4gICAgc3RyYXRlZ3kgPSBuZXcgUXVlcnlUZXN0U3RyYXRlZ3koKTtcbiAgfSBlbHNlIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVRlbXBsYXRlU3RyYXRlZ3kodHNjb25maWdQYXRoLCBjbGFzc01ldGFkYXRhLCBob3N0LCBjb21waWxlck1vZHVsZSk7XG4gIH1cblxuICB0cnkge1xuICAgIHN0cmF0ZWd5LnNldHVwKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVEVNUExBVEUpIHtcbiAgICAgIGxvZ2dlci53YXJuKFxuICAgICAgICAgIGBcXG5UaGUgdGVtcGxhdGUgbWlncmF0aW9uIHN0cmF0ZWd5IHVzZXMgdGhlIEFuZ3VsYXIgY29tcGlsZXIgYCArXG4gICAgICAgICAgYGludGVybmFsbHkgYW5kIHRoZXJlZm9yZSBwcm9qZWN0cyB0aGF0IG5vIGxvbmdlciBidWlsZCBzdWNjZXNzZnVsbHkgYWZ0ZXIgYCArXG4gICAgICAgICAgYHRoZSB1cGRhdGUgY2Fubm90IHVzZSB0aGUgdGVtcGxhdGUgbWlncmF0aW9uIHN0cmF0ZWd5LiBQbGVhc2UgZW5zdXJlIGAgK1xuICAgICAgICAgIGB0aGVyZSBhcmUgbm8gQU9UIGNvbXBpbGF0aW9uIGVycm9ycy5cXG5gKTtcbiAgICB9XG4gICAgLy8gSW4gY2FzZSB0aGUgc3RyYXRlZ3kgY291bGQgbm90IGJlIHNldCB1cCBwcm9wZXJseSwgd2UganVzdCBleGl0IHRoZVxuICAgIC8vIG1pZ3JhdGlvbi4gV2UgZG9uJ3Qgd2FudCB0byB0aHJvdyBhbiBleGNlcHRpb24gYXMgdGhpcyBjb3VsZCBtZWFuXG4gICAgLy8gdGhhdCBvdGhlciBtaWdyYXRpb25zIGFyZSBpbnRlcnJ1cHRlZC5cbiAgICBsb2dnZXIud2FybihcbiAgICAgICAgYENvdWxkIG5vdCBzZXR1cCBtaWdyYXRpb24gc3RyYXRlZ3kgZm9yIFwiJHtwcm9qZWN0LnRzY29uZmlnUGF0aH1cIi4gVGhlIGAgK1xuICAgICAgICBgZm9sbG93aW5nIGVycm9yIGhhcyBiZWVuIHJlcG9ydGVkOlxcbmApO1xuICAgIGxvZ2dlci5lcnJvcihgJHtlLnRvU3RyaW5nKCl9XFxuYCk7XG4gICAgbG9nZ2VyLmluZm8oXG4gICAgICAgICdNaWdyYXRpb24gY2FuIGJlIHJlcnVuIHdpdGg6IFwibmcgdXBkYXRlIEBhbmd1bGFyL2NvcmUgLS1mcm9tIDcgLS10byA4IC0tbWlncmF0ZS1vbmx5XCJcXG4nKTtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBXYWxrIHRocm91Z2ggYWxsIHNvdXJjZSBmaWxlcyB0aGF0IGNvbnRhaW4gcmVzb2x2ZWQgcXVlcmllcyBhbmQgdXBkYXRlXG4gIC8vIHRoZSBzb3VyY2UgZmlsZXMgaWYgbmVlZGVkLiBOb3RlIHRoYXQgd2UgbmVlZCB0byB1cGRhdGUgbXVsdGlwbGUgcXVlcmllc1xuICAvLyB3aXRoaW4gYSBzb3VyY2UgZmlsZSB3aXRoaW4gdGhlIHNhbWUgcmVjb3JkZXIgaW4gb3JkZXIgdG8gbm90IHRocm93IG9mZlxuICAvLyB0aGUgVHlwZVNjcmlwdCBub2RlIG9mZnNldHMuXG4gIHJlc29sdmVkUXVlcmllcy5mb3JFYWNoKChxdWVyaWVzLCBzb3VyY2VGaWxlKSA9PiB7XG4gICAgY29uc3QgcmVsYXRpdmVQYXRoID0gcmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgIGNvbnN0IHVwZGF0ZSA9IHRyZWUuYmVnaW5VcGRhdGUocmVsYXRpdmVQYXRoKTtcblxuICAgIC8vIENvbXB1dGUgdGhlIHF1ZXJ5IHRpbWluZyBmb3IgYWxsIHJlc29sdmVkIHF1ZXJpZXMgYW5kIHVwZGF0ZSB0aGVcbiAgICAvLyBxdWVyeSBkZWZpbml0aW9ucyB0byBleHBsaWNpdGx5IHNldCB0aGUgZGV0ZXJtaW5lZCBxdWVyeSB0aW1pbmcuXG4gICAgcXVlcmllcy5mb3JFYWNoKHEgPT4ge1xuICAgICAgY29uc3QgcXVlcnlFeHByID0gcS5kZWNvcmF0b3Iubm9kZS5leHByZXNzaW9uO1xuICAgICAgY29uc3Qge3RpbWluZywgbWVzc2FnZX0gPSBzdHJhdGVneS5kZXRlY3RUaW1pbmcocSk7XG4gICAgICBjb25zdCByZXN1bHQgPSBnZXRUcmFuc2Zvcm1lZFF1ZXJ5Q2FsbEV4cHIocSwgdGltaW5nLCAhIW1lc3NhZ2UpO1xuXG4gICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld1RleHQgPSBwcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgcmVzdWx0Lm5vZGUsIHNvdXJjZUZpbGUpO1xuXG4gICAgICAvLyBSZXBsYWNlIHRoZSBleGlzdGluZyBxdWVyeSBkZWNvcmF0b3IgY2FsbCBleHByZXNzaW9uIHdpdGggdGhlIHVwZGF0ZWRcbiAgICAgIC8vIGNhbGwgZXhwcmVzc2lvbiBub2RlLlxuICAgICAgdXBkYXRlLnJlbW92ZShxdWVyeUV4cHIuZ2V0U3RhcnQoKSwgcXVlcnlFeHByLmdldFdpZHRoKCkpO1xuICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBuZXdUZXh0KTtcblxuICAgICAgaWYgKHJlc3VsdC5mYWlsdXJlTWVzc2FnZSB8fCBtZXNzYWdlKSB7XG4gICAgICAgIGNvbnN0IHtsaW5lLCBjaGFyYWN0ZXJ9ID1cbiAgICAgICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKHNvdXJjZUZpbGUsIHEuZGVjb3JhdG9yLm5vZGUuZ2V0U3RhcnQoKSk7XG4gICAgICAgIGZhaWx1cmVNZXNzYWdlcy5wdXNoKFxuICAgICAgICAgICAgYCR7cmVsYXRpdmVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke3Jlc3VsdC5mYWlsdXJlTWVzc2FnZSB8fCBtZXNzYWdlfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdHJlZS5jb21taXRVcGRhdGUodXBkYXRlKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGZhaWx1cmVNZXNzYWdlcztcbn1cbiJdfQ==