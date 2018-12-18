/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertComponentType, assertDefined } from './assert';
import { getComponentDef } from './definition';
import { diPublicInInjector, getOrCreateNodeInjectorForNode } from './di';
import { publishDefaultGlobalUtils } from './global_utils';
import { queueInitHooks, queueLifecycleHooks } from './hooks';
import { CLEAN_PROMISE, createLView, createNodeAtIndex, createTView, getOrCreateTView, initNodeFlags, instantiateRootComponent, locateHostElement, queueComponentIndexForCheck, refreshDescendantViews } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { CONTEXT, HEADER_OFFSET, HOST, HOST_NODE, TVIEW } from './interfaces/view';
import { enterView, getPreviousOrParentTNode, leaveView, resetComponentState, setCurrentDirectiveDef } from './state';
import { defaultScheduler, getRootView, readPatchedLView, stringify } from './util';
/**
 * Options that control how the component should be bootstrapped.
 * @record
 */
export function CreateComponentOptions() { }
if (false) {
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
     * A custom animation player handler
     * @type {?|undefined}
     */
    CreateComponentOptions.prototype.playerHandler;
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
// TODO: A hack to not pull in the NullInjector from @angular/core.
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
    ngDevMode && publishDefaultGlobalUtils();
    ngDevMode && assertComponentType(componentType);
    /** @type {?} */
    const rendererFactory = opts.rendererFactory || domRendererFactory3;
    /** @type {?} */
    const sanitizer = opts.sanitizer || null;
    /** @type {?} */
    const componentDef = (/** @type {?} */ (getComponentDef(componentType)));
    if (componentDef.type != componentType)
        componentDef.type = componentType;
    // The first index of the first selector is the tag name.
    /** @type {?} */
    const componentTag = (/** @type {?} */ ((/** @type {?} */ ((/** @type {?} */ (componentDef.selectors))[0]))[0]));
    /** @type {?} */
    const hostRNode = locateHostElement(rendererFactory, opts.host || componentTag);
    /** @type {?} */
    const rootFlags = componentDef.onPush ? 4 /* Dirty */ | 64 /* IsRoot */ :
        2 /* CheckAlways */ | 64 /* IsRoot */;
    /** @type {?} */
    const rootContext = createRootContext(opts.scheduler, opts.playerHandler);
    /** @type {?} */
    const renderer = rendererFactory.createRenderer(hostRNode, componentDef);
    /** @type {?} */
    const rootView = createLView(null, createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags, rendererFactory, renderer, undefined, opts.injector || null);
    /** @type {?} */
    const oldView = enterView(rootView, null);
    /** @type {?} */
    let component;
    try {
        if (rendererFactory.begin)
            rendererFactory.begin();
        /** @type {?} */
        const componentView = createRootComponentView(hostRNode, componentDef, rootView, rendererFactory, renderer, sanitizer);
        component = createRootComponent(componentView, componentDef, rootView, rootContext, opts.hostFeatures || null);
        refreshDescendantViews(rootView, null);
    }
    finally {
        leaveView(oldView);
        if (rendererFactory.end)
            rendererFactory.end();
    }
    return component;
}
/**
 * Creates the root component view and the root component node.
 *
 * @param {?} rNode Render host element.
 * @param {?} def ComponentDef
 * @param {?} rootView The parent view where the host node is stored
 * @param {?} rendererFactory
 * @param {?} renderer The current renderer
 * @param {?=} sanitizer The sanitizer, if provided
 *
 * @return {?} Component view created
 */
export function createRootComponentView(rNode, def, rootView, rendererFactory, renderer, sanitizer) {
    resetComponentState();
    /** @type {?} */
    const tView = rootView[TVIEW];
    /** @type {?} */
    const componentView = createLView(rootView, getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, rendererFactory, renderer, sanitizer);
    /** @type {?} */
    const tNode = createNodeAtIndex(0, 3 /* Element */, rNode, null, null);
    if (tView.firstTemplatePass) {
        diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, rootView), rootView, def.type);
        tNode.flags = 1 /* isComponent */;
        initNodeFlags(tNode, rootView.length, 1);
        queueComponentIndexForCheck(tNode);
    }
    // Store component view at node index, with node as the HOST
    componentView[HOST] = rootView[HEADER_OFFSET];
    componentView[HOST_NODE] = (/** @type {?} */ (tNode));
    return rootView[HEADER_OFFSET] = componentView;
}
/**
 * Creates a root component and sets it up with features and host bindings. Shared by
 * renderComponent() and ViewContainerRef.createComponent().
 * @template T
 * @param {?} componentView
 * @param {?} componentDef
 * @param {?} rootView
 * @param {?} rootContext
 * @param {?} hostFeatures
 * @return {?}
 */
