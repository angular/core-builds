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
import { assertDefined } from '../util/assert';
import { assertComponentType } from './assert';
import { getComponentDef } from './definition';
import { diPublicInInjector, getOrCreateNodeInjectorForNode } from './di';
import { publishDefaultGlobalUtils } from './global_utils';
import { registerPostOrderHooks, registerPreOrderHooks } from './hooks';
import { CLEAN_PROMISE, createLView, createNodeAtIndex, createTView, getOrCreateTView, initNodeFlags, instantiateRootComponent, locateHostElement, queueComponentIndexForCheck, refreshDescendantViews } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { CONTEXT, FLAGS, HEADER_OFFSET, HOST, HOST_NODE, TVIEW } from './interfaces/view';
import { enterView, getPreviousOrParentTNode, leaveView, resetComponentState, setCurrentDirectiveDef } from './state';
import { defaultScheduler, getRootView, readPatchedLView, renderStringify } from './util';
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
        throw new Error('NullInjector: Not found: ' + renderStringify(token));
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
    const rootFlags = componentDef.onPush ? 8 /* Dirty */ | 128 /* IsRoot */ :
        4 /* CheckAlways */ | 128 /* IsRoot */;
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
        refreshDescendantViews(rootView); // creation mode pass
        rootView[FLAGS] &= ~1 /* CreationMode */;
        refreshDescendantViews(rootView); // update mode pass
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
    const componentView = createLView(rootView, getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 8 /* Dirty */ : 4 /* CheckAlways */, rendererFactory, renderer, sanitizer);
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
    registerPreOrderHooks(dirIndex, def, rootTView);
    // TODO(misko): replace `as TNode` with createTNode call. (needs refactoring to lose dep on
    // LNode).
    registerPostOrderHooks(rootTView, (/** @type {?} */ ({ directiveStart: dirIndex, directiveEnd: dirIndex + 1 })));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFhQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN0RSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBZSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLHdCQUF3QixFQUFFLGlCQUFpQixFQUFFLDJCQUEyQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJMU8sT0FBTyxFQUF3QyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pHLE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFvRCxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMxSSxPQUFPLEVBQUMsU0FBUyxFQUFFLHdCQUF3QixFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNwSCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7QUFLeEYsNENB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Ozs7Ozs7OztBQWVELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxTQUFjLEVBQUUsR0FBc0I7O1VBQ3BFLFNBQVMsR0FBRyxtQkFBQSxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQzs7VUFDaEQsUUFBUSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7SUFFMUMscUJBQXFCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNoRCwyRkFBMkY7SUFDM0YsVUFBVTtJQUNWLHNCQUFzQixDQUNsQixTQUFTLEVBQUUsbUJBQUEsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEdBQUcsQ0FBQyxFQUFFLEVBQVMsQ0FBQyxDQUFDO0FBQ3BGLENBQUM7Ozs7Ozs7O0FBUUQsU0FBUyxjQUFjLENBQUMsU0FBYzs7VUFDOUIsV0FBVyxHQUFHLG1CQUFBLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBZTtJQUNsRSxTQUFTLElBQUksYUFBYSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN2RCxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztBQW1CRCxNQUFNLFVBQVUsWUFBWSxDQUFDLFNBQWM7SUFDekMsT0FBTyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmUgZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzfSBmcm9tICcuL2dsb2JhbF91dGlscyc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3MsIHJlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0NMRUFOX1BST01JU0UsIGNyZWF0ZUxWaWV3LCBjcmVhdGVOb2RlQXRJbmRleCwgY3JlYXRlVE5vZGUsIGNyZWF0ZVRWaWV3LCBnZXRPckNyZWF0ZVRWaWV3LCBpbml0Tm9kZUZsYWdzLCBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQsIGxvY2F0ZUhvc3RFbGVtZW50LCBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2ssIHJlZnJlc2hEZXNjZW5kYW50Vmlld3N9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUeXBlLCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheWVySGFuZGxlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGRvbVJlbmRlcmVyRmFjdG9yeTN9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIT1NUX05PREUsIExWaWV3LCBMVmlld0ZsYWdzLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7ZW50ZXJWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGxlYXZlVmlldywgcmVzZXRDb21wb25lbnRTdGF0ZSwgc2V0Q3VycmVudERpcmVjdGl2ZURlZn0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2RlZmF1bHRTY2hlZHVsZXIsIGdldFJvb3RWaWV3LCByZWFkUGF0Y2hlZExWaWV3LCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKiogT3B0aW9ucyB0aGF0IGNvbnRyb2wgaG93IHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIGJvb3RzdHJhcHBlZC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucyB7XG4gIC8qKiBXaGljaCByZW5kZXJlciBmYWN0b3J5IHRvIHVzZS4gKi9cbiAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MztcblxuICAvKiogQSBjdXN0b20gc2FuaXRpemVyIGluc3RhbmNlICovXG4gIHNhbml0aXplcj86IFNhbml0aXplcjtcblxuICAvKiogQSBjdXN0b20gYW5pbWF0aW9uIHBsYXllciBoYW5kbGVyICovXG4gIHBsYXllckhhbmRsZXI/OiBQbGF5ZXJIYW5kbGVyO1xuXG4gIC8qKlxuICAgKiBIb3N0IGVsZW1lbnQgb24gd2hpY2ggdGhlIGNvbXBvbmVudCB3aWxsIGJlIGJvb3RzdHJhcHBlZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uJ3MgYHRhZ2AgaXMgdXNlZCB0byBxdWVyeSB0aGUgZXhpc3RpbmcgRE9NIGZvciB0aGVcbiAgICogZWxlbWVudCB0byBib290c3RyYXAuXG4gICAqL1xuICBob3N0PzogUkVsZW1lbnR8c3RyaW5nO1xuXG4gIC8qKiBNb2R1bGUgaW5qZWN0b3IgZm9yIHRoZSBjb21wb25lbnQuIElmIHVuc3BlY2lmaWVkLCB0aGUgaW5qZWN0b3Igd2lsbCBiZSBOVUxMX0lOSkVDVE9SLiAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGZlYXR1cmVzIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGNyZWF0ZWQgY29tcG9uZW50LiBGZWF0dXJlcyBhcmUgc2ltcGx5XG4gICAqIGZ1bmN0aW9ucyB0aGF0IGRlY29yYXRlIGEgY29tcG9uZW50IHdpdGggYSBjZXJ0YWluIGJlaGF2aW9yLlxuICAgKlxuICAgKiBUeXBpY2FsbHksIHRoZSBmZWF0dXJlcyBpbiB0aGlzIGxpc3QgYXJlIGZlYXR1cmVzIHRoYXQgY2Fubm90IGJlIGFkZGVkIHRvIHRoZVxuICAgKiBvdGhlciBmZWF0dXJlcyBsaXN0IGluIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBiZWNhdXNlIHRoZXkgcmVseSBvbiBvdGhlciBmYWN0b3JzLlxuICAgKlxuICAgKiBFeGFtcGxlOiBgUm9vdExpZmVjeWNsZUhvb2tzYCBpcyBhIGZ1bmN0aW9uIHRoYXQgYWRkcyBsaWZlY3ljbGUgaG9vayBjYXBhYmlsaXRpZXNcbiAgICogdG8gcm9vdCBjb21wb25lbnRzIGluIGEgdHJlZS1zaGFrYWJsZSB3YXkuIEl0IGNhbm5vdCBiZSBhZGRlZCB0byB0aGUgY29tcG9uZW50XG4gICAqIGZlYXR1cmVzIGxpc3QgYmVjYXVzZSB0aGVyZSdzIG5vIHdheSBvZiBrbm93aW5nIHdoZW4gdGhlIGNvbXBvbmVudCB3aWxsIGJlIHVzZWQgYXNcbiAgICogYSByb290IGNvbXBvbmVudC5cbiAgICovXG4gIGhvc3RGZWF0dXJlcz86IEhvc3RGZWF0dXJlW107XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggaXMgdXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvcmsgaW4gdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogV2hlbiBtYXJraW5nIGNvbXBvbmVudHMgYXMgZGlydHksIGl0IGlzIG5lY2Vzc2FyeSB0byBzY2hlZHVsZSB0aGUgd29yayBvZlxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFRoaXMgaXMgZG9uZSB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICAgKiB7QGxpbmsgbWFya0RpcnR5fSBjYWxscyBpbnRvIGEgc2luZ2xlIGNoYW5nZWQgZGV0ZWN0aW9uIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzY2hlZHVsZXIgaXMgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBJdCBpcyBhbHNvIHVzZWZ1bCB0byBvdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICAgKi9cbiAgc2NoZWR1bGVyPzogKHdvcms6ICgpID0+IHZvaWQpID0+IHZvaWQ7XG59XG5cbi8qKiBTZWUgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucy5ob3N0RmVhdHVyZXMgKi9cbnR5cGUgSG9zdEZlYXR1cmUgPSAoPFQ+KGNvbXBvbmVudDogVCwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pID0+IHZvaWQpO1xuXG4vLyBUT0RPOiBBIGhhY2sgdG8gbm90IHB1bGwgaW4gdGhlIE51bGxJbmplY3RvciBmcm9tIEBhbmd1bGFyL2NvcmUuXG5leHBvcnQgY29uc3QgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3IgPSB7XG4gIGdldDogKHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGxJbmplY3RvcjogTm90IGZvdW5kOiAnICsgcmVuZGVyU3RyaW5naWZ5KHRva2VuKSk7XG4gIH1cbn07XG5cbi8qKlxuICogQm9vdHN0cmFwcyBhIENvbXBvbmVudCBpbnRvIGFuIGV4aXN0aW5nIGhvc3QgZWxlbWVudCBhbmQgcmV0dXJucyBhbiBpbnN0YW5jZVxuICogb2YgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBVc2UgdGhpcyBmdW5jdGlvbiB0byBib290c3RyYXAgYSBjb21wb25lbnQgaW50byB0aGUgRE9NIHRyZWUuIEVhY2ggaW52b2NhdGlvblxuICogb2YgdGhpcyBmdW5jdGlvbiB3aWxsIGNyZWF0ZSBhIHNlcGFyYXRlIHRyZWUgb2YgY29tcG9uZW50cywgaW5qZWN0b3JzIGFuZFxuICogY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMgYW5kIGxpZmV0aW1lcy4gVG8gZHluYW1pY2FsbHkgaW5zZXJ0IGEgbmV3IGNvbXBvbmVudFxuICogaW50byBhbiBleGlzdGluZyB0cmVlIHN1Y2ggdGhhdCBpdCBzaGFyZXMgdGhlIHNhbWUgaW5qZWN0aW9uLCBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBhbmQgb2JqZWN0IGxpZmV0aW1lLCB1c2Uge0BsaW5rIFZpZXdDb250YWluZXIjY3JlYXRlQ29tcG9uZW50fS5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VHlwZSBDb21wb25lbnQgdG8gYm9vdHN0cmFwXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBwYXJhbWV0ZXJzIHdoaWNoIGNvbnRyb2wgYm9vdHN0cmFwcGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGU8VD58XG4gICAgICAgIFR5cGU8VD4vKiBUeXBlIGFzIHdvcmthcm91bmQgZm9yOiBNaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNDg4MSAqL1xuICAgICxcbiAgICBvcHRzOiBDcmVhdGVDb21wb25lbnRPcHRpb25zID0ge30pOiBUIHtcbiAgbmdEZXZNb2RlICYmIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50VHlwZSk7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IG9wdHMucmVuZGVyZXJGYWN0b3J5IHx8IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gIGNvbnN0IHNhbml0aXplciA9IG9wdHMuc2FuaXRpemVyIHx8IG51bGw7XG4gIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZjxUPihjb21wb25lbnRUeXBlKSAhO1xuICBpZiAoY29tcG9uZW50RGVmLnR5cGUgIT0gY29tcG9uZW50VHlwZSkgY29tcG9uZW50RGVmLnR5cGUgPSBjb21wb25lbnRUeXBlO1xuXG4gIC8vIFRoZSBmaXJzdCBpbmRleCBvZiB0aGUgZmlyc3Qgc2VsZWN0b3IgaXMgdGhlIHRhZyBuYW1lLlxuICBjb25zdCBjb21wb25lbnRUYWcgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG4gIGNvbnN0IGhvc3RSTm9kZSA9IGxvY2F0ZUhvc3RFbGVtZW50KHJlbmRlcmVyRmFjdG9yeSwgb3B0cy5ob3N0IHx8IGNvbXBvbmVudFRhZyk7XG4gIGNvbnN0IHJvb3RGbGFncyA9IGNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290O1xuICBjb25zdCByb290Q29udGV4dCA9IGNyZWF0ZVJvb3RDb250ZXh0KG9wdHMuc2NoZWR1bGVyLCBvcHRzLnBsYXllckhhbmRsZXIpO1xuXG4gIGNvbnN0IHJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3RSTm9kZSwgY29tcG9uZW50RGVmKTtcbiAgY29uc3Qgcm9vdFZpZXc6IExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICBudWxsLCBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCksIHJvb3RDb250ZXh0LCByb290RmxhZ3MsIHJlbmRlcmVyRmFjdG9yeSxcbiAgICAgIHJlbmRlcmVyLCB1bmRlZmluZWQsIG9wdHMuaW5qZWN0b3IgfHwgbnVsbCk7XG5cbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhyb290VmlldywgbnVsbCk7XG4gIGxldCBjb21wb25lbnQ6IFQ7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgICAgICBob3N0Uk5vZGUsIGNvbXBvbmVudERlZiwgcm9vdFZpZXcsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsIHNhbml0aXplcik7XG4gICAgY29tcG9uZW50ID0gY3JlYXRlUm9vdENvbXBvbmVudChcbiAgICAgICAgY29tcG9uZW50VmlldywgY29tcG9uZW50RGVmLCByb290Vmlldywgcm9vdENvbnRleHQsIG9wdHMuaG9zdEZlYXR1cmVzIHx8IG51bGwpO1xuXG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhyb290Vmlldyk7ICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICByb290Vmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3Mocm9vdFZpZXcpOyAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG5cbiAgcmV0dXJuIGNvbXBvbmVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSByb290IGNvbXBvbmVudCB2aWV3IGFuZCB0aGUgcm9vdCBjb21wb25lbnQgbm9kZS5cbiAqXG4gKiBAcGFyYW0gck5vZGUgUmVuZGVyIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBkZWYgQ29tcG9uZW50RGVmXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHBhcmVudCB2aWV3IHdoZXJlIHRoZSBob3N0IG5vZGUgaXMgc3RvcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXIgVGhlIGN1cnJlbnQgcmVuZGVyZXJcbiAqIEBwYXJhbSBzYW5pdGl6ZXIgVGhlIHNhbml0aXplciwgaWYgcHJvdmlkZWRcbiAqXG4gKiBAcmV0dXJucyBDb21wb25lbnQgdmlldyBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50VmlldyhcbiAgICByTm9kZTogUkVsZW1lbnQgfCBudWxsLCBkZWY6IENvbXBvbmVudERlZjxhbnk+LCByb290VmlldzogTFZpZXcsXG4gICAgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCByZW5kZXJlcjogUmVuZGVyZXIzLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTFZpZXcge1xuICByZXNldENvbXBvbmVudFN0YXRlKCk7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdFZpZXdbVFZJRVddO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICByb290VmlldyxcbiAgICAgIGdldE9yQ3JlYXRlVFZpZXcoXG4gICAgICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSksXG4gICAgICBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsXG4gICAgICBzYW5pdGl6ZXIpO1xuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KDAsIFROb2RlVHlwZS5FbGVtZW50LCByTm9kZSwgbnVsbCwgbnVsbCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZGlQdWJsaWNJbkluamVjdG9yKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0Tm9kZSwgcm9vdFZpZXcpLCByb290VmlldywgZGVmLnR5cGUpO1xuICAgIHROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICBpbml0Tm9kZUZsYWdzKHROb2RlLCByb290Vmlldy5sZW5ndGgsIDEpO1xuICAgIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjayh0Tm9kZSk7XG4gIH1cblxuICAvLyBTdG9yZSBjb21wb25lbnQgdmlldyBhdCBub2RlIGluZGV4LCB3aXRoIG5vZGUgYXMgdGhlIEhPU1RcbiAgY29tcG9uZW50Vmlld1tIT1NUXSA9IHJvb3RWaWV3W0hFQURFUl9PRkZTRVRdO1xuICBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gPSB0Tm9kZSBhcyBURWxlbWVudE5vZGU7XG4gIHJldHVybiByb290Vmlld1tIRUFERVJfT0ZGU0VUXSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJvb3QgY29tcG9uZW50IGFuZCBzZXRzIGl0IHVwIHdpdGggZmVhdHVyZXMgYW5kIGhvc3QgYmluZGluZ3MuIFNoYXJlZCBieVxuICogcmVuZGVyQ29tcG9uZW50KCkgYW5kIFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFZpZXc6IExWaWV3LCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPiwgcm9vdFZpZXc6IExWaWV3LCByb290Q29udGV4dDogUm9vdENvbnRleHQsXG4gICAgaG9zdEZlYXR1cmVzOiBIb3N0RmVhdHVyZVtdIHwgbnVsbCk6IGFueSB7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdFZpZXdbVFZJRVddO1xuICAvLyBDcmVhdGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggZmFjdG9yeSgpIGFuZCBzdG9yZSBhdCBuZXh0IGluZGV4IGluIHZpZXdEYXRhXG4gIGNvbnN0IGNvbXBvbmVudCA9IGluc3RhbnRpYXRlUm9vdENvbXBvbmVudCh0Vmlldywgcm9vdFZpZXcsIGNvbXBvbmVudERlZik7XG5cbiAgcm9vdENvbnRleHQuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBjb21wb25lbnQ7XG5cbiAgaG9zdEZlYXR1cmVzICYmIGhvc3RGZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlKSA9PiBmZWF0dXJlKGNvbXBvbmVudCwgY29tcG9uZW50RGVmKSk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIGNvbXBvbmVudERlZi5ob3N0QmluZGluZ3MpIHtcbiAgICBjb25zdCByb290VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGNvbXBvbmVudERlZik7XG4gICAgY29tcG9uZW50RGVmLmhvc3RCaW5kaW5ncyhSZW5kZXJGbGFncy5DcmVhdGUsIGNvbXBvbmVudCwgcm9vdFROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gICAgc2V0Q3VycmVudERpcmVjdGl2ZURlZihudWxsKTtcbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb250ZXh0KFxuICAgIHNjaGVkdWxlcj86ICh3b3JrRm46ICgpID0+IHZvaWQpID0+IHZvaWQsIHBsYXllckhhbmRsZXI/OiBQbGF5ZXJIYW5kbGVyfG51bGwpOiBSb290Q29udGV4dCB7XG4gIHJldHVybiB7XG4gICAgY29tcG9uZW50czogW10sXG4gICAgc2NoZWR1bGVyOiBzY2hlZHVsZXIgfHwgZGVmYXVsdFNjaGVkdWxlcixcbiAgICBjbGVhbjogQ0xFQU5fUFJPTUlTRSxcbiAgICBwbGF5ZXJIYW5kbGVyOiBwbGF5ZXJIYW5kbGVyIHx8IG51bGwsXG4gICAgZmxhZ3M6IFJvb3RDb250ZXh0RmxhZ3MuRW1wdHlcbiAgfTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGVuYWJsZSBsaWZlY3ljbGUgaG9va3Mgb24gdGhlIHJvb3QgY29tcG9uZW50LlxuICpcbiAqIEluY2x1ZGUgdGhpcyBmZWF0dXJlIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBpZiB0aGUgcm9vdCBjb21wb25lbnRcbiAqIHlvdSBhcmUgcmVuZGVyaW5nIGhhcyBsaWZlY3ljbGUgaG9va3MgZGVmaW5lZC4gT3RoZXJ3aXNlLCB0aGUgaG9va3Mgd29uJ3RcbiAqIGJlIGNhbGxlZCBwcm9wZXJseS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogcmVuZGVyQ29tcG9uZW50KEFwcENvbXBvbmVudCwge2ZlYXR1cmVzOiBbUm9vdExpZmVjeWNsZUhvb2tzXX0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBMaWZlY3ljbGVIb29rc0ZlYXR1cmUoY29tcG9uZW50OiBhbnksIGRlZjogQ29tcG9uZW50RGVmPGFueT4pOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFRWaWV3ID0gcmVhZFBhdGNoZWRMVmlldyhjb21wb25lbnQpICFbVFZJRVddO1xuICBjb25zdCBkaXJJbmRleCA9IHJvb3RUVmlldy5kYXRhLmxlbmd0aCAtIDE7XG5cbiAgcmVnaXN0ZXJQcmVPcmRlckhvb2tzKGRpckluZGV4LCBkZWYsIHJvb3RUVmlldyk7XG4gIC8vIFRPRE8obWlza28pOiByZXBsYWNlIGBhcyBUTm9kZWAgd2l0aCBjcmVhdGVUTm9kZSBjYWxsLiAobmVlZHMgcmVmYWN0b3JpbmcgdG8gbG9zZSBkZXAgb25cbiAgLy8gTE5vZGUpLlxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKFxuICAgICAgcm9vdFRWaWV3LCB7IGRpcmVjdGl2ZVN0YXJ0OiBkaXJJbmRleCwgZGlyZWN0aXZlRW5kOiBkaXJJbmRleCArIDEgfSBhcyBUTm9kZSk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgY29udGV4dCBmb3IgYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQoY29tcG9uZW50OiBhbnkpOiBSb290Q29udGV4dCB7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KVtDT05URVhUXSBhcyBSb290Q29udGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocm9vdENvbnRleHQsICdyb290Q29udGV4dCcpO1xuICByZXR1cm4gcm9vdENvbnRleHQ7XG59XG5cblxuLyoqXG4gKiBXYWl0IG9uIGNvbXBvbmVudCB1bnRpbCBpdCBpcyByZW5kZXJlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgYSBgUHJvbWlzZWAgd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiB0aGUgY29tcG9uZW50J3NcbiAqIGNoYW5nZSBkZXRlY3Rpb24gaXMgZXhlY3V0ZWQuIFRoaXMgaXMgZGV0ZXJtaW5lZCBieSBmaW5kaW5nIHRoZSBzY2hlZHVsZXJcbiAqIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGNvbXBvbmVudGAncyByZW5kZXIgdHJlZSBhbmQgd2FpdGluZyB1bnRpbCB0aGUgc2NoZWR1bGVyXG4gKiBmbHVzaGVzLiBJZiBub3RoaW5nIGlzIHNjaGVkdWxlZCwgdGhlIGZ1bmN0aW9uIHJldHVybnMgYSByZXNvbHZlZCBwcm9taXNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIGF3YWl0IHdoZW5SZW5kZXJlZChteUNvbXBvbmVudCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byB3YWl0IHVwb25cbiAqIEByZXR1cm5zIFByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiB0aGUgY29tcG9uZW50IGlzIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2hlblJlbmRlcmVkKGNvbXBvbmVudDogYW55KTogUHJvbWlzZTxudWxsPiB7XG4gIHJldHVybiBnZXRSb290Q29udGV4dChjb21wb25lbnQpLmNsZWFuO1xufVxuIl19