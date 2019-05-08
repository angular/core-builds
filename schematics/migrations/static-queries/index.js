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
        define("@angular/core/schematics/migrations/static-queries", ["require", "exports", "@angular-devkit/schematics", "path", "rxjs", "typescript", "@angular/core/schematics/utils/ng_component_template", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/parse_tsconfig", "@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", "@angular/core/schematics/migrations/static-queries/strategies/template_strategy/template_strategy", "@angular/core/schematics/migrations/static-queries/strategies/test_strategy/test_strategy", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy", "@angular/core/schematics/migrations/static-queries/strategy_prompt", "@angular/core/schematics/migrations/static-queries/transform"], factory);
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
    const strategy_prompt_1 = require("@angular/core/schematics/migrations/static-queries/strategy_prompt");
    const transform_1 = require("@angular/core/schematics/migrations/static-queries/transform");
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
            const buildProjects = new Set();
            const failures = [];
            for (const tsconfigPath of buildPaths) {
                const project = analyzeProject(tree, tsconfigPath, basePath);
                if (project) {
                    buildProjects.add(project);
                }
            }
            // In case there are projects which contain queries that need to be migrated,
            // we want to prompt for the migration strategy and run the migration.
            if (buildProjects.size) {
                const strategy = yield strategy_prompt_1.promptForMigrationStrategy(logger);
                for (let project of Array.from(buildProjects.values())) {
                    failures.push(...yield runStaticQueryMigration(tree, project, strategy));
                }
            }
            // For the "test" tsconfig projects we always want to use the test strategy as
            // we can't detect the proper timing within spec files.
            for (const tsconfigPath of testPaths) {
                const project = yield analyzeProject(tree, tsconfigPath, basePath);
                if (project) {
                    failures.push(...yield runStaticQueryMigration(tree, project, strategy_prompt_1.SELECTED_STRATEGY.TESTS));
                }
            }
            if (failures.length) {
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
    function analyzeProject(tree, tsconfigPath, basePath) {
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
        const sourceFiles = program.getRootFileNames().map(f => program.getSourceFile(f));
        const queryVisitor = new ng_query_visitor_1.NgQueryResolveVisitor(typeChecker);
        // Analyze all project source-files and collect all queries that
        // need to be migrated.
        sourceFiles.forEach(sourceFile => queryVisitor.visitNode(sourceFile));
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
    function runStaticQueryMigration(tree, project, selectedStrategy) {
        return __awaiter(this, void 0, void 0, function* () {
            const { sourceFiles, typeChecker, host, queryVisitor, tsconfigPath, basePath } = project;
            const printer = ts.createPrinter();
            const failureMessages = [];
            const templateVisitor = new ng_component_template_1.NgComponentTemplateVisitor(typeChecker);
            // If the "usage" strategy is selected, we also need to add the query visitor
            // to the analysis visitors so that query usage in templates can be also checked.
            if (selectedStrategy === strategy_prompt_1.SELECTED_STRATEGY.USAGE) {
                sourceFiles.forEach(s => templateVisitor.visitNode(s));
            }
            const { resolvedQueries, classMetadata } = queryVisitor;
            const { resolvedTemplates } = templateVisitor;
            if (selectedStrategy === strategy_prompt_1.SELECTED_STRATEGY.USAGE) {
                // Add all resolved templates to the class metadata if the usage strategy is used. This
                // is necessary in order to be able to check component templates for static query usage.
                resolvedTemplates.forEach(template => {
                    if (classMetadata.has(template.container)) {
                        classMetadata.get(template.container).template = template;
                    }
                });
            }
            let strategy;
            if (selectedStrategy === strategy_prompt_1.SELECTED_STRATEGY.USAGE) {
                strategy = new usage_strategy_1.QueryUsageStrategy(classMetadata, typeChecker);
            }
            else if (selectedStrategy === strategy_prompt_1.SELECTED_STRATEGY.TESTS) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsMkRBQTZGO0lBQzdGLCtCQUF1QztJQUN2QywrQkFBMEI7SUFDMUIsaUNBQWlDO0lBRWpDLGdHQUE2RTtJQUM3RSxrR0FBMkU7SUFDM0UsNkZBQXdFO0lBRXhFLGtIQUFpRTtJQUNqRSx5SUFBdUY7SUFDdkYsNkhBQTJFO0lBRTNFLGdJQUE4RTtJQUM5RSx3R0FBZ0Y7SUFDaEYsNEZBQXdEO0lBWXhELHFEQUFxRDtJQUNyRDtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsT0FBeUIsRUFBRSxFQUFFO1lBQy9DLG1FQUFtRTtZQUNuRSx3REFBd0Q7WUFDeEQsT0FBTyxXQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQVEsQ0FBQztRQUNuRSxDQUFDLENBQUM7SUFDSixDQUFDO0lBTkQsNEJBTUM7SUFFRCwyRkFBMkY7SUFDM0YsU0FBZSxZQUFZLENBQUMsSUFBVSxFQUFFLE9BQXlCOztZQUMvRCxNQUFNLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBQyxHQUFHLGdEQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLG1FQUFtRSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFD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Y0FBYyxJQUFJLE9BQU8sRUFBRTt3QkFDcEMsTUFBTSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUMsR0FDbkIsRUFBRSxDQUFDLDZCQUE2QixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO3dCQUM5RSxlQUFlLENBQUMsSUFBSSxDQUNoQixHQUFHLFlBQVksSUFBSSxJQUFJLEdBQUcsQ0FBQyxJQUFJLFNBQVMsR0FBRyxDQUFDLEtBQUssTUFBTSxDQUFDLGNBQWMsSUFBSSxPQUFPLEVBQUUsQ0FBQyxDQUFDO3FCQUMxRjtnQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFFSCxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxlQUFlLENBQUM7UUFDekIsQ0FBQztLQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7ZGlybmFtZSwgcmVsYXRpdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtmcm9tfSBmcm9tICdyeGpzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge05nQ29tcG9uZW50VGVtcGxhdGVWaXNpdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge3BhcnNlVHNjb25maWdGaWxlfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3BhcnNlX3RzY29uZmlnJztcblxuaW1wb3J0IHtOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3J9IGZyb20gJy4vYW5ndWxhci9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7UXVlcnlUZW1wbGF0ZVN0cmF0ZWd5fSBmcm9tICcuL3N0cmF0ZWdpZXMvdGVtcGxhdGVfc3RyYXRlZ3kvdGVtcGxhdGVfc3RyYXRlZ3knO1xuaW1wb3J0IHtRdWVyeVRlc3RTdHJhdGVneX0gZnJvbSAnLi9zdHJhdGVnaWVzL3Rlc3Rfc3RyYXRlZ3kvdGVzdF9zdHJhdGVneSc7XG5pbXBvcnQge1RpbWluZ1N0cmF0ZWd5fSBmcm9tICcuL3N0cmF0ZWdpZXMvdGltaW5nLXN0cmF0ZWd5JztcbmltcG9ydCB7UXVlcnlVc2FnZVN0cmF0ZWd5fSBmcm9tICcuL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvdXNhZ2Vfc3RyYXRlZ3knO1xuaW1wb3J0IHtTRUxFQ1RFRF9TVFJBVEVHWSwgcHJvbXB0Rm9yTWlncmF0aW9uU3RyYXRlZ3l9IGZyb20gJy4vc3RyYXRlZ3lfcHJvbXB0JztcbmltcG9ydCB7Z2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5cbmludGVyZmFjZSBBbmFseXplZFByb2plY3Qge1xuICBwcm9ncmFtOiB0cy5Qcm9ncmFtO1xuICBob3N0OiB0cy5Db21waWxlckhvc3Q7XG4gIHF1ZXJ5VmlzaXRvcjogTmdRdWVyeVJlc29sdmVWaXNpdG9yO1xuICBzb3VyY2VGaWxlczogdHMuU291cmNlRmlsZVtdO1xuICBiYXNlUGF0aDogc3RyaW5nO1xuICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXI7XG4gIHRzY29uZmlnUGF0aDogc3RyaW5nO1xufVxuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOCBzdGF0aWMtcXVlcnkgbWlncmF0aW9uLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiAodHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIC8vIFdlIG5lZWQgdG8gY2FzdCB0aGUgcmV0dXJuZWQgXCJPYnNlcnZhYmxlXCIgdG8gXCJhbnlcIiBhcyB0aGVyZSBpcyBhXG4gICAgLy8gUnhKUyB2ZXJzaW9uIG1pc21hdGNoIHRoYXQgYnJlYWtzIHRoZSBUUyBjb21waWxhdGlvbi5cbiAgICByZXR1cm4gZnJvbShydW5NaWdyYXRpb24odHJlZSwgY29udGV4dCkudGhlbigoKSA9PiB0cmVlKSkgYXMgYW55O1xuICB9O1xufVxuXG4vKiogUnVucyB0aGUgVjggbWlncmF0aW9uIHN0YXRpYy1xdWVyeSBtaWdyYXRpb24gZm9yIGFsbCBkZXRlcm1pbmVkIFR5cGVTY3JpcHQgcHJvamVjdHMuICovXG5hc3luYyBmdW5jdGlvbiBydW5NaWdyYXRpb24odHJlZTogVHJlZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCkge1xuICBjb25zdCB7YnVpbGRQYXRocywgdGVzdFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuXG4gIGxvZ2dlci5pbmZvKCctLS0tLS0gU3RhdGljIFF1ZXJ5IG1pZ3JhdGlvbiAtLS0tLS0nKTtcbiAgbG9nZ2VyLmluZm8oJ0luIHByZXBhcmF0aW9uIGZvciBJdnksIGRldmVsb3BlcnMgY2FuIG5vdyBleHBsaWNpdGx5IHNwZWNpZnkgdGhlJyk7XG4gIGxvZ2dlci5pbmZvKCd0aW1pbmcgb2YgdGhlaXIgcXVlcmllcy4gUmVhZCBtb3JlIGFib3V0IHRoaXMgaGVyZTonKTtcbiAgbG9nZ2VyLmluZm8oJ2h0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC8yODgxMCcpO1xuICBsb2dnZXIuaW5mbygnJyk7XG5cbiAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCAmJiAhdGVzdFBhdGhzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBtaWdyYXRlIHF1ZXJpZXMgJyArXG4gICAgICAgICd0byBleHBsaWNpdCB0aW1pbmcuJyk7XG4gIH1cblxuICBjb25zdCBidWlsZFByb2plY3RzID0gbmV3IFNldDxBbmFseXplZFByb2plY3Q+KCk7XG4gIGNvbnN0IGZhaWx1cmVzID0gW107XG5cbiAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYnVpbGRQYXRocykge1xuICAgIGNvbnN0IHByb2plY3QgPSBhbmFseXplUHJvamVjdCh0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoKTtcbiAgICBpZiAocHJvamVjdCkge1xuICAgICAgYnVpbGRQcm9qZWN0cy5hZGQocHJvamVjdCk7XG4gICAgfVxuICB9XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgcHJvamVjdHMgd2hpY2ggY29udGFpbiBxdWVyaWVzIHRoYXQgbmVlZCB0byBiZSBtaWdyYXRlZCxcbiAgLy8gd2Ugd2FudCB0byBwcm9tcHQgZm9yIHRoZSBtaWdyYXRpb24gc3RyYXRlZ3kgYW5kIHJ1biB0aGUgbWlncmF0aW9uLlxuICBpZiAoYnVpbGRQcm9qZWN0cy5zaXplKSB7XG4gICAgY29uc3Qgc3RyYXRlZ3kgPSBhd2FpdCBwcm9tcHRGb3JNaWdyYXRpb25TdHJhdGVneShsb2dnZXIpO1xuICAgIGZvciAobGV0IHByb2plY3Qgb2YgQXJyYXkuZnJvbShidWlsZFByb2plY3RzLnZhbHVlcygpKSkge1xuICAgICAgZmFpbHVyZXMucHVzaCguLi5hd2FpdCBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbih0cmVlLCBwcm9qZWN0LCBzdHJhdGVneSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEZvciB0aGUgXCJ0ZXN0XCIgdHNjb25maWcgcHJvamVjdHMgd2UgYWx3YXlzIHdhbnQgdG8gdXNlIHRoZSB0ZXN0IHN0cmF0ZWd5IGFzXG4gIC8vIHdlIGNhbid0IGRldGVjdCB0aGUgcHJvcGVyIHRpbWluZyB3aXRoaW4gc3BlYyBmaWxlcy5cbiAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgdGVzdFBhdGhzKSB7XG4gICAgY29uc3QgcHJvamVjdCA9IGF3YWl0IGFuYWx5emVQcm9qZWN0KHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgpO1xuICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLmF3YWl0IHJ1blN0YXRpY1F1ZXJ5TWlncmF0aW9uKHRyZWUsIHByb2plY3QsIFNFTEVDVEVEX1NUUkFURUdZLlRFU1RTKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgIGxvZ2dlci5pbmZvKCdTb21lIHF1ZXJpZXMgY291bGQgbm90IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuIFBsZWFzZSBnbycpO1xuICAgIGxvZ2dlci5pbmZvKCd0aHJvdWdoIHRob3NlIG1hbnVhbGx5IGFuZCBhcHBseSB0aGUgYXBwcm9wcmlhdGUgdGltaW5nOicpO1xuICAgIGZhaWx1cmVzLmZvckVhY2goZmFpbHVyZSA9PiBsb2dnZXIud2Fybihg4q6RICAgJHtmYWlsdXJlfWApKTtcbiAgfVxuXG4gIGxvZ2dlci5pbmZvKCctLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbn1cblxuLyoqXG4gKiBBbmFseXplcyB0aGUgZ2l2ZW4gVHlwZVNjcmlwdCBwcm9qZWN0IGJ5IGxvb2tpbmcgZm9yIHF1ZXJpZXMgdGhhdCBuZWVkIHRvIGJlXG4gKiBtaWdyYXRlZC4gSW4gY2FzZSB0aGVyZSBhcmUgbm8gcXVlcmllcyB0aGF0IGNhbiBiZSBtaWdyYXRlZCwgbnVsbCBpcyByZXR1cm5lZC5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZVByb2plY3QodHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcpOlxuICAgIEFuYWx5emVkUHJvamVjdHxudWxsIHtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlVHNjb25maWdGaWxlKHRzY29uZmlnUGF0aCwgZGlybmFtZSh0c2NvbmZpZ1BhdGgpKTtcbiAgICAgIGNvbnN0IGhvc3QgPSB0cy5jcmVhdGVDb21waWxlckhvc3QocGFyc2VkLm9wdGlvbnMsIHRydWUpO1xuXG4gICAgICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gICAgICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS4gT3RoZXJ3aXNlXG4gICAgICAvLyBpZiB3ZSBydW4gdGhlIG1pZ3JhdGlvbiBmb3IgbXVsdGlwbGUgdHNjb25maWcgZmlsZXMgd2hpY2ggaGF2ZSBpbnRlcnNlY3RpbmdcbiAgICAgIC8vIHNvdXJjZSBmaWxlcywgaXQgY2FuIGVuZCB1cCB1cGRhdGluZyBxdWVyeSBkZWZpbml0aW9ucyBtdWx0aXBsZSB0aW1lcy5cbiAgICAgIGhvc3QucmVhZEZpbGUgPSBmaWxlTmFtZSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICAgICAgcmV0dXJuIGJ1ZmZlciA/IGJ1ZmZlci50b1N0cmluZygpIDogdW5kZWZpbmVkO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0ocGFyc2VkLmZpbGVOYW1lcywgcGFyc2VkLm9wdGlvbnMsIGhvc3QpO1xuICAgICAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gICAgICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0Um9vdEZpbGVOYW1lcygpLm1hcChmID0+IHByb2dyYW0uZ2V0U291cmNlRmlsZShmKSAhKTtcbiAgICAgIGNvbnN0IHF1ZXJ5VmlzaXRvciA9IG5ldyBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3IodHlwZUNoZWNrZXIpO1xuXG4gICAgICAvLyBBbmFseXplIGFsbCBwcm9qZWN0IHNvdXJjZS1maWxlcyBhbmQgY29sbGVjdCBhbGwgcXVlcmllcyB0aGF0XG4gICAgICAvLyBuZWVkIHRvIGJlIG1pZ3JhdGVkLlxuICAgICAgc291cmNlRmlsZXMuZm9yRWFjaChzb3VyY2VGaWxlID0+IHF1ZXJ5VmlzaXRvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gICAgICBpZiAocXVlcnlWaXNpdG9yLnJlc29sdmVkUXVlcmllcy5zaXplID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge3Byb2dyYW0sIGhvc3QsIHRzY29uZmlnUGF0aCwgdHlwZUNoZWNrZXIsIGJhc2VQYXRoLCBxdWVyeVZpc2l0b3IsIHNvdXJjZUZpbGVzfTtcbiAgICB9XG5cbi8qKlxuICogUnVucyB0aGUgc3RhdGljIHF1ZXJ5IG1pZ3JhdGlvbiBmb3IgdGhlIGdpdmVuIHByb2plY3QuIFRoZSBzY2hlbWF0aWMgYW5hbHl6ZXMgYWxsXG4gKiBxdWVyaWVzIHdpdGhpbiB0aGUgcHJvamVjdCBhbmQgc2V0cyB1cCB0aGUgcXVlcnkgdGltaW5nIGJhc2VkIG9uIHRoZSBjdXJyZW50IHVzYWdlXG4gKiBvZiB0aGUgcXVlcnkgcHJvcGVydHkuIGUuZy4gYSB2aWV3IHF1ZXJ5IHRoYXQgaXMgbm90IHVzZWQgaW4gYW55IGxpZmVjeWNsZSBob29rIGRvZXNcbiAqIG5vdCBuZWVkIHRvIGJlIHN0YXRpYyBhbmQgY2FuIGJlIHNldCB1cCB3aXRoIFwic3RhdGljOiBmYWxzZVwiLlxuICovXG5hc3luYyBmdW5jdGlvbiBydW5TdGF0aWNRdWVyeU1pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCBwcm9qZWN0OiBBbmFseXplZFByb2plY3QsIHNlbGVjdGVkU3RyYXRlZ3k6IFNFTEVDVEVEX1NUUkFURUdZKSB7XG4gIGNvbnN0IHtzb3VyY2VGaWxlcywgdHlwZUNoZWNrZXIsIGhvc3QsIHF1ZXJ5VmlzaXRvciwgdHNjb25maWdQYXRoLCBiYXNlUGF0aH0gPSBwcm9qZWN0O1xuICBjb25zdCBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBjb25zdCBmYWlsdXJlTWVzc2FnZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHRlbXBsYXRlVmlzaXRvciA9IG5ldyBOZ0NvbXBvbmVudFRlbXBsYXRlVmlzaXRvcih0eXBlQ2hlY2tlcik7XG5cbiAgLy8gSWYgdGhlIFwidXNhZ2VcIiBzdHJhdGVneSBpcyBzZWxlY3RlZCwgd2UgYWxzbyBuZWVkIHRvIGFkZCB0aGUgcXVlcnkgdmlzaXRvclxuICAvLyB0byB0aGUgYW5hbHlzaXMgdmlzaXRvcnMgc28gdGhhdCBxdWVyeSB1c2FnZSBpbiB0ZW1wbGF0ZXMgY2FuIGJlIGFsc28gY2hlY2tlZC5cbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgc291cmNlRmlsZXMuZm9yRWFjaChzID0+IHRlbXBsYXRlVmlzaXRvci52aXNpdE5vZGUocykpO1xuICB9XG5cbiAgY29uc3Qge3Jlc29sdmVkUXVlcmllcywgY2xhc3NNZXRhZGF0YX0gPSBxdWVyeVZpc2l0b3I7XG4gIGNvbnN0IHtyZXNvbHZlZFRlbXBsYXRlc30gPSB0ZW1wbGF0ZVZpc2l0b3I7XG5cbiAgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlVTQUdFKSB7XG4gICAgLy8gQWRkIGFsbCByZXNvbHZlZCB0ZW1wbGF0ZXMgdG8gdGhlIGNsYXNzIG1ldGFkYXRhIGlmIHRoZSB1c2FnZSBzdHJhdGVneSBpcyB1c2VkLiBUaGlzXG4gICAgLy8gaXMgbmVjZXNzYXJ5IGluIG9yZGVyIHRvIGJlIGFibGUgdG8gY2hlY2sgY29tcG9uZW50IHRlbXBsYXRlcyBmb3Igc3RhdGljIHF1ZXJ5IHVzYWdlLlxuICAgIHJlc29sdmVkVGVtcGxhdGVzLmZvckVhY2godGVtcGxhdGUgPT4ge1xuICAgICAgaWYgKGNsYXNzTWV0YWRhdGEuaGFzKHRlbXBsYXRlLmNvbnRhaW5lcikpIHtcbiAgICAgICAgY2xhc3NNZXRhZGF0YS5nZXQodGVtcGxhdGUuY29udGFpbmVyKSAhLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBsZXQgc3RyYXRlZ3k6IFRpbWluZ1N0cmF0ZWd5O1xuICBpZiAoc2VsZWN0ZWRTdHJhdGVneSA9PT0gU0VMRUNURURfU1RSQVRFR1kuVVNBR0UpIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVVzYWdlU3RyYXRlZ3koY2xhc3NNZXRhZGF0YSwgdHlwZUNoZWNrZXIpO1xuICB9IGVsc2UgaWYgKHNlbGVjdGVkU3RyYXRlZ3kgPT09IFNFTEVDVEVEX1NUUkFURUdZLlRFU1RTKSB7XG4gICAgc3RyYXRlZ3kgPSBuZXcgUXVlcnlUZXN0U3RyYXRlZ3koKTtcbiAgfSBlbHNlIHtcbiAgICBzdHJhdGVneSA9IG5ldyBRdWVyeVRlbXBsYXRlU3RyYXRlZ3kodHNjb25maWdQYXRoLCBjbGFzc01ldGFkYXRhLCBob3N0KTtcbiAgfVxuXG4gIC8vIEluIGNhc2UgdGhlIHN0cmF0ZWd5IGNvdWxkIG5vdCBiZSBzZXQgdXAgcHJvcGVybHksIHdlIGp1c3QgZXhpdCB0aGVcbiAgLy8gbWlncmF0aW9uLiBXZSBkb24ndCB3YW50IHRvIHRocm93IGFuIGV4Y2VwdGlvbiBhcyB0aGlzIGNvdWxkIG1lYW5cbiAgLy8gdGhhdCBvdGhlciBtaWdyYXRpb25zIGFyZSBpbnRlcnJ1cHRlZC5cbiAgaWYgKCFzdHJhdGVneS5zZXR1cCgpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gV2FsayB0aHJvdWdoIGFsbCBzb3VyY2UgZmlsZXMgdGhhdCBjb250YWluIHJlc29sdmVkIHF1ZXJpZXMgYW5kIHVwZGF0ZVxuICAvLyB0aGUgc291cmNlIGZpbGVzIGlmIG5lZWRlZC4gTm90ZSB0aGF0IHdlIG5lZWQgdG8gdXBkYXRlIG11bHRpcGxlIHF1ZXJpZXNcbiAgLy8gd2l0aGluIGEgc291cmNlIGZpbGUgd2l0aGluIHRoZSBzYW1lIHJlY29yZGVyIGluIG9yZGVyIHRvIG5vdCB0aHJvdyBvZmZcbiAgLy8gdGhlIFR5cGVTY3JpcHQgbm9kZSBvZmZzZXRzLlxuICByZXNvbHZlZFF1ZXJpZXMuZm9yRWFjaCgocXVlcmllcywgc291cmNlRmlsZSkgPT4ge1xuICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICBjb25zdCB1cGRhdGUgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlUGF0aCk7XG5cbiAgICAvLyBDb21wdXRlIHRoZSBxdWVyeSB0aW1pbmcgZm9yIGFsbCByZXNvbHZlZCBxdWVyaWVzIGFuZCB1cGRhdGUgdGhlXG4gICAgLy8gcXVlcnkgZGVmaW5pdGlvbnMgdG8gZXhwbGljaXRseSBzZXQgdGhlIGRldGVybWluZWQgcXVlcnkgdGltaW5nLlxuICAgIHF1ZXJpZXMuZm9yRWFjaChxID0+IHtcbiAgICAgIGNvbnN0IHF1ZXJ5RXhwciA9IHEuZGVjb3JhdG9yLm5vZGUuZXhwcmVzc2lvbjtcbiAgICAgIGNvbnN0IHt0aW1pbmcsIG1lc3NhZ2V9ID0gc3RyYXRlZ3kuZGV0ZWN0VGltaW5nKHEpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2V0VHJhbnNmb3JtZWRRdWVyeUNhbGxFeHByKHEsIHRpbWluZywgISFtZXNzYWdlKTtcblxuICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdUZXh0ID0gcHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHJlc3VsdC5ub2RlLCBzb3VyY2VGaWxlKTtcblxuICAgICAgLy8gUmVwbGFjZSB0aGUgZXhpc3RpbmcgcXVlcnkgZGVjb3JhdG9yIGNhbGwgZXhwcmVzc2lvbiB3aXRoIHRoZSB1cGRhdGVkXG4gICAgICAvLyBjYWxsIGV4cHJlc3Npb24gbm9kZS5cbiAgICAgIHVwZGF0ZS5yZW1vdmUocXVlcnlFeHByLmdldFN0YXJ0KCksIHF1ZXJ5RXhwci5nZXRXaWR0aCgpKTtcbiAgICAgIHVwZGF0ZS5pbnNlcnRSaWdodChxdWVyeUV4cHIuZ2V0U3RhcnQoKSwgbmV3VGV4dCk7XG5cbiAgICAgIGlmIChyZXN1bHQuZmFpbHVyZU1lc3NhZ2UgfHwgbWVzc2FnZSkge1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihzb3VyY2VGaWxlLCBxLmRlY29yYXRvci5ub2RlLmdldFN0YXJ0KCkpO1xuICAgICAgICBmYWlsdXJlTWVzc2FnZXMucHVzaChcbiAgICAgICAgICAgIGAke3JlbGF0aXZlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfTogJHtyZXN1bHQuZmFpbHVyZU1lc3NhZ2UgfHwgbWVzc2FnZX1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRyZWUuY29tbWl0VXBkYXRlKHVwZGF0ZSk7XG4gIH0pO1xuXG4gIHJldHVybiBmYWlsdXJlTWVzc2FnZXM7XG59XG4iXX0=