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
import { resolveForwardRef } from '../di/forward_ref';
import { INJECTOR, Injector } from '../di/injector';
import { setCurrentInjector } from '../di/injector_compatibility';
import { getInjectableDef } from '../di/interface/defs';
import { APP_ROOT } from '../di/scope';
import { NgModuleRef } from '../linker/ng_module_factory';
import { stringify } from '../util/stringify';
import { splitDepsDsl, tokenKey } from './util';
/** @type {?} */
const UNDEFINED_VALUE = new Object();
/** @type {?} */
const InjectorRefTokenKey = tokenKey(Injector);
/** @type {?} */
const INJECTORRefTokenKey = tokenKey(INJECTOR);
/** @type {?} */
const NgModuleRefTokenKey = tokenKey(NgModuleRef);
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
    /** @type {?} */
    const depDefs = splitDepsDsl(deps, stringify(token));
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
    /** @type {?} */
    const providersByKey = {};
    /** @type {?} */
    const modules = [];
    /** @type {?} */
    let isRoot = false;
    for (let i = 0; i < providers.length; i++) {
        /** @type {?} */
        const provider = providers[i];
        if (provider.token === APP_ROOT && provider.value === true) {
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
    /** @type {?} */
    const def = data._def;
    /** @type {?} */
    const providers = data._providers = new Array(def.providers.length);
    for (let i = 0; i < def.providers.length; i++) {
        /** @type {?} */
        const provDef = def.providers[i];
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
    /** @type {?} */
    const former = setCurrentInjector(data);
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
        /** @type {?} */
        const tokenKey = depDef.tokenKey;
        switch (tokenKey) {
            case InjectorRefTokenKey:
            case INJECTORRefTokenKey:
            case NgModuleRefTokenKey:
                return data;
        }
        /** @type {?} */
        const providerDef = data._def.providersByKey[tokenKey];
        /** @type {?} */
        let injectableDef;
        if (providerDef) {
            /** @type {?} */
            let providerInstance = data._providers[providerDef.index];
            if (providerInstance === undefined) {
                providerInstance = data._providers[providerDef.index] =
                    _createProviderInstance(data, providerDef);
            }
            return providerInstance === UNDEFINED_VALUE ? undefined : providerInstance;
        }
        else if ((injectableDef = getInjectableDef(depDef.token)) && targetsModule(data, injectableDef)) {
            /** @type {?} */
            const index = data._providers.length;
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
        else if (depDef.flags & 4 /* Self */) {
            return notFoundValue;
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
    /** @type {?} */
    let injectable;
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
    /** @type {?} */
    const len = deps.length;
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
            /** @type {?} */
            const depValues = new Array(len);
            for (let i = 0; i < len; i++) {
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
    /** @type {?} */
    const len = deps.length;
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
            /** @type {?} */
            const depValues = Array(len);
            for (let i = 0; i < len; i++) {
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
    /** @type {?} */
    const def = ngModule._def;
    /** @type {?} */
    const destroyed = new Set();
    for (let i = 0; i < def.providers.length; i++) {
        /** @type {?} */
        const provDef = def.providers[i];
        if (provDef.flags & 131072 /* OnDestroy */) {
            /** @type {?} */
            const instance = ngModule._providers[i];
            if (instance && instance !== UNDEFINED_VALUE) {
                /** @type {?} */
                const onDestroy = instance.ngOnDestroy;
                if (typeof onDestroy === 'function' && !destroyed.has(instance)) {
                    onDestroy.apply(instance);
                    destroyed.add(instance);
                }
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdmlldy9uZ19tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2xELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2hFLE9BQU8sRUFBZ0IsZ0JBQWdCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNyRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHNUMsT0FBTyxFQUFDLFlBQVksRUFBRSxRQUFRLEVBQUMsTUFBTSxRQUFRLENBQUM7O01BRXhDLGVBQWUsR0FBRyxJQUFJLE1BQU0sRUFBRTs7TUFFOUIsbUJBQW1CLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQzs7TUFDeEMsbUJBQW1CLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQzs7TUFDeEMsbUJBQW1CLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQzs7Ozs7Ozs7QUFFakQsTUFBTSxVQUFVLGdCQUFnQixDQUM1QixLQUFnQixFQUFFLEtBQVUsRUFBRSxLQUFVLEVBQ3hDLElBQStCO0lBQ2pDLHdEQUF3RDtJQUN4RCx5REFBeUQ7SUFDekQsOEJBQThCO0lBQzlCLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7VUFDM0IsT0FBTyxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BELE9BQU87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ICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0lOSkVDVE9SLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RhYmxlRGVmfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0FQUF9ST09UfSBmcm9tICcuLi9kaS9zY29wZSc7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHtEZXBEZWYsIERlcEZsYWdzLCBOZ01vZHVsZURhdGEsIE5nTW9kdWxlRGVmaW5pdGlvbiwgTmdNb2R1bGVQcm92aWRlckRlZiwgTm9kZUZsYWdzfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7c3BsaXREZXBzRHNsLCB0b2tlbktleX0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgVU5ERUZJTkVEX1ZBTFVFID0gbmV3IE9iamVjdCgpO1xuXG5jb25zdCBJbmplY3RvclJlZlRva2VuS2V5ID0gdG9rZW5LZXkoSW5qZWN0b3IpO1xuY29uc3QgSU5KRUNUT1JSZWZUb2tlbktleSA9IHRva2VuS2V5KElOSkVDVE9SKTtcbmNvbnN0IE5nTW9kdWxlUmVmVG9rZW5LZXkgPSB0b2tlbktleShOZ01vZHVsZVJlZik7XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2R1bGVQcm92aWRlRGVmKFxuICAgIGZsYWdzOiBOb2RlRmxhZ3MsIHRva2VuOiBhbnksIHZhbHVlOiBhbnksXG4gICAgZGVwczogKFtEZXBGbGFncywgYW55XSB8IGFueSlbXSk6IE5nTW9kdWxlUHJvdmlkZXJEZWYge1xuICAvLyBOZWVkIHRvIHJlc29sdmUgZm9yd2FyZFJlZnMgYXMgZS5nLiBmb3IgYHVzZVZhbHVlYCB3ZVxuICAvLyBsb3dlcmVkIHRoZSBleHByZXNzaW9uIGFuZCB0aGVuIHN0b3BwZWQgZXZhbHVhdGluZyBpdCxcbiAgLy8gaS5lLiBhbHNvIGRpZG4ndCB1bndyYXAgaXQuXG4gIHZhbHVlID0gcmVzb2x2ZUZvcndhcmRSZWYodmFsdWUpO1xuICBjb25zdCBkZXBEZWZzID0gc3BsaXREZXBzRHNsKGRlcHMsIHN0cmluZ2lmeSh0b2tlbikpO1xuICByZXR1cm4ge1xuICAgIC8vIHdpbGwgYmV0IHNldCBieSB0aGUgbW9kdWxlIGRlZmluaXRpb25cbiAgICBpbmRleDogLTEsXG4gICAgZGVwczogZGVwRGVmcywgZmxhZ3MsIHRva2VuLCB2YWx1ZVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbW9kdWxlRGVmKHByb3ZpZGVyczogTmdNb2R1bGVQcm92aWRlckRlZltdKTogTmdNb2R1bGVEZWZpbml0aW9uIHtcbiAgY29uc3QgcHJvdmlkZXJzQnlLZXk6IHtba2V5OiBzdHJpbmddOiBOZ01vZHVsZVByb3ZpZGVyRGVmfSA9IHt9O1xuICBjb25zdCBtb2R1bGVzID0gW107XG4gIGxldCBpc1Jvb3Q6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcm92aWRlciA9IHByb3ZpZGVyc1tpXTtcbiAgICBpZiAocHJvdmlkZXIudG9rZW4gPT09IEFQUF9ST09UICYmIHByb3ZpZGVyLnZhbHVlID09PSB0cnVlKSB7XG4gICAgICBpc1Jvb3QgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAocHJvdmlkZXIuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZU5nTW9kdWxlKSB7XG4gICAgICBtb2R1bGVzLnB1c2gocHJvdmlkZXIudG9rZW4pO1xuICAgIH1cbiAgICBwcm92aWRlci5pbmRleCA9IGk7XG4gICAgcHJvdmlkZXJzQnlLZXlbdG9rZW5LZXkocHJvdmlkZXIudG9rZW4pXSA9IHByb3ZpZGVyO1xuICB9XG4gIHJldHVybiB7XG4gICAgLy8gV2lsbCBiZSBmaWxsZWQgbGF0ZXIuLi5cbiAgICBmYWN0b3J5OiBudWxsLFxuICAgIHByb3ZpZGVyc0J5S2V5LFxuICAgIHByb3ZpZGVycyxcbiAgICBtb2R1bGVzLFxuICAgIGlzUm9vdCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXROZ01vZHVsZShkYXRhOiBOZ01vZHVsZURhdGEpIHtcbiAgY29uc3QgZGVmID0gZGF0YS5fZGVmO1xuICBjb25zdCBwcm92aWRlcnMgPSBkYXRhLl9wcm92aWRlcnMgPSBuZXcgQXJyYXkoZGVmLnByb3ZpZGVycy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5wcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcm92RGVmID0gZGVmLnByb3ZpZGVyc1tpXTtcbiAgICBpZiAoIShwcm92RGVmLmZsYWdzICYgTm9kZUZsYWdzLkxhenlQcm92aWRlcikpIHtcbiAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgcHJvdmlkZXIgaGFzIG5vdCBiZWVuIGFscmVhZHkgaW5pdGlhbGl6ZWQgb3V0c2lkZSB0aGlzIGxvb3AuXG4gICAgICBpZiAocHJvdmlkZXJzW2ldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvdmlkZXJzW2ldID0gX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2UoZGF0YSwgcHJvdkRlZik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlTmdNb2R1bGVEZXAoXG4gICAgZGF0YTogTmdNb2R1bGVEYXRhLCBkZXBEZWY6IERlcERlZiwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgY29uc3QgZm9ybWVyID0gc2V0Q3VycmVudEluamVjdG9yKGRhdGEpO1xuICB0cnkge1xuICAgIGlmIChkZXBEZWYuZmxhZ3MgJiBEZXBGbGFncy5WYWx1ZSkge1xuICAgICAgcmV0dXJuIGRlcERlZi50b2tlbjtcbiAgICB9XG4gICAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLk9wdGlvbmFsKSB7XG4gICAgICBub3RGb3VuZFZhbHVlID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICByZXR1cm4gZGF0YS5fcGFyZW50LmdldChkZXBEZWYudG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICAgIH1cbiAgICBjb25zdCB0b2tlbktleSA9IGRlcERlZi50b2tlbktleTtcbiAgICBzd2l0Y2ggKHRva2VuS2V5KSB7XG4gICAgICBjYXNlIEluamVjdG9yUmVmVG9rZW5LZXk6XG4gICAgICBjYXNlIElOSkVDVE9SUmVmVG9rZW5LZXk6XG4gICAgICBjYXNlIE5nTW9kdWxlUmVmVG9rZW5LZXk6XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICBjb25zdCBwcm92aWRlckRlZiA9IGRhdGEuX2RlZi5wcm92aWRlcnNCeUtleVt0b2tlbktleV07XG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGlmIChwcm92aWRlckRlZikge1xuICAgICAgbGV0IHByb3ZpZGVySW5zdGFuY2UgPSBkYXRhLl9wcm92aWRlcnNbcHJvdmlkZXJEZWYuaW5kZXhdO1xuICAgICAgaWYgKHByb3ZpZGVySW5zdGFuY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm92aWRlckluc3RhbmNlID0gZGF0YS5fcHJvdmlkZXJzW3Byb3ZpZGVyRGVmLmluZGV4XSA9XG4gICAgICAgICAgICBfY3JlYXRlUHJvdmlkZXJJbnN0YW5jZShkYXRhLCBwcm92aWRlckRlZik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJvdmlkZXJJbnN0YW5jZSA9PT0gVU5ERUZJTkVEX1ZBTFVFID8gdW5kZWZpbmVkIDogcHJvdmlkZXJJbnN0YW5jZTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICAoaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYoZGVwRGVmLnRva2VuKSkgJiYgdGFyZ2V0c01vZHVsZShkYXRhLCBpbmplY3RhYmxlRGVmKSkge1xuICAgICAgY29uc3QgaW5kZXggPSBkYXRhLl9wcm92aWRlcnMubGVuZ3RoO1xuICAgICAgZGF0YS5fZGVmLnByb3ZpZGVyc0J5S2V5W2RlcERlZi50b2tlbktleV0gPSB7XG4gICAgICAgIGZsYWdzOiBOb2RlRmxhZ3MuVHlwZUZhY3RvcnlQcm92aWRlciB8IE5vZGVGbGFncy5MYXp5UHJvdmlkZXIsXG4gICAgICAgIHZhbHVlOiBpbmplY3RhYmxlRGVmLmZhY3RvcnksXG4gICAgICAgIGRlcHM6IFtdLCBpbmRleCxcbiAgICAgICAgdG9rZW46IGRlcERlZi50b2tlbixcbiAgICAgIH07XG4gICAgICBkYXRhLl9wcm92aWRlcnNbaW5kZXhdID0gVU5ERUZJTkVEX1ZBTFVFO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgICBkYXRhLl9wcm92aWRlcnNbaW5kZXhdID1cbiAgICAgICAgICAgICAgX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2UoZGF0YSwgZGF0YS5fZGVmLnByb3ZpZGVyc0J5S2V5W2RlcERlZi50b2tlbktleV0pKTtcbiAgICB9IGVsc2UgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlNlbGYpIHtcbiAgICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YS5fcGFyZW50LmdldChkZXBEZWYudG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1vZHVsZVRyYW5zaXRpdmVseVByZXNlbnQobmdNb2R1bGU6IE5nTW9kdWxlRGF0YSwgc2NvcGU6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmdNb2R1bGUuX2RlZi5tb2R1bGVzLmluZGV4T2Yoc2NvcGUpID4gLTE7XG59XG5cbmZ1bmN0aW9uIHRhcmdldHNNb2R1bGUobmdNb2R1bGU6IE5nTW9kdWxlRGF0YSwgZGVmOiBJbmplY3RhYmxlRGVmPGFueT4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGRlZi5wcm92aWRlZEluICE9IG51bGwgJiYgKG1vZHVsZVRyYW5zaXRpdmVseVByZXNlbnQobmdNb2R1bGUsIGRlZi5wcm92aWRlZEluKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmLnByb3ZpZGVkSW4gPT09ICdyb290JyAmJiBuZ01vZHVsZS5fZGVmLmlzUm9vdCk7XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVQcm92aWRlckluc3RhbmNlKG5nTW9kdWxlOiBOZ01vZHVsZURhdGEsIHByb3ZpZGVyRGVmOiBOZ01vZHVsZVByb3ZpZGVyRGVmKTogYW55IHtcbiAgbGV0IGluamVjdGFibGU6IGFueTtcbiAgc3dpdGNoIChwcm92aWRlckRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlcykge1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVDbGFzc1Byb3ZpZGVyOlxuICAgICAgaW5qZWN0YWJsZSA9IF9jcmVhdGVDbGFzcyhuZ01vZHVsZSwgcHJvdmlkZXJEZWYudmFsdWUsIHByb3ZpZGVyRGVmLmRlcHMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUZhY3RvcnlQcm92aWRlcjpcbiAgICAgIGluamVjdGFibGUgPSBfY2FsbEZhY3RvcnkobmdNb2R1bGUsIHByb3ZpZGVyRGVmLnZhbHVlLCBwcm92aWRlckRlZi5kZXBzKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVVc2VFeGlzdGluZ1Byb3ZpZGVyOlxuICAgICAgaW5qZWN0YWJsZSA9IHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgcHJvdmlkZXJEZWYuZGVwc1swXSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVmFsdWVQcm92aWRlcjpcbiAgICAgIGluamVjdGFibGUgPSBwcm92aWRlckRlZi52YWx1ZTtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gVGhlIHJlYWQgb2YgYG5nT25EZXN0cm95YCBoZXJlIGlzIHNsaWdodGx5IGV4cGVuc2l2ZSBhcyBpdCdzIG1lZ2Ftb3JwaGljLCBzbyBpdCBzaG91bGQgYmVcbiAgLy8gYXZvaWRlZCBpZiBwb3NzaWJsZS4gVGhlIHNlcXVlbmNlIG9mIGNoZWNrcyBoZXJlIGRldGVybWluZXMgd2hldGhlciBuZ09uRGVzdHJveSBuZWVkcyB0byBiZVxuICAvLyBjaGVja2VkLiBJdCBtaWdodCBub3QgaWYgdGhlIGBpbmplY3RhYmxlYCBpc24ndCBhbiBvYmplY3Qgb3IgaWYgTm9kZUZsYWdzLk9uRGVzdHJveSBpcyBhbHJlYWR5XG4gIC8vIHNldCAobmdPbkRlc3Ryb3kgd2FzIGRldGVjdGVkIHN0YXRpY2FsbHkpLlxuICBpZiAoaW5qZWN0YWJsZSAhPT0gVU5ERUZJTkVEX1ZBTFVFICYmIGluamVjdGFibGUgIT0gbnVsbCAmJiB0eXBlb2YgaW5qZWN0YWJsZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgICEocHJvdmlkZXJEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuT25EZXN0cm95KSAmJiB0eXBlb2YgaW5qZWN0YWJsZS5uZ09uRGVzdHJveSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHByb3ZpZGVyRGVmLmZsYWdzIHw9IE5vZGVGbGFncy5PbkRlc3Ryb3k7XG4gIH1cbiAgcmV0dXJuIGluamVjdGFibGUgPT09IHVuZGVmaW5lZCA/IFVOREVGSU5FRF9WQUxVRSA6IGluamVjdGFibGU7XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhuZ01vZHVsZTogTmdNb2R1bGVEYXRhLCBjdG9yOiBhbnksIGRlcHM6IERlcERlZltdKTogYW55IHtcbiAgY29uc3QgbGVuID0gZGVwcy5sZW5ndGg7XG4gIHN3aXRjaCAobGVuKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1swXSkpO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBuZXcgY3RvcihyZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMF0pLCByZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMV0pKTtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gbmV3IGN0b3IoXG4gICAgICAgICAgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSwgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzFdKSxcbiAgICAgICAgICByZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMl0pKTtcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc3QgZGVwVmFsdWVzID0gbmV3IEFycmF5KGxlbik7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGRlcFZhbHVlc1tpXSA9IHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IGN0b3IoLi4uZGVwVmFsdWVzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfY2FsbEZhY3RvcnkobmdNb2R1bGU6IE5nTW9kdWxlRGF0YSwgZmFjdG9yeTogYW55LCBkZXBzOiBEZXBEZWZbXSk6IGFueSB7XG4gIGNvbnN0IGxlbiA9IGRlcHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIGZhY3RvcnkocmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSk7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIGZhY3RvcnkocmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSwgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzFdKSk7XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIGZhY3RvcnkoXG4gICAgICAgICAgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSwgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzFdKSxcbiAgICAgICAgICByZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMl0pKTtcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc3QgZGVwVmFsdWVzID0gQXJyYXkobGVuKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZGVwVmFsdWVzW2ldID0gcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzW2ldKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWN0b3J5KC4uLmRlcFZhbHVlcyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxOZ01vZHVsZUxpZmVjeWNsZShuZ01vZHVsZTogTmdNb2R1bGVEYXRhLCBsaWZlY3ljbGVzOiBOb2RlRmxhZ3MpIHtcbiAgY29uc3QgZGVmID0gbmdNb2R1bGUuX2RlZjtcbiAgY29uc3QgZGVzdHJveWVkID0gbmV3IFNldDxhbnk+KCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZEZWYgPSBkZWYucHJvdmlkZXJzW2ldO1xuICAgIGlmIChwcm92RGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uRGVzdHJveSkge1xuICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZ01vZHVsZS5fcHJvdmlkZXJzW2ldO1xuICAgICAgaWYgKGluc3RhbmNlICYmIGluc3RhbmNlICE9PSBVTkRFRklORURfVkFMVUUpIHtcbiAgICAgICAgY29uc3Qgb25EZXN0cm95OiBGdW5jdGlvbnx1bmRlZmluZWQgPSBpbnN0YW5jZS5uZ09uRGVzdHJveTtcbiAgICAgICAgaWYgKHR5cGVvZiBvbkRlc3Ryb3kgPT09ICdmdW5jdGlvbicgJiYgIWRlc3Ryb3llZC5oYXMoaW5zdGFuY2UpKSB7XG4gICAgICAgICAgb25EZXN0cm95LmFwcGx5KGluc3RhbmNlKTtcbiAgICAgICAgICBkZXN0cm95ZWQuYWRkKGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19