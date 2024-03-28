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
import { NgZone } from '../../zone';
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
                this.zone.run(() => {
                    if (this.changeDetectionScheduler) {
                        this.changeDetectionScheduler.tick(true /* shouldRefreshViews */);
                    }
                    else {
                        this.applicationRef.tick();
                    }
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
/**
 * Configures change detection scheduling when using ZoneJS.
 */
export var SchedulingMode;
(function (SchedulingMode) {
    /**
     * Change detection will run when the `NgZone.onMicrotaskEmpty` observable emits.
     * Change detection will also be scheduled to run whenever Angular is notified
     * of a change. This includes calling `ChangeDetectorRef.markForCheck`,
     * setting a `signal` value, and attaching a view.
     */
    SchedulingMode[SchedulingMode["Hybrid"] = 0] = "Hybrid";
    /**
     * Change detection will only run when the `NgZone.onMicrotaskEmpty` observable emits.
     */
    SchedulingMode[SchedulingMode["NgZoneOnly"] = 1] = "NgZoneOnly";
})(SchedulingMode || (SchedulingMode = {}));
export function internalProvideZoneChangeDetection({ ngZoneFactory, schedulingMode }) {
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
        // Always disable scheduler whenever explicitly disabled, even if Hybrid was specified elsewhere
        schedulingMode === SchedulingMode.NgZoneOnly ?
            { provide: ZONELESS_SCHEDULER_DISABLED, useValue: true } :
            [],
        // Only provide scheduler when explicitly enabled
        schedulingMode === SchedulingMode.Hybrid ?
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
    const schedulingMode = options?.schedulingMode;
    const zoneProviders = internalProvideZoneChangeDetection({ ngZoneFactory: () => new NgZone(getNgZoneOptions(options)), schedulingMode });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9zY2hlZHVsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL25nX3pvbmVfc2NoZWR1bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFpQixNQUFNLFVBQVUsQ0FBQztBQUNySixPQUFPLEVBQUMsWUFBWSxFQUFFLGtDQUFrQyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckYsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHbEMsT0FBTyxFQUFDLHdCQUF3QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUYsT0FBTyxFQUFDLDRCQUE0QixFQUFDLE1BQU0sNEJBQTRCLENBQUM7O0FBR3hFLE1BQU0sT0FBTyw4QkFBOEI7SUFEM0M7UUFFbUIsU0FBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0Qiw2QkFBd0IsR0FBRyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUM5RSxtQkFBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztLQXlCMUQ7SUFyQkMsVUFBVTtRQUNSLElBQUksSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7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QUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzt3QkFDeEYsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQy9CLElBQUksR0FBRyxJQUFJLENBQUM7b0JBQ2QsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDeEQsTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDN0IsSUFBSSxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNOLENBQUM7SUFHRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNsQyxDQUFDO3NGQXpDVSxxQkFBcUI7dUVBQXJCLHFCQUFxQixXQUFyQixxQkFBcUIsbUJBRFQsTUFBTTs7Z0ZBQ2xCLHFCQUFxQjtjQURqQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7RU5WSVJPTk1FTlRfSU5JVElBTElaRVIsIEVudmlyb25tZW50UHJvdmlkZXJzLCBpbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlciwgSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi8uLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi8uLi96b25lJztcbmltcG9ydCB7SW50ZXJuYWxOZ1pvbmVPcHRpb25zfSBmcm9tICcuLi8uLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge0NoYW5nZURldGVjdGlvblNjaGVkdWxlciwgWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVEfSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuaW1wb3J0IHtDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsfSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbCc7XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IGNoYW5nZURldGVjdGlvblNjaGVkdWxlciA9IGluamVjdChDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcGxpY2F0aW9uUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcblxuICBwcml2YXRlIF9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uPzogU3Vic2NyaXB0aW9uO1xuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uID0gdGhpcy56b25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKHtcbiAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyKSB7XG4gICAgICAgICAgICB0aGlzLmNoYW5nZURldGVjdGlvblNjaGVkdWxlci50aWNrKHRydWUgLyogc2hvdWxkUmVmcmVzaFZpZXdzICovKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hcHBsaWNhdGlvblJlZi50aWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYCBpcyBub3QgdXNlZFxuICogd2l0aCB0aGUgYm9vdHN0cmFwTW9kdWxlIEFQSS5cbiAqL1xuZXhwb3J0IGNvbnN0IFBST1ZJREVEX05HX1pPTkUgPSBuZXcgSW5qZWN0aW9uVG9rZW48Ym9vbGVhbj4oXG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgPyAncHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24gdG9rZW4nIDogJycpO1xuXG4vKipcbiAqIENvbmZpZ3VyZXMgY2hhbmdlIGRldGVjdGlvbiBzY2hlZHVsaW5nIHdoZW4gdXNpbmcgWm9uZUpTLlxuICovXG5leHBvcnQgZW51bSBTY2hlZHVsaW5nTW9kZSB7XG4gIC8qKlxuICAgKiBDaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgcnVuIHdoZW4gdGhlIGBOZ1pvbmUub25NaWNyb3Rhc2tFbXB0eWAgb2JzZXJ2YWJsZSBlbWl0cy5cbiAgICogQ2hhbmdlIGRldGVjdGlvbiB3aWxsIGFsc28gYmUgc2NoZWR1bGVkIHRvIHJ1biB3aGVuZXZlciBBbmd1bGFyIGlzIG5vdGlmaWVkXG4gICAqIG9mIGEgY2hhbmdlLiBUaGlzIGluY2x1ZGVzIGNhbGxpbmcgYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2AsXG4gICAqIHNldHRpbmcgYSBgc2lnbmFsYCB2YWx1ZSwgYW5kIGF0dGFjaGluZyBhIHZpZXcuXG4gICAqL1xuICBIeWJyaWQsXG4gIC8qKlxuICAgKiBDaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBydW4gd2hlbiB0aGUgYE5nWm9uZS5vbk1pY3JvdGFza0VtcHR5YCBvYnNlcnZhYmxlIGVtaXRzLlxuICAgKi9cbiAgTmdab25lT25seSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsUHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oXG4gICAge25nWm9uZUZhY3RvcnksIHNjaGVkdWxpbmdNb2RlfTpcbiAgICAgICAge25nWm9uZUZhY3Rvcnk6ICgpID0+IE5nWm9uZSwgc2NoZWR1bGluZ01vZGU/OiBTY2hlZHVsaW5nTW9kZX0pOiBTdGF0aWNQcm92aWRlcltdIHtcbiAgcmV0dXJuIFtcbiAgICB7cHJvdmlkZTogTmdab25lLCB1c2VGYWN0b3J5OiBuZ1pvbmVGYWN0b3J5fSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBjb25zdCBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPVxuICAgICAgICAgICAgaW5qZWN0KE5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciwge29wdGlvbmFsOiB0cnVlfSk7XG4gICAgICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJlxuICAgICAgICAgICAgbmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX1JFUVVJUkVEX0lOSkVDVEFCTEVfSU5fQk9PVFNUUkFQLFxuICAgICAgICAgICAgICBgQSByZXF1aXJlZCBJbmplY3RhYmxlIHdhcyBub3QgZm91bmQgaW4gdGhlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHRyZWUuIGAgK1xuICAgICAgICAgICAgICAgICAgJ0lmIHlvdSBhcmUgYm9vdHN0cmFwcGluZyBhbiBOZ01vZHVsZSwgbWFrZSBzdXJlIHRoYXQgdGhlIGBCcm93c2VyTW9kdWxlYCBpcyBpbXBvcnRlZC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4gbmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIS5pbml0aWFsaXplKCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2VydmljZSA9IGluamVjdChab25lU3RhYmxlUGVuZGluZ1Rhc2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIHNlcnZpY2UuaW5pdGlhbGl6ZSgpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0sXG4gICAge3Byb3ZpZGU6IElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVIsIHVzZUZhY3Rvcnk6IG5nWm9uZUFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyRmFjdG9yeX0sXG4gICAgLy8gQWx3YXlzIGRpc2FibGUgc2NoZWR1bGVyIHdoZW5ldmVyIGV4cGxpY2l0bHkgZGlzYWJsZWQsIGV2ZW4gaWYgSHlicmlkIHdhcyBzcGVjaWZpZWQgZWxzZXdoZXJlXG4gICAgc2NoZWR1bGluZ01vZGUgPT09IFNjaGVkdWxpbmdNb2RlLk5nWm9uZU9ubHkgP1xuICAgICAgICB7cHJvdmlkZTogWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELCB1c2VWYWx1ZTogdHJ1ZX0gOlxuICAgICAgICBbXSxcbiAgICAvLyBPbmx5IHByb3ZpZGUgc2NoZWR1bGVyIHdoZW4gZXhwbGljaXRseSBlbmFibGVkXG4gICAgc2NoZWR1bGluZ01vZGUgPT09IFNjaGVkdWxpbmdNb2RlLkh5YnJpZCA/XG4gICAgICAgIHtwcm92aWRlOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHVzZUV4aXN0aW5nOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsfSA6XG4gICAgICAgIFtdLFxuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmdab25lQXBwbGljYXRpb25FcnJvckhhbmRsZXJGYWN0b3J5KCkge1xuICBjb25zdCB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIGNvbnN0IHVzZXJFcnJvckhhbmRsZXIgPSBpbmplY3QoRXJyb3JIYW5kbGVyKTtcbiAgcmV0dXJuIChlOiB1bmtub3duKSA9PiB6b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHVzZXJFcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGBOZ1pvbmVgLWJhc2VkIGNoYW5nZSBkZXRlY3Rpb24gZm9yIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXBwZWQgdXNpbmdcbiAqIGBib290c3RyYXBBcHBsaWNhdGlvbmAuXG4gKlxuICogYE5nWm9uZWAgaXMgYWxyZWFkeSBwcm92aWRlZCBpbiBhcHBsaWNhdGlvbnMgYnkgZGVmYXVsdC4gVGhpcyBwcm92aWRlciBhbGxvd3MgeW91IHRvIGNvbmZpZ3VyZVxuICogb3B0aW9ucyBsaWtlIGBldmVudENvYWxlc2NpbmdgIGluIHRoZSBgTmdab25lYC5cbiAqIFRoaXMgcHJvdmlkZXIgaXMgbm90IGF2YWlsYWJsZSBmb3IgYHBsYXRmb3JtQnJvd3NlcigpLmJvb3RzdHJhcE1vZHVsZWAsIHdoaWNoIHVzZXNcbiAqIGBCb290c3RyYXBPcHRpb25zYCBpbnN0ZWFkLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihNeUFwcCwge3Byb3ZpZGVyczogW1xuICogICBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbih7ZXZlbnRDb2FsZXNjaW5nOiB0cnVlfSksXG4gKiBdfSk7XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAc2VlIHtAbGluayBib290c3RyYXBBcHBsaWNhdGlvbn1cbiAqIEBzZWUge0BsaW5rIE5nWm9uZU9wdGlvbnN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbihvcHRpb25zPzogTmdab25lT3B0aW9ucyk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgY29uc3Qgc2NoZWR1bGluZ01vZGUgPSAob3B0aW9ucyBhcyBhbnkpPy5zY2hlZHVsaW5nTW9kZTtcbiAgY29uc3Qgem9uZVByb3ZpZGVycyA9IGludGVybmFsUHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oXG4gICAgICB7bmdab25lRmFjdG9yeTogKCkgPT4gbmV3IE5nWm9uZShnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnMpKSwgc2NoZWR1bGluZ01vZGV9KTtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgPyB7cHJvdmlkZTogUFJPVklERURfTkdfWk9ORSwgdXNlVmFsdWU6IHRydWV9IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtdLFxuICAgIHpvbmVQcm92aWRlcnMsXG4gIF0pO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gY29uZmlndXJlIGV2ZW50IGFuZCBydW4gY29hbGVzY2luZyB3aXRoIGBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbmAuXG4gKlxuICogQHB1YmxpY0FwaVxuICpcbiAqIEBzZWUge0BsaW5rIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9ufVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nWm9uZU9wdGlvbnMge1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gICAqICAgPGJ1dHRvbiAoY2xpY2spPVwiZG9Tb21ldGhpbmdFbHNlKClcIj48L2J1dHRvbj5cbiAgICogPC9kaXY+XG4gICAqIGBgYFxuICAgKlxuICAgKiBXaGVuIGJ1dHRvbiBpcyBjbGlja2VkLCBiZWNhdXNlIG9mIHRoZSBldmVudCBidWJibGluZywgYm90aFxuICAgKiBldmVudCBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCBhbmQgMiBjaGFuZ2UgZGV0ZWN0aW9ucyB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZC4gV2UgY2FuIGNvYWxlc2NlIHN1Y2gga2luZCBvZiBldmVudHMgdG8gb25seSB0cmlnZ2VyXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gb25seSBvbmNlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGlzIG9wdGlvbiB3aWxsIGJlIGZhbHNlLiBTbyB0aGUgZXZlbnRzIHdpbGwgbm90IGJlXG4gICAqIGNvYWxlc2NlZCBhbmQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZSB0cmlnZ2VyZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIEFuZCBpZiB0aGlzIG9wdGlvbiBiZSBzZXQgdG8gdHJ1ZSwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQgYXN5bmMgYnkgc2NoZWR1bGluZyBhIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgb25jZS5cbiAgICovXG4gIGV2ZW50Q29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBpZiBgTmdab25lI3J1bigpYCBtZXRob2QgaW52b2NhdGlvbnMgc2hvdWxkIGJlIGNvYWxlc2NlZFxuICAgKiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICogYGBgXG4gICAqIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKyspIHtcbiAgICogICBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICogICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgKiAgIH0pO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcCB0cmlnZ2VyIG9ubHkgb25jZS5cbiAgICogSW4gYWRkaXRpb24sIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGV4ZWN1dGVzIGluIHJlcXVlc3RBbmltYXRpb24uXG4gICAqXG4gICAqL1xuICBydW5Db2FsZXNjaW5nPzogYm9vbGVhbjtcbn1cblxuLy8gVHJhbnNmb3JtcyBhIHNldCBvZiBgQm9vdHN0cmFwT3B0aW9uc2AgKHN1cHBvcnRlZCBieSB0aGUgTmdNb2R1bGUtYmFzZWQgYm9vdHN0cmFwIEFQSXMpIC0+XG4vLyBgTmdab25lT3B0aW9uc2AgdGhhdCBhcmUgcmVjb2duaXplZCBieSB0aGUgTmdab25lIGNvbnN0cnVjdG9yLiBQYXNzaW5nIG5vIG9wdGlvbnMgd2lsbCByZXN1bHQgaW5cbi8vIGEgc2V0IG9mIGRlZmF1bHQgb3B0aW9ucyByZXR1cm5lZC5cbmV4cG9ydCBmdW5jdGlvbiBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogSW50ZXJuYWxOZ1pvbmVPcHRpb25zIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVMb25nU3RhY2tUcmFjZTogdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6ICEhbmdEZXZNb2RlLFxuICAgIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IG9wdGlvbnM/LmV2ZW50Q29hbGVzY2luZyA/PyBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogb3B0aW9ucz8ucnVuQ29hbGVzY2luZyA/PyBmYWxzZSxcbiAgfTtcbn1cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgWm9uZVN0YWJsZVBlbmRpbmdUYXNrIHtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJzY3JpcHRpb24gPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgIGxldCB0YXNrOiBudW1iZXJ8bnVsbCA9IG51bGw7XG4gICAgaWYgKCF0aGlzLnpvbmUuaXNTdGFibGUgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJiAhdGhpcy56b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICB0YXNrID0gdGhpcy5wZW5kaW5nVGFza3MuYWRkKCk7XG4gICAgfVxuXG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZCh0aGlzLnpvbmUub25TdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgTmdab25lLmFzc2VydE5vdEluQW5ndWxhclpvbmUoKTtcblxuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvL21pY3JvIHRhc2tzIGluIHRoZSBuZXh0IHRpY2tcbiAgICAgICAgLy8gdG8gYWxsb3cgZm9yIE5nWm9uZSB0byB1cGRhdGUgdGhlIHN0YXRlLlxuICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgaWYgKHRhc2sgIT09IG51bGwgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJiAhdGhpcy56b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdUYXNrcy5yZW1vdmUodGFzayk7XG4gICAgICAgICAgICB0YXNrID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb24uYWRkKHRoaXMuem9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBOZ1pvbmUuYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpO1xuICAgICAgdGFzayA/Pz0gdGhpcy5wZW5kaW5nVGFza3MuYWRkKCk7XG4gICAgfSkpO1xuICB9XG5cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG59XG4iXX0=