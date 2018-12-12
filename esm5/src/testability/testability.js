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
import * as i0 from "../r3_symbols";
/**
 * The Testability service provides testing hooks that can be accessed from
 * the browser and by services such as Protractor. Each bootstrapped Angular
 * application on the page will have an instance of Testability.
 * @publicApi
 */
var Testability = /** @class */ (function () {
    function Testability(_ngZone) {
        var _this = this;
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
        _ngZone.run(function () {
            _this.taskTrackingZone =
                typeof Zone == 'undefined' ? null : Zone.current.get('TaskTrackingZone');
        });
    }
    Testability.prototype._watchAngularEvents = function () {
        var _this = this;
        this._ngZone.onUnstable.subscribe({
            next: function () {
                _this._didWork = true;
                _this._isZoneStable = false;
            }
        });
        this._ngZone.runOutsideAngular(function () {
            _this._ngZone.onStable.subscribe({
                next: function () {
                    NgZone.assertNotInAngularZone();
                    scheduleMicroTask(function () {
                        _this._isZoneStable = true;
                        _this._runCallbacksIfReady();
                    });
                }
            });
        });
    };
    /**
     * Increases the number of pending request
     * @deprecated pending requests are now tracked with zones.
     */
    Testability.prototype.increasePendingRequestCount = function () {
        this._pendingCount += 1;
        this._didWork = true;
        return this._pendingCount;
    };
    /**
     * Decreases the number of pending request
     * @deprecated pending requests are now tracked with zones
     */
    Testability.prototype.decreasePendingRequestCount = function () {
        this._pendingCount -= 1;
        if (this._pendingCount < 0) {
            throw new Error('pending async requests below zero');
        }
        this._runCallbacksIfReady();
        return this._pendingCount;
    };
    /**
     * Whether an associated application is stable
     */
    Testability.prototype.isStable = function () {
        return this._isZoneStable && this._pendingCount === 0 && !this._ngZone.hasPendingMacrotasks;
    };
    Testability.prototype._runCallbacksIfReady = function () {
        var _this = this;
        if (this.isStable()) {
            // Schedules the call backs in a new frame so that it is always async.
            scheduleMicroTask(function () {
                while (_this._callbacks.length !== 0) {
                    var cb = _this._callbacks.pop();
                    clearTimeout(cb.timeoutId);
                    cb.doneCb(_this._didWork);
                }
                _this._didWork = false;
            });
        }
        else {
            // Still not stable, send updates.
            var pending_1 = this.getPendingTasks();
            this._callbacks = this._callbacks.filter(function (cb) {
                if (cb.updateCb && cb.updateCb(pending_1)) {
                    clearTimeout(cb.timeoutId);
                    return false;
                }
                return true;
            });
            this._didWork = true;
        }
    };
    Testability.prototype.getPendingTasks = function () {
        if (!this.taskTrackingZone) {
            return [];
        }
        // Copy the tasks data so that we don't leak tasks.
        return this.taskTrackingZone.macroTasks.map(function (t) {
            return {
                source: t.source,
                // From TaskTrackingZone:
                // https://github.com/angular/zone.js/blob/master/lib/zone-spec/task-tracking.ts#L40
                creationLocation: t.creationLocation,
                data: t.data
            };
        });
    };
    Testability.prototype.addCallback = function (cb, timeout, updateCb) {
        var _this = this;
        var timeoutId = -1;
        if (timeout && timeout > 0) {
            timeoutId = setTimeout(function () {
                _this._callbacks = _this._callbacks.filter(function (cb) { return cb.timeoutId !== timeoutId; });
                cb(_this._didWork, _this.getPendingTasks());
            }, timeout);
        }
        this._callbacks.push({ doneCb: cb, timeoutId: timeoutId, updateCb: updateCb });
    };
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
    Testability.prototype.whenStable = function (doneCb, timeout, updateCb) {
        if (updateCb && !this.taskTrackingZone) {
            throw new Error('Task tracking zone is required when passing an update callback to ' +
                'whenStable(). Is "zone.js/dist/task-tracking.js" loaded?');
        }
        // These arguments are 'Function' above to keep the public API simple.
        this.addCallback(doneCb, timeout, updateCb);
        this._runCallbacksIfReady();
    };
    /**
     * Get the number of pending requests
     * @deprecated pending requests are now tracked with zones
     */
    Testability.prototype.getPendingRequestCount = function () { return this._pendingCount; };
    /**
     * Find providers by name
     * @param using The root element to search from
     * @param provider The name of binding variable
     * @param exactMatch Whether using exactMatch
     */
    Testability.prototype.findProviders = function (using, provider, exactMatch) {
        // TODO(juliemr): implement.
        return [];
    };
    Testability.ngInjectableDef = i0.defineInjectable({ token: Testability, factory: function Testability_Factory(t) { return new (t || Testability)(i0.inject(NgZone)); }, providedIn: null });
    return Testability;
}());
export { Testability };
/*@__PURE__*/ i0.setClassMetadata(Testability, [{
        type: Injectable
    }], [{
        type: NgZone
    }], null);
