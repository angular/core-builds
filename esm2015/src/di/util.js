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
import { ReflectionCapabilities } from '../reflection/reflection_capabilities';
import { getClosureSafeProperty } from '../util/property';
import { inject, injectArgs } from './injector';
/** @type {?} */
const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
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
        return () => new type(...injectArgs(/** @type {?} */ (deps)));
    }
    if (USE_VALUE in provider) {
        /** @type {?} */
        const valueProvider = (/** @type {?} */ (provider));
        return () => valueProvider.useValue;
    }
    else if ((/** @type {?} */ (provider)).useExisting) {
        /** @type {?} */
        const existingProvider = (/** @type {?} */ (provider));
        return () => inject(existingProvider.useExisting);
    }
    else if ((/** @type {?} */ (provider)).useFactory) {
        /** @type {?} */
        const factoryProvider = (/** @type {?} */ (provider));
        return () => factoryProvider.useFactory(...injectArgs(factoryProvider.deps || EMPTY_ARRAY));
    }
    else if ((/** @type {?} */ (provider)).useClass) {
        /** @type {?} */
        const classProvider = (/** @type {?} */ (provider));
        /** @type {?} */
        let deps = (/** @type {?} */ (provider)).deps;
        if (!deps) {
            /** @type {?} */
            const reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return () => new classProvider.useClass(...injectArgs(deps));
    }
    else {
        /** @type {?} */
        let deps = (/** @type {?} */ (provider)).deps;
        if (!deps) {
            /** @type {?} */
            const reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return () => new type(...injectArgs(/** @type {?} */ ((deps))));
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUU3RSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLFlBQVksQ0FBQzs7QUFHOUMsTUFBTSxTQUFTLEdBQ1gsc0JBQXNCLENBQWdCLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsc0JBQXNCLEVBQUMsQ0FBQyxDQUFDOztBQUMvRixNQUFNLFdBQVcsR0FBVSxFQUFFLENBQUM7Ozs7OztBQUU5QixNQUFNLFVBQVUsa0NBQWtDLENBQzlDLElBQWUsRUFBRSxRQUNvRDtJQUN2RSxJQUFJLENBQUMsUUFBUSxFQUFFOztRQUNiLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDOztRQUM1RCxNQUFNLElBQUksR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7O1FBRXJELE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxVQUFVLG1CQUFDLElBQWEsRUFBQyxDQUFDLENBQUM7S0FDckQ7SUFFRCxJQUFJLFNBQVMsSUFBSSxRQUFRLEVBQUU7O1FBQ3pCLE1BQU0sYUFBYSxHQUFHLG1CQUFDLFFBQTZCLEVBQUMsQ0FBQztRQUN0RCxPQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7S0FDckM7U0FBTSxJQUFJLG1CQUFDLFFBQWdDLEVBQUMsQ0FBQyxXQUFXLEVBQUU7O1FBQ3pELE1BQU0sZ0JBQWdCLEdBQUcsbUJBQUMsUUFBZ0MsRUFBQyxDQUFDO1FBQzVELE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ25EO1NBQU0sSUFBSSxtQkFBQyxRQUErQixFQUFDLENBQUMsVUFBVSxFQUFFOztRQUN2RCxNQUFNLGVBQWUsR0FBRyxtQkFBQyxRQUErQixFQUFDLENBQUM7UUFDMUQsT0FBTyxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQztLQUM3RjtTQUFNLElBQUksbUJBQUMsUUFBdUQsRUFBQyxDQUFDLFFBQVEsRUFBRTs7UUFDN0UsTUFBTSxhQUFhLEdBQUcsbUJBQUMsUUFBdUQsRUFBQyxDQUFDOztRQUNoRixJQUFJLElBQUksR0FBRyxtQkFBQyxRQUFtQyxFQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3RELElBQUksQ0FBQyxJQUFJLEVBQUU7O1lBQ1QsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLHNCQUFzQixFQUFFLENBQUM7WUFDNUQsSUFBSSxHQUFHLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNoRDtRQUNELE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDOUQ7U0FBTTs7UUFDTCxJQUFJLElBQUksR0FBRyxtQkFBQyxRQUFtQyxFQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3RELElBQUksQ0FBQyxJQUFJLEVBQUU7O1lBQ1QsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLHNCQUFzQixFQUFFLENBQUM7WUFDNUQsSUFBSSxHQUFHLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNoRDtRQUNELE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxVQUFVLG9CQUFDLElBQUksR0FBRyxDQUFDLENBQUM7S0FDOUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfSBmcm9tICcuLi9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge2luamVjdCwgaW5qZWN0QXJnc30gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge0NsYXNzU2Fuc1Byb3ZpZGVyLCBDb25zdHJ1Y3RvclNhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyLCBWYWx1ZVNhbnNQcm92aWRlcn0gZnJvbSAnLi9wcm92aWRlcic7XG5cbmNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuY29uc3QgRU1QVFlfQVJSQVk6IGFueVtdID0gW107XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0SW5qZWN0YWJsZVByb3ZpZGVyVG9GYWN0b3J5KFxuICAgIHR5cGU6IFR5cGU8YW55PiwgcHJvdmlkZXI/OiBWYWx1ZVNhbnNQcm92aWRlciB8IEV4aXN0aW5nU2Fuc1Byb3ZpZGVyIHwgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIgfFxuICAgICAgICBDb25zdHJ1Y3RvclNhbnNQcm92aWRlciB8IEZhY3RvcnlTYW5zUHJvdmlkZXIgfCBDbGFzc1NhbnNQcm92aWRlcik6ICgpID0+IGFueSB7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICBjb25zdCByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcbiAgICBjb25zdCBkZXBzID0gcmVmbGVjdGlvbkNhcGFiaWxpdGllcy5wYXJhbWV0ZXJzKHR5cGUpO1xuICAgIC8vIFRPRE8gLSBjb252ZXJ0IHRvIGZsYWdzLlxuICAgIHJldHVybiAoKSA9PiBuZXcgdHlwZSguLi5pbmplY3RBcmdzKGRlcHMgYXMgYW55W10pKTtcbiAgfVxuXG4gIGlmIChVU0VfVkFMVUUgaW4gcHJvdmlkZXIpIHtcbiAgICBjb25zdCB2YWx1ZVByb3ZpZGVyID0gKHByb3ZpZGVyIGFzIFZhbHVlU2Fuc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gKCkgPT4gdmFsdWVQcm92aWRlci51c2VWYWx1ZTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgZXhpc3RpbmdQcm92aWRlciA9IChwcm92aWRlciBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcik7XG4gICAgcmV0dXJuICgpID0+IGluamVjdChleGlzdGluZ1Byb3ZpZGVyLnVzZUV4aXN0aW5nKTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSkge1xuICAgIGNvbnN0IGZhY3RvcnlQcm92aWRlciA9IChwcm92aWRlciBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gKCkgPT4gZmFjdG9yeVByb3ZpZGVyLnVzZUZhY3RvcnkoLi4uaW5qZWN0QXJncyhmYWN0b3J5UHJvdmlkZXIuZGVwcyB8fCBFTVBUWV9BUlJBWSkpO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciB8IENsYXNzU2Fuc1Byb3ZpZGVyKS51c2VDbGFzcykge1xuICAgIGNvbnN0IGNsYXNzUHJvdmlkZXIgPSAocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIgfCBDbGFzc1NhbnNQcm92aWRlcik7XG4gICAgbGV0IGRlcHMgPSAocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIpLmRlcHM7XG4gICAgaWYgKCFkZXBzKSB7XG4gICAgICBjb25zdCByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcbiAgICAgIGRlcHMgPSByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnBhcmFtZXRlcnModHlwZSk7XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiBuZXcgY2xhc3NQcm92aWRlci51c2VDbGFzcyguLi5pbmplY3RBcmdzKGRlcHMpKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgZGVwcyA9IChwcm92aWRlciBhcyBDb25zdHJ1Y3RvclNhbnNQcm92aWRlcikuZGVwcztcbiAgICBpZiAoIWRlcHMpIHtcbiAgICAgIGNvbnN0IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgPSBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuICAgICAgZGVwcyA9IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMucGFyYW1ldGVycyh0eXBlKTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IG5ldyB0eXBlKC4uLmluamVjdEFyZ3MoZGVwcyAhKSk7XG4gIH1cbn1cbiJdfQ==