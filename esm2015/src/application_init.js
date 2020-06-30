/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isPromise } from '../src/util/lang';
import { Inject, Injectable, InjectionToken, Optional } from './di';
import * as i0 from "./r3_symbols";
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that you can use to provide
 * one or more initialization functions.
 *
 * The provided function are injected at application startup and executed during
 * app initialization. If any of these functions returns a Promise, initialization
 * does not complete until the Promise is resolved.
 *
 * You can, for example, create a factory function that loads language data
 * or an external configuration, and provide that function to the `APP_INITIALIZER` token.
 * The function is executed during the application bootstrap process,
 * and the needed data is available on startup.
 *
 * @see `ApplicationInitStatus`
 *
 * @publicApi
 */
export const APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {@link APP_INITIALIZER} functions.
 *
 * @publicApi
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
        Promise.all(asyncInitPromises)
            .then(() => {
            complete();
        })
            .catch(e => {
            this.reject(e);
        });
        if (asyncInitPromises.length === 0) {
            complete();
        }
        this.initialized = true;
    }
}
ApplicationInitStatus.ɵfac = function ApplicationInitStatus_Factory(t) { return new (t || ApplicationInitStatus)(i0.ɵɵinject(APP_INITIALIZER, 8)); };
ApplicationInitStatus.ɵprov = i0.ɵɵdefineInjectable({ token: ApplicationInitStatus, factory: ApplicationInitStatus.ɵfac });
/*@__PURE__*/ (function () { i0.setClassMetadata(ApplicationInitStatus, [{
        type: Injectable
    }], function () { return [{ type: undefined, decorators: [{
                type: Inject,
                args: [APP_INITIALIZER]
            }, {
                type: Optional
            }] }]; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRTNDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUMsTUFBTSxNQUFNLENBQUM7O0FBR2xFOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLElBQUksY0FBYyxDQUFvQix5QkFBeUIsQ0FBQyxDQUFDO0FBRWhHOzs7O0dBSUc7QUFFSCxNQUFNLE9BQU8scUJBQXFCO0lBU2hDLFlBQXlELFFBQXVCO1FBQXZCLGFBQVEsR0FBUixRQUFRLENBQWU7UUFKeEUsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFWixTQUFJLEdBQUcsS0FBSyxDQUFDO1FBRzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7WUFDbkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsZ0JBQWdCO0lBQ2hCLGVBQWU7UUFDYixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEIsT0FBTztTQUNSO1FBRUQsTUFBTSxpQkFBaUIsR0FBbUIsRUFBRSxDQUFDO1FBRTdDLE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtZQUNuQixJQUF3QixDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDdEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQztRQUVGLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNqQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3pCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDcEM7YUFDRjtTQUNGO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQzthQUN6QixJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ1QsUUFBUSxFQUFFLENBQUM7UUFDYixDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLFFBQVEsRUFBRSxDQUFDO1NBQ1o7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUMxQixDQUFDOzswRkFsRFUscUJBQXFCLGNBU1osZUFBZTs2REFUeEIscUJBQXFCLFdBQXJCLHFCQUFxQjtpREFBckIscUJBQXFCO2NBRGpDLFVBQVU7O3NCQVVJLE1BQU07dUJBQUMsZUFBZTs7c0JBQUcsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vc3JjL3V0aWwvbGFuZyc7XG5cbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgT3B0aW9uYWx9IGZyb20gJy4vZGknO1xuXG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSB0aGF0IHlvdSBjYW4gdXNlIHRvIHByb3ZpZGVcbiAqIG9uZSBvciBtb3JlIGluaXRpYWxpemF0aW9uIGZ1bmN0aW9ucy5cbiAqXG4gKiBUaGUgcHJvdmlkZWQgZnVuY3Rpb24gYXJlIGluamVjdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0dXAgYW5kIGV4ZWN1dGVkIGR1cmluZ1xuICogYXBwIGluaXRpYWxpemF0aW9uLiBJZiBhbnkgb2YgdGhlc2UgZnVuY3Rpb25zIHJldHVybnMgYSBQcm9taXNlLCBpbml0aWFsaXphdGlvblxuICogZG9lcyBub3QgY29tcGxldGUgdW50aWwgdGhlIFByb21pc2UgaXMgcmVzb2x2ZWQuXG4gKlxuICogWW91IGNhbiwgZm9yIGV4YW1wbGUsIGNyZWF0ZSBhIGZhY3RvcnkgZnVuY3Rpb24gdGhhdCBsb2FkcyBsYW5ndWFnZSBkYXRhXG4gKiBvciBhbiBleHRlcm5hbCBjb25maWd1cmF0aW9uLCBhbmQgcHJvdmlkZSB0aGF0IGZ1bmN0aW9uIHRvIHRoZSBgQVBQX0lOSVRJQUxJWkVSYCB0b2tlbi5cbiAqIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBkdXJpbmcgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBwcm9jZXNzLFxuICogYW5kIHRoZSBuZWVkZWQgZGF0YSBpcyBhdmFpbGFibGUgb24gc3RhcnR1cC5cbiAqXG4gKiBAc2VlIGBBcHBsaWNhdGlvbkluaXRTdGF0dXNgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQVBQX0lOSVRJQUxJWkVSID0gbmV3IEluamVjdGlvblRva2VuPEFycmF5PCgpID0+IHZvaWQ+PignQXBwbGljYXRpb24gSW5pdGlhbGl6ZXInKTtcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgcmVmbGVjdHMgdGhlIHN0YXRlIG9mIHJ1bm5pbmcge0BsaW5rIEFQUF9JTklUSUFMSVpFUn0gZnVuY3Rpb25zLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIHJlc29sdmUhOiBGdW5jdGlvbjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgcmVqZWN0ITogRnVuY3Rpb247XG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHVibGljIHJlYWRvbmx5IGRvbmVQcm9taXNlOiBQcm9taXNlPGFueT47XG4gIHB1YmxpYyByZWFkb25seSBkb25lID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChBUFBfSU5JVElBTElaRVIpIEBPcHRpb25hbCgpIHByaXZhdGUgYXBwSW5pdHM6ICgoKSA9PiBhbnkpW10pIHtcbiAgICB0aGlzLmRvbmVQcm9taXNlID0gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXM7XG4gICAgICB0aGlzLnJlamVjdCA9IHJlajtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcnVuSW5pdGlhbGl6ZXJzKCkge1xuICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYXN5bmNJbml0UHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XG5cbiAgICBjb25zdCBjb21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICh0aGlzIGFzIHtkb25lOiBib29sZWFufSkuZG9uZSA9IHRydWU7XG4gICAgICB0aGlzLnJlc29sdmUoKTtcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuYXBwSW5pdHMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hcHBJbml0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpbml0UmVzdWx0ID0gdGhpcy5hcHBJbml0c1tpXSgpO1xuICAgICAgICBpZiAoaXNQcm9taXNlKGluaXRSZXN1bHQpKSB7XG4gICAgICAgICAgYXN5bmNJbml0UHJvbWlzZXMucHVzaChpbml0UmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIFByb21pc2UuYWxsKGFzeW5jSW5pdFByb21pc2VzKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgY29tcGxldGUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgIHRoaXMucmVqZWN0KGUpO1xuICAgICAgICB9KTtcblxuICAgIGlmIChhc3luY0luaXRQcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbXBsZXRlKCk7XG4gICAgfVxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG59XG4iXX0=