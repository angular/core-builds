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
import { RuntimeError } from '../../errors';
import { PendingTasks } from '../../pending_tasks';
import { performanceMarkFeature } from '../../util/performance';
import { NgZone } from '../../zone';
import { ChangeDetectionScheduler, ZONELESS_SCHEDULER_DISABLED, ZONELESS_ENABLED, } from './zoneless_scheduling';
import * as i0 from "../../r3_symbols";
export class NgZoneChangeDetectionScheduler {
    constructor() {
        this.zone = inject(NgZone);
        this.changeDetectionScheduler = inject(ChangeDetectionScheduler);
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
                if (this.changeDetectionScheduler.runningTick) {
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
    static { this.ɵfac = function NgZoneChangeDetectionScheduler_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || NgZoneChangeDetectionScheduler)(); }; }
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
        // Always disable scheduler whenever explicitly disabled, even if another place called
        // `provideZoneChangeDetection` without the 'ignore' option.
        ignoreChangesOutsideZone === true ? { provide: ZONELESS_SCHEDULER_DISABLED, useValue: true } : [],
    ];
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
        { provide: PROVIDED_NG_ZONE, useValue: true },
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
    static { this.ɵfac = function ZoneStablePendingTask_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ZoneStablePendingTask)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ZoneStablePendingTask, factory: ZoneStablePendingTask.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ZoneStablePendingTask, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9zY2hlZHVsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL25nX3pvbmVfc2NoZWR1bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLE1BQU0sRUFDTixVQUFVLEVBQ1YsY0FBYyxFQUNkLHdCQUF3QixHQUV6QixNQUFNLFVBQVUsQ0FBQztBQUNsQixPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUM1RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUdsQyxPQUFPLEVBQ0wsd0JBQXdCLEVBQ3hCLDJCQUEyQixFQUMzQixnQkFBZ0IsR0FDakIsTUFBTSx1QkFBdUIsQ0FBQzs7QUFHL0IsTUFBTSxPQUFPLDhCQUE4QjtJQUQzQztRQUVtQixTQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLDZCQUF3QixHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQzVELG1CQUFjLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0tBMkIxRDtJQXZCQyxVQUFVO1FBQ1IsSUFBSSxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztZQUN2QyxPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGdC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QUM7SUFDSixDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbEMsQ0FBQztzSEFoRFUscUJBQXFCO3VFQUFyQixxQkFBcUIsV0FBckIscUJBQXFCLG1CQURULE1BQU07O2dGQUNsQixxQkFBcUI7Y0FEakMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge1xuICBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgRW52aXJvbm1lbnRQcm92aWRlcnMsXG4gIGluamVjdCxcbiAgSW5qZWN0YWJsZSxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyxcbiAgU3RhdGljUHJvdmlkZXIsXG59IGZyb20gJy4uLy4uL2RpJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi8uLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi8uLi96b25lJztcbmltcG9ydCB7SW50ZXJuYWxOZ1pvbmVPcHRpb25zfSBmcm9tICcuLi8uLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsXG4gIFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCxcbiAgWk9ORUxFU1NfRU5BQkxFRCxcbn0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nJztcblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgTmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID0gaW5qZWN0KENoYW5nZURldGVjdGlvblNjaGVkdWxlcik7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwbGljYXRpb25SZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuXG4gIHByaXZhdGUgX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24/OiBTdWJzY3JpcHRpb247XG5cbiAgaW5pdGlhbGl6ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24gPSB0aGlzLnpvbmUub25NaWNyb3Rhc2tFbXB0eS5zdWJzY3JpYmUoe1xuICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAvLyBgb25NaWNyb1Rhc2tFbXB0eWAgY2FuIGhhcHBlbiBfZHVyaW5nXyB0aGUgem9uZWxlc3Mgc2NoZWR1bGVyIGNoYW5nZSBkZXRlY3Rpb24gYmVjYXVzZVxuICAgICAgICAvLyB6b25lLnJ1bigoKSA9PiB7fSkgd2lsbCByZXN1bHQgaW4gYGNoZWNrU3RhYmxlYCBhdCB0aGUgZW5kIG9mIHRoZSBgem9uZS5ydW5gIGNsb3N1cmVcbiAgICAgICAgLy8gYW5kIGVtaXQgYG9uTWljcm90YXNrRW1wdHlgIHN5bmNocm9ub3VzbHkgaWYgcnVuIGNvYWxzZWNpbmcgaXMgZmFsc2UuXG4gICAgICAgIGlmICh0aGlzLmNoYW5nZURldGVjdGlvblNjaGVkdWxlci5ydW5uaW5nVGljaykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmFwcGxpY2F0aW9uUmVmLnRpY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYCBpcyBub3QgdXNlZFxuICogd2l0aCB0aGUgYm9vdHN0cmFwTW9kdWxlIEFQSS5cbiAqL1xuZXhwb3J0IGNvbnN0IFBST1ZJREVEX05HX1pPTkUgPSBuZXcgSW5qZWN0aW9uVG9rZW48Ym9vbGVhbj4oXG4gIHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSA/ICdwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbiB0b2tlbicgOiAnJyxcbiAge2ZhY3Rvcnk6ICgpID0+IGZhbHNlfSxcbik7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtcbiAgbmdab25lRmFjdG9yeSxcbiAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lLFxufToge1xuICBuZ1pvbmVGYWN0b3J5PzogKCkgPT4gTmdab25lO1xuICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmU/OiBib29sZWFuO1xufSk6IFN0YXRpY1Byb3ZpZGVyW10ge1xuICBuZ1pvbmVGYWN0b3J5ID8/PSAoKSA9PiBuZXcgTmdab25lKGdldE5nWm9uZU9wdGlvbnMoKSk7XG4gIHJldHVybiBbXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlRmFjdG9yeTogbmdab25lRmFjdG9yeX0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgY29uc3Qgbmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID0gaW5qZWN0KE5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciwge1xuICAgICAgICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAgICAgbmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID09PSBudWxsXG4gICAgICAgICkge1xuICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfUkVRVUlSRURfSU5KRUNUQUJMRV9JTl9CT09UU1RSQVAsXG4gICAgICAgICAgICBgQSByZXF1aXJlZCBJbmplY3RhYmxlIHdhcyBub3QgZm91bmQgaW4gdGhlIGRlcGVuZGVuY3kgaW5qZWN0aW9uIHRyZWUuIGAgK1xuICAgICAgICAgICAgICAnSWYgeW91IGFyZSBib290c3RyYXBwaW5nIGFuIE5nTW9kdWxlLCBtYWtlIHN1cmUgdGhhdCB0aGUgYEJyb3dzZXJNb2R1bGVgIGlzIGltcG9ydGVkLicsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4gbmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIS5pbml0aWFsaXplKCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgY29uc3Qgc2VydmljZSA9IGluamVjdChab25lU3RhYmxlUGVuZGluZ1Rhc2spO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIHNlcnZpY2UuaW5pdGlhbGl6ZSgpO1xuICAgICAgICB9O1xuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIEFsd2F5cyBkaXNhYmxlIHNjaGVkdWxlciB3aGVuZXZlciBleHBsaWNpdGx5IGRpc2FibGVkLCBldmVuIGlmIGFub3RoZXIgcGxhY2UgY2FsbGVkXG4gICAgLy8gYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYCB3aXRob3V0IHRoZSAnaWdub3JlJyBvcHRpb24uXG4gICAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lID09PSB0cnVlID8ge3Byb3ZpZGU6IFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwgdXNlVmFsdWU6IHRydWV9IDogW10sXG4gIF07XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYE5nWm9uZWAtYmFzZWQgY2hhbmdlIGRldGVjdGlvbiBmb3IgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcHBlZCB1c2luZ1xuICogYGJvb3RzdHJhcEFwcGxpY2F0aW9uYC5cbiAqXG4gKiBgTmdab25lYCBpcyBhbHJlYWR5IHByb3ZpZGVkIGluIGFwcGxpY2F0aW9ucyBieSBkZWZhdWx0LiBUaGlzIHByb3ZpZGVyIGFsbG93cyB5b3UgdG8gY29uZmlndXJlXG4gKiBvcHRpb25zIGxpa2UgYGV2ZW50Q29hbGVzY2luZ2AgaW4gdGhlIGBOZ1pvbmVgLlxuICogVGhpcyBwcm92aWRlciBpcyBub3QgYXZhaWxhYmxlIGZvciBgcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlYCwgd2hpY2ggdXNlc1xuICogYEJvb3RzdHJhcE9wdGlvbnNgIGluc3RlYWQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKE15QXBwLCB7cHJvdmlkZXJzOiBbXG4gKiAgIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtldmVudENvYWxlc2Npbmc6IHRydWV9KSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBzZWUge0BsaW5rIGJvb3RzdHJhcEFwcGxpY2F0aW9ufVxuICogQHNlZSB7QGxpbmsgTmdab25lT3B0aW9uc31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICBjb25zdCBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmUgPSBvcHRpb25zPy5pZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmU7XG4gIGNvbnN0IHpvbmVQcm92aWRlcnMgPSBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtcbiAgICBuZ1pvbmVGYWN0b3J5OiAoKSA9PiB7XG4gICAgICBjb25zdCBuZ1pvbmVPcHRpb25zID0gZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgIGlmIChuZ1pvbmVPcHRpb25zLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgICAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lX0NvYWxlc2NlRXZlbnQnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgTmdab25lKG5nWm9uZU9wdGlvbnMpO1xuICAgIH0sXG4gICAgaWdub3JlQ2hhbmdlc091dHNpZGVab25lLFxuICB9KTtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge3Byb3ZpZGU6IFBST1ZJREVEX05HX1pPTkUsIHVzZVZhbHVlOiB0cnVlfSxcbiAgICB7cHJvdmlkZTogWk9ORUxFU1NfRU5BQkxFRCwgdXNlVmFsdWU6IGZhbHNlfSxcbiAgICB6b25lUHJvdmlkZXJzLFxuICBdKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNvbmZpZ3VyZSBldmVudCBhbmQgcnVuIGNvYWxlc2Npbmcgd2l0aCBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqXG4gKiBAc2VlIHtAbGluayBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ1pvbmVPcHRpb25zIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBjb2FsZXNjaW5nIGV2ZW50IGNoYW5nZSBkZXRlY3Rpb25zIG9yIG5vdC5cbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPlxuICAgKiAgIDxidXR0b24gKGNsaWNrKT1cImRvU29tZXRoaW5nRWxzZSgpXCI+PC9idXR0b24+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2FsZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIG9ubHkgdHJpZ2dlclxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIG9ubHkgb25jZS5cbiAgICpcbiAgICogQnkgZGVmYXVsdCwgdGhpcyBvcHRpb24gd2lsbCBiZSBmYWxzZS4gU28gdGhlIGV2ZW50cyB3aWxsIG5vdCBiZVxuICAgKiBjb2FsZXNjZWQgYW5kIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmUgdHJpZ2dlcmVkIG11bHRpcGxlIHRpbWVzLlxuICAgKiBBbmQgaWYgdGhpcyBvcHRpb24gYmUgc2V0IHRvIHRydWUsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkIGFzeW5jIGJ5IHNjaGVkdWxpbmcgYSBhbmltYXRpb24gZnJhbWUuIFNvIGluIHRoZSBjYXNlIGFib3ZlLFxuICAgKiB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIG9uY2UuXG4gICAqL1xuICBldmVudENvYWxlc2Npbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgaWYgYE5nWm9uZSNydW4oKWAgbWV0aG9kIGludm9jYXRpb25zIHNob3VsZCBiZSBjb2FsZXNjZWRcbiAgICogaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqIGBgYFxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogVGhpcyBjYXNlIHRyaWdnZXJzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIG11bHRpcGxlIHRpbWVzLlxuICAgKiBXaXRoIG5nWm9uZVJ1bkNvYWxlc2Npbmcgb3B0aW9ucywgYWxsIGNoYW5nZSBkZXRlY3Rpb25zIGluIGFuIGV2ZW50IGxvb3AgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgcnVuQ29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZW4gZmFsc2UsIGNoYW5nZSBkZXRlY3Rpb24gaXMgc2NoZWR1bGVkIHdoZW4gQW5ndWxhciByZWNlaXZlc1xuICAgKiBhIGNsZWFyIGluZGljYXRpb24gdGhhdCB0ZW1wbGF0ZXMgbmVlZCB0byBiZSByZWZyZXNoZWQuIFRoaXMgaW5jbHVkZXM6XG4gICAqXG4gICAqIC0gY2FsbGluZyBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYFxuICAgKiAtIGNhbGxpbmcgYENvbXBvbmVudFJlZi5zZXRJbnB1dGBcbiAgICogLSB1cGRhdGluZyBhIHNpZ25hbCB0aGF0IGlzIHJlYWQgaW4gYSB0ZW1wbGF0ZVxuICAgKiAtIGF0dGFjaGluZyBhIHZpZXcgdGhhdCBpcyBtYXJrZWQgZGlydHlcbiAgICogLSByZW1vdmluZyBhIHZpZXdcbiAgICogLSByZWdpc3RlcmluZyBhIHJlbmRlciBob29rICh0ZW1wbGF0ZXMgYXJlIG9ubHkgcmVmcmVzaGVkIGlmIHJlbmRlciBob29rcyBkbyBvbmUgb2YgdGhlIGFib3ZlKVxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBUaGlzIG9wdGlvbiB3YXMgaW50cm9kdWNlZCBvdXQgb2YgY2F1dGlvbiBhcyBhIHdheSBmb3IgZGV2ZWxvcGVycyB0byBvcHQgb3V0IG9mIHRoZVxuICAgKiAgICBuZXcgYmVoYXZpb3IgaW4gdjE4IHdoaWNoIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gZm9yIHRoZSBhYm92ZSBldmVudHMgd2hlbiB0aGV5IG9jY3VyXG4gICAqICAgIG91dHNpZGUgdGhlIFpvbmUuIEFmdGVyIG1vbml0b3JpbmcgdGhlIHJlc3VsdHMgcG9zdC1yZWxlYXNlLCB3ZSBoYXZlIGRldGVybWluZWQgdGhhdCB0aGlzXG4gICAqICAgIGZlYXR1cmUgaXMgd29ya2luZyBhcyBkZXNpcmVkIGFuZCBkbyBub3QgYmVsaWV2ZSBpdCBzaG91bGQgZXZlciBiZSBkaXNhYmxlZCBieSBzZXR0aW5nXG4gICAqICAgIHRoaXMgb3B0aW9uIHRvIGB0cnVlYC5cbiAgICovXG4gIGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZT86IGJvb2xlYW47XG59XG5cbi8vIFRyYW5zZm9ybXMgYSBzZXQgb2YgYEJvb3RzdHJhcE9wdGlvbnNgIChzdXBwb3J0ZWQgYnkgdGhlIE5nTW9kdWxlLWJhc2VkIGJvb3RzdHJhcCBBUElzKSAtPlxuLy8gYE5nWm9uZU9wdGlvbnNgIHRoYXQgYXJlIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZSBjb25zdHJ1Y3Rvci4gUGFzc2luZyBubyBvcHRpb25zIHdpbGwgcmVzdWx0IGluXG4vLyBhIHNldCBvZiBkZWZhdWx0IG9wdGlvbnMgcmV0dXJuZWQuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zPzogTmdab25lT3B0aW9ucyk6IEludGVybmFsTmdab25lT3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiAhIW5nRGV2TW9kZSxcbiAgICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBvcHRpb25zPy5ldmVudENvYWxlc2NpbmcgPz8gZmFsc2UsXG4gICAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IG9wdGlvbnM/LnJ1bkNvYWxlc2NpbmcgPz8gZmFsc2UsXG4gIH07XG59XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFpvbmVTdGFibGVQZW5kaW5nVGFzayB7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3Vic2NyaXB0aW9uID0gbmV3IFN1YnNjcmlwdGlvbigpO1xuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IHBlbmRpbmdUYXNrcyA9IGluamVjdChQZW5kaW5nVGFza3MpO1xuXG4gIGluaXRpYWxpemUoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG5cbiAgICBsZXQgdGFzazogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKCF0aGlzLnpvbmUuaXNTdGFibGUgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJiAhdGhpcy56b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICB0YXNrID0gdGhpcy5wZW5kaW5nVGFza3MuYWRkKCk7XG4gICAgfVxuXG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZChcbiAgICAgICAgdGhpcy56b25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgTmdab25lLmFzc2VydE5vdEluQW5ndWxhclpvbmUoKTtcblxuICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlcmUgYXJlIG5vIHBlbmRpbmcgbWFjcm8vbWljcm8gdGFza3MgaW4gdGhlIG5leHQgdGlja1xuICAgICAgICAgIC8vIHRvIGFsbG93IGZvciBOZ1pvbmUgdG8gdXBkYXRlIHRoZSBzdGF0ZS5cbiAgICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRhc2sgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJlxuICAgICAgICAgICAgICAhdGhpcy56b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nVGFza3MucmVtb3ZlKHRhc2spO1xuICAgICAgICAgICAgICB0YXNrID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb24uYWRkKFxuICAgICAgdGhpcy56b25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgICAgdGFzayA/Pz0gdGhpcy5wZW5kaW5nVGFza3MuYWRkKCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuIl19