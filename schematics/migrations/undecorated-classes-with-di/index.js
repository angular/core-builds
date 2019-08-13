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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di", ["require", "exports", "@angular-devkit/schematics", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "path", "typescript", "@angular/core/schematics/utils/project_tsconfig_paths", "@angular/core/schematics/migrations/undecorated-classes-with-di/create_ngc_program", "@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector", "@angular/core/schematics/migrations/undecorated-classes-with-di/transform"], factory);
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
            ctx.logger.info('------ Undecorated classes with DI migration ------');
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
            else {
                ctx.logger.info('Successfully migrated all found undecorated classes');
                ctx.logger.info('that use dependency injection.');
            }
            ctx.logger.info('----------------------------------------------');
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
            const { ngcProgram, host, program, compiler } = create_ngc_program_1.createNgcProgram((options) => {
                const host = ts.createCompilerHost(options, true);
                // We need to overwrite the host "readFile" method, as we want the TypeScript
                // program to be based on the file contents in the virtual file tree.
                host.readFile = fileName => {
                    const buffer = tree.read(path_1.relative(basePath, fileName));
                    // Strip BOM as otherwise TSC methods (Ex: getWidth) will return an offset which
                    // which breaks the CLI UpdateRecorder.
                    // See: https://github.com/angular/angular/pull/30719
                    return buffer ? buffer.toString().replace(/^\uFEFF/, '') : undefined;
                };
                return host;
            }, tsconfigPath);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCwyREFBNkY7SUFFN0YseUZBQW1GO0lBQ25GLDJFQUFvRjtJQUNwRiwrQkFBOEI7SUFDOUIsaUNBQWlDO0lBRWpDLGtHQUEyRTtJQUUzRSwySEFBc0Q7SUFDdEQsdUlBQWtFO0lBQ2xFLHlHQUF3RDtJQUd4RCxNQUFNLHVCQUF1QixHQUFHLHdEQUF3RDtRQUNwRix5Q0FBeUMsQ0FBQztJQUU5QyxNQUFNLHFCQUFxQixHQUFHLDBEQUEwRDtRQUNwRixtRkFBbUY7UUFDbkYsMkZBQTJGLENBQUM7SUFFaEcsc0VBQXNFO0lBQ3RFO1FBQ0UsT0FBTyxDQUFDLElBQVUsRUFBRSxHQUFxQixFQUFFLEVBQUU7WUFDM0MsTUFBTSxFQUFDLFVBQVUsRUFBQyxHQUFHLGdEQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7WUFFOUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMscURBQXFELENBQUMsQ0FBQztZQUV2RSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtnQkFDdEIsTUFBTSxJQUFJLGdDQUFtQixDQUN6QixtRkFBbUY7b0JBQ25GLHdDQUF3QyxDQUFDLENBQUM7YUFDL0M7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLFVBQVUsRUFBRTtnQkFDckMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLDhCQUE4QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FB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RixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDckMsT0FBTyxJQUFJLENBQUM7U0FDYjtJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9nZ2luZ30gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHtSdWxlLCBTY2hlbWF0aWNDb250ZXh0LCBTY2hlbWF0aWNzRXhjZXB0aW9uLCBUcmVlfSBmcm9tICdAYW5ndWxhci1kZXZraXQvc2NoZW1hdGljcyc7XG5pbXBvcnQge0FvdENvbXBpbGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge1BhcnRpYWxFdmFsdWF0b3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcmVmbGVjdGlvbic7XG5pbXBvcnQge3JlbGF0aXZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldFByb2plY3RUc0NvbmZpZ1BhdGhzfSBmcm9tICcuLi8uLi91dGlscy9wcm9qZWN0X3RzY29uZmlnX3BhdGhzJztcblxuaW1wb3J0IHtjcmVhdGVOZ2NQcm9ncmFtfSBmcm9tICcuL2NyZWF0ZV9uZ2NfcHJvZ3JhbSc7XG5pbXBvcnQge05nRGVjbGFyYXRpb25Db2xsZWN0b3J9IGZyb20gJy4vbmdfZGVjbGFyYXRpb25fY29sbGVjdG9yJztcbmltcG9ydCB7VW5kZWNvcmF0ZWRDbGFzc2VzVHJhbnNmb3JtfSBmcm9tICcuL3RyYW5zZm9ybSc7XG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbmNvbnN0IE1JR1JBVElPTl9SRVJVTl9NRVNTQUdFID0gJ01pZ3JhdGlvbiBjYW4gYmUgcmVydW4gd2l0aDogXCJuZyB1cGRhdGUgQGFuZ3VsYXIvY29yZSAnICtcbiAgICAnLS1mcm9tIDguMC4wIC0tdG8gOS4wLjAgLS1taWdyYXRlLW9ubHlcIic7XG5cbmNvbnN0IE1JR1JBVElPTl9BT1RfRkFJTFVSRSA9ICdUaGlzIG1pZ3JhdGlvbiB1c2VzIHRoZSBBbmd1bGFyIGNvbXBpbGVyIGludGVybmFsbHkgYW5kICcgK1xuICAgICd0aGVyZWZvcmUgcHJvamVjdHMgdGhhdCBubyBsb25nZXIgYnVpbGQgc3VjY2Vzc2Z1bGx5IGFmdGVyIHRoZSB1cGRhdGUgY2Fubm90IHJ1biAnICtcbiAgICAndGhlIG1pZ3JhdGlvbi4gUGxlYXNlIGVuc3VyZSB0aGVyZSBhcmUgbm8gQU9UIGNvbXBpbGF0aW9uIGVycm9ycyBhbmQgcmVydW4gdGhlIG1pZ3JhdGlvbi4nO1xuXG4vKiogRW50cnkgcG9pbnQgZm9yIHRoZSBWOSBcInVuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaVwiIG1pZ3JhdGlvbi4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCk6IFJ1bGUge1xuICByZXR1cm4gKHRyZWU6IFRyZWUsIGN0eDogU2NoZW1hdGljQ29udGV4dCkgPT4ge1xuICAgIGNvbnN0IHtidWlsZFBhdGhzfSA9IGdldFByb2plY3RUc0NvbmZpZ1BhdGhzKHRyZWUpO1xuICAgIGNvbnN0IGJhc2VQYXRoID0gcHJvY2Vzcy5jd2QoKTtcbiAgICBjb25zdCBmYWlsdXJlczogc3RyaW5nW10gPSBbXTtcblxuICAgIGN0eC5sb2dnZXIuaW5mbygnLS0tLS0tIFVuZGVjb3JhdGVkIGNsYXNzZXMgd2l0aCBESSBtaWdyYXRpb24gLS0tLS0tJyk7XG5cbiAgICBpZiAoIWJ1aWxkUGF0aHMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgU2NoZW1hdGljc0V4Y2VwdGlvbihcbiAgICAgICAgICAnQ291bGQgbm90IGZpbmQgYW55IHRzY29uZmlnIGZpbGUuIENhbm5vdCBtaWdyYXRlIHVuZGVjb3JhdGVkIGRlcml2ZWQgY2xhc3NlcyBhbmQgJyArXG4gICAgICAgICAgJ3VuZGVjb3JhdGVkIGJhc2UgY2xhc3NlcyB3aGljaCB1c2UgREkuJyk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB0c2NvbmZpZ1BhdGggb2YgYnVpbGRQYXRocykge1xuICAgICAgZmFpbHVyZXMucHVzaCguLi5ydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24odHJlZSwgdHNjb25maWdQYXRoLCBiYXNlUGF0aCwgY3R4LmxvZ2dlcikpO1xuICAgIH1cblxuICAgIGlmIChmYWlsdXJlcy5sZW5ndGgpIHtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnQ291bGQgbm90IG1pZ3JhdGUgYWxsIHVuZGVjb3JhdGVkIGNsYXNzZXMgdGhhdCB1c2UgZGVwZW5kZW5jeScpO1xuICAgICAgY3R4LmxvZ2dlci5pbmZvKCdpbmplY3Rpb24uIFBsZWFzZSBtYW51YWxseSBmaXggdGhlIGZvbGxvd2luZyBmYWlsdXJlczonKTtcbiAgICAgIGZhaWx1cmVzLmZvckVhY2gobWVzc2FnZSA9PiBjdHgubG9nZ2VyLndhcm4oYOKukSAgICR7bWVzc2FnZX1gKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN0eC5sb2dnZXIuaW5mbygnU3VjY2Vzc2Z1bGx5IG1pZ3JhdGVkIGFsbCBmb3VuZCB1bmRlY29yYXRlZCBjbGFzc2VzJyk7XG4gICAgICBjdHgubG9nZ2VyLmluZm8oJ3RoYXQgdXNlIGRlcGVuZGVuY3kgaW5qZWN0aW9uLicpO1xuICAgIH1cblxuICAgIGN0eC5sb2dnZXIuaW5mbygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBydW5VbmRlY29yYXRlZENsYXNzZXNNaWdyYXRpb24oXG4gICAgdHJlZTogVHJlZSwgdHNjb25maWdQYXRoOiBzdHJpbmcsIGJhc2VQYXRoOiBzdHJpbmcsIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGkpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGZhaWx1cmVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBwcm9ncmFtRGF0YSA9IGdyYWNlZnVsbHlDcmVhdGVQcm9ncmFtKHRyZWUsIGJhc2VQYXRoLCB0c2NvbmZpZ1BhdGgsIGxvZ2dlcik7XG5cbiAgLy8gR3JhY2VmdWxseSBleGl0IGlmIHRoZSBwcm9ncmFtIGNvdWxkIG5vdCBiZSBjcmVhdGVkLlxuICBpZiAocHJvZ3JhbURhdGEgPT09IG51bGwpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCB7cHJvZ3JhbSwgY29tcGlsZXJ9ID0gcHJvZ3JhbURhdGE7XG4gIGNvbnN0IHR5cGVDaGVja2VyID0gcHJvZ3JhbS5nZXRUeXBlQ2hlY2tlcigpO1xuICBjb25zdCBwYXJ0aWFsRXZhbHVhdG9yID1cbiAgICAgIG5ldyBQYXJ0aWFsRXZhbHVhdG9yKG5ldyBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QodHlwZUNoZWNrZXIpLCB0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IGRlY2xhcmF0aW9uQ29sbGVjdG9yID0gbmV3IE5nRGVjbGFyYXRpb25Db2xsZWN0b3IodHlwZUNoZWNrZXIsIHBhcnRpYWxFdmFsdWF0b3IpO1xuICBjb25zdCByb290U291cmNlRmlsZXMgPSBwcm9ncmFtLmdldFJvb3RGaWxlTmFtZXMoKS5tYXAoZiA9PiBwcm9ncmFtLmdldFNvdXJjZUZpbGUoZikgISk7XG5cbiAgLy8gQW5hbHl6ZSBzb3VyY2UgZmlsZXMgYnkgZGV0ZWN0aW5nIGFsbCBkaXJlY3RpdmVzLCBjb21wb25lbnRzIGFuZCBwcm92aWRlcnMuXG4gIHJvb3RTb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gZGVjbGFyYXRpb25Db2xsZWN0b3IudmlzaXROb2RlKHNvdXJjZUZpbGUpKTtcblxuICBjb25zdCB7ZGVjb3JhdGVkRGlyZWN0aXZlcywgZGVjb3JhdGVkUHJvdmlkZXJzLCB1bmRlY29yYXRlZERlY2xhcmF0aW9uc30gPSBkZWNsYXJhdGlvbkNvbGxlY3RvcjtcbiAgY29uc3QgdHJhbnNmb3JtID1cbiAgICAgIG5ldyBVbmRlY29yYXRlZENsYXNzZXNUcmFuc2Zvcm0odHlwZUNoZWNrZXIsIGNvbXBpbGVyLCBwYXJ0aWFsRXZhbHVhdG9yLCBnZXRVcGRhdGVSZWNvcmRlcik7XG4gIGNvbnN0IHVwZGF0ZVJlY29yZGVycyA9IG5ldyBNYXA8dHMuU291cmNlRmlsZSwgVXBkYXRlUmVjb3JkZXI+KCk7XG5cbiAgLy8gUnVuIHRoZSBtaWdyYXRpb25zIGZvciBkZWNvcmF0ZWQgcHJvdmlkZXJzIGFuZCBib3RoIGRlY29yYXRlZCBhbmQgdW5kZWNvcmF0ZWRcbiAgLy8gZGlyZWN0aXZlcy4gVGhlIHRyYW5zZm9ybSBmYWlsdXJlcyBhcmUgY29sbGVjdGVkIGFuZCBjb252ZXJ0ZWQgaW50byBodW1hbi1yZWFkYWJsZVxuICAvLyBmYWlsdXJlcyB3aGljaCBjYW4gYmUgcHJpbnRlZCB0byB0aGUgY29uc29sZS5cbiAgWy4uLnRyYW5zZm9ybS5taWdyYXRlRGVjb3JhdGVkRGlyZWN0aXZlcyhkZWNvcmF0ZWREaXJlY3RpdmVzKSxcbiAgIC4uLnRyYW5zZm9ybS5taWdyYXRlRGVjb3JhdGVkUHJvdmlkZXJzKGRlY29yYXRlZFByb3ZpZGVycyksXG4gICAuLi50cmFuc2Zvcm0ubWlncmF0ZVVuZGVjb3JhdGVkRGVjbGFyYXRpb25zKEFycmF5LmZyb20odW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMpKV1cbiAgICAgIC5mb3JFYWNoKCh7bm9kZSwgbWVzc2FnZX0pID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZVNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgICAgY29uc3QgcmVsYXRpdmVGaWxlUGF0aCA9IHJlbGF0aXZlKGJhc2VQYXRoLCBub2RlU291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgICAgIGNvbnN0IHtsaW5lLCBjaGFyYWN0ZXJ9ID1cbiAgICAgICAgICAgIHRzLmdldExpbmVBbmRDaGFyYWN0ZXJPZlBvc2l0aW9uKG5vZGUuZ2V0U291cmNlRmlsZSgpLCBub2RlLmdldFN0YXJ0KCkpO1xuICAgICAgICBmYWlsdXJlcy5wdXNoKGAke3JlbGF0aXZlRmlsZVBhdGh9QCR7bGluZSArIDF9OiR7Y2hhcmFjdGVyICsgMX06ICR7bWVzc2FnZX1gKTtcbiAgICAgIH0pO1xuXG4gIC8vIFJlY29yZCB0aGUgY2hhbmdlcyBjb2xsZWN0ZWQgaW4gdGhlIGltcG9ydCBtYW5hZ2VyIGFuZCB0cmFuc2Zvcm1lci5cbiAgdHJhbnNmb3JtLnJlY29yZENoYW5nZXMoKTtcblxuICAvLyBXYWxrIHRocm91Z2ggZWFjaCB1cGRhdGUgcmVjb3JkZXIgYW5kIGNvbW1pdCB0aGUgdXBkYXRlLiBXZSBuZWVkIHRvIGNvbW1pdCB0aGVcbiAgLy8gdXBkYXRlcyBpbiBiYXRjaGVzIHBlciBzb3VyY2UgZmlsZSBhcyB0aGVyZSBjYW4gYmUgb25seSBvbmUgcmVjb3JkZXIgcGVyIHNvdXJjZVxuICAvLyBmaWxlIGluIG9yZGVyIHRvIGF2b2lkIHNoaWZ0ZWQgY2hhcmFjdGVyIG9mZnNldHMuXG4gIHVwZGF0ZVJlY29yZGVycy5mb3JFYWNoKHJlY29yZGVyID0+IHJlY29yZGVyLmNvbW1pdFVwZGF0ZSgpKTtcblxuICByZXR1cm4gZmFpbHVyZXM7XG5cbiAgLyoqIEdldHMgdGhlIHVwZGF0ZSByZWNvcmRlciBmb3IgdGhlIHNwZWNpZmllZCBzb3VyY2UgZmlsZS4gKi9cbiAgZnVuY3Rpb24gZ2V0VXBkYXRlUmVjb3JkZXIoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IFVwZGF0ZVJlY29yZGVyIHtcbiAgICBpZiAodXBkYXRlUmVjb3JkZXJzLmhhcyhzb3VyY2VGaWxlKSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVJlY29yZGVycy5nZXQoc291cmNlRmlsZSkgITtcbiAgICB9XG4gICAgY29uc3QgdHJlZVJlY29yZGVyID0gdHJlZS5iZWdpblVwZGF0ZShyZWxhdGl2ZShiYXNlUGF0aCwgc291cmNlRmlsZS5maWxlTmFtZSkpO1xuICAgIGNvbnN0IHJlY29yZGVyOiBVcGRhdGVSZWNvcmRlciA9IHtcbiAgICAgIGFkZENsYXNzQ29tbWVudChub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCB0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydExlZnQobm9kZS5tZW1iZXJzLnBvcywgYFxcbiAgLy8gJHt0ZXh0fVxcbmApO1xuICAgICAgfSxcbiAgICAgIGFkZENsYXNzRGVjb3JhdG9yKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHRleHQ6IHN0cmluZykge1xuICAgICAgICAvLyBOZXcgaW1wb3J0cyBzaG91bGQgYmUgaW5zZXJ0ZWQgYXQgdGhlIGxlZnQgd2hpbGUgZGVjb3JhdG9ycyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAgICAgICAgLy8gYXQgdGhlIHJpZ2h0IGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IGltcG9ydHMgYXJlIGluc2VydGVkIGJlZm9yZSB0aGUgZGVjb3JhdG9yXG4gICAgICAgIC8vIGlmIHRoZSBzdGFydCBwb3NpdGlvbiBvZiBpbXBvcnQgYW5kIGRlY29yYXRvciBpcyB0aGUgc291cmNlIGZpbGUgc3RhcnQuXG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRSaWdodChub2RlLmdldFN0YXJ0KCksIGAke3RleHR9XFxuYCk7XG4gICAgICB9LFxuICAgICAgYWRkTmV3SW1wb3J0KHN0YXJ0OiBudW1iZXIsIGltcG9ydFRleHQ6IHN0cmluZykge1xuICAgICAgICAvLyBOZXcgaW1wb3J0cyBzaG91bGQgYmUgaW5zZXJ0ZWQgYXQgdGhlIGxlZnQgd2hpbGUgZGVjb3JhdG9ycyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAgICAgICAgLy8gYXQgdGhlIHJpZ2h0IGluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IGltcG9ydHMgYXJlIGluc2VydGVkIGJlZm9yZSB0aGUgZGVjb3JhdG9yXG4gICAgICAgIC8vIGlmIHRoZSBzdGFydCBwb3NpdGlvbiBvZiBpbXBvcnQgYW5kIGRlY29yYXRvciBpcyB0aGUgc291cmNlIGZpbGUgc3RhcnQuXG4gICAgICAgIHRyZWVSZWNvcmRlci5pbnNlcnRMZWZ0KHN0YXJ0LCBpbXBvcnRUZXh0KTtcbiAgICAgIH0sXG4gICAgICB1cGRhdGVFeGlzdGluZ0ltcG9ydChuYW1lZEJpbmRpbmdzOiB0cy5OYW1lZEltcG9ydHMsIG5ld05hbWVkQmluZGluZ3M6IHN0cmluZykge1xuICAgICAgICB0cmVlUmVjb3JkZXIucmVtb3ZlKG5hbWVkQmluZGluZ3MuZ2V0U3RhcnQoKSwgbmFtZWRCaW5kaW5ncy5nZXRXaWR0aCgpKTtcbiAgICAgICAgdHJlZVJlY29yZGVyLmluc2VydFJpZ2h0KG5hbWVkQmluZGluZ3MuZ2V0U3RhcnQoKSwgbmV3TmFtZWRCaW5kaW5ncyk7XG4gICAgICB9LFxuICAgICAgY29tbWl0VXBkYXRlKCkgeyB0cmVlLmNvbW1pdFVwZGF0ZSh0cmVlUmVjb3JkZXIpOyB9XG4gICAgfTtcbiAgICB1cGRhdGVSZWNvcmRlcnMuc2V0KHNvdXJjZUZpbGUsIHJlY29yZGVyKTtcbiAgICByZXR1cm4gcmVjb3JkZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ3JhY2VmdWxseUNyZWF0ZVByb2dyYW0oXG4gICAgdHJlZTogVHJlZSwgYmFzZVBhdGg6IHN0cmluZywgdHNjb25maWdQYXRoOiBzdHJpbmcsXG4gICAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSk6IHtjb21waWxlcjogQW90Q29tcGlsZXIsIHByb2dyYW06IHRzLlByb2dyYW19fG51bGwge1xuICB0cnkge1xuICAgIGNvbnN0IHtuZ2NQcm9ncmFtLCBob3N0LCBwcm9ncmFtLCBjb21waWxlcn0gPSBjcmVhdGVOZ2NQcm9ncmFtKChvcHRpb25zKSA9PiB7XG4gICAgICBjb25zdCBob3N0ID0gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KG9wdGlvbnMsIHRydWUpO1xuXG4gICAgICAvLyBXZSBuZWVkIHRvIG92ZXJ3cml0ZSB0aGUgaG9zdCBcInJlYWRGaWxlXCIgbWV0aG9kLCBhcyB3ZSB3YW50IHRoZSBUeXBlU2NyaXB0XG4gICAgICAvLyBwcm9ncmFtIHRvIGJlIGJhc2VkIG9uIHRoZSBmaWxlIGNvbnRlbnRzIGluIHRoZSB2aXJ0dWFsIGZpbGUgdHJlZS5cbiAgICAgIGhvc3QucmVhZEZpbGUgPSBmaWxlTmFtZSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRyZWUucmVhZChyZWxhdGl2ZShiYXNlUGF0aCwgZmlsZU5hbWUpKTtcbiAgICAgICAgLy8gU3RyaXAgQk9NIGFzIG90aGVyd2lzZSBUU0MgbWV0aG9kcyAoRXg6IGdldFdpZHRoKSB3aWxsIHJldHVybiBhbiBvZmZzZXQgd2hpY2hcbiAgICAgICAgLy8gd2hpY2ggYnJlYWtzIHRoZSBDTEkgVXBkYXRlUmVjb3JkZXIuXG4gICAgICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzMwNzE5XG4gICAgICAgIHJldHVybiBidWZmZXIgPyBidWZmZXIudG9TdHJpbmcoKS5yZXBsYWNlKC9eXFx1RkVGRi8sICcnKSA6IHVuZGVmaW5lZDtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBob3N0O1xuICAgIH0sIHRzY29uZmlnUGF0aCk7XG4gICAgY29uc3Qgc3ludGFjdGljRGlhZ25vc3RpY3MgPSBuZ2NQcm9ncmFtLmdldFRzU3ludGFjdGljRGlhZ25vc3RpY3MoKTtcbiAgICBjb25zdCBzdHJ1Y3R1cmFsRGlhZ25vc3RpY3MgPSBuZ2NQcm9ncmFtLmdldE5nU3RydWN0dXJhbERpYWdub3N0aWNzKCk7XG5cbiAgICAvLyBTeW50YWN0aWMgVHlwZVNjcmlwdCBlcnJvcnMgY2FuIHRocm93IG9mZiB0aGUgcXVlcnkgYW5hbHlzaXMgYW5kIHRoZXJlZm9yZSB3ZSB3YW50XG4gICAgLy8gdG8gbm90aWZ5IHRoZSBkZXZlbG9wZXIgdGhhdCB3ZSBjb3VsZG4ndCBhbmFseXplIHBhcnRzIG9mIHRoZSBwcm9qZWN0LiBEZXZlbG9wZXJzXG4gICAgLy8gY2FuIGp1c3QgcmUtcnVuIHRoZSBtaWdyYXRpb24gYWZ0ZXIgZml4aW5nIHRoZXNlIGZhaWx1cmVzLlxuICAgIGlmIChzeW50YWN0aWNEaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIGxvZ2dlci53YXJuKFxuICAgICAgICAgIGBcXG5UeXBlU2NyaXB0IHByb2plY3QgXCIke3RzY29uZmlnUGF0aH1cIiBoYXMgc3ludGFjdGljYWwgZXJyb3JzIHdoaWNoIGNvdWxkIGNhdXNlIGAgK1xuICAgICAgICAgIGBhbiBpbmNvbXBsZXRlIG1pZ3JhdGlvbi4gUGxlYXNlIGZpeCB0aGUgZm9sbG93aW5nIGZhaWx1cmVzIGFuZCByZXJ1biB0aGUgbWlncmF0aW9uOmApO1xuICAgICAgbG9nZ2VyLmVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKHN5bnRhY3RpY0RpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgICBsb2dnZXIuaW5mbyhNSUdSQVRJT05fUkVSVU5fTUVTU0FHRSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoc3RydWN0dXJhbERpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHRzLmZvcm1hdERpYWdub3N0aWNzKDx0cy5EaWFnbm9zdGljW10+c3RydWN0dXJhbERpYWdub3N0aWNzLCBob3N0KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtwcm9ncmFtLCBjb21waWxlcn07XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2dnZXIud2FybihgXFxuJHtNSUdSQVRJT05fQU9UX0ZBSUxVUkV9LiBUaGUgZm9sbG93aW5nIHByb2plY3QgZmFpbGVkOiAke3RzY29uZmlnUGF0aH1cXG5gKTtcbiAgICBsb2dnZXIuZXJyb3IoYCR7ZS50b1N0cmluZygpfVxcbmApO1xuICAgIGxvZ2dlci5pbmZvKE1JR1JBVElPTl9SRVJVTl9NRVNTQUdFKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19