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
/** @type {?} */
export const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
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
            // if(ngDevMode) debugger;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQWtCLE1BQU0sa0JBQWtCLENBQUM7QUFDbkUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRWpELE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7Ozs7Ozs7Ozs7QUFZNUQsTUFBTSxPQUFPLFFBQVEsR0FBRyxJQUFJLGNBQWMsQ0FDdEMsVUFBVSxFQUNWLG1CQUFBLENBQUMsQ0FBQyxFQUFPLENBQ1I7O01BRUMsbUJBQW1CLEdBQUcsSUFBSSxNQUFNLEVBQUU7O0FBQ3hDLE1BQU0sT0FBTyxrQkFBa0IsR0FBRyxtQkFBbUI7O0FBRXJELE1BQU0sT0FBTyxrQkFBa0IsR0FBRyxpQkFBaUI7O01BQzdDLGFBQWEsR0FBRyxhQUFhOztNQUM3QixRQUFRLEdBQUcsTUFBTTs7TUFDakIsV0FBVyxHQUFHLEdBQUc7O0FBQ3ZCLE1BQU0sT0FBTyxNQUFNLEdBQUcsVUFBVTs7QUFFaEMsTUFBTSxPQUFPLFNBQVMsR0FDbEIsc0JBQXNCLENBQWdCLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsc0JBQXNCLEVBQUMsQ0FBQzs7Ozs7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T0FBTyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzNDO1NBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7O1lBQzlCLEtBQUssR0FBRyxtQkFBVSxFQUFFLEVBQUE7UUFDeEIsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUU7WUFDbkIsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFOztvQkFDdkIsS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQyxJQUFJLENBQ04sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN6RjtTQUNGO1FBQ0QsT0FBTyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ25DO0lBQ0QsT0FBTyxHQUFHLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNsSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCDJtcm1SW5qZWN0YWJsZURlZn0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge1ZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuXG5cblxuLyoqXG4gKiBBbiBJbmplY3Rpb25Ub2tlbiB0aGF0IGdldHMgdGhlIGN1cnJlbnQgYEluamVjdG9yYCBmb3IgYGNyZWF0ZUluamVjdG9yKClgLXN0eWxlIGluamVjdG9ycy5cbiAqXG4gKiBSZXF1ZXN0aW5nIHRoaXMgdG9rZW4gaW5zdGVhZCBvZiBgSW5qZWN0b3JgIGFsbG93cyBgU3RhdGljSW5qZWN0b3JgIHRvIGJlIHRyZWUtc2hha2VuIGZyb20gYVxuICogcHJvamVjdC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxJbmplY3Rvcj4oXG4gICAgJ0lOSkVDVE9SJyxcbiAgICAtMSBhcyBhbnkgIC8vIGAtMWAgaXMgdXNlZCBieSBJdnkgREkgc3lzdGVtIGFzIHNwZWNpYWwgdmFsdWUgdG8gcmVjb2duaXplIGl0IGFzIGBJbmplY3RvcmAuXG4gICAgKTtcblxuY29uc3QgX1RIUk9XX0lGX05PVF9GT1VORCA9IG5ldyBPYmplY3QoKTtcbmV4cG9ydCBjb25zdCBUSFJPV19JRl9OT1RfRk9VTkQgPSBfVEhST1dfSUZfTk9UX0ZPVU5EO1xuXG5leHBvcnQgY29uc3QgTkdfVEVNUF9UT0tFTl9QQVRIID0gJ25nVGVtcFRva2VuUGF0aCc7XG5jb25zdCBOR19UT0tFTl9QQVRIID0gJ25nVG9rZW5QYXRoJztcbmNvbnN0IE5FV19MSU5FID0gL1xcbi9nbTtcbmNvbnN0IE5PX05FV19MSU5FID0gJ8m1JztcbmV4cG9ydCBjb25zdCBTT1VSQ0UgPSAnX19zb3VyY2UnO1xuXG5leHBvcnQgY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5cbi8qKlxuICogQ3VycmVudCBpbmplY3RvciB2YWx1ZSB1c2VkIGJ5IGBpbmplY3RgLlxuICogLSBgdW5kZWZpbmVkYDogaXQgaXMgYW4gZXJyb3IgdG8gY2FsbCBgaW5qZWN0YFxuICogLSBgbnVsbGA6IGBpbmplY3RgIGNhbiBiZSBjYWxsZWQgYnV0IHRoZXJlIGlzIG5vIGluamVjdG9yIChsaW1wLW1vZGUpLlxuICogLSBJbmplY3RvciBpbnN0YW5jZTogVXNlIHRoZSBpbmplY3RvciBmb3IgcmVzb2x1dGlvbi5cbiAqL1xubGV0IF9jdXJyZW50SW5qZWN0b3I6IEluamVjdG9yfHVuZGVmaW5lZHxudWxsID0gdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudEluamVjdG9yKGluamVjdG9yOiBJbmplY3RvciB8IG51bGwgfCB1bmRlZmluZWQpOiBJbmplY3Rvcnx1bmRlZmluZWR8bnVsbCB7XG4gIGNvbnN0IGZvcm1lciA9IF9jdXJyZW50SW5qZWN0b3I7XG4gIF9jdXJyZW50SW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgcmV0dXJuIGZvcm1lcjtcbn1cblxuLyoqXG4gKiBDdXJyZW50IGltcGxlbWVudGF0aW9uIG9mIGluamVjdC5cbiAqXG4gKiBCeSBkZWZhdWx0LCBpdCBpcyBgaW5qZWN0SW5qZWN0b3JPbmx5YCwgd2hpY2ggbWFrZXMgaXQgYEluamVjdG9yYC1vbmx5IGF3YXJlLiBJdCBjYW4gYmUgY2hhbmdlZFxuICogdG8gYGRpcmVjdGl2ZUluamVjdGAsIHdoaWNoIGJyaW5ncyBpbiB0aGUgYE5vZGVJbmplY3RvcmAgc3lzdGVtIG9mIGl2eS4gSXQgaXMgZGVzaWduZWQgdGhpc1xuICogd2F5IGZvciB0d28gcmVhc29uczpcbiAqICAxLiBgSW5qZWN0b3JgIHNob3VsZCBub3QgZGVwZW5kIG9uIGl2eSBsb2dpYy5cbiAqICAyLiBUbyBtYWludGFpbiB0cmVlIHNoYWtlLWFiaWxpdHkgd2UgZG9uJ3Qgd2FudCB0byBicmluZyBpbiB1bm5lY2Vzc2FyeSBjb2RlLlxuICovXG5sZXQgX2luamVjdEltcGxlbWVudGF0aW9uOlxuICAgICg8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncz86IEluamVjdEZsYWdzKSA9PiBUIHwgbnVsbCl8dW5kZWZpbmVkO1xuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgaW5qZWN0IGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24oXG4gICAgaW1wbDogKDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpID0+IFQgfCBudWxsKSB8IHVuZGVmaW5lZCk6XG4gICAgKDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpID0+IFQgfCBudWxsKXx1bmRlZmluZWQge1xuICBjb25zdCBwcmV2aW91cyA9IF9pbmplY3RJbXBsZW1lbnRhdGlvbjtcbiAgX2luamVjdEltcGxlbWVudGF0aW9uID0gaW1wbDtcbiAgcmV0dXJuIHByZXZpb3VzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3JPbmx5PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3JPbmx5PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFR8XG4gICAgbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RJbmplY3Rvck9ubHk8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBpZiAoX2N1cnJlbnRJbmplY3RvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbmplY3QoKSBtdXN0IGJlIGNhbGxlZCBmcm9tIGFuIGluamVjdGlvbiBjb250ZXh0YCk7XG4gIH0gZWxzZSBpZiAoX2N1cnJlbnRJbmplY3RvciA9PT0gbnVsbCkge1xuICAgIHJldHVybiBpbmplY3RSb290TGltcE1vZGUodG9rZW4sIHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBfY3VycmVudEluamVjdG9yLmdldCh0b2tlbiwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCA/IG51bGwgOiB1bmRlZmluZWQsIGZsYWdzKTtcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlZCBpbnN0cnVjdGlvbjogSW5qZWN0cyBhIHRva2VuIGZyb20gdGhlIGN1cnJlbnRseSBhY3RpdmUgaW5qZWN0b3IuXG4gKlxuICogTXVzdCBiZSB1c2VkIGluIHRoZSBjb250ZXh0IG9mIGEgZmFjdG9yeSBmdW5jdGlvbiBzdWNoIGFzIG9uZSBkZWZpbmVkIGZvciBhblxuICogYEluamVjdGlvblRva2VuYC4gVGhyb3dzIGFuIGVycm9yIGlmIG5vdCBjYWxsZWQgZnJvbSBzdWNoIGEgY29udGV4dC5cbiAqXG4gKiAoQWRkaXRpb25hbCBkb2N1bWVudGF0aW9uIG1vdmVkIHRvIGBpbmplY3RgLCBhcyBpdCBpcyB0aGUgcHVibGljIEFQSSwgYW5kIGFuIGFsaWFzIGZvciB0aGlzIGluc3RydWN0aW9uKVxuICpcbiAqIEBzZWUgaW5qZWN0XG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncz86IEluamVjdEZsYWdzKTogVHxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfFxuICAgIG51bGwge1xuICByZXR1cm4gKF9pbmplY3RJbXBsZW1lbnRhdGlvbiB8fCBpbmplY3RJbmplY3Rvck9ubHkpKHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogSW5qZWN0cyBhIHRva2VuIGZyb20gdGhlIGN1cnJlbnRseSBhY3RpdmUgaW5qZWN0b3IuXG4gKlxuICogTXVzdCBiZSB1c2VkIGluIHRoZSBjb250ZXh0IG9mIGEgZmFjdG9yeSBmdW5jdGlvbiBzdWNoIGFzIG9uZSBkZWZpbmVkIGZvciBhblxuICogYEluamVjdGlvblRva2VuYC4gVGhyb3dzIGFuIGVycm9yIGlmIG5vdCBjYWxsZWQgZnJvbSBzdWNoIGEgY29udGV4dC5cbiAqXG4gKiBXaXRoaW4gc3VjaCBhIGZhY3RvcnkgZnVuY3Rpb24sIHVzaW5nIHRoaXMgZnVuY3Rpb24gdG8gcmVxdWVzdCBpbmplY3Rpb24gb2YgYSBkZXBlbmRlbmN5XG4gKiBpcyBmYXN0ZXIgYW5kIG1vcmUgdHlwZS1zYWZlIHRoYW4gcHJvdmlkaW5nIGFuIGFkZGl0aW9uYWwgYXJyYXkgb2YgZGVwZW5kZW5jaWVzXG4gKiAoYXMgaGFzIGJlZW4gY29tbW9uIHdpdGggYHVzZUZhY3RvcnlgIHByb3ZpZGVycykuXG4gKlxuICogQHBhcmFtIHRva2VuIFRoZSBpbmplY3Rpb24gdG9rZW4gZm9yIHRoZSBkZXBlbmRlbmN5IHRvIGJlIGluamVjdGVkLlxuICogQHBhcmFtIGZsYWdzIE9wdGlvbmFsIGZsYWdzIHRoYXQgY29udHJvbCBob3cgaW5qZWN0aW9uIGlzIGV4ZWN1dGVkLlxuICogVGhlIGZsYWdzIGNvcnJlc3BvbmQgdG8gaW5qZWN0aW9uIHN0cmF0ZWdpZXMgdGhhdCBjYW4gYmUgc3BlY2lmaWVkIHdpdGhcbiAqIHBhcmFtZXRlciBkZWNvcmF0b3JzIGBASG9zdGAsIGBAU2VsZmAsIGBAU2tpcFNlZmAsIGFuZCBgQE9wdGlvbmFsYC5cbiAqIEByZXR1cm5zIFRydWUgaWYgaW5qZWN0aW9uIGlzIHN1Y2Nlc3NmdWwsIG51bGwgb3RoZXJ3aXNlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nU2hha2FibGVJbmplY3Rpb25Ub2tlbid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgaW5qZWN0ID0gybXJtWluamVjdDtcblxuLyoqXG4gKiBJbmplY3RzIGByb290YCB0b2tlbnMgaW4gbGltcCBtb2RlLlxuICpcbiAqIElmIG5vIGluamVjdG9yIGV4aXN0cywgd2UgY2FuIHN0aWxsIGluamVjdCB0cmVlLXNoYWthYmxlIHByb3ZpZGVycyB3aGljaCBoYXZlIGBwcm92aWRlZEluYCBzZXQgdG9cbiAqIGBcInJvb3RcImAuIFRoaXMgaXMga25vd24gYXMgdGhlIGxpbXAgbW9kZSBpbmplY3Rpb24uIEluIHN1Y2ggY2FzZSB0aGUgdmFsdWUgaXMgc3RvcmVkIGluIHRoZVxuICogYEluamVjdGFibGVEZWZgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Um9vdExpbXBNb2RlPFQ+KFxuICAgIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogVCB8IHVuZGVmaW5lZCwgZmxhZ3M6IEluamVjdEZsYWdzKTogVHxudWxsIHtcbiAgY29uc3QgaW5qZWN0YWJsZURlZjogybXJtUluamVjdGFibGVEZWY8VD58bnVsbCA9IGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICBpZiAoaW5qZWN0YWJsZURlZiAmJiBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT0gJ3Jvb3QnKSB7XG4gICAgcmV0dXJuIGluamVjdGFibGVEZWYudmFsdWUgPT09IHVuZGVmaW5lZCA/IGluamVjdGFibGVEZWYudmFsdWUgPSBpbmplY3RhYmxlRGVmLmZhY3RvcnkoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGFibGVEZWYudmFsdWU7XG4gIH1cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICBpZiAobm90Rm91bmRWYWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgdGhyb3cgbmV3IEVycm9yKGBJbmplY3RvcjogTk9UX0ZPVU5EIFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXJncyh0eXBlczogKFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55PnwgYW55W10pW10pOiBhbnlbXSB7XG4gIGNvbnN0IGFyZ3M6IGFueVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlc1tpXSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgaWYgKGFyZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcmd1bWVudHMgYXJyYXkgbXVzdCBoYXZlIGFyZ3VtZW50cy4nKTtcbiAgICAgIH1cbiAgICAgIGxldCB0eXBlOiBUeXBlPGFueT58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQ7XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXJnLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBhcmdbal07XG4gICAgICAgIGlmIChtZXRhIGluc3RhbmNlb2YgT3B0aW9uYWwgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ09wdGlvbmFsJyB8fCBtZXRhID09PSBPcHRpb25hbCkge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLk9wdGlvbmFsO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgbWV0YSBpbnN0YW5jZW9mIFNraXBTZWxmIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdTa2lwU2VsZicgfHwgbWV0YSA9PT0gU2tpcFNlbGYpIHtcbiAgICAgICAgICBmbGFncyB8PSBJbmplY3RGbGFncy5Ta2lwU2VsZjtcbiAgICAgICAgfSBlbHNlIGlmIChtZXRhIGluc3RhbmNlb2YgU2VsZiB8fCBtZXRhLm5nTWV0YWRhdGFOYW1lID09PSAnU2VsZicgfHwgbWV0YSA9PT0gU2VsZikge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIEluamVjdCB8fCBtZXRhID09PSBJbmplY3QpIHtcbiAgICAgICAgICB0eXBlID0gbWV0YS50b2tlbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0eXBlID0gbWV0YTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhcmdzLnB1c2goybXJtWluamVjdCh0eXBlICEsIGZsYWdzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFyZ3MucHVzaCjJtcm1aW5qZWN0KGFyZykpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJncztcbn1cblxuXG5leHBvcnQgY2xhc3MgTnVsbEluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICBpZiAobm90Rm91bmRWYWx1ZSA9PT0gVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgICAvLyBJbnRlbnRpb25hbGx5IGxlZnQgYmVoaW5kOiBXaXRoIGRldiB0b29scyBvcGVuIHRoZSBkZWJ1Z2dlciB3aWxsIHN0b3AgaGVyZS4gVGhlcmUgaXMgbm9cbiAgICAgIC8vIHJlYXNvbiB3aHkgY29ycmVjdGx5IHdyaXR0ZW4gYXBwbGljYXRpb24gc2hvdWxkIGNhdXNlIHRoaXMgZXhjZXB0aW9uLlxuICAgICAgLy8gVE9ETyhtaXNrbyk6IHVuY29tbWVudCB0aGUgbmV4dCBsaW5lIG9uY2UgYG5nRGV2TW9kZWAgd29ya3Mgd2l0aCBjbG9zdXJlLlxuICAgICAgLy8gaWYobmdEZXZNb2RlKSBkZWJ1Z2dlcjtcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBOdWxsSW5qZWN0b3JFcnJvcjogTm8gcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX0hYCk7XG4gICAgICBlcnJvci5uYW1lID0gJ051bGxJbmplY3RvckVycm9yJztcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjYXRjaEluamVjdG9yRXJyb3IoXG4gICAgZTogYW55LCB0b2tlbjogYW55LCBpbmplY3RvckVycm9yTmFtZTogc3RyaW5nLCBzb3VyY2U6IHN0cmluZyB8IG51bGwpOiBuZXZlciB7XG4gIGNvbnN0IHRva2VuUGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF07XG4gIGlmICh0b2tlbltTT1VSQ0VdKSB7XG4gICAgdG9rZW5QYXRoLnVuc2hpZnQodG9rZW5bU09VUkNFXSk7XG4gIH1cbiAgZS5tZXNzYWdlID0gZm9ybWF0RXJyb3IoJ1xcbicgKyBlLm1lc3NhZ2UsIHRva2VuUGF0aCwgaW5qZWN0b3JFcnJvck5hbWUsIHNvdXJjZSk7XG4gIGVbTkdfVE9LRU5fUEFUSF0gPSB0b2tlblBhdGg7XG4gIGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IG51bGw7XG4gIHRocm93IGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRFcnJvcihcbiAgICB0ZXh0OiBzdHJpbmcsIG9iajogYW55LCBpbmplY3RvckVycm9yTmFtZTogc3RyaW5nLCBzb3VyY2U6IHN0cmluZyB8IG51bGwgPSBudWxsKTogc3RyaW5nIHtcbiAgdGV4dCA9IHRleHQgJiYgdGV4dC5jaGFyQXQoMCkgPT09ICdcXG4nICYmIHRleHQuY2hhckF0KDEpID09IE5PX05FV19MSU5FID8gdGV4dC5zdWJzdHIoMikgOiB0ZXh0O1xuICBsZXQgY29udGV4dCA9IHN0cmluZ2lmeShvYmopO1xuICBpZiAob2JqIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBjb250ZXh0ID0gb2JqLm1hcChzdHJpbmdpZnkpLmpvaW4oJyAtPiAnKTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgIGxldCBwYXJ0cyA9IDxzdHJpbmdbXT5bXTtcbiAgICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gb2JqW2tleV07XG4gICAgICAgIHBhcnRzLnB1c2goXG4gICAgICAgICAgICBrZXkgKyAnOicgKyAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6IHN0cmluZ2lmeSh2YWx1ZSkpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29udGV4dCA9IGB7JHtwYXJ0cy5qb2luKCcsICcpfX1gO1xuICB9XG4gIHJldHVybiBgJHtpbmplY3RvckVycm9yTmFtZX0ke3NvdXJjZSA/ICcoJyArIHNvdXJjZSArICcpJyA6ICcnfVske2NvbnRleHR9XTogJHt0ZXh0LnJlcGxhY2UoTkVXX0xJTkUsICdcXG4gICcpfWA7XG59XG4iXX0=