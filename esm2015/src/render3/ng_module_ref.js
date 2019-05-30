/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { INJECTOR } from '../di/injector_compatibility';
import { InjectFlags } from '../di/interface/injector';
import { createInjector } from '../di/r3_injector';
import { ComponentFactoryResolver as viewEngine_ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { NgModuleFactory as viewEngine_NgModuleFactory, NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { registerNgModuleType } from '../linker/ng_module_factory_registration';
import { assertDefined } from '../util/assert';
import { stringify } from '../util/stringify';
import { ComponentFactoryResolver } from './component_ref';
import { getNgLocaleIdDef, getNgModuleDef } from './definition';
import { setLocaleId } from './i18n';
import { maybeUnwrapFn } from './util/misc_utils';
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
        /** @type {?} */
        const ngLocaleIdDef = getNgLocaleIdDef(ngModuleType);
        if (ngLocaleIdDef) {
            setLocaleId(ngLocaleIdDef);
        }
        this._bootstrapComponents = maybeUnwrapFn((/** @type {?} */ (ngModuleDef)).bootstrap);
        /** @type {?} */
        const additionalProviders = [
            {
                provide: viewEngine_NgModuleRef,
                useValue: this,
            },
            COMPONENT_FACTORY_RESOLVER
        ];
        this._r3Injector = (/** @type {?} */ (createInjector(ngModuleType, _parent, additionalProviders, stringify(ngModuleType))));
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
        (/** @type {?} */ (this.destroyCbs)).forEach((/**
         * @param {?} fn
         * @return {?}
         */
        fn => fn()));
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
        /** @type {?} */
        const moduleType = this.moduleType;
        /** @type {?} */
        const moduleRef = new NgModuleRef(moduleType, parentInjector);
        /** @type {?} */
        /** @nocollapse */ const ngModuleDef = getNgModuleDef(moduleType);
        ngModuleDef && ngModuleDef.id &&
            registerNgModuleType(ngModuleDef.id, (/** @type {?} */ (moduleType)));
        return moduleRef;
    }
}
if (false) {
    /** @type {?} */
    NgModuleFactory.prototype.moduleType;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbmdfbW9kdWxlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDdEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRXJELE9BQU8sRUFBYSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU3RCxPQUFPLEVBQUMsd0JBQXdCLElBQUksbUNBQW1DLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUNySCxPQUFPLEVBQXNCLGVBQWUsSUFBSSwwQkFBMEIsRUFBRSxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUN0SixPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwwQ0FBMEMsQ0FBQztBQUU5RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDOUQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNuQyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7O0FBRWhELGtDQUF1Rjs7O0lBQTlCLG1DQUE0Qjs7O01BRS9FLDBCQUEwQixHQUFtQjtJQUNqRCxPQUFPLEVBQUUsbUNBQW1DO0lBQzVDLFFBQVEsRUFBRSx3QkFBd0I7SUFDbEMsSUFBSSxFQUFF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LE1BQU0sQ0FBQyxjQUE2Qjs7Y0FDNUIsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVOztjQUM1QixTQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQzs7Y0FDdkQsV0FBVyxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUM7UUFDOUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxFQUFFO1lBQ3pCLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsbUJBQUEsVUFBVSxFQUFnQixDQUFDLENBQUM7UUFDckUsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUNGOzs7SUFWYSxxQ0FBMEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SU5KRUNUT1J9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7U3RhdGljUHJvdmlkZXJ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge1IzSW5qZWN0b3IsIGNyZWF0ZUluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtJbnRlcm5hbE5nTW9kdWxlUmVmLCBOZ01vZHVsZUZhY3RvcnkgYXMgdmlld0VuZ2luZV9OZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge3JlZ2lzdGVyTmdNb2R1bGVUeXBlfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnlfcmVnaXN0cmF0aW9uJztcbmltcG9ydCB7TmdNb2R1bGVEZWZ9IGZyb20gJy4uL21ldGFkYXRhL25nX21vZHVsZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXROZ0xvY2FsZUlkRGVmLCBnZXROZ01vZHVsZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7c2V0TG9jYWxlSWR9IGZyb20gJy4vaTE4bic7XG5pbXBvcnQge21heWJlVW53cmFwRm59IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcblxuZXhwb3J0IGludGVyZmFjZSBOZ01vZHVsZVR5cGU8VCA9IGFueT4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdNb2R1bGVEZWY6IE5nTW9kdWxlRGVmPFQ+OyB9XG5cbmNvbnN0IENPTVBPTkVOVF9GQUNUT1JZX1JFU09MVkVSOiBTdGF0aWNQcm92aWRlciA9IHtcbiAgcHJvdmlkZTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIHVzZUNsYXNzOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gIGRlcHM6IFt2aWV3RW5naW5lX05nTW9kdWxlUmVmXSxcbn07XG5cbmV4cG9ydCBjbGFzcyBOZ01vZHVsZVJlZjxUPiBleHRlbmRzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8VD4gaW1wbGVtZW50cyBJbnRlcm5hbE5nTW9kdWxlUmVmPFQ+IHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gIF9ib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cmVxdWlyZS1pbnRlcm5hbC13aXRoLXVuZGVyc2NvcmVcbiAgX3IzSW5qZWN0b3I6IFIzSW5qZWN0b3I7XG4gIGluamVjdG9yOiBJbmplY3RvciA9IHRoaXM7XG4gIGluc3RhbmNlOiBUO1xuICBkZXN0cm95Q2JzOiAoKCkgPT4gdm9pZClbXXxudWxsID0gW107XG5cbiAgY29uc3RydWN0b3IobmdNb2R1bGVUeXBlOiBUeXBlPFQ+LCBwdWJsaWMgX3BhcmVudDogSW5qZWN0b3J8bnVsbCkge1xuICAgIHN1cGVyKCk7XG4gICAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihuZ01vZHVsZVR5cGUpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgbmdNb2R1bGVEZWYsXG4gICAgICAgICAgICAgICAgICAgICBgTmdNb2R1bGUgJyR7c3RyaW5naWZ5KG5nTW9kdWxlVHlwZSl9JyBpcyBub3QgYSBzdWJ0eXBlIG9mICdOZ01vZHVsZVR5cGUnLmApO1xuXG4gICAgY29uc3QgbmdMb2NhbGVJZERlZiA9IGdldE5nTG9jYWxlSWREZWYobmdNb2R1bGVUeXBlKTtcbiAgICBpZiAobmdMb2NhbGVJZERlZikge1xuICAgICAgc2V0TG9jYWxlSWQobmdMb2NhbGVJZERlZik7XG4gICAgfVxuXG4gICAgdGhpcy5fYm9vdHN0cmFwQ29tcG9uZW50cyA9IG1heWJlVW53cmFwRm4obmdNb2R1bGVEZWYgIS5ib290c3RyYXApO1xuICAgIGNvbnN0IGFkZGl0aW9uYWxQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXG4gICAgICB7XG4gICAgICAgIHByb3ZpZGU6IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsXG4gICAgICAgIHVzZVZhbHVlOiB0aGlzLFxuICAgICAgfSxcbiAgICAgIENPTVBPTkVOVF9GQUNUT1JZX1JFU09MVkVSXG4gICAgXTtcbiAgICB0aGlzLl9yM0luamVjdG9yID0gY3JlYXRlSW5qZWN0b3IoXG4gICAgICAgIG5nTW9kdWxlVHlwZSwgX3BhcmVudCwgYWRkaXRpb25hbFByb3ZpZGVycywgc3RyaW5naWZ5KG5nTW9kdWxlVHlwZSkpIGFzIFIzSW5qZWN0b3I7XG4gICAgdGhpcy5pbnN0YW5jZSA9IHRoaXMuZ2V0KG5nTW9kdWxlVHlwZSk7XG4gIH1cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgaW5qZWN0RmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgaWYgKHRva2VuID09PSBJbmplY3RvciB8fCB0b2tlbiA9PT0gdmlld0VuZ2luZV9OZ01vZHVsZVJlZiB8fCB0b2tlbiA9PT0gSU5KRUNUT1IpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcjNJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGluamVjdEZsYWdzKTtcbiAgfVxuXG4gIGdldCBjb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICAgIHJldHVybiB0aGlzLmdldCh2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcik7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgY29uc3QgaW5qZWN0b3IgPSB0aGlzLl9yM0luamVjdG9yO1xuICAgICFpbmplY3Rvci5kZXN0cm95ZWQgJiYgaW5qZWN0b3IuZGVzdHJveSgpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgdGhpcy5kZXN0cm95Q2JzID0gbnVsbDtcbiAgfVxuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIHRoaXMuZGVzdHJveUNicyAhLnB1c2goY2FsbGJhY2spO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOZ01vZHVsZUZhY3Rvcnk8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX05nTW9kdWxlRmFjdG9yeTxUPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBtb2R1bGVUeXBlOiBUeXBlPFQ+KSB7IHN1cGVyKCk7IH1cblxuICBjcmVhdGUocGFyZW50SW5qZWN0b3I6IEluamVjdG9yfG51bGwpOiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPFQ+IHtcbiAgICBjb25zdCBtb2R1bGVUeXBlID0gdGhpcy5tb2R1bGVUeXBlO1xuICAgIGNvbnN0IG1vZHVsZVJlZiA9IG5ldyBOZ01vZHVsZVJlZihtb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG4gICAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlKTtcbiAgICBuZ01vZHVsZURlZiAmJiBuZ01vZHVsZURlZi5pZCAmJlxuICAgICAgICByZWdpc3Rlck5nTW9kdWxlVHlwZShuZ01vZHVsZURlZi5pZCwgbW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgIHJldHVybiBtb2R1bGVSZWY7XG4gIH1cbn1cbiJdfQ==