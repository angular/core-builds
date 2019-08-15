/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/transform", ["require", "exports", "@angular/core", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/class_declaration", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/decorator_rewriter", "@angular/core/schematics/migrations/undecorated-classes-with-di/find_base_classes", "@angular/core/schematics/migrations/undecorated-classes-with-di/import_manager", "@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const core_1 = require("@angular/core");
    const ts = require("typescript");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const class_declaration_1 = require("@angular/core/schematics/utils/typescript/class_declaration");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const convert_directive_metadata_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata");
    const decorator_rewriter_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/decorator_rewriter");
    const find_base_classes_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/find_base_classes");
    const import_manager_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/import_manager");
    const ng_declaration_collector_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector");
    class UndecoratedClassesTransform {
        constructor(typeChecker, compiler, evaluator, getUpdateRecorder) {
            this.typeChecker = typeChecker;
            this.compiler = compiler;
            this.evaluator = evaluator;
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
            this.importManager = new import_manager_1.ImportManager(this.getUpdateRecorder, this.printer);
            this.decoratorRewriter = new decorator_rewriter_1.DecoratorRewriter(this.importManager, this.typeChecker, this.evaluator, this.compiler);
            /** Set of class declarations which have been decorated with "@Directive". */
            this.decoratedDirectives = new Set();
            /** Set of class declarations which have been decorated with "@Injectable" */
            this.decoratedProviders = new Set();
            /**
             * Set of class declarations which have been analyzed and need to specify
             * an explicit constructor.
             */
            this.missingExplicitConstructorClasses = new Set();
            this.symbolResolver = compiler['_symbolResolver'];
            this.compilerHost = compiler['_host'];
            this.metadataResolver = compiler['_metadataResolver'];
            // Unset the default error recorder so that the reflector will throw an exception
            // if metadata cannot be resolved.
            this.compiler.reflector['errorRecorder'] = undefined;
            // Disables that static symbols are resolved through summaries from within the static
            // reflector. Summaries cannot be used for decorator serialization as decorators are
            // omitted in summaries and the decorator can't be reconstructed from the directive summary.
            this._disableSummaryResolution();
        }
        /**
         * Migrates decorated directives which can potentially inherit a constructor
         * from an undecorated base class. All base classes until the first one
         * with an explicit constructor will be decorated with the abstract "@Directive()"
         * decorator. See case 1 in the migration plan: https://hackmd.io/@alx/S1XKqMZeS
         */
        migrateDecoratedDirectives(directives) {
            return directives.reduce((failures, node) => failures.concat(this._migrateDirectiveBaseClass(node)), []);
        }
        /**
         * Migrates decorated providers which can potentially inherit a constructor
         * from an undecorated base class. All base classes until the first one
         * with an explicit constructor will be decorated with the "@Injectable()".
         */
        migrateDecoratedProviders(providers) {
            return providers.reduce((failures, node) => failures.concat(this._migrateProviderBaseClass(node)), []);
        }
        _migrateProviderBaseClass(node) {
            // In case the provider has an explicit constructor, we don't need to do anything
            // because the class is already decorated and does not inherit a constructor.
            if (class_declaration_1.hasExplicitConstructor(node)) {
                return [];
            }
            const orderedBaseClasses = find_base_classes_1.findBaseClassDeclarations(node, this.typeChecker);
            let lastDecoratedClass = node;
            for (let { node: baseClass, identifier } of orderedBaseClasses) {
                const baseClassFile = baseClass.getSourceFile();
                if (class_declaration_1.hasExplicitConstructor(baseClass)) {
                    if (baseClassFile.isDeclarationFile) {
                        const staticSymbol = this._getStaticSymbolOfIdentifier(identifier);
                        // If the base class is decorated through metadata files, we don't
                        // need to add a comment to the derived class for the external base class.
                        if (staticSymbol && this.metadataResolver.isInjectable(staticSymbol)) {
                            break;
                        }
                        // If the base class is not decorated, we cannot decorate the base class and
                        // need to a comment to the last decorated class.
                        return this._addMissingExplicitConstructorTodo(lastDecoratedClass);
                    }
                    this._addInjectableDecorator(baseClass);
                    break;
                }
                // Add the "@Injectable" decorator for all base classes in the inheritance chain
                // until the base class with the explicit constructor. The decorator will be only
                // added for base classes which can be modified.
                if (!baseClassFile.isDeclarationFile) {
                    this._addInjectableDecorator(baseClass);
                    lastDecoratedClass = baseClass;
                }
            }
            return [];
        }
        _migrateDirectiveBaseClass(node) {
            // In case the directive has an explicit constructor, we don't need to do
            // anything because the class is already decorated with "@Directive" or "@Component"
            if (class_declaration_1.hasExplicitConstructor(node)) {
                return [];
            }
            const orderedBaseClasses = find_base_classes_1.findBaseClassDeclarations(node, this.typeChecker);
            let lastDecoratedClass = node;
            for (let { node: baseClass, identifier } of orderedBaseClasses) {
                const baseClassFile = baseClass.getSourceFile();
                if (class_declaration_1.hasExplicitConstructor(baseClass)) {
                    if (baseClassFile.isDeclarationFile) {
                        // If the base class is decorated through metadata files, we don't
                        // need to add a comment to the derived class for the external base class.
                        if (this._hasDirectiveMetadata(identifier)) {
                            break;
                        }
                        // If the base class is not decorated, we cannot decorate the base class and
                        // need to a comment to the last decorated class.
                        return this._addMissingExplicitConstructorTodo(lastDecoratedClass);
                    }
                    this._addAbstractDirectiveDecorator(baseClass);
                    break;
                }
                // Add the abstract directive decorator for all base classes in the inheritance
                // chain until the base class with the explicit constructor. The decorator will
                // be only added for base classes which can be modified.
                if (!baseClassFile.isDeclarationFile) {
                    this._addAbstractDirectiveDecorator(baseClass);
                    lastDecoratedClass = baseClass;
                }
            }
            return [];
        }
        /**
         * Adds the abstract "@Directive()" decorator to the given class in case there
         * is no existing directive decorator.
         */
        _addAbstractDirectiveDecorator(baseClass) {
            if (ng_declaration_collector_1.hasDirectiveDecorator(baseClass, this.typeChecker) ||
                this.decoratedDirectives.has(baseClass)) {
                return;
            }
            const baseClassFile = baseClass.getSourceFile();
            const recorder = this.getUpdateRecorder(baseClassFile);
            const directiveExpr = this.importManager.addImportToSourceFile(baseClassFile, 'Directive', '@angular/core');
            const newDecorator = ts.createDecorator(ts.createCall(directiveExpr, undefined, []));
            const newDecoratorText = this.printer.printNode(ts.EmitHint.Unspecified, newDecorator, baseClassFile);
            recorder.addClassDecorator(baseClass, newDecoratorText);
            this.decoratedDirectives.add(baseClass);
        }
        /**
         * Adds the abstract "@Injectable()" decorator to the given class in case there
         * is no existing directive decorator.
         */
        _addInjectableDecorator(baseClass) {
            if (ng_declaration_collector_1.hasInjectableDecorator(baseClass, this.typeChecker) ||
                this.decoratedProviders.has(baseClass)) {
                return;
            }
            const baseClassFile = baseClass.getSourceFile();
            const recorder = this.getUpdateRecorder(baseClassFile);
            const injectableExpr = this.importManager.addImportToSourceFile(baseClassFile, 'Injectable', '@angular/core');
            const newDecorator = ts.createDecorator(ts.createCall(injectableExpr, undefined, []));
            const newDecoratorText = this.printer.printNode(ts.EmitHint.Unspecified, newDecorator, baseClassFile);
            recorder.addClassDecorator(baseClass, newDecoratorText);
            this.decoratedProviders.add(baseClass);
        }
        /** Adds a comment for adding an explicit constructor to the given class declaration. */
        _addMissingExplicitConstructorTodo(node) {
            // In case a todo comment has been already inserted to the given class, we don't
            //  want to add a comment or transform failure multiple times.
            if (this.missingExplicitConstructorClasses.has(node)) {
                return [];
            }
            this.missingExplicitConstructorClasses.add(node);
            const recorder = this.getUpdateRecorder(node.getSourceFile());
            recorder.addClassComment(node, 'TODO: add explicit constructor');
            return [{ node: node, message: 'Class needs to declare an explicit constructor.' }];
        }
        /**
         * Migrates undecorated directives which were referenced in NgModule declarations.
         * These directives inherit the metadata from a parent base class, but with Ivy
         * these classes need to explicitly have a decorator for locality. The migration
         * determines the inherited decorator and copies it to the undecorated declaration.
         *
         * Note that the migration serializes the metadata for external declarations
         * where the decorator is not part of the source file AST.
         *
         * See case 2 in the migration plan: https://hackmd.io/@alx/S1XKqMZeS
         */
        migrateUndecoratedDeclarations(directives) {
            return directives.reduce((failures, node) => failures.concat(this._migrateDerivedDeclaration(node)), []);
        }
        _migrateDerivedDeclaration(node) {
            const targetSourceFile = node.getSourceFile();
            const orderedBaseClasses = find_base_classes_1.findBaseClassDeclarations(node, this.typeChecker);
            let newDecoratorText = null;
            for (let { node: baseClass, identifier } of orderedBaseClasses) {
                // Before looking for decorators within the metadata or summary files, we
                // try to determine the directive decorator through the source file AST.
                if (baseClass.decorators) {
                    const ngDecorator = ng_decorators_1.getAngularDecorators(this.typeChecker, baseClass.decorators)
                        .find(({ name }) => name === 'Component' || name === 'Directive' || name === 'Pipe');
                    if (ngDecorator) {
                        const newDecorator = this.decoratorRewriter.rewrite(ngDecorator, node.getSourceFile());
                        newDecoratorText = this.printer.printNode(ts.EmitHint.Unspecified, newDecorator, ngDecorator.node.getSourceFile());
                        break;
                    }
                }
                // If no metadata could be found within the source-file AST, try to find
                // decorator data through Angular metadata and summary files.
                const staticSymbol = this._getStaticSymbolOfIdentifier(identifier);
                // Check if the static symbol resolves to a class declaration with
                // pipe or directive metadata.
                if (!staticSymbol ||
                    !(this.metadataResolver.isPipe(staticSymbol) ||
                        this.metadataResolver.isDirective(staticSymbol))) {
                    continue;
                }
                const metadata = this._resolveDeclarationMetadata(staticSymbol);
                // If no metadata could be resolved for the static symbol, print a failure message
                // and ask the developer to manually migrate the class. This case is rare because
                // usually decorator metadata is always present but just can't be read if a program
                // only has access to summaries (this is a special case in google3).
                if (!metadata) {
                    return [{
                            node,
                            message: `Class cannot be migrated as the inherited metadata from ` +
                                `${identifier.getText()} cannot be converted into a decorator. Please manually 
            decorate the class.`,
                        }];
                }
                const newDecorator = this._constructDecoratorFromMetadata(metadata, targetSourceFile);
                if (!newDecorator) {
                    const annotationType = metadata.type;
                    return [{
                            node,
                            message: `Class cannot be migrated as the inherited @${annotationType} decorator ` +
                                `cannot be copied. Please manually add a @${annotationType} decorator.`,
                        }];
                }
                // In case the decorator could be constructed from the resolved metadata, use
                // that decorator for the derived undecorated classes.
                newDecoratorText =
                    this.printer.printNode(ts.EmitHint.Unspecified, newDecorator, targetSourceFile);
                break;
            }
            if (!newDecoratorText) {
                return [{
                        node,
                        message: 'Class cannot be migrated as no directive/component/pipe metadata could be found. ' +
                            'Please manually add a @Directive, @Component or @Pipe decorator.'
                    }];
            }
            this.getUpdateRecorder(targetSourceFile).addClassDecorator(node, newDecoratorText);
            return [];
        }
        /** Records all changes that were made in the import manager. */
        recordChanges() { this.importManager.recordChanges(); }
        /**
         * Constructs a TypeScript decorator node from the specified declaration metadata. Returns
         * null if the metadata could not be simplified/resolved.
         */
        _constructDecoratorFromMetadata(directiveMetadata, targetSourceFile) {
            try {
                const decoratorExpr = convert_directive_metadata_1.convertDirectiveMetadataToExpression(directiveMetadata.metadata, staticSymbol => this.compilerHost
                    .fileNameToModuleName(staticSymbol.filePath, targetSourceFile.fileName)
                    .replace(/\/index$/, ''), (moduleName, name) => this.importManager.addImportToSourceFile(targetSourceFile, name, moduleName), (propertyName, value) => {
                    // Only normalize properties called "changeDetection" and "encapsulation"
                    // for "@Directive" and "@Component" annotations.
                    if (directiveMetadata.type === 'Pipe') {
                        return null;
                    }
                    // Instead of using the number as value for the "changeDetection" and
                    // "encapsulation" properties, we want to use the actual enum symbols.
                    if (propertyName === 'changeDetection' && typeof value === 'number') {
                        return ts.createPropertyAccess(this.importManager.addImportToSourceFile(targetSourceFile, 'ChangeDetectionStrategy', '@angular/core'), core_1.ChangeDetectionStrategy[value]);
                    }
                    else if (propertyName === 'encapsulation' && typeof value === 'number') {
                        return ts.createPropertyAccess(this.importManager.addImportToSourceFile(targetSourceFile, 'ViewEncapsulation', '@angular/core'), core_1.ViewEncapsulation[value]);
                    }
                    return null;
                });
                return ts.createDecorator(ts.createCall(this.importManager.addImportToSourceFile(targetSourceFile, directiveMetadata.type, '@angular/core'), undefined, [decoratorExpr]));
            }
            catch (e) {
                if (e instanceof convert_directive_metadata_1.UnexpectedMetadataValueError) {
                    return null;
                }
                throw e;
            }
        }
        /**
         * Whether the given identifier resolves to a class declaration that
         * has metadata for a directive.
         */
        _hasDirectiveMetadata(node) {
            const symbol = this._getStaticSymbolOfIdentifier(node);
            if (!symbol) {
                return false;
            }
            return this.metadataResolver.isDirective(symbol);
        }
        /**
         * Resolves the declaration metadata of a given static symbol. The metadata
         * is determined by resolving metadata for the static symbol.
         */
        _resolveDeclarationMetadata(symbol) {
            try {
                // Note that this call can throw if the metadata is not computable. In that
                // case we are not able to serialize the metadata into a decorator and we return
                // null.
                const annotations = this.compiler.reflector.annotations(symbol).find(s => s.ngMetadataName === 'Component' || s.ngMetadataName === 'Directive' ||
                    s.ngMetadataName === 'Pipe');
                if (!annotations) {
                    return null;
                }
                const { ngMetadataName } = annotations, metadata = __rest(annotations, ["ngMetadataName"]);
                // Delete the "ngMetadataName" property as we don't want to generate
                // a property assignment in the new decorator for that internal property.
                delete metadata['ngMetadataName'];
                return { type: ngMetadataName, metadata };
            }
            catch (e) {
                return null;
            }
        }
        _getStaticSymbolOfIdentifier(node) {
            const sourceFile = node.getSourceFile();
            const resolvedImport = imports_1.getImportOfIdentifier(this.typeChecker, node);
            if (!resolvedImport) {
                return null;
            }
            const moduleName = this.compilerHost.moduleNameToFileName(resolvedImport.importModule, sourceFile.fileName);
            if (!moduleName) {
                return null;
            }
            // Find the declaration symbol as symbols could be aliased due to
            // metadata re-exports.
            return this.compiler.reflector.findSymbolDeclaration(this.symbolResolver.getStaticSymbol(moduleName, resolvedImport.name));
        }
        /**
         * Disables that static symbols are resolved through summaries. Summaries
         * cannot be used for decorator analysis as decorators are omitted in summaries.
         */
        _disableSummaryResolution() {
            // We never want to resolve symbols through summaries. Summaries never contain
            // decorators for class symbols and therefore summaries will cause every class
            // to be considered as undecorated. See reason for this in: "ToJsonSerializer".
            // In order to ensure that metadata is not retrieved through summaries, we
            // need to disable summary resolution, clear previous symbol caches. This way
            // future calls to "StaticReflector#annotations" are based on metadata files.
            this.symbolResolver['_resolveSymbolFromSummary'] = () => null;
            this.symbolResolver['resolvedSymbols'].clear();
            this.symbolResolver['resolvedFilePaths'].clear();
            this.compiler.reflector['annotationCache'].clear();
            // Original summary resolver used by the AOT compiler.
            const summaryResolver = this.symbolResolver['summaryResolver'];
            // Additionally we need to ensure that no files are treated as "library" files when
            // resolving metadata. This is necessary because by default the symbol resolver discards
            // class metadata for library files. See "StaticSymbolResolver#createResolvedSymbol".
            // Patching this function **only** for the static symbol resolver ensures that metadata
            // is not incorrectly omitted. Note that we only want to do this for the symbol resolver
            // because otherwise we could break the summary loading logic which is used to detect
            // if a static symbol is either a directive, component or pipe (see MetadataResolver).
            this.symbolResolver['summaryResolver'] = {
                fromSummaryFileName: summaryResolver.fromSummaryFileName.bind(summaryResolver),
                addSummary: summaryResolver.addSummary.bind(summaryResolver),
                getImportAs: summaryResolver.getImportAs.bind(summaryResolver),
                getKnownModuleName: summaryResolver.getKnownModuleName.bind(summaryResolver),
                resolveSummary: summaryResolver.resolveSummary.bind(summaryResolver),
                toSummaryFileName: summaryResolver.toSummaryFileName.bind(summaryResolver),
                getSymbolsOf: summaryResolver.getSymbolsOf.bind(summaryResolver),
                isLibraryFile: () => false,
            };
        }
    }
    exports.UndecoratedClassesTransform = UndecoratedClassesTransform;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSUgsd0NBQXlFO0lBQ3pFLGlDQUFpQztJQUVqQyxnRkFBK0Q7SUFDL0QsbUdBQWdGO0lBQ2hGLCtFQUFxRTtJQUVyRSw2SkFBa0k7SUFDbEksNklBQXlFO0lBQ3pFLHlIQUE4RDtJQUM5RCxtSEFBK0M7SUFDL0MsdUlBQXlGO0lBZ0J6RixNQUFhLDJCQUEyQjtRQW9CdEMsWUFDWSxXQUEyQixFQUFVLFFBQXFCLEVBQzFELFNBQTJCLEVBQzNCLGlCQUF3RDtZQUZ4RCxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQzFELGNBQVMsR0FBVCxTQUFTLENBQWtCO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUM7WUF0QjVELFlBQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztZQUMvRCxrQkFBYSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hFLHNCQUFpQixHQUNyQixJQUFJLHNDQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQU0vRiw2RUFBNkU7WUFDckUsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFDN0QsNkVBQTZFO1lB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LENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDcEUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQzFFLFlBQVksRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQ2hFLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLO2FBQzNCLENBQUM7UUFDSixDQUFDO0tBQ0Y7SUFyY0Qsa0VBcWNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FvdENvbXBpbGVyLCBBb3RDb21waWxlckhvc3QsIENvbXBpbGVNZXRhZGF0YVJlc29sdmVyLCBTdGF0aWNTeW1ib2wsIFN0YXRpY1N5bWJvbFJlc29sdmVyLCBTdW1tYXJ5UmVzb2x2ZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7UGFydGlhbEV2YWx1YXRvcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9wYXJ0aWFsX2V2YWx1YXRvcic7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge2hhc0V4cGxpY2l0Q29uc3RydWN0b3J9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY2xhc3NfZGVjbGFyYXRpb24nO1xuaW1wb3J0IHtnZXRJbXBvcnRPZklkZW50aWZpZXJ9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5cbmltcG9ydCB7VW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvciwgY29udmVydERpcmVjdGl2ZU1ldGFkYXRhVG9FeHByZXNzaW9ufSBmcm9tICcuL2RlY29yYXRvcl9yZXdyaXRlL2NvbnZlcnRfZGlyZWN0aXZlX21ldGFkYXRhJztcbmltcG9ydCB7RGVjb3JhdG9yUmV3cml0ZXJ9IGZyb20gJy4vZGVjb3JhdG9yX3Jld3JpdGUvZGVjb3JhdG9yX3Jld3JpdGVyJztcbmltcG9ydCB7ZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9uc30gZnJvbSAnLi9maW5kX2Jhc2VfY2xhc3Nlcyc7XG5pbXBvcnQge0ltcG9ydE1hbmFnZXJ9IGZyb20gJy4vaW1wb3J0X21hbmFnZXInO1xuaW1wb3J0IHtoYXNEaXJlY3RpdmVEZWNvcmF0b3IsIGhhc0luamVjdGFibGVEZWNvcmF0b3J9IGZyb20gJy4vbmdfZGVjbGFyYXRpb25fY29sbGVjdG9yJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuXG5cbi8qKiBSZXNvbHZlZCBtZXRhZGF0YSBvZiBhIGRlY2xhcmF0aW9uLiAqL1xuaW50ZXJmYWNlIERlY2xhcmF0aW9uTWV0YWRhdGEge1xuICBtZXRhZGF0YTogYW55O1xuICB0eXBlOiAnQ29tcG9uZW50J3wnRGlyZWN0aXZlJ3wnUGlwZSc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNmb3JtRmFpbHVyZSB7XG4gIG5vZGU6IHRzLk5vZGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFVuZGVjb3JhdGVkQ2xhc3Nlc1RyYW5zZm9ybSB7XG4gIHByaXZhdGUgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoe25ld0xpbmU6IHRzLk5ld0xpbmVLaW5kLkxpbmVGZWVkfSk7XG4gIHByaXZhdGUgaW1wb3J0TWFuYWdlciA9IG5ldyBJbXBvcnRNYW5hZ2VyKHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIsIHRoaXMucHJpbnRlcik7XG4gIHByaXZhdGUgZGVjb3JhdG9yUmV3cml0ZXIgPVxuICAgICAgbmV3IERlY29yYXRvclJld3JpdGVyKHRoaXMuaW1wb3J0TWFuYWdlciwgdGhpcy50eXBlQ2hlY2tlciwgdGhpcy5ldmFsdWF0b3IsIHRoaXMuY29tcGlsZXIpO1xuXG4gIHByaXZhdGUgY29tcGlsZXJIb3N0OiBBb3RDb21waWxlckhvc3Q7XG4gIHByaXZhdGUgc3ltYm9sUmVzb2x2ZXI6IFN0YXRpY1N5bWJvbFJlc29sdmVyO1xuICBwcml2YXRlIG1ldGFkYXRhUmVzb2x2ZXI6IENvbXBpbGVNZXRhZGF0YVJlc29sdmVyO1xuXG4gIC8qKiBTZXQgb2YgY2xhc3MgZGVjbGFyYXRpb25zIHdoaWNoIGhhdmUgYmVlbiBkZWNvcmF0ZWQgd2l0aCBcIkBEaXJlY3RpdmVcIi4gKi9cbiAgcHJpdmF0ZSBkZWNvcmF0ZWREaXJlY3RpdmVzID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuICAvKiogU2V0IG9mIGNsYXNzIGRlY2xhcmF0aW9ucyB3aGljaCBoYXZlIGJlZW4gZGVjb3JhdGVkIHdpdGggXCJASW5qZWN0YWJsZVwiICovXG4gIHByaXZhdGUgZGVjb3JhdGVkUHJvdmlkZXJzID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuICAvKipcbiAgICogU2V0IG9mIGNsYXNzIGRlY2xhcmF0aW9ucyB3aGljaCBoYXZlIGJlZW4gYW5hbHl6ZWQgYW5kIG5lZWQgdG8gc3BlY2lmeVxuICAgKiBhbiBleHBsaWNpdCBjb25zdHJ1Y3Rvci5cbiAgICovXG4gIHByaXZhdGUgbWlzc2luZ0V4cGxpY2l0Q29uc3RydWN0b3JDbGFzc2VzID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHByaXZhdGUgY29tcGlsZXI6IEFvdENvbXBpbGVyLFxuICAgICAgcHJpdmF0ZSBldmFsdWF0b3I6IFBhcnRpYWxFdmFsdWF0b3IsXG4gICAgICBwcml2YXRlIGdldFVwZGF0ZVJlY29yZGVyOiAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IFVwZGF0ZVJlY29yZGVyKSB7XG4gICAgdGhpcy5zeW1ib2xSZXNvbHZlciA9IGNvbXBpbGVyWydfc3ltYm9sUmVzb2x2ZXInXTtcbiAgICB0aGlzLmNvbXBpbGVySG9zdCA9IGNvbXBpbGVyWydfaG9zdCddO1xuICAgIHRoaXMubWV0YWRhdGFSZXNvbHZlciA9IGNvbXBpbGVyWydfbWV0YWRhdGFSZXNvbHZlciddO1xuXG4gICAgLy8gVW5zZXQgdGhlIGRlZmF1bHQgZXJyb3IgcmVjb3JkZXIgc28gdGhhdCB0aGUgcmVmbGVjdG9yIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uXG4gICAgLy8gaWYgbWV0YWRhdGEgY2Fubm90IGJlIHJlc29sdmVkLlxuICAgIHRoaXMuY29tcGlsZXIucmVmbGVjdG9yWydlcnJvclJlY29yZGVyJ10gPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBEaXNhYmxlcyB0aGF0IHN0YXRpYyBzeW1ib2xzIGFyZSByZXNvbHZlZCB0aHJvdWdoIHN1bW1hcmllcyBmcm9tIHdpdGhpbiB0aGUgc3RhdGljXG4gICAgLy8gcmVmbGVjdG9yLiBTdW1tYXJpZXMgY2Fubm90IGJlIHVzZWQgZm9yIGRlY29yYXRvciBzZXJpYWxpemF0aW9uIGFzIGRlY29yYXRvcnMgYXJlXG4gICAgLy8gb21pdHRlZCBpbiBzdW1tYXJpZXMgYW5kIHRoZSBkZWNvcmF0b3IgY2FuJ3QgYmUgcmVjb25zdHJ1Y3RlZCBmcm9tIHRoZSBkaXJlY3RpdmUgc3VtbWFyeS5cbiAgICB0aGlzLl9kaXNhYmxlU3VtbWFyeVJlc29sdXRpb24oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyBkZWNvcmF0ZWQgZGlyZWN0aXZlcyB3aGljaCBjYW4gcG90ZW50aWFsbHkgaW5oZXJpdCBhIGNvbnN0cnVjdG9yXG4gICAqIGZyb20gYW4gdW5kZWNvcmF0ZWQgYmFzZSBjbGFzcy4gQWxsIGJhc2UgY2xhc3NlcyB1bnRpbCB0aGUgZmlyc3Qgb25lXG4gICAqIHdpdGggYW4gZXhwbGljaXQgY29uc3RydWN0b3Igd2lsbCBiZSBkZWNvcmF0ZWQgd2l0aCB0aGUgYWJzdHJhY3QgXCJARGlyZWN0aXZlKClcIlxuICAgKiBkZWNvcmF0b3IuIFNlZSBjYXNlIDEgaW4gdGhlIG1pZ3JhdGlvbiBwbGFuOiBodHRwczovL2hhY2ttZC5pby9AYWx4L1MxWEtxTVplU1xuICAgKi9cbiAgbWlncmF0ZURlY29yYXRlZERpcmVjdGl2ZXMoZGlyZWN0aXZlczogdHMuQ2xhc3NEZWNsYXJhdGlvbltdKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMuX21pZ3JhdGVEaXJlY3RpdmVCYXNlQ2xhc3Mobm9kZSkpLFxuICAgICAgICBbXSBhcyBUcmFuc2Zvcm1GYWlsdXJlW10pO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGRlY29yYXRlZCBwcm92aWRlcnMgd2hpY2ggY2FuIHBvdGVudGlhbGx5IGluaGVyaXQgYSBjb25zdHJ1Y3RvclxuICAgKiBmcm9tIGFuIHVuZGVjb3JhdGVkIGJhc2UgY2xhc3MuIEFsbCBiYXNlIGNsYXNzZXMgdW50aWwgdGhlIGZpcnN0IG9uZVxuICAgKiB3aXRoIGFuIGV4cGxpY2l0IGNvbnN0cnVjdG9yIHdpbGwgYmUgZGVjb3JhdGVkIHdpdGggdGhlIFwiQEluamVjdGFibGUoKVwiLlxuICAgKi9cbiAgbWlncmF0ZURlY29yYXRlZFByb3ZpZGVycyhwcm92aWRlcnM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXSk6IFRyYW5zZm9ybUZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIHByb3ZpZGVycy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMuX21pZ3JhdGVQcm92aWRlckJhc2VDbGFzcyhub2RlKSksXG4gICAgICAgIFtdIGFzIFRyYW5zZm9ybUZhaWx1cmVbXSk7XG4gIH1cblxuICBwcml2YXRlIF9taWdyYXRlUHJvdmlkZXJCYXNlQ2xhc3Mobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IFRyYW5zZm9ybUZhaWx1cmVbXSB7XG4gICAgLy8gSW4gY2FzZSB0aGUgcHJvdmlkZXIgaGFzIGFuIGV4cGxpY2l0IGNvbnN0cnVjdG9yLCB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nXG4gICAgLy8gYmVjYXVzZSB0aGUgY2xhc3MgaXMgYWxyZWFkeSBkZWNvcmF0ZWQgYW5kIGRvZXMgbm90IGluaGVyaXQgYSBjb25zdHJ1Y3Rvci5cbiAgICBpZiAoaGFzRXhwbGljaXRDb25zdHJ1Y3Rvcihub2RlKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IG9yZGVyZWRCYXNlQ2xhc3NlcyA9IGZpbmRCYXNlQ2xhc3NEZWNsYXJhdGlvbnMobm9kZSwgdGhpcy50eXBlQ2hlY2tlcik7XG4gICAgbGV0IGxhc3REZWNvcmF0ZWRDbGFzczogdHMuQ2xhc3NEZWNsYXJhdGlvbiA9IG5vZGU7XG5cbiAgICBmb3IgKGxldCB7bm9kZTogYmFzZUNsYXNzLCBpZGVudGlmaWVyfSBvZiBvcmRlcmVkQmFzZUNsYXNzZXMpIHtcbiAgICAgIGNvbnN0IGJhc2VDbGFzc0ZpbGUgPSBiYXNlQ2xhc3MuZ2V0U291cmNlRmlsZSgpO1xuXG4gICAgICBpZiAoaGFzRXhwbGljaXRDb25zdHJ1Y3RvcihiYXNlQ2xhc3MpKSB7XG4gICAgICAgIGlmIChiYXNlQ2xhc3NGaWxlLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICAgICAgY29uc3Qgc3RhdGljU3ltYm9sID0gdGhpcy5fZ2V0U3RhdGljU3ltYm9sT2ZJZGVudGlmaWVyKGlkZW50aWZpZXIpO1xuXG4gICAgICAgICAgLy8gSWYgdGhlIGJhc2UgY2xhc3MgaXMgZGVjb3JhdGVkIHRocm91Z2ggbWV0YWRhdGEgZmlsZXMsIHdlIGRvbid0XG4gICAgICAgICAgLy8gbmVlZCB0byBhZGQgYSBjb21tZW50IHRvIHRoZSBkZXJpdmVkIGNsYXNzIGZvciB0aGUgZXh0ZXJuYWwgYmFzZSBjbGFzcy5cbiAgICAgICAgICBpZiAoc3RhdGljU3ltYm9sICYmIHRoaXMubWV0YWRhdGFSZXNvbHZlci5pc0luamVjdGFibGUoc3RhdGljU3ltYm9sKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgdGhlIGJhc2UgY2xhc3MgaXMgbm90IGRlY29yYXRlZCwgd2UgY2Fubm90IGRlY29yYXRlIHRoZSBiYXNlIGNsYXNzIGFuZFxuICAgICAgICAgIC8vIG5lZWQgdG8gYSBjb21tZW50IHRvIHRoZSBsYXN0IGRlY29yYXRlZCBjbGFzcy5cbiAgICAgICAgICByZXR1cm4gdGhpcy5fYWRkTWlzc2luZ0V4cGxpY2l0Q29uc3RydWN0b3JUb2RvKGxhc3REZWNvcmF0ZWRDbGFzcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9hZGRJbmplY3RhYmxlRGVjb3JhdG9yKGJhc2VDbGFzcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgdGhlIFwiQEluamVjdGFibGVcIiBkZWNvcmF0b3IgZm9yIGFsbCBiYXNlIGNsYXNzZXMgaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluXG4gICAgICAvLyB1bnRpbCB0aGUgYmFzZSBjbGFzcyB3aXRoIHRoZSBleHBsaWNpdCBjb25zdHJ1Y3Rvci4gVGhlIGRlY29yYXRvciB3aWxsIGJlIG9ubHlcbiAgICAgIC8vIGFkZGVkIGZvciBiYXNlIGNsYXNzZXMgd2hpY2ggY2FuIGJlIG1vZGlmaWVkLlxuICAgICAgaWYgKCFiYXNlQ2xhc3NGaWxlLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICAgIHRoaXMuX2FkZEluamVjdGFibGVEZWNvcmF0b3IoYmFzZUNsYXNzKTtcbiAgICAgICAgbGFzdERlY29yYXRlZENsYXNzID0gYmFzZUNsYXNzO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBwcml2YXRlIF9taWdyYXRlRGlyZWN0aXZlQmFzZUNsYXNzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIC8vIEluIGNhc2UgdGhlIGRpcmVjdGl2ZSBoYXMgYW4gZXhwbGljaXQgY29uc3RydWN0b3IsIHdlIGRvbid0IG5lZWQgdG8gZG9cbiAgICAvLyBhbnl0aGluZyBiZWNhdXNlIHRoZSBjbGFzcyBpcyBhbHJlYWR5IGRlY29yYXRlZCB3aXRoIFwiQERpcmVjdGl2ZVwiIG9yIFwiQENvbXBvbmVudFwiXG4gICAgaWYgKGhhc0V4cGxpY2l0Q29uc3RydWN0b3Iobm9kZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBvcmRlcmVkQmFzZUNsYXNzZXMgPSBmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIpO1xuICAgIGxldCBsYXN0RGVjb3JhdGVkQ2xhc3M6IHRzLkNsYXNzRGVjbGFyYXRpb24gPSBub2RlO1xuXG4gICAgZm9yIChsZXQge25vZGU6IGJhc2VDbGFzcywgaWRlbnRpZmllcn0gb2Ygb3JkZXJlZEJhc2VDbGFzc2VzKSB7XG4gICAgICBjb25zdCBiYXNlQ2xhc3NGaWxlID0gYmFzZUNsYXNzLmdldFNvdXJjZUZpbGUoKTtcblxuICAgICAgaWYgKGhhc0V4cGxpY2l0Q29uc3RydWN0b3IoYmFzZUNsYXNzKSkge1xuICAgICAgICBpZiAoYmFzZUNsYXNzRmlsZS5pc0RlY2xhcmF0aW9uRmlsZSkge1xuICAgICAgICAgIC8vIElmIHRoZSBiYXNlIGNsYXNzIGlzIGRlY29yYXRlZCB0aHJvdWdoIG1ldGFkYXRhIGZpbGVzLCB3ZSBkb24ndFxuICAgICAgICAgIC8vIG5lZWQgdG8gYWRkIGEgY29tbWVudCB0byB0aGUgZGVyaXZlZCBjbGFzcyBmb3IgdGhlIGV4dGVybmFsIGJhc2UgY2xhc3MuXG4gICAgICAgICAgaWYgKHRoaXMuX2hhc0RpcmVjdGl2ZU1ldGFkYXRhKGlkZW50aWZpZXIpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJZiB0aGUgYmFzZSBjbGFzcyBpcyBub3QgZGVjb3JhdGVkLCB3ZSBjYW5ub3QgZGVjb3JhdGUgdGhlIGJhc2UgY2xhc3MgYW5kXG4gICAgICAgICAgLy8gbmVlZCB0byBhIGNvbW1lbnQgdG8gdGhlIGxhc3QgZGVjb3JhdGVkIGNsYXNzLlxuICAgICAgICAgIHJldHVybiB0aGlzLl9hZGRNaXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvclRvZG8obGFzdERlY29yYXRlZENsYXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2FkZEFic3RyYWN0RGlyZWN0aXZlRGVjb3JhdG9yKGJhc2VDbGFzcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgdGhlIGFic3RyYWN0IGRpcmVjdGl2ZSBkZWNvcmF0b3IgZm9yIGFsbCBiYXNlIGNsYXNzZXMgaW4gdGhlIGluaGVyaXRhbmNlXG4gICAgICAvLyBjaGFpbiB1bnRpbCB0aGUgYmFzZSBjbGFzcyB3aXRoIHRoZSBleHBsaWNpdCBjb25zdHJ1Y3Rvci4gVGhlIGRlY29yYXRvciB3aWxsXG4gICAgICAvLyBiZSBvbmx5IGFkZGVkIGZvciBiYXNlIGNsYXNzZXMgd2hpY2ggY2FuIGJlIG1vZGlmaWVkLlxuICAgICAgaWYgKCFiYXNlQ2xhc3NGaWxlLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICAgIHRoaXMuX2FkZEFic3RyYWN0RGlyZWN0aXZlRGVjb3JhdG9yKGJhc2VDbGFzcyk7XG4gICAgICAgIGxhc3REZWNvcmF0ZWRDbGFzcyA9IGJhc2VDbGFzcztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGFic3RyYWN0IFwiQERpcmVjdGl2ZSgpXCIgZGVjb3JhdG9yIHRvIHRoZSBnaXZlbiBjbGFzcyBpbiBjYXNlIHRoZXJlXG4gICAqIGlzIG5vIGV4aXN0aW5nIGRpcmVjdGl2ZSBkZWNvcmF0b3IuXG4gICAqL1xuICBwcml2YXRlIF9hZGRBYnN0cmFjdERpcmVjdGl2ZURlY29yYXRvcihiYXNlQ2xhc3M6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICBpZiAoaGFzRGlyZWN0aXZlRGVjb3JhdG9yKGJhc2VDbGFzcywgdGhpcy50eXBlQ2hlY2tlcikgfHxcbiAgICAgICAgdGhpcy5kZWNvcmF0ZWREaXJlY3RpdmVzLmhhcyhiYXNlQ2xhc3MpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZUNsYXNzRmlsZSA9IGJhc2VDbGFzcy5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKGJhc2VDbGFzc0ZpbGUpO1xuICAgIGNvbnN0IGRpcmVjdGl2ZUV4cHIgPVxuICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKGJhc2VDbGFzc0ZpbGUsICdEaXJlY3RpdmUnLCAnQGFuZ3VsYXIvY29yZScpO1xuXG4gICAgY29uc3QgbmV3RGVjb3JhdG9yID0gdHMuY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoZGlyZWN0aXZlRXhwciwgdW5kZWZpbmVkLCBbXSkpO1xuICAgIGNvbnN0IG5ld0RlY29yYXRvclRleHQgPVxuICAgICAgICB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdEZWNvcmF0b3IsIGJhc2VDbGFzc0ZpbGUpO1xuXG4gICAgcmVjb3JkZXIuYWRkQ2xhc3NEZWNvcmF0b3IoYmFzZUNsYXNzLCBuZXdEZWNvcmF0b3JUZXh0KTtcbiAgICB0aGlzLmRlY29yYXRlZERpcmVjdGl2ZXMuYWRkKGJhc2VDbGFzcyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgYWJzdHJhY3QgXCJASW5qZWN0YWJsZSgpXCIgZGVjb3JhdG9yIHRvIHRoZSBnaXZlbiBjbGFzcyBpbiBjYXNlIHRoZXJlXG4gICAqIGlzIG5vIGV4aXN0aW5nIGRpcmVjdGl2ZSBkZWNvcmF0b3IuXG4gICAqL1xuICBwcml2YXRlIF9hZGRJbmplY3RhYmxlRGVjb3JhdG9yKGJhc2VDbGFzczogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGlmIChoYXNJbmplY3RhYmxlRGVjb3JhdG9yKGJhc2VDbGFzcywgdGhpcy50eXBlQ2hlY2tlcikgfHxcbiAgICAgICAgdGhpcy5kZWNvcmF0ZWRQcm92aWRlcnMuaGFzKGJhc2VDbGFzcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlQ2xhc3NGaWxlID0gYmFzZUNsYXNzLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIoYmFzZUNsYXNzRmlsZSk7XG4gICAgY29uc3QgaW5qZWN0YWJsZUV4cHIgPVxuICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKGJhc2VDbGFzc0ZpbGUsICdJbmplY3RhYmxlJywgJ0Bhbmd1bGFyL2NvcmUnKTtcblxuICAgIGNvbnN0IG5ld0RlY29yYXRvciA9IHRzLmNyZWF0ZURlY29yYXRvcih0cy5jcmVhdGVDYWxsKGluamVjdGFibGVFeHByLCB1bmRlZmluZWQsIFtdKSk7XG4gICAgY29uc3QgbmV3RGVjb3JhdG9yVGV4dCA9XG4gICAgICAgIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0RlY29yYXRvciwgYmFzZUNsYXNzRmlsZSk7XG5cbiAgICByZWNvcmRlci5hZGRDbGFzc0RlY29yYXRvcihiYXNlQ2xhc3MsIG5ld0RlY29yYXRvclRleHQpO1xuICAgIHRoaXMuZGVjb3JhdGVkUHJvdmlkZXJzLmFkZChiYXNlQ2xhc3MpO1xuICB9XG5cbiAgLyoqIEFkZHMgYSBjb21tZW50IGZvciBhZGRpbmcgYW4gZXhwbGljaXQgY29uc3RydWN0b3IgdG8gdGhlIGdpdmVuIGNsYXNzIGRlY2xhcmF0aW9uLiAqL1xuICBwcml2YXRlIF9hZGRNaXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvclRvZG8obm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IFRyYW5zZm9ybUZhaWx1cmVbXSB7XG4gICAgLy8gSW4gY2FzZSBhIHRvZG8gY29tbWVudCBoYXMgYmVlbiBhbHJlYWR5IGluc2VydGVkIHRvIHRoZSBnaXZlbiBjbGFzcywgd2UgZG9uJ3RcbiAgICAvLyAgd2FudCB0byBhZGQgYSBjb21tZW50IG9yIHRyYW5zZm9ybSBmYWlsdXJlIG11bHRpcGxlIHRpbWVzLlxuICAgIGlmICh0aGlzLm1pc3NpbmdFeHBsaWNpdENvbnN0cnVjdG9yQ2xhc3Nlcy5oYXMobm9kZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdGhpcy5taXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvckNsYXNzZXMuYWRkKG5vZGUpO1xuICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgcmVjb3JkZXIuYWRkQ2xhc3NDb21tZW50KG5vZGUsICdUT0RPOiBhZGQgZXhwbGljaXQgY29uc3RydWN0b3InKTtcbiAgICByZXR1cm4gW3tub2RlOiBub2RlLCBtZXNzYWdlOiAnQ2xhc3MgbmVlZHMgdG8gZGVjbGFyZSBhbiBleHBsaWNpdCBjb25zdHJ1Y3Rvci4nfV07XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgdW5kZWNvcmF0ZWQgZGlyZWN0aXZlcyB3aGljaCB3ZXJlIHJlZmVyZW5jZWQgaW4gTmdNb2R1bGUgZGVjbGFyYXRpb25zLlxuICAgKiBUaGVzZSBkaXJlY3RpdmVzIGluaGVyaXQgdGhlIG1ldGFkYXRhIGZyb20gYSBwYXJlbnQgYmFzZSBjbGFzcywgYnV0IHdpdGggSXZ5XG4gICAqIHRoZXNlIGNsYXNzZXMgbmVlZCB0byBleHBsaWNpdGx5IGhhdmUgYSBkZWNvcmF0b3IgZm9yIGxvY2FsaXR5LiBUaGUgbWlncmF0aW9uXG4gICAqIGRldGVybWluZXMgdGhlIGluaGVyaXRlZCBkZWNvcmF0b3IgYW5kIGNvcGllcyBpdCB0byB0aGUgdW5kZWNvcmF0ZWQgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgbWlncmF0aW9uIHNlcmlhbGl6ZXMgdGhlIG1ldGFkYXRhIGZvciBleHRlcm5hbCBkZWNsYXJhdGlvbnNcbiAgICogd2hlcmUgdGhlIGRlY29yYXRvciBpcyBub3QgcGFydCBvZiB0aGUgc291cmNlIGZpbGUgQVNULlxuICAgKlxuICAgKiBTZWUgY2FzZSAyIGluIHRoZSBtaWdyYXRpb24gcGxhbjogaHR0cHM6Ly9oYWNrbWQuaW8vQGFseC9TMVhLcU1aZVNcbiAgICovXG4gIG1pZ3JhdGVVbmRlY29yYXRlZERlY2xhcmF0aW9ucyhkaXJlY3RpdmVzOiB0cy5DbGFzc0RlY2xhcmF0aW9uW10pOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIHJldHVybiBkaXJlY3RpdmVzLnJlZHVjZShcbiAgICAgICAgKGZhaWx1cmVzLCBub2RlKSA9PiBmYWlsdXJlcy5jb25jYXQodGhpcy5fbWlncmF0ZURlcml2ZWREZWNsYXJhdGlvbihub2RlKSksXG4gICAgICAgIFtdIGFzIFRyYW5zZm9ybUZhaWx1cmVbXSk7XG4gIH1cblxuICBwcml2YXRlIF9taWdyYXRlRGVyaXZlZERlY2xhcmF0aW9uKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIGNvbnN0IHRhcmdldFNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCBvcmRlcmVkQmFzZUNsYXNzZXMgPSBmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIpO1xuICAgIGxldCBuZXdEZWNvcmF0b3JUZXh0OiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCB7bm9kZTogYmFzZUNsYXNzLCBpZGVudGlmaWVyfSBvZiBvcmRlcmVkQmFzZUNsYXNzZXMpIHtcbiAgICAgIC8vIEJlZm9yZSBsb29raW5nIGZvciBkZWNvcmF0b3JzIHdpdGhpbiB0aGUgbWV0YWRhdGEgb3Igc3VtbWFyeSBmaWxlcywgd2VcbiAgICAgIC8vIHRyeSB0byBkZXRlcm1pbmUgdGhlIGRpcmVjdGl2ZSBkZWNvcmF0b3IgdGhyb3VnaCB0aGUgc291cmNlIGZpbGUgQVNULlxuICAgICAgaWYgKGJhc2VDbGFzcy5kZWNvcmF0b3JzKSB7XG4gICAgICAgIGNvbnN0IG5nRGVjb3JhdG9yID1cbiAgICAgICAgICAgIGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIGJhc2VDbGFzcy5kZWNvcmF0b3JzKVxuICAgICAgICAgICAgICAgIC5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdDb21wb25lbnQnIHx8IG5hbWUgPT09ICdEaXJlY3RpdmUnIHx8IG5hbWUgPT09ICdQaXBlJyk7XG5cbiAgICAgICAgaWYgKG5nRGVjb3JhdG9yKSB7XG4gICAgICAgICAgY29uc3QgbmV3RGVjb3JhdG9yID0gdGhpcy5kZWNvcmF0b3JSZXdyaXRlci5yZXdyaXRlKG5nRGVjb3JhdG9yLCBub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgICAgICAgbmV3RGVjb3JhdG9yVGV4dCA9IHRoaXMucHJpbnRlci5wcmludE5vZGUoXG4gICAgICAgICAgICAgIHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdEZWNvcmF0b3IsIG5nRGVjb3JhdG9yLm5vZGUuZ2V0U291cmNlRmlsZSgpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBtZXRhZGF0YSBjb3VsZCBiZSBmb3VuZCB3aXRoaW4gdGhlIHNvdXJjZS1maWxlIEFTVCwgdHJ5IHRvIGZpbmRcbiAgICAgIC8vIGRlY29yYXRvciBkYXRhIHRocm91Z2ggQW5ndWxhciBtZXRhZGF0YSBhbmQgc3VtbWFyeSBmaWxlcy5cbiAgICAgIGNvbnN0IHN0YXRpY1N5bWJvbCA9IHRoaXMuX2dldFN0YXRpY1N5bWJvbE9mSWRlbnRpZmllcihpZGVudGlmaWVyKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIHN0YXRpYyBzeW1ib2wgcmVzb2x2ZXMgdG8gYSBjbGFzcyBkZWNsYXJhdGlvbiB3aXRoXG4gICAgICAvLyBwaXBlIG9yIGRpcmVjdGl2ZSBtZXRhZGF0YS5cbiAgICAgIGlmICghc3RhdGljU3ltYm9sIHx8XG4gICAgICAgICAgISh0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuaXNQaXBlKHN0YXRpY1N5bWJvbCkgfHxcbiAgICAgICAgICAgIHRoaXMubWV0YWRhdGFSZXNvbHZlci5pc0RpcmVjdGl2ZShzdGF0aWNTeW1ib2wpKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9yZXNvbHZlRGVjbGFyYXRpb25NZXRhZGF0YShzdGF0aWNTeW1ib2wpO1xuXG4gICAgICAvLyBJZiBubyBtZXRhZGF0YSBjb3VsZCBiZSByZXNvbHZlZCBmb3IgdGhlIHN0YXRpYyBzeW1ib2wsIHByaW50IGEgZmFpbHVyZSBtZXNzYWdlXG4gICAgICAvLyBhbmQgYXNrIHRoZSBkZXZlbG9wZXIgdG8gbWFudWFsbHkgbWlncmF0ZSB0aGUgY2xhc3MuIFRoaXMgY2FzZSBpcyByYXJlIGJlY2F1c2VcbiAgICAgIC8vIHVzdWFsbHkgZGVjb3JhdG9yIG1ldGFkYXRhIGlzIGFsd2F5cyBwcmVzZW50IGJ1dCBqdXN0IGNhbid0IGJlIHJlYWQgaWYgYSBwcm9ncmFtXG4gICAgICAvLyBvbmx5IGhhcyBhY2Nlc3MgdG8gc3VtbWFyaWVzICh0aGlzIGlzIGEgc3BlY2lhbCBjYXNlIGluIGdvb2dsZTMpLlxuICAgICAgaWYgKCFtZXRhZGF0YSkge1xuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG1lc3NhZ2U6IGBDbGFzcyBjYW5ub3QgYmUgbWlncmF0ZWQgYXMgdGhlIGluaGVyaXRlZCBtZXRhZGF0YSBmcm9tIGAgK1xuICAgICAgICAgICAgICBgJHtpZGVudGlmaWVyLmdldFRleHQoKX0gY2Fubm90IGJlIGNvbnZlcnRlZCBpbnRvIGEgZGVjb3JhdG9yLiBQbGVhc2UgbWFudWFsbHkgXG4gICAgICAgICAgICBkZWNvcmF0ZSB0aGUgY2xhc3MuYCxcbiAgICAgICAgfV07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld0RlY29yYXRvciA9IHRoaXMuX2NvbnN0cnVjdERlY29yYXRvckZyb21NZXRhZGF0YShtZXRhZGF0YSwgdGFyZ2V0U291cmNlRmlsZSk7XG4gICAgICBpZiAoIW5ld0RlY29yYXRvcikge1xuICAgICAgICBjb25zdCBhbm5vdGF0aW9uVHlwZSA9IG1ldGFkYXRhLnR5cGU7XG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogYENsYXNzIGNhbm5vdCBiZSBtaWdyYXRlZCBhcyB0aGUgaW5oZXJpdGVkIEAke2Fubm90YXRpb25UeXBlfSBkZWNvcmF0b3IgYCArXG4gICAgICAgICAgICAgIGBjYW5ub3QgYmUgY29waWVkLiBQbGVhc2UgbWFudWFsbHkgYWRkIGEgQCR7YW5ub3RhdGlvblR5cGV9IGRlY29yYXRvci5gLFxuICAgICAgICB9XTtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gY2FzZSB0aGUgZGVjb3JhdG9yIGNvdWxkIGJlIGNvbnN0cnVjdGVkIGZyb20gdGhlIHJlc29sdmVkIG1ldGFkYXRhLCB1c2VcbiAgICAgIC8vIHRoYXQgZGVjb3JhdG9yIGZvciB0aGUgZGVyaXZlZCB1bmRlY29yYXRlZCBjbGFzc2VzLlxuICAgICAgbmV3RGVjb3JhdG9yVGV4dCA9XG4gICAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yLCB0YXJnZXRTb3VyY2VGaWxlKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmICghbmV3RGVjb3JhdG9yVGV4dCkge1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgIG5vZGUsXG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAnQ2xhc3MgY2Fubm90IGJlIG1pZ3JhdGVkIGFzIG5vIGRpcmVjdGl2ZS9jb21wb25lbnQvcGlwZSBtZXRhZGF0YSBjb3VsZCBiZSBmb3VuZC4gJyArXG4gICAgICAgICAgICAnUGxlYXNlIG1hbnVhbGx5IGFkZCBhIEBEaXJlY3RpdmUsIEBDb21wb25lbnQgb3IgQFBpcGUgZGVjb3JhdG9yLidcbiAgICAgIH1dO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIodGFyZ2V0U291cmNlRmlsZSkuYWRkQ2xhc3NEZWNvcmF0b3Iobm9kZSwgbmV3RGVjb3JhdG9yVGV4dCk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLyoqIFJlY29yZHMgYWxsIGNoYW5nZXMgdGhhdCB3ZXJlIG1hZGUgaW4gdGhlIGltcG9ydCBtYW5hZ2VyLiAqL1xuICByZWNvcmRDaGFuZ2VzKCkgeyB0aGlzLmltcG9ydE1hbmFnZXIucmVjb3JkQ2hhbmdlcygpOyB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgYSBUeXBlU2NyaXB0IGRlY29yYXRvciBub2RlIGZyb20gdGhlIHNwZWNpZmllZCBkZWNsYXJhdGlvbiBtZXRhZGF0YS4gUmV0dXJuc1xuICAgKiBudWxsIGlmIHRoZSBtZXRhZGF0YSBjb3VsZCBub3QgYmUgc2ltcGxpZmllZC9yZXNvbHZlZC5cbiAgICovXG4gIHByaXZhdGUgX2NvbnN0cnVjdERlY29yYXRvckZyb21NZXRhZGF0YShcbiAgICAgIGRpcmVjdGl2ZU1ldGFkYXRhOiBEZWNsYXJhdGlvbk1ldGFkYXRhLCB0YXJnZXRTb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuRGVjb3JhdG9yfG51bGwge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkZWNvcmF0b3JFeHByID0gY29udmVydERpcmVjdGl2ZU1ldGFkYXRhVG9FeHByZXNzaW9uKFxuICAgICAgICAgIGRpcmVjdGl2ZU1ldGFkYXRhLm1ldGFkYXRhLFxuICAgICAgICAgIHN0YXRpY1N5bWJvbCA9PlxuICAgICAgICAgICAgICB0aGlzLmNvbXBpbGVySG9zdFxuICAgICAgICAgICAgICAgICAgLmZpbGVOYW1lVG9Nb2R1bGVOYW1lKHN0YXRpY1N5bWJvbC5maWxlUGF0aCwgdGFyZ2V0U291cmNlRmlsZS5maWxlTmFtZSlcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXC9pbmRleCQvLCAnJyksXG4gICAgICAgICAgKG1vZHVsZU5hbWU6IHN0cmluZywgbmFtZTogc3RyaW5nKSA9PlxuICAgICAgICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKHRhcmdldFNvdXJjZUZpbGUsIG5hbWUsIG1vZHVsZU5hbWUpLFxuICAgICAgICAgIChwcm9wZXJ0eU5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAvLyBPbmx5IG5vcm1hbGl6ZSBwcm9wZXJ0aWVzIGNhbGxlZCBcImNoYW5nZURldGVjdGlvblwiIGFuZCBcImVuY2Fwc3VsYXRpb25cIlxuICAgICAgICAgICAgLy8gZm9yIFwiQERpcmVjdGl2ZVwiIGFuZCBcIkBDb21wb25lbnRcIiBhbm5vdGF0aW9ucy5cbiAgICAgICAgICAgIGlmIChkaXJlY3RpdmVNZXRhZGF0YS50eXBlID09PSAnUGlwZScpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluc3RlYWQgb2YgdXNpbmcgdGhlIG51bWJlciBhcyB2YWx1ZSBmb3IgdGhlIFwiY2hhbmdlRGV0ZWN0aW9uXCIgYW5kXG4gICAgICAgICAgICAvLyBcImVuY2Fwc3VsYXRpb25cIiBwcm9wZXJ0aWVzLCB3ZSB3YW50IHRvIHVzZSB0aGUgYWN0dWFsIGVudW0gc3ltYm9scy5cbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eU5hbWUgPT09ICdjaGFuZ2VEZXRlY3Rpb24nICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKFxuICAgICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShcbiAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRTb3VyY2VGaWxlLCAnQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3knLCAnQGFuZ3VsYXIvY29yZScpLFxuICAgICAgICAgICAgICAgICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lbdmFsdWVdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlOYW1lID09PSAnZW5jYXBzdWxhdGlvbicgJiYgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICByZXR1cm4gdHMuY3JlYXRlUHJvcGVydHlBY2Nlc3MoXG4gICAgICAgICAgICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKFxuICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFNvdXJjZUZpbGUsICdWaWV3RW5jYXBzdWxhdGlvbicsICdAYW5ndWxhci9jb3JlJyksXG4gICAgICAgICAgICAgICAgICBWaWV3RW5jYXBzdWxhdGlvblt2YWx1ZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cy5jcmVhdGVEZWNvcmF0b3IodHMuY3JlYXRlQ2FsbChcbiAgICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKFxuICAgICAgICAgICAgICB0YXJnZXRTb3VyY2VGaWxlLCBkaXJlY3RpdmVNZXRhZGF0YS50eXBlLCAnQGFuZ3VsYXIvY29yZScpLFxuICAgICAgICAgIHVuZGVmaW5lZCwgW2RlY29yYXRvckV4cHJdKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBVbmV4cGVjdGVkTWV0YWRhdGFWYWx1ZUVycm9yKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgZ2l2ZW4gaWRlbnRpZmllciByZXNvbHZlcyB0byBhIGNsYXNzIGRlY2xhcmF0aW9uIHRoYXRcbiAgICogaGFzIG1ldGFkYXRhIGZvciBhIGRpcmVjdGl2ZS5cbiAgICovXG4gIHByaXZhdGUgX2hhc0RpcmVjdGl2ZU1ldGFkYXRhKG5vZGU6IHRzLklkZW50aWZpZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLl9nZXRTdGF0aWNTeW1ib2xPZklkZW50aWZpZXIobm9kZSk7XG5cbiAgICBpZiAoIXN5bWJvbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuaXNEaXJlY3RpdmUoc3ltYm9sKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyB0aGUgZGVjbGFyYXRpb24gbWV0YWRhdGEgb2YgYSBnaXZlbiBzdGF0aWMgc3ltYm9sLiBUaGUgbWV0YWRhdGFcbiAgICogaXMgZGV0ZXJtaW5lZCBieSByZXNvbHZpbmcgbWV0YWRhdGEgZm9yIHRoZSBzdGF0aWMgc3ltYm9sLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzb2x2ZURlY2xhcmF0aW9uTWV0YWRhdGEoc3ltYm9sOiBTdGF0aWNTeW1ib2wpOiBudWxsfERlY2xhcmF0aW9uTWV0YWRhdGEge1xuICAgIHRyeSB7XG4gICAgICAvLyBOb3RlIHRoYXQgdGhpcyBjYWxsIGNhbiB0aHJvdyBpZiB0aGUgbWV0YWRhdGEgaXMgbm90IGNvbXB1dGFibGUuIEluIHRoYXRcbiAgICAgIC8vIGNhc2Ugd2UgYXJlIG5vdCBhYmxlIHRvIHNlcmlhbGl6ZSB0aGUgbWV0YWRhdGEgaW50byBhIGRlY29yYXRvciBhbmQgd2UgcmV0dXJuXG4gICAgICAvLyBudWxsLlxuICAgICAgY29uc3QgYW5ub3RhdGlvbnMgPSB0aGlzLmNvbXBpbGVyLnJlZmxlY3Rvci5hbm5vdGF0aW9ucyhzeW1ib2wpLmZpbmQoXG4gICAgICAgICAgcyA9PiBzLm5nTWV0YWRhdGFOYW1lID09PSAnQ29tcG9uZW50JyB8fCBzLm5nTWV0YWRhdGFOYW1lID09PSAnRGlyZWN0aXZlJyB8fFxuICAgICAgICAgICAgICBzLm5nTWV0YWRhdGFOYW1lID09PSAnUGlwZScpO1xuXG4gICAgICBpZiAoIWFubm90YXRpb25zKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7bmdNZXRhZGF0YU5hbWUsIC4uLm1ldGFkYXRhfSA9IGFubm90YXRpb25zO1xuXG4gICAgICAvLyBEZWxldGUgdGhlIFwibmdNZXRhZGF0YU5hbWVcIiBwcm9wZXJ0eSBhcyB3ZSBkb24ndCB3YW50IHRvIGdlbmVyYXRlXG4gICAgICAvLyBhIHByb3BlcnR5IGFzc2lnbm1lbnQgaW4gdGhlIG5ldyBkZWNvcmF0b3IgZm9yIHRoYXQgaW50ZXJuYWwgcHJvcGVydHkuXG4gICAgICBkZWxldGUgbWV0YWRhdGFbJ25nTWV0YWRhdGFOYW1lJ107XG5cbiAgICAgIHJldHVybiB7dHlwZTogbmdNZXRhZGF0YU5hbWUsIG1ldGFkYXRhfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRTdGF0aWNTeW1ib2xPZklkZW50aWZpZXIobm9kZTogdHMuSWRlbnRpZmllcik6IFN0YXRpY1N5bWJvbHxudWxsIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgcmVzb2x2ZWRJbXBvcnQgPSBnZXRJbXBvcnRPZklkZW50aWZpZXIodGhpcy50eXBlQ2hlY2tlciwgbm9kZSk7XG5cbiAgICBpZiAoIXJlc29sdmVkSW1wb3J0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVOYW1lID1cbiAgICAgICAgdGhpcy5jb21waWxlckhvc3QubW9kdWxlTmFtZVRvRmlsZU5hbWUocmVzb2x2ZWRJbXBvcnQuaW1wb3J0TW9kdWxlLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcblxuICAgIGlmICghbW9kdWxlTmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gRmluZCB0aGUgZGVjbGFyYXRpb24gc3ltYm9sIGFzIHN5bWJvbHMgY291bGQgYmUgYWxpYXNlZCBkdWUgdG9cbiAgICAvLyBtZXRhZGF0YSByZS1leHBvcnRzLlxuICAgIHJldHVybiB0aGlzLmNvbXBpbGVyLnJlZmxlY3Rvci5maW5kU3ltYm9sRGVjbGFyYXRpb24oXG4gICAgICAgIHRoaXMuc3ltYm9sUmVzb2x2ZXIuZ2V0U3RhdGljU3ltYm9sKG1vZHVsZU5hbWUsIHJlc29sdmVkSW1wb3J0Lm5hbWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlcyB0aGF0IHN0YXRpYyBzeW1ib2xzIGFyZSByZXNvbHZlZCB0aHJvdWdoIHN1bW1hcmllcy4gU3VtbWFyaWVzXG4gICAqIGNhbm5vdCBiZSB1c2VkIGZvciBkZWNvcmF0b3IgYW5hbHlzaXMgYXMgZGVjb3JhdG9ycyBhcmUgb21pdHRlZCBpbiBzdW1tYXJpZXMuXG4gICAqL1xuICBwcml2YXRlIF9kaXNhYmxlU3VtbWFyeVJlc29sdXRpb24oKSB7XG4gICAgLy8gV2UgbmV2ZXIgd2FudCB0byByZXNvbHZlIHN5bWJvbHMgdGhyb3VnaCBzdW1tYXJpZXMuIFN1bW1hcmllcyBuZXZlciBjb250YWluXG4gICAgLy8gZGVjb3JhdG9ycyBmb3IgY2xhc3Mgc3ltYm9scyBhbmQgdGhlcmVmb3JlIHN1bW1hcmllcyB3aWxsIGNhdXNlIGV2ZXJ5IGNsYXNzXG4gICAgLy8gdG8gYmUgY29uc2lkZXJlZCBhcyB1bmRlY29yYXRlZC4gU2VlIHJlYXNvbiBmb3IgdGhpcyBpbjogXCJUb0pzb25TZXJpYWxpemVyXCIuXG4gICAgLy8gSW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgbWV0YWRhdGEgaXMgbm90IHJldHJpZXZlZCB0aHJvdWdoIHN1bW1hcmllcywgd2VcbiAgICAvLyBuZWVkIHRvIGRpc2FibGUgc3VtbWFyeSByZXNvbHV0aW9uLCBjbGVhciBwcmV2aW91cyBzeW1ib2wgY2FjaGVzLiBUaGlzIHdheVxuICAgIC8vIGZ1dHVyZSBjYWxscyB0byBcIlN0YXRpY1JlZmxlY3RvciNhbm5vdGF0aW9uc1wiIGFyZSBiYXNlZCBvbiBtZXRhZGF0YSBmaWxlcy5cbiAgICB0aGlzLnN5bWJvbFJlc29sdmVyWydfcmVzb2x2ZVN5bWJvbEZyb21TdW1tYXJ5J10gPSAoKSA9PiBudWxsO1xuICAgIHRoaXMuc3ltYm9sUmVzb2x2ZXJbJ3Jlc29sdmVkU3ltYm9scyddLmNsZWFyKCk7XG4gICAgdGhpcy5zeW1ib2xSZXNvbHZlclsncmVzb2x2ZWRGaWxlUGF0aHMnXS5jbGVhcigpO1xuICAgIHRoaXMuY29tcGlsZXIucmVmbGVjdG9yWydhbm5vdGF0aW9uQ2FjaGUnXS5jbGVhcigpO1xuXG4gICAgLy8gT3JpZ2luYWwgc3VtbWFyeSByZXNvbHZlciB1c2VkIGJ5IHRoZSBBT1QgY29tcGlsZXIuXG4gICAgY29uc3Qgc3VtbWFyeVJlc29sdmVyID0gdGhpcy5zeW1ib2xSZXNvbHZlclsnc3VtbWFyeVJlc29sdmVyJ107XG5cbiAgICAvLyBBZGRpdGlvbmFsbHkgd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBubyBmaWxlcyBhcmUgdHJlYXRlZCBhcyBcImxpYnJhcnlcIiBmaWxlcyB3aGVuXG4gICAgLy8gcmVzb2x2aW5nIG1ldGFkYXRhLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGJ5IGRlZmF1bHQgdGhlIHN5bWJvbCByZXNvbHZlciBkaXNjYXJkc1xuICAgIC8vIGNsYXNzIG1ldGFkYXRhIGZvciBsaWJyYXJ5IGZpbGVzLiBTZWUgXCJTdGF0aWNTeW1ib2xSZXNvbHZlciNjcmVhdGVSZXNvbHZlZFN5bWJvbFwiLlxuICAgIC8vIFBhdGNoaW5nIHRoaXMgZnVuY3Rpb24gKipvbmx5KiogZm9yIHRoZSBzdGF0aWMgc3ltYm9sIHJlc29sdmVyIGVuc3VyZXMgdGhhdCBtZXRhZGF0YVxuICAgIC8vIGlzIG5vdCBpbmNvcnJlY3RseSBvbWl0dGVkLiBOb3RlIHRoYXQgd2Ugb25seSB3YW50IHRvIGRvIHRoaXMgZm9yIHRoZSBzeW1ib2wgcmVzb2x2ZXJcbiAgICAvLyBiZWNhdXNlIG90aGVyd2lzZSB3ZSBjb3VsZCBicmVhayB0aGUgc3VtbWFyeSBsb2FkaW5nIGxvZ2ljIHdoaWNoIGlzIHVzZWQgdG8gZGV0ZWN0XG4gICAgLy8gaWYgYSBzdGF0aWMgc3ltYm9sIGlzIGVpdGhlciBhIGRpcmVjdGl2ZSwgY29tcG9uZW50IG9yIHBpcGUgKHNlZSBNZXRhZGF0YVJlc29sdmVyKS5cbiAgICB0aGlzLnN5bWJvbFJlc29sdmVyWydzdW1tYXJ5UmVzb2x2ZXInXSA9IDxTdW1tYXJ5UmVzb2x2ZXI8U3RhdGljU3ltYm9sPj57XG4gICAgICBmcm9tU3VtbWFyeUZpbGVOYW1lOiBzdW1tYXJ5UmVzb2x2ZXIuZnJvbVN1bW1hcnlGaWxlTmFtZS5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICBhZGRTdW1tYXJ5OiBzdW1tYXJ5UmVzb2x2ZXIuYWRkU3VtbWFyeS5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICBnZXRJbXBvcnRBczogc3VtbWFyeVJlc29sdmVyLmdldEltcG9ydEFzLmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIGdldEtub3duTW9kdWxlTmFtZTogc3VtbWFyeVJlc29sdmVyLmdldEtub3duTW9kdWxlTmFtZS5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICByZXNvbHZlU3VtbWFyeTogc3VtbWFyeVJlc29sdmVyLnJlc29sdmVTdW1tYXJ5LmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIHRvU3VtbWFyeUZpbGVOYW1lOiBzdW1tYXJ5UmVzb2x2ZXIudG9TdW1tYXJ5RmlsZU5hbWUuYmluZChzdW1tYXJ5UmVzb2x2ZXIpLFxuICAgICAgZ2V0U3ltYm9sc09mOiBzdW1tYXJ5UmVzb2x2ZXIuZ2V0U3ltYm9sc09mLmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIGlzTGlicmFyeUZpbGU6ICgpID0+IGZhbHNlLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==