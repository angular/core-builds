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
        // Always disable scheduler whenever explicitly disabled, even if Hybrid was specified elsewhere
        ignoreChangesOutsideZone === true ? { provide: ZONELESS_SCHEDULER_DISABLED, useValue: true } : [],
        // Only provide scheduler when explicitly not disabled
        ignoreChangesOutsideZone === false ?
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9zY2hlZHVsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL25nX3pvbmVfc2NoZWR1bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFpQixNQUFNLFVBQVUsQ0FBQztBQUNySixPQUFPLEVBQUMsWUFBWSxFQUFFLGtDQUFrQyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckYsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHbEMsT0FBTyxFQUFDLHdCQUF3QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUYsT0FBTyxFQUFDLDRCQUE0QixFQUFDLE1BQU0sNEJBQTRCLENBQUM7O0FBR3hFLE1BQU0sT0FBTyw4QkFBOEI7SUFEM0M7UUFFbUIsU0FBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0Qiw2QkFBd0IsR0FBRyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUM5RSxtQkFBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztLQXlCMUQ7SUFy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b0JBQ2xCLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7d0JBQ3hGLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUMvQixJQUFJLEdBQUcsSUFBSSxDQUFDO29CQUNkLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1lBQ3hELE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdCLElBQUksS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDTixDQUFDO0lBR0QsV0FBVztRQUNULElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbEMsQ0FBQztzRkF6Q1UscUJBQXFCO3VFQUFyQixxQkFBcUIsV0FBckIscUJBQXFCLG1CQURULE1BQU07O2dGQUNsQixxQkFBcUI7Y0FEakMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudFByb3ZpZGVycywgaW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzLCBTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXIsIElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUnO1xuaW1wb3J0IHtJbnRlcm5hbE5nWm9uZU9wdGlvbnN9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUR9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsJztcblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID0gaW5qZWN0KENoYW5nZURldGVjdGlvblNjaGVkdWxlciwge29wdGlvbmFsOiB0cnVlfSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwbGljYXRpb25SZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuXG4gIHByaXZhdGUgX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24/OiBTdWJzY3JpcHRpb247XG5cbiAgaW5pdGlhbGl6ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24gPSB0aGlzLnpvbmUub25NaWNyb3Rhc2tFbXB0eS5zdWJzY3JpYmUoe1xuICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5jaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLnRpY2sodHJ1ZSAvKiBzaG91bGRSZWZyZXNoVmlld3MgKi8pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFwcGxpY2F0aW9uUmVmLnRpY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdXNlZCB0byB2ZXJpZnkgdGhhdCBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gIGlzIG5vdCB1c2VkXG4gKiB3aXRoIHRoZSBib290c3RyYXBNb2R1bGUgQVBJLlxuICovXG5leHBvcnQgY29uc3QgUFJPVklERURfTkdfWk9ORSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPihcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/ICdwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbiB0b2tlbicgOiAnJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKFxuICAgIHtuZ1pvbmVGYWN0b3J5LCBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmV9OlxuICAgICAgICB7bmdab25lRmFjdG9yeTogKCkgPT4gTmdab25lLCBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmU/OiBib29sZWFufSk6IFN0YXRpY1Byb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZUZhY3Rvcnk6IG5nWm9uZUZhY3Rvcnl9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciA9XG4gICAgICAgICAgICBpbmplY3QoTmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgICAgICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAgICAgICBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfUkVRVUlSRURfSU5KRUNUQUJMRV9JTl9CT09UU1RSQVAsXG4gICAgICAgICAgICAgIGBBIHJlcXVpcmVkIEluamVjdGFibGUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgZGVwZW5kZW5jeSBpbmplY3Rpb24gdHJlZS4gYCArXG4gICAgICAgICAgICAgICAgICAnSWYgeW91IGFyZSBib290c3RyYXBwaW5nIGFuIE5nTW9kdWxlLCBtYWtlIHN1cmUgdGhhdCB0aGUgYEJyb3dzZXJNb2R1bGVgIGlzIGltcG9ydGVkLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIhLmluaXRpYWxpemUoKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBjb25zdCBzZXJ2aWNlID0gaW5qZWN0KFpvbmVTdGFibGVQZW5kaW5nVGFzayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgc2VydmljZS5pbml0aWFsaXplKCk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgICB7cHJvdmlkZTogSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUiwgdXNlRmFjdG9yeTogbmdab25lQXBwbGljYXRpb25FcnJvckhhbmRsZXJGYWN0b3J5fSxcbiAgICAvLyBBbHdheXMgZGlzYWJsZSBzY2hlZHVsZXIgd2hlbmV2ZXIgZXhwbGljaXRseSBkaXNhYmxlZCwgZXZlbiBpZiBIeWJyaWQgd2FzIHNwZWNpZmllZCBlbHNld2hlcmVcbiAgICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUgPT09IHRydWUgPyB7cHJvdmlkZTogWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELCB1c2VWYWx1ZTogdHJ1ZX0gOiBbXSxcbiAgICAvLyBPbmx5IHByb3ZpZGUgc2NoZWR1bGVyIHdoZW4gZXhwbGljaXRseSBub3QgZGlzYWJsZWRcbiAgICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUgPT09IGZhbHNlID9cbiAgICAgICAge3Byb3ZpZGU6IENoYW5nZURldGVjdGlvblNjaGVkdWxlciwgdXNlRXhpc3Rpbmc6IENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9IDpcbiAgICAgICAgW10sXG4gIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZ1pvbmVBcHBsaWNhdGlvbkVycm9ySGFuZGxlckZhY3RvcnkoKSB7XG4gIGNvbnN0IHpvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgY29uc3QgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICByZXR1cm4gKGU6IHVua25vd24pID0+IHpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdXNlckVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYE5nWm9uZWAtYmFzZWQgY2hhbmdlIGRldGVjdGlvbiBmb3IgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcHBlZCB1c2luZ1xuICogYGJvb3RzdHJhcEFwcGxpY2F0aW9uYC5cbiAqXG4gKiBgTmdab25lYCBpcyBhbHJlYWR5IHByb3ZpZGVkIGluIGFwcGxpY2F0aW9ucyBieSBkZWZhdWx0LiBUaGlzIHByb3ZpZGVyIGFsbG93cyB5b3UgdG8gY29uZmlndXJlXG4gKiBvcHRpb25zIGxpa2UgYGV2ZW50Q29hbGVzY2luZ2AgaW4gdGhlIGBOZ1pvbmVgLlxuICogVGhpcyBwcm92aWRlciBpcyBub3QgYXZhaWxhYmxlIGZvciBgcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlYCwgd2hpY2ggdXNlc1xuICogYEJvb3RzdHJhcE9wdGlvbnNgIGluc3RlYWQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKE15QXBwLCB7cHJvdmlkZXJzOiBbXG4gKiAgIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtldmVudENvYWxlc2Npbmc6IHRydWV9KSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBzZWUge0BsaW5rIGJvb3RzdHJhcEFwcGxpY2F0aW9ufVxuICogQHNlZSB7QGxpbmsgTmdab25lT3B0aW9uc31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICBjb25zdCBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUgPSBvcHRpb25zPy5pZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmU7XG4gIGNvbnN0IHpvbmVQcm92aWRlcnMgPSBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtcbiAgICBuZ1pvbmVGYWN0b3J5OiAoKSA9PiB7XG4gICAgICBjb25zdCBuZ1pvbmVPcHRpb25zID0gZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgIGlmIChuZ1pvbmVPcHRpb25zLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgICAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lX0NvYWxlc2NlRXZlbnQnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgTmdab25lKG5nWm9uZU9wdGlvbnMpO1xuICAgIH0sXG4gICAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lXG4gIH0pO1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/IHtwcm92aWRlOiBQUk9WSURFRF9OR19aT05FLCB1c2VWYWx1ZTogdHJ1ZX0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW10sXG4gICAgem9uZVByb3ZpZGVycyxcbiAgXSk7XG59XG5cbi8qKlxuICogVXNlZCB0byBjb25maWd1cmUgZXZlbnQgYW5kIHJ1biBjb2FsZXNjaW5nIHdpdGggYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKlxuICogQHNlZSB7QGxpbmsgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb259XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTmdab25lT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgY29hbGVzY2luZyBldmVudCBjaGFuZ2UgZGV0ZWN0aW9ucyBvciBub3QuXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgKGNsaWNrKT1cImRvU29tZXRoaW5nKClcIj5cbiAgICogICA8YnV0dG9uIChjbGljayk9XCJkb1NvbWV0aGluZ0Vsc2UoKVwiPjwvYnV0dG9uPlxuICAgKiA8L2Rpdj5cbiAgICogYGBgXG4gICAqXG4gICAqIFdoZW4gYnV0dG9uIGlzIGNsaWNrZWQsIGJlY2F1c2Ugb2YgdGhlIGV2ZW50IGJ1YmJsaW5nLCBib3RoXG4gICAqIGV2ZW50IGhhbmRsZXJzIHdpbGwgYmUgY2FsbGVkIGFuZCAyIGNoYW5nZSBkZXRlY3Rpb25zIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkLiBXZSBjYW4gY29hbGVzY2Ugc3VjaCBraW5kIG9mIGV2ZW50cyB0byBvbmx5IHRyaWdnZXJcbiAgICogY2hhbmdlIGRldGVjdGlvbiBvbmx5IG9uY2UuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoaXMgb3B0aW9uIHdpbGwgYmUgZmFsc2UuIFNvIHRoZSBldmVudHMgd2lsbCBub3QgYmVcbiAgICogY29hbGVzY2VkIGFuZCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICogQW5kIGlmIHRoaXMgb3B0aW9uIGJlIHNldCB0byB0cnVlLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZCBhc3luYyBieSBzY2hlZHVsaW5nIGEgYW5pbWF0aW9uIGZyYW1lLiBTbyBpbiB0aGUgY2FzZSBhYm92ZSxcbiAgICogdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBvbmNlLlxuICAgKi9cbiAgZXZlbnRDb2FsZXNjaW5nPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGlmIGBOZ1pvbmUjcnVuKClgIG1ldGhvZCBpbnZvY2F0aW9ucyBzaG91bGQgYmUgY29hbGVzY2VkXG4gICAqIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICpcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKiBgYGBcbiAgICogZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSArKykge1xuICAgKiAgIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgKiAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAqICAgfSk7XG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIFRoaXMgY2FzZSB0cmlnZ2VycyB0aGUgY2hhbmdlIGRldGVjdGlvbiBtdWx0aXBsZSB0aW1lcy5cbiAgICogV2l0aCBuZ1pvbmVSdW5Db2FsZXNjaW5nIG9wdGlvbnMsIGFsbCBjaGFuZ2UgZGV0ZWN0aW9ucyBpbiBhbiBldmVudCBsb29wIHRyaWdnZXIgb25seSBvbmNlLlxuICAgKiBJbiBhZGRpdGlvbiwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gZXhlY3V0ZXMgaW4gcmVxdWVzdEFuaW1hdGlvbi5cbiAgICpcbiAgICovXG4gIHJ1bkNvYWxlc2Npbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGVuIGZhbHNlLCBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHNjaGVkdWxlZCB3aGVuIEFuZ3VsYXIgcmVjZWl2ZXNcbiAgICogYSBjbGVhciBpbmRpY2F0aW9uIHRoYXQgdGVtcGxhdGVzIG5lZWQgdG8gYmUgcmVmcmVzaGVkLiBUaGlzIGluY2x1ZGVzOlxuICAgKlxuICAgKiAtIGNhbGxpbmcgYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2BcbiAgICogLSBjYWxsaW5nIGBDb21wb25lbnRSZWYuc2V0SW5wdXRgXG4gICAqIC0gdXBkYXRpbmcgYSBzaWduYWwgdGhhdCBpcyByZWFkIGluIGEgdGVtcGxhdGVcbiAgICogLSB3aGVuIGJvdW5kIGhvc3Qgb3IgdGVtcGxhdGUgbGlzdGVuZXJzIGFyZSB0cmlnZ2VyZWRcbiAgICogLSBhdHRhY2hpbmcgYSB2aWV3IHRoYXQgaXMgbWFya2VkIGRpcnR5XG4gICAqIC0gcmVtb3ZpbmcgYSB2aWV3XG4gICAqIC0gcmVnaXN0ZXJpbmcgYSByZW5kZXIgaG9vayAodGVtcGxhdGVzIGFyZSBvbmx5IHJlZnJlc2hlZCBpZiByZW5kZXIgaG9va3MgZG8gb25lIG9mIHRoZSBhYm92ZSlcbiAgICovXG4gIGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZT86IGJvb2xlYW47XG59XG5cbi8vIFRyYW5zZm9ybXMgYSBzZXQgb2YgYEJvb3RzdHJhcE9wdGlvbnNgIChzdXBwb3J0ZWQgYnkgdGhlIE5nTW9kdWxlLWJhc2VkIGJvb3RzdHJhcCBBUElzKSAtPlxuLy8gYE5nWm9uZU9wdGlvbnNgIHRoYXQgYXJlIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZSBjb25zdHJ1Y3Rvci4gUGFzc2luZyBubyBvcHRpb25zIHdpbGwgcmVzdWx0IGluXG4vLyBhIHNldCBvZiBkZWZhdWx0IG9wdGlvbnMgcmV0dXJuZWQuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zPzogTmdab25lT3B0aW9ucyk6IEludGVybmFsTmdab25lT3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiAhIW5nRGV2TW9kZSxcbiAgICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBvcHRpb25zPy5ldmVudENvYWxlc2NpbmcgPz8gZmFsc2UsXG4gICAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IG9wdGlvbnM/LnJ1bkNvYWxlc2NpbmcgPz8gZmFsc2UsXG4gIH07XG59XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFpvbmVTdGFibGVQZW5kaW5nVGFzayB7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3Vic2NyaXB0aW9uID0gbmV3IFN1YnNjcmlwdGlvbigpO1xuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IHBlbmRpbmdUYXNrcyA9IGluamVjdChQZW5kaW5nVGFza3MpO1xuXG4gIGluaXRpYWxpemUoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG5cbiAgICBsZXQgdGFzazogbnVtYmVyfG51bGwgPSBudWxsO1xuICAgIGlmICghdGhpcy56b25lLmlzU3RhYmxlICYmICF0aGlzLnpvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgdGFzayA9IHRoaXMucGVuZGluZ1Rhc2tzLmFkZCgpO1xuICAgIH1cblxuICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbi5hZGQodGhpcy56b25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIE5nWm9uZS5hc3NlcnROb3RJbkFuZ3VsYXJab25lKCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGVyZSBhcmUgbm8gcGVuZGluZyBtYWNyby9taWNybyB0YXNrcyBpbiB0aGUgbmV4dCB0aWNrXG4gICAgICAgIC8vIHRvIGFsbG93IGZvciBOZ1pvbmUgdG8gdXBkYXRlIHRoZSBzdGF0ZS5cbiAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgIGlmICh0YXNrICE9PSBudWxsICYmICF0aGlzLnpvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgICAgICAgdGhpcy5wZW5kaW5nVGFza3MucmVtb3ZlKHRhc2spO1xuICAgICAgICAgICAgdGFzayA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZCh0aGlzLnpvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgIHRhc2sgPz89IHRoaXMucGVuZGluZ1Rhc2tzLmFkZCgpO1xuICAgIH0pKTtcbiAgfVxuXG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuIl19