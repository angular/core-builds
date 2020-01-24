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
    let styles = tNode.styles;
    /** @type {?} */
    let classes = tNode.classes;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3N0eWxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRWhELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7O0FBVWxDLE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxLQUFZLEVBQUUsS0FBa0I7SUFDbkUsU0FBUyxJQUFJLHFCQUFxQixDQUNqQixRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxvREFBb0QsQ0FBQyxDQUFDOztRQUN0RixNQUFNLEdBQWdCLEtBQUssQ0FBQyxNQUFNOztRQUNsQyxPQUFPLEdBQWdCLEtBQUssQ0FBQyxPQUFPOztRQUNwQyxJQUFJLEdBQXNCLENBQUM7SUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQy9CLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzdCLElBQUksR0FBRyxLQUFLLENBQUM7U0FDZDthQUFNLElBQUksSUFBSSxtQkFBMkIsRUFBRTtZQUMxQyxPQUFPLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxFQUFFLG1CQUFBLEtBQUssRUFBVSxDQUFDLENBQUM7U0FDNUQ7YUFBTSxJQUFJLElBQUksa0JBQTBCLEVBQUU7O2tCQUNuQyxLQUFLLEdBQUcsbUJBQUEsS0FBSyxFQUFVOztrQkFDdkIsVUFBVSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFVO1lBQ3ZDLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxHQUFHLElBQUksR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUM7U0FDMUU7S0FDRjtJQUNELE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0FBQ2hELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5cbmltcG9ydCB7Y29uY2F0U3RyaW5nc1dpdGhTcGFjZX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHthc3NlcnRGaXJzdENyZWF0ZVBhc3N9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXd9IGZyb20gJy4uL3N0YXRlJztcblxuLyoqXG4gKiBDb21wdXRlIHRoZSBzdGF0aWMgc3R5bGluZyAoY2xhc3Mvc3R5bGUpIGZyb20gYFRBdHRyaWJ1dGVzYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBiZSBjYWxsZWQgZHVyaW5nIGBmaXJzdENyZWF0ZVBhc3NgIG9ubHkuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBgVE5vZGVgIGludG8gd2hpY2ggdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24gc2hvdWxkIGJlIGxvYWRlZC5cbiAqIEBwYXJhbSBhdHRycyBgVEF0dHJpYnV0ZXNgIGNvbnRhaW5pbmcgdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3RhdGljU3R5bGluZyh0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKFxuICAgICAgICAgICAgICAgICAgIGdldExWaWV3KClbVFZJRVddLCAnRXhwZWN0aW5nIHRvIGJlIGNhbGxlZCBpbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgbGV0IHN0eWxlczogc3RyaW5nfG51bGwgPSB0Tm9kZS5zdHlsZXM7XG4gIGxldCBjbGFzc2VzOiBzdHJpbmd8bnVsbCA9IHROb2RlLmNsYXNzZXM7XG4gIGxldCBtb2RlOiBBdHRyaWJ1dGVNYXJrZXJ8MCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICBtb2RlID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBjbGFzc2VzID0gY29uY2F0U3RyaW5nc1dpdGhTcGFjZShjbGFzc2VzLCB2YWx1ZSBhcyBzdHJpbmcpO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBjb25zdCBzdHlsZSA9IHZhbHVlIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IHN0eWxlVmFsdWUgPSBhdHRyc1srK2ldIGFzIHN0cmluZztcbiAgICAgIHN0eWxlcyA9IGNvbmNhdFN0cmluZ3NXaXRoU3BhY2Uoc3R5bGVzLCBzdHlsZSArICc6ICcgKyBzdHlsZVZhbHVlICsgJzsnKTtcbiAgICB9XG4gIH1cbiAgc3R5bGVzICE9PSBudWxsICYmICh0Tm9kZS5zdHlsZXMgPSBzdHlsZXMpO1xuICBjbGFzc2VzICE9PSBudWxsICYmICh0Tm9kZS5jbGFzc2VzID0gY2xhc3Nlcyk7XG59Il19