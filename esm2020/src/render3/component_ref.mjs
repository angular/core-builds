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
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode, NodeInjector } from './di';
import { throwProviderNotFoundError } from './errors_di';
import { registerPostOrderHooks } from './hooks';
import { reportUnknownPropertyError } from './instructions/element_validation';
import { addToViewTree, createLView, createTView, executeContentQueries, getOrCreateComponentTView, getOrCreateTNode, initializeDirectives, invokeDirectivesHostBindings, locateHostElement, markAsComponentHost, markDirtyIfOnPush, renderView, setInputsForProperty } from './instructions/shared';
import { CONTEXT, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
import { createElementNode, setupStaticAttributes, writeDirectClass } from './node_manipulation';
import { extractAttrsAndClassesFromSelector, stringifyCSSSelectorList } from './node_selector_matcher';
import { enterView, getCurrentTNode, getLView, leaveView } from './state';
import { computeStaticStyling } from './styling/static_styling';
import { mergeHostAttrs, setUpAttributes } from './util/attrs_utils';
import { stringifyForError } from './util/stringify_utils';
import { getNativeByTNode, getTNode } from './util/view_utils';
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
    get inputs() {
        return toRefArray(this.componentDef.inputs);
    }
    get outputs() {
        return toRefArray(this.componentDef.outputs);
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
        const hostRenderer = rendererFactory.createRenderer(null, this.componentDef);
        // Determine a tag name used for creating host elements when this component is created
        // dynamically. Default to 'div' if this component did not specify any tag name in its selector.
        const elementName = this.componentDef.selectors[0][0] || 'div';
        const hostRNode = rootSelectorOrNode ?
            locateHostElement(hostRenderer, rootSelectorOrNode, this.componentDef.encapsulation) :
            createElementNode(rendererFactory.createRenderer(null, this.componentDef), elementName, getNamespace(elementName));
        const rootFlags = this.componentDef.onPush ? 32 /* LViewFlags.Dirty */ | 256 /* LViewFlags.IsRoot */ :
            16 /* LViewFlags.CheckAlways */ | 256 /* LViewFlags.IsRoot */;
        // Create the root view. Uses empty TView and ContentTemplate.
        const rootTView = createTView(0 /* TViewType.Root */, null, null, 1, 0, null, null, null, null, null);
        const rootLView = createLView(null, rootTView, null, rootFlags, null, null, rendererFactory, hostRenderer, sanitizer, rootViewInjector, null);
        // rootView is the parent when bootstrapping
        // TODO(misko): it looks like we are entering view here but we don't really need to as
        // `renderView` does that. However as the code is written it is needed because
        // `createRootComponentView` and `createRootComponent` both read global state. Fixing those
        // issues would allow us to drop this.
        enterView(rootLView);
        let component;
        let tElementNode;
        try {
            const rootDirectives = [this.componentDef];
            const hostTNode = createRootComponentTNode(rootLView, hostRNode);
            const componentView = createRootComponentView(hostTNode, hostRNode, this.componentDef, rootDirectives, rootLView, rendererFactory, hostRenderer);
            tElementNode = getTNode(rootTView, HEADER_OFFSET);
            // TODO(crisbeto): in practice `hostRNode` should always be defined, but there are some tests
            // where the renderer is mocked out and `undefined` is returned. We should update the tests so
            // that this check can be removed.
            if (hostRNode) {
                setRootNodeAttributes(hostRenderer, this.componentDef, hostRNode, rootSelectorOrNode);
            }
            if (projectableNodes !== undefined) {
                projectNodes(tElementNode, this.ngContentSelectors, projectableNodes);
            }
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            component = createRootComponent(componentView, this.componentDef, rootDirectives, rootLView, [LifecycleHooksFeature]);
            renderView(rootTView, rootLView, null);
        }
        finally {
            leaveView();
        }
        return new ComponentRef(this.componentType, component, createElementRef(tElementNode, rootLView), rootLView, tElementNode);
    }
}
const componentFactoryResolver = new ComponentFactoryResolver();
/**
 * Creates a ComponentFactoryResolver and stores it on the injector. Or, if the
 * ComponentFactoryResolver
 * already exists, retrieves the existing ComponentFactoryResolver.
 *
 * @returns The ComponentFactoryResolver instance to use
 */
