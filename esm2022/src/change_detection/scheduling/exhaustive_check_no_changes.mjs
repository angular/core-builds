/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef } from '../../application/application_ref';
import { ChangeDetectionSchedulerImpl } from './zoneless_scheduling_impl';
import { inject } from '../../di/injector_compatibility';
import { makeEnvironmentProviders } from '../../di/provider_collection';
import { NgZone } from '../../zone/ng_zone';
import { EnvironmentInjector } from '../../di/r3_injector';
import { ENVIRONMENT_INITIALIZER } from '../../di/initializer_token';
import { CheckNoChangesMode } from '../../render3/state';
import { ErrorHandler } from '../../error_handler';
import { checkNoChangesInternal } from '../../render3/instructions/change_detection';
import { ZONELESS_ENABLED } from './zoneless_scheduling';
/**
 * Used to periodically verify no expressions have changed after they were checked.
 *
 * @param options Used to configure when the check will execute.
 *   - `interval` will periodically run exhaustive `checkNoChanges` on application views
 *   - `useNgZoneOnStable` will us ZoneJS to determine when change detection might have run
 *      in an application using ZoneJS to drive change detection. When the `NgZone.onStable` would
 *      have emit, all views attached to the `ApplicationRef` are checked for changes.
 *   - 'exhaustive' means that all views attached to `ApplicationRef` and all the descendants of those views will be
 *     checked for changes (excluding those subtrees which are detached via `ChangeDetectorRef.detach()`).
 *     This is useful because the check that runs after regular change detection does not work for components using `ChangeDetectionStrategy.OnPush`.
 *     This check is will surface any existing errors hidden by `OnPush` components. By default, this check is exhaustive
 *     and will always check all views, regardless of their "dirty" state and `ChangeDetectionStrategy`.
 *
 * When the `useNgZoneOnStable` option is `true`, this function will provide its own `NgZone` implementation and needs
 * to come after any other `NgZone` provider, including `provideZoneChangeDetection()` and `provideExperimentalZonelessChangeDetection()`.
 *
 * @experimental
 * @publicApi
 */
