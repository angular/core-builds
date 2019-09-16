/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @enum {string} */
const BypassType = {
    Url: 'URL',
    Html: 'HTML',
    ResourceUrl: 'ResourceURL',
    Script: 'Script',
    Style: 'Style',
};
export { BypassType };
/**
 * Marker interface for a value that's safe to use in a particular context.
 *
 * \@publicApi
 * @record
 */
export function SafeValue() { }
/**
 * Marker interface for a value that's safe to use as HTML.
 *
 * \@publicApi
 * @record
 */
export function SafeHtml() { }
/**
 * Marker interface for a value that's safe to use as style (CSS).
 *
 * \@publicApi
 * @record
 */
export function SafeStyle() { }
/**
 * Marker interface for a value that's safe to use as JavaScript.
 *
 * \@publicApi
 * @record
 */
export function SafeScript() { }
/**
 * Marker interface for a value that's safe to use as a URL linking to a document.
 *
 * \@publicApi
 * @record
 */
export function SafeUrl() { }
/**
 * Marker interface for a value that's safe to use as a URL to load executable code from.
 *
 * \@publicApi
 * @record
 */
export function SafeResourceUrl() { }
/**
 * @abstract
 */
class SafeValueImpl {
    /**
     * @param {?} changingThisBreaksApplicationSecurity
     */
    constructor(changingThisBreaksApplicationSecurity) {
        this.changingThisBreaksApplicationSecurity = changingThisBreaksApplicationSecurity;
    }
    /**
     * @return {?}
     */
    toString() {
        return `SafeValue must use [property]=binding: ${this.changingThisBreaksApplicationSecurity}` +
            ` (see http://g.co/ng/security#xss)`;
    }
}
if (false) {
    /** @type {?} */
    SafeValueImpl.prototype.changingThisBreaksApplicationSecurity;
    /**
     * @abstract
     * @return {?}
     */
    SafeValueImpl.prototype.getTypeName = function () { };
}
class SafeHtmlImpl extends SafeValueImpl {
    /**
     * @return {?}
     */
    getTypeName() { return "HTML" /* Html */; }
}
class SafeStyleImpl extends SafeValueImpl {
    /**
     * @return {?}
     */
    getTypeName() { return "Style" /* Style */; }
}
class SafeScriptImpl extends SafeValueImpl {
    /**
     * @return {?}
     */
    getTypeName() { return "Script" /* Script */; }
}
class SafeUrlImpl extends SafeValueImpl {
    /**
     * @return {?}
     */
    getTypeName() { return "URL" /* Url */; }
}
class SafeResourceUrlImpl extends SafeValueImpl {
    /**
     * @return {?}
     */
    getTypeName() { return "ResourceURL" /* ResourceUrl */; }
}
/**
 * @param {?} value
 * @return {?}
 */
export function unwrapSafeValue(value) {
    return value instanceof SafeValueImpl ?
        ((/** @type {?} */ (value))).changingThisBreaksApplicationSecurity :
        ((/** @type {?} */ (value)));
}
/**
 * @param {?} value
 * @param {?} type
 * @return {?}
 */
export function allowSanitizationBypassAndThrow(value, type) {
    /** @type {?} */
    const actualType = getSanitizationBypassType(value);
    if (actualType != null && actualType !== type) {
        // Allow ResourceURLs in URL contexts, they are strictly more trusted.
        if (actualType === "ResourceURL" /* ResourceUrl */ && type === "URL" /* Url */)
            return true;
        throw new Error(`Required a safe ${type}, got a ${actualType} (see http://g.co/ng/security#xss)`);
    }
    return actualType === type;
}
/**
 * @param {?} value
 * @return {?}
 */
export function getSanitizationBypassType(value) {
    return value instanceof SafeValueImpl && (/** @type {?} */ (((/** @type {?} */ (value))).getTypeName())) ||
        null;
}
/**
 * Mark `html` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link htmlSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedHtml `html` string which needs to be implicitly trusted.
 * @return {?} a `html` which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustHtml(trustedHtml) {
    return new SafeHtmlImpl(trustedHtml);
}
/**
 * Mark `style` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link styleSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedStyle `style` string which needs to be implicitly trusted.
 * @return {?} a `style` hich has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustStyle(trustedStyle) {
    return new SafeStyleImpl(trustedStyle);
}
/**
 * Mark `script` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link scriptSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedScript `script` string which needs to be implicitly trusted.
 * @return {?} a `script` which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustScript(trustedScript) {
    return new SafeScriptImpl(trustedScript);
}
/**
 * Mark `url` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link urlSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedUrl `url` string which needs to be implicitly trusted.
 * @return {?} a `url`  which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustUrl(trustedUrl) {
    return new SafeUrlImpl(trustedUrl);
}
/**
 * Mark `url` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link resourceUrlSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedResourceUrl `url` string which needs to be implicitly trusted.
 * @return {?} a `url` which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustResourceUrl(trustedResourceUrl) {
    return new SafeResourceUrlImpl(trustedResourceUrl);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnlwYXNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL2J5cGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBWUUsS0FBTSxLQUFLO0lBQ1gsTUFBTyxNQUFNO0lBQ2IsYUFBYyxhQUFhO0lBQzNCLFFBQVMsUUFBUTtJQUNqQixPQUFRLE9BQU87Ozs7Ozs7OztBQVFqQiwrQkFBNkI7Ozs7Ozs7QUFPN0IsOEJBQThDOzs7Ozs7O0FBTzlDLCtCQUErQzs7Ozs7OztBQU8vQyxnQ0FBZ0Q7Ozs7Ozs7QUFPaEQsNkJBQTZDOzs7Ozs7O0FBTzdDLHFDQUFxRDs7OztBQUdyRCxNQUFlLGFBQWE7Ozs7SUFDMUIsWUFBbUIscUNBQTZDO1FBQTdDLDBDQUFxQyxHQUFyQyxxQ0FBcUMsQ0FBUTtJQUFHLENBQUM7Ozs7SUFJcEUsUUFBUTtRQUNOLE9BQU8sMENBQTBDLElBQUksQ0FBQyxxQ0FBcUMsRUFBRTtZQUN6RixvQ0FBb0MsQ0FBQztJQUMzQyxDQUFDO0NBQ0Y7OztJQVJhLDhEQUFvRDs7Ozs7SUFFaEUsc0RBQStCOztBQVFqQyxNQUFNLFlBQWEsU0FBUSxhQUFhOzs7O0lBQ3RDLFdBQVcsS0FBSyx5QkFBdUIsQ0FBQyxDQUFDO0NBQzFDO0FBQ0QsTUFBTSxhQUFjLFNBQVEsYUFBYTs7OztJQUN2QyxXQUFXLEtBQUssMkJBQXdCLENBQUMsQ0FBQztDQUMzQztBQUNELE1BQU0sY0FBZSxTQUFRLGFBQWE7Ozs7SUFDeEMsV0FBVyxLQUFLLDZCQUF5QixDQUFDLENBQUM7Q0FDNUM7QUFDRCxNQUFNLFdBQVksU0FBUSxhQUFhOzs7O0lBQ3JDLFdBQVcsS0FBSyx1QkFBc0IsQ0FBQyxDQUFDO0NBQ3pDO0FBQ0QsTUFBTSxtQkFBb0IsU0FBUSxhQUFhOzs7O0lBQzdDLFdBQVcsS0FBSyx1Q0FBOEIsQ0FBQyxDQUFDO0NBQ2pEOzs7OztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBeUI7SUFDdkQsT0FBTyxLQUFLLFlBQVksYUFBYSxDQUFDLENBQUM7UUFDbkMsQ0FBQyxtQkFBQSxLQUFLLEVBQWlCLENBQUMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQ2hFLENBQUMsbUJBQUEsS0FBSyxFQUFVLENBQUMsQ0FBQztBQUN4QixDQUFDOzs7Ozs7QUFhRCxNQUFNLFVBQVUsK0JBQStCLENBQUMsS0FBVSxFQUFFLElBQWdCOztVQUNwRSxVQUFVLEdBQUcseUJBQXlCLENBQUMsS0FBSyxDQUFDO0lBQ25ELElBQUksVUFBVSxJQUFJLElBQUksSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1FBQzdDLHNFQUFzRTtRQUN0RSxJQUFJLFVBQVUsb0NBQTJCLElBQUksSUFBSSxvQkFBbUI7WUFBRSxPQUFPLElBQUksQ0FBQztRQUNsRixNQUFNLElBQUksS0FBSyxDQUNYLG1CQUFtQixJQUFJLFdBQVcsVUFBVSxvQ0FBb0MsQ0FBQyxDQUFDO0tBQ3ZGO0lBQ0QsT0FBTyxVQUFVLEtBQUssSUFBSSxDQUFDO0FBQzdCLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLEtBQVU7SUFDbEQsT0FBTyxLQUFLLFlBQVksYUFBYSxJQUFJLG1CQUFBLENBQUMsbUJBQUEsS0FBSyxFQUFpQixDQUFDLENBQUMsV0FBVyxFQUFFLEVBQWM7UUFDekYsSUFBSSxDQUFDO0FBQ1gsQ0FBQzs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxXQUFtQjtJQUM3RCxPQUFPLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsNEJBQTRCLENBQUMsWUFBb0I7SUFDL0QsT0FBTyxJQUFJLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN6QyxDQUFDOzs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLDZCQUE2QixDQUFDLGFBQXFCO0lBQ2pFLE9BQU8sSUFBSSxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDM0MsQ0FBQzs7Ozs7Ozs7OztBQVVELE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxVQUFrQjtJQUMzRCxPQUFPLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsa0NBQWtDLENBQUMsa0JBQTBCO0lBQzNFLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3JELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuXG5leHBvcnQgY29uc3QgZW51bSBCeXBhc3NUeXBlIHtcbiAgVXJsID0gJ1VSTCcsXG4gIEh0bWwgPSAnSFRNTCcsXG4gIFJlc291cmNlVXJsID0gJ1Jlc291cmNlVVJMJyxcbiAgU2NyaXB0ID0gJ1NjcmlwdCcsXG4gIFN0eWxlID0gJ1N0eWxlJyxcbn1cblxuLyoqXG4gKiBNYXJrZXIgaW50ZXJmYWNlIGZvciBhIHZhbHVlIHRoYXQncyBzYWZlIHRvIHVzZSBpbiBhIHBhcnRpY3VsYXIgY29udGV4dC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2FmZVZhbHVlIHt9XG5cbi8qKlxuICogTWFya2VyIGludGVyZmFjZSBmb3IgYSB2YWx1ZSB0aGF0J3Mgc2FmZSB0byB1c2UgYXMgSFRNTC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2FmZUh0bWwgZXh0ZW5kcyBTYWZlVmFsdWUge31cblxuLyoqXG4gKiBNYXJrZXIgaW50ZXJmYWNlIGZvciBhIHZhbHVlIHRoYXQncyBzYWZlIHRvIHVzZSBhcyBzdHlsZSAoQ1NTKS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2FmZVN0eWxlIGV4dGVuZHMgU2FmZVZhbHVlIHt9XG5cbi8qKlxuICogTWFya2VyIGludGVyZmFjZSBmb3IgYSB2YWx1ZSB0aGF0J3Mgc2FmZSB0byB1c2UgYXMgSmF2YVNjcmlwdC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2FmZVNjcmlwdCBleHRlbmRzIFNhZmVWYWx1ZSB7fVxuXG4vKipcbiAqIE1hcmtlciBpbnRlcmZhY2UgZm9yIGEgdmFsdWUgdGhhdCdzIHNhZmUgdG8gdXNlIGFzIGEgVVJMIGxpbmtpbmcgdG8gYSBkb2N1bWVudC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2FmZVVybCBleHRlbmRzIFNhZmVWYWx1ZSB7fVxuXG4vKipcbiAqIE1hcmtlciBpbnRlcmZhY2UgZm9yIGEgdmFsdWUgdGhhdCdzIHNhZmUgdG8gdXNlIGFzIGEgVVJMIHRvIGxvYWQgZXhlY3V0YWJsZSBjb2RlIGZyb20uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNhZmVSZXNvdXJjZVVybCBleHRlbmRzIFNhZmVWYWx1ZSB7fVxuXG5cbmFic3RyYWN0IGNsYXNzIFNhZmVWYWx1ZUltcGwgaW1wbGVtZW50cyBTYWZlVmFsdWUge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgY2hhbmdpbmdUaGlzQnJlYWtzQXBwbGljYXRpb25TZWN1cml0eTogc3RyaW5nKSB7fVxuXG4gIGFic3RyYWN0IGdldFR5cGVOYW1lKCk6IHN0cmluZztcblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gYFNhZmVWYWx1ZSBtdXN0IHVzZSBbcHJvcGVydHldPWJpbmRpbmc6ICR7dGhpcy5jaGFuZ2luZ1RoaXNCcmVha3NBcHBsaWNhdGlvblNlY3VyaXR5fWAgK1xuICAgICAgICBgIChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKWA7XG4gIH1cbn1cblxuY2xhc3MgU2FmZUh0bWxJbXBsIGV4dGVuZHMgU2FmZVZhbHVlSW1wbCBpbXBsZW1lbnRzIFNhZmVIdG1sIHtcbiAgZ2V0VHlwZU5hbWUoKSB7IHJldHVybiBCeXBhc3NUeXBlLkh0bWw7IH1cbn1cbmNsYXNzIFNhZmVTdHlsZUltcGwgZXh0ZW5kcyBTYWZlVmFsdWVJbXBsIGltcGxlbWVudHMgU2FmZVN0eWxlIHtcbiAgZ2V0VHlwZU5hbWUoKSB7IHJldHVybiBCeXBhc3NUeXBlLlN0eWxlOyB9XG59XG5jbGFzcyBTYWZlU2NyaXB0SW1wbCBleHRlbmRzIFNhZmVWYWx1ZUltcGwgaW1wbGVtZW50cyBTYWZlU2NyaXB0IHtcbiAgZ2V0VHlwZU5hbWUoKSB7IHJldHVybiBCeXBhc3NUeXBlLlNjcmlwdDsgfVxufVxuY2xhc3MgU2FmZVVybEltcGwgZXh0ZW5kcyBTYWZlVmFsdWVJbXBsIGltcGxlbWVudHMgU2FmZVVybCB7XG4gIGdldFR5cGVOYW1lKCkgeyByZXR1cm4gQnlwYXNzVHlwZS5Vcmw7IH1cbn1cbmNsYXNzIFNhZmVSZXNvdXJjZVVybEltcGwgZXh0ZW5kcyBTYWZlVmFsdWVJbXBsIGltcGxlbWVudHMgU2FmZVJlc291cmNlVXJsIHtcbiAgZ2V0VHlwZU5hbWUoKSB7IHJldHVybiBCeXBhc3NUeXBlLlJlc291cmNlVXJsOyB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBTYWZlVmFsdWUodmFsdWU6IHN0cmluZyB8IFNhZmVWYWx1ZSk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFNhZmVWYWx1ZUltcGwgP1xuICAgICAgKHZhbHVlIGFzIFNhZmVWYWx1ZUltcGwpLmNoYW5naW5nVGhpc0JyZWFrc0FwcGxpY2F0aW9uU2VjdXJpdHkgOlxuICAgICAgKHZhbHVlIGFzIHN0cmluZyk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3coXG4gICAgdmFsdWU6IGFueSwgdHlwZTogQnlwYXNzVHlwZS5IdG1sKTogdmFsdWUgaXMgU2FmZUh0bWw7XG5leHBvcnQgZnVuY3Rpb24gYWxsb3dTYW5pdGl6YXRpb25CeXBhc3NBbmRUaHJvdyhcbiAgICB2YWx1ZTogYW55LCB0eXBlOiBCeXBhc3NUeXBlLlJlc291cmNlVXJsKTogdmFsdWUgaXMgU2FmZVJlc291cmNlVXJsO1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3coXG4gICAgdmFsdWU6IGFueSwgdHlwZTogQnlwYXNzVHlwZS5TY3JpcHQpOiB2YWx1ZSBpcyBTYWZlU2NyaXB0O1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3coXG4gICAgdmFsdWU6IGFueSwgdHlwZTogQnlwYXNzVHlwZS5TdHlsZSk6IHZhbHVlIGlzIFNhZmVTdHlsZTtcbmV4cG9ydCBmdW5jdGlvbiBhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc0FuZFRocm93KHZhbHVlOiBhbnksIHR5cGU6IEJ5cGFzc1R5cGUuVXJsKTogdmFsdWUgaXMgU2FmZVVybDtcbmV4cG9ydCBmdW5jdGlvbiBhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc0FuZFRocm93KHZhbHVlOiBhbnksIHR5cGU6IEJ5cGFzc1R5cGUpOiBib29sZWFuO1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codmFsdWU6IGFueSwgdHlwZTogQnlwYXNzVHlwZSk6IGJvb2xlYW4ge1xuICBjb25zdCBhY3R1YWxUeXBlID0gZ2V0U2FuaXRpemF0aW9uQnlwYXNzVHlwZSh2YWx1ZSk7XG4gIGlmIChhY3R1YWxUeXBlICE9IG51bGwgJiYgYWN0dWFsVHlwZSAhPT0gdHlwZSkge1xuICAgIC8vIEFsbG93IFJlc291cmNlVVJMcyBpbiBVUkwgY29udGV4dHMsIHRoZXkgYXJlIHN0cmljdGx5IG1vcmUgdHJ1c3RlZC5cbiAgICBpZiAoYWN0dWFsVHlwZSA9PT0gQnlwYXNzVHlwZS5SZXNvdXJjZVVybCAmJiB0eXBlID09PSBCeXBhc3NUeXBlLlVybCkgcmV0dXJuIHRydWU7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgUmVxdWlyZWQgYSBzYWZlICR7dHlwZX0sIGdvdCBhICR7YWN0dWFsVHlwZX0gKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpYCk7XG4gIH1cbiAgcmV0dXJuIGFjdHVhbFR5cGUgPT09IHR5cGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTYW5pdGl6YXRpb25CeXBhc3NUeXBlKHZhbHVlOiBhbnkpOiBCeXBhc3NUeXBlfG51bGwge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBTYWZlVmFsdWVJbXBsICYmICh2YWx1ZSBhcyBTYWZlVmFsdWVJbXBsKS5nZXRUeXBlTmFtZSgpIGFzIEJ5cGFzc1R5cGUgfHxcbiAgICAgIG51bGw7XG59XG5cbi8qKlxuICogTWFyayBgaHRtbGAgc3RyaW5nIGFzIHRydXN0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3cmFwcyB0aGUgdHJ1c3RlZCBzdHJpbmcgaW4gYFN0cmluZ2AgYW5kIGJyYW5kcyBpdCBpbiBhIHdheSB3aGljaCBtYWtlcyBpdFxuICogcmVjb2duaXphYmxlIHRvIHtAbGluayBodG1sU2FuaXRpemVyfSB0byBiZSB0cnVzdGVkIGltcGxpY2l0bHkuXG4gKlxuICogQHBhcmFtIHRydXN0ZWRIdG1sIGBodG1sYCBzdHJpbmcgd2hpY2ggbmVlZHMgdG8gYmUgaW1wbGljaXRseSB0cnVzdGVkLlxuICogQHJldHVybnMgYSBgaHRtbGAgd2hpY2ggaGFzIGJlZW4gYnJhbmRlZCB0byBiZSBpbXBsaWNpdGx5IHRydXN0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdEh0bWwodHJ1c3RlZEh0bWw6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgcmV0dXJuIG5ldyBTYWZlSHRtbEltcGwodHJ1c3RlZEh0bWwpO1xufVxuLyoqXG4gKiBNYXJrIGBzdHlsZWAgc3RyaW5nIGFzIHRydXN0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3cmFwcyB0aGUgdHJ1c3RlZCBzdHJpbmcgaW4gYFN0cmluZ2AgYW5kIGJyYW5kcyBpdCBpbiBhIHdheSB3aGljaCBtYWtlcyBpdFxuICogcmVjb2duaXphYmxlIHRvIHtAbGluayBzdHlsZVNhbml0aXplcn0gdG8gYmUgdHJ1c3RlZCBpbXBsaWNpdGx5LlxuICpcbiAqIEBwYXJhbSB0cnVzdGVkU3R5bGUgYHN0eWxlYCBzdHJpbmcgd2hpY2ggbmVlZHMgdG8gYmUgaW1wbGljaXRseSB0cnVzdGVkLlxuICogQHJldHVybnMgYSBgc3R5bGVgIGhpY2ggaGFzIGJlZW4gYnJhbmRlZCB0byBiZSBpbXBsaWNpdGx5IHRydXN0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0eWxlKHRydXN0ZWRTdHlsZTogc3RyaW5nKTogU2FmZVN0eWxlIHtcbiAgcmV0dXJuIG5ldyBTYWZlU3R5bGVJbXBsKHRydXN0ZWRTdHlsZSk7XG59XG4vKipcbiAqIE1hcmsgYHNjcmlwdGAgc3RyaW5nIGFzIHRydXN0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3cmFwcyB0aGUgdHJ1c3RlZCBzdHJpbmcgaW4gYFN0cmluZ2AgYW5kIGJyYW5kcyBpdCBpbiBhIHdheSB3aGljaCBtYWtlcyBpdFxuICogcmVjb2duaXphYmxlIHRvIHtAbGluayBzY3JpcHRTYW5pdGl6ZXJ9IHRvIGJlIHRydXN0ZWQgaW1wbGljaXRseS5cbiAqXG4gKiBAcGFyYW0gdHJ1c3RlZFNjcmlwdCBgc2NyaXB0YCBzdHJpbmcgd2hpY2ggbmVlZHMgdG8gYmUgaW1wbGljaXRseSB0cnVzdGVkLlxuICogQHJldHVybnMgYSBgc2NyaXB0YCB3aGljaCBoYXMgYmVlbiBicmFuZGVkIHRvIGJlIGltcGxpY2l0bHkgdHJ1c3RlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U2NyaXB0KHRydXN0ZWRTY3JpcHQ6IHN0cmluZyk6IFNhZmVTY3JpcHQge1xuICByZXR1cm4gbmV3IFNhZmVTY3JpcHRJbXBsKHRydXN0ZWRTY3JpcHQpO1xufVxuLyoqXG4gKiBNYXJrIGB1cmxgIHN0cmluZyBhcyB0cnVzdGVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd3JhcHMgdGhlIHRydXN0ZWQgc3RyaW5nIGluIGBTdHJpbmdgIGFuZCBicmFuZHMgaXQgaW4gYSB3YXkgd2hpY2ggbWFrZXMgaXRcbiAqIHJlY29nbml6YWJsZSB0byB7QGxpbmsgdXJsU2FuaXRpemVyfSB0byBiZSB0cnVzdGVkIGltcGxpY2l0bHkuXG4gKlxuICogQHBhcmFtIHRydXN0ZWRVcmwgYHVybGAgc3RyaW5nIHdoaWNoIG5lZWRzIHRvIGJlIGltcGxpY2l0bHkgdHJ1c3RlZC5cbiAqIEByZXR1cm5zIGEgYHVybGAgIHdoaWNoIGhhcyBiZWVuIGJyYW5kZWQgdG8gYmUgaW1wbGljaXRseSB0cnVzdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RVcmwodHJ1c3RlZFVybDogc3RyaW5nKTogU2FmZVVybCB7XG4gIHJldHVybiBuZXcgU2FmZVVybEltcGwodHJ1c3RlZFVybCk7XG59XG4vKipcbiAqIE1hcmsgYHVybGAgc3RyaW5nIGFzIHRydXN0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3cmFwcyB0aGUgdHJ1c3RlZCBzdHJpbmcgaW4gYFN0cmluZ2AgYW5kIGJyYW5kcyBpdCBpbiBhIHdheSB3aGljaCBtYWtlcyBpdFxuICogcmVjb2duaXphYmxlIHRvIHtAbGluayByZXNvdXJjZVVybFNhbml0aXplcn0gdG8gYmUgdHJ1c3RlZCBpbXBsaWNpdGx5LlxuICpcbiAqIEBwYXJhbSB0cnVzdGVkUmVzb3VyY2VVcmwgYHVybGAgc3RyaW5nIHdoaWNoIG5lZWRzIHRvIGJlIGltcGxpY2l0bHkgdHJ1c3RlZC5cbiAqIEByZXR1cm5zIGEgYHVybGAgd2hpY2ggaGFzIGJlZW4gYnJhbmRlZCB0byBiZSBpbXBsaWNpdGx5IHRydXN0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFJlc291cmNlVXJsKHRydXN0ZWRSZXNvdXJjZVVybDogc3RyaW5nKTogU2FmZVJlc291cmNlVXJsIHtcbiAgcmV0dXJuIG5ldyBTYWZlUmVzb3VyY2VVcmxJbXBsKHRydXN0ZWRSZXNvdXJjZVVybCk7XG59XG4iXX0=