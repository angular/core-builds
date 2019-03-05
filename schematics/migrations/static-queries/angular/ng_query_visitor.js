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
        define("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", ["require", "exports", "typescript", "@angular/core/schematics/migrations/static-queries/typescript/class_declaration", "@angular/core/schematics/migrations/static-queries/angular/decorators", "@angular/core/schematics/migrations/static-queries/angular/directive_inputs", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const class_declaration_1 = require("@angular/core/schematics/migrations/static-queries/typescript/class_declaration");
    const decorators_1 = require("@angular/core/schematics/migrations/static-queries/angular/decorators");
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
            const ngDecorators = decorators_1.getAngularDecorators(this.typeChecker, node.decorators);
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
            if (!baseTypes || !baseTypes.length) {
                return;
            }
            baseTypes.forEach(baseTypeIdentifier => {
                // We need to resolve the value declaration through the resolved type as the base
                // class could be declared in different source files and the local symbol won't
                // contain a value declaration as the value is not declared locally.
                const symbol = this.typeChecker.getTypeAtLocation(baseTypeIdentifier).getSymbol();
                if (symbol && symbol.valueDeclaration && ts.isClassDeclaration(symbol.valueDeclaration)) {
                    const extendedClass = symbol.valueDeclaration;
                    const classMetadata = this._getClassMetadata(extendedClass);
                    // Record all classes that derive from the given class. This makes it easy to
                    // determine all classes that could potentially use inherited queries statically.
                    classMetadata.derivedClasses.push(node);
                    this.classMetadata.set(extendedClass, classMetadata);
                }
            });
        }
        _getClassMetadata(node) {
            return this.classMetadata.get(node) || { derivedClasses: [], ngInputNames: [] };
        }
    }
    exports.NgQueryResolveVisitor = NgQueryResolveVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfcXVlcnlfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQyx1SEFBbUc7SUFFbkcsc0dBQWtEO0lBQ2xELGtIQUF3RDtJQUN4RCxrSEFBZ0U7SUFhaEU7Ozs7T0FJRztJQUNILE1BQWEscUJBQXFCO1FBT2hDLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQU45QywwQ0FBMEM7WUFDMUMsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBc0MsQ0FBQztZQUVoRSxzREFBc0Q7WUFDdEQsa0JBQWEsR0FBcUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVLLENBQUM7UUFFbEQsU0FBUyxDQUFDLElBQWE7WUFDckIsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUNqQixLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO29CQUNwQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBOEIsQ0FBQyxDQUFDO29CQUM5RCxNQUFNO2dCQUNSLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7b0JBQ2pDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUEyQixDQUFDLENBQUM7b0JBQ3hELE1BQU07YUFDVDtZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxJQUE0QjtZQUMzRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElB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QUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2lCQUN0RDtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGlCQUFpQixDQUFDLElBQXlCO1lBQ2pELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxjQUFjLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUMsQ0FBQztRQUNoRixDQUFDO0tBQ0Y7SUFsR0Qsc0RBa0dDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtmaW5kUGFyZW50Q2xhc3NEZWNsYXJhdGlvbiwgZ2V0QmFzZVR5cGVJZGVudGlmaWVyc30gZnJvbSAnLi4vdHlwZXNjcmlwdC9jbGFzc19kZWNsYXJhdGlvbic7XG5cbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4vZGVjb3JhdG9ycyc7XG5pbXBvcnQge2dldElucHV0TmFtZXNPZkNsYXNzfSBmcm9tICcuL2RpcmVjdGl2ZV9pbnB1dHMnO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUeXBlfSBmcm9tICcuL3F1ZXJ5LWRlZmluaXRpb24nO1xuXG4vKiogUmVzb2x2ZWQgbWV0YWRhdGEgb2YgYSBnaXZlbiBjbGFzcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2xhc3NNZXRhZGF0YSB7XG4gIC8qKiBMaXN0IG9mIGNsYXNzIGRlY2xhcmF0aW9ucyB0aGF0IGRlcml2ZSBmcm9tIHRoZSBnaXZlbiBjbGFzcy4gKi9cbiAgZGVyaXZlZENsYXNzZXM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXTtcbiAgLyoqIExpc3Qgb2YgcHJvcGVydHkgbmFtZXMgdGhhdCBkZWNsYXJlIGFuIEFuZ3VsYXIgaW5wdXQgd2l0aGluIHRoZSBnaXZlbiBjbGFzcy4gKi9cbiAgbmdJbnB1dE5hbWVzOiBzdHJpbmdbXTtcbn1cblxuLyoqIFR5cGUgdGhhdCBkZXNjcmliZXMgYSBtYXAgd2hpY2ggY2FuIGJlIHVzZWQgdG8gZ2V0IGEgY2xhc3MgZGVjbGFyYXRpb24ncyBtZXRhZGF0YS4gKi9cbmV4cG9ydCB0eXBlIENsYXNzTWV0YWRhdGFNYXAgPSBNYXA8dHMuQ2xhc3NEZWNsYXJhdGlvbiwgQ2xhc3NNZXRhZGF0YT47XG5cbi8qKlxuICogVmlzaXRvciB0aGF0IGNhbiBiZSB1c2VkIHRvIGRldGVybWluZSBBbmd1bGFyIHF1ZXJpZXMgd2l0aGluIGdpdmVuIFR5cGVTY3JpcHQgbm9kZXMuXG4gKiBCZXNpZGVzIHJlc29sdmluZyBxdWVyaWVzLCB0aGUgdmlzaXRvciBhbHNvIHJlY29yZHMgY2xhc3MgcmVsYXRpb25zIGFuZCBzZWFyY2hlcyBmb3JcbiAqIEFuZ3VsYXIgaW5wdXQgc2V0dGVycyB3aGljaCBjYW4gYmUgdXNlZCB0byBhbmFseXplIHRoZSB0aW1pbmcgdXNhZ2Ugb2YgYSBnaXZlbiBxdWVyeS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5nUXVlcnlSZXNvbHZlVmlzaXRvciB7XG4gIC8qKiBSZXNvbHZlZCBBbmd1bGFyIHF1ZXJ5IGRlZmluaXRpb25zLiAqL1xuICByZXNvbHZlZFF1ZXJpZXMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIE5nUXVlcnlEZWZpbml0aW9uW10+KCk7XG5cbiAgLyoqIE1hcHMgYSBjbGFzcyBkZWNsYXJhdGlvbiB0byBpdHMgY2xhc3MgbWV0YWRhdGEuICovXG4gIGNsYXNzTWV0YWRhdGE6IENsYXNzTWV0YWRhdGFNYXAgPSBuZXcgTWFwKCk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuUHJvcGVydHlEZWNsYXJhdGlvbjpcbiAgICAgICAgdGhpcy52aXNpdFByb3BlcnR5RGVjbGFyYXRpb24obm9kZSBhcyB0cy5Qcm9wZXJ0eURlY2xhcmF0aW9uKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRzLlN5bnRheEtpbmQuQ2xhc3NEZWNsYXJhdGlvbjpcbiAgICAgICAgdGhpcy52aXNpdENsYXNzRGVjbGFyYXRpb24obm9kZSBhcyB0cy5DbGFzc0RlY2xhcmF0aW9uKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIG5vZGUgPT4gdGhpcy52aXNpdE5vZGUobm9kZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdFByb3BlcnR5RGVjbGFyYXRpb24obm9kZTogdHMuUHJvcGVydHlEZWNsYXJhdGlvbikge1xuICAgIGlmICghbm9kZS5kZWNvcmF0b3JzIHx8ICFub2RlLmRlY29yYXRvcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmdEZWNvcmF0b3JzID0gZ2V0QW5ndWxhckRlY29yYXRvcnModGhpcy50eXBlQ2hlY2tlciwgbm9kZS5kZWNvcmF0b3JzKTtcbiAgICBjb25zdCBxdWVyeURlY29yYXRvciA9XG4gICAgICAgIG5nRGVjb3JhdG9ycy5maW5kKCh7bmFtZX0pID0+IG5hbWUgPT09ICdWaWV3Q2hpbGQnIHx8IG5hbWUgPT09ICdDb250ZW50Q2hpbGQnKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBjdXJyZW50IHByb3BlcnR5IGRlY2xhcmF0aW9uIGlzIGRlZmluaW5nIGEgcXVlcnkuXG4gICAgaWYgKCFxdWVyeURlY29yYXRvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHF1ZXJ5Q29udGFpbmVyID0gZmluZFBhcmVudENsYXNzRGVjbGFyYXRpb24obm9kZSk7XG5cbiAgICAvLyBJZiB0aGUgcXVlcnkgaXMgbm90IGxvY2F0ZWQgd2l0aGluIGEgY2xhc3MgZGVjbGFyYXRpb24sIHNraXAgdGhpcyBub2RlLlxuICAgIGlmICghcXVlcnlDb250YWluZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VGaWxlID0gbm9kZS5nZXRTb3VyY2VGaWxlKCk7XG4gICAgY29uc3QgbmV3UXVlcmllcyA9IHRoaXMucmVzb2x2ZWRRdWVyaWVzLmdldChzb3VyY2VGaWxlKSB8fCBbXTtcblxuICAgIHRoaXMucmVzb2x2ZWRRdWVyaWVzLnNldChzb3VyY2VGaWxlLCBuZXdRdWVyaWVzLmNvbmNhdCh7XG4gICAgICB0eXBlOiBxdWVyeURlY29yYXRvci5uYW1lID09PSAnVmlld0NoaWxkJyA/IFF1ZXJ5VHlwZS5WaWV3Q2hpbGQgOiBRdWVyeVR5cGUuQ29udGVudENoaWxkLFxuICAgICAgcHJvcGVydHk6IG5vZGUsXG4gICAgICBkZWNvcmF0b3I6IHF1ZXJ5RGVjb3JhdG9yLFxuICAgICAgY29udGFpbmVyOiBxdWVyeUNvbnRhaW5lcixcbiAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIHZpc2l0Q2xhc3NEZWNsYXJhdGlvbihub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgdGhpcy5fcmVjb3JkQ2xhc3NJbnB1dFNldHRlcnMobm9kZSk7XG4gICAgdGhpcy5fcmVjb3JkQ2xhc3NJbmhlcml0YW5jZXMobm9kZSk7XG4gIH1cblxuICBwcml2YXRlIF9yZWNvcmRDbGFzc0lucHV0U2V0dGVycyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgY29uc3QgcmVzb2x2ZWRJbnB1dE5hbWVzID0gZ2V0SW5wdXROYW1lc09mQ2xhc3Mobm9kZSwgdGhpcy50eXBlQ2hlY2tlcik7XG5cbiAgICBpZiAocmVzb2x2ZWRJbnB1dE5hbWVzKSB7XG4gICAgICBjb25zdCBjbGFzc01ldGFkYXRhID0gdGhpcy5fZ2V0Q2xhc3NNZXRhZGF0YShub2RlKTtcblxuICAgICAgY2xhc3NNZXRhZGF0YS5uZ0lucHV0TmFtZXMgPSByZXNvbHZlZElucHV0TmFtZXM7XG4gICAgICB0aGlzLmNsYXNzTWV0YWRhdGEuc2V0KG5vZGUsIGNsYXNzTWV0YWRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3JlY29yZENsYXNzSW5oZXJpdGFuY2VzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICBjb25zdCBiYXNlVHlwZXMgPSBnZXRCYXNlVHlwZUlkZW50aWZpZXJzKG5vZGUpO1xuXG4gICAgaWYgKCFiYXNlVHlwZXMgfHwgIWJhc2VUeXBlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBiYXNlVHlwZXMuZm9yRWFjaChiYXNlVHlwZUlkZW50aWZpZXIgPT4ge1xuICAgICAgLy8gV2UgbmVlZCB0byByZXNvbHZlIHRoZSB2YWx1ZSBkZWNsYXJhdGlvbiB0aHJvdWdoIHRoZSByZXNvbHZlZCB0eXBlIGFzIHRoZSBiYXNlXG4gICAgICAvLyBjbGFzcyBjb3VsZCBiZSBkZWNsYXJlZCBpbiBkaWZmZXJlbnQgc291cmNlIGZpbGVzIGFuZCB0aGUgbG9jYWwgc3ltYm9sIHdvbid0XG4gICAgICAvLyBjb250YWluIGEgdmFsdWUgZGVjbGFyYXRpb24gYXMgdGhlIHZhbHVlIGlzIG5vdCBkZWNsYXJlZCBsb2NhbGx5LlxuICAgICAgY29uc3Qgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihiYXNlVHlwZUlkZW50aWZpZXIpLmdldFN5bWJvbCgpO1xuXG4gICAgICBpZiAoc3ltYm9sICYmIHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uICYmIHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgICAgY29uc3QgZXh0ZW5kZWRDbGFzcyA9IHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uO1xuICAgICAgICBjb25zdCBjbGFzc01ldGFkYXRhID0gdGhpcy5fZ2V0Q2xhc3NNZXRhZGF0YShleHRlbmRlZENsYXNzKTtcblxuICAgICAgICAvLyBSZWNvcmQgYWxsIGNsYXNzZXMgdGhhdCBkZXJpdmUgZnJvbSB0aGUgZ2l2ZW4gY2xhc3MuIFRoaXMgbWFrZXMgaXQgZWFzeSB0b1xuICAgICAgICAvLyBkZXRlcm1pbmUgYWxsIGNsYXNzZXMgdGhhdCBjb3VsZCBwb3RlbnRpYWxseSB1c2UgaW5oZXJpdGVkIHF1ZXJpZXMgc3RhdGljYWxseS5cbiAgICAgICAgY2xhc3NNZXRhZGF0YS5kZXJpdmVkQ2xhc3Nlcy5wdXNoKG5vZGUpO1xuICAgICAgICB0aGlzLmNsYXNzTWV0YWRhdGEuc2V0KGV4dGVuZGVkQ2xhc3MsIGNsYXNzTWV0YWRhdGEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0Q2xhc3NNZXRhZGF0YShub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKTogQ2xhc3NNZXRhZGF0YSB7XG4gICAgcmV0dXJuIHRoaXMuY2xhc3NNZXRhZGF0YS5nZXQobm9kZSkgfHwge2Rlcml2ZWRDbGFzc2VzOiBbXSwgbmdJbnB1dE5hbWVzOiBbXX07XG4gIH1cbn1cbiJdfQ==