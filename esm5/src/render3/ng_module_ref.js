/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { INJECTOR, Injector } from '../di/injector';
import { InjectFlags } from '../di/interface/injector';
import { createInjector } from '../di/r3_injector';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { NgModuleFactory as viewEngine_NgModuleFactory, NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { assertDefined } from '../util/assert';
import { stringify } from '../util/stringify';
import { ComponentFactoryResolver } from './component_ref';
import { getNgModuleDef } from './definition';
var COMPONENT_FACTORY_RESOLVER = {
    provide: viewEngine_ComponentFactoryResolver,
    useClass: ComponentFactoryResolver,
    deps: [viewEngine_NgModuleRef],
};
var NgModuleRef = /** @class */ (function (_super) {
    tslib_1.__extends(NgModuleRef, _super);
    function NgModuleRef(ngModuleType, _parent) {
        var _this = _super.call(this) || this;
        _this._parent = _parent;
        // tslint:disable-next-line:require-internal-with-underscore
        _this._bootstrapComponents = [];
        _this.injector = _this;
        _this.destroyCbs = [];
        var ngModuleDef = getNgModuleDef(ngModuleType);
        ngDevMode && assertDefined(ngModuleDef, "NgModule '" + stringify(ngModuleType) + "' is not a subtype of 'NgModuleType'.");
        _this._bootstrapComponents = ngModuleDef.bootstrap;
        var additionalProviders = [
            {
                provide: viewEngine_NgModuleRef,
                useValue: _this,
            },
            COMPONENT_FACTORY_RESOLVER
        ];
        _this._r3Injector = createInjector(ngModuleType, _parent, additionalProviders, stringify(ngModuleType));
        _this.instance = _this.get(ngModuleType);
        return _this;
    }
    NgModuleRef.prototype.get = function (token, notFoundValue, injectFlags) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        if (injectFlags === void 0) { injectFlags = InjectFlags.Default; }
        if (token === Injector || token === viewEngine_NgModuleRef || token === INJECTOR) {
            return this;
        }
        return this._r3Injector.get(token, notFoundValue, injectFlags);
    };
    Object.defineProperty(NgModuleRef.prototype, "componentFactoryResolver", {
        get: function () {
            return this.get(viewEngine_ComponentFactoryResolver);
        },
        enumerable: true,
        configurable: true
    });
    NgModuleRef.prototype.destroy = function () {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
        var injector = this._r3Injector;
        !injector.destroyed && injector.destroy();
        this.destroyCbs.forEach(function (fn) { return fn(); });
        this.destroyCbs = null;
    };
    NgModuleRef.prototype.onDestroy = function (callback) {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
        this.destroyCbs.push(callback);
    };
    return NgModuleRef;
}(viewEngine_NgModuleRef));
export { NgModuleRef };
var NgModuleFactory = /** @class */ (function (_super) {
    tslib_1.__extends(NgModuleFactory, _super);
    function NgModuleFactory(moduleType) {
        var _this = _super.call(this) || this;
        _this.moduleType = moduleType;
        return _this;
    }
    NgModuleFactory.prototype.create = function (parentInjector) {
        return new NgModuleRef(this.moduleType, parentInjector);
    };
    return NgModuleFactory;
}(viewEngine_NgModuleFactory));
export { NgModuleFactory };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbmdfbW9kdWxlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNsRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFFckQsT0FBTyxFQUFhLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTdELE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBc0IsZUFBZSxJQUFJLDBCQUEwQixFQUFFLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBRXRKLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUMsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUk1QyxJQUFNLDBCQUEwQixHQUFtQjtJQUNqRCxPQUFPLEVBQUUsbUNBQW1DO0lBQzVDLFFBQVEsRUFBRSx3QkFBd0I7SUFDbEMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLENBQUM7Q0FDL0IsQ0FBQztBQUVGO0lBQW9DLHVDQUF5QjtJQVMzRCxxQkFBWSxZQUFxQixFQUFTLE9BQXNCO1FBQWhFLFlBQ0UsaUJBQU8sU0FpQlI7UUFsQnlDLGFBQU8sR0FBUCxPQUFPLENBQWU7UUFSaEUsNERBQTREO1FBQzVELDBCQUFvQixHQUFnQixFQUFFLENBQUM7UUFHdkMsY0FBUSxHQUFhLEtBQUksQ0FBQztRQUUxQixnQkFBVSxHQUF3QixFQUFFLENBQUM7UUFJbkMsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2pELFNBQVMsSUFBSSxhQUFhLENBQ1QsV0FBVyxFQUNYLGVBQWEsU0FBUyxDQUFDLFlBQVksQ0FBQywwQ0FBdUMsQ0FBQyxDQUFDO1FBRTlGLEtBQUksQ0FBQyxvQkFBb0IsR0FBRyxXQUFhLENBQUMsU0FBUyxDQUFDO1FBQ3BELElBQU0sbUJBQW1CLEdBQXFCO1lBQzVDO2dCQUNFLE9BQU8sRUFBRSxzQkFBc0I7Z0JBQy9CLFFBQVEsRUFBRSxLQUFJO2FBQ2Y7WUFDRCwwQkFBMEI7U0FDM0IsQ0FBQztRQUNGLEtBQUksQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUM3QixZQUFZLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBZSxDQUFDO1FBQ3ZGLEtBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQzs7SUFDekMsQ0FBQztJQUVELHlCQUFHLEdBQUgsVUFBSSxLQUFVLEVBQUUsYUFBZ0QsRUFDNUQsV0FBOEM7UUFEbEMsOEJBQUEsRUFBQSxnQkFBcUIsUUFBUSxDQUFDLGtCQUFrQjtRQUM1RCw0QkFBQSxFQUFBLGNBQTJCLFdBQVcsQ0FBQyxPQUFPO1FBQ2hELElBQUksS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssc0JBQXNCLElBQUksS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUNoRixPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCxzQkFBSSxpREFBd0I7YUFBNUI7WUFDRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztRQUN2RCxDQUFDOzs7T0FBQTtJQUVELDZCQUFPLEdBQVA7UUFDRSxTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUMxRSxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ2xDLENBQUMsUUFBUSxDQUFDLFNBQVMsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUMsSUFBSSxDQUFDLFVBQVksQ0FBQyxPQUFPLENBQUMsVUFBQSxFQUFFLElBQUksT0FBQSxFQUFFLEVBQUUsRUFBSixDQUFJLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN6QixDQUFDO0lBQ0QsK0JBQVMsR0FBVCxVQUFVLFFBQW9CO1FBQzVCLFNBQVMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxVQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFDSCxrQkFBQztBQUFELENBQUMsQUFwREQsQ0FBb0Msc0JBQXNCLEdBb0R6RDs7QUFFRDtJQUF3QywyQ0FBNkI7SUFDbkUseUJBQW1CLFVBQW1CO1FBQXRDLFlBQTBDLGlCQUFPLFNBQUc7UUFBakMsZ0JBQVUsR0FBVixVQUFVLENBQVM7O0lBQWEsQ0FBQztJQUVwRCxnQ0FBTSxHQUFOLFVBQU8sY0FBNkI7UUFDbEMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFDSCxzQkFBQztBQUFELENBQUMsQUFORCxDQUF3QywwQkFBMEIsR0FNakUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SU5KRUNUT1IsIEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7UjNJbmplY3RvciwgY3JlYXRlSW5qZWN0b3J9IGZyb20gJy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge0ludGVybmFsTmdNb2R1bGVSZWYsIE5nTW9kdWxlRmFjdG9yeSBhcyB2aWV3RW5naW5lX05nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7TmdNb2R1bGVEZWZ9IGZyb20gJy4uL21ldGFkYXRhL25nX21vZHVsZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7Z2V0TmdNb2R1bGVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmdNb2R1bGVUeXBlPFQgPSBhbnk+IGV4dGVuZHMgVHlwZTxUPiB7IG5nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxUPjsgfVxuXG5jb25zdCBDT01QT05FTlRfRkFDVE9SWV9SRVNPTFZFUjogU3RhdGljUHJvdmlkZXIgPSB7XG4gIHByb3ZpZGU6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICB1c2VDbGFzczogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICBkZXBzOiBbdmlld0VuZ2luZV9OZ01vZHVsZVJlZl0sXG59O1xuXG5leHBvcnQgY2xhc3MgTmdNb2R1bGVSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxOZ01vZHVsZVJlZjxUPiB7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpyZXF1aXJlLWludGVybmFsLXdpdGgtdW5kZXJzY29yZVxuICBfYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10gPSBbXTtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gIF9yM0luamVjdG9yOiBSM0luamVjdG9yO1xuICBpbmplY3RvcjogSW5qZWN0b3IgPSB0aGlzO1xuICBpbnN0YW5jZTogVDtcbiAgZGVzdHJveUNiczogKCgpID0+IHZvaWQpW118bnVsbCA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKG5nTW9kdWxlVHlwZTogVHlwZTxUPiwgcHVibGljIF9wYXJlbnQ6IEluamVjdG9yfG51bGwpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYobmdNb2R1bGVUeXBlKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICAgIG5nTW9kdWxlRGVmLFxuICAgICAgICAgICAgICAgICAgICAgYE5nTW9kdWxlICcke3N0cmluZ2lmeShuZ01vZHVsZVR5cGUpfScgaXMgbm90IGEgc3VidHlwZSBvZiAnTmdNb2R1bGVUeXBlJy5gKTtcblxuICAgIHRoaXMuX2Jvb3RzdHJhcENvbXBvbmVudHMgPSBuZ01vZHVsZURlZiAhLmJvb3RzdHJhcDtcbiAgICBjb25zdCBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICAgICAge1xuICAgICAgICBwcm92aWRlOiB2aWV3RW5naW5lX05nTW9kdWxlUmVmLFxuICAgICAgICB1c2VWYWx1ZTogdGhpcyxcbiAgICAgIH0sXG4gICAgICBDT01QT05FTlRfRkFDVE9SWV9SRVNPTFZFUlxuICAgIF07XG4gICAgdGhpcy5fcjNJbmplY3RvciA9IGNyZWF0ZUluamVjdG9yKFxuICAgICAgICBuZ01vZHVsZVR5cGUsIF9wYXJlbnQsIGFkZGl0aW9uYWxQcm92aWRlcnMsIHN0cmluZ2lmeShuZ01vZHVsZVR5cGUpKSBhcyBSM0luamVjdG9yO1xuICAgIHRoaXMuaW5zdGFuY2UgPSB0aGlzLmdldChuZ01vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgIGluamVjdEZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBhbnkge1xuICAgIGlmICh0b2tlbiA9PT0gSW5qZWN0b3IgfHwgdG9rZW4gPT09IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYgfHwgdG9rZW4gPT09IElOSkVDVE9SKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3IzSW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBpbmplY3RGbGFncyk7XG4gIH1cblxuICBnZXQgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgICByZXR1cm4gdGhpcy5nZXQodmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIGNvbnN0IGluamVjdG9yID0gdGhpcy5fcjNJbmplY3RvcjtcbiAgICAhaW5qZWN0b3IuZGVzdHJveWVkICYmIGluamVjdG9yLmRlc3Ryb3koKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIHRoaXMuZGVzdHJveUNicyA9IG51bGw7XG4gIH1cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTmdNb2R1bGVGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9OZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbW9kdWxlVHlwZTogVHlwZTxUPikgeyBzdXBlcigpOyB9XG5cbiAgY3JlYXRlKHBhcmVudEluamVjdG9yOiBJbmplY3RvcnxudWxsKTogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxUPiB7XG4gICAgcmV0dXJuIG5ldyBOZ01vZHVsZVJlZih0aGlzLm1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yKTtcbiAgfVxufVxuIl19