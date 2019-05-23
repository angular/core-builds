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
            logger.info('------ Static Query migration ------');
            logger.info('With Angular version 8, developers need to');
            logger.info('explicitly specify the timing of ViewChild or');
            logger.info('ContentChild queries. Read more about this here:');
            logger.info('https://github.com/angular/angular/pull/28810');
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate queries ' +
                    'to explicit timing.');
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
                logger.info('through those manually and apply the appropriate timing:');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBR0gsMkRBQTZGO0lBQzdGLCtCQUF1QztJQUN2QywrQkFBMEI7SUFDMUIsaUNBQWlDO0lBRWpDLGdHQUE2RTtJQUM3RSxrR0FBMkU7SUFDM0UsNkZBQXdFO0lBRXhFLGtIQUFpRTtJQUNqRSx5SUFBdUY7SUFDdkYsNkhBQTJFO0lBRTNFLGdJQUE4RTtJQUM5RSw0RkFBd0Q7SUFFeEQsSUFBSyxpQkFJSjtJQUpELFdBQUssaUJBQWlCO1FBQ3BCLGlFQUFRLENBQUE7UUFDUiwyREFBSyxDQUFBO1FBQ0wsMkRBQUssQ0FBQTtJQUNQLENBQUMsRUFKSSxpQkFBaUIsS0FBakIsaUJBQWlCLFFBSXJCO0lBWUQscURBQXFEO0lBQ3JEO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDL0MsbUVBQW1FO1lBQ25FLHdEQUF3RDtZQUN4RCxPQUFPLFdBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBUSxDQUFDO1FBQ25FLENBQUMsQ0FBQztJQUNKLENBQUM7SUFORCw0QkFNQztJQUVELDJGQUEyRjtJQUMzRixTQUFlLFlBQVksQ0FBQyxJQUFVLEVBQUUsT0FBeUI7O1lBQy9ELE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxJQUFJLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsSUFBSSxDQUFDLCtDQUErQyxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLElBQUksQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxJQUFJLENBQUMsK0NBQStDLENBQUMsQ0FBQztZQUU3RCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLE1BQU0sSUFBSSxnQ0FBbUIsQ0FDekIsMkRBQTJEO29CQUMzRCxxQkFBcUIsQ0FBQyxDQUFDO2FBQzVCO1lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQUN4QyxNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBbUIsQ0FBQztZQUNqRCxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7WUFDcEIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDekIsaUJBQWlCLENBQUMsUUFBUSxDQUFDO1lBRS9CLEtBQUssTUFBTSxZQUFZLElBQUksVUFBVSxFQUFFO2dCQUNyQyxNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNwRixJQUFJLE9BQU8sRUFBRTtvQkFDWCxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUM1QjthQUNGO1lBRUQsSUFBSSxhQUFhLENBQUMsSUFBSSxFQUFFO2dCQUN0QixLQUFLLElBQUksT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUU7b0JBQ3RELFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLHVCQUF1QixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQ2xGO2FBQ0Y7WUFFRCw4RUFBOEU7WUFDOUUsdURBQXVEO1lBQ3ZELEtBQUssTUFBTSxZQUFZLElBQUksU0FBUyxFQUFFO2dCQUNwQyxNQUFNLE9BQU8sR0FBRyxNQUFNLGNBQWMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzFGLElBQUksT0FBTyxFQUFFO29CQUNYLFFBQVEsQ0FBQyxJQUFJLENBQ1QsR0FBRyxNQUFNLHVCQUF1QixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsaUJBQWlCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQ3ZGO2FBQ0Y7WUFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsNkRBQTZELENBQUMsQ0FBQztnQkFDM0UsTUFBTSxDQUFDLElBQUksQ0FBQywwREFBMEQsQ0FBQyxDQUFDO2dCQUN4RSxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQzthQUM1RDtZQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsa0RBQWtELENBQUMsQ0FBQztRQUNsRSxDQUFDO0tBQUE7SUFFRDs7O09BR0c7SUFDSCxTQUFTLGNBQWMsQ0FDbkIsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0IsRUFBRSxhQUEwQixFQUM5RSxNQUF5QjtRQUV2QixNQUFNLE1BQU0sR0FBRyxrQ0FBaUIsQ0FBQyxZQUFZLEVBQUUsY0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsNkVBQTZFO1FBQzdFLCtFQUErRTtRQUMvRSw4RUFBOEU7UUFDOUUseUVBQXlFO1FBQ3pFLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUU7WUFDekIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdkQsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ2hELENBQUMsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sb0JBQW9CLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFL0QscUZBQXFGO1FBQ3JGLG9GQUFvRjtRQUNwRiw2REFBNkQ7UUFDN0QsSUFBSSxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7WUFDL0IsTUFBTSxDQUFDLElBQUksQ0FDUCx5QkFBeUIsWUFBWSw2Q0FBNkM7Z0JBQ2xGLHFGQUFxRixDQUFDLENBQUM7WUFDM0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMvRCxNQUFNLENBQUMsSUFBSSxDQUNQLHlGQUF5RixDQUFDLENBQUM7U0FDaEc7UUFFRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FDL0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sWUFBWSxHQUFHLElBQUksd0NBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFNUQsZ0VBQWdFO1FBQ2hFLHVCQUF1QjtRQUN2QixXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQy9CLE1BQU0sWUFBWSxHQUFHLGVBQVEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTdELCtEQUErRDtZQUMvRCxxQ0FBcUM7WUFDckMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ3BDLGFBQWEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2hDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDcEM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQzNDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxPQUFPLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFDLENBQUM7SUFDekYsQ0FBQztJQUVMOzs7OztPQUtHO0lBQ0gsU0FBZSx1QkFBdUIsQ0FDbEMsSUFBVSxFQUFFLE9BQXdCLEVBQUUsZ0JBQW1DLEVBQ3pFLE1BQXlCOztZQUMzQixNQUFNLEVBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUMsR0FBRyxPQUFPLENBQUM7WUFDdkYsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sZUFBZSxHQUFhLEVBQUUsQ0FBQztZQUNyQyxNQUFNLGVBQWUsR0FBRyxJQUFJLGtEQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXBFLDZFQUE2RTtZQUM3RSxpRkFBaUY7WUFDakYsSUFBSSxnQkFBZ0IsS0FBSyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2hELFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDeEQ7WUFFRCxNQUFNLEVBQUMsZUFBZSxFQUFFLGFBQWEsRUFBQyxHQUFHLFlBQVksQ0FBQztZQUN0RCxNQUFNLEVBQUMsaUJBQWlCLEVBQUMsR0FBRyxlQUFlLENBQUM7WUFFNUMsSUFBSSxnQkFBZ0IsS0FBSyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2hELHVGQUF1RjtnQkFDdkYsd0ZBQXdGO2dCQUN4RixpQkFBaUIsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ25DLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7d0JBQ3pDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBRyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7cUJBQzdEO2dCQUNILENBQUMsQ0FBQyxDQUFDO2FBQ0o7WUFFRCxJQUFJLFFBQXdCLENBQUM7WUFDN0IsSUFBSSxnQkFBZ0IsS0FBSyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2hELFFBQVEsR0FBRyxJQUFJLG1DQUFrQixDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQzthQUMvRDtpQkFBTSxJQUFJLGdCQUFnQixLQUFLLGlCQUFpQixDQUFDLEtBQUssRUFBRTtnQkFDdkQsUUFBUSxHQUFHLElBQUksaUNBQWlCLEVBQUUsQ0FBQzthQUNwQztpQkFBTTtnQkFDTCxRQUFRLEdBQUcsSUFBSSx5Q0FBcUIsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3pFO1lBRUQsSUFBSTtnQkFDRixRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDbEI7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDVixJQUFJLGdCQUFnQixLQUFLLGlCQUFpQixDQUFDLFFBQVEsRUFBRTtvQkFDbkQsTUFBTSxDQUFDLElBQUksQ0FDUCw4REFBOEQ7d0JBQzlELDRFQUE0RTt3QkFDNUUsdUVBQXVFO3dCQUN2RSx3Q0FBd0MsQ0FBQyxDQUFDO2lCQUMvQztnQkFDRCxzRUFBc0U7Z0JBQ3RFLG9FQUFvRTtnQkFDcEUseUNBQXlDO2dCQUN6QyxNQUFNLENBQUMsSUFBSSxDQUNQLDJDQUEyQyxPQUFPLENBQUMsWUFBWSxTQUFTO29CQUN4RSxzQ0FBc0MsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLElBQUksQ0FDUCx5RkFBeUYsQ0FBQyxDQUFDO2dCQUMvRixPQUFPLEVBQUUsQ0FBQzthQUNYO1lBRUQseUVBQXlFO1lBQ3pFLDJFQUEyRTtZQUMzRSwwRUFBMEU7WUFDMUUsK0JBQStCO1lBQy9CLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEVBQUU7Z0JBQzlDLE1BQU0sWUFBWSxHQUFHLGVBQVEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUU5QyxtRUFBbUU7Z0JBQ25FLG1FQUFtRTtnQkFDbkUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDbEIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO29CQUM5QyxNQUFNLEVBQUMsTUFBTSxFQUFFLE9BQU8sRUFBQyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25ELE1BQU0sTUFBTSxHQUFHLHVDQUEyQixDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUVqRSxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNYLE9BQU87cUJBQ1I7b0JBRUQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUVwRix3RUFBd0U7b0JBQ3hFLHdCQUF3QjtvQkFDeEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUVsRCxJQUFJLE1BQU0sQ0FBQyxjQUFjLElBQUksT0FBTyxFQUFFO3dCQUNwQyxNQUFNLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxHQUNuQixFQUFFLENBQUMsNkJBQTZCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7d0JBQzlFLGVBQWUsQ0FBQyxJQUFJLENBQ2hCLEdBQUcsWUFBWSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksU0FBUyxHQUFHLENBQUMsS0FBSyxNQUFNLENBQUMsY0FBYyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7cUJBQzFGO2dCQUNILENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLGVBQWUsQ0FBQztRQUN6QixDQUFDO0tBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9nZ2luZ30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge2Rpcm5hbWUsIHJlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCB7ZnJvbX0gZnJvbSAncnhqcyc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcn0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtwYXJzZVRzY29uZmlnRmlsZX0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wYXJzZV90c2NvbmZpZyc7XG5cbmltcG9ydCB7TmdRdWVyeVJlc29sdmVWaXNpdG9yfSBmcm9tICcuL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvcic7XG5pbXBvcnQge1F1ZXJ5VGVtcGxhdGVTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3RlbXBsYXRlX3N0cmF0ZWd5L3RlbXBsYXRlX3N0cmF0ZWd5JztcbmltcG9ydCB7UXVlcnlUZXN0U3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90ZXN0X3N0cmF0ZWd5L3Rlc3Rfc3RyYXRlZ3knO1xuaW1wb3J0IHtUaW1pbmdTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3RpbWluZy1zdHJhdGVneSc7XG5pbXBvcnQge1F1ZXJ5VXNhZ2VTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3VzYWdlX3N0cmF0ZWd5L3VzYWdlX3N0cmF0ZWd5JztcbmltcG9ydCB7Z2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5cbmVudW0gU0VMRUNURURfU1RSQVRFR1kge1xuICBURU1QTEFURSxcbiAgVVNBR0UsXG4gIFRFU1RTLFxufVxuXG5pbnRlcmZhY2UgQW5hbHl6ZWRQcm9qZWN0IHtcbiAgcHJvZ3JhbTogdHMuUHJvZ3JhbTtcbiAgaG9zdDogdHMuQ29tcGlsZXJIb3N0O1xuICBxdWVyeVZpc2l0b3I6IE5nUXVlcnlSZXNvbHZlVmlzaXRvcjtcbiAgc291cmNlRmlsZXM6IHRzLlNvdXJjZUZpbGVbXTtcbiAgYmFzZVBhdGg6IHN0cmluZztcbiAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyO1xuICB0c2NvbmZpZ1BhdGg6IHN0cmluZztcbn1cblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjggc3RhdGljLXF1ZXJ5IG1pZ3JhdGlvbi4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICAvLyBXZSBuZWVkIHRvIGNhc3QgdGhlIHJldHVybmVkIFwiT2JzZXJ2YWJsZVwiIHRvIFwiYW55XCIgYXMgdGhlcmUgaXMgYVxuICAgIC8vIFJ4SlMgdmVyc2lvbiBtaXNtYXRjaCB0aGF0IGJyZWFrcyB0aGUgVFMgY29tcGlsYXRpb24uXG4gICAgcmV0dXJuIGZyb20ocnVuTWlncmF0aW9uKHRyZWUsIGNvbnRleHQpLnRoZW4oKCkgPT4gdHJlZSkpIGFzIGFueTtcbiAgfTtcbn1cblxuLyoqIFJ1bnMgdGhlIFY4IG1pZ3JhdGlvbiBzdGF0aWMtcXVlcnkgbWlncmF0aW9uIGZvciBhbGwgZGV0ZXJtaW5lZCBUeXBlU2NyaXB0IHByb2plY3RzLiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuTWlncmF0aW9uKHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpIHtcbiAgY29uc3Qge2J1aWxkUGF0aHMsIHRlc3RQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcblxuICBsb2dnZXIuaW5mbygnLS0tLS0tIFN0YXRpYyBRdWVyeSBtaWdyYXRpb24gLS0tLS0tJyk7XG4gIGxvZ2dlci5pbmZvKCdXaXRoIEFuZ3VsYXIgdmVyc2lvbiA4LCBkZXZlbG9wZXJzIG5lZWQgdG8nKTtcbiAgbG9nZ2VyLmluZm8oJ2V4cGxpY2l0bHkgc3BlY2lmeSB0aGUgdGltaW5nIG9mIFZpZXdDaGlsZCBvcicpO1xuICBsb2dnZXIuaW5mbygnQ29udGVudENoaWxkIHF1ZXJpZXMuIFJlYWQgbW9yZSBhYm91dCB0aGlzIGhlcmU6Jyk7XG4gIGxvZ2dlci5pbmZvKCdodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvMjg4MTAnKTtcblxuICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgcXVlcmllcyAnICtcbiAgICAgICAgJ3RvIGV4cGxpY2l0IHRpbWluZy4nKTtcbiAgfVxuXG4gIGNvbnN0IGFuYWx5emVkRmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgYnVpbGRQcm9qZWN0cyA9IG5ldyBTZXQ8QW5hbHl6ZWRQcm9qZWN0PigpO1xuICBjb25zdCBmYWlsdXJlcyA9IFtdO1xuICBjb25zdCBzdHJhdGVneSA9IHByb2Nlc3MuZW52WydOR19TVEFUSUNfUVVFUllfVVNBR0VfU1RSQVRFR1knXSA9PT0gJ3RydWUnID9cbiAgICAgIFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFIDpcbiAgICAgIFNFTEVDVEVEX1NUUkFURUdZLlRFTVBMQVRFO1xuXG4gIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGJ1aWxkUGF0aHMpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gYW5hbHl6ZVByb2plY3QodHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgYW5hbHl6ZWRGaWxlcywgbG9nZ2VyKTtcbiAgICBpZiAocHJvamVjdCkge1xuICAgICAgYnVpbGRQcm9qZWN0cy5hZGQocHJvamVjdCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJ1aWxkUHJvamVjdHMuc2l6ZSkge1xuICAgIGZvciAobGV0IHByb2plY3Qgb2YgQXJyYXkuZnJvbShidWlsZFByb2plY3RzLnZhbHVlcygpKSkge1xuICAgICAgZmFpbHVyZXMucHVzaCguLi5hd2FpdCBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlLCBwcm9qZWN0LCBzdHJhdGVneSwgbG9nZ2VyKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gRm9yIHRoZSBcInRlc3RcIiB0c2NvbmZpZyBwcm9qZWN0cyB3ZSBhbHdheXMgd2FudCB0byB1c2UgdGhlIHRlc3Qgc3RyYXRlZ3kgYXNcbiAgLy8gd2UgY2FuJ3QgZGV0ZWN0IHRoZSBwcm9wZXIgdGltaW5nIHdpdGhpbiBzcGVjIGZpbGVzLlxuICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiB0ZXN0UGF0aHMpIHtcbiAgICBjb25zdCBwcm9qZWN0ID0gYXdhaXQgYW5hbHl6ZVByb2plY3QodHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgYW5hbHl6ZWRGaWxlcywgbG9nZ2VyKTtcbiAgICBpZiAocHJvamVjdCkge1xuICAgICAgZmFpbHVyZXMucHVzaChcbiAgICAgICAgICAuLi5hd2FpdCBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlLCBwcm9qZWN0LCBTRUxFQ1RFRF9TVFJBVEVHWS5URVNUUywgbG9nZ2VyKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgIGxvZ2dlci5pbmZvKCcnKTtcbiAgICBsb2dnZXIuaW5mbygnU29tZSBxdWVyaWVzIGNvdWxkIG5vdCBiZSBtaWdyYXRlZCBhdXRvbWF0aWNhbGx5LiBQbGVhc2UgZ28nKTtcbiAgICBsb2dnZXIuaW5mbygndGhyb3VnaCB0aG9zZSBtYW51YWxseSBhbmQgYXBwbHkgdGhlIGFwcHJvcHJpYXRlIHRpbWluZzonKTtcbiAgICBmYWlsdXJlcy5mb3JFYWNoKGZhaWx1cmUgPT4gbG9nZ2VyLndhcm4oYOKukSAgICR7ZmFpbHVyZX1gKSk7XG4gIH1cblxuICBsb2dnZXIuaW5mbygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG59XG5cbi8qKlxuICogQW5hbHl6ZXMgdGhlIGdpdmVuIFR5cGVTY3JpcHQgcHJvamVjdCBieSBsb29raW5nIGZvciBxdWVyaWVzIHRoYXQgbmVlZCB0byBiZVxuICogbWlncmF0ZWQuIEluIGNhc2UgdGhlcmUgYXJlIG5vIHF1ZXJpZXMgdGhhdCBjYW4gYmUgbWlncmF0ZWQsIG51bGwgaXMgcmV0dXJuZWQuXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVQcm9qZWN0KFxuICAgIHRyZWU6IFRyZWUsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBiYXNlUGF0aDogc3RyaW5nLCBhbmFseXplZEZpbGVzOiBTZXQ8c3RyaW5nPixcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpKTpcbiAgICBBbmFseXplZFByb2plY3R8bnVsbCB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVRzY29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIGRpcm5hbWUodHNjb25maWdQYXRoKSk7XG4gICAgICBjb25zdCBob3N0ID0gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KHBhcnNlZC5vcHRpb25zLCB0cnVlKTtcblxuICAgICAgLy8gV2UgbmVlZCB0byBvdmVyd3JpdGUgdGhlIGhvc3QgXCJyZWFkRmlsZVwiIG1ldGhvZCwgYXMgd2Ugd2FudCB0aGUgVHlwZVNjcmlwdFxuICAgICAgLy8gcHJvZ3JhbSB0byBiZSBiYXNlZCBvbiB0aGUgZmlsZSBjb250ZW50cyBpbiB0aGUgdmlydHVhbCBmaWxlIHRyZWUuIE90aGVyd2lzZVxuICAgICAgLy8gaWYgd2UgcnVuIHRoZSBtaWdyYXRpb24gZm9yIG11bHRpcGxlIHRzY29uZmlnIGZpbGVzIHdoaWNoIGhhdmUgaW50ZXJzZWN0aW5nXG4gICAgICAvLyBzb3VyY2UgZmlsZXMsIGl0IGNhbiBlbmQgdXAgdXBkYXRpbmcgcXVlcnkgZGVmaW5pdGlvbnMgbXVsdGlwbGUgdGltZXMuXG4gICAgICBob3N0LnJlYWRGaWxlID0gZmlsZU5hbWUgPT4ge1xuICAgICAgICBjb25zdCBidWZmZXIgPSB0cmVlLnJlYWQocmVsYXRpdmUoYmFzZVBhdGgsIGZpbGVOYW1lKSk7XG4gICAgICAgIHJldHVybiBidWZmZXIgPyBidWZmZXIudG9TdHJpbmcoKSA6IHVuZGVmaW5lZDtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHByb2dyYW0gPSB0cy5jcmVhdGVQcm9ncmFtKHBhcnNlZC5maWxlTmFtZXMsIHBhcnNlZC5vcHRpb25zLCBob3N0KTtcbiAgICAgIGNvbnN0IHN5bnRhY3RpY0RpYWdub3N0aWNzID0gcHJvZ3JhbS5nZXRTeW50YWN0aWNEaWFnbm9zdGljcygpO1xuXG4gICAgICAvLyBTeW50YWN0aWMgVHlwZVNjcmlwdCBlcnJvcnMgY2FuIHRocm93IG9mZiB0aGUgcXVlcnkgYW5hbHlzaXMgYW5kIHRoZXJlZm9yZSB3ZSB3YW50XG4gICAgICAvLyB0byBub3RpZnkgdGhlIGRldmVsb3BlciB0aGF0IHdlIGNvdWxkbid0IGFuYWx5emUgcGFydHMgb2YgdGhlIHByb2plY3QuIERldmVsb3BlcnNcbiAgICAgIC8vIGNhbiBqdXN0IHJlLXJ1biB0aGUgbWlncmF0aW9uIGFmdGVyIGZpeGluZyB0aGVzZSBmYWlsdXJlcy5cbiAgICAgIGlmIChzeW50YWN0aWNEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgICAgICBgXFxuVHlwZVNjcmlwdCBwcm9qZWN0IFwiJHt0c2NvbmZpZ1BhdGh9XCIgaGFzIHN5bnRhY3RpY2FsIGVycm9ycyB3aGljaCBjb3VsZCBjYXVzZSBgICtcbiAgICAgICAgICAgIGBhbiBpbmNvbXBsZXRlIG1pZ3JhdGlvbi4gUGxlYXNlIGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uOmApO1xuICAgICAgICBsb2dnZXIuZXJyb3IodHMuZm9ybWF0RGlhZ25vc3RpY3Moc3ludGFjdGljRGlhZ25vc3RpY3MsIGhvc3QpKTtcbiAgICAgICAgbG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAnTWlncmF0aW9uIGNhbiBiZSByZXJ1biB3aXRoOiBcIm5nIHVwZGF0ZSBAYW5ndWxhci9jb3JlIC0tZnJvbSA3IC0tdG8gOCAtLW1pZ3JhdGUtb25seVwiXFxuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICAgICAgY29uc3Qgc291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFNvdXJjZUZpbGVzKCkuZmlsdGVyKFxuICAgICAgICAgIGYgPT4gIWYuaXNEZWNsYXJhdGlvbkZpbGUgJiYgIXByb2dyYW0uaXNTb3VyY2VGaWxlRnJvbUV4dGVybmFsTGlicmFyeShmKSk7XG4gICAgICBjb25zdCBxdWVyeVZpc2l0b3IgPSBuZXcgTmdRdWVyeVJlc29sdmVWaXNpdG9yKHR5cGVDaGVja2VyKTtcblxuICAgICAgLy8gQW5hbHl6ZSBhbGwgcHJvamVjdCBzb3VyY2UtZmlsZXMgYW5kIGNvbGxlY3QgYWxsIHF1ZXJpZXMgdGhhdFxuICAgICAgLy8gbmVlZCB0byBiZSBtaWdyYXRlZC5cbiAgICAgIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiB7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcblxuICAgICAgICAvLyBPbmx5IGxvb2sgZm9yIHF1ZXJpZXMgd2l0aGluIHRoZSBjdXJyZW50IHNvdXJjZSBmaWxlcyBpZiB0aGVcbiAgICAgICAgLy8gZmlsZSBoYXMgbm90IGJlZW4gYW5hbHl6ZWQgYmVmb3JlLlxuICAgICAgICBpZiAoIWFuYWx5emVkRmlsZXMuaGFzKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgICAgICBhbmFseXplZEZpbGVzLmFkZChyZWxhdGl2ZVBhdGgpO1xuICAgICAgICAgIHF1ZXJ5VmlzaXRvci52aXNpdE5vZGUoc291cmNlRmlsZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAocXVlcnlWaXNpdG9yLnJlc29sdmVkUXVlcmllcy5zaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge3Byb2dyYW0sIGhvc3QsIHRzY29uZmlnUGF0aCwgdHlwZUNoZWNrZXIsIGJhc2VQYXRoLCBxdWVyeVZpc2l0b3IsIHNvdXJjZUZpbGVzfTtcbiAgICB9XG5cbi8qKlxuICogUnVucyB0aGUgc3RhdGljIHF1ZXJ5IG1pZ3JhdGlvbiBmb3IgdGhlIGdpdmVuIHByb2plY3QuIFRoZSBzY2hlbWF0aWMgYW5hbHl6ZXMgYWxsXG4gKiBxdWVyaWVzIHdpdGhpbiB0aGUgcHJvamVjdCBhbmQgc2V0cyB1cCB0aGUgcXVlcnkgdGltaW5nIGJhc2VkIG9uIHRoZSBjdXJyZW50IHVzYWdlXG4gKiBvZiB0aGUgcXVlcnkgcHJvcGVydHkuIGUuZy4gYSB2aWV3IHF1ZXJ5IHRoYXQgaXMgbm90IHVzZWQgaW4gYW55IGxpZmVjeWNsZSBob29rIGRvZXNcbiAqIG5vdCBuZWVkIHRvIGJlIHN0YXRpYyBhbmQgY2FuIGJlIHNldCB1cCB3aXRoIFwic3RhdGljOiBmYWxzZVwiLlxuICovXG5hc3luYyBmdW5jdGlvbiBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCBwcm9qZWN0OiBBbmFseXplZFByb2plY3QsIHNlbGVjdGVkU3RyYXRlZ3k6IFNFTEVDVEVEX1NUUkFURUdZLFxuICAgIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGkpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGNvbnN0IHtzb3VyY2VGaWxlcywgdHlwZUNoZWNrZXIsIGhvc3QsIHF1ZXJ5VmlzaXRvciwgdHNjb25maWdQYXRoLCBiYXNlUGF0aH0gPSBwcm9qZWN0O1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBjb25zdCBmYWlsdXJlTWVzc2FnZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHRlbXBsYXRlVmlzaXRvciA9IG5ldyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG5cbiAgLy8gSWYgdGhlIFwidXNhZ2VcIiBzdHJhdGVneSBpcyBzZWxlY3RlZCwgd2UgYWxzbyBuZWVkIHRvIGFkZCB0aGUgcXVlcnkgdmlzaXRvclxuICAvLyB0byB0aGUgYW5hbHlzaXMgdmlzaXRvcnMgc28gdGhhdCBxdWVyeSB1c2FnZSBpbiB0ZW1wbGF0ZXMgY2FuIGJlIGFsc28gY2hlY2tlZC5cbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgc291cmNlRmlsZXMuZm9yRWFjaChzID0+IHRlbXBsYXRlVmlzaXRvci52aXNpdE5vZGUocykpO1xuICB9XG5cbiAgY29uc3Qge3Jlc29sdmVkUXVlcmllcywgY2xhc3NNZXRhZGF0YX0gPSBxdWVyeVZpc2l0b3I7XG4gIGNvbnN0IHtyZXNvbHZlZFRlbXBsYXRlc30gPSB0ZW1wbGF0ZVZpc2l0b3I7XG5cbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgLy8gQWRkIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgdG8gdGhlIGNsYXNzIG1ldGFkYXRhIGlmIHRoZSB1c2FnZSBzdHJhdGVneSBpcyB1c2VkLiBUaGlzXG4gICAgLy8gaXMgbmVjZXNzYXJ5IGluIG9yZGVyIHRvIGJlIGFibGUgdG8gY2hlY2sgY29tcG9uZW50IHRlbXBsYXRlcyBmb3Igc3RhdGljIHF1ZXJ5IHVzYWdlLlxuICAgIHJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgICAgaWYgKGNsYXNzTWV0YWRhdGEuaGFzKHRlbXBsYXRlLmNvbnRhaW5lcikpIHtcbiAgICAgICAgY2xhc3NNZXRhZGF0YS5nZXQodGVtcGxhdGUuY29udGFpbmVyKSAhLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBsZXQgc3RyYXRlZ3k6IFRpbWluZ1N0cmF0ZWd5O1xuICBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVVNBR0UpIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVVzYWdlU3RyYXRlZ3koY2xhc3NNZXRhZGF0YSwgdHlwZUNoZWNrZXIpO1xuICB9IGVsc2UgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlRFU1RTKSB7XG4gICAgc3RyYXRlZ3kgPSBuZXcgUXVlcnlUZXN0U3RyYXRlZ3koKTtcbiAgfSBlbHNlIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVRlbXBsYXRlU3RyYXRlZ3kodHNjb25maWdQYXRoLCBjbGFzc01ldGFkYXRhLCBob3N0KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgc3RyYXRlZ3kuc2V0dXAoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5URU1QTEFURSkge1xuICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgICAgYFxcblRoZSB0ZW1wbGF0ZSBtaWdyYXRpb24gc3RyYXRlZ3kgdXNlcyB0aGUgQW5ndWxhciBjb21waWxlciBgICtcbiAgICAgICAgICBgaW50ZXJuYWxseSBhbmQgdGhlcmVmb3JlIHByb2plY3RzIHRoYXQgbm8gbG9uZ2VyIGJ1aWxkIHN1Y2Nlc3NmdWxseSBhZnRlciBgICtcbiAgICAgICAgICBgdGhlIHVwZGF0ZSBjYW5ub3QgdXNlIHRoZSB0ZW1wbGF0ZSBtaWdyYXRpb24gc3RyYXRlZ3kuIFBsZWFzZSBlbnN1cmUgYCArXG4gICAgICAgICAgYHRoZXJlIGFyZSBubyBBT1QgY29tcGlsYXRpb24gZXJyb3JzLlxcbmApO1xuICAgIH1cbiAgICAvLyBJbiBjYXNlIHRoZSBzdHJhdGVneSBjb3VsZCBub3QgYmUgc2V0IHVwIHByb3Blcmx5LCB3ZSBqdXN0IGV4aXQgdGhlXG4gICAgLy8gbWlncmF0aW9uLiBXZSBkb24ndCB3YW50IHRvIHRocm93IGFuIGV4Y2VwdGlvbiBhcyB0aGlzIGNvdWxkIG1lYW5cbiAgICAvLyB0aGF0IG90aGVyIG1pZ3JhdGlvbnMgYXJlIGludGVycnVwdGVkLlxuICAgIGxvZ2dlci53YXJuKFxuICAgICAgICBgQ291bGQgbm90IHNldHVwIG1pZ3JhdGlvbiBzdHJhdGVneSBmb3IgXCIke3Byb2plY3QudHNjb25maWdQYXRofVwiLiBUaGUgYCArXG4gICAgICAgIGBmb2xsb3dpbmcgZXJyb3IgaGFzIGJlZW4gcmVwb3J0ZWQ6XFxuYCk7XG4gICAgbG9nZ2VyLmVycm9yKGAke2UudG9TdHJpbmcoKX1cXG5gKTtcbiAgICBsb2dnZXIuaW5mbyhcbiAgICAgICAgJ01pZ3JhdGlvbiBjYW4gYmUgcmVydW4gd2l0aDogXCJuZyB1cGRhdGUgQGFuZ3VsYXIvY29yZSAtLWZyb20gNyAtLXRvIDggLS1taWdyYXRlLW9ubHlcIlxcbicpO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIHRoYXQgY29udGFpbiByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGVcbiAgLy8gdGhlIHNvdXJjZSBmaWxlcyBpZiBuZWVkZWQuIE5vdGUgdGhhdCB3ZSBuZWVkIHRvIHVwZGF0ZSBtdWx0aXBsZSBxdWVyaWVzXG4gIC8vIHdpdGhpbiBhIHNvdXJjZSBmaWxlIHdpdGhpbiB0aGUgc2FtZSByZWNvcmRlciBpbiBvcmRlciB0byBub3QgdGhyb3cgb2ZmXG4gIC8vIHRoZSBUeXBlU2NyaXB0IG5vZGUgb2Zmc2V0cy5cbiAgcmVzb2x2ZWRRdWVyaWVzLmZvckVhY2goKHF1ZXJpZXMsIHNvdXJjZUZpbGUpID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZVBhdGgpO1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgcXVlcnkgdGltaW5nIGZvciBhbGwgcmVzb2x2ZWQgcXVlcmllcyBhbmQgdXBkYXRlIHRoZVxuICAgIC8vIHF1ZXJ5IGRlZmluaXRpb25zIHRvIGV4cGxpY2l0bHkgc2V0IHRoZSBkZXRlcm1pbmVkIHF1ZXJ5IHRpbWluZy5cbiAgICBxdWVyaWVzLmZvckVhY2gocSA9PiB7XG4gICAgICBjb25zdCBxdWVyeUV4cHIgPSBxLmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgICBjb25zdCB7dGltaW5nLCBtZXNzYWdlfSA9IHN0cmF0ZWd5LmRldGVjdFRpbWluZyhxKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcihxLCB0aW1pbmcsICEhbWVzc2FnZSk7XG5cbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3VGV4dCA9IHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCByZXN1bHQubm9kZSwgc291cmNlRmlsZSk7XG5cbiAgICAgIC8vIFJlcGxhY2UgdGhlIGV4aXN0aW5nIHF1ZXJ5IGRlY29yYXRvciBjYWxsIGV4cHJlc3Npb24gd2l0aCB0aGUgdXBkYXRlZFxuICAgICAgLy8gY2FsbCBleHByZXNzaW9uIG5vZGUuXG4gICAgICB1cGRhdGUucmVtb3ZlKHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBxdWVyeUV4cHIuZ2V0V2lkdGgoKSk7XG4gICAgICB1cGRhdGUuaW5zZXJ0UmlnaHQocXVlcnlFeHByLmdldFN0YXJ0KCksIG5ld1RleHQpO1xuXG4gICAgICBpZiAocmVzdWx0LmZhaWx1cmVNZXNzYWdlIHx8IG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgcS5kZWNvcmF0b3Iubm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgZmFpbHVyZU1lc3NhZ2VzLnB1c2goXG4gICAgICAgICAgICBgJHtyZWxhdGl2ZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX06ICR7cmVzdWx0LmZhaWx1cmVNZXNzYWdlIHx8IG1lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcblxuICByZXR1cm4gZmFpbHVyZU1lc3NhZ2VzO1xufVxuIl19