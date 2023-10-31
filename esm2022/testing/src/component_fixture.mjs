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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBNEQsWUFBWSxFQUFVLGdCQUFnQixFQUE0RixlQUFlLElBQUksY0FBYyxFQUFzQyxNQUFNLGVBQWUsQ0FBQztBQUdsUyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHMUM7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxnQkFBZ0I7SUFvQzNCLGFBQWE7SUFDYixZQUNXLFlBQTZCLEVBQVMsTUFBbUIsRUFDeEQsWUFBd0MsRUFBVSxXQUFvQjtRQUR2RSxpQkFBWSxHQUFaLFlBQVksQ0FBaUI7UUFBUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1FBQ3hELGlCQUFZLEdBQVosWUFBWSxDQUE0QjtRQUFVLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1FBWjFFLGNBQVMsR0FBWSxJQUFJLENBQUM7UUFDMUIsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFDOUIsYUFBUSxHQUFxQyxJQUFJLENBQUM7UUFDbEQsYUFBUSxHQUEwQixJQUFJLENBQUM7UUFDdkMsNEJBQXVCLEdBQXNCLElBQUksQ0FBQztRQUNsRCwwQkFBcUIsR0FBc0IsSUFBSSxDQUFDO1FBQ2hELGtDQUE2QixHQUFzQixJQUFJLENBQUM7UUFDeEQseUJBQW9CLEdBQXNCLElBQUksQ0FBQztRQU1yRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFDO1FBQ3hELElBQUksQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztRQUN4QyxJQUFJLENBQUMsWUFBWSxHQUFpQixZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5RSxJ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LHFCQUFxQixHQUFHLElBQUksQ0FBQzthQUNuQztZQUNELElBQUksSUFBSSxDQUFDLDZCQUE2QixJQUFJLElBQUksRUFBRTtnQkFDOUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDO2FBQzNDO1lBQ0QsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxFQUFFO2dCQUNyQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7YUFDbEM7WUFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztTQUMxQjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnRSZWYsIERlYnVnRWxlbWVudCwgRWxlbWVudFJlZiwgZ2V0RGVidWdOb2RlLCBOZ1pvbmUsIFJlbmRlcmVyRmFjdG9yeTIsIMm1RGVmZXJCbG9ja0RldGFpbHMgYXMgRGVmZXJCbG9ja0RldGFpbHMsIMm1Rmx1c2hhYmxlRWZmZWN0UnVubmVyIGFzIEZsdXNoYWJsZUVmZmVjdFJ1bm5lciwgybVnZXREZWZlckJsb2NrcyBhcyBnZXREZWZlckJsb2NrcywgybVJbnRlcm5hbFZpZXdSZWYgYXMgSW50ZXJuYWxWaWV3UmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtEZWZlckJsb2NrRml4dHVyZX0gZnJvbSAnLi9kZWZlcic7XG5cblxuLyoqXG4gKiBGaXh0dXJlIGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmcgYSBjb21wb25lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gIC8qKlxuICAgKiBUaGUgRGVidWdFbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgcm9vdCBlbGVtZW50IG9mIHRoaXMgY29tcG9uZW50LlxuICAgKi9cbiAgZGVidWdFbGVtZW50OiBEZWJ1Z0VsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIFRoZSBpbnN0YW5jZSBvZiB0aGUgcm9vdCBjb21wb25lbnQgY2xhc3MuXG4gICAqL1xuICBjb21wb25lbnRJbnN0YW5jZTogVDtcblxuICAvKipcbiAgICogVGhlIG5hdGl2ZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgLyoqXG4gICAqIFRoZSBFbGVtZW50UmVmIGZvciB0aGUgZWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgZWxlbWVudFJlZjogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogVGhlIENoYW5nZURldGVjdG9yUmVmIGZvciB0aGUgY29tcG9uZW50XG4gICAqL1xuICBjaGFuZ2VEZXRlY3RvclJlZjogQ2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyRmFjdG9yeTJ8bnVsbHx1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2lzU3RhYmxlOiBib29sZWFuID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfaXNEZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfcmVzb2x2ZTogKChyZXN1bHQ6IGJvb2xlYW4pID0+IHZvaWQpfG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9wcm9taXNlOiBQcm9taXNlPGJvb2xlYW4+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9vblVuc3RhYmxlU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX29uU3RhYmxlU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb258bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfb25FcnJvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9ufG51bGwgPSBudWxsO1xuXG4gIC8qKiBAbm9kb2MgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8VD4sIHB1YmxpYyBuZ1pvbmU6IE5nWm9uZXxudWxsLFxuICAgICAgcHJpdmF0ZSBlZmZlY3RSdW5uZXI6IEZsdXNoYWJsZUVmZmVjdFJ1bm5lcnxudWxsLCBwcml2YXRlIF9hdXRvRGV0ZWN0OiBib29sZWFuKSB7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IGNvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZjtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBjb21wb25lbnRSZWYubG9jYXRpb247XG4gICAgdGhpcy5kZWJ1Z0VsZW1lbnQgPSA8RGVidWdFbGVtZW50PmdldERlYnVnTm9kZSh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgdGhpcy5jb21wb25lbnRJbnN0YW5jZSA9IGNvbXBvbmVudFJlZi5pbnN0YW5jZTtcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IGNvbXBvbmVudFJlZjtcbiAgICB0aGlzLm5nWm9uZSA9IG5nWm9uZTtcblxuICAgIGlmIChuZ1pvbmUpIHtcbiAgICAgIC8vIENyZWF0ZSBzdWJzY3JpcHRpb25zIG91dHNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IHRoZSBjYWxsYmFja3MgcnVuIG91c3RpZGVcbiAgICAgIC8vIG9mIE5nWm9uZS5cbiAgICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHRoaXMuX29uVW5zdGFibGVTdWJzY3JpcHRpb24gPSBuZ1pvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2lzU3RhYmxlID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbiA9IG5nWm9uZS5vbk1pY3JvdGFza0VtcHR5LnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9EZXRlY3QpIHtcbiAgICAgICAgICAgICAgLy8gRG8gYSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1biB3aXRoIGNoZWNrTm9DaGFuZ2VzIHNldCB0byB0cnVlIHRvIGNoZWNrXG4gICAgICAgICAgICAgIC8vIHRoZXJlIGFyZSBubyBjaGFuZ2VzIG9uIHRoZSBzZWNvbmQgcnVuLlxuICAgICAgICAgICAgICB0aGlzLmRldGVjdENoYW5nZXModHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fb25TdGFibGVTdWJzY3JpcHRpb24gPSBuZ1pvbmUub25TdGFibGUuc3Vic2NyaWJlKHtcbiAgICAgICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pc1N0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZXJlIGlzIGEgcGVuZGluZyB3aGVuU3RhYmxlKCkgY29tcGxldGVyIHRvIHJlc29sdmUuXG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAvLyBJZiBzbyBjaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvdGFza3MgYmVmb3JlIHJlc29sdmluZy5cbiAgICAgICAgICAgICAgLy8gRG8gdGhpcyBjaGVjayBpbiB0aGUgbmV4dCB0aWNrIHNvIHRoYXQgbmdab25lIGdldHMgYSBjaGFuY2UgdG8gdXBkYXRlIHRoZSBzdGF0ZSBvZlxuICAgICAgICAgICAgICAvLyBwZW5kaW5nIG1hY3JvdGFza3MuXG4gICAgICAgICAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW5nWm9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcykge1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Byb21pc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSEodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc29sdmUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9taXNlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fb25FcnJvclN1YnNjcmlwdGlvbiA9IG5nWm9uZS5vbkVycm9yLnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF90aWNrKGNoZWNrTm9DaGFuZ2VzOiBib29sZWFuKSB7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgaWYgKGNoZWNrTm9DaGFuZ2VzKSB7XG4gICAgICB0aGlzLmNoZWNrTm9DaGFuZ2VzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlIGZvciB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgZGV0ZWN0Q2hhbmdlcyhjaGVja05vQ2hhbmdlczogYm9vbGVhbiA9IHRydWUpOiB2b2lkIHtcbiAgICB0aGlzLmVmZmVjdFJ1bm5lcj8uZmx1c2goKTtcbiAgICBpZiAodGhpcy5uZ1pvbmUgIT0gbnVsbCkge1xuICAgICAgLy8gUnVuIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGluc2lkZSB0aGUgTmdab25lIHNvIHRoYXQgYW55IGFzeW5jIHRhc2tzIGFzIHBhcnQgb2YgdGhlIGNoYW5nZVxuICAgICAgLy8gZGV0ZWN0aW9uIGFyZSBjYXB0dXJlZCBieSB0aGUgem9uZSBhbmQgY2FuIGJlIHdhaXRlZCBmb3IgaW4gaXNTdGFibGUuXG4gICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLl90aWNrKGNoZWNrTm9DaGFuZ2VzKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSdW5uaW5nIHdpdGhvdXQgem9uZS4gSnVzdCBkbyB0aGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICAgIHRoaXMuX3RpY2soY2hlY2tOb0NoYW5nZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEbyBhIGNoYW5nZSBkZXRlY3Rpb24gcnVuIHRvIG1ha2Ugc3VyZSB0aGVyZSB3ZXJlIG5vIGNoYW5nZXMuXG4gICAqL1xuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yUmVmLmNoZWNrTm9DaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHdoZXRoZXIgdGhlIGZpeHR1cmUgc2hvdWxkIGF1dG9kZXRlY3QgY2hhbmdlcy5cbiAgICpcbiAgICogQWxzbyBydW5zIGRldGVjdENoYW5nZXMgb25jZSBzbyB0aGF0IGFueSBleGlzdGluZyBjaGFuZ2UgaXMgZGV0ZWN0ZWQuXG4gICAqL1xuICBhdXRvRGV0ZWN0Q2hhbmdlcyhhdXRvRGV0ZWN0OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIGlmICh0aGlzLm5nWm9uZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjYWxsIGF1dG9EZXRlY3RDaGFuZ2VzIHdoZW4gQ29tcG9uZW50Rml4dHVyZU5vTmdab25lIGlzIHNldCcpO1xuICAgIH1cbiAgICB0aGlzLl9hdXRvRGV0ZWN0ID0gYXV0b0RldGVjdDtcbiAgICB0aGlzLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gd2hldGhlciB0aGUgZml4dHVyZSBpcyBjdXJyZW50bHkgc3RhYmxlIG9yIGhhcyBhc3luYyB0YXNrcyB0aGF0IGhhdmUgbm90IGJlZW4gY29tcGxldGVkXG4gICAqIHlldC5cbiAgICovXG4gIGlzU3RhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc1N0YWJsZSAmJiAhdGhpcy5uZ1pvbmUhLmhhc1BlbmRpbmdNYWNyb3Rhc2tzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBmaXh0dXJlIGlzIHN0YWJsZS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byByZXN1bWUgdGVzdGluZyBhZnRlciBldmVudHMgaGF2ZSB0cmlnZ2VyZWQgYXN5bmNocm9ub3VzIGFjdGl2aXR5IG9yXG4gICAqIGFzeW5jaHJvbm91cyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgd2hlblN0YWJsZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLmlzU3RhYmxlKCkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZShyZXMgPT4ge1xuICAgICAgICB0aGlzLl9yZXNvbHZlID0gcmVzO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpcy5fcHJvbWlzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBkZWZlciBibG9jayBmaXh0dXJlcyBpbiB0aGUgY29tcG9uZW50IGZpeHR1cmUuXG4gICAqXG4gICAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gICAqL1xuICBnZXREZWZlckJsb2NrcygpOiBQcm9taXNlPERlZmVyQmxvY2tGaXh0dXJlW10+IHtcbiAgICBjb25zdCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSA9IFtdO1xuICAgIGNvbnN0IGxWaWV3ID0gKHRoaXMuY29tcG9uZW50UmVmLmhvc3RWaWV3IGFzIEludGVybmFsVmlld1JlZjx1bmtub3duPikuX2xWaWV3O1xuICAgIGdldERlZmVyQmxvY2tzKGxWaWV3LCBkZWZlckJsb2Nrcyk7XG5cbiAgICBjb25zdCBkZWZlckJsb2NrRml4dHVyZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGRlZmVyQmxvY2tzKSB7XG4gICAgICBkZWZlckJsb2NrRml4dHVyZXMucHVzaChuZXcgRGVmZXJCbG9ja0ZpeHR1cmUoYmxvY2ssIHRoaXMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRlZmVyQmxvY2tGaXh0dXJlcyk7XG4gIH1cblxuXG4gIHByaXZhdGUgX2dldFJlbmRlcmVyKCkge1xuICAgIGlmICh0aGlzLl9yZW5kZXJlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9yZW5kZXJlciA9IHRoaXMuY29tcG9uZW50UmVmLmluamVjdG9yLmdldChSZW5kZXJlckZhY3RvcnkyLCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyIGFzIFJlbmRlcmVyRmFjdG9yeTIgfCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSB1aSBzdGF0ZSBpcyBzdGFibGUgZm9sbG93aW5nIGFuaW1hdGlvbnMuXG4gICAqL1xuICB3aGVuUmVuZGVyaW5nRG9uZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdGhpcy5fZ2V0UmVuZGVyZXIoKTtcbiAgICBpZiAocmVuZGVyZXIgJiYgcmVuZGVyZXIud2hlblJlbmRlcmluZ0RvbmUpIHtcbiAgICAgIHJldHVybiByZW5kZXJlci53aGVuUmVuZGVyaW5nRG9uZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy53aGVuU3RhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogVHJpZ2dlciBjb21wb25lbnQgZGVzdHJ1Y3Rpb24uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5faXNEZXN0cm95ZWQpIHtcbiAgICAgIHRoaXMuY29tcG9uZW50UmVmLmRlc3Ryb3koKTtcbiAgICAgIGlmICh0aGlzLl9vblVuc3RhYmxlU3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fb25VbnN0YWJsZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9vblVuc3RhYmxlU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9vblN0YWJsZVN1YnNjcmlwdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX29uU3RhYmxlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHRoaXMuX29uU3RhYmxlU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9vbkVycm9yU3Vic2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5fb25FcnJvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9vbkVycm9yU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2lzRGVzdHJveWVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==