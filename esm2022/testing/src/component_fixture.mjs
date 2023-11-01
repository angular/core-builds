/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getDebugNode, RendererFactory2, ɵgetDeferBlocks as getDeferBlocks } from '@angular/core';
import { DeferBlockFixture } from './defer';
/**
 * Fixture for debugging and testing a component.
 *
 * @publicApi
 */
export class ComponentFixture {
    /** @nodoc */
    constructor(componentRef, ngZone, effectRunner, _autoDetect) {
        this.componentRef = componentRef;
        this.ngZone = ngZone;
        this.effectRunner = effectRunner;
        this._autoDetect = _autoDetect;
        this._isStable = true;
        this._isDestroyed = false;
        this._resolve = null;
        this._promise = null;
        this._onUnstableSubscription = null;
        this._onStableSubscription = null;
        this._onMicrotaskEmptySubscription = null;
        this._onErrorSubscription = null;
        this.changeDetectorRef = componentRef.changeDetectorRef;
        this.elementRef = componentRef.location;
        this.debugElement = getDebugNode(this.elementRef.nativeElement);
        this.componentInstance = componentRef.instance;
        this.nativeElement = this.elementRef.nativeElement;
        this.componentRef = componentRef;
        this.ngZone = ngZone;
        if (ngZone) {
            // Create subscriptions outside the NgZone so that the callbacks run oustide
            // of NgZone.
            ngZone.runOutsideAngular(() => {
                this._onUnstableSubscription = ngZone.onUnstable.subscribe({
                    next: () => {
                        this._isStable = false;
                    }
                });
                this._onMicrotaskEmptySubscription = ngZone.onMicrotaskEmpty.subscribe({
                    next: () => {
                        if (this._autoDetect) {
                            // Do a change detection run with checkNoChanges set to true to check
                            // there are no changes on the second run.
                            this.detectChanges(true);
                        }
                    }
                });
                this._onStableSubscription = ngZone.onStable.subscribe({
                    next: () => {
                        this._isStable = true;
                        // Check whether there is a pending whenStable() completer to resolve.
                        if (this._promise !== null) {
                            // If so check whether there are no pending macrotasks before resolving.
                            // Do this check in the next tick so that ngZone gets a chance to update the state of
                            // pending macrotasks.
                            queueMicrotask(() => {
                                if (!ngZone.hasPendingMacrotasks) {
                                    if (this._promise !== null) {
                                        this._resolve(true);
                                        this._resolve = null;
                                        this._promise = null;
                                    }
                                }
                            });
                        }
                    }
                });
                this._onErrorSubscription = ngZone.onError.subscribe({
                    next: (error) => {
                        throw error;
                    }
                });
            });
        }
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
        if (this.ngZone != null) {
            // Run the change detection inside the NgZone so that any async tasks as part of the change
            // detection are captured by the zone and can be waited for in isStable.
            this.ngZone.run(() => {
                this._tick(checkNoChanges);
            });
        }
        else {
            // Running without zone. Just do the change detection.
            this._tick(checkNoChanges);
        }
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
        if (this.ngZone == null) {
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
        return this._isStable && !this.ngZone.hasPendingMacrotasks;
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
        const lView = this.componentRef.hostView._lView;
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
            if (this._onUnstableSubscription != null) {
                this._onUnstableSubscription.unsubscribe();
                this._onUnstableSubscription = null;
            }
            if (this._onStableSubscription != null) {
                this._onStableSubscription.unsubscribe();
                this._onStableSubscription = null;
            }
            if (this._onMicrotaskEmptySubscription != null) {
                this._onMicrotaskEmptySubscription.unsubscribe();
                this._onMicrotaskEmptySubscription = null;
            }
            if (this._onErrorSubscription != null) {
                this._onErrorSubscription.unsubscribe();
                this._onErrorSubscription = null;
            }
            this._isDestroyed = true;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBNEQsWUFBWSxFQUFVLGdCQUFnQixFQUE0RixlQUFlLElBQUksY0FBYyxFQUFzQyxNQUFNLGVBQWUsQ0FBQztBQUdsUyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHMUM7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxnQkFBZ0I7SUFvQzNCLGFBQWE7SUFDYixZQUNXLFlBQTZCLEVBQVMsTUFBbUIsRUFDeEQsWUFBd0MsRUFBVSxXQUFvQjtRQUR2RSxpQkFBWSxHQUFaLFlBQVksQ0FBaUI7UUFBUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1FBQ3hELGlCQUFZLEdBQVosWUFBWSxDQUE0QjtRQUFVLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1FBWjFFLGNBQVMsR0FBWSxJQUFJLENBQUM7UUFDMUIsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFDOUIsYUFBUSxHQUFxQyxJQUFJLENBQUM7UUFDbEQsYUFBUSxHQUEwQixJQUFJLENBQUM7UUFDdkMsNEJBQXVCLEdBQXNCLElBQUksQ0FBQztRQUNsRCwwQkFBcUIsR0FBc0IsSUFBSSxDQUFDO1FBQ2hELGtDQUE2QixHQUFzQixJQUFJLENBQUM7UUFDeEQseUJBQW9CLEdBQXNCLElBQUksQ0FBQztRQU1yRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFDO1FBQ3hELElBQUksQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztRQUN4QyxJQUFJLENBQUMsWUFBWSxHQUFpQixZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5RSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztRQUMvQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1FBQ25ELElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXJCLElBQUksTUFBTSxFQUFFO1lBQ1YsNEVBQTRFO1lBQzVFLGFBQWE7WUFDYixNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUM1QixJQUFJLENBQUMsdUJBQXVCLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7b0JBQ3pELElBQUksRUFBRSxHQUFHLEVBQUU7d0JBQ1QsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7b0JBQ3pCLENBQUM7aUJBQ0YsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyw2QkFBNkIsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDO29CQUNyRSxJQUFJLEVBQUUsR0FBRyxFQUFFO3dCQUNULElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTs0QkFDcEIscUVBQXFFOzRCQUNyRSwwQ0FBMEM7NEJBQzFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQzFCO29CQUNILENBQUM7aUJBQ0YsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxxQkFBcUIsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztvQkFDckQsSUFBSSxFQUFFLEdBQUcsRUFBRTt3QkFDVCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQzt3QkFDdEIsc0VBQXNFO3dCQUN0RSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFOzRCQUMxQix3RUFBd0U7NEJBQ3hFLHFGQUFxRjs0QkFDckYsc0JBQXNCOzRCQUN0QixjQUFjLENBQUMsR0FBRyxFQUFFO2dDQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFO29DQUNoQyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFO3dDQUMxQixJQUFJLENBQUMsUUFBUyxDQUFDLElBQUksQ0FBQyxDQUFDO3dDQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzt3Q0FDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7cUNBQ3RCO2lDQUNGOzRCQUNILENBQUMsQ0FBQyxDQUFDO3lCQUNKO29CQUNILENBQUM7aUJBQ0YsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxvQkFBb0IsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztvQkFDbkQsSUFBSSxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUU7d0JBQ25CLE1BQU0sS0FBSyxDQUFDO29CQUNkLENBQUM7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7SUFFTyxLQUFLLENBQUMsY0FBdUI7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3ZDLElBQUksY0FBYyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztTQUN2QjtJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILGFBQWEsQ0FBQyxpQkFBMEIsSUFBSTtRQUMxQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQzNCLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUU7WUFDdkIsMkZBQTJGO1lBQzNGLHdFQUF3RTtZQUN4RSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsc0RBQXNEO1lBQ3RELElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDNUI7UUFDRCwrRkFBK0Y7UUFDL0YsK0NBQStDO1FBQy9DLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsY0FBYztRQUNaLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGlCQUFpQixDQUFDLGFBQXNCLElBQUk7UUFDMUMsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRTtZQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLG9FQUFvRSxDQUFDLENBQUM7U0FDdkY7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7T0FHRztJQUNILFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTyxDQUFDLG9CQUFvQixDQUFDO0lBQzlELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFVBQVU7UUFDUixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNuQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0I7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFO1lBQ2pDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztTQUN0QjthQUFNO1lBQ0wsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUM7WUFDdEIsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7U0FDdEI7SUFDSCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGNBQWM7UUFDWixNQUFNLFdBQVcsR0FBd0IsRUFBRSxDQUFDO1FBQzVDLE1BQU0sS0FBSyxHQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBcUMsQ0FBQyxNQUFNLENBQUM7UUFDOUUsY0FBYyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVuQyxNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztRQUM5QixLQUFLLE1BQU0sS0FBSyxJQUFJLFdBQVcsRUFBRTtZQUMvQixrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUM3RDtRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFHTyxZQUFZO1FBQ2xCLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDaEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDekU7UUFDRCxPQUFPLElBQUksQ0FBQyxTQUFvQyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7T0FFRztJQUNILGlCQUFpQjtRQUNmLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNyQyxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsaUJBQWlCLEVBQUU7WUFDMUMsT0FBTyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztTQUNyQztRQUNELE9BQU8sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRDs7T0FFRztJQUNILE9BQU87UUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUN0QixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUksSUFBSSxDQUFDLHVCQUF1QixJQUFJLElBQUksRUFBRTtnQkFDeEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDO2FBQ3JDO1lBQ0QsSUFBSSxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxFQUFFO2dCQUN0QyxJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7YUFDbkM7WUFDRCxJQUFJLElBQUksQ0FBQyw2QkFBNkIsSUFBSSxJQUFJLEVBQUU7Z0JBQzlDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLDZCQUE2QixHQUFHLElBQUksQ0FBQzthQUMzQztZQUNELElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksRUFBRTtnQkFDckMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO2FBQ2xDO1lBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7U0FDMUI7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50UmVmLCBEZWJ1Z0VsZW1lbnQsIEVsZW1lbnRSZWYsIGdldERlYnVnTm9kZSwgTmdab25lLCBSZW5kZXJlckZhY3RvcnkyLCDJtURlZmVyQmxvY2tEZXRhaWxzIGFzIERlZmVyQmxvY2tEZXRhaWxzLCDJtUZsdXNoYWJsZUVmZmVjdFJ1bm5lciBhcyBGbHVzaGFibGVFZmZlY3RSdW5uZXIsIMm1Z2V0RGVmZXJCbG9ja3MgYXMgZ2V0RGVmZXJCbG9ja3MsIMm1SW50ZXJuYWxWaWV3UmVmIGFzIEludGVybmFsVmlld1JlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7RGVmZXJCbG9ja0ZpeHR1cmV9IGZyb20gJy4vZGVmZXInO1xuXG5cbi8qKlxuICogRml4dHVyZSBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nIGEgY29tcG9uZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAvKipcbiAgICogVGhlIERlYnVnRWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhlIHJvb3QgZWxlbWVudCBvZiB0aGlzIGNvbXBvbmVudC5cbiAgICovXG4gIGRlYnVnRWxlbWVudDogRGVidWdFbGVtZW50O1xuXG4gIC8qKlxuICAgKiBUaGUgaW5zdGFuY2Ugb2YgdGhlIHJvb3QgY29tcG9uZW50IGNsYXNzLlxuICAgKi9cbiAgY29tcG9uZW50SW5zdGFuY2U6IFQ7XG5cbiAgLyoqXG4gICAqIFRoZSBuYXRpdmUgZWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgbmF0aXZlRWxlbWVudDogYW55O1xuXG4gIC8qKlxuICAgKiBUaGUgRWxlbWVudFJlZiBmb3IgdGhlIGVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiBmb3IgdGhlIGNvbXBvbmVudFxuICAgKi9cbiAgY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmO1xuXG4gIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlckZhY3RvcnkyfG51bGx8dW5kZWZpbmVkO1xuICBwcml2YXRlIF9pc1N0YWJsZTogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgX2lzRGVzdHJveWVkOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX3Jlc29sdmU6ICgocmVzdWx0OiBib29sZWFuKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfcHJvbWlzZTogUHJvbWlzZTxib29sZWFuPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfb25VbnN0YWJsZVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9vblN0YWJsZVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX29uRXJyb3JTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnxudWxsID0gbnVsbDtcblxuICAvKiogQG5vZG9jICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPFQ+LCBwdWJsaWMgbmdab25lOiBOZ1pvbmV8bnVsbCxcbiAgICAgIHByaXZhdGUgZWZmZWN0UnVubmVyOiBGbHVzaGFibGVFZmZlY3RSdW5uZXJ8bnVsbCwgcHJpdmF0ZSBfYXV0b0RldGVjdDogYm9vbGVhbikge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYgPSBjb21wb25lbnRSZWYuY2hhbmdlRGV0ZWN0b3JSZWY7XG4gICAgdGhpcy5lbGVtZW50UmVmID0gY29tcG9uZW50UmVmLmxvY2F0aW9uO1xuICAgIHRoaXMuZGVidWdFbGVtZW50ID0gPERlYnVnRWxlbWVudD5nZXREZWJ1Z05vZGUodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgIHRoaXMuY29tcG9uZW50SW5zdGFuY2UgPSBjb21wb25lbnRSZWYuaW5zdGFuY2U7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgdGhpcy5jb21wb25lbnRSZWYgPSBjb21wb25lbnRSZWY7XG4gICAgdGhpcy5uZ1pvbmUgPSBuZ1pvbmU7XG5cbiAgICBpZiAobmdab25lKSB7XG4gICAgICAvLyBDcmVhdGUgc3Vic2NyaXB0aW9ucyBvdXRzaWRlIHRoZSBOZ1pvbmUgc28gdGhhdCB0aGUgY2FsbGJhY2tzIHJ1biBvdXN0aWRlXG4gICAgICAvLyBvZiBOZ1pvbmUuXG4gICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICB0aGlzLl9vblVuc3RhYmxlU3Vic2NyaXB0aW9uID0gbmdab25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKHtcbiAgICAgICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pc1N0YWJsZSA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24gPSBuZ1pvbmUub25NaWNyb3Rhc2tFbXB0eS5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hdXRvRGV0ZWN0KSB7XG4gICAgICAgICAgICAgIC8vIERvIGEgY2hhbmdlIGRldGVjdGlvbiBydW4gd2l0aCBjaGVja05vQ2hhbmdlcyBzZXQgdG8gdHJ1ZSB0byBjaGVja1xuICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgbm8gY2hhbmdlcyBvbiB0aGUgc2Vjb25kIHJ1bi5cbiAgICAgICAgICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzKHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX29uU3RhYmxlU3Vic2NyaXB0aW9uID0gbmdab25lLm9uU3RhYmxlLnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5faXNTdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGVyZSBpcyBhIHBlbmRpbmcgd2hlblN0YWJsZSgpIGNvbXBsZXRlciB0byByZXNvbHZlLlxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb21pc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgLy8gSWYgc28gY2hlY2sgd2hldGhlciB0aGVyZSBhcmUgbm8gcGVuZGluZyBtYWNyb3Rhc2tzIGJlZm9yZSByZXNvbHZpbmcuXG4gICAgICAgICAgICAgIC8vIERvIHRoaXMgY2hlY2sgaW4gdGhlIG5leHQgdGljayBzbyB0aGF0IG5nWm9uZSBnZXRzIGEgY2hhbmNlIHRvIHVwZGF0ZSB0aGUgc3RhdGUgb2ZcbiAgICAgICAgICAgICAgLy8gcGVuZGluZyBtYWNyb3Rhc2tzLlxuICAgICAgICAgICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFuZ1pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wcm9taXNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUhKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNvbHZlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX29uRXJyb3JTdWJzY3JpcHRpb24gPSBuZ1pvbmUub25FcnJvci5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdGljayhjaGVja05vQ2hhbmdlczogYm9vbGVhbikge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGlmIChjaGVja05vQ2hhbmdlcykge1xuICAgICAgdGhpcy5jaGVja05vQ2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGEgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSBmb3IgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGRldGVjdENoYW5nZXMoY2hlY2tOb0NoYW5nZXM6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgdGhpcy5lZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG4gICAgaWYgKHRoaXMubmdab25lICE9IG51bGwpIHtcbiAgICAgIC8vIFJ1biB0aGUgY2hhbmdlIGRldGVjdGlvbiBpbnNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IGFueSBhc3luYyB0YXNrcyBhcyBwYXJ0IG9mIHRoZSBjaGFuZ2VcbiAgICAgIC8vIGRldGVjdGlvbiBhcmUgY2FwdHVyZWQgYnkgdGhlIHpvbmUgYW5kIGNhbiBiZSB3YWl0ZWQgZm9yIGluIGlzU3RhYmxlLlxuICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5fdGljayhjaGVja05vQ2hhbmdlcyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUnVubmluZyB3aXRob3V0IHpvbmUuIEp1c3QgZG8gdGhlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgICB0aGlzLl90aWNrKGNoZWNrTm9DaGFuZ2VzKTtcbiAgICB9XG4gICAgLy8gUnVuIGFueSBlZmZlY3RzIHRoYXQgd2VyZSBjcmVhdGVkL2RpcnRpZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24uIFN1Y2ggZWZmZWN0cyBtaWdodCBiZWNvbWVcbiAgICAvLyBkaXJ0eSBpbiByZXNwb25zZSB0byBpbnB1dCBzaWduYWxzIGNoYW5naW5nLlxuICAgIHRoaXMuZWZmZWN0UnVubmVyPy5mbHVzaCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIERvIGEgY2hhbmdlIGRldGVjdGlvbiBydW4gdG8gbWFrZSBzdXJlIHRoZXJlIHdlcmUgbm8gY2hhbmdlcy5cbiAgICovXG4gIGNoZWNrTm9DaGFuZ2VzKCk6IHZvaWQge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgd2hldGhlciB0aGUgZml4dHVyZSBzaG91bGQgYXV0b2RldGVjdCBjaGFuZ2VzLlxuICAgKlxuICAgKiBBbHNvIHJ1bnMgZGV0ZWN0Q2hhbmdlcyBvbmNlIHNvIHRoYXQgYW55IGV4aXN0aW5nIGNoYW5nZSBpcyBkZXRlY3RlZC5cbiAgICovXG4gIGF1dG9EZXRlY3RDaGFuZ2VzKGF1dG9EZXRlY3Q6IGJvb2xlYW4gPSB0cnVlKSB7XG4gICAgaWYgKHRoaXMubmdab25lID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNhbGwgYXV0b0RldGVjdENoYW5nZXMgd2hlbiBDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUgaXMgc2V0Jyk7XG4gICAgfVxuICAgIHRoaXMuX2F1dG9EZXRlY3QgPSBhdXRvRGV0ZWN0O1xuICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoZSBmaXh0dXJlIGlzIGN1cnJlbnRseSBzdGFibGUgb3IgaGFzIGFzeW5jIHRhc2tzIHRoYXQgaGF2ZSBub3QgYmVlbiBjb21wbGV0ZWRcbiAgICogeWV0LlxuICAgKi9cbiAgaXNTdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzU3RhYmxlICYmICF0aGlzLm5nWm9uZSEuaGFzUGVuZGluZ01hY3JvdGFza3M7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGZpeHR1cmUgaXMgc3RhYmxlLlxuICAgKlxuICAgKiBUaGlzIGNhbiBiZSB1c2VkIHRvIHJlc3VtZSB0ZXN0aW5nIGFmdGVyIGV2ZW50cyBoYXZlIHRyaWdnZXJlZCBhc3luY2hyb25vdXMgYWN0aXZpdHkgb3JcbiAgICogYXN5bmNocm9ub3VzIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqL1xuICB3aGVuU3RhYmxlKCk6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMuaXNTdGFibGUoKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9wcm9taXNlICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlcyA9PiB7XG4gICAgICAgIHRoaXMuX3Jlc29sdmUgPSByZXM7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYWxsIGRlZmVyIGJsb2NrIGZpeHR1cmVzIGluIHRoZSBjb21wb25lbnQgZml4dHVyZS5cbiAgICpcbiAgICogQGRldmVsb3BlclByZXZpZXdcbiAgICovXG4gIGdldERlZmVyQmxvY2tzKCk6IFByb21pc2U8RGVmZXJCbG9ja0ZpeHR1cmVbXT4ge1xuICAgIGNvbnN0IGRlZmVyQmxvY2tzOiBEZWZlckJsb2NrRGV0YWlsc1tdID0gW107XG4gICAgY29uc3QgbFZpZXcgPSAodGhpcy5jb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgSW50ZXJuYWxWaWV3UmVmPHVua25vd24+KS5fbFZpZXc7XG4gICAgZ2V0RGVmZXJCbG9ja3MobFZpZXcsIGRlZmVyQmxvY2tzKTtcblxuICAgIGNvbnN0IGRlZmVyQmxvY2tGaXh0dXJlcyA9IFtdO1xuICAgIGZvciAoY29uc3QgYmxvY2sgb2YgZGVmZXJCbG9ja3MpIHtcbiAgICAgIGRlZmVyQmxvY2tGaXh0dXJlcy5wdXNoKG5ldyBEZWZlckJsb2NrRml4dHVyZShibG9jaywgdGhpcykpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGVmZXJCbG9ja0ZpeHR1cmVzKTtcbiAgfVxuXG5cbiAgcHJpdmF0ZSBfZ2V0UmVuZGVyZXIoKSB7XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyID0gdGhpcy5jb21wb25lbnRSZWYuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZXIgYXMgUmVuZGVyZXJGYWN0b3J5MiB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIHVpIHN0YXRlIGlzIHN0YWJsZSBmb2xsb3dpbmcgYW5pbWF0aW9ucy5cbiAgICovXG4gIHdoZW5SZW5kZXJpbmdEb25lKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSB0aGlzLl9nZXRSZW5kZXJlcigpO1xuICAgIGlmIChyZW5kZXJlciAmJiByZW5kZXJlci53aGVuUmVuZGVyaW5nRG9uZSkge1xuICAgICAgcmV0dXJuIHJlbmRlcmVyLndoZW5SZW5kZXJpbmdEb25lKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLndoZW5TdGFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGNvbXBvbmVudCBkZXN0cnVjdGlvbi5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9pc0Rlc3Ryb3llZCkge1xuICAgICAgdGhpcy5jb21wb25lbnRSZWYuZGVzdHJveSgpO1xuICAgICAgaWYgKHRoaXMuX29uVW5zdGFibGVTdWJzY3JpcHRpb24gIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9vblVuc3RhYmxlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX29uVW5zdGFibGVTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX29uU3RhYmxlU3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fb25TdGFibGVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fb25TdGFibGVTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24gIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX29uRXJyb3JTdWJzY3JpcHRpb24gIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9vbkVycm9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX29uRXJyb3JTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgfVxuICAgICAgdGhpcy5faXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxufVxuIl19