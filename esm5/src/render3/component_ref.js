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
            component = baseDirectiveCreate(0, this.componentDef.factory(), this.componentDef);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50X3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBVyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsZ0JBQWdCLElBQUksMkJBQTJCLEVBQUUsWUFBWSxJQUFJLHVCQUF1QixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDckksT0FBTyxFQUFDLHdCQUF3QixJQUFJLG1DQUFtQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDckgsT0FBTyxFQUFDLFVBQVUsSUFBSSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUcvQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNyRSxPQUFPLEVBQUMseUJBQXlCLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsNEJBQTRCLEVBQUUsaUJBQWlCLEVBQUUsd0JBQXdCLEVBQUUsc0JBQXNCLEVBQUUsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHcFIsT0FBTyxFQUE2QixtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RGLE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBc0MsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENB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QWEsR0FBRyxhQUFhLENBQUM7O0lBQ3JDLENBQUM7SUFFRCw4QkFBTyxHQUFQO1FBQ0UsU0FBUyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLFVBQVksQ0FBQyxPQUFPLENBQUMsVUFBQSxFQUFFLElBQUksT0FBQSxFQUFFLEVBQUUsRUFBSixDQUFJLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN6QixDQUFDO0lBQ0QsZ0NBQVMsR0FBVCxVQUFVLFFBQW9CO1FBQzVCLFNBQVMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxVQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFDSCxtQkFBQztBQUFELENBQUMsQUE5QkQsQ0FBcUMsdUJBQXVCLEdBOEIzRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3IsIGluamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgdmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtSZW5kZXJlckZhY3RvcnkyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7YXNzZXJ0Q29tcG9uZW50VHlwZSwgYXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMaWZlY3ljbGVIb29rc0ZlYXR1cmUsIGNyZWF0ZVJvb3RDb250ZXh0fSBmcm9tICcuL2NvbXBvbmVudCc7XG5pbXBvcnQge2FkanVzdEJsdWVwcmludEZvck5ld05vZGUsIGJhc2VEaXJlY3RpdmVDcmVhdGUsIGNyZWF0ZUxOb2RlLCBjcmVhdGVMVmlld0RhdGEsIGNyZWF0ZVRWaWV3LCBlbGVtZW50Q3JlYXRlLCBlbnRlclZpZXcsIGhvc3RFbGVtZW50LCBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nLCBsb2NhdGVIb3N0RWxlbWVudCwgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrLCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlLCBzZXRIb3N0QmluZGluZ3N9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50RGVmSW50ZXJuYWwsIENvbXBvbmVudFR5cGUsIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXJGYWN0b3J5MywgZG9tUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0LCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtSb290Vmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIHJlc29sdmVDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydENvbXBvbmVudFR5cGUoY29tcG9uZW50KTtcbiAgICBjb25zdCBjb21wb25lbnREZWYgPSAoY29tcG9uZW50IGFzIENvbXBvbmVudFR5cGU8VD4pLm5nQ29tcG9uZW50RGVmO1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvUmVmQXJyYXkobWFwOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICBjb25zdCBhcnJheToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSA9IFtdO1xuICBmb3IgKGxldCBub25NaW5pZmllZCBpbiBtYXApIHtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KG5vbk1pbmlmaWVkKSkge1xuICAgICAgY29uc3QgbWluaWZpZWQgPSBtYXBbbm9uTWluaWZpZWRdO1xuICAgICAgYXJyYXkucHVzaCh7cHJvcE5hbWU6IG1pbmlmaWVkLCB0ZW1wbGF0ZU5hbWU6IG5vbk1pbmlmaWVkfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheTtcbn1cblxuLyoqXG4gKiBEZWZhdWx0IHtAbGluayBSb290Q29udGV4dH0gZm9yIGFsbCBjb21wb25lbnRzIHJlbmRlcmVkIHdpdGgge0BsaW5rIHJlbmRlckNvbXBvbmVudH0uXG4gKi9cbmV4cG9ydCBjb25zdCBST09UX0NPTlRFWFQgPSBuZXcgSW5qZWN0aW9uVG9rZW48Um9vdENvbnRleHQ+KFxuICAgICdST09UX0NPTlRFWFRfVE9LRU4nLFxuICAgIHtwcm92aWRlZEluOiAncm9vdCcsIGZhY3Rvcnk6ICgpID0+IGNyZWF0ZVJvb3RDb250ZXh0KGluamVjdChTQ0hFRFVMRVIpKX0pO1xuXG4vKipcbiAqIEEgY2hhbmdlIGRldGVjdGlvbiBzY2hlZHVsZXIgdG9rZW4gZm9yIHtAbGluayBSb290Q29udGV4dH0uIFRoaXMgdG9rZW4gaXMgdGhlIGRlZmF1bHQgdmFsdWUgdXNlZFxuICogZm9yIHRoZSBkZWZhdWx0IGBSb290Q29udGV4dGAgZm91bmQgaW4gdGhlIHtAbGluayBST09UX0NPTlRFWFR9IHRva2VuLlxuICovXG5leHBvcnQgY29uc3QgU0NIRURVTEVSID0gbmV3IEluamVjdGlvblRva2VuPCgoZm46ICgpID0+IHZvaWQpID0+IHZvaWQpPignU0NIRURVTEVSX1RPS0VOJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+IHtcbiAgICBjb25zdCB1c2VSYWYgPSB0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbiAgICByZXR1cm4gdXNlUmFmID8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQod2luZG93KSA6IHNldFRpbWVvdXQ7XG4gIH0sXG59KTtcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHVzZWQgdG8gd3JhcCB0aGUgYFJlbmRlcmVyRmFjdG9yeTJgLlxuICogVXNlZCBpbiB0ZXN0cyB0byBjaGFuZ2UgdGhlIGBSZW5kZXJlckZhY3RvcnkyYCBpbnRvIGEgYERlYnVnUmVuZGVyZXJGYWN0b3J5MmAuXG4gKi9cbmV4cG9ydCBjb25zdCBXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48KHJmOiBSZW5kZXJlckZhY3RvcnkyKSA9PiBSZW5kZXJlckZhY3RvcnkyPignV1JBUF9SRU5ERVJFUl9GQUNUT1JZMicpO1xuXG4vKipcbiAqIFJlbmRlcjMgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeX0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuXG4gIGdldCBpbnB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmc7IHRlbXBsYXRlTmFtZTogc3RyaW5nO31bXSB7XG4gICAgcmV0dXJuIHRvUmVmQXJyYXkodGhpcy5jb21wb25lbnREZWYuaW5wdXRzKTtcbiAgfVxuXG4gIGdldCBvdXRwdXRzKCk6IHtwcm9wTmFtZTogc3RyaW5nOyB0ZW1wbGF0ZU5hbWU6IHN0cmluZzt9W10ge1xuICAgIHJldHVybiB0b1JlZkFycmF5KHRoaXMuY29tcG9uZW50RGVmLm91dHB1dHMpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnREZWY6IENvbXBvbmVudERlZkludGVybmFsPGFueT4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudERlZi50eXBlO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBjb21wb25lbnREZWYuc2VsZWN0b3JzWzBdWzBdIGFzIHN0cmluZztcbiAgICB0aGlzLm5nQ29udGVudFNlbGVjdG9ycyA9IFtdO1xuICB9XG5cbiAgY3JlYXRlKFxuICAgICAgaW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsIHJvb3RTZWxlY3Rvck9yTm9kZT86IGFueSxcbiAgICAgIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPFQ+IHtcbiAgICBjb25zdCBpc0ludGVybmFsUm9vdFZpZXcgPSByb290U2VsZWN0b3JPck5vZGUgPT09IHVuZGVmaW5lZDtcblxuICAgIGxldCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTM7XG5cbiAgICBpZiAobmdNb2R1bGUpIHtcbiAgICAgIGNvbnN0IHdyYXBwZXIgPSBuZ01vZHVsZS5pbmplY3Rvci5nZXQoV1JBUF9SRU5ERVJFUl9GQUNUT1JZMiwgKHY6IFJlbmRlcmVyRmFjdG9yeTIpID0+IHYpO1xuICAgICAgcmVuZGVyZXJGYWN0b3J5ID0gd3JhcHBlcihuZ01vZHVsZS5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MikpIGFzIFJlbmRlcmVyRmFjdG9yeTM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeSA9IGRvbVJlbmRlcmVyRmFjdG9yeTM7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdE5vZGUgPSBpc0ludGVybmFsUm9vdFZpZXcgP1xuICAgICAgICBlbGVtZW50Q3JlYXRlKHRoaXMuc2VsZWN0b3IsIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCB0aGlzLmNvbXBvbmVudERlZikpIDpcbiAgICAgICAgbG9jYXRlSG9zdEVsZW1lbnQocmVuZGVyZXJGYWN0b3J5LCByb290U2VsZWN0b3JPck5vZGUpO1xuXG4gICAgLy8gVGhlIGZpcnN0IGluZGV4IG9mIHRoZSBmaXJzdCBzZWxlY3RvciBpcyB0aGUgdGFnIG5hbWUuXG4gICAgY29uc3QgY29tcG9uZW50VGFnID0gdGhpcy5jb21wb25lbnREZWYuc2VsZWN0b3JzICFbMF0gIVswXSBhcyBzdHJpbmc7XG5cbiAgICBjb25zdCByb290Q29udGV4dDogUm9vdENvbnRleHQgPSBuZ01vZHVsZSAmJiAhaXNJbnRlcm5hbFJvb3RWaWV3ID9cbiAgICAgICAgbmdNb2R1bGUuaW5qZWN0b3IuZ2V0KFJPT1RfQ09OVEVYVCkgOlxuICAgICAgICBjcmVhdGVSb290Q29udGV4dChyZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgcm9vdCB2aWV3LiBVc2VzIGVtcHR5IFRWaWV3IGFuZCBDb250ZW50VGVtcGxhdGUuXG4gICAgY29uc3Qgcm9vdFZpZXc6IExWaWV3RGF0YSA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3ROb2RlLCB0aGlzLmNvbXBvbmVudERlZiksXG4gICAgICAgIGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsKSwgcm9vdENvbnRleHQsXG4gICAgICAgIHRoaXMuY29tcG9uZW50RGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKTtcbiAgICByb290Vmlld1tJTkpFQ1RPUl0gPSBuZ01vZHVsZSAmJiBuZ01vZHVsZS5pbmplY3RvciB8fCBudWxsO1xuXG4gICAgLy8gcm9vdFZpZXcgaXMgdGhlIHBhcmVudCB3aGVuIGJvb3RzdHJhcHBpbmdcbiAgICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KHJvb3RWaWV3LCBudWxsICEpO1xuXG4gICAgbGV0IGNvbXBvbmVudDogVDtcbiAgICBsZXQgZWxlbWVudE5vZGU6IExFbGVtZW50Tm9kZTtcbiAgICB0cnkge1xuICAgICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG5cbiAgICAgIC8vIENyZWF0ZSBlbGVtZW50IG5vZGUgYXQgaW5kZXggMCBpbiBkYXRhIGFycmF5XG4gICAgICBlbGVtZW50Tm9kZSA9IGhvc3RFbGVtZW50KGNvbXBvbmVudFRhZywgaG9zdE5vZGUsIHRoaXMuY29tcG9uZW50RGVmKTtcblxuICAgICAgLy8gQ3JlYXRlIGRpcmVjdGl2ZSBpbnN0YW5jZSB3aXRoIGZhY3RvcnkoKSBhbmQgc3RvcmUgYXQgaW5kZXggMCBpbiBkaXJlY3RpdmVzIGFycmF5XG4gICAgICBjb21wb25lbnQgPSBiYXNlRGlyZWN0aXZlQ3JlYXRlKDAsIHRoaXMuY29tcG9uZW50RGVmLmZhY3RvcnkoKSwgdGhpcy5jb21wb25lbnREZWYpO1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50RGVmLmhvc3RCaW5kaW5ncykge1xuICAgICAgICBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soMCwgdGhpcy5jb21wb25lbnREZWYuaG9zdFZhcnMpO1xuICAgICAgfVxuICAgICAgcm9vdENvbnRleHQuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKGVsZW1lbnROb2RlLm5vZGVJbmplY3RvciwgY29tcG9uZW50LCBlbGVtZW50Tm9kZS5kYXRhICEpO1xuICAgICAgKGVsZW1lbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhKVtDT05URVhUXSA9IGNvbXBvbmVudDtcbiAgICAgIC8vIFRPRE86IHNob3VsZCBMaWZlY3ljbGVIb29rc0ZlYXR1cmUgYW5kIG90aGVyIGhvc3QgZmVhdHVyZXMgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBjb21waWxlciBhbmRcbiAgICAgIC8vIGV4ZWN1dGVkIGhlcmU/XG4gICAgICAvLyBBbmd1bGFyIDUgcmVmZXJlbmNlOiBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvbGlmZWN5Y2xlLWhvb2tzLXZjcmVmXG4gICAgICBMaWZlY3ljbGVIb29rc0ZlYXR1cmUoY29tcG9uZW50LCB0aGlzLmNvbXBvbmVudERlZik7XG5cbiAgICAgIHNldEhvc3RCaW5kaW5ncyhyb290Vmlld1tUVklFV10uaG9zdEJpbmRpbmdzKTtcblxuICAgICAgLy8gVHJhbnNmb3JtIHRoZSBhcnJheXMgb2YgbmF0aXZlIG5vZGVzIGludG8gYSBMTm9kZSBzdHJ1Y3R1cmUgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgdGhlXG4gICAgICAvLyBwcm9qZWN0aW9uIGluc3RydWN0aW9uLiBUaGlzIGlzIG5lZWRlZCB0byBzdXBwb3J0IHRoZSByZXByb2plY3Rpb24gb2YgdGhlc2Ugbm9kZXMuXG4gICAgICBpZiAocHJvamVjdGFibGVOb2Rlcykge1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBjb25zdCBwcm9qZWN0aW9uOiBUTm9kZVtdID0gZWxlbWVudE5vZGUudE5vZGUucHJvamVjdGlvbiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb2plY3RhYmxlTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBub2RlTGlzdCA9IHByb2plY3RhYmxlTm9kZXNbaV07XG4gICAgICAgICAgbGV0IGZpcnN0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgICAgICAgIGxldCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGVMaXN0Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBhZGp1c3RCbHVlcHJpbnRGb3JOZXdOb2RlKHJvb3RWaWV3KTtcbiAgICAgICAgICAgIGNvbnN0IGxOb2RlID1cbiAgICAgICAgICAgICAgICBjcmVhdGVMTm9kZSgrK2luZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbm9kZUxpc3Rbal0gYXMgUkVsZW1lbnQsIG51bGwsIG51bGwpO1xuICAgICAgICAgICAgaWYgKHByZXZpb3VzVE5vZGUpIHtcbiAgICAgICAgICAgICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gbE5vZGUudE5vZGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmaXJzdFROb2RlID0gbE5vZGUudE5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2aW91c1ROb2RlID0gbE5vZGUudE5vZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb2plY3Rpb24ucHVzaChmaXJzdFROb2RlICEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEV4ZWN1dGUgdGhlIHRlbXBsYXRlIGluIGNyZWF0aW9uIG1vZGUgb25seSwgYW5kIHRoZW4gdHVybiBvZmYgdGhlIENyZWF0aW9uTW9kZSBmbGFnXG4gICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGVsZW1lbnROb2RlLCBlbGVtZW50Tm9kZS5kYXRhICFbVFZJRVddLCBjb21wb25lbnQsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgICBlbGVtZW50Tm9kZS5kYXRhICFbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgZW50ZXJWaWV3KG9sZFZpZXcsIG51bGwpO1xuICAgICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICBuZXcgQ29tcG9uZW50UmVmKHRoaXMuY29tcG9uZW50VHlwZSwgY29tcG9uZW50LCByb290VmlldywgaW5qZWN0b3IsIGhvc3ROb2RlICEpO1xuICAgIGlmIChpc0ludGVybmFsUm9vdFZpZXcpIHtcbiAgICAgIC8vIFRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGludGVybmFsIHJvb3QgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgY29tcG9uZW50J3MgaG9zdCB2aWV3IG5vZGVcbiAgICAgIGNvbXBvbmVudFJlZi5ob3N0Vmlldy5fbFZpZXdOb2RlICEudE5vZGUuY2hpbGQgPSBlbGVtZW50Tm9kZS50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBDb21wb25lbnQgY3JlYXRlZCB2aWEgYSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0uXG4gKlxuICogYENvbXBvbmVudFJlZmAgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBDb21wb25lbnQgSW5zdGFuY2UgYXMgd2VsbCBvdGhlciBvYmplY3RzIHJlbGF0ZWQgdG8gdGhpc1xuICogQ29tcG9uZW50IEluc3RhbmNlIGFuZCBhbGxvd3MgeW91IHRvIGRlc3Ryb3kgdGhlIENvbXBvbmVudCBJbnN0YW5jZSB2aWEgdGhlIHtAbGluayAjZGVzdHJveX1cbiAqIG1ldGhvZC5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxUPiB7XG4gIGRlc3Ryb3lDYnM6ICgoKSA9PiB2b2lkKVtdfG51bGwgPSBbXTtcbiAgbG9jYXRpb246IHZpZXdFbmdpbmVfRWxlbWVudFJlZjxhbnk+O1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIGluc3RhbmNlOiBUO1xuICBob3N0VmlldzogVmlld1JlZjxUPjtcbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IFZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWY7XG4gIGNvbXBvbmVudFR5cGU6IFR5cGU8VD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb21wb25lbnRUeXBlOiBUeXBlPFQ+LCBpbnN0YW5jZTogVCwgcm9vdFZpZXc6IExWaWV3RGF0YSwgaW5qZWN0b3I6IEluamVjdG9yLFxuICAgICAgaG9zdE5vZGU6IFJFbGVtZW50KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG4gICAgdGhpcy5ob3N0VmlldyA9IHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgUm9vdFZpZXdSZWY8VD4ocm9vdFZpZXcpO1xuICAgIHRoaXMuaG9zdFZpZXcuX2xWaWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKC0xLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgcm9vdFZpZXcpO1xuICAgIHRoaXMuaW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgICB0aGlzLmxvY2F0aW9uID0gbmV3IHZpZXdFbmdpbmVfRWxlbWVudFJlZihob3N0Tm9kZSk7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIHRoaXMuZGVzdHJveUNicyA9IG51bGw7XG4gIH1cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuIl19