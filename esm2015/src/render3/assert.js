/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// The functions in this file verify that the assumptions we are making
// about state in an instruction are correct before implementing any logic.
// They are meant only to be called in dev mode as sanity checks.
/**
 * @param {?} actual
 * @param {?} msg
 * @return {?}
 */
export function assertNumber(actual, msg) {
    if (typeof actual != 'number') {
        throwError(msg);
    }
}
/**
 * @template T
 * @param {?} actual
 * @param {?} expected
 * @param {?} msg
 * @return {?}
 */
export function assertEqual(actual, expected, msg) {
    if (actual != expected) {
        throwError(msg);
    }
}
/**
 * @template T
 * @param {?} actual
 * @param {?} expected
 * @param {?} msg
 * @return {?}
 */
export function assertNotEqual(actual, expected, msg) {
    if (actual == expected) {
        throwError(msg);
    }
}
/**
 * @template T
 * @param {?} actual
 * @param {?} expected
 * @param {?} msg
 * @return {?}
 */
export function assertSame(actual, expected, msg) {
    if (actual !== expected) {
        throwError(msg);
    }
}
/**
 * @template T
 * @param {?} actual
 * @param {?} expected
 * @param {?} msg
 * @return {?}
 */
export function assertLessThan(actual, expected, msg) {
    if (actual >= expected) {
        throwError(msg);
    }
}
/**
 * @template T
 * @param {?} actual
 * @param {?} expected
 * @param {?} msg
 * @return {?}
 */
export function assertGreaterThan(actual, expected, msg) {
    if (actual <= expected) {
        throwError(msg);
    }
}
/**
 * @template T
 * @param {?} actual
 * @param {?} msg
 * @return {?}
 */
export function assertNotDefined(actual, msg) {
    if (actual != null) {
        throwError(msg);
    }
}
/**
 * @template T
 * @param {?} actual
 * @param {?} msg
 * @return {?}
 */
export function assertDefined(actual, msg) {
    if (actual == null) {
        throwError(msg);
    }
}
/**
 * @param {?} actual
 * @param {?=} msg
 * @return {?}
 */
export function assertComponentType(actual, msg = 'Type passed in is not ComponentType, it does not have \'ngComponentDef\' property.') {
    if (!actual.ngComponentDef) {
        throwError(msg);
    }
}
/**
 * @param {?} actual
 * @param {?=} msg
 * @return {?}
 */
export function assertNgModuleType(actual, msg = 'Type passed in is not NgModuleType, it does not have \'ngModuleDef\' property.') {
    if (!actual.ngModuleDef) {
        throwError(msg);
    }
}
/**
 * @param {?} msg
 * @return {?}
 */
