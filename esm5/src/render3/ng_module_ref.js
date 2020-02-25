/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __extends } from "tslib";
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
var NgModuleRef = /** @class */ (function (_super) {
    __extends(NgModuleRef, _super);
    function NgModuleRef(ngModuleType, _parent) {
        var _this = _super.call(this) || this;
        _this._parent = _parent;
        // tslint:disable-next-line:require-internal-with-underscore
        _this._bootstrapComponents = [];
        _this.injector = _this;
        _this.destroyCbs = [];
        // When bootstrapping a module we have a dependency graph that looks like this:
        // ApplicationRef -> ComponentFactoryResolver -> NgModuleRef. The problem is that if the
        // module being resolved tries to inject the ComponentFactoryResolver, it'll create a
        // circular dependency which will result in a runtime error, because the injector doesn't
        // exist yet. We work around the issue by creating the ComponentFactoryResolver ourselves
        // and providing it, rather than letting the injector resolve it.
        _this.componentFactoryResolver = new ComponentFactoryResolver(_this);
        var ngModuleDef = getNgModuleDef(ngModuleType);
        ngDevMode && assertDefined(ngModuleDef, "NgModule '" + stringify(ngModuleType) + "' is not a subtype of 'NgModuleType'.");
        var ngLocaleIdDef = getNgLocaleIdDef(ngModuleType);
        ngLocaleIdDef && setLocaleId(ngLocaleIdDef);
        _this._bootstrapComponents = maybeUnwrapFn(ngModuleDef.bootstrap);
        _this._r3Injector = createInjector(ngModuleType, _parent, [
            { provide: viewEngine_NgModuleRef, useValue: _this },
            { provide: viewEngine_ComponentFactoryResolver, useValue: _this.componentFactoryResolver }
        ], stringify(ngModuleType));
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
    __extends(NgModuleFactory, _super);
    function NgModuleFactory(moduleType) {
        var _this = _super.call(this) || this;
        _this.moduleType = moduleType;
        var ngModuleDef = getNgModuleDef(moduleType);
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
            registerNgModuleType(moduleType);
        }
        return _this;
    }
    NgModuleFactory.prototype.create = function (parentInjector) {
        return new NgModuleRef(this.moduleType, parentInjector);
    };
    return NgModuleFactory;
}(viewEngine_NgModuleFactory));
export { NgModuleFactory };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbmdfbW9kdWxlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3hDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxFQUFhLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTdELE9BQU8sRUFBQyx3QkFBd0IsSUFBSSxtQ0FBbUMsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ3JILE9BQU8sRUFBc0IsZUFBZSxJQUFJLDBCQUEwQixFQUFFLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3RKLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLDBDQUEwQyxDQUFDO0FBRTlFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM5RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUloRDtJQUFvQywrQkFBeUI7SUFpQjNELHFCQUFZLFlBQXFCLEVBQVMsT0FBc0I7UUFBaEUsWUFDRSxpQkFBTyxTQWlCUjtRQWxCeUMsYUFBTyxHQUFQLE9BQU8sQ0FBZTtR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RjtZQUM5RixtRkFBbUY7WUFDbkYsRUFBRTtZQUNGLDJGQUEyRjtZQUMzRixrQ0FBa0M7WUFDbEMsRUFBRTtZQUNGLDJGQUEyRjtZQUMzRixrQkFBa0I7WUFDbEIsOEZBQThGO1lBQzlGLGtEQUFrRDtZQUNsRCw4RkFBOEY7WUFDOUYsYUFBYTtZQUNiLEVBQUU7WUFDRiw4RkFBOEY7WUFDOUYsNEZBQTRGO1lBQzVGLDhGQUE4RjtZQUM5Rix3RkFBd0Y7WUFDeEYsbUZBQW1GO1lBQ25GLEVBQUU7WUFDRiw4RkFBOEY7WUFDOUYsMkZBQTJGO1lBQzNGLDhFQUE4RTtZQUM5RSxvQkFBb0IsQ0FBQyxVQUEwQixDQUFDLENBQUM7U0FDbEQ7O0lBQ0gsQ0FBQztJQUVELGdDQUFNLEdBQU4sVUFBTyxjQUE2QjtRQUNsQyxPQUFPLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUNILHNCQUFDO0FBQUQsQ0FBQyxBQXBDRCxDQUF3QywwQkFBMEIsR0FvQ2pFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0lOSkVDVE9SfSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge1IzSW5qZWN0b3IsIGNyZWF0ZUluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtJbnRlcm5hbE5nTW9kdWxlUmVmLCBOZ01vZHVsZUZhY3RvcnkgYXMgdmlld0VuZ2luZV9OZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge3JlZ2lzdGVyTmdNb2R1bGVUeXBlfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnlfcmVnaXN0cmF0aW9uJztcbmltcG9ydCB7TmdNb2R1bGVEZWZ9IGZyb20gJy4uL21ldGFkYXRhL25nX21vZHVsZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXROZ0xvY2FsZUlkRGVmLCBnZXROZ01vZHVsZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7c2V0TG9jYWxlSWR9IGZyb20gJy4vaTE4bic7XG5pbXBvcnQge21heWJlVW53cmFwRm59IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcblxuZXhwb3J0IGludGVyZmFjZSBOZ01vZHVsZVR5cGU8VCA9IGFueT4gZXh0ZW5kcyBUeXBlPFQ+IHsgybVtb2Q6IE5nTW9kdWxlRGVmPFQ+OyB9XG5cbmV4cG9ydCBjbGFzcyBOZ01vZHVsZVJlZjxUPiBleHRlbmRzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8VD4gaW1wbGVtZW50cyBJbnRlcm5hbE5nTW9kdWxlUmVmPFQ+IHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gIF9ib290c3RyYXBDb21wb25lbnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cmVxdWlyZS1pbnRlcm5hbC13aXRoLXVuZGVyc2NvcmVcbiAgX3IzSW5qZWN0b3I6IFIzSW5qZWN0b3I7XG4gIGluamVjdG9yOiBJbmplY3RvciA9IHRoaXM7XG4gIGluc3RhbmNlOiBUO1xuICBkZXN0cm95Q2JzOiAoKCkgPT4gdm9pZClbXXxudWxsID0gW107XG5cbiAgLy8gV2hlbiBib290c3RyYXBwaW5nIGEgbW9kdWxlIHdlIGhhdmUgYSBkZXBlbmRlbmN5IGdyYXBoIHRoYXQgbG9va3MgbGlrZSB0aGlzOlxuICAvLyBBcHBsaWNhdGlvblJlZiAtPiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgLT4gTmdNb2R1bGVSZWYuIFRoZSBwcm9ibGVtIGlzIHRoYXQgaWYgdGhlXG4gIC8vIG1vZHVsZSBiZWluZyByZXNvbHZlZCB0cmllcyB0byBpbmplY3QgdGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgaXQnbGwgY3JlYXRlIGFcbiAgLy8gY2lyY3VsYXIgZGVwZW5kZW5jeSB3aGljaCB3aWxsIHJlc3VsdCBpbiBhIHJ1bnRpbWUgZXJyb3IsIGJlY2F1c2UgdGhlIGluamVjdG9yIGRvZXNuJ3RcbiAgLy8gZXhpc3QgeWV0LiBXZSB3b3JrIGFyb3VuZCB0aGUgaXNzdWUgYnkgY3JlYXRpbmcgdGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBvdXJzZWx2ZXNcbiAgLy8gYW5kIHByb3ZpZGluZyBpdCwgcmF0aGVyIHRoYW4gbGV0dGluZyB0aGUgaW5qZWN0b3IgcmVzb2x2ZSBpdC5cbiAgcmVhZG9ubHkgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBuZXcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKHRoaXMpO1xuXG4gIGNvbnN0cnVjdG9yKG5nTW9kdWxlVHlwZTogVHlwZTxUPiwgcHVibGljIF9wYXJlbnQ6IEluamVjdG9yfG51bGwpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnN0IG5nTW9kdWxlRGVmID0gZ2V0TmdNb2R1bGVEZWYobmdNb2R1bGVUeXBlKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICAgIG5nTW9kdWxlRGVmLFxuICAgICAgICAgICAgICAgICAgICAgYE5nTW9kdWxlICcke3N0cmluZ2lmeShuZ01vZHVsZVR5cGUpfScgaXMgbm90IGEgc3VidHlwZSBvZiAnTmdNb2R1bGVUeXBlJy5gKTtcblxuICAgIGNvbnN0IG5nTG9jYWxlSWREZWYgPSBnZXROZ0xvY2FsZUlkRGVmKG5nTW9kdWxlVHlwZSk7XG4gICAgbmdMb2NhbGVJZERlZiAmJiBzZXRMb2NhbGVJZChuZ0xvY2FsZUlkRGVmKTtcbiAgICB0aGlzLl9ib290c3RyYXBDb21wb25lbnRzID0gbWF5YmVVbndyYXBGbihuZ01vZHVsZURlZiAhLmJvb3RzdHJhcCk7XG4gICAgdGhpcy5fcjNJbmplY3RvciA9IGNyZWF0ZUluamVjdG9yKFxuICAgICAgICBuZ01vZHVsZVR5cGUsIF9wYXJlbnQsXG4gICAgICAgIFtcbiAgICAgICAgICB7cHJvdmlkZTogdmlld0VuZ2luZV9OZ01vZHVsZVJlZiwgdXNlVmFsdWU6IHRoaXN9LFxuICAgICAgICAgIHtwcm92aWRlOiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgdXNlVmFsdWU6IHRoaXMuY29tcG9uZW50RmFjdG9yeVJlc29sdmVyfVxuICAgICAgICBdLFxuICAgICAgICBzdHJpbmdpZnkobmdNb2R1bGVUeXBlKSkgYXMgUjNJbmplY3RvcjtcbiAgICB0aGlzLmluc3RhbmNlID0gdGhpcy5nZXQobmdNb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBpbmplY3RGbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBpZiAodG9rZW4gPT09IEluamVjdG9yIHx8IHRva2VuID09PSB2aWV3RW5naW5lX05nTW9kdWxlUmVmIHx8IHRva2VuID09PSBJTkpFQ1RPUikge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9yM0luamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgaW5qZWN0RmxhZ3MpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0aGlzLmRlc3Ryb3lDYnMsICdOZ01vZHVsZSBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuICAgIGNvbnN0IGluamVjdG9yID0gdGhpcy5fcjNJbmplY3RvcjtcbiAgICAhaW5qZWN0b3IuZGVzdHJveWVkICYmIGluamVjdG9yLmRlc3Ryb3koKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgIHRoaXMuZGVzdHJveUNicyA9IG51bGw7XG4gIH1cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGhpcy5kZXN0cm95Q2JzLCAnTmdNb2R1bGUgYWxyZWFkeSBkZXN0cm95ZWQnKTtcbiAgICB0aGlzLmRlc3Ryb3lDYnMgIS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTmdNb2R1bGVGYWN0b3J5PFQ+IGV4dGVuZHMgdmlld0VuZ2luZV9OZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbW9kdWxlVHlwZTogVHlwZTxUPikge1xuICAgIHN1cGVyKCk7XG5cbiAgICBjb25zdCBuZ01vZHVsZURlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUpO1xuICAgIGlmIChuZ01vZHVsZURlZiAhPT0gbnVsbCkge1xuICAgICAgLy8gUmVnaXN0ZXIgdGhlIE5nTW9kdWxlIHdpdGggQW5ndWxhcidzIG1vZHVsZSByZWdpc3RyeS4gVGhlIGxvY2F0aW9uIChhbmQgaGVuY2UgdGltaW5nKSBvZlxuICAgICAgLy8gdGhpcyBjYWxsIGlzIGNyaXRpY2FsIHRvIGVuc3VyZSB0aGlzIHdvcmtzIGNvcnJlY3RseSAobW9kdWxlcyBnZXQgcmVnaXN0ZXJlZCB3aGVuIGV4cGVjdGVkKVxuICAgICAgLy8gd2l0aG91dCBibG9hdGluZyBidW5kbGVzIChtb2R1bGVzIGFyZSByZWdpc3RlcmVkIHdoZW4gb3RoZXJ3aXNlIG5vdCByZWZlcmVuY2VkKS5cbiAgICAgIC8vXG4gICAgICAvLyBJbiBWaWV3IEVuZ2luZSwgcmVnaXN0cmF0aW9uIG9jY3VycyBpbiB0aGUgLm5nZmFjdG9yeS5qcyBmaWxlIGFzIGEgc2lkZSBlZmZlY3QuIFRoaXMgaGFzXG4gICAgICAvLyBzZXZlcmFsIHByYWN0aWNhbCBjb25zZXF1ZW5jZXM6XG4gICAgICAvL1xuICAgICAgLy8gLSBJZiBhbiAubmdmYWN0b3J5IGZpbGUgaXMgbm90IGltcG9ydGVkIGZyb20sIHRoZSBtb2R1bGUgd29uJ3QgYmUgcmVnaXN0ZXJlZCAoYW5kIGNhbiBiZVxuICAgICAgLy8gICB0cmVlIHNoYWtlbikuXG4gICAgICAvLyAtIElmIGFuIC5uZ2ZhY3RvcnkgZmlsZSBpcyBpbXBvcnRlZCBmcm9tLCB0aGUgbW9kdWxlIHdpbGwgYmUgcmVnaXN0ZXJlZCBldmVuIGlmIGFuIGluc3RhbmNlXG4gICAgICAvLyAgIGlzIG5vdCBhY3R1YWxseSBjcmVhdGVkICh2aWEgYGNyZWF0ZWAgYmVsb3cpLlxuICAgICAgLy8gLSBTaW5jZSBhbiAubmdmYWN0b3J5IGZpbGUgaW4gVmlldyBFbmdpbmUgcmVmZXJlbmNlcyB0aGUgLm5nZmFjdG9yeSBmaWxlcyBvZiB0aGUgTmdNb2R1bGUnc1xuICAgICAgLy8gICBpbXBvcnRzLFxuICAgICAgLy9cbiAgICAgIC8vIEluIEl2eSwgdGhpbmdzIGFyZSBhIGJpdCBkaWZmZXJlbnQuIC5uZ2ZhY3RvcnkgZmlsZXMgc3RpbGwgZXhpc3QgZm9yIGNvbXBhdGliaWxpdHksIGJ1dCBhcmVcbiAgICAgIC8vIG5vdCBhIHJlcXVpcmVkIEFQSSB0byB1c2UgLSB0aGVyZSBhcmUgb3RoZXIgd2F5cyB0byBvYnRhaW4gYW4gTmdNb2R1bGVGYWN0b3J5IGZvciBhIGdpdmVuXG4gICAgICAvLyBOZ01vZHVsZS4gVGh1cywgcmVseWluZyBvbiBhIHNpZGUgZWZmZWN0IGluIHRoZSAubmdmYWN0b3J5IGZpbGUgaXMgbm90IHN1ZmZpY2llbnQuIEluc3RlYWQsXG4gICAgICAvLyB0aGUgc2lkZSBlZmZlY3Qgb2YgcmVnaXN0cmF0aW9uIGlzIGFkZGVkIGhlcmUsIGluIHRoZSBjb25zdHJ1Y3RvciBvZiBOZ01vZHVsZUZhY3RvcnksXG4gICAgICAvLyBlbnN1cmluZyBubyBtYXR0ZXIgaG93IGEgZmFjdG9yeSBpcyBjcmVhdGVkLCB0aGUgbW9kdWxlIGlzIHJlZ2lzdGVyZWQgY29ycmVjdGx5LlxuICAgICAgLy9cbiAgICAgIC8vIEFuIGFsdGVybmF0aXZlIHdvdWxkIGJlIHRvIGluY2x1ZGUgdGhlIHJlZ2lzdHJhdGlvbiBzaWRlIGVmZmVjdCBpbmxpbmUgZm9sbG93aW5nIHRoZSBhY3R1YWxcbiAgICAgIC8vIE5nTW9kdWxlIGRlZmluaXRpb24uIFRoaXMgYWxzbyBoYXMgdGhlIGNvcnJlY3QgdGltaW5nLCBidXQgYnJlYWtzIHRyZWUtc2hha2luZyAtIG1vZHVsZXNcbiAgICAgIC8vIHdpbGwgYmUgcmVnaXN0ZXJlZCBhbmQgcmV0YWluZWQgZXZlbiBpZiB0aGV5J3JlIG90aGVyd2lzZSBuZXZlciByZWZlcmVuY2VkLlxuICAgICAgcmVnaXN0ZXJOZ01vZHVsZVR5cGUobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZShwYXJlbnRJbmplY3RvcjogSW5qZWN0b3J8bnVsbCk6IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8VD4ge1xuICAgIHJldHVybiBuZXcgTmdNb2R1bGVSZWYodGhpcy5tb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG4gIH1cbn1cbiJdfQ==