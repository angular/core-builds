/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SimpleChange } from '../interface/simple_change';
/**
 * Checks an object to see if it's an exact instance of a particular type
 * without traversing the inheritance hierarchy like `instanceof` does.
 * @template T
 * @param {?} obj The object to check
 * @param {?} type The type to check the object against
 * @return {?}
 */
export function isExactInstanceOf(obj, type) {
    return obj != null && typeof obj == 'object' && Object.getPrototypeOf(obj) == type.prototype;
}
/**
 * Checks to see if an object is an instance of {\@link OnChangesDirectiveWrapper}
 * @param {?} obj the object to check (generally from `LView`)
 * @return {?}
 */
export function isOnChangesDirectiveWrapper(obj) {
    return isExactInstanceOf(obj, OnChangesDirectiveWrapper);
}
/**
 * Removes the `OnChangesDirectiveWrapper` if present.
 *
 * @template T
 * @param {?} obj to unwrap.
 * @return {?}
 */
export function unwrapOnChangesDirectiveWrapper(obj) {
    return isOnChangesDirectiveWrapper(obj) ? obj.instance : obj;
}
/**
 * A class that wraps directive instances for storage in LView when directives
 * have onChanges hooks to deal with.
 * @template T
 */
export class OnChangesDirectiveWrapper {
    /**
     * @param {?} instance
     */
    constructor(instance) {
        this.instance = instance;
        this.seenProps = new Set();
        this.previous = {};
        this.changes = null;
    }
}
if (false) {
    /** @type {?} */
    OnChangesDirectiveWrapper.prototype.seenProps;
    /** @type {?} */
    OnChangesDirectiveWrapper.prototype.previous;
    /** @type {?} */
    OnChangesDirectiveWrapper.prototype.changes;
    /** @type {?} */
    OnChangesDirectiveWrapper.prototype.instance;
}
/**
 * Updates the `changes` property on the `wrapper` instance, such that when it's
 * checked in {\@link callHooks} it will fire the related `onChanges` hook.
 * @param {?} wrapper the wrapper for the directive instance
 * @param {?} declaredName the declared name to be used in `SimpleChange`
 * @param {?} value The new value for the property
 * @return {?}
 */
