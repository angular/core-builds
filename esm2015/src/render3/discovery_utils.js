/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { assertDefined } from './assert';
import { discoverDirectiveIndices, discoverDirectives, discoverLocalRefs, getContext, isComponentInstance, readPatchedLViewData } from './context_discovery';
import { NodeInjector } from './di';
import { CONTEXT, FLAGS, PARENT, TVIEW } from './interfaces/view';
/**
 * Returns the component instance associated with the target.
 *
 * If a DOM is used then it will return the component that
 *    owns the view where the element is situated.
 * If a component instance is used then it will return the
 *    instance of the parent component depending on where
 *    the component instance is exists in a template.
 * If a directive instance is used then it will return the
 *    component that contains that directive in it's template.
 * @template T
 * @param {?} target
 * @return {?}
 */
export function getComponent(target) {
    /** @type {?} */
    const context = /** @type {?} */ ((loadContext(target)));
    if (context.component === undefined) {
        /** @type {?} */
        let lViewData = context.lViewData;
        while (lViewData) {
            /** @type {?} */
            const ctx = /** @type {?} */ (((/** @type {?} */ ((lViewData))[CONTEXT])));
            if (ctx && isComponentInstance(ctx)) {
                context.component = ctx;
                break;
            }
            lViewData = /** @type {?} */ ((/** @type {?} */ ((lViewData))[PARENT]));
        }
        if (context.component === undefined) {
            context.component = null;
        }
    }
    return /** @type {?} */ (context.component);
}
/**
 * Returns the host component instance associated with the target.
 *
 * This will only return a component instance of the DOM node
 * contains an instance of a component on it.
 * @template T
 * @param {?} target
 * @return {?}
 */
export function getHostComponent(target) {
    /** @type {?} */
    const context = loadContext(target);
    /** @type {?} */
    const tNode = /** @type {?} */ (context.lViewData[TVIEW].data[context.lNodeIndex]);
    if (tNode.flags & 4096 /* isComponent */) {
        /** @type {?} */
        const lNode = /** @type {?} */ (context.lViewData[context.lNodeIndex]);
        return /** @type {?} */ ((((lNode.data))[CONTEXT]));
    }
    return null;
}
/**
 * Returns the `RootContext` instance that is associated with
 * the application where the target is situated.
 * @param {?} target
 * @return {?}
 */
export function getRootContext(target) {
    /** @type {?} */
    const context = /** @type {?} */ ((loadContext(target)));
    /** @type {?} */
    const rootLViewData = getRootView(context.lViewData);
    return /** @type {?} */ (rootLViewData[CONTEXT]);
}
/**
 * Returns a list of all the components in the application
 * that are have been bootstrapped.
 * @param {?} target
 * @return {?}
 */
export function getRootComponents(target) {
    return [...getRootContext(target).components];
}
/**
 * Returns the injector instance that is associated with
 * the element, component or directive.
 * @param {?} target
 * @return {?}
 */
export function getInjector(target) {
    /** @type {?} */
    const context = loadContext(target);
    /** @type {?} */
    const tNode = /** @type {?} */ (context.lViewData[TVIEW].data[context.lNodeIndex]);
    return new NodeInjector(tNode, context.lViewData);
}
/**
 * Returns a list of all the directives that are associated
 * with the underlying target element.
 * @param {?} target
 * @return {?}
 */
export function getDirectives(target) {
    /** @type {?} */
    const context = /** @type {?} */ ((loadContext(target)));
    if (context.directives === undefined) {
        context.directiveIndices = discoverDirectiveIndices(context.lViewData, context.lNodeIndex);
        context.directives = context.directiveIndices ?
            discoverDirectives(context.lViewData, context.directiveIndices) :
            null;
    }
    return context.directives || [];
}
/**
 * @param {?} target
 * @return {?}
 */
function loadContext(target) {
    /** @type {?} */
    const context = getContext(target);
    if (!context) {
        throw new Error(ngDevMode ? 'Unable to find the given context data for the given target' :
            'Invalid ng target');
    }
    return context;
}
/**
 * Retrieve the root view from any component by walking the parent `LViewData` until
 * reaching the root `LViewData`.
 *
 * @param {?} componentOrView any component or view
 * @return {?}
 */
