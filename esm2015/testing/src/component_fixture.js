/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RendererFactory2, getDebugNode } from '@angular/core';
/**
 * Fixture for debugging and testing a component.
 *
 *
 * @template T
 */
export class ComponentFixture {
    /**
     * @param {?} componentRef
     * @param {?} ngZone
     * @param {?} _autoDetect
     */
    constructor(componentRef, ngZone, _autoDetect) {
        this.componentRef = componentRef;
        this.ngZone = ngZone;
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
        this.debugElement = /** @type {?} */ (getDebugNode(this.elementRef.nativeElement));
        this.componentInstance = componentRef.instance;
        this.nativeElement = this.elementRef.nativeElement;
        this.componentRef = componentRef;
        this.ngZone = ngZone;
        if (ngZone) {
            // Create subscriptions outside the NgZone so that the callbacks run oustide
            // of NgZone.
            ngZone.runOutsideAngular(() => {
                this._onUnstableSubscription =
                    ngZone.onUnstable.subscribe({ next: () => { this._isStable = false; } });
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
                            scheduleMicroTask(() => {
                                if (!ngZone.hasPendingMacrotasks) {
                                    if (this._promise !== null) {
                                        /** @type {?} */ ((this._resolve))(true);
                                        this._resolve = null;
                                        this._promise = null;
                                    }
                                }
                            });
                        }
                    }
                });
                this._onErrorSubscription =
                    ngZone.onError.subscribe({ next: (error) => { throw error; } });
            });
        }
    }
    /**
     * @param {?} checkNoChanges
     * @return {?}
     */
    _tick(checkNoChanges) {
        this.changeDetectorRef.detectChanges();
        if (checkNoChanges) {
            this.checkNoChanges();
        }
    }
    /**
     * Trigger a change detection cycle for the component.
     * @param {?=} checkNoChanges
     * @return {?}
     */
    detectChanges(checkNoChanges = true) {
        if (this.ngZone != null) {
            // Run the change detection inside the NgZone so that any async tasks as part of the change
            // detection are captured by the zone and can be waited for in isStable.
            this.ngZone.run(() => { this._tick(checkNoChanges); });
        }
        else {
            // Running without zone. Just do the change detection.
            this._tick(checkNoChanges);
        }
    }
    /**
     * Do a change detection run to make sure there were no changes.
     * @return {?}
     */
    checkNoChanges() { this.changeDetectorRef.checkNoChanges(); }
    /**
     * Set whether the fixture should autodetect changes.
     *
     * Also runs detectChanges once so that any existing change is detected.
     * @param {?=} autoDetect
     * @return {?}
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
     * @return {?}
     */
    isStable() { return this._isStable && !/** @type {?} */ ((this.ngZone)).hasPendingMacrotasks; }
    /**
     * Get a promise that resolves when the fixture is stable.
     *
     * This can be used to resume testing after events have triggered asynchronous activity or
     * asynchronous change detection.
     * @return {?}
     */
    whenStable() {
        if (this.isStable()) {
            return Promise.resolve(false);
        }
        else if (this._promise !== null) {
            return this._promise;
        }
        else {
            this._promise = new Promise(res => { this._resolve = res; });
            return this._promise;
        }
    }
    /**
     * @return {?}
     */
    _getRenderer() {
        if (this._renderer === undefined) {
            this._renderer = this.componentRef.injector.get(RendererFactory2, null);
        }
        return /** @type {?} */ (this._renderer);
    }
    /**
     * Get a promise that resolves when the ui state is stable following animations.
     * @return {?}
     */
    whenRenderingDone() {
        /** @type {?} */
        const renderer = this._getRenderer();
        if (renderer && renderer.whenRenderingDone) {
            return renderer.whenRenderingDone();
        }
        return this.whenStable();
    }
    /**
     * Trigger component destruction.
     * @return {?}
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
if (false) {
    /**
     * The DebugElement associated with the root element of this component.
     * @type {?}
     */
    ComponentFixture.prototype.debugElement;
    /**
     * The instance of the root component class.
     * @type {?}
     */
    ComponentFixture.prototype.componentInstance;
    /**
     * The native element at the root of the component.
     * @type {?}
     */
    ComponentFixture.prototype.nativeElement;
    /**
     * The ElementRef for the element at the root of the component.
     * @type {?}
     */
    ComponentFixture.prototype.elementRef;
    /**
     * The ChangeDetectorRef for the component
     * @type {?}
     */
    ComponentFixture.prototype.changeDetectorRef;
    /** @type {?} */
    ComponentFixture.prototype._renderer;
    /** @type {?} */
    ComponentFixture.prototype._isStable;
    /** @type {?} */
    ComponentFixture.prototype._isDestroyed;
    /** @type {?} */
    ComponentFixture.prototype._resolve;
    /** @type {?} */
    ComponentFixture.prototype._promise;
    /** @type {?} */
    ComponentFixture.prototype._onUnstableSubscription;
    /** @type {?} */
    ComponentFixture.prototype._onStableSubscription;
    /** @type {?} */
    ComponentFixture.prototype._onMicrotaskEmptySubscription;
    /** @type {?} */
    ComponentFixture.prototype._onErrorSubscription;
    /** @type {?} */
    ComponentFixture.prototype.componentRef;
    /** @type {?} */
    ComponentFixture.prototype.ngZone;
    /** @type {?} */
    ComponentFixture.prototype._autoDetect;
}
/**
 * @param {?} fn
 * @return {?}
 */
