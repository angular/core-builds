/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { INJECTOR, Injector } from '../di/injector';
import { InjectFlags } from '../di/interface/injector';
import { createInjector } from '../di/r3_injector';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { NgModuleFactory as viewEngine_NgModuleFactory, NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { assertDefined } from '../util/assert';
import { stringify } from '../util/stringify';
import { ComponentFactoryResolver } from './component_ref';
import { getNgModuleDef } from './definition';
/**
 * @record
 * @template T
 */
export function NgModuleType() { }
if (false) {
    /** @type {?} */
    NgModuleType.prototype.ngModuleDef;
}
/** @type {?} */
const COMPONENT_FACTORY_RESOLVER = {
    provide: viewEngine_ComponentFactoryResolver,
    useClass: ComponentFactoryResolver,
    deps: [viewEngine_NgModuleRef],
};
/**
 * @template T
 */
export class NgModuleRef extends viewEngine_NgModuleRef {
    /**
     * @param {?} ngModuleType
     * @param {?} _parent
     */
    constructor(ngModuleType, _parent) {
        super();
        this._parent = _parent;
        // tslint:disable-next-line:require-internal-with-underscore
        this._bootstrapComponents = [];
        this.injector = this;
        this.destroyCbs = [];
        /** @type {?} */
        /** @nocollapse */ const ngModuleDef = getNgModuleDef(ngModuleType);
        ngDevMode && assertDefined(ngModuleDef, `NgModule '${stringify(ngModuleType)}' is not a subtype of 'NgModuleType'.`);
        this._bootstrapComponents = (/** @type {?} */ (ngModuleDef)).bootstrap;
        /** @type {?} */
        const additionalProviders = [
            {
                provide: viewEngine_NgModuleRef,
                useValue: this,
            },
            COMPONENT_FACTORY_RESOLVER
        ];
        this._r3Injector = (/** @type {?} */ (createInjector(ngModuleType, _parent, additionalProviders)));
        this.instance = this.get(ngModuleType);
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} injectFlags
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, injectFlags = InjectFlags.Default) {
        if (token === Injector || token === viewEngine_NgModuleRef || token === INJECTOR) {
            return this;
        }
        return this._r3Injector.get(token, notFoundValue, injectFlags);
    }
    /**
     * @return {?}
     */
    get componentFactoryResolver() {
        return this.get(viewEngine_ComponentFactoryResolver);
    }
    /**
     * @return {?}
     */
    destroy() {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
        /** @type {?} */
        const injector = this._r3Injector;
        !injector.destroyed && injector.destroy();
        (/** @type {?} */ (this.destroyCbs)).forEach(fn => fn());
        this.destroyCbs = null;
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) {
        ngDevMode && assertDefined(this.destroyCbs, 'NgModule already destroyed');
        (/** @type {?} */ (this.destroyCbs)).push(callback);
    }
}
if (false) {
    /** @type {?} */
    NgModuleRef.prototype._bootstrapComponents;
    /** @type {?} */
    NgModuleRef.prototype._r3Injector;
    /** @type {?} */
    NgModuleRef.prototype.injector;
    /** @type {?} */
    NgModuleRef.prototype.instance;
    /** @type {?} */
    NgModuleRef.prototype.destroyCbs;
    /** @type {?} */
    NgModuleRef.prototype._parent;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbmdfbW9kdWxlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRXJELE9BQU8sRUFBYSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU3RCxPQUFPLEVBQUMsd0JBQXdCLElBQUksbUNBQW1DLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUNySCxPQUFPLEVBQXNCLGVBQWUsSUFBSSwwQkFBMEIsRUFBRSxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUV0SixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxjQUFjLENBQUM7Ozs7O0FBRTVDLGtDQUF1Rjs7O0lBQTlCLG1DQUE0Qjs7O01BRS9FLDBCQUEwQixHQUFtQjtJQUNqRCxPQUFPLEVBQUUsbUNBQW1DO0lBQzVDLFFBQVEsRUFBRSx3QkFBd0I7SUFDbEMsSUFBSSxFQUFFLENBQUMsc0JBQXNCLENBQUM7Q0FDL0I7Ozs7QUFFRCxNQUFNLE9BQU8sV0FBZSxTQUFRLHNCQUF5Qjs7Ozs7SUFTM0QsWUFBWSxZQUFxQixFQUFTLE9BQXNCO1FBQzlELEtBQUssRUFBRSxDQUFDO1FBRGdDLFlBQU8sR0FBUCxPQUFPLENBQWU7O1FBUGhFLHlCQUFvQixHQUFnQixFQUFFLENBQUM7UUFHdkMsYUFBUSxHQUFhLElBQUksQ0FBQztRQUUxQixlQUFVLEdBQXdCLEVBQUUsQ0FBQzs7Y0FJN0IsV0FBVyxHQUFHLGNBQWMsQ0FBQyxZQUFZLENBQUM7UUFDaEQsU0FBUyxJQUFJLGFBQWEsQ0FDVCxXQUFXLEVBQ1gsYUFBYSxTQUFTLENBQUMsWUFBWSxDQUFDLHVDQUF1QyxDQUFDLENBQUM7UUFFOUYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFBLFdBQVcsRUFBRSxDQUFDLFNBQVMsQ0FBQzs7Y0FDOUMsbUJBQW1CLEdBQXFCO1lBQzVDO2dCQUNFLE9BQU8sRUFBRSxzQkFBc0I7Z0JBQy9CLFFBQVEsRUFBRSxJQUFJO2FBQ2Y7WUFDRCwwQkFBMEI7U0FDM0I7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLG1CQUFBLGNBQWMsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixDQUFDLEVBQWMsQ0FBQztRQUM1RixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDekMsQ0FBQzs7Ozs7OztJQUVELEdBQUcsQ0FBQyxLQUFVLEVBQUUsZ0JBQXFCLFFBQVEsQ0FBQyxrQkFBa0IsRUFDNUQsY0FBMkIsV0FBVyxDQUFDLE9BQU87UUFDaEQsSUFBSSxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxzQkFBc0IsSUFBSSxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQ2hGLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDakUsQ0FBQzs7OztJQUVELElBQUksd0JBQXdCO1FBQzFCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Ozs7SUFFRCxPQUFPO1FBQ0wsU0FBUyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLDRCQUE0QixDQUFDLENBQUM7O2NBQ3BFLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVztRQUNqQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFDLG1CQUFBLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLENBQUM7Ozs7O0lBQ0QsU0FBUyxDQUFDLFFBQW9CO1FBQzVCLFNBQVMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1FBQzFFLG1CQUFBLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGOzs7SUFqREMsMkNBQXVDOztJQUV2QyxrQ0FBd0I7O0lBQ3hCLCtCQUEwQjs7SUFDMUIsK0JBQVk7O0lBQ1osaUNBQXFDOztJQUVGLDhCQUE2Qjs7Ozs7QUE0Q2xFLE1BQU0sT0FBTyxlQUFtQixTQUFRLDBCQUE2Qjs7OztJQUNuRSxZQUFtQixVQUFtQjtRQUFJLEtBQUssRUFBRSxDQUFDO1FBQS9CLGVBQVUsR0FBVixVQUFVLENBQVM7SUFBYSxDQUFDOzs7OztJQUVwRCxNQUFNLENBQUMsY0FBNkI7UUFDbEMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzFELENBQUM7Q0FDRjs7O0lBTGEscUNBQTBCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0lOSkVDVE9SLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7U3RhdGljUHJvdmlkZXJ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge1IzSW5qZWN0b3IsIGNyZWF0ZUluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtJbnRlcm5hbE5nTW9kdWxlUmVmLCBOZ01vZHVsZUZhY3RvcnkgYXMgdmlld0VuZ2luZV9OZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlRGVmfSBmcm9tICcuLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7Z2V0TmdNb2R1bGVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmdNb2R1bGVUeXBlPFQgPSBhbnk+IGV4dGVuZHMgVHlwZTxUPiB7IG5nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxUPjsgfVxuXG5jb25zdCBDT01QT05FTlRfRkFDVE9SWV9SRVNPTFZFUjogU3RhdGljUHJvdmlkZXIgPSB7XG4gIHByb3ZpZGU6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICB1c2VDbGFzczogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICBkZXBzOiBbdmlld0VuZ2luZV9OZ01vZHVsZVJlZl0sXG59O1xuXG5leHBvcnQgY2xhc3MgTmdNb2R1bGVSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxOZ01vZHVsZVJlZjxUPiB7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpyZXF1aXJlLWludGVybmFsLXdpdGgtdW5kZXJzY29yZVxuICBfYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10gPSBbXTtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gIF9yM0luamVjdG9yOiBSM0luamVjdG9yO1xuICBpbmplY3RvcjogSW5qZWN0b3IgPSB0aGlzO1xuICBpbnN0YW5jZTogVDtcbiAgZGVzdHJveUNiczogKCgpID0+IHZvaWQpW118bnVsbCA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKG5nTW9kdWxlVHlwZTogVHlwZTxUPiwgcHVibGljIF9wYXJlbnQ6IEluamVjdG9yfG51bGwpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYobmdNb2R1bGVUeXBlKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICAgIG5nTW9kdWxlRGVmLFxuICAgICAgICAgICAgICAgICAgICAgYE5nTW9kdWxlICcke3N0cmluZ2lmeShuZ01vZHVsZVR5cGUpfScgaXMgbm90IGEgc3VidHlwZSBvZiAnTmdNb2R1bGVUeXBlJy5gKTtcblxuICAgIHRoaXMuX2Jvb3RzdHJhcENvbXBvbmVudHMgPSBuZ01vZHVsZURlZiAhLmJvb3RzdHJhcDtcbiAgICBjb25zdCBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICAgICAge1xuICAgICAgICBwcm92aWRlOiB2aWV3RW5naW5lX05nTW9kdWxlUmVmLFxuICAgICAgICB1c2VWYWx1ZTogdGhpcyxcbiAgICAgIH0sXG4gICAgICBDT01QT05FTlRfRkFDVE9SWV9SRVNPTFZFUlxuICAgIF07XG4gICAgdGhpcy5fcjNJbmplY3RvciA9IGNyZWF0ZUluamVjdG9yKG5nTW9kdWxlVHlwZSwgX3BhcmVudCwgYWRkaXRpb25hbFByb3ZpZGVycykgYXMgUjNJbmplY3RvcjtcbiAgICB0aGlzLmluc3RhbmNlID0gdGhpcy5nZXQobmdNb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBpbmplY3RGbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBpZiAodG9rZW4gPT09IEluamVjdG9yIHx8IHRva2VuID09PSB2aWV3RW5naW5lX05nTW9kdWxlUmVmIHx8IHRva2VuID09PSBJTkpFQ1RPUikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9yM0luamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgaW5qZWN0RmxhZ3MpO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuX3IzSW5qZWN0b3I7XG4gICAgIWluamVjdG9yLmRlc3Ryb3llZCAmJiBpbmplY3Rvci5kZXN0cm95KCk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgPSBudWxsO1xuICB9XG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEucHVzaChjYWxsYmFjayk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5nTW9kdWxlRmFjdG9yeTxUPiBleHRlbmRzIHZpZXdFbmdpbmVfTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgY29uc3RydWN0b3IocHVibGljIG1vZHVsZVR5cGU6IFR5cGU8VD4pIHsgc3VwZXIoKTsgfVxuXG4gIGNyZWF0ZShwYXJlbnRJbmplY3RvcjogSW5qZWN0b3J8bnVsbCk6IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8VD4ge1xuICAgIHJldHVybiBuZXcgTmdNb2R1bGVSZWYodGhpcy5tb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG4gIH1cbn1cbiJdfQ==