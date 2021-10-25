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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/transform", ["require", "exports", "typescript", "@angular/core/schematics/utils/import_manager", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/class_declaration", "@angular/core/schematics/utils/typescript/find_base_classes", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/decorator_rewriter", "@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndecoratedClassesTransform = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const import_manager_1 = require("@angular/core/schematics/utils/import_manager");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const class_declaration_1 = require("@angular/core/schematics/utils/typescript/class_declaration");
    const find_base_classes_1 = require("@angular/core/schematics/utils/typescript/find_base_classes");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const convert_directive_metadata_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata");
    const decorator_rewriter_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/decorator_rewriter");
    const ng_declaration_collector_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/ng_declaration_collector");
    class UndecoratedClassesTransform {
        constructor(typeChecker, compiler, getUpdateRecorder, compilerModule, coreModule) {
            this.typeChecker = typeChecker;
            this.compiler = compiler;
            this.getUpdateRecorder = getUpdateRecorder;
            this.compilerModule = compilerModule;
            this.coreModule = coreModule;
            this.printer = typescript_1.default.createPrinter({ newLine: typescript_1.default.NewLineKind.LineFeed });
            this.importManager = new import_manager_1.ImportManager(this.getUpdateRecorder, this.printer);
            this.decoratorRewriter = new decorator_rewriter_1.DecoratorRewriter(this.importManager, this.typeChecker, this.compiler);
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
            const newDecorator = typescript_1.default.createDecorator(typescript_1.default.createCall(directiveExpr, undefined, []));
            const newDecoratorText = this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newDecorator, baseClassFile);
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
            const newDecorator = typescript_1.default.createDecorator(typescript_1.default.createCall(injectableExpr, undefined, []));
            const newDecoratorText = this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newDecorator, baseClassFile);
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
                        newDecoratorText = this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newDecorator, ngDecorator.node.getSourceFile());
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
                    this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newDecorator, targetSourceFile);
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
                        return typescript_1.default.createPropertyAccess(this.importManager.addImportToSourceFile(targetSourceFile, 'ChangeDetectionStrategy', '@angular/core'), this.coreModule.ChangeDetectionStrategy[value]);
                    }
                    else if (propertyName === 'encapsulation' && typeof value === 'number') {
                        return typescript_1.default.createPropertyAccess(this.importManager.addImportToSourceFile(targetSourceFile, 'ViewEncapsulation', '@angular/core'), this.coreModule.ViewEncapsulation[value]);
                    }
                    return null;
                });
                return typescript_1.default.createDecorator(typescript_1.default.createCall(this.importManager.addImportToSourceFile(targetSourceFile, directiveMetadata.type, '@angular/core'), undefined, [decoratorExpr]));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdILDREQUE0QjtJQUU1QixrRkFBeUQ7SUFDekQsZ0ZBQStEO0lBQy9ELG1HQUFnRjtJQUNoRixtR0FBbUY7SUFDbkYsK0VBQXFFO0lBRXJFLDZKQUFrSTtJQUNsSSw2SUFBeUU7SUFDekUsdUlBQXlGO0lBZ0J6RixNQUFhLDJCQUEyQjtRQW9CdEMsWUFDWSxXQUEyQixFQUFVLFFBQXFCLEVBQzFELGlCQUF3RCxFQUN4RCxjQUFrRCxFQUNsRCxVQUEwQztZQUgxQyxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBQzFELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUM7WUFDeEQsbUJBQWMsR0FBZCxjQUFjLENBQW9DO1lBQ2xELGVBQVUsR0FBVixVQUFVLENBQWdDO1lBdkI5QyxZQUFPLEdBQUcsb0JBQUUsQ0FBQyxhQUFhLENBQUMsRUFBQyxPQUFPLEVBQUUsb0JBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztZQUMvRCxrQkFBYSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hFLHNCQUFpQixHQUNyQixJQUFJLHNDQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFNL0UsNkVBQTZFO1lBQ3JFLHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lB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RSxDQUFDO1lBQy9DLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRW5ELHNEQUFzRDtZQUN0RCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFL0QsbUZBQW1GO1lBQ25GLHdGQUF3RjtZQUN4RixxRkFBcUY7WUFDckYsdUZBQXVGO1lBQ3ZGLHdGQUF3RjtZQUN4RixxRkFBcUY7WUFDckYsc0ZBQXNGO1lBQ3RGLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsR0FBa0M7Z0JBQ3RFLG1CQUFtQixFQUFFLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM5RSxVQUFVLEVBQUUsZUFBZSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM1RCxXQUFXLEVBQUUsZUFBZSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM5RCxrQkFBa0IsRUFBRSxlQUFlLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDNUUsY0FBYyxFQUFFLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztnQkFDcEUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQzFFLFlBQVksRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQ2hFLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLO2FBQzNCLENBQUM7UUFDSixDQUFDO0tBQ0Y7SUF2YUQsa0VBdWFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtBb3RDb21waWxlciwgQW90Q29tcGlsZXJIb3N0LCBDb21waWxlTWV0YWRhdGFSZXNvbHZlciwgU3RhdGljU3ltYm9sLCBTdGF0aWNTeW1ib2xSZXNvbHZlciwgU3VtbWFyeVJlc29sdmVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0TWFuYWdlcn0gZnJvbSAnLi4vLi4vdXRpbHMvaW1wb3J0X21hbmFnZXInO1xuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9yc30gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge2hhc0V4cGxpY2l0Q29uc3RydWN0b3J9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvY2xhc3NfZGVjbGFyYXRpb24nO1xuaW1wb3J0IHtmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ZpbmRfYmFzZV9jbGFzc2VzJztcbmltcG9ydCB7Z2V0SW1wb3J0T2ZJZGVudGlmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuXG5pbXBvcnQge2NvbnZlcnREaXJlY3RpdmVNZXRhZGF0YVRvRXhwcmVzc2lvbiwgVW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvcn0gZnJvbSAnLi9kZWNvcmF0b3JfcmV3cml0ZS9jb252ZXJ0X2RpcmVjdGl2ZV9tZXRhZGF0YSc7XG5pbXBvcnQge0RlY29yYXRvclJld3JpdGVyfSBmcm9tICcuL2RlY29yYXRvcl9yZXdyaXRlL2RlY29yYXRvcl9yZXdyaXRlcic7XG5pbXBvcnQge2hhc0RpcmVjdGl2ZURlY29yYXRvciwgaGFzSW5qZWN0YWJsZURlY29yYXRvcn0gZnJvbSAnLi9uZ19kZWNsYXJhdGlvbl9jb2xsZWN0b3InO1xuaW1wb3J0IHtVcGRhdGVSZWNvcmRlcn0gZnJvbSAnLi91cGRhdGVfcmVjb3JkZXInO1xuXG5cblxuLyoqIFJlc29sdmVkIG1ldGFkYXRhIG9mIGEgZGVjbGFyYXRpb24uICovXG5pbnRlcmZhY2UgRGVjbGFyYXRpb25NZXRhZGF0YSB7XG4gIG1ldGFkYXRhOiBhbnk7XG4gIHR5cGU6ICdDb21wb25lbnQnfCdEaXJlY3RpdmUnfCdQaXBlJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2Zvcm1GYWlsdXJlIHtcbiAgbm9kZTogdHMuTm9kZTtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVW5kZWNvcmF0ZWRDbGFzc2VzVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcih7bmV3TGluZTogdHMuTmV3TGluZUtpbmQuTGluZUZlZWR9KTtcbiAgcHJpdmF0ZSBpbXBvcnRNYW5hZ2VyID0gbmV3IEltcG9ydE1hbmFnZXIodGhpcy5nZXRVcGRhdGVSZWNvcmRlciwgdGhpcy5wcmludGVyKTtcbiAgcHJpdmF0ZSBkZWNvcmF0b3JSZXdyaXRlciA9XG4gICAgICBuZXcgRGVjb3JhdG9yUmV3cml0ZXIodGhpcy5pbXBvcnRNYW5hZ2VyLCB0aGlzLnR5cGVDaGVja2VyLCB0aGlzLmNvbXBpbGVyKTtcblxuICBwcml2YXRlIGNvbXBpbGVySG9zdDogQW90Q29tcGlsZXJIb3N0O1xuICBwcml2YXRlIHN5bWJvbFJlc29sdmVyOiBTdGF0aWNTeW1ib2xSZXNvbHZlcjtcbiAgcHJpdmF0ZSBtZXRhZGF0YVJlc29sdmVyOiBDb21waWxlTWV0YWRhdGFSZXNvbHZlcjtcblxuICAvKiogU2V0IG9mIGNsYXNzIGRlY2xhcmF0aW9ucyB3aGljaCBoYXZlIGJlZW4gZGVjb3JhdGVkIHdpdGggXCJARGlyZWN0aXZlXCIuICovXG4gIHByaXZhdGUgZGVjb3JhdGVkRGlyZWN0aXZlcyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcbiAgLyoqIFNldCBvZiBjbGFzcyBkZWNsYXJhdGlvbnMgd2hpY2ggaGF2ZSBiZWVuIGRlY29yYXRlZCB3aXRoIFwiQEluamVjdGFibGVcIiAqL1xuICBwcml2YXRlIGRlY29yYXRlZFByb3ZpZGVycyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcbiAgLyoqXG4gICAqIFNldCBvZiBjbGFzcyBkZWNsYXJhdGlvbnMgd2hpY2ggaGF2ZSBiZWVuIGFuYWx5emVkIGFuZCBuZWVkIHRvIHNwZWNpZnlcbiAgICogYW4gZXhwbGljaXQgY29uc3RydWN0b3IuXG4gICAqL1xuICBwcml2YXRlIG1pc3NpbmdFeHBsaWNpdENvbnN0cnVjdG9yQ2xhc3NlcyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBwcml2YXRlIGNvbXBpbGVyOiBBb3RDb21waWxlcixcbiAgICAgIHByaXZhdGUgZ2V0VXBkYXRlUmVjb3JkZXI6IChzZjogdHMuU291cmNlRmlsZSkgPT4gVXBkYXRlUmVjb3JkZXIsXG4gICAgICBwcml2YXRlIGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpLFxuICAgICAgcHJpdmF0ZSBjb3JlTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb3JlJykpIHtcbiAgICB0aGlzLnN5bWJvbFJlc29sdmVyID0gY29tcGlsZXJbJ19zeW1ib2xSZXNvbHZlciddO1xuICAgIHRoaXMuY29tcGlsZXJIb3N0ID0gY29tcGlsZXJbJ19ob3N0J107XG4gICAgdGhpcy5tZXRhZGF0YVJlc29sdmVyID0gY29tcGlsZXJbJ19tZXRhZGF0YVJlc29sdmVyJ107XG5cbiAgICAvLyBVbnNldCB0aGUgZGVmYXVsdCBlcnJvciByZWNvcmRlciBzbyB0aGF0IHRoZSByZWZsZWN0b3Igd2lsbCB0aHJvdyBhbiBleGNlcHRpb25cbiAgICAvLyBpZiBtZXRhZGF0YSBjYW5ub3QgYmUgcmVzb2x2ZWQuXG4gICAgdGhpcy5jb21waWxlci5yZWZsZWN0b3JbJ2Vycm9yUmVjb3JkZXInXSA9IHVuZGVmaW5lZDtcblxuICAgIC8vIERpc2FibGVzIHRoYXQgc3RhdGljIHN5bWJvbHMgYXJlIHJlc29sdmVkIHRocm91Z2ggc3VtbWFyaWVzIGZyb20gd2l0aGluIHRoZSBzdGF0aWNcbiAgICAvLyByZWZsZWN0b3IuIFN1bW1hcmllcyBjYW5ub3QgYmUgdXNlZCBmb3IgZGVjb3JhdG9yIHNlcmlhbGl6YXRpb24gYXMgZGVjb3JhdG9ycyBhcmVcbiAgICAvLyBvbWl0dGVkIGluIHN1bW1hcmllcyBhbmQgdGhlIGRlY29yYXRvciBjYW4ndCBiZSByZWNvbnN0cnVjdGVkIGZyb20gdGhlIGRpcmVjdGl2ZSBzdW1tYXJ5LlxuICAgIHRoaXMuX2Rpc2FibGVTdW1tYXJ5UmVzb2x1dGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIGRlY29yYXRlZCBkaXJlY3RpdmVzIHdoaWNoIGNhbiBwb3RlbnRpYWxseSBpbmhlcml0IGEgY29uc3RydWN0b3JcbiAgICogZnJvbSBhbiB1bmRlY29yYXRlZCBiYXNlIGNsYXNzLiBBbGwgYmFzZSBjbGFzc2VzIHVudGlsIHRoZSBmaXJzdCBvbmVcbiAgICogd2l0aCBhbiBleHBsaWNpdCBjb25zdHJ1Y3RvciB3aWxsIGJlIGRlY29yYXRlZCB3aXRoIHRoZSBhYnN0cmFjdCBcIkBEaXJlY3RpdmUoKVwiXG4gICAqIGRlY29yYXRvci4gU2VlIGNhc2UgMSBpbiB0aGUgbWlncmF0aW9uIHBsYW46IGh0dHBzOi8vaGFja21kLmlvL0BhbHgvUzFYS3FNWmVTXG4gICAqL1xuICBtaWdyYXRlRGVjb3JhdGVkRGlyZWN0aXZlcyhkaXJlY3RpdmVzOiB0cy5DbGFzc0RlY2xhcmF0aW9uW10pOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIHJldHVybiBkaXJlY3RpdmVzLnJlZHVjZShcbiAgICAgICAgKGZhaWx1cmVzLCBub2RlKSA9PiBmYWlsdXJlcy5jb25jYXQodGhpcy5fbWlncmF0ZURpcmVjdGl2ZUJhc2VDbGFzcyhub2RlKSksXG4gICAgICAgIFtdIGFzIFRyYW5zZm9ybUZhaWx1cmVbXSk7XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgZGVjb3JhdGVkIHByb3ZpZGVycyB3aGljaCBjYW4gcG90ZW50aWFsbHkgaW5oZXJpdCBhIGNvbnN0cnVjdG9yXG4gICAqIGZyb20gYW4gdW5kZWNvcmF0ZWQgYmFzZSBjbGFzcy4gQWxsIGJhc2UgY2xhc3NlcyB1bnRpbCB0aGUgZmlyc3Qgb25lXG4gICAqIHdpdGggYW4gZXhwbGljaXQgY29uc3RydWN0b3Igd2lsbCBiZSBkZWNvcmF0ZWQgd2l0aCB0aGUgXCJASW5qZWN0YWJsZSgpXCIuXG4gICAqL1xuICBtaWdyYXRlRGVjb3JhdGVkUHJvdmlkZXJzKHByb3ZpZGVyczogdHMuQ2xhc3NEZWNsYXJhdGlvbltdKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gcHJvdmlkZXJzLnJlZHVjZShcbiAgICAgICAgKGZhaWx1cmVzLCBub2RlKSA9PiBmYWlsdXJlcy5jb25jYXQodGhpcy5fbWlncmF0ZVByb3ZpZGVyQmFzZUNsYXNzKG5vZGUpKSxcbiAgICAgICAgW10gYXMgVHJhbnNmb3JtRmFpbHVyZVtdKTtcbiAgfVxuXG4gIHByaXZhdGUgX21pZ3JhdGVQcm92aWRlckJhc2VDbGFzcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogVHJhbnNmb3JtRmFpbHVyZVtdIHtcbiAgICByZXR1cm4gdGhpcy5fbWlncmF0ZURlY29yYXRlZENsYXNzV2l0aEluaGVyaXRlZEN0b3IoXG4gICAgICAgIG5vZGUsIHN5bWJvbCA9PiB0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuaXNJbmplY3RhYmxlKHN5bWJvbCksXG4gICAgICAgIG5vZGUgPT4gdGhpcy5fYWRkSW5qZWN0YWJsZURlY29yYXRvcihub2RlKSk7XG4gIH1cblxuICBwcml2YXRlIF9taWdyYXRlRGlyZWN0aXZlQmFzZUNsYXNzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIHJldHVybiB0aGlzLl9taWdyYXRlRGVjb3JhdGVkQ2xhc3NXaXRoSW5oZXJpdGVkQ3RvcihcbiAgICAgICAgbm9kZSwgc3ltYm9sID0+IHRoaXMubWV0YWRhdGFSZXNvbHZlci5pc0RpcmVjdGl2ZShzeW1ib2wpLFxuICAgICAgICBub2RlID0+IHRoaXMuX2FkZEFic3RyYWN0RGlyZWN0aXZlRGVjb3JhdG9yKG5vZGUpKTtcbiAgfVxuXG5cbiAgcHJpdmF0ZSBfbWlncmF0ZURlY29yYXRlZENsYXNzV2l0aEluaGVyaXRlZEN0b3IoXG4gICAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBpc0NsYXNzRGVjb3JhdGVkOiAoc3ltYm9sOiBTdGF0aWNTeW1ib2wpID0+IGJvb2xlYW4sXG4gICAgICBhZGRDbGFzc0RlY29yYXRvcjogKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pID0+IHZvaWQpOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIC8vIEluIGNhc2UgdGhlIHByb3ZpZGVyIGhhcyBhbiBleHBsaWNpdCBjb25zdHJ1Y3Rvciwgd2UgZG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZ1xuICAgIC8vIGJlY2F1c2UgdGhlIGNsYXNzIGlzIGFscmVhZHkgZGVjb3JhdGVkIGFuZCBkb2VzIG5vdCBpbmhlcml0IGEgY29uc3RydWN0b3IuXG4gICAgaWYgKGhhc0V4cGxpY2l0Q29uc3RydWN0b3Iobm9kZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBvcmRlcmVkQmFzZUNsYXNzZXMgPSBmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIpO1xuICAgIGNvbnN0IHVuZGVjb3JhdGVkQmFzZUNsYXNzZXM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXSA9IFtdO1xuXG4gICAgZm9yIChsZXQge25vZGU6IGJhc2VDbGFzcywgaWRlbnRpZmllcn0gb2Ygb3JkZXJlZEJhc2VDbGFzc2VzKSB7XG4gICAgICBjb25zdCBiYXNlQ2xhc3NGaWxlID0gYmFzZUNsYXNzLmdldFNvdXJjZUZpbGUoKTtcblxuICAgICAgaWYgKGhhc0V4cGxpY2l0Q29uc3RydWN0b3IoYmFzZUNsYXNzKSkge1xuICAgICAgICAvLyBBbGwgY2xhc3NlcyBpbiBiZXR3ZWVuIHRoZSBkZWNvcmF0ZWQgY2xhc3MgYW5kIHRoZSB1bmRlY29yYXRlZCBjbGFzc1xuICAgICAgICAvLyB0aGF0IGRlZmluZXMgdGhlIGNvbnN0cnVjdG9yIG5lZWQgdG8gYmUgZGVjb3JhdGVkIGFzIHdlbGwuXG4gICAgICAgIHVuZGVjb3JhdGVkQmFzZUNsYXNzZXMuZm9yRWFjaChiID0+IGFkZENsYXNzRGVjb3JhdG9yKGIpKTtcblxuICAgICAgICBpZiAoYmFzZUNsYXNzRmlsZS5pc0RlY2xhcmF0aW9uRmlsZSkge1xuICAgICAgICAgIGNvbnN0IHN0YXRpY1N5bWJvbCA9IHRoaXMuX2dldFN0YXRpY1N5bWJvbE9mSWRlbnRpZmllcihpZGVudGlmaWVyKTtcblxuICAgICAgICAgIC8vIElmIHRoZSBiYXNlIGNsYXNzIGlzIGRlY29yYXRlZCB0aHJvdWdoIG1ldGFkYXRhIGZpbGVzLCB3ZSBkb24ndFxuICAgICAgICAgIC8vIG5lZWQgdG8gYWRkIGEgY29tbWVudCB0byB0aGUgZGVyaXZlZCBjbGFzcyBmb3IgdGhlIGV4dGVybmFsIGJhc2UgY2xhc3MuXG4gICAgICAgICAgaWYgKHN0YXRpY1N5bWJvbCAmJiBpc0NsYXNzRGVjb3JhdGVkKHN0YXRpY1N5bWJvbCkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEZpbmQgdGhlIGxhc3QgY2xhc3MgaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluIHRoYXQgaXMgZGVjb3JhdGVkIGFuZCB3aWxsIGJlXG4gICAgICAgICAgLy8gdXNlZCBhcyBhbmNob3IgZm9yIGEgY29tbWVudCBleHBsYWluaW5nIHRoYXQgdGhlIGNsYXNzIHRoYXQgZGVmaW5lcyB0aGVcbiAgICAgICAgICAvLyBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgZGVjb3JhdGVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgICAgY29uc3QgbGFzdERlY29yYXRlZENsYXNzID1cbiAgICAgICAgICAgICAgdW5kZWNvcmF0ZWRCYXNlQ2xhc3Nlc1t1bmRlY29yYXRlZEJhc2VDbGFzc2VzLmxlbmd0aCAtIDFdIHx8IG5vZGU7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2FkZE1pc3NpbmdFeHBsaWNpdENvbnN0cnVjdG9yVG9kbyhsYXN0RGVjb3JhdGVkQ2xhc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVjb3JhdGUgdGhlIGNsYXNzIHRoYXQgZGVmaW5lcyB0aGUgY29uc3RydWN0b3IgdGhhdCBpcyBpbmhlcml0ZWQuXG4gICAgICAgIGFkZENsYXNzRGVjb3JhdG9yKGJhc2VDbGFzcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgdGhlIGNsYXNzIGRlY29yYXRvciBmb3IgYWxsIGJhc2UgY2xhc3NlcyBpbiB0aGUgaW5oZXJpdGFuY2UgY2hhaW4gdW50aWxcbiAgICAgIC8vIHRoZSBiYXNlIGNsYXNzIHdpdGggdGhlIGV4cGxpY2l0IGNvbnN0cnVjdG9yLiBUaGUgZGVjb3JhdG9yIHdpbGwgYmUgb25seVxuICAgICAgLy8gYWRkZWQgZm9yIGJhc2UgY2xhc3NlcyB3aGljaCBjYW4gYmUgbW9kaWZpZWQuXG4gICAgICBpZiAoIWJhc2VDbGFzc0ZpbGUuaXNEZWNsYXJhdGlvbkZpbGUpIHtcbiAgICAgICAgdW5kZWNvcmF0ZWRCYXNlQ2xhc3Nlcy5wdXNoKGJhc2VDbGFzcyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBhYnN0cmFjdCBcIkBEaXJlY3RpdmUoKVwiIGRlY29yYXRvciB0byB0aGUgZ2l2ZW4gY2xhc3MgaW4gY2FzZSB0aGVyZVxuICAgKiBpcyBubyBleGlzdGluZyBkaXJlY3RpdmUgZGVjb3JhdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBfYWRkQWJzdHJhY3REaXJlY3RpdmVEZWNvcmF0b3IoYmFzZUNsYXNzOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgaWYgKGhhc0RpcmVjdGl2ZURlY29yYXRvcihiYXNlQ2xhc3MsIHRoaXMudHlwZUNoZWNrZXIpIHx8XG4gICAgICAgIHRoaXMuZGVjb3JhdGVkRGlyZWN0aXZlcy5oYXMoYmFzZUNsYXNzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VDbGFzc0ZpbGUgPSBiYXNlQ2xhc3MuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihiYXNlQ2xhc3NGaWxlKTtcbiAgICBjb25zdCBkaXJlY3RpdmVFeHByID1cbiAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShiYXNlQ2xhc3NGaWxlLCAnRGlyZWN0aXZlJywgJ0Bhbmd1bGFyL2NvcmUnKTtcblxuICAgIGNvbnN0IG5ld0RlY29yYXRvciA9IHRzLmNyZWF0ZURlY29yYXRvcih0cy5jcmVhdGVDYWxsKGRpcmVjdGl2ZUV4cHIsIHVuZGVmaW5lZCwgW10pKTtcbiAgICBjb25zdCBuZXdEZWNvcmF0b3JUZXh0ID1cbiAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3RGVjb3JhdG9yLCBiYXNlQ2xhc3NGaWxlKTtcblxuICAgIHJlY29yZGVyLmFkZENsYXNzRGVjb3JhdG9yKGJhc2VDbGFzcywgbmV3RGVjb3JhdG9yVGV4dCk7XG4gICAgdGhpcy5kZWNvcmF0ZWREaXJlY3RpdmVzLmFkZChiYXNlQ2xhc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGFic3RyYWN0IFwiQEluamVjdGFibGUoKVwiIGRlY29yYXRvciB0byB0aGUgZ2l2ZW4gY2xhc3MgaW4gY2FzZSB0aGVyZVxuICAgKiBpcyBubyBleGlzdGluZyBkaXJlY3RpdmUgZGVjb3JhdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBfYWRkSW5qZWN0YWJsZURlY29yYXRvcihiYXNlQ2xhc3M6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICBpZiAoaGFzSW5qZWN0YWJsZURlY29yYXRvcihiYXNlQ2xhc3MsIHRoaXMudHlwZUNoZWNrZXIpIHx8XG4gICAgICAgIHRoaXMuZGVjb3JhdGVkUHJvdmlkZXJzLmhhcyhiYXNlQ2xhc3MpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZUNsYXNzRmlsZSA9IGJhc2VDbGFzcy5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKGJhc2VDbGFzc0ZpbGUpO1xuICAgIGNvbnN0IGluamVjdGFibGVFeHByID1cbiAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShiYXNlQ2xhc3NGaWxlLCAnSW5qZWN0YWJsZScsICdAYW5ndWxhci9jb3JlJyk7XG5cbiAgICBjb25zdCBuZXdEZWNvcmF0b3IgPSB0cy5jcmVhdGVEZWNvcmF0b3IodHMuY3JlYXRlQ2FsbChpbmplY3RhYmxlRXhwciwgdW5kZWZpbmVkLCBbXSkpO1xuICAgIGNvbnN0IG5ld0RlY29yYXRvclRleHQgPVxuICAgICAgICB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdEZWNvcmF0b3IsIGJhc2VDbGFzc0ZpbGUpO1xuXG4gICAgcmVjb3JkZXIuYWRkQ2xhc3NEZWNvcmF0b3IoYmFzZUNsYXNzLCBuZXdEZWNvcmF0b3JUZXh0KTtcbiAgICB0aGlzLmRlY29yYXRlZFByb3ZpZGVycy5hZGQoYmFzZUNsYXNzKTtcbiAgfVxuXG4gIC8qKiBBZGRzIGEgY29tbWVudCBmb3IgYWRkaW5nIGFuIGV4cGxpY2l0IGNvbnN0cnVjdG9yIHRvIHRoZSBnaXZlbiBjbGFzcyBkZWNsYXJhdGlvbi4gKi9cbiAgcHJpdmF0ZSBfYWRkTWlzc2luZ0V4cGxpY2l0Q29uc3RydWN0b3JUb2RvKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIC8vIEluIGNhc2UgYSB0b2RvIGNvbW1lbnQgaGFzIGJlZW4gYWxyZWFkeSBpbnNlcnRlZCB0byB0aGUgZ2l2ZW4gY2xhc3MsIHdlIGRvbid0XG4gICAgLy8gd2FudCB0byBhZGQgYSBjb21tZW50IG9yIHRyYW5zZm9ybSBmYWlsdXJlIG11bHRpcGxlIHRpbWVzLlxuICAgIGlmICh0aGlzLm1pc3NpbmdFeHBsaWNpdENvbnN0cnVjdG9yQ2xhc3Nlcy5oYXMobm9kZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdGhpcy5taXNzaW5nRXhwbGljaXRDb25zdHJ1Y3RvckNsYXNzZXMuYWRkKG5vZGUpO1xuICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgcmVjb3JkZXIuYWRkQ2xhc3NDb21tZW50KG5vZGUsICdUT0RPOiBhZGQgZXhwbGljaXQgY29uc3RydWN0b3InKTtcbiAgICByZXR1cm4gW3tub2RlOiBub2RlLCBtZXNzYWdlOiAnQ2xhc3MgbmVlZHMgdG8gZGVjbGFyZSBhbiBleHBsaWNpdCBjb25zdHJ1Y3Rvci4nfV07XG4gIH1cblxuICAvKipcbiAgICogTWlncmF0ZXMgdW5kZWNvcmF0ZWQgZGlyZWN0aXZlcyB3aGljaCB3ZXJlIHJlZmVyZW5jZWQgaW4gTmdNb2R1bGUgZGVjbGFyYXRpb25zLlxuICAgKiBUaGVzZSBkaXJlY3RpdmVzIGluaGVyaXQgdGhlIG1ldGFkYXRhIGZyb20gYSBwYXJlbnQgYmFzZSBjbGFzcywgYnV0IHdpdGggSXZ5XG4gICAqIHRoZXNlIGNsYXNzZXMgbmVlZCB0byBleHBsaWNpdGx5IGhhdmUgYSBkZWNvcmF0b3IgZm9yIGxvY2FsaXR5LiBUaGUgbWlncmF0aW9uXG4gICAqIGRldGVybWluZXMgdGhlIGluaGVyaXRlZCBkZWNvcmF0b3IgYW5kIGNvcGllcyBpdCB0byB0aGUgdW5kZWNvcmF0ZWQgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGUgbWlncmF0aW9uIHNlcmlhbGl6ZXMgdGhlIG1ldGFkYXRhIGZvciBleHRlcm5hbCBkZWNsYXJhdGlvbnNcbiAgICogd2hlcmUgdGhlIGRlY29yYXRvciBpcyBub3QgcGFydCBvZiB0aGUgc291cmNlIGZpbGUgQVNULlxuICAgKlxuICAgKiBTZWUgY2FzZSAyIGluIHRoZSBtaWdyYXRpb24gcGxhbjogaHR0cHM6Ly9oYWNrbWQuaW8vQGFseC9TMVhLcU1aZVNcbiAgICovXG4gIG1pZ3JhdGVVbmRlY29yYXRlZERlY2xhcmF0aW9ucyhkaXJlY3RpdmVzOiB0cy5DbGFzc0RlY2xhcmF0aW9uW10pOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIHJldHVybiBkaXJlY3RpdmVzLnJlZHVjZShcbiAgICAgICAgKGZhaWx1cmVzLCBub2RlKSA9PiBmYWlsdXJlcy5jb25jYXQodGhpcy5fbWlncmF0ZURlcml2ZWREZWNsYXJhdGlvbihub2RlKSksXG4gICAgICAgIFtdIGFzIFRyYW5zZm9ybUZhaWx1cmVbXSk7XG4gIH1cblxuICBwcml2YXRlIF9taWdyYXRlRGVyaXZlZERlY2xhcmF0aW9uKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBUcmFuc2Zvcm1GYWlsdXJlW10ge1xuICAgIGNvbnN0IHRhcmdldFNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCBvcmRlcmVkQmFzZUNsYXNzZXMgPSBmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIpO1xuICAgIGxldCBuZXdEZWNvcmF0b3JUZXh0OiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCB7bm9kZTogYmFzZUNsYXNzLCBpZGVudGlmaWVyfSBvZiBvcmRlcmVkQmFzZUNsYXNzZXMpIHtcbiAgICAgIC8vIEJlZm9yZSBsb29raW5nIGZvciBkZWNvcmF0b3JzIHdpdGhpbiB0aGUgbWV0YWRhdGEgb3Igc3VtbWFyeSBmaWxlcywgd2VcbiAgICAgIC8vIHRyeSB0byBkZXRlcm1pbmUgdGhlIGRpcmVjdGl2ZSBkZWNvcmF0b3IgdGhyb3VnaCB0aGUgc291cmNlIGZpbGUgQVNULlxuICAgICAgaWYgKGJhc2VDbGFzcy5kZWNvcmF0b3JzKSB7XG4gICAgICAgIGNvbnN0IG5nRGVjb3JhdG9yID1cbiAgICAgICAgICAgIGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIGJhc2VDbGFzcy5kZWNvcmF0b3JzKVxuICAgICAgICAgICAgICAgIC5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdDb21wb25lbnQnIHx8IG5hbWUgPT09ICdEaXJlY3RpdmUnIHx8IG5hbWUgPT09ICdQaXBlJyk7XG5cbiAgICAgICAgaWYgKG5nRGVjb3JhdG9yKSB7XG4gICAgICAgICAgY29uc3QgbmV3RGVjb3JhdG9yID0gdGhpcy5kZWNvcmF0b3JSZXdyaXRlci5yZXdyaXRlKG5nRGVjb3JhdG9yLCBub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgICAgICAgbmV3RGVjb3JhdG9yVGV4dCA9IHRoaXMucHJpbnRlci5wcmludE5vZGUoXG4gICAgICAgICAgICAgIHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdEZWNvcmF0b3IsIG5nRGVjb3JhdG9yLm5vZGUuZ2V0U291cmNlRmlsZSgpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBtZXRhZGF0YSBjb3VsZCBiZSBmb3VuZCB3aXRoaW4gdGhlIHNvdXJjZS1maWxlIEFTVCwgdHJ5IHRvIGZpbmRcbiAgICAgIC8vIGRlY29yYXRvciBkYXRhIHRocm91Z2ggQW5ndWxhciBtZXRhZGF0YSBhbmQgc3VtbWFyeSBmaWxlcy5cbiAgICAgIGNvbnN0IHN0YXRpY1N5bWJvbCA9IHRoaXMuX2dldFN0YXRpY1N5bWJvbE9mSWRlbnRpZmllcihpZGVudGlmaWVyKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIHN0YXRpYyBzeW1ib2wgcmVzb2x2ZXMgdG8gYSBjbGFzcyBkZWNsYXJhdGlvbiB3aXRoXG4gICAgICAvLyBwaXBlIG9yIGRpcmVjdGl2ZSBtZXRhZGF0YS5cbiAgICAgIGlmICghc3RhdGljU3ltYm9sIHx8XG4gICAgICAgICAgISh0aGlzLm1ldGFkYXRhUmVzb2x2ZXIuaXNQaXBlKHN0YXRpY1N5bWJvbCkgfHxcbiAgICAgICAgICAgIHRoaXMubWV0YWRhdGFSZXNvbHZlci5pc0RpcmVjdGl2ZShzdGF0aWNTeW1ib2wpKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9yZXNvbHZlRGVjbGFyYXRpb25NZXRhZGF0YShzdGF0aWNTeW1ib2wpO1xuXG4gICAgICAvLyBJZiBubyBtZXRhZGF0YSBjb3VsZCBiZSByZXNvbHZlZCBmb3IgdGhlIHN0YXRpYyBzeW1ib2wsIHByaW50IGEgZmFpbHVyZSBtZXNzYWdlXG4gICAgICAvLyBhbmQgYXNrIHRoZSBkZXZlbG9wZXIgdG8gbWFudWFsbHkgbWlncmF0ZSB0aGUgY2xhc3MuIFRoaXMgY2FzZSBpcyByYXJlIGJlY2F1c2VcbiAgICAgIC8vIHVzdWFsbHkgZGVjb3JhdG9yIG1ldGFkYXRhIGlzIGFsd2F5cyBwcmVzZW50IGJ1dCBqdXN0IGNhbid0IGJlIHJlYWQgaWYgYSBwcm9ncmFtXG4gICAgICAvLyBvbmx5IGhhcyBhY2Nlc3MgdG8gc3VtbWFyaWVzICh0aGlzIGlzIGEgc3BlY2lhbCBjYXNlIGluIGdvb2dsZTMpLlxuICAgICAgaWYgKCFtZXRhZGF0YSkge1xuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG1lc3NhZ2U6IGBDbGFzcyBjYW5ub3QgYmUgbWlncmF0ZWQgYXMgdGhlIGluaGVyaXRlZCBtZXRhZGF0YSBmcm9tIGAgK1xuICAgICAgICAgICAgICBgJHtpZGVudGlmaWVyLmdldFRleHQoKX0gY2Fubm90IGJlIGNvbnZlcnRlZCBpbnRvIGEgZGVjb3JhdG9yLiBQbGVhc2UgbWFudWFsbHlcbiAgICAgICAgICAgIGRlY29yYXRlIHRoZSBjbGFzcy5gLFxuICAgICAgICB9XTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3RGVjb3JhdG9yID0gdGhpcy5fY29uc3RydWN0RGVjb3JhdG9yRnJvbU1ldGFkYXRhKG1ldGFkYXRhLCB0YXJnZXRTb3VyY2VGaWxlKTtcbiAgICAgIGlmICghbmV3RGVjb3JhdG9yKSB7XG4gICAgICAgIGNvbnN0IGFubm90YXRpb25UeXBlID0gbWV0YWRhdGEudHlwZTtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBtZXNzYWdlOiBgQ2xhc3MgY2Fubm90IGJlIG1pZ3JhdGVkIGFzIHRoZSBpbmhlcml0ZWQgQCR7YW5ub3RhdGlvblR5cGV9IGRlY29yYXRvciBgICtcbiAgICAgICAgICAgICAgYGNhbm5vdCBiZSBjb3BpZWQuIFBsZWFzZSBtYW51YWxseSBhZGQgYSBAJHthbm5vdGF0aW9uVHlwZX0gZGVjb3JhdG9yLmAsXG4gICAgICAgIH1dO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBjYXNlIHRoZSBkZWNvcmF0b3IgY291bGQgYmUgY29uc3RydWN0ZWQgZnJvbSB0aGUgcmVzb2x2ZWQgbWV0YWRhdGEsIHVzZVxuICAgICAgLy8gdGhhdCBkZWNvcmF0b3IgZm9yIHRoZSBkZXJpdmVkIHVuZGVjb3JhdGVkIGNsYXNzZXMuXG4gICAgICBuZXdEZWNvcmF0b3JUZXh0ID1cbiAgICAgICAgICB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdEZWNvcmF0b3IsIHRhcmdldFNvdXJjZUZpbGUpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKCFuZXdEZWNvcmF0b3JUZXh0KSB7XG4gICAgICByZXR1cm4gW3tcbiAgICAgICAgbm9kZSxcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICAgICdDbGFzcyBjYW5ub3QgYmUgbWlncmF0ZWQgYXMgbm8gZGlyZWN0aXZlL2NvbXBvbmVudC9waXBlIG1ldGFkYXRhIGNvdWxkIGJlIGZvdW5kLiAnICtcbiAgICAgICAgICAgICdQbGVhc2UgbWFudWFsbHkgYWRkIGEgQERpcmVjdGl2ZSwgQENvbXBvbmVudCBvciBAUGlwZSBkZWNvcmF0b3IuJ1xuICAgICAgfV07XG4gICAgfVxuXG4gICAgdGhpcy5nZXRVcGRhdGVSZWNvcmRlcih0YXJnZXRTb3VyY2VGaWxlKS5hZGRDbGFzc0RlY29yYXRvcihub2RlLCBuZXdEZWNvcmF0b3JUZXh0KTtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvKiogUmVjb3JkcyBhbGwgY2hhbmdlcyB0aGF0IHdlcmUgbWFkZSBpbiB0aGUgaW1wb3J0IG1hbmFnZXIuICovXG4gIHJlY29yZENoYW5nZXMoKSB7XG4gICAgdGhpcy5pbXBvcnRNYW5hZ2VyLnJlY29yZENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgVHlwZVNjcmlwdCBkZWNvcmF0b3Igbm9kZSBmcm9tIHRoZSBzcGVjaWZpZWQgZGVjbGFyYXRpb24gbWV0YWRhdGEuIFJldHVybnNcbiAgICogbnVsbCBpZiB0aGUgbWV0YWRhdGEgY291bGQgbm90IGJlIHNpbXBsaWZpZWQvcmVzb2x2ZWQuXG4gICAqL1xuICBwcml2YXRlIF9jb25zdHJ1Y3REZWNvcmF0b3JGcm9tTWV0YWRhdGEoXG4gICAgICBkaXJlY3RpdmVNZXRhZGF0YTogRGVjbGFyYXRpb25NZXRhZGF0YSwgdGFyZ2V0U291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IHRzLkRlY29yYXRvcnxudWxsIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGVjb3JhdG9yRXhwciA9IGNvbnZlcnREaXJlY3RpdmVNZXRhZGF0YVRvRXhwcmVzc2lvbihcbiAgICAgICAgICB0aGlzLmNvbXBpbGVyTW9kdWxlLCBkaXJlY3RpdmVNZXRhZGF0YS5tZXRhZGF0YSxcbiAgICAgICAgICBzdGF0aWNTeW1ib2wgPT5cbiAgICAgICAgICAgICAgdGhpcy5jb21waWxlckhvc3RcbiAgICAgICAgICAgICAgICAgIC5maWxlTmFtZVRvTW9kdWxlTmFtZShzdGF0aWNTeW1ib2wuZmlsZVBhdGgsIHRhcmdldFNvdXJjZUZpbGUuZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwvaW5kZXgkLywgJycpLFxuICAgICAgICAgIChtb2R1bGVOYW1lOiBzdHJpbmcsIG5hbWU6IHN0cmluZykgPT5cbiAgICAgICAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZSh0YXJnZXRTb3VyY2VGaWxlLCBuYW1lLCBtb2R1bGVOYW1lKSxcbiAgICAgICAgICAocHJvcGVydHlOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgLy8gT25seSBub3JtYWxpemUgcHJvcGVydGllcyBjYWxsZWQgXCJjaGFuZ2VEZXRlY3Rpb25cIiBhbmQgXCJlbmNhcHN1bGF0aW9uXCJcbiAgICAgICAgICAgIC8vIGZvciBcIkBEaXJlY3RpdmVcIiBhbmQgXCJAQ29tcG9uZW50XCIgYW5ub3RhdGlvbnMuXG4gICAgICAgICAgICBpZiAoZGlyZWN0aXZlTWV0YWRhdGEudHlwZSA9PT0gJ1BpcGUnKSB7XG4gICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbnN0ZWFkIG9mIHVzaW5nIHRoZSBudW1iZXIgYXMgdmFsdWUgZm9yIHRoZSBcImNoYW5nZURldGVjdGlvblwiIGFuZFxuICAgICAgICAgICAgLy8gXCJlbmNhcHN1bGF0aW9uXCIgcHJvcGVydGllcywgd2Ugd2FudCB0byB1c2UgdGhlIGFjdHVhbCBlbnVtIHN5bWJvbHMuXG4gICAgICAgICAgICBpZiAocHJvcGVydHlOYW1lID09PSAnY2hhbmdlRGV0ZWN0aW9uJyAmJiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cy5jcmVhdGVQcm9wZXJ0eUFjY2VzcyhcbiAgICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoXG4gICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0U291cmNlRmlsZSwgJ0NoYW5nZURldGVjdGlvblN0cmF0ZWd5JywgJ0Bhbmd1bGFyL2NvcmUnKSxcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29yZU1vZHVsZS5DaGFuZ2VEZXRlY3Rpb25TdHJhdGVneVt2YWx1ZV0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eU5hbWUgPT09ICdlbmNhcHN1bGF0aW9uJyAmJiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cy5jcmVhdGVQcm9wZXJ0eUFjY2VzcyhcbiAgICAgICAgICAgICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoXG4gICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0U291cmNlRmlsZSwgJ1ZpZXdFbmNhcHN1bGF0aW9uJywgJ0Bhbmd1bGFyL2NvcmUnKSxcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29yZU1vZHVsZS5WaWV3RW5jYXBzdWxhdGlvblt2YWx1ZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cy5jcmVhdGVEZWNvcmF0b3IodHMuY3JlYXRlQ2FsbChcbiAgICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKFxuICAgICAgICAgICAgICB0YXJnZXRTb3VyY2VGaWxlLCBkaXJlY3RpdmVNZXRhZGF0YS50eXBlLCAnQGFuZ3VsYXIvY29yZScpLFxuICAgICAgICAgIHVuZGVmaW5lZCwgW2RlY29yYXRvckV4cHJdKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBVbmV4cGVjdGVkTWV0YWRhdGFWYWx1ZUVycm9yKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgdGhlIGRlY2xhcmF0aW9uIG1ldGFkYXRhIG9mIGEgZ2l2ZW4gc3RhdGljIHN5bWJvbC4gVGhlIG1ldGFkYXRhXG4gICAqIGlzIGRldGVybWluZWQgYnkgcmVzb2x2aW5nIG1ldGFkYXRhIGZvciB0aGUgc3RhdGljIHN5bWJvbC5cbiAgICovXG4gIHByaXZhdGUgX3Jlc29sdmVEZWNsYXJhdGlvbk1ldGFkYXRhKHN5bWJvbDogU3RhdGljU3ltYm9sKTogbnVsbHxEZWNsYXJhdGlvbk1ldGFkYXRhIHtcbiAgICB0cnkge1xuICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgY2FsbCBjYW4gdGhyb3cgaWYgdGhlIG1ldGFkYXRhIGlzIG5vdCBjb21wdXRhYmxlLiBJbiB0aGF0XG4gICAgICAvLyBjYXNlIHdlIGFyZSBub3QgYWJsZSB0byBzZXJpYWxpemUgdGhlIG1ldGFkYXRhIGludG8gYSBkZWNvcmF0b3IgYW5kIHdlIHJldHVyblxuICAgICAgLy8gbnVsbC5cbiAgICAgIGNvbnN0IGFubm90YXRpb25zID0gdGhpcy5jb21waWxlci5yZWZsZWN0b3IuYW5ub3RhdGlvbnMoc3ltYm9sKS5maW5kKFxuICAgICAgICAgIHMgPT4gcy5uZ01ldGFkYXRhTmFtZSA9PT0gJ0NvbXBvbmVudCcgfHwgcy5uZ01ldGFkYXRhTmFtZSA9PT0gJ0RpcmVjdGl2ZScgfHxcbiAgICAgICAgICAgICAgcy5uZ01ldGFkYXRhTmFtZSA9PT0gJ1BpcGUnKTtcblxuICAgICAgaWYgKCFhbm5vdGF0aW9ucykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3Qge25nTWV0YWRhdGFOYW1lLCAuLi5tZXRhZGF0YX0gPSBhbm5vdGF0aW9ucztcblxuICAgICAgLy8gRGVsZXRlIHRoZSBcIm5nTWV0YWRhdGFOYW1lXCIgcHJvcGVydHkgYXMgd2UgZG9uJ3Qgd2FudCB0byBnZW5lcmF0ZVxuICAgICAgLy8gYSBwcm9wZXJ0eSBhc3NpZ25tZW50IGluIHRoZSBuZXcgZGVjb3JhdG9yIGZvciB0aGF0IGludGVybmFsIHByb3BlcnR5LlxuICAgICAgZGVsZXRlIG1ldGFkYXRhWyduZ01ldGFkYXRhTmFtZSddO1xuXG4gICAgICByZXR1cm4ge3R5cGU6IG5nTWV0YWRhdGFOYW1lLCBtZXRhZGF0YX07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0U3RhdGljU3ltYm9sT2ZJZGVudGlmaWVyKG5vZGU6IHRzLklkZW50aWZpZXIpOiBTdGF0aWNTeW1ib2x8bnVsbCB7XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IHJlc29sdmVkSW1wb3J0ID0gZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUpO1xuXG4gICAgaWYgKCFyZXNvbHZlZEltcG9ydCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlTmFtZSA9XG4gICAgICAgIHRoaXMuY29tcGlsZXJIb3N0Lm1vZHVsZU5hbWVUb0ZpbGVOYW1lKHJlc29sdmVkSW1wb3J0LmltcG9ydE1vZHVsZSwgc291cmNlRmlsZS5maWxlTmFtZSk7XG5cbiAgICBpZiAoIW1vZHVsZU5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIEZpbmQgdGhlIGRlY2xhcmF0aW9uIHN5bWJvbCBhcyBzeW1ib2xzIGNvdWxkIGJlIGFsaWFzZWQgZHVlIHRvXG4gICAgLy8gbWV0YWRhdGEgcmUtZXhwb3J0cy5cbiAgICByZXR1cm4gdGhpcy5jb21waWxlci5yZWZsZWN0b3IuZmluZFN5bWJvbERlY2xhcmF0aW9uKFxuICAgICAgICB0aGlzLnN5bWJvbFJlc29sdmVyLmdldFN0YXRpY1N5bWJvbChtb2R1bGVOYW1lLCByZXNvbHZlZEltcG9ydC5uYW1lKSk7XG4gIH1cblxuICAvKipcbiAgICogRGlzYWJsZXMgdGhhdCBzdGF0aWMgc3ltYm9scyBhcmUgcmVzb2x2ZWQgdGhyb3VnaCBzdW1tYXJpZXMuIFN1bW1hcmllc1xuICAgKiBjYW5ub3QgYmUgdXNlZCBmb3IgZGVjb3JhdG9yIGFuYWx5c2lzIGFzIGRlY29yYXRvcnMgYXJlIG9taXR0ZWQgaW4gc3VtbWFyaWVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfZGlzYWJsZVN1bW1hcnlSZXNvbHV0aW9uKCkge1xuICAgIC8vIFdlIG5ldmVyIHdhbnQgdG8gcmVzb2x2ZSBzeW1ib2xzIHRocm91Z2ggc3VtbWFyaWVzLiBTdW1tYXJpZXMgbmV2ZXIgY29udGFpblxuICAgIC8vIGRlY29yYXRvcnMgZm9yIGNsYXNzIHN5bWJvbHMgYW5kIHRoZXJlZm9yZSBzdW1tYXJpZXMgd2lsbCBjYXVzZSBldmVyeSBjbGFzc1xuICAgIC8vIHRvIGJlIGNvbnNpZGVyZWQgYXMgdW5kZWNvcmF0ZWQuIFNlZSByZWFzb24gZm9yIHRoaXMgaW46IFwiVG9Kc29uU2VyaWFsaXplclwiLlxuICAgIC8vIEluIG9yZGVyIHRvIGVuc3VyZSB0aGF0IG1ldGFkYXRhIGlzIG5vdCByZXRyaWV2ZWQgdGhyb3VnaCBzdW1tYXJpZXMsIHdlXG4gICAgLy8gbmVlZCB0byBkaXNhYmxlIHN1bW1hcnkgcmVzb2x1dGlvbiwgY2xlYXIgcHJldmlvdXMgc3ltYm9sIGNhY2hlcy4gVGhpcyB3YXlcbiAgICAvLyBmdXR1cmUgY2FsbHMgdG8gXCJTdGF0aWNSZWZsZWN0b3IjYW5ub3RhdGlvbnNcIiBhcmUgYmFzZWQgb24gbWV0YWRhdGEgZmlsZXMuXG4gICAgdGhpcy5zeW1ib2xSZXNvbHZlclsnX3Jlc29sdmVTeW1ib2xGcm9tU3VtbWFyeSddID0gKCkgPT4gbnVsbDtcbiAgICB0aGlzLnN5bWJvbFJlc29sdmVyWydyZXNvbHZlZFN5bWJvbHMnXS5jbGVhcigpO1xuICAgIHRoaXMuc3ltYm9sUmVzb2x2ZXJbJ3N5bWJvbEZyb21GaWxlJ10uY2xlYXIoKTtcbiAgICB0aGlzLmNvbXBpbGVyLnJlZmxlY3RvclsnYW5ub3RhdGlvbkNhY2hlJ10uY2xlYXIoKTtcblxuICAgIC8vIE9yaWdpbmFsIHN1bW1hcnkgcmVzb2x2ZXIgdXNlZCBieSB0aGUgQU9UIGNvbXBpbGVyLlxuICAgIGNvbnN0IHN1bW1hcnlSZXNvbHZlciA9IHRoaXMuc3ltYm9sUmVzb2x2ZXJbJ3N1bW1hcnlSZXNvbHZlciddO1xuXG4gICAgLy8gQWRkaXRpb25hbGx5IHdlIG5lZWQgdG8gZW5zdXJlIHRoYXQgbm8gZmlsZXMgYXJlIHRyZWF0ZWQgYXMgXCJsaWJyYXJ5XCIgZmlsZXMgd2hlblxuICAgIC8vIHJlc29sdmluZyBtZXRhZGF0YS4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBieSBkZWZhdWx0IHRoZSBzeW1ib2wgcmVzb2x2ZXIgZGlzY2FyZHNcbiAgICAvLyBjbGFzcyBtZXRhZGF0YSBmb3IgbGlicmFyeSBmaWxlcy4gU2VlIFwiU3RhdGljU3ltYm9sUmVzb2x2ZXIjY3JlYXRlUmVzb2x2ZWRTeW1ib2xcIi5cbiAgICAvLyBQYXRjaGluZyB0aGlzIGZ1bmN0aW9uICoqb25seSoqIGZvciB0aGUgc3RhdGljIHN5bWJvbCByZXNvbHZlciBlbnN1cmVzIHRoYXQgbWV0YWRhdGFcbiAgICAvLyBpcyBub3QgaW5jb3JyZWN0bHkgb21pdHRlZC4gTm90ZSB0aGF0IHdlIG9ubHkgd2FudCB0byBkbyB0aGlzIGZvciB0aGUgc3ltYm9sIHJlc29sdmVyXG4gICAgLy8gYmVjYXVzZSBvdGhlcndpc2Ugd2UgY291bGQgYnJlYWsgdGhlIHN1bW1hcnkgbG9hZGluZyBsb2dpYyB3aGljaCBpcyB1c2VkIHRvIGRldGVjdFxuICAgIC8vIGlmIGEgc3RhdGljIHN5bWJvbCBpcyBlaXRoZXIgYSBkaXJlY3RpdmUsIGNvbXBvbmVudCBvciBwaXBlIChzZWUgTWV0YWRhdGFSZXNvbHZlcikuXG4gICAgdGhpcy5zeW1ib2xSZXNvbHZlclsnc3VtbWFyeVJlc29sdmVyJ10gPSA8U3VtbWFyeVJlc29sdmVyPFN0YXRpY1N5bWJvbD4+e1xuICAgICAgZnJvbVN1bW1hcnlGaWxlTmFtZTogc3VtbWFyeVJlc29sdmVyLmZyb21TdW1tYXJ5RmlsZU5hbWUuYmluZChzdW1tYXJ5UmVzb2x2ZXIpLFxuICAgICAgYWRkU3VtbWFyeTogc3VtbWFyeVJlc29sdmVyLmFkZFN1bW1hcnkuYmluZChzdW1tYXJ5UmVzb2x2ZXIpLFxuICAgICAgZ2V0SW1wb3J0QXM6IHN1bW1hcnlSZXNvbHZlci5nZXRJbXBvcnRBcy5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICBnZXRLbm93bk1vZHVsZU5hbWU6IHN1bW1hcnlSZXNvbHZlci5nZXRLbm93bk1vZHVsZU5hbWUuYmluZChzdW1tYXJ5UmVzb2x2ZXIpLFxuICAgICAgcmVzb2x2ZVN1bW1hcnk6IHN1bW1hcnlSZXNvbHZlci5yZXNvbHZlU3VtbWFyeS5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICB0b1N1bW1hcnlGaWxlTmFtZTogc3VtbWFyeVJlc29sdmVyLnRvU3VtbWFyeUZpbGVOYW1lLmJpbmQoc3VtbWFyeVJlc29sdmVyKSxcbiAgICAgIGdldFN5bWJvbHNPZjogc3VtbWFyeVJlc29sdmVyLmdldFN5bWJvbHNPZi5iaW5kKHN1bW1hcnlSZXNvbHZlciksXG4gICAgICBpc0xpYnJhcnlGaWxlOiAoKSA9PiBmYWxzZSxcbiAgICB9O1xuICB9XG59XG4iXX0=