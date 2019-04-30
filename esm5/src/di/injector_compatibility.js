/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { getInjectableDef } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { Inject, Optional, Self, SkipSelf } from './metadata';
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
                if (meta instanceof Optional || meta.ngMetadataName === 'Optional') {
                    flags |= InjectFlags.Optional;
                }
                else if (meta instanceof SkipSelf || meta.ngMetadataName === 'SkipSelf') {
                    flags |= InjectFlags.SkipSelf;
                }
                else if (meta instanceof Self || meta.ngMetadataName === 'Self') {
                    flags |= InjectFlags.Self;
                }
                else if (meta instanceof Inject) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3JfY29tcGF0aWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUdoRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQWtCLE1BQU0sa0JBQWtCLENBQUM7QUFDbkUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFJNUQ7Ozs7O0dBS0c7QUFDSCxJQUFJLGdCQUFnQixHQUE0QixTQUFTLENBQUM7QUFFMUQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLFFBQXFDO0lBQ3RFLElBQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDO0lBQ2hDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQztJQUM1QixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxJQUFJLHFCQUNTLENBQUM7QUFFZDs7R0FFRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsSUFBMkY7SUFFN0YsSUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUM7SUFDdkMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO0lBQzdCLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFLRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLEtBQWlDLEVBQUUsS0FBMkI7SUFBM0Isc0JBQUEsRUFBQSxRQUFRLFdBQVcsQ0FBQyxPQUFPO0lBQ2hFLElBQUksZ0JBQWdCLEtBQUssU0FBUyxF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LElBQUksQ0FBQyxjQUFjLEtBQUssTUFBTSxFQUFFO29CQUNqRSxLQUFLLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQztpQkFDM0I7cUJBQU0sSUFBSSxJQUFJLFlBQVksTUFBTSxFQUFFO29CQUNqQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztpQkFDbkI7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLElBQUksQ0FBQztpQkFDYjthQUNGO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDcEM7YUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDMUI7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCDJtcm1SW5qZWN0YWJsZURlZn0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge0luamVjdCwgT3B0aW9uYWwsIFNlbGYsIFNraXBTZWxmfSBmcm9tICcuL21ldGFkYXRhJztcblxuXG5cbi8qKlxuICogQ3VycmVudCBpbmplY3RvciB2YWx1ZSB1c2VkIGJ5IGBpbmplY3RgLlxuICogLSBgdW5kZWZpbmVkYDogaXQgaXMgYW4gZXJyb3IgdG8gY2FsbCBgaW5qZWN0YFxuICogLSBgbnVsbGA6IGBpbmplY3RgIGNhbiBiZSBjYWxsZWQgYnV0IHRoZXJlIGlzIG5vIGluamVjdG9yIChsaW1wLW1vZGUpLlxuICogLSBJbmplY3RvciBpbnN0YW5jZTogVXNlIHRoZSBpbmplY3RvciBmb3IgcmVzb2x1dGlvbi5cbiAqL1xubGV0IF9jdXJyZW50SW5qZWN0b3I6IEluamVjdG9yfHVuZGVmaW5lZHxudWxsID0gdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudEluamVjdG9yKGluamVjdG9yOiBJbmplY3RvciB8IG51bGwgfCB1bmRlZmluZWQpOiBJbmplY3Rvcnx1bmRlZmluZWR8bnVsbCB7XG4gIGNvbnN0IGZvcm1lciA9IF9jdXJyZW50SW5qZWN0b3I7XG4gIF9jdXJyZW50SW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgcmV0dXJuIGZvcm1lcjtcbn1cblxuLyoqXG4gKiBDdXJyZW50IGltcGxlbWVudGF0aW9uIG9mIGluamVjdC5cbiAqXG4gKiBCeSBkZWZhdWx0LCBpdCBpcyBgaW5qZWN0SW5qZWN0b3JPbmx5YCwgd2hpY2ggbWFrZXMgaXQgYEluamVjdG9yYC1vbmx5IGF3YXJlLiBJdCBjYW4gYmUgY2hhbmdlZFxuICogdG8gYGRpcmVjdGl2ZUluamVjdGAsIHdoaWNoIGJyaW5ncyBpbiB0aGUgYE5vZGVJbmplY3RvcmAgc3lzdGVtIG9mIGl2eS4gSXQgaXMgZGVzaWduZWQgdGhpc1xuICogd2F5IGZvciB0d28gcmVhc29uczpcbiAqICAxLiBgSW5qZWN0b3JgIHNob3VsZCBub3QgZGVwZW5kIG9uIGl2eSBsb2dpYy5cbiAqICAyLiBUbyBtYWludGFpbiB0cmVlIHNoYWtlLWFiaWxpdHkgd2UgZG9uJ3Qgd2FudCB0byBicmluZyBpbiB1bm5lY2Vzc2FyeSBjb2RlLlxuICovXG5sZXQgX2luamVjdEltcGxlbWVudGF0aW9uOiAoPFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKSA9PiBUIHwgbnVsbCl8XG4gICAgdW5kZWZpbmVkO1xuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgaW5qZWN0IGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24oXG4gICAgaW1wbDogKDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpID0+IFQgfCBudWxsKSB8IHVuZGVmaW5lZCk6XG4gICAgKDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpID0+IFQgfCBudWxsKXx1bmRlZmluZWQge1xuICBjb25zdCBwcmV2aW91cyA9IF9pbmplY3RJbXBsZW1lbnRhdGlvbjtcbiAgX2luamVjdEltcGxlbWVudGF0aW9uID0gaW1wbDtcbiAgcmV0dXJuIHByZXZpb3VzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3JPbmx5PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3JPbmx5PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFR8XG4gICAgbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RJbmplY3Rvck9ubHk8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBpZiAoX2N1cnJlbnRJbmplY3RvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbmplY3QoKSBtdXN0IGJlIGNhbGxlZCBmcm9tIGFuIGluamVjdGlvbiBjb250ZXh0YCk7XG4gIH0gZWxzZSBpZiAoX2N1cnJlbnRJbmplY3RvciA9PT0gbnVsbCkge1xuICAgIHJldHVybiBpbmplY3RSb290TGltcE1vZGUodG9rZW4sIHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBfY3VycmVudEluamVjdG9yLmdldCh0b2tlbiwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCA/IG51bGwgOiB1bmRlZmluZWQsIGZsYWdzKTtcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlZCBpbnN0cnVjdGlvbjogSW5qZWN0cyBhIHRva2VuIGZyb20gdGhlIGN1cnJlbnRseSBhY3RpdmUgaW5qZWN0b3IuXG4gKlxuICogTXVzdCBiZSB1c2VkIGluIHRoZSBjb250ZXh0IG9mIGEgZmFjdG9yeSBmdW5jdGlvbiBzdWNoIGFzIG9uZSBkZWZpbmVkIGZvciBhblxuICogYEluamVjdGlvblRva2VuYC4gVGhyb3dzIGFuIGVycm9yIGlmIG5vdCBjYWxsZWQgZnJvbSBzdWNoIGEgY29udGV4dC5cbiAqXG4gKiAoQWRkaXRpb25hbCBkb2N1bWVudGF0aW9uIG1vdmVkIHRvIGBpbmplY3RgLCBhcyBpdCBpcyB0aGUgcHVibGljIEFQSSwgYW5kIGFuIGFsaWFzIGZvciB0aGlzIGluc3RydWN0aW9uKVxuICpcbiAqIEBzZWUgaW5qZWN0XG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncz86IEluamVjdEZsYWdzKTogVHxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfFxuICAgIG51bGwge1xuICByZXR1cm4gKF9pbmplY3RJbXBsZW1lbnRhdGlvbiB8fCBpbmplY3RJbmplY3Rvck9ubHkpKHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogSW5qZWN0cyBhIHRva2VuIGZyb20gdGhlIGN1cnJlbnRseSBhY3RpdmUgaW5qZWN0b3IuXG4gKlxuICogTXVzdCBiZSB1c2VkIGluIHRoZSBjb250ZXh0IG9mIGEgZmFjdG9yeSBmdW5jdGlvbiBzdWNoIGFzIG9uZSBkZWZpbmVkIGZvciBhblxuICogYEluamVjdGlvblRva2VuYC4gVGhyb3dzIGFuIGVycm9yIGlmIG5vdCBjYWxsZWQgZnJvbSBzdWNoIGEgY29udGV4dC5cbiAqXG4gKiBXaXRoaW4gc3VjaCBhIGZhY3RvcnkgZnVuY3Rpb24sIHVzaW5nIHRoaXMgZnVuY3Rpb24gdG8gcmVxdWVzdCBpbmplY3Rpb24gb2YgYSBkZXBlbmRlbmN5XG4gKiBpcyBmYXN0ZXIgYW5kIG1vcmUgdHlwZS1zYWZlIHRoYW4gcHJvdmlkaW5nIGFuIGFkZGl0aW9uYWwgYXJyYXkgb2YgZGVwZW5kZW5jaWVzXG4gKiAoYXMgaGFzIGJlZW4gY29tbW9uIHdpdGggYHVzZUZhY3RvcnlgIHByb3ZpZGVycykuXG4gKlxuICogQHBhcmFtIHRva2VuIFRoZSBpbmplY3Rpb24gdG9rZW4gZm9yIHRoZSBkZXBlbmRlbmN5IHRvIGJlIGluamVjdGVkLlxuICogQHBhcmFtIGZsYWdzIE9wdGlvbmFsIGZsYWdzIHRoYXQgY29udHJvbCBob3cgaW5qZWN0aW9uIGlzIGV4ZWN1dGVkLlxuICogVGhlIGZsYWdzIGNvcnJlc3BvbmQgdG8gaW5qZWN0aW9uIHN0cmF0ZWdpZXMgdGhhdCBjYW4gYmUgc3BlY2lmaWVkIHdpdGhcbiAqIHBhcmFtZXRlciBkZWNvcmF0b3JzIGBASG9zdGAsIGBAU2VsZmAsIGBAU2tpcFNlZmAsIGFuZCBgQE9wdGlvbmFsYC5cbiAqIEByZXR1cm5zIFRydWUgaWYgaW5qZWN0aW9uIGlzIHN1Y2Nlc3NmdWwsIG51bGwgb3RoZXJ3aXNlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nU2hha2FibGVJbmplY3Rpb25Ub2tlbid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgaW5qZWN0ID0gybXJtWluamVjdDtcblxuLyoqXG4gKiBJbmplY3RzIGByb290YCB0b2tlbnMgaW4gbGltcCBtb2RlLlxuICpcbiAqIElmIG5vIGluamVjdG9yIGV4aXN0cywgd2UgY2FuIHN0aWxsIGluamVjdCB0cmVlLXNoYWthYmxlIHByb3ZpZGVycyB3aGljaCBoYXZlIGBwcm92aWRlZEluYCBzZXQgdG9cbiAqIGBcInJvb3RcImAuIFRoaXMgaXMga25vd24gYXMgdGhlIGxpbXAgbW9kZSBpbmplY3Rpb24uIEluIHN1Y2ggY2FzZSB0aGUgdmFsdWUgaXMgc3RvcmVkIGluIHRoZVxuICogYEluamVjdGFibGVEZWZgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Um9vdExpbXBNb2RlPFQ+KFxuICAgIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogVCB8IHVuZGVmaW5lZCwgZmxhZ3M6IEluamVjdEZsYWdzKTogVHxudWxsIHtcbiAgY29uc3QgaW5qZWN0YWJsZURlZjogybXJtUluamVjdGFibGVEZWY8VD58bnVsbCA9IGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICBpZiAoaW5qZWN0YWJsZURlZiAmJiBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT0gJ3Jvb3QnKSB7XG4gICAgcmV0dXJuIGluamVjdGFibGVEZWYudmFsdWUgPT09IHVuZGVmaW5lZCA/IGluamVjdGFibGVEZWYudmFsdWUgPSBpbmplY3RhYmxlRGVmLmZhY3RvcnkoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGFibGVEZWYudmFsdWU7XG4gIH1cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICBpZiAobm90Rm91bmRWYWx1ZSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgdGhyb3cgbmV3IEVycm9yKGBJbmplY3RvcjogTk9UX0ZPVU5EIFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXJncyh0eXBlczogKFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55PnwgYW55W10pW10pOiBhbnlbXSB7XG4gIGNvbnN0IGFyZ3M6IGFueVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhcmcgPSByZXNvbHZlRm9yd2FyZFJlZih0eXBlc1tpXSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgaWYgKGFyZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcmd1bWVudHMgYXJyYXkgbXVzdCBoYXZlIGFyZ3VtZW50cy4nKTtcbiAgICAgIH1cbiAgICAgIGxldCB0eXBlOiBUeXBlPGFueT58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQ7XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXJnLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBhcmdbal07XG4gICAgICAgIGlmIChtZXRhIGluc3RhbmNlb2YgT3B0aW9uYWwgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ09wdGlvbmFsJykge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLk9wdGlvbmFsO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGEgaW5zdGFuY2VvZiBTa2lwU2VsZiB8fCBtZXRhLm5nTWV0YWRhdGFOYW1lID09PSAnU2tpcFNlbGYnKSB7XG4gICAgICAgICAgZmxhZ3MgfD0gSW5qZWN0RmxhZ3MuU2tpcFNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIFNlbGYgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NlbGYnKSB7XG4gICAgICAgICAgZmxhZ3MgfD0gSW5qZWN0RmxhZ3MuU2VsZjtcbiAgICAgICAgfSBlbHNlIGlmIChtZXRhIGluc3RhbmNlb2YgSW5qZWN0KSB7XG4gICAgICAgICAgdHlwZSA9IG1ldGEudG9rZW47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHlwZSA9IG1ldGE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXJncy5wdXNoKMm1ybVpbmplY3QodHlwZSAhLCBmbGFncykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzLnB1c2goybXJtWluamVjdChhcmcpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFyZ3M7XG59XG4iXX0=