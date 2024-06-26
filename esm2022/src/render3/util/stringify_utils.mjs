/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NG_COMP_DEF } from '../fields';
/**
 * Used for stringify render output in Ivy.
 * Important! This function is very performance-sensitive and we should
 * be extra careful not to introduce megamorphic reads in it.
 * Check `core/test/render3/perf/render_stringify` for benchmarks and alternate implementations.
 */
export function renderStringify(value) {
    if (typeof value === 'string')
        return value;
    if (value == null)
        return '';
    // Use `String` so that it invokes the `toString` method of the value. Note that this
    // appears to be faster than calling `value.toString` (see `render_stringify` benchmark).
    return String(value);
}
/**
 * Used to stringify a value so that it can be displayed in an error message.
 *
 * Important! This function contains a megamorphic read and should only be
 * used for error messages.
 */
export function stringifyForError(value) {
    if (typeof value === 'function')
        return value.name || value.toString();
    if (typeof value === 'object' && value != null && typeof value.type === 'function') {
        return value.type.name || value.type.toString();
    }
    return renderStringify(value);
}
/**
 * Used to stringify a `Type` and including the file path and line number in which it is defined, if
 * possible, for better debugging experience.
 *
 * Important! This function contains a megamorphic read and should only be used for error messages.
 */
