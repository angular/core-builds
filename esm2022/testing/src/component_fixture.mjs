/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, getDebugNode, inject, NgZone, RendererFactory2, ɵdetectChangesInViewIfRequired, ɵEffectScheduler as EffectScheduler, ɵgetDeferBlocks as getDeferBlocks, ɵNoopNgZone as NoopNgZone, ɵPendingTasks as PendingTasks, } from '@angular/core';
import { Subscription } from 'rxjs';
import { DeferBlockFixture } from './defer';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone } from './test_bed_common';
import { TestBedApplicationErrorHandler } from './application_error_handler';
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
        this.pendingTasks = inject(PendingTasks);
        this.appErrorHandler = inject(TestBedApplicationErrorHandler);
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
     * Return whether the fixture is currently stable or has async tasks that have not been completed
     * yet.
     */
    isStable() {
        return !this.pendingTasks.hasPendingTasks.value;
    }
    /**
     * Get a promise that resolves when the fixture is stable.
     *
     * This can be used to resume testing after events have triggered asynchronous activity or
     * asynchronous change detection.
     */
    whenStable() {
        if (this.isStable()) {
            return Promise.resolve(false);
        }
        return new Promise((resolve, reject) => {
            this.appErrorHandler.whenStableRejectFunctions.add(reject);
            this._appRef.whenStable().then(() => {
                this.appErrorHandler.whenStableRejectFunctions.delete(reject);
                resolve(true);
            });
        });
    }
    /**
     * Retrieves all defer block fixtures in the component fixture.
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
        this._autoDetect = inject(ComponentFixtureAutoDetect, { optional: true }) ?? true;
    }
    initialize() {
        if (this._autoDetect) {
            this._appRef.attachView(this.componentRef.hostView);
        }
    }
    detectChanges(checkNoChanges = true) {
        if (!checkNoChanges) {
            throw new Error('Cannot disable `checkNoChanges` in this configuration. ' +
                'Use `fixture.componentRef.hostView.changeDetectorRef.detectChanges()` instead.');
        }
        this._effectRunner.flush();
        this._appRef.tick();
        this._effectRunner.flush();
    }
    autoDetectChanges(autoDetect = true) {
        if (!autoDetect) {
            throw new Error('Cannot disable autoDetect after it has been enabled when using the zoneless scheduler. ' +
                'To disable autoDetect, add `{provide: ComponentFixtureAutoDetect, useValue: false}` to the TestBed providers.');
        }
        else if (!this._autoDetect) {
            this._autoDetect = autoDetect;
            this._appRef.attachView(this.componentRef.hostView);
        }
        this.detectChanges();
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
        this._ngZone.runOutsideAngular(() => {
            this.afterTickSubscription = this._testAppRef.afterTick.subscribe(() => {
                this.checkNoChanges();
            });
            this.beforeRenderSubscription = this._testAppRef.beforeRender.subscribe((isFirstPass) => {
                try {
                    ɵdetectChangesInViewIfRequired(this.componentRef.hostView._lView, this.componentRef.hostView.notifyErrorHandler, isFirstPass, false /** zoneless enabled */);
                }
                catch (e) {
                    // If an error occurred during change detection, remove the test view from the application
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxjQUFjLEVBS2QsWUFBWSxFQUNaLE1BQU0sRUFDTixNQUFNLEVBQ04sZ0JBQWdCLEVBR2hCLDhCQUE4QixFQUM5QixnQkFBZ0IsSUFBSSxlQUFlLEVBQ25DLGVBQWUsSUFBSSxjQUFjLEVBQ2pDLFdBQVcsSUFBSSxVQUFVLEVBQ3pCLGFBQWEsSUFBSSxZQUFZLEdBQzlCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBVSxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFFM0MsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZGLE9BQU8sRUFBQyw4QkFBOEIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBRTNFOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLGdCQUFnQjtJQWtEcEMsYUFBYTtJQUNiLFlBQW1CLFlBQTZCO1FBQTdCLGlCQUFZLEdBQVosWUFBWSxDQUFpQjtRQXhCeEMsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFDdEMsZ0JBQWdCO1FBQ0csdUJBQWtCLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDM0YsZ0JBQWdCO1FBQ04sWUFBTyxHQUFXLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hGLGdCQUFnQjtRQUNOLGtCQUFhLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2xELHFGQUFxRjtRQUNyRiwyRkFBMkY7UUFDM0YsMEVBQTBFO1FBQzFFLCtFQUErRTtRQUMvRSwwRkFBMEY7UUFDMUYsWUFBWTtRQUNaLGdCQUFnQjtRQUNHLFlBQU8sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDcEQsZ0JBQWdCO1FBQ0csZ0JBQVcsR0FBRyxJQUFJLENBQUMsT0FBZ0MsQ0FBQztRQUN0RCxpQkFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwQyxvQkFBZSxHQUFHLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBRTFFLDZDQUE2QztRQUM3QyxXQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFJckQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztRQUN4RCxJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUM7UUFDeEMsSUFBSSxDQUFDLFlBQVksR0FBaUIsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDOUUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUM7UUFDL0MsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztRQUNuRCxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztJQUNuQyxDQUFDO0lBT0Q7O09BRUc7SUFDSCxjQUFjO1FBQ1osSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQzFDLENBQUM7SUFTRDs7O09BR0c7SUFDSCxRQUFRO1FBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztJQUNsRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxVQUFVO1FBQ1IsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztZQUNwQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUVELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsSUFBSSxDQUFDLGVBQWUsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsZUFBZSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxjQUFjO1FBQ1osTUFBTSxXQUFXLEdBQXdCLEVBQUUsQ0FBQztRQUM1QyxNQUFNLEtBQUssR0FBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUQsY0FBYyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVuQyxNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztRQUM5QixLQUFLLE1BQU0sS0FBSyxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2hDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRU8sWUFBWTtRQUNsQixJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDLFNBQW9DLENBQUM7SUFDbkQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsaUJBQWlCO1FBQ2YsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3JDLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzNDLE9BQU8sUUFBUSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRDs7T0FFRztJQUNILE9BQU87UUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDM0IsQ0FBQztJQUNILENBQUM7Q0FDRjtBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxPQUFPLHlCQUE2QixTQUFRLGdCQUFtQjtJQUFyRTs7UUFDVSxnQkFBVyxHQUFHLE1BQU0sQ0FBQywwQkFBMEIsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztJQWdDckYsQ0FBQztJQTlCQyxVQUFVO1FBQ1IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDO0lBQ0gsQ0FBQztJQUVRLGFBQWEsQ0FBQyxjQUFjLEdBQUcsSUFBSTtRQUMxQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FDYix5REFBeUQ7Z0JBQ3ZELGdGQUFnRixDQUNuRixDQUFDO1FBQ0osQ0FBQztRQUNELElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFUSxpQkFBaUIsQ0FBQyxVQUFVLEdBQUcsSUFBSTtRQUMxQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDaEIsTUFBTSxJQUFJLEtBQUssQ0FDYix5RkFBeUY7Z0JBQ3ZGLCtHQUErRyxDQUNsSCxDQUFDO1FBQ0osQ0FBQzthQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBQ0QsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7Q0FDRjtBQVFEOztHQUVHO0FBQ0gsTUFBTSxPQUFPLGlDQUFxQyxTQUFRLGdCQUFtQjtJQUE3RTs7UUFDVSxtQkFBYyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDcEMsZ0JBQVcsR0FBRyxNQUFNLENBQUMsMEJBQTBCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsSUFBSSxLQUFLLENBQUM7UUFDNUUsMEJBQXFCLEdBQTZCLFNBQVMsQ0FBQztRQUM1RCw2QkFBd0IsR0FBNkIsU0FBUyxDQUFDO0lBK0Z6RSxDQUFDO0lBN0ZDLFVBQVU7UUFDUixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUN4QyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUNILDRFQUE0RTtRQUM1RSxhQUFhO1FBQ2IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDbEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztnQkFDN0IsSUFBSSxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUU7b0JBQ25CLE1BQU0sS0FBSyxDQUFDO2dCQUNkLENBQUM7YUFDRixDQUFDLENBQ0gsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVRLGFBQWEsQ0FBQyxjQUFjLEdBQUcsSUFBSTtRQUMxQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLDJGQUEyRjtRQUMzRix3RUFBd0U7UUFDeEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN2QyxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsK0ZBQStGO1FBQy9GLCtDQUErQztRQUMvQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFUSxpQkFBaUIsQ0FBQyxVQUFVLEdBQUcsSUFBSTtRQUMxQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMscUVBQXFFLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRUQsSUFBSSxVQUFVLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3BDLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDakMsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQ3JDLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFTyx1QkFBdUI7UUFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDbEMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDdEYsSUFBSSxDQUFDO29CQUNILDhCQUE4QixDQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQWdCLENBQUMsTUFBTSxFQUN6QyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQWdCLENBQUMsa0JBQWtCLEVBQ3RELFdBQVcsRUFDWCxLQUFLLENBQUMsdUJBQXVCLENBQzlCLENBQUM7Z0JBQ0osQ0FBQztnQkFBQyxPQUFPLENBQVUsRUFBRSxDQUFDO29CQUNwQiwwRkFBMEY7b0JBQzFGLHdGQUF3RjtvQkFDeEYsc0ZBQXNGO29CQUN0RixnRkFBZ0Y7b0JBQ2hGLHdDQUF3QztvQkFDeEMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7b0JBRW5DLE1BQU0sQ0FBQyxDQUFDO2dCQUNWLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sMkJBQTJCO1FBQ2pDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUMxQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDN0MsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFNBQVMsQ0FBQztRQUN2QyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsU0FBUyxDQUFDO1FBQzFDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVRLE9BQU87UUFDZCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnRSZWYsXG4gIERlYnVnRWxlbWVudCxcbiAgRWxlbWVudFJlZixcbiAgZ2V0RGVidWdOb2RlLFxuICBpbmplY3QsXG4gIE5nWm9uZSxcbiAgUmVuZGVyZXJGYWN0b3J5MixcbiAgVmlld1JlZixcbiAgybVEZWZlckJsb2NrRGV0YWlscyBhcyBEZWZlckJsb2NrRGV0YWlscyxcbiAgybVkZXRlY3RDaGFuZ2VzSW5WaWV3SWZSZXF1aXJlZCxcbiAgybVFZmZlY3RTY2hlZHVsZXIgYXMgRWZmZWN0U2NoZWR1bGVyLFxuICDJtWdldERlZmVyQmxvY2tzIGFzIGdldERlZmVyQmxvY2tzLFxuICDJtU5vb3BOZ1pvbmUgYXMgTm9vcE5nWm9uZSxcbiAgybVQZW5kaW5nVGFza3MgYXMgUGVuZGluZ1Rhc2tzLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtEZWZlckJsb2NrRml4dHVyZX0gZnJvbSAnLi9kZWZlcic7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmV9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7VGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyfSBmcm9tICcuL2FwcGxpY2F0aW9uX2Vycm9yX2hhbmRsZXInO1xuXG4vKipcbiAqIEZpeHR1cmUgZm9yIGRlYnVnZ2luZyBhbmQgdGVzdGluZyBhIGNvbXBvbmVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgLyoqXG4gICAqIFRoZSBEZWJ1Z0VsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSByb290IGVsZW1lbnQgb2YgdGhpcyBjb21wb25lbnQuXG4gICAqL1xuICBkZWJ1Z0VsZW1lbnQ6IERlYnVnRWxlbWVudDtcblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIG9mIHRoZSByb290IGNvbXBvbmVudCBjbGFzcy5cbiAgICovXG4gIGNvbXBvbmVudEluc3RhbmNlOiBUO1xuXG4gIC8qKlxuICAgKiBUaGUgbmF0aXZlIGVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICAvKipcbiAgICogVGhlIEVsZW1lbnRSZWYgZm9yIHRoZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBlbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjb21wb25lbnRcbiAgICovXG4gIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcblxuICBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXJGYWN0b3J5MiB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2lzRGVzdHJveWVkOiBib29sZWFuID0gZmFsc2U7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9ub1pvbmVPcHRpb25Jc1NldCA9IGluamVjdChDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCBfbmdab25lOiBOZ1pvbmUgPSB0aGlzLl9ub1pvbmVPcHRpb25Jc1NldCA/IG5ldyBOb29wTmdab25lKCkgOiBpbmplY3QoTmdab25lKTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgX2VmZmVjdFJ1bm5lciA9IGluamVjdChFZmZlY3RTY2hlZHVsZXIpO1xuICAvLyBJbmplY3QgQXBwbGljYXRpb25SZWYgdG8gZW5zdXJlIE5nWm9uZSBzdGFibGVuZXNzIGNhdXNlcyBhZnRlciByZW5kZXIgaG9va3MgdG8gcnVuXG4gIC8vIFRoaXMgd2lsbCBsaWtlbHkgaGFwcGVuIGFzIGEgcmVzdWx0IG9mIGZpeHR1cmUuZGV0ZWN0Q2hhbmdlcyBiZWNhdXNlIGl0IGNhbGxzIG5nWm9uZS5ydW5cbiAgLy8gVGhpcyBpcyBhIGNyYXp5IHdheSBvZiBkb2luZyB0aGluZ3MgYnV0IGhleSwgaXQncyB0aGUgd29ybGQgd2UgbGl2ZSBpbi5cbiAgLy8gVGhlIHpvbmVsZXNzIHNjaGVkdWxlciBzaG91bGQgaW5zdGVhZCBkbyB0aGlzIG1vcmUgaW1wZXJhdGl2ZWx5IGJ5IGF0dGFjaGluZ1xuICAvLyB0aGUgYENvbXBvbmVudFJlZmAgdG8gYEFwcGxpY2F0aW9uUmVmYCBhbmQgY2FsbGluZyBgYXBwUmVmLnRpY2tgIGFzIHRoZSBgZGV0ZWN0Q2hhbmdlc2BcbiAgLy8gYmVoYXZpb3IuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9hcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfdGVzdEFwcFJlZiA9IHRoaXMuX2FwcFJlZiBhcyB1bmtub3duIGFzIFRlc3RBcHBSZWY7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwRXJyb3JIYW5kbGVyID0gaW5qZWN0KFRlc3RCZWRBcHBsaWNhdGlvbkVycm9ySGFuZGxlcik7XG5cbiAgLy8gVE9ETyhhdHNjb3R0KTogUmVtb3ZlIHRoaXMgZnJvbSBwdWJsaWMgQVBJXG4gIG5nWm9uZSA9IHRoaXMuX25vWm9uZU9wdGlvbklzU2V0ID8gbnVsbCA6IHRoaXMuX25nWm9uZTtcblxuICAvKiogQG5vZG9jICovXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxUPikge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBjb21wb25lbnRSZWYuY2hhbmdlRGV0ZWN0b3JSZWY7XG4gICAgdGhpcy5lbGVtZW50UmVmID0gY29tcG9uZW50UmVmLmxvY2F0aW9uO1xuICAgIHRoaXMuZGVidWdFbGVtZW50ID0gPERlYnVnRWxlbWVudD5nZXREZWJ1Z05vZGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuY29tcG9uZW50SW5zdGFuY2UgPSBjb21wb25lbnRSZWYuaW5zdGFuY2U7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSBjb21wb25lbnRSZWY7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgZm9yIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBkZXRlY3RDaGFuZ2VzKGNoZWNrTm9DaGFuZ2VzPzogYm9vbGVhbik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIERvIGEgY2hhbmdlIGRldGVjdGlvbiBydW4gdG8gbWFrZSBzdXJlIHRoZXJlIHdlcmUgbm8gY2hhbmdlcy5cbiAgICovXG4gIGNoZWNrTm9DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgd2hldGhlciB0aGUgZml4dHVyZSBzaG91bGQgYXV0b2RldGVjdCBjaGFuZ2VzLlxuICAgKlxuICAgKiBBbHNvIHJ1bnMgZGV0ZWN0Q2hhbmdlcyBvbmNlIHNvIHRoYXQgYW55IGV4aXN0aW5nIGNoYW5nZSBpcyBkZXRlY3RlZC5cbiAgICovXG4gIGFic3RyYWN0IGF1dG9EZXRlY3RDaGFuZ2VzKGF1dG9EZXRlY3Q/OiBib29sZWFuKTogdm9pZDtcblxuICAvKipcbiAgICogUmV0dXJuIHdoZXRoZXIgdGhlIGZpeHR1cmUgaXMgY3VycmVudGx5IHN0YWJsZSBvciBoYXMgYXN5bmMgdGFza3MgdGhhdCBoYXZlIG5vdCBiZWVuIGNvbXBsZXRlZFxuICAgKiB5ZXQuXG4gICAqL1xuICBpc1N0YWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMucGVuZGluZ1Rhc2tzLmhhc1BlbmRpbmdUYXNrcy52YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgZml4dHVyZSBpcyBzdGFibGUuXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gcmVzdW1lIHRlc3RpbmcgYWZ0ZXIgZXZlbnRzIGhhdmUgdHJpZ2dlcmVkIGFzeW5jaHJvbm91cyBhY3Rpdml0eSBvclxuICAgKiBhc3luY2hyb25vdXMgY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIHdoZW5TdGFibGUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5pc1N0YWJsZSgpKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5hcHBFcnJvckhhbmRsZXIud2hlblN0YWJsZVJlamVjdEZ1bmN0aW9ucy5hZGQocmVqZWN0KTtcbiAgICAgIHRoaXMuX2FwcFJlZi53aGVuU3RhYmxlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuYXBwRXJyb3JIYW5kbGVyLndoZW5TdGFibGVSZWplY3RGdW5jdGlvbnMuZGVsZXRlKHJlamVjdCk7XG4gICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYWxsIGRlZmVyIGJsb2NrIGZpeHR1cmVzIGluIHRoZSBjb21wb25lbnQgZml4dHVyZS5cbiAgICovXG4gIGdldERlZmVyQmxvY2tzKCk6IFByb21pc2U8RGVmZXJCbG9ja0ZpeHR1cmVbXT4ge1xuICAgIGNvbnN0IGRlZmVyQmxvY2tzOiBEZWZlckJsb2NrRGV0YWlsc1tdID0gW107XG4gICAgY29uc3QgbFZpZXcgPSAodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgYW55KVsnX2xWaWV3J107XG4gICAgZ2V0RGVmZXJCbG9ja3MobFZpZXcsIGRlZmVyQmxvY2tzKTtcblxuICAgIGNvbnN0IGRlZmVyQmxvY2tGaXh0dXJlcyA9IFtdO1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgZGVmZXJCbG9ja3MpIHtcbiAgICAgIGRlZmVyQmxvY2tGaXh0dXJlcy5wdXNoKG5ldyBEZWZlckJsb2NrRml4dHVyZShibG9jaywgdGhpcykpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGVmZXJCbG9ja0ZpeHR1cmVzKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFJlbmRlcmVyKCkge1xuICAgIGlmICh0aGlzLl9yZW5kZXJlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlciA9IHRoaXMuY29tcG9uZW50UmVmLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyLCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyIGFzIFJlbmRlcmVyRmFjdG9yeTIgfCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSB1aSBzdGF0ZSBpcyBzdGFibGUgZm9sbG93aW5nIGFuaW1hdGlvbnMuXG4gICAqL1xuICB3aGVuUmVuZGVyaW5nRG9uZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdGhpcy5fZ2V0UmVuZGVyZXIoKTtcbiAgICBpZiAocmVuZGVyZXIgJiYgcmVuZGVyZXIud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiByZW5kZXJlci53aGVuUmVuZGVyaW5nRG9uZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy53aGVuU3RhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBjb21wb25lbnQgZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNEZXN0cm95ZWQpIHtcbiAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuX2lzRGVzdHJveWVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb21wb25lbnRGaXh0dXJlIGJlaGF2aW9yIHRoYXQgYWN0dWFsbHkgYXR0YWNoZXMgdGhlIGNvbXBvbmVudCB0byB0aGUgYXBwbGljYXRpb24gdG8gZW5zdXJlXG4gKiBiZWhhdmlvcnMgYmV0d2VlbiBmaXh0dXJlIGFuZCBhcHBsaWNhdGlvbiBkbyBub3QgZGl2ZXJnZS4gYGRldGVjdENoYW5nZXNgIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHRcbiAqIChpbnN0ZWFkLCB0ZXN0cyBzaG91bGQgd2FpdCBmb3IgdGhlIHNjaGVkdWxlciB0byBkZXRlY3QgY2hhbmdlcyksIGB3aGVuU3RhYmxlYCBpcyBkaXJlY3RseSB0aGVcbiAqIGBBcHBsaWNhdGlvblJlZi5pc1N0YWJsZWAsIGFuZCBgYXV0b0RldGVjdENoYW5nZXNgIGNhbm5vdCBiZSBkaXNhYmxlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNjaGVkdWxlZENvbXBvbmVudEZpeHR1cmU8VD4gZXh0ZW5kcyBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgcHJpdmF0ZSBfYXV0b0RldGVjdCA9IGluamVjdChDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwge29wdGlvbmFsOiB0cnVlfSkgPz8gdHJ1ZTtcblxuICBpbml0aWFsaXplKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9hdXRvRGV0ZWN0KSB7XG4gICAgICB0aGlzLl9hcHBSZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgZGV0ZWN0Q2hhbmdlcyhjaGVja05vQ2hhbmdlcyA9IHRydWUpOiB2b2lkIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDYW5ub3QgZGlzYWJsZSBgY2hlY2tOb0NoYW5nZXNgIGluIHRoaXMgY29uZmlndXJhdGlvbi4gJyArXG4gICAgICAgICAgJ1VzZSBgZml4dHVyZS5jb21wb25lbnRSZWYuaG9zdFZpZXcuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpYCBpbnN0ZWFkLicsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLl9lZmZlY3RSdW5uZXIuZmx1c2goKTtcbiAgICB0aGlzLl9hcHBSZWYudGljaygpO1xuICAgIHRoaXMuX2VmZmVjdFJ1bm5lci5mbHVzaCgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgYXV0b0RldGVjdENoYW5nZXMoYXV0b0RldGVjdCA9IHRydWUpOiB2b2lkIHtcbiAgICBpZiAoIWF1dG9EZXRlY3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0Nhbm5vdCBkaXNhYmxlIGF1dG9EZXRlY3QgYWZ0ZXIgaXQgaGFzIGJlZW4gZW5hYmxlZCB3aGVuIHVzaW5nIHRoZSB6b25lbGVzcyBzY2hlZHVsZXIuICcgK1xuICAgICAgICAgICdUbyBkaXNhYmxlIGF1dG9EZXRlY3QsIGFkZCBge3Byb3ZpZGU6IENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCB1c2VWYWx1ZTogZmFsc2V9YCB0byB0aGUgVGVzdEJlZCBwcm92aWRlcnMuJyxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgdGhpcy5fYXV0b0RldGVjdCA9IGF1dG9EZXRlY3Q7XG4gICAgICB0aGlzLl9hcHBSZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgfVxuICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG59XG5cbmludGVyZmFjZSBUZXN0QXBwUmVmIHtcbiAgZXh0ZXJuYWxUZXN0Vmlld3M6IFNldDxWaWV3UmVmPjtcbiAgYmVmb3JlUmVuZGVyOiBTdWJqZWN0PGJvb2xlYW4+O1xuICBhZnRlclRpY2s6IFN1YmplY3Q8dm9pZD47XG59XG5cbi8qKlxuICogQ29tcG9uZW50Rml4dHVyZSBiZWhhdmlvciB0aGF0IGF0dGVtcHRzIHRvIGFjdCBhcyBhIFwibWluaSBhcHBsaWNhdGlvblwiLlxuICovXG5leHBvcnQgY2xhc3MgUHNldWRvQXBwbGljYXRpb25Db21wb25lbnRGaXh0dXJlPFQ+IGV4dGVuZHMgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIHByaXZhdGUgX3N1YnNjcmlwdGlvbnMgPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgX2F1dG9EZXRlY3QgPSBpbmplY3QoQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIHtvcHRpb25hbDogdHJ1ZX0pID8/IGZhbHNlO1xuICBwcml2YXRlIGFmdGVyVGlja1N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBwcml2YXRlIGJlZm9yZVJlbmRlclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2F1dG9EZXRlY3QpIHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlVG9BcHBSZWZFdmVudHMoKTtcbiAgICB9XG4gICAgdGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcub25EZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCk7XG4gICAgfSk7XG4gICAgLy8gQ3JlYXRlIHN1YnNjcmlwdGlvbnMgb3V0c2lkZSB0aGUgTmdab25lIHNvIHRoYXQgdGhlIGNhbGxiYWNrcyBydW4gb3V0c2lkZVxuICAgIC8vIG9mIE5nWm9uZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgIHRoaXMuX25nWm9uZS5vbkVycm9yLnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGRldGVjdENoYW5nZXMoY2hlY2tOb0NoYW5nZXMgPSB0cnVlKTogdm9pZCB7XG4gICAgdGhpcy5fZWZmZWN0UnVubmVyLmZsdXNoKCk7XG4gICAgLy8gUnVuIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGluc2lkZSB0aGUgTmdab25lIHNvIHRoYXQgYW55IGFzeW5jIHRhc2tzIGFzIHBhcnQgb2YgdGhlIGNoYW5nZVxuICAgIC8vIGRldGVjdGlvbiBhcmUgY2FwdHVyZWQgYnkgdGhlIHpvbmUgYW5kIGNhbiBiZSB3YWl0ZWQgZm9yIGluIGlzU3RhYmxlLlxuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBpZiAoY2hlY2tOb0NoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIFJ1biBhbnkgZWZmZWN0cyB0aGF0IHdlcmUgY3JlYXRlZC9kaXJ0aWVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLiBTdWNoIGVmZmVjdHMgbWlnaHQgYmVjb21lXG4gICAgLy8gZGlydHkgaW4gcmVzcG9uc2UgdG8gaW5wdXQgc2lnbmFscyBjaGFuZ2luZy5cbiAgICB0aGlzLl9lZmZlY3RSdW5uZXIuZmx1c2goKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGF1dG9EZXRlY3RDaGFuZ2VzKGF1dG9EZXRlY3QgPSB0cnVlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX25vWm9uZU9wdGlvbklzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGF1dG9EZXRlY3RDaGFuZ2VzIHdoZW4gQ29tcG9uZW50Rml4dHVyZU5vTmdab25lIGlzIHNldC4nKTtcbiAgICB9XG5cbiAgICBpZiAoYXV0b0RldGVjdCAhPT0gdGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgaWYgKGF1dG9EZXRlY3QpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmVUb0FwcFJlZkV2ZW50cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9hdXRvRGV0ZWN0ID0gYXV0b0RldGVjdDtcbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgc3Vic2NyaWJlVG9BcHBSZWZFdmVudHMoKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uID0gdGhpcy5fdGVzdEFwcFJlZi5hZnRlclRpY2suc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmJlZm9yZVJlbmRlclN1YnNjcmlwdGlvbiA9IHRoaXMuX3Rlc3RBcHBSZWYuYmVmb3JlUmVuZGVyLnN1YnNjcmliZSgoaXNGaXJzdFBhc3MpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICDJtWRldGVjdENoYW5nZXNJblZpZXdJZlJlcXVpcmVkKFxuICAgICAgICAgICAgKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIGFueSkuX2xWaWV3LFxuICAgICAgICAgICAgKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIGFueSkubm90aWZ5RXJyb3JIYW5kbGVyLFxuICAgICAgICAgICAgaXNGaXJzdFBhc3MsXG4gICAgICAgICAgICBmYWxzZSAvKiogem9uZWxlc3MgZW5hYmxlZCAqLyxcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgICAgICAgLy8gSWYgYW4gZXJyb3Igb2NjdXJyZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHJlbW92ZSB0aGUgdGVzdCB2aWV3IGZyb20gdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgICAgLy8gcmVmIHRyYWNraW5nLiBOb3RlIHRoYXQgdGhpcyBpc24ndCBleGFjdGx5IGRlc2lyYWJsZSBidXQgZG9uZSB0aGlzIHdheSBiZWNhdXNlIG9mIGhvd1xuICAgICAgICAgIC8vIHRoaW5ncyB1c2VkIHRvIHdvcmsgd2l0aCBgYXV0b0RldGVjdGAgYW5kIHVuY2F1Z2h0IGVycm9ycy4gSWRlYWxseSB3ZSB3b3VsZCBzdXJmYWNlXG4gICAgICAgICAgLy8gdGhpcyBlcnJvciB0byB0aGUgZXJyb3IgaGFuZGxlciBpbnN0ZWFkIGFuZCBjb250aW51ZSByZWZyZXNoaW5nIHRoZSB2aWV3IGxpa2VcbiAgICAgICAgICAvLyB3aGF0IHdvdWxkIGhhcHBlbiBpbiB0aGUgYXBwbGljYXRpb24uXG4gICAgICAgICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcblxuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5fdGVzdEFwcFJlZi5leHRlcm5hbFRlc3RWaWV3cy5hZGQodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB1bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKSB7XG4gICAgdGhpcy5hZnRlclRpY2tTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5iZWZvcmVSZW5kZXJTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5hZnRlclRpY2tTdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5iZWZvcmVSZW5kZXJTdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fdGVzdEFwcFJlZi5leHRlcm5hbFRlc3RWaWV3cy5kZWxldGUodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnVuc3Vic2NyaWJlRnJvbUFwcFJlZkV2ZW50cygpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMudW5zdWJzY3JpYmUoKTtcbiAgICBzdXBlci5kZXN0cm95KCk7XG4gIH1cbn1cbiJdfQ==