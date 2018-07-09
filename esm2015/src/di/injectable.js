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
import { R3_COMPILE_INJECTABLE } from '../ivy_switch';
import { ReflectionCapabilities } from '../reflection/reflection_capabilities';
import { makeDecorator } from '../util/decorators';
import { getClosureSafeProperty } from '../util/property';
import { defineInjectable } from './defs';
import { inject, injectArgs } from './injector';
const /** @type {?} */ GET_PROPERTY_NAME = /** @type {?} */ ({});
const ɵ0 = GET_PROPERTY_NAME;
const /** @type {?} */ USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 }, GET_PROPERTY_NAME);
/**
 * Type of the Injectable decorator / constructor function.
 *
 *
 * @record
 */
export function InjectableDecorator() { }
function InjectableDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (): any;
    */
    /* TODO: handle strange member:
    (options?: {providedIn: Type<any>| 'root' | null}&InjectableProvider): any;
    */
    /* TODO: handle strange member:
    new (): Injectable;
    */
    /* TODO: handle strange member:
    new (options?: {providedIn: Type<any>| 'root' | null}&InjectableProvider): Injectable;
    */
}
const /** @type {?} */ EMPTY_ARRAY = [];
/**
 * @param {?} type
 * @param {?=} provider
 * @return {?}
 */
