/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { getTemplateLocationDetails } from '../render3/instructions/element_validation';
import { getCurrentTNode, getLView } from '../render3/state';
import { getNativeByTNode } from '../render3/util/view_utils';
/*
 * The set of security-sensitive attributes of an `<iframe>` that *must* be
 * applied before setting the `src` or `srcdoc` attribute value.
 * This ensures that all security-sensitive attributes are taken into account
 * while creating an instance of an `<iframe>` at runtime.
 *
 * Keep this list in sync with the `IFRAME_SECURITY_SENSITIVE_ATTRS` token
 * from the `packages/compiler/src/schema/dom_security_schema.ts` script.
 */
export const IFRAME_SECURITY_SENSITIVE_ATTRS = new Set(['sandbox', 'allow', 'allowfullscreen', 'referrerpolicy', 'loading', 'csp', 'fetchpriority']);
/**
 * Validation function invoked at runtime for each binding that might potentially
 * represent a security-sensitive attribute of an <iframe>
 * (see `IFRAME_SECURITY_SENSITIVE_ATTRS` for the full list of such attributes).
 *
 * @codeGenApi
 */
export function ɵɵvalidateIframeAttribute(attrValue, tagName, attrName) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const element = getNativeByTNode(tNode, lView);
    if (tNode.type === 2 /* TNodeType.Element */ && tNode.value.toLowerCase() === 'iframe' &&
        // Note: check for all false'y values including an empty string as a value,
        // since this is a default value for an `<iframe>`'s `src` attribute.
        (element.src || element.srcdoc)) {
        throw unsafeIframeAttributeError(lView, attrName);
    }
}
/**
 * Constructs an instance of a `RuntimeError` to indicate that
 * a security-sensitive attribute of an <iframe> was set after
 * setting an `src` or `srcdoc`.
 */
function unsafeIframeAttributeError(lView, attrName) {
    const errorMessage = ngDevMode &&
        `For security reasons, setting the \`${attrName}\` attribute on an <iframe> ` +
            `after the \`src\` or \`srcdoc\` is not allowed${getTemplateLocationDetails(lView)}. ` +
            `To fix this, reorder the list of attributes (applied to the <iframe> in a template ` +
            `or via host bindings) to make sure the \`${attrName}\` is set before the ` +
            `\`src\` or \`srcdoc\``;
    return new RuntimeError(910 /* RuntimeErrorCode.UNSAFE_IFRAME_ATTRS */, errorMessage);
}
/**
 * Validation function invoked at runtime for each <iframe>, which verifies that
 * all security-sensitive attributes are located before an `src` or `srcdoc` attributes.
 * This is needed to make sure that these security-sensitive attributes are taken into
 * account while creating an <iframe> at runtime. See `IFRAME_SECURITY_SENSITIVE_ATTRS`
 * for the full list of such attributes.
 *
 * @codeGenApi
 */
