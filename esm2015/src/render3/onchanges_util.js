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
import { SimpleChange } from '../change_detection/simple_change';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25jaGFuZ2VzX3V0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL29uY2hhbmdlc191dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLFlBQVksRUFBZ0IsTUFBTSxtQ0FBbUMsQ0FBQzs7Ozs7Ozs7O0FBVzlFLE1BQU0sVUFBVSxpQkFBaUIsQ0FBSSxHQUFRLEVBQUUsSUFBb0I7SUFDakUsT0FBTyxHQUFHLElBQUksSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLFFBQVEsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDL0YsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEdBQVE7SUFDbEQsT0FBTyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUMzRCxDQUFDOzs7Ozs7OztBQU9ELE1BQU0sVUFBVSwrQkFBK0IsQ0FBSSxHQUFxQztJQUN0RixPQUFPLDJCQUEyQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDL0QsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxPQUFPLHlCQUF5Qjs7OztJQUtwQyxZQUFtQixRQUFXO1FBQVgsYUFBUSxHQUFSLFFBQVEsQ0FBRztRQUo5QixjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUM5QixhQUFRLEdBQWtCLEVBQUUsQ0FBQztRQUM3QixZQUFPLEdBQXVCLElBQUksQ0FBQztJQUVGLENBQUM7Q0FDbkM7OztJQUxDLDhDQUE4Qjs7SUFDOUIsNkNBQTZCOztJQUM3Qiw0Q0FBbUM7O0lBRXZCLDZDQUFrQjs7Ozs7Ozs7OztBQVVoQyxNQUFNLFVBQVUsWUFBWSxDQUFDLE9BQWtDLEVBQUUsWUFBb0IsRUFBRSxLQUFVOztVQUN6RixhQUFhLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOztVQUV6RCxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUM7SUFDeEQsSUFBSSxXQUFXLEVBQUU7UUFDZixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUNyQzs7VUFFSyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVE7O1VBQzNCLGFBQWEsR0FBMkIsUUFBUSxDQUFDLFlBQVksQ0FBQztJQUNwRSxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxZQUFZLENBQzFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxhQUFhLElBQUksYUFBYSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDakcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U2ltcGxlQ2hhbmdlLCBTaW1wbGVDaGFuZ2VzfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NpbXBsZV9jaGFuZ2UnO1xuXG5cbnR5cGUgQ29uc3RydWN0b3I8VD4gPSBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBUO1xuXG4vKipcbiAqIENoZWNrcyBhbiBvYmplY3QgdG8gc2VlIGlmIGl0J3MgYW4gZXhhY3QgaW5zdGFuY2Ugb2YgYSBwYXJ0aWN1bGFyIHR5cGVcbiAqIHdpdGhvdXQgdHJhdmVyc2luZyB0aGUgaW5oZXJpdGFuY2UgaGllcmFyY2h5IGxpa2UgYGluc3RhbmNlb2ZgIGRvZXMuXG4gKiBAcGFyYW0gb2JqIFRoZSBvYmplY3QgdG8gY2hlY2tcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIHRvIGNoZWNrIHRoZSBvYmplY3QgYWdhaW5zdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFeGFjdEluc3RhbmNlT2Y8VD4ob2JqOiBhbnksIHR5cGU6IENvbnN0cnVjdG9yPFQ+KTogb2JqIGlzIFQge1xuICByZXR1cm4gb2JqICE9IG51bGwgJiYgdHlwZW9mIG9iaiA9PSAnb2JqZWN0JyAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSA9PSB0eXBlLnByb3RvdHlwZTtcbn1cblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIGFuIG9iamVjdCBpcyBhbiBpbnN0YW5jZSBvZiB7QGxpbmsgT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcn1cbiAqIEBwYXJhbSBvYmogdGhlIG9iamVjdCB0byBjaGVjayAoZ2VuZXJhbGx5IGZyb20gYExWaWV3YClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcihvYmo6IGFueSk6IG9iaiBpcyBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyPGFueT4ge1xuICByZXR1cm4gaXNFeGFjdEluc3RhbmNlT2Yob2JqLCBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyKTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBgT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcmAgaWYgcHJlc2VudC5cbiAqXG4gKiBAcGFyYW0gb2JqIHRvIHVud3JhcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXI8VD4ob2JqOiBUIHwgT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcjxUPik6IFQge1xuICByZXR1cm4gaXNPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyKG9iaikgPyBvYmouaW5zdGFuY2UgOiBvYmo7XG59XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IHdyYXBzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZm9yIHN0b3JhZ2UgaW4gTFZpZXcgd2hlbiBkaXJlY3RpdmVzXG4gKiBoYXZlIG9uQ2hhbmdlcyBob29rcyB0byBkZWFsIHdpdGguXG4gKi9cbmV4cG9ydCBjbGFzcyBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyPFQgPSBhbnk+IHtcbiAgc2VlblByb3BzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHByZXZpb3VzOiBTaW1wbGVDaGFuZ2VzID0ge307XG4gIGNoYW5nZXM6IFNpbXBsZUNoYW5nZXN8bnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGluc3RhbmNlOiBUKSB7fVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGBjaGFuZ2VzYCBwcm9wZXJ0eSBvbiB0aGUgYHdyYXBwZXJgIGluc3RhbmNlLCBzdWNoIHRoYXQgd2hlbiBpdCdzXG4gKiBjaGVja2VkIGluIHtAbGluayBjYWxsSG9va3N9IGl0IHdpbGwgZmlyZSB0aGUgcmVsYXRlZCBgb25DaGFuZ2VzYCBob29rLlxuICogQHBhcmFtIHdyYXBwZXIgdGhlIHdyYXBwZXIgZm9yIHRoZSBkaXJlY3RpdmUgaW5zdGFuY2VcbiAqIEBwYXJhbSBkZWNsYXJlZE5hbWUgdGhlIGRlY2xhcmVkIG5hbWUgdG8gYmUgdXNlZCBpbiBgU2ltcGxlQ2hhbmdlYFxuICogQHBhcmFtIHZhbHVlIFRoZSBuZXcgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjb3JkQ2hhbmdlKHdyYXBwZXI6IE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIsIGRlY2xhcmVkTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IHNpbXBsZUNoYW5nZXMgPSB3cmFwcGVyLmNoYW5nZXMgfHwgKHdyYXBwZXIuY2hhbmdlcyA9IHt9KTtcblxuICBjb25zdCBmaXJzdENoYW5nZSA9ICF3cmFwcGVyLnNlZW5Qcm9wcy5oYXMoZGVjbGFyZWROYW1lKTtcbiAgaWYgKGZpcnN0Q2hhbmdlKSB7XG4gICAgd3JhcHBlci5zZWVuUHJvcHMuYWRkKGRlY2xhcmVkTmFtZSk7XG4gIH1cblxuICBjb25zdCBwcmV2aW91cyA9IHdyYXBwZXIucHJldmlvdXM7XG4gIGNvbnN0IHByZXZpb3VzVmFsdWU6IFNpbXBsZUNoYW5nZXx1bmRlZmluZWQgPSBwcmV2aW91c1tkZWNsYXJlZE5hbWVdO1xuICBzaW1wbGVDaGFuZ2VzW2RlY2xhcmVkTmFtZV0gPSBuZXcgU2ltcGxlQ2hhbmdlKFxuICAgICAgZmlyc3RDaGFuZ2UgPyB1bmRlZmluZWQgOiBwcmV2aW91c1ZhbHVlICYmIHByZXZpb3VzVmFsdWUuY3VycmVudFZhbHVlLCB2YWx1ZSwgZmlyc3RDaGFuZ2UpO1xufVxuIl19