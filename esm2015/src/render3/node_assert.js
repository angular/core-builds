/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined, assertEqual } from './assert';
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
    const found = types.some(type => tNode.type === type);
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
    if (type == 2 /* View */)
        return 'View';
    if (type == 3 /* Element */)
        return 'Element';
    if (type == 4 /* ElementContainer */)
        return 'ElementContainer';
    return '<unknown>';
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9hc3NlcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7OztBQUdwRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVksRUFBRSxJQUFlO0lBQzFELGFBQWEsQ0FBQyxLQUFLLEVBQUUsK0JBQStCLENBQUMsQ0FBQztJQUN0RCxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsZUFBZSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQ2hFOzs7Ozs7QUFFRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsS0FBWSxFQUFFLEdBQUcsS0FBa0I7SUFDM0UsYUFBYSxDQUFDLEtBQUssRUFBRSwrQkFBK0IsQ0FBQyxDQUFDOztJQUN0RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztJQUN0RCxXQUFXLENBQ1AsS0FBSyxFQUFFLElBQUksRUFDWCxvQkFBb0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDM0Y7Ozs7O0FBRUQsU0FBUyxRQUFRLENBQUMsSUFBZTtJQUMvQixJQUFJLElBQUksc0JBQXdCO1FBQUUsT0FBTyxZQUFZLENBQUM7SUFDdEQsSUFBSSxJQUFJLHFCQUF1QjtRQUFFLE9BQU8sV0FBVyxDQUFDO0lBQ3BELElBQUksSUFBSSxnQkFBa0I7UUFBRSxPQUFPLE1BQU0sQ0FBQztJQUMxQyxJQUFJLElBQUksbUJBQXFCO1FBQUUsT0FBTyxTQUFTLENBQUM7SUFDaEQsSUFBSSxJQUFJLDRCQUE4QjtRQUFFLE9BQU8sa0JBQWtCLENBQUM7SUFDbEUsT0FBTyxXQUFXLENBQUM7Q0FDcEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vZGVUeXBlKHROb2RlOiBUTm9kZSwgdHlwZTogVE5vZGVUeXBlKSB7XG4gIGFzc2VydERlZmluZWQodE5vZGUsICdzaG91bGQgYmUgY2FsbGVkIHdpdGggYSBUTm9kZScpO1xuICBhc3NlcnRFcXVhbCh0Tm9kZS50eXBlLCB0eXBlLCBgc2hvdWxkIGJlIGEgJHt0eXBlTmFtZSh0eXBlKX1gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModE5vZGU6IFROb2RlLCAuLi50eXBlczogVE5vZGVUeXBlW10pIHtcbiAgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ3Nob3VsZCBiZSBjYWxsZWQgd2l0aCBhIFROb2RlJyk7XG4gIGNvbnN0IGZvdW5kID0gdHlwZXMuc29tZSh0eXBlID0+IHROb2RlLnR5cGUgPT09IHR5cGUpO1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGZvdW5kLCB0cnVlLFxuICAgICAgYFNob3VsZCBiZSBvbmUgb2YgJHt0eXBlcy5tYXAodHlwZU5hbWUpLmpvaW4oJywgJyl9IGJ1dCBnb3QgJHt0eXBlTmFtZSh0Tm9kZS50eXBlKX1gKTtcbn1cblxuZnVuY3Rpb24gdHlwZU5hbWUodHlwZTogVE5vZGVUeXBlKTogc3RyaW5nIHtcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHJldHVybiAnUHJvamVjdGlvbic7XG4gIGlmICh0eXBlID09IFROb2RlVHlwZS5Db250YWluZXIpIHJldHVybiAnQ29udGFpbmVyJztcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLlZpZXcpIHJldHVybiAnVmlldyc7XG4gIGlmICh0eXBlID09IFROb2RlVHlwZS5FbGVtZW50KSByZXR1cm4gJ0VsZW1lbnQnO1xuICBpZiAodHlwZSA9PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikgcmV0dXJuICdFbGVtZW50Q29udGFpbmVyJztcbiAgcmV0dXJuICc8dW5rbm93bj4nO1xufVxuIl19