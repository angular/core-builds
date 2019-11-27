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
        '--migrate-only migration-v9-undecorated-classes-with-di"';
    const MIGRATION_AOT_FAILURE = 'This migration uses the Angular compiler internally and ' +
        'therefore projects that no longer build successfully after the update cannot run ' +
        'the migration. Please ensure there are no AOT compilation errors and rerun the migration.';
    /** Entry point for the V9 "undecorated-classes-with-di" migration. */
    function default_1() {
        return (tree, ctx) => {
            const { buildPaths } = project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
            const basePath = process.cwd();
            const failures = [];
            let programError = false;
            if (!buildPaths.length) {
                throw new schematics_1.SchematicsException('Could not find any tsconfig file. Cannot migrate undecorated derived classes and ' +
                    'undecorated base classes which use DI.');
            }
            for (const tsconfigPath of buildPaths) {
                const result = runUndecoratedClassesMigration(tree, tsconfigPath, basePath, ctx.logger);
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
        };
    }
    exports.default = default_1;
    function runUndecoratedClassesMigration(tree, tsconfigPath, basePath, logger) {
        const failures = [];
        const programData = gracefullyCreateProgram(tree, basePath, tsconfigPath, logger);
        // Gracefully exit if the program could not be created.
        if (programData === null) {
            return { failures: [], programError: true };
        }
        const { program, compiler } = programData;
        const typeChecker = program.getTypeChecker();
        const partialEvaluator = new partial_evaluator_1.PartialEvaluator(new reflection_1.TypeScriptReflectionHost(typeChecker), typeChecker);
        const declarationCollector = new ng_declaration_collector_1.NgDeclarationCollector(typeChecker, partialEvaluator);
        const sourceFiles = program.getSourceFiles().filter(s => !s.isDeclarationFile && !program.isSourceFileFromExternalLibrary(s));
        // Analyze source files by detecting all directives, components and providers.
        sourceFiles.forEach(sourceFile => declarationCollector.visitNode(sourceFile));
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
        return { failures };
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
    function getErrorDiagnostics(diagnostics) {
        return diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
    }
    function gracefullyCreateProgram(tree, basePath, tsconfigPath, logger) {
        try {
            const { ngcProgram, host, program, compiler } = create_ngc_program_1.createNgcProgram((options) => compiler_host_1.createMigrationCompilerHost(tree, options, basePath), tsconfigPath);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCwyREFBNkY7SUFHN0YseUZBQW1GO0lBQ25GLDJFQUFvRjtJQUNwRiwrQkFBOEI7SUFDOUIsaUNBQWlDO0lBRWpDLGtHQUEyRTtJQUMzRSwyRkFBaUY7SUFFakYsMkhBQXNEO0lBQ3RELHVJQUFrRTtJQUNsRSx5R0FBd0Q7SUFHeEQsTUFBTSx1QkFBdUIsR0FBRyx3REFBd0Q7UUFDcEYsMERBQTBELENBQUM7SUFFL0QsTUFBTSxxQkFBcUIsR0FBRywwREFBMEQ7UUFDcEYsbUZBQW1GO1FBQ25GLDJGQUEyRixDQUFDO0lBRWhHLHNFQUFzRTtJQUN0RTtRQUNFLE9BQU8sQ0FBQyxJQUFVLEVBQUUsR0FBcUIsRUFBRSxFQUFFO1lBQzNDLE1BQU0sRUFBQyxVQUFVLEVBQUMsR0FBRyxnREFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBQzlCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztZQUV6QixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtnQkFDdEIsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixtRkFBbUY7b0JBQ25GLHdDQUF3QyxDQUFDLENBQUM7YUFDL0M7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFVBQVUsRUFBRTtnQkFDckMsTUFBTSxNQUFNLEdBQUcsOEJBQThCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dC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QUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQscUZBQXFGO1lBQ3JGLG9GQUFvRjtZQUNwRiw2REFBNkQ7WUFDN0QsSUFBSSxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQ1AseUJBQXlCLFlBQVksNkNBQTZDO29CQUNsRixxRkFBcUYsQ0FBQyxDQUFDO2dCQUMzRixNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQsSUFBSSxxQkFBcUIsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFrQixxQkFBcUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ3JGO1lBRUQsT0FBTyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUMsQ0FBQztTQUM1QjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLHFCQUFxQixrQ0FBa0MsWUFBWSxJQUFJLENBQUMsQ0FBQztZQUMxRixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsQyxPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7QW90Q29tcGlsZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7RGlhZ25vc3RpYyBhcyBOZ0RpYWdub3N0aWN9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSc7XG5pbXBvcnQge1BhcnRpYWxFdmFsdWF0b3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcmVmbGVjdGlvbic7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y3JlYXRlTWlncmF0aW9uQ29tcGlsZXJIb3N0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2NvbXBpbGVyX2hvc3QnO1xuXG5pbXBvcnQge2NyZWF0ZU5nY1Byb2dyYW19IGZyb20gJy4vY3JlYXRlX25nY19wcm9ncmFtJztcbmltcG9ydCB7TmdEZWNsYXJhdGlvbkNvbGxlY3Rvcn0gZnJvbSAnLi9uZ19kZWNsYXJhdGlvbl9jb2xsZWN0b3InO1xuaW1wb3J0IHtVbmRlY29yYXRlZENsYXNzZXNUcmFuc2Zvcm19IGZyb20gJy4vdHJhbnNmb3JtJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuY29uc3QgTUlHUkFUSU9OX1JFUlVOX01FU1NBR0UgPSAnTWlncmF0aW9uIGNhbiBiZSByZXJ1biB3aXRoOiBcIm5nIHVwZGF0ZSBAYW5ndWxhci9jb3JlICcgK1xuICAgICctLW1pZ3JhdGUtb25seSBtaWdyYXRpb24tdjktdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpXCInO1xuXG5jb25zdCBNSUdSQVRJT05fQU9UX0ZBSUxVUkUgPSAnVGhpcyBtaWdyYXRpb24gdXNlcyB0aGUgQW5ndWxhciBjb21waWxlciBpbnRlcm5hbGx5IGFuZCAnICtcbiAgICAndGhlcmVmb3JlIHByb2plY3RzIHRoYXQgbm8gbG9uZ2VyIGJ1aWxkIHN1Y2Nlc3NmdWxseSBhZnRlciB0aGUgdXBkYXRlIGNhbm5vdCBydW4gJyArXG4gICAgJ3RoZSBtaWdyYXRpb24uIFBsZWFzZSBlbnN1cmUgdGhlcmUgYXJlIG5vIEFPVCBjb21waWxhdGlvbiBlcnJvcnMgYW5kIHJlcnVuIHRoZSBtaWdyYXRpb24uJztcblxuLyoqIEVudHJ5IHBvaW50IGZvciB0aGUgVjkgXCJ1bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGlcIiBtaWdyYXRpb24uICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbigpOiBSdWxlIHtcbiAgcmV0dXJuICh0cmVlOiBUcmVlLCBjdHg6IFNjaGVtYXRpY0NvbnRleHQpID0+IHtcbiAgICBjb25zdCB7YnVpbGRQYXRoc30gPSBnZXRQcm9qZWN0VHNDb25maWdQYXRocyh0cmVlKTtcbiAgICBjb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IHByb2dyYW1FcnJvciA9IGZhbHNlO1xuXG4gICAgaWYgKCFidWlsZFBhdGhzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgJ0NvdWxkIG5vdCBmaW5kIGFueSB0c2NvbmZpZyBmaWxlLiBDYW5ub3QgbWlncmF0ZSB1bmRlY29yYXRlZCBkZXJpdmVkIGNsYXNzZXMgYW5kICcgK1xuICAgICAgICAgICd1bmRlY29yYXRlZCBiYXNlIGNsYXNzZXMgd2hpY2ggdXNlIERJLicpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgdHNjb25maWdQYXRoIG9mIGJ1aWxkUGF0aHMpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHJ1blVuZGVjb3JhdGVkQ2xhc3Nlc01pZ3JhdGlvbih0cmVlLCB0c2NvbmZpZ1BhdGgsIGJhc2VQYXRoLCBjdHgubG9nZ2VyKTtcbiAgICAgIGZhaWx1cmVzLnB1c2goLi4ucmVzdWx0LmZhaWx1cmVzKTtcbiAgICAgIHByb2dyYW1FcnJvciA9IHByb2dyYW1FcnJvciB8fCAhIXJlc3VsdC5wcm9ncmFtRXJyb3I7XG4gICAgfVxuXG4gICAgaWYgKHByb2dyYW1FcnJvcikge1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdDb3VsZCBub3QgbWlncmF0ZSBhbGwgdW5kZWNvcmF0ZWQgY2xhc3NlcyB0aGF0IHVzZSBkZXBlbmRlbmN5Jyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ2luamVjdGlvbi4gU29tZSBwcm9qZWN0IHRhcmdldHMgY291bGQgbm90IGJlIGFuYWx5emVkIGR1ZSB0bycpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdUeXBlU2NyaXB0IHByb2dyYW0gZmFpbHVyZXMuXFxuJyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oYCR7TUlHUkFUSU9OX1JFUlVOX01FU1NBR0V9XFxuYCk7XG5cbiAgICAgIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgICAgY3R4LmxvZ2dlci5pbmZvKCdQbGVhc2UgbWFudWFsbHkgZml4IHRoZSBmb2xsb3dpbmcgZmFpbHVyZXMgYW5kIHJlLXJ1biB0aGUnKTtcbiAgICAgICAgY3R4LmxvZ2dlci5pbmZvKCdtaWdyYXRpb24gb25jZSB0aGUgVHlwZVNjcmlwdCBwcm9ncmFtIGZhaWx1cmVzIGFyZSByZXNvbHZlZC4nKTtcbiAgICAgICAgZmFpbHVyZXMuZm9yRWFjaChtZXNzYWdlID0+IGN0eC5sb2dnZXIud2Fybihg4q6RICAgJHttZXNzYWdlfWApKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZhaWx1cmVzLmxlbmd0aCkge1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdDb3VsZCBub3QgbWlncmF0ZSBhbGwgdW5kZWNvcmF0ZWQgY2xhc3NlcyB0aGF0IHVzZSBkZXBlbmRlbmN5Jyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ2luamVjdGlvbi4gUGxlYXNlIG1hbnVhbGx5IGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzOicpO1xuICAgICAgZmFpbHVyZXMuZm9yRWFjaChtZXNzYWdlID0+IGN0eC5sb2dnZXIud2Fybihg4q6RICAgJHttZXNzYWdlfWApKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1blVuZGVjb3JhdGVkQ2xhc3Nlc01pZ3JhdGlvbihcbiAgICB0cmVlOiBUcmVlLCB0c2NvbmZpZ1BhdGg6IHN0cmluZywgYmFzZVBhdGg6IHN0cmluZyxcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpKToge2ZhaWx1cmVzOiBzdHJpbmdbXSwgcHJvZ3JhbUVycm9yPzogYm9vbGVhbn0ge1xuICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgcHJvZ3JhbURhdGEgPSBncmFjZWZ1bGx5Q3JlYXRlUHJvZ3JhbSh0cmVlLCBiYXNlUGF0aCwgdHNjb25maWdQYXRoLCBsb2dnZXIpO1xuXG4gIC8vIEdyYWNlZnVsbHkgZXhpdCBpZiB0aGUgcHJvZ3JhbSBjb3VsZCBub3QgYmUgY3JlYXRlZC5cbiAgaWYgKHByb2dyYW1EYXRhID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHtmYWlsdXJlczogW10sIHByb2dyYW1FcnJvcjogdHJ1ZX07XG4gIH1cblxuICBjb25zdCB7cHJvZ3JhbSwgY29tcGlsZXJ9ID0gcHJvZ3JhbURhdGE7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBwYXJ0aWFsRXZhbHVhdG9yID1cbiAgICAgIG5ldyBQYXJ0aWFsRXZhbHVhdG9yKG5ldyBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QodHlwZUNoZWNrZXIpLCB0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IGRlY2xhcmF0aW9uQ29sbGVjdG9yID0gbmV3IE5nRGVjbGFyYXRpb25Db2xsZWN0b3IodHlwZUNoZWNrZXIsIHBhcnRpYWxFdmFsdWF0b3IpO1xuICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoXG4gICAgICBzID0+ICFzLmlzRGVjbGFyYXRpb25GaWxlICYmICFwcm9ncmFtLmlzU291cmNlRmlsZUZyb21FeHRlcm5hbExpYnJhcnkocykpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBhbGwgZGlyZWN0aXZlcywgY29tcG9uZW50cyBhbmQgcHJvdmlkZXJzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gZGVjbGFyYXRpb25Db2xsZWN0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7ZGVjb3JhdGVkRGlyZWN0aXZlcywgZGVjb3JhdGVkUHJvdmlkZXJzLCB1bmRlY29yYXRlZERlY2xhcmF0aW9uc30gPSBkZWNsYXJhdGlvbkNvbGxlY3RvcjtcbiAgY29uc3QgdHJhbnNmb3JtID1cbiAgICAgIG5ldyBVbmRlY29yYXRlZENsYXNzZXNUcmFuc2Zvcm0odHlwZUNoZWNrZXIsIGNvbXBpbGVyLCBwYXJ0aWFsRXZhbHVhdG9yLCBnZXRVcGRhdGVSZWNvcmRlcik7XG4gIGNvbnN0IHVwZGF0ZVJlY29yZGVycyA9IG5ldyBNYXA8dHMuU291cmNlRmlsZSwgVXBkYXRlUmVjb3JkZXI+KCk7XG5cbiAgLy8gUnVuIHRoZSBtaWdyYXRpb25zIGZvciBkZWNvcmF0ZWQgcHJvdmlkZXJzIGFuZCBib3RoIGRlY29yYXRlZCBhbmQgdW5kZWNvcmF0ZWRcbiAgLy8gZGlyZWN0aXZlcy4gVGhlIHRyYW5zZm9ybSBmYWlsdXJlcyBhcmUgY29sbGVjdGVkIGFuZCBjb252ZXJ0ZWQgaW50byBodW1hbi1yZWFkYWJsZVxuICAvLyBmYWlsdXJlcyB3aGljaCBjYW4gYmUgcHJpbnRlZCB0byB0aGUgY29uc29sZS5cbiAgWy4uLnRyYW5zZm9ybS5taWdyYXRlRGVjb3JhdGVkRGlyZWN0aXZlcyhkZWNvcmF0ZWREaXJlY3RpdmVzKSxcbiAgIC4uLnRyYW5zZm9ybS5taWdyYXRlRGVjb3JhdGVkUHJvdmlkZXJzKGRlY29yYXRlZFByb3ZpZGVycyksXG4gICAuLi50cmFuc2Zvcm0ubWlncmF0ZVVuZGVjb3JhdGVkRGVjbGFyYXRpb25zKEFycmF5LmZyb20odW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMpKV1cbiAgICAgIC5mb3JFYWNoKCh7bm9kZSwgbWVzc2FnZX0pID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZVNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVGaWxlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBub2RlU291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgICAgIGNvbnN0IHtsaW5lLCBjaGFyYWN0ZXJ9ID1cbiAgICAgICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKG5vZGUuZ2V0U291cmNlRmlsZSgpLCBub2RlLmdldFN0YXJ0KCkpO1xuICAgICAgICBmYWlsdXJlcy5wdXNoKGAke3JlbGF0aXZlRmlsZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX06ICR7bWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuXG4gIC8vIFJlY29yZCB0aGUgY2hhbmdlcyBjb2xsZWN0ZWQgaW4gdGhlIGltcG9ydCBtYW5hZ2VyIGFuZCB0cmFuc2Zvcm1lci5cbiAgdHJhbnNmb3JtLnJlY29yZENoYW5nZXMoKTtcblxuICAvLyBXYWxrIHRocm91Z2ggZWFjaCB1cGRhdGUgcmVjb3JkZXIgYW5kIGNvbW1pdCB0aGUgdXBkYXRlLiBXZSBuZWVkIHRvIGNvbW1pdCB0aGVcbiAgLy8gdXBkYXRlcyBpbiBiYXRjaGVzIHBlciBzb3VyY2UgZmlsZSBhcyB0aGVyZSBjYW4gYmUgb25seSBvbmUgcmVjb3JkZXIgcGVyIHNvdXJjZVxuICAvLyBmaWxlIGluIG9yZGVyIHRvIGF2b2lkIHNoaWZ0ZWQgY2hhcmFjdGVyIG9mZnNldHMuXG4gIHVwZGF0ZVJlY29yZGVycy5mb3JFYWNoKHJlY29yZGVyID0+IHJlY29yZGVyLmNvbW1pdFVwZGF0ZSgpKTtcblxuICByZXR1cm4ge2ZhaWx1cmVzfTtcblxuICAvKiogR2V0cyB0aGUgdXBkYXRlIHJlY29yZGVyIGZvciB0aGUgc3BlY2lmaWVkIHNvdXJjZSBmaWxlLiAqL1xuICBmdW5jdGlvbiBnZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGlmICh1cGRhdGVSZWNvcmRlcnMuaGFzKHNvdXJjZUZpbGUpKSB7XG4gICAgICByZXR1cm4gdXBkYXRlUmVjb3JkZXJzLmdldChzb3VyY2VGaWxlKSAhO1xuICAgIH1cbiAgICBjb25zdCB0cmVlUmVjb3JkZXIgPSB0cmVlLmJlZ2luVXBkYXRlKHJlbGF0aXZlKGJhc2VQYXRoLCBzb3VyY2VGaWxlLmZpbGVOYW1lKSk7XG4gICAgY29uc3QgcmVjb3JkZXI6IFVwZGF0ZVJlY29yZGVyID0ge1xuICAgICAgYWRkQ2xhc3NDb21tZW50KG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHRleHQ6IHN0cmluZykge1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0TGVmdChub2RlLm1lbWJlcnMucG9zLCBgXFxuICAvLyAke3RleHR9XFxuYCk7XG4gICAgICB9LFxuICAgICAgYWRkQ2xhc3NEZWNvcmF0b3Iobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KG5vZGUuZ2V0U3RhcnQoKSwgYCR7dGV4dH1cXG5gKTtcbiAgICAgIH0sXG4gICAgICBhZGROZXdJbXBvcnQoc3RhcnQ6IG51bWJlciwgaW1wb3J0VGV4dDogc3RyaW5nKSB7XG4gICAgICAgIC8vIE5ldyBpbXBvcnRzIHNob3VsZCBiZSBpbnNlcnRlZCBhdCB0aGUgbGVmdCB3aGlsZSBkZWNvcmF0b3JzIHNob3VsZCBiZSBpbnNlcnRlZFxuICAgICAgICAvLyBhdCB0aGUgcmlnaHQgaW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgaW1wb3J0cyBhcmUgaW5zZXJ0ZWQgYmVmb3JlIHRoZSBkZWNvcmF0b3JcbiAgICAgICAgLy8gaWYgdGhlIHN0YXJ0IHBvc2l0aW9uIG9mIGltcG9ydCBhbmQgZGVjb3JhdG9yIGlzIHRoZSBzb3VyY2UgZmlsZSBzdGFydC5cbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydExlZnQoc3RhcnQsIGltcG9ydFRleHQpO1xuICAgICAgfSxcbiAgICAgIHVwZGF0ZUV4aXN0aW5nSW1wb3J0KG5hbWVkQmluZGluZ3M6IHRzLk5hbWVkSW1wb3J0cywgbmV3TmFtZWRCaW5kaW5nczogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5yZW1vdmUobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuYW1lZEJpbmRpbmdzLmdldFdpZHRoKCkpO1xuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobmFtZWRCaW5kaW5ncy5nZXRTdGFydCgpLCBuZXdOYW1lZEJpbmRpbmdzKTtcbiAgICAgIH0sXG4gICAgICBjb21taXRVcGRhdGUoKSB7IHRyZWUuY29tbWl0VXBkYXRlKHRyZWVSZWNvcmRlcik7IH1cbiAgICB9O1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRFcnJvckRpYWdub3N0aWNzKGRpYWdub3N0aWNzOiBSZWFkb25seUFycmF5PHRzLkRpYWdub3N0aWN8TmdEaWFnbm9zdGljPikge1xuICByZXR1cm4gPHRzLkRpYWdub3N0aWNbXT5kaWFnbm9zdGljcy5maWx0ZXIoZCA9PiBkLmNhdGVnb3J5ID09PSB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IpO1xufVxuXG5mdW5jdGlvbiBncmFjZWZ1bGx5Q3JlYXRlUHJvZ3JhbShcbiAgICB0cmVlOiBUcmVlLCBiYXNlUGF0aDogc3RyaW5nLCB0c2NvbmZpZ1BhdGg6IHN0cmluZyxcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpKToge2NvbXBpbGVyOiBBb3RDb21waWxlciwgcHJvZ3JhbTogdHMuUHJvZ3JhbX18bnVsbCB7XG4gIHRyeSB7XG4gICAgY29uc3Qge25nY1Byb2dyYW0sIGhvc3QsIHByb2dyYW0sIGNvbXBpbGVyfSA9IGNyZWF0ZU5nY1Byb2dyYW0oXG4gICAgICAgIChvcHRpb25zKSA9PiBjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3QodHJlZSwgb3B0aW9ucywgYmFzZVBhdGgpLCB0c2NvbmZpZ1BhdGgpO1xuICAgIGNvbnN0IHN5bnRhY3RpY0RpYWdub3N0aWNzID0gZ2V0RXJyb3JEaWFnbm9zdGljcyhuZ2NQcm9ncmFtLmdldFRzU3ludGFjdGljRGlhZ25vc3RpY3MoKSk7XG4gICAgY29uc3Qgc3RydWN0dXJhbERpYWdub3N0aWNzID0gZ2V0RXJyb3JEaWFnbm9zdGljcyhuZ2NQcm9ncmFtLmdldE5nU3RydWN0dXJhbERpYWdub3N0aWNzKCkpO1xuICAgIGNvbnN0IGNvbmZpZ0RpYWdub3N0aWNzID0gZ2V0RXJyb3JEaWFnbm9zdGljcyhcbiAgICAgICAgWy4uLnByb2dyYW0uZ2V0T3B0aW9uc0RpYWdub3N0aWNzKCksIC4uLm5nY1Byb2dyYW0uZ2V0TmdPcHRpb25EaWFnbm9zdGljcygpXSk7XG5cbiAgICBpZiAoY29uZmlnRGlhZ25vc3RpY3MubGVuZ3RoKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICBgXFxuVHlwZVNjcmlwdCBwcm9qZWN0IFwiJHt0c2NvbmZpZ1BhdGh9XCIgaGFzIGNvbmZpZ3VyYXRpb24gZXJyb3JzLiBUaGlzIGNvdWxkIGNhdXNlIGAgK1xuICAgICAgICAgIGBhbiBpbmNvbXBsZXRlIG1pZ3JhdGlvbi4gUGxlYXNlIGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uOmApO1xuICAgICAgbG9nZ2VyLmVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKGNvbmZpZ0RpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBTeW50YWN0aWMgVHlwZVNjcmlwdCBlcnJvcnMgY2FuIHRocm93IG9mZiB0aGUgcXVlcnkgYW5hbHlzaXMgYW5kIHRoZXJlZm9yZSB3ZSB3YW50XG4gICAgLy8gdG8gbm90aWZ5IHRoZSBkZXZlbG9wZXIgdGhhdCB3ZSBjb3VsZG4ndCBhbmFseXplIHBhcnRzIG9mIHRoZSBwcm9qZWN0LiBEZXZlbG9wZXJzXG4gICAgLy8gY2FuIGp1c3QgcmUtcnVuIHRoZSBtaWdyYXRpb24gYWZ0ZXIgZml4aW5nIHRoZXNlIGZhaWx1cmVzLlxuICAgIGlmIChzeW50YWN0aWNEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIGxvZ2dlci53YXJuKFxuICAgICAgICAgIGBcXG5UeXBlU2NyaXB0IHByb2plY3QgXCIke3RzY29uZmlnUGF0aH1cIiBoYXMgc3ludGFjdGljYWwgZXJyb3JzIHdoaWNoIGNvdWxkIGNhdXNlIGAgK1xuICAgICAgICAgIGBhbiBpbmNvbXBsZXRlIG1pZ3JhdGlvbi4gUGxlYXNlIGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uOmApO1xuICAgICAgbG9nZ2VyLmVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKHN5bnRhY3RpY0RpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoc3RydWN0dXJhbERpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKDx0cy5EaWFnbm9zdGljW10+c3RydWN0dXJhbERpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtwcm9ncmFtLCBjb21waWxlcn07XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2dnZXIud2FybihgXFxuJHtNSUdSQVRJT05fQU9UX0ZBSUxVUkV9IFRoZSBmb2xsb3dpbmcgcHJvamVjdCBmYWlsZWQ6ICR7dHNjb25maWdQYXRofVxcbmApO1xuICAgIGxvZ2dlci5lcnJvcihgJHtlLnRvU3RyaW5nKCl9XFxuYCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==