function scheduleMicroTask(fn) {
    Zone.current.scheduleMicroTask('scheduleMicrotask', fn);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZpeHR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2NvbXBvbmVudF9maXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFvRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7Ozs7QUFRaEksTUFBTSxPQUFPLGdCQUFnQjs7Ozs7O0lBb0MzQixZQUNXLGNBQXNDLE1BQW1CLEVBQ3hEO1FBREQsaUJBQVksR0FBWixZQUFZO1FBQTBCLFdBQU0sR0FBTixNQUFNLENBQWE7UUFDeEQsZ0JBQVcsR0FBWCxXQUFXO3lCQVhNLElBQUk7NEJBQ0QsS0FBSzt3QkFDWSxJQUFJO3dCQUNmLElBQUk7dUNBQ2UsSUFBSTtxQ0FDTixJQUFJOzZDQUNJLElBQUk7b0NBQ2IsSUFBSTtRQUt4RCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFDO1FBQ3hELElBQUksQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztRQUN4QyxJQUFJLENBQUMsWUFBWSxxQkFBaUIsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUEsQ0FBQztRQUM5RSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztRQUMvQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO1FBQ25ELElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXJCLElBQUksTUFBTSxFQUFFOzs7WUFHVixNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUM1QixJQUFJLENBQUMsdUJBQXVCO29CQUN4QixNQUFNLENBQUMs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SSxJQUFJLEVBQUU7Z0JBQzlDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLDZCQUE2QixHQUFHLElBQUksQ0FBQzthQUMzQztZQUNELElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksRUFBRTtnQkFDckMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO2FBQ2xDO1lBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7U0FDMUI7S0FDRjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVELFNBQVMsaUJBQWlCLENBQUMsRUFBWTtJQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0NBQ3pEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmLCBDb21wb25lbnRSZWYsIERlYnVnRWxlbWVudCwgRWxlbWVudFJlZiwgTmdab25lLCBSZW5kZXJlckZhY3RvcnkyLCBnZXREZWJ1Z05vZGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5cbi8qKlxuICogRml4dHVyZSBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nIGEgY29tcG9uZW50LlxuICpcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgLyoqXG4gICAqIFRoZSBEZWJ1Z0VsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSByb290IGVsZW1lbnQgb2YgdGhpcyBjb21wb25lbnQuXG4gICAqL1xuICBkZWJ1Z0VsZW1lbnQ6IERlYnVnRWxlbWVudDtcblxuICAvKipcbiAgICogVGhlIGluc3RhbmNlIG9mIHRoZSByb290IGNvbXBvbmVudCBjbGFzcy5cbiAgICovXG4gIGNvbXBvbmVudEluc3RhbmNlOiBUO1xuXG4gIC8qKlxuICAgKiBUaGUgbmF0aXZlIGVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIG5hdGl2ZUVsZW1lbnQ6IGFueTtcblxuICAvKipcbiAgICogVGhlIEVsZW1lbnRSZWYgZm9yIHRoZSBlbGVtZW50IGF0IHRoZSByb290IG9mIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBlbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjb21wb25lbnRcbiAgICovXG4gIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZjtcblxuICBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXJGYWN0b3J5MnxudWxsfHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfaXNTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuICBwcml2YXRlIF9pc0Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9yZXNvbHZlOiAoKHJlc3VsdDogYW55KSA9PiB2b2lkKXxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfcHJvbWlzZTogUHJvbWlzZTxhbnk+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9vblVuc3RhYmxlU3Vic2NyaXB0aW9uOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8gPSBudWxsO1xuICBwcml2YXRlIF9vblN0YWJsZVN1YnNjcmlwdGlvbjogYW55IC8qKiBUT0RPICM5MTAwICovID0gbnVsbDtcbiAgcHJpdmF0ZSBfb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbjogYW55IC8qKiBUT0RPICM5MTAwICovID0gbnVsbDtcbiAgcHJpdmF0ZSBfb25FcnJvclN1YnNjcmlwdGlvbjogYW55IC8qKiBUT0RPICM5MTAwICovID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxUPiwgcHVibGljIG5nWm9uZTogTmdab25lfG51bGwsXG4gICAgICBwcml2YXRlIF9hdXRvRGV0ZWN0OiBib29sZWFuKSB7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZiA9IGNvbXBvbmVudFJlZi5jaGFuZ2VEZXRlY3RvclJlZjtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBjb21wb25lbnRSZWYubG9jYXRpb247XG4gICAgdGhpcy5kZWJ1Z0VsZW1lbnQgPSA8RGVidWdFbGVtZW50PmdldERlYnVnTm9kZSh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgdGhpcy5jb21wb25lbnRJbnN0YW5jZSA9IGNvbXBvbmVudFJlZi5pbnN0YW5jZTtcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB0aGlzLmNvbXBvbmVudFJlZiA9IGNvbXBvbmVudFJlZjtcbiAgICB0aGlzLm5nWm9uZSA9IG5nWm9uZTtcblxuICAgIGlmIChuZ1pvbmUpIHtcbiAgICAgIC8vIENyZWF0ZSBzdWJzY3JpcHRpb25zIG91dHNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IHRoZSBjYWxsYmFja3MgcnVuIG91c3RpZGVcbiAgICAgIC8vIG9mIE5nWm9uZS5cbiAgICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIHRoaXMuX29uVW5zdGFibGVTdWJzY3JpcHRpb24gPVxuICAgICAgICAgICAgbmdab25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKHtuZXh0OiAoKSA9PiB7IHRoaXMuX2lzU3RhYmxlID0gZmFsc2U7IH19KTtcbiAgICAgICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbiA9IG5nWm9uZS5vbk1pY3JvdGFza0VtcHR5LnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9EZXRlY3QpIHtcbiAgICAgICAgICAgICAgLy8gRG8gYSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1biB3aXRoIGNoZWNrTm9DaGFuZ2VzIHNldCB0byB0cnVlIHRvIGNoZWNrXG4gICAgICAgICAgICAgIC8vIHRoZXJlIGFyZSBubyBjaGFuZ2VzIG9uIHRoZSBzZWNvbmQgcnVuLlxuICAgICAgICAgICAgICB0aGlzLmRldGVjdENoYW5nZXModHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fb25TdGFibGVTdWJzY3JpcHRpb24gPSBuZ1pvbmUub25TdGFibGUuc3Vic2NyaWJlKHtcbiAgICAgICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pc1N0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZXJlIGlzIGEgcGVuZGluZyB3aGVuU3RhYmxlKCkgY29tcGxldGVyIHRvIHJlc29sdmUuXG4gICAgICAgICAgICBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAvLyBJZiBzbyBjaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvdGFza3MgYmVmb3JlIHJlc29sdmluZy5cbiAgICAgICAgICAgICAgLy8gRG8gdGhpcyBjaGVjayBpbiB0aGUgbmV4dCB0aWNrIHNvIHRoYXQgbmdab25lIGdldHMgYSBjaGFuY2UgdG8gdXBkYXRlIHRoZSBzdGF0ZSBvZlxuICAgICAgICAgICAgICAvLyBwZW5kaW5nIG1hY3JvdGFza3MuXG4gICAgICAgICAgICAgIHNjaGVkdWxlTWljcm9UYXNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW5nWm9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcykge1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Byb21pc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZSAhKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNvbHZlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX29uRXJyb3JTdWJzY3JpcHRpb24gPVxuICAgICAgICAgICAgbmdab25lLm9uRXJyb3Iuc3Vic2NyaWJlKHtuZXh0OiAoZXJyb3I6IGFueSkgPT4geyB0aHJvdyBlcnJvcjsgfX0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfdGljayhjaGVja05vQ2hhbmdlczogYm9vbGVhbikge1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGlmIChjaGVja05vQ2hhbmdlcykge1xuICAgICAgdGhpcy5jaGVja05vQ2hhbmdlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGEgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSBmb3IgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGRldGVjdENoYW5nZXMoY2hlY2tOb0NoYW5nZXM6IGJvb2xlYW4gPSB0cnVlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubmdab25lICE9IG51bGwpIHtcbiAgICAgIC8vIFJ1biB0aGUgY2hhbmdlIGRldGVjdGlvbiBpbnNpZGUgdGhlIE5nWm9uZSBzbyB0aGF0IGFueSBhc3luYyB0YXNrcyBhcyBwYXJ0IG9mIHRoZSBjaGFuZ2VcbiAgICAgIC8vIGRldGVjdGlvbiBhcmUgY2FwdHVyZWQgYnkgdGhlIHpvbmUgYW5kIGNhbiBiZSB3YWl0ZWQgZm9yIGluIGlzU3RhYmxlLlxuICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHsgdGhpcy5fdGljayhjaGVja05vQ2hhbmdlcyk7IH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSdW5uaW5nIHdpdGhvdXQgem9uZS4gSnVzdCBkbyB0aGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICAgIHRoaXMuX3RpY2soY2hlY2tOb0NoYW5nZXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEbyBhIGNoYW5nZSBkZXRlY3Rpb24gcnVuIHRvIG1ha2Ugc3VyZSB0aGVyZSB3ZXJlIG5vIGNoYW5nZXMuXG4gICAqL1xuICBjaGVja05vQ2hhbmdlcygpOiB2b2lkIHsgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpOyB9XG5cbiAgLyoqXG4gICAqIFNldCB3aGV0aGVyIHRoZSBmaXh0dXJlIHNob3VsZCBhdXRvZGV0ZWN0IGNoYW5nZXMuXG4gICAqXG4gICAqIEFsc28gcnVucyBkZXRlY3RDaGFuZ2VzIG9uY2Ugc28gdGhhdCBhbnkgZXhpc3RpbmcgY2hhbmdlIGlzIGRldGVjdGVkLlxuICAgKi9cbiAgYXV0b0RldGVjdENoYW5nZXMoYXV0b0RldGVjdDogYm9vbGVhbiA9IHRydWUpIHtcbiAgICBpZiAodGhpcy5uZ1pvbmUgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY2FsbCBhdXRvRGV0ZWN0Q2hhbmdlcyB3aGVuIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSBpcyBzZXQnKTtcbiAgICB9XG4gICAgdGhpcy5fYXV0b0RldGVjdCA9IGF1dG9EZXRlY3Q7XG4gICAgdGhpcy5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHdoZXRoZXIgdGhlIGZpeHR1cmUgaXMgY3VycmVudGx5IHN0YWJsZSBvciBoYXMgYXN5bmMgdGFza3MgdGhhdCBoYXZlIG5vdCBiZWVuIGNvbXBsZXRlZFxuICAgKiB5ZXQuXG4gICAqL1xuICBpc1N0YWJsZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2lzU3RhYmxlICYmICF0aGlzLm5nWm9uZSAhLmhhc1BlbmRpbmdNYWNyb3Rhc2tzOyB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBmaXh0dXJlIGlzIHN0YWJsZS5cbiAgICpcbiAgICogVGhpcyBjYW4gYmUgdXNlZCB0byByZXN1bWUgdGVzdGluZyBhZnRlciBldmVudHMgaGF2ZSB0cmlnZ2VyZWQgYXN5bmNocm9ub3VzIGFjdGl2aXR5IG9yXG4gICAqIGFzeW5jaHJvbm91cyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKi9cbiAgd2hlblN0YWJsZSgpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLmlzU3RhYmxlKCkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fcHJvbWlzZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZShyZXMgPT4geyB0aGlzLl9yZXNvbHZlID0gcmVzOyB9KTtcbiAgICAgIHJldHVybiB0aGlzLl9wcm9taXNlO1xuICAgIH1cbiAgfVxuXG5cbiAgcHJpdmF0ZSBfZ2V0UmVuZGVyZXIoKSB7XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyID0gdGhpcy5jb21wb25lbnRSZWYuaW5qZWN0b3IuZ2V0KFJlbmRlcmVyRmFjdG9yeTIsIG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyZXIgYXMgUmVuZGVyZXJGYWN0b3J5MiB8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICAqIEdldCBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSB1aSBzdGF0ZSBpcyBzdGFibGUgZm9sbG93aW5nIGFuaW1hdGlvbnMuXG4gICAgKi9cbiAgd2hlblJlbmRlcmluZ0RvbmUoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZW5kZXJlciA9IHRoaXMuX2dldFJlbmRlcmVyKCk7XG4gICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLndoZW5SZW5kZXJpbmdEb25lKSB7XG4gICAgICByZXR1cm4gcmVuZGVyZXIud2hlblJlbmRlcmluZ0RvbmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMud2hlblN0YWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgY29tcG9uZW50IGRlc3RydWN0aW9uLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzRGVzdHJveWVkKSB7XG4gICAgICB0aGlzLmNvbXBvbmVudFJlZi5kZXN0cm95KCk7XG4gICAgICBpZiAodGhpcy5fb25VbnN0YWJsZVN1YnNjcmlwdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX29uVW5zdGFibGVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fb25VbnN0YWJsZVN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fb25TdGFibGVTdWJzY3JpcHRpb24gIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9vblN0YWJsZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB0aGlzLl9vblN0YWJsZVN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fb25FcnJvclN1YnNjcmlwdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuX29uRXJyb3JTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdGhpcy5fb25FcnJvclN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLl9pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNjaGVkdWxlTWljcm9UYXNrKGZuOiBGdW5jdGlvbikge1xuICBab25lLmN1cnJlbnQuc2NoZWR1bGVNaWNyb1Rhc2soJ3NjaGVkdWxlTWljcm90YXNrJywgZm4pO1xufVxuIl19