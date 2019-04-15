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
        define("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", ["require", "exports", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/class_declaration", "@angular/core/schematics/migrations/static-queries/angular/directive_inputs", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const class_declaration_1 = require("@angular/core/schematics/utils/typescript/class_declaration");
    const directive_inputs_1 = require("@angular/core/schematics/migrations/static-queries/angular/directive_inputs");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    /**
     * Visitor that can be used to determine Angular queries within given TypeScript nodes.
     * Besides resolving queries, the visitor also records class relations and searches for
     * Angular input setters which can be used to analyze the timing usage of a given query.
     */
    class NgQueryResolveVisitor {
        constructor(typeChecker) {
            this.typeChecker = typeChecker;
            /** Resolved Angular query definitions. */
            this.resolvedQueries = new Map();
            /** Maps a class declaration to its class metadata. */
            this.classMetadata = new Map();
        }
        visitNode(node) {
            switch (node.kind) {
                case ts.SyntaxKind.PropertyDeclaration:
                    this.visitPropertyDeclaration(node);
                    break;
                case ts.SyntaxKind.ClassDeclaration:
                    this.visitClassDeclaration(node);
                    break;
            }
        }
        visitPropertyDeclaration(node) {
            if (!node.decorators || !node.decorators.length) {
                return;
            }
            const ngDecorators = ng_decorators_1.getAngularDecorators(this.typeChecker, node.decorators);
            const queryDecorator = ngDecorators.find(({ name }) => name === 'ViewChild' || name === 'ContentChild');
            // Ensure that the current property declaration is defining a query.
            if (!queryDecorator) {
                return;
            }
            const queryContainer = class_declaration_1.findParentClassDeclaration(node);
            // If the query is not located within a class declaration, skip this node.
            if (!queryContainer) {
                return;
            }
            const sourceFile = node.getSourceFile();
            const newQueries = this.resolvedQueries.get(sourceFile) || [];
            this.resolvedQueries.set(sourceFile, newQueries.concat({
                type: queryDecorator.name === 'ViewChild' ? query_definition_1.QueryType.ViewChild : query_definition_1.QueryType.ContentChild,
                property: node,
                decorator: queryDecorator,
                container: queryContainer,
            }));
        }
        visitClassDeclaration(node) {
            this._recordClassInputSetters(node);
            this._recordClassInheritances(node);
        }
        _recordClassInputSetters(node) {
            const resolvedInputNames = directive_inputs_1.getInputNamesOfClass(node, this.typeChecker);
            if (resolvedInputNames) {
                const classMetadata = this._getClassMetadata(node);
                classMetadata.ngInputNames = resolvedInputNames;
                this.classMetadata.set(node, classMetadata);
            }
        }
        _recordClassInheritances(node) {
            const baseTypes = class_declaration_1.getBaseTypeIdentifiers(node);
            if (!baseTypes || baseTypes.length !== 1) {
                return;
            }
            const superClass = baseTypes[0];
            const baseClassMetadata = this._getClassMetadata(node);
            // We need to resolve the value declaration through the resolved type as the base
            // class could be declared in different source files and the local symbol won't
            // contain a value declaration as the value is not declared locally.
            const symbol = this.typeChecker.getTypeAtLocation(superClass).getSymbol();
            if (symbol && symbol.valueDeclaration && ts.isClassDeclaration(symbol.valueDeclaration)) {
                const extendedClass = symbol.valueDeclaration;
                const classMetadataExtended = this._getClassMetadata(extendedClass);
                // Record all classes that derive from the given class. This makes it easy to
                // determine all classes that could potentially use inherited queries statically.
                classMetadataExtended.derivedClasses.push(node);
                this.classMetadata.set(extendedClass, classMetadataExtended);
                // Record the super class of the current class.
                baseClassMetadata.superClass = extendedClass;
                this.classMetadata.set(node, baseClassMetadata);
            }
        }
        _getClassMetadata(node) {
            return this.classMetadata.get(node) || { derivedClasses: [], superClass: null, ngInputNames: [] };
        }
    }
    exports.NgQueryResolveVisitor = NgQueryResolveVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfcXVlcnlfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUdqQyxnRkFBa0U7SUFDbEUsbUdBQStHO0lBRS9HLGtIQUF3RDtJQUN4RCxrSEFBZ0U7SUFrQmhFOzs7O09BSUc7SUFDSCxNQUFhLHFCQUFxQjtRQU9oQyxZQUFtQixXQUEyQjtZQUEzQixnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFOOUMsMENBQTBDO1lBQzFDLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXNDLENBQUM7WUFFaEUsc0RBQXNEO1lBQ3RELGtCQUFhLEdBQXFCLElBQUksR0FBRyxFQUFFLENBQUM7UUFFSyxDQUFDO1FBRWxELFNBQVMsQ0FBQyxJQUFhO1lBQ3JCLFFBQVEsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDakIsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtvQkFDcEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQThCLENBQUMsQ0FBQztvQkFDOUQsTUFBTTtnQkFDUixLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO29CQUNqQyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBMkIsQ0FBQyxDQUFDO29CQUN4RCxNQUFNO2FBQ1Q7UUFDSCxDQUFDO1FBRU8sd0JBQXdCLENBQUMsSUFBNEI7WUFDM0QsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtnQkFDL0MsT0FBTzthQUNSO1lBRUQsTUFBTSxZQUFZLEdBQUcsb0NBQW9CLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFB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QUFFLHFCQUFxQixDQUFDLENBQUM7Z0JBRTdELCtDQUErQztnQkFDL0MsaUJBQWlCLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUM7YUFDakQ7UUFDSCxDQUFDO1FBRU8saUJBQWlCLENBQUMsSUFBeUI7WUFDakQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDLGNBQWMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFDLENBQUM7UUFDbEcsQ0FBQztLQUNGO0lBckdELHNEQXFHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7UmVzb2x2ZWRUZW1wbGF0ZX0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4uLy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHtmaW5kUGFyZW50Q2xhc3NEZWNsYXJhdGlvbiwgZ2V0QmFzZVR5cGVJZGVudGlmaWVyc30gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jbGFzc19kZWNsYXJhdGlvbic7XG5cbmltcG9ydCB7Z2V0SW5wdXROYW1lc09mQ2xhc3N9IGZyb20gJy4vZGlyZWN0aXZlX2lucHV0cyc7XG5pbXBvcnQge05nUXVlcnlEZWZpbml0aW9uLCBRdWVyeVR5cGV9IGZyb20gJy4vcXVlcnktZGVmaW5pdGlvbic7XG5cblxuLyoqIFJlc29sdmVkIG1ldGFkYXRhIG9mIGEgZ2l2ZW4gY2xhc3MuICovXG5leHBvcnQgaW50ZXJmYWNlIENsYXNzTWV0YWRhdGEge1xuICAvKiogTGlzdCBvZiBjbGFzcyBkZWNsYXJhdGlvbnMgdGhhdCBkZXJpdmUgZnJvbSB0aGUgZ2l2ZW4gY2xhc3MuICovXG4gIGRlcml2ZWRDbGFzc2VzOiB0cy5DbGFzc0RlY2xhcmF0aW9uW107XG4gIC8qKiBTdXBlciBjbGFzcyBvZiB0aGUgZ2l2ZW4gY2xhc3MuICovXG4gIHN1cGVyQ2xhc3M6IHRzLkNsYXNzRGVjbGFyYXRpb258bnVsbDtcbiAgLyoqIExpc3Qgb2YgcHJvcGVydHkgbmFtZXMgdGhhdCBkZWNsYXJlIGFuIEFuZ3VsYXIgaW5wdXQgd2l0aGluIHRoZSBnaXZlbiBjbGFzcy4gKi9cbiAgbmdJbnB1dE5hbWVzOiBzdHJpbmdbXTtcbiAgLyoqIENvbXBvbmVudCB0ZW1wbGF0ZSB0aGF0IGJlbG9uZ3MgdG8gdGhhdCBjbGFzcyBpZiBwcmVzZW50LiAqL1xuICB0ZW1wbGF0ZT86IFJlc29sdmVkVGVtcGxhdGU7XG59XG5cbi8qKiBUeXBlIHRoYXQgZGVzY3JpYmVzIGEgbWFwIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGdldCBhIGNsYXNzIGRlY2xhcmF0aW9uJ3MgbWV0YWRhdGEuICovXG5leHBvcnQgdHlwZSBDbGFzc01ldGFkYXRhTWFwID0gTWFwPHRzLkNsYXNzRGVjbGFyYXRpb24sIENsYXNzTWV0YWRhdGE+O1xuXG4vKipcbiAqIFZpc2l0b3IgdGhhdCBjYW4gYmUgdXNlZCB0byBkZXRlcm1pbmUgQW5ndWxhciBxdWVyaWVzIHdpdGhpbiBnaXZlbiBUeXBlU2NyaXB0IG5vZGVzLlxuICogQmVzaWRlcyByZXNvbHZpbmcgcXVlcmllcywgdGhlIHZpc2l0b3IgYWxzbyByZWNvcmRzIGNsYXNzIHJlbGF0aW9ucyBhbmQgc2VhcmNoZXMgZm9yXG4gKiBBbmd1bGFyIGlucHV0IHNldHRlcnMgd2hpY2ggY2FuIGJlIHVzZWQgdG8gYW5hbHl6ZSB0aGUgdGltaW5nIHVzYWdlIG9mIGEgZ2l2ZW4gcXVlcnkuXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3Ige1xuICAvKiogUmVzb2x2ZWQgQW5ndWxhciBxdWVyeSBkZWZpbml0aW9ucy4gKi9cbiAgcmVzb2x2ZWRRdWVyaWVzID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBOZ1F1ZXJ5RGVmaW5pdGlvbltdPigpO1xuXG4gIC8qKiBNYXBzIGEgY2xhc3MgZGVjbGFyYXRpb24gdG8gaXRzIGNsYXNzIG1ldGFkYXRhLiAqL1xuICBjbGFzc01ldGFkYXRhOiBDbGFzc01ldGFkYXRhTWFwID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpIHt9XG5cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlByb3BlcnR5RGVjbGFyYXRpb246XG4gICAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eURlY2xhcmF0aW9uKG5vZGUgYXMgdHMuUHJvcGVydHlEZWNsYXJhdGlvbik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb246XG4gICAgICAgIHRoaXMudmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGUgYXMgdHMuQ2xhc3NEZWNsYXJhdGlvbik7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRQcm9wZXJ0eURlY2xhcmF0aW9uKG5vZGU6IHRzLlByb3BlcnR5RGVjbGFyYXRpb24pIHtcbiAgICBpZiAoIW5vZGUuZGVjb3JhdG9ycyB8fCAhbm9kZS5kZWNvcmF0b3JzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5nRGVjb3JhdG9ycyA9IGdldEFuZ3VsYXJEZWNvcmF0b3JzKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUuZGVjb3JhdG9ycyk7XG4gICAgY29uc3QgcXVlcnlEZWNvcmF0b3IgPVxuICAgICAgICBuZ0RlY29yYXRvcnMuZmluZCgoe25hbWV9KSA9PiBuYW1lID09PSAnVmlld0NoaWxkJyB8fCBuYW1lID09PSAnQ29udGVudENoaWxkJyk7XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB0aGUgY3VycmVudCBwcm9wZXJ0eSBkZWNsYXJhdGlvbiBpcyBkZWZpbmluZyBhIHF1ZXJ5LlxuICAgIGlmICghcXVlcnlEZWNvcmF0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBxdWVyeUNvbnRhaW5lciA9IGZpbmRQYXJlbnRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpO1xuXG4gICAgLy8gSWYgdGhlIHF1ZXJ5IGlzIG5vdCBsb2NhdGVkIHdpdGhpbiBhIGNsYXNzIGRlY2xhcmF0aW9uLCBza2lwIHRoaXMgbm9kZS5cbiAgICBpZiAoIXF1ZXJ5Q29udGFpbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlRmlsZSA9IG5vZGUuZ2V0U291cmNlRmlsZSgpO1xuICAgIGNvbnN0IG5ld1F1ZXJpZXMgPSB0aGlzLnJlc29sdmVkUXVlcmllcy5nZXQoc291cmNlRmlsZSkgfHwgW107XG5cbiAgICB0aGlzLnJlc29sdmVkUXVlcmllcy5zZXQoc291cmNlRmlsZSwgbmV3UXVlcmllcy5jb25jYXQoe1xuICAgICAgdHlwZTogcXVlcnlEZWNvcmF0b3IubmFtZSA9PT0gJ1ZpZXdDaGlsZCcgPyBRdWVyeVR5cGUuVmlld0NoaWxkIDogUXVlcnlUeXBlLkNvbnRlbnRDaGlsZCxcbiAgICAgIHByb3BlcnR5OiBub2RlLFxuICAgICAgZGVjb3JhdG9yOiBxdWVyeURlY29yYXRvcixcbiAgICAgIGNvbnRhaW5lcjogcXVlcnlDb250YWluZXIsXG4gICAgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIHRoaXMuX3JlY29yZENsYXNzSW5wdXRTZXR0ZXJzKG5vZGUpO1xuICAgIHRoaXMuX3JlY29yZENsYXNzSW5oZXJpdGFuY2VzKG5vZGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVjb3JkQ2xhc3NJbnB1dFNldHRlcnMobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGNvbnN0IHJlc29sdmVkSW5wdXROYW1lcyA9IGdldElucHV0TmFtZXNPZkNsYXNzKG5vZGUsIHRoaXMudHlwZUNoZWNrZXIpO1xuXG4gICAgaWYgKHJlc29sdmVkSW5wdXROYW1lcykge1xuICAgICAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IHRoaXMuX2dldENsYXNzTWV0YWRhdGEobm9kZSk7XG5cbiAgICAgIGNsYXNzTWV0YWRhdGEubmdJbnB1dE5hbWVzID0gcmVzb2x2ZWRJbnB1dE5hbWVzO1xuICAgICAgdGhpcy5jbGFzc01ldGFkYXRhLnNldChub2RlLCBjbGFzc01ldGFkYXRhKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9yZWNvcmRDbGFzc0luaGVyaXRhbmNlcyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgY29uc3QgYmFzZVR5cGVzID0gZ2V0QmFzZVR5cGVJZGVudGlmaWVycyhub2RlKTtcblxuICAgIGlmICghYmFzZVR5cGVzIHx8IGJhc2VUeXBlcy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzdXBlckNsYXNzID0gYmFzZVR5cGVzWzBdO1xuICAgIGNvbnN0IGJhc2VDbGFzc01ldGFkYXRhID0gdGhpcy5fZ2V0Q2xhc3NNZXRhZGF0YShub2RlKTtcblxuICAgIC8vIFdlIG5lZWQgdG8gcmVzb2x2ZSB0aGUgdmFsdWUgZGVjbGFyYXRpb24gdGhyb3VnaCB0aGUgcmVzb2x2ZWQgdHlwZSBhcyB0aGUgYmFzZVxuICAgIC8vIGNsYXNzIGNvdWxkIGJlIGRlY2xhcmVkIGluIGRpZmZlcmVudCBzb3VyY2UgZmlsZXMgYW5kIHRoZSBsb2NhbCBzeW1ib2wgd29uJ3RcbiAgICAvLyBjb250YWluIGEgdmFsdWUgZGVjbGFyYXRpb24gYXMgdGhlIHZhbHVlIGlzIG5vdCBkZWNsYXJlZCBsb2NhbGx5LlxuICAgIGNvbnN0IHN5bWJvbCA9IHRoaXMudHlwZUNoZWNrZXIuZ2V0VHlwZUF0TG9jYXRpb24oc3VwZXJDbGFzcykuZ2V0U3ltYm9sKCk7XG5cbiAgICBpZiAoc3ltYm9sICYmIHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uICYmIHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgIGNvbnN0IGV4dGVuZGVkQ2xhc3MgPSBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbjtcbiAgICAgIGNvbnN0IGNsYXNzTWV0YWRhdGFFeHRlbmRlZCA9IHRoaXMuX2dldENsYXNzTWV0YWRhdGEoZXh0ZW5kZWRDbGFzcyk7XG5cbiAgICAgIC8vIFJlY29yZCBhbGwgY2xhc3NlcyB0aGF0IGRlcml2ZSBmcm9tIHRoZSBnaXZlbiBjbGFzcy4gVGhpcyBtYWtlcyBpdCBlYXN5IHRvXG4gICAgICAvLyBkZXRlcm1pbmUgYWxsIGNsYXNzZXMgdGhhdCBjb3VsZCBwb3RlbnRpYWxseSB1c2UgaW5oZXJpdGVkIHF1ZXJpZXMgc3RhdGljYWxseS5cbiAgICAgIGNsYXNzTWV0YWRhdGFFeHRlbmRlZC5kZXJpdmVkQ2xhc3Nlcy5wdXNoKG5vZGUpO1xuICAgICAgdGhpcy5jbGFzc01ldGFkYXRhLnNldChleHRlbmRlZENsYXNzLCBjbGFzc01ldGFkYXRhRXh0ZW5kZWQpO1xuXG4gICAgICAvLyBSZWNvcmQgdGhlIHN1cGVyIGNsYXNzIG9mIHRoZSBjdXJyZW50IGNsYXNzLlxuICAgICAgYmFzZUNsYXNzTWV0YWRhdGEuc3VwZXJDbGFzcyA9IGV4dGVuZGVkQ2xhc3M7XG4gICAgICB0aGlzLmNsYXNzTWV0YWRhdGEuc2V0KG5vZGUsIGJhc2VDbGFzc01ldGFkYXRhKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRDbGFzc01ldGFkYXRhKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pOiBDbGFzc01ldGFkYXRhIHtcbiAgICByZXR1cm4gdGhpcy5jbGFzc01ldGFkYXRhLmdldChub2RlKSB8fCB7ZGVyaXZlZENsYXNzZXM6IFtdLCBzdXBlckNsYXNzOiBudWxsLCBuZ0lucHV0TmFtZXM6IFtdfTtcbiAgfVxufVxuIl19