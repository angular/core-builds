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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3N0eWxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztFQU1FO0FBRUYsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRWhELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWxDOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsS0FBWSxFQUFFLEtBQWtCO0lBQ25FLFNBQVMsSUFBSSxxQkFBcUIsQ0FDakIsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsb0RBQW9ELENBQUMsQ0FBQztJQUMxRixJQUFJLE1BQU0sR0FBZ0IsS0FBSyxDQUFDLE1BQXVCLENBQUM7SUFDeEQsSUFBSSxPQUFPLEdBQWdCLEtBQUssQ0FBQyxPQUF3QixDQUFDO0lBQzFELElBQUksSUFBSSxHQUFzQixDQUFDLENBQUM7SUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDckMsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzdCLElBQUksR0FBRyxLQUFLLENBQUM7U0FDZDthQUFNLElBQUksSUFBSSxtQkFBMkIsRUFBRTtZQUMxQyxPQUFPLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxFQUFFLEtBQWUsQ0FBQyxDQUFDO1NBQzVEO2FBQU0sSUFBSSxJQUFJLGtCQUEwQixFQUFFO1lBQ3pDLElBQU0sS0FBSyxHQUFHLEtBQWUsQ0FBQztZQUM5QixJQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQVcsQ0FBQztZQUN4QyxNQUFNLEdBQUcsc0JBQXNCLENBQUMsTUFBTSxFQUFFLEtBQUssR0FBRyxJQUFJLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQzFFO0tBQ0Y7SUFDRCxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQztJQUMzQyxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQztBQUNoRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuXG5pbXBvcnQge2NvbmNhdFN0cmluZ3NXaXRoU3BhY2V9IGZyb20gJy4uLy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7YXNzZXJ0Rmlyc3RDcmVhdGVQYXNzfSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7VFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3fSBmcm9tICcuLi9zdGF0ZSc7XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgc3RhdGljIHN0eWxpbmcgKGNsYXNzL3N0eWxlKSBmcm9tIGBUQXR0cmlidXRlc2AuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgY2FsbGVkIGR1cmluZyBgZmlyc3RDcmVhdGVQYXNzYCBvbmx5LlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgYFROb2RlYCBpbnRvIHdoaWNoIHRoZSBzdHlsaW5nIGluZm9ybWF0aW9uIHNob3VsZCBiZSBsb2FkZWQuXG4gKiBAcGFyYW0gYXR0cnMgYFRBdHRyaWJ1dGVzYCBjb250YWluaW5nIHRoZSBzdHlsaW5nIGluZm9ybWF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZVN0YXRpY1N0eWxpbmcodE5vZGU6IFROb2RlLCBhdHRyczogVEF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgICAgICAgICBnZXRMVmlldygpW1RWSUVXXSwgJ0V4cGVjdGluZyB0byBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGxldCBzdHlsZXM6IHN0cmluZ3xudWxsID0gdE5vZGUuc3R5bGVzIGFzIHN0cmluZyB8IG51bGw7XG4gIGxldCBjbGFzc2VzOiBzdHJpbmd8bnVsbCA9IHROb2RlLmNsYXNzZXMgYXMgc3RyaW5nIHwgbnVsbDtcbiAgbGV0IG1vZGU6IEF0dHJpYnV0ZU1hcmtlcnwwID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbaV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSB2YWx1ZTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXMgPSBjb25jYXRTdHJpbmdzV2l0aFNwYWNlKGNsYXNzZXMsIHZhbHVlIGFzIHN0cmluZyk7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgIGNvbnN0IHN0eWxlID0gdmFsdWUgYXMgc3RyaW5nO1xuICAgICAgY29uc3Qgc3R5bGVWYWx1ZSA9IGF0dHJzWysraV0gYXMgc3RyaW5nO1xuICAgICAgc3R5bGVzID0gY29uY2F0U3RyaW5nc1dpdGhTcGFjZShzdHlsZXMsIHN0eWxlICsgJzogJyArIHN0eWxlVmFsdWUgKyAnOycpO1xuICAgIH1cbiAgfVxuICBzdHlsZXMgIT09IG51bGwgJiYgKHROb2RlLnN0eWxlcyA9IHN0eWxlcyk7XG4gIGNsYXNzZXMgIT09IG51bGwgJiYgKHROb2RlLmNsYXNzZXMgPSBjbGFzc2VzKTtcbn0iXX0=