export function convertInjectableProviderToFactory(type, provider) {
    if (!provider) {
        const /** @type {?} */ reflectionCapabilities = new ReflectionCapabilities();
        const /** @type {?} */ deps = reflectionCapabilities.parameters(type);
        // TODO - convert to flags.
        return () => new type(...injectArgs(/** @type {?} */ (deps)));
    }
    if (USE_VALUE in provider) {
        const /** @type {?} */ valueProvider = (/** @type {?} */ (provider));
        return () => valueProvider.useValue;
    }
    else if ((/** @type {?} */ (provider)).useExisting) {
        const /** @type {?} */ existingProvider = (/** @type {?} */ (provider));
        return () => inject(existingProvider.useExisting);
    }
    else if ((/** @type {?} */ (provider)).useFactory) {
        const /** @type {?} */ factoryProvider = (/** @type {?} */ (provider));
        return () => factoryProvider.useFactory(...injectArgs(factoryProvider.deps || EMPTY_ARRAY));
    }
    else if ((/** @type {?} */ (provider)).useClass) {
        const /** @type {?} */ classProvider = (/** @type {?} */ (provider));
        let /** @type {?} */ deps = (/** @type {?} */ (provider)).deps;
        if (!deps) {
            const /** @type {?} */ reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return () => new classProvider.useClass(...injectArgs(deps));
    }
    else {
        let /** @type {?} */ deps = (/** @type {?} */ (provider)).deps;
        if (!deps) {
            const /** @type {?} */ reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return () => new type(...injectArgs(/** @type {?} */ ((deps))));
    }
}
/**
 * Supports \@Injectable() in JIT mode for Render2.
 * @param {?} injectableType
 * @param {?} options
 * @return {?}
 */
function preR3InjectableCompile(injectableType, options) {
    if (options && options.providedIn !== undefined && injectableType.ngInjectableDef === undefined) {
        /** @nocollapse */ injectableType.ngInjectableDef = defineInjectable({
            providedIn: options.providedIn,
            factory: convertInjectableProviderToFactory(injectableType, options),
        });
    }
}
/**
 * Injectable decorator and metadata.
 *
 *
 * \@Annotation
 */
export const /** @type {?} */ Injectable = makeDecorator('Injectable', undefined, undefined, undefined, (type, meta) => (R3_COMPILE_INJECTABLE || preR3InjectableCompile)(type, meta));
/**
 * Type representing injectable service.
 *
 * \@experimental
 * @record
 * @template T
 */
export function InjectableType() { }
function InjectableType_tsickle_Closure_declarations() {
    /** @type {?} */
    InjectableType.prototype.ngInjectableDef;
}
export { ɵ0 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDcEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sdUNBQXVDLENBQUM7QUFFN0UsT0FBTyxFQUFDLGFBQWEsRUFBcUIsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxPQUFPLEVBQWdDLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRzlDLHVCQUFNLGlCQUFpQixxQkFBRyxFQUFTLENBQUEsQ0FBQztXQUVKLGlCQUFpQjtBQURqRCx1QkFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQ3BDLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLElBQW1CLEVBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0R2RSx1QkFBTSxXQUFXLEdBQVUsRUFBRSxDQUFDOzs7Ozs7QUFFOUIsTUFBTSw2Q0FDRixJQUFlLEVBQUUsUUFBNkI7SUFDaEQsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLHVCQUFNLHNCQUFzQixHQUFHLElBQUksc0JBQXNCLEVBQUUsQ0FBQztRQUM1RCx1QkFBTSxJQUFJLEdBQUcsc0JBQXNCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDOztRQUVyRCxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsVUFBVSxtQkFBQyxJQUFhLEVBQUMsQ0FBQyxDQUFDO0tBQ3JEO0lBRUQsSUFBSSxTQUFTLElBQUksUUFBUSxFQUFFO1FBQ3pCLHVCQUFNLGFBQWEsR0FBRyxtQkFBQyxRQUE2QixFQUFDLENBQUM7UUFDdEQsT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO0tBQ3JDO1NBQU0sSUFBSSxtQkFBQyxRQUFnQyxFQUFDLENBQUMsV0FBVyxFQUFFO1FBQ3pELHVCQUFNLGdCQUFnQixHQUFHLG1CQUFDLFFBQWdDLEVBQUMsQ0FBQztRQUM1RCxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNuRDtTQUFNLElBQUksbUJBQUMsUUFBK0IsRUFBQyxDQUFDLFVBQVUsRUFBRTtRQUN2RCx1QkFBTSxlQUFlLEdBQUcsbUJBQUMsUUFBK0IsRUFBQyxDQUFDO1FBQzFELE9BQU8sR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUM7S0FDN0Y7U0FBTSxJQUFJLG1CQUFDLFFBQXVELEVBQUMsQ0FBQyxRQUFRLEVBQUU7UUFDN0UsdUJBQU0sYUFBYSxHQUFHLG1CQUFDLFFBQXVELEVBQUMsQ0FBQztRQUNoRixxQkFBSSxJQUFJLEdBQUcsbUJBQUMsUUFBbUMsRUFBQyxDQUFDLElBQUksQ0FBQztRQUN0RCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsdUJBQU0sc0JBQXNCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO1lBQzVELElBQUksR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDaEQ7UUFDRCxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQzlEO1NBQU07UUFDTCxxQkFBSSxJQUFJLEdBQUcsbUJBQUMsUUFBbUMsRUFBQyxDQUFDLElBQUksQ0FBQztRQUN0RCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsdUJBQU0sc0JBQXNCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO1lBQzVELElBQUksR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDaEQ7UUFDRCxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsVUFBVSxvQkFBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0tBQzlDO0NBQ0Y7Ozs7Ozs7QUFLRCxnQ0FDSSxjQUFtQyxFQUNuQyxPQUFxRTtJQUN2RSxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxLQUFLLFNBQVMsSUFBSSxjQUFjLENBQUMsZUFBZSxLQUFLLFNBQVMsRUFBRTtRQUMvRixjQUFjLENBQUMsZUFBZSxHQUFHLGdCQUFnQixDQUFDO1lBQ2hELFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtZQUM5QixPQUFPLEVBQUUsa0NBQWtDLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQztTQUNyRSxDQUFDLENBQUM7S0FDSjtDQUNGOzs7Ozs7O0FBUUQsTUFBTSxDQUFDLHVCQUFNLFVBQVUsR0FBd0IsYUFBYSxDQUN4RCxZQUFZLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQzdDLENBQUMsSUFBZSxFQUFFLElBQWdCLEVBQUUsRUFBRSxDQUNsQyxDQUFDLHFCQUFxQixJQUFJLHNCQUFzQixDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UjNfQ09NUElMRV9JTkpFQ1RBQkxFfSBmcm9tICcuLi9pdnlfc3dpdGNoJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHttYWtlRGVjb3JhdG9yLCBtYWtlUGFyYW1EZWNvcmF0b3J9IGZyb20gJy4uL3V0aWwvZGVjb3JhdG9ycyc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge0luamVjdGFibGVEZWYsIEluamVjdGFibGVUeXBlLCBkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuL2RlZnMnO1xuaW1wb3J0IHtpbmplY3QsIGluamVjdEFyZ3N9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgQ29uc3RydWN0b3JQcm92aWRlciwgQ29uc3RydWN0b3JTYW5zUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyLCBWYWx1ZVNhbnNQcm92aWRlcn0gZnJvbSAnLi9wcm92aWRlcic7XG5cbmNvbnN0IEdFVF9QUk9QRVJUWV9OQU1FID0ge30gYXMgYW55O1xuY29uc3QgVVNFX1ZBTFVFID0gZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPihcbiAgICB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogR0VUX1BST1BFUlRZX05BTUV9LCBHRVRfUFJPUEVSVFlfTkFNRSk7XG5cbi8qKlxuICogSW5qZWN0YWJsZSBwcm92aWRlcnMgdXNlZCBpbiBgQEluamVjdGFibGVgIGRlY29yYXRvci5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCB0eXBlIEluamVjdGFibGVQcm92aWRlciA9IFZhbHVlU2Fuc1Byb3ZpZGVyIHwgRXhpc3RpbmdTYW5zUHJvdmlkZXIgfFxuICAgIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JTYW5zUHJvdmlkZXIgfCBGYWN0b3J5U2Fuc1Byb3ZpZGVyIHwgQ2xhc3NTYW5zUHJvdmlkZXI7XG5cbi8qKlxuICogVHlwZSBvZiB0aGUgSW5qZWN0YWJsZSBkZWNvcmF0b3IgLyBjb25zdHJ1Y3RvciBmdW5jdGlvbi5cbiAqXG4gKlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEluamVjdGFibGVEZWNvcmF0b3Ige1xuICAvKipcbiAgICogQHVzYWdlTm90ZXNcbiAgICogYGBgXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHt9XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQSBtYXJrZXIgbWV0YWRhdGEgdGhhdCBtYXJrcyBhIGNsYXNzIGFzIGF2YWlsYWJsZSB0byB7QGxpbmsgSW5qZWN0b3J9IGZvciBjcmVhdGlvbi5cbiAgICpcbiAgICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSB7QGxpbmtEb2NzIGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uIFwiRGVwZW5kZW5jeSBJbmplY3Rpb24gR3VpZGVcIn0uXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL21ldGFkYXRhX3NwZWMudHMgcmVnaW9uPSdJbmplY3RhYmxlJ31cbiAgICpcbiAgICoge0BsaW5rIEluamVjdG9yfSB3aWxsIHRocm93IGFuIGVycm9yIHdoZW4gdHJ5aW5nIHRvIGluc3RhbnRpYXRlIGEgY2xhc3MgdGhhdFxuICAgKiBkb2VzIG5vdCBoYXZlIGBASW5qZWN0YWJsZWAgbWFya2VyLCBhcyBzaG93biBpbiB0aGUgZXhhbXBsZSBiZWxvdy5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvZGkvdHMvbWV0YWRhdGFfc3BlYy50cyByZWdpb249J0luamVjdGFibGVUaHJvd3MnfVxuICAgKlxuICAgKlxuICAgKi9cbiAgKCk6IGFueTtcbiAgKG9wdGlvbnM/OiB7cHJvdmlkZWRJbjogVHlwZTxhbnk+fCAncm9vdCcgfCBudWxsfSZJbmplY3RhYmxlUHJvdmlkZXIpOiBhbnk7XG4gIG5ldyAoKTogSW5qZWN0YWJsZTtcbiAgbmV3IChvcHRpb25zPzoge3Byb3ZpZGVkSW46IFR5cGU8YW55PnwgJ3Jvb3QnIHwgbnVsbH0mSW5qZWN0YWJsZVByb3ZpZGVyKTogSW5qZWN0YWJsZTtcbn1cblxuLyoqXG4gKiBUeXBlIG9mIHRoZSBJbmplY3RhYmxlIG1ldGFkYXRhLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbmplY3RhYmxlIHsgcHJvdmlkZWRJbj86IFR5cGU8YW55Pnwncm9vdCd8bnVsbDsgfVxuXG5jb25zdCBFTVBUWV9BUlJBWTogYW55W10gPSBbXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRJbmplY3RhYmxlUHJvdmlkZXJUb0ZhY3RvcnkoXG4gICAgdHlwZTogVHlwZTxhbnk+LCBwcm92aWRlcj86IEluamVjdGFibGVQcm92aWRlcik6ICgpID0+IGFueSB7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICBjb25zdCByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcbiAgICBjb25zdCBkZXBzID0gcmVmbGVjdGlvbkNhcGFiaWxpdGllcy5wYXJhbWV0ZXJzKHR5cGUpO1xuICAgIC8vIFRPRE8gLSBjb252ZXJ0IHRvIGZsYWdzLlxuICAgIHJldHVybiAoKSA9PiBuZXcgdHlwZSguLi5pbmplY3RBcmdzKGRlcHMgYXMgYW55W10pKTtcbiAgfVxuXG4gIGlmIChVU0VfVkFMVUUgaW4gcHJvdmlkZXIpIHtcbiAgICBjb25zdCB2YWx1ZVByb3ZpZGVyID0gKHByb3ZpZGVyIGFzIFZhbHVlU2Fuc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gKCkgPT4gdmFsdWVQcm92aWRlci51c2VWYWx1ZTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgZXhpc3RpbmdQcm92aWRlciA9IChwcm92aWRlciBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcik7XG4gICAgcmV0dXJuICgpID0+IGluamVjdChleGlzdGluZ1Byb3ZpZGVyLnVzZUV4aXN0aW5nKTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSkge1xuICAgIGNvbnN0IGZhY3RvcnlQcm92aWRlciA9IChwcm92aWRlciBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gKCkgPT4gZmFjdG9yeVByb3ZpZGVyLnVzZUZhY3RvcnkoLi4uaW5qZWN0QXJncyhmYWN0b3J5UHJvdmlkZXIuZGVwcyB8fCBFTVBUWV9BUlJBWSkpO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciB8IENsYXNzU2Fuc1Byb3ZpZGVyKS51c2VDbGFzcykge1xuICAgIGNvbnN0IGNsYXNzUHJvdmlkZXIgPSAocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIgfCBDbGFzc1NhbnNQcm92aWRlcik7XG4gICAgbGV0IGRlcHMgPSAocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIpLmRlcHM7XG4gICAgaWYgKCFkZXBzKSB7XG4gICAgICBjb25zdCByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcbiAgICAgIGRlcHMgPSByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnBhcmFtZXRlcnModHlwZSk7XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiBuZXcgY2xhc3NQcm92aWRlci51c2VDbGFzcyguLi5pbmplY3RBcmdzKGRlcHMpKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgZGVwcyA9IChwcm92aWRlciBhcyBDb25zdHJ1Y3RvclNhbnNQcm92aWRlcikuZGVwcztcbiAgICBpZiAoIWRlcHMpIHtcbiAgICAgIGNvbnN0IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgPSBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuICAgICAgZGVwcyA9IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMucGFyYW1ldGVycyh0eXBlKTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IG5ldyB0eXBlKC4uLmluamVjdEFyZ3MoZGVwcyAhKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTdXBwb3J0cyBASW5qZWN0YWJsZSgpIGluIEpJVCBtb2RlIGZvciBSZW5kZXIyLlxuICovXG5mdW5jdGlvbiBwcmVSM0luamVjdGFibGVDb21waWxlKFxuICAgIGluamVjdGFibGVUeXBlOiBJbmplY3RhYmxlVHlwZTxhbnk+LFxuICAgIG9wdGlvbnM6IHtwcm92aWRlZEluPzogVHlwZTxhbnk+fCAncm9vdCcgfCBudWxsfSAmIEluamVjdGFibGVQcm92aWRlcik6IHZvaWQge1xuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnByb3ZpZGVkSW4gIT09IHVuZGVmaW5lZCAmJiBpbmplY3RhYmxlVHlwZS5uZ0luamVjdGFibGVEZWYgPT09IHVuZGVmaW5lZCkge1xuICAgIGluamVjdGFibGVUeXBlLm5nSW5qZWN0YWJsZURlZiA9IGRlZmluZUluamVjdGFibGUoe1xuICAgICAgcHJvdmlkZWRJbjogb3B0aW9ucy5wcm92aWRlZEluLFxuICAgICAgZmFjdG9yeTogY29udmVydEluamVjdGFibGVQcm92aWRlclRvRmFjdG9yeShpbmplY3RhYmxlVHlwZSwgb3B0aW9ucyksXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4qIEluamVjdGFibGUgZGVjb3JhdG9yIGFuZCBtZXRhZGF0YS5cbipcbipcbiogQEFubm90YXRpb25cbiovXG5leHBvcnQgY29uc3QgSW5qZWN0YWJsZTogSW5qZWN0YWJsZURlY29yYXRvciA9IG1ha2VEZWNvcmF0b3IoXG4gICAgJ0luamVjdGFibGUnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxuICAgICh0eXBlOiBUeXBlPGFueT4sIG1ldGE6IEluamVjdGFibGUpID0+XG4gICAgICAgIChSM19DT01QSUxFX0lOSkVDVEFCTEUgfHwgcHJlUjNJbmplY3RhYmxlQ29tcGlsZSkodHlwZSwgbWV0YSkpO1xuXG4vKipcbiAqIFR5cGUgcmVwcmVzZW50aW5nIGluamVjdGFibGUgc2VydmljZS5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5qZWN0YWJsZVR5cGU8VD4gZXh0ZW5kcyBUeXBlPFQ+IHsgbmdJbmplY3RhYmxlRGVmOiBJbmplY3RhYmxlRGVmPFQ+OyB9XG4iXX0=