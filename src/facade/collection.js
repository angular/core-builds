/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getSymbolIterator, isJsObject } from './lang';
/**
 * Wraps Javascript Objects
 */
export class StringMapWrapper {
    /**
     * @param {?} m1
     * @param {?} m2
     * @return {?}
     */
    static merge(m1, m2) {
        const /** @type {?} */ m = {};
        for (const k of Object.keys(m1)) {
            m[k] = m1[k];
        }
        for (const k of Object.keys(m2)) {
            m[k] = m2[k];
        }
        return m;
    }
    /**
     * @param {?} m1
     * @param {?} m2
     * @return {?}
     */
    static equals(m1, m2) {
        const /** @type {?} */ k1 = Object.keys(m1);
        const /** @type {?} */ k2 = Object.keys(m2);
        if (k1.length != k2.length) {
            return false;
        }
        for (let /** @type {?} */ i = 0; i < k1.length; i++) {
            const /** @type {?} */ key = k1[i];
            if (m1[key] !== m2[key]) {
                return false;
            }
        }
        return true;
    }
}
export class ListWrapper {
    /**
     * @param {?} arr
     * @param {?} condition
     * @return {?}
     */
    static findLast(arr, condition) {
        for (let /** @type {?} */ i = arr.length - 1; i >= 0; i--) {
            if (condition(arr[i])) {
                return arr[i];
            }
        }
        return null;
    }
    /**
     * @param {?} list
     * @param {?} items
     * @return {?}
     */
    static removeAll(list, items) {
        for (let /** @type {?} */ i = 0; i < items.length; ++i) {
            const /** @type {?} */ index = list.indexOf(items[i]);
            if (index > -1) {
                list.splice(index, 1);
            }
        }
    }
    /**
     * @param {?} list
     * @param {?} el
     * @return {?}
     */
    static remove(list, el) {
        const /** @type {?} */ index = list.indexOf(el);
        if (index > -1) {
            list.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * @param {?} a
     * @param {?} b
     * @return {?}
     */
    static equals(a, b) {
        if (a.length != b.length)
            return false;
        for (let /** @type {?} */ i = 0; i < a.length; ++i) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    /**
     * @param {?} list
     * @return {?}
     */
    static flatten(list) {
        return list.reduce((flat, item) => {
            const /** @type {?} */ flatItem = Array.isArray(item) ? ListWrapper.flatten(item) : item;
            return ((flat)).concat(flatItem);
        }, []);
    }
}
/**
 * @param {?} obj
 * @return {?}
 */
export function isListLikeIterable(obj) {
    if (!isJsObject(obj))
        return false;
    return Array.isArray(obj) ||
        (!(obj instanceof Map) &&
            getSymbolIterator() in obj); // JS Iterable have a Symbol.iterator prop
}
/**
 * @param {?} a
 * @param {?} b
 * @param {?} comparator
 * @return {?}
 */
export function areIterablesEqual(a, b, comparator) {
    const /** @type {?} */ iterator1 = a[getSymbolIterator()]();
    const /** @type {?} */ iterator2 = b[getSymbolIterator()]();
    while (true) {
        const /** @type {?} */ item1 = iterator1.next();
        const /** @type {?} */ item2 = iterator2.next();
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
        for (let /** @type {?} */ i = 0; i < obj.length; i++) {
            fn(obj[i]);
        }
    }
    else {
        const /** @type {?} */ iterator = obj[getSymbolIterator()]();
        let /** @type {?} */ item;
        while (!((item = iterator.next()).done)) {
            fn(item.value);
        }
    }
}
//# sourceMappingURL=collection.js.map