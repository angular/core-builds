/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { bindingUpdated } from '../bindings';
import { RENDERER } from '../interfaces/view';
import { isWritableSignal } from '../reactivity/signal';
import { getCurrentTNode, getLView, getSelectedTNode, getTView, nextBindingIndex } from '../state';
import { listenerInternal } from './listener';
import { elementPropertyInternal, storePropertyBindingMetadata } from './shared';
/**
 * Update a two-way bound property on a selected element.
 *
 * Operates on the element selected by index via the {@link select} instruction.
 *
 * @param propName Name of property.
 * @param value New value to write.
 * @param sanitizer An optional function used to sanitize the value.
 * @returns This function returns itself so that it may be chained
 * (e.g. `twoWayProperty('name', ctx.name)('title', ctx.title)`)
 *
 * @codeGenApi
 */
export function ɵɵtwoWayProperty(propName, value, sanitizer) {
    // TODO(crisbeto): perf impact of re-evaluating this on each change detection?
    if (isWritableSignal(value)) {
        value = value();
    }
    const lView = getLView();
    const bindingIndex = nextBindingIndex();
    if (bindingUpdated(lView, bindingIndex, value)) {
        const tView = getTView();
        const tNode = getSelectedTNode();
        elementPropertyInternal(tView, tNode, lView, propName, value, lView[RENDERER], sanitizer, false);
        ngDevMode && storePropertyBindingMetadata(tView.data, tNode, propName, bindingIndex);
    }
    return ɵɵtwoWayProperty;
}
/**
 * Function used inside two-way listeners to conditionally set the value of the bound expression.
 *
 * @param target Field on which to set the value.
 * @param value Value to be set to the field.
 *
 * @codeGenApi
 */
export function ɵɵtwoWayBindingSet(target, value) {
    const canWrite = isWritableSignal(target);
    canWrite && target.set(value);
    return canWrite;
}
/**
 * Adds an event listener that updates a two-way binding to the current node.
 *
 * @param eventName Name of the event.
 * @param listenerFn The function to be called when event emits.
 *
 * @codeGenApi
 */