export function recordChange(wrapper, declaredName, value) {
    /** @type {?} */
    const simpleChanges = wrapper.changes || (wrapper.changes = {});
    /** @type {?} */
    const firstChange = !wrapper.seenProps.has(declaredName);
    if (firstChange) {
        wrapper.seenProps.add(declaredName);
    }
    /** @type {?} */
    const previous = wrapper.previous;
    /** @type {?} */
    const previousValue = previous[declaredName];
    simpleChanges[declaredName] = new SimpleChange(firstChange ? undefined : previousValue && previousValue.currentValue, value, firstChange);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25jaGFuZ2VzX3V0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL29uY2hhbmdlc191dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLFlBQVksRUFBZ0IsTUFBTSw0QkFBNEIsQ0FBQzs7Ozs7Ozs7O0FBV3ZFLE1BQU0sVUFBVSxpQkFBaUIsQ0FBSSxHQUFRLEVBQUUsSUFBb0I7SUFDakUsT0FBTyxHQUFHLElBQUksSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLFFBQVEsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDL0YsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEdBQVE7SUFDbEQsT0FBTyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUMzRCxDQUFDOzs7Ozs7OztBQU9ELE1BQU0sVUFBVSwrQkFBK0IsQ0FBSSxHQUFxQztJQUN0RixPQUFPLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDL0QsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxPQUFPLHlCQUF5Qjs7OztJQUtwQyxZQUFtQixRQUFXO1FBQVgsYUFBUSxHQUFSLFFBQVEsQ0FBRztRQUo5QixjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM5QixhQUFRLEdBQWtCLEVBQUUsQ0FBQztRQUM3QixZQUFPLEdBQXVCLElBQUksQ0FBQztJQUVGLENBQUM7Q0FDbkM7OztJQUxDLDhDQUE4Qjs7SUFDOUIsNkNBQTZCOztJQUM3Qiw0Q0FBbUM7O0lBRXZCLDZDQUFrQjs7Ozs7Ozs7OztBQVVoQyxNQUFNLFVBQVUsWUFBWSxDQUFDLE9BQWtDLEVBQUUsWUFBb0IsRUFBRSxLQUFVOztVQUN6RixhQUFhLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOztVQUV6RCxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUM7SUFDeEQsSUFBSSxXQUFXLEVBQUU7UUFDZixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUNyQzs7VUFFSyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVE7O1VBQzNCLGFBQWEsR0FBMkIsUUFBUSxDQUFDLFlBQVksQ0FBQztJQUNwRSxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxZQUFZLENBQzFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxhQUFhLElBQUksYUFBYSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDakcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U2ltcGxlQ2hhbmdlLCBTaW1wbGVDaGFuZ2VzfSBmcm9tICcuLi9pbnRlcmZhY2Uvc2ltcGxlX2NoYW5nZSc7XG5cblxudHlwZSBDb25zdHJ1Y3RvcjxUPiA9IG5ldyAoLi4uYXJnczogYW55W10pID0+IFQ7XG5cbi8qKlxuICogQ2hlY2tzIGFuIG9iamVjdCB0byBzZWUgaWYgaXQncyBhbiBleGFjdCBpbnN0YW5jZSBvZiBhIHBhcnRpY3VsYXIgdHlwZVxuICogd2l0aG91dCB0cmF2ZXJzaW5nIHRoZSBpbmhlcml0YW5jZSBoaWVyYXJjaHkgbGlrZSBgaW5zdGFuY2VvZmAgZG9lcy5cbiAqIEBwYXJhbSBvYmogVGhlIG9iamVjdCB0byBjaGVja1xuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgdG8gY2hlY2sgdGhlIG9iamVjdCBhZ2FpbnN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0V4YWN0SW5zdGFuY2VPZjxUPihvYmo6IGFueSwgdHlwZTogQ29uc3RydWN0b3I8VD4pOiBvYmogaXMgVCB7XG4gIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09ICdvYmplY3QnICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopID09IHR5cGUucHJvdG90eXBlO1xufVxuXG4vKipcbiAqIENoZWNrcyB0byBzZWUgaWYgYW4gb2JqZWN0IGlzIGFuIGluc3RhbmNlIG9mIHtAbGluayBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyfVxuICogQHBhcmFtIG9iaiB0aGUgb2JqZWN0IHRvIGNoZWNrIChnZW5lcmFsbHkgZnJvbSBgTFZpZXdgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyKG9iajogYW55KTogb2JqIGlzIE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXI8YW55PiB7XG4gIHJldHVybiBpc0V4YWN0SW5zdGFuY2VPZihvYmosIE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIpO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgdGhlIGBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyYCBpZiBwcmVzZW50LlxuICpcbiAqIEBwYXJhbSBvYmogdG8gdW53cmFwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcjxUPihvYmo6IFQgfCBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyPFQ+KTogVCB7XG4gIHJldHVybiBpc09uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIob2JqKSA/IG9iai5pbnN0YW5jZSA6IG9iajtcbn1cblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgd3JhcHMgZGlyZWN0aXZlIGluc3RhbmNlcyBmb3Igc3RvcmFnZSBpbiBMVmlldyB3aGVuIGRpcmVjdGl2ZXNcbiAqIGhhdmUgb25DaGFuZ2VzIGhvb2tzIHRvIGRlYWwgd2l0aC5cbiAqL1xuZXhwb3J0IGNsYXNzIE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXI8VCA9IGFueT4ge1xuICBzZWVuUHJvcHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcHJldmlvdXM6IFNpbXBsZUNoYW5nZXMgPSB7fTtcbiAgY2hhbmdlczogU2ltcGxlQ2hhbmdlc3xudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgaW5zdGFuY2U6IFQpIHt9XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgYGNoYW5nZXNgIHByb3BlcnR5IG9uIHRoZSBgd3JhcHBlcmAgaW5zdGFuY2UsIHN1Y2ggdGhhdCB3aGVuIGl0J3NcbiAqIGNoZWNrZWQgaW4ge0BsaW5rIGNhbGxIb29rc30gaXQgd2lsbCBmaXJlIHRoZSByZWxhdGVkIGBvbkNoYW5nZXNgIGhvb2suXG4gKiBAcGFyYW0gd3JhcHBlciB0aGUgd3JhcHBlciBmb3IgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZVxuICogQHBhcmFtIGRlY2xhcmVkTmFtZSB0aGUgZGVjbGFyZWQgbmFtZSB0byBiZSB1c2VkIGluIGBTaW1wbGVDaGFuZ2VgXG4gKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNvcmRDaGFuZ2Uod3JhcHBlcjogT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlciwgZGVjbGFyZWROYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgY29uc3Qgc2ltcGxlQ2hhbmdlcyA9IHdyYXBwZXIuY2hhbmdlcyB8fCAod3JhcHBlci5jaGFuZ2VzID0ge30pO1xuXG4gIGNvbnN0IGZpcnN0Q2hhbmdlID0gIXdyYXBwZXIuc2VlblByb3BzLmhhcyhkZWNsYXJlZE5hbWUpO1xuICBpZiAoZmlyc3RDaGFuZ2UpIHtcbiAgICB3cmFwcGVyLnNlZW5Qcm9wcy5hZGQoZGVjbGFyZWROYW1lKTtcbiAgfVxuXG4gIGNvbnN0IHByZXZpb3VzID0gd3JhcHBlci5wcmV2aW91cztcbiAgY29uc3QgcHJldmlvdXNWYWx1ZTogU2ltcGxlQ2hhbmdlfHVuZGVmaW5lZCA9IHByZXZpb3VzW2RlY2xhcmVkTmFtZV07XG4gIHNpbXBsZUNoYW5nZXNbZGVjbGFyZWROYW1lXSA9IG5ldyBTaW1wbGVDaGFuZ2UoXG4gICAgICBmaXJzdENoYW5nZSA/IHVuZGVmaW5lZCA6IHByZXZpb3VzVmFsdWUgJiYgcHJldmlvdXNWYWx1ZS5jdXJyZW50VmFsdWUsIHZhbHVlLCBmaXJzdENoYW5nZSk7XG59XG4iXX0=