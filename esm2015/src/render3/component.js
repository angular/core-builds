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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFlQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSw2QkFBNkIsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLFNBQVMsRUFBRSwwQkFBMEIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUd4VCxPQUFPLEVBQTZCLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFdEYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNqQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlEekMsTUFBTSw2QkFDRixhQUErQixFQUFFLElBQTRCO0lBQy9ELHVCQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZELHVCQUFNLFFBQVEscUJBQUcsNkJBQTZCLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBYSxDQUFBLENBQUM7SUFDeEUsdUJBQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdkQsTUFBTSxDQUFDO1FBQ0wsUUFBUSxFQUFFLEVB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LENBQUMsTUFBYSxFQUFDO0NBQy9EOzs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLDBCQUEwQixTQUFjO0lBQzVDLHVCQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDO0NBQ3RDOzs7Ozs7Ozs7Ozs7Ozs7OztBQWtCRCxNQUFNLHVCQUF1QixTQUFjO0lBQ3pDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDO0NBQ3hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lIGZyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5cbmltcG9ydCB7YXNzZXJ0Q29tcG9uZW50VHlwZSwgYXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtxdWV1ZUluaXRIb29rcywgcXVldWVMaWZlY3ljbGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0NMRUFOX1BST01JU0UsIFJPT1RfRElSRUNUSVZFX0lORElDRVMsIF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlLCBiYXNlRGlyZWN0aXZlQ3JlYXRlLCBjcmVhdGVMVmlldywgY3JlYXRlVFZpZXcsIGRldGVjdENoYW5nZXNJbnRlcm5hbCwgZW50ZXJWaWV3LCBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcywgZ2V0Um9vdFZpZXcsIGhvc3RFbGVtZW50LCBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nLCBsZWF2ZVZpZXcsIGxvY2F0ZUhvc3RFbGVtZW50LCBzZXRIb3N0QmluZGluZ3N9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXJGYWN0b3J5MywgZG9tUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Y3JlYXRlVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKiogT3B0aW9ucyB0aGF0IGNvbnRyb2wgaG93IHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIGJvb3RzdHJhcHBlZC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucyB7XG4gIC8qKiBXaGljaCByZW5kZXJlciBmYWN0b3J5IHRvIHVzZS4gKi9cbiAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MztcblxuICAvKiogQSBjdXN0b20gc2FuaXRpemVyIGluc3RhbmNlICovXG4gIHNhbml0aXplcj86IFNhbml0aXplcjtcblxuICAvKipcbiAgICogSG9zdCBlbGVtZW50IG9uIHdoaWNoIHRoZSBjb21wb25lbnQgd2lsbCBiZSBib290c3RyYXBwZWQuIElmIG5vdCBzcGVjaWZpZWQsXG4gICAqIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbidzIGB0YWdgIGlzIHVzZWQgdG8gcXVlcnkgdGhlIGV4aXN0aW5nIERPTSBmb3IgdGhlXG4gICAqIGVsZW1lbnQgdG8gYm9vdHN0cmFwLlxuICAgKi9cbiAgaG9zdD86IFJFbGVtZW50fHN0cmluZztcblxuICAvKiogTW9kdWxlIGluamVjdG9yIGZvciB0aGUgY29tcG9uZW50LiBJZiB1bnNwZWNpZmllZCwgdGhlIGluamVjdG9yIHdpbGwgYmUgTlVMTF9JTkpFQ1RPUi4gKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcblxuICAvKipcbiAgICogTGlzdCBvZiBmZWF0dXJlcyB0byBiZSBhcHBsaWVkIHRvIHRoZSBjcmVhdGVkIGNvbXBvbmVudC4gRmVhdHVyZXMgYXJlIHNpbXBseVxuICAgKiBmdW5jdGlvbnMgdGhhdCBkZWNvcmF0ZSBhIGNvbXBvbmVudCB3aXRoIGEgY2VydGFpbiBiZWhhdmlvci5cbiAgICpcbiAgICogVHlwaWNhbGx5LCB0aGUgZmVhdHVyZXMgaW4gdGhpcyBsaXN0IGFyZSBmZWF0dXJlcyB0aGF0IGNhbm5vdCBiZSBhZGRlZCB0byB0aGVcbiAgICogb3RoZXIgZmVhdHVyZXMgbGlzdCBpbiB0aGUgY29tcG9uZW50IGRlZmluaXRpb24gYmVjYXVzZSB0aGV5IHJlbHkgb24gb3RoZXIgZmFjdG9ycy5cbiAgICpcbiAgICogRXhhbXBsZTogYFJvb3RMaWZlY3ljbGVIb29rc2AgaXMgYSBmdW5jdGlvbiB0aGF0IGFkZHMgbGlmZWN5Y2xlIGhvb2sgY2FwYWJpbGl0aWVzXG4gICAqIHRvIHJvb3QgY29tcG9uZW50cyBpbiBhIHRyZWUtc2hha2FibGUgd2F5LiBJdCBjYW5ub3QgYmUgYWRkZWQgdG8gdGhlIGNvbXBvbmVudFxuICAgKiBmZWF0dXJlcyBsaXN0IGJlY2F1c2UgdGhlcmUncyBubyB3YXkgb2Yga25vd2luZyB3aGVuIHRoZSBjb21wb25lbnQgd2lsbCBiZSB1c2VkIGFzXG4gICAqIGEgcm9vdCBjb21wb25lbnQuXG4gICAqL1xuICBob3N0RmVhdHVyZXM/OiAoPFQ+KGNvbXBvbmVudDogVCwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pID0+IHZvaWQpW107XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggaXMgdXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvcmsgaW4gdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogV2hlbiBtYXJraW5nIGNvbXBvbmVudHMgYXMgZGlydHksIGl0IGlzIG5lY2Vzc2FyeSB0byBzY2hlZHVsZSB0aGUgd29yayBvZlxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFRoaXMgaXMgZG9uZSB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICAgKiB7QGxpbmsgbWFya0RpcnR5fSBjYWxscyBpbnRvIGEgc2luZ2xlIGNoYW5nZWQgZGV0ZWN0aW9uIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzY2hlZHVsZXIgaXMgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBJdCBpcyBhbHNvIHVzZWZ1bCB0byBvdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICAgKi9cbiAgc2NoZWR1bGVyPzogKHdvcms6ICgpID0+IHZvaWQpID0+IHZvaWQ7XG59XG5cblxuLyoqXG4gKiBCb290c3RyYXBzIGEgY29tcG9uZW50LCB0aGVuIGNyZWF0ZXMgYW5kIHJldHVybnMgYSBgQ29tcG9uZW50UmVmYCBmb3IgdGhhdCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFR5cGUgQ29tcG9uZW50IHRvIGJvb3RzdHJhcFxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgcGFyYW1ldGVycyB3aGljaCBjb250cm9sIGJvb3RzdHJhcHBpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudFJlZjxUPihcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlPFQ+LCBvcHRzOiBDcmVhdGVDb21wb25lbnRPcHRpb25zKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICBjb25zdCBjb21wb25lbnQgPSByZW5kZXJDb21wb25lbnQoY29tcG9uZW50VHlwZSwgb3B0cyk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KS5kYXRhIGFzIExWaWV3O1xuICBjb25zdCBob3N0Vmlld1JlZiA9IGNyZWF0ZVZpZXdSZWYoaG9zdFZpZXcsIGNvbXBvbmVudCk7XG4gIHJldHVybiB7XG4gICAgbG9jYXRpb246IHtuYXRpdmVFbGVtZW50OiBnZXRIb3N0RWxlbWVudChjb21wb25lbnQpfSxcbiAgICBpbmplY3Rvcjogb3B0cy5pbmplY3RvciB8fCBOVUxMX0lOSkVDVE9SLFxuICAgIGluc3RhbmNlOiBjb21wb25lbnQsXG4gICAgaG9zdFZpZXc6IGhvc3RWaWV3UmVmLFxuICAgIGNoYW5nZURldGVjdG9yUmVmOiBob3N0Vmlld1JlZixcbiAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxuICAgIC8vIFRPRE86IGltcGxlbWVudCBkZXN0cm95IGFuZCBvbkRlc3Ryb3lcbiAgICBkZXN0cm95OiAoKSA9PiB7fSxcbiAgICBvbkRlc3Ryb3k6IChjYjogRnVuY3Rpb24pID0+IHt9XG4gIH07XG59XG5cblxuLy8gVE9ETzogQSBoYWNrIHRvIG5vdCBwdWxsIGluIHRoZSBOdWxsSW5qZWN0b3IgZnJvbSBAYW5ndWxhci9jb3JlLlxuZXhwb3J0IGNvbnN0IE5VTExfSU5KRUNUT1I6IEluamVjdG9yID0ge1xuICBnZXQ6ICh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KSA9PiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOdWxsSW5qZWN0b3I6IE5vdCBmb3VuZDogJyArIHN0cmluZ2lmeSh0b2tlbikpO1xuICB9XG59O1xuXG4vKipcbiAqIEJvb3RzdHJhcHMgYSBDb21wb25lbnQgaW50byBhbiBleGlzdGluZyBob3N0IGVsZW1lbnQgYW5kIHJldHVybnMgYW4gaW5zdGFuY2VcbiAqIG9mIHRoZSBjb21wb25lbnQuXG4gKlxuICogVXNlIHRoaXMgZnVuY3Rpb24gdG8gYm9vdHN0cmFwIGEgY29tcG9uZW50IGludG8gdGhlIERPTSB0cmVlLiBFYWNoIGludm9jYXRpb25cbiAqIG9mIHRoaXMgZnVuY3Rpb24gd2lsbCBjcmVhdGUgYSBzZXBhcmF0ZSB0cmVlIG9mIGNvbXBvbmVudHMsIGluamVjdG9ycyBhbmRcbiAqIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGVzIGFuZCBsaWZldGltZXMuIFRvIGR5bmFtaWNhbGx5IGluc2VydCBhIG5ldyBjb21wb25lbnRcbiAqIGludG8gYW4gZXhpc3RpbmcgdHJlZSBzdWNoIHRoYXQgaXQgc2hhcmVzIHRoZSBzYW1lIGluamVjdGlvbiwgY2hhbmdlIGRldGVjdGlvblxuICogYW5kIG9iamVjdCBsaWZldGltZSwgdXNlIHtAbGluayBWaWV3Q29udGFpbmVyI2NyZWF0ZUNvbXBvbmVudH0uXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFR5cGUgQ29tcG9uZW50IHRvIGJvb3RzdHJhcFxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgcGFyYW1ldGVycyB3aGljaCBjb250cm9sIGJvb3RzdHJhcHBpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudDxUPihcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlPFQ+fFxuICAgICAgICBUeXBlPFQ+LyogVHlwZSBhcyB3b3JrYXJvdW5kIGZvcjogTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ4ODEgKi9cbiAgICAsXG4gICAgb3B0czogQ3JlYXRlQ29tcG9uZW50T3B0aW9ucyA9IHt9KTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnRUeXBlKGNvbXBvbmVudFR5cGUpO1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBvcHRzLnJlbmRlcmVyRmFjdG9yeSB8fCBkb21SZW5kZXJlckZhY3RvcnkzO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBvcHRzLnNhbml0aXplciB8fCBudWxsO1xuICBjb25zdCBjb21wb25lbnREZWYgPSAoY29tcG9uZW50VHlwZSBhcyBDb21wb25lbnRUeXBlPFQ+KS5uZ0NvbXBvbmVudERlZiBhcyBDb21wb25lbnREZWY8VD47XG4gIGlmIChjb21wb25lbnREZWYudHlwZSAhPSBjb21wb25lbnRUeXBlKSBjb21wb25lbnREZWYudHlwZSA9IGNvbXBvbmVudFR5cGU7XG4gIGxldCBjb21wb25lbnQ6IFQ7XG4gIC8vIFRoZSBmaXJzdCBpbmRleCBvZiB0aGUgZmlyc3Qgc2VsZWN0b3IgaXMgdGhlIHRhZyBuYW1lLlxuICBjb25zdCBjb21wb25lbnRUYWcgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG4gIGNvbnN0IGhvc3ROb2RlID0gbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCBvcHRzLmhvc3QgfHwgY29tcG9uZW50VGFnKTtcbiAgY29uc3Qgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0ID0ge1xuICAgIC8vIEluY29tcGxldGUgaW5pdGlhbGl6YXRpb24gZHVlIHRvIGNpcmN1bGFyIHJlZmVyZW5jZS5cbiAgICBjb21wb25lbnQ6IG51bGwgISxcbiAgICBzY2hlZHVsZXI6IG9wdHMuc2NoZWR1bGVyIHx8IHJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKHdpbmRvdyksXG4gICAgY2xlYW46IENMRUFOX1BST01JU0UsXG4gIH07XG4gIGNvbnN0IHJvb3RWaWV3OiBMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgLTEsIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihob3N0Tm9kZSwgY29tcG9uZW50RGVmLnJlbmRlcmVyVHlwZSksXG4gICAgICBjcmVhdGVUVmlldyhudWxsLCBudWxsKSwgbnVsbCwgcm9vdENvbnRleHQsXG4gICAgICBjb21wb25lbnREZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpO1xuICByb290Vmlldy5pbmplY3RvciA9IG9wdHMuaW5qZWN0b3IgfHwgbnVsbDtcblxuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KHJvb3RWaWV3LCBudWxsICEpO1xuICBsZXQgZWxlbWVudE5vZGU6IExFbGVtZW50Tm9kZTtcbiAgdHJ5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcblxuICAgIC8vIENyZWF0ZSBlbGVtZW50IG5vZGUgYXQgaW5kZXggMCBpbiBkYXRhIGFycmF5XG4gICAgZWxlbWVudE5vZGUgPSBob3N0RWxlbWVudChjb21wb25lbnRUYWcsIGhvc3ROb2RlLCBjb21wb25lbnREZWYsIHNhbml0aXplcik7XG5cbiAgICAvLyBDcmVhdGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggZmFjdG9yeSgpIGFuZCBzdG9yZSBhdCBpbmRleCAwIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAgICBjb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnQgPVxuICAgICAgICBiYXNlRGlyZWN0aXZlQ3JlYXRlKDAsIGNvbXBvbmVudERlZi5mYWN0b3J5KCksIGNvbXBvbmVudERlZikgYXMgVDtcbiAgICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKGVsZW1lbnROb2RlLm5vZGVJbmplY3RvciwgY29tcG9uZW50LCBlbGVtZW50Tm9kZS5kYXRhICEpO1xuXG4gICAgb3B0cy5ob3N0RmVhdHVyZXMgJiYgb3B0cy5ob3N0RmVhdHVyZXMuZm9yRWFjaCgoZmVhdHVyZSkgPT4gZmVhdHVyZShjb21wb25lbnQsIGNvbXBvbmVudERlZikpO1xuXG4gICAgZXhlY3V0ZUluaXRBbmRDb250ZW50SG9va3MoKTtcbiAgICBzZXRIb3N0QmluZGluZ3MoUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUyk7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGVsZW1lbnROb2RlLmRhdGEgYXMgTFZpZXcsIGVsZW1lbnROb2RlLCBjb21wb25lbnREZWYsIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG4vKipcbiAqIFVzZWQgdG8gZW5hYmxlIGxpZmVjeWNsZSBob29rcyBvbiB0aGUgcm9vdCBjb21wb25lbnQuXG4gKlxuICogSW5jbHVkZSB0aGlzIGZlYXR1cmUgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGlmIHRoZSByb290IGNvbXBvbmVudFxuICogeW91IGFyZSByZW5kZXJpbmcgaGFzIGxpZmVjeWNsZSBob29rcyBkZWZpbmVkLiBPdGhlcndpc2UsIHRoZSBob29rcyB3b24ndFxuICogYmUgY2FsbGVkIHByb3Blcmx5LlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiByZW5kZXJDb21wb25lbnQoQXBwQ29tcG9uZW50LCB7ZmVhdHVyZXM6IFtSb290TGlmZWN5Y2xlSG9va3NdfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIExpZmVjeWNsZUhvb2tzRmVhdHVyZShjb21wb25lbnQ6IGFueSwgZGVmOiBDb21wb25lbnREZWY8YW55Pik6IHZvaWQge1xuICBjb25zdCBlbGVtZW50Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCk7XG5cbiAgLy8gUm9vdCBjb21wb25lbnQgaXMgYWx3YXlzIGNyZWF0ZWQgYXQgZGlyIGluZGV4IDBcbiAgcXVldWVJbml0SG9va3MoMCwgZGVmLm9uSW5pdCwgZGVmLmRvQ2hlY2ssIGVsZW1lbnROb2RlLnZpZXcudFZpZXcpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKGVsZW1lbnROb2RlLnROb2RlICEuZmxhZ3MsIGVsZW1lbnROb2RlLnZpZXcpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IGNvbnRleHQgZm9yIGFueSBjb21wb25lbnQgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld2AgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBhbnkgY29tcG9uZW50XG4gKi9cbmZ1bmN0aW9uIGdldFJvb3RDb250ZXh0KGNvbXBvbmVudDogYW55KTogUm9vdENvbnRleHQge1xuICBjb25zdCByb290Q29udGV4dCA9IGdldFJvb3RWaWV3KGNvbXBvbmVudCkuY29udGV4dCBhcyBSb290Q29udGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwocm9vdENvbnRleHQsICdyb290Q29udGV4dCcpO1xuICByZXR1cm4gcm9vdENvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50LlxuICpcbiAqIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIHJldHJpZXZlIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudC4gVGhlIGhvc3RcbiAqIGVsZW1lbnQgaXMgdGhlIGVsZW1lbnQgd2hpY2ggdGhlIGNvbXBvbmVudCBpcyBhc3NvY2lhdGVkIHdpdGguXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgZm9yIHdoaWNoIHRoZSBob3N0IGVsZW1lbnQgc2hvdWxkIGJlIHJldHJpZXZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEhvc3RFbGVtZW50PFQ+KGNvbXBvbmVudDogVCk6IEhUTUxFbGVtZW50IHtcbiAgcmV0dXJuIF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCkubmF0aXZlIGFzIGFueTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHJlbmRlcmVkIHRleHQgZm9yIGEgZ2l2ZW4gY29tcG9uZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmV0cmlldmVzIHRoZSBob3N0IGVsZW1lbnQgb2YgYSBjb21wb25lbnQgYW5kXG4gKiBhbmQgdGhlbiByZXR1cm5zIHRoZSBgdGV4dENvbnRlbnRgIGZvciB0aGF0IGVsZW1lbnQuIFRoaXMgaW1wbGllc1xuICogdGhhdCB0aGUgdGV4dCByZXR1cm5lZCB3aWxsIGluY2x1ZGUgcmUtcHJvamVjdGVkIGNvbnRlbnQgb2ZcbiAqIHRoZSBjb21wb25lbnQgYXMgd2VsbC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdG8gcmV0dXJuIHRoZSBjb250ZW50IHRleHQgZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZWRUZXh0KGNvbXBvbmVudDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgaG9zdEVsZW1lbnQgPSBnZXRIb3N0RWxlbWVudChjb21wb25lbnQpO1xuICByZXR1cm4gaG9zdEVsZW1lbnQudGV4dENvbnRlbnQgfHwgJyc7XG59XG5cbi8qKlxuICogV2FpdCBvbiBjb21wb25lbnQgdW50aWwgaXQgaXMgcmVuZGVyZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgYFByb21pc2VgIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gdGhlIGNvbXBvbmVudCdzXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uIGlzIGV4ZWN1dGVkLiBUaGlzIGlzIGRldGVybWluZWQgYnkgZmluZGluZyB0aGUgc2NoZWR1bGVyXG4gKiBhc3NvY2lhdGVkIHdpdGggdGhlIGBjb21wb25lbnRgJ3MgcmVuZGVyIHRyZWUgYW5kIHdhaXRpbmcgdW50aWwgdGhlIHNjaGVkdWxlclxuICogZmx1c2hlcy4gSWYgbm90aGluZyBpcyBzY2hlZHVsZWQsIHRoZSBmdW5jdGlvbiByZXR1cm5zIGEgcmVzb2x2ZWQgcHJvbWlzZS5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiBhd2FpdCB3aGVuUmVuZGVyZWQobXlDb21wb25lbnQpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gd2FpdCB1cG9uXG4gKiBAcmV0dXJucyBQcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gdGhlIGNvbXBvbmVudCBpcyByZW5kZXJlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoZW5SZW5kZXJlZChjb21wb25lbnQ6IGFueSk6IFByb21pc2U8bnVsbD4ge1xuICByZXR1cm4gZ2V0Um9vdENvbnRleHQoY29tcG9uZW50KS5jbGVhbjtcbn1cbiJdfQ==