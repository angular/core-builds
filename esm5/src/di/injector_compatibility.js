/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { getInjectableDef } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { Inject, Optional, Self, SkipSelf } from './metadata';
/**
 * An InjectionToken that gets the current `Injector` for `createInjector()`-style injectors.
 *
 * Requesting this token instead of `Injector` allows `StaticInjector` to be tree-shaken from a
 * project.
 *
 * @publicApi
 */
export var INJECTOR = new InjectionToken('INJECTOR', -1 // `-1` is used by Ivy DI system as special value to recognize it as `Injector`.
);
var _THROW_IF_NOT_FOUND = new Object();
export var THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
export var NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
var NG_TOKEN_PATH = 'ngTokenPath';
var NEW_LINE = /\n/gm;
var NO_NEW_LINE = 'ɵ';
export var SOURCE = '__source';
export var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
 */
var _currentInjector = undefined;
export function setCurrentInjector(injector) {
    var former = _currentInjector;
    _currentInjector = injector;
    return former;
}
/**
 * Current implementation of inject.
 *
 * By default, it is `injectInjectorOnly`, which makes it `Injector`-only aware. It can be changed
 * to `directiveInject`, which brings in the `NodeInjector` system of ivy. It is designed this
 * way for two reasons:
 *  1. `Injector` should not depend on ivy logic.
 *  2. To maintain tree shake-ability we don't want to bring in unnecessary code.
 */
var _injectImplementation;
/**
 * Sets the current inject implementation.
 */
export function setInjectImplementation(impl) {
    var previous = _injectImplementation;
    _injectImplementation = impl;
    return previous;
}
export function injectInjectorOnly(token, flags) {
    if (flags === void 0) { flags = InjectFlags.Default; }
    if (_currentInjector === undefined) {
        throw new Error("inject() must be called from an injection context");
    }
    else if (_currentInjector === null) {
        return injectRootLimpMode(token, undefined, flags);
    }
    else {
        return _currentInjector.get(token, flags & InjectFlags.Optional ? null : undefined, flags);
    }
}
export function ɵɵinject(token, flags) {
    if (flags === void 0) { flags = InjectFlags.Default; }
    return (_injectImplementation || injectInjectorOnly)(token, flags);
}
/**
 * Injects a token from the currently active injector.
 *
 * Must be used in the context of a factory function such as one defined for an
 * `InjectionToken`. Throws an error if not called from such a context.
 *
 * Within such a factory function, using this function to request injection of a dependency
 * is faster and more type-safe than providing an additional array of dependencies
 * (as has been common with `useFactory` providers).
 *
 * @param token The injection token for the dependency to be injected.
 * @param flags Optional flags that control how injection is executed.
 * The flags correspond to injection strategies that can be specified with
 * parameter decorators `@Host`, `@Self`, `@SkipSef`, and `@Optional`.
 * @returns True if injection is successful, null otherwise.
 *
 * @usageNotes
 *
 * ### Example
 *
 * {@example core/di/ts/injector_spec.ts region='ShakableInjectionToken'}
 *
 * @publicApi
 */
export var inject = ɵɵinject;
/**
 * Injects `root` tokens in limp mode.
 *
 * If no injector exists, we can still inject tree-shakable providers which have `providedIn` set to
 * `"root"`. This is known as the limp mode injection. In such case the value is stored in the
 * `InjectableDef`.
 */
