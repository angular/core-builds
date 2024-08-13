/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ErrorHandler, inject, NgZone, Injectable } from '@angular/core';
import * as i0 from "@angular/core";
export const RETHROW_APPLICATION_ERRORS_DEFAULT = true;
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.0.0-next.0+sha-0a808fb", ngImport: i0, type: TestBedApplicationErrorHandler, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.0.0-next.0+sha-0a808fb", ngImport: i0, type: TestBedApplicationErrorHandler }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.0.0-next.0+sha-0a808fb", ngImport: i0, type: TestBedApplicationErrorHandler, decorators: [{
            type: Injectable
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvYXBwbGljYXRpb25fZXJyb3JfaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUV2RSxNQUFNLENBQUMsTUFBTSxrQ0FBa0MsR0FBRyxJQUFJLENBQUM7QUFHdkQsTUFBTSxPQUFPLDhCQUE4QjtJQUQzQztRQUVtQixTQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLHFCQUFnQixHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNoRCw4QkFBeUIsR0FBOEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztLQXFCM0U7SUFuQkMsV0FBVyxDQUFDLENBQVU7UUFDcEIsSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUFDLE9BQU8sU0FBa0IsRUFBRSxDQUFDO1lBQzVCLENBQUMsR0FBRyxTQUFTLENBQUM7UUFDaEIsQ0FBQztRQUVELDBGQUEwRjtRQUMxRix3RUFBd0U7UUFDeEUsZ0RBQWdEO1FBQ2hELElBQUksSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM1QyxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUN6RCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pDLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxDQUFDLENBQUM7UUFDVixDQUFDO0lBQ0gsQ0FBQzt5SEF2QlUsOEJBQThCOzZIQUE5Qiw4QkFBOEI7O3NHQUE5Qiw4QkFBOEI7a0JBRDFDLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFcnJvckhhbmRsZXIsIGluamVjdCwgTmdab25lLCBJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuZXhwb3J0IGNvbnN0IFJFVEhST1dfQVBQTElDQVRJT05fRVJST1JTX0RFRkFVTFQgPSB0cnVlO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICByZWFkb25seSB3aGVuU3RhYmxlUmVqZWN0RnVuY3Rpb25zOiBTZXQ8KGU6IHVua25vd24pID0+IHZvaWQ+ID0gbmV3IFNldCgpO1xuXG4gIGhhbmRsZUVycm9yKGU6IHVua25vd24pIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHRoaXMudXNlckVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgfSBjYXRjaCAodXNlckVycm9yOiB1bmtub3duKSB7XG4gICAgICBlID0gdXNlckVycm9yO1xuICAgIH1cblxuICAgIC8vIEluc3RlYWQgb2YgdGhyb3dpbmcgdGhlIGVycm9yIHdoZW4gdGhlcmUgYXJlIG91dHN0YW5kaW5nIGBmaXh0dXJlLndoZW5TdGFibGVgIHByb21pc2VzLFxuICAgIC8vIHJlamVjdCB0aG9zZSBwcm9taXNlcyB3aXRoIHRoZSBlcnJvci4gVGhpcyBhbGxvd3MgZGV2ZWxvcGVycyB0byB3cml0ZVxuICAgIC8vIGV4cGVjdEFzeW5jKGZpeC53aGVuU3RhYmxlKCkpLnRvQmVSZWplY3RlZCgpO1xuICAgIGlmICh0aGlzLndoZW5TdGFibGVSZWplY3RGdW5jdGlvbnMuc2l6ZSA+IDApIHtcbiAgICAgIGZvciAoY29uc3QgZm4gb2YgdGhpcy53aGVuU3RhYmxlUmVqZWN0RnVuY3Rpb25zLnZhbHVlcygpKSB7XG4gICAgICAgIGZuKGUpO1xuICAgICAgfVxuICAgICAgdGhpcy53aGVuU3RhYmxlUmVqZWN0RnVuY3Rpb25zLmNsZWFyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG59XG4iXX0=