export function injectComponentFactoryResolver() {
    return componentFactoryResolver;
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
        this.instance = instance;
        this.hostView = this.changeDetectorRef = new RootViewRef(_rootLView);
        this.componentType = componentType;
    }
    setInput(name, value) {
        const inputData = this._tNode.inputs;
        let dataValue;
        if (inputData !== null && (dataValue = inputData[name])) {
            const lView = this._rootLView;
            setInputsForProperty(lView[TVIEW], lView, dataValue, name, value);
            markDirtyIfOnPush(lView, this._tNode.index);
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
 * @param rNode Render host element.
 * @param rootComponentDef ComponentDef
 * @param rootView The parent view where the host node is stored
 * @param rendererFactory Factory to be used for creating child renderers.
 * @param hostRenderer The current renderer
 * @param sanitizer The sanitizer, if provided
 *
 * @returns Component view created
 */
function createRootComponentView(tNode, rNode, rootComponentDef, rootDirectives, rootView, rendererFactory, hostRenderer, sanitizer) {
    const tView = rootView[TVIEW];
    applyRootComponentStyling(rootDirectives, tNode, rNode, hostRenderer);
    const viewRenderer = rendererFactory.createRenderer(rNode, rootComponentDef);
    const componentView = createLView(rootView, getOrCreateComponentTView(rootComponentDef), null, rootComponentDef.onPush ? 32 /* LViewFlags.Dirty */ : 16 /* LViewFlags.CheckAlways */, rootView[tNode.index], tNode, rendererFactory, viewRenderer, sanitizer || null, null, null);
    if (tView.firstCreatePass) {
        diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, rootView), tView, rootComponentDef.type);
        markAsComponentHost(tView, tNode, 0);
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
function createRootComponent(componentView, rootComponentDef, rootDirectives, rootLView, hostFeatures) {
    const rootTNode = getCurrentTNode();
    ngDevMode && assertDefined(rootTNode, 'tNode should have been already created');
    const tView = rootLView[TVIEW];
    const native = getNativeByTNode(rootTNode, rootLView);
    initializeDirectives(tView, rootLView, rootTNode, rootDirectives, null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUcvRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUV6RCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksd0JBQXdCLEVBQUUsWUFBWSxJQUFJLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDL0gsT0FBTyxFQUFDLHdCQUF3QixJQUFJLGdDQUFnQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLGdCQUFnQixFQUFhLE1BQU0sdUJBQXVCLENBQUM7QUFFbkUsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEYsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUMscUNBQXFDLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUU3RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFF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O0FBQ0gsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQyxNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3ZELHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Y29udmVydFRvQml0RmxhZ3N9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0T3B0aW9uc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7UHJvdmlkZXJUb2tlbn0gZnJvbSAnLi4vZGkvcHJvdmlkZXJfdG9rZW4nO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIEFic3RyYWN0Q29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIEVsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0SW5kZXhJblJhbmdlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge1ZFUlNJT059IGZyb20gJy4uL3ZlcnNpb24nO1xuaW1wb3J0IHtOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SfSBmcm9tICcuLi92aWV3L3Byb3ZpZGVyX2ZsYWdzJztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlLCBOb2RlSW5qZWN0b3J9IGZyb20gJy4vZGknO1xuaW1wb3J0IHt0aHJvd1Byb3ZpZGVyTm90Rm91bmRFcnJvcn0gZnJvbSAnLi9lcnJvcnNfZGknO1xuaW1wb3J0IHtyZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7cmVwb3J0VW5rbm93blByb3BlcnR5RXJyb3J9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2VsZW1lbnRfdmFsaWRhdGlvbic7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZUxWaWV3LCBjcmVhdGVUVmlldywgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzLCBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3LCBnZXRPckNyZWF0ZVROb2RlLCBpbml0aWFsaXplRGlyZWN0aXZlcywgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncywgbG9jYXRlSG9zdEVsZW1lbnQsIG1hcmtBc0NvbXBvbmVudEhvc3QsIG1hcmtEaXJ0eUlmT25QdXNoLCByZW5kZXJWaWV3LCBzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7UHJvcGVydHlBbGlhc1ZhbHVlLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UmVuZGVyZXIsIFJlbmRlcmVyRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFRWSUVXLCBUVmlld1R5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7TUFUSF9NTF9OQU1FU1BBQ0UsIFNWR19OQU1FU1BBQ0V9IGZyb20gJy4vbmFtZXNwYWNlcyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnROb2RlLCBzZXR1cFN0YXRpY0F0dHJpYnV0ZXMsIHdyaXRlRGlyZWN0Q2xhc3N9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtleHRyYWN0QXR0cnNBbmRDbGFzc2VzRnJvbVNlbGVjdG9yLCBzdHJpbmdpZnlDU1NTZWxlY3Rvckxpc3R9IGZyb20gJy4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBsZWF2ZVZpZXd9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtjb21wdXRlU3RhdGljU3R5bGluZ30gZnJvbSAnLi9zdHlsaW5nL3N0YXRpY19zdHlsaW5nJztcbmltcG9ydCB7bWVyZ2VIb3N0QXR0cnMsIHNldFVwQXR0cmlidXRlc30gZnJvbSAnLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7c3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtSb290Vmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIGFsbCByZXNvbHZlZCBmYWN0b3JpZXMgYXJlIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpITtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLm5nTW9kdWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1JlZkFycmF5KG1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgY29uc3QgYXJyYXk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10gPSBbXTtcbiAgZm9yIChsZXQgbm9uTWluaWZpZWQgaW4gbWFwKSB7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShub25NaW5pZmllZCkpIHtcbiAgICAgIGNvbnN0IG1pbmlmaWVkID0gbWFwW25vbk1pbmlmaWVkXTtcbiAgICAgIGFycmF5LnB1c2goe3Byb3BOYW1lOiBtaW5pZmllZCwgdGVtcGxhdGVOYW1lOiBub25NaW5pZmllZH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGdldE5hbWVzcGFjZShlbGVtZW50TmFtZTogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBuYW1lID0gZWxlbWVudE5hbWUudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIG5hbWUgPT09ICdzdmcnID8gU1ZHX05BTUVTUEFDRSA6IChuYW1lID09PSAnbWF0aCcgPyBNQVRIX01MX05BTUVTUEFDRSA6IG51bGwpO1xufVxuXG4vKipcbiAqIEluamVjdG9yIHRoYXQgbG9va3MgdXAgYSB2YWx1ZSB1c2luZyBhIHNwZWNpZmljIGluamVjdG9yLCBiZWZvcmUgZmFsbGluZyBiYWNrIHRvIHRoZSBtb2R1bGVcbiAqIGluamVjdG9yLiBVc2VkIHByaW1hcmlseSB3aGVuIGNyZWF0aW5nIGNvbXBvbmVudHMgb3IgZW1iZWRkZWQgdmlld3MgZHluYW1pY2FsbHkuXG4gKi9cbmNsYXNzIENoYWluZWRJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IsIHByaXZhdGUgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3N8SW5qZWN0T3B0aW9ucyk6IFQge1xuICAgIGZsYWdzID0gY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpO1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5pbmplY3Rvci5nZXQ8VHx0eXBlb2YgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUj4oXG4gICAgICAgIHRva2VuLCBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SLCBmbGFncyk7XG5cbiAgICBpZiAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgfHxcbiAgICAgICAgbm90Rm91bmRWYWx1ZSA9PT0gKE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgYXMgdW5rbm93biBhcyBUKSkge1xuICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgICAgLy8gLSBpdCBwcm92aWRlcyBpdFxuICAgICAgLy8gICAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAvLyAtIHRoZSBtb2R1bGUgaW5qZWN0b3Igc2hvdWxkIG5vdCBiZSBjaGVja2VkXG4gICAgICAvLyAgIChub3RGb3VuZFZhbHVlID09PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKVxuICAgICAgcmV0dXJuIHZhbHVlIGFzIFQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucGFyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21wb25lbnRGYWN0b3J5IGludGVyZmFjZSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8VD4gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICBvdmVycmlkZSBzZWxlY3Rvcjogc3RyaW5nO1xuICBvdmVycmlkZSBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIG92ZXJyaWRlIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG4gIGlzQm91bmRUb01vZHVsZTogYm9vbGVhbjtcblxuICBvdmVycmlkZSBnZXQgaW5wdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLmlucHV0cyk7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgb3V0cHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5vdXRwdXRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gY29tcG9uZW50RGVmIFRoZSBjb21wb25lbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIG5nTW9kdWxlIFRoZSBOZ01vZHVsZVJlZiB0byB3aGljaCB0aGUgZmFjdG9yeSBpcyBib3VuZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55PiwgcHJpdmF0ZSBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudERlZi50eXBlO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBzdHJpbmdpZnlDU1NTZWxlY3Rvckxpc3QoY29tcG9uZW50RGVmLnNlbGVjdG9ycyk7XG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPVxuICAgICAgICBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzID8gY29tcG9uZW50RGVmLm5nQ29udGVudFNlbGVjdG9ycyA6IFtdO1xuICAgIHRoaXMuaXNCb3VuZFRvTW9kdWxlID0gISFuZ01vZHVsZTtcbiAgfVxuXG4gIG92ZXJyaWRlIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLCByb290U2VsZWN0b3JPck5vZGU/OiBhbnksXG4gICAgICBlbnZpcm9ubWVudEluamVjdG9yPzogTmdNb2R1bGVSZWY8YW55PnxFbnZpcm9ubWVudEluamVjdG9yfFxuICAgICAgdW5kZWZpbmVkKTogQWJzdHJhY3RDb21wb25lbnRSZWY8VD4ge1xuICAgIGVudmlyb25tZW50SW5qZWN0b3IgPSBlbnZpcm9ubWVudEluamVjdG9yIHx8IHRoaXMubmdNb2R1bGU7XG5cbiAgICBsZXQgcmVhbEVudmlyb25tZW50SW5qZWN0b3IgPSBlbnZpcm9ubWVudEluamVjdG9yIGluc3RhbmNlb2YgRW52aXJvbm1lbnRJbmplY3RvciA/XG4gICAgICAgIGVudmlyb25tZW50SW5qZWN0b3IgOlxuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yPy5pbmplY3RvcjtcblxuICAgIGlmIChyZWFsRW52aXJvbm1lbnRJbmplY3RvciAmJiB0aGlzLmNvbXBvbmVudERlZi5nZXRTdGFuZGFsb25lSW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJlYWxFbnZpcm9ubWVudEluamVjdG9yID0gdGhpcy5jb21wb25lbnREZWYuZ2V0U3RhbmRhbG9uZUluamVjdG9yKHJlYWxFbnZpcm9ubWVudEluamVjdG9yKSB8fFxuICAgICAgICAgIHJlYWxFbnZpcm9ubWVudEluamVjdG9yO1xuICAgIH1cblxuICAgIGNvbnN0IHJvb3RWaWV3SW5qZWN0b3IgPVxuICAgICAgICByZWFsRW52aXJvbm1lbnRJbmplY3RvciA/IG5ldyBDaGFpbmVkSW5qZWN0b3IoaW5qZWN0b3IsIHJlYWxFbnZpcm9ubWVudEluamVjdG9yKSA6IGluamVjdG9yO1xuXG4gICAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MiwgbnVsbCk7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFTkRFUkVSX05PVF9GT1VORCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgJ0FuZ3VsYXIgd2FzIG5vdCBhYmxlIHRvIGluamVjdCBhIHJlbmRlcmVyIChSZW5kZXJlckZhY3RvcnkyKS4gJyArXG4gICAgICAgICAgICAgICAgICAnTGlrZWx5IHRoaXMgaXMgZHVlIHRvIGEgYnJva2VuIERJIGhpZXJhcmNoeS4gJyArXG4gICAgICAgICAgICAgICAgICAnTWFrZSBzdXJlIHRoYXQgYW55IGluamVjdG9yIHVzZWQgdG8gY3JlYXRlIHRoaXMgY29tcG9uZW50IGhhcyBhIGNvcnJlY3QgcGFyZW50LicpO1xuICAgIH1cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSByb290Vmlld0luamVjdG9yLmdldChTYW5pdGl6ZXIsIG51bGwpO1xuXG4gICAgY29uc3QgaG9zdFJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIHRoaXMuY29tcG9uZW50RGVmKTtcbiAgICAvLyBEZXRlcm1pbmUgYSB0YWcgbmFtZSB1c2VkIGZvciBjcmVhdGluZyBob3N0IGVsZW1lbnRzIHdoZW4gdGhpcyBjb21wb25lbnQgaXMgY3JlYXRlZFxuICAgIC8vIGR5bmFtaWNhbGx5LiBEZWZhdWx0IHRvICdkaXYnIGlmIHRoaXMgY29tcG9uZW50IGRpZCBub3Qgc3BlY2lmeSBhbnkgdGFnIG5hbWUgaW4gaXRzIHNlbGVjdG9yLlxuICAgIGNvbnN0IGVsZW1lbnROYW1lID0gdGhpcy5jb21wb25lbnREZWYuc2VsZWN0b3JzWzBdWzBdIGFzIHN0cmluZyB8fCAnZGl2JztcbiAgICBjb25zdCBob3N0Uk5vZGUgPSByb290U2VsZWN0b3JPck5vZGUgP1xuICAgICAgICBsb2NhdGVIb3N0RWxlbWVudChob3N0UmVuZGVyZXIsIHJvb3RTZWxlY3Rvck9yTm9kZSwgdGhpcy5jb21wb25lbnREZWYuZW5jYXBzdWxhdGlvbikgOlxuICAgICAgICBjcmVhdGVFbGVtZW50Tm9kZShcbiAgICAgICAgICAgIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZiksIGVsZW1lbnROYW1lLFxuICAgICAgICAgICAgZ2V0TmFtZXNwYWNlKGVsZW1lbnROYW1lKSk7XG5cbiAgICBjb25zdCByb290RmxhZ3MgPSB0aGlzLmNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLklzUm9vdDtcblxuICAgIC8vIENyZWF0ZSB0aGUgcm9vdCB2aWV3LiBVc2VzIGVtcHR5IFRWaWV3IGFuZCBDb250ZW50VGVtcGxhdGUuXG4gICAgY29uc3Qgcm9vdFRWaWV3ID0gY3JlYXRlVFZpZXcoVFZpZXdUeXBlLlJvb3QsIG51bGwsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIGNvbnN0IHJvb3RMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBudWxsLCByb290VFZpZXcsIG51bGwsIHJvb3RGbGFncywgbnVsbCwgbnVsbCwgcmVuZGVyZXJGYWN0b3J5LCBob3N0UmVuZGVyZXIsIHNhbml0aXplcixcbiAgICAgICAgcm9vdFZpZXdJbmplY3RvciwgbnVsbCk7XG5cbiAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgIC8vIFRPRE8obWlza28pOiBpdCBsb29rcyBsaWtlIHdlIGFyZSBlbnRlcmluZyB2aWV3IGhlcmUgYnV0IHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGFzXG4gICAgLy8gYHJlbmRlclZpZXdgIGRvZXMgdGhhdC4gSG93ZXZlciBhcyB0aGUgY29kZSBpcyB3cml0dGVuIGl0IGlzIG5lZWRlZCBiZWNhdXNlXG4gICAgLy8gYGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3YCBhbmQgYGNyZWF0ZVJvb3RDb21wb25lbnRgIGJvdGggcmVhZCBnbG9iYWwgc3RhdGUuIEZpeGluZyB0aG9zZVxuICAgIC8vIGlzc3VlcyB3b3VsZCBhbGxvdyB1cyB0byBkcm9wIHRoaXMuXG4gICAgZW50ZXJWaWV3KHJvb3RMVmlldyk7XG5cbiAgICBsZXQgY29tcG9uZW50OiBUO1xuICAgIGxldCB0RWxlbWVudE5vZGU6IFRFbGVtZW50Tm9kZTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByb290RGlyZWN0aXZlcyA9IFt0aGlzLmNvbXBvbmVudERlZl07XG4gICAgICBjb25zdCBob3N0VE5vZGUgPSBjcmVhdGVSb290Q29tcG9uZW50VE5vZGUocm9vdExWaWV3LCBob3N0Uk5vZGUpO1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgICAgICAgIGhvc3RUTm9kZSwgaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZiwgcm9vdERpcmVjdGl2ZXMsIHJvb3RMVmlldywgcmVuZGVyZXJGYWN0b3J5LFxuICAgICAgICAgIGhvc3RSZW5kZXJlcik7XG5cbiAgICAgIHRFbGVtZW50Tm9kZSA9IGdldFROb2RlKHJvb3RUVmlldywgSEVBREVSX09GRlNFVCkgYXMgVEVsZW1lbnROb2RlO1xuXG4gICAgICAvLyBUT0RPKGNyaXNiZXRvKTogaW4gcHJhY3RpY2UgYGhvc3RSTm9kZWAgc2hvdWxkIGFsd2F5cyBiZSBkZWZpbmVkLCBidXQgdGhlcmUgYXJlIHNvbWUgdGVzdHNcbiAgICAgIC8vIHdoZXJlIHRoZSByZW5kZXJlciBpcyBtb2NrZWQgb3V0IGFuZCBgdW5kZWZpbmVkYCBpcyByZXR1cm5lZC4gV2Ugc2hvdWxkIHVwZGF0ZSB0aGUgdGVzdHMgc29cbiAgICAgIC8vIHRoYXQgdGhpcyBjaGVjayBjYW4gYmUgcmVtb3ZlZC5cbiAgICAgIGlmIChob3N0Uk5vZGUpIHtcbiAgICAgICAgc2V0Um9vdE5vZGVBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgdGhpcy5jb21wb25lbnREZWYsIGhvc3RSTm9kZSwgcm9vdFNlbGVjdG9yT3JOb2RlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb2plY3RhYmxlTm9kZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm9qZWN0Tm9kZXModEVsZW1lbnROb2RlLCB0aGlzLm5nQ29udGVudFNlbGVjdG9ycywgcHJvamVjdGFibGVOb2Rlcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsIHRoaXMuY29tcG9uZW50RGVmLCByb290RGlyZWN0aXZlcywgcm9vdExWaWV3LCBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG4gICAgICByZW5kZXJWaWV3KHJvb3RUVmlldywgcm9vdExWaWV3LCBudWxsKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgbGVhdmVWaWV3KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRSZWYoXG4gICAgICAgIHRoaXMuY29tcG9uZW50VHlwZSwgY29tcG9uZW50LCBjcmVhdGVFbGVtZW50UmVmKHRFbGVtZW50Tm9kZSwgcm9vdExWaWV3KSwgcm9vdExWaWV3LFxuICAgICAgICB0RWxlbWVudE5vZGUpO1xuICB9XG59XG5cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGVcbiAqIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlclxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTogQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnQgY3JlYXRlZCB2aWEgYSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0uXG4gKlxuICogYENvbXBvbmVudFJlZmAgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBDb21wb25lbnQgSW5zdGFuY2UgYXMgd2VsbCBvdGhlciBvYmplY3RzIHJlbGF0ZWQgdG8gdGhpc1xuICogQ29tcG9uZW50IEluc3RhbmNlIGFuZCBhbGxvd3MgeW91IHRvIGRlc3Ryb3kgdGhlIENvbXBvbmVudCBJbnN0YW5jZSB2aWEgdGhlIHtAbGluayAjZGVzdHJveX1cbiAqIG1ldGhvZC5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWY8VD4gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudFJlZjxUPiB7XG4gIG92ZXJyaWRlIGluc3RhbmNlOiBUO1xuICBvdmVycmlkZSBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgb3ZlcnJpZGUgY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmO1xuICBvdmVycmlkZSBjb21wb25lbnRUeXBlOiBUeXBlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29tcG9uZW50VHlwZTogVHlwZTxUPiwgaW5zdGFuY2U6IFQsIHB1YmxpYyBsb2NhdGlvbjogRWxlbWVudFJlZiwgcHJpdmF0ZSBfcm9vdExWaWV3OiBMVmlldyxcbiAgICAgIHByaXZhdGUgX3ROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgdGhpcy5ob3N0VmlldyA9IHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgUm9vdFZpZXdSZWY8VD4oX3Jvb3RMVmlldyk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldElucHV0KG5hbWU6IHN0cmluZywgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgICBjb25zdCBpbnB1dERhdGEgPSB0aGlzLl90Tm9kZS5pbnB1dHM7XG4gICAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgICBpZiAoaW5wdXREYXRhICE9PSBudWxsICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbbmFtZV0pKSB7XG4gICAgICBjb25zdCBsVmlldyA9IHRoaXMuX3Jvb3RMVmlldztcbiAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3W1RWSUVXXSwgbFZpZXcsIGRhdGFWYWx1ZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgbWFya0RpcnR5SWZPblB1c2gobFZpZXcsIHRoaXMuX3ROb2RlLmluZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBjbXBOYW1lRm9yRXJyb3IgPSBzdHJpbmdpZnlGb3JFcnJvcih0aGlzLmNvbXBvbmVudFR5cGUpO1xuICAgICAgICBsZXQgbWVzc2FnZSA9XG4gICAgICAgICAgICBgQ2FuJ3Qgc2V0IHZhbHVlIG9mIHRoZSAnJHtuYW1lfScgaW5wdXQgb24gdGhlICcke2NtcE5hbWVGb3JFcnJvcn0nIGNvbXBvbmVudC4gYDtcbiAgICAgICAgbWVzc2FnZSArPSBgTWFrZSBzdXJlIHRoYXQgdGhlICcke1xuICAgICAgICAgICAgbmFtZX0nIHByb3BlcnR5IGlzIGFubm90YXRlZCB3aXRoIEBJbnB1dCgpIG9yIGEgbWFwcGVkIEBJbnB1dCgnJHtuYW1lfScpIGV4aXN0cy5gO1xuICAgICAgICByZXBvcnRVbmtub3duUHJvcGVydHlFcnJvcihtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX3ROb2RlLCB0aGlzLl9yb290TFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmhvc3RWaWV3LmRlc3Ryb3koKTtcbiAgfVxuXG4gIG92ZXJyaWRlIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdFZpZXcub25EZXN0cm95KGNhbGxiYWNrKTtcbiAgfVxufVxuXG4vKiogUmVwcmVzZW50cyBhIEhvc3RGZWF0dXJlIGZ1bmN0aW9uLiAqL1xudHlwZSBIb3N0RmVhdHVyZSA9ICg8VD4oY29tcG9uZW50OiBULCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPikgPT4gdm9pZCk7XG5cbi8vIFRPRE86IEEgaGFjayB0byBub3QgcHVsbCBpbiB0aGUgTnVsbEluamVjdG9yIGZyb20gQGFuZ3VsYXIvY29yZS5cbmV4cG9ydCBjb25zdCBOVUxMX0lOSkVDVE9SOiBJbmplY3RvciA9IHtcbiAgZ2V0OiAodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSkgPT4ge1xuICAgIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yKHRva2VuLCAnTnVsbEluamVjdG9yJyk7XG4gIH1cbn07XG5cbi8qKiBDcmVhdGVzIGEgVE5vZGUgdGhhdCBjYW4gYmUgdXNlZCB0byBpbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudFROb2RlKGxWaWV3OiBMVmlldywgck5vZGU6IFJOb2RlKTogVEVsZW1lbnROb2RlIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGluZGV4ID0gSEVBREVSX09GRlNFVDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICBsVmlld1tpbmRleF0gPSByTm9kZTtcblxuICAvLyAnI2hvc3QnIGlzIGFkZGVkIGhlcmUgYXMgd2UgZG9uJ3Qga25vdyB0aGUgcmVhbCBob3N0IERPTSBuYW1lICh3ZSBkb24ndCB3YW50IHRvIHJlYWQgaXQpIGFuZCBhdFxuICAvLyB0aGUgc2FtZSB0aW1lIHdlIHdhbnQgdG8gY29tbXVuaWNhdGUgdGhlIGRlYnVnIGBUTm9kZWAgdGhhdCB0aGlzIGlzIGEgc3BlY2lhbCBgVE5vZGVgXG4gIC8vIHJlcHJlc2VudGluZyBhIGhvc3QgZWxlbWVudC5cbiAgcmV0dXJuIGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgJyNob3N0JywgbnVsbCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgcm9vdCBjb21wb25lbnQgdmlldyBhbmQgdGhlIHJvb3QgY29tcG9uZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gcm9vdENvbXBvbmVudERlZiBDb21wb25lbnREZWZcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcGFyZW50IHZpZXcgd2hlcmUgdGhlIGhvc3Qgbm9kZSBpcyBzdG9yZWRcbiAqIEBwYXJhbSByZW5kZXJlckZhY3RvcnkgRmFjdG9yeSB0byBiZSB1c2VkIGZvciBjcmVhdGluZyBjaGlsZCByZW5kZXJlcnMuXG4gKiBAcGFyYW0gaG9zdFJlbmRlcmVyIFRoZSBjdXJyZW50IHJlbmRlcmVyXG4gKiBAcGFyYW0gc2FuaXRpemVyIFRoZSBzYW5pdGl6ZXIsIGlmIHByb3ZpZGVkXG4gKlxuICogQHJldHVybnMgQ29tcG9uZW50IHZpZXcgY3JlYXRlZFxuICovXG5mdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50VmlldyhcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlLCByTm9kZTogUkVsZW1lbnR8bnVsbCwgcm9vdENvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4sXG4gICAgcm9vdERpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10sIHJvb3RWaWV3OiBMVmlldywgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnksXG4gICAgaG9zdFJlbmRlcmVyOiBSZW5kZXJlciwgc2FuaXRpemVyPzogU2FuaXRpemVyfG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IHRWaWV3ID0gcm9vdFZpZXdbVFZJRVddO1xuICBhcHBseVJvb3RDb21wb25lbnRTdHlsaW5nKHJvb3REaXJlY3RpdmVzLCB0Tm9kZSwgck5vZGUsIGhvc3RSZW5kZXJlcik7XG5cbiAgY29uc3Qgdmlld1JlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKHJOb2RlLCByb290Q29tcG9uZW50RGVmKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgcm9vdFZpZXcsIGdldE9yQ3JlYXRlQ29tcG9uZW50VFZpZXcocm9vdENvbXBvbmVudERlZiksIG51bGwsXG4gICAgICByb290Q29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCByb290Vmlld1t0Tm9kZS5pbmRleF0sXG4gICAgICB0Tm9kZSwgcmVuZGVyZXJGYWN0b3J5LCB2aWV3UmVuZGVyZXIsIHNhbml0aXplciB8fCBudWxsLCBudWxsLCBudWxsKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZGlQdWJsaWNJbkluamVjdG9yKFxuICAgICAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIHJvb3RWaWV3KSwgdFZpZXcsIHJvb3RDb21wb25lbnREZWYudHlwZSk7XG4gICAgbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldywgdE5vZGUsIDApO1xuICB9XG5cbiAgYWRkVG9WaWV3VHJlZShyb290VmlldywgY29tcG9uZW50Vmlldyk7XG5cbiAgLy8gU3RvcmUgY29tcG9uZW50IHZpZXcgYXQgbm9kZSBpbmRleCwgd2l0aCBub2RlIGFzIHRoZSBIT1NUXG4gIHJldHVybiByb290Vmlld1t0Tm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3O1xufVxuXG4vKiogU2V0cyB1cCB0aGUgc3R5bGluZyBpbmZvcm1hdGlvbiBvbiBhIHJvb3QgY29tcG9uZW50LiAqL1xuZnVuY3Rpb24gYXBwbHlSb290Q29tcG9uZW50U3R5bGluZyhcbiAgICByb290RGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPGFueT5bXSwgdE5vZGU6IFRFbGVtZW50Tm9kZSwgck5vZGU6IFJFbGVtZW50fG51bGwsXG4gICAgaG9zdFJlbmRlcmVyOiBSZW5kZXJlcik6IHZvaWQge1xuICBmb3IgKGNvbnN0IGRlZiBvZiByb290RGlyZWN0aXZlcykge1xuICAgIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIGRlZi5ob3N0QXR0cnMpO1xuICB9XG5cbiAgaWYgKHROb2RlLm1lcmdlZEF0dHJzICE9PSBudWxsKSB7XG4gICAgY29tcHV0ZVN0YXRpY1N0eWxpbmcodE5vZGUsIHROb2RlLm1lcmdlZEF0dHJzLCB0cnVlKTtcblxuICAgIGlmIChyTm9kZSAhPT0gbnVsbCkge1xuICAgICAgc2V0dXBTdGF0aWNBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgck5vZGUsIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgcm9vdCBjb21wb25lbnQgYW5kIHNldHMgaXQgdXAgd2l0aCBmZWF0dXJlcyBhbmQgaG9zdCBiaW5kaW5ncy5TaGFyZWQgYnlcbiAqIHJlbmRlckNvbXBvbmVudCgpIGFuZCBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudCgpLlxuICovXG5mdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFZpZXc6IExWaWV3LCByb290Q29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4sIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLFxuICAgIHJvb3RMVmlldzogTFZpZXcsIGhvc3RGZWF0dXJlczogSG9zdEZlYXR1cmVbXXxudWxsKTogYW55IHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChyb290VE5vZGUsICd0Tm9kZSBzaG91bGQgaGF2ZSBiZWVuIGFscmVhZHkgY3JlYXRlZCcpO1xuICBjb25zdCB0VmlldyA9IHJvb3RMVmlld1tUVklFV107XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocm9vdFROb2RlLCByb290TFZpZXcpO1xuXG4gIGluaXRpYWxpemVEaXJlY3RpdmVzKHRWaWV3LCByb290TFZpZXcsIHJvb3RUTm9kZSwgcm9vdERpcmVjdGl2ZXMsIG51bGwpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdERpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IHJvb3RUTm9kZS5kaXJlY3RpdmVTdGFydCArIGk7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5zdGFuY2UgPSBnZXROb2RlSW5qZWN0YWJsZShyb290TFZpZXcsIHRWaWV3LCBkaXJlY3RpdmVJbmRleCwgcm9vdFROb2RlKTtcbiAgICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlSW5zdGFuY2UsIHJvb3RMVmlldyk7XG4gIH1cblxuICBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3LCByb290TFZpZXcsIHJvb3RUTm9kZSk7XG5cbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHJvb3RMVmlldyk7XG4gIH1cblxuICAvLyBXZSdyZSBndWFyYW50ZWVkIGZvciB0aGUgYGNvbXBvbmVudE9mZnNldGAgdG8gYmUgcG9zaXRpdmUgaGVyZVxuICAvLyBzaW5jZSBhIHJvb3QgY29tcG9uZW50IGFsd2F5cyBtYXRjaGVzIGEgY29tcG9uZW50IGRlZi5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbihyb290VE5vZGUuY29tcG9uZW50T2Zmc2V0LCAtMSwgJ2NvbXBvbmVudE9mZnNldCBtdXN0IGJlIGdyZWF0IHRoYW4gLTEnKTtcbiAgY29uc3QgY29tcG9uZW50ID0gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgICByb290TFZpZXcsIHRWaWV3LCByb290VE5vZGUuZGlyZWN0aXZlU3RhcnQgKyByb290VE5vZGUuY29tcG9uZW50T2Zmc2V0LCByb290VE5vZGUpO1xuICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gcm9vdExWaWV3W0NPTlRFWFRdID0gY29tcG9uZW50O1xuXG4gIGlmIChob3N0RmVhdHVyZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgaG9zdEZlYXR1cmVzKSB7XG4gICAgICBmZWF0dXJlKGNvbXBvbmVudCwgcm9vdENvbXBvbmVudERlZik7XG4gICAgfVxuICB9XG5cbiAgLy8gV2Ugd2FudCB0byBnZW5lcmF0ZSBhbiBlbXB0eSBRdWVyeUxpc3QgZm9yIHJvb3QgY29udGVudCBxdWVyaWVzIGZvciBiYWNrd2FyZHNcbiAgLy8gY29tcGF0aWJpbGl0eSB3aXRoIFZpZXdFbmdpbmUuXG4gIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0Vmlldywgcm9vdFROb2RlLCBjb21wb25lbnRWaWV3KTtcblxuICByZXR1cm4gY29tcG9uZW50O1xufVxuXG4vKiogU2V0cyB0aGUgc3RhdGljIGF0dHJpYnV0ZXMgb24gYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIHNldFJvb3ROb2RlQXR0cmlidXRlcyhcbiAgICBob3N0UmVuZGVyZXI6IFJlbmRlcmVyMiwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8dW5rbm93bj4sIGhvc3RSTm9kZTogUkVsZW1lbnQsXG4gICAgcm9vdFNlbGVjdG9yT3JOb2RlOiBhbnkpIHtcbiAgaWYgKHJvb3RTZWxlY3Rvck9yTm9kZSkge1xuICAgIHNldFVwQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgWyduZy12ZXJzaW9uJywgVkVSU0lPTi5mdWxsXSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWYgaG9zdCBlbGVtZW50IGlzIGNyZWF0ZWQgYXMgYSBwYXJ0IG9mIHRoaXMgZnVuY3Rpb24gY2FsbCAoaS5lLiBgcm9vdFNlbGVjdG9yT3JOb2RlYFxuICAgIC8vIGlzIG5vdCBkZWZpbmVkKSwgYWxzbyBhcHBseSBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGV4dHJhY3RlZCBmcm9tIGNvbXBvbmVudCBzZWxlY3Rvci5cbiAgICAvLyBFeHRyYWN0IGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgZnJvbSB0aGUgZmlyc3Qgc2VsZWN0b3Igb25seSB0byBtYXRjaCBWRSBiZWhhdmlvci5cbiAgICBjb25zdCB7YXR0cnMsIGNsYXNzZXN9ID0gZXh0cmFjdEF0dHJzQW5kQ2xhc3Nlc0Zyb21TZWxlY3Rvcihjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdKTtcbiAgICBpZiAoYXR0cnMpIHtcbiAgICAgIHNldFVwQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgYXR0cnMpO1xuICAgIH1cbiAgICBpZiAoY2xhc3NlcyAmJiBjbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIHdyaXRlRGlyZWN0Q2xhc3MoaG9zdFJlbmRlcmVyLCBob3N0Uk5vZGUsIGNsYXNzZXMuam9pbignICcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFByb2plY3RzIHRoZSBgcHJvamVjdGFibGVOb2Rlc2AgdGhhdCB3ZXJlIHNwZWNpZmllZCB3aGVuIGNyZWF0aW5nIGEgcm9vdCBjb21wb25lbnQuICovXG5mdW5jdGlvbiBwcm9qZWN0Tm9kZXMoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSwgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXSwgcHJvamVjdGFibGVOb2RlczogYW55W11bXSkge1xuICBjb25zdCBwcm9qZWN0aW9uOiAoVE5vZGV8Uk5vZGVbXXxudWxsKVtdID0gdE5vZGUucHJvamVjdGlvbiA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5nQ29udGVudFNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVzZm9yU2xvdCA9IHByb2plY3RhYmxlTm9kZXNbaV07XG4gICAgLy8gUHJvamVjdGFibGUgbm9kZXMgY2FuIGJlIHBhc3NlZCBhcyBhcnJheSBvZiBhcnJheXMgb3IgYW4gYXJyYXkgb2YgaXRlcmFibGVzIChuZ1VwZ3JhZGVcbiAgICAvLyBjYXNlKS4gSGVyZSB3ZSBkbyBub3JtYWxpemUgcGFzc2VkIGRhdGEgc3RydWN0dXJlIHRvIGJlIGFuIGFycmF5IG9mIGFycmF5cyB0byBhdm9pZFxuICAgIC8vIGNvbXBsZXggY2hlY2tzIGRvd24gdGhlIGxpbmUuXG4gICAgLy8gV2UgYWxzbyBub3JtYWxpemUgdGhlIGxlbmd0aCBvZiB0aGUgcGFzc2VkIGluIHByb2plY3RhYmxlIG5vZGVzICh0byBtYXRjaCB0aGUgbnVtYmVyIG9mXG4gICAgLy8gPG5nLWNvbnRhaW5lcj4gc2xvdHMgZGVmaW5lZCBieSBhIGNvbXBvbmVudCkuXG4gICAgcHJvamVjdGlvbi5wdXNoKG5vZGVzZm9yU2xvdCAhPSBudWxsID8gQXJyYXkuZnJvbShub2Rlc2ZvclNsb3QpIDogbnVsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIGVuYWJsZSBsaWZlY3ljbGUgaG9va3Mgb24gdGhlIHJvb3QgY29tcG9uZW50LlxuICpcbiAqIEluY2x1ZGUgdGhpcyBmZWF0dXJlIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBpZiB0aGUgcm9vdCBjb21wb25lbnRcbiAqIHlvdSBhcmUgcmVuZGVyaW5nIGhhcyBsaWZlY3ljbGUgaG9va3MgZGVmaW5lZC4gT3RoZXJ3aXNlLCB0aGUgaG9va3Mgd29uJ3RcbiAqIGJlIGNhbGxlZCBwcm9wZXJseS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogcmVuZGVyQ29tcG9uZW50KEFwcENvbXBvbmVudCwge2hvc3RGZWF0dXJlczogW0xpZmVjeWNsZUhvb2tzRmVhdHVyZV19KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKCk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdUTm9kZSBpcyByZXF1aXJlZCcpO1xuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKGdldExWaWV3KClbVFZJRVddLCB0Tm9kZSk7XG59XG4iXX0=