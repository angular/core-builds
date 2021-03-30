/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '../di';
import { scheduleMicroTask } from '../util/microtask';
import { NgZone } from '../zone/ng_zone';
/**
 * The Testability service provides testing hooks that can be accessed from
 * the browser and by services such as Protractor. Each bootstrapped Angular
 * application on the page will have an instance of Testability.
 * @publicApi
 */
let Testability = /** @class */ (() => {
    class Testability {
        constructor(_ngZone) {
            this._ngZone = _ngZone;
            this._pendingCount = 0;
            this._isZoneStable = true;
            /**
             * Whether any work was done since the last 'whenStable' callback. This is
             * useful to detect if this could have potentially destabilized another
             * component while it is stabilizing.
             * @internal
             */
            this._didWork = false;
            this._callbacks = [];
            this.taskTrackingZone = null;
            this._watchAngularEvents();
            _ngZone.run(() => {
                this.taskTrackingZone =
                    typeof Zone == 'undefined' ? null : Zone.current.get('TaskTrackingZone');
            });
        }
        _watchAngularEvents() {
            this._ngZone.onUnstable.subscribe({
                next: () => {
                    this._didWork = true;
                    this._isZoneStable = false;
                }
            });
            this._ngZone.runOutsideAngular(() => {
                this._ngZone.onStable.subscribe({
                    next: () => {
                        NgZone.assertNotInAngularZone();
                        scheduleMicroTask(() => {
                            this._isZoneStable = true;
                            this._runCallbacksIfReady();
                        });
                    }
                });
            });
        }
        /**
         * Increases the number of pending request
         * @deprecated pending requests are now tracked with zones.
         */
        increasePendingRequestCount() {
            this._pendingCount += 1;
            this._didWork = true;
            return this._pendingCount;
        }
        /**
         * Decreases the number of pending request
         * @deprecated pending requests are now tracked with zones
         */
        decreasePendingRequestCount() {
            this._pendingCount -= 1;
            if (this._pendingCount < 0) {
                throw new Error('pending async requests below zero');
            }
            this._runCallbacksIfReady();
            return this._pendingCount;
        }
        /**
         * Whether an associated application is stable
         */
        isStable() {
            return this._isZoneStable && this._pendingCount === 0 && !this._ngZone.hasPendingMacrotasks;
        }
        _runCallbacksIfReady() {
            if (this.isStable()) {
                // Schedules the call backs in a new frame so that it is always async.
                scheduleMicroTask(() => {
                    while (this._callbacks.length !== 0) {
                        let cb = this._callbacks.pop();
                        clearTimeout(cb.timeoutId);
                        cb.doneCb(this._didWork);
                    }
                    this._didWork = false;
                });
            }
            else {
                // Still not stable, send updates.
                let pending = this.getPendingTasks();
                this._callbacks = this._callbacks.filter((cb) => {
                    if (cb.updateCb && cb.updateCb(pending)) {
                        clearTimeout(cb.timeoutId);
                        return false;
                    }
                    return true;
                });
                this._didWork = true;
            }
        }
        getPendingTasks() {
            if (!this.taskTrackingZone) {
                return [];
            }
            // Copy the tasks data so that we don't leak tasks.
            return this.taskTrackingZone.macroTasks.map((t) => {
                return {
                    source: t.source,
                    // From TaskTrackingZone:
                    // https://github.com/angular/zone.js/blob/master/lib/zone-spec/task-tracking.ts#L40
                    creationLocation: t.creationLocation,
                    data: t.data
                };
            });
        }
        addCallback(cb, timeout, updateCb) {
            let timeoutId = -1;
            if (timeout && timeout > 0) {
                timeoutId = setTimeout(() => {
                    this._callbacks = this._callbacks.filter((cb) => cb.timeoutId !== timeoutId);
                    cb(this._didWork, this.getPendingTasks());
                }, timeout);
            }
            this._callbacks.push({ doneCb: cb, timeoutId: timeoutId, updateCb: updateCb });
        }
        /**
         * Wait for the application to be stable with a timeout. If the timeout is reached before that
         * happens, the callback receives a list of the macro tasks that were pending, otherwise null.
         *
         * @param doneCb The callback to invoke when Angular is stable or the timeout expires
         *    whichever comes first.
         * @param timeout Optional. The maximum time to wait for Angular to become stable. If not
         *    specified, whenStable() will wait forever.
         * @param updateCb Optional. If specified, this callback will be invoked whenever the set of
         *    pending macrotasks changes. If this callback returns true doneCb will not be invoked
         *    and no further updates will be issued.
         */
        whenStable(doneCb, timeout, updateCb) {
            if (updateCb && !this.taskTrackingZone) {
                throw new Error('Task tracking zone is required when passing an update callback to ' +
                    'whenStable(). Is "zone.js/dist/task-tracking.js" loaded?');
            }
            // These arguments are 'Function' above to keep the public API simple.
            this.addCallback(doneCb, timeout, updateCb);
            this._runCallbacksIfReady();
        }
        /**
         * Get the number of pending requests
         * @deprecated pending requests are now tracked with zones
         */
        getPendingRequestCount() {
            return this._pendingCount;
        }
        /**
         * Find providers by name
         * @param using The root element to search from
         * @param provider The name of binding variable
         * @param exactMatch Whether using exactMatch
         */
        findProviders(using, provider, exactMatch) {
            // TODO(juliemr): implement.
            return [];
        }
    }
    Testability.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    Testability.ctorParameters = () => [
        { type: NgZone }
    ];
    return Testability;
})();
export { Testability };
/**
 * A global registry of {@link Testability} instances for specific elements.
 * @publicApi
 */
