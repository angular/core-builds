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
import { ReflectionCapabilities } from '../reflection/reflection_capabilities';
import { getClosureSafeProperty } from '../util/property';
import { inject, injectArgs } from './injector_compatibility';
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
        return () => new type(...injectArgs((/** @type {?} */ (deps))));
    }
    if (USE_VALUE in provider) {
        /** @type {?} */
        const valueProvider = ((/** @type {?} */ (provider)));
        return () => valueProvider.useValue;
    }
    else if (((/** @type {?} */ (provider))).useExisting) {
        /** @type {?} */
        const existingProvider = ((/** @type {?} */ (provider)));
        return () => inject(existingProvider.useExisting);
    }
    else if (((/** @type {?} */ (provider))).useFactory) {
        /** @type {?} */
        const factoryProvider = ((/** @type {?} */ (provider)));
        return () => factoryProvider.useFactory(...injectArgs(factoryProvider.deps || EMPTY_ARRAY));
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
        return () => new classProvider.useClass(...injectArgs(deps));
    }
    else {
        /** @type {?} */
        let deps = ((/** @type {?} */ (provider))).deps;
        if (!deps) {
            /** @type {?} */
            const reflectionCapabilities = new ReflectionCapabilities();
            deps = reflectionCapabilities.parameters(type);
        }
        return () => new type(...injectArgs((/** @type {?} */ (deps))));
    }
}
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUM3RSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO1dBSVUsc0JBQXNCOztNQUR0RixTQUFTLEdBQ1gsc0JBQXNCLENBQWdCLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLElBQXdCLEVBQUMsQ0FBQzs7TUFDeEYsV0FBVyxHQUFVLEVBQUU7Ozs7OztBQUU3QixNQUFNLFVBQVUsa0NBQWtDLENBQzlDLElBQWUsRUFBRSxRQUNvRDtJQUN2RSxJQUFJLENBQUMsUUFBUSxFQUFFOztjQUNQLHNCQUFzQixHQUFHLElBQUksc0JBQXNCLEVBQUU7O2NBQ3JELElBQUksR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1FBQ3BELDJCQUEyQjtRQUMzQixPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLG1CQUFBLElBQUksRUFBUyxDQUFDLENBQUMsQ0FBQztLQUNyRDtJQUVELElBQUksU0FBUyxJQUFJLFFBQVEsRUFBRTs7Y0FDbkIsYUFBYSxHQUFHLENBQUMsbUJBQUEsUUFBUSxFQUFxQixDQUFDO1FBQ3JELE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQztLQUNyQztTQUFNLElBQUksQ0FBQyxtQkFBQSxRQUFRLEVBQXdCLENBQUMsQ0FBQyxXQUFXLEVBQUU7O2NBQ25ELGdCQUFnQixHQUFHLENBQUMsbUJBQUEsUUFBUSxFQUF3QixDQUFDO1FBQzNELE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ25EO1NBQU0sSUFBSSxDQUFDLG1CQUFBLFFBQVEsRUFBdUIsQ0FBQyxDQUFDLFVBQVUsRUFBRTs7Y0FDakQsZUFBZSxHQUFHLENBQUMsbUJBQUEsUUFBUSxFQUF1QixDQUFDO1FBQ3pELE9BQU8sR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUM7S0FDN0Y7U0FBTSxJQUFJLENBQUMsbUJBQUEsUUFBUSxFQUErQyxDQUFDLENBQUMsUUFBUSxFQUFFOztjQUN2RSxhQUFhLEdBQUcsQ0FBQyxtQkFBQSxRQUFRLEVBQStDLENBQUM7O1lBQzNFLElBQUksR0FBRyxDQUFDLG1CQUFBLFFBQVEsRUFBMkIsQ0FBQyxDQUFDLElBQUk7UUFDckQsSUFBSSxDQUFDLElBQUksRUFBRTs7a0JBQ0gsc0JBQXNCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEdBQUcsc0JBQXNCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2hEO1FBQ0QsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUM5RDtTQUFNOztZQUNELElBQUksR0FBRyxDQUFDLG1CQUFBLFFBQVEsRUFBMkIsQ0FBQyxDQUFDLElBQUk7UUFDckQsSUFBSSxDQUFDLElBQUksRUFBRTs7a0JBQ0gsc0JBQXNCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRTtZQUMzRCxJQUFJLEdBQUcsc0JBQXNCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2hEO1FBQ0QsT0FBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxtQkFBQSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDOUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge2luamVjdCwgaW5qZWN0QXJnc30gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Q2xhc3NTYW5zUHJvdmlkZXIsIENvbnN0cnVjdG9yU2Fuc1Byb3ZpZGVyLCBFeGlzdGluZ1NhbnNQcm92aWRlciwgRmFjdG9yeVNhbnNQcm92aWRlciwgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuL2ludGVyZmFjZS9wcm92aWRlcic7XG5cbmNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuY29uc3QgRU1QVFlfQVJSQVk6IGFueVtdID0gW107XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0SW5qZWN0YWJsZVByb3ZpZGVyVG9GYWN0b3J5KFxuICAgIHR5cGU6IFR5cGU8YW55PiwgcHJvdmlkZXI/OiBWYWx1ZVNhbnNQcm92aWRlciB8IEV4aXN0aW5nU2Fuc1Byb3ZpZGVyIHwgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIgfFxuICAgICAgICBDb25zdHJ1Y3RvclNhbnNQcm92aWRlciB8IEZhY3RvcnlTYW5zUHJvdmlkZXIgfCBDbGFzc1NhbnNQcm92aWRlcik6ICgpID0+IGFueSB7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICBjb25zdCByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcbiAgICBjb25zdCBkZXBzID0gcmVmbGVjdGlvbkNhcGFiaWxpdGllcy5wYXJhbWV0ZXJzKHR5cGUpO1xuICAgIC8vIFRPRE8gLSBjb252ZXJ0IHRvIGZsYWdzLlxuICAgIHJldHVybiAoKSA9PiBuZXcgdHlwZSguLi5pbmplY3RBcmdzKGRlcHMgYXMgYW55W10pKTtcbiAgfVxuXG4gIGlmIChVU0VfVkFMVUUgaW4gcHJvdmlkZXIpIHtcbiAgICBjb25zdCB2YWx1ZVByb3ZpZGVyID0gKHByb3ZpZGVyIGFzIFZhbHVlU2Fuc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gKCkgPT4gdmFsdWVQcm92aWRlci51c2VWYWx1ZTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgZXhpc3RpbmdQcm92aWRlciA9IChwcm92aWRlciBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcik7XG4gICAgcmV0dXJuICgpID0+IGluamVjdChleGlzdGluZ1Byb3ZpZGVyLnVzZUV4aXN0aW5nKTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSkge1xuICAgIGNvbnN0IGZhY3RvcnlQcm92aWRlciA9IChwcm92aWRlciBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gKCkgPT4gZmFjdG9yeVByb3ZpZGVyLnVzZUZhY3RvcnkoLi4uaW5qZWN0QXJncyhmYWN0b3J5UHJvdmlkZXIuZGVwcyB8fCBFTVBUWV9BUlJBWSkpO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciB8IENsYXNzU2Fuc1Byb3ZpZGVyKS51c2VDbGFzcykge1xuICAgIGNvbnN0IGNsYXNzUHJvdmlkZXIgPSAocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIgfCBDbGFzc1NhbnNQcm92aWRlcik7XG4gICAgbGV0IGRlcHMgPSAocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIpLmRlcHM7XG4gICAgaWYgKCFkZXBzKSB7XG4gICAgICBjb25zdCByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcbiAgICAgIGRlcHMgPSByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnBhcmFtZXRlcnModHlwZSk7XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiBuZXcgY2xhc3NQcm92aWRlci51c2VDbGFzcyguLi5pbmplY3RBcmdzKGRlcHMpKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgZGVwcyA9IChwcm92aWRlciBhcyBDb25zdHJ1Y3RvclNhbnNQcm92aWRlcikuZGVwcztcbiAgICBpZiAoIWRlcHMpIHtcbiAgICAgIGNvbnN0IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgPSBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuICAgICAgZGVwcyA9IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMucGFyYW1ldGVycyh0eXBlKTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IG5ldyB0eXBlKC4uLmluamVjdEFyZ3MoZGVwcyAhKSk7XG4gIH1cbn1cbiJdfQ==