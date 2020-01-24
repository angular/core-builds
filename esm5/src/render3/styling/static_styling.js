/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { concatStringsWithSpace } from '../../util/stringify';
import { assertFirstCreatePass } from '../assert';
import { TVIEW } from '../interfaces/view';
import { getLView } from '../state';
/**
 * Compute the static styling (class/style) from `TAttributes`.
 *
 * This function should be called during `firstCreatePass` only.
 *
 * @param tNode The `TNode` into which the styling information should be loaded.
 * @param attrs `TAttributes` containing the styling information.
 */
export function computeStaticStyling(tNode, attrs) {
    ngDevMode && assertFirstCreatePass(getLView()[TVIEW], 'Expecting to be called in first template pass only');
    var styles = tNode.styles;
    var classes = tNode.classes;
    var mode = 0;
    for (var i = 0; i < attrs.length; i++) {
        var value = attrs[i];
        if (typeof value === 'number') {
            mode = value;
        }
        else if (mode == 1 /* Classes */) {
            classes = concatStringsWithSpace(classes, value);
        }
        else if (mode == 2 /* Styles */) {
            var style = value;
            var styleValue = attrs[++i];
            styles = concatStringsWithSpace(styles, style + ': ' + styleValue + ';');
        }
    }
    styles !== null && (tNode.styles = styles);
    classes !== null && (tNode.classes = classes);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3N0eWxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztFQU1FO0FBRUYsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRWhELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWxDOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsS0FBWSxFQUFFLEtBQWtCO0lBQ25FLFNBQVMsSUFBSSxxQkFBcUIsQ0FDakIsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsb0RBQW9ELENBQUMsQ0FBQztJQUMxRixJQUFJLE1BQU0sR0FBZ0IsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUN2QyxJQUFJLE9BQU8sR0FBZ0IsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUN6QyxJQUFJLElBQUksR0FBc0IsQ0FBQyxDQUFDO0lBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3JDLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUM3QixJQUFJLEdBQUcsS0FBSyxDQUFDO1NBQ2Q7YUFBTSxJQUFJLElBQUksbUJBQTJCLEVBQUU7WUFDMUMsT0FBTyxHQUFHLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxLQUFlLENBQUMsQ0FBQztTQUM1RDthQUFNLElBQUksSUFBSSxrQkFBMEIsRUFBRTtZQUN6QyxJQUFNLEtBQUssR0FBRyxLQUFlLENBQUM7WUFDOUIsSUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFXLENBQUM7WUFDeEMsTUFBTSxHQUFHLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsSUFBSSxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQztTQUMxRTtLQUNGO0lBQ0QsTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFDM0MsT0FBTyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUM7QUFDaEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtjb25jYXRTdHJpbmdzV2l0aFNwYWNlfSBmcm9tICcuLi8uLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzc30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1RWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlld30gZnJvbSAnLi4vc3RhdGUnO1xuXG4vKipcbiAqIENvbXB1dGUgdGhlIHN0YXRpYyBzdHlsaW5nIChjbGFzcy9zdHlsZSkgZnJvbSBgVEF0dHJpYnV0ZXNgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGJlIGNhbGxlZCBkdXJpbmcgYGZpcnN0Q3JlYXRlUGFzc2Agb25seS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIGBUTm9kZWAgaW50byB3aGljaCB0aGUgc3R5bGluZyBpbmZvcm1hdGlvbiBzaG91bGQgYmUgbG9hZGVkLlxuICogQHBhcmFtIGF0dHJzIGBUQXR0cmlidXRlc2AgY29udGFpbmluZyB0aGUgc3R5bGluZyBpbmZvcm1hdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVTdGF0aWNTdHlsaW5nKHROb2RlOiBUTm9kZSwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICAgICAgICAgZ2V0TFZpZXcoKVtUVklFV10sICdFeHBlY3RpbmcgdG8gYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICBsZXQgc3R5bGVzOiBzdHJpbmd8bnVsbCA9IHROb2RlLnN0eWxlcztcbiAgbGV0IGNsYXNzZXM6IHN0cmluZ3xudWxsID0gdE5vZGUuY2xhc3NlcztcbiAgbGV0IG1vZGU6IEF0dHJpYnV0ZU1hcmtlcnwwID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbaV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSB2YWx1ZTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXMgPSBjb25jYXRTdHJpbmdzV2l0aFNwYWNlKGNsYXNzZXMsIHZhbHVlIGFzIHN0cmluZyk7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgIGNvbnN0IHN0eWxlID0gdmFsdWUgYXMgc3RyaW5nO1xuICAgICAgY29uc3Qgc3R5bGVWYWx1ZSA9IGF0dHJzWysraV0gYXMgc3RyaW5nO1xuICAgICAgc3R5bGVzID0gY29uY2F0U3RyaW5nc1dpdGhTcGFjZShzdHlsZXMsIHN0eWxlICsgJzogJyArIHN0eWxlVmFsdWUgKyAnOycpO1xuICAgIH1cbiAgfVxuICBzdHlsZXMgIT09IG51bGwgJiYgKHROb2RlLnN0eWxlcyA9IHN0eWxlcyk7XG4gIGNsYXNzZXMgIT09IG51bGwgJiYgKHROb2RlLmNsYXNzZXMgPSBjbGFzc2VzKTtcbn0iXX0=