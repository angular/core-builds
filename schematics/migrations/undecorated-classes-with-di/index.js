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
        return (tree, ctx) => __awaiter(this, void 0, void 0, function* () {
            const { buildPaths } = yield project_tsconfig_paths_1.getProjectTsConfigPaths(tree);
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
        });
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
        const partialEvaluator = new partial_evaluator_1.PartialEvaluator(new reflection_1.TypeScriptReflectionHost(typeChecker), typeChecker, /* dependencyTracker */ null);
        const declarationCollector = new ng_declaration_collector_1.NgDeclarationCollector(typeChecker, partialEvaluator);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => compiler_host_1.canMigrateFile(basePath, sourceFile, program));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSCwyREFBNkY7SUFHN0YseUZBQW1GO0lBQ25GLDJFQUFvRjtJQUNwRiwrQkFBOEI7SUFDOUIsaUNBQWlDO0lBRWpDLGtHQUEyRTtJQUMzRSwyRkFBaUc7SUFFakcsMkhBQXNEO0lBQ3RELHVJQUFrRTtJQUNsRSx5R0FBd0Q7SUFHeEQsTUFBTSx1QkFBdUIsR0FBRyx3REFBd0Q7UUFDcEYsMERBQTBELENBQUM7SUFFL0QsTUFBTSxxQkFBcUIsR0FBRywwREFBMEQ7UUFDcEYsbUZBQW1GO1FBQ25GLDJGQUEyRixDQUFDO0lBRWhHLHNFQUFzRTtJQUN0RTtRQUNFLE9BQU8sQ0FBTyxJQUFVLEVBQUUsR0FBcUIsRUFBRSxFQUFFO1lBQ2pELE1BQU0sRUFBQyxVQUFVLEVBQUMsR0FBRyxNQUFNLGdEQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7WUFDOUIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBRXpCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUN0QixNQUFNLElBQUksZ0NBQW1CLENBQ3pCLG1GQUFtRjtvQkFDbkYsd0NBQXdDLENBQUMsQ0FBQzthQUMvQztZQUVELEtBQUssTUFBTSxZQUFZLElBQUksVUFBVSxFQUFFO2dCQUNyQyxNQUFNLE1BQU0sR0FBRyw4QkFBOEIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsTUFB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Q0FBQztnQkFDM0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDNUQsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELHFGQUFxRjtZQUNyRixvRkFBb0Y7WUFDcEYsNkRBQTZEO1lBQzdELElBQUksb0JBQW9CLENBQUMsTUFBTSxFQUFFO2dCQUMvQixNQUFNLENBQUMsSUFBSSxDQUNQLHlCQUF5QixZQUFZLDZDQUE2QztvQkFDbEYscUZBQXFGLENBQUMsQ0FBQztnQkFDM0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDL0QsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELElBQUkscUJBQXFCLENBQUMsTUFBTSxFQUFFO2dCQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBa0IscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNyRjtZQUVELE9BQU8sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7U0FDNUI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxxQkFBcUIsa0NBQWtDLFlBQVksSUFBSSxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEMsT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB7QW90Q29tcGlsZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7RGlhZ25vc3RpYyBhcyBOZ0RpYWdub3N0aWN9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaSc7XG5pbXBvcnQge1BhcnRpYWxFdmFsdWF0b3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcmVmbGVjdGlvbic7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcbmltcG9ydCB7Y2FuTWlncmF0ZUZpbGUsIGNyZWF0ZU1pZ3JhdGlvbkNvbXBpbGVySG9zdH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jb21waWxlcl9ob3N0JztcblxuaW1wb3J0IHtjcmVhdGVOZ2NQcm9ncmFtfSBmcm9tICcuL2NyZWF0ZV9uZ2NfcHJvZ3JhbSc7XG5pbXBvcnQge05nRGVjbGFyYXRpb25Db2xsZWN0b3J9IGZyb20gJy4vbmdfZGVjbGFyYXRpb25fY29sbGVjdG9yJztcbmltcG9ydCB7VW5kZWNvcmF0ZWRDbGFzc2VzVHJhbnNmb3JtfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbmNvbnN0IE1JR1JBVElPTl9SRVJVTl9NRVNTQUdFID0gJ01pZ3JhdGlvbiBjYW4gYmUgcmVydW4gd2l0aDogXCJuZyB1cGRhdGUgQGFuZ3VsYXIvY29yZSAnICtcbiAgICAnLS1taWdyYXRlLW9ubHkgbWlncmF0aW9uLXY5LXVuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaVwiJztcblxuY29uc3QgTUlHUkFUSU9OX0FPVF9GQUlMVVJFID0gJ1RoaXMgbWlncmF0aW9uIHVzZXMgdGhlIEFuZ3VsYXIgY29tcGlsZXIgaW50ZXJuYWxseSBhbmQgJyArXG4gICAgJ3RoZXJlZm9yZSBwcm9qZWN0cyB0aGF0IG5vIGxvbmdlciBidWlsZCBzdWNjZXNzZnVsbHkgYWZ0ZXIgdGhlIHVwZGF0ZSBjYW5ub3QgcnVuICcgK1xuICAgICd0aGUgbWlncmF0aW9uLiBQbGVhc2UgZW5zdXJlIHRoZXJlIGFyZSBubyBBT1QgY29tcGlsYXRpb24gZXJyb3JzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uLic7XG5cbi8qKiBFbnRyeSBwb2ludCBmb3IgdGhlIFY5IFwidW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpXCIgbWlncmF0aW9uLiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKTogUnVsZSB7XG4gIHJldHVybiBhc3luYyAodHJlZTogVHJlZSwgY3R4OiBTY2hlbWF0aWNDb250ZXh0KSA9PiB7XG4gICAgY29uc3Qge2J1aWxkUGF0aHN9ID0gYXdhaXQgZ2V0UHJvamVjdFRzQ29uZmlnUGF0aHModHJlZSk7XG4gICAgY29uc3QgYmFzZVBhdGggPSBwcm9jZXNzLmN3ZCgpO1xuICAgIGNvbnN0IGZhaWx1cmVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBwcm9ncmFtRXJyb3IgPSBmYWxzZTtcblxuICAgIGlmICghYnVpbGRQYXRocy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgICdDb3VsZCBub3QgZmluZCBhbnkgdHNjb25maWcgZmlsZS4gQ2Fubm90IG1pZ3JhdGUgdW5kZWNvcmF0ZWQgZGVyaXZlZCBjbGFzc2VzIGFuZCAnICtcbiAgICAgICAgICAndW5kZWNvcmF0ZWQgYmFzZSBjbGFzc2VzIHdoaWNoIHVzZSBESS4nKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBidWlsZFBhdGhzKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgY3R4LmxvZ2dlcik7XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLnJlc3VsdC5mYWlsdXJlcyk7XG4gICAgICBwcm9ncmFtRXJyb3IgPSBwcm9ncmFtRXJyb3IgfHwgISFyZXN1bHQucHJvZ3JhbUVycm9yO1xuICAgIH1cblxuICAgIGlmIChwcm9ncmFtRXJyb3IpIHtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnQ291bGQgbm90IG1pZ3JhdGUgYWxsIHVuZGVjb3JhdGVkIGNsYXNzZXMgdGhhdCB1c2UgZGVwZW5kZW5jeScpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdpbmplY3Rpb24uIFNvbWUgcHJvamVjdCB0YXJnZXRzIGNvdWxkIG5vdCBiZSBhbmFseXplZCBkdWUgdG8nKTtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnVHlwZVNjcmlwdCBwcm9ncmFtIGZhaWx1cmVzLlxcbicpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKGAke01JR1JBVElPTl9SRVJVTl9NRVNTQUdFfVxcbmApO1xuXG4gICAgICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICAgIGN0eC5sb2dnZXIuaW5mbygnUGxlYXNlIG1hbnVhbGx5IGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZS1ydW4gdGhlJyk7XG4gICAgICAgIGN0eC5sb2dnZXIuaW5mbygnbWlncmF0aW9uIG9uY2UgdGhlIFR5cGVTY3JpcHQgcHJvZ3JhbSBmYWlsdXJlcyBhcmUgcmVzb2x2ZWQuJyk7XG4gICAgICAgIGZhaWx1cmVzLmZvckVhY2gobWVzc2FnZSA9PiBjdHgubG9nZ2VyLndhcm4oYOKukSAgICR7bWVzc2FnZX1gKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnQ291bGQgbm90IG1pZ3JhdGUgYWxsIHVuZGVjb3JhdGVkIGNsYXNzZXMgdGhhdCB1c2UgZGVwZW5kZW5jeScpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdpbmplY3Rpb24uIFBsZWFzZSBtYW51YWxseSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlczonKTtcbiAgICAgIGZhaWx1cmVzLmZvckVhY2gobWVzc2FnZSA9PiBjdHgubG9nZ2VyLndhcm4oYOKukSAgICR7bWVzc2FnZX1gKSk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsXG4gICAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSk6IHtmYWlsdXJlczogc3RyaW5nW10sIHByb2dyYW1FcnJvcj86IGJvb2xlYW59IHtcbiAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHByb2dyYW1EYXRhID0gZ3JhY2VmdWxseUNyZWF0ZVByb2dyYW0odHJlZSwgYmFzZVBhdGgsIHRzY29uZmlnUGF0aCwgbG9nZ2VyKTtcblxuICAvLyBHcmFjZWZ1bGx5IGV4aXQgaWYgdGhlIHByb2dyYW0gY291bGQgbm90IGJlIGNyZWF0ZWQuXG4gIGlmIChwcm9ncmFtRGF0YSA9PT0gbnVsbCkge1xuICAgIHJldHVybiB7ZmFpbHVyZXM6IFtdLCBwcm9ncmFtRXJyb3I6IHRydWV9O1xuICB9XG5cbiAgY29uc3Qge3Byb2dyYW0sIGNvbXBpbGVyfSA9IHByb2dyYW1EYXRhO1xuICBjb25zdCB0eXBlQ2hlY2tlciA9IHByb2dyYW0uZ2V0VHlwZUNoZWNrZXIoKTtcbiAgY29uc3QgcGFydGlhbEV2YWx1YXRvciA9IG5ldyBQYXJ0aWFsRXZhbHVhdG9yKFxuICAgICAgbmV3IFR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdCh0eXBlQ2hlY2tlciksIHR5cGVDaGVja2VyLCAvKiBkZXBlbmRlbmN5VHJhY2tlciAqLyBudWxsKTtcbiAgY29uc3QgZGVjbGFyYXRpb25Db2xsZWN0b3IgPSBuZXcgTmdEZWNsYXJhdGlvbkNvbGxlY3Rvcih0eXBlQ2hlY2tlciwgcGFydGlhbEV2YWx1YXRvcik7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID1cbiAgICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoc291cmNlRmlsZSA9PiBjYW5NaWdyYXRlRmlsZShiYXNlUGF0aCwgc291cmNlRmlsZSwgcHJvZ3JhbSkpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBhbGwgZGlyZWN0aXZlcywgY29tcG9uZW50cyBhbmQgcHJvdmlkZXJzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gZGVjbGFyYXRpb25Db2xsZWN0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7ZGVjb3JhdGVkRGlyZWN0aXZlcywgZGVjb3JhdGVkUHJvdmlkZXJzLCB1bmRlY29yYXRlZERlY2xhcmF0aW9uc30gPSBkZWNsYXJhdGlvbkNvbGxlY3RvcjtcbiAgY29uc3QgdHJhbnNmb3JtID1cbiAgICAgIG5ldyBVbmRlY29yYXRlZENsYXNzZXNUcmFuc2Zvcm0odHlwZUNoZWNrZXIsIGNvbXBpbGVyLCBwYXJ0aWFsRXZhbHVhdG9yLCBnZXRVcGRhdGVSZWNvcmRlcik7XG4gIGNvbnN0IHVwZGF0ZVJlY29yZGVycyA9IG5ldyBNYXA8dHMuU291cmNlRmlsZSwgVXBkYXRlUmVjb3JkZXI+KCk7XG5cbiAgLy8gUnVuIHRoZSBtaWdyYXRpb25zIGZvciBkZWNvcmF0ZWQgcHJvdmlkZXJzIGFuZCBib3RoIGRlY29yYXRlZCBhbmQgdW5kZWNvcmF0ZWRcbiAgLy8gZGlyZWN0aXZlcy4gVGhlIHRyYW5zZm9ybSBmYWlsdXJlcyBhcmUgY29sbGVjdGVkIGFuZCBjb252ZXJ0ZWQgaW50byBodW1hbi1yZWFkYWJsZVxuICAvLyBmYWlsdXJlcyB3aGljaCBjYW4gYmUgcHJpbnRlZCB0byB0aGUgY29uc29sZS5cbiAgWy4uLnRyYW5zZm9ybS5taWdyYXRlRGVjb3JhdGVkRGlyZWN0aXZlcyhkZWNvcmF0ZWREaXJlY3RpdmVzKSxcbiAgIC4uLnRyYW5zZm9ybS5taWdyYXRlRGVjb3JhdGVkUHJvdmlkZXJzKGRlY29yYXRlZFByb3ZpZGVycyksXG4gICAuLi50cmFuc2Zvcm0ubWlncmF0ZVVuZGVjb3JhdGVkRGVjbGFyYXRpb25zKEFycmF5LmZyb20odW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMpKV1cbiAgICAgIC5mb3JFYWNoKCh7bm9kZSwgbWVzc2FnZX0pID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZVNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVGaWxlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBub2RlU291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgICAgIGNvbnN0IHtsaW5lLCBjaGFyYWN0ZXJ9ID1cbiAgICAgICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKG5vZGUuZ2V0U291cmNlRmlsZSgpLCBub2RlLmdldFN0YXJ0KCkpO1xuICAgICAgICBmYWlsdXJlcy5wdXNoKGAke3JlbGF0aXZlRmlsZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX06ICR7bWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuXG4gIC8vIFJlY29yZCB0aGUgY2hhbmdlcyBjb2xsZWN0ZWQgaW4gdGhlIGltcG9ydCBtYW5hZ2VyIGFuZCB0cmFuc2Zvcm1lci5cbiAgdHJhbnNmb3JtLnJlY29yZENoYW5nZXMoKTtcblxuICAvLyBXYWxrIHRocm91Z2ggZWFjaCB1cGRhdGUgcmVjb3JkZXIgYW5kIGNvbW1pdCB0aGUgdXBkYXRlLiBXZSBuZWVkIHRvIGNvbW1pdCB0aGVcbiAgLy8gdXBkYXRlcyBpbiBiYXRjaGVzIHBlciBzb3VyY2UgZmlsZSBhcyB0aGVyZSBjYW4gYmUgb25seSBvbmUgcmVjb3JkZXIgcGVyIHNvdXJjZVxuICAvLyBmaWxlIGluIG9yZGVyIHRvIGF2b2lkIHNoaWZ0ZWQgY2hhcmFjdGVyIG9mZnNldHMuXG4gIHVwZGF0ZVJlY29yZGVycy5mb3JFYWNoKHJlY29yZGVyID0+IHJlY29yZGVyLmNvbW1pdFVwZGF0ZSgpKTtcblxuICByZXR1cm4ge2ZhaWx1cmVzfTtcblxuICAvKiogR2V0cyB0aGUgdXBkYXRlIHJlY29yZGVyIGZvciB0aGUgc3BlY2lmaWVkIHNvdXJjZSBmaWxlLiAqL1xuICBmdW5jdGlvbiBnZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogVXBkYXRlUmVjb3JkZXIge1xuICAgIGlmICh1cGRhdGVSZWNvcmRlcnMuaGFzKHNvdXJjZUZpbGUpKSB7XG4gICAgICByZXR1cm4gdXBkYXRlUmVjb3JkZXJzLmdldChzb3VyY2VGaWxlKSE7XG4gICAgfVxuICAgIGNvbnN0IHRyZWVSZWNvcmRlciA9IHRyZWUuYmVnaW5VcGRhdGUocmVsYXRpdmUoYmFzZVBhdGgsIHNvdXJjZUZpbGUuZmlsZU5hbWUpKTtcbiAgICBjb25zdCByZWNvcmRlcjogVXBkYXRlUmVjb3JkZXIgPSB7XG4gICAgICBhZGRDbGFzc0NvbW1lbnQobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgdGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRMZWZ0KG5vZGUubWVtYmVycy5wb3MsIGBcXG4gIC8vICR7dGV4dH1cXG5gKTtcbiAgICAgIH0sXG4gICAgICBhZGRDbGFzc0RlY29yYXRvcihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgLy8gTmV3IGltcG9ydHMgc2hvdWxkIGJlIGluc2VydGVkIGF0IHRoZSBsZWZ0IHdoaWxlIGRlY29yYXRvcnMgc2hvdWxkIGJlIGluc2VydGVkXG4gICAgICAgIC8vIGF0IHRoZSByaWdodCBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCBpbXBvcnRzIGFyZSBpbnNlcnRlZCBiZWZvcmUgdGhlIGRlY29yYXRvclxuICAgICAgICAvLyBpZiB0aGUgc3RhcnQgcG9zaXRpb24gb2YgaW1wb3J0IGFuZCBkZWNvcmF0b3IgaXMgdGhlIHNvdXJjZSBmaWxlIHN0YXJ0LlxuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0UmlnaHQobm9kZS5nZXRTdGFydCgpLCBgJHt0ZXh0fVxcbmApO1xuICAgICAgfSxcbiAgICAgIGFkZE5ld0ltcG9ydChzdGFydDogbnVtYmVyLCBpbXBvcnRUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgLy8gTmV3IGltcG9ydHMgc2hvdWxkIGJlIGluc2VydGVkIGF0IHRoZSBsZWZ0IHdoaWxlIGRlY29yYXRvcnMgc2hvdWxkIGJlIGluc2VydGVkXG4gICAgICAgIC8vIGF0IHRoZSByaWdodCBpbiBvcmRlciB0byBlbnN1cmUgdGhhdCBpbXBvcnRzIGFyZSBpbnNlcnRlZCBiZWZvcmUgdGhlIGRlY29yYXRvclxuICAgICAgICAvLyBpZiB0aGUgc3RhcnQgcG9zaXRpb24gb2YgaW1wb3J0IGFuZCBkZWNvcmF0b3IgaXMgdGhlIHNvdXJjZSBmaWxlIHN0YXJ0LlxuICAgICAgICB0cmVlUmVjb3JkZXIuaW5zZXJ0TGVmdChzdGFydCwgaW1wb3J0VGV4dCk7XG4gICAgICB9LFxuICAgICAgdXBkYXRlRXhpc3RpbmdJbXBvcnQobmFtZWRCaW5kaW5nczogdHMuTmFtZWRJbXBvcnRzLCBuZXdOYW1lZEJpbmRpbmdzOiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLnJlbW92ZShuYW1lZEJpbmRpbmdzLmdldFN0YXJ0KCksIG5hbWVkQmluZGluZ3MuZ2V0V2lkdGgoKSk7XG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChuYW1lZEJpbmRpbmdzLmdldFN0YXJ0KCksIG5ld05hbWVkQmluZGluZ3MpO1xuICAgICAgfSxcbiAgICAgIGNvbW1pdFVwZGF0ZSgpIHtcbiAgICAgICAgdHJlZS5jb21taXRVcGRhdGUodHJlZVJlY29yZGVyKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHVwZGF0ZVJlY29yZGVycy5zZXQoc291cmNlRmlsZSwgcmVjb3JkZXIpO1xuICAgIHJldHVybiByZWNvcmRlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRFcnJvckRpYWdub3N0aWNzKGRpYWdub3N0aWNzOiBSZWFkb25seUFycmF5PHRzLkRpYWdub3N0aWN8TmdEaWFnbm9zdGljPikge1xuICByZXR1cm4gPHRzLkRpYWdub3N0aWNbXT5kaWFnbm9zdGljcy5maWx0ZXIoZCA9PiBkLmNhdGVnb3J5ID09PSB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IpO1xufVxuXG5mdW5jdGlvbiBncmFjZWZ1bGx5Q3JlYXRlUHJvZ3JhbShcbiAgICB0cmVlOiBUcmVlLCBiYXNlUGF0aDogc3RyaW5nLCB0c2NvbmZpZ1BhdGg6IHN0cmluZyxcbiAgICBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpKToge2NvbXBpbGVyOiBBb3RDb21waWxlciwgcHJvZ3JhbTogdHMuUHJvZ3JhbX18bnVsbCB7XG4gIHRyeSB7XG4gICAgY29uc3Qge25nY1Byb2dyYW0sIGhvc3QsIHByb2dyYW0sIGNvbXBpbGVyfSA9IGNyZWF0ZU5nY1Byb2dyYW0oXG4gICAgICAgIChvcHRpb25zKSA9PiBjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3QodHJlZSwgb3B0aW9ucywgYmFzZVBhdGgpLCB0c2NvbmZpZ1BhdGgpO1xuICAgIGNvbnN0IHN5bnRhY3RpY0RpYWdub3N0aWNzID0gZ2V0RXJyb3JEaWFnbm9zdGljcyhuZ2NQcm9ncmFtLmdldFRzU3ludGFjdGljRGlhZ25vc3RpY3MoKSk7XG4gICAgY29uc3Qgc3RydWN0dXJhbERpYWdub3N0aWNzID0gZ2V0RXJyb3JEaWFnbm9zdGljcyhuZ2NQcm9ncmFtLmdldE5nU3RydWN0dXJhbERpYWdub3N0aWNzKCkpO1xuICAgIGNvbnN0IGNvbmZpZ0RpYWdub3N0aWNzID0gZ2V0RXJyb3JEaWFnbm9zdGljcyhcbiAgICAgICAgWy4uLnByb2dyYW0uZ2V0T3B0aW9uc0RpYWdub3N0aWNzKCksIC4uLm5nY1Byb2dyYW0uZ2V0TmdPcHRpb25EaWFnbm9zdGljcygpXSk7XG5cbiAgICBpZiAoY29uZmlnRGlhZ25vc3RpY3MubGVuZ3RoKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICBgXFxuVHlwZVNjcmlwdCBwcm9qZWN0IFwiJHt0c2NvbmZpZ1BhdGh9XCIgaGFzIGNvbmZpZ3VyYXRpb24gZXJyb3JzLiBUaGlzIGNvdWxkIGNhdXNlIGAgK1xuICAgICAgICAgIGBhbiBpbmNvbXBsZXRlIG1pZ3JhdGlvbi4gUGxlYXNlIGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uOmApO1xuICAgICAgbG9nZ2VyLmVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKGNvbmZpZ0RpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBTeW50YWN0aWMgVHlwZVNjcmlwdCBlcnJvcnMgY2FuIHRocm93IG9mZiB0aGUgcXVlcnkgYW5hbHlzaXMgYW5kIHRoZXJlZm9yZSB3ZSB3YW50XG4gICAgLy8gdG8gbm90aWZ5IHRoZSBkZXZlbG9wZXIgdGhhdCB3ZSBjb3VsZG4ndCBhbmFseXplIHBhcnRzIG9mIHRoZSBwcm9qZWN0LiBEZXZlbG9wZXJzXG4gICAgLy8gY2FuIGp1c3QgcmUtcnVuIHRoZSBtaWdyYXRpb24gYWZ0ZXIgZml4aW5nIHRoZXNlIGZhaWx1cmVzLlxuICAgIGlmIChzeW50YWN0aWNEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIGxvZ2dlci53YXJuKFxuICAgICAgICAgIGBcXG5UeXBlU2NyaXB0IHByb2plY3QgXCIke3RzY29uZmlnUGF0aH1cIiBoYXMgc3ludGFjdGljYWwgZXJyb3JzIHdoaWNoIGNvdWxkIGNhdXNlIGAgK1xuICAgICAgICAgIGBhbiBpbmNvbXBsZXRlIG1pZ3JhdGlvbi4gUGxlYXNlIGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uOmApO1xuICAgICAgbG9nZ2VyLmVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKHN5bnRhY3RpY0RpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoc3RydWN0dXJhbERpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKDx0cy5EaWFnbm9zdGljW10+c3RydWN0dXJhbERpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtwcm9ncmFtLCBjb21waWxlcn07XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2dnZXIud2FybihgXFxuJHtNSUdSQVRJT05fQU9UX0ZBSUxVUkV9IFRoZSBmb2xsb3dpbmcgcHJvamVjdCBmYWlsZWQ6ICR7dHNjb25maWdQYXRofVxcbmApO1xuICAgIGxvZ2dlci5lcnJvcihgJHtlLnRvU3RyaW5nKCl9XFxuYCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==