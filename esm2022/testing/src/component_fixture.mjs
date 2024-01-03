/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getDebugNode, inject, NgZone, RendererFactory2, ɵgetDeferBlocks as getDeferBlocks, ɵNoopNgZone as NoopNgZone, ɵZoneAwareQueueingScheduler as ZoneAwareQueueingScheduler } from '@angular/core';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBNEQsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQTJDLGVBQWUsSUFBSSxjQUFjLEVBQUUsV0FBVyxJQUFJLFVBQVUsRUFBRSwyQkFBMkIsSUFBSSwwQkFBMEIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMxUyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUd2Rjs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQXdDM0IsYUFBYTtJQUNiLFlBQW1CLFlBQTZCO1FBQTdCLGlCQUFZLEdBQVosWUFBWSxDQUFpQjtRQWR4QyxjQUFTLEdBQVksSUFBSSxDQUFDO1FBQzFCLGlCQUFZLEdBQVksS0FBSyxDQUFDO1FBQzlCLGFBQVEsR0FBcUMsSUFBSSxDQUFDO1FBQ2xELGFBQVEsR0FBMEIsSUFBSSxDQUFDO1FBQzlCLHNCQUFpQixHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBQ2hGLFlBQU8sR0FBVyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3RSxnQkFBVyxHQUFHLE1BQU0sQ0FBQywwQkFBMEIsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMs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SSxRQUFRLElBQUksUUFBUSxDQUFDLGlCQUFpQixFQUFFO1lBQzFDLE9BQU8sUUFBUSxDQUFDLGlCQUFpQixFQUFFLENBQUM7U0FDckM7UUFDRCxPQUFPLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxPQUFPO1FBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDdEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1NBQzFCO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYsIENvbXBvbmVudFJlZiwgRGVidWdFbGVtZW50LCBFbGVtZW50UmVmLCBnZXREZWJ1Z05vZGUsIGluamVjdCwgTmdab25lLCBSZW5kZXJlckZhY3RvcnkyLCDJtURlZmVyQmxvY2tEZXRhaWxzIGFzIERlZmVyQmxvY2tEZXRhaWxzLCDJtWdldERlZmVyQmxvY2tzIGFzIGdldERlZmVyQmxvY2tzLCDJtU5vb3BOZ1pvbmUgYXMgTm9vcE5nWm9uZSwgybVab25lQXdhcmVRdWV1ZWluZ1NjaGVkdWxlciBhcyBab25lQXdhcmVRdWV1ZWluZ1NjaGVkdWxlcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7RGVmZXJCbG9ja0ZpeHR1cmV9IGZyb20gJy4vZGVmZXInO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cblxuLyoqXG4gKiBGaXh0dXJlIGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmcgYSBjb21wb25lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIC8qKlxuICAgKiBUaGUgRGVidWdFbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgY29tcG9uZW50LlxuICAgKi9cbiAgZGVidWdFbGVtZW50OiBEZWJ1Z0VsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIFRoZSBpbnN0YW5jZSBvZiB0aGUgcm9vdCBjb21wb25lbnQgY2xhc3MuXG4gICAqL1xuICBjb21wb25lbnRJbnN0YW5jZTogVDtcblxuICAvKipcbiAgICogVGhlIG5hdGl2ZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgLyoqXG4gICAqIFRoZSBFbGVtZW50UmVmIGZvciB0aGUgZWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgZWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogVGhlIENoYW5nZURldGVjdG9yUmVmIGZvciB0aGUgY29tcG9uZW50XG4gICAqL1xuICBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyRmFjdG9yeTJ8bnVsbHx1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2lzU3RhYmxlOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfaXNEZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfcmVzb2x2ZTogKChyZXN1bHQ6IGJvb2xlYW4pID0+IHZvaWQpfG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9wcm9taXNlOiBQcm9taXNlPGJvb2xlYW4+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IG5vWm9uZU9wdGlvbklzU2V0ID0gaW5qZWN0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwge29wdGlvbmFsOiB0cnVlfSk7XG4gIHByaXZhdGUgX25nWm9uZTogTmdab25lID0gdGhpcy5ub1pvbmVPcHRpb25Jc1NldCA/IG5ldyBOb29wTmdab25lKCkgOiBpbmplY3QoTmdab25lKTtcbiAgcHJpdmF0ZSBfYXV0b0RldGVjdCA9IGluamVjdChDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgZWZmZWN0UnVubmVyID0gaW5qZWN0KFpvbmVBd2FyZVF1ZXVlaW5nU2NoZWR1bGVyLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgcHJpdmF0ZSBfc3Vic2NyaXB0aW9ucyA9IG5ldyBTdWJzY3JpcHRpb24oKTtcblxuICAvLyBUT0RPKGF0c2NvdHQpOiBSZW1vdmUgdGhpcyBmcm9tIHB1YmxpYyBBUElcbiAgcHVibGljIG5nWm9uZSA9IHRoaXMubm9ab25lT3B0aW9uSXNTZXQgPyBudWxsIDogdGhpcy5fbmdab25lO1xuXG4gIC8qKiBAbm9kb2MgKi9cbiAgY29uc3RydWN0b3IocHVibGljIGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPFQ+KSB7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IGNvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZjtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBjb21wb25lbnRSZWYubG9jYXRpb247XG4gICAgdGhpcy5kZWJ1Z0VsZW1lbnQgPSA8RGVidWdFbGVtZW50PmdldERlYnVnTm9kZSh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgdGhpcy5jb21wb25lbnRJbnN0YW5jZSA9IGNvbXBvbmVudFJlZi5pbnN0YW5jZTtcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IGNvbXBvbmVudFJlZjtcbiAgICB0aGlzLnNldHVwTmdab25lKCk7XG4gIH1cblxuICBwcml2YXRlIHNldHVwTmdab25lKCkge1xuICAgIC8vIENyZWF0ZSBzdWJzY3JpcHRpb25zIG91dHNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IHRoZSBjYWxsYmFja3MgcnVuIG91dHNpZGVcbiAgICAvLyBvZiBOZ1pvbmUuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKHRoaXMuX25nWm9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSh7XG4gICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLl9pc1N0YWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZCh0aGlzLl9uZ1pvbmUub25NaWNyb3Rhc2tFbXB0eS5zdWJzY3JpYmUoe1xuICAgICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuX2F1dG9EZXRlY3QpIHtcbiAgICAgICAgICAgIC8vIERvIGEgY2hhbmdlIGRldGVjdGlvbiBydW4gd2l0aCBjaGVja05vQ2hhbmdlcyBzZXQgdG8gdHJ1ZSB0byBjaGVja1xuICAgICAgICAgICAgLy8gdGhlcmUgYXJlIG5vIGNoYW5nZXMgb24gdGhlIHNlY29uZCBydW4uXG4gICAgICAgICAgICB0aGlzLmRldGVjdENoYW5nZXModHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZCh0aGlzLl9uZ1pvbmUub25TdGFibGUuc3Vic2NyaWJlKHtcbiAgICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX2lzU3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZXJlIGlzIGEgcGVuZGluZyB3aGVuU3RhYmxlKCkgY29tcGxldGVyIHRvIHJlc29sdmUuXG4gICAgICAgICAgaWYgKHRoaXMuX3Byb21pc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIElmIHNvIGNoZWNrIHdoZXRoZXIgdGhlcmUgYXJlIG5vIHBlbmRpbmcgbWFjcm90YXNrcyBiZWZvcmUgcmVzb2x2aW5nLlxuICAgICAgICAgICAgLy8gRG8gdGhpcyBjaGVjayBpbiB0aGUgbmV4dCB0aWNrIHNvIHRoYXQgbmdab25lIGdldHMgYSBjaGFuY2UgdG8gdXBkYXRlIHRoZSBzdGF0ZSBvZlxuICAgICAgICAgICAgLy8gcGVuZGluZyBtYWNyb3Rhc2tzLlxuICAgICAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIXRoaXMuX25nWm9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wcm9taXNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLl9yZXNvbHZlISh0cnVlKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pKTtcblxuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fbmdab25lLm9uRXJyb3Iuc3Vic2NyaWJlKHtcbiAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfdGljayhjaGVja05vQ2hhbmdlczogYm9vbGVhbikge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGlmIChjaGVja05vQ2hhbmdlcykge1xuICAgICAgdGhpcy5jaGVja05vQ2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGEgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSBmb3IgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGRldGVjdENoYW5nZXMoY2hlY2tOb0NoYW5nZXM6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgdGhpcy5lZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG4gICAgLy8gUnVuIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGluc2lkZSB0aGUgTmdab25lIHNvIHRoYXQgYW55IGFzeW5jIHRhc2tzIGFzIHBhcnQgb2YgdGhlIGNoYW5nZVxuICAgIC8vIGRldGVjdGlvbiBhcmUgY2FwdHVyZWQgYnkgdGhlIHpvbmUgYW5kIGNhbiBiZSB3YWl0ZWQgZm9yIGluIGlzU3RhYmxlLlxuICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgdGhpcy5fdGljayhjaGVja05vQ2hhbmdlcyk7XG4gICAgfSk7XG4gICAgLy8gUnVuIGFueSBlZmZlY3RzIHRoYXQgd2VyZSBjcmVhdGVkL2RpcnRpZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24uIFN1Y2ggZWZmZWN0cyBtaWdodCBiZWNvbWVcbiAgICAvLyBkaXJ0eSBpbiByZXNwb25zZSB0byBpbnB1dCBzaWduYWxzIGNoYW5naW5nLlxuICAgIHRoaXMuZWZmZWN0UnVubmVyPy5mbHVzaCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIERvIGEgY2hhbmdlIGRldGVjdGlvbiBydW4gdG8gbWFrZSBzdXJlIHRoZXJlIHdlcmUgbm8gY2hhbmdlcy5cbiAgICovXG4gIGNoZWNrTm9DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgd2hldGhlciB0aGUgZml4dHVyZSBzaG91bGQgYXV0b2RldGVjdCBjaGFuZ2VzLlxuICAgKlxuICAgKiBBbHNvIHJ1bnMgZGV0ZWN0Q2hhbmdlcyBvbmNlIHNvIHRoYXQgYW55IGV4aXN0aW5nIGNoYW5nZSBpcyBkZXRlY3RlZC5cbiAgICovXG4gIGF1dG9EZXRlY3RDaGFuZ2VzKGF1dG9EZXRlY3Q6IGJvb2xlYW4gPSB0cnVlKSB7XG4gICAgaWYgKHRoaXMubm9ab25lT3B0aW9uSXNTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNhbGwgYXV0b0RldGVjdENoYW5nZXMgd2hlbiBDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUgaXMgc2V0Jyk7XG4gICAgfVxuICAgIHRoaXMuX2F1dG9EZXRlY3QgPSBhdXRvRGV0ZWN0O1xuICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoZSBmaXh0dXJlIGlzIGN1cnJlbnRseSBzdGFibGUgb3IgaGFzIGFzeW5jIHRhc2tzIHRoYXQgaGF2ZSBub3QgYmVlbiBjb21wbGV0ZWRcbiAgICogeWV0LlxuICAgKi9cbiAgaXNTdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzU3RhYmxlICYmICF0aGlzLl9uZ1pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3M7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGZpeHR1cmUgaXMgc3RhYmxlLlxuICAgKlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIHJlc3VtZSB0ZXN0aW5nIGFmdGVyIGV2ZW50cyBoYXZlIHRyaWdnZXJlZCBhc3luY2hyb25vdXMgYWN0aXZpdHkgb3JcbiAgICogYXN5bmNocm9ub3VzIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqL1xuICB3aGVuU3RhYmxlKCk6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMuaXNTdGFibGUoKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9wcm9taXNlICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlcyA9PiB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmUgPSByZXM7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYWxsIGRlZmVyIGJsb2NrIGZpeHR1cmVzIGluIHRoZSBjb21wb25lbnQgZml4dHVyZS5cbiAgICpcbiAgICogQGRldmVsb3BlclByZXZpZXdcbiAgICovXG4gIGdldERlZmVyQmxvY2tzKCk6IFByb21pc2U8RGVmZXJCbG9ja0ZpeHR1cmVbXT4ge1xuICAgIGNvbnN0IGRlZmVyQmxvY2tzOiBEZWZlckJsb2NrRGV0YWlsc1tdID0gW107XG4gICAgY29uc3QgbFZpZXcgPSAodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgYW55KVsnX2xWaWV3J107XG4gICAgZ2V0RGVmZXJCbG9ja3MobFZpZXcsIGRlZmVyQmxvY2tzKTtcblxuICAgIGNvbnN0IGRlZmVyQmxvY2tGaXh0dXJlcyA9IFtdO1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgZGVmZXJCbG9ja3MpIHtcbiAgICAgIGRlZmVyQmxvY2tGaXh0dXJlcy5wdXNoKG5ldyBEZWZlckJsb2NrRml4dHVyZShibG9jaywgdGhpcykpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGVmZXJCbG9ja0ZpeHR1cmVzKTtcbiAgfVxuXG5cbiAgcHJpdmF0ZSBfZ2V0UmVuZGVyZXIoKSB7XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyID0gdGhpcy5jb21wb25lbnRSZWYuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZXIgYXMgUmVuZGVyZXJGYWN0b3J5MiB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHVpIHN0YXRlIGlzIHN0YWJsZSBmb2xsb3dpbmcgYW5pbWF0aW9ucy5cbiAgICovXG4gIHdoZW5SZW5kZXJpbmdEb25lKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSB0aGlzLl9nZXRSZW5kZXJlcigpO1xuICAgIGlmIChyZW5kZXJlciAmJiByZW5kZXJlci53aGVuUmVuZGVyaW5nRG9uZSkge1xuICAgICAgcmV0dXJuIHJlbmRlcmVyLndoZW5SZW5kZXJpbmdEb25lKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLndoZW5TdGFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGNvbXBvbmVudCBkZXN0cnVjdGlvbi5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc0Rlc3Ryb3llZCkge1xuICAgICAgdGhpcy5jb21wb25lbnRSZWYuZGVzdHJveSgpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5faXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxufVxuIl19