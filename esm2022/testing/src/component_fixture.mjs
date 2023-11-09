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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBNEQsWUFBWSxFQUFVLGdCQUFnQixFQUE0RixlQUFlLElBQUksY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRzdQLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUcxQzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQW9DM0IsYUFBYTtJQUNiLFlBQ1csWUFBNkIsRUFBUyxNQUFtQixFQUN4RCxZQUF3QyxFQUFVLFdBQW9CO1FBRHZFLGlCQUFZLEdBQVosWUFBWSxDQUFpQjtRQUFTLFdBQU0sR0FBTixNQUFNLENBQWE7UUFDeEQsaUJBQVksR0FBWixZQUFZLENBQTRCO1FBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQVM7UUFaMUUsY0FBUyxHQUFZLElBQUksQ0FBQztRQUMxQixpQkFBWSxHQUFZLEtBQUssQ0FBQztRQUM5QixhQUFRLEdBQXFDLElBQUksQ0FBQztRQUNsRCxhQUFRLEdBQTBCLElBQUksQ0FBQztRQUN2Qyw0QkFBdUIsR0FBc0IsSUFBSSxDQUFDO1FBQ2xELDBCQUFxQixHQUFzQixJQUFJLENBQUM7UUFDaEQsa0NBQTZCLEdBQXNCLElBQUksQ0FBQztRQUN4RCx5QkFBb0IsR0FBc0IsSUFBSSxDQUFDO1FBTXJELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxZQUFZLENBQUMsaUJBQWlCLENBQUM7UUFDeEQsSUFBSSxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxZQUFZLEdBQWlCLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzlFLElB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QUksSUFBSSxDQUFDLHVCQUF1QixJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7WUFDdEMsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLHFCQUFxQixJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7WUFDcEMsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLDZCQUE2QixJQUFJLElBQUksRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2pELElBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUM7WUFDNUMsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7WUFDbkMsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQzNCLENBQUM7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiwgQ29tcG9uZW50UmVmLCBEZWJ1Z0VsZW1lbnQsIEVsZW1lbnRSZWYsIGdldERlYnVnTm9kZSwgTmdab25lLCBSZW5kZXJlckZhY3RvcnkyLCDJtURlZmVyQmxvY2tEZXRhaWxzIGFzIERlZmVyQmxvY2tEZXRhaWxzLCDJtUZsdXNoYWJsZUVmZmVjdFJ1bm5lciBhcyBGbHVzaGFibGVFZmZlY3RSdW5uZXIsIMm1Z2V0RGVmZXJCbG9ja3MgYXMgZ2V0RGVmZXJCbG9ja3N9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0RlZmVyQmxvY2tGaXh0dXJlfSBmcm9tICcuL2RlZmVyJztcblxuXG4vKipcbiAqIEZpeHR1cmUgZm9yIGRlYnVnZ2luZyBhbmQgdGVzdGluZyBhIGNvbXBvbmVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgLyoqXG4gICAqIFRoZSBEZWJ1Z0VsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSByb290IGVsZW1lbnQgb2YgdGhpcyBjb21wb25lbnQuXG4gICAqL1xuICBkZWJ1Z0VsZW1lbnQ6IERlYnVnRWxlbWVudDtcblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIG9mIHRoZSByb290IGNvbXBvbmVudCBjbGFzcy5cbiAgICovXG4gIGNvbXBvbmVudEluc3RhbmNlOiBUO1xuXG4gIC8qKlxuICAgKiBUaGUgbmF0aXZlIGVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICAvKipcbiAgICogVGhlIEVsZW1lbnRSZWYgZm9yIHRoZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBlbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjb21wb25lbnRcbiAgICovXG4gIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcblxuICBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXJGYWN0b3J5MnxudWxsfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfaXNTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuICBwcml2YXRlIF9pc0Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9yZXNvbHZlOiAoKHJlc3VsdDogYm9vbGVhbikgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3Byb21pc2U6IFByb21pc2U8Ym9vbGVhbj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX29uVW5zdGFibGVTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfb25TdGFibGVTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9vbkVycm9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbCA9IG51bGw7XG5cbiAgLyoqIEBub2RvYyAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxUPiwgcHVibGljIG5nWm9uZTogTmdab25lfG51bGwsXG4gICAgICBwcml2YXRlIGVmZmVjdFJ1bm5lcjogRmx1c2hhYmxlRWZmZWN0UnVubmVyfG51bGwsIHByaXZhdGUgX2F1dG9EZXRlY3Q6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmID0gY29tcG9uZW50UmVmLmNoYW5nZURldGVjdG9yUmVmO1xuICAgIHRoaXMuZWxlbWVudFJlZiA9IGNvbXBvbmVudFJlZi5sb2NhdGlvbjtcbiAgICB0aGlzLmRlYnVnRWxlbWVudCA9IDxEZWJ1Z0VsZW1lbnQ+Z2V0RGVidWdOb2RlKHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICB0aGlzLmNvbXBvbmVudEluc3RhbmNlID0gY29tcG9uZW50UmVmLmluc3RhbmNlO1xuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIHRoaXMuY29tcG9uZW50UmVmID0gY29tcG9uZW50UmVmO1xuICAgIHRoaXMubmdab25lID0gbmdab25lO1xuXG4gICAgaWYgKG5nWm9uZSkge1xuICAgICAgLy8gQ3JlYXRlIHN1YnNjcmlwdGlvbnMgb3V0c2lkZSB0aGUgTmdab25lIHNvIHRoYXQgdGhlIGNhbGxiYWNrcyBydW4gb3VzdGlkZVxuICAgICAgLy8gb2YgTmdab25lLlxuICAgICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgdGhpcy5fb25VbnN0YWJsZVN1YnNjcmlwdGlvbiA9IG5nWm9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5faXNTdGFibGUgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uID0gbmdab25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKHtcbiAgICAgICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYXV0b0RldGVjdCkge1xuICAgICAgICAgICAgICAvLyBEbyBhIGNoYW5nZSBkZXRlY3Rpb24gcnVuIHdpdGggY2hlY2tOb0NoYW5nZXMgc2V0IHRvIHRydWUgdG8gY2hlY2tcbiAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIG5vIGNoYW5nZXMgb24gdGhlIHNlY29uZCBydW4uXG4gICAgICAgICAgICAgIHRoaXMuZGV0ZWN0Q2hhbmdlcyh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9vblN0YWJsZVN1YnNjcmlwdGlvbiA9IG5nWm9uZS5vblN0YWJsZS5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2lzU3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlcmUgaXMgYSBwZW5kaW5nIHdoZW5TdGFibGUoKSBjb21wbGV0ZXIgdG8gcmVzb2x2ZS5cbiAgICAgICAgICAgIGlmICh0aGlzLl9wcm9taXNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIC8vIElmIHNvIGNoZWNrIHdoZXRoZXIgdGhlcmUgYXJlIG5vIHBlbmRpbmcgbWFjcm90YXNrcyBiZWZvcmUgcmVzb2x2aW5nLlxuICAgICAgICAgICAgICAvLyBEbyB0aGlzIGNoZWNrIGluIHRoZSBuZXh0IHRpY2sgc28gdGhhdCBuZ1pvbmUgZ2V0cyBhIGNoYW5jZSB0byB1cGRhdGUgdGhlIHN0YXRlIG9mXG4gICAgICAgICAgICAgIC8vIHBlbmRpbmcgbWFjcm90YXNrcy5cbiAgICAgICAgICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghbmdab25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNvbHZlISh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb21pc2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9vbkVycm9yU3Vic2NyaXB0aW9uID0gbmdab25lLm9uRXJyb3Iuc3Vic2NyaWJlKHtcbiAgICAgICAgICBuZXh0OiAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3RpY2soY2hlY2tOb0NoYW5nZXM6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICBpZiAoY2hlY2tOb0NoYW5nZXMpIHtcbiAgICAgIHRoaXMuY2hlY2tOb0NoYW5nZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgZm9yIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBkZXRlY3RDaGFuZ2VzKGNoZWNrTm9DaGFuZ2VzOiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIHRoaXMuZWZmZWN0UnVubmVyPy5mbHVzaCgpO1xuICAgIGlmICh0aGlzLm5nWm9uZSAhPSBudWxsKSB7XG4gICAgICAvLyBSdW4gdGhlIGNoYW5nZSBkZXRlY3Rpb24gaW5zaWRlIHRoZSBOZ1pvbmUgc28gdGhhdCBhbnkgYXN5bmMgdGFza3MgYXMgcGFydCBvZiB0aGUgY2hhbmdlXG4gICAgICAvLyBkZXRlY3Rpb24gYXJlIGNhcHR1cmVkIGJ5IHRoZSB6b25lIGFuZCBjYW4gYmUgd2FpdGVkIGZvciBpbiBpc1N0YWJsZS5cbiAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuX3RpY2soY2hlY2tOb0NoYW5nZXMpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJ1bm5pbmcgd2l0aG91dCB6b25lLiBKdXN0IGRvIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgICAgdGhpcy5fdGljayhjaGVja05vQ2hhbmdlcyk7XG4gICAgfVxuICAgIC8vIFJ1biBhbnkgZWZmZWN0cyB0aGF0IHdlcmUgY3JlYXRlZC9kaXJ0aWVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLiBTdWNoIGVmZmVjdHMgbWlnaHQgYmVjb21lXG4gICAgLy8gZGlydHkgaW4gcmVzcG9uc2UgdG8gaW5wdXQgc2lnbmFscyBjaGFuZ2luZy5cbiAgICB0aGlzLmVmZmVjdFJ1bm5lcj8uZmx1c2goKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEbyBhIGNoYW5nZSBkZXRlY3Rpb24gcnVuIHRvIG1ha2Ugc3VyZSB0aGVyZSB3ZXJlIG5vIGNoYW5nZXMuXG4gICAqL1xuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLmNoZWNrTm9DaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHdoZXRoZXIgdGhlIGZpeHR1cmUgc2hvdWxkIGF1dG9kZXRlY3QgY2hhbmdlcy5cbiAgICpcbiAgICogQWxzbyBydW5zIGRldGVjdENoYW5nZXMgb25jZSBzbyB0aGF0IGFueSBleGlzdGluZyBjaGFuZ2UgaXMgZGV0ZWN0ZWQuXG4gICAqL1xuICBhdXRvRGV0ZWN0Q2hhbmdlcyhhdXRvRGV0ZWN0OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLm5nWm9uZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGF1dG9EZXRlY3RDaGFuZ2VzIHdoZW4gQ29tcG9uZW50Rml4dHVyZU5vTmdab25lIGlzIHNldCcpO1xuICAgIH1cbiAgICB0aGlzLl9hdXRvRGV0ZWN0ID0gYXV0b0RldGVjdDtcbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGUgZml4dHVyZSBpcyBjdXJyZW50bHkgc3RhYmxlIG9yIGhhcyBhc3luYyB0YXNrcyB0aGF0IGhhdmUgbm90IGJlZW4gY29tcGxldGVkXG4gICAqIHlldC5cbiAgICovXG4gIGlzU3RhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc1N0YWJsZSAmJiAhdGhpcy5uZ1pvbmUhLmhhc1BlbmRpbmdNYWNyb3Rhc2tzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBmaXh0dXJlIGlzIHN0YWJsZS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byByZXN1bWUgdGVzdGluZyBhZnRlciBldmVudHMgaGF2ZSB0cmlnZ2VyZWQgYXN5bmNocm9ub3VzIGFjdGl2aXR5IG9yXG4gICAqIGFzeW5jaHJvbm91cyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgd2hlblN0YWJsZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLmlzU3RhYmxlKCkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZShyZXMgPT4ge1xuICAgICAgICB0aGlzLl9yZXNvbHZlID0gcmVzO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBkZWZlciBibG9jayBmaXh0dXJlcyBpbiB0aGUgY29tcG9uZW50IGZpeHR1cmUuXG4gICAqXG4gICAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gICAqL1xuICBnZXREZWZlckJsb2NrcygpOiBQcm9taXNlPERlZmVyQmxvY2tGaXh0dXJlW10+IHtcbiAgICBjb25zdCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSA9IFtdO1xuICAgIGNvbnN0IGxWaWV3ID0gKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIGFueSlbJ19sVmlldyddO1xuICAgIGdldERlZmVyQmxvY2tzKGxWaWV3LCBkZWZlckJsb2Nrcyk7XG5cbiAgICBjb25zdCBkZWZlckJsb2NrRml4dHVyZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGRlZmVyQmxvY2tzKSB7XG4gICAgICBkZWZlckJsb2NrRml4dHVyZXMucHVzaChuZXcgRGVmZXJCbG9ja0ZpeHR1cmUoYmxvY2ssIHRoaXMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRlZmVyQmxvY2tGaXh0dXJlcyk7XG4gIH1cblxuXG4gIHByaXZhdGUgX2dldFJlbmRlcmVyKCkge1xuICAgIGlmICh0aGlzLl9yZW5kZXJlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlciA9IHRoaXMuY29tcG9uZW50UmVmLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyLCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyIGFzIFJlbmRlcmVyRmFjdG9yeTIgfCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSB1aSBzdGF0ZSBpcyBzdGFibGUgZm9sbG93aW5nIGFuaW1hdGlvbnMuXG4gICAqL1xuICB3aGVuUmVuZGVyaW5nRG9uZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdGhpcy5fZ2V0UmVuZGVyZXIoKTtcbiAgICBpZiAocmVuZGVyZXIgJiYgcmVuZGVyZXIud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiByZW5kZXJlci53aGVuUmVuZGVyaW5nRG9uZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy53aGVuU3RhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBjb21wb25lbnQgZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNEZXN0cm95ZWQpIHtcbiAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgIGlmICh0aGlzLl9vblVuc3RhYmxlU3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fb25VbnN0YWJsZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9vblVuc3RhYmxlU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9vblN0YWJsZVN1YnNjcmlwdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX29uU3RhYmxlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX29uU3RhYmxlU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9vbkVycm9yU3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fb25FcnJvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9vbkVycm9yU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2lzRGVzdHJveWVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==