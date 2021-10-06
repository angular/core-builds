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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di", ["require", "exports", "@angular-devkit/schematics", "path", "typescript", "@angular/core/schematics/utils/load_esm", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/utils/typescript/compiler_host", "@angular/core/schematics/migrations/undecorated-classes-with-di/create_ngc_program", "@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector", "@angular/core/schematics/migrations/undecorated-classes-with-di/transform"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schematics_1 = require("@angular-devkit/schematics");
    const path_1 = require("path");
    const typescript_1 = __importDefault(require("typescript"));
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
            let compilerCliModule;
            try {
                // Load ESM `@angular/compiler-cli` using the TypeScript dynamic import workaround.
                // Once TypeScript provides support for keeping the dynamic import this workaround can be
                // changed to a direct dynamic import.
                compilerCliModule =
                    yield (0, load_esm_1.loadEsmModule)('@angular/compiler-cli');
            }
            catch (e) {
                throw new schematics_1.SchematicsException(`Unable to load the '@angular/compiler-cli' package. Details: ${e.message}`);
            }
            let coreModule;
            try {
                // Load ESM `@angular/compiler-cli` using the TypeScript dynamic import workaround.
                // Once TypeScript provides support for keeping the dynamic import this workaround can be
                // changed to a direct dynamic import.
                coreModule = yield (0, load_esm_1.loadEsmModule)('@angular/core');
            }
            catch (e) {
                throw new schematics_1.SchematicsException(`Unable to load the '@angular/core' package. Details: ${e.message}`);
            }
            let compilerCliMigrationsModule;
            try {
                // Load ESM `@angular/compiler/private/migrations` using the TypeScript dynamic import
                // workaround. Once TypeScript provides support for keeping the dynamic import this workaround
                // can be changed to a direct dynamic import.
                compilerCliMigrationsModule = yield (0, load_esm_1.loadCompilerCliMigrationsModule)();
            }
            catch (e) {
                throw new schematics_1.SchematicsException(`Unable to load the '@angular/compiler-cli' package. Details: ${e.message}`);
            }
            for (const tsconfigPath of buildPaths) {
                const result = runUndecoratedClassesMigration(tree, tsconfigPath, basePath, ctx.logger, compilerModule, compilerCliModule, compilerCliMigrationsModule, coreModule);
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
    function runUndecoratedClassesMigration(tree, tsconfigPath, basePath, logger, compilerModule, compilerCliModule, compilerCliMigrationsModule, coreModule) {
        const failures = [];
        const programData = gracefullyCreateProgram(tree, basePath, tsconfigPath, logger, compilerCliModule);
        // Gracefully exit if the program could not be created.
        if (programData === null) {
            return { failures: [], programError: true };
        }
        const { program, compiler } = programData;
        const typeChecker = program.getTypeChecker();
        const declarationCollector = new ng_declaration_collector_1.NgDeclarationCollector(typeChecker, compilerCliMigrationsModule);
        const sourceFiles = program.getSourceFiles().filter(sourceFile => (0, compiler_host_1.canMigrateFile)(basePath, sourceFile, program));
        // Analyze source files by detecting all directives, components and providers.
        sourceFiles.forEach(sourceFile => declarationCollector.visitNode(sourceFile));
        const { decoratedDirectives, decoratedProviders, undecoratedDeclarations } = declarationCollector;
        const transform = new transform_1.UndecoratedClassesTransform(typeChecker, compiler, getUpdateRecorder, compilerModule, coreModule);
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
            const { line, character } = typescript_1.default.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
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
        return diagnostics.filter(d => d.category === typescript_1.default.DiagnosticCategory.Error);
    }
    function gracefullyCreateProgram(tree, basePath, tsconfigPath, logger, compilerCliModule) {
        try {
            const { ngcProgram, host, program, compiler } = (0, create_ngc_program_1.createNgcProgram)(compilerCliModule, (options) => (0, compiler_host_1.createMigrationCompilerHost)(tree, options, basePath), tsconfigPath);
            const syntacticDiagnostics = getErrorDiagnostics(ngcProgram.getTsSyntacticDiagnostics());
            const structuralDiagnostics = getErrorDiagnostics(ngcProgram.getNgStructuralDiagnostics());
            const configDiagnostics = getErrorDiagnostics([...program.getOptionsDiagnostics(), ...ngcProgram.getNgOptionDiagnostics()]);
            if (configDiagnostics.length) {
                logger.warn(`\nTypeScript project "${tsconfigPath}" has configuration errors. This could cause ` +
                    `an incomplete migration. Please fix the following failures and rerun the migration:`);
                logger.error(typescript_1.default.formatDiagnostics(configDiagnostics, host));
                return null;
            }
            // Syntactic TypeScript errors can throw off the query analysis and therefore we want
            // to notify the developer that we couldn't analyze parts of the project. Developers
            // can just re-run the migration after fixing these failures.
            if (syntacticDiagnostics.length) {
                logger.warn(`\nTypeScript project "${tsconfigPath}" has syntactical errors which could cause ` +
                    `an incomplete migration. Please fix the following failures and rerun the migration:`);
                logger.error(typescript_1.default.formatDiagnostics(syntacticDiagnostics, host));
                return null;
            }
            if (structuralDiagnostics.length) {
                throw new Error(typescript_1.default.formatDiagnostics(structuralDiagnostics, host));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHSCwyREFBNkY7SUFHN0YsK0JBQThCO0lBQzlCLDREQUE0QjtJQUU1QixzRUFBb0Y7SUFDcEYsa0dBQTJFO0lBQzNFLDJGQUFpRztJQUVqRywySEFBc0Q7SUFDdEQsdUlBQWtFO0lBQ2xFLHlHQUF3RDtJQUd4RCxNQUFNLHVCQUF1QixHQUFHLHdEQUF3RDtRQUNwRiwwREFBMEQsQ0FBQztJQUUvRCxNQUFNLHFCQUFxQixHQUFHLDBEQUEwRDtRQUNwRixtRkFBbUY7UUFDbkYsMkZBQTJGLENBQUM7SUFFaEcsc0VBQXNFO0lBQ3RFO1FBQ0UsT0FBTyxDQUFPLElBQVUsRUFBRSxHQUFxQixFQUFFLEVBQUU7WUFDakQsTUFBTSxFQUFDLFVBQVUsRUFBQyxHQUFHLE1BQU0sSUFBQSxnREFBdUIsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUN6RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBQzlCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztZQUV6QixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtnQkFDdEIsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixtRkFBbUY7b0JBQ25GLHdDQUF3QyxDQUFDLENBQUM7YUFDL0M7WUFFRCxJQUFJLGNBQWMsQ0FBQztZQUNuQixJQUFJO2dCQUNGLCtFQUErRTtnQkFDL0UseUZBQXlGO2dCQUN6RixzQ0FBc0M7Z0JBQ3RDLGNBQWMsR0FBRyxNQUFNLElBQUEsd0JBQWEsRUFBcUMsbUJBQW1C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QUMsSUFBSSxDQUNQLHlCQUF5QixZQUFZLCtDQUErQztvQkFDcEYscUZBQXFGLENBQUMsQ0FBQztnQkFDM0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxvQkFBRSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxxRkFBcUY7WUFDckYsb0ZBQW9GO1lBQ3BGLDZEQUE2RDtZQUM3RCxJQUFJLG9CQUFvQixDQUFDLE1BQU0sRUFBRTtnQkFDL0IsTUFBTSxDQUFDLElBQUksQ0FDUCx5QkFBeUIsWUFBWSw2Q0FBNkM7b0JBQ2xGLHFGQUFxRixDQUFDLENBQUM7Z0JBQzNGLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMvRCxPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQsSUFBSSxxQkFBcUIsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQUUsQ0FBQyxpQkFBaUIsQ0FBa0IscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNyRjtZQUVELE9BQU8sRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7U0FDNUI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxxQkFBcUIsa0NBQWtDLFlBQVksSUFBSSxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEMsT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb2dnaW5nfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQge1J1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNjaGVtYXRpY3NFeGNlcHRpb24sIFRyZWV9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9zY2hlbWF0aWNzJztcbmltcG9ydCB0eXBlIHtBb3RDb21waWxlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHR5cGUge0RpYWdub3N0aWMgYXMgTmdEaWFnbm9zdGljfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGknO1xuaW1wb3J0IHtyZWxhdGl2ZX0gZnJvbSAncGF0aCc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7bG9hZENvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZSwgbG9hZEVzbU1vZHVsZX0gZnJvbSAnLi4vLi4vdXRpbHMvbG9hZF9lc20nO1xuaW1wb3J0IHtnZXRQcm9qZWN0VHNDb25maWdQYXRoc30gZnJvbSAnLi4vLi4vdXRpbHMvcHJvamVjdF90c2NvbmZpZ19wYXRocyc7XG5pbXBvcnQge2Nhbk1pZ3JhdGVGaWxlLCBjcmVhdGVNaWdyYXRpb25Db21waWxlckhvc3R9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY29tcGlsZXJfaG9zdCc7XG5cbmltcG9ydCB7Y3JlYXRlTmdjUHJvZ3JhbX0gZnJvbSAnLi9jcmVhdGVfbmdjX3Byb2dyYW0nO1xuaW1wb3J0IHtOZ0RlY2xhcmF0aW9uQ29sbGVjdG9yfSBmcm9tICcuL25nX2RlY2xhcmF0aW9uX2NvbGxlY3Rvcic7XG5pbXBvcnQge1VuZGVjb3JhdGVkQ2xhc3Nlc1RyYW5zZm9ybX0gZnJvbSAnLi90cmFuc2Zvcm0nO1xuaW1wb3J0IHtVcGRhdGVSZWNvcmRlcn0gZnJvbSAnLi91cGRhdGVfcmVjb3JkZXInO1xuXG5jb25zdCBNSUdSQVRJT05fUkVSVU5fTUVTU0FHRSA9ICdNaWdyYXRpb24gY2FuIGJlIHJlcnVuIHdpdGg6IFwibmcgdXBkYXRlIEBhbmd1bGFyL2NvcmUgJyArXG4gICAgJy0tbWlncmF0ZS1vbmx5IG1pZ3JhdGlvbi12OS11bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGlcIic7XG5cbmNvbnN0IE1JR1JBVElPTl9BT1RfRkFJTFVSRSA9ICdUaGlzIG1pZ3JhdGlvbiB1c2VzIHRoZSBBbmd1bGFyIGNvbXBpbGVyIGludGVybmFsbHkgYW5kICcgK1xuICAgICd0aGVyZWZvcmUgcHJvamVjdHMgdGhhdCBubyBsb25nZXIgYnVpbGQgc3VjY2Vzc2Z1bGx5IGFmdGVyIHRoZSB1cGRhdGUgY2Fubm90IHJ1biAnICtcbiAgICAndGhlIG1pZ3JhdGlvbi4gUGxlYXNlIGVuc3VyZSB0aGVyZSBhcmUgbm8gQU9UIGNvbXBpbGF0aW9uIGVycm9ycyBhbmQgcmVydW4gdGhlIG1pZ3JhdGlvbi4nO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOSBcInVuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaVwiIG1pZ3JhdGlvbi4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gYXN5bmMgKHRyZWU6IFRyZWUsIGN0eDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzfSA9IGF3YWl0IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgcHJvZ3JhbUVycm9yID0gZmFsc2U7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBtaWdyYXRlIHVuZGVjb3JhdGVkIGRlcml2ZWQgY2xhc3NlcyBhbmQgJyArXG4gICAgICAgICAgJ3VuZGVjb3JhdGVkIGJhc2UgY2xhc3NlcyB3aGljaCB1c2UgREkuJyk7XG4gICAgfVxuXG4gICAgbGV0IGNvbXBpbGVyTW9kdWxlO1xuICAgIHRyeSB7XG4gICAgICAvLyBMb2FkIEVTTSBgQGFuZ3VsYXIvY29tcGlsZXJgIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0IHdvcmthcm91bmQuXG4gICAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAgICAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICAgIGNvbXBpbGVyTW9kdWxlID0gYXdhaXQgbG9hZEVzbU1vZHVsZTx0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpPignQGFuZ3VsYXIvY29tcGlsZXInKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICBgVW5hYmxlIHRvIGxvYWQgdGhlICdAYW5ndWxhci9jb21waWxlcicgcGFja2FnZS4gRGV0YWlsczogJHtlLm1lc3NhZ2V9YCk7XG4gICAgfVxuXG4gICAgbGV0IGNvbXBpbGVyQ2xpTW9kdWxlO1xuICAgIHRyeSB7XG4gICAgICAvLyBMb2FkIEVTTSBgQGFuZ3VsYXIvY29tcGlsZXItY2xpYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAgICAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW4gYmVcbiAgICAgIC8vIGNoYW5nZWQgdG8gYSBkaXJlY3QgZHluYW1pYyBpbXBvcnQuXG4gICAgICBjb21waWxlckNsaU1vZHVsZSA9XG4gICAgICAgICAgYXdhaXQgbG9hZEVzbU1vZHVsZTx0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGknKT4oJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaScpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IG5ldyBTY2hlbWF0aWNzRXhjZXB0aW9uKFxuICAgICAgICAgIGBVbmFibGUgdG8gbG9hZCB0aGUgJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaScgcGFja2FnZS4gRGV0YWlsczogJHtlLm1lc3NhZ2V9YCk7XG4gICAgfVxuXG4gICAgbGV0IGNvcmVNb2R1bGU7XG4gICAgdHJ5IHtcbiAgICAgIC8vIExvYWQgRVNNIGBAYW5ndWxhci9jb21waWxlci1jbGlgIHVzaW5nIHRoZSBUeXBlU2NyaXB0IGR5bmFtaWMgaW1wb3J0IHdvcmthcm91bmQuXG4gICAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAgICAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICAgIGNvcmVNb2R1bGUgPSBhd2FpdCBsb2FkRXNtTW9kdWxlPHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvcmUnKT4oJ0Bhbmd1bGFyL2NvcmUnKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICBgVW5hYmxlIHRvIGxvYWQgdGhlICdAYW5ndWxhci9jb3JlJyBwYWNrYWdlLiBEZXRhaWxzOiAke2UubWVzc2FnZX1gKTtcbiAgICB9XG5cbiAgICBsZXQgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlO1xuICAgIHRyeSB7XG4gICAgICAvLyBMb2FkIEVTTSBgQGFuZ3VsYXIvY29tcGlsZXIvcHJpdmF0ZS9taWdyYXRpb25zYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydFxuICAgICAgLy8gd29ya2Fyb3VuZC4gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZFxuICAgICAgLy8gY2FuIGJlIGNoYW5nZWQgdG8gYSBkaXJlY3QgZHluYW1pYyBpbXBvcnQuXG4gICAgICBjb21waWxlckNsaU1pZ3JhdGlvbnNNb2R1bGUgPSBhd2FpdCBsb2FkQ29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IFNjaGVtYXRpY3NFeGNlcHRpb24oXG4gICAgICAgICAgYFVuYWJsZSB0byBsb2FkIHRoZSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJyBwYWNrYWdlLiBEZXRhaWxzOiAke2UubWVzc2FnZX1gKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHRzY29uZmlnUGF0aCBvZiBidWlsZFBhdGhzKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24oXG4gICAgICAgICAgdHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgY3R4LmxvZ2dlciwgY29tcGlsZXJNb2R1bGUsIGNvbXBpbGVyQ2xpTW9kdWxlLFxuICAgICAgICAgIGNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZSwgY29yZU1vZHVsZSk7XG4gICAgICBmYWlsdXJlcy5wdXNoKC4uLnJlc3VsdC5mYWlsdXJlcyk7XG4gICAgICBwcm9ncmFtRXJyb3IgPSBwcm9ncmFtRXJyb3IgfHwgISFyZXN1bHQucHJvZ3JhbUVycm9yO1xuICAgIH1cblxuICAgIGlmIChwcm9ncmFtRXJyb3IpIHtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnQ291bGQgbm90IG1pZ3JhdGUgYWxsIHVuZGVjb3JhdGVkIGNsYXNzZXMgdGhhdCB1c2UgZGVwZW5kZW5jeScpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdpbmplY3Rpb24uIFNvbWUgcHJvamVjdCB0YXJnZXRzIGNvdWxkIG5vdCBiZSBhbmFseXplZCBkdWUgdG8nKTtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnVHlwZVNjcmlwdCBwcm9ncmFtIGZhaWx1cmVzLlxcbicpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKGAke01JR1JBVElPTl9SRVJVTl9NRVNTQUdFfVxcbmApO1xuXG4gICAgICBpZiAoZmFpbHVyZXMubGVuZ3RoKSB7XG4gICAgICAgIGN0eC5sb2dnZXIuaW5mbygnUGxlYXNlIG1hbnVhbGx5IGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZS1ydW4gdGhlJyk7XG4gICAgICAgIGN0eC5sb2dnZXIuaW5mbygnbWlncmF0aW9uIG9uY2UgdGhlIFR5cGVTY3JpcHQgcHJvZ3JhbSBmYWlsdXJlcyBhcmUgcmVzb2x2ZWQuJyk7XG4gICAgICAgIGZhaWx1cmVzLmZvckVhY2gobWVzc2FnZSA9PiBjdHgubG9nZ2VyLndhcm4oYOKukSAgICR7bWVzc2FnZX1gKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnQ291bGQgbm90IG1pZ3JhdGUgYWxsIHVuZGVjb3JhdGVkIGNsYXNzZXMgdGhhdCB1c2UgZGVwZW5kZW5jeScpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdpbmplY3Rpb24uIFBsZWFzZSBtYW51YWxseSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlczonKTtcbiAgICAgIGZhaWx1cmVzLmZvckVhY2gobWVzc2FnZSA9PiBjdHgubG9nZ2VyLndhcm4oYOKukSAgICR7bWVzc2FnZX1gKSk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4gICAgY29tcGlsZXJNb2R1bGU6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJyksXG4gICAgY29tcGlsZXJDbGlNb2R1bGU6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaScpLFxuICAgIGNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3ByaXZhdGUvbWlncmF0aW9ucycpLFxuICAgIGNvcmVNb2R1bGU6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvcmUnKSk6IHtmYWlsdXJlczogc3RyaW5nW10sIHByb2dyYW1FcnJvcj86IGJvb2xlYW59IHtcbiAgY29uc3QgZmFpbHVyZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHByb2dyYW1EYXRhID1cbiAgICAgIGdyYWNlZnVsbHlDcmVhdGVQcm9ncmFtKHRyZWUsIGJhc2VQYXRoLCB0c2NvbmZpZ1BhdGgsIGxvZ2dlciwgY29tcGlsZXJDbGlNb2R1bGUpO1xuXG4gIC8vIEdyYWNlZnVsbHkgZXhpdCBpZiB0aGUgcHJvZ3JhbSBjb3VsZCBub3QgYmUgY3JlYXRlZC5cbiAgaWYgKHByb2dyYW1EYXRhID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHtmYWlsdXJlczogW10sIHByb2dyYW1FcnJvcjogdHJ1ZX07XG4gIH1cblxuICBjb25zdCB7cHJvZ3JhbSwgY29tcGlsZXJ9ID0gcHJvZ3JhbURhdGE7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuXG4gIGNvbnN0IGRlY2xhcmF0aW9uQ29sbGVjdG9yID0gbmV3IE5nRGVjbGFyYXRpb25Db2xsZWN0b3IodHlwZUNoZWNrZXIsIGNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZSk7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID1cbiAgICAgIHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoc291cmNlRmlsZSA9PiBjYW5NaWdyYXRlRmlsZShiYXNlUGF0aCwgc291cmNlRmlsZSwgcHJvZ3JhbSkpO1xuXG4gIC8vIEFuYWx5emUgc291cmNlIGZpbGVzIGJ5IGRldGVjdGluZyBhbGwgZGlyZWN0aXZlcywgY29tcG9uZW50cyBhbmQgcHJvdmlkZXJzLlxuICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gZGVjbGFyYXRpb25Db2xsZWN0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7ZGVjb3JhdGVkRGlyZWN0aXZlcywgZGVjb3JhdGVkUHJvdmlkZXJzLCB1bmRlY29yYXRlZERlY2xhcmF0aW9uc30gPSBkZWNsYXJhdGlvbkNvbGxlY3RvcjtcbiAgY29uc3QgdHJhbnNmb3JtID0gbmV3IFVuZGVjb3JhdGVkQ2xhc3Nlc1RyYW5zZm9ybShcbiAgICAgIHR5cGVDaGVja2VyLCBjb21waWxlciwgZ2V0VXBkYXRlUmVjb3JkZXIsIGNvbXBpbGVyTW9kdWxlLCBjb3JlTW9kdWxlKTtcbiAgY29uc3QgdXBkYXRlUmVjb3JkZXJzID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBVcGRhdGVSZWNvcmRlcj4oKTtcblxuICAvLyBSdW4gdGhlIG1pZ3JhdGlvbnMgZm9yIGRlY29yYXRlZCBwcm92aWRlcnMgYW5kIGJvdGggZGVjb3JhdGVkIGFuZCB1bmRlY29yYXRlZFxuICAvLyBkaXJlY3RpdmVzLiBUaGUgdHJhbnNmb3JtIGZhaWx1cmVzIGFyZSBjb2xsZWN0ZWQgYW5kIGNvbnZlcnRlZCBpbnRvIGh1bWFuLXJlYWRhYmxlXG4gIC8vIGZhaWx1cmVzIHdoaWNoIGNhbiBiZSBwcmludGVkIHRvIHRoZSBjb25zb2xlLlxuICBbLi4udHJhbnNmb3JtLm1pZ3JhdGVEZWNvcmF0ZWREaXJlY3RpdmVzKGRlY29yYXRlZERpcmVjdGl2ZXMpLFxuICAgLi4udHJhbnNmb3JtLm1pZ3JhdGVEZWNvcmF0ZWRQcm92aWRlcnMoZGVjb3JhdGVkUHJvdmlkZXJzKSxcbiAgIC4uLnRyYW5zZm9ybS5taWdyYXRlVW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMoQXJyYXkuZnJvbSh1bmRlY29yYXRlZERlY2xhcmF0aW9ucykpXVxuICAgICAgLmZvckVhY2goKHtub2RlLCBtZXNzYWdlfSkgPT4ge1xuICAgICAgICBjb25zdCBub2RlU291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgICAgICBjb25zdCByZWxhdGl2ZUZpbGVQYXRoID0gcmVsYXRpdmUoYmFzZVBhdGgsIG5vZGVTb3VyY2VGaWxlLmZpbGVOYW1lKTtcbiAgICAgICAgY29uc3Qge2xpbmUsIGNoYXJhY3Rlcn0gPVxuICAgICAgICAgICAgdHMuZ2V0TGluZUFuZENoYXJhY3Rlck9mUG9zaXRpb24obm9kZS5nZXRTb3VyY2VGaWxlKCksIG5vZGUuZ2V0U3RhcnQoKSk7XG4gICAgICAgIGZhaWx1cmVzLnB1c2goYCR7cmVsYXRpdmVGaWxlUGF0aH1AJHtsaW5lICsgMX06JHtjaGFyYWN0ZXIgKyAxfTogJHttZXNzYWdlfWApO1xuICAgICAgfSk7XG5cbiAgLy8gUmVjb3JkIHRoZSBjaGFuZ2VzIGNvbGxlY3RlZCBpbiB0aGUgaW1wb3J0IG1hbmFnZXIgYW5kIHRyYW5zZm9ybWVyLlxuICB0cmFuc2Zvcm0ucmVjb3JkQ2hhbmdlcygpO1xuXG4gIC8vIFdhbGsgdGhyb3VnaCBlYWNoIHVwZGF0ZSByZWNvcmRlciBhbmQgY29tbWl0IHRoZSB1cGRhdGUuIFdlIG5lZWQgdG8gY29tbWl0IHRoZVxuICAvLyB1cGRhdGVzIGluIGJhdGNoZXMgcGVyIHNvdXJjZSBmaWxlIGFzIHRoZXJlIGNhbiBiZSBvbmx5IG9uZSByZWNvcmRlciBwZXIgc291cmNlXG4gIC8vIGZpbGUgaW4gb3JkZXIgdG8gYXZvaWQgc2hpZnRlZCBjaGFyYWN0ZXIgb2Zmc2V0cy5cbiAgdXBkYXRlUmVjb3JkZXJzLmZvckVhY2gocmVjb3JkZXIgPT4gcmVjb3JkZXIuY29tbWl0VXBkYXRlKCkpO1xuXG4gIHJldHVybiB7ZmFpbHVyZXN9O1xuXG4gIC8qKiBHZXRzIHRoZSB1cGRhdGUgcmVjb3JkZXIgZm9yIHRoZSBzcGVjaWZpZWQgc291cmNlIGZpbGUuICovXG4gIGZ1bmN0aW9uIGdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBVcGRhdGVSZWNvcmRlciB7XG4gICAgaWYgKHVwZGF0ZVJlY29yZGVycy5oYXMoc291cmNlRmlsZSkpIHtcbiAgICAgIHJldHVybiB1cGRhdGVSZWNvcmRlcnMuZ2V0KHNvdXJjZUZpbGUpITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgIGNvbnN0IHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlciA9IHtcbiAgICAgIGFkZENsYXNzQ29tbWVudChub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydExlZnQobm9kZS5tZW1iZXJzLnBvcywgYFxcbiAgLy8gJHt0ZXh0fVxcbmApO1xuICAgICAgfSxcbiAgICAgIGFkZENsYXNzRGVjb3JhdG9yKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHRleHQ6IHN0cmluZykge1xuICAgICAgICAvLyBOZXcgaW1wb3J0cyBzaG91bGQgYmUgaW5zZXJ0ZWQgYXQgdGhlIGxlZnQgd2hpbGUgZGVjb3JhdG9ycyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAgICAgICAgLy8gYXQgdGhlIHJpZ2h0IGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IGltcG9ydHMgYXJlIGluc2VydGVkIGJlZm9yZSB0aGUgZGVjb3JhdG9yXG4gICAgICAgIC8vIGlmIHRoZSBzdGFydCBwb3NpdGlvbiBvZiBpbXBvcnQgYW5kIGRlY29yYXRvciBpcyB0aGUgc291cmNlIGZpbGUgc3RhcnQuXG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIGAke3RleHR9XFxuYCk7XG4gICAgICB9LFxuICAgICAgYWRkTmV3SW1wb3J0KHN0YXJ0OiBudW1iZXIsIGltcG9ydFRleHQ6IHN0cmluZykge1xuICAgICAgICAvLyBOZXcgaW1wb3J0cyBzaG91bGQgYmUgaW5zZXJ0ZWQgYXQgdGhlIGxlZnQgd2hpbGUgZGVjb3JhdG9ycyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAgICAgICAgLy8gYXQgdGhlIHJpZ2h0IGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IGltcG9ydHMgYXJlIGluc2VydGVkIGJlZm9yZSB0aGUgZGVjb3JhdG9yXG4gICAgICAgIC8vIGlmIHRoZSBzdGFydCBwb3NpdGlvbiBvZiBpbXBvcnQgYW5kIGRlY29yYXRvciBpcyB0aGUgc291cmNlIGZpbGUgc3RhcnQuXG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRMZWZ0KHN0YXJ0LCBpbXBvcnRUZXh0KTtcbiAgICAgIH0sXG4gICAgICB1cGRhdGVFeGlzdGluZ0ltcG9ydChuYW1lZEJpbmRpbmdzOiB0cy5OYW1lZEltcG9ydHMsIG5ld05hbWVkQmluZGluZ3M6IHN0cmluZykge1xuICAgICAgICB0cmVlUmVjb3JkZXIucmVtb3ZlKG5hbWVkQmluZGluZ3MuZ2V0U3RhcnQoKSwgbmFtZWRCaW5kaW5ncy5nZXRXaWR0aCgpKTtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KG5hbWVkQmluZGluZ3MuZ2V0U3RhcnQoKSwgbmV3TmFtZWRCaW5kaW5ncyk7XG4gICAgICB9LFxuICAgICAgY29tbWl0VXBkYXRlKCkge1xuICAgICAgICB0cmVlLmNvbW1pdFVwZGF0ZSh0cmVlUmVjb3JkZXIpO1xuICAgICAgfVxuICAgIH07XG4gICAgdXBkYXRlUmVjb3JkZXJzLnNldChzb3VyY2VGaWxlLCByZWNvcmRlcik7XG4gICAgcmV0dXJuIHJlY29yZGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEVycm9yRGlhZ25vc3RpY3MoZGlhZ25vc3RpY3M6IFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpY3xOZ0RpYWdub3N0aWM+KSB7XG4gIHJldHVybiA8dHMuRGlhZ25vc3RpY1tdPmRpYWdub3N0aWNzLmZpbHRlcihkID0+IGQuY2F0ZWdvcnkgPT09IHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcik7XG59XG5cbmZ1bmN0aW9uIGdyYWNlZnVsbHlDcmVhdGVQcm9ncmFtKFxuICAgIHRyZWU6IFRyZWUsIGJhc2VQYXRoOiBzdHJpbmcsIHRzY29uZmlnUGF0aDogc3RyaW5nLCBsb2dnZXI6IGxvZ2dpbmcuTG9nZ2VyQXBpLFxuICAgIGNvbXBpbGVyQ2xpTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGknKSk6XG4gICAge2NvbXBpbGVyOiBBb3RDb21waWxlciwgcHJvZ3JhbTogdHMuUHJvZ3JhbX18bnVsbCB7XG4gIHRyeSB7XG4gICAgY29uc3Qge25nY1Byb2dyYW0sIGhvc3QsIHByb2dyYW0sIGNvbXBpbGVyfSA9IGNyZWF0ZU5nY1Byb2dyYW0oXG4gICAgICAgIGNvbXBpbGVyQ2xpTW9kdWxlLCAob3B0aW9ucykgPT4gY3JlYXRlTWlncmF0aW9uQ29tcGlsZXJIb3N0KHRyZWUsIG9wdGlvbnMsIGJhc2VQYXRoKSxcbiAgICAgICAgdHNjb25maWdQYXRoKTtcbiAgICBjb25zdCBzeW50YWN0aWNEaWFnbm9zdGljcyA9IGdldEVycm9yRGlhZ25vc3RpY3MobmdjUHJvZ3JhbS5nZXRUc1N5bnRhY3RpY0RpYWdub3N0aWNzKCkpO1xuICAgIGNvbnN0IHN0cnVjdHVyYWxEaWFnbm9zdGljcyA9IGdldEVycm9yRGlhZ25vc3RpY3MobmdjUHJvZ3JhbS5nZXROZ1N0cnVjdHVyYWxEaWFnbm9zdGljcygpKTtcbiAgICBjb25zdCBjb25maWdEaWFnbm9zdGljcyA9IGdldEVycm9yRGlhZ25vc3RpY3MoXG4gICAgICAgIFsuLi5wcm9ncmFtLmdldE9wdGlvbnNEaWFnbm9zdGljcygpLCAuLi5uZ2NQcm9ncmFtLmdldE5nT3B0aW9uRGlhZ25vc3RpY3MoKV0pO1xuXG4gICAgaWYgKGNvbmZpZ0RpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgICAgbG9nZ2VyLndhcm4oXG4gICAgICAgICAgYFxcblR5cGVTY3JpcHQgcHJvamVjdCBcIiR7dHNjb25maWdQYXRofVwiIGhhcyBjb25maWd1cmF0aW9uIGVycm9ycy4gVGhpcyBjb3VsZCBjYXVzZSBgICtcbiAgICAgICAgICBgYW4gaW5jb21wbGV0ZSBtaWdyYXRpb24uIFBsZWFzZSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlcyBhbmQgcmVydW4gdGhlIG1pZ3JhdGlvbjpgKTtcbiAgICAgIGxvZ2dlci5lcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhjb25maWdEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gU3ludGFjdGljIFR5cGVTY3JpcHQgZXJyb3JzIGNhbiB0aHJvdyBvZmYgdGhlIHF1ZXJ5IGFuYWx5c2lzIGFuZCB0aGVyZWZvcmUgd2Ugd2FudFxuICAgIC8vIHRvIG5vdGlmeSB0aGUgZGV2ZWxvcGVyIHRoYXQgd2UgY291bGRuJ3QgYW5hbHl6ZSBwYXJ0cyBvZiB0aGUgcHJvamVjdC4gRGV2ZWxvcGVyc1xuICAgIC8vIGNhbiBqdXN0IHJlLXJ1biB0aGUgbWlncmF0aW9uIGFmdGVyIGZpeGluZyB0aGVzZSBmYWlsdXJlcy5cbiAgICBpZiAoc3ludGFjdGljRGlhZ25vc3RpY3MubGVuZ3RoKSB7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgICBgXFxuVHlwZVNjcmlwdCBwcm9qZWN0IFwiJHt0c2NvbmZpZ1BhdGh9XCIgaGFzIHN5bnRhY3RpY2FsIGVycm9ycyB3aGljaCBjb3VsZCBjYXVzZSBgICtcbiAgICAgICAgICBgYW4gaW5jb21wbGV0ZSBtaWdyYXRpb24uIFBsZWFzZSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlcyBhbmQgcmVydW4gdGhlIG1pZ3JhdGlvbjpgKTtcbiAgICAgIGxvZ2dlci5lcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhzeW50YWN0aWNEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHN0cnVjdHVyYWxEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyg8dHMuRGlhZ25vc3RpY1tdPnN0cnVjdHVyYWxEaWFnbm9zdGljcywgaG9zdCkpO1xuICAgIH1cblxuICAgIHJldHVybiB7cHJvZ3JhbSwgY29tcGlsZXJ9O1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2VyLndhcm4oYFxcbiR7TUlHUkFUSU9OX0FPVF9GQUlMVVJFfSBUaGUgZm9sbG93aW5nIHByb2plY3QgZmFpbGVkOiAke3RzY29uZmlnUGF0aH1cXG5gKTtcbiAgICBsb2dnZXIuZXJyb3IoYCR7ZS50b1N0cmluZygpfVxcbmApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXX0=