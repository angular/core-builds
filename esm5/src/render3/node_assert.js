/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined, assertEqual } from './assert';
export function assertNodeType(node, type) {
    assertDefined(node, 'should be called with a node');
    assertEqual(node.tNode.type, type, "should be a " + typeName(type));
}
export function assertNodeOfPossibleTypes(node) {
    var types = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        types[_i - 1] = arguments[_i];
    }
    assertDefined(node, 'should be called with a node');
    var found = types.some(function (type) { return node.tNode.type === type; });
    assertEqual(found, true, "Should be one of " + types.map(typeName).join(', ') + " but got " + typeName(node.tNode.type));
}
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9hc3NlcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR3BELE1BQU0seUJBQXlCLElBQVcsRUFBRSxJQUFlO0lBQ3pELGFBQWEsQ0FBQyxJQUFJLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUNwRCxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLGlCQUFlLFFBQVEsQ0FBQyxJQUFJLENBQUcsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFFRCxNQUFNLG9DQUFvQyxJQUFXO0lBQUUsZUFBcUI7U0FBckIsVUFBcUIsRUFBckIscUJBQXFCLEVBQXJCLElBQXFCO1FBQXJCLDhCQUFxQjs7SUFDMUUsYUFBYSxDQUFDLElBQUksRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3BELElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQXhCLENBQXdCLENBQUMsQ0FBQztJQUMzRCxXQUFXLENBQ1AsS0FBSyxFQUFFLElBQUksRUFDWCxzQkFBb0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFZLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUM7QUFDakcsQ0FBQztBQUVELGtCQUFrQixJQUFlO0lBQy9CLElBQUksSUFBSSxzQkFBd0I7UUFBRSxPQUFPLFlBQVksQ0FBQztJQUN0RCxJQUFJLElBQUkscUJBQXVCO1FBQUUsT0FBTyxXQUFXLENBQUM7SUFDcEQsSUFBSSxJQUFJLGdCQUFrQjtRQUFFLE9BQU8sTUFBTSxDQUFDO0lBQzFDLElBQUksSUFBSSxtQkFBcUI7UUFBRSxPQUFPLFNBQVMsQ0FBQztJQUNoRCxJQUFJLElBQUksNEJBQThCO1FBQUUsT0FBTyxrQkFBa0IsQ0FBQztJQUNsRSxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xOb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vZGVUeXBlKG5vZGU6IExOb2RlLCB0eXBlOiBUTm9kZVR5cGUpIHtcbiAgYXNzZXJ0RGVmaW5lZChub2RlLCAnc2hvdWxkIGJlIGNhbGxlZCB3aXRoIGEgbm9kZScpO1xuICBhc3NlcnRFcXVhbChub2RlLnROb2RlLnR5cGUsIHR5cGUsIGBzaG91bGQgYmUgYSAke3R5cGVOYW1lKHR5cGUpfWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhub2RlOiBMTm9kZSwgLi4udHlwZXM6IFROb2RlVHlwZVtdKSB7XG4gIGFzc2VydERlZmluZWQobm9kZSwgJ3Nob3VsZCBiZSBjYWxsZWQgd2l0aCBhIG5vZGUnKTtcbiAgY29uc3QgZm91bmQgPSB0eXBlcy5zb21lKHR5cGUgPT4gbm9kZS50Tm9kZS50eXBlID09PSB0eXBlKTtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICBmb3VuZCwgdHJ1ZSxcbiAgICAgIGBTaG91bGQgYmUgb25lIG9mICR7dHlwZXMubWFwKHR5cGVOYW1lKS5qb2luKCcsICcpfSBidXQgZ290ICR7dHlwZU5hbWUobm9kZS50Tm9kZS50eXBlKX1gKTtcbn1cblxuZnVuY3Rpb24gdHlwZU5hbWUodHlwZTogVE5vZGVUeXBlKTogc3RyaW5nIHtcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHJldHVybiAnUHJvamVjdGlvbic7XG4gIGlmICh0eXBlID09IFROb2RlVHlwZS5Db250YWluZXIpIHJldHVybiAnQ29udGFpbmVyJztcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLlZpZXcpIHJldHVybiAnVmlldyc7XG4gIGlmICh0eXBlID09IFROb2RlVHlwZS5FbGVtZW50KSByZXR1cm4gJ0VsZW1lbnQnO1xuICBpZiAodHlwZSA9PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikgcmV0dXJuICdFbGVtZW50Q29udGFpbmVyJztcbiAgcmV0dXJuICc8dW5rbm93bj4nO1xufVxuIl19