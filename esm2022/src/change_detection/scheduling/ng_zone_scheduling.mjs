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
        schedulingMode === 1 /* SchedulingMode.NgZoneOnly */ ?
            { provide: ZONELESS_SCHEDULER_DISABLED, useValue: true } :
            [],
        // Only provide scheduler when explicitly enabled
        schedulingMode === 0 /* SchedulingMode.Hybrid */ ?
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9zY2hlZHVsaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL25nX3pvbmVfc2NoZWR1bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsdUJBQXVCLEVBQXdCLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFpQixNQUFNLFVBQVUsQ0FBQztBQUNySixPQUFPLEVBQUMsWUFBWSxFQUFFLGtDQUFrQyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDckYsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHbEMsT0FBTyxFQUFDLHdCQUF3QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUYsT0FBTyxFQUFDLDRCQUE0QixFQUFDLE1BQU0sNEJBQTRCLENBQUM7O0FBR3hFLE1BQU0sT0FBTyw4QkFBOEI7SUFEM0M7UUFFbUIsU0FBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0Qiw2QkFBd0IsR0FBRyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUM5RSxtQkFBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztLQXlCMUQ7SUFyQkMsVUFBVTtRQUNSLElBQUksSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7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QUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1lBQ3hELE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdCLElBQUksS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDTixDQUFDO0lBR0QsV0FBVztRQUNULElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbEMsQ0FBQztzRkF6Q1UscUJBQXFCO3VFQUFyQixxQkFBcUIsV0FBckIscUJBQXFCLG1CQURULE1BQU07O2dGQUNsQixxQkFBcUI7Y0FEakMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudFByb3ZpZGVycywgaW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzLCBTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXIsIElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vLi4vem9uZSc7XG5pbXBvcnQge0ludGVybmFsTmdab25lT3B0aW9uc30gZnJvbSAnLi4vLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRH0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nJztcbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nX2ltcGwnO1xuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBOZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgcHJpdmF0ZSByZWFkb25seSBjaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPSBpbmplY3QoQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgcHJpdmF0ZSByZWFkb25seSBhcHBsaWNhdGlvblJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG5cbiAgcHJpdmF0ZSBfb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcblxuICBpbml0aWFsaXplKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbiA9IHRoaXMuem9uZS5vbk1pY3JvdGFza0VtcHR5LnN1YnNjcmliZSh7XG4gICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmNoYW5nZURldGVjdGlvblNjaGVkdWxlcikge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIudGljayh0cnVlIC8qIHNob3VsZFJlZnJlc2hWaWV3cyAqLyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYXBwbGljYXRpb25SZWYudGljaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cblxuLyoqXG4gKiBJbnRlcm5hbCB0b2tlbiB1c2VkIHRvIHZlcmlmeSB0aGF0IGBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbmAgaXMgbm90IHVzZWRcbiAqIHdpdGggdGhlIGJvb3RzdHJhcE1vZHVsZSBBUEkuXG4gKi9cbmV4cG9ydCBjb25zdCBQUk9WSURFRF9OR19aT05FID0gbmV3IEluamVjdGlvblRva2VuPGJvb2xlYW4+KFxuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID8gJ3Byb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uIHRva2VuJyA6ICcnKTtcblxuLyoqXG4gKiBDb25maWd1cmVzIGNoYW5nZSBkZXRlY3Rpb24gc2NoZWR1bGluZyB3aGVuIHVzaW5nIFpvbmVKUy5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU2NoZWR1bGluZ01vZGUge1xuICAvKipcbiAgICogQ2hhbmdlIGRldGVjdGlvbiB3aWxsIHJ1biB3aGVuIHRoZSBgTmdab25lLm9uTWljcm90YXNrRW1wdHlgIG9ic2VydmFibGUgZW1pdHMuXG4gICAqIENoYW5nZSBkZXRlY3Rpb24gd2lsbCBhbHNvIGJlIHNjaGVkdWxlZCB0byBydW4gd2hlbmV2ZXIgQW5ndWxhciBpcyBub3RpZmllZFxuICAgKiBvZiBhIGNoYW5nZS4gVGhpcyBpbmNsdWRlcyBjYWxsaW5nIGBDaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2tgLFxuICAgKiBzZXR0aW5nIGEgYHNpZ25hbGAgdmFsdWUsIGFuZCBhdHRhY2hpbmcgYSB2aWV3LlxuICAgKi9cbiAgSHlicmlkLFxuICAvKipcbiAgICogQ2hhbmdlIGRldGVjdGlvbiB3aWxsIG9ubHkgcnVuIHdoZW4gdGhlIGBOZ1pvbmUub25NaWNyb3Rhc2tFbXB0eWAgb2JzZXJ2YWJsZSBlbWl0cy5cbiAgICovXG4gIE5nWm9uZU9ubHksXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKFxuICAgIHtuZ1pvbmVGYWN0b3J5LCBzY2hlZHVsaW5nTW9kZX06XG4gICAgICAgIHtuZ1pvbmVGYWN0b3J5OiAoKSA9PiBOZ1pvbmUsIHNjaGVkdWxpbmdNb2RlPzogU2NoZWR1bGluZ01vZGV9KTogU3RhdGljUHJvdmlkZXJbXSB7XG4gIHJldHVybiBbXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlRmFjdG9yeTogbmdab25lRmFjdG9yeX0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgY29uc3Qgbmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyID1cbiAgICAgICAgICAgIGluamVjdChOZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICAgICAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICAgICAgIG5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19SRVFVSVJFRF9JTkpFQ1RBQkxFX0lOX0JPT1RTVFJBUCxcbiAgICAgICAgICAgICAgYEEgcmVxdWlyZWQgSW5qZWN0YWJsZSB3YXMgbm90IGZvdW5kIGluIHRoZSBkZXBlbmRlbmN5IGluamVjdGlvbiB0cmVlLiBgICtcbiAgICAgICAgICAgICAgICAgICdJZiB5b3UgYXJlIGJvb3RzdHJhcHBpbmcgYW4gTmdNb2R1bGUsIG1ha2Ugc3VyZSB0aGF0IHRoZSBgQnJvd3Nlck1vZHVsZWAgaXMgaW1wb3J0ZWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICgpID0+IG5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciEuaW5pdGlhbGl6ZSgpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlcnZpY2UgPSBpbmplY3QoWm9uZVN0YWJsZVBlbmRpbmdUYXNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICBzZXJ2aWNlLmluaXRpYWxpemUoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHtwcm92aWRlOiBJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSLCB1c2VGYWN0b3J5OiBuZ1pvbmVBcHBsaWNhdGlvbkVycm9ySGFuZGxlckZhY3Rvcnl9LFxuICAgIC8vIEFsd2F5cyBkaXNhYmxlIHNjaGVkdWxlciB3aGVuZXZlciBleHBsaWNpdGx5IGRpc2FibGVkLCBldmVuIGlmIEh5YnJpZCB3YXMgc3BlY2lmaWVkIGVsc2V3aGVyZVxuICAgIHNjaGVkdWxpbmdNb2RlID09PSBTY2hlZHVsaW5nTW9kZS5OZ1pvbmVPbmx5ID9cbiAgICAgICAge3Byb3ZpZGU6IFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwgdXNlVmFsdWU6IHRydWV9IDpcbiAgICAgICAgW10sXG4gICAgLy8gT25seSBwcm92aWRlIHNjaGVkdWxlciB3aGVuIGV4cGxpY2l0bHkgZW5hYmxlZFxuICAgIHNjaGVkdWxpbmdNb2RlID09PSBTY2hlZHVsaW5nTW9kZS5IeWJyaWQgP1xuICAgICAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0gOlxuICAgICAgICBbXSxcbiAgXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5nWm9uZUFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyRmFjdG9yeSgpIHtcbiAgY29uc3Qgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBjb25zdCB1c2VyRXJyb3JIYW5kbGVyID0gaW5qZWN0KEVycm9ySGFuZGxlcik7XG4gIHJldHVybiAoZTogdW5rbm93bikgPT4gem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB1c2VyRXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBgTmdab25lYC1iYXNlZCBjaGFuZ2UgZGV0ZWN0aW9uIGZvciB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkIHVzaW5nXG4gKiBgYm9vdHN0cmFwQXBwbGljYXRpb25gLlxuICpcbiAqIGBOZ1pvbmVgIGlzIGFscmVhZHkgcHJvdmlkZWQgaW4gYXBwbGljYXRpb25zIGJ5IGRlZmF1bHQuIFRoaXMgcHJvdmlkZXIgYWxsb3dzIHlvdSB0byBjb25maWd1cmVcbiAqIG9wdGlvbnMgbGlrZSBgZXZlbnRDb2FsZXNjaW5nYCBpbiB0aGUgYE5nWm9uZWAuXG4gKiBUaGlzIHByb3ZpZGVyIGlzIG5vdCBhdmFpbGFibGUgZm9yIGBwbGF0Zm9ybUJyb3dzZXIoKS5ib290c3RyYXBNb2R1bGVgLCB3aGljaCB1c2VzXG4gKiBgQm9vdHN0cmFwT3B0aW9uc2AgaW5zdGVhZC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogYGBgdHlwZXNjcmlwdFxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oTXlBcHAsIHtwcm92aWRlcnM6IFtcbiAqICAgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oe2V2ZW50Q29hbGVzY2luZzogdHJ1ZX0pLFxuICogXX0pO1xuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICogQHNlZSB7QGxpbmsgYm9vdHN0cmFwQXBwbGljYXRpb259XG4gKiBAc2VlIHtAbGluayBOZ1pvbmVPcHRpb25zfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24ob3B0aW9ucz86IE5nWm9uZU9wdGlvbnMpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIGNvbnN0IHNjaGVkdWxpbmdNb2RlID0gKG9wdGlvbnMgYXMgYW55KT8uc2NoZWR1bGluZ01vZGU7XG4gIGNvbnN0IHpvbmVQcm92aWRlcnMgPSBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKFxuICAgICAge25nWm9uZUZhY3Rvcnk6ICgpID0+IG5ldyBOZ1pvbmUoZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zKSksIHNjaGVkdWxpbmdNb2RlfSk7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID8ge3Byb3ZpZGU6IFBST1ZJREVEX05HX1pPTkUsIHVzZVZhbHVlOiB0cnVlfSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXSxcbiAgICB6b25lUHJvdmlkZXJzLFxuICBdKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNvbmZpZ3VyZSBldmVudCBhbmQgcnVuIGNvYWxlc2Npbmcgd2l0aCBgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb25gLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqXG4gKiBAc2VlIHtAbGluayBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZ1pvbmVPcHRpb25zIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBjb2FsZXNjaW5nIGV2ZW50IGNoYW5nZSBkZXRlY3Rpb25zIG9yIG5vdC5cbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPlxuICAgKiAgIDxidXR0b24gKGNsaWNrKT1cImRvU29tZXRoaW5nRWxzZSgpXCI+PC9idXR0b24+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2FsZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIG9ubHkgdHJpZ2dlclxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIG9ubHkgb25jZS5cbiAgICpcbiAgICogQnkgZGVmYXVsdCwgdGhpcyBvcHRpb24gd2lsbCBiZSBmYWxzZS4gU28gdGhlIGV2ZW50cyB3aWxsIG5vdCBiZVxuICAgKiBjb2FsZXNjZWQgYW5kIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmUgdHJpZ2dlcmVkIG11bHRpcGxlIHRpbWVzLlxuICAgKiBBbmQgaWYgdGhpcyBvcHRpb24gYmUgc2V0IHRvIHRydWUsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkIGFzeW5jIGJ5IHNjaGVkdWxpbmcgYSBhbmltYXRpb24gZnJhbWUuIFNvIGluIHRoZSBjYXNlIGFib3ZlLFxuICAgKiB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIG9uY2UuXG4gICAqL1xuICBldmVudENvYWxlc2Npbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgaWYgYE5nWm9uZSNydW4oKWAgbWV0aG9kIGludm9jYXRpb25zIHNob3VsZCBiZSBjb2FsZXNjZWRcbiAgICogaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqIGBgYFxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogVGhpcyBjYXNlIHRyaWdnZXJzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIG11bHRpcGxlIHRpbWVzLlxuICAgKiBXaXRoIG5nWm9uZVJ1bkNvYWxlc2Npbmcgb3B0aW9ucywgYWxsIGNoYW5nZSBkZXRlY3Rpb25zIGluIGFuIGV2ZW50IGxvb3AgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgcnVuQ29hbGVzY2luZz86IGJvb2xlYW47XG59XG5cbi8vIFRyYW5zZm9ybXMgYSBzZXQgb2YgYEJvb3RzdHJhcE9wdGlvbnNgIChzdXBwb3J0ZWQgYnkgdGhlIE5nTW9kdWxlLWJhc2VkIGJvb3RzdHJhcCBBUElzKSAtPlxuLy8gYE5nWm9uZU9wdGlvbnNgIHRoYXQgYXJlIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZSBjb25zdHJ1Y3Rvci4gUGFzc2luZyBubyBvcHRpb25zIHdpbGwgcmVzdWx0IGluXG4vLyBhIHNldCBvZiBkZWZhdWx0IG9wdGlvbnMgcmV0dXJuZWQuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zPzogTmdab25lT3B0aW9ucyk6IEludGVybmFsTmdab25lT3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiAhIW5nRGV2TW9kZSxcbiAgICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBvcHRpb25zPy5ldmVudENvYWxlc2NpbmcgPz8gZmFsc2UsXG4gICAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IG9wdGlvbnM/LnJ1bkNvYWxlc2NpbmcgPz8gZmFsc2UsXG4gIH07XG59XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIFpvbmVTdGFibGVQZW5kaW5nVGFzayB7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3Vic2NyaXB0aW9uID0gbmV3IFN1YnNjcmlwdGlvbigpO1xuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IHBlbmRpbmdUYXNrcyA9IGluamVjdChQZW5kaW5nVGFza3MpO1xuXG4gIGluaXRpYWxpemUoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG5cbiAgICBsZXQgdGFzazogbnVtYmVyfG51bGwgPSBudWxsO1xuICAgIGlmICghdGhpcy56b25lLmlzU3RhYmxlICYmICF0aGlzLnpvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgdGFzayA9IHRoaXMucGVuZGluZ1Rhc2tzLmFkZCgpO1xuICAgIH1cblxuICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbi5hZGQodGhpcy56b25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIE5nWm9uZS5hc3NlcnROb3RJbkFuZ3VsYXJab25lKCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGVyZSBhcmUgbm8gcGVuZGluZyBtYWNyby9taWNybyB0YXNrcyBpbiB0aGUgbmV4dCB0aWNrXG4gICAgICAgIC8vIHRvIGFsbG93IGZvciBOZ1pvbmUgdG8gdXBkYXRlIHRoZSBzdGF0ZS5cbiAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgIGlmICh0YXNrICE9PSBudWxsICYmICF0aGlzLnpvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgJiYgIXRoaXMuem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgICAgICAgdGhpcy5wZW5kaW5nVGFza3MucmVtb3ZlKHRhc2spO1xuICAgICAgICAgICAgdGFzayA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZCh0aGlzLnpvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgIHRhc2sgPz89IHRoaXMucGVuZGluZ1Rhc2tzLmFkZCgpO1xuICAgIH0pKTtcbiAgfVxuXG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuIl19