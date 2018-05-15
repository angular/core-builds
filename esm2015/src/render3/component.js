/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertComponentType, assertNotNull } from './assert';
import { queueInitHooks, queueLifecycleHooks } from './hooks';
import { CLEAN_PROMISE, ROOT_DIRECTIVE_INDICES, _getComponentHostLElementNode, baseDirectiveCreate, createLView, createTView, detectChangesInternal, enterView, executeInitAndContentHooks, getRootView, hostElement, initChangeDetectorIfExisting, leaveView, locateHostElement, setHostBindings } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { stringify } from './util';
import { createViewRef } from './view_ref';
/**
 * Options that control how the component should be bootstrapped.
 * @record
 */
export function CreateComponentOptions() { }
function CreateComponentOptions_tsickle_Closure_declarations() {
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
}
/**
 * Bootstraps a component, then creates and returns a `ComponentRef` for that component.
 *
 * @template T
 * @param {?} componentType Component to bootstrap
 * @param {?} opts
 * @return {?}
 */
export function createComponentRef(componentType, opts) {
    const /** @type {?} */ component = renderComponent(componentType, opts);
    const /** @type {?} */ hostView = /** @type {?} */ (_getComponentHostLElementNode(component).data);
    const /** @type {?} */ hostViewRef = createViewRef(hostView, component);
    return {
        location: { nativeElement: getHostElement(component) },
        injector: opts.injector || NULL_INJECTOR,
        instance: component,
        hostView: hostViewRef,
        changeDetectorRef: hostViewRef,
        componentType: componentType,
        // TODO: implement destroy and onDestroy
        destroy: () => { },
        onDestroy: (cb) => { }
    };
}
// TODO: A hack to not pull in the NullInjector from @angular/core.
export const /** @type {?} */ NULL_INJECTOR = {
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
    const /** @type {?} */ rendererFactory = opts.rendererFactory || domRendererFactory3;
    const /** @type {?} */ sanitizer = opts.sanitizer || null;
    const /** @type {?} */ componentDef = /** @type {?} */ ((/** @type {?} */ (componentType)).ngComponentDef);
    if (componentDef.type != componentType)
        componentDef.type = componentType;
    let /** @type {?} */ component;
    // The first index of the first selector is the tag name.
    const /** @type {?} */ componentTag = /** @type {?} */ (((/** @type {?} */ ((componentDef.selectors))[0]))[0]);
    const /** @type {?} */ hostNode = locateHostElement(rendererFactory, opts.host || componentTag);
    const /** @type {?} */ rootContext = {
        // Incomplete initialization due to circular reference.
        component: /** @type {?} */ ((null)),
        scheduler: opts.scheduler || requestAnimationFrame.bind(window),
        clean: CLEAN_PROMISE,
    };
    const /** @type {?} */ rootView = createLView(-1, rendererFactory.createRenderer(hostNode, componentDef.rendererType), createTView(null, null), null, rootContext, componentDef.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */);
    rootView.injector = opts.injector || null;
    const /** @type {?} */ oldView = enterView(rootView, /** @type {?} */ ((null)));
    let /** @type {?} */ elementNode;
    try {
        if (rendererFactory.begin)
            rendererFactory.begin();
        // Create element node at index 0 in data array
        elementNode = hostElement(componentTag, hostNode, componentDef, sanitizer);
        // Create directive instance with factory() and store at index 0 in directives array
        component = rootContext.component = /** @type {?} */ (baseDirectiveCreate(0, componentDef.factory(), componentDef));
        initChangeDetectorIfExisting(elementNode.nodeInjector, component, /** @type {?} */ ((elementNode.data)));
        opts.hostFeatures && opts.hostFeatures.forEach((feature) => feature(component, componentDef));
        executeInitAndContentHooks();
        setHostBindings(ROOT_DIRECTIVE_INDICES);
        detectChangesInternal(/** @type {?} */ (elementNode.data), elementNode, componentDef, component);
    }
    finally {
        leaveView(oldView);
        if (rendererFactory.end)
            rendererFactory.end();
    }
    return component;
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
    const /** @type {?} */ elementNode = _getComponentHostLElementNode(component);
    // Root component is always created at dir index 0
    queueInitHooks(0, def.onInit, def.doCheck, elementNode.view.tView);
    queueLifecycleHooks(/** @type {?} */ ((elementNode.tNode)).flags, elementNode.view);
}
/**
 * Retrieve the root context for any component by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param {?} component any component
 * @return {?}
 */
