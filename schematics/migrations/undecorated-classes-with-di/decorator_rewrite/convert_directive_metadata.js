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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata", ["require", "exports", "@angular/compiler", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const compiler_1 = require("@angular/compiler");
    const ts = require("typescript");
    /**
     * Converts a directive metadata object into a TypeScript expression. Throws
     * if metadata cannot be cleanly converted.
     */
    function convertDirectiveMetadataToExpression(metadata, resolveSymbolImport, createImport, convertProperty) {
        if (typeof metadata === 'string') {
            return ts.createStringLiteral(metadata);
        }
        else if (Array.isArray(metadata)) {
            return ts.createArrayLiteral(metadata.map(el => convertDirectiveMetadataToExpression(el, resolveSymbolImport, createImport, convertProperty)));
        }
        else if (typeof metadata === 'number') {
            return ts.createNumericLiteral(metadata.toString());
        }
        else if (typeof metadata === 'boolean') {
            return metadata ? ts.createTrue() : ts.createFalse();
        }
        else if (typeof metadata === 'undefined') {
            return ts.createIdentifier('undefined');
        }
        else if (typeof metadata === 'bigint') {
            return ts.createBigIntLiteral(metadata.toString());
        }
        else if (typeof metadata === 'object') {
            // In case there is a static symbol object part of the metadata, try to resolve
            // the import expression of the symbol. If no import path could be resolved, an
            // error will be thrown as the symbol cannot be converted into TypeScript AST.
            if (metadata instanceof compiler_1.StaticSymbol) {
                const resolvedImport = resolveSymbolImport(metadata);
                if (resolvedImport === null) {
                    throw new UnexpectedMetadataValueError();
                }
                return createImport(resolvedImport, metadata.name);
            }
            const literalProperties = [];
            for (const key of Object.keys(metadata)) {
                const metadataValue = metadata[key];
                let propertyValue = null;
                // Allows custom conversion of properties in an object. This is useful for special
                // cases where we don't want to store the enum values as integers, but rather use the
                // real enum symbol. e.g. instead of `2` we want to use `ViewEncapsulation.None`.
                if (convertProperty) {
                    propertyValue = convertProperty(key, metadataValue);
                }
                // In case the property value has not been assigned to an expression, we convert
                // the resolved metadata value into a TypeScript expression.
                if (propertyValue === null) {
                    propertyValue = convertDirectiveMetadataToExpression(metadataValue, resolveSymbolImport, createImport, convertProperty);
                }
                literalProperties.push(ts.createPropertyAssignment(key, propertyValue));
            }
            return ts.createObjectLiteral(literalProperties, true);
        }
        throw new UnexpectedMetadataValueError();
    }
    exports.convertDirectiveMetadataToExpression = convertDirectiveMetadataToExpression;
    /** Error that will be thrown if a unexpected value needs to be converted. */
    class UnexpectedMetadataValueError extends Error {
    }
    exports.UnexpectedMetadataValueError = UnexpectedMetadataValueError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydF9kaXJlY3RpdmVfbWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvZGVjb3JhdG9yX3Jld3JpdGUvY29udmVydF9kaXJlY3RpdmVfbWV0YWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxnREFBK0M7SUFDL0MsaUNBQWlDO0lBRWpDOzs7T0FHRztJQUNILFNBQWdCLG9DQUFvQyxDQUNoRCxRQUFhLEVBQUUsbUJBQTRELEVBQzNFLFlBQWlFLEVBQ2pFLGVBQW1FO1FBQ3JFLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1lBQ2hDLE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3pDO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xDLE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQ3JDLEVBQUUsQ0FBQyxFQUFFLENBQUMsb0NBQW9DLENBQ3RDLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ25FO2FBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7WUFDdkMsT0FBTyxFQUFFLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDckQ7YUFBTSxJQUFJLE9BQU8sUUFBUSxLQUFLLFNBQVMsRUFBRTtZQUN4QyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDdEQ7YUFBTSxJQUFJLE9BQU8sUUFBUSxLQUFLLFdBQVcsRUFBRTtZQUMxQyxPQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUN6QzthQUFNLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1lBQ3ZDLE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQ3BEO2FBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7WUFDdkMsK0VBQStFO1lBQy9FLCtFQUErRTtZQUMvRSw4RUFBOEU7WUFDOUUsSUFBSSxRQUFRLFlBQVksdUJBQVksRUFBRTtnQkFDcEMsTUFBTSxjQUFjLEdBQUcsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3JELElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtvQkFDM0IsTUFBTSxJQUFJLDRCQUE0QixFQUFFLENBQUM7aUJBQzFDO2dCQUNELE9BQU8sWUFBWSxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEQ7WUFFRCxNQUFNLGlCQUFpQixHQUE0QixFQUFFLENBQUM7WUFFdEQsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN2QyxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BDLElBQUksYUFBYSxHQUF1QixJQUFJLENBQUM7Z0JBRTdDLGtGQUFrRjtnQkFDbEYscUZBQXFGO2dCQUNyRixpRkFBaUY7Z0JBQ2pGLElBQUksZUFBZSxFQUFFO29CQUNuQixhQUFhLEdBQUcsZUFBZSxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztpQkFDckQ7Z0JBRUQsZ0ZBQWdGO2dCQUNoRiw0REFBNEQ7Z0JBQzVELElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtvQkFDMUIsYUFBYSxHQUFHLG9DQUFvQyxDQUNoRCxhQUFhLEVBQUUsbUJBQW1CLEVBQUUsWUFBWSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2lCQUN4RTtnQkFFRCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO2FBQ3pFO1lBRUQsT0FBTyxFQUFFLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDeEQ7UUFFRCxNQUFNLElBQUksNEJBQTRCLEVBQUUsQ0FBQztJQUMzQyxDQUFDO0lBekRELG9GQXlEQztJQUVELDZFQUE2RTtJQUM3RSxNQUFhLDRCQUE2QixTQUFRLEtBQUs7S0FBRztJQUExRCxvRUFBMEQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3RhdGljU3ltYm9sfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqXG4gKiBDb252ZXJ0cyBhIGRpcmVjdGl2ZSBtZXRhZGF0YSBvYmplY3QgaW50byBhIFR5cGVTY3JpcHQgZXhwcmVzc2lvbi4gVGhyb3dzXG4gKiBpZiBtZXRhZGF0YSBjYW5ub3QgYmUgY2xlYW5seSBjb252ZXJ0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0RGlyZWN0aXZlTWV0YWRhdGFUb0V4cHJlc3Npb24oXG4gICAgbWV0YWRhdGE6IGFueSwgcmVzb2x2ZVN5bWJvbEltcG9ydDogKHN5bWJvbDogU3RhdGljU3ltYm9sKSA9PiBzdHJpbmcgfCBudWxsLFxuICAgIGNyZWF0ZUltcG9ydDogKG1vZHVsZU5hbWU6IHN0cmluZywgbmFtZTogc3RyaW5nKSA9PiB0cy5FeHByZXNzaW9uLFxuICAgIGNvbnZlcnRQcm9wZXJ0eT86IChrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdHMuRXhwcmVzc2lvbiB8IG51bGwpOiB0cy5FeHByZXNzaW9uIHtcbiAgaWYgKHR5cGVvZiBtZXRhZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdHMuY3JlYXRlU3RyaW5nTGl0ZXJhbChtZXRhZGF0YSk7XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShtZXRhZGF0YSkpIHtcbiAgICByZXR1cm4gdHMuY3JlYXRlQXJyYXlMaXRlcmFsKG1ldGFkYXRhLm1hcChcbiAgICAgICAgZWwgPT4gY29udmVydERpcmVjdGl2ZU1ldGFkYXRhVG9FeHByZXNzaW9uKFxuICAgICAgICAgICAgZWwsIHJlc29sdmVTeW1ib2xJbXBvcnQsIGNyZWF0ZUltcG9ydCwgY29udmVydFByb3BlcnR5KSkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRhZGF0YSA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdHMuY3JlYXRlTnVtZXJpY0xpdGVyYWwobWV0YWRhdGEudG9TdHJpbmcoKSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1ldGFkYXRhID09PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4gbWV0YWRhdGEgPyB0cy5jcmVhdGVUcnVlKCkgOiB0cy5jcmVhdGVGYWxzZSgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRhZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gdHMuY3JlYXRlSWRlbnRpZmllcigndW5kZWZpbmVkJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1ldGFkYXRhID09PSAnYmlnaW50Jykge1xuICAgIHJldHVybiB0cy5jcmVhdGVCaWdJbnRMaXRlcmFsKG1ldGFkYXRhLnRvU3RyaW5nKCkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRhZGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIGEgc3RhdGljIHN5bWJvbCBvYmplY3QgcGFydCBvZiB0aGUgbWV0YWRhdGEsIHRyeSB0byByZXNvbHZlXG4gICAgLy8gdGhlIGltcG9ydCBleHByZXNzaW9uIG9mIHRoZSBzeW1ib2wuIElmIG5vIGltcG9ydCBwYXRoIGNvdWxkIGJlIHJlc29sdmVkLCBhblxuICAgIC8vIGVycm9yIHdpbGwgYmUgdGhyb3duIGFzIHRoZSBzeW1ib2wgY2Fubm90IGJlIGNvbnZlcnRlZCBpbnRvIFR5cGVTY3JpcHQgQVNULlxuICAgIGlmIChtZXRhZGF0YSBpbnN0YW5jZW9mIFN0YXRpY1N5bWJvbCkge1xuICAgICAgY29uc3QgcmVzb2x2ZWRJbXBvcnQgPSByZXNvbHZlU3ltYm9sSW1wb3J0KG1ldGFkYXRhKTtcbiAgICAgIGlmIChyZXNvbHZlZEltcG9ydCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvcigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNyZWF0ZUltcG9ydChyZXNvbHZlZEltcG9ydCwgbWV0YWRhdGEubmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgbGl0ZXJhbFByb3BlcnRpZXM6IHRzLlByb3BlcnR5QXNzaWdubWVudFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhtZXRhZGF0YSkpIHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhVmFsdWUgPSBtZXRhZGF0YVtrZXldO1xuICAgICAgbGV0IHByb3BlcnR5VmFsdWU6IHRzLkV4cHJlc3Npb258bnVsbCA9IG51bGw7XG5cbiAgICAgIC8vIEFsbG93cyBjdXN0b20gY29udmVyc2lvbiBvZiBwcm9wZXJ0aWVzIGluIGFuIG9iamVjdC4gVGhpcyBpcyB1c2VmdWwgZm9yIHNwZWNpYWxcbiAgICAgIC8vIGNhc2VzIHdoZXJlIHdlIGRvbid0IHdhbnQgdG8gc3RvcmUgdGhlIGVudW0gdmFsdWVzIGFzIGludGVnZXJzLCBidXQgcmF0aGVyIHVzZSB0aGVcbiAgICAgIC8vIHJlYWwgZW51bSBzeW1ib2wuIGUuZy4gaW5zdGVhZCBvZiBgMmAgd2Ugd2FudCB0byB1c2UgYFZpZXdFbmNhcHN1bGF0aW9uLk5vbmVgLlxuICAgICAgaWYgKGNvbnZlcnRQcm9wZXJ0eSkge1xuICAgICAgICBwcm9wZXJ0eVZhbHVlID0gY29udmVydFByb3BlcnR5KGtleSwgbWV0YWRhdGFWYWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluIGNhc2UgdGhlIHByb3BlcnR5IHZhbHVlIGhhcyBub3QgYmVlbiBhc3NpZ25lZCB0byBhbiBleHByZXNzaW9uLCB3ZSBjb252ZXJ0XG4gICAgICAvLyB0aGUgcmVzb2x2ZWQgbWV0YWRhdGEgdmFsdWUgaW50byBhIFR5cGVTY3JpcHQgZXhwcmVzc2lvbi5cbiAgICAgIGlmIChwcm9wZXJ0eVZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHByb3BlcnR5VmFsdWUgPSBjb252ZXJ0RGlyZWN0aXZlTWV0YWRhdGFUb0V4cHJlc3Npb24oXG4gICAgICAgICAgICBtZXRhZGF0YVZhbHVlLCByZXNvbHZlU3ltYm9sSW1wb3J0LCBjcmVhdGVJbXBvcnQsIGNvbnZlcnRQcm9wZXJ0eSk7XG4gICAgICB9XG5cbiAgICAgIGxpdGVyYWxQcm9wZXJ0aWVzLnB1c2godHMuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KGtleSwgcHJvcGVydHlWYWx1ZSkpO1xuICAgIH1cblxuICAgIHJldHVybiB0cy5jcmVhdGVPYmplY3RMaXRlcmFsKGxpdGVyYWxQcm9wZXJ0aWVzLCB0cnVlKTtcbiAgfVxuXG4gIHRocm93IG5ldyBVbmV4cGVjdGVkTWV0YWRhdGFWYWx1ZUVycm9yKCk7XG59XG5cbi8qKiBFcnJvciB0aGF0IHdpbGwgYmUgdGhyb3duIGlmIGEgdW5leHBlY3RlZCB2YWx1ZSBuZWVkcyB0byBiZSBjb252ZXJ0ZWQuICovXG5leHBvcnQgY2xhc3MgVW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvciBleHRlbmRzIEVycm9yIHt9XG4iXX0=