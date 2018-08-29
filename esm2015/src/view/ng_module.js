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
import { resolveForwardRef } from '../di/forward_ref';
import { INJECTOR, Injector, setCurrentInjector } from '../di/injector';
import { APP_ROOT } from '../di/scope';
import { NgModuleRef } from '../linker/ng_module_factory';
import { stringify } from '../util';
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
        if (providerDef) {
            /** @type {?} */
            let providerInstance = data._providers[providerDef.index];
            if (providerInstance === undefined) {
                providerInstance = data._providers[providerDef.index] =
                    _createProviderInstance(data, providerDef);
            }
            return providerInstance === UNDEFINED_VALUE ? undefined : providerInstance;
        }
        else if (depDef.token.ngInjectableDef && targetsModule(data, depDef.token.ngInjectableDef)) {
            /** @type {?} */
            const injectableDef = /** @type {?} */ (depDef.token.ngInjectableDef);
            /** @type {?} */
            const key = tokenKey;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdmlldy9uZ19tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFlLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ25GLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHbEMsT0FBTyxFQUFDLFlBQVksRUFBRSxRQUFRLEVBQUMsTUFBTSxRQUFRLENBQUM7O0FBRTlDLE1BQU0sZUFBZSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7O0FBRXJDLE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUMvQyxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFDL0MsTUFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7Ozs7Ozs7O0FBRWxELE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsS0FBZ0IsRUFBRSxLQUFVLEVBQUUsS0FBVSxFQUN4QyxJQUErQjs7OztJQUlqQyxLQUFLLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7O0lBQ2pDLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDckQsT0FBTzs7UUFFTCxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ1QsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUs7S0FDbkMsQ0FBQztDQUNIOzs7OztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsU0FBZ0M7O0lBQ3hELE1BQU0sY0FBYyxHQUF5QyxFQUFFLENBQUM7O0lBQ2hFLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQzs7SUFDbkIsSUFBSSxNQUFNLEdBQVksS0FBSyxDQUFDO0lBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztRQUN6QyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsSUFBSSxRQUFRLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSSxRQUFRLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRTtZQUMxRCxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ2Y7UUFDRCxJQUFJLFFBQVEsQ0FBQyxLQUFLLGdDQUF5QixFQUFFO1lBQzNDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzlCO1FBQ0QsUUFBUSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDbkIsY0FBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7S0FDckQ7SUFDRCxPQUFPOztRQUVMLE9BQU8sRUFBRSxJQUFJO1FBQ2IsY0FBYztRQUNkLFNBQVM7UUFDVCxPQUFPO1FBQ1AsTUFBTTtLQUNQLENBQUM7Q0FDSDs7Ozs7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQWtCOztJQUM3QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDOztJQUN0QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztRQUM3QyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLDBCQUF5QixDQUFDLEVBQUU7O1lBRTdDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRTtnQkFDOUIsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLHVCQUF1QixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQzthQUN2RDtTQUNGO0tBQ0Y7Q0FDRjs7Ozs7OztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsSUFBa0IsRUFBRSxNQUFjLEVBQUUsZ0JBQXFCLFFBQVEsQ0FBQyxrQkFBa0I7O0lBQ3RGLE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLElBQUk7UUFDRixJQUFJLE1BQU0sQ0FBQyxLQUFLLGdCQUFpQixFQUFFO1lBQ2pDLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQztTQUNyQjtRQUNELElBQUksTUFBTSxDQUFDLEtBQUssbUJBQW9CLEVBQUU7WUFDcEMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUN0QjtRQUNELElBQUksTUFBTSxDQUFDLEtBQUssbUJBQW9CLEVBQUU7WUFDcEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQ3REOztRQUNELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDakMsUUFBUSxRQUFRLEVBQUU7WUFDaEIsS0FBSyxtQkFBbUIsQ0FBQztZQUN6QixLQUFLLG1CQUFtQixDQUFDO1lBQ3pCLEtBQUssbUJBQW1CO2dCQUN0QixPQUFPLElBQUksQ0FBQztTQUNmOztRQUNELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZELElBQUksV0FBVyxFQUFFOztZQUNmLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUQsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUU7Z0JBQ2xDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztvQkFDakQsdUJBQXVCLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQ2hEO1lBQ0QsT0FBTyxnQkFBZ0IsS0FBSyxlQUFlLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7U0FDNUU7YUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxJQUFJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRTs7WUFDNUYsTUFBTSxhQUFhLHFCQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBcUMsRUFBQzs7WUFDekUsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDOztZQUNyQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUc7Z0JBQzFDLEtBQUssRUFBRSx3REFBc0Q7Z0JBQzdELEtBQUssRUFBRSxhQUFhLENBQUMsT0FBTztnQkFDNUIsSUFBSSxFQUFFLEVBQUUsRUFBRSxLQUFLO2dCQUNmLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSzthQUNwQixDQUFDO1lBQ0YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxlQUFlLENBQUM7WUFDekMsT0FBTyxDQUNILElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUNsQix1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNuRjthQUFNLElBQUksTUFBTSxDQUFDLEtBQUssZUFBZ0IsRUFBRTtZQUN2QyxPQUFPLGFBQWEsQ0FBQztTQUN0QjtRQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztLQUN0RDtZQUFTO1FBQ1Isa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDNUI7Q0FDRjs7Ozs7O0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxRQUFzQixFQUFFLEtBQVU7SUFDbkUsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDbEQ7Ozs7OztBQUVELFNBQVMsYUFBYSxDQUFDLFFBQXNCLEVBQUUsR0FBdUI7SUFDcEUsT0FBTyxHQUFHLENBQUMsVUFBVSxJQUFJLElBQUksSUFBSSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDO1FBQ25ELEdBQUcsQ0FBQyxVQUFVLEtBQUssTUFBTSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Q0FDdEY7Ozs7OztBQUVELFNBQVMsdUJBQXVCLENBQUMsUUFBc0IsRUFBRSxXQUFnQzs7SUFDdkYsSUFBSSxVQUFVLENBQU07SUFDcEIsUUFBUSxXQUFXLENBQUMsS0FBSyx3QkFBa0IsRUFBRTtRQUMzQztZQUNFLFVBQVUsR0FBRyxZQUFZLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE1BQU07UUFDUjtZQUNFLFVBQVUsR0FBRyxZQUFZLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE1BQU07UUFDUjtZQUNFLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9ELE1BQU07UUFDUjtZQUNFLFVBQVUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQy9CLE1BQU07S0FDVDs7Ozs7SUFNRCxJQUFJLFVBQVUsS0FBSyxlQUFlLElBQUksVUFBVSxJQUFJLElBQUksSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRO1FBQ3RGLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyx5QkFBc0IsQ0FBQyxJQUFJLE9BQU8sVUFBVSxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUU7UUFDOUYsV0FBVyxDQUFDLEtBQUssMEJBQXVCLENBQUM7S0FDMUM7SUFDRCxPQUFPLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0NBQ2hFOzs7Ozs7O0FBRUQsU0FBUyxZQUFZLENBQUMsUUFBc0IsRUFBRSxJQUFTLEVBQUUsSUFBYzs7SUFDckUsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN4QixRQUFRLEdBQUcsRUFBRTtRQUNYLEtBQUssQ0FBQztZQUNKLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUNwQixLQUFLLENBQUM7WUFDSixPQUFPLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pELEtBQUssQ0FBQztZQUNKLE9BQU8sSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLEtBQUssQ0FBQztZQUNKLE9BQU8sSUFBSSxJQUFJLENBQ1gsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDNUUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0M7O1lBQ0UsTUFBTSxTQUFTLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDNUIsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN0RDtZQUNELE9BQU8sSUFBSSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztLQUNqQztDQUNGOzs7Ozs7O0FBRUQsU0FBUyxZQUFZLENBQUMsUUFBc0IsRUFBRSxPQUFZLEVBQUUsSUFBYzs7SUFDeEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN4QixRQUFRLEdBQUcsRUFBRTtRQUNYLEtBQUssQ0FBQztZQUNKLE9BQU8sT0FBTyxFQUFFLENBQUM7UUFDbkIsS0FBSyxDQUFDO1lBQ0osT0FBTyxPQUFPLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsS0FBSyxDQUFDO1lBQ0osT0FBTyxPQUFPLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9GLEtBQUssQ0FBQztZQUNKLE9BQU8sT0FBTyxDQUNWLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQzVFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDOztZQUNFLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM1QixTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3REO1lBQ0QsT0FBTyxPQUFPLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztLQUNoQztDQUNGOzs7Ozs7QUFFRCxNQUFNLFVBQVUscUJBQXFCLENBQUMsUUFBc0IsRUFBRSxVQUFxQjs7SUFDakYsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQzs7SUFDMUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQU8sQ0FBQztJQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBQzdDLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsSUFBSSxPQUFPLENBQUMsS0FBSyx5QkFBc0IsRUFBRTs7WUFDdkMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxJQUFJLFFBQVEsSUFBSSxRQUFRLEtBQUssZUFBZSxFQUFFOztnQkFDNUMsTUFBTSxTQUFTLEdBQXVCLFFBQVEsQ0FBQyxXQUFXLENBQUM7Z0JBQzNELElBQUksT0FBTyxTQUFTLEtBQUssVUFBVSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDL0QsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDMUIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDekI7YUFDRjtTQUNGO0tBQ0Y7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlRGVmfSBmcm9tICcuLi9kaS9kZWZzJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uL2RpL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SU5KRUNUT1IsIEluamVjdEZsYWdzLCBJbmplY3Rvciwgc2V0Q3VycmVudEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0FQUF9ST09UfSBmcm9tICcuLi9kaS9zY29wZSc7XG5pbXBvcnQge05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge0RlcERlZiwgRGVwRmxhZ3MsIE5nTW9kdWxlRGF0YSwgTmdNb2R1bGVEZWZpbml0aW9uLCBOZ01vZHVsZVByb3ZpZGVyRGVmLCBOb2RlRmxhZ3N9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtzcGxpdERlcHNEc2wsIHRva2VuS2V5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBVTkRFRklORURfVkFMVUUgPSBuZXcgT2JqZWN0KCk7XG5cbmNvbnN0IEluamVjdG9yUmVmVG9rZW5LZXkgPSB0b2tlbktleShJbmplY3Rvcik7XG5jb25zdCBJTkpFQ1RPUlJlZlRva2VuS2V5ID0gdG9rZW5LZXkoSU5KRUNUT1IpO1xuY29uc3QgTmdNb2R1bGVSZWZUb2tlbktleSA9IHRva2VuS2V5KE5nTW9kdWxlUmVmKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1vZHVsZVByb3ZpZGVEZWYoXG4gICAgZmxhZ3M6IE5vZGVGbGFncywgdG9rZW46IGFueSwgdmFsdWU6IGFueSxcbiAgICBkZXBzOiAoW0RlcEZsYWdzLCBhbnldIHwgYW55KVtdKTogTmdNb2R1bGVQcm92aWRlckRlZiB7XG4gIC8vIE5lZWQgdG8gcmVzb2x2ZSBmb3J3YXJkUmVmcyBhcyBlLmcuIGZvciBgdXNlVmFsdWVgIHdlXG4gIC8vIGxvd2VyZWQgdGhlIGV4cHJlc3Npb24gYW5kIHRoZW4gc3RvcHBlZCBldmFsdWF0aW5nIGl0LFxuICAvLyBpLmUuIGFsc28gZGlkbid0IHVud3JhcCBpdC5cbiAgdmFsdWUgPSByZXNvbHZlRm9yd2FyZFJlZih2YWx1ZSk7XG4gIGNvbnN0IGRlcERlZnMgPSBzcGxpdERlcHNEc2woZGVwcywgc3RyaW5naWZ5KHRva2VuKSk7XG4gIHJldHVybiB7XG4gICAgLy8gd2lsbCBiZXQgc2V0IGJ5IHRoZSBtb2R1bGUgZGVmaW5pdGlvblxuICAgIGluZGV4OiAtMSxcbiAgICBkZXBzOiBkZXBEZWZzLCBmbGFncywgdG9rZW4sIHZhbHVlXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2R1bGVEZWYocHJvdmlkZXJzOiBOZ01vZHVsZVByb3ZpZGVyRGVmW10pOiBOZ01vZHVsZURlZmluaXRpb24ge1xuICBjb25zdCBwcm92aWRlcnNCeUtleToge1trZXk6IHN0cmluZ106IE5nTW9kdWxlUHJvdmlkZXJEZWZ9ID0ge307XG4gIGNvbnN0IG1vZHVsZXMgPSBbXTtcbiAgbGV0IGlzUm9vdDogYm9vbGVhbiA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZpZGVyID0gcHJvdmlkZXJzW2ldO1xuICAgIGlmIChwcm92aWRlci50b2tlbiA9PT0gQVBQX1JPT1QgJiYgcHJvdmlkZXIudmFsdWUgPT09IHRydWUpIHtcbiAgICAgIGlzUm9vdCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChwcm92aWRlci5mbGFncyAmIE5vZGVGbGFncy5UeXBlTmdNb2R1bGUpIHtcbiAgICAgIG1vZHVsZXMucHVzaChwcm92aWRlci50b2tlbik7XG4gICAgfVxuICAgIHByb3ZpZGVyLmluZGV4ID0gaTtcbiAgICBwcm92aWRlcnNCeUtleVt0b2tlbktleShwcm92aWRlci50b2tlbildID0gcHJvdmlkZXI7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICAvLyBXaWxsIGJlIGZpbGxlZCBsYXRlci4uLlxuICAgIGZhY3Rvcnk6IG51bGwsXG4gICAgcHJvdmlkZXJzQnlLZXksXG4gICAgcHJvdmlkZXJzLFxuICAgIG1vZHVsZXMsXG4gICAgaXNSb290LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdE5nTW9kdWxlKGRhdGE6IE5nTW9kdWxlRGF0YSkge1xuICBjb25zdCBkZWYgPSBkYXRhLl9kZWY7XG4gIGNvbnN0IHByb3ZpZGVycyA9IGRhdGEuX3Byb3ZpZGVycyA9IG5ldyBBcnJheShkZWYucHJvdmlkZXJzLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZEZWYgPSBkZWYucHJvdmlkZXJzW2ldO1xuICAgIGlmICghKHByb3ZEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuTGF6eVByb3ZpZGVyKSkge1xuICAgICAgLy8gTWFrZSBzdXJlIHRoZSBwcm92aWRlciBoYXMgbm90IGJlZW4gYWxyZWFkeSBpbml0aWFsaXplZCBvdXRzaWRlIHRoaXMgbG9vcC5cbiAgICAgIGlmIChwcm92aWRlcnNbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm92aWRlcnNbaV0gPSBfY3JlYXRlUHJvdmlkZXJJbnN0YW5jZShkYXRhLCBwcm92RGVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVOZ01vZHVsZURlcChcbiAgICBkYXRhOiBOZ01vZHVsZURhdGEsIGRlcERlZjogRGVwRGVmLCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICBjb25zdCBmb3JtZXIgPSBzZXRDdXJyZW50SW5qZWN0b3IoZGF0YSk7XG4gIHRyeSB7XG4gICAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlZhbHVlKSB7XG4gICAgICByZXR1cm4gZGVwRGVmLnRva2VuO1xuICAgIH1cbiAgICBpZiAoZGVwRGVmLmZsYWdzICYgRGVwRmxhZ3MuT3B0aW9uYWwpIHtcbiAgICAgIG5vdEZvdW5kVmFsdWUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoZGVwRGVmLmZsYWdzICYgRGVwRmxhZ3MuU2tpcFNlbGYpIHtcbiAgICAgIHJldHVybiBkYXRhLl9wYXJlbnQuZ2V0KGRlcERlZi50b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfVxuICAgIGNvbnN0IHRva2VuS2V5ID0gZGVwRGVmLnRva2VuS2V5O1xuICAgIHN3aXRjaCAodG9rZW5LZXkpIHtcbiAgICAgIGNhc2UgSW5qZWN0b3JSZWZUb2tlbktleTpcbiAgICAgIGNhc2UgSU5KRUNUT1JSZWZUb2tlbktleTpcbiAgICAgIGNhc2UgTmdNb2R1bGVSZWZUb2tlbktleTpcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIGNvbnN0IHByb3ZpZGVyRGVmID0gZGF0YS5fZGVmLnByb3ZpZGVyc0J5S2V5W3Rva2VuS2V5XTtcbiAgICBpZiAocHJvdmlkZXJEZWYpIHtcbiAgICAgIGxldCBwcm92aWRlckluc3RhbmNlID0gZGF0YS5fcHJvdmlkZXJzW3Byb3ZpZGVyRGVmLmluZGV4XTtcbiAgICAgIGlmIChwcm92aWRlckluc3RhbmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvdmlkZXJJbnN0YW5jZSA9IGRhdGEuX3Byb3ZpZGVyc1twcm92aWRlckRlZi5pbmRleF0gPVxuICAgICAgICAgICAgX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2UoZGF0YSwgcHJvdmlkZXJEZWYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByb3ZpZGVySW5zdGFuY2UgPT09IFVOREVGSU5FRF9WQUxVRSA/IHVuZGVmaW5lZCA6IHByb3ZpZGVySW5zdGFuY2U7XG4gICAgfSBlbHNlIGlmIChkZXBEZWYudG9rZW4ubmdJbmplY3RhYmxlRGVmICYmIHRhcmdldHNNb2R1bGUoZGF0YSwgZGVwRGVmLnRva2VuLm5nSW5qZWN0YWJsZURlZikpIHtcbiAgICAgIGNvbnN0IGluamVjdGFibGVEZWYgPSBkZXBEZWYudG9rZW4ubmdJbmplY3RhYmxlRGVmIGFzIEluamVjdGFibGVEZWY8YW55PjtcbiAgICAgIGNvbnN0IGtleSA9IHRva2VuS2V5O1xuICAgICAgY29uc3QgaW5kZXggPSBkYXRhLl9wcm92aWRlcnMubGVuZ3RoO1xuICAgICAgZGF0YS5fZGVmLnByb3ZpZGVyc0J5S2V5W2RlcERlZi50b2tlbktleV0gPSB7XG4gICAgICAgIGZsYWdzOiBOb2RlRmxhZ3MuVHlwZUZhY3RvcnlQcm92aWRlciB8IE5vZGVGbGFncy5MYXp5UHJvdmlkZXIsXG4gICAgICAgIHZhbHVlOiBpbmplY3RhYmxlRGVmLmZhY3RvcnksXG4gICAgICAgIGRlcHM6IFtdLCBpbmRleCxcbiAgICAgICAgdG9rZW46IGRlcERlZi50b2tlbixcbiAgICAgIH07XG4gICAgICBkYXRhLl9wcm92aWRlcnNbaW5kZXhdID0gVU5ERUZJTkVEX1ZBTFVFO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgICBkYXRhLl9wcm92aWRlcnNbaW5kZXhdID1cbiAgICAgICAgICAgICAgX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2UoZGF0YSwgZGF0YS5fZGVmLnByb3ZpZGVyc0J5S2V5W2RlcERlZi50b2tlbktleV0pKTtcbiAgICB9IGVsc2UgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlNlbGYpIHtcbiAgICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YS5fcGFyZW50LmdldChkZXBEZWYudG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1vZHVsZVRyYW5zaXRpdmVseVByZXNlbnQobmdNb2R1bGU6IE5nTW9kdWxlRGF0YSwgc2NvcGU6IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmdNb2R1bGUuX2RlZi5tb2R1bGVzLmluZGV4T2Yoc2NvcGUpID4gLTE7XG59XG5cbmZ1bmN0aW9uIHRhcmdldHNNb2R1bGUobmdNb2R1bGU6IE5nTW9kdWxlRGF0YSwgZGVmOiBJbmplY3RhYmxlRGVmPGFueT4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGRlZi5wcm92aWRlZEluICE9IG51bGwgJiYgKG1vZHVsZVRyYW5zaXRpdmVseVByZXNlbnQobmdNb2R1bGUsIGRlZi5wcm92aWRlZEluKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmLnByb3ZpZGVkSW4gPT09ICdyb290JyAmJiBuZ01vZHVsZS5fZGVmLmlzUm9vdCk7XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVQcm92aWRlckluc3RhbmNlKG5nTW9kdWxlOiBOZ01vZHVsZURhdGEsIHByb3ZpZGVyRGVmOiBOZ01vZHVsZVByb3ZpZGVyRGVmKTogYW55IHtcbiAgbGV0IGluamVjdGFibGU6IGFueTtcbiAgc3dpdGNoIChwcm92aWRlckRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlcykge1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVDbGFzc1Byb3ZpZGVyOlxuICAgICAgaW5qZWN0YWJsZSA9IF9jcmVhdGVDbGFzcyhuZ01vZHVsZSwgcHJvdmlkZXJEZWYudmFsdWUsIHByb3ZpZGVyRGVmLmRlcHMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUZhY3RvcnlQcm92aWRlcjpcbiAgICAgIGluamVjdGFibGUgPSBfY2FsbEZhY3RvcnkobmdNb2R1bGUsIHByb3ZpZGVyRGVmLnZhbHVlLCBwcm92aWRlckRlZi5kZXBzKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVVc2VFeGlzdGluZ1Byb3ZpZGVyOlxuICAgICAgaW5qZWN0YWJsZSA9IHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgcHJvdmlkZXJEZWYuZGVwc1swXSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVmFsdWVQcm92aWRlcjpcbiAgICAgIGluamVjdGFibGUgPSBwcm92aWRlckRlZi52YWx1ZTtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gVGhlIHJlYWQgb2YgYG5nT25EZXN0cm95YCBoZXJlIGlzIHNsaWdodGx5IGV4cGVuc2l2ZSBhcyBpdCdzIG1lZ2Ftb3JwaGljLCBzbyBpdCBzaG91bGQgYmVcbiAgLy8gYXZvaWRlZCBpZiBwb3NzaWJsZS4gVGhlIHNlcXVlbmNlIG9mIGNoZWNrcyBoZXJlIGRldGVybWluZXMgd2hldGhlciBuZ09uRGVzdHJveSBuZWVkcyB0byBiZVxuICAvLyBjaGVja2VkLiBJdCBtaWdodCBub3QgaWYgdGhlIGBpbmplY3RhYmxlYCBpc24ndCBhbiBvYmplY3Qgb3IgaWYgTm9kZUZsYWdzLk9uRGVzdHJveSBpcyBhbHJlYWR5XG4gIC8vIHNldCAobmdPbkRlc3Ryb3kgd2FzIGRldGVjdGVkIHN0YXRpY2FsbHkpLlxuICBpZiAoaW5qZWN0YWJsZSAhPT0gVU5ERUZJTkVEX1ZBTFVFICYmIGluamVjdGFibGUgIT0gbnVsbCAmJiB0eXBlb2YgaW5qZWN0YWJsZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgICEocHJvdmlkZXJEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuT25EZXN0cm95KSAmJiB0eXBlb2YgaW5qZWN0YWJsZS5uZ09uRGVzdHJveSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHByb3ZpZGVyRGVmLmZsYWdzIHw9IE5vZGVGbGFncy5PbkRlc3Ryb3k7XG4gIH1cbiAgcmV0dXJuIGluamVjdGFibGUgPT09IHVuZGVmaW5lZCA/IFVOREVGSU5FRF9WQUxVRSA6IGluamVjdGFibGU7XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhuZ01vZHVsZTogTmdNb2R1bGVEYXRhLCBjdG9yOiBhbnksIGRlcHM6IERlcERlZltdKTogYW55IHtcbiAgY29uc3QgbGVuID0gZGVwcy5sZW5ndGg7XG4gIHN3aXRjaCAobGVuKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1swXSkpO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBuZXcgY3RvcihyZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMF0pLCByZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMV0pKTtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gbmV3IGN0b3IoXG4gICAgICAgICAgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSwgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzFdKSxcbiAgICAgICAgICByZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMl0pKTtcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc3QgZGVwVmFsdWVzID0gbmV3IEFycmF5KGxlbik7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGRlcFZhbHVlc1tpXSA9IHJlc29sdmVOZ01vZHVsZURlcChuZ01vZHVsZSwgZGVwc1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IGN0b3IoLi4uZGVwVmFsdWVzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfY2FsbEZhY3RvcnkobmdNb2R1bGU6IE5nTW9kdWxlRGF0YSwgZmFjdG9yeTogYW55LCBkZXBzOiBEZXBEZWZbXSk6IGFueSB7XG4gIGNvbnN0IGxlbiA9IGRlcHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIGZhY3RvcnkocmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSk7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIGZhY3RvcnkocmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSwgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzFdKSk7XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIGZhY3RvcnkoXG4gICAgICAgICAgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzBdKSwgcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzWzFdKSxcbiAgICAgICAgICByZXNvbHZlTmdNb2R1bGVEZXAobmdNb2R1bGUsIGRlcHNbMl0pKTtcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc3QgZGVwVmFsdWVzID0gQXJyYXkobGVuKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZGVwVmFsdWVzW2ldID0gcmVzb2x2ZU5nTW9kdWxlRGVwKG5nTW9kdWxlLCBkZXBzW2ldKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWN0b3J5KC4uLmRlcFZhbHVlcyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxOZ01vZHVsZUxpZmVjeWNsZShuZ01vZHVsZTogTmdNb2R1bGVEYXRhLCBsaWZlY3ljbGVzOiBOb2RlRmxhZ3MpIHtcbiAgY29uc3QgZGVmID0gbmdNb2R1bGUuX2RlZjtcbiAgY29uc3QgZGVzdHJveWVkID0gbmV3IFNldDxhbnk+KCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZEZWYgPSBkZWYucHJvdmlkZXJzW2ldO1xuICAgIGlmIChwcm92RGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uRGVzdHJveSkge1xuICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZ01vZHVsZS5fcHJvdmlkZXJzW2ldO1xuICAgICAgaWYgKGluc3RhbmNlICYmIGluc3RhbmNlICE9PSBVTkRFRklORURfVkFMVUUpIHtcbiAgICAgICAgY29uc3Qgb25EZXN0cm95OiBGdW5jdGlvbnx1bmRlZmluZWQgPSBpbnN0YW5jZS5uZ09uRGVzdHJveTtcbiAgICAgICAgaWYgKHR5cGVvZiBvbkRlc3Ryb3kgPT09ICdmdW5jdGlvbicgJiYgIWRlc3Ryb3llZC5oYXMoaW5zdGFuY2UpKSB7XG4gICAgICAgICAgb25EZXN0cm95LmFwcGx5KGluc3RhbmNlKTtcbiAgICAgICAgICBkZXN0cm95ZWQuYWRkKGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19