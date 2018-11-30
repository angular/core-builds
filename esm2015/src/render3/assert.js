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
import { getComponentDef, getNgModuleDef } from './definition';
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
    if (!getComponentDef(actual)) {
        throwError(msg);
    }
}
/**
 * @param {?} actual
 * @param {?=} msg
 * @return {?}
 */
export function assertNgModuleType(actual, msg = 'Type passed in is not NgModuleType, it does not have \'ngModuleDef\' property.') {
    if (!getNgModuleDef(actual)) {
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
/**
 * @param {?} node
 * @return {?}
 */
export function assertDomNode(node) {
    assertEqual(node instanceof Node, true, 'The provided value must be an instance of a DOM Node');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7O0FBTTdELE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBVyxFQUFFLEdBQVc7SUFDbkQsSUFBSSxPQUFPLE1BQU0sSUFBSSxRQUFRLEVBQUU7UUFDN0IsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7Ozs7O0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBSSxNQUFTLEVBQUUsUUFBVyxFQUFFLEdBQVc7SUFDaEUsSUFBSSxNQUFNLElBQUksUUFBUSxFQUFFO1FBQ3RCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUksTUFBUyxFQUFFLFFBQVcsRUFBRSxHQUFXO0lBQ25FLElBQUksTUFBTSxJQUFJLFFBQVEsRUFBRTtRQUN0QixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsVUFBVSxDQUFJLE1BQVMsRUFBRSxRQUFXLEVBQUUsR0FBVztJQUMvRCxJQUFJLE1BQU0sS0FBSyxRQUFRLEVBQUU7UUFDdkIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBSSxNQUFTLEVBQUUsUUFBVyxFQUFFLEdBQVc7SUFDbkUsSUFBSSxNQUFNLElBQUksUUFBUSxFQUFFO1FBQ3RCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7OztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBSSxNQUFTLEVBQUUsUUFBVyxFQUFFLEdBQVc7SUFDdEUsSUFBSSxNQUFNLElBQUksUUFBUSxFQUFFO1FBQ3RCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFJLE1BQVMsRUFBRSxHQUFXO0lBQ3hELElBQUksTUFBTSxJQUFJLElBQUksRUFBRTtRQUNsQixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7Q0FDRjs7Ozs7OztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUksTUFBUyxFQUFFLEdBQVc7SUFDckQsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO1FBQ2xCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLE1BQVcsRUFDWCxNQUNJLG9GQUFvRjtJQUMxRixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQzVCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE1BQVcsRUFDWCxNQUNJLGdGQUFnRjtJQUN0RixJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQzNCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtDQUNGOzs7OztBQUVELFNBQVMsVUFBVSxDQUFDLEdBQVc7O0lBRTdCLFFBQVEsQ0FBQztJQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxDQUFDLENBQUM7Q0FDNUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxJQUFTO0lBQ3JDLFdBQVcsQ0FBQyxJQUFJLFlBQVksSUFBSSxFQUFFLElBQUksRUFBRSxzREFBc0QsQ0FBQyxDQUFDO0NBQ2pHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0TmdNb2R1bGVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5cbi8vIFRoZSBmdW5jdGlvbnMgaW4gdGhpcyBmaWxlIHZlcmlmeSB0aGF0IHRoZSBhc3N1bXB0aW9ucyB3ZSBhcmUgbWFraW5nXG4vLyBhYm91dCBzdGF0ZSBpbiBhbiBpbnN0cnVjdGlvbiBhcmUgY29ycmVjdCBiZWZvcmUgaW1wbGVtZW50aW5nIGFueSBsb2dpYy5cbi8vIFRoZXkgYXJlIG1lYW50IG9ubHkgdG8gYmUgY2FsbGVkIGluIGRldiBtb2RlIGFzIHNhbml0eSBjaGVja3MuXG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROdW1iZXIoYWN0dWFsOiBhbnksIG1zZzogc3RyaW5nKSB7XG4gIGlmICh0eXBlb2YgYWN0dWFsICE9ICdudW1iZXInKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbDxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbDxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTYW1lPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRMZXNzVGhhbjxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsID49IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRHcmVhdGVyVGhhbjxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsIDw9IGV4cGVjdGVkKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3REZWZpbmVkPFQ+KGFjdHVhbDogVCwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKGFjdHVhbCAhPSBudWxsKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnREZWZpbmVkPFQ+KGFjdHVhbDogVCwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKGFjdHVhbCA9PSBudWxsKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRDb21wb25lbnRUeXBlKFxuICAgIGFjdHVhbDogYW55LFxuICAgIG1zZzogc3RyaW5nID1cbiAgICAgICAgJ1R5cGUgcGFzc2VkIGluIGlzIG5vdCBDb21wb25lbnRUeXBlLCBpdCBkb2VzIG5vdCBoYXZlIFxcJ25nQ29tcG9uZW50RGVmXFwnIHByb3BlcnR5LicpIHtcbiAgaWYgKCFnZXRDb21wb25lbnREZWYoYWN0dWFsKSkge1xuICAgIHRocm93RXJyb3IobXNnKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TmdNb2R1bGVUeXBlKFxuICAgIGFjdHVhbDogYW55LFxuICAgIG1zZzogc3RyaW5nID1cbiAgICAgICAgJ1R5cGUgcGFzc2VkIGluIGlzIG5vdCBOZ01vZHVsZVR5cGUsIGl0IGRvZXMgbm90IGhhdmUgXFwnbmdNb2R1bGVEZWZcXCcgcHJvcGVydHkuJykge1xuICBpZiAoIWdldE5nTW9kdWxlRGVmKGFjdHVhbCkpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGhyb3dFcnJvcihtc2c6IHN0cmluZyk6IG5ldmVyIHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG4gIGRlYnVnZ2VyOyAgLy8gTGVmdCBpbnRlbnRpb25hbGx5IGZvciBiZXR0ZXIgZGVidWdnZXIgZXhwZXJpZW5jZS5cbiAgdGhyb3cgbmV3IEVycm9yKGBBU1NFUlRJT04gRVJST1I6ICR7bXNnfWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RG9tTm9kZShub2RlOiBhbnkpIHtcbiAgYXNzZXJ0RXF1YWwobm9kZSBpbnN0YW5jZW9mIE5vZGUsIHRydWUsICdUaGUgcHJvdmlkZWQgdmFsdWUgbXVzdCBiZSBhbiBpbnN0YW5jZSBvZiBhIERPTSBOb2RlJyk7XG59XG4iXX0=