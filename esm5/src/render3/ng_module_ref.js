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
        _this._r3Injector = createInjector(ngModuleType, _parent, additionalProviders);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbmdfbW9kdWxlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNsRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFFckQsT0FBTyxFQUFhLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTdELE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBc0IsZUFBZSxJQUFJLDBCQUEwQixFQUFFLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBRXRKLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUk1QyxJQUFNLDBCQUEwQixHQUFtQjtJQUNqRCxPQUFPLEVBQUUsbUNBQW1DO0lBQzVDLFFBQVEsRUFBRSx3QkFBd0I7SUFDbEMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLENBQUM7Q0FDL0IsQ0FBQztBQUVGO0lBQW9DLHVDQUF5QjtJQVMzRCxxQkFBWSxZQUFxQixFQUFTLE9BQXNCO1FBQWhFLFlBQ0UsaUJBQU8sU0FnQlI7UUFqQnlDLGFBQU8sR0FBUCxPQUFPLENBQWU7UUFSaEUsNERBQTREO1FBQzVELDBCQUFvQixHQUFnQixFQUFFLENBQUM7UUFHdkMsY0FBUSxHQUFhLEtBQUksQ0FBQztRQUUxQixnQkFBVSxHQUF3QixFQUFFLENBQUM7UUFJbkMsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2pELFNBQVMsSUFBSSxhQUFhLENBQ1QsV0FBVyxFQUNYLGVBQWEsU0FBUyxDQUFDLFlBQVksQ0FBQywwQ0FBdUMsQ0FBQyxDQUFDO1FBRTlGLEtBQUksQ0FBQyxvQkFBb0IsR0FBRyxXQUFhLENBQUMsU0FBUyxDQUFDO1FBQ3BELElBQU0sbUJBQW1CLEdBQXFCO1lBQzVDO2dCQUNFLE9BQU8sRUFBRSxzQkFBc0I7Z0JBQy9CLFFBQVEsRUFBRSxLQUFJO2FBQ2Y7WUFDRCwwQkFBMEI7U0FDM0IsQ0FBQztRQUNGLEtBQUksQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsbUJBQW1CLENBQWUsQ0FBQztRQUM1RixLQUFJLENBQUMsUUFBUSxHQUFHLEtBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7O0lBQ3pDLENBQUM7SUFFRCx5QkFBRyxHQUFILFVBQUksS0FBVSxFQUFFLGFBQWdELEVBQzVELFdBQThDO1FBRGxDLDhCQUFBLEVBQUEsZ0JBQXFCLFFBQVEsQ0FBQyxrQkFBa0I7UUFDNUQsNEJBQUEsRUFBQSxjQUEyQixXQUFXLENBQUMsT0FBTztRQUNoRCxJQUFJLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLHNCQUFzQixJQUFJLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDaEYsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsc0JBQUksaURBQXdCO2FBQTVCO1lBQ0UsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7UUFDdkQsQ0FBQzs7O09BQUE7SUFFRCw2QkFBTyxHQUFQO1FBQ0UsU0FBUyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7UUFDMUUsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNsQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxVQUFZLENBQUMsT0FBTyxDQUFDLFVBQUEsRUFBRSxJQUFJLE9BQUEsRUFBRSxFQUFFLEVBQUosQ0FBSSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDekIsQ0FBQztJQUNELCtCQUFTLEdBQVQsVUFBVSxRQUFvQjtRQUM1QixTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsVUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBQ0gsa0JBQUM7QUFBRCxDQUFDLEFBbkRELENBQW9DLHNCQUFzQixHQW1EekQ7O0FBRUQ7SUFBd0MsMkNBQTZCO0lBQ25FLHlCQUFtQixVQUFtQjtRQUF0QyxZQUEwQyxpQkFBTyxTQUFHO1FBQWpDLGdCQUFVLEdBQVYsVUFBVSxDQUFTOztJQUFhLENBQUM7SUFFcEQsZ0NBQU0sR0FBTixVQUFPLGNBQTZCO1FBQ2xDLE9BQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBQ0gsc0JBQUM7QUFBRCxDQUFDLEFBTkQsQ0FBd0MsMEJBQTBCLEdBTWpFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0lOSkVDVE9SLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7U3RhdGljUHJvdmlkZXJ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge1IzSW5qZWN0b3IsIGNyZWF0ZUluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtJbnRlcm5hbE5nTW9kdWxlUmVmLCBOZ01vZHVsZUZhY3RvcnkgYXMgdmlld0VuZ2luZV9OZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlRGVmfSBmcm9tICcuLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7Z2V0TmdNb2R1bGVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmdNb2R1bGVUeXBlPFQgPSBhbnk+IGV4dGVuZHMgVHlwZTxUPiB7IG5nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxUPjsgfVxuXG5jb25zdCBDT01QT05FTlRfRkFDVE9SWV9SRVNPTFZFUjogU3RhdGljUHJvdmlkZXIgPSB7XG4gIHByb3ZpZGU6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICB1c2VDbGFzczogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICBkZXBzOiBbdmlld0VuZ2luZV9OZ01vZHVsZVJlZl0sXG59O1xuXG5leHBvcnQgY2xhc3MgTmdNb2R1bGVSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxOZ01vZHVsZVJlZjxUPiB7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpyZXF1aXJlLWludGVybmFsLXdpdGgtdW5kZXJzY29yZVxuICBfYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10gPSBbXTtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gIF9yM0luamVjdG9yOiBSM0luamVjdG9yO1xuICBpbmplY3RvcjogSW5qZWN0b3IgPSB0aGlzO1xuICBpbnN0YW5jZTogVDtcbiAgZGVzdHJveUNiczogKCgpID0+IHZvaWQpW118bnVsbCA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKG5nTW9kdWxlVHlwZTogVHlwZTxUPiwgcHVibGljIF9wYXJlbnQ6IEluamVjdG9yfG51bGwpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYobmdNb2R1bGVUeXBlKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICAgIG5nTW9kdWxlRGVmLFxuICAgICAgICAgICAgICAgICAgICAgYE5nTW9kdWxlICcke3N0cmluZ2lmeShuZ01vZHVsZVR5cGUpfScgaXMgbm90IGEgc3VidHlwZSBvZiAnTmdNb2R1bGVUeXBlJy5gKTtcblxuICAgIHRoaXMuX2Jvb3RzdHJhcENvbXBvbmVudHMgPSBuZ01vZHVsZURlZiAhLmJvb3RzdHJhcDtcbiAgICBjb25zdCBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICAgICAge1xuICAgICAgICBwcm92aWRlOiB2aWV3RW5naW5lX05nTW9kdWxlUmVmLFxuICAgICAgICB1c2VWYWx1ZTogdGhpcyxcbiAgICAgIH0sXG4gICAgICBDT01QT05FTlRfRkFDVE9SWV9SRVNPTFZFUlxuICAgIF07XG4gICAgdGhpcy5fcjNJbmplY3RvciA9IGNyZWF0ZUluamVjdG9yKG5nTW9kdWxlVHlwZSwgX3BhcmVudCwgYWRkaXRpb25hbFByb3ZpZGVycykgYXMgUjNJbmplY3RvcjtcbiAgICB0aGlzLmluc3RhbmNlID0gdGhpcy5nZXQobmdNb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBpbmplY3RGbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBpZiAodG9rZW4gPT09IEluamVjdG9yIHx8IHRva2VuID09PSB2aWV3RW5naW5lX05nTW9kdWxlUmVmIHx8IHRva2VuID09PSBJTkpFQ1RPUikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9yM0luamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgaW5qZWN0RmxhZ3MpO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuX3IzSW5qZWN0b3I7XG4gICAgIWluamVjdG9yLmRlc3Ryb3llZCAmJiBpbmplY3Rvci5kZXN0cm95KCk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgPSBudWxsO1xuICB9XG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEucHVzaChjYWxsYmFjayk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5nTW9kdWxlRmFjdG9yeTxUPiBleHRlbmRzIHZpZXdFbmdpbmVfTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgY29uc3RydWN0b3IocHVibGljIG1vZHVsZVR5cGU6IFR5cGU8VD4pIHsgc3VwZXIoKTsgfVxuXG4gIGNyZWF0ZShwYXJlbnRJbmplY3RvcjogSW5qZWN0b3J8bnVsbCk6IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8VD4ge1xuICAgIHJldHVybiBuZXcgTmdNb2R1bGVSZWYodGhpcy5tb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG4gIH1cbn1cbiJdfQ==