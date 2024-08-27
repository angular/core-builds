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
        setUpAttributes(hostRenderer, hostRNode, ['ng-version', '19.0.0-next.1+sha-76b9e2b']);
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
        projection.push(nodesforSlot != null && nodesforSlot.length ? Array.from(nodesforSlot) : null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUduRSxPQUFPLEVBQ0wsd0JBQXdCLEdBRXpCLE1BQU0sb0RBQW9ELENBQUM7QUFFNUQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEQsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFFekQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekQsT0FBTyxFQUNMLGdCQUFnQixJQUFJLHdCQUF3QixFQUM1QyxZQUFZLElBQUksb0JBQW9CLEdBQ3JDLE1BQU0sNkJBQTZCLENBQUM7QUFDckMsT0FBTyxFQUFDLHdCQUF3QixJQUFJLGdDQUFnQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLGdCQUFnQixFQUFhLE1BQU0sdUJBQXVCLENBQUM7QUFFbkUsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHcEYsT0FBTyxFQUFDLG1CQUFtQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzFFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw2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QUNqRyxDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxxQkFBcUI7SUFDbkMsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUN2RCxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7c2V0QWN0aXZlQ29uc3VtZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgTm90aWZpY2F0aW9uU291cmNlLFxufSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcvem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vaHlkcmF0aW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtyZXRyaWV2ZUh5ZHJhdGlvbkluZm99IGZyb20gJy4uL2h5ZHJhdGlvbi91dGlscyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7XG4gIENvbXBvbmVudEZhY3RvcnkgYXMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5LFxuICBDb21wb25lbnRSZWYgYXMgQWJzdHJhY3RDb21wb25lbnRSZWYsXG59IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyBBYnN0cmFjdENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRJbmRleEluUmFuZ2V9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtBZnRlclJlbmRlck1hbmFnZXJ9IGZyb20gJy4vYWZ0ZXJfcmVuZGVyL21hbmFnZXInO1xuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlLCBhc3NlcnROb0R1cGxpY2F0ZURpcmVjdGl2ZXN9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtkZXBzVHJhY2tlcn0gZnJvbSAnLi9kZXBzX3RyYWNrZXIvZGVwc190cmFja2VyJztcbmltcG9ydCB7Z2V0Tm9kZUluamVjdGFibGUsIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtyZXBvcnRVbmtub3duUHJvcGVydHlFcnJvcn0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uJztcbmltcG9ydCB7bWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvbWFya192aWV3X2RpcnR5JztcbmltcG9ydCB7cmVuZGVyVmlld30gZnJvbSAnLi9pbnN0cnVjdGlvbnMvcmVuZGVyJztcbmltcG9ydCB7XG4gIGFkZFRvVmlld1RyZWUsXG4gIGNyZWF0ZUxWaWV3LFxuICBjcmVhdGVUVmlldyxcbiAgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzLFxuICBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3LFxuICBnZXRPckNyZWF0ZVROb2RlLFxuICBpbml0aWFsaXplRGlyZWN0aXZlcyxcbiAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyxcbiAgbG9jYXRlSG9zdEVsZW1lbnQsXG4gIG1hcmtBc0NvbXBvbmVudEhvc3QsXG4gIHNldElucHV0c0ZvclByb3BlcnR5LFxufSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIERpcmVjdGl2ZURlZiwgSG9zdERpcmVjdGl2ZURlZnN9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SW5wdXRGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2lucHV0X2ZsYWdzJztcbmltcG9ydCB7XG4gIE5vZGVJbnB1dEJpbmRpbmdzLFxuICBUQ29udGFpbmVyTm9kZSxcbiAgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICBURWxlbWVudE5vZGUsXG4gIFROb2RlLFxuICBUTm9kZVR5cGUsXG59IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1JFbGVtZW50LCBSTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge1xuICBDT05URVhULFxuICBIRUFERVJfT0ZGU0VULFxuICBJTkpFQ1RPUixcbiAgTFZpZXcsXG4gIExWaWV3RW52aXJvbm1lbnQsXG4gIExWaWV3RmxhZ3MsXG4gIFRWSUVXLFxuICBUVmlld1R5cGUsXG59IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7TUFUSF9NTF9OQU1FU1BBQ0UsIFNWR19OQU1FU1BBQ0V9IGZyb20gJy4vbmFtZXNwYWNlcyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnROb2RlLCBzZXR1cFN0YXRpY0F0dHJpYnV0ZXMsIHdyaXRlRGlyZWN0Q2xhc3N9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtcbiAgZXh0cmFjdEF0dHJzQW5kQ2xhc3Nlc0Zyb21TZWxlY3RvcixcbiAgc3RyaW5naWZ5Q1NTU2VsZWN0b3JMaXN0LFxufSBmcm9tICcuL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge2VudGVyVmlldywgZ2V0Q3VycmVudFROb2RlLCBnZXRMVmlldywgbGVhdmVWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Y29tcHV0ZVN0YXRpY1N0eWxpbmd9IGZyb20gJy4vc3R5bGluZy9zdGF0aWNfc3R5bGluZyc7XG5pbXBvcnQge21lcmdlSG9zdEF0dHJzLCBzZXRVcEF0dHJpYnV0ZXN9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge2RlYnVnU3RyaW5naWZ5VHlwZUZvckVycm9yLCBzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5pbXBvcnQge0NoYWluZWRJbmplY3Rvcn0gZnJvbSAnLi9jaGFpbmVkX2luamVjdG9yJztcbmltcG9ydCB7dW5yZWdpc3RlckxWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvbHZpZXdfdHJhY2tpbmcnO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICAvKipcbiAgICogQHBhcmFtIG5nTW9kdWxlIFRoZSBOZ01vZHVsZVJlZiB0byB3aGljaCBhbGwgcmVzb2x2ZWQgZmFjdG9yaWVzIGFyZSBib3VuZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbmdNb2R1bGU/OiBOZ01vZHVsZVJlZjxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHJlc29sdmVDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeTxUPiB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50KTtcbiAgICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29tcG9uZW50KSE7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy5uZ01vZHVsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheTxUPihcbiAgbWFwOiBEaXJlY3RpdmVEZWY8VD5bJ2lucHV0cyddLFxuICBpc0lucHV0TWFwOiB0cnVlLFxuKTogQ29tcG9uZW50RmFjdG9yeTxUPlsnaW5wdXRzJ107XG5mdW5jdGlvbiB0b1JlZkFycmF5PFQ+KFxuICBtYXA6IERpcmVjdGl2ZURlZjxUPlsnb3V0cHV0cyddLFxuICBpc0lucHV0OiBmYWxzZSxcbik6IENvbXBvbmVudEZhY3Rvcnk8VD5bJ291dHB1dHMnXTtcblxuZnVuY3Rpb24gdG9SZWZBcnJheTxcbiAgVCxcbiAgSXNJbnB1dE1hcCBleHRlbmRzIGJvb2xlYW4sXG4gIFJldHVybiBleHRlbmRzIElzSW5wdXRNYXAgZXh0ZW5kcyB0cnVlXG4gICAgPyBDb21wb25lbnRGYWN0b3J5PFQ+WydpbnB1dHMnXVxuICAgIDogQ29tcG9uZW50RmFjdG9yeTxUPlsnb3V0cHV0cyddLFxuPihtYXA6IERpcmVjdGl2ZURlZjxUPlsnaW5wdXRzJ10gfCBEaXJlY3RpdmVEZWY8VD5bJ291dHB1dHMnXSwgaXNJbnB1dE1hcDogSXNJbnB1dE1hcCk6IFJldHVybiB7XG4gIGNvbnN0IGFycmF5OiBSZXR1cm4gPSBbXSBhcyB1bmtub3duIGFzIFJldHVybjtcbiAgZm9yIChjb25zdCBwdWJsaWNOYW1lIGluIG1hcCkge1xuICAgIGlmICghbWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IG1hcFtwdWJsaWNOYW1lXTtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkodmFsdWUpO1xuICAgIGNvbnN0IHByb3BOYW1lOiBzdHJpbmcgPSBpc0FycmF5ID8gdmFsdWVbMF0gOiB2YWx1ZTtcbiAgICBjb25zdCBmbGFnczogSW5wdXRGbGFncyA9IGlzQXJyYXkgPyB2YWx1ZVsxXSA6IElucHV0RmxhZ3MuTm9uZTtcblxuICAgIGlmIChpc0lucHV0TWFwKSB7XG4gICAgICAoYXJyYXkgYXMgQ29tcG9uZW50RmFjdG9yeTxUPlsnaW5wdXRzJ10pLnB1c2goe1xuICAgICAgICBwcm9wTmFtZTogcHJvcE5hbWUsXG4gICAgICAgIHRlbXBsYXRlTmFtZTogcHVibGljTmFtZSxcbiAgICAgICAgaXNTaWduYWw6IChmbGFncyAmIElucHV0RmxhZ3MuU2lnbmFsQmFzZWQpICE9PSAwLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIChhcnJheSBhcyBDb21wb25lbnRGYWN0b3J5PFQ+WydvdXRwdXRzJ10pLnB1c2goe1xuICAgICAgICBwcm9wTmFtZTogcHJvcE5hbWUsXG4gICAgICAgIHRlbXBsYXRlTmFtZTogcHVibGljTmFtZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGdldE5hbWVzcGFjZShlbGVtZW50TmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IG5hbWUgPSBlbGVtZW50TmFtZS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gbmFtZSA9PT0gJ3N2ZycgPyBTVkdfTkFNRVNQQUNFIDogbmFtZSA9PT0gJ21hdGgnID8gTUFUSF9NTF9OQU1FU1BBQ0UgOiBudWxsO1xufVxuXG4vKipcbiAqIENvbXBvbmVudEZhY3RvcnkgaW50ZXJmYWNlIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeTxUPiBleHRlbmRzIEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeTxUPiB7XG4gIG92ZXJyaWRlIHNlbGVjdG9yOiBzdHJpbmc7XG4gIG92ZXJyaWRlIGNvbXBvbmVudFR5cGU6IFR5cGU8YW55PjtcbiAgb3ZlcnJpZGUgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXTtcbiAgaXNCb3VuZFRvTW9kdWxlOiBib29sZWFuO1xuXG4gIG92ZXJyaWRlIGdldCBpbnB1dHMoKToge1xuICAgIHByb3BOYW1lOiBzdHJpbmc7XG4gICAgdGVtcGxhdGVOYW1lOiBzdHJpbmc7XG4gICAgaXNTaWduYWw6IGJvb2xlYW47XG4gICAgdHJhbnNmb3JtPzogKHZhbHVlOiBhbnkpID0+IGFueTtcbiAgfVtdIHtcbiAgICBjb25zdCBjb21wb25lbnREZWYgPSB0aGlzLmNvbXBvbmVudERlZjtcbiAgICBjb25zdCBpbnB1dFRyYW5zZm9ybXMgPSBjb21wb25lbnREZWYuaW5wdXRUcmFuc2Zvcm1zO1xuICAgIGNvbnN0IHJlZkFycmF5ID0gdG9SZWZBcnJheShjb21wb25lbnREZWYuaW5wdXRzLCB0cnVlKTtcblxuICAgIGlmIChpbnB1dFRyYW5zZm9ybXMgIT09IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgaW5wdXQgb2YgcmVmQXJyYXkpIHtcbiAgICAgICAgaWYgKGlucHV0VHJhbnNmb3Jtcy5oYXNPd25Qcm9wZXJ0eShpbnB1dC5wcm9wTmFtZSkpIHtcbiAgICAgICAgICBpbnB1dC50cmFuc2Zvcm0gPSBpbnB1dFRyYW5zZm9ybXNbaW5wdXQucHJvcE5hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZkFycmF5O1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5vdXRwdXRzLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGNvbXBvbmVudERlZiBUaGUgY29tcG9uZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggdGhlIGZhY3RvcnkgaXMgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4sXG4gICAgcHJpdmF0ZSBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4sXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG4gICAgdGhpcy5zZWxlY3RvciA9IHN0cmluZ2lmeUNTU1NlbGVjdG9yTGlzdChjb21wb25lbnREZWYuc2VsZWN0b3JzKTtcbiAgICB0aGlzLm5nQ29udGVudFNlbGVjdG9ycyA9IGNvbXBvbmVudERlZi5uZ0NvbnRlbnRTZWxlY3RvcnNcbiAgICAgID8gY29tcG9uZW50RGVmLm5nQ29udGVudFNlbGVjdG9yc1xuICAgICAgOiBbXTtcbiAgICB0aGlzLmlzQm91bmRUb01vZHVsZSA9ICEhbmdNb2R1bGU7XG4gIH1cblxuICBvdmVycmlkZSBjcmVhdGUoXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLFxuICAgIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdIHwgdW5kZWZpbmVkLFxuICAgIHJvb3RTZWxlY3Rvck9yTm9kZT86IGFueSxcbiAgICBlbnZpcm9ubWVudEluamVjdG9yPzogTmdNb2R1bGVSZWY8YW55PiB8IEVudmlyb25tZW50SW5qZWN0b3IgfCB1bmRlZmluZWQsXG4gICk6IEFic3RyYWN0Q29tcG9uZW50UmVmPFQ+IHtcbiAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgLy8gQ2hlY2sgaWYgdGhlIGNvbXBvbmVudCBpcyBvcnBoYW5cbiAgICAgIGlmIChcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICh0eXBlb2YgbmdKaXRNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0ppdE1vZGUpICYmXG4gICAgICAgIHRoaXMuY29tcG9uZW50RGVmLmRlYnVnSW5mbz8uZm9yYmlkT3JwaGFuUmVuZGVyaW5nXG4gICAgICApIHtcbiAgICAgICAgaWYgKGRlcHNUcmFja2VyLmlzT3JwaGFuQ29tcG9uZW50KHRoaXMuY29tcG9uZW50VHlwZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SVU5USU1FX0RFUFNfT1JQSEFOX0NPTVBPTkVOVCxcbiAgICAgICAgICAgIGBPcnBoYW4gY29tcG9uZW50IGZvdW5kISBUcnlpbmcgdG8gcmVuZGVyIHRoZSBjb21wb25lbnQgJHtkZWJ1Z1N0cmluZ2lmeVR5cGVGb3JFcnJvcihcbiAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRUeXBlLFxuICAgICAgICAgICAgKX0gd2l0aG91dCBmaXJzdCBsb2FkaW5nIHRoZSBOZ01vZHVsZSB0aGF0IGRlY2xhcmVzIGl0LiBJdCBpcyByZWNvbW1lbmRlZCB0byBtYWtlIHRoaXMgY29tcG9uZW50IHN0YW5kYWxvbmUgaW4gb3JkZXIgdG8gYXZvaWQgdGhpcyBlcnJvci4gSWYgdGhpcyBpcyBub3QgcG9zc2libGUgbm93LCBpbXBvcnQgdGhlIGNvbXBvbmVudCdzIE5nTW9kdWxlIGluIHRoZSBhcHByb3ByaWF0ZSBOZ01vZHVsZSwgb3IgdGhlIHN0YW5kYWxvbmUgY29tcG9uZW50IGluIHdoaWNoIHlvdSBhcmUgdHJ5aW5nIHRvIHJlbmRlciB0aGlzIGNvbXBvbmVudC4gSWYgdGhpcyBpcyBhIGxhenkgaW1wb3J0LCBsb2FkIHRoZSBOZ01vZHVsZSBsYXppbHkgYXMgd2VsbCBhbmQgdXNlIGl0cyBtb2R1bGUgaW5qZWN0b3IuYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3IgPSBlbnZpcm9ubWVudEluamVjdG9yIHx8IHRoaXMubmdNb2R1bGU7XG5cbiAgICAgIGxldCByZWFsRW52aXJvbm1lbnRJbmplY3RvciA9XG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3IgaW5zdGFuY2VvZiBFbnZpcm9ubWVudEluamVjdG9yXG4gICAgICAgICAgPyBlbnZpcm9ubWVudEluamVjdG9yXG4gICAgICAgICAgOiBlbnZpcm9ubWVudEluamVjdG9yPy5pbmplY3RvcjtcblxuICAgICAgaWYgKHJlYWxFbnZpcm9ubWVudEluamVjdG9yICYmIHRoaXMuY29tcG9uZW50RGVmLmdldFN0YW5kYWxvbmVJbmplY3RvciAhPT0gbnVsbCkge1xuICAgICAgICByZWFsRW52aXJvbm1lbnRJbmplY3RvciA9XG4gICAgICAgICAgdGhpcy5jb21wb25lbnREZWYuZ2V0U3RhbmRhbG9uZUluamVjdG9yKHJlYWxFbnZpcm9ubWVudEluamVjdG9yKSB8fFxuICAgICAgICAgIHJlYWxFbnZpcm9ubWVudEluamVjdG9yO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByb290Vmlld0luamVjdG9yID0gcmVhbEVudmlyb25tZW50SW5qZWN0b3JcbiAgICAgICAgPyBuZXcgQ2hhaW5lZEluamVjdG9yKGluamVjdG9yLCByZWFsRW52aXJvbm1lbnRJbmplY3RvcilcbiAgICAgICAgOiBpbmplY3RvcjtcblxuICAgICAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MiwgbnVsbCk7XG4gICAgICBpZiAocmVuZGVyZXJGYWN0b3J5ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SRU5ERVJFUl9OT1RfRk9VTkQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAnQW5ndWxhciB3YXMgbm90IGFibGUgdG8gaW5qZWN0IGEgcmVuZGVyZXIgKFJlbmRlcmVyRmFjdG9yeTIpLiAnICtcbiAgICAgICAgICAgICAgJ0xpa2VseSB0aGlzIGlzIGR1ZSB0byBhIGJyb2tlbiBESSBoaWVyYXJjaHkuICcgK1xuICAgICAgICAgICAgICAnTWFrZSBzdXJlIHRoYXQgYW55IGluamVjdG9yIHVzZWQgdG8gY3JlYXRlIHRoaXMgY29tcG9uZW50IGhhcyBhIGNvcnJlY3QgcGFyZW50LicsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCBzYW5pdGl6ZXIgPSByb290Vmlld0luamVjdG9yLmdldChTYW5pdGl6ZXIsIG51bGwpO1xuXG4gICAgICBjb25zdCBjaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPSByb290Vmlld0luamVjdG9yLmdldChDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIG51bGwpO1xuXG4gICAgICBjb25zdCBlbnZpcm9ubWVudDogTFZpZXdFbnZpcm9ubWVudCA9IHtcbiAgICAgICAgcmVuZGVyZXJGYWN0b3J5LFxuICAgICAgICBzYW5pdGl6ZXIsXG4gICAgICAgIC8vIFdlIGRvbid0IHVzZSBpbmxpbmUgZWZmZWN0cyAoeWV0KS5cbiAgICAgICAgaW5saW5lRWZmZWN0UnVubmVyOiBudWxsLFxuICAgICAgICBjaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBob3N0UmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgdGhpcy5jb21wb25lbnREZWYpO1xuICAgICAgLy8gRGV0ZXJtaW5lIGEgdGFnIG5hbWUgdXNlZCBmb3IgY3JlYXRpbmcgaG9zdCBlbGVtZW50cyB3aGVuIHRoaXMgY29tcG9uZW50IGlzIGNyZWF0ZWRcbiAgICAgIC8vIGR5bmFtaWNhbGx5LiBEZWZhdWx0IHRvICdkaXYnIGlmIHRoaXMgY29tcG9uZW50IGRpZCBub3Qgc3BlY2lmeSBhbnkgdGFnIG5hbWUgaW4gaXRzXG4gICAgICAvLyBzZWxlY3Rvci5cbiAgICAgIGNvbnN0IGVsZW1lbnROYW1lID0gKHRoaXMuY29tcG9uZW50RGVmLnNlbGVjdG9yc1swXVswXSBhcyBzdHJpbmcpIHx8ICdkaXYnO1xuICAgICAgY29uc3QgaG9zdFJOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlXG4gICAgICAgID8gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgICAgICAgICBob3N0UmVuZGVyZXIsXG4gICAgICAgICAgICByb290U2VsZWN0b3JPck5vZGUsXG4gICAgICAgICAgICB0aGlzLmNvbXBvbmVudERlZi5lbmNhcHN1bGF0aW9uLFxuICAgICAgICAgICAgcm9vdFZpZXdJbmplY3RvcixcbiAgICAgICAgICApXG4gICAgICAgIDogY3JlYXRlRWxlbWVudE5vZGUoaG9zdFJlbmRlcmVyLCBlbGVtZW50TmFtZSwgZ2V0TmFtZXNwYWNlKGVsZW1lbnROYW1lKSk7XG5cbiAgICAgIGxldCByb290RmxhZ3MgPSBMVmlld0ZsYWdzLklzUm9vdDtcbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudERlZi5zaWduYWxzKSB7XG4gICAgICAgIHJvb3RGbGFncyB8PSBMVmlld0ZsYWdzLlNpZ25hbFZpZXc7XG4gICAgICB9IGVsc2UgaWYgKCF0aGlzLmNvbXBvbmVudERlZi5vblB1c2gpIHtcbiAgICAgICAgcm9vdEZsYWdzIHw9IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXM7XG4gICAgICB9XG5cbiAgICAgIGxldCBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldyB8IG51bGwgPSBudWxsO1xuICAgICAgaWYgKGhvc3RSTm9kZSAhPT0gbnVsbCkge1xuICAgICAgICBoeWRyYXRpb25JbmZvID0gcmV0cmlldmVIeWRyYXRpb25JbmZvKGhvc3RSTm9kZSwgcm9vdFZpZXdJbmplY3RvciwgdHJ1ZSAvKiBpc1Jvb3RWaWV3ICovKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIHRoZSByb290IHZpZXcuIFVzZXMgZW1wdHkgVFZpZXcgYW5kIENvbnRlbnRUZW1wbGF0ZS5cbiAgICAgIGNvbnN0IHJvb3RUVmlldyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICBUVmlld1R5cGUuUm9vdCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgMSxcbiAgICAgICAgMCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgICk7XG4gICAgICBjb25zdCByb290TFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgbnVsbCxcbiAgICAgICAgcm9vdFRWaWV3LFxuICAgICAgICBudWxsLFxuICAgICAgICByb290RmxhZ3MsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICAgIGVudmlyb25tZW50LFxuICAgICAgICBob3N0UmVuZGVyZXIsXG4gICAgICAgIHJvb3RWaWV3SW5qZWN0b3IsXG4gICAgICAgIG51bGwsXG4gICAgICAgIGh5ZHJhdGlvbkluZm8sXG4gICAgICApO1xuXG4gICAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgICAgLy8gVE9ETyhtaXNrbyk6IGl0IGxvb2tzIGxpa2Ugd2UgYXJlIGVudGVyaW5nIHZpZXcgaGVyZSBidXQgd2UgZG9uJ3QgcmVhbGx5IG5lZWQgdG8gYXNcbiAgICAgIC8vIGByZW5kZXJWaWV3YCBkb2VzIHRoYXQuIEhvd2V2ZXIgYXMgdGhlIGNvZGUgaXMgd3JpdHRlbiBpdCBpcyBuZWVkZWQgYmVjYXVzZVxuICAgICAgLy8gYGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3YCBhbmQgYGNyZWF0ZVJvb3RDb21wb25lbnRgIGJvdGggcmVhZCBnbG9iYWwgc3RhdGUuIEZpeGluZyB0aG9zZVxuICAgICAgLy8gaXNzdWVzIHdvdWxkIGFsbG93IHVzIHRvIGRyb3AgdGhpcy5cbiAgICAgIGVudGVyVmlldyhyb290TFZpZXcpO1xuXG4gICAgICBsZXQgY29tcG9uZW50OiBUO1xuICAgICAgbGV0IHRFbGVtZW50Tm9kZTogVEVsZW1lbnROb2RlO1xuICAgICAgbGV0IGNvbXBvbmVudFZpZXc6IExWaWV3IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJvb3RDb21wb25lbnREZWYgPSB0aGlzLmNvbXBvbmVudERlZjtcbiAgICAgICAgbGV0IHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXTtcbiAgICAgICAgbGV0IGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmcyB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGlmIChyb290Q29tcG9uZW50RGVmLmZpbmRIb3N0RGlyZWN0aXZlRGVmcykge1xuICAgICAgICAgIHJvb3REaXJlY3RpdmVzID0gW107XG4gICAgICAgICAgaG9zdERpcmVjdGl2ZURlZnMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgcm9vdENvbXBvbmVudERlZi5maW5kSG9zdERpcmVjdGl2ZURlZnMoXG4gICAgICAgICAgICByb290Q29tcG9uZW50RGVmLFxuICAgICAgICAgICAgcm9vdERpcmVjdGl2ZXMsXG4gICAgICAgICAgICBob3N0RGlyZWN0aXZlRGVmcyxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJvb3REaXJlY3RpdmVzLnB1c2gocm9vdENvbXBvbmVudERlZik7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vRHVwbGljYXRlRGlyZWN0aXZlcyhyb290RGlyZWN0aXZlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcm9vdERpcmVjdGl2ZXMgPSBbcm9vdENvbXBvbmVudERlZl07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBob3N0VE5vZGUgPSBjcmVhdGVSb290Q29tcG9uZW50VE5vZGUocm9vdExWaWV3LCBob3N0Uk5vZGUpO1xuICAgICAgICBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgICAgaG9zdFROb2RlLFxuICAgICAgICAgIGhvc3RSTm9kZSxcbiAgICAgICAgICByb290Q29tcG9uZW50RGVmLFxuICAgICAgICAgIHJvb3REaXJlY3RpdmVzLFxuICAgICAgICAgIHJvb3RMVmlldyxcbiAgICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgICBob3N0UmVuZGVyZXIsXG4gICAgICAgICk7XG5cbiAgICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUocm9vdFRWaWV3LCBIRUFERVJfT0ZGU0VUKSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IGluIHByYWN0aWNlIGBob3N0Uk5vZGVgIHNob3VsZCBhbHdheXMgYmUgZGVmaW5lZCwgYnV0IHRoZXJlIGFyZSBzb21lXG4gICAgICAgIC8vIHRlc3RzIHdoZXJlIHRoZSByZW5kZXJlciBpcyBtb2NrZWQgb3V0IGFuZCBgdW5kZWZpbmVkYCBpcyByZXR1cm5lZC4gV2Ugc2hvdWxkIHVwZGF0ZSB0aGVcbiAgICAgICAgLy8gdGVzdHMgc28gdGhhdCB0aGlzIGNoZWNrIGNhbiBiZSByZW1vdmVkLlxuICAgICAgICBpZiAoaG9zdFJOb2RlKSB7XG4gICAgICAgICAgc2V0Um9vdE5vZGVBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgcm9vdENvbXBvbmVudERlZiwgaG9zdFJOb2RlLCByb290U2VsZWN0b3JPck5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2plY3RhYmxlTm9kZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHByb2plY3ROb2Rlcyh0RWxlbWVudE5vZGUsIHRoaXMubmdDb250ZW50U2VsZWN0b3JzLCBwcm9qZWN0YWJsZU5vZGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlclxuICAgICAgICAvLyBhbmQgZXhlY3V0ZWQgaGVyZT8gQW5ndWxhciA1IHJlZmVyZW5jZTogaHR0cHM6Ly9zdGFja2JsaXR6LmNvbS9lZGl0L2xpZmVjeWNsZS1ob29rcy12Y3JlZlxuICAgICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsXG4gICAgICAgICAgcm9vdENvbXBvbmVudERlZixcbiAgICAgICAgICByb290RGlyZWN0aXZlcyxcbiAgICAgICAgICBob3N0RGlyZWN0aXZlRGVmcyxcbiAgICAgICAgICByb290TFZpZXcsXG4gICAgICAgICAgW0xpZmVjeWNsZUhvb2tzRmVhdHVyZV0sXG4gICAgICAgICk7XG4gICAgICAgIHJlbmRlclZpZXcocm9vdFRWaWV3LCByb290TFZpZXcsIG51bGwpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBTdG9wIHRyYWNraW5nIHRoZSB2aWV3cyBpZiBjcmVhdGlvbiBmYWlsZWQgc2luY2VcbiAgICAgICAgLy8gdGhlIGNvbnN1bWVyIHdvbid0IGhhdmUgYSB3YXkgdG8gZGVyZWZlcmVuY2UgdGhlbS5cbiAgICAgICAgaWYgKGNvbXBvbmVudFZpZXcgIT09IG51bGwpIHtcbiAgICAgICAgICB1bnJlZ2lzdGVyTFZpZXcoY29tcG9uZW50Vmlldyk7XG4gICAgICAgIH1cbiAgICAgICAgdW5yZWdpc3RlckxWaWV3KHJvb3RMVmlldyk7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBsZWF2ZVZpZXcoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRSZWYoXG4gICAgICAgIHRoaXMuY29tcG9uZW50VHlwZSxcbiAgICAgICAgY29tcG9uZW50LFxuICAgICAgICBjcmVhdGVFbGVtZW50UmVmKHRFbGVtZW50Tm9kZSwgcm9vdExWaWV3KSxcbiAgICAgICAgcm9vdExWaWV3LFxuICAgICAgICB0RWxlbWVudE5vZGUsXG4gICAgICApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnQgY3JlYXRlZCB2aWEgYSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0uXG4gKlxuICogYENvbXBvbmVudFJlZmAgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBDb21wb25lbnQgSW5zdGFuY2UgYXMgd2VsbCBvdGhlciBvYmplY3RzIHJlbGF0ZWQgdG8gdGhpc1xuICogQ29tcG9uZW50IEluc3RhbmNlIGFuZCBhbGxvd3MgeW91IHRvIGRlc3Ryb3kgdGhlIENvbXBvbmVudCBJbnN0YW5jZSB2aWEgdGhlIHtAbGluayAjZGVzdHJveX1cbiAqIG1ldGhvZC5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWY8VD4gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudFJlZjxUPiB7XG4gIG92ZXJyaWRlIGluc3RhbmNlOiBUO1xuICBvdmVycmlkZSBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgb3ZlcnJpZGUgY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmO1xuICBvdmVycmlkZSBjb21wb25lbnRUeXBlOiBUeXBlPFQ+O1xuICBwcml2YXRlIHByZXZpb3VzSW5wdXRWYWx1ZXM6IE1hcDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29tcG9uZW50VHlwZTogVHlwZTxUPixcbiAgICBpbnN0YW5jZTogVCxcbiAgICBwdWJsaWMgbG9jYXRpb246IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSBfcm9vdExWaWV3OiBMVmlldyxcbiAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgIHRoaXMuaG9zdFZpZXcgPSB0aGlzLmNoYW5nZURldGVjdG9yUmVmID0gbmV3IFZpZXdSZWY8VD4oXG4gICAgICBfcm9vdExWaWV3LFxuICAgICAgdW5kZWZpbmVkIC8qIF9jZFJlZkluamVjdGluZ1ZpZXcgKi8sXG4gICAgICBmYWxzZSAvKiBub3RpZnlFcnJvckhhbmRsZXIgKi8sXG4gICAgKTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnRUeXBlO1xuICB9XG5cbiAgb3ZlcnJpZGUgc2V0SW5wdXQobmFtZTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IHZvaWQge1xuICAgIGNvbnN0IGlucHV0RGF0YSA9IHRoaXMuX3ROb2RlLmlucHV0cztcbiAgICBsZXQgZGF0YVZhbHVlOiBOb2RlSW5wdXRCaW5kaW5nc1t0eXBlb2YgbmFtZV0gfCB1bmRlZmluZWQ7XG4gICAgaWYgKGlucHV0RGF0YSAhPT0gbnVsbCAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW25hbWVdKSkge1xuICAgICAgdGhpcy5wcmV2aW91c0lucHV0VmFsdWVzID8/PSBuZXcgTWFwKCk7XG4gICAgICAvLyBEbyBub3Qgc2V0IHRoZSBpbnB1dCBpZiBpdCBpcyB0aGUgc2FtZSBhcyB0aGUgbGFzdCB2YWx1ZVxuICAgICAgLy8gVGhpcyBiZWhhdmlvciBtYXRjaGVzIGBiaW5kaW5nVXBkYXRlZGAgd2hlbiBiaW5kaW5nIGlucHV0cyBpbiB0ZW1wbGF0ZXMuXG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMucHJldmlvdXNJbnB1dFZhbHVlcy5oYXMobmFtZSkgJiZcbiAgICAgICAgT2JqZWN0LmlzKHRoaXMucHJldmlvdXNJbnB1dFZhbHVlcy5nZXQobmFtZSksIHZhbHVlKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yb290TFZpZXc7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlld1tUVklFV10sIGxWaWV3LCBkYXRhVmFsdWUsIG5hbWUsIHZhbHVlKTtcbiAgICAgIHRoaXMucHJldmlvdXNJbnB1dFZhbHVlcy5zZXQobmFtZSwgdmFsdWUpO1xuICAgICAgY29uc3QgY2hpbGRDb21wb25lbnRMVmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0aGlzLl90Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgbWFya1ZpZXdEaXJ0eShjaGlsZENvbXBvbmVudExWaWV3LCBOb3RpZmljYXRpb25Tb3VyY2UuU2V0SW5wdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGNvbnN0IGNtcE5hbWVGb3JFcnJvciA9IHN0cmluZ2lmeUZvckVycm9yKHRoaXMuY29tcG9uZW50VHlwZSk7XG4gICAgICAgIGxldCBtZXNzYWdlID0gYENhbid0IHNldCB2YWx1ZSBvZiB0aGUgJyR7bmFtZX0nIGlucHV0IG9uIHRoZSAnJHtjbXBOYW1lRm9yRXJyb3J9JyBjb21wb25lbnQuIGA7XG4gICAgICAgIG1lc3NhZ2UgKz0gYE1ha2Ugc3VyZSB0aGF0IHRoZSAnJHtuYW1lfScgcHJvcGVydHkgaXMgYW5ub3RhdGVkIHdpdGggQElucHV0KCkgb3IgYSBtYXBwZWQgQElucHV0KCcke25hbWV9JykgZXhpc3RzLmA7XG4gICAgICAgIHJlcG9ydFVua25vd25Qcm9wZXJ0eUVycm9yKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodGhpcy5fdE5vZGUsIHRoaXMuX3Jvb3RMVmlldyk7XG4gIH1cblxuICBvdmVycmlkZSBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdFZpZXcuZGVzdHJveSgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5ob3N0Vmlldy5vbkRlc3Ryb3koY2FsbGJhY2spO1xuICB9XG59XG5cbi8qKiBSZXByZXNlbnRzIGEgSG9zdEZlYXR1cmUgZnVuY3Rpb24uICovXG50eXBlIEhvc3RGZWF0dXJlID0gPFQ+KGNvbXBvbmVudDogVCwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pID0+IHZvaWQ7XG5cbi8qKiBDcmVhdGVzIGEgVE5vZGUgdGhhdCBjYW4gYmUgdXNlZCB0byBpbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudFROb2RlKGxWaWV3OiBMVmlldywgck5vZGU6IFJOb2RlKTogVEVsZW1lbnROb2RlIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGluZGV4ID0gSEVBREVSX09GRlNFVDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICBsVmlld1tpbmRleF0gPSByTm9kZTtcblxuICAvLyAnI2hvc3QnIGlzIGFkZGVkIGhlcmUgYXMgd2UgZG9uJ3Qga25vdyB0aGUgcmVhbCBob3N0IERPTSBuYW1lICh3ZSBkb24ndCB3YW50IHRvIHJlYWQgaXQpIGFuZCBhdFxuICAvLyB0aGUgc2FtZSB0aW1lIHdlIHdhbnQgdG8gY29tbXVuaWNhdGUgdGhlIGRlYnVnIGBUTm9kZWAgdGhhdCB0aGlzIGlzIGEgc3BlY2lhbCBgVE5vZGVgXG4gIC8vIHJlcHJlc2VudGluZyBhIGhvc3QgZWxlbWVudC5cbiAgcmV0dXJuIGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgJyNob3N0JywgbnVsbCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcm9vdCBjb21wb25lbnQgdmlldyBhbmQgdGhlIHJvb3QgY29tcG9uZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIGhvc3RSTm9kZSBSZW5kZXIgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIHJvb3RDb21wb25lbnREZWYgQ29tcG9uZW50RGVmXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHBhcmVudCB2aWV3IHdoZXJlIHRoZSBob3N0IG5vZGUgaXMgc3RvcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJGYWN0b3J5IEZhY3RvcnkgdG8gYmUgdXNlZCBmb3IgY3JlYXRpbmcgY2hpbGQgcmVuZGVyZXJzLlxuICogQHBhcmFtIGhvc3RSZW5kZXJlciBUaGUgY3VycmVudCByZW5kZXJlclxuICogQHBhcmFtIHNhbml0aXplciBUaGUgc2FuaXRpemVyLCBpZiBwcm92aWRlZFxuICpcbiAqIEByZXR1cm5zIENvbXBvbmVudCB2aWV3IGNyZWF0ZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gIHROb2RlOiBURWxlbWVudE5vZGUsXG4gIGhvc3RSTm9kZTogUkVsZW1lbnQgfCBudWxsLFxuICByb290Q29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55PixcbiAgcm9vdERpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10sXG4gIHJvb3RWaWV3OiBMVmlldyxcbiAgZW52aXJvbm1lbnQ6IExWaWV3RW52aXJvbm1lbnQsXG4gIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIsXG4pOiBMVmlldyB7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdFZpZXdbVFZJRVddO1xuICBhcHBseVJvb3RDb21wb25lbnRTdHlsaW5nKHJvb3REaXJlY3RpdmVzLCB0Tm9kZSwgaG9zdFJOb2RlLCBob3N0UmVuZGVyZXIpO1xuXG4gIC8vIEh5ZHJhdGlvbiBpbmZvIGlzIG9uIHRoZSBob3N0IGVsZW1lbnQgYW5kIG5lZWRzIHRvIGJlIHJldHJpZXZlZFxuICAvLyBhbmQgcGFzc2VkIHRvIHRoZSBjb21wb25lbnQgTFZpZXcuXG4gIGxldCBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldyB8IG51bGwgPSBudWxsO1xuICBpZiAoaG9zdFJOb2RlICE9PSBudWxsKSB7XG4gICAgaHlkcmF0aW9uSW5mbyA9IHJldHJpZXZlSHlkcmF0aW9uSW5mbyhob3N0Uk5vZGUsIHJvb3RWaWV3W0lOSkVDVE9SXSEpO1xuICB9XG4gIGNvbnN0IHZpZXdSZW5kZXJlciA9IGVudmlyb25tZW50LnJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihob3N0Uk5vZGUsIHJvb3RDb21wb25lbnREZWYpO1xuICBsZXQgbFZpZXdGbGFncyA9IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXM7XG4gIGlmIChyb290Q29tcG9uZW50RGVmLnNpZ25hbHMpIHtcbiAgICBsVmlld0ZsYWdzID0gTFZpZXdGbGFncy5TaWduYWxWaWV3O1xuICB9IGVsc2UgaWYgKHJvb3RDb21wb25lbnREZWYub25QdXNoKSB7XG4gICAgbFZpZXdGbGFncyA9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgIHJvb3RWaWV3LFxuICAgIGdldE9yQ3JlYXRlQ29tcG9uZW50VFZpZXcocm9vdENvbXBvbmVudERlZiksXG4gICAgbnVsbCxcbiAgICBsVmlld0ZsYWdzLFxuICAgIHJvb3RWaWV3W3ROb2RlLmluZGV4XSxcbiAgICB0Tm9kZSxcbiAgICBlbnZpcm9ubWVudCxcbiAgICB2aWV3UmVuZGVyZXIsXG4gICAgbnVsbCxcbiAgICBudWxsLFxuICAgIGh5ZHJhdGlvbkluZm8sXG4gICk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlLCByb290RGlyZWN0aXZlcy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIGFkZFRvVmlld1RyZWUocm9vdFZpZXcsIGNvbXBvbmVudFZpZXcpO1xuXG4gIC8vIFN0b3JlIGNvbXBvbmVudCB2aWV3IGF0IG5vZGUgaW5kZXgsIHdpdGggbm9kZSBhcyB0aGUgSE9TVFxuICByZXR1cm4gKHJvb3RWaWV3W3ROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXcpO1xufVxuXG4vKiogU2V0cyB1cCB0aGUgc3R5bGluZyBpbmZvcm1hdGlvbiBvbiBhIHJvb3QgY29tcG9uZW50LiAqL1xuZnVuY3Rpb24gYXBwbHlSb290Q29tcG9uZW50U3R5bGluZyhcbiAgcm9vdERpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10sXG4gIHROb2RlOiBURWxlbWVudE5vZGUsXG4gIHJOb2RlOiBSRWxlbWVudCB8IG51bGwsXG4gIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIsXG4pOiB2b2lkIHtcbiAgZm9yIChjb25zdCBkZWYgb2Ygcm9vdERpcmVjdGl2ZXMpIHtcbiAgICB0Tm9kZS5tZXJnZWRBdHRycyA9IG1lcmdlSG9zdEF0dHJzKHROb2RlLm1lcmdlZEF0dHJzLCBkZWYuaG9zdEF0dHJzKTtcbiAgfVxuXG4gIGlmICh0Tm9kZS5tZXJnZWRBdHRycyAhPT0gbnVsbCkge1xuICAgIGNvbXB1dGVTdGF0aWNTdHlsaW5nKHROb2RlLCB0Tm9kZS5tZXJnZWRBdHRycywgdHJ1ZSk7XG5cbiAgICBpZiAock5vZGUgIT09IG51bGwpIHtcbiAgICAgIHNldHVwU3RhdGljQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIHJOb2RlLCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJvb3QgY29tcG9uZW50IGFuZCBzZXRzIGl0IHVwIHdpdGggZmVhdHVyZXMgYW5kIGhvc3QgYmluZGluZ3MuU2hhcmVkIGJ5XG4gKiByZW5kZXJDb21wb25lbnQoKSBhbmQgVmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnQoKS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudDxUPihcbiAgY29tcG9uZW50VmlldzogTFZpZXcsXG4gIHJvb3RDb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPixcbiAgcm9vdERpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10sXG4gIGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmcyB8IG51bGwsXG4gIHJvb3RMVmlldzogTFZpZXcsXG4gIGhvc3RGZWF0dXJlczogSG9zdEZlYXR1cmVbXSB8IG51bGwsXG4pOiBhbnkge1xuICBjb25zdCByb290VE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHJvb3RUTm9kZSwgJ3ROb2RlIHNob3VsZCBoYXZlIGJlZW4gYWxyZWFkeSBjcmVhdGVkJyk7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdExWaWV3W1RWSUVXXTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShyb290VE5vZGUsIHJvb3RMVmlldyk7XG5cbiAgaW5pdGlhbGl6ZURpcmVjdGl2ZXModFZpZXcsIHJvb3RMVmlldywgcm9vdFROb2RlLCByb290RGlyZWN0aXZlcywgbnVsbCwgaG9zdERpcmVjdGl2ZURlZnMpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdERpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IHJvb3RUTm9kZS5kaXJlY3RpdmVTdGFydCArIGk7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5zdGFuY2UgPSBnZXROb2RlSW5qZWN0YWJsZShyb290TFZpZXcsIHRWaWV3LCBkaXJlY3RpdmVJbmRleCwgcm9vdFROb2RlKTtcbiAgICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlSW5zdGFuY2UsIHJvb3RMVmlldyk7XG4gIH1cblxuICBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3LCByb290TFZpZXcsIHJvb3RUTm9kZSk7XG5cbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHJvb3RMVmlldyk7XG4gIH1cblxuICAvLyBXZSdyZSBndWFyYW50ZWVkIGZvciB0aGUgYGNvbXBvbmVudE9mZnNldGAgdG8gYmUgcG9zaXRpdmUgaGVyZVxuICAvLyBzaW5jZSBhIHJvb3QgY29tcG9uZW50IGFsd2F5cyBtYXRjaGVzIGEgY29tcG9uZW50IGRlZi5cbiAgbmdEZXZNb2RlICYmXG4gICAgYXNzZXJ0R3JlYXRlclRoYW4ocm9vdFROb2RlLmNvbXBvbmVudE9mZnNldCwgLTEsICdjb21wb25lbnRPZmZzZXQgbXVzdCBiZSBncmVhdCB0aGFuIC0xJyk7XG4gIGNvbnN0IGNvbXBvbmVudCA9IGdldE5vZGVJbmplY3RhYmxlKFxuICAgIHJvb3RMVmlldyxcbiAgICB0VmlldyxcbiAgICByb290VE5vZGUuZGlyZWN0aXZlU3RhcnQgKyByb290VE5vZGUuY29tcG9uZW50T2Zmc2V0LFxuICAgIHJvb3RUTm9kZSxcbiAgKTtcbiAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IHJvb3RMVmlld1tDT05URVhUXSA9IGNvbXBvbmVudDtcblxuICBpZiAoaG9zdEZlYXR1cmVzICE9PSBudWxsKSB7XG4gICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIGhvc3RGZWF0dXJlcykge1xuICAgICAgZmVhdHVyZShjb21wb25lbnQsIHJvb3RDb21wb25lbnREZWYpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFdlIHdhbnQgdG8gZ2VuZXJhdGUgYW4gZW1wdHkgUXVlcnlMaXN0IGZvciByb290IGNvbnRlbnQgcXVlcmllcyBmb3IgYmFja3dhcmRzXG4gIC8vIGNvbXBhdGliaWxpdHkgd2l0aCBWaWV3RW5naW5lLlxuICBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXcsIHJvb3RUTm9kZSwgcm9vdExWaWV3KTtcblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG4vKiogU2V0cyB0aGUgc3RhdGljIGF0dHJpYnV0ZXMgb24gYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIHNldFJvb3ROb2RlQXR0cmlidXRlcyhcbiAgaG9zdFJlbmRlcmVyOiBSZW5kZXJlcjIsXG4gIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPHVua25vd24+LFxuICBob3N0Uk5vZGU6IFJFbGVtZW50LFxuICByb290U2VsZWN0b3JPck5vZGU6IGFueSxcbikge1xuICBpZiAocm9vdFNlbGVjdG9yT3JOb2RlKSB7XG4gICAgLy8gVGhlIHBsYWNlaG9sZGVyIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCB0aGUgYWN0dWFsIHZlcnNpb24gYXQgYnVpbGQgdGltZS5cbiAgICBzZXRVcEF0dHJpYnV0ZXMoaG9zdFJlbmRlcmVyLCBob3N0Uk5vZGUsIFsnbmctdmVyc2lvbicsICcwLjAuMC1QTEFDRUhPTERFUiddKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiBob3N0IGVsZW1lbnQgaXMgY3JlYXRlZCBhcyBhIHBhcnQgb2YgdGhpcyBmdW5jdGlvbiBjYWxsIChpLmUuIGByb290U2VsZWN0b3JPck5vZGVgXG4gICAgLy8gaXMgbm90IGRlZmluZWQpLCBhbHNvIGFwcGx5IGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgZXh0cmFjdGVkIGZyb20gY29tcG9uZW50IHNlbGVjdG9yLlxuICAgIC8vIEV4dHJhY3QgYXR0cmlidXRlcyBhbmQgY2xhc3NlcyBmcm9tIHRoZSBmaXJzdCBzZWxlY3RvciBvbmx5IHRvIG1hdGNoIFZFIGJlaGF2aW9yLlxuICAgIGNvbnN0IHthdHRycywgY2xhc3Nlc30gPSBleHRyYWN0QXR0cnNBbmRDbGFzc2VzRnJvbVNlbGVjdG9yKGNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF0pO1xuICAgIGlmIChhdHRycykge1xuICAgICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgaG9zdFJOb2RlLCBhdHRycyk7XG4gICAgfVxuICAgIGlmIChjbGFzc2VzICYmIGNsYXNzZXMubGVuZ3RoID4gMCkge1xuICAgICAgd3JpdGVEaXJlY3RDbGFzcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgY2xhc3Nlcy5qb2luKCcgJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUHJvamVjdHMgdGhlIGBwcm9qZWN0YWJsZU5vZGVzYCB0aGF0IHdlcmUgc3BlY2lmaWVkIHdoZW4gY3JlYXRpbmcgYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIHByb2plY3ROb2RlcyhcbiAgdE5vZGU6IFRFbGVtZW50Tm9kZSxcbiAgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXSxcbiAgcHJvamVjdGFibGVOb2RlczogYW55W11bXSxcbikge1xuICBjb25zdCBwcm9qZWN0aW9uOiAoVE5vZGUgfCBSTm9kZVtdIHwgbnVsbClbXSA9ICh0Tm9kZS5wcm9qZWN0aW9uID0gW10pO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5nQ29udGVudFNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVzZm9yU2xvdCA9IHByb2plY3RhYmxlTm9kZXNbaV07XG4gICAgLy8gUHJvamVjdGFibGUgbm9kZXMgY2FuIGJlIHBhc3NlZCBhcyBhcnJheSBvZiBhcnJheXMgb3IgYW4gYXJyYXkgb2YgaXRlcmFibGVzIChuZ1VwZ3JhZGVcbiAgICAvLyBjYXNlKS4gSGVyZSB3ZSBkbyBub3JtYWxpemUgcGFzc2VkIGRhdGEgc3RydWN0dXJlIHRvIGJlIGFuIGFycmF5IG9mIGFycmF5cyB0byBhdm9pZFxuICAgIC8vIGNvbXBsZXggY2hlY2tzIGRvd24gdGhlIGxpbmUuXG4gICAgLy8gV2UgYWxzbyBub3JtYWxpemUgdGhlIGxlbmd0aCBvZiB0aGUgcGFzc2VkIGluIHByb2plY3RhYmxlIG5vZGVzICh0byBtYXRjaCB0aGUgbnVtYmVyIG9mXG4gICAgLy8gPG5nLWNvbnRhaW5lcj4gc2xvdHMgZGVmaW5lZCBieSBhIGNvbXBvbmVudCkuXG4gICAgcHJvamVjdGlvbi5wdXNoKG5vZGVzZm9yU2xvdCAhPSBudWxsICYmIG5vZGVzZm9yU2xvdC5sZW5ndGggPyBBcnJheS5mcm9tKG5vZGVzZm9yU2xvdCkgOiBudWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gZW5hYmxlIGxpZmVjeWNsZSBob29rcyBvbiB0aGUgcm9vdCBjb21wb25lbnQuXG4gKlxuICogSW5jbHVkZSB0aGlzIGZlYXR1cmUgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGlmIHRoZSByb290IGNvbXBvbmVudFxuICogeW91IGFyZSByZW5kZXJpbmcgaGFzIGxpZmVjeWNsZSBob29rcyBkZWZpbmVkLiBPdGhlcndpc2UsIHRoZSBob29rcyB3b24ndFxuICogYmUgY2FsbGVkIHByb3Blcmx5LlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiByZW5kZXJDb21wb25lbnQoQXBwQ29tcG9uZW50LCB7aG9zdEZlYXR1cmVzOiBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXX0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBMaWZlY3ljbGVIb29rc0ZlYXR1cmUoKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ1ROb2RlIGlzIHJlcXVpcmVkJyk7XG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3MoZ2V0TFZpZXcoKVtUVklFV10sIHROb2RlKTtcbn1cbiJdfQ==