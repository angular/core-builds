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
import { ReflectionCapabilities } from '../reflection/reflection_capabilities';
import { getClosureSafeProperty } from '../util/property';
import { resolveForwardRef } from './forward_ref';
import { injectArgs, ɵɵinject } from './injector_compatibility';
const ɵ0 = getClosureSafeProperty;
/** @type {?} */
const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 });
/** @type {?} */
const EMPTY_ARRAY = [];
/**
 * @param {?} type
 * @param {?=} provider
 * @return {?}
 */
export function convertInjectableProviderToFactory(type, provider) {
    if (!provider) {
        /** @type {?} */
        const reflectionCapabilities = new ReflectionCapabilities();
        /** @type {?} */
        const deps = reflectionCapabilities.parameters(type);
        // TODO - convert to flags.
        return (/**
         * @return {?}
         */
        () => new type(...injectArgs((/** @type {?} */ (deps)))));
    }
    if (USE_VALUE in provider) {
        /** @type {?} */
        const valueProvider = ((/** @type {?} */ (provider)));
        return (/**
         * @return {?}
         */
        () => valueProvider.useValue);
    }
    else if (((/** @type {?} */ (provider))).useExisting) {
        /** @type {?} */
        const existingProvider = ((/** @type {?} */ (provider)));
        return (/**
         * @return {?}
         */
        () => ɵɵinject(resolveForwardRef(existingProvider.useExisting)));
    }
    else if (((/** @type {?} */ (provider))).useFactory) {
        /** @type {?} */
        const factoryProvider = ((/** @type {?} */ (provider)));
        return (/**
         * @return {?}
         */
        () => factoryProvider.useFactory(...injectArgs(factoryProvider.deps || EMPTY_ARRAY)));
    }
    else if (((/** @type {?} */ (provider))).useClass) {
        /** @type {?} */
        const classProvider = ((/** @type {?} */ (provider)));
        /** @type {?} */
        let deps = ((/** @type {?} */ (provider))).deps;
        if (!deps) {
            /** @type {?} */
            const reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return (/**
         * @return {?}
         */
        () => new (resolveForwardRef(classProvider.useClass))(...injectArgs(deps)));
    }
    else {
        /** @type {?} */
        let deps = ((/** @type {?} */ (provider))).deps;
        if (!deps) {
            /** @type {?} */
            const reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return (/**
         * @return {?}
         */
        () => new type(...injectArgs((/** @type {?} */ (deps)))));
    }
}
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUM3RSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztXQUlRLHNCQUFzQjs7TUFEdEYsU0FBUyxHQUNYLHNCQUFzQixDQUFnQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxJQUF3QixFQUFDLENBQUM7O01BQ3hGLFdBQVcsR0FBVSxFQUFFOzs7Ozs7QUFFN0IsTUFBTSxVQUFVLGtDQUFrQyxDQUM5QyxJQUFlLEVBQUUsUUFDb0Q7SUFDdkUsSUFBSSxDQUFDLFFBQVEsRUFBRTs7Y0FDUCxzQkFBc0IsR0FBRyxJQUFJLHNCQUFzQixFQUFFOztjQUNyRCxJQUFJLEdBQUcsc0JBQXNCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztRQUNwRCwyQkFBMkI7UUFDM0I7OztRQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLG1CQUFBLElBQUksRUFBUyxDQUFDLENBQUMsRUFBQztLQUNyRDtJQUVELElBQUksU0FBUyxJQUFJLFFBQVEsRUFBRTs7Y0FDbkIsYUFBYSxHQUFHLENBQUMsbUJBQUEsUUFBUSxFQUFxQixDQUFDO1FBQ3JEOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFDO0tBQ3JDO1NBQU0sSUFBSSxDQUFDLG1CQUFBLFFBQVEsRUFBd0IsQ0FBQyxDQUFDLFdBQVcsRUFBRTs7Y0FDbkQsZ0JBQWdCLEdBQUcsQ0FBQyxtQkFBQSxRQUFRLEVBQXdCLENBQUM7UUFDM0Q7OztRQUFPLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFDO0tBQ3hFO1NBQU0sSUFBSSxDQUFDLG1CQUFBLFFBQVEsRUFBdUIsQ0FBQyxDQUFDLFVBQVUsRUFBRTs7Y0FDakQsZUFBZSxHQUFHLENBQUMsbUJBQUEsUUFBUSxFQUF1QixDQUFDO1FBQ3pEOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsRUFBQztLQUM3RjtTQUFNLElBQUksQ0FBQyxtQkFBQSxRQUFRLEVBQStDLENBQUMsQ0FBQyxRQUFRLEVBQUU7O2NBQ3ZFLGFBQWEsR0FBRyxDQUFDLG1CQUFBLFFBQVEsRUFBK0MsQ0FBQzs7WUFDM0UsSUFBSSxHQUFHLENBQUMsbUJBQUEsUUFBUSxFQUEyQixDQUFDLENBQUMsSUFBSTtRQUNyRCxJQUFJLENBQUMsSUFBSSxFQUFFOztrQkFDSCxzQkFBc0IsR0FBRyxJQUFJLHNCQUFzQixFQUFFO1lBQzNELElBQUksR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDaEQ7UUFDRDs7O1FBQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7S0FDbkY7U0FBTTs7WUFDRCxJQUFJLEdBQUcsQ0FBQyxtQkFBQSxRQUFRLEVBQTJCLENBQUMsQ0FBQyxJQUFJO1FBQ3JELElBQUksQ0FBQyxJQUFJLEVBQUU7O2tCQUNILHNCQUFzQixHQUFHLElBQUksc0JBQXNCLEVBQUU7WUFDM0QsSUFBSSxHQUFHLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNoRDtRQUNEOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxtQkFBQSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUM7S0FDOUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7aW5qZWN0QXJncywgybXJtWluamVjdH0gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Q2xhc3NTYW5zUHJvdmlkZXIsIENvbnN0cnVjdG9yU2Fuc1Byb3ZpZGVyLCBFeGlzdGluZ1NhbnNQcm92aWRlciwgRmFjdG9yeVNhbnNQcm92aWRlciwgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuL2ludGVyZmFjZS9wcm92aWRlcic7XG5cbmNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuY29uc3QgRU1QVFlfQVJSQVk6IGFueVtdID0gW107XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0SW5qZWN0YWJsZVByb3ZpZGVyVG9GYWN0b3J5KFxuICAgIHR5cGU6IFR5cGU8YW55PiwgcHJvdmlkZXI/OiBWYWx1ZVNhbnNQcm92aWRlciB8IEV4aXN0aW5nU2Fuc1Byb3ZpZGVyIHwgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIgfFxuICAgICAgICBDb25zdHJ1Y3RvclNhbnNQcm92aWRlciB8IEZhY3RvcnlTYW5zUHJvdmlkZXIgfCBDbGFzc1NhbnNQcm92aWRlcik6ICgpID0+IGFueSB7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICBjb25zdCByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcbiAgICBjb25zdCBkZXBzID0gcmVmbGVjdGlvbkNhcGFiaWxpdGllcy5wYXJhbWV0ZXJzKHR5cGUpO1xuICAgIC8vIFRPRE8gLSBjb252ZXJ0IHRvIGZsYWdzLlxuICAgIHJldHVybiAoKSA9PiBuZXcgdHlwZSguLi5pbmplY3RBcmdzKGRlcHMgYXMgYW55W10pKTtcbiAgfVxuXG4gIGlmIChVU0VfVkFMVUUgaW4gcHJvdmlkZXIpIHtcbiAgICBjb25zdCB2YWx1ZVByb3ZpZGVyID0gKHByb3ZpZGVyIGFzIFZhbHVlU2Fuc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gKCkgPT4gdmFsdWVQcm92aWRlci51c2VWYWx1ZTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgZXhpc3RpbmdQcm92aWRlciA9IChwcm92aWRlciBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcik7XG4gICAgcmV0dXJuICgpID0+IMm1ybVpbmplY3QocmVzb2x2ZUZvcndhcmRSZWYoZXhpc3RpbmdQcm92aWRlci51c2VFeGlzdGluZykpO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKS51c2VGYWN0b3J5KSB7XG4gICAgY29uc3QgZmFjdG9yeVByb3ZpZGVyID0gKHByb3ZpZGVyIGFzIEZhY3RvcnlTYW5zUHJvdmlkZXIpO1xuICAgIHJldHVybiAoKSA9PiBmYWN0b3J5UHJvdmlkZXIudXNlRmFjdG9yeSguLi5pbmplY3RBcmdzKGZhY3RvcnlQcm92aWRlci5kZXBzIHx8IEVNUFRZX0FSUkFZKSk7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyIHwgQ2xhc3NTYW5zUHJvdmlkZXIpLnVzZUNsYXNzKSB7XG4gICAgY29uc3QgY2xhc3NQcm92aWRlciA9IChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciB8IENsYXNzU2Fuc1Byb3ZpZGVyKTtcbiAgICBsZXQgZGVwcyA9IChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1NhbnNQcm92aWRlcikuZGVwcztcbiAgICBpZiAoIWRlcHMpIHtcbiAgICAgIGNvbnN0IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgPSBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuICAgICAgZGVwcyA9IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMucGFyYW1ldGVycyh0eXBlKTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IG5ldyAocmVzb2x2ZUZvcndhcmRSZWYoY2xhc3NQcm92aWRlci51c2VDbGFzcykpKC4uLmluamVjdEFyZ3MoZGVwcykpO1xuICB9IGVsc2Uge1xuICAgIGxldCBkZXBzID0gKHByb3ZpZGVyIGFzIENvbnN0cnVjdG9yU2Fuc1Byb3ZpZGVyKS5kZXBzO1xuICAgIGlmICghZGVwcykge1xuICAgICAgY29uc3QgcmVmbGVjdGlvbkNhcGFiaWxpdGllcyA9IG5ldyBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzKCk7XG4gICAgICBkZXBzID0gcmVmbGVjdGlvbkNhcGFiaWxpdGllcy5wYXJhbWV0ZXJzKHR5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gKCkgPT4gbmV3IHR5cGUoLi4uaW5qZWN0QXJncyhkZXBzICEpKTtcbiAgfVxufVxuIl19