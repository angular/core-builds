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
import { LifecycleHooksFeature, createRootContext } from './component';
import { adjustBlueprintForNewNode, baseDirectiveCreate, createLNode, createLViewData, createTView, elementCreate, enterView, hostElement, initChangeDetectorIfExisting, locateHostElement, queueHostBindingForCheck, renderEmbeddedTemplate, setHostBindings } from './instructions';
import { domRendererFactory3 } from './interfaces/renderer';
import { CONTEXT, FLAGS, INJECTOR, TVIEW } from './interfaces/view';
import { RootViewRef } from './view_ref';
var ComponentFactoryResolver = /** @class */ (function (_super) {
    tslib_1.__extends(ComponentFactoryResolver, _super);
    function ComponentFactoryResolver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ComponentFactoryResolver.prototype.resolveComponentFactory = function (component) {
        ngDevMode && assertComponentType(component);
        var componentDef = component.ngComponentDef;
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
        var rootContext = ngModule && !isInternalRootView ?
            ngModule.injector.get(ROOT_CONTEXT) :
            createRootContext(requestAnimationFrame.bind(window));
        // Create the root view. Uses empty TView and ContentTemplate.
        var rootView = createLViewData(rendererFactory.createRenderer(hostNode, this.componentDef), createTView(-1, null, 1, 0, null, null, null), rootContext, this.componentDef.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */);
        rootView[INJECTOR] = ngModule && ngModule.injector || null;
        // rootView is the parent when bootstrapping
        var oldView = enterView(rootView, null);
        var component;
        var elementNode;
        try {
            if (rendererFactory.begin)
                rendererFactory.begin();
            // Create element node at index 0 in data array
            elementNode = hostElement(componentTag, hostNode, this.componentDef);
            // Create directive instance with factory() and store at index 0 in directives array
            component =
                baseDirectiveCreate(0, this.componentDef.factory(), this.componentDef, elementNode);
            if (this.componentDef.hostBindings) {
                queueHostBindingForCheck(0, this.componentDef.hostVars);
            }
            rootContext.components.push(component);
            initChangeDetectorIfExisting(elementNode.nodeInjector, component, elementNode.data);
            elementNode.data[CONTEXT] = component;
            // TODO: should LifecycleHooksFeature and other host features be generated by the compiler and
            // executed here?
            // Angular 5 reference: https://stackblitz.com/edit/lifecycle-hooks-vcref
            LifecycleHooksFeature(component, this.componentDef);
            setHostBindings(rootView[TVIEW].hostBindings);
            // Transform the arrays of native nodes into a LNode structure that can be consumed by the
            // projection instruction. This is needed to support the reprojection of these nodes.
            if (projectableNodes) {
                var index = 0;
                var projection = elementNode.tNode.projection = [];
                for (var i = 0; i < projectableNodes.length; i++) {
                    var nodeList = projectableNodes[i];
                    var firstTNode = null;
                    var previousTNode = null;
                    for (var j = 0; j < nodeList.length; j++) {
                        adjustBlueprintForNewNode(rootView);
                        var lNode = createLNode(++index, 3 /* Element */, nodeList[j], null, null);
                        if (previousTNode) {
                            previousTNode.next = lNode.tNode;
                        }
                        else {
                            firstTNode = lNode.tNode;
                        }
                        previousTNode = lNode.tNode;
                    }
                    projection.push(firstTNode);
                }
            }
            // Execute the template in creation mode only, and then turn off the CreationMode flag
            renderEmbeddedTemplate(elementNode, elementNode.data[TVIEW], component, 1 /* Create */);
            elementNode.data[FLAGS] &= ~1 /* CreationMode */;
        }
        finally {
            enterView(oldView, null);
            if (rendererFactory.end)
                rendererFactory.end();
        }
        var componentRef = new ComponentRef(this.componentType, component, rootView, injector, hostNode);
        if (isInternalRootView) {
            // The host element of the internal root view is attached to the component's host view node
            componentRef.hostView._lViewNode.tNode.child = elementNode.tNode;
        }
        return componentRef;
    };
    return ComponentFactory;
}(viewEngine_ComponentFactory));
export { ComponentFactory };
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
    function ComponentRef(componentType, instance, rootView, injector, hostNode) {
        var _this = _super.call(this) || this;
        _this.destroyCbs = [];
        _this.instance = instance;
        _this.hostView = _this.changeDetectorRef = new RootViewRef(rootView);
        _this.hostView._lViewNode = createLNode(-1, 2 /* View */, null, null, null, rootView);
        _this.injector = injector;
        _this.location = new viewEngine_ElementRef(hostNode);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBVyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksMkJBQTJCLEVBQUUsWUFBWSxJQUFJLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDckksT0FBTyxFQUFDLHdCQUF3QixJQUFJLG1DQUFtQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDckgsT0FBTyxFQUFDLFVBQVUsSUFBSSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUcvQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNyRSxPQUFPLEVBQUMseUJBQXlCLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsNEJBQTRCLEVBQUUsaUJBQWlCLEVBQUUsd0JBQXdCLEVBQUUsc0JBQXNCLEVBQUUsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHcFIsT0FBTyxFQUE2QixtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RGLE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBc0MsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENB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QUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQzs7SUFDckMsQ0FBQztJQUVELDhCQUFPLEdBQVA7UUFDRSxTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsVUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFBLEVBQUUsSUFBSSxPQUFBLEVBQUUsRUFBRSxFQUFKLENBQUksQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLENBQUM7SUFDRCxnQ0FBUyxHQUFULFVBQVUsUUFBb0I7UUFDNUIsU0FBUyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLFVBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQTlCRCxDQUFxQyx1QkFBdUIsR0E4QjNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RvciwgaW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyB2aWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnRDb21wb25lbnRUeXBlLCBhc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xpZmVjeWNsZUhvb2tzRmVhdHVyZSwgY3JlYXRlUm9vdENvbnRleHR9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7YWRqdXN0Qmx1ZXByaW50Rm9yTmV3Tm9kZSwgYmFzZURpcmVjdGl2ZUNyZWF0ZSwgY3JlYXRlTE5vZGUsIGNyZWF0ZUxWaWV3RGF0YSwgY3JlYXRlVFZpZXcsIGVsZW1lbnRDcmVhdGUsIGVudGVyVmlldywgaG9zdEVsZW1lbnQsIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcsIGxvY2F0ZUhvc3RFbGVtZW50LCBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2ssIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUsIHNldEhvc3RCaW5kaW5nc30gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtDb21wb25lbnREZWZJbnRlcm5hbCwgQ29tcG9uZW50VHlwZSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlckZhY3RvcnkzLCBkb21SZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDT05URVhULCBGTEFHUywgSU5KRUNUT1IsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgUm9vdENvbnRleHQsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1Jvb3RWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBleHRlbmRzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Q29tcG9uZW50VHlwZShjb21wb25lbnQpO1xuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChjb21wb25lbnQgYXMgQ29tcG9uZW50VHlwZTxUPikubmdDb21wb25lbnREZWY7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9SZWZBcnJheShtYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gIGNvbnN0IGFycmF5OiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdID0gW107XG4gIGZvciAobGV0IG5vbk1pbmlmaWVkIGluIG1hcCkge1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkobm9uTWluaWZpZWQpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZCA9IG1hcFtub25NaW5pZmllZF07XG4gICAgICBhcnJheS5wdXNoKHtwcm9wTmFtZTogbWluaWZpZWQsIHRlbXBsYXRlTmFtZTogbm9uTWluaWZpZWR9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIERlZmF1bHQge0BsaW5rIFJvb3RDb250ZXh0fSBmb3IgYWxsIGNvbXBvbmVudHMgcmVuZGVyZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGNvbnN0IFJPT1RfQ09OVEVYVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxSb290Q29udGV4dD4oXG4gICAgJ1JPT1RfQ09OVEVYVF9UT0tFTicsXG4gICAge3Byb3ZpZGVkSW46ICdyb290JywgZmFjdG9yeTogKCkgPT4gY3JlYXRlUm9vdENvbnRleHQoaW5qZWN0KFNDSEVEVUxFUikpfSk7XG5cbi8qKlxuICogQSBjaGFuZ2UgZGV0ZWN0aW9uIHNjaGVkdWxlciB0b2tlbiBmb3Ige0BsaW5rIFJvb3RDb250ZXh0fS4gVGhpcyB0b2tlbiBpcyB0aGUgZGVmYXVsdCB2YWx1ZSB1c2VkXG4gKiBmb3IgdGhlIGRlZmF1bHQgYFJvb3RDb250ZXh0YCBmb3VuZCBpbiB0aGUge0BsaW5rIFJPT1RfQ09OVEVYVH0gdG9rZW4uXG4gKi9cbmV4cG9ydCBjb25zdCBTQ0hFRFVMRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48KChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk+KCdTQ0hFRFVMRVJfVE9LRU4nLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4ge1xuICAgIGNvbnN0IHVzZVJhZiA9IHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xuICAgIHJldHVybiB1c2VSYWYgPyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpIDogc2V0VGltZW91dDtcbiAgfSxcbn0pO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdXNlZCB0byB3cmFwIHRoZSBgUmVuZGVyZXJGYWN0b3J5MmAuXG4gKiBVc2VkIGluIHRlc3RzIHRvIGNoYW5nZSB0aGUgYFJlbmRlcmVyRmFjdG9yeTJgIGludG8gYSBgRGVidWdSZW5kZXJlckZhY3RvcnkyYC5cbiAqL1xuZXhwb3J0IGNvbnN0IFdSQVBfUkVOREVSRVJfRkFDVE9SWTIgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjwocmY6IFJlbmRlcmVyRmFjdG9yeTIpID0+IFJlbmRlcmVyRmFjdG9yeTI+KCdXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyJyk7XG5cbi8qKlxuICogUmVuZGVyMyBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5fS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG5cbiAgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZzsgdGVtcGxhdGVOYW1lOiBzdHJpbmc7fVtdIHtcbiAgICByZXR1cm4gdG9SZWZBcnJheSh0aGlzLmNvbXBvbmVudERlZi5pbnB1dHMpO1xuICB9XG5cbiAgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYub3V0cHV0cyk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudERlZjogQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50RGVmLnR5cGU7XG4gICAgdGhpcy5zZWxlY3RvciA9IGNvbXBvbmVudERlZi5zZWxlY3RvcnNbMF1bMF0gYXMgc3RyaW5nO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID0gW107XG4gIH1cblxuICBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCwgcm9vdFNlbGVjdG9yT3JOb2RlPzogYW55LFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8VD4ge1xuICAgIGNvbnN0IGlzSW50ZXJuYWxSb290VmlldyA9IHJvb3RTZWxlY3Rvck9yTm9kZSA9PT0gdW5kZWZpbmVkO1xuXG4gICAgbGV0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MztcblxuICAgIGlmIChuZ01vZHVsZSkge1xuICAgICAgY29uc3Qgd3JhcHBlciA9IG5nTW9kdWxlLmluamVjdG9yLmdldChXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyLCAodjogUmVuZGVyZXJGYWN0b3J5MikgPT4gdik7XG4gICAgICByZW5kZXJlckZhY3RvcnkgPSB3cmFwcGVyKG5nTW9kdWxlLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyKSkgYXMgUmVuZGVyZXJGYWN0b3J5MztcbiAgICB9IGVsc2Uge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5ID0gZG9tUmVuZGVyZXJGYWN0b3J5MztcbiAgICB9XG5cbiAgICBjb25zdCBob3N0Tm9kZSA9IGlzSW50ZXJuYWxSb290VmlldyA/XG4gICAgICAgIGVsZW1lbnRDcmVhdGUodGhpcy5zZWxlY3RvciwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIHRoaXMuY29tcG9uZW50RGVmKSkgOlxuICAgICAgICBsb2NhdGVIb3N0RWxlbWVudChyZW5kZXJlckZhY3RvcnksIHJvb3RTZWxlY3Rvck9yTm9kZSk7XG5cbiAgICAvLyBUaGUgZmlyc3QgaW5kZXggb2YgdGhlIGZpcnN0IHNlbGVjdG9yIGlzIHRoZSB0YWcgbmFtZS5cbiAgICBjb25zdCBjb21wb25lbnRUYWcgPSB0aGlzLmNvbXBvbmVudERlZi5zZWxlY3RvcnMgIVswXSAhWzBdIGFzIHN0cmluZztcblxuICAgIGNvbnN0IHJvb3RDb250ZXh0OiBSb290Q29udGV4dCA9IG5nTW9kdWxlICYmICFpc0ludGVybmFsUm9vdFZpZXcgP1xuICAgICAgICBuZ01vZHVsZS5pbmplY3Rvci5nZXQoUk9PVF9DT05URVhUKSA6XG4gICAgICAgIGNyZWF0ZVJvb3RDb250ZXh0KHJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKHdpbmRvdykpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSByb290IHZpZXcuIFVzZXMgZW1wdHkgVFZpZXcgYW5kIENvbnRlbnRUZW1wbGF0ZS5cbiAgICBjb25zdCByb290VmlldzogTFZpZXdEYXRhID0gY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdE5vZGUsIHRoaXMuY29tcG9uZW50RGVmKSxcbiAgICAgICAgY3JlYXRlVFZpZXcoLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwpLCByb290Q29udGV4dCxcbiAgICAgICAgdGhpcy5jb21wb25lbnREZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpO1xuICAgIHJvb3RWaWV3W0lOSkVDVE9SXSA9IG5nTW9kdWxlICYmIG5nTW9kdWxlLmluamVjdG9yIHx8IG51bGw7XG5cbiAgICAvLyByb290VmlldyBpcyB0aGUgcGFyZW50IHdoZW4gYm9vdHN0cmFwcGluZ1xuICAgIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcocm9vdFZpZXcsIG51bGwpO1xuXG4gICAgbGV0IGNvbXBvbmVudDogVDtcbiAgICBsZXQgZWxlbWVudE5vZGU6IExFbGVtZW50Tm9kZTtcbiAgICB0cnkge1xuICAgICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG5cbiAgICAgIC8vIENyZWF0ZSBlbGVtZW50IG5vZGUgYXQgaW5kZXggMCBpbiBkYXRhIGFycmF5XG4gICAgICBlbGVtZW50Tm9kZSA9IGhvc3RFbGVtZW50KGNvbXBvbmVudFRhZywgaG9zdE5vZGUsIHRoaXMuY29tcG9uZW50RGVmKTtcblxuICAgICAgLy8gQ3JlYXRlIGRpcmVjdGl2ZSBpbnN0YW5jZSB3aXRoIGZhY3RvcnkoKSBhbmQgc3RvcmUgYXQgaW5kZXggMCBpbiBkaXJlY3RpdmVzIGFycmF5XG4gICAgICBjb21wb25lbnQgPVxuICAgICAgICAgIGJhc2VEaXJlY3RpdmVDcmVhdGUoMCwgdGhpcy5jb21wb25lbnREZWYuZmFjdG9yeSgpLCB0aGlzLmNvbXBvbmVudERlZiwgZWxlbWVudE5vZGUpO1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50RGVmLmhvc3RCaW5kaW5ncykge1xuICAgICAgICBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soMCwgdGhpcy5jb21wb25lbnREZWYuaG9zdFZhcnMpO1xuICAgICAgfVxuICAgICAgcm9vdENvbnRleHQuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKGVsZW1lbnROb2RlLm5vZGVJbmplY3RvciwgY29tcG9uZW50LCBlbGVtZW50Tm9kZS5kYXRhICEpO1xuICAgICAgKGVsZW1lbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhKVtDT05URVhUXSA9IGNvbXBvbmVudDtcbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBMaWZlY3ljbGVIb29rc0ZlYXR1cmUoY29tcG9uZW50LCB0aGlzLmNvbXBvbmVudERlZik7XG5cbiAgICAgIHNldEhvc3RCaW5kaW5ncyhyb290Vmlld1tUVklFV10uaG9zdEJpbmRpbmdzKTtcblxuICAgICAgLy8gVHJhbnNmb3JtIHRoZSBhcnJheXMgb2YgbmF0aXZlIG5vZGVzIGludG8gYSBMTm9kZSBzdHJ1Y3R1cmUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgdGhlXG4gICAgICAvLyBwcm9qZWN0aW9uIGluc3RydWN0aW9uLiBUaGlzIGlzIG5lZWRlZCB0byBzdXBwb3J0IHRoZSByZXByb2plY3Rpb24gb2YgdGhlc2Ugbm9kZXMuXG4gICAgICBpZiAocHJvamVjdGFibGVOb2Rlcykge1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBjb25zdCBwcm9qZWN0aW9uOiBUTm9kZVtdID0gZWxlbWVudE5vZGUudE5vZGUucHJvamVjdGlvbiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb2plY3RhYmxlTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBub2RlTGlzdCA9IHByb2plY3RhYmxlTm9kZXNbaV07XG4gICAgICAgICAgbGV0IGZpcnN0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgICAgICAgIGxldCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGVMaXN0Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBhZGp1c3RCbHVlcHJpbnRGb3JOZXdOb2RlKHJvb3RWaWV3KTtcbiAgICAgICAgICAgIGNvbnN0IGxOb2RlID1cbiAgICAgICAgICAgICAgICBjcmVhdGVMTm9kZSgrK2luZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbm9kZUxpc3Rbal0gYXMgUkVsZW1lbnQsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgaWYgKHByZXZpb3VzVE5vZGUpIHtcbiAgICAgICAgICAgICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gbE5vZGUudE5vZGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmaXJzdFROb2RlID0gbE5vZGUudE5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2aW91c1ROb2RlID0gbE5vZGUudE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb2plY3Rpb24ucHVzaChmaXJzdFROb2RlICEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEV4ZWN1dGUgdGhlIHRlbXBsYXRlIGluIGNyZWF0aW9uIG1vZGUgb25seSwgYW5kIHRoZW4gdHVybiBvZmYgdGhlIENyZWF0aW9uTW9kZSBmbGFnXG4gICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGVsZW1lbnROb2RlLCBlbGVtZW50Tm9kZS5kYXRhICFbVFZJRVddLCBjb21wb25lbnQsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgICBlbGVtZW50Tm9kZS5kYXRhICFbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgZW50ZXJWaWV3KG9sZFZpZXcsIG51bGwpO1xuICAgICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICBuZXcgQ29tcG9uZW50UmVmKHRoaXMuY29tcG9uZW50VHlwZSwgY29tcG9uZW50LCByb290VmlldywgaW5qZWN0b3IsIGhvc3ROb2RlICEpO1xuICAgIGlmIChpc0ludGVybmFsUm9vdFZpZXcpIHtcbiAgICAgIC8vIFRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGludGVybmFsIHJvb3QgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgY29tcG9uZW50J3MgaG9zdCB2aWV3IG5vZGVcbiAgICAgIGNvbXBvbmVudFJlZi5ob3N0Vmlldy5fbFZpZXdOb2RlICEudE5vZGUuY2hpbGQgPSBlbGVtZW50Tm9kZS50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnQgY3JlYXRlZCB2aWEgYSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0uXG4gKlxuICogYENvbXBvbmVudFJlZmAgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBDb21wb25lbnQgSW5zdGFuY2UgYXMgd2VsbCBvdGhlciBvYmplY3RzIHJlbGF0ZWQgdG8gdGhpc1xuICogQ29tcG9uZW50IEluc3RhbmNlIGFuZCBhbGxvd3MgeW91IHRvIGRlc3Ryb3kgdGhlIENvbXBvbmVudCBJbnN0YW5jZSB2aWEgdGhlIHtAbGluayAjZGVzdHJveX1cbiAqIG1ldGhvZC5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gIGRlc3Ryb3lDYnM6ICgoKSA9PiB2b2lkKVtdfG51bGwgPSBbXTtcbiAgbG9jYXRpb246IHZpZXdFbmdpbmVfRWxlbWVudFJlZjxhbnk+O1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIGluc3RhbmNlOiBUO1xuICBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcm9vdFZpZXc6IExWaWV3RGF0YSwgaW5qZWN0b3I6IEluamVjdG9yLFxuICAgICAgaG9zdE5vZGU6IFJFbGVtZW50KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgdGhpcy5ob3N0VmlldyA9IHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgUm9vdFZpZXdSZWY8VD4ocm9vdFZpZXcpO1xuICAgIHRoaXMuaG9zdFZpZXcuX2xWaWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKC0xLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgcm9vdFZpZXcpO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgICB0aGlzLmxvY2F0aW9uID0gbmV3IHZpZXdFbmdpbmVfRWxlbWVudFJlZihob3N0Tm9kZSk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIHRoaXMuZGVzdHJveUNicyA9IG51bGw7XG4gIH1cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuIl19