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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzY292ZXJ5X3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kaXNjb3ZlcnlfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRzNHLE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUF5QixNQUFNLEVBQWUsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEcsT0FBTyxFQUFDLHVCQUF1QixFQUFFLG9CQUFvQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBcUJ6RCxNQUFNLFVBQVUsWUFBWSxDQUFTLE1BQVU7O0lBQzdDLE1BQU0sT0FBTyxzQkFBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUc7SUFFdEMsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTs7UUFDbkMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUNsQyxPQUFPLFNBQVMsRUFBRTs7WUFDaEIsTUFBTSxHQUFHLDBDQUFHLFNBQVMsR0FBRyxPQUFPLEtBQVE7WUFDdkMsSUFBSSxHQUFHLElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ25DLE9BQU8sQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO2dCQUN4QixNQUFNO2FBQ1A7WUFDRCxTQUFTLHlDQUFHLFNBQVMsR0FBRyxNQUFNLEdBQUcsQ0FBQztTQUNuQztRQUNELElBQUksT0FBTyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDbkMsT0FBTyxDQUFD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QkFBb0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO0tBQ3JEO0lBQ0QsT0FBTyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsa0JBQW9CLENBQUMsRUFBRTtRQUMzRCxTQUFTLHNCQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0tBQ2pDO0lBQ0QsT0FBTyxTQUFTLENBQUM7Q0FDbEI7Ozs7OztBQUtELE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVTs7SUFDckMsTUFBTSxPQUFPLHNCQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRztJQUV0QyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFO1FBQ25DLE9BQU8sQ0FBQyxTQUFTLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDN0U7SUFFRCxPQUFPLE9BQU8sQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO0NBQ2hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7ZGlzY292ZXJEaXJlY3RpdmVzLCBkaXNjb3ZlckxvY2FsUmVmcywgZ2V0Q29udGV4dCwgaXNDb21wb25lbnRJbnN0YW5jZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge0xDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgUEFSRU5ULCBSb290Q29udGV4dCwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIHJlYWRQYXRjaGVkTFZpZXdEYXRhfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3J9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5cblxuXG4vKipcbiAqIE5PVEU6IFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG1pZ2h0IG5vdCBiZSBpZGVhbCBmb3IgY29yZSB1c2FnZSBpbiBBbmd1bGFyLi4uXG4gKlxuICogRWFjaCBmdW5jdGlvbiBiZWxvdyBpcyBkZXNpZ25lZFxuICovXG5cbi8qKlxuICogUmV0dXJucyB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCB0aGUgdGFyZ2V0LlxuICpcbiAqIElmIGEgRE9NIGlzIHVzZWQgdGhlbiBpdCB3aWxsIHJldHVybiB0aGUgY29tcG9uZW50IHRoYXRcbiAqICAgIG93bnMgdGhlIHZpZXcgd2hlcmUgdGhlIGVsZW1lbnQgaXMgc2l0dWF0ZWQuXG4gKiBJZiBhIGNvbXBvbmVudCBpbnN0YW5jZSBpcyB1c2VkIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlXG4gKiAgICBpbnN0YW5jZSBvZiB0aGUgcGFyZW50IGNvbXBvbmVudCBkZXBlbmRpbmcgb24gd2hlcmVcbiAqICAgIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgaXMgZXhpc3RzIGluIGEgdGVtcGxhdGUuXG4gKiBJZiBhIGRpcmVjdGl2ZSBpbnN0YW5jZSBpcyB1c2VkIHRoZW4gaXQgd2lsbCByZXR1cm4gdGhlXG4gKiAgICBjb21wb25lbnQgdGhhdCBjb250YWlucyB0aGF0IGRpcmVjdGl2ZSBpbiBpdCdzIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50PFQgPSB7fT4odGFyZ2V0OiB7fSk6IFR8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQuY29tcG9uZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgbFZpZXdEYXRhID0gY29udGV4dC5sVmlld0RhdGE7XG4gICAgd2hpbGUgKGxWaWV3RGF0YSkge1xuICAgICAgY29uc3QgY3R4ID0gbFZpZXdEYXRhICFbQ09OVEVYVF0gIWFze307XG4gICAgICBpZiAoY3R4ICYmIGlzQ29tcG9uZW50SW5zdGFuY2UoY3R4KSkge1xuICAgICAgICBjb250ZXh0LmNvbXBvbmVudCA9IGN0eDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsVmlld0RhdGEgPSBsVmlld0RhdGEgIVtQQVJFTlRdICE7XG4gICAgfVxuICAgIGlmIChjb250ZXh0LmNvbXBvbmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250ZXh0LmNvbXBvbmVudCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbnRleHQuY29tcG9uZW50IGFzIFQ7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaG9zdCBjb21wb25lbnQgaW5zdGFuY2UgYXNzb2NpYXRlZCB3aXRoIHRoZSB0YXJnZXQuXG4gKlxuICogVGhpcyB3aWxsIG9ubHkgcmV0dXJuIGEgY29tcG9uZW50IGluc3RhbmNlIG9mIHRoZSBET00gbm9kZVxuICogY29udGFpbnMgYW4gaW5zdGFuY2Ugb2YgYSBjb21wb25lbnQgb24gaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0Q29tcG9uZW50PFQgPSB7fT4odGFyZ2V0OiB7fSk6IFR8bnVsbCB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpO1xuICBjb25zdCB0Tm9kZSA9IGNvbnRleHQubFZpZXdEYXRhW1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkge1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlld0RhdGEpO1xuICAgIHJldHVybiBjb21wb25lbnRWaWV3W0NPTlRFWFRdIGFzIGFueSBhcyBUO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGBSb290Q29udGV4dGAgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBhcHBsaWNhdGlvbiB3aGVyZSB0aGUgdGFyZ2V0IGlzIHNpdHVhdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQodGFyZ2V0OiBMVmlld0RhdGEgfCB7fSk6IFJvb3RDb250ZXh0IHtcbiAgY29uc3QgbFZpZXdEYXRhID0gQXJyYXkuaXNBcnJheSh0YXJnZXQpID8gdGFyZ2V0IDogbG9hZENvbnRleHQodGFyZ2V0KSAhLmxWaWV3RGF0YTtcbiAgY29uc3Qgcm9vdExWaWV3RGF0YSA9IGdldFJvb3RWaWV3KGxWaWV3RGF0YSk7XG4gIHJldHVybiByb290TFZpZXdEYXRhW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgY29tcG9uZW50cyBpbiB0aGUgYXBwbGljYXRpb25cbiAqIHRoYXQgYXJlIGhhdmUgYmVlbiBib290c3RyYXBwZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29tcG9uZW50cyh0YXJnZXQ6IHt9KTogYW55W10ge1xuICByZXR1cm4gWy4uLmdldFJvb3RDb250ZXh0KHRhcmdldCkuY29tcG9uZW50c107XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5qZWN0b3IgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBlbGVtZW50LCBjb21wb25lbnQgb3IgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3IodGFyZ2V0OiB7fSk6IEluamVjdG9yIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCk7XG4gIGNvbnN0IHROb2RlID0gY29udGV4dC5sVmlld0RhdGFbVFZJRVddLmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFRFbGVtZW50Tm9kZTtcblxuICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0Tm9kZSwgY29udGV4dC5sVmlld0RhdGEpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgZGlyZWN0aXZlcyB0aGF0IGFyZSBhc3NvY2lhdGVkXG4gKiB3aXRoIHRoZSB1bmRlcmx5aW5nIHRhcmdldCBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlcyh0YXJnZXQ6IHt9KTogQXJyYXk8e30+IHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRhcmdldCkgITtcblxuICBpZiAoY29udGV4dC5kaXJlY3RpdmVzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmRpcmVjdGl2ZXMgPSBkaXNjb3ZlckRpcmVjdGl2ZXMoY29udGV4dC5ub2RlSW5kZXgsIGNvbnRleHQubFZpZXdEYXRhLCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5kaXJlY3RpdmVzIHx8IFtdO1xufVxuXG4vKipcbiAqIFJldHVybnMgTENvbnRleHQgYXNzb2NpYXRlZCB3aXRoIGEgdGFyZ2V0IHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqIFRocm93cyBpZiBhIGdpdmVuIHRhcmdldCBkb2Vzbid0IGhhdmUgYXNzb2NpYXRlZCBMQ29udGV4dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRDb250ZXh0KHRhcmdldDoge30pOiBMQ29udGV4dCB7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRDb250ZXh0KHRhcmdldCk7XG4gIGlmICghY29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgbmdEZXZNb2RlID8gJ1VuYWJsZSB0byBmaW5kIHRoZSBnaXZlbiBjb250ZXh0IGRhdGEgZm9yIHRoZSBnaXZlbiB0YXJnZXQnIDpcbiAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgbmcgdGFyZ2V0Jyk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgdmlldyBmcm9tIGFueSBjb21wb25lbnQgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld0RhdGFgIHVudGlsXG4gKiByZWFjaGluZyB0aGUgcm9vdCBgTFZpZXdEYXRhYC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50T3JWaWV3IGFueSBjb21wb25lbnQgb3Igdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcoY29tcG9uZW50T3JWaWV3OiBMVmlld0RhdGEgfCB7fSk6IExWaWV3RGF0YSB7XG4gIGxldCBsVmlld0RhdGE6IExWaWV3RGF0YTtcbiAgaWYgKEFycmF5LmlzQXJyYXkoY29tcG9uZW50T3JWaWV3KSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudE9yVmlldywgJ2xWaWV3RGF0YScpO1xuICAgIGxWaWV3RGF0YSA9IGNvbXBvbmVudE9yVmlldyBhcyBMVmlld0RhdGE7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50T3JWaWV3LCAnY29tcG9uZW50Jyk7XG4gICAgbFZpZXdEYXRhID0gcmVhZFBhdGNoZWRMVmlld0RhdGEoY29tcG9uZW50T3JWaWV3KSAhO1xuICB9XG4gIHdoaWxlIChsVmlld0RhdGEgJiYgIShsVmlld0RhdGFbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpKSB7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgfVxuICByZXR1cm4gbFZpZXdEYXRhO1xufVxuXG4vKipcbiAqICBSZXRyaWV2ZSBtYXAgb2YgbG9jYWwgcmVmZXJlbmNlcyAobG9jYWwgcmVmZXJlbmNlIG5hbWUgPT4gZWxlbWVudCBvciBkaXJlY3RpdmUgaW5zdGFuY2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxSZWZzKHRhcmdldDoge30pOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0YXJnZXQpICE7XG5cbiAgaWYgKGNvbnRleHQubG9jYWxSZWZzID09PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmxvY2FsUmVmcyA9IGRpc2NvdmVyTG9jYWxSZWZzKGNvbnRleHQubFZpZXdEYXRhLCBjb250ZXh0Lm5vZGVJbmRleCk7XG4gIH1cblxuICByZXR1cm4gY29udGV4dC5sb2NhbFJlZnMgfHwge307XG59XG4iXX0=