export function ɵɵvalidateIframeStaticAttributes(attrs) {
    // Static attributes are located in front of the `TAttributes` array in the following format:
    // `[attr1, value1, attr2, value2, ...]`. Exit when we come across the first marker (represented
    // by a number) or when we reach the end of an array. See additional information about the
    // `TAttributes` format in the `setUpAttributes` function docs.
    let i = 0;
    let seenSrc = false;
    while (i < attrs.length) {
        let attrName = attrs[i];
        // We came across a marker -> exit, since there
        // are no more static attributes in the array.
        if (typeof attrName === 'number')
            return;
        // Lower-case attribute names before checking, since the attribute name
        // in the native `setAttribute` is case-insensitive.
        attrName = attrName.toLowerCase();
        if (attrName === 'src' || attrName === 'srcdoc') {
            seenSrc = true;
        }
        else {
            if (seenSrc && IFRAME_SECURITY_SENSITIVE_ATTRS.has(attrName)) {
                throw unsafeIframeAttributeError(getLView(), attrName);
            }
        }
        i += 2;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWZyYW1lX2F0dHJzX3ZhbGlkYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vaWZyYW1lX2F0dHJzX3ZhbGlkYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sNENBQTRDLENBQUM7QUFJdEYsT0FBTyxFQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMzRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUU1RDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sQ0FBQyxNQUFNLCtCQUErQixHQUFHLElBQUksR0FBRyxDQUNsRCxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBRWxHOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxTQUFjLEVBQUUsT0FBZSxFQUFFLFFBQWdCO0lBQ3pGLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQXdCLENBQUM7SUFFdEUsSUFBSSxLQUFLLENBQUMsSUFBSSw4QkFBc0IsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLFFBQVE7UUFDMUUsMkVBQTJFO1FBQzNFLHFFQUFxRTtRQUNyRSxDQUFFLE9BQTZCLENBQUMsR0FBRyxJQUFLLE9BQTZCLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDakYsTUFBTSwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDbkQ7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsMEJBQTBCLENBQUMsS0FBWSxFQUFFLFFBQWdCO0lBQ2hFLE1BQU0sWUFBWSxHQUFHLFNBQVM7UUFDMUIsdUNBQXVDLFFBQVEsOEJBQThCO1lBQ3pFLGlEQUFpRCwwQkFBMEIsQ0FBQyxLQUFLLENBQUMsSUFBSTtZQUN0RixxRkFBcUY7WUFDckYsNENBQTRDLFFBQVEsdUJBQXVCO1lBQzNFLHVCQUF1QixDQUFDO0lBQ2hDLE9BQU8sSUFBSSxZQUFZLGlEQUF1QyxZQUFZLENBQUMsQ0FBQztBQUM5RSxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsZ0NBQWdDLENBQUMsS0FBa0I7SUFDakUsNkZBQTZGO0lBQzdGLGdHQUFnRztJQUNoRywwRkFBMEY7SUFDMUYsK0RBQStEO0lBQy9ELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztJQUNwQixPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQ3ZCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV4QiwrQ0FBK0M7UUFDL0MsOENBQThDO1FBQzlDLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUTtZQUFFLE9BQU87UUFFekMsdUVBQXVFO1FBQ3ZFLG9EQUFvRDtRQUNwRCxRQUFRLEdBQUksUUFBbUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM5QyxJQUFJLFFBQVEsS0FBSyxLQUFLLElBQUksUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUMvQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQ2hCO2FBQU07WUFDTCxJQUFJLE9BQU8sSUFBSSwrQkFBK0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzVELE1BQU0sMEJBQTBCLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBa0IsQ0FBQyxDQUFDO2FBQ2xFO1NBQ0Y7UUFDRCxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ1I7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtnZXRUZW1wbGF0ZUxvY2F0aW9uRGV0YWlsc30gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uJztcbmltcG9ydCB7VEF0dHJpYnV0ZXMsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3fSBmcm9tICcuLi9yZW5kZXIzL3N0YXRlJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuXG4vKlxuICogVGhlIHNldCBvZiBzZWN1cml0eS1zZW5zaXRpdmUgYXR0cmlidXRlcyBvZiBhbiBgPGlmcmFtZT5gIHRoYXQgKm11c3QqIGJlXG4gKiBhcHBsaWVkIGJlZm9yZSBzZXR0aW5nIHRoZSBgc3JjYCBvciBgc3JjZG9jYCBhdHRyaWJ1dGUgdmFsdWUuXG4gKiBUaGlzIGVuc3VyZXMgdGhhdCBhbGwgc2VjdXJpdHktc2Vuc2l0aXZlIGF0dHJpYnV0ZXMgYXJlIHRha2VuIGludG8gYWNjb3VudFxuICogd2hpbGUgY3JlYXRpbmcgYW4gaW5zdGFuY2Ugb2YgYW4gYDxpZnJhbWU+YCBhdCBydW50aW1lLlxuICpcbiAqIEtlZXAgdGhpcyBsaXN0IGluIHN5bmMgd2l0aCB0aGUgYElGUkFNRV9TRUNVUklUWV9TRU5TSVRJVkVfQVRUUlNgIHRva2VuXG4gKiBmcm9tIHRoZSBgcGFja2FnZXMvY29tcGlsZXIvc3JjL3NjaGVtYS9kb21fc2VjdXJpdHlfc2NoZW1hLnRzYCBzY3JpcHQuXG4gKi9cbmV4cG9ydCBjb25zdCBJRlJBTUVfU0VDVVJJVFlfU0VOU0lUSVZFX0FUVFJTID0gbmV3IFNldChcbiAgICBbJ3NhbmRib3gnLCAnYWxsb3cnLCAnYWxsb3dmdWxsc2NyZWVuJywgJ3JlZmVycmVycG9saWN5JywgJ2xvYWRpbmcnLCAnY3NwJywgJ2ZldGNocHJpb3JpdHknXSk7XG5cbi8qKlxuICogVmFsaWRhdGlvbiBmdW5jdGlvbiBpbnZva2VkIGF0IHJ1bnRpbWUgZm9yIGVhY2ggYmluZGluZyB0aGF0IG1pZ2h0IHBvdGVudGlhbGx5XG4gKiByZXByZXNlbnQgYSBzZWN1cml0eS1zZW5zaXRpdmUgYXR0cmlidXRlIG9mIGFuIDxpZnJhbWU+XG4gKiAoc2VlIGBJRlJBTUVfU0VDVVJJVFlfU0VOU0lUSVZFX0FUVFJTYCBmb3IgdGhlIGZ1bGwgbGlzdCBvZiBzdWNoIGF0dHJpYnV0ZXMpLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dmFsaWRhdGVJZnJhbWVBdHRyaWJ1dGUoYXR0clZhbHVlOiBhbnksIHRhZ05hbWU6IHN0cmluZywgYXR0ck5hbWU6IHN0cmluZykge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQ7XG5cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ICYmIHROb2RlLnZhbHVlLnRvTG93ZXJDYXNlKCkgPT09ICdpZnJhbWUnICYmXG4gICAgICAvLyBOb3RlOiBjaGVjayBmb3IgYWxsIGZhbHNlJ3kgdmFsdWVzIGluY2x1ZGluZyBhbiBlbXB0eSBzdHJpbmcgYXMgYSB2YWx1ZSxcbiAgICAgIC8vIHNpbmNlIHRoaXMgaXMgYSBkZWZhdWx0IHZhbHVlIGZvciBhbiBgPGlmcmFtZT5gJ3MgYHNyY2AgYXR0cmlidXRlLlxuICAgICAgKChlbGVtZW50IGFzIEhUTUxJRnJhbWVFbGVtZW50KS5zcmMgfHwgKGVsZW1lbnQgYXMgSFRNTElGcmFtZUVsZW1lbnQpLnNyY2RvYykpIHtcbiAgICB0aHJvdyB1bnNhZmVJZnJhbWVBdHRyaWJ1dGVFcnJvcihsVmlldywgYXR0ck5hbWUpO1xuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBpbnN0YW5jZSBvZiBhIGBSdW50aW1lRXJyb3JgIHRvIGluZGljYXRlIHRoYXRcbiAqIGEgc2VjdXJpdHktc2Vuc2l0aXZlIGF0dHJpYnV0ZSBvZiBhbiA8aWZyYW1lPiB3YXMgc2V0IGFmdGVyXG4gKiBzZXR0aW5nIGFuIGBzcmNgIG9yIGBzcmNkb2NgLlxuICovXG5mdW5jdGlvbiB1bnNhZmVJZnJhbWVBdHRyaWJ1dGVFcnJvcihsVmlldzogTFZpZXcsIGF0dHJOYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgZXJyb3JNZXNzYWdlID0gbmdEZXZNb2RlICYmXG4gICAgICBgRm9yIHNlY3VyaXR5IHJlYXNvbnMsIHNldHRpbmcgdGhlIFxcYCR7YXR0ck5hbWV9XFxgIGF0dHJpYnV0ZSBvbiBhbiA8aWZyYW1lPiBgICtcbiAgICAgICAgICBgYWZ0ZXIgdGhlIFxcYHNyY1xcYCBvciBcXGBzcmNkb2NcXGAgaXMgbm90IGFsbG93ZWQke2dldFRlbXBsYXRlTG9jYXRpb25EZXRhaWxzKGxWaWV3KX0uIGAgK1xuICAgICAgICAgIGBUbyBmaXggdGhpcywgcmVvcmRlciB0aGUgbGlzdCBvZiBhdHRyaWJ1dGVzIChhcHBsaWVkIHRvIHRoZSA8aWZyYW1lPiBpbiBhIHRlbXBsYXRlIGAgK1xuICAgICAgICAgIGBvciB2aWEgaG9zdCBiaW5kaW5ncykgdG8gbWFrZSBzdXJlIHRoZSBcXGAke2F0dHJOYW1lfVxcYCBpcyBzZXQgYmVmb3JlIHRoZSBgICtcbiAgICAgICAgICBgXFxgc3JjXFxgIG9yIFxcYHNyY2RvY1xcYGA7XG4gIHJldHVybiBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5TQUZFX0lGUkFNRV9BVFRSUywgZXJyb3JNZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0aW9uIGZ1bmN0aW9uIGludm9rZWQgYXQgcnVudGltZSBmb3IgZWFjaCA8aWZyYW1lPiwgd2hpY2ggdmVyaWZpZXMgdGhhdFxuICogYWxsIHNlY3VyaXR5LXNlbnNpdGl2ZSBhdHRyaWJ1dGVzIGFyZSBsb2NhdGVkIGJlZm9yZSBhbiBgc3JjYCBvciBgc3JjZG9jYCBhdHRyaWJ1dGVzLlxuICogVGhpcyBpcyBuZWVkZWQgdG8gbWFrZSBzdXJlIHRoYXQgdGhlc2Ugc2VjdXJpdHktc2Vuc2l0aXZlIGF0dHJpYnV0ZXMgYXJlIHRha2VuIGludG9cbiAqIGFjY291bnQgd2hpbGUgY3JlYXRpbmcgYW4gPGlmcmFtZT4gYXQgcnVudGltZS4gU2VlIGBJRlJBTUVfU0VDVVJJVFlfU0VOU0lUSVZFX0FUVFJTYFxuICogZm9yIHRoZSBmdWxsIGxpc3Qgb2Ygc3VjaCBhdHRyaWJ1dGVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dmFsaWRhdGVJZnJhbWVTdGF0aWNBdHRyaWJ1dGVzKGF0dHJzOiBUQXR0cmlidXRlcykge1xuICAvLyBTdGF0aWMgYXR0cmlidXRlcyBhcmUgbG9jYXRlZCBpbiBmcm9udCBvZiB0aGUgYFRBdHRyaWJ1dGVzYCBhcnJheSBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAgLy8gYFthdHRyMSwgdmFsdWUxLCBhdHRyMiwgdmFsdWUyLCAuLi5dYC4gRXhpdCB3aGVuIHdlIGNvbWUgYWNyb3NzIHRoZSBmaXJzdCBtYXJrZXIgKHJlcHJlc2VudGVkXG4gIC8vIGJ5IGEgbnVtYmVyKSBvciB3aGVuIHdlIHJlYWNoIHRoZSBlbmQgb2YgYW4gYXJyYXkuIFNlZSBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHRoZVxuICAvLyBgVEF0dHJpYnV0ZXNgIGZvcm1hdCBpbiB0aGUgYHNldFVwQXR0cmlidXRlc2AgZnVuY3Rpb24gZG9jcy5cbiAgbGV0IGkgPSAwO1xuICBsZXQgc2VlblNyYyA9IGZhbHNlO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGxldCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuXG4gICAgLy8gV2UgY2FtZSBhY3Jvc3MgYSBtYXJrZXIgLT4gZXhpdCwgc2luY2UgdGhlcmVcbiAgICAvLyBhcmUgbm8gbW9yZSBzdGF0aWMgYXR0cmlidXRlcyBpbiB0aGUgYXJyYXkuXG4gICAgaWYgKHR5cGVvZiBhdHRyTmFtZSA9PT0gJ251bWJlcicpIHJldHVybjtcblxuICAgIC8vIExvd2VyLWNhc2UgYXR0cmlidXRlIG5hbWVzIGJlZm9yZSBjaGVja2luZywgc2luY2UgdGhlIGF0dHJpYnV0ZSBuYW1lXG4gICAgLy8gaW4gdGhlIG5hdGl2ZSBgc2V0QXR0cmlidXRlYCBpcyBjYXNlLWluc2Vuc2l0aXZlLlxuICAgIGF0dHJOYW1lID0gKGF0dHJOYW1lIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoYXR0ck5hbWUgPT09ICdzcmMnIHx8IGF0dHJOYW1lID09PSAnc3JjZG9jJykge1xuICAgICAgc2VlblNyYyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzZWVuU3JjICYmIElGUkFNRV9TRUNVUklUWV9TRU5TSVRJVkVfQVRUUlMuaGFzKGF0dHJOYW1lKSkge1xuICAgICAgICB0aHJvdyB1bnNhZmVJZnJhbWVBdHRyaWJ1dGVFcnJvcihnZXRMVmlldygpLCBhdHRyTmFtZSBhcyBzdHJpbmcpO1xuICAgICAgfVxuICAgIH1cbiAgICBpICs9IDI7XG4gIH1cbn1cbiJdfQ==