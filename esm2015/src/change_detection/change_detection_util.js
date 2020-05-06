/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/change_detection/change_detection_util.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { looseIdentical } from '../util/comparison';
import { getSymbolIterator } from '../util/symbol';
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function devModeEqual(a, b) {
    /** @type {?} */
    const isListLikeIterableA = isListLikeIterable(a);
    /** @type {?} */
    const isListLikeIterableB = isListLikeIterable(b);
    if (isListLikeIterableA && isListLikeIterableB) {
        return areIterablesEqual(a, b, devModeEqual);
    }
    else {
        /** @type {?} */
        const isAObject = a && (typeof a === 'object' || typeof a === 'function');
        /** @type {?} */
        const isBObject = b && (typeof b === 'object' || typeof b === 'function');
        if (!isListLikeIterableA && isAObject && !isListLikeIterableB && isBObject) {
            return true;
        }
        else {
            return looseIdentical(a, b);
        }
    }
}
/**
 * Indicates that the result of a {\@link Pipe} transformation has changed even though the
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
 * \@publicApi
 * @deprecated from v10 stop using. (No replacement, deemed unnecessary.)
 */
export class WrappedValue {
    /**
     * @param {?} value
     */
    constructor(value) {
        this.wrapped = value;
    }
    /**
     * Creates a wrapped value.
     * @param {?} value
     * @return {?}
     */
    static wrap(value) {
        return new WrappedValue(value);
    }
    /**
     * Returns the underlying value of a wrapped value.
     * Returns the given `value` when it is not wrapped.
     *
     * @param {?} value
     * @return {?}
     */
    static unwrap(value) {
        return WrappedValue.isWrapped(value) ? value.wrapped : value;
    }
    /**
     * Returns true if `value` is a wrapped value.
     * @param {?} value
     * @return {?}
     */
    static isWrapped(value) {
        return value instanceof WrappedValue;
    }
}
if (false) {
    /**
     * @deprecated from 5.3, use `unwrap()` instead - will switch to protected
     * @type {?}
     */
    WrappedValue.prototype.wrapped;
}
/**
 * @param {?} obj
 * @return {?}
 */
export function isListLikeIterable(obj) {
    if (!isJsObject(obj))
        return false;
    return Array.isArray(obj) ||
        (!(obj instanceof Map) && // JS Map are iterables but return entries as [k, v]
            getSymbolIterator() in obj); // JS Iterable have a Symbol.iterator prop
}
/**
 * @param {?} a
 * @param {?} b
 * @param {?} comparator
 * @return {?}
 */
export function areIterablesEqual(a, b, comparator) {
    /** @type {?} */
    const iterator1 = a[getSymbolIterator()]();
    /** @type {?} */
    const iterator2 = b[getSymbolIterator()]();
    while (true) {
        /** @type {?} */
        const item1 = iterator1.next();
        /** @type {?} */
        const item2 = iterator2.next();
        if (item1.done && item2.done)
            return true;
        if (item1.done || item2.done)
            return false;
        if (!comparator(item1.value, item2.value))
            return false;
    }
}
/**
 * @param {?} obj
 * @param {?} fn
 * @return {?}
 */
export function iterateListLike(obj, fn) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            fn(obj[i]);
        }
    }
    else {
        /** @type {?} */
        const iterator = obj[getSymbolIterator()]();
        /** @type {?} */
        let item;
        while (!((item = iterator.next()).done)) {
            fn(item.value);
        }
    }
}
/**
 * @param {?} o
 * @return {?}
 */
