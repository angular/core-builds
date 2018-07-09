/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter } from '../event_emitter';
import { getSymbolIterator } from '../util';
/**
 * An unmodifiable list of items that Angular keeps up to date when the state
 * of the application changes.
 *
 * The type of object that {@link ViewChildren}, {@link ContentChildren}, and {@link QueryList}
 * provide.
 *
 * Implements an iterable interface, therefore it can be used in both ES6
 * javascript `for (var i of items)` loops as well as in Angular templates with
 * `*ngFor="let i of myList"`.
 *
 * Changes can be observed by subscribing to the changes `Observable`.
 *
 * NOTE: In the future this class will implement an `Observable` interface.
 *
 * ### Example ([live demo](http://plnkr.co/edit/RX8sJnQYl9FWuSCWme5z?p=preview))
 * ```typescript
 * @Component({...})
 * class Container {
 *   @ViewChildren(Item) items:QueryList<Item>;
 * }
 * ```
 *
 */
export class QueryList {
    constructor() {
        this.dirty = true;
        this._results = [];
        this.changes = new EventEmitter();
        this.length = 0;
    }
    /**
     * See
     * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
     */
    map(fn) { return this._results.map(fn); }
    /**
     * See
     * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
     */
    filter(fn) {
        return this._results.filter(fn);
    }
    /**
     * See
     * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
     */
    find(fn) {
        return this._results.find(fn);
    }
    /**
     * See
     * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
     */
    reduce(fn, init) {
        return this._results.reduce(fn, init);
    }
    /**
     * See
     * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
     */
    forEach(fn) { this._results.forEach(fn); }
    /**
     * See
     * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
     */
    some(fn) {
        return this._results.some(fn);
    }
    toArray() { return this._results.slice(); }
    [getSymbolIterator()]() { return this._results[getSymbolIterator()](); }
    toString() { return this._results.toString(); }
    reset(res) {
        this._results = flatten(res);
        this.dirty = false;
        this.length = this._results.length;
        this.last = this._results[this.length - 1];
        this.first = this._results[0];
    }
    notifyOnChanges() { this.changes.emit(this); }
    /** internal */
    setDirty() { this.dirty = true; }
    /** internal */
    destroy() {
        this.changes.complete();
        this.changes.unsubscribe();
    }
}
function flatten(list) {
    return list.reduce((flat, item) => {
        const flatItem = Array.isArray(item) ? flatten(item) : item;
        return flat.concat(flatItem);
    }, []);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlfbGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2xpbmtlci9xdWVyeV9saXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUlILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHMUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUJHO0FBQ0gsTUFBTTtJQUFOO1FBQ2tCLFVBQUssR0FBRyxJQUFJLENBQUM7UUFDckIsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQUNoQixZQUFPLEdBQW9CLElBQUksWUFBWSxFQUFFLENBQUM7UUFFckQsV0FBTSxHQUFXLENBQUMsQ0FBQztJQXdFOUIsQ0FBQztJQXBFQzs7O09BR0c7SUFDSCxHQUFHLENBQUksRUFBNkMsSUFBUyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU1Rjs7O09BR0c7SUFDSCxNQUFNLENBQUMsRUFBbUQ7UUFDeEQsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxDQUFDLEVBQW1EO1FBQ3RELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU0sQ0FBSSxFQUFrRSxFQUFFLElBQU87UUFDbkYsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILE9BQU8sQ0FBQyxFQUFnRCxJQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU5Rjs7O09BR0c7SUFDSCxJQUFJLENBQUMsRUFBb0Q7UUFDdkQsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsT0FBTyxLQUFVLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFaEQsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEtBQWtCLE9BQVEsSUFBSSxDQUFDLFFBQWdCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTlGLFFBQVEsS0FBYSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXZELEtBQUssQ0FBQyxHQUFtQjtRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QixJQUF3QixDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDdkMsSUFBd0IsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDdkQsSUFBaUIsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hELElBQWtCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELGVBQWUsS0FBWSxJQUFJLENBQUMsT0FBNkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTNFLGVBQWU7SUFDZixRQUFRLEtBQU0sSUFBd0IsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUV0RCxlQUFlO0lBQ2YsT0FBTztRQUNKLElBQUksQ0FBQyxPQUE2QixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLElBQUksQ0FBQyxPQUE2QixDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3BELENBQUM7Q0FDRjtBQUVELGlCQUFvQixJQUFrQjtJQUNwQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFXLEVBQUUsSUFBYSxFQUFPLEVBQUU7UUFDckQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDNUQsT0FBYSxJQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNULENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICcuLi9ldmVudF9lbWl0dGVyJztcbmltcG9ydCB7Z2V0U3ltYm9sSXRlcmF0b3J9IGZyb20gJy4uL3V0aWwnO1xuXG5cbi8qKlxuICogQW4gdW5tb2RpZmlhYmxlIGxpc3Qgb2YgaXRlbXMgdGhhdCBBbmd1bGFyIGtlZXBzIHVwIHRvIGRhdGUgd2hlbiB0aGUgc3RhdGVcbiAqIG9mIHRoZSBhcHBsaWNhdGlvbiBjaGFuZ2VzLlxuICpcbiAqIFRoZSB0eXBlIG9mIG9iamVjdCB0aGF0IHtAbGluayBWaWV3Q2hpbGRyZW59LCB7QGxpbmsgQ29udGVudENoaWxkcmVufSwgYW5kIHtAbGluayBRdWVyeUxpc3R9XG4gKiBwcm92aWRlLlxuICpcbiAqIEltcGxlbWVudHMgYW4gaXRlcmFibGUgaW50ZXJmYWNlLCB0aGVyZWZvcmUgaXQgY2FuIGJlIHVzZWQgaW4gYm90aCBFUzZcbiAqIGphdmFzY3JpcHQgYGZvciAodmFyIGkgb2YgaXRlbXMpYCBsb29wcyBhcyB3ZWxsIGFzIGluIEFuZ3VsYXIgdGVtcGxhdGVzIHdpdGhcbiAqIGAqbmdGb3I9XCJsZXQgaSBvZiBteUxpc3RcImAuXG4gKlxuICogQ2hhbmdlcyBjYW4gYmUgb2JzZXJ2ZWQgYnkgc3Vic2NyaWJpbmcgdG8gdGhlIGNoYW5nZXMgYE9ic2VydmFibGVgLlxuICpcbiAqIE5PVEU6IEluIHRoZSBmdXR1cmUgdGhpcyBjbGFzcyB3aWxsIGltcGxlbWVudCBhbiBgT2JzZXJ2YWJsZWAgaW50ZXJmYWNlLlxuICpcbiAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9SWDhzSm5RWWw5Rld1U0NXbWU1ej9wPXByZXZpZXcpKVxuICogYGBgdHlwZXNjcmlwdFxuICogQENvbXBvbmVudCh7Li4ufSlcbiAqIGNsYXNzIENvbnRhaW5lciB7XG4gKiAgIEBWaWV3Q2hpbGRyZW4oSXRlbSkgaXRlbXM6UXVlcnlMaXN0PEl0ZW0+O1xuICogfVxuICogYGBgXG4gKlxuICovXG5leHBvcnQgY2xhc3MgUXVlcnlMaXN0PFQ+LyogaW1wbGVtZW50cyBJdGVyYWJsZTxUPiAqLyB7XG4gIHB1YmxpYyByZWFkb25seSBkaXJ0eSA9IHRydWU7XG4gIHByaXZhdGUgX3Jlc3VsdHM6IEFycmF5PFQ+ID0gW107XG4gIHB1YmxpYyByZWFkb25seSBjaGFuZ2VzOiBPYnNlcnZhYmxlPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgcmVhZG9ubHkgbGVuZ3RoOiBudW1iZXIgPSAwO1xuICByZWFkb25seSBmaXJzdDogVDtcbiAgcmVhZG9ubHkgbGFzdDogVDtcblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5tYXBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L21hcClcbiAgICovXG4gIG1hcDxVPihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IFUpOiBVW10geyByZXR1cm4gdGhpcy5fcmVzdWx0cy5tYXAoZm4pOyB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZmlsdGVyXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maWx0ZXIpXG4gICAqL1xuICBmaWx0ZXIoZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogVFtdIHtcbiAgICByZXR1cm4gdGhpcy5fcmVzdWx0cy5maWx0ZXIoZm4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZmluZF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZmluZClcbiAgICovXG4gIGZpbmQoZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogVHx1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9yZXN1bHRzLmZpbmQoZm4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkucmVkdWNlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9yZWR1Y2UpXG4gICAqL1xuICByZWR1Y2U8VT4oZm46IChwcmV2VmFsdWU6IFUsIGN1clZhbHVlOiBULCBjdXJJbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVLCBpbml0OiBVKTogVSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jlc3VsdHMucmVkdWNlKGZuLCBpbml0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZvckVhY2hdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2gpXG4gICAqL1xuICBmb3JFYWNoKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl9yZXN1bHRzLmZvckVhY2goZm4pOyB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuc29tZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvc29tZSlcbiAgICovXG4gIHNvbWUoZm46ICh2YWx1ZTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9yZXN1bHRzLnNvbWUoZm4pO1xuICB9XG5cbiAgdG9BcnJheSgpOiBUW10geyByZXR1cm4gdGhpcy5fcmVzdWx0cy5zbGljZSgpOyB9XG5cbiAgW2dldFN5bWJvbEl0ZXJhdG9yKCldKCk6IEl0ZXJhdG9yPFQ+IHsgcmV0dXJuICh0aGlzLl9yZXN1bHRzIGFzIGFueSlbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTsgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLl9yZXN1bHRzLnRvU3RyaW5nKCk7IH1cblxuICByZXNldChyZXM6IEFycmF5PFR8YW55W10+KTogdm9pZCB7XG4gICAgdGhpcy5fcmVzdWx0cyA9IGZsYXR0ZW4ocmVzKTtcbiAgICAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gZmFsc2U7XG4gICAgKHRoaXMgYXN7bGVuZ3RoOiBudW1iZXJ9KS5sZW5ndGggPSB0aGlzLl9yZXN1bHRzLmxlbmd0aDtcbiAgICAodGhpcyBhc3tsYXN0OiBUfSkubGFzdCA9IHRoaXMuX3Jlc3VsdHNbdGhpcy5sZW5ndGggLSAxXTtcbiAgICAodGhpcyBhc3tmaXJzdDogVH0pLmZpcnN0ID0gdGhpcy5fcmVzdWx0c1swXTtcbiAgfVxuXG4gIG5vdGlmeU9uQ2hhbmdlcygpOiB2b2lkIHsgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikuZW1pdCh0aGlzKTsgfVxuXG4gIC8qKiBpbnRlcm5hbCAqL1xuICBzZXREaXJ0eSgpIHsgKHRoaXMgYXN7ZGlydHk6IGJvb2xlYW59KS5kaXJ0eSA9IHRydWU7IH1cblxuICAvKiogaW50ZXJuYWwgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS5jb21wbGV0ZSgpO1xuICAgICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPihsaXN0OiBBcnJheTxUfFRbXT4pOiBUW10ge1xuICByZXR1cm4gbGlzdC5yZWR1Y2UoKGZsYXQ6IGFueVtdLCBpdGVtOiBUIHwgVFtdKTogVFtdID0+IHtcbiAgICBjb25zdCBmbGF0SXRlbSA9IEFycmF5LmlzQXJyYXkoaXRlbSkgPyBmbGF0dGVuKGl0ZW0pIDogaXRlbTtcbiAgICByZXR1cm4gKDxUW10+ZmxhdCkuY29uY2F0KGZsYXRJdGVtKTtcbiAgfSwgW10pO1xufVxuIl19