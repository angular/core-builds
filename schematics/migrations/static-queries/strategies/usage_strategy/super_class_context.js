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
        define("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/super_class_context", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/functions", "@angular/core/schematics/utils/typescript/nodes", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/super_class"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updateSuperClassAbstractMembersContext = void 0;
    const ts = require("typescript");
    const functions_1 = require("@angular/core/schematics/utils/typescript/functions");
    const nodes_1 = require("@angular/core/schematics/utils/typescript/nodes");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    const super_class_1 = require("@angular/core/schematics/migrations/static-queries/angular/super_class");
    /**
     * Updates the specified function context to map abstract super-class class members
     * to their implementation TypeScript nodes. This allows us to run the declaration visitor
     * for the super class with the context of the "baseClass" (e.g. with implemented abstract
     * class members)
     */
    function updateSuperClassAbstractMembersContext(baseClass, context, classMetadataMap) {
        super_class_1.getSuperClassDeclarations(baseClass, classMetadataMap).forEach(superClassDecl => {
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwZXJfY2xhc3NfY29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvc3VwZXJfY2xhc3NfY29udGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFFakMsbUZBQWlGO0lBQ2pGLDJFQUErRDtJQUMvRCwyRkFBK0U7SUFFL0Usd0dBQW9FO0lBS3BFOzs7OztPQUtHO0lBQ0gsU0FBZ0Isc0NBQXNDLENBQ2xELFNBQThCLEVBQUUsT0FBd0IsRUFBRSxnQkFBa0M7UUFDOUYsdUNBQXlCLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQzlFLGNBQWMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQ2hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLElBQUksQ0FBQyxtQkFBVyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEVBQUU7b0JBQzNGLE9BQU87aUJBQ1I7Z0JBRUQscUZBQXFGO2dCQUNyRixNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FDeEMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUk7b0JBQ3JDLG1DQUFtQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7d0JBQ3JDLG1DQUFtQixDQUFDLGdCQUFnQixDQUFDLElBQUssQ0FBQyxDQUFDLENBQUM7Z0JBRXpELElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxxQ0FBeUIsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUU7b0JBQ3RGLE9BQU87aUJBQ1I7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtvQkFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztpQkFDOUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQXZCRCx3RkF1QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2lzRnVuY3Rpb25MaWtlRGVjbGFyYXRpb259IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcbmltcG9ydCB7aGFzTW9kaWZpZXJ9IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvbm9kZXMnO1xuaW1wb3J0IHtnZXRQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuaW1wb3J0IHtDbGFzc01ldGFkYXRhTWFwfSBmcm9tICcuLi8uLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtnZXRTdXBlckNsYXNzRGVjbGFyYXRpb25zfSBmcm9tICcuLi8uLi9hbmd1bGFyL3N1cGVyX2NsYXNzJztcblxuaW1wb3J0IHtGdW5jdGlvbkNvbnRleHR9IGZyb20gJy4vZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvcic7XG5cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb24gY29udGV4dCB0byBtYXAgYWJzdHJhY3Qgc3VwZXItY2xhc3MgY2xhc3MgbWVtYmVyc1xuICogdG8gdGhlaXIgaW1wbGVtZW50YXRpb24gVHlwZVNjcmlwdCBub2Rlcy4gVGhpcyBhbGxvd3MgdXMgdG8gcnVuIHRoZSBkZWNsYXJhdGlvbiB2aXNpdG9yXG4gKiBmb3IgdGhlIHN1cGVyIGNsYXNzIHdpdGggdGhlIGNvbnRleHQgb2YgdGhlIFwiYmFzZUNsYXNzXCIgKGUuZy4gd2l0aCBpbXBsZW1lbnRlZCBhYnN0cmFjdFxuICogY2xhc3MgbWVtYmVycylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN1cGVyQ2xhc3NBYnN0cmFjdE1lbWJlcnNDb250ZXh0KFxuICAgIGJhc2VDbGFzczogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgY29udGV4dDogRnVuY3Rpb25Db250ZXh0LCBjbGFzc01ldGFkYXRhTWFwOiBDbGFzc01ldGFkYXRhTWFwKSB7XG4gIGdldFN1cGVyQ2xhc3NEZWNsYXJhdGlvbnMoYmFzZUNsYXNzLCBjbGFzc01ldGFkYXRhTWFwKS5mb3JFYWNoKHN1cGVyQ2xhc3NEZWNsID0+IHtcbiAgICBzdXBlckNsYXNzRGVjbC5tZW1iZXJzLmZvckVhY2goc3VwZXJDbGFzc01lbWJlciA9PiB7XG4gICAgICBpZiAoIXN1cGVyQ2xhc3NNZW1iZXIubmFtZSB8fCAhaGFzTW9kaWZpZXIoc3VwZXJDbGFzc01lbWJlciwgdHMuU3ludGF4S2luZC5BYnN0cmFjdEtleXdvcmQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gRmluZCB0aGUgbWF0Y2hpbmcgaW1wbGVtZW50YXRpb24gb2YgdGhlIGFic3RyYWN0IGRlY2xhcmF0aW9uIGZyb20gdGhlIHN1cGVyIGNsYXNzLlxuICAgICAgY29uc3QgYmFzZUNsYXNzSW1wbCA9IGJhc2VDbGFzcy5tZW1iZXJzLmZpbmQoXG4gICAgICAgICAgYmFzZUNsYXNzTWV0aG9kID0+ICEhYmFzZUNsYXNzTWV0aG9kLm5hbWUgJiZcbiAgICAgICAgICAgICAgZ2V0UHJvcGVydHlOYW1lVGV4dChiYXNlQ2xhc3NNZXRob2QubmFtZSkgPT09XG4gICAgICAgICAgICAgICAgICBnZXRQcm9wZXJ0eU5hbWVUZXh0KHN1cGVyQ2xhc3NNZW1iZXIubmFtZSEpKTtcblxuICAgICAgaWYgKCFiYXNlQ2xhc3NJbXBsIHx8ICFpc0Z1bmN0aW9uTGlrZURlY2xhcmF0aW9uKGJhc2VDbGFzc0ltcGwpIHx8ICFiYXNlQ2xhc3NJbXBsLmJvZHkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWNvbnRleHQuaGFzKHN1cGVyQ2xhc3NNZW1iZXIpKSB7XG4gICAgICAgIGNvbnRleHQuc2V0KHN1cGVyQ2xhc3NNZW1iZXIsIGJhc2VDbGFzc0ltcGwpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cbiJdfQ==