/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { convertToBitFlags } from '../di/injector_compatibility';
import { EnvironmentInjector } from '../di/r3_injector';
import { RuntimeError } from '../errors';
import { retrieveHydrationInfo } from '../hydration/utils';
import { ComponentFactory as AbstractComponentFactory, ComponentRef as AbstractComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as AbstractComponentFactoryResolver } from '../linker/component_factory_resolver';
import { createElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/sanitizer';
import { assertDefined, assertGreaterThan, assertIndexInRange } from '../util/assert';
import { VERSION } from '../version';
import { NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '../view/provider_flags';
import { assertComponentType } from './assert';
import { attachPatchData } from './context_discovery';
import { getComponentDef } from './definition';
import { getNodeInjectable, NodeInjector } from './di';
import { throwProviderNotFoundError } from './errors_di';
import { registerPostOrderHooks } from './hooks';
import { reportUnknownPropertyError } from './instructions/element_validation';
import { markViewDirty } from './instructions/mark_view_dirty';
import { renderView } from './instructions/render';
import { addToViewTree, createLView, createTView, executeContentQueries, getOrCreateComponentTView, getOrCreateTNode, initializeDirectives, invokeDirectivesHostBindings, locateHostElement, markAsComponentHost, setInputsForProperty } from './instructions/shared';
import { CONTEXT, HEADER_OFFSET, INJECTOR, TVIEW } from './interfaces/view';
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
import { createElementNode, setupStaticAttributes, writeDirectClass } from './node_manipulation';
import { extractAttrsAndClassesFromSelector, stringifyCSSSelectorList } from './node_selector_matcher';
import { EffectManager } from './reactivity/effect';
import { enterView, getCurrentTNode, getLView, leaveView } from './state';
import { computeStaticStyling } from './styling/static_styling';
import { mergeHostAttrs, setUpAttributes } from './util/attrs_utils';
import { stringifyForError } from './util/stringify_utils';
import { getComponentLViewByIndex, getNativeByTNode, getTNode } from './util/view_utils';
import { RootViewRef } from './view_ref';
export class ComponentFactoryResolver extends AbstractComponentFactoryResolver {
    /**
     * @param ngModule The NgModuleRef to which all resolved factories are bound.
     */
    constructor(ngModule) {
        super();
        this.ngModule = ngModule;
    }
    resolveComponentFactory(component) {
        ngDevMode && assertComponentType(component);
        const componentDef = getComponentDef(component);
        return new ComponentFactory(componentDef, this.ngModule);
    }
}
function toRefArray(map) {
    const array = [];
    for (let nonMinified in map) {
        if (map.hasOwnProperty(nonMinified)) {
            const minified = map[nonMinified];
            array.push({ propName: minified, templateName: nonMinified });
        }
    }
    return array;
}
function getNamespace(elementName) {
    const name = elementName.toLowerCase();
    return name === 'svg' ? SVG_NAMESPACE : (name === 'math' ? MATH_ML_NAMESPACE : null);
}
/**
 * Injector that looks up a value using a specific injector, before falling back to the module
 * injector. Used primarily when creating components or embedded views dynamically.
 */
class ChainedInjector {
    constructor(injector, parentInjector) {
        this.injector = injector;
        this.parentInjector = parentInjector;
    }
    get(token, notFoundValue, flags) {
        flags = convertToBitFlags(flags);
        const value = this.injector.get(token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, flags);
        if (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR ||
            notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
            // Return the value from the root element injector when
            // - it provides it
            //   (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
            // - the module injector should not be checked
            //   (notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
            return value;
        }
        return this.parentInjector.get(token, notFoundValue, flags);
    }
}
/**
 * ComponentFactory interface implementation.
 */
export class ComponentFactory extends AbstractComponentFactory {
    get inputs() {
        return toRefArray(this.componentDef.inputs);
    }
    get outputs() {
        return toRefArray(this.componentDef.outputs);
    }
    /**
     * @param componentDef The component definition.
     * @param ngModule The NgModuleRef to which the factory is bound.
     */
    constructor(componentDef, ngModule) {
        super();
        this.componentDef = componentDef;
        this.ngModule = ngModule;
        this.componentType = componentDef.type;
        this.selector = stringifyCSSSelectorList(componentDef.selectors);
        this.ngContentSelectors =
            componentDef.ngContentSelectors ? componentDef.ngContentSelectors : [];
        this.isBoundToModule = !!ngModule;
    }
    create(injector, projectableNodes, rootSelectorOrNode, environmentInjector) {
        environmentInjector = environmentInjector || this.ngModule;
        let realEnvironmentInjector = environmentInjector instanceof EnvironmentInjector ?
            environmentInjector :
            environmentInjector?.injector;
        if (realEnvironmentInjector && this.componentDef.getStandaloneInjector !== null) {
            realEnvironmentInjector = this.componentDef.getStandaloneInjector(realEnvironmentInjector) ||
                realEnvironmentInjector;
        }
        const rootViewInjector = realEnvironmentInjector ? new ChainedInjector(injector, realEnvironmentInjector) : injector;
        const rendererFactory = rootViewInjector.get(RendererFactory2, null);
        if (rendererFactory === null) {
            throw new RuntimeError(407 /* RuntimeErrorCode.RENDERER_NOT_FOUND */, ngDevMode &&
                'Angular was not able to inject a renderer (RendererFactory2). ' +
                    'Likely this is due to a broken DI hierarchy. ' +
                    'Make sure that any injector used to create this component has a correct parent.');
        }
        const sanitizer = rootViewInjector.get(Sanitizer, null);
        const effectManager = rootViewInjector.get(EffectManager, null);
        const environment = {
            rendererFactory,
            sanitizer,
            effectManager,
        };
        const hostRenderer = rendererFactory.createRenderer(null, this.componentDef);
        // Determine a tag name used for creating host elements when this component is created
        // dynamically. Default to 'div' if this component did not specify any tag name in its selector.
        const elementName = this.componentDef.selectors[0][0] || 'div';
        const hostRNode = rootSelectorOrNode ?
            locateHostElement(hostRenderer, rootSelectorOrNode, this.componentDef.encapsulation, rootViewInjector) :
            createElementNode(hostRenderer, elementName, getNamespace(elementName));
        // Signal components use the granular "RefreshView"  for change detection
        const signalFlags = (4096 /* LViewFlags.SignalView */ | 512 /* LViewFlags.IsRoot */);
        // Non-signal components use the traditional "CheckAlways or OnPush/Dirty" change detection
        const nonSignalFlags = this.componentDef.onPush ? 64 /* LViewFlags.Dirty */ | 512 /* LViewFlags.IsRoot */ :
            16 /* LViewFlags.CheckAlways */ | 512 /* LViewFlags.IsRoot */;
        const rootFlags = this.componentDef.signals ? signalFlags : nonSignalFlags;
        // Create the root view. Uses empty TView and ContentTemplate.
        const rootTView = createTView(0 /* TViewType.Root */, null, null, 1, 0, null, null, null, null, null, null);
        const rootLView = createLView(null, rootTView, null, rootFlags, null, null, environment, hostRenderer, rootViewInjector, null, null);
        // rootView is the parent when bootstrapping
        // TODO(misko): it looks like we are entering view here but we don't really need to as
        // `renderView` does that. However as the code is written it is needed because
        // `createRootComponentView` and `createRootComponent` both read global state. Fixing those
        // issues would allow us to drop this.
        enterView(rootLView);
        let component;
        let tElementNode;
        try {
            const rootComponentDef = this.componentDef;
            let rootDirectives;
            let hostDirectiveDefs = null;
            if (rootComponentDef.findHostDirectiveDefs) {
                rootDirectives = [];
                hostDirectiveDefs = new Map();
                rootComponentDef.findHostDirectiveDefs(rootComponentDef, rootDirectives, hostDirectiveDefs);
                rootDirectives.push(rootComponentDef);
            }
            else {
                rootDirectives = [rootComponentDef];
            }
            const hostTNode = createRootComponentTNode(rootLView, hostRNode);
            const componentView = createRootComponentView(hostTNode, hostRNode, rootComponentDef, rootDirectives, rootLView, environment, hostRenderer);
            tElementNode = getTNode(rootTView, HEADER_OFFSET);
            // TODO(crisbeto): in practice `hostRNode` should always be defined, but there are some tests
            // where the renderer is mocked out and `undefined` is returned. We should update the tests so
            // that this check can be removed.
            if (hostRNode) {
                setRootNodeAttributes(hostRenderer, rootComponentDef, hostRNode, rootSelectorOrNode);
            }
            if (projectableNodes !== undefined) {
                projectNodes(tElementNode, this.ngContentSelectors, projectableNodes);
            }
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            component = createRootComponent(componentView, rootComponentDef, rootDirectives, hostDirectiveDefs, rootLView, [LifecycleHooksFeature]);
            renderView(rootTView, rootLView, null);
        }
        finally {
            leaveView();
        }
        return new ComponentRef(this.componentType, component, createElementRef(tElementNode, rootLView), rootLView, tElementNode);
    }
}
/**
 * Represents an instance of a Component created via a {@link ComponentFactory}.
 *
 * `ComponentRef` provides access to the Component Instance as well other objects related to this
 * Component Instance and allows you to destroy the Component Instance via the {@link #destroy}
 * method.
 *
 */
export class ComponentRef extends AbstractComponentRef {
    constructor(componentType, instance, location, _rootLView, _tNode) {
        super();
        this.location = location;
        this._rootLView = _rootLView;
        this._tNode = _tNode;
        this.previousInputValues = null;
        this.instance = instance;
        this.hostView = this.changeDetectorRef = new RootViewRef(_rootLView);
        this.componentType = componentType;
    }
    setInput(name, value) {
        const inputData = this._tNode.inputs;
        let dataValue;
        if (inputData !== null && (dataValue = inputData[name])) {
            this.previousInputValues ??= new Map();
            // Do not set the input if it is the same as the last value
            // This behavior matches `bindingUpdated` when binding inputs in templates.
            if (this.previousInputValues.has(name) &&
                Object.is(this.previousInputValues.get(name), value)) {
                return;
            }
            const lView = this._rootLView;
            setInputsForProperty(lView[TVIEW], lView, dataValue, name, value);
            this.previousInputValues.set(name, value);
            const childComponentLView = getComponentLViewByIndex(this._tNode.index, lView);
            markViewDirty(childComponentLView);
        }
        else {
            if (ngDevMode) {
                const cmpNameForError = stringifyForError(this.componentType);
                let message = `Can't set value of the '${name}' input on the '${cmpNameForError}' component. `;
                message += `Make sure that the '${name}' property is annotated with @Input() or a mapped @Input('${name}') exists.`;
                reportUnknownPropertyError(message);
            }
        }
    }
    get injector() {
        return new NodeInjector(this._tNode, this._rootLView);
    }
    destroy() {
        this.hostView.destroy();
    }
    onDestroy(callback) {
        this.hostView.onDestroy(callback);
    }
}
// TODO: A hack to not pull in the NullInjector from @angular/core.
export const NULL_INJECTOR = {
    get: (token, notFoundValue) => {
        throwProviderNotFoundError(token, 'NullInjector');
    }
};
/** Creates a TNode that can be used to instantiate a root component. */
function createRootComponentTNode(lView, rNode) {
    const tView = lView[TVIEW];
    const index = HEADER_OFFSET;
    ngDevMode && assertIndexInRange(lView, index);
    lView[index] = rNode;
    // '#host' is added here as we don't know the real host DOM name (we don't want to read it) and at
    // the same time we want to communicate the debug `TNode` that this is a special `TNode`
    // representing a host element.
    return getOrCreateTNode(tView, index, 2 /* TNodeType.Element */, '#host', null);
}
/**
 * Creates the root component view and the root component node.
 *
 * @param hostRNode Render host element.
 * @param rootComponentDef ComponentDef
 * @param rootView The parent view where the host node is stored
 * @param rendererFactory Factory to be used for creating child renderers.
 * @param hostRenderer The current renderer
 * @param sanitizer The sanitizer, if provided
 *
 * @returns Component view created
 */
function createRootComponentView(tNode, hostRNode, rootComponentDef, rootDirectives, rootView, environment, hostRenderer) {
    const tView = rootView[TVIEW];
    applyRootComponentStyling(rootDirectives, tNode, hostRNode, hostRenderer);
    // Hydration info is on the host element and needs to be retreived
    // and passed to the component LView.
    let hydrationInfo = null;
    if (hostRNode !== null) {
        hydrationInfo = retrieveHydrationInfo(hostRNode, rootView[INJECTOR]);
    }
    const viewRenderer = environment.rendererFactory.createRenderer(hostRNode, rootComponentDef);
    let lViewFlags = 16 /* LViewFlags.CheckAlways */;
    if (rootComponentDef.signals) {
        lViewFlags = 4096 /* LViewFlags.SignalView */;
    }
    else if (rootComponentDef.onPush) {
        lViewFlags = 64 /* LViewFlags.Dirty */;
    }
    const componentView = createLView(rootView, getOrCreateComponentTView(rootComponentDef), null, lViewFlags, rootView[tNode.index], tNode, environment, viewRenderer, null, null, hydrationInfo);
    if (tView.firstCreatePass) {
        markAsComponentHost(tView, tNode, rootDirectives.length - 1);
    }
    addToViewTree(rootView, componentView);
    // Store component view at node index, with node as the HOST
    return rootView[tNode.index] = componentView;
}
/** Sets up the styling information on a root component. */
function applyRootComponentStyling(rootDirectives, tNode, rNode, hostRenderer) {
    for (const def of rootDirectives) {
        tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, def.hostAttrs);
    }
    if (tNode.mergedAttrs !== null) {
        computeStaticStyling(tNode, tNode.mergedAttrs, true);
        if (rNode !== null) {
            setupStaticAttributes(hostRenderer, rNode, tNode);
        }
    }
}
/**
 * Creates a root component and sets it up with features and host bindings.Shared by
 * renderComponent() and ViewContainerRef.createComponent().
 */
function createRootComponent(componentView, rootComponentDef, rootDirectives, hostDirectiveDefs, rootLView, hostFeatures) {
    const rootTNode = getCurrentTNode();
    ngDevMode && assertDefined(rootTNode, 'tNode should have been already created');
    const tView = rootLView[TVIEW];
    const native = getNativeByTNode(rootTNode, rootLView);
    initializeDirectives(tView, rootLView, rootTNode, rootDirectives, null, hostDirectiveDefs);
    for (let i = 0; i < rootDirectives.length; i++) {
        const directiveIndex = rootTNode.directiveStart + i;
        const directiveInstance = getNodeInjectable(rootLView, tView, directiveIndex, rootTNode);
        attachPatchData(directiveInstance, rootLView);
    }
    invokeDirectivesHostBindings(tView, rootLView, rootTNode);
    if (native) {
        attachPatchData(native, rootLView);
    }
    // We're guaranteed for the `componentOffset` to be positive here
    // since a root component always matches a component def.
    ngDevMode &&
        assertGreaterThan(rootTNode.componentOffset, -1, 'componentOffset must be great than -1');
    const component = getNodeInjectable(rootLView, tView, rootTNode.directiveStart + rootTNode.componentOffset, rootTNode);
    componentView[CONTEXT] = rootLView[CONTEXT] = component;
    if (hostFeatures !== null) {
        for (const feature of hostFeatures) {
            feature(component, rootComponentDef);
        }
    }
    // We want to generate an empty QueryList for root content queries for backwards
    // compatibility with ViewEngine.
    executeContentQueries(tView, rootTNode, componentView);
    return component;
}
/** Sets the static attributes on a root component. */
function setRootNodeAttributes(hostRenderer, componentDef, hostRNode, rootSelectorOrNode) {
    if (rootSelectorOrNode) {
        setUpAttributes(hostRenderer, hostRNode, ['ng-version', VERSION.full]);
    }
    else {
        // If host element is created as a part of this function call (i.e. `rootSelectorOrNode`
        // is not defined), also apply attributes and classes extracted from component selector.
        // Extract attributes and classes from the first selector only to match VE behavior.
        const { attrs, classes } = extractAttrsAndClassesFromSelector(componentDef.selectors[0]);
        if (attrs) {
            setUpAttributes(hostRenderer, hostRNode, attrs);
        }
        if (classes && classes.length > 0) {
            writeDirectClass(hostRenderer, hostRNode, classes.join(' '));
        }
    }
}
/** Projects the `projectableNodes` that were specified when creating a root component. */
function projectNodes(tNode, ngContentSelectors, projectableNodes) {
    const projection = tNode.projection = [];
    for (let i = 0; i < ngContentSelectors.length; i++) {
        const nodesforSlot = projectableNodes[i];
        // Projectable nodes can be passed as array of arrays or an array of iterables (ngUpgrade
        // case). Here we do normalize passed data structure to be an array of arrays to avoid
        // complex checks down the line.
        // We also normalize the length of the passed in projectable nodes (to match the number of
        // <ng-container> slots defined by a component).
        projection.push(nodesforSlot != null ? Array.from(nodesforSlot) : null);
    }
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
 */
export function LifecycleHooksFeature() {
    const tNode = getCurrentTNode();
    ngDevMode && assertDefined(tNode, 'TNode is required');
    registerPostOrderHooks(getLView()[TVIEW], tNode);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUcvRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUV6RCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV6RCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksd0JBQXdCLEVBQUUsWUFBWSxJQUFJLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDL0gsT0FBTyxFQUFDLHdCQUF3QixJQUFJLGdDQUFnQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLGdCQUFnQixFQUFhLE1BQU0sdUJBQXVCLENBQUM7QUFFbkUsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEYsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUMscUNBQXFDLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUU3RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0Ms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LE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNsRCxNQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6Qyx5RkFBeUY7UUFDekYsc0ZBQXNGO1FBQ3RGLGdDQUFnQztRQUNoQywwRkFBMEY7UUFDMUYsZ0RBQWdEO1FBQ2hELFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDekU7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQyxNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3ZELHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Y29udmVydFRvQml0RmxhZ3N9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0T3B0aW9uc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7UHJvdmlkZXJUb2tlbn0gZnJvbSAnLi4vZGkvcHJvdmlkZXJfdG9rZW4nO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7RGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uL2h5ZHJhdGlvbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7cmV0cmlldmVIeWRyYXRpb25JbmZvfSBmcm9tICcuLi9oeWRyYXRpb24vdXRpbHMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgQWJzdHJhY3RDb21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyBBYnN0cmFjdENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRJbmRleEluUmFuZ2V9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7VkVSU0lPTn0gZnJvbSAnLi4vdmVyc2lvbic7XG5pbXBvcnQge05PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1J9IGZyb20gJy4uL3ZpZXcvcHJvdmlkZXJfZmxhZ3MnO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGV9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0YWJsZSwgTm9kZUluamVjdG9yfSBmcm9tICcuL2RpJztcbmltcG9ydCB7dGhyb3dQcm92aWRlck5vdEZvdW5kRXJyb3J9IGZyb20gJy4vZXJyb3JzX2RpJztcbmltcG9ydCB7cmVnaXN0ZXJQb3N0T3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge3JlcG9ydFVua25vd25Qcm9wZXJ0eUVycm9yfSBmcm9tICcuL2luc3RydWN0aW9ucy9lbGVtZW50X3ZhbGlkYXRpb24nO1xuaW1wb3J0IHttYXJrVmlld0RpcnR5fSBmcm9tICcuL2luc3RydWN0aW9ucy9tYXJrX3ZpZXdfZGlydHknO1xuaW1wb3J0IHtyZW5kZXJWaWV3fSBmcm9tICcuL2luc3RydWN0aW9ucy9yZW5kZXInO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBjcmVhdGVMVmlldywgY3JlYXRlVFZpZXcsIGV4ZWN1dGVDb250ZW50UXVlcmllcywgZ2V0T3JDcmVhdGVDb21wb25lbnRUVmlldywgZ2V0T3JDcmVhdGVUTm9kZSwgaW5pdGlhbGl6ZURpcmVjdGl2ZXMsIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3MsIGxvY2F0ZUhvc3RFbGVtZW50LCBtYXJrQXNDb21wb25lbnRIb3N0LCBzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWYsIEhvc3REaXJlY3RpdmVEZWZzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1Byb3BlcnR5QWxpYXNWYWx1ZSwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtDT05URVhULCBIRUFERVJfT0ZGU0VULCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RW52aXJvbm1lbnQsIExWaWV3RmxhZ3MsIFRWSUVXLCBUVmlld1R5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7TUFUSF9NTF9OQU1FU1BBQ0UsIFNWR19OQU1FU1BBQ0V9IGZyb20gJy4vbmFtZXNwYWNlcyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnROb2RlLCBzZXR1cFN0YXRpY0F0dHJpYnV0ZXMsIHdyaXRlRGlyZWN0Q2xhc3N9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtleHRyYWN0QXR0cnNBbmRDbGFzc2VzRnJvbVNlbGVjdG9yLCBzdHJpbmdpZnlDU1NTZWxlY3Rvckxpc3R9IGZyb20gJy4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7RWZmZWN0TWFuYWdlcn0gZnJvbSAnLi9yZWFjdGl2aXR5L2VmZmVjdCc7XG5pbXBvcnQge2VudGVyVmlldywgZ2V0Q3VycmVudFROb2RlLCBnZXRMVmlldywgbGVhdmVWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Y29tcHV0ZVN0YXRpY1N0eWxpbmd9IGZyb20gJy4vc3R5bGluZy9zdGF0aWNfc3R5bGluZyc7XG5pbXBvcnQge21lcmdlSG9zdEF0dHJzLCBzZXRVcEF0dHJpYnV0ZXN9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge3N0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuL3V0aWwvc3RyaW5naWZ5X3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtSb290Vmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIGFsbCByZXNvbHZlZCBmYWN0b3JpZXMgYXJlIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpITtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLm5nTW9kdWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1JlZkFycmF5KG1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgY29uc3QgYXJyYXk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10gPSBbXTtcbiAgZm9yIChsZXQgbm9uTWluaWZpZWQgaW4gbWFwKSB7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShub25NaW5pZmllZCkpIHtcbiAgICAgIGNvbnN0IG1pbmlmaWVkID0gbWFwW25vbk1pbmlmaWVkXTtcbiAgICAgIGFycmF5LnB1c2goe3Byb3BOYW1lOiBtaW5pZmllZCwgdGVtcGxhdGVOYW1lOiBub25NaW5pZmllZH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGdldE5hbWVzcGFjZShlbGVtZW50TmFtZTogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBuYW1lID0gZWxlbWVudE5hbWUudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIG5hbWUgPT09ICdzdmcnID8gU1ZHX05BTUVTUEFDRSA6IChuYW1lID09PSAnbWF0aCcgPyBNQVRIX01MX05BTUVTUEFDRSA6IG51bGwpO1xufVxuXG4vKipcbiAqIEluamVjdG9yIHRoYXQgbG9va3MgdXAgYSB2YWx1ZSB1c2luZyBhIHNwZWNpZmljIGluamVjdG9yLCBiZWZvcmUgZmFsbGluZyBiYWNrIHRvIHRoZSBtb2R1bGVcbiAqIGluamVjdG9yLiBVc2VkIHByaW1hcmlseSB3aGVuIGNyZWF0aW5nIGNvbXBvbmVudHMgb3IgZW1iZWRkZWQgdmlld3MgZHluYW1pY2FsbHkuXG4gKi9cbmNsYXNzIENoYWluZWRJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IsIHByaXZhdGUgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3N8SW5qZWN0T3B0aW9ucyk6IFQge1xuICAgIGZsYWdzID0gY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpO1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5pbmplY3Rvci5nZXQ8VHx0eXBlb2YgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUj4oXG4gICAgICAgIHRva2VuLCBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SLCBmbGFncyk7XG5cbiAgICBpZiAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgfHxcbiAgICAgICAgbm90Rm91bmRWYWx1ZSA9PT0gKE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgYXMgdW5rbm93biBhcyBUKSkge1xuICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgICAgLy8gLSBpdCBwcm92aWRlcyBpdFxuICAgICAgLy8gICAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAvLyAtIHRoZSBtb2R1bGUgaW5qZWN0b3Igc2hvdWxkIG5vdCBiZSBjaGVja2VkXG4gICAgICAvLyAgIChub3RGb3VuZFZhbHVlID09PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKVxuICAgICAgcmV0dXJuIHZhbHVlIGFzIFQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucGFyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21wb25lbnRGYWN0b3J5IGludGVyZmFjZSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8VD4gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICBvdmVycmlkZSBzZWxlY3Rvcjogc3RyaW5nO1xuICBvdmVycmlkZSBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIG92ZXJyaWRlIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG4gIGlzQm91bmRUb01vZHVsZTogYm9vbGVhbjtcblxuICBvdmVycmlkZSBnZXQgaW5wdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLmlucHV0cyk7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgb3V0cHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5vdXRwdXRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gY29tcG9uZW50RGVmIFRoZSBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIG5nTW9kdWxlIFRoZSBOZ01vZHVsZVJlZiB0byB3aGljaCB0aGUgZmFjdG9yeSBpcyBib3VuZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55PiwgcHJpdmF0ZSBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudERlZi50eXBlO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBzdHJpbmdpZnlDU1NTZWxlY3Rvckxpc3QoY29tcG9uZW50RGVmLnNlbGVjdG9ycyk7XG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPVxuICAgICAgICBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzID8gY29tcG9uZW50RGVmLm5nQ29udGVudFNlbGVjdG9ycyA6IFtdO1xuICAgIHRoaXMuaXNCb3VuZFRvTW9kdWxlID0gISFuZ01vZHVsZTtcbiAgfVxuXG4gIG92ZXJyaWRlIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLCByb290U2VsZWN0b3JPck5vZGU/OiBhbnksXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogTmdNb2R1bGVSZWY8YW55PnxFbnZpcm9ubWVudEluamVjdG9yfFxuICAgICAgdW5kZWZpbmVkKTogQWJzdHJhY3RDb21wb25lbnRSZWY8VD4ge1xuICAgIGVudmlyb25tZW50SW5qZWN0b3IgPSBlbnZpcm9ubWVudEluamVjdG9yIHx8IHRoaXMubmdNb2R1bGU7XG5cbiAgICBsZXQgcmVhbEVudmlyb25tZW50SW5qZWN0b3IgPSBlbnZpcm9ubWVudEluamVjdG9yIGluc3RhbmNlb2YgRW52aXJvbm1lbnRJbmplY3RvciA/XG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3IgOlxuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yPy5pbmplY3RvcjtcblxuICAgIGlmIChyZWFsRW52aXJvbm1lbnRJbmplY3RvciAmJiB0aGlzLmNvbXBvbmVudERlZi5nZXRTdGFuZGFsb25lSW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJlYWxFbnZpcm9ubWVudEluamVjdG9yID0gdGhpcy5jb21wb25lbnREZWYuZ2V0U3RhbmRhbG9uZUluamVjdG9yKHJlYWxFbnZpcm9ubWVudEluamVjdG9yKSB8fFxuICAgICAgICAgIHJlYWxFbnZpcm9ubWVudEluamVjdG9yO1xuICAgIH1cblxuICAgIGNvbnN0IHJvb3RWaWV3SW5qZWN0b3IgPVxuICAgICAgICByZWFsRW52aXJvbm1lbnRJbmplY3RvciA/IG5ldyBDaGFpbmVkSW5qZWN0b3IoaW5qZWN0b3IsIHJlYWxFbnZpcm9ubWVudEluamVjdG9yKSA6IGluamVjdG9yO1xuXG4gICAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MiwgbnVsbCk7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFTkRFUkVSX05PVF9GT1VORCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgJ0FuZ3VsYXIgd2FzIG5vdCBhYmxlIHRvIGluamVjdCBhIHJlbmRlcmVyIChSZW5kZXJlckZhY3RvcnkyKS4gJyArXG4gICAgICAgICAgICAgICAgICAnTGlrZWx5IHRoaXMgaXMgZHVlIHRvIGEgYnJva2VuIERJIGhpZXJhcmNoeS4gJyArXG4gICAgICAgICAgICAgICAgICAnTWFrZSBzdXJlIHRoYXQgYW55IGluamVjdG9yIHVzZWQgdG8gY3JlYXRlIHRoaXMgY29tcG9uZW50IGhhcyBhIGNvcnJlY3QgcGFyZW50LicpO1xuICAgIH1cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSByb290Vmlld0luamVjdG9yLmdldChTYW5pdGl6ZXIsIG51bGwpO1xuXG4gICAgY29uc3QgZWZmZWN0TWFuYWdlciA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KEVmZmVjdE1hbmFnZXIsIG51bGwpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnQ6IExWaWV3RW52aXJvbm1lbnQgPSB7XG4gICAgICByZW5kZXJlckZhY3RvcnksXG4gICAgICBzYW5pdGl6ZXIsXG4gICAgICBlZmZlY3RNYW5hZ2VyLFxuICAgIH07XG5cbiAgICBjb25zdCBob3N0UmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgdGhpcy5jb21wb25lbnREZWYpO1xuICAgIC8vIERldGVybWluZSBhIHRhZyBuYW1lIHVzZWQgZm9yIGNyZWF0aW5nIGhvc3QgZWxlbWVudHMgd2hlbiB0aGlzIGNvbXBvbmVudCBpcyBjcmVhdGVkXG4gICAgLy8gZHluYW1pY2FsbHkuIERlZmF1bHQgdG8gJ2RpdicgaWYgdGhpcyBjb21wb25lbnQgZGlkIG5vdCBzcGVjaWZ5IGFueSB0YWcgbmFtZSBpbiBpdHMgc2VsZWN0b3IuXG4gICAgY29uc3QgZWxlbWVudE5hbWUgPSB0aGlzLmNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF1bMF0gYXMgc3RyaW5nIHx8ICdkaXYnO1xuICAgIGNvbnN0IGhvc3RSTm9kZSA9IHJvb3RTZWxlY3Rvck9yTm9kZSA/XG4gICAgICAgIGxvY2F0ZUhvc3RFbGVtZW50KFxuICAgICAgICAgICAgaG9zdFJlbmRlcmVyLCByb290U2VsZWN0b3JPck5vZGUsIHRoaXMuY29tcG9uZW50RGVmLmVuY2Fwc3VsYXRpb24sIHJvb3RWaWV3SW5qZWN0b3IpIDpcbiAgICAgICAgY3JlYXRlRWxlbWVudE5vZGUoaG9zdFJlbmRlcmVyLCBlbGVtZW50TmFtZSwgZ2V0TmFtZXNwYWNlKGVsZW1lbnROYW1lKSk7XG5cbiAgICAvLyBTaWduYWwgY29tcG9uZW50cyB1c2UgdGhlIGdyYW51bGFyIFwiUmVmcmVzaFZpZXdcIiAgZm9yIGNoYW5nZSBkZXRlY3Rpb25cbiAgICBjb25zdCBzaWduYWxGbGFncyA9IChMVmlld0ZsYWdzLlNpZ25hbFZpZXcgfCBMVmlld0ZsYWdzLklzUm9vdCk7XG4gICAgLy8gTm9uLXNpZ25hbCBjb21wb25lbnRzIHVzZSB0aGUgdHJhZGl0aW9uYWwgXCJDaGVja0Fsd2F5cyBvciBPblB1c2gvRGlydHlcIiBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAgY29uc3Qgbm9uU2lnbmFsRmxhZ3MgPSB0aGlzLmNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290O1xuICAgIGNvbnN0IHJvb3RGbGFncyA9IHRoaXMuY29tcG9uZW50RGVmLnNpZ25hbHMgPyBzaWduYWxGbGFncyA6IG5vblNpZ25hbEZsYWdzO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSByb290IHZpZXcuIFVzZXMgZW1wdHkgVFZpZXcgYW5kIENvbnRlbnRUZW1wbGF0ZS5cbiAgICBjb25zdCByb290VFZpZXcgPVxuICAgICAgICBjcmVhdGVUVmlldyhUVmlld1R5cGUuUm9vdCwgbnVsbCwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgY29uc3Qgcm9vdExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIG51bGwsIHJvb3RUVmlldywgbnVsbCwgcm9vdEZsYWdzLCBudWxsLCBudWxsLCBlbnZpcm9ubWVudCwgaG9zdFJlbmRlcmVyLCByb290Vmlld0luamVjdG9yLFxuICAgICAgICBudWxsLCBudWxsKTtcblxuICAgIC8vIHJvb3RWaWV3IGlzIHRoZSBwYXJlbnQgd2hlbiBib290c3RyYXBwaW5nXG4gICAgLy8gVE9ETyhtaXNrbyk6IGl0IGxvb2tzIGxpa2Ugd2UgYXJlIGVudGVyaW5nIHZpZXcgaGVyZSBidXQgd2UgZG9uJ3QgcmVhbGx5IG5lZWQgdG8gYXNcbiAgICAvLyBgcmVuZGVyVmlld2AgZG9lcyB0aGF0LiBIb3dldmVyIGFzIHRoZSBjb2RlIGlzIHdyaXR0ZW4gaXQgaXMgbmVlZGVkIGJlY2F1c2VcbiAgICAvLyBgY3JlYXRlUm9vdENvbXBvbmVudFZpZXdgIGFuZCBgY3JlYXRlUm9vdENvbXBvbmVudGAgYm90aCByZWFkIGdsb2JhbCBzdGF0ZS4gRml4aW5nIHRob3NlXG4gICAgLy8gaXNzdWVzIHdvdWxkIGFsbG93IHVzIHRvIGRyb3AgdGhpcy5cbiAgICBlbnRlclZpZXcocm9vdExWaWV3KTtcblxuICAgIGxldCBjb21wb25lbnQ6IFQ7XG4gICAgbGV0IHRFbGVtZW50Tm9kZTogVEVsZW1lbnROb2RlO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJvb3RDb21wb25lbnREZWYgPSB0aGlzLmNvbXBvbmVudERlZjtcbiAgICAgIGxldCByb290RGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPHVua25vd24+W107XG4gICAgICBsZXQgaG9zdERpcmVjdGl2ZURlZnM6IEhvc3REaXJlY3RpdmVEZWZzfG51bGwgPSBudWxsO1xuXG4gICAgICBpZiAocm9vdENvbXBvbmVudERlZi5maW5kSG9zdERpcmVjdGl2ZURlZnMpIHtcbiAgICAgICAgcm9vdERpcmVjdGl2ZXMgPSBbXTtcbiAgICAgICAgaG9zdERpcmVjdGl2ZURlZnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHJvb3RDb21wb25lbnREZWYuZmluZEhvc3REaXJlY3RpdmVEZWZzKHJvb3RDb21wb25lbnREZWYsIHJvb3REaXJlY3RpdmVzLCBob3N0RGlyZWN0aXZlRGVmcyk7XG4gICAgICAgIHJvb3REaXJlY3RpdmVzLnB1c2gocm9vdENvbXBvbmVudERlZik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb290RGlyZWN0aXZlcyA9IFtyb290Q29tcG9uZW50RGVmXTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaG9zdFROb2RlID0gY3JlYXRlUm9vdENvbXBvbmVudFROb2RlKHJvb3RMVmlldywgaG9zdFJOb2RlKTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVSb290Q29tcG9uZW50VmlldyhcbiAgICAgICAgICBob3N0VE5vZGUsIGhvc3RSTm9kZSwgcm9vdENvbXBvbmVudERlZiwgcm9vdERpcmVjdGl2ZXMsIHJvb3RMVmlldywgZW52aXJvbm1lbnQsXG4gICAgICAgICAgaG9zdFJlbmRlcmVyKTtcblxuICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUocm9vdFRWaWV3LCBIRUFERVJfT0ZGU0VUKSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBpbiBwcmFjdGljZSBgaG9zdFJOb2RlYCBzaG91bGQgYWx3YXlzIGJlIGRlZmluZWQsIGJ1dCB0aGVyZSBhcmUgc29tZSB0ZXN0c1xuICAgICAgLy8gd2hlcmUgdGhlIHJlbmRlcmVyIGlzIG1vY2tlZCBvdXQgYW5kIGB1bmRlZmluZWRgIGlzIHJldHVybmVkLiBXZSBzaG91bGQgdXBkYXRlIHRoZSB0ZXN0cyBzb1xuICAgICAgLy8gdGhhdCB0aGlzIGNoZWNrIGNhbiBiZSByZW1vdmVkLlxuICAgICAgaWYgKGhvc3RSTm9kZSkge1xuICAgICAgICBzZXRSb290Tm9kZUF0dHJpYnV0ZXMoaG9zdFJlbmRlcmVyLCByb290Q29tcG9uZW50RGVmLCBob3N0Uk5vZGUsIHJvb3RTZWxlY3Rvck9yTm9kZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9qZWN0YWJsZU5vZGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvamVjdE5vZGVzKHRFbGVtZW50Tm9kZSwgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMsIHByb2plY3RhYmxlTm9kZXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBUT0RPOiBzaG91bGQgTGlmZWN5Y2xlSG9va3NGZWF0dXJlIGFuZCBvdGhlciBob3N0IGZlYXR1cmVzIGJlIGdlbmVyYXRlZCBieSB0aGUgY29tcGlsZXIgYW5kXG4gICAgICAvLyBleGVjdXRlZCBoZXJlP1xuICAgICAgLy8gQW5ndWxhciA1IHJlZmVyZW5jZTogaHR0cHM6Ly9zdGFja2JsaXR6LmNvbS9lZGl0L2xpZmVjeWNsZS1ob29rcy12Y3JlZlxuICAgICAgY29tcG9uZW50ID0gY3JlYXRlUm9vdENvbXBvbmVudChcbiAgICAgICAgICBjb21wb25lbnRWaWV3LCByb290Q29tcG9uZW50RGVmLCByb290RGlyZWN0aXZlcywgaG9zdERpcmVjdGl2ZURlZnMsIHJvb3RMVmlldyxcbiAgICAgICAgICBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG4gICAgICByZW5kZXJWaWV3KHJvb3RUVmlldywgcm9vdExWaWV3LCBudWxsKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgbGVhdmVWaWV3KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRSZWYoXG4gICAgICAgIHRoaXMuY29tcG9uZW50VHlwZSwgY29tcG9uZW50LCBjcmVhdGVFbGVtZW50UmVmKHRFbGVtZW50Tm9kZSwgcm9vdExWaWV3KSwgcm9vdExWaWV3LFxuICAgICAgICB0RWxlbWVudE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIENvbXBvbmVudCBjcmVhdGVkIHZpYSBhIHtAbGluayBDb21wb25lbnRGYWN0b3J5fS5cbiAqXG4gKiBgQ29tcG9uZW50UmVmYCBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIENvbXBvbmVudCBJbnN0YW5jZSBhcyB3ZWxsIG90aGVyIG9iamVjdHMgcmVsYXRlZCB0byB0aGlzXG4gKiBDb21wb25lbnQgSW5zdGFuY2UgYW5kIGFsbG93cyB5b3UgdG8gZGVzdHJveSB0aGUgQ29tcG9uZW50IEluc3RhbmNlIHZpYSB0aGUge0BsaW5rICNkZXN0cm95fVxuICogbWV0aG9kLlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudFJlZjxUPiBleHRlbmRzIEFic3RyYWN0Q29tcG9uZW50UmVmPFQ+IHtcbiAgb3ZlcnJpZGUgaW5zdGFuY2U6IFQ7XG4gIG92ZXJyaWRlIGhvc3RWaWV3OiBWaWV3UmVmPFQ+O1xuICBvdmVycmlkZSBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIG92ZXJyaWRlIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG4gIHByaXZhdGUgcHJldmlvdXNJbnB1dFZhbHVlczogTWFwPHN0cmluZywgdW5rbm93bj58bnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcHVibGljIGxvY2F0aW9uOiBFbGVtZW50UmVmLCBwcml2YXRlIF9yb290TFZpZXc6IExWaWV3LFxuICAgICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBSb290Vmlld1JlZjxUPihfcm9vdExWaWV3KTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnRUeXBlO1xuICB9XG5cbiAgb3ZlcnJpZGUgc2V0SW5wdXQobmFtZTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IHZvaWQge1xuICAgIGNvbnN0IGlucHV0RGF0YSA9IHRoaXMuX3ROb2RlLmlucHV0cztcbiAgICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICAgIGlmIChpbnB1dERhdGEgIT09IG51bGwgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtuYW1lXSkpIHtcbiAgICAgIHRoaXMucHJldmlvdXNJbnB1dFZhbHVlcyA/Pz0gbmV3IE1hcCgpO1xuICAgICAgLy8gRG8gbm90IHNldCB0aGUgaW5wdXQgaWYgaXQgaXMgdGhlIHNhbWUgYXMgdGhlIGxhc3QgdmFsdWVcbiAgICAgIC8vIFRoaXMgYmVoYXZpb3IgbWF0Y2hlcyBgYmluZGluZ1VwZGF0ZWRgIHdoZW4gYmluZGluZyBpbnB1dHMgaW4gdGVtcGxhdGVzLlxuICAgICAgaWYgKHRoaXMucHJldmlvdXNJbnB1dFZhbHVlcy5oYXMobmFtZSkgJiZcbiAgICAgICAgICBPYmplY3QuaXModGhpcy5wcmV2aW91c0lucHV0VmFsdWVzLmdldChuYW1lKSwgdmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yb290TFZpZXc7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlld1tUVklFV10sIGxWaWV3LCBkYXRhVmFsdWUsIG5hbWUsIHZhbHVlKTtcbiAgICAgIHRoaXMucHJldmlvdXNJbnB1dFZhbHVlcy5zZXQobmFtZSwgdmFsdWUpO1xuICAgICAgY29uc3QgY2hpbGRDb21wb25lbnRMVmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0aGlzLl90Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgbWFya1ZpZXdEaXJ0eShjaGlsZENvbXBvbmVudExWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBjbXBOYW1lRm9yRXJyb3IgPSBzdHJpbmdpZnlGb3JFcnJvcih0aGlzLmNvbXBvbmVudFR5cGUpO1xuICAgICAgICBsZXQgbWVzc2FnZSA9XG4gICAgICAgICAgICBgQ2FuJ3Qgc2V0IHZhbHVlIG9mIHRoZSAnJHtuYW1lfScgaW5wdXQgb24gdGhlICcke2NtcE5hbWVGb3JFcnJvcn0nIGNvbXBvbmVudC4gYDtcbiAgICAgICAgbWVzc2FnZSArPSBgTWFrZSBzdXJlIHRoYXQgdGhlICcke1xuICAgICAgICAgICAgbmFtZX0nIHByb3BlcnR5IGlzIGFubm90YXRlZCB3aXRoIEBJbnB1dCgpIG9yIGEgbWFwcGVkIEBJbnB1dCgnJHtuYW1lfScpIGV4aXN0cy5gO1xuICAgICAgICByZXBvcnRVbmtub3duUHJvcGVydHlFcnJvcihtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX3ROb2RlLCB0aGlzLl9yb290TFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmhvc3RWaWV3LmRlc3Ryb3koKTtcbiAgfVxuXG4gIG92ZXJyaWRlIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdFZpZXcub25EZXN0cm95KGNhbGxiYWNrKTtcbiAgfVxufVxuXG4vKiogUmVwcmVzZW50cyBhIEhvc3RGZWF0dXJlIGZ1bmN0aW9uLiAqL1xudHlwZSBIb3N0RmVhdHVyZSA9ICg8VD4oY29tcG9uZW50OiBULCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPikgPT4gdm9pZCk7XG5cbi8vIFRPRE86IEEgaGFjayB0byBub3QgcHVsbCBpbiB0aGUgTnVsbEluamVjdG9yIGZyb20gQGFuZ3VsYXIvY29yZS5cbmV4cG9ydCBjb25zdCBOVUxMX0lOSkVDVE9SOiBJbmplY3RvciA9IHtcbiAgZ2V0OiAodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSkgPT4ge1xuICAgIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yKHRva2VuLCAnTnVsbEluamVjdG9yJyk7XG4gIH1cbn07XG5cbi8qKiBDcmVhdGVzIGEgVE5vZGUgdGhhdCBjYW4gYmUgdXNlZCB0byBpbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudFROb2RlKGxWaWV3OiBMVmlldywgck5vZGU6IFJOb2RlKTogVEVsZW1lbnROb2RlIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGluZGV4ID0gSEVBREVSX09GRlNFVDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICBsVmlld1tpbmRleF0gPSByTm9kZTtcblxuICAvLyAnI2hvc3QnIGlzIGFkZGVkIGhlcmUgYXMgd2UgZG9uJ3Qga25vdyB0aGUgcmVhbCBob3N0IERPTSBuYW1lICh3ZSBkb24ndCB3YW50IHRvIHJlYWQgaXQpIGFuZCBhdFxuICAvLyB0aGUgc2FtZSB0aW1lIHdlIHdhbnQgdG8gY29tbXVuaWNhdGUgdGhlIGRlYnVnIGBUTm9kZWAgdGhhdCB0aGlzIGlzIGEgc3BlY2lhbCBgVE5vZGVgXG4gIC8vIHJlcHJlc2VudGluZyBhIGhvc3QgZWxlbWVudC5cbiAgcmV0dXJuIGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgJyNob3N0JywgbnVsbCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcm9vdCBjb21wb25lbnQgdmlldyBhbmQgdGhlIHJvb3QgY29tcG9uZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIGhvc3RSTm9kZSBSZW5kZXIgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIHJvb3RDb21wb25lbnREZWYgQ29tcG9uZW50RGVmXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHBhcmVudCB2aWV3IHdoZXJlIHRoZSBob3N0IG5vZGUgaXMgc3RvcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJGYWN0b3J5IEZhY3RvcnkgdG8gYmUgdXNlZCBmb3IgY3JlYXRpbmcgY2hpbGQgcmVuZGVyZXJzLlxuICogQHBhcmFtIGhvc3RSZW5kZXJlciBUaGUgY3VycmVudCByZW5kZXJlclxuICogQHBhcmFtIHNhbml0aXplciBUaGUgc2FuaXRpemVyLCBpZiBwcm92aWRlZFxuICpcbiAqIEByZXR1cm5zIENvbXBvbmVudCB2aWV3IGNyZWF0ZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSwgaG9zdFJOb2RlOiBSRWxlbWVudHxudWxsLCByb290Q29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55PixcbiAgICByb290RGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPGFueT5bXSwgcm9vdFZpZXc6IExWaWV3LCBlbnZpcm9ubWVudDogTFZpZXdFbnZpcm9ubWVudCxcbiAgICBob3N0UmVuZGVyZXI6IFJlbmRlcmVyKTogTFZpZXcge1xuICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgYXBwbHlSb290Q29tcG9uZW50U3R5bGluZyhyb290RGlyZWN0aXZlcywgdE5vZGUsIGhvc3RSTm9kZSwgaG9zdFJlbmRlcmVyKTtcblxuICAvLyBIeWRyYXRpb24gaW5mbyBpcyBvbiB0aGUgaG9zdCBlbGVtZW50IGFuZCBuZWVkcyB0byBiZSByZXRyZWl2ZWRcbiAgLy8gYW5kIHBhc3NlZCB0byB0aGUgY29tcG9uZW50IExWaWV3LlxuICBsZXQgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXd8bnVsbCA9IG51bGw7XG4gIGlmIChob3N0Uk5vZGUgIT09IG51bGwpIHtcbiAgICBoeWRyYXRpb25JbmZvID0gcmV0cmlldmVIeWRyYXRpb25JbmZvKGhvc3RSTm9kZSwgcm9vdFZpZXdbSU5KRUNUT1JdISk7XG4gIH1cbiAgY29uc3Qgdmlld1JlbmRlcmVyID0gZW52aXJvbm1lbnQucmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3RSTm9kZSwgcm9vdENvbXBvbmVudERlZik7XG4gIGxldCBsVmlld0ZsYWdzID0gTFZpZXdGbGFncy5DaGVja0Fsd2F5cztcbiAgaWYgKHJvb3RDb21wb25lbnREZWYuc2lnbmFscykge1xuICAgIGxWaWV3RmxhZ3MgPSBMVmlld0ZsYWdzLlNpZ25hbFZpZXc7XG4gIH0gZWxzZSBpZiAocm9vdENvbXBvbmVudERlZi5vblB1c2gpIHtcbiAgICBsVmlld0ZsYWdzID0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICByb290VmlldywgZ2V0T3JDcmVhdGVDb21wb25lbnRUVmlldyhyb290Q29tcG9uZW50RGVmKSwgbnVsbCwgbFZpZXdGbGFncyxcbiAgICAgIHJvb3RWaWV3W3ROb2RlLmluZGV4XSwgdE5vZGUsIGVudmlyb25tZW50LCB2aWV3UmVuZGVyZXIsIG51bGwsIG51bGwsIGh5ZHJhdGlvbkluZm8pO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3LCB0Tm9kZSwgcm9vdERpcmVjdGl2ZXMubGVuZ3RoIC0gMSk7XG4gIH1cblxuICBhZGRUb1ZpZXdUcmVlKHJvb3RWaWV3LCBjb21wb25lbnRWaWV3KTtcblxuICAvLyBTdG9yZSBjb21wb25lbnQgdmlldyBhdCBub2RlIGluZGV4LCB3aXRoIG5vZGUgYXMgdGhlIEhPU1RcbiAgcmV0dXJuIHJvb3RWaWV3W3ROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbi8qKiBTZXRzIHVwIHRoZSBzdHlsaW5nIGluZm9ybWF0aW9uIG9uIGEgcm9vdCBjb21wb25lbnQuICovXG5mdW5jdGlvbiBhcHBseVJvb3RDb21wb25lbnRTdHlsaW5nKFxuICAgIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLCB0Tm9kZTogVEVsZW1lbnROb2RlLCByTm9kZTogUkVsZW1lbnR8bnVsbCxcbiAgICBob3N0UmVuZGVyZXI6IFJlbmRlcmVyKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZGVmIG9mIHJvb3REaXJlY3RpdmVzKSB7XG4gICAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgZGVmLmhvc3RBdHRycyk7XG4gIH1cblxuICBpZiAodE5vZGUubWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBjb21wdXRlU3RhdGljU3R5bGluZyh0Tm9kZSwgdE5vZGUubWVyZ2VkQXR0cnMsIHRydWUpO1xuXG4gICAgaWYgKHJOb2RlICE9PSBudWxsKSB7XG4gICAgICBzZXR1cFN0YXRpY0F0dHJpYnV0ZXMoaG9zdFJlbmRlcmVyLCByTm9kZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSByb290IGNvbXBvbmVudCBhbmQgc2V0cyBpdCB1cCB3aXRoIGZlYXR1cmVzIGFuZCBob3N0IGJpbmRpbmdzLlNoYXJlZCBieVxuICogcmVuZGVyQ29tcG9uZW50KCkgYW5kIFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KCkuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gICAgY29tcG9uZW50VmlldzogTFZpZXcsIHJvb3RDb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPiwgcm9vdERpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10sXG4gICAgaG9zdERpcmVjdGl2ZURlZnM6IEhvc3REaXJlY3RpdmVEZWZzfG51bGwsIHJvb3RMVmlldzogTFZpZXcsXG4gICAgaG9zdEZlYXR1cmVzOiBIb3N0RmVhdHVyZVtdfG51bGwpOiBhbnkge1xuICBjb25zdCByb290VE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHJvb3RUTm9kZSwgJ3ROb2RlIHNob3VsZCBoYXZlIGJlZW4gYWxyZWFkeSBjcmVhdGVkJyk7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdExWaWV3W1RWSUVXXTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShyb290VE5vZGUsIHJvb3RMVmlldyk7XG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXModFZpZXcsIHJvb3RMVmlldywgcm9vdFROb2RlLCByb290RGlyZWN0aXZlcywgbnVsbCwgaG9zdERpcmVjdGl2ZURlZnMpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdERpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IHJvb3RUTm9kZS5kaXJlY3RpdmVTdGFydCArIGk7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5zdGFuY2UgPSBnZXROb2RlSW5qZWN0YWJsZShyb290TFZpZXcsIHRWaWV3LCBkaXJlY3RpdmVJbmRleCwgcm9vdFROb2RlKTtcbiAgICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlSW5zdGFuY2UsIHJvb3RMVmlldyk7XG4gIH1cblxuICBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3LCByb290TFZpZXcsIHJvb3RUTm9kZSk7XG5cbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHJvb3RMVmlldyk7XG4gIH1cblxuICAvLyBXZSdyZSBndWFyYW50ZWVkIGZvciB0aGUgYGNvbXBvbmVudE9mZnNldGAgdG8gYmUgcG9zaXRpdmUgaGVyZVxuICAvLyBzaW5jZSBhIHJvb3QgY29tcG9uZW50IGFsd2F5cyBtYXRjaGVzIGEgY29tcG9uZW50IGRlZi5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbihyb290VE5vZGUuY29tcG9uZW50T2Zmc2V0LCAtMSwgJ2NvbXBvbmVudE9mZnNldCBtdXN0IGJlIGdyZWF0IHRoYW4gLTEnKTtcbiAgY29uc3QgY29tcG9uZW50ID0gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgICByb290TFZpZXcsIHRWaWV3LCByb290VE5vZGUuZGlyZWN0aXZlU3RhcnQgKyByb290VE5vZGUuY29tcG9uZW50T2Zmc2V0LCByb290VE5vZGUpO1xuICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gcm9vdExWaWV3W0NPTlRFWFRdID0gY29tcG9uZW50O1xuXG4gIGlmIChob3N0RmVhdHVyZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgaG9zdEZlYXR1cmVzKSB7XG4gICAgICBmZWF0dXJlKGNvbXBvbmVudCwgcm9vdENvbXBvbmVudERlZik7XG4gICAgfVxuICB9XG5cbiAgLy8gV2Ugd2FudCB0byBnZW5lcmF0ZSBhbiBlbXB0eSBRdWVyeUxpc3QgZm9yIHJvb3QgY29udGVudCBxdWVyaWVzIGZvciBiYWNrd2FyZHNcbiAgLy8gY29tcGF0aWJpbGl0eSB3aXRoIFZpZXdFbmdpbmUuXG4gIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0Vmlldywgcm9vdFROb2RlLCBjb21wb25lbnRWaWV3KTtcblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG4vKiogU2V0cyB0aGUgc3RhdGljIGF0dHJpYnV0ZXMgb24gYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIHNldFJvb3ROb2RlQXR0cmlidXRlcyhcbiAgICBob3N0UmVuZGVyZXI6IFJlbmRlcmVyMiwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8dW5rbm93bj4sIGhvc3RSTm9kZTogUkVsZW1lbnQsXG4gICAgcm9vdFNlbGVjdG9yT3JOb2RlOiBhbnkpIHtcbiAgaWYgKHJvb3RTZWxlY3Rvck9yTm9kZSkge1xuICAgIHNldFVwQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgWyduZy12ZXJzaW9uJywgVkVSU0lPTi5mdWxsXSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWYgaG9zdCBlbGVtZW50IGlzIGNyZWF0ZWQgYXMgYSBwYXJ0IG9mIHRoaXMgZnVuY3Rpb24gY2FsbCAoaS5lLiBgcm9vdFNlbGVjdG9yT3JOb2RlYFxuICAgIC8vIGlzIG5vdCBkZWZpbmVkKSwgYWxzbyBhcHBseSBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGV4dHJhY3RlZCBmcm9tIGNvbXBvbmVudCBzZWxlY3Rvci5cbiAgICAvLyBFeHRyYWN0IGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgZnJvbSB0aGUgZmlyc3Qgc2VsZWN0b3Igb25seSB0byBtYXRjaCBWRSBiZWhhdmlvci5cbiAgICBjb25zdCB7YXR0cnMsIGNsYXNzZXN9ID0gZXh0cmFjdEF0dHJzQW5kQ2xhc3Nlc0Zyb21TZWxlY3Rvcihjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdKTtcbiAgICBpZiAoYXR0cnMpIHtcbiAgICAgIHNldFVwQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgYXR0cnMpO1xuICAgIH1cbiAgICBpZiAoY2xhc3NlcyAmJiBjbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIHdyaXRlRGlyZWN0Q2xhc3MoaG9zdFJlbmRlcmVyLCBob3N0Uk5vZGUsIGNsYXNzZXMuam9pbignICcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFByb2plY3RzIHRoZSBgcHJvamVjdGFibGVOb2Rlc2AgdGhhdCB3ZXJlIHNwZWNpZmllZCB3aGVuIGNyZWF0aW5nIGEgcm9vdCBjb21wb25lbnQuICovXG5mdW5jdGlvbiBwcm9qZWN0Tm9kZXMoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSwgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXSwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSkge1xuICBjb25zdCBwcm9qZWN0aW9uOiAoVE5vZGV8Uk5vZGVbXXxudWxsKVtdID0gdE5vZGUucHJvamVjdGlvbiA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5nQ29udGVudFNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVzZm9yU2xvdCA9IHByb2plY3RhYmxlTm9kZXNbaV07XG4gICAgLy8gUHJvamVjdGFibGUgbm9kZXMgY2FuIGJlIHBhc3NlZCBhcyBhcnJheSBvZiBhcnJheXMgb3IgYW4gYXJyYXkgb2YgaXRlcmFibGVzIChuZ1VwZ3JhZGVcbiAgICAvLyBjYXNlKS4gSGVyZSB3ZSBkbyBub3JtYWxpemUgcGFzc2VkIGRhdGEgc3RydWN0dXJlIHRvIGJlIGFuIGFycmF5IG9mIGFycmF5cyB0byBhdm9pZFxuICAgIC8vIGNvbXBsZXggY2hlY2tzIGRvd24gdGhlIGxpbmUuXG4gICAgLy8gV2UgYWxzbyBub3JtYWxpemUgdGhlIGxlbmd0aCBvZiB0aGUgcGFzc2VkIGluIHByb2plY3RhYmxlIG5vZGVzICh0byBtYXRjaCB0aGUgbnVtYmVyIG9mXG4gICAgLy8gPG5nLWNvbnRhaW5lcj4gc2xvdHMgZGVmaW5lZCBieSBhIGNvbXBvbmVudCkuXG4gICAgcHJvamVjdGlvbi5wdXNoKG5vZGVzZm9yU2xvdCAhPSBudWxsID8gQXJyYXkuZnJvbShub2Rlc2ZvclNsb3QpIDogbnVsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIGVuYWJsZSBsaWZlY3ljbGUgaG9va3Mgb24gdGhlIHJvb3QgY29tcG9uZW50LlxuICpcbiAqIEluY2x1ZGUgdGhpcyBmZWF0dXJlIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBpZiB0aGUgcm9vdCBjb21wb25lbnRcbiAqIHlvdSBhcmUgcmVuZGVyaW5nIGhhcyBsaWZlY3ljbGUgaG9va3MgZGVmaW5lZC4gT3RoZXJ3aXNlLCB0aGUgaG9va3Mgd29uJ3RcbiAqIGJlIGNhbGxlZCBwcm9wZXJseS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogcmVuZGVyQ29tcG9uZW50KEFwcENvbXBvbmVudCwge2hvc3RGZWF0dXJlczogW0xpZmVjeWNsZUhvb2tzRmVhdHVyZV19KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKCk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdUTm9kZSBpcyByZXF1aXJlZCcpO1xuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKGdldExWaWV3KClbVFZJRVddLCB0Tm9kZSk7XG59XG4iXX0=