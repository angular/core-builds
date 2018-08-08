import * as i0 from "../r3_symbols";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '../di';
import { scheduleMicroTask } from '../util';
import { NgZone } from '../zone/ng_zone';
/**
 * The Testability service provides testing hooks that can be accessed from
 * the browser and by services such as Protractor. Each bootstrapped Angular
 * application on the page will have an instance of Testability.
 * @experimental
 */
export class Testability {
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
        this._watchAngularEvents();
        _ngZone.run(() => { this.taskTrackingZone = Zone.current.get('TaskTrackingZone'); });
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
    getPendingRequestCount() { return this._pendingCount; }
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
Testability.ngInjectableDef = i0.defineInjectable({ token: Testability, factory: function Testability_Factory() { return new Testability(i0.inject(NgZone)); }, providedIn: null });
/**
 * A global registry of {@link Testability} instances for specific elements.
 * @experimental
 */
export class TestabilityRegistry {
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
    unregisterApplication(token) { this._applications.delete(token); }
    /**
     * Unregisters all applications
     */
    unregisterAllApplications() { this._applications.clear(); }
    /**
     * Get a testability hook associated with the application
     * @param elem root element
     */
    getTestability(elem) { return this._applications.get(elem) || null; }
    /**
     * Get all registered testabilities
     */
    getAllTestabilities() { return Array.from(this._applications.values()); }
    /**
     * Get all registered applications(root elements)
     */
    getAllRootElements() { return Array.from(this._applications.keys()); }
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
TestabilityRegistry.ngInjectableDef = i0.defineInjectable({ token: TestabilityRegistry, factory: function TestabilityRegistry_Factory() { return new TestabilityRegistry(); }, providedIn: null });
class _NoopGetTestability {
    addToWindow(registry) { }
    findTestabilityInTree(registry, elem, findInAncestors) {
        return null;
    }
}
/**
 * Set the {@link GetTestability} implementation used by the Angular testing framework.
 * @experimental
 */
export function setTestabilityGetter(getter) {
    _testabilityGetter = getter;
}
let _testabilityGetter = new _NoopGetTestability();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy90ZXN0YWJpbGl0eS90ZXN0YWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUNqQyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBd0N2Qzs7Ozs7R0FLRztBQUVILE1BQU07SUFjSixZQUFvQixPQUFlO1FBQWYsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQWIzQixrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQixrQkFBYSxHQUFZLElBQUksQ0FBQztRQUN0Qzs7Ozs7V0FLRztRQUNLLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFDMUIsZUFBVSxHQUFtQixFQUFFLENBQUM7UUFLdEMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFTyxtQkFBbUI7UUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQ2hDLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBQ1QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQzdCLENBQUM7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtZQUNsQyxJQUFJ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QkFBMkIsSUFBSTtRQUMvRCxPQUFPLGtCQUFrQixDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDL0UsQ0FBQzs7bUVBbERVLG1CQUFtQiwrREFBbkIsbUJBQW1CO0FBa0VoQztJQUNFLFdBQVcsQ0FBQyxRQUE2QixJQUFTLENBQUM7SUFDbkQscUJBQXFCLENBQUMsUUFBNkIsRUFBRSxJQUFTLEVBQUUsZUFBd0I7UUFFdEYsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLCtCQUErQixNQUFzQjtJQUN6RCxrQkFBa0IsR0FBRyxNQUFNLENBQUM7QUFDOUIsQ0FBQztBQUVELElBQUksa0JBQWtCLEdBQW1CLElBQUksbUJBQW1CLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3NjaGVkdWxlTWljcm9UYXNrfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lL25nX3pvbmUnO1xuXG4vKipcbiAqIFRlc3RhYmlsaXR5IEFQSS5cbiAqIGBkZWNsYXJlYCBrZXl3b3JkIGNhdXNlcyB0c2lja2xlIHRvIGdlbmVyYXRlIGV4dGVybnMsIHNvIHRoZXNlIG1ldGhvZHMgYXJlXG4gKiBub3QgcmVuYW1lZCBieSBDbG9zdXJlIENvbXBpbGVyLlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgUHVibGljVGVzdGFiaWxpdHkge1xuICBpc1N0YWJsZSgpOiBib29sZWFuO1xuICB3aGVuU3RhYmxlKGNhbGxiYWNrOiBGdW5jdGlvbiwgdGltZW91dD86IG51bWJlciwgdXBkYXRlQ2FsbGJhY2s/OiBGdW5jdGlvbik6IHZvaWQ7XG4gIGZpbmRQcm92aWRlcnModXNpbmc6IGFueSwgcHJvdmlkZXI6IHN0cmluZywgZXhhY3RNYXRjaDogYm9vbGVhbik6IGFueVtdO1xufVxuXG4vLyBBbmd1bGFyIGludGVybmFsLCBub3QgaW50ZW5kZWQgZm9yIHB1YmxpYyBBUEkuXG5leHBvcnQgaW50ZXJmYWNlIFBlbmRpbmdNYWNyb3Rhc2sge1xuICBzb3VyY2U6IHN0cmluZztcbiAgY3JlYXRpb25Mb2NhdGlvbjogRXJyb3I7XG4gIHJ1bkNvdW50PzogbnVtYmVyO1xuICBkYXRhOiBUYXNrRGF0YTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXNrRGF0YSB7XG4gIHRhcmdldD86IFhNTEh0dHBSZXF1ZXN0O1xuICBkZWxheT86IG51bWJlcjtcbiAgaXNQZXJpb2RpYz86IGJvb2xlYW47XG59XG5cbi8vIEFuZ3VsYXIgaW50ZXJuYWwsIG5vdCBpbnRlbmRlZCBmb3IgcHVibGljIEFQSS5cbmV4cG9ydCB0eXBlIERvbmVDYWxsYmFjayA9IChkaWRXb3JrOiBib29sZWFuLCB0YXNrcz86IFBlbmRpbmdNYWNyb3Rhc2tbXSkgPT4gdm9pZDtcbmV4cG9ydCB0eXBlIFVwZGF0ZUNhbGxiYWNrID0gKHRhc2tzOiBQZW5kaW5nTWFjcm90YXNrW10pID0+IGJvb2xlYW47XG5cbmludGVyZmFjZSBXYWl0Q2FsbGJhY2sge1xuICAvLyBOZWVkcyB0byBiZSAnYW55JyAtIHNldFRpbWVvdXQgcmV0dXJucyBhIG51bWJlciBhY2NvcmRpbmcgdG8gRVM2LCBidXRcbiAgLy8gb24gTm9kZUpTIGl0IHJldHVybnMgYSBUaW1lci5cbiAgdGltZW91dElkOiBhbnk7XG4gIGRvbmVDYjogRG9uZUNhbGxiYWNrO1xuICB1cGRhdGVDYj86IFVwZGF0ZUNhbGxiYWNrO1xufVxuXG4vKipcbiAqIFRoZSBUZXN0YWJpbGl0eSBzZXJ2aWNlIHByb3ZpZGVzIHRlc3RpbmcgaG9va3MgdGhhdCBjYW4gYmUgYWNjZXNzZWQgZnJvbVxuICogdGhlIGJyb3dzZXIgYW5kIGJ5IHNlcnZpY2VzIHN1Y2ggYXMgUHJvdHJhY3Rvci4gRWFjaCBib290c3RyYXBwZWQgQW5ndWxhclxuICogYXBwbGljYXRpb24gb24gdGhlIHBhZ2Ugd2lsbCBoYXZlIGFuIGluc3RhbmNlIG9mIFRlc3RhYmlsaXR5LlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVGVzdGFiaWxpdHkgaW1wbGVtZW50cyBQdWJsaWNUZXN0YWJpbGl0eSB7XG4gIHByaXZhdGUgX3BlbmRpbmdDb3VudDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBfaXNab25lU3RhYmxlOiBib29sZWFuID0gdHJ1ZTtcbiAgLyoqXG4gICAqIFdoZXRoZXIgYW55IHdvcmsgd2FzIGRvbmUgc2luY2UgdGhlIGxhc3QgJ3doZW5TdGFibGUnIGNhbGxiYWNrLiBUaGlzIGlzXG4gICAqIHVzZWZ1bCB0byBkZXRlY3QgaWYgdGhpcyBjb3VsZCBoYXZlIHBvdGVudGlhbGx5IGRlc3RhYmlsaXplZCBhbm90aGVyXG4gICAqIGNvbXBvbmVudCB3aGlsZSBpdCBpcyBzdGFiaWxpemluZy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9kaWRXb3JrOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2NhbGxiYWNrczogV2FpdENhbGxiYWNrW10gPSBbXTtcblxuICBwcml2YXRlIHRhc2tUcmFja2luZ1pvbmU6IGFueTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSkge1xuICAgIHRoaXMuX3dhdGNoQW5ndWxhckV2ZW50cygpO1xuICAgIF9uZ1pvbmUucnVuKCgpID0+IHsgdGhpcy50YXNrVHJhY2tpbmdab25lID0gWm9uZS5jdXJyZW50LmdldCgnVGFza1RyYWNraW5nWm9uZScpOyB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3dhdGNoQW5ndWxhckV2ZW50cygpOiB2b2lkIHtcbiAgICB0aGlzLl9uZ1pvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoe1xuICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICB0aGlzLl9kaWRXb3JrID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5faXNab25lU3RhYmxlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fbmdab25lLm9uU3RhYmxlLnN1YnNjcmliZSh7XG4gICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICBOZ1pvbmUuYXNzZXJ0Tm90SW5Bbmd1bGFyWm9uZSgpO1xuICAgICAgICAgIHNjaGVkdWxlTWljcm9UYXNrKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2lzWm9uZVN0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9ydW5DYWxsYmFja3NJZlJlYWR5KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluY3JlYXNlcyB0aGUgbnVtYmVyIG9mIHBlbmRpbmcgcmVxdWVzdFxuICAgKiBAZGVwcmVjYXRlZCBwZW5kaW5nIHJlcXVlc3RzIGFyZSBub3cgdHJhY2tlZCB3aXRoIHpvbmVzLlxuICAgKi9cbiAgaW5jcmVhc2VQZW5kaW5nUmVxdWVzdENvdW50KCk6IG51bWJlciB7XG4gICAgdGhpcy5fcGVuZGluZ0NvdW50ICs9IDE7XG4gICAgdGhpcy5fZGlkV29yayA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNyZWFzZXMgdGhlIG51bWJlciBvZiBwZW5kaW5nIHJlcXVlc3RcbiAgICogQGRlcHJlY2F0ZWQgcGVuZGluZyByZXF1ZXN0cyBhcmUgbm93IHRyYWNrZWQgd2l0aCB6b25lc1xuICAgKi9cbiAgZGVjcmVhc2VQZW5kaW5nUmVxdWVzdENvdW50KCk6IG51bWJlciB7XG4gICAgdGhpcy5fcGVuZGluZ0NvdW50IC09IDE7XG4gICAgaWYgKHRoaXMuX3BlbmRpbmdDb3VudCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncGVuZGluZyBhc3luYyByZXF1ZXN0cyBiZWxvdyB6ZXJvJyk7XG4gICAgfVxuICAgIHRoaXMuX3J1bkNhbGxiYWNrc0lmUmVhZHkoKTtcbiAgICByZXR1cm4gdGhpcy5fcGVuZGluZ0NvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYW4gYXNzb2NpYXRlZCBhcHBsaWNhdGlvbiBpcyBzdGFibGVcbiAgICovXG4gIGlzU3RhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc1pvbmVTdGFibGUgJiYgdGhpcy5fcGVuZGluZ0NvdW50ID09PSAwICYmICF0aGlzLl9uZ1pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3M7XG4gIH1cblxuICBwcml2YXRlIF9ydW5DYWxsYmFja3NJZlJlYWR5KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzU3RhYmxlKCkpIHtcbiAgICAgIC8vIFNjaGVkdWxlcyB0aGUgY2FsbCBiYWNrcyBpbiBhIG5ldyBmcmFtZSBzbyB0aGF0IGl0IGlzIGFsd2F5cyBhc3luYy5cbiAgICAgIHNjaGVkdWxlTWljcm9UYXNrKCgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2NhbGxiYWNrcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICBsZXQgY2IgPSB0aGlzLl9jYWxsYmFja3MucG9wKCkgITtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoY2IudGltZW91dElkKTtcbiAgICAgICAgICBjYi5kb25lQ2IodGhpcy5fZGlkV29yayk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGlkV29yayA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFN0aWxsIG5vdCBzdGFibGUsIHNlbmQgdXBkYXRlcy5cbiAgICAgIGxldCBwZW5kaW5nID0gdGhpcy5nZXRQZW5kaW5nVGFza3MoKTtcbiAgICAgIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcy5maWx0ZXIoKGNiKSA9PiB7XG4gICAgICAgIGlmIChjYi51cGRhdGVDYiAmJiBjYi51cGRhdGVDYihwZW5kaW5nKSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjYi50aW1lb3V0SWQpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX2RpZFdvcmsgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0UGVuZGluZ1Rhc2tzKCk6IFBlbmRpbmdNYWNyb3Rhc2tbXSB7XG4gICAgaWYgKCF0aGlzLnRhc2tUcmFja2luZ1pvbmUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICAvLyBDb3B5IHRoZSB0YXNrcyBkYXRhIHNvIHRoYXQgd2UgZG9uJ3QgbGVhayB0YXNrcy5cbiAgICByZXR1cm4gdGhpcy50YXNrVHJhY2tpbmdab25lLm1hY3JvVGFza3MubWFwKCh0OiBUYXNrKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzb3VyY2U6IHQuc291cmNlLFxuICAgICAgICAvLyBGcm9tIFRhc2tUcmFja2luZ1pvbmU6XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3pvbmUuanMvYmxvYi9tYXN0ZXIvbGliL3pvbmUtc3BlYy90YXNrLXRyYWNraW5nLnRzI0w0MFxuICAgICAgICBjcmVhdGlvbkxvY2F0aW9uOiAodCBhcyBhbnkpLmNyZWF0aW9uTG9jYXRpb24gYXMgRXJyb3IsXG4gICAgICAgIGRhdGE6IHQuZGF0YVxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQ2FsbGJhY2soY2I6IERvbmVDYWxsYmFjaywgdGltZW91dD86IG51bWJlciwgdXBkYXRlQ2I/OiBVcGRhdGVDYWxsYmFjaykge1xuICAgIGxldCB0aW1lb3V0SWQ6IGFueSA9IC0xO1xuICAgIGlmICh0aW1lb3V0ICYmIHRpbWVvdXQgPiAwKSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzLmZpbHRlcigoY2IpID0+IGNiLnRpbWVvdXRJZCAhPT0gdGltZW91dElkKTtcbiAgICAgICAgY2IodGhpcy5fZGlkV29yaywgdGhpcy5nZXRQZW5kaW5nVGFza3MoKSk7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gICAgdGhpcy5fY2FsbGJhY2tzLnB1c2goPFdhaXRDYWxsYmFjaz57ZG9uZUNiOiBjYiwgdGltZW91dElkOiB0aW1lb3V0SWQsIHVwZGF0ZUNiOiB1cGRhdGVDYn0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdhaXQgZm9yIHRoZSBhcHBsaWNhdGlvbiB0byBiZSBzdGFibGUgd2l0aCBhIHRpbWVvdXQuIElmIHRoZSB0aW1lb3V0IGlzIHJlYWNoZWQgYmVmb3JlIHRoYXRcbiAgICogaGFwcGVucywgdGhlIGNhbGxiYWNrIHJlY2VpdmVzIGEgbGlzdCBvZiB0aGUgbWFjcm8gdGFza3MgdGhhdCB3ZXJlIHBlbmRpbmcsIG90aGVyd2lzZSBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gZG9uZUNiIFRoZSBjYWxsYmFjayB0byBpbnZva2Ugd2hlbiBBbmd1bGFyIGlzIHN0YWJsZSBvciB0aGUgdGltZW91dCBleHBpcmVzXG4gICAqICAgIHdoaWNoZXZlciBjb21lcyBmaXJzdC5cbiAgICogQHBhcmFtIHRpbWVvdXQgT3B0aW9uYWwuIFRoZSBtYXhpbXVtIHRpbWUgdG8gd2FpdCBmb3IgQW5ndWxhciB0byBiZWNvbWUgc3RhYmxlLiBJZiBub3RcbiAgICogICAgc3BlY2lmaWVkLCB3aGVuU3RhYmxlKCkgd2lsbCB3YWl0IGZvcmV2ZXIuXG4gICAqIEBwYXJhbSB1cGRhdGVDYiBPcHRpb25hbC4gSWYgc3BlY2lmaWVkLCB0aGlzIGNhbGxiYWNrIHdpbGwgYmUgaW52b2tlZCB3aGVuZXZlciB0aGUgc2V0IG9mXG4gICAqICAgIHBlbmRpbmcgbWFjcm90YXNrcyBjaGFuZ2VzLiBJZiB0aGlzIGNhbGxiYWNrIHJldHVybnMgdHJ1ZSBkb25lQ2Igd2lsbCBub3QgYmUgaW52b2tlZFxuICAgKiAgICBhbmQgbm8gZnVydGhlciB1cGRhdGVzIHdpbGwgYmUgaXNzdWVkLlxuICAgKi9cbiAgd2hlblN0YWJsZShkb25lQ2I6IEZ1bmN0aW9uLCB0aW1lb3V0PzogbnVtYmVyLCB1cGRhdGVDYj86IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgaWYgKHVwZGF0ZUNiICYmICF0aGlzLnRhc2tUcmFja2luZ1pvbmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnVGFzayB0cmFja2luZyB6b25lIGlzIHJlcXVpcmVkIHdoZW4gcGFzc2luZyBhbiB1cGRhdGUgY2FsbGJhY2sgdG8gJyArXG4gICAgICAgICAgJ3doZW5TdGFibGUoKS4gSXMgXCJ6b25lLmpzL2Rpc3QvdGFzay10cmFja2luZy5qc1wiIGxvYWRlZD8nKTtcbiAgICB9XG4gICAgLy8gVGhlc2UgYXJndW1lbnRzIGFyZSAnRnVuY3Rpb24nIGFib3ZlIHRvIGtlZXAgdGhlIHB1YmxpYyBBUEkgc2ltcGxlLlxuICAgIHRoaXMuYWRkQ2FsbGJhY2soZG9uZUNiIGFzIERvbmVDYWxsYmFjaywgdGltZW91dCwgdXBkYXRlQ2IgYXMgVXBkYXRlQ2FsbGJhY2spO1xuICAgIHRoaXMuX3J1bkNhbGxiYWNrc0lmUmVhZHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiBwZW5kaW5nIHJlcXVlc3RzXG4gICAqIEBkZXByZWNhdGVkIHBlbmRpbmcgcmVxdWVzdHMgYXJlIG5vdyB0cmFja2VkIHdpdGggem9uZXNcbiAgICovXG4gIGdldFBlbmRpbmdSZXF1ZXN0Q291bnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3BlbmRpbmdDb3VudDsgfVxuXG4gIC8qKlxuICAgKiBGaW5kIHByb3ZpZGVycyBieSBuYW1lXG4gICAqIEBwYXJhbSB1c2luZyBUaGUgcm9vdCBlbGVtZW50IHRvIHNlYXJjaCBmcm9tXG4gICAqIEBwYXJhbSBwcm92aWRlciBUaGUgbmFtZSBvZiBiaW5kaW5nIHZhcmlhYmxlXG4gICAqIEBwYXJhbSBleGFjdE1hdGNoIFdoZXRoZXIgdXNpbmcgZXhhY3RNYXRjaFxuICAgKi9cbiAgZmluZFByb3ZpZGVycyh1c2luZzogYW55LCBwcm92aWRlcjogc3RyaW5nLCBleGFjdE1hdGNoOiBib29sZWFuKTogYW55W10ge1xuICAgIC8vIFRPRE8oanVsaWVtcik6IGltcGxlbWVudC5cbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuLyoqXG4gKiBBIGdsb2JhbCByZWdpc3RyeSBvZiB7QGxpbmsgVGVzdGFiaWxpdHl9IGluc3RhbmNlcyBmb3Igc3BlY2lmaWMgZWxlbWVudHMuXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBUZXN0YWJpbGl0eVJlZ2lzdHJ5IHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfYXBwbGljYXRpb25zID0gbmV3IE1hcDxhbnksIFRlc3RhYmlsaXR5PigpO1xuXG4gIGNvbnN0cnVjdG9yKCkgeyBfdGVzdGFiaWxpdHlHZXR0ZXIuYWRkVG9XaW5kb3codGhpcyk7IH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGFuIGFwcGxpY2F0aW9uIHdpdGggYSB0ZXN0YWJpbGl0eSBob29rIHNvIHRoYXQgaXQgY2FuIGJlIHRyYWNrZWRcbiAgICogQHBhcmFtIHRva2VuIHRva2VuIG9mIGFwcGxpY2F0aW9uLCByb290IGVsZW1lbnRcbiAgICogQHBhcmFtIHRlc3RhYmlsaXR5IFRlc3RhYmlsaXR5IGhvb2tcbiAgICovXG4gIHJlZ2lzdGVyQXBwbGljYXRpb24odG9rZW46IGFueSwgdGVzdGFiaWxpdHk6IFRlc3RhYmlsaXR5KSB7XG4gICAgdGhpcy5fYXBwbGljYXRpb25zLnNldCh0b2tlbiwgdGVzdGFiaWxpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXJzIGFuIGFwcGxpY2F0aW9uLlxuICAgKiBAcGFyYW0gdG9rZW4gdG9rZW4gb2YgYXBwbGljYXRpb24sIHJvb3QgZWxlbWVudFxuICAgKi9cbiAgdW5yZWdpc3RlckFwcGxpY2F0aW9uKHRva2VuOiBhbnkpIHsgdGhpcy5fYXBwbGljYXRpb25zLmRlbGV0ZSh0b2tlbik7IH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlcnMgYWxsIGFwcGxpY2F0aW9uc1xuICAgKi9cbiAgdW5yZWdpc3RlckFsbEFwcGxpY2F0aW9ucygpIHsgdGhpcy5fYXBwbGljYXRpb25zLmNsZWFyKCk7IH1cblxuICAvKipcbiAgICogR2V0IGEgdGVzdGFiaWxpdHkgaG9vayBhc3NvY2lhdGVkIHdpdGggdGhlIGFwcGxpY2F0aW9uXG4gICAqIEBwYXJhbSBlbGVtIHJvb3QgZWxlbWVudFxuICAgKi9cbiAgZ2V0VGVzdGFiaWxpdHkoZWxlbTogYW55KTogVGVzdGFiaWxpdHl8bnVsbCB7IHJldHVybiB0aGlzLl9hcHBsaWNhdGlvbnMuZ2V0KGVsZW0pIHx8IG51bGw7IH1cblxuICAvKipcbiAgICogR2V0IGFsbCByZWdpc3RlcmVkIHRlc3RhYmlsaXRpZXNcbiAgICovXG4gIGdldEFsbFRlc3RhYmlsaXRpZXMoKTogVGVzdGFiaWxpdHlbXSB7IHJldHVybiBBcnJheS5mcm9tKHRoaXMuX2FwcGxpY2F0aW9ucy52YWx1ZXMoKSk7IH1cblxuICAvKipcbiAgICogR2V0IGFsbCByZWdpc3RlcmVkIGFwcGxpY2F0aW9ucyhyb290IGVsZW1lbnRzKVxuICAgKi9cbiAgZ2V0QWxsUm9vdEVsZW1lbnRzKCk6IGFueVtdIHsgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fYXBwbGljYXRpb25zLmtleXMoKSk7IH1cblxuICAvKipcbiAgICogRmluZCB0ZXN0YWJpbGl0eSBvZiBhIG5vZGUgaW4gdGhlIFRyZWVcbiAgICogQHBhcmFtIGVsZW0gbm9kZVxuICAgKiBAcGFyYW0gZmluZEluQW5jZXN0b3JzIHdoZXRoZXIgZmluZGluZyB0ZXN0YWJpbGl0eSBpbiBhbmNlc3RvcnMgaWYgdGVzdGFiaWxpdHkgd2FzIG5vdCBmb3VuZCBpblxuICAgKiBjdXJyZW50IG5vZGVcbiAgICovXG4gIGZpbmRUZXN0YWJpbGl0eUluVHJlZShlbGVtOiBOb2RlLCBmaW5kSW5BbmNlc3RvcnM6IGJvb2xlYW4gPSB0cnVlKTogVGVzdGFiaWxpdHl8bnVsbCB7XG4gICAgcmV0dXJuIF90ZXN0YWJpbGl0eUdldHRlci5maW5kVGVzdGFiaWxpdHlJblRyZWUodGhpcywgZWxlbSwgZmluZEluQW5jZXN0b3JzKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkYXB0ZXIgaW50ZXJmYWNlIGZvciByZXRyaWV2aW5nIHRoZSBgVGVzdGFiaWxpdHlgIHNlcnZpY2UgYXNzb2NpYXRlZCBmb3IgYVxuICogcGFydGljdWxhciBjb250ZXh0LlxuICpcbiAqIEBleHBlcmltZW50YWwgVGVzdGFiaWxpdHkgYXBpcyBhcmUgcHJpbWFyaWx5IGludGVuZGVkIHRvIGJlIHVzZWQgYnkgZTJlIHRlc3QgdG9vbCB2ZW5kb3JzIGxpa2VcbiAqIHRoZSBQcm90cmFjdG9yIHRlYW0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2V0VGVzdGFiaWxpdHkge1xuICBhZGRUb1dpbmRvdyhyZWdpc3RyeTogVGVzdGFiaWxpdHlSZWdpc3RyeSk6IHZvaWQ7XG4gIGZpbmRUZXN0YWJpbGl0eUluVHJlZShyZWdpc3RyeTogVGVzdGFiaWxpdHlSZWdpc3RyeSwgZWxlbTogYW55LCBmaW5kSW5BbmNlc3RvcnM6IGJvb2xlYW4pOlxuICAgICAgVGVzdGFiaWxpdHl8bnVsbDtcbn1cblxuY2xhc3MgX05vb3BHZXRUZXN0YWJpbGl0eSBpbXBsZW1lbnRzIEdldFRlc3RhYmlsaXR5IHtcbiAgYWRkVG9XaW5kb3cocmVnaXN0cnk6IFRlc3RhYmlsaXR5UmVnaXN0cnkpOiB2b2lkIHt9XG4gIGZpbmRUZXN0YWJpbGl0eUluVHJlZShyZWdpc3RyeTogVGVzdGFiaWxpdHlSZWdpc3RyeSwgZWxlbTogYW55LCBmaW5kSW5BbmNlc3RvcnM6IGJvb2xlYW4pOlxuICAgICAgVGVzdGFiaWxpdHl8bnVsbCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgdGhlIHtAbGluayBHZXRUZXN0YWJpbGl0eX0gaW1wbGVtZW50YXRpb24gdXNlZCBieSB0aGUgQW5ndWxhciB0ZXN0aW5nIGZyYW1ld29yay5cbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFRlc3RhYmlsaXR5R2V0dGVyKGdldHRlcjogR2V0VGVzdGFiaWxpdHkpOiB2b2lkIHtcbiAgX3Rlc3RhYmlsaXR5R2V0dGVyID0gZ2V0dGVyO1xufVxuXG5sZXQgX3Rlc3RhYmlsaXR5R2V0dGVyOiBHZXRUZXN0YWJpbGl0eSA9IG5ldyBfTm9vcEdldFRlc3RhYmlsaXR5KCk7XG4iXX0=