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
import { getComponentViewByInstance } from './context_discovery';
import { getComponentDef } from './definition';
import { diPublicInInjector, getOrCreateNodeInjectorForNode } from './di';
import { queueInitHooks, queueLifecycleHooks } from './hooks';
import { CLEAN_PROMISE, createLViewData, createNodeAtIndex, createTView, detectChangesInternal, executeInitAndContentHooks, getOrCreateTView, initNodeFlags, instantiateRootComponent, locateHostElement, prefillHostVars, setHostBindings } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { CONTEXT, HEADER_OFFSET, HOST, HOST_NODE, INJECTOR, TVIEW } from './interfaces/view';
import { publishDefaultGlobalUtils } from './publish_global_util';
import { enterView, leaveView, resetComponentState } from './state';
import { getRootView, readElementValue, readPatchedLViewData, stringify } from './util';
/** @type {?} */
const ROOT_EXPANDO_INSTRUCTIONS = [0, 1];
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
    ngDevMode && publishDefaultGlobalUtils();
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
    const hostRNode = locateHostElement(rendererFactory, opts.host || componentTag);
    /** @type {?} */
    const rootFlags = componentDef.onPush ? 4 /* Dirty */ | 64 /* IsRoot */ :
        2 /* CheckAlways */ | 64 /* IsRoot */;
    /** @type {?} */
    const rootContext = createRootContext(opts.scheduler || requestAnimationFrame.bind(window), opts.playerHandler || null);
    /** @type {?} */
    const renderer = rendererFactory.createRenderer(hostRNode, componentDef);
    /** @type {?} */
    const rootView = createLViewData(renderer, createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags);
    rootView[INJECTOR] = opts.injector || null;
    /** @type {?} */
    const oldView = enterView(rootView, null);
    /** @type {?} */
    let component;
    try {
        if (rendererFactory.begin)
            rendererFactory.begin();
        /** @type {?} */
        const componentView = createRootComponentView(hostRNode, componentDef, rootView, renderer, sanitizer);
        component = createRootComponent(hostRNode, componentView, componentDef, rootView, rootContext, opts.hostFeatures || null);
        executeInitAndContentHooks(rootView);
        detectChangesInternal(componentView, component);
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
 * @param {?} renderer The current renderer
 * @param {?=} sanitizer The sanitizer, if provided
 *
 * @return {?} Component view created
 */
export function createRootComponentView(rNode, def, rootView, renderer, sanitizer) {
    resetComponentState();
    /** @type {?} */
    const tView = rootView[TVIEW];
    /** @type {?} */
    const componentView = createLViewData(renderer, getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer);
    /** @type {?} */
    const tNode = createNodeAtIndex(0, 3 /* Element */, rNode, null, null);
    if (tView.firstTemplatePass) {
        tView.expandoInstructions = ROOT_EXPANDO_INSTRUCTIONS.slice();
        diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, rootView), rootView, def.type);
        tNode.flags = 4096 /* isComponent */;
        initNodeFlags(tNode, rootView.length, 1);
    }
    // Store component view at node index, with node as the HOST
    componentView[HOST] = rootView[HEADER_OFFSET];
    componentView[HOST_NODE] = /** @type {?} */ (tNode);
    return rootView[HEADER_OFFSET] = componentView;
}
/**
 * Creates a root component and sets it up with features and host bindings. Shared by
 * renderComponent() and ViewContainerRef.createComponent().
 * @template T
 * @param {?} hostRNode
 * @param {?} componentView
 * @param {?} componentDef
 * @param {?} rootView
 * @param {?} rootContext
 * @param {?} hostFeatures
 * @return {?}
 */
export function createRootComponent(hostRNode, componentView, componentDef, rootView, rootContext, hostFeatures) {
    /** @type {?} */
    const tView = rootView[TVIEW];
    /** @type {?} */
    const component = instantiateRootComponent(tView, rootView, componentDef);
    rootContext.components.push(component);
    componentView[CONTEXT] = component;
    hostFeatures && hostFeatures.forEach((feature) => feature(component, componentDef));
    if (tView.firstTemplatePass)
        prefillHostVars(tView, rootView, componentDef.hostVars);
    setHostBindings(tView, rootView);
    return component;
}
/**
 * @param {?} scheduler
 * @param {?=} playerHandler
 * @return {?}
 */
