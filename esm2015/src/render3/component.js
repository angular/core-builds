/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDataInRange } from '../util/assert';
import { assertComponentType } from './assert';
import { getComponentDef } from './definition';
import { diPublicInInjector, getOrCreateNodeInjectorForNode } from './di';
import { registerPostOrderHooks, registerPreOrderHooks } from './hooks';
import { CLEAN_PROMISE, addToViewTree, createLView, createTView, getOrCreateTNode, getOrCreateTView, initNodeFlags, instantiateRootComponent, invokeHostBindingsInCreationMode, locateHostElement, markAsComponentHost, refreshView, renderView } from './instructions/shared';
import { domRendererFactory3 } from './interfaces/renderer';
import { CONTEXT, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { getPreviousOrParentTNode, resetComponentState, selectView, setActiveHostElement } from './state';
import { publishDefaultGlobalUtils } from './util/global_utils';
import { defaultScheduler, stringifyForError } from './util/misc_utils';
import { getRootContext } from './util/view_traversal_utils';
import { readPatchedLView } from './util/view_utils';
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
     * Example: `LifecycleHooksFeature` is a function that adds lifecycle hook capabilities
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
    get: (/**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    (token, notFoundValue) => {
        throw new Error('NullInjector: Not found: ' + stringifyForError(token));
    })
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
    // this is preemptively set to avoid having test and debug code accidentally
    // read data from a previous application state...
    setActiveHostElement(null);
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
    const rootFlags = componentDef.onPush ? 64 /* Dirty */ | 512 /* IsRoot */ :
        16 /* CheckAlways */ | 512 /* IsRoot */;
    /** @type {?} */
    const rootContext = createRootContext(opts.scheduler, opts.playerHandler);
    /** @type {?} */
    const renderer = rendererFactory.createRenderer(hostRNode, componentDef);
    /** @type {?} */
    const rootTView = createTView(-1, null, 1, 0, null, null, null, null);
    /** @type {?} */
    const rootView = createLView(null, rootTView, rootContext, rootFlags, null, null, rendererFactory, renderer, undefined, opts.injector || null);
    /** @type {?} */
    const oldView = selectView(rootView, null);
    /** @type {?} */
    let component;
    try {
        if (rendererFactory.begin)
            rendererFactory.begin();
        /** @type {?} */
        const componentView = createRootComponentView(hostRNode, componentDef, rootView, rendererFactory, renderer, sanitizer);
        component = createRootComponent(componentView, componentDef, rootView, rootContext, opts.hostFeatures || null);
        // create mode pass
        renderView(rootView, rootTView, null);
        // update mode pass
        refreshView(rootView, rootTView, null, null);
    }
    finally {
        selectView(oldView, null);
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
    ngDevMode && assertDataInRange(rootView, 0 + HEADER_OFFSET);
    rootView[0 + HEADER_OFFSET] = rNode;
    /** @type {?} */
    const tNode = getOrCreateTNode(tView, null, 0, 3 /* Element */, null, null);
    /** @type {?} */
    const componentView = createLView(rootView, getOrCreateTView(def), null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, rootView[HEADER_OFFSET], tNode, rendererFactory, renderer, sanitizer);
    if (tView.firstTemplatePass) {
        diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, rootView), tView, def.type);
        markAsComponentHost(tView, tNode);
        initNodeFlags(tNode, rootView.length, 1);
    }
    addToViewTree(rootView, componentView);
    // Store component view at node index, with node as the HOST
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
    hostFeatures && hostFeatures.forEach((/**
     * @param {?} feature
     * @return {?}
     */
    (feature) => feature(component, componentDef)));
    // We want to generate an empty QueryList for root content queries for backwards
    // compatibility with ViewEngine.
    if (componentDef.contentQueries) {
        componentDef.contentQueries(1 /* Create */, component, rootView.length - 1);
    }
    /** @type {?} */
    const rootTNode = getPreviousOrParentTNode();
    if (tView.firstTemplatePass && componentDef.hostBindings) {
        /** @type {?} */
        const elementIndex = rootTNode.index - HEADER_OFFSET;
        setActiveHostElement(elementIndex);
        /** @type {?} */
        const expando = (/** @type {?} */ (tView.expandoInstructions));
        invokeHostBindingsInCreationMode(componentDef, expando, component, rootTNode, tView.firstTemplatePass);
        setActiveHostElement(null);
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
    registerPreOrderHooks(dirIndex, def, rootTView, -1, -1, -1);
    // TODO(misko): replace `as TNode` with createTNode call. (needs refactoring to lose dep on
    // LNode).
    registerPostOrderHooks(rootTView, (/** @type {?} */ ({ directiveStart: dirIndex, directiveEnd: dirIndex + 1 })));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFhQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDeEUsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxFQUFFLHdCQUF3QixFQUFFLGdDQUFnQyxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUk3USxPQUFPLEVBQXdDLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakcsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQW9ELEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xILE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDeEcsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDOUQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDZCQUE2QixD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LENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmUgZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2NvcmUnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZX0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGV9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3MsIHJlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0NMRUFOX1BST01JU0UsIGFkZFRvVmlld1RyZWUsIGNyZWF0ZUxWaWV3LCBjcmVhdGVUVmlldywgZ2V0T3JDcmVhdGVUTm9kZSwgZ2V0T3JDcmVhdGVUVmlldywgaW5pdE5vZGVGbGFncywgaW5zdGFudGlhdGVSb290Q29tcG9uZW50LCBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZSwgbG9jYXRlSG9zdEVsZW1lbnQsIG1hcmtBc0NvbXBvbmVudEhvc3QsIHJlZnJlc2hWaWV3LCByZW5kZXJWaWV3fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFR5cGUsIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJIYW5kbGVyfSBmcm9tICcuL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgZG9tUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHJlc2V0Q29tcG9uZW50U3RhdGUsIHNlbGVjdFZpZXcsIHNldEFjdGl2ZUhvc3RFbGVtZW50fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7cHVibGlzaERlZmF1bHRHbG9iYWxVdGlsc30gZnJvbSAnLi91dGlsL2dsb2JhbF91dGlscyc7XG5pbXBvcnQge2RlZmF1bHRTY2hlZHVsZXIsIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtyZWFkUGF0Y2hlZExWaWV3fSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vKiogT3B0aW9ucyB0aGF0IGNvbnRyb2wgaG93IHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIGJvb3RzdHJhcHBlZC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucyB7XG4gIC8qKiBXaGljaCByZW5kZXJlciBmYWN0b3J5IHRvIHVzZS4gKi9cbiAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MztcblxuICAvKiogQSBjdXN0b20gc2FuaXRpemVyIGluc3RhbmNlICovXG4gIHNhbml0aXplcj86IFNhbml0aXplcjtcblxuICAvKiogQSBjdXN0b20gYW5pbWF0aW9uIHBsYXllciBoYW5kbGVyICovXG4gIHBsYXllckhhbmRsZXI/OiBQbGF5ZXJIYW5kbGVyO1xuXG4gIC8qKlxuICAgKiBIb3N0IGVsZW1lbnQgb24gd2hpY2ggdGhlIGNvbXBvbmVudCB3aWxsIGJlIGJvb3RzdHJhcHBlZC4gSWYgbm90IHNwZWNpZmllZCxcbiAgICogdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uJ3MgYHRhZ2AgaXMgdXNlZCB0byBxdWVyeSB0aGUgZXhpc3RpbmcgRE9NIGZvciB0aGVcbiAgICogZWxlbWVudCB0byBib290c3RyYXAuXG4gICAqL1xuICBob3N0PzogUkVsZW1lbnR8c3RyaW5nO1xuXG4gIC8qKiBNb2R1bGUgaW5qZWN0b3IgZm9yIHRoZSBjb21wb25lbnQuIElmIHVuc3BlY2lmaWVkLCB0aGUgaW5qZWN0b3Igd2lsbCBiZSBOVUxMX0lOSkVDVE9SLiAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIGZlYXR1cmVzIHRvIGJlIGFwcGxpZWQgdG8gdGhlIGNyZWF0ZWQgY29tcG9uZW50LiBGZWF0dXJlcyBhcmUgc2ltcGx5XG4gICAqIGZ1bmN0aW9ucyB0aGF0IGRlY29yYXRlIGEgY29tcG9uZW50IHdpdGggYSBjZXJ0YWluIGJlaGF2aW9yLlxuICAgKlxuICAgKiBUeXBpY2FsbHksIHRoZSBmZWF0dXJlcyBpbiB0aGlzIGxpc3QgYXJlIGZlYXR1cmVzIHRoYXQgY2Fubm90IGJlIGFkZGVkIHRvIHRoZVxuICAgKiBvdGhlciBmZWF0dXJlcyBsaXN0IGluIHRoZSBjb21wb25lbnQgZGVmaW5pdGlvbiBiZWNhdXNlIHRoZXkgcmVseSBvbiBvdGhlciBmYWN0b3JzLlxuICAgKlxuICAgKiBFeGFtcGxlOiBgTGlmZWN5Y2xlSG9va3NGZWF0dXJlYCBpcyBhIGZ1bmN0aW9uIHRoYXQgYWRkcyBsaWZlY3ljbGUgaG9vayBjYXBhYmlsaXRpZXNcbiAgICogdG8gcm9vdCBjb21wb25lbnRzIGluIGEgdHJlZS1zaGFrYWJsZSB3YXkuIEl0IGNhbm5vdCBiZSBhZGRlZCB0byB0aGUgY29tcG9uZW50XG4gICAqIGZlYXR1cmVzIGxpc3QgYmVjYXVzZSB0aGVyZSdzIG5vIHdheSBvZiBrbm93aW5nIHdoZW4gdGhlIGNvbXBvbmVudCB3aWxsIGJlIHVzZWQgYXNcbiAgICogYSByb290IGNvbXBvbmVudC5cbiAgICovXG4gIGhvc3RGZWF0dXJlcz86IEhvc3RGZWF0dXJlW107XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gd2hpY2ggaXMgdXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvcmsgaW4gdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogV2hlbiBtYXJraW5nIGNvbXBvbmVudHMgYXMgZGlydHksIGl0IGlzIG5lY2Vzc2FyeSB0byBzY2hlZHVsZSB0aGUgd29yayBvZlxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFRoaXMgaXMgZG9uZSB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICAgKiB7QGxpbmsgbWFya0RpcnR5fSBjYWxscyBpbnRvIGEgc2luZ2xlIGNoYW5nZWQgZGV0ZWN0aW9uIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIG9mIHRoZSBzY2hlZHVsZXIgaXMgdGhlIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBJdCBpcyBhbHNvIHVzZWZ1bCB0byBvdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICAgKi9cbiAgc2NoZWR1bGVyPzogKHdvcms6ICgpID0+IHZvaWQpID0+IHZvaWQ7XG59XG5cbi8qKiBTZWUgQ3JlYXRlQ29tcG9uZW50T3B0aW9ucy5ob3N0RmVhdHVyZXMgKi9cbnR5cGUgSG9zdEZlYXR1cmUgPSAoPFQ+KGNvbXBvbmVudDogVCwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pID0+IHZvaWQpO1xuXG4vLyBUT0RPOiBBIGhhY2sgdG8gbm90IHB1bGwgaW4gdGhlIE51bGxJbmplY3RvciBmcm9tIEBhbmd1bGFyL2NvcmUuXG5leHBvcnQgY29uc3QgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3IgPSB7XG4gIGdldDogKHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpID0+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ051bGxJbmplY3RvcjogTm90IGZvdW5kOiAnICsgc3RyaW5naWZ5Rm9yRXJyb3IodG9rZW4pKTtcbiAgfVxufTtcblxuLyoqXG4gKiBCb290c3RyYXBzIGEgQ29tcG9uZW50IGludG8gYW4gZXhpc3RpbmcgaG9zdCBlbGVtZW50IGFuZCByZXR1cm5zIGFuIGluc3RhbmNlXG4gKiBvZiB0aGUgY29tcG9uZW50LlxuICpcbiAqIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIGJvb3RzdHJhcCBhIGNvbXBvbmVudCBpbnRvIHRoZSBET00gdHJlZS4gRWFjaCBpbnZvY2F0aW9uXG4gKiBvZiB0aGlzIGZ1bmN0aW9uIHdpbGwgY3JlYXRlIGEgc2VwYXJhdGUgdHJlZSBvZiBjb21wb25lbnRzLCBpbmplY3RvcnMgYW5kXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlcyBhbmQgbGlmZXRpbWVzLiBUbyBkeW5hbWljYWxseSBpbnNlcnQgYSBuZXcgY29tcG9uZW50XG4gKiBpbnRvIGFuIGV4aXN0aW5nIHRyZWUgc3VjaCB0aGF0IGl0IHNoYXJlcyB0aGUgc2FtZSBpbmplY3Rpb24sIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGFuZCBvYmplY3QgbGlmZXRpbWUsIHVzZSB7QGxpbmsgVmlld0NvbnRhaW5lciNjcmVhdGVDb21wb25lbnR9LlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRUeXBlIENvbXBvbmVudCB0byBib290c3RyYXBcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIHBhcmFtZXRlcnMgd2hpY2ggY29udHJvbCBib290c3RyYXBwaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnQ8VD4oXG4gICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZTxUPnxcbiAgICAgICAgVHlwZTxUPi8qIFR5cGUgYXMgd29ya2Fyb3VuZCBmb3I6IE1pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy80ODgxICovXG4gICAgLFxuICAgIG9wdHM6IENyZWF0ZUNvbXBvbmVudE9wdGlvbnMgPSB7fSk6IFQge1xuICBuZ0Rldk1vZGUgJiYgcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnRUeXBlKTtcblxuICAvLyB0aGlzIGlzIHByZWVtcHRpdmVseSBzZXQgdG8gYXZvaWQgaGF2aW5nIHRlc3QgYW5kIGRlYnVnIGNvZGUgYWNjaWRlbnRhbGx5XG4gIC8vIHJlYWQgZGF0YSBmcm9tIGEgcHJldmlvdXMgYXBwbGljYXRpb24gc3RhdGUuLi5cbiAgc2V0QWN0aXZlSG9zdEVsZW1lbnQobnVsbCk7XG5cbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gb3B0cy5yZW5kZXJlckZhY3RvcnkgfHwgZG9tUmVuZGVyZXJGYWN0b3J5MztcbiAgY29uc3Qgc2FuaXRpemVyID0gb3B0cy5zYW5pdGl6ZXIgfHwgbnVsbDtcbiAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmPFQ+KGNvbXBvbmVudFR5cGUpICE7XG4gIGlmIChjb21wb25lbnREZWYudHlwZSAhPSBjb21wb25lbnRUeXBlKSBjb21wb25lbnREZWYudHlwZSA9IGNvbXBvbmVudFR5cGU7XG5cbiAgLy8gVGhlIGZpcnN0IGluZGV4IG9mIHRoZSBmaXJzdCBzZWxlY3RvciBpcyB0aGUgdGFnIG5hbWUuXG4gIGNvbnN0IGNvbXBvbmVudFRhZyA9IGNvbXBvbmVudERlZi5zZWxlY3RvcnMgIVswXSAhWzBdIGFzIHN0cmluZztcbiAgY29uc3QgaG9zdFJOb2RlID0gbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCBvcHRzLmhvc3QgfHwgY29tcG9uZW50VGFnKTtcbiAgY29uc3Qgcm9vdEZsYWdzID0gY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLklzUm9vdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gY3JlYXRlUm9vdENvbnRleHQob3B0cy5zY2hlZHVsZXIsIG9wdHMucGxheWVySGFuZGxlcik7XG5cbiAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCBjb21wb25lbnREZWYpO1xuICBjb25zdCByb290VFZpZXcgPSBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIGNvbnN0IHJvb3RWaWV3OiBMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgbnVsbCwgcm9vdFRWaWV3LCByb290Q29udGV4dCwgcm9vdEZsYWdzLCBudWxsLCBudWxsLCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyLCB1bmRlZmluZWQsXG4gICAgICBvcHRzLmluamVjdG9yIHx8IG51bGwpO1xuXG4gIGNvbnN0IG9sZFZpZXcgPSBzZWxlY3RWaWV3KHJvb3RWaWV3LCBudWxsKTtcbiAgbGV0IGNvbXBvbmVudDogVDtcblxuICB0cnkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVSb290Q29tcG9uZW50VmlldyhcbiAgICAgICAgaG9zdFJOb2RlLCBjb21wb25lbnREZWYsIHJvb3RWaWV3LCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyLCBzYW5pdGl6ZXIpO1xuICAgIGNvbXBvbmVudCA9IGNyZWF0ZVJvb3RDb21wb25lbnQoXG4gICAgICAgIGNvbXBvbmVudFZpZXcsIGNvbXBvbmVudERlZiwgcm9vdFZpZXcsIHJvb3RDb250ZXh0LCBvcHRzLmhvc3RGZWF0dXJlcyB8fCBudWxsKTtcblxuICAgIC8vIGNyZWF0ZSBtb2RlIHBhc3NcbiAgICByZW5kZXJWaWV3KHJvb3RWaWV3LCByb290VFZpZXcsIG51bGwpO1xuICAgIC8vIHVwZGF0ZSBtb2RlIHBhc3NcbiAgICByZWZyZXNoVmlldyhyb290Vmlldywgcm9vdFRWaWV3LCBudWxsLCBudWxsKTtcblxuICB9IGZpbmFsbHkge1xuICAgIHNlbGVjdFZpZXcob2xkVmlldywgbnVsbCk7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcm9vdCBjb21wb25lbnQgdmlldyBhbmQgdGhlIHJvb3QgY29tcG9uZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSBwYXJlbnQgdmlldyB3aGVyZSB0aGUgaG9zdCBub2RlIGlzIHN0b3JlZFxuICogQHBhcmFtIHJlbmRlcmVyIFRoZSBjdXJyZW50IHJlbmRlcmVyXG4gKiBAcGFyYW0gc2FuaXRpemVyIFRoZSBzYW5pdGl6ZXIsIGlmIHByb3ZpZGVkXG4gKlxuICogQHJldHVybnMgQ29tcG9uZW50IHZpZXcgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgck5vZGU6IFJFbGVtZW50IHwgbnVsbCwgZGVmOiBDb21wb25lbnREZWY8YW55Piwgcm9vdFZpZXc6IExWaWV3LFxuICAgIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgcmVuZGVyZXI6IFJlbmRlcmVyMywgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3IHtcbiAgcmVzZXRDb21wb25lbnRTdGF0ZSgpO1xuICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHJvb3RWaWV3LCAwICsgSEVBREVSX09GRlNFVCk7XG4gIHJvb3RWaWV3WzAgKyBIRUFERVJfT0ZGU0VUXSA9IHJOb2RlO1xuICBjb25zdCB0Tm9kZTogVEVsZW1lbnROb2RlID0gZ2V0T3JDcmVhdGVUTm9kZSh0VmlldywgbnVsbCwgMCwgVE5vZGVUeXBlLkVsZW1lbnQsIG51bGwsIG51bGwpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICByb290VmlldywgZ2V0T3JDcmVhdGVUVmlldyhkZWYpLCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICByb290Vmlld1tIRUFERVJfT0ZGU0VUXSwgdE5vZGUsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsIHNhbml0aXplcik7XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZGlQdWJsaWNJbkluamVjdG9yKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0Tm9kZSwgcm9vdFZpZXcpLCB0VmlldywgZGVmLnR5cGUpO1xuICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlKTtcbiAgICBpbml0Tm9kZUZsYWdzKHROb2RlLCByb290Vmlldy5sZW5ndGgsIDEpO1xuICB9XG5cbiAgYWRkVG9WaWV3VHJlZShyb290VmlldywgY29tcG9uZW50Vmlldyk7XG5cbiAgLy8gU3RvcmUgY29tcG9uZW50IHZpZXcgYXQgbm9kZSBpbmRleCwgd2l0aCBub2RlIGFzIHRoZSBIT1NUXG4gIHJldHVybiByb290Vmlld1tIRUFERVJfT0ZGU0VUXSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJvb3QgY29tcG9uZW50IGFuZCBzZXRzIGl0IHVwIHdpdGggZmVhdHVyZXMgYW5kIGhvc3QgYmluZGluZ3MuIFNoYXJlZCBieVxuICogcmVuZGVyQ29tcG9uZW50KCkgYW5kIFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFZpZXc6IExWaWV3LCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPiwgcm9vdFZpZXc6IExWaWV3LCByb290Q29udGV4dDogUm9vdENvbnRleHQsXG4gICAgaG9zdEZlYXR1cmVzOiBIb3N0RmVhdHVyZVtdIHwgbnVsbCk6IGFueSB7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdFZpZXdbVFZJRVddO1xuICAvLyBDcmVhdGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggZmFjdG9yeSgpIGFuZCBzdG9yZSBhdCBuZXh0IGluZGV4IGluIHZpZXdEYXRhXG4gIGNvbnN0IGNvbXBvbmVudCA9IGluc3RhbnRpYXRlUm9vdENvbXBvbmVudCh0Vmlldywgcm9vdFZpZXcsIGNvbXBvbmVudERlZik7XG5cbiAgcm9vdENvbnRleHQuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBjb21wb25lbnQ7XG5cbiAgaG9zdEZlYXR1cmVzICYmIGhvc3RGZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlKSA9PiBmZWF0dXJlKGNvbXBvbmVudCwgY29tcG9uZW50RGVmKSk7XG5cbiAgLy8gV2Ugd2FudCB0byBnZW5lcmF0ZSBhbiBlbXB0eSBRdWVyeUxpc3QgZm9yIHJvb3QgY29udGVudCBxdWVyaWVzIGZvciBiYWNrd2FyZHNcbiAgLy8gY29tcGF0aWJpbGl0eSB3aXRoIFZpZXdFbmdpbmUuXG4gIGlmIChjb21wb25lbnREZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICBjb21wb25lbnREZWYuY29udGVudFF1ZXJpZXMoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb21wb25lbnQsIHJvb3RWaWV3Lmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiBjb21wb25lbnREZWYuaG9zdEJpbmRpbmdzKSB7XG4gICAgY29uc3QgZWxlbWVudEluZGV4ID0gcm9vdFROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChlbGVtZW50SW5kZXgpO1xuXG4gICAgY29uc3QgZXhwYW5kbyA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgITtcbiAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShcbiAgICAgICAgY29tcG9uZW50RGVmLCBleHBhbmRvLCBjb21wb25lbnQsIHJvb3RUTm9kZSwgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpO1xuXG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQobnVsbCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29udGV4dChcbiAgICBzY2hlZHVsZXI/OiAod29ya0ZuOiAoKSA9PiB2b2lkKSA9PiB2b2lkLCBwbGF5ZXJIYW5kbGVyPzogUGxheWVySGFuZGxlcnxudWxsKTogUm9vdENvbnRleHQge1xuICByZXR1cm4ge1xuICAgIGNvbXBvbmVudHM6IFtdLFxuICAgIHNjaGVkdWxlcjogc2NoZWR1bGVyIHx8IGRlZmF1bHRTY2hlZHVsZXIsXG4gICAgY2xlYW46IENMRUFOX1BST01JU0UsXG4gICAgcGxheWVySGFuZGxlcjogcGxheWVySGFuZGxlciB8fCBudWxsLFxuICAgIGZsYWdzOiBSb290Q29udGV4dEZsYWdzLkVtcHR5XG4gIH07XG59XG5cbi8qKlxuICogVXNlZCB0byBlbmFibGUgbGlmZWN5Y2xlIGhvb2tzIG9uIHRoZSByb290IGNvbXBvbmVudC5cbiAqXG4gKiBJbmNsdWRlIHRoaXMgZmVhdHVyZSB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgaWYgdGhlIHJvb3QgY29tcG9uZW50XG4gKiB5b3UgYXJlIHJlbmRlcmluZyBoYXMgbGlmZWN5Y2xlIGhvb2tzIGRlZmluZWQuIE90aGVyd2lzZSwgdGhlIGhvb2tzIHdvbid0XG4gKiBiZSBjYWxsZWQgcHJvcGVybHkuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIHJlbmRlckNvbXBvbmVudChBcHBDb21wb25lbnQsIHtmZWF0dXJlczogW1Jvb3RMaWZlY3ljbGVIb29rc119KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKGNvbXBvbmVudDogYW55LCBkZWY6IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGNvbnN0IHJvb3RUVmlldyA9IHJlYWRQYXRjaGVkTFZpZXcoY29tcG9uZW50KSAhW1RWSUVXXTtcbiAgY29uc3QgZGlySW5kZXggPSByb290VFZpZXcuZGF0YS5sZW5ndGggLSAxO1xuXG4gIHJlZ2lzdGVyUHJlT3JkZXJIb29rcyhkaXJJbmRleCwgZGVmLCByb290VFZpZXcsIC0xLCAtMSwgLTEpO1xuICAvLyBUT0RPKG1pc2tvKTogcmVwbGFjZSBgYXMgVE5vZGVgIHdpdGggY3JlYXRlVE5vZGUgY2FsbC4gKG5lZWRzIHJlZmFjdG9yaW5nIHRvIGxvc2UgZGVwIG9uXG4gIC8vIExOb2RlKS5cbiAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyhcbiAgICAgIHJvb3RUVmlldywgeyBkaXJlY3RpdmVTdGFydDogZGlySW5kZXgsIGRpcmVjdGl2ZUVuZDogZGlySW5kZXggKyAxIH0gYXMgVE5vZGUpO1xufVxuXG4vKipcbiAqIFdhaXQgb24gY29tcG9uZW50IHVudGlsIGl0IGlzIHJlbmRlcmVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBhIGBQcm9taXNlYCB3aGljaCBpcyByZXNvbHZlZCB3aGVuIHRoZSBjb21wb25lbnQnc1xuICogY2hhbmdlIGRldGVjdGlvbiBpcyBleGVjdXRlZC4gVGhpcyBpcyBkZXRlcm1pbmVkIGJ5IGZpbmRpbmcgdGhlIHNjaGVkdWxlclxuICogYXNzb2NpYXRlZCB3aXRoIHRoZSBgY29tcG9uZW50YCdzIHJlbmRlciB0cmVlIGFuZCB3YWl0aW5nIHVudGlsIHRoZSBzY2hlZHVsZXJcbiAqIGZsdXNoZXMuIElmIG5vdGhpbmcgaXMgc2NoZWR1bGVkLCB0aGUgZnVuY3Rpb24gcmV0dXJucyBhIHJlc29sdmVkIHByb21pc2UuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogYXdhaXQgd2hlblJlbmRlcmVkKG15Q29tcG9uZW50KTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IHRvIHdhaXQgdXBvblxuICogQHJldHVybnMgUHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIHRoZSBjb21wb25lbnQgaXMgcmVuZGVyZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aGVuUmVuZGVyZWQoY29tcG9uZW50OiBhbnkpOiBQcm9taXNlPG51bGw+IHtcbiAgcmV0dXJuIGdldFJvb3RDb250ZXh0KGNvbXBvbmVudCkuY2xlYW47XG59XG4iXX0=