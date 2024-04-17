/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Subscription } from 'rxjs';
import { ApplicationRef } from '../../application/application_ref';
import { ENVIRONMENT_INITIALIZER, inject, Injectable, InjectionToken, makeEnvironmentProviders } from '../../di';
import { ErrorHandler, INTERNAL_APPLICATION_ERROR_HANDLER } from '../../error_handler';
import { RuntimeError } from '../../errors';
import { PendingTasks } from '../../pending_tasks';
import { performanceMarkFeature } from '../../util/performance';
import { NgZone } from '../../zone';
import { alwaysProvideZonelessScheduler } from './flags';
import { ChangeDetectionScheduler, ZONELESS_SCHEDULER_DISABLED } from './zoneless_scheduling';
import { ChangeDetectionSchedulerImpl } from './zoneless_scheduling_impl';
import * as i0 from "../../r3_symbols";
export class NgZoneChangeDetectionScheduler {
    constructor() {
        this.zone = inject(NgZone);
        this.changeDetectionScheduler = inject(ChangeDetectionScheduler, { optional: true });
        this.applicationRef = inject(ApplicationRef);
    }
    initialize() {
        if (this._onMicrotaskEmptySubscription) {
            return;
        }
        this._onMicrotaskEmptySubscription = this.zone.onMicrotaskEmpty.subscribe({
            next: () => {
                // `onMicroTaskEmpty` can happen _during_ the zoneless scheduler change detection because
                // zone.run(() => {}) will result in `checkStable` at the end of the `zone.run` closure
                // and emit `onMicrotaskEmpty` synchronously if run coalsecing is false.
                if (this.changeDetectionScheduler?.runningTick) {
                    return;
                }
                this.zone.run(() => {
                    this.applicationRef.tick();
                });
            }
        });
    }
    ngOnDestroy() {
        this._onMicrotaskEmptySubscription?.unsubscribe();
    }
    static { this.ɵfac = function NgZoneChangeDetectionScheduler_Factory(t) { return new (t || NgZoneChangeDetectionScheduler)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: NgZoneChangeDetectionScheduler, factory: NgZoneChangeDetectionScheduler.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(NgZoneChangeDetectionScheduler, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
/**
 * Internal token used to verify that `provideZoneChangeDetection` is not used
 * with the bootstrapModule API.
 */
export const PROVIDED_NG_ZONE = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'provideZoneChangeDetection token' : '');
export function internalProvideZoneChangeDetection({ ngZoneFactory, ignoreChangesOutsideZone }) {
    return [
        { provide: NgZone, useFactory: ngZoneFactory },
        {
            provide: ENVIRONMENT_INITIALIZER,
            multi: true,
            useFactory: () => {
                const ngZoneChangeDetectionScheduler = inject(NgZoneChangeDetectionScheduler, { optional: true });
                if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
                    ngZoneChangeDetectionScheduler === null) {
                    throw new RuntimeError(402 /* RuntimeErrorCode.MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP */, `A required Injectable was not found in the dependency injection tree. ` +
                        'If you are bootstrapping an NgModule, make sure that the `BrowserModule` is imported.');
                }
                return () => ngZoneChangeDetectionScheduler.initialize();
            },
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            multi: true,
            useFactory: () => {
                const service = inject(ZoneStablePendingTask);
                return () => {
                    service.initialize();
                };
            }
        },
        { provide: INTERNAL_APPLICATION_ERROR_HANDLER, useFactory: ngZoneApplicationErrorHandlerFactory },
        // Always disable scheduler whenever explicitly disabled, even if another place called
        // `provideZoneChangeDetection` without the 'ignore' option.
        ignoreChangesOutsideZone === true ? { provide: ZONELESS_SCHEDULER_DISABLED, useValue: true } : [],
        // TODO(atscott): This should move to the same places that zone change detection is provided by
        // default instead of being in the zone scheduling providers.
        alwaysProvideZonelessScheduler || ignoreChangesOutsideZone === false ?
            { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl } :
            [],
    ];
}
export function ngZoneApplicationErrorHandlerFactory() {
    const zone = inject(NgZone);
    const userErrorHandler = inject(ErrorHandler);
    return (e) => zone.runOutsideAngular(() => userErrorHandler.handleError(e));
}
/**
 * Provides `NgZone`-based change detection for the application bootstrapped using
 * `bootstrapApplication`.
 *
 * `NgZone` is already provided in applications by default. This provider allows you to configure
 * options like `eventCoalescing` in the `NgZone`.
 * This provider is not available for `platformBrowser().bootstrapModule`, which uses
 * `BootstrapOptions` instead.
 *
 * @usageNotes
 * ```typescript
 * bootstrapApplication(MyApp, {providers: [
 *   provideZoneChangeDetection({eventCoalescing: true}),
 * ]});
 * ```
 *
 * @publicApi
 * @see {@link bootstrapApplication}
 * @see {@link NgZoneOptions}
 */
export function provideZoneChangeDetection(options) {
    const ignoreChangesOutsideZone = options?.ignoreChangesOutsideZone;
    const zoneProviders = internalProvideZoneChangeDetection({
        ngZoneFactory: () => {
            const ngZoneOptions = getNgZoneOptions(options);
            if (ngZoneOptions.shouldCoalesceEventChangeDetection) {
                performanceMarkFeature('NgZone_CoalesceEvent');
            }
            return new NgZone(ngZoneOptions);
        },
        ignoreChangesOutsideZone
    });
    return makeEnvironmentProviders([
        (typeof ngDevMode === 'undefined' || ngDevMode) ? { provide: PROVIDED_NG_ZONE, useValue: true } :
            [],
        zoneProviders,
    ]);
}
// Transforms a set of `BootstrapOptions` (supported by the NgModule-based bootstrap APIs) ->
// `NgZoneOptions` that are recognized by the NgZone constructor. Passing no options will result in
// a set of default options returned.
export function getNgZoneOptions(options) {
    return {
        enableLongStackTrace: typeof ngDevMode === 'undefined' ? false : !!ngDevMode,
        shouldCoalesceEventChangeDetection: options?.eventCoalescing ?? false,
        shouldCoalesceRunChangeDetection: options?.runCoalescing ?? false,
    };
}
export class ZoneStablePendingTask {
    constructor() {
        this.subscription = new Subscription();
        this.initialized = false;
        this.zone = inject(NgZone);
        this.pendingTasks = inject(PendingTasks);
    }
    initialize() {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        let task = null;
        if (!this.zone.isStable && !this.zone.hasPendingMacrotasks && !this.zone.hasPendingMicrotasks) {
            task = this.pendingTasks.add();
        }
        this.zone.runOutsideAngular(() => {
            this.subscription.add(this.zone.onStable.subscribe(() => {
                NgZone.assertNotInAngularZone();
                // Check whether there are no pending macro/micro tasks in the next tick
                // to allow for NgZone to update the state.
                queueMicrotask(() => {
                    if (task !== null && !this.zone.hasPendingMacrotasks && !this.zone.hasPendingMicrotasks) {
                        this.pendingTasks.remove(task);
                        task = null;
                    }
                });
            }));
        });
        this.subscription.add(this.zone.onUnstable.subscribe(() => {
            NgZone.assertInAngularZone();
            task ??= this.pendingTasks.add();
        }));
    }
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
    static { this.ɵfac = function ZoneStablePendingTask_Factory(t) { return new (t || ZoneStablePendingTask)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ZoneStablePendingTask, factory: ZoneStablePendingTask.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ZoneStablePendingTask, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9zY2hlZHVsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL25nX3pvbmVfc2NoZWR1bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFpQixNQUFNLFVBQVUsQ0FBQztBQUNySixPQUFPLEVBQUMsWUFBWSxFQUFFLGtDQUFrQyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckYsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHbEMsT0FBTyxFQUFDLDhCQUE4QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3ZELE9BQU8sRUFBQyx3QkFBd0IsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyw0QkFBNEIsRUFBQyxNQUFNLDRCQUE0QixDQUFDOztBQUd4RSxNQUFNLE9BQU8sOEJBQThCO0lBRDNDO1FBRW1CLFNBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsNkJBQXdCLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDOUUsbUJBQWMsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7S0EyQjFEO0lBdkJDLFVBQVU7UUFDUixJQUFJLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1lBQ3ZDLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxDQUFDLDZCQUE2QixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDO1lBQ3hFLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBQ1QseUZBQXlGO2dCQUN6Rix1RkFBdUY7Z0JBQ3ZGLHdFQUF3RTtnQkFDeEUsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLENBQUM7b0JBQy9DLE9BQU87Z0JBQ1QsQ0FBQztnQkFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7b0JBQ2pCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzdCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLDZCQUE2QixFQUFFLFdBQVcsRUFBRSxDQUFDO0lBQ3BELENBQUM7K0ZBN0JVLDhCQUE4Qjt1RUFBOUIsOEJBQThCLFdBQTlCLDhCQUE4QixtQkFEbEIsTUFBTTs7Z0ZBQ2xCLDhCQUE4QjtjQUQxQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQWtDaEM7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQzlDLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFFL0YsTUFBTSxVQUFVLGtDQUFrQyxDQUM5QyxFQUFDLGFBQWEsRUFBRSx3QkFBd0IsRUFDNkI7SUFDdkUsT0FBTztRQUNMLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFDO1FBQzVDO1lBQ0UsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxLQUFLLEVBQUUsSUFBSTtZQUNYLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2YsTUFBTSw4QkFBOEIsR0FDaEMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7Z0JBQzdELElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDO29CQUMvQyw4QkFBOEIsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDNUMsTUFBTSxJQUFJLFlBQVksc0VBRWxCLHdFQUF3RTt3QkFDcEUsdUZBQXVGLENBQUMsQ0FBQztnQkFDbkcsQ0FBQztnQkFDRCxPQUFPLEdBQUcsRUFBRSxDQUFDLDhCQUErQixDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzVELENBQUM7U0FDRjtRQUNEO1lBQ0UsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxLQUFLLEVBQUUsSUFBSTtZQUNYLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2YsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQzlDLE9BQU8sR0FBRyxFQUFFO29CQUNWLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdkIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztTQUNGO1FBQ0QsRUFBQyxPQUFPLEVBQUUsa0NBQWtDLEVBQUUsVUFBVSxFQUFFLG9DQUFvQyxFQUFDO1FBQy9GLHNGQUFzRjtRQUN0Riw0REFBNEQ7UUFDNUQsd0JBQXdCLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSwyQkFBMkIsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDL0YsK0ZBQStGO1FBQy9GLDZEQUE2RDtRQUM3RCw4QkFBOEIsSUFBSSx3QkFBd0IsS0FBSyxLQUFLLENBQUMsQ0FBQztZQUNsRSxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsNEJBQTRCLEVBQUMsQ0FBQyxDQUFDO1lBQ2hGLEVBQUU7S0FDUCxDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sVUFBVSxvQ0FBb0M7SUFDbEQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVCLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzlDLE9BQU8sQ0FBQyxDQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsT0FBdUI7SUFDaEUsTUFBTSx3QkFBd0IsR0FBRyxPQUFPLEVBQUUsd0JBQXdCLENBQUM7SUFDbkUsTUFBTSxhQUFhLEdBQUcsa0NBQWtDLENBQUM7UUFDdkQsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQUNsQixNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoRCxJQUFJLGFBQWEsQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDO2dCQUNyRCxzQkFBc0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRCxPQUFPLElBQUksTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFDRCx3QkFBd0I7S0FDekIsQ0FBQyxDQUFDO0lBQ0gsT0FBTyx3QkFBd0IsQ0FBQztRQUM5QixDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7WUFDN0MsRUFBRTtRQUNwRCxhQUFhO0tBQ2QsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQW9FRCw2RkFBNkY7QUFDN0YsbUdBQW1HO0FBQ25HLHFDQUFxQztBQUNyQyxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsT0FBdUI7SUFDdEQsT0FBTztRQUNMLG9CQUFvQixFQUFFLE9BQU8sU0FBUyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztRQUM1RSxrQ0FBa0MsRUFBRSxPQUFPLEVBQUUsZUFBZSxJQUFJLEtBQUs7UUFDckUsZ0NBQWdDLEVBQUUsT0FBTyxFQUFFLGFBQWEsSUFBSSxLQUFLO0tBQ2xFLENBQUM7QUFDSixDQUFDO0FBR0QsTUFBTSxPQUFPLHFCQUFxQjtJQURsQztRQUVtQixpQkFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDM0MsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFDWCxTQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLGlCQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBc0N0RDtJQXBDQyxVQUFVO1FBQ1IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckIsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUV4QixJQUFJLElBQUksR0FBZ0IsSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDOUYsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO1lBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3RELE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUVoQyx3RUFBd0U7Z0JBQ3hFLDJDQUEyQztnQkFDM0MsY0FBYyxDQUFDLEdBQUcsRUFBRTtvQkFDbEIsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzt3QkFDeEYsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQy9CLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ2QsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDeEQsTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDN0IsSUFBSSxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNOLENBQUM7SUFHRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNsQyxDQUFDO3NGQXpDVSxxQkFBcUI7dUVBQXJCLHFCQUFxQixXQUFyQixxQkFBcUIsbUJBRFQsTUFBTTs7Z0ZBQ2xCLHFCQUFxQjtjQURqQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7RU5WSVJPTk1FTlRfSU5JVElBTElaRVIsIEVudmlyb25tZW50UHJvdmlkZXJzLCBpbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlciwgSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi8uLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vLi4vem9uZSc7XG5pbXBvcnQge0ludGVybmFsTmdab25lT3B0aW9uc30gZnJvbSAnLi4vLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHthbHdheXNQcm92aWRlWm9uZWxlc3NTY2hlZHVsZXJ9IGZyb20gJy4vZmxhZ3MnO1xuaW1wb3J0IHtDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRH0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nJztcbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nX2ltcGwnO1xuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBOZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgcHJpdmF0ZSByZWFkb25seSBjaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPSBpbmplY3QoQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgcHJpdmF0ZSByZWFkb25seSBhcHBsaWNhdGlvblJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG5cbiAgcHJpdmF0ZSBfb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcblxuICBpbml0aWFsaXplKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbiA9IHRoaXMuem9uZS5vbk1pY3JvdGFza0VtcHR5LnN1YnNjcmliZSh7XG4gICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgIC8vIGBvbk1pY3JvVGFza0VtcHR5YCBjYW4gaGFwcGVuIF9kdXJpbmdfIHRoZSB6b25lbGVzcyBzY2hlZHVsZXIgY2hhbmdlIGRldGVjdGlvbiBiZWNhdXNlXG4gICAgICAgIC8vIHpvbmUucnVuKCgpID0+IHt9KSB3aWxsIHJlc3VsdCBpbiBgY2hlY2tTdGFibGVgIGF0IHRoZSBlbmQgb2YgdGhlIGB6b25lLnJ1bmAgY2xvc3VyZVxuICAgICAgICAvLyBhbmQgZW1pdCBgb25NaWNyb3Rhc2tFbXB0eWAgc3luY2hyb25vdXNseSBpZiBydW4gY29hbHNlY2luZyBpcyBmYWxzZS5cbiAgICAgICAgaWYgKHRoaXMuY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyPy5ydW5uaW5nVGljaykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmFwcGxpY2F0aW9uUmVmLnRpY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cblxuLyoqXG4gKiBJbnRlcm5hbCB0b2tlbiB1c2VkIHRvIHZlcmlmeSB0aGF0IGBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbmAgaXMgbm90IHVzZWRcbiAqIHdpdGggdGhlIGJvb3RzdHJhcE1vZHVsZSBBUEkuXG4gKi9cbmV4cG9ydCBjb25zdCBQUk9WSURFRF9OR19aT05FID0gbmV3IEluamVjdGlvblRva2VuPGJvb2xlYW4+KFxuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID8gJ3Byb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uIHRva2VuJyA6ICcnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsUHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oXG4gICAge25nWm9uZUZhY3RvcnksIGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZX06XG4gICAgICAgIHtuZ1pvbmVGYWN0b3J5OiAoKSA9PiBOZ1pvbmUsIGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZT86IGJvb2xlYW59KTogU3RhdGljUHJvdmlkZXJbXSB7XG4gIHJldHVybiBbXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlRmFjdG9yeTogbmdab25lRmFjdG9yeX0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgY29uc3Qgbmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID1cbiAgICAgICAgICAgIGluamVjdChOZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICAgICAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICAgICAgIG5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19SRVFVSVJFRF9JTkpFQ1RBQkxFX0lOX0JPT1RTVFJBUCxcbiAgICAgICAgICAgICAgYEEgcmVxdWlyZWQgSW5qZWN0YWJsZSB3YXMgbm90IGZvdW5kIGluIHRoZSBkZXBlbmRlbmN5IGluamVjdGlvbiB0cmVlLiBgICtcbiAgICAgICAgICAgICAgICAgICdJZiB5b3UgYXJlIGJvb3RzdHJhcHBpbmcgYW4gTmdNb2R1bGUsIG1ha2Ugc3VyZSB0aGF0IHRoZSBgQnJvd3Nlck1vZHVsZWAgaXMgaW1wb3J0ZWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICgpID0+IG5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciEuaW5pdGlhbGl6ZSgpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlcnZpY2UgPSBpbmplY3QoWm9uZVN0YWJsZVBlbmRpbmdUYXNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBzZXJ2aWNlLmluaXRpYWxpemUoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHtwcm92aWRlOiBJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSLCB1c2VGYWN0b3J5OiBuZ1pvbmVBcHBsaWNhdGlvbkVycm9ySGFuZGxlckZhY3Rvcnl9LFxuICAgIC8vIEFsd2F5cyBkaXNhYmxlIHNjaGVkdWxlciB3aGVuZXZlciBleHBsaWNpdGx5IGRpc2FibGVkLCBldmVuIGlmIGFub3RoZXIgcGxhY2UgY2FsbGVkXG4gICAgLy8gYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYCB3aXRob3V0IHRoZSAnaWdub3JlJyBvcHRpb24uXG4gICAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lID09PSB0cnVlID8ge3Byb3ZpZGU6IFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwgdXNlVmFsdWU6IHRydWV9IDogW10sXG4gICAgLy8gVE9ETyhhdHNjb3R0KTogVGhpcyBzaG91bGQgbW92ZSB0byB0aGUgc2FtZSBwbGFjZXMgdGhhdCB6b25lIGNoYW5nZSBkZXRlY3Rpb24gaXMgcHJvdmlkZWQgYnlcbiAgICAvLyBkZWZhdWx0IGluc3RlYWQgb2YgYmVpbmcgaW4gdGhlIHpvbmUgc2NoZWR1bGluZyBwcm92aWRlcnMuXG4gICAgYWx3YXlzUHJvdmlkZVpvbmVsZXNzU2NoZWR1bGVyIHx8IGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZSA9PT0gZmFsc2UgP1xuICAgICAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0gOlxuICAgICAgICBbXSxcbiAgXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5nWm9uZUFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyRmFjdG9yeSgpIHtcbiAgY29uc3Qgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBjb25zdCB1c2VyRXJyb3JIYW5kbGVyID0gaW5qZWN0KEVycm9ySGFuZGxlcik7XG4gIHJldHVybiAoZTogdW5rbm93bikgPT4gem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB1c2VyRXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBgTmdab25lYC1iYXNlZCBjaGFuZ2UgZGV0ZWN0aW9uIGZvciB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkIHVzaW5nXG4gKiBgYm9vdHN0cmFwQXBwbGljYXRpb25gLlxuICpcbiAqIGBOZ1pvbmVgIGlzIGFscmVhZHkgcHJvdmlkZWQgaW4gYXBwbGljYXRpb25zIGJ5IGRlZmF1bHQuIFRoaXMgcHJvdmlkZXIgYWxsb3dzIHlvdSB0byBjb25maWd1cmVcbiAqIG9wdGlvbnMgbGlrZSBgZXZlbnRDb2FsZXNjaW5nYCBpbiB0aGUgYE5nWm9uZWAuXG4gKiBUaGlzIHByb3ZpZGVyIGlzIG5vdCBhdmFpbGFibGUgZm9yIGBwbGF0Zm9ybUJyb3dzZXIoKS5ib290c3RyYXBNb2R1bGVgLCB3aGljaCB1c2VzXG4gKiBgQm9vdHN0cmFwT3B0aW9uc2AgaW5zdGVhZC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogYGBgdHlwZXNjcmlwdFxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oTXlBcHAsIHtwcm92aWRlcnM6IFtcbiAqICAgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oe2V2ZW50Q29hbGVzY2luZzogdHJ1ZX0pLFxuICogXX0pO1xuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICogQHNlZSB7QGxpbmsgYm9vdHN0cmFwQXBwbGljYXRpb259XG4gKiBAc2VlIHtAbGluayBOZ1pvbmVPcHRpb25zfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24ob3B0aW9ucz86IE5nWm9uZU9wdGlvbnMpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIGNvbnN0IGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZSA9IG9wdGlvbnM/Lmlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZTtcbiAgY29uc3Qgem9uZVByb3ZpZGVycyA9IGludGVybmFsUHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oe1xuICAgIG5nWm9uZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgIGNvbnN0IG5nWm9uZU9wdGlvbnMgPSBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgaWYgKG5nWm9uZU9wdGlvbnMuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbikge1xuICAgICAgICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ1pvbmVfQ29hbGVzY2VFdmVudCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBOZ1pvbmUobmdab25lT3B0aW9ucyk7XG4gICAgfSxcbiAgICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmVcbiAgfSk7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID8ge3Byb3ZpZGU6IFBST1ZJREVEX05HX1pPTkUsIHVzZVZhbHVlOiB0cnVlfSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXSxcbiAgICB6b25lUHJvdmlkZXJzLFxuICBdKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNvbmZpZ3VyZSBldmVudCBhbmQgcnVuIGNvYWxlc2Npbmcgd2l0aCBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqXG4gKiBAc2VlIHtAbGluayBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ1pvbmVPcHRpb25zIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBjb2FsZXNjaW5nIGV2ZW50IGNoYW5nZSBkZXRlY3Rpb25zIG9yIG5vdC5cbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPlxuICAgKiAgIDxidXR0b24gKGNsaWNrKT1cImRvU29tZXRoaW5nRWxzZSgpXCI+PC9idXR0b24+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2FsZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIG9ubHkgdHJpZ2dlclxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIG9ubHkgb25jZS5cbiAgICpcbiAgICogQnkgZGVmYXVsdCwgdGhpcyBvcHRpb24gd2lsbCBiZSBmYWxzZS4gU28gdGhlIGV2ZW50cyB3aWxsIG5vdCBiZVxuICAgKiBjb2FsZXNjZWQgYW5kIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmUgdHJpZ2dlcmVkIG11bHRpcGxlIHRpbWVzLlxuICAgKiBBbmQgaWYgdGhpcyBvcHRpb24gYmUgc2V0IHRvIHRydWUsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkIGFzeW5jIGJ5IHNjaGVkdWxpbmcgYSBhbmltYXRpb24gZnJhbWUuIFNvIGluIHRoZSBjYXNlIGFib3ZlLFxuICAgKiB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIG9uY2UuXG4gICAqL1xuICBldmVudENvYWxlc2Npbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgaWYgYE5nWm9uZSNydW4oKWAgbWV0aG9kIGludm9jYXRpb25zIHNob3VsZCBiZSBjb2FsZXNjZWRcbiAgICogaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqIGBgYFxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogVGhpcyBjYXNlIHRyaWdnZXJzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIG11bHRpcGxlIHRpbWVzLlxuICAgKiBXaXRoIG5nWm9uZVJ1bkNvYWxlc2Npbmcgb3B0aW9ucywgYWxsIGNoYW5nZSBkZXRlY3Rpb25zIGluIGFuIGV2ZW50IGxvb3AgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgcnVuQ29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZW4gZmFsc2UsIGNoYW5nZSBkZXRlY3Rpb24gaXMgc2NoZWR1bGVkIHdoZW4gQW5ndWxhciByZWNlaXZlc1xuICAgKiBhIGNsZWFyIGluZGljYXRpb24gdGhhdCB0ZW1wbGF0ZXMgbmVlZCB0byBiZSByZWZyZXNoZWQuIFRoaXMgaW5jbHVkZXM6XG4gICAqXG4gICAqIC0gY2FsbGluZyBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYFxuICAgKiAtIGNhbGxpbmcgYENvbXBvbmVudFJlZi5zZXRJbnB1dGBcbiAgICogLSB1cGRhdGluZyBhIHNpZ25hbCB0aGF0IGlzIHJlYWQgaW4gYSB0ZW1wbGF0ZVxuICAgKiAtIHdoZW4gYm91bmQgaG9zdCBvciB0ZW1wbGF0ZSBsaXN0ZW5lcnMgYXJlIHRyaWdnZXJlZFxuICAgKiAtIGF0dGFjaGluZyBhIHZpZXcgdGhhdCBpcyBtYXJrZWQgZGlydHlcbiAgICogLSByZW1vdmluZyBhIHZpZXdcbiAgICogLSByZWdpc3RlcmluZyBhIHJlbmRlciBob29rICh0ZW1wbGF0ZXMgYXJlIG9ubHkgcmVmcmVzaGVkIGlmIHJlbmRlciBob29rcyBkbyBvbmUgb2YgdGhlIGFib3ZlKVxuICAgKi9cbiAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lPzogYm9vbGVhbjtcbn1cblxuLy8gVHJhbnNmb3JtcyBhIHNldCBvZiBgQm9vdHN0cmFwT3B0aW9uc2AgKHN1cHBvcnRlZCBieSB0aGUgTmdNb2R1bGUtYmFzZWQgYm9vdHN0cmFwIEFQSXMpIC0+XG4vLyBgTmdab25lT3B0aW9uc2AgdGhhdCBhcmUgcmVjb2duaXplZCBieSB0aGUgTmdab25lIGNvbnN0cnVjdG9yLiBQYXNzaW5nIG5vIG9wdGlvbnMgd2lsbCByZXN1bHQgaW5cbi8vIGEgc2V0IG9mIGRlZmF1bHQgb3B0aW9ucyByZXR1cm5lZC5cbmV4cG9ydCBmdW5jdGlvbiBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogSW50ZXJuYWxOZ1pvbmVPcHRpb25zIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVMb25nU3RhY2tUcmFjZTogdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6ICEhbmdEZXZNb2RlLFxuICAgIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IG9wdGlvbnM/LmV2ZW50Q29hbGVzY2luZyA/PyBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogb3B0aW9ucz8ucnVuQ29hbGVzY2luZyA/PyBmYWxzZSxcbiAgfTtcbn1cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgWm9uZVN0YWJsZVBlbmRpbmdUYXNrIHtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJzY3JpcHRpb24gPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgIGxldCB0YXNrOiBudW1iZXJ8bnVsbCA9IG51bGw7XG4gICAgaWYgKCF0aGlzLnpvbmUuaXNTdGFibGUgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJiAhdGhpcy56b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICB0YXNrID0gdGhpcy5wZW5kaW5nVGFza3MuYWRkKCk7XG4gICAgfVxuXG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZCh0aGlzLnpvbmUub25TdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgTmdab25lLmFzc2VydE5vdEluQW5ndWxhclpvbmUoKTtcblxuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvL21pY3JvIHRhc2tzIGluIHRoZSBuZXh0IHRpY2tcbiAgICAgICAgLy8gdG8gYWxsb3cgZm9yIE5nWm9uZSB0byB1cGRhdGUgdGhlIHN0YXRlLlxuICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgaWYgKHRhc2sgIT09IG51bGwgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJiAhdGhpcy56b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdUYXNrcy5yZW1vdmUodGFzayk7XG4gICAgICAgICAgICB0YXNrID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb24uYWRkKHRoaXMuem9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBOZ1pvbmUuYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpO1xuICAgICAgdGFzayA/Pz0gdGhpcy5wZW5kaW5nVGFza3MuYWRkKCk7XG4gICAgfSkpO1xuICB9XG5cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG59XG4iXX0=