function getRootContext(component) {
    const /** @type {?} */ rootContext = /** @type {?} */ (getRootView(component).context);
    ngDevMode && assertNotNull(rootContext, 'rootContext');
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
    return /** @type {?} */ (_getComponentHostLElementNode(component).native);
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
    const /** @type {?} */ hostElement = getHostElement(component);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFlQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSw2QkFBNkIsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLFNBQVMsRUFBRSwwQkFBMEIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUd4VCxPQUFPLEVBQTZCLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFdEYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNqQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlEekMsTUFBTSw2QkFDRixhQUErQixFQUFFLElBQTRCO0lBQy9ELHVCQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZELHVCQUFNLFFBQVEscUJBQUcsNkJBQTZCLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBYSxDQUFBLENBQUM7SUFDeEUsdUJBQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdkQsT0FBTztRQUNMLFFBQVEsRUFBRSxFQUFDLGFB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RyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDOUMsT0FBTyxXQUFXLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztDQUN0Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkQsTUFBTSx1QkFBdUIsU0FBYztJQUN6QyxPQUFPLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUM7Q0FDeEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmUgZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlLCBhc3NlcnROb3ROdWxsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge3F1ZXVlSW5pdEhvb2tzLCBxdWV1ZUxpZmVjeWNsZUhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7Q0xFQU5fUFJPTUlTRSwgUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUywgX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUsIGJhc2VEaXJlY3RpdmVDcmVhdGUsIGNyZWF0ZUxWaWV3LCBjcmVhdGVUVmlldywgZGV0ZWN0Q2hhbmdlc0ludGVybmFsLCBlbnRlclZpZXcsIGV4ZWN1dGVJbml0QW5kQ29udGVudEhvb2tzLCBnZXRSb290VmlldywgaG9zdEVsZW1lbnQsIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcsIGxlYXZlVmlldywgbG9jYXRlSG9zdEVsZW1lbnQsIHNldEhvc3RCaW5kaW5nc30gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEVsZW1lbnROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlckZhY3RvcnkzLCBkb21SZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlldywgTFZpZXdGbGFncywgUm9vdENvbnRleHR9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjcmVhdGVWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKiBPcHRpb25zIHRoYXQgY29udHJvbCBob3cgdGhlIGNvbXBvbmVudCBzaG91bGQgYmUgYm9vdHN0cmFwcGVkLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVDb21wb25lbnRPcHRpb25zIHtcbiAgLyoqIFdoaWNoIHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlLiAqL1xuICByZW5kZXJlckZhY3Rvcnk/OiBSZW5kZXJlckZhY3RvcnkzO1xuXG4gIC8qKiBBIGN1c3RvbSBzYW5pdGl6ZXIgaW5zdGFuY2UgKi9cbiAgc2FuaXRpemVyPzogU2FuaXRpemVyO1xuXG4gIC8qKlxuICAgKiBIb3N0IGVsZW1lbnQgb24gd2hpY2ggdGhlIGNvbXBvbmVudCB3aWxsIGJlIGJvb3RzdHJhcHBlZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uJ3MgYHRhZ2AgaXMgdXNlZCB0byBxdWVyeSB0aGUgZXhpc3RpbmcgRE9NIGZvciB0aGVcbiAgICogZWxlbWVudCB0byBib290c3RyYXAuXG4gICAqL1xuICBob3N0PzogUkVsZW1lbnR8c3RyaW5nO1xuXG4gIC8qKiBNb2R1bGUgaW5qZWN0b3IgZm9yIHRoZSBjb21wb25lbnQuIElmIHVuc3BlY2lmaWVkLCB0aGUgaW5qZWN0b3Igd2lsbCBiZSBOVUxMX0lOSkVDVE9SLiAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGZlYXR1cmVzIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGNyZWF0ZWQgY29tcG9uZW50LiBGZWF0dXJlcyBhcmUgc2ltcGx5XG4gICAqIGZ1bmN0aW9ucyB0aGF0IGRlY29yYXRlIGEgY29tcG9uZW50IHdpdGggYSBjZXJ0YWluIGJlaGF2aW9yLlxuICAgKlxuICAgKiBUeXBpY2FsbHksIHRoZSBmZWF0dXJlcyBpbiB0aGlzIGxpc3QgYXJlIGZlYXR1cmVzIHRoYXQgY2Fubm90IGJlIGFkZGVkIHRvIHRoZVxuICAgKiBvdGhlciBmZWF0dXJlcyBsaXN0IGluIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBiZWNhdXNlIHRoZXkgcmVseSBvbiBvdGhlciBmYWN0b3JzLlxuICAgKlxuICAgKiBFeGFtcGxlOiBgUm9vdExpZmVjeWNsZUhvb2tzYCBpcyBhIGZ1bmN0aW9uIHRoYXQgYWRkcyBsaWZlY3ljbGUgaG9vayBjYXBhYmlsaXRpZXNcbiAgICogdG8gcm9vdCBjb21wb25lbnRzIGluIGEgdHJlZS1zaGFrYWJsZSB3YXkuIEl0IGNhbm5vdCBiZSBhZGRlZCB0byB0aGUgY29tcG9uZW50XG4gICAqIGZlYXR1cmVzIGxpc3QgYmVjYXVzZSB0aGVyZSdzIG5vIHdheSBvZiBrbm93aW5nIHdoZW4gdGhlIGNvbXBvbmVudCB3aWxsIGJlIHVzZWQgYXNcbiAgICogYSByb290IGNvbXBvbmVudC5cbiAgICovXG4gIGhvc3RGZWF0dXJlcz86ICg8VD4oY29tcG9uZW50OiBULCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPikgPT4gdm9pZClbXTtcblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aGljaCBpcyB1c2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gd29yayBpbiB0aGUgZnV0dXJlLlxuICAgKlxuICAgKiBXaGVuIG1hcmtpbmcgY29tcG9uZW50cyBhcyBkaXJ0eSwgaXQgaXMgbmVjZXNzYXJ5IHRvIHNjaGVkdWxlIHRoZSB3b3JrIG9mXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGZ1dHVyZS4gVGhpcyBpcyBkb25lIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gICAqIHtAbGluayBtYXJrRGlydHl9IGNhbGxzIGludG8gYSBzaW5nbGUgY2hhbmdlZCBkZXRlY3Rpb24gcHJvY2Vzc2luZy5cbiAgICpcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgb2YgdGhlIHNjaGVkdWxlciBpcyB0aGUgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgZnVuY3Rpb24uXG4gICAqXG4gICAqIEl0IGlzIGFsc28gdXNlZnVsIHRvIG92ZXJyaWRlIHRoaXMgZnVuY3Rpb24gZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gICAqL1xuICBzY2hlZHVsZXI/OiAod29yazogKCkgPT4gdm9pZCkgPT4gdm9pZDtcbn1cblxuXG4vKipcbiAqIEJvb3RzdHJhcHMgYSBjb21wb25lbnQsIHRoZW4gY3JlYXRlcyBhbmQgcmV0dXJucyBhIGBDb21wb25lbnRSZWZgIGZvciB0aGF0IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VHlwZSBDb21wb25lbnQgdG8gYm9vdHN0cmFwXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBwYXJhbWV0ZXJzIHdoaWNoIGNvbnRyb2wgYm9vdHN0cmFwcGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29tcG9uZW50UmVmPFQ+KFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGU8VD4sIG9wdHM6IENyZWF0ZUNvbXBvbmVudE9wdGlvbnMpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gIGNvbnN0IGNvbXBvbmVudCA9IHJlbmRlckNvbXBvbmVudChjb21wb25lbnRUeXBlLCBvcHRzKTtcbiAgY29uc3QgaG9zdFZpZXcgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpLmRhdGEgYXMgTFZpZXc7XG4gIGNvbnN0IGhvc3RWaWV3UmVmID0gY3JlYXRlVmlld1JlZihob3N0VmlldywgY29tcG9uZW50KTtcbiAgcmV0dXJuIHtcbiAgICBsb2NhdGlvbjoge25hdGl2ZUVsZW1lbnQ6IGdldEhvc3RFbGVtZW50KGNvbXBvbmVudCl9LFxuICAgIGluamVjdG9yOiBvcHRzLmluamVjdG9yIHx8IE5VTExfSU5KRUNUT1IsXG4gICAgaW5zdGFuY2U6IGNvbXBvbmVudCxcbiAgICBob3N0VmlldzogaG9zdFZpZXdSZWYsXG4gICAgY2hhbmdlRGV0ZWN0b3JSZWY6IGhvc3RWaWV3UmVmLFxuICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgLy8gVE9ETzogaW1wbGVtZW50IGRlc3Ryb3kgYW5kIG9uRGVzdHJveVxuICAgIGRlc3Ryb3k6ICgpID0+IHt9LFxuICAgIG9uRGVzdHJveTogKGNiOiBGdW5jdGlvbikgPT4ge31cbiAgfTtcbn1cblxuXG4vLyBUT0RPOiBBIGhhY2sgdG8gbm90IHB1bGwgaW4gdGhlIE51bGxJbmplY3RvciBmcm9tIEBhbmd1bGFyL2NvcmUuXG5leHBvcnQgY29uc3QgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3IgPSB7XG4gIGdldDogKHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGxJbmplY3RvcjogTm90IGZvdW5kOiAnICsgc3RyaW5naWZ5KHRva2VuKSk7XG4gIH1cbn07XG5cbi8qKlxuICogQm9vdHN0cmFwcyBhIENvbXBvbmVudCBpbnRvIGFuIGV4aXN0aW5nIGhvc3QgZWxlbWVudCBhbmQgcmV0dXJucyBhbiBpbnN0YW5jZVxuICogb2YgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBVc2UgdGhpcyBmdW5jdGlvbiB0byBib290c3RyYXAgYSBjb21wb25lbnQgaW50byB0aGUgRE9NIHRyZWUuIEVhY2ggaW52b2NhdGlvblxuICogb2YgdGhpcyBmdW5jdGlvbiB3aWxsIGNyZWF0ZSBhIHNlcGFyYXRlIHRyZWUgb2YgY29tcG9uZW50cywgaW5qZWN0b3JzIGFuZFxuICogY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMgYW5kIGxpZmV0aW1lcy4gVG8gZHluYW1pY2FsbHkgaW5zZXJ0IGEgbmV3IGNvbXBvbmVudFxuICogaW50byBhbiBleGlzdGluZyB0cmVlIHN1Y2ggdGhhdCBpdCBzaGFyZXMgdGhlIHNhbWUgaW5qZWN0aW9uLCBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBhbmQgb2JqZWN0IGxpZmV0aW1lLCB1c2Uge0BsaW5rIFZpZXdDb250YWluZXIjY3JlYXRlQ29tcG9uZW50fS5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VHlwZSBDb21wb25lbnQgdG8gYm9vdHN0cmFwXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBwYXJhbWV0ZXJzIHdoaWNoIGNvbnRyb2wgYm9vdHN0cmFwcGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGU8VD58XG4gICAgICAgIFR5cGU8VD4vKiBUeXBlIGFzIHdvcmthcm91bmQgZm9yOiBNaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNDg4MSAqL1xuICAgICxcbiAgICBvcHRzOiBDcmVhdGVDb21wb25lbnRPcHRpb25zID0ge30pOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50VHlwZSk7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IG9wdHMucmVuZGVyZXJGYWN0b3J5IHx8IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gIGNvbnN0IHNhbml0aXplciA9IG9wdHMuc2FuaXRpemVyIHx8IG51bGw7XG4gIGNvbnN0IGNvbXBvbmVudERlZiA9IChjb21wb25lbnRUeXBlIGFzIENvbXBvbmVudFR5cGU8VD4pLm5nQ29tcG9uZW50RGVmIGFzIENvbXBvbmVudERlZjxUPjtcbiAgaWYgKGNvbXBvbmVudERlZi50eXBlICE9IGNvbXBvbmVudFR5cGUpIGNvbXBvbmVudERlZi50eXBlID0gY29tcG9uZW50VHlwZTtcbiAgbGV0IGNvbXBvbmVudDogVDtcbiAgLy8gVGhlIGZpcnN0IGluZGV4IG9mIHRoZSBmaXJzdCBzZWxlY3RvciBpcyB0aGUgdGFnIG5hbWUuXG4gIGNvbnN0IGNvbXBvbmVudFRhZyA9IGNvbXBvbmVudERlZi5zZWxlY3RvcnMgIVswXSAhWzBdIGFzIHN0cmluZztcbiAgY29uc3QgaG9zdE5vZGUgPSBsb2NhdGVIb3N0RWxlbWVudChyZW5kZXJlckZhY3RvcnksIG9wdHMuaG9zdCB8fCBjb21wb25lbnRUYWcpO1xuICBjb25zdCByb290Q29udGV4dDogUm9vdENvbnRleHQgPSB7XG4gICAgLy8gSW5jb21wbGV0ZSBpbml0aWFsaXphdGlvbiBkdWUgdG8gY2lyY3VsYXIgcmVmZXJlbmNlLlxuICAgIGNvbXBvbmVudDogbnVsbCAhLFxuICAgIHNjaGVkdWxlcjogb3B0cy5zY2hlZHVsZXIgfHwgcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KSxcbiAgICBjbGVhbjogQ0xFQU5fUFJPTUlTRSxcbiAgfTtcbiAgY29uc3Qgcm9vdFZpZXc6IExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAtMSwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3ROb2RlLCBjb21wb25lbnREZWYucmVuZGVyZXJUeXBlKSxcbiAgICAgIGNyZWF0ZVRWaWV3KG51bGwsIG51bGwpLCBudWxsLCByb290Q29udGV4dCxcbiAgICAgIGNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG4gIHJvb3RWaWV3LmluamVjdG9yID0gb3B0cy5pbmplY3RvciB8fCBudWxsO1xuXG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcocm9vdFZpZXcsIG51bGwgISk7XG4gIGxldCBlbGVtZW50Tm9kZTogTEVsZW1lbnROb2RlO1xuICB0cnkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuXG4gICAgLy8gQ3JlYXRlIGVsZW1lbnQgbm9kZSBhdCBpbmRleCAwIGluIGRhdGEgYXJyYXlcbiAgICBlbGVtZW50Tm9kZSA9IGhvc3RFbGVtZW50KGNvbXBvbmVudFRhZywgaG9zdE5vZGUsIGNvbXBvbmVudERlZiwgc2FuaXRpemVyKTtcblxuICAgIC8vIENyZWF0ZSBkaXJlY3RpdmUgaW5zdGFuY2Ugd2l0aCBmYWN0b3J5KCkgYW5kIHN0b3JlIGF0IGluZGV4IDAgaW4gZGlyZWN0aXZlcyBhcnJheVxuICAgIGNvbXBvbmVudCA9IHJvb3RDb250ZXh0LmNvbXBvbmVudCA9XG4gICAgICAgIGJhc2VEaXJlY3RpdmVDcmVhdGUoMCwgY29tcG9uZW50RGVmLmZhY3RvcnkoKSwgY29tcG9uZW50RGVmKSBhcyBUO1xuICAgIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcoZWxlbWVudE5vZGUubm9kZUluamVjdG9yLCBjb21wb25lbnQsIGVsZW1lbnROb2RlLmRhdGEgISk7XG5cbiAgICBvcHRzLmhvc3RGZWF0dXJlcyAmJiBvcHRzLmhvc3RGZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlKSA9PiBmZWF0dXJlKGNvbXBvbmVudCwgY29tcG9uZW50RGVmKSk7XG5cbiAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuICAgIHNldEhvc3RCaW5kaW5ncyhST09UX0RJUkVDVElWRV9JTkRJQ0VTKTtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoZWxlbWVudE5vZGUuZGF0YSBhcyBMVmlldywgZWxlbWVudE5vZGUsIGNvbXBvbmVudERlZiwgY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cbi8qKlxuICogVXNlZCB0byBlbmFibGUgbGlmZWN5Y2xlIGhvb2tzIG9uIHRoZSByb290IGNvbXBvbmVudC5cbiAqXG4gKiBJbmNsdWRlIHRoaXMgZmVhdHVyZSB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgaWYgdGhlIHJvb3QgY29tcG9uZW50XG4gKiB5b3UgYXJlIHJlbmRlcmluZyBoYXMgbGlmZWN5Y2xlIGhvb2tzIGRlZmluZWQuIE90aGVyd2lzZSwgdGhlIGhvb2tzIHdvbid0XG4gKiBiZSBjYWxsZWQgcHJvcGVybHkuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIHJlbmRlckNvbXBvbmVudChBcHBDb21wb25lbnQsIHtmZWF0dXJlczogW1Jvb3RMaWZlY3ljbGVIb29rc119KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKGNvbXBvbmVudDogYW55LCBkZWY6IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGNvbnN0IGVsZW1lbnROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcblxuICAvLyBSb290IGNvbXBvbmVudCBpcyBhbHdheXMgY3JlYXRlZCBhdCBkaXIgaW5kZXggMFxuICBxdWV1ZUluaXRIb29rcygwLCBkZWYub25Jbml0LCBkZWYuZG9DaGVjaywgZWxlbWVudE5vZGUudmlldy50Vmlldyk7XG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3MoZWxlbWVudE5vZGUudE5vZGUgIS5mbGFncywgZWxlbWVudE5vZGUudmlldyk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgY29udGV4dCBmb3IgYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQoY29tcG9uZW50OiBhbnkpOiBSb290Q29udGV4dCB7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KS5jb250ZXh0IGFzIFJvb3RDb250ZXh0O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChyb290Q29udGV4dCwgJ3Jvb3RDb250ZXh0Jyk7XG4gIHJldHVybiByb290Q29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQuXG4gKlxuICogVXNlIHRoaXMgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50LiBUaGUgaG9zdFxuICogZWxlbWVudCBpcyB0aGUgZWxlbWVudCB3aGljaCB0aGUgY29tcG9uZW50IGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCBmb3Igd2hpY2ggdGhlIGhvc3QgZWxlbWVudCBzaG91bGQgYmUgcmV0cmlldmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9zdEVsZW1lbnQ8VD4oY29tcG9uZW50OiBUKTogSFRNTEVsZW1lbnQge1xuICByZXR1cm4gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KS5uYXRpdmUgYXMgYW55O1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgcmVuZGVyZWQgdGV4dCBmb3IgYSBnaXZlbiBjb21wb25lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXRyaWV2ZXMgdGhlIGhvc3QgZWxlbWVudCBvZiBhIGNvbXBvbmVudCBhbmRcbiAqIGFuZCB0aGVuIHJldHVybnMgdGhlIGB0ZXh0Q29udGVudGAgZm9yIHRoYXQgZWxlbWVudC4gVGhpcyBpbXBsaWVzXG4gKiB0aGF0IHRoZSB0ZXh0IHJldHVybmVkIHdpbGwgaW5jbHVkZSByZS1wcm9qZWN0ZWQgY29udGVudCBvZlxuICogdGhlIGNvbXBvbmVudCBhcyB3ZWxsLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB0byByZXR1cm4gdGhlIGNvbnRlbnQgdGV4dCBmb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlZFRleHQoY29tcG9uZW50OiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBob3N0RWxlbWVudCA9IGdldEhvc3RFbGVtZW50KGNvbXBvbmVudCk7XG4gIHJldHVybiBob3N0RWxlbWVudC50ZXh0Q29udGVudCB8fCAnJztcbn1cblxuLyoqXG4gKiBXYWl0IG9uIGNvbXBvbmVudCB1bnRpbCBpdCBpcyByZW5kZXJlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgYSBgUHJvbWlzZWAgd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiB0aGUgY29tcG9uZW50J3NcbiAqIGNoYW5nZSBkZXRlY3Rpb24gaXMgZXhlY3V0ZWQuIFRoaXMgaXMgZGV0ZXJtaW5lZCBieSBmaW5kaW5nIHRoZSBzY2hlZHVsZXJcbiAqIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGNvbXBvbmVudGAncyByZW5kZXIgdHJlZSBhbmQgd2FpdGluZyB1bnRpbCB0aGUgc2NoZWR1bGVyXG4gKiBmbHVzaGVzLiBJZiBub3RoaW5nIGlzIHNjaGVkdWxlZCwgdGhlIGZ1bmN0aW9uIHJldHVybnMgYSByZXNvbHZlZCBwcm9taXNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIGF3YWl0IHdoZW5SZW5kZXJlZChteUNvbXBvbmVudCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byB3YWl0IHVwb25cbiAqIEByZXR1cm5zIFByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiB0aGUgY29tcG9uZW50IGlzIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2hlblJlbmRlcmVkKGNvbXBvbmVudDogYW55KTogUHJvbWlzZTxudWxsPiB7XG4gIHJldHVybiBnZXRSb290Q29udGV4dChjb21wb25lbnQpLmNsZWFuO1xufVxuIl19