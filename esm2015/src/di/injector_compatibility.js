/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * \@publicApi
 * @type {?}
 */
export const INJECTOR = new InjectionToken('INJECTOR', (/** @type {?} */ (-1)));
/** @type {?} */
const _THROW_IF_NOT_FOUND = new Object();
/** @type {?} */
export const THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
/** @type {?} */
export const NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
/** @type {?} */
const NG_TOKEN_PATH = 'ngTokenPath';
/** @type {?} */
const NEW_LINE = /\n/gm;
/** @type {?} */
const NO_NEW_LINE = 'ɵ';
/** @type {?} */
export const SOURCE = '__source';
const ɵ0 = getClosureSafeProperty;
/** @type {?} */
export const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 });
/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
 * @type {?}
 */
let _currentInjector = undefined;
/**
 * @param {?} injector
 * @return {?}
 */
export function setCurrentInjector(injector) {
    /** @type {?} */
    const former = _currentInjector;
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
 * @type {?}
 */
let _injectImplementation;
/**
 * Sets the current inject implementation.
 * @param {?} impl
 * @return {?}
 */
export function setInjectImplementation(impl) {
    /** @type {?} */
    const previous = _injectImplementation;
    _injectImplementation = impl;
    return previous;
}
/**
 * @template T
 * @param {?} token
 * @param {?=} flags
 * @return {?}
 */
export function injectInjectorOnly(token, flags = InjectFlags.Default) {
    if (_currentInjector === undefined) {
        throw new Error(`inject() must be called from an injection context`);
    }
    else if (_currentInjector === null) {
        return injectRootLimpMode(token, undefined, flags);
    }
    else {
        return _currentInjector.get(token, flags & InjectFlags.Optional ? null : undefined, flags);
    }
}
/**
 * @template T
 * @param {?} token
 * @param {?=} flags
 * @return {?}
 */
export function ɵɵinject(token, flags = InjectFlags.Default) {
    return (_injectImplementation || injectInjectorOnly)(resolveForwardRef(token), flags);
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
 * \@param token The injection token for the dependency to be injected.
 * \@param flags Optional flags that control how injection is executed.
 * The flags correspond to injection strategies that can be specified with
 * parameter decorators `\@Host`, `\@Self`, `\@SkipSef`, and `\@Optional`.
 * \@return True if injection is successful, null otherwise.
 *
 * \@usageNotes
 *
 * ### Example
 *
 * {\@example core/di/ts/injector_spec.ts region='ShakableInjectionToken'}
 *
 * \@publicApi
 * @type {?}
 */
export const inject = ɵɵinject;
/**
 * Injects `root` tokens in limp mode.
 *
 * If no injector exists, we can still inject tree-shakable providers which have `providedIn` set to
 * `"root"`. This is known as the limp mode injection. In such case the value is stored in the
 * `InjectableDef`.
 * @template T
 * @param {?} token
 * @param {?} notFoundValue
 * @param {?} flags
 * @return {?}
 */
export function injectRootLimpMode(token, notFoundValue, flags) {
    /** @type {?} */
    const injectableDef = getInjectableDef(token);
    if (injectableDef && injectableDef.providedIn == 'root') {
        return injectableDef.value === undefined ? injectableDef.value = injectableDef.factory() :
            injectableDef.value;
    }
    if (flags & InjectFlags.Optional)
        return null;
    if (notFoundValue !== undefined)
        return notFoundValue;
    throw new Error(`Injector: NOT_FOUND [${stringify(token)}]`);
}
/**
 * @param {?} types
 * @return {?}
 */
export function injectArgs(types) {
    /** @type {?} */
    const args = [];
    for (let i = 0; i < types.length; i++) {
        /** @type {?} */
        const arg = resolveForwardRef(types[i]);
        if (Array.isArray(arg)) {
            if (arg.length === 0) {
                throw new Error('Arguments array must have arguments.');
            }
            /** @type {?} */
            let type = undefined;
            /** @type {?} */
            let flags = InjectFlags.Default;
            for (let j = 0; j < arg.length; j++) {
                /** @type {?} */
                const meta = arg[j];
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
            args.push(ɵɵinject((/** @type {?} */ (type)), flags));
        }
        else {
            args.push(ɵɵinject(arg));
        }
    }
    return args;
}
export class NullInjector {
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue = THROW_IF_NOT_FOUND) {
        if (notFoundValue === THROW_IF_NOT_FOUND) {
            // Intentionally left behind: With dev tools open the debugger will stop here. There is no
            // reason why correctly written application should cause this exception.
            // TODO(misko): uncomment the next line once `ngDevMode` works with closure.
            // if (ngDevMode) debugger;
            /** @type {?} */
            const error = new Error(`NullInjectorError: No provider for ${stringify(token)}!`);
            error.name = 'NullInjectorError';
            throw error;
        }
        return notFoundValue;
    }
}
/**
 * @param {?} e
 * @param {?} token
 * @param {?} injectorErrorName
 * @param {?} source
 * @return {?}
 */
export function catchInjectorError(e, token, injectorErrorName, source) {
    /** @type {?} */
    const tokenPath = e[NG_TEMP_TOKEN_PATH];
    if (token[SOURCE]) {
        tokenPath.unshift(token[SOURCE]);
    }
    e.message = formatError('\n' + e.message, tokenPath, injectorErrorName, source);
    e[NG_TOKEN_PATH] = tokenPath;
    e[NG_TEMP_TOKEN_PATH] = null;
    throw e;
}
/**
 * @param {?} text
 * @param {?} obj
 * @param {?} injectorErrorName
 * @param {?=} source
 * @return {?}
 */
export function formatError(text, obj, injectorErrorName, source = null) {
    text = text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE ? text.substr(2) : text;
    /** @type {?} */
    let context = stringify(obj);
    if (obj instanceof Array) {
        context = obj.map(stringify).join(' -> ');
    }
    else if (typeof obj === 'object') {
        /** @type {?} */
        let parts = (/** @type {?} */ ([]));
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                /** @type {?} */
                let value = obj[key];
                parts.push(key + ':' + (typeof value === 'string' ? JSON.stringify(value) : stringify(value)));
            }
        }
        context = `{${parts.join(', ')}}`;
    }
    return `${injectorErrorName}${source ? '(' + source + ')' : ''}[${context}]: ${text.replace(NEW_LINE, '\n  ')}`;
}
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQWtCLE1BQU0sa0JBQWtCLENBQUM7QUFDbkUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRWpELE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7Ozs7Ozs7Ozs7QUFZNUQsTUFBTSxPQUFPLFFBQVEsR0FBRyxJQUFJLGNBQWMsQ0FDdEMsVUFBVSxFQUNWLG1CQUFBLENBQUMsQ0FBQyxFQUFPLENBQ1I7O01BRUMsbUJBQW1CLEdBQUcsSUFBSSxNQUFNLEVBQUU7O0FBQ3hDLE1BQU0sT0FBTyxrQkFBa0IsR0FBRyxtQkFBbUI7O0FBRXJELE1BQU0sT0FBTyxrQkFBa0IsR0FBRyxpQkFBaUI7O01BQzdDLGFBQWEsR0FBRyxhQUFhOztNQUM3QixRQUFRLEdBQUcsTUFBTTs7TUFDakIsV0FBVyxHQUFHLEdBQUc7O0FBQ3ZCLE1BQU0sT0FBTyxNQUFNLEdBQUcsVUFBVTtXQUdzQyxzQkFBc0I7O0FBRDVGLE1BQU0sT0FBTyxTQUFTLEdBQ2xCLHNCQUFzQixDQUFnQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxJQUF3QixFQUFDLENB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QUcsWUFBWSxLQUFLLEVBQUU7UUFDeEIsT0FBTyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzNDO1NBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7O1lBQzlCLEtBQUssR0FBRyxtQkFBVSxFQUFFLEVBQUE7UUFDeEIsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUU7WUFDbkIsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFOztvQkFDdkIsS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQyxJQUFJLENBQ04sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN6RjtTQUNGO1FBQ0QsT0FBTyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ25DO0lBQ0QsT0FBTyxHQUFHLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNsSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCDJtcm1SW5qZWN0YWJsZURlZn0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge1ZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuXG5cblxuLyoqXG4gKiBBbiBJbmplY3Rpb25Ub2tlbiB0aGF0IGdldHMgdGhlIGN1cnJlbnQgYEluamVjdG9yYCBmb3IgYGNyZWF0ZUluamVjdG9yKClgLXN0eWxlIGluamVjdG9ycy5cbiAqXG4gKiBSZXF1ZXN0aW5nIHRoaXMgdG9rZW4gaW5zdGVhZCBvZiBgSW5qZWN0b3JgIGFsbG93cyBgU3RhdGljSW5qZWN0b3JgIHRvIGJlIHRyZWUtc2hha2VuIGZyb20gYVxuICogcHJvamVjdC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxJbmplY3Rvcj4oXG4gICAgJ0lOSkVDVE9SJyxcbiAgICAtMSBhcyBhbnkgIC8vIGAtMWAgaXMgdXNlZCBieSBJdnkgREkgc3lzdGVtIGFzIHNwZWNpYWwgdmFsdWUgdG8gcmVjb2duaXplIGl0IGFzIGBJbmplY3RvcmAuXG4gICAgKTtcblxuY29uc3QgX1RIUk9XX0lGX05PVF9GT1VORCA9IG5ldyBPYmplY3QoKTtcbmV4cG9ydCBjb25zdCBUSFJPV19JRl9OT1RfRk9VTkQgPSBfVEhST1dfSUZfTk9UX0ZPVU5EO1xuXG5leHBvcnQgY29uc3QgTkdfVEVNUF9UT0tFTl9QQVRIID0gJ25nVGVtcFRva2VuUGF0aCc7XG5jb25zdCBOR19UT0tFTl9QQVRIID0gJ25nVG9rZW5QYXRoJztcbmNvbnN0IE5FV19MSU5FID0gL1xcbi9nbTtcbmNvbnN0IE5PX05FV19MSU5FID0gJ8m1JztcbmV4cG9ydCBjb25zdCBTT1VSQ0UgPSAnX19zb3VyY2UnO1xuXG5leHBvcnQgY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5cbi8qKlxuICogQ3VycmVudCBpbmplY3RvciB2YWx1ZSB1c2VkIGJ5IGBpbmplY3RgLlxuICogLSBgdW5kZWZpbmVkYDogaXQgaXMgYW4gZXJyb3IgdG8gY2FsbCBgaW5qZWN0YFxuICogLSBgbnVsbGA6IGBpbmplY3RgIGNhbiBiZSBjYWxsZWQgYnV0IHRoZXJlIGlzIG5vIGluamVjdG9yIChsaW1wLW1vZGUpLlxuICogLSBJbmplY3RvciBpbnN0YW5jZTogVXNlIHRoZSBpbmplY3RvciBmb3IgcmVzb2x1dGlvbi5cbiAqL1xubGV0IF9jdXJyZW50SW5qZWN0b3I6IEluamVjdG9yfHVuZGVmaW5lZHxudWxsID0gdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudEluamVjdG9yKGluamVjdG9yOiBJbmplY3RvciB8IG51bGwgfCB1bmRlZmluZWQpOiBJbmplY3Rvcnx1bmRlZmluZWR8bnVsbCB7XG4gIGNvbnN0IGZvcm1lciA9IF9jdXJyZW50SW5qZWN0b3I7XG4gIF9jdXJyZW50SW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgcmV0dXJuIGZvcm1lcjtcbn1cblxuLyoqXG4gKiBDdXJyZW50IGltcGxlbWVudGF0aW9uIG9mIGluamVjdC5cbiAqXG4gKiBCeSBkZWZhdWx0LCBpdCBpcyBgaW5qZWN0SW5qZWN0b3JPbmx5YCwgd2hpY2ggbWFrZXMgaXQgYEluamVjdG9yYC1vbmx5IGF3YXJlLiBJdCBjYW4gYmUgY2hhbmdlZFxuICogdG8gYGRpcmVjdGl2ZUluamVjdGAsIHdoaWNoIGJyaW5ncyBpbiB0aGUgYE5vZGVJbmplY3RvcmAgc3lzdGVtIG9mIGl2eS4gSXQgaXMgZGVzaWduZWQgdGhpc1xuICogd2F5IGZvciB0d28gcmVhc29uczpcbiAqICAxLiBgSW5qZWN0b3JgIHNob3VsZCBub3QgZGVwZW5kIG9uIGl2eSBsb2dpYy5cbiAqICAyLiBUbyBtYWludGFpbiB0cmVlIHNoYWtlLWFiaWxpdHkgd2UgZG9uJ3Qgd2FudCB0byBicmluZyBpbiB1bm5lY2Vzc2FyeSBjb2RlLlxuICovXG5sZXQgX2luamVjdEltcGxlbWVudGF0aW9uOlxuICAgICg8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncz86IEluamVjdEZsYWdzKSA9PiBUIHwgbnVsbCl8dW5kZWZpbmVkO1xuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgaW5qZWN0IGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24oXG4gICAgaW1wbDogKDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpID0+IFQgfCBudWxsKSB8IHVuZGVmaW5lZCk6XG4gICAgKDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpID0+IFQgfCBudWxsKXx1bmRlZmluZWQge1xuICBjb25zdCBwcmV2aW91cyA9IF9pbmplY3RJbXBsZW1lbnRhdGlvbjtcbiAgX2luamVjdEltcGxlbWVudGF0aW9uID0gaW1wbDtcbiAgcmV0dXJuIHByZXZpb3VzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3JPbmx5PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3JPbmx5PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFR8XG4gICAgbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RJbmplY3Rvck9ubHk8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBpZiAoX2N1cnJlbnRJbmplY3RvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbmplY3QoKSBtdXN0IGJlIGNhbGxlZCBmcm9tIGFuIGluamVjdGlvbiBjb250ZXh0YCk7XG4gIH0gZWxzZSBpZiAoX2N1cnJlbnRJbmplY3RvciA9PT0gbnVsbCkge1xuICAgIHJldHVybiBpbmplY3RSb290TGltcE1vZGUodG9rZW4sIHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBfY3VycmVudEluamVjdG9yLmdldCh0b2tlbiwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCA/IG51bGwgOiB1bmRlZmluZWQsIGZsYWdzKTtcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlZCBpbnN0cnVjdGlvbjogSW5qZWN0cyBhIHRva2VuIGZyb20gdGhlIGN1cnJlbnRseSBhY3RpdmUgaW5qZWN0b3IuXG4gKlxuICogTXVzdCBiZSB1c2VkIGluIHRoZSBjb250ZXh0IG9mIGEgZmFjdG9yeSBmdW5jdGlvbiBzdWNoIGFzIG9uZSBkZWZpbmVkIGZvciBhblxuICogYEluamVjdGlvblRva2VuYC4gVGhyb3dzIGFuIGVycm9yIGlmIG5vdCBjYWxsZWQgZnJvbSBzdWNoIGEgY29udGV4dC5cbiAqXG4gKiAoQWRkaXRpb25hbCBkb2N1bWVudGF0aW9uIG1vdmVkIHRvIGBpbmplY3RgLCBhcyBpdCBpcyB0aGUgcHVibGljIEFQSSwgYW5kIGFuIGFsaWFzIGZvciB0aGlzIGluc3RydWN0aW9uKVxuICpcbiAqIEBzZWUgaW5qZWN0XG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncz86IEluamVjdEZsYWdzKTogVHxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfFxuICAgIG51bGwge1xuICByZXR1cm4gKF9pbmplY3RJbXBsZW1lbnRhdGlvbiB8fCBpbmplY3RJbmplY3Rvck9ubHkpKHJlc29sdmVGb3J3YXJkUmVmKHRva2VuKSwgZmxhZ3MpO1xufVxuXG4vKipcbiAqIEluamVjdHMgYSB0b2tlbiBmcm9tIHRoZSBjdXJyZW50bHkgYWN0aXZlIGluamVjdG9yLlxuICpcbiAqIE11c3QgYmUgdXNlZCBpbiB0aGUgY29udGV4dCBvZiBhIGZhY3RvcnkgZnVuY3Rpb24gc3VjaCBhcyBvbmUgZGVmaW5lZCBmb3IgYW5cbiAqIGBJbmplY3Rpb25Ub2tlbmAuIFRocm93cyBhbiBlcnJvciBpZiBub3QgY2FsbGVkIGZyb20gc3VjaCBhIGNvbnRleHQuXG4gKlxuICogV2l0aGluIHN1Y2ggYSBmYWN0b3J5IGZ1bmN0aW9uLCB1c2luZyB0aGlzIGZ1bmN0aW9uIHRvIHJlcXVlc3QgaW5qZWN0aW9uIG9mIGEgZGVwZW5kZW5jeVxuICogaXMgZmFzdGVyIGFuZCBtb3JlIHR5cGUtc2FmZSB0aGFuIHByb3ZpZGluZyBhbiBhZGRpdGlvbmFsIGFycmF5IG9mIGRlcGVuZGVuY2llc1xuICogKGFzIGhhcyBiZWVuIGNvbW1vbiB3aXRoIGB1c2VGYWN0b3J5YCBwcm92aWRlcnMpLlxuICpcbiAqIEBwYXJhbSB0b2tlbiBUaGUgaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgZGVwZW5kZW5jeSB0byBiZSBpbmplY3RlZC5cbiAqIEBwYXJhbSBmbGFncyBPcHRpb25hbCBmbGFncyB0aGF0IGNvbnRyb2wgaG93IGluamVjdGlvbiBpcyBleGVjdXRlZC5cbiAqIFRoZSBmbGFncyBjb3JyZXNwb25kIHRvIGluamVjdGlvbiBzdHJhdGVnaWVzIHRoYXQgY2FuIGJlIHNwZWNpZmllZCB3aXRoXG4gKiBwYXJhbWV0ZXIgZGVjb3JhdG9ycyBgQEhvc3RgLCBgQFNlbGZgLCBgQFNraXBTZWZgLCBhbmQgYEBPcHRpb25hbGAuXG4gKiBAcmV0dXJucyBUcnVlIGlmIGluamVjdGlvbiBpcyBzdWNjZXNzZnVsLCBudWxsIG90aGVyd2lzZS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J1NoYWthYmxlSW5qZWN0aW9uVG9rZW4nfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IMm1ybVpbmplY3Q7XG5cbi8qKlxuICogSW5qZWN0cyBgcm9vdGAgdG9rZW5zIGluIGxpbXAgbW9kZS5cbiAqXG4gKiBJZiBubyBpbmplY3RvciBleGlzdHMsIHdlIGNhbiBzdGlsbCBpbmplY3QgdHJlZS1zaGFrYWJsZSBwcm92aWRlcnMgd2hpY2ggaGF2ZSBgcHJvdmlkZWRJbmAgc2V0IHRvXG4gKiBgXCJyb290XCJgLiBUaGlzIGlzIGtub3duIGFzIHRoZSBsaW1wIG1vZGUgaW5qZWN0aW9uLiBJbiBzdWNoIGNhc2UgdGhlIHZhbHVlIGlzIHN0b3JlZCBpbiB0aGVcbiAqIGBJbmplY3RhYmxlRGVmYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFJvb3RMaW1wTW9kZTxUPihcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IFQgfCB1bmRlZmluZWQsIGZsYWdzOiBJbmplY3RGbGFncyk6IFR8bnVsbCB7XG4gIGNvbnN0IGluamVjdGFibGVEZWY6IMm1ybVJbmplY3RhYmxlRGVmPFQ+fG51bGwgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKTtcbiAgaWYgKGluamVjdGFibGVEZWYgJiYgaW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09ICdyb290Jykge1xuICAgIHJldHVybiBpbmplY3RhYmxlRGVmLnZhbHVlID09PSB1bmRlZmluZWQgPyBpbmplY3RhYmxlRGVmLnZhbHVlID0gaW5qZWN0YWJsZURlZi5mYWN0b3J5KCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RhYmxlRGVmLnZhbHVlO1xuICB9XG4gIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSByZXR1cm4gbnVsbDtcbiAgaWYgKG5vdEZvdW5kVmFsdWUgIT09IHVuZGVmaW5lZCkgcmV0dXJuIG5vdEZvdW5kVmFsdWU7XG4gIHRocm93IG5ldyBFcnJvcihgSW5qZWN0b3I6IE5PVF9GT1VORCBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEFyZ3ModHlwZXM6IChUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT58IGFueVtdKVtdKTogYW55W10ge1xuICBjb25zdCBhcmdzOiBhbnlbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXJnID0gcmVzb2x2ZUZvcndhcmRSZWYodHlwZXNbaV0pO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgIGlmIChhcmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXJndW1lbnRzIGFycmF5IG11c3QgaGF2ZSBhcmd1bWVudHMuJyk7XG4gICAgICB9XG4gICAgICBsZXQgdHlwZTogVHlwZTxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFyZy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBtZXRhID0gYXJnW2pdO1xuICAgICAgICBpZiAobWV0YSBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdPcHRpb25hbCcgfHwgbWV0YSA9PT0gT3B0aW9uYWwpIHtcbiAgICAgICAgICBmbGFncyB8PSBJbmplY3RGbGFncy5PcHRpb25hbDtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIG1ldGEgaW5zdGFuY2VvZiBTa2lwU2VsZiB8fCBtZXRhLm5nTWV0YWRhdGFOYW1lID09PSAnU2tpcFNlbGYnIHx8IG1ldGEgPT09IFNraXBTZWxmKSB7XG4gICAgICAgICAgZmxhZ3MgfD0gSW5qZWN0RmxhZ3MuU2tpcFNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIFNlbGYgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NlbGYnIHx8IG1ldGEgPT09IFNlbGYpIHtcbiAgICAgICAgICBmbGFncyB8PSBJbmplY3RGbGFncy5TZWxmO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGEgaW5zdGFuY2VvZiBJbmplY3QgfHwgbWV0YSA9PT0gSW5qZWN0KSB7XG4gICAgICAgICAgdHlwZSA9IG1ldGEudG9rZW47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHlwZSA9IG1ldGE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXJncy5wdXNoKMm1ybVpbmplY3QodHlwZSAhLCBmbGFncykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzLnB1c2goybXJtWluamVjdChhcmcpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFyZ3M7XG59XG5cblxuZXhwb3J0IGNsYXNzIE51bGxJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IFRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgaWYgKG5vdEZvdW5kVmFsdWUgPT09IFRIUk9XX0lGX05PVF9GT1VORCkge1xuICAgICAgLy8gSW50ZW50aW9uYWxseSBsZWZ0IGJlaGluZDogV2l0aCBkZXYgdG9vbHMgb3BlbiB0aGUgZGVidWdnZXIgd2lsbCBzdG9wIGhlcmUuIFRoZXJlIGlzIG5vXG4gICAgICAvLyByZWFzb24gd2h5IGNvcnJlY3RseSB3cml0dGVuIGFwcGxpY2F0aW9uIHNob3VsZCBjYXVzZSB0aGlzIGV4Y2VwdGlvbi5cbiAgICAgIC8vIFRPRE8obWlza28pOiB1bmNvbW1lbnQgdGhlIG5leHQgbGluZSBvbmNlIGBuZ0Rldk1vZGVgIHdvcmtzIHdpdGggY2xvc3VyZS5cbiAgICAgIC8vIGlmIChuZ0Rldk1vZGUpIGRlYnVnZ2VyO1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYE51bGxJbmplY3RvckVycm9yOiBObyBwcm92aWRlciBmb3IgJHtzdHJpbmdpZnkodG9rZW4pfSFgKTtcbiAgICAgIGVycm9yLm5hbWUgPSAnTnVsbEluamVjdG9yRXJyb3InO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNhdGNoSW5qZWN0b3JFcnJvcihcbiAgICBlOiBhbnksIHRva2VuOiBhbnksIGluamVjdG9yRXJyb3JOYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nIHwgbnVsbCk6IG5ldmVyIHtcbiAgY29uc3QgdG9rZW5QYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXTtcbiAgaWYgKHRva2VuW1NPVVJDRV0pIHtcbiAgICB0b2tlblBhdGgudW5zaGlmdCh0b2tlbltTT1VSQ0VdKTtcbiAgfVxuICBlLm1lc3NhZ2UgPSBmb3JtYXRFcnJvcignXFxuJyArIGUubWVzc2FnZSwgdG9rZW5QYXRoLCBpbmplY3RvckVycm9yTmFtZSwgc291cmNlKTtcbiAgZVtOR19UT0tFTl9QQVRIXSA9IHRva2VuUGF0aDtcbiAgZVtOR19URU1QX1RPS0VOX1BBVEhdID0gbnVsbDtcbiAgdGhyb3cgZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEVycm9yKFxuICAgIHRleHQ6IHN0cmluZywgb2JqOiBhbnksIGluamVjdG9yRXJyb3JOYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nIHwgbnVsbCA9IG51bGwpOiBzdHJpbmcge1xuICB0ZXh0ID0gdGV4dCAmJiB0ZXh0LmNoYXJBdCgwKSA9PT0gJ1xcbicgJiYgdGV4dC5jaGFyQXQoMSkgPT0gTk9fTkVXX0xJTkUgPyB0ZXh0LnN1YnN0cigyKSA6IHRleHQ7XG4gIGxldCBjb250ZXh0ID0gc3RyaW5naWZ5KG9iaik7XG4gIGlmIChvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGNvbnRleHQgPSBvYmoubWFwKHN0cmluZ2lmeSkuam9pbignIC0+ICcpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgbGV0IHBhcnRzID0gPHN0cmluZ1tdPltdO1xuICAgIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgcGFydHMucHVzaChcbiAgICAgICAgICAgIGtleSArICc6JyArICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogc3RyaW5naWZ5KHZhbHVlKSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb250ZXh0ID0gYHske3BhcnRzLmpvaW4oJywgJyl9fWA7XG4gIH1cbiAgcmV0dXJuIGAke2luamVjdG9yRXJyb3JOYW1lfSR7c291cmNlID8gJygnICsgc291cmNlICsgJyknIDogJyd9WyR7Y29udGV4dH1dOiAke3RleHQucmVwbGFjZShORVdfTElORSwgJ1xcbiAgJyl9YDtcbn1cbiJdfQ==