/**
 * A global registry of {@link Testability} instances for specific elements.
 * @publicApi
 */
var TestabilityRegistry = /** @class */ (function () {
    function TestabilityRegistry() {
        /** @internal */
        this._applications = new Map();
        _testabilityGetter.addToWindow(this);
    }
    /**
     * Registers an application with a testability hook so that it can be tracked
     * @param token token of application, root element
     * @param testability Testability hook
     */
    TestabilityRegistry.prototype.registerApplication = function (token, testability) {
        this._applications.set(token, testability);
    };
    /**
     * Unregisters an application.
     * @param token token of application, root element
     */
    TestabilityRegistry.prototype.unregisterApplication = function (token) { this._applications.delete(token); };
    /**
     * Unregisters all applications
     */
    TestabilityRegistry.prototype.unregisterAllApplications = function () { this._applications.clear(); };
    /**
     * Get a testability hook associated with the application
     * @param elem root element
     */
    TestabilityRegistry.prototype.getTestability = function (elem) { return this._applications.get(elem) || null; };
    /**
     * Get all registered testabilities
     */
    TestabilityRegistry.prototype.getAllTestabilities = function () { return Array.from(this._applications.values()); };
    /**
     * Get all registered applications(root elements)
     */
    TestabilityRegistry.prototype.getAllRootElements = function () { return Array.from(this._applications.keys()); };
    /**
     * Find testability of a node in the Tree
     * @param elem node
     * @param findInAncestors whether finding testability in ancestors if testability was not found in
     * current node
     */
    TestabilityRegistry.prototype.findTestabilityInTree = function (elem, findInAncestors) {
        if (findInAncestors === void 0) { findInAncestors = true; }
        return _testabilityGetter.findTestabilityInTree(this, elem, findInAncestors);
    };
    TestabilityRegistry.ngInjectableDef = i0.defineInjectable({ token: TestabilityRegistry, factory: function TestabilityRegistry_Factory(t) { return new (t || TestabilityRegistry)(); }, providedIn: null });
    return TestabilityRegistry;
}());
export { TestabilityRegistry };
/*@__PURE__*/ i0.setClassMetadata(TestabilityRegistry, [{
        type: Injectable
    }], [], null);
var _NoopGetTestability = /** @class */ (function () {
    function _NoopGetTestability() {
    }
    _NoopGetTestability.prototype.addToWindow = function (registry) { };
    _NoopGetTestability.prototype.findTestabilityInTree = function (registry, elem, findInAncestors) {
        return null;
    };
    return _NoopGetTestability;
}());
/**
 * Set the {@link GetTestability} implementation used by the Angular testing framework.
 * @publicApi
 */
