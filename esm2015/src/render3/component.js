/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/component.ts
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
import { registerPostOrderHooks } from './hooks';
import { CLEAN_PROMISE, addHostBindingsToExpandoInstructions, addToViewTree, createLView, createTView, getOrCreateTComponentView, getOrCreateTNode, growHostVarsSpace, initTNodeFlags, instantiateRootComponent, invokeHostBindingsInCreationMode, locateHostElement, markAsComponentHost, refreshView, renderView } from './instructions/shared';
import { domRendererFactory3 } from './interfaces/renderer';
import { CONTEXT, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { writeDirectClass, writeDirectStyle } from './node_manipulation';
import { enterView, getPreviousOrParentTNode, leaveView, setSelectedIndex } from './state';
import { computeStaticStyling } from './styling/static_styling';
import { setUpAttributes } from './util/attrs_utils';
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
    /** @type {?} */
    const rendererFactory = opts.rendererFactory || domRendererFactory3;
    /** @type {?} */
    const sanitizer = opts.sanitizer || null;
    /** @type {?} */
    const componentDef = (/** @type {?} */ (getComponentDef(componentType)));
    if (componentDef.type != componentType)
        ((/** @type {?} */ (componentDef))).type = componentType;
    // The first index of the first selector is the tag name.
    /** @type {?} */
    const componentTag = (/** @type {?} */ ((/** @type {?} */ ((/** @type {?} */ (componentDef.selectors))[0]))[0]));
    /** @type {?} */
    const hostRenderer = rendererFactory.createRenderer(null, null);
    /** @type {?} */
    const hostRNode = locateHostElement(hostRenderer, opts.host || componentTag, componentDef.encapsulation);
    /** @type {?} */
    const rootFlags = componentDef.onPush ? 64 /* Dirty */ | 512 /* IsRoot */ :
        16 /* CheckAlways */ | 512 /* IsRoot */;
    /** @type {?} */
    const rootContext = createRootContext(opts.scheduler, opts.playerHandler);
    /** @type {?} */
    const renderer = rendererFactory.createRenderer(hostRNode, componentDef);
    /** @type {?} */
    const rootTView = createTView(0 /* Root */, -1, null, 1, 0, null, null, null, null, null);
    /** @type {?} */
    const rootView = createLView(null, rootTView, rootContext, rootFlags, null, null, rendererFactory, renderer, undefined, opts.injector || null);
    enterView(rootView, null);
    /** @type {?} */
    let component;
    try {
        if (rendererFactory.begin)
            rendererFactory.begin();
        /** @type {?} */
        const componentView = createRootComponentView(hostRNode, componentDef, rootView, rendererFactory, renderer, sanitizer);
        component = createRootComponent(componentView, componentDef, rootView, rootContext, opts.hostFeatures || null);
        // create mode pass
        renderView(rootTView, rootView, null);
        // update mode pass
        refreshView(rootTView, rootView, null, null);
    }
    finally {
        leaveView();
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
 * @param {?} hostRenderer The current renderer
 * @param {?=} sanitizer The sanitizer, if provided
 *
 * @return {?} Component view created
 */
export function createRootComponentView(rNode, def, rootView, rendererFactory, hostRenderer, sanitizer) {
    /** @type {?} */
    const tView = rootView[TVIEW];
    ngDevMode && assertDataInRange(rootView, 0 + HEADER_OFFSET);
    rootView[0 + HEADER_OFFSET] = rNode;
    /** @type {?} */
    const tNode = getOrCreateTNode(tView, null, 0, 3 /* Element */, null, null);
    /** @type {?} */
    const mergedAttrs = tNode.mergedAttrs = def.hostAttrs;
    if (mergedAttrs !== null) {
        computeStaticStyling(tNode, mergedAttrs);
        if (rNode !== null) {
            setUpAttributes(hostRenderer, rNode, mergedAttrs);
            if (tNode.classes !== null) {
                writeDirectClass(hostRenderer, rNode, tNode.classes);
            }
            if (tNode.styles !== null) {
                writeDirectStyle(hostRenderer, rNode, tNode.styles);
            }
        }
    }
    /** @type {?} */
    const viewRenderer = rendererFactory.createRenderer(rNode, def);
    /** @type {?} */
    const componentView = createLView(rootView, getOrCreateTComponentView(def), null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, rootView[HEADER_OFFSET], tNode, rendererFactory, viewRenderer, sanitizer);
    if (tView.firstCreatePass) {
        diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, rootView), tView, def.type);
        markAsComponentHost(tView, tNode);
        initTNodeFlags(tNode, rootView.length, 1);
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
 * @param {?} rootLView
 * @param {?} rootContext
 * @param {?} hostFeatures
 * @return {?}
 */
export function createRootComponent(componentView, componentDef, rootLView, rootContext, hostFeatures) {
    /** @type {?} */
    const tView = rootLView[TVIEW];
    // Create directive instance with factory() and store at next index in viewData
    /** @type {?} */
    const component = instantiateRootComponent(tView, rootLView, componentDef);
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
        componentDef.contentQueries(1 /* Create */, component, rootLView.length - 1);
    }
    /** @type {?} */
    const rootTNode = getPreviousOrParentTNode();
    if (tView.firstCreatePass &&
        (componentDef.hostBindings !== null || componentDef.hostAttrs !== null)) {
        /** @type {?} */
        const elementIndex = rootTNode.index - HEADER_OFFSET;
        setSelectedIndex(elementIndex);
        /** @type {?} */
        const rootTView = rootLView[TVIEW];
        addHostBindingsToExpandoInstructions(rootTView, componentDef);
        growHostVarsSpace(rootTView, rootLView, componentDef.hostVars);
        invokeHostBindingsInCreationMode(componentDef, component);
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
 * renderComponent(AppComponent, {hostFeatures: [LifecycleHooksFeature]});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBYUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMvQyxPQUFPLEVBQUMsYUFBYSxFQUFFLG9DQUFvQyxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSx3QkFBd0IsRUFBRSxnQ0FBZ0MsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFJaFYsT0FBTyxFQUF3QyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pHLE9BQU8sRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFvRCxLQUFLLEVBQVksTUFBTSxtQkFBbUIsQ0FBQztBQUM3SCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN2RSxPQUFPLEVBQUMsU0FBUyxFQUFFLHdCQUF3QixFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN6RixPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1B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QUNuQixDQUFDOzs7Ozs7QUFHRCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLFNBQXdDLEVBQUUsYUFBa0M7SUFDOUUsT0FBTztRQUNMLFVBQVUsRUFBRSxFQUFFO1FBQ2QsU0FBUyxFQUFFLFNBQVMsSUFBSSxnQkFBZ0I7UUFDeEMsS0FBSyxFQUFFLGFBQWE7UUFDcEIsYUFBYSxFQUFFLGFBQWEsSUFBSSxJQUFJO1FBQ3BDLEtBQUssZUFBd0I7S0FDOUIsQ0FBQztBQUNKLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLFNBQWMsRUFBRSxHQUFzQjs7VUFDcEUsU0FBUyxHQUFHLG1CQUFBLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDOztVQUNoRCxRQUFRLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztJQUUxQywyRkFBMkY7SUFDM0YsVUFBVTtJQUNWLHNCQUFzQixDQUNsQixTQUFTLEVBQUUsbUJBQUEsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLEdBQUcsQ0FBQyxFQUFFLEVBQVMsQ0FBQyxDQUFDO0FBQ3BGLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JELE1BQU0sVUFBVSxZQUFZLENBQUMsU0FBYztJQUN6QyxPQUFPLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZSBmcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vY29yZSc7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGV9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtDTEVBTl9QUk9NSVNFLCBhZGRIb3N0QmluZGluZ3NUb0V4cGFuZG9JbnN0cnVjdGlvbnMsIGFkZFRvVmlld1RyZWUsIGNyZWF0ZUxWaWV3LCBjcmVhdGVUVmlldywgZ2V0T3JDcmVhdGVUQ29tcG9uZW50VmlldywgZ2V0T3JDcmVhdGVUTm9kZSwgZ3Jvd0hvc3RWYXJzU3BhY2UsIGluaXRUTm9kZUZsYWdzLCBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQsIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlLCBsb2NhdGVIb3N0RWxlbWVudCwgbWFya0FzQ29tcG9uZW50SG9zdCwgcmVmcmVzaFZpZXcsIHJlbmRlclZpZXd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VHlwZSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXllckhhbmRsZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBkb21SZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDT05URVhULCBIRUFERVJfT0ZGU0VULCBMVmlldywgTFZpZXdGbGFncywgUm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MsIFRWSUVXLCBUVmlld1R5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7d3JpdGVEaXJlY3RDbGFzcywgd3JpdGVEaXJlY3RTdHlsZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2VudGVyVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBsZWF2ZVZpZXcsIHNldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtjb21wdXRlU3RhdGljU3R5bGluZ30gZnJvbSAnLi9zdHlsaW5nL3N0YXRpY19zdHlsaW5nJztcbmltcG9ydCB7c2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzfSBmcm9tICcuL3V0aWwvZ2xvYmFsX3V0aWxzJztcbmltcG9ydCB7ZGVmYXVsdFNjaGVkdWxlciwgc3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Um9vdENvbnRleHR9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge3JlYWRQYXRjaGVkTFZpZXd9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5cbi8qKiBPcHRpb25zIHRoYXQgY29udHJvbCBob3cgdGhlIGNvbXBvbmVudCBzaG91bGQgYmUgYm9vdHN0cmFwcGVkLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVDb21wb25lbnRPcHRpb25zIHtcbiAgLyoqIFdoaWNoIHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlLiAqL1xuICByZW5kZXJlckZhY3Rvcnk/OiBSZW5kZXJlckZhY3RvcnkzO1xuXG4gIC8qKiBBIGN1c3RvbSBzYW5pdGl6ZXIgaW5zdGFuY2UgKi9cbiAgc2FuaXRpemVyPzogU2FuaXRpemVyO1xuXG4gIC8qKiBBIGN1c3RvbSBhbmltYXRpb24gcGxheWVyIGhhbmRsZXIgKi9cbiAgcGxheWVySGFuZGxlcj86IFBsYXllckhhbmRsZXI7XG5cbiAgLyoqXG4gICAqIEhvc3QgZWxlbWVudCBvbiB3aGljaCB0aGUgY29tcG9uZW50IHdpbGwgYmUgYm9vdHN0cmFwcGVkLiBJZiBub3Qgc3BlY2lmaWVkLFxuICAgKiB0aGUgY29tcG9uZW50IGRlZmluaXRpb24ncyBgdGFnYCBpcyB1c2VkIHRvIHF1ZXJ5IHRoZSBleGlzdGluZyBET00gZm9yIHRoZVxuICAgKiBlbGVtZW50IHRvIGJvb3RzdHJhcC5cbiAgICovXG4gIGhvc3Q/OiBSRWxlbWVudHxzdHJpbmc7XG5cbiAgLyoqIE1vZHVsZSBpbmplY3RvciBmb3IgdGhlIGNvbXBvbmVudC4gSWYgdW5zcGVjaWZpZWQsIHRoZSBpbmplY3RvciB3aWxsIGJlIE5VTExfSU5KRUNUT1IuICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgZmVhdHVyZXMgdG8gYmUgYXBwbGllZCB0byB0aGUgY3JlYXRlZCBjb21wb25lbnQuIEZlYXR1cmVzIGFyZSBzaW1wbHlcbiAgICogZnVuY3Rpb25zIHRoYXQgZGVjb3JhdGUgYSBjb21wb25lbnQgd2l0aCBhIGNlcnRhaW4gYmVoYXZpb3IuXG4gICAqXG4gICAqIFR5cGljYWxseSwgdGhlIGZlYXR1cmVzIGluIHRoaXMgbGlzdCBhcmUgZmVhdHVyZXMgdGhhdCBjYW5ub3QgYmUgYWRkZWQgdG8gdGhlXG4gICAqIG90aGVyIGZlYXR1cmVzIGxpc3QgaW4gdGhlIGNvbXBvbmVudCBkZWZpbml0aW9uIGJlY2F1c2UgdGhleSByZWx5IG9uIG90aGVyIGZhY3RvcnMuXG4gICAqXG4gICAqIEV4YW1wbGU6IGBMaWZlY3ljbGVIb29rc0ZlYXR1cmVgIGlzIGEgZnVuY3Rpb24gdGhhdCBhZGRzIGxpZmVjeWNsZSBob29rIGNhcGFiaWxpdGllc1xuICAgKiB0byByb290IGNvbXBvbmVudHMgaW4gYSB0cmVlLXNoYWthYmxlIHdheS4gSXQgY2Fubm90IGJlIGFkZGVkIHRvIHRoZSBjb21wb25lbnRcbiAgICogZmVhdHVyZXMgbGlzdCBiZWNhdXNlIHRoZXJlJ3Mgbm8gd2F5IG9mIGtub3dpbmcgd2hlbiB0aGUgY29tcG9uZW50IHdpbGwgYmUgdXNlZCBhc1xuICAgKiBhIHJvb3QgY29tcG9uZW50LlxuICAgKi9cbiAgaG9zdEZlYXR1cmVzPzogSG9zdEZlYXR1cmVbXTtcblxuICAvKipcbiAgICogQSBmdW5jdGlvbiB3aGljaCBpcyB1c2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gd29yayBpbiB0aGUgZnV0dXJlLlxuICAgKlxuICAgKiBXaGVuIG1hcmtpbmcgY29tcG9uZW50cyBhcyBkaXJ0eSwgaXQgaXMgbmVjZXNzYXJ5IHRvIHNjaGVkdWxlIHRoZSB3b3JrIG9mXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGZ1dHVyZS4gVGhpcyBpcyBkb25lIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gICAqIHtAbGluayBtYXJrRGlydHl9IGNhbGxzIGludG8gYSBzaW5nbGUgY2hhbmdlZCBkZXRlY3Rpb24gcHJvY2Vzc2luZy5cbiAgICpcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgb2YgdGhlIHNjaGVkdWxlciBpcyB0aGUgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgZnVuY3Rpb24uXG4gICAqXG4gICAqIEl0IGlzIGFsc28gdXNlZnVsIHRvIG92ZXJyaWRlIHRoaXMgZnVuY3Rpb24gZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gICAqL1xuICBzY2hlZHVsZXI/OiAod29yazogKCkgPT4gdm9pZCkgPT4gdm9pZDtcbn1cblxuLyoqIFNlZSBDcmVhdGVDb21wb25lbnRPcHRpb25zLmhvc3RGZWF0dXJlcyAqL1xudHlwZSBIb3N0RmVhdHVyZSA9ICg8VD4oY29tcG9uZW50OiBULCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPikgPT4gdm9pZCk7XG5cbi8vIFRPRE86IEEgaGFjayB0byBub3QgcHVsbCBpbiB0aGUgTnVsbEluamVjdG9yIGZyb20gQGFuZ3VsYXIvY29yZS5cbmV4cG9ydCBjb25zdCBOVUxMX0lOSkVDVE9SOiBJbmplY3RvciA9IHtcbiAgZ2V0OiAodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSkgPT4ge1xuICAgIHRocm93IG5ldyBFcnJvcignTnVsbEluamVjdG9yOiBOb3QgZm91bmQ6ICcgKyBzdHJpbmdpZnlGb3JFcnJvcih0b2tlbikpO1xuICB9XG59O1xuXG4vKipcbiAqIEJvb3RzdHJhcHMgYSBDb21wb25lbnQgaW50byBhbiBleGlzdGluZyBob3N0IGVsZW1lbnQgYW5kIHJldHVybnMgYW4gaW5zdGFuY2VcbiAqIG9mIHRoZSBjb21wb25lbnQuXG4gKlxuICogVXNlIHRoaXMgZnVuY3Rpb24gdG8gYm9vdHN0cmFwIGEgY29tcG9uZW50IGludG8gdGhlIERPTSB0cmVlLiBFYWNoIGludm9jYXRpb25cbiAqIG9mIHRoaXMgZnVuY3Rpb24gd2lsbCBjcmVhdGUgYSBzZXBhcmF0ZSB0cmVlIG9mIGNvbXBvbmVudHMsIGluamVjdG9ycyBhbmRcbiAqIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGVzIGFuZCBsaWZldGltZXMuIFRvIGR5bmFtaWNhbGx5IGluc2VydCBhIG5ldyBjb21wb25lbnRcbiAqIGludG8gYW4gZXhpc3RpbmcgdHJlZSBzdWNoIHRoYXQgaXQgc2hhcmVzIHRoZSBzYW1lIGluamVjdGlvbiwgY2hhbmdlIGRldGVjdGlvblxuICogYW5kIG9iamVjdCBsaWZldGltZSwgdXNlIHtAbGluayBWaWV3Q29udGFpbmVyI2NyZWF0ZUNvbXBvbmVudH0uXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFR5cGUgQ29tcG9uZW50IHRvIGJvb3RzdHJhcFxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgcGFyYW1ldGVycyB3aGljaCBjb250cm9sIGJvb3RzdHJhcHBpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudDxUPihcbiAgICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlPFQ+fFxuICAgICAgICBUeXBlPFQ+LyogVHlwZSBhcyB3b3JrYXJvdW5kIGZvcjogTWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzQ4ODEgKi9cbiAgICAsXG4gICAgb3B0czogQ3JlYXRlQ29tcG9uZW50T3B0aW9ucyA9IHt9KTogVCB7XG4gIG5nRGV2TW9kZSAmJiBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnRUeXBlKGNvbXBvbmVudFR5cGUpO1xuXG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IG9wdHMucmVuZGVyZXJGYWN0b3J5IHx8IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gIGNvbnN0IHNhbml0aXplciA9IG9wdHMuc2FuaXRpemVyIHx8IG51bGw7XG4gIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZjxUPihjb21wb25lbnRUeXBlKSAhO1xuICBpZiAoY29tcG9uZW50RGVmLnR5cGUgIT0gY29tcG9uZW50VHlwZSkgKGNvbXBvbmVudERlZiBhc3t0eXBlOiBUeXBlPGFueT59KS50eXBlID0gY29tcG9uZW50VHlwZTtcblxuICAvLyBUaGUgZmlyc3QgaW5kZXggb2YgdGhlIGZpcnN0IHNlbGVjdG9yIGlzIHRoZSB0YWcgbmFtZS5cbiAgY29uc3QgY29tcG9uZW50VGFnID0gY29tcG9uZW50RGVmLnNlbGVjdG9ycyAhWzBdICFbMF0gYXMgc3RyaW5nO1xuICBjb25zdCBob3N0UmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIGNvbnN0IGhvc3RSTm9kZSA9XG4gICAgICBsb2NhdGVIb3N0RWxlbWVudChob3N0UmVuZGVyZXIsIG9wdHMuaG9zdCB8fCBjb21wb25lbnRUYWcsIGNvbXBvbmVudERlZi5lbmNhcHN1bGF0aW9uKTtcbiAgY29uc3Qgcm9vdEZsYWdzID0gY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLklzUm9vdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gY3JlYXRlUm9vdENvbnRleHQob3B0cy5zY2hlZHVsZXIsIG9wdHMucGxheWVySGFuZGxlcik7XG5cbiAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCBjb21wb25lbnREZWYpO1xuICBjb25zdCByb290VFZpZXcgPSBjcmVhdGVUVmlldyhUVmlld1R5cGUuUm9vdCwgLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICBjb25zdCByb290VmlldzogTFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgIG51bGwsIHJvb3RUVmlldywgcm9vdENvbnRleHQsIHJvb3RGbGFncywgbnVsbCwgbnVsbCwgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlciwgdW5kZWZpbmVkLFxuICAgICAgb3B0cy5pbmplY3RvciB8fCBudWxsKTtcblxuICBlbnRlclZpZXcocm9vdFZpZXcsIG51bGwpO1xuICBsZXQgY29tcG9uZW50OiBUO1xuXG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgICAgICBob3N0Uk5vZGUsIGNvbXBvbmVudERlZiwgcm9vdFZpZXcsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsIHNhbml0aXplcik7XG4gICAgY29tcG9uZW50ID0gY3JlYXRlUm9vdENvbXBvbmVudChcbiAgICAgICAgY29tcG9uZW50VmlldywgY29tcG9uZW50RGVmLCByb290Vmlldywgcm9vdENvbnRleHQsIG9wdHMuaG9zdEZlYXR1cmVzIHx8IG51bGwpO1xuXG4gICAgLy8gY3JlYXRlIG1vZGUgcGFzc1xuICAgIHJlbmRlclZpZXcocm9vdFRWaWV3LCByb290VmlldywgbnVsbCk7XG4gICAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICAgIHJlZnJlc2hWaWV3KHJvb3RUVmlldywgcm9vdFZpZXcsIG51bGwsIG51bGwpO1xuXG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KCk7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcm9vdCBjb21wb25lbnQgdmlldyBhbmQgdGhlIHJvb3QgY29tcG9uZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSBwYXJlbnQgdmlldyB3aGVyZSB0aGUgaG9zdCBub2RlIGlzIHN0b3JlZFxuICogQHBhcmFtIGhvc3RSZW5kZXJlciBUaGUgY3VycmVudCByZW5kZXJlclxuICogQHBhcmFtIHNhbml0aXplciBUaGUgc2FuaXRpemVyLCBpZiBwcm92aWRlZFxuICpcbiAqIEByZXR1cm5zIENvbXBvbmVudCB2aWV3IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgIHJOb2RlOiBSRWxlbWVudCB8IG51bGwsIGRlZjogQ29tcG9uZW50RGVmPGFueT4sIHJvb3RWaWV3OiBMVmlldyxcbiAgICByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uocm9vdFZpZXcsIDAgKyBIRUFERVJfT0ZGU0VUKTtcbiAgcm9vdFZpZXdbMCArIEhFQURFUl9PRkZTRVRdID0gck5vZGU7XG4gIGNvbnN0IHROb2RlOiBURWxlbWVudE5vZGUgPSBnZXRPckNyZWF0ZVROb2RlKHRWaWV3LCBudWxsLCAwLCBUTm9kZVR5cGUuRWxlbWVudCwgbnVsbCwgbnVsbCk7XG4gIGNvbnN0IG1lcmdlZEF0dHJzID0gdE5vZGUubWVyZ2VkQXR0cnMgPSBkZWYuaG9zdEF0dHJzO1xuICBpZiAobWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBjb21wdXRlU3RhdGljU3R5bGluZyh0Tm9kZSwgbWVyZ2VkQXR0cnMpO1xuICAgIGlmIChyTm9kZSAhPT0gbnVsbCkge1xuICAgICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgck5vZGUsIG1lcmdlZEF0dHJzKTtcbiAgICAgIGlmICh0Tm9kZS5jbGFzc2VzICE9PSBudWxsKSB7XG4gICAgICAgIHdyaXRlRGlyZWN0Q2xhc3MoaG9zdFJlbmRlcmVyLCByTm9kZSwgdE5vZGUuY2xhc3Nlcyk7XG4gICAgICB9XG4gICAgICBpZiAodE5vZGUuc3R5bGVzICE9PSBudWxsKSB7XG4gICAgICAgIHdyaXRlRGlyZWN0U3R5bGUoaG9zdFJlbmRlcmVyLCByTm9kZSwgdE5vZGUuc3R5bGVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCB2aWV3UmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIock5vZGUsIGRlZik7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgIHJvb3RWaWV3LCBnZXRPckNyZWF0ZVRDb21wb25lbnRWaWV3KGRlZiksIG51bGwsXG4gICAgICBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHJvb3RWaWV3W0hFQURFUl9PRkZTRVRdLCB0Tm9kZSxcbiAgICAgIHJlbmRlcmVyRmFjdG9yeSwgdmlld1JlbmRlcmVyLCBzYW5pdGl6ZXIpO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCByb290VmlldyksIHRWaWV3LCBkZWYudHlwZSk7XG4gICAgbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldywgdE5vZGUpO1xuICAgIGluaXRUTm9kZUZsYWdzKHROb2RlLCByb290Vmlldy5sZW5ndGgsIDEpO1xuICB9XG5cbiAgYWRkVG9WaWV3VHJlZShyb290VmlldywgY29tcG9uZW50Vmlldyk7XG5cbiAgLy8gU3RvcmUgY29tcG9uZW50IHZpZXcgYXQgbm9kZSBpbmRleCwgd2l0aCBub2RlIGFzIHRoZSBIT1NUXG4gIHJldHVybiByb290Vmlld1tIRUFERVJfT0ZGU0VUXSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJvb3QgY29tcG9uZW50IGFuZCBzZXRzIGl0IHVwIHdpdGggZmVhdHVyZXMgYW5kIGhvc3QgYmluZGluZ3MuIFNoYXJlZCBieVxuICogcmVuZGVyQ29tcG9uZW50KCkgYW5kIFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFZpZXc6IExWaWV3LCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPiwgcm9vdExWaWV3OiBMVmlldywgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LFxuICAgIGhvc3RGZWF0dXJlczogSG9zdEZlYXR1cmVbXSB8IG51bGwpOiBhbnkge1xuICBjb25zdCB0VmlldyA9IHJvb3RMVmlld1tUVklFV107XG4gIC8vIENyZWF0ZSBkaXJlY3RpdmUgaW5zdGFuY2Ugd2l0aCBmYWN0b3J5KCkgYW5kIHN0b3JlIGF0IG5leHQgaW5kZXggaW4gdmlld0RhdGFcbiAgY29uc3QgY29tcG9uZW50ID0gaW5zdGFudGlhdGVSb290Q29tcG9uZW50KHRWaWV3LCByb290TFZpZXcsIGNvbXBvbmVudERlZik7XG5cbiAgcm9vdENvbnRleHQuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBjb21wb25lbnQ7XG5cbiAgaG9zdEZlYXR1cmVzICYmIGhvc3RGZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlKSA9PiBmZWF0dXJlKGNvbXBvbmVudCwgY29tcG9uZW50RGVmKSk7XG5cbiAgLy8gV2Ugd2FudCB0byBnZW5lcmF0ZSBhbiBlbXB0eSBRdWVyeUxpc3QgZm9yIHJvb3QgY29udGVudCBxdWVyaWVzIGZvciBiYWNrd2FyZHNcbiAgLy8gY29tcGF0aWJpbGl0eSB3aXRoIFZpZXdFbmdpbmUuXG4gIGlmIChjb21wb25lbnREZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICBjb21wb25lbnREZWYuY29udGVudFF1ZXJpZXMoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb21wb25lbnQsIHJvb3RMVmlldy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmXG4gICAgICAoY29tcG9uZW50RGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBjb21wb25lbnREZWYuaG9zdEF0dHJzICE9PSBudWxsKSkge1xuICAgIGNvbnN0IGVsZW1lbnRJbmRleCA9IHJvb3RUTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gICAgc2V0U2VsZWN0ZWRJbmRleChlbGVtZW50SW5kZXgpO1xuXG4gICAgY29uc3Qgcm9vdFRWaWV3ID0gcm9vdExWaWV3W1RWSUVXXTtcbiAgICBhZGRIb3N0QmluZGluZ3NUb0V4cGFuZG9JbnN0cnVjdGlvbnMocm9vdFRWaWV3LCBjb21wb25lbnREZWYpO1xuICAgIGdyb3dIb3N0VmFyc1NwYWNlKHJvb3RUVmlldywgcm9vdExWaWV3LCBjb21wb25lbnREZWYuaG9zdFZhcnMpO1xuXG4gICAgaW52b2tlSG9zdEJpbmRpbmdzSW5DcmVhdGlvbk1vZGUoY29tcG9uZW50RGVmLCBjb21wb25lbnQpO1xuICB9XG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb250ZXh0KFxuICAgIHNjaGVkdWxlcj86ICh3b3JrRm46ICgpID0+IHZvaWQpID0+IHZvaWQsIHBsYXllckhhbmRsZXI/OiBQbGF5ZXJIYW5kbGVyfG51bGwpOiBSb290Q29udGV4dCB7XG4gIHJldHVybiB7XG4gICAgY29tcG9uZW50czogW10sXG4gICAgc2NoZWR1bGVyOiBzY2hlZHVsZXIgfHwgZGVmYXVsdFNjaGVkdWxlcixcbiAgICBjbGVhbjogQ0xFQU5fUFJPTUlTRSxcbiAgICBwbGF5ZXJIYW5kbGVyOiBwbGF5ZXJIYW5kbGVyIHx8IG51bGwsXG4gICAgZmxhZ3M6IFJvb3RDb250ZXh0RmxhZ3MuRW1wdHlcbiAgfTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGVuYWJsZSBsaWZlY3ljbGUgaG9va3Mgb24gdGhlIHJvb3QgY29tcG9uZW50LlxuICpcbiAqIEluY2x1ZGUgdGhpcyBmZWF0dXJlIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBpZiB0aGUgcm9vdCBjb21wb25lbnRcbiAqIHlvdSBhcmUgcmVuZGVyaW5nIGhhcyBsaWZlY3ljbGUgaG9va3MgZGVmaW5lZC4gT3RoZXJ3aXNlLCB0aGUgaG9va3Mgd29uJ3RcbiAqIGJlIGNhbGxlZCBwcm9wZXJseS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogcmVuZGVyQ29tcG9uZW50KEFwcENvbXBvbmVudCwge2hvc3RGZWF0dXJlczogW0xpZmVjeWNsZUhvb2tzRmVhdHVyZV19KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKGNvbXBvbmVudDogYW55LCBkZWY6IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIGNvbnN0IHJvb3RUVmlldyA9IHJlYWRQYXRjaGVkTFZpZXcoY29tcG9uZW50KSAhW1RWSUVXXTtcbiAgY29uc3QgZGlySW5kZXggPSByb290VFZpZXcuZGF0YS5sZW5ndGggLSAxO1xuXG4gIC8vIFRPRE8obWlza28pOiByZXBsYWNlIGBhcyBUTm9kZWAgd2l0aCBjcmVhdGVUTm9kZSBjYWxsLiAobmVlZHMgcmVmYWN0b3JpbmcgdG8gbG9zZSBkZXAgb25cbiAgLy8gTE5vZGUpLlxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKFxuICAgICAgcm9vdFRWaWV3LCB7IGRpcmVjdGl2ZVN0YXJ0OiBkaXJJbmRleCwgZGlyZWN0aXZlRW5kOiBkaXJJbmRleCArIDEgfSBhcyBUTm9kZSk7XG59XG5cbi8qKlxuICogV2FpdCBvbiBjb21wb25lbnQgdW50aWwgaXQgaXMgcmVuZGVyZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgYFByb21pc2VgIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gdGhlIGNvbXBvbmVudCdzXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uIGlzIGV4ZWN1dGVkLiBUaGlzIGlzIGRldGVybWluZWQgYnkgZmluZGluZyB0aGUgc2NoZWR1bGVyXG4gKiBhc3NvY2lhdGVkIHdpdGggdGhlIGBjb21wb25lbnRgJ3MgcmVuZGVyIHRyZWUgYW5kIHdhaXRpbmcgdW50aWwgdGhlIHNjaGVkdWxlclxuICogZmx1c2hlcy4gSWYgbm90aGluZyBpcyBzY2hlZHVsZWQsIHRoZSBmdW5jdGlvbiByZXR1cm5zIGEgcmVzb2x2ZWQgcHJvbWlzZS5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiBhd2FpdCB3aGVuUmVuZGVyZWQobXlDb21wb25lbnQpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gd2FpdCB1cG9uXG4gKiBAcmV0dXJucyBQcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gdGhlIGNvbXBvbmVudCBpcyByZW5kZXJlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoZW5SZW5kZXJlZChjb21wb25lbnQ6IGFueSk6IFByb21pc2U8bnVsbD4ge1xuICByZXR1cm4gZ2V0Um9vdENvbnRleHQoY29tcG9uZW50KS5jbGVhbjtcbn1cbiJdfQ==