let TestabilityRegistry = /** @class */ (() => {
    class TestabilityRegistry {
        constructor() {
            /** @internal */
            this._applications = new Map();
            _testabilityGetter.addToWindow(this);
        }
        /**
         * Registers an application with a testability hook so that it can be tracked
         * @param token token of application, root element
         * @param testability Testability hook
         */
        registerApplication(token, testability) {
            this._applications.set(token, testability);
        }
        /**
         * Unregisters an application.
         * @param token token of application, root element
         */
        unregisterApplication(token) {
            this._applications.delete(token);
        }
        /**
         * Unregisters all applications
         */
        unregisterAllApplications() {
            this._applications.clear();
        }
        /**
         * Get a testability hook associated with the application
         * @param elem root element
         */
        getTestability(elem) {
            return this._applications.get(elem) || null;
        }
        /**
         * Get all registered testabilities
         */
        getAllTestabilities() {
            return Array.from(this._applications.values());
        }
        /**
         * Get all registered applications(root elements)
         */
        getAllRootElements() {
            return Array.from(this._applications.keys());
        }
        /**
         * Find testability of a node in the Tree
         * @param elem node
         * @param findInAncestors whether finding testability in ancestors if testability was not found in
         * current node
         */
        findTestabilityInTree(elem, findInAncestors = true) {
            return _testabilityGetter.findTestabilityInTree(this, elem, findInAncestors);
        }
    }
    TestabilityRegistry.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    TestabilityRegistry.ctorParameters = () => [];
    return TestabilityRegistry;
})();
export { TestabilityRegistry };
class _NoopGetTestability {
    addToWindow(registry) { }
    findTestabilityInTree(registry, elem, findInAncestors) {
        return null;
    }
}
/**
 * Set the {@link GetTestability} implementation used by the Angular testing framework.
 * @publicApi
 */
