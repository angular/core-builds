/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertComponentType, assertDefined } from './assert';
import { queueInitHooks, queueLifecycleHooks } from './hooks';
import { CLEAN_PROMISE, baseDirectiveCreate, createLViewData, createTView, detectChangesInternal, enterView, executeInitAndContentHooks, getRootView, hostElement, leaveView, locateHostElement, setHostBindings, queueHostBindingForCheck, } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { INJECTOR, CONTEXT, TVIEW } from './interfaces/view';
import { stringify } from './util';
import { getComponentDef } from './definition';
import { getLElementFromComponent, readPatchedLViewData } from './context_discovery';
/**
 * Options that control how the component should be bootstrapped.
 * @record
 */
export function CreateComponentOptions() { }
/**
 * Which renderer factory to use.
 * @type {?|undefined}
 */
CreateComponentOptions.prototype.rendererFactory;
/**
 * A custom sanitizer instance
 * @type {?|undefined}
 */
CreateComponentOptions.prototype.sanitizer;
/**
 * Host element on which the component will be bootstrapped. If not specified,
 * the component definition's `tag` is used to query the existing DOM for the
 * element to bootstrap.
 * @type {?|undefined}
 */
CreateComponentOptions.prototype.host;
/**
 * Module injector for the component. If unspecified, the injector will be NULL_INJECTOR.
 * @type {?|undefined}
 */
CreateComponentOptions.prototype.injector;
/**
 * List of features to be applied to the created component. Features are simply
 * functions that decorate a component with a certain behavior.
 *
 * Typically, the features in this list are features that cannot be added to the
 * other features list in the component definition because they rely on other factors.
 *
 * Example: `RootLifecycleHooks` is a function that adds lifecycle hook capabilities
 * to root components in a tree-shakable way. It cannot be added to the component
 * features list because there's no way of knowing when the component will be used as
 * a root component.
 * @type {?|undefined}
 */
CreateComponentOptions.prototype.hostFeatures;
/**
 * A function which is used to schedule change detection work in the future.
 *
 * When marking components as dirty, it is necessary to schedule the work of
 * change detection in the future. This is done to coalesce multiple
 * {\@link markDirty} calls into a single changed detection processing.
 *
 * The default value of the scheduler is the `requestAnimationFrame` function.
 *
 * It is also useful to override this function for testing purposes.
 * @type {?|undefined}
 */
CreateComponentOptions.prototype.scheduler;
/** @typedef {?} */
var HostFeature;
/** @type {?} */
export const NULL_INJECTOR = {
    get: (token, notFoundValue) => {
        throw new Error('NullInjector: Not found: ' + stringify(token));
    }
};
/**
 * Bootstraps a Component into an existing host element and returns an instance
 * of the component.
 *
 * Use this function to bootstrap a component into the DOM tree. Each invocation
 * of this function will create a separate tree of components, injectors and
 * change detection cycles and lifetimes. To dynamically insert a new component
 * into an existing tree such that it shares the same injection, change detection
 * and object lifetime, use {\@link ViewContainer#createComponent}.
 *
 * @template T
 * @param {?} componentType Component to bootstrap
 * @param {?=} opts
 * @return {?}
 */
