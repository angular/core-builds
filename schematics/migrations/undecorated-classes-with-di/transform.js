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
            return this._migrateDecoratedClassWithInheritedCtor(node, symbol => this.metadataResolver.isInjectable(symbol), node => this._addInjectableDecorator(node));
        }
        _migrateDirectiveBaseClass(node) {
            return this._migrateDecoratedClassWithInheritedCtor(node, symbol => this.metadataResolver.isDirective(symbol), node => this._addAbstractDirectiveDecorator(node));
        }
        _migrateDecoratedClassWithInheritedCtor(node, isClassDecorated, addClassDecorator) {
            // In case the provider has an explicit constructor, we don't need to do anything
            // because the class is already decorated and does not inherit a constructor.
            if (class_declaration_1.hasExplicitConstructor(node)) {
                return [];
            }
            const orderedBaseClasses = find_base_classes_1.findBaseClassDeclarations(node, this.typeChecker);
            const undecoratedBaseClasses = [];
            for (let { node: baseClass, identifier } of orderedBaseClasses) {
                const baseClassFile = baseClass.getSourceFile();
                if (class_declaration_1.hasExplicitConstructor(baseClass)) {
                    // All classes in between the decorated class and the undecorated class
                    // that defines the constructor need to be decorated as well.
                    undecoratedBaseClasses.forEach(b => addClassDecorator(b));
                    if (baseClassFile.isDeclarationFile) {
                        const staticSymbol = this._getStaticSymbolOfIdentifier(identifier);
                        // If the base class is decorated through metadata files, we don't
                        // need to add a comment to the derived class for the external base class.
                        if (staticSymbol && isClassDecorated(staticSymbol)) {
                            break;
                        }
                        // Find the last class in the inheritance chain that is decorated and will be
                        // used as anchor for a comment explaining that the class that defines the
                        // constructor cannot be decorated automatically.
                        const lastDecoratedClass = undecoratedBaseClasses[undecoratedBaseClasses.length - 1] || node;
                        return this._addMissingExplicitConstructorTodo(lastDecoratedClass);
                    }
                    // Decorate the class that defines the constructor that is inherited.
                    addClassDecorator(baseClass);
                    break;
                }
                // Add the class decorator for all base classes in the inheritance chain until
                // the base class with the explicit constructor. The decorator will be only
                // added for base classes which can be modified.
                if (!baseClassFile.isDeclarationFile) {
                    undecoratedBaseClasses.push(baseClass);
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
            // want to add a comment or transform failure multiple times.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSUgsd0NBQXlFO0lBQ3pFLGlDQUFpQztJQUVqQyxnRkFBK0Q7SUFDL0QsbUdBQWdGO0lBQ2hGLCtFQUFxRTtJQUVyRSw2SkFBa0k7SUFDbEksNklBQXlFO0lBQ3pFLHlIQUE4RDtJQUM5RCxtSEFBK0M7SUFDL0MsdUlBQXlGO0lBZ0J6RixNQUFhLDJCQUEyQjtRQW9CdEMsWUFDWSxXQUEyQixFQUFVLFFBQXFCLEVBQzFELFNBQTJCLEVBQzNCLGlCQUF3RDtZQUZ4RCxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQzFELGNBQVMsR0FBVCxTQUFTLENBQWtCO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUM7WUF0QjVELFlBQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztZQUMvRCxrQkFBYSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hFLHNCQUFpQixHQUNyQixJQUFJLHNDQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQU0vRiw2RUFBNkU7WUFDckUsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFDN0QsNkVBQTZFO1lB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LGVBQWUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFL0QsbUZBQW1GO1lBQ25GLHdGQUF3RjtZQUN4RixxRkFBcUY7WUFDckYsdUZBQXVGO1lBQ3ZGLHdGQUF3RjtZQUN4RixxRkFBcUY7WUFDckYsc0ZBQXNGO1lBQ3RGLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsR0FBa0M7Z0JBQ3RFLG1CQUFtQixFQUFFLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM5RSxVQUFVLEVBQUUsZUFBZSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM1RCxXQUFXLEVBQUUsZUFBZSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM5RCxrQkFBa0IsRUFBRSxlQUFlLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDNUUsY0FBYyxFQUFFLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDcEUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQzFFLFlBQVksRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQ2hFLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLO2FBQzNCLENBQUM7UUFDSixDQUFDO0tBQ0Y7SUFwYUQsa0VBb2FDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FvdENvbXBpbGVyLCBBb3RDb21waWxlckhvc3QsIENvbXBpbGVNZXRhZGF0YVJlc29sdmVyLCBTdGF0aWNTeW1ib2wsIFN0YXRpY1N5bWJvbFJlc29sdmVyLCBTdW1tYXJ5UmVzb2x2ZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7UGFydGlhbEV2YWx1YXRvcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9wYXJ0aWFsX2V2YWx1YXRvcic7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge2hhc0V4cGxpY2l0Q29uc3RydWN0b3J9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY2xhc3NfZGVjbGFyYXRpb24nO1xuaW1wb3J0IHtnZXRJbXBvcnRPZklkZW50aWZpZXJ9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5cbmltcG9ydCB7VW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvciwgY29udmVydERpcmVjdGl2ZU1ldGFkYXRhVG9FeHByZXNzaW9ufSBmcm9tICcuL2RlY29yYXRvcl9yZXdyaXRlL2NvbnZlcnRfZGlyZWN0aXZlX21ldGFkYXRhJztcbmltcG9ydCB7RGVjb3JhdG9yUmV3cml0ZXJ9IGZyb20gJy4vZGVjb3JhdG9yX3Jld3JpdGUvZGVjb3JhdG9yX3Jld3JpdGVyJztcbmltcG9ydCB7ZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9uc30gZnJvbSAnLi9maW5kX2Jhc2VfY2xhc3Nlcyc7XG5pbXBvcnQge0ltcG9ydE1hbmFnZXJ9IGZyb20gJy4vaW1wb3J0X21hbmFnZXInO1xuaW1wb3J0IHtoYXNEaXJlY3RpdmVEZWNvcmF0b3IsIGhhc0luamVjdGFibGVEZWNvcmF0b3J9IGZyb20gJy4vbmdfZGVjbGFyYXRpb25fY29sbGVjdG9yJztcbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuXG5cbi8qKiBSZXNvbHZlZCBtZXRhZGF0YSBvZiBhIGRlY2xhcmF0aW9uLiAqL1xuaW50ZXJmYWNlIERlY2xhcmF0aW9uTWV0YWRhdGEge1xuICBtZXRhZGF0YTogYW55O1xuICB0eXBlOiAnQ29tcG9uZW50J3wnRGlyZWN0aXZlJ3wnUGlwZSc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNmb3JtRmFpbHVyZSB7XG4gIG5vZGU6IHRzLk5vZGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFVuZGVjb3JhdGVkQ2xhc3Nlc1RyYW5zZm9ybSB7XG4gIHByaXZhdGUgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoe25ld0xpbmU6IHRzLk5ld0xpbmVLaW5kLkxpbmVGZWVkfSk7XG4gIHByaXZhdGUgaW1wb3J0TWFuYWdlciA9IG5ldyBJbXBvcnRNYW5hZ2VyKHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIsIHRoaXMucHJpbnRlcik7XG4gIHByaXZhdGUgZGVjb3JhdG9yUmV3cml0ZXIgPVxuICAgICAgbmV3IERlY29yYXRvclJld3JpdGVyKHRoaXMuaW1wb3J0TWFuYWdlciwgdGhpcy50eXBlQ2hlY2tlciwgdGhpcy5ldmFsdWF0b3IsIHRoaXMuY29tcGlsZXIpO1xuXG4gIHByaXZhdGUgY29tcGlsZXJIb3N0OiBBb3RDb21waWxlckhvc3Q7XG4gIHByaXZhdGUgc3ltYm9sUmVzb2x2ZXI6IFN0YXRpY1N5bWJvbFJlc29sdmVyO1xuICBwcml2YXRlIG1ldGFkYXRhUmVzb2x2ZXI6IENvbXBpbGVNZXRhZGF0YVJlc29sdmVyO1xuXG4gIC8qKiBTZXQgb2YgY2xhc3MgZGVjbGFyYXRpb25zIHdoaWNoIGhhdmUgYmVlbiBkZWNvcmF0ZWQgd2l0aCBcIkBEaXJlY3RpdmVcIi4gKi9cbiAgcHJpdmF0ZSBkZWNvcmF0ZWREaXJlY3RpdmVzID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuICAvKiogU2V0IG9mIGNsYXNzIGRlY2xhcmF0aW9ucyB3aGljaCBoYXZlIGJlZW4gZGVjb3JhdGVkIHdpdGggXCJASW5qZWN0YWJsZVwiICovXG4gIHByaXZhdGUgZGVjb3JhdGVkUHJvdmlkZXJzID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuICAvKipcbiAgICogU2V0IG9mIGNsYXNzIGRlY2xhcmF0aW9ucyB3aGljaCBoYXZlIGJlZW4gYW5hbHl6ZWQgYW5kIG5lZWQgdG8gc3BlY2lmeVxuICAgKiBhbiBleHBsaWNpdCBjb25zdHJ1Y3Rvci5cbiAgICovXG4gIHByaXZhdGUgbWlzc2luZ0V4cGxpY2l0Q29uc3RydWN0b3JDbGFzc2VzID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIHByaXZhdGUgY29tcGlsZXI6IEFvdENvbXBpbGVyLFxuICAgICAgcHJpdmF0ZSBldmFsdWF0b3I6IFBhcnRpYWxFdmFsdWF0b3IsXG4gICAgICBwcml2YXRlIGdldFVwZGF0ZVJlY29yZGVyOiAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IFVwZGF0ZVJlY29yZGVyKSB7XG4gICAgdGhpcy5zeW1ib2xSZXNvbHZlciA9IGNvbXBpbGVyWydfc3ltYm9sUmVzb2x2ZXInXTtcbiAgICB0aGlzLmNvbXBpbGVySG9zdCA9IGNvbXBpbGVyWydfaG9zdCddO1xuICAgIHRoaXMubWV0YWRhdGFSZXNvbHZlciA9IGNvbXBpbGVyWydfbWV0YWRhdGFSZXNvbHZlciddO1xuXG4gICAgLy8gVW5zZXQgdGhlIGRlZmF1bHQgZXJyb3IgcmVjb3JkZXIgc28gdGhhdCB0aGUgcmVmbGVjdG9yIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uXG4gICAgLy8gaWYgbWV0YWRhdGEgY2Fubm90IGJlIHJlc29sdmVkLlxuICAgIHRoaXMuY29tcGlsZXIucmVmbGVjdG9yWydlcnJvclJlY29yZGVyJ10gPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBEaXNhYmxlcyB0aGF0IHN0YXRpYyBzeW1ib2xzIGFyZSByZXNvbHZlZCB0aHJvdWdoIHN1bW1hcmllcyBmcm9tIHdpdGhpbiB0aGUgc3RhdGljXG4gICAgLy8gcmVmbGVjdG9yLiBTdW1tYXJpZXMgY2Fubm90IGJlIHVzZWQgZm9yIGRlY29yYXRvciBzZXJpYWxpemF0aW9uIGFzIGRlY29yYXRvcnMgYXJlXG4gICAgLy8gb21pdHRlZCBpbiBzdW1tYXJpZXMgYW5kIHRoZSBkZWNvcmF0b3IgY2FuJ3QgYmUgcmVjb25zdHJ1Y3RlZCBmcm9tIHRoZSBkaXJlY3RpdmUgc3VtbWFyeS5cbiAgICB0aGlzLl9kaXNhYmxlU3VtbWFyeVJlc29sdXRpb24oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyBkZWNvcmF0ZWQgZGlyZWN0aXZlcyB3aGljaCBjYW4gcG90ZW50aWFsbHkgaW5oZXJpdCBhIGNvbnN0cnVjdG9yXG4gICAqIGZyb20gYW4gdW5kZWNvcmF0ZWQgYmFzZSBjbGFzcy4gQWxsIGJhc2UgY2xhc3NlcyB1bnRpbCB0aGUgZmlyc3Qgb25lXG4gICAqIHdpdGggYW4gZXhwbGljaXQgY29uc3RydWN0b3Igd2lsbCBiZSBkZWNvcmF0ZWQgd2l0aCB0aGUgYWJzdHJhY3QgXCJARGlyZWN0aXZlKClcIlxuICAgKiBkZWNvcmF0b3IuIFNlZSBjYXNlIDEgaW4gdGhlIG1pZ3JhdGlvbiBwbGFuOiBodHRwczovL2hhY2ttZC5pby9AYWx4L1MxWEtxTVplU1xuICAgKi9cbiAgbWlncmF0ZURlY29yYXRlZERpcmVjdGl2ZXMoZGlyZWN0aXZlczogdHMuQ2xhc3NEZWNsYXJhdGlvbltdKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMuX21pZ3JhdGVEaXJlY3RpdmVCYXNlQ2xhc3Mobm9kZSkpLFxuICAgICAgICBbXSBhcyBUcmFuc2Zvcm1GYWlsdXJlW10pO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGRlY29yYXRlZCBwcm92aWRlcnMgd2hpY2ggY2FuIHBvdGVudGlhbGx5IGluaGVyaXQgYSBjb25zdHJ1Y3RvclxuICAgKiBmcm9tIGFuIHVuZGVjb3JhdGVkIGJhc2UgY2xhc3MuIEFsbCBiYXNlIGNsYXNzZXMgdW50aWwgdGhlIGZpcnN0IG9uZVxuICAgKiB3aXRoIGFuIGV4cGxpY2l0IGNvbnN0cnVjdG9yIHdpbGwgYmUgZGVjb3JhdGVkIHdpdGggdGhlIFwiQEluamVjdGFibGUoKVwiLlxuICAgKi9cbiAgbWlncmF0ZURlY29yYXRlZFByb3ZpZGVycyhwcm92aWRlcnM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXSk6IFRyYW5zZm9ybUZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIHByb3ZpZGVycy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMuX21pZ3JhdGVQcm92aWRlckJhc2VDbGFzcyhub2RlKSksXG4gICAgICAgIFtdIGFzIFRyYW5zZm9ybUZhaWx1cmVbXSk7XG4gIH1cblxuICBwcml2YXRlIF9taWdyYXRlUHJvdmlkZXJCYXNlQ2xhc3Mobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IFRyYW5zZm9ybUZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIHRoaXMuX21pZ3JhdGVEZWNvcmF0ZWRDbGFzc1dpdGhJbmhlcml0ZWRDdG9yKFxuICAgICAgICBub2RlLCBzeW1ib2wgPT4gdGhpcy5tZXRhZGF0YVJlc29sdmVyLmlzSW5qZWN0YWJsZShzeW1ib2wpLFxuICAgICAgICBub2RlID0+IHRoaXMuX2FkZEluamVjdGFibGVEZWNvcmF0b3Iobm9kZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbWlncmF0ZURpcmVjdGl2ZUJhc2VDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gdGhpcy5fbWlncmF0ZURlY29yYXRlZENsYXNzV2l0aEluaGVyaXRlZEN0b3IoXG4gICAgICAgIG5vZGUsIHN5bWJvbCA9PiB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuaXNEaXJlY3RpdmUoc3ltYm9sKSxcbiAgICAgICAgbm9kZSA9PiB0aGlzLl9hZGRBYnN0cmFjdERpcmVjdGl2ZURlY29yYXRvcihub2RlKSk7XG4gIH1cblxuXG4gIHByaXZhdGUgX21pZ3JhdGVEZWNvcmF0ZWRDbGFzc1dpdGhJbmhlcml0ZWRDdG9yKFxuICAgICAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgaXNDbGFzc0RlY29yYXRlZDogKHN5bWJvbDogU3RhdGljU3ltYm9sKSA9PiBib29sZWFuLFxuICAgICAgYWRkQ2xhc3NEZWNvcmF0b3I6IChub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSA9PiB2b2lkKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICAvLyBJbiBjYXNlIHRoZSBwcm92aWRlciBoYXMgYW4gZXhwbGljaXQgY29uc3RydWN0b3IsIHdlIGRvbid0IG5lZWQgdG8gZG8gYW55dGhpbmdcbiAgICAvLyBiZWNhdXNlIHRoZSBjbGFzcyBpcyBhbHJlYWR5IGRlY29yYXRlZCBhbmQgZG9lcyBub3QgaW5oZXJpdCBhIGNvbnN0cnVjdG9yLlxuICAgIGlmIChoYXNFeHBsaWNpdENvbnN0cnVjdG9yKG5vZGUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXJlZEJhc2VDbGFzc2VzID0gZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9ucyhub2RlLCB0aGlzLnR5cGVDaGVja2VyKTtcbiAgICBjb25zdCB1bmRlY29yYXRlZEJhc2VDbGFzc2VzOiB0cy5DbGFzc0RlY2xhcmF0aW9uW10gPSBbXTtcblxuICAgIGZvciAobGV0IHtub2RlOiBiYXNlQ2xhc3MsIGlkZW50aWZpZXJ9IG9mIG9yZGVyZWRCYXNlQ2xhc3Nlcykge1xuICAgICAgY29uc3QgYmFzZUNsYXNzRmlsZSA9IGJhc2VDbGFzcy5nZXRTb3VyY2VGaWxlKCk7XG5cbiAgICAgIGlmIChoYXNFeHBsaWNpdENvbnN0cnVjdG9yKGJhc2VDbGFzcykpIHtcbiAgICAgICAgLy8gQWxsIGNsYXNzZXMgaW4gYmV0d2VlbiB0aGUgZGVjb3JhdGVkIGNsYXNzIGFuZCB0aGUgdW5kZWNvcmF0ZWQgY2xhc3NcbiAgICAgICAgLy8gdGhhdCBkZWZpbmVzIHRoZSBjb25zdHJ1Y3RvciBuZWVkIHRvIGJlIGRlY29yYXRlZCBhcyB3ZWxsLlxuICAgICAgICB1bmRlY29yYXRlZEJhc2VDbGFzc2VzLmZvckVhY2goYiA9PiBhZGRDbGFzc0RlY29yYXRvcihiKSk7XG5cbiAgICAgICAgaWYgKGJhc2VDbGFzc0ZpbGUuaXNEZWNsYXJhdGlvbkZpbGUpIHtcbiAgICAgICAgICBjb25zdCBzdGF0aWNTeW1ib2wgPSB0aGlzLl9nZXRTdGF0aWNTeW1ib2xPZklkZW50aWZpZXIoaWRlbnRpZmllcik7XG5cbiAgICAgICAgICAvLyBJZiB0aGUgYmFzZSBjbGFzcyBpcyBkZWNvcmF0ZWQgdGhyb3VnaCBtZXRhZGF0YSBmaWxlcywgd2UgZG9uJ3RcbiAgICAgICAgICAvLyBuZWVkIHRvIGFkZCBhIGNvbW1lbnQgdG8gdGhlIGRlcml2ZWQgY2xhc3MgZm9yIHRoZSBleHRlcm5hbCBiYXNlIGNsYXNzLlxuICAgICAgICAgIGlmIChzdGF0aWNTeW1ib2wgJiYgaXNDbGFzc0RlY29yYXRlZChzdGF0aWNTeW1ib2wpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBsYXN0IGNsYXNzIGluIHRoZSBpbmhlcml0YW5jZSBjaGFpbiB0aGF0IGlzIGRlY29yYXRlZCBhbmQgd2lsbCBiZVxuICAgICAgICAgIC8vIHVzZWQgYXMgYW5jaG9yIGZvciBhIGNvbW1lbnQgZXhwbGFpbmluZyB0aGF0IHRoZSBjbGFzcyB0aGF0IGRlZmluZXMgdGhlXG4gICAgICAgICAgLy8gY29uc3RydWN0b3IgY2Fubm90IGJlIGRlY29yYXRlZCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAgIGNvbnN0IGxhc3REZWNvcmF0ZWRDbGFzcyA9XG4gICAgICAgICAgICAgIHVuZGVjb3JhdGVkQmFzZUNsYXNzZXNbdW5kZWNvcmF0ZWRCYXNlQ2xhc3Nlcy5sZW5ndGggLSAxXSB8fCBub2RlO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9hZGRNaXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvclRvZG8obGFzdERlY29yYXRlZENsYXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlY29yYXRlIHRoZSBjbGFzcyB0aGF0IGRlZmluZXMgdGhlIGNvbnN0cnVjdG9yIHRoYXQgaXMgaW5oZXJpdGVkLlxuICAgICAgICBhZGRDbGFzc0RlY29yYXRvcihiYXNlQ2xhc3MpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIHRoZSBjbGFzcyBkZWNvcmF0b3IgZm9yIGFsbCBiYXNlIGNsYXNzZXMgaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluIHVudGlsXG4gICAgICAvLyB0aGUgYmFzZSBjbGFzcyB3aXRoIHRoZSBleHBsaWNpdCBjb25zdHJ1Y3Rvci4gVGhlIGRlY29yYXRvciB3aWxsIGJlIG9ubHlcbiAgICAgIC8vIGFkZGVkIGZvciBiYXNlIGNsYXNzZXMgd2hpY2ggY2FuIGJlIG1vZGlmaWVkLlxuICAgICAgaWYgKCFiYXNlQ2xhc3NGaWxlLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICAgIHVuZGVjb3JhdGVkQmFzZUNsYXNzZXMucHVzaChiYXNlQ2xhc3MpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgYWJzdHJhY3QgXCJARGlyZWN0aXZlKClcIiBkZWNvcmF0b3IgdG8gdGhlIGdpdmVuIGNsYXNzIGluIGNhc2UgdGhlcmVcbiAgICogaXMgbm8gZXhpc3RpbmcgZGlyZWN0aXZlIGRlY29yYXRvci5cbiAgICovXG4gIHByaXZhdGUgX2FkZEFic3RyYWN0RGlyZWN0aXZlRGVjb3JhdG9yKGJhc2VDbGFzczogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGlmIChoYXNEaXJlY3RpdmVEZWNvcmF0b3IoYmFzZUNsYXNzLCB0aGlzLnR5cGVDaGVja2VyKSB8fFxuICAgICAgICB0aGlzLmRlY29yYXRlZERpcmVjdGl2ZXMuaGFzKGJhc2VDbGFzcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlQ2xhc3NGaWxlID0gYmFzZUNsYXNzLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIoYmFzZUNsYXNzRmlsZSk7XG4gICAgY29uc3QgZGlyZWN0aXZlRXhwciA9XG4gICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoYmFzZUNsYXNzRmlsZSwgJ0RpcmVjdGl2ZScsICdAYW5ndWxhci9jb3JlJyk7XG5cbiAgICBjb25zdCBuZXdEZWNvcmF0b3IgPSB0cy5jcmVhdGVEZWNvcmF0b3IodHMuY3JlYXRlQ2FsbChkaXJlY3RpdmVFeHByLCB1bmRlZmluZWQsIFtdKSk7XG4gICAgY29uc3QgbmV3RGVjb3JhdG9yVGV4dCA9XG4gICAgICAgIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0RlY29yYXRvciwgYmFzZUNsYXNzRmlsZSk7XG5cbiAgICByZWNvcmRlci5hZGRDbGFzc0RlY29yYXRvcihiYXNlQ2xhc3MsIG5ld0RlY29yYXRvclRleHQpO1xuICAgIHRoaXMuZGVjb3JhdGVkRGlyZWN0aXZlcy5hZGQoYmFzZUNsYXNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBhYnN0cmFjdCBcIkBJbmplY3RhYmxlKClcIiBkZWNvcmF0b3IgdG8gdGhlIGdpdmVuIGNsYXNzIGluIGNhc2UgdGhlcmVcbiAgICogaXMgbm8gZXhpc3RpbmcgZGlyZWN0aXZlIGRlY29yYXRvci5cbiAgICovXG4gIHByaXZhdGUgX2FkZEluamVjdGFibGVEZWNvcmF0b3IoYmFzZUNsYXNzOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgaWYgKGhhc0luamVjdGFibGVEZWNvcmF0b3IoYmFzZUNsYXNzLCB0aGlzLnR5cGVDaGVja2VyKSB8fFxuICAgICAgICB0aGlzLmRlY29yYXRlZFByb3ZpZGVycy5oYXMoYmFzZUNsYXNzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VDbGFzc0ZpbGUgPSBiYXNlQ2xhc3MuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihiYXNlQ2xhc3NGaWxlKTtcbiAgICBjb25zdCBpbmplY3RhYmxlRXhwciA9XG4gICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoYmFzZUNsYXNzRmlsZSwgJ0luamVjdGFibGUnLCAnQGFuZ3VsYXIvY29yZScpO1xuXG4gICAgY29uc3QgbmV3RGVjb3JhdG9yID0gdHMuY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoaW5qZWN0YWJsZUV4cHIsIHVuZGVmaW5lZCwgW10pKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JUZXh0ID1cbiAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yLCBiYXNlQ2xhc3NGaWxlKTtcblxuICAgIHJlY29yZGVyLmFkZENsYXNzRGVjb3JhdG9yKGJhc2VDbGFzcywgbmV3RGVjb3JhdG9yVGV4dCk7XG4gICAgdGhpcy5kZWNvcmF0ZWRQcm92aWRlcnMuYWRkKGJhc2VDbGFzcyk7XG4gIH1cblxuICAvKiogQWRkcyBhIGNvbW1lbnQgZm9yIGFkZGluZyBhbiBleHBsaWNpdCBjb25zdHJ1Y3RvciB0byB0aGUgZ2l2ZW4gY2xhc3MgZGVjbGFyYXRpb24uICovXG4gIHByaXZhdGUgX2FkZE1pc3NpbmdFeHBsaWNpdENvbnN0cnVjdG9yVG9kbyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICAvLyBJbiBjYXNlIGEgdG9kbyBjb21tZW50IGhhcyBiZWVuIGFscmVhZHkgaW5zZXJ0ZWQgdG8gdGhlIGdpdmVuIGNsYXNzLCB3ZSBkb24ndFxuICAgIC8vIHdhbnQgdG8gYWRkIGEgY29tbWVudCBvciB0cmFuc2Zvcm0gZmFpbHVyZSBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAodGhpcy5taXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvckNsYXNzZXMuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHRoaXMubWlzc2luZ0V4cGxpY2l0Q29uc3RydWN0b3JDbGFzc2VzLmFkZChub2RlKTtcbiAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIobm9kZS5nZXRTb3VyY2VGaWxlKCkpO1xuICAgIHJlY29yZGVyLmFkZENsYXNzQ29tbWVudChub2RlLCAnVE9ETzogYWRkIGV4cGxpY2l0IGNvbnN0cnVjdG9yJyk7XG4gICAgcmV0dXJuIFt7bm9kZTogbm9kZSwgbWVzc2FnZTogJ0NsYXNzIG5lZWRzIHRvIGRlY2xhcmUgYW4gZXhwbGljaXQgY29uc3RydWN0b3IuJ31dO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIHVuZGVjb3JhdGVkIGRpcmVjdGl2ZXMgd2hpY2ggd2VyZSByZWZlcmVuY2VkIGluIE5nTW9kdWxlIGRlY2xhcmF0aW9ucy5cbiAgICogVGhlc2UgZGlyZWN0aXZlcyBpbmhlcml0IHRoZSBtZXRhZGF0YSBmcm9tIGEgcGFyZW50IGJhc2UgY2xhc3MsIGJ1dCB3aXRoIEl2eVxuICAgKiB0aGVzZSBjbGFzc2VzIG5lZWQgdG8gZXhwbGljaXRseSBoYXZlIGEgZGVjb3JhdG9yIGZvciBsb2NhbGl0eS4gVGhlIG1pZ3JhdGlvblxuICAgKiBkZXRlcm1pbmVzIHRoZSBpbmhlcml0ZWQgZGVjb3JhdG9yIGFuZCBjb3BpZXMgaXQgdG8gdGhlIHVuZGVjb3JhdGVkIGRlY2xhcmF0aW9uLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIG1pZ3JhdGlvbiBzZXJpYWxpemVzIHRoZSBtZXRhZGF0YSBmb3IgZXh0ZXJuYWwgZGVjbGFyYXRpb25zXG4gICAqIHdoZXJlIHRoZSBkZWNvcmF0b3IgaXMgbm90IHBhcnQgb2YgdGhlIHNvdXJjZSBmaWxlIEFTVC5cbiAgICpcbiAgICogU2VlIGNhc2UgMiBpbiB0aGUgbWlncmF0aW9uIHBsYW46IGh0dHBzOi8vaGFja21kLmlvL0BhbHgvUzFYS3FNWmVTXG4gICAqL1xuICBtaWdyYXRlVW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMoZGlyZWN0aXZlczogdHMuQ2xhc3NEZWNsYXJhdGlvbltdKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMuX21pZ3JhdGVEZXJpdmVkRGVjbGFyYXRpb24obm9kZSkpLFxuICAgICAgICBbXSBhcyBUcmFuc2Zvcm1GYWlsdXJlW10pO1xuICB9XG5cbiAgcHJpdmF0ZSBfbWlncmF0ZURlcml2ZWREZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICBjb25zdCB0YXJnZXRTb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3Qgb3JkZXJlZEJhc2VDbGFzc2VzID0gZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9ucyhub2RlLCB0aGlzLnR5cGVDaGVja2VyKTtcbiAgICBsZXQgbmV3RGVjb3JhdG9yVGV4dDogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQge25vZGU6IGJhc2VDbGFzcywgaWRlbnRpZmllcn0gb2Ygb3JkZXJlZEJhc2VDbGFzc2VzKSB7XG4gICAgICAvLyBCZWZvcmUgbG9va2luZyBmb3IgZGVjb3JhdG9ycyB3aXRoaW4gdGhlIG1ldGFkYXRhIG9yIHN1bW1hcnkgZmlsZXMsIHdlXG4gICAgICAvLyB0cnkgdG8gZGV0ZXJtaW5lIHRoZSBkaXJlY3RpdmUgZGVjb3JhdG9yIHRocm91Z2ggdGhlIHNvdXJjZSBmaWxlIEFTVC5cbiAgICAgIGlmIChiYXNlQ2xhc3MuZGVjb3JhdG9ycykge1xuICAgICAgICBjb25zdCBuZ0RlY29yYXRvciA9XG4gICAgICAgICAgICBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBiYXNlQ2xhc3MuZGVjb3JhdG9ycylcbiAgICAgICAgICAgICAgICAuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnQ29tcG9uZW50JyB8fCBuYW1lID09PSAnRGlyZWN0aXZlJyB8fCBuYW1lID09PSAnUGlwZScpO1xuXG4gICAgICAgIGlmIChuZ0RlY29yYXRvcikge1xuICAgICAgICAgIGNvbnN0IG5ld0RlY29yYXRvciA9IHRoaXMuZGVjb3JhdG9yUmV3cml0ZXIucmV3cml0ZShuZ0RlY29yYXRvciwgbm9kZS5nZXRTb3VyY2VGaWxlKCkpO1xuICAgICAgICAgIG5ld0RlY29yYXRvclRleHQgPSB0aGlzLnByaW50ZXIucHJpbnROb2RlKFxuICAgICAgICAgICAgICB0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yLCBuZ0RlY29yYXRvci5ub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gbWV0YWRhdGEgY291bGQgYmUgZm91bmQgd2l0aGluIHRoZSBzb3VyY2UtZmlsZSBBU1QsIHRyeSB0byBmaW5kXG4gICAgICAvLyBkZWNvcmF0b3IgZGF0YSB0aHJvdWdoIEFuZ3VsYXIgbWV0YWRhdGEgYW5kIHN1bW1hcnkgZmlsZXMuXG4gICAgICBjb25zdCBzdGF0aWNTeW1ib2wgPSB0aGlzLl9nZXRTdGF0aWNTeW1ib2xPZklkZW50aWZpZXIoaWRlbnRpZmllcik7XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSBzdGF0aWMgc3ltYm9sIHJlc29sdmVzIHRvIGEgY2xhc3MgZGVjbGFyYXRpb24gd2l0aFxuICAgICAgLy8gcGlwZSBvciBkaXJlY3RpdmUgbWV0YWRhdGEuXG4gICAgICBpZiAoIXN0YXRpY1N5bWJvbCB8fFxuICAgICAgICAgICEodGhpcy5tZXRhZGF0YVJlc29sdmVyLmlzUGlwZShzdGF0aWNTeW1ib2wpIHx8XG4gICAgICAgICAgICB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuaXNEaXJlY3RpdmUoc3RhdGljU3ltYm9sKSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fcmVzb2x2ZURlY2xhcmF0aW9uTWV0YWRhdGEoc3RhdGljU3ltYm9sKTtcblxuICAgICAgLy8gSWYgbm8gbWV0YWRhdGEgY291bGQgYmUgcmVzb2x2ZWQgZm9yIHRoZSBzdGF0aWMgc3ltYm9sLCBwcmludCBhIGZhaWx1cmUgbWVzc2FnZVxuICAgICAgLy8gYW5kIGFzayB0aGUgZGV2ZWxvcGVyIHRvIG1hbnVhbGx5IG1pZ3JhdGUgdGhlIGNsYXNzLiBUaGlzIGNhc2UgaXMgcmFyZSBiZWNhdXNlXG4gICAgICAvLyB1c3VhbGx5IGRlY29yYXRvciBtZXRhZGF0YSBpcyBhbHdheXMgcHJlc2VudCBidXQganVzdCBjYW4ndCBiZSByZWFkIGlmIGEgcHJvZ3JhbVxuICAgICAgLy8gb25seSBoYXMgYWNjZXNzIHRvIHN1bW1hcmllcyAodGhpcyBpcyBhIHNwZWNpYWwgY2FzZSBpbiBnb29nbGUzKS5cbiAgICAgIGlmICghbWV0YWRhdGEpIHtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBtZXNzYWdlOiBgQ2xhc3MgY2Fubm90IGJlIG1pZ3JhdGVkIGFzIHRoZSBpbmhlcml0ZWQgbWV0YWRhdGEgZnJvbSBgICtcbiAgICAgICAgICAgICAgYCR7aWRlbnRpZmllci5nZXRUZXh0KCl9IGNhbm5vdCBiZSBjb252ZXJ0ZWQgaW50byBhIGRlY29yYXRvci4gUGxlYXNlIG1hbnVhbGx5IFxuICAgICAgICAgICAgZGVjb3JhdGUgdGhlIGNsYXNzLmAsXG4gICAgICAgIH1dO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdEZWNvcmF0b3IgPSB0aGlzLl9jb25zdHJ1Y3REZWNvcmF0b3JGcm9tTWV0YWRhdGEobWV0YWRhdGEsIHRhcmdldFNvdXJjZUZpbGUpO1xuICAgICAgaWYgKCFuZXdEZWNvcmF0b3IpIHtcbiAgICAgICAgY29uc3QgYW5ub3RhdGlvblR5cGUgPSBtZXRhZGF0YS50eXBlO1xuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG1lc3NhZ2U6IGBDbGFzcyBjYW5ub3QgYmUgbWlncmF0ZWQgYXMgdGhlIGluaGVyaXRlZCBAJHthbm5vdGF0aW9uVHlwZX0gZGVjb3JhdG9yIGAgK1xuICAgICAgICAgICAgICBgY2Fubm90IGJlIGNvcGllZC4gUGxlYXNlIG1hbnVhbGx5IGFkZCBhIEAke2Fubm90YXRpb25UeXBlfSBkZWNvcmF0b3IuYCxcbiAgICAgICAgfV07XG4gICAgICB9XG5cbiAgICAgIC8vIEluIGNhc2UgdGhlIGRlY29yYXRvciBjb3VsZCBiZSBjb25zdHJ1Y3RlZCBmcm9tIHRoZSByZXNvbHZlZCBtZXRhZGF0YSwgdXNlXG4gICAgICAvLyB0aGF0IGRlY29yYXRvciBmb3IgdGhlIGRlcml2ZWQgdW5kZWNvcmF0ZWQgY2xhc3Nlcy5cbiAgICAgIG5ld0RlY29yYXRvclRleHQgPVxuICAgICAgICAgIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0RlY29yYXRvciwgdGFyZ2V0U291cmNlRmlsZSk7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoIW5ld0RlY29yYXRvclRleHQpIHtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICBub2RlLFxuICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgICAgJ0NsYXNzIGNhbm5vdCBiZSBtaWdyYXRlZCBhcyBubyBkaXJlY3RpdmUvY29tcG9uZW50L3BpcGUgbWV0YWRhdGEgY291bGQgYmUgZm91bmQuICcgK1xuICAgICAgICAgICAgJ1BsZWFzZSBtYW51YWxseSBhZGQgYSBARGlyZWN0aXZlLCBAQ29tcG9uZW50IG9yIEBQaXBlIGRlY29yYXRvci4nXG4gICAgICB9XTtcbiAgICB9XG5cbiAgICB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKHRhcmdldFNvdXJjZUZpbGUpLmFkZENsYXNzRGVjb3JhdG9yKG5vZGUsIG5ld0RlY29yYXRvclRleHQpO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKiBSZWNvcmRzIGFsbCBjaGFuZ2VzIHRoYXQgd2VyZSBtYWRlIGluIHRoZSBpbXBvcnQgbWFuYWdlci4gKi9cbiAgcmVjb3JkQ2hhbmdlcygpIHsgdGhpcy5pbXBvcnRNYW5hZ2VyLnJlY29yZENoYW5nZXMoKTsgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgVHlwZVNjcmlwdCBkZWNvcmF0b3Igbm9kZSBmcm9tIHRoZSBzcGVjaWZpZWQgZGVjbGFyYXRpb24gbWV0YWRhdGEuIFJldHVybnNcbiAgICogbnVsbCBpZiB0aGUgbWV0YWRhdGEgY291bGQgbm90IGJlIHNpbXBsaWZpZWQvcmVzb2x2ZWQuXG4gICAqL1xuICBwcml2YXRlIF9jb25zdHJ1Y3REZWNvcmF0b3JGcm9tTWV0YWRhdGEoXG4gICAgICBkaXJlY3RpdmVNZXRhZGF0YTogRGVjbGFyYXRpb25NZXRhZGF0YSwgdGFyZ2V0U291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IHRzLkRlY29yYXRvcnxudWxsIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGVjb3JhdG9yRXhwciA9IGNvbnZlcnREaXJlY3RpdmVNZXRhZGF0YVRvRXhwcmVzc2lvbihcbiAgICAgICAgICBkaXJlY3RpdmVNZXRhZGF0YS5tZXRhZGF0YSxcbiAgICAgICAgICBzdGF0aWNTeW1ib2wgPT5cbiAgICAgICAgICAgICAgdGhpcy5jb21waWxlckhvc3RcbiAgICAgICAgICAgICAgICAgIC5maWxlTmFtZVRvTW9kdWxlTmFtZShzdGF0aWNTeW1ib2wuZmlsZVBhdGgsIHRhcmdldFNvdXJjZUZpbGUuZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwvaW5kZXgkLywgJycpLFxuICAgICAgICAgIChtb2R1bGVOYW1lOiBzdHJpbmcsIG5hbWU6IHN0cmluZykgPT5cbiAgICAgICAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZSh0YXJnZXRTb3VyY2VGaWxlLCBuYW1lLCBtb2R1bGVOYW1lKSxcbiAgICAgICAgICAocHJvcGVydHlOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgLy8gT25seSBub3JtYWxpemUgcHJvcGVydGllcyBjYWxsZWQgXCJjaGFuZ2VEZXRlY3Rpb25cIiBhbmQgXCJlbmNhcHN1bGF0aW9uXCJcbiAgICAgICAgICAgIC8vIGZvciBcIkBEaXJlY3RpdmVcIiBhbmQgXCJAQ29tcG9uZW50XCIgYW5ub3RhdGlvbnMuXG4gICAgICAgICAgICBpZiAoZGlyZWN0aXZlTWV0YWRhdGEudHlwZSA9PT0gJ1BpcGUnKSB7XG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbnN0ZWFkIG9mIHVzaW5nIHRoZSBudW1iZXIgYXMgdmFsdWUgZm9yIHRoZSBcImNoYW5nZURldGVjdGlvblwiIGFuZFxuICAgICAgICAgICAgLy8gXCJlbmNhcHN1bGF0aW9uXCIgcHJvcGVydGllcywgd2Ugd2FudCB0byB1c2UgdGhlIGFjdHVhbCBlbnVtIHN5bWJvbHMuXG4gICAgICAgICAgICBpZiAocHJvcGVydHlOYW1lID09PSAnY2hhbmdlRGV0ZWN0aW9uJyAmJiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cy5jcmVhdGVQcm9wZXJ0eUFjY2VzcyhcbiAgICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoXG4gICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0U291cmNlRmlsZSwgJ0NoYW5nZURldGVjdGlvblN0cmF0ZWd5JywgJ0Bhbmd1bGFyL2NvcmUnKSxcbiAgICAgICAgICAgICAgICAgIENoYW5nZURldGVjdGlvblN0cmF0ZWd5W3ZhbHVlXSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5TmFtZSA9PT0gJ2VuY2Fwc3VsYXRpb24nICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKFxuICAgICAgICAgICAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShcbiAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRTb3VyY2VGaWxlLCAnVmlld0VuY2Fwc3VsYXRpb24nLCAnQGFuZ3VsYXIvY29yZScpLFxuICAgICAgICAgICAgICAgICAgVmlld0VuY2Fwc3VsYXRpb25bdmFsdWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdHMuY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoXG4gICAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShcbiAgICAgICAgICAgICAgdGFyZ2V0U291cmNlRmlsZSwgZGlyZWN0aXZlTWV0YWRhdGEudHlwZSwgJ0Bhbmd1bGFyL2NvcmUnKSxcbiAgICAgICAgICB1bmRlZmluZWQsIFtkZWNvcmF0b3JFeHByXSkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgVW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvcikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIHRoZSBkZWNsYXJhdGlvbiBtZXRhZGF0YSBvZiBhIGdpdmVuIHN0YXRpYyBzeW1ib2wuIFRoZSBtZXRhZGF0YVxuICAgKiBpcyBkZXRlcm1pbmVkIGJ5IHJlc29sdmluZyBtZXRhZGF0YSBmb3IgdGhlIHN0YXRpYyBzeW1ib2wuXG4gICAqL1xuICBwcml2YXRlIF9yZXNvbHZlRGVjbGFyYXRpb25NZXRhZGF0YShzeW1ib2w6IFN0YXRpY1N5bWJvbCk6IG51bGx8RGVjbGFyYXRpb25NZXRhZGF0YSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIE5vdGUgdGhhdCB0aGlzIGNhbGwgY2FuIHRocm93IGlmIHRoZSBtZXRhZGF0YSBpcyBub3QgY29tcHV0YWJsZS4gSW4gdGhhdFxuICAgICAgLy8gY2FzZSB3ZSBhcmUgbm90IGFibGUgdG8gc2VyaWFsaXplIHRoZSBtZXRhZGF0YSBpbnRvIGEgZGVjb3JhdG9yIGFuZCB3ZSByZXR1cm5cbiAgICAgIC8vIG51bGwuXG4gICAgICBjb25zdCBhbm5vdGF0aW9ucyA9IHRoaXMuY29tcGlsZXIucmVmbGVjdG9yLmFubm90YXRpb25zKHN5bWJvbCkuZmluZChcbiAgICAgICAgICBzID0+IHMubmdNZXRhZGF0YU5hbWUgPT09ICdDb21wb25lbnQnIHx8IHMubmdNZXRhZGF0YU5hbWUgPT09ICdEaXJlY3RpdmUnIHx8XG4gICAgICAgICAgICAgIHMubmdNZXRhZGF0YU5hbWUgPT09ICdQaXBlJyk7XG5cbiAgICAgIGlmICghYW5ub3RhdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHtuZ01ldGFkYXRhTmFtZSwgLi4ubWV0YWRhdGF9ID0gYW5ub3RhdGlvbnM7XG5cbiAgICAgIC8vIERlbGV0ZSB0aGUgXCJuZ01ldGFkYXRhTmFtZVwiIHByb3BlcnR5IGFzIHdlIGRvbid0IHdhbnQgdG8gZ2VuZXJhdGVcbiAgICAgIC8vIGEgcHJvcGVydHkgYXNzaWdubWVudCBpbiB0aGUgbmV3IGRlY29yYXRvciBmb3IgdGhhdCBpbnRlcm5hbCBwcm9wZXJ0eS5cbiAgICAgIGRlbGV0ZSBtZXRhZGF0YVsnbmdNZXRhZGF0YU5hbWUnXTtcblxuICAgICAgcmV0dXJuIHt0eXBlOiBuZ01ldGFkYXRhTmFtZSwgbWV0YWRhdGF9O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldFN0YXRpY1N5bWJvbE9mSWRlbnRpZmllcihub2RlOiB0cy5JZGVudGlmaWVyKTogU3RhdGljU3ltYm9sfG51bGwge1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCByZXNvbHZlZEltcG9ydCA9IGdldEltcG9ydE9mSWRlbnRpZmllcih0aGlzLnR5cGVDaGVja2VyLCBub2RlKTtcblxuICAgIGlmICghcmVzb2x2ZWRJbXBvcnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG1vZHVsZU5hbWUgPVxuICAgICAgICB0aGlzLmNvbXBpbGVySG9zdC5tb2R1bGVOYW1lVG9GaWxlTmFtZShyZXNvbHZlZEltcG9ydC5pbXBvcnRNb2R1bGUsIHNvdXJjZUZpbGUuZmlsZU5hbWUpO1xuXG4gICAgaWYgKCFtb2R1bGVOYW1lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBGaW5kIHRoZSBkZWNsYXJhdGlvbiBzeW1ib2wgYXMgc3ltYm9scyBjb3VsZCBiZSBhbGlhc2VkIGR1ZSB0b1xuICAgIC8vIG1ldGFkYXRhIHJlLWV4cG9ydHMuXG4gICAgcmV0dXJuIHRoaXMuY29tcGlsZXIucmVmbGVjdG9yLmZpbmRTeW1ib2xEZWNsYXJhdGlvbihcbiAgICAgICAgdGhpcy5zeW1ib2xSZXNvbHZlci5nZXRTdGF0aWNTeW1ib2wobW9kdWxlTmFtZSwgcmVzb2x2ZWRJbXBvcnQubmFtZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2FibGVzIHRoYXQgc3RhdGljIHN5bWJvbHMgYXJlIHJlc29sdmVkIHRocm91Z2ggc3VtbWFyaWVzLiBTdW1tYXJpZXNcbiAgICogY2Fubm90IGJlIHVzZWQgZm9yIGRlY29yYXRvciBhbmFseXNpcyBhcyBkZWNvcmF0b3JzIGFyZSBvbWl0dGVkIGluIHN1bW1hcmllcy5cbiAgICovXG4gIHByaXZhdGUgX2Rpc2FibGVTdW1tYXJ5UmVzb2x1dGlvbigpIHtcbiAgICAvLyBXZSBuZXZlciB3YW50IHRvIHJlc29sdmUgc3ltYm9scyB0aHJvdWdoIHN1bW1hcmllcy4gU3VtbWFyaWVzIG5ldmVyIGNvbnRhaW5cbiAgICAvLyBkZWNvcmF0b3JzIGZvciBjbGFzcyBzeW1ib2xzIGFuZCB0aGVyZWZvcmUgc3VtbWFyaWVzIHdpbGwgY2F1c2UgZXZlcnkgY2xhc3NcbiAgICAvLyB0byBiZSBjb25zaWRlcmVkIGFzIHVuZGVjb3JhdGVkLiBTZWUgcmVhc29uIGZvciB0aGlzIGluOiBcIlRvSnNvblNlcmlhbGl6ZXJcIi5cbiAgICAvLyBJbiBvcmRlciB0byBlbnN1cmUgdGhhdCBtZXRhZGF0YSBpcyBub3QgcmV0cmlldmVkIHRocm91Z2ggc3VtbWFyaWVzLCB3ZVxuICAgIC8vIG5lZWQgdG8gZGlzYWJsZSBzdW1tYXJ5IHJlc29sdXRpb24sIGNsZWFyIHByZXZpb3VzIHN5bWJvbCBjYWNoZXMuIFRoaXMgd2F5XG4gICAgLy8gZnV0dXJlIGNhbGxzIHRvIFwiU3RhdGljUmVmbGVjdG9yI2Fubm90YXRpb25zXCIgYXJlIGJhc2VkIG9uIG1ldGFkYXRhIGZpbGVzLlxuICAgIHRoaXMuc3ltYm9sUmVzb2x2ZXJbJ19yZXNvbHZlU3ltYm9sRnJvbVN1bW1hcnknXSA9ICgpID0+IG51bGw7XG4gICAgdGhpcy5zeW1ib2xSZXNvbHZlclsncmVzb2x2ZWRTeW1ib2xzJ10uY2xlYXIoKTtcbiAgICB0aGlzLnN5bWJvbFJlc29sdmVyWydyZXNvbHZlZEZpbGVQYXRocyddLmNsZWFyKCk7XG4gICAgdGhpcy5jb21waWxlci5yZWZsZWN0b3JbJ2Fubm90YXRpb25DYWNoZSddLmNsZWFyKCk7XG5cbiAgICAvLyBPcmlnaW5hbCBzdW1tYXJ5IHJlc29sdmVyIHVzZWQgYnkgdGhlIEFPVCBjb21waWxlci5cbiAgICBjb25zdCBzdW1tYXJ5UmVzb2x2ZXIgPSB0aGlzLnN5bWJvbFJlc29sdmVyWydzdW1tYXJ5UmVzb2x2ZXInXTtcblxuICAgIC8vIEFkZGl0aW9uYWxseSB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IG5vIGZpbGVzIGFyZSB0cmVhdGVkIGFzIFwibGlicmFyeVwiIGZpbGVzIHdoZW5cbiAgICAvLyByZXNvbHZpbmcgbWV0YWRhdGEuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYnkgZGVmYXVsdCB0aGUgc3ltYm9sIHJlc29sdmVyIGRpc2NhcmRzXG4gICAgLy8gY2xhc3MgbWV0YWRhdGEgZm9yIGxpYnJhcnkgZmlsZXMuIFNlZSBcIlN0YXRpY1N5bWJvbFJlc29sdmVyI2NyZWF0ZVJlc29sdmVkU3ltYm9sXCIuXG4gICAgLy8gUGF0Y2hpbmcgdGhpcyBmdW5jdGlvbiAqKm9ubHkqKiBmb3IgdGhlIHN0YXRpYyBzeW1ib2wgcmVzb2x2ZXIgZW5zdXJlcyB0aGF0IG1ldGFkYXRhXG4gICAgLy8gaXMgbm90IGluY29ycmVjdGx5IG9taXR0ZWQuIE5vdGUgdGhhdCB3ZSBvbmx5IHdhbnQgdG8gZG8gdGhpcyBmb3IgdGhlIHN5bWJvbCByZXNvbHZlclxuICAgIC8vIGJlY2F1c2Ugb3RoZXJ3aXNlIHdlIGNvdWxkIGJyZWFrIHRoZSBzdW1tYXJ5IGxvYWRpbmcgbG9naWMgd2hpY2ggaXMgdXNlZCB0byBkZXRlY3RcbiAgICAvLyBpZiBhIHN0YXRpYyBzeW1ib2wgaXMgZWl0aGVyIGEgZGlyZWN0aXZlLCBjb21wb25lbnQgb3IgcGlwZSAoc2VlIE1ldGFkYXRhUmVzb2x2ZXIpLlxuICAgIHRoaXMuc3ltYm9sUmVzb2x2ZXJbJ3N1bW1hcnlSZXNvbHZlciddID0gPFN1bW1hcnlSZXNvbHZlcjxTdGF0aWNTeW1ib2w+PntcbiAgICAgIGZyb21TdW1tYXJ5RmlsZU5hbWU6IHN1bW1hcnlSZXNvbHZlci5mcm9tU3VtbWFyeUZpbGVOYW1lLmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIGFkZFN1bW1hcnk6IHN1bW1hcnlSZXNvbHZlci5hZGRTdW1tYXJ5LmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIGdldEltcG9ydEFzOiBzdW1tYXJ5UmVzb2x2ZXIuZ2V0SW1wb3J0QXMuYmluZChzdW1tYXJ5UmVzb2x2ZXIpLFxuICAgICAgZ2V0S25vd25Nb2R1bGVOYW1lOiBzdW1tYXJ5UmVzb2x2ZXIuZ2V0S25vd25Nb2R1bGVOYW1lLmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIHJlc29sdmVTdW1tYXJ5OiBzdW1tYXJ5UmVzb2x2ZXIucmVzb2x2ZVN1bW1hcnkuYmluZChzdW1tYXJ5UmVzb2x2ZXIpLFxuICAgICAgdG9TdW1tYXJ5RmlsZU5hbWU6IHN1bW1hcnlSZXNvbHZlci50b1N1bW1hcnlGaWxlTmFtZS5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICBnZXRTeW1ib2xzT2Y6IHN1bW1hcnlSZXNvbHZlci5nZXRTeW1ib2xzT2YuYmluZChzdW1tYXJ5UmVzb2x2ZXIpLFxuICAgICAgaXNMaWJyYXJ5RmlsZTogKCkgPT4gZmFsc2UsXG4gICAgfTtcbiAgfVxufVxuIl19