/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ENVIRONMENT_INITIALIZER, Injector } from '../di';
import { inject } from '../di/injector_compatibility';
import { GLOBAL_EVENT_DELEGATION, GlobalEventDelegation, JSACTION_EVENT_CONTRACT, initGlobalEventDelegation, } from '../event_delegation_utils';
import { IS_GLOBAL_EVENT_DELEGATION_ENABLED } from '../hydration/tokens';
/**
 * Returns a set of providers required to setup support for event delegation.
 */
export function provideGlobalEventDelegation() {
    return [
        {
            provide: IS_GLOBAL_EVENT_DELEGATION_ENABLED,
            useValue: true,
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                const injector = inject(Injector);
                const eventContractDetails = injector.get(JSACTION_EVENT_CONTRACT);
                initGlobalEventDelegation(eventContractDetails, injector);
            },
            multi: true,
        },
        {
            provide: GLOBAL_EVENT_DELEGATION,
            useClass: GlobalEventDelegation,
        },
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfZGVsZWdhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2V2ZW50X2Rpc3BhdGNoL2V2ZW50X2RlbGVnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHVCQUF1QixFQUFFLFFBQVEsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUN4RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFcEQsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixxQkFBcUIsRUFDckIsdUJBQXVCLEVBQ3ZCLHlCQUF5QixHQUMxQixNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXZFOztHQUVHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QjtJQUMxQyxPQUFPO1FBQ0w7WUFDRSxPQUFPLEVBQUUsa0NBQWtDO1lBQzNDLFFBQVEsRUFBRSxJQUFJO1NBQ2Y7UUFDRDtZQUNFLE9BQU8sRUFBRSx1QkFBdUI7WUFDaEMsUUFBUSxFQUFFLEdBQUcsRUFBRTtnQkFDYixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2dCQUNuRSx5QkFBeUIsQ0FBQyxvQkFBb0IsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsS0FBSyxFQUFFLElBQUk7U0FDWjtRQUNEO1lBQ0UsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxRQUFRLEVBQUUscUJBQXFCO1NBQ2hDO0tBQ0YsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgSW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7UHJvdmlkZXJ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge1xuICBHTE9CQUxfRVZFTlRfREVMRUdBVElPTixcbiAgR2xvYmFsRXZlbnREZWxlZ2F0aW9uLFxuICBKU0FDVElPTl9FVkVOVF9DT05UUkFDVCxcbiAgaW5pdEdsb2JhbEV2ZW50RGVsZWdhdGlvbixcbn0gZnJvbSAnLi4vZXZlbnRfZGVsZWdhdGlvbl91dGlscyc7XG5cbmltcG9ydCB7SVNfR0xPQkFMX0VWRU5UX0RFTEVHQVRJT05fRU5BQkxFRH0gZnJvbSAnLi4vaHlkcmF0aW9uL3Rva2Vucyc7XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgc3VwcG9ydCBmb3IgZXZlbnQgZGVsZWdhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVHbG9iYWxFdmVudERlbGVnYXRpb24oKTogUHJvdmlkZXJbXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfR0xPQkFMX0VWRU5UX0RFTEVHQVRJT05fRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gICAgICAgIGNvbnN0IGV2ZW50Q29udHJhY3REZXRhaWxzID0gaW5qZWN0b3IuZ2V0KEpTQUNUSU9OX0VWRU5UX0NPTlRSQUNUKTtcbiAgICAgICAgaW5pdEdsb2JhbEV2ZW50RGVsZWdhdGlvbihldmVudENvbnRyYWN0RGV0YWlscywgaW5qZWN0b3IpO1xuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogR0xPQkFMX0VWRU5UX0RFTEVHQVRJT04sXG4gICAgICB1c2VDbGFzczogR2xvYmFsRXZlbnREZWxlZ2F0aW9uLFxuICAgIH0sXG4gIF07XG59XG4iXX0=