export function renderComponent(componentType /* Type as workaround for: Microsoft/TypeScript/issues/4881 */, opts = {}) {
    ngDevMode && assertComponentType(componentType);
    /** @type {?} */
    const rendererFactory = opts.rendererFactory || domRendererFactory3;
    /** @type {?} */
    const sanitizer = opts.sanitizer || null;
    /** @type {?} */
    const componentDef = /** @type {?} */ ((getComponentDef(componentType)));
    if (componentDef.type != componentType)
        componentDef.type = componentType;
    /** @type {?} */
    const componentTag = /** @type {?} */ (((/** @type {?} */ ((componentDef.selectors))[0]))[0]);
    /** @type {?} */
    const hostNode = locateHostElement(rendererFactory, opts.host || componentTag);
    /** @type {?} */
    const rootFlags = componentDef.onPush ? 4 /* Dirty */ | 64 /* IsRoot */ :
        2 /* CheckAlways */ | 64 /* IsRoot */;
    /** @type {?} */
    const rootContext = createRootContext(opts.scheduler || requestAnimationFrame.bind(window));
    /** @type {?} */
    const rootView = createLViewData(rendererFactory.createRenderer(hostNode, componentDef), createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags);
    rootView[INJECTOR] = opts.injector || null;
    /** @type {?} */
    const oldView = enterView(rootView, null);
    /** @type {?} */
    let elementNode;
    /** @type {?} */
    let component;
    try {
        if (rendererFactory.begin)
            rendererFactory.begin();
        // Create element node at index 0 in data array
        elementNode = hostElement(componentTag, hostNode, componentDef, sanitizer);
        component = createRootComponent(elementNode, componentDef, rootView, rootContext, opts.hostFeatures || null);
        executeInitAndContentHooks();
        detectChangesInternal(/** @type {?} */ (elementNode.data), component);
    }
    finally {
        leaveView(oldView);
        if (rendererFactory.end)
            rendererFactory.end();
    }
    return component;
}
/**
 * Creates a root component and sets it up with features and host bindings. Shared by
 * renderComponent() and ViewContainerRef.createComponent().
 * @template T
 * @param {?} elementNode
 * @param {?} componentDef
 * @param {?} rootView
 * @param {?} rootContext
 * @param {?} hostFeatures
 * @return {?}
 */
export function createRootComponent(elementNode, componentDef, rootView, rootContext, hostFeatures) {
    /** @type {?} */
    const component = baseDirectiveCreate(0, /** @type {?} */ (componentDef.factory()), componentDef, elementNode);
    if (componentDef.hostBindings)
        queueHostBindingForCheck(0, componentDef.hostVars);
    rootContext.components.push(component);
    (/** @type {?} */ (elementNode.data))[CONTEXT] = component;
    hostFeatures && hostFeatures.forEach((feature) => feature(component, componentDef));
    setHostBindings(rootView[TVIEW].hostBindings);
    return component;
}
/**
 * @param {?} scheduler
 * @return {?}
 */
export function createRootContext(scheduler) {
    return {
        components: [],
        scheduler: scheduler,
        clean: CLEAN_PROMISE,
    };
}
/**
 * Used to enable lifecycle hooks on the root component.
 *
 * Include this feature when calling `renderComponent` if the root component
 * you are rendering has lifecycle hooks defined. Otherwise, the hooks won't
 * be called properly.
 *
 * Example:
 *
 * ```
 * renderComponent(AppComponent, {features: [RootLifecycleHooks]});
 * ```
 * @param {?} component
 * @param {?} def
 * @return {?}
 */
export function LifecycleHooksFeature(component, def) {
    /** @type {?} */
    const rootTView = /** @type {?} */ ((readPatchedLViewData(component)))[TVIEW];
    // Root component is always created at dir index 0
    queueInitHooks(0, def.onInit, def.doCheck, rootTView);
    // Directive starting index 0, directive count 1 -> directive flags: 1
    queueLifecycleHooks(1, rootTView);
}
/**
 * Retrieve the root context for any component by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param {?} component any component
 * @return {?}
 */
function getRootContext(component) {
    /** @type {?} */
    const rootContext = /** @type {?} */ (getRootView(component)[CONTEXT]);
    ngDevMode && assertDefined(rootContext, 'rootContext');
    return rootContext;
}
/**
 * Retrieve the host element of the component.
 *
 * Use this function to retrieve the host element of the component. The host
 * element is the element which the component is associated with.
 *
 * @template T
 * @param {?} component Component for which the host element should be retrieved.
 * @return {?}
 */
export function getHostElement(component) {
    return /** @type {?} */ (getLElementFromComponent(component).native);
}
/**
 * Retrieves the rendered text for a given component.
 *
 * This function retrieves the host element of a component and
 * and then returns the `textContent` for that element. This implies
 * that the text returned will include re-projected content of
 * the component as well.
 *
 * @param {?} component The component to return the content text for.
 * @return {?}
 */
export function getRenderedText(component) {
    /** @type {?} */
    const hostElement = getHostElement(component);
    return hostElement.textContent || '';
}
/**
 * Wait on component until it is rendered.
 *
 * This function returns a `Promise` which is resolved when the component's
 * change detection is executed. This is determined by finding the scheduler
 * associated with the `component`'s render tree and waiting until the scheduler
 * flushes. If nothing is scheduled, the function returns a resolved promise.
 *
 * Example:
 * ```
 * await whenRendered(myComponent);
 * ```
 *
 * @param {?} component Component to wait upon
 * @return {?} Promise which resolves when the component is rendered.
 */
