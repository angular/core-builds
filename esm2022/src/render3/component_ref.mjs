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
export class ChainedInjector {
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
        const componentDef = this.componentDef;
        const inputTransforms = componentDef.inputTransforms;
        const refArray = toRefArray(componentDef.inputs);
        if (inputTransforms !== null) {
            for (const input of refArray) {
                if (inputTransforms.hasOwnProperty(input.propName)) {
                    input.transform = inputTransforms[input.propName];
                }
            }
        }
        return refArray;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUcvRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUV6RCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV6RCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksd0JBQXdCLEVBQUUsWUFBWSxJQUFJLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDL0gsT0FBTyxFQUFDLHdCQUF3QixJQUFJLGdDQUFnQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLGdCQUFnQixFQUFhLE1BQU0sdUJBQXVCLENBQUM7QUFFbkUsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEYsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUMscUNBQXFDLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUU3RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0Ms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QU8sSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNqQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUM5RDtLQUNGO0FBQ0gsQ0FBQztBQUVELDBGQUEwRjtBQUMxRixTQUFTLFlBQVksQ0FDakIsS0FBbUIsRUFBRSxrQkFBNEIsRUFBRSxnQkFBeUI7SUFDOUUsTUFBTSxVQUFVLEdBQTJCLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ2pFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDbEQsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekMseUZBQXlGO1FBQ3pGLHNGQUFzRjtRQUN0RixnQ0FBZ0M7UUFDaEMsMEZBQTBGO1FBQzFGLGdEQUFnRDtRQUNoRCxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3pFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxxQkFBcUI7SUFDbkMsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUN2RCxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge2NvbnZlcnRUb0JpdEZsYWdzfSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdE9wdGlvbnN9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge1Byb3ZpZGVyVG9rZW59IGZyb20gJy4uL2RpL3Byb3ZpZGVyX3Rva2VuJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge0RlaHlkcmF0ZWRWaWV3fSBmcm9tICcuLi9oeWRyYXRpb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQge3JldHJpZXZlSHlkcmF0aW9uSW5mb30gZnJvbSAnLi4vaHlkcmF0aW9uL3V0aWxzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIEFic3RyYWN0Q29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIEVsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0SW5kZXhJblJhbmdlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge1ZFUlNJT059IGZyb20gJy4uL3ZlcnNpb24nO1xuaW1wb3J0IHtOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SfSBmcm9tICcuLi92aWV3L3Byb3ZpZGVyX2ZsYWdzJztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0Tm9kZUluamVjdGFibGUsIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3Rocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yfSBmcm9tICcuL2Vycm9yc19kaSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtyZXBvcnRVbmtub3duUHJvcGVydHlFcnJvcn0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uJztcbmltcG9ydCB7bWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvbWFya192aWV3X2RpcnR5JztcbmltcG9ydCB7cmVuZGVyVmlld30gZnJvbSAnLi9pbnN0cnVjdGlvbnMvcmVuZGVyJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlTFZpZXcsIGNyZWF0ZVRWaWV3LCBleGVjdXRlQ29udGVudFF1ZXJpZXMsIGdldE9yQ3JlYXRlQ29tcG9uZW50VFZpZXcsIGdldE9yQ3JlYXRlVE5vZGUsIGluaXRpYWxpemVEaXJlY3RpdmVzLCBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzLCBsb2NhdGVIb3N0RWxlbWVudCwgbWFya0FzQ29tcG9uZW50SG9zdCwgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmLCBIb3N0RGlyZWN0aXZlRGVmc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzVmFsdWUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0Vudmlyb25tZW50LCBMVmlld0ZsYWdzLCBUVklFVywgVFZpZXdUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge01BVEhfTUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFfSBmcm9tICcuL25hbWVzcGFjZXMnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50Tm9kZSwgc2V0dXBTdGF0aWNBdHRyaWJ1dGVzLCB3cml0ZURpcmVjdENsYXNzfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7ZXh0cmFjdEF0dHJzQW5kQ2xhc3Nlc0Zyb21TZWxlY3Rvciwgc3RyaW5naWZ5Q1NTU2VsZWN0b3JMaXN0fSBmcm9tICcuL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge0VmZmVjdE1hbmFnZXJ9IGZyb20gJy4vcmVhY3Rpdml0eS9lZmZlY3QnO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGxlYXZlVmlld30gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2NvbXB1dGVTdGF0aWNTdHlsaW5nfSBmcm9tICcuL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcnO1xuaW1wb3J0IHttZXJnZUhvc3RBdHRycywgc2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Um9vdFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICAvKipcbiAgICogQHBhcmFtIG5nTW9kdWxlIFRoZSBOZ01vZHVsZVJlZiB0byB3aGljaCBhbGwgcmVzb2x2ZWQgZmFjdG9yaWVzIGFyZSBib3VuZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbmdNb2R1bGU/OiBOZ01vZHVsZVJlZjxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHJlc29sdmVDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeTxUPiB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50KTtcbiAgICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29tcG9uZW50KSE7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy5uZ01vZHVsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBnZXROYW1lc3BhY2UoZWxlbWVudE5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgbmFtZSA9IGVsZW1lbnROYW1lLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBuYW1lID09PSAnc3ZnJyA/IFNWR19OQU1FU1BBQ0UgOiAobmFtZSA9PT0gJ21hdGgnID8gTUFUSF9NTF9OQU1FU1BBQ0UgOiBudWxsKTtcbn1cblxuLyoqXG4gKiBJbmplY3RvciB0aGF0IGxvb2tzIHVwIGEgdmFsdWUgdXNpbmcgYSBzcGVjaWZpYyBpbmplY3RvciwgYmVmb3JlIGZhbGxpbmcgYmFjayB0byB0aGUgbW9kdWxlXG4gKiBpbmplY3Rvci4gVXNlZCBwcmltYXJpbHkgd2hlbiBjcmVhdGluZyBjb21wb25lbnRzIG9yIGVtYmVkZGVkIHZpZXdzIGR5bmFtaWNhbGx5LlxuICovXG5leHBvcnQgY2xhc3MgQ2hhaW5lZEluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgaW5qZWN0b3I6IEluamVjdG9yLCBwdWJsaWMgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3N8SW5qZWN0T3B0aW9ucyk6IFQge1xuICAgIGZsYWdzID0gY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpO1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5pbmplY3Rvci5nZXQ8VHx0eXBlb2YgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUj4oXG4gICAgICAgIHRva2VuLCBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SLCBmbGFncyk7XG5cbiAgICBpZiAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgfHxcbiAgICAgICAgbm90Rm91bmRWYWx1ZSA9PT0gKE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgYXMgdW5rbm93biBhcyBUKSkge1xuICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgICAgLy8gLSBpdCBwcm92aWRlcyBpdFxuICAgICAgLy8gICAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAvLyAtIHRoZSBtb2R1bGUgaW5qZWN0b3Igc2hvdWxkIG5vdCBiZSBjaGVja2VkXG4gICAgICAvLyAgIChub3RGb3VuZFZhbHVlID09PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKVxuICAgICAgcmV0dXJuIHZhbHVlIGFzIFQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucGFyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21wb25lbnRGYWN0b3J5IGludGVyZmFjZSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8VD4gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICBvdmVycmlkZSBzZWxlY3Rvcjogc3RyaW5nO1xuICBvdmVycmlkZSBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIG92ZXJyaWRlIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG4gIGlzQm91bmRUb01vZHVsZTogYm9vbGVhbjtcblxuICBvdmVycmlkZSBnZXQgaW5wdXRzKCk6IHtcbiAgICBwcm9wTmFtZTogc3RyaW5nLFxuICAgIHRlbXBsYXRlTmFtZTogc3RyaW5nLFxuICAgIHRyYW5zZm9ybT86ICh2YWx1ZTogYW55KSA9PiBhbnksXG4gIH1bXSB7XG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gdGhpcy5jb21wb25lbnREZWY7XG4gICAgY29uc3QgaW5wdXRUcmFuc2Zvcm1zID0gY29tcG9uZW50RGVmLmlucHV0VHJhbnNmb3JtcztcbiAgICBjb25zdCByZWZBcnJheSA9IHRvUmVmQXJyYXkoY29tcG9uZW50RGVmLmlucHV0cykgYXMge1xuICAgICAgcHJvcE5hbWU6IHN0cmluZyxcbiAgICAgIHRlbXBsYXRlTmFtZTogc3RyaW5nLFxuICAgICAgdHJhbnNmb3JtPzogKHZhbHVlOiBhbnkpID0+IGFueSxcbiAgICB9W107XG5cbiAgICBpZiAoaW5wdXRUcmFuc2Zvcm1zICE9PSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IGlucHV0IG9mIHJlZkFycmF5KSB7XG4gICAgICAgIGlmIChpbnB1dFRyYW5zZm9ybXMuaGFzT3duUHJvcGVydHkoaW5wdXQucHJvcE5hbWUpKSB7XG4gICAgICAgICAgaW5wdXQudHJhbnNmb3JtID0gaW5wdXRUcmFuc2Zvcm1zW2lucHV0LnByb3BOYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZWZBcnJheTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBvdXRwdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLm91dHB1dHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBjb21wb25lbnREZWYgVGhlIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIHRoZSBmYWN0b3J5IGlzIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxhbnk+LCBwcml2YXRlIG5nTW9kdWxlPzogTmdNb2R1bGVSZWY8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG4gICAgdGhpcy5zZWxlY3RvciA9IHN0cmluZ2lmeUNTU1NlbGVjdG9yTGlzdChjb21wb25lbnREZWYuc2VsZWN0b3JzKTtcbiAgICB0aGlzLm5nQ29udGVudFNlbGVjdG9ycyA9XG4gICAgICAgIGNvbXBvbmVudERlZi5uZ0NvbnRlbnRTZWxlY3RvcnMgPyBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzIDogW107XG4gICAgdGhpcy5pc0JvdW5kVG9Nb2R1bGUgPSAhIW5nTW9kdWxlO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlKFxuICAgICAgaW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsIHJvb3RTZWxlY3Rvck9yTm9kZT86IGFueSxcbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBOZ01vZHVsZVJlZjxhbnk+fEVudmlyb25tZW50SW5qZWN0b3J8XG4gICAgICB1bmRlZmluZWQpOiBBYnN0cmFjdENvbXBvbmVudFJlZjxUPiB7XG4gICAgZW52aXJvbm1lbnRJbmplY3RvciA9IGVudmlyb25tZW50SW5qZWN0b3IgfHwgdGhpcy5uZ01vZHVsZTtcblxuICAgIGxldCByZWFsRW52aXJvbm1lbnRJbmplY3RvciA9IGVudmlyb25tZW50SW5qZWN0b3IgaW5zdGFuY2VvZiBFbnZpcm9ubWVudEluamVjdG9yID9cbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3RvciA6XG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/LmluamVjdG9yO1xuXG4gICAgaWYgKHJlYWxFbnZpcm9ubWVudEluamVjdG9yICYmIHRoaXMuY29tcG9uZW50RGVmLmdldFN0YW5kYWxvbmVJbmplY3RvciAhPT0gbnVsbCkge1xuICAgICAgcmVhbEVudmlyb25tZW50SW5qZWN0b3IgPSB0aGlzLmNvbXBvbmVudERlZi5nZXRTdGFuZGFsb25lSW5qZWN0b3IocmVhbEVudmlyb25tZW50SW5qZWN0b3IpIHx8XG4gICAgICAgICAgcmVhbEVudmlyb25tZW50SW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdFZpZXdJbmplY3RvciA9XG4gICAgICAgIHJlYWxFbnZpcm9ubWVudEluamVjdG9yID8gbmV3IENoYWluZWRJbmplY3RvcihpbmplY3RvciwgcmVhbEVudmlyb25tZW50SW5qZWN0b3IpIDogaW5qZWN0b3I7XG5cbiAgICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSByb290Vmlld0luamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyLCBudWxsKTtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5ID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUkVOREVSRVJfTk9UX0ZPVU5ELFxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAnQW5ndWxhciB3YXMgbm90IGFibGUgdG8gaW5qZWN0IGEgcmVuZGVyZXIgKFJlbmRlcmVyRmFjdG9yeTIpLiAnICtcbiAgICAgICAgICAgICAgICAgICdMaWtlbHkgdGhpcyBpcyBkdWUgdG8gYSBicm9rZW4gREkgaGllcmFyY2h5LiAnICtcbiAgICAgICAgICAgICAgICAgICdNYWtlIHN1cmUgdGhhdCBhbnkgaW5qZWN0b3IgdXNlZCB0byBjcmVhdGUgdGhpcyBjb21wb25lbnQgaGFzIGEgY29ycmVjdCBwYXJlbnQuJyk7XG4gICAgfVxuICAgIGNvbnN0IHNhbml0aXplciA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KFNhbml0aXplciwgbnVsbCk7XG5cbiAgICBjb25zdCBlZmZlY3RNYW5hZ2VyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoRWZmZWN0TWFuYWdlciwgbnVsbCk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudDogTFZpZXdFbnZpcm9ubWVudCA9IHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeSxcbiAgICAgIHNhbml0aXplcixcbiAgICAgIGVmZmVjdE1hbmFnZXIsXG4gICAgfTtcblxuICAgIGNvbnN0IGhvc3RSZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZik7XG4gICAgLy8gRGV0ZXJtaW5lIGEgdGFnIG5hbWUgdXNlZCBmb3IgY3JlYXRpbmcgaG9zdCBlbGVtZW50cyB3aGVuIHRoaXMgY29tcG9uZW50IGlzIGNyZWF0ZWRcbiAgICAvLyBkeW5hbWljYWxseS4gRGVmYXVsdCB0byAnZGl2JyBpZiB0aGlzIGNvbXBvbmVudCBkaWQgbm90IHNwZWNpZnkgYW55IHRhZyBuYW1lIGluIGl0cyBzZWxlY3Rvci5cbiAgICBjb25zdCBlbGVtZW50TmFtZSA9IHRoaXMuY29tcG9uZW50RGVmLnNlbGVjdG9yc1swXVswXSBhcyBzdHJpbmcgfHwgJ2Rpdic7XG4gICAgY29uc3QgaG9zdFJOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlID9cbiAgICAgICAgbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgICAgICAgICBob3N0UmVuZGVyZXIsIHJvb3RTZWxlY3Rvck9yTm9kZSwgdGhpcy5jb21wb25lbnREZWYuZW5jYXBzdWxhdGlvbiwgcm9vdFZpZXdJbmplY3RvcikgOlxuICAgICAgICBjcmVhdGVFbGVtZW50Tm9kZShob3N0UmVuZGVyZXIsIGVsZW1lbnROYW1lLCBnZXROYW1lc3BhY2UoZWxlbWVudE5hbWUpKTtcblxuICAgIC8vIFNpZ25hbCBjb21wb25lbnRzIHVzZSB0aGUgZ3JhbnVsYXIgXCJSZWZyZXNoVmlld1wiICBmb3IgY2hhbmdlIGRldGVjdGlvblxuICAgIGNvbnN0IHNpZ25hbEZsYWdzID0gKExWaWV3RmxhZ3MuU2lnbmFsVmlldyB8IExWaWV3RmxhZ3MuSXNSb290KTtcbiAgICAvLyBOb24tc2lnbmFsIGNvbXBvbmVudHMgdXNlIHRoZSB0cmFkaXRpb25hbCBcIkNoZWNrQWx3YXlzIG9yIE9uUHVzaC9EaXJ0eVwiIGNoYW5nZSBkZXRlY3Rpb25cbiAgICBjb25zdCBub25TaWduYWxGbGFncyA9IHRoaXMuY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLklzUm9vdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG4gICAgY29uc3Qgcm9vdEZsYWdzID0gdGhpcy5jb21wb25lbnREZWYuc2lnbmFscyA/IHNpZ25hbEZsYWdzIDogbm9uU2lnbmFsRmxhZ3M7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHJvb3Qgdmlldy4gVXNlcyBlbXB0eSBUVmlldyBhbmQgQ29udGVudFRlbXBsYXRlLlxuICAgIGNvbnN0IHJvb3RUVmlldyA9XG4gICAgICAgIGNyZWF0ZVRWaWV3KFRWaWV3VHlwZS5Sb290LCBudWxsLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICBjb25zdCByb290TFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgbnVsbCwgcm9vdFRWaWV3LCBudWxsLCByb290RmxhZ3MsIG51bGwsIG51bGwsIGVudmlyb25tZW50LCBob3N0UmVuZGVyZXIsIHJvb3RWaWV3SW5qZWN0b3IsXG4gICAgICAgIG51bGwsIG51bGwpO1xuXG4gICAgLy8gcm9vdFZpZXcgaXMgdGhlIHBhcmVudCB3aGVuIGJvb3RzdHJhcHBpbmdcbiAgICAvLyBUT0RPKG1pc2tvKTogaXQgbG9va3MgbGlrZSB3ZSBhcmUgZW50ZXJpbmcgdmlldyBoZXJlIGJ1dCB3ZSBkb24ndCByZWFsbHkgbmVlZCB0byBhc1xuICAgIC8vIGByZW5kZXJWaWV3YCBkb2VzIHRoYXQuIEhvd2V2ZXIgYXMgdGhlIGNvZGUgaXMgd3JpdHRlbiBpdCBpcyBuZWVkZWQgYmVjYXVzZVxuICAgIC8vIGBjcmVhdGVSb290Q29tcG9uZW50Vmlld2AgYW5kIGBjcmVhdGVSb290Q29tcG9uZW50YCBib3RoIHJlYWQgZ2xvYmFsIHN0YXRlLiBGaXhpbmcgdGhvc2VcbiAgICAvLyBpc3N1ZXMgd291bGQgYWxsb3cgdXMgdG8gZHJvcCB0aGlzLlxuICAgIGVudGVyVmlldyhyb290TFZpZXcpO1xuXG4gICAgbGV0IGNvbXBvbmVudDogVDtcbiAgICBsZXQgdEVsZW1lbnROb2RlOiBURWxlbWVudE5vZGU7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgcm9vdENvbXBvbmVudERlZiA9IHRoaXMuY29tcG9uZW50RGVmO1xuICAgICAgbGV0IHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXTtcbiAgICAgIGxldCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCA9IG51bGw7XG5cbiAgICAgIGlmIChyb290Q29tcG9uZW50RGVmLmZpbmRIb3N0RGlyZWN0aXZlRGVmcykge1xuICAgICAgICByb290RGlyZWN0aXZlcyA9IFtdO1xuICAgICAgICBob3N0RGlyZWN0aXZlRGVmcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgcm9vdENvbXBvbmVudERlZi5maW5kSG9zdERpcmVjdGl2ZURlZnMocm9vdENvbXBvbmVudERlZiwgcm9vdERpcmVjdGl2ZXMsIGhvc3REaXJlY3RpdmVEZWZzKTtcbiAgICAgICAgcm9vdERpcmVjdGl2ZXMucHVzaChyb290Q29tcG9uZW50RGVmKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3REaXJlY3RpdmVzID0gW3Jvb3RDb21wb25lbnREZWZdO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBob3N0VE5vZGUgPSBjcmVhdGVSb290Q29tcG9uZW50VE5vZGUocm9vdExWaWV3LCBob3N0Uk5vZGUpO1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgICAgICAgIGhvc3RUTm9kZSwgaG9zdFJOb2RlLCByb290Q29tcG9uZW50RGVmLCByb290RGlyZWN0aXZlcywgcm9vdExWaWV3LCBlbnZpcm9ubWVudCxcbiAgICAgICAgICBob3N0UmVuZGVyZXIpO1xuXG4gICAgICB0RWxlbWVudE5vZGUgPSBnZXRUTm9kZShyb290VFZpZXcsIEhFQURFUl9PRkZTRVQpIGFzIFRFbGVtZW50Tm9kZTtcblxuICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IGluIHByYWN0aWNlIGBob3N0Uk5vZGVgIHNob3VsZCBhbHdheXMgYmUgZGVmaW5lZCwgYnV0IHRoZXJlIGFyZSBzb21lIHRlc3RzXG4gICAgICAvLyB3aGVyZSB0aGUgcmVuZGVyZXIgaXMgbW9ja2VkIG91dCBhbmQgYHVuZGVmaW5lZGAgaXMgcmV0dXJuZWQuIFdlIHNob3VsZCB1cGRhdGUgdGhlIHRlc3RzIHNvXG4gICAgICAvLyB0aGF0IHRoaXMgY2hlY2sgY2FuIGJlIHJlbW92ZWQuXG4gICAgICBpZiAoaG9zdFJOb2RlKSB7XG4gICAgICAgIHNldFJvb3ROb2RlQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIHJvb3RDb21wb25lbnREZWYsIGhvc3RSTm9kZSwgcm9vdFNlbGVjdG9yT3JOb2RlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb2plY3RhYmxlTm9kZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm9qZWN0Tm9kZXModEVsZW1lbnROb2RlLCB0aGlzLm5nQ29udGVudFNlbGVjdG9ycywgcHJvamVjdGFibGVOb2Rlcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsIHJvb3RDb21wb25lbnREZWYsIHJvb3REaXJlY3RpdmVzLCBob3N0RGlyZWN0aXZlRGVmcywgcm9vdExWaWV3LFxuICAgICAgICAgIFtMaWZlY3ljbGVIb29rc0ZlYXR1cmVdKTtcbiAgICAgIHJlbmRlclZpZXcocm9vdFRWaWV3LCByb290TFZpZXcsIG51bGwpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBsZWF2ZVZpZXcoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IENvbXBvbmVudFJlZihcbiAgICAgICAgdGhpcy5jb21wb25lbnRUeXBlLCBjb21wb25lbnQsIGNyZWF0ZUVsZW1lbnRSZWYodEVsZW1lbnROb2RlLCByb290TFZpZXcpLCByb290TFZpZXcsXG4gICAgICAgIHRFbGVtZW50Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRSZWY8VD4ge1xuICBvdmVycmlkZSBpbnN0YW5jZTogVDtcbiAgb3ZlcnJpZGUgaG9zdFZpZXc6IFZpZXdSZWY8VD47XG4gIG92ZXJyaWRlIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcbiAgb3ZlcnJpZGUgY29tcG9uZW50VHlwZTogVHlwZTxUPjtcbiAgcHJpdmF0ZSBwcmV2aW91c0lucHV0VmFsdWVzOiBNYXA8c3RyaW5nLCB1bmtub3duPnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbXBvbmVudFR5cGU6IFR5cGU8VD4sIGluc3RhbmNlOiBULCBwdWJsaWMgbG9jYXRpb246IEVsZW1lbnRSZWYsIHByaXZhdGUgX3Jvb3RMVmlldzogTFZpZXcsXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgIHRoaXMuaG9zdFZpZXcgPSB0aGlzLmNoYW5nZURldGVjdG9yUmVmID0gbmV3IFJvb3RWaWV3UmVmPFQ+KF9yb290TFZpZXcpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudFR5cGU7XG4gIH1cblxuICBvdmVycmlkZSBzZXRJbnB1dChuYW1lOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKTogdm9pZCB7XG4gICAgY29uc3QgaW5wdXREYXRhID0gdGhpcy5fdE5vZGUuaW5wdXRzO1xuICAgIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gICAgaWYgKGlucHV0RGF0YSAhPT0gbnVsbCAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW25hbWVdKSkge1xuICAgICAgdGhpcy5wcmV2aW91c0lucHV0VmFsdWVzID8/PSBuZXcgTWFwKCk7XG4gICAgICAvLyBEbyBub3Qgc2V0IHRoZSBpbnB1dCBpZiBpdCBpcyB0aGUgc2FtZSBhcyB0aGUgbGFzdCB2YWx1ZVxuICAgICAgLy8gVGhpcyBiZWhhdmlvciBtYXRjaGVzIGBiaW5kaW5nVXBkYXRlZGAgd2hlbiBiaW5kaW5nIGlucHV0cyBpbiB0ZW1wbGF0ZXMuXG4gICAgICBpZiAodGhpcy5wcmV2aW91c0lucHV0VmFsdWVzLmhhcyhuYW1lKSAmJlxuICAgICAgICAgIE9iamVjdC5pcyh0aGlzLnByZXZpb3VzSW5wdXRWYWx1ZXMuZ2V0KG5hbWUpLCB2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsVmlldyA9IHRoaXMuX3Jvb3RMVmlldztcbiAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3W1RWSUVXXSwgbFZpZXcsIGRhdGFWYWx1ZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgdGhpcy5wcmV2aW91c0lucHV0VmFsdWVzLnNldChuYW1lLCB2YWx1ZSk7XG4gICAgICBjb25zdCBjaGlsZENvbXBvbmVudExWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHRoaXMuX3ROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgICBtYXJrVmlld0RpcnR5KGNoaWxkQ29tcG9uZW50TFZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGNvbnN0IGNtcE5hbWVGb3JFcnJvciA9IHN0cmluZ2lmeUZvckVycm9yKHRoaXMuY29tcG9uZW50VHlwZSk7XG4gICAgICAgIGxldCBtZXNzYWdlID1cbiAgICAgICAgICAgIGBDYW4ndCBzZXQgdmFsdWUgb2YgdGhlICcke25hbWV9JyBpbnB1dCBvbiB0aGUgJyR7Y21wTmFtZUZvckVycm9yfScgY29tcG9uZW50LiBgO1xuICAgICAgICBtZXNzYWdlICs9IGBNYWtlIHN1cmUgdGhhdCB0aGUgJyR7XG4gICAgICAgICAgICBuYW1lfScgcHJvcGVydHkgaXMgYW5ub3RhdGVkIHdpdGggQElucHV0KCkgb3IgYSBtYXBwZWQgQElucHV0KCcke25hbWV9JykgZXhpc3RzLmA7XG4gICAgICAgIHJlcG9ydFVua25vd25Qcm9wZXJ0eUVycm9yKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodGhpcy5fdE5vZGUsIHRoaXMuX3Jvb3RMVmlldyk7XG4gIH1cblxuICBvdmVycmlkZSBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdFZpZXcuZGVzdHJveSgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5ob3N0Vmlldy5vbkRlc3Ryb3koY2FsbGJhY2spO1xuICB9XG59XG5cbi8qKiBSZXByZXNlbnRzIGEgSG9zdEZlYXR1cmUgZnVuY3Rpb24uICovXG50eXBlIEhvc3RGZWF0dXJlID0gKDxUPihjb21wb25lbnQ6IFQsIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+KSA9PiB2b2lkKTtcblxuLy8gVE9ETzogQSBoYWNrIHRvIG5vdCBwdWxsIGluIHRoZSBOdWxsSW5qZWN0b3IgZnJvbSBAYW5ndWxhci9jb3JlLlxuZXhwb3J0IGNvbnN0IE5VTExfSU5KRUNUT1I6IEluamVjdG9yID0ge1xuICBnZXQ6ICh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KSA9PiB7XG4gICAgdGhyb3dQcm92aWRlck5vdEZvdW5kRXJyb3IodG9rZW4sICdOdWxsSW5qZWN0b3InKTtcbiAgfVxufTtcblxuLyoqIENyZWF0ZXMgYSBUTm9kZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGluc3RhbnRpYXRlIGEgcm9vdCBjb21wb25lbnQuICovXG5mdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50VE5vZGUobFZpZXc6IExWaWV3LCByTm9kZTogUk5vZGUpOiBURWxlbWVudE5vZGUge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgaW5kZXggPSBIRUFERVJfT0ZGU0VUO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gIGxWaWV3W2luZGV4XSA9IHJOb2RlO1xuXG4gIC8vICcjaG9zdCcgaXMgYWRkZWQgaGVyZSBhcyB3ZSBkb24ndCBrbm93IHRoZSByZWFsIGhvc3QgRE9NIG5hbWUgKHdlIGRvbid0IHdhbnQgdG8gcmVhZCBpdCkgYW5kIGF0XG4gIC8vIHRoZSBzYW1lIHRpbWUgd2Ugd2FudCB0byBjb21tdW5pY2F0ZSB0aGUgZGVidWcgYFROb2RlYCB0aGF0IHRoaXMgaXMgYSBzcGVjaWFsIGBUTm9kZWBcbiAgLy8gcmVwcmVzZW50aW5nIGEgaG9zdCBlbGVtZW50LlxuICByZXR1cm4gZ2V0T3JDcmVhdGVUTm9kZSh0VmlldywgaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCAnI2hvc3QnLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSByb290IGNvbXBvbmVudCB2aWV3IGFuZCB0aGUgcm9vdCBjb21wb25lbnQgbm9kZS5cbiAqXG4gKiBAcGFyYW0gaG9zdFJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gcm9vdENvbXBvbmVudERlZiBDb21wb25lbnREZWZcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcGFyZW50IHZpZXcgd2hlcmUgdGhlIGhvc3Qgbm9kZSBpcyBzdG9yZWRcbiAqIEBwYXJhbSByZW5kZXJlckZhY3RvcnkgRmFjdG9yeSB0byBiZSB1c2VkIGZvciBjcmVhdGluZyBjaGlsZCByZW5kZXJlcnMuXG4gKiBAcGFyYW0gaG9zdFJlbmRlcmVyIFRoZSBjdXJyZW50IHJlbmRlcmVyXG4gKiBAcGFyYW0gc2FuaXRpemVyIFRoZSBzYW5pdGl6ZXIsIGlmIHByb3ZpZGVkXG4gKlxuICogQHJldHVybnMgQ29tcG9uZW50IHZpZXcgY3JlYXRlZFxuICovXG5mdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50VmlldyhcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlLCBob3N0Uk5vZGU6IFJFbGVtZW50fG51bGwsIHJvb3RDb21wb25lbnREZWY6IENvbXBvbmVudERlZjxhbnk+LFxuICAgIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLCByb290VmlldzogTFZpZXcsIGVudmlyb25tZW50OiBMVmlld0Vudmlyb25tZW50LFxuICAgIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIpOiBMVmlldyB7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdFZpZXdbVFZJRVddO1xuICBhcHBseVJvb3RDb21wb25lbnRTdHlsaW5nKHJvb3REaXJlY3RpdmVzLCB0Tm9kZSwgaG9zdFJOb2RlLCBob3N0UmVuZGVyZXIpO1xuXG4gIC8vIEh5ZHJhdGlvbiBpbmZvIGlzIG9uIHRoZSBob3N0IGVsZW1lbnQgYW5kIG5lZWRzIHRvIGJlIHJldHJlaXZlZFxuICAvLyBhbmQgcGFzc2VkIHRvIHRoZSBjb21wb25lbnQgTFZpZXcuXG4gIGxldCBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlld3xudWxsID0gbnVsbDtcbiAgaWYgKGhvc3RSTm9kZSAhPT0gbnVsbCkge1xuICAgIGh5ZHJhdGlvbkluZm8gPSByZXRyaWV2ZUh5ZHJhdGlvbkluZm8oaG9zdFJOb2RlLCByb290Vmlld1tJTkpFQ1RPUl0hKTtcbiAgfVxuICBjb25zdCB2aWV3UmVuZGVyZXIgPSBlbnZpcm9ubWVudC5yZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCByb290Q29tcG9uZW50RGVmKTtcbiAgbGV0IGxWaWV3RmxhZ3MgPSBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzO1xuICBpZiAocm9vdENvbXBvbmVudERlZi5zaWduYWxzKSB7XG4gICAgbFZpZXdGbGFncyA9IExWaWV3RmxhZ3MuU2lnbmFsVmlldztcbiAgfSBlbHNlIGlmIChyb290Q29tcG9uZW50RGVmLm9uUHVzaCkge1xuICAgIGxWaWV3RmxhZ3MgPSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgIHJvb3RWaWV3LCBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3KHJvb3RDb21wb25lbnREZWYpLCBudWxsLCBsVmlld0ZsYWdzLFxuICAgICAgcm9vdFZpZXdbdE5vZGUuaW5kZXhdLCB0Tm9kZSwgZW52aXJvbm1lbnQsIHZpZXdSZW5kZXJlciwgbnVsbCwgbnVsbCwgaHlkcmF0aW9uSW5mbyk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlLCByb290RGlyZWN0aXZlcy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIGFkZFRvVmlld1RyZWUocm9vdFZpZXcsIGNvbXBvbmVudFZpZXcpO1xuXG4gIC8vIFN0b3JlIGNvbXBvbmVudCB2aWV3IGF0IG5vZGUgaW5kZXgsIHdpdGggbm9kZSBhcyB0aGUgSE9TVFxuICByZXR1cm4gcm9vdFZpZXdbdE5vZGUuaW5kZXhdID0gY29tcG9uZW50Vmlldztcbn1cblxuLyoqIFNldHMgdXAgdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24gb24gYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIGFwcGx5Um9vdENvbXBvbmVudFN0eWxpbmcoXG4gICAgcm9vdERpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10sIHROb2RlOiBURWxlbWVudE5vZGUsIHJOb2RlOiBSRWxlbWVudHxudWxsLFxuICAgIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBkZWYgb2Ygcm9vdERpcmVjdGl2ZXMpIHtcbiAgICB0Tm9kZS5tZXJnZWRBdHRycyA9IG1lcmdlSG9zdEF0dHJzKHROb2RlLm1lcmdlZEF0dHJzLCBkZWYuaG9zdEF0dHJzKTtcbiAgfVxuXG4gIGlmICh0Tm9kZS5tZXJnZWRBdHRycyAhPT0gbnVsbCkge1xuICAgIGNvbXB1dGVTdGF0aWNTdHlsaW5nKHROb2RlLCB0Tm9kZS5tZXJnZWRBdHRycywgdHJ1ZSk7XG5cbiAgICBpZiAock5vZGUgIT09IG51bGwpIHtcbiAgICAgIHNldHVwU3RhdGljQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIHJOb2RlLCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJvb3QgY29tcG9uZW50IGFuZCBzZXRzIGl0IHVwIHdpdGggZmVhdHVyZXMgYW5kIGhvc3QgYmluZGluZ3MuU2hhcmVkIGJ5XG4gKiByZW5kZXJDb21wb25lbnQoKSBhbmQgVmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnQoKS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudDxUPihcbiAgICBjb21wb25lbnRWaWV3OiBMVmlldywgcm9vdENvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+LCByb290RGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPGFueT5bXSxcbiAgICBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCwgcm9vdExWaWV3OiBMVmlldyxcbiAgICBob3N0RmVhdHVyZXM6IEhvc3RGZWF0dXJlW118bnVsbCk6IGFueSB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocm9vdFROb2RlLCAndE5vZGUgc2hvdWxkIGhhdmUgYmVlbiBhbHJlYWR5IGNyZWF0ZWQnKTtcbiAgY29uc3QgdFZpZXcgPSByb290TFZpZXdbVFZJRVddO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHJvb3RUTm9kZSwgcm9vdExWaWV3KTtcblxuICBpbml0aWFsaXplRGlyZWN0aXZlcyh0Vmlldywgcm9vdExWaWV3LCByb290VE5vZGUsIHJvb3REaXJlY3RpdmVzLCBudWxsLCBob3N0RGlyZWN0aXZlRGVmcyk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290RGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gcm9vdFROb2RlLmRpcmVjdGl2ZVN0YXJ0ICsgaTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZSA9IGdldE5vZGVJbmplY3RhYmxlKHJvb3RMVmlldywgdFZpZXcsIGRpcmVjdGl2ZUluZGV4LCByb290VE5vZGUpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmVJbnN0YW5jZSwgcm9vdExWaWV3KTtcbiAgfVxuXG4gIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXcsIHJvb3RMVmlldywgcm9vdFROb2RlKTtcblxuICBpZiAobmF0aXZlKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgcm9vdExWaWV3KTtcbiAgfVxuXG4gIC8vIFdlJ3JlIGd1YXJhbnRlZWQgZm9yIHRoZSBgY29tcG9uZW50T2Zmc2V0YCB0byBiZSBwb3NpdGl2ZSBoZXJlXG4gIC8vIHNpbmNlIGEgcm9vdCBjb21wb25lbnQgYWx3YXlzIG1hdGNoZXMgYSBjb21wb25lbnQgZGVmLlxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKHJvb3RUTm9kZS5jb21wb25lbnRPZmZzZXQsIC0xLCAnY29tcG9uZW50T2Zmc2V0IG11c3QgYmUgZ3JlYXQgdGhhbiAtMScpO1xuICBjb25zdCBjb21wb25lbnQgPSBnZXROb2RlSW5qZWN0YWJsZShcbiAgICAgIHJvb3RMVmlldywgdFZpZXcsIHJvb3RUTm9kZS5kaXJlY3RpdmVTdGFydCArIHJvb3RUTm9kZS5jb21wb25lbnRPZmZzZXQsIHJvb3RUTm9kZSk7XG4gIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSByb290TFZpZXdbQ09OVEVYVF0gPSBjb21wb25lbnQ7XG5cbiAgaWYgKGhvc3RGZWF0dXJlcyAhPT0gbnVsbCkge1xuICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBob3N0RmVhdHVyZXMpIHtcbiAgICAgIGZlYXR1cmUoY29tcG9uZW50LCByb290Q29tcG9uZW50RGVmKTtcbiAgICB9XG4gIH1cblxuICAvLyBXZSB3YW50IHRvIGdlbmVyYXRlIGFuIGVtcHR5IFF1ZXJ5TGlzdCBmb3Igcm9vdCBjb250ZW50IHF1ZXJpZXMgZm9yIGJhY2t3YXJkc1xuICAvLyBjb21wYXRpYmlsaXR5IHdpdGggVmlld0VuZ2luZS5cbiAgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3LCByb290VE5vZGUsIGNvbXBvbmVudFZpZXcpO1xuXG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cbi8qKiBTZXRzIHRoZSBzdGF0aWMgYXR0cmlidXRlcyBvbiBhIHJvb3QgY29tcG9uZW50LiAqL1xuZnVuY3Rpb24gc2V0Um9vdE5vZGVBdHRyaWJ1dGVzKFxuICAgIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIyLCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjx1bmtub3duPiwgaG9zdFJOb2RlOiBSRWxlbWVudCxcbiAgICByb290U2VsZWN0b3JPck5vZGU6IGFueSkge1xuICBpZiAocm9vdFNlbGVjdG9yT3JOb2RlKSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgaG9zdFJOb2RlLCBbJ25nLXZlcnNpb24nLCBWRVJTSU9OLmZ1bGxdKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiBob3N0IGVsZW1lbnQgaXMgY3JlYXRlZCBhcyBhIHBhcnQgb2YgdGhpcyBmdW5jdGlvbiBjYWxsIChpLmUuIGByb290U2VsZWN0b3JPck5vZGVgXG4gICAgLy8gaXMgbm90IGRlZmluZWQpLCBhbHNvIGFwcGx5IGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgZXh0cmFjdGVkIGZyb20gY29tcG9uZW50IHNlbGVjdG9yLlxuICAgIC8vIEV4dHJhY3QgYXR0cmlidXRlcyBhbmQgY2xhc3NlcyBmcm9tIHRoZSBmaXJzdCBzZWxlY3RvciBvbmx5IHRvIG1hdGNoIFZFIGJlaGF2aW9yLlxuICAgIGNvbnN0IHthdHRycywgY2xhc3Nlc30gPSBleHRyYWN0QXR0cnNBbmRDbGFzc2VzRnJvbVNlbGVjdG9yKGNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF0pO1xuICAgIGlmIChhdHRycykge1xuICAgICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgaG9zdFJOb2RlLCBhdHRycyk7XG4gICAgfVxuICAgIGlmIChjbGFzc2VzICYmIGNsYXNzZXMubGVuZ3RoID4gMCkge1xuICAgICAgd3JpdGVEaXJlY3RDbGFzcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgY2xhc3Nlcy5qb2luKCcgJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUHJvamVjdHMgdGhlIGBwcm9qZWN0YWJsZU5vZGVzYCB0aGF0IHdlcmUgc3BlY2lmaWVkIHdoZW4gY3JlYXRpbmcgYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIHByb2plY3ROb2RlcyhcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlLCBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdLCBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdKSB7XG4gIGNvbnN0IHByb2plY3Rpb246IChUTm9kZXxSTm9kZVtdfG51bGwpW10gPSB0Tm9kZS5wcm9qZWN0aW9uID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbmdDb250ZW50U2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZXNmb3JTbG90ID0gcHJvamVjdGFibGVOb2Rlc1tpXTtcbiAgICAvLyBQcm9qZWN0YWJsZSBub2RlcyBjYW4gYmUgcGFzc2VkIGFzIGFycmF5IG9mIGFycmF5cyBvciBhbiBhcnJheSBvZiBpdGVyYWJsZXMgKG5nVXBncmFkZVxuICAgIC8vIGNhc2UpLiBIZXJlIHdlIGRvIG5vcm1hbGl6ZSBwYXNzZWQgZGF0YSBzdHJ1Y3R1cmUgdG8gYmUgYW4gYXJyYXkgb2YgYXJyYXlzIHRvIGF2b2lkXG4gICAgLy8gY29tcGxleCBjaGVja3MgZG93biB0aGUgbGluZS5cbiAgICAvLyBXZSBhbHNvIG5vcm1hbGl6ZSB0aGUgbGVuZ3RoIG9mIHRoZSBwYXNzZWQgaW4gcHJvamVjdGFibGUgbm9kZXMgKHRvIG1hdGNoIHRoZSBudW1iZXIgb2ZcbiAgICAvLyA8bmctY29udGFpbmVyPiBzbG90cyBkZWZpbmVkIGJ5IGEgY29tcG9uZW50KS5cbiAgICBwcm9qZWN0aW9uLnB1c2gobm9kZXNmb3JTbG90ICE9IG51bGwgPyBBcnJheS5mcm9tKG5vZGVzZm9yU2xvdCkgOiBudWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gZW5hYmxlIGxpZmVjeWNsZSBob29rcyBvbiB0aGUgcm9vdCBjb21wb25lbnQuXG4gKlxuICogSW5jbHVkZSB0aGlzIGZlYXR1cmUgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGlmIHRoZSByb290IGNvbXBvbmVudFxuICogeW91IGFyZSByZW5kZXJpbmcgaGFzIGxpZmVjeWNsZSBob29rcyBkZWZpbmVkLiBPdGhlcndpc2UsIHRoZSBob29rcyB3b24ndFxuICogYmUgY2FsbGVkIHByb3Blcmx5LlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiByZW5kZXJDb21wb25lbnQoQXBwQ29tcG9uZW50LCB7aG9zdEZlYXR1cmVzOiBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXX0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBMaWZlY3ljbGVIb29rc0ZlYXR1cmUoKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ1ROb2RlIGlzIHJlcXVpcmVkJyk7XG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3MoZ2V0TFZpZXcoKVtUVklFV10sIHROb2RlKTtcbn1cbiJdfQ==