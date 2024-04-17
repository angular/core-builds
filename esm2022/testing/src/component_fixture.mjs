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
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone } from './test_bed_common';
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
    initialize() {
        this._appRef.attachView(this.componentRef.hostView);
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
    autoDetectChanges(autoDetect) {
        if (!autoDetect) {
            throw new Error('Cannot disable autoDetect when using the zoneless scheduler.');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQTZELFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFvRCw4QkFBOEIsRUFBRSxnQkFBZ0IsSUFBSSxlQUFlLEVBQUUsZUFBZSxJQUFJLGNBQWMsRUFBRSxXQUFXLElBQUksVUFBVSxFQUFFLGFBQWEsSUFBSSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNVcsT0FBTyxFQUFVLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUMzQyxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzFDLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXZGOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLGdCQUFnQjtJQWlEcEMsYUFBYTtJQUNiLFlBQW1CLFlBQTZCO1FBQTdCLGlCQUFZLEdBQVosWUFBWSxDQUFpQjtRQXZCeEMsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFDdEMsZ0JBQWdCO1FBQ0csdUJBQWtCLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDM0YsZ0JBQWdCO1FBQ04sWUFBTyxHQUFXLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hGLGdCQUFnQjtRQUNOLGtCQUFhLEdBQUcsTUFBTSxD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LDBGQUEwRjtvQkFDMUYsd0ZBQXdGO29CQUN4RixzRkFBc0Y7b0JBQ3RGLGdGQUFnRjtvQkFDaEYsd0NBQXdDO29CQUN4QyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztvQkFFbkMsTUFBTSxDQUFDLENBQUM7Z0JBQ1YsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTywyQkFBMkI7UUFDakMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxTQUFTLENBQUM7UUFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRVEsT0FBTztRQUNkLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbEMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2xCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmLCBDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50UmVmLCBEZWJ1Z0VsZW1lbnQsIEVsZW1lbnRSZWYsIGdldERlYnVnTm9kZSwgaW5qZWN0LCBOZ1pvbmUsIFJlbmRlcmVyRmFjdG9yeTIsIFZpZXdSZWYsIMm1RGVmZXJCbG9ja0RldGFpbHMgYXMgRGVmZXJCbG9ja0RldGFpbHMsIMm1ZGV0ZWN0Q2hhbmdlc0luVmlld0lmUmVxdWlyZWQsIMm1RWZmZWN0U2NoZWR1bGVyIGFzIEVmZmVjdFNjaGVkdWxlciwgybVnZXREZWZlckJsb2NrcyBhcyBnZXREZWZlckJsb2NrcywgybVOb29wTmdab25lIGFzIE5vb3BOZ1pvbmUsIMm1UGVuZGluZ1Rhc2tzIGFzIFBlbmRpbmdUYXNrc30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YmplY3QsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpcnN0fSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7RGVmZXJCbG9ja0ZpeHR1cmV9IGZyb20gJy4vZGVmZXInO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cbi8qKlxuICogRml4dHVyZSBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nIGEgY29tcG9uZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAvKipcbiAgICogVGhlIERlYnVnRWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGNvbXBvbmVudC5cbiAgICovXG4gIGRlYnVnRWxlbWVudDogRGVidWdFbGVtZW50O1xuXG4gIC8qKlxuICAgKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIHJvb3QgY29tcG9uZW50IGNsYXNzLlxuICAgKi9cbiAgY29tcG9uZW50SW5zdGFuY2U6IFQ7XG5cbiAgLyoqXG4gICAqIFRoZSBuYXRpdmUgZWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgbmF0aXZlRWxlbWVudDogYW55O1xuXG4gIC8qKlxuICAgKiBUaGUgRWxlbWVudFJlZiBmb3IgdGhlIGVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiBmb3IgdGhlIGNvbXBvbmVudFxuICAgKi9cbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmO1xuXG4gIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlckZhY3RvcnkyfG51bGx8dW5kZWZpbmVkO1xuICBwcml2YXRlIF9pc0Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfbm9ab25lT3B0aW9uSXNTZXQgPSBpbmplY3QoQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgX25nWm9uZTogTmdab25lID0gdGhpcy5fbm9ab25lT3B0aW9uSXNTZXQgPyBuZXcgTm9vcE5nWm9uZSgpIDogaW5qZWN0KE5nWm9uZSk7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJvdGVjdGVkIF9lZmZlY3RSdW5uZXIgPSBpbmplY3QoRWZmZWN0U2NoZWR1bGVyKTtcbiAgLy8gSW5qZWN0IEFwcGxpY2F0aW9uUmVmIHRvIGVuc3VyZSBOZ1pvbmUgc3RhYmxlbmVzcyBjYXVzZXMgYWZ0ZXIgcmVuZGVyIGhvb2tzIHRvIHJ1blxuICAvLyBUaGlzIHdpbGwgbGlrZWx5IGhhcHBlbiBhcyBhIHJlc3VsdCBvZiBmaXh0dXJlLmRldGVjdENoYW5nZXMgYmVjYXVzZSBpdCBjYWxscyBuZ1pvbmUucnVuXG4gIC8vIFRoaXMgaXMgYSBjcmF6eSB3YXkgb2YgZG9pbmcgdGhpbmdzIGJ1dCBoZXksIGl0J3MgdGhlIHdvcmxkIHdlIGxpdmUgaW4uXG4gIC8vIFRoZSB6b25lbGVzcyBzY2hlZHVsZXIgc2hvdWxkIGluc3RlYWQgZG8gdGhpcyBtb3JlIGltcGVyYXRpdmVseSBieSBhdHRhY2hpbmdcbiAgLy8gdGhlIGBDb21wb25lbnRSZWZgIHRvIGBBcHBsaWNhdGlvblJlZmAgYW5kIGNhbGxpbmcgYGFwcFJlZi50aWNrYCBhcyB0aGUgYGRldGVjdENoYW5nZXNgXG4gIC8vIGJlaGF2aW9yLlxuICAvKiogQGludGVybmFsICovXG4gIHByb3RlY3RlZCByZWFkb25seSBfYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX3Rlc3RBcHBSZWYgPSB0aGlzLl9hcHBSZWYgYXMgdW5rbm93biBhcyBUZXN0QXBwUmVmO1xuICBwcml2YXRlIHJlYWRvbmx5IHBlbmRpbmdUYXNrcyA9IGluamVjdChQZW5kaW5nVGFza3MpO1xuXG4gIC8vIFRPRE8oYXRzY290dCk6IFJlbW92ZSB0aGlzIGZyb20gcHVibGljIEFQSVxuICBuZ1pvbmUgPSB0aGlzLl9ub1pvbmVPcHRpb25Jc1NldCA/IG51bGwgOiB0aGlzLl9uZ1pvbmU7XG5cbiAgLyoqIEBub2RvYyAqL1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8VD4pIHtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmID0gY29tcG9uZW50UmVmLmNoYW5nZURldGVjdG9yUmVmO1xuICAgIHRoaXMuZWxlbWVudFJlZiA9IGNvbXBvbmVudFJlZi5sb2NhdGlvbjtcbiAgICB0aGlzLmRlYnVnRWxlbWVudCA9IDxEZWJ1Z0VsZW1lbnQ+Z2V0RGVidWdOb2RlKHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICB0aGlzLmNvbXBvbmVudEluc3RhbmNlID0gY29tcG9uZW50UmVmLmluc3RhbmNlO1xuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIHRoaXMuY29tcG9uZW50UmVmID0gY29tcG9uZW50UmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlIGZvciB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgYWJzdHJhY3QgZGV0ZWN0Q2hhbmdlcyhjaGVja05vQ2hhbmdlcz86IGJvb2xlYW4pOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBEbyBhIGNoYW5nZSBkZXRlY3Rpb24gcnVuIHRvIG1ha2Ugc3VyZSB0aGVyZSB3ZXJlIG5vIGNoYW5nZXMuXG4gICAqL1xuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLmNoZWNrTm9DaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHdoZXRoZXIgdGhlIGZpeHR1cmUgc2hvdWxkIGF1dG9kZXRlY3QgY2hhbmdlcy5cbiAgICpcbiAgICogQWxzbyBydW5zIGRldGVjdENoYW5nZXMgb25jZSBzbyB0aGF0IGFueSBleGlzdGluZyBjaGFuZ2UgaXMgZGV0ZWN0ZWQuXG4gICAqL1xuICBhYnN0cmFjdCBhdXRvRGV0ZWN0Q2hhbmdlcyhhdXRvRGV0ZWN0PzogYm9vbGVhbik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoZSBmaXh0dXJlIGlzIGN1cnJlbnRseSBzdGFibGUgb3IgaGFzIGFzeW5jIHRhc2tzIHRoYXQgaGF2ZSBub3QgYmVlbiBjb21wbGV0ZWRcbiAgICogeWV0LlxuICAgKi9cbiAgaXNTdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICF0aGlzLnBlbmRpbmdUYXNrcy5oYXNQZW5kaW5nVGFza3MudmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGZpeHR1cmUgaXMgc3RhYmxlLlxuICAgKlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIHJlc3VtZSB0ZXN0aW5nIGFmdGVyIGV2ZW50cyBoYXZlIHRyaWdnZXJlZCBhc3luY2hyb25vdXMgYWN0aXZpdHkgb3JcbiAgICogYXN5bmNocm9ub3VzIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqL1xuICB3aGVuU3RhYmxlKCk6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMuaXNTdGFibGUoKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9hcHBSZWYuaXNTdGFibGUucGlwZShmaXJzdChzdGFibGUgPT4gc3RhYmxlKSkudG9Qcm9taXNlKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBkZWZlciBibG9jayBmaXh0dXJlcyBpbiB0aGUgY29tcG9uZW50IGZpeHR1cmUuXG4gICAqXG4gICAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gICAqL1xuICBnZXREZWZlckJsb2NrcygpOiBQcm9taXNlPERlZmVyQmxvY2tGaXh0dXJlW10+IHtcbiAgICBjb25zdCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSA9IFtdO1xuICAgIGNvbnN0IGxWaWV3ID0gKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIGFueSlbJ19sVmlldyddO1xuICAgIGdldERlZmVyQmxvY2tzKGxWaWV3LCBkZWZlckJsb2Nrcyk7XG5cbiAgICBjb25zdCBkZWZlckJsb2NrRml4dHVyZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGRlZmVyQmxvY2tzKSB7XG4gICAgICBkZWZlckJsb2NrRml4dHVyZXMucHVzaChuZXcgRGVmZXJCbG9ja0ZpeHR1cmUoYmxvY2ssIHRoaXMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRlZmVyQmxvY2tGaXh0dXJlcyk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRSZW5kZXJlcigpIHtcbiAgICBpZiAodGhpcy5fcmVuZGVyZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fcmVuZGVyZXIgPSB0aGlzLmNvbXBvbmVudFJlZi5pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MiwgbnVsbCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9yZW5kZXJlciBhcyBSZW5kZXJlckZhY3RvcnkyIHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgdWkgc3RhdGUgaXMgc3RhYmxlIGZvbGxvd2luZyBhbmltYXRpb25zLlxuICAgKi9cbiAgd2hlblJlbmRlcmluZ0RvbmUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZW5kZXJlciA9IHRoaXMuX2dldFJlbmRlcmVyKCk7XG4gICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLndoZW5SZW5kZXJpbmdEb25lKSB7XG4gICAgICByZXR1cm4gcmVuZGVyZXIud2hlblJlbmRlcmluZ0RvbmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMud2hlblN0YWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgY29tcG9uZW50IGRlc3RydWN0aW9uLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzRGVzdHJveWVkKSB7XG4gICAgICB0aGlzLmNvbXBvbmVudFJlZi5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29tcG9uZW50Rml4dHVyZSBiZWhhdmlvciB0aGF0IGFjdHVhbGx5IGF0dGFjaGVzIHRoZSBjb21wb25lbnQgdG8gdGhlIGFwcGxpY2F0aW9uIHRvIGVuc3VyZVxuICogYmVoYXZpb3JzIGJldHdlZW4gZml4dHVyZSBhbmQgYXBwbGljYXRpb24gZG8gbm90IGRpdmVyZ2UuIGBkZXRlY3RDaGFuZ2VzYCBpcyBkaXNhYmxlZCBieSBkZWZhdWx0XG4gKiAoaW5zdGVhZCwgdGVzdHMgc2hvdWxkIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gZGV0ZWN0IGNoYW5nZXMpLCBgd2hlblN0YWJsZWAgaXMgZGlyZWN0bHkgdGhlXG4gKiBgQXBwbGljYXRpb25SZWYuaXNTdGFibGVgLCBhbmQgYGF1dG9EZXRlY3RDaGFuZ2VzYCBjYW5ub3QgYmUgZGlzYWJsZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBTY2hlZHVsZWRDb21wb25lbnRGaXh0dXJlPFQ+IGV4dGVuZHMgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgdGhpcy5fYXBwUmVmLmF0dGFjaFZpZXcodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGV0ZWN0Q2hhbmdlcyhjaGVja05vQ2hhbmdlczogYm9vbGVhbiA9IHRydWUpOiB2b2lkIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBkaXNhYmxlIGBjaGVja05vQ2hhbmdlc2AgaW4gdGhpcyBjb25maWd1cmF0aW9uLiAnICtcbiAgICAgICAgICAgICAgJ1VzZSBgZml4dHVyZS5jb21wb25lbnRSZWYuaG9zdFZpZXcuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpYCBpbnN0ZWFkLicsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLl9lZmZlY3RSdW5uZXIuZmx1c2goKTtcbiAgICB0aGlzLl9hcHBSZWYudGljaygpO1xuICAgIHRoaXMuX2VmZmVjdFJ1bm5lci5mbHVzaCgpO1xuICB9XG5cbiAgb3ZlcnJpZGUgYXV0b0RldGVjdENoYW5nZXMoYXV0b0RldGVjdD86IGJvb2xlYW58dW5kZWZpbmVkKTogdm9pZCB7XG4gICAgaWYgKCFhdXRvRGV0ZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBkaXNhYmxlIGF1dG9EZXRlY3Qgd2hlbiB1c2luZyB0aGUgem9uZWxlc3Mgc2NoZWR1bGVyLicpO1xuICAgIH1cbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgVGVzdEFwcFJlZiB7XG4gIGV4dGVybmFsVGVzdFZpZXdzOiBTZXQ8Vmlld1JlZj47XG4gIGJlZm9yZVJlbmRlcjogU3ViamVjdDxib29sZWFuPjtcbiAgYWZ0ZXJUaWNrOiBTdWJqZWN0PHZvaWQ+O1xufVxuXG4vKipcbiAqIENvbXBvbmVudEZpeHR1cmUgYmVoYXZpb3IgdGhhdCBhdHRlbXB0cyB0byBhY3QgYXMgYSBcIm1pbmkgYXBwbGljYXRpb25cIi5cbiAqL1xuZXhwb3J0IGNsYXNzIFBzZXVkb0FwcGxpY2F0aW9uQ29tcG9uZW50Rml4dHVyZTxUPiBleHRlbmRzIENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICBwcml2YXRlIF9zdWJzY3JpcHRpb25zID0gbmV3IFN1YnNjcmlwdGlvbigpO1xuICBwcml2YXRlIF9hdXRvRGV0ZWN0ID0gaW5qZWN0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCB7b3B0aW9uYWw6IHRydWV9KSA/PyBmYWxzZTtcbiAgcHJpdmF0ZSBhZnRlclRpY2tTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIHByaXZhdGUgYmVmb3JlUmVuZGVyU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2F1dG9EZXRlY3QpIHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlVG9BcHBSZWZFdmVudHMoKTtcbiAgICB9XG4gICAgdGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcub25EZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCk7XG4gICAgfSk7XG4gICAgLy8gQ3JlYXRlIHN1YnNjcmlwdGlvbnMgb3V0c2lkZSB0aGUgTmdab25lIHNvIHRoYXQgdGhlIGNhbGxiYWNrcyBydW4gb3V0c2lkZVxuICAgIC8vIG9mIE5nWm9uZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgICAgdGhpcy5fbmdab25lLm9uRXJyb3Iuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIG5leHQ6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICBvdmVycmlkZSBkZXRlY3RDaGFuZ2VzKGNoZWNrTm9DaGFuZ2VzID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuX2VmZmVjdFJ1bm5lci5mbHVzaCgpO1xuICAgIC8vIFJ1biB0aGUgY2hhbmdlIGRldGVjdGlvbiBpbnNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IGFueSBhc3luYyB0YXNrcyBhcyBwYXJ0IG9mIHRoZSBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24gYXJlIGNhcHR1cmVkIGJ5IHRoZSB6b25lIGFuZCBjYW4gYmUgd2FpdGVkIGZvciBpbiBpc1N0YWJsZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgaWYgKGNoZWNrTm9DaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMuY2hlY2tOb0NoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBSdW4gYW55IGVmZmVjdHMgdGhhdCB3ZXJlIGNyZWF0ZWQvZGlydGllZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbi4gU3VjaCBlZmZlY3RzIG1pZ2h0IGJlY29tZVxuICAgIC8vIGRpcnR5IGluIHJlc3BvbnNlIHRvIGlucHV0IHNpZ25hbHMgY2hhbmdpbmcuXG4gICAgdGhpcy5fZWZmZWN0UnVubmVyLmZsdXNoKCk7XG4gIH1cblxuICBvdmVycmlkZSBhdXRvRGV0ZWN0Q2hhbmdlcyhhdXRvRGV0ZWN0ID0gdHJ1ZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9ub1pvbmVPcHRpb25Jc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2FsbCBhdXRvRGV0ZWN0Q2hhbmdlcyB3aGVuIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSBpcyBzZXQuJyk7XG4gICAgfVxuXG4gICAgaWYgKGF1dG9EZXRlY3QgIT09IHRoaXMuX2F1dG9EZXRlY3QpIHtcbiAgICAgIGlmIChhdXRvRGV0ZWN0KSB7XG4gICAgICAgIHRoaXMuc3Vic2NyaWJlVG9BcHBSZWZFdmVudHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudW5zdWJzY3JpYmVGcm9tQXBwUmVmRXZlbnRzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fYXV0b0RldGVjdCA9IGF1dG9EZXRlY3Q7XG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICBwcml2YXRlIHN1YnNjcmliZVRvQXBwUmVmRXZlbnRzKCkge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLmFmdGVyVGlja1N1YnNjcmlwdGlvbiA9IHRoaXMuX3Rlc3RBcHBSZWYuYWZ0ZXJUaWNrLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuY2hlY2tOb0NoYW5nZXMoKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5iZWZvcmVSZW5kZXJTdWJzY3JpcHRpb24gPSB0aGlzLl90ZXN0QXBwUmVmLmJlZm9yZVJlbmRlci5zdWJzY3JpYmUoKGlzRmlyc3RQYXNzKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgybVkZXRlY3RDaGFuZ2VzSW5WaWV3SWZSZXF1aXJlZChcbiAgICAgICAgICAgICAgKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIGFueSkuX2xWaWV3LFxuICAgICAgICAgICAgICAodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgYW55KS5ub3RpZnlFcnJvckhhbmRsZXIsXG4gICAgICAgICAgICAgIGlzRmlyc3RQYXNzLFxuICAgICAgICAgICAgICBmYWxzZSAvKiogem9uZWxlc3MgZW5hYmxlZCAqLyxcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgICAgICAgLy8gSWYgYW4gZXJyb3Igb2NjdXJyZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHJlbW92ZSB0aGUgdGVzdCB2aWV3IGZyb20gdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgICAgLy8gcmVmIHRyYWNraW5nLiBOb3RlIHRoYXQgdGhpcyBpc24ndCBleGFjdGx5IGRlc2lyYWJsZSBidXQgZG9uZSB0aGlzIHdheSBiZWNhdXNlIG9mIGhvd1xuICAgICAgICAgIC8vIHRoaW5ncyB1c2VkIHRvIHdvcmsgd2l0aCBgYXV0b0RldGVjdGAgYW5kIHVuY2F1Z2h0IGVycm9ycy4gSWRlYWxseSB3ZSB3b3VsZCBzdXJmYWNlXG4gICAgICAgICAgLy8gdGhpcyBlcnJvciB0byB0aGUgZXJyb3IgaGFuZGxlciBpbnN0ZWFkIGFuZCBjb250aW51ZSByZWZyZXNoaW5nIHRoZSB2aWV3IGxpa2VcbiAgICAgICAgICAvLyB3aGF0IHdvdWxkIGhhcHBlbiBpbiB0aGUgYXBwbGljYXRpb24uXG4gICAgICAgICAgdGhpcy51bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKTtcblxuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5fdGVzdEFwcFJlZi5leHRlcm5hbFRlc3RWaWV3cy5hZGQodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB1bnN1YnNjcmliZUZyb21BcHBSZWZFdmVudHMoKSB7XG4gICAgdGhpcy5hZnRlclRpY2tTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5iZWZvcmVSZW5kZXJTdWJzY3JpcHRpb24/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5hZnRlclRpY2tTdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5iZWZvcmVSZW5kZXJTdWJzY3JpcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fdGVzdEFwcFJlZi5leHRlcm5hbFRlc3RWaWV3cy5kZWxldGUodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnVuc3Vic2NyaWJlRnJvbUFwcFJlZkV2ZW50cygpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMudW5zdWJzY3JpYmUoKTtcbiAgICBzdXBlci5kZXN0cm95KCk7XG4gIH1cbn1cbiJdfQ==