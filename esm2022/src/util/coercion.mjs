/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Transforms a value (typically a string) to a boolean.
 * Intended to be used as a transform function of an input.
 *
 *  @usageNotes
 *   @Input({ transform: booleanAttribute }) status!: boolean;
 *
 * @param value Value to be transformed.
 *
 * @publicApi
 */
export function booleanAttribute(value) {
    return typeof value === 'boolean' ? value : (value != null && value !== 'false');
}
/**
 * Transforms a value (typically a string) to a number.
 * Intended to be used as a transform function of an input.
 * @param value Value to be transformed.
 * @param fallbackValue Value to use if the provided value can't be parsed as a number.
 *
 *  @usageNotes
 *  @Input({ transform: numberAttribute }) id!: number;
 *
 * @publicApi
 */
export function numberAttribute(value, fallbackValue = NaN) {
    // parseFloat(value) handles most of the cases we're interested in (it treats null, empty string,
    // and other non-number values as NaN, where Number just uses 0) but it considers the string
    // '123hello' to be a valid number. Therefore we also check if Number(value) is NaN.
    const isNumberValue = !isNaN(parseFloat(value)) && !isNaN(Number(value));
    return isNumberValue ? Number(value) : fallbackValue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29lcmNpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy91dGlsL2NvZXJjaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBYztJQUM3QyxPQUFPLE9BQU8sS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxLQUFLLE9BQU8sQ0FBQyxDQUFDO0FBQ25GLENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFjLEVBQUUsYUFBYSxHQUFHLEdBQUc7SUFDakUsaUdBQWlHO0lBQ2pHLDRGQUE0RjtJQUM1RixvRkFBb0Y7SUFDcEYsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDaEYsT0FBTyxhQUFhLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0FBQ3ZELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIGEgdmFsdWUgKHR5cGljYWxseSBhIHN0cmluZykgdG8gYSBib29sZWFuLlxuICogSW50ZW5kZWQgdG8gYmUgdXNlZCBhcyBhIHRyYW5zZm9ybSBmdW5jdGlvbiBvZiBhbiBpbnB1dC5cbiAqXG4gKiAgQHVzYWdlTm90ZXNcbiAqICAgQElucHV0KHsgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlIH0pIHN0YXR1cyE6IGJvb2xlYW47XG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGJlIHRyYW5zZm9ybWVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJvb2xlYW5BdHRyaWJ1dGUodmFsdWU6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nID8gdmFsdWUgOiAodmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSAhPT0gJ2ZhbHNlJyk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIHZhbHVlICh0eXBpY2FsbHkgYSBzdHJpbmcpIHRvIGEgbnVtYmVyLlxuICogSW50ZW5kZWQgdG8gYmUgdXNlZCBhcyBhIHRyYW5zZm9ybSBmdW5jdGlvbiBvZiBhbiBpbnB1dC5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBiZSB0cmFuc2Zvcm1lZC5cbiAqIEBwYXJhbSBmYWxsYmFja1ZhbHVlIFZhbHVlIHRvIHVzZSBpZiB0aGUgcHJvdmlkZWQgdmFsdWUgY2FuJ3QgYmUgcGFyc2VkIGFzIGEgbnVtYmVyLlxuICpcbiAqICBAdXNhZ2VOb3Rlc1xuICogIEBJbnB1dCh7IHRyYW5zZm9ybTogbnVtYmVyQXR0cmlidXRlIH0pIGlkITogbnVtYmVyO1xuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG51bWJlckF0dHJpYnV0ZSh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2tWYWx1ZSA9IE5hTik6IG51bWJlciB7XG4gIC8vIHBhcnNlRmxvYXQodmFsdWUpIGhhbmRsZXMgbW9zdCBvZiB0aGUgY2FzZXMgd2UncmUgaW50ZXJlc3RlZCBpbiAoaXQgdHJlYXRzIG51bGwsIGVtcHR5IHN0cmluZyxcbiAgLy8gYW5kIG90aGVyIG5vbi1udW1iZXIgdmFsdWVzIGFzIE5hTiwgd2hlcmUgTnVtYmVyIGp1c3QgdXNlcyAwKSBidXQgaXQgY29uc2lkZXJzIHRoZSBzdHJpbmdcbiAgLy8gJzEyM2hlbGxvJyB0byBiZSBhIHZhbGlkIG51bWJlci4gVGhlcmVmb3JlIHdlIGFsc28gY2hlY2sgaWYgTnVtYmVyKHZhbHVlKSBpcyBOYU4uXG4gIGNvbnN0IGlzTnVtYmVyVmFsdWUgPSAhaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSBhcyBhbnkpKSAmJiAhaXNOYU4oTnVtYmVyKHZhbHVlKSk7XG4gIHJldHVybiBpc051bWJlclZhbHVlID8gTnVtYmVyKHZhbHVlKSA6IGZhbGxiYWNrVmFsdWU7XG59XG4iXX0=