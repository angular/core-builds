/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { resolveForwardRef } from '../di/forward_ref';
import { INJECTOR, Injector, setCurrentInjector } from '../di/injector';
import { APP_ROOT } from '../di/scope';
import { NgModuleRef } from '../linker/ng_module_factory';
import { stringify } from '../util';
import { splitDepsDsl, tokenKey } from './util';
const /** @type {?} */ UNDEFINED_VALUE = new Object();
const /** @type {?} */ InjectorRefTokenKey = tokenKey(Injector);
const /** @type {?} */ INJECTORRefTokenKey = tokenKey(INJECTOR);
const /** @type {?} */ NgModuleRefTokenKey = tokenKey(NgModuleRef);
/**
 * @param {?} flags
 * @param {?} token
 * @param {?} value
 * @param {?} deps
 * @return {?}
 */
export function moduleProvideDef(flags, token, value, deps) {
    // Need to resolve forwardRefs as e.g. for `useValue` we
    // lowered the expression and then stopped evaluating it,
    // i.e. also didn't unwrap it.
    value = resolveForwardRef(value);
    const /** @type {?} */ depDefs = splitDepsDsl(deps, stringify(token));
    return {
        // will bet set by the module definition
        index: -1,
        deps: depDefs, flags, token, value
    };
}
/**
 * @param {?} providers
 * @return {?}
 */
export function moduleDef(providers) {
    const /** @type {?} */ providersByKey = {};
    const /** @type {?} */ modules = [];
    let /** @type {?} */ isRoot = false;
    for (let /** @type {?} */ i = 0; i < providers.length; i++) {
        const /** @type {?} */ provider = providers[i];
        if (provider.token === APP_ROOT) {
            isRoot = true;
        }
        if (provider.flags & 1073741824 /* TypeNgModule */) {
            modules.push(provider.token);
        }
        provider.index = i;
        providersByKey[tokenKey(provider.token)] = provider;
    }
    return {
        // Will be filled later...
        factory: null,
        providersByKey,
        providers,
        modules,
        isRoot,
    };
}
/**
 * @param {?} data
 * @return {?}
 */
export function initNgModule(data) {
    const /** @type {?} */ def = data._def;
    const /** @type {?} */ providers = data._providers = new Array(def.providers.length);
    for (let /** @type {?} */ i = 0; i < def.providers.length; i++) {
        const /** @type {?} */ provDef = def.providers[i];
        if (!(provDef.flags & 4096 /* LazyProvider */)) {
            // Make sure the provider has not been already initialized outside this loop.
            if (providers[i] === undefined) {
                providers[i] = _createProviderInstance(data, provDef);
            }
        }
    }
}
/**
 * @param {?} data
 * @param {?} depDef
 * @param {?=} notFoundValue
 * @return {?}
 */
export function resolveNgModuleDep(data, depDef, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
    const /** @type {?} */ former = setCurrentInjector(data);
    try {
        if (depDef.flags & 8 /* Value */) {
            return depDef.token;
        }
        if (depDef.flags & 2 /* Optional */) {
            notFoundValue = null;
        }
        if (depDef.flags & 1 /* SkipSelf */) {
            return data._parent.get(depDef.token, notFoundValue);
        }
        const /** @type {?} */ tokenKey = depDef.tokenKey;
        switch (tokenKey) {
            case InjectorRefTokenKey:
            case INJECTORRefTokenKey:
            case NgModuleRefTokenKey:
                return data;
        }
        const /** @type {?} */ providerDef = data._def.providersByKey[tokenKey];
        if (providerDef) {
            let /** @type {?} */ providerInstance = data._providers[providerDef.index];
            if (providerInstance === undefined) {
                providerInstance = data._providers[providerDef.index] =
                    _createProviderInstance(data, providerDef);
            }
            return providerInstance === UNDEFINED_VALUE ? undefined : providerInstance;
        }
        else if (depDef.token.ngInjectableDef && targetsModule(data, depDef.token.ngInjectableDef)) {
            const /** @type {?} */ injectableDef = /** @type {?} */ (depDef.token.ngInjectableDef);
            const /** @type {?} */ key = tokenKey;
            const /** @type {?} */ index = data._providers.length;
            data._def.providersByKey[depDef.tokenKey] = {
                flags: 1024 /* TypeFactoryProvider */ | 4096 /* LazyProvider */,
                value: injectableDef.factory,
                deps: [], index,
                token: depDef.token,
            };
            data._providers[index] = UNDEFINED_VALUE;
            return (data._providers[index] =
                _createProviderInstance(data, data._def.providersByKey[depDef.tokenKey]));
        }
        return data._parent.get(depDef.token, notFoundValue);
    }
    finally {
        setCurrentInjector(former);
    }
}
/**
 * @param {?} ngModule
 * @param {?} scope
 * @return {?}
 */
