import * as i0 from "./r3_symbols";
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
 */
export const APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {@link APP_INITIALIZER}s.
 */
export class ApplicationInitStatus {
    constructor(appInits) {
        this.appInits = appInits;
        this.initialized = false;
        this.done = false;
        this.donePromise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }
    /** @internal */
    runInitializers() {
        if (this.initialized) {
            return;
        }
        const asyncInitPromises = [];
        const complete = () => {
            this.done = true;
            this.resolve();
        };
        if (this.appInits) {
            for (let i = 0; i < this.appInits.length; i++) {
                const initResult = this.appInits[i]();
                if (isPromise(initResult)) {
                    asyncInitPromises.push(initResult);
                }
            }
        }
        Promise.all(asyncInitPromises).then(() => { complete(); }).catch(e => { this.reject(e); });
        if (asyncInitPromises.length === 0) {
            complete();
        }
        this.initialized = true;
    }
}
ApplicationInitStatus.ngInjectableDef = i0.defineInjectable({ token: ApplicationInitStatus, factory: function ApplicationInitStatus_Factory() { return new ApplicationInitStatus(i0.inject(APP_INITIALIZER, 8)); }, providedIn: null });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUUzQyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBR2xFOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLElBQUksY0FBYyxDQUFvQix5QkFBeUIsQ0FBQyxDQUFDO0FBRWhHOztHQUVHO0FBRUgsTUFBTTtJQVNKLFlBQXlELFFBQXVCO1FBQXZCLGFBQVEsR0FBUixRQUFRLENBQWU7UUFKeEUsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFWixTQUFJLEdBQUcsS0FBSyxDQUFDO1FBRzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7WUFDbkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLGVBQWU7UUFDYixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEIsT0FBTztTQUNSO1FBRUQsTUFBTSxpQkFBaUIsR0FBbUIsRUFBRSxDQUFDO1FBRTdDLE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtZQUNuQixJQUF1QixDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDckMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQztRQUVGLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNqQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3pCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDcEM7YUFDRjtTQUNGO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUzRixJQUFJLGlCQUFpQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbEMsUUFBUSxFQUFFLENBQUM7U0FDWjtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzFCLENBQUM7O3FFQTVDVSxxQkFBcUIsaUVBQXJCLHFCQUFxQixXQVNaLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aXNQcm9taXNlfSBmcm9tICcuLi9zcmMvdXRpbC9sYW5nJztcblxuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCBPcHRpb25hbH0gZnJvbSAnLi9kaSc7XG5cblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCB3aGVuIGFuIGFwcGxpY2F0aW9uIGlzIGluaXRpYWxpemVkLlxuICovXG5leHBvcnQgY29uc3QgQVBQX0lOSVRJQUxJWkVSID0gbmV3IEluamVjdGlvblRva2VuPEFycmF5PCgpID0+IHZvaWQ+PignQXBwbGljYXRpb24gSW5pdGlhbGl6ZXInKTtcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgcmVmbGVjdHMgdGhlIHN0YXRlIG9mIHJ1bm5pbmcge0BsaW5rIEFQUF9JTklUSUFMSVpFUn1zLlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25Jbml0U3RhdHVzIHtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgcmVzb2x2ZSAhOiBGdW5jdGlvbjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgcmVqZWN0ICE6IEZ1bmN0aW9uO1xuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBkb25lUHJvbWlzZTogUHJvbWlzZTxhbnk+O1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoQVBQX0lOSVRJQUxJWkVSKSBAT3B0aW9uYWwoKSBwcml2YXRlIGFwcEluaXRzOiAoKCkgPT4gYW55KVtdKSB7XG4gICAgdGhpcy5kb25lUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzO1xuICAgICAgdGhpcy5yZWplY3QgPSByZWo7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHJ1bkluaXRpYWxpemVycygpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFzeW5jSW5pdFByb21pc2VzOiBQcm9taXNlPGFueT5bXSA9IFtdO1xuXG4gICAgY29uc3QgY29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAodGhpcyBhc3tkb25lOiBib29sZWFufSkuZG9uZSA9IHRydWU7XG4gICAgICB0aGlzLnJlc29sdmUoKTtcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuYXBwSW5pdHMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hcHBJbml0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpbml0UmVzdWx0ID0gdGhpcy5hcHBJbml0c1tpXSgpO1xuICAgICAgICBpZiAoaXNQcm9taXNlKGluaXRSZXN1bHQpKSB7XG4gICAgICAgICAgYXN5bmNJbml0UHJvbWlzZXMucHVzaChpbml0UmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIFByb21pc2UuYWxsKGFzeW5jSW5pdFByb21pc2VzKS50aGVuKCgpID0+IHsgY29tcGxldGUoKTsgfSkuY2F0Y2goZSA9PiB7IHRoaXMucmVqZWN0KGUpOyB9KTtcblxuICAgIGlmIChhc3luY0luaXRQcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbXBsZXRlKCk7XG4gICAgfVxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG59XG4iXX0=