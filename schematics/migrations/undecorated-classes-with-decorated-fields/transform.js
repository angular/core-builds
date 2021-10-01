/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields/transform", ["require", "exports", "@angular/compiler-cli/private/migrations", "typescript", "@angular/core/schematics/utils/import_manager", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/find_base_classes", "@angular/core/schematics/utils/typescript/functions", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndecoratedClassesWithDecoratedFieldsTransform = void 0;
    const migrations_1 = require("@angular/compiler-cli/private/migrations");
    const typescript_1 = __importDefault(require("typescript"));
    const import_manager_1 = require("@angular/core/schematics/utils/import_manager");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const find_base_classes_1 = require("@angular/core/schematics/utils/typescript/find_base_classes");
    const functions_1 = require("@angular/core/schematics/utils/typescript/functions");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    /**
     * Set of known decorators that indicate that the current class needs a directive
     * definition. These decorators are always specific to directives.
     */
    const DIRECTIVE_FIELD_DECORATORS = new Set([
        'Input', 'Output', 'ViewChild', 'ViewChildren', 'ContentChild', 'ContentChildren', 'HostBinding',
        'HostListener'
    ]);
    /**
     * Set of known lifecycle hooks that indicate that the current class needs a directive
     * definition. These lifecycle hooks are always specific to directives.
     */
    const DIRECTIVE_LIFECYCLE_HOOKS = new Set([
        'ngOnChanges', 'ngOnInit', 'ngDoCheck', 'ngAfterViewInit', 'ngAfterViewChecked',
        'ngAfterContentInit', 'ngAfterContentChecked'
    ]);
    /**
     * Set of known lifecycle hooks that indicate that a given class uses Angular
     * features, but it's ambiguous whether it is a directive or service.
     */
    const AMBIGUOUS_LIFECYCLE_HOOKS = new Set(['ngOnDestroy']);
    /** Describes how a given class is used in the context of Angular. */
    var InferredKind;
    (function (InferredKind) {
        InferredKind[InferredKind["DIRECTIVE"] = 0] = "DIRECTIVE";
        InferredKind[InferredKind["AMBIGUOUS"] = 1] = "AMBIGUOUS";
        InferredKind[InferredKind["UNKNOWN"] = 2] = "UNKNOWN";
    })(InferredKind || (InferredKind = {}));
    /** Describes possible types of Angular declarations. */
    var DeclarationType;
    (function (DeclarationType) {
        DeclarationType[DeclarationType["DIRECTIVE"] = 0] = "DIRECTIVE";
        DeclarationType[DeclarationType["COMPONENT"] = 1] = "COMPONENT";
        DeclarationType[DeclarationType["ABSTRACT_DIRECTIVE"] = 2] = "ABSTRACT_DIRECTIVE";
        DeclarationType[DeclarationType["PIPE"] = 3] = "PIPE";
        DeclarationType[DeclarationType["INJECTABLE"] = 4] = "INJECTABLE";
    })(DeclarationType || (DeclarationType = {}));
    /** TODO message that is added to ambiguous classes using Angular features. */
    const AMBIGUOUS_CLASS_TODO = 'Add Angular decorator.';
    class UndecoratedClassesWithDecoratedFieldsTransform {
        constructor(typeChecker, getUpdateRecorder) {
            this.typeChecker = typeChecker;
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = typescript_1.default.createPrinter();
            this.importManager = new import_manager_1.ImportManager(this.getUpdateRecorder, this.printer);
            this.reflectionHost = new migrations_1.TypeScriptReflectionHost(this.typeChecker);
            this.partialEvaluator = new migrations_1.PartialEvaluator(this.reflectionHost, this.typeChecker, null);
        }
        /**
         * Migrates the specified source files. The transform adds the abstract `@Directive`
         * decorator to undecorated classes that use Angular features. Class members which
         * are decorated with any Angular decorator, or class members for lifecycle hooks are
         * indicating that a given class uses Angular features. https://hackmd.io/vuQfavzfRG6KUCtU7oK_EA
         */
        migrate(sourceFiles) {
            const { detectedAbstractDirectives, ambiguousClasses } = this._findUndecoratedAbstractDirectives(sourceFiles);
            detectedAbstractDirectives.forEach(node => {
                const sourceFile = node.getSourceFile();
                const recorder = this.getUpdateRecorder(sourceFile);
                const directiveExpr = this.importManager.addImportToSourceFile(sourceFile, 'Directive', '@angular/core');
                const decoratorExpr = typescript_1.default.createDecorator(typescript_1.default.createCall(directiveExpr, undefined, undefined));
                recorder.addClassDecorator(node, this.printer.printNode(typescript_1.default.EmitHint.Unspecified, decoratorExpr, sourceFile));
            });
            // Ambiguous classes clearly use Angular features, but the migration is unable to
            // determine whether the class is used as directive, service or pipe. The migration
            // could potentially determine the type by checking NgModule definitions or inheritance
            // of other known declarations, but this is out of scope and a TODO/failure is sufficient.
            return Array.from(ambiguousClasses).reduce((failures, node) => {
                // If the class has been reported as ambiguous before, skip adding a TODO and
                // printing an error. A class could be visited multiple times when it's part
                // of multiple build targets in the CLI project.
                if (this._hasBeenReportedAsAmbiguous(node)) {
                    return failures;
                }
                const sourceFile = node.getSourceFile();
                const recorder = this.getUpdateRecorder(sourceFile);
                // Add a TODO to the class that uses Angular features but is not decorated.
                recorder.addClassTodo(node, AMBIGUOUS_CLASS_TODO);
                // Add an error for the class that will be printed in the `ng update` output.
                return failures.concat({
                    node,
                    message: 'Class uses Angular features but cannot be migrated automatically. Please ' +
                        'add an appropriate Angular decorator.'
                });
            }, []);
        }
        /** Records all changes that were made in the import manager. */
        recordChanges() {
            this.importManager.recordChanges();
        }
        /**
         * Finds undecorated abstract directives in the specified source files. Also returns
         * a set of undecorated classes which could not be detected as guaranteed abstract
         * directives. Those are ambiguous and could be either Directive, Pipe or service.
         */
        _findUndecoratedAbstractDirectives(sourceFiles) {
            const ambiguousClasses = new Set();
            const declarations = new WeakMap();
            const detectedAbstractDirectives = new Set();
            const undecoratedClasses = new Set();
            const visitNode = (node) => {
                node.forEachChild(visitNode);
                if (!typescript_1.default.isClassDeclaration(node)) {
                    return;
                }
                const { inferredKind, decoratedType } = this._analyzeClassDeclaration(node);
                if (decoratedType !== null) {
                    declarations.set(node, decoratedType);
                    return;
                }
                if (inferredKind === InferredKind.DIRECTIVE) {
                    detectedAbstractDirectives.add(node);
                }
                else if (inferredKind === InferredKind.AMBIGUOUS) {
                    ambiguousClasses.add(node);
                }
                else {
                    undecoratedClasses.add(node);
                }
            };
            sourceFiles.forEach(sourceFile => sourceFile.forEachChild(visitNode));
            /**
             * Checks the inheritance of the given set of classes. It removes classes from the
             * detected abstract directives set when they inherit from a non-abstract Angular
             * declaration. e.g. an abstract directive can never extend from a component.
             *
             * If a class inherits from an abstract directive though, we will migrate them too
             * as derived classes also need to be decorated. This has been done for a simpler mental
             * model and reduced complexity in the Angular compiler. See migration plan document.
             */
            const checkInheritanceOfClasses = (classes) => {
                classes.forEach(node => {
                    for (const { node: baseClass } of (0, find_base_classes_1.findBaseClassDeclarations)(node, this.typeChecker)) {
                        if (!declarations.has(baseClass)) {
                            continue;
                        }
                        // If the undecorated class inherits from an abstract directive, always migrate it.
                        // Derived undecorated classes of abstract directives are always also considered
                        // abstract directives and need to be decorated too. This is necessary as otherwise
                        // the inheritance chain cannot be resolved by the Angular compiler. e.g. when it
                        // flattens directive metadata for type checking. In the other case, we never want
                        // to migrate a class if it extends from a non-abstract Angular declaration. That
                        // is an unsupported pattern as of v9 and was previously handled with the
                        // `undecorated-classes-with-di` migration (which copied the inherited decorator).
                        if (declarations.get(baseClass) === DeclarationType.ABSTRACT_DIRECTIVE) {
                            detectedAbstractDirectives.add(node);
                        }
                        else {
                            detectedAbstractDirectives.delete(node);
                        }
                        ambiguousClasses.delete(node);
                        break;
                    }
                });
            };
            // Check inheritance of any detected abstract directive. We want to remove
            // classes that are not eligible abstract directives due to inheritance. i.e.
            // if a class extends from a component, it cannot be a derived abstract directive.
            checkInheritanceOfClasses(detectedAbstractDirectives);
            // Update the class declarations to reflect the detected abstract directives. This is
            // then used later when we check for undecorated classes that inherit from an abstract
            // directive and need to be decorated.
            detectedAbstractDirectives.forEach(n => declarations.set(n, DeclarationType.ABSTRACT_DIRECTIVE));
            // Check ambiguous and undecorated classes if they inherit from an abstract directive.
            // If they do, we want to migrate them too. See function definition for more details.
            checkInheritanceOfClasses(ambiguousClasses);
            checkInheritanceOfClasses(undecoratedClasses);
            return { detectedAbstractDirectives, ambiguousClasses };
        }
        /**
         * Analyzes the given class declaration by determining whether the class
         * is a directive, is an abstract directive, or uses Angular features.
         */
        _analyzeClassDeclaration(node) {
            const ngDecorators = node.decorators && (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, node.decorators);
            const inferredKind = this._determineClassKind(node);
            if (ngDecorators === undefined || ngDecorators.length === 0) {
                return { decoratedType: null, inferredKind };
            }
            const directiveDecorator = ngDecorators.find(({ name }) => name === 'Directive');
            const componentDecorator = ngDecorators.find(({ name }) => name === 'Component');
            const pipeDecorator = ngDecorators.find(({ name }) => name === 'Pipe');
            const injectableDecorator = ngDecorators.find(({ name }) => name === 'Injectable');
            const isAbstractDirective = directiveDecorator !== undefined && this._isAbstractDirective(directiveDecorator);
            let decoratedType = null;
            if (isAbstractDirective) {
                decoratedType = DeclarationType.ABSTRACT_DIRECTIVE;
            }
            else if (componentDecorator !== undefined) {
                decoratedType = DeclarationType.COMPONENT;
            }
            else if (directiveDecorator !== undefined) {
                decoratedType = DeclarationType.DIRECTIVE;
            }
            else if (pipeDecorator !== undefined) {
                decoratedType = DeclarationType.PIPE;
            }
            else if (injectableDecorator !== undefined) {
                decoratedType = DeclarationType.INJECTABLE;
            }
            return { decoratedType, inferredKind };
        }
        /**
         * Checks whether the given decorator resolves to an abstract directive. An directive is
         * considered "abstract" if there is no selector specified.
         */
        _isAbstractDirective({ node }) {
            const metadataArgs = node.expression.arguments;
            if (metadataArgs.length === 0) {
                return true;
            }
            const metadataExpr = (0, functions_1.unwrapExpression)(metadataArgs[0]);
            if (!typescript_1.default.isObjectLiteralExpression(metadataExpr)) {
                return false;
            }
            const metadata = (0, migrations_1.reflectObjectLiteral)(metadataExpr);
            if (!metadata.has('selector')) {
                return false;
            }
            const selector = this.partialEvaluator.evaluate(metadata.get('selector'));
            return selector == null;
        }
        /**
         * Determines the kind of a given class in terms of Angular. The method checks
         * whether the given class has members that indicate the use of Angular features.
         * e.g. lifecycle hooks or decorated members like `@Input` or `@Output` are
         * considered Angular features..
         */
        _determineClassKind(node) {
            let usage = InferredKind.UNKNOWN;
            for (const member of node.members) {
                const propertyName = member.name !== undefined ? (0, property_name_1.getPropertyNameText)(member.name) : null;
                // If the class declares any of the known directive lifecycle hooks, we can
                // immediately exit the loop as the class is guaranteed to be a directive.
                if (propertyName !== null && DIRECTIVE_LIFECYCLE_HOOKS.has(propertyName)) {
                    return InferredKind.DIRECTIVE;
                }
                const ngDecorators = member.decorators !== undefined ?
                    (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, member.decorators) :
                    [];
                for (const { name } of ngDecorators) {
                    if (DIRECTIVE_FIELD_DECORATORS.has(name)) {
                        return InferredKind.DIRECTIVE;
                    }
                }
                // If the class declares any of the lifecycle hooks that do not guarantee that
                // the given class is a directive, update the kind and continue looking for other
                // members that would unveil a more specific kind (i.e. being a directive).
                if (propertyName !== null && AMBIGUOUS_LIFECYCLE_HOOKS.has(propertyName)) {
                    usage = InferredKind.AMBIGUOUS;
                }
            }
            return usage;
        }
        /**
         * Checks whether a given class has been reported as ambiguous in previous
         * migration run. e.g. when build targets are migrated first, and then test
         * targets that have an overlap with build source files, the same class
         * could be detected as ambiguous.
         */
        _hasBeenReportedAsAmbiguous(node) {
            const sourceFile = node.getSourceFile();
            const leadingComments = typescript_1.default.getLeadingCommentRanges(sourceFile.text, node.pos);
            if (leadingComments === undefined) {
                return false;
            }
            return leadingComments.some(({ kind, pos, end }) => kind === typescript_1.default.SyntaxKind.SingleLineCommentTrivia &&
                sourceFile.text.substring(pos, end).includes(`TODO: ${AMBIGUOUS_CLASS_TODO}`));
        }
    }
    exports.UndecoratedClassesWithDecoratedFieldsTransform = UndecoratedClassesWithDecoratedFieldsTransform;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRlY29yYXRlZC1maWVsZHMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILHlFQUEwSDtJQUMxSCw0REFBNEI7SUFFNUIsa0ZBQXlEO0lBQ3pELGdGQUE0RTtJQUM1RSxtR0FBbUY7SUFDbkYsbUZBQWtFO0lBQ2xFLDJGQUF5RTtJQUl6RTs7O09BR0c7SUFDSCxNQUFNLDBCQUEwQixHQUFHLElBQUksR0FBRyxDQUFDO1FBQ3pDLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsYUFBYTtRQUNoRyxjQUFjO0tBQ2YsQ0FBQyxDQUFDO0lBRUg7OztPQUdHO0lBQ0gsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLEdBQUcsQ0FBQztRQUN4QyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxvQkFBb0I7UUFDL0Usb0JBQW9CLEVBQUUsdUJBQXVCO0tBQzlDLENBQUMsQ0FBQztJQUVIOzs7T0FHRztJQUNILE1BQU0seUJBQXlCLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBRTNELHFFQUFxRTtJQUNyRSxJQUFLLFlBSUo7SUFKRCxXQUFLLFlBQVk7UUFDZix5REFBUyxDQUFBO1FBQ1QseURBQVMsQ0FBQTtRQUNULHFEQUFPLENBQUE7SUFDVCxDQUFDLEVBSkksWUFBWSxLQUFaLFlBQVksUUFJaEI7SUFFRCx3REFBd0Q7SUFDeEQsSUFBSyxlQU1KO0lBTkQsV0FBSyxlQUFlO1FBQ2xCLCtEQUFTLENBQUE7UUFDVCwrREFBUyxDQUFBO1FBQ1Qs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LEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDeEUsS0FBSyxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUM7aUJBQ2hDO2FBQ0Y7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNLLDJCQUEyQixDQUFDLElBQXlCO1lBQzNELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN4QyxNQUFNLGVBQWUsR0FBRyxvQkFBRSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlFLElBQUksZUFBZSxLQUFLLFNBQVMsRUFBRTtnQkFDakMsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUNELE9BQU8sZUFBZSxDQUFDLElBQUksQ0FDdkIsQ0FBQyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksS0FBSyxvQkFBRSxDQUFDLFVBQVUsQ0FBQyx1QkFBdUI7Z0JBQ2hFLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDO0tBQ0Y7SUE5UEQsd0dBOFBDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGFydGlhbEV2YWx1YXRvciwgcmVmbGVjdE9iamVjdExpdGVyYWwsIFR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3ByaXZhdGUvbWlncmF0aW9ucyc7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0TWFuYWdlcn0gZnJvbSAnLi4vLi4vdXRpbHMvaW1wb3J0X21hbmFnZXInO1xuaW1wb3J0IHtnZXRBbmd1bGFyRGVjb3JhdG9ycywgTmdEZWNvcmF0b3J9IGZyb20gJy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHtmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ZpbmRfYmFzZV9jbGFzc2VzJztcbmltcG9ydCB7dW53cmFwRXhwcmVzc2lvbn0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9mdW5jdGlvbnMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cbi8qKlxuICogU2V0IG9mIGtub3duIGRlY29yYXRvcnMgdGhhdCBpbmRpY2F0ZSB0aGF0IHRoZSBjdXJyZW50IGNsYXNzIG5lZWRzIGEgZGlyZWN0aXZlXG4gKiBkZWZpbml0aW9uLiBUaGVzZSBkZWNvcmF0b3JzIGFyZSBhbHdheXMgc3BlY2lmaWMgdG8gZGlyZWN0aXZlcy5cbiAqL1xuY29uc3QgRElSRUNUSVZFX0ZJRUxEX0RFQ09SQVRPUlMgPSBuZXcgU2V0KFtcbiAgJ0lucHV0JywgJ091dHB1dCcsICdWaWV3Q2hpbGQnLCAnVmlld0NoaWxkcmVuJywgJ0NvbnRlbnRDaGlsZCcsICdDb250ZW50Q2hpbGRyZW4nLCAnSG9zdEJpbmRpbmcnLFxuICAnSG9zdExpc3RlbmVyJ1xuXSk7XG5cbi8qKlxuICogU2V0IG9mIGtub3duIGxpZmVjeWNsZSBob29rcyB0aGF0IGluZGljYXRlIHRoYXQgdGhlIGN1cnJlbnQgY2xhc3MgbmVlZHMgYSBkaXJlY3RpdmVcbiAqIGRlZmluaXRpb24uIFRoZXNlIGxpZmVjeWNsZSBob29rcyBhcmUgYWx3YXlzIHNwZWNpZmljIHRvIGRpcmVjdGl2ZXMuXG4gKi9cbmNvbnN0IERJUkVDVElWRV9MSUZFQ1lDTEVfSE9PS1MgPSBuZXcgU2V0KFtcbiAgJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nRG9DaGVjaycsICduZ0FmdGVyVmlld0luaXQnLCAnbmdBZnRlclZpZXdDaGVja2VkJyxcbiAgJ25nQWZ0ZXJDb250ZW50SW5pdCcsICduZ0FmdGVyQ29udGVudENoZWNrZWQnXG5dKTtcblxuLyoqXG4gKiBTZXQgb2Yga25vd24gbGlmZWN5Y2xlIGhvb2tzIHRoYXQgaW5kaWNhdGUgdGhhdCBhIGdpdmVuIGNsYXNzIHVzZXMgQW5ndWxhclxuICogZmVhdHVyZXMsIGJ1dCBpdCdzIGFtYmlndW91cyB3aGV0aGVyIGl0IGlzIGEgZGlyZWN0aXZlIG9yIHNlcnZpY2UuXG4gKi9cbmNvbnN0IEFNQklHVU9VU19MSUZFQ1lDTEVfSE9PS1MgPSBuZXcgU2V0KFsnbmdPbkRlc3Ryb3knXSk7XG5cbi8qKiBEZXNjcmliZXMgaG93IGEgZ2l2ZW4gY2xhc3MgaXMgdXNlZCBpbiB0aGUgY29udGV4dCBvZiBBbmd1bGFyLiAqL1xuZW51bSBJbmZlcnJlZEtpbmQge1xuICBESVJFQ1RJVkUsXG4gIEFNQklHVU9VUyxcbiAgVU5LTk9XTixcbn1cblxuLyoqIERlc2NyaWJlcyBwb3NzaWJsZSB0eXBlcyBvZiBBbmd1bGFyIGRlY2xhcmF0aW9ucy4gKi9cbmVudW0gRGVjbGFyYXRpb25UeXBlIHtcbiAgRElSRUNUSVZFLFxuICBDT01QT05FTlQsXG4gIEFCU1RSQUNUX0RJUkVDVElWRSxcbiAgUElQRSxcbiAgSU5KRUNUQUJMRSxcbn1cblxuLyoqIEFuYWx5emVkIGNsYXNzIGRlY2xhcmF0aW9uLiAqL1xuaW50ZXJmYWNlIEFuYWx5emVkQ2xhc3Mge1xuICAvKiogVHlwZSBvZiBkZWNsYXJhdGlvbiB0aGF0IGlzIGRldGVybWluZWQgdGhyb3VnaCBhbiBhcHBsaWVkIGRlY29yYXRvci4gKi9cbiAgZGVjb3JhdGVkVHlwZTogRGVjbGFyYXRpb25UeXBlfG51bGw7XG4gIC8qKiBJbmZlcnJlZCBjbGFzcyBraW5kIGluIHRlcm1zIG9mIEFuZ3VsYXIuICovXG4gIGluZmVycmVkS2luZDogSW5mZXJyZWRLaW5kO1xufVxuXG5pbnRlcmZhY2UgQW5hbHlzaXNGYWlsdXJlIHtcbiAgbm9kZTogdHMuTm9kZTtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG4vKiogVE9ETyBtZXNzYWdlIHRoYXQgaXMgYWRkZWQgdG8gYW1iaWd1b3VzIGNsYXNzZXMgdXNpbmcgQW5ndWxhciBmZWF0dXJlcy4gKi9cbmNvbnN0IEFNQklHVU9VU19DTEFTU19UT0RPID0gJ0FkZCBBbmd1bGFyIGRlY29yYXRvci4nO1xuXG5leHBvcnQgY2xhc3MgVW5kZWNvcmF0ZWRDbGFzc2VzV2l0aERlY29yYXRlZEZpZWxkc1RyYW5zZm9ybSB7XG4gIHByaXZhdGUgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcbiAgcHJpdmF0ZSBpbXBvcnRNYW5hZ2VyID0gbmV3IEltcG9ydE1hbmFnZXIodGhpcy5nZXRVcGRhdGVSZWNvcmRlciwgdGhpcy5wcmludGVyKTtcbiAgcHJpdmF0ZSByZWZsZWN0aW9uSG9zdCA9IG5ldyBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3QodGhpcy50eXBlQ2hlY2tlcik7XG4gIHByaXZhdGUgcGFydGlhbEV2YWx1YXRvciA9IG5ldyBQYXJ0aWFsRXZhbHVhdG9yKHRoaXMucmVmbGVjdGlvbkhvc3QsIHRoaXMudHlwZUNoZWNrZXIsIG51bGwpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIGdldFVwZGF0ZVJlY29yZGVyOiAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IFVwZGF0ZVJlY29yZGVyKSB7fVxuXG4gIC8qKlxuICAgKiBNaWdyYXRlcyB0aGUgc3BlY2lmaWVkIHNvdXJjZSBmaWxlcy4gVGhlIHRyYW5zZm9ybSBhZGRzIHRoZSBhYnN0cmFjdCBgQERpcmVjdGl2ZWBcbiAgICogZGVjb3JhdG9yIHRvIHVuZGVjb3JhdGVkIGNsYXNzZXMgdGhhdCB1c2UgQW5ndWxhciBmZWF0dXJlcy4gQ2xhc3MgbWVtYmVycyB3aGljaFxuICAgKiBhcmUgZGVjb3JhdGVkIHdpdGggYW55IEFuZ3VsYXIgZGVjb3JhdG9yLCBvciBjbGFzcyBtZW1iZXJzIGZvciBsaWZlY3ljbGUgaG9va3MgYXJlXG4gICAqIGluZGljYXRpbmcgdGhhdCBhIGdpdmVuIGNsYXNzIHVzZXMgQW5ndWxhciBmZWF0dXJlcy4gaHR0cHM6Ly9oYWNrbWQuaW8vdnVRZmF2emZSRzZLVUN0VTdvS19FQVxuICAgKi9cbiAgbWlncmF0ZShzb3VyY2VGaWxlczogdHMuU291cmNlRmlsZVtdKTogQW5hbHlzaXNGYWlsdXJlW10ge1xuICAgIGNvbnN0IHtkZXRlY3RlZEFic3RyYWN0RGlyZWN0aXZlcywgYW1iaWd1b3VzQ2xhc3Nlc30gPVxuICAgICAgICB0aGlzLl9maW5kVW5kZWNvcmF0ZWRBYnN0cmFjdERpcmVjdGl2ZXMoc291cmNlRmlsZXMpO1xuXG4gICAgZGV0ZWN0ZWRBYnN0cmFjdERpcmVjdGl2ZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUV4cHIgPVxuICAgICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoc291cmNlRmlsZSwgJ0RpcmVjdGl2ZScsICdAYW5ndWxhci9jb3JlJyk7XG4gICAgICBjb25zdCBkZWNvcmF0b3JFeHByID0gdHMuY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoZGlyZWN0aXZlRXhwciwgdW5kZWZpbmVkLCB1bmRlZmluZWQpKTtcbiAgICAgIHJlY29yZGVyLmFkZENsYXNzRGVjb3JhdG9yKFxuICAgICAgICAgIG5vZGUsIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIGRlY29yYXRvckV4cHIsIHNvdXJjZUZpbGUpKTtcbiAgICB9KTtcblxuICAgIC8vIEFtYmlndW91cyBjbGFzc2VzIGNsZWFybHkgdXNlIEFuZ3VsYXIgZmVhdHVyZXMsIGJ1dCB0aGUgbWlncmF0aW9uIGlzIHVuYWJsZSB0b1xuICAgIC8vIGRldGVybWluZSB3aGV0aGVyIHRoZSBjbGFzcyBpcyB1c2VkIGFzIGRpcmVjdGl2ZSwgc2VydmljZSBvciBwaXBlLiBUaGUgbWlncmF0aW9uXG4gICAgLy8gY291bGQgcG90ZW50aWFsbHkgZGV0ZXJtaW5lIHRoZSB0eXBlIGJ5IGNoZWNraW5nIE5nTW9kdWxlIGRlZmluaXRpb25zIG9yIGluaGVyaXRhbmNlXG4gICAgLy8gb2Ygb3RoZXIga25vd24gZGVjbGFyYXRpb25zLCBidXQgdGhpcyBpcyBvdXQgb2Ygc2NvcGUgYW5kIGEgVE9ETy9mYWlsdXJlIGlzIHN1ZmZpY2llbnQuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oYW1iaWd1b3VzQ2xhc3NlcykucmVkdWNlKChmYWlsdXJlcywgbm9kZSkgPT4ge1xuICAgICAgLy8gSWYgdGhlIGNsYXNzIGhhcyBiZWVuIHJlcG9ydGVkIGFzIGFtYmlndW91cyBiZWZvcmUsIHNraXAgYWRkaW5nIGEgVE9ETyBhbmRcbiAgICAgIC8vIHByaW50aW5nIGFuIGVycm9yLiBBIGNsYXNzIGNvdWxkIGJlIHZpc2l0ZWQgbXVsdGlwbGUgdGltZXMgd2hlbiBpdCdzIHBhcnRcbiAgICAgIC8vIG9mIG11bHRpcGxlIGJ1aWxkIHRhcmdldHMgaW4gdGhlIENMSSBwcm9qZWN0LlxuICAgICAgaWYgKHRoaXMuX2hhc0JlZW5SZXBvcnRlZEFzQW1iaWd1b3VzKG5vZGUpKSB7XG4gICAgICAgIHJldHVybiBmYWlsdXJlcztcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGUpO1xuXG4gICAgICAvLyBBZGQgYSBUT0RPIHRvIHRoZSBjbGFzcyB0aGF0IHVzZXMgQW5ndWxhciBmZWF0dXJlcyBidXQgaXMgbm90IGRlY29yYXRlZC5cbiAgICAgIHJlY29yZGVyLmFkZENsYXNzVG9kbyhub2RlLCBBTUJJR1VPVVNfQ0xBU1NfVE9ETyk7XG5cbiAgICAgIC8vIEFkZCBhbiBlcnJvciBmb3IgdGhlIGNsYXNzIHRoYXQgd2lsbCBiZSBwcmludGVkIGluIHRoZSBgbmcgdXBkYXRlYCBvdXRwdXQuXG4gICAgICByZXR1cm4gZmFpbHVyZXMuY29uY2F0KHtcbiAgICAgICAgbm9kZSxcbiAgICAgICAgbWVzc2FnZTogJ0NsYXNzIHVzZXMgQW5ndWxhciBmZWF0dXJlcyBidXQgY2Fubm90IGJlIG1pZ3JhdGVkIGF1dG9tYXRpY2FsbHkuIFBsZWFzZSAnICtcbiAgICAgICAgICAgICdhZGQgYW4gYXBwcm9wcmlhdGUgQW5ndWxhciBkZWNvcmF0b3IuJ1xuICAgICAgfSk7XG4gICAgfSwgW10gYXMgQW5hbHlzaXNGYWlsdXJlW10pO1xuICB9XG5cbiAgLyoqIFJlY29yZHMgYWxsIGNoYW5nZXMgdGhhdCB3ZXJlIG1hZGUgaW4gdGhlIGltcG9ydCBtYW5hZ2VyLiAqL1xuICByZWNvcmRDaGFuZ2VzKCkge1xuICAgIHRoaXMuaW1wb3J0TWFuYWdlci5yZWNvcmRDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgdW5kZWNvcmF0ZWQgYWJzdHJhY3QgZGlyZWN0aXZlcyBpbiB0aGUgc3BlY2lmaWVkIHNvdXJjZSBmaWxlcy4gQWxzbyByZXR1cm5zXG4gICAqIGEgc2V0IG9mIHVuZGVjb3JhdGVkIGNsYXNzZXMgd2hpY2ggY291bGQgbm90IGJlIGRldGVjdGVkIGFzIGd1YXJhbnRlZWQgYWJzdHJhY3RcbiAgICogZGlyZWN0aXZlcy4gVGhvc2UgYXJlIGFtYmlndW91cyBhbmQgY291bGQgYmUgZWl0aGVyIERpcmVjdGl2ZSwgUGlwZSBvciBzZXJ2aWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZmluZFVuZGVjb3JhdGVkQWJzdHJhY3REaXJlY3RpdmVzKHNvdXJjZUZpbGVzOiB0cy5Tb3VyY2VGaWxlW10pIHtcbiAgICBjb25zdCBhbWJpZ3VvdXNDbGFzc2VzID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuICAgIGNvbnN0IGRlY2xhcmF0aW9ucyA9IG5ldyBXZWFrTWFwPHRzLkNsYXNzRGVjbGFyYXRpb24sIERlY2xhcmF0aW9uVHlwZT4oKTtcbiAgICBjb25zdCBkZXRlY3RlZEFic3RyYWN0RGlyZWN0aXZlcyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcbiAgICBjb25zdCB1bmRlY29yYXRlZENsYXNzZXMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG5cbiAgICBjb25zdCB2aXNpdE5vZGUgPSAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgbm9kZS5mb3JFYWNoQ2hpbGQodmlzaXROb2RlKTtcbiAgICAgIGlmICghdHMuaXNDbGFzc0RlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHtpbmZlcnJlZEtpbmQsIGRlY29yYXRlZFR5cGV9ID0gdGhpcy5fYW5hbHl6ZUNsYXNzRGVjbGFyYXRpb24obm9kZSk7XG5cbiAgICAgIGlmIChkZWNvcmF0ZWRUeXBlICE9PSBudWxsKSB7XG4gICAgICAgIGRlY2xhcmF0aW9ucy5zZXQobm9kZSwgZGVjb3JhdGVkVHlwZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGluZmVycmVkS2luZCA9PT0gSW5mZXJyZWRLaW5kLkRJUkVDVElWRSkge1xuICAgICAgICBkZXRlY3RlZEFic3RyYWN0RGlyZWN0aXZlcy5hZGQobm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKGluZmVycmVkS2luZCA9PT0gSW5mZXJyZWRLaW5kLkFNQklHVU9VUykge1xuICAgICAgICBhbWJpZ3VvdXNDbGFzc2VzLmFkZChub2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZGVjb3JhdGVkQ2xhc3Nlcy5hZGQobm9kZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiBzb3VyY2VGaWxlLmZvckVhY2hDaGlsZCh2aXNpdE5vZGUpKTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyB0aGUgaW5oZXJpdGFuY2Ugb2YgdGhlIGdpdmVuIHNldCBvZiBjbGFzc2VzLiBJdCByZW1vdmVzIGNsYXNzZXMgZnJvbSB0aGVcbiAgICAgKiBkZXRlY3RlZCBhYnN0cmFjdCBkaXJlY3RpdmVzIHNldCB3aGVuIHRoZXkgaW5oZXJpdCBmcm9tIGEgbm9uLWFic3RyYWN0IEFuZ3VsYXJcbiAgICAgKiBkZWNsYXJhdGlvbi4gZS5nLiBhbiBhYnN0cmFjdCBkaXJlY3RpdmUgY2FuIG5ldmVyIGV4dGVuZCBmcm9tIGEgY29tcG9uZW50LlxuICAgICAqXG4gICAgICogSWYgYSBjbGFzcyBpbmhlcml0cyBmcm9tIGFuIGFic3RyYWN0IGRpcmVjdGl2ZSB0aG91Z2gsIHdlIHdpbGwgbWlncmF0ZSB0aGVtIHRvb1xuICAgICAqIGFzIGRlcml2ZWQgY2xhc3NlcyBhbHNvIG5lZWQgdG8gYmUgZGVjb3JhdGVkLiBUaGlzIGhhcyBiZWVuIGRvbmUgZm9yIGEgc2ltcGxlciBtZW50YWxcbiAgICAgKiBtb2RlbCBhbmQgcmVkdWNlZCBjb21wbGV4aXR5IGluIHRoZSBBbmd1bGFyIGNvbXBpbGVyLiBTZWUgbWlncmF0aW9uIHBsYW4gZG9jdW1lbnQuXG4gICAgICovXG4gICAgY29uc3QgY2hlY2tJbmhlcml0YW5jZU9mQ2xhc3NlcyA9IChjbGFzc2VzOiBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4pID0+IHtcbiAgICAgIGNsYXNzZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgICAgZm9yIChjb25zdCB7bm9kZTogYmFzZUNsYXNzfSBvZiBmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIpKSB7XG4gICAgICAgICAgaWYgKCFkZWNsYXJhdGlvbnMuaGFzKGJhc2VDbGFzcykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBJZiB0aGUgdW5kZWNvcmF0ZWQgY2xhc3MgaW5oZXJpdHMgZnJvbSBhbiBhYnN0cmFjdCBkaXJlY3RpdmUsIGFsd2F5cyBtaWdyYXRlIGl0LlxuICAgICAgICAgIC8vIERlcml2ZWQgdW5kZWNvcmF0ZWQgY2xhc3NlcyBvZiBhYnN0cmFjdCBkaXJlY3RpdmVzIGFyZSBhbHdheXMgYWxzbyBjb25zaWRlcmVkXG4gICAgICAgICAgLy8gYWJzdHJhY3QgZGlyZWN0aXZlcyBhbmQgbmVlZCB0byBiZSBkZWNvcmF0ZWQgdG9vLiBUaGlzIGlzIG5lY2Vzc2FyeSBhcyBvdGhlcndpc2VcbiAgICAgICAgICAvLyB0aGUgaW5oZXJpdGFuY2UgY2hhaW4gY2Fubm90IGJlIHJlc29sdmVkIGJ5IHRoZSBBbmd1bGFyIGNvbXBpbGVyLiBlLmcuIHdoZW4gaXRcbiAgICAgICAgICAvLyBmbGF0dGVucyBkaXJlY3RpdmUgbWV0YWRhdGEgZm9yIHR5cGUgY2hlY2tpbmcuIEluIHRoZSBvdGhlciBjYXNlLCB3ZSBuZXZlciB3YW50XG4gICAgICAgICAgLy8gdG8gbWlncmF0ZSBhIGNsYXNzIGlmIGl0IGV4dGVuZHMgZnJvbSBhIG5vbi1hYnN0cmFjdCBBbmd1bGFyIGRlY2xhcmF0aW9uLiBUaGF0XG4gICAgICAgICAgLy8gaXMgYW4gdW5zdXBwb3J0ZWQgcGF0dGVybiBhcyBvZiB2OSBhbmQgd2FzIHByZXZpb3VzbHkgaGFuZGxlZCB3aXRoIHRoZVxuICAgICAgICAgIC8vIGB1bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGlgIG1pZ3JhdGlvbiAod2hpY2ggY29waWVkIHRoZSBpbmhlcml0ZWQgZGVjb3JhdG9yKS5cbiAgICAgICAgICBpZiAoZGVjbGFyYXRpb25zLmdldChiYXNlQ2xhc3MpID09PSBEZWNsYXJhdGlvblR5cGUuQUJTVFJBQ1RfRElSRUNUSVZFKSB7XG4gICAgICAgICAgICBkZXRlY3RlZEFic3RyYWN0RGlyZWN0aXZlcy5hZGQobm9kZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRldGVjdGVkQWJzdHJhY3REaXJlY3RpdmVzLmRlbGV0ZShub2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYW1iaWd1b3VzQ2xhc3Nlcy5kZWxldGUobm9kZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBDaGVjayBpbmhlcml0YW5jZSBvZiBhbnkgZGV0ZWN0ZWQgYWJzdHJhY3QgZGlyZWN0aXZlLiBXZSB3YW50IHRvIHJlbW92ZVxuICAgIC8vIGNsYXNzZXMgdGhhdCBhcmUgbm90IGVsaWdpYmxlIGFic3RyYWN0IGRpcmVjdGl2ZXMgZHVlIHRvIGluaGVyaXRhbmNlLiBpLmUuXG4gICAgLy8gaWYgYSBjbGFzcyBleHRlbmRzIGZyb20gYSBjb21wb25lbnQsIGl0IGNhbm5vdCBiZSBhIGRlcml2ZWQgYWJzdHJhY3QgZGlyZWN0aXZlLlxuICAgIGNoZWNrSW5oZXJpdGFuY2VPZkNsYXNzZXMoZGV0ZWN0ZWRBYnN0cmFjdERpcmVjdGl2ZXMpO1xuICAgIC8vIFVwZGF0ZSB0aGUgY2xhc3MgZGVjbGFyYXRpb25zIHRvIHJlZmxlY3QgdGhlIGRldGVjdGVkIGFic3RyYWN0IGRpcmVjdGl2ZXMuIFRoaXMgaXNcbiAgICAvLyB0aGVuIHVzZWQgbGF0ZXIgd2hlbiB3ZSBjaGVjayBmb3IgdW5kZWNvcmF0ZWQgY2xhc3NlcyB0aGF0IGluaGVyaXQgZnJvbSBhbiBhYnN0cmFjdFxuICAgIC8vIGRpcmVjdGl2ZSBhbmQgbmVlZCB0byBiZSBkZWNvcmF0ZWQuXG4gICAgZGV0ZWN0ZWRBYnN0cmFjdERpcmVjdGl2ZXMuZm9yRWFjaChcbiAgICAgICAgbiA9PiBkZWNsYXJhdGlvbnMuc2V0KG4sIERlY2xhcmF0aW9uVHlwZS5BQlNUUkFDVF9ESVJFQ1RJVkUpKTtcbiAgICAvLyBDaGVjayBhbWJpZ3VvdXMgYW5kIHVuZGVjb3JhdGVkIGNsYXNzZXMgaWYgdGhleSBpbmhlcml0IGZyb20gYW4gYWJzdHJhY3QgZGlyZWN0aXZlLlxuICAgIC8vIElmIHRoZXkgZG8sIHdlIHdhbnQgdG8gbWlncmF0ZSB0aGVtIHRvby4gU2VlIGZ1bmN0aW9uIGRlZmluaXRpb24gZm9yIG1vcmUgZGV0YWlscy5cbiAgICBjaGVja0luaGVyaXRhbmNlT2ZDbGFzc2VzKGFtYmlndW91c0NsYXNzZXMpO1xuICAgIGNoZWNrSW5oZXJpdGFuY2VPZkNsYXNzZXModW5kZWNvcmF0ZWRDbGFzc2VzKTtcblxuICAgIHJldHVybiB7ZGV0ZWN0ZWRBYnN0cmFjdERpcmVjdGl2ZXMsIGFtYmlndW91c0NsYXNzZXN9O1xuICB9XG5cbiAgLyoqXG4gICAqIEFuYWx5emVzIHRoZSBnaXZlbiBjbGFzcyBkZWNsYXJhdGlvbiBieSBkZXRlcm1pbmluZyB3aGV0aGVyIHRoZSBjbGFzc1xuICAgKiBpcyBhIGRpcmVjdGl2ZSwgaXMgYW4gYWJzdHJhY3QgZGlyZWN0aXZlLCBvciB1c2VzIEFuZ3VsYXIgZmVhdHVyZXMuXG4gICAqL1xuICBwcml2YXRlIF9hbmFseXplQ2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogQW5hbHl6ZWRDbGFzcyB7XG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID0gbm9kZS5kZWNvcmF0b3JzICYmIGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuZGVjb3JhdG9ycyk7XG4gICAgY29uc3QgaW5mZXJyZWRLaW5kID0gdGhpcy5fZGV0ZXJtaW5lQ2xhc3NLaW5kKG5vZGUpO1xuICAgIGlmIChuZ0RlY29yYXRvcnMgPT09IHVuZGVmaW5lZCB8fCBuZ0RlY29yYXRvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge2RlY29yYXRlZFR5cGU6IG51bGwsIGluZmVycmVkS2luZH07XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZURlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdEaXJlY3RpdmUnKTtcbiAgICBjb25zdCBjb21wb25lbnREZWNvcmF0b3IgPSBuZ0RlY29yYXRvcnMuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnQ29tcG9uZW50Jyk7XG4gICAgY29uc3QgcGlwZURlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdQaXBlJyk7XG4gICAgY29uc3QgaW5qZWN0YWJsZURlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdJbmplY3RhYmxlJyk7XG4gICAgY29uc3QgaXNBYnN0cmFjdERpcmVjdGl2ZSA9XG4gICAgICAgIGRpcmVjdGl2ZURlY29yYXRvciAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2lzQWJzdHJhY3REaXJlY3RpdmUoZGlyZWN0aXZlRGVjb3JhdG9yKTtcblxuICAgIGxldCBkZWNvcmF0ZWRUeXBlOiBEZWNsYXJhdGlvblR5cGV8bnVsbCA9IG51bGw7XG4gICAgaWYgKGlzQWJzdHJhY3REaXJlY3RpdmUpIHtcbiAgICAgIGRlY29yYXRlZFR5cGUgPSBEZWNsYXJhdGlvblR5cGUuQUJTVFJBQ1RfRElSRUNUSVZFO1xuICAgIH0gZWxzZSBpZiAoY29tcG9uZW50RGVjb3JhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlY29yYXRlZFR5cGUgPSBEZWNsYXJhdGlvblR5cGUuQ09NUE9ORU5UO1xuICAgIH0gZWxzZSBpZiAoZGlyZWN0aXZlRGVjb3JhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlY29yYXRlZFR5cGUgPSBEZWNsYXJhdGlvblR5cGUuRElSRUNUSVZFO1xuICAgIH0gZWxzZSBpZiAocGlwZURlY29yYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkZWNvcmF0ZWRUeXBlID0gRGVjbGFyYXRpb25UeXBlLlBJUEU7XG4gICAgfSBlbHNlIGlmIChpbmplY3RhYmxlRGVjb3JhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlY29yYXRlZFR5cGUgPSBEZWNsYXJhdGlvblR5cGUuSU5KRUNUQUJMRTtcbiAgICB9XG4gICAgcmV0dXJuIHtkZWNvcmF0ZWRUeXBlLCBpbmZlcnJlZEtpbmR9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBkZWNvcmF0b3IgcmVzb2x2ZXMgdG8gYW4gYWJzdHJhY3QgZGlyZWN0aXZlLiBBbiBkaXJlY3RpdmUgaXNcbiAgICogY29uc2lkZXJlZCBcImFic3RyYWN0XCIgaWYgdGhlcmUgaXMgbm8gc2VsZWN0b3Igc3BlY2lmaWVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfaXNBYnN0cmFjdERpcmVjdGl2ZSh7bm9kZX06IE5nRGVjb3JhdG9yKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbWV0YWRhdGFBcmdzID0gbm9kZS5leHByZXNzaW9uLmFyZ3VtZW50cztcbiAgICBpZiAobWV0YWRhdGFBcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IG1ldGFkYXRhRXhwciA9IHVud3JhcEV4cHJlc3Npb24obWV0YWRhdGFBcmdzWzBdKTtcbiAgICBpZiAoIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obWV0YWRhdGFFeHByKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBtZXRhZGF0YSA9IHJlZmxlY3RPYmplY3RMaXRlcmFsKG1ldGFkYXRhRXhwcik7XG4gICAgaWYgKCFtZXRhZGF0YS5oYXMoJ3NlbGVjdG9yJykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0b3IgPSB0aGlzLnBhcnRpYWxFdmFsdWF0b3IuZXZhbHVhdGUobWV0YWRhdGEuZ2V0KCdzZWxlY3RvcicpISk7XG4gICAgcmV0dXJuIHNlbGVjdG9yID09IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUga2luZCBvZiBhIGdpdmVuIGNsYXNzIGluIHRlcm1zIG9mIEFuZ3VsYXIuIFRoZSBtZXRob2QgY2hlY2tzXG4gICAqIHdoZXRoZXIgdGhlIGdpdmVuIGNsYXNzIGhhcyBtZW1iZXJzIHRoYXQgaW5kaWNhdGUgdGhlIHVzZSBvZiBBbmd1bGFyIGZlYXR1cmVzLlxuICAgKiBlLmcuIGxpZmVjeWNsZSBob29rcyBvciBkZWNvcmF0ZWQgbWVtYmVycyBsaWtlIGBASW5wdXRgIG9yIGBAT3V0cHV0YCBhcmVcbiAgICogY29uc2lkZXJlZCBBbmd1bGFyIGZlYXR1cmVzLi5cbiAgICovXG4gIHByaXZhdGUgX2RldGVybWluZUNsYXNzS2luZChub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogSW5mZXJyZWRLaW5kIHtcbiAgICBsZXQgdXNhZ2UgPSBJbmZlcnJlZEtpbmQuVU5LTk9XTjtcblxuICAgIGZvciAoY29uc3QgbWVtYmVyIG9mIG5vZGUubWVtYmVycykge1xuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gbWVtYmVyLm5hbWUgIT09IHVuZGVmaW5lZCA/IGdldFByb3BlcnR5TmFtZVRleHQobWVtYmVyLm5hbWUpIDogbnVsbDtcblxuICAgICAgLy8gSWYgdGhlIGNsYXNzIGRlY2xhcmVzIGFueSBvZiB0aGUga25vd24gZGlyZWN0aXZlIGxpZmVjeWNsZSBob29rcywgd2UgY2FuXG4gICAgICAvLyBpbW1lZGlhdGVseSBleGl0IHRoZSBsb29wIGFzIHRoZSBjbGFzcyBpcyBndWFyYW50ZWVkIHRvIGJlIGEgZGlyZWN0aXZlLlxuICAgICAgaWYgKHByb3BlcnR5TmFtZSAhPT0gbnVsbCAmJiBESVJFQ1RJVkVfTElGRUNZQ0xFX0hPT0tTLmhhcyhwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgIHJldHVybiBJbmZlcnJlZEtpbmQuRElSRUNUSVZFO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBtZW1iZXIuZGVjb3JhdG9ycyAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgICBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBtZW1iZXIuZGVjb3JhdG9ycykgOlxuICAgICAgICAgIFtdO1xuICAgICAgZm9yIChjb25zdCB7bmFtZX0gb2YgbmdEZWNvcmF0b3JzKSB7XG4gICAgICAgIGlmIChESVJFQ1RJVkVfRklFTERfREVDT1JBVE9SUy5oYXMobmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gSW5mZXJyZWRLaW5kLkRJUkVDVElWRTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgY2xhc3MgZGVjbGFyZXMgYW55IG9mIHRoZSBsaWZlY3ljbGUgaG9va3MgdGhhdCBkbyBub3QgZ3VhcmFudGVlIHRoYXRcbiAgICAgIC8vIHRoZSBnaXZlbiBjbGFzcyBpcyBhIGRpcmVjdGl2ZSwgdXBkYXRlIHRoZSBraW5kIGFuZCBjb250aW51ZSBsb29raW5nIGZvciBvdGhlclxuICAgICAgLy8gbWVtYmVycyB0aGF0IHdvdWxkIHVudmVpbCBhIG1vcmUgc3BlY2lmaWMga2luZCAoaS5lLiBiZWluZyBhIGRpcmVjdGl2ZSkuXG4gICAgICBpZiAocHJvcGVydHlOYW1lICE9PSBudWxsICYmIEFNQklHVU9VU19MSUZFQ1lDTEVfSE9PS1MuaGFzKHByb3BlcnR5TmFtZSkpIHtcbiAgICAgICAgdXNhZ2UgPSBJbmZlcnJlZEtpbmQuQU1CSUdVT1VTO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1c2FnZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIGNsYXNzIGhhcyBiZWVuIHJlcG9ydGVkIGFzIGFtYmlndW91cyBpbiBwcmV2aW91c1xuICAgKiBtaWdyYXRpb24gcnVuLiBlLmcuIHdoZW4gYnVpbGQgdGFyZ2V0cyBhcmUgbWlncmF0ZWQgZmlyc3QsIGFuZCB0aGVuIHRlc3RcbiAgICogdGFyZ2V0cyB0aGF0IGhhdmUgYW4gb3ZlcmxhcCB3aXRoIGJ1aWxkIHNvdXJjZSBmaWxlcywgdGhlIHNhbWUgY2xhc3NcbiAgICogY291bGQgYmUgZGV0ZWN0ZWQgYXMgYW1iaWd1b3VzLlxuICAgKi9cbiAgcHJpdmF0ZSBfaGFzQmVlblJlcG9ydGVkQXNBbWJpZ3VvdXMobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCBsZWFkaW5nQ29tbWVudHMgPSB0cy5nZXRMZWFkaW5nQ29tbWVudFJhbmdlcyhzb3VyY2VGaWxlLnRleHQsIG5vZGUucG9zKTtcbiAgICBpZiAobGVhZGluZ0NvbW1lbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGxlYWRpbmdDb21tZW50cy5zb21lKFxuICAgICAgICAoe2tpbmQsIHBvcywgZW5kfSkgPT4ga2luZCA9PT0gdHMuU3ludGF4S2luZC5TaW5nbGVMaW5lQ29tbWVudFRyaXZpYSAmJlxuICAgICAgICAgICAgc291cmNlRmlsZS50ZXh0LnN1YnN0cmluZyhwb3MsIGVuZCkuaW5jbHVkZXMoYFRPRE86ICR7QU1CSUdVT1VTX0NMQVNTX1RPRE99YCkpO1xuICB9XG59XG4iXX0=