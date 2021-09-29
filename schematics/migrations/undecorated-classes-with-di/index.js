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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di", ["require", "exports", "@angular-devkit/schematics", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "path", "typescript", "@angular/core/schematics/utils/load_esm", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/undecorated-classes-with-di/create_ngc_program", "@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector", "@angular/core/schematics/migrations/undecorated-classes-with-di/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    const reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    const path_1 = require("path");
    const ts = require("typescript");
    const load_esm_1 = require("@angular/core/schematics/utils/load_esm");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const create_ngc_program_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/create_ngc_program");
    const ng_declaration_collector_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector");
    const transform_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/transform");
    const MIGRATION_RERUN_MESSAGE = 'Migration can be rerun with: "ng update @angular/core ' +
        '--migrate-only migration-v9-undecorated-classes-with-di"';
    const MIGRATION_AOT_FAILURE = 'This migration uses the Angular compiler internally and ' +
        'therefore projects that no longer build successfully after the update cannot run ' +
        'the migration. Please ensure there are no AOT compilation errors and rerun the migration.';
    /** Entry point for the V9 "undecorated-classes-with-di" migration. */
    function default_1() {
        return (tree, ctx) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths } = yield (0, project_tsconfig_paths_1.getProjectTsConfigPaths)(tree);
            const basePath = process.cwd();
            const failures = [];
            let programError = false;
            if (!buildPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate undecorated derived classes and ' +
                    'undecorated base classes which use DI.');
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
            for (const tsconfigPath of buildPaths) {
                const result = runUndecoratedClassesMigration(tree, tsconfigPath, basePath, ctx.logger, compilerModule);
                failures.push(...result.failures);
                programError = programError || !!result.programError;
            }
            if (programError) {
                ctx.logger.info('Could not migrate all undecorated classes that use dependency');
                ctx.logger.info('injection. Some project targets could not be analyzed due to');
                ctx.logger.info('TypeScript program failures.\n');
                ctx.logger.info(`${MIGRATION_RERUN_MESSAGE}\n`);
                if (failures.length) {
                    ctx.logger.info('Please manually fix the following failures and re-run the');
                    ctx.logger.info('migration once the TypeScript program failures are resolved.');
                    failures.forEach(message => ctx.logger.warn(`⮑   ${message}`));
                }
            }
            else if (failures.length) {
                ctx.logger.info('Could not migrate all undecorated classes that use dependency');
                ctx.logger.info('injection. Please manually fix the following failures:');
                failures.forEach(message => ctx.logger.warn(`⮑   ${message}`));
            }
        });
    }
    exports.default = default_1;
    function runUndecoratedClassesMigration(tree, tsconfigPath, basePath, logger, compilerModule) {
        const failures = [];
        const programData = gracefullyCreateProgram(tree, basePath, tsconfigPath, logger);
        // Gracefully exit if the program could not be created.
        if (programData === null) {
            return { failures: [], programError: true };
        }
        const { program, compiler } = programData;
        const typeChecker = program.getTypeChecker();
        const partialEvaluator = new partial_evaluator_1.PartialEvaluator(new reflection_1.TypeScriptReflectionHost(typeChecker), typeChecker, /* dependencyTracker */ null);
        const declarationCollector = new ng_declaration_collector_1.NgDeclarationCollector(typeChecker, partialEvaluator);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        // Analyze source files by detecting all directives, components and providers.
        sourceFiles.forEach(sourceFile => declarationCollector.visitNode(sourceFile));
        const { decoratedDirectives, decoratedProviders, undecoratedDeclarations } = declarationCollector;
        const transform = new transform_1.UndecoratedClassesTransform(typeChecker, compiler, partialEvaluator, getUpdateRecorder, compilerModule);
        const updateRecorders = new Map();
        // Run the migrations for decorated providers and both decorated and undecorated
        // directives. The transform failures are collected and converted into human-readable
        // failures which can be printed to the console.
        [...transform.migrateDecoratedDirectives(decoratedDirectives),
            ...transform.migrateDecoratedProviders(decoratedProviders),
            ...transform.migrateUndecoratedDeclarations(Array.from(undecoratedDeclarations))]
            .forEach(({ node, message }) => {
            const nodeSourceFile = node.getSourceFile();
            const relativeFilePath = (0, path_1.relative)(basePath, nodeSourceFile.fileName);
            const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
            failures.push(`${relativeFilePath}@${line + 1}:${character + 1}: ${message}`);
        });
        // Record the changes collected in the import manager and transformer.
        transform.recordChanges();
        // Walk through each update recorder and commit the update. We need to commit the
        // updates in batches per source file as there can be only one recorder per source
        // file in order to avoid shifted character offsets.
        updateRecorders.forEach(recorder => recorder.commitUpdate());
        return { failures };
        /** Gets the update recorder for the specified source file. */
        function getUpdateRecorder(sourceFile) {
            if (updateRecorders.has(sourceFile)) {
                return updateRecorders.get(sourceFile);
            }
            const treeRecorder = tree.beginUpdate((0, path_1.relative)(basePath, sourceFile.fileName));
            const recorder = {
                addClassComment(node, text) {
                    treeRecorder.insertLeft(node.members.pos, `\n  // ${text}\n`);
                },
                addClassDecorator(node, text) {
                    // New imports should be inserted at the left while decorators should be inserted
                    // at the right in order to ensure that imports are inserted before the decorator
                    // if the start position of import and decorator is the source file start.
                    treeRecorder.insertRight(node.getStart(), `${text}\n`);
                },
                addNewImport(start, importText) {
                    // New imports should be inserted at the left while decorators should be inserted
                    // at the right in order to ensure that imports are inserted before the decorator
                    // if the start position of import and decorator is the source file start.
                    treeRecorder.insertLeft(start, importText);
                },
                updateExistingImport(namedBindings, newNamedBindings) {
                    treeRecorder.remove(namedBindings.getStart(), namedBindings.getWidth());
                    treeRecorder.insertRight(namedBindings.getStart(), newNamedBindings);
                },
                commitUpdate() {
                    tree.commitUpdate(treeRecorder);
                }
            };
            updateRecorders.set(sourceFile, recorder);
            return recorder;
        }
    }
    function getErrorDiagnostics(diagnostics) {
        return diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
    }
    function gracefullyCreateProgram(tree, basePath, tsconfigPath, logger) {
        try {
            const { ngcProgram, host, program, compiler } = (0, create_ngc_program_1.createNgcProgram)((options) => (0, compiler_host_1.createMigrationCompilerHost)(tree, options, basePath), tsconfigPath);
            const syntacticDiagnostics = getErrorDiagnostics(ngcProgram.getTsSyntacticDiagnostics());
            const structuralDiagnostics = getErrorDiagnostics(ngcProgram.getNgStructuralDiagnostics());
            const configDiagnostics = getErrorDiagnostics([...program.getOptionsDiagnostics(), ...ngcProgram.getNgOptionDiagnostics()]);
            if (configDiagnostics.length) {
                logger.warn(`\nTypeScript project "${tsconfigPath}" has configuration errors. This could cause ` +
                    `an incomplete migration. Please fix the following failures and rerun the migration:`);
                logger.error(ts.formatDiagnostics(configDiagnostics, host));
                return null;
            }
            // Syntactic TypeScript errors can throw off the query analysis and therefore we want
            // to notify the developer that we couldn't analyze parts of the project. Developers
            // can just re-run the migration after fixing these failures.
            if (syntacticDiagnostics.length) {
                logger.warn(`\nTypeScript project "${tsconfigPath}" has syntactical errors which could cause ` +
                    `an incomplete migration. Please fix the following failures and rerun the migration:`);
                logger.error(ts.formatDiagnostics(syntacticDiagnostics, host));
                return null;
            }
            if (structuralDiagnostics.length) {
                throw new Error(ts.formatDiagnostics(structuralDiagnostics, host));
            }
            return { program, compiler };
        }
        catch (e) {
            logger.warn(`\n${MIGRATION_AOT_FAILURE} The following project failed: ${tsconfigPath}\n`);
            logger.error(`${e.toString()}\n`);
            return null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSCwyREFBNkY7SUFHN0YseUZBQW1GO0lBQ25GLDJFQUFvRjtJQUNwRiwrQkFBOEI7SUFDOUIsaUNBQWlDO0lBRWpDLHNFQUFtRDtJQUNuRCxrR0FBMkU7SUFDM0UsMkZBQWlHO0lBRWpHLDJIQUFzRDtJQUN0RCx1SUFBa0U7SUFDbEUseUdBQXdEO0lBR3hELE1BQU0sdUJBQXVCLEdBQUcsd0RBQXdEO1FBQ3BGLDBEQUEwRCxDQUFDO0lBRS9ELE1BQU0scUJBQXFCLEdBQUcsMERBQTBEO1FBQ3BGLG1GQUFtRjtRQUNuRiwyRkFBMkYsQ0FBQztJQUVoRyxzRUFBc0U7SUFDdEU7UUFDRSxPQUFPLENBQU8sSUFBVSxFQUFFLEdBQXFCLEVBQUUsRUFBRTtZQUNqRCxNQUFNLEVBQUMsVUFBVSxFQUFDLEdBQUcsTUFBTSxJQUFBLGdEQUF1QixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7WUFDOUIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBRXpCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUN0QixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLG1GQUFtRjtvQkFDbkYsd0NBQXdDLENBQUMsQ0FBQzthQUMvQztZQUVELElBQUksY0FBYyxDQUFDO1lBQ25CLElBQUk7Z0JBQ0YsK0VBQStFO2dCQUMvRSx5RkFBeUY7Z0JBQ3pGLHNDQUFzQztnQkFDdEMsY0FBYyxHQUFHLE1BQU0s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QUksQ0FBQyxDQUFDO1lBQzFGLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9nZ2luZ30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQgdHlwZSB7QW90Q29tcGlsZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7RGlhZ25vc3RpYyBhcyBOZ0RpYWdub3N0aWN9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSc7XG5pbXBvcnQge1BhcnRpYWxFdmFsdWF0b3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcmVmbGVjdGlvbic7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2xvYWRFc21Nb2R1bGV9IGZyb20gJy4uLy4uL3V0aWxzL2xvYWRfZXNtJztcbmltcG9ydCB7Z2V0UHJvamVjdFRzQ29uZmlnUGF0aHN9IGZyb20gJy4uLy4uL3V0aWxzL3Byb2plY3RfdHNjb25maWdfcGF0aHMnO1xuaW1wb3J0IHtjYW5NaWdyYXRlRmlsZSwgY3JlYXRlTWlncmF0aW9uQ29tcGlsZXJIb3N0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuXG5pbXBvcnQge2NyZWF0ZU5nY1Byb2dyYW19IGZyb20gJy4vY3JlYXRlX25nY19wcm9ncmFtJztcbmltcG9ydCB7TmdEZWNsYXJhdGlvbkNvbGxlY3Rvcn0gZnJvbSAnLi9uZ19kZWNsYXJhdGlvbl9jb2xsZWN0b3InO1xuaW1wb3J0IHtVbmRlY29yYXRlZENsYXNzZXNUcmFuc2Zvcm19IGZyb20gJy4vdHJhbnNmb3JtJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuY29uc3QgTUlHUkFUSU9OX1JFUlVOX01FU1NBR0UgPSAnTWlncmF0aW9uIGNhbiBiZSByZXJ1biB3aXRoOiBcIm5nIHVwZGF0ZSBAYW5ndWxhci9jb3JlICcgK1xuICAgICctLW1pZ3JhdGUtb25seSBtaWdyYXRpb24tdjktdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpXCInO1xuXG5jb25zdCBNSUdSQVRJT05fQU9UX0ZBSUxVUkUgPSAnVGhpcyBtaWdyYXRpb24gdXNlcyB0aGUgQW5ndWxhciBjb21waWxlciBpbnRlcm5hbGx5IGFuZCAnICtcbiAgICAndGhlcmVmb3JlIHByb2plY3RzIHRoYXQgbm8gbG9uZ2VyIGJ1aWxkIHN1Y2Nlc3NmdWxseSBhZnRlciB0aGUgdXBkYXRlIGNhbm5vdCBydW4gJyArXG4gICAgJ3RoZSBtaWdyYXRpb24uIFBsZWFzZSBlbnN1cmUgdGhlcmUgYXJlIG5vIEFPVCBjb21waWxhdGlvbiBlcnJvcnMgYW5kIHJlcnVuIHRoZSBtaWdyYXRpb24uJztcblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjkgXCJ1bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGlcIiBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuIGFzeW5jICh0cmVlOiBUcmVlLCBjdHg6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRoc30gPSBhd2FpdCBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IHByb2dyYW1FcnJvciA9IGZhbHNlO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSB1bmRlY29yYXRlZCBkZXJpdmVkIGNsYXNzZXMgYW5kICcgK1xuICAgICAgICAgICd1bmRlY29yYXRlZCBiYXNlIGNsYXNzZXMgd2hpY2ggdXNlIERJLicpO1xuICAgIH1cblxuICAgIGxldCBjb21waWxlck1vZHVsZTtcbiAgICB0cnkge1xuICAgICAgLy8gTG9hZCBFU00gYEBhbmd1bGFyL2NvbXBpbGVyYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAgICAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW4gYmVcbiAgICAgIC8vIGNoYW5nZWQgdG8gYSBkaXJlY3QgZHluYW1pYyBpbXBvcnQuXG4gICAgICBjb21waWxlck1vZHVsZSA9IGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKT4oJ0Bhbmd1bGFyL2NvbXBpbGVyJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgYFVuYWJsZSB0byBsb2FkIHRoZSAnQGFuZ3VsYXIvY29tcGlsZXInIHBhY2thZ2UuIERldGFpbHM6ICR7ZS5tZXNzYWdlfWApO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGJ1aWxkUGF0aHMpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9XG4gICAgICAgICAgcnVuVW5kZWNvcmF0ZWRDbGFzc2VzTWlncmF0aW9uKHRyZWUsIHRzY29uZmlnUGF0aCwgYmFzZVBhdGgsIGN0eC5sb2dnZXIsIGNvbXBpbGVyTW9kdWxlKTtcbiAgICAgIGZhaWx1cmVzLnB1c2goLi4ucmVzdWx0LmZhaWx1cmVzKTtcbiAgICAgIHByb2dyYW1FcnJvciA9IHByb2dyYW1FcnJvciB8fCAhIXJlc3VsdC5wcm9ncmFtRXJyb3I7XG4gICAgfVxuXG4gICAgaWYgKHByb2dyYW1FcnJvcikge1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdDb3VsZCBub3QgbWlncmF0ZSBhbGwgdW5kZWNvcmF0ZWQgY2xhc3NlcyB0aGF0IHVzZSBkZXBlbmRlbmN5Jyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ2luamVjdGlvbi4gU29tZSBwcm9qZWN0IHRhcmdldHMgY291bGQgbm90IGJlIGFuYWx5emVkIGR1ZSB0bycpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdUeXBlU2NyaXB0IHByb2dyYW0gZmFpbHVyZXMuXFxuJyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oYCR7TUlHUkFUSU9OX1JFUlVOX01FU1NBR0V9XFxuYCk7XG5cbiAgICAgIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgICAgY3R4LmxvZ2dlci5pbmZvKCdQbGVhc2UgbWFudWFsbHkgZml4IHRoZSBmb2xsb3dpbmcgZmFpbHVyZXMgYW5kIHJlLXJ1biB0aGUnKTtcbiAgICAgICAgY3R4LmxvZ2dlci5pbmZvKCdtaWdyYXRpb24gb25jZSB0aGUgVHlwZVNjcmlwdCBwcm9ncmFtIGZhaWx1cmVzIGFyZSByZXNvbHZlZC4nKTtcbiAgICAgICAgZmFpbHVyZXMuZm9yRWFjaChtZXNzYWdlID0+IGN0eC5sb2dnZXIud2Fybihg4q6RICAgJHttZXNzYWdlfWApKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdDb3VsZCBub3QgbWlncmF0ZSBhbGwgdW5kZWNvcmF0ZWQgY2xhc3NlcyB0aGF0IHVzZSBkZXBlbmRlbmN5Jyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ2luamVjdGlvbi4gUGxlYXNlIG1hbnVhbGx5IGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzOicpO1xuICAgICAgZmFpbHVyZXMuZm9yRWFjaChtZXNzYWdlID0+IGN0eC5sb2dnZXIud2Fybihg4q6RICAgJHttZXNzYWdlfWApKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1blVuZGVjb3JhdGVkQ2xhc3Nlc01pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZywgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbiAgICBjb21waWxlck1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKSk6XG4gICAge2ZhaWx1cmVzOiBzdHJpbmdbXSwgcHJvZ3JhbUVycm9yPzogYm9vbGVhbn0ge1xuICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgcHJvZ3JhbURhdGEgPSBncmFjZWZ1bGx5Q3JlYXRlUHJvZ3JhbSh0cmVlLCBiYXNlUGF0aCwgdHNjb25maWdQYXRoLCBsb2dnZXIpO1xuXG4gIC8vIEdyYWNlZnVsbHkgZXhpdCBpZiB0aGUgcHJvZ3JhbSBjb3VsZCBub3QgYmUgY3JlYXRlZC5cbiAgaWYgKHByb2dyYW1EYXRhID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHtmYWlsdXJlczogW10sIHByb2dyYW1FcnJvcjogdHJ1ZX07XG4gIH1cblxuICBjb25zdCB7cHJvZ3JhbSwgY29tcGlsZXJ9ID0gcHJvZ3JhbURhdGE7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBwYXJ0aWFsRXZhbHVhdG9yID0gbmV3IFBhcnRpYWxFdmFsdWF0b3IoXG4gICAgICBuZXcgVHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0KHR5cGVDaGVja2VyKSwgdHlwZUNoZWNrZXIsIC8qIGRlcGVuZGVuY3lUcmFja2VyICovIG51bGwpO1xuICBjb25zdCBkZWNsYXJhdGlvbkNvbGxlY3RvciA9IG5ldyBOZ0RlY2xhcmF0aW9uQ29sbGVjdG9yKHR5cGVDaGVja2VyLCBwYXJ0aWFsRXZhbHVhdG9yKTtcbiAgY29uc3Qgc291cmNlRmlsZXMgPVxuICAgICAgcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihzb3VyY2VGaWxlID0+IGNhbk1pZ3JhdGVGaWxlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLCBwcm9ncmFtKSk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIGFsbCBkaXJlY3RpdmVzLCBjb21wb25lbnRzIGFuZCBwcm92aWRlcnMuXG4gIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiBkZWNsYXJhdGlvbkNvbGxlY3Rvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtkZWNvcmF0ZWREaXJlY3RpdmVzLCBkZWNvcmF0ZWRQcm92aWRlcnMsIHVuZGVjb3JhdGVkRGVjbGFyYXRpb25zfSA9IGRlY2xhcmF0aW9uQ29sbGVjdG9yO1xuICBjb25zdCB0cmFuc2Zvcm0gPSBuZXcgVW5kZWNvcmF0ZWRDbGFzc2VzVHJhbnNmb3JtKFxuICAgICAgdHlwZUNoZWNrZXIsIGNvbXBpbGVyLCBwYXJ0aWFsRXZhbHVhdG9yLCBnZXRVcGRhdGVSZWNvcmRlciwgY29tcGlsZXJNb2R1bGUpO1xuICBjb25zdCB1cGRhdGVSZWNvcmRlcnMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIFVwZGF0ZVJlY29yZGVyPigpO1xuXG4gIC8vIFJ1biB0aGUgbWlncmF0aW9ucyBmb3IgZGVjb3JhdGVkIHByb3ZpZGVycyBhbmQgYm90aCBkZWNvcmF0ZWQgYW5kIHVuZGVjb3JhdGVkXG4gIC8vIGRpcmVjdGl2ZXMuIFRoZSB0cmFuc2Zvcm0gZmFpbHVyZXMgYXJlIGNvbGxlY3RlZCBhbmQgY29udmVydGVkIGludG8gaHVtYW4tcmVhZGFibGVcbiAgLy8gZmFpbHVyZXMgd2hpY2ggY2FuIGJlIHByaW50ZWQgdG8gdGhlIGNvbnNvbGUuXG4gIFsuLi50cmFuc2Zvcm0ubWlncmF0ZURlY29yYXRlZERpcmVjdGl2ZXMoZGVjb3JhdGVkRGlyZWN0aXZlcyksXG4gICAuLi50cmFuc2Zvcm0ubWlncmF0ZURlY29yYXRlZFByb3ZpZGVycyhkZWNvcmF0ZWRQcm92aWRlcnMpLFxuICAgLi4udHJhbnNmb3JtLm1pZ3JhdGVVbmRlY29yYXRlZERlY2xhcmF0aW9ucyhBcnJheS5mcm9tKHVuZGVjb3JhdGVkRGVjbGFyYXRpb25zKSldXG4gICAgICAuZm9yRWFjaCgoe25vZGUsIG1lc3NhZ2V9KSA9PiB7XG4gICAgICAgIGNvbnN0IG5vZGVTb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlRmlsZVBhdGggPSByZWxhdGl2ZShiYXNlUGF0aCwgbm9kZVNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuICAgICAgICBjb25zdCB7bGluZSwgY2hhcmFjdGVyfSA9XG4gICAgICAgICAgICB0cy5nZXRMaW5lQW5kQ2hhcmFjdGVyT2ZQb3NpdGlvbihub2RlLmdldFNvdXJjZUZpbGUoKSwgbm9kZS5nZXRTdGFydCgpKTtcbiAgICAgICAgZmFpbHVyZXMucHVzaChgJHtyZWxhdGl2ZUZpbGVQYXRofUAke2xpbmUgKyAxfToke2NoYXJhY3RlciArIDF9OiAke21lc3NhZ2V9YCk7XG4gICAgICB9KTtcblxuICAvLyBSZWNvcmQgdGhlIGNoYW5nZXMgY29sbGVjdGVkIGluIHRoZSBpbXBvcnQgbWFuYWdlciBhbmQgdHJhbnNmb3JtZXIuXG4gIHRyYW5zZm9ybS5yZWNvcmRDaGFuZ2VzKCk7XG5cbiAgLy8gV2FsayB0aHJvdWdoIGVhY2ggdXBkYXRlIHJlY29yZGVyIGFuZCBjb21taXQgdGhlIHVwZGF0ZS4gV2UgbmVlZCB0byBjb21taXQgdGhlXG4gIC8vIHVwZGF0ZXMgaW4gYmF0Y2hlcyBwZXIgc291cmNlIGZpbGUgYXMgdGhlcmUgY2FuIGJlIG9ubHkgb25lIHJlY29yZGVyIHBlciBzb3VyY2VcbiAgLy8gZmlsZSBpbiBvcmRlciB0byBhdm9pZCBzaGlmdGVkIGNoYXJhY3RlciBvZmZzZXRzLlxuICB1cGRhdGVSZWNvcmRlcnMuZm9yRWFjaChyZWNvcmRlciA9PiByZWNvcmRlci5jb21taXRVcGRhdGUoKSk7XG5cbiAgcmV0dXJuIHtmYWlsdXJlc307XG5cbiAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgdGhlIHNwZWNpZmllZCBzb3VyY2UgZmlsZS4gKi9cbiAgZnVuY3Rpb24gZ2V0VXBkYXRlUmVjb3JkZXIoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBpZiAodXBkYXRlUmVjb3JkZXJzLmhhcyhzb3VyY2VGaWxlKSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVJlY29yZGVycy5nZXQoc291cmNlRmlsZSkhO1xuICAgIH1cbiAgICBjb25zdCB0cmVlUmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG4gICAgY29uc3QgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyID0ge1xuICAgICAgYWRkQ2xhc3NDb21tZW50KG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHRleHQ6IHN0cmluZykge1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0TGVmdChub2RlLm1lbWJlcnMucG9zLCBgXFxuICAvLyAke3RleHR9XFxuYCk7XG4gICAgICB9LFxuICAgICAgYWRkQ2xhc3NEZWNvcmF0b3Iobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KG5vZGUuZ2V0U3RhcnQoKSwgYCR7dGV4dH1cXG5gKTtcbiAgICAgIH0sXG4gICAgICBhZGROZXdJbXBvcnQoc3RhcnQ6IG51bWJlciwgaW1wb3J0VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydExlZnQoc3RhcnQsIGltcG9ydFRleHQpO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZUV4aXN0aW5nSW1wb3J0KG5hbWVkQmluZGluZ3M6IHRzLk5hbWVkSW1wb3J0cywgbmV3TmFtZWRCaW5kaW5nczogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuYW1lZEJpbmRpbmdzLmdldFdpZHRoKCkpO1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuZXdOYW1lZEJpbmRpbmdzKTtcbiAgICAgIH0sXG4gICAgICBjb21taXRVcGRhdGUoKSB7XG4gICAgICAgIHRyZWUuY29tbWl0VXBkYXRlKHRyZWVSZWNvcmRlcik7XG4gICAgICB9XG4gICAgfTtcbiAgICB1cGRhdGVSZWNvcmRlcnMuc2V0KHNvdXJjZUZpbGUsIHJlY29yZGVyKTtcbiAgICByZXR1cm4gcmVjb3JkZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RXJyb3JEaWFnbm9zdGljcyhkaWFnbm9zdGljczogUmVhZG9ubHlBcnJheTx0cy5EaWFnbm9zdGljfE5nRGlhZ25vc3RpYz4pIHtcbiAgcmV0dXJuIDx0cy5EaWFnbm9zdGljW10+ZGlhZ25vc3RpY3MuZmlsdGVyKGQgPT4gZC5jYXRlZ29yeSA9PT0gdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yKTtcbn1cblxuZnVuY3Rpb24gZ3JhY2VmdWxseUNyZWF0ZVByb2dyYW0oXG4gICAgdHJlZTogVHJlZSwgYmFzZVBhdGg6IHN0cmluZywgdHNjb25maWdQYXRoOiBzdHJpbmcsXG4gICAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSk6IHtjb21waWxlcjogQW90Q29tcGlsZXIsIHByb2dyYW06IHRzLlByb2dyYW19fG51bGwge1xuICB0cnkge1xuICAgIGNvbnN0IHtuZ2NQcm9ncmFtLCBob3N0LCBwcm9ncmFtLCBjb21waWxlcn0gPSBjcmVhdGVOZ2NQcm9ncmFtKFxuICAgICAgICAob3B0aW9ucykgPT4gY3JlYXRlTWlncmF0aW9uQ29tcGlsZXJIb3N0KHRyZWUsIG9wdGlvbnMsIGJhc2VQYXRoKSwgdHNjb25maWdQYXRoKTtcbiAgICBjb25zdCBzeW50YWN0aWNEaWFnbm9zdGljcyA9IGdldEVycm9yRGlhZ25vc3RpY3MobmdjUHJvZ3JhbS5nZXRUc1N5bnRhY3RpY0RpYWdub3N0aWNzKCkpO1xuICAgIGNvbnN0IHN0cnVjdHVyYWxEaWFnbm9zdGljcyA9IGdldEVycm9yRGlhZ25vc3RpY3MobmdjUHJvZ3JhbS5nZXROZ1N0cnVjdHVyYWxEaWFnbm9zdGljcygpKTtcbiAgICBjb25zdCBjb25maWdEaWFnbm9zdGljcyA9IGdldEVycm9yRGlhZ25vc3RpY3MoXG4gICAgICAgIFsuLi5wcm9ncmFtLmdldE9wdGlvbnNEaWFnbm9zdGljcygpLCAuLi5uZ2NQcm9ncmFtLmdldE5nT3B0aW9uRGlhZ25vc3RpY3MoKV0pO1xuXG4gICAgaWYgKGNvbmZpZ0RpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgICAgYFxcblR5cGVTY3JpcHQgcHJvamVjdCBcIiR7dHNjb25maWdQYXRofVwiIGhhcyBjb25maWd1cmF0aW9uIGVycm9ycy4gVGhpcyBjb3VsZCBjYXVzZSBgICtcbiAgICAgICAgICBgYW4gaW5jb21wbGV0ZSBtaWdyYXRpb24uIFBsZWFzZSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlcyBhbmQgcmVydW4gdGhlIG1pZ3JhdGlvbjpgKTtcbiAgICAgIGxvZ2dlci5lcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhjb25maWdEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gU3ludGFjdGljIFR5cGVTY3JpcHQgZXJyb3JzIGNhbiB0aHJvdyBvZmYgdGhlIHF1ZXJ5IGFuYWx5c2lzIGFuZCB0aGVyZWZvcmUgd2Ugd2FudFxuICAgIC8vIHRvIG5vdGlmeSB0aGUgZGV2ZWxvcGVyIHRoYXQgd2UgY291bGRuJ3QgYW5hbHl6ZSBwYXJ0cyBvZiB0aGUgcHJvamVjdC4gRGV2ZWxvcGVyc1xuICAgIC8vIGNhbiBqdXN0IHJlLXJ1biB0aGUgbWlncmF0aW9uIGFmdGVyIGZpeGluZyB0aGVzZSBmYWlsdXJlcy5cbiAgICBpZiAoc3ludGFjdGljRGlhZ25vc3RpY3MubGVuZ3RoKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICBgXFxuVHlwZVNjcmlwdCBwcm9qZWN0IFwiJHt0c2NvbmZpZ1BhdGh9XCIgaGFzIHN5bnRhY3RpY2FsIGVycm9ycyB3aGljaCBjb3VsZCBjYXVzZSBgICtcbiAgICAgICAgICBgYW4gaW5jb21wbGV0ZSBtaWdyYXRpb24uIFBsZWFzZSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlcyBhbmQgcmVydW4gdGhlIG1pZ3JhdGlvbjpgKTtcbiAgICAgIGxvZ2dlci5lcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhzeW50YWN0aWNEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHN0cnVjdHVyYWxEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyg8dHMuRGlhZ25vc3RpY1tdPnN0cnVjdHVyYWxEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgIH1cblxuICAgIHJldHVybiB7cHJvZ3JhbSwgY29tcGlsZXJ9O1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2VyLndhcm4oYFxcbiR7TUlHUkFUSU9OX0FPVF9GQUlMVVJFfSBUaGUgZm9sbG93aW5nIHByb2plY3QgZmFpbGVkOiAke3RzY29uZmlnUGF0aH1cXG5gKTtcbiAgICBsb2dnZXIuZXJyb3IoYCR7ZS50b1N0cmluZygpfVxcbmApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXX0=