export function whenRendered(component) {
    return getRootContext(component).clean;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFjQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxtQkFBbUIsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLFNBQVMsRUFBRSwwQkFBMEIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsd0JBQXdCLEdBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUdsUSxPQUFPLEVBQTZCLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEYsT0FBTyxFQUFxQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDakMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFEbkYsYUFBYSxhQUFhLEdBQWE7SUFDckMsR0FBRyxFQUFFLENBQUMsS0FBVSxFQUFFLGFBQW1CLEVBQUUsRUFBRTtRQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ2pFO0NBQ0YsQ0FBQzs7Ozs7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QUFjOztJQUM1QyxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDOUMsT0FBTyxXQUFXLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztDQUN0Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkQsTUFBTSxVQUFVLFlBQVksQ0FBQyxTQUFjO0lBQ3pDLE9BQU8sY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQztDQUN4QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZSBmcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vY29yZSc7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlLCBhc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge3F1ZXVlSW5pdEhvb2tzLCBxdWV1ZUxpZmVjeWNsZUhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7Q0xFQU5fUFJPTUlTRSwgYmFzZURpcmVjdGl2ZUNyZWF0ZSwgY3JlYXRlTFZpZXdEYXRhLCBjcmVhdGVUVmlldywgZGV0ZWN0Q2hhbmdlc0ludGVybmFsLCBlbnRlclZpZXcsIGV4ZWN1dGVJbml0QW5kQ29udGVudEhvb2tzLCBnZXRSb290VmlldywgaG9zdEVsZW1lbnQsIGxlYXZlVmlldywgbG9jYXRlSG9zdEVsZW1lbnQsIHNldEhvc3RCaW5kaW5ncywgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrLH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudERlZkludGVybmFsLCBDb21wb25lbnRUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xFbGVtZW50Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXJGYWN0b3J5MywgZG9tUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBSb290Q29udGV4dCwgSU5KRUNUT1IsIENPTlRFWFQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXRMRWxlbWVudEZyb21Db21wb25lbnQsIHJlYWRQYXRjaGVkTFZpZXdEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcblxuXG4vKiogT3B0aW9ucyB0aGF0IGNvbnRyb2wgaG93IHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIGJvb3RzdHJhcHBlZC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucyB7XG4gIC8qKiBXaGljaCByZW5kZXJlciBmYWN0b3J5IHRvIHVzZS4gKi9cbiAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MztcblxuICAvKiogQSBjdXN0b20gc2FuaXRpemVyIGluc3RhbmNlICovXG4gIHNhbml0aXplcj86IFNhbml0aXplcjtcblxuICAvKipcbiAgICogSG9zdCBlbGVtZW50IG9uIHdoaWNoIHRoZSBjb21wb25lbnQgd2lsbCBiZSBib290c3RyYXBwZWQuIElmIG5vdCBzcGVjaWZpZWQsXG4gICAqIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbidzIGB0YWdgIGlzIHVzZWQgdG8gcXVlcnkgdGhlIGV4aXN0aW5nIERPTSBmb3IgdGhlXG4gICAqIGVsZW1lbnQgdG8gYm9vdHN0cmFwLlxuICAgKi9cbiAgaG9zdD86IFJFbGVtZW50fHN0cmluZztcblxuICAvKiogTW9kdWxlIGluamVjdG9yIGZvciB0aGUgY29tcG9uZW50LiBJZiB1bnNwZWNpZmllZCwgdGhlIGluamVjdG9yIHdpbGwgYmUgTlVMTF9JTkpFQ1RPUi4gKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcblxuICAvKipcbiAgICogTGlzdCBvZiBmZWF0dXJlcyB0byBiZSBhcHBsaWVkIHRvIHRoZSBjcmVhdGVkIGNvbXBvbmVudC4gRmVhdHVyZXMgYXJlIHNpbXBseVxuICAgKiBmdW5jdGlvbnMgdGhhdCBkZWNvcmF0ZSBhIGNvbXBvbmVudCB3aXRoIGEgY2VydGFpbiBiZWhhdmlvci5cbiAgICpcbiAgICogVHlwaWNhbGx5LCB0aGUgZmVhdHVyZXMgaW4gdGhpcyBsaXN0IGFyZSBmZWF0dXJlcyB0aGF0IGNhbm5vdCBiZSBhZGRlZCB0byB0aGVcbiAgICogb3RoZXIgZmVhdHVyZXMgbGlzdCBpbiB0aGUgY29tcG9uZW50IGRlZmluaXRpb24gYmVjYXVzZSB0aGV5IHJlbHkgb24gb3RoZXIgZmFjdG9ycy5cbiAgICpcbiAgICogRXhhbXBsZTogYFJvb3RMaWZlY3ljbGVIb29rc2AgaXMgYSBmdW5jdGlvbiB0aGF0IGFkZHMgbGlmZWN5Y2xlIGhvb2sgY2FwYWJpbGl0aWVzXG4gICAqIHRvIHJvb3QgY29tcG9uZW50cyBpbiBhIHRyZWUtc2hha2FibGUgd2F5LiBJdCBjYW5ub3QgYmUgYWRkZWQgdG8gdGhlIGNvbXBvbmVudFxuICAgKiBmZWF0dXJlcyBsaXN0IGJlY2F1c2UgdGhlcmUncyBubyB3YXkgb2Yga25vd2luZyB3aGVuIHRoZSBjb21wb25lbnQgd2lsbCBiZSB1c2VkIGFzXG4gICAqIGEgcm9vdCBjb21wb25lbnQuXG4gICAqL1xuICBob3N0RmVhdHVyZXM/OiBIb3N0RmVhdHVyZVtdO1xuXG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHdoaWNoIGlzIHVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiB3b3JrIGluIHRoZSBmdXR1cmUuXG4gICAqXG4gICAqIFdoZW4gbWFya2luZyBjb21wb25lbnRzIGFzIGRpcnR5LCBpdCBpcyBuZWNlc3NhcnkgdG8gc2NoZWR1bGUgdGhlIHdvcmsgb2ZcbiAgICogY2hhbmdlIGRldGVjdGlvbiBpbiB0aGUgZnV0dXJlLiBUaGlzIGlzIGRvbmUgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAgICoge0BsaW5rIG1hcmtEaXJ0eX0gY2FsbHMgaW50byBhIHNpbmdsZSBjaGFuZ2VkIGRldGVjdGlvbiBwcm9jZXNzaW5nLlxuICAgKlxuICAgKiBUaGUgZGVmYXVsdCB2YWx1ZSBvZiB0aGUgc2NoZWR1bGVyIGlzIHRoZSBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBmdW5jdGlvbi5cbiAgICpcbiAgICogSXQgaXMgYWxzbyB1c2VmdWwgdG8gb3ZlcnJpZGUgdGhpcyBmdW5jdGlvbiBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgICovXG4gIHNjaGVkdWxlcj86ICh3b3JrOiAoKSA9PiB2b2lkKSA9PiB2b2lkO1xufVxuXG4vKiogU2VlIENyZWF0ZUNvbXBvbmVudE9wdGlvbnMuaG9zdEZlYXR1cmVzICovXG50eXBlIEhvc3RGZWF0dXJlID0gKDxUPihjb21wb25lbnQ6IFQsIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQsIHN0cmluZz4pID0+IHZvaWQpO1xuXG4vLyBUT0RPOiBBIGhhY2sgdG8gbm90IHB1bGwgaW4gdGhlIE51bGxJbmplY3RvciBmcm9tIEBhbmd1bGFyL2NvcmUuXG5leHBvcnQgY29uc3QgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3IgPSB7XG4gIGdldDogKHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGxJbmplY3RvcjogTm90IGZvdW5kOiAnICsgc3RyaW5naWZ5KHRva2VuKSk7XG4gIH1cbn07XG5cbi8qKlxuICogQm9vdHN0cmFwcyBhIENvbXBvbmVudCBpbnRvIGFuIGV4aXN0aW5nIGhvc3QgZWxlbWVudCBhbmQgcmV0dXJucyBhbiBpbnN0YW5jZVxuICogb2YgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBVc2UgdGhpcyBmdW5jdGlvbiB0byBib290c3RyYXAgYSBjb21wb25lbnQgaW50byB0aGUgRE9NIHRyZWUuIEVhY2ggaW52b2NhdGlvblxuICogb2YgdGhpcyBmdW5jdGlvbiB3aWxsIGNyZWF0ZSBhIHNlcGFyYXRlIHRyZWUgb2YgY29tcG9uZW50cywgaW5qZWN0b3JzIGFuZFxuICogY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMgYW5kIGxpZmV0aW1lcy4gVG8gZHluYW1pY2FsbHkgaW5zZXJ0IGEgbmV3IGNvbXBvbmVudFxuICogaW50byBhbiBleGlzdGluZyB0cmVlIHN1Y2ggdGhhdCBpdCBzaGFyZXMgdGhlIHNhbWUgaW5qZWN0aW9uLCBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBhbmQgb2JqZWN0IGxpZmV0aW1lLCB1c2Uge0BsaW5rIFZpZXdDb250YWluZXIjY3JlYXRlQ29tcG9uZW50fS5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VHlwZSBDb21wb25lbnQgdG8gYm9vdHN0cmFwXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBwYXJhbWV0ZXJzIHdoaWNoIGNvbnRyb2wgYm9vdHN0cmFwcGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGU8VD58XG4gICAgICAgIFR5cGU8VD4vKiBUeXBlIGFzIHdvcmthcm91bmQgZm9yOiBNaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNDg4MSAqL1xuICAgICxcbiAgICBvcHRzOiBDcmVhdGVDb21wb25lbnRPcHRpb25zID0ge30pOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50VHlwZSk7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IG9wdHMucmVuZGVyZXJGYWN0b3J5IHx8IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gIGNvbnN0IHNhbml0aXplciA9IG9wdHMuc2FuaXRpemVyIHx8IG51bGw7XG4gIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZjxUPihjb21wb25lbnRUeXBlKSAhO1xuICBpZiAoY29tcG9uZW50RGVmLnR5cGUgIT0gY29tcG9uZW50VHlwZSkgY29tcG9uZW50RGVmLnR5cGUgPSBjb21wb25lbnRUeXBlO1xuXG4gIC8vIFRoZSBmaXJzdCBpbmRleCBvZiB0aGUgZmlyc3Qgc2VsZWN0b3IgaXMgdGhlIHRhZyBuYW1lLlxuICBjb25zdCBjb21wb25lbnRUYWcgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG4gIGNvbnN0IGhvc3ROb2RlID0gbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCBvcHRzLmhvc3QgfHwgY29tcG9uZW50VGFnKTtcbiAgY29uc3Qgcm9vdEZsYWdzID0gY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLklzUm9vdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gY3JlYXRlUm9vdENvbnRleHQob3B0cy5zY2hlZHVsZXIgfHwgcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KSk7XG5cbiAgY29uc3Qgcm9vdFZpZXc6IExWaWV3RGF0YSA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihob3N0Tm9kZSwgY29tcG9uZW50RGVmKSxcbiAgICAgIGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsKSwgcm9vdENvbnRleHQsIHJvb3RGbGFncyk7XG4gIHJvb3RWaWV3W0lOSkVDVE9SXSA9IG9wdHMuaW5qZWN0b3IgfHwgbnVsbDtcblxuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KHJvb3RWaWV3LCBudWxsKTtcbiAgbGV0IGVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGU7XG4gIGxldCBjb21wb25lbnQ6IFQ7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG5cbiAgICAvLyBDcmVhdGUgZWxlbWVudCBub2RlIGF0IGluZGV4IDAgaW4gZGF0YSBhcnJheVxuICAgIGVsZW1lbnROb2RlID0gaG9zdEVsZW1lbnQoY29tcG9uZW50VGFnLCBob3N0Tm9kZSwgY29tcG9uZW50RGVmLCBzYW5pdGl6ZXIpO1xuICAgIGNvbXBvbmVudCA9IGNyZWF0ZVJvb3RDb21wb25lbnQoXG4gICAgICAgIGVsZW1lbnROb2RlLCBjb21wb25lbnREZWYsIHJvb3RWaWV3LCByb290Q29udGV4dCwgb3B0cy5ob3N0RmVhdHVyZXMgfHwgbnVsbCk7XG5cbiAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbChlbGVtZW50Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSwgY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJvb3QgY29tcG9uZW50IGFuZCBzZXRzIGl0IHVwIHdpdGggZmVhdHVyZXMgYW5kIGhvc3QgYmluZGluZ3MuIFNoYXJlZCBieVxuICogcmVuZGVyQ29tcG9uZW50KCkgYW5kIFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIGVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGUsIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQsIHN0cmluZz4sIHJvb3RWaWV3OiBMVmlld0RhdGEsXG4gICAgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBob3N0RmVhdHVyZXM6IEhvc3RGZWF0dXJlW10gfCBudWxsKTogYW55IHtcbiAgLy8gQ3JlYXRlIGRpcmVjdGl2ZSBpbnN0YW5jZSB3aXRoIGZhY3RvcnkoKSBhbmQgc3RvcmUgYXQgaW5kZXggMCBpbiBkaXJlY3RpdmVzIGFycmF5XG4gIGNvbnN0IGNvbXBvbmVudCA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoMCwgY29tcG9uZW50RGVmLmZhY3RvcnkoKSBhcyBULCBjb21wb25lbnREZWYsIGVsZW1lbnROb2RlKTtcblxuICBpZiAoY29tcG9uZW50RGVmLmhvc3RCaW5kaW5ncykgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKDAsIGNvbXBvbmVudERlZi5ob3N0VmFycyk7XG4gIHJvb3RDb250ZXh0LmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAoZWxlbWVudE5vZGUuZGF0YSBhcyBMVmlld0RhdGEpW0NPTlRFWFRdID0gY29tcG9uZW50O1xuXG4gIGhvc3RGZWF0dXJlcyAmJiBob3N0RmVhdHVyZXMuZm9yRWFjaCgoZmVhdHVyZSkgPT4gZmVhdHVyZShjb21wb25lbnQsIGNvbXBvbmVudERlZikpO1xuICBzZXRIb3N0QmluZGluZ3Mocm9vdFZpZXdbVFZJRVddLmhvc3RCaW5kaW5ncyk7XG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb250ZXh0KHNjaGVkdWxlcjogKHdvcmtGbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk6IFJvb3RDb250ZXh0IHtcbiAgcmV0dXJuIHtcbiAgICBjb21wb25lbnRzOiBbXSxcbiAgICBzY2hlZHVsZXI6IHNjaGVkdWxlcixcbiAgICBjbGVhbjogQ0xFQU5fUFJPTUlTRSxcbiAgfTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGVuYWJsZSBsaWZlY3ljbGUgaG9va3Mgb24gdGhlIHJvb3QgY29tcG9uZW50LlxuICpcbiAqIEluY2x1ZGUgdGhpcyBmZWF0dXJlIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBpZiB0aGUgcm9vdCBjb21wb25lbnRcbiAqIHlvdSBhcmUgcmVuZGVyaW5nIGhhcyBsaWZlY3ljbGUgaG9va3MgZGVmaW5lZC4gT3RoZXJ3aXNlLCB0aGUgaG9va3Mgd29uJ3RcbiAqIGJlIGNhbGxlZCBwcm9wZXJseS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogcmVuZGVyQ29tcG9uZW50KEFwcENvbXBvbmVudCwge2ZlYXR1cmVzOiBbUm9vdExpZmVjeWNsZUhvb2tzXX0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBMaWZlY3ljbGVIb29rc0ZlYXR1cmUoY29tcG9uZW50OiBhbnksIGRlZjogQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBjb25zdCByb290VFZpZXcgPSByZWFkUGF0Y2hlZExWaWV3RGF0YShjb21wb25lbnQpICFbVFZJRVddO1xuXG4gIC8vIFJvb3QgY29tcG9uZW50IGlzIGFsd2F5cyBjcmVhdGVkIGF0IGRpciBpbmRleCAwXG4gIHF1ZXVlSW5pdEhvb2tzKDAsIGRlZi5vbkluaXQsIGRlZi5kb0NoZWNrLCByb290VFZpZXcpO1xuICAvLyBEaXJlY3RpdmUgc3RhcnRpbmcgaW5kZXggMCwgZGlyZWN0aXZlIGNvdW50IDEgLT4gZGlyZWN0aXZlIGZsYWdzOiAxXG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3MoMSwgcm9vdFRWaWV3KTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCBjb250ZXh0IGZvciBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdgIHVudGlsXG4gKiByZWFjaGluZyB0aGUgcm9vdCBgTFZpZXdgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgYW55IGNvbXBvbmVudFxuICovXG5mdW5jdGlvbiBnZXRSb290Q29udGV4dChjb21wb25lbnQ6IGFueSk6IFJvb3RDb250ZXh0IHtcbiAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Vmlldyhjb21wb25lbnQpW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChyb290Q29udGV4dCwgJ3Jvb3RDb250ZXh0Jyk7XG4gIHJldHVybiByb290Q29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQuXG4gKlxuICogVXNlIHRoaXMgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50LiBUaGUgaG9zdFxuICogZWxlbWVudCBpcyB0aGUgZWxlbWVudCB3aGljaCB0aGUgY29tcG9uZW50IGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCBmb3Igd2hpY2ggdGhlIGhvc3QgZWxlbWVudCBzaG91bGQgYmUgcmV0cmlldmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9zdEVsZW1lbnQ8VD4oY29tcG9uZW50OiBUKTogSFRNTEVsZW1lbnQge1xuICByZXR1cm4gZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50KGNvbXBvbmVudCkubmF0aXZlIGFzIGFueTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHJlbmRlcmVkIHRleHQgZm9yIGEgZ2l2ZW4gY29tcG9uZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmV0cmlldmVzIHRoZSBob3N0IGVsZW1lbnQgb2YgYSBjb21wb25lbnQgYW5kXG4gKiBhbmQgdGhlbiByZXR1cm5zIHRoZSBgdGV4dENvbnRlbnRgIGZvciB0aGF0IGVsZW1lbnQuIFRoaXMgaW1wbGllc1xuICogdGhhdCB0aGUgdGV4dCByZXR1cm5lZCB3aWxsIGluY2x1ZGUgcmUtcHJvamVjdGVkIGNvbnRlbnQgb2ZcbiAqIHRoZSBjb21wb25lbnQgYXMgd2VsbC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gcmV0dXJuIHRoZSBjb250ZW50IHRleHQgZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZWRUZXh0KGNvbXBvbmVudDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgaG9zdEVsZW1lbnQgPSBnZXRIb3N0RWxlbWVudChjb21wb25lbnQpO1xuICByZXR1cm4gaG9zdEVsZW1lbnQudGV4dENvbnRlbnQgfHwgJyc7XG59XG5cbi8qKlxuICogV2FpdCBvbiBjb21wb25lbnQgdW50aWwgaXQgaXMgcmVuZGVyZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgYFByb21pc2VgIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gdGhlIGNvbXBvbmVudCdzXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uIGlzIGV4ZWN1dGVkLiBUaGlzIGlzIGRldGVybWluZWQgYnkgZmluZGluZyB0aGUgc2NoZWR1bGVyXG4gKiBhc3NvY2lhdGVkIHdpdGggdGhlIGBjb21wb25lbnRgJ3MgcmVuZGVyIHRyZWUgYW5kIHdhaXRpbmcgdW50aWwgdGhlIHNjaGVkdWxlclxuICogZmx1c2hlcy4gSWYgbm90aGluZyBpcyBzY2hlZHVsZWQsIHRoZSBmdW5jdGlvbiByZXR1cm5zIGEgcmVzb2x2ZWQgcHJvbWlzZS5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiBhd2FpdCB3aGVuUmVuZGVyZWQobXlDb21wb25lbnQpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gd2FpdCB1cG9uXG4gKiBAcmV0dXJucyBQcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gdGhlIGNvbXBvbmVudCBpcyByZW5kZXJlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoZW5SZW5kZXJlZChjb21wb25lbnQ6IGFueSk6IFByb21pc2U8bnVsbD4ge1xuICByZXR1cm4gZ2V0Um9vdENvbnRleHQoY29tcG9uZW50KS5jbGVhbjtcbn1cbiJdfQ==