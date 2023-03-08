/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * The name of an attribute that can be added to the hydration boundary node
 * (component host node) to disable hydration for the content within that boundary.
 */
export const SKIP_HYDRATION_ATTR_NAME = 'ngSkipHydration';
/**
 * Helper function to check if a given node has the 'ngSkipHydration' attribute
 */
export function hasNgSkipHydrationAttr(tNode) {
    const SKIP_HYDRATION_ATTR_NAME_LOWER_CASE = SKIP_HYDRATION_ATTR_NAME.toLowerCase();
    const attrs = tNode.mergedAttrs;
    if (attrs === null)
        return false;
    // only ever look at the attribute name and skip the values
    for (let i = 0; i < attrs.length; i += 2) {
        const value = attrs[i];
        // This is a marker, which means that the static attributes section is over,
        // so we can exit early.
        if (typeof value === 'number')
            return false;
        if (typeof value === 'string' && value.toLowerCase() === SKIP_HYDRATION_ATTR_NAME_LOWER_CASE) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcF9oeWRyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vc2tpcF9oeWRyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUg7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sd0JBQXdCLEdBQUcsaUJBQWlCLENBQUM7QUFFMUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsS0FBWTtJQUNqRCxNQUFNLG1DQUFtQyxHQUFHLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRW5GLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFDaEMsSUFBSSxLQUFLLEtBQUssSUFBSTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ2pDLDJEQUEyRDtJQUMzRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3hDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2Qiw0RUFBNEU7UUFDNUUsd0JBQXdCO1FBQ3hCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQzVDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxtQ0FBbUMsRUFBRTtZQUM1RixPQUFPLElBQUksQ0FBQztTQUNiO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIGFuIGF0dHJpYnV0ZSB0aGF0IGNhbiBiZSBhZGRlZCB0byB0aGUgaHlkcmF0aW9uIGJvdW5kYXJ5IG5vZGVcbiAqIChjb21wb25lbnQgaG9zdCBub2RlKSB0byBkaXNhYmxlIGh5ZHJhdGlvbiBmb3IgdGhlIGNvbnRlbnQgd2l0aGluIHRoYXQgYm91bmRhcnkuXG4gKi9cbmV4cG9ydCBjb25zdCBTS0lQX0hZRFJBVElPTl9BVFRSX05BTUUgPSAnbmdTa2lwSHlkcmF0aW9uJztcblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY2hlY2sgaWYgYSBnaXZlbiBub2RlIGhhcyB0aGUgJ25nU2tpcEh5ZHJhdGlvbicgYXR0cmlidXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNOZ1NraXBIeWRyYXRpb25BdHRyKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICBjb25zdCBTS0lQX0hZRFJBVElPTl9BVFRSX05BTUVfTE9XRVJfQ0FTRSA9IFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRS50b0xvd2VyQ2FzZSgpO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUubWVyZ2VkQXR0cnM7XG4gIGlmIChhdHRycyA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAvLyBvbmx5IGV2ZXIgbG9vayBhdCB0aGUgYXR0cmlidXRlIG5hbWUgYW5kIHNraXAgdGhlIHZhbHVlc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpXTtcbiAgICAvLyBUaGlzIGlzIGEgbWFya2VyLCB3aGljaCBtZWFucyB0aGF0IHRoZSBzdGF0aWMgYXR0cmlidXRlcyBzZWN0aW9uIGlzIG92ZXIsXG4gICAgLy8gc28gd2UgY2FuIGV4aXQgZWFybHkuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZS50b0xvd2VyQ2FzZSgpID09PSBTS0lQX0hZRFJBVElPTl9BVFRSX05BTUVfTE9XRVJfQ0FTRSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==