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
        this.zonelessEnabled = inject(ZONELESS_ENABLED);
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
export const PROVIDED_NG_ZONE = new InjectionToken(typeof ngDevMode === 'undefined' || ngDevMode ? 'provideZoneChangeDetection token' : '');
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
            ? [{ provide: PROVIDED_NG_ZONE, useValue: true }, bothZoneAndZonelessErrorCheckProvider]
            : [],
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
const bothZoneAndZonelessErrorCheckProvider = {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useFactory: () => {
        const providedZoneless = inject(ZONELESS_ENABLED, { optional: true });
        if (providedZoneless) {
            throw new RuntimeError(408 /* RuntimeErrorCode.PROVIDED_BOTH_ZONE_AND_ZONELESS */, 'Invalid change detection configuration: ' +
                'provideZoneChangeDetection and provideExperimentalZonelessChangeDetection cannot be used together.');
        }
        return () => { };
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9zY2hlZHVsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL25nX3pvbmVfc2NoZWR1bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLE1BQU0sRUFDTixVQUFVLEVBQ1YsY0FBYyxFQUNkLHdCQUF3QixHQUV6QixNQUFNLFVBQVUsQ0FBQztBQUNsQixPQUFPLEVBQUMsWUFBWSxFQUFFLGtDQUFrQyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckYsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHbEMsT0FBTyxFQUFDLDhCQUE4QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3ZELE9BQU8sRUFDTCx3QkFBd0IsRUFDeEIsZ0JBQWdCLEVBQ2hCLDJCQUEyQixHQUM1QixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFBQyw0QkFBNEIsRUFBQyxNQUFNLDRCQUE0QixDQUFDOztBQUd4RSxNQUFNLE9BQU8sOEJBQThCO0lBRDNDO1FBRW1CLFNBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsNkJBQXdCLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFD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SUFDWCxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUNwRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7WUFDckIsTUFBTSxJQUFJLFlBQVksNkRBRXBCLDBDQUEwQztnQkFDeEMsb0dBQW9HLENBQ3ZHLENBQUM7UUFDSixDQUFDO1FBQ0QsT0FBTyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUM7SUFDbEIsQ0FBQztDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmfSBmcm9tICcuLi8uLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtcbiAgRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gIEVudmlyb25tZW50UHJvdmlkZXJzLFxuICBpbmplY3QsXG4gIEluamVjdGFibGUsXG4gIEluamVjdGlvblRva2VuLFxuICBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMsXG4gIFN0YXRpY1Byb3ZpZGVyLFxufSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlciwgSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi8uLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vLi4vem9uZSc7XG5pbXBvcnQge0ludGVybmFsTmdab25lT3B0aW9uc30gZnJvbSAnLi4vLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHthbHdheXNQcm92aWRlWm9uZWxlc3NTY2hlZHVsZXJ9IGZyb20gJy4vZmxhZ3MnO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLFxuICBaT05FTEVTU19FTkFCTEVELFxuICBaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUQsXG59IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsJztcblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID0gaW5qZWN0KENoYW5nZURldGVjdGlvblNjaGVkdWxlciwge29wdGlvbmFsOiB0cnVlfSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwbGljYXRpb25SZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVsZXNzRW5hYmxlZCA9IGluamVjdChaT05FTEVTU19FTkFCTEVEKTtcblxuICBwcml2YXRlIF9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uPzogU3Vic2NyaXB0aW9uO1xuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uID0gdGhpcy56b25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKHtcbiAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgLy8gYG9uTWljcm9UYXNrRW1wdHlgIGNhbiBoYXBwZW4gX2R1cmluZ18gdGhlIHpvbmVsZXNzIHNjaGVkdWxlciBjaGFuZ2UgZGV0ZWN0aW9uIGJlY2F1c2VcbiAgICAgICAgLy8gem9uZS5ydW4oKCkgPT4ge30pIHdpbGwgcmVzdWx0IGluIGBjaGVja1N0YWJsZWAgYXQgdGhlIGVuZCBvZiB0aGUgYHpvbmUucnVuYCBjbG9zdXJlXG4gICAgICAgIC8vIGFuZCBlbWl0IGBvbk1pY3JvdGFza0VtcHR5YCBzeW5jaHJvbm91c2x5IGlmIHJ1biBjb2Fsc2VjaW5nIGlzIGZhbHNlLlxuICAgICAgICBpZiAodGhpcy5jaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXI/LnJ1bm5pbmdUaWNrKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuYXBwbGljYXRpb25SZWYudGljaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdXNlZCB0byB2ZXJpZnkgdGhhdCBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gIGlzIG5vdCB1c2VkXG4gKiB3aXRoIHRoZSBib290c3RyYXBNb2R1bGUgQVBJLlxuICovXG5leHBvcnQgY29uc3QgUFJPVklERURfTkdfWk9ORSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPihcbiAgdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlID8gJ3Byb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uIHRva2VuJyA6ICcnLFxuKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsUHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oe1xuICBuZ1pvbmVGYWN0b3J5LFxuICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUsXG59OiB7XG4gIG5nWm9uZUZhY3Rvcnk/OiAoKSA9PiBOZ1pvbmU7XG4gIGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZT86IGJvb2xlYW47XG59KTogU3RhdGljUHJvdmlkZXJbXSB7XG4gIG5nWm9uZUZhY3RvcnkgPz89ICgpID0+IG5ldyBOZ1pvbmUoZ2V0Tmdab25lT3B0aW9ucygpKTtcbiAgcmV0dXJuIFtcbiAgICB7cHJvdmlkZTogTmdab25lLCB1c2VGYWN0b3J5OiBuZ1pvbmVGYWN0b3J5fSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBjb25zdCBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPSBpbmplY3QoTmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB7XG4gICAgICAgICAgb3B0aW9uYWw6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICAgICBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPT09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19SRVFVSVJFRF9JTkpFQ1RBQkxFX0lOX0JPT1RTVFJBUCxcbiAgICAgICAgICAgIGBBIHJlcXVpcmVkIEluamVjdGFibGUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgZGVwZW5kZW5jeSBpbmplY3Rpb24gdHJlZS4gYCArXG4gICAgICAgICAgICAgICdJZiB5b3UgYXJlIGJvb3RzdHJhcHBpbmcgYW4gTmdNb2R1bGUsIG1ha2Ugc3VyZSB0aGF0IHRoZSBgQnJvd3Nlck1vZHVsZWAgaXMgaW1wb3J0ZWQuJyxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIhLmluaXRpYWxpemUoKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBjb25zdCBzZXJ2aWNlID0gaW5qZWN0KFpvbmVTdGFibGVQZW5kaW5nVGFzayk7XG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgc2VydmljZS5pbml0aWFsaXplKCk7XG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH0sXG4gICAge3Byb3ZpZGU6IElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVIsIHVzZUZhY3Rvcnk6IG5nWm9uZUFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyRmFjdG9yeX0sXG4gICAgLy8gQWx3YXlzIGRpc2FibGUgc2NoZWR1bGVyIHdoZW5ldmVyIGV4cGxpY2l0bHkgZGlzYWJsZWQsIGV2ZW4gaWYgYW5vdGhlciBwbGFjZSBjYWxsZWRcbiAgICAvLyBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gIHdpdGhvdXQgdGhlICdpZ25vcmUnIG9wdGlvbi5cbiAgICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUgPT09IHRydWUgPyB7cHJvdmlkZTogWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELCB1c2VWYWx1ZTogdHJ1ZX0gOiBbXSxcbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBUaGlzIHNob3VsZCBtb3ZlIHRvIHRoZSBzYW1lIHBsYWNlcyB0aGF0IHpvbmUgY2hhbmdlIGRldGVjdGlvbiBpcyBwcm92aWRlZCBieVxuICAgIC8vIGRlZmF1bHQgaW5zdGVhZCBvZiBiZWluZyBpbiB0aGUgem9uZSBzY2hlZHVsaW5nIHByb3ZpZGVycy5cbiAgICBhbHdheXNQcm92aWRlWm9uZWxlc3NTY2hlZHVsZXIgfHwgaWdub3JlQ2hhbmdlc091dHNpZGVab25lID09PSBmYWxzZVxuICAgICAgPyB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH1cbiAgICAgIDogW10sXG4gIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZ1pvbmVBcHBsaWNhdGlvbkVycm9ySGFuZGxlckZhY3RvcnkoKSB7XG4gIGNvbnN0IHpvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgY29uc3QgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICByZXR1cm4gKGU6IHVua25vd24pID0+IHpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdXNlckVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYE5nWm9uZWAtYmFzZWQgY2hhbmdlIGRldGVjdGlvbiBmb3IgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcHBlZCB1c2luZ1xuICogYGJvb3RzdHJhcEFwcGxpY2F0aW9uYC5cbiAqXG4gKiBgTmdab25lYCBpcyBhbHJlYWR5IHByb3ZpZGVkIGluIGFwcGxpY2F0aW9ucyBieSBkZWZhdWx0LiBUaGlzIHByb3ZpZGVyIGFsbG93cyB5b3UgdG8gY29uZmlndXJlXG4gKiBvcHRpb25zIGxpa2UgYGV2ZW50Q29hbGVzY2luZ2AgaW4gdGhlIGBOZ1pvbmVgLlxuICogVGhpcyBwcm92aWRlciBpcyBub3QgYXZhaWxhYmxlIGZvciBgcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlYCwgd2hpY2ggdXNlc1xuICogYEJvb3RzdHJhcE9wdGlvbnNgIGluc3RlYWQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKE15QXBwLCB7cHJvdmlkZXJzOiBbXG4gKiAgIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtldmVudENvYWxlc2Npbmc6IHRydWV9KSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBzZWUge0BsaW5rIGJvb3RzdHJhcEFwcGxpY2F0aW9ufVxuICogQHNlZSB7QGxpbmsgTmdab25lT3B0aW9uc31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICBjb25zdCBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUgPSBvcHRpb25zPy5pZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmU7XG4gIGNvbnN0IHpvbmVQcm92aWRlcnMgPSBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtcbiAgICBuZ1pvbmVGYWN0b3J5OiAoKSA9PiB7XG4gICAgICBjb25zdCBuZ1pvbmVPcHRpb25zID0gZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgIGlmIChuZ1pvbmVPcHRpb25zLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgICAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lX0NvYWxlc2NlRXZlbnQnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgTmdab25lKG5nWm9uZU9wdGlvbnMpO1xuICAgIH0sXG4gICAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lLFxuICB9KTtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAgdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlXG4gICAgICA/IFt7cHJvdmlkZTogUFJPVklERURfTkdfWk9ORSwgdXNlVmFsdWU6IHRydWV9LCBib3RoWm9uZUFuZFpvbmVsZXNzRXJyb3JDaGVja1Byb3ZpZGVyXVxuICAgICAgOiBbXSxcbiAgICB6b25lUHJvdmlkZXJzLFxuICBdKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNvbmZpZ3VyZSBldmVudCBhbmQgcnVuIGNvYWxlc2Npbmcgd2l0aCBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqXG4gKiBAc2VlIHtAbGluayBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ1pvbmVPcHRpb25zIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBjb2FsZXNjaW5nIGV2ZW50IGNoYW5nZSBkZXRlY3Rpb25zIG9yIG5vdC5cbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPlxuICAgKiAgIDxidXR0b24gKGNsaWNrKT1cImRvU29tZXRoaW5nRWxzZSgpXCI+PC9idXR0b24+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2FsZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIG9ubHkgdHJpZ2dlclxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIG9ubHkgb25jZS5cbiAgICpcbiAgICogQnkgZGVmYXVsdCwgdGhpcyBvcHRpb24gd2lsbCBiZSBmYWxzZS4gU28gdGhlIGV2ZW50cyB3aWxsIG5vdCBiZVxuICAgKiBjb2FsZXNjZWQgYW5kIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmUgdHJpZ2dlcmVkIG11bHRpcGxlIHRpbWVzLlxuICAgKiBBbmQgaWYgdGhpcyBvcHRpb24gYmUgc2V0IHRvIHRydWUsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkIGFzeW5jIGJ5IHNjaGVkdWxpbmcgYSBhbmltYXRpb24gZnJhbWUuIFNvIGluIHRoZSBjYXNlIGFib3ZlLFxuICAgKiB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIG9uY2UuXG4gICAqL1xuICBldmVudENvYWxlc2Npbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgaWYgYE5nWm9uZSNydW4oKWAgbWV0aG9kIGludm9jYXRpb25zIHNob3VsZCBiZSBjb2FsZXNjZWRcbiAgICogaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqIGBgYFxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogVGhpcyBjYXNlIHRyaWdnZXJzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIG11bHRpcGxlIHRpbWVzLlxuICAgKiBXaXRoIG5nWm9uZVJ1bkNvYWxlc2Npbmcgb3B0aW9ucywgYWxsIGNoYW5nZSBkZXRlY3Rpb25zIGluIGFuIGV2ZW50IGxvb3AgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgcnVuQ29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZW4gZmFsc2UsIGNoYW5nZSBkZXRlY3Rpb24gaXMgc2NoZWR1bGVkIHdoZW4gQW5ndWxhciByZWNlaXZlc1xuICAgKiBhIGNsZWFyIGluZGljYXRpb24gdGhhdCB0ZW1wbGF0ZXMgbmVlZCB0byBiZSByZWZyZXNoZWQuIFRoaXMgaW5jbHVkZXM6XG4gICAqXG4gICAqIC0gY2FsbGluZyBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYFxuICAgKiAtIGNhbGxpbmcgYENvbXBvbmVudFJlZi5zZXRJbnB1dGBcbiAgICogLSB1cGRhdGluZyBhIHNpZ25hbCB0aGF0IGlzIHJlYWQgaW4gYSB0ZW1wbGF0ZVxuICAgKiAtIHdoZW4gYm91bmQgaG9zdCBvciB0ZW1wbGF0ZSBsaXN0ZW5lcnMgYXJlIHRyaWdnZXJlZFxuICAgKiAtIGF0dGFjaGluZyBhIHZpZXcgdGhhdCBpcyBtYXJrZWQgZGlydHlcbiAgICogLSByZW1vdmluZyBhIHZpZXdcbiAgICogLSByZWdpc3RlcmluZyBhIHJlbmRlciBob29rICh0ZW1wbGF0ZXMgYXJlIG9ubHkgcmVmcmVzaGVkIGlmIHJlbmRlciBob29rcyBkbyBvbmUgb2YgdGhlIGFib3ZlKVxuICAgKi9cbiAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lPzogYm9vbGVhbjtcbn1cblxuLy8gVHJhbnNmb3JtcyBhIHNldCBvZiBgQm9vdHN0cmFwT3B0aW9uc2AgKHN1cHBvcnRlZCBieSB0aGUgTmdNb2R1bGUtYmFzZWQgYm9vdHN0cmFwIEFQSXMpIC0+XG4vLyBgTmdab25lT3B0aW9uc2AgdGhhdCBhcmUgcmVjb2duaXplZCBieSB0aGUgTmdab25lIGNvbnN0cnVjdG9yLiBQYXNzaW5nIG5vIG9wdGlvbnMgd2lsbCByZXN1bHQgaW5cbi8vIGEgc2V0IG9mIGRlZmF1bHQgb3B0aW9ucyByZXR1cm5lZC5cbmV4cG9ydCBmdW5jdGlvbiBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogSW50ZXJuYWxOZ1pvbmVPcHRpb25zIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVMb25nU3RhY2tUcmFjZTogdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6ICEhbmdEZXZNb2RlLFxuICAgIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IG9wdGlvbnM/LmV2ZW50Q29hbGVzY2luZyA/PyBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogb3B0aW9ucz8ucnVuQ29hbGVzY2luZyA/PyBmYWxzZSxcbiAgfTtcbn1cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgWm9uZVN0YWJsZVBlbmRpbmdUYXNrIHtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJzY3JpcHRpb24gPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAgIGxldCB0YXNrOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICBpZiAoIXRoaXMuem9uZS5pc1N0YWJsZSAmJiAhdGhpcy56b25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzICYmICF0aGlzLnpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MpIHtcbiAgICAgIHRhc2sgPSB0aGlzLnBlbmRpbmdUYXNrcy5hZGQoKTtcbiAgICB9XG5cbiAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb24uYWRkKFxuICAgICAgICB0aGlzLnpvbmUub25TdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICBOZ1pvbmUuYXNzZXJ0Tm90SW5Bbmd1bGFyWm9uZSgpO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGVyZSBhcmUgbm8gcGVuZGluZyBtYWNyby9taWNybyB0YXNrcyBpbiB0aGUgbmV4dCB0aWNrXG4gICAgICAgICAgLy8gdG8gYWxsb3cgZm9yIE5nWm9uZSB0byB1cGRhdGUgdGhlIHN0YXRlLlxuICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgdGFzayAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgICAhdGhpcy56b25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzICYmXG4gICAgICAgICAgICAgICF0aGlzLnpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3NcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLnBlbmRpbmdUYXNrcy5yZW1vdmUodGFzayk7XG4gICAgICAgICAgICAgIHRhc2sgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbi5hZGQoXG4gICAgICB0aGlzLnpvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICBOZ1pvbmUuYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpO1xuICAgICAgICB0YXNrID8/PSB0aGlzLnBlbmRpbmdUYXNrcy5hZGQoKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbmNvbnN0IGJvdGhab25lQW5kWm9uZWxlc3NFcnJvckNoZWNrUHJvdmlkZXIgPSB7XG4gIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICBtdWx0aTogdHJ1ZSxcbiAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgIGNvbnN0IHByb3ZpZGVkWm9uZWxlc3MgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCwge29wdGlvbmFsOiB0cnVlfSk7XG4gICAgaWYgKHByb3ZpZGVkWm9uZWxlc3MpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUFJPVklERURfQk9USF9aT05FX0FORF9aT05FTEVTUyxcbiAgICAgICAgJ0ludmFsaWQgY2hhbmdlIGRldGVjdGlvbiBjb25maWd1cmF0aW9uOiAnICtcbiAgICAgICAgICAncHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24gYW5kIHByb3ZpZGVFeHBlcmltZW50YWxab25lbGVzc0NoYW5nZURldGVjdGlvbiBjYW5ub3QgYmUgdXNlZCB0b2dldGhlci4nLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IHt9O1xuICB9LFxufTtcbiJdfQ==