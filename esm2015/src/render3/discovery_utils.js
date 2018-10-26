/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { assertDefined } from './assert';
import { discoverDirectives, discoverLocalRefs, getContext, isComponentInstance } from './context_discovery';
import { CONTEXT, FLAGS, PARENT, TVIEW } from './interfaces/view';
import { getComponentViewByIndex, readPatchedLViewData } from './util';
import { NodeInjector } from './view_engine_compatibility';
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
            lViewData = lViewData[FLAGS] & 64 /* IsRoot */ ? null : /** @type {?} */ ((/** @type {?} */ ((lViewData))[PARENT]));
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
    const tNode = /** @type {?} */ (context.lViewData[TVIEW].data[context.nodeIndex]);
    if (tNode.flags & 4096 /* isComponent */) {
        /** @type {?} */
        const componentView = getComponentViewByIndex(context.nodeIndex, context.lViewData);
        return /** @type {?} */ ((componentView[CONTEXT]));
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
    const lViewData = Array.isArray(target) ? target : /** @type {?} */ ((loadContext(target))).lViewData;
    /** @type {?} */
    const rootLViewData = getRootView(lViewData);
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
    const tNode = /** @type {?} */ (context.lViewData[TVIEW].data[context.nodeIndex]);
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
        context.directives = discoverDirectives(context.nodeIndex, context.lViewData, false);
    }
    return context.directives || [];
}
/**
 * Returns LContext associated with a target passed as an argument.
 * Throws if a given target doesn't have associated LContext.
 * @param {?} target
 * @return {?}
 */
export function loadContext(target) {
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
        context.localRefs = discoverLocalRefs(context.lViewData, context.nodeIndex);
    }
    return context.localRefs || {};
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kaXNjb3ZlcnlfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRzNHLE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUF5QixNQUFNLEVBQWUsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEcsT0FBTyxFQUFDLHVCQUF1QixFQUFFLG9CQUFvQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBcUJ6RCxNQUFNLFVBQVUsWUFBWSxDQUFTLE1BQVU7O0lBQzdDLE1BQU0sT0FBTyxzQkFBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUc7SUFFdEMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTs7UUFDbkMsSUFBSSxTQUFTLEdBQW1CLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDbEQsT0FBTyxTQUFTLEVBQUU7O1lBQ2hCLE1BQU0sR0FBRywwQ0FBRyxTQUFTLEdBQUcsT0FBTyxLQUFRO1lBQ3ZDLElBQUksR0FBRyxJQUFJLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNuQyxPQUFPLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQztnQkFDeEIsTUFBTTthQUNQO1lBQ0QsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsa0JBQW9CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLHVDQUFDLFNBQVMsR0FBRyxNQUFNLEdBQUcsQ0FB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U0FBUyxJQUFJLGFBQWEsQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDekQsU0FBUyxzQkFBRyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO0tBQ3JEO0lBQ0QsT0FBTyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsa0JBQW9CLENBQUMsRUFBRTtRQUMzRCxTQUFTLHNCQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0tBQ2pDO0lBQ0QsT0FBTyxTQUFTLENBQUM7Q0FDbEI7Ozs7OztBQUtELE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVTs7SUFDckMsTUFBTSxPQUFPLHNCQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRztJQUV0QyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFO1FBQ25DLE9BQU8sQ0FBQyxTQUFTLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDN0U7SUFFRCxPQUFPLE9BQU8sQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO0NBQ2hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7ZGlzY292ZXJEaXJlY3RpdmVzLCBkaXNjb3ZlckxvY2FsUmVmcywgZ2V0Q29udGV4dCwgaXNDb21wb25lbnRJbnN0YW5jZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge0xDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgUEFSRU5ULCBSb290Q29udGV4dCwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIHJlYWRQYXRjaGVkTFZpZXdEYXRhfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3J9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5cblxuXG4vKipcbiAqIE5PVEU6IFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG1pZ2h0IG5vdCBiZSBpZGVhbCBmb3IgY29yZSB1c2FnZSBpbiBBbmd1bGFyLi4uXG4gKlxuICogRWFjaCBmdW5jdGlvbiBiZWxvdyBpcyBkZXNpZ25lZFxuICovXG5cbi8qKlxuICogUmV0dXJucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCB0aGUgdGFyZ2V0LlxuICpcbiAqIElmIGEgRE9NIGlzIHVzZWQgdGhlbiBpdCB3aWxsIHJldHVybiB0aGUgY29tcG9uZW50IHRoYXRcbiAqICAgIG93bnMgdGhlIHZpZXcgd2hlcmUgdGhlIGVsZW1lbnQgaXMgc2l0dWF0ZWQuXG4gKiBJZiBhIGNvbXBvbmVudCBpbnN0YW5jZSBpcyB1c2VkIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlXG4gKiAgICBpbnN0YW5jZSBvZiB0aGUgcGFyZW50IGNvbXBvbmVudCBkZXBlbmRpbmcgb24gd2hlcmVcbiAqICAgIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgaXMgZXhpc3RzIGluIGEgdGVtcGxhdGUuXG4gKiBJZiBhIGRpcmVjdGl2ZSBpbnN0YW5jZSBpcyB1c2VkIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlXG4gKiAgICBjb21wb25lbnQgdGhhdCBjb250YWlucyB0aGF0IGRpcmVjdGl2ZSBpbiBpdCdzIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50PFQgPSB7fT4odGFyZ2V0OiB7fSk6IFR8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgbFZpZXdEYXRhOiBMVmlld0RhdGF8bnVsbCA9IGNvbnRleHQubFZpZXdEYXRhO1xuICAgIHdoaWxlIChsVmlld0RhdGEpIHtcbiAgICAgIGNvbnN0IGN0eCA9IGxWaWV3RGF0YSAhW0NPTlRFWFRdICFhc3t9O1xuICAgICAgaWYgKGN0eCAmJiBpc0NvbXBvbmVudEluc3RhbmNlKGN0eCkpIHtcbiAgICAgICAgY29udGV4dC5jb21wb25lbnQgPSBjdHg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290ID8gbnVsbCA6IGxWaWV3RGF0YSAhW1BBUkVOVF0gITtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRleHQuY29tcG9uZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5jb21wb25lbnQgYXMgVDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBob3N0IGNvbXBvbmVudCBpbnN0YW5jZSBhc3NvY2lhdGVkIHdpdGggdGhlIHRhcmdldC5cbiAqXG4gKiBUaGlzIHdpbGwgb25seSByZXR1cm4gYSBjb21wb25lbnQgaW5zdGFuY2Ugb2YgdGhlIERPTSBub2RlXG4gKiBjb250YWlucyBhbiBpbnN0YW5jZSBvZiBhIGNvbXBvbmVudCBvbiBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEhvc3RDb21wb25lbnQ8VCA9IHt9Pih0YXJnZXQ6IHt9KTogVHxudWxsIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCk7XG4gIGNvbnN0IHROb2RlID0gY29udGV4dC5sVmlld0RhdGFbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KGNvbnRleHQubm9kZUluZGV4LCBjb250ZXh0LmxWaWV3RGF0YSk7XG4gICAgcmV0dXJuIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gYXMgYW55IGFzIFQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYFJvb3RDb250ZXh0YCBpbnN0YW5jZSB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aFxuICogdGhlIGFwcGxpY2F0aW9uIHdoZXJlIHRoZSB0YXJnZXQgaXMgc2l0dWF0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29udGV4dCh0YXJnZXQ6IExWaWV3RGF0YSB8IHt9KTogUm9vdENvbnRleHQge1xuICBjb25zdCBsVmlld0RhdGEgPSBBcnJheS5pc0FycmF5KHRhcmdldCkgPyB0YXJnZXQgOiBsb2FkQ29udGV4dCh0YXJnZXQpICEubFZpZXdEYXRhO1xuICBjb25zdCByb290TFZpZXdEYXRhID0gZ2V0Um9vdFZpZXcobFZpZXdEYXRhKTtcbiAgcmV0dXJuIHJvb3RMVmlld0RhdGFbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgYWxsIHRoZSBjb21wb25lbnRzIGluIHRoZSBhcHBsaWNhdGlvblxuICogdGhhdCBhcmUgaGF2ZSBiZWVuIGJvb3RzdHJhcHBlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RDb21wb25lbnRzKHRhcmdldDoge30pOiBhbnlbXSB7XG4gIHJldHVybiBbLi4uZ2V0Um9vdENvbnRleHQodGFyZ2V0KS5jb21wb25lbnRzXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbmplY3RvciBpbnN0YW5jZSB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aFxuICogdGhlIGVsZW1lbnQsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3Rvcih0YXJnZXQ6IHt9KTogSW5qZWN0b3Ige1xuICBjb25zdCBjb250ZXh0ID0gbG9hZENvbnRleHQodGFyZ2V0KTtcbiAgY29uc3QgdE5vZGUgPSBjb250ZXh0LmxWaWV3RGF0YVtUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVEVsZW1lbnROb2RlO1xuXG4gIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHROb2RlLCBjb250ZXh0LmxWaWV3RGF0YSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgYXJlIGFzc29jaWF0ZWRcbiAqIHdpdGggdGhlIHVuZGVybHlpbmcgdGFyZ2V0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVzKHRhcmdldDoge30pOiBBcnJheTx7fT4ge1xuICBjb25zdCBjb250ZXh0ID0gbG9hZENvbnRleHQodGFyZ2V0KSAhO1xuXG4gIGlmIChjb250ZXh0LmRpcmVjdGl2ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnRleHQuZGlyZWN0aXZlcyA9IGRpc2NvdmVyRGlyZWN0aXZlcyhjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlld0RhdGEsIGZhbHNlKTtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LmRpcmVjdGl2ZXMgfHwgW107XG59XG5cbi8qKlxuICogUmV0dXJucyBMQ29udGV4dCBhc3NvY2lhdGVkIHdpdGggYSB0YXJnZXQgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICogVGhyb3dzIGlmIGEgZ2l2ZW4gdGFyZ2V0IGRvZXNuJ3QgaGF2ZSBhc3NvY2lhdGVkIExDb250ZXh0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbnRleHQodGFyZ2V0OiB7fSk6IExDb250ZXh0IHtcbiAgY29uc3QgY29udGV4dCA9IGdldENvbnRleHQodGFyZ2V0KTtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBuZ0Rldk1vZGUgPyAnVW5hYmxlIHRvIGZpbmQgdGhlIGdpdmVuIGNvbnRleHQgZGF0YSBmb3IgdGhlIGdpdmVuIHRhcmdldCcgOlxuICAgICAgICAgICAgICAgICAgICAnSW52YWxpZCBuZyB0YXJnZXQnKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3RGF0YWAgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld0RhdGFgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRPclZpZXcgYW55IGNvbXBvbmVudCBvciB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyhjb21wb25lbnRPclZpZXc6IExWaWV3RGF0YSB8IHt9KTogTFZpZXdEYXRhIHtcbiAgbGV0IGxWaWV3RGF0YTogTFZpZXdEYXRhO1xuICBpZiAoQXJyYXkuaXNBcnJheShjb21wb25lbnRPclZpZXcpKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50T3JWaWV3LCAnbFZpZXdEYXRhJyk7XG4gICAgbFZpZXdEYXRhID0gY29tcG9uZW50T3JWaWV3IGFzIExWaWV3RGF0YTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnRPclZpZXcsICdjb21wb25lbnQnKTtcbiAgICBsVmlld0RhdGEgPSByZWFkUGF0Y2hlZExWaWV3RGF0YShjb21wb25lbnRPclZpZXcpICE7XG4gIH1cbiAgd2hpbGUgKGxWaWV3RGF0YSAmJiAhKGxWaWV3RGF0YVtGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBsVmlld0RhdGEgPSBsVmlld0RhdGFbUEFSRU5UXSAhO1xuICB9XG4gIHJldHVybiBsVmlld0RhdGE7XG59XG5cbi8qKlxuICogIFJldHJpZXZlIG1hcCBvZiBsb2NhbCByZWZlcmVuY2VzIChsb2NhbCByZWZlcmVuY2UgbmFtZSA9PiBlbGVtZW50IG9yIGRpcmVjdGl2ZSBpbnN0YW5jZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbFJlZnModGFyZ2V0OiB7fSk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCkgITtcblxuICBpZiAoY29udGV4dC5sb2NhbFJlZnMgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnRleHQubG9jYWxSZWZzID0gZGlzY292ZXJMb2NhbFJlZnMoY29udGV4dC5sVmlld0RhdGEsIGNvbnRleHQubm9kZUluZGV4KTtcbiAgfVxuXG4gIHJldHVybiBjb250ZXh0LmxvY2FsUmVmcyB8fCB7fTtcbn1cbiJdfQ==