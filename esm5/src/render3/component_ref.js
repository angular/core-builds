/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { InjectionToken } from '../di/injection_token';
import { ɵɵinject } from '../di/injector_compatibility';
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
import { addToViewTree, assignTViewNodeToLView, createLView, createTView, elementCreate, locateHostElement, refreshDescendantViews } from './instructions/shared';
import { domRendererFactory3, isProceduralRenderer } from './interfaces/renderer';
import { TVIEW } from './interfaces/view';
import { enterView, leaveView } from './state';
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
 * Default {@link RootContext} for all components rendered with {@link renderComponent}.
 */
export var ROOT_CONTEXT = new InjectionToken('ROOT_CONTEXT_TOKEN', { providedIn: 'root', factory: function () { return createRootContext(ɵɵinject(SCHEDULER)); } });
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
        _this.selector = componentDef.selectors[0][0];
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
        var isInternalRootView = rootSelectorOrNode === undefined;
        ngModule = ngModule || this.ngModule;
        var rootViewInjector = ngModule ? createChainedInjector(injector, ngModule.injector) : injector;
        var rendererFactory = rootViewInjector.get(RendererFactory2, domRendererFactory3);
        var sanitizer = rootViewInjector.get(Sanitizer, null);
        var hostRNode = isInternalRootView ?
            elementCreate(this.selector, rendererFactory.createRenderer(null, this.componentDef)) :
            locateHostElement(rendererFactory, rootSelectorOrNode);
        var rootFlags = this.componentDef.onPush ? 64 /* Dirty */ | 512 /* IsRoot */ :
            16 /* CheckAlways */ | 512 /* IsRoot */;
        // Check whether this Component needs to be isolated from other components, i.e. whether it
        // should be placed into its own (empty) root context or existing root context should be used.
        // Note: this is internal-only convention and might change in the future, so it should not be
        // relied upon externally.
        var isIsolated = typeof rootSelectorOrNode === 'string' &&
            /^#root-ng-internal-isolated-\d+/.test(rootSelectorOrNode);
        var rootContext = (isInternalRootView || isIsolated) ?
            createRootContext() :
            rootViewInjector.get(ROOT_CONTEXT);
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
            addToViewTree(rootLView, componentView);
            refreshDescendantViews(rootLView);
            safeToRunHooks = true;
        }
        finally {
            leaveView(oldLView, safeToRunHooks);
        }
        var componentRef = new ComponentRef(this.componentType, component, createElementRef(viewEngine_ElementRef, tElementNode, rootLView), rootLView, tElementNode);
        if (isInternalRootView) {
            // The host element of the internal root view is attached to the component's host view node
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXJELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUd0RCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksMkJBQTJCLEVBQUUsWUFBWSxJQUFJLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDckksT0FBTyxFQUFDLHdCQUF3QixJQUFJLG1DQUFtQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDckgsT0FBTyxFQUFDLFVBQVUsSUFBSSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMvQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDbkQsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUMscUNBQXFDLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV2RSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0MsT0FBTyxFQUFDLHFCQUFxQixFQUFFLG1CQUFtQixFQUFFLHVCQUF1QixFQUFFLGlCQUFpQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ25ILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNsQyxPQUFPLEVBQUMsYUFBYSxFQUFFLHNCQUFzQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFF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Yy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge8m1ybVpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgdmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlckZhY3RvcnkyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHtWRVJTSU9OfSBmcm9tICcuLi92ZXJzaW9uJztcbmltcG9ydCB7Tk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUn0gZnJvbSAnLi4vdmlldy9wcm92aWRlcic7XG5cbmltcG9ydCB7YXNzZXJ0Q29tcG9uZW50VHlwZX0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMaWZlY3ljbGVIb29rc0ZlYXR1cmUsIGNyZWF0ZVJvb3RDb21wb25lbnQsIGNyZWF0ZVJvb3RDb21wb25lbnRWaWV3LCBjcmVhdGVSb290Q29udGV4dH0gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3Rvcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcsIGNyZWF0ZUxWaWV3LCBjcmVhdGVUVmlldywgZWxlbWVudENyZWF0ZSwgbG9jYXRlSG9zdEVsZW1lbnQsIHJlZnJlc2hEZXNjZW5kYW50Vmlld3N9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Uk5vZGUsIFJlbmRlcmVyRmFjdG9yeTMsIGRvbVJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlldywgTFZpZXdGbGFncywgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2VudGVyVmlldywgbGVhdmVWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7ZGVmYXVsdFNjaGVkdWxlcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRUTm9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50UmVmfSBmcm9tICcuL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtSb290Vmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIGFsbCByZXNvbHZlZCBmYWN0b3JpZXMgYXJlIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55PikgeyBzdXBlcigpOyB9XG5cbiAgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpICE7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy5uZ01vZHVsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIERlZmF1bHQge0BsaW5rIFJvb3RDb250ZXh0fSBmb3IgYWxsIGNvbXBvbmVudHMgcmVuZGVyZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGNvbnN0IFJPT1RfQ09OVEVYVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSb290Q29udGV4dD4oXG4gICAgJ1JPT1RfQ09OVEVYVF9UT0tFTicsXG4gICAge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gY3JlYXRlUm9vdENvbnRleHQoybXJtWluamVjdChTQ0hFRFVMRVIpKX0pO1xuXG4vKipcbiAqIEEgY2hhbmdlIGRldGVjdGlvbiBzY2hlZHVsZXIgdG9rZW4gZm9yIHtAbGluayBSb290Q29udGV4dH0uIFRoaXMgdG9rZW4gaXMgdGhlIGRlZmF1bHQgdmFsdWUgdXNlZFxuICogZm9yIHRoZSBkZWZhdWx0IGBSb290Q29udGV4dGAgZm91bmQgaW4gdGhlIHtAbGluayBST09UX0NPTlRFWFR9IHRva2VuLlxuICovXG5leHBvcnQgY29uc3QgU0NIRURVTEVSID0gbmV3IEluamVjdGlvblRva2VuPCgoZm46ICgpID0+IHZvaWQpID0+IHZvaWQpPignU0NIRURVTEVSX1RPS0VOJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+IGRlZmF1bHRTY2hlZHVsZXIsXG59KTtcblxuZnVuY3Rpb24gY3JlYXRlQ2hhaW5lZEluamVjdG9yKHJvb3RWaWV3SW5qZWN0b3I6IEluamVjdG9yLCBtb2R1bGVJbmplY3RvcjogSW5qZWN0b3IpOiBJbmplY3RvciB7XG4gIHJldHVybiB7XG4gICAgZ2V0OiA8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSByb290Vmlld0luamVjdG9yLmdldCh0b2tlbiwgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiBhcyBULCBmbGFncyk7XG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiB8fFxuICAgICAgICAgIG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgICAgICAvLyAtIGl0IHByb3ZpZGVzIGl0XG4gICAgICAgIC8vICAgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKVxuICAgICAgICAvLyAtIHRoZSBtb2R1bGUgaW5qZWN0b3Igc2hvdWxkIG5vdCBiZSBjaGVja2VkXG4gICAgICAgIC8vICAgKG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG1vZHVsZUluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSZW5kZXIzIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnl9LlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeTxUPiBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gIHNlbGVjdG9yOiBzdHJpbmc7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8YW55PjtcbiAgbmdDb250ZW50U2VsZWN0b3JzOiBzdHJpbmdbXTtcbiAgaXNCb3VuZFRvTW9kdWxlOiBib29sZWFuO1xuXG4gIGdldCBpbnB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYuaW5wdXRzKTtcbiAgfVxuXG4gIGdldCBvdXRwdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLm91dHB1dHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBjb21wb25lbnREZWYgVGhlIGNvbXBvbmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0gbmdNb2R1bGUgVGhlIE5nTW9kdWxlUmVmIHRvIHdoaWNoIHRoZSBmYWN0b3J5IGlzIGJvdW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmPGFueT4sIHByaXZhdGUgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudERlZi50eXBlO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdWzBdIGFzIHN0cmluZztcbiAgICB0aGlzLm5nQ29udGVudFNlbGVjdG9ycyA9XG4gICAgICAgIGNvbXBvbmVudERlZi5uZ0NvbnRlbnRTZWxlY3RvcnMgPyBjb21wb25lbnREZWYubmdDb250ZW50U2VsZWN0b3JzIDogW107XG4gICAgdGhpcy5pc0JvdW5kVG9Nb2R1bGUgPSAhIW5nTW9kdWxlO1xuICB9XG5cbiAgY3JlYXRlKFxuICAgICAgaW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsIHJvb3RTZWxlY3Rvck9yTm9kZT86IGFueSxcbiAgICAgIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPFQ+IHtcbiAgICBjb25zdCBpc0ludGVybmFsUm9vdFZpZXcgPSByb290U2VsZWN0b3JPck5vZGUgPT09IHVuZGVmaW5lZDtcbiAgICBuZ01vZHVsZSA9IG5nTW9kdWxlIHx8IHRoaXMubmdNb2R1bGU7XG5cbiAgICBjb25zdCByb290Vmlld0luamVjdG9yID1cbiAgICAgICAgbmdNb2R1bGUgPyBjcmVhdGVDaGFpbmVkSW5qZWN0b3IoaW5qZWN0b3IsIG5nTW9kdWxlLmluamVjdG9yKSA6IGluamVjdG9yO1xuXG4gICAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID1cbiAgICAgICAgcm9vdFZpZXdJbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MiwgZG9tUmVuZGVyZXJGYWN0b3J5MykgYXMgUmVuZGVyZXJGYWN0b3J5MztcbiAgICBjb25zdCBzYW5pdGl6ZXIgPSByb290Vmlld0luamVjdG9yLmdldChTYW5pdGl6ZXIsIG51bGwpO1xuXG4gICAgY29uc3QgaG9zdFJOb2RlID0gaXNJbnRlcm5hbFJvb3RWaWV3ID9cbiAgICAgICAgZWxlbWVudENyZWF0ZSh0aGlzLnNlbGVjdG9yLCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgdGhpcy5jb21wb25lbnREZWYpKSA6XG4gICAgICAgIGxvY2F0ZUhvc3RFbGVtZW50KHJlbmRlcmVyRmFjdG9yeSwgcm9vdFNlbGVjdG9yT3JOb2RlKTtcblxuICAgIGNvbnN0IHJvb3RGbGFncyA9IHRoaXMuY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLklzUm9vdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290O1xuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB0aGlzIENvbXBvbmVudCBuZWVkcyB0byBiZSBpc29sYXRlZCBmcm9tIG90aGVyIGNvbXBvbmVudHMsIGkuZS4gd2hldGhlciBpdFxuICAgIC8vIHNob3VsZCBiZSBwbGFjZWQgaW50byBpdHMgb3duIChlbXB0eSkgcm9vdCBjb250ZXh0IG9yIGV4aXN0aW5nIHJvb3QgY29udGV4dCBzaG91bGQgYmUgdXNlZC5cbiAgICAvLyBOb3RlOiB0aGlzIGlzIGludGVybmFsLW9ubHkgY29udmVudGlvbiBhbmQgbWlnaHQgY2hhbmdlIGluIHRoZSBmdXR1cmUsIHNvIGl0IHNob3VsZCBub3QgYmVcbiAgICAvLyByZWxpZWQgdXBvbiBleHRlcm5hbGx5LlxuICAgIGNvbnN0IGlzSXNvbGF0ZWQgPSB0eXBlb2Ygcm9vdFNlbGVjdG9yT3JOb2RlID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAvXiNyb290LW5nLWludGVybmFsLWlzb2xhdGVkLVxcZCsvLnRlc3Qocm9vdFNlbGVjdG9yT3JOb2RlKTtcblxuICAgIGNvbnN0IHJvb3RDb250ZXh0OiBSb290Q29udGV4dCA9IChpc0ludGVybmFsUm9vdFZpZXcgfHwgaXNJc29sYXRlZCkgP1xuICAgICAgICBjcmVhdGVSb290Q29udGV4dCgpIDpcbiAgICAgICAgcm9vdFZpZXdJbmplY3Rvci5nZXQoUk9PVF9DT05URVhUKTtcblxuICAgIGNvbnN0IHJlbmRlcmVyID0gcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3RSTm9kZSwgdGhpcy5jb21wb25lbnREZWYpO1xuXG4gICAgaWYgKHJvb3RTZWxlY3Rvck9yTm9kZSAmJiBob3N0Uk5vZGUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGhvc3RSTm9kZSwgJ25nLXZlcnNpb24nLCBWRVJTSU9OLmZ1bGwpIDpcbiAgICAgICAgICBob3N0Uk5vZGUuc2V0QXR0cmlidXRlKCduZy12ZXJzaW9uJywgVkVSU0lPTi5mdWxsKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdGhlIHJvb3Qgdmlldy4gVXNlcyBlbXB0eSBUVmlldyBhbmQgQ29udGVudFRlbXBsYXRlLlxuICAgIGNvbnN0IHJvb3RMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBudWxsLCBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCksIHJvb3RDb250ZXh0LCByb290RmxhZ3MsIG51bGwsXG4gICAgICAgIG51bGwsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIsIHNhbml0aXplciwgcm9vdFZpZXdJbmplY3Rvcik7XG5cbiAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgIGNvbnN0IG9sZExWaWV3ID0gZW50ZXJWaWV3KHJvb3RMVmlldywgbnVsbCk7XG5cbiAgICBsZXQgY29tcG9uZW50OiBUO1xuICAgIGxldCB0RWxlbWVudE5vZGU6IFRFbGVtZW50Tm9kZTtcblxuICAgIC8vIFdpbGwgYmVjb21lIHRydWUgaWYgdGhlIGB0cnlgIGJsb2NrIGV4ZWN1dGVzIHdpdGggbm8gZXJyb3JzLlxuICAgIGxldCBzYWZlVG9SdW5Ib29rcyA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gY3JlYXRlUm9vdENvbXBvbmVudFZpZXcoXG4gICAgICAgICAgaG9zdFJOb2RlLCB0aGlzLmNvbXBvbmVudERlZiwgcm9vdExWaWV3LCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyKTtcblxuICAgICAgdEVsZW1lbnROb2RlID0gZ2V0VE5vZGUoMCwgcm9vdExWaWV3KSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIGlmIChwcm9qZWN0YWJsZU5vZGVzKSB7XG4gICAgICAgIC8vIHByb2plY3RhYmxlIG5vZGVzIGNhbiBiZSBwYXNzZWQgYXMgYXJyYXkgb2YgYXJyYXlzIG9yIGFuIGFycmF5IG9mIGl0ZXJhYmxlcyAobmdVcGdyYWRlXG4gICAgICAgIC8vIGNhc2UpLiBIZXJlIHdlIGRvIG5vcm1hbGl6ZSBwYXNzZWQgZGF0YSBzdHJ1Y3R1cmUgdG8gYmUgYW4gYXJyYXkgb2YgYXJyYXlzIHRvIGF2b2lkXG4gICAgICAgIC8vIGNvbXBsZXggY2hlY2tzIGRvd24gdGhlIGxpbmUuXG4gICAgICAgIHRFbGVtZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgICAgIHByb2plY3RhYmxlTm9kZXMubWFwKChub2Rlc2ZvclNsb3Q6IFJOb2RlW10pID0+IHsgcmV0dXJuIEFycmF5LmZyb20obm9kZXNmb3JTbG90KTsgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBjb21wb25lbnQgPSBjcmVhdGVSb290Q29tcG9uZW50KFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsIHRoaXMuY29tcG9uZW50RGVmLCByb290TFZpZXcsIHJvb3RDb250ZXh0LCBbTGlmZWN5Y2xlSG9va3NGZWF0dXJlXSk7XG5cbiAgICAgIGFkZFRvVmlld1RyZWUocm9vdExWaWV3LCBjb21wb25lbnRWaWV3KTtcbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3Mocm9vdExWaWV3KTtcbiAgICAgIHNhZmVUb1J1bkhvb2tzID0gdHJ1ZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgbGVhdmVWaWV3KG9sZExWaWV3LCBzYWZlVG9SdW5Ib29rcyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50UmVmID0gbmV3IENvbXBvbmVudFJlZihcbiAgICAgICAgdGhpcy5jb21wb25lbnRUeXBlLCBjb21wb25lbnQsXG4gICAgICAgIGNyZWF0ZUVsZW1lbnRSZWYodmlld0VuZ2luZV9FbGVtZW50UmVmLCB0RWxlbWVudE5vZGUsIHJvb3RMVmlldyksIHJvb3RMVmlldywgdEVsZW1lbnROb2RlKTtcblxuICAgIGlmIChpc0ludGVybmFsUm9vdFZpZXcpIHtcbiAgICAgIC8vIFRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGludGVybmFsIHJvb3QgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgY29tcG9uZW50J3MgaG9zdCB2aWV3IG5vZGVcbiAgICAgIGNvbXBvbmVudFJlZi5ob3N0Vmlldy5fdFZpZXdOb2RlICEuY2hpbGQgPSB0RWxlbWVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gIH1cbn1cblxuY29uc3QgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBuZXcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZVxuICogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIuXG4gKlxuICogQHJldHVybnMgVGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIHJldHVybiBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIENvbXBvbmVudCBjcmVhdGVkIHZpYSBhIHtAbGluayBDb21wb25lbnRGYWN0b3J5fS5cbiAqXG4gKiBgQ29tcG9uZW50UmVmYCBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIENvbXBvbmVudCBJbnN0YW5jZSBhcyB3ZWxsIG90aGVyIG9iamVjdHMgcmVsYXRlZCB0byB0aGlzXG4gKiBDb21wb25lbnQgSW5zdGFuY2UgYW5kIGFsbG93cyB5b3UgdG8gZGVzdHJveSB0aGUgQ29tcG9uZW50IEluc3RhbmNlIHZpYSB0aGUge0BsaW5rICNkZXN0cm95fVxuICogbWV0aG9kLlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudFJlZjxUPiBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPFQ+IHtcbiAgZGVzdHJveUNiczogKCgpID0+IHZvaWQpW118bnVsbCA9IFtdO1xuICBpbnN0YW5jZTogVDtcbiAgaG9zdFZpZXc6IFZpZXdSZWY8VD47XG4gIGNoYW5nZURldGVjdG9yUmVmOiBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmO1xuICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29tcG9uZW50VHlwZTogVHlwZTxUPiwgaW5zdGFuY2U6IFQsIHB1YmxpYyBsb2NhdGlvbjogdmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgcHJpdmF0ZSBfcm9vdExWaWV3OiBMVmlldyxcbiAgICAgIHByaXZhdGUgX3ROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgdGhpcy5ob3N0VmlldyA9IHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgUm9vdFZpZXdSZWY8VD4oX3Jvb3RMVmlldyk7XG4gICAgdGhpcy5ob3N0Vmlldy5fdFZpZXdOb2RlID0gYXNzaWduVFZpZXdOb2RlVG9MVmlldyhfcm9vdExWaWV3W1RWSUVXXSwgbnVsbCwgLTEsIF9yb290TFZpZXcpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudFR5cGU7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0aGlzLl90Tm9kZSwgdGhpcy5fcm9vdExWaWV3KTsgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZGVzdHJveUNicykge1xuICAgICAgdGhpcy5kZXN0cm95Q2JzLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICB0aGlzLmRlc3Ryb3lDYnMgPSBudWxsO1xuICAgICAgIXRoaXMuaG9zdFZpZXcuZGVzdHJveWVkICYmIHRoaXMuaG9zdFZpZXcuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lDYnMpIHtcbiAgICAgIHRoaXMuZGVzdHJveUNicy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==