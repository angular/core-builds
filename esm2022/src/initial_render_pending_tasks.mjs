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
export class InitialRenderPendingTasks {
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
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(InitialRenderPendingTasks, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdGlhbF9yZW5kZXJfcGVuZGluZ190YXNrcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2luaXRpYWxfcmVuZGVyX3BlbmRpbmdfdGFza3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUVyQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDOztBQUdoQzs7Ozs7Ozs7R0FRRztBQUVILE1BQU0sT0FBTyx5QkFBeUI7SUFEdEM7UUFFVSxXQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsaUJBQVksR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQ3pDLG9CQUFlLEdBQUcsSUFBSSxlQUFlLENBQVUsS0FBSyxDQUFDLENBQUM7S0FvQnZEO0lBbEJDLEdBQUc7UUFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUIsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFjO1FBQ25CLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsQ0FBQztJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDOzBGQXRCVSx5QkFBeUI7dUVBQXpCLHlCQUF5QixXQUF6Qix5QkFBeUIsbUJBRGIsTUFBTTs7Z0ZBQ2xCLHlCQUF5QjtjQURyQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmVoYXZpb3JTdWJqZWN0fSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuL2RpJztcbmltcG9ydCB7T25EZXN0cm95fSBmcm9tICcuL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuXG4vKipcbiAqICpJbnRlcm5hbCogc2VydmljZSB0aGF0IGtlZXBzIHRyYWNrIG9mIHBlbmRpbmcgdGFza3MgaGFwcGVuaW5nIGluIHRoZSBzeXN0ZW1cbiAqIGR1cmluZyB0aGUgaW5pdGlhbCByZW5kZXJpbmcuIE5vIHRhc2tzIGFyZSB0cmFja2VkIGFmdGVyIGFuIGluaXRpYWxcbiAqIHJlbmRlcmluZy5cbiAqXG4gKiBUaGlzIGluZm9ybWF0aW9uIGlzIG5lZWRlZCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgc2VyaWFsaXphdGlvbiBvbiB0aGUgc2VydmVyXG4gKiBpcyBkZWxheWVkIHVudGlsIGFsbCB0YXNrcyBpbiB0aGUgcXVldWUgKHN1Y2ggYXMgYW4gaW5pdGlhbCBuYXZpZ2F0aW9uIG9yIGFcbiAqIHBlbmRpbmcgSFRUUCByZXF1ZXN0KSBhcmUgY29tcGxldGVkLlxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBJbml0aWFsUmVuZGVyUGVuZGluZ1Rhc2tzIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSB0YXNrSWQgPSAwO1xuICBwcml2YXRlIHBlbmRpbmdUYXNrcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuICBoYXNQZW5kaW5nVGFza3MgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PGJvb2xlYW4+KGZhbHNlKTtcblxuICBhZGQoKTogbnVtYmVyIHtcbiAgICB0aGlzLmhhc1BlbmRpbmdUYXNrcy5uZXh0KHRydWUpO1xuICAgIGNvbnN0IHRhc2tJZCA9IHRoaXMudGFza0lkKys7XG4gICAgdGhpcy5wZW5kaW5nVGFza3MuYWRkKHRhc2tJZCk7XG4gICAgcmV0dXJuIHRhc2tJZDtcbiAgfVxuXG4gIHJlbW92ZSh0YXNrSWQ6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMucGVuZGluZ1Rhc2tzLmRlbGV0ZSh0YXNrSWQpO1xuICAgIGlmICh0aGlzLnBlbmRpbmdUYXNrcy5zaXplID09PSAwKSB7XG4gICAgICB0aGlzLmhhc1BlbmRpbmdUYXNrcy5uZXh0KGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnBlbmRpbmdUYXNrcy5jbGVhcigpO1xuICAgIHRoaXMuaGFzUGVuZGluZ1Rhc2tzLm5leHQoZmFsc2UpO1xuICB9XG59XG4iXX0=