/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getSymbolIterator, looseIdentical } from '../util';
export function devModeEqual(a, b) {
    var isListLikeIterableA = isListLikeIterable(a);
    var isListLikeIterableB = isListLikeIterable(b);
    if (isListLikeIterableA && isListLikeIterableB) {
        return areIterablesEqual(a, b, devModeEqual);
    }
    else {
        var isAObject = a && (typeof a === 'object' || typeof a === 'function');
        var isBObject = b && (typeof b === 'object' || typeof b === 'function');
        if (!isListLikeIterableA && isAObject && !isListLikeIterableB && isBObject) {
            return true;
        }
        else {
            return looseIdentical(a, b);
        }
    }
}
/**
 * Indicates that the result of a {@link Pipe} transformation has changed even though the
 * reference has not changed.
 *
 * Wrapped values are unwrapped automatically during the change detection, and the unwrapped value
 * is stored.
 *
 * Example:
 *
 * ```
 * if (this._latestValue === this._latestReturnedValue) {
 *    return this._latestReturnedValue;
 *  } else {
 *    this._latestReturnedValue = this._latestValue;
 *    return WrappedValue.wrap(this._latestValue); // this will force update
 *  }
 * ```
 *
 */
var /**
 * Indicates that the result of a {@link Pipe} transformation has changed even though the
 * reference has not changed.
 *
 * Wrapped values are unwrapped automatically during the change detection, and the unwrapped value
 * is stored.
 *
 * Example:
 *
 * ```
 * if (this._latestValue === this._latestReturnedValue) {
 *    return this._latestReturnedValue;
 *  } else {
 *    this._latestReturnedValue = this._latestValue;
 *    return WrappedValue.wrap(this._latestValue); // this will force update
 *  }
 * ```
 *
 */
WrappedValue = /** @class */ (function () {
    function WrappedValue(value) {
        this.wrapped = value;
    }
    /** Creates a wrapped value. */
    /** Creates a wrapped value. */
    WrappedValue.wrap = /** Creates a wrapped value. */
    function (value) { return new WrappedValue(value); };
    /**
     * Returns the underlying value of a wrapped value.
     * Returns the given `value` when it is not wrapped.
     **/
    /**
       * Returns the underlying value of a wrapped value.
       * Returns the given `value` when it is not wrapped.
       **/
    WrappedValue.unwrap = /**
       * Returns the underlying value of a wrapped value.
       * Returns the given `value` when it is not wrapped.
       **/
    function (value) { return WrappedValue.isWrapped(value) ? value.wrapped : value; };
    /** Returns true if `value` is a wrapped value. */
    /** Returns true if `value` is a wrapped value. */
    WrappedValue.isWrapped = /** Returns true if `value` is a wrapped value. */
    function (value) { return value instanceof WrappedValue; };
    return WrappedValue;
}());
/**
 * Indicates that the result of a {@link Pipe} transformation has changed even though the
 * reference has not changed.
 *
 * Wrapped values are unwrapped automatically during the change detection, and the unwrapped value
 * is stored.
 *
 * Example:
 *
 * ```
 * if (this._latestValue === this._latestReturnedValue) {
 *    return this._latestReturnedValue;
 *  } else {
 *    this._latestReturnedValue = this._latestValue;
 *    return WrappedValue.wrap(this._latestValue); // this will force update
 *  }
 * ```
 *
 */
export { WrappedValue };
/**
 * Represents a basic change from a previous to a new value.
 *
 */
var /**
 * Represents a basic change from a previous to a new value.
 *
 */
SimpleChange = /** @class */ (function () {
    function SimpleChange(previousValue, currentValue, firstChange) {
        this.previousValue = previousValue;
        this.currentValue = currentValue;
        this.firstChange = firstChange;
    }
    /**
     * Check whether the new value is the first value assigned.
     */
    /**
       * Check whether the new value is the first value assigned.
       */
    SimpleChange.prototype.isFirstChange = /**
       * Check whether the new value is the first value assigned.
       */
    function () { return this.firstChange; };
    return SimpleChange;
}());
/**
 * Represents a basic change from a previous to a new value.
 *
 */
