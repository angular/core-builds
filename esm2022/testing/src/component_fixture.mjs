/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, getDebugNode, inject, NgZone, RendererFactory2, ɵdetectChangesInViewIfRequired, ɵEffectScheduler as EffectScheduler, ɵgetDeferBlocks as getDeferBlocks, ɵisG3 as isG3, ɵNoopNgZone as NoopNgZone, ɵPendingTasks as PendingTasks, } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { DeferBlockFixture } from './defer';
import { AllowDetectChangesAndAcknowledgeItCanHideApplicationBugs, ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, } from './test_bed_common';
/**
 * Fixture for debugging and testing a component.
 *
 * @publicApi
 */
export class ComponentFixture {
    /** @nodoc */
    constructor(componentRef) {
        this.componentRef = componentRef;
        this._isDestroyed = false;
        /** @internal */
        this._noZoneOptionIsSet = inject(ComponentFixtureNoNgZone, { optional: true });
        /** @internal */
        this._ngZone = this._noZoneOptionIsSet ? new NoopNgZone() : inject(NgZone);
        /** @internal */
        this._effectRunner = inject(EffectScheduler);
        // Inject ApplicationRef to ensure NgZone stableness causes after render hooks to run
        // This will likely happen as a result of fixture.detectChanges because it calls ngZone.run
        // This is a crazy way of doing things but hey, it's the world we live in.
        // The zoneless scheduler should instead do this more imperatively by attaching
        // the `ComponentRef` to `ApplicationRef` and calling `appRef.tick` as the `detectChanges`
        // behavior.
        /** @internal */
        this._appRef = inject(ApplicationRef);
        /** @internal */
        this._testAppRef = this._appRef;
        // TODO(atscott): Remove this from public API
        this.ngZone = this._noZoneOptionIsSet ? null : this._ngZone;
        this.changeDetectorRef = componentRef.changeDetectorRef;
        this.elementRef = componentRef.location;
        this.debugElement = getDebugNode(this.elementRef.nativeElement);
        this.componentInstance = componentRef.instance;
        this.nativeElement = this.elementRef.nativeElement;
        this.componentRef = componentRef;
    }
    /**
     * Do a change detection run to make sure there were no changes.
     */
    checkNoChanges() {
        this.changeDetectorRef.checkNoChanges();
    }
    /**
     * Retrieves all defer block fixtures in the component fixture.
     *
     * @developerPreview
     */
    getDeferBlocks() {
        const deferBlocks = [];
        const lView = this.componentRef.hostView['_lView'];
        getDeferBlocks(lView, deferBlocks);
        const deferBlockFixtures = [];
        for (const block of deferBlocks) {
            deferBlockFixtures.push(new DeferBlockFixture(block, this));
        }
        return Promise.resolve(deferBlockFixtures);
    }
    _getRenderer() {
        if (this._renderer === undefined) {
            this._renderer = this.componentRef.injector.get(RendererFactory2, null);
        }
        return this._renderer;
    }
    /**
     * Get a promise that resolves when the ui state is stable following animations.
     */
    whenRenderingDone() {
        const renderer = this._getRenderer();
        if (renderer && renderer.whenRenderingDone) {
            return renderer.whenRenderingDone();
        }
        return this.whenStable();
    }
    /**
     * Trigger component destruction.
     */
    destroy() {
        if (!this._isDestroyed) {
            this.componentRef.destroy();
            this._isDestroyed = true;
        }
    }
}
/**
 * ComponentFixture behavior that actually attaches the component to the application to ensure
 * behaviors between fixture and application do not diverge. `detectChanges` is disabled by default
 * (instead, tests should wait for the scheduler to detect changes), `whenStable` is directly the
 * `ApplicationRef.isStable`, and `autoDetectChanges` cannot be disabled.
 */
export class ScheduledComponentFixture extends ComponentFixture {
    constructor() {
        super(...arguments);
        this.disableDetectChangesError = inject(AllowDetectChangesAndAcknowledgeItCanHideApplicationBugs, { optional: true }) ?? false;
        this.pendingTasks = inject(PendingTasks);
    }
    initialize() {
        this._appRef.attachView(this.componentRef.hostView);
    }
    detectChanges(checkNoChanges = true) {
        if (!this.disableDetectChangesError) {
            throw new Error('Do not use `detectChanges` directly when using zoneless change detection.' +
                ' Instead, wait for the next render or `fixture.whenStable`.');
        }
        else if (!checkNoChanges) {
            throw new Error('Cannot disable `checkNoChanges` in this configuration. ' +
                'Use `fixture.componentRef.hostView.changeDetectorRef.detectChanges()` instead.');
        }
        this._effectRunner.flush();
        this._appRef.tick();
        this._effectRunner.flush();
    }
    isStable() {
        return !this.pendingTasks.hasPendingTasks.value;
    }
    whenStable() {
        if (this.isStable()) {
            return Promise.resolve(false);
        }
        return this._appRef.isStable.pipe(first((stable) => stable)).toPromise().then(() => true);
    }
    autoDetectChanges(autoDetect) {
        throw new Error('Cannot call autoDetectChanges when using change detection scheduling.');
    }
}
/**
 * ComponentFixture behavior that attempts to act as a "mini application".
 */
