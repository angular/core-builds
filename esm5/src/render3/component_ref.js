/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { InjectionToken } from '../di/injection_token';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as viewEngine_ComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { Sanitizer } from '../sanitization/security';
import { VERSION } from '../version';
import { NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '../view/provider';
import { assertComponentType } from './assert';
import { LifecycleHooksFeature, createRootComponent, createRootComponentView, createRootContext } from './component';
import { getComponentDef } from './definition';
import { NodeInjector } from './di';
import { assignTViewNodeToLView, createLView, createTView, elementCreate, locateHostElement, refreshDescendantViews } from './instructions/shared';
import { domRendererFactory3, isProceduralRenderer } from './interfaces/renderer';
import { TVIEW } from './interfaces/view';
import { enterView, leaveView, namespaceHTMLInternal } from './state';
import { defaultScheduler } from './util/misc_utils';
import { getTNode } from './util/view_utils';
import { createElementRef } from './view_engine_compatibility';
import { RootViewRef } from './view_ref';
var ComponentFactoryResolver = /** @class */ (function (_super) {
    tslib_1.__extends(ComponentFactoryResolver, _super);
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
    tslib_1.__extends(ComponentFactory, _super);
    /**
     * @param componentDef The component definition.
     * @param ngModule The NgModuleRef to which the factory is bound.
     */
    function ComponentFactory(componentDef, ngModule) {
        var _this = _super.call(this) || this;
        _this.componentDef = componentDef;
        _this.ngModule = ngModule;
        _this.componentType = componentDef.type;
        // default to 'div' in case this component has an attribute selector
        _this.selector = componentDef.selectors[0][0] || 'div';
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
        // Ensure that the namespace for the root node is correct,
        // otherwise the browser might not render out the element properly.
        namespaceHTMLInternal();
        var hostRNode = rootSelectorOrNode ?
            locateHostElement(rendererFactory, rootSelectorOrNode) :
            elementCreate(this.selector, rendererFactory.createRenderer(null, this.componentDef));
        var rootFlags = this.componentDef.onPush ? 64 /* Dirty */ | 512 /* IsRoot */ :
            16 /* CheckAlways */ | 512 /* IsRoot */;
        // Check whether this Component needs to be isolated from other components, i.e. whether it
        // should be placed into its own (empty) root context or existing root context should be used.
        // Note: this is internal-only convention and might change in the future, so it should not be
        // relied upon externally.
        var isIsolated = typeof rootSelectorOrNode === 'string' &&
            /^#root-ng-internal-isolated-\d+/.test(rootSelectorOrNode);
        var rootContext = createRootContext();
        var renderer = rendererFactory.createRenderer(hostRNode, this.componentDef);
        if (rootSelectorOrNode && hostRNode) {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProceduralRenderer(renderer) ?
                renderer.setAttribute(hostRNode, 'ng-version', VERSION.full) :
                hostRNode.setAttribute('ng-version', VERSION.full);
        }
        // Create the root view. Uses empty TView and ContentTemplate.
        var rootLView = createLView(null, createTView(-1, null, 1, 0, null, null, null, null), rootContext, rootFlags, null, null, rendererFactory, renderer, sanitizer, rootViewInjector);
        // rootView is the parent when bootstrapping
        var oldLView = enterView(rootLView, null);
        var component;
        var tElementNode;
        // Will become true if the `try` block executes with no errors.
        var safeToRunHooks = false;
        try {
            var componentView = createRootComponentView(hostRNode, this.componentDef, rootLView, rendererFactory, renderer);
            tElementNode = getTNode(0, rootLView);
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
            refreshDescendantViews(rootLView);
            safeToRunHooks = true;
        }
        finally {
            leaveView(oldLView, safeToRunHooks);
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
    tslib_1.__extends(ComponentRef, _super);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBSXJELE9BQU8sRUFBQyxnQkFBZ0IsSUFBSSwyQkFBMkIsRUFBRSxZQUFZLElBQUksdUJBQXVCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNySSxPQUFPLEVBQUMsd0JBQXdCLElBQUksbUNBQW1DLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUNySCxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFMUUsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxxQ0FBcUMsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM3QyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUUsdUJBQXVCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDbkgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xDLE9BQU8sRUFBZ0Isc0JBQXNCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUdoSyxPQUFPLEVBQTBCLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDekcsT0FBTyxFQUFvQixLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNwRSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0MsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDN0QsT0FBTyxFQUFDLFdBQVcsRUFBVSxNQUFNLFlBQVksQ0FBQztBQUVoRDtJQUE4QyxvREFBbUM7SUFDL0U7O09BRUc7SUFDSCxrQ0FBb0IsUUFBc0M7UUFBMUQsWUFBOEQsaUJBQU8sU0FBRztRQUFwRCxjQUFRLEdBQVIsUUFBUSxDQUE4Qjs7SUFBYSxDQUFDO0lBRXhFLDBEQUF1QixHQUF2QixVQUEyQixTQUFrQjtRQUMzQyxTQUFTLElBQUksbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUMsSUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLFNBQVMsQ0FBRyxDQUFDO1FBQ2xELE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFDSCwrQkFBQztBQUFELENBQUMsQUFYRCxDQUE4QyxtQ0FBbUMsR0FXaEY7O0FBRUQsU0FBUyxVQUFVLENBQUMsR0FBNEI7SUFDOUMsSUFBTSxLQUFLLEdBQWdELEVBQUUsQ0FBQztJQUM5RCxLQUFLLElBQUksV0FBVyxJQUFJLEdBQUcsRUFBRTtRQUMzQixJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDbkMsSUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2xDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUMsQ0FBQyxDQUFDO1NBQzdEO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsSUFBTSxTQUFTLEdBQUcsSUFBSSxjQUFjLENBQTZCLGlCQUFpQixFQUFFO0lBQ3pGLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxjQUFNLE9BQUEsZ0JBQWdCLEVBQWhCLENBQWdCO0NBQ2hDLENBQUMsQ0FBQztBQUVILFNBQVMscUJBQXFCLENBQUMsZ0JBQTBCLEVBQUUsY0FBd0I7SUFDakYsT0FBTztRQUNMLEdBQUcsRUFBRSxVQUFJLEtBQWlDLEVBQUUsYUFBaUIsRUFBRSxLQUFtQjtZQUNoRixJQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLHFDQUEwQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTdGLElBQUksS0FBSyxLQUFLLHFDQUFxQztnQkFDL0MsYUFBYSxLQUFLLHFDQUFxQyxFQUFFO2dCQUMzRCx1REFBdUQ7Z0JBQ3ZELG1CQUFtQjtnQkFDbkIsc0RBQXNEO2dCQUN0RCw4Q0FBOEM7Z0JBQzlDLDhEQUE4RDtnQkFDOUQsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUVELE9BQU8sY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pELENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVEOztHQUVHO0FBQ0g7SUFBeUMsNENBQThCO0lBY3JFOzs7T0FHRztJQUNILDBCQUNZLFlBQStCLEVBQVUsUUFBc0M7UUFEM0YsWUFFRSxpQkFBTyxTQVFSO1FBVFcsa0JBQVksR0FBWixZQUFZLENBQW1CO1FBQVUsY0FBUSxHQUFSLFFBQVEsQ0FBOEI7UUFFekYsS0FBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBRXZDLG9FQUFvRTtRQUNwRSxLQUFJLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXLElBQUksS0FBSyxDQUFDO1FBQ2hFLEtBQUksQ0FBQyxrQkFBa0I7WUFDbkIsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUMzRSxLQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7O0lBQ3BDLENBQUM7SUF0QkQsc0JBQUksb0NBQU07YUFBVjtZQUNFLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUMsQ0FBQzs7O09BQUE7SUFFRCxzQkFBSSxxQ0FBTzthQUFYO1lBQ0UsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQyxDQUFDOzs7T0FBQTtJQWtCRCxpQ0FBTSxHQUFOLFVBQ0ksUUFBa0IsRUFBRSxnQkFBb0MsRUFBRSxrQkFBd0IsRUFDbEYsUUFBZ0Q7UUFDbEQsUUFBUSxHQUFHLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDO1FBRXJDLElBQU0sZ0JBQWdCLEdBQ2xCLFFBQVEsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBRTdFLElBQU0sZUFBZSxHQUNqQixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsbUJBQW1CLENBQXFCLENBQUM7UUFDcEYsSUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV4RCwwREFBMEQ7UUFDMUQsbUVBQW1FO1FBQ25FLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsSUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMsQ0FBQztZQUNsQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ3hELGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBRTFGLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxpQ0FBb0MsQ0FBQyxDQUFDO1lBQ3RDLHVDQUEwQyxDQUFDO1FBRXhGLDJGQUEyRjtRQUMzRiw4RkFBOEY7UUFDOUYsNkZBQTZGO1FBQzdGLDBCQUEwQjtRQUMxQixJQUFNLFVBQVUsR0FBRyxPQUFPLGtCQUFrQixLQUFLLFFBQVE7WUFDckQsaUNBQWlDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFL0QsSUFBTSxXQUFXLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztRQUN4QyxJQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFOUUsSUFBSSxrQkFBa0IsSUFBSSxTQUFTLEVBQUU7WUFDbkMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzlDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsU0FBUyxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hEO1FBRUQsOERBQThEO1FBQzlELElBQU0sU0FBUyxHQUFHLFdBQVcsQ0FDekIsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLElBQUksRUFDdkYsSUFBSSxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFbEUsNENBQTRDO1FBQzVDLElBQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsSUFBSSxTQUFZLENBQUM7UUFDakIsSUFBSSxZQUEwQixDQUFDO1FBRS9CLCtEQUErRDtRQUMvRCxJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7UUFDM0IsSUFBSTtZQUNGLElBQU0sYUFBYSxHQUFHLHVCQUF1QixDQUN6QyxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXhFLFlBQVksR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBaUIsQ0FBQztZQUV0RCxJQUFJLGdCQUFnQixFQUFFO2dCQUNwQix5RkFBeUY7Z0JBQ3pGLHNGQUFzRjtnQkFDdEYsZ0NBQWdDO2dCQUNoQyxZQUFZLENBQUMsVUFBVTtvQkFDbkIsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQUMsWUFBcUIsSUFBTyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMzRjtZQUVELDhGQUE4RjtZQUM5RixpQkFBaUI7WUFDakIseUVBQXlFO1lBQ3pFLFNBQVMsR0FBRyxtQkFBbUIsQ0FDM0IsYUFBYSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUV2RixzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1NBQ3ZCO2dCQUFTO1lBQ1IsU0FBUyxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztTQUNyQztRQUVELElBQU0sWUFBWSxHQUFHLElBQUksWUFBWSxDQUNqQyxJQUFJLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFDN0IsZ0JBQWdCLENBQUMscUJBQXFCLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUUvRixJQUFJLENBQUMsa0JBQWtCLElBQUksVUFBVSxFQUFFO1lBQ3JDLDZGQUE2RjtZQUM3RixhQUFhO1lBQ2IsWUFBWSxDQUFDLFFBQVEsQ0FBQyxVQUFZLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQztTQUN6RDtRQUNELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFDSCx1QkFBQztBQUFELENBQUMsQUF2SEQsQ0FBeUMsMkJBQTJCLEdBdUhuRTs7QUFFRCxJQUFNLHdCQUF3QixHQUE2QixJQUFJLHdCQUF3QixFQUFFLENBQUM7QUFFMUY7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLDhCQUE4QjtJQUM1QyxPQUFPLHdCQUF3QixDQUFDO0FBQ2xDLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0g7SUFBcUMsd0NBQTBCO0lBTzdELHNCQUNJLGFBQXNCLEVBQUUsUUFBVyxFQUFTLFFBQStCLEVBQ25FLFVBQWlCLEVBQ2pCLE1BQXlEO1FBSHJFLFlBSUUsaUJBQU8sU0FLUjtRQVIrQyxjQUFRLEdBQVIsUUFBUSxDQUF1QjtRQUNuRSxnQkFBVSxHQUFWLFVBQVUsQ0FBTztRQUNqQixZQUFNLEdBQU4sTUFBTSxDQUFtRDtRQVRyRSxnQkFBVSxHQUF3QixFQUFFLENBQUM7UUFXbkMsS0FBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsS0FBSSxDQUFDLFFBQVEsR0FBRyxLQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxXQUFXLENBQUksVUFBVSxDQUFDLENBQUM7UUFDeEUsS0FBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsc0JBQXNCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMzRixLQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQzs7SUFDckMsQ0FBQztJQUVELHNCQUFJLGtDQUFRO2FBQVosY0FBMkIsT0FBTyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRW5GLDhCQUFPLEdBQVA7UUFDRSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQSxFQUFFLElBQUksT0FBQSxFQUFFLEVBQUUsRUFBSixDQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDckQ7SUFDSCxDQUFDO0lBRUQsZ0NBQVMsR0FBVCxVQUFVLFFBQW9CO1FBQzVCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNoQztJQUNILENBQUM7SUFDSCxtQkFBQztBQUFELENBQUMsQUFqQ0QsQ0FBcUMsdUJBQXVCLEdBaUMzRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7VkVSU0lPTn0gZnJvbSAnLi4vdmVyc2lvbic7XG5pbXBvcnQge05PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1J9IGZyb20gJy4uL3ZpZXcvcHJvdmlkZXInO1xuXG5pbXBvcnQge2Fzc2VydENvbXBvbmVudFR5cGV9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TGlmZWN5Y2xlSG9va3NGZWF0dXJlLCBjcmVhdGVSb290Q29tcG9uZW50LCBjcmVhdGVSb290Q29tcG9uZW50VmlldywgY3JlYXRlUm9vdENvbnRleHR9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3J9IGZyb20gJy4vZGknO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBhc3NpZ25UVmlld05vZGVUb0xWaWV3LCBjcmVhdGVMVmlldywgY3JlYXRlVFZpZXcsIGVsZW1lbnRDcmVhdGUsIGxvY2F0ZUhvc3RFbGVtZW50LCByZWZyZXNoRGVzY2VuZGFudFZpZXdzfSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JOb2RlLCBSZW5kZXJlckZhY3RvcnkzLCBkb21SZW5kZXJlckZhY3RvcnkzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIExWaWV3RmxhZ3MsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2VudGVyVmlldywgbGVhdmVWaWV3LCBuYW1lc3BhY2VIVE1MSW50ZXJuYWx9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtkZWZhdWx0U2NoZWR1bGVyfSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggYWxsIHJlc29sdmVkIGZhY3RvcmllcyBhcmUgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+KSB7IHN1cGVyKCk7IH1cblxuICByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRDb21wb25lbnRUeXBlKGNvbXBvbmVudCk7XG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudCkgITtcbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLm5nTW9kdWxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b1JlZkFycmF5KG1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30pOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgY29uc3QgYXJyYXk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10gPSBbXTtcbiAgZm9yIChsZXQgbm9uTWluaWZpZWQgaW4gbWFwKSB7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShub25NaW5pZmllZCkpIHtcbiAgICAgIGNvbnN0IG1pbmlmaWVkID0gbWFwW25vbk1pbmlmaWVkXTtcbiAgICAgIGFycmF5LnB1c2goe3Byb3BOYW1lOiBtaW5pZmllZCwgdGVtcGxhdGVOYW1lOiBub25NaW5pZmllZH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbi8qKlxuICogQSBjaGFuZ2UgZGV0ZWN0aW9uIHNjaGVkdWxlciB0b2tlbiBmb3Ige0BsaW5rIFJvb3RDb250ZXh0fS4gVGhpcyB0b2tlbiBpcyB0aGUgZGVmYXVsdCB2YWx1ZSB1c2VkXG4gKiBmb3IgdGhlIGRlZmF1bHQgYFJvb3RDb250ZXh0YCBmb3VuZCBpbiB0aGUge0BsaW5rIFJPT1RfQ09OVEVYVH0gdG9rZW4uXG4gKi9cbmV4cG9ydCBjb25zdCBTQ0hFRFVMRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48KChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk+KCdTQ0hFRFVMRVJfVE9LRU4nLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4gZGVmYXVsdFNjaGVkdWxlcixcbn0pO1xuXG5mdW5jdGlvbiBjcmVhdGVDaGFpbmVkSW5qZWN0b3Iocm9vdFZpZXdJbmplY3RvcjogSW5qZWN0b3IsIG1vZHVsZUluamVjdG9yOiBJbmplY3Rvcik6IEluamVjdG9yIHtcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVCA9PiB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHJvb3RWaWV3SW5qZWN0b3IuZ2V0KHRva2VuLCBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SIGFzIFQsIGZsYWdzKTtcblxuICAgICAgaWYgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SIHx8XG4gICAgICAgICAgbm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUikge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIHZhbHVlIGZyb20gdGhlIHJvb3QgZWxlbWVudCBpbmplY3RvciB3aGVuXG4gICAgICAgIC8vIC0gaXQgcHJvdmlkZXMgaXRcbiAgICAgICAgLy8gICAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAgIC8vIC0gdGhlIG1vZHVsZSBpbmplY3RvciBzaG91bGQgbm90IGJlIGNoZWNrZWRcbiAgICAgICAgLy8gICAobm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUilcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbW9kdWxlSW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlbmRlcjMgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeX0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuICBpc0JvdW5kVG9Nb2R1bGU6IGJvb2xlYW47XG5cbiAgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5pbnB1dHMpO1xuICB9XG5cbiAgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cyk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGNvbXBvbmVudERlZiBUaGUgY29tcG9uZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSBuZ01vZHVsZSBUaGUgTmdNb2R1bGVSZWYgdG8gd2hpY2ggdGhlIGZhY3RvcnkgaXMgYm91bmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8YW55PiwgcHJpdmF0ZSBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG5cbiAgICAvLyBkZWZhdWx0IHRvICdkaXYnIGluIGNhc2UgdGhpcyBjb21wb25lbnQgaGFzIGFuIGF0dHJpYnV0ZSBzZWxlY3RvclxuICAgIHRoaXMuc2VsZWN0b3IgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdWzBdIGFzIHN0cmluZyB8fCAnZGl2JztcbiAgICB0aGlzLm5nQ29udGVudFNlbGVjdG9ycyA9XG4gICAgICAgIGNvbXBvbmVudERlZi5uZ0NvbnRlbnRTZWxlY3RvcnMgPyBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzIDogW107XG4gICAgdGhpcy5pc0JvdW5kVG9Nb2R1bGUgPSAhIW5nTW9kdWxlO1xuICB9XG5cbiAgY3JlYXRlKFxuICAgICAgaW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsIHJvb3RTZWxlY3Rvck9yTm9kZT86IGFueSxcbiAgICAgIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPFQ+IHtcbiAgICBuZ01vZHVsZSA9IG5nTW9kdWxlIHx8IHRoaXMubmdNb2R1bGU7XG5cbiAgICBjb25zdCByb290Vmlld0luamVjdG9yID1cbiAgICAgICAgbmdNb2R1bGUgPyBjcmVhdGVDaGFpbmVkSW5qZWN0b3IoaW5qZWN0b3IsIG5nTW9kdWxlLmluamVjdG9yKSA6IGluamVjdG9yO1xuXG4gICAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID1cbiAgICAgICAgcm9vdFZpZXdJbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MiwgZG9tUmVuZGVyZXJGYWN0b3J5MykgYXMgUmVuZGVyZXJGYWN0b3J5MztcbiAgICBjb25zdCBzYW5pdGl6ZXIgPSByb290Vmlld0luamVjdG9yLmdldChTYW5pdGl6ZXIsIG51bGwpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIG5hbWVzcGFjZSBmb3IgdGhlIHJvb3Qgbm9kZSBpcyBjb3JyZWN0LFxuICAgIC8vIG90aGVyd2lzZSB0aGUgYnJvd3NlciBtaWdodCBub3QgcmVuZGVyIG91dCB0aGUgZWxlbWVudCBwcm9wZXJseS5cbiAgICBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKTtcbiAgICBjb25zdCBob3N0Uk5vZGUgPSByb290U2VsZWN0b3JPck5vZGUgP1xuICAgICAgICBsb2NhdGVIb3N0RWxlbWVudChyZW5kZXJlckZhY3RvcnksIHJvb3RTZWxlY3Rvck9yTm9kZSkgOlxuICAgICAgICBlbGVtZW50Q3JlYXRlKHRoaXMuc2VsZWN0b3IsIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZikpO1xuXG4gICAgY29uc3Qgcm9vdEZsYWdzID0gdGhpcy5jb21wb25lbnREZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuSXNSb290IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3Q7XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHRoaXMgQ29tcG9uZW50IG5lZWRzIHRvIGJlIGlzb2xhdGVkIGZyb20gb3RoZXIgY29tcG9uZW50cywgaS5lLiB3aGV0aGVyIGl0XG4gICAgLy8gc2hvdWxkIGJlIHBsYWNlZCBpbnRvIGl0cyBvd24gKGVtcHR5KSByb290IGNvbnRleHQgb3IgZXhpc3Rpbmcgcm9vdCBjb250ZXh0IHNob3VsZCBiZSB1c2VkLlxuICAgIC8vIE5vdGU6IHRoaXMgaXMgaW50ZXJuYWwtb25seSBjb252ZW50aW9uIGFuZCBtaWdodCBjaGFuZ2UgaW4gdGhlIGZ1dHVyZSwgc28gaXQgc2hvdWxkIG5vdCBiZVxuICAgIC8vIHJlbGllZCB1cG9uIGV4dGVybmFsbHkuXG4gICAgY29uc3QgaXNJc29sYXRlZCA9IHR5cGVvZiByb290U2VsZWN0b3JPck5vZGUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgIC9eI3Jvb3QtbmctaW50ZXJuYWwtaXNvbGF0ZWQtXFxkKy8udGVzdChyb290U2VsZWN0b3JPck5vZGUpO1xuXG4gICAgY29uc3Qgcm9vdENvbnRleHQgPSBjcmVhdGVSb290Q29udGV4dCgpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3RSTm9kZSwgdGhpcy5jb21wb25lbnREZWYpO1xuXG4gICAgaWYgKHJvb3RTZWxlY3Rvck9yTm9kZSAmJiBob3N0Uk5vZGUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGhvc3RSTm9kZSwgJ25nLXZlcnNpb24nLCBWRVJTSU9OLmZ1bGwpIDpcbiAgICAgICAgICBob3N0Uk5vZGUuc2V0QXR0cmlidXRlKCduZy12ZXJzaW9uJywgVkVSU0lPTi5mdWxsKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdGhlIHJvb3Qgdmlldy4gVXNlcyBlbXB0eSBUVmlldyBhbmQgQ29udGVudFRlbXBsYXRlLlxuICAgIGNvbnN0IHJvb3RMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBudWxsLCBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCksIHJvb3RDb250ZXh0LCByb290RmxhZ3MsIG51bGwsXG4gICAgICAgIG51bGwsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsIHNhbml0aXplciwgcm9vdFZpZXdJbmplY3Rvcik7XG5cbiAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgIGNvbnN0IG9sZExWaWV3ID0gZW50ZXJWaWV3KHJvb3RMVmlldywgbnVsbCk7XG5cbiAgICBsZXQgY29tcG9uZW50OiBUO1xuICAgIGxldCB0RWxlbWVudE5vZGU6IFRFbGVtZW50Tm9kZTtcblxuICAgIC8vIFdpbGwgYmVjb21lIHRydWUgaWYgdGhlIGB0cnlgIGJsb2NrIGV4ZWN1dGVzIHdpdGggbm8gZXJyb3JzLlxuICAgIGxldCBzYWZlVG9SdW5Ib29rcyA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgICAgaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZiwgcm9vdExWaWV3LCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyKTtcblxuICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUoMCwgcm9vdExWaWV3KSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIGlmIChwcm9qZWN0YWJsZU5vZGVzKSB7XG4gICAgICAgIC8vIHByb2plY3RhYmxlIG5vZGVzIGNhbiBiZSBwYXNzZWQgYXMgYXJyYXkgb2YgYXJyYXlzIG9yIGFuIGFycmF5IG9mIGl0ZXJhYmxlcyAobmdVcGdyYWRlXG4gICAgICAgIC8vIGNhc2UpLiBIZXJlIHdlIGRvIG5vcm1hbGl6ZSBwYXNzZWQgZGF0YSBzdHJ1Y3R1cmUgdG8gYmUgYW4gYXJyYXkgb2YgYXJyYXlzIHRvIGF2b2lkXG4gICAgICAgIC8vIGNvbXBsZXggY2hlY2tzIGRvd24gdGhlIGxpbmUuXG4gICAgICAgIHRFbGVtZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgICAgIHByb2plY3RhYmxlTm9kZXMubWFwKChub2Rlc2ZvclNsb3Q6IFJOb2RlW10pID0+IHsgcmV0dXJuIEFycmF5LmZyb20obm9kZXNmb3JTbG90KTsgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsIHRoaXMuY29tcG9uZW50RGVmLCByb290TFZpZXcsIHJvb3RDb250ZXh0LCBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG5cbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3Mocm9vdExWaWV3KTtcbiAgICAgIHNhZmVUb1J1bkhvb2tzID0gdHJ1ZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgbGVhdmVWaWV3KG9sZExWaWV3LCBzYWZlVG9SdW5Ib29rcyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50UmVmID0gbmV3IENvbXBvbmVudFJlZihcbiAgICAgICAgdGhpcy5jb21wb25lbnRUeXBlLCBjb21wb25lbnQsXG4gICAgICAgIGNyZWF0ZUVsZW1lbnRSZWYodmlld0VuZ2luZV9FbGVtZW50UmVmLCB0RWxlbWVudE5vZGUsIHJvb3RMVmlldyksIHJvb3RMVmlldywgdEVsZW1lbnROb2RlKTtcblxuICAgIGlmICghcm9vdFNlbGVjdG9yT3JOb2RlIHx8IGlzSXNvbGF0ZWQpIHtcbiAgICAgIC8vIFRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGludGVybmFsIG9yIGlzb2xhdGVkIHJvb3QgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgY29tcG9uZW50J3MgaG9zdFxuICAgICAgLy8gdmlldyBub2RlLlxuICAgICAgY29tcG9uZW50UmVmLmhvc3RWaWV3Ll90Vmlld05vZGUgIS5jaGlsZCA9IHRFbGVtZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxufVxuXG5jb25zdCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IG5ldyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlXG4gKiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgQ29tcG9uZW50IGNyZWF0ZWQgdmlhIGEge0BsaW5rIENvbXBvbmVudEZhY3Rvcnl9LlxuICpcbiAqIGBDb21wb25lbnRSZWZgIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgQ29tcG9uZW50IEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIENvbXBvbmVudCBJbnN0YW5jZSBhbmQgYWxsb3dzIHlvdSB0byBkZXN0cm95IHRoZSBDb21wb25lbnQgSW5zdGFuY2UgdmlhIHRoZSB7QGxpbmsgI2Rlc3Ryb3l9XG4gKiBtZXRob2QuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50UmVmPFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICBkZXN0cm95Q2JzOiAoKCkgPT4gdm9pZClbXXxudWxsID0gW107XG4gIGluc3RhbmNlOiBUO1xuICBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcHVibGljIGxvY2F0aW9uOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICBwcml2YXRlIF9yb290TFZpZXc6IExWaWV3LFxuICAgICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSBpbnN0YW5jZTtcbiAgICB0aGlzLmhvc3RWaWV3ID0gdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBSb290Vmlld1JlZjxUPihfcm9vdExWaWV3KTtcbiAgICB0aGlzLmhvc3RWaWV3Ll90Vmlld05vZGUgPSBhc3NpZ25UVmlld05vZGVUb0xWaWV3KF9yb290TFZpZXdbVFZJRVddLCBudWxsLCAtMSwgX3Jvb3RMVmlldyk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBuZXcgTm9kZUluamVjdG9yKHRoaXMuX3ROb2RlLCB0aGlzLl9yb290TFZpZXcpOyB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kZXN0cm95Q2JzKSB7XG4gICAgICB0aGlzLmRlc3Ryb3lDYnMuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICAgIHRoaXMuZGVzdHJveUNicyA9IG51bGw7XG4gICAgICAhdGhpcy5ob3N0Vmlldy5kZXN0cm95ZWQgJiYgdGhpcy5ob3N0Vmlldy5kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZGVzdHJveUNicykge1xuICAgICAgdGhpcy5kZXN0cm95Q2JzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgfVxufVxuIl19