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
    debugger; // Left intentionally for better debugger experience.
    throw new Error(`ASSERTION ERROR: ${msg}`);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE1BQU0sdUJBQXVCLE1BQVcsRUFBRSxHQUFXO0lBQ25ELElBQUksT0FBTyxNQUFNLElBQUksUUFBUSxFQUFFO1FBQzdCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7OztBQUVELE1BQU0sc0JBQXlCLE1BQVMsRUFBRSxRQUFXLEVBQUUsR0FBVztJQUNoRSxJQUFJLE1BQU0sSUFBSSxRQUFRLEVBQUU7UUFDdEIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7Ozs7O0FBRUQsTUFBTSx5QkFBNEIsTUFBUyxFQUFFLFFBQVcsRUFBRSxHQUFXO0lBQ25FLElBQUksTUFBTSxJQUFJLFFBQVEsRUFBRTtRQUN0QixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7Ozs7QUFFRCxNQUFNLHFCQUF3QixNQUFTLEVBQUUsUUFBVyxFQUFFLEdBQVc7SUFDL0QsSUFBSSxNQUFNLEtBQUssUUFBUSxFQUFFO1FBQ3ZCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7OztBQUVELE1BQU0seUJBQTRCLE1BQVMsRUFBRSxRQUFXLEVBQUUsR0FBVztJQUNuRSxJQUFJLE1BQU0sSUFBSSxRQUFRLEVBQUU7UUFDdEIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7Ozs7O0FBRUQsTUFBTSw0QkFBK0IsTUFBUyxFQUFFLFFBQVcsRUFBRSxHQUFXO0lBQ3RFLElBQUksTUFBTSxJQUFJLFFBQVEsRUFBRTtRQUN0QixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7OztBQUVELE1BQU0sMkJBQThCLE1BQVMsRUFBRSxHQUFXO0lBQ3hELElBQUksTUFBTSxJQUFJLElBQUksRUFBRTtRQUNsQixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7OztBQUVELE1BQU0sd0JBQTJCLE1BQVMsRUFBRSxHQUFXO0lBQ3JELElBQUksTUFBTSxJQUFJLElBQUksRUFBRTtRQUNsQixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7O0FBRUQsTUFBTSw4QkFDRixNQUFXLEVBQ1gsTUFDSSxvRkFBb0Y7SUFDMUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUU7UUFDMUIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7OztBQUVELE1BQU0sNkJBQ0YsTUFBVyxFQUNYLE1BQ0ksZ0ZBQWdGO0lBQ3RGLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO1FBQ3ZCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7OztBQUVELG9CQUFvQixHQUFXO0lBQzdCLFFBQVEsQ0FBQztJQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxDQUFDLENBQUM7Q0FDNUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRoZSBmdW5jdGlvbnMgaW4gdGhpcyBmaWxlIHZlcmlmeSB0aGF0IHRoZSBhc3N1bXB0aW9ucyB3ZSBhcmUgbWFraW5nXG4vLyBhYm91dCBzdGF0ZSBpbiBhbiBpbnN0cnVjdGlvbiBhcmUgY29ycmVjdCBiZWZvcmUgaW1wbGVtZW50aW5nIGFueSBsb2dpYy5cbi8vIFRoZXkgYXJlIG1lYW50IG9ubHkgdG8gYmUgY2FsbGVkIGluIGRldiBtb2RlIGFzIHNhbml0eSBjaGVja3MuXG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROdW1iZXIoYWN0dWFsOiBhbnksIG1zZzogc3RyaW5nKSB7XG4gIGlmICh0eXBlb2YgYWN0dWFsICE9ICdudW1iZXInKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbDxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbDxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTYW1lPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRMZXNzVGhhbjxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsID49IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRHcmVhdGVyVGhhbjxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsIDw9IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3REZWZpbmVkPFQ+KGFjdHVhbDogVCwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKGFjdHVhbCAhPSBudWxsKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnREZWZpbmVkPFQ+KGFjdHVhbDogVCwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKGFjdHVhbCA9PSBudWxsKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRDb21wb25lbnRUeXBlKFxuICAgIGFjdHVhbDogYW55LFxuICAgIG1zZzogc3RyaW5nID1cbiAgICAgICAgJ1R5cGUgcGFzc2VkIGluIGlzIG5vdCBDb21wb25lbnRUeXBlLCBpdCBkb2VzIG5vdCBoYXZlIFxcJ25nQ29tcG9uZW50RGVmXFwnIHByb3BlcnR5LicpIHtcbiAgaWYgKCFhY3R1YWwubmdDb21wb25lbnREZWYpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5nTW9kdWxlVHlwZShcbiAgICBhY3R1YWw6IGFueSxcbiAgICBtc2c6IHN0cmluZyA9XG4gICAgICAgICdUeXBlIHBhc3NlZCBpbiBpcyBub3QgTmdNb2R1bGVUeXBlLCBpdCBkb2VzIG5vdCBoYXZlIFxcJ25nTW9kdWxlRGVmXFwnIHByb3BlcnR5LicpIHtcbiAgaWYgKCFhY3R1YWwubmdNb2R1bGVEZWYpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGhyb3dFcnJvcihtc2c6IHN0cmluZyk6IG5ldmVyIHtcbiAgZGVidWdnZXI7ICAvLyBMZWZ0IGludGVudGlvbmFsbHkgZm9yIGJldHRlciBkZWJ1Z2dlciBleHBlcmllbmNlLlxuICB0aHJvdyBuZXcgRXJyb3IoYEFTU0VSVElPTiBFUlJPUjogJHttc2d9YCk7XG59XG4iXX0=