function throwError(msg) {
    // tslint:disable-next-line
    debugger; // Left intentionally for better debugger experience.
    throw new Error(`ASSERTION ERROR: ${msg}`);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVyxFQUFFLEdBQVc7SUFDbkQsSUFBSSxPQUFPLE1BQU0sSUFBSSxRQUFRLEVBQUU7UUFDN0IsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7Ozs7O0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBSSxNQUFTLEVBQUUsUUFBVyxFQUFFLEdBQVc7SUFDaEUsSUFBSSxNQUFNLElBQUksUUFBUSxFQUFFO1FBQ3RCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUksTUFBUyxFQUFFLFFBQVcsRUFBRSxHQUFXO0lBQ25FLElBQUksTUFBTSxJQUFJLFFBQVEsRUFBRTtRQUN0QixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsVUFBVSxDQUFJLE1BQVMsRUFBRSxRQUFXLEVBQUUsR0FBVztJQUMvRCxJQUFJLE1BQU0sS0FBSyxRQUFRLEVBQUU7UUFDdkIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBSSxNQUFTLEVBQUUsUUFBVyxFQUFFLEdBQVc7SUFDbkUsSUFBSSxNQUFNLElBQUksUUFBUSxFQUFFO1FBQ3RCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7OztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBSSxNQUFTLEVBQUUsUUFBVyxFQUFFLEdBQVc7SUFDdEUsSUFBSSxNQUFNLElBQUksUUFBUSxFQUFFO1FBQ3RCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFJLE1BQVMsRUFBRSxHQUFXO0lBQ3hELElBQUksTUFBTSxJQUFJLElBQUksRUFBRTtRQUNsQixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7OztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUksTUFBUyxFQUFFLEdBQVc7SUFDckQsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO1FBQ2xCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLE1BQVcsRUFDWCxNQUNJLG9GQUFvRjtJQUMxRixJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRTtRQUMxQixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7O0FBRUQsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixNQUFXLEVBQ1gsTUFDSSxnRkFBZ0Y7SUFDdEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7UUFDdkIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7O0FBRUQsU0FBUyxVQUFVLENBQUMsR0FBVzs7SUFFN0IsUUFBUSxDQUFDO0lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLENBQUMsQ0FBQztDQUM1QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gVGhlIGZ1bmN0aW9ucyBpbiB0aGlzIGZpbGUgdmVyaWZ5IHRoYXQgdGhlIGFzc3VtcHRpb25zIHdlIGFyZSBtYWtpbmdcbi8vIGFib3V0IHN0YXRlIGluIGFuIGluc3RydWN0aW9uIGFyZSBjb3JyZWN0IGJlZm9yZSBpbXBsZW1lbnRpbmcgYW55IGxvZ2ljLlxuLy8gVGhleSBhcmUgbWVhbnQgb25seSB0byBiZSBjYWxsZWQgaW4gZGV2IG1vZGUgYXMgc2FuaXR5IGNoZWNrcy5cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE51bWJlcihhY3R1YWw6IGFueSwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKHR5cGVvZiBhY3R1YWwgIT0gJ251bWJlcicpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFsPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdEVxdWFsPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFNhbWU8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydExlc3NUaGFuPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKSB7XG4gIGlmIChhY3R1YWwgPj0gZXhwZWN0ZWQpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEdyZWF0ZXJUaGFuPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKSB7XG4gIGlmIChhY3R1YWwgPD0gZXhwZWN0ZWQpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdERlZmluZWQ8VD4oYWN0dWFsOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsICE9IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydERlZmluZWQ8VD4oYWN0dWFsOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsID09IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydENvbXBvbmVudFR5cGUoXG4gICAgYWN0dWFsOiBhbnksXG4gICAgbXNnOiBzdHJpbmcgPVxuICAgICAgICAnVHlwZSBwYXNzZWQgaW4gaXMgbm90IENvbXBvbmVudFR5cGUsIGl0IGRvZXMgbm90IGhhdmUgXFwnbmdDb21wb25lbnREZWZcXCcgcHJvcGVydHkuJykge1xuICBpZiAoIWFjdHVhbC5uZ0NvbXBvbmVudERlZikge1xuICAgIHRocm93RXJyb3IobXNnKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TmdNb2R1bGVUeXBlKFxuICAgIGFjdHVhbDogYW55LFxuICAgIG1zZzogc3RyaW5nID1cbiAgICAgICAgJ1R5cGUgcGFzc2VkIGluIGlzIG5vdCBOZ01vZHVsZVR5cGUsIGl0IGRvZXMgbm90IGhhdmUgXFwnbmdNb2R1bGVEZWZcXCcgcHJvcGVydHkuJykge1xuICBpZiAoIWFjdHVhbC5uZ01vZHVsZURlZikge1xuICAgIHRocm93RXJyb3IobXNnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0aHJvd0Vycm9yKG1zZzogc3RyaW5nKTogbmV2ZXIge1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmVcbiAgZGVidWdnZXI7ICAvLyBMZWZ0IGludGVudGlvbmFsbHkgZm9yIGJldHRlciBkZWJ1Z2dlciBleHBlcmllbmNlLlxuICB0aHJvdyBuZXcgRXJyb3IoYEFTU0VSVElPTiBFUlJPUjogJHttc2d9YCk7XG59XG4iXX0=