export function getRootView(componentOrView) {
    /** @type {?} */
    let lViewData;
    if (Array.isArray(componentOrView)) {
        ngDevMode && assertDefined(componentOrView, 'lViewData');
        lViewData = /** @type {?} */ (componentOrView);
    }
    else {
        ngDevMode && assertDefined(componentOrView, 'component');
        lViewData = /** @type {?} */ ((readPatchedLViewData(componentOrView)));
    }
    while (lViewData && !(lViewData[FLAGS] & 64 /* IsRoot */)) {
        lViewData = /** @type {?} */ ((lViewData[PARENT]));
    }
    return lViewData;
}
/**
 *  Retrieve map of local references (local reference name => element or directive instance).
 * @param {?} target
 * @return {?}
 */
export function getLocalRefs(target) {
    /** @type {?} */
    const context = /** @type {?} */ ((loadContext(target)));
    if (context.localRefs === undefined) {
        context.localRefs = discoverLocalRefs(context.lViewData, context.lNodeIndex);
    }
    return context.localRefs || {};
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kaXNjb3ZlcnlfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFXLHdCQUF3QixFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3JLLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFFbEMsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQXlCLE1BQU0sRUFBZSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBbUJwRyxNQUFNLFVBQVUsWUFBWSxDQUFTLE1BQVU7O0lBQzdDLE1BQU0sT0FBTyxzQkFBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUc7SUFFdEMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTs7UUFDbkMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUNsQyxPQUFPLFNBQVMsRUFBRTs7WUFDaEIsTUFBTSxHQUFHLDBDQUFHLFNBQVMsR0FBRyxPQUFPLEtBQVE7WUFDdkMsSUFBSSxHQUFHLElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ25DLE9BQU8sQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO2dCQUN4QixNQUFNO2FBQ1A7WUFDRCxTQUFTLHlDQUFHLFNBQVMsR0FBRyxNQUFNLEdBQUcsQ0FBQztTQUNuQztRQUNELElBQUksT0FBTyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDbkMsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDMUI7S0FDRjtJ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O1FBQ3pELFNBQVMsc0JBQUcsb0JBQW9CLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztLQUNyRDtJQUNELE9BQU8sU0FBUyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGtCQUFvQixDQUFDLEVBQUU7UUFDM0QsU0FBUyxzQkFBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztLQUNqQztJQUNELE9BQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7QUFLRCxNQUFNLFVBQVUsWUFBWSxDQUFDLE1BQVU7O0lBQ3JDLE1BQU0sT0FBTyxzQkFBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUc7SUFFdEMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtRQUNuQyxPQUFPLENBQUMsU0FBUyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQzlFO0lBRUQsT0FBTyxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQztDQUNoQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xDb250ZXh0LCBkaXNjb3ZlckRpcmVjdGl2ZUluZGljZXMsIGRpc2NvdmVyRGlyZWN0aXZlcywgZGlzY292ZXJMb2NhbFJlZnMsIGdldENvbnRleHQsIGlzQ29tcG9uZW50SW5zdGFuY2UsIHJlYWRQYXRjaGVkTFZpZXdEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Tm9kZUluamVjdG9yfSBmcm9tICcuL2RpJztcbmltcG9ydCB7TEVsZW1lbnROb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIEZMQUdTLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogTk9URTogVGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbWlnaHQgbm90IGJlIGlkZWFsIGZvciBjb3JlIHVzYWdlIGluIEFuZ3VsYXIuLi5cbiAqXG4gKiBFYWNoIGZ1bmN0aW9uIGJlbG93IGlzIGRlc2lnbmVkXG4gKi9cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYXNzb2NpYXRlZCB3aXRoIHRoZSB0YXJnZXQuXG4gKlxuICogSWYgYSBET00gaXMgdXNlZCB0aGVuIGl0IHdpbGwgcmV0dXJuIHRoZSBjb21wb25lbnQgdGhhdFxuICogICAgb3ducyB0aGUgdmlldyB3aGVyZSB0aGUgZWxlbWVudCBpcyBzaXR1YXRlZC5cbiAqIElmIGEgY29tcG9uZW50IGluc3RhbmNlIGlzIHVzZWQgdGhlbiBpdCB3aWxsIHJldHVybiB0aGVcbiAqICAgIGluc3RhbmNlIG9mIHRoZSBwYXJlbnQgY29tcG9uZW50IGRlcGVuZGluZyBvbiB3aGVyZVxuICogICAgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBpcyBleGlzdHMgaW4gYSB0ZW1wbGF0ZS5cbiAqIElmIGEgZGlyZWN0aXZlIGluc3RhbmNlIGlzIHVzZWQgdGhlbiBpdCB3aWxsIHJldHVybiB0aGVcbiAqICAgIGNvbXBvbmVudCB0aGF0IGNvbnRhaW5zIHRoYXQgZGlyZWN0aXZlIGluIGl0J3MgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnQ8VCA9IHt9Pih0YXJnZXQ6IHt9KTogVHxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCkgITtcblxuICBpZiAoY29udGV4dC5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgIGxldCBsVmlld0RhdGEgPSBjb250ZXh0LmxWaWV3RGF0YTtcbiAgICB3aGlsZSAobFZpZXdEYXRhKSB7XG4gICAgICBjb25zdCBjdHggPSBsVmlld0RhdGEgIVtDT05URVhUXSAhYXN7fTtcbiAgICAgIGlmIChjdHggJiYgaXNDb21wb25lbnRJbnN0YW5jZShjdHgpKSB7XG4gICAgICAgIGNvbnRleHQuY29tcG9uZW50ID0gY3R4O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YSAhW1BBUkVOVF0gITtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRleHQuY29tcG9uZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5jb21wb25lbnQgYXMgVDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBob3N0IGNvbXBvbmVudCBpbnN0YW5jZSBhc3NvY2lhdGVkIHdpdGggdGhlIHRhcmdldC5cbiAqXG4gKiBUaGlzIHdpbGwgb25seSByZXR1cm4gYSBjb21wb25lbnQgaW5zdGFuY2Ugb2YgdGhlIERPTSBub2RlXG4gKiBjb250YWlucyBhbiBpbnN0YW5jZSBvZiBhIGNvbXBvbmVudCBvbiBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEhvc3RDb21wb25lbnQ8VCA9IHt9Pih0YXJnZXQ6IHt9KTogVHxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCk7XG4gIGNvbnN0IHROb2RlID0gY29udGV4dC5sVmlld0RhdGFbVFZJRVddLmRhdGFbY29udGV4dC5sTm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkge1xuICAgIGNvbnN0IGxOb2RlID0gY29udGV4dC5sVmlld0RhdGFbY29udGV4dC5sTm9kZUluZGV4XSBhcyBMRWxlbWVudE5vZGU7XG4gICAgcmV0dXJuIGxOb2RlLmRhdGEgIVtDT05URVhUXSBhcyBhbnkgYXMgVDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBgUm9vdENvbnRleHRgIGluc3RhbmNlIHRoYXQgaXMgYXNzb2NpYXRlZCB3aXRoXG4gKiB0aGUgYXBwbGljYXRpb24gd2hlcmUgdGhlIHRhcmdldCBpcyBzaXR1YXRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RDb250ZXh0KHRhcmdldDoge30pOiBSb290Q29udGV4dCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG4gIGNvbnN0IHJvb3RMVmlld0RhdGEgPSBnZXRSb290Vmlldyhjb250ZXh0LmxWaWV3RGF0YSk7XG4gIHJldHVybiByb290TFZpZXdEYXRhW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgY29tcG9uZW50cyBpbiB0aGUgYXBwbGljYXRpb25cbiAqIHRoYXQgYXJlIGhhdmUgYmVlbiBib290c3RyYXBwZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29tcG9uZW50cyh0YXJnZXQ6IHt9KTogYW55W10ge1xuICByZXR1cm4gWy4uLmdldFJvb3RDb250ZXh0KHRhcmdldCkuY29tcG9uZW50c107XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5qZWN0b3IgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3IodGFyZ2V0OiB7fSk6IEluamVjdG9yIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCk7XG4gIGNvbnN0IHROb2RlID0gY29udGV4dC5sVmlld0RhdGFbVFZJRVddLmRhdGFbY29udGV4dC5sTm9kZUluZGV4XSBhcyBURWxlbWVudE5vZGU7XG5cbiAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodE5vZGUsIGNvbnRleHQubFZpZXdEYXRhKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCBhcmUgYXNzb2NpYXRlZFxuICogd2l0aCB0aGUgdW5kZXJseWluZyB0YXJnZXQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERpcmVjdGl2ZXModGFyZ2V0OiB7fSk6IEFycmF5PHt9PiB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5kaXJlY3RpdmVJbmRpY2VzID0gZGlzY292ZXJEaXJlY3RpdmVJbmRpY2VzKGNvbnRleHQubFZpZXdEYXRhLCBjb250ZXh0LmxOb2RlSW5kZXgpO1xuICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGNvbnRleHQuZGlyZWN0aXZlSW5kaWNlcyA/XG4gICAgICAgIGRpc2NvdmVyRGlyZWN0aXZlcyhjb250ZXh0LmxWaWV3RGF0YSwgY29udGV4dC5kaXJlY3RpdmVJbmRpY2VzKSA6XG4gICAgICAgIG51bGw7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5kaXJlY3RpdmVzIHx8IFtdO1xufVxuXG5mdW5jdGlvbiBsb2FkQ29udGV4dCh0YXJnZXQ6IHt9KTogTENvbnRleHQge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0Q29udGV4dCh0YXJnZXQpO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIG5nRGV2TW9kZSA/ICdVbmFibGUgdG8gZmluZCB0aGUgZ2l2ZW4gY29udGV4dCBkYXRhIGZvciB0aGUgZ2l2ZW4gdGFyZ2V0JyA6XG4gICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIG5nIHRhcmdldCcpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdEYXRhYCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3RGF0YWAuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudE9yVmlldyBhbnkgY29tcG9uZW50IG9yIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RWaWV3KGNvbXBvbmVudE9yVmlldzogTFZpZXdEYXRhIHwge30pOiBMVmlld0RhdGEge1xuICBsZXQgbFZpZXdEYXRhOiBMVmlld0RhdGE7XG4gIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudE9yVmlldykpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnRPclZpZXcsICdsVmlld0RhdGEnKTtcbiAgICBsVmlld0RhdGEgPSBjb21wb25lbnRPclZpZXcgYXMgTFZpZXdEYXRhO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudE9yVmlldywgJ2NvbXBvbmVudCcpO1xuICAgIGxWaWV3RGF0YSA9IHJlYWRQYXRjaGVkTFZpZXdEYXRhKGNvbXBvbmVudE9yVmlldykgITtcbiAgfVxuICB3aGlsZSAobFZpZXdEYXRhICYmICEobFZpZXdEYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3RGF0YTtcbn1cblxuLyoqXG4gKiAgUmV0cmlldmUgbWFwIG9mIGxvY2FsIHJlZmVyZW5jZXMgKGxvY2FsIHJlZmVyZW5jZSBuYW1lID0+IGVsZW1lbnQgb3IgZGlyZWN0aXZlIGluc3RhbmNlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsUmVmcyh0YXJnZXQ6IHt9KToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZENvbnRleHQodGFyZ2V0KSAhO1xuXG4gIGlmIChjb250ZXh0LmxvY2FsUmVmcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5sb2NhbFJlZnMgPSBkaXNjb3ZlckxvY2FsUmVmcyhjb250ZXh0LmxWaWV3RGF0YSwgY29udGV4dC5sTm9kZUluZGV4KTtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LmxvY2FsUmVmcyB8fCB7fTtcbn0iXX0=