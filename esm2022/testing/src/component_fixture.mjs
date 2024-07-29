/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, getDebugNode, inject, NgZone, RendererFactory2, ɵdetectChangesInViewIfRequired, ɵEffectScheduler as EffectScheduler, ɵgetDeferBlocks as getDeferBlocks, ɵNoopNgZone as NoopNgZone, ɵPendingTasks as PendingTasks, } from '@angular/core';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
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
        /** @internal */
        this._appErrorHandler = inject(TestBedApplicationErrorHandler);
        /** @internal */
        this._rejectWhenStablePromiseOnAppError = true;
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
        return this._appRef.isStable.pipe(first((stable) => stable)).toPromise();
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
    whenStable() {
        return new Promise((resolve, reject) => {
            this._appErrorHandler.whenStableRejectFunctions.add(reject);
            super.whenStable().then((v) => {
                this._appErrorHandler.whenStableRejectFunctions.delete(reject);
                resolve(v);
            });
        });
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
        // TODO(atscott): Determine whether we can align this behavior with the zoneless fixture.
        // This exists to keep the previous zone-based fixture behavior consistent with how it was before.
        // However, we currently feel that the zoneless fixture is doing the more correct thing.
        this._rejectWhenStablePromiseOnAppError = false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxjQUFjLEVBS2QsWUFBWSxFQUNaLE1BQU0sRUFDTixNQUFNLEVBQ04sZ0JBQWdCLEVBR2hCLDhCQUE4QixFQUM5QixnQkFBZ0IsSUFBSSxlQUFlLEVBQ25DLGVBQWUsSUFBSSxjQUFjLEVBQ2pDLFdBQVcsSUFBSSxVQUFVLEVBQ3pCLGFBQWEsSUFBSSxZQUFZLEdBQzlCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBVSxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDM0MsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXJDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN2RixPQUFPLEVBQUMsOEJBQThCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUUzRTs7OztHQUlHO0FBQ0gsTUFBTSxPQUFnQixnQkFBZ0I7SUFxRHBDLGFBQWE7SUFDYixZQUFtQixZQUE2QjtRQUE3QixpQkFBWSxHQUFaLFlBQVksQ0FBaUI7UUEzQnhDLGlCQUFZLEdBQVksS0FBSyxDQUFDO1FBQ3RDLGdCQUFnQjtRQUNHLHVCQUFrQixHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBQzNGLGdCQUFnQjtRQUNOLFlBQU8sR0FBVyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxN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RkFBMEY7b0JBQzFGLHdGQUF3RjtvQkFDeEYsc0ZBQXNGO29CQUN0RixnRkFBZ0Y7b0JBQ2hGLHdDQUF3QztvQkFDeEMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7b0JBRW5DLE1BQU0sQ0FBQyxDQUFDO2dCQUNWLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sMkJBQTJCO1FBQ2pDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUMxQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDN0MsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFNBQVMsQ0FBQztRQUN2QyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsU0FBUyxDQUFDO1FBQzFDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVRLE9BQU87UUFDZCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25SZWYsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnRSZWYsXG4gIERlYnVnRWxlbWVudCxcbiAgRWxlbWVudFJlZixcbiAgZ2V0RGVidWdOb2RlLFxuICBpbmplY3QsXG4gIE5nWm9uZSxcbiAgUmVuZGVyZXJGYWN0b3J5MixcbiAgVmlld1JlZixcbiAgybVEZWZlckJsb2NrRGV0YWlscyBhcyBEZWZlckJsb2NrRGV0YWlscyxcbiAgybVkZXRlY3RDaGFuZ2VzSW5WaWV3SWZSZXF1aXJlZCxcbiAgybVFZmZlY3RTY2hlZHVsZXIgYXMgRWZmZWN0U2NoZWR1bGVyLFxuICDJtWdldERlZmVyQmxvY2tzIGFzIGdldERlZmVyQmxvY2tzLFxuICDJtU5vb3BOZ1pvbmUgYXMgTm9vcE5nWm9uZSxcbiAgybVQZW5kaW5nVGFza3MgYXMgUGVuZGluZ1Rhc2tzLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7Zmlyc3R9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtEZWZlckJsb2NrRml4dHVyZX0gZnJvbSAnLi9kZWZlcic7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmV9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7VGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyfSBmcm9tICcuL2FwcGxpY2F0aW9uX2Vycm9yX2hhbmRsZXInO1xuXG4vKipcbiAqIEZpeHR1cmUgZm9yIGRlYnVnZ2luZyBhbmQgdGVzdGluZyBhIGNvbXBvbmVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgLyoqXG4gICAqIFRoZSBEZWJ1Z0VsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSByb290IGVsZW1lbnQgb2YgdGhpcyBjb21wb25lbnQuXG4gICAqL1xuICBkZWJ1Z0VsZW1lbnQ6IERlYnVnRWxlbWVudDtcblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIG9mIHRoZSByb290IGNvbXBvbmVudCBjbGFzcy5cbiAgICovXG4gIGNvbXBvbmVudEluc3RhbmNlOiBUO1xuXG4gIC8qKlxuICAgKiBUaGUgbmF0aXZlIGVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICAvKipcbiAgICogVGhlIEVsZW1lbnRSZWYgZm9yIHRoZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBlbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjb21wb25lbnRcbiAgICovXG4gIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcblxuICBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXJGYWN0b3J5MiB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2lzRGVzdHJveWVkOiBib29sZWFuID0gZmFsc2U7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9ub1pvbmVPcHRpb25Jc1NldCA9IGluamVjdChDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCBfbmdab25lOiBOZ1pvbmUgPSB0aGlzLl9ub1pvbmVPcHRpb25Jc1NldCA/IG5ldyBOb29wTmdab25lKCkgOiBpbmplY3QoTmdab25lKTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgX2VmZmVjdFJ1bm5lciA9IGluamVjdChFZmZlY3RTY2hlZHVsZXIpO1xuICAvLyBJbmplY3QgQXBwbGljYXRpb25SZWYgdG8gZW5zdXJlIE5nWm9uZSBzdGFibGVuZXNzIGNhdXNlcyBhZnRlciByZW5kZXIgaG9va3MgdG8gcnVuXG4gIC8vIFRoaXMgd2lsbCBsaWtlbHkgaGFwcGVuIGFzIGEgcmVzdWx0IG9mIGZpeHR1cmUuZGV0ZWN0Q2hhbmdlcyBiZWNhdXNlIGl0IGNhbGxzIG5nWm9uZS5ydW5cbiAgLy8gVGhpcyBpcyBhIGNyYXp5IHdheSBvZiBkb2luZyB0aGluZ3MgYnV0IGhleSwgaXQncyB0aGUgd29ybGQgd2UgbGl2ZSBpbi5cbiAgLy8gVGhlIHpvbmVsZXNzIHNjaGVkdWxlciBzaG91bGQgaW5zdGVhZCBkbyB0aGlzIG1vcmUgaW1wZXJhdGl2ZWx5IGJ5IGF0dGFjaGluZ1xuICAvLyB0aGUgYENvbXBvbmVudFJlZmAgdG8gYEFwcGxpY2F0aW9uUmVmYCBhbmQgY2FsbGluZyBgYXBwUmVmLnRpY2tgIGFzIHRoZSBgZGV0ZWN0Q2hhbmdlc2BcbiAgLy8gYmVoYXZpb3IuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9hcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfdGVzdEFwcFJlZiA9IHRoaXMuX2FwcFJlZiBhcyB1bmtub3duIGFzIFRlc3RBcHBSZWY7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9hcHBFcnJvckhhbmRsZXIgPSBpbmplY3QoVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyKTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgX3JlamVjdFdoZW5TdGFibGVQcm9taXNlT25BcHBFcnJvciA9IHRydWU7XG5cbiAgLy8gVE9ETyhhdHNjb3R0KTogUmVtb3ZlIHRoaXMgZnJvbSBwdWJsaWMgQVBJXG4gIG5nWm9uZSA9IHRoaXMuX25vWm9uZU9wdGlvbklzU2V0ID8gbnVsbCA6IHRoaXMuX25nWm9uZTtcblxuICAvKiogQG5vZG9jICovXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxUPikge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBjb21wb25lbnRSZWYuY2hhbmdlRGV0ZWN0b3JSZWY7XG4gICAgdGhpcy5lbGVtZW50UmVmID0gY29tcG9uZW50UmVmLmxvY2F0aW9uO1xuICAgIHRoaXMuZGVidWdFbGVtZW50ID0gPERlYnVnRWxlbWVudD5nZXREZWJ1Z05vZGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuY29tcG9uZW50SW5zdGFuY2UgPSBjb21wb25lbnRSZWYuaW5zdGFuY2U7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSBjb21wb25lbnRSZWY7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgZm9yIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBkZXRlY3RDaGFuZ2VzKGNoZWNrTm9DaGFuZ2VzPzogYm9vbGVhbik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIERvIGEgY2hhbmdlIGRldGVjdGlvbiBydW4gdG8gbWFrZSBzdXJlIHRoZXJlIHdlcmUgbm8gY2hhbmdlcy5cbiAgICovXG4gIGNoZWNrTm9DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgd2hldGhlciB0aGUgZml4dHVyZSBzaG91bGQgYXV0b2RldGVjdCBjaGFuZ2VzLlxuICAgKlxuICAgKiBBbHNvIHJ1bnMgZGV0ZWN0Q2hhbmdlcyBvbmNlIHNvIHRoYXQgYW55IGV4aXN0aW5nIGNoYW5nZSBpcyBkZXRlY3RlZC5cbiAgICovXG4gIGFic3RyYWN0IGF1dG9EZXRlY3RDaGFuZ2VzKGF1dG9EZXRlY3Q/OiBib29sZWFuKTogdm9pZDtcblxuICAvKipcbiAgICogUmV0dXJuIHdoZXRoZXIgdGhlIGZpeHR1cmUgaXMgY3VycmVudGx5IHN0YWJsZSBvciBoYXMgYXN5bmMgdGFza3MgdGhhdCBoYXZlIG5vdCBiZWVuIGNvbXBsZXRlZFxuICAgKiB5ZXQuXG4gICAqL1xuICBpc1N0YWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMucGVuZGluZ1Rhc2tzLmhhc1BlbmRpbmdUYXNrcy52YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgZml4dHVyZSBpcyBzdGFibGUuXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gcmVzdW1lIHRlc3RpbmcgYWZ0ZXIgZXZlbnRzIGhhdmUgdHJpZ2dlcmVkIGFzeW5jaHJvbm91cyBhY3Rpdml0eSBvclxuICAgKiBhc3luY2hyb25vdXMgY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIHdoZW5TdGFibGUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5pc1N0YWJsZSgpKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fYXBwUmVmLmlzU3RhYmxlLnBpcGUoZmlyc3QoKHN0YWJsZSkgPT4gc3RhYmxlKSkudG9Qcm9taXNlKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBkZWZlciBibG9jayBmaXh0dXJlcyBpbiB0aGUgY29tcG9uZW50IGZpeHR1cmUuXG4gICAqL1xuICBnZXREZWZlckJsb2NrcygpOiBQcm9taXNlPERlZmVyQmxvY2tGaXh0dXJlW10+IHtcbiAgICBjb25zdCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSA9IFtdO1xuICAgIGNvbnN0IGxWaWV3ID0gKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIGFueSlbJ19sVmlldyddO1xuICAgIGdldERlZmVyQmxvY2tzKGxWaWV3LCBkZWZlckJsb2Nrcyk7XG5cbiAgICBjb25zdCBkZWZlckJsb2NrRml4dHVyZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGRlZmVyQmxvY2tzKSB7XG4gICAgICBkZWZlckJsb2NrRml4dHVyZXMucHVzaChuZXcgRGVmZXJCbG9ja0ZpeHR1cmUoYmxvY2ssIHRoaXMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRlZmVyQmxvY2tGaXh0dXJlcyk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRSZW5kZXJlcigpIHtcbiAgICBpZiAodGhpcy5fcmVuZGVyZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fcmVuZGVyZXIgPSB0aGlzLmNvbXBvbmVudFJlZi5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MiwgbnVsbCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9yZW5kZXJlciBhcyBSZW5kZXJlckZhY3RvcnkyIHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgdWkgc3RhdGUgaXMgc3RhYmxlIGZvbGxvd2luZyBhbmltYXRpb25zLlxuICAgKi9cbiAgd2hlblJlbmRlcmluZ0RvbmUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZW5kZXJlciA9IHRoaXMuX2dldFJlbmRlcmVyKCk7XG4gICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLndoZW5SZW5kZXJpbmdEb25lKSB7XG4gICAgICByZXR1cm4gcmVuZGVyZXIud2hlblJlbmRlcmluZ0RvbmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMud2hlblN0YWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgY29tcG9uZW50IGRlc3RydWN0aW9uLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzRGVzdHJveWVkKSB7XG4gICAgICB0aGlzLmNvbXBvbmVudFJlZi5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29tcG9uZW50Rml4dHVyZSBiZWhhdmlvciB0aGF0IGFjdHVhbGx5IGF0dGFjaGVzIHRoZSBjb21wb25lbnQgdG8gdGhlIGFwcGxpY2F0aW9uIHRvIGVuc3VyZVxuICogYmVoYXZpb3JzIGJldHdlZW4gZml4dHVyZSBhbmQgYXBwbGljYXRpb24gZG8gbm90IGRpdmVyZ2UuIGBkZXRlY3RDaGFuZ2VzYCBpcyBkaXNhYmxlZCBieSBkZWZhdWx0XG4gKiAoaW5zdGVhZCwgdGVzdHMgc2hvdWxkIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gZGV0ZWN0IGNoYW5nZXMpLCBgd2hlblN0YWJsZWAgaXMgZGlyZWN0bHkgdGhlXG4gKiBgQXBwbGljYXRpb25SZWYuaXNTdGFibGVgLCBhbmQgYGF1dG9EZXRlY3RDaGFuZ2VzYCBjYW5ub3QgYmUgZGlzYWJsZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBTY2hlZHVsZWRDb21wb25lbnRGaXh0dXJlPFQ+IGV4dGVuZHMgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIHByaXZhdGUgX2F1dG9EZXRlY3QgPSBpbmplY3QoQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIHtvcHRpb25hbDogdHJ1ZX0pID8/IHRydWU7XG5cbiAgaW5pdGlhbGl6ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgdGhpcy5fYXBwUmVmLmF0dGFjaFZpZXcodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIHdoZW5TdGFibGUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fYXBwRXJyb3JIYW5kbGVyLndoZW5TdGFibGVSZWplY3RGdW5jdGlvbnMuYWRkKHJlamVjdCk7XG4gICAgICBzdXBlci53aGVuU3RhYmxlKCkudGhlbigodikgPT4ge1xuICAgICAgICB0aGlzLl9hcHBFcnJvckhhbmRsZXIud2hlblN0YWJsZVJlamVjdEZ1bmN0aW9ucy5kZWxldGUocmVqZWN0KTtcbiAgICAgICAgcmVzb2x2ZSh2KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGV0ZWN0Q2hhbmdlcyhjaGVja05vQ2hhbmdlcyA9IHRydWUpOiB2b2lkIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDYW5ub3QgZGlzYWJsZSBgY2hlY2tOb0NoYW5nZXNgIGluIHRoaXMgY29uZmlndXJhdGlvbi4gJyArXG4gICAgICAgICAgJ1VzZSBgZml4dHVyZS5jb21wb25lbnRSZWYuaG9zdFZpZXcuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpYCBpbnN0ZWFkLicsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLl9lZmZlY3RSdW5uZXIuZmx1c2goKTtcbiAgICB0aGlzLl9hcHBSZWYudGljaygpO1xuICAgIHRoaXMuX2VmZmVjdFJ1bm5lci5mbHVzaCgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgYXV0b0RldGVjdENoYW5nZXMoYXV0b0RldGVjdCA9IHRydWUpOiB2b2lkIHtcbiAgICBpZiAoIWF1dG9EZXRlY3QpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0Nhbm5vdCBkaXNhYmxlIGF1dG9EZXRlY3QgYWZ0ZXIgaXQgaGFzIGJlZW4gZW5hYmxlZCB3aGVuIHVzaW5nIHRoZSB6b25lbGVzcyBzY2hlZHVsZXIuICcgK1xuICAgICAgICAgICdUbyBkaXNhYmxlIGF1dG9EZXRlY3QsIGFkZCBge3Byb3ZpZGU6IENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCB1c2VWYWx1ZTogZmFsc2V9YCB0byB0aGUgVGVzdEJlZCBwcm92aWRlcnMuJyxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgdGhpcy5fYXV0b0RldGVjdCA9IGF1dG9EZXRlY3Q7XG4gICAgICB0aGlzLl9hcHBSZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgfVxuICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG59XG5cbmludGVyZmFjZSBUZXN0QXBwUmVmIHtcbiAgZXh0ZXJuYWxUZXN0Vmlld3M6IFNldDxWaWV3UmVmPjtcbiAgYmVmb3JlUmVuZGVyOiBTdWJqZWN0PGJvb2xlYW4+O1xuICBhZnRlclRpY2s6IFN1YmplY3Q8dm9pZD47XG59XG5cbi8qKlxuICogQ29tcG9uZW50Rml4dHVyZSBiZWhhdmlvciB0aGF0IGF0dGVtcHRzIHRvIGFjdCBhcyBhIFwibWluaSBhcHBsaWNhdGlvblwiLlxuICovXG5leHBvcnQgY2xhc3MgUHNldWRvQXBwbGljYXRpb25Db21wb25lbnRGaXh0dXJlPFQ+IGV4dGVuZHMgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIHByaXZhdGUgX3N1YnNjcmlwdGlvbnMgPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgX2F1dG9EZXRlY3QgPSBpbmplY3QoQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIHtvcHRpb25hbDogdHJ1ZX0pID8/IGZhbHNlO1xuICBwcml2YXRlIGFmdGVyVGlja1N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBwcml2YXRlIGJlZm9yZVJlbmRlclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgLy8gVE9ETyhhdHNjb3R0KTogRGV0ZXJtaW5lIHdoZXRoZXIgd2UgY2FuIGFsaWduIHRoaXMgYmVoYXZpb3Igd2l0aCB0aGUgem9uZWxlc3MgZml4dHVyZS5cbiAgICAvLyBUaGlzIGV4aXN0cyB0byBrZWVwIHRoZSBwcmV2aW91cyB6b25lLWJhc2VkIGZpeHR1cmUgYmVoYXZpb3IgY29uc2lzdGVudCB3aXRoIGhvdyBpdCB3YXMgYmVmb3JlLlxuICAgIC8vIEhvd2V2ZXIsIHdlIGN1cnJlbnRseSBmZWVsIHRoYXQgdGhlIHpvbmVsZXNzIGZpeHR1cmUgaXMgZG9pbmcgdGhlIG1vcmUgY29ycmVjdCB0aGluZy5cbiAgICB0aGlzLl9yZWplY3RXaGVuU3RhYmxlUHJvbWlzZU9uQXBwRXJyb3IgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLl9hdXRvRGV0ZWN0KSB7XG4gICAgICB0aGlzLnN1YnNjcmliZVRvQXBwUmVmRXZlbnRzKCk7XG4gICAgfVxuICAgIHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3Lm9uRGVzdHJveSgoKSA9PiB7XG4gICAgICB0aGlzLnVuc3Vic2NyaWJlRnJvbUFwcFJlZkV2ZW50cygpO1xuICAgIH0pO1xuICAgIC8vIENyZWF0ZSBzdWJzY3JpcHRpb25zIG91dHNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IHRoZSBjYWxsYmFja3MgcnVuIG91dHNpZGVcbiAgICAvLyBvZiBOZ1pvbmUuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgICB0aGlzLl9uZ1pvbmUub25FcnJvci5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICBvdmVycmlkZSBkZXRlY3RDaGFuZ2VzKGNoZWNrTm9DaGFuZ2VzID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuX2VmZmVjdFJ1bm5lci5mbHVzaCgpO1xuICAgIC8vIFJ1biB0aGUgY2hhbmdlIGRldGVjdGlvbiBpbnNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IGFueSBhc3luYyB0YXNrcyBhcyBwYXJ0IG9mIHRoZSBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24gYXJlIGNhcHR1cmVkIGJ5IHRoZSB6b25lIGFuZCBjYW4gYmUgd2FpdGVkIGZvciBpbiBpc1N0YWJsZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgaWYgKGNoZWNrTm9DaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMuY2hlY2tOb0NoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBSdW4gYW55IGVmZmVjdHMgdGhhdCB3ZXJlIGNyZWF0ZWQvZGlydGllZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbi4gU3VjaCBlZmZlY3RzIG1pZ2h0IGJlY29tZVxuICAgIC8vIGRpcnR5IGluIHJlc3BvbnNlIHRvIGlucHV0IHNpZ25hbHMgY2hhbmdpbmcuXG4gICAgdGhpcy5fZWZmZWN0UnVubmVyLmZsdXNoKCk7XG4gIH1cblxuICBvdmVycmlkZSBhdXRvRGV0ZWN0Q2hhbmdlcyhhdXRvRGV0ZWN0ID0gdHJ1ZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9ub1pvbmVPcHRpb25Jc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2FsbCBhdXRvRGV0ZWN0Q2hhbmdlcyB3aGVuIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSBpcyBzZXQuJyk7XG4gICAgfVxuXG4gICAgaWYgKGF1dG9EZXRlY3QgIT09IHRoaXMuX2F1dG9EZXRlY3QpIHtcbiAgICAgIGlmIChhdXRvRGV0ZWN0KSB7XG4gICAgICAgIHRoaXMuc3Vic2NyaWJlVG9BcHBSZWZFdmVudHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fYXV0b0RldGVjdCA9IGF1dG9EZXRlY3Q7XG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICBwcml2YXRlIHN1YnNjcmliZVRvQXBwUmVmRXZlbnRzKCkge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLmFmdGVyVGlja1N1YnNjcmlwdGlvbiA9IHRoaXMuX3Rlc3RBcHBSZWYuYWZ0ZXJUaWNrLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuY2hlY2tOb0NoYW5nZXMoKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5iZWZvcmVSZW5kZXJTdWJzY3JpcHRpb24gPSB0aGlzLl90ZXN0QXBwUmVmLmJlZm9yZVJlbmRlci5zdWJzY3JpYmUoKGlzRmlyc3RQYXNzKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgybVkZXRlY3RDaGFuZ2VzSW5WaWV3SWZSZXF1aXJlZChcbiAgICAgICAgICAgICh0aGlzLmNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBhbnkpLl9sVmlldyxcbiAgICAgICAgICAgICh0aGlzLmNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBhbnkpLm5vdGlmeUVycm9ySGFuZGxlcixcbiAgICAgICAgICAgIGlzRmlyc3RQYXNzLFxuICAgICAgICAgICAgZmFsc2UgLyoqIHpvbmVsZXNzIGVuYWJsZWQgKi8sXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgICAgIC8vIElmIGFuIGVycm9yIG9jY3VycmVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCByZW1vdmUgdGhlIHRlc3QgdmlldyBmcm9tIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICAgIC8vIHJlZiB0cmFja2luZy4gTm90ZSB0aGF0IHRoaXMgaXNuJ3QgZXhhY3RseSBkZXNpcmFibGUgYnV0IGRvbmUgdGhpcyB3YXkgYmVjYXVzZSBvZiBob3dcbiAgICAgICAgICAvLyB0aGluZ3MgdXNlZCB0byB3b3JrIHdpdGggYGF1dG9EZXRlY3RgIGFuZCB1bmNhdWdodCBlcnJvcnMuIElkZWFsbHkgd2Ugd291bGQgc3VyZmFjZVxuICAgICAgICAgIC8vIHRoaXMgZXJyb3IgdG8gdGhlIGVycm9yIGhhbmRsZXIgaW5zdGVhZCBhbmQgY29udGludWUgcmVmcmVzaGluZyB0aGUgdmlldyBsaWtlXG4gICAgICAgICAgLy8gd2hhdCB3b3VsZCBoYXBwZW4gaW4gdGhlIGFwcGxpY2F0aW9uLlxuICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCk7XG5cbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX3Rlc3RBcHBSZWYuZXh0ZXJuYWxUZXN0Vmlld3MuYWRkKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgdW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCkge1xuICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Rlc3RBcHBSZWYuZXh0ZXJuYWxUZXN0Vmlld3MuZGVsZXRlKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnVuc3Vic2NyaWJlKCk7XG4gICAgc3VwZXIuZGVzdHJveSgpO1xuICB9XG59XG4iXX0=