/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/ng_module_ref.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
    NgModuleType.prototype.ɵmod;
}
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
        // When bootstrapping a module we have a dependency graph that looks like this:
        // ApplicationRef -> ComponentFactoryResolver -> NgModuleRef. The problem is that if the
        // module being resolved tries to inject the ComponentFactoryResolver, it'll create a
        // circular dependency which will result in a runtime error, because the injector doesn't
        // exist yet. We work around the issue by creating the ComponentFactoryResolver ourselves
        // and providing it, rather than letting the injector resolve it.
        this.componentFactoryResolver = new ComponentFactoryResolver(this);
        /** @type {?} */
        const ngModuleDef = getNgModuleDef(ngModuleType);
        ngDevMode && assertDefined(ngModuleDef, `NgModule '${stringify(ngModuleType)}' is not a subtype of 'NgModuleType'.`);
        /** @type {?} */
        const ngLocaleIdDef = getNgLocaleIdDef(ngModuleType);
        ngLocaleIdDef && setLocaleId(ngLocaleIdDef);
        this._bootstrapComponents = maybeUnwrapFn((/** @type {?} */ (ngModuleDef)).bootstrap);
        this._r3Injector = (/** @type {?} */ (createInjector(ngModuleType, _parent, [
            { provide: viewEngine_NgModuleRef, useValue: this },
            { provide: viewEngine_ComponentFactoryResolver, useValue: this.componentFactoryResolver }
        ], stringify(ngModuleType))));
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
    NgModuleRef.prototype.componentFactoryResolver;
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
        /** @type {?} */
        const ngModuleDef = getNgModuleDef(moduleType);
        if (ngModuleDef !== null) {
            // Register the NgModule with Angular's module registry. The location (and hence timing) of
            // this call is critical to ensure this works correctly (modules get registered when expected)
            // without bloating bundles (modules are registered when otherwise not referenced).
            //
            // In View Engine, registration occurs in the .ngfactory.js file as a side effect. This has
            // several practical consequences:
            //
            // - If an .ngfactory file is not imported from, the module won't be registered (and can be
            //   tree shaken).
            // - If an .ngfactory file is imported from, the module will be registered even if an instance
            //   is not actually created (via `create` below).
            // - Since an .ngfactory file in View Engine references the .ngfactory files of the NgModule's
            //   imports,
            //
            // In Ivy, things are a bit different. .ngfactory files still exist for compatibility, but are
            // not a required API to use - there are other ways to obtain an NgModuleFactory for a given
            // NgModule. Thus, relying on a side effect in the .ngfactory file is not sufficient. Instead,
            // the side effect of registration is added here, in the constructor of NgModuleFactory,
            // ensuring no matter how a factory is created, the module is registered correctly.
            //
            // An alternative would be to include the registration side effect inline following the actual
            // NgModule definition. This also has the correct timing, but breaks tree-shaking - modules
            // will be registered and retained even if they're otherwise never referenced.
            registerNgModuleType((/** @type {?} */ (moduleType)));
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbmdfbW9kdWxlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLEVBQWEsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFN0QsT0FBTyxFQUFDLHdCQUF3QixJQUFJLG1DQUFtQyxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDckgsT0FBTyxFQUFzQixlQUFlLElBQUksMEJBQTBCLEVBQUUsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDdEosT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sMENBQTBDLENBQUM7QUFFOUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsY0FBYyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzlELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDbkMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7OztBQUVoRCxrQ0FBZ0Y7OztJQUF2Qiw0QkFBcUI7Ozs7O0FBRTlFLE1BQU0sT0FBTyxXQUFlLFNBQVEsc0JBQXlCOzs7OztJQWlCM0QsWUFBWSxZQUFxQixFQUFTLE9BQXNCO1FBQzlELEtBQUss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Q0YsMkZBQTJGO1lBQzNGLGtDQUFrQztZQUNsQyxFQUFFO1lBQ0YsMkZBQTJGO1lBQzNGLGtCQUFrQjtZQUNsQiw4RkFBOEY7WUFDOUYsa0RBQWtEO1lBQ2xELDhGQUE4RjtZQUM5RixhQUFhO1lBQ2IsRUFBRTtZQUNGLDhGQUE4RjtZQUM5Riw0RkFBNEY7WUFDNUYsOEZBQThGO1lBQzlGLHdGQUF3RjtZQUN4RixtRkFBbUY7WUFDbkYsRUFBRTtZQUNGLDhGQUE4RjtZQUM5RiwyRkFBMkY7WUFDM0YsOEVBQThFO1lBQzlFLG9CQUFvQixDQUFDLG1CQUFBLFVBQVUsRUFBZ0IsQ0FBQyxDQUFDO1NBQ2xEO0lBQ0gsQ0FBQzs7Ozs7SUFFRCxNQUFNLENBQUMsY0FBNkI7UUFDbEMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzFELENBQUM7Q0FDRjs7O0lBbkNhLHFDQUEwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtJTkpFQ1RPUn0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtSM0luamVjdG9yLCBjcmVhdGVJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7SW50ZXJuYWxOZ01vZHVsZVJlZiwgTmdNb2R1bGVGYWN0b3J5IGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtyZWdpc3Rlck5nTW9kdWxlVHlwZX0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X3JlZ2lzdHJhdGlvbic7XG5pbXBvcnQge05nTW9kdWxlRGVmfSBmcm9tICcuLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7Z2V0TmdMb2NhbGVJZERlZiwgZ2V0TmdNb2R1bGVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge3NldExvY2FsZUlkfSBmcm9tICcuL2kxOG4nO1xuaW1wb3J0IHttYXliZVVud3JhcEZufSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmdNb2R1bGVUeXBlPFQgPSBhbnk+IGV4dGVuZHMgVHlwZTxUPiB7IMm1bW9kOiBOZ01vZHVsZURlZjxUPjsgfVxuXG5leHBvcnQgY2xhc3MgTmdNb2R1bGVSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxOZ01vZHVsZVJlZjxUPiB7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpyZXF1aXJlLWludGVybmFsLXdpdGgtdW5kZXJzY29yZVxuICBfYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10gPSBbXTtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gIF9yM0luamVjdG9yOiBSM0luamVjdG9yO1xuICBpbmplY3RvcjogSW5qZWN0b3IgPSB0aGlzO1xuICBpbnN0YW5jZTogVDtcbiAgZGVzdHJveUNiczogKCgpID0+IHZvaWQpW118bnVsbCA9IFtdO1xuXG4gIC8vIFdoZW4gYm9vdHN0cmFwcGluZyBhIG1vZHVsZSB3ZSBoYXZlIGEgZGVwZW5kZW5jeSBncmFwaCB0aGF0IGxvb2tzIGxpa2UgdGhpczpcbiAgLy8gQXBwbGljYXRpb25SZWYgLT4gQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIC0+IE5nTW9kdWxlUmVmLiBUaGUgcHJvYmxlbSBpcyB0aGF0IGlmIHRoZVxuICAvLyBtb2R1bGUgYmVpbmcgcmVzb2x2ZWQgdHJpZXMgdG8gaW5qZWN0IHRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIGl0J2xsIGNyZWF0ZSBhXG4gIC8vIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2hpY2ggd2lsbCByZXN1bHQgaW4gYSBydW50aW1lIGVycm9yLCBiZWNhdXNlIHRoZSBpbmplY3RvciBkb2Vzbid0XG4gIC8vIGV4aXN0IHlldC4gV2Ugd29yayBhcm91bmQgdGhlIGlzc3VlIGJ5IGNyZWF0aW5nIHRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgb3Vyc2VsdmVzXG4gIC8vIGFuZCBwcm92aWRpbmcgaXQsIHJhdGhlciB0aGFuIGxldHRpbmcgdGhlIGluamVjdG9yIHJlc29sdmUgaXQuXG4gIHJlYWRvbmx5IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcih0aGlzKTtcblxuICBjb25zdHJ1Y3RvcihuZ01vZHVsZVR5cGU6IFR5cGU8VD4sIHB1YmxpYyBfcGFyZW50OiBJbmplY3RvcnxudWxsKSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKG5nTW9kdWxlVHlwZSk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBuZ01vZHVsZURlZixcbiAgICAgICAgICAgICAgICAgICAgIGBOZ01vZHVsZSAnJHtzdHJpbmdpZnkobmdNb2R1bGVUeXBlKX0nIGlzIG5vdCBhIHN1YnR5cGUgb2YgJ05nTW9kdWxlVHlwZScuYCk7XG5cbiAgICBjb25zdCBuZ0xvY2FsZUlkRGVmID0gZ2V0TmdMb2NhbGVJZERlZihuZ01vZHVsZVR5cGUpO1xuICAgIG5nTG9jYWxlSWREZWYgJiYgc2V0TG9jYWxlSWQobmdMb2NhbGVJZERlZik7XG4gICAgdGhpcy5fYm9vdHN0cmFwQ29tcG9uZW50cyA9IG1heWJlVW53cmFwRm4obmdNb2R1bGVEZWYgIS5ib290c3RyYXApO1xuICAgIHRoaXMuX3IzSW5qZWN0b3IgPSBjcmVhdGVJbmplY3RvcihcbiAgICAgICAgbmdNb2R1bGVUeXBlLCBfcGFyZW50LFxuICAgICAgICBbXG4gICAgICAgICAge3Byb3ZpZGU6IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIHVzZVZhbHVlOiB0aGlzfSxcbiAgICAgICAgICB7cHJvdmlkZTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIHVzZVZhbHVlOiB0aGlzLmNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn1cbiAgICAgICAgXSxcbiAgICAgICAgc3RyaW5naWZ5KG5nTW9kdWxlVHlwZSkpIGFzIFIzSW5qZWN0b3I7XG4gICAgdGhpcy5pbnN0YW5jZSA9IHRoaXMuZ2V0KG5nTW9kdWxlVHlwZSk7XG4gIH1cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgaW5qZWN0RmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgaWYgKHRva2VuID09PSBJbmplY3RvciB8fCB0b2tlbiA9PT0gdmlld0VuZ2luZV9OZ01vZHVsZVJlZiB8fCB0b2tlbiA9PT0gSU5KRUNUT1IpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcjNJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGluamVjdEZsYWdzKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuX3IzSW5qZWN0b3I7XG4gICAgIWluamVjdG9yLmRlc3Ryb3llZCAmJiBpbmplY3Rvci5kZXN0cm95KCk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgPSBudWxsO1xuICB9XG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRoaXMuZGVzdHJveUNicywgJ05nTW9kdWxlIGFscmVhZHkgZGVzdHJveWVkJyk7XG4gICAgdGhpcy5kZXN0cm95Q2JzICEucHVzaChjYWxsYmFjayk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5nTW9kdWxlRmFjdG9yeTxUPiBleHRlbmRzIHZpZXdFbmdpbmVfTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgY29uc3RydWN0b3IocHVibGljIG1vZHVsZVR5cGU6IFR5cGU8VD4pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlKTtcbiAgICBpZiAobmdNb2R1bGVEZWYgIT09IG51bGwpIHtcbiAgICAgIC8vIFJlZ2lzdGVyIHRoZSBOZ01vZHVsZSB3aXRoIEFuZ3VsYXIncyBtb2R1bGUgcmVnaXN0cnkuIFRoZSBsb2NhdGlvbiAoYW5kIGhlbmNlIHRpbWluZykgb2ZcbiAgICAgIC8vIHRoaXMgY2FsbCBpcyBjcml0aWNhbCB0byBlbnN1cmUgdGhpcyB3b3JrcyBjb3JyZWN0bHkgKG1vZHVsZXMgZ2V0IHJlZ2lzdGVyZWQgd2hlbiBleHBlY3RlZClcbiAgICAgIC8vIHdpdGhvdXQgYmxvYXRpbmcgYnVuZGxlcyAobW9kdWxlcyBhcmUgcmVnaXN0ZXJlZCB3aGVuIG90aGVyd2lzZSBub3QgcmVmZXJlbmNlZCkuXG4gICAgICAvL1xuICAgICAgLy8gSW4gVmlldyBFbmdpbmUsIHJlZ2lzdHJhdGlvbiBvY2N1cnMgaW4gdGhlIC5uZ2ZhY3RvcnkuanMgZmlsZSBhcyBhIHNpZGUgZWZmZWN0LiBUaGlzIGhhc1xuICAgICAgLy8gc2V2ZXJhbCBwcmFjdGljYWwgY29uc2VxdWVuY2VzOlxuICAgICAgLy9cbiAgICAgIC8vIC0gSWYgYW4gLm5nZmFjdG9yeSBmaWxlIGlzIG5vdCBpbXBvcnRlZCBmcm9tLCB0aGUgbW9kdWxlIHdvbid0IGJlIHJlZ2lzdGVyZWQgKGFuZCBjYW4gYmVcbiAgICAgIC8vICAgdHJlZSBzaGFrZW4pLlxuICAgICAgLy8gLSBJZiBhbiAubmdmYWN0b3J5IGZpbGUgaXMgaW1wb3J0ZWQgZnJvbSwgdGhlIG1vZHVsZSB3aWxsIGJlIHJlZ2lzdGVyZWQgZXZlbiBpZiBhbiBpbnN0YW5jZVxuICAgICAgLy8gICBpcyBub3QgYWN0dWFsbHkgY3JlYXRlZCAodmlhIGBjcmVhdGVgIGJlbG93KS5cbiAgICAgIC8vIC0gU2luY2UgYW4gLm5nZmFjdG9yeSBmaWxlIGluIFZpZXcgRW5naW5lIHJlZmVyZW5jZXMgdGhlIC5uZ2ZhY3RvcnkgZmlsZXMgb2YgdGhlIE5nTW9kdWxlJ3NcbiAgICAgIC8vICAgaW1wb3J0cyxcbiAgICAgIC8vXG4gICAgICAvLyBJbiBJdnksIHRoaW5ncyBhcmUgYSBiaXQgZGlmZmVyZW50LiAubmdmYWN0b3J5IGZpbGVzIHN0aWxsIGV4aXN0IGZvciBjb21wYXRpYmlsaXR5LCBidXQgYXJlXG4gICAgICAvLyBub3QgYSByZXF1aXJlZCBBUEkgdG8gdXNlIC0gdGhlcmUgYXJlIG90aGVyIHdheXMgdG8gb2J0YWluIGFuIE5nTW9kdWxlRmFjdG9yeSBmb3IgYSBnaXZlblxuICAgICAgLy8gTmdNb2R1bGUuIFRodXMsIHJlbHlpbmcgb24gYSBzaWRlIGVmZmVjdCBpbiB0aGUgLm5nZmFjdG9yeSBmaWxlIGlzIG5vdCBzdWZmaWNpZW50LiBJbnN0ZWFkLFxuICAgICAgLy8gdGhlIHNpZGUgZWZmZWN0IG9mIHJlZ2lzdHJhdGlvbiBpcyBhZGRlZCBoZXJlLCBpbiB0aGUgY29uc3RydWN0b3Igb2YgTmdNb2R1bGVGYWN0b3J5LFxuICAgICAgLy8gZW5zdXJpbmcgbm8gbWF0dGVyIGhvdyBhIGZhY3RvcnkgaXMgY3JlYXRlZCwgdGhlIG1vZHVsZSBpcyByZWdpc3RlcmVkIGNvcnJlY3RseS5cbiAgICAgIC8vXG4gICAgICAvLyBBbiBhbHRlcm5hdGl2ZSB3b3VsZCBiZSB0byBpbmNsdWRlIHRoZSByZWdpc3RyYXRpb24gc2lkZSBlZmZlY3QgaW5saW5lIGZvbGxvd2luZyB0aGUgYWN0dWFsXG4gICAgICAvLyBOZ01vZHVsZSBkZWZpbml0aW9uLiBUaGlzIGFsc28gaGFzIHRoZSBjb3JyZWN0IHRpbWluZywgYnV0IGJyZWFrcyB0cmVlLXNoYWtpbmcgLSBtb2R1bGVzXG4gICAgICAvLyB3aWxsIGJlIHJlZ2lzdGVyZWQgYW5kIHJldGFpbmVkIGV2ZW4gaWYgdGhleSdyZSBvdGhlcndpc2UgbmV2ZXIgcmVmZXJlbmNlZC5cbiAgICAgIHJlZ2lzdGVyTmdNb2R1bGVUeXBlKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlKTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGUocGFyZW50SW5qZWN0b3I6IEluamVjdG9yfG51bGwpOiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPFQ+IHtcbiAgICByZXR1cm4gbmV3IE5nTW9kdWxlUmVmKHRoaXMubW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IpO1xuICB9XG59XG4iXX0=