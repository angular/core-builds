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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRlY29yYXRlZC1maWVsZHMvdHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILHlGQUFtRjtJQUNuRiwyRUFBMEc7SUFDMUcsaUNBQWlDO0lBRWpDLGtGQUF5RDtJQUN6RCxnRkFBNEU7SUFDNUUsbUdBQW1GO0lBQ25GLG1GQUFrRTtJQUNsRSwyRkFBeUU7SUFJekU7OztPQUdHO0lBQ0gsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLEdBQUcsQ0FBQztRQUN6QyxPQUFPLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLGFBQWE7UUFDaEcsY0FBYztLQUNmLENBQUMsQ0FBQztJQUVIOzs7T0FHRztJQUNILE1BQU0seUJBQXlCLEdBQUcsSUFBSSxHQUFHLENBQUM7UUFDeEMsYUFBYSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsb0JBQW9CO1FBQy9FLG9CQUFvQixFQUFFLHVCQUF1QjtLQUM5QyxDQUFDLENBQUM7SUFFSDs7O09BR0c7SUFDSCxNQUFNLHlCQUF5QixHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUUzRCxxRUFBcUU7SUFDckUsSUFBSyxTQUlKO0lBSkQsV0FBSyxTQUFTO1FBQ1osbURBQVMsQ0FBQTtRQUNULG1EQUFTLENBQUE7UUFDVCwrQ0FBTyxDQUFBO0lBQ1QsQ0FBQyxFQUpJLFNBQVMsS0FBVCxTQUFTLFFBSWI7SUFpQkQsTUFBYSw4Q0FBOEM7UUFNekQsWUFDWSxXQUEyQixFQUMzQixpQkFBd0Q7WUFEeEQsZ0JBQVcsR0FBWCxXQUFXLENB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QUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxtQ0FBbUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFFekYsMkVBQTJFO2dCQUMzRSwwRUFBMEU7Z0JBQzFFLElBQUksWUFBWSxLQUFLLElBQUksSUFBSSx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7b0JBQ3hFLE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQztpQkFDNUI7Z0JBRUQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQztvQkFDbEQsb0NBQW9CLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDM0QsRUFBRSxDQUFDO2dCQUNQLEtBQUssTUFBTSxFQUFDLElBQUksRUFBQyxJQUFJLFlBQVksRUFBRTtvQkFDakMsSUFBSSwwQkFBMEIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ3hDLE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQztxQkFDNUI7aUJBQ0Y7Z0JBRUQsOEVBQThFO2dCQUM5RSxpRkFBaUY7Z0JBQ2pGLDJFQUEyRTtnQkFDM0UsSUFBSSxZQUFZLEtBQUssSUFBSSxJQUFJLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDeEUsS0FBSyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7aUJBQzdCO2FBQ0Y7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7S0FDRjtJQW5NRCx3R0FtTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGFydGlhbEV2YWx1YXRvcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9wYXJ0aWFsX2V2YWx1YXRvcic7XG5pbXBvcnQge3JlZmxlY3RPYmplY3RMaXRlcmFsLCBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcmVmbGVjdGlvbic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtJbXBvcnRNYW5hZ2VyfSBmcm9tICcuLi8uLi91dGlscy9pbXBvcnRfbWFuYWdlcic7XG5pbXBvcnQge2dldEFuZ3VsYXJEZWNvcmF0b3JzLCBOZ0RlY29yYXRvcn0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge2ZpbmRCYXNlQ2xhc3NEZWNsYXJhdGlvbnN9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZmluZF9iYXNlX2NsYXNzZXMnO1xuaW1wb3J0IHt1bndyYXBFeHByZXNzaW9ufSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2Z1bmN0aW9ucyc7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5cbmltcG9ydCB7VXBkYXRlUmVjb3JkZXJ9IGZyb20gJy4vdXBkYXRlX3JlY29yZGVyJztcblxuLyoqXG4gKiBTZXQgb2Yga25vd24gZGVjb3JhdG9ycyB0aGF0IGluZGljYXRlIHRoYXQgdGhlIGN1cnJlbnQgY2xhc3MgbmVlZHMgYSBkaXJlY3RpdmVcbiAqIGRlZmluaXRpb24uIFRoZXNlIGRlY29yYXRvcnMgYXJlIGFsd2F5cyBzcGVjaWZpYyB0byBkaXJlY3RpdmVzLlxuICovXG5jb25zdCBESVJFQ1RJVkVfRklFTERfREVDT1JBVE9SUyA9IG5ldyBTZXQoW1xuICAnSW5wdXQnLCAnT3V0cHV0JywgJ1ZpZXdDaGlsZCcsICdWaWV3Q2hpbGRyZW4nLCAnQ29udGVudENoaWxkJywgJ0NvbnRlbnRDaGlsZHJlbicsICdIb3N0QmluZGluZycsXG4gICdIb3N0TGlzdGVuZXInXG5dKTtcblxuLyoqXG4gKiBTZXQgb2Yga25vd24gbGlmZWN5Y2xlIGhvb2tzIHRoYXQgaW5kaWNhdGUgdGhhdCB0aGUgY3VycmVudCBjbGFzcyBuZWVkcyBhIGRpcmVjdGl2ZVxuICogZGVmaW5pdGlvbi4gVGhlc2UgbGlmZWN5Y2xlIGhvb2tzIGFyZSBhbHdheXMgc3BlY2lmaWMgdG8gZGlyZWN0aXZlcy5cbiAqL1xuY29uc3QgRElSRUNUSVZFX0xJRkVDWUNMRV9IT09LUyA9IG5ldyBTZXQoW1xuICAnbmdPbkNoYW5nZXMnLCAnbmdPbkluaXQnLCAnbmdEb0NoZWNrJywgJ25nQWZ0ZXJWaWV3SW5pdCcsICduZ0FmdGVyVmlld0NoZWNrZWQnLFxuICAnbmdBZnRlckNvbnRlbnRJbml0JywgJ25nQWZ0ZXJDb250ZW50Q2hlY2tlZCdcbl0pO1xuXG4vKipcbiAqIFNldCBvZiBrbm93biBsaWZlY3ljbGUgaG9va3MgdGhhdCBpbmRpY2F0ZSB0aGF0IGEgZ2l2ZW4gY2xhc3MgdXNlcyBBbmd1bGFyXG4gKiBmZWF0dXJlcywgYnV0IGl0J3MgYW1iaWd1b3VzIHdoZXRoZXIgaXQgaXMgYSBkaXJlY3RpdmUgb3Igc2VydmljZS5cbiAqL1xuY29uc3QgQU1CSUdVT1VTX0xJRkVDWUNMRV9IT09LUyA9IG5ldyBTZXQoWyduZ09uRGVzdHJveSddKTtcblxuLyoqIERlc2NyaWJlcyBob3cgYSBnaXZlbiBjbGFzcyBpcyB1c2VkIGluIHRoZSBjb250ZXh0IG9mIEFuZ3VsYXIuICovXG5lbnVtIENsYXNzS2luZCB7XG4gIERJUkVDVElWRSxcbiAgQU1CSUdVT1VTLFxuICBVTktOT1dOLFxufVxuXG4vKiogQW5hbHl6ZWQgY2xhc3MgZGVjbGFyYXRpb24uICovXG5pbnRlcmZhY2UgQW5hbHl6ZWRDbGFzcyB7XG4gIC8qKiBXaGV0aGVyIHRoZSBjbGFzcyBpcyBkZWNvcmF0ZWQgd2l0aCBARGlyZWN0aXZlIG9yIEBDb21wb25lbnQuICovXG4gIGlzRGlyZWN0aXZlT3JDb21wb25lbnQ6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRoZSBjbGFzcyBpcyBhbiBhYnN0cmFjdCBkaXJlY3RpdmUuICovXG4gIGlzQWJzdHJhY3REaXJlY3RpdmU6IGJvb2xlYW47XG4gIC8qKiBLaW5kIG9mIHRoZSBnaXZlbiBjbGFzcyBpbiB0ZXJtcyBvZiBBbmd1bGFyLiAqL1xuICBraW5kOiBDbGFzc0tpbmQ7XG59XG5cbmludGVyZmFjZSBBbmFseXNpc0ZhaWx1cmUge1xuICBub2RlOiB0cy5Ob2RlO1xuICBtZXNzYWdlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBVbmRlY29yYXRlZENsYXNzZXNXaXRoRGVjb3JhdGVkRmllbGRzVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuICBwcml2YXRlIGltcG9ydE1hbmFnZXIgPSBuZXcgSW1wb3J0TWFuYWdlcih0aGlzLmdldFVwZGF0ZVJlY29yZGVyLCB0aGlzLnByaW50ZXIpO1xuICBwcml2YXRlIHJlZmxlY3Rpb25Ib3N0ID0gbmV3IFR5cGVTY3JpcHRSZWZsZWN0aW9uSG9zdCh0aGlzLnR5cGVDaGVja2VyKTtcbiAgcHJpdmF0ZSBwYXJ0aWFsRXZhbHVhdG9yID0gbmV3IFBhcnRpYWxFdmFsdWF0b3IodGhpcy5yZWZsZWN0aW9uSG9zdCwgdGhpcy50eXBlQ2hlY2tlciwgbnVsbCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICAgIHByaXZhdGUgZ2V0VXBkYXRlUmVjb3JkZXI6IChzZjogdHMuU291cmNlRmlsZSkgPT4gVXBkYXRlUmVjb3JkZXIpIHt9XG5cbiAgLyoqXG4gICAqIE1pZ3JhdGVzIHRoZSBzcGVjaWZpZWQgc291cmNlIGZpbGVzLiBUaGUgdHJhbnNmb3JtIGFkZHMgdGhlIGFic3RyYWN0IGBARGlyZWN0aXZlYFxuICAgKiBkZWNvcmF0b3IgdG8gdW5kZWNvcmF0ZWQgY2xhc3NlcyB0aGF0IHVzZSBBbmd1bGFyIGZlYXR1cmVzLiBDbGFzcyBtZW1iZXJzIHdoaWNoXG4gICAqIGFyZSBkZWNvcmF0ZWQgd2l0aCBhbnkgQW5ndWxhciBkZWNvcmF0b3IsIG9yIGNsYXNzIG1lbWJlcnMgZm9yIGxpZmVjeWNsZSBob29rcyBhcmVcbiAgICogaW5kaWNhdGluZyB0aGF0IGEgZ2l2ZW4gY2xhc3MgdXNlcyBBbmd1bGFyIGZlYXR1cmVzLiBodHRwczovL2hhY2ttZC5pby92dVFmYXZ6ZlJHNktVQ3RVN29LX0VBXG4gICAqL1xuICBtaWdyYXRlKHNvdXJjZUZpbGVzOiB0cy5Tb3VyY2VGaWxlW10pOiBBbmFseXNpc0ZhaWx1cmVbXSB7XG4gICAgY29uc3Qge3Jlc3VsdCwgYW1iaWd1b3VzfSA9IHRoaXMuX2ZpbmRVbmRlY29yYXRlZEFic3RyYWN0RGlyZWN0aXZlcyhzb3VyY2VGaWxlcyk7XG5cblxuICAgIHJlc3VsdC5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKHNvdXJjZUZpbGUpO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRXhwciA9XG4gICAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShzb3VyY2VGaWxlLCAnRGlyZWN0aXZlJywgJ0Bhbmd1bGFyL2NvcmUnKTtcbiAgICAgIGNvbnN0IGRlY29yYXRvckV4cHIgPSB0cy5jcmVhdGVEZWNvcmF0b3IodHMuY3JlYXRlQ2FsbChkaXJlY3RpdmVFeHByLCB1bmRlZmluZWQsIHVuZGVmaW5lZCkpO1xuICAgICAgcmVjb3JkZXIuYWRkQ2xhc3NEZWNvcmF0b3IoXG4gICAgICAgICAgbm9kZSwgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgZGVjb3JhdG9yRXhwciwgc291cmNlRmlsZSkpO1xuICAgIH0pO1xuXG4gICAgLy8gQW1iaWd1b3VzIGNsYXNzZXMgY2xlYXJseSB1c2UgQW5ndWxhciBmZWF0dXJlcywgYnV0IHRoZSBtaWdyYXRpb24gaXMgdW5hYmxlIHRvXG4gICAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGNsYXNzIGlzIHVzZWQgYXMgZGlyZWN0aXZlLCBzZXJ2aWNlIG9yIHBpcGUuIFRoZSBtaWdyYXRpb25cbiAgICAvLyBjb3VsZCBwb3RlbnRpYWxseSBkZXRlcm1pbmUgdGhlIHR5cGUgYnkgY2hlY2tpbmcgTmdNb2R1bGUgZGVmaW5pdGlvbnMgb3IgaW5oZXJpdGFuY2VcbiAgICAvLyBvZiBvdGhlciBrbm93biBkZWNsYXJhdGlvbnMsIGJ1dCB0aGlzIGlzIG91dCBvZiBzY29wZSBhbmQgYSBUT0RPL2ZhaWx1cmUgaXMgc3VmZmljaWVudC5cbiAgICByZXR1cm4gQXJyYXkuZnJvbShhbWJpZ3VvdXMpLnJlZHVjZSgoZmFpbHVyZXMsIG5vZGUpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKTtcblxuICAgICAgLy8gQWRkIGEgVE9ETyB0byB0aGUgY2xhc3MgdGhhdCB1c2VzIEFuZ3VsYXIgZmVhdHVyZXMgYnV0IGlzIG5vdCBkZWNvcmF0ZWQuXG4gICAgICByZWNvcmRlci5hZGRDbGFzc1RvZG8obm9kZSwgYEFkZCBBbmd1bGFyIGRlY29yYXRvci5gKTtcblxuICAgICAgLy8gQWRkIGFuIGVycm9yIGZvciB0aGUgY2xhc3MgdGhhdCB3aWxsIGJlIHByaW50ZWQgaW4gdGhlIGBuZyB1cGRhdGVgIG91dHB1dC5cbiAgICAgIHJldHVybiBmYWlsdXJlcy5jb25jYXQoe1xuICAgICAgICBub2RlLFxuICAgICAgICBtZXNzYWdlOiAnQ2xhc3MgdXNlcyBBbmd1bGFyIGZlYXR1cmVzIGJ1dCBjYW5ub3QgYmUgbWlncmF0ZWQgYXV0b21hdGljYWxseS4gUGxlYXNlICcgK1xuICAgICAgICAgICAgJ2FkZCBhbiBhcHByb3ByaWF0ZSBBbmd1bGFyIGRlY29yYXRvci4nXG4gICAgICB9KTtcbiAgICB9LCBbXSBhcyBBbmFseXNpc0ZhaWx1cmVbXSk7XG4gIH1cblxuICAvKiogUmVjb3JkcyBhbGwgY2hhbmdlcyB0aGF0IHdlcmUgbWFkZSBpbiB0aGUgaW1wb3J0IG1hbmFnZXIuICovXG4gIHJlY29yZENoYW5nZXMoKSB7XG4gICAgdGhpcy5pbXBvcnRNYW5hZ2VyLnJlY29yZENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB1bmRlY29yYXRlZCBhYnN0cmFjdCBkaXJlY3RpdmVzIGluIHRoZSBzcGVjaWZpZWQgc291cmNlIGZpbGVzLiBBbHNvIHJldHVybnNcbiAgICogYSBzZXQgb2YgdW5kZWNvcmF0ZWQgY2xhc3NlcyB3aGljaCBjb3VsZCBub3QgYmUgZGV0ZWN0ZWQgYXMgZ3VhcmFudGVlZCBhYnN0cmFjdFxuICAgKiBkaXJlY3RpdmVzLiBUaG9zZSBhcmUgYW1iaWd1b3VzIGFuZCBjb3VsZCBiZSBlaXRoZXIgRGlyZWN0aXZlLCBQaXBlIG9yIHNlcnZpY2UuXG4gICAqL1xuICBwcml2YXRlIF9maW5kVW5kZWNvcmF0ZWRBYnN0cmFjdERpcmVjdGl2ZXMoc291cmNlRmlsZXM6IHRzLlNvdXJjZUZpbGVbXSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcbiAgICBjb25zdCB1bmRlY29yYXRlZENsYXNzZXMgPSBuZXcgU2V0PHRzLkNsYXNzRGVjbGFyYXRpb24+KCk7XG4gICAgY29uc3Qgbm9uQWJzdHJhY3REaXJlY3RpdmVzID0gbmV3IFdlYWtTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcbiAgICBjb25zdCBhYnN0cmFjdERpcmVjdGl2ZXMgPSBuZXcgV2Vha1NldDx0cy5DbGFzc0RlY2xhcmF0aW9uPigpO1xuICAgIGNvbnN0IGFtYmlndW91cyA9IG5ldyBTZXQ8dHMuQ2xhc3NEZWNsYXJhdGlvbj4oKTtcblxuICAgIGNvbnN0IHZpc2l0Tm9kZSA9IChub2RlOiB0cy5Ob2RlKSA9PiB7XG4gICAgICBub2RlLmZvckVhY2hDaGlsZCh2aXNpdE5vZGUpO1xuICAgICAgaWYgKCF0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qge2lzRGlyZWN0aXZlT3JDb21wb25lbnQsIGlzQWJzdHJhY3REaXJlY3RpdmUsIGtpbmR9ID1cbiAgICAgICAgICB0aGlzLl9hbmFseXplQ2xhc3NEZWNsYXJhdGlvbihub2RlKTtcbiAgICAgIGlmIChpc0RpcmVjdGl2ZU9yQ29tcG9uZW50KSB7XG4gICAgICAgIGlmIChpc0Fic3RyYWN0RGlyZWN0aXZlKSB7XG4gICAgICAgICAgYWJzdHJhY3REaXJlY3RpdmVzLmFkZChub2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub25BYnN0cmFjdERpcmVjdGl2ZXMuYWRkKG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtpbmQgPT09IENsYXNzS2luZC5ESVJFQ1RJVkUpIHtcbiAgICAgICAgYWJzdHJhY3REaXJlY3RpdmVzLmFkZChub2RlKTtcbiAgICAgICAgcmVzdWx0LmFkZChub2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChraW5kID09PSBDbGFzc0tpbmQuQU1CSUdVT1VTKSB7XG4gICAgICAgICAgYW1iaWd1b3VzLmFkZChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB1bmRlY29yYXRlZENsYXNzZXMuYWRkKG5vZGUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBzb3VyY2VGaWxlcy5mb3JFYWNoKHNvdXJjZUZpbGUgPT4gc291cmNlRmlsZS5mb3JFYWNoQ2hpbGQodmlzaXROb2RlKSk7XG5cbiAgICAvLyBXZSBjb2xsZWN0ZWQgYWxsIHVuZGVjb3JhdGVkIGNsYXNzIGRlY2xhcmF0aW9ucyB3aGljaCBpbmhlcml0IGZyb20gYWJzdHJhY3QgZGlyZWN0aXZlcy5cbiAgICAvLyBGb3Igc3VjaCBhYnN0cmFjdCBkaXJlY3RpdmVzLCB0aGUgZGVyaXZlZCBjbGFzc2VzIGFsc28gbmVlZCB0byBiZSBtaWdyYXRlZC5cbiAgICB1bmRlY29yYXRlZENsYXNzZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGZvciAoY29uc3Qge25vZGU6IGJhc2VDbGFzc30gb2YgZmluZEJhc2VDbGFzc0RlY2xhcmF0aW9ucyhub2RlLCB0aGlzLnR5cGVDaGVja2VyKSkge1xuICAgICAgICAvLyBJZiB0aGUgdW5kZWNvcmF0ZWQgY2xhc3MgaW5oZXJpdHMgZnJvbSBhIG5vbi1hYnN0cmFjdCBkaXJlY3RpdmUsIHNraXAgdGhlIGN1cnJlbnRcbiAgICAgICAgLy8gY2xhc3MuIFdlIGRvIHRoaXMgYmVjYXVzZSB1bmRlY29yYXRlZCBjbGFzc2VzIHdoaWNoIGluaGVyaXQgbWV0YWRhdGEgZnJvbSBub24tYWJzdHJhY3RcbiAgICAgICAgLy8gZGlyZWN0aXZlcyBhcmUgaGFuZGxlZCBpbiB0aGUgYHVuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaWAgbWlncmF0aW9uIHRoYXQgY29waWVzXG4gICAgICAgIC8vIGluaGVyaXRlZCBtZXRhZGF0YSBpbnRvIGFuIGV4cGxpY2l0IGRlY29yYXRvci5cbiAgICAgICAgaWYgKG5vbkFic3RyYWN0RGlyZWN0aXZlcy5oYXMoYmFzZUNsYXNzKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2UgaWYgKGFic3RyYWN0RGlyZWN0aXZlcy5oYXMoYmFzZUNsYXNzKSkge1xuICAgICAgICAgIHJlc3VsdC5hZGQobm9kZSk7XG4gICAgICAgICAgLy8gSW4gY2FzZSB0aGUgdW5kZWNvcmF0ZWQgY2xhc3MgcHJldmlvdXNseSBjb3VsZCBub3QgYmUgZGV0ZWN0ZWQgYXMgZGlyZWN0aXZlLFxuICAgICAgICAgIC8vIHJlbW92ZSBpdCBmcm9tIHRoZSBhbWJpZ3VvdXMgc2V0IGFzIHdlIG5vdyBrbm93IHRoYXQgaXQncyBhIGd1YXJhbnRlZWQgZGlyZWN0aXZlLlxuICAgICAgICAgIGFtYmlndW91cy5kZWxldGUobm9kZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB7cmVzdWx0LCBhbWJpZ3VvdXN9O1xuICB9XG5cbiAgLyoqXG4gICAqIEFuYWx5emVzIHRoZSBnaXZlbiBjbGFzcyBkZWNsYXJhdGlvbiBieSBkZXRlcm1pbmluZyB3aGV0aGVyIHRoZSBjbGFzc1xuICAgKiBpcyBhIGRpcmVjdGl2ZSwgaXMgYW4gYWJzdHJhY3QgZGlyZWN0aXZlLCBvciB1c2VzIEFuZ3VsYXIgZmVhdHVyZXMuXG4gICAqL1xuICBwcml2YXRlIF9hbmFseXplQ2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogQW5hbHl6ZWRDbGFzcyB7XG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID0gbm9kZS5kZWNvcmF0b3JzICYmIGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuZGVjb3JhdG9ycyk7XG4gICAgY29uc3Qga2luZCA9IHRoaXMuX2RldGVybWluZUNsYXNzS2luZChub2RlKTtcbiAgICBpZiAobmdEZWNvcmF0b3JzID09PSB1bmRlZmluZWQgfHwgbmdEZWNvcmF0b3JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtpc0RpcmVjdGl2ZU9yQ29tcG9uZW50OiBmYWxzZSwgaXNBYnN0cmFjdERpcmVjdGl2ZTogZmFsc2UsIGtpbmR9O1xuICAgIH1cbiAgICBjb25zdCBkaXJlY3RpdmVEZWNvcmF0b3IgPSBuZ0RlY29yYXRvcnMuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnRGlyZWN0aXZlJyk7XG4gICAgY29uc3QgY29tcG9uZW50RGVjb3JhdG9yID0gbmdEZWNvcmF0b3JzLmZpbmQoKHtuYW1lfSkgPT4gbmFtZSA9PT0gJ0NvbXBvbmVudCcpO1xuICAgIGNvbnN0IGlzQWJzdHJhY3REaXJlY3RpdmUgPVxuICAgICAgICBkaXJlY3RpdmVEZWNvcmF0b3IgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9pc0Fic3RyYWN0RGlyZWN0aXZlKGRpcmVjdGl2ZURlY29yYXRvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlzRGlyZWN0aXZlT3JDb21wb25lbnQ6ICEhZGlyZWN0aXZlRGVjb3JhdG9yIHx8ICEhY29tcG9uZW50RGVjb3JhdG9yLFxuICAgICAgaXNBYnN0cmFjdERpcmVjdGl2ZSxcbiAgICAgIGtpbmQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gZGVjb3JhdG9yIHJlc29sdmVzIHRvIGFuIGFic3RyYWN0IGRpcmVjdGl2ZS4gQW4gZGlyZWN0aXZlIGlzXG4gICAqIGNvbnNpZGVyZWQgXCJhYnN0cmFjdFwiIGlmIHRoZXJlIGlzIG5vIHNlbGVjdG9yIHNwZWNpZmllZC5cbiAgICovXG4gIHByaXZhdGUgX2lzQWJzdHJhY3REaXJlY3RpdmUoe25vZGV9OiBOZ0RlY29yYXRvcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG1ldGFkYXRhQXJncyA9IG5vZGUuZXhwcmVzc2lvbi5hcmd1bWVudHM7XG4gICAgaWYgKG1ldGFkYXRhQXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBtZXRhZGF0YUV4cHIgPSB1bndyYXBFeHByZXNzaW9uKG1ldGFkYXRhQXJnc1swXSk7XG4gICAgaWYgKCF0cy5pc09iamVjdExpdGVyYWxFeHByZXNzaW9uKG1ldGFkYXRhRXhwcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgbWV0YWRhdGEgPSByZWZsZWN0T2JqZWN0TGl0ZXJhbChtZXRhZGF0YUV4cHIpO1xuICAgIGlmICghbWV0YWRhdGEuaGFzKCdzZWxlY3RvcicpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdG9yID0gdGhpcy5wYXJ0aWFsRXZhbHVhdG9yLmV2YWx1YXRlKG1ldGFkYXRhLmdldCgnc2VsZWN0b3InKSEpO1xuICAgIHJldHVybiBzZWxlY3RvciA9PSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGtpbmQgb2YgYSBnaXZlbiBjbGFzcyBpbiB0ZXJtcyBvZiBBbmd1bGFyLiBUaGUgbWV0aG9kIGNoZWNrc1xuICAgKiB3aGV0aGVyIHRoZSBnaXZlbiBjbGFzcyBoYXMgbWVtYmVycyB0aGF0IGluZGljYXRlIHRoZSB1c2Ugb2YgQW5ndWxhciBmZWF0dXJlcy5cbiAgICogZS5nLiBsaWZlY3ljbGUgaG9va3Mgb3IgZGVjb3JhdGVkIG1lbWJlcnMgbGlrZSBgQElucHV0YCBvciBgQE91dHB1dGAgYXJlXG4gICAqIGNvbnNpZGVyZWQgQW5ndWxhciBmZWF0dXJlcy4uXG4gICAqL1xuICBwcml2YXRlIF9kZXRlcm1pbmVDbGFzc0tpbmQobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IENsYXNzS2luZCB7XG4gICAgbGV0IHVzYWdlID0gQ2xhc3NLaW5kLlVOS05PV047XG5cbiAgICBmb3IgKGNvbnN0IG1lbWJlciBvZiBub2RlLm1lbWJlcnMpIHtcbiAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IG1lbWJlci5uYW1lICE9PSB1bmRlZmluZWQgPyBnZXRQcm9wZXJ0eU5hbWVUZXh0KG1lbWJlci5uYW1lKSA6IG51bGw7XG5cbiAgICAgIC8vIElmIHRoZSBjbGFzcyBkZWNsYXJlcyBhbnkgb2YgdGhlIGtub3duIGRpcmVjdGl2ZSBsaWZlY3ljbGUgaG9va3MsIHdlIGNhblxuICAgICAgLy8gaW1tZWRpYXRlbHkgZXhpdCB0aGUgbG9vcCBhcyB0aGUgY2xhc3MgaXMgZ3VhcmFudGVlZCB0byBiZSBhIGRpcmVjdGl2ZS5cbiAgICAgIGlmIChwcm9wZXJ0eU5hbWUgIT09IG51bGwgJiYgRElSRUNUSVZFX0xJRkVDWUNMRV9IT09LUy5oYXMocHJvcGVydHlOYW1lKSkge1xuICAgICAgICByZXR1cm4gQ2xhc3NLaW5kLkRJUkVDVElWRTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmdEZWNvcmF0b3JzID0gbWVtYmVyLmRlY29yYXRvcnMgIT09IHVuZGVmaW5lZCA/XG4gICAgICAgICAgZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbWVtYmVyLmRlY29yYXRvcnMpIDpcbiAgICAgICAgICBbXTtcbiAgICAgIGZvciAoY29uc3Qge25hbWV9IG9mIG5nRGVjb3JhdG9ycykge1xuICAgICAgICBpZiAoRElSRUNUSVZFX0ZJRUxEX0RFQ09SQVRPUlMuaGFzKG5hbWUpKSB7XG4gICAgICAgICAgcmV0dXJuIENsYXNzS2luZC5ESVJFQ1RJVkU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGNsYXNzIGRlY2xhcmVzIGFueSBvZiB0aGUgbGlmZWN5Y2xlIGhvb2tzIHRoYXQgZG8gbm90IGd1YXJhbnRlZSB0aGF0XG4gICAgICAvLyB0aGUgZ2l2ZW4gY2xhc3MgaXMgYSBkaXJlY3RpdmUsIHVwZGF0ZSB0aGUga2luZCBhbmQgY29udGludWUgbG9va2luZyBmb3Igb3RoZXJcbiAgICAgIC8vIG1lbWJlcnMgdGhhdCB3b3VsZCB1bnZlaWwgYSBtb3JlIHNwZWNpZmljIGtpbmQgKGkuZS4gYmVpbmcgYSBkaXJlY3RpdmUpLlxuICAgICAgaWYgKHByb3BlcnR5TmFtZSAhPT0gbnVsbCAmJiBBTUJJR1VPVVNfTElGRUNZQ0xFX0hPT0tTLmhhcyhwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgIHVzYWdlID0gQ2xhc3NLaW5kLkFNQklHVU9VUztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdXNhZ2U7XG4gIH1cbn1cbiJdfQ==