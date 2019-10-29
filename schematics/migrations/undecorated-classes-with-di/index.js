/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/undecorated-classes-with-di", ["require", "exports", "@angular-devkit/schematics", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/undecorated-classes-with-di/create_ngc_program", "@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector", "@angular/core/schematics/migrations/undecorated-classes-with-di/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    const reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    const path_1 = require("path");
    const ts = require("typescript");
    const project_tsconfig_paths_1 = require("@angular/core/schematics/utils/project_tsconfig_paths");
    const compiler_host_1 = require("@angular/core/schematics/utils/typescript/compiler_host");
    const create_ngc_program_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/create_ngc_program");
    const ng_declaration_collector_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector");
    const transform_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/transform");
    const MIGRATION_RERUN_MESSAGE = 'Migration can be rerun with: "ng update @angular/core ' +
        '--from 8.0.0 --to 9.0.0 --migrate-only"';
    const MIGRATION_AOT_FAILURE = 'This migration uses the Angular compiler internally and ' +
        'therefore projects that no longer build successfully after the update cannot run ' +
        'the migration. Please ensure there are no AOT compilation errors and rerun the migration.';
    /** Entry point for the V9 "undecorated-classes-with-di" migration. */
    function default_1() {
        return (tree, ctx) => {
            const { buildPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const failures = [];
            if (!buildPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate undecorated derived classes and ' +
                    'undecorated base classes which use DI.');
            }
            for (const tsconfigPath of buildPaths) {
                failures.push(...runUndecoratedClassesMigration(tree, tsconfigPath, basePath, ctx.logger));
            }
            if (failures.length) {
                ctx.logger.info('Could not migrate all undecorated classes that use dependency');
                ctx.logger.info('injection. Please manually fix the following failures:');
                failures.forEach(message => ctx.logger.warn(`⮑   ${message}`));
            }
        };
    }
    exports.default = default_1;
    function runUndecoratedClassesMigration(tree, tsconfigPath, basePath, logger) {
        const failures = [];
        const programData = gracefullyCreateProgram(tree, basePath, tsconfigPath, logger);
        // Gracefully exit if the program could not be created.
        if (programData === null) {
            return [];
        }
        const { program, compiler } = programData;
        const typeChecker = program.getTypeChecker();
        const partialEvaluator = new partial_evaluator_1.PartialEvaluator(new reflection_1.TypeScriptReflectionHost(typeChecker), typeChecker);
        const declarationCollector = new ng_declaration_collector_1.NgDeclarationCollector(typeChecker, partialEvaluator);
        const rootSourceFiles = program.getRootFileNames().map(f => program.getSourceFile(f));
        // Analyze source files by detecting all directives, components and providers.
        rootSourceFiles.forEach(sourceFile => declarationCollector.visitNode(sourceFile));
        const { decoratedDirectives, decoratedProviders, undecoratedDeclarations } = declarationCollector;
        const transform = new transform_1.UndecoratedClassesTransform(typeChecker, compiler, partialEvaluator, getUpdateRecorder);
        const updateRecorders = new Map();
        // Run the migrations for decorated providers and both decorated and undecorated
        // directives. The transform failures are collected and converted into human-readable
        // failures which can be printed to the console.
        [...transform.migrateDecoratedDirectives(decoratedDirectives),
            ...transform.migrateDecoratedProviders(decoratedProviders),
            ...transform.migrateUndecoratedDeclarations(Array.from(undecoratedDeclarations))]
            .forEach(({ node, message }) => {
            const nodeSourceFile = node.getSourceFile();
            const relativeFilePath = path_1.relative(basePath, nodeSourceFile.fileName);
            const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
            failures.push(`${relativeFilePath}@${line + 1}:${character + 1}: ${message}`);
        });
        // Record the changes collected in the import manager and transformer.
        transform.recordChanges();
        // Walk through each update recorder and commit the update. We need to commit the
        // updates in batches per source file as there can be only one recorder per source
        // file in order to avoid shifted character offsets.
        updateRecorders.forEach(recorder => recorder.commitUpdate());
        return failures;
        /** Gets the update recorder for the specified source file. */
        function getUpdateRecorder(sourceFile) {
            if (updateRecorders.has(sourceFile)) {
                return updateRecorders.get(sourceFile);
            }
            const treeRecorder = tree.beginUpdate(path_1.relative(basePath, sourceFile.fileName));
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
                commitUpdate() { tree.commitUpdate(treeRecorder); }
            };
            updateRecorders.set(sourceFile, recorder);
            return recorder;
        }
    }
    function gracefullyCreateProgram(tree, basePath, tsconfigPath, logger) {
        try {
            const { ngcProgram, host, program, compiler } = create_ngc_program_1.createNgcProgram((options) => compiler_host_1.createMigrationCompilerHost(tree, options, basePath), tsconfigPath);
            const syntacticDiagnostics = ngcProgram.getTsSyntacticDiagnostics();
            const structuralDiagnostics = ngcProgram.getNgStructuralDiagnostics();
            // Syntactic TypeScript errors can throw off the query analysis and therefore we want
            // to notify the developer that we couldn't analyze parts of the project. Developers
            // can just re-run the migration after fixing these failures.
            if (syntacticDiagnostics.length) {
                logger.warn(`\nTypeScript project "${tsconfigPath}" has syntactical errors which could cause ` +
                    `an incomplete migration. Please fix the following failures and rerun the migration:`);
                logger.error(ts.formatDiagnostics(syntacticDiagnostics, host));
                logger.info(MIGRATION_RERUN_MESSAGE);
                return null;
            }
            if (structuralDiagnostics.length) {
                throw new Error(ts.formatDiagnostics(structuralDiagnostics, host));
            }
            return { program, compiler };
        }
        catch (e) {
            logger.warn(`\n${MIGRATION_AOT_FAILURE}. The following project failed: ${tsconfigPath}\n`);
            logger.error(`${e.toString()}\n`);
            logger.info(MIGRATION_RERUN_MESSAGE);
            return null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCwyREFBNkY7SUFFN0YseUZBQW1GO0lBQ25GLDJFQUFvRjtJQUNwRiwrQkFBOEI7SUFDOUIsaUNBQWlDO0lBRWpDLGtHQUEyRTtJQUMzRSwyRkFBaUY7SUFFakYsMkhBQXNEO0lBQ3RELHVJQUFrRTtJQUNsRSx5R0FBd0Q7SUFHeEQsTUFBTSx1QkFBdUIsR0FBRyx3REFBd0Q7UUFDcEYseUNBQXlDLENBQUM7SUFFOUMsTUFBTSxxQkFBcUIsR0FBRywwREFBMEQ7UUFDcEYsbUZBQW1GO1FBQ25GLDJGQUEyRixDQUFDO0lBRWhHLHNFQUFzRTtJQUN0RTtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsR0FBcUIsRUFBRSxFQUFFO1lBQzNDLE1BQU0sRUFBQyxVQUFVLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBRTlCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUN0QixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLG1GQUFtRjtvQkFDbkYsd0NBQXdDLENBQUMsQ0FBQzthQUMvQztZQUVELEtBQUssTUFBTSxZQUFZLElBQUksVUFBVSxFQUFFO2dCQUNyQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsOEJBQThCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDNUY7WUFFRCxJQUFJLFFB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Q0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFDckMsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELElBQUkscUJBQXFCLENBQUMsTUFBTSxFQUFFO2dCQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBa0IscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNyRjtZQUVELE9BQU8sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7U0FDNUI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxxQkFBcUIsbUNBQW1DLFlBQVksSUFBSSxDQUFDLENBQUM7WUFDM0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3JDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvZ2dpbmd9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7UnVsZSwgU2NoZW1hdGljQ29udGV4dCwgU2NoZW1hdGljc0V4Y2VwdGlvbiwgVHJlZX0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L3NjaGVtYXRpY3MnO1xuaW1wb3J0IHtBb3RDb21waWxlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtQYXJ0aWFsRXZhbHVhdG9yfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL3BhcnRpYWxfZXZhbHVhdG9yJztcbmltcG9ydCB7VHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0fSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL3JlZmxlY3Rpb24nO1xuaW1wb3J0IHtyZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2NyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcblxuaW1wb3J0IHtjcmVhdGVOZ2NQcm9ncmFtfSBmcm9tICcuL2NyZWF0ZV9uZ2NfcHJvZ3JhbSc7XG5pbXBvcnQge05nRGVjbGFyYXRpb25Db2xsZWN0b3J9IGZyb20gJy4vbmdfZGVjbGFyYXRpb25fY29sbGVjdG9yJztcbmltcG9ydCB7VW5kZWNvcmF0ZWRDbGFzc2VzVHJhbnNmb3JtfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbmNvbnN0IE1JR1JBVElPTl9SRVJVTl9NRVNTQUdFID0gJ01pZ3JhdGlvbiBjYW4gYmUgcmVydW4gd2l0aDogXCJuZyB1cGRhdGUgQGFuZ3VsYXIvY29yZSAnICtcbiAgICAnLS1mcm9tIDguMC4wIC0tdG8gOS4wLjAgLS1taWdyYXRlLW9ubHlcIic7XG5cbmNvbnN0IE1JR1JBVElPTl9BT1RfRkFJTFVSRSA9ICdUaGlzIG1pZ3JhdGlvbiB1c2VzIHRoZSBBbmd1bGFyIGNvbXBpbGVyIGludGVybmFsbHkgYW5kICcgK1xuICAgICd0aGVyZWZvcmUgcHJvamVjdHMgdGhhdCBubyBsb25nZXIgYnVpbGQgc3VjY2Vzc2Z1bGx5IGFmdGVyIHRoZSB1cGRhdGUgY2Fubm90IHJ1biAnICtcbiAgICAndGhlIG1pZ3JhdGlvbi4gUGxlYXNlIGVuc3VyZSB0aGVyZSBhcmUgbm8gQU9UIGNvbXBpbGF0aW9uIGVycm9ycyBhbmQgcmVydW4gdGhlIG1pZ3JhdGlvbi4nO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOSBcInVuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaVwiIG1pZ3JhdGlvbi4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGN0eDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmICghYnVpbGRQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgdW5kZWNvcmF0ZWQgZGVyaXZlZCBjbGFzc2VzIGFuZCAnICtcbiAgICAgICAgICAndW5kZWNvcmF0ZWQgYmFzZSBjbGFzc2VzIHdoaWNoIHVzZSBESS4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBidWlsZFBhdGhzKSB7XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLnJ1blVuZGVjb3JhdGVkQ2xhc3Nlc01pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBjdHgubG9nZ2VyKSk7XG4gICAgfVxuXG4gICAgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdDb3VsZCBub3QgbWlncmF0ZSBhbGwgdW5kZWNvcmF0ZWQgY2xhc3NlcyB0aGF0IHVzZSBkZXBlbmRlbmN5Jyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ2luamVjdGlvbi4gUGxlYXNlIG1hbnVhbGx5IGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzOicpO1xuICAgICAgZmFpbHVyZXMuZm9yRWFjaChtZXNzYWdlID0+IGN0eC5sb2dnZXIud2Fybihg4q6RICAgJHttZXNzYWdlfWApKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1blVuZGVjb3JhdGVkQ2xhc3Nlc01pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZywgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHByb2dyYW1EYXRhID0gZ3JhY2VmdWxseUNyZWF0ZVByb2dyYW0odHJlZSwgYmFzZVBhdGgsIHRzY29uZmlnUGF0aCwgbG9nZ2VyKTtcblxuICAvLyBHcmFjZWZ1bGx5IGV4aXQgaWYgdGhlIHByb2dyYW0gY291bGQgbm90IGJlIGNyZWF0ZWQuXG4gIGlmIChwcm9ncmFtRGF0YSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHtwcm9ncmFtLCBjb21waWxlcn0gPSBwcm9ncmFtRGF0YTtcbiAgY29uc3QgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gIGNvbnN0IHBhcnRpYWxFdmFsdWF0b3IgPVxuICAgICAgbmV3IFBhcnRpYWxFdmFsdWF0b3IobmV3IFR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdCh0eXBlQ2hlY2tlciksIHR5cGVDaGVja2VyKTtcbiAgY29uc3QgZGVjbGFyYXRpb25Db2xsZWN0b3IgPSBuZXcgTmdEZWNsYXJhdGlvbkNvbGxlY3Rvcih0eXBlQ2hlY2tlciwgcGFydGlhbEV2YWx1YXRvcik7XG4gIGNvbnN0IHJvb3RTb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0Um9vdEZpbGVOYW1lcygpLm1hcChmID0+IHByb2dyYW0uZ2V0U291cmNlRmlsZShmKSAhKTtcblxuICAvLyBBbmFseXplIHNvdXJjZSBmaWxlcyBieSBkZXRlY3RpbmcgYWxsIGRpcmVjdGl2ZXMsIGNvbXBvbmVudHMgYW5kIHByb3ZpZGVycy5cbiAgcm9vdFNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiBkZWNsYXJhdGlvbkNvbGxlY3Rvci52aXNpdE5vZGUoc291cmNlRmlsZSkpO1xuXG4gIGNvbnN0IHtkZWNvcmF0ZWREaXJlY3RpdmVzLCBkZWNvcmF0ZWRQcm92aWRlcnMsIHVuZGVjb3JhdGVkRGVjbGFyYXRpb25zfSA9IGRlY2xhcmF0aW9uQ29sbGVjdG9yO1xuICBjb25zdCB0cmFuc2Zvcm0gPVxuICAgICAgbmV3IFVuZGVjb3JhdGVkQ2xhc3Nlc1RyYW5zZm9ybSh0eXBlQ2hlY2tlciwgY29tcGlsZXIsIHBhcnRpYWxFdmFsdWF0b3IsIGdldFVwZGF0ZVJlY29yZGVyKTtcbiAgY29uc3QgdXBkYXRlUmVjb3JkZXJzID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICAvLyBSdW4gdGhlIG1pZ3JhdGlvbnMgZm9yIGRlY29yYXRlZCBwcm92aWRlcnMgYW5kIGJvdGggZGVjb3JhdGVkIGFuZCB1bmRlY29yYXRlZFxuICAvLyBkaXJlY3RpdmVzLiBUaGUgdHJhbnNmb3JtIGZhaWx1cmVzIGFyZSBjb2xsZWN0ZWQgYW5kIGNvbnZlcnRlZCBpbnRvIGh1bWFuLXJlYWRhYmxlXG4gIC8vIGZhaWx1cmVzIHdoaWNoIGNhbiBiZSBwcmludGVkIHRvIHRoZSBjb25zb2xlLlxuICBbLi4udHJhbnNmb3JtLm1pZ3JhdGVEZWNvcmF0ZWREaXJlY3RpdmVzKGRlY29yYXRlZERpcmVjdGl2ZXMpLFxuICAgLi4udHJhbnNmb3JtLm1pZ3JhdGVEZWNvcmF0ZWRQcm92aWRlcnMoZGVjb3JhdGVkUHJvdmlkZXJzKSxcbiAgIC4uLnRyYW5zZm9ybS5taWdyYXRlVW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMoQXJyYXkuZnJvbSh1bmRlY29yYXRlZERlY2xhcmF0aW9ucykpXVxuICAgICAgLmZvckVhY2goKHtub2RlLCBtZXNzYWdlfSkgPT4ge1xuICAgICAgICBjb25zdCBub2RlU291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgICAgICBjb25zdCByZWxhdGl2ZUZpbGVQYXRoID0gcmVsYXRpdmUoYmFzZVBhdGgsIG5vZGVTb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24obm9kZS5nZXRTb3VyY2VGaWxlKCksIG5vZGUuZ2V0U3RhcnQoKSk7XG4gICAgICAgIGZhaWx1cmVzLnB1c2goYCR7cmVsYXRpdmVGaWxlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfTogJHttZXNzYWdlfWApO1xuICAgICAgfSk7XG5cbiAgLy8gUmVjb3JkIHRoZSBjaGFuZ2VzIGNvbGxlY3RlZCBpbiB0aGUgaW1wb3J0IG1hbmFnZXIgYW5kIHRyYW5zZm9ybWVyLlxuICB0cmFuc2Zvcm0ucmVjb3JkQ2hhbmdlcygpO1xuXG4gIC8vIFdhbGsgdGhyb3VnaCBlYWNoIHVwZGF0ZSByZWNvcmRlciBhbmQgY29tbWl0IHRoZSB1cGRhdGUuIFdlIG5lZWQgdG8gY29tbWl0IHRoZVxuICAvLyB1cGRhdGVzIGluIGJhdGNoZXMgcGVyIHNvdXJjZSBmaWxlIGFzIHRoZXJlIGNhbiBiZSBvbmx5IG9uZSByZWNvcmRlciBwZXIgc291cmNlXG4gIC8vIGZpbGUgaW4gb3JkZXIgdG8gYXZvaWQgc2hpZnRlZCBjaGFyYWN0ZXIgb2Zmc2V0cy5cbiAgdXBkYXRlUmVjb3JkZXJzLmZvckVhY2gocmVjb3JkZXIgPT4gcmVjb3JkZXIuY29tbWl0VXBkYXRlKCkpO1xuXG4gIHJldHVybiBmYWlsdXJlcztcblxuICAvKiogR2V0cyB0aGUgdXBkYXRlIHJlY29yZGVyIGZvciB0aGUgc3BlY2lmaWVkIHNvdXJjZSBmaWxlLiAqL1xuICBmdW5jdGlvbiBnZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGlmICh1cGRhdGVSZWNvcmRlcnMuaGFzKHNvdXJjZUZpbGUpKSB7XG4gICAgICByZXR1cm4gdXBkYXRlUmVjb3JkZXJzLmdldChzb3VyY2VGaWxlKSAhO1xuICAgIH1cbiAgICBjb25zdCB0cmVlUmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG4gICAgY29uc3QgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyID0ge1xuICAgICAgYWRkQ2xhc3NDb21tZW50KG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHRleHQ6IHN0cmluZykge1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0TGVmdChub2RlLm1lbWJlcnMucG9zLCBgXFxuICAvLyAke3RleHR9XFxuYCk7XG4gICAgICB9LFxuICAgICAgYWRkQ2xhc3NEZWNvcmF0b3Iobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KG5vZGUuZ2V0U3RhcnQoKSwgYCR7dGV4dH1cXG5gKTtcbiAgICAgIH0sXG4gICAgICBhZGROZXdJbXBvcnQoc3RhcnQ6IG51bWJlciwgaW1wb3J0VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydExlZnQoc3RhcnQsIGltcG9ydFRleHQpO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZUV4aXN0aW5nSW1wb3J0KG5hbWVkQmluZGluZ3M6IHRzLk5hbWVkSW1wb3J0cywgbmV3TmFtZWRCaW5kaW5nczogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuYW1lZEJpbmRpbmdzLmdldFdpZHRoKCkpO1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuZXdOYW1lZEJpbmRpbmdzKTtcbiAgICAgIH0sXG4gICAgICBjb21taXRVcGRhdGUoKSB7IHRyZWUuY29tbWl0VXBkYXRlKHRyZWVSZWNvcmRlcik7IH1cbiAgICB9O1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBncmFjZWZ1bGx5Q3JlYXRlUHJvZ3JhbShcbiAgICB0cmVlOiBUcmVlLCBiYXNlUGF0aDogc3RyaW5nLCB0c2NvbmZpZ1BhdGg6IHN0cmluZyxcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpKToge2NvbXBpbGVyOiBBb3RDb21waWxlciwgcHJvZ3JhbTogdHMuUHJvZ3JhbX18bnVsbCB7XG4gIHRyeSB7XG4gICAgY29uc3Qge25nY1Byb2dyYW0sIGhvc3QsIHByb2dyYW0sIGNvbXBpbGVyfSA9IGNyZWF0ZU5nY1Byb2dyYW0oXG4gICAgICAgIChvcHRpb25zKSA9PiBjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3QodHJlZSwgb3B0aW9ucywgYmFzZVBhdGgpLCB0c2NvbmZpZ1BhdGgpO1xuICAgIGNvbnN0IHN5bnRhY3RpY0RpYWdub3N0aWNzID0gbmdjUHJvZ3JhbS5nZXRUc1N5bnRhY3RpY0RpYWdub3N0aWNzKCk7XG4gICAgY29uc3Qgc3RydWN0dXJhbERpYWdub3N0aWNzID0gbmdjUHJvZ3JhbS5nZXROZ1N0cnVjdHVyYWxEaWFnbm9zdGljcygpO1xuXG4gICAgLy8gU3ludGFjdGljIFR5cGVTY3JpcHQgZXJyb3JzIGNhbiB0aHJvdyBvZmYgdGhlIHF1ZXJ5IGFuYWx5c2lzIGFuZCB0aGVyZWZvcmUgd2Ugd2FudFxuICAgIC8vIHRvIG5vdGlmeSB0aGUgZGV2ZWxvcGVyIHRoYXQgd2UgY291bGRuJ3QgYW5hbHl6ZSBwYXJ0cyBvZiB0aGUgcHJvamVjdC4gRGV2ZWxvcGVyc1xuICAgIC8vIGNhbiBqdXN0IHJlLXJ1biB0aGUgbWlncmF0aW9uIGFmdGVyIGZpeGluZyB0aGVzZSBmYWlsdXJlcy5cbiAgICBpZiAoc3ludGFjdGljRGlhZ25vc3RpY3MubGVuZ3RoKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICBgXFxuVHlwZVNjcmlwdCBwcm9qZWN0IFwiJHt0c2NvbmZpZ1BhdGh9XCIgaGFzIHN5bnRhY3RpY2FsIGVycm9ycyB3aGljaCBjb3VsZCBjYXVzZSBgICtcbiAgICAgICAgICBgYW4gaW5jb21wbGV0ZSBtaWdyYXRpb24uIFBsZWFzZSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlcyBhbmQgcmVydW4gdGhlIG1pZ3JhdGlvbjpgKTtcbiAgICAgIGxvZ2dlci5lcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhzeW50YWN0aWNEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgICAgbG9nZ2VyLmluZm8oTUlHUkFUSU9OX1JFUlVOX01FU1NBR0UpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHN0cnVjdHVyYWxEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyg8dHMuRGlhZ25vc3RpY1tdPnN0cnVjdHVyYWxEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgIH1cblxuICAgIHJldHVybiB7cHJvZ3JhbSwgY29tcGlsZXJ9O1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2VyLndhcm4oYFxcbiR7TUlHUkFUSU9OX0FPVF9GQUlMVVJFfS4gVGhlIGZvbGxvd2luZyBwcm9qZWN0IGZhaWxlZDogJHt0c2NvbmZpZ1BhdGh9XFxuYCk7XG4gICAgbG9nZ2VyLmVycm9yKGAke2UudG9TdHJpbmcoKX1cXG5gKTtcbiAgICBsb2dnZXIuaW5mbyhNSUdSQVRJT05fUkVSVU5fTUVTU0FHRSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==