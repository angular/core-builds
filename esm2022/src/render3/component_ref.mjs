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
import { unregisterLView } from './interfaces/lview_tracking';
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
            const changeDetectionScheduler = rootViewInjector.get(ChangeDetectionScheduler, null);
            const environment = {
                rendererFactory,
                sanitizer,
                // We don't use inline effects (yet).
                inlineEffectRunner: null,
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
            let componentView = null;
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
                componentView = createRootComponentView(hostTNode, hostRNode, rootComponentDef, rootDirectives, rootLView, environment, hostRenderer);
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
            catch (e) {
                // Stop tracking the views if creation failed since
                // the consumer won't have a way to dereference them.
                if (componentView !== null) {
                    unregisterLView(componentView);
                }
                unregisterLView(rootLView);
                throw e;
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
        setUpAttributes(hostRenderer, hostRNode, ['ng-version', '18.2.3+sha-98ffbb3']);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUduRSxPQUFPLEVBQ0wsd0JBQXdCLEdBRXpCLE1BQU0sb0RBQW9ELENBQUM7QUFFNUQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEQsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFFekQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekQsT0FBTyxFQUNMLGdCQUFnQixJQUFJLHdCQUF3QixFQUM1QyxZQUFZLElBQUksb0JBQW9CLEdBQ3JDLE1BQU0sNkJBQTZCLENBQUM7QUFDckMsT0FBTyxFQUFDLHdCQUF3QixJQUFJLGdDQUFnQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLGdCQUFnQixFQUFhLE1BQU0sdUJBQXVCLENBQUM7QUFFbkUsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHcEYsT0FBTyxFQUFDLG1CQUFtQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzFFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw2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QUFFRDs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDdkQsc0JBQXNCLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3NldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsXG4gIE5vdGlmaWNhdGlvblNvdXJjZSxcbn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7RGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uL2h5ZHJhdGlvbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7cmV0cmlldmVIeWRyYXRpb25JbmZvfSBmcm9tICcuLi9oeWRyYXRpb24vdXRpbHMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1xuICBDb21wb25lbnRGYWN0b3J5IGFzIEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeSxcbiAgQ29tcG9uZW50UmVmIGFzIEFic3RyYWN0Q29tcG9uZW50UmVmLFxufSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIEVsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0SW5kZXhJblJhbmdlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7QWZ0ZXJSZW5kZXJNYW5hZ2VyfSBmcm9tICcuL2FmdGVyX3JlbmRlci9tYW5hZ2VyJztcbmltcG9ydCB7YXNzZXJ0Q29tcG9uZW50VHlwZSwgYXNzZXJ0Tm9EdXBsaWNhdGVEaXJlY3RpdmVzfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGVwc1RyYWNrZXJ9IGZyb20gJy4vZGVwc190cmFja2VyL2RlcHNfdHJhY2tlcic7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBOb2RlSW5qZWN0b3J9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtyZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7cmVwb3J0VW5rbm93blByb3BlcnR5RXJyb3J9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2VsZW1lbnRfdmFsaWRhdGlvbic7XG5pbXBvcnQge21hcmtWaWV3RGlydHl9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL21hcmtfdmlld19kaXJ0eSc7XG5pbXBvcnQge3JlbmRlclZpZXd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3JlbmRlcic7XG5pbXBvcnQge1xuICBhZGRUb1ZpZXdUcmVlLFxuICBjcmVhdGVMVmlldyxcbiAgY3JlYXRlVFZpZXcsXG4gIGV4ZWN1dGVDb250ZW50UXVlcmllcyxcbiAgZ2V0T3JDcmVhdGVDb21wb25lbnRUVmlldyxcbiAgZ2V0T3JDcmVhdGVUTm9kZSxcbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXMsXG4gIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3MsXG4gIGxvY2F0ZUhvc3RFbGVtZW50LFxuICBtYXJrQXNDb21wb25lbnRIb3N0LFxuICBzZXRJbnB1dHNGb3JQcm9wZXJ0eSxcbn0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWYsIEhvc3REaXJlY3RpdmVEZWZzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0lucHV0RmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9pbnB1dF9mbGFncyc7XG5pbXBvcnQge1xuICBOb2RlSW5wdXRCaW5kaW5ncyxcbiAgVENvbnRhaW5lck5vZGUsXG4gIFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgVEVsZW1lbnROb2RlLFxuICBUTm9kZSxcbiAgVE5vZGVUeXBlLFxufSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtcbiAgQ09OVEVYVCxcbiAgSEVBREVSX09GRlNFVCxcbiAgSU5KRUNUT1IsXG4gIExWaWV3LFxuICBMVmlld0Vudmlyb25tZW50LFxuICBMVmlld0ZsYWdzLFxuICBUVklFVyxcbiAgVFZpZXdUeXBlLFxufSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge01BVEhfTUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFfSBmcm9tICcuL25hbWVzcGFjZXMnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50Tm9kZSwgc2V0dXBTdGF0aWNBdHRyaWJ1dGVzLCB3cml0ZURpcmVjdENsYXNzfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7XG4gIGV4dHJhY3RBdHRyc0FuZENsYXNzZXNGcm9tU2VsZWN0b3IsXG4gIHN0cmluZ2lmeUNTU1NlbGVjdG9yTGlzdCxcbn0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGxlYXZlVmlld30gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2NvbXB1dGVTdGF0aWNTdHlsaW5nfSBmcm9tICcuL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcnO1xuaW1wb3J0IHttZXJnZUhvc3RBdHRycywgc2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtkZWJ1Z1N0cmluZ2lmeVR5cGVGb3JFcnJvciwgc3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuaW1wb3J0IHtDaGFpbmVkSW5qZWN0b3J9IGZyb20gJy4vY2hhaW5lZF9pbmplY3Rvcic7XG5pbXBvcnQge3VucmVnaXN0ZXJMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL2x2aWV3X3RyYWNraW5nJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggYWxsIHJlc29sdmVkIGZhY3RvcmllcyBhcmUgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5nTW9kdWxlPzogTmdNb2R1bGVSZWY8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBvdmVycmlkZSByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBBYnN0cmFjdENvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnRUeXBlKGNvbXBvbmVudCk7XG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkhO1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYsIHRoaXMubmdNb2R1bGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvUmVmQXJyYXk8VD4oXG4gIG1hcDogRGlyZWN0aXZlRGVmPFQ+WydpbnB1dHMnXSxcbiAgaXNJbnB1dE1hcDogdHJ1ZSxcbik6IENvbXBvbmVudEZhY3Rvcnk8VD5bJ2lucHV0cyddO1xuZnVuY3Rpb24gdG9SZWZBcnJheTxUPihcbiAgbWFwOiBEaXJlY3RpdmVEZWY8VD5bJ291dHB1dHMnXSxcbiAgaXNJbnB1dDogZmFsc2UsXG4pOiBDb21wb25lbnRGYWN0b3J5PFQ+WydvdXRwdXRzJ107XG5cbmZ1bmN0aW9uIHRvUmVmQXJyYXk8XG4gIFQsXG4gIElzSW5wdXRNYXAgZXh0ZW5kcyBib29sZWFuLFxuICBSZXR1cm4gZXh0ZW5kcyBJc0lucHV0TWFwIGV4dGVuZHMgdHJ1ZVxuICAgID8gQ29tcG9uZW50RmFjdG9yeTxUPlsnaW5wdXRzJ11cbiAgICA6IENvbXBvbmVudEZhY3Rvcnk8VD5bJ291dHB1dHMnXSxcbj4obWFwOiBEaXJlY3RpdmVEZWY8VD5bJ2lucHV0cyddIHwgRGlyZWN0aXZlRGVmPFQ+WydvdXRwdXRzJ10sIGlzSW5wdXRNYXA6IElzSW5wdXRNYXApOiBSZXR1cm4ge1xuICBjb25zdCBhcnJheTogUmV0dXJuID0gW10gYXMgdW5rbm93biBhcyBSZXR1cm47XG4gIGZvciAoY29uc3QgcHVibGljTmFtZSBpbiBtYXApIHtcbiAgICBpZiAoIW1hcC5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdmFsdWUgPSBtYXBbcHVibGljTmFtZV07XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHZhbHVlKTtcbiAgICBjb25zdCBwcm9wTmFtZTogc3RyaW5nID0gaXNBcnJheSA/IHZhbHVlWzBdIDogdmFsdWU7XG4gICAgY29uc3QgZmxhZ3M6IElucHV0RmxhZ3MgPSBpc0FycmF5ID8gdmFsdWVbMV0gOiBJbnB1dEZsYWdzLk5vbmU7XG5cbiAgICBpZiAoaXNJbnB1dE1hcCkge1xuICAgICAgKGFycmF5IGFzIENvbXBvbmVudEZhY3Rvcnk8VD5bJ2lucHV0cyddKS5wdXNoKHtcbiAgICAgICAgcHJvcE5hbWU6IHByb3BOYW1lLFxuICAgICAgICB0ZW1wbGF0ZU5hbWU6IHB1YmxpY05hbWUsXG4gICAgICAgIGlzU2lnbmFsOiAoZmxhZ3MgJiBJbnB1dEZsYWdzLlNpZ25hbEJhc2VkKSAhPT0gMCxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAoYXJyYXkgYXMgQ29tcG9uZW50RmFjdG9yeTxUPlsnb3V0cHV0cyddKS5wdXNoKHtcbiAgICAgICAgcHJvcE5hbWU6IHByb3BOYW1lLFxuICAgICAgICB0ZW1wbGF0ZU5hbWU6IHB1YmxpY05hbWUsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBnZXROYW1lc3BhY2UoZWxlbWVudE5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBuYW1lID0gZWxlbWVudE5hbWUudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIG5hbWUgPT09ICdzdmcnID8gU1ZHX05BTUVTUEFDRSA6IG5hbWUgPT09ICdtYXRoJyA/IE1BVEhfTUxfTkFNRVNQQUNFIDogbnVsbDtcbn1cblxuLyoqXG4gKiBDb21wb25lbnRGYWN0b3J5IGludGVyZmFjZSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8VD4gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICBvdmVycmlkZSBzZWxlY3Rvcjogc3RyaW5nO1xuICBvdmVycmlkZSBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIG92ZXJyaWRlIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG4gIGlzQm91bmRUb01vZHVsZTogYm9vbGVhbjtcblxuICBvdmVycmlkZSBnZXQgaW5wdXRzKCk6IHtcbiAgICBwcm9wTmFtZTogc3RyaW5nO1xuICAgIHRlbXBsYXRlTmFtZTogc3RyaW5nO1xuICAgIGlzU2lnbmFsOiBib29sZWFuO1xuICAgIHRyYW5zZm9ybT86ICh2YWx1ZTogYW55KSA9PiBhbnk7XG4gIH1bXSB7XG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gdGhpcy5jb21wb25lbnREZWY7XG4gICAgY29uc3QgaW5wdXRUcmFuc2Zvcm1zID0gY29tcG9uZW50RGVmLmlucHV0VHJhbnNmb3JtcztcbiAgICBjb25zdCByZWZBcnJheSA9IHRvUmVmQXJyYXkoY29tcG9uZW50RGVmLmlucHV0cywgdHJ1ZSk7XG5cbiAgICBpZiAoaW5wdXRUcmFuc2Zvcm1zICE9PSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IGlucHV0IG9mIHJlZkFycmF5KSB7XG4gICAgICAgIGlmIChpbnB1dFRyYW5zZm9ybXMuaGFzT3duUHJvcGVydHkoaW5wdXQucHJvcE5hbWUpKSB7XG4gICAgICAgICAgaW5wdXQudHJhbnNmb3JtID0gaW5wdXRUcmFuc2Zvcm1zW2lucHV0LnByb3BOYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZWZBcnJheTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBvdXRwdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZ31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cywgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBjb21wb25lbnREZWYgVGhlIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIHRoZSBmYWN0b3J5IGlzIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxhbnk+LFxuICAgIHByaXZhdGUgbmdNb2R1bGU/OiBOZ01vZHVsZVJlZjxhbnk+LFxuICApIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudERlZi50eXBlO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBzdHJpbmdpZnlDU1NTZWxlY3Rvckxpc3QoY29tcG9uZW50RGVmLnNlbGVjdG9ycyk7XG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPSBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzXG4gICAgICA/IGNvbXBvbmVudERlZi5uZ0NvbnRlbnRTZWxlY3RvcnNcbiAgICAgIDogW107XG4gICAgdGhpcy5pc0JvdW5kVG9Nb2R1bGUgPSAhIW5nTW9kdWxlO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlKFxuICAgIGluamVjdG9yOiBJbmplY3RvcixcbiAgICBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXSB8IHVuZGVmaW5lZCxcbiAgICByb290U2VsZWN0b3JPck5vZGU/OiBhbnksXG4gICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IE5nTW9kdWxlUmVmPGFueT4gfCBFbnZpcm9ubWVudEluamVjdG9yIHwgdW5kZWZpbmVkLFxuICApOiBBYnN0cmFjdENvbXBvbmVudFJlZjxUPiB7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBjb21wb25lbnQgaXMgb3JwaGFuXG4gICAgICBpZiAoXG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAodHlwZW9mIG5nSml0TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdKaXRNb2RlKSAmJlxuICAgICAgICB0aGlzLmNvbXBvbmVudERlZi5kZWJ1Z0luZm8/LmZvcmJpZE9ycGhhblJlbmRlcmluZ1xuICAgICAgKSB7XG4gICAgICAgIGlmIChkZXBzVHJhY2tlci5pc09ycGhhbkNvbXBvbmVudCh0aGlzLmNvbXBvbmVudFR5cGUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUlVOVElNRV9ERVBTX09SUEhBTl9DT01QT05FTlQsXG4gICAgICAgICAgICBgT3JwaGFuIGNvbXBvbmVudCBmb3VuZCEgVHJ5aW5nIHRvIHJlbmRlciB0aGUgY29tcG9uZW50ICR7ZGVidWdTdHJpbmdpZnlUeXBlRm9yRXJyb3IoXG4gICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50VHlwZSxcbiAgICAgICAgICAgICl9IHdpdGhvdXQgZmlyc3QgbG9hZGluZyB0aGUgTmdNb2R1bGUgdGhhdCBkZWNsYXJlcyBpdC4gSXQgaXMgcmVjb21tZW5kZWQgdG8gbWFrZSB0aGlzIGNvbXBvbmVudCBzdGFuZGFsb25lIGluIG9yZGVyIHRvIGF2b2lkIHRoaXMgZXJyb3IuIElmIHRoaXMgaXMgbm90IHBvc3NpYmxlIG5vdywgaW1wb3J0IHRoZSBjb21wb25lbnQncyBOZ01vZHVsZSBpbiB0aGUgYXBwcm9wcmlhdGUgTmdNb2R1bGUsIG9yIHRoZSBzdGFuZGFsb25lIGNvbXBvbmVudCBpbiB3aGljaCB5b3UgYXJlIHRyeWluZyB0byByZW5kZXIgdGhpcyBjb21wb25lbnQuIElmIHRoaXMgaXMgYSBsYXp5IGltcG9ydCwgbG9hZCB0aGUgTmdNb2R1bGUgbGF6aWx5IGFzIHdlbGwgYW5kIHVzZSBpdHMgbW9kdWxlIGluamVjdG9yLmAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yID0gZW52aXJvbm1lbnRJbmplY3RvciB8fCB0aGlzLm5nTW9kdWxlO1xuXG4gICAgICBsZXQgcmVhbEVudmlyb25tZW50SW5qZWN0b3IgPVxuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yIGluc3RhbmNlb2YgRW52aXJvbm1lbnRJbmplY3RvclxuICAgICAgICAgID8gZW52aXJvbm1lbnRJbmplY3RvclxuICAgICAgICAgIDogZW52aXJvbm1lbnRJbmplY3Rvcj8uaW5qZWN0b3I7XG5cbiAgICAgIGlmIChyZWFsRW52aXJvbm1lbnRJbmplY3RvciAmJiB0aGlzLmNvbXBvbmVudERlZi5nZXRTdGFuZGFsb25lSW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgICAgcmVhbEVudmlyb25tZW50SW5qZWN0b3IgPVxuICAgICAgICAgIHRoaXMuY29tcG9uZW50RGVmLmdldFN0YW5kYWxvbmVJbmplY3RvcihyZWFsRW52aXJvbm1lbnRJbmplY3RvcikgfHxcbiAgICAgICAgICByZWFsRW52aXJvbm1lbnRJbmplY3RvcjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgcm9vdFZpZXdJbmplY3RvciA9IHJlYWxFbnZpcm9ubWVudEluamVjdG9yXG4gICAgICAgID8gbmV3IENoYWluZWRJbmplY3RvcihpbmplY3RvciwgcmVhbEVudmlyb25tZW50SW5qZWN0b3IpXG4gICAgICAgIDogaW5qZWN0b3I7XG5cbiAgICAgIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIG51bGwpO1xuICAgICAgaWYgKHJlbmRlcmVyRmFjdG9yeSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUkVOREVSRVJfTk9UX0ZPVU5ELFxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgJ0FuZ3VsYXIgd2FzIG5vdCBhYmxlIHRvIGluamVjdCBhIHJlbmRlcmVyIChSZW5kZXJlckZhY3RvcnkyKS4gJyArXG4gICAgICAgICAgICAgICdMaWtlbHkgdGhpcyBpcyBkdWUgdG8gYSBicm9rZW4gREkgaGllcmFyY2h5LiAnICtcbiAgICAgICAgICAgICAgJ01ha2Ugc3VyZSB0aGF0IGFueSBpbmplY3RvciB1c2VkIHRvIGNyZWF0ZSB0aGlzIGNvbXBvbmVudCBoYXMgYSBjb3JyZWN0IHBhcmVudC4nLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgY29uc3Qgc2FuaXRpemVyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoU2FuaXRpemVyLCBudWxsKTtcblxuICAgICAgY29uc3QgY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBudWxsKTtcblxuICAgICAgY29uc3QgZW52aXJvbm1lbnQ6IExWaWV3RW52aXJvbm1lbnQgPSB7XG4gICAgICAgIHJlbmRlcmVyRmFjdG9yeSxcbiAgICAgICAgc2FuaXRpemVyLFxuICAgICAgICAvLyBXZSBkb24ndCB1c2UgaW5saW5lIGVmZmVjdHMgKHlldCkuXG4gICAgICAgIGlubGluZUVmZmVjdFJ1bm5lcjogbnVsbCxcbiAgICAgICAgY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgaG9zdFJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIHRoaXMuY29tcG9uZW50RGVmKTtcbiAgICAgIC8vIERldGVybWluZSBhIHRhZyBuYW1lIHVzZWQgZm9yIGNyZWF0aW5nIGhvc3QgZWxlbWVudHMgd2hlbiB0aGlzIGNvbXBvbmVudCBpcyBjcmVhdGVkXG4gICAgICAvLyBkeW5hbWljYWxseS4gRGVmYXVsdCB0byAnZGl2JyBpZiB0aGlzIGNvbXBvbmVudCBkaWQgbm90IHNwZWNpZnkgYW55IHRhZyBuYW1lIGluIGl0c1xuICAgICAgLy8gc2VsZWN0b3IuXG4gICAgICBjb25zdCBlbGVtZW50TmFtZSA9ICh0aGlzLmNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF1bMF0gYXMgc3RyaW5nKSB8fCAnZGl2JztcbiAgICAgIGNvbnN0IGhvc3RSTm9kZSA9IHJvb3RTZWxlY3Rvck9yTm9kZVxuICAgICAgICA/IGxvY2F0ZUhvc3RFbGVtZW50KFxuICAgICAgICAgICAgaG9zdFJlbmRlcmVyLFxuICAgICAgICAgICAgcm9vdFNlbGVjdG9yT3JOb2RlLFxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnREZWYuZW5jYXBzdWxhdGlvbixcbiAgICAgICAgICAgIHJvb3RWaWV3SW5qZWN0b3IsXG4gICAgICAgICAgKVxuICAgICAgICA6IGNyZWF0ZUVsZW1lbnROb2RlKGhvc3RSZW5kZXJlciwgZWxlbWVudE5hbWUsIGdldE5hbWVzcGFjZShlbGVtZW50TmFtZSkpO1xuXG4gICAgICBsZXQgcm9vdEZsYWdzID0gTFZpZXdGbGFncy5Jc1Jvb3Q7XG4gICAgICBpZiAodGhpcy5jb21wb25lbnREZWYuc2lnbmFscykge1xuICAgICAgICByb290RmxhZ3MgfD0gTFZpZXdGbGFncy5TaWduYWxWaWV3O1xuICAgICAgfSBlbHNlIGlmICghdGhpcy5jb21wb25lbnREZWYub25QdXNoKSB7XG4gICAgICAgIHJvb3RGbGFncyB8PSBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzO1xuICAgICAgfVxuXG4gICAgICBsZXQgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcgfCBudWxsID0gbnVsbDtcbiAgICAgIGlmIChob3N0Uk5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgaHlkcmF0aW9uSW5mbyA9IHJldHJpZXZlSHlkcmF0aW9uSW5mbyhob3N0Uk5vZGUsIHJvb3RWaWV3SW5qZWN0b3IsIHRydWUgLyogaXNSb290VmlldyAqLyk7XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSB0aGUgcm9vdCB2aWV3LiBVc2VzIGVtcHR5IFRWaWV3IGFuZCBDb250ZW50VGVtcGxhdGUuXG4gICAgICBjb25zdCByb290VFZpZXcgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgVFZpZXdUeXBlLlJvb3QsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIDEsXG4gICAgICAgIDAsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICApO1xuICAgICAgY29uc3Qgcm9vdExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIG51bGwsXG4gICAgICAgIHJvb3RUVmlldyxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgcm9vdEZsYWdzLFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgaG9zdFJlbmRlcmVyLFxuICAgICAgICByb290Vmlld0luamVjdG9yLFxuICAgICAgICBudWxsLFxuICAgICAgICBoeWRyYXRpb25JbmZvLFxuICAgICAgKTtcblxuICAgICAgLy8gcm9vdFZpZXcgaXMgdGhlIHBhcmVudCB3aGVuIGJvb3RzdHJhcHBpbmdcbiAgICAgIC8vIFRPRE8obWlza28pOiBpdCBsb29rcyBsaWtlIHdlIGFyZSBlbnRlcmluZyB2aWV3IGhlcmUgYnV0IHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGFzXG4gICAgICAvLyBgcmVuZGVyVmlld2AgZG9lcyB0aGF0LiBIb3dldmVyIGFzIHRoZSBjb2RlIGlzIHdyaXR0ZW4gaXQgaXMgbmVlZGVkIGJlY2F1c2VcbiAgICAgIC8vIGBjcmVhdGVSb290Q29tcG9uZW50Vmlld2AgYW5kIGBjcmVhdGVSb290Q29tcG9uZW50YCBib3RoIHJlYWQgZ2xvYmFsIHN0YXRlLiBGaXhpbmcgdGhvc2VcbiAgICAgIC8vIGlzc3VlcyB3b3VsZCBhbGxvdyB1cyB0byBkcm9wIHRoaXMuXG4gICAgICBlbnRlclZpZXcocm9vdExWaWV3KTtcblxuICAgICAgbGV0IGNvbXBvbmVudDogVDtcbiAgICAgIGxldCB0RWxlbWVudE5vZGU6IFRFbGVtZW50Tm9kZTtcbiAgICAgIGxldCBjb21wb25lbnRWaWV3OiBMVmlldyB8IG51bGwgPSBudWxsO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByb290Q29tcG9uZW50RGVmID0gdGhpcy5jb21wb25lbnREZWY7XG4gICAgICAgIGxldCByb290RGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPHVua25vd24+W107XG4gICAgICAgIGxldCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnMgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBpZiAocm9vdENvbXBvbmVudERlZi5maW5kSG9zdERpcmVjdGl2ZURlZnMpIHtcbiAgICAgICAgICByb290RGlyZWN0aXZlcyA9IFtdO1xuICAgICAgICAgIGhvc3REaXJlY3RpdmVEZWZzID0gbmV3IE1hcCgpO1xuICAgICAgICAgIHJvb3RDb21wb25lbnREZWYuZmluZEhvc3REaXJlY3RpdmVEZWZzKFxuICAgICAgICAgICAgcm9vdENvbXBvbmVudERlZixcbiAgICAgICAgICAgIHJvb3REaXJlY3RpdmVzLFxuICAgICAgICAgICAgaG9zdERpcmVjdGl2ZURlZnMsXG4gICAgICAgICAgKTtcbiAgICAgICAgICByb290RGlyZWN0aXZlcy5wdXNoKHJvb3RDb21wb25lbnREZWYpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb0R1cGxpY2F0ZURpcmVjdGl2ZXMocm9vdERpcmVjdGl2ZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJvb3REaXJlY3RpdmVzID0gW3Jvb3RDb21wb25lbnREZWZdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaG9zdFROb2RlID0gY3JlYXRlUm9vdENvbXBvbmVudFROb2RlKHJvb3RMVmlldywgaG9zdFJOb2RlKTtcbiAgICAgICAgY29tcG9uZW50VmlldyA9IGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgICAgICAgIGhvc3RUTm9kZSxcbiAgICAgICAgICBob3N0Uk5vZGUsXG4gICAgICAgICAgcm9vdENvbXBvbmVudERlZixcbiAgICAgICAgICByb290RGlyZWN0aXZlcyxcbiAgICAgICAgICByb290TFZpZXcsXG4gICAgICAgICAgZW52aXJvbm1lbnQsXG4gICAgICAgICAgaG9zdFJlbmRlcmVyLFxuICAgICAgICApO1xuXG4gICAgICAgIHRFbGVtZW50Tm9kZSA9IGdldFROb2RlKHJvb3RUVmlldywgSEVBREVSX09GRlNFVCkgYXMgVEVsZW1lbnROb2RlO1xuXG4gICAgICAgIC8vIFRPRE8oY3Jpc2JldG8pOiBpbiBwcmFjdGljZSBgaG9zdFJOb2RlYCBzaG91bGQgYWx3YXlzIGJlIGRlZmluZWQsIGJ1dCB0aGVyZSBhcmUgc29tZVxuICAgICAgICAvLyB0ZXN0cyB3aGVyZSB0aGUgcmVuZGVyZXIgaXMgbW9ja2VkIG91dCBhbmQgYHVuZGVmaW5lZGAgaXMgcmV0dXJuZWQuIFdlIHNob3VsZCB1cGRhdGUgdGhlXG4gICAgICAgIC8vIHRlc3RzIHNvIHRoYXQgdGhpcyBjaGVjayBjYW4gYmUgcmVtb3ZlZC5cbiAgICAgICAgaWYgKGhvc3RSTm9kZSkge1xuICAgICAgICAgIHNldFJvb3ROb2RlQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIHJvb3RDb21wb25lbnREZWYsIGhvc3RSTm9kZSwgcm9vdFNlbGVjdG9yT3JOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9qZWN0YWJsZU5vZGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBwcm9qZWN0Tm9kZXModEVsZW1lbnROb2RlLCB0aGlzLm5nQ29udGVudFNlbGVjdG9ycywgcHJvamVjdGFibGVOb2Rlcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiBzaG91bGQgTGlmZWN5Y2xlSG9va3NGZWF0dXJlIGFuZCBvdGhlciBob3N0IGZlYXR1cmVzIGJlIGdlbmVyYXRlZCBieSB0aGUgY29tcGlsZXJcbiAgICAgICAgLy8gYW5kIGV4ZWN1dGVkIGhlcmU/IEFuZ3VsYXIgNSByZWZlcmVuY2U6IGh0dHBzOi8vc3RhY2tibGl0ei5jb20vZWRpdC9saWZlY3ljbGUtaG9va3MtdmNyZWZcbiAgICAgICAgY29tcG9uZW50ID0gY3JlYXRlUm9vdENvbXBvbmVudChcbiAgICAgICAgICBjb21wb25lbnRWaWV3LFxuICAgICAgICAgIHJvb3RDb21wb25lbnREZWYsXG4gICAgICAgICAgcm9vdERpcmVjdGl2ZXMsXG4gICAgICAgICAgaG9zdERpcmVjdGl2ZURlZnMsXG4gICAgICAgICAgcm9vdExWaWV3LFxuICAgICAgICAgIFtMaWZlY3ljbGVIb29rc0ZlYXR1cmVdLFxuICAgICAgICApO1xuICAgICAgICByZW5kZXJWaWV3KHJvb3RUVmlldywgcm9vdExWaWV3LCBudWxsKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gU3RvcCB0cmFja2luZyB0aGUgdmlld3MgaWYgY3JlYXRpb24gZmFpbGVkIHNpbmNlXG4gICAgICAgIC8vIHRoZSBjb25zdW1lciB3b24ndCBoYXZlIGEgd2F5IHRvIGRlcmVmZXJlbmNlIHRoZW0uXG4gICAgICAgIGlmIChjb21wb25lbnRWaWV3ICE9PSBudWxsKSB7XG4gICAgICAgICAgdW5yZWdpc3RlckxWaWV3KGNvbXBvbmVudFZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIHVucmVnaXN0ZXJMVmlldyhyb290TFZpZXcpO1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgbGVhdmVWaWV3KCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50UmVmKFxuICAgICAgICB0aGlzLmNvbXBvbmVudFR5cGUsXG4gICAgICAgIGNvbXBvbmVudCxcbiAgICAgICAgY3JlYXRlRWxlbWVudFJlZih0RWxlbWVudE5vZGUsIHJvb3RMVmlldyksXG4gICAgICAgIHJvb3RMVmlldyxcbiAgICAgICAgdEVsZW1lbnROb2RlLFxuICAgICAgKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRSZWY8VD4ge1xuICBvdmVycmlkZSBpbnN0YW5jZTogVDtcbiAgb3ZlcnJpZGUgaG9zdFZpZXc6IFZpZXdSZWY8VD47XG4gIG92ZXJyaWRlIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcbiAgb3ZlcnJpZGUgY29tcG9uZW50VHlwZTogVHlwZTxUPjtcbiAgcHJpdmF0ZSBwcmV2aW91c0lucHV0VmFsdWVzOiBNYXA8c3RyaW5nLCB1bmtub3duPiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbXBvbmVudFR5cGU6IFR5cGU8VD4sXG4gICAgaW5zdGFuY2U6IFQsXG4gICAgcHVibGljIGxvY2F0aW9uOiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgX3Jvb3RMVmlldzogTFZpZXcsXG4gICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICApIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBWaWV3UmVmPFQ+KFxuICAgICAgX3Jvb3RMVmlldyxcbiAgICAgIHVuZGVmaW5lZCAvKiBfY2RSZWZJbmplY3RpbmdWaWV3ICovLFxuICAgICAgZmFsc2UgLyogbm90aWZ5RXJyb3JIYW5kbGVyICovLFxuICAgICk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldElucHV0KG5hbWU6IHN0cmluZywgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgICBjb25zdCBpbnB1dERhdGEgPSB0aGlzLl90Tm9kZS5pbnB1dHM7XG4gICAgbGV0IGRhdGFWYWx1ZTogTm9kZUlucHV0QmluZGluZ3NbdHlwZW9mIG5hbWVdIHwgdW5kZWZpbmVkO1xuICAgIGlmIChpbnB1dERhdGEgIT09IG51bGwgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtuYW1lXSkpIHtcbiAgICAgIHRoaXMucHJldmlvdXNJbnB1dFZhbHVlcyA/Pz0gbmV3IE1hcCgpO1xuICAgICAgLy8gRG8gbm90IHNldCB0aGUgaW5wdXQgaWYgaXQgaXMgdGhlIHNhbWUgYXMgdGhlIGxhc3QgdmFsdWVcbiAgICAgIC8vIFRoaXMgYmVoYXZpb3IgbWF0Y2hlcyBgYmluZGluZ1VwZGF0ZWRgIHdoZW4gYmluZGluZyBpbnB1dHMgaW4gdGVtcGxhdGVzLlxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLnByZXZpb3VzSW5wdXRWYWx1ZXMuaGFzKG5hbWUpICYmXG4gICAgICAgIE9iamVjdC5pcyh0aGlzLnByZXZpb3VzSW5wdXRWYWx1ZXMuZ2V0KG5hbWUpLCB2YWx1ZSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fcm9vdExWaWV3O1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXdbVFZJRVddLCBsVmlldywgZGF0YVZhbHVlLCBuYW1lLCB2YWx1ZSk7XG4gICAgICB0aGlzLnByZXZpb3VzSW5wdXRWYWx1ZXMuc2V0KG5hbWUsIHZhbHVlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodGhpcy5fdE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIG1hcmtWaWV3RGlydHkoY2hpbGRDb21wb25lbnRMVmlldywgTm90aWZpY2F0aW9uU291cmNlLlNldElucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBjbXBOYW1lRm9yRXJyb3IgPSBzdHJpbmdpZnlGb3JFcnJvcih0aGlzLmNvbXBvbmVudFR5cGUpO1xuICAgICAgICBsZXQgbWVzc2FnZSA9IGBDYW4ndCBzZXQgdmFsdWUgb2YgdGhlICcke25hbWV9JyBpbnB1dCBvbiB0aGUgJyR7Y21wTmFtZUZvckVycm9yfScgY29tcG9uZW50LiBgO1xuICAgICAgICBtZXNzYWdlICs9IGBNYWtlIHN1cmUgdGhhdCB0aGUgJyR7bmFtZX0nIHByb3BlcnR5IGlzIGFubm90YXRlZCB3aXRoIEBJbnB1dCgpIG9yIGEgbWFwcGVkIEBJbnB1dCgnJHtuYW1lfScpIGV4aXN0cy5gO1xuICAgICAgICByZXBvcnRVbmtub3duUHJvcGVydHlFcnJvcihtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX3ROb2RlLCB0aGlzLl9yb290TFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmhvc3RWaWV3LmRlc3Ryb3koKTtcbiAgfVxuXG4gIG92ZXJyaWRlIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdFZpZXcub25EZXN0cm95KGNhbGxiYWNrKTtcbiAgfVxufVxuXG4vKiogUmVwcmVzZW50cyBhIEhvc3RGZWF0dXJlIGZ1bmN0aW9uLiAqL1xudHlwZSBIb3N0RmVhdHVyZSA9IDxUPihjb21wb25lbnQ6IFQsIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+KSA9PiB2b2lkO1xuXG4vKiogQ3JlYXRlcyBhIFROb2RlIHRoYXQgY2FuIGJlIHVzZWQgdG8gaW5zdGFudGlhdGUgYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRUTm9kZShsVmlldzogTFZpZXcsIHJOb2RlOiBSTm9kZSk6IFRFbGVtZW50Tm9kZSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBpbmRleCA9IEhFQURFUl9PRkZTRVQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgbFZpZXdbaW5kZXhdID0gck5vZGU7XG5cbiAgLy8gJyNob3N0JyBpcyBhZGRlZCBoZXJlIGFzIHdlIGRvbid0IGtub3cgdGhlIHJlYWwgaG9zdCBET00gbmFtZSAod2UgZG9uJ3Qgd2FudCB0byByZWFkIGl0KSBhbmQgYXRcbiAgLy8gdGhlIHNhbWUgdGltZSB3ZSB3YW50IHRvIGNvbW11bmljYXRlIHRoZSBkZWJ1ZyBgVE5vZGVgIHRoYXQgdGhpcyBpcyBhIHNwZWNpYWwgYFROb2RlYFxuICAvLyByZXByZXNlbnRpbmcgYSBob3N0IGVsZW1lbnQuXG4gIHJldHVybiBnZXRPckNyZWF0ZVROb2RlKHRWaWV3LCBpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsICcjaG9zdCcsIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIHJvb3QgY29tcG9uZW50IHZpZXcgYW5kIHRoZSByb290IGNvbXBvbmVudCBub2RlLlxuICpcbiAqIEBwYXJhbSBob3N0Uk5vZGUgUmVuZGVyIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSByb290Q29tcG9uZW50RGVmIENvbXBvbmVudERlZlxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSBwYXJlbnQgdmlldyB3aGVyZSB0aGUgaG9zdCBub2RlIGlzIHN0b3JlZFxuICogQHBhcmFtIHJlbmRlcmVyRmFjdG9yeSBGYWN0b3J5IHRvIGJlIHVzZWQgZm9yIGNyZWF0aW5nIGNoaWxkIHJlbmRlcmVycy5cbiAqIEBwYXJhbSBob3N0UmVuZGVyZXIgVGhlIGN1cnJlbnQgcmVuZGVyZXJcbiAqIEBwYXJhbSBzYW5pdGl6ZXIgVGhlIHNhbml0aXplciwgaWYgcHJvdmlkZWRcbiAqXG4gKiBAcmV0dXJucyBDb21wb25lbnQgdmlldyBjcmVhdGVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICB0Tm9kZTogVEVsZW1lbnROb2RlLFxuICBob3N0Uk5vZGU6IFJFbGVtZW50IHwgbnVsbCxcbiAgcm9vdENvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4sXG4gIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLFxuICByb290VmlldzogTFZpZXcsXG4gIGVudmlyb25tZW50OiBMVmlld0Vudmlyb25tZW50LFxuICBob3N0UmVuZGVyZXI6IFJlbmRlcmVyLFxuKTogTFZpZXcge1xuICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgYXBwbHlSb290Q29tcG9uZW50U3R5bGluZyhyb290RGlyZWN0aXZlcywgdE5vZGUsIGhvc3RSTm9kZSwgaG9zdFJlbmRlcmVyKTtcblxuICAvLyBIeWRyYXRpb24gaW5mbyBpcyBvbiB0aGUgaG9zdCBlbGVtZW50IGFuZCBuZWVkcyB0byBiZSByZXRyaWV2ZWRcbiAgLy8gYW5kIHBhc3NlZCB0byB0aGUgY29tcG9uZW50IExWaWV3LlxuICBsZXQgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcgfCBudWxsID0gbnVsbDtcbiAgaWYgKGhvc3RSTm9kZSAhPT0gbnVsbCkge1xuICAgIGh5ZHJhdGlvbkluZm8gPSByZXRyaWV2ZUh5ZHJhdGlvbkluZm8oaG9zdFJOb2RlLCByb290Vmlld1tJTkpFQ1RPUl0hKTtcbiAgfVxuICBjb25zdCB2aWV3UmVuZGVyZXIgPSBlbnZpcm9ubWVudC5yZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdFJOb2RlLCByb290Q29tcG9uZW50RGVmKTtcbiAgbGV0IGxWaWV3RmxhZ3MgPSBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzO1xuICBpZiAocm9vdENvbXBvbmVudERlZi5zaWduYWxzKSB7XG4gICAgbFZpZXdGbGFncyA9IExWaWV3RmxhZ3MuU2lnbmFsVmlldztcbiAgfSBlbHNlIGlmIChyb290Q29tcG9uZW50RGVmLm9uUHVzaCkge1xuICAgIGxWaWV3RmxhZ3MgPSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICByb290VmlldyxcbiAgICBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3KHJvb3RDb21wb25lbnREZWYpLFxuICAgIG51bGwsXG4gICAgbFZpZXdGbGFncyxcbiAgICByb290Vmlld1t0Tm9kZS5pbmRleF0sXG4gICAgdE5vZGUsXG4gICAgZW52aXJvbm1lbnQsXG4gICAgdmlld1JlbmRlcmVyLFxuICAgIG51bGwsXG4gICAgbnVsbCxcbiAgICBoeWRyYXRpb25JbmZvLFxuICApO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3LCB0Tm9kZSwgcm9vdERpcmVjdGl2ZXMubGVuZ3RoIC0gMSk7XG4gIH1cblxuICBhZGRUb1ZpZXdUcmVlKHJvb3RWaWV3LCBjb21wb25lbnRWaWV3KTtcblxuICAvLyBTdG9yZSBjb21wb25lbnQgdmlldyBhdCBub2RlIGluZGV4LCB3aXRoIG5vZGUgYXMgdGhlIEhPU1RcbiAgcmV0dXJuIChyb290Vmlld1t0Tm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3KTtcbn1cblxuLyoqIFNldHMgdXAgdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24gb24gYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIGFwcGx5Um9vdENvbXBvbmVudFN0eWxpbmcoXG4gIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLFxuICB0Tm9kZTogVEVsZW1lbnROb2RlLFxuICByTm9kZTogUkVsZW1lbnQgfCBudWxsLFxuICBob3N0UmVuZGVyZXI6IFJlbmRlcmVyLFxuKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZGVmIG9mIHJvb3REaXJlY3RpdmVzKSB7XG4gICAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgZGVmLmhvc3RBdHRycyk7XG4gIH1cblxuICBpZiAodE5vZGUubWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBjb21wdXRlU3RhdGljU3R5bGluZyh0Tm9kZSwgdE5vZGUubWVyZ2VkQXR0cnMsIHRydWUpO1xuXG4gICAgaWYgKHJOb2RlICE9PSBudWxsKSB7XG4gICAgICBzZXR1cFN0YXRpY0F0dHJpYnV0ZXMoaG9zdFJlbmRlcmVyLCByTm9kZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSByb290IGNvbXBvbmVudCBhbmQgc2V0cyBpdCB1cCB3aXRoIGZlYXR1cmVzIGFuZCBob3N0IGJpbmRpbmdzLlNoYXJlZCBieVxuICogcmVuZGVyQ29tcG9uZW50KCkgYW5kIFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KCkuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gIGNvbXBvbmVudFZpZXc6IExWaWV3LFxuICByb290Q29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4sXG4gIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLFxuICBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnMgfCBudWxsLFxuICByb290TFZpZXc6IExWaWV3LFxuICBob3N0RmVhdHVyZXM6IEhvc3RGZWF0dXJlW10gfCBudWxsLFxuKTogYW55IHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChyb290VE5vZGUsICd0Tm9kZSBzaG91bGQgaGF2ZSBiZWVuIGFscmVhZHkgY3JlYXRlZCcpO1xuICBjb25zdCB0VmlldyA9IHJvb3RMVmlld1tUVklFV107XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocm9vdFROb2RlLCByb290TFZpZXcpO1xuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzKHRWaWV3LCByb290TFZpZXcsIHJvb3RUTm9kZSwgcm9vdERpcmVjdGl2ZXMsIG51bGwsIGhvc3REaXJlY3RpdmVEZWZzKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3REaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSByb290VE5vZGUuZGlyZWN0aXZlU3RhcnQgKyBpO1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluc3RhbmNlID0gZ2V0Tm9kZUluamVjdGFibGUocm9vdExWaWV3LCB0VmlldywgZGlyZWN0aXZlSW5kZXgsIHJvb3RUTm9kZSk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZUluc3RhbmNlLCByb290TFZpZXcpO1xuICB9XG5cbiAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0Vmlldywgcm9vdExWaWV3LCByb290VE5vZGUpO1xuXG4gIGlmIChuYXRpdmUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCByb290TFZpZXcpO1xuICB9XG5cbiAgLy8gV2UncmUgZ3VhcmFudGVlZCBmb3IgdGhlIGBjb21wb25lbnRPZmZzZXRgIHRvIGJlIHBvc2l0aXZlIGhlcmVcbiAgLy8gc2luY2UgYSByb290IGNvbXBvbmVudCBhbHdheXMgbWF0Y2hlcyBhIGNvbXBvbmVudCBkZWYuXG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydEdyZWF0ZXJUaGFuKHJvb3RUTm9kZS5jb21wb25lbnRPZmZzZXQsIC0xLCAnY29tcG9uZW50T2Zmc2V0IG11c3QgYmUgZ3JlYXQgdGhhbiAtMScpO1xuICBjb25zdCBjb21wb25lbnQgPSBnZXROb2RlSW5qZWN0YWJsZShcbiAgICByb290TFZpZXcsXG4gICAgdFZpZXcsXG4gICAgcm9vdFROb2RlLmRpcmVjdGl2ZVN0YXJ0ICsgcm9vdFROb2RlLmNvbXBvbmVudE9mZnNldCxcbiAgICByb290VE5vZGUsXG4gICk7XG4gIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSByb290TFZpZXdbQ09OVEVYVF0gPSBjb21wb25lbnQ7XG5cbiAgaWYgKGhvc3RGZWF0dXJlcyAhPT0gbnVsbCkge1xuICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBob3N0RmVhdHVyZXMpIHtcbiAgICAgIGZlYXR1cmUoY29tcG9uZW50LCByb290Q29tcG9uZW50RGVmKTtcbiAgICB9XG4gIH1cblxuICAvLyBXZSB3YW50IHRvIGdlbmVyYXRlIGFuIGVtcHR5IFF1ZXJ5TGlzdCBmb3Igcm9vdCBjb250ZW50IHF1ZXJpZXMgZm9yIGJhY2t3YXJkc1xuICAvLyBjb21wYXRpYmlsaXR5IHdpdGggVmlld0VuZ2luZS5cbiAgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3LCByb290VE5vZGUsIHJvb3RMVmlldyk7XG5cbiAgcmV0dXJuIGNvbXBvbmVudDtcbn1cblxuLyoqIFNldHMgdGhlIHN0YXRpYyBhdHRyaWJ1dGVzIG9uIGEgcm9vdCBjb21wb25lbnQuICovXG5mdW5jdGlvbiBzZXRSb290Tm9kZUF0dHJpYnV0ZXMoXG4gIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIyLFxuICBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjx1bmtub3duPixcbiAgaG9zdFJOb2RlOiBSRWxlbWVudCxcbiAgcm9vdFNlbGVjdG9yT3JOb2RlOiBhbnksXG4pIHtcbiAgaWYgKHJvb3RTZWxlY3Rvck9yTm9kZSkge1xuICAgIC8vIFRoZSBwbGFjZWhvbGRlciB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlIGFjdHVhbCB2ZXJzaW9uIGF0IGJ1aWxkIHRpbWUuXG4gICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgaG9zdFJOb2RlLCBbJ25nLXZlcnNpb24nLCAnMC4wLjAtUExBQ0VIT0xERVInXSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWYgaG9zdCBlbGVtZW50IGlzIGNyZWF0ZWQgYXMgYSBwYXJ0IG9mIHRoaXMgZnVuY3Rpb24gY2FsbCAoaS5lLiBgcm9vdFNlbGVjdG9yT3JOb2RlYFxuICAgIC8vIGlzIG5vdCBkZWZpbmVkKSwgYWxzbyBhcHBseSBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGV4dHJhY3RlZCBmcm9tIGNvbXBvbmVudCBzZWxlY3Rvci5cbiAgICAvLyBFeHRyYWN0IGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgZnJvbSB0aGUgZmlyc3Qgc2VsZWN0b3Igb25seSB0byBtYXRjaCBWRSBiZWhhdmlvci5cbiAgICBjb25zdCB7YXR0cnMsIGNsYXNzZXN9ID0gZXh0cmFjdEF0dHJzQW5kQ2xhc3Nlc0Zyb21TZWxlY3Rvcihjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdKTtcbiAgICBpZiAoYXR0cnMpIHtcbiAgICAgIHNldFVwQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgYXR0cnMpO1xuICAgIH1cbiAgICBpZiAoY2xhc3NlcyAmJiBjbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIHdyaXRlRGlyZWN0Q2xhc3MoaG9zdFJlbmRlcmVyLCBob3N0Uk5vZGUsIGNsYXNzZXMuam9pbignICcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFByb2plY3RzIHRoZSBgcHJvamVjdGFibGVOb2Rlc2AgdGhhdCB3ZXJlIHNwZWNpZmllZCB3aGVuIGNyZWF0aW5nIGEgcm9vdCBjb21wb25lbnQuICovXG5mdW5jdGlvbiBwcm9qZWN0Tm9kZXMoXG4gIHROb2RlOiBURWxlbWVudE5vZGUsXG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW10sXG4gIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW10sXG4pIHtcbiAgY29uc3QgcHJvamVjdGlvbjogKFROb2RlIHwgUk5vZGVbXSB8IG51bGwpW10gPSAodE5vZGUucHJvamVjdGlvbiA9IFtdKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZ0NvbnRlbnRTZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2Rlc2ZvclNsb3QgPSBwcm9qZWN0YWJsZU5vZGVzW2ldO1xuICAgIC8vIFByb2plY3RhYmxlIG5vZGVzIGNhbiBiZSBwYXNzZWQgYXMgYXJyYXkgb2YgYXJyYXlzIG9yIGFuIGFycmF5IG9mIGl0ZXJhYmxlcyAobmdVcGdyYWRlXG4gICAgLy8gY2FzZSkuIEhlcmUgd2UgZG8gbm9ybWFsaXplIHBhc3NlZCBkYXRhIHN0cnVjdHVyZSB0byBiZSBhbiBhcnJheSBvZiBhcnJheXMgdG8gYXZvaWRcbiAgICAvLyBjb21wbGV4IGNoZWNrcyBkb3duIHRoZSBsaW5lLlxuICAgIC8vIFdlIGFsc28gbm9ybWFsaXplIHRoZSBsZW5ndGggb2YgdGhlIHBhc3NlZCBpbiBwcm9qZWN0YWJsZSBub2RlcyAodG8gbWF0Y2ggdGhlIG51bWJlciBvZlxuICAgIC8vIDxuZy1jb250YWluZXI+IHNsb3RzIGRlZmluZWQgYnkgYSBjb21wb25lbnQpLlxuICAgIHByb2plY3Rpb24ucHVzaChub2Rlc2ZvclNsb3QgIT0gbnVsbCA/IEFycmF5LmZyb20obm9kZXNmb3JTbG90KSA6IG51bGwpO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBlbmFibGUgbGlmZWN5Y2xlIGhvb2tzIG9uIHRoZSByb290IGNvbXBvbmVudC5cbiAqXG4gKiBJbmNsdWRlIHRoaXMgZmVhdHVyZSB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgaWYgdGhlIHJvb3QgY29tcG9uZW50XG4gKiB5b3UgYXJlIHJlbmRlcmluZyBoYXMgbGlmZWN5Y2xlIGhvb2tzIGRlZmluZWQuIE90aGVyd2lzZSwgdGhlIGhvb2tzIHdvbid0XG4gKiBiZSBjYWxsZWQgcHJvcGVybHkuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIHJlbmRlckNvbXBvbmVudChBcHBDb21wb25lbnQsIHtob3N0RmVhdHVyZXM6IFtMaWZlY3ljbGVIb29rc0ZlYXR1cmVdfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIExpZmVjeWNsZUhvb2tzRmVhdHVyZSgpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnVE5vZGUgaXMgcmVxdWlyZWQnKTtcbiAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyhnZXRMVmlldygpW1RWSUVXXSwgdE5vZGUpO1xufVxuIl19