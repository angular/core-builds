/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined, assertEqual } from '../util/assert';
/**
 * @param {?} tNode
 * @param {?} type
 * @return {?}
 */
export function assertNodeType(tNode, type) {
    assertDefined(tNode, 'should be called with a TNode');
    assertEqual(tNode.type, type, `should be a ${typeName(type)}`);
}
/**
 * @param {?} tNode
 * @param {...?} types
 * @return {?}
 */
export function assertNodeOfPossibleTypes(tNode, ...types) {
    assertDefined(tNode, 'should be called with a TNode');
    /** @type {?} */
    const found = types.some((/**
     * @param {?} type
     * @return {?}
     */
    type => tNode.type === type));
    assertEqual(found, true, `Should be one of ${types.map(typeName).join(', ')} but got ${typeName(tNode.type)}`);
}
/**
 * @param {?} type
 * @return {?}
 */
function typeName(type) {
    if (type == 1 /* Projection */)
        return 'Projection';
    if (type == 0 /* Container */)
        return 'Container';
    if (type == 5 /* IcuContainer */)
        return 'IcuContainer';
    if (type == 2 /* View */)
        return 'View';
    if (type == 3 /* Element */)
        return 'Element';
    if (type == 4 /* ElementContainer */)
        return 'ElementContainer';
    return '<unknown>';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9hc3NlcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7O0FBRzFELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWSxFQUFFLElBQWU7SUFDMUQsYUFBYSxDQUFDLEtBQUssRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO0lBQ3RELFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxlQUFlLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDakUsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLEtBQVksRUFBRSxHQUFHLEtBQWtCO0lBQzNFLGFBQWEsQ0FBQyxLQUFLLEVBQUUsK0JBQStCLENBQUMsQ0FBQzs7VUFDaEQsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJOzs7O0lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksRUFBQztJQUNyRCxXQUFXLENBQ1AsS0FBSyxFQUFFLElBQUksRUFDWCxvQkFBb0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUYsQ0FBQzs7Ozs7QUFFRCxTQUFTLFFBQVEsQ0FBQyxJQUFlO0lBQy9CLElBQUksSUFBSSxzQkFBd0I7UUFBRSxPQUFPLFlBQVksQ0FBQztJQUN0RCxJQUFJLElBQUkscUJBQXVCO1FBQUUsT0FBTyxXQUFXLENBQUM7SUFDcEQsSUFBSSxJQUFJLHdCQUEwQjtRQUFFLE9BQU8sY0FBYyxDQUFDO0lBQzFELElBQUksSUFBSSxnQkFBa0I7UUFBRSxPQUFPLE1BQU0sQ0FBQztJQUMxQyxJQUFJLElBQUksbUJBQXFCO1FBQUUsT0FBTyxTQUFTLENBQUM7SUFDaEQsSUFBSSxJQUFJLDRCQUE4QjtRQUFFLE9BQU8sa0JBQWtCLENBQUM7SUFDbEUsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb2RlVHlwZSh0Tm9kZTogVE5vZGUsIHR5cGU6IFROb2RlVHlwZSkge1xuICBhc3NlcnREZWZpbmVkKHROb2RlLCAnc2hvdWxkIGJlIGNhbGxlZCB3aXRoIGEgVE5vZGUnKTtcbiAgYXNzZXJ0RXF1YWwodE5vZGUudHlwZSwgdHlwZSwgYHNob3VsZCBiZSBhICR7dHlwZU5hbWUodHlwZSl9YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKHROb2RlOiBUTm9kZSwgLi4udHlwZXM6IFROb2RlVHlwZVtdKSB7XG4gIGFzc2VydERlZmluZWQodE5vZGUsICdzaG91bGQgYmUgY2FsbGVkIHdpdGggYSBUTm9kZScpO1xuICBjb25zdCBmb3VuZCA9IHR5cGVzLnNvbWUodHlwZSA9PiB0Tm9kZS50eXBlID09PSB0eXBlKTtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICBmb3VuZCwgdHJ1ZSxcbiAgICAgIGBTaG91bGQgYmUgb25lIG9mICR7dHlwZXMubWFwKHR5cGVOYW1lKS5qb2luKCcsICcpfSBidXQgZ290ICR7dHlwZU5hbWUodE5vZGUudHlwZSl9YCk7XG59XG5cbmZ1bmN0aW9uIHR5cGVOYW1lKHR5cGU6IFROb2RlVHlwZSk6IHN0cmluZyB7XG4gIGlmICh0eXBlID09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSByZXR1cm4gJ1Byb2plY3Rpb24nO1xuICBpZiAodHlwZSA9PSBUTm9kZVR5cGUuQ29udGFpbmVyKSByZXR1cm4gJ0NvbnRhaW5lcic7XG4gIGlmICh0eXBlID09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHJldHVybiAnSWN1Q29udGFpbmVyJztcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLlZpZXcpIHJldHVybiAnVmlldyc7XG4gIGlmICh0eXBlID09IFROb2RlVHlwZS5FbGVtZW50KSByZXR1cm4gJ0VsZW1lbnQnO1xuICBpZiAodHlwZSA9PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikgcmV0dXJuICdFbGVtZW50Q29udGFpbmVyJztcbiAgcmV0dXJuICc8dW5rbm93bj4nO1xufVxuIl19