/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, getDebugNode, inject, NgZone, RendererFactory2, ɵdetectChangesInViewIfRequired, ɵEffectScheduler as EffectScheduler, ɵgetDeferBlocks as getDeferBlocks, ɵNoopNgZone as NoopNgZone, ɵPendingTasks as PendingTasks } from '@angular/core';
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
        this.pendingTasks = inject(PendingTasks);
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
        return this._appRef.isStable.pipe(first(stable => stable)).toPromise();
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
                    ɵdetectChangesInViewIfRequired(this.componentRef.hostView._lView, isFirstPass, this.componentRef.hostView.notifyErrorHandler);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQTZELFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFvRCw4QkFBOEIsRUFBRSxnQkFBZ0IsSUFBSSxlQUFlLEVBQUUsZUFBZSxJQUFJLGNBQWMsRUFBRSxXQUFXLElBQUksVUFBVSxFQUFFLGFBQWEsSUFBSSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNVcsT0FBTyxFQUFVLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzQyxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBQyx3REFBd0QsRUFBRSwwQkFBMEIsRUFBRSx3QkFBd0IsR0FBRSxNQUFNLG1CQUFtQixDQUFDO0FBRWxKOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLGdCQUFnQjtJQWlEcEMsYUFBYTtJQUNiLFlBQW1CLFlBQTZCO1FBQTdCLGlCQUFZLEdBQVosWUFBWSxDQUFpQjtRQXZCeEMsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFDdEMsZ0JBQWdCO1FBQ0csdUJBQWtCLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDM0YsZ0JBQWdCO1FBQ04sWUFBTyxHQUFXLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hGLGdCQUFnQjtRQUNOLGtCQUFh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QVksQ0FBQyxRQUFnQixDQUFDLE1BQU0sRUFDMUMsV0FBVyxFQUNWLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBZ0IsQ0FBQyxrQkFBa0IsQ0FDekQsQ0FBQztnQkFDSixDQUFDO2dCQUFDLE9BQU8sQ0FBVSxFQUFFLENBQUM7b0JBQ3BCLDBGQUEwRjtvQkFDMUYsd0ZBQXdGO29CQUN4RixzRkFBc0Y7b0JBQ3RGLGdGQUFnRjtvQkFDaEYsd0NBQXdDO29CQUN4QyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztvQkFFbkMsTUFBTSxDQUFDLENBQUM7Z0JBQ1YsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTywyQkFBMkI7UUFDakMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxTQUFTLENBQUM7UUFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRVEsT0FBTztRQUNkLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbEMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2xCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmLCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50UmVmLCBEZWJ1Z0VsZW1lbnQsIEVsZW1lbnRSZWYsIGdldERlYnVnTm9kZSwgaW5qZWN0LCBOZ1pvbmUsIFJlbmRlcmVyRmFjdG9yeTIsIFZpZXdSZWYsIMm1RGVmZXJCbG9ja0RldGFpbHMgYXMgRGVmZXJCbG9ja0RldGFpbHMsIMm1ZGV0ZWN0Q2hhbmdlc0luVmlld0lmUmVxdWlyZWQsIMm1RWZmZWN0U2NoZWR1bGVyIGFzIEVmZmVjdFNjaGVkdWxlciwgybVnZXREZWZlckJsb2NrcyBhcyBnZXREZWZlckJsb2NrcywgybVOb29wTmdab25lIGFzIE5vb3BOZ1pvbmUsIMm1UGVuZGluZ1Rhc2tzIGFzIFBlbmRpbmdUYXNrc30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpcnN0fSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7RGVmZXJCbG9ja0ZpeHR1cmV9IGZyb20gJy4vZGVmZXInO1xuaW1wb3J0IHtBbGxvd0RldGVjdENoYW5nZXNBbmRBY2tub3dsZWRnZUl0Q2FuSGlkZUFwcGxpY2F0aW9uQnVncywgQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSx9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcblxuLyoqXG4gKiBGaXh0dXJlIGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmcgYSBjb21wb25lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIC8qKlxuICAgKiBUaGUgRGVidWdFbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgY29tcG9uZW50LlxuICAgKi9cbiAgZGVidWdFbGVtZW50OiBEZWJ1Z0VsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIFRoZSBpbnN0YW5jZSBvZiB0aGUgcm9vdCBjb21wb25lbnQgY2xhc3MuXG4gICAqL1xuICBjb21wb25lbnRJbnN0YW5jZTogVDtcblxuICAvKipcbiAgICogVGhlIG5hdGl2ZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgLyoqXG4gICAqIFRoZSBFbGVtZW50UmVmIGZvciB0aGUgZWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgZWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogVGhlIENoYW5nZURldGVjdG9yUmVmIGZvciB0aGUgY29tcG9uZW50XG4gICAqL1xuICBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyRmFjdG9yeTJ8bnVsbHx1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2lzRGVzdHJveWVkOiBib29sZWFuID0gZmFsc2U7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9ub1pvbmVPcHRpb25Jc1NldCA9IGluamVjdChDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCBfbmdab25lOiBOZ1pvbmUgPSB0aGlzLl9ub1pvbmVPcHRpb25Jc1NldCA/IG5ldyBOb29wTmdab25lKCkgOiBpbmplY3QoTmdab25lKTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgX2VmZmVjdFJ1bm5lciA9IGluamVjdChFZmZlY3RTY2hlZHVsZXIpO1xuICAvLyBJbmplY3QgQXBwbGljYXRpb25SZWYgdG8gZW5zdXJlIE5nWm9uZSBzdGFibGVuZXNzIGNhdXNlcyBhZnRlciByZW5kZXIgaG9va3MgdG8gcnVuXG4gIC8vIFRoaXMgd2lsbCBsaWtlbHkgaGFwcGVuIGFzIGEgcmVzdWx0IG9mIGZpeHR1cmUuZGV0ZWN0Q2hhbmdlcyBiZWNhdXNlIGl0IGNhbGxzIG5nWm9uZS5ydW5cbiAgLy8gVGhpcyBpcyBhIGNyYXp5IHdheSBvZiBkb2luZyB0aGluZ3MgYnV0IGhleSwgaXQncyB0aGUgd29ybGQgd2UgbGl2ZSBpbi5cbiAgLy8gVGhlIHpvbmVsZXNzIHNjaGVkdWxlciBzaG91bGQgaW5zdGVhZCBkbyB0aGlzIG1vcmUgaW1wZXJhdGl2ZWx5IGJ5IGF0dGFjaGluZ1xuICAvLyB0aGUgYENvbXBvbmVudFJlZmAgdG8gYEFwcGxpY2F0aW9uUmVmYCBhbmQgY2FsbGluZyBgYXBwUmVmLnRpY2tgIGFzIHRoZSBgZGV0ZWN0Q2hhbmdlc2BcbiAgLy8gYmVoYXZpb3IuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9hcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfdGVzdEFwcFJlZiA9IHRoaXMuX2FwcFJlZiBhcyB1bmtub3duIGFzIFRlc3RBcHBSZWY7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGVuZGluZ1Rhc2tzID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG5cbiAgLy8gVE9ETyhhdHNjb3R0KTogUmVtb3ZlIHRoaXMgZnJvbSBwdWJsaWMgQVBJXG4gIG5nWm9uZSA9IHRoaXMuX25vWm9uZU9wdGlvbklzU2V0ID8gbnVsbCA6IHRoaXMuX25nWm9uZTtcblxuICAvKiogQG5vZG9jICovXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxUPikge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBjb21wb25lbnRSZWYuY2hhbmdlRGV0ZWN0b3JSZWY7XG4gICAgdGhpcy5lbGVtZW50UmVmID0gY29tcG9uZW50UmVmLmxvY2F0aW9uO1xuICAgIHRoaXMuZGVidWdFbGVtZW50ID0gPERlYnVnRWxlbWVudD5nZXREZWJ1Z05vZGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuY29tcG9uZW50SW5zdGFuY2UgPSBjb21wb25lbnRSZWYuaW5zdGFuY2U7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSBjb21wb25lbnRSZWY7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgZm9yIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBkZXRlY3RDaGFuZ2VzKGNoZWNrTm9DaGFuZ2VzPzogYm9vbGVhbik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIERvIGEgY2hhbmdlIGRldGVjdGlvbiBydW4gdG8gbWFrZSBzdXJlIHRoZXJlIHdlcmUgbm8gY2hhbmdlcy5cbiAgICovXG4gIGNoZWNrTm9DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgd2hldGhlciB0aGUgZml4dHVyZSBzaG91bGQgYXV0b2RldGVjdCBjaGFuZ2VzLlxuICAgKlxuICAgKiBBbHNvIHJ1bnMgZGV0ZWN0Q2hhbmdlcyBvbmNlIHNvIHRoYXQgYW55IGV4aXN0aW5nIGNoYW5nZSBpcyBkZXRlY3RlZC5cbiAgICovXG4gIGFic3RyYWN0IGF1dG9EZXRlY3RDaGFuZ2VzKGF1dG9EZXRlY3Q/OiBib29sZWFuKTogdm9pZDtcblxuICAvKipcbiAgICogUmV0dXJuIHdoZXRoZXIgdGhlIGZpeHR1cmUgaXMgY3VycmVudGx5IHN0YWJsZSBvciBoYXMgYXN5bmMgdGFza3MgdGhhdCBoYXZlIG5vdCBiZWVuIGNvbXBsZXRlZFxuICAgKiB5ZXQuXG4gICAqL1xuICBpc1N0YWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXRoaXMucGVuZGluZ1Rhc2tzLmhhc1BlbmRpbmdUYXNrcy52YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgZml4dHVyZSBpcyBzdGFibGUuXG4gICAqXG4gICAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gcmVzdW1lIHRlc3RpbmcgYWZ0ZXIgZXZlbnRzIGhhdmUgdHJpZ2dlcmVkIGFzeW5jaHJvbm91cyBhY3Rpdml0eSBvclxuICAgKiBhc3luY2hyb25vdXMgY2hhbmdlIGRldGVjdGlvbi5cbiAgICovXG4gIHdoZW5TdGFibGUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAodGhpcy5pc1N0YWJsZSgpKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2FwcFJlZi5pc1N0YWJsZS5waXBlKGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpKS50b1Byb21pc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYWxsIGRlZmVyIGJsb2NrIGZpeHR1cmVzIGluIHRoZSBjb21wb25lbnQgZml4dHVyZS5cbiAgICpcbiAgICogQGRldmVsb3BlclByZXZpZXdcbiAgICovXG4gIGdldERlZmVyQmxvY2tzKCk6IFByb21pc2U8RGVmZXJCbG9ja0ZpeHR1cmVbXT4ge1xuICAgIGNvbnN0IGRlZmVyQmxvY2tzOiBEZWZlckJsb2NrRGV0YWlsc1tdID0gW107XG4gICAgY29uc3QgbFZpZXcgPSAodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgYW55KVsnX2xWaWV3J107XG4gICAgZ2V0RGVmZXJCbG9ja3MobFZpZXcsIGRlZmVyQmxvY2tzKTtcblxuICAgIGNvbnN0IGRlZmVyQmxvY2tGaXh0dXJlcyA9IFtdO1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgZGVmZXJCbG9ja3MpIHtcbiAgICAgIGRlZmVyQmxvY2tGaXh0dXJlcy5wdXNoKG5ldyBEZWZlckJsb2NrRml4dHVyZShibG9jaywgdGhpcykpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGVmZXJCbG9ja0ZpeHR1cmVzKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldFJlbmRlcmVyKCkge1xuICAgIGlmICh0aGlzLl9yZW5kZXJlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlciA9IHRoaXMuY29tcG9uZW50UmVmLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyLCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyIGFzIFJlbmRlcmVyRmFjdG9yeTIgfCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSB1aSBzdGF0ZSBpcyBzdGFibGUgZm9sbG93aW5nIGFuaW1hdGlvbnMuXG4gICAqL1xuICB3aGVuUmVuZGVyaW5nRG9uZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdGhpcy5fZ2V0UmVuZGVyZXIoKTtcbiAgICBpZiAocmVuZGVyZXIgJiYgcmVuZGVyZXIud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiByZW5kZXJlci53aGVuUmVuZGVyaW5nRG9uZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy53aGVuU3RhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBjb21wb25lbnQgZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNEZXN0cm95ZWQpIHtcbiAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuX2lzRGVzdHJveWVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb21wb25lbnRGaXh0dXJlIGJlaGF2aW9yIHRoYXQgYWN0dWFsbHkgYXR0YWNoZXMgdGhlIGNvbXBvbmVudCB0byB0aGUgYXBwbGljYXRpb24gdG8gZW5zdXJlXG4gKiBiZWhhdmlvcnMgYmV0d2VlbiBmaXh0dXJlIGFuZCBhcHBsaWNhdGlvbiBkbyBub3QgZGl2ZXJnZS4gYGRldGVjdENoYW5nZXNgIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHRcbiAqIChpbnN0ZWFkLCB0ZXN0cyBzaG91bGQgd2FpdCBmb3IgdGhlIHNjaGVkdWxlciB0byBkZXRlY3QgY2hhbmdlcyksIGB3aGVuU3RhYmxlYCBpcyBkaXJlY3RseSB0aGVcbiAqIGBBcHBsaWNhdGlvblJlZi5pc1N0YWJsZWAsIGFuZCBgYXV0b0RldGVjdENoYW5nZXNgIGNhbm5vdCBiZSBkaXNhYmxlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNjaGVkdWxlZENvbXBvbmVudEZpeHR1cmU8VD4gZXh0ZW5kcyBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNhYmxlRGV0ZWN0Q2hhbmdlc0Vycm9yID1cbiAgICAgIGluamVjdChBbGxvd0RldGVjdENoYW5nZXNBbmRBY2tub3dsZWRnZUl0Q2FuSGlkZUFwcGxpY2F0aW9uQnVncywge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG5cbiAgaW5pdGlhbGl6ZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9hcHBSZWYuYXR0YWNoVmlldyh0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gIH1cblxuICBvdmVycmlkZSBkZXRlY3RDaGFuZ2VzKGNoZWNrTm9DaGFuZ2VzOiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIGlmICghdGhpcy5kaXNhYmxlRGV0ZWN0Q2hhbmdlc0Vycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0RvIG5vdCB1c2UgYGRldGVjdENoYW5nZXNgIGRpcmVjdGx5IHdoZW4gdXNpbmcgem9uZWxlc3MgY2hhbmdlIGRldGVjdGlvbi4nICtcbiAgICAgICAgICAgICAgJyBJbnN0ZWFkLCB3YWl0IGZvciB0aGUgbmV4dCByZW5kZXIgb3IgYGZpeHR1cmUud2hlblN0YWJsZWAuJyxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmICghY2hlY2tOb0NoYW5nZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQ2Fubm90IGRpc2FibGUgYGNoZWNrTm9DaGFuZ2VzYCBpbiB0aGlzIGNvbmZpZ3VyYXRpb24uICcgK1xuICAgICAgICAgICAgICAnVXNlIGBmaXh0dXJlLmNvbXBvbmVudFJlZi5ob3N0Vmlldy5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKClgIGluc3RlYWQuJyxcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuX2VmZmVjdFJ1bm5lci5mbHVzaCgpO1xuICAgIHRoaXMuX2FwcFJlZi50aWNrKCk7XG4gICAgdGhpcy5fZWZmZWN0UnVubmVyLmZsdXNoKCk7XG4gIH1cblxuICBvdmVycmlkZSBhdXRvRGV0ZWN0Q2hhbmdlcyhhdXRvRGV0ZWN0PzogYm9vbGVhbnx1bmRlZmluZWQpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGF1dG9EZXRlY3RDaGFuZ2VzIHdoZW4gdXNpbmcgY2hhbmdlIGRldGVjdGlvbiBzY2hlZHVsaW5nLicpO1xuICB9XG59XG5cbmludGVyZmFjZSBUZXN0QXBwUmVmIHtcbiAgZXh0ZXJuYWxUZXN0Vmlld3M6IFNldDxWaWV3UmVmPjtcbiAgYmVmb3JlUmVuZGVyOiBTdWJqZWN0PGJvb2xlYW4+O1xuICBhZnRlclRpY2s6IFN1YmplY3Q8dm9pZD47XG59XG5cbi8qKlxuICogQ29tcG9uZW50Rml4dHVyZSBiZWhhdmlvciB0aGF0IGF0dGVtcHRzIHRvIGFjdCBhcyBhIFwibWluaSBhcHBsaWNhdGlvblwiLlxuICovXG5leHBvcnQgY2xhc3MgUHNldWRvQXBwbGljYXRpb25Db21wb25lbnRGaXh0dXJlPFQ+IGV4dGVuZHMgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIHByaXZhdGUgX3N1YnNjcmlwdGlvbnMgPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgX2F1dG9EZXRlY3QgPSBpbmplY3QoQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIHtvcHRpb25hbDogdHJ1ZX0pID8/IGZhbHNlO1xuICBwcml2YXRlIGFmdGVyVGlja1N1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBiZWZvcmVSZW5kZXJTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgaW5pdGlhbGl6ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgdGhpcy5zdWJzY3JpYmVUb0FwcFJlZkV2ZW50cygpO1xuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudFJlZi5ob3N0Vmlldy5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcbiAgICB9KTtcbiAgICAvLyBDcmVhdGUgc3Vic2NyaXB0aW9ucyBvdXRzaWRlIHRoZSBOZ1pvbmUgc28gdGhhdCB0aGUgY2FsbGJhY2tzIHJ1biBvdXRzaWRlXG4gICAgLy8gb2YgTmdab25lLlxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgICAgICB0aGlzLl9uZ1pvbmUub25FcnJvci5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGRldGVjdENoYW5nZXMoY2hlY2tOb0NoYW5nZXMgPSB0cnVlKTogdm9pZCB7XG4gICAgdGhpcy5fZWZmZWN0UnVubmVyLmZsdXNoKCk7XG4gICAgLy8gUnVuIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGluc2lkZSB0aGUgTmdab25lIHNvIHRoYXQgYW55IGFzeW5jIHRhc2tzIGFzIHBhcnQgb2YgdGhlIGNoYW5nZVxuICAgIC8vIGRldGVjdGlvbiBhcmUgY2FwdHVyZWQgYnkgdGhlIHpvbmUgYW5kIGNhbiBiZSB3YWl0ZWQgZm9yIGluIGlzU3RhYmxlLlxuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICBpZiAoY2hlY2tOb0NoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIFJ1biBhbnkgZWZmZWN0cyB0aGF0IHdlcmUgY3JlYXRlZC9kaXJ0aWVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLiBTdWNoIGVmZmVjdHMgbWlnaHQgYmVjb21lXG4gICAgLy8gZGlydHkgaW4gcmVzcG9uc2UgdG8gaW5wdXQgc2lnbmFscyBjaGFuZ2luZy5cbiAgICB0aGlzLl9lZmZlY3RSdW5uZXIuZmx1c2goKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGF1dG9EZXRlY3RDaGFuZ2VzKGF1dG9EZXRlY3QgPSB0cnVlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX25vWm9uZU9wdGlvbklzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGF1dG9EZXRlY3RDaGFuZ2VzIHdoZW4gQ29tcG9uZW50Rml4dHVyZU5vTmdab25lIGlzIHNldC4nKTtcbiAgICB9XG5cbiAgICBpZiAoYXV0b0RldGVjdCAhPT0gdGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgaWYgKGF1dG9EZXRlY3QpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpYmVUb0FwcFJlZkV2ZW50cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9hdXRvRGV0ZWN0ID0gYXV0b0RldGVjdDtcbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgc3Vic2NyaWJlVG9BcHBSZWZFdmVudHMoKSB7XG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uID0gdGhpcy5fdGVzdEFwcFJlZi5hZnRlclRpY2suc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmJlZm9yZVJlbmRlclN1YnNjcmlwdGlvbiA9IHRoaXMuX3Rlc3RBcHBSZWYuYmVmb3JlUmVuZGVyLnN1YnNjcmliZSgoaXNGaXJzdFBhc3MpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICDJtWRldGVjdENoYW5nZXNJblZpZXdJZlJlcXVpcmVkKFxuICAgICAgICAgICAgICAodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgYW55KS5fbFZpZXcsXG4gICAgICAgICAgICAgIGlzRmlyc3RQYXNzLFxuICAgICAgICAgICAgICAodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgYW55KS5ub3RpZnlFcnJvckhhbmRsZXIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgICAgIC8vIElmIGFuIGVycm9yIG9jY3VycmVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCByZW1vdmUgdGhlIHRlc3QgdmlldyBmcm9tIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICAgIC8vIHJlZiB0cmFja2luZy4gTm90ZSB0aGF0IHRoaXMgaXNuJ3QgZXhhY3RseSBkZXNpcmFibGUgYnV0IGRvbmUgdGhpcyB3YXkgYmVjYXVzZSBvZiBob3dcbiAgICAgICAgICAvLyB0aGluZ3MgdXNlZCB0byB3b3JrIHdpdGggYGF1dG9EZXRlY3RgIGFuZCB1bmNhdWdodCBlcnJvcnMuIElkZWFsbHkgd2Ugd291bGQgc3VyZmFjZVxuICAgICAgICAgIC8vIHRoaXMgZXJyb3IgdG8gdGhlIGVycm9yIGhhbmRsZXIgaW5zdGVhZCBhbmQgY29udGludWUgcmVmcmVzaGluZyB0aGUgdmlldyBsaWtlXG4gICAgICAgICAgLy8gd2hhdCB3b3VsZCBoYXBwZW4gaW4gdGhlIGFwcGxpY2F0aW9uLlxuICAgICAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCk7XG5cbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX3Rlc3RBcHBSZWYuZXh0ZXJuYWxUZXN0Vmlld3MuYWRkKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgdW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCkge1xuICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Rlc3RBcHBSZWYuZXh0ZXJuYWxUZXN0Vmlld3MuZGVsZXRlKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgfVxuXG4gIG92ZXJyaWRlIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnVuc3Vic2NyaWJlKCk7XG4gICAgc3VwZXIuZGVzdHJveSgpO1xuICB9XG59XG4iXX0=