export function isJsObject(o) {
    return o !== null && (typeof o === 'function' || typeof o === 'object');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbl91dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2xELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7Ozs7QUFFakQsTUFBTSxVQUFVLFlBQVksQ0FBQyxDQUFNLEVBQUUsQ0FBTTs7VUFDbkMsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDOztVQUMzQyxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7SUFDakQsSUFBSSxtQkFBbUIsSUFBSSxtQkFBbUIsRUFBRTtRQUM5QyxPQUFPLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDOUM7U0FBTTs7Y0FDQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxLQUFLLFVBQVUsQ0FBQzs7Y0FDbkUsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsS0FBSyxVQUFVLENBQUM7UUFDekUsSUFBSSxDQUFDLG1CQUFtQixJQUFJLFNBQVMsSUFBSSxDQUFDLG1CQUFtQixJQUFJLFNBQVMsRUFBRTtZQUMxRSxPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxPQUFPLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0I7S0FDRjtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkQsTUFBTSxPQUFPLFlBQVk7Ozs7SUFJdkIsWUFBWSxLQUFVO1FBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ3ZCLENBQUM7Ozs7OztJQUdELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBVTtRQUNwQixPQUFPLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Ozs7Ozs7O0lBTUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFVO1FBQ3RCLE9BQU8sWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQy9ELENBQUM7Ozs7OztJQUdELE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBVTtRQUN6QixPQUFPLEtBQUssWUFBWSxZQUFZLENBQUM7SUFDdkMsQ0FBQztDQUNGOzs7Ozs7SUF2QkMsK0JBQWE7Ozs7OztBQXlCZixNQUFNLFVBQVUsa0JBQWtCLENBQUMsR0FBUTtJQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ25DLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLEdBQUcsQ0FBQyxJQUFTLG9EQUFvRDtZQUNsRixpQkFBaUIsRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUUsMENBQTBDO0FBQy9FLENBQUM7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLENBQU0sRUFBRSxDQUFNLEVBQUUsVUFBdUM7O1VBQ25ELFNBQVMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFOztVQUNwQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRTtJQUUxQyxPQUFPLElBQUksRUFBRTs7Y0FDTCxLQUFLLEdBQUcsU0FBUyxDQUFDLElBQUksRUFBRTs7Y0FDeEIsS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUU7UUFDOUIsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFDMUMsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDM0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztLQUN6RDtBQUNILENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsR0FBUSxFQUFFLEVBQW1CO0lBQzNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNuQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDWjtLQUNGO1NBQU07O2NBQ0MsUUFBUSxHQUFHLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEVBQUU7O1lBQ3ZDLElBQVM7UUFDYixPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2QyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2hCO0tBQ0Y7QUFDSCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUMsQ0FBTTtJQUMvQixPQUFPLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxVQUFVLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7QUFDMUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb29zZUlkZW50aWNhbH0gZnJvbSAnLi4vdXRpbC9jb21wYXJpc29uJztcbmltcG9ydCB7Z2V0U3ltYm9sSXRlcmF0b3J9IGZyb20gJy4uL3V0aWwvc3ltYm9sJztcblxuZXhwb3J0IGZ1bmN0aW9uIGRldk1vZGVFcXVhbChhOiBhbnksIGI6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBpc0xpc3RMaWtlSXRlcmFibGVBID0gaXNMaXN0TGlrZUl0ZXJhYmxlKGEpO1xuICBjb25zdCBpc0xpc3RMaWtlSXRlcmFibGVCID0gaXNMaXN0TGlrZUl0ZXJhYmxlKGIpO1xuICBpZiAoaXNMaXN0TGlrZUl0ZXJhYmxlQSAmJiBpc0xpc3RMaWtlSXRlcmFibGVCKSB7XG4gICAgcmV0dXJuIGFyZUl0ZXJhYmxlc0VxdWFsKGEsIGIsIGRldk1vZGVFcXVhbCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaXNBT2JqZWN0ID0gYSAmJiAodHlwZW9mIGEgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbiAgICBjb25zdCBpc0JPYmplY3QgPSBiICYmICh0eXBlb2YgYiA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgPT09ICdmdW5jdGlvbicpO1xuICAgIGlmICghaXNMaXN0TGlrZUl0ZXJhYmxlQSAmJiBpc0FPYmplY3QgJiYgIWlzTGlzdExpa2VJdGVyYWJsZUIgJiYgaXNCT2JqZWN0KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGxvb3NlSWRlbnRpY2FsKGEsIGIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEluZGljYXRlcyB0aGF0IHRoZSByZXN1bHQgb2YgYSB7QGxpbmsgUGlwZX0gdHJhbnNmb3JtYXRpb24gaGFzIGNoYW5nZWQgZXZlbiB0aG91Z2ggdGhlXG4gKiByZWZlcmVuY2UgaGFzIG5vdCBjaGFuZ2VkLlxuICpcbiAqIFdyYXBwZWQgdmFsdWVzIGFyZSB1bndyYXBwZWQgYXV0b21hdGljYWxseSBkdXJpbmcgdGhlIGNoYW5nZSBkZXRlY3Rpb24sIGFuZCB0aGUgdW53cmFwcGVkIHZhbHVlXG4gKiBpcyBzdG9yZWQuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGlmICh0aGlzLl9sYXRlc3RWYWx1ZSA9PT0gdGhpcy5fbGF0ZXN0UmV0dXJuZWRWYWx1ZSkge1xuICogICAgcmV0dXJuIHRoaXMuX2xhdGVzdFJldHVybmVkVmFsdWU7XG4gKiAgfSBlbHNlIHtcbiAqICAgIHRoaXMuX2xhdGVzdFJldHVybmVkVmFsdWUgPSB0aGlzLl9sYXRlc3RWYWx1ZTtcbiAqICAgIHJldHVybiBXcmFwcGVkVmFsdWUud3JhcCh0aGlzLl9sYXRlc3RWYWx1ZSk7IC8vIHRoaXMgd2lsbCBmb3JjZSB1cGRhdGVcbiAqICB9XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZGVwcmVjYXRlZCBmcm9tIHYxMCBzdG9wIHVzaW5nLiAoTm8gcmVwbGFjZW1lbnQsIGRlZW1lZCB1bm5lY2Vzc2FyeS4pXG4gKi9cbmV4cG9ydCBjbGFzcyBXcmFwcGVkVmFsdWUge1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSA1LjMsIHVzZSBgdW53cmFwKClgIGluc3RlYWQgLSB3aWxsIHN3aXRjaCB0byBwcm90ZWN0ZWQgKi9cbiAgd3JhcHBlZDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLndyYXBwZWQgPSB2YWx1ZTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgd3JhcHBlZCB2YWx1ZS4gKi9cbiAgc3RhdGljIHdyYXAodmFsdWU6IGFueSk6IFdyYXBwZWRWYWx1ZSB7XG4gICAgcmV0dXJuIG5ldyBXcmFwcGVkVmFsdWUodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHVuZGVybHlpbmcgdmFsdWUgb2YgYSB3cmFwcGVkIHZhbHVlLlxuICAgKiBSZXR1cm5zIHRoZSBnaXZlbiBgdmFsdWVgIHdoZW4gaXQgaXMgbm90IHdyYXBwZWQuXG4gICAqKi9cbiAgc3RhdGljIHVud3JhcCh2YWx1ZTogYW55KTogYW55IHtcbiAgICByZXR1cm4gV3JhcHBlZFZhbHVlLmlzV3JhcHBlZCh2YWx1ZSkgPyB2YWx1ZS53cmFwcGVkIDogdmFsdWU7XG4gIH1cblxuICAvKiogUmV0dXJucyB0cnVlIGlmIGB2YWx1ZWAgaXMgYSB3cmFwcGVkIHZhbHVlLiAqL1xuICBzdGF0aWMgaXNXcmFwcGVkKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBXcmFwcGVkVmFsdWUge1xuICAgIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFdyYXBwZWRWYWx1ZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMaXN0TGlrZUl0ZXJhYmxlKG9iajogYW55KTogYm9vbGVhbiB7XG4gIGlmICghaXNKc09iamVjdChvYmopKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KG9iaikgfHxcbiAgICAgICghKG9iaiBpbnN0YW5jZW9mIE1hcCkgJiYgICAgICAvLyBKUyBNYXAgYXJlIGl0ZXJhYmxlcyBidXQgcmV0dXJuIGVudHJpZXMgYXMgW2ssIHZdXG4gICAgICAgZ2V0U3ltYm9sSXRlcmF0b3IoKSBpbiBvYmopOyAgLy8gSlMgSXRlcmFibGUgaGF2ZSBhIFN5bWJvbC5pdGVyYXRvciBwcm9wXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcmVJdGVyYWJsZXNFcXVhbChcbiAgICBhOiBhbnksIGI6IGFueSwgY29tcGFyYXRvcjogKGE6IGFueSwgYjogYW55KSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGl0ZXJhdG9yMSA9IGFbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTtcbiAgY29uc3QgaXRlcmF0b3IyID0gYltnZXRTeW1ib2xJdGVyYXRvcigpXSgpO1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgaXRlbTEgPSBpdGVyYXRvcjEubmV4dCgpO1xuICAgIGNvbnN0IGl0ZW0yID0gaXRlcmF0b3IyLm5leHQoKTtcbiAgICBpZiAoaXRlbTEuZG9uZSAmJiBpdGVtMi5kb25lKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoaXRlbTEuZG9uZSB8fCBpdGVtMi5kb25lKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCFjb21wYXJhdG9yKGl0ZW0xLnZhbHVlLCBpdGVtMi52YWx1ZSkpIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXRlcmF0ZUxpc3RMaWtlKG9iajogYW55LCBmbjogKHA6IGFueSkgPT4gYW55KSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgZm4ob2JqW2ldKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaXRlcmF0b3IgPSBvYmpbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTtcbiAgICBsZXQgaXRlbTogYW55O1xuICAgIHdoaWxlICghKChpdGVtID0gaXRlcmF0b3IubmV4dCgpKS5kb25lKSkge1xuICAgICAgZm4oaXRlbS52YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0pzT2JqZWN0KG86IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gbyAhPT0gbnVsbCAmJiAodHlwZW9mIG8gPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIG8gPT09ICdvYmplY3QnKTtcbn1cbiJdfQ==