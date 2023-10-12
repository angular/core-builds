/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵɵdefineInjectable } from '../di';
/**
 * Registers a cleanup function associated with a prefetching trigger
 * of a given defer block.
 */
export function registerTDetailsCleanup(injector, tDetails, key, cleanupFn) {
    injector.get(DeferBlockCleanupManager).add(tDetails, key, cleanupFn);
}
/**
 * Invokes all registered prefetch cleanup triggers
 * and removes all cleanup functions afterwards.
 */
export function invokeTDetailsCleanup(injector, tDetails) {
    injector.get(DeferBlockCleanupManager).cleanup(tDetails);
}
/**
 * Internal service to keep track of cleanup functions associated
 * with defer blocks. This class is used to manage cleanup functions
 * created for prefetching triggers.
 */
export class DeferBlockCleanupManager {
    constructor() {
        this.blocks = new Map();
    }
    add(tDetails, key, callback) {
        if (!this.blocks.has(tDetails)) {
            this.blocks.set(tDetails, new Map());
        }
        const block = this.blocks.get(tDetails);
        if (!block.has(key)) {
            block.set(key, []);
        }
        const callbacks = block.get(key);
        callbacks.push(callback);
    }
    has(tDetails, key) {
        return !!this.blocks.get(tDetails)?.has(key);
    }
    cleanup(tDetails) {
        const block = this.blocks.get(tDetails);
        if (block) {
            for (const callbacks of Object.values(block)) {
                for (const callback of callbacks) {
                    callback();
                }
            }
            this.blocks.delete(tDetails);
        }
    }
    ngOnDestroy() {
        for (const [block] of this.blocks) {
            this.cleanup(block);
        }
        this.blocks.clear();
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: DeferBlockCleanupManager,
        providedIn: 'root',
        factory: () => new DeferBlockCleanupManager(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xlYW51cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlZmVyL2NsZWFudXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFXLGtCQUFrQixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBSW5EOzs7R0FHRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsUUFBa0IsRUFBRSxRQUE0QixFQUFFLEdBQVcsRUFBRSxTQUF1QjtJQUN4RixRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUNEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxRQUFrQixFQUFFLFFBQTRCO0lBQ3BGLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUNEOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sd0JBQXdCO0lBQXJDO1FBQ1UsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFtRCxDQUFDO0lBMkM5RSxDQUFDO0lBekNDLEdBQUcsQ0FBQyxRQUE0QixFQUFFLEdBQVcsRUFBRSxRQUFzQjtRQUNuRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztTQUN0QztRQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBRSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ25CLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ3BCO1FBQ0QsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQztRQUNsQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxHQUFHLENBQUMsUUFBNEIsRUFBRSxHQUFXO1FBQzNDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsT0FBTyxDQUFDLFFBQTRCO1FBQ2xDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLElBQUksS0FBSyxFQUFFO1lBQ1QsS0FBSyxNQUFNLFNBQVMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM1QyxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRTtvQkFDaEMsUUFBUSxFQUFFLENBQUM7aUJBQ1o7YUFDRjtZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzlCO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxLQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDckI7UUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxrQkFBa0I7YUFDWCxVQUFLLEdBQTZCLGtCQUFrQixDQUFDO1FBQzFELEtBQUssRUFBRSx3QkFBd0I7UUFDL0IsVUFBVSxFQUFFLE1BQU07UUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksd0JBQXdCLEVBQUU7S0FDOUMsQ0FBQyxBQUpVLENBSVQiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uL2RpJztcblxuaW1wb3J0IHtURGVmZXJCbG9ja0RldGFpbHN9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgY2xlYW51cCBmdW5jdGlvbiBhc3NvY2lhdGVkIHdpdGggYSBwcmVmZXRjaGluZyB0cmlnZ2VyXG4gKiBvZiBhIGdpdmVuIGRlZmVyIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJURGV0YWlsc0NsZWFudXAoXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZywgY2xlYW51cEZuOiBWb2lkRnVuY3Rpb24pIHtcbiAgaW5qZWN0b3IuZ2V0KERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcikuYWRkKHREZXRhaWxzLCBrZXksIGNsZWFudXBGbik7XG59XG4vKipcbiAqIEludm9rZXMgYWxsIHJlZ2lzdGVyZWQgcHJlZmV0Y2ggY2xlYW51cCB0cmlnZ2Vyc1xuICogYW5kIHJlbW92ZXMgYWxsIGNsZWFudXAgZnVuY3Rpb25zIGFmdGVyd2FyZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZva2VURGV0YWlsc0NsZWFudXAoaW5qZWN0b3I6IEluamVjdG9yLCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpLmNsZWFudXAodERldGFpbHMpO1xufVxuLyoqXG4gKiBJbnRlcm5hbCBzZXJ2aWNlIHRvIGtlZXAgdHJhY2sgb2YgY2xlYW51cCBmdW5jdGlvbnMgYXNzb2NpYXRlZFxuICogd2l0aCBkZWZlciBibG9ja3MuIFRoaXMgY2xhc3MgaXMgdXNlZCB0byBtYW5hZ2UgY2xlYW51cCBmdW5jdGlvbnNcbiAqIGNyZWF0ZWQgZm9yIHByZWZldGNoaW5nIHRyaWdnZXJzLlxuICovXG5leHBvcnQgY2xhc3MgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBibG9ja3MgPSBuZXcgTWFwPFREZWZlckJsb2NrRGV0YWlscywgTWFwPHN0cmluZywgVm9pZEZ1bmN0aW9uW10+PigpO1xuXG4gIGFkZCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZywgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGlmICghdGhpcy5ibG9ja3MuaGFzKHREZXRhaWxzKSkge1xuICAgICAgdGhpcy5ibG9ja3Muc2V0KHREZXRhaWxzLCBuZXcgTWFwKCkpO1xuICAgIH1cbiAgICBjb25zdCBibG9jayA9IHRoaXMuYmxvY2tzLmdldCh0RGV0YWlscykhO1xuICAgIGlmICghYmxvY2suaGFzKGtleSkpIHtcbiAgICAgIGJsb2NrLnNldChrZXksIFtdKTtcbiAgICB9XG4gICAgY29uc3QgY2FsbGJhY2tzID0gYmxvY2suZ2V0KGtleSkhO1xuICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGhhcyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuYmxvY2tzLmdldCh0RGV0YWlscyk/LmhhcyhrZXkpO1xuICB9XG5cbiAgY2xlYW51cCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gICAgY29uc3QgYmxvY2sgPSB0aGlzLmJsb2Nrcy5nZXQodERldGFpbHMpO1xuICAgIGlmIChibG9jaykge1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFja3Mgb2YgT2JqZWN0LnZhbHVlcyhibG9jaykpIHtcbiAgICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBjYWxsYmFja3MpIHtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmJsb2Nrcy5kZWxldGUodERldGFpbHMpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGZvciAoY29uc3QgW2Jsb2NrXSBvZiB0aGlzLmJsb2Nrcykge1xuICAgICAgdGhpcy5jbGVhbnVwKGJsb2NrKTtcbiAgICB9XG4gICAgdGhpcy5ibG9ja3MuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcigpLFxuICB9KTtcbn1cbiJdfQ==