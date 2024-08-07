/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Property } from './property';
/**
 * Map from jsaction annotation to a parsed map from event name to action name.
 */
const parseCache = {};
/**
 * Reads the jsaction parser cache from the given DOM Element.
 */
export function get(element) {
    return element[Property.JSACTION];
}
/**
 * Reads the jsaction parser cache for the given DOM element. If no cache is yet present,
 * creates an empty one.
 */
export function getDefaulted(element) {
    const cache = get(element) ?? {};
    set(element, cache);
    return cache;
}
/**
 * Writes the jsaction parser cache to the given DOM Element.
 */
export function set(element, actionMap) {
    element[Property.JSACTION] = actionMap;
}
/**
 * Looks up the parsed action map from the source jsaction attribute value.
 *
 * @param text Unparsed jsaction attribute value.
 * @return Parsed jsaction attribute value, if already present in the cache.
 */
export function getParsed(text) {
    return parseCache[text];
}
/**
 * Inserts the parse result for the given source jsaction value into the cache.
 *
 * @param text Unparsed jsaction attribute value.
 * @param parsed Attribute value parsed into the action map.
 */
export function setParsed(text, parsed) {
    parseCache[text] = parsed;
}
/**
 * Clears the jsaction parser cache from the given DOM Element.
 *
 * @param element .
 */
export function clear(element) {
    if (Property.JSACTION in element) {
        delete element[Property.JSACTION];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gvc3JjL2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFcEM7O0dBRUc7QUFDSCxNQUFNLFVBQVUsR0FBeUQsRUFBRSxDQUFDO0FBRTVFOztHQUVHO0FBQ0gsTUFBTSxVQUFVLEdBQUcsQ0FBQyxPQUFnQjtJQUNsQyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsT0FBZ0I7SUFDM0MsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNqQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLEdBQUcsQ0FBQyxPQUFnQixFQUFFLFNBQThDO0lBQ2xGLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBQ3pDLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxTQUFTLENBQUMsSUFBWTtJQUNwQyxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsU0FBUyxDQUFDLElBQVksRUFBRSxNQUEyQztJQUNqRixVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQzVCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLEtBQUssQ0FBQyxPQUFnQjtJQUNwQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLElBQUksT0FBTyxFQUFFLENBQUM7UUFDakMsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UHJvcGVydHl9IGZyb20gJy4vcHJvcGVydHknO1xuXG4vKipcbiAqIE1hcCBmcm9tIGpzYWN0aW9uIGFubm90YXRpb24gdG8gYSBwYXJzZWQgbWFwIGZyb20gZXZlbnQgbmFtZSB0byBhY3Rpb24gbmFtZS5cbiAqL1xuY29uc3QgcGFyc2VDYWNoZToge1trZXk6IHN0cmluZ106IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCB1bmRlZmluZWR9fSA9IHt9O1xuXG4vKipcbiAqIFJlYWRzIHRoZSBqc2FjdGlvbiBwYXJzZXIgY2FjaGUgZnJvbSB0aGUgZ2l2ZW4gRE9NIEVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXQoZWxlbWVudDogRWxlbWVudCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCB1bmRlZmluZWR9IHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIGVsZW1lbnRbUHJvcGVydHkuSlNBQ1RJT05dO1xufVxuXG4vKipcbiAqIFJlYWRzIHRoZSBqc2FjdGlvbiBwYXJzZXIgY2FjaGUgZm9yIHRoZSBnaXZlbiBET00gZWxlbWVudC4gSWYgbm8gY2FjaGUgaXMgeWV0IHByZXNlbnQsXG4gKiBjcmVhdGVzIGFuIGVtcHR5IG9uZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRlZChlbGVtZW50OiBFbGVtZW50KToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IHVuZGVmaW5lZH0ge1xuICBjb25zdCBjYWNoZSA9IGdldChlbGVtZW50KSA/PyB7fTtcbiAgc2V0KGVsZW1lbnQsIGNhY2hlKTtcbiAgcmV0dXJuIGNhY2hlO1xufVxuXG4vKipcbiAqIFdyaXRlcyB0aGUganNhY3Rpb24gcGFyc2VyIGNhY2hlIHRvIHRoZSBnaXZlbiBET00gRWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldChlbGVtZW50OiBFbGVtZW50LCBhY3Rpb25NYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCB1bmRlZmluZWR9KSB7XG4gIGVsZW1lbnRbUHJvcGVydHkuSlNBQ1RJT05dID0gYWN0aW9uTWFwO1xufVxuXG4vKipcbiAqIExvb2tzIHVwIHRoZSBwYXJzZWQgYWN0aW9uIG1hcCBmcm9tIHRoZSBzb3VyY2UganNhY3Rpb24gYXR0cmlidXRlIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0ZXh0IFVucGFyc2VkIGpzYWN0aW9uIGF0dHJpYnV0ZSB2YWx1ZS5cbiAqIEByZXR1cm4gUGFyc2VkIGpzYWN0aW9uIGF0dHJpYnV0ZSB2YWx1ZSwgaWYgYWxyZWFkeSBwcmVzZW50IGluIHRoZSBjYWNoZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcnNlZCh0ZXh0OiBzdHJpbmcpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgdW5kZWZpbmVkfSB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBwYXJzZUNhY2hlW3RleHRdO1xufVxuXG4vKipcbiAqIEluc2VydHMgdGhlIHBhcnNlIHJlc3VsdCBmb3IgdGhlIGdpdmVuIHNvdXJjZSBqc2FjdGlvbiB2YWx1ZSBpbnRvIHRoZSBjYWNoZS5cbiAqXG4gKiBAcGFyYW0gdGV4dCBVbnBhcnNlZCBqc2FjdGlvbiBhdHRyaWJ1dGUgdmFsdWUuXG4gKiBAcGFyYW0gcGFyc2VkIEF0dHJpYnV0ZSB2YWx1ZSBwYXJzZWQgaW50byB0aGUgYWN0aW9uIG1hcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFBhcnNlZCh0ZXh0OiBzdHJpbmcsIHBhcnNlZDoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IHVuZGVmaW5lZH0pIHtcbiAgcGFyc2VDYWNoZVt0ZXh0XSA9IHBhcnNlZDtcbn1cblxuLyoqXG4gKiBDbGVhcnMgdGhlIGpzYWN0aW9uIHBhcnNlciBjYWNoZSBmcm9tIHRoZSBnaXZlbiBET00gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhcihlbGVtZW50OiBFbGVtZW50KSB7XG4gIGlmIChQcm9wZXJ0eS5KU0FDVElPTiBpbiBlbGVtZW50KSB7XG4gICAgZGVsZXRlIGVsZW1lbnRbUHJvcGVydHkuSlNBQ1RJT05dO1xuICB9XG59XG4iXX0=