/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createInjector } from '../di/r3_injector';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { NgModuleFactory as viewEngine_NgModuleFactory, NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { stringify } from '../util';
import { assertDefined } from './assert';
import { ComponentFactoryResolver } from './component_ref';
/**
 * @record
 */
export function NgModuleType() { }
/** @type {?} */
NgModuleType.prototype.ngModuleDef;
/**
 * @record
 */
export function NgModuleDef() { }
/** @type {?} */
NgModuleDef.prototype.bootstrap;
/** @type {?} */
export const COMPONENT_FACTORY_RESOLVER = {
    provide: viewEngine_ComponentFactoryResolver,
    useFactory: () => new ComponentFactoryResolver(),
    deps: [],
};
/**
 * @template T
 */
export class NgModuleRef extends viewEngine_NgModuleRef {
    /**
     * @param {?} ngModuleType
     * @param {?} parentInjector
     */
    constructor(ngModuleType, parentInjector) {
        super();
        // tslint:disable-next-line:require-internal-with-underscore
        this._bootstrapComponents = [];
        this.destroyCbs = [];
        /** @type {?} */
        const ngModuleDef = (/** @type {?} */ ((ngModuleType))).ngModuleDef;
        ngDevMode && assertDefined(ngModuleDef, `NgModule '${stringify(ngModuleType)}' is not a subtype of 'NgModuleType'.`);
        this._bootstrapComponents = ngModuleDef.bootstrap;
        /** @type {?} */
        const additionalProviders = [
            COMPONENT_FACTORY_RESOLVER, {
                provide: viewEngine_NgModuleRef,
                useValue: this,
            }
        ];
        this.injector = createInjector(ngModuleType, parentInjector, additionalProviders);
        this.instance = this.injector.get(ngModuleType);
        this.componentFactoryResolver = new ComponentFactoryResolver();
    }
    /**
     * @return {?}
     */
    destroy() {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed'); /** @type {?} */
        ((this.destroyCbs)).forEach(fn => fn());
        this.destroyCbs = null;
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed'); /** @type {?} */
        ((this.destroyCbs)).push(callback);
    }
}
if (false) {
    /** @type {?} */
    NgModuleRef.prototype._bootstrapComponents;
    /** @type {?} */
    NgModuleRef.prototype.injector;
    /** @type {?} */
    NgModuleRef.prototype.componentFactoryResolver;
    /** @type {?} */
    NgModuleRef.prototype.instance;
    /** @type {?} */
    NgModuleRef.prototype.destroyCbs;
}
/**
 * @template T
 */
export class NgModuleFactory extends viewEngine_NgModuleFactory {
    /**
     * @param {?} moduleType
     */
    constructor(moduleType) {
        super();
        this.moduleType = moduleType;
    }
    /**
     * @param {?} parentInjector
     * @return {?}
     */
    create(parentInjector) {
        return new NgModuleRef(this.moduleType, parentInjector);
    }
}
if (false) {
    /** @type {?} */
    NgModuleFactory.prototype.moduleType;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbmdfbW9kdWxlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsd0JBQXdCLElBQUksbUNBQW1DLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUNySCxPQUFPLEVBQXNCLGVBQWUsSUFBSSwwQkFBMEIsRUFBRSxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUV0SixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBTXpELGFBQWEsMEJBQTBCLEdBQW1CO0lBQ3hELE9BQU8sRUFBRSxtQ0FBbUM7SUFDNUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksd0JBQXdCLEVBQUU7SUFDaEQsSUFBSSxFQUFFLEVBQUU7Q0FDVCxDQUFDOzs7O0FBRUYsTUFBTSxrQkFBc0IsU0FBUSxzQkFBeUI7Ozs7O0lBUTNELFlBQVksWUFBcUIsRUFBRSxjQUE2QjtRQUM5RCxLQUFLLEVBQUUsQ0FBQzs7b0NBUDBCLEVBQUU7MEJBSUosRUFBRTs7UUFJbEMsTUFBTSxXQUFXLEdBQUcsb0JBQUMsWUFBbUIsR0FBaUIsQ0FBQyxXQUFXLENBQUM7UUFDdEUsU0FBUyxJQUFJLGFBQWEsQ0FDVCxXQUFXLEVBQ1gsYUFBYSxTQUFTLENBQUMsWUFBWSxDQUFDLHVDQUF1QyxDQUFDLENBQUM7UUFFOUYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUM7O1FBQ2xELE1BQU0sbUJBQW1CLEdBQXFCO1lBQzVDLDBCQUEwQixFQUFFO2dCQUMxQixPQUFPLEVBQUUsc0JBQXNCO2dCQUMvQixRQUFRLEVBQUUsSUFBSTthQUNmO1NBQ0YsQ0FBQztRQUNGLElBQUksQ0FBQyxRQUFRLEdBQUcsY0FBYyxDQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLHdCQUF3QixFQUFFLENBQUM7S0FDaEU7Ozs7SUFFRCxPQUFPO1FBQ0wsU0FBUyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7VUFDMUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7S0FDeEI7Ozs7O0lBQ0QsU0FBUyxDQUFDLFFBQW9CO1FBQzVCLFNBQVMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1VBQzFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVE7S0FDaEM7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7OztBQUVELE1BQU0sc0JBQTBCLFNBQVEsMEJBQTZCOzs7O0lBQ25FLFlBQW1CLFVBQW1CO1FBQUksS0FBSyxFQUFFLENBQUM7UUFBL0IsZUFBVSxHQUFWLFVBQVUsQ0FBUztLQUFjOzs7OztJQUVwRCxNQUFNLENBQUMsY0FBNkI7UUFDbEMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQ3pEO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7U3RhdGljUHJvdmlkZXJ9IGZyb20gJy4uL2RpL3Byb3ZpZGVyJztcbmltcG9ydCB7Y3JlYXRlSW5qZWN0b3J9IGZyb20gJy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtJbnRlcm5hbE5nTW9kdWxlUmVmLCBOZ01vZHVsZUZhY3RvcnkgYXMgdmlld0VuZ2luZV9OZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9jb21wb25lbnRfcmVmJztcblxuZXhwb3J0IGludGVyZmFjZSBOZ01vZHVsZVR5cGUgeyBuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY7IH1cblxuZXhwb3J0IGludGVyZmFjZSBOZ01vZHVsZURlZiB7IGJvb3RzdHJhcDogVHlwZTxhbnk+W107IH1cblxuZXhwb3J0IGNvbnN0IENPTVBPTkVOVF9GQUNUT1JZX1JFU09MVkVSOiBTdGF0aWNQcm92aWRlciA9IHtcbiAgcHJvdmlkZTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKSxcbiAgZGVwczogW10sXG59O1xuXG5leHBvcnQgY2xhc3MgTmdNb2R1bGVSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxOZ01vZHVsZVJlZjxUPiB7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpyZXF1aXJlLWludGVybmFsLXdpdGgtdW5kZXJzY29yZVxuICBfYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10gPSBbXTtcbiAgaW5qZWN0b3I6IEluamVjdG9yO1xuICBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xuICBpbnN0YW5jZTogVDtcbiAgZGVzdHJveUNiczogKCgpID0+IHZvaWQpW118bnVsbCA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKG5nTW9kdWxlVHlwZTogVHlwZTxUPiwgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yfG51bGwpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG5nTW9kdWxlRGVmID0gKG5nTW9kdWxlVHlwZSBhcyBhbnkgYXMgTmdNb2R1bGVUeXBlKS5uZ01vZHVsZURlZjtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICAgIG5nTW9kdWxlRGVmLFxuICAgICAgICAgICAgICAgICAgICAgYE5nTW9kdWxlICcke3N0cmluZ2lmeShuZ01vZHVsZVR5cGUpfScgaXMgbm90IGEgc3VidHlwZSBvZiAnTmdNb2R1bGVUeXBlJy5gKTtcblxuICAgIHRoaXMuX2Jvb3RzdHJhcENvbXBvbmVudHMgPSBuZ01vZHVsZURlZi5ib290c3RyYXA7XG4gICAgY29uc3QgYWRkaXRpb25hbFByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtcbiAgICAgIENPTVBPTkVOVF9GQUNUT1JZX1JFU09MVkVSLCB7XG4gICAgICAgIHByb3ZpZGU6IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsXG4gICAgICAgIHVzZVZhbHVlOiB0aGlzLFxuICAgICAgfVxuICAgIF07XG4gICAgdGhpcy5pbmplY3RvciA9IGNyZWF0ZUluamVjdG9yKG5nTW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IsIGFkZGl0aW9uYWxQcm92aWRlcnMpO1xuICAgIHRoaXMuaW5zdGFuY2UgPSB0aGlzLmluamVjdG9yLmdldChuZ01vZHVsZVR5cGUpO1xuICAgIHRoaXMuY29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgdGhpcy5kZXN0cm95Q2JzID0gbnVsbDtcbiAgfVxuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLnB1c2goY2FsbGJhY2spO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOZ01vZHVsZUZhY3Rvcnk8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX05nTW9kdWxlRmFjdG9yeTxUPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBtb2R1bGVUeXBlOiBUeXBlPFQ+KSB7IHN1cGVyKCk7IH1cblxuICBjcmVhdGUocGFyZW50SW5qZWN0b3I6IEluamVjdG9yfG51bGwpOiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPFQ+IHtcbiAgICByZXR1cm4gbmV3IE5nTW9kdWxlUmVmKHRoaXMubW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IpO1xuICB9XG59XG4iXX0=