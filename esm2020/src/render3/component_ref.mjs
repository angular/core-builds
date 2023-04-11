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
import { getNodeInjectable, NodeInjector } from './di';
import { throwProviderNotFoundError } from './errors_di';
import { registerPostOrderHooks } from './hooks';
import { reportUnknownPropertyError } from './instructions/element_validation';
import { addToViewTree, createLView, createTView, executeContentQueries, getOrCreateComponentTView, getOrCreateTNode, initializeDirectives, invokeDirectivesHostBindings, locateHostElement, markAsComponentHost, markViewDirty, renderView, setInputsForProperty } from './instructions/shared';
import { CONTEXT, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
import { createElementNode, setupStaticAttributes, writeDirectClass } from './node_manipulation';
import { extractAttrsAndClassesFromSelector, stringifyCSSSelectorList } from './node_selector_matcher';
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
        const hostRenderer = rendererFactory.createRenderer(null, this.componentDef);
        // Determine a tag name used for creating host elements when this component is created
        // dynamically. Default to 'div' if this component did not specify any tag name in its selector.
        const elementName = this.componentDef.selectors[0][0] || 'div';
        const hostRNode = rootSelectorOrNode ?
            locateHostElement(hostRenderer, rootSelectorOrNode, this.componentDef.encapsulation) :
            createElementNode(hostRenderer, elementName, getNamespace(elementName));
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
            const componentView = createRootComponentView(hostTNode, hostRNode, rootComponentDef, rootDirectives, rootLView, rendererFactory, hostRenderer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUcvRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUV6RCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksd0JBQXdCLEVBQUUsWUFBWSxJQUFJLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDL0gsT0FBTyxFQUFDLHdCQUF3QixJQUFJLGdDQUFnQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLGdCQUFnQixFQUFhLE1BQU0sdUJBQXVCLENBQUM7QUFFbkUsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEYsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUMscUNBQXFDLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUU3RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FB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LENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDekU7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQyxNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3ZELHNCQUFzQixDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Y29udmVydFRvQml0RmxhZ3N9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0T3B0aW9uc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7UHJvdmlkZXJUb2tlbn0gZnJvbSAnLi4vZGkvcHJvdmlkZXJfdG9rZW4nO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIEFic3RyYWN0Q29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIEVsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0SW5kZXhJblJhbmdlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge1ZFUlNJT059IGZyb20gJy4uL3ZlcnNpb24nO1xuaW1wb3J0IHtOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SfSBmcm9tICcuLi92aWV3L3Byb3ZpZGVyX2ZsYWdzJztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0Tm9kZUluamVjdGFibGUsIE5vZGVJbmplY3Rvcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3Rocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yfSBmcm9tICcuL2Vycm9yc19kaSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtyZXBvcnRVbmtub3duUHJvcGVydHlFcnJvcn0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlTFZpZXcsIGNyZWF0ZVRWaWV3LCBleGVjdXRlQ29udGVudFF1ZXJpZXMsIGdldE9yQ3JlYXRlQ29tcG9uZW50VFZpZXcsIGdldE9yQ3JlYXRlVE5vZGUsIGluaXRpYWxpemVEaXJlY3RpdmVzLCBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzLCBsb2NhdGVIb3N0RWxlbWVudCwgbWFya0FzQ29tcG9uZW50SG9zdCwgbWFya1ZpZXdEaXJ0eSwgcmVuZGVyVmlldywgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmLCBIb3N0RGlyZWN0aXZlRGVmc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzVmFsdWUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSZW5kZXJlciwgUmVuZGVyZXJGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtDT05URVhULCBIRUFERVJfT0ZGU0VULCBMVmlldywgTFZpZXdGbGFncywgVFZJRVcsIFRWaWV3VHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtNQVRIX01MX05BTUVTUEFDRSwgU1ZHX05BTUVTUEFDRX0gZnJvbSAnLi9uYW1lc3BhY2VzJztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudE5vZGUsIHNldHVwU3RhdGljQXR0cmlidXRlcywgd3JpdGVEaXJlY3RDbGFzc30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2V4dHJhY3RBdHRyc0FuZENsYXNzZXNGcm9tU2VsZWN0b3IsIHN0cmluZ2lmeUNTU1NlbGVjdG9yTGlzdH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGxlYXZlVmlld30gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2NvbXB1dGVTdGF0aWNTdHlsaW5nfSBmcm9tICcuL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcnO1xuaW1wb3J0IHttZXJnZUhvc3RBdHRycywgc2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Um9vdFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICAvKipcbiAgICogQHBhcmFtIG5nTW9kdWxlIFRoZSBOZ01vZHVsZVJlZiB0byB3aGljaCBhbGwgcmVzb2x2ZWQgZmFjdG9yaWVzIGFyZSBib3VuZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbmdNb2R1bGU/OiBOZ01vZHVsZVJlZjxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHJlc29sdmVDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IEFic3RyYWN0Q29tcG9uZW50RmFjdG9yeTxUPiB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50KTtcbiAgICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29tcG9uZW50KSE7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy5uZ01vZHVsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBnZXROYW1lc3BhY2UoZWxlbWVudE5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgbmFtZSA9IGVsZW1lbnROYW1lLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBuYW1lID09PSAnc3ZnJyA/IFNWR19OQU1FU1BBQ0UgOiAobmFtZSA9PT0gJ21hdGgnID8gTUFUSF9NTF9OQU1FU1BBQ0UgOiBudWxsKTtcbn1cblxuLyoqXG4gKiBJbmplY3RvciB0aGF0IGxvb2tzIHVwIGEgdmFsdWUgdXNpbmcgYSBzcGVjaWZpYyBpbmplY3RvciwgYmVmb3JlIGZhbGxpbmcgYmFjayB0byB0aGUgbW9kdWxlXG4gKiBpbmplY3Rvci4gVXNlZCBwcmltYXJpbHkgd2hlbiBjcmVhdGluZyBjb21wb25lbnRzIG9yIGVtYmVkZGVkIHZpZXdzIGR5bmFtaWNhbGx5LlxuICovXG5jbGFzcyBDaGFpbmVkSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yLCBwcml2YXRlIHBhcmVudEluamVjdG9yOiBJbmplY3Rvcikge31cblxuICBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzfEluamVjdE9wdGlvbnMpOiBUIHtcbiAgICBmbGFncyA9IGNvbnZlcnRUb0JpdEZsYWdzKGZsYWdzKTtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuaW5qZWN0b3IuZ2V0PFR8dHlwZW9mIE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1I+KFxuICAgICAgICB0b2tlbiwgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiwgZmxhZ3MpO1xuXG4gICAgaWYgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SIHx8XG4gICAgICAgIG5vdEZvdW5kVmFsdWUgPT09IChOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SIGFzIHVua25vd24gYXMgVCkpIHtcbiAgICAgIC8vIFJldHVybiB0aGUgdmFsdWUgZnJvbSB0aGUgcm9vdCBlbGVtZW50IGluamVjdG9yIHdoZW5cbiAgICAgIC8vIC0gaXQgcHJvdmlkZXMgaXRcbiAgICAgIC8vICAgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKVxuICAgICAgLy8gLSB0aGUgbW9kdWxlIGluamVjdG9yIHNob3VsZCBub3QgYmUgY2hlY2tlZFxuICAgICAgLy8gICAobm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUilcbiAgICAgIHJldHVybiB2YWx1ZSBhcyBUO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnBhcmVudEluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9XG59XG5cbi8qKlxuICogQ29tcG9uZW50RmFjdG9yeSBpbnRlcmZhY2UgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgb3ZlcnJpZGUgc2VsZWN0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGUgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBvdmVycmlkZSBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuICBpc0JvdW5kVG9Nb2R1bGU6IGJvb2xlYW47XG5cbiAgb3ZlcnJpZGUgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5pbnB1dHMpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cyk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGNvbXBvbmVudERlZiBUaGUgY29tcG9uZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggdGhlIGZhY3RvcnkgaXMgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4sIHByaXZhdGUgbmdNb2R1bGU/OiBOZ01vZHVsZVJlZjxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnREZWYudHlwZTtcbiAgICB0aGlzLnNlbGVjdG9yID0gc3RyaW5naWZ5Q1NTU2VsZWN0b3JMaXN0KGNvbXBvbmVudERlZi5zZWxlY3RvcnMpO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID1cbiAgICAgICAgY29tcG9uZW50RGVmLm5nQ29udGVudFNlbGVjdG9ycyA/IGNvbXBvbmVudERlZi5uZ0NvbnRlbnRTZWxlY3RvcnMgOiBbXTtcbiAgICB0aGlzLmlzQm91bmRUb01vZHVsZSA9ICEhbmdNb2R1bGU7XG4gIH1cblxuICBvdmVycmlkZSBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCwgcm9vdFNlbGVjdG9yT3JOb2RlPzogYW55LFxuICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj86IE5nTW9kdWxlUmVmPGFueT58RW52aXJvbm1lbnRJbmplY3RvcnxcbiAgICAgIHVuZGVmaW5lZCk6IEFic3RyYWN0Q29tcG9uZW50UmVmPFQ+IHtcbiAgICBlbnZpcm9ubWVudEluamVjdG9yID0gZW52aXJvbm1lbnRJbmplY3RvciB8fCB0aGlzLm5nTW9kdWxlO1xuXG4gICAgbGV0IHJlYWxFbnZpcm9ubWVudEluamVjdG9yID0gZW52aXJvbm1lbnRJbmplY3RvciBpbnN0YW5jZW9mIEVudmlyb25tZW50SW5qZWN0b3IgP1xuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yIDpcbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj8uaW5qZWN0b3I7XG5cbiAgICBpZiAocmVhbEVudmlyb25tZW50SW5qZWN0b3IgJiYgdGhpcy5jb21wb25lbnREZWYuZ2V0U3RhbmRhbG9uZUluamVjdG9yICE9PSBudWxsKSB7XG4gICAgICByZWFsRW52aXJvbm1lbnRJbmplY3RvciA9IHRoaXMuY29tcG9uZW50RGVmLmdldFN0YW5kYWxvbmVJbmplY3RvcihyZWFsRW52aXJvbm1lbnRJbmplY3RvcikgfHxcbiAgICAgICAgICByZWFsRW52aXJvbm1lbnRJbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCByb290Vmlld0luamVjdG9yID1cbiAgICAgICAgcmVhbEVudmlyb25tZW50SW5qZWN0b3IgPyBuZXcgQ2hhaW5lZEluamVjdG9yKGluamVjdG9yLCByZWFsRW52aXJvbm1lbnRJbmplY3RvcikgOiBpbmplY3RvcjtcblxuICAgIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIG51bGwpO1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SRU5ERVJFUl9OT1RfRk9VTkQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICdBbmd1bGFyIHdhcyBub3QgYWJsZSB0byBpbmplY3QgYSByZW5kZXJlciAoUmVuZGVyZXJGYWN0b3J5MikuICcgK1xuICAgICAgICAgICAgICAgICAgJ0xpa2VseSB0aGlzIGlzIGR1ZSB0byBhIGJyb2tlbiBESSBoaWVyYXJjaHkuICcgK1xuICAgICAgICAgICAgICAgICAgJ01ha2Ugc3VyZSB0aGF0IGFueSBpbmplY3RvciB1c2VkIHRvIGNyZWF0ZSB0aGlzIGNvbXBvbmVudCBoYXMgYSBjb3JyZWN0IHBhcmVudC4nKTtcbiAgICB9XG4gICAgY29uc3Qgc2FuaXRpemVyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoU2FuaXRpemVyLCBudWxsKTtcblxuICAgIGNvbnN0IGhvc3RSZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZik7XG4gICAgLy8gRGV0ZXJtaW5lIGEgdGFnIG5hbWUgdXNlZCBmb3IgY3JlYXRpbmcgaG9zdCBlbGVtZW50cyB3aGVuIHRoaXMgY29tcG9uZW50IGlzIGNyZWF0ZWRcbiAgICAvLyBkeW5hbWljYWxseS4gRGVmYXVsdCB0byAnZGl2JyBpZiB0aGlzIGNvbXBvbmVudCBkaWQgbm90IHNwZWNpZnkgYW55IHRhZyBuYW1lIGluIGl0cyBzZWxlY3Rvci5cbiAgICBjb25zdCBlbGVtZW50TmFtZSA9IHRoaXMuY29tcG9uZW50RGVmLnNlbGVjdG9yc1swXVswXSBhcyBzdHJpbmcgfHwgJ2Rpdic7XG4gICAgY29uc3QgaG9zdFJOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlID9cbiAgICAgICAgbG9jYXRlSG9zdEVsZW1lbnQoaG9zdFJlbmRlcmVyLCByb290U2VsZWN0b3JPck5vZGUsIHRoaXMuY29tcG9uZW50RGVmLmVuY2Fwc3VsYXRpb24pIDpcbiAgICAgICAgY3JlYXRlRWxlbWVudE5vZGUoaG9zdFJlbmRlcmVyLCBlbGVtZW50TmFtZSwgZ2V0TmFtZXNwYWNlKGVsZW1lbnROYW1lKSk7XG5cbiAgICBjb25zdCByb290RmxhZ3MgPSB0aGlzLmNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLklzUm9vdDtcblxuICAgIC8vIENyZWF0ZSB0aGUgcm9vdCB2aWV3LiBVc2VzIGVtcHR5IFRWaWV3IGFuZCBDb250ZW50VGVtcGxhdGUuXG4gICAgY29uc3Qgcm9vdFRWaWV3ID0gY3JlYXRlVFZpZXcoVFZpZXdUeXBlLlJvb3QsIG51bGwsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIGNvbnN0IHJvb3RMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBudWxsLCByb290VFZpZXcsIG51bGwsIHJvb3RGbGFncywgbnVsbCwgbnVsbCwgcmVuZGVyZXJGYWN0b3J5LCBob3N0UmVuZGVyZXIsIHNhbml0aXplcixcbiAgICAgICAgcm9vdFZpZXdJbmplY3RvciwgbnVsbCk7XG5cbiAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgIC8vIFRPRE8obWlza28pOiBpdCBsb29rcyBsaWtlIHdlIGFyZSBlbnRlcmluZyB2aWV3IGhlcmUgYnV0IHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGFzXG4gICAgLy8gYHJlbmRlclZpZXdgIGRvZXMgdGhhdC4gSG93ZXZlciBhcyB0aGUgY29kZSBpcyB3cml0dGVuIGl0IGlzIG5lZWRlZCBiZWNhdXNlXG4gICAgLy8gYGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3YCBhbmQgYGNyZWF0ZVJvb3RDb21wb25lbnRgIGJvdGggcmVhZCBnbG9iYWwgc3RhdGUuIEZpeGluZyB0aG9zZVxuICAgIC8vIGlzc3VlcyB3b3VsZCBhbGxvdyB1cyB0byBkcm9wIHRoaXMuXG4gICAgZW50ZXJWaWV3KHJvb3RMVmlldyk7XG5cbiAgICBsZXQgY29tcG9uZW50OiBUO1xuICAgIGxldCB0RWxlbWVudE5vZGU6IFRFbGVtZW50Tm9kZTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByb290Q29tcG9uZW50RGVmID0gdGhpcy5jb21wb25lbnREZWY7XG4gICAgICBsZXQgcm9vdERpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjx1bmtub3duPltdO1xuICAgICAgbGV0IGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmc3xudWxsID0gbnVsbDtcblxuICAgICAgaWYgKHJvb3RDb21wb25lbnREZWYuZmluZEhvc3REaXJlY3RpdmVEZWZzKSB7XG4gICAgICAgIHJvb3REaXJlY3RpdmVzID0gW107XG4gICAgICAgIGhvc3REaXJlY3RpdmVEZWZzID0gbmV3IE1hcCgpO1xuICAgICAgICByb290Q29tcG9uZW50RGVmLmZpbmRIb3N0RGlyZWN0aXZlRGVmcyhyb290Q29tcG9uZW50RGVmLCByb290RGlyZWN0aXZlcywgaG9zdERpcmVjdGl2ZURlZnMpO1xuICAgICAgICByb290RGlyZWN0aXZlcy5wdXNoKHJvb3RDb21wb25lbnREZWYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdERpcmVjdGl2ZXMgPSBbcm9vdENvbXBvbmVudERlZl07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGhvc3RUTm9kZSA9IGNyZWF0ZVJvb3RDb21wb25lbnRUTm9kZShyb290TFZpZXcsIGhvc3RSTm9kZSk7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgICAgaG9zdFROb2RlLCBob3N0Uk5vZGUsIHJvb3RDb21wb25lbnREZWYsIHJvb3REaXJlY3RpdmVzLCByb290TFZpZXcsIHJlbmRlcmVyRmFjdG9yeSxcbiAgICAgICAgICBob3N0UmVuZGVyZXIpO1xuXG4gICAgICB0RWxlbWVudE5vZGUgPSBnZXRUTm9kZShyb290VFZpZXcsIEhFQURFUl9PRkZTRVQpIGFzIFRFbGVtZW50Tm9kZTtcblxuICAgICAgLy8gVE9ETyhjcmlzYmV0byk6IGluIHByYWN0aWNlIGBob3N0Uk5vZGVgIHNob3VsZCBhbHdheXMgYmUgZGVmaW5lZCwgYnV0IHRoZXJlIGFyZSBzb21lIHRlc3RzXG4gICAgICAvLyB3aGVyZSB0aGUgcmVuZGVyZXIgaXMgbW9ja2VkIG91dCBhbmQgYHVuZGVmaW5lZGAgaXMgcmV0dXJuZWQuIFdlIHNob3VsZCB1cGRhdGUgdGhlIHRlc3RzIHNvXG4gICAgICAvLyB0aGF0IHRoaXMgY2hlY2sgY2FuIGJlIHJlbW92ZWQuXG4gICAgICBpZiAoaG9zdFJOb2RlKSB7XG4gICAgICAgIHNldFJvb3ROb2RlQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIHJvb3RDb21wb25lbnREZWYsIGhvc3RSTm9kZSwgcm9vdFNlbGVjdG9yT3JOb2RlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb2plY3RhYmxlTm9kZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm9qZWN0Tm9kZXModEVsZW1lbnROb2RlLCB0aGlzLm5nQ29udGVudFNlbGVjdG9ycywgcHJvamVjdGFibGVOb2Rlcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsIHJvb3RDb21wb25lbnREZWYsIHJvb3REaXJlY3RpdmVzLCBob3N0RGlyZWN0aXZlRGVmcywgcm9vdExWaWV3LFxuICAgICAgICAgIFtMaWZlY3ljbGVIb29rc0ZlYXR1cmVdKTtcbiAgICAgIHJlbmRlclZpZXcocm9vdFRWaWV3LCByb290TFZpZXcsIG51bGwpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBsZWF2ZVZpZXcoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IENvbXBvbmVudFJlZihcbiAgICAgICAgdGhpcy5jb21wb25lbnRUeXBlLCBjb21wb25lbnQsIGNyZWF0ZUVsZW1lbnRSZWYodEVsZW1lbnROb2RlLCByb290TFZpZXcpLCByb290TFZpZXcsXG4gICAgICAgIHRFbGVtZW50Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnRSZWY8VD4ge1xuICBvdmVycmlkZSBpbnN0YW5jZTogVDtcbiAgb3ZlcnJpZGUgaG9zdFZpZXc6IFZpZXdSZWY8VD47XG4gIG92ZXJyaWRlIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcbiAgb3ZlcnJpZGUgY29tcG9uZW50VHlwZTogVHlwZTxUPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbXBvbmVudFR5cGU6IFR5cGU8VD4sIGluc3RhbmNlOiBULCBwdWJsaWMgbG9jYXRpb246IEVsZW1lbnRSZWYsIHByaXZhdGUgX3Jvb3RMVmlldzogTFZpZXcsXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgIHRoaXMuaG9zdFZpZXcgPSB0aGlzLmNoYW5nZURldGVjdG9yUmVmID0gbmV3IFJvb3RWaWV3UmVmPFQ+KF9yb290TFZpZXcpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudFR5cGU7XG4gIH1cblxuICBvdmVycmlkZSBzZXRJbnB1dChuYW1lOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKTogdm9pZCB7XG4gICAgY29uc3QgaW5wdXREYXRhID0gdGhpcy5fdE5vZGUuaW5wdXRzO1xuICAgIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gICAgaWYgKGlucHV0RGF0YSAhPT0gbnVsbCAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW25hbWVdKSkge1xuICAgICAgY29uc3QgbFZpZXcgPSB0aGlzLl9yb290TFZpZXc7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlld1tUVklFV10sIGxWaWV3LCBkYXRhVmFsdWUsIG5hbWUsIHZhbHVlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodGhpcy5fdE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIG1hcmtWaWV3RGlydHkoY2hpbGRDb21wb25lbnRMVmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgY29uc3QgY21wTmFtZUZvckVycm9yID0gc3RyaW5naWZ5Rm9yRXJyb3IodGhpcy5jb21wb25lbnRUeXBlKTtcbiAgICAgICAgbGV0IG1lc3NhZ2UgPVxuICAgICAgICAgICAgYENhbid0IHNldCB2YWx1ZSBvZiB0aGUgJyR7bmFtZX0nIGlucHV0IG9uIHRoZSAnJHtjbXBOYW1lRm9yRXJyb3J9JyBjb21wb25lbnQuIGA7XG4gICAgICAgIG1lc3NhZ2UgKz0gYE1ha2Ugc3VyZSB0aGF0IHRoZSAnJHtcbiAgICAgICAgICAgIG5hbWV9JyBwcm9wZXJ0eSBpcyBhbm5vdGF0ZWQgd2l0aCBASW5wdXQoKSBvciBhIG1hcHBlZCBASW5wdXQoJyR7bmFtZX0nKSBleGlzdHMuYDtcbiAgICAgICAgcmVwb3J0VW5rbm93blByb3BlcnR5RXJyb3IobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl90Tm9kZSwgdGhpcy5fcm9vdExWaWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5ob3N0Vmlldy5kZXN0cm95KCk7XG4gIH1cblxuICBvdmVycmlkZSBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLmhvc3RWaWV3Lm9uRGVzdHJveShjYWxsYmFjayk7XG4gIH1cbn1cblxuLyoqIFJlcHJlc2VudHMgYSBIb3N0RmVhdHVyZSBmdW5jdGlvbi4gKi9cbnR5cGUgSG9zdEZlYXR1cmUgPSAoPFQ+KGNvbXBvbmVudDogVCwgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8VD4pID0+IHZvaWQpO1xuXG4vLyBUT0RPOiBBIGhhY2sgdG8gbm90IHB1bGwgaW4gdGhlIE51bGxJbmplY3RvciBmcm9tIEBhbmd1bGFyL2NvcmUuXG5leHBvcnQgY29uc3QgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3IgPSB7XG4gIGdldDogKHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpID0+IHtcbiAgICB0aHJvd1Byb3ZpZGVyTm90Rm91bmRFcnJvcih0b2tlbiwgJ051bGxJbmplY3RvcicpO1xuICB9XG59O1xuXG4vKiogQ3JlYXRlcyBhIFROb2RlIHRoYXQgY2FuIGJlIHVzZWQgdG8gaW5zdGFudGlhdGUgYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRUTm9kZShsVmlldzogTFZpZXcsIHJOb2RlOiBSTm9kZSk6IFRFbGVtZW50Tm9kZSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBpbmRleCA9IEhFQURFUl9PRkZTRVQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgbFZpZXdbaW5kZXhdID0gck5vZGU7XG5cbiAgLy8gJyNob3N0JyBpcyBhZGRlZCBoZXJlIGFzIHdlIGRvbid0IGtub3cgdGhlIHJlYWwgaG9zdCBET00gbmFtZSAod2UgZG9uJ3Qgd2FudCB0byByZWFkIGl0KSBhbmQgYXRcbiAgLy8gdGhlIHNhbWUgdGltZSB3ZSB3YW50IHRvIGNvbW11bmljYXRlIHRoZSBkZWJ1ZyBgVE5vZGVgIHRoYXQgdGhpcyBpcyBhIHNwZWNpYWwgYFROb2RlYFxuICAvLyByZXByZXNlbnRpbmcgYSBob3N0IGVsZW1lbnQuXG4gIHJldHVybiBnZXRPckNyZWF0ZVROb2RlKHRWaWV3LCBpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsICcjaG9zdCcsIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIHJvb3QgY29tcG9uZW50IHZpZXcgYW5kIHRoZSByb290IGNvbXBvbmVudCBub2RlLlxuICpcbiAqIEBwYXJhbSByTm9kZSBSZW5kZXIgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIHJvb3RDb21wb25lbnREZWYgQ29tcG9uZW50RGVmXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHBhcmVudCB2aWV3IHdoZXJlIHRoZSBob3N0IG5vZGUgaXMgc3RvcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJGYWN0b3J5IEZhY3RvcnkgdG8gYmUgdXNlZCBmb3IgY3JlYXRpbmcgY2hpbGQgcmVuZGVyZXJzLlxuICogQHBhcmFtIGhvc3RSZW5kZXJlciBUaGUgY3VycmVudCByZW5kZXJlclxuICogQHBhcmFtIHNhbml0aXplciBUaGUgc2FuaXRpemVyLCBpZiBwcm92aWRlZFxuICpcbiAqIEByZXR1cm5zIENvbXBvbmVudCB2aWV3IGNyZWF0ZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSwgck5vZGU6IFJFbGVtZW50fG51bGwsIHJvb3RDb21wb25lbnREZWY6IENvbXBvbmVudERlZjxhbnk+LFxuICAgIHJvb3REaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdLCByb290VmlldzogTFZpZXcsIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5LFxuICAgIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIsIHNhbml0aXplcj86IFNhbml0aXplcnxudWxsKTogTFZpZXcge1xuICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgYXBwbHlSb290Q29tcG9uZW50U3R5bGluZyhyb290RGlyZWN0aXZlcywgdE5vZGUsIHJOb2RlLCBob3N0UmVuZGVyZXIpO1xuXG4gIGNvbnN0IHZpZXdSZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihyTm9kZSwgcm9vdENvbXBvbmVudERlZik7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgIHJvb3RWaWV3LCBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3KHJvb3RDb21wb25lbnREZWYpLCBudWxsLFxuICAgICAgcm9vdENvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgcm9vdFZpZXdbdE5vZGUuaW5kZXhdLFxuICAgICAgdE5vZGUsIHJlbmRlcmVyRmFjdG9yeSwgdmlld1JlbmRlcmVyLCBzYW5pdGl6ZXIgfHwgbnVsbCwgbnVsbCwgbnVsbCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlLCByb290RGlyZWN0aXZlcy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIGFkZFRvVmlld1RyZWUocm9vdFZpZXcsIGNvbXBvbmVudFZpZXcpO1xuXG4gIC8vIFN0b3JlIGNvbXBvbmVudCB2aWV3IGF0IG5vZGUgaW5kZXgsIHdpdGggbm9kZSBhcyB0aGUgSE9TVFxuICByZXR1cm4gcm9vdFZpZXdbdE5vZGUuaW5kZXhdID0gY29tcG9uZW50Vmlldztcbn1cblxuLyoqIFNldHMgdXAgdGhlIHN0eWxpbmcgaW5mb3JtYXRpb24gb24gYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIGFwcGx5Um9vdENvbXBvbmVudFN0eWxpbmcoXG4gICAgcm9vdERpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10sIHROb2RlOiBURWxlbWVudE5vZGUsIHJOb2RlOiBSRWxlbWVudHxudWxsLFxuICAgIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBkZWYgb2Ygcm9vdERpcmVjdGl2ZXMpIHtcbiAgICB0Tm9kZS5tZXJnZWRBdHRycyA9IG1lcmdlSG9zdEF0dHJzKHROb2RlLm1lcmdlZEF0dHJzLCBkZWYuaG9zdEF0dHJzKTtcbiAgfVxuXG4gIGlmICh0Tm9kZS5tZXJnZWRBdHRycyAhPT0gbnVsbCkge1xuICAgIGNvbXB1dGVTdGF0aWNTdHlsaW5nKHROb2RlLCB0Tm9kZS5tZXJnZWRBdHRycywgdHJ1ZSk7XG5cbiAgICBpZiAock5vZGUgIT09IG51bGwpIHtcbiAgICAgIHNldHVwU3RhdGljQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIHJOb2RlLCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHJvb3QgY29tcG9uZW50IGFuZCBzZXRzIGl0IHVwIHdpdGggZmVhdHVyZXMgYW5kIGhvc3QgYmluZGluZ3MuU2hhcmVkIGJ5XG4gKiByZW5kZXJDb21wb25lbnQoKSBhbmQgVmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnQoKS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUm9vdENvbXBvbmVudDxUPihcbiAgICBjb21wb25lbnRWaWV3OiBMVmlldywgcm9vdENvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+LCByb290RGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPGFueT5bXSxcbiAgICBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCwgcm9vdExWaWV3OiBMVmlldyxcbiAgICBob3N0RmVhdHVyZXM6IEhvc3RGZWF0dXJlW118bnVsbCk6IGFueSB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocm9vdFROb2RlLCAndE5vZGUgc2hvdWxkIGhhdmUgYmVlbiBhbHJlYWR5IGNyZWF0ZWQnKTtcbiAgY29uc3QgdFZpZXcgPSByb290TFZpZXdbVFZJRVddO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHJvb3RUTm9kZSwgcm9vdExWaWV3KTtcblxuICBpbml0aWFsaXplRGlyZWN0aXZlcyh0Vmlldywgcm9vdExWaWV3LCByb290VE5vZGUsIHJvb3REaXJlY3RpdmVzLCBudWxsLCBob3N0RGlyZWN0aXZlRGVmcyk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290RGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gcm9vdFROb2RlLmRpcmVjdGl2ZVN0YXJ0ICsgaTtcbiAgICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZSA9IGdldE5vZGVJbmplY3RhYmxlKHJvb3RMVmlldywgdFZpZXcsIGRpcmVjdGl2ZUluZGV4LCByb290VE5vZGUpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmVJbnN0YW5jZSwgcm9vdExWaWV3KTtcbiAgfVxuXG4gIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXcsIHJvb3RMVmlldywgcm9vdFROb2RlKTtcblxuICBpZiAobmF0aXZlKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgcm9vdExWaWV3KTtcbiAgfVxuXG4gIC8vIFdlJ3JlIGd1YXJhbnRlZWQgZm9yIHRoZSBgY29tcG9uZW50T2Zmc2V0YCB0byBiZSBwb3NpdGl2ZSBoZXJlXG4gIC8vIHNpbmNlIGEgcm9vdCBjb21wb25lbnQgYWx3YXlzIG1hdGNoZXMgYSBjb21wb25lbnQgZGVmLlxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKHJvb3RUTm9kZS5jb21wb25lbnRPZmZzZXQsIC0xLCAnY29tcG9uZW50T2Zmc2V0IG11c3QgYmUgZ3JlYXQgdGhhbiAtMScpO1xuICBjb25zdCBjb21wb25lbnQgPSBnZXROb2RlSW5qZWN0YWJsZShcbiAgICAgIHJvb3RMVmlldywgdFZpZXcsIHJvb3RUTm9kZS5kaXJlY3RpdmVTdGFydCArIHJvb3RUTm9kZS5jb21wb25lbnRPZmZzZXQsIHJvb3RUTm9kZSk7XG4gIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSByb290TFZpZXdbQ09OVEVYVF0gPSBjb21wb25lbnQ7XG5cbiAgaWYgKGhvc3RGZWF0dXJlcyAhPT0gbnVsbCkge1xuICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiBob3N0RmVhdHVyZXMpIHtcbiAgICAgIGZlYXR1cmUoY29tcG9uZW50LCByb290Q29tcG9uZW50RGVmKTtcbiAgICB9XG4gIH1cblxuICAvLyBXZSB3YW50IHRvIGdlbmVyYXRlIGFuIGVtcHR5IFF1ZXJ5TGlzdCBmb3Igcm9vdCBjb250ZW50IHF1ZXJpZXMgZm9yIGJhY2t3YXJkc1xuICAvLyBjb21wYXRpYmlsaXR5IHdpdGggVmlld0VuZ2luZS5cbiAgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3LCByb290VE5vZGUsIGNvbXBvbmVudFZpZXcpO1xuXG4gIHJldHVybiBjb21wb25lbnQ7XG59XG5cbi8qKiBTZXRzIHRoZSBzdGF0aWMgYXR0cmlidXRlcyBvbiBhIHJvb3QgY29tcG9uZW50LiAqL1xuZnVuY3Rpb24gc2V0Um9vdE5vZGVBdHRyaWJ1dGVzKFxuICAgIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIyLCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjx1bmtub3duPiwgaG9zdFJOb2RlOiBSRWxlbWVudCxcbiAgICByb290U2VsZWN0b3JPck5vZGU6IGFueSkge1xuICBpZiAocm9vdFNlbGVjdG9yT3JOb2RlKSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgaG9zdFJOb2RlLCBbJ25nLXZlcnNpb24nLCBWRVJTSU9OLmZ1bGxdKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiBob3N0IGVsZW1lbnQgaXMgY3JlYXRlZCBhcyBhIHBhcnQgb2YgdGhpcyBmdW5jdGlvbiBjYWxsIChpLmUuIGByb290U2VsZWN0b3JPck5vZGVgXG4gICAgLy8gaXMgbm90IGRlZmluZWQpLCBhbHNvIGFwcGx5IGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgZXh0cmFjdGVkIGZyb20gY29tcG9uZW50IHNlbGVjdG9yLlxuICAgIC8vIEV4dHJhY3QgYXR0cmlidXRlcyBhbmQgY2xhc3NlcyBmcm9tIHRoZSBmaXJzdCBzZWxlY3RvciBvbmx5IHRvIG1hdGNoIFZFIGJlaGF2aW9yLlxuICAgIGNvbnN0IHthdHRycywgY2xhc3Nlc30gPSBleHRyYWN0QXR0cnNBbmRDbGFzc2VzRnJvbVNlbGVjdG9yKGNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF0pO1xuICAgIGlmIChhdHRycykge1xuICAgICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgaG9zdFJOb2RlLCBhdHRycyk7XG4gICAgfVxuICAgIGlmIChjbGFzc2VzICYmIGNsYXNzZXMubGVuZ3RoID4gMCkge1xuICAgICAgd3JpdGVEaXJlY3RDbGFzcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgY2xhc3Nlcy5qb2luKCcgJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUHJvamVjdHMgdGhlIGBwcm9qZWN0YWJsZU5vZGVzYCB0aGF0IHdlcmUgc3BlY2lmaWVkIHdoZW4gY3JlYXRpbmcgYSByb290IGNvbXBvbmVudC4gKi9cbmZ1bmN0aW9uIHByb2plY3ROb2RlcyhcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlLCBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdLCBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdKSB7XG4gIGNvbnN0IHByb2plY3Rpb246IChUTm9kZXxSTm9kZVtdfG51bGwpW10gPSB0Tm9kZS5wcm9qZWN0aW9uID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbmdDb250ZW50U2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZXNmb3JTbG90ID0gcHJvamVjdGFibGVOb2Rlc1tpXTtcbiAgICAvLyBQcm9qZWN0YWJsZSBub2RlcyBjYW4gYmUgcGFzc2VkIGFzIGFycmF5IG9mIGFycmF5cyBvciBhbiBhcnJheSBvZiBpdGVyYWJsZXMgKG5nVXBncmFkZVxuICAgIC8vIGNhc2UpLiBIZXJlIHdlIGRvIG5vcm1hbGl6ZSBwYXNzZWQgZGF0YSBzdHJ1Y3R1cmUgdG8gYmUgYW4gYXJyYXkgb2YgYXJyYXlzIHRvIGF2b2lkXG4gICAgLy8gY29tcGxleCBjaGVja3MgZG93biB0aGUgbGluZS5cbiAgICAvLyBXZSBhbHNvIG5vcm1hbGl6ZSB0aGUgbGVuZ3RoIG9mIHRoZSBwYXNzZWQgaW4gcHJvamVjdGFibGUgbm9kZXMgKHRvIG1hdGNoIHRoZSBudW1iZXIgb2ZcbiAgICAvLyA8bmctY29udGFpbmVyPiBzbG90cyBkZWZpbmVkIGJ5IGEgY29tcG9uZW50KS5cbiAgICBwcm9qZWN0aW9uLnB1c2gobm9kZXNmb3JTbG90ICE9IG51bGwgPyBBcnJheS5mcm9tKG5vZGVzZm9yU2xvdCkgOiBudWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gZW5hYmxlIGxpZmVjeWNsZSBob29rcyBvbiB0aGUgcm9vdCBjb21wb25lbnQuXG4gKlxuICogSW5jbHVkZSB0aGlzIGZlYXR1cmUgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGlmIHRoZSByb290IGNvbXBvbmVudFxuICogeW91IGFyZSByZW5kZXJpbmcgaGFzIGxpZmVjeWNsZSBob29rcyBkZWZpbmVkLiBPdGhlcndpc2UsIHRoZSBob29rcyB3b24ndFxuICogYmUgY2FsbGVkIHByb3Blcmx5LlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiByZW5kZXJDb21wb25lbnQoQXBwQ29tcG9uZW50LCB7aG9zdEZlYXR1cmVzOiBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXX0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBMaWZlY3ljbGVIb29rc0ZlYXR1cmUoKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ1ROb2RlIGlzIHJlcXVpcmVkJyk7XG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3MoZ2V0TFZpZXcoKVtUVklFV10sIHROb2RlKTtcbn1cbiJdfQ==