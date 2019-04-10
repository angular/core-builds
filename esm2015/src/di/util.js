/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { injectArgs, Δinject } from './injector_compatibility';
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
        () => Δinject(existingProvider.useExisting));
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
        () => new classProvider.useClass(...injectArgs(deps)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUM3RSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBQyxNQUFNLDBCQUEwQixDQUFDO1dBSVMsc0JBQXNCOztNQUR0RixTQUFTLEdBQ1gsc0JBQXNCLENBQWdCLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLElBQXdCLEVBQUMsQ0FBQzs7TUFDeEYsV0FBVyxHQUFVLEVBQUU7Ozs7OztBQUU3QixNQUFNLFVBQVUsa0NBQWtDLENBQzlDLElBQWUsRUFBRSxRQUNvRDtJQUN2RSxJQUFJLENBQUMsUUFBUSxFQUFFOztjQUNQLHNCQUFzQixHQUFHLElBQUksc0JBQXNCLEVBQUU7O2NBQ3JELElBQUksR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO1FBQ3BELDJCQUEyQjtRQUMzQjs7O1FBQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsbUJBQUEsSUFBSSxFQUFTLENBQUMsQ0FBQyxFQUFDO0tBQ3JEO0lBRUQsSUFBSSxTQUFTLElBQUksUUFBUSxFQUFFOztjQUNuQixhQUFhLEdBQUcsQ0FBQyxtQkFBQSxRQUFRLEVBQXFCLENBQUM7UUFDckQ7OztRQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUM7S0FDckM7U0FBTSxJQUFJLENBQUMsbUJBQUEsUUFBUSxFQUF3QixDQUFDLENBQUMsV0FBVyxFQUFFOztjQUNuRCxnQkFBZ0IsR0FBRyxDQUFDLG1CQUFBLFFBQVEsRUFBd0IsQ0FBQztRQUMzRDs7O1FBQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxFQUFDO0tBQ3BEO1NBQU0sSUFBSSxDQUFDLG1CQUFBLFFBQVEsRUFBdUIsQ0FBQyxDQUFDLFVBQVUsRUFBRTs7Y0FDakQsZUFBZSxHQUFHLENBQUMsbUJBQUEsUUFBUSxFQUF1QixDQUFDO1FBQ3pEOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsRUFBQztLQUM3RjtTQUFNLElBQUksQ0FBQyxtQkFBQSxRQUFRLEVBQStDLENBQUMsQ0FBQyxRQUFRLEVBQUU7O2NBQ3ZFLGFBQWEsR0FBRyxDQUFDLG1CQUFBLFFBQVEsRUFBK0MsQ0FBQzs7WUFDM0UsSUFBSSxHQUFHLENBQUMsbUJBQUEsUUFBUSxFQUEyQixDQUFDLENBQUMsSUFBSTtRQUNyRCxJQUFJLENBQUMsSUFBSSxFQUFFOztrQkFDSCxzQkFBc0IsR0FBRyxJQUFJLHNCQUFzQixFQUFFO1lBQzNELElBQUksR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDaEQ7UUFDRDs7O1FBQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7S0FDOUQ7U0FBTTs7WUFDRCxJQUFJLEdBQUcsQ0FBQyxtQkFBQSxRQUFRLEVBQTJCLENBQUMsQ0FBQyxJQUFJO1FBQ3JELElBQUksQ0FBQyxJQUFJLEVBQUU7O2tCQUNILHNCQUFzQixHQUFHLElBQUksc0JBQXNCLEVBQUU7WUFDM0QsSUFBSSxHQUFHLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNoRDtRQUNEOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxtQkFBQSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUM7S0FDOUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge2luamVjdEFyZ3MsIM6UaW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgQ29uc3RydWN0b3JTYW5zUHJvdmlkZXIsIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyLCBGYWN0b3J5U2Fuc1Byb3ZpZGVyLCBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciwgVmFsdWVQcm92aWRlciwgVmFsdWVTYW5zUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcblxuY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5jb25zdCBFTVBUWV9BUlJBWTogYW55W10gPSBbXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRJbmplY3RhYmxlUHJvdmlkZXJUb0ZhY3RvcnkoXG4gICAgdHlwZTogVHlwZTxhbnk+LCBwcm92aWRlcj86IFZhbHVlU2Fuc1Byb3ZpZGVyIHwgRXhpc3RpbmdTYW5zUHJvdmlkZXIgfCBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciB8XG4gICAgICAgIENvbnN0cnVjdG9yU2Fuc1Byb3ZpZGVyIHwgRmFjdG9yeVNhbnNQcm92aWRlciB8IENsYXNzU2Fuc1Byb3ZpZGVyKTogKCkgPT4gYW55IHtcbiAgaWYgKCFwcm92aWRlcikge1xuICAgIGNvbnN0IHJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgPSBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpO1xuICAgIGNvbnN0IGRlcHMgPSByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnBhcmFtZXRlcnModHlwZSk7XG4gICAgLy8gVE9ETyAtIGNvbnZlcnQgdG8gZmxhZ3MuXG4gICAgcmV0dXJuICgpID0+IG5ldyB0eXBlKC4uLmluamVjdEFyZ3MoZGVwcyBhcyBhbnlbXSkpO1xuICB9XG5cbiAgaWYgKFVTRV9WQUxVRSBpbiBwcm92aWRlcikge1xuICAgIGNvbnN0IHZhbHVlUHJvdmlkZXIgPSAocHJvdmlkZXIgYXMgVmFsdWVTYW5zUHJvdmlkZXIpO1xuICAgIHJldHVybiAoKSA9PiB2YWx1ZVByb3ZpZGVyLnVzZVZhbHVlO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcikudXNlRXhpc3RpbmcpIHtcbiAgICBjb25zdCBleGlzdGluZ1Byb3ZpZGVyID0gKHByb3ZpZGVyIGFzIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gKCkgPT4gzpRpbmplY3QoZXhpc3RpbmdQcm92aWRlci51c2VFeGlzdGluZyk7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEZhY3RvcnlTYW5zUHJvdmlkZXIpLnVzZUZhY3RvcnkpIHtcbiAgICBjb25zdCBmYWN0b3J5UHJvdmlkZXIgPSAocHJvdmlkZXIgYXMgRmFjdG9yeVNhbnNQcm92aWRlcik7XG4gICAgcmV0dXJuICgpID0+IGZhY3RvcnlQcm92aWRlci51c2VGYWN0b3J5KC4uLmluamVjdEFyZ3MoZmFjdG9yeVByb3ZpZGVyLmRlcHMgfHwgRU1QVFlfQVJSQVkpKTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NTYW5zUHJvdmlkZXIgfCBDbGFzc1NhbnNQcm92aWRlcikudXNlQ2xhc3MpIHtcbiAgICBjb25zdCBjbGFzc1Byb3ZpZGVyID0gKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyIHwgQ2xhc3NTYW5zUHJvdmlkZXIpO1xuICAgIGxldCBkZXBzID0gKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyKS5kZXBzO1xuICAgIGlmICghZGVwcykge1xuICAgICAgY29uc3QgcmVmbGVjdGlvbkNhcGFiaWxpdGllcyA9IG5ldyBSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzKCk7XG4gICAgICBkZXBzID0gcmVmbGVjdGlvbkNhcGFiaWxpdGllcy5wYXJhbWV0ZXJzKHR5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gKCkgPT4gbmV3IGNsYXNzUHJvdmlkZXIudXNlQ2xhc3MoLi4uaW5qZWN0QXJncyhkZXBzKSk7XG4gIH0gZWxzZSB7XG4gICAgbGV0IGRlcHMgPSAocHJvdmlkZXIgYXMgQ29uc3RydWN0b3JTYW5zUHJvdmlkZXIpLmRlcHM7XG4gICAgaWYgKCFkZXBzKSB7XG4gICAgICBjb25zdCByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzID0gbmV3IFJlZmxlY3Rpb25DYXBhYmlsaXRpZXMoKTtcbiAgICAgIGRlcHMgPSByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnBhcmFtZXRlcnModHlwZSk7XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiBuZXcgdHlwZSguLi5pbmplY3RBcmdzKGRlcHMgISkpO1xuICB9XG59XG4iXX0=