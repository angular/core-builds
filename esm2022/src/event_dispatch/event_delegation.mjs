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
 * @param multiContract - Experimental support to provide one event contract
 * when there are multiple binaries on the page.
 */
export function provideGlobalEventDelegation(multiContract = false) {
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
                if (multiContract && window.__jsaction_contract) {
                    eventContractDetails.instance = window.__jsaction_contract;
                    return;
                }
                initGlobalEventDelegation(eventContractDetails, injector);
                window.__jsaction_contract = eventContractDetails.instance;
            },
            multi: true,
        },
        {
            provide: GLOBAL_EVENT_DELEGATION,
            useClass: GlobalEventDelegation,
        },
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfZGVsZWdhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2V2ZW50X2Rpc3BhdGNoL2V2ZW50X2RlbGVnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLHVCQUF1QixFQUFFLFFBQVEsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUN4RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFcEQsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixxQkFBcUIsRUFDckIsdUJBQXVCLEVBQ3ZCLHlCQUF5QixHQUMxQixNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBUXZFOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsNEJBQTRCLENBQUMsYUFBYSxHQUFHLEtBQUs7SUFDaEUsT0FBTztRQUNMO1lBQ0UsT0FBTyxFQUFFLGtDQUFrQztZQUMzQyxRQUFRLEVBQUUsSUFBSTtTQUNmO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsdUJBQXVCO1lBQ2hDLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ2IsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxhQUFhLElBQUksTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQ2hELG9CQUFvQixDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUM7b0JBQzNELE9BQU87Z0JBQ1QsQ0FBQztnQkFDRCx5QkFBeUIsQ0FBQyxvQkFBb0IsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQztZQUM3RCxDQUFDO1lBQ0QsS0FBSyxFQUFFLElBQUk7U0FDWjtRQUNEO1lBQ0UsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxRQUFRLEVBQUUscUJBQXFCO1NBQ2hDO0tBQ0YsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFdmVudENvbnRyYWN0fSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgSW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7UHJvdmlkZXJ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge1xuICBHTE9CQUxfRVZFTlRfREVMRUdBVElPTixcbiAgR2xvYmFsRXZlbnREZWxlZ2F0aW9uLFxuICBKU0FDVElPTl9FVkVOVF9DT05UUkFDVCxcbiAgaW5pdEdsb2JhbEV2ZW50RGVsZWdhdGlvbixcbn0gZnJvbSAnLi4vZXZlbnRfZGVsZWdhdGlvbl91dGlscyc7XG5cbmltcG9ydCB7SVNfR0xPQkFMX0VWRU5UX0RFTEVHQVRJT05fRU5BQkxFRH0gZnJvbSAnLi4vaHlkcmF0aW9uL3Rva2Vucyc7XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgX19qc2FjdGlvbl9jb250cmFjdDogRXZlbnRDb250cmFjdCB8IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBzZXQgb2YgcHJvdmlkZXJzIHJlcXVpcmVkIHRvIHNldHVwIHN1cHBvcnQgZm9yIGV2ZW50IGRlbGVnYXRpb24uXG4gKiBAcGFyYW0gbXVsdGlDb250cmFjdCAtIEV4cGVyaW1lbnRhbCBzdXBwb3J0IHRvIHByb3ZpZGUgb25lIGV2ZW50IGNvbnRyYWN0XG4gKiB3aGVuIHRoZXJlIGFyZSBtdWx0aXBsZSBiaW5hcmllcyBvbiB0aGUgcGFnZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVHbG9iYWxFdmVudERlbGVnYXRpb24obXVsdGlDb250cmFjdCA9IGZhbHNlKTogUHJvdmlkZXJbXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfR0xPQkFMX0VWRU5UX0RFTEVHQVRJT05fRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gICAgICAgIGNvbnN0IGV2ZW50Q29udHJhY3REZXRhaWxzID0gaW5qZWN0b3IuZ2V0KEpTQUNUSU9OX0VWRU5UX0NPTlRSQUNUKTtcbiAgICAgICAgaWYgKG11bHRpQ29udHJhY3QgJiYgd2luZG93Ll9fanNhY3Rpb25fY29udHJhY3QpIHtcbiAgICAgICAgICBldmVudENvbnRyYWN0RGV0YWlscy5pbnN0YW5jZSA9IHdpbmRvdy5fX2pzYWN0aW9uX2NvbnRyYWN0O1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpbml0R2xvYmFsRXZlbnREZWxlZ2F0aW9uKGV2ZW50Q29udHJhY3REZXRhaWxzLCBpbmplY3Rvcik7XG4gICAgICAgIHdpbmRvdy5fX2pzYWN0aW9uX2NvbnRyYWN0ID0gZXZlbnRDb250cmFjdERldGFpbHMuaW5zdGFuY2U7XG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBHTE9CQUxfRVZFTlRfREVMRUdBVElPTixcbiAgICAgIHVzZUNsYXNzOiBHbG9iYWxFdmVudERlbGVnYXRpb24sXG4gICAgfSxcbiAgXTtcbn1cbiJdfQ==