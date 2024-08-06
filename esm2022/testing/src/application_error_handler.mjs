/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ErrorHandler, inject, NgZone, Injectable, InjectionToken } from '@angular/core';
import * as i0 from "@angular/core";
export const RETHROW_APPLICATION_ERRORS = new InjectionToken('rethrow application errors');
export class TestBedApplicationErrorHandler {
    constructor() {
        this.zone = inject(NgZone);
        this.userErrorHandler = inject(ErrorHandler);
        this.whenStableRejectFunctions = new Set();
    }
    handleError(e) {
        try {
            this.zone.runOutsideAngular(() => this.userErrorHandler.handleError(e));
        }
        catch (userError) {
            e = userError;
        }
        // Instead of throwing the error when there are outstanding `fixture.whenStable` promises,
        // reject those promises with the error. This allows developers to write
        // expectAsync(fix.whenStable()).toBeRejected();
        if (this.whenStableRejectFunctions.size > 0) {
            for (const fn of this.whenStableRejectFunctions.values()) {
                fn(e);
            }
            this.whenStableRejectFunctions.clear();
        }
        else {
            throw e;
        }
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.3+sha-8c029c6", ngImport: i0, type: TestBedApplicationErrorHandler, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.1.3+sha-8c029c6", ngImport: i0, type: TestBedApplicationErrorHandler }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.1.3+sha-8c029c6", ngImport: i0, type: TestBedApplicationErrorHandler, decorators: [{
            type: Injectable
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvYXBwbGljYXRpb25fZXJyb3JfaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7QUFFdkYsTUFBTSxDQUFDLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxjQUFjLENBQVUsNEJBQTRCLENBQUMsQ0FBQztBQUdwRyxNQUFNLE9BQU8sOEJBQThCO0lBRDNDO1FBRW1CLFNBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIscUJBQWdCLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hELDhCQUF5QixHQUE4QixJQUFJLEdBQUcsRUFBRSxDQUFDO0tBcUIzRTtJQW5CQyxXQUFXLENBQUMsQ0FBVTtRQUNwQixJQUFJLENBQUM7WUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQUMsT0FBTyxTQUFrQixFQUFFLENBQUM7WUFDNUIsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNoQixDQUFDO1FBRUQsMEZBQTBGO1FBQzFGLHdFQUF3RTtRQUN4RSxnREFBZ0Q7UUFDaEQsSUFBSSxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzVDLEtBQUssTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3pELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekMsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLENBQUMsQ0FBQztRQUNWLENBQUM7SUFDSCxDQUFDO3lIQXZCVSw4QkFBOEI7NkhBQTlCLDhCQUE4Qjs7c0dBQTlCLDhCQUE4QjtrQkFEMUMsVUFBVSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Vycm9ySGFuZGxlciwgaW5qZWN0LCBOZ1pvbmUsIEluamVjdGFibGUsIEluamVjdGlvblRva2VufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuZXhwb3J0IGNvbnN0IFJFVEhST1dfQVBQTElDQVRJT05fRVJST1JTID0gbmV3IEluamVjdGlvblRva2VuPGJvb2xlYW4+KCdyZXRocm93IGFwcGxpY2F0aW9uIGVycm9ycycpO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICByZWFkb25seSB3aGVuU3RhYmxlUmVqZWN0RnVuY3Rpb25zOiBTZXQ8KGU6IHVua25vd24pID0+IHZvaWQ+ID0gbmV3IFNldCgpO1xuXG4gIGhhbmRsZUVycm9yKGU6IHVua25vd24pIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHRoaXMudXNlckVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgfSBjYXRjaCAodXNlckVycm9yOiB1bmtub3duKSB7XG4gICAgICBlID0gdXNlckVycm9yO1xuICAgIH1cblxuICAgIC8vIEluc3RlYWQgb2YgdGhyb3dpbmcgdGhlIGVycm9yIHdoZW4gdGhlcmUgYXJlIG91dHN0YW5kaW5nIGBmaXh0dXJlLndoZW5TdGFibGVgIHByb21pc2VzLFxuICAgIC8vIHJlamVjdCB0aG9zZSBwcm9taXNlcyB3aXRoIHRoZSBlcnJvci4gVGhpcyBhbGxvd3MgZGV2ZWxvcGVycyB0byB3cml0ZVxuICAgIC8vIGV4cGVjdEFzeW5jKGZpeC53aGVuU3RhYmxlKCkpLnRvQmVSZWplY3RlZCgpO1xuICAgIGlmICh0aGlzLndoZW5TdGFibGVSZWplY3RGdW5jdGlvbnMuc2l6ZSA+IDApIHtcbiAgICAgIGZvciAoY29uc3QgZm4gb2YgdGhpcy53aGVuU3RhYmxlUmVqZWN0RnVuY3Rpb25zLnZhbHVlcygpKSB7XG4gICAgICAgIGZuKGUpO1xuICAgICAgfVxuICAgICAgdGhpcy53aGVuU3RhYmxlUmVqZWN0RnVuY3Rpb25zLmNsZWFyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG59XG4iXX0=