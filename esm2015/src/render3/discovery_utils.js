/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { assertDefined } from './assert';
import { discoverDirectiveIndices, discoverDirectives, getContext, isComponentInstance, readPatchedLViewData } from './context_discovery';
import { CONTEXT, FLAGS, INJECTOR, PARENT, TVIEW } from './interfaces/view';
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
    const context = /** @type {?} */ ((loadContext(target)));
    return context.lViewData[INJECTOR] || null;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kaXNjb3ZlcnlfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFXLHdCQUF3QixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRWxKLE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBeUIsTUFBTSxFQUFlLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFvQjlHLE1BQU0sVUFBVSxZQUFZLENBQVMsTUFBVTs7SUFDN0MsTUFBTSxPQUFPLHNCQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRztJQUV0QyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFOztRQUNuQyxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO1FBQ2xDLE9BQU8sU0FBUyxFQUFFOztZQUNoQixNQUFNLEdBQUcsMENBQUcsU0FBUyxHQUFHLE9BQU8sS0FBUTtZQUN2QyxJQUFJLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDbkMsT0FBTyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7Z0JBQ3hCLE1BQU07YUFDUDtZQUNELFNBQVMseUNBQUcsU0FBUyxHQUFHLE1BQU0sR0FBRyxDQUFDO1NBQ25DO1FBQ0QsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUNuQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztTQUMxQjtLQUNGO0lBRUQseUJBQU8sT0FBTyxDQUFDLFNBQWMsRUFBQztDQUMvQjs7Ozs7Ozs7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QUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztLQUNqQztJQUNELE9BQU8sU0FBUyxDQUFDO0NBQ2xCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TENvbnRleHQsIGRpc2NvdmVyRGlyZWN0aXZlSW5kaWNlcywgZGlzY292ZXJEaXJlY3RpdmVzLCBnZXRDb250ZXh0LCBpc0NvbXBvbmVudEluc3RhbmNlLCByZWFkUGF0Y2hlZExWaWV3RGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuLyoqXG4gKiBOT1RFOiBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtaWdodCBub3QgYmUgaWRlYWwgZm9yIGNvcmUgdXNhZ2UgaW4gQW5ndWxhci4uLlxuICpcbiAqIEVhY2ggZnVuY3Rpb24gYmVsb3cgaXMgZGVzaWduZWRcbiAqL1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhc3NvY2lhdGVkIHdpdGggdGhlIHRhcmdldC5cbiAqXG4gKiBJZiBhIERPTSBpcyB1c2VkIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlIGNvbXBvbmVudCB0aGF0XG4gKiAgICBvd25zIHRoZSB2aWV3IHdoZXJlIHRoZSBlbGVtZW50IGlzIHNpdHVhdGVkLlxuICogSWYgYSBjb21wb25lbnQgaW5zdGFuY2UgaXMgdXNlZCB0aGVuIGl0IHdpbGwgcmV0dXJuIHRoZVxuICogICAgaW5zdGFuY2Ugb2YgdGhlIHBhcmVudCBjb21wb25lbnQgZGVwZW5kaW5nIG9uIHdoZXJlXG4gKiAgICB0aGUgY29tcG9uZW50IGluc3RhbmNlIGlzIGV4aXN0cyBpbiBhIHRlbXBsYXRlLlxuICogSWYgYSBkaXJlY3RpdmUgaW5zdGFuY2UgaXMgdXNlZCB0aGVuIGl0IHdpbGwgcmV0dXJuIHRoZVxuICogICAgY29tcG9uZW50IHRoYXQgY29udGFpbnMgdGhhdCBkaXJlY3RpdmUgaW4gaXQncyB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudDxUID0ge30+KHRhcmdldDoge30pOiBUfG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZENvbnRleHQodGFyZ2V0KSAhO1xuXG4gIGlmIChjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGV0IGxWaWV3RGF0YSA9IGNvbnRleHQubFZpZXdEYXRhO1xuICAgIHdoaWxlIChsVmlld0RhdGEpIHtcbiAgICAgIGNvbnN0IGN0eCA9IGxWaWV3RGF0YSAhW0NPTlRFWFRdICFhc3t9O1xuICAgICAgaWYgKGN0eCAmJiBpc0NvbXBvbmVudEluc3RhbmNlKGN0eCkpIHtcbiAgICAgICAgY29udGV4dC5jb21wb25lbnQgPSBjdHg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhICFbUEFSRU5UXSAhO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5jb21wb25lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29udGV4dC5jb21wb25lbnQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LmNvbXBvbmVudCBhcyBUO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGhvc3QgY29tcG9uZW50IGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCB0aGUgdGFyZ2V0LlxuICpcbiAqIFRoaXMgd2lsbCBvbmx5IHJldHVybiBhIGNvbXBvbmVudCBpbnN0YW5jZSBvZiB0aGUgRE9NIG5vZGVcbiAqIGNvbnRhaW5zIGFuIGluc3RhbmNlIG9mIGEgY29tcG9uZW50IG9uIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9zdENvbXBvbmVudDxUID0ge30+KHRhcmdldDoge30pOiBUfG51bGwge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZENvbnRleHQodGFyZ2V0KTtcbiAgY29uc3QgdE5vZGUgPSBjb250ZXh0LmxWaWV3RGF0YVtUVklFV10uZGF0YVtjb250ZXh0LmxOb2RlSW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB7XG4gICAgY29uc3QgbE5vZGUgPSBjb250ZXh0LmxWaWV3RGF0YVtjb250ZXh0LmxOb2RlSW5kZXhdIGFzIExFbGVtZW50Tm9kZTtcbiAgICByZXR1cm4gbE5vZGUuZGF0YSAhW0NPTlRFWFRdIGFzIGFueSBhcyBUO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGBSb290Q29udGV4dGAgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBhcHBsaWNhdGlvbiB3aGVyZSB0aGUgdGFyZ2V0IGlzIHNpdHVhdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQodGFyZ2V0OiB7fSk6IFJvb3RDb250ZXh0IHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCkgITtcbiAgY29uc3Qgcm9vdExWaWV3RGF0YSA9IGdldFJvb3RWaWV3KGNvbnRleHQubFZpZXdEYXRhKTtcbiAgcmV0dXJuIHJvb3RMVmlld0RhdGFbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgYWxsIHRoZSBjb21wb25lbnRzIGluIHRoZSBhcHBsaWNhdGlvblxuICogdGhhdCBhcmUgaGF2ZSBiZWVuIGJvb3RzdHJhcHBlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RDb21wb25lbnRzKHRhcmdldDoge30pOiBhbnlbXSB7XG4gIHJldHVybiBbLi4uZ2V0Um9vdENvbnRleHQodGFyZ2V0KS5jb21wb25lbnRzXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbmplY3RvciBpbnN0YW5jZSB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aFxuICogdGhlIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3Rvcih0YXJnZXQ6IHt9KTogSW5qZWN0b3J8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG4gIHJldHVybiBjb250ZXh0LmxWaWV3RGF0YVtJTkpFQ1RPUl0gfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCBhcmUgYXNzb2NpYXRlZFxuICogd2l0aCB0aGUgdW5kZXJseWluZyB0YXJnZXQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERpcmVjdGl2ZXModGFyZ2V0OiB7fSk6IEFycmF5PHt9PiB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQuZGlyZWN0aXZlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29udGV4dC5kaXJlY3RpdmVJbmRpY2VzID0gZGlzY292ZXJEaXJlY3RpdmVJbmRpY2VzKGNvbnRleHQubFZpZXdEYXRhLCBjb250ZXh0LmxOb2RlSW5kZXgpO1xuICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGNvbnRleHQuZGlyZWN0aXZlSW5kaWNlcyA/XG4gICAgICAgIGRpc2NvdmVyRGlyZWN0aXZlcyhjb250ZXh0LmxWaWV3RGF0YSwgY29udGV4dC5kaXJlY3RpdmVJbmRpY2VzKSA6XG4gICAgICAgIG51bGw7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5kaXJlY3RpdmVzIHx8IFtdO1xufVxuXG5mdW5jdGlvbiBsb2FkQ29udGV4dCh0YXJnZXQ6IHt9KTogTENvbnRleHQge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0Q29udGV4dCh0YXJnZXQpO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIG5nRGV2TW9kZSA/ICdVbmFibGUgdG8gZmluZCB0aGUgZ2l2ZW4gY29udGV4dCBkYXRhIGZvciB0aGUgZ2l2ZW4gdGFyZ2V0JyA6XG4gICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIG5nIHRhcmdldCcpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdEYXRhYCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3RGF0YWAuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudE9yVmlldyBhbnkgY29tcG9uZW50IG9yIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RWaWV3KGNvbXBvbmVudE9yVmlldzogTFZpZXdEYXRhIHwge30pOiBMVmlld0RhdGEge1xuICBsZXQgbFZpZXdEYXRhOiBMVmlld0RhdGE7XG4gIGlmIChBcnJheS5pc0FycmF5KGNvbXBvbmVudE9yVmlldykpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnRPclZpZXcsICdsVmlld0RhdGEnKTtcbiAgICBsVmlld0RhdGEgPSBjb21wb25lbnRPclZpZXcgYXMgTFZpZXdEYXRhO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudE9yVmlldywgJ2NvbXBvbmVudCcpO1xuICAgIGxWaWV3RGF0YSA9IHJlYWRQYXRjaGVkTFZpZXdEYXRhKGNvbXBvbmVudE9yVmlldykgITtcbiAgfVxuICB3aGlsZSAobFZpZXdEYXRhICYmICEobFZpZXdEYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3RGF0YTtcbn1cbiJdfQ==