export class PseudoApplicationComponentFixture extends ComponentFixture {
    constructor() {
        super(...arguments);
        this._subscriptions = new Subscription();
        this._autoDetect = inject(ComponentFixtureAutoDetect, { optional: true }) ?? false;
        this._isStable = true;
        this._promise = null;
        this._resolve = null;
        this.afterTickSubscription = undefined;
        this.beforeRenderSubscription = undefined;
    }
    initialize() {
        if (this._autoDetect) {
            this.subscribeToAppRefEvents();
        }
        this.componentRef.hostView.onDestroy(() => {
            this.unsubscribeFromAppRefEvents();
        });
        // Create subscriptions outside the NgZone so that the callbacks run outside
        // of NgZone.
        this._ngZone.runOutsideAngular(() => {
            this._subscriptions.add(this._ngZone.onUnstable.subscribe({
                next: () => {
                    this._isStable = false;
                },
            }));
            // TODO(atscott): Remove and make this a breaking change externally in v18
            if (!isG3) {
                this._subscriptions.add(this._ngZone.onMicrotaskEmpty.subscribe({
                    next: () => {
                        if (this._autoDetect) {
                            // Do a change detection run with checkNoChanges set to true to check
                            // there are no changes on the second run.
                            this.detectChanges(true);
                        }
                    },
                }));
            }
            this._subscriptions.add(this._ngZone.onStable.subscribe({
                next: () => {
                    this._isStable = true;
                    // Check whether there is a pending whenStable() completer to resolve.
                    if (this._promise !== null) {
                        // If so check whether there are no pending macrotasks before resolving.
                        // Do this check in the next tick so that ngZone gets a chance to update the state
                        // of pending macrotasks.
                        queueMicrotask(() => {
                            if (!this._ngZone.hasPendingMacrotasks) {
                                if (this._promise !== null) {
                                    this._resolve(true);
                                    this._resolve = null;
                                    this._promise = null;
                                }
                            }
                        });
                    }
                },
            }));
            this._subscriptions.add(this._ngZone.onError.subscribe({
                next: (error) => {
                    throw error;
                },
            }));
        });
    }
    detectChanges(checkNoChanges = true) {
        this._effectRunner.flush();
        // Run the change detection inside the NgZone so that any async tasks as part of the change
        // detection are captured by the zone and can be waited for in isStable.
        this._ngZone.run(() => {
            this.changeDetectorRef.detectChanges();
            if (checkNoChanges) {
                this.checkNoChanges();
            }
        });
        // Run any effects that were created/dirtied during change detection. Such effects might become
        // dirty in response to input signals changing.
        this._effectRunner.flush();
    }
    isStable() {
        return this._isStable && !this._ngZone.hasPendingMacrotasks;
    }
    whenStable() {
        if (this.isStable()) {
            return Promise.resolve(false);
        }
        else if (this._promise !== null) {
            return this._promise;
        }
        else {
            this._promise = new Promise((res) => {
                this._resolve = res;
            });
            return this._promise;
        }
    }
    autoDetectChanges(autoDetect = true) {
        if (this._noZoneOptionIsSet) {
            throw new Error('Cannot call autoDetectChanges when ComponentFixtureNoNgZone is set.');
        }
        if (autoDetect !== this._autoDetect) {
            if (autoDetect) {
                this.subscribeToAppRefEvents();
            }
            else {
                this.unsubscribeFromAppRefEvents();
            }
        }
        this._autoDetect = autoDetect;
        this.detectChanges();
    }
    subscribeToAppRefEvents() {
        // TODO(atscott): Remove and make this a breaking change externally in v18
        if (!isG3) {
            return;
        }
        this._ngZone.runOutsideAngular(() => {
            this.afterTickSubscription = this._testAppRef.afterTick.subscribe(() => {
                this.checkNoChanges();
            });
            this.beforeRenderSubscription = this._testAppRef.beforeRender.subscribe((isFirstPass) => {
                try {
                    ɵdetectChangesInViewIfRequired(this.componentRef.hostView._lView, isFirstPass, this.componentRef.hostView.notifyErrorHandler);
                }
                catch (e) {
                    // If an error ocurred during change detection, remove the test view from the application
                    // ref tracking. Note that this isn't exactly desirable but done this way because of how
                    // things used to work with `autoDetect` and uncaught errors. Ideally we would surface
                    // this error to the error handler instead and continue refreshing the view like
                    // what would happen in the application.
                    this.unsubscribeFromAppRefEvents();
                    throw e;
                }
            });
            this._testAppRef.externalTestViews.add(this.componentRef.hostView);
        });
    }
    unsubscribeFromAppRefEvents() {
        // TODO(atscott): Remove and make this a breaking change externally in v18
        if (!isG3) {
            return;
        }
        this.afterTickSubscription?.unsubscribe();
        this.beforeRenderSubscription?.unsubscribe();
        this.afterTickSubscription = undefined;
        this.beforeRenderSubscription = undefined;
        this._testAppRef.externalTestViews.delete(this.componentRef.hostView);
    }
    destroy() {
        this.unsubscribeFromAppRefEvents();
        this._subscriptions.unsubscribe();
        super.destroy();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQTZELFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFvRCw4QkFBOEIsRUFBRSxnQkFBZ0IsSUFBSSxlQUFlLEVBQUUsZUFBZSxJQUFJLGNBQWMsRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsYUFBYSxJQUFJLFlBQVksR0FBRSxNQUFNLGVBQWUsQ0FBQztBQUM1WCxPQUFPLEVBQVUsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVyQyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxFQUFDLHdEQUF3RCxFQUFFLDBCQUEwQixFQUFFLHdCQUF3QixHQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFbEo7Ozs7R0FJRztBQUNILE1BQU0sT0FBZ0IsZ0JBQWdCO0lBZ0RwQyxhQUFhO0lBQ2IsWUFBbUIsWUFBNkI7UUFBN0IsaUJBQVksR0FBWixZQUFZLENBQWlCO1FBdEJ4QyxpQkFBWSxHQUFZLEtBQUssQ0FBQztRQUN0QyxnQkFBZ0I7UUFDRyx1QkFBa0IsR0FBRyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUMzRixnQkFBZ0I7UUFDTixZQUFPLEdBQVcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFD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QUFDLE9BQU8sQ0FBVSxFQUFFLENBQUM7b0JBQ3BCLHlGQUF5RjtvQkFDekYsd0ZBQXdGO29CQUN4RixzRkFBc0Y7b0JBQ3RGLGdGQUFnRjtvQkFDaEYsd0NBQXdDO29CQUN4QyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztvQkFFbkMsTUFBTSxDQUFDLENBQUM7Z0JBQ1YsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTywyQkFBMkI7UUFDakMsMEVBQTBFO1FBQzFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxDQUFDLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxTQUFTLENBQUM7UUFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRVEsT0FBTztRQUNkLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbEMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2xCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmLCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50UmVmLCBEZWJ1Z0VsZW1lbnQsIEVsZW1lbnRSZWYsIGdldERlYnVnTm9kZSwgaW5qZWN0LCBOZ1pvbmUsIFJlbmRlcmVyRmFjdG9yeTIsIFZpZXdSZWYsIMm1RGVmZXJCbG9ja0RldGFpbHMgYXMgRGVmZXJCbG9ja0RldGFpbHMsIMm1ZGV0ZWN0Q2hhbmdlc0luVmlld0lmUmVxdWlyZWQsIMm1RWZmZWN0U2NoZWR1bGVyIGFzIEVmZmVjdFNjaGVkdWxlciwgybVnZXREZWZlckJsb2NrcyBhcyBnZXREZWZlckJsb2NrcywgybVpc0czIGFzIGlzRzMsIMm1Tm9vcE5nWm9uZSBhcyBOb29wTmdab25lLCDJtVBlbmRpbmdUYXNrcyBhcyBQZW5kaW5nVGFza3MsfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7Zmlyc3R9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtEZWZlckJsb2NrRml4dHVyZX0gZnJvbSAnLi9kZWZlcic7XG5pbXBvcnQge0FsbG93RGV0ZWN0Q2hhbmdlc0FuZEFja25vd2xlZGdlSXRDYW5IaWRlQXBwbGljYXRpb25CdWdzLCBDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLH0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuXG4vKipcbiAqIEZpeHR1cmUgZm9yIGRlYnVnZ2luZyBhbmQgdGVzdGluZyBhIGNvbXBvbmVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgLyoqXG4gICAqIFRoZSBEZWJ1Z0VsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSByb290IGVsZW1lbnQgb2YgdGhpcyBjb21wb25lbnQuXG4gICAqL1xuICBkZWJ1Z0VsZW1lbnQ6IERlYnVnRWxlbWVudDtcblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIG9mIHRoZSByb290IGNvbXBvbmVudCBjbGFzcy5cbiAgICovXG4gIGNvbXBvbmVudEluc3RhbmNlOiBUO1xuXG4gIC8qKlxuICAgKiBUaGUgbmF0aXZlIGVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICAvKipcbiAgICogVGhlIEVsZW1lbnRSZWYgZm9yIHRoZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBlbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjb21wb25lbnRcbiAgICovXG4gIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcblxuICBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXJGYWN0b3J5MnxudWxsfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfaXNEZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX25vWm9uZU9wdGlvbklzU2V0ID0gaW5qZWN0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwge29wdGlvbmFsOiB0cnVlfSk7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIF9uZ1pvbmU6IE5nWm9uZSA9IHRoaXMuX25vWm9uZU9wdGlvbklzU2V0ID8gbmV3IE5vb3BOZ1pvbmUoKSA6IGluamVjdChOZ1pvbmUpO1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCBfZWZmZWN0UnVubmVyID0gaW5qZWN0KEVmZmVjdFNjaGVkdWxlcik7XG4gIC8vIEluamVjdCBBcHBsaWNhdGlvblJlZiB0byBlbnN1cmUgTmdab25lIHN0YWJsZW5lc3MgY2F1c2VzIGFmdGVyIHJlbmRlciBob29rcyB0byBydW5cbiAgLy8gVGhpcyB3aWxsIGxpa2VseSBoYXBwZW4gYXMgYSByZXN1bHQgb2YgZml4dHVyZS5kZXRlY3RDaGFuZ2VzIGJlY2F1c2UgaXQgY2FsbHMgbmdab25lLnJ1blxuICAvLyBUaGlzIGlzIGEgY3Jhenkgd2F5IG9mIGRvaW5nIHRoaW5ncyBidXQgaGV5LCBpdCdzIHRoZSB3b3JsZCB3ZSBsaXZlIGluLlxuICAvLyBUaGUgem9uZWxlc3Mgc2NoZWR1bGVyIHNob3VsZCBpbnN0ZWFkIGRvIHRoaXMgbW9yZSBpbXBlcmF0aXZlbHkgYnkgYXR0YWNoaW5nXG4gIC8vIHRoZSBgQ29tcG9uZW50UmVmYCB0byBgQXBwbGljYXRpb25SZWZgIGFuZCBjYWxsaW5nIGBhcHBSZWYudGlja2AgYXMgdGhlIGBkZXRlY3RDaGFuZ2VzYFxuICAvLyBiZWhhdmlvci5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2FwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF90ZXN0QXBwUmVmID0gdGhpcy5fYXBwUmVmIGFzIHVua25vd24gYXMgVGVzdEFwcFJlZjtcblxuICAvLyBUT0RPKGF0c2NvdHQpOiBSZW1vdmUgdGhpcyBmcm9tIHB1YmxpYyBBUElcbiAgbmdab25lID0gdGhpcy5fbm9ab25lT3B0aW9uSXNTZXQgPyBudWxsIDogdGhpcy5fbmdab25lO1xuXG4gIC8qKiBAbm9kb2MgKi9cbiAgY29uc3RydWN0b3IocHVibGljIGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPFQ+KSB7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IGNvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZjtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBjb21wb25lbnRSZWYubG9jYXRpb247XG4gICAgdGhpcy5kZWJ1Z0VsZW1lbnQgPSA8RGVidWdFbGVtZW50PmdldERlYnVnTm9kZSh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgdGhpcy5jb21wb25lbnRJbnN0YW5jZSA9IGNvbXBvbmVudFJlZi5pbnN0YW5jZTtcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGEgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSBmb3IgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGFic3RyYWN0IGRldGVjdENoYW5nZXMoY2hlY2tOb0NoYW5nZXM/OiBib29sZWFuKTogdm9pZDtcblxuICAvKipcbiAgICogRG8gYSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1biB0byBtYWtlIHN1cmUgdGhlcmUgd2VyZSBubyBjaGFuZ2VzLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXMoKTogdm9pZCB7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB3aGV0aGVyIHRoZSBmaXh0dXJlIHNob3VsZCBhdXRvZGV0ZWN0IGNoYW5nZXMuXG4gICAqXG4gICAqIEFsc28gcnVucyBkZXRlY3RDaGFuZ2VzIG9uY2Ugc28gdGhhdCBhbnkgZXhpc3RpbmcgY2hhbmdlIGlzIGRldGVjdGVkLlxuICAgKi9cbiAgYWJzdHJhY3QgYXV0b0RldGVjdENoYW5nZXMoYXV0b0RldGVjdD86IGJvb2xlYW4pOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGUgZml4dHVyZSBpcyBjdXJyZW50bHkgc3RhYmxlIG9yIGhhcyBhc3luYyB0YXNrcyB0aGF0IGhhdmUgbm90IGJlZW4gY29tcGxldGVkXG4gICAqIHlldC5cbiAgICovXG4gIGFic3RyYWN0IGlzU3RhYmxlKCk6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBmaXh0dXJlIGlzIHN0YWJsZS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byByZXN1bWUgdGVzdGluZyBhZnRlciBldmVudHMgaGF2ZSB0cmlnZ2VyZWQgYXN5bmNocm9ub3VzIGFjdGl2aXR5IG9yXG4gICAqIGFzeW5jaHJvbm91cyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgYWJzdHJhY3Qgd2hlblN0YWJsZSgpOiBQcm9taXNlPGFueT47XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbGwgZGVmZXIgYmxvY2sgZml4dHVyZXMgaW4gdGhlIGNvbXBvbmVudCBmaXh0dXJlLlxuICAgKlxuICAgKiBAZGV2ZWxvcGVyUHJldmlld1xuICAgKi9cbiAgZ2V0RGVmZXJCbG9ja3MoKTogUHJvbWlzZTxEZWZlckJsb2NrRml4dHVyZVtdPiB7XG4gICAgY29uc3QgZGVmZXJCbG9ja3M6IERlZmVyQmxvY2tEZXRhaWxzW10gPSBbXTtcbiAgICBjb25zdCBsVmlldyA9ICh0aGlzLmNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBhbnkpWydfbFZpZXcnXTtcbiAgICBnZXREZWZlckJsb2NrcyhsVmlldywgZGVmZXJCbG9ja3MpO1xuXG4gICAgY29uc3QgZGVmZXJCbG9ja0ZpeHR1cmVzID0gW107XG4gICAgZm9yIChjb25zdCBibG9jayBvZiBkZWZlckJsb2Nrcykge1xuICAgICAgZGVmZXJCbG9ja0ZpeHR1cmVzLnB1c2gobmV3IERlZmVyQmxvY2tGaXh0dXJlKGJsb2NrLCB0aGlzKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShkZWZlckJsb2NrRml4dHVyZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0UmVuZGVyZXIoKSB7XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyID0gdGhpcy5jb21wb25lbnRSZWYuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZXIgYXMgUmVuZGVyZXJGYWN0b3J5MiB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHVpIHN0YXRlIGlzIHN0YWJsZSBmb2xsb3dpbmcgYW5pbWF0aW9ucy5cbiAgICovXG4gIHdoZW5SZW5kZXJpbmdEb25lKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSB0aGlzLl9nZXRSZW5kZXJlcigpO1xuICAgIGlmIChyZW5kZXJlciAmJiByZW5kZXJlci53aGVuUmVuZGVyaW5nRG9uZSkge1xuICAgICAgcmV0dXJuIHJlbmRlcmVyLndoZW5SZW5kZXJpbmdEb25lKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLndoZW5TdGFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGNvbXBvbmVudCBkZXN0cnVjdGlvbi5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc0Rlc3Ryb3llZCkge1xuICAgICAgdGhpcy5jb21wb25lbnRSZWYuZGVzdHJveSgpO1xuICAgICAgdGhpcy5faXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbXBvbmVudEZpeHR1cmUgYmVoYXZpb3IgdGhhdCBhY3R1YWxseSBhdHRhY2hlcyB0aGUgY29tcG9uZW50IHRvIHRoZSBhcHBsaWNhdGlvbiB0byBlbnN1cmVcbiAqIGJlaGF2aW9ycyBiZXR3ZWVuIGZpeHR1cmUgYW5kIGFwcGxpY2F0aW9uIGRvIG5vdCBkaXZlcmdlLiBgZGV0ZWN0Q2hhbmdlc2AgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdFxuICogKGluc3RlYWQsIHRlc3RzIHNob3VsZCB3YWl0IGZvciB0aGUgc2NoZWR1bGVyIHRvIGRldGVjdCBjaGFuZ2VzKSwgYHdoZW5TdGFibGVgIGlzIGRpcmVjdGx5IHRoZVxuICogYEFwcGxpY2F0aW9uUmVmLmlzU3RhYmxlYCwgYW5kIGBhdXRvRGV0ZWN0Q2hhbmdlc2AgY2Fubm90IGJlIGRpc2FibGVkLlxuICovXG5leHBvcnQgY2xhc3MgU2NoZWR1bGVkQ29tcG9uZW50Rml4dHVyZTxUPiBleHRlbmRzIENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICBwcml2YXRlIHJlYWRvbmx5IGRpc2FibGVEZXRlY3RDaGFuZ2VzRXJyb3IgPVxuICAgICAgaW5qZWN0KEFsbG93RGV0ZWN0Q2hhbmdlc0FuZEFja25vd2xlZGdlSXRDYW5IaWRlQXBwbGljYXRpb25CdWdzLCB7b3B0aW9uYWw6IHRydWV9KSA/PyBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBwZW5kaW5nVGFza3MgPSBpbmplY3QoUGVuZGluZ1Rhc2tzKTtcblxuICBpbml0aWFsaXplKCk6IHZvaWQge1xuICAgIHRoaXMuX2FwcFJlZi5hdHRhY2hWaWV3KHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGRldGVjdENoYW5nZXMoY2hlY2tOb0NoYW5nZXM6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVEZXRlY3RDaGFuZ2VzRXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnRG8gbm90IHVzZSBgZGV0ZWN0Q2hhbmdlc2AgZGlyZWN0bHkgd2hlbiB1c2luZyB6b25lbGVzcyBjaGFuZ2UgZGV0ZWN0aW9uLicgK1xuICAgICAgICAgICAgICAnIEluc3RlYWQsIHdhaXQgZm9yIHRoZSBuZXh0IHJlbmRlciBvciBgZml4dHVyZS53aGVuU3RhYmxlYC4nLFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKCFjaGVja05vQ2hhbmdlcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdDYW5ub3QgZGlzYWJsZSBgY2hlY2tOb0NoYW5nZXNgIGluIHRoaXMgY29uZmlndXJhdGlvbi4gJyArXG4gICAgICAgICAgICAgICdVc2UgYGZpeHR1cmUuY29tcG9uZW50UmVmLmhvc3RWaWV3LmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKWAgaW5zdGVhZC4nLFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5fZWZmZWN0UnVubmVyLmZsdXNoKCk7XG4gICAgdGhpcy5fYXBwUmVmLnRpY2soKTtcbiAgICB0aGlzLl9lZmZlY3RSdW5uZXIuZmx1c2goKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGlzU3RhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5wZW5kaW5nVGFza3MuaGFzUGVuZGluZ1Rhc2tzLnZhbHVlO1xuICB9XG5cbiAgb3ZlcnJpZGUgd2hlblN0YWJsZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5pc1N0YWJsZSgpKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2FwcFJlZi5pc1N0YWJsZS5waXBlKGZpcnN0KChzdGFibGUpID0+IHN0YWJsZSkpLnRvUHJvbWlzZSgpLnRoZW4oKCkgPT4gdHJ1ZSk7XG4gIH1cblxuICBvdmVycmlkZSBhdXRvRGV0ZWN0Q2hhbmdlcyhhdXRvRGV0ZWN0PzogYm9vbGVhbnx1bmRlZmluZWQpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGF1dG9EZXRlY3RDaGFuZ2VzIHdoZW4gdXNpbmcgY2hhbmdlIGRldGVjdGlvbiBzY2hlZHVsaW5nLicpO1xuICB9XG59XG5cbmludGVyZmFjZSBUZXN0QXBwUmVmIHtcbiAgZXh0ZXJuYWxUZXN0Vmlld3M6IFNldDxWaWV3UmVmPjtcbiAgYmVmb3JlUmVuZGVyOiBTdWJqZWN0PGJvb2xlYW4+O1xuICBhZnRlclRpY2s6IFN1YmplY3Q8dm9pZD47XG59XG5cbi8qKlxuICogQ29tcG9uZW50Rml4dHVyZSBiZWhhdmlvciB0aGF0IGF0dGVtcHRzIHRvIGFjdCBhcyBhIFwibWluaSBhcHBsaWNhdGlvblwiLlxuICovXG5leHBvcnQgY2xhc3MgUHNldWRvQXBwbGljYXRpb25Db21wb25lbnRGaXh0dXJlPFQ+IGV4dGVuZHMgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIHByaXZhdGUgX3N1YnNjcmlwdGlvbnMgPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgX2F1dG9EZXRlY3QgPSBpbmplY3QoQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIHtvcHRpb25hbDogdHJ1ZX0pID8/IGZhbHNlO1xuICBwcml2YXRlIF9pc1N0YWJsZTogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgX3Byb21pc2U6IFByb21pc2U8Ym9vbGVhbj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3Jlc29sdmU6ICgocmVzdWx0OiBib29sZWFuKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhZnRlclRpY2tTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIHByaXZhdGUgYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2F1dG9EZXRlY3QpIHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlVG9BcHBSZWZFdmVudHMoKTtcbiAgICB9XG4gICAgdGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcub25EZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCk7XG4gICAgfSk7XG4gICAgLy8gQ3JlYXRlIHN1YnNjcmlwdGlvbnMgb3V0c2lkZSB0aGUgTmdab25lIHNvIHRoYXQgdGhlIGNhbGxiYWNrcyBydW4gb3V0c2lkZVxuICAgIC8vIG9mIE5nWm9uZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgICAgdGhpcy5fbmdab25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5faXNTdGFibGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICApO1xuICAgICAgLy8gVE9ETyhhdHNjb3R0KTogUmVtb3ZlIGFuZCBtYWtlIHRoaXMgYSBicmVha2luZyBjaGFuZ2UgZXh0ZXJuYWxseSBpbiB2MThcbiAgICAgIGlmICghaXNHMykge1xuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgICAgICAgIHRoaXMuX25nWm9uZS5vbk1pY3JvdGFza0VtcHR5LnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgICAgICAgICAgICAgLy8gRG8gYSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1biB3aXRoIGNoZWNrTm9DaGFuZ2VzIHNldCB0byB0cnVlIHRvIGNoZWNrXG4gICAgICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgbm8gY2hhbmdlcyBvbiB0aGUgc2Vjb25kIHJ1bi5cbiAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcyh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICAgIHRoaXMuX25nWm9uZS5vblN0YWJsZS5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLl9pc1N0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlcmUgaXMgYSBwZW5kaW5nIHdoZW5TdGFibGUoKSBjb21wbGV0ZXIgdG8gcmVzb2x2ZS5cbiAgICAgICAgICAgICAgaWYgKHRoaXMuX3Byb21pc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBzbyBjaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvdGFza3MgYmVmb3JlIHJlc29sdmluZy5cbiAgICAgICAgICAgICAgICAvLyBEbyB0aGlzIGNoZWNrIGluIHRoZSBuZXh0IHRpY2sgc28gdGhhdCBuZ1pvbmUgZ2V0cyBhIGNoYW5jZSB0byB1cGRhdGUgdGhlIHN0YXRlXG4gICAgICAgICAgICAgICAgLy8gb2YgcGVuZGluZyBtYWNyb3Rhc2tzLlxuICAgICAgICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbmdab25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wcm9taXNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSEodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICAgIHRoaXMuX25nWm9uZS5vbkVycm9yLnN1YnNjcmliZSh7XG4gICAgICAgICAgICBuZXh0OiAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGV0ZWN0Q2hhbmdlcyhjaGVja05vQ2hhbmdlcyA9IHRydWUpOiB2b2lkIHtcbiAgICB0aGlzLl9lZmZlY3RSdW5uZXIuZmx1c2goKTtcbiAgICAvLyBSdW4gdGhlIGNoYW5nZSBkZXRlY3Rpb24gaW5zaWRlIHRoZSBOZ1pvbmUgc28gdGhhdCBhbnkgYXN5bmMgdGFza3MgYXMgcGFydCBvZiB0aGUgY2hhbmdlXG4gICAgLy8gZGV0ZWN0aW9uIGFyZSBjYXB0dXJlZCBieSB0aGUgem9uZSBhbmQgY2FuIGJlIHdhaXRlZCBmb3IgaW4gaXNTdGFibGUuXG4gICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIGlmIChjaGVja05vQ2hhbmdlcykge1xuICAgICAgICB0aGlzLmNoZWNrTm9DaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gUnVuIGFueSBlZmZlY3RzIHRoYXQgd2VyZSBjcmVhdGVkL2RpcnRpZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24uIFN1Y2ggZWZmZWN0cyBtaWdodCBiZWNvbWVcbiAgICAvLyBkaXJ0eSBpbiByZXNwb25zZSB0byBpbnB1dCBzaWduYWxzIGNoYW5naW5nLlxuICAgIHRoaXMuX2VmZmVjdFJ1bm5lci5mbHVzaCgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgaXNTdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzU3RhYmxlICYmICF0aGlzLl9uZ1pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3M7XG4gIH1cblxuICBvdmVycmlkZSB3aGVuU3RhYmxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmlzU3RhYmxlKCkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzKSA9PiB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmUgPSByZXM7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGF1dG9EZXRlY3RDaGFuZ2VzKGF1dG9EZXRlY3QgPSB0cnVlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX25vWm9uZU9wdGlvbklzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGF1dG9EZXRlY3RDaGFuZ2VzIHdoZW4gQ29tcG9uZW50Rml4dHVyZU5vTmdab25lIGlzIHNldC4nKTtcbiAgICB9XG5cbiAgICBpZiAoYXV0b0RldGVjdCAhPT0gdGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgaWYgKGF1dG9EZXRlY3QpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmVUb0FwcFJlZkV2ZW50cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9hdXRvRGV0ZWN0ID0gYXV0b0RldGVjdDtcbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgc3Vic2NyaWJlVG9BcHBSZWZFdmVudHMoKSB7XG4gICAgLy8gVE9ETyhhdHNjb3R0KTogUmVtb3ZlIGFuZCBtYWtlIHRoaXMgYSBicmVha2luZyBjaGFuZ2UgZXh0ZXJuYWxseSBpbiB2MThcbiAgICBpZiAoIWlzRzMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5hZnRlclRpY2tTdWJzY3JpcHRpb24gPSB0aGlzLl90ZXN0QXBwUmVmLmFmdGVyVGljay5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICB0aGlzLmNoZWNrTm9DaGFuZ2VzKCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uID0gdGhpcy5fdGVzdEFwcFJlZi5iZWZvcmVSZW5kZXIuc3Vic2NyaWJlKChpc0ZpcnN0UGFzcykgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIMm1ZGV0ZWN0Q2hhbmdlc0luVmlld0lmUmVxdWlyZWQoXG4gICAgICAgICAgICAgICh0aGlzLmNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBhbnkpLl9sVmlldyxcbiAgICAgICAgICAgICAgaXNGaXJzdFBhc3MsXG4gICAgICAgICAgICAgICh0aGlzLmNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBhbnkpLm5vdGlmeUVycm9ySGFuZGxlcixcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgICAgICAgLy8gSWYgYW4gZXJyb3Igb2N1cnJlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgcmVtb3ZlIHRoZSB0ZXN0IHZpZXcgZnJvbSB0aGUgYXBwbGljYXRpb25cbiAgICAgICAgICAvLyByZWYgdHJhY2tpbmcuIE5vdGUgdGhhdCB0aGlzIGlzbid0IGV4YWN0bHkgZGVzaXJhYmxlIGJ1dCBkb25lIHRoaXMgd2F5IGJlY2F1c2Ugb2YgaG93XG4gICAgICAgICAgLy8gdGhpbmdzIHVzZWQgdG8gd29yayB3aXRoIGBhdXRvRGV0ZWN0YCBhbmQgdW5jYXVnaHQgZXJyb3JzLiBJZGVhbGx5IHdlIHdvdWxkIHN1cmZhY2VcbiAgICAgICAgICAvLyB0aGlzIGVycm9yIHRvIHRoZSBlcnJvciBoYW5kbGVyIGluc3RlYWQgYW5kIGNvbnRpbnVlIHJlZnJlc2hpbmcgdGhlIHZpZXcgbGlrZVxuICAgICAgICAgIC8vIHdoYXQgd291bGQgaGFwcGVuIGluIHRoZSBhcHBsaWNhdGlvbi5cbiAgICAgICAgICB0aGlzLnVuc3Vic2NyaWJlRnJvbUFwcFJlZkV2ZW50cygpO1xuXG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLl90ZXN0QXBwUmVmLmV4dGVybmFsVGVzdFZpZXdzLmFkZCh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHVuc3Vic2NyaWJlRnJvbUFwcFJlZkV2ZW50cygpIHtcbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBSZW1vdmUgYW5kIG1ha2UgdGhpcyBhIGJyZWFraW5nIGNoYW5nZSBleHRlcm5hbGx5IGluIHYxOFxuICAgIGlmICghaXNHMykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Rlc3RBcHBSZWYuZXh0ZXJuYWxUZXN0Vmlld3MuZGVsZXRlKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnVuc3Vic2NyaWJlKCk7XG4gICAgc3VwZXIuZGVzdHJveSgpO1xuICB9XG59XG4iXX0=