/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { concatStringsWithSpace } from '../../util/stringify';
import { assertFirstCreatePass } from '../assert';
import { getTView } from '../state';
/**
 * Compute the static styling (class/style) from `TAttributes`.
 *
 * This function should be called during `firstCreatePass` only.
 *
 * @param tNode The `TNode` into which the styling information should be loaded.
 * @param attrs `TAttributes` containing the styling information.
 * @param writeToHost Where should the resulting static styles be written?
 *   - `false` Write to `TNode.stylesWithoutHost` / `TNode.classesWithoutHost`
 *   - `true` Write to `TNode.styles` / `TNode.classes`
 */
export function computeStaticStyling(tNode, attrs, writeToHost) {
    ngDevMode &&
        assertFirstCreatePass(getTView(), 'Expecting to be called in first template pass only');
    let styles = writeToHost ? tNode.styles : null;
    let classes = writeToHost ? tNode.classes : null;
    let mode = 0;
    if (attrs !== null) {
        for (let i = 0; i < attrs.length; i++) {
            const value = attrs[i];
            if (typeof value === 'number') {
                mode = value;
            }
            else if (mode == 1 /* AttributeMarker.Classes */) {
                classes = concatStringsWithSpace(classes, value);
            }
            else if (mode == 2 /* AttributeMarker.Styles */) {
                const style = value;
                const styleValue = attrs[++i];
                styles = concatStringsWithSpace(styles, style + ': ' + styleValue + ';');
            }
        }
    }
    writeToHost ? tNode.styles = styles : tNode.stylesWithoutHost = styles;
    writeToHost ? tNode.classes = classes : tNode.classesWithoutHost = classes;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3N0eWxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRWhELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFbEM7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsS0FBWSxFQUFFLEtBQXVCLEVBQUUsV0FBb0I7SUFDN0QsU0FBUztRQUNMLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxFQUFFLG9EQUFvRCxDQUFDLENBQUM7SUFDNUYsSUFBSSxNQUFNLEdBQWdCLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQzVELElBQUksT0FBTyxHQUFnQixXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUM5RCxJQUFJLElBQUksR0FBc0IsQ0FBQyxDQUFDO0lBQ2hDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ25CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzlCLElBQUksR0FBRyxLQUFLLENBQUM7WUFDZixDQUFDO2lCQUFNLElBQUksSUFBSSxtQ0FBMkIsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxFQUFFLEtBQWUsQ0FBQyxDQUFDO1lBQzdELENBQUM7aUJBQU0sSUFBSSxJQUFJLGtDQUEwQixFQUFFLENBQUM7Z0JBQzFDLE1BQU0sS0FBSyxHQUFHLEtBQWUsQ0FBQztnQkFDOUIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFXLENBQUM7Z0JBQ3hDLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxHQUFHLElBQUksR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDM0UsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBQ0QsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQztJQUN2RSxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsT0FBTyxDQUFDO0FBQzdFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb25jYXRTdHJpbmdzV2l0aFNwYWNlfSBmcm9tICcuLi8uLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzc30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2dldFRWaWV3fSBmcm9tICcuLi9zdGF0ZSc7XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgc3RhdGljIHN0eWxpbmcgKGNsYXNzL3N0eWxlKSBmcm9tIGBUQXR0cmlidXRlc2AuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgY2FsbGVkIGR1cmluZyBgZmlyc3RDcmVhdGVQYXNzYCBvbmx5LlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgYFROb2RlYCBpbnRvIHdoaWNoIHRoZSBzdHlsaW5nIGluZm9ybWF0aW9uIHNob3VsZCBiZSBsb2FkZWQuXG4gKiBAcGFyYW0gYXR0cnMgYFRBdHRyaWJ1dGVzYCBjb250YWluaW5nIHRoZSBzdHlsaW5nIGluZm9ybWF0aW9uLlxuICogQHBhcmFtIHdyaXRlVG9Ib3N0IFdoZXJlIHNob3VsZCB0aGUgcmVzdWx0aW5nIHN0YXRpYyBzdHlsZXMgYmUgd3JpdHRlbj9cbiAqICAgLSBgZmFsc2VgIFdyaXRlIHRvIGBUTm9kZS5zdHlsZXNXaXRob3V0SG9zdGAgLyBgVE5vZGUuY2xhc3Nlc1dpdGhvdXRIb3N0YFxuICogICAtIGB0cnVlYCBXcml0ZSB0byBgVE5vZGUuc3R5bGVzYCAvIGBUTm9kZS5jbGFzc2VzYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZVN0YXRpY1N0eWxpbmcoXG4gICAgdE5vZGU6IFROb2RlLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCwgd3JpdGVUb0hvc3Q6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoZ2V0VFZpZXcoKSwgJ0V4cGVjdGluZyB0byBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGxldCBzdHlsZXM6IHN0cmluZ3xudWxsID0gd3JpdGVUb0hvc3QgPyB0Tm9kZS5zdHlsZXMgOiBudWxsO1xuICBsZXQgY2xhc3Nlczogc3RyaW5nfG51bGwgPSB3cml0ZVRvSG9zdCA/IHROb2RlLmNsYXNzZXMgOiBudWxsO1xuICBsZXQgbW9kZTogQXR0cmlidXRlTWFya2VyfDAgPSAwO1xuICBpZiAoYXR0cnMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2ldO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgbW9kZSA9IHZhbHVlO1xuICAgICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICAgIGNsYXNzZXMgPSBjb25jYXRTdHJpbmdzV2l0aFNwYWNlKGNsYXNzZXMsIHZhbHVlIGFzIHN0cmluZyk7XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgICBjb25zdCBzdHlsZSA9IHZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgY29uc3Qgc3R5bGVWYWx1ZSA9IGF0dHJzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICBzdHlsZXMgPSBjb25jYXRTdHJpbmdzV2l0aFNwYWNlKHN0eWxlcywgc3R5bGUgKyAnOiAnICsgc3R5bGVWYWx1ZSArICc7Jyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHdyaXRlVG9Ib3N0ID8gdE5vZGUuc3R5bGVzID0gc3R5bGVzIDogdE5vZGUuc3R5bGVzV2l0aG91dEhvc3QgPSBzdHlsZXM7XG4gIHdyaXRlVG9Ib3N0ID8gdE5vZGUuY2xhc3NlcyA9IGNsYXNzZXMgOiB0Tm9kZS5jbGFzc2VzV2l0aG91dEhvc3QgPSBjbGFzc2VzO1xufVxuIl19