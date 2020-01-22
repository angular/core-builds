/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/static_styling.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @param {?} tNode The `TNode` into which the styling information should be loaded.
 * @param {?} attrs `TAttributes` containing the styling information.
 * @return {?}
 */
export function computeStaticStyling(tNode, attrs) {
    ngDevMode && assertFirstCreatePass(getLView()[TVIEW], 'Expecting to be called in first template pass only');
    /** @type {?} */
    let styles = (/** @type {?} */ (tNode.styles));
    /** @type {?} */
    let classes = (/** @type {?} */ (tNode.classes));
    /** @type {?} */
    let mode = 0;
    for (let i = 0; i < attrs.length; i++) {
        /** @type {?} */
        const value = attrs[i];
        if (typeof value === 'number') {
            mode = value;
        }
        else if (mode == 1 /* Classes */) {
            classes = concatStringsWithSpace(classes, (/** @type {?} */ (value)));
        }
        else if (mode == 2 /* Styles */) {
            /** @type {?} */
            const style = (/** @type {?} */ (value));
            /** @type {?} */
            const styleValue = (/** @type {?} */ (attrs[++i]));
            styles = concatStringsWithSpace(styles, style + ': ' + styleValue + ';');
        }
    }
    styles !== null && (tNode.styles = styles);
    classes !== null && (tNode.classes = classes);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3N0eWxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRWhELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7O0FBVWxDLE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxLQUFZLEVBQUUsS0FBa0I7SUFDbkUsU0FBUyxJQUFJLHFCQUFxQixDQUNqQixRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxvREFBb0QsQ0FBQyxDQUFDOztRQUN0RixNQUFNLEdBQWdCLG1CQUFBLEtBQUssQ0FBQyxNQUFNLEVBQWlCOztRQUNuRCxPQUFPLEdBQWdCLG1CQUFBLEtBQUssQ0FBQyxPQUFPLEVBQWlCOztRQUNyRCxJQUFJLEdBQXNCLENBQUM7SUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQy9CLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzdCLElBQUksR0FBRyxLQUFLLENBQUM7U0FDZDthQUFNLElBQUksSUFBSSxtQkFBMkIsRUFBRTtZQUMxQyxPQUFPLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxFQUFFLG1CQUFBLEtBQUssRUFBVSxDQUFDLENBQUM7U0FDNUQ7YUFBTSxJQUFJLElBQUksa0JBQTBCLEVBQUU7O2tCQUNuQyxLQUFLLEdBQUcsbUJBQUEsS0FBSyxFQUFVOztrQkFDdkIsVUFBVSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFVO1lBQ3ZDLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxHQUFHLElBQUksR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUM7U0FDMUU7S0FDRjtJQUNELE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0FBQ2hELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5cbmltcG9ydCB7Y29uY2F0U3RyaW5nc1dpdGhTcGFjZX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHthc3NlcnRGaXJzdENyZWF0ZVBhc3N9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXd9IGZyb20gJy4uL3N0YXRlJztcblxuLyoqXG4gKiBDb21wdXRlIHRoZSBzdGF0aWMgc3R5bGluZyAoY2xhc3Mvc3R5bGUpIGZyb20gYFRBdHRyaWJ1dGVzYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBiZSBjYWxsZWQgZHVyaW5nIGBmaXJzdENyZWF0ZVBhc3NgIG9ubHkuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBgVE5vZGVgIGludG8gd2hpY2ggdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24gc2hvdWxkIGJlIGxvYWRlZC5cbiAqIEBwYXJhbSBhdHRycyBgVEF0dHJpYnV0ZXNgIGNvbnRhaW5pbmcgdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3RhdGljU3R5bGluZyh0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKFxuICAgICAgICAgICAgICAgICAgIGdldExWaWV3KClbVFZJRVddLCAnRXhwZWN0aW5nIHRvIGJlIGNhbGxlZCBpbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgbGV0IHN0eWxlczogc3RyaW5nfG51bGwgPSB0Tm9kZS5zdHlsZXMgYXMgc3RyaW5nIHwgbnVsbDtcbiAgbGV0IGNsYXNzZXM6IHN0cmluZ3xudWxsID0gdE5vZGUuY2xhc3NlcyBhcyBzdHJpbmcgfCBudWxsO1xuICBsZXQgbW9kZTogQXR0cmlidXRlTWFya2VyfDAgPSAwO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IHZhbHVlO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgY2xhc3NlcyA9IGNvbmNhdFN0cmluZ3NXaXRoU3BhY2UoY2xhc3NlcywgdmFsdWUgYXMgc3RyaW5nKTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgY29uc3Qgc3R5bGUgPSB2YWx1ZSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBzdHlsZVZhbHVlID0gYXR0cnNbKytpXSBhcyBzdHJpbmc7XG4gICAgICBzdHlsZXMgPSBjb25jYXRTdHJpbmdzV2l0aFNwYWNlKHN0eWxlcywgc3R5bGUgKyAnOiAnICsgc3R5bGVWYWx1ZSArICc7Jyk7XG4gICAgfVxuICB9XG4gIHN0eWxlcyAhPT0gbnVsbCAmJiAodE5vZGUuc3R5bGVzID0gc3R5bGVzKTtcbiAgY2xhc3NlcyAhPT0gbnVsbCAmJiAodE5vZGUuY2xhc3NlcyA9IGNsYXNzZXMpO1xufSJdfQ==