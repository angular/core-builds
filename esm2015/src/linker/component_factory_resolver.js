/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/linker/component_factory_resolver.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util/stringify';
import { ComponentFactory } from './component_factory';
/**
 * @param {?} component
 * @return {?}
 */
export function noComponentFactoryError(component) {
    /** @type {?} */
    const error = Error(`No component factory found for ${stringify(component)}. Did you add it to @NgModule.entryComponents?`);
    ((/** @type {?} */ (error)))[ERROR_COMPONENT] = component;
    return error;
}
/** @type {?} */
const ERROR_COMPONENT = 'ngComponent';
/**
 * @param {?} error
 * @return {?}
 */
export function getComponent(error) {
    return ((/** @type {?} */ (error)))[ERROR_COMPONENT];
}
class _NullComponentFactoryResolver {
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        throw noComponentFactoryError(component);
    }
}
/**
 * A simple registry that maps `Components` to generated `ComponentFactory` classes
 * that can be used to create instances of components.
 * Use to obtain the factory for a given component type,
 * then use the factory's `create()` method to create a component of that type.
 *
 * @see [Dynamic Components](guide/dynamic-component-loader)
 * \@publicApi
 * @abstract
 */
let ComponentFactoryResolver = /** @class */ (() => {
    /**
     * A simple registry that maps `Components` to generated `ComponentFactory` classes
     * that can be used to create instances of components.
     * Use to obtain the factory for a given component type,
     * then use the factory's `create()` method to create a component of that type.
     *
     * @see [Dynamic Components](guide/dynamic-component-loader)
     * \@publicApi
     * @abstract
     */
    class ComponentFactoryResolver {
    }
    ComponentFactoryResolver.NULL = new _NullComponentFactoryResolver();
    return ComponentFactoryResolver;
})();
export { ComponentFactoryResolver };
if (false) {
    /** @type {?} */
    ComponentFactoryResolver.NULL;
    /**
     * Retrieves the factory object that creates a component of the given type.
     * @abstract
     * @template T
     * @param {?} component The component type.
     * @return {?}
     */
    ComponentFactoryResolver.prototype.resolveComponentFactory = function (component) { };
}
export class CodegenComponentFactoryResolver {
    /**
     * @param {?} factories
     * @param {?} _parent
     * @param {?} _ngModule
     */
    constructor(factories, _parent, _ngModule) {
        this._parent = _parent;
        this._ngModule = _ngModule;
        this._factories = new Map();
        for (let i = 0; i < factories.length; i++) {
            /** @type {?} */
            const factory = factories[i];
            this._factories.set(factory.componentType, factory);
        }
    }
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        /** @type {?} */
        let factory = this._factories.get(component);
        if (!factory && this._parent) {
            factory = this._parent.resolveComponentFactory(component);
        }
        if (!factory) {
            throw noComponentFactoryError(component);
        }
        return new ComponentFactoryBoundToModule(factory, this._ngModule);
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    CodegenComponentFactoryResolver.prototype._factories;
    /**
     * @type {?}
     * @private
     */
    CodegenComponentFactoryResolver.prototype._parent;
    /**
     * @type {?}
     * @private
     */
    CodegenComponentFactoryResolver.prototype._ngModule;
}
/**
 * @template C
 */
