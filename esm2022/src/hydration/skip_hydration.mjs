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
/**
 * Checks whether a TNode has a flag to indicate that it's a part of
 * a skip hydration block.
 */
export function hasInSkipHydrationBlockFlag(tNode) {
    return (tNode.flags & 128 /* TNodeFlags.inSkipHydrationBlock */) === 128 /* TNodeFlags.inSkipHydrationBlock */;
}
/**
 * Helper function that determines if a given node is within a skip hydration block
 * by navigating up the TNode tree to see if any parent nodes have skip hydration
 * attribute.
 *
 * TODO(akushnir): this function should contain the logic of `hasInSkipHydrationBlockFlag`,
 * there is no need to traverse parent nodes when we have a TNode flag (which would also
 * make this lookup O(1)).
 */
export function isInSkipHydrationBlock(tNode) {
    let currentTNode = tNode.parent;
    while (currentTNode) {
        if (hasNgSkipHydrationAttr(currentTNode)) {
            return true;
        }
        currentTNode = currentTNode.parent;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcF9oeWRyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vc2tpcF9oeWRyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0g7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sd0JBQXdCLEdBQUcsaUJBQWlCLENBQUM7QUFFMUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsS0FBWTtJQUNqRCxNQUFNLG1DQUFtQyxHQUFHLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRW5GLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7SUFDaEMsSUFBSSxLQUFLLEtBQUssSUFBSTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ2pDLDJEQUEyRDtJQUMzRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3hDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2Qiw0RUFBNEU7UUFDNUUsd0JBQXdCO1FBQ3hCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQzVDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxtQ0FBbUMsRUFBRTtZQUM1RixPQUFPLElBQUksQ0FBQztTQUNiO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsMkJBQTJCLENBQUMsS0FBWTtJQUN0RCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssNENBQWtDLENBQUMsOENBQW9DLENBQUM7QUFDN0YsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEtBQVk7SUFDakQsSUFBSSxZQUFZLEdBQWUsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM1QyxPQUFPLFlBQVksRUFBRTtRQUNuQixJQUFJLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ3hDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztLQUNwQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogVGhlIG5hbWUgb2YgYW4gYXR0cmlidXRlIHRoYXQgY2FuIGJlIGFkZGVkIHRvIHRoZSBoeWRyYXRpb24gYm91bmRhcnkgbm9kZVxuICogKGNvbXBvbmVudCBob3N0IG5vZGUpIHRvIGRpc2FibGUgaHlkcmF0aW9uIGZvciB0aGUgY29udGVudCB3aXRoaW4gdGhhdCBib3VuZGFyeS5cbiAqL1xuZXhwb3J0IGNvbnN0IFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSA9ICduZ1NraXBIeWRyYXRpb24nO1xuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjaGVjayBpZiBhIGdpdmVuIG5vZGUgaGFzIHRoZSAnbmdTa2lwSHlkcmF0aW9uJyBhdHRyaWJ1dGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc05nU2tpcEh5ZHJhdGlvbkF0dHIodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIGNvbnN0IFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRV9MT1dFUl9DQVNFID0gU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FLnRvTG93ZXJDYXNlKCk7XG5cbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5tZXJnZWRBdHRycztcbiAgaWYgKGF0dHJzID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gIC8vIG9ubHkgZXZlciBsb29rIGF0IHRoZSBhdHRyaWJ1dGUgbmFtZSBhbmQgc2tpcCB0aGUgdmFsdWVzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2ldO1xuICAgIC8vIFRoaXMgaXMgYSBtYXJrZXIsIHdoaWNoIG1lYW5zIHRoYXQgdGhlIHN0YXRpYyBhdHRyaWJ1dGVzIHNlY3Rpb24gaXMgb3ZlcixcbiAgICAvLyBzbyB3ZSBjYW4gZXhpdCBlYXJseS5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykgcmV0dXJuIGZhbHNlO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLnRvTG93ZXJDYXNlKCkgPT09IFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRV9MT1dFUl9DQVNFKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgVE5vZGUgaGFzIGEgZmxhZyB0byBpbmRpY2F0ZSB0aGF0IGl0J3MgYSBwYXJ0IG9mXG4gKiBhIHNraXAgaHlkcmF0aW9uIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzSW5Ta2lwSHlkcmF0aW9uQmxvY2tGbGFnKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pblNraXBIeWRyYXRpb25CbG9jaykgPT09IFROb2RlRmxhZ3MuaW5Ta2lwSHlkcmF0aW9uQmxvY2s7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRoYXQgZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIG5vZGUgaXMgd2l0aGluIGEgc2tpcCBoeWRyYXRpb24gYmxvY2tcbiAqIGJ5IG5hdmlnYXRpbmcgdXAgdGhlIFROb2RlIHRyZWUgdG8gc2VlIGlmIGFueSBwYXJlbnQgbm9kZXMgaGF2ZSBza2lwIGh5ZHJhdGlvblxuICogYXR0cmlidXRlLlxuICpcbiAqIFRPRE8oYWt1c2huaXIpOiB0aGlzIGZ1bmN0aW9uIHNob3VsZCBjb250YWluIHRoZSBsb2dpYyBvZiBgaGFzSW5Ta2lwSHlkcmF0aW9uQmxvY2tGbGFnYCxcbiAqIHRoZXJlIGlzIG5vIG5lZWQgdG8gdHJhdmVyc2UgcGFyZW50IG5vZGVzIHdoZW4gd2UgaGF2ZSBhIFROb2RlIGZsYWcgKHdoaWNoIHdvdWxkIGFsc29cbiAqIG1ha2UgdGhpcyBsb29rdXAgTygxKSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICBsZXQgY3VycmVudFROb2RlOiBUTm9kZXxudWxsID0gdE5vZGUucGFyZW50O1xuICB3aGlsZSAoY3VycmVudFROb2RlKSB7XG4gICAgaWYgKGhhc05nU2tpcEh5ZHJhdGlvbkF0dHIoY3VycmVudFROb2RlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGN1cnJlbnRUTm9kZSA9IGN1cnJlbnRUTm9kZS5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19