export { SimpleChange };
export function isListLikeIterable(obj) {
    if (!isJsObject(obj))
        return false;
    return Array.isArray(obj) ||
        (!(obj instanceof Map) && // JS Map are iterables but return entries as [k, v]
            // JS Map are iterables but return entries as [k, v]
            getSymbolIterator() in obj); // JS Iterable have a Symbol.iterator prop
}
export function areIterablesEqual(a, b, comparator) {
    var iterator1 = a[getSymbolIterator()]();
    var iterator2 = b[getSymbolIterator()]();
    while (true) {
        var item1 = iterator1.next();
        var item2 = iterator2.next();
        if (item1.done && item2.done)
            return true;
        if (item1.done || item2.done)
            return false;
        if (!comparator(item1.value, item2.value))
            return false;
    }
}
export function iterateListLike(obj, fn) {
    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            fn(obj[i]);
        }
    }
    else {
        var iterator = obj[getSymbolIterator()]();
        var item = void 0;
        while (!((item = iterator.next()).done)) {
            fn(item.value);
        }
    }
}
export function isJsObject(o) {
    return o !== null && (typeof o === 'function' || typeof o === 'object');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbl91dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFMUQsTUFBTSx1QkFBdUIsQ0FBTSxFQUFFLENBQU07SUFDekMsSUFBTSxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRCxJQUFNLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xELElBQUksbUJBQW1CLElBQUksbUJBQW1CLEVBQUU7UUFDOUMsT0FBTyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQzlDO1NBQU07UUFDTCxJQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLEtBQUssVUFBVSxDQUFDLENBQUM7UUFDMUUsSUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxTQUFTLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxTQUFTLEVBQUU7WUFDMUUsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNO1lBQ0wsT0FBTyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQzdCO0tBQ0Y7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtJQUlFLHNCQUFZLEtBQVU7UUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztLQUFFO0lBRWpELCtCQUErQjs7SUFDeEIsaUJBQUk7SUFBWCxVQUFZLEtBQVUsSUFBa0IsT0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0lBRXpFOzs7UUFHSTs7Ozs7SUFDRyxtQkFBTTs7OztJQUFiLFVBQWMsS0FBVSxJQUFTLE9BQU8sWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7SUFFaEcsa0RBQWtEOztJQUMzQyxzQkFBUztJQUFoQixVQUFpQixLQUFVLElBQTJCLE9BQU8sS0FBSyxZQUFZLFlBQVksQ0FBQyxFQUFFO3VCQTdEL0Y7SUE4REMsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFqQkQsd0JBaUJDOzs7OztBQU1EOzs7O0FBQUE7SUFDRSxzQkFBbUIsYUFBa0IsRUFBUyxZQUFpQixFQUFTLFdBQW9CO1FBQXpFLGtCQUFhLEdBQWIsYUFBYSxDQUFLO1FBQVMsaUJBQVksR0FBWixZQUFZLENBQUs7UUFBUyxnQkFBVyxHQUFYLFdBQVcsQ0FBUztLQUFJO0lBRWhHOztPQUVHOzs7O0lBQ0gsb0NBQWE7OztJQUFiLGNBQTJCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO3VCQTFFdkQ7SUEyRUMsQ0FBQTs7Ozs7QUFQRCx3QkFPQztBQUVELE1BQU0sNkJBQTZCLEdBQVE7SUFDekMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUNuQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxHQUFHLENBQUMsSUFBUyxvREFBb0Q7O1lBQ2xGLGlCQUFpQixFQUFFLElBQUksR0FBRyxDQUFDLENBQUM7Q0FDbEM7QUFFRCxNQUFNLDRCQUNGLENBQU0sRUFBRSxDQUFNLEVBQUUsVUFBdUM7SUFDekQsSUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzNDLElBQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUUzQyxPQUFPLElBQUksRUFBRTtRQUNYLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvQixJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0IsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFDMUMsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDM0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztLQUN6RDtDQUNGO0FBRUQsTUFBTSwwQkFBMEIsR0FBUSxFQUFFLEVBQW1CO0lBQzNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNuQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDWjtLQUNGO1NBQU07UUFDTCxJQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDNUMsSUFBSSxJQUFJLFNBQUssQ0FBQztRQUNkLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDaEI7S0FDRjtDQUNGO0FBRUQsTUFBTSxxQkFBcUIsQ0FBTTtJQUMvQixPQUFPLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxVQUFVLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7Q0FDekUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2V0U3ltYm9sSXRlcmF0b3IsIGxvb3NlSWRlbnRpY2FsfSBmcm9tICcuLi91dGlsJztcblxuZXhwb3J0IGZ1bmN0aW9uIGRldk1vZGVFcXVhbChhOiBhbnksIGI6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBpc0xpc3RMaWtlSXRlcmFibGVBID0gaXNMaXN0TGlrZUl0ZXJhYmxlKGEpO1xuICBjb25zdCBpc0xpc3RMaWtlSXRlcmFibGVCID0gaXNMaXN0TGlrZUl0ZXJhYmxlKGIpO1xuICBpZiAoaXNMaXN0TGlrZUl0ZXJhYmxlQSAmJiBpc0xpc3RMaWtlSXRlcmFibGVCKSB7XG4gICAgcmV0dXJuIGFyZUl0ZXJhYmxlc0VxdWFsKGEsIGIsIGRldk1vZGVFcXVhbCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaXNBT2JqZWN0ID0gYSAmJiAodHlwZW9mIGEgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbiAgICBjb25zdCBpc0JPYmplY3QgPSBiICYmICh0eXBlb2YgYiA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgPT09ICdmdW5jdGlvbicpO1xuICAgIGlmICghaXNMaXN0TGlrZUl0ZXJhYmxlQSAmJiBpc0FPYmplY3QgJiYgIWlzTGlzdExpa2VJdGVyYWJsZUIgJiYgaXNCT2JqZWN0KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGxvb3NlSWRlbnRpY2FsKGEsIGIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEluZGljYXRlcyB0aGF0IHRoZSByZXN1bHQgb2YgYSB7QGxpbmsgUGlwZX0gdHJhbnNmb3JtYXRpb24gaGFzIGNoYW5nZWQgZXZlbiB0aG91Z2ggdGhlXG4gKiByZWZlcmVuY2UgaGFzIG5vdCBjaGFuZ2VkLlxuICpcbiAqIFdyYXBwZWQgdmFsdWVzIGFyZSB1bndyYXBwZWQgYXV0b21hdGljYWxseSBkdXJpbmcgdGhlIGNoYW5nZSBkZXRlY3Rpb24sIGFuZCB0aGUgdW53cmFwcGVkIHZhbHVlXG4gKiBpcyBzdG9yZWQuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGlmICh0aGlzLl9sYXRlc3RWYWx1ZSA9PT0gdGhpcy5fbGF0ZXN0UmV0dXJuZWRWYWx1ZSkge1xuICogICAgcmV0dXJuIHRoaXMuX2xhdGVzdFJldHVybmVkVmFsdWU7XG4gKiAgfSBlbHNlIHtcbiAqICAgIHRoaXMuX2xhdGVzdFJldHVybmVkVmFsdWUgPSB0aGlzLl9sYXRlc3RWYWx1ZTtcbiAqICAgIHJldHVybiBXcmFwcGVkVmFsdWUud3JhcCh0aGlzLl9sYXRlc3RWYWx1ZSk7IC8vIHRoaXMgd2lsbCBmb3JjZSB1cGRhdGVcbiAqICB9XG4gKiBgYGBcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBXcmFwcGVkVmFsdWUge1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSA1LjMsIHVzZSBgdW53cmFwKClgIGluc3RlYWQgLSB3aWxsIHN3aXRjaCB0byBwcm90ZWN0ZWQgKi9cbiAgd3JhcHBlZDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnkpIHsgdGhpcy53cmFwcGVkID0gdmFsdWU7IH1cblxuICAvKiogQ3JlYXRlcyBhIHdyYXBwZWQgdmFsdWUuICovXG4gIHN0YXRpYyB3cmFwKHZhbHVlOiBhbnkpOiBXcmFwcGVkVmFsdWUgeyByZXR1cm4gbmV3IFdyYXBwZWRWYWx1ZSh2YWx1ZSk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdW5kZXJseWluZyB2YWx1ZSBvZiBhIHdyYXBwZWQgdmFsdWUuXG4gICAqIFJldHVybnMgdGhlIGdpdmVuIGB2YWx1ZWAgd2hlbiBpdCBpcyBub3Qgd3JhcHBlZC5cbiAgICoqL1xuICBzdGF0aWMgdW53cmFwKHZhbHVlOiBhbnkpOiBhbnkgeyByZXR1cm4gV3JhcHBlZFZhbHVlLmlzV3JhcHBlZCh2YWx1ZSkgPyB2YWx1ZS53cmFwcGVkIDogdmFsdWU7IH1cblxuICAvKiogUmV0dXJucyB0cnVlIGlmIGB2YWx1ZWAgaXMgYSB3cmFwcGVkIHZhbHVlLiAqL1xuICBzdGF0aWMgaXNXcmFwcGVkKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBXcmFwcGVkVmFsdWUgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBXcmFwcGVkVmFsdWU7IH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgYmFzaWMgY2hhbmdlIGZyb20gYSBwcmV2aW91cyB0byBhIG5ldyB2YWx1ZS5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBTaW1wbGVDaGFuZ2Uge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcHJldmlvdXNWYWx1ZTogYW55LCBwdWJsaWMgY3VycmVudFZhbHVlOiBhbnksIHB1YmxpYyBmaXJzdENoYW5nZTogYm9vbGVhbikge31cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGUgbmV3IHZhbHVlIGlzIHRoZSBmaXJzdCB2YWx1ZSBhc3NpZ25lZC5cbiAgICovXG4gIGlzRmlyc3RDaGFuZ2UoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmZpcnN0Q2hhbmdlOyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xpc3RMaWtlSXRlcmFibGUob2JqOiBhbnkpOiBib29sZWFuIHtcbiAgaWYgKCFpc0pzT2JqZWN0KG9iaikpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkob2JqKSB8fFxuICAgICAgKCEob2JqIGluc3RhbmNlb2YgTWFwKSAmJiAgICAgIC8vIEpTIE1hcCBhcmUgaXRlcmFibGVzIGJ1dCByZXR1cm4gZW50cmllcyBhcyBbaywgdl1cbiAgICAgICBnZXRTeW1ib2xJdGVyYXRvcigpIGluIG9iaik7ICAvLyBKUyBJdGVyYWJsZSBoYXZlIGEgU3ltYm9sLml0ZXJhdG9yIHByb3Bcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFyZUl0ZXJhYmxlc0VxdWFsKFxuICAgIGE6IGFueSwgYjogYW55LCBjb21wYXJhdG9yOiAoYTogYW55LCBiOiBhbnkpID0+IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXRlcmF0b3IxID0gYVtnZXRTeW1ib2xJdGVyYXRvcigpXSgpO1xuICBjb25zdCBpdGVyYXRvcjIgPSBiW2dldFN5bWJvbEl0ZXJhdG9yKCldKCk7XG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCBpdGVtMSA9IGl0ZXJhdG9yMS5uZXh0KCk7XG4gICAgY29uc3QgaXRlbTIgPSBpdGVyYXRvcjIubmV4dCgpO1xuICAgIGlmIChpdGVtMS5kb25lICYmIGl0ZW0yLmRvbmUpIHJldHVybiB0cnVlO1xuICAgIGlmIChpdGVtMS5kb25lIHx8IGl0ZW0yLmRvbmUpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIWNvbXBhcmF0b3IoaXRlbTEudmFsdWUsIGl0ZW0yLnZhbHVlKSkgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpdGVyYXRlTGlzdExpa2Uob2JqOiBhbnksIGZuOiAocDogYW55KSA9PiBhbnkpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmbihvYmpbaV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBpdGVyYXRvciA9IG9ialtnZXRTeW1ib2xJdGVyYXRvcigpXSgpO1xuICAgIGxldCBpdGVtOiBhbnk7XG4gICAgd2hpbGUgKCEoKGl0ZW0gPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpKSB7XG4gICAgICBmbihpdGVtLnZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSnNPYmplY3QobzogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBvICE9PSBudWxsICYmICh0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgbyA9PT0gJ29iamVjdCcpO1xufVxuIl19