function moduleTransitivelyPresent(ngModule, scope) {
    return ngModule._def.modules.indexOf(scope) > -1;
}
/**
 * @param {?} ngModule
 * @param {?} def
 * @return {?}
 */
function targetsModule(ngModule, def) {
    return def.providedIn != null && (moduleTransitivelyPresent(ngModule, def.providedIn) ||
        def.providedIn === 'root' && ngModule._def.isRoot);
}
/**
 * @param {?} ngModule
 * @param {?} providerDef
 * @return {?}
 */
function _createProviderInstance(ngModule, providerDef) {
    let /** @type {?} */ injectable;
    switch (providerDef.flags & 201347067 /* Types */) {
        case 512 /* TypeClassProvider */:
            injectable = _createClass(ngModule, providerDef.value, providerDef.deps);
            break;
        case 1024 /* TypeFactoryProvider */:
            injectable = _callFactory(ngModule, providerDef.value, providerDef.deps);
            break;
        case 2048 /* TypeUseExistingProvider */:
            injectable = resolveNgModuleDep(ngModule, providerDef.deps[0]);
            break;
        case 256 /* TypeValueProvider */:
            injectable = providerDef.value;
            break;
    }
    // The read of `ngOnDestroy` here is slightly expensive as it's megamorphic, so it should be
    // avoided if possible. The sequence of checks here determines whether ngOnDestroy needs to be
    // checked. It might not if the `injectable` isn't an object or if NodeFlags.OnDestroy is already
    // set (ngOnDestroy was detected statically).
    if (injectable !== UNDEFINED_VALUE && injectable != null && typeof injectable === 'object' &&
        !(providerDef.flags & 131072 /* OnDestroy */) && typeof injectable.ngOnDestroy === 'function') {
        providerDef.flags |= 131072 /* OnDestroy */;
    }
    return injectable === undefined ? UNDEFINED_VALUE : injectable;
}
/**
 * @param {?} ngModule
 * @param {?} ctor
 * @param {?} deps
 * @return {?}
 */
function _createClass(ngModule, ctor, deps) {
    const /** @type {?} */ len = deps.length;
    switch (len) {
        case 0:
            return new ctor();
        case 1:
            return new ctor(resolveNgModuleDep(ngModule, deps[0]));
        case 2:
            return new ctor(resolveNgModuleDep(ngModule, deps[0]), resolveNgModuleDep(ngModule, deps[1]));
        case 3:
            return new ctor(resolveNgModuleDep(ngModule, deps[0]), resolveNgModuleDep(ngModule, deps[1]), resolveNgModuleDep(ngModule, deps[2]));
        default:
            const /** @type {?} */ depValues = new Array(len);
            for (let /** @type {?} */ i = 0; i < len; i++) {
                depValues[i] = resolveNgModuleDep(ngModule, deps[i]);
            }
            return new ctor(...depValues);
    }
}
/**
 * @param {?} ngModule
 * @param {?} factory
 * @param {?} deps
 * @return {?}
 */
function _callFactory(ngModule, factory, deps) {
    const /** @type {?} */ len = deps.length;
    switch (len) {
        case 0:
            return factory();
        case 1:
            return factory(resolveNgModuleDep(ngModule, deps[0]));
        case 2:
            return factory(resolveNgModuleDep(ngModule, deps[0]), resolveNgModuleDep(ngModule, deps[1]));
        case 3:
            return factory(resolveNgModuleDep(ngModule, deps[0]), resolveNgModuleDep(ngModule, deps[1]), resolveNgModuleDep(ngModule, deps[2]));
        default:
            const /** @type {?} */ depValues = Array(len);
            for (let /** @type {?} */ i = 0; i < len; i++) {
                depValues[i] = resolveNgModuleDep(ngModule, deps[i]);
            }
            return factory(...depValues);
    }
}
/**
 * @param {?} ngModule
 * @param {?} lifecycles
 * @return {?}
 */
