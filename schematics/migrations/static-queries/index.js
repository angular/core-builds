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
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "rxjs", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/schematics_prompt", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/utils/typescript/visit_nodes", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", "@angular/core/schematics/migrations/static-queries/strategies/test_strategy/test_strategy", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy", "@angular/core/schematics/migrations/static-queries/transform"], factory);
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
    const schematics_prompt_1 = require("@angular/core/schematics/utils/schematics_prompt");
    const parse_tsconfig_1 = require("@angular/core/schematics/utils/typescript/parse_tsconfig");
    const visit_nodes_1 = require("@angular/core/schematics/utils/typescript/visit_nodes");
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
    })(SELECTED_STRATEGY = exports.SELECTED_STRATEGY || (exports.SELECTED_STRATEGY = {}));
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
            logger.info('In preparation for Ivy, developers can now explicitly specify the');
            logger.info('timing of their queries. Read more about this here:');
            logger.info('https://github.com/angular/angular/pull/28810');
            logger.info('');
            if (!buildPaths.length && !testPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate queries ' +
                    'to explicit timing.');
            }
            // In case prompts are supported, determine the desired migration strategy
            // by creating a choice prompt. By default the template strategy is used.
            let selectedStrategy = SELECTED_STRATEGY.TEMPLATE;
            if (schematics_prompt_1.supportsPrompt()) {
                logger.info('There are two available migration strategies that can be selected:');
                logger.info('  • Template strategy  -  migration tool (short-term gains, rare corrections)');
                logger.info('  • Usage strategy  -  best practices (long-term gains, manual corrections)');
                logger.info('For an easy migration, the template strategy is recommended. The usage');
                logger.info('strategy can be used for best practices and a code base that will be more');
                logger.info('flexible to changes going forward.');
                const { strategyName } = yield schematics_prompt_1.getInquirer().prompt({
                    type: 'list',
                    name: 'strategyName',
                    message: 'What migration strategy do you want to use?',
                    choices: [
                        { name: 'Template strategy', value: 'template' }, { name: 'Usage strategy', value: 'usage' }
                    ],
                    default: 'template',
                });
                logger.info('');
                selectedStrategy =
                    strategyName === 'usage' ? SELECTED_STRATEGY.USAGE : SELECTED_STRATEGY.TEMPLATE;
            }
            else {
                // In case prompts are not supported, we still want to allow developers to opt
                // into the usage strategy by specifying an environment variable. The tests also
                // use the environment variable as there is no headless way to select via prompt.
                selectedStrategy = !!process.env['NG_STATIC_QUERY_USAGE_STRATEGY'] ? SELECTED_STRATEGY.USAGE :
                    SELECTED_STRATEGY.TEMPLATE;
            }
            const failures = [];
            for (const tsconfigPath of buildPaths) {
                failures.push(...yield runStaticQueryMigration(tree, tsconfigPath, basePath, selectedStrategy));
            }
            // For the "test" tsconfig projects we always want to use the test strategy as
            // we can't detect the proper timing within spec files.
            for (const tsconfigPath of testPaths) {
                failures.push(...yield runStaticQueryMigration(tree, tsconfigPath, basePath, SELECTED_STRATEGY.TESTS));
            }
            if (failures.length) {
                logger.info('Some queries cannot be migrated automatically. Please go through');
                logger.info('those manually and apply the appropriate timing:');
                failures.forEach(failure => logger.warn(`⮑   ${failure}`));
            }
            logger.info('------------------------------------------------');
        });
    }
    /**
     * Runs the static query migration for the given TypeScript project. The schematic
     * analyzes all queries within the project and sets up the query timing based on
     * the current usage of the query property. e.g. a view query that is not used in any
     * lifecycle hook does not need to be static and can be set up with "static: false".
     */
    function runStaticQueryMigration(tree, tsconfigPath, basePath, selectedStrategy) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const typeChecker = program.getTypeChecker();
            const queryVisitor = new ng_query_visitor_1.NgQueryResolveVisitor(typeChecker);
            const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker);
            const rootSourceFiles = program.getRootFileNames().map(f => program.getSourceFile(f));
            const printer = ts.createPrinter();
            const analysisVisitors = [queryVisitor];
            const failureMessages = [];
            // If the "usage" strategy is selected, we also need to add the query visitor
            // to the analysis visitors so that query usage in templates can be also checked.
            if (selectedStrategy === SELECTED_STRATEGY.USAGE) {
                analysisVisitors.push(templateVisitor);
            }
            rootSourceFiles.forEach(sourceFile => {
                // The visit utility function only traverses a source file once. We don't want to
                // traverse through all source files multiple times for each visitor as this could be
                // slow.
                visit_nodes_1.visitAllNodes(sourceFile, analysisVisitors);
            });
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
            // In case the strategy could not be set up properly, we just exit the
            // migration. We don't want to throw an exception as this could mean
            // that other migrations are interrupted.
            if (!strategy.setup()) {
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
                    const transformedNode = transform_1.getTransformedQueryCallExpr(q, timing, !!message);
                    if (!transformedNode) {
                        return;
                    }
                    const newText = printer.printNode(ts.EmitHint.Unspecified, transformedNode, sourceFile);
                    // Replace the existing query decorator call expression with the updated
                    // call expression node.
                    update.remove(queryExpr.getStart(), queryExpr.getWidth());
                    update.insertRight(queryExpr.getStart(), newText);
                    if (message) {
                        const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, q.decorator.node.getStart());
                        failureMessages.push(`${relativePath}@${line + 1}:${character + 1}: ${message}`);
                    }
                });
                tree.commitUpdate(update);
            });
            return failureMessages;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsMkRBQTZGO0lBQzdGLCtCQUF1QztJQUN2QywrQkFBMEI7SUFDMUIsaUNBQWlDO0lBRWpDLGdHQUE2RTtJQUM3RSxrR0FBMkU7SUFDM0Usd0ZBQTBFO0lBQzFFLDZGQUF3RTtJQUN4RSx1RkFBb0Y7SUFFcEYsa0hBQWlFO0lBQ2pFLHlJQUF1RjtJQUN2Riw2SEFBMkU7SUFFM0UsZ0lBQThFO0lBQzlFLDRGQUF3RDtJQUV4RCxJQUFZLGlCQUlYO0lBSkQsV0FBWSxpQkFBaUI7UUFDM0IsaUVBQVEsQ0FBQTtRQUNSLDJEQUFLLENBQUE7UUFDTCwyREFBSyxDQUFBO0lBQ1AsQ0FBQyxFQUpXLGlCQUFpQixHQUFqQix5QkFBaUIsS0FBakIseUJBQWlCLFFBSTVCO0lBRUQscURBQXFEO0lBQ3JEO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxPQUF5QixFQUFFLEVBQUU7WUFDL0MsbUVBQW1FO1lBQ25FLHdEQUF3RDtZQUN4RCxPQUFPLFdBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBUSxDQUFDO1FBQ25FLENBQUMsQ0FBQztJQUNKLENBQUM7SUFORCw0QkFNQztJQUVELDJGQUEyRjtJQUMzRixTQUFlLFlBQVksQ0FBQyxJQUFVLEVBQUUsT0FBeUI7O1lBQy9ELE1BQU0sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFDLEdBQUcsZ0RBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxJQUFJLENBQUMsbUVBQW1FLENBQUMsQ0FBQztZQUNqRixNQUFNLENBQUMsSUFBSSxDQUFDLHFEQUFxRCxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLElBQUksQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxNQUFNLElBQUksZ0NBQW1CLENBQ3pCLDJEQUEyRDtvQkFDM0QscUJBQXFCLENBQUMsQ0FBQzthQUM1QjtZQUVELDBFQUEwRTtZQUMxRSx5RUFBeUU7WUFDekUsSUFBSSxnQkFBZ0IsR0FBc0IsaUJBQWlCLENBQUMsUUFBUSxDQUFDO1lBQ3JFLElBQUksa0NBQWMsRUFBRSxFQUFFO2dCQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLG9FQUFvRSxDQUFDLENBQUM7Z0JBQ2xGLE1BQU0sQ0FBQyxJQUFJLENBQUMsK0VBQStFLENBQUMsQ0FBQztnQkFDN0YsTUFBTSxDQUFDLElBQUksQ0FBQyw2RUFBNkUsQ0FBQyxDQUFDO2dCQUMzRixNQUFNLENBQUMsSUFBSSxDQUFDLHdFQUF3RSxDQUFDLENBQUM7Z0JBQ3RGLE1BQU0sQ0FBQyxJQUFJLENBQUMsMkVBQTJFLENBQUMsQ0FBQztnQkFDekYsTUFBTSxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLEVBQUMsWUFBWSxFQUFDLEdBQUcsTUFBTSwrQkFBVyxFQUFFLENBQUMsTUFBTSxDQUF5QjtvQkFDeEUsSUFBSSxFQUFFLE1BQU07b0JBQ1osSUFBSSxFQUFFLGNBQWM7b0JBQ3BCLE9BQU8sRUFBRSw2Q0FBNkM7b0JBQ3RELE9BQU8sRUFBRTt3QkFDUCxFQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBQztxQkFDekY7b0JBQ0QsT0FBTyxFQUFFLFVBQVU7aUJBQ3BCLENBQUMsQ0FBQztnQkFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQixnQkFBZ0I7b0JBQ1osWUFBWSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7YUFDckY7aUJBQU07Z0JBQ0wsOEVBQThFO2dCQUM5RSxnRkFBZ0Y7Z0JBQ2hGLGlGQUFpRjtnQkFDakYsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3pCLGlCQUFpQixDQUFDLFFBQVEsQ0FBQzthQUNqRztZQUVELE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUVwQixLQUFLLE1BQU0sWUFBWSxJQUFJLFVBQVUsRUFBRTtnQkFDckMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sdUJBQXVCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO2FBQ2pHO1lBQ0QsOEVBQThFO1lBQzlFLHVEQUF1RDtZQUN2RCxLQUFLLE1BQU0sWUFBWSxJQUFJLFNBQVMsRUFBRTtnQkFDcEMsUUFBUSxDQUFDLElBQUksQ0FDVCxHQUFHLE1BQU0sdUJBQXVCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUM5RjtZQUVELElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxrRUFBa0UsQ0FBQyxDQUFDO2dCQUNoRixNQUFNLENBQUMsSUFBSSxDQUFDLGtEQUFrRCxDQUFDLENBQUM7Z0JBQ2hFLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQzVEO1lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7S0FBQTtJQUVEOzs7OztPQUtHO0lBQ0gsU0FBZSx1QkFBdUIsQ0FDbEMsSUFBVSxFQUFFLFlBQW9CLEVBQUUsUUFBZ0IsRUFBRSxnQkFBbUM7O1lBQ3pGLE1BQU0sTUFBTSxHQUFHLGtDQUFpQixDQUFDLFlBQVksRUFBRSxjQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV6RCw2RUFBNkU7WUFDN0UsK0VBQStFO1lBQy9FLDhFQUE4RTtZQUM5RSx5RUFBeUU7WUFDekUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsRUFBRTtnQkFDekIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNoRCxDQUFDLENBQUM7WUFFRixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDN0MsTUFBTSxZQUFZLEdBQUcsSUFBSSx3Q0FBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM1RCxNQUFNLGVBQWUsR0FBRyxJQUFJLGtEQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFHLENBQUMsQ0FBQztZQUN4RixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbkMsTUFBTSxnQkFBZ0IsR0FBd0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM3RCxNQUFNLGVBQWUsR0FBYSxFQUFFLENBQUM7WUFFckMsNkVBQTZFO1lBQzdFLGlGQUFpRjtZQUNqRixJQUFJLGdCQUFnQixLQUFLLGlCQUFpQixDQUFDLEtBQUssRUFBRTtnQkFDaEQsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2FBQ3hDO1lBRUQsZUFBZSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDbkMsaUZBQWlGO2dCQUNqRixxRkFBcUY7Z0JBQ3JGLFFBQVE7Z0JBQ1IsMkJBQWEsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sRUFBQyxlQUFlLEVBQUUsYUFBYSxFQUFDLEdBQUcsWUFBWSxDQUFDO1lBQ3RELE1BQU0sRUFBQyxpQkFBaUIsRUFBQyxHQUFHLGVBQWUsQ0FBQztZQUU1QyxJQUFJLGdCQUFnQixLQUFLLGlCQUFpQixDQUFDLEtBQUssRUFBRTtnQkFDaEQsdUZBQXVGO2dCQUN2Rix3RkFBd0Y7Z0JBQ3hGLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDbkMsSUFBSSxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTt3QkFDekMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFHLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztxQkFDN0Q7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7YUFDSjtZQUVELElBQUksUUFBd0IsQ0FBQztZQUM3QixJQUFJLGdCQUFnQixLQUFLLGlCQUFpQixDQUFDLEtBQUssRUFBRTtnQkFDaEQsUUFBUSxHQUFHLElBQUksbUNBQWtCLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQy9EO2lCQUFNLElBQUksZ0JBQWdCLEtBQUssaUJBQWlCLENBQUMsS0FBSyxFQUFFO2dCQUN2RCxRQUFRLEdBQUcsSUFBSSxpQ0FBaUIsRUFBRSxDQUFDO2FBQ3BDO2lCQUFNO2dCQUNMLFFBQVEsR0FBRyxJQUFJLHlDQUFxQixDQUFDLFlBQVksRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDekU7WUFFRCxzRUFBc0U7WUFDdEUsb0VBQW9FO1lBQ3BFLHlDQUF5QztZQUN6QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNyQixPQUFPLEVBQUUsQ0FBQzthQUNYO1lBRUQseUVBQXlFO1lBQ3pFLDJFQUEyRTtZQUMzRSwwRUFBMEU7WUFDMUUsK0JBQStCO1lBQy9CLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEVBQUU7Z0JBQzlDLE1BQU0sWUFBWSxHQUFHLGVBQVEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUU5QyxtRUFBbUU7Z0JBQ25FLG1FQUFtRTtnQkFDbkUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDbEIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO29CQUM5QyxNQUFNLEVBQUMsTUFBTSxFQUFFLE9BQU8sRUFBQyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25ELE1BQU0sZUFBZSxHQUFHLHVDQUEyQixDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUUxRSxJQUFJLENBQUMsZUFBZSxFQUFFO3dCQUNwQixPQUFPO3FCQUNSO29CQUVELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUV4Rix3RUFBd0U7b0JBQ3hFLHdCQUF3QjtvQkFDeEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUVsRCxJQUFJLE9BQU8sRUFBRTt3QkFDWCxNQUFNLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxHQUNuQixFQUFFLENBQUMsNkJBQTZCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7d0JBQzlFLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7cUJBQ2xGO2dCQUNILENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLGVBQWUsQ0FBQztRQUN6QixDQUFDO0tBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtkaXJuYW1lLCByZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQge2Zyb219IGZyb20gJ3J4anMnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7TmdDb21wb25lbnRUZW1wbGF0ZVZpc2l0b3J9IGZyb20gJy4uLy4uL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZSc7XG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Z2V0SW5xdWlyZXIsIHN1cHBvcnRzUHJvbXB0fSBmcm9tICcuLi8uLi91dGlscy9zY2hlbWF0aWNzX3Byb21wdCc7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3BhcnNlX3RzY29uZmlnJztcbmltcG9ydCB7VHlwZVNjcmlwdFZpc2l0b3IsIHZpc2l0QWxsTm9kZXN9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvdmlzaXRfbm9kZXMnO1xuXG5pbXBvcnQge05nUXVlcnlSZXNvbHZlVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtRdWVyeVRlbXBsYXRlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90ZW1wbGF0ZV9zdHJhdGVneS90ZW1wbGF0ZV9zdHJhdGVneSc7XG5pbXBvcnQge1F1ZXJ5VGVzdFN0cmF0ZWd5fSBmcm9tICcuL3N0cmF0ZWdpZXMvdGVzdF9zdHJhdGVneS90ZXN0X3N0cmF0ZWd5JztcbmltcG9ydCB7VGltaW5nU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy90aW1pbmctc3RyYXRlZ3knO1xuaW1wb3J0IHtRdWVyeVVzYWdlU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ2llcy91c2FnZV9zdHJhdGVneS91c2FnZV9zdHJhdGVneSc7XG5pbXBvcnQge2dldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcn0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuXG5leHBvcnQgZW51bSBTRUxFQ1RFRF9TVFJBVEVHWSB7XG4gIFRFTVBMQVRFLFxuICBVU0FHRSxcbiAgVEVTVFMsXG59XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFY4IHN0YXRpYy1xdWVyeSBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgLy8gV2UgbmVlZCB0byBjYXN0IHRoZSByZXR1cm5lZCBcIk9ic2VydmFibGVcIiB0byBcImFueVwiIGFzIHRoZXJlIGlzIGFcbiAgICAvLyBSeEpTIHZlcnNpb24gbWlzbWF0Y2ggdGhhdCBicmVha3MgdGhlIFRTIGNvbXBpbGF0aW9uLlxuICAgIHJldHVybiBmcm9tKHJ1bk1pZ3JhdGlvbih0cmVlLCBjb250ZXh0KS50aGVuKCgpID0+IHRyZWUpKSBhcyBhbnk7XG4gIH07XG59XG5cbi8qKiBSdW5zIHRoZSBWOCBtaWdyYXRpb24gc3RhdGljLXF1ZXJ5IG1pZ3JhdGlvbiBmb3IgYWxsIGRldGVybWluZWQgVHlwZVNjcmlwdCBwcm9qZWN0cy4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJ1bk1pZ3JhdGlvbih0cmVlOiBUcmVlLCBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0KSB7XG4gIGNvbnN0IHtidWlsZFBhdGhzLCB0ZXN0UGF0aHN9ID0gZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG5cbiAgbG9nZ2VyLmluZm8oJy0tLS0tLSBTdGF0aWMgUXVlcnkgbWlncmF0aW9uIC0tLS0tLScpO1xuICBsb2dnZXIuaW5mbygnSW4gcHJlcGFyYXRpb24gZm9yIEl2eSwgZGV2ZWxvcGVycyBjYW4gbm93IGV4cGxpY2l0bHkgc3BlY2lmeSB0aGUnKTtcbiAgbG9nZ2VyLmluZm8oJ3RpbWluZyBvZiB0aGVpciBxdWVyaWVzLiBSZWFkIG1vcmUgYWJvdXQgdGhpcyBoZXJlOicpO1xuICBsb2dnZXIuaW5mbygnaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzI4ODEwJyk7XG4gIGxvZ2dlci5pbmZvKCcnKTtcblxuICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoICYmICF0ZXN0UGF0aHMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgcXVlcmllcyAnICtcbiAgICAgICAgJ3RvIGV4cGxpY2l0IHRpbWluZy4nKTtcbiAgfVxuXG4gIC8vIEluIGNhc2UgcHJvbXB0cyBhcmUgc3VwcG9ydGVkLCBkZXRlcm1pbmUgdGhlIGRlc2lyZWQgbWlncmF0aW9uIHN0cmF0ZWd5XG4gIC8vIGJ5IGNyZWF0aW5nIGEgY2hvaWNlIHByb21wdC4gQnkgZGVmYXVsdCB0aGUgdGVtcGxhdGUgc3RyYXRlZ3kgaXMgdXNlZC5cbiAgbGV0IHNlbGVjdGVkU3RyYXRlZ3k6IFNFTEVDVEVEX1NUUkFURUdZID0gU0VMRUNURURfU1RSQVRFR1kuVEVNUExBVEU7XG4gIGlmIChzdXBwb3J0c1Byb21wdCgpKSB7XG4gICAgbG9nZ2VyLmluZm8oJ1RoZXJlIGFyZSB0d28gYXZhaWxhYmxlIG1pZ3JhdGlvbiBzdHJhdGVnaWVzIHRoYXQgY2FuIGJlIHNlbGVjdGVkOicpO1xuICAgIGxvZ2dlci5pbmZvKCcgIOKAoiBUZW1wbGF0ZSBzdHJhdGVneSAgLSAgbWlncmF0aW9uIHRvb2wgKHNob3J0LXRlcm0gZ2FpbnMsIHJhcmUgY29ycmVjdGlvbnMpJyk7XG4gICAgbG9nZ2VyLmluZm8oJyAg4oCiIFVzYWdlIHN0cmF0ZWd5ICAtICBiZXN0IHByYWN0aWNlcyAobG9uZy10ZXJtIGdhaW5zLCBtYW51YWwgY29ycmVjdGlvbnMpJyk7XG4gICAgbG9nZ2VyLmluZm8oJ0ZvciBhbiBlYXN5IG1pZ3JhdGlvbiwgdGhlIHRlbXBsYXRlIHN0cmF0ZWd5IGlzIHJlY29tbWVuZGVkLiBUaGUgdXNhZ2UnKTtcbiAgICBsb2dnZXIuaW5mbygnc3RyYXRlZ3kgY2FuIGJlIHVzZWQgZm9yIGJlc3QgcHJhY3RpY2VzIGFuZCBhIGNvZGUgYmFzZSB0aGF0IHdpbGwgYmUgbW9yZScpO1xuICAgIGxvZ2dlci5pbmZvKCdmbGV4aWJsZSB0byBjaGFuZ2VzIGdvaW5nIGZvcndhcmQuJyk7XG4gICAgY29uc3Qge3N0cmF0ZWd5TmFtZX0gPSBhd2FpdCBnZXRJbnF1aXJlcigpLnByb21wdDx7c3RyYXRlZ3lOYW1lOiBzdHJpbmd9Pih7XG4gICAgICB0eXBlOiAnbGlzdCcsXG4gICAgICBuYW1lOiAnc3RyYXRlZ3lOYW1lJyxcbiAgICAgIG1lc3NhZ2U6ICdXaGF0IG1pZ3JhdGlvbiBzdHJhdGVneSBkbyB5b3Ugd2FudCB0byB1c2U/JyxcbiAgICAgIGNob2ljZXM6IFtcbiAgICAgICAge25hbWU6ICdUZW1wbGF0ZSBzdHJhdGVneScsIHZhbHVlOiAndGVtcGxhdGUnfSwge25hbWU6ICdVc2FnZSBzdHJhdGVneScsIHZhbHVlOiAndXNhZ2UnfVxuICAgICAgXSxcbiAgICAgIGRlZmF1bHQ6ICd0ZW1wbGF0ZScsXG4gICAgfSk7XG4gICAgbG9nZ2VyLmluZm8oJycpO1xuICAgIHNlbGVjdGVkU3RyYXRlZ3kgPVxuICAgICAgICBzdHJhdGVneU5hbWUgPT09ICd1c2FnZScgPyBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSA6IFNFTEVDVEVEX1NUUkFURUdZLlRFTVBMQVRFO1xuICB9IGVsc2Uge1xuICAgIC8vIEluIGNhc2UgcHJvbXB0cyBhcmUgbm90IHN1cHBvcnRlZCwgd2Ugc3RpbGwgd2FudCB0byBhbGxvdyBkZXZlbG9wZXJzIHRvIG9wdFxuICAgIC8vIGludG8gdGhlIHVzYWdlIHN0cmF0ZWd5IGJ5IHNwZWNpZnlpbmcgYW4gZW52aXJvbm1lbnQgdmFyaWFibGUuIFRoZSB0ZXN0cyBhbHNvXG4gICAgLy8gdXNlIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZSBhcyB0aGVyZSBpcyBubyBoZWFkbGVzcyB3YXkgdG8gc2VsZWN0IHZpYSBwcm9tcHQuXG4gICAgc2VsZWN0ZWRTdHJhdGVneSA9ICEhcHJvY2Vzcy5lbnZbJ05HX1NUQVRJQ19RVUVSWV9VU0FHRV9TVFJBVEVHWSddID8gU0VMRUNURURfU1RSQVRFR1kuVVNBR0UgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNFTEVDVEVEX1NUUkFURUdZLlRFTVBMQVRFO1xuICB9XG5cbiAgY29uc3QgZmFpbHVyZXMgPSBbXTtcblxuICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBidWlsZFBhdGhzKSB7XG4gICAgZmFpbHVyZXMucHVzaCguLi5hd2FpdCBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBzZWxlY3RlZFN0cmF0ZWd5KSk7XG4gIH1cbiAgLy8gRm9yIHRoZSBcInRlc3RcIiB0c2NvbmZpZyBwcm9qZWN0cyB3ZSBhbHdheXMgd2FudCB0byB1c2UgdGhlIHRlc3Qgc3RyYXRlZ3kgYXNcbiAgLy8gd2UgY2FuJ3QgZGV0ZWN0IHRoZSBwcm9wZXIgdGltaW5nIHdpdGhpbiBzcGVjIGZpbGVzLlxuICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiB0ZXN0UGF0aHMpIHtcbiAgICBmYWlsdXJlcy5wdXNoKFxuICAgICAgICAuLi5hd2FpdCBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBTRUxFQ1RFRF9TVFJBVEVHWS5URVNUUykpO1xuICB9XG5cbiAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgIGxvZ2dlci5pbmZvKCdTb21lIHF1ZXJpZXMgY2Fubm90IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuIFBsZWFzZSBnbyB0aHJvdWdoJyk7XG4gICAgbG9nZ2VyLmluZm8oJ3Rob3NlIG1hbnVhbGx5IGFuZCBhcHBseSB0aGUgYXBwcm9wcmlhdGUgdGltaW5nOicpO1xuICAgIGZhaWx1cmVzLmZvckVhY2goZmFpbHVyZSA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmYWlsdXJlfWApKTtcbiAgfVxuXG4gIGxvZ2dlci5pbmZvKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbn1cblxuLyoqXG4gKiBSdW5zIHRoZSBzdGF0aWMgcXVlcnkgbWlncmF0aW9uIGZvciB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBwcm9qZWN0LiBUaGUgc2NoZW1hdGljXG4gKiBhbmFseXplcyBhbGwgcXVlcmllcyB3aXRoaW4gdGhlIHByb2plY3QgYW5kIHNldHMgdXAgdGhlIHF1ZXJ5IHRpbWluZyBiYXNlZCBvblxuICogdGhlIGN1cnJlbnQgdXNhZ2Ugb2YgdGhlIHF1ZXJ5IHByb3BlcnR5LiBlLmcuIGEgdmlldyBxdWVyeSB0aGF0IGlzIG5vdCB1c2VkIGluIGFueVxuICogbGlmZWN5Y2xlIGhvb2sgZG9lcyBub3QgbmVlZCB0byBiZSBzdGF0aWMgYW5kIGNhbiBiZSBzZXQgdXAgd2l0aCBcInN0YXRpYzogZmFsc2VcIi5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcnVuU3RhdGljUXVlcnlNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIHNlbGVjdGVkU3RyYXRlZ3k6IFNFTEVDVEVEX1NUUkFURUdZKSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgY29uc3QgaG9zdCA9IHRzLmNyZWF0ZUNvbXBpbGVySG9zdChwYXJzZWQub3B0aW9ucywgdHJ1ZSk7XG5cbiAgLy8gV2UgbmVlZCB0byBvdmVyd3JpdGUgdGhlIGhvc3QgXCJyZWFkRmlsZVwiIG1ldGhvZCwgYXMgd2Ugd2FudCB0aGUgVHlwZVNjcmlwdFxuICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS4gT3RoZXJ3aXNlXG4gIC8vIGlmIHdlIHJ1biB0aGUgbWlncmF0aW9uIGZvciBtdWx0aXBsZSB0c2NvbmZpZyBmaWxlcyB3aGljaCBoYXZlIGludGVyc2VjdGluZ1xuICAvLyBzb3VyY2UgZmlsZXMsIGl0IGNhbiBlbmQgdXAgdXBkYXRpbmcgcXVlcnkgZGVmaW5pdGlvbnMgbXVsdGlwbGUgdGltZXMuXG4gIGhvc3QucmVhZEZpbGUgPSBmaWxlTmFtZSA9PiB7XG4gICAgY29uc3QgYnVmZmVyID0gdHJlZS5yZWFkKHJlbGF0aXZlKGJhc2VQYXRoLCBmaWxlTmFtZSkpO1xuICAgIHJldHVybiBidWZmZXIgPyBidWZmZXIudG9TdHJpbmcoKSA6IHVuZGVmaW5lZDtcbiAgfTtcblxuICBjb25zdCBwcm9ncmFtID0gdHMuY3JlYXRlUHJvZ3JhbShwYXJzZWQuZmlsZU5hbWVzLCBwYXJzZWQub3B0aW9ucywgaG9zdCk7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBxdWVyeVZpc2l0b3IgPSBuZXcgTmdRdWVyeVJlc29sdmVWaXNpdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3QgdGVtcGxhdGVWaXNpdG9yID0gbmV3IE5nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yKHR5cGVDaGVja2VyKTtcbiAgY29uc3Qgcm9vdFNvdXJjZUZpbGVzID0gcHJvZ3JhbS5nZXRSb290RmlsZU5hbWVzKCkubWFwKGYgPT4gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlKGYpICEpO1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBjb25zdCBhbmFseXNpc1Zpc2l0b3JzOiBUeXBlU2NyaXB0VmlzaXRvcltdID0gW3F1ZXJ5VmlzaXRvcl07XG4gIGNvbnN0IGZhaWx1cmVNZXNzYWdlczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBJZiB0aGUgXCJ1c2FnZVwiIHN0cmF0ZWd5IGlzIHNlbGVjdGVkLCB3ZSBhbHNvIG5lZWQgdG8gYWRkIHRoZSBxdWVyeSB2aXNpdG9yXG4gIC8vIHRvIHRoZSBhbmFseXNpcyB2aXNpdG9ycyBzbyB0aGF0IHF1ZXJ5IHVzYWdlIGluIHRlbXBsYXRlcyBjYW4gYmUgYWxzbyBjaGVja2VkLlxuICBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVVNBR0UpIHtcbiAgICBhbmFseXNpc1Zpc2l0b3JzLnB1c2godGVtcGxhdGVWaXNpdG9yKTtcbiAgfVxuXG4gIHJvb3RTb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4ge1xuICAgIC8vIFRoZSB2aXNpdCB1dGlsaXR5IGZ1bmN0aW9uIG9ubHkgdHJhdmVyc2VzIGEgc291cmNlIGZpbGUgb25jZS4gV2UgZG9uJ3Qgd2FudCB0b1xuICAgIC8vIHRyYXZlcnNlIHRocm91Z2ggYWxsIHNvdXJjZSBmaWxlcyBtdWx0aXBsZSB0aW1lcyBmb3IgZWFjaCB2aXNpdG9yIGFzIHRoaXMgY291bGQgYmVcbiAgICAvLyBzbG93LlxuICAgIHZpc2l0QWxsTm9kZXMoc291cmNlRmlsZSwgYW5hbHlzaXNWaXNpdG9ycyk7XG4gIH0pO1xuXG4gIGNvbnN0IHtyZXNvbHZlZFF1ZXJpZXMsIGNsYXNzTWV0YWRhdGF9ID0gcXVlcnlWaXNpdG9yO1xuICBjb25zdCB7cmVzb2x2ZWRUZW1wbGF0ZXN9ID0gdGVtcGxhdGVWaXNpdG9yO1xuXG4gIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5VU0FHRSkge1xuICAgIC8vIEFkZCBhbGwgcmVzb2x2ZWQgdGVtcGxhdGVzIHRvIHRoZSBjbGFzcyBtZXRhZGF0YSBpZiB0aGUgdXNhZ2Ugc3RyYXRlZ3kgaXMgdXNlZC4gVGhpc1xuICAgIC8vIGlzIG5lY2Vzc2FyeSBpbiBvcmRlciB0byBiZSBhYmxlIHRvIGNoZWNrIGNvbXBvbmVudCB0ZW1wbGF0ZXMgZm9yIHN0YXRpYyBxdWVyeSB1c2FnZS5cbiAgICByZXNvbHZlZFRlbXBsYXRlcy5mb3JFYWNoKHRlbXBsYXRlID0+IHtcbiAgICAgIGlmIChjbGFzc01ldGFkYXRhLmhhcyh0ZW1wbGF0ZS5jb250YWluZXIpKSB7XG4gICAgICAgIGNsYXNzTWV0YWRhdGEuZ2V0KHRlbXBsYXRlLmNvbnRhaW5lcikgIS50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgbGV0IHN0cmF0ZWd5OiBUaW1pbmdTdHJhdGVneTtcbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgc3RyYXRlZ3kgPSBuZXcgUXVlcnlVc2FnZVN0cmF0ZWd5KGNsYXNzTWV0YWRhdGEsIHR5cGVDaGVja2VyKTtcbiAgfSBlbHNlIGlmIChzZWxlY3RlZFN0cmF0ZWd5ID09PSBTRUxFQ1RFRF9TVFJBVEVHWS5URVNUUykge1xuICAgIHN0cmF0ZWd5ID0gbmV3IFF1ZXJ5VGVzdFN0cmF0ZWd5KCk7XG4gIH0gZWxzZSB7XG4gICAgc3RyYXRlZ3kgPSBuZXcgUXVlcnlUZW1wbGF0ZVN0cmF0ZWd5KHRzY29uZmlnUGF0aCwgY2xhc3NNZXRhZGF0YSwgaG9zdCk7XG4gIH1cblxuICAvLyBJbiBjYXNlIHRoZSBzdHJhdGVneSBjb3VsZCBub3QgYmUgc2V0IHVwIHByb3Blcmx5LCB3ZSBqdXN0IGV4aXQgdGhlXG4gIC8vIG1pZ3JhdGlvbi4gV2UgZG9uJ3Qgd2FudCB0byB0aHJvdyBhbiBleGNlcHRpb24gYXMgdGhpcyBjb3VsZCBtZWFuXG4gIC8vIHRoYXQgb3RoZXIgbWlncmF0aW9ucyBhcmUgaW50ZXJydXB0ZWQuXG4gIGlmICghc3RyYXRlZ3kuc2V0dXAoKSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8vIFdhbGsgdGhyb3VnaCBhbGwgc291cmNlIGZpbGVzIHRoYXQgY29udGFpbiByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGVcbiAgLy8gdGhlIHNvdXJjZSBmaWxlcyBpZiBuZWVkZWQuIE5vdGUgdGhhdCB3ZSBuZWVkIHRvIHVwZGF0ZSBtdWx0aXBsZSBxdWVyaWVzXG4gIC8vIHdpdGhpbiBhIHNvdXJjZSBmaWxlIHdpdGhpbiB0aGUgc2FtZSByZWNvcmRlciBpbiBvcmRlciB0byBub3QgdGhyb3cgb2ZmXG4gIC8vIHRoZSBUeXBlU2NyaXB0IG5vZGUgb2Zmc2V0cy5cbiAgcmVzb2x2ZWRRdWVyaWVzLmZvckVhY2goKHF1ZXJpZXMsIHNvdXJjZUZpbGUpID0+IHtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgY29uc3QgdXBkYXRlID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZVBhdGgpO1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgcXVlcnkgdGltaW5nIGZvciBhbGwgcmVzb2x2ZWQgcXVlcmllcyBhbmQgdXBkYXRlIHRoZVxuICAgIC8vIHF1ZXJ5IGRlZmluaXRpb25zIHRvIGV4cGxpY2l0bHkgc2V0IHRoZSBkZXRlcm1pbmVkIHF1ZXJ5IHRpbWluZy5cbiAgICBxdWVyaWVzLmZvckVhY2gocSA9PiB7XG4gICAgICBjb25zdCBxdWVyeUV4cHIgPSBxLmRlY29yYXRvci5ub2RlLmV4cHJlc3Npb247XG4gICAgICBjb25zdCB7dGltaW5nLCBtZXNzYWdlfSA9IHN0cmF0ZWd5LmRldGVjdFRpbWluZyhxKTtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWVkTm9kZSA9IGdldFRyYW5zZm9ybWVkUXVlcnlDYWxsRXhwcihxLCB0aW1pbmcsICEhbWVzc2FnZSk7XG5cbiAgICAgIGlmICghdHJhbnNmb3JtZWROb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3VGV4dCA9IHByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCB0cmFuc2Zvcm1lZE5vZGUsIHNvdXJjZUZpbGUpO1xuXG4gICAgICAvLyBSZXBsYWNlIHRoZSBleGlzdGluZyBxdWVyeSBkZWNvcmF0b3IgY2FsbCBleHByZXNzaW9uIHdpdGggdGhlIHVwZGF0ZWRcbiAgICAgIC8vIGNhbGwgZXhwcmVzc2lvbiBub2RlLlxuICAgICAgdXBkYXRlLnJlbW92ZShxdWVyeUV4cHIuZ2V0U3RhcnQoKSwgcXVlcnlFeHByLmdldFdpZHRoKCkpO1xuICAgICAgdXBkYXRlLmluc2VydFJpZ2h0KHF1ZXJ5RXhwci5nZXRTdGFydCgpLCBuZXdUZXh0KTtcblxuICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24oc291cmNlRmlsZSwgcS5kZWNvcmF0b3Iubm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgZmFpbHVyZU1lc3NhZ2VzLnB1c2goYCR7cmVsYXRpdmVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke21lc3NhZ2V9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0cmVlLmNvbW1pdFVwZGF0ZSh1cGRhdGUpO1xuICB9KTtcblxuICByZXR1cm4gZmFpbHVyZU1lc3NhZ2VzO1xufVxuIl19