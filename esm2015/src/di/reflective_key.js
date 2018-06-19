/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util';
import { resolveForwardRef } from './forward_ref';
/**
 * A unique object used for retrieving items from the {@link ReflectiveInjector}.
 *
 * Keys have:
 * - a system-wide unique `id`.
 * - a `token`.
 *
 * `Key` is used internally by {@link ReflectiveInjector} because its system-wide unique `id` allows
 * the
 * injector to store created objects in a more efficient way.
 *
 * `Key` should not be created directly. {@link ReflectiveInjector} creates keys automatically when
 * resolving
 * providers.
 * @deprecated No replacement
 */
export class ReflectiveKey {
    /**
     * Private
     */
    constructor(token, id) {
        this.token = token;
        this.id = id;
        if (!token) {
            throw new Error('Token must be defined!');
        }
        this.displayName = stringify(this.token);
    }
    /**
     * Retrieves a `Key` for a token.
     */
    static get(token) {
        return _globalKeyRegistry.get(resolveForwardRef(token));
    }
    /**
     * @returns the number of keys registered in the system.
     */
    static get numberOfKeys() { return _globalKeyRegistry.numberOfKeys; }
}
export class KeyRegistry {
    constructor() {
        this._allKeys = new Map();
    }
    get(token) {
        if (token instanceof ReflectiveKey)
            return token;
        if (this._allKeys.has(token)) {
            return this._allKeys.get(token);
        }
        const newKey = new ReflectiveKey(token, ReflectiveKey.numberOfKeys);
        this._allKeys.set(token, newKey);
        return newKey;
    }
    get numberOfKeys() { return this._allKeys.size; }
}
const _globalKeyRegistry = new KeyRegistry();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9rZXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yZWZsZWN0aXZlX2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUdoRDs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNO0lBRUo7O09BRUc7SUFDSCxZQUFtQixLQUFhLEVBQVMsRUFBVTtRQUFoQyxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQVMsT0FBRSxHQUFGLEVBQUUsQ0FBUTtRQUNqRCxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1NBQzNDO1FBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBYTtRQUN0QixPQUFPLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sS0FBSyxZQUFZLEtBQWEsT0FBTyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0NBQzlFO0FBRUQsTUFBTTtJQUFOO1FBQ1UsYUFBUSxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO0lBZXRELENBQUM7SUFiQyxHQUFHLENBQUMsS0FBYTtRQUNmLElBQUksS0FBSyxZQUFZLGFBQWE7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUVqRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzVCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFHLENBQUM7U0FDbkM7UUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNqQyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsSUFBSSxZQUFZLEtBQWEsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDMUQ7QUFFRCxNQUFNLGtCQUFrQixHQUFHLElBQUksV0FBVyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuXG5cbi8qKlxuICogQSB1bmlxdWUgb2JqZWN0IHVzZWQgZm9yIHJldHJpZXZpbmcgaXRlbXMgZnJvbSB0aGUge0BsaW5rIFJlZmxlY3RpdmVJbmplY3Rvcn0uXG4gKlxuICogS2V5cyBoYXZlOlxuICogLSBhIHN5c3RlbS13aWRlIHVuaXF1ZSBgaWRgLlxuICogLSBhIGB0b2tlbmAuXG4gKlxuICogYEtleWAgaXMgdXNlZCBpbnRlcm5hbGx5IGJ5IHtAbGluayBSZWZsZWN0aXZlSW5qZWN0b3J9IGJlY2F1c2UgaXRzIHN5c3RlbS13aWRlIHVuaXF1ZSBgaWRgIGFsbG93c1xuICogdGhlXG4gKiBpbmplY3RvciB0byBzdG9yZSBjcmVhdGVkIG9iamVjdHMgaW4gYSBtb3JlIGVmZmljaWVudCB3YXkuXG4gKlxuICogYEtleWAgc2hvdWxkIG5vdCBiZSBjcmVhdGVkIGRpcmVjdGx5LiB7QGxpbmsgUmVmbGVjdGl2ZUluamVjdG9yfSBjcmVhdGVzIGtleXMgYXV0b21hdGljYWxseSB3aGVuXG4gKiByZXNvbHZpbmdcbiAqIHByb3ZpZGVycy5cbiAqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBSZWZsZWN0aXZlS2V5IHtcbiAgcHVibGljIHJlYWRvbmx5IGRpc3BsYXlOYW1lOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBQcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgdG9rZW46IE9iamVjdCwgcHVibGljIGlkOiBudW1iZXIpIHtcbiAgICBpZiAoIXRva2VuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Rva2VuIG11c3QgYmUgZGVmaW5lZCEnKTtcbiAgICB9XG4gICAgdGhpcy5kaXNwbGF5TmFtZSA9IHN0cmluZ2lmeSh0aGlzLnRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBgS2V5YCBmb3IgYSB0b2tlbi5cbiAgICovXG4gIHN0YXRpYyBnZXQodG9rZW46IE9iamVjdCk6IFJlZmxlY3RpdmVLZXkge1xuICAgIHJldHVybiBfZ2xvYmFsS2V5UmVnaXN0cnkuZ2V0KHJlc29sdmVGb3J3YXJkUmVmKHRva2VuKSk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgdGhlIG51bWJlciBvZiBrZXlzIHJlZ2lzdGVyZWQgaW4gdGhlIHN5c3RlbS5cbiAgICovXG4gIHN0YXRpYyBnZXQgbnVtYmVyT2ZLZXlzKCk6IG51bWJlciB7IHJldHVybiBfZ2xvYmFsS2V5UmVnaXN0cnkubnVtYmVyT2ZLZXlzOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBLZXlSZWdpc3RyeSB7XG4gIHByaXZhdGUgX2FsbEtleXMgPSBuZXcgTWFwPE9iamVjdCwgUmVmbGVjdGl2ZUtleT4oKTtcblxuICBnZXQodG9rZW46IE9iamVjdCk6IFJlZmxlY3RpdmVLZXkge1xuICAgIGlmICh0b2tlbiBpbnN0YW5jZW9mIFJlZmxlY3RpdmVLZXkpIHJldHVybiB0b2tlbjtcblxuICAgIGlmICh0aGlzLl9hbGxLZXlzLmhhcyh0b2tlbikpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hbGxLZXlzLmdldCh0b2tlbikgITtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdLZXkgPSBuZXcgUmVmbGVjdGl2ZUtleSh0b2tlbiwgUmVmbGVjdGl2ZUtleS5udW1iZXJPZktleXMpO1xuICAgIHRoaXMuX2FsbEtleXMuc2V0KHRva2VuLCBuZXdLZXkpO1xuICAgIHJldHVybiBuZXdLZXk7XG4gIH1cblxuICBnZXQgbnVtYmVyT2ZLZXlzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9hbGxLZXlzLnNpemU7IH1cbn1cblxuY29uc3QgX2dsb2JhbEtleVJlZ2lzdHJ5ID0gbmV3IEtleVJlZ2lzdHJ5KCk7XG4iXX0=