export function callNgModuleLifecycle(ngModule, lifecycles) {
    const /** @type {?} */ def = ngModule._def;
    const /** @type {?} */ destroyed = new Set();
    for (let /** @type {?} */ i = 0; i < def.providers.length; i++) {
        const /** @type {?} */ provDef = def.providers[i];
        if (provDef.flags & 131072 /* OnDestroy */) {
            const /** @type {?} */ instance = ngModule._providers[i];
            if (instance && instance !== UNDEFINED_VALUE) {
                const /** @type {?} */ onDestroy = instance.ngOnDestroy;
                if (typeof onDestroy === 'function' && !destroyed.has(instance)) {
                    onDestroy.apply(instance);
                    destroyed.add(instance);
                }
            }
        }
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdmlldy9uZ19tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFlLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ25GLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHbEMsT0FBTyxFQUFDLFlBQVksRUFBRSxRQUFRLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFOUMsdUJBQU0sZUFBZSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFFckMsdUJBQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQy9DLHVCQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQyx1QkFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7Ozs7Ozs7O0FBRWxELE1BQU0sMkJBQ0YsS0FBZ0IsRUFBRSxLQUFVLEVBQUUsS0FBVSxFQUN4QyxJQUErQjs7OztJQUlqQyxLQUFLLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsdUJBQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDckQsT0FBTzs7UUFFTCxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ1QsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUs7S0FD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RUFBRSxFQUFFO2dCQUM1QixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3REO1lBQ0QsT0FBTyxPQUFPLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztLQUNoQztDQUNGOzs7Ozs7QUFFRCxNQUFNLGdDQUFnQyxRQUFzQixFQUFFLFVBQXFCO0lBQ2pGLHVCQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQzFCLHVCQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBTyxDQUFDO0lBQ2pDLEtBQUsscUJBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDN0MsdUJBQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLENBQUMsS0FBSyx5QkFBc0IsRUFBRTtZQUN2Qyx1QkFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxJQUFJLFFBQVEsSUFBSSxRQUFRLEtBQUssZUFBZSxFQUFFO2dCQUM1Qyx1QkFBTSxTQUFTLEdBQXVCLFFBQVEsQ0FBQyxXQUFXLENBQUM7Z0JBQzNELElBQUksT0FBTyxTQUFTLEtBQUssVUFBVSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDL0QsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDMUIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDekI7YUFDRjtTQUNGO0tBQ0Y7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlRGVmfSBmcm9tICcuLi9kaS9kZWZzJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uL2RpL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SU5KRUNUT1IsIEluamVjdEZsYWdzLCBJbmplY3Rvciwgc2V0Q3VycmVudEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0FQUF9ST09UfSBmcm9tICcuLi9kaS9zY29wZSc7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge0RlcERlZiwgRGVwRmxhZ3MsIE5nTW9kdWxlRGF0YSwgTmdNb2R1bGVEZWZpbml0aW9uLCBOZ01vZHVsZVByb3ZpZGVyRGVmLCBOb2RlRmxhZ3N9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtzcGxpdERlcHNEc2wsIHRva2VuS2V5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBVTkRFRklORURfVkFMVUUgPSBuZXcgT2JqZWN0KCk7XG5cbmNvbnN0IEluamVjdG9yUmVmVG9rZW5LZXkgPSB0b2tlbktleShJbmplY3Rvcik7XG5jb25zdCBJTkpFQ1RPUlJlZlRva2VuS2V5ID0gdG9rZW5LZXkoSU5KRUNUT1IpO1xuY29uc3QgTmdNb2R1bGVSZWZUb2tlbktleSA9IHRva2VuS2V5KE5nTW9kdWxlUmVmKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1vZHVsZVByb3ZpZGVEZWYoXG4gICAgZmxhZ3M6IE5vZGVGbGFncywgdG9rZW46IGFueSwgdmFsdWU6IGFueSxcbiAgICBkZXBzOiAoW0RlcEZsYWdzLCBhbnldIHwgYW55KVtdKTogTmdNb2R1bGVQcm92aWRlckRlZiB7XG4gIC8vIE5lZWQgdG8gcmVzb2x2ZSBmb3J3YXJkUmVmcyBhcyBlLmcuIGZvciBgdXNlVmFsdWVgIHdlXG4gIC8vIGxvd2VyZWQgdGhlIGV4cHJlc3Npb24gYW5kIHRoZW4gc3RvcHBlZCBldmFsdWF0aW5nIGl0LFxuICAvLyBpLmUuIGFsc28gZGlkbid0IHVud3JhcCBpdC5cbiAgdmFsdWUgPSByZXNvbHZlRm9yd2FyZFJlZih2YWx1ZSk7XG4gIGNvbnN0IGRlcERlZnMgPSBzcGxpdERlcHNEc2woZGVwcywgc3RyaW5naWZ5KHRva2VuKSk7XG4gIHJldHVybiB7XG4gICAgLy8gd2lsbCBiZXQgc2V0IGJ5IHRoZSBtb2R1bGUgZGVmaW5pdGlvblxuICAgIGluZGV4OiAtMSxcbiAgICBkZXBzOiBkZXBEZWZzLCBmbGFncywgdG9rZW4sIHZhbHVlXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2R1bGVEZWYocHJvdmlkZXJzOiBOZ01vZHVsZVByb3ZpZGVyRGVmW10pOiBOZ01vZHVsZURlZmluaXRpb24ge1xuICBjb25zdCBwcm92aWRlcnNCeUtleToge1trZXk6IHN0cmluZ106IE5nTW9kdWxlUHJvdmlkZXJEZWZ9ID0ge307XG4gIGNvbnN0IG1vZHVsZXMgPSBbXTtcbiAgbGV0IGlzUm9vdDogYm9vbGVhbiA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZpZGVyID0gcHJvdmlkZXJzW2ldO1xuICAgIGlmIChwcm92aWRlci50b2tlbiA9PT0gQVBQX1JPT1QpIHtcbiAgICAgIGlzUm9vdCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChwcm92aWRlci5mbGFncyAmIE5vZGVGbGFncy5UeXBlTmdNb2R1bGUpIHtcbiAgICAgIG1vZHVsZXMucHVzaChwcm92aWRlci50b2tlbik7XG4gICAgfVxuICAgIHByb3ZpZGVyLmluZGV4ID0gaTtcbiAgICBwcm92aWRlcnNCeUtleVt0b2tlbktleShwcm92aWRlci50b2tlbildID0gcHJvdmlkZXI7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICAvLyBXaWxsIGJlIGZpbGxlZCBsYXRlci4uLlxuICAgIGZhY3Rvcnk6IG51bGwsXG4gICAgcHJvdmlkZXJzQnlLZXksXG4gICAgcHJvdmlkZXJzLFxuICAgIG1vZHVsZXMsXG4gICAgaXNSb290LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdE5nTW9kdWxlKGRhdGE6IE5nTW9kdWxlRGF0YSkge1xuICBjb25zdCBkZWYgPSBkYXRhLl9kZWY7XG4gIGNvbnN0IHByb3ZpZGVycyA9IGRhdGEuX3Byb3ZpZGVycyA9IG5ldyBBcnJheShkZWYucHJvdmlkZXJzLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZEZWYgPSBkZWYucHJvdmlkZXJzW2ldO1xuICAgIGlmICghKHByb3ZEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyKSkge1xuICAgICAgLy8gTWFrZSBzdXJlIHRoZSBwcm92aWRlciBoYXMgbm90IGJlZW4gYWxyZWFkeSBpbml0aWFsaXplZCBvdXRzaWRlIHRoaXMgbG9vcC5cbiAgICAgIGlmIChwcm92aWRlcnNbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm92aWRlcnNbaV0gPSBfY3JlYXRlUHJvdmlkZXJJbnN0YW5jZShkYXRhLCBwcm92RGVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVOZ01vZHVsZURlcChcbiAgICBkYXRhOiBOZ01vZHVsZURhdGEsIGRlcERlZjogRGVwRGVmLCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICBjb25zdCBmb3JtZXIgPSBzZXRDdXJyZW50SW5qZWN0b3IoZGF0YSk7XG4gIHRyeSB7XG4gICAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlZhbHVlKSB7XG4gICAgICByZXR1cm4gZGVwRGVmLnRva2VuO1xuICAgIH1cbiAgICBpZiAoZGVwRGVmLmZsYWdzICYgRGVwRmxhZ3MuT3B0aW9uYWwpIHtcbiAgICAgIG5vdEZvdW5kVmFsdWUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoZGVwRGVmLmZsYWdzICYgRGVwRmxhZ3MuU2tpcFNlbGYpIHtcbiAgICAgIHJldHVybiBkYXRhLl9wYXJlbnQuZ2V0KGRlcERlZi50b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfVxuICAgIGNvbnN0IHRva2VuS2V5ID0gZGVwRGVmLnRva2VuS2V5O1xuICAgIHN3aXRjaCAodG9rZW5LZXkpIHtcbiAgICAgIGNhc2UgSW5qZWN0b3JSZWZUb2tlbktleTpcbiAgICAgIGNhc2UgSU5KRUNUT1JSZWZUb2tlbktleTpcbiAgICAgIGNhc2UgTmdNb2R1bGVSZWZUb2tlbktleTpcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIGNvbnN0IHByb3ZpZGVyRGVmID0gZGF0YS5fZGVmLnByb3ZpZGVyc0J5S2V5W3Rva2VuS2V5XTtcbiAgICBpZiAocHJvdmlkZXJEZWYpIHtcbiAgICAgIGxldCBwcm92aWRlckluc3RhbmNlID0gZGF0YS5fcHJvdmlkZXJzW3Byb3ZpZGVyRGVmLmluZGV4XTtcbiAgICAgIGlmIChwcm92aWRlckluc3RhbmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvdmlkZXJJbnN0YW5jZSA9IGRhdGEuX3Byb3ZpZGVyc1twcm92aWRlckRlZi5pbmRleF0gPVxuICAgICAgICAgICAgX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2UoZGF0YSwgcHJvdmlkZXJEZWYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb3ZpZGVySW5zdGFuY2UgPT09IFVOREVGSU5FRF9WQUxVRSA/IHVuZGVmaW5lZCA6IHByb3ZpZGVySW5zdGFuY2U7XG4gICAgfSBlbHNlIGlmIChkZXBEZWYudG9rZW4ubmdJbmplY3RhYmxlRGVmICYmIHRhcmdldHNNb2R1bGUoZGF0YSwgZGVwRGVmLnRva2VuLm5nSW5qZWN0YWJsZURlZikpIHtcbiAgICAgIGNvbnN0IGluamVjdGFibGVEZWYgPSBkZXBEZWYudG9rZW4ubmdJbmplY3RhYmxlRGVmIGFzIEluamVjdGFibGVEZWY8YW55PjtcbiAgICAgIGNvbnN0IGtleSA9IHRva2VuS2V5O1xuICAgICAgY29uc3QgaW5kZXggPSBkYXRhLl9wcm92aWRlcnMubGVuZ3RoO1xuICAgICAgZGF0YS5fZGVmLnByb3ZpZGVyc0J5S2V5W2RlcERlZi50b2tlbktleV0gPSB7XG4gICAgICAgIGZsYWdzOiBOb2RlRmxhZ3MuVHlwZUZhY3RvcnlQcm92aWRlciB8IE5vZGVGbGFncy5MYXp5UHJvdmlkZXIsXG4gICAgICAgIHZhbHVlOiBpbmplY3RhYmxlRGVmLmZhY3RvcnksXG4gICAgICAgIGRlcHM6IFtdLCBpbmRleCxcbiAgICAgICAgdG9rZW46IGRlcERlZi50b2tlbixcbiAgICAgIH07XG4gICAgICBkYXRhLl9wcm92aWRlcnNbaW5kZXhdID0gVU5ERUZJTkVEX1ZBTFVFO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgICBkYXRhLl9wcm92aWRlcnNbaW5kZXhdID1cbiAgICAgICAgICAgICAgX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2UoZGF0YSwgZGF0YS5fZGVmLnByb3ZpZGVyc0J5S2V5W2RlcERlZi50b2tlbktleV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGEuX3BhcmVudC5nZXQoZGVwRGVmLnRva2VuLCBub3RGb3VuZFZhbHVlKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDdXJyZW50SW5qZWN0b3IoZm9ybWVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtb2R1bGVUcmFuc2l0aXZlbHlQcmVzZW50KG5nTW9kdWxlOiBOZ01vZHVsZURhdGEsIHNjb3BlOiBhbnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5nTW9kdWxlLl9kZWYubW9kdWxlcy5pbmRleE9mKHNjb3BlKSA+IC0xO1xufVxuXG5mdW5jdGlvbiB0YXJnZXRzTW9kdWxlKG5nTW9kdWxlOiBOZ01vZHVsZURhdGEsIGRlZjogSW5qZWN0YWJsZURlZjxhbnk+KTogYm9vbGVhbiB7XG4gIHJldHVybiBkZWYucHJvdmlkZWRJbiAhPSBudWxsICYmIChtb2R1bGVUcmFuc2l0aXZlbHlQcmVzZW50KG5nTW9kdWxlLCBkZWYucHJvdmlkZWRJbikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi5wcm92aWRlZEluID09PSAncm9vdCcgJiYgbmdNb2R1bGUuX2RlZi5pc1Jvb3QpO1xufVxuXG5mdW5jdGlvbiBfY3JlYXRlUHJvdmlkZXJJbnN0YW5jZShuZ01vZHVsZTogTmdNb2R1bGVEYXRhLCBwcm92aWRlckRlZjogTmdNb2R1bGVQcm92aWRlckRlZik6IGFueSB7XG4gIGxldCBpbmplY3RhYmxlOiBhbnk7XG4gIHN3aXRjaCAocHJvdmlkZXJEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZXMpIHtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlQ2xhc3NQcm92aWRlcjpcbiAgICAgIGluamVjdGFibGUgPSBfY3JlYXRlQ2xhc3MobmdNb2R1bGUsIHByb3ZpZGVyRGVmLnZhbHVlLCBwcm92aWRlckRlZi5kZXBzKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVGYWN0b3J5UHJvdmlkZXI6XG4gICAgICBpbmplY3RhYmxlID0gX2NhbGxGYWN0b3J5KG5nTW9kdWxlLCBwcm92aWRlckRlZi52YWx1ZSwgcHJvdmlkZXJEZWYuZGVwcyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVXNlRXhpc3RpbmdQcm92aWRlcjpcbiAgICAgIGluamVjdGFibGUgPSByZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIHByb3ZpZGVyRGVmLmRlcHNbMF0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVZhbHVlUHJvdmlkZXI6XG4gICAgICBpbmplY3RhYmxlID0gcHJvdmlkZXJEZWYudmFsdWU7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIC8vIFRoZSByZWFkIG9mIGBuZ09uRGVzdHJveWAgaGVyZSBpcyBzbGlnaHRseSBleHBlbnNpdmUgYXMgaXQncyBtZWdhbW9ycGhpYywgc28gaXQgc2hvdWxkIGJlXG4gIC8vIGF2b2lkZWQgaWYgcG9zc2libGUuIFRoZSBzZXF1ZW5jZSBvZiBjaGVja3MgaGVyZSBkZXRlcm1pbmVzIHdoZXRoZXIgbmdPbkRlc3Ryb3kgbmVlZHMgdG8gYmVcbiAgLy8gY2hlY2tlZC4gSXQgbWlnaHQgbm90IGlmIHRoZSBgaW5qZWN0YWJsZWAgaXNuJ3QgYW4gb2JqZWN0IG9yIGlmIE5vZGVGbGFncy5PbkRlc3Ryb3kgaXMgYWxyZWFkeVxuICAvLyBzZXQgKG5nT25EZXN0cm95IHdhcyBkZXRlY3RlZCBzdGF0aWNhbGx5KS5cbiAgaWYgKGluamVjdGFibGUgIT09IFVOREVGSU5FRF9WQUxVRSAmJiBpbmplY3RhYmxlICE9IG51bGwgJiYgdHlwZW9mIGluamVjdGFibGUgPT09ICdvYmplY3QnICYmXG4gICAgICAhKHByb3ZpZGVyRGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uRGVzdHJveSkgJiYgdHlwZW9mIGluamVjdGFibGUubmdPbkRlc3Ryb3kgPT09ICdmdW5jdGlvbicpIHtcbiAgICBwcm92aWRlckRlZi5mbGFncyB8PSBOb2RlRmxhZ3MuT25EZXN0cm95O1xuICB9XG4gIHJldHVybiBpbmplY3RhYmxlID09PSB1bmRlZmluZWQgPyBVTkRFRklORURfVkFMVUUgOiBpbmplY3RhYmxlO1xufVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MobmdNb2R1bGU6IE5nTW9kdWxlRGF0YSwgY3RvcjogYW55LCBkZXBzOiBEZXBEZWZbXSk6IGFueSB7XG4gIGNvbnN0IGxlbiA9IGRlcHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBuZXcgY3RvcigpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBuZXcgY3RvcihyZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMF0pKTtcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gbmV3IGN0b3IocmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSwgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzFdKSk7XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKFxuICAgICAgICAgIHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1swXSksIHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1sxXSksXG4gICAgICAgICAgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzJdKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnN0IGRlcFZhbHVlcyA9IG5ldyBBcnJheShsZW4pO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBkZXBWYWx1ZXNbaV0gPSByZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbaV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBjdG9yKC4uLmRlcFZhbHVlcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2NhbGxGYWN0b3J5KG5nTW9kdWxlOiBOZ01vZHVsZURhdGEsIGZhY3Rvcnk6IGFueSwgZGVwczogRGVwRGVmW10pOiBhbnkge1xuICBjb25zdCBsZW4gPSBkZXBzLmxlbmd0aDtcbiAgc3dpdGNoIChsZW4pIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gZmFjdG9yeSgpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBmYWN0b3J5KHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1swXSkpO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBmYWN0b3J5KHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1swXSksIHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1sxXSkpO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBmYWN0b3J5KFxuICAgICAgICAgIHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1swXSksIHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1sxXSksXG4gICAgICAgICAgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzJdKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnN0IGRlcFZhbHVlcyA9IEFycmF5KGxlbik7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGRlcFZhbHVlc1tpXSA9IHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFjdG9yeSguLi5kZXBWYWx1ZXMpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsTmdNb2R1bGVMaWZlY3ljbGUobmdNb2R1bGU6IE5nTW9kdWxlRGF0YSwgbGlmZWN5Y2xlczogTm9kZUZsYWdzKSB7XG4gIGNvbnN0IGRlZiA9IG5nTW9kdWxlLl9kZWY7XG4gIGNvbnN0IGRlc3Ryb3llZCA9IG5ldyBTZXQ8YW55PigpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5wcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcm92RGVmID0gZGVmLnByb3ZpZGVyc1tpXTtcbiAgICBpZiAocHJvdkRlZi5mbGFncyAmIE5vZGVGbGFncy5PbkRlc3Ryb3kpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gbmdNb2R1bGUuX3Byb3ZpZGVyc1tpXTtcbiAgICAgIGlmIChpbnN0YW5jZSAmJiBpbnN0YW5jZSAhPT0gVU5ERUZJTkVEX1ZBTFVFKSB7XG4gICAgICAgIGNvbnN0IG9uRGVzdHJveTogRnVuY3Rpb258dW5kZWZpbmVkID0gaW5zdGFuY2UubmdPbkRlc3Ryb3k7XG4gICAgICAgIGlmICh0eXBlb2Ygb25EZXN0cm95ID09PSAnZnVuY3Rpb24nICYmICFkZXN0cm95ZWQuaGFzKGluc3RhbmNlKSkge1xuICAgICAgICAgIG9uRGVzdHJveS5hcHBseShpbnN0YW5jZSk7XG4gICAgICAgICAgZGVzdHJveWVkLmFkZChpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==