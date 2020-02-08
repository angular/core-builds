/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from "tslib";
import { InjectionToken } from '../di/injection_token';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as viewEngine_ComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/sanitizer';
import { VERSION } from '../version';
import { NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '../view/provider';
import { assertComponentType } from './assert';
import { LifecycleHooksFeature, createRootComponent, createRootComponentView, createRootContext } from './component';
import { getComponentDef } from './definition';
import { NodeInjector } from './di';
import { assignTViewNodeToLView, createLView, createTView, elementCreate, locateHostElement, renderView } from './instructions/shared';
import { domRendererFactory3 } from './interfaces/renderer';
import { TVIEW } from './interfaces/view';
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
import { stringifyCSSSelectorList } from './node_selector_matcher';
import { enterView, leaveView } from './state';
import { defaultScheduler } from './util/misc_utils';
import { getTNode } from './util/view_utils';
import { createElementRef } from './view_engine_compatibility';
import { RootViewRef } from './view_ref';
var ComponentFactoryResolver = /** @class */ (function (_super) {
    __extends(ComponentFactoryResolver, _super);
    /**
     * @param ngModule The NgModuleRef to which all resolved factories are bound.
     */
    function ComponentFactoryResolver(ngModule) {
        var _this = _super.call(this) || this;
        _this.ngModule = ngModule;
        return _this;
    }
    ComponentFactoryResolver.prototype.resolveComponentFactory = function (component) {
        ngDevMode && assertComponentType(component);
        var componentDef = getComponentDef(component);
        return new ComponentFactory(componentDef, this.ngModule);
    };
    return ComponentFactoryResolver;
}(viewEngine_ComponentFactoryResolver));
export { ComponentFactoryResolver };
function toRefArray(map) {
    var array = [];
    for (var nonMinified in map) {
        if (map.hasOwnProperty(nonMinified)) {
            var minified = map[nonMinified];
            array.push({ propName: minified, templateName: nonMinified });
        }
    }
    return array;
}
function getNamespace(elementName) {
    var name = elementName.toLowerCase();
    return name === 'svg' ? SVG_NAMESPACE : (name === 'math' ? MATH_ML_NAMESPACE : null);
}
/**
 * A change detection scheduler token for {@link RootContext}. This token is the default value used
 * for the default `RootContext` found in the {@link ROOT_CONTEXT} token.
 */
export var SCHEDULER = new InjectionToken('SCHEDULER_TOKEN', {
    providedIn: 'root',
    factory: function () { return defaultScheduler; },
});
function createChainedInjector(rootViewInjector, moduleInjector) {
    return {
        get: function (token, notFoundValue, flags) {
            var value = rootViewInjector.get(token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, flags);
            if (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR ||
                notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
                // Return the value from the root element injector when
                // - it provides it
                //   (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
                // - the module injector should not be checked
                //   (notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
                return value;
            }
            return moduleInjector.get(token, notFoundValue, flags);
        }
    };
}
/**
 * Render3 implementation of {@link viewEngine_ComponentFactory}.
 */
var ComponentFactory = /** @class */ (function (_super) {
    __extends(ComponentFactory, _super);
    /**
     * @param componentDef The component definition.
     * @param ngModule The NgModuleRef to which the factory is bound.
     */
    function ComponentFactory(componentDef, ngModule) {
        var _this = _super.call(this) || this;
        _this.componentDef = componentDef;
        _this.ngModule = ngModule;
        _this.componentType = componentDef.type;
        _this.selector = stringifyCSSSelectorList(componentDef.selectors);
        _this.ngContentSelectors =
            componentDef.ngContentSelectors ? componentDef.ngContentSelectors : [];
        _this.isBoundToModule = !!ngModule;
        return _this;
    }
    Object.defineProperty(ComponentFactory.prototype, "inputs", {
        get: function () {
            return toRefArray(this.componentDef.inputs);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ComponentFactory.prototype, "outputs", {
        get: function () {
            return toRefArray(this.componentDef.outputs);
        },
        enumerable: true,
        configurable: true
    });
    ComponentFactory.prototype.create = function (injector, projectableNodes, rootSelectorOrNode, ngModule) {
        ngModule = ngModule || this.ngModule;
        var rootViewInjector = ngModule ? createChainedInjector(injector, ngModule.injector) : injector;
        var rendererFactory = rootViewInjector.get(RendererFactory2, domRendererFactory3);
        var sanitizer = rootViewInjector.get(Sanitizer, null);
        var hostRenderer = rendererFactory.createRenderer(null, this.componentDef);
        // Determine a tag name used for creating host elements when this component is created
        // dynamically. Default to 'div' if this component did not specify any tag name in its selector.
        var elementName = this.componentDef.selectors[0][0] || 'div';
        var hostRNode = rootSelectorOrNode ?
            locateHostElement(hostRenderer, rootSelectorOrNode, this.componentDef.encapsulation) :
            elementCreate(elementName, rendererFactory.createRenderer(null, this.componentDef), getNamespace(elementName));
        var rootFlags = this.componentDef.onPush ? 64 /* Dirty */ | 512 /* IsRoot */ :
            16 /* CheckAlways */ | 512 /* IsRoot */;
        // Check whether this Component needs to be isolated from other components, i.e. whether it
        // should be placed into its own (empty) root context or existing root context should be used.
        // Note: this is internal-only convention and might change in the future, so it should not be
        // relied upon externally.
        var isIsolated = typeof rootSelectorOrNode === 'string' &&
            /^#root-ng-internal-isolated-\d+/.test(rootSelectorOrNode);
        var rootContext = createRootContext();
        // Create the root view. Uses empty TView and ContentTemplate.
        var rootTView = createTView(0 /* Root */, -1, null, 1, 0, null, null, null, null, null);
        var rootLView = createLView(null, rootTView, rootContext, rootFlags, null, null, rendererFactory, hostRenderer, sanitizer, rootViewInjector);
        var addVersion = rootSelectorOrNode && hostRNode ? VERSION.full : null;
        // rootView is the parent when bootstrapping
        // TODO(misko): it looks like we are entering view here but we don't really need to as
        // `renderView` does that. However as the code is written it is needed because
        // `createRootComponentView` and `createRootComponent` both read global state. Fixing those
        // issues would allow us to drop this.
        enterView(rootLView, null);
        var component;
        var tElementNode;
        try {
            var componentView = createRootComponentView(hostRNode, this.componentDef, rootLView, rendererFactory, hostRenderer, addVersion, null);
            tElementNode = getTNode(rootLView[TVIEW], 0);
            if (projectableNodes) {
                // projectable nodes can be passed as array of arrays or an array of iterables (ngUpgrade
                // case). Here we do normalize passed data structure to be an array of arrays to avoid
                // complex checks down the line.
                tElementNode.projection =
                    projectableNodes.map(function (nodesforSlot) { return Array.from(nodesforSlot); });
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
        var componentRef = new ComponentRef(this.componentType, component, createElementRef(viewEngine_ElementRef, tElementNode, rootLView), rootLView, tElementNode);
        if (!rootSelectorOrNode || isIsolated) {
            // The host element of the internal or isolated root view is attached to the component's host
            // view node.
            componentRef.hostView._tViewNode.child = tElementNode;
        }
        return componentRef;
    };
    return ComponentFactory;
}(viewEngine_ComponentFactory));
export { ComponentFactory };
var componentFactoryResolver = new ComponentFactoryResolver();
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
var ComponentRef = /** @class */ (function (_super) {
    __extends(ComponentRef, _super);
    function ComponentRef(componentType, instance, location, _rootLView, _tNode) {
        var _this = _super.call(this) || this;
        _this.location = location;
        _this._rootLView = _rootLView;
        _this._tNode = _tNode;
        _this.destroyCbs = [];
        _this.instance = instance;
        _this.hostView = _this.changeDetectorRef = new RootViewRef(_rootLView);
        _this.hostView._tViewNode = assignTViewNodeToLView(_rootLView[TVIEW], null, -1, _rootLView);
        _this.componentType = componentType;
        return _this;
    }
    Object.defineProperty(ComponentRef.prototype, "injector", {
        get: function () { return new NodeInjector(this._tNode, this._rootLView); },
        enumerable: true,
        configurable: true
    });
    ComponentRef.prototype.destroy = function () {
        if (this.destroyCbs) {
            this.destroyCbs.forEach(function (fn) { return fn(); });
            this.destroyCbs = null;
            !this.hostView.destroyed && this.hostView.destroy();
        }
    };
    ComponentRef.prototype.onDestroy = function (callback) {
        if (this.destroyCbs) {
            this.destroyCbs.push(callback);
        }
    };
    return ComponentRef;
}(viewEngine_ComponentRef));
export { ComponentRef };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBSXJELE9BQU8sRUFBQyxnQkFBZ0IsSUFBSSwyQkFBMkIsRUFBRSxZQUFZLElBQUksdUJBQXVCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNySSxPQUFPLEVBQUMsd0JBQXdCLElBQUksbUNBQW1DLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUNySCxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFMUUsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxxQ0FBcUMsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM3QyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDbkgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUdySSxPQUFPLEVB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Q3pCLEtBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksV0FBVyxDQUFJLFVBQVUsQ0FBQyxDQUFDO1FBQ3hFLEtBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxHQUFHLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDM0YsS0FBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7O0lBQ3JDLENBQUM7SUFFRCxzQkFBSSxrQ0FBUTthQUFaLGNBQTJCLE9BQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUVuRiw4QkFBTyxHQUFQO1FBQ0UsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25CLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQUEsRUFBRSxJQUFJLE9BQUEsRUFBRSxFQUFFLEVBQUosQ0FBSSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3JEO0lBQ0gsQ0FBQztJQUVELGdDQUFTLEdBQVQsVUFBVSxRQUFvQjtRQUM1QixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDaEM7SUFDSCxDQUFDO0lBQ0gsbUJBQUM7QUFBRCxDQUFDLEFBakNELENBQXFDLHVCQUF1QixHQWlDM0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyB2aWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHtWRVJTSU9OfSBmcm9tICcuLi92ZXJzaW9uJztcbmltcG9ydCB7Tk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUn0gZnJvbSAnLi4vdmlldy9wcm92aWRlcic7XG5cbmltcG9ydCB7YXNzZXJ0Q29tcG9uZW50VHlwZX0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMaWZlY3ljbGVIb29rc0ZlYXR1cmUsIGNyZWF0ZVJvb3RDb21wb25lbnQsIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3LCBjcmVhdGVSb290Q29udGV4dH0gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3Rvcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2Fzc2lnblRWaWV3Tm9kZVRvTFZpZXcsIGNyZWF0ZUxWaWV3LCBjcmVhdGVUVmlldywgZWxlbWVudENyZWF0ZSwgbG9jYXRlSG9zdEVsZW1lbnQsIHJlbmRlclZpZXd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Uk5vZGUsIFJlbmRlcmVyRmFjdG9yeTMsIGRvbVJlbmRlcmVyRmFjdG9yeTN9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0xWaWV3LCBMVmlld0ZsYWdzLCBUVklFVywgVFZpZXdUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge01BVEhfTUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFfSBmcm9tICcuL25hbWVzcGFjZXMnO1xuaW1wb3J0IHtzdHJpbmdpZnlDU1NTZWxlY3Rvckxpc3R9IGZyb20gJy4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBsZWF2ZVZpZXd9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtkZWZhdWx0U2NoZWR1bGVyfSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggYWxsIHJlc29sdmVkIGZhY3RvcmllcyBhcmUgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+KSB7IHN1cGVyKCk7IH1cblxuICByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnRUeXBlKGNvbXBvbmVudCk7XG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLm5nTW9kdWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1JlZkFycmF5KG1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgY29uc3QgYXJyYXk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10gPSBbXTtcbiAgZm9yIChsZXQgbm9uTWluaWZpZWQgaW4gbWFwKSB7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShub25NaW5pZmllZCkpIHtcbiAgICAgIGNvbnN0IG1pbmlmaWVkID0gbWFwW25vbk1pbmlmaWVkXTtcbiAgICAgIGFycmF5LnB1c2goe3Byb3BOYW1lOiBtaW5pZmllZCwgdGVtcGxhdGVOYW1lOiBub25NaW5pZmllZH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGdldE5hbWVzcGFjZShlbGVtZW50TmFtZTogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBuYW1lID0gZWxlbWVudE5hbWUudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIG5hbWUgPT09ICdzdmcnID8gU1ZHX05BTUVTUEFDRSA6IChuYW1lID09PSAnbWF0aCcgPyBNQVRIX01MX05BTUVTUEFDRSA6IG51bGwpO1xufVxuXG4vKipcbiAqIEEgY2hhbmdlIGRldGVjdGlvbiBzY2hlZHVsZXIgdG9rZW4gZm9yIHtAbGluayBSb290Q29udGV4dH0uIFRoaXMgdG9rZW4gaXMgdGhlIGRlZmF1bHQgdmFsdWUgdXNlZFxuICogZm9yIHRoZSBkZWZhdWx0IGBSb290Q29udGV4dGAgZm91bmQgaW4gdGhlIHtAbGluayBST09UX0NPTlRFWFR9IHRva2VuLlxuICovXG5leHBvcnQgY29uc3QgU0NIRURVTEVSID0gbmV3IEluamVjdGlvblRva2VuPCgoZm46ICgpID0+IHZvaWQpID0+IHZvaWQpPignU0NIRURVTEVSX1RPS0VOJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+IGRlZmF1bHRTY2hlZHVsZXIsXG59KTtcblxuZnVuY3Rpb24gY3JlYXRlQ2hhaW5lZEluamVjdG9yKHJvb3RWaWV3SW5qZWN0b3I6IEluamVjdG9yLCBtb2R1bGVJbmplY3RvcjogSW5qZWN0b3IpOiBJbmplY3RvciB7XG4gIHJldHVybiB7XG4gICAgZ2V0OiA8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSByb290Vmlld0luamVjdG9yLmdldCh0b2tlbiwgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiBhcyBULCBmbGFncyk7XG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiB8fFxuICAgICAgICAgIG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgICAgICAvLyAtIGl0IHByb3ZpZGVzIGl0XG4gICAgICAgIC8vICAgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKVxuICAgICAgICAvLyAtIHRoZSBtb2R1bGUgaW5qZWN0b3Igc2hvdWxkIG5vdCBiZSBjaGVja2VkXG4gICAgICAgIC8vICAgKG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1vZHVsZUluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSZW5kZXIzIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnl9LlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeTxUPiBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gIHNlbGVjdG9yOiBzdHJpbmc7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8YW55PjtcbiAgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXTtcbiAgaXNCb3VuZFRvTW9kdWxlOiBib29sZWFuO1xuXG4gIGdldCBpbnB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYuaW5wdXRzKTtcbiAgfVxuXG4gIGdldCBvdXRwdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLm91dHB1dHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBjb21wb25lbnREZWYgVGhlIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIHRoZSBmYWN0b3J5IGlzIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4sIHByaXZhdGUgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudERlZi50eXBlO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBzdHJpbmdpZnlDU1NTZWxlY3Rvckxpc3QoY29tcG9uZW50RGVmLnNlbGVjdG9ycyk7XG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPVxuICAgICAgICBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzID8gY29tcG9uZW50RGVmLm5nQ29udGVudFNlbGVjdG9ycyA6IFtdO1xuICAgIHRoaXMuaXNCb3VuZFRvTW9kdWxlID0gISFuZ01vZHVsZTtcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLCByb290U2VsZWN0b3JPck5vZGU/OiBhbnksXG4gICAgICBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gICAgbmdNb2R1bGUgPSBuZ01vZHVsZSB8fCB0aGlzLm5nTW9kdWxlO1xuXG4gICAgY29uc3Qgcm9vdFZpZXdJbmplY3RvciA9XG4gICAgICAgIG5nTW9kdWxlID8gY3JlYXRlQ2hhaW5lZEluamVjdG9yKGluamVjdG9yLCBuZ01vZHVsZS5pbmplY3RvcikgOiBpbmplY3RvcjtcblxuICAgIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9XG4gICAgICAgIHJvb3RWaWV3SW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIGRvbVJlbmRlcmVyRmFjdG9yeTMpIGFzIFJlbmRlcmVyRmFjdG9yeTM7XG4gICAgY29uc3Qgc2FuaXRpemVyID0gcm9vdFZpZXdJbmplY3Rvci5nZXQoU2FuaXRpemVyLCBudWxsKTtcblxuICAgIGNvbnN0IGhvc3RSZW5kZXJlciA9IHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZik7XG4gICAgLy8gRGV0ZXJtaW5lIGEgdGFnIG5hbWUgdXNlZCBmb3IgY3JlYXRpbmcgaG9zdCBlbGVtZW50cyB3aGVuIHRoaXMgY29tcG9uZW50IGlzIGNyZWF0ZWRcbiAgICAvLyBkeW5hbWljYWxseS4gRGVmYXVsdCB0byAnZGl2JyBpZiB0aGlzIGNvbXBvbmVudCBkaWQgbm90IHNwZWNpZnkgYW55IHRhZyBuYW1lIGluIGl0cyBzZWxlY3Rvci5cbiAgICBjb25zdCBlbGVtZW50TmFtZSA9IHRoaXMuY29tcG9uZW50RGVmLnNlbGVjdG9yc1swXVswXSBhcyBzdHJpbmcgfHwgJ2Rpdic7XG4gICAgY29uc3QgaG9zdFJOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlID9cbiAgICAgICAgbG9jYXRlSG9zdEVsZW1lbnQoaG9zdFJlbmRlcmVyLCByb290U2VsZWN0b3JPck5vZGUsIHRoaXMuY29tcG9uZW50RGVmLmVuY2Fwc3VsYXRpb24pIDpcbiAgICAgICAgZWxlbWVudENyZWF0ZShcbiAgICAgICAgICAgIGVsZW1lbnROYW1lLCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgdGhpcy5jb21wb25lbnREZWYpLFxuICAgICAgICAgICAgZ2V0TmFtZXNwYWNlKGVsZW1lbnROYW1lKSk7XG5cbiAgICBjb25zdCByb290RmxhZ3MgPSB0aGlzLmNvbXBvbmVudERlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5Jc1Jvb3QgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLklzUm9vdDtcblxuICAgIC8vIENoZWNrIHdoZXRoZXIgdGhpcyBDb21wb25lbnQgbmVlZHMgdG8gYmUgaXNvbGF0ZWQgZnJvbSBvdGhlciBjb21wb25lbnRzLCBpLmUuIHdoZXRoZXIgaXRcbiAgICAvLyBzaG91bGQgYmUgcGxhY2VkIGludG8gaXRzIG93biAoZW1wdHkpIHJvb3QgY29udGV4dCBvciBleGlzdGluZyByb290IGNvbnRleHQgc2hvdWxkIGJlIHVzZWQuXG4gICAgLy8gTm90ZTogdGhpcyBpcyBpbnRlcm5hbC1vbmx5IGNvbnZlbnRpb24gYW5kIG1pZ2h0IGNoYW5nZSBpbiB0aGUgZnV0dXJlLCBzbyBpdCBzaG91bGQgbm90IGJlXG4gICAgLy8gcmVsaWVkIHVwb24gZXh0ZXJuYWxseS5cbiAgICBjb25zdCBpc0lzb2xhdGVkID0gdHlwZW9mIHJvb3RTZWxlY3Rvck9yTm9kZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgL14jcm9vdC1uZy1pbnRlcm5hbC1pc29sYXRlZC1cXGQrLy50ZXN0KHJvb3RTZWxlY3Rvck9yTm9kZSk7XG5cbiAgICBjb25zdCByb290Q29udGV4dCA9IGNyZWF0ZVJvb3RDb250ZXh0KCk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHJvb3Qgdmlldy4gVXNlcyBlbXB0eSBUVmlldyBhbmQgQ29udGVudFRlbXBsYXRlLlxuICAgIGNvbnN0IHJvb3RUVmlldyA9IGNyZWF0ZVRWaWV3KFRWaWV3VHlwZS5Sb290LCAtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgY29uc3Qgcm9vdExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIG51bGwsIHJvb3RUVmlldywgcm9vdENvbnRleHQsIHJvb3RGbGFncywgbnVsbCwgbnVsbCwgcmVuZGVyZXJGYWN0b3J5LCBob3N0UmVuZGVyZXIsXG4gICAgICAgIHNhbml0aXplciwgcm9vdFZpZXdJbmplY3Rvcik7XG4gICAgY29uc3QgYWRkVmVyc2lvbiA9IHJvb3RTZWxlY3Rvck9yTm9kZSAmJiBob3N0Uk5vZGUgPyBWRVJTSU9OLmZ1bGwgOiBudWxsO1xuXG4gICAgLy8gcm9vdFZpZXcgaXMgdGhlIHBhcmVudCB3aGVuIGJvb3RzdHJhcHBpbmdcbiAgICAvLyBUT0RPKG1pc2tvKTogaXQgbG9va3MgbGlrZSB3ZSBhcmUgZW50ZXJpbmcgdmlldyBoZXJlIGJ1dCB3ZSBkb24ndCByZWFsbHkgbmVlZCB0byBhc1xuICAgIC8vIGByZW5kZXJWaWV3YCBkb2VzIHRoYXQuIEhvd2V2ZXIgYXMgdGhlIGNvZGUgaXMgd3JpdHRlbiBpdCBpcyBuZWVkZWQgYmVjYXVzZVxuICAgIC8vIGBjcmVhdGVSb290Q29tcG9uZW50Vmlld2AgYW5kIGBjcmVhdGVSb290Q29tcG9uZW50YCBib3RoIHJlYWQgZ2xvYmFsIHN0YXRlLiBGaXhpbmcgdGhvc2VcbiAgICAvLyBpc3N1ZXMgd291bGQgYWxsb3cgdXMgdG8gZHJvcCB0aGlzLlxuICAgIGVudGVyVmlldyhyb290TFZpZXcsIG51bGwpO1xuXG4gICAgbGV0IGNvbXBvbmVudDogVDtcbiAgICBsZXQgdEVsZW1lbnROb2RlOiBURWxlbWVudE5vZGU7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3KFxuICAgICAgICAgIGhvc3RSTm9kZSwgdGhpcy5jb21wb25lbnREZWYsIHJvb3RMVmlldywgcmVuZGVyZXJGYWN0b3J5LCBob3N0UmVuZGVyZXIsIGFkZFZlcnNpb24sIG51bGwpO1xuXG4gICAgICB0RWxlbWVudE5vZGUgPSBnZXRUTm9kZShyb290TFZpZXdbVFZJRVddLCAwKSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIGlmIChwcm9qZWN0YWJsZU5vZGVzKSB7XG4gICAgICAgIC8vIHByb2plY3RhYmxlIG5vZGVzIGNhbiBiZSBwYXNzZWQgYXMgYXJyYXkgb2YgYXJyYXlzIG9yIGFuIGFycmF5IG9mIGl0ZXJhYmxlcyAobmdVcGdyYWRlXG4gICAgICAgIC8vIGNhc2UpLiBIZXJlIHdlIGRvIG5vcm1hbGl6ZSBwYXNzZWQgZGF0YSBzdHJ1Y3R1cmUgdG8gYmUgYW4gYXJyYXkgb2YgYXJyYXlzIHRvIGF2b2lkXG4gICAgICAgIC8vIGNvbXBsZXggY2hlY2tzIGRvd24gdGhlIGxpbmUuXG4gICAgICAgIHRFbGVtZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgICAgIHByb2plY3RhYmxlTm9kZXMubWFwKChub2Rlc2ZvclNsb3Q6IFJOb2RlW10pID0+IHsgcmV0dXJuIEFycmF5LmZyb20obm9kZXNmb3JTbG90KTsgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsIHRoaXMuY29tcG9uZW50RGVmLCByb290TFZpZXcsIHJvb3RDb250ZXh0LCBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG5cbiAgICAgIHJlbmRlclZpZXcocm9vdFRWaWV3LCByb290TFZpZXcsIG51bGwpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBsZWF2ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRSZWYgPSBuZXcgQ29tcG9uZW50UmVmKFxuICAgICAgICB0aGlzLmNvbXBvbmVudFR5cGUsIGNvbXBvbmVudCxcbiAgICAgICAgY3JlYXRlRWxlbWVudFJlZih2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHRFbGVtZW50Tm9kZSwgcm9vdExWaWV3KSwgcm9vdExWaWV3LCB0RWxlbWVudE5vZGUpO1xuXG4gICAgaWYgKCFyb290U2VsZWN0b3JPck5vZGUgfHwgaXNJc29sYXRlZCkge1xuICAgICAgLy8gVGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgaW50ZXJuYWwgb3IgaXNvbGF0ZWQgcm9vdCB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBjb21wb25lbnQncyBob3N0XG4gICAgICAvLyB2aWV3IG5vZGUuXG4gICAgICBjb21wb25lbnRSZWYuaG9zdFZpZXcuX3RWaWV3Tm9kZSAhLmNoaWxkID0gdEVsZW1lbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICB9XG59XG5cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGVcbiAqIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlclxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnQgY3JlYXRlZCB2aWEgYSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0uXG4gKlxuICogYENvbXBvbmVudFJlZmAgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBDb21wb25lbnQgSW5zdGFuY2UgYXMgd2VsbCBvdGhlciBvYmplY3RzIHJlbGF0ZWQgdG8gdGhpc1xuICogQ29tcG9uZW50IEluc3RhbmNlIGFuZCBhbGxvd3MgeW91IHRvIGRlc3Ryb3kgdGhlIENvbXBvbmVudCBJbnN0YW5jZSB2aWEgdGhlIHtAbGluayAjZGVzdHJveX1cbiAqIG1ldGhvZC5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gIGRlc3Ryb3lDYnM6ICgoKSA9PiB2b2lkKVtdfG51bGwgPSBbXTtcbiAgaW5zdGFuY2U6IFQ7XG4gIGhvc3RWaWV3OiBWaWV3UmVmPFQ+O1xuICBjaGFuZ2VEZXRlY3RvclJlZjogVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZjtcbiAgY29tcG9uZW50VHlwZTogVHlwZTxUPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbXBvbmVudFR5cGU6IFR5cGU8VD4sIGluc3RhbmNlOiBULCBwdWJsaWMgbG9jYXRpb246IHZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICAgIHByaXZhdGUgX3Jvb3RMVmlldzogTFZpZXcsXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgIHRoaXMuaG9zdFZpZXcgPSB0aGlzLmNoYW5nZURldGVjdG9yUmVmID0gbmV3IFJvb3RWaWV3UmVmPFQ+KF9yb290TFZpZXcpO1xuICAgIHRoaXMuaG9zdFZpZXcuX3RWaWV3Tm9kZSA9IGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcoX3Jvb3RMVmlld1tUVklFV10sIG51bGwsIC0xLCBfcm9vdExWaWV3KTtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnRUeXBlO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IodGhpcy5fdE5vZGUsIHRoaXMuX3Jvb3RMVmlldyk7IH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lDYnMpIHtcbiAgICAgIHRoaXMuZGVzdHJveUNicy5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgdGhpcy5kZXN0cm95Q2JzID0gbnVsbDtcbiAgICAgICF0aGlzLmhvc3RWaWV3LmRlc3Ryb3llZCAmJiB0aGlzLmhvc3RWaWV3LmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kZXN0cm95Q2JzKSB7XG4gICAgICB0aGlzLmRlc3Ryb3lDYnMucHVzaChjYWxsYmFjayk7XG4gICAgfVxuICB9XG59XG4iXX0=