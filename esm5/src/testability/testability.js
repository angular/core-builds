/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '../di';
import { scheduleMicroTask } from '../util/microtask';
import { NgZone } from '../zone/ng_zone';
import * as i0 from "../r3_symbols";
import * as i1 from "../zone/ng_zone";
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
    Testability.ngInjectableDef = i0.defineInjectable({ token: Testability, factory: function Testability_Factory(t) { return new (t || Testability)(i0.inject(i1.NgZone)); }, providedIn: null });
    return Testability;
}());
export { Testability };
/*@__PURE__*/ i0.setClassMetadata(Testability, [{
        type: Injectable
    }], function () { return [{ type: i1.NgZone }]; }, null);
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
    }], function () { return []; }, null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy90ZXN0YWJpbGl0eS90ZXN0YWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ2pDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7O0FBd0N2Qzs7Ozs7R0FLRztBQUNIO0lBZUUscUJBQW9CLE9BQWU7UUFBbkMsaUJBTUM7UUFObUIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQWIzQixrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQixrQkFBYSxHQUFZLElBQUksQ0FBQztRQUN0Qzs7Ozs7V0FLRztRQUNLLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFDMUIsZUFBVSxHQUFtQixFQUFFLENBQUM7UUFFaEMscUJBQWdCLEdBQThCLElBQUksQ0FBQztRQUd6RCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ1YsS0FBSSxDQUFDLGdCQUFnQjtnQkFDakIsT0FBTyxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8seUNBQW1CLEdBQTNCO1FBQUEsaUJBbUJDO1FBbEJDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUNoQyxJQUFJLEVBQUU7Z0JBQ0osS0FBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQ3JCLEtBQUksQ0FB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QUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhGOztPQUVHO0lBQ0gsZ0RBQWtCLEdBQWxCLGNBQThCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTdFOzs7OztPQUtHO0lBQ0gsbURBQXFCLEdBQXJCLFVBQXNCLElBQVUsRUFBRSxlQUErQjtRQUEvQixnQ0FBQSxFQUFBLHNCQUErQjtRQUMvRCxPQUFPLGtCQUFrQixDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDL0UsQ0FBQzt1RUFsRFUsbUJBQW1CLHNFQUFuQixtQkFBbUI7OEJBdk9oQztDQTBSQyxBQXBERCxJQW9EQztTQW5EWSxtQkFBbUI7a0NBQW5CLG1CQUFtQjtjQUQvQixVQUFVOztBQWtFWDtJQUFBO0lBTUEsQ0FBQztJQUxDLHlDQUFXLEdBQVgsVUFBWSxRQUE2QixJQUFTLENBQUM7SUFDbkQsbURBQXFCLEdBQXJCLFVBQXNCLFFBQTZCLEVBQUUsSUFBUyxFQUFFLGVBQXdCO1FBRXRGLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNILDBCQUFDO0FBQUQsQ0FBQyxBQU5ELElBTUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsTUFBc0I7SUFDekQsa0JBQWtCLEdBQUcsTUFBTSxDQUFDO0FBQzlCLENBQUM7QUFFRCxJQUFJLGtCQUFrQixHQUFtQixJQUFJLG1CQUFtQixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtzY2hlZHVsZU1pY3JvVGFza30gZnJvbSAnLi4vdXRpbC9taWNyb3Rhc2snO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUvbmdfem9uZSc7XG5cbi8qKlxuICogVGVzdGFiaWxpdHkgQVBJLlxuICogYGRlY2xhcmVgIGtleXdvcmQgY2F1c2VzIHRzaWNrbGUgdG8gZ2VuZXJhdGUgZXh0ZXJucywgc28gdGhlc2UgbWV0aG9kcyBhcmVcbiAqIG5vdCByZW5hbWVkIGJ5IENsb3N1cmUgQ29tcGlsZXIuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBQdWJsaWNUZXN0YWJpbGl0eSB7XG4gIGlzU3RhYmxlKCk6IGJvb2xlYW47XG4gIHdoZW5TdGFibGUoY2FsbGJhY2s6IEZ1bmN0aW9uLCB0aW1lb3V0PzogbnVtYmVyLCB1cGRhdGVDYWxsYmFjaz86IEZ1bmN0aW9uKTogdm9pZDtcbiAgZmluZFByb3ZpZGVycyh1c2luZzogYW55LCBwcm92aWRlcjogc3RyaW5nLCBleGFjdE1hdGNoOiBib29sZWFuKTogYW55W107XG59XG5cbi8vIEFuZ3VsYXIgaW50ZXJuYWwsIG5vdCBpbnRlbmRlZCBmb3IgcHVibGljIEFQSS5cbmV4cG9ydCBpbnRlcmZhY2UgUGVuZGluZ01hY3JvdGFzayB7XG4gIHNvdXJjZTogc3RyaW5nO1xuICBjcmVhdGlvbkxvY2F0aW9uOiBFcnJvcjtcbiAgcnVuQ291bnQ/OiBudW1iZXI7XG4gIGRhdGE6IFRhc2tEYXRhO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhc2tEYXRhIHtcbiAgdGFyZ2V0PzogWE1MSHR0cFJlcXVlc3Q7XG4gIGRlbGF5PzogbnVtYmVyO1xuICBpc1BlcmlvZGljPzogYm9vbGVhbjtcbn1cblxuLy8gQW5ndWxhciBpbnRlcm5hbCwgbm90IGludGVuZGVkIGZvciBwdWJsaWMgQVBJLlxuZXhwb3J0IHR5cGUgRG9uZUNhbGxiYWNrID0gKGRpZFdvcms6IGJvb2xlYW4sIHRhc2tzPzogUGVuZGluZ01hY3JvdGFza1tdKSA9PiB2b2lkO1xuZXhwb3J0IHR5cGUgVXBkYXRlQ2FsbGJhY2sgPSAodGFza3M6IFBlbmRpbmdNYWNyb3Rhc2tbXSkgPT4gYm9vbGVhbjtcblxuaW50ZXJmYWNlIFdhaXRDYWxsYmFjayB7XG4gIC8vIE5lZWRzIHRvIGJlICdhbnknIC0gc2V0VGltZW91dCByZXR1cm5zIGEgbnVtYmVyIGFjY29yZGluZyB0byBFUzYsIGJ1dFxuICAvLyBvbiBOb2RlSlMgaXQgcmV0dXJucyBhIFRpbWVyLlxuICB0aW1lb3V0SWQ6IGFueTtcbiAgZG9uZUNiOiBEb25lQ2FsbGJhY2s7XG4gIHVwZGF0ZUNiPzogVXBkYXRlQ2FsbGJhY2s7XG59XG5cbi8qKlxuICogVGhlIFRlc3RhYmlsaXR5IHNlcnZpY2UgcHJvdmlkZXMgdGVzdGluZyBob29rcyB0aGF0IGNhbiBiZSBhY2Nlc3NlZCBmcm9tXG4gKiB0aGUgYnJvd3NlciBhbmQgYnkgc2VydmljZXMgc3VjaCBhcyBQcm90cmFjdG9yLiBFYWNoIGJvb3RzdHJhcHBlZCBBbmd1bGFyXG4gKiBhcHBsaWNhdGlvbiBvbiB0aGUgcGFnZSB3aWxsIGhhdmUgYW4gaW5zdGFuY2Ugb2YgVGVzdGFiaWxpdHkuXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBUZXN0YWJpbGl0eSBpbXBsZW1lbnRzIFB1YmxpY1Rlc3RhYmlsaXR5IHtcbiAgcHJpdmF0ZSBfcGVuZGluZ0NvdW50OiBudW1iZXIgPSAwO1xuICBwcml2YXRlIF9pc1pvbmVTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuICAvKipcbiAgICogV2hldGhlciBhbnkgd29yayB3YXMgZG9uZSBzaW5jZSB0aGUgbGFzdCAnd2hlblN0YWJsZScgY2FsbGJhY2suIFRoaXMgaXNcbiAgICogdXNlZnVsIHRvIGRldGVjdCBpZiB0aGlzIGNvdWxkIGhhdmUgcG90ZW50aWFsbHkgZGVzdGFiaWxpemVkIGFub3RoZXJcbiAgICogY29tcG9uZW50IHdoaWxlIGl0IGlzIHN0YWJpbGl6aW5nLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgX2RpZFdvcms6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfY2FsbGJhY2tzOiBXYWl0Q2FsbGJhY2tbXSA9IFtdO1xuXG4gIHByaXZhdGUgdGFza1RyYWNraW5nWm9uZToge21hY3JvVGFza3M6IFRhc2tbXX18bnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHtcbiAgICB0aGlzLl93YXRjaEFuZ3VsYXJFdmVudHMoKTtcbiAgICBfbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICB0aGlzLnRhc2tUcmFja2luZ1pvbmUgPVxuICAgICAgICAgIHR5cGVvZiBab25lID09ICd1bmRlZmluZWQnID8gbnVsbCA6IFpvbmUuY3VycmVudC5nZXQoJ1Rhc2tUcmFja2luZ1pvbmUnKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX3dhdGNoQW5ndWxhckV2ZW50cygpOiB2b2lkIHtcbiAgICB0aGlzLl9uZ1pvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoe1xuICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICB0aGlzLl9kaWRXb3JrID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5faXNab25lU3RhYmxlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5fbmdab25lLm9uU3RhYmxlLnN1YnNjcmliZSh7XG4gICAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICBOZ1pvbmUuYXNzZXJ0Tm90SW5Bbmd1bGFyWm9uZSgpO1xuICAgICAgICAgIHNjaGVkdWxlTWljcm9UYXNrKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2lzWm9uZVN0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9ydW5DYWxsYmFja3NJZlJlYWR5KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluY3JlYXNlcyB0aGUgbnVtYmVyIG9mIHBlbmRpbmcgcmVxdWVzdFxuICAgKiBAZGVwcmVjYXRlZCBwZW5kaW5nIHJlcXVlc3RzIGFyZSBub3cgdHJhY2tlZCB3aXRoIHpvbmVzLlxuICAgKi9cbiAgaW5jcmVhc2VQZW5kaW5nUmVxdWVzdENvdW50KCk6IG51bWJlciB7XG4gICAgdGhpcy5fcGVuZGluZ0NvdW50ICs9IDE7XG4gICAgdGhpcy5fZGlkV29yayA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMuX3BlbmRpbmdDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNyZWFzZXMgdGhlIG51bWJlciBvZiBwZW5kaW5nIHJlcXVlc3RcbiAgICogQGRlcHJlY2F0ZWQgcGVuZGluZyByZXF1ZXN0cyBhcmUgbm93IHRyYWNrZWQgd2l0aCB6b25lc1xuICAgKi9cbiAgZGVjcmVhc2VQZW5kaW5nUmVxdWVzdENvdW50KCk6IG51bWJlciB7XG4gICAgdGhpcy5fcGVuZGluZ0NvdW50IC09IDE7XG4gICAgaWYgKHRoaXMuX3BlbmRpbmdDb3VudCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncGVuZGluZyBhc3luYyByZXF1ZXN0cyBiZWxvdyB6ZXJvJyk7XG4gICAgfVxuICAgIHRoaXMuX3J1bkNhbGxiYWNrc0lmUmVhZHkoKTtcbiAgICByZXR1cm4gdGhpcy5fcGVuZGluZ0NvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgYW4gYXNzb2NpYXRlZCBhcHBsaWNhdGlvbiBpcyBzdGFibGVcbiAgICovXG4gIGlzU3RhYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc1pvbmVTdGFibGUgJiYgdGhpcy5fcGVuZGluZ0NvdW50ID09PSAwICYmICF0aGlzLl9uZ1pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3M7XG4gIH1cblxuICBwcml2YXRlIF9ydW5DYWxsYmFja3NJZlJlYWR5KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzU3RhYmxlKCkpIHtcbiAgICAgIC8vIFNjaGVkdWxlcyB0aGUgY2FsbCBiYWNrcyBpbiBhIG5ldyBmcmFtZSBzbyB0aGF0IGl0IGlzIGFsd2F5cyBhc3luYy5cbiAgICAgIHNjaGVkdWxlTWljcm9UYXNrKCgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2NhbGxiYWNrcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICBsZXQgY2IgPSB0aGlzLl9jYWxsYmFja3MucG9wKCkgITtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoY2IudGltZW91dElkKTtcbiAgICAgICAgICBjYi5kb25lQ2IodGhpcy5fZGlkV29yayk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGlkV29yayA9IGZhbHNlO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFN0aWxsIG5vdCBzdGFibGUsIHNlbmQgdXBkYXRlcy5cbiAgICAgIGxldCBwZW5kaW5nID0gdGhpcy5nZXRQZW5kaW5nVGFza3MoKTtcbiAgICAgIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcy5maWx0ZXIoKGNiKSA9PiB7XG4gICAgICAgIGlmIChjYi51cGRhdGVDYiAmJiBjYi51cGRhdGVDYihwZW5kaW5nKSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChjYi50aW1lb3V0SWQpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX2RpZFdvcmsgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0UGVuZGluZ1Rhc2tzKCk6IFBlbmRpbmdNYWNyb3Rhc2tbXSB7XG4gICAgaWYgKCF0aGlzLnRhc2tUcmFja2luZ1pvbmUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICAvLyBDb3B5IHRoZSB0YXNrcyBkYXRhIHNvIHRoYXQgd2UgZG9uJ3QgbGVhayB0YXNrcy5cbiAgICByZXR1cm4gdGhpcy50YXNrVHJhY2tpbmdab25lLm1hY3JvVGFza3MubWFwKCh0OiBUYXNrKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzb3VyY2U6IHQuc291cmNlLFxuICAgICAgICAvLyBGcm9tIFRhc2tUcmFja2luZ1pvbmU6XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3pvbmUuanMvYmxvYi9tYXN0ZXIvbGliL3pvbmUtc3BlYy90YXNrLXRyYWNraW5nLnRzI0w0MFxuICAgICAgICBjcmVhdGlvbkxvY2F0aW9uOiAodCBhcyBhbnkpLmNyZWF0aW9uTG9jYXRpb24gYXMgRXJyb3IsXG4gICAgICAgIGRhdGE6IHQuZGF0YVxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkQ2FsbGJhY2soY2I6IERvbmVDYWxsYmFjaywgdGltZW91dD86IG51bWJlciwgdXBkYXRlQ2I/OiBVcGRhdGVDYWxsYmFjaykge1xuICAgIGxldCB0aW1lb3V0SWQ6IGFueSA9IC0xO1xuICAgIGlmICh0aW1lb3V0ICYmIHRpbWVvdXQgPiAwKSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzLmZpbHRlcigoY2IpID0+IGNiLnRpbWVvdXRJZCAhPT0gdGltZW91dElkKTtcbiAgICAgICAgY2IodGhpcy5fZGlkV29yaywgdGhpcy5nZXRQZW5kaW5nVGFza3MoKSk7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gICAgdGhpcy5fY2FsbGJhY2tzLnB1c2goPFdhaXRDYWxsYmFjaz57ZG9uZUNiOiBjYiwgdGltZW91dElkOiB0aW1lb3V0SWQsIHVwZGF0ZUNiOiB1cGRhdGVDYn0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdhaXQgZm9yIHRoZSBhcHBsaWNhdGlvbiB0byBiZSBzdGFibGUgd2l0aCBhIHRpbWVvdXQuIElmIHRoZSB0aW1lb3V0IGlzIHJlYWNoZWQgYmVmb3JlIHRoYXRcbiAgICogaGFwcGVucywgdGhlIGNhbGxiYWNrIHJlY2VpdmVzIGEgbGlzdCBvZiB0aGUgbWFjcm8gdGFza3MgdGhhdCB3ZXJlIHBlbmRpbmcsIG90aGVyd2lzZSBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0gZG9uZUNiIFRoZSBjYWxsYmFjayB0byBpbnZva2Ugd2hlbiBBbmd1bGFyIGlzIHN0YWJsZSBvciB0aGUgdGltZW91dCBleHBpcmVzXG4gICAqICAgIHdoaWNoZXZlciBjb21lcyBmaXJzdC5cbiAgICogQHBhcmFtIHRpbWVvdXQgT3B0aW9uYWwuIFRoZSBtYXhpbXVtIHRpbWUgdG8gd2FpdCBmb3IgQW5ndWxhciB0byBiZWNvbWUgc3RhYmxlLiBJZiBub3RcbiAgICogICAgc3BlY2lmaWVkLCB3aGVuU3RhYmxlKCkgd2lsbCB3YWl0IGZvcmV2ZXIuXG4gICAqIEBwYXJhbSB1cGRhdGVDYiBPcHRpb25hbC4gSWYgc3BlY2lmaWVkLCB0aGlzIGNhbGxiYWNrIHdpbGwgYmUgaW52b2tlZCB3aGVuZXZlciB0aGUgc2V0IG9mXG4gICAqICAgIHBlbmRpbmcgbWFjcm90YXNrcyBjaGFuZ2VzLiBJZiB0aGlzIGNhbGxiYWNrIHJldHVybnMgdHJ1ZSBkb25lQ2Igd2lsbCBub3QgYmUgaW52b2tlZFxuICAgKiAgICBhbmQgbm8gZnVydGhlciB1cGRhdGVzIHdpbGwgYmUgaXNzdWVkLlxuICAgKi9cbiAgd2hlblN0YWJsZShkb25lQ2I6IEZ1bmN0aW9uLCB0aW1lb3V0PzogbnVtYmVyLCB1cGRhdGVDYj86IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgaWYgKHVwZGF0ZUNiICYmICF0aGlzLnRhc2tUcmFja2luZ1pvbmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnVGFzayB0cmFja2luZyB6b25lIGlzIHJlcXVpcmVkIHdoZW4gcGFzc2luZyBhbiB1cGRhdGUgY2FsbGJhY2sgdG8gJyArXG4gICAgICAgICAgJ3doZW5TdGFibGUoKS4gSXMgXCJ6b25lLmpzL2Rpc3QvdGFzay10cmFja2luZy5qc1wiIGxvYWRlZD8nKTtcbiAgICB9XG4gICAgLy8gVGhlc2UgYXJndW1lbnRzIGFyZSAnRnVuY3Rpb24nIGFib3ZlIHRvIGtlZXAgdGhlIHB1YmxpYyBBUEkgc2ltcGxlLlxuICAgIHRoaXMuYWRkQ2FsbGJhY2soZG9uZUNiIGFzIERvbmVDYWxsYmFjaywgdGltZW91dCwgdXBkYXRlQ2IgYXMgVXBkYXRlQ2FsbGJhY2spO1xuICAgIHRoaXMuX3J1bkNhbGxiYWNrc0lmUmVhZHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiBwZW5kaW5nIHJlcXVlc3RzXG4gICAqIEBkZXByZWNhdGVkIHBlbmRpbmcgcmVxdWVzdHMgYXJlIG5vdyB0cmFja2VkIHdpdGggem9uZXNcbiAgICovXG4gIGdldFBlbmRpbmdSZXF1ZXN0Q291bnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3BlbmRpbmdDb3VudDsgfVxuXG4gIC8qKlxuICAgKiBGaW5kIHByb3ZpZGVycyBieSBuYW1lXG4gICAqIEBwYXJhbSB1c2luZyBUaGUgcm9vdCBlbGVtZW50IHRvIHNlYXJjaCBmcm9tXG4gICAqIEBwYXJhbSBwcm92aWRlciBUaGUgbmFtZSBvZiBiaW5kaW5nIHZhcmlhYmxlXG4gICAqIEBwYXJhbSBleGFjdE1hdGNoIFdoZXRoZXIgdXNpbmcgZXhhY3RNYXRjaFxuICAgKi9cbiAgZmluZFByb3ZpZGVycyh1c2luZzogYW55LCBwcm92aWRlcjogc3RyaW5nLCBleGFjdE1hdGNoOiBib29sZWFuKTogYW55W10ge1xuICAgIC8vIFRPRE8oanVsaWVtcik6IGltcGxlbWVudC5cbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuLyoqXG4gKiBBIGdsb2JhbCByZWdpc3RyeSBvZiB7QGxpbmsgVGVzdGFiaWxpdHl9IGluc3RhbmNlcyBmb3Igc3BlY2lmaWMgZWxlbWVudHMuXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBUZXN0YWJpbGl0eVJlZ2lzdHJ5IHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfYXBwbGljYXRpb25zID0gbmV3IE1hcDxhbnksIFRlc3RhYmlsaXR5PigpO1xuXG4gIGNvbnN0cnVjdG9yKCkgeyBfdGVzdGFiaWxpdHlHZXR0ZXIuYWRkVG9XaW5kb3codGhpcyk7IH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGFuIGFwcGxpY2F0aW9uIHdpdGggYSB0ZXN0YWJpbGl0eSBob29rIHNvIHRoYXQgaXQgY2FuIGJlIHRyYWNrZWRcbiAgICogQHBhcmFtIHRva2VuIHRva2VuIG9mIGFwcGxpY2F0aW9uLCByb290IGVsZW1lbnRcbiAgICogQHBhcmFtIHRlc3RhYmlsaXR5IFRlc3RhYmlsaXR5IGhvb2tcbiAgICovXG4gIHJlZ2lzdGVyQXBwbGljYXRpb24odG9rZW46IGFueSwgdGVzdGFiaWxpdHk6IFRlc3RhYmlsaXR5KSB7XG4gICAgdGhpcy5fYXBwbGljYXRpb25zLnNldCh0b2tlbiwgdGVzdGFiaWxpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXJzIGFuIGFwcGxpY2F0aW9uLlxuICAgKiBAcGFyYW0gdG9rZW4gdG9rZW4gb2YgYXBwbGljYXRpb24sIHJvb3QgZWxlbWVudFxuICAgKi9cbiAgdW5yZWdpc3RlckFwcGxpY2F0aW9uKHRva2VuOiBhbnkpIHsgdGhpcy5fYXBwbGljYXRpb25zLmRlbGV0ZSh0b2tlbik7IH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlcnMgYWxsIGFwcGxpY2F0aW9uc1xuICAgKi9cbiAgdW5yZWdpc3RlckFsbEFwcGxpY2F0aW9ucygpIHsgdGhpcy5fYXBwbGljYXRpb25zLmNsZWFyKCk7IH1cblxuICAvKipcbiAgICogR2V0IGEgdGVzdGFiaWxpdHkgaG9vayBhc3NvY2lhdGVkIHdpdGggdGhlIGFwcGxpY2F0aW9uXG4gICAqIEBwYXJhbSBlbGVtIHJvb3QgZWxlbWVudFxuICAgKi9cbiAgZ2V0VGVzdGFiaWxpdHkoZWxlbTogYW55KTogVGVzdGFiaWxpdHl8bnVsbCB7IHJldHVybiB0aGlzLl9hcHBsaWNhdGlvbnMuZ2V0KGVsZW0pIHx8IG51bGw7IH1cblxuICAvKipcbiAgICogR2V0IGFsbCByZWdpc3RlcmVkIHRlc3RhYmlsaXRpZXNcbiAgICovXG4gIGdldEFsbFRlc3RhYmlsaXRpZXMoKTogVGVzdGFiaWxpdHlbXSB7IHJldHVybiBBcnJheS5mcm9tKHRoaXMuX2FwcGxpY2F0aW9ucy52YWx1ZXMoKSk7IH1cblxuICAvKipcbiAgICogR2V0IGFsbCByZWdpc3RlcmVkIGFwcGxpY2F0aW9ucyhyb290IGVsZW1lbnRzKVxuICAgKi9cbiAgZ2V0QWxsUm9vdEVsZW1lbnRzKCk6IGFueVtdIHsgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fYXBwbGljYXRpb25zLmtleXMoKSk7IH1cblxuICAvKipcbiAgICogRmluZCB0ZXN0YWJpbGl0eSBvZiBhIG5vZGUgaW4gdGhlIFRyZWVcbiAgICogQHBhcmFtIGVsZW0gbm9kZVxuICAgKiBAcGFyYW0gZmluZEluQW5jZXN0b3JzIHdoZXRoZXIgZmluZGluZyB0ZXN0YWJpbGl0eSBpbiBhbmNlc3RvcnMgaWYgdGVzdGFiaWxpdHkgd2FzIG5vdCBmb3VuZCBpblxuICAgKiBjdXJyZW50IG5vZGVcbiAgICovXG4gIGZpbmRUZXN0YWJpbGl0eUluVHJlZShlbGVtOiBOb2RlLCBmaW5kSW5BbmNlc3RvcnM6IGJvb2xlYW4gPSB0cnVlKTogVGVzdGFiaWxpdHl8bnVsbCB7XG4gICAgcmV0dXJuIF90ZXN0YWJpbGl0eUdldHRlci5maW5kVGVzdGFiaWxpdHlJblRyZWUodGhpcywgZWxlbSwgZmluZEluQW5jZXN0b3JzKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkYXB0ZXIgaW50ZXJmYWNlIGZvciByZXRyaWV2aW5nIHRoZSBgVGVzdGFiaWxpdHlgIHNlcnZpY2UgYXNzb2NpYXRlZCBmb3IgYVxuICogcGFydGljdWxhciBjb250ZXh0LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBHZXRUZXN0YWJpbGl0eSB7XG4gIGFkZFRvV2luZG93KHJlZ2lzdHJ5OiBUZXN0YWJpbGl0eVJlZ2lzdHJ5KTogdm9pZDtcbiAgZmluZFRlc3RhYmlsaXR5SW5UcmVlKHJlZ2lzdHJ5OiBUZXN0YWJpbGl0eVJlZ2lzdHJ5LCBlbGVtOiBhbnksIGZpbmRJbkFuY2VzdG9yczogYm9vbGVhbik6XG4gICAgICBUZXN0YWJpbGl0eXxudWxsO1xufVxuXG5jbGFzcyBfTm9vcEdldFRlc3RhYmlsaXR5IGltcGxlbWVudHMgR2V0VGVzdGFiaWxpdHkge1xuICBhZGRUb1dpbmRvdyhyZWdpc3RyeTogVGVzdGFiaWxpdHlSZWdpc3RyeSk6IHZvaWQge31cbiAgZmluZFRlc3RhYmlsaXR5SW5UcmVlKHJlZ2lzdHJ5OiBUZXN0YWJpbGl0eVJlZ2lzdHJ5LCBlbGVtOiBhbnksIGZpbmRJbkFuY2VzdG9yczogYm9vbGVhbik6XG4gICAgICBUZXN0YWJpbGl0eXxudWxsIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUge0BsaW5rIEdldFRlc3RhYmlsaXR5fSBpbXBsZW1lbnRhdGlvbiB1c2VkIGJ5IHRoZSBBbmd1bGFyIHRlc3RpbmcgZnJhbWV3b3JrLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0VGVzdGFiaWxpdHlHZXR0ZXIoZ2V0dGVyOiBHZXRUZXN0YWJpbGl0eSk6IHZvaWQge1xuICBfdGVzdGFiaWxpdHlHZXR0ZXIgPSBnZXR0ZXI7XG59XG5cbmxldCBfdGVzdGFiaWxpdHlHZXR0ZXI6IEdldFRlc3RhYmlsaXR5ID0gbmV3IF9Ob29wR2V0VGVzdGFiaWxpdHkoKTtcbiJdfQ==