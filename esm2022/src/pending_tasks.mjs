/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BehaviorSubject } from 'rxjs';
import { Injectable } from './di';
import * as i0 from "./r3_symbols";
/**
 * *Internal* service that keeps track of pending tasks happening in the system.
 *
 * This information is needed to make sure that the serialization on the server
 * is delayed until all tasks in the queue (such as an initial navigation or a
 * pending HTTP request) are completed.
 *
 * Pending tasks continue to contribute to the stableness of `ApplicationRef`
 * throughout the lifetime of the application.
 */
export class PendingTasks {
    constructor() {
        this.taskId = 0;
        this.pendingTasks = new Set();
        this.hasPendingTasks = new BehaviorSubject(false);
    }
    add() {
        this.hasPendingTasks.next(true);
        const taskId = this.taskId++;
        this.pendingTasks.add(taskId);
        return taskId;
    }
    remove(taskId) {
        this.pendingTasks.delete(taskId);
        if (this.pendingTasks.size === 0) {
            this.hasPendingTasks.next(false);
        }
    }
    ngOnDestroy() {
        this.pendingTasks.clear();
        this.hasPendingTasks.next(false);
    }
    static { this.ɵfac = function PendingTasks_Factory(t) { return new (t || PendingTasks)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: PendingTasks, factory: PendingTasks.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(PendingTasks, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVuZGluZ190YXNrcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3BlbmRpbmdfdGFza3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUVyQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDOztBQUdoQzs7Ozs7Ozs7O0dBU0c7QUFFSCxNQUFNLE9BQU8sWUFBWTtJQUR6QjtRQUVVLFdBQU0sR0FBRyxDQUFDLENBQUM7UUFDWCxpQkFBWSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFDekMsb0JBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBVSxLQUFLLENBQUMsQ0FBQztLQW9CdkQ7SUFsQkMsR0FBRztRQUNELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5QixPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsTUFBTSxDQUFDLE1BQWM7UUFDbkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7WUFDaEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbEM7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkMsQ0FBQzs2RUF0QlUsWUFBWTt1RUFBWixZQUFZLFdBQVosWUFBWSxtQkFEQSxNQUFNOztnRkFDbEIsWUFBWTtjQUR4QixVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmVoYXZpb3JTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuL2RpJztcbmltcG9ydCB7T25EZXN0cm95fSBmcm9tICcuL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuXG4vKipcbiAqICpJbnRlcm5hbCogc2VydmljZSB0aGF0IGtlZXBzIHRyYWNrIG9mIHBlbmRpbmcgdGFza3MgaGFwcGVuaW5nIGluIHRoZSBzeXN0ZW0uXG4gKlxuICogVGhpcyBpbmZvcm1hdGlvbiBpcyBuZWVkZWQgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHNlcmlhbGl6YXRpb24gb24gdGhlIHNlcnZlclxuICogaXMgZGVsYXllZCB1bnRpbCBhbGwgdGFza3MgaW4gdGhlIHF1ZXVlIChzdWNoIGFzIGFuIGluaXRpYWwgbmF2aWdhdGlvbiBvciBhXG4gKiBwZW5kaW5nIEhUVFAgcmVxdWVzdCkgYXJlIGNvbXBsZXRlZC5cbiAqXG4gKiBQZW5kaW5nIHRhc2tzIGNvbnRpbnVlIHRvIGNvbnRyaWJ1dGUgdG8gdGhlIHN0YWJsZW5lc3Mgb2YgYEFwcGxpY2F0aW9uUmVmYFxuICogdGhyb3VnaG91dCB0aGUgbGlmZXRpbWUgb2YgdGhlIGFwcGxpY2F0aW9uLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBQZW5kaW5nVGFza3MgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICBwcml2YXRlIHRhc2tJZCA9IDA7XG4gIHByaXZhdGUgcGVuZGluZ1Rhc2tzID0gbmV3IFNldDxudW1iZXI+KCk7XG4gIGhhc1BlbmRpbmdUYXNrcyA9IG5ldyBCZWhhdmlvclN1YmplY3Q8Ym9vbGVhbj4oZmFsc2UpO1xuXG4gIGFkZCgpOiBudW1iZXIge1xuICAgIHRoaXMuaGFzUGVuZGluZ1Rhc2tzLm5leHQodHJ1ZSk7XG4gICAgY29uc3QgdGFza0lkID0gdGhpcy50YXNrSWQrKztcbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5hZGQodGFza0lkKTtcbiAgICByZXR1cm4gdGFza0lkO1xuICB9XG5cbiAgcmVtb3ZlKHRhc2tJZDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5wZW5kaW5nVGFza3MuZGVsZXRlKHRhc2tJZCk7XG4gICAgaWYgKHRoaXMucGVuZGluZ1Rhc2tzLnNpemUgPT09IDApIHtcbiAgICAgIHRoaXMuaGFzUGVuZGluZ1Rhc2tzLm5leHQoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMucGVuZGluZ1Rhc2tzLmNsZWFyKCk7XG4gICAgdGhpcy5oYXNQZW5kaW5nVGFza3MubmV4dChmYWxzZSk7XG4gIH1cbn1cbiJdfQ==