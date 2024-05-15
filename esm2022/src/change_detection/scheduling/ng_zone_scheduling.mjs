/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Subscription } from 'rxjs';
import { ApplicationRef } from '../../application/application_ref';
import { ENVIRONMENT_INITIALIZER, inject, Injectable, InjectionToken, makeEnvironmentProviders, } from '../../di';
import { ErrorHandler, INTERNAL_APPLICATION_ERROR_HANDLER } from '../../error_handler';
import { RuntimeError } from '../../errors';
import { PendingTasks } from '../../pending_tasks';
import { performanceMarkFeature } from '../../util/performance';
import { NgZone } from '../../zone';
import { alwaysProvideZonelessScheduler } from './flags';
import { ChangeDetectionScheduler, ZONELESS_ENABLED, ZONELESS_SCHEDULER_DISABLED, } from './zoneless_scheduling';
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
            },
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
export const PROVIDED_NG_ZONE = new InjectionToken(typeof ngDevMode === 'undefined' || ngDevMode ? 'provideZoneChangeDetection token' : '', { factory: () => false });
export function internalProvideZoneChangeDetection({ ngZoneFactory, ignoreChangesOutsideZone, }) {
    ngZoneFactory ??= () => new NgZone(getNgZoneOptions());
    return [
        { provide: NgZone, useFactory: ngZoneFactory },
        {
            provide: ENVIRONMENT_INITIALIZER,
            multi: true,
            useFactory: () => {
                const ngZoneChangeDetectionScheduler = inject(NgZoneChangeDetectionScheduler, {
                    optional: true,
                });
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
            },
        },
        { provide: INTERNAL_APPLICATION_ERROR_HANDLER, useFactory: ngZoneApplicationErrorHandlerFactory },
        // Always disable scheduler whenever explicitly disabled, even if another place called
        // `provideZoneChangeDetection` without the 'ignore' option.
        ignoreChangesOutsideZone === true ? { provide: ZONELESS_SCHEDULER_DISABLED, useValue: true } : [],
        // TODO(atscott): This should move to the same places that zone change detection is provided by
        // default instead of being in the zone scheduling providers.
        alwaysProvideZonelessScheduler || ignoreChangesOutsideZone === false
            ? { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl }
            : [],
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
        ignoreChangesOutsideZone,
    });
    return makeEnvironmentProviders([
        typeof ngDevMode === 'undefined' || ngDevMode
            ? [{ provide: PROVIDED_NG_ZONE, useValue: true }]
            : [],
        { provide: ZONELESS_ENABLED, useValue: false },
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
                    if (task !== null &&
                        !this.zone.hasPendingMacrotasks &&
                        !this.zone.hasPendingMicrotasks) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9zY2hlZHVsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL25nX3pvbmVfc2NoZWR1bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLE1BQU0sRUFDTixVQUFVLEVBQ1YsY0FBYyxFQUNkLHdCQUF3QixHQUV6QixNQUFNLFVBQVUsQ0FBQztBQUNsQixPQUFPLEVBQUMsWUFBWSxFQUFFLGtDQUFrQyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckYsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHbEMsT0FBTyxFQUFDLDhCQUE4QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3ZELE9BQU8sRUFDTCx3QkFBd0IsRUFDeEIsZ0JBQWdCLEVBQ2hCLDJCQUEyQixHQUM1QixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyw0QkFBNEIsRUFBQyxNQUFNLDRCQUE0QixDQUFDOztBQUd4RSxNQUFNLE9BQU8sOEJBQThCO0lBRDNDO1FBRW1CLFNBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsNkJBQXdCLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFD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KiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7XG4gIEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICBFbnZpcm9ubWVudFByb3ZpZGVycyxcbiAgaW5qZWN0LFxuICBJbmplY3RhYmxlLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzLFxuICBTdGF0aWNQcm92aWRlcixcbn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXIsIElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUnO1xuaW1wb3J0IHtJbnRlcm5hbE5nWm9uZU9wdGlvbnN9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7YWx3YXlzUHJvdmlkZVpvbmVsZXNzU2NoZWR1bGVyfSBmcm9tICcuL2ZsYWdzJztcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgWk9ORUxFU1NfRU5BQkxFRCxcbiAgWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELFxufSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuaW1wb3J0IHtDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsfSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbCc7XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IGNoYW5nZURldGVjdGlvblNjaGVkdWxlciA9IGluamVjdChDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcGxpY2F0aW9uUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcblxuICBwcml2YXRlIF9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uPzogU3Vic2NyaXB0aW9uO1xuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uID0gdGhpcy56b25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKHtcbiAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgLy8gYG9uTWljcm9UYXNrRW1wdHlgIGNhbiBoYXBwZW4gX2R1cmluZ18gdGhlIHpvbmVsZXNzIHNjaGVkdWxlciBjaGFuZ2UgZGV0ZWN0aW9uIGJlY2F1c2VcbiAgICAgICAgLy8gem9uZS5ydW4oKCkgPT4ge30pIHdpbGwgcmVzdWx0IGluIGBjaGVja1N0YWJsZWAgYXQgdGhlIGVuZCBvZiB0aGUgYHpvbmUucnVuYCBjbG9zdXJlXG4gICAgICAgIC8vIGFuZCBlbWl0IGBvbk1pY3JvdGFza0VtcHR5YCBzeW5jaHJvbm91c2x5IGlmIHJ1biBjb2Fsc2VjaW5nIGlzIGZhbHNlLlxuICAgICAgICBpZiAodGhpcy5jaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXI/LnJ1bm5pbmdUaWNrKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuYXBwbGljYXRpb25SZWYudGljaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdXNlZCB0byB2ZXJpZnkgdGhhdCBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gIGlzIG5vdCB1c2VkXG4gKiB3aXRoIHRoZSBib290c3RyYXBNb2R1bGUgQVBJLlxuICovXG5leHBvcnQgY29uc3QgUFJPVklERURfTkdfWk9ORSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPihcbiAgdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlID8gJ3Byb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uIHRva2VuJyA6ICcnLFxuICB7ZmFjdG9yeTogKCkgPT4gZmFsc2V9LFxuKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsUHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oe1xuICBuZ1pvbmVGYWN0b3J5LFxuICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUsXG59OiB7XG4gIG5nWm9uZUZhY3Rvcnk/OiAoKSA9PiBOZ1pvbmU7XG4gIGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZT86IGJvb2xlYW47XG59KTogU3RhdGljUHJvdmlkZXJbXSB7XG4gIG5nWm9uZUZhY3RvcnkgPz89ICgpID0+IG5ldyBOZ1pvbmUoZ2V0Tmdab25lT3B0aW9ucygpKTtcbiAgcmV0dXJuIFtcbiAgICB7cHJvdmlkZTogTmdab25lLCB1c2VGYWN0b3J5OiBuZ1pvbmVGYWN0b3J5fSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBjb25zdCBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPSBpbmplY3QoTmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB7XG4gICAgICAgICAgb3B0aW9uYWw6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICAgICBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19SRVFVSVJFRF9JTkpFQ1RBQkxFX0lOX0JPT1RTVFJBUCxcbiAgICAgICAgICAgIGBBIHJlcXVpcmVkIEluamVjdGFibGUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgZGVwZW5kZW5jeSBpbmplY3Rpb24gdHJlZS4gYCArXG4gICAgICAgICAgICAgICdJZiB5b3UgYXJlIGJvb3RzdHJhcHBpbmcgYW4gTmdNb2R1bGUsIG1ha2Ugc3VyZSB0aGF0IHRoZSBgQnJvd3Nlck1vZHVsZWAgaXMgaW1wb3J0ZWQuJyxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIhLmluaXRpYWxpemUoKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBjb25zdCBzZXJ2aWNlID0gaW5qZWN0KFpvbmVTdGFibGVQZW5kaW5nVGFzayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgc2VydmljZS5pbml0aWFsaXplKCk7XG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH0sXG4gICAge3Byb3ZpZGU6IElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVIsIHVzZUZhY3Rvcnk6IG5nWm9uZUFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyRmFjdG9yeX0sXG4gICAgLy8gQWx3YXlzIGRpc2FibGUgc2NoZWR1bGVyIHdoZW5ldmVyIGV4cGxpY2l0bHkgZGlzYWJsZWQsIGV2ZW4gaWYgYW5vdGhlciBwbGFjZSBjYWxsZWRcbiAgICAvLyBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gIHdpdGhvdXQgdGhlICdpZ25vcmUnIG9wdGlvbi5cbiAgICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUgPT09IHRydWUgPyB7cHJvdmlkZTogWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELCB1c2VWYWx1ZTogdHJ1ZX0gOiBbXSxcbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBUaGlzIHNob3VsZCBtb3ZlIHRvIHRoZSBzYW1lIHBsYWNlcyB0aGF0IHpvbmUgY2hhbmdlIGRldGVjdGlvbiBpcyBwcm92aWRlZCBieVxuICAgIC8vIGRlZmF1bHQgaW5zdGVhZCBvZiBiZWluZyBpbiB0aGUgem9uZSBzY2hlZHVsaW5nIHByb3ZpZGVycy5cbiAgICBhbHdheXNQcm92aWRlWm9uZWxlc3NTY2hlZHVsZXIgfHwgaWdub3JlQ2hhbmdlc091dHNpZGVab25lID09PSBmYWxzZVxuICAgICAgPyB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH1cbiAgICAgIDogW10sXG4gIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZ1pvbmVBcHBsaWNhdGlvbkVycm9ySGFuZGxlckZhY3RvcnkoKSB7XG4gIGNvbnN0IHpvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgY29uc3QgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICByZXR1cm4gKGU6IHVua25vd24pID0+IHpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdXNlckVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYE5nWm9uZWAtYmFzZWQgY2hhbmdlIGRldGVjdGlvbiBmb3IgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcHBlZCB1c2luZ1xuICogYGJvb3RzdHJhcEFwcGxpY2F0aW9uYC5cbiAqXG4gKiBgTmdab25lYCBpcyBhbHJlYWR5IHByb3ZpZGVkIGluIGFwcGxpY2F0aW9ucyBieSBkZWZhdWx0LiBUaGlzIHByb3ZpZGVyIGFsbG93cyB5b3UgdG8gY29uZmlndXJlXG4gKiBvcHRpb25zIGxpa2UgYGV2ZW50Q29hbGVzY2luZ2AgaW4gdGhlIGBOZ1pvbmVgLlxuICogVGhpcyBwcm92aWRlciBpcyBub3QgYXZhaWxhYmxlIGZvciBgcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlYCwgd2hpY2ggdXNlc1xuICogYEJvb3RzdHJhcE9wdGlvbnNgIGluc3RlYWQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKE15QXBwLCB7cHJvdmlkZXJzOiBbXG4gKiAgIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtldmVudENvYWxlc2Npbmc6IHRydWV9KSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBzZWUge0BsaW5rIGJvb3RzdHJhcEFwcGxpY2F0aW9ufVxuICogQHNlZSB7QGxpbmsgTmdab25lT3B0aW9uc31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICBjb25zdCBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUgPSBvcHRpb25zPy5pZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmU7XG4gIGNvbnN0IHpvbmVQcm92aWRlcnMgPSBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtcbiAgICBuZ1pvbmVGYWN0b3J5OiAoKSA9PiB7XG4gICAgICBjb25zdCBuZ1pvbmVPcHRpb25zID0gZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgIGlmIChuZ1pvbmVPcHRpb25zLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgICAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lX0NvYWxlc2NlRXZlbnQnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgTmdab25lKG5nWm9uZU9wdGlvbnMpO1xuICAgIH0sXG4gICAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lLFxuICB9KTtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAgdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlXG4gICAgICA/IFt7cHJvdmlkZTogUFJPVklERURfTkdfWk9ORSwgdXNlVmFsdWU6IHRydWV9XVxuICAgICAgOiBbXSxcbiAgICB7cHJvdmlkZTogWk9ORUxFU1NfRU5BQkxFRCwgdXNlVmFsdWU6IGZhbHNlfSxcbiAgICB6b25lUHJvdmlkZXJzLFxuICBdKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNvbmZpZ3VyZSBldmVudCBhbmQgcnVuIGNvYWxlc2Npbmcgd2l0aCBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqXG4gKiBAc2VlIHtAbGluayBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ1pvbmVPcHRpb25zIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBjb2FsZXNjaW5nIGV2ZW50IGNoYW5nZSBkZXRlY3Rpb25zIG9yIG5vdC5cbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPlxuICAgKiAgIDxidXR0b24gKGNsaWNrKT1cImRvU29tZXRoaW5nRWxzZSgpXCI+PC9idXR0b24+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2FsZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIG9ubHkgdHJpZ2dlclxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIG9ubHkgb25jZS5cbiAgICpcbiAgICogQnkgZGVmYXVsdCwgdGhpcyBvcHRpb24gd2lsbCBiZSBmYWxzZS4gU28gdGhlIGV2ZW50cyB3aWxsIG5vdCBiZVxuICAgKiBjb2FsZXNjZWQgYW5kIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmUgdHJpZ2dlcmVkIG11bHRpcGxlIHRpbWVzLlxuICAgKiBBbmQgaWYgdGhpcyBvcHRpb24gYmUgc2V0IHRvIHRydWUsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkIGFzeW5jIGJ5IHNjaGVkdWxpbmcgYSBhbmltYXRpb24gZnJhbWUuIFNvIGluIHRoZSBjYXNlIGFib3ZlLFxuICAgKiB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIG9uY2UuXG4gICAqL1xuICBldmVudENvYWxlc2Npbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgaWYgYE5nWm9uZSNydW4oKWAgbWV0aG9kIGludm9jYXRpb25zIHNob3VsZCBiZSBjb2FsZXNjZWRcbiAgICogaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqIGBgYFxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogVGhpcyBjYXNlIHRyaWdnZXJzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIG11bHRpcGxlIHRpbWVzLlxuICAgKiBXaXRoIG5nWm9uZVJ1bkNvYWxlc2Npbmcgb3B0aW9ucywgYWxsIGNoYW5nZSBkZXRlY3Rpb25zIGluIGFuIGV2ZW50IGxvb3AgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgcnVuQ29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZW4gZmFsc2UsIGNoYW5nZSBkZXRlY3Rpb24gaXMgc2NoZWR1bGVkIHdoZW4gQW5ndWxhciByZWNlaXZlc1xuICAgKiBhIGNsZWFyIGluZGljYXRpb24gdGhhdCB0ZW1wbGF0ZXMgbmVlZCB0byBiZSByZWZyZXNoZWQuIFRoaXMgaW5jbHVkZXM6XG4gICAqXG4gICAqIC0gY2FsbGluZyBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYFxuICAgKiAtIGNhbGxpbmcgYENvbXBvbmVudFJlZi5zZXRJbnB1dGBcbiAgICogLSB1cGRhdGluZyBhIHNpZ25hbCB0aGF0IGlzIHJlYWQgaW4gYSB0ZW1wbGF0ZVxuICAgKiAtIHdoZW4gYm91bmQgaG9zdCBvciB0ZW1wbGF0ZSBsaXN0ZW5lcnMgYXJlIHRyaWdnZXJlZFxuICAgKiAtIGF0dGFjaGluZyBhIHZpZXcgdGhhdCBpcyBtYXJrZWQgZGlydHlcbiAgICogLSByZW1vdmluZyBhIHZpZXdcbiAgICogLSByZWdpc3RlcmluZyBhIHJlbmRlciBob29rICh0ZW1wbGF0ZXMgYXJlIG9ubHkgcmVmcmVzaGVkIGlmIHJlbmRlciBob29rcyBkbyBvbmUgb2YgdGhlIGFib3ZlKVxuICAgKi9cbiAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lPzogYm9vbGVhbjtcbn1cblxuLy8gVHJhbnNmb3JtcyBhIHNldCBvZiBgQm9vdHN0cmFwT3B0aW9uc2AgKHN1cHBvcnRlZCBieSB0aGUgTmdNb2R1bGUtYmFzZWQgYm9vdHN0cmFwIEFQSXMpIC0+XG4vLyBgTmdab25lT3B0aW9uc2AgdGhhdCBhcmUgcmVjb2duaXplZCBieSB0aGUgTmdab25lIGNvbnN0cnVjdG9yLiBQYXNzaW5nIG5vIG9wdGlvbnMgd2lsbCByZXN1bHQgaW5cbi8vIGEgc2V0IG9mIGRlZmF1bHQgb3B0aW9ucyByZXR1cm5lZC5cbmV4cG9ydCBmdW5jdGlvbiBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogSW50ZXJuYWxOZ1pvbmVPcHRpb25zIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVMb25nU3RhY2tUcmFjZTogdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6ICEhbmdEZXZNb2RlLFxuICAgIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IG9wdGlvbnM/LmV2ZW50Q29hbGVzY2luZyA/PyBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogb3B0aW9ucz8ucnVuQ29hbGVzY2luZyA/PyBmYWxzZSxcbiAgfTtcbn1cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgWm9uZVN0YWJsZVBlbmRpbmdUYXNrIHtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJzY3JpcHRpb24gPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgIGxldCB0YXNrOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBpZiAoIXRoaXMuem9uZS5pc1N0YWJsZSAmJiAhdGhpcy56b25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzICYmICF0aGlzLnpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MpIHtcbiAgICAgIHRhc2sgPSB0aGlzLnBlbmRpbmdUYXNrcy5hZGQoKTtcbiAgICB9XG5cbiAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb24uYWRkKFxuICAgICAgICB0aGlzLnpvbmUub25TdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICBOZ1pvbmUuYXNzZXJ0Tm90SW5Bbmd1bGFyWm9uZSgpO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGVyZSBhcmUgbm8gcGVuZGluZyBtYWNyby9taWNybyB0YXNrcyBpbiB0aGUgbmV4dCB0aWNrXG4gICAgICAgICAgLy8gdG8gYWxsb3cgZm9yIE5nWm9uZSB0byB1cGRhdGUgdGhlIHN0YXRlLlxuICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGFzayAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgICAhdGhpcy56b25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzICYmXG4gICAgICAgICAgICAgICF0aGlzLnpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3NcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLnBlbmRpbmdUYXNrcy5yZW1vdmUodGFzayk7XG4gICAgICAgICAgICAgIHRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbi5hZGQoXG4gICAgICB0aGlzLnpvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICBOZ1pvbmUuYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpO1xuICAgICAgICB0YXNrID8/PSB0aGlzLnBlbmRpbmdUYXNrcy5hZGQoKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG59XG4iXX0=