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
import { defineInjectable } from './interface/defs';
/**
 * Creates a token that can be used in a DI Provider.
 *
 * Use an `InjectionToken` whenever the type you are injecting is not reified (does not have a
 * runtime representation) such as when injecting an interface, callable type, array or
 * parameterized type.
 *
 * `InjectionToken` is parameterized on `T` which is the type of object which will be returned by
 * the `Injector`. This provides additional level of type safety.
 *
 * ```
 * interface MyInterface {...}
 * var myInterface = injector.get(new InjectionToken<MyInterface>('SomeToken'));
 * // myInterface is inferred to be MyInterface.
 * ```
 *
 * When creating an `InjectionToken`, you can optionally specify a factory function which returns
 * (possibly by creating) a default value of the parameterized type `T`. This sets up the
 * `InjectionToken` using this factory as a provider as if it was defined explicitly in the
 * application's root injector. If the factory function, which takes zero arguments, needs to inject
 * dependencies, it can do so using the `inject` function. See below for an example.
 *
 * Additionally, if a `factory` is specified you can also specify the `providedIn` option, which
 * overrides the above behavior and marks the token as belonging to a particular `\@NgModule`. As
 * mentioned above, `'root'` is the default value for `providedIn`.
 *
 * \@usageNotes
 * ### Basic Example
 *
 * ### Plain InjectionToken
 *
 * {\@example core/di/ts/injector_spec.ts region='InjectionToken'}
 *
 * ### Tree-shakable InjectionToken
 *
 * {\@example core/di/ts/injector_spec.ts region='ShakableInjectionToken'}
 *
 *
 * \@publicApi
 * @template T
 */
export class InjectionToken {
    /**
     * @param {?} _desc
     * @param {?=} options
     */
    constructor(_desc, options) {
        this._desc = _desc;
        /**
         * \@internal
         */
        this.ngMetadataName = 'InjectionToken';
        /** @nocollapse */ this.ngInjectableDef = undefined;
        if (typeof options == 'number') {
            // This is a special hack to assign __NG_ELEMENT_ID__ to this instance.
            // __NG_ELEMENT_ID__ is Used by Ivy to determine bloom filter id.
            // We are using it to assign `-1` which is used to identify `Injector`.
            ((/** @type {?} */ (this))).__NG_ELEMENT_ID__ = options;
        }
        else if (options !== undefined) {
            /** @nocollapse */ this.ngInjectableDef = defineInjectable({
                providedIn: options.providedIn || 'root',
                factory: options.factory,
            });
        }
    }
    /**
     * @return {?}
     */
    toString() { return `InjectionToken ${this._desc}`; }
}
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    InjectionToken.prototype.ngMetadataName;
    /** @type {?} */
    InjectionToken.prototype.ngInjectableDef;
    /**
     * @type {?}
     * @protected
     */
    InjectionToken.prototype._desc;
}
/**
 * @record
 * @template T
 */
export function InjectableDefToken() { }
if (false) {
    /** @type {?} */
    InjectableDefToken.prototype.ngInjectableDef;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0aW9uX3Rva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGkvaW5qZWN0aW9uX3Rva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBDbEQsTUFBTSxPQUFPLGNBQWM7Ozs7O0lBTXpCLFlBQXNCLEtBQWEsRUFBRSxPQUdwQztRQUhxQixVQUFLLEdBQUwsS0FBSyxDQUFROzs7O1FBSjFCLG1CQUFjLEdBQUcsZ0JBQWdCLENBQUM7UUFRekMsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUM7UUFDakMsSUFBSSxPQUFPLE9BQU8sSUFBSSxRQUFRLEVBQUU7WUFDOUIsdUVBQXVFO1lBQ3ZFLGlFQUFpRTtZQUNqRSx1RUFBdUU7WUFDdkUsQ0FBQyxtQkFBQSxJQUFJLEVBQU8sQ0FBQyxDQUFDLGlCQUFpQixHQUFHLE9BQU8sQ0FBQztTQUMzQzthQUFNLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtZQUNoQyxJQUFJLENBQUMsZUFBZSxHQUFHLGdCQUFnQixDQUFDO2dCQUN0QyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsSUFBSSxNQUFNO2dCQUN4QyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87YUFDekIsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDOzs7O0lBRUQsUUFBUSxLQUFhLE9BQU8sa0JBQWtCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDOUQ7Ozs7OztJQXZCQyx3Q0FBMkM7O0lBRTNDLHlDQUEwQzs7Ozs7SUFFOUIsK0JBQXVCOzs7Ozs7QUFxQnJDLHdDQUE0Rjs7O0lBQXpCLDZDQUF1QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5cbmltcG9ydCB7ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgaW4gYSBESSBQcm92aWRlci5cbiAqXG4gKiBVc2UgYW4gYEluamVjdGlvblRva2VuYCB3aGVuZXZlciB0aGUgdHlwZSB5b3UgYXJlIGluamVjdGluZyBpcyBub3QgcmVpZmllZCAoZG9lcyBub3QgaGF2ZSBhXG4gKiBydW50aW1lIHJlcHJlc2VudGF0aW9uKSBzdWNoIGFzIHdoZW4gaW5qZWN0aW5nIGFuIGludGVyZmFjZSwgY2FsbGFibGUgdHlwZSwgYXJyYXkgb3JcbiAqIHBhcmFtZXRlcml6ZWQgdHlwZS5cbiAqXG4gKiBgSW5qZWN0aW9uVG9rZW5gIGlzIHBhcmFtZXRlcml6ZWQgb24gYFRgIHdoaWNoIGlzIHRoZSB0eXBlIG9mIG9iamVjdCB3aGljaCB3aWxsIGJlIHJldHVybmVkIGJ5XG4gKiB0aGUgYEluamVjdG9yYC4gVGhpcyBwcm92aWRlcyBhZGRpdGlvbmFsIGxldmVsIG9mIHR5cGUgc2FmZXR5LlxuICpcbiAqIGBgYFxuICogaW50ZXJmYWNlIE15SW50ZXJmYWNlIHsuLi59XG4gKiB2YXIgbXlJbnRlcmZhY2UgPSBpbmplY3Rvci5nZXQobmV3IEluamVjdGlvblRva2VuPE15SW50ZXJmYWNlPignU29tZVRva2VuJykpO1xuICogLy8gbXlJbnRlcmZhY2UgaXMgaW5mZXJyZWQgdG8gYmUgTXlJbnRlcmZhY2UuXG4gKiBgYGBcbiAqXG4gKiBXaGVuIGNyZWF0aW5nIGFuIGBJbmplY3Rpb25Ub2tlbmAsIHlvdSBjYW4gb3B0aW9uYWxseSBzcGVjaWZ5IGEgZmFjdG9yeSBmdW5jdGlvbiB3aGljaCByZXR1cm5zXG4gKiAocG9zc2libHkgYnkgY3JlYXRpbmcpIGEgZGVmYXVsdCB2YWx1ZSBvZiB0aGUgcGFyYW1ldGVyaXplZCB0eXBlIGBUYC4gVGhpcyBzZXRzIHVwIHRoZVxuICogYEluamVjdGlvblRva2VuYCB1c2luZyB0aGlzIGZhY3RvcnkgYXMgYSBwcm92aWRlciBhcyBpZiBpdCB3YXMgZGVmaW5lZCBleHBsaWNpdGx5IGluIHRoZVxuICogYXBwbGljYXRpb24ncyByb290IGluamVjdG9yLiBJZiB0aGUgZmFjdG9yeSBmdW5jdGlvbiwgd2hpY2ggdGFrZXMgemVybyBhcmd1bWVudHMsIG5lZWRzIHRvIGluamVjdFxuICogZGVwZW5kZW5jaWVzLCBpdCBjYW4gZG8gc28gdXNpbmcgdGhlIGBpbmplY3RgIGZ1bmN0aW9uLiBTZWUgYmVsb3cgZm9yIGFuIGV4YW1wbGUuXG4gKlxuICogQWRkaXRpb25hbGx5LCBpZiBhIGBmYWN0b3J5YCBpcyBzcGVjaWZpZWQgeW91IGNhbiBhbHNvIHNwZWNpZnkgdGhlIGBwcm92aWRlZEluYCBvcHRpb24sIHdoaWNoXG4gKiBvdmVycmlkZXMgdGhlIGFib3ZlIGJlaGF2aW9yIGFuZCBtYXJrcyB0aGUgdG9rZW4gYXMgYmVsb25naW5nIHRvIGEgcGFydGljdWxhciBgQE5nTW9kdWxlYC4gQXNcbiAqIG1lbnRpb25lZCBhYm92ZSwgYCdyb290J2AgaXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIGBwcm92aWRlZEluYC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEJhc2ljIEV4YW1wbGVcbiAqXG4gKiAjIyMgUGxhaW4gSW5qZWN0aW9uVG9rZW5cbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nSW5qZWN0aW9uVG9rZW4nfVxuICpcbiAqICMjIyBUcmVlLXNoYWthYmxlIEluamVjdGlvblRva2VuXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J1NoYWthYmxlSW5qZWN0aW9uVG9rZW4nfVxuICpcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmplY3Rpb25Ub2tlbjxUPiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcmVhZG9ubHkgbmdNZXRhZGF0YU5hbWUgPSAnSW5qZWN0aW9uVG9rZW4nO1xuXG4gIHJlYWRvbmx5IG5nSW5qZWN0YWJsZURlZjogbmV2ZXJ8dW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfZGVzYzogc3RyaW5nLCBvcHRpb25zPzoge1xuICAgIHByb3ZpZGVkSW4/OiBUeXBlPGFueT58ICdyb290JyB8IG51bGwsXG4gICAgZmFjdG9yeTogKCkgPT4gVFxuICB9KSB7XG4gICAgdGhpcy5uZ0luamVjdGFibGVEZWYgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09ICdudW1iZXInKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgc3BlY2lhbCBoYWNrIHRvIGFzc2lnbiBfX05HX0VMRU1FTlRfSURfXyB0byB0aGlzIGluc3RhbmNlLlxuICAgICAgLy8gX19OR19FTEVNRU5UX0lEX18gaXMgVXNlZCBieSBJdnkgdG8gZGV0ZXJtaW5lIGJsb29tIGZpbHRlciBpZC5cbiAgICAgIC8vIFdlIGFyZSB1c2luZyBpdCB0byBhc3NpZ24gYC0xYCB3aGljaCBpcyB1c2VkIHRvIGlkZW50aWZ5IGBJbmplY3RvcmAuXG4gICAgICAodGhpcyBhcyBhbnkpLl9fTkdfRUxFTUVOVF9JRF9fID0gb3B0aW9ucztcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5uZ0luamVjdGFibGVEZWYgPSBkZWZpbmVJbmplY3RhYmxlKHtcbiAgICAgICAgcHJvdmlkZWRJbjogb3B0aW9ucy5wcm92aWRlZEluIHx8ICdyb290JyxcbiAgICAgICAgZmFjdG9yeTogb3B0aW9ucy5mYWN0b3J5LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIGBJbmplY3Rpb25Ub2tlbiAke3RoaXMuX2Rlc2N9YDsgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluamVjdGFibGVEZWZUb2tlbjxUPiBleHRlbmRzIEluamVjdGlvblRva2VuPFQ+IHsgbmdJbmplY3RhYmxlRGVmOiBuZXZlcjsgfVxuIl19