export function ɵɵtwoWayListener(eventName, listenerFn) {
    const lView = getLView();
    const tView = getTView();
    const tNode = getCurrentTNode();
    listenerInternal(tView, lView, lView[RENDERER], tNode, eventName, listenerFn);
    return ɵɵtwoWayListener;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdvX3dheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3R3b193YXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUUzQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUMsT0FBTyxFQUFDLGdCQUFnQixFQUFpQixNQUFNLHNCQUFzQixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVqRyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDNUMsT0FBTyxFQUFDLHVCQUF1QixFQUFFLDRCQUE0QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRS9FOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDOUIsUUFBZ0IsRUFDaEIsS0FBNEIsRUFDNUIsU0FBOEI7SUFFOUIsOEVBQThFO0lBQzlFLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUM1QixLQUFLLEdBQUcsS0FBSyxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixFQUFFLENBQUM7SUFDeEMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQy9DLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDakMsdUJBQXVCLENBQ3JCLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxFQUNMLFFBQVEsRUFDUixLQUFLLEVBQ0wsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUNmLFNBQVMsRUFDVCxLQUFLLENBQ04sQ0FBQztRQUNGLFNBQVMsSUFBSSw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDdkYsQ0FBQztJQUVELE9BQU8sZ0JBQWdCLENBQUM7QUFDMUIsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUksTUFBZSxFQUFFLEtBQVE7SUFDN0QsTUFBTSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQzlCLFNBQWlCLEVBQ2pCLFVBQTRCO0lBRTVCLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBYSxDQUFDO0lBQ3BDLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDOUUsT0FBTyxnQkFBZ0IsQ0FBQztBQUMxQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7UkVOREVSRVJ9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2lzV3JpdGFibGVTaWduYWwsIFdyaXRhYmxlU2lnbmFsfSBmcm9tICcuLi9yZWFjdGl2aXR5L3NpZ25hbCc7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkVE5vZGUsIGdldFRWaWV3LCBuZXh0QmluZGluZ0luZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5cbmltcG9ydCB7bGlzdGVuZXJJbnRlcm5hbH0gZnJvbSAnLi9saXN0ZW5lcic7XG5pbXBvcnQge2VsZW1lbnRQcm9wZXJ0eUludGVybmFsLCBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhfSBmcm9tICcuL3NoYXJlZCc7XG5cbi8qKlxuICogVXBkYXRlIGEgdHdvLXdheSBib3VuZCBwcm9wZXJ0eSBvbiBhIHNlbGVjdGVkIGVsZW1lbnQuXG4gKlxuICogT3BlcmF0ZXMgb24gdGhlIGVsZW1lbnQgc2VsZWN0ZWQgYnkgaW5kZXggdmlhIHRoZSB7QGxpbmsgc2VsZWN0fSBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICogQHJldHVybnMgVGhpcyBmdW5jdGlvbiByZXR1cm5zIGl0c2VsZiBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkXG4gKiAoZS5nLiBgdHdvV2F5UHJvcGVydHkoJ25hbWUnLCBjdHgubmFtZSkoJ3RpdGxlJywgY3R4LnRpdGxlKWApXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV0d29XYXlQcm9wZXJ0eTxUPihcbiAgcHJvcE5hbWU6IHN0cmluZyxcbiAgdmFsdWU6IFQgfCBXcml0YWJsZVNpZ25hbDxUPixcbiAgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuKTogdHlwZW9mIMm1ybV0d29XYXlQcm9wZXJ0eSB7XG4gIC8vIFRPRE8oY3Jpc2JldG8pOiBwZXJmIGltcGFjdCBvZiByZS1ldmFsdWF0aW5nIHRoaXMgb24gZWFjaCBjaGFuZ2UgZGV0ZWN0aW9uP1xuICBpZiAoaXNXcml0YWJsZVNpZ25hbCh2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IHZhbHVlKCk7XG4gIH1cblxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHZhbHVlKSkge1xuICAgIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChcbiAgICAgIHRWaWV3LFxuICAgICAgdE5vZGUsXG4gICAgICBsVmlldyxcbiAgICAgIHByb3BOYW1lLFxuICAgICAgdmFsdWUsXG4gICAgICBsVmlld1tSRU5ERVJFUl0sXG4gICAgICBzYW5pdGl6ZXIsXG4gICAgICBmYWxzZSxcbiAgICApO1xuICAgIG5nRGV2TW9kZSAmJiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKHRWaWV3LmRhdGEsIHROb2RlLCBwcm9wTmFtZSwgYmluZGluZ0luZGV4KTtcbiAgfVxuXG4gIHJldHVybiDJtcm1dHdvV2F5UHJvcGVydHk7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdXNlZCBpbnNpZGUgdHdvLXdheSBsaXN0ZW5lcnMgdG8gY29uZGl0aW9uYWxseSBzZXQgdGhlIHZhbHVlIG9mIHRoZSBib3VuZCBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSB0YXJnZXQgRmllbGQgb24gd2hpY2ggdG8gc2V0IHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBiZSBzZXQgdG8gdGhlIGZpZWxkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dHdvV2F5QmluZGluZ1NldDxUPih0YXJnZXQ6IHVua25vd24sIHZhbHVlOiBUKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNhbldyaXRlID0gaXNXcml0YWJsZVNpZ25hbCh0YXJnZXQpO1xuICBjYW5Xcml0ZSAmJiB0YXJnZXQuc2V0KHZhbHVlKTtcbiAgcmV0dXJuIGNhbldyaXRlO1xufVxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdGhhdCB1cGRhdGVzIGEgdHdvLXdheSBiaW5kaW5nIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0cy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXR3b1dheUxpc3RlbmVyKFxuICBldmVudE5hbWU6IHN0cmluZyxcbiAgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSxcbik6IHR5cGVvZiDJtcm1dHdvV2F5TGlzdGVuZXIge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3PHt9IHwgbnVsbD4oKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgbGlzdGVuZXJJbnRlcm5hbCh0VmlldywgbFZpZXcsIGxWaWV3W1JFTkRFUkVSXSwgdE5vZGUsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbik7XG4gIHJldHVybiDJtcm1dHdvV2F5TGlzdGVuZXI7XG59XG4iXX0=