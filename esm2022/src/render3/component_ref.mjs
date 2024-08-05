/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { setActiveConsumer } from '@angular/core/primitives/signals';
import { ChangeDetectionScheduler, } from '../change_detection/scheduling/zoneless_scheduling';
import { EnvironmentInjector } from '../di/r3_injector';
import { RuntimeError } from '../errors';
import { retrieveHydrationInfo } from '../hydration/utils';
import { ComponentFactory as AbstractComponentFactory, ComponentRef as AbstractComponentRef, } from '../linker/component_factory';
import { ComponentFactoryResolver as AbstractComponentFactoryResolver } from '../linker/component_factory_resolver';
import { createElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/sanitizer';
import { assertDefined, assertGreaterThan, assertIndexInRange } from '../util/assert';
import { AfterRenderEventManager } from './after_render_hooks';
import { assertComponentType, assertNoDuplicateDirectives } from './assert';
import { attachPatchData } from './context_discovery';
import { getComponentDef } from './definition';
import { depsTracker } from './deps_tracker/deps_tracker';
import { getNodeInjectable, NodeInjector } from './di';
import { registerPostOrderHooks } from './hooks';
import { reportUnknownPropertyError } from './instructions/element_validation';
import { markViewDirty } from './instructions/mark_view_dirty';
import { renderView } from './instructions/render';
import { addToViewTree, createLView, createTView, executeContentQueries, getOrCreateComponentTView, getOrCreateTNode, initializeDirectives, invokeDirectivesHostBindings, locateHostElement, markAsComponentHost, setInputsForProperty, } from './instructions/shared';
import { InputFlags } from './interfaces/input_flags';
import { CONTEXT, HEADER_OFFSET, INJECTOR, TVIEW, } from './interfaces/view';
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
import { createElementNode, setupStaticAttributes, writeDirectClass } from './node_manipulation';
import { extractAttrsAndClassesFromSelector, stringifyCSSSelectorList, } from './node_selector_matcher';
import { enterView, getCurrentTNode, getLView, leaveView } from './state';
import { computeStaticStyling } from './styling/static_styling';
import { mergeHostAttrs, setUpAttributes } from './util/attrs_utils';
import { debugStringifyTypeForError, stringifyForError } from './util/stringify_utils';
import { getComponentLViewByIndex, getNativeByTNode, getTNode } from './util/view_utils';
import { ViewRef } from './view_ref';
import { ChainedInjector } from './chained_injector';
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
function toRefArray(map, isInputMap) {
    const array = [];
    for (const publicName in map) {
        if (!map.hasOwnProperty(publicName)) {
            continue;
        }
        const value = map[publicName];
        if (value === undefined) {
            continue;
        }
        const isArray = Array.isArray(value);
        const propName = isArray ? value[0] : value;
        const flags = isArray ? value[1] : InputFlags.None;
        if (isInputMap) {
            array.push({
                propName: propName,
                templateName: publicName,
                isSignal: (flags & InputFlags.SignalBased) !== 0,
            });
        }
        else {
            array.push({
                propName: propName,
                templateName: publicName,
            });
        }
    }
    return array;
}
function getNamespace(elementName) {
    const name = elementName.toLowerCase();
    return name === 'svg' ? SVG_NAMESPACE : name === 'math' ? MATH_ML_NAMESPACE : null;
}
/**
 * ComponentFactory interface implementation.
 */
export class ComponentFactory extends AbstractComponentFactory {
    get inputs() {
        const componentDef = this.componentDef;
        const inputTransforms = componentDef.inputTransforms;
        const refArray = toRefArray(componentDef.inputs, true);
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
        return toRefArray(this.componentDef.outputs, false);
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
        this.ngContentSelectors = componentDef.ngContentSelectors
            ? componentDef.ngContentSelectors
            : [];
        this.isBoundToModule = !!ngModule;
    }
    create(injector, projectableNodes, rootSelectorOrNode, environmentInjector) {
        const prevConsumer = setActiveConsumer(null);
        try {
            // Check if the component is orphan
            if (ngDevMode &&
                (typeof ngJitMode === 'undefined' || ngJitMode) &&
                this.componentDef.debugInfo?.forbidOrphanRendering) {
                if (depsTracker.isOrphanComponent(this.componentType)) {
                    throw new RuntimeError(1001 /* RuntimeErrorCode.RUNTIME_DEPS_ORPHAN_COMPONENT */, `Orphan component found! Trying to render the component ${debugStringifyTypeForError(this.componentType)} without first loading the NgModule that declares it. It is recommended to make this component standalone in order to avoid this error. If this is not possible now, import the component's NgModule in the appropriate NgModule, or the standalone component in which you are trying to render this component. If this is a lazy import, load the NgModule lazily as well and use its module injector.`);
                }
            }
            environmentInjector = environmentInjector || this.ngModule;
            let realEnvironmentInjector = environmentInjector instanceof EnvironmentInjector
                ? environmentInjector
                : environmentInjector?.injector;
            if (realEnvironmentInjector && this.componentDef.getStandaloneInjector !== null) {
                realEnvironmentInjector =
                    this.componentDef.getStandaloneInjector(realEnvironmentInjector) ||
                        realEnvironmentInjector;
            }
            const rootViewInjector = realEnvironmentInjector
                ? new ChainedInjector(injector, realEnvironmentInjector)
                : injector;
            const rendererFactory = rootViewInjector.get(RendererFactory2, null);
            if (rendererFactory === null) {
                throw new RuntimeError(407 /* RuntimeErrorCode.RENDERER_NOT_FOUND */, ngDevMode &&
                    'Angular was not able to inject a renderer (RendererFactory2). ' +
                        'Likely this is due to a broken DI hierarchy. ' +
                        'Make sure that any injector used to create this component has a correct parent.');
            }
            const sanitizer = rootViewInjector.get(Sanitizer, null);
            const afterRenderEventManager = rootViewInjector.get(AfterRenderEventManager, null);
            const changeDetectionScheduler = rootViewInjector.get(ChangeDetectionScheduler, null);
            const environment = {
                rendererFactory,
                sanitizer,
                // We don't use inline effects (yet).
                inlineEffectRunner: null,
                afterRenderEventManager,
                changeDetectionScheduler,
            };
            const hostRenderer = rendererFactory.createRenderer(null, this.componentDef);
            // Determine a tag name used for creating host elements when this component is created
            // dynamically. Default to 'div' if this component did not specify any tag name in its
            // selector.
            const elementName = this.componentDef.selectors[0][0] || 'div';
            const hostRNode = rootSelectorOrNode
                ? locateHostElement(hostRenderer, rootSelectorOrNode, this.componentDef.encapsulation, rootViewInjector)
                : createElementNode(hostRenderer, elementName, getNamespace(elementName));
            let rootFlags = 512 /* LViewFlags.IsRoot */;
            if (this.componentDef.signals) {
                rootFlags |= 4096 /* LViewFlags.SignalView */;
            }
            else if (!this.componentDef.onPush) {
                rootFlags |= 16 /* LViewFlags.CheckAlways */;
            }
            let hydrationInfo = null;
            if (hostRNode !== null) {
                hydrationInfo = retrieveHydrationInfo(hostRNode, rootViewInjector, true /* isRootView */);
            }
            // Create the root view. Uses empty TView and ContentTemplate.
            const rootTView = createTView(0 /* TViewType.Root */, null, null, 1, 0, null, null, null, null, null, null);
            const rootLView = createLView(null, rootTView, null, rootFlags, null, null, environment, hostRenderer, rootViewInjector, null, hydrationInfo);
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
                    ngDevMode && assertNoDuplicateDirectives(rootDirectives);
                }
                else {
                    rootDirectives = [rootComponentDef];
                }
                const hostTNode = createRootComponentTNode(rootLView, hostRNode);
                const componentView = createRootComponentView(hostTNode, hostRNode, rootComponentDef, rootDirectives, rootLView, environment, hostRenderer);
                tElementNode = getTNode(rootTView, HEADER_OFFSET);
                // TODO(crisbeto): in practice `hostRNode` should always be defined, but there are some
                // tests where the renderer is mocked out and `undefined` is returned. We should update the
                // tests so that this check can be removed.
                if (hostRNode) {
                    setRootNodeAttributes(hostRenderer, rootComponentDef, hostRNode, rootSelectorOrNode);
                }
                if (projectableNodes !== undefined) {
                    projectNodes(tElementNode, this.ngContentSelectors, projectableNodes);
                }
                // TODO: should LifecycleHooksFeature and other host features be generated by the compiler
                // and executed here? Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
                component = createRootComponent(componentView, rootComponentDef, rootDirectives, hostDirectiveDefs, rootLView, [LifecycleHooksFeature]);
                renderView(rootTView, rootLView, null);
            }
            finally {
                leaveView();
            }
            return new ComponentRef(this.componentType, component, createElementRef(tElementNode, rootLView), rootLView, tElementNode);
        }
        finally {
            setActiveConsumer(prevConsumer);
        }
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
        this.hostView = this.changeDetectorRef = new ViewRef(_rootLView, undefined /* _cdRefInjectingView */, false /* notifyErrorHandler */);
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
            markViewDirty(childComponentLView, 1 /* NotificationSource.SetInput */);
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
    // Hydration info is on the host element and needs to be retrieved
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
    return (rootView[tNode.index] = componentView);
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
    executeContentQueries(tView, rootTNode, rootLView);
    return component;
}
/** Sets the static attributes on a root component. */
function setRootNodeAttributes(hostRenderer, componentDef, hostRNode, rootSelectorOrNode) {
    if (rootSelectorOrNode) {
        // The placeholder will be replaced with the actual version at build time.
        setUpAttributes(hostRenderer, hostRNode, ['ng-version', '18.2.0-next.3+sha-3bdead1']);
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
    const projection = (tNode.projection = []);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUduRSxPQUFPLEVBQ0wsd0JBQXdCLEdBRXpCLE1BQU0sb0RBQW9ELENBQUM7QUFFNUQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEQsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFFekQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekQsT0FBTyxFQUNMLGdCQUFnQixJQUFJLHdCQUF3QixFQUM1QyxZQUFZLElBQUksb0JBQW9CLEdBQ3JDLE1BQU0sNkJBQTZCLENBQUM7QUFDckMsT0FBTyxFQUFDLHdCQUF3QixJQUFJLGdDQUFnQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLGdCQUFnQixFQUFhLE1BQU0sdUJBQXVCLENBQUM7QUFFbkUsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFcEYsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDN0QsT0FBTyxFQUFDLG1CQUFtQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzFFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3JELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMvQyxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDN0QsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sRUFDTCxhQUFhLEVBQ2IsV0FBVyxFQUNYLFdBQVcsRUFDWCxxQkFBcUIsRUFDckIseUJBQXlCLEVBQ3pCLGdCQUFnQixFQUNoQixvQkFBb0IsRUFDcEIsNEJBQTRCLEVBQzVCLGlCQUFpQixFQUNqQixtQkFBbUIsRUFDbkIsb0JBQW9CLEdBQ3JCLE1BQU0sdUJBQXVCLENBQUM7QUFFL0IsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBV3BELE9BQU8sRUFDTCxPQUFPLEVBQ1AsYUFBYSxFQUNiLFFBQVEsRUFJUixLQUFLLEdBRU4sTUFBTSxtQkFBbUIsQ0FBQztBQUMzQixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzlELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9GLE9BQU8sRUFDTCxrQ0FBa0MsRUFDbEMsd0JBQXdCLEdBQ3pCLE1BQU0seUJBQXlCLENBQUM7QUFDakMsT0FBTyxFQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN4RSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ25FLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JGLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN2RixPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVuRCxNQUFNLE9BQU8sd0JBQXlCLFNBQVEsZ0NBQWdDO0lBQzVFOztPQUVHO0lBQ0gsWUFBb0IsUUFBMkI7UUFDN0MsS0FBSyxFQUFFLENBQUM7UUFEVSxhQUFRLEdBQVIsUUFBUSxDQUFtQjtJQUUvQyxDQUFDO0lBRVEsdUJBQXVCLENBQUksU0FBa0I7UUFDcEQsU0FBUyxJQUFJLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUUsQ0FBQztRQUNqRCxPQUFPLElBQUksZ0JBQWdCLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMzRCxDQUFDO0NBQ0Y7QUFXRCxTQUFTLFVBQVUsQ0FNakIsR0FBMkQsRUFBRSxVQUFzQjtJQUNuRixNQUFNLEtBQUssR0FBVyxFQUF1QixDQUFDO0lBQzlDLEtBQUssTUFBTSxVQUFVLElBQUksR0FBRyxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUNwQyxTQUFTO1FBQ1gsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM5QixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN4QixTQUFTO1FBQ1gsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsTUFBTSxRQUFRLEdBQVcsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUNwRCxNQUFNLEtBQUssR0FBZSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztRQUUvRCxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2QsS0FBdUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzVDLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixZQUFZLEVBQUUsVUFBVTtnQkFDeEIsUUFBUSxFQUFFLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO2FBQ2pELENBQUMsQ0FBQztRQUNMLENBQUM7YUFBTSxDQUFDO1lBQ0wsS0FBd0MsQ0FBQyxJQUFJLENBQUM7Z0JBQzdDLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixZQUFZLEVBQUUsVUFBVTthQUN6QixDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLFdBQW1CO0lBQ3ZDLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUN2QyxPQUFPLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNyRixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sZ0JBQW9CLFNBQVEsd0JBQTJCO0lBTWxFLElBQWEsTUFBTTtRQU1qQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ3ZDLE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUM7UUFDckQsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFdkQsSUFBSSxlQUFlLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDN0IsS0FBSyxNQUFNLEtBQUssSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxlQUFlLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUNuRCxLQUFLLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BELENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxJQUFhLE9BQU87UUFDbEIsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVEOzs7T0FHRztJQUNILFlBQ1UsWUFBK0IsRUFDL0IsUUFBMkI7UUFFbkMsS0FBSyxFQUFFLENBQUM7UUFIQSxpQkFBWSxHQUFaLFlBQVksQ0FBbUI7UUFDL0IsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7UUFHbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxRQUFRLEdBQUcsd0JBQXdCLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxZQUFZLENBQUMsa0JBQWtCO1lBQ3ZELENBQUMsQ0FBQyxZQUFZLENBQUMsa0JBQWtCO1lBQ2pDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDUCxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7SUFDcEMsQ0FBQztJQUVRLE1BQU0sQ0FDYixRQUFrQixFQUNsQixnQkFBc0MsRUFDdEMsa0JBQXdCLEVBQ3hCLG1CQUF3RTtRQUV4RSxNQUFNLFlBQVksR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUM7WUFDSCxtQ0FBbUM7WUFDbkMsSUFDRSxTQUFTO2dCQUNULENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUscUJBQXFCLEVBQ2xELENBQUM7Z0JBQ0QsSUFBSSxXQUFXLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7b0JBQ3RELE1BQU0sSUFBSSxZQUFZLDREQUVwQiwwREFBMEQsMEJBQTBCLENBQ2xGLElBQUksQ0FBQyxhQUFhLENBQ25CLHlZQUF5WSxDQUMzWSxDQUFDO2dCQUNKLENBQUM7WUFDSCxDQUFDO1lBRUQsbUJBQW1CLEdBQUcsbUJBQW1CLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUUzRCxJQUFJLHVCQUF1QixHQUN6QixtQkFBbUIsWUFBWSxtQkFBbUI7Z0JBQ2hELENBQUMsQ0FBQyxtQkFBbUI7Z0JBQ3JCLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLENBQUM7WUFFcEMsSUFBSSx1QkFBdUIsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNoRix1QkFBdUI7b0JBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLENBQUM7d0JBQ2hFLHVCQUF1QixDQUFDO1lBQzVCLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFHLHVCQUF1QjtnQkFDOUMsQ0FBQyxDQUFDLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRSx1QkFBdUIsQ0FBQztnQkFDeEQsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUViLE1BQU0sZUFBZSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRSxJQUFJLGVBQWUsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxJQUFJLFlBQVksZ0RBRXBCLFNBQVM7b0JBQ1AsZ0VBQWdFO3dCQUM5RCwrQ0FBK0M7d0JBQy9DLGlGQUFpRixDQUN0RixDQUFDO1lBQ0osQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFeEQsTUFBTSx1QkFBdUIsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEYsTUFBTSx3QkFBd0IsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFdEYsTUFBTSxXQUFXLEdBQXFCO2dCQUNwQyxlQUFlO2dCQUNmLFNBQVM7Z0JBQ1QscUNBQXFDO2dCQUNyQyxrQkFBa0IsRUFBRSxJQUFJO2dCQUN4Qix1QkFBdUI7Z0JBQ3ZCLHdCQUF3QjthQUN6QixDQUFDO1lBRUYsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzdFLHNGQUFzRjtZQUN0RixzRkFBc0Y7WUFDdEYsWUFBWTtZQUNaLE1BQU0sV0FBVyxHQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBWSxJQUFJLEtBQUssQ0FBQztZQUMzRSxNQUFNLFNBQVMsR0FBRyxrQkFBa0I7Z0JBQ2xDLENBQUMsQ0FBQyxpQkFBaUIsQ0FDZixZQUFZLEVBQ1osa0JBQWtCLEVBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUMvQixnQkFBZ0IsQ0FDakI7Z0JBQ0gsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFFNUUsSUFBSSxTQUFTLDhCQUFvQixDQUFDO1lBQ2xDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsU0FBUyxvQ0FBeUIsQ0FBQztZQUNyQyxDQUFDO2lCQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyQyxTQUFTLG1DQUEwQixDQUFDO1lBQ3RDLENBQUM7WUFFRCxJQUFJLGFBQWEsR0FBMEIsSUFBSSxDQUFDO1lBQ2hELElBQUksU0FBUyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN2QixhQUFhLEdBQUcscUJBQXFCLENBQUMsU0FBUyxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFFRCw4REFBOEQ7WUFDOUQsTUFBTSxTQUFTLEdBQUcsV0FBVyx5QkFFM0IsSUFBSSxFQUNKLElBQUksRUFDSixDQUFDLEVBQ0QsQ0FBQyxFQUNELElBQUksRUFDSixJQUFJLEVBQ0osSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLEVBQ0osSUFBSSxDQUNMLENBQUM7WUFDRixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQzNCLElBQUksRUFDSixTQUFTLEVBQ1QsSUFBSSxFQUNKLFNBQVMsRUFDVCxJQUFJLEVBQ0osSUFBSSxFQUNKLFdBQVcsRUFDWCxZQUFZLEVBQ1osZ0JBQWdCLEVBQ2hCLElBQUksRUFDSixhQUFhLENBQ2QsQ0FBQztZQUVGLDRDQUE0QztZQUM1QyxzRkFBc0Y7WUFDdEYsOEVBQThFO1lBQzlFLDJGQUEyRjtZQUMzRixzQ0FBc0M7WUFDdEMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXJCLElBQUksU0FBWSxDQUFDO1lBQ2pCLElBQUksWUFBMEIsQ0FBQztZQUUvQixJQUFJLENBQUM7Z0JBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUMzQyxJQUFJLGNBQXVDLENBQUM7Z0JBQzVDLElBQUksaUJBQWlCLEdBQTZCLElBQUksQ0FBQztnQkFFdkQsSUFBSSxnQkFBZ0IsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUMzQyxjQUFjLEdBQUcsRUFBRSxDQUFDO29CQUNwQixpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUM5QixnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FDcEMsZ0JBQWdCLEVBQ2hCLGNBQWMsRUFDZCxpQkFBaUIsQ0FDbEIsQ0FBQztvQkFDRixjQUFjLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ3RDLFNBQVMsSUFBSSwyQkFBMkIsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDM0QsQ0FBQztxQkFBTSxDQUFDO29CQUNOLGNBQWMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3RDLENBQUM7Z0JBRUQsTUFBTSxTQUFTLEdBQUcsd0JBQXdCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNqRSxNQUFNLGFBQWEsR0FBRyx1QkFBdUIsQ0FDM0MsU0FBUyxFQUNULFNBQVMsRUFDVCxnQkFBZ0IsRUFDaEIsY0FBYyxFQUNkLFNBQVMsRUFDVCxXQUFXLEVBQ1gsWUFBWSxDQUNiLENBQUM7Z0JBRUYsWUFBWSxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFpQixDQUFDO2dCQUVsRSx1RkFBdUY7Z0JBQ3ZGLDJGQUEyRjtnQkFDM0YsMkNBQTJDO2dCQUMzQyxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNkLHFCQUFxQixDQUFDLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztnQkFDdkYsQ0FBQztnQkFFRCxJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUNuQyxZQUFZLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUN4RSxDQUFDO2dCQUVELDBGQUEwRjtnQkFDMUYsNEZBQTRGO2dCQUM1RixTQUFTLEdBQUcsbUJBQW1CLENBQzdCLGFBQWEsRUFDYixnQkFBZ0IsRUFDaEIsY0FBYyxFQUNkLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsQ0FBQyxxQkFBcUIsQ0FBQyxDQUN4QixDQUFDO2dCQUNGLFVBQVUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pDLENBQUM7b0JBQVMsQ0FBQztnQkFDVCxTQUFTLEVBQUUsQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLElBQUksWUFBWSxDQUNyQixJQUFJLENBQUMsYUFBYSxFQUNsQixTQUFTLEVBQ1QsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxFQUN6QyxTQUFTLEVBQ1QsWUFBWSxDQUNiLENBQUM7UUFDSixDQUFDO2dCQUFTLENBQUM7WUFDVCxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sT0FBTyxZQUFnQixTQUFRLG9CQUF1QjtJQU8xRCxZQUNFLGFBQXNCLEVBQ3RCLFFBQVcsRUFDSixRQUFvQixFQUNuQixVQUFpQixFQUNqQixNQUE2RDtRQUVyRSxLQUFLLEVBQUUsQ0FBQztRQUpELGFBQVEsR0FBUixRQUFRLENBQVk7UUFDbkIsZUFBVSxHQUFWLFVBQVUsQ0FBTztRQUNqQixXQUFNLEdBQU4sTUFBTSxDQUF1RDtRQVAvRCx3QkFBbUIsR0FBZ0MsSUFBSSxDQUFDO1FBVTlELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksT0FBTyxDQUNsRCxVQUFVLEVBQ1YsU0FBUyxDQUFDLHlCQUF5QixFQUNuQyxLQUFLLENBQUMsd0JBQXdCLENBQy9CLENBQUM7UUFDRixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztJQUNyQyxDQUFDO0lBRVEsUUFBUSxDQUFDLElBQVksRUFBRSxLQUFjO1FBQzVDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3JDLElBQUksU0FBcUQsQ0FBQztRQUMxRCxJQUFJLFNBQVMsS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUN4RCxJQUFJLENBQUMsbUJBQW1CLEtBQUssSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUN2QywyREFBMkQ7WUFDM0QsMkVBQTJFO1lBQzNFLElBQ0UsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsRUFDcEQsQ0FBQztnQkFDRCxPQUFPO1lBQ1QsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDOUIsb0JBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLE1BQU0sbUJBQW1CLEdBQUcsd0JBQXdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0UsYUFBYSxDQUFDLG1CQUFtQixzQ0FBOEIsQ0FBQztRQUNsRSxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM5RCxJQUFJLE9BQU8sR0FBRywyQkFBMkIsSUFBSSxtQkFBbUIsZUFBZSxlQUFlLENBQUM7Z0JBQy9GLE9BQU8sSUFBSSx1QkFBdUIsSUFBSSw2REFBNkQsSUFBSSxZQUFZLENBQUM7Z0JBQ3BILDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELElBQWEsUUFBUTtRQUNuQixPQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFUSxPQUFPO1FBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRVEsU0FBUyxDQUFDLFFBQW9CO1FBQ3JDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7Q0FDRjtBQUtELHdFQUF3RTtBQUN4RSxTQUFTLHdCQUF3QixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQzFELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixNQUFNLEtBQUssR0FBRyxhQUFhLENBQUM7SUFDNUIsU0FBUyxJQUFJLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBRXJCLGtHQUFrRztJQUNsRyx3RkFBd0Y7SUFDeEYsK0JBQStCO0lBQy9CLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssNkJBQXFCLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMxRSxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxTQUFTLHVCQUF1QixDQUM5QixLQUFtQixFQUNuQixTQUEwQixFQUMxQixnQkFBbUMsRUFDbkMsY0FBbUMsRUFDbkMsUUFBZSxFQUNmLFdBQTZCLEVBQzdCLFlBQXNCO0lBRXRCLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5Qix5QkFBeUIsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUUxRSxrRUFBa0U7SUFDbEUscUNBQXFDO0lBQ3JDLElBQUksYUFBYSxHQUEwQixJQUFJLENBQUM7SUFDaEQsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDdkIsYUFBYSxHQUFHLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBQ0QsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFDN0YsSUFBSSxVQUFVLGtDQUF5QixDQUFDO0lBQ3hDLElBQUksZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0IsVUFBVSxtQ0FBd0IsQ0FBQztJQUNyQyxDQUFDO1NBQU0sSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNuQyxVQUFVLDRCQUFtQixDQUFDO0lBQ2hDLENBQUM7SUFDRCxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQy9CLFFBQVEsRUFDUix5QkFBeUIsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUMzQyxJQUFJLEVBQ0osVUFBVSxFQUNWLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQ3JCLEtBQUssRUFDTCxXQUFXLEVBQ1gsWUFBWSxFQUNaLElBQUksRUFDSixJQUFJLEVBQ0osYUFBYSxDQUNkLENBQUM7SUFFRixJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMxQixtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVELGFBQWEsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFFdkMsNERBQTREO0lBQzVELE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFFRCwyREFBMkQ7QUFDM0QsU0FBUyx5QkFBeUIsQ0FDaEMsY0FBbUMsRUFDbkMsS0FBbUIsRUFDbkIsS0FBc0IsRUFDdEIsWUFBc0I7SUFFdEIsS0FBSyxNQUFNLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztRQUNqQyxLQUFLLENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQy9CLG9CQUFvQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXJELElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ25CLHFCQUFxQixDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEQsQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxtQkFBbUIsQ0FDMUIsYUFBb0IsRUFDcEIsZ0JBQWlDLEVBQ2pDLGNBQW1DLEVBQ25DLGlCQUEyQyxFQUMzQyxTQUFnQixFQUNoQixZQUFrQztJQUVsQyxNQUFNLFNBQVMsR0FBRyxlQUFlLEVBQWtCLENBQUM7SUFDcEQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztJQUNoRixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0IsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRXRELG9CQUFvQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUUzRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQy9DLE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1FBQ3BELE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDekYsZUFBZSxDQUFDLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCw0QkFBNEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRTFELElBQUksTUFBTSxFQUFFLENBQUM7UUFDWCxlQUFlLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxpRUFBaUU7SUFDakUseURBQXlEO0lBQ3pELFNBQVM7UUFDUCxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7SUFDNUYsTUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQ2pDLFNBQVMsRUFDVCxLQUFLLEVBQ0wsU0FBUyxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUMsZUFBZSxFQUNwRCxTQUFTLENBQ1YsQ0FBQztJQUNGLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBRXhELElBQUksWUFBWSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQzFCLEtBQUssTUFBTSxPQUFPLElBQUksWUFBWSxFQUFFLENBQUM7WUFDbkMsT0FBTyxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7SUFDSCxDQUFDO0lBRUQsZ0ZBQWdGO0lBQ2hGLGlDQUFpQztJQUNqQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRW5ELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRCxzREFBc0Q7QUFDdEQsU0FBUyxxQkFBcUIsQ0FDNUIsWUFBdUIsRUFDdkIsWUFBbUMsRUFDbkMsU0FBbUIsRUFDbkIsa0JBQXVCO0lBRXZCLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUN2QiwwRUFBMEU7UUFDMUUsZUFBZSxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsQ0FBQyxZQUFZLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7U0FBTSxDQUFDO1FBQ04sd0ZBQXdGO1FBQ3hGLHdGQUF3RjtRQUN4RixvRkFBb0Y7UUFDcEYsTUFBTSxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUMsR0FBRyxrQ0FBa0MsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkYsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNWLGVBQWUsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFDRCxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2xDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9ELENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQztBQUVELDBGQUEwRjtBQUMxRixTQUFTLFlBQVksQ0FDbkIsS0FBbUIsRUFDbkIsa0JBQTRCLEVBQzVCLGdCQUF5QjtJQUV6QixNQUFNLFVBQVUsR0FBK0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNuRCxNQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6Qyx5RkFBeUY7UUFDekYsc0ZBQXNGO1FBQ3RGLGdDQUFnQztRQUNoQywwRkFBMEY7UUFDMUYsZ0RBQWdEO1FBQ2hELFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUUsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDdkQsc0JBQXNCLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3NldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsXG4gIE5vdGlmaWNhdGlvblNvdXJjZSxcbn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7RGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uL2h5ZHJhdGlvbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7cmV0cmlldmVIeWRyYXRpb25JbmZvfSBmcm9tICcuLi9oeWRyYXRpb24vdXRpbHMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1xuICBDb21wb25lbnRGYWN0b3J5IGFzIEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeSxcbiAgQ29tcG9uZW50UmVmIGFzIEFic3RyYWN0Q29tcG9uZW50UmVmLFxufSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIEVsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0SW5kZXhJblJhbmdlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7QWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXJ9IGZyb20gJy4vYWZ0ZXJfcmVuZGVyX2hvb2tzJztcbmltcG9ydCB7YXNzZXJ0Q29tcG9uZW50VHlwZSwgYXNzZXJ0Tm9EdXBsaWNhdGVEaXJlY3RpdmVzfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGVwc1RyYWNrZXJ9IGZyb20gJy4vZGVwc190cmFja2VyL2RlcHNfdHJhY2tlcic7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBOb2RlSW5qZWN0b3J9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtyZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7cmVwb3J0VW5rbm93blByb3BlcnR5RXJyb3J9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2VsZW1lbnRfdmFsaWRhdGlvbic7XG5pbXBvcnQge21hcmtWaWV3RGlydHl9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL21hcmtfdmlld19kaXJ0eSc7XG5pbXBvcnQge3JlbmRlclZpZXd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3JlbmRlcic7XG5pbXBvcnQge1xuICBhZGRUb1ZpZXdUcmVlLFxuICBjcmVhdGVMVmlldyxcbiAgY3JlYXRlVFZpZXcsXG4gIGV4ZWN1dGVDb250ZW50UXVlcmllcyxcbiAgZ2V0T3JDcmVhdGVDb21wb25lbnRUVmlldyxcbiAgZ2V0T3JDcmVhdGVUTm9kZSxcbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXMsXG4gIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3MsXG4gIGxvY2F0ZUhvc3RFbGVtZW50LFxuICBtYXJrQXNDb21wb25lbnRIb3N0LFxuICBzZXRJbnB1dHNGb3JQcm9wZXJ0eSxcbn0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWYsIEhvc3REaXJlY3RpdmVEZWZzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0lucHV0RmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9pbnB1dF9mbGFncyc7XG5pbXBvcnQge1xuICBOb2RlSW5wdXRCaW5kaW5ncyxcbiAgVENvbnRhaW5lck5vZGUsXG4gIFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgVEVsZW1lbnROb2RlLFxuICBUTm9kZSxcbiAgVE5vZGVUeXBlLFxufSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtcbiAgQ09OVEVYVCxcbiAgSEVBREVSX09GRlNFVCxcbiAgSU5KRUNUT1IsXG4gIExWaWV3LFxuICBMVmlld0Vudmlyb25tZW50LFxuICBMVmlld0ZsYWdzLFxuICBUVklFVyxcbiAgVFZpZXdUeXBlLFxufSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge01BVEhfTUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFfSBmcm9tICcuL25hbWVzcGFjZXMnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50Tm9kZSwgc2V0dXBTdGF0aWNBdHRyaWJ1dGVzLCB3cml0ZURpcmVjdENsYXNzfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7XG4gIGV4dHJhY3RBdHRyc0FuZENsYXNzZXNGcm9tU2VsZWN0b3IsXG4gIHN0cmluZ2lmeUNTU1NlbGVjdG9yTGlzdCxcbn0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGxlYXZlVmlld30gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2NvbXB1dGVTdGF0aWNTdHlsaW5nfSBmcm9tICcuL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcnO1xuaW1wb3J0IHttZXJnZUhvc3RBdHRycywgc2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtkZWJ1Z1N0cmluZ2lmeVR5cGVGb3JFcnJvciwgc3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuaW1wb3J0IHtDaGFpbmVkSW5qZWN0b3J9IGZyb20gJy4vY2hhaW5lZF9pbmplY3Rvcic7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIGFsbCByZXNvbHZlZCBmYWN0b3JpZXMgYXJlIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpITtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLm5nTW9kdWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1JlZkFycmF5PFQ+KFxuICBtYXA6IERpcmVjdGl2ZURlZjxUPlsnaW5wdXRzJ10sXG4gIGlzSW5wdXRNYXA6IHRydWUsXG4pOiBDb21wb25lbnRGYWN0b3J5PFQ+WydpbnB1dHMnXTtcbmZ1bmN0aW9uIHRvUmVmQXJyYXk8VD4oXG4gIG1hcDogRGlyZWN0aXZlRGVmPFQ+WydvdXRwdXRzJ10sXG4gIGlzSW5wdXQ6IGZhbHNlLFxuKTogQ29tcG9uZW50RmFjdG9yeTxUPlsnb3V0cHV0cyddO1xuXG5mdW5jdGlvbiB0b1JlZkFycmF5PFxuICBULFxuICBJc0lucHV0TWFwIGV4dGVuZHMgYm9vbGVhbixcbiAgUmV0dXJuIGV4dGVuZHMgSXNJbnB1dE1hcCBleHRlbmRzIHRydWVcbiAgICA/IENvbXBvbmVudEZhY3Rvcnk8VD5bJ2lucHV0cyddXG4gICAgOiBDb21wb25lbnRGYWN0b3J5PFQ+WydvdXRwdXRzJ10sXG4+KG1hcDogRGlyZWN0aXZlRGVmPFQ+WydpbnB1dHMnXSB8IERpcmVjdGl2ZURlZjxUPlsnb3V0cHV0cyddLCBpc0lucHV0TWFwOiBJc0lucHV0TWFwKTogUmV0dXJuIHtcbiAgY29uc3QgYXJyYXk6IFJldHVybiA9IFtdIGFzIHVua25vd24gYXMgUmV0dXJuO1xuICBmb3IgKGNvbnN0IHB1YmxpY05hbWUgaW4gbWFwKSB7XG4gICAgaWYgKCFtYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlID0gbWFwW3B1YmxpY05hbWVdO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG4gICAgY29uc3QgcHJvcE5hbWU6IHN0cmluZyA9IGlzQXJyYXkgPyB2YWx1ZVswXSA6IHZhbHVlO1xuICAgIGNvbnN0IGZsYWdzOiBJbnB1dEZsYWdzID0gaXNBcnJheSA/IHZhbHVlWzFdIDogSW5wdXRGbGFncy5Ob25lO1xuXG4gICAgaWYgKGlzSW5wdXRNYXApIHtcbiAgICAgIChhcnJheSBhcyBDb21wb25lbnRGYWN0b3J5PFQ+WydpbnB1dHMnXSkucHVzaCh7XG4gICAgICAgIHByb3BOYW1lOiBwcm9wTmFtZSxcbiAgICAgICAgdGVtcGxhdGVOYW1lOiBwdWJsaWNOYW1lLFxuICAgICAgICBpc1NpZ25hbDogKGZsYWdzICYgSW5wdXRGbGFncy5TaWduYWxCYXNlZCkgIT09IDAsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgKGFycmF5IGFzIENvbXBvbmVudEZhY3Rvcnk8VD5bJ291dHB1dHMnXSkucHVzaCh7XG4gICAgICAgIHByb3BOYW1lOiBwcm9wTmFtZSxcbiAgICAgICAgdGVtcGxhdGVOYW1lOiBwdWJsaWNOYW1lLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKGVsZW1lbnROYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgbmFtZSA9IGVsZW1lbnROYW1lLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBuYW1lID09PSAnc3ZnJyA/IFNWR19OQU1FU1BBQ0UgOiBuYW1lID09PSAnbWF0aCcgPyBNQVRIX01MX05BTUVTUEFDRSA6IG51bGw7XG59XG5cbi8qKlxuICogQ29tcG9uZW50RmFjdG9yeSBpbnRlcmZhY2UgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgb3ZlcnJpZGUgc2VsZWN0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGUgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBvdmVycmlkZSBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuICBpc0JvdW5kVG9Nb2R1bGU6IGJvb2xlYW47XG5cbiAgb3ZlcnJpZGUgZ2V0IGlucHV0cygpOiB7XG4gICAgcHJvcE5hbWU6IHN0cmluZztcbiAgICB0ZW1wbGF0ZU5hbWU6IHN0cmluZztcbiAgICBpc1NpZ25hbDogYm9vbGVhbjtcbiAgICB0cmFuc2Zvcm0/OiAodmFsdWU6IGFueSkgPT4gYW55O1xuICB9W10ge1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IHRoaXMuY29tcG9uZW50RGVmO1xuICAgIGNvbnN0IGlucHV0VHJhbnNmb3JtcyA9IGNvbXBvbmVudERlZi5pbnB1dFRyYW5zZm9ybXM7XG4gICAgY29uc3QgcmVmQXJyYXkgPSB0b1JlZkFycmF5KGNvbXBvbmVudERlZi5pbnB1dHMsIHRydWUpO1xuXG4gICAgaWYgKGlucHV0VHJhbnNmb3JtcyAhPT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBpbnB1dCBvZiByZWZBcnJheSkge1xuICAgICAgICBpZiAoaW5wdXRUcmFuc2Zvcm1zLmhhc093blByb3BlcnR5KGlucHV0LnByb3BOYW1lKSkge1xuICAgICAgICAgIGlucHV0LnRyYW5zZm9ybSA9IGlucHV0VHJhbnNmb3Jtc1tpbnB1dC5wcm9wTmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVmQXJyYXk7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgb3V0cHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLm91dHB1dHMsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gY29tcG9uZW50RGVmIFRoZSBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIG5nTW9kdWxlIFRoZSBOZ01vZHVsZVJlZiB0byB3aGljaCB0aGUgZmFjdG9yeSBpcyBib3VuZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55PixcbiAgICBwcml2YXRlIG5nTW9kdWxlPzogTmdNb2R1bGVSZWY8YW55PixcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnREZWYudHlwZTtcbiAgICB0aGlzLnNlbGVjdG9yID0gc3RyaW5naWZ5Q1NTU2VsZWN0b3JMaXN0KGNvbXBvbmVudERlZi5zZWxlY3RvcnMpO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID0gY29tcG9uZW50RGVmLm5nQ29udGVudFNlbGVjdG9yc1xuICAgICAgPyBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzXG4gICAgICA6IFtdO1xuICAgIHRoaXMuaXNCb3VuZFRvTW9kdWxlID0gISFuZ01vZHVsZTtcbiAgfVxuXG4gIG92ZXJyaWRlIGNyZWF0ZShcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW10gfCB1bmRlZmluZWQsXG4gICAgcm9vdFNlbGVjdG9yT3JOb2RlPzogYW55LFxuICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiBOZ01vZHVsZVJlZjxhbnk+IHwgRW52aXJvbm1lbnRJbmplY3RvciB8IHVuZGVmaW5lZCxcbiAgKTogQWJzdHJhY3RDb21wb25lbnRSZWY8VD4ge1xuICAgIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBpZiB0aGUgY29tcG9uZW50IGlzIG9ycGhhblxuICAgICAgaWYgKFxuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgKHR5cGVvZiBuZ0ppdE1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nSml0TW9kZSkgJiZcbiAgICAgICAgdGhpcy5jb21wb25lbnREZWYuZGVidWdJbmZvPy5mb3JiaWRPcnBoYW5SZW5kZXJpbmdcbiAgICAgICkge1xuICAgICAgICBpZiAoZGVwc1RyYWNrZXIuaXNPcnBoYW5Db21wb25lbnQodGhpcy5jb21wb25lbnRUeXBlKSkge1xuICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJVTlRJTUVfREVQU19PUlBIQU5fQ09NUE9ORU5ULFxuICAgICAgICAgICAgYE9ycGhhbiBjb21wb25lbnQgZm91bmQhIFRyeWluZyB0byByZW5kZXIgdGhlIGNvbXBvbmVudCAke2RlYnVnU3RyaW5naWZ5VHlwZUZvckVycm9yKFxuICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFR5cGUsXG4gICAgICAgICAgICApfSB3aXRob3V0IGZpcnN0IGxvYWRpbmcgdGhlIE5nTW9kdWxlIHRoYXQgZGVjbGFyZXMgaXQuIEl0IGlzIHJlY29tbWVuZGVkIHRvIG1ha2UgdGhpcyBjb21wb25lbnQgc3RhbmRhbG9uZSBpbiBvcmRlciB0byBhdm9pZCB0aGlzIGVycm9yLiBJZiB0aGlzIGlzIG5vdCBwb3NzaWJsZSBub3csIGltcG9ydCB0aGUgY29tcG9uZW50J3MgTmdNb2R1bGUgaW4gdGhlIGFwcHJvcHJpYXRlIE5nTW9kdWxlLCBvciB0aGUgc3RhbmRhbG9uZSBjb21wb25lbnQgaW4gd2hpY2ggeW91IGFyZSB0cnlpbmcgdG8gcmVuZGVyIHRoaXMgY29tcG9uZW50LiBJZiB0aGlzIGlzIGEgbGF6eSBpbXBvcnQsIGxvYWQgdGhlIE5nTW9kdWxlIGxhemlseSBhcyB3ZWxsIGFuZCB1c2UgaXRzIG1vZHVsZSBpbmplY3Rvci5gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZW52aXJvbm1lbnRJbmplY3RvciA9IGVudmlyb25tZW50SW5qZWN0b3IgfHwgdGhpcy5uZ01vZHVsZTtcblxuICAgICAgbGV0IHJlYWxFbnZpcm9ubWVudEluamVjdG9yID1cbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3RvciBpbnN0YW5jZW9mIEVudmlyb25tZW50SW5qZWN0b3JcbiAgICAgICAgICA/IGVudmlyb25tZW50SW5qZWN0b3JcbiAgICAgICAgICA6IGVudmlyb25tZW50SW5qZWN0b3I/LmluamVjdG9yO1xuXG4gICAgICBpZiAocmVhbEVudmlyb25tZW50SW5qZWN0b3IgJiYgdGhpcy5jb21wb25lbnREZWYuZ2V0U3RhbmRhbG9uZUluamVjdG9yICE9PSBudWxsKSB7XG4gICAgICAgIHJlYWxFbnZpcm9ubWVudEluamVjdG9yID1cbiAgICAgICAgICB0aGlzLmNvbXBvbmVudERlZi5nZXRTdGFuZGFsb25lSW5qZWN0b3IocmVhbEVudmlyb25tZW50SW5qZWN0b3IpIHx8XG4gICAgICAgICAgcmVhbEVudmlyb25tZW50SW5qZWN0b3I7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJvb3RWaWV3SW5qZWN0b3IgPSByZWFsRW52aXJvbm1lbnRJbmplY3RvclxuICAgICAgICA/IG5ldyBDaGFpbmVkSW5qZWN0b3IoaW5qZWN0b3IsIHJlYWxFbnZpcm9ubWVudEluamVjdG9yKVxuICAgICAgICA6IGluamVjdG9yO1xuXG4gICAgICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSByb290Vmlld0luamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyLCBudWxsKTtcbiAgICAgIGlmIChyZW5kZXJlckZhY3RvcnkgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFTkRFUkVSX05PVF9GT1VORCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICdBbmd1bGFyIHdhcyBub3QgYWJsZSB0byBpbmplY3QgYSByZW5kZXJlciAoUmVuZGVyZXJGYWN0b3J5MikuICcgK1xuICAgICAgICAgICAgICAnTGlrZWx5IHRoaXMgaXMgZHVlIHRvIGEgYnJva2VuIERJIGhpZXJhcmNoeS4gJyArXG4gICAgICAgICAgICAgICdNYWtlIHN1cmUgdGhhdCBhbnkgaW5qZWN0b3IgdXNlZCB0byBjcmVhdGUgdGhpcyBjb21wb25lbnQgaGFzIGEgY29ycmVjdCBwYXJlbnQuJyxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNhbml0aXplciA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KFNhbml0aXplciwgbnVsbCk7XG5cbiAgICAgIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIsIG51bGwpO1xuICAgICAgY29uc3QgY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBudWxsKTtcblxuICAgICAgY29uc3QgZW52aXJvbm1lbnQ6IExWaWV3RW52aXJvbm1lbnQgPSB7XG4gICAgICAgIHJlbmRlcmVyRmFjdG9yeSxcbiAgICAgICAgc2FuaXRpemVyLFxuICAgICAgICAvLyBXZSBkb24ndCB1c2UgaW5saW5lIGVmZmVjdHMgKHlldCkuXG4gICAgICAgIGlubGluZUVmZmVjdFJ1bm5lcjogbnVsbCxcbiAgICAgICAgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIsXG4gICAgICAgIGNoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGhvc3RSZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZik7XG4gICAgICAvLyBEZXRlcm1pbmUgYSB0YWcgbmFtZSB1c2VkIGZvciBjcmVhdGluZyBob3N0IGVsZW1lbnRzIHdoZW4gdGhpcyBjb21wb25lbnQgaXMgY3JlYXRlZFxuICAgICAgLy8gZHluYW1pY2FsbHkuIERlZmF1bHQgdG8gJ2RpdicgaWYgdGhpcyBjb21wb25lbnQgZGlkIG5vdCBzcGVjaWZ5IGFueSB0YWcgbmFtZSBpbiBpdHNcbiAgICAgIC8vIHNlbGVjdG9yLlxuICAgICAgY29uc3QgZWxlbWVudE5hbWUgPSAodGhpcy5jb21wb25lbnREZWYuc2VsZWN0b3JzWzBdWzBdIGFzIHN0cmluZykgfHwgJ2Rpdic7XG4gICAgICBjb25zdCBob3N0Uk5vZGUgPSByb290U2VsZWN0b3JPck5vZGVcbiAgICAgICAgPyBsb2NhdGVIb3N0RWxlbWVudChcbiAgICAgICAgICAgIGhvc3RSZW5kZXJlcixcbiAgICAgICAgICAgIHJvb3RTZWxlY3Rvck9yTm9kZSxcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50RGVmLmVuY2Fwc3VsYXRpb24sXG4gICAgICAgICAgICByb290Vmlld0luamVjdG9yLFxuICAgICAgICAgIClcbiAgICAgICAgOiBjcmVhdGVFbGVtZW50Tm9kZShob3N0UmVuZGVyZXIsIGVsZW1lbnROYW1lLCBnZXROYW1lc3BhY2UoZWxlbWVudE5hbWUpKTtcblxuICAgICAgbGV0IHJvb3RGbGFncyA9IExWaWV3RmxhZ3MuSXNSb290O1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50RGVmLnNpZ25hbHMpIHtcbiAgICAgICAgcm9vdEZsYWdzIHw9IExWaWV3RmxhZ3MuU2lnbmFsVmlldztcbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMuY29tcG9uZW50RGVmLm9uUHVzaCkge1xuICAgICAgICByb290RmxhZ3MgfD0gTFZpZXdGbGFncy5DaGVja0Fsd2F5cztcbiAgICAgIH1cblxuICAgICAgbGV0IGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3IHwgbnVsbCA9IG51bGw7XG4gICAgICBpZiAoaG9zdFJOb2RlICE9PSBudWxsKSB7XG4gICAgICAgIGh5ZHJhdGlvbkluZm8gPSByZXRyaWV2ZUh5ZHJhdGlvbkluZm8oaG9zdFJOb2RlLCByb290Vmlld0luamVjdG9yLCB0cnVlIC8qIGlzUm9vdFZpZXcgKi8pO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgdGhlIHJvb3Qgdmlldy4gVXNlcyBlbXB0eSBUVmlldyBhbmQgQ29udGVudFRlbXBsYXRlLlxuICAgICAgY29uc3Qgcm9vdFRWaWV3ID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIFRWaWV3VHlwZS5Sb290LFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgICAxLFxuICAgICAgICAwLFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IHJvb3RMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBudWxsLFxuICAgICAgICByb290VFZpZXcsXG4gICAgICAgIG51bGwsXG4gICAgICAgIHJvb3RGbGFncyxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgZW52aXJvbm1lbnQsXG4gICAgICAgIGhvc3RSZW5kZXJlcixcbiAgICAgICAgcm9vdFZpZXdJbmplY3RvcixcbiAgICAgICAgbnVsbCxcbiAgICAgICAgaHlkcmF0aW9uSW5mbyxcbiAgICAgICk7XG5cbiAgICAgIC8vIHJvb3RWaWV3IGlzIHRoZSBwYXJlbnQgd2hlbiBib290c3RyYXBwaW5nXG4gICAgICAvLyBUT0RPKG1pc2tvKTogaXQgbG9va3MgbGlrZSB3ZSBhcmUgZW50ZXJpbmcgdmlldyBoZXJlIGJ1dCB3ZSBkb24ndCByZWFsbHkgbmVlZCB0byBhc1xuICAgICAgLy8gYHJlbmRlclZpZXdgIGRvZXMgdGhhdC4gSG93ZXZlciBhcyB0aGUgY29kZSBpcyB3cml0dGVuIGl0IGlzIG5lZWRlZCBiZWNhdXNlXG4gICAgICAvLyBgY3JlYXRlUm9vdENvbXBvbmVudFZpZXdgIGFuZCBgY3JlYXRlUm9vdENvbXBvbmVudGAgYm90aCByZWFkIGdsb2JhbCBzdGF0ZS4gRml4aW5nIHRob3NlXG4gICAgICAvLyBpc3N1ZXMgd291bGQgYWxsb3cgdXMgdG8gZHJvcCB0aGlzLlxuICAgICAgZW50ZXJWaWV3KHJvb3RMVmlldyk7XG5cbiAgICAgIGxldCBjb21wb25lbnQ6IFQ7XG4gICAgICBsZXQgdEVsZW1lbnROb2RlOiBURWxlbWVudE5vZGU7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJvb3RDb21wb25lbnREZWYgPSB0aGlzLmNvbXBvbmVudERlZjtcbiAgICAgICAgbGV0IHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXTtcbiAgICAgICAgbGV0IGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmcyB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGlmIChyb290Q29tcG9uZW50RGVmLmZpbmRIb3N0RGlyZWN0aXZlRGVmcykge1xuICAgICAgICAgIHJvb3REaXJlY3RpdmVzID0gW107XG4gICAgICAgICAgaG9zdERpcmVjdGl2ZURlZnMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgcm9vdENvbXBvbmVudERlZi5maW5kSG9zdERpcmVjdGl2ZURlZnMoXG4gICAgICAgICAgICByb290Q29tcG9uZW50RGVmLFxuICAgICAgICAgICAgcm9vdERpcmVjdGl2ZXMsXG4gICAgICAgICAgICBob3N0RGlyZWN0aXZlRGVmcyxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJvb3REaXJlY3RpdmVzLnB1c2gocm9vdENvbXBvbmVudERlZik7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vRHVwbGljYXRlRGlyZWN0aXZlcyhyb290RGlyZWN0aXZlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcm9vdERpcmVjdGl2ZXMgPSBbcm9vdENvbXBvbmVudERlZl07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBob3N0VE5vZGUgPSBjcmVhdGVSb290Q29tcG9uZW50VE5vZGUocm9vdExWaWV3LCBob3N0Uk5vZGUpO1xuICAgICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgICAgaG9zdFROb2RlLFxuICAgICAgICAgIGhvc3RSTm9kZSxcbiAgICAgICAgICByb290Q29tcG9uZW50RGVmLFxuICAgICAgICAgIHJvb3REaXJlY3RpdmVzLFxuICAgICAgICAgIHJvb3RMVmlldyxcbiAgICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgICBob3N0UmVuZGVyZXIsXG4gICAgICAgICk7XG5cbiAgICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUocm9vdFRWaWV3LCBIRUFERVJfT0ZGU0VUKSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IGluIHByYWN0aWNlIGBob3N0Uk5vZGVgIHNob3VsZCBhbHdheXMgYmUgZGVmaW5lZCwgYnV0IHRoZXJlIGFyZSBzb21lXG4gICAgICAgIC8vIHRlc3RzIHdoZXJlIHRoZSByZW5kZXJlciBpcyBtb2NrZWQgb3V0IGFuZCBgdW5kZWZpbmVkYCBpcyByZXR1cm5lZC4gV2Ugc2hvdWxkIHVwZGF0ZSB0aGVcbiAgICAgICAgLy8gdGVzdHMgc28gdGhhdCB0aGlzIGNoZWNrIGNhbiBiZSByZW1vdmVkLlxuICAgICAgICBpZiAoaG9zdFJOb2RlKSB7XG4gICAgICAgICAgc2V0Um9vdE5vZGVBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgcm9vdENvbXBvbmVudERlZiwgaG9zdFJOb2RlLCByb290U2VsZWN0b3JPck5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2plY3RhYmxlTm9kZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHByb2plY3ROb2Rlcyh0RWxlbWVudE5vZGUsIHRoaXMubmdDb250ZW50U2VsZWN0b3JzLCBwcm9qZWN0YWJsZU5vZGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlclxuICAgICAgICAvLyBhbmQgZXhlY3V0ZWQgaGVyZT8gQW5ndWxhciA1IHJlZmVyZW5jZTogaHR0cHM6Ly9zdGFja2JsaXR6LmNvbS9lZGl0L2xpZmVjeWNsZS1ob29rcy12Y3JlZlxuICAgICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsXG4gICAgICAgICAgcm9vdENvbXBvbmVudERlZixcbiAgICAgICAgICByb290RGlyZWN0aXZlcyxcbiAgICAgICAgICBob3N0RGlyZWN0aXZlRGVmcyxcbiAgICAgICAgICByb290TFZpZXcsXG4gICAgICAgICAgW0xpZmVjeWNsZUhvb2tzRmVhdHVyZV0sXG4gICAgICAgICk7XG4gICAgICAgIHJlbmRlclZpZXcocm9vdFRWaWV3LCByb290TFZpZXcsIG51bGwpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgbGVhdmVWaWV3KCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50UmVmKFxuICAgICAgICB0aGlzLmNvbXBvbmVudFR5cGUsXG4gICAgICAgIGNvbXBvbmVudCxcbiAgICAgICAgY3JlYXRlRWxlbWVudFJlZih0RWxlbWVudE5vZGUsIHJvb3RMVmlldyksXG4gICAgICAgIHJvb3RMVmlldyxcbiAgICAgICAgdEVsZW1lbnROb2RlLFxuICAgICAgKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRSZWY8VD4ge1xuICBvdmVycmlkZSBpbnN0YW5jZTogVDtcbiAgb3ZlcnJpZGUgaG9zdFZpZXc6IFZpZXdSZWY8VD47XG4gIG92ZXJyaWRlIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcbiAgb3ZlcnJpZGUgY29tcG9uZW50VHlwZTogVHlwZTxUPjtcbiAgcHJpdmF0ZSBwcmV2aW91c0lucHV0VmFsdWVzOiBNYXA8c3RyaW5nLCB1bmtub3duPiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbXBvbmVudFR5cGU6IFR5cGU8VD4sXG4gICAgaW5zdGFuY2U6IFQsXG4gICAgcHVibGljIGxvY2F0aW9uOiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgX3Jvb3RMVmlldzogTFZpZXcsXG4gICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICApIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBWaWV3UmVmPFQ+KFxuICAgICAgX3Jvb3RMVmlldyxcbiAgICAgIHVuZGVmaW5lZCAvKiBfY2RSZWZJbmplY3RpbmdWaWV3ICovLFxuICAgICAgZmFsc2UgLyogbm90aWZ5RXJyb3JIYW5kbGVyICovLFxuICAgICk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldElucHV0KG5hbWU6IHN0cmluZywgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgICBjb25zdCBpbnB1dERhdGEgPSB0aGlzLl90Tm9kZS5pbnB1dHM7XG4gICAgbGV0IGRhdGFWYWx1ZTogTm9kZUlucHV0QmluZGluZ3NbdHlwZW9mIG5hbWVdIHwgdW5kZWZpbmVkO1xuICAgIGlmIChpbnB1dERhdGEgIT09IG51bGwgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtuYW1lXSkpIHtcbiAgICAgIHRoaXMucHJldmlvdXNJbnB1dFZhbHVlcyA/Pz0gbmV3IE1hcCgpO1xuICAgICAgLy8gRG8gbm90IHNldCB0aGUgaW5wdXQgaWYgaXQgaXMgdGhlIHNhbWUgYXMgdGhlIGxhc3QgdmFsdWVcbiAgICAgIC8vIFRoaXMgYmVoYXZpb3IgbWF0Y2hlcyBgYmluZGluZ1VwZGF0ZWRgIHdoZW4gYmluZGluZyBpbnB1dHMgaW4gdGVtcGxhdGVzLlxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLnByZXZpb3VzSW5wdXRWYWx1ZXMuaGFzKG5hbWUpICYmXG4gICAgICAgIE9iamVjdC5pcyh0aGlzLnByZXZpb3VzSW5wdXRWYWx1ZXMuZ2V0KG5hbWUpLCB2YWx1ZSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fcm9vdExWaWV3O1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXdbVFZJRVddLCBsVmlldywgZGF0YVZhbHVlLCBuYW1lLCB2YWx1ZSk7XG4gICAgICB0aGlzLnByZXZpb3VzSW5wdXRWYWx1ZXMuc2V0KG5hbWUsIHZhbHVlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodGhpcy5fdE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIG1hcmtWaWV3RGlydHkoY2hpbGRDb21wb25lbnRMVmlldywgTm90aWZpY2F0aW9uU291cmNlLlNldElucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBjbXBOYW1lRm9yRXJyb3IgPSBzdHJpbmdpZnlGb3JFcnJvcih0aGlzLmNvbXBvbmVudFR5cGUpO1xuICAgICAgICBsZXQgbWVzc2FnZSA9IGBDYW4ndCBzZXQgdmFsdWUgb2YgdGhlICcke25hbWV9JyBpbnB1dCBvbiB0aGUgJyR7Y21wTmFtZUZvckVycm9yfScgY29tcG9uZW50LiBgO1xuICAgICAgICBtZXNzYWdlICs9IGBNYWtlIHN1cmUgdGhhdCB0aGUgJyR7bmFtZX0nIHByb3BlcnR5IGlzIGFubm90YXRlZCB3aXRoIEBJbnB1dCgpIG9yIGEgbWFwcGVkIEBJbnB1dCgnJHtuYW1lfScpIGV4aXN0cy5gO1xuICAgICAgICByZXBvcnRVbmtub3duUHJvcGVydHlFcnJvcihtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX3ROb2RlLCB0aGlzLl9yb290TFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmhvc3RWaWV3LmRlc3Ryb3koKTtcbiAgfVxuXG4gIG92ZXJyaWRlIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdFZpZXcub25EZXN0cm95KGNhbGxiYWNrKTtcbiAgfVxufVxuXG4vKiogUmVwcmVzZW50cyBhIEhvc3RGZWF0dXJlIGZ1bmN0aW9uLiAqL1xudHlwZSBIb3N0RmVhdHVyZSA9IDxUPihjb21wb25lbnQ6IFQsIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+KSA9PiB2b2lkO1xuXG4vKiogQ3JlYXRlcyBhIFROb2RlIHRoYXQgY2FuIGJlIHVzZWQgdG8gaW5zdGFudGlhdGUgYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRUTm9kZShsVmlldzogTFZpZXcsIHJOb2RlOiBSTm9kZSk6IFRFbGVtZW50Tm9kZSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBpbmRleCA9IEhFQURFUl9PRkZTRVQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgbFZpZXdbaW5kZXhdID0gck5vZGU7XG5cbiAgLy8gJyNob3N0JyBpcyBhZGRlZCBoZXJlIGFzIHdlIGRvbid0IGtub3cgdGhlIHJlYWwgaG9zdCBET00gbmFtZSAod2UgZG9uJ3Qgd2FudCB0byByZWFkIGl0KSBhbmQgYXRcbiAgLy8gdGhlIHNhbWUgdGltZSB3ZSB3YW50IHRvIGNvbW11bmljYXRlIHRoZSBkZWJ1ZyBgVE5vZGVgIHRoYXQgdGhpcyBpcyBhIHNwZWNpYWwgYFROb2RlYFxuICAvLyByZXByZXNlbnRpbmcgYSBob3N0IGVsZW1lbnQuXG4gIHJldHVybiBnZXRPckNyZWF0ZVROb2RlKHRWaWV3LCBpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsICcjaG9zdCcsIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIHJvb3QgY29tcG9uZW50IHZpZXcgYW5kIHRoZSByb290IGNvbXBvbmVudCBub2RlLlxuICpcbiAqIEBwYXJhbSBob3N0Uk5vZGUgUmVuZGVyIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSByb290Q29tcG9uZW50RGVmIENvbXBvbmVudERlZlxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSBwYXJlbnQgdmlldyB3aGVyZSB0aGUgaG9zdCBub2RlIGlzIHN0b3JlZFxuICogQHBhcmFtIHJlbmRlcmVyRmFjdG9yeSBGYWN0b3J5IHRvIGJlIHVzZWQgZm9yIGNyZWF0aW5nIGNoaWxkIHJlbmRlcmVycy5cbiAqIEBwYXJhbSBob3N0UmVuZGVyZXIgVGhlIGN1cnJlbnQgcmVuZGVyZXJcbiAqIEBwYXJhbSBzYW5pdGl6ZXIgVGhlIHNhbml0aXplciwgaWYgcHJvdmlkZWRcbiAqXG4gKiBAcmV0dXJucyBDb21wb25lbnQgdmlldyBjcmVhdGVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICB0Tm9kZTogVEVsZW1lbnROb2RlLFxuICBob3N0Uk5vZGU6IFJFbGVtZW50IHwgbnVsbCxcbiAgcm9vdENvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4sXG4gIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLFxuICByb290VmlldzogTFZpZXcsXG4gIGVudmlyb25tZW50OiBMVmlld0Vudmlyb25tZW50LFxuICBob3N0UmVuZGVyZXI6IFJlbmRlcmVyLFxuKTogTFZpZXcge1xuICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgYXBwbHlSb290Q29tcG9uZW50U3R5bGluZyhyb290RGlyZWN0aXZlcywgdE5vZGUsIGhvc3RSTm9kZSwgaG9zdFJlbmRlcmVyKTtcblxuICAvLyBIeWRyYXRpb24gaW5mbyBpcyBvbiB0aGUgaG9zdCBlbGVtZW50IGFuZCBuZWVkcyB0byBiZSByZXRyaWV2ZWRcbiAgLy8gYW5kIHBhc3NlZCB0byB0aGUgY29tcG9uZW50IExWaWV3LlxuICBsZXQgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcgfCBudWxsID0gbnVsbDtcbiAgaWYgKGhvc3RSTm9kZSAhPT0gbnVsbCkge1xuICAgIGh5ZHJhdGlvbkluZm8gPSByZXRyaWV2ZUh5ZHJhdGlvbkluZm8oaG9zdFJOb2RlLCByb290Vmlld1tJTkpFQ1RPUl0hKTtcbiAgfVxuICBjb25zdCB2aWV3UmVuZGVyZXIgPSBlbnZpcm9ubWVudC5yZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCByb290Q29tcG9uZW50RGVmKTtcbiAgbGV0IGxWaWV3RmxhZ3MgPSBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzO1xuICBpZiAocm9vdENvbXBvbmVudERlZi5zaWduYWxzKSB7XG4gICAgbFZpZXdGbGFncyA9IExWaWV3RmxhZ3MuU2lnbmFsVmlldztcbiAgfSBlbHNlIGlmIChyb290Q29tcG9uZW50RGVmLm9uUHVzaCkge1xuICAgIGxWaWV3RmxhZ3MgPSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICByb290VmlldyxcbiAgICBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3KHJvb3RDb21wb25lbnREZWYpLFxuICAgIG51bGwsXG4gICAgbFZpZXdGbGFncyxcbiAgICByb290Vmlld1t0Tm9kZS5pbmRleF0sXG4gICAgdE5vZGUsXG4gICAgZW52aXJvbm1lbnQsXG4gICAgdmlld1JlbmRlcmVyLFxuICAgIG51bGwsXG4gICAgbnVsbCxcbiAgICBoeWRyYXRpb25JbmZvLFxuICApO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3LCB0Tm9kZSwgcm9vdERpcmVjdGl2ZXMubGVuZ3RoIC0gMSk7XG4gIH1cblxuICBhZGRUb1ZpZXdUcmVlKHJvb3RWaWV3LCBjb21wb25lbnRWaWV3KTtcblxuICAvLyBTdG9yZSBjb21wb25lbnQgdmlldyBhdCBub2RlIGluZGV4LCB3aXRoIG5vZGUgYXMgdGhlIEhPU1RcbiAgcmV0dXJuIChyb290Vmlld1t0Tm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3KTtcbn1cblxuLyoqIFNldHMgdXAgdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24gb24gYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIGFwcGx5Um9vdENvbXBvbmVudFN0eWxpbmcoXG4gIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLFxuICB0Tm9kZTogVEVsZW1lbnROb2RlLFxuICByTm9kZTogUkVsZW1lbnQgfCBudWxsLFxuICBob3N0UmVuZGVyZXI6IFJlbmRlcmVyLFxuKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZGVmIG9mIHJvb3REaXJlY3RpdmVzKSB7XG4gICAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgZGVmLmhvc3RBdHRycyk7XG4gIH1cblxuICBpZiAodE5vZGUubWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBjb21wdXRlU3RhdGljU3R5bGluZyh0Tm9kZSwgdE5vZGUubWVyZ2VkQXR0cnMsIHRydWUpO1xuXG4gICAgaWYgKHJOb2RlICE9PSBudWxsKSB7XG4gICAgICBzZXR1cFN0YXRpY0F0dHJpYnV0ZXMoaG9zdFJlbmRlcmVyLCByTm9kZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSByb290IGNvbXBvbmVudCBhbmQgc2V0cyBpdCB1cCB3aXRoIGZlYXR1cmVzIGFuZCBob3N0IGJpbmRpbmdzLlNoYXJlZCBieVxuICogcmVuZGVyQ29tcG9uZW50KCkgYW5kIFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KCkuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gIGNvbXBvbmVudFZpZXc6IExWaWV3LFxuICByb290Q29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4sXG4gIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLFxuICBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnMgfCBudWxsLFxuICByb290TFZpZXc6IExWaWV3LFxuICBob3N0RmVhdHVyZXM6IEhvc3RGZWF0dXJlW10gfCBudWxsLFxuKTogYW55IHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChyb290VE5vZGUsICd0Tm9kZSBzaG91bGQgaGF2ZSBiZWVuIGFscmVhZHkgY3JlYXRlZCcpO1xuICBjb25zdCB0VmlldyA9IHJvb3RMVmlld1tUVklFV107XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocm9vdFROb2RlLCByb290TFZpZXcpO1xuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzKHRWaWV3LCByb290TFZpZXcsIHJvb3RUTm9kZSwgcm9vdERpcmVjdGl2ZXMsIG51bGwsIGhvc3REaXJlY3RpdmVEZWZzKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3REaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSByb290VE5vZGUuZGlyZWN0aXZlU3RhcnQgKyBpO1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluc3RhbmNlID0gZ2V0Tm9kZUluamVjdGFibGUocm9vdExWaWV3LCB0VmlldywgZGlyZWN0aXZlSW5kZXgsIHJvb3RUTm9kZSk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZUluc3RhbmNlLCByb290TFZpZXcpO1xuICB9XG5cbiAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0Vmlldywgcm9vdExWaWV3LCByb290VE5vZGUpO1xuXG4gIGlmIChuYXRpdmUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCByb290TFZpZXcpO1xuICB9XG5cbiAgLy8gV2UncmUgZ3VhcmFudGVlZCBmb3IgdGhlIGBjb21wb25lbnRPZmZzZXRgIHRvIGJlIHBvc2l0aXZlIGhlcmVcbiAgLy8gc2luY2UgYSByb290IGNvbXBvbmVudCBhbHdheXMgbWF0Y2hlcyBhIGNvbXBvbmVudCBkZWYuXG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydEdyZWF0ZXJUaGFuKHJvb3RUTm9kZS5jb21wb25lbnRPZmZzZXQsIC0xLCAnY29tcG9uZW50T2Zmc2V0IG11c3QgYmUgZ3JlYXQgdGhhbiAtMScpO1xuICBjb25zdCBjb21wb25lbnQgPSBnZXROb2RlSW5qZWN0YWJsZShcbiAgICByb290TFZpZXcsXG4gICAgdFZpZXcsXG4gICAgcm9vdFROb2RlLmRpcmVjdGl2ZVN0YXJ0ICsgcm9vdFROb2RlLmNvbXBvbmVudE9mZnNldCxcbiAgICByb290VE5vZGUsXG4gICk7XG4gIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSByb290TFZpZXdbQ09OVEVYVF0gPSBjb21wb25lbnQ7XG5cbiAgaWYgKGhvc3RGZWF0dXJlcyAhPT0gbnVsbCkge1xuICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBob3N0RmVhdHVyZXMpIHtcbiAgICAgIGZlYXR1cmUoY29tcG9uZW50LCByb290Q29tcG9uZW50RGVmKTtcbiAgICB9XG4gIH1cblxuICAvLyBXZSB3YW50IHRvIGdlbmVyYXRlIGFuIGVtcHR5IFF1ZXJ5TGlzdCBmb3Igcm9vdCBjb250ZW50IHF1ZXJpZXMgZm9yIGJhY2t3YXJkc1xuICAvLyBjb21wYXRpYmlsaXR5IHdpdGggVmlld0VuZ2luZS5cbiAgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3LCByb290VE5vZGUsIHJvb3RMVmlldyk7XG5cbiAgcmV0dXJuIGNvbXBvbmVudDtcbn1cblxuLyoqIFNldHMgdGhlIHN0YXRpYyBhdHRyaWJ1dGVzIG9uIGEgcm9vdCBjb21wb25lbnQuICovXG5mdW5jdGlvbiBzZXRSb290Tm9kZUF0dHJpYnV0ZXMoXG4gIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIyLFxuICBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjx1bmtub3duPixcbiAgaG9zdFJOb2RlOiBSRWxlbWVudCxcbiAgcm9vdFNlbGVjdG9yT3JOb2RlOiBhbnksXG4pIHtcbiAgaWYgKHJvb3RTZWxlY3Rvck9yTm9kZSkge1xuICAgIC8vIFRoZSBwbGFjZWhvbGRlciB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIGFjdHVhbCB2ZXJzaW9uIGF0IGJ1aWxkIHRpbWUuXG4gICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgaG9zdFJOb2RlLCBbJ25nLXZlcnNpb24nLCAnMC4wLjAtUExBQ0VIT0xERVInXSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWYgaG9zdCBlbGVtZW50IGlzIGNyZWF0ZWQgYXMgYSBwYXJ0IG9mIHRoaXMgZnVuY3Rpb24gY2FsbCAoaS5lLiBgcm9vdFNlbGVjdG9yT3JOb2RlYFxuICAgIC8vIGlzIG5vdCBkZWZpbmVkKSwgYWxzbyBhcHBseSBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGV4dHJhY3RlZCBmcm9tIGNvbXBvbmVudCBzZWxlY3Rvci5cbiAgICAvLyBFeHRyYWN0IGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgZnJvbSB0aGUgZmlyc3Qgc2VsZWN0b3Igb25seSB0byBtYXRjaCBWRSBiZWhhdmlvci5cbiAgICBjb25zdCB7YXR0cnMsIGNsYXNzZXN9ID0gZXh0cmFjdEF0dHJzQW5kQ2xhc3Nlc0Zyb21TZWxlY3Rvcihjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdKTtcbiAgICBpZiAoYXR0cnMpIHtcbiAgICAgIHNldFVwQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgYXR0cnMpO1xuICAgIH1cbiAgICBpZiAoY2xhc3NlcyAmJiBjbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIHdyaXRlRGlyZWN0Q2xhc3MoaG9zdFJlbmRlcmVyLCBob3N0Uk5vZGUsIGNsYXNzZXMuam9pbignICcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFByb2plY3RzIHRoZSBgcHJvamVjdGFibGVOb2Rlc2AgdGhhdCB3ZXJlIHNwZWNpZmllZCB3aGVuIGNyZWF0aW5nIGEgcm9vdCBjb21wb25lbnQuICovXG5mdW5jdGlvbiBwcm9qZWN0Tm9kZXMoXG4gIHROb2RlOiBURWxlbWVudE5vZGUsXG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW10sXG4gIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sXG4pIHtcbiAgY29uc3QgcHJvamVjdGlvbjogKFROb2RlIHwgUk5vZGVbXSB8IG51bGwpW10gPSAodE5vZGUucHJvamVjdGlvbiA9IFtdKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZ0NvbnRlbnRTZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2Rlc2ZvclNsb3QgPSBwcm9qZWN0YWJsZU5vZGVzW2ldO1xuICAgIC8vIFByb2plY3RhYmxlIG5vZGVzIGNhbiBiZSBwYXNzZWQgYXMgYXJyYXkgb2YgYXJyYXlzIG9yIGFuIGFycmF5IG9mIGl0ZXJhYmxlcyAobmdVcGdyYWRlXG4gICAgLy8gY2FzZSkuIEhlcmUgd2UgZG8gbm9ybWFsaXplIHBhc3NlZCBkYXRhIHN0cnVjdHVyZSB0byBiZSBhbiBhcnJheSBvZiBhcnJheXMgdG8gYXZvaWRcbiAgICAvLyBjb21wbGV4IGNoZWNrcyBkb3duIHRoZSBsaW5lLlxuICAgIC8vIFdlIGFsc28gbm9ybWFsaXplIHRoZSBsZW5ndGggb2YgdGhlIHBhc3NlZCBpbiBwcm9qZWN0YWJsZSBub2RlcyAodG8gbWF0Y2ggdGhlIG51bWJlciBvZlxuICAgIC8vIDxuZy1jb250YWluZXI+IHNsb3RzIGRlZmluZWQgYnkgYSBjb21wb25lbnQpLlxuICAgIHByb2plY3Rpb24ucHVzaChub2Rlc2ZvclNsb3QgIT0gbnVsbCA/IEFycmF5LmZyb20obm9kZXNmb3JTbG90KSA6IG51bGwpO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBlbmFibGUgbGlmZWN5Y2xlIGhvb2tzIG9uIHRoZSByb290IGNvbXBvbmVudC5cbiAqXG4gKiBJbmNsdWRlIHRoaXMgZmVhdHVyZSB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgaWYgdGhlIHJvb3QgY29tcG9uZW50XG4gKiB5b3UgYXJlIHJlbmRlcmluZyBoYXMgbGlmZWN5Y2xlIGhvb2tzIGRlZmluZWQuIE90aGVyd2lzZSwgdGhlIGhvb2tzIHdvbid0XG4gKiBiZSBjYWxsZWQgcHJvcGVybHkuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIHJlbmRlckNvbXBvbmVudChBcHBDb21wb25lbnQsIHtob3N0RmVhdHVyZXM6IFtMaWZlY3ljbGVIb29rc0ZlYXR1cmVdfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIExpZmVjeWNsZUhvb2tzRmVhdHVyZSgpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnVE5vZGUgaXMgcmVxdWlyZWQnKTtcbiAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyhnZXRMVmlldygpW1RWSUVXXSwgdE5vZGUpO1xufVxuIl19