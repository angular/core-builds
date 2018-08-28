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
 * @param {?} node
 * @param {?} type
 * @return {?}
 */
export function assertNodeType(node, type) {
    assertDefined(node, 'should be called with a node');
    assertEqual(node.tNode.type, type, `should be a ${typeName(type)}`);
}
/**
 * @param {?} node
 * @param {...?} types
 * @return {?}
 */
export function assertNodeOfPossibleTypes(node, ...types) {
    assertDefined(node, 'should be called with a node');
    /** @type {?} */
    const found = types.some(type => node.tNode.type === type);
    assertEqual(found, true, `Should be one of ${types.map(typeName).join(', ')} but got ${typeName(node.tNode.type)}`);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9hc3NlcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7OztBQUdwRCxNQUFNLFVBQVUsY0FBYyxDQUFDLElBQVcsRUFBRSxJQUFlO0lBQ3pELGFBQWEsQ0FBQyxJQUFJLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUNwRCxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLGVBQWUsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztDQUNyRTs7Ozs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLElBQVcsRUFBRSxHQUFHLEtBQWtCO0lBQzFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsOEJBQThCLENBQUMsQ0FBQzs7SUFDcEQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDO0lBQzNELFdBQVcsQ0FDUCxLQUFLLEVBQUUsSUFBSSxFQUNYLG9CQUFvQixLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDaEc7Ozs7O0FBRUQsU0FBUyxRQUFRLENBQUMsSUFBZTtJQUMvQixJQUFJLElBQUksc0JBQXdCO1FBQUUsT0FBTyxZQUFZLENBQUM7SUFDdEQsSUFBSSxJQUFJLHFCQUF1QjtRQUFFLE9BQU8sV0FBVyxDQUFDO0lBQ3BELElBQUksSUFBSSxnQkFBa0I7UUFBRSxPQUFPLE1BQU0sQ0FBQztJQUMxQyxJQUFJLElBQUksbUJBQXFCO1FBQUUsT0FBTyxTQUFTLENBQUM7SUFDaEQsSUFBSSxJQUFJLDRCQUE4QjtRQUFFLE9BQU8sa0JBQWtCLENBQUM7SUFDbEUsT0FBTyxXQUFXLENBQUM7Q0FDcEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm9kZVR5cGUobm9kZTogTE5vZGUsIHR5cGU6IFROb2RlVHlwZSkge1xuICBhc3NlcnREZWZpbmVkKG5vZGUsICdzaG91bGQgYmUgY2FsbGVkIHdpdGggYSBub2RlJyk7XG4gIGFzc2VydEVxdWFsKG5vZGUudE5vZGUudHlwZSwgdHlwZSwgYHNob3VsZCBiZSBhICR7dHlwZU5hbWUodHlwZSl9YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKG5vZGU6IExOb2RlLCAuLi50eXBlczogVE5vZGVUeXBlW10pIHtcbiAgYXNzZXJ0RGVmaW5lZChub2RlLCAnc2hvdWxkIGJlIGNhbGxlZCB3aXRoIGEgbm9kZScpO1xuICBjb25zdCBmb3VuZCA9IHR5cGVzLnNvbWUodHlwZSA9PiBub2RlLnROb2RlLnR5cGUgPT09IHR5cGUpO1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGZvdW5kLCB0cnVlLFxuICAgICAgYFNob3VsZCBiZSBvbmUgb2YgJHt0eXBlcy5tYXAodHlwZU5hbWUpLmpvaW4oJywgJyl9IGJ1dCBnb3QgJHt0eXBlTmFtZShub2RlLnROb2RlLnR5cGUpfWApO1xufVxuXG5mdW5jdGlvbiB0eXBlTmFtZSh0eXBlOiBUTm9kZVR5cGUpOiBzdHJpbmcge1xuICBpZiAodHlwZSA9PSBUTm9kZVR5cGUuUHJvamVjdGlvbikgcmV0dXJuICdQcm9qZWN0aW9uJztcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikgcmV0dXJuICdDb250YWluZXInO1xuICBpZiAodHlwZSA9PSBUTm9kZVR5cGUuVmlldykgcmV0dXJuICdWaWV3JztcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHJldHVybiAnRWxlbWVudCc7XG4gIGlmICh0eXBlID09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSByZXR1cm4gJ0VsZW1lbnRDb250YWluZXInO1xuICByZXR1cm4gJzx1bmtub3duPic7XG59XG4iXX0=