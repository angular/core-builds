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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9rZXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yZWZsZWN0aXZlX2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUdoRDs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNLE9BQU8sYUFBYTtJQUV4Qjs7T0FFRztJQUNILFlBQW1CLEtBQWEsRUFBUyxFQUFVO1FBQWhDLFVBQUssR0FBTCxLQUFLLENBQVE7UUFBUyxPQUFFLEdBQUYsRUFBRSxDQUFRO1FBQ2pELElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7U0FDM0M7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFhO1FBQ3RCLE9BQU8sa0JBQWtCLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxLQUFLLFlBQVksS0FBYSxPQUFPLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Q0FDOUU7QUFFRCxNQUFNLE9BQU8sV0FBVztJQUF4QjtRQUNVLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBeUIsQ0FBQztJQWV0RCxDQUFDO0lBYkMsR0FBRyxDQUFDLEtBQWE7UUFDZixJQUFJLEtBQUssWUFBWSxhQUFhO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFFakQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUM1QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBRyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDakMsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELElBQUksWUFBWSxLQUFhLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0NBQzFEO0FBRUQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcblxuXG4vKipcbiAqIEEgdW5pcXVlIG9iamVjdCB1c2VkIGZvciByZXRyaWV2aW5nIGl0ZW1zIGZyb20gdGhlIHtAbGluayBSZWZsZWN0aXZlSW5qZWN0b3J9LlxuICpcbiAqIEtleXMgaGF2ZTpcbiAqIC0gYSBzeXN0ZW0td2lkZSB1bmlxdWUgYGlkYC5cbiAqIC0gYSBgdG9rZW5gLlxuICpcbiAqIGBLZXlgIGlzIHVzZWQgaW50ZXJuYWxseSBieSB7QGxpbmsgUmVmbGVjdGl2ZUluamVjdG9yfSBiZWNhdXNlIGl0cyBzeXN0ZW0td2lkZSB1bmlxdWUgYGlkYCBhbGxvd3NcbiAqIHRoZVxuICogaW5qZWN0b3IgdG8gc3RvcmUgY3JlYXRlZCBvYmplY3RzIGluIGEgbW9yZSBlZmZpY2llbnQgd2F5LlxuICpcbiAqIGBLZXlgIHNob3VsZCBub3QgYmUgY3JlYXRlZCBkaXJlY3RseS4ge0BsaW5rIFJlZmxlY3RpdmVJbmplY3Rvcn0gY3JlYXRlcyBrZXlzIGF1dG9tYXRpY2FsbHkgd2hlblxuICogcmVzb2x2aW5nXG4gKiBwcm92aWRlcnMuXG4gKiBAZGVwcmVjYXRlZCBObyByZXBsYWNlbWVudFxuICovXG5leHBvcnQgY2xhc3MgUmVmbGVjdGl2ZUtleSB7XG4gIHB1YmxpYyByZWFkb25seSBkaXNwbGF5TmFtZTogc3RyaW5nO1xuICAvKipcbiAgICogUHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IocHVibGljIHRva2VuOiBPYmplY3QsIHB1YmxpYyBpZDogbnVtYmVyKSB7XG4gICAgaWYgKCF0b2tlbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUb2tlbiBtdXN0IGJlIGRlZmluZWQhJyk7XG4gICAgfVxuICAgIHRoaXMuZGlzcGxheU5hbWUgPSBzdHJpbmdpZnkodGhpcy50b2tlbik7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgYEtleWAgZm9yIGEgdG9rZW4uXG4gICAqL1xuICBzdGF0aWMgZ2V0KHRva2VuOiBPYmplY3QpOiBSZWZsZWN0aXZlS2V5IHtcbiAgICByZXR1cm4gX2dsb2JhbEtleVJlZ2lzdHJ5LmdldChyZXNvbHZlRm9yd2FyZFJlZih0b2tlbikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHRoZSBudW1iZXIgb2Yga2V5cyByZWdpc3RlcmVkIGluIHRoZSBzeXN0ZW0uXG4gICAqL1xuICBzdGF0aWMgZ2V0IG51bWJlck9mS2V5cygpOiBudW1iZXIgeyByZXR1cm4gX2dsb2JhbEtleVJlZ2lzdHJ5Lm51bWJlck9mS2V5czsgfVxufVxuXG5leHBvcnQgY2xhc3MgS2V5UmVnaXN0cnkge1xuICBwcml2YXRlIF9hbGxLZXlzID0gbmV3IE1hcDxPYmplY3QsIFJlZmxlY3RpdmVLZXk+KCk7XG5cbiAgZ2V0KHRva2VuOiBPYmplY3QpOiBSZWZsZWN0aXZlS2V5IHtcbiAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBSZWZsZWN0aXZlS2V5KSByZXR1cm4gdG9rZW47XG5cbiAgICBpZiAodGhpcy5fYWxsS2V5cy5oYXModG9rZW4pKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYWxsS2V5cy5nZXQodG9rZW4pICE7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3S2V5ID0gbmV3IFJlZmxlY3RpdmVLZXkodG9rZW4sIFJlZmxlY3RpdmVLZXkubnVtYmVyT2ZLZXlzKTtcbiAgICB0aGlzLl9hbGxLZXlzLnNldCh0b2tlbiwgbmV3S2V5KTtcbiAgICByZXR1cm4gbmV3S2V5O1xuICB9XG5cbiAgZ2V0IG51bWJlck9mS2V5cygpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fYWxsS2V5cy5zaXplOyB9XG59XG5cbmNvbnN0IF9nbG9iYWxLZXlSZWdpc3RyeSA9IG5ldyBLZXlSZWdpc3RyeSgpO1xuIl19