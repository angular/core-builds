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
        define("@angular/core/schematics/migrations/static-queries/angular/super_class", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/functions", "@angular/core/schematics/utils/typescript/nodes", "@angular/core/schematics/utils/typescript/property_name"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const functions_1 = require("@angular/core/schematics/utils/typescript/functions");
    const nodes_1 = require("@angular/core/schematics/utils/typescript/nodes");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    /**
     * Updates the specified function context to map abstract super-class class members
     * to their implementation TypeScript nodes. This allows us to run the declaration visitor
     * for the super class with the context of the "baseClass" (e.g. with implemented abstract
     * class members)
     */
    function updateSuperClassAbstractMembersContext(baseClass, context, classMetadataMap) {
        getSuperClassDeclarations(baseClass, classMetadataMap).forEach(superClassDecl => {
            superClassDecl.members.forEach(superClassMember => {
                if (!superClassMember.name || !nodes_1.hasModifier(superClassMember, ts.SyntaxKind.AbstractKeyword)) {
                    return;
                }
                // Find the matching implementation of the abstract declaration from the super class.
                const baseClassImpl = baseClass.members.find(baseClassMethod => !!baseClassMethod.name &&
                    property_name_1.getPropertyNameText(baseClassMethod.name) ===
                        property_name_1.getPropertyNameText(superClassMember.name));
                if (!baseClassImpl || !functions_1.isFunctionLikeDeclaration(baseClassImpl) || !baseClassImpl.body) {
                    return;
                }
                if (!context.has(superClassMember)) {
                    context.set(superClassMember, baseClassImpl);
                }
            });
        });
    }
    exports.updateSuperClassAbstractMembersContext = updateSuperClassAbstractMembersContext;
    /** Gets all super-class TypeScript declarations for the given class. */
    function getSuperClassDeclarations(classDecl, classMetadataMap) {
        const declarations = [];
        let current = classMetadataMap.get(classDecl);
        while (current && current.superClass) {
            declarations.push(current.superClass);
            current = classMetadataMap.get(current.superClass);
        }
        return declarations;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwZXJfY2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9hbmd1bGFyL3N1cGVyX2NsYXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLG1GQUE4RTtJQUM5RSwyRUFBNEQ7SUFDNUQsMkZBQTRFO0lBTTVFOzs7OztPQUtHO0lBQ0gsU0FBZ0Isc0NBQXNDLENBQ2xELFNBQThCLEVBQUUsT0FBd0IsRUFBRSxnQkFBa0M7UUFDOUYseUJBQXlCLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQzlFLGNBQWMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQ2hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLElBQUksQ0FBQyxtQkFBVyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7b0JBQzNGLE9BQU87aUJBQ1I7Z0JBRUQscUZBQXFGO2dCQUNyRixNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FDeEMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUk7b0JBQ3JDLG1DQUFtQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7d0JBQ3JDLG1DQUFtQixDQUFDLGdCQUFnQixDQUFDLElBQU0sQ0FBQyxDQUFDLENBQUM7Z0JBRTFELElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxxQ0FBeUIsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUU7b0JBQ3RGLE9BQU87aUJBQ1I7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtvQkFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztpQkFDOUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXZCRCx3RkF1QkM7SUFFRCx3RUFBd0U7SUFDeEUsU0FBUyx5QkFBeUIsQ0FDOUIsU0FBOEIsRUFBRSxnQkFBa0M7UUFDcEUsTUFBTSxZQUFZLEdBQTBCLEVBQUUsQ0FBQztRQUUvQyxJQUFJLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUMsT0FBTyxPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRTtZQUNwQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN0QyxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNwRDtRQUVELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2lzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb259IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcbmltcG9ydCB7aGFzTW9kaWZpZXJ9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvbm9kZXMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuXG5pbXBvcnQge0Z1bmN0aW9uQ29udGV4dH0gZnJvbSAnLi9kZWNsYXJhdGlvbl91c2FnZV92aXNpdG9yJztcbmltcG9ydCB7Q2xhc3NNZXRhZGF0YU1hcH0gZnJvbSAnLi9uZ19xdWVyeV92aXNpdG9yJztcblxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHNwZWNpZmllZCBmdW5jdGlvbiBjb250ZXh0IHRvIG1hcCBhYnN0cmFjdCBzdXBlci1jbGFzcyBjbGFzcyBtZW1iZXJzXG4gKiB0byB0aGVpciBpbXBsZW1lbnRhdGlvbiBUeXBlU2NyaXB0IG5vZGVzLiBUaGlzIGFsbG93cyB1cyB0byBydW4gdGhlIGRlY2xhcmF0aW9uIHZpc2l0b3JcbiAqIGZvciB0aGUgc3VwZXIgY2xhc3Mgd2l0aCB0aGUgY29udGV4dCBvZiB0aGUgXCJiYXNlQ2xhc3NcIiAoZS5nLiB3aXRoIGltcGxlbWVudGVkIGFic3RyYWN0XG4gKiBjbGFzcyBtZW1iZXJzKVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3VwZXJDbGFzc0Fic3RyYWN0TWVtYmVyc0NvbnRleHQoXG4gICAgYmFzZUNsYXNzOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBjb250ZXh0OiBGdW5jdGlvbkNvbnRleHQsIGNsYXNzTWV0YWRhdGFNYXA6IENsYXNzTWV0YWRhdGFNYXApIHtcbiAgZ2V0U3VwZXJDbGFzc0RlY2xhcmF0aW9ucyhiYXNlQ2xhc3MsIGNsYXNzTWV0YWRhdGFNYXApLmZvckVhY2goc3VwZXJDbGFzc0RlY2wgPT4ge1xuICAgIHN1cGVyQ2xhc3NEZWNsLm1lbWJlcnMuZm9yRWFjaChzdXBlckNsYXNzTWVtYmVyID0+IHtcbiAgICAgIGlmICghc3VwZXJDbGFzc01lbWJlci5uYW1lIHx8ICFoYXNNb2RpZmllcihzdXBlckNsYXNzTWVtYmVyLCB0cy5TeW50YXhLaW5kLkFic3RyYWN0S2V5d29yZCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBGaW5kIHRoZSBtYXRjaGluZyBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYWJzdHJhY3QgZGVjbGFyYXRpb24gZnJvbSB0aGUgc3VwZXIgY2xhc3MuXG4gICAgICBjb25zdCBiYXNlQ2xhc3NJbXBsID0gYmFzZUNsYXNzLm1lbWJlcnMuZmluZChcbiAgICAgICAgICBiYXNlQ2xhc3NNZXRob2QgPT4gISFiYXNlQ2xhc3NNZXRob2QubmFtZSAmJlxuICAgICAgICAgICAgICBnZXRQcm9wZXJ0eU5hbWVUZXh0KGJhc2VDbGFzc01ldGhvZC5uYW1lKSA9PT1cbiAgICAgICAgICAgICAgICAgIGdldFByb3BlcnR5TmFtZVRleHQoc3VwZXJDbGFzc01lbWJlci5uYW1lICEpKTtcblxuICAgICAgaWYgKCFiYXNlQ2xhc3NJbXBsIHx8ICFpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKGJhc2VDbGFzc0ltcGwpIHx8ICFiYXNlQ2xhc3NJbXBsLmJvZHkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWNvbnRleHQuaGFzKHN1cGVyQ2xhc3NNZW1iZXIpKSB7XG4gICAgICAgIGNvbnRleHQuc2V0KHN1cGVyQ2xhc3NNZW1iZXIsIGJhc2VDbGFzc0ltcGwpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cblxuLyoqIEdldHMgYWxsIHN1cGVyLWNsYXNzIFR5cGVTY3JpcHQgZGVjbGFyYXRpb25zIGZvciB0aGUgZ2l2ZW4gY2xhc3MuICovXG5mdW5jdGlvbiBnZXRTdXBlckNsYXNzRGVjbGFyYXRpb25zKFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgY2xhc3NNZXRhZGF0YU1hcDogQ2xhc3NNZXRhZGF0YU1hcCkge1xuICBjb25zdCBkZWNsYXJhdGlvbnM6IHRzLkNsYXNzRGVjbGFyYXRpb25bXSA9IFtdO1xuXG4gIGxldCBjdXJyZW50ID0gY2xhc3NNZXRhZGF0YU1hcC5nZXQoY2xhc3NEZWNsKTtcbiAgd2hpbGUgKGN1cnJlbnQgJiYgY3VycmVudC5zdXBlckNsYXNzKSB7XG4gICAgZGVjbGFyYXRpb25zLnB1c2goY3VycmVudC5zdXBlckNsYXNzKTtcbiAgICBjdXJyZW50ID0gY2xhc3NNZXRhZGF0YU1hcC5nZXQoY3VycmVudC5zdXBlckNsYXNzKTtcbiAgfVxuXG4gIHJldHVybiBkZWNsYXJhdGlvbnM7XG59XG4iXX0=