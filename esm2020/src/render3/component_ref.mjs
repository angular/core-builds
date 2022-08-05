/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EnvironmentInjector } from '../di/r3_injector';
import { RuntimeError } from '../errors';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as AbstractComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { createElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/sanitizer';
import { assertDefined, assertIndexInRange } from '../util/assert';
import { VERSION } from '../version';
import { NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '../view/provider_flags';
import { assertComponentType } from './assert';
import { getComponentDef } from './definition';
import { diPublicInInjector, getOrCreateNodeInjectorForNode, NodeInjector } from './di';
import { throwProviderNotFoundError } from './errors_di';
import { registerPostOrderHooks } from './hooks';
import { reportUnknownPropertyError } from './instructions/element_validation';
import { addToViewTree, createLView, createTView, getOrCreateTComponentView, getOrCreateTNode, initTNodeFlags, instantiateRootComponent, invokeHostBindingsInCreationMode, locateHostElement, markAsComponentHost, markDirtyIfOnPush, registerHostBindingOpCodes, renderView, setInputsForProperty } from './instructions/shared';
import { CONTEXT, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
import { createElementNode, writeDirectClass, writeDirectStyle } from './node_manipulation';
import { extractAttrsAndClassesFromSelector, stringifyCSSSelectorList } from './node_selector_matcher';
import { enterView, getCurrentTNode, getLView, leaveView, setSelectedIndex } from './state';
import { computeStaticStyling } from './styling/static_styling';
import { setUpAttributes } from './util/attrs_utils';
import { stringifyForError } from './util/stringify_utils';
import { getTNode } from './util/view_utils';
import { RootViewRef } from './view_ref';
export class ComponentFactoryResolver extends viewEngine_ComponentFactoryResolver {
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
 * Render3 implementation of {@link viewEngine_ComponentFactory}.
 */
export class ComponentFactory extends viewEngine_ComponentFactory {
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
        const rootContext = createRootContext();
        // Create the root view. Uses empty TView and ContentTemplate.
        const rootTView = createTView(0 /* TViewType.Root */, null, null, 1, 0, null, null, null, null, null);
        const rootLView = createLView(null, rootTView, rootContext, rootFlags, null, null, rendererFactory, hostRenderer, sanitizer, rootViewInjector, null);
        // rootView is the parent when bootstrapping
        // TODO(misko): it looks like we are entering view here but we don't really need to as
        // `renderView` does that. However as the code is written it is needed because
        // `createRootComponentView` and `createRootComponent` both read global state. Fixing those
        // issues would allow us to drop this.
        enterView(rootLView);
        let component;
        let tElementNode;
        try {
            const componentView = createRootComponentView(hostRNode, this.componentDef, rootLView, rendererFactory, hostRenderer);
            if (hostRNode) {
                if (rootSelectorOrNode) {
                    setUpAttributes(hostRenderer, hostRNode, ['ng-version', VERSION.full]);
                }
                else {
                    // If host element is created as a part of this function call (i.e. `rootSelectorOrNode`
                    // is not defined), also apply attributes and classes extracted from component selector.
                    // Extract attributes and classes from the first selector only to match VE behavior.
                    const { attrs, classes } = extractAttrsAndClassesFromSelector(this.componentDef.selectors[0]);
                    if (attrs) {
                        setUpAttributes(hostRenderer, hostRNode, attrs);
                    }
                    if (classes && classes.length > 0) {
                        writeDirectClass(hostRenderer, hostRNode, classes.join(' '));
                    }
                }
            }
            tElementNode = getTNode(rootTView, HEADER_OFFSET);
            if (projectableNodes !== undefined) {
                const projection = tElementNode.projection = [];
                for (let i = 0; i < this.ngContentSelectors.length; i++) {
                    const nodesforSlot = projectableNodes[i];
                    // Projectable nodes can be passed as array of arrays or an array of iterables (ngUpgrade
                    // case). Here we do normalize passed data structure to be an array of arrays to avoid
                    // complex checks down the line.
                    // We also normalize the length of the passed in projectable nodes (to match the number of
                    // <ng-container> slots defined by a component).
                    projection.push(nodesforSlot != null ? Array.from(nodesforSlot) : null);
                }
            }
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            component = createRootComponent(componentView, this.componentDef, rootLView, rootContext, [LifecycleHooksFeature]);
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
/**
 * Creates the root component view and the root component node.
 *
 * @param rNode Render host element.
 * @param def ComponentDef
 * @param rootView The parent view where the host node is stored
 * @param rendererFactory Factory to be used for creating child renderers.
 * @param hostRenderer The current renderer
 * @param sanitizer The sanitizer, if provided
 *
 * @returns Component view created
 */
export function createRootComponentView(rNode, def, rootView, rendererFactory, hostRenderer, sanitizer) {
    const tView = rootView[TVIEW];
    const index = HEADER_OFFSET;
    ngDevMode && assertIndexInRange(rootView, index);
    rootView[index] = rNode;
    // '#host' is added here as we don't know the real host DOM name (we don't want to read it) and at
    // the same time we want to communicate the debug `TNode` that this is a special `TNode`
    // representing a host element.
    const tNode = getOrCreateTNode(tView, index, 2 /* TNodeType.Element */, '#host', null);
    const mergedAttrs = tNode.mergedAttrs = def.hostAttrs;
    if (mergedAttrs !== null) {
        computeStaticStyling(tNode, mergedAttrs, true);
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
    const viewRenderer = rendererFactory.createRenderer(rNode, def);
    const componentView = createLView(rootView, getOrCreateTComponentView(def), null, def.onPush ? 32 /* LViewFlags.Dirty */ : 16 /* LViewFlags.CheckAlways */, rootView[index], tNode, rendererFactory, viewRenderer, sanitizer || null, null, null);
    if (tView.firstCreatePass) {
        diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, rootView), tView, def.type);
        markAsComponentHost(tView, tNode);
        initTNodeFlags(tNode, rootView.length, 1);
    }
    addToViewTree(rootView, componentView);
    // Store component view at node index, with node as the HOST
    return rootView[index] = componentView;
}
/**
 * Creates a root component and sets it up with features and host bindings.Shared by
 * renderComponent() and ViewContainerRef.createComponent().
 */
export function createRootComponent(componentView, componentDef, rootLView, rootContext, hostFeatures) {
    const tView = rootLView[TVIEW];
    // Create directive instance with factory() and store at next index in viewData
    const component = instantiateRootComponent(tView, rootLView, componentDef);
    rootContext.components.push(component);
    componentView[CONTEXT] = component;
    if (hostFeatures !== null) {
        for (const feature of hostFeatures) {
            feature(component, componentDef);
        }
    }
    // We want to generate an empty QueryList for root content queries for backwards
    // compatibility with ViewEngine.
    if (componentDef.contentQueries) {
        const tNode = getCurrentTNode();
        ngDevMode && assertDefined(tNode, 'TNode expected');
        componentDef.contentQueries(1 /* RenderFlags.Create */, component, tNode.directiveStart);
    }
    const rootTNode = getCurrentTNode();
    ngDevMode && assertDefined(rootTNode, 'tNode should have been already created');
    if (tView.firstCreatePass &&
        (componentDef.hostBindings !== null || componentDef.hostAttrs !== null)) {
        setSelectedIndex(rootTNode.index);
        const rootTView = rootLView[TVIEW];
        registerHostBindingOpCodes(rootTView, rootTNode, rootLView, rootTNode.directiveStart, rootTNode.directiveEnd, componentDef);
        invokeHostBindingsInCreationMode(componentDef, component);
    }
    return component;
}
function createRootContext() {
    return { components: [] };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFNSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUV6RCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksMkJBQTJCLEVBQUUsWUFBWSxJQUFJLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDbEksT0FBTyxFQUFDLHdCQUF3QixJQUFJLG1DQUFtQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDckgsT0FBTyxFQUFDLGdCQUFnQixFQUFzQyxNQUFNLHVCQUF1QixDQUFDO0FBRTVGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMvQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGFBQWEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLHFDQUFxQyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFN0UsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN0RixPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDdkQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sU0FBUyxDQUFD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LFlBQVksQ0FBQyxDQUFDO1FBRWxCLGdDQUFnQyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztLQUMzRDtJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRCxTQUFTLGlCQUFpQjtJQUN4QixPQUFPLEVBQUMsVUFBVSxFQUFFLEVBQUUsRUFBQyxDQUFDO0FBQzFCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDdkQsc0JBQXNCLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtQcm92aWRlclRva2VufSBmcm9tICcuLi9kaS9wcm92aWRlcl90b2tlbic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgQWJzdHJhY3RDb21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgRWxlbWVudFJlZiBhcyB2aWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRJbmRleEluUmFuZ2V9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7VkVSU0lPTn0gZnJvbSAnLi4vdmVyc2lvbic7XG5pbXBvcnQge05PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1J9IGZyb20gJy4uL3ZpZXcvcHJvdmlkZXJfZmxhZ3MnO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGV9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSwgTm9kZUluamVjdG9yfSBmcm9tICcuL2RpJztcbmltcG9ydCB7dGhyb3dQcm92aWRlck5vdEZvdW5kRXJyb3J9IGZyb20gJy4vZXJyb3JzX2RpJztcbmltcG9ydCB7cmVnaXN0ZXJQb3N0T3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge3JlcG9ydFVua25vd25Qcm9wZXJ0eUVycm9yfSBmcm9tICcuL2luc3RydWN0aW9ucy9lbGVtZW50X3ZhbGlkYXRpb24nO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBjcmVhdGVMVmlldywgY3JlYXRlVFZpZXcsIGdldE9yQ3JlYXRlVENvbXBvbmVudFZpZXcsIGdldE9yQ3JlYXRlVE5vZGUsIGluaXRUTm9kZUZsYWdzLCBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQsIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlLCBsb2NhdGVIb3N0RWxlbWVudCwgbWFya0FzQ29tcG9uZW50SG9zdCwgbWFya0RpcnR5SWZPblB1c2gsIHJlZ2lzdGVySG9zdEJpbmRpbmdPcENvZGVzLCByZW5kZXJWaWV3LCBzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzVmFsdWUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJIYW5kbGVyfSBmcm9tICcuL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7UmVuZGVyZXIsIFJlbmRlcmVyRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0LCBUVklFVywgVFZpZXdUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge01BVEhfTUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFfSBmcm9tICcuL25hbWVzcGFjZXMnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50Tm9kZSwgd3JpdGVEaXJlY3RDbGFzcywgd3JpdGVEaXJlY3RTdHlsZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2V4dHJhY3RBdHRyc0FuZENsYXNzZXNGcm9tU2VsZWN0b3IsIHN0cmluZ2lmeUNTU1NlbGVjdG9yTGlzdH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGxlYXZlVmlldywgc2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2NvbXB1dGVTdGF0aWNTdHlsaW5nfSBmcm9tICcuL3N0eWxpbmcvc3RhdGljX3N0eWxpbmcnO1xuaW1wb3J0IHtzZXRVcEF0dHJpYnV0ZXN9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge3N0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuL3V0aWwvc3RyaW5naWZ5X3V0aWxzJztcbmltcG9ydCB7Z2V0Um9vdENvbnRleHR9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggYWxsIHJlc29sdmVkIGZhY3RvcmllcyBhcmUgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHJlc29sdmVDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50KTtcbiAgICBjb25zdCBjb21wb25lbnREZWYgPSBnZXRDb21wb25lbnREZWYoY29tcG9uZW50KSE7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy5uZ01vZHVsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBnZXROYW1lc3BhY2UoZWxlbWVudE5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgbmFtZSA9IGVsZW1lbnROYW1lLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBuYW1lID09PSAnc3ZnJyA/IFNWR19OQU1FU1BBQ0UgOiAobmFtZSA9PT0gJ21hdGgnID8gTUFUSF9NTF9OQU1FU1BBQ0UgOiBudWxsKTtcbn1cblxuLyoqXG4gKiBJbmplY3RvciB0aGF0IGxvb2tzIHVwIGEgdmFsdWUgdXNpbmcgYSBzcGVjaWZpYyBpbmplY3RvciwgYmVmb3JlIGZhbGxpbmcgYmFjayB0byB0aGUgbW9kdWxlXG4gKiBpbmplY3Rvci4gVXNlZCBwcmltYXJpbHkgd2hlbiBjcmVhdGluZyBjb21wb25lbnRzIG9yIGVtYmVkZGVkIHZpZXdzIGR5bmFtaWNhbGx5LlxuICovXG5jbGFzcyBDaGFpbmVkSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yLCBwcml2YXRlIHBhcmVudEluamVjdG9yOiBJbmplY3Rvcikge31cblxuICBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVCB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmluamVjdG9yLmdldDxUfHR5cGVvZiBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SPihcbiAgICAgICAgdG9rZW4sIE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IsIGZsYWdzKTtcblxuICAgIGlmICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiB8fFxuICAgICAgICBub3RGb3VuZFZhbHVlID09PSAoTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiBhcyB1bmtub3duIGFzIFQpKSB7XG4gICAgICAvLyBSZXR1cm4gdGhlIHZhbHVlIGZyb20gdGhlIHJvb3QgZWxlbWVudCBpbmplY3RvciB3aGVuXG4gICAgICAvLyAtIGl0IHByb3ZpZGVzIGl0XG4gICAgICAvLyAgICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUilcbiAgICAgIC8vIC0gdGhlIG1vZHVsZSBpbmplY3RvciBzaG91bGQgbm90IGJlIGNoZWNrZWRcbiAgICAgIC8vICAgKG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICByZXR1cm4gdmFsdWUgYXMgVDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5wYXJlbnRJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbmRlcjMgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeX0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgb3ZlcnJpZGUgc2VsZWN0b3I6IHN0cmluZztcbiAgb3ZlcnJpZGUgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBvdmVycmlkZSBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuICBpc0JvdW5kVG9Nb2R1bGU6IGJvb2xlYW47XG5cbiAgb3ZlcnJpZGUgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5pbnB1dHMpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cyk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGNvbXBvbmVudERlZiBUaGUgY29tcG9uZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggdGhlIGZhY3RvcnkgaXMgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55PiwgcHJpdmF0ZSBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG4gICAgdGhpcy5zZWxlY3RvciA9IHN0cmluZ2lmeUNTU1NlbGVjdG9yTGlzdChjb21wb25lbnREZWYuc2VsZWN0b3JzKTtcbiAgICB0aGlzLm5nQ29udGVudFNlbGVjdG9ycyA9XG4gICAgICAgIGNvbXBvbmVudERlZi5uZ0NvbnRlbnRTZWxlY3RvcnMgPyBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzIDogW107XG4gICAgdGhpcy5pc0JvdW5kVG9Nb2R1bGUgPSAhIW5nTW9kdWxlO1xuICB9XG5cbiAgb3ZlcnJpZGUgY3JlYXRlKFxuICAgICAgaW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsIHJvb3RTZWxlY3Rvck9yTm9kZT86IGFueSxcbiAgICAgIGVudmlyb25tZW50SW5qZWN0b3I/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58RW52aXJvbm1lbnRJbmplY3RvcnxcbiAgICAgIHVuZGVmaW5lZCk6IEFic3RyYWN0Q29tcG9uZW50UmVmPFQ+IHtcbiAgICBlbnZpcm9ubWVudEluamVjdG9yID0gZW52aXJvbm1lbnRJbmplY3RvciB8fCB0aGlzLm5nTW9kdWxlO1xuXG4gICAgbGV0IHJlYWxFbnZpcm9ubWVudEluamVjdG9yID0gZW52aXJvbm1lbnRJbmplY3RvciBpbnN0YW5jZW9mIEVudmlyb25tZW50SW5qZWN0b3IgP1xuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yIDpcbiAgICAgICAgZW52aXJvbm1lbnRJbmplY3Rvcj8uaW5qZWN0b3I7XG5cbiAgICBpZiAocmVhbEVudmlyb25tZW50SW5qZWN0b3IgJiYgdGhpcy5jb21wb25lbnREZWYuZ2V0U3RhbmRhbG9uZUluamVjdG9yICE9PSBudWxsKSB7XG4gICAgICByZWFsRW52aXJvbm1lbnRJbmplY3RvciA9IHRoaXMuY29tcG9uZW50RGVmLmdldFN0YW5kYWxvbmVJbmplY3RvcihyZWFsRW52aXJvbm1lbnRJbmplY3RvcikgfHxcbiAgICAgICAgICByZWFsRW52aXJvbm1lbnRJbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCByb290Vmlld0luamVjdG9yID1cbiAgICAgICAgcmVhbEVudmlyb25tZW50SW5qZWN0b3IgPyBuZXcgQ2hhaW5lZEluamVjdG9yKGluamVjdG9yLCByZWFsRW52aXJvbm1lbnRJbmplY3RvcikgOiBpbmplY3RvcjtcblxuICAgIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIG51bGwpO1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SRU5ERVJFUl9OT1RfRk9VTkQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICdBbmd1bGFyIHdhcyBub3QgYWJsZSB0byBpbmplY3QgYSByZW5kZXJlciAoUmVuZGVyZXJGYWN0b3J5MikuICcgK1xuICAgICAgICAgICAgICAgICAgJ0xpa2VseSB0aGlzIGlzIGR1ZSB0byBhIGJyb2tlbiBESSBoaWVyYXJjaHkuICcgK1xuICAgICAgICAgICAgICAgICAgJ01ha2Ugc3VyZSB0aGF0IGFueSBpbmplY3RvciB1c2VkIHRvIGNyZWF0ZSB0aGlzIGNvbXBvbmVudCBoYXMgYSBjb3JyZWN0IHBhcmVudC4nKTtcbiAgICB9XG4gICAgY29uc3Qgc2FuaXRpemVyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoU2FuaXRpemVyLCBudWxsKTtcblxuICAgIGNvbnN0IGhvc3RSZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZik7XG4gICAgLy8gRGV0ZXJtaW5lIGEgdGFnIG5hbWUgdXNlZCBmb3IgY3JlYXRpbmcgaG9zdCBlbGVtZW50cyB3aGVuIHRoaXMgY29tcG9uZW50IGlzIGNyZWF0ZWRcbiAgICAvLyBkeW5hbWljYWxseS4gRGVmYXVsdCB0byAnZGl2JyBpZiB0aGlzIGNvbXBvbmVudCBkaWQgbm90IHNwZWNpZnkgYW55IHRhZyBuYW1lIGluIGl0cyBzZWxlY3Rvci5cbiAgICBjb25zdCBlbGVtZW50TmFtZSA9IHRoaXMuY29tcG9uZW50RGVmLnNlbGVjdG9yc1swXVswXSBhcyBzdHJpbmcgfHwgJ2Rpdic7XG4gICAgY29uc3QgaG9zdFJOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlID9cbiAgICAgICAgbG9jYXRlSG9zdEVsZW1lbnQoaG9zdFJlbmRlcmVyLCByb290U2VsZWN0b3JPck5vZGUsIHRoaXMuY29tcG9uZW50RGVmLmVuY2Fwc3VsYXRpb24pIDpcbiAgICAgICAgY3JlYXRlRWxlbWVudE5vZGUoXG4gICAgICAgICAgICByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgdGhpcy5jb21wb25lbnREZWYpLCBlbGVtZW50TmFtZSxcbiAgICAgICAgICAgIGdldE5hbWVzcGFjZShlbGVtZW50TmFtZSkpO1xuXG4gICAgY29uc3Qgcm9vdEZsYWdzID0gdGhpcy5jb21wb25lbnREZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuSXNSb290IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG4gICAgY29uc3Qgcm9vdENvbnRleHQgPSBjcmVhdGVSb290Q29udGV4dCgpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSByb290IHZpZXcuIFVzZXMgZW1wdHkgVFZpZXcgYW5kIENvbnRlbnRUZW1wbGF0ZS5cbiAgICBjb25zdCByb290VFZpZXcgPSBjcmVhdGVUVmlldyhUVmlld1R5cGUuUm9vdCwgbnVsbCwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgY29uc3Qgcm9vdExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIG51bGwsIHJvb3RUVmlldywgcm9vdENvbnRleHQsIHJvb3RGbGFncywgbnVsbCwgbnVsbCwgcmVuZGVyZXJGYWN0b3J5LCBob3N0UmVuZGVyZXIsXG4gICAgICAgIHNhbml0aXplciwgcm9vdFZpZXdJbmplY3RvciwgbnVsbCk7XG5cbiAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgIC8vIFRPRE8obWlza28pOiBpdCBsb29rcyBsaWtlIHdlIGFyZSBlbnRlcmluZyB2aWV3IGhlcmUgYnV0IHdlIGRvbid0IHJlYWxseSBuZWVkIHRvIGFzXG4gICAgLy8gYHJlbmRlclZpZXdgIGRvZXMgdGhhdC4gSG93ZXZlciBhcyB0aGUgY29kZSBpcyB3cml0dGVuIGl0IGlzIG5lZWRlZCBiZWNhdXNlXG4gICAgLy8gYGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3YCBhbmQgYGNyZWF0ZVJvb3RDb21wb25lbnRgIGJvdGggcmVhZCBnbG9iYWwgc3RhdGUuIEZpeGluZyB0aG9zZVxuICAgIC8vIGlzc3VlcyB3b3VsZCBhbGxvdyB1cyB0byBkcm9wIHRoaXMuXG4gICAgZW50ZXJWaWV3KHJvb3RMVmlldyk7XG5cbiAgICBsZXQgY29tcG9uZW50OiBUO1xuICAgIGxldCB0RWxlbWVudE5vZGU6IFRFbGVtZW50Tm9kZTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgICAgaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZiwgcm9vdExWaWV3LCByZW5kZXJlckZhY3RvcnksIGhvc3RSZW5kZXJlcik7XG4gICAgICBpZiAoaG9zdFJOb2RlKSB7XG4gICAgICAgIGlmIChyb290U2VsZWN0b3JPck5vZGUpIHtcbiAgICAgICAgICBzZXRVcEF0dHJpYnV0ZXMoaG9zdFJlbmRlcmVyLCBob3N0Uk5vZGUsIFsnbmctdmVyc2lvbicsIFZFUlNJT04uZnVsbF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIGhvc3QgZWxlbWVudCBpcyBjcmVhdGVkIGFzIGEgcGFydCBvZiB0aGlzIGZ1bmN0aW9uIGNhbGwgKGkuZS4gYHJvb3RTZWxlY3Rvck9yTm9kZWBcbiAgICAgICAgICAvLyBpcyBub3QgZGVmaW5lZCksIGFsc28gYXBwbHkgYXR0cmlidXRlcyBhbmQgY2xhc3NlcyBleHRyYWN0ZWQgZnJvbSBjb21wb25lbnQgc2VsZWN0b3IuXG4gICAgICAgICAgLy8gRXh0cmFjdCBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGZyb20gdGhlIGZpcnN0IHNlbGVjdG9yIG9ubHkgdG8gbWF0Y2ggVkUgYmVoYXZpb3IuXG4gICAgICAgICAgY29uc3Qge2F0dHJzLCBjbGFzc2VzfSA9XG4gICAgICAgICAgICAgIGV4dHJhY3RBdHRyc0FuZENsYXNzZXNGcm9tU2VsZWN0b3IodGhpcy5jb21wb25lbnREZWYuc2VsZWN0b3JzWzBdKTtcbiAgICAgICAgICBpZiAoYXR0cnMpIHtcbiAgICAgICAgICAgIHNldFVwQXR0cmlidXRlcyhob3N0UmVuZGVyZXIsIGhvc3RSTm9kZSwgYXR0cnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2xhc3NlcyAmJiBjbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHdyaXRlRGlyZWN0Q2xhc3MoaG9zdFJlbmRlcmVyLCBob3N0Uk5vZGUsIGNsYXNzZXMuam9pbignICcpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUocm9vdFRWaWV3LCBIRUFERVJfT0ZGU0VUKSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIGlmIChwcm9qZWN0YWJsZU5vZGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgcHJvamVjdGlvbjogKFROb2RlfFJOb2RlW118bnVsbClbXSA9IHRFbGVtZW50Tm9kZS5wcm9qZWN0aW9uID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBub2Rlc2ZvclNsb3QgPSBwcm9qZWN0YWJsZU5vZGVzW2ldO1xuICAgICAgICAgIC8vIFByb2plY3RhYmxlIG5vZGVzIGNhbiBiZSBwYXNzZWQgYXMgYXJyYXkgb2YgYXJyYXlzIG9yIGFuIGFycmF5IG9mIGl0ZXJhYmxlcyAobmdVcGdyYWRlXG4gICAgICAgICAgLy8gY2FzZSkuIEhlcmUgd2UgZG8gbm9ybWFsaXplIHBhc3NlZCBkYXRhIHN0cnVjdHVyZSB0byBiZSBhbiBhcnJheSBvZiBhcnJheXMgdG8gYXZvaWRcbiAgICAgICAgICAvLyBjb21wbGV4IGNoZWNrcyBkb3duIHRoZSBsaW5lLlxuICAgICAgICAgIC8vIFdlIGFsc28gbm9ybWFsaXplIHRoZSBsZW5ndGggb2YgdGhlIHBhc3NlZCBpbiBwcm9qZWN0YWJsZSBub2RlcyAodG8gbWF0Y2ggdGhlIG51bWJlciBvZlxuICAgICAgICAgIC8vIDxuZy1jb250YWluZXI+IHNsb3RzIGRlZmluZWQgYnkgYSBjb21wb25lbnQpLlxuICAgICAgICAgIHByb2plY3Rpb24ucHVzaChub2Rlc2ZvclNsb3QgIT0gbnVsbCA/IEFycmF5LmZyb20obm9kZXNmb3JTbG90KSA6IG51bGwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsIHRoaXMuY29tcG9uZW50RGVmLCByb290TFZpZXcsIHJvb3RDb250ZXh0LCBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG4gICAgICByZW5kZXJWaWV3KHJvb3RUVmlldywgcm9vdExWaWV3LCBudWxsKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgbGVhdmVWaWV3KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRSZWYoXG4gICAgICAgIHRoaXMuY29tcG9uZW50VHlwZSwgY29tcG9uZW50LCBjcmVhdGVFbGVtZW50UmVmKHRFbGVtZW50Tm9kZSwgcm9vdExWaWV3KSwgcm9vdExWaWV3LFxuICAgICAgICB0RWxlbWVudE5vZGUpO1xuICB9XG59XG5cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGVcbiAqIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlclxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnQgY3JlYXRlZCB2aWEgYSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0uXG4gKlxuICogYENvbXBvbmVudFJlZmAgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBDb21wb25lbnQgSW5zdGFuY2UgYXMgd2VsbCBvdGhlciBvYmplY3RzIHJlbGF0ZWQgdG8gdGhpc1xuICogQ29tcG9uZW50IEluc3RhbmNlIGFuZCBhbGxvd3MgeW91IHRvIGRlc3Ryb3kgdGhlIENvbXBvbmVudCBJbnN0YW5jZSB2aWEgdGhlIHtAbGluayAjZGVzdHJveX1cbiAqIG1ldGhvZC5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWY8VD4gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudFJlZjxUPiB7XG4gIG92ZXJyaWRlIGluc3RhbmNlOiBUO1xuICBvdmVycmlkZSBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgb3ZlcnJpZGUgY2hhbmdlRGV0ZWN0b3JSZWY6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIG92ZXJyaWRlIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcHVibGljIGxvY2F0aW9uOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICBwcml2YXRlIF9yb290TFZpZXc6IExWaWV3LFxuICAgICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBSb290Vmlld1JlZjxUPihfcm9vdExWaWV3KTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnRUeXBlO1xuICB9XG5cbiAgb3ZlcnJpZGUgc2V0SW5wdXQobmFtZTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IHZvaWQge1xuICAgIGNvbnN0IGlucHV0RGF0YSA9IHRoaXMuX3ROb2RlLmlucHV0cztcbiAgICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICAgIGlmIChpbnB1dERhdGEgIT09IG51bGwgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtuYW1lXSkpIHtcbiAgICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5fcm9vdExWaWV3O1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXdbVFZJRVddLCBsVmlldywgZGF0YVZhbHVlLCBuYW1lLCB2YWx1ZSk7XG4gICAgICBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgdGhpcy5fdE5vZGUuaW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGNvbnN0IGNtcE5hbWVGb3JFcnJvciA9IHN0cmluZ2lmeUZvckVycm9yKHRoaXMuY29tcG9uZW50VHlwZSk7XG4gICAgICAgIGxldCBtZXNzYWdlID1cbiAgICAgICAgICAgIGBDYW4ndCBzZXQgdmFsdWUgb2YgdGhlICcke25hbWV9JyBpbnB1dCBvbiB0aGUgJyR7Y21wTmFtZUZvckVycm9yfScgY29tcG9uZW50LiBgO1xuICAgICAgICBtZXNzYWdlICs9IGBNYWtlIHN1cmUgdGhhdCB0aGUgJyR7XG4gICAgICAgICAgICBuYW1lfScgcHJvcGVydHkgaXMgYW5ub3RhdGVkIHdpdGggQElucHV0KCkgb3IgYSBtYXBwZWQgQElucHV0KCcke25hbWV9JykgZXhpc3RzLmA7XG4gICAgICAgIHJlcG9ydFVua25vd25Qcm9wZXJ0eUVycm9yKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodGhpcy5fdE5vZGUsIHRoaXMuX3Jvb3RMVmlldyk7XG4gIH1cblxuICBvdmVycmlkZSBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdFZpZXcuZGVzdHJveSgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5ob3N0Vmlldy5vbkRlc3Ryb3koY2FsbGJhY2spO1xuICB9XG59XG5cbi8qKiBSZXByZXNlbnRzIGEgSG9zdEZlYXR1cmUgZnVuY3Rpb24uICovXG50eXBlIEhvc3RGZWF0dXJlID0gKDxUPihjb21wb25lbnQ6IFQsIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPFQ+KSA9PiB2b2lkKTtcblxuLy8gVE9ETzogQSBoYWNrIHRvIG5vdCBwdWxsIGluIHRoZSBOdWxsSW5qZWN0b3IgZnJvbSBAYW5ndWxhci9jb3JlLlxuZXhwb3J0IGNvbnN0IE5VTExfSU5KRUNUT1I6IEluamVjdG9yID0ge1xuICBnZXQ6ICh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KSA9PiB7XG4gICAgdGhyb3dQcm92aWRlck5vdEZvdW5kRXJyb3IodG9rZW4sICdOdWxsSW5qZWN0b3InKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIHRoZSByb290IGNvbXBvbmVudCB2aWV3IGFuZCB0aGUgcm9vdCBjb21wb25lbnQgbm9kZS5cbiAqXG4gKiBAcGFyYW0gck5vZGUgUmVuZGVyIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBkZWYgQ29tcG9uZW50RGVmXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHBhcmVudCB2aWV3IHdoZXJlIHRoZSBob3N0IG5vZGUgaXMgc3RvcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJGYWN0b3J5IEZhY3RvcnkgdG8gYmUgdXNlZCBmb3IgY3JlYXRpbmcgY2hpbGQgcmVuZGVyZXJzLlxuICogQHBhcmFtIGhvc3RSZW5kZXJlciBUaGUgY3VycmVudCByZW5kZXJlclxuICogQHBhcmFtIHNhbml0aXplciBUaGUgc2FuaXRpemVyLCBpZiBwcm92aWRlZFxuICpcbiAqIEByZXR1cm5zIENvbXBvbmVudCB2aWV3IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgIHJOb2RlOiBSRWxlbWVudHxudWxsLCBkZWY6IENvbXBvbmVudERlZjxhbnk+LCByb290VmlldzogTFZpZXcsIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5LFxuICAgIGhvc3RSZW5kZXJlcjogUmVuZGVyZXIsIHNhbml0aXplcj86IFNhbml0aXplcnxudWxsKTogTFZpZXcge1xuICBjb25zdCB0VmlldyA9IHJvb3RWaWV3W1RWSUVXXTtcbiAgY29uc3QgaW5kZXggPSBIRUFERVJfT0ZGU0VUO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKHJvb3RWaWV3LCBpbmRleCk7XG4gIHJvb3RWaWV3W2luZGV4XSA9IHJOb2RlO1xuICAvLyAnI2hvc3QnIGlzIGFkZGVkIGhlcmUgYXMgd2UgZG9uJ3Qga25vdyB0aGUgcmVhbCBob3N0IERPTSBuYW1lICh3ZSBkb24ndCB3YW50IHRvIHJlYWQgaXQpIGFuZCBhdFxuICAvLyB0aGUgc2FtZSB0aW1lIHdlIHdhbnQgdG8gY29tbXVuaWNhdGUgdGhlIGRlYnVnIGBUTm9kZWAgdGhhdCB0aGlzIGlzIGEgc3BlY2lhbCBgVE5vZGVgXG4gIC8vIHJlcHJlc2VudGluZyBhIGhvc3QgZWxlbWVudC5cbiAgY29uc3QgdE5vZGU6IFRFbGVtZW50Tm9kZSA9IGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgJyNob3N0JywgbnVsbCk7XG4gIGNvbnN0IG1lcmdlZEF0dHJzID0gdE5vZGUubWVyZ2VkQXR0cnMgPSBkZWYuaG9zdEF0dHJzO1xuICBpZiAobWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBjb21wdXRlU3RhdGljU3R5bGluZyh0Tm9kZSwgbWVyZ2VkQXR0cnMsIHRydWUpO1xuICAgIGlmIChyTm9kZSAhPT0gbnVsbCkge1xuICAgICAgc2V0VXBBdHRyaWJ1dGVzKGhvc3RSZW5kZXJlciwgck5vZGUsIG1lcmdlZEF0dHJzKTtcbiAgICAgIGlmICh0Tm9kZS5jbGFzc2VzICE9PSBudWxsKSB7XG4gICAgICAgIHdyaXRlRGlyZWN0Q2xhc3MoaG9zdFJlbmRlcmVyLCByTm9kZSwgdE5vZGUuY2xhc3Nlcyk7XG4gICAgICB9XG4gICAgICBpZiAodE5vZGUuc3R5bGVzICE9PSBudWxsKSB7XG4gICAgICAgIHdyaXRlRGlyZWN0U3R5bGUoaG9zdFJlbmRlcmVyLCByTm9kZSwgdE5vZGUuc3R5bGVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCB2aWV3UmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIock5vZGUsIGRlZik7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgIHJvb3RWaWV3LCBnZXRPckNyZWF0ZVRDb21wb25lbnRWaWV3KGRlZiksIG51bGwsXG4gICAgICBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHJvb3RWaWV3W2luZGV4XSwgdE5vZGUsXG4gICAgICByZW5kZXJlckZhY3RvcnksIHZpZXdSZW5kZXJlciwgc2FuaXRpemVyIHx8IG51bGwsIG51bGwsIG51bGwpO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCByb290VmlldyksIHRWaWV3LCBkZWYudHlwZSk7XG4gICAgbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldywgdE5vZGUpO1xuICAgIGluaXRUTm9kZUZsYWdzKHROb2RlLCByb290Vmlldy5sZW5ndGgsIDEpO1xuICB9XG5cbiAgYWRkVG9WaWV3VHJlZShyb290VmlldywgY29tcG9uZW50Vmlldyk7XG5cbiAgLy8gU3RvcmUgY29tcG9uZW50IHZpZXcgYXQgbm9kZSBpbmRleCwgd2l0aCBub2RlIGFzIHRoZSBIT1NUXG4gIHJldHVybiByb290Vmlld1tpbmRleF0gPSBjb21wb25lbnRWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSByb290IGNvbXBvbmVudCBhbmQgc2V0cyBpdCB1cCB3aXRoIGZlYXR1cmVzIGFuZCBob3N0IGJpbmRpbmdzLlNoYXJlZCBieVxuICogcmVuZGVyQ29tcG9uZW50KCkgYW5kIFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIGNvbXBvbmVudFZpZXc6IExWaWV3LCBjb21wb25lbnREZWY6IENvbXBvbmVudERlZjxUPiwgcm9vdExWaWV3OiBMVmlldywgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LFxuICAgIGhvc3RGZWF0dXJlczogSG9zdEZlYXR1cmVbXXxudWxsKTogYW55IHtcbiAgY29uc3QgdFZpZXcgPSByb290TFZpZXdbVFZJRVddO1xuICAvLyBDcmVhdGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggZmFjdG9yeSgpIGFuZCBzdG9yZSBhdCBuZXh0IGluZGV4IGluIHZpZXdEYXRhXG4gIGNvbnN0IGNvbXBvbmVudCA9IGluc3RhbnRpYXRlUm9vdENvbXBvbmVudCh0Vmlldywgcm9vdExWaWV3LCBjb21wb25lbnREZWYpO1xuXG4gIHJvb3RDb250ZXh0LmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gY29tcG9uZW50O1xuXG4gIGlmIChob3N0RmVhdHVyZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGNvbnN0IGZlYXR1cmUgb2YgaG9zdEZlYXR1cmVzKSB7XG4gICAgICBmZWF0dXJlKGNvbXBvbmVudCwgY29tcG9uZW50RGVmKTtcbiAgICB9XG4gIH1cblxuICAvLyBXZSB3YW50IHRvIGdlbmVyYXRlIGFuIGVtcHR5IFF1ZXJ5TGlzdCBmb3Igcm9vdCBjb250ZW50IHF1ZXJpZXMgZm9yIGJhY2t3YXJkc1xuICAvLyBjb21wYXRpYmlsaXR5IHdpdGggVmlld0VuZ2luZS5cbiAgaWYgKGNvbXBvbmVudERlZi5jb250ZW50UXVlcmllcykge1xuICAgIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnVE5vZGUgZXhwZWN0ZWQnKTtcbiAgICBjb21wb25lbnREZWYuY29udGVudFF1ZXJpZXMoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb21wb25lbnQsIHROb2RlLmRpcmVjdGl2ZVN0YXJ0KTtcbiAgfVxuXG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocm9vdFROb2RlLCAndE5vZGUgc2hvdWxkIGhhdmUgYmVlbiBhbHJlYWR5IGNyZWF0ZWQnKTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyAmJlxuICAgICAgKGNvbXBvbmVudERlZi5ob3N0QmluZGluZ3MgIT09IG51bGwgfHwgY29tcG9uZW50RGVmLmhvc3RBdHRycyAhPT0gbnVsbCkpIHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KHJvb3RUTm9kZS5pbmRleCk7XG5cbiAgICBjb25zdCByb290VFZpZXcgPSByb290TFZpZXdbVFZJRVddO1xuICAgIHJlZ2lzdGVySG9zdEJpbmRpbmdPcENvZGVzKFxuICAgICAgICByb290VFZpZXcsIHJvb3RUTm9kZSwgcm9vdExWaWV3LCByb290VE5vZGUuZGlyZWN0aXZlU3RhcnQsIHJvb3RUTm9kZS5kaXJlY3RpdmVFbmQsXG4gICAgICAgIGNvbXBvbmVudERlZik7XG5cbiAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShjb21wb25lbnREZWYsIGNvbXBvbmVudCk7XG4gIH1cbiAgcmV0dXJuIGNvbXBvbmVudDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUm9vdENvbnRleHQoKTogUm9vdENvbnRleHQge1xuICByZXR1cm4ge2NvbXBvbmVudHM6IFtdfTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGVuYWJsZSBsaWZlY3ljbGUgaG9va3Mgb24gdGhlIHJvb3QgY29tcG9uZW50LlxuICpcbiAqIEluY2x1ZGUgdGhpcyBmZWF0dXJlIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBpZiB0aGUgcm9vdCBjb21wb25lbnRcbiAqIHlvdSBhcmUgcmVuZGVyaW5nIGhhcyBsaWZlY3ljbGUgaG9va3MgZGVmaW5lZC4gT3RoZXJ3aXNlLCB0aGUgaG9va3Mgd29uJ3RcbiAqIGJlIGNhbGxlZCBwcm9wZXJseS5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogcmVuZGVyQ29tcG9uZW50KEFwcENvbXBvbmVudCwge2hvc3RGZWF0dXJlczogW0xpZmVjeWNsZUhvb2tzRmVhdHVyZV19KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTGlmZWN5Y2xlSG9va3NGZWF0dXJlKCk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdUTm9kZSBpcyByZXF1aXJlZCcpO1xuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKGdldExWaWV3KClbVFZJRVddLCB0Tm9kZSk7XG59XG4iXX0=