export function setTestabilityGetter(getter) {
    _testabilityGetter = getter;
}
let _testabilityGetter = new _NoopGetTestability();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy90ZXN0YWJpbGl0eS90ZXN0YWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ2pDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQXdDdkM7Ozs7O0dBS0c7QUFDSDtJQUFBLE1BQ2EsV0FBVztRQWN0QixZQUFvQixPQUFlO1lBQWYsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQWIzQixrQkFBYSxHQUFXLENBQUMsQ0FBQztZQUMxQixrQkFBYSxHQUFZLElBQUksQ0FBQztZQUN0Qzs7Ozs7ZUFLRztZQUNLLGFBQVEsR0FBWSxLQUFLLENBQUM7WUFDMUIsZUFBVSxHQUFtQixFQUFFLENBQUM7WUFFaEMscUJBQWdCLEdBQThCLElBQUksQ0FBQztZQUd6RCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQkFDZixJQUFJLENBQUMsZ0JBQWdCO29CQUNqQixPQUFPLElBQUksSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUMvRSxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxtQkFBbUI7WUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO2dCQUNoQyxJQUFJLEVBQUUsR0FBRyxFQUFFO29CQUNULElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUNyQixJQUFJLENBQUMsYUFB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QztRQUNqRCxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxrQkFBa0I7WUFDaEIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQ7Ozs7O1dBS0c7UUFDSCxxQkFBcUIsQ0FBQyxJQUFVLEVBQUUsa0JBQTJCLElBQUk7WUFDL0QsT0FBTyxrQkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQy9FLENBQUM7OztnQkEvREYsVUFBVTs7OztJQWdFWCwwQkFBQztLQUFBO1NBL0RZLG1CQUFtQjtBQTZFaEMsTUFBTSxtQkFBbUI7SUFDdkIsV0FBVyxDQUFDLFFBQTZCLElBQVMsQ0FBQztJQUNuRCxxQkFBcUIsQ0FBQyxRQUE2QixFQUFFLElBQVMsRUFBRSxlQUF3QjtRQUV0RixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxNQUFzQjtJQUN6RCxrQkFBa0IsR0FBRyxNQUFNLENBQUM7QUFDOUIsQ0FBQztBQUVELElBQUksa0JBQWtCLEdBQW1CLElBQUksbUJBQW1CLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7c2NoZWR1bGVNaWNyb1Rhc2t9IGZyb20gJy4uL3V0aWwvbWljcm90YXNrJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lL25nX3pvbmUnO1xuXG4vKipcbiAqIFRlc3RhYmlsaXR5IEFQSS5cbiAqIGBkZWNsYXJlYCBrZXl3b3JkIGNhdXNlcyB0c2lja2xlIHRvIGdlbmVyYXRlIGV4dGVybnMsIHNvIHRoZXNlIG1ldGhvZHMgYXJlXG4gKiBub3QgcmVuYW1lZCBieSBDbG9zdXJlIENvbXBpbGVyLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgUHVibGljVGVzdGFiaWxpdHkge1xuICBpc1N0YWJsZSgpOiBib29sZWFuO1xuICB3aGVuU3RhYmxlKGNhbGxiYWNrOiBGdW5jdGlvbiwgdGltZW91dD86IG51bWJlciwgdXBkYXRlQ2FsbGJhY2s/OiBGdW5jdGlvbik6IHZvaWQ7XG4gIGZpbmRQcm92aWRlcnModXNpbmc6IGFueSwgcHJvdmlkZXI6IHN0cmluZywgZXhhY3RNYXRjaDogYm9vbGVhbik6IGFueVtdO1xufVxuXG4vLyBBbmd1bGFyIGludGVybmFsLCBub3QgaW50ZW5kZWQgZm9yIHB1YmxpYyBBUEkuXG5leHBvcnQgaW50ZXJmYWNlIFBlbmRpbmdNYWNyb3Rhc2sge1xuICBzb3VyY2U6IHN0cmluZztcbiAgY3JlYXRpb25Mb2NhdGlvbjogRXJyb3I7XG4gIHJ1bkNvdW50PzogbnVtYmVyO1xuICBkYXRhPzogVGFza0RhdGE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFza0RhdGEge1xuICB0YXJnZXQ/OiBYTUxIdHRwUmVxdWVzdDtcbiAgZGVsYXk/OiBudW1iZXI7XG4gIGlzUGVyaW9kaWM/OiBib29sZWFuO1xufVxuXG4vLyBBbmd1bGFyIGludGVybmFsLCBub3QgaW50ZW5kZWQgZm9yIHB1YmxpYyBBUEkuXG5leHBvcnQgdHlwZSBEb25lQ2FsbGJhY2sgPSAoZGlkV29yazogYm9vbGVhbiwgdGFza3M/OiBQZW5kaW5nTWFjcm90YXNrW10pID0+IHZvaWQ7XG5leHBvcnQgdHlwZSBVcGRhdGVDYWxsYmFjayA9ICh0YXNrczogUGVuZGluZ01hY3JvdGFza1tdKSA9PiBib29sZWFuO1xuXG5pbnRlcmZhY2UgV2FpdENhbGxiYWNrIHtcbiAgLy8gTmVlZHMgdG8gYmUgJ2FueScgLSBzZXRUaW1lb3V0IHJldHVybnMgYSBudW1iZXIgYWNjb3JkaW5nIHRvIEVTNiwgYnV0XG4gIC8vIG9uIE5vZGVKUyBpdCByZXR1cm5zIGEgVGltZXIuXG4gIHRpbWVvdXRJZDogYW55O1xuICBkb25lQ2I6IERvbmVDYWxsYmFjaztcbiAgdXBkYXRlQ2I/OiBVcGRhdGVDYWxsYmFjaztcbn1cblxuLyoqXG4gKiBUaGUgVGVzdGFiaWxpdHkgc2VydmljZSBwcm92aWRlcyB0ZXN0aW5nIGhvb2tzIHRoYXQgY2FuIGJlIGFjY2Vzc2VkIGZyb21cbiAqIHRoZSBicm93c2VyIGFuZCBieSBzZXJ2aWNlcyBzdWNoIGFzIFByb3RyYWN0b3IuIEVhY2ggYm9vdHN0cmFwcGVkIEFuZ3VsYXJcbiAqIGFwcGxpY2F0aW9uIG9uIHRoZSBwYWdlIHdpbGwgaGF2ZSBhbiBpbnN0YW5jZSBvZiBUZXN0YWJpbGl0eS5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFRlc3RhYmlsaXR5IGltcGxlbWVudHMgUHVibGljVGVzdGFiaWxpdHkge1xuICBwcml2YXRlIF9wZW5kaW5nQ291bnQ6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgX2lzWm9uZVN0YWJsZTogYm9vbGVhbiA9IHRydWU7XG4gIC8qKlxuICAgKiBXaGV0aGVyIGFueSB3b3JrIHdhcyBkb25lIHNpbmNlIHRoZSBsYXN0ICd3aGVuU3RhYmxlJyBjYWxsYmFjay4gVGhpcyBpc1xuICAgKiB1c2VmdWwgdG8gZGV0ZWN0IGlmIHRoaXMgY291bGQgaGF2ZSBwb3RlbnRpYWxseSBkZXN0YWJpbGl6ZWQgYW5vdGhlclxuICAgKiBjb21wb25lbnQgd2hpbGUgaXQgaXMgc3RhYmlsaXppbmcuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfZGlkV29yazogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9jYWxsYmFja3M6IFdhaXRDYWxsYmFja1tdID0gW107XG5cbiAgcHJpdmF0ZSB0YXNrVHJhY2tpbmdab25lOiB7bWFjcm9UYXNrczogVGFza1tdfXxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSkge1xuICAgIHRoaXMuX3dhdGNoQW5ndWxhckV2ZW50cygpO1xuICAgIF9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIHRoaXMudGFza1RyYWNraW5nWm9uZSA9XG4gICAgICAgICAgdHlwZW9mIFpvbmUgPT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogWm9uZS5jdXJyZW50LmdldCgnVGFza1RyYWNraW5nWm9uZScpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfd2F0Y2hBbmd1bGFyRXZlbnRzKCk6IHZvaWQge1xuICAgIHRoaXMuX25nWm9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSh7XG4gICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgIHRoaXMuX2RpZFdvcmsgPSB0cnVlO1xuICAgICAgICB0aGlzLl9pc1pvbmVTdGFibGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLl9uZ1pvbmUub25TdGFibGUuc3Vic2NyaWJlKHtcbiAgICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICAgIE5nWm9uZS5hc3NlcnROb3RJbkFuZ3VsYXJab25lKCk7XG4gICAgICAgICAgc2NoZWR1bGVNaWNyb1Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5faXNab25lU3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3J1bkNhbGxiYWNrc0lmUmVhZHkoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5jcmVhc2VzIHRoZSBudW1iZXIgb2YgcGVuZGluZyByZXF1ZXN0XG4gICAqIEBkZXByZWNhdGVkIHBlbmRpbmcgcmVxdWVzdHMgYXJlIG5vdyB0cmFja2VkIHdpdGggem9uZXMuXG4gICAqL1xuICBpbmNyZWFzZVBlbmRpbmdSZXF1ZXN0Q291bnQoKTogbnVtYmVyIHtcbiAgICB0aGlzLl9wZW5kaW5nQ291bnQgKz0gMTtcbiAgICB0aGlzLl9kaWRXb3JrID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5fcGVuZGluZ0NvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIERlY3JlYXNlcyB0aGUgbnVtYmVyIG9mIHBlbmRpbmcgcmVxdWVzdFxuICAgKiBAZGVwcmVjYXRlZCBwZW5kaW5nIHJlcXVlc3RzIGFyZSBub3cgdHJhY2tlZCB3aXRoIHpvbmVzXG4gICAqL1xuICBkZWNyZWFzZVBlbmRpbmdSZXF1ZXN0Q291bnQoKTogbnVtYmVyIHtcbiAgICB0aGlzLl9wZW5kaW5nQ291bnQgLT0gMTtcbiAgICBpZiAodGhpcy5fcGVuZGluZ0NvdW50IDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdwZW5kaW5nIGFzeW5jIHJlcXVlc3RzIGJlbG93IHplcm8nKTtcbiAgICB9XG4gICAgdGhpcy5fcnVuQ2FsbGJhY2tzSWZSZWFkeSgpO1xuICAgIHJldHVybiB0aGlzLl9wZW5kaW5nQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciBhbiBhc3NvY2lhdGVkIGFwcGxpY2F0aW9uIGlzIHN0YWJsZVxuICAgKi9cbiAgaXNTdGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzWm9uZVN0YWJsZSAmJiB0aGlzLl9wZW5kaW5nQ291bnQgPT09IDAgJiYgIXRoaXMuX25nWm9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcztcbiAgfVxuXG4gIHByaXZhdGUgX3J1bkNhbGxiYWNrc0lmUmVhZHkoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNTdGFibGUoKSkge1xuICAgICAgLy8gU2NoZWR1bGVzIHRoZSBjYWxsIGJhY2tzIGluIGEgbmV3IGZyYW1lIHNvIHRoYXQgaXQgaXMgYWx3YXlzIGFzeW5jLlxuICAgICAgc2NoZWR1bGVNaWNyb1Rhc2soKCkgPT4ge1xuICAgICAgICB3aGlsZSAodGhpcy5fY2FsbGJhY2tzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIGxldCBjYiA9IHRoaXMuX2NhbGxiYWNrcy5wb3AoKSE7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGNiLnRpbWVvdXRJZCk7XG4gICAgICAgICAgY2IuZG9uZUNiKHRoaXMuX2RpZFdvcmspO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RpZFdvcmsgPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTdGlsbCBub3Qgc3RhYmxlLCBzZW5kIHVwZGF0ZXMuXG4gICAgICBsZXQgcGVuZGluZyA9IHRoaXMuZ2V0UGVuZGluZ1Rhc2tzKCk7XG4gICAgICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MuZmlsdGVyKChjYikgPT4ge1xuICAgICAgICBpZiAoY2IudXBkYXRlQ2IgJiYgY2IudXBkYXRlQ2IocGVuZGluZykpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoY2IudGltZW91dElkKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9kaWRXb3JrID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFBlbmRpbmdUYXNrcygpOiBQZW5kaW5nTWFjcm90YXNrW10ge1xuICAgIGlmICghdGhpcy50YXNrVHJhY2tpbmdab25lKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgLy8gQ29weSB0aGUgdGFza3MgZGF0YSBzbyB0aGF0IHdlIGRvbid0IGxlYWsgdGFza3MuXG4gICAgcmV0dXJuIHRoaXMudGFza1RyYWNraW5nWm9uZS5tYWNyb1Rhc2tzLm1hcCgodDogVGFzaykgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc291cmNlOiB0LnNvdXJjZSxcbiAgICAgICAgLy8gRnJvbSBUYXNrVHJhY2tpbmdab25lOlxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci96b25lLmpzL2Jsb2IvbWFzdGVyL2xpYi96b25lLXNwZWMvdGFzay10cmFja2luZy50cyNMNDBcbiAgICAgICAgY3JlYXRpb25Mb2NhdGlvbjogKHQgYXMgYW55KS5jcmVhdGlvbkxvY2F0aW9uIGFzIEVycm9yLFxuICAgICAgICBkYXRhOiB0LmRhdGFcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFkZENhbGxiYWNrKGNiOiBEb25lQ2FsbGJhY2ssIHRpbWVvdXQ/OiBudW1iZXIsIHVwZGF0ZUNiPzogVXBkYXRlQ2FsbGJhY2spIHtcbiAgICBsZXQgdGltZW91dElkOiBhbnkgPSAtMTtcbiAgICBpZiAodGltZW91dCAmJiB0aW1lb3V0ID4gMCkge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcy5maWx0ZXIoKGNiKSA9PiBjYi50aW1lb3V0SWQgIT09IHRpbWVvdXRJZCk7XG4gICAgICAgIGNiKHRoaXMuX2RpZFdvcmssIHRoaXMuZ2V0UGVuZGluZ1Rhc2tzKCkpO1xuICAgICAgfSwgdGltZW91dCk7XG4gICAgfVxuICAgIHRoaXMuX2NhbGxiYWNrcy5wdXNoKDxXYWl0Q2FsbGJhY2s+e2RvbmVDYjogY2IsIHRpbWVvdXRJZDogdGltZW91dElkLCB1cGRhdGVDYjogdXBkYXRlQ2J9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXYWl0IGZvciB0aGUgYXBwbGljYXRpb24gdG8gYmUgc3RhYmxlIHdpdGggYSB0aW1lb3V0LiBJZiB0aGUgdGltZW91dCBpcyByZWFjaGVkIGJlZm9yZSB0aGF0XG4gICAqIGhhcHBlbnMsIHRoZSBjYWxsYmFjayByZWNlaXZlcyBhIGxpc3Qgb2YgdGhlIG1hY3JvIHRhc2tzIHRoYXQgd2VyZSBwZW5kaW5nLCBvdGhlcndpc2UgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIGRvbmVDYiBUaGUgY2FsbGJhY2sgdG8gaW52b2tlIHdoZW4gQW5ndWxhciBpcyBzdGFibGUgb3IgdGhlIHRpbWVvdXQgZXhwaXJlc1xuICAgKiAgICB3aGljaGV2ZXIgY29tZXMgZmlyc3QuXG4gICAqIEBwYXJhbSB0aW1lb3V0IE9wdGlvbmFsLiBUaGUgbWF4aW11bSB0aW1lIHRvIHdhaXQgZm9yIEFuZ3VsYXIgdG8gYmVjb21lIHN0YWJsZS4gSWYgbm90XG4gICAqICAgIHNwZWNpZmllZCwgd2hlblN0YWJsZSgpIHdpbGwgd2FpdCBmb3JldmVyLlxuICAgKiBAcGFyYW0gdXBkYXRlQ2IgT3B0aW9uYWwuIElmIHNwZWNpZmllZCwgdGhpcyBjYWxsYmFjayB3aWxsIGJlIGludm9rZWQgd2hlbmV2ZXIgdGhlIHNldCBvZlxuICAgKiAgICBwZW5kaW5nIG1hY3JvdGFza3MgY2hhbmdlcy4gSWYgdGhpcyBjYWxsYmFjayByZXR1cm5zIHRydWUgZG9uZUNiIHdpbGwgbm90IGJlIGludm9rZWRcbiAgICogICAgYW5kIG5vIGZ1cnRoZXIgdXBkYXRlcyB3aWxsIGJlIGlzc3VlZC5cbiAgICovXG4gIHdoZW5TdGFibGUoZG9uZUNiOiBGdW5jdGlvbiwgdGltZW91dD86IG51bWJlciwgdXBkYXRlQ2I/OiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGlmICh1cGRhdGVDYiAmJiAhdGhpcy50YXNrVHJhY2tpbmdab25lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ1Rhc2sgdHJhY2tpbmcgem9uZSBpcyByZXF1aXJlZCB3aGVuIHBhc3NpbmcgYW4gdXBkYXRlIGNhbGxiYWNrIHRvICcgK1xuICAgICAgICAgICd3aGVuU3RhYmxlKCkuIElzIFwiem9uZS5qcy9kaXN0L3Rhc2stdHJhY2tpbmcuanNcIiBsb2FkZWQ/Jyk7XG4gICAgfVxuICAgIC8vIFRoZXNlIGFyZ3VtZW50cyBhcmUgJ0Z1bmN0aW9uJyBhYm92ZSB0byBrZWVwIHRoZSBwdWJsaWMgQVBJIHNpbXBsZS5cbiAgICB0aGlzLmFkZENhbGxiYWNrKGRvbmVDYiBhcyBEb25lQ2FsbGJhY2ssIHRpbWVvdXQsIHVwZGF0ZUNiIGFzIFVwZGF0ZUNhbGxiYWNrKTtcbiAgICB0aGlzLl9ydW5DYWxsYmFja3NJZlJlYWR5KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgcGVuZGluZyByZXF1ZXN0c1xuICAgKiBAZGVwcmVjYXRlZCBwZW5kaW5nIHJlcXVlc3RzIGFyZSBub3cgdHJhY2tlZCB3aXRoIHpvbmVzXG4gICAqL1xuICBnZXRQZW5kaW5nUmVxdWVzdENvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kIHByb3ZpZGVycyBieSBuYW1lXG4gICAqIEBwYXJhbSB1c2luZyBUaGUgcm9vdCBlbGVtZW50IHRvIHNlYXJjaCBmcm9tXG4gICAqIEBwYXJhbSBwcm92aWRlciBUaGUgbmFtZSBvZiBiaW5kaW5nIHZhcmlhYmxlXG4gICAqIEBwYXJhbSBleGFjdE1hdGNoIFdoZXRoZXIgdXNpbmcgZXhhY3RNYXRjaFxuICAgKi9cbiAgZmluZFByb3ZpZGVycyh1c2luZzogYW55LCBwcm92aWRlcjogc3RyaW5nLCBleGFjdE1hdGNoOiBib29sZWFuKTogYW55W10ge1xuICAgIC8vIFRPRE8oanVsaWVtcik6IGltcGxlbWVudC5cbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuLyoqXG4gKiBBIGdsb2JhbCByZWdpc3RyeSBvZiB7QGxpbmsgVGVzdGFiaWxpdHl9IGluc3RhbmNlcyBmb3Igc3BlY2lmaWMgZWxlbWVudHMuXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBUZXN0YWJpbGl0eVJlZ2lzdHJ5IHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfYXBwbGljYXRpb25zID0gbmV3IE1hcDxhbnksIFRlc3RhYmlsaXR5PigpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIF90ZXN0YWJpbGl0eUdldHRlci5hZGRUb1dpbmRvdyh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYW4gYXBwbGljYXRpb24gd2l0aCBhIHRlc3RhYmlsaXR5IGhvb2sgc28gdGhhdCBpdCBjYW4gYmUgdHJhY2tlZFxuICAgKiBAcGFyYW0gdG9rZW4gdG9rZW4gb2YgYXBwbGljYXRpb24sIHJvb3QgZWxlbWVudFxuICAgKiBAcGFyYW0gdGVzdGFiaWxpdHkgVGVzdGFiaWxpdHkgaG9va1xuICAgKi9cbiAgcmVnaXN0ZXJBcHBsaWNhdGlvbih0b2tlbjogYW55LCB0ZXN0YWJpbGl0eTogVGVzdGFiaWxpdHkpIHtcbiAgICB0aGlzLl9hcHBsaWNhdGlvbnMuc2V0KHRva2VuLCB0ZXN0YWJpbGl0eSk7XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlcnMgYW4gYXBwbGljYXRpb24uXG4gICAqIEBwYXJhbSB0b2tlbiB0b2tlbiBvZiBhcHBsaWNhdGlvbiwgcm9vdCBlbGVtZW50XG4gICAqL1xuICB1bnJlZ2lzdGVyQXBwbGljYXRpb24odG9rZW46IGFueSkge1xuICAgIHRoaXMuX2FwcGxpY2F0aW9ucy5kZWxldGUodG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXJzIGFsbCBhcHBsaWNhdGlvbnNcbiAgICovXG4gIHVucmVnaXN0ZXJBbGxBcHBsaWNhdGlvbnMoKSB7XG4gICAgdGhpcy5fYXBwbGljYXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgdGVzdGFiaWxpdHkgaG9vayBhc3NvY2lhdGVkIHdpdGggdGhlIGFwcGxpY2F0aW9uXG4gICAqIEBwYXJhbSBlbGVtIHJvb3QgZWxlbWVudFxuICAgKi9cbiAgZ2V0VGVzdGFiaWxpdHkoZWxlbTogYW55KTogVGVzdGFiaWxpdHl8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2FwcGxpY2F0aW9ucy5nZXQoZWxlbSkgfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHJlZ2lzdGVyZWQgdGVzdGFiaWxpdGllc1xuICAgKi9cbiAgZ2V0QWxsVGVzdGFiaWxpdGllcygpOiBUZXN0YWJpbGl0eVtdIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl9hcHBsaWNhdGlvbnMudmFsdWVzKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgcmVnaXN0ZXJlZCBhcHBsaWNhdGlvbnMocm9vdCBlbGVtZW50cylcbiAgICovXG4gIGdldEFsbFJvb3RFbGVtZW50cygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fYXBwbGljYXRpb25zLmtleXMoKSk7XG4gIH1cblxuICAvKipcbiAgICogRmluZCB0ZXN0YWJpbGl0eSBvZiBhIG5vZGUgaW4gdGhlIFRyZWVcbiAgICogQHBhcmFtIGVsZW0gbm9kZVxuICAgKiBAcGFyYW0gZmluZEluQW5jZXN0b3JzIHdoZXRoZXIgZmluZGluZyB0ZXN0YWJpbGl0eSBpbiBhbmNlc3RvcnMgaWYgdGVzdGFiaWxpdHkgd2FzIG5vdCBmb3VuZCBpblxuICAgKiBjdXJyZW50IG5vZGVcbiAgICovXG4gIGZpbmRUZXN0YWJpbGl0eUluVHJlZShlbGVtOiBOb2RlLCBmaW5kSW5BbmNlc3RvcnM6IGJvb2xlYW4gPSB0cnVlKTogVGVzdGFiaWxpdHl8bnVsbCB7XG4gICAgcmV0dXJuIF90ZXN0YWJpbGl0eUdldHRlci5maW5kVGVzdGFiaWxpdHlJblRyZWUodGhpcywgZWxlbSwgZmluZEluQW5jZXN0b3JzKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkYXB0ZXIgaW50ZXJmYWNlIGZvciByZXRyaWV2aW5nIHRoZSBgVGVzdGFiaWxpdHlgIHNlcnZpY2UgYXNzb2NpYXRlZCBmb3IgYVxuICogcGFydGljdWxhciBjb250ZXh0LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBHZXRUZXN0YWJpbGl0eSB7XG4gIGFkZFRvV2luZG93KHJlZ2lzdHJ5OiBUZXN0YWJpbGl0eVJlZ2lzdHJ5KTogdm9pZDtcbiAgZmluZFRlc3RhYmlsaXR5SW5UcmVlKHJlZ2lzdHJ5OiBUZXN0YWJpbGl0eVJlZ2lzdHJ5LCBlbGVtOiBhbnksIGZpbmRJbkFuY2VzdG9yczogYm9vbGVhbik6XG4gICAgICBUZXN0YWJpbGl0eXxudWxsO1xufVxuXG5jbGFzcyBfTm9vcEdldFRlc3RhYmlsaXR5IGltcGxlbWVudHMgR2V0VGVzdGFiaWxpdHkge1xuICBhZGRUb1dpbmRvdyhyZWdpc3RyeTogVGVzdGFiaWxpdHlSZWdpc3RyeSk6IHZvaWQge31cbiAgZmluZFRlc3RhYmlsaXR5SW5UcmVlKHJlZ2lzdHJ5OiBUZXN0YWJpbGl0eVJlZ2lzdHJ5LCBlbGVtOiBhbnksIGZpbmRJbkFuY2VzdG9yczogYm9vbGVhbik6XG4gICAgICBUZXN0YWJpbGl0eXxudWxsIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUge0BsaW5rIEdldFRlc3RhYmlsaXR5fSBpbXBsZW1lbnRhdGlvbiB1c2VkIGJ5IHRoZSBBbmd1bGFyIHRlc3RpbmcgZnJhbWV3b3JrLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0VGVzdGFiaWxpdHlHZXR0ZXIoZ2V0dGVyOiBHZXRUZXN0YWJpbGl0eSk6IHZvaWQge1xuICBfdGVzdGFiaWxpdHlHZXR0ZXIgPSBnZXR0ZXI7XG59XG5cbmxldCBfdGVzdGFiaWxpdHlHZXR0ZXI6IEdldFRlc3RhYmlsaXR5ID0gbmV3IF9Ob29wR2V0VGVzdGFiaWxpdHkoKTtcbiJdfQ==