export function setTestabilityGetter(getter) {
    _testabilityGetter = getter;
}
var _testabilityGetter = new _NoopGetTestability();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy90ZXN0YWJpbGl0eS90ZXN0YWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ2pDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0saUJBQWlCLENBQUM7O0FBd0N2Qzs7Ozs7R0FLRztBQUNIO0lBZUUscUJBQW9CLE9BQWU7UUFBbkMsaUJBTUM7UUFObUIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQWIzQixrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQixrQkFBYSxHQUFZLElBQUksQ0FBQztRQUN0Qzs7Ozs7V0FLRztRQUNLLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFDMUIsZUFBVSxHQUFtQixFQUFFLENBQUM7UUFFaEMscUJBQWdCLEdBQThCLElBQUksQ0FBQztRQUd6RCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ1YsS0FBSSxDQUFDLGdCQUFnQjtnQkFDakIsT0FBTyxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8seUNBQW1CLEdBQTNCO1FBQUEsaUJBbUJDO1FBbEJDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUNoQyxJQUFJLEVBQUU7Z0JBQ0osS0FBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQ3JCLEtBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1lBQzdC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Q0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFeEY7O09BRUc7SUFDSCxnREFBa0IsR0FBbEIsY0FBOEIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFN0U7Ozs7O09BS0c7SUFDSCxtREFBcUIsR0FBckIsVUFBc0IsSUFBVSxFQUFFLGVBQStCO1FBQS9CLGdDQUFBLEVBQUEsc0JBQStCO1FBQy9ELE9BQU8sa0JBQWtCLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztJQUMvRSxDQUFDO3VFQWxEVSxtQkFBbUIsc0VBQW5CLG1CQUFtQjs4QkF2T2hDO0NBMFJDLEFBcERELElBb0RDO1NBbkRZLG1CQUFtQjtrQ0FBbkIsbUJBQW1CO2NBRC9CLFVBQVU7O0FBa0VYO0lBQUE7SUFNQSxDQUFDO0lBTEMseUNBQVcsR0FBWCxVQUFZLFFBQTZCLElBQVMsQ0FBQztJQUNuRCxtREFBcUIsR0FBckIsVUFBc0IsUUFBNkIsRUFBRSxJQUFTLEVBQUUsZUFBd0I7UUFFdEYsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0gsMEJBQUM7QUFBRCxDQUFDLEFBTkQsSUFNQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxNQUFzQjtJQUN6RCxrQkFBa0IsR0FBRyxNQUFNLENBQUM7QUFDOUIsQ0FBQztBQUVELElBQUksa0JBQWtCLEdBQW1CLElBQUksbUJBQW1CLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3NjaGVkdWxlTWljcm9UYXNrfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lL25nX3pvbmUnO1xuXG4vKipcbiAqIFRlc3RhYmlsaXR5IEFQSS5cbiAqIGBkZWNsYXJlYCBrZXl3b3JkIGNhdXNlcyB0c2lja2xlIHRvIGdlbmVyYXRlIGV4dGVybnMsIHNvIHRoZXNlIG1ldGhvZHMgYXJlXG4gKiBub3QgcmVuYW1lZCBieSBDbG9zdXJlIENvbXBpbGVyLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgUHVibGljVGVzdGFiaWxpdHkge1xuICBpc1N0YWJsZSgpOiBib29sZWFuO1xuICB3aGVuU3RhYmxlKGNhbGxiYWNrOiBGdW5jdGlvbiwgdGltZW91dD86IG51bWJlciwgdXBkYXRlQ2FsbGJhY2s/OiBGdW5jdGlvbik6IHZvaWQ7XG4gIGZpbmRQcm92aWRlcnModXNpbmc6IGFueSwgcHJvdmlkZXI6IHN0cmluZywgZXhhY3RNYXRjaDogYm9vbGVhbik6IGFueVtdO1xufVxuXG4vLyBBbmd1bGFyIGludGVybmFsLCBub3QgaW50ZW5kZWQgZm9yIHB1YmxpYyBBUEkuXG5leHBvcnQgaW50ZXJmYWNlIFBlbmRpbmdNYWNyb3Rhc2sge1xuICBzb3VyY2U6IHN0cmluZztcbiAgY3JlYXRpb25Mb2NhdGlvbjogRXJyb3I7XG4gIHJ1bkNvdW50PzogbnVtYmVyO1xuICBkYXRhOiBUYXNrRGF0YTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXNrRGF0YSB7XG4gIHRhcmdldD86IFhNTEh0dHBSZXF1ZXN0O1xuICBkZWxheT86IG51bWJlcjtcbiAgaXNQZXJpb2RpYz86IGJvb2xlYW47XG59XG5cbi8vIEFuZ3VsYXIgaW50ZXJuYWwsIG5vdCBpbnRlbmRlZCBmb3IgcHVibGljIEFQSS5cbmV4cG9ydCB0eXBlIERvbmVDYWxsYmFjayA9IChkaWRXb3JrOiBib29sZWFuLCB0YXNrcz86IFBlbmRpbmdNYWNyb3Rhc2tbXSkgPT4gdm9pZDtcbmV4cG9ydCB0eXBlIFVwZGF0ZUNhbGxiYWNrID0gKHRhc2tzOiBQZW5kaW5nTWFjcm90YXNrW10pID0+IGJvb2xlYW47XG5cbmludGVyZmFjZSBXYWl0Q2FsbGJhY2sge1xuICAvLyBOZWVkcyB0byBiZSAnYW55JyAtIHNldFRpbWVvdXQgcmV0dXJucyBhIG51bWJlciBhY2NvcmRpbmcgdG8gRVM2LCBidXRcbiAgLy8gb24gTm9kZUpTIGl0IHJldHVybnMgYSBUaW1lci5cbiAgdGltZW91dElkOiBhbnk7XG4gIGRvbmVDYjogRG9uZUNhbGxiYWNrO1xuICB1cGRhdGVDYj86IFVwZGF0ZUNhbGxiYWNrO1xufVxuXG4vKipcbiAqIFRoZSBUZXN0YWJpbGl0eSBzZXJ2aWNlIHByb3ZpZGVzIHRlc3RpbmcgaG9va3MgdGhhdCBjYW4gYmUgYWNjZXNzZWQgZnJvbVxuICogdGhlIGJyb3dzZXIgYW5kIGJ5IHNlcnZpY2VzIHN1Y2ggYXMgUHJvdHJhY3Rvci4gRWFjaCBib290c3RyYXBwZWQgQW5ndWxhclxuICogYXBwbGljYXRpb24gb24gdGhlIHBhZ2Ugd2lsbCBoYXZlIGFuIGluc3RhbmNlIG9mIFRlc3RhYmlsaXR5LlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVGVzdGFiaWxpdHkgaW1wbGVtZW50cyBQdWJsaWNUZXN0YWJpbGl0eSB7XG4gIHByaXZhdGUgX3BlbmRpbmdDb3VudDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBfaXNab25lU3RhYmxlOiBib29sZWFuID0gdHJ1ZTtcbiAgLyoqXG4gICAqIFdoZXRoZXIgYW55IHdvcmsgd2FzIGRvbmUgc2luY2UgdGhlIGxhc3QgJ3doZW5TdGFibGUnIGNhbGxiYWNrLiBUaGlzIGlzXG4gICAqIHVzZWZ1bCB0byBkZXRlY3QgaWYgdGhpcyBjb3VsZCBoYXZlIHBvdGVudGlhbGx5IGRlc3RhYmlsaXplZCBhbm90aGVyXG4gICAqIGNvbXBvbmVudCB3aGlsZSBpdCBpcyBzdGFiaWxpemluZy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9kaWRXb3JrOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2NhbGxiYWNrczogV2FpdENhbGxiYWNrW10gPSBbXTtcblxuICBwcml2YXRlIHRhc2tUcmFja2luZ1pvbmU6IHttYWNyb1Rhc2tzOiBUYXNrW119fG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX25nWm9uZTogTmdab25lKSB7XG4gICAgdGhpcy5fd2F0Y2hBbmd1bGFyRXZlbnRzKCk7XG4gICAgX25nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgdGhpcy50YXNrVHJhY2tpbmdab25lID1cbiAgICAgICAgICB0eXBlb2YgWm9uZSA9PSAndW5kZWZpbmVkJyA/IG51bGwgOiBab25lLmN1cnJlbnQuZ2V0KCdUYXNrVHJhY2tpbmdab25lJyk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF93YXRjaEFuZ3VsYXJFdmVudHMoKTogdm9pZCB7XG4gICAgdGhpcy5fbmdab25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKHtcbiAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgdGhpcy5fZGlkV29yayA9IHRydWU7XG4gICAgICAgIHRoaXMuX2lzWm9uZVN0YWJsZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMuX25nWm9uZS5vblN0YWJsZS5zdWJzY3JpYmUoe1xuICAgICAgICBuZXh0OiAoKSA9PiB7XG4gICAgICAgICAgTmdab25lLmFzc2VydE5vdEluQW5ndWxhclpvbmUoKTtcbiAgICAgICAgICBzY2hlZHVsZU1pY3JvVGFzaygoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pc1pvbmVTdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fcnVuQ2FsbGJhY2tzSWZSZWFkeSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmNyZWFzZXMgdGhlIG51bWJlciBvZiBwZW5kaW5nIHJlcXVlc3RcbiAgICogQGRlcHJlY2F0ZWQgcGVuZGluZyByZXF1ZXN0cyBhcmUgbm93IHRyYWNrZWQgd2l0aCB6b25lcy5cbiAgICovXG4gIGluY3JlYXNlUGVuZGluZ1JlcXVlc3RDb3VudCgpOiBudW1iZXIge1xuICAgIHRoaXMuX3BlbmRpbmdDb3VudCArPSAxO1xuICAgIHRoaXMuX2RpZFdvcmsgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzLl9wZW5kaW5nQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogRGVjcmVhc2VzIHRoZSBudW1iZXIgb2YgcGVuZGluZyByZXF1ZXN0XG4gICAqIEBkZXByZWNhdGVkIHBlbmRpbmcgcmVxdWVzdHMgYXJlIG5vdyB0cmFja2VkIHdpdGggem9uZXNcbiAgICovXG4gIGRlY3JlYXNlUGVuZGluZ1JlcXVlc3RDb3VudCgpOiBudW1iZXIge1xuICAgIHRoaXMuX3BlbmRpbmdDb3VudCAtPSAxO1xuICAgIGlmICh0aGlzLl9wZW5kaW5nQ291bnQgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BlbmRpbmcgYXN5bmMgcmVxdWVzdHMgYmVsb3cgemVybycpO1xuICAgIH1cbiAgICB0aGlzLl9ydW5DYWxsYmFja3NJZlJlYWR5KCk7XG4gICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIGFuIGFzc29jaWF0ZWQgYXBwbGljYXRpb24gaXMgc3RhYmxlXG4gICAqL1xuICBpc1N0YWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5faXNab25lU3RhYmxlICYmIHRoaXMuX3BlbmRpbmdDb3VudCA9PT0gMCAmJiAhdGhpcy5fbmdab25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzO1xuICB9XG5cbiAgcHJpdmF0ZSBfcnVuQ2FsbGJhY2tzSWZSZWFkeSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pc1N0YWJsZSgpKSB7XG4gICAgICAvLyBTY2hlZHVsZXMgdGhlIGNhbGwgYmFja3MgaW4gYSBuZXcgZnJhbWUgc28gdGhhdCBpdCBpcyBhbHdheXMgYXN5bmMuXG4gICAgICBzY2hlZHVsZU1pY3JvVGFzaygoKSA9PiB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9jYWxsYmFja3MubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgbGV0IGNiID0gdGhpcy5fY2FsbGJhY2tzLnBvcCgpICE7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGNiLnRpbWVvdXRJZCk7XG4gICAgICAgICAgY2IuZG9uZUNiKHRoaXMuX2RpZFdvcmspO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RpZFdvcmsgPSBmYWxzZTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTdGlsbCBub3Qgc3RhYmxlLCBzZW5kIHVwZGF0ZXMuXG4gICAgICBsZXQgcGVuZGluZyA9IHRoaXMuZ2V0UGVuZGluZ1Rhc2tzKCk7XG4gICAgICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MuZmlsdGVyKChjYikgPT4ge1xuICAgICAgICBpZiAoY2IudXBkYXRlQ2IgJiYgY2IudXBkYXRlQ2IocGVuZGluZykpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoY2IudGltZW91dElkKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9kaWRXb3JrID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFBlbmRpbmdUYXNrcygpOiBQZW5kaW5nTWFjcm90YXNrW10ge1xuICAgIGlmICghdGhpcy50YXNrVHJhY2tpbmdab25lKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgLy8gQ29weSB0aGUgdGFza3MgZGF0YSBzbyB0aGF0IHdlIGRvbid0IGxlYWsgdGFza3MuXG4gICAgcmV0dXJuIHRoaXMudGFza1RyYWNraW5nWm9uZS5tYWNyb1Rhc2tzLm1hcCgodDogVGFzaykgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc291cmNlOiB0LnNvdXJjZSxcbiAgICAgICAgLy8gRnJvbSBUYXNrVHJhY2tpbmdab25lOlxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci96b25lLmpzL2Jsb2IvbWFzdGVyL2xpYi96b25lLXNwZWMvdGFzay10cmFja2luZy50cyNMNDBcbiAgICAgICAgY3JlYXRpb25Mb2NhdGlvbjogKHQgYXMgYW55KS5jcmVhdGlvbkxvY2F0aW9uIGFzIEVycm9yLFxuICAgICAgICBkYXRhOiB0LmRhdGFcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFkZENhbGxiYWNrKGNiOiBEb25lQ2FsbGJhY2ssIHRpbWVvdXQ/OiBudW1iZXIsIHVwZGF0ZUNiPzogVXBkYXRlQ2FsbGJhY2spIHtcbiAgICBsZXQgdGltZW91dElkOiBhbnkgPSAtMTtcbiAgICBpZiAodGltZW91dCAmJiB0aW1lb3V0ID4gMCkge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcy5maWx0ZXIoKGNiKSA9PiBjYi50aW1lb3V0SWQgIT09IHRpbWVvdXRJZCk7XG4gICAgICAgIGNiKHRoaXMuX2RpZFdvcmssIHRoaXMuZ2V0UGVuZGluZ1Rhc2tzKCkpO1xuICAgICAgfSwgdGltZW91dCk7XG4gICAgfVxuICAgIHRoaXMuX2NhbGxiYWNrcy5wdXNoKDxXYWl0Q2FsbGJhY2s+e2RvbmVDYjogY2IsIHRpbWVvdXRJZDogdGltZW91dElkLCB1cGRhdGVDYjogdXBkYXRlQ2J9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXYWl0IGZvciB0aGUgYXBwbGljYXRpb24gdG8gYmUgc3RhYmxlIHdpdGggYSB0aW1lb3V0LiBJZiB0aGUgdGltZW91dCBpcyByZWFjaGVkIGJlZm9yZSB0aGF0XG4gICAqIGhhcHBlbnMsIHRoZSBjYWxsYmFjayByZWNlaXZlcyBhIGxpc3Qgb2YgdGhlIG1hY3JvIHRhc2tzIHRoYXQgd2VyZSBwZW5kaW5nLCBvdGhlcndpc2UgbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIGRvbmVDYiBUaGUgY2FsbGJhY2sgdG8gaW52b2tlIHdoZW4gQW5ndWxhciBpcyBzdGFibGUgb3IgdGhlIHRpbWVvdXQgZXhwaXJlc1xuICAgKiAgICB3aGljaGV2ZXIgY29tZXMgZmlyc3QuXG4gICAqIEBwYXJhbSB0aW1lb3V0IE9wdGlvbmFsLiBUaGUgbWF4aW11bSB0aW1lIHRvIHdhaXQgZm9yIEFuZ3VsYXIgdG8gYmVjb21lIHN0YWJsZS4gSWYgbm90XG4gICAqICAgIHNwZWNpZmllZCwgd2hlblN0YWJsZSgpIHdpbGwgd2FpdCBmb3JldmVyLlxuICAgKiBAcGFyYW0gdXBkYXRlQ2IgT3B0aW9uYWwuIElmIHNwZWNpZmllZCwgdGhpcyBjYWxsYmFjayB3aWxsIGJlIGludm9rZWQgd2hlbmV2ZXIgdGhlIHNldCBvZlxuICAgKiAgICBwZW5kaW5nIG1hY3JvdGFza3MgY2hhbmdlcy4gSWYgdGhpcyBjYWxsYmFjayByZXR1cm5zIHRydWUgZG9uZUNiIHdpbGwgbm90IGJlIGludm9rZWRcbiAgICogICAgYW5kIG5vIGZ1cnRoZXIgdXBkYXRlcyB3aWxsIGJlIGlzc3VlZC5cbiAgICovXG4gIHdoZW5TdGFibGUoZG9uZUNiOiBGdW5jdGlvbiwgdGltZW91dD86IG51bWJlciwgdXBkYXRlQ2I/OiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGlmICh1cGRhdGVDYiAmJiAhdGhpcy50YXNrVHJhY2tpbmdab25lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ1Rhc2sgdHJhY2tpbmcgem9uZSBpcyByZXF1aXJlZCB3aGVuIHBhc3NpbmcgYW4gdXBkYXRlIGNhbGxiYWNrIHRvICcgK1xuICAgICAgICAgICd3aGVuU3RhYmxlKCkuIElzIFwiem9uZS5qcy9kaXN0L3Rhc2stdHJhY2tpbmcuanNcIiBsb2FkZWQ/Jyk7XG4gICAgfVxuICAgIC8vIFRoZXNlIGFyZ3VtZW50cyBhcmUgJ0Z1bmN0aW9uJyBhYm92ZSB0byBrZWVwIHRoZSBwdWJsaWMgQVBJIHNpbXBsZS5cbiAgICB0aGlzLmFkZENhbGxiYWNrKGRvbmVDYiBhcyBEb25lQ2FsbGJhY2ssIHRpbWVvdXQsIHVwZGF0ZUNiIGFzIFVwZGF0ZUNhbGxiYWNrKTtcbiAgICB0aGlzLl9ydW5DYWxsYmFja3NJZlJlYWR5KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgcGVuZGluZyByZXF1ZXN0c1xuICAgKiBAZGVwcmVjYXRlZCBwZW5kaW5nIHJlcXVlc3RzIGFyZSBub3cgdHJhY2tlZCB3aXRoIHpvbmVzXG4gICAqL1xuICBnZXRQZW5kaW5nUmVxdWVzdENvdW50KCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9wZW5kaW5nQ291bnQ7IH1cblxuICAvKipcbiAgICogRmluZCBwcm92aWRlcnMgYnkgbmFtZVxuICAgKiBAcGFyYW0gdXNpbmcgVGhlIHJvb3QgZWxlbWVudCB0byBzZWFyY2ggZnJvbVxuICAgKiBAcGFyYW0gcHJvdmlkZXIgVGhlIG5hbWUgb2YgYmluZGluZyB2YXJpYWJsZVxuICAgKiBAcGFyYW0gZXhhY3RNYXRjaCBXaGV0aGVyIHVzaW5nIGV4YWN0TWF0Y2hcbiAgICovXG4gIGZpbmRQcm92aWRlcnModXNpbmc6IGFueSwgcHJvdmlkZXI6IHN0cmluZywgZXhhY3RNYXRjaDogYm9vbGVhbik6IGFueVtdIHtcbiAgICAvLyBUT0RPKGp1bGllbXIpOiBpbXBsZW1lbnQuXG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbi8qKlxuICogQSBnbG9iYWwgcmVnaXN0cnkgb2Yge0BsaW5rIFRlc3RhYmlsaXR5fSBpbnN0YW5jZXMgZm9yIHNwZWNpZmljIGVsZW1lbnRzLlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVGVzdGFiaWxpdHlSZWdpc3RyeSB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2FwcGxpY2F0aW9ucyA9IG5ldyBNYXA8YW55LCBUZXN0YWJpbGl0eT4oKTtcblxuICBjb25zdHJ1Y3RvcigpIHsgX3Rlc3RhYmlsaXR5R2V0dGVyLmFkZFRvV2luZG93KHRoaXMpOyB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhbiBhcHBsaWNhdGlvbiB3aXRoIGEgdGVzdGFiaWxpdHkgaG9vayBzbyB0aGF0IGl0IGNhbiBiZSB0cmFja2VkXG4gICAqIEBwYXJhbSB0b2tlbiB0b2tlbiBvZiBhcHBsaWNhdGlvbiwgcm9vdCBlbGVtZW50XG4gICAqIEBwYXJhbSB0ZXN0YWJpbGl0eSBUZXN0YWJpbGl0eSBob29rXG4gICAqL1xuICByZWdpc3RlckFwcGxpY2F0aW9uKHRva2VuOiBhbnksIHRlc3RhYmlsaXR5OiBUZXN0YWJpbGl0eSkge1xuICAgIHRoaXMuX2FwcGxpY2F0aW9ucy5zZXQodG9rZW4sIHRlc3RhYmlsaXR5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVycyBhbiBhcHBsaWNhdGlvbi5cbiAgICogQHBhcmFtIHRva2VuIHRva2VuIG9mIGFwcGxpY2F0aW9uLCByb290IGVsZW1lbnRcbiAgICovXG4gIHVucmVnaXN0ZXJBcHBsaWNhdGlvbih0b2tlbjogYW55KSB7IHRoaXMuX2FwcGxpY2F0aW9ucy5kZWxldGUodG9rZW4pOyB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXJzIGFsbCBhcHBsaWNhdGlvbnNcbiAgICovXG4gIHVucmVnaXN0ZXJBbGxBcHBsaWNhdGlvbnMoKSB7IHRoaXMuX2FwcGxpY2F0aW9ucy5jbGVhcigpOyB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHRlc3RhYmlsaXR5IGhvb2sgYXNzb2NpYXRlZCB3aXRoIHRoZSBhcHBsaWNhdGlvblxuICAgKiBAcGFyYW0gZWxlbSByb290IGVsZW1lbnRcbiAgICovXG4gIGdldFRlc3RhYmlsaXR5KGVsZW06IGFueSk6IFRlc3RhYmlsaXR5fG51bGwgeyByZXR1cm4gdGhpcy5fYXBwbGljYXRpb25zLmdldChlbGVtKSB8fCBudWxsOyB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgcmVnaXN0ZXJlZCB0ZXN0YWJpbGl0aWVzXG4gICAqL1xuICBnZXRBbGxUZXN0YWJpbGl0aWVzKCk6IFRlc3RhYmlsaXR5W10geyByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl9hcHBsaWNhdGlvbnMudmFsdWVzKCkpOyB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgcmVnaXN0ZXJlZCBhcHBsaWNhdGlvbnMocm9vdCBlbGVtZW50cylcbiAgICovXG4gIGdldEFsbFJvb3RFbGVtZW50cygpOiBhbnlbXSB7IHJldHVybiBBcnJheS5mcm9tKHRoaXMuX2FwcGxpY2F0aW9ucy5rZXlzKCkpOyB9XG5cbiAgLyoqXG4gICAqIEZpbmQgdGVzdGFiaWxpdHkgb2YgYSBub2RlIGluIHRoZSBUcmVlXG4gICAqIEBwYXJhbSBlbGVtIG5vZGVcbiAgICogQHBhcmFtIGZpbmRJbkFuY2VzdG9ycyB3aGV0aGVyIGZpbmRpbmcgdGVzdGFiaWxpdHkgaW4gYW5jZXN0b3JzIGlmIHRlc3RhYmlsaXR5IHdhcyBub3QgZm91bmQgaW5cbiAgICogY3VycmVudCBub2RlXG4gICAqL1xuICBmaW5kVGVzdGFiaWxpdHlJblRyZWUoZWxlbTogTm9kZSwgZmluZEluQW5jZXN0b3JzOiBib29sZWFuID0gdHJ1ZSk6IFRlc3RhYmlsaXR5fG51bGwge1xuICAgIHJldHVybiBfdGVzdGFiaWxpdHlHZXR0ZXIuZmluZFRlc3RhYmlsaXR5SW5UcmVlKHRoaXMsIGVsZW0sIGZpbmRJbkFuY2VzdG9ycyk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGFwdGVyIGludGVyZmFjZSBmb3IgcmV0cmlldmluZyB0aGUgYFRlc3RhYmlsaXR5YCBzZXJ2aWNlIGFzc29jaWF0ZWQgZm9yIGFcbiAqIHBhcnRpY3VsYXIgY29udGV4dC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2V0VGVzdGFiaWxpdHkge1xuICBhZGRUb1dpbmRvdyhyZWdpc3RyeTogVGVzdGFiaWxpdHlSZWdpc3RyeSk6IHZvaWQ7XG4gIGZpbmRUZXN0YWJpbGl0eUluVHJlZShyZWdpc3RyeTogVGVzdGFiaWxpdHlSZWdpc3RyeSwgZWxlbTogYW55LCBmaW5kSW5BbmNlc3RvcnM6IGJvb2xlYW4pOlxuICAgICAgVGVzdGFiaWxpdHl8bnVsbDtcbn1cblxuY2xhc3MgX05vb3BHZXRUZXN0YWJpbGl0eSBpbXBsZW1lbnRzIEdldFRlc3RhYmlsaXR5IHtcbiAgYWRkVG9XaW5kb3cocmVnaXN0cnk6IFRlc3RhYmlsaXR5UmVnaXN0cnkpOiB2b2lkIHt9XG4gIGZpbmRUZXN0YWJpbGl0eUluVHJlZShyZWdpc3RyeTogVGVzdGFiaWxpdHlSZWdpc3RyeSwgZWxlbTogYW55LCBmaW5kSW5BbmNlc3RvcnM6IGJvb2xlYW4pOlxuICAgICAgVGVzdGFiaWxpdHl8bnVsbCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgdGhlIHtAbGluayBHZXRUZXN0YWJpbGl0eX0gaW1wbGVtZW50YXRpb24gdXNlZCBieSB0aGUgQW5ndWxhciB0ZXN0aW5nIGZyYW1ld29yay5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFRlc3RhYmlsaXR5R2V0dGVyKGdldHRlcjogR2V0VGVzdGFiaWxpdHkpOiB2b2lkIHtcbiAgX3Rlc3RhYmlsaXR5R2V0dGVyID0gZ2V0dGVyO1xufVxuXG5sZXQgX3Rlc3RhYmlsaXR5R2V0dGVyOiBHZXRUZXN0YWJpbGl0eSA9IG5ldyBfTm9vcEdldFRlc3RhYmlsaXR5KCk7XG4iXX0=