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
 * *Internal* service that keeps track of pending tasks happening in the system
 * during the initial rendering. No tasks are tracked after an initial
 * rendering.
 *
 * This information is needed to make sure that the serialization on the server
 * is delayed until all tasks in the queue (such as an initial navigation or a
 * pending HTTP request) are completed.
 */
class InitialRenderPendingTasks {
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
    static { this.ɵfac = function InitialRenderPendingTasks_Factory(t) { return new (t || InitialRenderPendingTasks)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: InitialRenderPendingTasks, factory: InitialRenderPendingTasks.ɵfac, providedIn: 'root' }); }
}
export { InitialRenderPendingTasks };
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(InitialRenderPendingTasks, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdGlhbF9yZW5kZXJfcGVuZGluZ190YXNrcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2luaXRpYWxfcmVuZGVyX3BlbmRpbmdfdGFza3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUVyQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDOztBQUdoQzs7Ozs7Ozs7R0FRRztBQUNILE1BQ2EseUJBQXlCO0lBRHRDO1FBRVUsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUNYLGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUN6QyxvQkFBZSxHQUFHLElBQUksZUFBZSxDQUFVLEtBQUssQ0FBQyxDQUFDO0tBb0J2RDtJQWxCQyxHQUFHO1FBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlCLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxNQUFNLENBQUMsTUFBYztRQUNuQixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtZQUNoQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNsQztJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDOzBGQXRCVSx5QkFBeUI7dUVBQXpCLHlCQUF5QixXQUF6Qix5QkFBeUIsbUJBRGIsTUFBTTs7U0FDbEIseUJBQXlCO3NGQUF6Qix5QkFBeUI7Y0FEckMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0JlaGF2aW9yU3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge09uRGVzdHJveX0gZnJvbSAnLi9pbnRlcmZhY2UvbGlmZWN5Y2xlX2hvb2tzJztcblxuLyoqXG4gKiAqSW50ZXJuYWwqIHNlcnZpY2UgdGhhdCBrZWVwcyB0cmFjayBvZiBwZW5kaW5nIHRhc2tzIGhhcHBlbmluZyBpbiB0aGUgc3lzdGVtXG4gKiBkdXJpbmcgdGhlIGluaXRpYWwgcmVuZGVyaW5nLiBObyB0YXNrcyBhcmUgdHJhY2tlZCBhZnRlciBhbiBpbml0aWFsXG4gKiByZW5kZXJpbmcuXG4gKlxuICogVGhpcyBpbmZvcm1hdGlvbiBpcyBuZWVkZWQgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHNlcmlhbGl6YXRpb24gb24gdGhlIHNlcnZlclxuICogaXMgZGVsYXllZCB1bnRpbCBhbGwgdGFza3MgaW4gdGhlIHF1ZXVlIChzdWNoIGFzIGFuIGluaXRpYWwgbmF2aWdhdGlvbiBvciBhXG4gKiBwZW5kaW5nIEhUVFAgcmVxdWVzdCkgYXJlIGNvbXBsZXRlZC5cbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgSW5pdGlhbFJlbmRlclBlbmRpbmdUYXNrcyBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgdGFza0lkID0gMDtcbiAgcHJpdmF0ZSBwZW5kaW5nVGFza3MgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgaGFzUGVuZGluZ1Rhc2tzID0gbmV3IEJlaGF2aW9yU3ViamVjdDxib29sZWFuPihmYWxzZSk7XG5cbiAgYWRkKCk6IG51bWJlciB7XG4gICAgdGhpcy5oYXNQZW5kaW5nVGFza3MubmV4dCh0cnVlKTtcbiAgICBjb25zdCB0YXNrSWQgPSB0aGlzLnRhc2tJZCsrO1xuICAgIHRoaXMucGVuZGluZ1Rhc2tzLmFkZCh0YXNrSWQpO1xuICAgIHJldHVybiB0YXNrSWQ7XG4gIH1cblxuICByZW1vdmUodGFza0lkOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5kZWxldGUodGFza0lkKTtcbiAgICBpZiAodGhpcy5wZW5kaW5nVGFza3Muc2l6ZSA9PT0gMCkge1xuICAgICAgdGhpcy5oYXNQZW5kaW5nVGFza3MubmV4dChmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5wZW5kaW5nVGFza3MuY2xlYXIoKTtcbiAgICB0aGlzLmhhc1BlbmRpbmdUYXNrcy5uZXh0KGZhbHNlKTtcbiAgfVxufVxuIl19