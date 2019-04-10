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
            ts.forEachChild(node, node => this.visitNode(node));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfcXVlcnlfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyxnRkFBa0U7SUFDbEUsbUdBQStHO0lBQy9HLGtIQUF3RDtJQUN4RCxrSEFBZ0U7SUFlaEU7Ozs7T0FJRztJQUNILE1BQWEscUJBQXFCO1FBT2hDLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQU45QywwQ0FBMEM7WUFDMUMsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBc0MsQ0FBQztZQUVoRSxzREFBc0Q7WUFDdEQsa0JBQWEsR0FBcUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVLLENBQUM7UUFFbEQsU0FBUyxDQUFDLElBQWE7WUFDckIsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUNqQixLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO29CQUNwQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBOEIsQ0FBQyxDQUFDO29CQUM5RCxNQUFNO2dCQUNSLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7b0JBQ2pDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUEyQixDQUFDLENBQUM7b0JBQ3hELE1BQU07YUFDVDtZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxJQUE0QjtZQUMzRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElB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QUNqRixxQkFBcUIsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUscUJBQXFCLENBQUMsQ0FBQztnQkFFN0QsK0NBQStDO2dCQUMvQyxpQkFBaUIsQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzthQUNqRDtRQUNILENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxJQUF5QjtZQUNqRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUMsY0FBYyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUMsQ0FBQztRQUNsRyxDQUFDO0tBQ0Y7SUF2R0Qsc0RBdUdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4uLy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHtmaW5kUGFyZW50Q2xhc3NEZWNsYXJhdGlvbiwgZ2V0QmFzZVR5cGVJZGVudGlmaWVyc30gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jbGFzc19kZWNsYXJhdGlvbic7XG5pbXBvcnQge2dldElucHV0TmFtZXNPZkNsYXNzfSBmcm9tICcuL2RpcmVjdGl2ZV9pbnB1dHMnO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUeXBlfSBmcm9tICcuL3F1ZXJ5LWRlZmluaXRpb24nO1xuXG4vKiogUmVzb2x2ZWQgbWV0YWRhdGEgb2YgYSBnaXZlbiBjbGFzcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2xhc3NNZXRhZGF0YSB7XG4gIC8qKiBMaXN0IG9mIGNsYXNzIGRlY2xhcmF0aW9ucyB0aGF0IGRlcml2ZSBmcm9tIHRoZSBnaXZlbiBjbGFzcy4gKi9cbiAgZGVyaXZlZENsYXNzZXM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXTtcbiAgLyoqIFN1cGVyIGNsYXNzIG9mIHRoZSBnaXZlbiBjbGFzcy4gKi9cbiAgc3VwZXJDbGFzczogdHMuQ2xhc3NEZWNsYXJhdGlvbnxudWxsO1xuICAvKiogTGlzdCBvZiBwcm9wZXJ0eSBuYW1lcyB0aGF0IGRlY2xhcmUgYW4gQW5ndWxhciBpbnB1dCB3aXRoaW4gdGhlIGdpdmVuIGNsYXNzLiAqL1xuICBuZ0lucHV0TmFtZXM6IHN0cmluZ1tdO1xufVxuXG4vKiogVHlwZSB0aGF0IGRlc2NyaWJlcyBhIG1hcCB3aGljaCBjYW4gYmUgdXNlZCB0byBnZXQgYSBjbGFzcyBkZWNsYXJhdGlvbidzIG1ldGFkYXRhLiAqL1xuZXhwb3J0IHR5cGUgQ2xhc3NNZXRhZGF0YU1hcCA9IE1hcDx0cy5DbGFzc0RlY2xhcmF0aW9uLCBDbGFzc01ldGFkYXRhPjtcblxuLyoqXG4gKiBWaXNpdG9yIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIEFuZ3VsYXIgcXVlcmllcyB3aXRoaW4gZ2l2ZW4gVHlwZVNjcmlwdCBub2Rlcy5cbiAqIEJlc2lkZXMgcmVzb2x2aW5nIHF1ZXJpZXMsIHRoZSB2aXNpdG9yIGFsc28gcmVjb3JkcyBjbGFzcyByZWxhdGlvbnMgYW5kIHNlYXJjaGVzIGZvclxuICogQW5ndWxhciBpbnB1dCBzZXR0ZXJzIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFuYWx5emUgdGhlIHRpbWluZyB1c2FnZSBvZiBhIGdpdmVuIHF1ZXJ5LlxuICovXG5leHBvcnQgY2xhc3MgTmdRdWVyeVJlc29sdmVWaXNpdG9yIHtcbiAgLyoqIFJlc29sdmVkIEFuZ3VsYXIgcXVlcnkgZGVmaW5pdGlvbnMuICovXG4gIHJlc29sdmVkUXVlcmllcyA9IG5ldyBNYXA8dHMuU291cmNlRmlsZSwgTmdRdWVyeURlZmluaXRpb25bXT4oKTtcblxuICAvKiogTWFwcyBhIGNsYXNzIGRlY2xhcmF0aW9uIHRvIGl0cyBjbGFzcyBtZXRhZGF0YS4gKi9cbiAgY2xhc3NNZXRhZGF0YTogQ2xhc3NNZXRhZGF0YU1hcCA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKSB7fVxuXG4gIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5Qcm9wZXJ0eURlY2xhcmF0aW9uOlxuICAgICAgICB0aGlzLnZpc2l0UHJvcGVydHlEZWNsYXJhdGlvbihub2RlIGFzIHRzLlByb3BlcnR5RGVjbGFyYXRpb24pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdHMuU3ludGF4S2luZC5DbGFzc0RlY2xhcmF0aW9uOlxuICAgICAgICB0aGlzLnZpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlIGFzIHRzLkNsYXNzRGVjbGFyYXRpb24pO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgbm9kZSA9PiB0aGlzLnZpc2l0Tm9kZShub2RlKSk7XG4gIH1cblxuICBwcml2YXRlIHZpc2l0UHJvcGVydHlEZWNsYXJhdGlvbihub2RlOiB0cy5Qcm9wZXJ0eURlY2xhcmF0aW9uKSB7XG4gICAgaWYgKCFub2RlLmRlY29yYXRvcnMgfHwgIW5vZGUuZGVjb3JhdG9ycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpO1xuICAgIGNvbnN0IHF1ZXJ5RGVjb3JhdG9yID1cbiAgICAgICAgbmdEZWNvcmF0b3JzLmZpbmQoKHtuYW1lfSkgPT4gbmFtZSA9PT0gJ1ZpZXdDaGlsZCcgfHwgbmFtZSA9PT0gJ0NvbnRlbnRDaGlsZCcpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGN1cnJlbnQgcHJvcGVydHkgZGVjbGFyYXRpb24gaXMgZGVmaW5pbmcgYSBxdWVyeS5cbiAgICBpZiAoIXF1ZXJ5RGVjb3JhdG9yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcXVlcnlDb250YWluZXIgPSBmaW5kUGFyZW50Q2xhc3NEZWNsYXJhdGlvbihub2RlKTtcblxuICAgIC8vIElmIHRoZSBxdWVyeSBpcyBub3QgbG9jYXRlZCB3aXRoaW4gYSBjbGFzcyBkZWNsYXJhdGlvbiwgc2tpcCB0aGlzIG5vZGUuXG4gICAgaWYgKCFxdWVyeUNvbnRhaW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCBuZXdRdWVyaWVzID0gdGhpcy5yZXNvbHZlZFF1ZXJpZXMuZ2V0KHNvdXJjZUZpbGUpIHx8IFtdO1xuXG4gICAgdGhpcy5yZXNvbHZlZFF1ZXJpZXMuc2V0KHNvdXJjZUZpbGUsIG5ld1F1ZXJpZXMuY29uY2F0KHtcbiAgICAgIHR5cGU6IHF1ZXJ5RGVjb3JhdG9yLm5hbWUgPT09ICdWaWV3Q2hpbGQnID8gUXVlcnlUeXBlLlZpZXdDaGlsZCA6IFF1ZXJ5VHlwZS5Db250ZW50Q2hpbGQsXG4gICAgICBwcm9wZXJ0eTogbm9kZSxcbiAgICAgIGRlY29yYXRvcjogcXVlcnlEZWNvcmF0b3IsXG4gICAgICBjb250YWluZXI6IHF1ZXJ5Q29udGFpbmVyLFxuICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICB0aGlzLl9yZWNvcmRDbGFzc0lucHV0U2V0dGVycyhub2RlKTtcbiAgICB0aGlzLl9yZWNvcmRDbGFzc0luaGVyaXRhbmNlcyhub2RlKTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlY29yZENsYXNzSW5wdXRTZXR0ZXJzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICBjb25zdCByZXNvbHZlZElucHV0TmFtZXMgPSBnZXRJbnB1dE5hbWVzT2ZDbGFzcyhub2RlLCB0aGlzLnR5cGVDaGVja2VyKTtcblxuICAgIGlmIChyZXNvbHZlZElucHV0TmFtZXMpIHtcbiAgICAgIGNvbnN0IGNsYXNzTWV0YWRhdGEgPSB0aGlzLl9nZXRDbGFzc01ldGFkYXRhKG5vZGUpO1xuXG4gICAgICBjbGFzc01ldGFkYXRhLm5nSW5wdXROYW1lcyA9IHJlc29sdmVkSW5wdXROYW1lcztcbiAgICAgIHRoaXMuY2xhc3NNZXRhZGF0YS5zZXQobm9kZSwgY2xhc3NNZXRhZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcmVjb3JkQ2xhc3NJbmhlcml0YW5jZXMobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbikge1xuICAgIGNvbnN0IGJhc2VUeXBlcyA9IGdldEJhc2VUeXBlSWRlbnRpZmllcnMobm9kZSk7XG5cbiAgICBpZiAoIWJhc2VUeXBlcyB8fCBiYXNlVHlwZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc3VwZXJDbGFzcyA9IGJhc2VUeXBlc1swXTtcbiAgICBjb25zdCBiYXNlQ2xhc3NNZXRhZGF0YSA9IHRoaXMuX2dldENsYXNzTWV0YWRhdGEobm9kZSk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIHJlc29sdmUgdGhlIHZhbHVlIGRlY2xhcmF0aW9uIHRocm91Z2ggdGhlIHJlc29sdmVkIHR5cGUgYXMgdGhlIGJhc2VcbiAgICAvLyBjbGFzcyBjb3VsZCBiZSBkZWNsYXJlZCBpbiBkaWZmZXJlbnQgc291cmNlIGZpbGVzIGFuZCB0aGUgbG9jYWwgc3ltYm9sIHdvbid0XG4gICAgLy8gY29udGFpbiBhIHZhbHVlIGRlY2xhcmF0aW9uIGFzIHRoZSB2YWx1ZSBpcyBub3QgZGVjbGFyZWQgbG9jYWxseS5cbiAgICBjb25zdCBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFR5cGVBdExvY2F0aW9uKHN1cGVyQ2xhc3MpLmdldFN5bWJvbCgpO1xuXG4gICAgaWYgKHN5bWJvbCAmJiBzeW1ib2wudmFsdWVEZWNsYXJhdGlvbiAmJiB0cy5pc0NsYXNzRGVjbGFyYXRpb24oc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24pKSB7XG4gICAgICBjb25zdCBleHRlbmRlZENsYXNzID0gc3ltYm9sLnZhbHVlRGVjbGFyYXRpb247XG4gICAgICBjb25zdCBjbGFzc01ldGFkYXRhRXh0ZW5kZWQgPSB0aGlzLl9nZXRDbGFzc01ldGFkYXRhKGV4dGVuZGVkQ2xhc3MpO1xuXG4gICAgICAvLyBSZWNvcmQgYWxsIGNsYXNzZXMgdGhhdCBkZXJpdmUgZnJvbSB0aGUgZ2l2ZW4gY2xhc3MuIFRoaXMgbWFrZXMgaXQgZWFzeSB0b1xuICAgICAgLy8gZGV0ZXJtaW5lIGFsbCBjbGFzc2VzIHRoYXQgY291bGQgcG90ZW50aWFsbHkgdXNlIGluaGVyaXRlZCBxdWVyaWVzIHN0YXRpY2FsbHkuXG4gICAgICBjbGFzc01ldGFkYXRhRXh0ZW5kZWQuZGVyaXZlZENsYXNzZXMucHVzaChub2RlKTtcbiAgICAgIHRoaXMuY2xhc3NNZXRhZGF0YS5zZXQoZXh0ZW5kZWRDbGFzcywgY2xhc3NNZXRhZGF0YUV4dGVuZGVkKTtcblxuICAgICAgLy8gUmVjb3JkIHRoZSBzdXBlciBjbGFzcyBvZiB0aGUgY3VycmVudCBjbGFzcy5cbiAgICAgIGJhc2VDbGFzc01ldGFkYXRhLnN1cGVyQ2xhc3MgPSBleHRlbmRlZENsYXNzO1xuICAgICAgdGhpcy5jbGFzc01ldGFkYXRhLnNldChub2RlLCBiYXNlQ2xhc3NNZXRhZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0Q2xhc3NNZXRhZGF0YShub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogQ2xhc3NNZXRhZGF0YSB7XG4gICAgcmV0dXJuIHRoaXMuY2xhc3NNZXRhZGF0YS5nZXQobm9kZSkgfHwge2Rlcml2ZWRDbGFzc2VzOiBbXSwgc3VwZXJDbGFzczogbnVsbCwgbmdJbnB1dE5hbWVzOiBbXX07XG4gIH1cbn1cbiJdfQ==