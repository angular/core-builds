/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef, getDebugNode, inject, NgZone, RendererFactory2, ɵgetDeferBlocks as getDeferBlocks, ɵNoopNgZone as NoopNgZone, ɵZoneAwareQueueingScheduler as ZoneAwareQueueingScheduler } from '@angular/core';
import { Subscription } from 'rxjs';
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
        this._isStable = true;
        this._isDestroyed = false;
        this._resolve = null;
        this._promise = null;
        this.noZoneOptionIsSet = inject(ComponentFixtureNoNgZone, { optional: true });
        this._ngZone = this.noZoneOptionIsSet ? new NoopNgZone() : inject(NgZone);
        this._autoDetect = inject(ComponentFixtureAutoDetect, { optional: true }) ?? false;
        this.effectRunner = inject(ZoneAwareQueueingScheduler, { optional: true });
        this._subscriptions = new Subscription();
        // Inject ApplicationRef to ensure NgZone stableness causes after render hooks to run
        // This will likely happen as a result of fixture.detectChanges because it calls ngZone.run
        // This is a crazy way of doing things but hey, it's the world we live in.
        // The zoneless scheduler should instead do this more imperatively by attaching
        // the `ComponentRef` to `ApplicationRef` and calling `appRef.tick` as the `detectChanges`
        // behavior.
        this.appRef = inject(ApplicationRef);
        // TODO(atscott): Remove this from public API
        this.ngZone = this.noZoneOptionIsSet ? null : this._ngZone;
        this.changeDetectorRef = componentRef.changeDetectorRef;
        this.elementRef = componentRef.location;
        this.debugElement = getDebugNode(this.elementRef.nativeElement);
        this.componentInstance = componentRef.instance;
        this.nativeElement = this.elementRef.nativeElement;
        this.componentRef = componentRef;
        this.setupNgZone();
    }
    setupNgZone() {
        // Create subscriptions outside the NgZone so that the callbacks run outside
        // of NgZone.
        this._ngZone.runOutsideAngular(() => {
            this._subscriptions.add(this._ngZone.onUnstable.subscribe({
                next: () => {
                    this._isStable = false;
                }
            }));
            this._subscriptions.add(this._ngZone.onMicrotaskEmpty.subscribe({
                next: () => {
                    if (this._autoDetect) {
                        // Do a change detection run with checkNoChanges set to true to check
                        // there are no changes on the second run.
                        this.detectChanges(true);
                    }
                }
            }));
            this._subscriptions.add(this._ngZone.onStable.subscribe({
                next: () => {
                    this._isStable = true;
                    // Check whether there is a pending whenStable() completer to resolve.
                    if (this._promise !== null) {
                        // If so check whether there are no pending macrotasks before resolving.
                        // Do this check in the next tick so that ngZone gets a chance to update the state of
                        // pending macrotasks.
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
                }
            }));
            this._subscriptions.add(this._ngZone.onError.subscribe({
                next: (error) => {
                    throw error;
                }
            }));
        });
    }
    _tick(checkNoChanges) {
        this.changeDetectorRef.detectChanges();
        if (checkNoChanges) {
            this.checkNoChanges();
        }
    }
    /**
     * Trigger a change detection cycle for the component.
     */
    detectChanges(checkNoChanges = true) {
        this.effectRunner?.flush();
        // Run the change detection inside the NgZone so that any async tasks as part of the change
        // detection are captured by the zone and can be waited for in isStable.
        this._ngZone.run(() => {
            this._tick(checkNoChanges);
        });
        // Run any effects that were created/dirtied during change detection. Such effects might become
        // dirty in response to input signals changing.
        this.effectRunner?.flush();
    }
    /**
     * Do a change detection run to make sure there were no changes.
     */
    checkNoChanges() {
        this.changeDetectorRef.checkNoChanges();
    }
    /**
     * Set whether the fixture should autodetect changes.
     *
     * Also runs detectChanges once so that any existing change is detected.
     */
    autoDetectChanges(autoDetect = true) {
        if (this.noZoneOptionIsSet) {
            throw new Error('Cannot call autoDetectChanges when ComponentFixtureNoNgZone is set');
        }
        this._autoDetect = autoDetect;
        this.detectChanges();
    }
    /**
     * Return whether the fixture is currently stable or has async tasks that have not been completed
     * yet.
     */
    isStable() {
        return this._isStable && !this._ngZone.hasPendingMacrotasks;
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
        else if (this._promise !== null) {
            return this._promise;
        }
        else {
            this._promise = new Promise(res => {
                this._resolve = res;
            });
            return this._promise;
        }
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
            this._subscriptions.unsubscribe();
            this._isDestroyed = true;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQTZELFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUEyQyxlQUFlLElBQUksY0FBYyxFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsMkJBQTJCLElBQUksMEJBQTBCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMVQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUVsQyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHdkY7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxnQkFBZ0I7SUErQzNCLGFBQWE7SUFDYixZQUFtQixZQUE2QjtRQUE3QixpQkFBWSxHQUFaLFlBQVksQ0FBaUI7UUFyQnhDLGNBQVMsR0FBWSxJQUFJLENBQUM7UUFDMUIsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFDOUIsYUFBUSxHQUFxQyxJQUFJLENBQUM7UUFDbEQsYUFBUSxHQUEwQixJQUFJLENBQUM7UUFDOUIsc0JBQWlCLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDaEYsWUFBTyxHQUFXLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdFLGdCQUFXLEdBQUcsTUFBTSxDQUFDLDBCQUEwQixFQUFFLEVBQUMsUUFBUSxFQUFF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QUFTLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBb0MsQ0FBQztJQUNuRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxpQkFBaUI7UUFDZixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDckMsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDM0MsT0FBTyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsT0FBTztRQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQzNCLENBQUM7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZiwgQ2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudFJlZiwgRGVidWdFbGVtZW50LCBFbGVtZW50UmVmLCBnZXREZWJ1Z05vZGUsIGluamVjdCwgTmdab25lLCBSZW5kZXJlckZhY3RvcnkyLCDJtURlZmVyQmxvY2tEZXRhaWxzIGFzIERlZmVyQmxvY2tEZXRhaWxzLCDJtWdldERlZmVyQmxvY2tzIGFzIGdldERlZmVyQmxvY2tzLCDJtU5vb3BOZ1pvbmUgYXMgTm9vcE5nWm9uZSwgybVab25lQXdhcmVRdWV1ZWluZ1NjaGVkdWxlciBhcyBab25lQXdhcmVRdWV1ZWluZ1NjaGVkdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7RGVmZXJCbG9ja0ZpeHR1cmV9IGZyb20gJy4vZGVmZXInO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cblxuLyoqXG4gKiBGaXh0dXJlIGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmcgYSBjb21wb25lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIC8qKlxuICAgKiBUaGUgRGVidWdFbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgY29tcG9uZW50LlxuICAgKi9cbiAgZGVidWdFbGVtZW50OiBEZWJ1Z0VsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIFRoZSBpbnN0YW5jZSBvZiB0aGUgcm9vdCBjb21wb25lbnQgY2xhc3MuXG4gICAqL1xuICBjb21wb25lbnRJbnN0YW5jZTogVDtcblxuICAvKipcbiAgICogVGhlIG5hdGl2ZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgLyoqXG4gICAqIFRoZSBFbGVtZW50UmVmIGZvciB0aGUgZWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgZWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogVGhlIENoYW5nZURldGVjdG9yUmVmIGZvciB0aGUgY29tcG9uZW50XG4gICAqL1xuICBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyRmFjdG9yeTJ8bnVsbHx1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2lzU3RhYmxlOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfaXNEZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfcmVzb2x2ZTogKChyZXN1bHQ6IGJvb2xlYW4pID0+IHZvaWQpfG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9wcm9taXNlOiBQcm9taXNlPGJvb2xlYW4+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IG5vWm9uZU9wdGlvbklzU2V0ID0gaW5qZWN0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwge29wdGlvbmFsOiB0cnVlfSk7XG4gIHByaXZhdGUgX25nWm9uZTogTmdab25lID0gdGhpcy5ub1pvbmVPcHRpb25Jc1NldCA/IG5ldyBOb29wTmdab25lKCkgOiBpbmplY3QoTmdab25lKTtcbiAgcHJpdmF0ZSBfYXV0b0RldGVjdCA9IGluamVjdChDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgZWZmZWN0UnVubmVyID0gaW5qZWN0KFpvbmVBd2FyZVF1ZXVlaW5nU2NoZWR1bGVyLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgcHJpdmF0ZSBfc3Vic2NyaXB0aW9ucyA9IG5ldyBTdWJzY3JpcHRpb24oKTtcbiAgLy8gSW5qZWN0IEFwcGxpY2F0aW9uUmVmIHRvIGVuc3VyZSBOZ1pvbmUgc3RhYmxlbmVzcyBjYXVzZXMgYWZ0ZXIgcmVuZGVyIGhvb2tzIHRvIHJ1blxuICAvLyBUaGlzIHdpbGwgbGlrZWx5IGhhcHBlbiBhcyBhIHJlc3VsdCBvZiBmaXh0dXJlLmRldGVjdENoYW5nZXMgYmVjYXVzZSBpdCBjYWxscyBuZ1pvbmUucnVuXG4gIC8vIFRoaXMgaXMgYSBjcmF6eSB3YXkgb2YgZG9pbmcgdGhpbmdzIGJ1dCBoZXksIGl0J3MgdGhlIHdvcmxkIHdlIGxpdmUgaW4uXG4gIC8vIFRoZSB6b25lbGVzcyBzY2hlZHVsZXIgc2hvdWxkIGluc3RlYWQgZG8gdGhpcyBtb3JlIGltcGVyYXRpdmVseSBieSBhdHRhY2hpbmdcbiAgLy8gdGhlIGBDb21wb25lbnRSZWZgIHRvIGBBcHBsaWNhdGlvblJlZmAgYW5kIGNhbGxpbmcgYGFwcFJlZi50aWNrYCBhcyB0aGUgYGRldGVjdENoYW5nZXNgXG4gIC8vIGJlaGF2aW9yLlxuICBwcml2YXRlIGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG5cbiAgLy8gVE9ETyhhdHNjb3R0KTogUmVtb3ZlIHRoaXMgZnJvbSBwdWJsaWMgQVBJXG4gIHB1YmxpYyBuZ1pvbmUgPSB0aGlzLm5vWm9uZU9wdGlvbklzU2V0ID8gbnVsbCA6IHRoaXMuX25nWm9uZTtcblxuICAvKiogQG5vZG9jICovXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxUPikge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBjb21wb25lbnRSZWYuY2hhbmdlRGV0ZWN0b3JSZWY7XG4gICAgdGhpcy5lbGVtZW50UmVmID0gY29tcG9uZW50UmVmLmxvY2F0aW9uO1xuICAgIHRoaXMuZGVidWdFbGVtZW50ID0gPERlYnVnRWxlbWVudD5nZXREZWJ1Z05vZGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuY29tcG9uZW50SW5zdGFuY2UgPSBjb21wb25lbnRSZWYuaW5zdGFuY2U7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSBjb21wb25lbnRSZWY7XG4gICAgdGhpcy5zZXR1cE5nWm9uZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXR1cE5nWm9uZSgpIHtcbiAgICAvLyBDcmVhdGUgc3Vic2NyaXB0aW9ucyBvdXRzaWRlIHRoZSBOZ1pvbmUgc28gdGhhdCB0aGUgY2FsbGJhY2tzIHJ1biBvdXRzaWRlXG4gICAgLy8gb2YgTmdab25lLlxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZCh0aGlzLl9uZ1pvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoe1xuICAgICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5faXNTdGFibGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fbmdab25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKHtcbiAgICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLl9hdXRvRGV0ZWN0KSB7XG4gICAgICAgICAgICAvLyBEbyBhIGNoYW5nZSBkZXRlY3Rpb24gcnVuIHdpdGggY2hlY2tOb0NoYW5nZXMgc2V0IHRvIHRydWUgdG8gY2hlY2tcbiAgICAgICAgICAgIC8vIHRoZXJlIGFyZSBubyBjaGFuZ2VzIG9uIHRoZSBzZWNvbmQgcnVuLlxuICAgICAgICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzKHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fbmdab25lLm9uU3RhYmxlLnN1YnNjcmliZSh7XG4gICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLl9pc1N0YWJsZSA9IHRydWU7XG4gICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGVyZSBpcyBhIHBlbmRpbmcgd2hlblN0YWJsZSgpIGNvbXBsZXRlciB0byByZXNvbHZlLlxuICAgICAgICAgIGlmICh0aGlzLl9wcm9taXNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBJZiBzbyBjaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvdGFza3MgYmVmb3JlIHJlc29sdmluZy5cbiAgICAgICAgICAgIC8vIERvIHRoaXMgY2hlY2sgaW4gdGhlIG5leHQgdGljayBzbyB0aGF0IG5nWm9uZSBnZXRzIGEgY2hhbmNlIHRvIHVwZGF0ZSB0aGUgc3RhdGUgb2ZcbiAgICAgICAgICAgIC8vIHBlbmRpbmcgbWFjcm90YXNrcy5cbiAgICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLl9uZ1pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSEodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLl9yZXNvbHZlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb21pc2UgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSk7XG5cbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKHRoaXMuX25nWm9uZS5vbkVycm9yLnN1YnNjcmliZSh7XG4gICAgICAgIG5leHQ6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3RpY2soY2hlY2tOb0NoYW5nZXM6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICBpZiAoY2hlY2tOb0NoYW5nZXMpIHtcbiAgICAgIHRoaXMuY2hlY2tOb0NoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgZm9yIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKGNoZWNrTm9DaGFuZ2VzOiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuZWZmZWN0UnVubmVyPy5mbHVzaCgpO1xuICAgIC8vIFJ1biB0aGUgY2hhbmdlIGRldGVjdGlvbiBpbnNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IGFueSBhc3luYyB0YXNrcyBhcyBwYXJ0IG9mIHRoZSBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24gYXJlIGNhcHR1cmVkIGJ5IHRoZSB6b25lIGFuZCBjYW4gYmUgd2FpdGVkIGZvciBpbiBpc1N0YWJsZS5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RpY2soY2hlY2tOb0NoYW5nZXMpO1xuICAgIH0pO1xuICAgIC8vIFJ1biBhbnkgZWZmZWN0cyB0aGF0IHdlcmUgY3JlYXRlZC9kaXJ0aWVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLiBTdWNoIGVmZmVjdHMgbWlnaHQgYmVjb21lXG4gICAgLy8gZGlydHkgaW4gcmVzcG9uc2UgdG8gaW5wdXQgc2lnbmFscyBjaGFuZ2luZy5cbiAgICB0aGlzLmVmZmVjdFJ1bm5lcj8uZmx1c2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEbyBhIGNoYW5nZSBkZXRlY3Rpb24gcnVuIHRvIG1ha2Ugc3VyZSB0aGVyZSB3ZXJlIG5vIGNoYW5nZXMuXG4gICAqL1xuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLmNoZWNrTm9DaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHdoZXRoZXIgdGhlIGZpeHR1cmUgc2hvdWxkIGF1dG9kZXRlY3QgY2hhbmdlcy5cbiAgICpcbiAgICogQWxzbyBydW5zIGRldGVjdENoYW5nZXMgb25jZSBzbyB0aGF0IGFueSBleGlzdGluZyBjaGFuZ2UgaXMgZGV0ZWN0ZWQuXG4gICAqL1xuICBhdXRvRGV0ZWN0Q2hhbmdlcyhhdXRvRGV0ZWN0OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLm5vWm9uZU9wdGlvbklzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGF1dG9EZXRlY3RDaGFuZ2VzIHdoZW4gQ29tcG9uZW50Rml4dHVyZU5vTmdab25lIGlzIHNldCcpO1xuICAgIH1cbiAgICB0aGlzLl9hdXRvRGV0ZWN0ID0gYXV0b0RldGVjdDtcbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGUgZml4dHVyZSBpcyBjdXJyZW50bHkgc3RhYmxlIG9yIGhhcyBhc3luYyB0YXNrcyB0aGF0IGhhdmUgbm90IGJlZW4gY29tcGxldGVkXG4gICAqIHlldC5cbiAgICovXG4gIGlzU3RhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc1N0YWJsZSAmJiAhdGhpcy5fbmdab25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBmaXh0dXJlIGlzIHN0YWJsZS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byByZXN1bWUgdGVzdGluZyBhZnRlciBldmVudHMgaGF2ZSB0cmlnZ2VyZWQgYXN5bmNocm9ub3VzIGFjdGl2aXR5IG9yXG4gICAqIGFzeW5jaHJvbm91cyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgd2hlblN0YWJsZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLmlzU3RhYmxlKCkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZShyZXMgPT4ge1xuICAgICAgICB0aGlzLl9yZXNvbHZlID0gcmVzO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBkZWZlciBibG9jayBmaXh0dXJlcyBpbiB0aGUgY29tcG9uZW50IGZpeHR1cmUuXG4gICAqXG4gICAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gICAqL1xuICBnZXREZWZlckJsb2NrcygpOiBQcm9taXNlPERlZmVyQmxvY2tGaXh0dXJlW10+IHtcbiAgICBjb25zdCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSA9IFtdO1xuICAgIGNvbnN0IGxWaWV3ID0gKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIGFueSlbJ19sVmlldyddO1xuICAgIGdldERlZmVyQmxvY2tzKGxWaWV3LCBkZWZlckJsb2Nrcyk7XG5cbiAgICBjb25zdCBkZWZlckJsb2NrRml4dHVyZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGRlZmVyQmxvY2tzKSB7XG4gICAgICBkZWZlckJsb2NrRml4dHVyZXMucHVzaChuZXcgRGVmZXJCbG9ja0ZpeHR1cmUoYmxvY2ssIHRoaXMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRlZmVyQmxvY2tGaXh0dXJlcyk7XG4gIH1cblxuXG4gIHByaXZhdGUgX2dldFJlbmRlcmVyKCkge1xuICAgIGlmICh0aGlzLl9yZW5kZXJlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlciA9IHRoaXMuY29tcG9uZW50UmVmLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyLCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyIGFzIFJlbmRlcmVyRmFjdG9yeTIgfCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSB1aSBzdGF0ZSBpcyBzdGFibGUgZm9sbG93aW5nIGFuaW1hdGlvbnMuXG4gICAqL1xuICB3aGVuUmVuZGVyaW5nRG9uZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdGhpcy5fZ2V0UmVuZGVyZXIoKTtcbiAgICBpZiAocmVuZGVyZXIgJiYgcmVuZGVyZXIud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiByZW5kZXJlci53aGVuUmVuZGVyaW5nRG9uZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy53aGVuU3RhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBjb21wb25lbnQgZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNEZXN0cm95ZWQpIHtcbiAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMudW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMuX2lzRGVzdHJveWVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==