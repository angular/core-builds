/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { InjectionToken } from '../di/injection_token';
import { inject } from '../di/injector';
import { ComponentFactory as viewEngine_ComponentFactory, ComponentRef as viewEngine_ComponentRef } from '../linker/component_factory';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { RendererFactory2 } from '../render/api';
import { assertComponentType, assertDefined } from './assert';
import { LifecycleHooksFeature, createRootComponent, createRootContext } from './component';
import { getComponentDef } from './definition';
import { adjustBlueprintForNewNode, createLViewData, createNodeAtIndex, createTView, elementCreate, enterView, getTNode, hostElement, locateHostElement, renderEmbeddedTemplate } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { FLAGS, INJECTOR, TVIEW } from './interfaces/view';
import { createElementRef } from './view_engine_compatibility';
import { RootViewRef } from './view_ref';
var ComponentFactoryResolver = /** @class */ (function (_super) {
    tslib_1.__extends(ComponentFactoryResolver, _super);
    function ComponentFactoryResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ComponentFactoryResolver.prototype.resolveComponentFactory = function (component) {
        ngDevMode && assertComponentType(component);
        var componentDef = getComponentDef(component);
        return new ComponentFactory(componentDef);
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
export var ROOT_CONTEXT = new InjectionToken('ROOT_CONTEXT_TOKEN', { providedIn: 'root', factory: function () { return createRootContext(inject(SCHEDULER)); } });
/**
 * A change detection scheduler token for {@link RootContext}. This token is the default value used
 * for the default `RootContext` found in the {@link ROOT_CONTEXT} token.
 */
export var SCHEDULER = new InjectionToken('SCHEDULER_TOKEN', {
    providedIn: 'root',
    factory: function () {
        var useRaf = typeof requestAnimationFrame !== 'undefined' && typeof window !== 'undefined';
        return useRaf ? requestAnimationFrame.bind(window) : setTimeout;
    },
});
/**
 * A function used to wrap the `RendererFactory2`.
 * Used in tests to change the `RendererFactory2` into a `DebugRendererFactory2`.
 */
export var WRAP_RENDERER_FACTORY2 = new InjectionToken('WRAP_RENDERER_FACTORY2');
/**
 * Render3 implementation of {@link viewEngine_ComponentFactory}.
 */
var ComponentFactory = /** @class */ (function (_super) {
    tslib_1.__extends(ComponentFactory, _super);
    function ComponentFactory(componentDef) {
        var _this = _super.call(this) || this;
        _this.componentDef = componentDef;
        _this.componentType = componentDef.type;
        _this.selector = componentDef.selectors[0][0];
        _this.ngContentSelectors = [];
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
        var rendererFactory;
        if (ngModule) {
            var wrapper = ngModule.injector.get(WRAP_RENDERER_FACTORY2, function (v) { return v; });
            rendererFactory = wrapper(ngModule.injector.get(RendererFactory2));
        }
        else {
            rendererFactory = domRendererFactory3;
        }
        var hostNode = isInternalRootView ?
            elementCreate(this.selector, rendererFactory.createRenderer(null, this.componentDef)) :
            locateHostElement(rendererFactory, rootSelectorOrNode);
        // The first index of the first selector is the tag name.
        var componentTag = this.componentDef.selectors[0][0];
        var rootFlags = this.componentDef.onPush ? 4 /* Dirty */ | 64 /* IsRoot */ :
            2 /* CheckAlways */ | 64 /* IsRoot */;
        var rootContext = ngModule && !isInternalRootView ?
            ngModule.injector.get(ROOT_CONTEXT) :
            createRootContext(requestAnimationFrame.bind(window));
        // Create the root view. Uses empty TView and ContentTemplate.
        var rootView = createLViewData(rendererFactory.createRenderer(hostNode, this.componentDef), createTView(-1, null, 1, 0, null, null, null), rootContext, rootFlags);
        rootView[INJECTOR] = ngModule && ngModule.injector || null;
        // rootView is the parent when bootstrapping
        var oldView = enterView(rootView, null);
        var component;
        var elementNode;
        var tElementNode;
        try {
            if (rendererFactory.begin)
                rendererFactory.begin();
            // Create element node at index 0 in data array
            elementNode = hostElement(componentTag, hostNode, this.componentDef);
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            component = createRootComponent(elementNode, this.componentDef, rootView, rootContext, [LifecycleHooksFeature]);
            tElementNode = getTNode(0);
            // Transform the arrays of native nodes into a LNode structure that can be consumed by the
            // projection instruction. This is needed to support the reprojection of these nodes.
            if (projectableNodes) {
                var index = 0;
                var projection = tElementNode.projection = [];
                for (var i = 0; i < projectableNodes.length; i++) {
                    var nodeList = projectableNodes[i];
                    var firstTNode = null;
                    var previousTNode = null;
                    for (var j = 0; j < nodeList.length; j++) {
                        adjustBlueprintForNewNode(rootView);
                        var tNode = createNodeAtIndex(++index, 3 /* Element */, nodeList[j], null, null);
                        previousTNode ? (previousTNode.next = tNode) : (firstTNode = tNode);
                        previousTNode = tNode;
                    }
                    projection.push(firstTNode);
                }
            }
            // Execute the template in creation mode only, and then turn off the CreationMode flag
            var componentView = elementNode.data;
            renderEmbeddedTemplate(componentView, componentView[TVIEW], component, 1 /* Create */);
            componentView[FLAGS] &= ~1 /* CreationMode */;
        }
        finally {
            enterView(oldView, null);
            if (rendererFactory.end)
                rendererFactory.end();
        }
        var componentRef = new ComponentRef(this.componentType, component, rootView, injector, createElementRef(viewEngine_ElementRef, tElementNode, rootView));
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
    function ComponentRef(componentType, instance, rootView, injector, location) {
        var _this = _super.call(this) || this;
        _this.location = location;
        _this.destroyCbs = [];
        _this.instance = instance;
        _this.hostView = _this.changeDetectorRef = new RootViewRef(rootView);
        _this.hostView._tViewNode = createNodeAtIndex(-1, 2 /* View */, null, null, null, rootView);
        _this.injector = injector;
        _this.componentType = componentType;
        return _this;
    }
    ComponentRef.prototype.destroy = function () {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
        this.destroyCbs.forEach(function (fn) { return fn(); });
        this.destroyCbs = null;
    };
    ComponentRef.prototype.onDestroy = function (callback) {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
        this.destroyCbs.push(callback);
    };
    return ComponentRef;
}(viewEngine_ComponentRef));
export { ComponentRef };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBVyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksMkJBQTJCLEVBQUUsWUFBWSxJQUFJLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDckksT0FBTyxFQUFDLHdCQUF3QixJQUFJLG1DQUFtQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDckgsT0FBTyxFQUFDLFVBQVUsSUFBSSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUcvQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUMxRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3RNLE9BQU8sRUFBNkIsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RixPQUFPLEVBQUMsS0FBSyxFQUFFLFFBQVEsRUFBc0MsS0FBSyxFQUFDLE1BQU0s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QU8sQ0FBQyxVQUFBLEVBQUUsSUFBSSxPQUFBLEVBQUUsRUFBRSxFQUFKLENBQUksQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLENBQUM7SUFDRCxnQ0FBUyxHQUFULFVBQVUsUUFBb0I7UUFDNUIsU0FBUyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLFVBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQTVCRCxDQUFxQyx1QkFBdUIsR0E0QjNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RvciwgaW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyB2aWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlLCBhc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xpZmVjeWNsZUhvb2tzRmVhdHVyZSwgY3JlYXRlUm9vdENvbXBvbmVudCwgY3JlYXRlUm9vdENvbnRleHR9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHthZGp1c3RCbHVlcHJpbnRGb3JOZXdOb2RlLCBjcmVhdGVMVmlld0RhdGEsIGNyZWF0ZU5vZGVBdEluZGV4LCBjcmVhdGVUVmlldywgZWxlbWVudENyZWF0ZSwgZW50ZXJWaWV3LCBnZXRUTm9kZSwgaG9zdEVsZW1lbnQsIGxvY2F0ZUhvc3RFbGVtZW50LCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0NvbXBvbmVudERlZkludGVybmFsLCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMRWxlbWVudE5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlckZhY3RvcnkzLCBkb21SZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtGTEFHUywgSU5KRUNUT1IsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGdldENvbXBvbmVudERlZihjb21wb25lbnQpICE7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIERlZmF1bHQge0BsaW5rIFJvb3RDb250ZXh0fSBmb3IgYWxsIGNvbXBvbmVudHMgcmVuZGVyZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGNvbnN0IFJPT1RfQ09OVEVYVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSb290Q29udGV4dD4oXG4gICAgJ1JPT1RfQ09OVEVYVF9UT0tFTicsXG4gICAge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gY3JlYXRlUm9vdENvbnRleHQoaW5qZWN0KFNDSEVEVUxFUikpfSk7XG5cbi8qKlxuICogQSBjaGFuZ2UgZGV0ZWN0aW9uIHNjaGVkdWxlciB0b2tlbiBmb3Ige0BsaW5rIFJvb3RDb250ZXh0fS4gVGhpcyB0b2tlbiBpcyB0aGUgZGVmYXVsdCB2YWx1ZSB1c2VkXG4gKiBmb3IgdGhlIGRlZmF1bHQgYFJvb3RDb250ZXh0YCBmb3VuZCBpbiB0aGUge0BsaW5rIFJPT1RfQ09OVEVYVH0gdG9rZW4uXG4gKi9cbmV4cG9ydCBjb25zdCBTQ0hFRFVMRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48KChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk+KCdTQ0hFRFVMRVJfVE9LRU4nLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4ge1xuICAgIGNvbnN0IHVzZVJhZiA9IHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xuICAgIHJldHVybiB1c2VSYWYgPyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpIDogc2V0VGltZW91dDtcbiAgfSxcbn0pO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdXNlZCB0byB3cmFwIHRoZSBgUmVuZGVyZXJGYWN0b3J5MmAuXG4gKiBVc2VkIGluIHRlc3RzIHRvIGNoYW5nZSB0aGUgYFJlbmRlcmVyRmFjdG9yeTJgIGludG8gYSBgRGVidWdSZW5kZXJlckZhY3RvcnkyYC5cbiAqL1xuZXhwb3J0IGNvbnN0IFdSQVBfUkVOREVSRVJfRkFDVE9SWTIgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjwocmY6IFJlbmRlcmVyRmFjdG9yeTIpID0+IFJlbmRlcmVyRmFjdG9yeTI+KCdXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyJyk7XG5cbi8qKlxuICogUmVuZGVyMyBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5fS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG5cbiAgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5pbnB1dHMpO1xuICB9XG5cbiAgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cyk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG4gICAgdGhpcy5zZWxlY3RvciA9IGNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF1bMF0gYXMgc3RyaW5nO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID0gW107XG4gIH1cblxuICBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCwgcm9vdFNlbGVjdG9yT3JOb2RlPzogYW55LFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICAgIGNvbnN0IGlzSW50ZXJuYWxSb290VmlldyA9IHJvb3RTZWxlY3Rvck9yTm9kZSA9PT0gdW5kZWZpbmVkO1xuXG4gICAgbGV0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MztcblxuICAgIGlmIChuZ01vZHVsZSkge1xuICAgICAgY29uc3Qgd3JhcHBlciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyLCAodjogUmVuZGVyZXJGYWN0b3J5MikgPT4gdik7XG4gICAgICByZW5kZXJlckZhY3RvcnkgPSB3cmFwcGVyKG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKSkgYXMgUmVuZGVyZXJGYWN0b3J5MztcbiAgICB9IGVsc2Uge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5ID0gZG9tUmVuZGVyZXJGYWN0b3J5MztcbiAgICB9XG5cbiAgICBjb25zdCBob3N0Tm9kZSA9IGlzSW50ZXJuYWxSb290VmlldyA/XG4gICAgICAgIGVsZW1lbnRDcmVhdGUodGhpcy5zZWxlY3RvciwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIHRoaXMuY29tcG9uZW50RGVmKSkgOlxuICAgICAgICBsb2NhdGVIb3N0RWxlbWVudChyZW5kZXJlckZhY3RvcnksIHJvb3RTZWxlY3Rvck9yTm9kZSk7XG5cbiAgICAvLyBUaGUgZmlyc3QgaW5kZXggb2YgdGhlIGZpcnN0IHNlbGVjdG9yIGlzIHRoZSB0YWcgbmFtZS5cbiAgICBjb25zdCBjb21wb25lbnRUYWcgPSB0aGlzLmNvbXBvbmVudERlZi5zZWxlY3RvcnMgIVswXSAhWzBdIGFzIHN0cmluZztcblxuICAgIGNvbnN0IHJvb3RGbGFncyA9IHRoaXMuY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLklzUm9vdCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290O1xuICAgIGNvbnN0IHJvb3RDb250ZXh0OiBSb290Q29udGV4dCA9IG5nTW9kdWxlICYmICFpc0ludGVybmFsUm9vdFZpZXcgP1xuICAgICAgICBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUk9PVF9DT05URVhUKSA6XG4gICAgICAgIGNyZWF0ZVJvb3RDb250ZXh0KHJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKHdpbmRvdykpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSByb290IHZpZXcuIFVzZXMgZW1wdHkgVFZpZXcgYW5kIENvbnRlbnRUZW1wbGF0ZS5cbiAgICBjb25zdCByb290VmlldzogTFZpZXdEYXRhID0gY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdE5vZGUsIHRoaXMuY29tcG9uZW50RGVmKSxcbiAgICAgICAgY3JlYXRlVFZpZXcoLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwpLCByb290Q29udGV4dCwgcm9vdEZsYWdzKTtcbiAgICByb290Vmlld1tJTkpFQ1RPUl0gPSBuZ01vZHVsZSAmJiBuZ01vZHVsZS5pbmplY3RvciB8fCBudWxsO1xuXG4gICAgLy8gcm9vdFZpZXcgaXMgdGhlIHBhcmVudCB3aGVuIGJvb3RzdHJhcHBpbmdcbiAgICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KHJvb3RWaWV3LCBudWxsKTtcblxuICAgIGxldCBjb21wb25lbnQ6IFQ7XG4gICAgbGV0IGVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGU7XG4gICAgbGV0IHRFbGVtZW50Tm9kZTogVEVsZW1lbnROb2RlO1xuICAgIHRyeSB7XG4gICAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcblxuICAgICAgLy8gQ3JlYXRlIGVsZW1lbnQgbm9kZSBhdCBpbmRleCAwIGluIGRhdGEgYXJyYXlcbiAgICAgIGVsZW1lbnROb2RlID0gaG9zdEVsZW1lbnQoY29tcG9uZW50VGFnLCBob3N0Tm9kZSwgdGhpcy5jb21wb25lbnREZWYpO1xuXG4gICAgICAvLyBUT0RPOiBzaG91bGQgTGlmZWN5Y2xlSG9va3NGZWF0dXJlIGFuZCBvdGhlciBob3N0IGZlYXR1cmVzIGJlIGdlbmVyYXRlZCBieSB0aGUgY29tcGlsZXIgYW5kXG4gICAgICAvLyBleGVjdXRlZCBoZXJlP1xuICAgICAgLy8gQW5ndWxhciA1IHJlZmVyZW5jZTogaHR0cHM6Ly9zdGFja2JsaXR6LmNvbS9lZGl0L2xpZmVjeWNsZS1ob29rcy12Y3JlZlxuICAgICAgY29tcG9uZW50ID0gY3JlYXRlUm9vdENvbXBvbmVudChcbiAgICAgICAgICBlbGVtZW50Tm9kZSwgdGhpcy5jb21wb25lbnREZWYsIHJvb3RWaWV3LCByb290Q29udGV4dCwgW0xpZmVjeWNsZUhvb2tzRmVhdHVyZV0pO1xuXG4gICAgICB0RWxlbWVudE5vZGUgPSBnZXRUTm9kZSgwKSBhcyBURWxlbWVudE5vZGU7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSB0aGUgYXJyYXlzIG9mIG5hdGl2ZSBub2RlcyBpbnRvIGEgTE5vZGUgc3RydWN0dXJlIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IHRoZVxuICAgICAgLy8gcHJvamVjdGlvbiBpbnN0cnVjdGlvbi4gVGhpcyBpcyBuZWVkZWQgdG8gc3VwcG9ydCB0aGUgcmVwcm9qZWN0aW9uIG9mIHRoZXNlIG5vZGVzLlxuICAgICAgaWYgKHByb2plY3RhYmxlTm9kZXMpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgcHJvamVjdGlvbjogVE5vZGVbXSA9IHRFbGVtZW50Tm9kZS5wcm9qZWN0aW9uID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvamVjdGFibGVOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG5vZGVMaXN0ID0gcHJvamVjdGFibGVOb2Rlc1tpXTtcbiAgICAgICAgICBsZXQgZmlyc3RUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gICAgICAgICAgbGV0IHByZXZpb3VzVE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbm9kZUxpc3QubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGFkanVzdEJsdWVwcmludEZvck5ld05vZGUocm9vdFZpZXcpO1xuICAgICAgICAgICAgY29uc3QgdE5vZGUgPVxuICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVBdEluZGV4KCsraW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBub2RlTGlzdFtqXSBhcyBSRWxlbWVudCwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICBwcmV2aW91c1ROb2RlID8gKHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlKSA6IChmaXJzdFROb2RlID0gdE5vZGUpO1xuICAgICAgICAgICAgcHJldmlvdXNUTm9kZSA9IHROb2RlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9qZWN0aW9uLnB1c2goZmlyc3RUTm9kZSAhKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBFeGVjdXRlIHRoZSB0ZW1wbGF0ZSBpbiBjcmVhdGlvbiBtb2RlIG9ubHksIGFuZCB0aGVuIHR1cm4gb2ZmIHRoZSBDcmVhdGlvbk1vZGUgZmxhZ1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGVsZW1lbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhO1xuICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3W1RWSUVXXSwgY29tcG9uZW50LCBSZW5kZXJGbGFncy5DcmVhdGUpO1xuICAgICAgY29tcG9uZW50Vmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBlbnRlclZpZXcob2xkVmlldywgbnVsbCk7XG4gICAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9IG5ldyBDb21wb25lbnRSZWYoXG4gICAgICAgIHRoaXMuY29tcG9uZW50VHlwZSwgY29tcG9uZW50LCByb290VmlldywgaW5qZWN0b3IsXG4gICAgICAgIGNyZWF0ZUVsZW1lbnRSZWYodmlld0VuZ2luZV9FbGVtZW50UmVmLCB0RWxlbWVudE5vZGUsIHJvb3RWaWV3KSk7XG5cbiAgICBpZiAoaXNJbnRlcm5hbFJvb3RWaWV3KSB7XG4gICAgICAvLyBUaGUgaG9zdCBlbGVtZW50IG9mIHRoZSBpbnRlcm5hbCByb290IHZpZXcgaXMgYXR0YWNoZWQgdG8gdGhlIGNvbXBvbmVudCdzIGhvc3QgdmlldyBub2RlXG4gICAgICBjb21wb25lbnRSZWYuaG9zdFZpZXcuX3RWaWV3Tm9kZSAhLmNoaWxkID0gdEVsZW1lbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICB9XG59XG5cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGVcbiAqIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlclxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnQgY3JlYXRlZCB2aWEgYSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0uXG4gKlxuICogYENvbXBvbmVudFJlZmAgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBDb21wb25lbnQgSW5zdGFuY2UgYXMgd2VsbCBvdGhlciBvYmplY3RzIHJlbGF0ZWQgdG8gdGhpc1xuICogQ29tcG9uZW50IEluc3RhbmNlIGFuZCBhbGxvd3MgeW91IHRvIGRlc3Ryb3kgdGhlIENvbXBvbmVudCBJbnN0YW5jZSB2aWEgdGhlIHtAbGluayAjZGVzdHJveX1cbiAqIG1ldGhvZC5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gIGRlc3Ryb3lDYnM6ICgoKSA9PiB2b2lkKVtdfG51bGwgPSBbXTtcbiAgaW5qZWN0b3I6IEluamVjdG9yO1xuICBpbnN0YW5jZTogVDtcbiAgaG9zdFZpZXc6IFZpZXdSZWY8VD47XG4gIGNoYW5nZURldGVjdG9yUmVmOiBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmO1xuICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29tcG9uZW50VHlwZTogVHlwZTxUPiwgaW5zdGFuY2U6IFQsIHJvb3RWaWV3OiBMVmlld0RhdGEsIGluamVjdG9yOiBJbmplY3RvcixcbiAgICAgIHB1YmxpYyBsb2NhdGlvbjogdmlld0VuZ2luZV9FbGVtZW50UmVmKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgdGhpcy5ob3N0VmlldyA9IHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgUm9vdFZpZXdSZWY8VD4ocm9vdFZpZXcpO1xuICAgIHRoaXMuaG9zdFZpZXcuX3RWaWV3Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KC0xLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgcm9vdFZpZXcpO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBjb21wb25lbnRUeXBlO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgdGhpcy5kZXN0cm95Q2JzID0gbnVsbDtcbiAgfVxuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLnB1c2goY2FsbGJhY2spO1xuICB9XG59XG4iXX0=