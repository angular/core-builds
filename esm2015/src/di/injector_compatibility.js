/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/di/injector_compatibility.ts
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
const _THROW_IF_NOT_FOUND = {};
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
    if (Array.isArray(obj)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFakQsT0FBTyxFQUFDLGdCQUFnQixFQUFrQixNQUFNLGtCQUFrQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7Ozs7Ozs7O0FBWTVELE1BQU0sT0FBTyxRQUFRLEdBQUcsSUFBSSxjQUFjLENBQ3RDLFVBQVUsRUFDVixtQkFBQSxDQUFDLENBQUMsRUFBTyxDQUNSOztNQUVDLG1CQUFtQixHQUFHLEVBQUU7O0FBQzlCLE1BQU0sT0FBTyxrQkFBa0IsR0FBRyxtQkFBbUI7O0FBRXJELE1BQU0sT0FBTyxrQkFBa0IsR0FBRyxpQkFBaUI7O01BQzdDLGFBQWEsR0FBRyxhQUFhOztNQUM3QixRQUFRLEdBQUcsTUFBTTs7TUFDakIsV0FBVyxHQUFHLEdBQUc7O0FBQ3ZCLE1BQU0sT0FBTyxNQUFNLEdBQUcsVUFBVTtXQUdzQyxzQkFBc0I7O0FBRDVGLE1BQU0sT0FBTyxTQUFTLEdBQ2xCLHNCQUFzQixDQUFnQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxJQUF3QixFQUFDLENBQUM7Ozs7Ozs7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QUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDdEIsT0FBTyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzNDO1NBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7O1lBQzlCLEtBQUssR0FBRyxtQkFBVSxFQUFFLEVBQUE7UUFDeEIsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUU7WUFDbkIsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFOztvQkFDdkIsS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7Z0JBQ3BCLEtBQUssQ0FBQyxJQUFJLENBQ04sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN6RjtTQUNGO1FBQ0QsT0FBTyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ25DO0lBQ0QsT0FBTyxHQUFHLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxPQUFPLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNsSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCDJtcm1SW5qZWN0YWJsZURlZn0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge1ZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuXG5cblxuLyoqXG4gKiBBbiBJbmplY3Rpb25Ub2tlbiB0aGF0IGdldHMgdGhlIGN1cnJlbnQgYEluamVjdG9yYCBmb3IgYGNyZWF0ZUluamVjdG9yKClgLXN0eWxlIGluamVjdG9ycy5cbiAqXG4gKiBSZXF1ZXN0aW5nIHRoaXMgdG9rZW4gaW5zdGVhZCBvZiBgSW5qZWN0b3JgIGFsbG93cyBgU3RhdGljSW5qZWN0b3JgIHRvIGJlIHRyZWUtc2hha2VuIGZyb20gYVxuICogcHJvamVjdC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxJbmplY3Rvcj4oXG4gICAgJ0lOSkVDVE9SJyxcbiAgICAtMSBhcyBhbnkgIC8vIGAtMWAgaXMgdXNlZCBieSBJdnkgREkgc3lzdGVtIGFzIHNwZWNpYWwgdmFsdWUgdG8gcmVjb2duaXplIGl0IGFzIGBJbmplY3RvcmAuXG4gICAgKTtcblxuY29uc3QgX1RIUk9XX0lGX05PVF9GT1VORCA9IHt9O1xuZXhwb3J0IGNvbnN0IFRIUk9XX0lGX05PVF9GT1VORCA9IF9USFJPV19JRl9OT1RfRk9VTkQ7XG5cbmV4cG9ydCBjb25zdCBOR19URU1QX1RPS0VOX1BBVEggPSAnbmdUZW1wVG9rZW5QYXRoJztcbmNvbnN0IE5HX1RPS0VOX1BBVEggPSAnbmdUb2tlblBhdGgnO1xuY29uc3QgTkVXX0xJTkUgPSAvXFxuL2dtO1xuY29uc3QgTk9fTkVXX0xJTkUgPSAnybUnO1xuZXhwb3J0IGNvbnN0IFNPVVJDRSA9ICdfX3NvdXJjZSc7XG5cbmV4cG9ydCBjb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IGdldENsb3N1cmVTYWZlUHJvcGVydHl9KTtcblxuLyoqXG4gKiBDdXJyZW50IGluamVjdG9yIHZhbHVlIHVzZWQgYnkgYGluamVjdGAuXG4gKiAtIGB1bmRlZmluZWRgOiBpdCBpcyBhbiBlcnJvciB0byBjYWxsIGBpbmplY3RgXG4gKiAtIGBudWxsYDogYGluamVjdGAgY2FuIGJlIGNhbGxlZCBidXQgdGhlcmUgaXMgbm8gaW5qZWN0b3IgKGxpbXAtbW9kZSkuXG4gKiAtIEluamVjdG9yIGluc3RhbmNlOiBVc2UgdGhlIGluamVjdG9yIGZvciByZXNvbHV0aW9uLlxuICovXG5sZXQgX2N1cnJlbnRJbmplY3RvcjogSW5qZWN0b3J8dW5kZWZpbmVkfG51bGwgPSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50SW5qZWN0b3IoaW5qZWN0b3I6IEluamVjdG9yIHwgbnVsbCB8IHVuZGVmaW5lZCk6IEluamVjdG9yfHVuZGVmaW5lZHxudWxsIHtcbiAgY29uc3QgZm9ybWVyID0gX2N1cnJlbnRJbmplY3RvcjtcbiAgX2N1cnJlbnRJbmplY3RvciA9IGluamVjdG9yO1xuICByZXR1cm4gZm9ybWVyO1xufVxuXG4vKipcbiAqIEN1cnJlbnQgaW1wbGVtZW50YXRpb24gb2YgaW5qZWN0LlxuICpcbiAqIEJ5IGRlZmF1bHQsIGl0IGlzIGBpbmplY3RJbmplY3Rvck9ubHlgLCB3aGljaCBtYWtlcyBpdCBgSW5qZWN0b3JgLW9ubHkgYXdhcmUuIEl0IGNhbiBiZSBjaGFuZ2VkXG4gKiB0byBgZGlyZWN0aXZlSW5qZWN0YCwgd2hpY2ggYnJpbmdzIGluIHRoZSBgTm9kZUluamVjdG9yYCBzeXN0ZW0gb2YgaXZ5LiBJdCBpcyBkZXNpZ25lZCB0aGlzXG4gKiB3YXkgZm9yIHR3byByZWFzb25zOlxuICogIDEuIGBJbmplY3RvcmAgc2hvdWxkIG5vdCBkZXBlbmQgb24gaXZ5IGxvZ2ljLlxuICogIDIuIFRvIG1haW50YWluIHRyZWUgc2hha2UtYWJpbGl0eSB3ZSBkb24ndCB3YW50IHRvIGJyaW5nIGluIHVubmVjZXNzYXJ5IGNvZGUuXG4gKi9cbmxldCBfaW5qZWN0SW1wbGVtZW50YXRpb246XG4gICAgKDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpID0+IFQgfCBudWxsKXx1bmRlZmluZWQ7XG5cbi8qKlxuICogU2V0cyB0aGUgY3VycmVudCBpbmplY3QgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbihcbiAgICBpbXBsOiAoPFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M/OiBJbmplY3RGbGFncykgPT4gVCB8IG51bGwpIHwgdW5kZWZpbmVkKTpcbiAgICAoPFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M/OiBJbmplY3RGbGFncykgPT4gVCB8IG51bGwpfHVuZGVmaW5lZCB7XG4gIGNvbnN0IHByZXZpb3VzID0gX2luamVjdEltcGxlbWVudGF0aW9uO1xuICBfaW5qZWN0SW1wbGVtZW50YXRpb24gPSBpbXBsO1xuICByZXR1cm4gcHJldmlvdXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RJbmplY3Rvck9ubHk8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RJbmplY3Rvck9ubHk8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncz86IEluamVjdEZsYWdzKTogVHxcbiAgICBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEluamVjdG9yT25seTxUPihcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGlmIChfY3VycmVudEluamVjdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGluamVjdCgpIG11c3QgYmUgY2FsbGVkIGZyb20gYW4gaW5qZWN0aW9uIGNvbnRleHRgKTtcbiAgfSBlbHNlIGlmIChfY3VycmVudEluamVjdG9yID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGluamVjdFJvb3RMaW1wTW9kZSh0b2tlbiwgdW5kZWZpbmVkLCBmbGFncyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIF9jdXJyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVkIGluc3RydWN0aW9uOiBJbmplY3RzIGEgdG9rZW4gZnJvbSB0aGUgY3VycmVudGx5IGFjdGl2ZSBpbmplY3Rvci5cbiAqXG4gKiBNdXN0IGJlIHVzZWQgaW4gdGhlIGNvbnRleHQgb2YgYSBmYWN0b3J5IGZ1bmN0aW9uIHN1Y2ggYXMgb25lIGRlZmluZWQgZm9yIGFuXG4gKiBgSW5qZWN0aW9uVG9rZW5gLiBUaHJvd3MgYW4gZXJyb3IgaWYgbm90IGNhbGxlZCBmcm9tIHN1Y2ggYSBjb250ZXh0LlxuICpcbiAqIChBZGRpdGlvbmFsIGRvY3VtZW50YXRpb24gbW92ZWQgdG8gYGluamVjdGAsIGFzIGl0IGlzIHRoZSBwdWJsaWMgQVBJLCBhbmQgYW4gYWxpYXMgZm9yIHRoaXMgaW5zdHJ1Y3Rpb24pXG4gKlxuICogQHNlZSBpbmplY3RcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gybXJtWluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gybXJtWluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8XG4gICAgbnVsbCB7XG4gIHJldHVybiAoX2luamVjdEltcGxlbWVudGF0aW9uIHx8IGluamVjdEluamVjdG9yT25seSkocmVzb2x2ZUZvcndhcmRSZWYodG9rZW4pLCBmbGFncyk7XG59XG5cbi8qKlxuICogSW5qZWN0cyBhIHRva2VuIGZyb20gdGhlIGN1cnJlbnRseSBhY3RpdmUgaW5qZWN0b3IuXG4gKlxuICogTXVzdCBiZSB1c2VkIGluIHRoZSBjb250ZXh0IG9mIGEgZmFjdG9yeSBmdW5jdGlvbiBzdWNoIGFzIG9uZSBkZWZpbmVkIGZvciBhblxuICogYEluamVjdGlvblRva2VuYC4gVGhyb3dzIGFuIGVycm9yIGlmIG5vdCBjYWxsZWQgZnJvbSBzdWNoIGEgY29udGV4dC5cbiAqXG4gKiBXaXRoaW4gc3VjaCBhIGZhY3RvcnkgZnVuY3Rpb24sIHVzaW5nIHRoaXMgZnVuY3Rpb24gdG8gcmVxdWVzdCBpbmplY3Rpb24gb2YgYSBkZXBlbmRlbmN5XG4gKiBpcyBmYXN0ZXIgYW5kIG1vcmUgdHlwZS1zYWZlIHRoYW4gcHJvdmlkaW5nIGFuIGFkZGl0aW9uYWwgYXJyYXkgb2YgZGVwZW5kZW5jaWVzXG4gKiAoYXMgaGFzIGJlZW4gY29tbW9uIHdpdGggYHVzZUZhY3RvcnlgIHByb3ZpZGVycykuXG4gKlxuICogQHBhcmFtIHRva2VuIFRoZSBpbmplY3Rpb24gdG9rZW4gZm9yIHRoZSBkZXBlbmRlbmN5IHRvIGJlIGluamVjdGVkLlxuICogQHBhcmFtIGZsYWdzIE9wdGlvbmFsIGZsYWdzIHRoYXQgY29udHJvbCBob3cgaW5qZWN0aW9uIGlzIGV4ZWN1dGVkLlxuICogVGhlIGZsYWdzIGNvcnJlc3BvbmQgdG8gaW5qZWN0aW9uIHN0cmF0ZWdpZXMgdGhhdCBjYW4gYmUgc3BlY2lmaWVkIHdpdGhcbiAqIHBhcmFtZXRlciBkZWNvcmF0b3JzIGBASG9zdGAsIGBAU2VsZmAsIGBAU2tpcFNlZmAsIGFuZCBgQE9wdGlvbmFsYC5cbiAqIEByZXR1cm5zIFRydWUgaWYgaW5qZWN0aW9uIGlzIHN1Y2Nlc3NmdWwsIG51bGwgb3RoZXJ3aXNlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nU2hha2FibGVJbmplY3Rpb25Ub2tlbid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgaW5qZWN0ID0gybXJtWluamVjdDtcblxuLyoqXG4gKiBJbmplY3RzIGByb290YCB0b2tlbnMgaW4gbGltcCBtb2RlLlxuICpcbiAqIElmIG5vIGluamVjdG9yIGV4aXN0cywgd2UgY2FuIHN0aWxsIGluamVjdCB0cmVlLXNoYWthYmxlIHByb3ZpZGVycyB3aGljaCBoYXZlIGBwcm92aWRlZEluYCBzZXQgdG9cbiAqIGBcInJvb3RcImAuIFRoaXMgaXMga25vd24gYXMgdGhlIGxpbXAgbW9kZSBpbmplY3Rpb24uIEluIHN1Y2ggY2FzZSB0aGUgdmFsdWUgaXMgc3RvcmVkIGluIHRoZVxuICogYEluamVjdGFibGVEZWZgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Um9vdExpbXBNb2RlPFQ+KFxuICAgIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogVCB8IHVuZGVmaW5lZCwgZmxhZ3M6IEluamVjdEZsYWdzKTogVHxudWxsIHtcbiAgY29uc3QgaW5qZWN0YWJsZURlZjogybXJtUluamVjdGFibGVEZWY8VD58bnVsbCA9IGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICBpZiAoaW5qZWN0YWJsZURlZiAmJiBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT0gJ3Jvb3QnKSB7XG4gICAgcmV0dXJuIGluamVjdGFibGVEZWYudmFsdWUgPT09IHVuZGVmaW5lZCA/IGluamVjdGFibGVEZWYudmFsdWUgPSBpbmplY3RhYmxlRGVmLmZhY3RvcnkoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGFibGVEZWYudmFsdWU7XG4gIH1cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICBpZiAobm90Rm91bmRWYWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgdGhyb3cgbmV3IEVycm9yKGBJbmplY3RvcjogTk9UX0ZPVU5EIFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXJncyh0eXBlczogKFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55PnwgYW55W10pW10pOiBhbnlbXSB7XG4gIGNvbnN0IGFyZ3M6IGFueVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlc1tpXSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgaWYgKGFyZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcmd1bWVudHMgYXJyYXkgbXVzdCBoYXZlIGFyZ3VtZW50cy4nKTtcbiAgICAgIH1cbiAgICAgIGxldCB0eXBlOiBUeXBlPGFueT58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQ7XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXJnLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBhcmdbal07XG4gICAgICAgIGlmIChtZXRhIGluc3RhbmNlb2YgT3B0aW9uYWwgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ09wdGlvbmFsJyB8fCBtZXRhID09PSBPcHRpb25hbCkge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLk9wdGlvbmFsO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgbWV0YSBpbnN0YW5jZW9mIFNraXBTZWxmIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdTa2lwU2VsZicgfHwgbWV0YSA9PT0gU2tpcFNlbGYpIHtcbiAgICAgICAgICBmbGFncyB8PSBJbmplY3RGbGFncy5Ta2lwU2VsZjtcbiAgICAgICAgfSBlbHNlIGlmIChtZXRhIGluc3RhbmNlb2YgU2VsZiB8fCBtZXRhLm5nTWV0YWRhdGFOYW1lID09PSAnU2VsZicgfHwgbWV0YSA9PT0gU2VsZikge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIEluamVjdCB8fCBtZXRhID09PSBJbmplY3QpIHtcbiAgICAgICAgICB0eXBlID0gbWV0YS50b2tlbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0eXBlID0gbWV0YTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhcmdzLnB1c2goybXJtWluamVjdCh0eXBlICEsIGZsYWdzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFyZ3MucHVzaCjJtcm1aW5qZWN0KGFyZykpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJncztcbn1cblxuXG5leHBvcnQgY2xhc3MgTnVsbEluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICBpZiAobm90Rm91bmRWYWx1ZSA9PT0gVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgICAvLyBJbnRlbnRpb25hbGx5IGxlZnQgYmVoaW5kOiBXaXRoIGRldiB0b29scyBvcGVuIHRoZSBkZWJ1Z2dlciB3aWxsIHN0b3AgaGVyZS4gVGhlcmUgaXMgbm9cbiAgICAgIC8vIHJlYXNvbiB3aHkgY29ycmVjdGx5IHdyaXR0ZW4gYXBwbGljYXRpb24gc2hvdWxkIGNhdXNlIHRoaXMgZXhjZXB0aW9uLlxuICAgICAgLy8gVE9ETyhtaXNrbyk6IHVuY29tbWVudCB0aGUgbmV4dCBsaW5lIG9uY2UgYG5nRGV2TW9kZWAgd29ya3Mgd2l0aCBjbG9zdXJlLlxuICAgICAgLy8gaWYgKG5nRGV2TW9kZSkgZGVidWdnZXI7XG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgTnVsbEluamVjdG9yRXJyb3I6IE5vIHByb3ZpZGVyIGZvciAke3N0cmluZ2lmeSh0b2tlbil9IWApO1xuICAgICAgZXJyb3IubmFtZSA9ICdOdWxsSW5qZWN0b3JFcnJvcic7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgcmV0dXJuIG5vdEZvdW5kVmFsdWU7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY2F0Y2hJbmplY3RvckVycm9yKFxuICAgIGU6IGFueSwgdG9rZW46IGFueSwgaW5qZWN0b3JFcnJvck5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcgfCBudWxsKTogbmV2ZXIge1xuICBjb25zdCB0b2tlblBhdGg6IGFueVtdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdO1xuICBpZiAodG9rZW5bU09VUkNFXSkge1xuICAgIHRva2VuUGF0aC51bnNoaWZ0KHRva2VuW1NPVVJDRV0pO1xuICB9XG4gIGUubWVzc2FnZSA9IGZvcm1hdEVycm9yKCdcXG4nICsgZS5tZXNzYWdlLCB0b2tlblBhdGgsIGluamVjdG9yRXJyb3JOYW1lLCBzb3VyY2UpO1xuICBlW05HX1RPS0VOX1BBVEhdID0gdG9rZW5QYXRoO1xuICBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBudWxsO1xuICB0aHJvdyBlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0RXJyb3IoXG4gICAgdGV4dDogc3RyaW5nLCBvYmo6IGFueSwgaW5qZWN0b3JFcnJvck5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IHN0cmluZyB7XG4gIHRleHQgPSB0ZXh0ICYmIHRleHQuY2hhckF0KDApID09PSAnXFxuJyAmJiB0ZXh0LmNoYXJBdCgxKSA9PSBOT19ORVdfTElORSA/IHRleHQuc3Vic3RyKDIpIDogdGV4dDtcbiAgbGV0IGNvbnRleHQgPSBzdHJpbmdpZnkob2JqKTtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgIGNvbnRleHQgPSBvYmoubWFwKHN0cmluZ2lmeSkuam9pbignIC0+ICcpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgbGV0IHBhcnRzID0gPHN0cmluZ1tdPltdO1xuICAgIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgcGFydHMucHVzaChcbiAgICAgICAgICAgIGtleSArICc6JyArICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogc3RyaW5naWZ5KHZhbHVlKSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb250ZXh0ID0gYHske3BhcnRzLmpvaW4oJywgJyl9fWA7XG4gIH1cbiAgcmV0dXJuIGAke2luamVjdG9yRXJyb3JOYW1lfSR7c291cmNlID8gJygnICsgc291cmNlICsgJyknIDogJyd9WyR7Y29udGV4dH1dOiAke3RleHQucmVwbGFjZShORVdfTElORSwgJ1xcbiAgJyl9YDtcbn1cbiJdfQ==