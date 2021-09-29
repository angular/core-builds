/**
 * @license
 * Copyright Google LLC All Rights Reserved.
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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/transform", ["require", "exports", "@angular/core", "typescript", "@angular/core/schematics/utils/import_manager", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/class_declaration", "@angular/core/schematics/utils/typescript/find_base_classes", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/decorator_rewriter", "@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndecoratedClassesTransform = void 0;
    const core_1 = require("@angular/core");
    const ts = require("typescript");
    const import_manager_1 = require("@angular/core/schematics/utils/import_manager");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const class_declaration_1 = require("@angular/core/schematics/utils/typescript/class_declaration");
    const find_base_classes_1 = require("@angular/core/schematics/utils/typescript/find_base_classes");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const convert_directive_metadata_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata");
    const decorator_rewriter_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/decorator_rewriter");
    const ng_declaration_collector_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector");
    class UndecoratedClassesTransform {
        constructor(typeChecker, compiler, evaluator, getUpdateRecorder, compilerModule) {
            this.typeChecker = typeChecker;
            this.compiler = compiler;
            this.evaluator = evaluator;
            this.getUpdateRecorder = getUpdateRecorder;
            this.compilerModule = compilerModule;
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
            if ((0, class_declaration_1.hasExplicitConstructor)(node)) {
                return [];
            }
            const orderedBaseClasses = (0, find_base_classes_1.findBaseClassDeclarations)(node, this.typeChecker);
            const undecoratedBaseClasses = [];
            for (let { node: baseClass, identifier } of orderedBaseClasses) {
                const baseClassFile = baseClass.getSourceFile();
                if ((0, class_declaration_1.hasExplicitConstructor)(baseClass)) {
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
            if ((0, ng_declaration_collector_1.hasDirectiveDecorator)(baseClass, this.typeChecker) ||
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
            if ((0, ng_declaration_collector_1.hasInjectableDecorator)(baseClass, this.typeChecker) ||
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
            const orderedBaseClasses = (0, find_base_classes_1.findBaseClassDeclarations)(node, this.typeChecker);
            let newDecoratorText = null;
            for (let { node: baseClass, identifier } of orderedBaseClasses) {
                // Before looking for decorators within the metadata or summary files, we
                // try to determine the directive decorator through the source file AST.
                if (baseClass.decorators) {
                    const ngDecorator = (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, baseClass.decorators)
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
        recordChanges() {
            this.importManager.recordChanges();
        }
        /**
         * Constructs a TypeScript decorator node from the specified declaration metadata. Returns
         * null if the metadata could not be simplified/resolved.
         */
        _constructDecoratorFromMetadata(directiveMetadata, targetSourceFile) {
            try {
                const decoratorExpr = (0, convert_directive_metadata_1.convertDirectiveMetadataToExpression)(this.compilerModule, directiveMetadata.metadata, staticSymbol => this.compilerHost
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
            const resolvedImport = (0, imports_1.getImportOfIdentifier)(this.typeChecker, node);
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
            this.symbolResolver['symbolFromFile'].clear();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlILHdDQUF5RTtJQUN6RSxpQ0FBaUM7SUFFakMsa0ZBQXlEO0lBQ3pELGdGQUErRDtJQUMvRCxtR0FBZ0Y7SUFDaEYsbUdBQW1GO0lBQ25GLCtFQUFxRTtJQUVyRSw2SkFBa0k7SUFDbEksNklBQXlFO0lBQ3pFLHVJQUF5RjtJQWdCekYsTUFBYSwyQkFBMkI7UUFvQnRDLFlBQ1ksV0FBMkIsRUFBVSxRQUFxQixFQUMxRCxTQUEyQixFQUMzQixpQkFBd0QsRUFDeEQsY0FBa0Q7WUFIbEQsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBYTtZQUMxRCxjQUFTLEdBQVQsU0FBUyxDQUFrQjtZQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXVDO1lBQ3hELG1CQUFjLEdBQWQsY0FBYyxDQUFvQztZQXZCdEQsWUFBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsRUFBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDO1lBQy9ELGtCQUFhLEdBQUcsSUFBSSw4QkFBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEUsc0JBQWlCLEdBQ3JCLElBQUksc0NBQWlCLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBTS9GLDZFQUE2RTtZQUNyRSx3QkFBbUIs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QUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRW5ELHNEQUFzRDtZQUN0RCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFL0QsbUZBQW1GO1lBQ25GLHdGQUF3RjtZQUN4RixxRkFBcUY7WUFDckYsdUZBQXVGO1lBQ3ZGLHdGQUF3RjtZQUN4RixxRkFBcUY7WUFDckYsc0ZBQXNGO1lBQ3RGLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsR0FBa0M7Z0JBQ3RFLG1CQUFtQixFQUFFLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM5RSxVQUFVLEVBQUUsZUFBZSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM1RCxXQUFXLEVBQUUsZUFBZSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM5RCxrQkFBa0IsRUFBRSxlQUFlLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDNUUsY0FBYyxFQUFFLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDcEUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQzFFLFlBQVksRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQ2hFLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLO2FBQzNCLENBQUM7UUFDSixDQUFDO0tBQ0Y7SUF2YUQsa0VBdWFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtBb3RDb21waWxlciwgQW90Q29tcGlsZXJIb3N0LCBDb21waWxlTWV0YWRhdGFSZXNvbHZlciwgU3RhdGljU3ltYm9sLCBTdGF0aWNTeW1ib2xSZXNvbHZlciwgU3VtbWFyeVJlc29sdmVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge1BhcnRpYWxFdmFsdWF0b3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0IHtDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSwgVmlld0VuY2Fwc3VsYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0TWFuYWdlcn0gZnJvbSAnLi4vLi4vdXRpbHMvaW1wb3J0X21hbmFnZXInO1xuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge2hhc0V4cGxpY2l0Q29uc3RydWN0b3J9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY2xhc3NfZGVjbGFyYXRpb24nO1xuaW1wb3J0IHtmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ZpbmRfYmFzZV9jbGFzc2VzJztcbmltcG9ydCB7Z2V0SW1wb3J0T2ZJZGVudGlmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuXG5pbXBvcnQge2NvbnZlcnREaXJlY3RpdmVNZXRhZGF0YVRvRXhwcmVzc2lvbiwgVW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvcn0gZnJvbSAnLi9kZWNvcmF0b3JfcmV3cml0ZS9jb252ZXJ0X2RpcmVjdGl2ZV9tZXRhZGF0YSc7XG5pbXBvcnQge0RlY29yYXRvclJld3JpdGVyfSBmcm9tICcuL2RlY29yYXRvcl9yZXdyaXRlL2RlY29yYXRvcl9yZXdyaXRlcic7XG5pbXBvcnQge2hhc0RpcmVjdGl2ZURlY29yYXRvciwgaGFzSW5qZWN0YWJsZURlY29yYXRvcn0gZnJvbSAnLi9uZ19kZWNsYXJhdGlvbl9jb2xsZWN0b3InO1xuaW1wb3J0IHtVcGRhdGVSZWNvcmRlcn0gZnJvbSAnLi91cGRhdGVfcmVjb3JkZXInO1xuXG5cblxuLyoqIFJlc29sdmVkIG1ldGFkYXRhIG9mIGEgZGVjbGFyYXRpb24uICovXG5pbnRlcmZhY2UgRGVjbGFyYXRpb25NZXRhZGF0YSB7XG4gIG1ldGFkYXRhOiBhbnk7XG4gIHR5cGU6ICdDb21wb25lbnQnfCdEaXJlY3RpdmUnfCdQaXBlJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2Zvcm1GYWlsdXJlIHtcbiAgbm9kZTogdHMuTm9kZTtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVW5kZWNvcmF0ZWRDbGFzc2VzVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcih7bmV3TGluZTogdHMuTmV3TGluZUtpbmQuTGluZUZlZWR9KTtcbiAgcHJpdmF0ZSBpbXBvcnRNYW5hZ2VyID0gbmV3IEltcG9ydE1hbmFnZXIodGhpcy5nZXRVcGRhdGVSZWNvcmRlciwgdGhpcy5wcmludGVyKTtcbiAgcHJpdmF0ZSBkZWNvcmF0b3JSZXdyaXRlciA9XG4gICAgICBuZXcgRGVjb3JhdG9yUmV3cml0ZXIodGhpcy5pbXBvcnRNYW5hZ2VyLCB0aGlzLnR5cGVDaGVja2VyLCB0aGlzLmV2YWx1YXRvciwgdGhpcy5jb21waWxlcik7XG5cbiAgcHJpdmF0ZSBjb21waWxlckhvc3Q6IEFvdENvbXBpbGVySG9zdDtcbiAgcHJpdmF0ZSBzeW1ib2xSZXNvbHZlcjogU3RhdGljU3ltYm9sUmVzb2x2ZXI7XG4gIHByaXZhdGUgbWV0YWRhdGFSZXNvbHZlcjogQ29tcGlsZU1ldGFkYXRhUmVzb2x2ZXI7XG5cbiAgLyoqIFNldCBvZiBjbGFzcyBkZWNsYXJhdGlvbnMgd2hpY2ggaGF2ZSBiZWVuIGRlY29yYXRlZCB3aXRoIFwiQERpcmVjdGl2ZVwiLiAqL1xuICBwcml2YXRlIGRlY29yYXRlZERpcmVjdGl2ZXMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG4gIC8qKiBTZXQgb2YgY2xhc3MgZGVjbGFyYXRpb25zIHdoaWNoIGhhdmUgYmVlbiBkZWNvcmF0ZWQgd2l0aCBcIkBJbmplY3RhYmxlXCIgKi9cbiAgcHJpdmF0ZSBkZWNvcmF0ZWRQcm92aWRlcnMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG4gIC8qKlxuICAgKiBTZXQgb2YgY2xhc3MgZGVjbGFyYXRpb25zIHdoaWNoIGhhdmUgYmVlbiBhbmFseXplZCBhbmQgbmVlZCB0byBzcGVjaWZ5XG4gICAqIGFuIGV4cGxpY2l0IGNvbnN0cnVjdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBtaXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvckNsYXNzZXMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgcHJpdmF0ZSBjb21waWxlcjogQW90Q29tcGlsZXIsXG4gICAgICBwcml2YXRlIGV2YWx1YXRvcjogUGFydGlhbEV2YWx1YXRvcixcbiAgICAgIHByaXZhdGUgZ2V0VXBkYXRlUmVjb3JkZXI6IChzZjogdHMuU291cmNlRmlsZSkgPT4gVXBkYXRlUmVjb3JkZXIsXG4gICAgICBwcml2YXRlIGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpKSB7XG4gICAgdGhpcy5zeW1ib2xSZXNvbHZlciA9IGNvbXBpbGVyWydfc3ltYm9sUmVzb2x2ZXInXTtcbiAgICB0aGlzLmNvbXBpbGVySG9zdCA9IGNvbXBpbGVyWydfaG9zdCddO1xuICAgIHRoaXMubWV0YWRhdGFSZXNvbHZlciA9IGNvbXBpbGVyWydfbWV0YWRhdGFSZXNvbHZlciddO1xuXG4gICAgLy8gVW5zZXQgdGhlIGRlZmF1bHQgZXJyb3IgcmVjb3JkZXIgc28gdGhhdCB0aGUgcmVmbGVjdG9yIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uXG4gICAgLy8gaWYgbWV0YWRhdGEgY2Fubm90IGJlIHJlc29sdmVkLlxuICAgIHRoaXMuY29tcGlsZXIucmVmbGVjdG9yWydlcnJvclJlY29yZGVyJ10gPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBEaXNhYmxlcyB0aGF0IHN0YXRpYyBzeW1ib2xzIGFyZSByZXNvbHZlZCB0aHJvdWdoIHN1bW1hcmllcyBmcm9tIHdpdGhpbiB0aGUgc3RhdGljXG4gICAgLy8gcmVmbGVjdG9yLiBTdW1tYXJpZXMgY2Fubm90IGJlIHVzZWQgZm9yIGRlY29yYXRvciBzZXJpYWxpemF0aW9uIGFzIGRlY29yYXRvcnMgYXJlXG4gICAgLy8gb21pdHRlZCBpbiBzdW1tYXJpZXMgYW5kIHRoZSBkZWNvcmF0b3IgY2FuJ3QgYmUgcmVjb25zdHJ1Y3RlZCBmcm9tIHRoZSBkaXJlY3RpdmUgc3VtbWFyeS5cbiAgICB0aGlzLl9kaXNhYmxlU3VtbWFyeVJlc29sdXRpb24oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyBkZWNvcmF0ZWQgZGlyZWN0aXZlcyB3aGljaCBjYW4gcG90ZW50aWFsbHkgaW5oZXJpdCBhIGNvbnN0cnVjdG9yXG4gICAqIGZyb20gYW4gdW5kZWNvcmF0ZWQgYmFzZSBjbGFzcy4gQWxsIGJhc2UgY2xhc3NlcyB1bnRpbCB0aGUgZmlyc3Qgb25lXG4gICAqIHdpdGggYW4gZXhwbGljaXQgY29uc3RydWN0b3Igd2lsbCBiZSBkZWNvcmF0ZWQgd2l0aCB0aGUgYWJzdHJhY3QgXCJARGlyZWN0aXZlKClcIlxuICAgKiBkZWNvcmF0b3IuIFNlZSBjYXNlIDEgaW4gdGhlIG1pZ3JhdGlvbiBwbGFuOiBodHRwczovL2hhY2ttZC5pby9AYWx4L1MxWEtxTVplU1xuICAgKi9cbiAgbWlncmF0ZURlY29yYXRlZERpcmVjdGl2ZXMoZGlyZWN0aXZlczogdHMuQ2xhc3NEZWNsYXJhdGlvbltdKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMuX21pZ3JhdGVEaXJlY3RpdmVCYXNlQ2xhc3Mobm9kZSkpLFxuICAgICAgICBbXSBhcyBUcmFuc2Zvcm1GYWlsdXJlW10pO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGRlY29yYXRlZCBwcm92aWRlcnMgd2hpY2ggY2FuIHBvdGVudGlhbGx5IGluaGVyaXQgYSBjb25zdHJ1Y3RvclxuICAgKiBmcm9tIGFuIHVuZGVjb3JhdGVkIGJhc2UgY2xhc3MuIEFsbCBiYXNlIGNsYXNzZXMgdW50aWwgdGhlIGZpcnN0IG9uZVxuICAgKiB3aXRoIGFuIGV4cGxpY2l0IGNvbnN0cnVjdG9yIHdpbGwgYmUgZGVjb3JhdGVkIHdpdGggdGhlIFwiQEluamVjdGFibGUoKVwiLlxuICAgKi9cbiAgbWlncmF0ZURlY29yYXRlZFByb3ZpZGVycyhwcm92aWRlcnM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXSk6IFRyYW5zZm9ybUZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIHByb3ZpZGVycy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMuX21pZ3JhdGVQcm92aWRlckJhc2VDbGFzcyhub2RlKSksXG4gICAgICAgIFtdIGFzIFRyYW5zZm9ybUZhaWx1cmVbXSk7XG4gIH1cblxuICBwcml2YXRlIF9taWdyYXRlUHJvdmlkZXJCYXNlQ2xhc3Mobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IFRyYW5zZm9ybUZhaWx1cmVbXSB7XG4gICAgcmV0dXJuIHRoaXMuX21pZ3JhdGVEZWNvcmF0ZWRDbGFzc1dpdGhJbmhlcml0ZWRDdG9yKFxuICAgICAgICBub2RlLCBzeW1ib2wgPT4gdGhpcy5tZXRhZGF0YVJlc29sdmVyLmlzSW5qZWN0YWJsZShzeW1ib2wpLFxuICAgICAgICBub2RlID0+IHRoaXMuX2FkZEluamVjdGFibGVEZWNvcmF0b3Iobm9kZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbWlncmF0ZURpcmVjdGl2ZUJhc2VDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gdGhpcy5fbWlncmF0ZURlY29yYXRlZENsYXNzV2l0aEluaGVyaXRlZEN0b3IoXG4gICAgICAgIG5vZGUsIHN5bWJvbCA9PiB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuaXNEaXJlY3RpdmUoc3ltYm9sKSxcbiAgICAgICAgbm9kZSA9PiB0aGlzLl9hZGRBYnN0cmFjdERpcmVjdGl2ZURlY29yYXRvcihub2RlKSk7XG4gIH1cblxuXG4gIHByaXZhdGUgX21pZ3JhdGVEZWNvcmF0ZWRDbGFzc1dpdGhJbmhlcml0ZWRDdG9yKFxuICAgICAgbm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgaXNDbGFzc0RlY29yYXRlZDogKHN5bWJvbDogU3RhdGljU3ltYm9sKSA9PiBib29sZWFuLFxuICAgICAgYWRkQ2xhc3NEZWNvcmF0b3I6IChub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSA9PiB2b2lkKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICAvLyBJbiBjYXNlIHRoZSBwcm92aWRlciBoYXMgYW4gZXhwbGljaXQgY29uc3RydWN0b3IsIHdlIGRvbid0IG5lZWQgdG8gZG8gYW55dGhpbmdcbiAgICAvLyBiZWNhdXNlIHRoZSBjbGFzcyBpcyBhbHJlYWR5IGRlY29yYXRlZCBhbmQgZG9lcyBub3QgaW5oZXJpdCBhIGNvbnN0cnVjdG9yLlxuICAgIGlmIChoYXNFeHBsaWNpdENvbnN0cnVjdG9yKG5vZGUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXJlZEJhc2VDbGFzc2VzID0gZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9ucyhub2RlLCB0aGlzLnR5cGVDaGVja2VyKTtcbiAgICBjb25zdCB1bmRlY29yYXRlZEJhc2VDbGFzc2VzOiB0cy5DbGFzc0RlY2xhcmF0aW9uW10gPSBbXTtcblxuICAgIGZvciAobGV0IHtub2RlOiBiYXNlQ2xhc3MsIGlkZW50aWZpZXJ9IG9mIG9yZGVyZWRCYXNlQ2xhc3Nlcykge1xuICAgICAgY29uc3QgYmFzZUNsYXNzRmlsZSA9IGJhc2VDbGFzcy5nZXRTb3VyY2VGaWxlKCk7XG5cbiAgICAgIGlmIChoYXNFeHBsaWNpdENvbnN0cnVjdG9yKGJhc2VDbGFzcykpIHtcbiAgICAgICAgLy8gQWxsIGNsYXNzZXMgaW4gYmV0d2VlbiB0aGUgZGVjb3JhdGVkIGNsYXNzIGFuZCB0aGUgdW5kZWNvcmF0ZWQgY2xhc3NcbiAgICAgICAgLy8gdGhhdCBkZWZpbmVzIHRoZSBjb25zdHJ1Y3RvciBuZWVkIHRvIGJlIGRlY29yYXRlZCBhcyB3ZWxsLlxuICAgICAgICB1bmRlY29yYXRlZEJhc2VDbGFzc2VzLmZvckVhY2goYiA9PiBhZGRDbGFzc0RlY29yYXRvcihiKSk7XG5cbiAgICAgICAgaWYgKGJhc2VDbGFzc0ZpbGUuaXNEZWNsYXJhdGlvbkZpbGUpIHtcbiAgICAgICAgICBjb25zdCBzdGF0aWNTeW1ib2wgPSB0aGlzLl9nZXRTdGF0aWNTeW1ib2xPZklkZW50aWZpZXIoaWRlbnRpZmllcik7XG5cbiAgICAgICAgICAvLyBJZiB0aGUgYmFzZSBjbGFzcyBpcyBkZWNvcmF0ZWQgdGhyb3VnaCBtZXRhZGF0YSBmaWxlcywgd2UgZG9uJ3RcbiAgICAgICAgICAvLyBuZWVkIHRvIGFkZCBhIGNvbW1lbnQgdG8gdGhlIGRlcml2ZWQgY2xhc3MgZm9yIHRoZSBleHRlcm5hbCBiYXNlIGNsYXNzLlxuICAgICAgICAgIGlmIChzdGF0aWNTeW1ib2wgJiYgaXNDbGFzc0RlY29yYXRlZChzdGF0aWNTeW1ib2wpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBsYXN0IGNsYXNzIGluIHRoZSBpbmhlcml0YW5jZSBjaGFpbiB0aGF0IGlzIGRlY29yYXRlZCBhbmQgd2lsbCBiZVxuICAgICAgICAgIC8vIHVzZWQgYXMgYW5jaG9yIGZvciBhIGNvbW1lbnQgZXhwbGFpbmluZyB0aGF0IHRoZSBjbGFzcyB0aGF0IGRlZmluZXMgdGhlXG4gICAgICAgICAgLy8gY29uc3RydWN0b3IgY2Fubm90IGJlIGRlY29yYXRlZCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAgIGNvbnN0IGxhc3REZWNvcmF0ZWRDbGFzcyA9XG4gICAgICAgICAgICAgIHVuZGVjb3JhdGVkQmFzZUNsYXNzZXNbdW5kZWNvcmF0ZWRCYXNlQ2xhc3Nlcy5sZW5ndGggLSAxXSB8fCBub2RlO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9hZGRNaXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvclRvZG8obGFzdERlY29yYXRlZENsYXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlY29yYXRlIHRoZSBjbGFzcyB0aGF0IGRlZmluZXMgdGhlIGNvbnN0cnVjdG9yIHRoYXQgaXMgaW5oZXJpdGVkLlxuICAgICAgICBhZGRDbGFzc0RlY29yYXRvcihiYXNlQ2xhc3MpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIHRoZSBjbGFzcyBkZWNvcmF0b3IgZm9yIGFsbCBiYXNlIGNsYXNzZXMgaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluIHVudGlsXG4gICAgICAvLyB0aGUgYmFzZSBjbGFzcyB3aXRoIHRoZSBleHBsaWNpdCBjb25zdHJ1Y3Rvci4gVGhlIGRlY29yYXRvciB3aWxsIGJlIG9ubHlcbiAgICAgIC8vIGFkZGVkIGZvciBiYXNlIGNsYXNzZXMgd2hpY2ggY2FuIGJlIG1vZGlmaWVkLlxuICAgICAgaWYgKCFiYXNlQ2xhc3NGaWxlLmlzRGVjbGFyYXRpb25GaWxlKSB7XG4gICAgICAgIHVuZGVjb3JhdGVkQmFzZUNsYXNzZXMucHVzaChiYXNlQ2xhc3MpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgYWJzdHJhY3QgXCJARGlyZWN0aXZlKClcIiBkZWNvcmF0b3IgdG8gdGhlIGdpdmVuIGNsYXNzIGluIGNhc2UgdGhlcmVcbiAgICogaXMgbm8gZXhpc3RpbmcgZGlyZWN0aXZlIGRlY29yYXRvci5cbiAgICovXG4gIHByaXZhdGUgX2FkZEFic3RyYWN0RGlyZWN0aXZlRGVjb3JhdG9yKGJhc2VDbGFzczogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGlmIChoYXNEaXJlY3RpdmVEZWNvcmF0b3IoYmFzZUNsYXNzLCB0aGlzLnR5cGVDaGVja2VyKSB8fFxuICAgICAgICB0aGlzLmRlY29yYXRlZERpcmVjdGl2ZXMuaGFzKGJhc2VDbGFzcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlQ2xhc3NGaWxlID0gYmFzZUNsYXNzLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIoYmFzZUNsYXNzRmlsZSk7XG4gICAgY29uc3QgZGlyZWN0aXZlRXhwciA9XG4gICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoYmFzZUNsYXNzRmlsZSwgJ0RpcmVjdGl2ZScsICdAYW5ndWxhci9jb3JlJyk7XG5cbiAgICBjb25zdCBuZXdEZWNvcmF0b3IgPSB0cy5jcmVhdGVEZWNvcmF0b3IodHMuY3JlYXRlQ2FsbChkaXJlY3RpdmVFeHByLCB1bmRlZmluZWQsIFtdKSk7XG4gICAgY29uc3QgbmV3RGVjb3JhdG9yVGV4dCA9XG4gICAgICAgIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0RlY29yYXRvciwgYmFzZUNsYXNzRmlsZSk7XG5cbiAgICByZWNvcmRlci5hZGRDbGFzc0RlY29yYXRvcihiYXNlQ2xhc3MsIG5ld0RlY29yYXRvclRleHQpO1xuICAgIHRoaXMuZGVjb3JhdGVkRGlyZWN0aXZlcy5hZGQoYmFzZUNsYXNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBhYnN0cmFjdCBcIkBJbmplY3RhYmxlKClcIiBkZWNvcmF0b3IgdG8gdGhlIGdpdmVuIGNsYXNzIGluIGNhc2UgdGhlcmVcbiAgICogaXMgbm8gZXhpc3RpbmcgZGlyZWN0aXZlIGRlY29yYXRvci5cbiAgICovXG4gIHByaXZhdGUgX2FkZEluamVjdGFibGVEZWNvcmF0b3IoYmFzZUNsYXNzOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgaWYgKGhhc0luamVjdGFibGVEZWNvcmF0b3IoYmFzZUNsYXNzLCB0aGlzLnR5cGVDaGVja2VyKSB8fFxuICAgICAgICB0aGlzLmRlY29yYXRlZFByb3ZpZGVycy5oYXMoYmFzZUNsYXNzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VDbGFzc0ZpbGUgPSBiYXNlQ2xhc3MuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihiYXNlQ2xhc3NGaWxlKTtcbiAgICBjb25zdCBpbmplY3RhYmxlRXhwciA9XG4gICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoYmFzZUNsYXNzRmlsZSwgJ0luamVjdGFibGUnLCAnQGFuZ3VsYXIvY29yZScpO1xuXG4gICAgY29uc3QgbmV3RGVjb3JhdG9yID0gdHMuY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoaW5qZWN0YWJsZUV4cHIsIHVuZGVmaW5lZCwgW10pKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JUZXh0ID1cbiAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yLCBiYXNlQ2xhc3NGaWxlKTtcblxuICAgIHJlY29yZGVyLmFkZENsYXNzRGVjb3JhdG9yKGJhc2VDbGFzcywgbmV3RGVjb3JhdG9yVGV4dCk7XG4gICAgdGhpcy5kZWNvcmF0ZWRQcm92aWRlcnMuYWRkKGJhc2VDbGFzcyk7XG4gIH1cblxuICAvKiogQWRkcyBhIGNvbW1lbnQgZm9yIGFkZGluZyBhbiBleHBsaWNpdCBjb25zdHJ1Y3RvciB0byB0aGUgZ2l2ZW4gY2xhc3MgZGVjbGFyYXRpb24uICovXG4gIHByaXZhdGUgX2FkZE1pc3NpbmdFeHBsaWNpdENvbnN0cnVjdG9yVG9kbyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICAvLyBJbiBjYXNlIGEgdG9kbyBjb21tZW50IGhhcyBiZWVuIGFscmVhZHkgaW5zZXJ0ZWQgdG8gdGhlIGdpdmVuIGNsYXNzLCB3ZSBkb24ndFxuICAgIC8vIHdhbnQgdG8gYWRkIGEgY29tbWVudCBvciB0cmFuc2Zvcm0gZmFpbHVyZSBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAodGhpcy5taXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvckNsYXNzZXMuaGFzKG5vZGUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHRoaXMubWlzc2luZ0V4cGxpY2l0Q29uc3RydWN0b3JDbGFzc2VzLmFkZChub2RlKTtcbiAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIobm9kZS5nZXRTb3VyY2VGaWxlKCkpO1xuICAgIHJlY29yZGVyLmFkZENsYXNzQ29tbWVudChub2RlLCAnVE9ETzogYWRkIGV4cGxpY2l0IGNvbnN0cnVjdG9yJyk7XG4gICAgcmV0dXJuIFt7bm9kZTogbm9kZSwgbWVzc2FnZTogJ0NsYXNzIG5lZWRzIHRvIGRlY2xhcmUgYW4gZXhwbGljaXQgY29uc3RydWN0b3IuJ31dO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIHVuZGVjb3JhdGVkIGRpcmVjdGl2ZXMgd2hpY2ggd2VyZSByZWZlcmVuY2VkIGluIE5nTW9kdWxlIGRlY2xhcmF0aW9ucy5cbiAgICogVGhlc2UgZGlyZWN0aXZlcyBpbmhlcml0IHRoZSBtZXRhZGF0YSBmcm9tIGEgcGFyZW50IGJhc2UgY2xhc3MsIGJ1dCB3aXRoIEl2eVxuICAgKiB0aGVzZSBjbGFzc2VzIG5lZWQgdG8gZXhwbGljaXRseSBoYXZlIGEgZGVjb3JhdG9yIGZvciBsb2NhbGl0eS4gVGhlIG1pZ3JhdGlvblxuICAgKiBkZXRlcm1pbmVzIHRoZSBpbmhlcml0ZWQgZGVjb3JhdG9yIGFuZCBjb3BpZXMgaXQgdG8gdGhlIHVuZGVjb3JhdGVkIGRlY2xhcmF0aW9uLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhlIG1pZ3JhdGlvbiBzZXJpYWxpemVzIHRoZSBtZXRhZGF0YSBmb3IgZXh0ZXJuYWwgZGVjbGFyYXRpb25zXG4gICAqIHdoZXJlIHRoZSBkZWNvcmF0b3IgaXMgbm90IHBhcnQgb2YgdGhlIHNvdXJjZSBmaWxlIEFTVC5cbiAgICpcbiAgICogU2VlIGNhc2UgMiBpbiB0aGUgbWlncmF0aW9uIHBsYW46IGh0dHBzOi8vaGFja21kLmlvL0BhbHgvUzFYS3FNWmVTXG4gICAqL1xuICBtaWdyYXRlVW5kZWNvcmF0ZWREZWNsYXJhdGlvbnMoZGlyZWN0aXZlczogdHMuQ2xhc3NEZWNsYXJhdGlvbltdKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gZGlyZWN0aXZlcy5yZWR1Y2UoXG4gICAgICAgIChmYWlsdXJlcywgbm9kZSkgPT4gZmFpbHVyZXMuY29uY2F0KHRoaXMuX21pZ3JhdGVEZXJpdmVkRGVjbGFyYXRpb24obm9kZSkpLFxuICAgICAgICBbXSBhcyBUcmFuc2Zvcm1GYWlsdXJlW10pO1xuICB9XG5cbiAgcHJpdmF0ZSBfbWlncmF0ZURlcml2ZWREZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICBjb25zdCB0YXJnZXRTb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3Qgb3JkZXJlZEJhc2VDbGFzc2VzID0gZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9ucyhub2RlLCB0aGlzLnR5cGVDaGVja2VyKTtcbiAgICBsZXQgbmV3RGVjb3JhdG9yVGV4dDogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQge25vZGU6IGJhc2VDbGFzcywgaWRlbnRpZmllcn0gb2Ygb3JkZXJlZEJhc2VDbGFzc2VzKSB7XG4gICAgICAvLyBCZWZvcmUgbG9va2luZyBmb3IgZGVjb3JhdG9ycyB3aXRoaW4gdGhlIG1ldGFkYXRhIG9yIHN1bW1hcnkgZmlsZXMsIHdlXG4gICAgICAvLyB0cnkgdG8gZGV0ZXJtaW5lIHRoZSBkaXJlY3RpdmUgZGVjb3JhdG9yIHRocm91Z2ggdGhlIHNvdXJjZSBmaWxlIEFTVC5cbiAgICAgIGlmIChiYXNlQ2xhc3MuZGVjb3JhdG9ycykge1xuICAgICAgICBjb25zdCBuZ0RlY29yYXRvciA9XG4gICAgICAgICAgICBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBiYXNlQ2xhc3MuZGVjb3JhdG9ycylcbiAgICAgICAgICAgICAgICAuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnQ29tcG9uZW50JyB8fCBuYW1lID09PSAnRGlyZWN0aXZlJyB8fCBuYW1lID09PSAnUGlwZScpO1xuXG4gICAgICAgIGlmIChuZ0RlY29yYXRvcikge1xuICAgICAgICAgIGNvbnN0IG5ld0RlY29yYXRvciA9IHRoaXMuZGVjb3JhdG9yUmV3cml0ZXIucmV3cml0ZShuZ0RlY29yYXRvciwgbm9kZS5nZXRTb3VyY2VGaWxlKCkpO1xuICAgICAgICAgIG5ld0RlY29yYXRvclRleHQgPSB0aGlzLnByaW50ZXIucHJpbnROb2RlKFxuICAgICAgICAgICAgICB0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yLCBuZ0RlY29yYXRvci5ub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gbWV0YWRhdGEgY291bGQgYmUgZm91bmQgd2l0aGluIHRoZSBzb3VyY2UtZmlsZSBBU1QsIHRyeSB0byBmaW5kXG4gICAgICAvLyBkZWNvcmF0b3IgZGF0YSB0aHJvdWdoIEFuZ3VsYXIgbWV0YWRhdGEgYW5kIHN1bW1hcnkgZmlsZXMuXG4gICAgICBjb25zdCBzdGF0aWNTeW1ib2wgPSB0aGlzLl9nZXRTdGF0aWNTeW1ib2xPZklkZW50aWZpZXIoaWRlbnRpZmllcik7XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSBzdGF0aWMgc3ltYm9sIHJlc29sdmVzIHRvIGEgY2xhc3MgZGVjbGFyYXRpb24gd2l0aFxuICAgICAgLy8gcGlwZSBvciBkaXJlY3RpdmUgbWV0YWRhdGEuXG4gICAgICBpZiAoIXN0YXRpY1N5bWJvbCB8fFxuICAgICAgICAgICEodGhpcy5tZXRhZGF0YVJlc29sdmVyLmlzUGlwZShzdGF0aWNTeW1ib2wpIHx8XG4gICAgICAgICAgICB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuaXNEaXJlY3RpdmUoc3RhdGljU3ltYm9sKSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fcmVzb2x2ZURlY2xhcmF0aW9uTWV0YWRhdGEoc3RhdGljU3ltYm9sKTtcblxuICAgICAgLy8gSWYgbm8gbWV0YWRhdGEgY291bGQgYmUgcmVzb2x2ZWQgZm9yIHRoZSBzdGF0aWMgc3ltYm9sLCBwcmludCBhIGZhaWx1cmUgbWVzc2FnZVxuICAgICAgLy8gYW5kIGFzayB0aGUgZGV2ZWxvcGVyIHRvIG1hbnVhbGx5IG1pZ3JhdGUgdGhlIGNsYXNzLiBUaGlzIGNhc2UgaXMgcmFyZSBiZWNhdXNlXG4gICAgICAvLyB1c3VhbGx5IGRlY29yYXRvciBtZXRhZGF0YSBpcyBhbHdheXMgcHJlc2VudCBidXQganVzdCBjYW4ndCBiZSByZWFkIGlmIGEgcHJvZ3JhbVxuICAgICAgLy8gb25seSBoYXMgYWNjZXNzIHRvIHN1bW1hcmllcyAodGhpcyBpcyBhIHNwZWNpYWwgY2FzZSBpbiBnb29nbGUzKS5cbiAgICAgIGlmICghbWV0YWRhdGEpIHtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBtZXNzYWdlOiBgQ2xhc3MgY2Fubm90IGJlIG1pZ3JhdGVkIGFzIHRoZSBpbmhlcml0ZWQgbWV0YWRhdGEgZnJvbSBgICtcbiAgICAgICAgICAgICAgYCR7aWRlbnRpZmllci5nZXRUZXh0KCl9IGNhbm5vdCBiZSBjb252ZXJ0ZWQgaW50byBhIGRlY29yYXRvci4gUGxlYXNlIG1hbnVhbGx5XG4gICAgICAgICAgICBkZWNvcmF0ZSB0aGUgY2xhc3MuYCxcbiAgICAgICAgfV07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld0RlY29yYXRvciA9IHRoaXMuX2NvbnN0cnVjdERlY29yYXRvckZyb21NZXRhZGF0YShtZXRhZGF0YSwgdGFyZ2V0U291cmNlRmlsZSk7XG4gICAgICBpZiAoIW5ld0RlY29yYXRvcikge1xuICAgICAgICBjb25zdCBhbm5vdGF0aW9uVHlwZSA9IG1ldGFkYXRhLnR5cGU7XG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogYENsYXNzIGNhbm5vdCBiZSBtaWdyYXRlZCBhcyB0aGUgaW5oZXJpdGVkIEAke2Fubm90YXRpb25UeXBlfSBkZWNvcmF0b3IgYCArXG4gICAgICAgICAgICAgIGBjYW5ub3QgYmUgY29waWVkLiBQbGVhc2UgbWFudWFsbHkgYWRkIGEgQCR7YW5ub3RhdGlvblR5cGV9IGRlY29yYXRvci5gLFxuICAgICAgICB9XTtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gY2FzZSB0aGUgZGVjb3JhdG9yIGNvdWxkIGJlIGNvbnN0cnVjdGVkIGZyb20gdGhlIHJlc29sdmVkIG1ldGFkYXRhLCB1c2VcbiAgICAgIC8vIHRoYXQgZGVjb3JhdG9yIGZvciB0aGUgZGVyaXZlZCB1bmRlY29yYXRlZCBjbGFzc2VzLlxuICAgICAgbmV3RGVjb3JhdG9yVGV4dCA9XG4gICAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yLCB0YXJnZXRTb3VyY2VGaWxlKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmICghbmV3RGVjb3JhdG9yVGV4dCkge1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgIG5vZGUsXG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAnQ2xhc3MgY2Fubm90IGJlIG1pZ3JhdGVkIGFzIG5vIGRpcmVjdGl2ZS9jb21wb25lbnQvcGlwZSBtZXRhZGF0YSBjb3VsZCBiZSBmb3VuZC4gJyArXG4gICAgICAgICAgICAnUGxlYXNlIG1hbnVhbGx5IGFkZCBhIEBEaXJlY3RpdmUsIEBDb21wb25lbnQgb3IgQFBpcGUgZGVjb3JhdG9yLidcbiAgICAgIH1dO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIodGFyZ2V0U291cmNlRmlsZSkuYWRkQ2xhc3NEZWNvcmF0b3Iobm9kZSwgbmV3RGVjb3JhdG9yVGV4dCk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLyoqIFJlY29yZHMgYWxsIGNoYW5nZXMgdGhhdCB3ZXJlIG1hZGUgaW4gdGhlIGltcG9ydCBtYW5hZ2VyLiAqL1xuICByZWNvcmRDaGFuZ2VzKCkge1xuICAgIHRoaXMuaW1wb3J0TWFuYWdlci5yZWNvcmRDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIFR5cGVTY3JpcHQgZGVjb3JhdG9yIG5vZGUgZnJvbSB0aGUgc3BlY2lmaWVkIGRlY2xhcmF0aW9uIG1ldGFkYXRhLiBSZXR1cm5zXG4gICAqIG51bGwgaWYgdGhlIG1ldGFkYXRhIGNvdWxkIG5vdCBiZSBzaW1wbGlmaWVkL3Jlc29sdmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY29uc3RydWN0RGVjb3JhdG9yRnJvbU1ldGFkYXRhKFxuICAgICAgZGlyZWN0aXZlTWV0YWRhdGE6IERlY2xhcmF0aW9uTWV0YWRhdGEsIHRhcmdldFNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5EZWNvcmF0b3J8bnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRlY29yYXRvckV4cHIgPSBjb252ZXJ0RGlyZWN0aXZlTWV0YWRhdGFUb0V4cHJlc3Npb24oXG4gICAgICAgICAgdGhpcy5jb21waWxlck1vZHVsZSwgZGlyZWN0aXZlTWV0YWRhdGEubWV0YWRhdGEsXG4gICAgICAgICAgc3RhdGljU3ltYm9sID0+XG4gICAgICAgICAgICAgIHRoaXMuY29tcGlsZXJIb3N0XG4gICAgICAgICAgICAgICAgICAuZmlsZU5hbWVUb01vZHVsZU5hbWUoc3RhdGljU3ltYm9sLmZpbGVQYXRoLCB0YXJnZXRTb3VyY2VGaWxlLmZpbGVOYW1lKVxuICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcL2luZGV4JC8sICcnKSxcbiAgICAgICAgICAobW9kdWxlTmFtZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpID0+XG4gICAgICAgICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUodGFyZ2V0U291cmNlRmlsZSwgbmFtZSwgbW9kdWxlTmFtZSksXG4gICAgICAgICAgKHByb3BlcnR5TmFtZSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgIC8vIE9ubHkgbm9ybWFsaXplIHByb3BlcnRpZXMgY2FsbGVkIFwiY2hhbmdlRGV0ZWN0aW9uXCIgYW5kIFwiZW5jYXBzdWxhdGlvblwiXG4gICAgICAgICAgICAvLyBmb3IgXCJARGlyZWN0aXZlXCIgYW5kIFwiQENvbXBvbmVudFwiIGFubm90YXRpb25zLlxuICAgICAgICAgICAgaWYgKGRpcmVjdGl2ZU1ldGFkYXRhLnR5cGUgPT09ICdQaXBlJykge1xuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSW5zdGVhZCBvZiB1c2luZyB0aGUgbnVtYmVyIGFzIHZhbHVlIGZvciB0aGUgXCJjaGFuZ2VEZXRlY3Rpb25cIiBhbmRcbiAgICAgICAgICAgIC8vIFwiZW5jYXBzdWxhdGlvblwiIHByb3BlcnRpZXMsIHdlIHdhbnQgdG8gdXNlIHRoZSBhY3R1YWwgZW51bSBzeW1ib2xzLlxuICAgICAgICAgICAgaWYgKHByb3BlcnR5TmFtZSA9PT0gJ2NoYW5nZURldGVjdGlvbicgJiYgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICByZXR1cm4gdHMuY3JlYXRlUHJvcGVydHlBY2Nlc3MoXG4gICAgICAgICAgICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKFxuICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFNvdXJjZUZpbGUsICdDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneScsICdAYW5ndWxhci9jb3JlJyksXG4gICAgICAgICAgICAgICAgICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneVt2YWx1ZV0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eU5hbWUgPT09ICdlbmNhcHN1bGF0aW9uJyAmJiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cy5jcmVhdGVQcm9wZXJ0eUFjY2VzcyhcbiAgICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoXG4gICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0U291cmNlRmlsZSwgJ1ZpZXdFbmNhcHN1bGF0aW9uJywgJ0Bhbmd1bGFyL2NvcmUnKSxcbiAgICAgICAgICAgICAgICAgIFZpZXdFbmNhcHN1bGF0aW9uW3ZhbHVlXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRzLmNyZWF0ZURlY29yYXRvcih0cy5jcmVhdGVDYWxsKFxuICAgICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoXG4gICAgICAgICAgICAgIHRhcmdldFNvdXJjZUZpbGUsIGRpcmVjdGl2ZU1ldGFkYXRhLnR5cGUsICdAYW5ndWxhci9jb3JlJyksXG4gICAgICAgICAgdW5kZWZpbmVkLCBbZGVjb3JhdG9yRXhwcl0pKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIFVuZXhwZWN0ZWRNZXRhZGF0YVZhbHVlRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyB0aGUgZGVjbGFyYXRpb24gbWV0YWRhdGEgb2YgYSBnaXZlbiBzdGF0aWMgc3ltYm9sLiBUaGUgbWV0YWRhdGFcbiAgICogaXMgZGV0ZXJtaW5lZCBieSByZXNvbHZpbmcgbWV0YWRhdGEgZm9yIHRoZSBzdGF0aWMgc3ltYm9sLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzb2x2ZURlY2xhcmF0aW9uTWV0YWRhdGEoc3ltYm9sOiBTdGF0aWNTeW1ib2wpOiBudWxsfERlY2xhcmF0aW9uTWV0YWRhdGEge1xuICAgIHRyeSB7XG4gICAgICAvLyBOb3RlIHRoYXQgdGhpcyBjYWxsIGNhbiB0aHJvdyBpZiB0aGUgbWV0YWRhdGEgaXMgbm90IGNvbXB1dGFibGUuIEluIHRoYXRcbiAgICAgIC8vIGNhc2Ugd2UgYXJlIG5vdCBhYmxlIHRvIHNlcmlhbGl6ZSB0aGUgbWV0YWRhdGEgaW50byBhIGRlY29yYXRvciBhbmQgd2UgcmV0dXJuXG4gICAgICAvLyBudWxsLlxuICAgICAgY29uc3QgYW5ub3RhdGlvbnMgPSB0aGlzLmNvbXBpbGVyLnJlZmxlY3Rvci5hbm5vdGF0aW9ucyhzeW1ib2wpLmZpbmQoXG4gICAgICAgICAgcyA9PiBzLm5nTWV0YWRhdGFOYW1lID09PSAnQ29tcG9uZW50JyB8fCBzLm5nTWV0YWRhdGFOYW1lID09PSAnRGlyZWN0aXZlJyB8fFxuICAgICAgICAgICAgICBzLm5nTWV0YWRhdGFOYW1lID09PSAnUGlwZScpO1xuXG4gICAgICBpZiAoIWFubm90YXRpb25zKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7bmdNZXRhZGF0YU5hbWUsIC4uLm1ldGFkYXRhfSA9IGFubm90YXRpb25zO1xuXG4gICAgICAvLyBEZWxldGUgdGhlIFwibmdNZXRhZGF0YU5hbWVcIiBwcm9wZXJ0eSBhcyB3ZSBkb24ndCB3YW50IHRvIGdlbmVyYXRlXG4gICAgICAvLyBhIHByb3BlcnR5IGFzc2lnbm1lbnQgaW4gdGhlIG5ldyBkZWNvcmF0b3IgZm9yIHRoYXQgaW50ZXJuYWwgcHJvcGVydHkuXG4gICAgICBkZWxldGUgbWV0YWRhdGFbJ25nTWV0YWRhdGFOYW1lJ107XG5cbiAgICAgIHJldHVybiB7dHlwZTogbmdNZXRhZGF0YU5hbWUsIG1ldGFkYXRhfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRTdGF0aWNTeW1ib2xPZklkZW50aWZpZXIobm9kZTogdHMuSWRlbnRpZmllcik6IFN0YXRpY1N5bWJvbHxudWxsIHtcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgcmVzb2x2ZWRJbXBvcnQgPSBnZXRJbXBvcnRPZklkZW50aWZpZXIodGhpcy50eXBlQ2hlY2tlciwgbm9kZSk7XG5cbiAgICBpZiAoIXJlc29sdmVkSW1wb3J0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVOYW1lID1cbiAgICAgICAgdGhpcy5jb21waWxlckhvc3QubW9kdWxlTmFtZVRvRmlsZU5hbWUocmVzb2x2ZWRJbXBvcnQuaW1wb3J0TW9kdWxlLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcblxuICAgIGlmICghbW9kdWxlTmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gRmluZCB0aGUgZGVjbGFyYXRpb24gc3ltYm9sIGFzIHN5bWJvbHMgY291bGQgYmUgYWxpYXNlZCBkdWUgdG9cbiAgICAvLyBtZXRhZGF0YSByZS1leHBvcnRzLlxuICAgIHJldHVybiB0aGlzLmNvbXBpbGVyLnJlZmxlY3Rvci5maW5kU3ltYm9sRGVjbGFyYXRpb24oXG4gICAgICAgIHRoaXMuc3ltYm9sUmVzb2x2ZXIuZ2V0U3RhdGljU3ltYm9sKG1vZHVsZU5hbWUsIHJlc29sdmVkSW1wb3J0Lm5hbWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlcyB0aGF0IHN0YXRpYyBzeW1ib2xzIGFyZSByZXNvbHZlZCB0aHJvdWdoIHN1bW1hcmllcy4gU3VtbWFyaWVzXG4gICAqIGNhbm5vdCBiZSB1c2VkIGZvciBkZWNvcmF0b3IgYW5hbHlzaXMgYXMgZGVjb3JhdG9ycyBhcmUgb21pdHRlZCBpbiBzdW1tYXJpZXMuXG4gICAqL1xuICBwcml2YXRlIF9kaXNhYmxlU3VtbWFyeVJlc29sdXRpb24oKSB7XG4gICAgLy8gV2UgbmV2ZXIgd2FudCB0byByZXNvbHZlIHN5bWJvbHMgdGhyb3VnaCBzdW1tYXJpZXMuIFN1bW1hcmllcyBuZXZlciBjb250YWluXG4gICAgLy8gZGVjb3JhdG9ycyBmb3IgY2xhc3Mgc3ltYm9scyBhbmQgdGhlcmVmb3JlIHN1bW1hcmllcyB3aWxsIGNhdXNlIGV2ZXJ5IGNsYXNzXG4gICAgLy8gdG8gYmUgY29uc2lkZXJlZCBhcyB1bmRlY29yYXRlZC4gU2VlIHJlYXNvbiBmb3IgdGhpcyBpbjogXCJUb0pzb25TZXJpYWxpemVyXCIuXG4gICAgLy8gSW4gb3JkZXIgdG8gZW5zdXJlIHRoYXQgbWV0YWRhdGEgaXMgbm90IHJldHJpZXZlZCB0aHJvdWdoIHN1bW1hcmllcywgd2VcbiAgICAvLyBuZWVkIHRvIGRpc2FibGUgc3VtbWFyeSByZXNvbHV0aW9uLCBjbGVhciBwcmV2aW91cyBzeW1ib2wgY2FjaGVzLiBUaGlzIHdheVxuICAgIC8vIGZ1dHVyZSBjYWxscyB0byBcIlN0YXRpY1JlZmxlY3RvciNhbm5vdGF0aW9uc1wiIGFyZSBiYXNlZCBvbiBtZXRhZGF0YSBmaWxlcy5cbiAgICB0aGlzLnN5bWJvbFJlc29sdmVyWydfcmVzb2x2ZVN5bWJvbEZyb21TdW1tYXJ5J10gPSAoKSA9PiBudWxsO1xuICAgIHRoaXMuc3ltYm9sUmVzb2x2ZXJbJ3Jlc29sdmVkU3ltYm9scyddLmNsZWFyKCk7XG4gICAgdGhpcy5zeW1ib2xSZXNvbHZlclsnc3ltYm9sRnJvbUZpbGUnXS5jbGVhcigpO1xuICAgIHRoaXMuY29tcGlsZXIucmVmbGVjdG9yWydhbm5vdGF0aW9uQ2FjaGUnXS5jbGVhcigpO1xuXG4gICAgLy8gT3JpZ2luYWwgc3VtbWFyeSByZXNvbHZlciB1c2VkIGJ5IHRoZSBBT1QgY29tcGlsZXIuXG4gICAgY29uc3Qgc3VtbWFyeVJlc29sdmVyID0gdGhpcy5zeW1ib2xSZXNvbHZlclsnc3VtbWFyeVJlc29sdmVyJ107XG5cbiAgICAvLyBBZGRpdGlvbmFsbHkgd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBubyBmaWxlcyBhcmUgdHJlYXRlZCBhcyBcImxpYnJhcnlcIiBmaWxlcyB3aGVuXG4gICAgLy8gcmVzb2x2aW5nIG1ldGFkYXRhLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGJ5IGRlZmF1bHQgdGhlIHN5bWJvbCByZXNvbHZlciBkaXNjYXJkc1xuICAgIC8vIGNsYXNzIG1ldGFkYXRhIGZvciBsaWJyYXJ5IGZpbGVzLiBTZWUgXCJTdGF0aWNTeW1ib2xSZXNvbHZlciNjcmVhdGVSZXNvbHZlZFN5bWJvbFwiLlxuICAgIC8vIFBhdGNoaW5nIHRoaXMgZnVuY3Rpb24gKipvbmx5KiogZm9yIHRoZSBzdGF0aWMgc3ltYm9sIHJlc29sdmVyIGVuc3VyZXMgdGhhdCBtZXRhZGF0YVxuICAgIC8vIGlzIG5vdCBpbmNvcnJlY3RseSBvbWl0dGVkLiBOb3RlIHRoYXQgd2Ugb25seSB3YW50IHRvIGRvIHRoaXMgZm9yIHRoZSBzeW1ib2wgcmVzb2x2ZXJcbiAgICAvLyBiZWNhdXNlIG90aGVyd2lzZSB3ZSBjb3VsZCBicmVhayB0aGUgc3VtbWFyeSBsb2FkaW5nIGxvZ2ljIHdoaWNoIGlzIHVzZWQgdG8gZGV0ZWN0XG4gICAgLy8gaWYgYSBzdGF0aWMgc3ltYm9sIGlzIGVpdGhlciBhIGRpcmVjdGl2ZSwgY29tcG9uZW50IG9yIHBpcGUgKHNlZSBNZXRhZGF0YVJlc29sdmVyKS5cbiAgICB0aGlzLnN5bWJvbFJlc29sdmVyWydzdW1tYXJ5UmVzb2x2ZXInXSA9IDxTdW1tYXJ5UmVzb2x2ZXI8U3RhdGljU3ltYm9sPj57XG4gICAgICBmcm9tU3VtbWFyeUZpbGVOYW1lOiBzdW1tYXJ5UmVzb2x2ZXIuZnJvbVN1bW1hcnlGaWxlTmFtZS5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICBhZGRTdW1tYXJ5OiBzdW1tYXJ5UmVzb2x2ZXIuYWRkU3VtbWFyeS5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICBnZXRJbXBvcnRBczogc3VtbWFyeVJlc29sdmVyLmdldEltcG9ydEFzLmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIGdldEtub3duTW9kdWxlTmFtZTogc3VtbWFyeVJlc29sdmVyLmdldEtub3duTW9kdWxlTmFtZS5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICByZXNvbHZlU3VtbWFyeTogc3VtbWFyeVJlc29sdmVyLnJlc29sdmVTdW1tYXJ5LmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIHRvU3VtbWFyeUZpbGVOYW1lOiBzdW1tYXJ5UmVzb2x2ZXIudG9TdW1tYXJ5RmlsZU5hbWUuYmluZChzdW1tYXJ5UmVzb2x2ZXIpLFxuICAgICAgZ2V0U3ltYm9sc09mOiBzdW1tYXJ5UmVzb2x2ZXIuZ2V0U3ltYm9sc09mLmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIGlzTGlicmFyeUZpbGU6ICgpID0+IGZhbHNlLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==