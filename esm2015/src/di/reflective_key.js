/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util/stringify';
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
 *
 * @deprecated No replacement
 * @publicApi
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
    static get numberOfKeys() {
        return _globalKeyRegistry.numberOfKeys;
    }
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
    get numberOfKeys() {
        return this._allKeys.size;
    }
}
const _globalKeyRegistry = new KeyRegistry();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9rZXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yZWZsZWN0aXZlX2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBR2hEOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQUNILE1BQU0sT0FBTyxhQUFhO0lBRXhCOztPQUVHO0lBQ0gsWUFBbUIsS0FBYSxFQUFTLEVBQVU7UUFBaEMsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUFTLE9BQUUsR0FBRixFQUFFLENBQVE7UUFDakQsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztTQUMzQztRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQWE7UUFDdEIsT0FBTyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLEtBQUssWUFBWTtRQUNyQixPQUFPLGtCQUFrQixDQUFDLFlBQVksQ0FBQztJQUN6QyxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sV0FBVztJQUF4QjtRQUNVLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBeUIsQ0FBQztJQWlCdEQsQ0FBQztJQWZDLEdBQUcsQ0FBQyxLQUFhO1FBQ2YsSUFBSSxLQUFLLFlBQVksYUFBYTtZQUFFLE9BQU8sS0FBSyxDQUFDO1FBRWpELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDNUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUUsQ0FBQztTQUNsQztRQUVELE1BQU0sTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQzVCLENBQUM7Q0FDRjtBQUVELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuXG5cbi8qKlxuICogQSB1bmlxdWUgb2JqZWN0IHVzZWQgZm9yIHJldHJpZXZpbmcgaXRlbXMgZnJvbSB0aGUge0BsaW5rIFJlZmxlY3RpdmVJbmplY3Rvcn0uXG4gKlxuICogS2V5cyBoYXZlOlxuICogLSBhIHN5c3RlbS13aWRlIHVuaXF1ZSBgaWRgLlxuICogLSBhIGB0b2tlbmAuXG4gKlxuICogYEtleWAgaXMgdXNlZCBpbnRlcm5hbGx5IGJ5IHtAbGluayBSZWZsZWN0aXZlSW5qZWN0b3J9IGJlY2F1c2UgaXRzIHN5c3RlbS13aWRlIHVuaXF1ZSBgaWRgIGFsbG93c1xuICogdGhlXG4gKiBpbmplY3RvciB0byBzdG9yZSBjcmVhdGVkIG9iamVjdHMgaW4gYSBtb3JlIGVmZmljaWVudCB3YXkuXG4gKlxuICogYEtleWAgc2hvdWxkIG5vdCBiZSBjcmVhdGVkIGRpcmVjdGx5LiB7QGxpbmsgUmVmbGVjdGl2ZUluamVjdG9yfSBjcmVhdGVzIGtleXMgYXV0b21hdGljYWxseSB3aGVuXG4gKiByZXNvbHZpbmdcbiAqIHByb3ZpZGVycy5cbiAqXG4gKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgUmVmbGVjdGl2ZUtleSB7XG4gIHB1YmxpYyByZWFkb25seSBkaXNwbGF5TmFtZTogc3RyaW5nO1xuICAvKipcbiAgICogUHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IocHVibGljIHRva2VuOiBPYmplY3QsIHB1YmxpYyBpZDogbnVtYmVyKSB7XG4gICAgaWYgKCF0b2tlbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUb2tlbiBtdXN0IGJlIGRlZmluZWQhJyk7XG4gICAgfVxuICAgIHRoaXMuZGlzcGxheU5hbWUgPSBzdHJpbmdpZnkodGhpcy50b2tlbik7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgYEtleWAgZm9yIGEgdG9rZW4uXG4gICAqL1xuICBzdGF0aWMgZ2V0KHRva2VuOiBPYmplY3QpOiBSZWZsZWN0aXZlS2V5IHtcbiAgICByZXR1cm4gX2dsb2JhbEtleVJlZ2lzdHJ5LmdldChyZXNvbHZlRm9yd2FyZFJlZih0b2tlbikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHRoZSBudW1iZXIgb2Yga2V5cyByZWdpc3RlcmVkIGluIHRoZSBzeXN0ZW0uXG4gICAqL1xuICBzdGF0aWMgZ2V0IG51bWJlck9mS2V5cygpOiBudW1iZXIge1xuICAgIHJldHVybiBfZ2xvYmFsS2V5UmVnaXN0cnkubnVtYmVyT2ZLZXlzO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBLZXlSZWdpc3RyeSB7XG4gIHByaXZhdGUgX2FsbEtleXMgPSBuZXcgTWFwPE9iamVjdCwgUmVmbGVjdGl2ZUtleT4oKTtcblxuICBnZXQodG9rZW46IE9iamVjdCk6IFJlZmxlY3RpdmVLZXkge1xuICAgIGlmICh0b2tlbiBpbnN0YW5jZW9mIFJlZmxlY3RpdmVLZXkpIHJldHVybiB0b2tlbjtcblxuICAgIGlmICh0aGlzLl9hbGxLZXlzLmhhcyh0b2tlbikpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hbGxLZXlzLmdldCh0b2tlbikhO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld0tleSA9IG5ldyBSZWZsZWN0aXZlS2V5KHRva2VuLCBSZWZsZWN0aXZlS2V5Lm51bWJlck9mS2V5cyk7XG4gICAgdGhpcy5fYWxsS2V5cy5zZXQodG9rZW4sIG5ld0tleSk7XG4gICAgcmV0dXJuIG5ld0tleTtcbiAgfVxuXG4gIGdldCBudW1iZXJPZktleXMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fYWxsS2V5cy5zaXplO1xuICB9XG59XG5cbmNvbnN0IF9nbG9iYWxLZXlSZWdpc3RyeSA9IG5ldyBLZXlSZWdpc3RyeSgpO1xuIl19