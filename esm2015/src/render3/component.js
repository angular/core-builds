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
    componentView[HOST_NODE] = /** @type {?} */ (tNode);
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
    /** @type {?} */
    const component = instantiateRootComponent(tView, rootView, componentDef);
    rootContext.components.push(component);
    componentView[CONTEXT] = component;
    hostFeatures && hostFeatures.forEach((feature) => feature(component, componentDef));
    if (tView.firstTemplatePass && componentDef.hostBindings) {
        /** @type {?} */
        const rootTNode = getPreviousOrParentTNode();
        setCurrentDirectiveDef(componentDef);
        componentDef.hostBindings(1 /* Create */, component, rootTNode.index);
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
    const rootTView = /** @type {?} */ ((readPatchedLView(component)))[TVIEW];
    /** @type {?} */
    const dirIndex = rootTView.data.length - 1;
    queueInitHooks(dirIndex, def.onInit, def.doCheck, rootTView);
    // TODO(misko): replace `as TNode` with createTNode call. (needs refactoring to lose dep on
    // LNode).
    queueLifecycleHooks(rootTView, /** @type {?} */ ({ directiveStart: dirIndex, directiveEnd: dirIndex + 1 }));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFjQSxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQWUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSx3QkFBd0IsRUFBRSxpQkFBaUIsRUFBRSwyQkFBMkIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSTFPLE9BQU8sRUFBd0MsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRyxPQUFPLEVBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFvRCxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuSSxPQUFPLEVBQUMsU0FBUyxFQUFFLHdCQUF3QixFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNwSCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeURsRixhQUFh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Q0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDOzs7SUFHN0QsbUJBQW1CLENBQUMsU0FBUyxvQkFBRSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsR0FBRyxDQUFDLEVBQVcsRUFBQyxDQUFDO0NBQ25HOzs7Ozs7OztBQVFELFNBQVMsY0FBYyxDQUFDLFNBQWM7O0lBQ3BDLE1BQU0sV0FBVyxxQkFBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFnQixFQUFDO0lBQ25FLFNBQVMsSUFBSSxhQUFhLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ3ZELE9BQU8sV0FBVyxDQUFDO0NBQ3BCOzs7Ozs7Ozs7Ozs7Ozs7OztBQW1CRCxNQUFNLFVBQVUsWUFBWSxDQUFDLFNBQWM7SUFDekMsT0FBTyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDO0NBQ3hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lIGZyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9jb3JlJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGUsIGFzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHN9IGZyb20gJy4vZ2xvYmFsX3V0aWxzJztcbmltcG9ydCB7cXVldWVJbml0SG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtDTEVBTl9QUk9NSVNFLCBjcmVhdGVMVmlldywgY3JlYXRlTm9kZUF0SW5kZXgsIGNyZWF0ZVROb2RlLCBjcmVhdGVUVmlldywgZ2V0T3JDcmVhdGVUVmlldywgaW5pdE5vZGVGbGFncywgaW5zdGFudGlhdGVSb290Q29tcG9uZW50LCBsb2NhdGVIb3N0RWxlbWVudCwgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrLCByZWZyZXNoRGVzY2VuZGFudFZpZXdzfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VHlwZSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXllckhhbmRsZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBkb21SZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDT05URVhULCBIRUFERVJfT0ZGU0VULCBIT1NULCBIT1NUX05PREUsIExWaWV3LCBMVmlld0ZsYWdzLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7ZW50ZXJWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGxlYXZlVmlldywgcmVzZXRDb21wb25lbnRTdGF0ZSwgc2V0Q3VycmVudERpcmVjdGl2ZURlZn0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2RlZmF1bHRTY2hlZHVsZXIsIGdldFJvb3RWaWV3LCByZWFkUGF0Y2hlZExWaWV3LCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKiogT3B0aW9ucyB0aGF0IGNvbnRyb2wgaG93IHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIGJvb3RzdHJhcHBlZC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucyB7XG4gIC8qKiBXaGljaCByZW5kZXJlciBmYWN0b3J5IHRvIHVzZS4gKi9cbiAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MztcblxuICAvKiogQSBjdXN0b20gc2FuaXRpemVyIGluc3RhbmNlICovXG4gIHNhbml0aXplcj86IFNhbml0aXplcjtcblxuICAvKiogQSBjdXN0b20gYW5pbWF0aW9uIHBsYXllciBoYW5kbGVyICovXG4gIHBsYXllckhhbmRsZXI/OiBQbGF5ZXJIYW5kbGVyO1xuXG4gIC8qKlxuICAgKiBIb3N0IGVsZW1lbnQgb24gd2hpY2ggdGhlIGNvbXBvbmVudCB3aWxsIGJlIGJvb3RzdHJhcHBlZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uJ3MgYHRhZ2AgaXMgdXNlZCB0byBxdWVyeSB0aGUgZXhpc3RpbmcgRE9NIGZvciB0aGVcbiAgICogZWxlbWVudCB0byBib290c3RyYXAuXG4gICAqL1xuICBob3N0PzogUkVsZW1lbnR8c3RyaW5nO1xuXG4gIC8qKiBNb2R1bGUgaW5qZWN0b3IgZm9yIHRoZSBjb21wb25lbnQuIElmIHVuc3BlY2lmaWVkLCB0aGUgaW5qZWN0b3Igd2lsbCBiZSBOVUxMX0lOSkVDVE9SLiAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGZlYXR1cmVzIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGNyZWF0ZWQgY29tcG9uZW50LiBGZWF0dXJlcyBhcmUgc2ltcGx5XG4gICAqIGZ1bmN0aW9ucyB0aGF0IGRlY29yYXRlIGEgY29tcG9uZW50IHdpdGggYSBjZXJ0YWluIGJlaGF2aW9yLlxuICAgKlxuICAgKiBUeXBpY2FsbHksIHRoZSBmZWF0dXJlcyBpbiB0aGlzIGxpc3QgYXJlIGZlYXR1cmVzIHRoYXQgY2Fubm90IGJlIGFkZGVkIHRvIHRoZVxuICAgKiBvdGhlciBmZWF0dXJlcyBsaXN0IGluIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBiZWNhdXNlIHRoZXkgcmVseSBvbiBvdGhlciBmYWN0b3JzLlxuICAgKlxuICAgKiBFeGFtcGxlOiBgUm9vdExpZmVjeWNsZUhvb2tzYCBpcyBhIGZ1bmN0aW9uIHRoYXQgYWRkcyBsaWZlY3ljbGUgaG9vayBjYXBhYmlsaXRpZXNcbiAgICogdG8gcm9vdCBjb21wb25lbnRzIGluIGEgdHJlZS1zaGFrYWJsZSB3YXkuIEl0IGNhbm5vdCBiZSBhZGRlZCB0byB0aGUgY29tcG9uZW50XG4gICAqIGZlYXR1cmVzIGxpc3QgYmVjYXVzZSB0aGVyZSdzIG5vIHdheSBvZiBrbm93aW5nIHdoZW4gdGhlIGNvbXBvbmVudCB3aWxsIGJlIHVzZWQgYXNcbiAgICogYSByb290IGNvbXBvbmVudC5cbiAgICovXG4gIGhvc3RGZWF0dXJlcz86IEhvc3RGZWF0dXJlW107XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggaXMgdXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvcmsgaW4gdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogV2hlbiBtYXJraW5nIGNvbXBvbmVudHMgYXMgZGlydHksIGl0IGlzIG5lY2Vzc2FyeSB0byBzY2hlZHVsZSB0aGUgd29yayBvZlxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFRoaXMgaXMgZG9uZSB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICAgKiB7QGxpbmsgbWFya0RpcnR5fSBjYWxscyBpbnRvIGEgc2luZ2xlIGNoYW5nZWQgZGV0ZWN0aW9uIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzY2hlZHVsZXIgaXMgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBJdCBpcyBhbHNvIHVzZWZ1bCB0byBvdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICAgKi9cbiAgc2NoZWR1bGVyPzogKHdvcms6ICgpID0+IHZvaWQpID0+IHZvaWQ7XG59XG5cbi8qKiBTZWUgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucy5ob3N0RmVhdHVyZXMgKi9cbnR5cGUgSG9zdEZlYXR1cmUgPSAoPFQ+KGNvbXBvbmVudDogVCwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pID0+IHZvaWQpO1xuXG4vLyBUT0RPOiBBIGhhY2sgdG8gbm90IHB1bGwgaW4gdGhlIE51bGxJbmplY3RvciBmcm9tIEBhbmd1bGFyL2NvcmUuXG5leHBvcnQgY29uc3QgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3IgPSB7XG4gIGdldDogKHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGxJbmplY3RvcjogTm90IGZvdW5kOiAnICsgc3RyaW5naWZ5KHRva2VuKSk7XG4gIH1cbn07XG5cbi8qKlxuICogQm9vdHN0cmFwcyBhIENvbXBvbmVudCBpbnRvIGFuIGV4aXN0aW5nIGhvc3QgZWxlbWVudCBhbmQgcmV0dXJucyBhbiBpbnN0YW5jZVxuICogb2YgdGhlIGNvbXBvbmVudC5cbiAqXG4gKiBVc2UgdGhpcyBmdW5jdGlvbiB0byBib290c3RyYXAgYSBjb21wb25lbnQgaW50byB0aGUgRE9NIHRyZWUuIEVhY2ggaW52b2NhdGlvblxuICogb2YgdGhpcyBmdW5jdGlvbiB3aWxsIGNyZWF0ZSBhIHNlcGFyYXRlIHRyZWUgb2YgY29tcG9uZW50cywgaW5qZWN0b3JzIGFuZFxuICogY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMgYW5kIGxpZmV0aW1lcy4gVG8gZHluYW1pY2FsbHkgaW5zZXJ0IGEgbmV3IGNvbXBvbmVudFxuICogaW50byBhbiBleGlzdGluZyB0cmVlIHN1Y2ggdGhhdCBpdCBzaGFyZXMgdGhlIHNhbWUgaW5qZWN0aW9uLCBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBhbmQgb2JqZWN0IGxpZmV0aW1lLCB1c2Uge0BsaW5rIFZpZXdDb250YWluZXIjY3JlYXRlQ29tcG9uZW50fS5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VHlwZSBDb21wb25lbnQgdG8gYm9vdHN0cmFwXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBwYXJhbWV0ZXJzIHdoaWNoIGNvbnRyb2wgYm9vdHN0cmFwcGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGU8VD58XG4gICAgICAgIFR5cGU8VD4vKiBUeXBlIGFzIHdvcmthcm91bmQgZm9yOiBNaWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNDg4MSAqL1xuICAgICxcbiAgICBvcHRzOiBDcmVhdGVDb21wb25lbnRPcHRpb25zID0ge30pOiBUIHtcbiAgbmdEZXZNb2RlICYmIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50VHlwZSk7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IG9wdHMucmVuZGVyZXJGYWN0b3J5IHx8IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gIGNvbnN0IHNhbml0aXplciA9IG9wdHMuc2FuaXRpemVyIHx8IG51bGw7XG4gIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZjxUPihjb21wb25lbnRUeXBlKSAhO1xuICBpZiAoY29tcG9uZW50RGVmLnR5cGUgIT0gY29tcG9uZW50VHlwZSkgY29tcG9uZW50RGVmLnR5cGUgPSBjb21wb25lbnRUeXBlO1xuXG4gIC8vIFRoZSBmaXJzdCBpbmRleCBvZiB0aGUgZmlyc3Qgc2VsZWN0b3IgaXMgdGhlIHRhZyBuYW1lLlxuICBjb25zdCBjb21wb25lbnRUYWcgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG4gIGNvbnN0IGhvc3RSTm9kZSA9IGxvY2F0ZUhvc3RFbGVtZW50KHJlbmRlcmVyRmFjdG9yeSwgb3B0cy5ob3N0IHx8IGNvbXBvbmVudFRhZyk7XG4gIGNvbnN0IHJvb3RGbGFncyA9IGNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290O1xuICBjb25zdCByb290Q29udGV4dCA9IGNyZWF0ZVJvb3RDb250ZXh0KG9wdHMuc2NoZWR1bGVyLCBvcHRzLnBsYXllckhhbmRsZXIpO1xuXG4gIGNvbnN0IHJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3RSTm9kZSwgY29tcG9uZW50RGVmKTtcbiAgY29uc3Qgcm9vdFZpZXc6IExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICBudWxsLCBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCksIHJvb3RDb250ZXh0LCByb290RmxhZ3MsIHJlbmRlcmVyRmFjdG9yeSxcbiAgICAgIHJlbmRlcmVyLCB1bmRlZmluZWQsIG9wdHMuaW5qZWN0b3IgfHwgbnVsbCk7XG5cbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhyb290VmlldywgbnVsbCk7XG4gIGxldCBjb21wb25lbnQ6IFQ7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgICAgICBob3N0Uk5vZGUsIGNvbXBvbmVudERlZiwgcm9vdFZpZXcsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsIHNhbml0aXplcik7XG4gICAgY29tcG9uZW50ID0gY3JlYXRlUm9vdENvbXBvbmVudChcbiAgICAgICAgY29tcG9uZW50VmlldywgY29tcG9uZW50RGVmLCByb290Vmlldywgcm9vdENvbnRleHQsIG9wdHMuaG9zdEZlYXR1cmVzIHx8IG51bGwpO1xuXG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhyb290VmlldywgbnVsbCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIHJvb3QgY29tcG9uZW50IHZpZXcgYW5kIHRoZSByb290IGNvbXBvbmVudCBub2RlLlxuICpcbiAqIEBwYXJhbSByTm9kZSBSZW5kZXIgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcGFyZW50IHZpZXcgd2hlcmUgdGhlIGhvc3Qgbm9kZSBpcyBzdG9yZWRcbiAqIEBwYXJhbSByZW5kZXJlciBUaGUgY3VycmVudCByZW5kZXJlclxuICogQHBhcmFtIHNhbml0aXplciBUaGUgc2FuaXRpemVyLCBpZiBwcm92aWRlZFxuICpcbiAqIEByZXR1cm5zIENvbXBvbmVudCB2aWV3IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgIHJOb2RlOiBSRWxlbWVudCB8IG51bGwsIGRlZjogQ29tcG9uZW50RGVmPGFueT4sIHJvb3RWaWV3OiBMVmlldyxcbiAgICByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMVmlldyB7XG4gIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgY29uc3QgdFZpZXcgPSByb290Vmlld1tUVklFV107XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgIHJvb3RWaWV3LFxuICAgICAgZ2V0T3JDcmVhdGVUVmlldyhcbiAgICAgICAgICBkZWYudGVtcGxhdGUsIGRlZi5jb25zdHMsIGRlZi52YXJzLCBkZWYuZGlyZWN0aXZlRGVmcywgZGVmLnBpcGVEZWZzLCBkZWYudmlld1F1ZXJ5KSxcbiAgICAgIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlcixcbiAgICAgIHNhbml0aXplcik7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoMCwgVE5vZGVUeXBlLkVsZW1lbnQsIHJOb2RlLCBudWxsLCBudWxsKTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCByb290VmlldyksIHJvb3RWaWV3LCBkZWYudHlwZSk7XG4gICAgdE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuICAgIGluaXROb2RlRmxhZ3ModE5vZGUsIHJvb3RWaWV3Lmxlbmd0aCwgMSk7XG4gICAgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKHROb2RlKTtcbiAgfVxuXG4gIC8vIFN0b3JlIGNvbXBvbmVudCB2aWV3IGF0IG5vZGUgaW5kZXgsIHdpdGggbm9kZSBhcyB0aGUgSE9TVFxuICBjb21wb25lbnRWaWV3W0hPU1RdID0gcm9vdFZpZXdbSEVBREVSX09GRlNFVF07XG4gIGNvbXBvbmVudFZpZXdbSE9TVF9OT0RFXSA9IHROb2RlIGFzIFRFbGVtZW50Tm9kZTtcbiAgcmV0dXJuIHJvb3RWaWV3W0hFQURFUl9PRkZTRVRdID0gY29tcG9uZW50Vmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgcm9vdCBjb21wb25lbnQgYW5kIHNldHMgaXQgdXAgd2l0aCBmZWF0dXJlcyBhbmQgaG9zdCBiaW5kaW5ncy4gU2hhcmVkIGJ5XG4gKiByZW5kZXJDb21wb25lbnQoKSBhbmQgVmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnQoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gICAgY29tcG9uZW50VmlldzogTFZpZXcsIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+LCByb290VmlldzogTFZpZXcsIHJvb3RDb250ZXh0OiBSb290Q29udGV4dCxcbiAgICBob3N0RmVhdHVyZXM6IEhvc3RGZWF0dXJlW10gfCBudWxsKTogYW55IHtcbiAgY29uc3QgdFZpZXcgPSByb290Vmlld1tUVklFV107XG4gIC8vIENyZWF0ZSBkaXJlY3RpdmUgaW5zdGFuY2Ugd2l0aCBmYWN0b3J5KCkgYW5kIHN0b3JlIGF0IG5leHQgaW5kZXggaW4gdmlld0RhdGFcbiAgY29uc3QgY29tcG9uZW50ID0gaW5zdGFudGlhdGVSb290Q29tcG9uZW50KHRWaWV3LCByb290VmlldywgY29tcG9uZW50RGVmKTtcblxuICByb290Q29udGV4dC5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IGNvbXBvbmVudDtcblxuICBob3N0RmVhdHVyZXMgJiYgaG9zdEZlYXR1cmVzLmZvckVhY2goKGZlYXR1cmUpID0+IGZlYXR1cmUoY29tcG9uZW50LCBjb21wb25lbnREZWYpKTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgY29tcG9uZW50RGVmLmhvc3RCaW5kaW5ncykge1xuICAgIGNvbnN0IHJvb3RUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVEZWYoY29tcG9uZW50RGVmKTtcbiAgICBjb21wb25lbnREZWYuaG9zdEJpbmRpbmdzKFJlbmRlckZsYWdzLkNyZWF0ZSwgY29tcG9uZW50LCByb290VE5vZGUuaW5kZXgpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVEZWYobnVsbCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29udGV4dChcbiAgICBzY2hlZHVsZXI/OiAod29ya0ZuOiAoKSA9PiB2b2lkKSA9PiB2b2lkLCBwbGF5ZXJIYW5kbGVyPzogUGxheWVySGFuZGxlcnxudWxsKTogUm9vdENvbnRleHQge1xuICByZXR1cm4ge1xuICAgIGNvbXBvbmVudHM6IFtdLFxuICAgIHNjaGVkdWxlcjogc2NoZWR1bGVyIHx8IGRlZmF1bHRTY2hlZHVsZXIsXG4gICAgY2xlYW46IENMRUFOX1BST01JU0UsXG4gICAgcGxheWVySGFuZGxlcjogcGxheWVySGFuZGxlciB8fCBudWxsLFxuICAgIGZsYWdzOiBSb290Q29udGV4dEZsYWdzLkVtcHR5XG4gIH07XG59XG5cbi8qKlxuICogVXNlZCB0byBlbmFibGUgbGlmZWN5Y2xlIGhvb2tzIG9uIHRoZSByb290IGNvbXBvbmVudC5cbiAqXG4gKiBJbmNsdWRlIHRoaXMgZmVhdHVyZSB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgaWYgdGhlIHJvb3QgY29tcG9uZW50XG4gKiB5b3UgYXJlIHJlbmRlcmluZyBoYXMgbGlmZWN5Y2xlIGhvb2tzIGRlZmluZWQuIE90aGVyd2lzZSwgdGhlIGhvb2tzIHdvbid0XG4gKiBiZSBjYWxsZWQgcHJvcGVybHkuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIHJlbmRlckNvbXBvbmVudChBcHBDb21wb25lbnQsIHtmZWF0dXJlczogW1Jvb3RMaWZlY3ljbGVIb29rc119KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKGNvbXBvbmVudDogYW55LCBkZWY6IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGNvbnN0IHJvb3RUVmlldyA9IHJlYWRQYXRjaGVkTFZpZXcoY29tcG9uZW50KSAhW1RWSUVXXTtcbiAgY29uc3QgZGlySW5kZXggPSByb290VFZpZXcuZGF0YS5sZW5ndGggLSAxO1xuXG4gIHF1ZXVlSW5pdEhvb2tzKGRpckluZGV4LCBkZWYub25Jbml0LCBkZWYuZG9DaGVjaywgcm9vdFRWaWV3KTtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlcGxhY2UgYGFzIFROb2RlYCB3aXRoIGNyZWF0ZVROb2RlIGNhbGwuIChuZWVkcyByZWZhY3RvcmluZyB0byBsb3NlIGRlcCBvblxuICAvLyBMTm9kZSkuXG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3Mocm9vdFRWaWV3LCB7IGRpcmVjdGl2ZVN0YXJ0OiBkaXJJbmRleCwgZGlyZWN0aXZlRW5kOiBkaXJJbmRleCArIDEgfSBhcyBUTm9kZSk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgY29udGV4dCBmb3IgYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQoY29tcG9uZW50OiBhbnkpOiBSb290Q29udGV4dCB7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KVtDT05URVhUXSBhcyBSb290Q29udGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocm9vdENvbnRleHQsICdyb290Q29udGV4dCcpO1xuICByZXR1cm4gcm9vdENvbnRleHQ7XG59XG5cblxuLyoqXG4gKiBXYWl0IG9uIGNvbXBvbmVudCB1bnRpbCBpdCBpcyByZW5kZXJlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgYSBgUHJvbWlzZWAgd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiB0aGUgY29tcG9uZW50J3NcbiAqIGNoYW5nZSBkZXRlY3Rpb24gaXMgZXhlY3V0ZWQuIFRoaXMgaXMgZGV0ZXJtaW5lZCBieSBmaW5kaW5nIHRoZSBzY2hlZHVsZXJcbiAqIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGNvbXBvbmVudGAncyByZW5kZXIgdHJlZSBhbmQgd2FpdGluZyB1bnRpbCB0aGUgc2NoZWR1bGVyXG4gKiBmbHVzaGVzLiBJZiBub3RoaW5nIGlzIHNjaGVkdWxlZCwgdGhlIGZ1bmN0aW9uIHJldHVybnMgYSByZXNvbHZlZCBwcm9taXNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIGF3YWl0IHdoZW5SZW5kZXJlZChteUNvbXBvbmVudCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byB3YWl0IHVwb25cbiAqIEByZXR1cm5zIFByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiB0aGUgY29tcG9uZW50IGlzIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2hlblJlbmRlcmVkKGNvbXBvbmVudDogYW55KTogUHJvbWlzZTxudWxsPiB7XG4gIHJldHVybiBnZXRSb290Q29udGV4dChjb21wb25lbnQpLmNsZWFuO1xufVxuIl19