export function injectRootLimpMode(token, notFoundValue, flags) {
    var injectableDef = getInjectableDef(token);
    if (injectableDef && injectableDef.providedIn == 'root') {
        return injectableDef.value === undefined ? injectableDef.value = injectableDef.factory() :
            injectableDef.value;
    }
    if (flags & InjectFlags.Optional)
        return null;
    if (notFoundValue !== undefined)
        return notFoundValue;
    throw new Error("Injector: NOT_FOUND [" + stringify(token) + "]");
}
export function injectArgs(types) {
    var args = [];
    for (var i = 0; i < types.length; i++) {
        var arg = resolveForwardRef(types[i]);
        if (Array.isArray(arg)) {
            if (arg.length === 0) {
                throw new Error('Arguments array must have arguments.');
            }
            var type = undefined;
            var flags = InjectFlags.Default;
            for (var j = 0; j < arg.length; j++) {
                var meta = arg[j];
                if (meta instanceof Optional || meta.ngMetadataName === 'Optional' || meta === Optional) {
                    flags |= InjectFlags.Optional;
                }
                else if (meta instanceof SkipSelf || meta.ngMetadataName === 'SkipSelf' || meta === SkipSelf) {
                    flags |= InjectFlags.SkipSelf;
                }
                else if (meta instanceof Self || meta.ngMetadataName === 'Self' || meta === Self) {
                    flags |= InjectFlags.Self;
                }
                else if (meta instanceof Inject || meta === Inject) {
                    type = meta.token;
                }
                else {
                    type = meta;
                }
            }
            args.push(ɵɵinject(type, flags));
        }
        else {
            args.push(ɵɵinject(arg));
        }
    }
    return args;
}
var NullInjector = /** @class */ (function () {
    function NullInjector() {
    }
    NullInjector.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = THROW_IF_NOT_FOUND; }
        if (notFoundValue === THROW_IF_NOT_FOUND) {
            // Intentionally left behind: With dev tools open the debugger will stop here. There is no
            // reason why correctly written application should cause this exception.
            // TODO(misko): uncomment the next line once `ngDevMode` works with closure.
            // if(ngDevMode) debugger;
            var error = new Error("NullInjectorError: No provider for " + stringify(token) + "!");
            error.name = 'NullInjectorError';
            throw error;
        }
        return notFoundValue;
    };
    return NullInjector;
}());
export { NullInjector };
export function catchInjectorError(e, token, injectorErrorName, source) {
    var tokenPath = e[NG_TEMP_TOKEN_PATH];
    if (token[SOURCE]) {
        tokenPath.unshift(token[SOURCE]);
    }
    e.message = formatError('\n' + e.message, tokenPath, injectorErrorName, source);
    e[NG_TOKEN_PATH] = tokenPath;
    e[NG_TEMP_TOKEN_PATH] = null;
    throw e;
}
export function formatError(text, obj, injectorErrorName, source) {
    if (source === void 0) { source = null; }
    text = text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE ? text.substr(2) : text;
    var context = stringify(obj);
    if (obj instanceof Array) {
        context = obj.map(stringify).join(' -> ');
    }
    else if (typeof obj === 'object') {
        var parts = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                parts.push(key + ':' + (typeof value === 'string' ? JSON.stringify(value) : stringify(value)));
            }
        }
        context = "{" + parts.join(', ') + "}";
    }
    return "" + injectorErrorName + (source ? '(' + source + ')' : '') + "[" + context + "]: " + text.replace(NEW_LINE, '\n  ');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFakQsT0FBTyxFQUFDLGdCQUFnQixFQUFrQixNQUFNLGtCQUFrQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBSTVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLENBQUMsSUFBTSxRQUFRLEdBQUcsSUFBSSxjQUFjLENBQ3RDLFVBQVUsRUFDVixDQUFDLENBQVEsQ0FBRSxnRkFBZ0Y7Q0FDMUYsQ0FBQztBQUVOLElBQU0sbUJBQW1CLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUN6QyxNQUFNLENBQUMsSUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztBQUV0RCxNQUFNLENBQUMsSUFBTSxrQkFBa0IsR0FBRyxpQkFBaUIsQ0FBQztBQUNwRCxJQUFNLGFBQWEsR0FBRyxhQUFhLENBQUM7QUFDcEMsSUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDO0FBQ3hCLElBQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUN4QixNQUFNLENBQUMsSUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0FBRWpDLE1BQU0sQ0FBQyxJQUFNLFNBQVMsR0FDbEIsc0JBQXNCLENBQWdCLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsc0JBQXNCLEVBQUMsQ0FBQyxDQUFDO0FBRS9GOzs7OztHQUtHO0FBQ0gsSUFBSSxnQkFBZ0IsR0FBNEIsU0FBUyxDQUFDO0FBRTFELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxRQUFxQztJQUN0RSxJQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQztJQUNoQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUM7SUFDNUIsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsSUFBSSxxQkFDbUYsQ0FBQztBQUV4Rjs7R0FFRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsSUFBMkY7SUFFN0YsSUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUM7SUFDdkMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO0lBQzdCLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFLRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLEtBQWlDLEVBQUUsS0FBMkI7SUFBM0Isc0JBQUEsRUFBQSxRQUFRLFdBQVcsQ0FBQyxPQUFPO0lBQ2hFLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO1FBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsbURBQW1ELENBQUMsQ0FBQztLQUN0RTtTQUFNLElBQUksZ0JBQWdCLEtBQUssSUFBSSxFQUFFO1FBQ3BDLE9BQU8sa0JBQWtCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNwRDtTQUFNO1FBQ0wsT0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM1RjtBQUNILENBQUM7QUFlRCxNQUFNLFVBQVUsUUFBUSxDQUFJLEtBQWlDLEVBQUUsS0FBMkI7SUFBM0Isc0JBQUEsRUFBQSxRQUFRLFdBQVcsQ0FBQyxPQUFPO0lBRXhGLE9BQU8sQ0FBQyxxQkFBcUIsSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUJHO0FBQ0gsTUFBTSxDQUFDLElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQztBQUUvQjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLEtBQWlDLEVBQUUsYUFBNEIsRUFBRSxLQUFrQjtJQUNyRixJQUFNLGFBQWEsR0FBNEIsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkUsSUFBSSxhQUFhLElBQUksYUFBYSxDQUFDLFVBQVUsSUFBSSxNQUFNLEVBQUU7UUFDdkQsT0FBTyxhQUFhLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUMvQyxhQUFhLENBQUMsS0FBSyxDQUFDO0tBQ2hFO0lBQ0QsSUFBSSxLQUFLLEdBQUcsV0FBVyxDQUFDLFFBQVE7UUFBRSxPQUFPLElBQUksQ0FBQztJQUM5QyxJQUFJLGFBQWEsS0FBSyxTQUFTO1FBQUUsT0FBTyxhQUFhLENBQUM7SUFDdEQsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBd0IsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFHLENBQUMsQ0FBQztBQUMvRCxDQUFDO0FBRUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxLQUFnRDtJQUN6RSxJQUFNLElBQUksR0FBVSxFQUFFLENBQUM7SUFDdkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDckMsSUFBTSxHQUFHLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3RCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQzthQUN6RDtZQUNELElBQUksSUFBSSxHQUF3QixTQUFTLENBQUM7WUFDMUMsSUFBSSxLQUFLLEdBQWdCLFdBQVcsQ0FBQyxPQUFPLENBQUM7WUFFN0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25DLElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxJQUFJLFlBQVksUUFBUSxJQUFJLElBQUksQ0FBQyxjQUFjLEtBQUssVUFBVSxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7b0JBQ3ZGLEtBQUssSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDO2lCQUMvQjtxQkFBTSxJQUNILElBQUksWUFBWSxRQUFRLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxVQUFVLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtvQkFDdkYsS0FBSyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUM7aUJBQy9CO3FCQUFNLElBQUksSUFBSSxZQUFZLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO29CQUNsRixLQUFLLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQztpQkFDM0I7cUJBQU0sSUFBSSxJQUFJLFlBQVksTUFBTSxJQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7b0JBQ3BELElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2lCQUNuQjtxQkFBTTtvQkFDTCxJQUFJLEdBQUcsSUFBSSxDQUFDO2lCQUNiO2FBQ0Y7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNwQzthQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUMxQjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBR0Q7SUFBQTtJQWFBLENBQUM7SUFaQywwQkFBRyxHQUFILFVBQUksS0FBVSxFQUFFLGFBQXVDO1FBQXZDLDhCQUFBLEVBQUEsa0NBQXVDO1FBQ3JELElBQUksYUFBYSxLQUFLLGtCQUFrQixFQUFFO1lBQ3hDLDBGQUEwRjtZQUMxRix3RUFBd0U7WUFDeEUsNEVBQTRFO1lBQzVFLDBCQUEwQjtZQUMxQixJQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyx3Q0FBc0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFHLENBQUMsQ0FBQztZQUNuRixLQUFLLENBQUMsSUFBSSxHQUFHLG1CQUFtQixDQUFDO1lBQ2pDLE1BQU0sS0FBSyxDQUFDO1NBQ2I7UUFDRCxPQUFPLGFBQWEsQ0FBQztJQUN2QixDQUFDO0lBQ0gsbUJBQUM7QUFBRCxDQUFDLEFBYkQsSUFhQzs7QUFHRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLENBQU0sRUFBRSxLQUFVLEVBQUUsaUJBQXlCLEVBQUUsTUFBcUI7SUFDdEUsSUFBTSxTQUFTLEdBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDL0MsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDakIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUNsQztJQUNELENBQUMsQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNoRixDQUFDLENBQUMsYUFBYSxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUM3QixNQUFNLENBQUMsQ0FBQztBQUNWLENBQUM7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixJQUFZLEVBQUUsR0FBUSxFQUFFLGlCQUF5QixFQUFFLE1BQTRCO0lBQTVCLHVCQUFBLEVBQUEsYUFBNEI7SUFDakYsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2hHLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QixJQUFJLEdBQUcsWUFBWSxLQUFLLEVBQUU7UUFDeEIsT0FBTyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzNDO1NBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7UUFDbEMsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFDO1FBQ3pCLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFO1lBQ25CLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDM0IsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQixLQUFLLENBQUMsSUFBSSxDQUNOLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDekY7U0FDRjtRQUNELE9BQU8sR0FBRyxNQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQUcsQ0FBQztLQUNuQztJQUNELE9BQU8sS0FBRyxpQkFBaUIsSUFBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQUksT0FBTyxXQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBRyxDQUFDO0FBQ2xILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge2dldEluamVjdGFibGVEZWYsIMm1ybVJbmplY3RhYmxlRGVmfSBmcm9tICcuL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7VmFsdWVQcm92aWRlcn0gZnJvbSAnLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtJbmplY3QsIE9wdGlvbmFsLCBTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5cblxuXG4vKipcbiAqIEFuIEluamVjdGlvblRva2VuIHRoYXQgZ2V0cyB0aGUgY3VycmVudCBgSW5qZWN0b3JgIGZvciBgY3JlYXRlSW5qZWN0b3IoKWAtc3R5bGUgaW5qZWN0b3JzLlxuICpcbiAqIFJlcXVlc3RpbmcgdGhpcyB0b2tlbiBpbnN0ZWFkIG9mIGBJbmplY3RvcmAgYWxsb3dzIGBTdGF0aWNJbmplY3RvcmAgdG8gYmUgdHJlZS1zaGFrZW4gZnJvbSBhXG4gKiBwcm9qZWN0LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IElOSkVDVE9SID0gbmV3IEluamVjdGlvblRva2VuPEluamVjdG9yPihcbiAgICAnSU5KRUNUT1InLFxuICAgIC0xIGFzIGFueSAgLy8gYC0xYCBpcyB1c2VkIGJ5IEl2eSBESSBzeXN0ZW0gYXMgc3BlY2lhbCB2YWx1ZSB0byByZWNvZ25pemUgaXQgYXMgYEluamVjdG9yYC5cbiAgICApO1xuXG5jb25zdCBfVEhST1dfSUZfTk9UX0ZPVU5EID0gbmV3IE9iamVjdCgpO1xuZXhwb3J0IGNvbnN0IFRIUk9XX0lGX05PVF9GT1VORCA9IF9USFJPV19JRl9OT1RfRk9VTkQ7XG5cbmV4cG9ydCBjb25zdCBOR19URU1QX1RPS0VOX1BBVEggPSAnbmdUZW1wVG9rZW5QYXRoJztcbmNvbnN0IE5HX1RPS0VOX1BBVEggPSAnbmdUb2tlblBhdGgnO1xuY29uc3QgTkVXX0xJTkUgPSAvXFxuL2dtO1xuY29uc3QgTk9fTkVXX0xJTkUgPSAnybUnO1xuZXhwb3J0IGNvbnN0IFNPVVJDRSA9ICdfX3NvdXJjZSc7XG5cbmV4cG9ydCBjb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IGdldENsb3N1cmVTYWZlUHJvcGVydHl9KTtcblxuLyoqXG4gKiBDdXJyZW50IGluamVjdG9yIHZhbHVlIHVzZWQgYnkgYGluamVjdGAuXG4gKiAtIGB1bmRlZmluZWRgOiBpdCBpcyBhbiBlcnJvciB0byBjYWxsIGBpbmplY3RgXG4gKiAtIGBudWxsYDogYGluamVjdGAgY2FuIGJlIGNhbGxlZCBidXQgdGhlcmUgaXMgbm8gaW5qZWN0b3IgKGxpbXAtbW9kZSkuXG4gKiAtIEluamVjdG9yIGluc3RhbmNlOiBVc2UgdGhlIGluamVjdG9yIGZvciByZXNvbHV0aW9uLlxuICovXG5sZXQgX2N1cnJlbnRJbmplY3RvcjogSW5qZWN0b3J8dW5kZWZpbmVkfG51bGwgPSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50SW5qZWN0b3IoaW5qZWN0b3I6IEluamVjdG9yIHwgbnVsbCB8IHVuZGVmaW5lZCk6IEluamVjdG9yfHVuZGVmaW5lZHxudWxsIHtcbiAgY29uc3QgZm9ybWVyID0gX2N1cnJlbnRJbmplY3RvcjtcbiAgX2N1cnJlbnRJbmplY3RvciA9IGluamVjdG9yO1xuICByZXR1cm4gZm9ybWVyO1xufVxuXG4vKipcbiAqIEN1cnJlbnQgaW1wbGVtZW50YXRpb24gb2YgaW5qZWN0LlxuICpcbiAqIEJ5IGRlZmF1bHQsIGl0IGlzIGBpbmplY3RJbmplY3Rvck9ubHlgLCB3aGljaCBtYWtlcyBpdCBgSW5qZWN0b3JgLW9ubHkgYXdhcmUuIEl0IGNhbiBiZSBjaGFuZ2VkXG4gKiB0byBgZGlyZWN0aXZlSW5qZWN0YCwgd2hpY2ggYnJpbmdzIGluIHRoZSBgTm9kZUluamVjdG9yYCBzeXN0ZW0gb2YgaXZ5LiBJdCBpcyBkZXNpZ25lZCB0aGlzXG4gKiB3YXkgZm9yIHR3byByZWFzb25zOlxuICogIDEuIGBJbmplY3RvcmAgc2hvdWxkIG5vdCBkZXBlbmQgb24gaXZ5IGxvZ2ljLlxuICogIDIuIFRvIG1haW50YWluIHRyZWUgc2hha2UtYWJpbGl0eSB3ZSBkb24ndCB3YW50IHRvIGJyaW5nIGluIHVubmVjZXNzYXJ5IGNvZGUuXG4gKi9cbmxldCBfaW5qZWN0SW1wbGVtZW50YXRpb246XG4gICAgKDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpID0+IFQgfCBudWxsKXx1bmRlZmluZWQ7XG5cbi8qKlxuICogU2V0cyB0aGUgY3VycmVudCBpbmplY3QgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbihcbiAgICBpbXBsOiAoPFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M/OiBJbmplY3RGbGFncykgPT4gVCB8IG51bGwpIHwgdW5kZWZpbmVkKTpcbiAgICAoPFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M/OiBJbmplY3RGbGFncykgPT4gVCB8IG51bGwpfHVuZGVmaW5lZCB7XG4gIGNvbnN0IHByZXZpb3VzID0gX2luamVjdEltcGxlbWVudGF0aW9uO1xuICBfaW5qZWN0SW1wbGVtZW50YXRpb24gPSBpbXBsO1xuICByZXR1cm4gcHJldmlvdXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RJbmplY3Rvck9ubHk8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RJbmplY3Rvck9ubHk8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncz86IEluamVjdEZsYWdzKTogVHxcbiAgICBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEluamVjdG9yT25seTxUPihcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGlmIChfY3VycmVudEluamVjdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGluamVjdCgpIG11c3QgYmUgY2FsbGVkIGZyb20gYW4gaW5qZWN0aW9uIGNvbnRleHRgKTtcbiAgfSBlbHNlIGlmIChfY3VycmVudEluamVjdG9yID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGluamVjdFJvb3RMaW1wTW9kZSh0b2tlbiwgdW5kZWZpbmVkLCBmbGFncyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIF9jdXJyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVkIGluc3RydWN0aW9uOiBJbmplY3RzIGEgdG9rZW4gZnJvbSB0aGUgY3VycmVudGx5IGFjdGl2ZSBpbmplY3Rvci5cbiAqXG4gKiBNdXN0IGJlIHVzZWQgaW4gdGhlIGNvbnRleHQgb2YgYSBmYWN0b3J5IGZ1bmN0aW9uIHN1Y2ggYXMgb25lIGRlZmluZWQgZm9yIGFuXG4gKiBgSW5qZWN0aW9uVG9rZW5gLiBUaHJvd3MgYW4gZXJyb3IgaWYgbm90IGNhbGxlZCBmcm9tIHN1Y2ggYSBjb250ZXh0LlxuICpcbiAqIChBZGRpdGlvbmFsIGRvY3VtZW50YXRpb24gbW92ZWQgdG8gYGluamVjdGAsIGFzIGl0IGlzIHRoZSBwdWJsaWMgQVBJLCBhbmQgYW4gYWxpYXMgZm9yIHRoaXMgaW5zdHJ1Y3Rpb24pXG4gKlxuICogQHNlZSBpbmplY3RcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gybXJtWluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gybXJtWluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8XG4gICAgbnVsbCB7XG4gIHJldHVybiAoX2luamVjdEltcGxlbWVudGF0aW9uIHx8IGluamVjdEluamVjdG9yT25seSkodG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBJbmplY3RzIGEgdG9rZW4gZnJvbSB0aGUgY3VycmVudGx5IGFjdGl2ZSBpbmplY3Rvci5cbiAqXG4gKiBNdXN0IGJlIHVzZWQgaW4gdGhlIGNvbnRleHQgb2YgYSBmYWN0b3J5IGZ1bmN0aW9uIHN1Y2ggYXMgb25lIGRlZmluZWQgZm9yIGFuXG4gKiBgSW5qZWN0aW9uVG9rZW5gLiBUaHJvd3MgYW4gZXJyb3IgaWYgbm90IGNhbGxlZCBmcm9tIHN1Y2ggYSBjb250ZXh0LlxuICpcbiAqIFdpdGhpbiBzdWNoIGEgZmFjdG9yeSBmdW5jdGlvbiwgdXNpbmcgdGhpcyBmdW5jdGlvbiB0byByZXF1ZXN0IGluamVjdGlvbiBvZiBhIGRlcGVuZGVuY3lcbiAqIGlzIGZhc3RlciBhbmQgbW9yZSB0eXBlLXNhZmUgdGhhbiBwcm92aWRpbmcgYW4gYWRkaXRpb25hbCBhcnJheSBvZiBkZXBlbmRlbmNpZXNcbiAqIChhcyBoYXMgYmVlbiBjb21tb24gd2l0aCBgdXNlRmFjdG9yeWAgcHJvdmlkZXJzKS5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gVGhlIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIGRlcGVuZGVuY3kgdG8gYmUgaW5qZWN0ZWQuXG4gKiBAcGFyYW0gZmxhZ3MgT3B0aW9uYWwgZmxhZ3MgdGhhdCBjb250cm9sIGhvdyBpbmplY3Rpb24gaXMgZXhlY3V0ZWQuXG4gKiBUaGUgZmxhZ3MgY29ycmVzcG9uZCB0byBpbmplY3Rpb24gc3RyYXRlZ2llcyB0aGF0IGNhbiBiZSBzcGVjaWZpZWQgd2l0aFxuICogcGFyYW1ldGVyIGRlY29yYXRvcnMgYEBIb3N0YCwgYEBTZWxmYCwgYEBTa2lwU2VmYCwgYW5kIGBAT3B0aW9uYWxgLlxuICogQHJldHVybnMgVHJ1ZSBpZiBpbmplY3Rpb24gaXMgc3VjY2Vzc2Z1bCwgbnVsbCBvdGhlcndpc2UuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2luamVjdG9yX3NwZWMudHMgcmVnaW9uPSdTaGFrYWJsZUluamVjdGlvblRva2VuJ31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBpbmplY3QgPSDJtcm1aW5qZWN0O1xuXG4vKipcbiAqIEluamVjdHMgYHJvb3RgIHRva2VucyBpbiBsaW1wIG1vZGUuXG4gKlxuICogSWYgbm8gaW5qZWN0b3IgZXhpc3RzLCB3ZSBjYW4gc3RpbGwgaW5qZWN0IHRyZWUtc2hha2FibGUgcHJvdmlkZXJzIHdoaWNoIGhhdmUgYHByb3ZpZGVkSW5gIHNldCB0b1xuICogYFwicm9vdFwiYC4gVGhpcyBpcyBrbm93biBhcyB0aGUgbGltcCBtb2RlIGluamVjdGlvbi4gSW4gc3VjaCBjYXNlIHRoZSB2YWx1ZSBpcyBzdG9yZWQgaW4gdGhlXG4gKiBgSW5qZWN0YWJsZURlZmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSb290TGltcE1vZGU8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBUIHwgdW5kZWZpbmVkLCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUfG51bGwge1xuICBjb25zdCBpbmplY3RhYmxlRGVmOiDJtcm1SW5qZWN0YWJsZURlZjxUPnxudWxsID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbik7XG4gIGlmIChpbmplY3RhYmxlRGVmICYmIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PSAncm9vdCcpIHtcbiAgICByZXR1cm4gaW5qZWN0YWJsZURlZi52YWx1ZSA9PT0gdW5kZWZpbmVkID8gaW5qZWN0YWJsZURlZi52YWx1ZSA9IGluamVjdGFibGVEZWYuZmFjdG9yeSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5qZWN0YWJsZURlZi52YWx1ZTtcbiAgfVxuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkgcmV0dXJuIG51bGw7XG4gIGlmIChub3RGb3VuZFZhbHVlICE9PSB1bmRlZmluZWQpIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBcmdzKHR5cGVzOiAoVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBhbnlbXSlbXSk6IGFueVtdIHtcbiAgY29uc3QgYXJnczogYW55W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IHJlc29sdmVGb3J3YXJkUmVmKHR5cGVzW2ldKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG4gICAgICBpZiAoYXJnLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FyZ3VtZW50cyBhcnJheSBtdXN0IGhhdmUgYXJndW1lbnRzLicpO1xuICAgICAgfVxuICAgICAgbGV0IHR5cGU6IFR5cGU8YW55Pnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdDtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhcmcubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgbWV0YSA9IGFyZ1tqXTtcbiAgICAgICAgaWYgKG1ldGEgaW5zdGFuY2VvZiBPcHRpb25hbCB8fCBtZXRhLm5nTWV0YWRhdGFOYW1lID09PSAnT3B0aW9uYWwnIHx8IG1ldGEgPT09IE9wdGlvbmFsKSB7XG4gICAgICAgICAgZmxhZ3MgfD0gSW5qZWN0RmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBtZXRhIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NraXBTZWxmJyB8fCBtZXRhID09PSBTa2lwU2VsZikge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNraXBTZWxmO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGEgaW5zdGFuY2VvZiBTZWxmIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdTZWxmJyB8fCBtZXRhID09PSBTZWxmKSB7XG4gICAgICAgICAgZmxhZ3MgfD0gSW5qZWN0RmxhZ3MuU2VsZjtcbiAgICAgICAgfSBlbHNlIGlmIChtZXRhIGluc3RhbmNlb2YgSW5qZWN0IHx8IG1ldGEgPT09IEluamVjdCkge1xuICAgICAgICAgIHR5cGUgPSBtZXRhLnRva2VuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR5cGUgPSBtZXRhO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFyZ3MucHVzaCjJtcm1aW5qZWN0KHR5cGUgISwgZmxhZ3MpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXJncy5wdXNoKMm1ybVpbmplY3QoYXJnKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcmdzO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBOdWxsSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBUSFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIGlmIChub3RGb3VuZFZhbHVlID09PSBUSFJPV19JRl9OT1RfRk9VTkQpIHtcbiAgICAgIC8vIEludGVudGlvbmFsbHkgbGVmdCBiZWhpbmQ6IFdpdGggZGV2IHRvb2xzIG9wZW4gdGhlIGRlYnVnZ2VyIHdpbGwgc3RvcCBoZXJlLiBUaGVyZSBpcyBub1xuICAgICAgLy8gcmVhc29uIHdoeSBjb3JyZWN0bHkgd3JpdHRlbiBhcHBsaWNhdGlvbiBzaG91bGQgY2F1c2UgdGhpcyBleGNlcHRpb24uXG4gICAgICAvLyBUT0RPKG1pc2tvKTogdW5jb21tZW50IHRoZSBuZXh0IGxpbmUgb25jZSBgbmdEZXZNb2RlYCB3b3JrcyB3aXRoIGNsb3N1cmUuXG4gICAgICAvLyBpZihuZ0Rldk1vZGUpIGRlYnVnZ2VyO1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYE51bGxJbmplY3RvckVycm9yOiBObyBwcm92aWRlciBmb3IgJHtzdHJpbmdpZnkodG9rZW4pfSFgKTtcbiAgICAgIGVycm9yLm5hbWUgPSAnTnVsbEluamVjdG9yRXJyb3InO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNhdGNoSW5qZWN0b3JFcnJvcihcbiAgICBlOiBhbnksIHRva2VuOiBhbnksIGluamVjdG9yRXJyb3JOYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nIHwgbnVsbCk6IG5ldmVyIHtcbiAgY29uc3QgdG9rZW5QYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXTtcbiAgaWYgKHRva2VuW1NPVVJDRV0pIHtcbiAgICB0b2tlblBhdGgudW5zaGlmdCh0b2tlbltTT1VSQ0VdKTtcbiAgfVxuICBlLm1lc3NhZ2UgPSBmb3JtYXRFcnJvcignXFxuJyArIGUubWVzc2FnZSwgdG9rZW5QYXRoLCBpbmplY3RvckVycm9yTmFtZSwgc291cmNlKTtcbiAgZVtOR19UT0tFTl9QQVRIXSA9IHRva2VuUGF0aDtcbiAgZVtOR19URU1QX1RPS0VOX1BBVEhdID0gbnVsbDtcbiAgdGhyb3cgZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEVycm9yKFxuICAgIHRleHQ6IHN0cmluZywgb2JqOiBhbnksIGluamVjdG9yRXJyb3JOYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nIHwgbnVsbCA9IG51bGwpOiBzdHJpbmcge1xuICB0ZXh0ID0gdGV4dCAmJiB0ZXh0LmNoYXJBdCgwKSA9PT0gJ1xcbicgJiYgdGV4dC5jaGFyQXQoMSkgPT0gTk9fTkVXX0xJTkUgPyB0ZXh0LnN1YnN0cigyKSA6IHRleHQ7XG4gIGxldCBjb250ZXh0ID0gc3RyaW5naWZ5KG9iaik7XG4gIGlmIChvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGNvbnRleHQgPSBvYmoubWFwKHN0cmluZ2lmeSkuam9pbignIC0+ICcpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgbGV0IHBhcnRzID0gPHN0cmluZ1tdPltdO1xuICAgIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgcGFydHMucHVzaChcbiAgICAgICAgICAgIGtleSArICc6JyArICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogc3RyaW5naWZ5KHZhbHVlKSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb250ZXh0ID0gYHske3BhcnRzLmpvaW4oJywgJyl9fWA7XG4gIH1cbiAgcmV0dXJuIGAke2luamVjdG9yRXJyb3JOYW1lfSR7c291cmNlID8gJygnICsgc291cmNlICsgJyknIDogJyd9WyR7Y29udGV4dH1dOiAke3RleHQucmVwbGFjZShORVdfTElORSwgJ1xcbiAgJyl9YDtcbn1cbiJdfQ==