export function createRootComponent(componentView, componentDef, rootView, rootContext, hostFeatures) {
    /** @type {?} */
    const tView = rootView[TVIEW];
    // Create directive instance with factory() and store at next index in viewData
    /** @type {?} */
    const component = instantiateRootComponent(tView, rootView, componentDef);
    rootContext.components.push(component);
    componentView[CONTEXT] = component;
    hostFeatures && hostFeatures.forEach((feature) => feature(component, componentDef));
    if (tView.firstTemplatePass && componentDef.hostBindings) {
        /** @type {?} */
        const rootTNode = getPreviousOrParentTNode();
        setCurrentDirectiveDef(componentDef);
        componentDef.hostBindings(1 /* Create */, component, rootTNode.index - HEADER_OFFSET);
        setCurrentDirectiveDef(null);
    }
    return component;
}
/**
 * @param {?=} scheduler
 * @param {?=} playerHandler
 * @return {?}
 */
export function createRootContext(scheduler, playerHandler) {
    return {
        components: [],
        scheduler: scheduler || defaultScheduler,
        clean: CLEAN_PROMISE,
        playerHandler: playerHandler || null,
        flags: 0 /* Empty */
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
    const rootTView = (/** @type {?} */ (readPatchedLView(component)))[TVIEW];
    /** @type {?} */
    const dirIndex = rootTView.data.length - 1;
    queueInitHooks(dirIndex, def.onInit, def.doCheck, rootTView);
    // TODO(misko): replace `as TNode` with createTNode call. (needs refactoring to lose dep on
    // LNode).
    queueLifecycleHooks(rootTView, (/** @type {?} */ ({ directiveStart: dirIndex, directiveEnd: dirIndex + 1 })));
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
    const rootContext = (/** @type {?} */ (getRootView(component)[CONTEXT]));
    ngDevMode && assertDefined(rootContext, 'rootContext');
    return rootContext;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFjQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQWUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSx3QkFBd0IsRUFBRSxpQkFBaUIsRUFBRSwyQkFBMkIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSTFPLE9BQU8sRUFBd0MsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRyxPQUFPLEVBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFvRCxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuSSxPQUFPLEVBQUMsU0FBUyxFQUFFLHdCQUF3QixFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNwSCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7QUFLbEYsNENBOENDOzs7Ozs7SUE1Q0MsaURBQW1DOzs7OztJQUduQywyQ0FBc0I7Ozs7O0lBR3RCLCtDQUE4Qjs7Ozs7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QUMsTUFBTSxHQUFHLENBQUM7SUFFMUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0QsMkZBQTJGO0lBQzNGLFVBQVU7SUFDVixtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsbUJBQUEsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEdBQUcsQ0FBQyxFQUFFLEVBQVMsQ0FBQyxDQUFDO0FBQ3BHLENBQUM7Ozs7Ozs7O0FBUUQsU0FBUyxjQUFjLENBQUMsU0FBYzs7VUFDOUIsV0FBVyxHQUFHLG1CQUFBLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBZTtJQUNsRSxTQUFTLElBQUksYUFBYSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN2RCxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztBQW1CRCxNQUFNLFVBQVUsWUFBWSxDQUFDLFNBQWM7SUFDekMsT0FBTyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmUgZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5cbmltcG9ydCB7YXNzZXJ0Q29tcG9uZW50VHlwZSwgYXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuL2RpJztcbmltcG9ydCB7cHVibGlzaERlZmF1bHRHbG9iYWxVdGlsc30gZnJvbSAnLi9nbG9iYWxfdXRpbHMnO1xuaW1wb3J0IHtxdWV1ZUluaXRIb29rcywgcXVldWVMaWZlY3ljbGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0NMRUFOX1BST01JU0UsIGNyZWF0ZUxWaWV3LCBjcmVhdGVOb2RlQXRJbmRleCwgY3JlYXRlVE5vZGUsIGNyZWF0ZVRWaWV3LCBnZXRPckNyZWF0ZVRWaWV3LCBpbml0Tm9kZUZsYWdzLCBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQsIGxvY2F0ZUhvc3RFbGVtZW50LCBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2ssIHJlZnJlc2hEZXNjZW5kYW50Vmlld3N9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUeXBlLCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheWVySGFuZGxlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGRvbVJlbmRlcmVyRmFjdG9yeTN9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEhPU1RfTk9ERSwgTFZpZXcsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgbGVhdmVWaWV3LCByZXNldENvbXBvbmVudFN0YXRlLCBzZXRDdXJyZW50RGlyZWN0aXZlRGVmfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7ZGVmYXVsdFNjaGVkdWxlciwgZ2V0Um9vdFZpZXcsIHJlYWRQYXRjaGVkTFZpZXcsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKiBPcHRpb25zIHRoYXQgY29udHJvbCBob3cgdGhlIGNvbXBvbmVudCBzaG91bGQgYmUgYm9vdHN0cmFwcGVkLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVDb21wb25lbnRPcHRpb25zIHtcbiAgLyoqIFdoaWNoIHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlLiAqL1xuICByZW5kZXJlckZhY3Rvcnk/OiBSZW5kZXJlckZhY3RvcnkzO1xuXG4gIC8qKiBBIGN1c3RvbSBzYW5pdGl6ZXIgaW5zdGFuY2UgKi9cbiAgc2FuaXRpemVyPzogU2FuaXRpemVyO1xuXG4gIC8qKiBBIGN1c3RvbSBhbmltYXRpb24gcGxheWVyIGhhbmRsZXIgKi9cbiAgcGxheWVySGFuZGxlcj86IFBsYXllckhhbmRsZXI7XG5cbiAgLyoqXG4gICAqIEhvc3QgZWxlbWVudCBvbiB3aGljaCB0aGUgY29tcG9uZW50IHdpbGwgYmUgYm9vdHN0cmFwcGVkLiBJZiBub3Qgc3BlY2lmaWVkLFxuICAgKiB0aGUgY29tcG9uZW50IGRlZmluaXRpb24ncyBgdGFnYCBpcyB1c2VkIHRvIHF1ZXJ5IHRoZSBleGlzdGluZyBET00gZm9yIHRoZVxuICAgKiBlbGVtZW50IHRvIGJvb3RzdHJhcC5cbiAgICovXG4gIGhvc3Q/OiBSRWxlbWVudHxzdHJpbmc7XG5cbiAgLyoqIE1vZHVsZSBpbmplY3RvciBmb3IgdGhlIGNvbXBvbmVudC4gSWYgdW5zcGVjaWZpZWQsIHRoZSBpbmplY3RvciB3aWxsIGJlIE5VTExfSU5KRUNUT1IuICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgZmVhdHVyZXMgdG8gYmUgYXBwbGllZCB0byB0aGUgY3JlYXRlZCBjb21wb25lbnQuIEZlYXR1cmVzIGFyZSBzaW1wbHlcbiAgICogZnVuY3Rpb25zIHRoYXQgZGVjb3JhdGUgYSBjb21wb25lbnQgd2l0aCBhIGNlcnRhaW4gYmVoYXZpb3IuXG4gICAqXG4gICAqIFR5cGljYWxseSwgdGhlIGZlYXR1cmVzIGluIHRoaXMgbGlzdCBhcmUgZmVhdHVyZXMgdGhhdCBjYW5ub3QgYmUgYWRkZWQgdG8gdGhlXG4gICAqIG90aGVyIGZlYXR1cmVzIGxpc3QgaW4gdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uIGJlY2F1c2UgdGhleSByZWx5IG9uIG90aGVyIGZhY3RvcnMuXG4gICAqXG4gICAqIEV4YW1wbGU6IGBSb290TGlmZWN5Y2xlSG9va3NgIGlzIGEgZnVuY3Rpb24gdGhhdCBhZGRzIGxpZmVjeWNsZSBob29rIGNhcGFiaWxpdGllc1xuICAgKiB0byByb290IGNvbXBvbmVudHMgaW4gYSB0cmVlLXNoYWthYmxlIHdheS4gSXQgY2Fubm90IGJlIGFkZGVkIHRvIHRoZSBjb21wb25lbnRcbiAgICogZmVhdHVyZXMgbGlzdCBiZWNhdXNlIHRoZXJlJ3Mgbm8gd2F5IG9mIGtub3dpbmcgd2hlbiB0aGUgY29tcG9uZW50IHdpbGwgYmUgdXNlZCBhc1xuICAgKiBhIHJvb3QgY29tcG9uZW50LlxuICAgKi9cbiAgaG9zdEZlYXR1cmVzPzogSG9zdEZlYXR1cmVbXTtcblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aGljaCBpcyB1c2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gd29yayBpbiB0aGUgZnV0dXJlLlxuICAgKlxuICAgKiBXaGVuIG1hcmtpbmcgY29tcG9uZW50cyBhcyBkaXJ0eSwgaXQgaXMgbmVjZXNzYXJ5IHRvIHNjaGVkdWxlIHRoZSB3b3JrIG9mXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGZ1dHVyZS4gVGhpcyBpcyBkb25lIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gICAqIHtAbGluayBtYXJrRGlydHl9IGNhbGxzIGludG8gYSBzaW5nbGUgY2hhbmdlZCBkZXRlY3Rpb24gcHJvY2Vzc2luZy5cbiAgICpcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgb2YgdGhlIHNjaGVkdWxlciBpcyB0aGUgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgZnVuY3Rpb24uXG4gICAqXG4gICAqIEl0IGlzIGFsc28gdXNlZnVsIHRvIG92ZXJyaWRlIHRoaXMgZnVuY3Rpb24gZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gICAqL1xuICBzY2hlZHVsZXI/OiAod29yazogKCkgPT4gdm9pZCkgPT4gdm9pZDtcbn1cblxuLyoqIFNlZSBDcmVhdGVDb21wb25lbnRPcHRpb25zLmhvc3RGZWF0dXJlcyAqL1xudHlwZSBIb3N0RmVhdHVyZSA9ICg8VD4oY29tcG9uZW50OiBULCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPikgPT4gdm9pZCk7XG5cbi8vIFRPRE86IEEgaGFjayB0byBub3QgcHVsbCBpbiB0aGUgTnVsbEluamVjdG9yIGZyb20gQGFuZ3VsYXIvY29yZS5cbmV4cG9ydCBjb25zdCBOVUxMX0lOSkVDVE9SOiBJbmplY3RvciA9IHtcbiAgZ2V0OiAodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSkgPT4ge1xuICAgIHRocm93IG5ldyBFcnJvcignTnVsbEluamVjdG9yOiBOb3QgZm91bmQ6ICcgKyBzdHJpbmdpZnkodG9rZW4pKTtcbiAgfVxufTtcblxuLyoqXG4gKiBCb290c3RyYXBzIGEgQ29tcG9uZW50IGludG8gYW4gZXhpc3RpbmcgaG9zdCBlbGVtZW50IGFuZCByZXR1cm5zIGFuIGluc3RhbmNlXG4gKiBvZiB0aGUgY29tcG9uZW50LlxuICpcbiAqIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGJvb3RzdHJhcCBhIGNvbXBvbmVudCBpbnRvIHRoZSBET00gdHJlZS4gRWFjaCBpbnZvY2F0aW9uXG4gKiBvZiB0aGlzIGZ1bmN0aW9uIHdpbGwgY3JlYXRlIGEgc2VwYXJhdGUgdHJlZSBvZiBjb21wb25lbnRzLCBpbmplY3RvcnMgYW5kXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlcyBhbmQgbGlmZXRpbWVzLiBUbyBkeW5hbWljYWxseSBpbnNlcnQgYSBuZXcgY29tcG9uZW50XG4gKiBpbnRvIGFuIGV4aXN0aW5nIHRyZWUgc3VjaCB0aGF0IGl0IHNoYXJlcyB0aGUgc2FtZSBpbmplY3Rpb24sIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGFuZCBvYmplY3QgbGlmZXRpbWUsIHVzZSB7QGxpbmsgVmlld0NvbnRhaW5lciNjcmVhdGVDb21wb25lbnR9LlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRUeXBlIENvbXBvbmVudCB0byBib290c3RyYXBcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIHBhcmFtZXRlcnMgd2hpY2ggY29udHJvbCBib290c3RyYXBwaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnQ8VD4oXG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZTxUPnxcbiAgICAgICAgVHlwZTxUPi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovXG4gICAgLFxuICAgIG9wdHM6IENyZWF0ZUNvbXBvbmVudE9wdGlvbnMgPSB7fSk6IFQge1xuICBuZ0Rldk1vZGUgJiYgcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnRUeXBlKTtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gb3B0cy5yZW5kZXJlckZhY3RvcnkgfHwgZG9tUmVuZGVyZXJGYWN0b3J5MztcbiAgY29uc3Qgc2FuaXRpemVyID0gb3B0cy5zYW5pdGl6ZXIgfHwgbnVsbDtcbiAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmPFQ+KGNvbXBvbmVudFR5cGUpICE7XG4gIGlmIChjb21wb25lbnREZWYudHlwZSAhPSBjb21wb25lbnRUeXBlKSBjb21wb25lbnREZWYudHlwZSA9IGNvbXBvbmVudFR5cGU7XG5cbiAgLy8gVGhlIGZpcnN0IGluZGV4IG9mIHRoZSBmaXJzdCBzZWxlY3RvciBpcyB0aGUgdGFnIG5hbWUuXG4gIGNvbnN0IGNvbXBvbmVudFRhZyA9IGNvbXBvbmVudERlZi5zZWxlY3RvcnMgIVswXSAhWzBdIGFzIHN0cmluZztcbiAgY29uc3QgaG9zdFJOb2RlID0gbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCBvcHRzLmhvc3QgfHwgY29tcG9uZW50VGFnKTtcbiAgY29uc3Qgcm9vdEZsYWdzID0gY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLklzUm9vdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gY3JlYXRlUm9vdENvbnRleHQob3B0cy5zY2hlZHVsZXIsIG9wdHMucGxheWVySGFuZGxlcik7XG5cbiAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCBjb21wb25lbnREZWYpO1xuICBjb25zdCByb290VmlldzogTFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgIG51bGwsIGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsKSwgcm9vdENvbnRleHQsIHJvb3RGbGFncywgcmVuZGVyZXJGYWN0b3J5LFxuICAgICAgcmVuZGVyZXIsIHVuZGVmaW5lZCwgb3B0cy5pbmplY3RvciB8fCBudWxsKTtcblxuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KHJvb3RWaWV3LCBudWxsKTtcbiAgbGV0IGNvbXBvbmVudDogVDtcbiAgdHJ5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgIGhvc3RSTm9kZSwgY29tcG9uZW50RGVmLCByb290VmlldywgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlciwgc2FuaXRpemVyKTtcbiAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICBjb21wb25lbnRWaWV3LCBjb21wb25lbnREZWYsIHJvb3RWaWV3LCByb290Q29udGV4dCwgb3B0cy5ob3N0RmVhdHVyZXMgfHwgbnVsbCk7XG5cbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHJvb3RWaWV3LCBudWxsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcm9vdCBjb21wb25lbnQgdmlldyBhbmQgdGhlIHJvb3QgY29tcG9uZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSBwYXJlbnQgdmlldyB3aGVyZSB0aGUgaG9zdCBub2RlIGlzIHN0b3JlZFxuICogQHBhcmFtIHJlbmRlcmVyIFRoZSBjdXJyZW50IHJlbmRlcmVyXG4gKiBAcGFyYW0gc2FuaXRpemVyIFRoZSBzYW5pdGl6ZXIsIGlmIHByb3ZpZGVkXG4gKlxuICogQHJldHVybnMgQ29tcG9uZW50IHZpZXcgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgck5vZGU6IFJFbGVtZW50IHwgbnVsbCwgZGVmOiBDb21wb25lbnREZWY8YW55Piwgcm9vdFZpZXc6IExWaWV3LFxuICAgIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgcmVuZGVyZXI6IFJlbmRlcmVyMywgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3IHtcbiAgcmVzZXRDb21wb25lbnRTdGF0ZSgpO1xuICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgcm9vdFZpZXcsXG4gICAgICBnZXRPckNyZWF0ZVRWaWV3KFxuICAgICAgICAgIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnkpLFxuICAgICAgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyLFxuICAgICAgc2FuaXRpemVyKTtcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleCgwLCBUTm9kZVR5cGUuRWxlbWVudCwgck5vZGUsIG51bGwsIG51bGwpO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIHJvb3RWaWV3KSwgcm9vdFZpZXcsIGRlZi50eXBlKTtcbiAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgaW5pdE5vZGVGbGFncyh0Tm9kZSwgcm9vdFZpZXcubGVuZ3RoLCAxKTtcbiAgICBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2sodE5vZGUpO1xuICB9XG5cbiAgLy8gU3RvcmUgY29tcG9uZW50IHZpZXcgYXQgbm9kZSBpbmRleCwgd2l0aCBub2RlIGFzIHRoZSBIT1NUXG4gIGNvbXBvbmVudFZpZXdbSE9TVF0gPSByb290Vmlld1tIRUFERVJfT0ZGU0VUXTtcbiAgY29tcG9uZW50Vmlld1tIT1NUX05PREVdID0gdE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuICByZXR1cm4gcm9vdFZpZXdbSEVBREVSX09GRlNFVF0gPSBjb21wb25lbnRWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSByb290IGNvbXBvbmVudCBhbmQgc2V0cyBpdCB1cCB3aXRoIGZlYXR1cmVzIGFuZCBob3N0IGJpbmRpbmdzLiBTaGFyZWQgYnlcbiAqIHJlbmRlckNvbXBvbmVudCgpIGFuZCBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudCgpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudDxUPihcbiAgICBjb21wb25lbnRWaWV3OiBMVmlldywgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4sIHJvb3RWaWV3OiBMVmlldywgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LFxuICAgIGhvc3RGZWF0dXJlczogSG9zdEZlYXR1cmVbXSB8IG51bGwpOiBhbnkge1xuICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgLy8gQ3JlYXRlIGRpcmVjdGl2ZSBpbnN0YW5jZSB3aXRoIGZhY3RvcnkoKSBhbmQgc3RvcmUgYXQgbmV4dCBpbmRleCBpbiB2aWV3RGF0YVxuICBjb25zdCBjb21wb25lbnQgPSBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQodFZpZXcsIHJvb3RWaWV3LCBjb21wb25lbnREZWYpO1xuXG4gIHJvb3RDb250ZXh0LmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gY29tcG9uZW50O1xuXG4gIGhvc3RGZWF0dXJlcyAmJiBob3N0RmVhdHVyZXMuZm9yRWFjaCgoZmVhdHVyZSkgPT4gZmVhdHVyZShjb21wb25lbnQsIGNvbXBvbmVudERlZikpO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiBjb21wb25lbnREZWYuaG9zdEJpbmRpbmdzKSB7XG4gICAgY29uc3Qgcm9vdFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gICAgc2V0Q3VycmVudERpcmVjdGl2ZURlZihjb21wb25lbnREZWYpO1xuICAgIGNvbXBvbmVudERlZi5ob3N0QmluZGluZ3MoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb21wb25lbnQsIHJvb3RUTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVEZWYobnVsbCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29udGV4dChcbiAgICBzY2hlZHVsZXI/OiAod29ya0ZuOiAoKSA9PiB2b2lkKSA9PiB2b2lkLCBwbGF5ZXJIYW5kbGVyPzogUGxheWVySGFuZGxlcnxudWxsKTogUm9vdENvbnRleHQge1xuICByZXR1cm4ge1xuICAgIGNvbXBvbmVudHM6IFtdLFxuICAgIHNjaGVkdWxlcjogc2NoZWR1bGVyIHx8IGRlZmF1bHRTY2hlZHVsZXIsXG4gICAgY2xlYW46IENMRUFOX1BST01JU0UsXG4gICAgcGxheWVySGFuZGxlcjogcGxheWVySGFuZGxlciB8fCBudWxsLFxuICAgIGZsYWdzOiBSb290Q29udGV4dEZsYWdzLkVtcHR5XG4gIH07XG59XG5cbi8qKlxuICogVXNlZCB0byBlbmFibGUgbGlmZWN5Y2xlIGhvb2tzIG9uIHRoZSByb290IGNvbXBvbmVudC5cbiAqXG4gKiBJbmNsdWRlIHRoaXMgZmVhdHVyZSB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgaWYgdGhlIHJvb3QgY29tcG9uZW50XG4gKiB5b3UgYXJlIHJlbmRlcmluZyBoYXMgbGlmZWN5Y2xlIGhvb2tzIGRlZmluZWQuIE90aGVyd2lzZSwgdGhlIGhvb2tzIHdvbid0XG4gKiBiZSBjYWxsZWQgcHJvcGVybHkuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIHJlbmRlckNvbXBvbmVudChBcHBDb21wb25lbnQsIHtmZWF0dXJlczogW1Jvb3RMaWZlY3ljbGVIb29rc119KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKGNvbXBvbmVudDogYW55LCBkZWY6IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGNvbnN0IHJvb3RUVmlldyA9IHJlYWRQYXRjaGVkTFZpZXcoY29tcG9uZW50KSAhW1RWSUVXXTtcbiAgY29uc3QgZGlySW5kZXggPSByb290VFZpZXcuZGF0YS5sZW5ndGggLSAxO1xuXG4gIHF1ZXVlSW5pdEhvb2tzKGRpckluZGV4LCBkZWYub25Jbml0LCBkZWYuZG9DaGVjaywgcm9vdFRWaWV3KTtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlcGxhY2UgYGFzIFROb2RlYCB3aXRoIGNyZWF0ZVROb2RlIGNhbGwuIChuZWVkcyByZWZhY3RvcmluZyB0byBsb3NlIGRlcCBvblxuICAvLyBMTm9kZSkuXG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3Mocm9vdFRWaWV3LCB7IGRpcmVjdGl2ZVN0YXJ0OiBkaXJJbmRleCwgZGlyZWN0aXZlRW5kOiBkaXJJbmRleCArIDEgfSBhcyBUTm9kZSk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgY29udGV4dCBmb3IgYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQoY29tcG9uZW50OiBhbnkpOiBSb290Q29udGV4dCB7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KVtDT05URVhUXSBhcyBSb290Q29udGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocm9vdENvbnRleHQsICdyb290Q29udGV4dCcpO1xuICByZXR1cm4gcm9vdENvbnRleHQ7XG59XG5cblxuLyoqXG4gKiBXYWl0IG9uIGNvbXBvbmVudCB1bnRpbCBpdCBpcyByZW5kZXJlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgYSBgUHJvbWlzZWAgd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiB0aGUgY29tcG9uZW50J3NcbiAqIGNoYW5nZSBkZXRlY3Rpb24gaXMgZXhlY3V0ZWQuIFRoaXMgaXMgZGV0ZXJtaW5lZCBieSBmaW5kaW5nIHRoZSBzY2hlZHVsZXJcbiAqIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGNvbXBvbmVudGAncyByZW5kZXIgdHJlZSBhbmQgd2FpdGluZyB1bnRpbCB0aGUgc2NoZWR1bGVyXG4gKiBmbHVzaGVzLiBJZiBub3RoaW5nIGlzIHNjaGVkdWxlZCwgdGhlIGZ1bmN0aW9uIHJldHVybnMgYSByZXNvbHZlZCBwcm9taXNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIGF3YWl0IHdoZW5SZW5kZXJlZChteUNvbXBvbmVudCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byB3YWl0IHVwb25cbiAqIEByZXR1cm5zIFByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiB0aGUgY29tcG9uZW50IGlzIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2hlblJlbmRlcmVkKGNvbXBvbmVudDogYW55KTogUHJvbWlzZTxudWxsPiB7XG4gIHJldHVybiBnZXRSb290Q29udGV4dChjb21wb25lbnQpLmNsZWFuO1xufVxuIl19