export class ComponentFactoryBoundToModule extends ComponentFactory {
    /**
     * @param {?} factory
     * @param {?} ngModule
     */
    constructor(factory, ngModule) {
        super();
        this.factory = factory;
        this.ngModule = ngModule;
        this.selector = factory.selector;
        this.componentType = factory.componentType;
        this.ngContentSelectors = factory.ngContentSelectors;
        this.inputs = factory.inputs;
        this.outputs = factory.outputs;
    }
    /**
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @param {?=} ngModule
     * @return {?}
     */
    create(injector, projectableNodes, rootSelectorOrNode, ngModule) {
        return this.factory.create(injector, projectableNodes, rootSelectorOrNode, ngModule || this.ngModule);
    }
}
if (false) {
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.selector;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.componentType;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.ngContentSelectors;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.inputs;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.outputs;
    /**
     * @type {?}
     * @private
     */
    ComponentFactoryBoundToModule.prototype.factory;
    /**
     * @type {?}
     * @private
     */
    ComponentFactoryBoundToModule.prototype.ngModule;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBZSxNQUFNLHFCQUFxQixDQUFDOzs7OztBQUduRSxNQUFNLFVBQVUsdUJBQXVCLENBQUMsU0FBbUI7O1VBQ25ELEtBQUssR0FBRyxLQUFLLENBQUMsa0NBQ2hCLFNBQVMsQ0FBQyxTQUFTLENBQUMsZ0RBQWdELENBQUM7SUFDekUsQ0FBQyxtQkFBQSxLQUFLLEVBQU8sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUM1QyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7O01BRUssZUFBZSxHQUFHLGFBQWE7Ozs7O0FBRXJDLE1BQU0sVUFBVSxZQUFZLENBQUMsS0FBWTtJQUN2QyxPQUFPLENBQUMsbUJBQUEsS0FBSyxFQUFPLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBR0QsTUFBTSw2QkFBNkI7Ozs7OztJQUNqQyx1QkFBdUIsQ0FBSSxTQUFtQztRQUM1RCxNQUFNLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FDRjs7Ozs7Ozs7Ozs7QUFXRDs7Ozs7Ozs7Ozs7SUFBQSxNQUFzQix3QkFBd0I7O0lBQ3JDLDZCQUFJLEdBQTZCLElBQUksNkJBQTZCLEVBQUUsQ0FBQztJQU05RSwrQkFBQztLQUFBO1NBUHFCLHdCQUF3Qjs7O0lBQzVDLDhCQUE0RTs7Ozs7Ozs7SUFLNUUsc0ZBQTZFOztBQUcvRSxNQUFNLE9BQU8sK0JBQStCOzs7Ozs7SUFHMUMsWUFDSSxTQUFrQyxFQUFVLE9BQWlDLEVBQ3JFLFNBQTJCO1FBRFMsWUFBTyxHQUFQLE9BQU8sQ0FBMEI7UUFDckUsY0FBUyxHQUFULFNBQVMsQ0FBa0I7UUFKL0IsZUFBVSxHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1FBS3pELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztrQkFDbkMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUM7Ozs7OztJQUVELHVCQUF1QixDQUFJLFNBQW1DOztZQUN4RCxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQzVDLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUM1QixPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMzRDtRQUNELElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixNQUFNLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsT0FBTyxJQUFJLDZCQUE2QixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEUsQ0FBQztDQUNGOzs7Ozs7SUFyQkMscURBQTJEOzs7OztJQUduQixrREFBeUM7Ozs7O0lBQzdFLG9EQUFtQzs7Ozs7QUFtQnpDLE1BQU0sT0FBTyw2QkFBaUMsU0FBUSxnQkFBbUI7Ozs7O0lBT3ZFLFlBQW9CLE9BQTRCLEVBQVUsUUFBMEI7UUFDbEYsS0FBSyxFQUFFLENBQUM7UUFEVSxZQUFPLEdBQVAsT0FBTyxDQUFxQjtRQUFVLGFBQVEsR0FBUixRQUFRLENBQWtCO1FBRWxGLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUNqQyxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFDM0MsSUFBSSxDQUFDLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQztRQUNyRCxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQ2pDLENBQUM7Ozs7Ozs7O0lBRUQsTUFBTSxDQUNGLFFBQWtCLEVBQUUsZ0JBQTBCLEVBQUUsa0JBQStCLEVBQy9FLFFBQTJCO1FBQzdCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQ3RCLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7Q0FDRjs7O0lBckJDLGlEQUEwQjs7SUFDMUIsc0RBQWtDOztJQUNsQywyREFBc0M7O0lBQ3RDLCtDQUE0RDs7SUFDNUQsZ0RBQTZEOzs7OztJQUVqRCxnREFBb0M7Ozs7O0lBQUUsaURBQWtDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmfSBmcm9tICcuL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuXG5leHBvcnQgZnVuY3Rpb24gbm9Db21wb25lbnRGYWN0b3J5RXJyb3IoY29tcG9uZW50OiBGdW5jdGlvbikge1xuICBjb25zdCBlcnJvciA9IEVycm9yKGBObyBjb21wb25lbnQgZmFjdG9yeSBmb3VuZCBmb3IgJHtcbiAgICAgIHN0cmluZ2lmeShjb21wb25lbnQpfS4gRGlkIHlvdSBhZGQgaXQgdG8gQE5nTW9kdWxlLmVudHJ5Q29tcG9uZW50cz9gKTtcbiAgKGVycm9yIGFzIGFueSlbRVJST1JfQ09NUE9ORU5UXSA9IGNvbXBvbmVudDtcbiAgcmV0dXJuIGVycm9yO1xufVxuXG5jb25zdCBFUlJPUl9DT01QT05FTlQgPSAnbmdDb21wb25lbnQnO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50KGVycm9yOiBFcnJvcik6IFR5cGU8YW55PiB7XG4gIHJldHVybiAoZXJyb3IgYXMgYW55KVtFUlJPUl9DT01QT05FTlRdO1xufVxuXG5cbmNsYXNzIF9OdWxsQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGltcGxlbWVudHMgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiB7bmV3KC4uLmFyZ3M6IGFueVtdKTogVH0pOiBDb21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICB0aHJvdyBub0NvbXBvbmVudEZhY3RvcnlFcnJvcihjb21wb25lbnQpO1xuICB9XG59XG5cbi8qKlxuICogQSBzaW1wbGUgcmVnaXN0cnkgdGhhdCBtYXBzIGBDb21wb25lbnRzYCB0byBnZW5lcmF0ZWQgYENvbXBvbmVudEZhY3RvcnlgIGNsYXNzZXNcbiAqIHRoYXQgY2FuIGJlIHVzZWQgdG8gY3JlYXRlIGluc3RhbmNlcyBvZiBjb21wb25lbnRzLlxuICogVXNlIHRvIG9idGFpbiB0aGUgZmFjdG9yeSBmb3IgYSBnaXZlbiBjb21wb25lbnQgdHlwZSxcbiAqIHRoZW4gdXNlIHRoZSBmYWN0b3J5J3MgYGNyZWF0ZSgpYCBtZXRob2QgdG8gY3JlYXRlIGEgY29tcG9uZW50IG9mIHRoYXQgdHlwZS5cbiAqXG4gKiBAc2VlIFtEeW5hbWljIENvbXBvbmVudHNdKGd1aWRlL2R5bmFtaWMtY29tcG9uZW50LWxvYWRlcilcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIHN0YXRpYyBOVUxMOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBuZXcgX051bGxDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTtcbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgZmFjdG9yeSBvYmplY3QgdGhhdCBjcmVhdGVzIGEgY29tcG9uZW50IG9mIHRoZSBnaXZlbiB0eXBlLlxuICAgKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgdHlwZS5cbiAgICovXG4gIGFic3RyYWN0IHJlc29sdmVDb21wb25lbnRGYWN0b3J5PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZhY3Rvcnk8VD47XG59XG5cbmV4cG9ydCBjbGFzcyBDb2RlZ2VuQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGltcGxlbWVudHMgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcHJpdmF0ZSBfZmFjdG9yaWVzID0gbmV3IE1hcDxhbnksIENvbXBvbmVudEZhY3Rvcnk8YW55Pj4oKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGZhY3RvcmllczogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10sIHByaXZhdGUgX3BhcmVudDogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICAgICAgcHJpdmF0ZSBfbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY3Rvcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZmFjdG9yeSA9IGZhY3Rvcmllc1tpXTtcbiAgICAgIHRoaXMuX2ZhY3Rvcmllcy5zZXQoZmFjdG9yeS5jb21wb25lbnRUeXBlLCBmYWN0b3J5KTtcbiAgICB9XG4gIH1cblxuICByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IHtuZXcoLi4uYXJnczogYW55W10pOiBUfSk6IENvbXBvbmVudEZhY3Rvcnk8VD4ge1xuICAgIGxldCBmYWN0b3J5ID0gdGhpcy5fZmFjdG9yaWVzLmdldChjb21wb25lbnQpO1xuICAgIGlmICghZmFjdG9yeSAmJiB0aGlzLl9wYXJlbnQpIHtcbiAgICAgIGZhY3RvcnkgPSB0aGlzLl9wYXJlbnQucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcbiAgICB9XG4gICAgaWYgKCFmYWN0b3J5KSB7XG4gICAgICB0aHJvdyBub0NvbXBvbmVudEZhY3RvcnlFcnJvcihjb21wb25lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbXBvbmVudEZhY3RvcnlCb3VuZFRvTW9kdWxlKGZhY3RvcnksIHRoaXMuX25nTW9kdWxlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeUJvdW5kVG9Nb2R1bGU8Qz4gZXh0ZW5kcyBDb21wb25lbnRGYWN0b3J5PEM+IHtcbiAgcmVhZG9ubHkgc2VsZWN0b3I6IHN0cmluZztcbiAgcmVhZG9ubHkgY29tcG9uZW50VHlwZTogVHlwZTxhbnk+O1xuICByZWFkb25seSBuZ0NvbnRlbnRTZWxlY3RvcnM6IHN0cmluZ1tdO1xuICByZWFkb25seSBpbnB1dHM6IHtwcm9wTmFtZTogc3RyaW5nLCB0ZW1wbGF0ZU5hbWU6IHN0cmluZ31bXTtcbiAgcmVhZG9ubHkgb3V0cHV0czoge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPiwgcHJpdmF0ZSBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55Pikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zZWxlY3RvciA9IGZhY3Rvcnkuc2VsZWN0b3I7XG4gICAgdGhpcy5jb21wb25lbnRUeXBlID0gZmFjdG9yeS5jb21wb25lbnRUeXBlO1xuICAgIHRoaXMubmdDb250ZW50U2VsZWN0b3JzID0gZmFjdG9yeS5uZ0NvbnRlbnRTZWxlY3RvcnM7XG4gICAgdGhpcy5pbnB1dHMgPSBmYWN0b3J5LmlucHV0cztcbiAgICB0aGlzLm91dHB1dHMgPSBmYWN0b3J5Lm91dHB1dHM7XG4gIH1cblxuICBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55LFxuICAgICAgbmdNb2R1bGU/OiBOZ01vZHVsZVJlZjxhbnk+KTogQ29tcG9uZW50UmVmPEM+IHtcbiAgICByZXR1cm4gdGhpcy5mYWN0b3J5LmNyZWF0ZShcbiAgICAgICAgaW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHJvb3RTZWxlY3Rvck9yTm9kZSwgbmdNb2R1bGUgfHwgdGhpcy5uZ01vZHVsZSk7XG4gIH1cbn1cbiJdfQ==