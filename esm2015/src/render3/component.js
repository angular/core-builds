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
import { CLEAN_PROMISE, ROOT_DIRECTIVE_INDICES, _getComponentHostLElementNode, baseDirectiveCreate, createLViewData, createTView, detectChangesInternal, enterView, executeInitAndContentHooks, getRootView, hostElement, initChangeDetectorIfExisting, leaveView, locateHostElement, setHostBindings, } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { INJECTOR, CONTEXT, TVIEW } from './interfaces/view';
import { stringify } from './util';
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
    const componentDef = /** @type {?} */ ((/** @type {?} */ (componentType)).ngComponentDef);
    if (componentDef.type != componentType)
        componentDef.type = componentType;
    /** @type {?} */
    const componentTag = /** @type {?} */ (((/** @type {?} */ ((componentDef.selectors))[0]))[0]);
    /** @type {?} */
    const hostNode = locateHostElement(rendererFactory, opts.host || componentTag);
    /** @type {?} */
    const rootContext = createRootContext(opts.scheduler || requestAnimationFrame.bind(window));
    /** @type {?} */
    const rootView = createLViewData(rendererFactory.createRenderer(hostNode, componentDef), createTView(-1, null, 1, 0, null, null, null), rootContext, componentDef.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */);
    rootView[INJECTOR] = opts.injector || null;
    /** @type {?} */
    const oldView = enterView(rootView, /** @type {?} */ ((null)));
    /** @type {?} */
    let elementNode;
    /** @type {?} */
    let component;
    try {
        if (rendererFactory.begin)
            rendererFactory.begin();
        // Create element node at index 0 in data array
        elementNode = hostElement(componentTag, hostNode, componentDef, sanitizer);
        // Create directive instance with factory() and store at index 0 in directives array
        component = baseDirectiveCreate(0, /** @type {?} */ (componentDef.factory()), componentDef);
        rootContext.components.push(component);
        (/** @type {?} */ (elementNode.data))[CONTEXT] = component;
        initChangeDetectorIfExisting(elementNode.nodeInjector, component, /** @type {?} */ ((elementNode.data)));
        opts.hostFeatures && opts.hostFeatures.forEach((feature) => feature(component, componentDef));
        executeInitAndContentHooks();
        setHostBindings(ROOT_DIRECTIVE_INDICES);
        detectChangesInternal(/** @type {?} */ (elementNode.data), elementNode, component);
    }
    finally {
        leaveView(oldView);
        if (rendererFactory.end)
            rendererFactory.end();
    }
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
    const elementNode = _getComponentHostLElementNode(component);
    /** @type {?} */
    const tView = elementNode.view[TVIEW];
    queueInitHooks(0, def.onInit, def.doCheck, tView);
    queueLifecycleHooks(elementNode.tNode.flags, tView);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFjQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSw2QkFBNkIsRUFBRSxtQkFBbUIsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLFNBQVMsRUFBRSwwQkFBMEIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEdBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUc3VCxPQUFPLEVBQTZCLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEYsT0FBTyxFQUFvRCxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlHLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0RqQyxhQUFhLGFBQWEsR0FBYTtJQUNyQyxHQUFHLEVBQUUsQ0FBQyxLQUFVLEVBQUUsYUFBbUIsRUFBRSxFQUFFO1FBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDakU7Q0FDRixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBZUYsTUFBTSwwQkFDRixhQUNXLGlFQUVYLE9BQStCLEVBQUU7SUFDbkMsU0FBUyxJQUFJLG1CQUFtQixDQUFD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LGdDQUFnQyxTQUFjLEVBQUUsR0FBOEI7O0lBQ2xGLE1BQU0sV0FBVyxHQUFHLDZCQUE2QixDQUFDLFNBQVMsQ0FBQyxDQUFDOztJQUc3RCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xELG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0NBQ3JEOzs7Ozs7OztBQVFELHdCQUF3QixTQUFjOztJQUNwQyxNQUFNLFdBQVcscUJBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBZ0IsRUFBQztJQUNuRSxTQUFTLElBQUksYUFBYSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN2RCxPQUFPLFdBQVcsQ0FBQztDQUNwQjs7Ozs7Ozs7Ozs7QUFVRCxNQUFNLHlCQUE0QixTQUFZO0lBQzVDLHlCQUFPLDZCQUE2QixDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQWEsRUFBQztDQUMvRDs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSwwQkFBMEIsU0FBYzs7SUFDNUMsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzlDLE9BQU8sV0FBVyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUM7Q0FDdEM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JELE1BQU0sdUJBQXVCLFNBQWM7SUFDekMsT0FBTyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDO0NBQ3hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lIGZyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGUsIGFzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7cXVldWVJbml0SG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtDTEVBTl9QUk9NSVNFLCBST09UX0RJUkVDVElWRV9JTkRJQ0VTLCBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZSwgYmFzZURpcmVjdGl2ZUNyZWF0ZSwgY3JlYXRlTFZpZXdEYXRhLCBjcmVhdGVUVmlldywgZGV0ZWN0Q2hhbmdlc0ludGVybmFsLCBlbnRlclZpZXcsIGV4ZWN1dGVJbml0QW5kQ29udGVudEhvb2tzLCBnZXRSb290VmlldywgaG9zdEVsZW1lbnQsIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcsIGxlYXZlVmlldywgbG9jYXRlSG9zdEVsZW1lbnQsIHNldEhvc3RCaW5kaW5ncyx9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnREZWZJbnRlcm5hbCwgQ29tcG9uZW50VHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMRWxlbWVudE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyRmFjdG9yeTMsIGRvbVJlbmRlcmVyRmFjdG9yeTN9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0xWaWV3RGF0YSwgTFZpZXdGbGFncywgUm9vdENvbnRleHQsIEJJTkRJTkdfSU5ERVgsIElOSkVDVE9SLCBDT05URVhULCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqIE9wdGlvbnMgdGhhdCBjb250cm9sIGhvdyB0aGUgY29tcG9uZW50IHNob3VsZCBiZSBib290c3RyYXBwZWQuICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZUNvbXBvbmVudE9wdGlvbnMge1xuICAvKiogV2hpY2ggcmVuZGVyZXIgZmFjdG9yeSB0byB1c2UuICovXG4gIHJlbmRlcmVyRmFjdG9yeT86IFJlbmRlcmVyRmFjdG9yeTM7XG5cbiAgLyoqIEEgY3VzdG9tIHNhbml0aXplciBpbnN0YW5jZSAqL1xuICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXI7XG5cbiAgLyoqXG4gICAqIEhvc3QgZWxlbWVudCBvbiB3aGljaCB0aGUgY29tcG9uZW50IHdpbGwgYmUgYm9vdHN0cmFwcGVkLiBJZiBub3Qgc3BlY2lmaWVkLFxuICAgKiB0aGUgY29tcG9uZW50IGRlZmluaXRpb24ncyBgdGFnYCBpcyB1c2VkIHRvIHF1ZXJ5IHRoZSBleGlzdGluZyBET00gZm9yIHRoZVxuICAgKiBlbGVtZW50IHRvIGJvb3RzdHJhcC5cbiAgICovXG4gIGhvc3Q/OiBSRWxlbWVudHxzdHJpbmc7XG5cbiAgLyoqIE1vZHVsZSBpbmplY3RvciBmb3IgdGhlIGNvbXBvbmVudC4gSWYgdW5zcGVjaWZpZWQsIHRoZSBpbmplY3RvciB3aWxsIGJlIE5VTExfSU5KRUNUT1IuICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgZmVhdHVyZXMgdG8gYmUgYXBwbGllZCB0byB0aGUgY3JlYXRlZCBjb21wb25lbnQuIEZlYXR1cmVzIGFyZSBzaW1wbHlcbiAgICogZnVuY3Rpb25zIHRoYXQgZGVjb3JhdGUgYSBjb21wb25lbnQgd2l0aCBhIGNlcnRhaW4gYmVoYXZpb3IuXG4gICAqXG4gICAqIFR5cGljYWxseSwgdGhlIGZlYXR1cmVzIGluIHRoaXMgbGlzdCBhcmUgZmVhdHVyZXMgdGhhdCBjYW5ub3QgYmUgYWRkZWQgdG8gdGhlXG4gICAqIG90aGVyIGZlYXR1cmVzIGxpc3QgaW4gdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uIGJlY2F1c2UgdGhleSByZWx5IG9uIG90aGVyIGZhY3RvcnMuXG4gICAqXG4gICAqIEV4YW1wbGU6IGBSb290TGlmZWN5Y2xlSG9va3NgIGlzIGEgZnVuY3Rpb24gdGhhdCBhZGRzIGxpZmVjeWNsZSBob29rIGNhcGFiaWxpdGllc1xuICAgKiB0byByb290IGNvbXBvbmVudHMgaW4gYSB0cmVlLXNoYWthYmxlIHdheS4gSXQgY2Fubm90IGJlIGFkZGVkIHRvIHRoZSBjb21wb25lbnRcbiAgICogZmVhdHVyZXMgbGlzdCBiZWNhdXNlIHRoZXJlJ3Mgbm8gd2F5IG9mIGtub3dpbmcgd2hlbiB0aGUgY29tcG9uZW50IHdpbGwgYmUgdXNlZCBhc1xuICAgKiBhIHJvb3QgY29tcG9uZW50LlxuICAgKi9cbiAgaG9zdEZlYXR1cmVzPzogKDxUPihjb21wb25lbnQ6IFQsIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQsIHN0cmluZz4pID0+IHZvaWQpW107XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggaXMgdXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvcmsgaW4gdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogV2hlbiBtYXJraW5nIGNvbXBvbmVudHMgYXMgZGlydHksIGl0IGlzIG5lY2Vzc2FyeSB0byBzY2hlZHVsZSB0aGUgd29yayBvZlxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFRoaXMgaXMgZG9uZSB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICAgKiB7QGxpbmsgbWFya0RpcnR5fSBjYWxscyBpbnRvIGEgc2luZ2xlIGNoYW5nZWQgZGV0ZWN0aW9uIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzY2hlZHVsZXIgaXMgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBJdCBpcyBhbHNvIHVzZWZ1bCB0byBvdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICAgKi9cbiAgc2NoZWR1bGVyPzogKHdvcms6ICgpID0+IHZvaWQpID0+IHZvaWQ7XG59XG5cbi8vIFRPRE86IEEgaGFjayB0byBub3QgcHVsbCBpbiB0aGUgTnVsbEluamVjdG9yIGZyb20gQGFuZ3VsYXIvY29yZS5cbmV4cG9ydCBjb25zdCBOVUxMX0lOSkVDVE9SOiBJbmplY3RvciA9IHtcbiAgZ2V0OiAodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSkgPT4ge1xuICAgIHRocm93IG5ldyBFcnJvcignTnVsbEluamVjdG9yOiBOb3QgZm91bmQ6ICcgKyBzdHJpbmdpZnkodG9rZW4pKTtcbiAgfVxufTtcblxuLyoqXG4gKiBCb290c3RyYXBzIGEgQ29tcG9uZW50IGludG8gYW4gZXhpc3RpbmcgaG9zdCBlbGVtZW50IGFuZCByZXR1cm5zIGFuIGluc3RhbmNlXG4gKiBvZiB0aGUgY29tcG9uZW50LlxuICpcbiAqIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGJvb3RzdHJhcCBhIGNvbXBvbmVudCBpbnRvIHRoZSBET00gdHJlZS4gRWFjaCBpbnZvY2F0aW9uXG4gKiBvZiB0aGlzIGZ1bmN0aW9uIHdpbGwgY3JlYXRlIGEgc2VwYXJhdGUgdHJlZSBvZiBjb21wb25lbnRzLCBpbmplY3RvcnMgYW5kXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlcyBhbmQgbGlmZXRpbWVzLiBUbyBkeW5hbWljYWxseSBpbnNlcnQgYSBuZXcgY29tcG9uZW50XG4gKiBpbnRvIGFuIGV4aXN0aW5nIHRyZWUgc3VjaCB0aGF0IGl0IHNoYXJlcyB0aGUgc2FtZSBpbmplY3Rpb24sIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGFuZCBvYmplY3QgbGlmZXRpbWUsIHVzZSB7QGxpbmsgVmlld0NvbnRhaW5lciNjcmVhdGVDb21wb25lbnR9LlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRUeXBlIENvbXBvbmVudCB0byBib290c3RyYXBcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIHBhcmFtZXRlcnMgd2hpY2ggY29udHJvbCBib290c3RyYXBwaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnQ8VD4oXG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZTxUPnxcbiAgICAgICAgVHlwZTxUPi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovXG4gICAgLFxuICAgIG9wdHM6IENyZWF0ZUNvbXBvbmVudE9wdGlvbnMgPSB7fSk6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnRUeXBlKTtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gb3B0cy5yZW5kZXJlckZhY3RvcnkgfHwgZG9tUmVuZGVyZXJGYWN0b3J5MztcbiAgY29uc3Qgc2FuaXRpemVyID0gb3B0cy5zYW5pdGl6ZXIgfHwgbnVsbDtcbiAgY29uc3QgY29tcG9uZW50RGVmID1cbiAgICAgIChjb21wb25lbnRUeXBlIGFzIENvbXBvbmVudFR5cGU8VD4pLm5nQ29tcG9uZW50RGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPFQ+O1xuICBpZiAoY29tcG9uZW50RGVmLnR5cGUgIT0gY29tcG9uZW50VHlwZSkgY29tcG9uZW50RGVmLnR5cGUgPSBjb21wb25lbnRUeXBlO1xuXG4gIC8vIFRoZSBmaXJzdCBpbmRleCBvZiB0aGUgZmlyc3Qgc2VsZWN0b3IgaXMgdGhlIHRhZyBuYW1lLlxuICBjb25zdCBjb21wb25lbnRUYWcgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG4gIGNvbnN0IGhvc3ROb2RlID0gbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCBvcHRzLmhvc3QgfHwgY29tcG9uZW50VGFnKTtcbiAgY29uc3Qgcm9vdENvbnRleHQgPSBjcmVhdGVSb290Q29udGV4dChvcHRzLnNjaGVkdWxlciB8fCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpKTtcblxuICBjb25zdCByb290VmlldzogTFZpZXdEYXRhID0gY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3ROb2RlLCBjb21wb25lbnREZWYpLFxuICAgICAgY3JlYXRlVFZpZXcoLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwpLCByb290Q29udGV4dCxcbiAgICAgIGNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG4gIHJvb3RWaWV3W0lOSkVDVE9SXSA9IG9wdHMuaW5qZWN0b3IgfHwgbnVsbDtcblxuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KHJvb3RWaWV3LCBudWxsICEpO1xuICBsZXQgZWxlbWVudE5vZGU6IExFbGVtZW50Tm9kZTtcbiAgbGV0IGNvbXBvbmVudDogVDtcbiAgdHJ5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcblxuICAgIC8vIENyZWF0ZSBlbGVtZW50IG5vZGUgYXQgaW5kZXggMCBpbiBkYXRhIGFycmF5XG4gICAgZWxlbWVudE5vZGUgPSBob3N0RWxlbWVudChjb21wb25lbnRUYWcsIGhvc3ROb2RlLCBjb21wb25lbnREZWYsIHNhbml0aXplcik7XG5cbiAgICAvLyBDcmVhdGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggZmFjdG9yeSgpIGFuZCBzdG9yZSBhdCBpbmRleCAwIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAgICBjb21wb25lbnQgPSBiYXNlRGlyZWN0aXZlQ3JlYXRlKDAsIGNvbXBvbmVudERlZi5mYWN0b3J5KCkgYXMgVCwgY29tcG9uZW50RGVmKTtcbiAgICByb290Q29udGV4dC5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAoZWxlbWVudE5vZGUuZGF0YSBhcyBMVmlld0RhdGEpW0NPTlRFWFRdID0gY29tcG9uZW50O1xuICAgIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcoZWxlbWVudE5vZGUubm9kZUluamVjdG9yLCBjb21wb25lbnQsIGVsZW1lbnROb2RlLmRhdGEgISk7XG5cbiAgICBvcHRzLmhvc3RGZWF0dXJlcyAmJiBvcHRzLmhvc3RGZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlKSA9PiBmZWF0dXJlKGNvbXBvbmVudCwgY29tcG9uZW50RGVmKSk7XG5cbiAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuICAgIHNldEhvc3RCaW5kaW5ncyhST09UX0RJUkVDVElWRV9JTkRJQ0VTKTtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoZWxlbWVudE5vZGUuZGF0YSBhcyBMVmlld0RhdGEsIGVsZW1lbnROb2RlLCBjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG5cbiAgcmV0dXJuIGNvbXBvbmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb250ZXh0KHNjaGVkdWxlcjogKHdvcmtGbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk6IFJvb3RDb250ZXh0IHtcbiAgcmV0dXJuIHtcbiAgICBjb21wb25lbnRzOiBbXSxcbiAgICBzY2hlZHVsZXI6IHNjaGVkdWxlcixcbiAgICBjbGVhbjogQ0xFQU5fUFJPTUlTRSxcbiAgfTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGVuYWJsZSBsaWZlY3ljbGUgaG9va3Mgb24gdGhlIHJvb3QgY29tcG9uZW50LlxuICpcbiAqIEluY2x1ZGUgdGhpcyBmZWF0dXJlIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBpZiB0aGUgcm9vdCBjb21wb25lbnRcbiAqIHlvdSBhcmUgcmVuZGVyaW5nIGhhcyBsaWZlY3ljbGUgaG9va3MgZGVmaW5lZC4gT3RoZXJ3aXNlLCB0aGUgaG9va3Mgd29uJ3RcbiAqIGJlIGNhbGxlZCBwcm9wZXJseS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogcmVuZGVyQ29tcG9uZW50KEFwcENvbXBvbmVudCwge2ZlYXR1cmVzOiBbUm9vdExpZmVjeWNsZUhvb2tzXX0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBMaWZlY3ljbGVIb29rc0ZlYXR1cmUoY29tcG9uZW50OiBhbnksIGRlZjogQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBjb25zdCBlbGVtZW50Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCk7XG5cbiAgLy8gUm9vdCBjb21wb25lbnQgaXMgYWx3YXlzIGNyZWF0ZWQgYXQgZGlyIGluZGV4IDBcbiAgY29uc3QgdFZpZXcgPSBlbGVtZW50Tm9kZS52aWV3W1RWSUVXXTtcbiAgcXVldWVJbml0SG9va3MoMCwgZGVmLm9uSW5pdCwgZGVmLmRvQ2hlY2ssIHRWaWV3KTtcbiAgcXVldWVMaWZlY3ljbGVIb29rcyhlbGVtZW50Tm9kZS50Tm9kZS5mbGFncywgdFZpZXcpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IGNvbnRleHQgZm9yIGFueSBjb21wb25lbnQgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld2AgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBhbnkgY29tcG9uZW50XG4gKi9cbmZ1bmN0aW9uIGdldFJvb3RDb250ZXh0KGNvbXBvbmVudDogYW55KTogUm9vdENvbnRleHQge1xuICBjb25zdCByb290Q29udGV4dCA9IGdldFJvb3RWaWV3KGNvbXBvbmVudClbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHJvb3RDb250ZXh0LCAncm9vdENvbnRleHQnKTtcbiAgcmV0dXJuIHJvb3RDb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBVc2UgdGhpcyBmdW5jdGlvbiB0byByZXRyaWV2ZSB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQuIFRoZSBob3N0XG4gKiBlbGVtZW50IGlzIHRoZSBlbGVtZW50IHdoaWNoIHRoZSBjb21wb25lbnQgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IGZvciB3aGljaCB0aGUgaG9zdCBlbGVtZW50IHNob3VsZCBiZSByZXRyaWV2ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0RWxlbWVudDxUPihjb21wb25lbnQ6IFQpOiBIVE1MRWxlbWVudCB7XG4gIHJldHVybiBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpLm5hdGl2ZSBhcyBhbnk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSByZW5kZXJlZCB0ZXh0IGZvciBhIGdpdmVuIGNvbXBvbmVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHJpZXZlcyB0aGUgaG9zdCBlbGVtZW50IG9mIGEgY29tcG9uZW50IGFuZFxuICogYW5kIHRoZW4gcmV0dXJucyB0aGUgYHRleHRDb250ZW50YCBmb3IgdGhhdCBlbGVtZW50LiBUaGlzIGltcGxpZXNcbiAqIHRoYXQgdGhlIHRleHQgcmV0dXJuZWQgd2lsbCBpbmNsdWRlIHJlLXByb2plY3RlZCBjb250ZW50IG9mXG4gKiB0aGUgY29tcG9uZW50IGFzIHdlbGwuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHRvIHJldHVybiB0aGUgY29udGVudCB0ZXh0IGZvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlcmVkVGV4dChjb21wb25lbnQ6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IGhvc3RFbGVtZW50ID0gZ2V0SG9zdEVsZW1lbnQoY29tcG9uZW50KTtcbiAgcmV0dXJuIGhvc3RFbGVtZW50LnRleHRDb250ZW50IHx8ICcnO1xufVxuXG4vKipcbiAqIFdhaXQgb24gY29tcG9uZW50IHVudGlsIGl0IGlzIHJlbmRlcmVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBhIGBQcm9taXNlYCB3aGljaCBpcyByZXNvbHZlZCB3aGVuIHRoZSBjb21wb25lbnQnc1xuICogY2hhbmdlIGRldGVjdGlvbiBpcyBleGVjdXRlZC4gVGhpcyBpcyBkZXRlcm1pbmVkIGJ5IGZpbmRpbmcgdGhlIHNjaGVkdWxlclxuICogYXNzb2NpYXRlZCB3aXRoIHRoZSBgY29tcG9uZW50YCdzIHJlbmRlciB0cmVlIGFuZCB3YWl0aW5nIHVudGlsIHRoZSBzY2hlZHVsZXJcbiAqIGZsdXNoZXMuIElmIG5vdGhpbmcgaXMgc2NoZWR1bGVkLCB0aGUgZnVuY3Rpb24gcmV0dXJucyBhIHJlc29sdmVkIHByb21pc2UuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogYXdhaXQgd2hlblJlbmRlcmVkKG15Q29tcG9uZW50KTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IHRvIHdhaXQgdXBvblxuICogQHJldHVybnMgUHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIHRoZSBjb21wb25lbnQgaXMgcmVuZGVyZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aGVuUmVuZGVyZWQoY29tcG9uZW50OiBhbnkpOiBQcm9taXNlPG51bGw+IHtcbiAgcmV0dXJuIGdldFJvb3RDb250ZXh0KGNvbXBvbmVudCkuY2xlYW47XG59XG4iXX0=