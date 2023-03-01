/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { APP_ID } from './application_tokens';
import { inject } from './di/injector_compatibility';
import { ɵɵdefineInjectable } from './di/interface/defs';
import { getDocument } from './render3/interfaces/document';
export function escapeTransferStateContent(text) {
    const escapedText = {
        '&': '&a;',
        '"': '&q;',
        '\'': '&s;',
        '<': '&l;',
        '>': '&g;',
    };
    return text.replace(/[&"'<>]/g, s => escapedText[s]);
}
export function unescapeTransferStateContent(text) {
    const unescapedText = {
        '&a;': '&',
        '&q;': '"',
        '&s;': '\'',
        '&l;': '<',
        '&g;': '>',
    };
    return text.replace(/&[^;]+;/g, s => unescapedText[s]);
}
/**
 * Create a `StateKey<T>` that can be used to store value of type T with `TransferState`.
 *
 * Example:
 *
 * ```
 * const COUNTER_KEY = makeStateKey<number>('counter');
 * let value = 10;
 *
 * transferState.set(COUNTER_KEY, value);
 * ```
 *
 * @publicApi
 */
export function makeStateKey(key) {
    return key;
}
function initTransferState() {
    const transferState = new TransferState();
    transferState.store = retrieveTransferredState(getDocument(), inject(APP_ID));
    return transferState;
}
/**
 * A key value store that is transferred from the application on the server side to the application
 * on the client side.
 *
 * The `TransferState` is available as an injectable token.
 * On the client, just inject this token using DI and use it, it will be lazily initialized.
 * On the server it's already included if `renderApplication` function is used. Otherwise, import
 * the `ServerTransferStateModule` module to make the `TransferState` available.
 *
 * The values in the store are serialized/deserialized using JSON.stringify/JSON.parse. So only
 * boolean, number, string, null and non-class objects will be serialized and deserialized in a
 * non-lossy manner.
 *
 * @publicApi
 */
class TransferState {
    constructor() {
        /** @internal */
        this.store = {};
        this.onSerializeCallbacks = {};
    }
    /**
     * Get the value corresponding to a key. Return `defaultValue` if key is not found.
     */
    get(key, defaultValue) {
        return this.store[key] !== undefined ? this.store[key] : defaultValue;
    }
    /**
     * Set the value corresponding to a key.
     */
    set(key, value) {
        this.store[key] = value;
    }
    /**
     * Remove a key from the store.
     */
    remove(key) {
        delete this.store[key];
    }
    /**
     * Test whether a key exists in the store.
     */
    hasKey(key) {
        return this.store.hasOwnProperty(key);
    }
    /**
     * Indicates whether the state is empty.
     */
    get isEmpty() {
        return Object.keys(this.store).length === 0;
    }
    /**
     * Register a callback to provide the value for a key when `toJson` is called.
     */
    onSerialize(key, callback) {
        this.onSerializeCallbacks[key] = callback;
    }
    /**
     * Serialize the current state of the store to JSON.
     */
    toJson() {
        // Call the onSerialize callbacks and put those values into the store.
        for (const key in this.onSerializeCallbacks) {
            if (this.onSerializeCallbacks.hasOwnProperty(key)) {
                try {
                    this.store[key] = this.onSerializeCallbacks[key]();
                }
                catch (e) {
                    console.warn('Exception in onSerialize callback: ', e);
                }
            }
        }
        return JSON.stringify(this.store);
    }
}
/** @nocollapse */
TransferState.ɵprov = 
/** @pureOrBreakMyCode */ ɵɵdefineInjectable({
    token: TransferState,
    providedIn: 'root',
    factory: initTransferState,
});
export { TransferState };
function retrieveTransferredState(doc, appId) {
    // Locate the script tag with the JSON data transferred from the server.
    // The id of the script tag is set to the Angular appId + 'state'.
    const script = doc.getElementById(appId + '-state');
    let initialState = {};
    if (script && script.textContent) {
        try {
            // Avoid using any here as it triggers lint errors in google3 (any is not allowed).
            initialState = JSON.parse(unescapeTransferStateContent(script.textContent));
        }
        catch (e) {
            console.warn('Exception while restoring TransferState for app ' + appId, e);
        }
    }
    return initialState;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmZXJfc3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy90cmFuc2Zlcl9zdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ25ELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUUxRCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsSUFBWTtJQUNyRCxNQUFNLFdBQVcsR0FBMEI7UUFDekMsR0FBRyxFQUFFLEtBQUs7UUFDVixHQUFHLEVBQUUsS0FBSztRQUNWLElBQUksRUFBRSxLQUFLO1FBQ1gsR0FBRyxFQUFFLEtBQUs7UUFDVixHQUFHLEVBQUUsS0FBSztLQUNYLENBQUM7SUFDRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkQsQ0FBQztBQUVELE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxJQUFZO0lBQ3ZELE1BQU0sYUFBYSxHQUEwQjtRQUMzQyxLQUFLLEVBQUUsR0FBRztRQUNWLEtBQUssRUFBRSxHQUFHO1FBQ1YsS0FBSyxFQUFFLElBQUk7UUFDWCxLQUFLLEVBQUUsR0FBRztRQUNWLEtBQUssRUFBRSxHQUFHO0tBQ1gsQ0FBQztJQUNGLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBcUJEOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFN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QUNGLG1GQUFtRjtZQUNuRixZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQU8sQ0FBQztTQUNuRjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsT0FBTyxDQUFDLElBQUksQ0FBQyxrREFBa0QsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0U7S0FDRjtJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBUFBfSUR9IGZyb20gJy4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHvJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVUcmFuc2ZlclN0YXRlQ29udGVudCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBlc2NhcGVkVGV4dDoge1trOiBzdHJpbmddOiBzdHJpbmd9ID0ge1xuICAgICcmJzogJyZhOycsXG4gICAgJ1wiJzogJyZxOycsXG4gICAgJ1xcJyc6ICcmczsnLFxuICAgICc8JzogJyZsOycsXG4gICAgJz4nOiAnJmc7JyxcbiAgfTtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvWyZcIic8Pl0vZywgcyA9PiBlc2NhcGVkVGV4dFtzXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmVzY2FwZVRyYW5zZmVyU3RhdGVDb250ZW50KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHVuZXNjYXBlZFRleHQ6IHtbazogc3RyaW5nXTogc3RyaW5nfSA9IHtcbiAgICAnJmE7JzogJyYnLFxuICAgICcmcTsnOiAnXCInLFxuICAgICcmczsnOiAnXFwnJyxcbiAgICAnJmw7JzogJzwnLFxuICAgICcmZzsnOiAnPicsXG4gIH07XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoLyZbXjtdKzsvZywgcyA9PiB1bmVzY2FwZWRUZXh0W3NdKTtcbn1cblxuLyoqXG4gKiBBIHR5cGUtc2FmZSBrZXkgdG8gdXNlIHdpdGggYFRyYW5zZmVyU3RhdGVgLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBjb25zdCBDT1VOVEVSX0tFWSA9IG1ha2VTdGF0ZUtleTxudW1iZXI+KCdjb3VudGVyJyk7XG4gKiBsZXQgdmFsdWUgPSAxMDtcbiAqXG4gKiB0cmFuc2ZlclN0YXRlLnNldChDT1VOVEVSX0tFWSwgdmFsdWUpO1xuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBTdGF0ZUtleTxUPiA9IHN0cmluZyZ7XG4gIF9fbm90X2Ffc3RyaW5nOiBuZXZlcixcbiAgX192YWx1ZV90eXBlPzogVCxcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgYFN0YXRlS2V5PFQ+YCB0aGF0IGNhbiBiZSB1c2VkIHRvIHN0b3JlIHZhbHVlIG9mIHR5cGUgVCB3aXRoIGBUcmFuc2ZlclN0YXRlYC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogY29uc3QgQ09VTlRFUl9LRVkgPSBtYWtlU3RhdGVLZXk8bnVtYmVyPignY291bnRlcicpO1xuICogbGV0IHZhbHVlID0gMTA7XG4gKlxuICogdHJhbnNmZXJTdGF0ZS5zZXQoQ09VTlRFUl9LRVksIHZhbHVlKTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ha2VTdGF0ZUtleTxUID0gdm9pZD4oa2V5OiBzdHJpbmcpOiBTdGF0ZUtleTxUPiB7XG4gIHJldHVybiBrZXkgYXMgU3RhdGVLZXk8VD47XG59XG5cbmZ1bmN0aW9uIGluaXRUcmFuc2ZlclN0YXRlKCkge1xuICBjb25zdCB0cmFuc2ZlclN0YXRlID0gbmV3IFRyYW5zZmVyU3RhdGUoKTtcbiAgdHJhbnNmZXJTdGF0ZS5zdG9yZSA9IHJldHJpZXZlVHJhbnNmZXJyZWRTdGF0ZShnZXREb2N1bWVudCgpLCBpbmplY3QoQVBQX0lEKSk7XG4gIHJldHVybiB0cmFuc2ZlclN0YXRlO1xufVxuXG4vKipcbiAqIEEga2V5IHZhbHVlIHN0b3JlIHRoYXQgaXMgdHJhbnNmZXJyZWQgZnJvbSB0aGUgYXBwbGljYXRpb24gb24gdGhlIHNlcnZlciBzaWRlIHRvIHRoZSBhcHBsaWNhdGlvblxuICogb24gdGhlIGNsaWVudCBzaWRlLlxuICpcbiAqIFRoZSBgVHJhbnNmZXJTdGF0ZWAgaXMgYXZhaWxhYmxlIGFzIGFuIGluamVjdGFibGUgdG9rZW4uXG4gKiBPbiB0aGUgY2xpZW50LCBqdXN0IGluamVjdCB0aGlzIHRva2VuIHVzaW5nIERJIGFuZCB1c2UgaXQsIGl0IHdpbGwgYmUgbGF6aWx5IGluaXRpYWxpemVkLlxuICogT24gdGhlIHNlcnZlciBpdCdzIGFscmVhZHkgaW5jbHVkZWQgaWYgYHJlbmRlckFwcGxpY2F0aW9uYCBmdW5jdGlvbiBpcyB1c2VkLiBPdGhlcndpc2UsIGltcG9ydFxuICogdGhlIGBTZXJ2ZXJUcmFuc2ZlclN0YXRlTW9kdWxlYCBtb2R1bGUgdG8gbWFrZSB0aGUgYFRyYW5zZmVyU3RhdGVgIGF2YWlsYWJsZS5cbiAqXG4gKiBUaGUgdmFsdWVzIGluIHRoZSBzdG9yZSBhcmUgc2VyaWFsaXplZC9kZXNlcmlhbGl6ZWQgdXNpbmcgSlNPTi5zdHJpbmdpZnkvSlNPTi5wYXJzZS4gU28gb25seVxuICogYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcsIG51bGwgYW5kIG5vbi1jbGFzcyBvYmplY3RzIHdpbGwgYmUgc2VyaWFsaXplZCBhbmQgZGVzZXJpYWxpemVkIGluIGFcbiAqIG5vbi1sb3NzeSBtYW5uZXIuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgVHJhbnNmZXJTdGF0ZSB7XG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID1cbiAgICAgIC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgICAgICB0b2tlbjogVHJhbnNmZXJTdGF0ZSxcbiAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgICAgICBmYWN0b3J5OiBpbml0VHJhbnNmZXJTdGF0ZSxcbiAgICAgIH0pO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgc3RvcmU6IHtbazogc3RyaW5nXTogdW5rbm93bnx1bmRlZmluZWR9ID0ge307XG5cbiAgcHJpdmF0ZSBvblNlcmlhbGl6ZUNhbGxiYWNrczoge1trOiBzdHJpbmddOiAoKSA9PiB1bmtub3duIHwgdW5kZWZpbmVkfSA9IHt9O1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHZhbHVlIGNvcnJlc3BvbmRpbmcgdG8gYSBrZXkuIFJldHVybiBgZGVmYXVsdFZhbHVlYCBpZiBrZXkgaXMgbm90IGZvdW5kLlxuICAgKi9cbiAgZ2V0PFQ+KGtleTogU3RhdGVLZXk8VD4sIGRlZmF1bHRWYWx1ZTogVCk6IFQge1xuICAgIHJldHVybiB0aGlzLnN0b3JlW2tleV0gIT09IHVuZGVmaW5lZCA/IHRoaXMuc3RvcmVba2V5XSBhcyBUIDogZGVmYXVsdFZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgdmFsdWUgY29ycmVzcG9uZGluZyB0byBhIGtleS5cbiAgICovXG4gIHNldDxUPihrZXk6IFN0YXRlS2V5PFQ+LCB2YWx1ZTogVCk6IHZvaWQge1xuICAgIHRoaXMuc3RvcmVba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIGtleSBmcm9tIHRoZSBzdG9yZS5cbiAgICovXG4gIHJlbW92ZTxUPihrZXk6IFN0YXRlS2V5PFQ+KTogdm9pZCB7XG4gICAgZGVsZXRlIHRoaXMuc3RvcmVba2V5XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUZXN0IHdoZXRoZXIgYSBrZXkgZXhpc3RzIGluIHRoZSBzdG9yZS5cbiAgICovXG4gIGhhc0tleTxUPihrZXk6IFN0YXRlS2V5PFQ+KSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcmUuaGFzT3duUHJvcGVydHkoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgc3RhdGUgaXMgZW1wdHkuXG4gICAqL1xuICBnZXQgaXNFbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5zdG9yZSkubGVuZ3RoID09PSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gcHJvdmlkZSB0aGUgdmFsdWUgZm9yIGEga2V5IHdoZW4gYHRvSnNvbmAgaXMgY2FsbGVkLlxuICAgKi9cbiAgb25TZXJpYWxpemU8VD4oa2V5OiBTdGF0ZUtleTxUPiwgY2FsbGJhY2s6ICgpID0+IFQpOiB2b2lkIHtcbiAgICB0aGlzLm9uU2VyaWFsaXplQ2FsbGJhY2tzW2tleV0gPSBjYWxsYmFjaztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXJpYWxpemUgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHN0b3JlIHRvIEpTT04uXG4gICAqL1xuICB0b0pzb24oKTogc3RyaW5nIHtcbiAgICAvLyBDYWxsIHRoZSBvblNlcmlhbGl6ZSBjYWxsYmFja3MgYW5kIHB1dCB0aG9zZSB2YWx1ZXMgaW50byB0aGUgc3RvcmUuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5vblNlcmlhbGl6ZUNhbGxiYWNrcykge1xuICAgICAgaWYgKHRoaXMub25TZXJpYWxpemVDYWxsYmFja3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRoaXMuc3RvcmVba2V5XSA9IHRoaXMub25TZXJpYWxpemVDYWxsYmFja3Nba2V5XSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdFeGNlcHRpb24gaW4gb25TZXJpYWxpemUgY2FsbGJhY2s6ICcsIGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnN0b3JlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXRyaWV2ZVRyYW5zZmVycmVkU3RhdGUoZG9jOiBEb2N1bWVudCwgYXBwSWQ6IHN0cmluZykge1xuICAvLyBMb2NhdGUgdGhlIHNjcmlwdCB0YWcgd2l0aCB0aGUgSlNPTiBkYXRhIHRyYW5zZmVycmVkIGZyb20gdGhlIHNlcnZlci5cbiAgLy8gVGhlIGlkIG9mIHRoZSBzY3JpcHQgdGFnIGlzIHNldCB0byB0aGUgQW5ndWxhciBhcHBJZCArICdzdGF0ZScuXG4gIGNvbnN0IHNjcmlwdCA9IGRvYy5nZXRFbGVtZW50QnlJZChhcHBJZCArICctc3RhdGUnKTtcbiAgbGV0IGluaXRpYWxTdGF0ZSA9IHt9O1xuICBpZiAoc2NyaXB0ICYmIHNjcmlwdC50ZXh0Q29udGVudCkge1xuICAgIHRyeSB7XG4gICAgICAvLyBBdm9pZCB1c2luZyBhbnkgaGVyZSBhcyBpdCB0cmlnZ2VycyBsaW50IGVycm9ycyBpbiBnb29nbGUzIChhbnkgaXMgbm90IGFsbG93ZWQpLlxuICAgICAgaW5pdGlhbFN0YXRlID0gSlNPTi5wYXJzZSh1bmVzY2FwZVRyYW5zZmVyU3RhdGVDb250ZW50KHNjcmlwdC50ZXh0Q29udGVudCkpIGFzIHt9O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignRXhjZXB0aW9uIHdoaWxlIHJlc3RvcmluZyBUcmFuc2ZlclN0YXRlIGZvciBhcHAgJyArIGFwcElkLCBlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluaXRpYWxTdGF0ZTtcbn1cbiJdfQ==