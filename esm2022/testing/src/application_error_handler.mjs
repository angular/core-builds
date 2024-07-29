/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ErrorHandler, inject, NgZone, Injectable, ɵZONELESS_ENABLED as ZONELESS_ENABLED, } from '@angular/core';
import * as i0 from "@angular/core";
export class TestBedApplicationErrorHandler {
    constructor() {
        this.zone = inject(NgZone);
        this.userErrorHandler = inject(ErrorHandler);
        this.zoneless = inject(ZONELESS_ENABLED);
        this.whenStableRejectFunctions = new Set();
    }
    handleError(e) {
        // TODO(atscott): Investigate if we can align the behaviors of zone and zoneless
        if (this.zoneless) {
            this.zonelessHandleError(e);
        }
        else {
            this.zone.runOutsideAngular(() => this.userErrorHandler.handleError(e));
        }
    }
    zonelessHandleError(e) {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.2+sha-9304c45", ngImport: i0, type: TestBedApplicationErrorHandler, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.1.2+sha-9304c45", ngImport: i0, type: TestBedApplicationErrorHandler }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.1.2+sha-9304c45", ngImport: i0, type: TestBedApplicationErrorHandler, decorators: [{
            type: Injectable
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fZXJyb3JfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvYXBwbGljYXRpb25fZXJyb3JfaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsWUFBWSxFQUNaLE1BQU0sRUFDTixNQUFNLEVBQ04sVUFBVSxFQUNWLGlCQUFpQixJQUFJLGdCQUFnQixHQUN0QyxNQUFNLGVBQWUsQ0FBQzs7QUFHdkIsTUFBTSxPQUFPLDhCQUE4QjtJQUQzQztRQUVtQixTQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLHFCQUFnQixHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN4QyxhQUFRLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDNUMsOEJBQXlCLEdBQThCLElBQUksR0FBRyxFQUFFLENBQUM7S0E4QjNFO0lBNUJDLFdBQVcsQ0FBQyxDQUFVO1FBQ3BCLGdGQUFnRjtRQUNoRixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRSxDQUFDO0lBQ0gsQ0FBQztJQUVPLG1CQUFtQixDQUFDLENBQVU7UUFDcEMsSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUFDLE9BQU8sU0FBa0IsRUFBRSxDQUFDO1lBQzVCLENBQUMsR0FBRyxTQUFTLENBQUM7UUFDaEIsQ0FBQztRQUVELDBGQUEwRjtRQUMxRix3RUFBd0U7UUFDeEUsZ0RBQWdEO1FBQ2hELElBQUksSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM1QyxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUN6RCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pDLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxDQUFDLENBQUM7UUFDVixDQUFDO0lBQ0gsQ0FBQzt5SEFqQ1UsOEJBQThCOzZIQUE5Qiw4QkFBOEI7O3NHQUE5Qiw4QkFBOEI7a0JBRDFDLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRXJyb3JIYW5kbGVyLFxuICBpbmplY3QsXG4gIE5nWm9uZSxcbiAgSW5qZWN0YWJsZSxcbiAgybVaT05FTEVTU19FTkFCTEVEIGFzIFpPTkVMRVNTX0VOQUJMRUQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVsZXNzID0gaW5qZWN0KFpPTkVMRVNTX0VOQUJMRUQpO1xuICByZWFkb25seSB3aGVuU3RhYmxlUmVqZWN0RnVuY3Rpb25zOiBTZXQ8KGU6IHVua25vd24pID0+IHZvaWQ+ID0gbmV3IFNldCgpO1xuXG4gIGhhbmRsZUVycm9yKGU6IHVua25vd24pIHtcbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBJbnZlc3RpZ2F0ZSBpZiB3ZSBjYW4gYWxpZ24gdGhlIGJlaGF2aW9ycyBvZiB6b25lIGFuZCB6b25lbGVzc1xuICAgIGlmICh0aGlzLnpvbmVsZXNzKSB7XG4gICAgICB0aGlzLnpvbmVsZXNzSGFuZGxlRXJyb3IoZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLnVzZXJFcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgem9uZWxlc3NIYW5kbGVFcnJvcihlOiB1bmtub3duKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLnVzZXJFcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgIH0gY2F0Y2ggKHVzZXJFcnJvcjogdW5rbm93bikge1xuICAgICAgZSA9IHVzZXJFcnJvcjtcbiAgICB9XG5cbiAgICAvLyBJbnN0ZWFkIG9mIHRocm93aW5nIHRoZSBlcnJvciB3aGVuIHRoZXJlIGFyZSBvdXRzdGFuZGluZyBgZml4dHVyZS53aGVuU3RhYmxlYCBwcm9taXNlcyxcbiAgICAvLyByZWplY3QgdGhvc2UgcHJvbWlzZXMgd2l0aCB0aGUgZXJyb3IuIFRoaXMgYWxsb3dzIGRldmVsb3BlcnMgdG8gd3JpdGVcbiAgICAvLyBleHBlY3RBc3luYyhmaXgud2hlblN0YWJsZSgpKS50b0JlUmVqZWN0ZWQoKTtcbiAgICBpZiAodGhpcy53aGVuU3RhYmxlUmVqZWN0RnVuY3Rpb25zLnNpemUgPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGZuIG9mIHRoaXMud2hlblN0YWJsZVJlamVjdEZ1bmN0aW9ucy52YWx1ZXMoKSkge1xuICAgICAgICBmbihlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMud2hlblN0YWJsZVJlamVjdEZ1bmN0aW9ucy5jbGVhcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxufVxuIl19