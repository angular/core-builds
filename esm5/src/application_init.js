/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isPromise } from '../src/util/lang';
import { Inject, Injectable, InjectionToken, Optional } from './di';
/**
 * A function that will be executed when an application is initialized.
 * @experimental
 */
export var APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {@link APP_INITIALIZER}s.
 *
 * @experimental
 */
var ApplicationInitStatus = /** @class */ (function () {
    function ApplicationInitStatus(appInits) {
        var _this = this;
        this.appInits = appInits;
        this.initialized = false;
        this.done = false;
        this.donePromise = new Promise(function (res, rej) {
            _this.resolve = res;
            _this.reject = rej;
        });
    }
    /** @internal */
    ApplicationInitStatus.prototype.runInitializers = function () {
        var _this = this;
        if (this.initialized) {
            return;
        }
        var asyncInitPromises = [];
        var complete = function () {
            _this.done = true;
            _this.resolve();
        };
        if (this.appInits) {
            for (var i = 0; i < this.appInits.length; i++) {
                var initResult = this.appInits[i]();
                if (isPromise(initResult)) {
                    asyncInitPromises.push(initResult);
                }
            }
        }
        Promise.all(asyncInitPromises).then(function () { complete(); }).catch(function (e) { _this.reject(e); });
        if (asyncInitPromises.length === 0) {
            complete();
        }
        this.initialized = true;
    };
    ApplicationInitStatus.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    ApplicationInitStatus.ctorParameters = function () { return [
        { type: Array, decorators: [{ type: Inject, args: [APP_INITIALIZER,] }, { type: Optional }] }
    ]; };
    return ApplicationInitStatus;
}());
export { ApplicationInitStatus };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRTNDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFHbEU7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLElBQU0sZUFBZSxHQUFHLElBQUksY0FBYyxDQUFvQix5QkFBeUIsQ0FBQyxDQUFDO0FBRWhHOzs7O0dBSUc7QUFDSDtJQVVFLCtCQUF5RCxRQUF1QjtRQUFoRixpQkFLQztRQUx3RCxhQUFRLEdBQVIsUUFBUSxDQUFlO1FBSnhFLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1FBRVosU0FBSSxHQUFHLEtBQUssQ0FBQztRQUczQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksT0FBTyxDQUFDLFVBQUMsR0FBRyxFQUFFLEdBQUc7WUFDdEMsS0FBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7WUFDbkIsS0FBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLCtDQUFlLEdBQWY7UUFBQSxpQkEyQkM7UUExQkMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLE9BQU87U0FDUjtRQUVELElBQU0saUJBQWlCLEdBQW1CLEVBQUUsQ0FBQztRQUU3QyxJQUFNLFFBQVEsR0FBRztZQUNkLEtBQXVCLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNyQyxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDO1FBRUYsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDekIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNwQzthQUNGO1NBQ0Y7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLGNBQVEsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxDQUFDLElBQU0sS0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTNGLElBQUksaUJBQWlCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNsQyxRQUFRLEVBQUUsQ0FBQztTQUNaO1FBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDMUIsQ0FBQzs7Z0JBN0NGLFVBQVU7Ozs7NENBVUksTUFBTSxTQUFDLGVBQWUsY0FBRyxRQUFROztJQW9DaEQsNEJBQUM7Q0FBQSxBQTlDRCxJQThDQztTQTdDWSxxQkFBcUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aXNQcm9taXNlfSBmcm9tICcuLi9zcmMvdXRpbC9sYW5nJztcblxuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCBPcHRpb25hbH0gZnJvbSAnLi9kaSc7XG5cblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIGFuIGFwcGxpY2F0aW9uIGlzIGluaXRpYWxpemVkLlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY29uc3QgQVBQX0lOSVRJQUxJWkVSID0gbmV3IEluamVjdGlvblRva2VuPEFycmF5PCgpID0+IHZvaWQ+PignQXBwbGljYXRpb24gSW5pdGlhbGl6ZXInKTtcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgcmVmbGVjdHMgdGhlIHN0YXRlIG9mIHJ1bm5pbmcge0BsaW5rIEFQUF9JTklUSUFMSVpFUn1zLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIHJlc29sdmUgITogRnVuY3Rpb247XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIHJlamVjdCAhOiBGdW5jdGlvbjtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZVByb21pc2U6IFByb21pc2U8YW55PjtcbiAgcHVibGljIHJlYWRvbmx5IGRvbmUgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KEFQUF9JTklUSUFMSVpFUikgQE9wdGlvbmFsKCkgcHJpdmF0ZSBhcHBJbml0czogKCgpID0+IGFueSlbXSkge1xuICAgIHRoaXMuZG9uZVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlcztcbiAgICAgIHRoaXMucmVqZWN0ID0gcmVqO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBydW5Jbml0aWFsaXplcnMoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhc3luY0luaXRQcm9taXNlczogUHJvbWlzZTxhbnk+W10gPSBbXTtcblxuICAgIGNvbnN0IGNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgKHRoaXMgYXN7ZG9uZTogYm9vbGVhbn0pLmRvbmUgPSB0cnVlO1xuICAgICAgdGhpcy5yZXNvbHZlKCk7XG4gICAgfTtcblxuICAgIGlmICh0aGlzLmFwcEluaXRzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXBwSW5pdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5pdFJlc3VsdCA9IHRoaXMuYXBwSW5pdHNbaV0oKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShpbml0UmVzdWx0KSkge1xuICAgICAgICAgIGFzeW5jSW5pdFByb21pc2VzLnB1c2goaW5pdFJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBQcm9taXNlLmFsbChhc3luY0luaXRQcm9taXNlcykudGhlbigoKSA9PiB7IGNvbXBsZXRlKCk7IH0pLmNhdGNoKGUgPT4geyB0aGlzLnJlamVjdChlKTsgfSk7XG5cbiAgICBpZiAoYXN5bmNJbml0UHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb21wbGV0ZSgpO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxufVxuIl19