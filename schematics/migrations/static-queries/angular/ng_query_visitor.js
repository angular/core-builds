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
        define("@angular/core/schematics/migrations/static-queries/angular/ng_query_visitor", ["require", "exports", "typescript", "@angular/core/schematics/utils/ng_decorators", "@angular/core/schematics/utils/typescript/class_declaration", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/directive_inputs", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NgQueryResolveVisitor = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const ng_decorators_1 = require("@angular/core/schematics/utils/ng_decorators");
    const class_declaration_1 = require("@angular/core/schematics/utils/typescript/class_declaration");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
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
                case typescript_1.default.SyntaxKind.PropertyDeclaration:
                    this.visitPropertyDeclaration(node);
                    break;
                case typescript_1.default.SyntaxKind.ClassDeclaration:
                    this.visitClassDeclaration(node);
                    break;
                case typescript_1.default.SyntaxKind.GetAccessor:
                case typescript_1.default.SyntaxKind.SetAccessor:
                    this.visitAccessorDeclaration(node);
                    break;
            }
            typescript_1.default.forEachChild(node, n => this.visitNode(n));
        }
        visitPropertyDeclaration(node) {
            this._recordQueryDeclaration(node, node, (0, property_name_1.getPropertyNameText)(node.name));
        }
        visitAccessorDeclaration(node) {
            this._recordQueryDeclaration(node, null, (0, property_name_1.getPropertyNameText)(node.name));
        }
        visitClassDeclaration(node) {
            this._recordClassInputSetters(node);
            this._recordClassInheritances(node);
        }
        _recordQueryDeclaration(node, property, queryName) {
            if (!node.decorators || !node.decorators.length) {
                return;
            }
            const ngDecorators = (0, ng_decorators_1.getAngularDecorators)(this.typeChecker, node.decorators);
            const queryDecorator = ngDecorators.find(({ name }) => name === 'ViewChild' || name === 'ContentChild');
            // Ensure that the current property declaration is defining a query.
            if (!queryDecorator) {
                return;
            }
            const queryContainer = (0, class_declaration_1.findParentClassDeclaration)(node);
            // If the query is not located within a class declaration, skip this node.
            if (!queryContainer) {
                return;
            }
            const sourceFile = node.getSourceFile();
            const newQueries = this.resolvedQueries.get(sourceFile) || [];
            this.resolvedQueries.set(sourceFile, newQueries.concat({
                name: queryName,
                type: queryDecorator.name === 'ViewChild' ? query_definition_1.QueryType.ViewChild : query_definition_1.QueryType.ContentChild,
                node,
                property,
                decorator: queryDecorator,
                container: queryContainer,
            }));
        }
        _recordClassInputSetters(node) {
            const resolvedInputNames = (0, directive_inputs_1.getInputNamesOfClass)(node, this.typeChecker);
            if (resolvedInputNames) {
                const classMetadata = this._getClassMetadata(node);
                classMetadata.ngInputNames = resolvedInputNames;
                this.classMetadata.set(node, classMetadata);
            }
        }
        _recordClassInheritances(node) {
            const baseTypes = (0, class_declaration_1.getBaseTypeIdentifiers)(node);
            if (!baseTypes || baseTypes.length !== 1) {
                return;
            }
            const superClass = baseTypes[0];
            const baseClassMetadata = this._getClassMetadata(node);
            // We need to resolve the value declaration through the resolved type as the base
            // class could be declared in different source files and the local symbol won't
            // contain a value declaration as the value is not declared locally.
            const symbol = this.typeChecker.getTypeAtLocation(superClass).getSymbol();
            if (symbol && symbol.valueDeclaration && typescript_1.default.isClassDeclaration(symbol.valueDeclaration)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfcXVlcnlfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFSCw0REFBNEI7SUFHNUIsZ0ZBQWtFO0lBQ2xFLG1HQUErRztJQUMvRywyRkFBNEU7SUFFNUUsa0hBQXdEO0lBQ3hELGtIQUFnRTtJQWtCaEU7Ozs7T0FJRztJQUNILE1BQWEscUJBQXFCO1FBT2hDLFlBQW1CLFdBQTJCO1lBQTNCLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQU45QywwQ0FBMEM7WUFDMUMsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBc0MsQ0FBQztZQUVoRSxzREFBc0Q7WUFDdEQsa0JBQWEsR0FBcUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVLLENBQUM7UUFFbEQsU0FBUyxDQUFDLElBQWE7WUFDckIsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUNqQixLQUFLLG9CQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFtQjtvQkFDcEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQThCLENBQUMsQ0FBQztvQkFDOUQsTUFBTTtnQkFDUixLQUFLLG9CQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtvQkFDakMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQTJCLENBQUMsQ0FBQztvQkFDeEQsTUFBTTtnQkFDUixLQUFLLG9CQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztnQkFDL0IsS0FBSyxvQkFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXO29CQUM1QixJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBOEIsQ0FBQyxDQUFDO29CQUM5RCxNQUFNO2FBQ1Q7WUFFRCxvQkFBRSxDQUFD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LHNEQXNIQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7UmVzb2x2ZWRUZW1wbGF0ZX0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7Z2V0QW5ndWxhckRlY29yYXRvcnN9IGZyb20gJy4uLy4uLy4uL3V0aWxzL25nX2RlY29yYXRvcnMnO1xuaW1wb3J0IHtmaW5kUGFyZW50Q2xhc3NEZWNsYXJhdGlvbiwgZ2V0QmFzZVR5cGVJZGVudGlmaWVyc30gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9jbGFzc19kZWNsYXJhdGlvbic7XG5pbXBvcnQge2dldFByb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5cbmltcG9ydCB7Z2V0SW5wdXROYW1lc09mQ2xhc3N9IGZyb20gJy4vZGlyZWN0aXZlX2lucHV0cyc7XG5pbXBvcnQge05nUXVlcnlEZWZpbml0aW9uLCBRdWVyeVR5cGV9IGZyb20gJy4vcXVlcnktZGVmaW5pdGlvbic7XG5cblxuLyoqIFJlc29sdmVkIG1ldGFkYXRhIG9mIGEgZ2l2ZW4gY2xhc3MuICovXG5leHBvcnQgaW50ZXJmYWNlIENsYXNzTWV0YWRhdGEge1xuICAvKiogTGlzdCBvZiBjbGFzcyBkZWNsYXJhdGlvbnMgdGhhdCBkZXJpdmUgZnJvbSB0aGUgZ2l2ZW4gY2xhc3MuICovXG4gIGRlcml2ZWRDbGFzc2VzOiB0cy5DbGFzc0RlY2xhcmF0aW9uW107XG4gIC8qKiBTdXBlciBjbGFzcyBvZiB0aGUgZ2l2ZW4gY2xhc3MuICovXG4gIHN1cGVyQ2xhc3M6IHRzLkNsYXNzRGVjbGFyYXRpb258bnVsbDtcbiAgLyoqIExpc3Qgb2YgcHJvcGVydHkgbmFtZXMgdGhhdCBkZWNsYXJlIGFuIEFuZ3VsYXIgaW5wdXQgd2l0aGluIHRoZSBnaXZlbiBjbGFzcy4gKi9cbiAgbmdJbnB1dE5hbWVzOiBzdHJpbmdbXTtcbiAgLyoqIENvbXBvbmVudCB0ZW1wbGF0ZSB0aGF0IGJlbG9uZ3MgdG8gdGhhdCBjbGFzcyBpZiBwcmVzZW50LiAqL1xuICB0ZW1wbGF0ZT86IFJlc29sdmVkVGVtcGxhdGU7XG59XG5cbi8qKiBUeXBlIHRoYXQgZGVzY3JpYmVzIGEgbWFwIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGdldCBhIGNsYXNzIGRlY2xhcmF0aW9uJ3MgbWV0YWRhdGEuICovXG5leHBvcnQgdHlwZSBDbGFzc01ldGFkYXRhTWFwID0gTWFwPHRzLkNsYXNzRGVjbGFyYXRpb24sIENsYXNzTWV0YWRhdGE+O1xuXG4vKipcbiAqIFZpc2l0b3IgdGhhdCBjYW4gYmUgdXNlZCB0byBkZXRlcm1pbmUgQW5ndWxhciBxdWVyaWVzIHdpdGhpbiBnaXZlbiBUeXBlU2NyaXB0IG5vZGVzLlxuICogQmVzaWRlcyByZXNvbHZpbmcgcXVlcmllcywgdGhlIHZpc2l0b3IgYWxzbyByZWNvcmRzIGNsYXNzIHJlbGF0aW9ucyBhbmQgc2VhcmNoZXMgZm9yXG4gKiBBbmd1bGFyIGlucHV0IHNldHRlcnMgd2hpY2ggY2FuIGJlIHVzZWQgdG8gYW5hbHl6ZSB0aGUgdGltaW5nIHVzYWdlIG9mIGEgZ2l2ZW4gcXVlcnkuXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1F1ZXJ5UmVzb2x2ZVZpc2l0b3Ige1xuICAvKiogUmVzb2x2ZWQgQW5ndWxhciBxdWVyeSBkZWZpbml0aW9ucy4gKi9cbiAgcmVzb2x2ZWRRdWVyaWVzID0gbmV3IE1hcDx0cy5Tb3VyY2VGaWxlLCBOZ1F1ZXJ5RGVmaW5pdGlvbltdPigpO1xuXG4gIC8qKiBNYXBzIGEgY2xhc3MgZGVjbGFyYXRpb24gdG8gaXRzIGNsYXNzIG1ldGFkYXRhLiAqL1xuICBjbGFzc01ldGFkYXRhOiBDbGFzc01ldGFkYXRhTWFwID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpIHt9XG5cbiAgdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlByb3BlcnR5RGVjbGFyYXRpb246XG4gICAgICAgIHRoaXMudmlzaXRQcm9wZXJ0eURlY2xhcmF0aW9uKG5vZGUgYXMgdHMuUHJvcGVydHlEZWNsYXJhdGlvbik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb246XG4gICAgICAgIHRoaXMudmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGUgYXMgdHMuQ2xhc3NEZWNsYXJhdGlvbik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLkdldEFjY2Vzc29yOlxuICAgICAgY2FzZSB0cy5TeW50YXhLaW5kLlNldEFjY2Vzc29yOlxuICAgICAgICB0aGlzLnZpc2l0QWNjZXNzb3JEZWNsYXJhdGlvbihub2RlIGFzIHRzLkFjY2Vzc29yRGVjbGFyYXRpb24pO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgbiA9PiB0aGlzLnZpc2l0Tm9kZShuKSk7XG4gIH1cblxuICBwcml2YXRlIHZpc2l0UHJvcGVydHlEZWNsYXJhdGlvbihub2RlOiB0cy5Qcm9wZXJ0eURlY2xhcmF0aW9uKSB7XG4gICAgdGhpcy5fcmVjb3JkUXVlcnlEZWNsYXJhdGlvbihub2RlLCBub2RlLCBnZXRQcm9wZXJ0eU5hbWVUZXh0KG5vZGUubmFtZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSB2aXNpdEFjY2Vzc29yRGVjbGFyYXRpb24obm9kZTogdHMuQWNjZXNzb3JEZWNsYXJhdGlvbikge1xuICAgIHRoaXMuX3JlY29yZFF1ZXJ5RGVjbGFyYXRpb24obm9kZSwgbnVsbCwgZ2V0UHJvcGVydHlOYW1lVGV4dChub2RlLm5hbWUpKTtcbiAgfVxuXG4gIHByaXZhdGUgdmlzaXRDbGFzc0RlY2xhcmF0aW9uKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICB0aGlzLl9yZWNvcmRDbGFzc0lucHV0U2V0dGVycyhub2RlKTtcbiAgICB0aGlzLl9yZWNvcmRDbGFzc0luaGVyaXRhbmNlcyhub2RlKTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlY29yZFF1ZXJ5RGVjbGFyYXRpb24oXG4gICAgICBub2RlOiB0cy5Ob2RlLCBwcm9wZXJ0eTogdHMuUHJvcGVydHlEZWNsYXJhdGlvbnxudWxsLCBxdWVyeU5hbWU6IHN0cmluZ3xudWxsKSB7XG4gICAgaWYgKCFub2RlLmRlY29yYXRvcnMgfHwgIW5vZGUuZGVjb3JhdG9ycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBuZ0RlY29yYXRvcnMgPSBnZXRBbmd1bGFyRGVjb3JhdG9ycyh0aGlzLnR5cGVDaGVja2VyLCBub2RlLmRlY29yYXRvcnMpO1xuICAgIGNvbnN0IHF1ZXJ5RGVjb3JhdG9yID1cbiAgICAgICAgbmdEZWNvcmF0b3JzLmZpbmQoKHtuYW1lfSkgPT4gbmFtZSA9PT0gJ1ZpZXdDaGlsZCcgfHwgbmFtZSA9PT0gJ0NvbnRlbnRDaGlsZCcpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGN1cnJlbnQgcHJvcGVydHkgZGVjbGFyYXRpb24gaXMgZGVmaW5pbmcgYSBxdWVyeS5cbiAgICBpZiAoIXF1ZXJ5RGVjb3JhdG9yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcXVlcnlDb250YWluZXIgPSBmaW5kUGFyZW50Q2xhc3NEZWNsYXJhdGlvbihub2RlKTtcblxuICAgIC8vIElmIHRoZSBxdWVyeSBpcyBub3QgbG9jYXRlZCB3aXRoaW4gYSBjbGFzcyBkZWNsYXJhdGlvbiwgc2tpcCB0aGlzIG5vZGUuXG4gICAgaWYgKCFxdWVyeUNvbnRhaW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcbiAgICBjb25zdCBuZXdRdWVyaWVzID0gdGhpcy5yZXNvbHZlZFF1ZXJpZXMuZ2V0KHNvdXJjZUZpbGUpIHx8IFtdO1xuXG4gICAgdGhpcy5yZXNvbHZlZFF1ZXJpZXMuc2V0KHNvdXJjZUZpbGUsIG5ld1F1ZXJpZXMuY29uY2F0KHtcbiAgICAgIG5hbWU6IHF1ZXJ5TmFtZSxcbiAgICAgIHR5cGU6IHF1ZXJ5RGVjb3JhdG9yLm5hbWUgPT09ICdWaWV3Q2hpbGQnID8gUXVlcnlUeXBlLlZpZXdDaGlsZCA6IFF1ZXJ5VHlwZS5Db250ZW50Q2hpbGQsXG4gICAgICBub2RlLFxuICAgICAgcHJvcGVydHksXG4gICAgICBkZWNvcmF0b3I6IHF1ZXJ5RGVjb3JhdG9yLFxuICAgICAgY29udGFpbmVyOiBxdWVyeUNvbnRhaW5lcixcbiAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIF9yZWNvcmRDbGFzc0lucHV0U2V0dGVycyhub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uKSB7XG4gICAgY29uc3QgcmVzb2x2ZWRJbnB1dE5hbWVzID0gZ2V0SW5wdXROYW1lc09mQ2xhc3Mobm9kZSwgdGhpcy50eXBlQ2hlY2tlcik7XG5cbiAgICBpZiAocmVzb2x2ZWRJbnB1dE5hbWVzKSB7XG4gICAgICBjb25zdCBjbGFzc01ldGFkYXRhID0gdGhpcy5fZ2V0Q2xhc3NNZXRhZGF0YShub2RlKTtcblxuICAgICAgY2xhc3NNZXRhZGF0YS5uZ0lucHV0TmFtZXMgPSByZXNvbHZlZElucHV0TmFtZXM7XG4gICAgICB0aGlzLmNsYXNzTWV0YWRhdGEuc2V0KG5vZGUsIGNsYXNzTWV0YWRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3JlY29yZENsYXNzSW5oZXJpdGFuY2VzKG5vZGU6IHRzLkNsYXNzRGVjbGFyYXRpb24pIHtcbiAgICBjb25zdCBiYXNlVHlwZXMgPSBnZXRCYXNlVHlwZUlkZW50aWZpZXJzKG5vZGUpO1xuXG4gICAgaWYgKCFiYXNlVHlwZXMgfHwgYmFzZVR5cGVzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHN1cGVyQ2xhc3MgPSBiYXNlVHlwZXNbMF07XG4gICAgY29uc3QgYmFzZUNsYXNzTWV0YWRhdGEgPSB0aGlzLl9nZXRDbGFzc01ldGFkYXRhKG5vZGUpO1xuXG4gICAgLy8gV2UgbmVlZCB0byByZXNvbHZlIHRoZSB2YWx1ZSBkZWNsYXJhdGlvbiB0aHJvdWdoIHRoZSByZXNvbHZlZCB0eXBlIGFzIHRoZSBiYXNlXG4gICAgLy8gY2xhc3MgY291bGQgYmUgZGVjbGFyZWQgaW4gZGlmZmVyZW50IHNvdXJjZSBmaWxlcyBhbmQgdGhlIGxvY2FsIHN5bWJvbCB3b24ndFxuICAgIC8vIGNvbnRhaW4gYSB2YWx1ZSBkZWNsYXJhdGlvbiBhcyB0aGUgdmFsdWUgaXMgbm90IGRlY2xhcmVkIGxvY2FsbHkuXG4gICAgY29uc3Qgc3ltYm9sID0gdGhpcy50eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihzdXBlckNsYXNzKS5nZXRTeW1ib2woKTtcblxuICAgIGlmIChzeW1ib2wgJiYgc3ltYm9sLnZhbHVlRGVjbGFyYXRpb24gJiYgdHMuaXNDbGFzc0RlY2xhcmF0aW9uKHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uKSkge1xuICAgICAgY29uc3QgZXh0ZW5kZWRDbGFzcyA9IHN5bWJvbC52YWx1ZURlY2xhcmF0aW9uO1xuICAgICAgY29uc3QgY2xhc3NNZXRhZGF0YUV4dGVuZGVkID0gdGhpcy5fZ2V0Q2xhc3NNZXRhZGF0YShleHRlbmRlZENsYXNzKTtcblxuICAgICAgLy8gUmVjb3JkIGFsbCBjbGFzc2VzIHRoYXQgZGVyaXZlIGZyb20gdGhlIGdpdmVuIGNsYXNzLiBUaGlzIG1ha2VzIGl0IGVhc3kgdG9cbiAgICAgIC8vIGRldGVybWluZSBhbGwgY2xhc3NlcyB0aGF0IGNvdWxkIHBvdGVudGlhbGx5IHVzZSBpbmhlcml0ZWQgcXVlcmllcyBzdGF0aWNhbGx5LlxuICAgICAgY2xhc3NNZXRhZGF0YUV4dGVuZGVkLmRlcml2ZWRDbGFzc2VzLnB1c2gobm9kZSk7XG4gICAgICB0aGlzLmNsYXNzTWV0YWRhdGEuc2V0KGV4dGVuZGVkQ2xhc3MsIGNsYXNzTWV0YWRhdGFFeHRlbmRlZCk7XG5cbiAgICAgIC8vIFJlY29yZCB0aGUgc3VwZXIgY2xhc3Mgb2YgdGhlIGN1cnJlbnQgY2xhc3MuXG4gICAgICBiYXNlQ2xhc3NNZXRhZGF0YS5zdXBlckNsYXNzID0gZXh0ZW5kZWRDbGFzcztcbiAgICAgIHRoaXMuY2xhc3NNZXRhZGF0YS5zZXQobm9kZSwgYmFzZUNsYXNzTWV0YWRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldENsYXNzTWV0YWRhdGEobm9kZTogdHMuQ2xhc3NEZWNsYXJhdGlvbik6IENsYXNzTWV0YWRhdGEge1xuICAgIHJldHVybiB0aGlzLmNsYXNzTWV0YWRhdGEuZ2V0KG5vZGUpIHx8IHtkZXJpdmVkQ2xhc3NlczogW10sIHN1cGVyQ2xhc3M6IG51bGwsIG5nSW5wdXROYW1lczogW119O1xuICB9XG59XG4iXX0=