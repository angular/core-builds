/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertNotNull } from './assert';
/**
 * @param {?} node
 * @param {?} type
 * @return {?}
 */
export function assertNodeType(node, type) {
    assertNotNull(node, 'should be called with a node');
    assertEqual(node.type, type, `should be a ${typeName(type)}`);
}
/**
 * @param {?} node
 * @param {...?} types
 * @return {?}
 */
export function assertNodeOfPossibleTypes(node, ...types) {
    assertNotNull(node, 'should be called with a node');
    const /** @type {?} */ found = types.some(type => node.type === type);
    assertEqual(found, true, `Should be one of ${types.map(typeName).join(', ')}`);
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
    return '<unknown>';
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9hc3NlcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7OztBQUdwRCxNQUFNLHlCQUF5QixJQUFXLEVBQUUsSUFBZTtJQUN6RCxhQUFhLENBQUMsSUFBSSxFQUFFLDhCQUE4QixDQUFDLENBQUM7SUFDcEQsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLGVBQWUsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztDQUMvRDs7Ozs7O0FBRUQsTUFBTSxvQ0FBb0MsSUFBVyxFQUFFLEdBQUcsS0FBa0I7SUFDMUUsYUFBYSxDQUFDLElBQUksRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3BELHVCQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztJQUNyRCxXQUFXLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxvQkFBb0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQ2hGOzs7OztBQUVELGtCQUFrQixJQUFlO0lBQy9CLElBQUksSUFBSSxzQkFBd0I7UUFBRSxPQUFPLFlBQVksQ0FBQztJQUN0RCxJQUFJLElBQUkscUJBQXVCO1FBQUUsT0FBTyxXQUFXLENBQUM7SUFDcEQsSUFBSSxJQUFJLGdCQUFrQjtRQUFFLE9BQU8sTUFBTSxDQUFDO0lBQzFDLElBQUksSUFBSSxtQkFBcUI7UUFBRSxPQUFPLFNBQVMsQ0FBQztJQUNoRCxPQUFPLFdBQVcsQ0FBQztDQUNwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRFcXVhbCwgYXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMTm9kZSwgTE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb2RlVHlwZShub2RlOiBMTm9kZSwgdHlwZTogTE5vZGVUeXBlKSB7XG4gIGFzc2VydE5vdE51bGwobm9kZSwgJ3Nob3VsZCBiZSBjYWxsZWQgd2l0aCBhIG5vZGUnKTtcbiAgYXNzZXJ0RXF1YWwobm9kZS50eXBlLCB0eXBlLCBgc2hvdWxkIGJlIGEgJHt0eXBlTmFtZSh0eXBlKX1gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMobm9kZTogTE5vZGUsIC4uLnR5cGVzOiBMTm9kZVR5cGVbXSkge1xuICBhc3NlcnROb3ROdWxsKG5vZGUsICdzaG91bGQgYmUgY2FsbGVkIHdpdGggYSBub2RlJyk7XG4gIGNvbnN0IGZvdW5kID0gdHlwZXMuc29tZSh0eXBlID0+IG5vZGUudHlwZSA9PT0gdHlwZSk7XG4gIGFzc2VydEVxdWFsKGZvdW5kLCB0cnVlLCBgU2hvdWxkIGJlIG9uZSBvZiAke3R5cGVzLm1hcCh0eXBlTmFtZSkuam9pbignLCAnKX1gKTtcbn1cblxuZnVuY3Rpb24gdHlwZU5hbWUodHlwZTogTE5vZGVUeXBlKTogc3RyaW5nIHtcbiAgaWYgKHR5cGUgPT0gTE5vZGVUeXBlLlByb2plY3Rpb24pIHJldHVybiAnUHJvamVjdGlvbic7XG4gIGlmICh0eXBlID09IExOb2RlVHlwZS5Db250YWluZXIpIHJldHVybiAnQ29udGFpbmVyJztcbiAgaWYgKHR5cGUgPT0gTE5vZGVUeXBlLlZpZXcpIHJldHVybiAnVmlldyc7XG4gIGlmICh0eXBlID09IExOb2RlVHlwZS5FbGVtZW50KSByZXR1cm4gJ0VsZW1lbnQnO1xuICByZXR1cm4gJzx1bmtub3duPic7XG59XG4iXX0=