export function provideExperimentalCheckNoChangesForDebug(options) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
        if (options.interval === undefined && !options.useNgZoneOnStable) {
            throw new Error('Must provide one of `useNgZoneOnStable` or `interval`');
        }
        const checkNoChangesMode = options?.exhaustive === false
            ? CheckNoChangesMode.OnlyDirtyViews
            : CheckNoChangesMode.Exhaustive;
        return makeEnvironmentProviders([
            options?.useNgZoneOnStable
                ? { provide: NgZone, useFactory: () => new DebugNgZoneForCheckNoChanges(checkNoChangesMode) }
                : [],
            options?.interval !== undefined
                ? exhaustiveCheckNoChangesInterval(options.interval, checkNoChangesMode)
                : [],
            {
                provide: ENVIRONMENT_INITIALIZER,
                multi: true,
                useValue: () => {
                    if (options?.useNgZoneOnStable &&
                        !(inject(NgZone) instanceof DebugNgZoneForCheckNoChanges)) {
                        throw new Error('`provideCheckNoChangesForDebug` with `useNgZoneOnStable` must be after any other provider for `NgZone`.');
                    }
                },
            },
        ]);
    }
    else {
        return makeEnvironmentProviders([]);
    }
}
export class DebugNgZoneForCheckNoChanges extends NgZone {
    constructor(checkNoChangesMode) {
        const zonelessEnabled = inject(ZONELESS_ENABLED);
        // Use coalsecing to ensure we aren't ever running this check synchronously
        super({
            shouldCoalesceEventChangeDetection: true,
            shouldCoalesceRunChangeDetection: zonelessEnabled,
        });
        this.checkNoChangesMode = checkNoChangesMode;
        this.injector = inject(EnvironmentInjector);
        if (zonelessEnabled) {
            // prevent emits to ensure code doesn't rely on these
            this.onMicrotaskEmpty.emit = () => { };
            this.onStable.emit = () => {
                this.scheduler ||= this.injector.get(ChangeDetectionSchedulerImpl);
                if (this.scheduler.pendingRenderTaskId || this.scheduler.runningTick) {
                    return;
                }
                this.checkApplicationViews();
            };
            this.onUnstable.emit = () => { };
        }
        else {
            this.runOutsideAngular(() => {
                this.onStable.subscribe(() => {
                    this.checkApplicationViews();
                });
            });
        }
    }
    checkApplicationViews() {
        this.applicationRef ||= this.injector.get(ApplicationRef);
        for (const view of this.applicationRef.allViews) {
            try {
                checkNoChangesInternal(view._lView, this.checkNoChangesMode, view.notifyErrorHandler);
            }
            catch (e) {
                this.errorHandler ||= this.injector.get(ErrorHandler);
                this.errorHandler.handleError(e);
            }
        }
    }
}
function exhaustiveCheckNoChangesInterval(interval, checkNoChangesMode) {
    return {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useFactory: () => {
            const applicationRef = inject(ApplicationRef);
            const errorHandler = inject(ErrorHandler);
            const scheduler = inject(ChangeDetectionSchedulerImpl);
            const ngZone = inject(NgZone);
            return () => {
                function scheduleCheckNoChanges() {
                    ngZone.runOutsideAngular(() => {
                        setTimeout(() => {
                            if (applicationRef.destroyed) {
                                return;
                            }
                            if (scheduler.pendingRenderTaskId || scheduler.runningTick) {
                                scheduleCheckNoChanges();
                                return;
                            }
                            for (const view of applicationRef.allViews) {
                                try {
                                    checkNoChangesInternal(view._lView, checkNoChangesMode, view.notifyErrorHandler);
                                }
                                catch (e) {
                                    errorHandler.handleError(e);
                                }
                            }
                            scheduleCheckNoChanges();
                        }, interval);
                    });
                }
                scheduleCheckNoChanges();
            };
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhoYXVzdGl2ZV9jaGVja19ub19jaGFuZ2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL2V4aGF1c3RpdmVfY2hlY2tfbm9fY2hhbmdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUFDLDRCQUE0QixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDeEUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3ZELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUUxQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNuRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN2RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sNkNBQTZDLENBQUM7QUFDbkYsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFdkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUseUNBQXlDLENBQUMsT0FJekQ7SUFDQyxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUNsRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssU0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDakUsTUFBTSxJQUFJLEtBQUssQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFDRCxNQUFNLGtCQUFrQixHQUN0QixPQUFPLEVBQUUsVUFBVSxLQUFLLEtBQUs7WUFDM0IsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLGNBQWM7WUFDbkMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQztRQUNwQyxPQUFPLHdCQUF3QixDQUFDO1lBQzlCLE9BQU8sRUFBRSxpQkFBaUI7Z0JBQ3hCLENBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksNEJBQTRCLENBQUMsa0JBQWtCLENBQUMsRUFBQztnQkFDM0YsQ0FBQyxDQUFDLEVBQUU7WUFDTixPQUFPLEVBQUUsUUFBUSxLQUFLLFNBQVM7Z0JBQzdCLENBQUMsQ0FBQyxnQ0FBZ0MsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGtCQUFrQixDQUFDO2dCQUN4RSxDQUFDLENBQUMsRUFBRTtZQUNOO2dCQUNFLE9BQU8sRUFBRSx1QkFBdUI7Z0JBQ2hDLEtBQUssRUFBRSxJQUFJO2dCQUNYLFFBQVEsRUFBRSxHQUFHLEVBQUU7b0JBQ2IsSUFDRSxPQUFPLEVBQUUsaUJBQWlCO3dCQUMxQixDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLDRCQUE0QixDQUFDLEVBQ3pELENBQUM7d0JBQ0QsTUFBTSxJQUFJLEtBQUssQ0FDYix5R0FBeUcsQ0FDMUcsQ0FBQztvQkFDSixDQUFDO2dCQUNILENBQUM7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyx3QkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0QyxDQUFDO0FBQ0gsQ0FBQztBQUVELE1BQU0sT0FBTyw0QkFBNkIsU0FBUSxNQUFNO0lBTXRELFlBQTZCLGtCQUFzQztRQUNqRSxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNqRCwyRUFBMkU7UUFDM0UsS0FBSyxDQUFDO1lBQ0osa0NBQWtDLEVBQUUsSUFBSTtZQUN4QyxnQ0FBZ0MsRUFBRSxlQUFlO1NBQ2xELENBQUMsQ0FBQztRQU53Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1FBRmxELGFBQVEsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQVV0RCxJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3BCLHFEQUFxRDtZQUNyRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3JFLE9BQU87Z0JBQ1QsQ0FBQztnQkFDRCxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUMvQixDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUM7UUFDbEMsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7b0JBQzNCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUMvQixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUM7SUFFTyxxQkFBcUI7UUFDM0IsSUFBSSxDQUFDLGNBQWMsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMxRCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEQsSUFBSSxDQUFDO2dCQUNILHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hGLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsU0FBUyxnQ0FBZ0MsQ0FDdkMsUUFBZ0IsRUFDaEIsa0JBQXNDO0lBRXRDLE9BQU87UUFDTCxPQUFPLEVBQUUsdUJBQXVCO1FBQ2hDLEtBQUssRUFBRSxJQUFJO1FBQ1gsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNmLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM5QyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDMUMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDdkQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTlCLE9BQU8sR0FBRyxFQUFFO2dCQUNWLFNBQVMsc0JBQXNCO29CQUM3QixNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO3dCQUM1QixVQUFVLENBQUMsR0FBRyxFQUFFOzRCQUNkLElBQUksY0FBYyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dDQUM3QixPQUFPOzRCQUNULENBQUM7NEJBQ0QsSUFBSSxTQUFTLENBQUMsbUJBQW1CLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dDQUMzRCxzQkFBc0IsRUFBRSxDQUFDO2dDQUN6QixPQUFPOzRCQUNULENBQUM7NEJBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7Z0NBQzNDLElBQUksQ0FBQztvQ0FDSCxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dDQUNuRixDQUFDO2dDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0NBQ1gsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDOUIsQ0FBQzs0QkFDSCxDQUFDOzRCQUVELHNCQUFzQixFQUFFLENBQUM7d0JBQzNCLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDZixDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDO2dCQUNELHNCQUFzQixFQUFFLENBQUM7WUFDM0IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7bWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcl9jb2xsZWN0aW9uJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi8uLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7RU5WSVJPTk1FTlRfSU5JVElBTElaRVJ9IGZyb20gJy4uLy4uL2RpL2luaXRpYWxpemVyX3Rva2VuJztcbmltcG9ydCB7Q2hlY2tOb0NoYW5nZXNNb2RlfSBmcm9tICcuLi8uLi9yZW5kZXIzL3N0YXRlJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi8uLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7Y2hlY2tOb0NoYW5nZXNJbnRlcm5hbH0gZnJvbSAnLi4vLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge1pPTkVMRVNTX0VOQUJMRUR9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5cbi8qKlxuICogVXNlZCB0byBwZXJpb2RpY2FsbHkgdmVyaWZ5IG5vIGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhZnRlciB0aGV5IHdlcmUgY2hlY2tlZC5cbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBVc2VkIHRvIGNvbmZpZ3VyZSB3aGVuIHRoZSBjaGVjayB3aWxsIGV4ZWN1dGUuXG4gKiAgIC0gYGludGVydmFsYCB3aWxsIHBlcmlvZGljYWxseSBydW4gZXhoYXVzdGl2ZSBgY2hlY2tOb0NoYW5nZXNgIG9uIGFwcGxpY2F0aW9uIHZpZXdzXG4gKiAgIC0gYHVzZU5nWm9uZU9uU3RhYmxlYCB3aWxsIHVzIFpvbmVKUyB0byBkZXRlcm1pbmUgd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIG1pZ2h0IGhhdmUgcnVuXG4gKiAgICAgIGluIGFuIGFwcGxpY2F0aW9uIHVzaW5nIFpvbmVKUyB0byBkcml2ZSBjaGFuZ2UgZGV0ZWN0aW9uLiBXaGVuIHRoZSBgTmdab25lLm9uU3RhYmxlYCB3b3VsZFxuICogICAgICBoYXZlIGVtaXQsIGFsbCB2aWV3cyBhdHRhY2hlZCB0byB0aGUgYEFwcGxpY2F0aW9uUmVmYCBhcmUgY2hlY2tlZCBmb3IgY2hhbmdlcy5cbiAqICAgLSAnZXhoYXVzdGl2ZScgbWVhbnMgdGhhdCBhbGwgdmlld3MgYXR0YWNoZWQgdG8gYEFwcGxpY2F0aW9uUmVmYCBhbmQgYWxsIHRoZSBkZXNjZW5kYW50cyBvZiB0aG9zZSB2aWV3cyB3aWxsIGJlXG4gKiAgICAgY2hlY2tlZCBmb3IgY2hhbmdlcyAoZXhjbHVkaW5nIHRob3NlIHN1YnRyZWVzIHdoaWNoIGFyZSBkZXRhY2hlZCB2aWEgYENoYW5nZURldGVjdG9yUmVmLmRldGFjaCgpYCkuXG4gKiAgICAgVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSB0aGUgY2hlY2sgdGhhdCBydW5zIGFmdGVyIHJlZ3VsYXIgY2hhbmdlIGRldGVjdGlvbiBkb2VzIG5vdCB3b3JrIGZvciBjb21wb25lbnRzIHVzaW5nIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2hgLlxuICogICAgIFRoaXMgY2hlY2sgaXMgd2lsbCBzdXJmYWNlIGFueSBleGlzdGluZyBlcnJvcnMgaGlkZGVuIGJ5IGBPblB1c2hgIGNvbXBvbmVudHMuIEJ5IGRlZmF1bHQsIHRoaXMgY2hlY2sgaXMgZXhoYXVzdGl2ZVxuICogICAgIGFuZCB3aWxsIGFsd2F5cyBjaGVjayBhbGwgdmlld3MsIHJlZ2FyZGxlc3Mgb2YgdGhlaXIgXCJkaXJ0eVwiIHN0YXRlIGFuZCBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgLlxuICpcbiAqIFdoZW4gdGhlIGB1c2VOZ1pvbmVPblN0YWJsZWAgb3B0aW9uIGlzIGB0cnVlYCwgdGhpcyBmdW5jdGlvbiB3aWxsIHByb3ZpZGUgaXRzIG93biBgTmdab25lYCBpbXBsZW1lbnRhdGlvbiBhbmQgbmVlZHNcbiAqIHRvIGNvbWUgYWZ0ZXIgYW55IG90aGVyIGBOZ1pvbmVgIHByb3ZpZGVyLCBpbmNsdWRpbmcgYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKClgIGFuZCBgcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKClgLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVFeHBlcmltZW50YWxDaGVja05vQ2hhbmdlc0ZvckRlYnVnKG9wdGlvbnM6IHtcbiAgaW50ZXJ2YWw/OiBudW1iZXI7XG4gIHVzZU5nWm9uZU9uU3RhYmxlPzogYm9vbGVhbjtcbiAgZXhoYXVzdGl2ZT86IGJvb2xlYW47XG59KSB7XG4gIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICBpZiAob3B0aW9ucy5pbnRlcnZhbCA9PT0gdW5kZWZpbmVkICYmICFvcHRpb25zLnVzZU5nWm9uZU9uU3RhYmxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3QgcHJvdmlkZSBvbmUgb2YgYHVzZU5nWm9uZU9uU3RhYmxlYCBvciBgaW50ZXJ2YWxgJyk7XG4gICAgfVxuICAgIGNvbnN0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9XG4gICAgICBvcHRpb25zPy5leGhhdXN0aXZlID09PSBmYWxzZVxuICAgICAgICA/IENoZWNrTm9DaGFuZ2VzTW9kZS5Pbmx5RGlydHlWaWV3c1xuICAgICAgICA6IENoZWNrTm9DaGFuZ2VzTW9kZS5FeGhhdXN0aXZlO1xuICAgIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgICAgb3B0aW9ucz8udXNlTmdab25lT25TdGFibGVcbiAgICAgICAgPyB7cHJvdmlkZTogTmdab25lLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgRGVidWdOZ1pvbmVGb3JDaGVja05vQ2hhbmdlcyhjaGVja05vQ2hhbmdlc01vZGUpfVxuICAgICAgICA6IFtdLFxuICAgICAgb3B0aW9ucz8uaW50ZXJ2YWwgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IGV4aGF1c3RpdmVDaGVja05vQ2hhbmdlc0ludGVydmFsKG9wdGlvbnMuaW50ZXJ2YWwsIGNoZWNrTm9DaGFuZ2VzTW9kZSlcbiAgICAgICAgOiBbXSxcbiAgICAgIHtcbiAgICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG9wdGlvbnM/LnVzZU5nWm9uZU9uU3RhYmxlICYmXG4gICAgICAgICAgICAhKGluamVjdChOZ1pvbmUpIGluc3RhbmNlb2YgRGVidWdOZ1pvbmVGb3JDaGVja05vQ2hhbmdlcylcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgJ2Bwcm92aWRlQ2hlY2tOb0NoYW5nZXNGb3JEZWJ1Z2Agd2l0aCBgdXNlTmdab25lT25TdGFibGVgIG11c3QgYmUgYWZ0ZXIgYW55IG90aGVyIHByb3ZpZGVyIGZvciBgTmdab25lYC4nLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW10pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEZWJ1Z05nWm9uZUZvckNoZWNrTm9DaGFuZ2VzIGV4dGVuZHMgTmdab25lIHtcbiAgcHJpdmF0ZSBhcHBsaWNhdGlvblJlZj86IEFwcGxpY2F0aW9uUmVmO1xuICBwcml2YXRlIHNjaGVkdWxlcj86IENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGw7XG4gIHByaXZhdGUgZXJyb3JIYW5kbGVyPzogRXJyb3JIYW5kbGVyO1xuICBwcml2YXRlIHJlYWRvbmx5IGluamVjdG9yID0gaW5qZWN0KEVudmlyb25tZW50SW5qZWN0b3IpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgY2hlY2tOb0NoYW5nZXNNb2RlOiBDaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBjb25zdCB6b25lbGVzc0VuYWJsZWQgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCk7XG4gICAgLy8gVXNlIGNvYWxzZWNpbmcgdG8gZW5zdXJlIHdlIGFyZW4ndCBldmVyIHJ1bm5pbmcgdGhpcyBjaGVjayBzeW5jaHJvbm91c2x5XG4gICAgc3VwZXIoe1xuICAgICAgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbjogdHJ1ZSxcbiAgICAgIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uOiB6b25lbGVzc0VuYWJsZWQsXG4gICAgfSk7XG5cbiAgICBpZiAoem9uZWxlc3NFbmFibGVkKSB7XG4gICAgICAvLyBwcmV2ZW50IGVtaXRzIHRvIGVuc3VyZSBjb2RlIGRvZXNuJ3QgcmVseSBvbiB0aGVzZVxuICAgICAgdGhpcy5vbk1pY3JvdGFza0VtcHR5LmVtaXQgPSAoKSA9PiB7fTtcbiAgICAgIHRoaXMub25TdGFibGUuZW1pdCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zY2hlZHVsZXIgfHw9IHRoaXMuaW5qZWN0b3IuZ2V0KENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwpO1xuICAgICAgICBpZiAodGhpcy5zY2hlZHVsZXIucGVuZGluZ1JlbmRlclRhc2tJZCB8fCB0aGlzLnNjaGVkdWxlci5ydW5uaW5nVGljaykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoZWNrQXBwbGljYXRpb25WaWV3cygpO1xuICAgICAgfTtcbiAgICAgIHRoaXMub25VbnN0YWJsZS5lbWl0ID0gKCkgPT4ge307XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICB0aGlzLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jaGVja0FwcGxpY2F0aW9uVmlld3MoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoZWNrQXBwbGljYXRpb25WaWV3cygpIHtcbiAgICB0aGlzLmFwcGxpY2F0aW9uUmVmIHx8PSB0aGlzLmluamVjdG9yLmdldChBcHBsaWNhdGlvblJlZik7XG4gICAgZm9yIChjb25zdCB2aWV3IG9mIHRoaXMuYXBwbGljYXRpb25SZWYuYWxsVmlld3MpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWwodmlldy5fbFZpZXcsIHRoaXMuY2hlY2tOb0NoYW5nZXNNb2RlLCB2aWV3Lm5vdGlmeUVycm9ySGFuZGxlcik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMuZXJyb3JIYW5kbGVyIHx8PSB0aGlzLmluamVjdG9yLmdldChFcnJvckhhbmRsZXIpO1xuICAgICAgICB0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhoYXVzdGl2ZUNoZWNrTm9DaGFuZ2VzSW50ZXJ2YWwoXG4gIGludGVydmFsOiBudW1iZXIsXG4gIGNoZWNrTm9DaGFuZ2VzTW9kZTogQ2hlY2tOb0NoYW5nZXNNb2RlLFxuKSB7XG4gIHJldHVybiB7XG4gICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgbXVsdGk6IHRydWUsXG4gICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgY29uc3QgYXBwbGljYXRpb25SZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICAgICAgY29uc3QgZXJyb3JIYW5kbGVyID0gaW5qZWN0KEVycm9ySGFuZGxlcik7XG4gICAgICBjb25zdCBzY2hlZHVsZXIgPSBpbmplY3QoQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbCk7XG4gICAgICBjb25zdCBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZnVuY3Rpb24gc2NoZWR1bGVDaGVja05vQ2hhbmdlcygpIHtcbiAgICAgICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhcHBsaWNhdGlvblJlZi5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHNjaGVkdWxlci5wZW5kaW5nUmVuZGVyVGFza0lkIHx8IHNjaGVkdWxlci5ydW5uaW5nVGljaykge1xuICAgICAgICAgICAgICAgIHNjaGVkdWxlQ2hlY2tOb0NoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHZpZXcgb2YgYXBwbGljYXRpb25SZWYuYWxsVmlld3MpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY2hlY2tOb0NoYW5nZXNJbnRlcm5hbCh2aWV3Ll9sVmlldywgY2hlY2tOb0NoYW5nZXNNb2RlLCB2aWV3Lm5vdGlmeUVycm9ySGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNjaGVkdWxlQ2hlY2tOb0NoYW5nZXMoKTtcbiAgICAgICAgICAgIH0sIGludGVydmFsKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzY2hlZHVsZUNoZWNrTm9DaGFuZ2VzKCk7XG4gICAgICB9O1xuICAgIH0sXG4gIH07XG59XG4iXX0=