export function debugStringifyTypeForError(type) {
    // TODO(pmvald): Do some refactoring so that we can use getComponentDef here without creating
    // circular deps.
    let componentDef = type[NG_COMP_DEF] || null;
    if (componentDef !== null && componentDef.debugInfo) {
        return stringifyTypeFromDebugInfo(componentDef.debugInfo);
    }
    return stringifyForError(type);
}
// TODO(pmvald): Do some refactoring so that we can use the type ClassDebugInfo for the param
// debugInfo here without creating circular deps.
function stringifyTypeFromDebugInfo(debugInfo) {
    if (!debugInfo.filePath || !debugInfo.lineNumber) {
        return debugInfo.className;
    }
    else {
        return `${debugInfo.className} (at ${debugInfo.filePath}:${debugInfo.lineNumber})`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5naWZ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL3N0cmluZ2lmeV91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRXRDOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFVO0lBQ3hDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQzVDLElBQUksS0FBSyxJQUFJLElBQUk7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUM3QixxRkFBcUY7SUFDckYseUZBQXlGO0lBQ3pGLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxLQUFVO0lBQzFDLElBQUksT0FBTyxLQUFLLEtBQUssVUFBVTtRQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDdkUsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7UUFDbkYsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xELENBQUM7SUFFRCxPQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoQyxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsSUFBZTtJQUN4RCw2RkFBNkY7SUFDN0YsaUJBQWlCO0lBQ2pCLElBQUksWUFBWSxHQUFJLElBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDdEQsSUFBSSxZQUFZLEtBQUssSUFBSSxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNwRCxPQUFPLDBCQUEwQixDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsNkZBQTZGO0FBQzdGLGlEQUFpRDtBQUNqRCxTQUFTLDBCQUEwQixDQUFDLFNBQWM7SUFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDakQsT0FBTyxTQUFTLENBQUMsU0FBUyxDQUFDO0lBQzdCLENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxHQUFHLFNBQVMsQ0FBQyxTQUFTLFFBQVEsU0FBUyxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUMsVUFBVSxHQUFHLENBQUM7SUFDckYsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge05HX0NPTVBfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuXG4vKipcbiAqIFVzZWQgZm9yIHN0cmluZ2lmeSByZW5kZXIgb3V0cHV0IGluIEl2eS5cbiAqIEltcG9ydGFudCEgVGhpcyBmdW5jdGlvbiBpcyB2ZXJ5IHBlcmZvcm1hbmNlLXNlbnNpdGl2ZSBhbmQgd2Ugc2hvdWxkXG4gKiBiZSBleHRyYSBjYXJlZnVsIG5vdCB0byBpbnRyb2R1Y2UgbWVnYW1vcnBoaWMgcmVhZHMgaW4gaXQuXG4gKiBDaGVjayBgY29yZS90ZXN0L3JlbmRlcjMvcGVyZi9yZW5kZXJfc3RyaW5naWZ5YCBmb3IgYmVuY2htYXJrcyBhbmQgYWx0ZXJuYXRlIGltcGxlbWVudGF0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0cmluZ2lmeSh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHJldHVybiB2YWx1ZTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiAnJztcbiAgLy8gVXNlIGBTdHJpbmdgIHNvIHRoYXQgaXQgaW52b2tlcyB0aGUgYHRvU3RyaW5nYCBtZXRob2Qgb2YgdGhlIHZhbHVlLiBOb3RlIHRoYXQgdGhpc1xuICAvLyBhcHBlYXJzIHRvIGJlIGZhc3RlciB0aGFuIGNhbGxpbmcgYHZhbHVlLnRvU3RyaW5nYCAoc2VlIGByZW5kZXJfc3RyaW5naWZ5YCBiZW5jaG1hcmspLlxuICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIHN0cmluZ2lmeSBhIHZhbHVlIHNvIHRoYXQgaXQgY2FuIGJlIGRpc3BsYXllZCBpbiBhbiBlcnJvciBtZXNzYWdlLlxuICpcbiAqIEltcG9ydGFudCEgVGhpcyBmdW5jdGlvbiBjb250YWlucyBhIG1lZ2Ftb3JwaGljIHJlYWQgYW5kIHNob3VsZCBvbmx5IGJlXG4gKiB1c2VkIGZvciBlcnJvciBtZXNzYWdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeUZvckVycm9yKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSByZXR1cm4gdmFsdWUubmFtZSB8fCB2YWx1ZS50b1N0cmluZygpO1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS50eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHZhbHVlLnR5cGUubmFtZSB8fCB2YWx1ZS50eXBlLnRvU3RyaW5nKCk7XG4gIH1cblxuICByZXR1cm4gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIHN0cmluZ2lmeSBhIGBUeXBlYCBhbmQgaW5jbHVkaW5nIHRoZSBmaWxlIHBhdGggYW5kIGxpbmUgbnVtYmVyIGluIHdoaWNoIGl0IGlzIGRlZmluZWQsIGlmXG4gKiBwb3NzaWJsZSwgZm9yIGJldHRlciBkZWJ1Z2dpbmcgZXhwZXJpZW5jZS5cbiAqXG4gKiBJbXBvcnRhbnQhIFRoaXMgZnVuY3Rpb24gY29udGFpbnMgYSBtZWdhbW9ycGhpYyByZWFkIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBlcnJvciBtZXNzYWdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnU3RyaW5naWZ5VHlwZUZvckVycm9yKHR5cGU6IFR5cGU8YW55Pik6IHN0cmluZyB7XG4gIC8vIFRPRE8ocG12YWxkKTogRG8gc29tZSByZWZhY3RvcmluZyBzbyB0aGF0IHdlIGNhbiB1c2UgZ2V0Q29tcG9uZW50RGVmIGhlcmUgd2l0aG91dCBjcmVhdGluZ1xuICAvLyBjaXJjdWxhciBkZXBzLlxuICBsZXQgY29tcG9uZW50RGVmID0gKHR5cGUgYXMgYW55KVtOR19DT01QX0RFRl0gfHwgbnVsbDtcbiAgaWYgKGNvbXBvbmVudERlZiAhPT0gbnVsbCAmJiBjb21wb25lbnREZWYuZGVidWdJbmZvKSB7XG4gICAgcmV0dXJuIHN0cmluZ2lmeVR5cGVGcm9tRGVidWdJbmZvKGNvbXBvbmVudERlZi5kZWJ1Z0luZm8pO1xuICB9XG5cbiAgcmV0dXJuIHN0cmluZ2lmeUZvckVycm9yKHR5cGUpO1xufVxuXG4vLyBUT0RPKHBtdmFsZCk6IERvIHNvbWUgcmVmYWN0b3Jpbmcgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZSB0eXBlIENsYXNzRGVidWdJbmZvIGZvciB0aGUgcGFyYW1cbi8vIGRlYnVnSW5mbyBoZXJlIHdpdGhvdXQgY3JlYXRpbmcgY2lyY3VsYXIgZGVwcy5cbmZ1bmN0aW9uIHN0cmluZ2lmeVR5cGVGcm9tRGVidWdJbmZvKGRlYnVnSW5mbzogYW55KTogc3RyaW5nIHtcbiAgaWYgKCFkZWJ1Z0luZm8uZmlsZVBhdGggfHwgIWRlYnVnSW5mby5saW5lTnVtYmVyKSB7XG4gICAgcmV0dXJuIGRlYnVnSW5mby5jbGFzc05hbWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGAke2RlYnVnSW5mby5jbGFzc05hbWV9IChhdCAke2RlYnVnSW5mby5maWxlUGF0aH06JHtkZWJ1Z0luZm8ubGluZU51bWJlcn0pYDtcbiAgfVxufVxuIl19