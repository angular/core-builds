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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/convert_directive_metadata", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertDirectiveMetadataToExpression = exports.UnexpectedMetadataValueError = void 0;
    const typescript_1 = __importDefault(require("typescript"));
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
            return typescript_1.default.createStringLiteral(metadata);
        }
        else if (Array.isArray(metadata)) {
            return typescript_1.default.createArrayLiteral(metadata.map(el => convertDirectiveMetadataToExpression(compilerModule, el, resolveSymbolImport, createImport, convertProperty)));
        }
        else if (typeof metadata === 'number') {
            return typescript_1.default.createNumericLiteral(metadata.toString());
        }
        else if (typeof metadata === 'boolean') {
            return metadata ? typescript_1.default.createTrue() : typescript_1.default.createFalse();
        }
        else if (typeof metadata === 'undefined') {
            return typescript_1.default.createIdentifier('undefined');
        }
        else if (typeof metadata === 'bigint') {
            return typescript_1.default.createBigIntLiteral(metadata.toString());
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
                literalProperties.push(typescript_1.default.createPropertyAssignment(getPropertyName(key), propertyValue));
            }
            return typescript_1.default.createObjectLiteral(literalProperties, true);
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
        return typescript_1.default.createStringLiteral(name);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydF9kaXJlY3RpdmVfbWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy91bmRlY29yYXRlZC1jbGFzc2VzLXdpdGgtZGkvZGVjb3JhdG9yX3Jld3JpdGUvY29udmVydF9kaXJlY3RpdmVfbWV0YWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0lBR0gsNERBQTRCO0lBRTVCLDhFQUE4RTtJQUM5RSxNQUFhLDRCQUE2QixTQUFRLEtBQUs7S0FBRztJQUExRCxvRUFBMEQ7SUFFMUQ7OztPQUdHO0lBQ0gsU0FBZ0Isb0NBQW9DLENBQ2hELGNBQWtELEVBQUUsUUFBYSxFQUNqRSxtQkFBNEQsRUFDNUQsWUFBaUUsRUFDakUsZUFBbUU7UUFDckUsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7WUFDaEMsT0FBTyxvQkFBRSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3pDO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xDLE9BQU8sb0JBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUNyQyxFQUFFLENBQUMsRUFBRSxDQUFDLG9DQUFvQyxDQUN0QyxjQUFjLEVBQUUsRUFBRSxFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkY7YUFBTSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUN2QyxPQUFPLG9CQUFFLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDckQ7YUFBTSxJQUFJLE9BQU8sUUFBUSxLQUFLLFNBQVMsRUFBRTtZQUN4QyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsb0JBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0JBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztTQUN0RDthQUFNLElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxFQUFFO1lBQzFDLE9BQU8sb0JBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUN6QzthQUFNLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1lBQ3ZDLE9BQU8sb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUNwRDthQUFNLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1lBQ3ZDLCtFQUErRTtZQUMvRSwrRUFBK0U7WUFDL0UsOEVBQThFO1lBQzlFLElBQUksUUFBUSxZQUFZLGNBQWMsQ0FBQyxZQUFZLEVBQUU7Z0JBQ25ELE1BQU0sY0FBYyxHQUFHLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7b0JBQzNCLE1BQU0sSUFBSSw0QkFBNEIsRUFBRSxDQUFDO2lCQUMxQztnQkFDRCxPQUFPLFlBQVksQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3BEO1lBRUQsTUFBTSxpQkFBaUIsR0FBNEIsRUFBRSxDQUFDO1lBRXRELEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDdkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLGFBQWEsR0FBdUIsSUFBSSxDQUFDO2dCQUU3QyxrRkFBa0Y7Z0JBQ2xGLHFGQUFxRjtnQkFDckYsaUZBQWlGO2dCQUNqRixJQUFJLGVBQWUsRUFBRTtvQkFDbkIsYUFBYSxHQUFHLGVBQWUsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7aUJBQ3JEO2dCQUVELGdGQUFnRjtnQkFDaEYsNERBQTREO2dCQUM1RCxJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7b0JBQzFCLGFBQWEsR0FBRyxvQ0FBb0MsQ0FDaEQsY0FBYyxFQUFFLGFBQWEsRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLENBQUM7aUJBQ3hGO2dCQUVELGlCQUFpQixDQUFDLElBQUksQ0FBQyxvQkFBRSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO2FBQzFGO1lBRUQsT0FBTyxvQkFBRSxDQUFDLG1CQUFtQixDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3hEO1FBRUQsTUFBTSxJQUFJLDRCQUE0QixFQUFFLENBQUM7SUFDM0MsQ0FBQztJQTFERCxvRkEwREM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLGVBQWUsQ0FBQyxJQUFZO1FBQ25DLDhFQUE4RTtRQUM5RSxxRkFBcUY7UUFDckYsdUZBQXVGO1FBQ3ZGLG1GQUFtRjtRQUNuRixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDOUIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtTdGF0aWNTeW1ib2x9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqIEVycm9yIHRoYXQgd2lsbCBiZSB0aHJvd24gaWYgYW4gdW5leHBlY3RlZCB2YWx1ZSBuZWVkcyB0byBiZSBjb252ZXJ0ZWQuICovXG5leHBvcnQgY2xhc3MgVW5leHBlY3RlZE1ldGFkYXRhVmFsdWVFcnJvciBleHRlbmRzIEVycm9yIHt9XG5cbi8qKlxuICogQ29udmVydHMgYSBkaXJlY3RpdmUgbWV0YWRhdGEgb2JqZWN0IGludG8gYSBUeXBlU2NyaXB0IGV4cHJlc3Npb24uIFRocm93c1xuICogaWYgbWV0YWRhdGEgY2Fubm90IGJlIGNsZWFubHkgY29udmVydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udmVydERpcmVjdGl2ZU1ldGFkYXRhVG9FeHByZXNzaW9uKFxuICAgIGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpLCBtZXRhZGF0YTogYW55LFxuICAgIHJlc29sdmVTeW1ib2xJbXBvcnQ6IChzeW1ib2w6IFN0YXRpY1N5bWJvbCkgPT4gc3RyaW5nIHwgbnVsbCxcbiAgICBjcmVhdGVJbXBvcnQ6IChtb2R1bGVOYW1lOiBzdHJpbmcsIG5hbWU6IHN0cmluZykgPT4gdHMuRXhwcmVzc2lvbixcbiAgICBjb252ZXJ0UHJvcGVydHk/OiAoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHRzLkV4cHJlc3Npb24gfCBudWxsKTogdHMuRXhwcmVzc2lvbiB7XG4gIGlmICh0eXBlb2YgbWV0YWRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZVN0cmluZ0xpdGVyYWwobWV0YWRhdGEpO1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkobWV0YWRhdGEpKSB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUFycmF5TGl0ZXJhbChtZXRhZGF0YS5tYXAoXG4gICAgICAgIGVsID0+IGNvbnZlcnREaXJlY3RpdmVNZXRhZGF0YVRvRXhwcmVzc2lvbihcbiAgICAgICAgICAgIGNvbXBpbGVyTW9kdWxlLCBlbCwgcmVzb2x2ZVN5bWJvbEltcG9ydCwgY3JlYXRlSW1wb3J0LCBjb252ZXJ0UHJvcGVydHkpKSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1ldGFkYXRhID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB0cy5jcmVhdGVOdW1lcmljTGl0ZXJhbChtZXRhZGF0YS50b1N0cmluZygpKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbWV0YWRhdGEgPT09ICdib29sZWFuJykge1xuICAgIHJldHVybiBtZXRhZGF0YSA/IHRzLmNyZWF0ZVRydWUoKSA6IHRzLmNyZWF0ZUZhbHNlKCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1ldGFkYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiB0cy5jcmVhdGVJZGVudGlmaWVyKCd1bmRlZmluZWQnKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbWV0YWRhdGEgPT09ICdiaWdpbnQnKSB7XG4gICAgcmV0dXJuIHRzLmNyZWF0ZUJpZ0ludExpdGVyYWwobWV0YWRhdGEudG9TdHJpbmcoKSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1ldGFkYXRhID09PSAnb2JqZWN0Jykge1xuICAgIC8vIEluIGNhc2UgdGhlcmUgaXMgYSBzdGF0aWMgc3ltYm9sIG9iamVjdCBwYXJ0IG9mIHRoZSBtZXRhZGF0YSwgdHJ5IHRvIHJlc29sdmVcbiAgICAvLyB0aGUgaW1wb3J0IGV4cHJlc3Npb24gb2YgdGhlIHN5bWJvbC4gSWYgbm8gaW1wb3J0IHBhdGggY291bGQgYmUgcmVzb2x2ZWQsIGFuXG4gICAgLy8gZXJyb3Igd2lsbCBiZSB0aHJvd24gYXMgdGhlIHN5bWJvbCBjYW5ub3QgYmUgY29udmVydGVkIGludG8gVHlwZVNjcmlwdCBBU1QuXG4gICAgaWYgKG1ldGFkYXRhIGluc3RhbmNlb2YgY29tcGlsZXJNb2R1bGUuU3RhdGljU3ltYm9sKSB7XG4gICAgICBjb25zdCByZXNvbHZlZEltcG9ydCA9IHJlc29sdmVTeW1ib2xJbXBvcnQobWV0YWRhdGEpO1xuICAgICAgaWYgKHJlc29sdmVkSW1wb3J0ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBVbmV4cGVjdGVkTWV0YWRhdGFWYWx1ZUVycm9yKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3JlYXRlSW1wb3J0KHJlc29sdmVkSW1wb3J0LCBtZXRhZGF0YS5uYW1lKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXRlcmFsUHJvcGVydGllczogdHMuUHJvcGVydHlBc3NpZ25tZW50W10gPSBbXTtcblxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKG1ldGFkYXRhKSkge1xuICAgICAgY29uc3QgbWV0YWRhdGFWYWx1ZSA9IG1ldGFkYXRhW2tleV07XG4gICAgICBsZXQgcHJvcGVydHlWYWx1ZTogdHMuRXhwcmVzc2lvbnxudWxsID0gbnVsbDtcblxuICAgICAgLy8gQWxsb3dzIGN1c3RvbSBjb252ZXJzaW9uIG9mIHByb3BlcnRpZXMgaW4gYW4gb2JqZWN0LiBUaGlzIGlzIHVzZWZ1bCBmb3Igc3BlY2lhbFxuICAgICAgLy8gY2FzZXMgd2hlcmUgd2UgZG9uJ3Qgd2FudCB0byBzdG9yZSB0aGUgZW51bSB2YWx1ZXMgYXMgaW50ZWdlcnMsIGJ1dCByYXRoZXIgdXNlIHRoZVxuICAgICAgLy8gcmVhbCBlbnVtIHN5bWJvbC4gZS5nLiBpbnN0ZWFkIG9mIGAyYCB3ZSB3YW50IHRvIHVzZSBgVmlld0VuY2Fwc3VsYXRpb24uTm9uZWAuXG4gICAgICBpZiAoY29udmVydFByb3BlcnR5KSB7XG4gICAgICAgIHByb3BlcnR5VmFsdWUgPSBjb252ZXJ0UHJvcGVydHkoa2V5LCBtZXRhZGF0YVZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gSW4gY2FzZSB0aGUgcHJvcGVydHkgdmFsdWUgaGFzIG5vdCBiZWVuIGFzc2lnbmVkIHRvIGFuIGV4cHJlc3Npb24sIHdlIGNvbnZlcnRcbiAgICAgIC8vIHRoZSByZXNvbHZlZCBtZXRhZGF0YSB2YWx1ZSBpbnRvIGEgVHlwZVNjcmlwdCBleHByZXNzaW9uLlxuICAgICAgaWYgKHByb3BlcnR5VmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgcHJvcGVydHlWYWx1ZSA9IGNvbnZlcnREaXJlY3RpdmVNZXRhZGF0YVRvRXhwcmVzc2lvbihcbiAgICAgICAgICAgIGNvbXBpbGVyTW9kdWxlLCBtZXRhZGF0YVZhbHVlLCByZXNvbHZlU3ltYm9sSW1wb3J0LCBjcmVhdGVJbXBvcnQsIGNvbnZlcnRQcm9wZXJ0eSk7XG4gICAgICB9XG5cbiAgICAgIGxpdGVyYWxQcm9wZXJ0aWVzLnB1c2godHMuY3JlYXRlUHJvcGVydHlBc3NpZ25tZW50KGdldFByb3BlcnR5TmFtZShrZXkpLCBwcm9wZXJ0eVZhbHVlKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRzLmNyZWF0ZU9iamVjdExpdGVyYWwobGl0ZXJhbFByb3BlcnRpZXMsIHRydWUpO1xuICB9XG5cbiAgdGhyb3cgbmV3IFVuZXhwZWN0ZWRNZXRhZGF0YVZhbHVlRXJyb3IoKTtcbn1cblxuLyoqXG4gKiBHZXRzIGEgdmFsaWQgcHJvcGVydHkgbmFtZSBmcm9tIHRoZSBnaXZlbiB0ZXh0LiBJZiB0aGUgdGV4dCBjYW5ub3QgYmUgdXNlZFxuICogYXMgdW5xdW90ZWQgaWRlbnRpZmllciwgdGhlIG5hbWUgd2lsbCBiZSB3cmFwcGVkIGluIGEgc3RyaW5nIGxpdGVyYWwuXG4gKi9cbmZ1bmN0aW9uIGdldFByb3BlcnR5TmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmd8dHMuU3RyaW5nTGl0ZXJhbCB7XG4gIC8vIE1hdGNoZXMgdGhlIG1vc3QgY29tbW9uIGlkZW50aWZpZXJzIHRoYXQgZG8gbm90IG5lZWQgcXVvdGVzLiBDb25zdHJ1Y3RpbmcgYVxuICAvLyByZWd1bGFyIGV4cHJlc3Npb24gdGhhdCBtYXRjaGVzIHRoZSBFQ01BU2NyaXB0IHNwZWNpZmljYXRpb24gaW4gb3JkZXIgdG8gZGV0ZXJtaW5lXG4gIC8vIHdoZXRoZXIgcXVvdGVzIGFyZSBuZWVkZWQgaXMgb3V0IG9mIHNjb3BlIGZvciB0aGlzIG1pZ3JhdGlvbi4gRm9yIHRob3NlIG1vcmUgY29tcGxleFxuICAvLyBwcm9wZXJ0eSBuYW1lcywgd2UganVzdCBhbHdheXMgdXNlIHF1b3RlcyAod2hlbiBjb25zdHJ1Y3RpbmcgQVNUIGZyb20gbWV0YWRhdGEpLlxuICBpZiAoL15bYS16QS1aXyRdKyQvLnRlc3QobmFtZSkpIHtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuICByZXR1cm4gdHMuY3JlYXRlU3RyaW5nTGl0ZXJhbChuYW1lKTtcbn1cbiJdfQ==