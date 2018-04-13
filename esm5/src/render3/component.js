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
    var /** @type {?} */ component = renderComponent(componentType, opts);
    var /** @type {?} */ hostView = /** @type {?} */ (_getComponentHostLElementNode(component).data);
    var /** @type {?} */ hostViewRef = createViewRef(hostView, component);
    return {
        location: { nativeElement: getHostElement(component) },
        injector: opts.injector || NULL_INJECTOR,
        instance: component,
        hostView: hostViewRef,
        changeDetectorRef: hostViewRef,
        componentType: componentType,
        // TODO: implement destroy and onDestroy
        destroy: function () { },
        onDestroy: function (cb) { }
    };
}
// TODO: A hack to not pull in the NullInjector from @angular/core.
export var /** @type {?} */ NULL_INJECTOR = {
    get: function (token, notFoundValue) {
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
export function renderComponent(componentType /* Type as workaround for: Microsoft/TypeScript/issues/4881 */, opts) {
    if (opts === void 0) { opts = {}; }
    ngDevMode && assertComponentType(componentType);
    var /** @type {?} */ rendererFactory = opts.rendererFactory || domRendererFactory3;
    var /** @type {?} */ componentDef = /** @type {?} */ ((/** @type {?} */ (componentType)).ngComponentDef);
    if (componentDef.type != componentType)
        componentDef.type = componentType;
    var /** @type {?} */ component;
    // The first index of the first selector is the tag name.
    var /** @type {?} */ componentTag = /** @type {?} */ (((/** @type {?} */ ((componentDef.selectors))[0]))[0]);
    var /** @type {?} */ hostNode = locateHostElement(rendererFactory, opts.host || componentTag);
    var /** @type {?} */ rootContext = {
        // Incomplete initialization due to circular reference.
        component: /** @type {?} */ ((null)),
        scheduler: opts.scheduler || requestAnimationFrame.bind(window),
        clean: CLEAN_PROMISE,
    };
    var /** @type {?} */ rootView = createLView(-1, rendererFactory.createRenderer(hostNode, componentDef.rendererType), createTView(null, null), null, rootContext, componentDef.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */);
    rootView.injector = opts.injector || null;
    var /** @type {?} */ oldView = enterView(rootView, /** @type {?} */ ((null)));
    var /** @type {?} */ elementNode;
    try {
        if (rendererFactory.begin)
            rendererFactory.begin();
        // Create element node at index 0 in data array
        elementNode = hostElement(componentTag, hostNode, componentDef);
        // Create directive instance with factory() and store at index 0 in directives array
        component = rootContext.component = /** @type {?} */ (baseDirectiveCreate(0, componentDef.factory(), componentDef));
        initChangeDetectorIfExisting(elementNode.nodeInjector, component, /** @type {?} */ ((elementNode.data)));
        opts.hostFeatures && opts.hostFeatures.forEach(function (feature) { return feature(component, componentDef); });
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
    var /** @type {?} */ elementNode = _getComponentHostLElementNode(component);
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
    var /** @type {?} */ rootContext = /** @type {?} */ (getRootView(component).context);
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
    var /** @type {?} */ hostElement = getHostElement(component);
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
//# sourceMappingURL=component.js.map