export function createRootContext(scheduler, playerHandler) {
    return {
        components: [],
        scheduler: scheduler,
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
    const rootTView = /** @type {?} */ ((readPatchedLViewData(component)))[TVIEW];
    /** @type {?} */
    const dirIndex = rootTView.data.length - 1;
    queueInitHooks(dirIndex, def.onInit, def.doCheck, rootTView);
    queueLifecycleHooks(dirIndex << 16 /* DirectiveStartingIndexShift */ | 1, rootTView);
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
    return /** @type {?} */ (readElementValue(getComponentViewByInstance(component)));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFjQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9ELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLDBCQUEwQixFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSx3QkFBd0IsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJalEsT0FBTyxFQUErQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3hHLE9BQU8sRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUF3RCxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqSixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsRSxPQUFPLEVBQUMsV0FBVyxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7QUFJdEYs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UyxDQUFDLEdBQUcsS0FBSyxFQUFFOztJQUMzRCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFM0MsY0FBYyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0QsbUJBQW1CLENBQUMsUUFBUSx3Q0FBMEMsR0FBRyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FDeEY7Ozs7Ozs7O0FBUUQsU0FBUyxjQUFjLENBQUMsU0FBYzs7SUFDcEMsTUFBTSxXQUFXLHFCQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQWdCLEVBQUM7SUFDbkUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDdkQsT0FBTyxXQUFXLENBQUM7Q0FDcEI7Ozs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLGNBQWMsQ0FBSSxTQUFZO0lBQzVDLHlCQUFPLGdCQUFnQixDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFnQixFQUFDO0NBQy9FOzs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLFVBQVUsZUFBZSxDQUFDLFNBQWM7O0lBQzVDLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5QyxPQUFPLFdBQVcsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDO0NBQ3RDOzs7Ozs7Ozs7Ozs7Ozs7OztBQWtCRCxNQUFNLFVBQVUsWUFBWSxDQUFDLFNBQWM7SUFDekMsT0FBTyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDO0NBQ3hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lIGZyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGUsIGFzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2V9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuL2RpJztcbmltcG9ydCB7cXVldWVJbml0SG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtDTEVBTl9QUk9NSVNFLCBjcmVhdGVMVmlld0RhdGEsIGNyZWF0ZU5vZGVBdEluZGV4LCBjcmVhdGVUVmlldywgZGV0ZWN0Q2hhbmdlc0ludGVybmFsLCBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcywgZ2V0T3JDcmVhdGVUVmlldywgaW5pdE5vZGVGbGFncywgaW5zdGFudGlhdGVSb290Q29tcG9uZW50LCBsb2NhdGVIb3N0RWxlbWVudCwgcHJlZmlsbEhvc3RWYXJzLCBzZXRIb3N0QmluZGluZ3N9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXllckhhbmRsZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGUsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgZG9tUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgSE9TVCwgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7cHVibGlzaERlZmF1bHRHbG9iYWxVdGlsc30gZnJvbSAnLi9wdWJsaXNoX2dsb2JhbF91dGlsJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBsZWF2ZVZpZXcsIHJlc2V0Q29tcG9uZW50U3RhdGV9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtnZXRSb290VmlldywgcmVhZEVsZW1lbnRWYWx1ZSwgcmVhZFBhdGNoZWRMVmlld0RhdGEsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuXG4vLyBSb290IGNvbXBvbmVudCB3aWxsIGFsd2F5cyBoYXZlIGFuIGVsZW1lbnQgaW5kZXggb2YgMCBhbmQgYW4gaW5qZWN0b3Igc2l6ZSBvZiAxXG5jb25zdCBST09UX0VYUEFORE9fSU5TVFJVQ1RJT05TID0gWzAsIDFdO1xuXG4vKiogT3B0aW9ucyB0aGF0IGNvbnRyb2wgaG93IHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIGJvb3RzdHJhcHBlZC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucyB7XG4gIC8qKiBXaGljaCByZW5kZXJlciBmYWN0b3J5IHRvIHVzZS4gKi9cbiAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MztcblxuICAvKiogQSBjdXN0b20gc2FuaXRpemVyIGluc3RhbmNlICovXG4gIHNhbml0aXplcj86IFNhbml0aXplcjtcblxuICAvKiogQSBjdXN0b20gYW5pbWF0aW9uIHBsYXllciBoYW5kbGVyICovXG4gIHBsYXllckhhbmRsZXI/OiBQbGF5ZXJIYW5kbGVyO1xuXG4gIC8qKlxuICAgKiBIb3N0IGVsZW1lbnQgb24gd2hpY2ggdGhlIGNvbXBvbmVudCB3aWxsIGJlIGJvb3RzdHJhcHBlZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uJ3MgYHRhZ2AgaXMgdXNlZCB0byBxdWVyeSB0aGUgZXhpc3RpbmcgRE9NIGZvciB0aGVcbiAgICogZWxlbWVudCB0byBib290c3RyYXAuXG4gICAqL1xuICBob3N0PzogUkVsZW1lbnR8c3RyaW5nO1xuXG4gIC8qKiBNb2R1bGUgaW5qZWN0b3IgZm9yIHRoZSBjb21wb25lbnQuIElmIHVuc3BlY2lmaWVkLCB0aGUgaW5qZWN0b3Igd2lsbCBiZSBOVUxMX0lOSkVDVE9SLiAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGZlYXR1cmVzIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGNyZWF0ZWQgY29tcG9uZW50LiBGZWF0dXJlcyBhcmUgc2ltcGx5XG4gICAqIGZ1bmN0aW9ucyB0aGF0IGRlY29yYXRlIGEgY29tcG9uZW50IHdpdGggYSBjZXJ0YWluIGJlaGF2aW9yLlxuICAgKlxuICAgKiBUeXBpY2FsbHksIHRoZSBmZWF0dXJlcyBpbiB0aGlzIGxpc3QgYXJlIGZlYXR1cmVzIHRoYXQgY2Fubm90IGJlIGFkZGVkIHRvIHRoZVxuICAgKiBvdGhlciBmZWF0dXJlcyBsaXN0IGluIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBiZWNhdXNlIHRoZXkgcmVseSBvbiBvdGhlciBmYWN0b3JzLlxuICAgKlxuICAgKiBFeGFtcGxlOiBgUm9vdExpZmVjeWNsZUhvb2tzYCBpcyBhIGZ1bmN0aW9uIHRoYXQgYWRkcyBsaWZlY3ljbGUgaG9vayBjYXBhYmlsaXRpZXNcbiAgICogdG8gcm9vdCBjb21wb25lbnRzIGluIGEgdHJlZS1zaGFrYWJsZSB3YXkuIEl0IGNhbm5vdCBiZSBhZGRlZCB0byB0aGUgY29tcG9uZW50XG4gICAqIGZlYXR1cmVzIGxpc3QgYmVjYXVzZSB0aGVyZSdzIG5vIHdheSBvZiBrbm93aW5nIHdoZW4gdGhlIGNvbXBvbmVudCB3aWxsIGJlIHVzZWQgYXNcbiAgICogYSByb290IGNvbXBvbmVudC5cbiAgICovXG4gIGhvc3RGZWF0dXJlcz86IEhvc3RGZWF0dXJlW107XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggaXMgdXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvcmsgaW4gdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogV2hlbiBtYXJraW5nIGNvbXBvbmVudHMgYXMgZGlydHksIGl0IGlzIG5lY2Vzc2FyeSB0byBzY2hlZHVsZSB0aGUgd29yayBvZlxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFRoaXMgaXMgZG9uZSB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICAgKiB7QGxpbmsgbWFya0RpcnR5fSBjYWxscyBpbnRvIGEgc2luZ2xlIGNoYW5nZWQgZGV0ZWN0aW9uIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzY2hlZHVsZXIgaXMgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBJdCBpcyBhbHNvIHVzZWZ1bCB0byBvdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICAgKi9cbiAgc2NoZWR1bGVyPzogKHdvcms6ICgpID0+IHZvaWQpID0+IHZvaWQ7XG59XG5cbi8qKiBTZWUgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucy5ob3N0RmVhdHVyZXMgKi9cbnR5cGUgSG9zdEZlYXR1cmUgPSAoPFQ+KGNvbXBvbmVudDogVCwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pID0+IHZvaWQpO1xuXG4vLyBUT0RPOiBBIGhhY2sgdG8gbm90IHB1bGwgaW4gdGhlIE51bGxJbmplY3RvciBmcm9tIEBhbmd1bGFyL2NvcmUuXG5leHBvcnQgY29uc3QgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3IgPSB7XG4gIGdldDogKHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGxJbmplY3RvcjogTm90IGZvdW5kOiAnICsgc3RyaW5naWZ5KHRva2VuKSk7XG4gIH1cbn07XG5cbi8qKlxuICogQm9vdHN0cmFwcyBhIENvbXBvbmVudCBpbnRvIGFuIGV4aXN0aW5nIGhvc3QgZWxlbWVudCBhbmQgcmV0dXJucyBhbiBpbnN0YW5jZVxuICogb2YgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBVc2UgdGhpcyBmdW5jdGlvbiB0byBib290c3RyYXAgYSBjb21wb25lbnQgaW50byB0aGUgRE9NIHRyZWUuIEVhY2ggaW52b2NhdGlvblxuICogb2YgdGhpcyBmdW5jdGlvbiB3aWxsIGNyZWF0ZSBhIHNlcGFyYXRlIHRyZWUgb2YgY29tcG9uZW50cywgaW5qZWN0b3JzIGFuZFxuICogY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMgYW5kIGxpZmV0aW1lcy4gVG8gZHluYW1pY2FsbHkgaW5zZXJ0IGEgbmV3IGNvbXBvbmVudFxuICogaW50byBhbiBleGlzdGluZyB0cmVlIHN1Y2ggdGhhdCBpdCBzaGFyZXMgdGhlIHNhbWUgaW5qZWN0aW9uLCBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBhbmQgb2JqZWN0IGxpZmV0aW1lLCB1c2Uge0BsaW5rIFZpZXdDb250YWluZXIjY3JlYXRlQ29tcG9uZW50fS5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VHlwZSBDb21wb25lbnQgdG8gYm9vdHN0cmFwXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBwYXJhbWV0ZXJzIHdoaWNoIGNvbnRyb2wgYm9vdHN0cmFwcGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGU8VD58XG4gICAgICAgIFR5cGU8VD4vKiBUeXBlIGFzIHdvcmthcm91bmQgZm9yOiBNaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNDg4MSAqL1xuICAgICxcbiAgICBvcHRzOiBDcmVhdGVDb21wb25lbnRPcHRpb25zID0ge30pOiBUIHtcbiAgbmdEZXZNb2RlICYmIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50VHlwZSk7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IG9wdHMucmVuZGVyZXJGYWN0b3J5IHx8IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gIGNvbnN0IHNhbml0aXplciA9IG9wdHMuc2FuaXRpemVyIHx8IG51bGw7XG4gIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZjxUPihjb21wb25lbnRUeXBlKSAhO1xuICBpZiAoY29tcG9uZW50RGVmLnR5cGUgIT0gY29tcG9uZW50VHlwZSkgY29tcG9uZW50RGVmLnR5cGUgPSBjb21wb25lbnRUeXBlO1xuXG4gIC8vIFRoZSBmaXJzdCBpbmRleCBvZiB0aGUgZmlyc3Qgc2VsZWN0b3IgaXMgdGhlIHRhZyBuYW1lLlxuICBjb25zdCBjb21wb25lbnRUYWcgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG4gIGNvbnN0IGhvc3RSTm9kZSA9IGxvY2F0ZUhvc3RFbGVtZW50KHJlbmRlcmVyRmFjdG9yeSwgb3B0cy5ob3N0IHx8IGNvbXBvbmVudFRhZyk7XG4gIGNvbnN0IHJvb3RGbGFncyA9IGNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290O1xuICBjb25zdCByb290Q29udGV4dCA9IGNyZWF0ZVJvb3RDb250ZXh0KFxuICAgICAgb3B0cy5zY2hlZHVsZXIgfHwgcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KSwgb3B0cy5wbGF5ZXJIYW5kbGVyIHx8IG51bGwpO1xuXG4gIGNvbnN0IHJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3RSTm9kZSwgY29tcG9uZW50RGVmKTtcbiAgY29uc3Qgcm9vdFZpZXc6IExWaWV3RGF0YSA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgIHJlbmRlcmVyLCBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCksIHJvb3RDb250ZXh0LCByb290RmxhZ3MpO1xuICByb290Vmlld1tJTkpFQ1RPUl0gPSBvcHRzLmluamVjdG9yIHx8IG51bGw7XG5cbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhyb290VmlldywgbnVsbCk7XG4gIGxldCBjb21wb25lbnQ6IFQ7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9XG4gICAgICAgIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KGhvc3RSTm9kZSwgY29tcG9uZW50RGVmLCByb290VmlldywgcmVuZGVyZXIsIHNhbml0aXplcik7XG4gICAgY29tcG9uZW50ID0gY3JlYXRlUm9vdENvbXBvbmVudChcbiAgICAgICAgaG9zdFJOb2RlLCBjb21wb25lbnRWaWV3LCBjb21wb25lbnREZWYsIHJvb3RWaWV3LCByb290Q29udGV4dCwgb3B0cy5ob3N0RmVhdHVyZXMgfHwgbnVsbCk7XG5cbiAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcyhyb290Vmlldyk7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGNvbXBvbmVudFZpZXcsIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIHJvb3QgY29tcG9uZW50IHZpZXcgYW5kIHRoZSByb290IGNvbXBvbmVudCBub2RlLlxuICpcbiAqIEBwYXJhbSByTm9kZSBSZW5kZXIgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcGFyZW50IHZpZXcgd2hlcmUgdGhlIGhvc3Qgbm9kZSBpcyBzdG9yZWRcbiAqIEBwYXJhbSByZW5kZXJlciBUaGUgY3VycmVudCByZW5kZXJlclxuICogQHBhcmFtIHNhbml0aXplciBUaGUgc2FuaXRpemVyLCBpZiBwcm92aWRlZFxuICpcbiAqIEByZXR1cm5zIENvbXBvbmVudCB2aWV3IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgIHJOb2RlOiBSRWxlbWVudCB8IG51bGwsIGRlZjogQ29tcG9uZW50RGVmPGFueT4sIHJvb3RWaWV3OiBMVmlld0RhdGEsIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgY29uc3QgdFZpZXcgPSByb290Vmlld1tUVklFV107XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVMVmlld0RhdGEoXG4gICAgICByZW5kZXJlcixcbiAgICAgIGdldE9yQ3JlYXRlVFZpZXcoXG4gICAgICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSksXG4gICAgICBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHNhbml0aXplcik7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoMCwgVE5vZGVUeXBlLkVsZW1lbnQsIHJOb2RlLCBudWxsLCBudWxsKTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zID0gUk9PVF9FWFBBTkRPX0lOU1RSVUNUSU9OUy5zbGljZSgpO1xuICAgIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIHJvb3RWaWV3KSwgcm9vdFZpZXcsIGRlZi50eXBlKTtcbiAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgaW5pdE5vZGVGbGFncyh0Tm9kZSwgcm9vdFZpZXcubGVuZ3RoLCAxKTtcbiAgfVxuXG4gIC8vIFN0b3JlIGNvbXBvbmVudCB2aWV3IGF0IG5vZGUgaW5kZXgsIHdpdGggbm9kZSBhcyB0aGUgSE9TVFxuICBjb21wb25lbnRWaWV3W0hPU1RdID0gcm9vdFZpZXdbSEVBREVSX09GRlNFVF07XG4gIGNvbXBvbmVudFZpZXdbSE9TVF9OT0RFXSA9IHROb2RlIGFzIFRFbGVtZW50Tm9kZTtcbiAgcmV0dXJuIHJvb3RWaWV3W0hFQURFUl9PRkZTRVRdID0gY29tcG9uZW50Vmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgcm9vdCBjb21wb25lbnQgYW5kIHNldHMgaXQgdXAgd2l0aCBmZWF0dXJlcyBhbmQgaG9zdCBiaW5kaW5ncy4gU2hhcmVkIGJ5XG4gKiByZW5kZXJDb21wb25lbnQoKSBhbmQgVmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnQoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gICAgaG9zdFJOb2RlOiBSTm9kZSB8IG51bGwsIGNvbXBvbmVudFZpZXc6IExWaWV3RGF0YSwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4sXG4gICAgcm9vdFZpZXc6IExWaWV3RGF0YSwgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBob3N0RmVhdHVyZXM6IEhvc3RGZWF0dXJlW10gfCBudWxsKTogYW55IHtcbiAgY29uc3QgdFZpZXcgPSByb290Vmlld1tUVklFV107XG4gIC8vIENyZWF0ZSBkaXJlY3RpdmUgaW5zdGFuY2Ugd2l0aCBmYWN0b3J5KCkgYW5kIHN0b3JlIGF0IG5leHQgaW5kZXggaW4gdmlld0RhdGFcbiAgY29uc3QgY29tcG9uZW50ID0gaW5zdGFudGlhdGVSb290Q29tcG9uZW50KHRWaWV3LCByb290VmlldywgY29tcG9uZW50RGVmKTtcblxuICByb290Q29udGV4dC5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IGNvbXBvbmVudDtcblxuICBob3N0RmVhdHVyZXMgJiYgaG9zdEZlYXR1cmVzLmZvckVhY2goKGZlYXR1cmUpID0+IGZlYXR1cmUoY29tcG9uZW50LCBjb21wb25lbnREZWYpKTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHByZWZpbGxIb3N0VmFycyh0Vmlldywgcm9vdFZpZXcsIGNvbXBvbmVudERlZi5ob3N0VmFycyk7XG4gIHNldEhvc3RCaW5kaW5ncyh0Vmlldywgcm9vdFZpZXcpO1xuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29udGV4dChcbiAgICBzY2hlZHVsZXI6ICh3b3JrRm46ICgpID0+IHZvaWQpID0+IHZvaWQsIHBsYXllckhhbmRsZXI/OiBQbGF5ZXJIYW5kbGVyfG51bGwpOiBSb290Q29udGV4dCB7XG4gIHJldHVybiB7XG4gICAgY29tcG9uZW50czogW10sXG4gICAgc2NoZWR1bGVyOiBzY2hlZHVsZXIsXG4gICAgY2xlYW46IENMRUFOX1BST01JU0UsXG4gICAgcGxheWVySGFuZGxlcjogcGxheWVySGFuZGxlciB8fCBudWxsLFxuICAgIGZsYWdzOiBSb290Q29udGV4dEZsYWdzLkVtcHR5XG4gIH07XG59XG5cbi8qKlxuICogVXNlZCB0byBlbmFibGUgbGlmZWN5Y2xlIGhvb2tzIG9uIHRoZSByb290IGNvbXBvbmVudC5cbiAqXG4gKiBJbmNsdWRlIHRoaXMgZmVhdHVyZSB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgaWYgdGhlIHJvb3QgY29tcG9uZW50XG4gKiB5b3UgYXJlIHJlbmRlcmluZyBoYXMgbGlmZWN5Y2xlIGhvb2tzIGRlZmluZWQuIE90aGVyd2lzZSwgdGhlIGhvb2tzIHdvbid0XG4gKiBiZSBjYWxsZWQgcHJvcGVybHkuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIHJlbmRlckNvbXBvbmVudChBcHBDb21wb25lbnQsIHtmZWF0dXJlczogW1Jvb3RMaWZlY3ljbGVIb29rc119KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKGNvbXBvbmVudDogYW55LCBkZWY6IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGNvbnN0IHJvb3RUVmlldyA9IHJlYWRQYXRjaGVkTFZpZXdEYXRhKGNvbXBvbmVudCkgIVtUVklFV107XG4gIGNvbnN0IGRpckluZGV4ID0gcm9vdFRWaWV3LmRhdGEubGVuZ3RoIC0gMTtcblxuICBxdWV1ZUluaXRIb29rcyhkaXJJbmRleCwgZGVmLm9uSW5pdCwgZGVmLmRvQ2hlY2ssIHJvb3RUVmlldyk7XG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3MoZGlySW5kZXggPDwgVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQgfCAxLCByb290VFZpZXcpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IGNvbnRleHQgZm9yIGFueSBjb21wb25lbnQgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld2AgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBhbnkgY29tcG9uZW50XG4gKi9cbmZ1bmN0aW9uIGdldFJvb3RDb250ZXh0KGNvbXBvbmVudDogYW55KTogUm9vdENvbnRleHQge1xuICBjb25zdCByb290Q29udGV4dCA9IGdldFJvb3RWaWV3KGNvbXBvbmVudClbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHJvb3RDb250ZXh0LCAncm9vdENvbnRleHQnKTtcbiAgcmV0dXJuIHJvb3RDb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBVc2UgdGhpcyBmdW5jdGlvbiB0byByZXRyaWV2ZSB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQuIFRoZSBob3N0XG4gKiBlbGVtZW50IGlzIHRoZSBlbGVtZW50IHdoaWNoIHRoZSBjb21wb25lbnQgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IGZvciB3aGljaCB0aGUgaG9zdCBlbGVtZW50IHNob3VsZCBiZSByZXRyaWV2ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0RWxlbWVudDxUPihjb21wb25lbnQ6IFQpOiBIVE1MRWxlbWVudCB7XG4gIHJldHVybiByZWFkRWxlbWVudFZhbHVlKGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlKGNvbXBvbmVudCkpIGFzIEhUTUxFbGVtZW50O1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgcmVuZGVyZWQgdGV4dCBmb3IgYSBnaXZlbiBjb21wb25lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXRyaWV2ZXMgdGhlIGhvc3QgZWxlbWVudCBvZiBhIGNvbXBvbmVudCBhbmRcbiAqIGFuZCB0aGVuIHJldHVybnMgdGhlIGB0ZXh0Q29udGVudGAgZm9yIHRoYXQgZWxlbWVudC4gVGhpcyBpbXBsaWVzXG4gKiB0aGF0IHRoZSB0ZXh0IHJldHVybmVkIHdpbGwgaW5jbHVkZSByZS1wcm9qZWN0ZWQgY29udGVudCBvZlxuICogdGhlIGNvbXBvbmVudCBhcyB3ZWxsLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB0byByZXR1cm4gdGhlIGNvbnRlbnQgdGV4dCBmb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlZFRleHQoY29tcG9uZW50OiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBob3N0RWxlbWVudCA9IGdldEhvc3RFbGVtZW50KGNvbXBvbmVudCk7XG4gIHJldHVybiBob3N0RWxlbWVudC50ZXh0Q29udGVudCB8fCAnJztcbn1cblxuLyoqXG4gKiBXYWl0IG9uIGNvbXBvbmVudCB1bnRpbCBpdCBpcyByZW5kZXJlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgYSBgUHJvbWlzZWAgd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiB0aGUgY29tcG9uZW50J3NcbiAqIGNoYW5nZSBkZXRlY3Rpb24gaXMgZXhlY3V0ZWQuIFRoaXMgaXMgZGV0ZXJtaW5lZCBieSBmaW5kaW5nIHRoZSBzY2hlZHVsZXJcbiAqIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGNvbXBvbmVudGAncyByZW5kZXIgdHJlZSBhbmQgd2FpdGluZyB1bnRpbCB0aGUgc2NoZWR1bGVyXG4gKiBmbHVzaGVzLiBJZiBub3RoaW5nIGlzIHNjaGVkdWxlZCwgdGhlIGZ1bmN0aW9uIHJldHVybnMgYSByZXNvbHZlZCBwcm9taXNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIGF3YWl0IHdoZW5SZW5kZXJlZChteUNvbXBvbmVudCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byB3YWl0IHVwb25cbiAqIEByZXR1cm5zIFByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiB0aGUgY29tcG9uZW50IGlzIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2hlblJlbmRlcmVkKGNvbXBvbmVudDogYW55KTogUHJvbWlzZTxudWxsPiB7XG4gIHJldHVybiBnZXRSb290Q29udGV4dChjb21wb25lbnQpLmNsZWFuO1xufVxuIl19