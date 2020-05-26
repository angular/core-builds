/**
 * @license
 * Copyright Google LLC All Rights Reserved.
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
        define("@angular/core/schematics/migrations/undecorated-classes-with-decorated-fields/transform", ["require", "exports", "@angular/compiler-cli/src/ngtsc/partial_evaluator", "@angular/compiler-cli/src/ngtsc/reflection", "typescript", "@angular/core/schematics/utils/import_manager", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/find_base_classes", "@angular/core/schematics/utils/typescript/functions", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndecoratedClassesWithDecoratedFieldsTransform = void 0;
    const partial_evaluator_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator");
    const reflection_1 = require("@angular/compiler-cli/src/ngtsc/reflection");
    const ts = require("typescript");
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
    var ClassKind;
    (function (ClassKind) {
        ClassKind[ClassKind["DIRECTIVE"] = 0] = "DIRECTIVE";
        ClassKind[ClassKind["AMBIGUOUS"] = 1] = "AMBIGUOUS";
        ClassKind[ClassKind["UNKNOWN"] = 2] = "UNKNOWN";
    })(ClassKind || (ClassKind = {}));
    class UndecoratedClassesWithDecoratedFieldsTransform {
        constructor(typeChecker, getUpdateRecorder) {
            this.typeChecker = typeChecker;
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = ts.createPrinter();
            this.importManager = new import_manager_1.ImportManager(this.getUpdateRecorder, this.printer);
            this.reflectionHost = new reflection_1.TypeScriptReflectionHost(this.typeChecker);
            this.partialEvaluator = new partial_evaluator_1.PartialEvaluator(this.reflectionHost, this.typeChecker, null);
        }
        /**
         * Migrates the specified source files. The transform adds the abstract `@Directive`
         * decorator to undecorated classes that use Angular features. Class members which
         * are decorated with any Angular decorator, or class members for lifecycle hooks are
         * indicating that a given class uses Angular features. https://hackmd.io/vuQfavzfRG6KUCtU7oK_EA
         */
        migrate(sourceFiles) {
            const { result, ambiguous } = this._findUndecoratedAbstractDirectives(sourceFiles);
            result.forEach(node => {
                const sourceFile = node.getSourceFile();
                const recorder = this.getUpdateRecorder(sourceFile);
                const directiveExpr = this.importManager.addImportToSourceFile(sourceFile, 'Directive', '@angular/core');
                const decoratorExpr = ts.createDecorator(ts.createCall(directiveExpr, undefined, undefined));
                recorder.addClassDecorator(node, this.printer.printNode(ts.EmitHint.Unspecified, decoratorExpr, sourceFile));
            });
            // Ambiguous classes clearly use Angular features, but the migration is unable to
            // determine whether the class is used as directive, service or pipe. The migration
            // could potentially determine the type by checking NgModule definitions or inheritance
            // of other known declarations, but this is out of scope and a TODO/failure is sufficient.
            return Array.from(ambiguous).reduce((failures, node) => {
                const sourceFile = node.getSourceFile();
                const recorder = this.getUpdateRecorder(sourceFile);
                // Add a TODO to the class that uses Angular features but is not decorated.
                recorder.addClassTodo(node, `Add Angular decorator.`);
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
            const result = new Set();
            const undecoratedClasses = new Set();
            const nonAbstractDirectives = new WeakSet();
            const abstractDirectives = new WeakSet();
            const ambiguous = new Set();
            const visitNode = (node) => {
                node.forEachChild(visitNode);
                if (!ts.isClassDeclaration(node)) {
                    return;
                }
                const { isDirectiveOrComponent, isAbstractDirective, kind } = this._analyzeClassDeclaration(node);
                if (isDirectiveOrComponent) {
                    if (isAbstractDirective) {
                        abstractDirectives.add(node);
                    }
                    else {
                        nonAbstractDirectives.add(node);
                    }
                }
                else if (kind === ClassKind.DIRECTIVE) {
                    abstractDirectives.add(node);
                    result.add(node);
                }
                else {
                    if (kind === ClassKind.AMBIGUOUS) {
                        ambiguous.add(node);
                    }
                    undecoratedClasses.add(node);
                }
            };
            sourceFiles.forEach(sourceFile => sourceFile.forEachChild(visitNode));
            // We collected all undecorated class declarations which inherit from abstract directives.
            // For such abstract directives, the derived classes also need to be migrated.
            undecoratedClasses.forEach(node => {
                for (const { node: baseClass } of find_base_classes_1.findBaseClassDeclarations(node, this.typeChecker)) {
                    // If the undecorated class inherits from a non-abstract directive, skip the current
                    // class. We do this because undecorated classes which inherit metadata from non-abstract
                    // directives are handled in the `undecorated-classes-with-di` migration that copies
                    // inherited metadata into an explicit decorator.
                    if (nonAbstractDirectives.has(baseClass)) {
                        break;
                    }
                    else if (abstractDirectives.has(baseClass)) {
                        result.add(node);
                        // In case the undecorated class previously could not be detected as directive,
                        // remove it from the ambiguous set as we now know that it's a guaranteed directive.
                        ambiguous.delete(node);
                        break;
                    }
                }
            });
            return { result, ambiguous };
        }
        /**
         * Analyzes the given class declaration by determining whether the class
         * is a directive, is an abstract directive, or uses Angular features.
         */
        _analyzeClassDeclaration(node) {
            const ngDecorators = node.decorators && ng_decorators_1.getAngularDecorators(this.typeChecker, node.decorators);
            const kind = this._determineClassKind(node);
            if (ngDecorators === undefined || ngDecorators.length === 0) {
                return { isDirectiveOrComponent: false, isAbstractDirective: false, kind };
            }
            const directiveDecorator = ngDecorators.find(({ name }) => name === 'Directive');
            const componentDecorator = ngDecorators.find(({ name }) => name === 'Component');
            const isAbstractDirective = directiveDecorator !== undefined && this._isAbstractDirective(directiveDecorator);
            return {
                isDirectiveOrComponent: !!directiveDecorator || !!componentDecorator,
                isAbstractDirective,
                kind,
            };
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
            const metadataExpr = functions_1.unwrapExpression(metadataArgs[0]);
            if (!ts.isObjectLiteralExpression(metadataExpr)) {
                return false;
            }
            const metadata = reflection_1.reflectObjectLiteral(metadataExpr);
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
            let usage = ClassKind.UNKNOWN;
            for (const member of node.members) {
                const propertyName = member.name !== undefined ? property_name_1.getPropertyNameText(member.name) : null;
                // If the class declares any of the known directive lifecycle hooks, we can
                // immediately exit the loop as the class is guaranteed to be a directive.
                if (propertyName !== null && DIRECTIVE_LIFECYCLE_HOOKS.has(propertyName)) {
                    return ClassKind.DIRECTIVE;
                }
                const ngDecorators = member.decorators !== undefined ?
                    ng_decorators_1.getAngularDecorators(this.typeChecker, member.decorators) :
                    [];
                for (const { name } of ngDecorators) {
                    if (DIRECTIVE_FIELD_DECORATORS.has(name)) {
                        return ClassKind.DIRECTIVE;
                    }
                }
                // If the class declares any of the lifecycle hooks that do not guarantee that
                // the given class is a directive, update the kind and continue looking for other
                // members that would unveil a more specific kind (i.e. being a directive).
                if (propertyName !== null && AMBIGUOUS_LIFECYCLE_HOOKS.has(propertyName)) {
                    usage = ClassKind.AMBIGUOUS;
                }
            }
            return usage;
        }
    }
    exports.UndecoratedClassesWithDecoratedFieldsTransform = UndecoratedClassesWithDecoratedFieldsTransform;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRlY29yYXRlZC1maWVsZHMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILHlGQUFtRjtJQUNuRiwyRUFBMEc7SUFDMUcsaUNBQWlDO0lBRWpDLGtGQUF5RDtJQUN6RCxnRkFBNEU7SUFDNUUsbUdBQW1GO0lBQ25GLG1GQUFrRTtJQUNsRSwyRkFBeUU7SUFJekU7OztPQUdHO0lBQ0gsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLEdBQUcsQ0FBQztRQUN6QyxPQUFPLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLGFBQWE7UUFDaEcsY0FBYztLQUNmLENBQUMsQ0FBQztJQUVIOzs7T0FHRztJQUNILE1BQU0seUJBQXlCLEdBQUcsSUFBSSxHQUFHLENBQUM7UUFDeEMsYUFBYSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsb0JBQW9CO1FBQy9FLG9CQUFvQixFQUFFLHVCQUF1QjtLQUM5QyxDQUFDLENBQUM7SUFFSDs7O09BR0c7SUFDSCxNQUFNLHlCQUF5QixHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUUzRCxxRUFBcUU7SUFDckUsSUFBSyxTQUlKO0lBSkQsV0FBSyxTQUFTO1FBQ1osbURBQVMsQ0FBQTtRQUNULG1EQUFTLENBQUE7UUFDVCwrQ0FBTyxDQUFBO0lBQ1QsQ0FBQyxFQUpJLFNBQVMsS0FBVCxTQUFTLFFBSWI7SUFpQkQsTUFBYSw4Q0FBOEM7UUFNekQsWUFDWSxXQUEyQixFQUMzQixpQkFBd0Q7WUFEeEQsZ0JBQVcsR0FBWCxXQUFXLENB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QUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxtQ0FBbUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFFekYsMkVBQTJFO2dCQUMzRSwwRUFBMEU7Z0JBQzFFLElBQUksWUFBWSxLQUFLLElBQUksSUFBSSx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7b0JBQ3hFLE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQztpQkFDNUI7Z0JBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQztvQkFDbEQsb0NBQW9CLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDM0QsRUFBRSxDQUFDO2dCQUNQLEtBQUssTUFBTSxFQUFDLElBQUksRUFBQyxJQUFJLFlBQVksRUFBRTtvQkFDakMsSUFBSSwwQkFBMEIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ3hDLE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQztxQkFDNUI7aUJBQ0Y7Z0JBRUQsOEVBQThFO2dCQUM5RSxpRkFBaUY7Z0JBQ2pGLDJFQUEyRTtnQkFDM0UsSUFBSSxZQUFZLEtBQUssSUFBSSxJQUFJLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDeEUsS0FBSyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7aUJBQzdCO2FBQ0Y7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7S0FDRjtJQW5NRCx3R0FtTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQYXJ0aWFsRXZhbHVhdG9yfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL3BhcnRpYWxfZXZhbHVhdG9yJztcbmltcG9ydCB7cmVmbGVjdE9iamVjdExpdGVyYWwsIFR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9yZWZsZWN0aW9uJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0ltcG9ydE1hbmFnZXJ9IGZyb20gJy4uLy4uL3V0aWxzL2ltcG9ydF9tYW5hZ2VyJztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnMsIE5nRGVjb3JhdG9yfSBmcm9tICcuLi8uLi91dGlscy9uZ19kZWNvcmF0b3JzJztcbmltcG9ydCB7ZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9uc30gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9maW5kX2Jhc2VfY2xhc3Nlcyc7XG5pbXBvcnQge3Vud3JhcEV4cHJlc3Npb259IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcbmltcG9ydCB7Z2V0UHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcblxuaW1wb3J0IHtVcGRhdGVSZWNvcmRlcn0gZnJvbSAnLi91cGRhdGVfcmVjb3JkZXInO1xuXG4vKipcbiAqIFNldCBvZiBrbm93biBkZWNvcmF0b3JzIHRoYXQgaW5kaWNhdGUgdGhhdCB0aGUgY3VycmVudCBjbGFzcyBuZWVkcyBhIGRpcmVjdGl2ZVxuICogZGVmaW5pdGlvbi4gVGhlc2UgZGVjb3JhdG9ycyBhcmUgYWx3YXlzIHNwZWNpZmljIHRvIGRpcmVjdGl2ZXMuXG4gKi9cbmNvbnN0IERJUkVDVElWRV9GSUVMRF9ERUNPUkFUT1JTID0gbmV3IFNldChbXG4gICdJbnB1dCcsICdPdXRwdXQnLCAnVmlld0NoaWxkJywgJ1ZpZXdDaGlsZHJlbicsICdDb250ZW50Q2hpbGQnLCAnQ29udGVudENoaWxkcmVuJywgJ0hvc3RCaW5kaW5nJyxcbiAgJ0hvc3RMaXN0ZW5lcidcbl0pO1xuXG4vKipcbiAqIFNldCBvZiBrbm93biBsaWZlY3ljbGUgaG9va3MgdGhhdCBpbmRpY2F0ZSB0aGF0IHRoZSBjdXJyZW50IGNsYXNzIG5lZWRzIGEgZGlyZWN0aXZlXG4gKiBkZWZpbml0aW9uLiBUaGVzZSBsaWZlY3ljbGUgaG9va3MgYXJlIGFsd2F5cyBzcGVjaWZpYyB0byBkaXJlY3RpdmVzLlxuICovXG5jb25zdCBESVJFQ1RJVkVfTElGRUNZQ0xFX0hPT0tTID0gbmV3IFNldChbXG4gICduZ09uQ2hhbmdlcycsICduZ09uSW5pdCcsICduZ0RvQ2hlY2snLCAnbmdBZnRlclZpZXdJbml0JywgJ25nQWZ0ZXJWaWV3Q2hlY2tlZCcsXG4gICduZ0FmdGVyQ29udGVudEluaXQnLCAnbmdBZnRlckNvbnRlbnRDaGVja2VkJ1xuXSk7XG5cbi8qKlxuICogU2V0IG9mIGtub3duIGxpZmVjeWNsZSBob29rcyB0aGF0IGluZGljYXRlIHRoYXQgYSBnaXZlbiBjbGFzcyB1c2VzIEFuZ3VsYXJcbiAqIGZlYXR1cmVzLCBidXQgaXQncyBhbWJpZ3VvdXMgd2hldGhlciBpdCBpcyBhIGRpcmVjdGl2ZSBvciBzZXJ2aWNlLlxuICovXG5jb25zdCBBTUJJR1VPVVNfTElGRUNZQ0xFX0hPT0tTID0gbmV3IFNldChbJ25nT25EZXN0cm95J10pO1xuXG4vKiogRGVzY3JpYmVzIGhvdyBhIGdpdmVuIGNsYXNzIGlzIHVzZWQgaW4gdGhlIGNvbnRleHQgb2YgQW5ndWxhci4gKi9cbmVudW0gQ2xhc3NLaW5kIHtcbiAgRElSRUNUSVZFLFxuICBBTUJJR1VPVVMsXG4gIFVOS05PV04sXG59XG5cbi8qKiBBbmFseXplZCBjbGFzcyBkZWNsYXJhdGlvbi4gKi9cbmludGVyZmFjZSBBbmFseXplZENsYXNzIHtcbiAgLyoqIFdoZXRoZXIgdGhlIGNsYXNzIGlzIGRlY29yYXRlZCB3aXRoIEBEaXJlY3RpdmUgb3IgQENvbXBvbmVudC4gKi9cbiAgaXNEaXJlY3RpdmVPckNvbXBvbmVudDogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdGhlIGNsYXNzIGlzIGFuIGFic3RyYWN0IGRpcmVjdGl2ZS4gKi9cbiAgaXNBYnN0cmFjdERpcmVjdGl2ZTogYm9vbGVhbjtcbiAgLyoqIEtpbmQgb2YgdGhlIGdpdmVuIGNsYXNzIGluIHRlcm1zIG9mIEFuZ3VsYXIuICovXG4gIGtpbmQ6IENsYXNzS2luZDtcbn1cblxuaW50ZXJmYWNlIEFuYWx5c2lzRmFpbHVyZSB7XG4gIG5vZGU6IHRzLk5vZGU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFVuZGVjb3JhdGVkQ2xhc3Nlc1dpdGhEZWNvcmF0ZWRGaWVsZHNUcmFuc2Zvcm0ge1xuICBwcml2YXRlIHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG4gIHByaXZhdGUgaW1wb3J0TWFuYWdlciA9IG5ldyBJbXBvcnRNYW5hZ2VyKHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIsIHRoaXMucHJpbnRlcik7XG4gIHByaXZhdGUgcmVmbGVjdGlvbkhvc3QgPSBuZXcgVHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0KHRoaXMudHlwZUNoZWNrZXIpO1xuICBwcml2YXRlIHBhcnRpYWxFdmFsdWF0b3IgPSBuZXcgUGFydGlhbEV2YWx1YXRvcih0aGlzLnJlZmxlY3Rpb25Ib3N0LCB0aGlzLnR5cGVDaGVja2VyLCBudWxsKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBnZXRVcGRhdGVSZWNvcmRlcjogKHNmOiB0cy5Tb3VyY2VGaWxlKSA9PiBVcGRhdGVSZWNvcmRlcikge31cblxuICAvKipcbiAgICogTWlncmF0ZXMgdGhlIHNwZWNpZmllZCBzb3VyY2UgZmlsZXMuIFRoZSB0cmFuc2Zvcm0gYWRkcyB0aGUgYWJzdHJhY3QgYEBEaXJlY3RpdmVgXG4gICAqIGRlY29yYXRvciB0byB1bmRlY29yYXRlZCBjbGFzc2VzIHRoYXQgdXNlIEFuZ3VsYXIgZmVhdHVyZXMuIENsYXNzIG1lbWJlcnMgd2hpY2hcbiAgICogYXJlIGRlY29yYXRlZCB3aXRoIGFueSBBbmd1bGFyIGRlY29yYXRvciwgb3IgY2xhc3MgbWVtYmVycyBmb3IgbGlmZWN5Y2xlIGhvb2tzIGFyZVxuICAgKiBpbmRpY2F0aW5nIHRoYXQgYSBnaXZlbiBjbGFzcyB1c2VzIEFuZ3VsYXIgZmVhdHVyZXMuIGh0dHBzOi8vaGFja21kLmlvL3Z1UWZhdnpmUkc2S1VDdFU3b0tfRUFcbiAgICovXG4gIG1pZ3JhdGUoc291cmNlRmlsZXM6IHRzLlNvdXJjZUZpbGVbXSk6IEFuYWx5c2lzRmFpbHVyZVtdIHtcbiAgICBjb25zdCB7cmVzdWx0LCBhbWJpZ3VvdXN9ID0gdGhpcy5fZmluZFVuZGVjb3JhdGVkQWJzdHJhY3REaXJlY3RpdmVzKHNvdXJjZUZpbGVzKTtcblxuXG4gICAgcmVzdWx0LmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgICBjb25zdCByZWNvcmRlciA9IHRoaXMuZ2V0VXBkYXRlUmVjb3JkZXIoc291cmNlRmlsZSk7XG4gICAgICBjb25zdCBkaXJlY3RpdmVFeHByID1cbiAgICAgICAgICB0aGlzLmltcG9ydE1hbmFnZXIuYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKHNvdXJjZUZpbGUsICdEaXJlY3RpdmUnLCAnQGFuZ3VsYXIvY29yZScpO1xuICAgICAgY29uc3QgZGVjb3JhdG9yRXhwciA9IHRzLmNyZWF0ZURlY29yYXRvcih0cy5jcmVhdGVDYWxsKGRpcmVjdGl2ZUV4cHIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKSk7XG4gICAgICByZWNvcmRlci5hZGRDbGFzc0RlY29yYXRvcihcbiAgICAgICAgICBub2RlLCB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBkZWNvcmF0b3JFeHByLCBzb3VyY2VGaWxlKSk7XG4gICAgfSk7XG5cbiAgICAvLyBBbWJpZ3VvdXMgY2xhc3NlcyBjbGVhcmx5IHVzZSBBbmd1bGFyIGZlYXR1cmVzLCBidXQgdGhlIG1pZ3JhdGlvbiBpcyB1bmFibGUgdG9cbiAgICAvLyBkZXRlcm1pbmUgd2hldGhlciB0aGUgY2xhc3MgaXMgdXNlZCBhcyBkaXJlY3RpdmUsIHNlcnZpY2Ugb3IgcGlwZS4gVGhlIG1pZ3JhdGlvblxuICAgIC8vIGNvdWxkIHBvdGVudGlhbGx5IGRldGVybWluZSB0aGUgdHlwZSBieSBjaGVja2luZyBOZ01vZHVsZSBkZWZpbml0aW9ucyBvciBpbmhlcml0YW5jZVxuICAgIC8vIG9mIG90aGVyIGtub3duIGRlY2xhcmF0aW9ucywgYnV0IHRoaXMgaXMgb3V0IG9mIHNjb3BlIGFuZCBhIFRPRE8vZmFpbHVyZSBpcyBzdWZmaWNpZW50LlxuICAgIHJldHVybiBBcnJheS5mcm9tKGFtYmlndW91cykucmVkdWNlKChmYWlsdXJlcywgbm9kZSkgPT4ge1xuICAgICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGUpO1xuXG4gICAgICAvLyBBZGQgYSBUT0RPIHRvIHRoZSBjbGFzcyB0aGF0IHVzZXMgQW5ndWxhciBmZWF0dXJlcyBidXQgaXMgbm90IGRlY29yYXRlZC5cbiAgICAgIHJlY29yZGVyLmFkZENsYXNzVG9kbyhub2RlLCBgQWRkIEFuZ3VsYXIgZGVjb3JhdG9yLmApO1xuXG4gICAgICAvLyBBZGQgYW4gZXJyb3IgZm9yIHRoZSBjbGFzcyB0aGF0IHdpbGwgYmUgcHJpbnRlZCBpbiB0aGUgYG5nIHVwZGF0ZWAgb3V0cHV0LlxuICAgICAgcmV0dXJuIGZhaWx1cmVzLmNvbmNhdCh7XG4gICAgICAgIG5vZGUsXG4gICAgICAgIG1lc3NhZ2U6ICdDbGFzcyB1c2VzIEFuZ3VsYXIgZmVhdHVyZXMgYnV0IGNhbm5vdCBiZSBtaWdyYXRlZCBhdXRvbWF0aWNhbGx5LiBQbGVhc2UgJyArXG4gICAgICAgICAgICAnYWRkIGFuIGFwcHJvcHJpYXRlIEFuZ3VsYXIgZGVjb3JhdG9yLidcbiAgICAgIH0pO1xuICAgIH0sIFtdIGFzIEFuYWx5c2lzRmFpbHVyZVtdKTtcbiAgfVxuXG4gIC8qKiBSZWNvcmRzIGFsbCBjaGFuZ2VzIHRoYXQgd2VyZSBtYWRlIGluIHRoZSBpbXBvcnQgbWFuYWdlci4gKi9cbiAgcmVjb3JkQ2hhbmdlcygpIHtcbiAgICB0aGlzLmltcG9ydE1hbmFnZXIucmVjb3JkQ2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHVuZGVjb3JhdGVkIGFic3RyYWN0IGRpcmVjdGl2ZXMgaW4gdGhlIHNwZWNpZmllZCBzb3VyY2UgZmlsZXMuIEFsc28gcmV0dXJuc1xuICAgKiBhIHNldCBvZiB1bmRlY29yYXRlZCBjbGFzc2VzIHdoaWNoIGNvdWxkIG5vdCBiZSBkZXRlY3RlZCBhcyBndWFyYW50ZWVkIGFic3RyYWN0XG4gICAqIGRpcmVjdGl2ZXMuIFRob3NlIGFyZSBhbWJpZ3VvdXMgYW5kIGNvdWxkIGJlIGVpdGhlciBEaXJlY3RpdmUsIFBpcGUgb3Igc2VydmljZS5cbiAgICovXG4gIHByaXZhdGUgX2ZpbmRVbmRlY29yYXRlZEFic3RyYWN0RGlyZWN0aXZlcyhzb3VyY2VGaWxlczogdHMuU291cmNlRmlsZVtdKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuICAgIGNvbnN0IHVuZGVjb3JhdGVkQ2xhc3NlcyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcbiAgICBjb25zdCBub25BYnN0cmFjdERpcmVjdGl2ZXMgPSBuZXcgV2Vha1NldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuICAgIGNvbnN0IGFic3RyYWN0RGlyZWN0aXZlcyA9IG5ldyBXZWFrU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG4gICAgY29uc3QgYW1iaWd1b3VzID0gbmV3IFNldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuXG4gICAgY29uc3QgdmlzaXROb2RlID0gKG5vZGU6IHRzLk5vZGUpID0+IHtcbiAgICAgIG5vZGUuZm9yRWFjaENoaWxkKHZpc2l0Tm9kZSk7XG4gICAgICBpZiAoIXRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCB7aXNEaXJlY3RpdmVPckNvbXBvbmVudCwgaXNBYnN0cmFjdERpcmVjdGl2ZSwga2luZH0gPVxuICAgICAgICAgIHRoaXMuX2FuYWx5emVDbGFzc0RlY2xhcmF0aW9uKG5vZGUpO1xuICAgICAgaWYgKGlzRGlyZWN0aXZlT3JDb21wb25lbnQpIHtcbiAgICAgICAgaWYgKGlzQWJzdHJhY3REaXJlY3RpdmUpIHtcbiAgICAgICAgICBhYnN0cmFjdERpcmVjdGl2ZXMuYWRkKG5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5vbkFic3RyYWN0RGlyZWN0aXZlcy5hZGQobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoa2luZCA9PT0gQ2xhc3NLaW5kLkRJUkVDVElWRSkge1xuICAgICAgICBhYnN0cmFjdERpcmVjdGl2ZXMuYWRkKG5vZGUpO1xuICAgICAgICByZXN1bHQuYWRkKG5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGtpbmQgPT09IENsYXNzS2luZC5BTUJJR1VPVVMpIHtcbiAgICAgICAgICBhbWJpZ3VvdXMuYWRkKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHVuZGVjb3JhdGVkQ2xhc3Nlcy5hZGQobm9kZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNvdXJjZUZpbGVzLmZvckVhY2goc291cmNlRmlsZSA9PiBzb3VyY2VGaWxlLmZvckVhY2hDaGlsZCh2aXNpdE5vZGUpKTtcblxuICAgIC8vIFdlIGNvbGxlY3RlZCBhbGwgdW5kZWNvcmF0ZWQgY2xhc3MgZGVjbGFyYXRpb25zIHdoaWNoIGluaGVyaXQgZnJvbSBhYnN0cmFjdCBkaXJlY3RpdmVzLlxuICAgIC8vIEZvciBzdWNoIGFic3RyYWN0IGRpcmVjdGl2ZXMsIHRoZSBkZXJpdmVkIGNsYXNzZXMgYWxzbyBuZWVkIHRvIGJlIG1pZ3JhdGVkLlxuICAgIHVuZGVjb3JhdGVkQ2xhc3Nlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgZm9yIChjb25zdCB7bm9kZTogYmFzZUNsYXNzfSBvZiBmaW5kQmFzZUNsYXNzRGVjbGFyYXRpb25zKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIpKSB7XG4gICAgICAgIC8vIElmIHRoZSB1bmRlY29yYXRlZCBjbGFzcyBpbmhlcml0cyBmcm9tIGEgbm9uLWFic3RyYWN0IGRpcmVjdGl2ZSwgc2tpcCB0aGUgY3VycmVudFxuICAgICAgICAvLyBjbGFzcy4gV2UgZG8gdGhpcyBiZWNhdXNlIHVuZGVjb3JhdGVkIGNsYXNzZXMgd2hpY2ggaW5oZXJpdCBtZXRhZGF0YSBmcm9tIG5vbi1hYnN0cmFjdFxuICAgICAgICAvLyBkaXJlY3RpdmVzIGFyZSBoYW5kbGVkIGluIHRoZSBgdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpYCBtaWdyYXRpb24gdGhhdCBjb3BpZXNcbiAgICAgICAgLy8gaW5oZXJpdGVkIG1ldGFkYXRhIGludG8gYW4gZXhwbGljaXQgZGVjb3JhdG9yLlxuICAgICAgICBpZiAobm9uQWJzdHJhY3REaXJlY3RpdmVzLmhhcyhiYXNlQ2xhc3MpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSBpZiAoYWJzdHJhY3REaXJlY3RpdmVzLmhhcyhiYXNlQ2xhc3MpKSB7XG4gICAgICAgICAgcmVzdWx0LmFkZChub2RlKTtcbiAgICAgICAgICAvLyBJbiBjYXNlIHRoZSB1bmRlY29yYXRlZCBjbGFzcyBwcmV2aW91c2x5IGNvdWxkIG5vdCBiZSBkZXRlY3RlZCBhcyBkaXJlY3RpdmUsXG4gICAgICAgICAgLy8gcmVtb3ZlIGl0IGZyb20gdGhlIGFtYmlndW91cyBzZXQgYXMgd2Ugbm93IGtub3cgdGhhdCBpdCdzIGEgZ3VhcmFudGVlZCBkaXJlY3RpdmUuXG4gICAgICAgICAgYW1iaWd1b3VzLmRlbGV0ZShub2RlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtyZXN1bHQsIGFtYmlndW91c307XG4gIH1cblxuICAvKipcbiAgICogQW5hbHl6ZXMgdGhlIGdpdmVuIGNsYXNzIGRlY2xhcmF0aW9uIGJ5IGRldGVybWluaW5nIHdoZXRoZXIgdGhlIGNsYXNzXG4gICAqIGlzIGEgZGlyZWN0aXZlLCBpcyBhbiBhYnN0cmFjdCBkaXJlY3RpdmUsIG9yIHVzZXMgQW5ndWxhciBmZWF0dXJlcy5cbiAgICovXG4gIHByaXZhdGUgX2FuYWx5emVDbGFzc0RlY2xhcmF0aW9uKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBBbmFseXplZENsYXNzIHtcbiAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBub2RlLmRlY29yYXRvcnMgJiYgZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKTtcbiAgICBjb25zdCBraW5kID0gdGhpcy5fZGV0ZXJtaW5lQ2xhc3NLaW5kKG5vZGUpO1xuICAgIGlmIChuZ0RlY29yYXRvcnMgPT09IHVuZGVmaW5lZCB8fCBuZ0RlY29yYXRvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge2lzRGlyZWN0aXZlT3JDb21wb25lbnQ6IGZhbHNlLCBpc0Fic3RyYWN0RGlyZWN0aXZlOiBmYWxzZSwga2luZH07XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZURlY29yYXRvciA9IG5nRGVjb3JhdG9ycy5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdEaXJlY3RpdmUnKTtcbiAgICBjb25zdCBjb21wb25lbnREZWNvcmF0b3IgPSBuZ0RlY29yYXRvcnMuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnQ29tcG9uZW50Jyk7XG4gICAgY29uc3QgaXNBYnN0cmFjdERpcmVjdGl2ZSA9XG4gICAgICAgIGRpcmVjdGl2ZURlY29yYXRvciAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2lzQWJzdHJhY3REaXJlY3RpdmUoZGlyZWN0aXZlRGVjb3JhdG9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgaXNEaXJlY3RpdmVPckNvbXBvbmVudDogISFkaXJlY3RpdmVEZWNvcmF0b3IgfHwgISFjb21wb25lbnREZWNvcmF0b3IsXG4gICAgICBpc0Fic3RyYWN0RGlyZWN0aXZlLFxuICAgICAga2luZCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBkZWNvcmF0b3IgcmVzb2x2ZXMgdG8gYW4gYWJzdHJhY3QgZGlyZWN0aXZlLiBBbiBkaXJlY3RpdmUgaXNcbiAgICogY29uc2lkZXJlZCBcImFic3RyYWN0XCIgaWYgdGhlcmUgaXMgbm8gc2VsZWN0b3Igc3BlY2lmaWVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfaXNBYnN0cmFjdERpcmVjdGl2ZSh7bm9kZX06IE5nRGVjb3JhdG9yKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbWV0YWRhdGFBcmdzID0gbm9kZS5leHByZXNzaW9uLmFyZ3VtZW50cztcbiAgICBpZiAobWV0YWRhdGFBcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IG1ldGFkYXRhRXhwciA9IHVud3JhcEV4cHJlc3Npb24obWV0YWRhdGFBcmdzWzBdKTtcbiAgICBpZiAoIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obWV0YWRhdGFFeHByKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBtZXRhZGF0YSA9IHJlZmxlY3RPYmplY3RMaXRlcmFsKG1ldGFkYXRhRXhwcik7XG4gICAgaWYgKCFtZXRhZGF0YS5oYXMoJ3NlbGVjdG9yJykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0b3IgPSB0aGlzLnBhcnRpYWxFdmFsdWF0b3IuZXZhbHVhdGUobWV0YWRhdGEuZ2V0KCdzZWxlY3RvcicpISk7XG4gICAgcmV0dXJuIHNlbGVjdG9yID09IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUga2luZCBvZiBhIGdpdmVuIGNsYXNzIGluIHRlcm1zIG9mIEFuZ3VsYXIuIFRoZSBtZXRob2QgY2hlY2tzXG4gICAqIHdoZXRoZXIgdGhlIGdpdmVuIGNsYXNzIGhhcyBtZW1iZXJzIHRoYXQgaW5kaWNhdGUgdGhlIHVzZSBvZiBBbmd1bGFyIGZlYXR1cmVzLlxuICAgKiBlLmcuIGxpZmVjeWNsZSBob29rcyBvciBkZWNvcmF0ZWQgbWVtYmVycyBsaWtlIGBASW5wdXRgIG9yIGBAT3V0cHV0YCBhcmVcbiAgICogY29uc2lkZXJlZCBBbmd1bGFyIGZlYXR1cmVzLi5cbiAgICovXG4gIHByaXZhdGUgX2RldGVybWluZUNsYXNzS2luZChub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogQ2xhc3NLaW5kIHtcbiAgICBsZXQgdXNhZ2UgPSBDbGFzc0tpbmQuVU5LTk9XTjtcblxuICAgIGZvciAoY29uc3QgbWVtYmVyIG9mIG5vZGUubWVtYmVycykge1xuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gbWVtYmVyLm5hbWUgIT09IHVuZGVmaW5lZCA/IGdldFByb3BlcnR5TmFtZVRleHQobWVtYmVyLm5hbWUpIDogbnVsbDtcblxuICAgICAgLy8gSWYgdGhlIGNsYXNzIGRlY2xhcmVzIGFueSBvZiB0aGUga25vd24gZGlyZWN0aXZlIGxpZmVjeWNsZSBob29rcywgd2UgY2FuXG4gICAgICAvLyBpbW1lZGlhdGVseSBleGl0IHRoZSBsb29wIGFzIHRoZSBjbGFzcyBpcyBndWFyYW50ZWVkIHRvIGJlIGEgZGlyZWN0aXZlLlxuICAgICAgaWYgKHByb3BlcnR5TmFtZSAhPT0gbnVsbCAmJiBESVJFQ1RJVkVfTElGRUNZQ0xFX0hPT0tTLmhhcyhwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgIHJldHVybiBDbGFzc0tpbmQuRElSRUNUSVZFO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBtZW1iZXIuZGVjb3JhdG9ycyAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgICBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBtZW1iZXIuZGVjb3JhdG9ycykgOlxuICAgICAgICAgIFtdO1xuICAgICAgZm9yIChjb25zdCB7bmFtZX0gb2YgbmdEZWNvcmF0b3JzKSB7XG4gICAgICAgIGlmIChESVJFQ1RJVkVfRklFTERfREVDT1JBVE9SUy5oYXMobmFtZSkpIHtcbiAgICAgICAgICByZXR1cm4gQ2xhc3NLaW5kLkRJUkVDVElWRTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgY2xhc3MgZGVjbGFyZXMgYW55IG9mIHRoZSBsaWZlY3ljbGUgaG9va3MgdGhhdCBkbyBub3QgZ3VhcmFudGVlIHRoYXRcbiAgICAgIC8vIHRoZSBnaXZlbiBjbGFzcyBpcyBhIGRpcmVjdGl2ZSwgdXBkYXRlIHRoZSBraW5kIGFuZCBjb250aW51ZSBsb29raW5nIGZvciBvdGhlclxuICAgICAgLy8gbWVtYmVycyB0aGF0IHdvdWxkIHVudmVpbCBhIG1vcmUgc3BlY2lmaWMga2luZCAoaS5lLiBiZWluZyBhIGRpcmVjdGl2ZSkuXG4gICAgICBpZiAocHJvcGVydHlOYW1lICE9PSBudWxsICYmIEFNQklHVU9VU19MSUZFQ1lDTEVfSE9PS1MuaGFzKHByb3BlcnR5TmFtZSkpIHtcbiAgICAgICAgdXNhZ2UgPSBDbGFzc0tpbmQuQU1CSUdVT1VTO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1c2FnZTtcbiAgfVxufVxuIl19