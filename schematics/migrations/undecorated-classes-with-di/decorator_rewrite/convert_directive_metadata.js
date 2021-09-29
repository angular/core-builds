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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertDirectiveMetadataToExpression = exports.UnexpectedMetadataValueError = void 0;
    const ts = require("typescript");
    /** Error that will be thrown if an unexpected value needs to be converted. */
    class UnexpectedMetadataValueError extends Error {
    }
    exports.UnexpectedMetadataValueError = UnexpectedMetadataValueError;
    /**
     * Converts a directive metadata object into a TypeScript expression. Throws
     * if metadata cannot be cleanly converted.
     */
    function convertDirectiveMetadataToExpression(compilerModule, metadata, resolveSymbolImport, createImport, convertProperty) {
        if (typeof metadata === 'string') {
            return ts.createStringLiteral(metadata);
        }
        else if (Array.isArray(metadata)) {
            return ts.createArrayLiteral(metadata.map(el => convertDirectiveMetadataToExpression(compilerModule, el, resolveSymbolImport, createImport, convertProperty)));
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
            if (metadata instanceof compilerModule.StaticSymbol) {
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
                    propertyValue = convertDirectiveMetadataToExpression(compilerModule, metadataValue, resolveSymbolImport, createImport, convertProperty);
                }
                literalProperties.push(ts.createPropertyAssignment(getPropertyName(key), propertyValue));
            }
            return ts.createObjectLiteral(literalProperties, true);
        }
        throw new UnexpectedMetadataValueError();
    }
    exports.convertDirectiveMetadataToExpression = convertDirectiveMetadataToExpression;
    /**
     * Gets a valid property name from the given text. If the text cannot be used
     * as unquoted identifier, the name will be wrapped in a string literal.
     */
    function getPropertyName(name) {
        // Matches the most common identifiers that do not need quotes. Constructing a
        // regular expression that matches the ECMAScript specification in order to determine
        // whether quotes are needed is out of scope for this migration. For those more complex
        // property names, we just always use quotes (when constructing AST from metadata).
        if (/^[a-zA-Z_$]+$/.test(name)) {
            return name;
        }
        return ts.createStringLiteral(name);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydF9kaXJlY3RpdmVfbWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvZGVjb3JhdG9yX3Jld3JpdGUvY29udmVydF9kaXJlY3RpdmVfbWV0YWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBR0gsaUNBQWlDO0lBRWpDLDhFQUE4RTtJQUM5RSxNQUFhLDRCQUE2QixTQUFRLEtBQUs7S0FBRztJQUExRCxvRUFBMEQ7SUFFMUQ7OztPQUdHO0lBQ0gsU0FBZ0Isb0NBQW9DLENBQ2hELGNBQWtELEVBQUUsUUFBYSxFQUNqRSxtQkFBNEQsRUFDNUQsWUFBaUUsRUFDakUsZUFBbUU7UUFDckUsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7WUFDaEMsT0FBTyxFQUFFLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDekM7YUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEMsT0FBTyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDckMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxvQ0FBb0MsQ0FDdEMsY0FBYyxFQUFFLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ25GO2FBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7WUFDdkMsT0FBTyxFQUFFLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDckQ7YUFBTSxJQUFJLE9BQU8sUUFBUSxLQUFLLFNBQVMsRUFBRTtZQUN4QyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDdEQ7YUFBTSxJQUFJLE9BQU8sUUFBUSxLQUFLLFdBQVcsRUFBRTtZQUMxQyxPQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUN6QzthQUFNLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1lBQ3ZDLE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQ3BEO2FBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7WUFDdkMsK0VBQStFO1lBQy9FLCtFQUErRTtZQUMvRSw4RUFBOEU7WUFDOUUsSUFBSSxRQUFRLFlBQVksY0FBYyxDQUFDLFlBQVksRUFBRTtnQkFDbkQsTUFBTSxjQUFjLEdBQUcsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3JELElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtvQkFDM0IsTUFBTSxJQUFJLDRCQUE0QixFQUFFLENBQUM7aUJBQzFDO2dCQUNELE9BQU8sWUFBWSxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEQ7WUFFRCxNQUFNLGlCQUFpQixHQUE0QixFQUFFLENBQUM7WUFFdEQsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN2QyxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BDLElBQUksYUFBYSxHQUF1QixJQUFJLENBQUM7Z0JBRTdDLGtGQUFrRjtnQkFDbEYscUZBQXFGO2dCQUNyRixpRkFBaUY7Z0JBQ2pGLElBQUksZUFBZSxFQUFFO29CQUNuQixhQUFhLEdBQUcsZUFBZSxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztpQkFDckQ7Z0JBRUQsZ0ZBQWdGO2dCQUNoRiw0REFBNEQ7Z0JBQzVELElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtvQkFDMUIsYUFBYSxHQUFHLG9DQUFvQyxDQUNoRCxjQUFjLEVBQUUsYUFBYSxFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztpQkFDeEY7Z0JBRUQsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQzthQUMxRjtZQUVELE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3hEO1FBRUQsTUFBTSxJQUFJLDRCQUE0QixFQUFFLENBQUM7SUFDM0MsQ0FBQztJQTFERCxvRkEwREM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLGVBQWUsQ0FBQyxJQUFZO1FBQ25DLDhFQUE4RTtRQUM5RSxxRkFBcUY7UUFDckYsdUZBQXVGO1FBQ3ZGLG1GQUFtRjtRQUNuRixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDOUIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUge1N0YXRpY1N5bWJvbH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbi8qKiBFcnJvciB0aGF0IHdpbGwgYmUgdGhyb3duIGlmIGFuIHVuZXhwZWN0ZWQgdmFsdWUgbmVlZHMgdG8gYmUgY29udmVydGVkLiAqL1xuZXhwb3J0IGNsYXNzIFVuZXhwZWN0ZWRNZXRhZGF0YVZhbHVlRXJyb3IgZXh0ZW5kcyBFcnJvciB7fVxuXG4vKipcbiAqIENvbnZlcnRzIGEgZGlyZWN0aXZlIG1ldGFkYXRhIG9iamVjdCBpbnRvIGEgVHlwZVNjcmlwdCBleHByZXNzaW9uLiBUaHJvd3NcbiAqIGlmIG1ldGFkYXRhIGNhbm5vdCBiZSBjbGVhbmx5IGNvbnZlcnRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnREaXJlY3RpdmVNZXRhZGF0YVRvRXhwcmVzc2lvbihcbiAgICBjb21waWxlck1vZHVsZTogdHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvY29tcGlsZXInKSwgbWV0YWRhdGE6IGFueSxcbiAgICByZXNvbHZlU3ltYm9sSW1wb3J0OiAoc3ltYm9sOiBTdGF0aWNTeW1ib2wpID0+IHN0cmluZyB8IG51bGwsXG4gICAgY3JlYXRlSW1wb3J0OiAobW9kdWxlTmFtZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpID0+IHRzLkV4cHJlc3Npb24sXG4gICAgY29udmVydFByb3BlcnR5PzogKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB0cy5FeHByZXNzaW9uIHwgbnVsbCk6IHRzLkV4cHJlc3Npb24ge1xuICBpZiAodHlwZW9mIG1ldGFkYXRhID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0cy5jcmVhdGVTdHJpbmdMaXRlcmFsKG1ldGFkYXRhKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG1ldGFkYXRhKSkge1xuICAgIHJldHVybiB0cy5jcmVhdGVBcnJheUxpdGVyYWwobWV0YWRhdGEubWFwKFxuICAgICAgICBlbCA9PiBjb252ZXJ0RGlyZWN0aXZlTWV0YWRhdGFUb0V4cHJlc3Npb24oXG4gICAgICAgICAgICBjb21waWxlck1vZHVsZSwgZWwsIHJlc29sdmVTeW1ib2xJbXBvcnQsIGNyZWF0ZUltcG9ydCwgY29udmVydFByb3BlcnR5KSkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRhZGF0YSA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdHMuY3JlYXRlTnVtZXJpY0xpdGVyYWwobWV0YWRhdGEudG9TdHJpbmcoKSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1ldGFkYXRhID09PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4gbWV0YWRhdGEgPyB0cy5jcmVhdGVUcnVlKCkgOiB0cy5jcmVhdGVGYWxzZSgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRhZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gdHMuY3JlYXRlSWRlbnRpZmllcigndW5kZWZpbmVkJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1ldGFkYXRhID09PSAnYmlnaW50Jykge1xuICAgIHJldHVybiB0cy5jcmVhdGVCaWdJbnRMaXRlcmFsKG1ldGFkYXRhLnRvU3RyaW5nKCkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRhZGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIGEgc3RhdGljIHN5bWJvbCBvYmplY3QgcGFydCBvZiB0aGUgbWV0YWRhdGEsIHRyeSB0byByZXNvbHZlXG4gICAgLy8gdGhlIGltcG9ydCBleHByZXNzaW9uIG9mIHRoZSBzeW1ib2wuIElmIG5vIGltcG9ydCBwYXRoIGNvdWxkIGJlIHJlc29sdmVkLCBhblxuICAgIC8vIGVycm9yIHdpbGwgYmUgdGhyb3duIGFzIHRoZSBzeW1ib2wgY2Fubm90IGJlIGNvbnZlcnRlZCBpbnRvIFR5cGVTY3JpcHQgQVNULlxuICAgIGlmIChtZXRhZGF0YSBpbnN0YW5jZW9mIGNvbXBpbGVyTW9kdWxlLlN0YXRpY1N5bWJvbCkge1xuICAgICAgY29uc3QgcmVzb2x2ZWRJbXBvcnQgPSByZXNvbHZlU3ltYm9sSW1wb3J0KG1ldGFkYXRhKTtcbiAgICAgIGlmIChyZXNvbHZlZEltcG9ydCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvcigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNyZWF0ZUltcG9ydChyZXNvbHZlZEltcG9ydCwgbWV0YWRhdGEubmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgbGl0ZXJhbFByb3BlcnRpZXM6IHRzLlByb3BlcnR5QXNzaWdubWVudFtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhtZXRhZGF0YSkpIHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhVmFsdWUgPSBtZXRhZGF0YVtrZXldO1xuICAgICAgbGV0IHByb3BlcnR5VmFsdWU6IHRzLkV4cHJlc3Npb258bnVsbCA9IG51bGw7XG5cbiAgICAgIC8vIEFsbG93cyBjdXN0b20gY29udmVyc2lvbiBvZiBwcm9wZXJ0aWVzIGluIGFuIG9iamVjdC4gVGhpcyBpcyB1c2VmdWwgZm9yIHNwZWNpYWxcbiAgICAgIC8vIGNhc2VzIHdoZXJlIHdlIGRvbid0IHdhbnQgdG8gc3RvcmUgdGhlIGVudW0gdmFsdWVzIGFzIGludGVnZXJzLCBidXQgcmF0aGVyIHVzZSB0aGVcbiAgICAgIC8vIHJlYWwgZW51bSBzeW1ib2wuIGUuZy4gaW5zdGVhZCBvZiBgMmAgd2Ugd2FudCB0byB1c2UgYFZpZXdFbmNhcHN1bGF0aW9uLk5vbmVgLlxuICAgICAgaWYgKGNvbnZlcnRQcm9wZXJ0eSkge1xuICAgICAgICBwcm9wZXJ0eVZhbHVlID0gY29udmVydFByb3BlcnR5KGtleSwgbWV0YWRhdGFWYWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluIGNhc2UgdGhlIHByb3BlcnR5IHZhbHVlIGhhcyBub3QgYmVlbiBhc3NpZ25lZCB0byBhbiBleHByZXNzaW9uLCB3ZSBjb252ZXJ0XG4gICAgICAvLyB0aGUgcmVzb2x2ZWQgbWV0YWRhdGEgdmFsdWUgaW50byBhIFR5cGVTY3JpcHQgZXhwcmVzc2lvbi5cbiAgICAgIGlmIChwcm9wZXJ0eVZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHByb3BlcnR5VmFsdWUgPSBjb252ZXJ0RGlyZWN0aXZlTWV0YWRhdGFUb0V4cHJlc3Npb24oXG4gICAgICAgICAgICBjb21waWxlck1vZHVsZSwgbWV0YWRhdGFWYWx1ZSwgcmVzb2x2ZVN5bWJvbEltcG9ydCwgY3JlYXRlSW1wb3J0LCBjb252ZXJ0UHJvcGVydHkpO1xuICAgICAgfVxuXG4gICAgICBsaXRlcmFsUHJvcGVydGllcy5wdXNoKHRzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChnZXRQcm9wZXJ0eU5hbWUoa2V5KSwgcHJvcGVydHlWYWx1ZSkpO1xuICAgIH1cblxuICAgIHJldHVybiB0cy5jcmVhdGVPYmplY3RMaXRlcmFsKGxpdGVyYWxQcm9wZXJ0aWVzLCB0cnVlKTtcbiAgfVxuXG4gIHRocm93IG5ldyBVbmV4cGVjdGVkTWV0YWRhdGFWYWx1ZUVycm9yKCk7XG59XG5cbi8qKlxuICogR2V0cyBhIHZhbGlkIHByb3BlcnR5IG5hbWUgZnJvbSB0aGUgZ2l2ZW4gdGV4dC4gSWYgdGhlIHRleHQgY2Fubm90IGJlIHVzZWRcbiAqIGFzIHVucXVvdGVkIGlkZW50aWZpZXIsIHRoZSBuYW1lIHdpbGwgYmUgd3JhcHBlZCBpbiBhIHN0cmluZyBsaXRlcmFsLlxuICovXG5mdW5jdGlvbiBnZXRQcm9wZXJ0eU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nfHRzLlN0cmluZ0xpdGVyYWwge1xuICAvLyBNYXRjaGVzIHRoZSBtb3N0IGNvbW1vbiBpZGVudGlmaWVycyB0aGF0IGRvIG5vdCBuZWVkIHF1b3Rlcy4gQ29uc3RydWN0aW5nIGFcbiAgLy8gcmVndWxhciBleHByZXNzaW9uIHRoYXQgbWF0Y2hlcyB0aGUgRUNNQVNjcmlwdCBzcGVjaWZpY2F0aW9uIGluIG9yZGVyIHRvIGRldGVybWluZVxuICAvLyB3aGV0aGVyIHF1b3RlcyBhcmUgbmVlZGVkIGlzIG91dCBvZiBzY29wZSBmb3IgdGhpcyBtaWdyYXRpb24uIEZvciB0aG9zZSBtb3JlIGNvbXBsZXhcbiAgLy8gcHJvcGVydHkgbmFtZXMsIHdlIGp1c3QgYWx3YXlzIHVzZSBxdW90ZXMgKHdoZW4gY29uc3RydWN0aW5nIEFTVCBmcm9tIG1ldGFkYXRhKS5cbiAgaWYgKC9eW2EtekEtWl8kXSskLy50ZXN0KG5hbWUpKSB7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cbiAgcmV0dXJuIHRzLmNyZWF0ZVN0cmluZ0xpdGVyYWwobmFtZSk7XG59XG4iXX0=