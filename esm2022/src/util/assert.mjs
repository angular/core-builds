/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// The functions in this file verify that the assumptions we are making
// about state in an instruction are correct before implementing any logic.
// They are meant only to be called in dev mode as sanity checks.
import { getActiveConsumer } from '@angular/core/primitives/signals';
import { stringify } from './stringify';
export function assertNumber(actual, msg) {
    if (!(typeof actual === 'number')) {
        throwError(msg, typeof actual, 'number', '===');
    }
}
export function assertNumberInRange(actual, minInclusive, maxInclusive) {
    assertNumber(actual, 'Expected a number');
    assertLessThanOrEqual(actual, maxInclusive, 'Expected number to be less than or equal to');
    assertGreaterThanOrEqual(actual, minInclusive, 'Expected number to be greater than or equal to');
}
export function assertString(actual, msg) {
    if (!(typeof actual === 'string')) {
        throwError(msg, actual === null ? 'null' : typeof actual, 'string', '===');
    }
}
export function assertFunction(actual, msg) {
    if (!(typeof actual === 'function')) {
        throwError(msg, actual === null ? 'null' : typeof actual, 'function', '===');
    }
}
export function assertEqual(actual, expected, msg) {
    if (!(actual == expected)) {
        throwError(msg, actual, expected, '==');
    }
}
export function assertNotEqual(actual, expected, msg) {
    if (!(actual != expected)) {
        throwError(msg, actual, expected, '!=');
    }
}
export function assertSame(actual, expected, msg) {
    if (!(actual === expected)) {
        throwError(msg, actual, expected, '===');
    }
}
export function assertNotSame(actual, expected, msg) {
    if (!(actual !== expected)) {
        throwError(msg, actual, expected, '!==');
    }
}
export function assertLessThan(actual, expected, msg) {
    if (!(actual < expected)) {
        throwError(msg, actual, expected, '<');
    }
}
export function assertLessThanOrEqual(actual, expected, msg) {
    if (!(actual <= expected)) {
        throwError(msg, actual, expected, '<=');
    }
}
export function assertGreaterThan(actual, expected, msg) {
    if (!(actual > expected)) {
        throwError(msg, actual, expected, '>');
    }
}
export function assertGreaterThanOrEqual(actual, expected, msg) {
    if (!(actual >= expected)) {
        throwError(msg, actual, expected, '>=');
    }
}
export function assertNotDefined(actual, msg) {
    if (actual != null) {
        throwError(msg, actual, null, '==');
    }
}
export function assertDefined(actual, msg) {
    if (actual == null) {
        throwError(msg, actual, null, '!=');
    }
}
export function throwError(msg, actual, expected, comparison) {
    throw new Error(`ASSERTION ERROR: ${msg}` +
        (comparison == null ? '' : ` [Expected=> ${expected} ${comparison} ${actual} <=Actual]`));
}
export function assertDomNode(node) {
    if (!(node instanceof Node)) {
        throwError(`The provided value must be an instance of a DOM Node but got ${stringify(node)}`);
    }
}
export function assertElement(node) {
    if (!(node instanceof Element)) {
        throwError(`The provided value must be an element but got ${stringify(node)}`);
    }
}
export function assertIndexInRange(arr, index) {
    assertDefined(arr, 'Array must be defined.');
    const maxLen = arr.length;
    if (index < 0 || index >= maxLen) {
        throwError(`Index expected to be less than ${maxLen} but got ${index}`);
    }
}
export function assertOneOf(value, ...validValues) {
    if (validValues.indexOf(value) !== -1)
        return true;
    throwError(`Expected value to be one of ${JSON.stringify(validValues)} but was ${JSON.stringify(value)}.`);
}
export function assertNotReactive(fn) {
    if (getActiveConsumer() !== null) {
        throwError(`${fn}() should never be called in a reactive context.`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdXRpbC9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsdUVBQXVFO0FBQ3ZFLDJFQUEyRTtBQUMzRSxpRUFBaUU7QUFFakUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFFbkUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUV0QyxNQUFNLFVBQVUsWUFBWSxDQUFDLE1BQVcsRUFBRSxHQUFXO0lBQ25ELElBQUksQ0FBQyxDQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDbEMsVUFBVSxDQUFDLEdBQUcsRUFBRSxPQUFPLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEQsQ0FBQztBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQ2pDLE1BQVcsRUFDWCxZQUFvQixFQUNwQixZQUFvQjtJQUVwQixZQUFZLENBQUMsTUFBTSxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDMUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDO0lBQzNGLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsZ0RBQWdELENBQUMsQ0FBQztBQUNuRyxDQUFDO0FBRUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxNQUFXLEVBQUUsR0FBVztJQUNuRCxJQUFJLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQ2xDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0Us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LE1BQU0sQ0FBQztJQUMxQixJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ2pDLFVBQVUsQ0FBQyxrQ0FBa0MsTUFBTSxZQUFZLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDMUUsQ0FBQztBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQVUsRUFBRSxHQUFHLFdBQWtCO0lBQzNELElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFBRSxPQUFPLElBQUksQ0FBQztJQUNuRCxVQUFVLENBQ1IsK0JBQStCLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUMvRixDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxFQUFVO0lBQzFDLElBQUksaUJBQWlCLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNqQyxVQUFVLENBQUMsR0FBRyxFQUFFLGtEQUFrRCxDQUFDLENBQUM7SUFDdEUsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gVGhlIGZ1bmN0aW9ucyBpbiB0aGlzIGZpbGUgdmVyaWZ5IHRoYXQgdGhlIGFzc3VtcHRpb25zIHdlIGFyZSBtYWtpbmdcbi8vIGFib3V0IHN0YXRlIGluIGFuIGluc3RydWN0aW9uIGFyZSBjb3JyZWN0IGJlZm9yZSBpbXBsZW1lbnRpbmcgYW55IGxvZ2ljLlxuLy8gVGhleSBhcmUgbWVhbnQgb25seSB0byBiZSBjYWxsZWQgaW4gZGV2IG1vZGUgYXMgc2FuaXR5IGNoZWNrcy5cblxuaW1wb3J0IHtnZXRBY3RpdmVDb25zdW1lcn0gZnJvbSAnQGFuZ3VsYXIvY29yZS9wcmltaXRpdmVzL3NpZ25hbHMnO1xuXG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi9zdHJpbmdpZnknO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TnVtYmVyKGFjdHVhbDogYW55LCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIG51bWJlciB7XG4gIGlmICghKHR5cGVvZiBhY3R1YWwgPT09ICdudW1iZXInKSkge1xuICAgIHRocm93RXJyb3IobXNnLCB0eXBlb2YgYWN0dWFsLCAnbnVtYmVyJywgJz09PScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROdW1iZXJJblJhbmdlKFxuICBhY3R1YWw6IGFueSxcbiAgbWluSW5jbHVzaXZlOiBudW1iZXIsXG4gIG1heEluY2x1c2l2ZTogbnVtYmVyLFxuKTogYXNzZXJ0cyBhY3R1YWwgaXMgbnVtYmVyIHtcbiAgYXNzZXJ0TnVtYmVyKGFjdHVhbCwgJ0V4cGVjdGVkIGEgbnVtYmVyJyk7XG4gIGFzc2VydExlc3NUaGFuT3JFcXVhbChhY3R1YWwsIG1heEluY2x1c2l2ZSwgJ0V4cGVjdGVkIG51bWJlciB0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8nKTtcbiAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKGFjdHVhbCwgbWluSW5jbHVzaXZlLCAnRXhwZWN0ZWQgbnVtYmVyIHRvIGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0bycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyaW5nKGFjdHVhbDogYW55LCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIHN0cmluZyB7XG4gIGlmICghKHR5cGVvZiBhY3R1YWwgPT09ICdzdHJpbmcnKSkge1xuICAgIHRocm93RXJyb3IobXNnLCBhY3R1YWwgPT09IG51bGwgPyAnbnVsbCcgOiB0eXBlb2YgYWN0dWFsLCAnc3RyaW5nJywgJz09PScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRGdW5jdGlvbihhY3R1YWw6IGFueSwgbXNnOiBzdHJpbmcpOiBhc3NlcnRzIGFjdHVhbCBpcyBGdW5jdGlvbiB7XG4gIGlmICghKHR5cGVvZiBhY3R1YWwgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgdGhyb3dFcnJvcihtc2csIGFjdHVhbCA9PT0gbnVsbCA/ICdudWxsJyA6IHR5cGVvZiBhY3R1YWwsICdmdW5jdGlvbicsICc9PT0nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWw8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKCEoYWN0dWFsID09IGV4cGVjdGVkKSkge1xuICAgIHRocm93RXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkLCAnPT0nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWw8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnOiBzdHJpbmcpOiBhc3NlcnRzIGFjdHVhbCBpcyBUIHtcbiAgaWYgKCEoYWN0dWFsICE9IGV4cGVjdGVkKSkge1xuICAgIHRocm93RXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkLCAnIT0nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U2FtZTxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBpZiAoIShhY3R1YWwgPT09IGV4cGVjdGVkKSkge1xuICAgIHRocm93RXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkLCAnPT09Jyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdFNhbWU8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnOiBzdHJpbmcpIHtcbiAgaWYgKCEoYWN0dWFsICE9PSBleHBlY3RlZCkpIHtcbiAgICB0aHJvd0Vycm9yKG1zZywgYWN0dWFsLCBleHBlY3RlZCwgJyE9PScpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRMZXNzVGhhbjxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBpZiAoIShhY3R1YWwgPCBleHBlY3RlZCkpIHtcbiAgICB0aHJvd0Vycm9yKG1zZywgYWN0dWFsLCBleHBlY3RlZCwgJzwnKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TGVzc1RoYW5PckVxdWFsPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKTogYXNzZXJ0cyBhY3R1YWwgaXMgVCB7XG4gIGlmICghKGFjdHVhbCA8PSBleHBlY3RlZCkpIHtcbiAgICB0aHJvd0Vycm9yKG1zZywgYWN0dWFsLCBleHBlY3RlZCwgJzw9Jyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEdyZWF0ZXJUaGFuPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZzogc3RyaW5nKTogYXNzZXJ0cyBhY3R1YWwgaXMgVCB7XG4gIGlmICghKGFjdHVhbCA+IGV4cGVjdGVkKSkge1xuICAgIHRocm93RXJyb3IobXNnLCBhY3R1YWwsIGV4cGVjdGVkLCAnPicpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWw8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZzogc3RyaW5nLFxuKTogYXNzZXJ0cyBhY3R1YWwgaXMgVCB7XG4gIGlmICghKGFjdHVhbCA+PSBleHBlY3RlZCkpIHtcbiAgICB0aHJvd0Vycm9yKG1zZywgYWN0dWFsLCBleHBlY3RlZCwgJz49Jyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdERlZmluZWQ8VD4oYWN0dWFsOiBULCBtc2c6IHN0cmluZykge1xuICBpZiAoYWN0dWFsICE9IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKG1zZywgYWN0dWFsLCBudWxsLCAnPT0nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RGVmaW5lZDxUPihhY3R1YWw6IFQgfCBudWxsIHwgdW5kZWZpbmVkLCBtc2c6IHN0cmluZyk6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBpZiAoYWN0dWFsID09IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKG1zZywgYWN0dWFsLCBudWxsLCAnIT0nKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dFcnJvcihtc2c6IHN0cmluZyk6IG5ldmVyO1xuZXhwb3J0IGZ1bmN0aW9uIHRocm93RXJyb3IobXNnOiBzdHJpbmcsIGFjdHVhbDogYW55LCBleHBlY3RlZDogYW55LCBjb21wYXJpc29uOiBzdHJpbmcpOiBuZXZlcjtcbmV4cG9ydCBmdW5jdGlvbiB0aHJvd0Vycm9yKG1zZzogc3RyaW5nLCBhY3R1YWw/OiBhbnksIGV4cGVjdGVkPzogYW55LCBjb21wYXJpc29uPzogc3RyaW5nKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYEFTU0VSVElPTiBFUlJPUjogJHttc2d9YCArXG4gICAgICAoY29tcGFyaXNvbiA9PSBudWxsID8gJycgOiBgIFtFeHBlY3RlZD0+ICR7ZXhwZWN0ZWR9ICR7Y29tcGFyaXNvbn0gJHthY3R1YWx9IDw9QWN0dWFsXWApLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RG9tTm9kZShub2RlOiBhbnkpOiBhc3NlcnRzIG5vZGUgaXMgTm9kZSB7XG4gIGlmICghKG5vZGUgaW5zdGFuY2VvZiBOb2RlKSkge1xuICAgIHRocm93RXJyb3IoYFRoZSBwcm92aWRlZCB2YWx1ZSBtdXN0IGJlIGFuIGluc3RhbmNlIG9mIGEgRE9NIE5vZGUgYnV0IGdvdCAke3N0cmluZ2lmeShub2RlKX1gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RWxlbWVudChub2RlOiBhbnkpOiBhc3NlcnRzIG5vZGUgaXMgRWxlbWVudCB7XG4gIGlmICghKG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSkge1xuICAgIHRocm93RXJyb3IoYFRoZSBwcm92aWRlZCB2YWx1ZSBtdXN0IGJlIGFuIGVsZW1lbnQgYnV0IGdvdCAke3N0cmluZ2lmeShub2RlKX1gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0SW5kZXhJblJhbmdlKGFycjogYW55W10sIGluZGV4OiBudW1iZXIpIHtcbiAgYXNzZXJ0RGVmaW5lZChhcnIsICdBcnJheSBtdXN0IGJlIGRlZmluZWQuJyk7XG4gIGNvbnN0IG1heExlbiA9IGFyci5sZW5ndGg7XG4gIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gbWF4TGVuKSB7XG4gICAgdGhyb3dFcnJvcihgSW5kZXggZXhwZWN0ZWQgdG8gYmUgbGVzcyB0aGFuICR7bWF4TGVufSBidXQgZ290ICR7aW5kZXh9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE9uZU9mKHZhbHVlOiBhbnksIC4uLnZhbGlkVmFsdWVzOiBhbnlbXSkge1xuICBpZiAodmFsaWRWYWx1ZXMuaW5kZXhPZih2YWx1ZSkgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbiAgdGhyb3dFcnJvcihcbiAgICBgRXhwZWN0ZWQgdmFsdWUgdG8gYmUgb25lIG9mICR7SlNPTi5zdHJpbmdpZnkodmFsaWRWYWx1ZXMpfSBidXQgd2FzICR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfS5gLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90UmVhY3RpdmUoZm46IHN0cmluZyk6IHZvaWQge1xuICBpZiAoZ2V0QWN0aXZlQ29uc3VtZXIoKSAhPT0gbnVsbCkge1xuICAgIHRocm93RXJyb3IoYCR7Zm59KCkgc2hvdWxkIG5ldmVyIGJlIGNhbGxlZCBpbiBhIHJlYWN0aXZlIGNvbnRleHQuYCk7XG4gIH1cbn1cbiJdfQ==