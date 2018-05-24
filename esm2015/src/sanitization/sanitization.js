/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getCurrentSanitizer } from '../render3/instructions';
import { stringify } from '../render3/util';
import { _sanitizeHtml as _sanitizeHtml } from './html_sanitizer';
import { SecurityContext } from './security';
import { _sanitizeStyle as _sanitizeStyle } from './style_sanitizer';
import { _sanitizeUrl as _sanitizeUrl } from './url_sanitizer';
const /** @type {?} */ BRAND = '__SANITIZER_TRUSTED_BRAND__';
/**
 * A branded trusted string used with sanitization.
 *
 * See: {\@link TrustedHtmlString}, {\@link TrustedResourceUrlString}, {\@link TrustedScriptString},
 * {\@link TrustedStyleString}, {\@link TrustedUrlString}
 * @record
 */
export function TrustedString() { }
function TrustedString_tsickle_Closure_declarations() {
    /** @type {?} */
    TrustedString.prototype.__SANITIZER_TRUSTED_BRAND__;
}
/**
 * A branded trusted string used with sanitization of `html` strings.
 *
 * See: {\@link bypassSanitizationTrustHtml} and {\@link htmlSanitizer}.
 * @record
 */
export function TrustedHtmlString() { }
function TrustedHtmlString_tsickle_Closure_declarations() {
    /** @type {?} */
    TrustedHtmlString.prototype.__SANITIZER_TRUSTED_BRAND__;
}
/**
 * A branded trusted string used with sanitization of `style` strings.
 *
 * See: {\@link bypassSanitizationTrustStyle} and {\@link styleSanitizer}.
 * @record
 */
export function TrustedStyleString() { }
function TrustedStyleString_tsickle_Closure_declarations() {
    /** @type {?} */
    TrustedStyleString.prototype.__SANITIZER_TRUSTED_BRAND__;
}
/**
 * A branded trusted string used with sanitization of `url` strings.
 *
 * See: {\@link bypassSanitizationTrustScript} and {\@link scriptSanitizer}.
 * @record
 */
export function TrustedScriptString() { }
function TrustedScriptString_tsickle_Closure_declarations() {
    /** @type {?} */
    TrustedScriptString.prototype.__SANITIZER_TRUSTED_BRAND__;
}
/**
 * A branded trusted string used with sanitization of `url` strings.
 *
 * See: {\@link bypassSanitizationTrustUrl} and {\@link urlSanitizer}.
 * @record
 */
export function TrustedUrlString() { }
function TrustedUrlString_tsickle_Closure_declarations() {
    /** @type {?} */
    TrustedUrlString.prototype.__SANITIZER_TRUSTED_BRAND__;
}
/**
 * A branded trusted string used with sanitization of `resourceUrl` strings.
 *
 * See: {\@link bypassSanitizationTrustResourceUrl} and {\@link resourceUrlSanitizer}.
 * @record
 */
export function TrustedResourceUrlString() { }
function TrustedResourceUrlString_tsickle_Closure_declarations() {
    /** @type {?} */
    TrustedResourceUrlString.prototype.__SANITIZER_TRUSTED_BRAND__;
}
/**
 * An `html` sanitizer which converts untrusted `html` **string** into trusted string by removing
 * dangerous content.
 *
 * This method parses the `html` and locates potentially dangerous content (such as urls and
 * javascript) and removes it.
 *
 * It is possible to mark a string as trusted by calling {\@link bypassSanitizationTrustHtml}.
 *
 * @param {?} unsafeHtml untrusted `html`, typically from the user.
 * @return {?} `html` string which is safe to display to user, because all of the dangerous javascript
 * and urls have been removed.
 */
export function sanitizeHtml(unsafeHtml) {
    const /** @type {?} */ s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.HTML, unsafeHtml) || '';
    }
    if (unsafeHtml instanceof String && (/** @type {?} */ (unsafeHtml))[BRAND] === 'Html') {
        return unsafeHtml.toString();
    }
    return _sanitizeHtml(document, stringify(unsafeHtml));
}
/**
 * A `style` sanitizer which converts untrusted `style` **string** into trusted string by removing
 * dangerous content.
 *
 * This method parses the `style` and locates potentially dangerous content (such as urls and
 * javascript) and removes it.
 *
 * It is possible to mark a string as trusted by calling {\@link bypassSanitizationTrustStyle}.
 *
 * @param {?} unsafeStyle untrusted `style`, typically from the user.
 * @return {?} `style` string which is safe to bind to the `style` properties, because all of the
 * dangerous javascript and urls have been removed.
 */
export function sanitizeStyle(unsafeStyle) {
    const /** @type {?} */ s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.STYLE, unsafeStyle) || '';
    }
    if (unsafeStyle instanceof String && (/** @type {?} */ (unsafeStyle))[BRAND] === 'Style') {
        return unsafeStyle.toString();
    }
    return _sanitizeStyle(stringify(unsafeStyle));
}
/**
 * A `url` sanitizer which converts untrusted `url` **string** into trusted string by removing
 * dangerous
 * content.
 *
 * This method parses the `url` and locates potentially dangerous content (such as javascript) and
 * removes it.
 *
 * It is possible to mark a string as trusted by calling {\@link bypassSanitizationTrustUrl}.
 *
 * @param {?} unsafeUrl untrusted `url`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * all of the dangerous javascript has been removed.
 */
export function sanitizeUrl(unsafeUrl) {
    const /** @type {?} */ s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.URL, unsafeUrl) || '';
    }
    if (unsafeUrl instanceof String && (/** @type {?} */ (unsafeUrl))[BRAND] === 'Url') {
        return unsafeUrl.toString();
    }
    return _sanitizeUrl(stringify(unsafeUrl));
}
/**
 * A `url` sanitizer which only lets trusted `url`s through.
 *
 * This passes only `url`s marked trusted by calling {\@link bypassSanitizationTrustResourceUrl}.
 *
 * @param {?} unsafeResourceUrl untrusted `url`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * only trusted `url`s have been allowed to pass.
 */
export function sanitizeResourceUrl(unsafeResourceUrl) {
    const /** @type {?} */ s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.RESOURCE_URL, unsafeResourceUrl) || '';
    }
    if (unsafeResourceUrl instanceof String &&
        (/** @type {?} */ (unsafeResourceUrl))[BRAND] === 'ResourceUrl') {
        return unsafeResourceUrl.toString();
    }
    throw new Error('unsafe value used in a resource URL context (see http://g.co/ng/security#xss)');
}
/**
 * A `script` sanitizer which only lets trusted javascript through.
 *
 * This passes only `script`s marked trusted by calling {\@link bypassSanitizationTrustScript}.
 *
 * @param {?} unsafeScript untrusted `script`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `<script>` element such as `<img src>`,
 * because only trusted `scripts`s have been allowed to pass.
 */
export function sanitizeScript(unsafeScript) {
    const /** @type {?} */ s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.SCRIPT, unsafeScript) || '';
    }
    if (unsafeScript instanceof String && (/** @type {?} */ (unsafeScript))[BRAND] === 'Script') {
        return unsafeScript.toString();
    }
    throw new Error('unsafe value used in a script context');
}
/**
 * Mark `html` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link htmlSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedHtml `html` string which needs to be implicitly trusted.
 * @return {?} a `html` `String` which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustHtml(trustedHtml) {
    return bypassSanitizationTrustString(trustedHtml, 'Html');
}
/**
 * Mark `style` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link styleSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedStyle `style` string which needs to be implicitly trusted.
 * @return {?} a `style` `String` which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustStyle(trustedStyle) {
    return bypassSanitizationTrustString(trustedStyle, 'Style');
}
/**
 * Mark `script` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link scriptSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedScript `script` string which needs to be implicitly trusted.
 * @return {?} a `script` `String` which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustScript(trustedScript) {
    return bypassSanitizationTrustString(trustedScript, 'Script');
}
/**
 * Mark `url` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link urlSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedUrl `url` string which needs to be implicitly trusted.
 * @return {?} a `url` `String` which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustUrl(trustedUrl) {
    return bypassSanitizationTrustString(trustedUrl, 'Url');
}
/**
 * Mark `url` string as trusted.
 *
 * This function wraps the trusted string in `String` and brands it in a way which makes it
 * recognizable to {\@link resourceUrlSanitizer} to be trusted implicitly.
 *
 * @param {?} trustedResourceUrl `url` string which needs to be implicitly trusted.
 * @return {?} a `url` `String` which has been branded to be implicitly trusted.
 */
export function bypassSanitizationTrustResourceUrl(trustedResourceUrl) {
    return bypassSanitizationTrustString(trustedResourceUrl, 'ResourceUrl');
}
/**
 * @param {?} trustedString
 * @param {?} mode
 * @return {?}
 */
function bypassSanitizationTrustString(trustedString, mode) {
    const /** @type {?} */ trusted = /** @type {?} */ (new String(trustedString));
    trusted[BRAND] = mode;
    return trusted;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzVELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUUxQyxPQUFPLEVBQUMsYUFBYSxJQUFJLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDM0MsT0FBTyxFQUFDLGNBQWMsSUFBSSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuRSxPQUFPLEVBQUMsWUFBWSxJQUFJLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTdELHVCQUFNLEtBQUssR0FBRyw2QkFBNkIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0U1QyxNQUFNLHVCQUF1QixVQUFlO0lBQzFDLHVCQUFNLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxFQUFFO1FBQ0wsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQzNEO0lBQ0QsSUFBSSxVQUFVLFlBQVksTUFBTSxJQUFJLG1CQUFDLFVBQStCLEVBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxNQUFNLEVBQUU7UUFDdkYsT0FBTyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDOUI7SUFDRCxPQUFPLGFBQWEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLFVBQVUs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QU8sNkJBQTZCLENBQUMsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLENBQUM7Q0FDekU7Ozs7OztBQVNELHVDQUNJLGFBQXFCLEVBQ3JCLElBQXlEO0lBQzNELHVCQUFNLE9BQU8scUJBQUcsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFrQixDQUFBLENBQUM7SUFDM0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQztJQUN0QixPQUFPLE9BQU8sQ0FBQztDQUNoQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRDdXJyZW50U2FuaXRpemVyfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsJztcblxuaW1wb3J0IHtfc2FuaXRpemVIdG1sIGFzIF9zYW5pdGl6ZUh0bWx9IGZyb20gJy4vaHRtbF9zYW5pdGl6ZXInO1xuaW1wb3J0IHtTZWN1cml0eUNvbnRleHR9IGZyb20gJy4vc2VjdXJpdHknO1xuaW1wb3J0IHtfc2FuaXRpemVTdHlsZSBhcyBfc2FuaXRpemVTdHlsZX0gZnJvbSAnLi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwgYXMgX3Nhbml0aXplVXJsfSBmcm9tICcuL3VybF9zYW5pdGl6ZXInO1xuXG5jb25zdCBCUkFORCA9ICdfX1NBTklUSVpFUl9UUlVTVEVEX0JSQU5EX18nO1xuXG4vKipcbiAqIEEgYnJhbmRlZCB0cnVzdGVkIHN0cmluZyB1c2VkIHdpdGggc2FuaXRpemF0aW9uLlxuICpcbiAqIFNlZToge0BsaW5rIFRydXN0ZWRIdG1sU3RyaW5nfSwge0BsaW5rIFRydXN0ZWRSZXNvdXJjZVVybFN0cmluZ30sIHtAbGluayBUcnVzdGVkU2NyaXB0U3RyaW5nfSxcbiAqIHtAbGluayBUcnVzdGVkU3R5bGVTdHJpbmd9LCB7QGxpbmsgVHJ1c3RlZFVybFN0cmluZ31cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcnVzdGVkU3RyaW5nIGV4dGVuZHMgU3RyaW5nIHtcbiAgJ19fU0FOSVRJWkVSX1RSVVNURURfQlJBTkRfXyc6ICdIdG1sJ3wnU3R5bGUnfCdTY3JpcHQnfCdVcmwnfCdSZXNvdXJjZVVybCc7XG59XG5cbi8qKlxuICogQSBicmFuZGVkIHRydXN0ZWQgc3RyaW5nIHVzZWQgd2l0aCBzYW5pdGl6YXRpb24gb2YgYGh0bWxgIHN0cmluZ3MuXG4gKlxuICogU2VlOiB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RIdG1sfSBhbmQge0BsaW5rIGh0bWxTYW5pdGl6ZXJ9LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRydXN0ZWRIdG1sU3RyaW5nIGV4dGVuZHMgVHJ1c3RlZFN0cmluZyB7ICdfX1NBTklUSVpFUl9UUlVTVEVEX0JSQU5EX18nOiAnSHRtbCc7IH1cblxuLyoqXG4gKiBBIGJyYW5kZWQgdHJ1c3RlZCBzdHJpbmcgdXNlZCB3aXRoIHNhbml0aXphdGlvbiBvZiBgc3R5bGVgIHN0cmluZ3MuXG4gKlxuICogU2VlOiB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHlsZX0gYW5kIHtAbGluayBzdHlsZVNhbml0aXplcn0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHJ1c3RlZFN0eWxlU3RyaW5nIGV4dGVuZHMgVHJ1c3RlZFN0cmluZyB7XG4gICdfX1NBTklUSVpFUl9UUlVTVEVEX0JSQU5EX18nOiAnU3R5bGUnO1xufVxuXG4vKipcbiAqIEEgYnJhbmRlZCB0cnVzdGVkIHN0cmluZyB1c2VkIHdpdGggc2FuaXRpemF0aW9uIG9mIGB1cmxgIHN0cmluZ3MuXG4gKlxuICogU2VlOiB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTY3JpcHR9IGFuZCB7QGxpbmsgc2NyaXB0U2FuaXRpemVyfS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcnVzdGVkU2NyaXB0U3RyaW5nIGV4dGVuZHMgVHJ1c3RlZFN0cmluZyB7XG4gICdfX1NBTklUSVpFUl9UUlVTVEVEX0JSQU5EX18nOiAnU2NyaXB0Jztcbn1cblxuLyoqXG4gKiBBIGJyYW5kZWQgdHJ1c3RlZCBzdHJpbmcgdXNlZCB3aXRoIHNhbml0aXphdGlvbiBvZiBgdXJsYCBzdHJpbmdzLlxuICpcbiAqIFNlZToge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0VXJsfSBhbmQge0BsaW5rIHVybFNhbml0aXplcn0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHJ1c3RlZFVybFN0cmluZyBleHRlbmRzIFRydXN0ZWRTdHJpbmcgeyAnX19TQU5JVElaRVJfVFJVU1RFRF9CUkFORF9fJzogJ1VybCc7IH1cblxuLyoqXG4gKiBBIGJyYW5kZWQgdHJ1c3RlZCBzdHJpbmcgdXNlZCB3aXRoIHNhbml0aXphdGlvbiBvZiBgcmVzb3VyY2VVcmxgIHN0cmluZ3MuXG4gKlxuICogU2VlOiB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RSZXNvdXJjZVVybH0gYW5kIHtAbGluayByZXNvdXJjZVVybFNhbml0aXplcn0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHJ1c3RlZFJlc291cmNlVXJsU3RyaW5nIGV4dGVuZHMgVHJ1c3RlZFN0cmluZyB7XG4gICdfX1NBTklUSVpFUl9UUlVTVEVEX0JSQU5EX18nOiAnUmVzb3VyY2VVcmwnO1xufVxuXG4vKipcbiAqIEFuIGBodG1sYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGBodG1sYCAqKnN0cmluZyoqIGludG8gdHJ1c3RlZCBzdHJpbmcgYnkgcmVtb3ZpbmdcbiAqIGRhbmdlcm91cyBjb250ZW50LlxuICpcbiAqIFRoaXMgbWV0aG9kIHBhcnNlcyB0aGUgYGh0bWxgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIHVybHMgYW5kXG4gKiBqYXZhc2NyaXB0KSBhbmQgcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RIdG1sfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlSHRtbCB1bnRydXN0ZWQgYGh0bWxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGBodG1sYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBkaXNwbGF5IHRvIHVzZXIsIGJlY2F1c2UgYWxsIG9mIHRoZSBkYW5nZXJvdXMgamF2YXNjcmlwdFxuICogYW5kIHVybHMgaGF2ZSBiZWVuIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZUh0bWwodW5zYWZlSHRtbDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IGdldEN1cnJlbnRTYW5pdGl6ZXIoKTtcbiAgaWYgKHMpIHtcbiAgICByZXR1cm4gcy5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdW5zYWZlSHRtbCkgfHwgJyc7XG4gIH1cbiAgaWYgKHVuc2FmZUh0bWwgaW5zdGFuY2VvZiBTdHJpbmcgJiYgKHVuc2FmZUh0bWwgYXMgVHJ1c3RlZEh0bWxTdHJpbmcpW0JSQU5EXSA9PT0gJ0h0bWwnKSB7XG4gICAgcmV0dXJuIHVuc2FmZUh0bWwudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gX3Nhbml0aXplSHRtbChkb2N1bWVudCwgc3RyaW5naWZ5KHVuc2FmZUh0bWwpKTtcbn1cblxuLyoqXG4gKiBBIGBzdHlsZWAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgc3R5bGVgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgc3R5bGVgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIHVybHMgYW5kXG4gKiBqYXZhc2NyaXB0KSBhbmQgcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHlsZX0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVN0eWxlIHVudHJ1c3RlZCBgc3R5bGVgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGBzdHlsZWAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHN0eWxlYCBwcm9wZXJ0aWVzLCBiZWNhdXNlIGFsbCBvZiB0aGVcbiAqIGRhbmdlcm91cyBqYXZhc2NyaXB0IGFuZCB1cmxzIGhhdmUgYmVlbiByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVTdHlsZSh1bnNhZmVTdHlsZTogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IGdldEN1cnJlbnRTYW5pdGl6ZXIoKTtcbiAgaWYgKHMpIHtcbiAgICByZXR1cm4gcy5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuU1RZTEUsIHVuc2FmZVN0eWxlKSB8fCAnJztcbiAgfVxuICBpZiAodW5zYWZlU3R5bGUgaW5zdGFuY2VvZiBTdHJpbmcgJiYgKHVuc2FmZVN0eWxlIGFzIFRydXN0ZWRTdHlsZVN0cmluZylbQlJBTkRdID09PSAnU3R5bGUnKSB7XG4gICAgcmV0dXJuIHVuc2FmZVN0eWxlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZVN0eWxlKHN0cmluZ2lmeSh1bnNhZmVTdHlsZSkpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgdXJsYCAqKnN0cmluZyoqIGludG8gdHJ1c3RlZCBzdHJpbmcgYnkgcmVtb3ZpbmdcbiAqIGRhbmdlcm91c1xuICogY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGB1cmxgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIGphdmFzY3JpcHQpIGFuZFxuICogcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVVcmwgdW50cnVzdGVkIGB1cmxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGBzcmNgIHByb3BlcnRpZXMgc3VjaCBhcyBgPGltZyBzcmM+YCwgYmVjYXVzZVxuICogYWxsIG9mIHRoZSBkYW5nZXJvdXMgamF2YXNjcmlwdCBoYXMgYmVlbiByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVVcmwodW5zYWZlVXJsOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzID0gZ2V0Q3VycmVudFNhbml0aXplcigpO1xuICBpZiAocykge1xuICAgIHJldHVybiBzLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5VUkwsIHVuc2FmZVVybCkgfHwgJyc7XG4gIH1cbiAgaWYgKHVuc2FmZVVybCBpbnN0YW5jZW9mIFN0cmluZyAmJiAodW5zYWZlVXJsIGFzIFRydXN0ZWRVcmxTdHJpbmcpW0JSQU5EXSA9PT0gJ1VybCcpIHtcbiAgICByZXR1cm4gdW5zYWZlVXJsLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZVVybChzdHJpbmdpZnkodW5zYWZlVXJsKSk7XG59XG5cbi8qKlxuICogQSBgdXJsYCBzYW5pdGl6ZXIgd2hpY2ggb25seSBsZXRzIHRydXN0ZWQgYHVybGBzIHRocm91Z2guXG4gKlxuICogVGhpcyBwYXNzZXMgb25seSBgdXJsYHMgbWFya2VkIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RSZXNvdXJjZVVybH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVJlc291cmNlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3JjYCBwcm9wZXJ0aWVzIHN1Y2ggYXMgYDxpbWcgc3JjPmAsIGJlY2F1c2VcbiAqIG9ubHkgdHJ1c3RlZCBgdXJsYHMgaGF2ZSBiZWVuIGFsbG93ZWQgdG8gcGFzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplUmVzb3VyY2VVcmwodW5zYWZlUmVzb3VyY2VVcmw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBnZXRDdXJyZW50U2FuaXRpemVyKCk7XG4gIGlmIChzKSB7XG4gICAgcmV0dXJuIHMuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlJFU09VUkNFX1VSTCwgdW5zYWZlUmVzb3VyY2VVcmwpIHx8ICcnO1xuICB9XG4gIGlmICh1bnNhZmVSZXNvdXJjZVVybCBpbnN0YW5jZW9mIFN0cmluZyAmJlxuICAgICAgKHVuc2FmZVJlc291cmNlVXJsIGFzIFRydXN0ZWRSZXNvdXJjZVVybFN0cmluZylbQlJBTkRdID09PSAnUmVzb3VyY2VVcmwnKSB7XG4gICAgcmV0dXJuIHVuc2FmZVJlc291cmNlVXJsLnRvU3RyaW5nKCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnNhZmUgdmFsdWUgdXNlZCBpbiBhIHJlc291cmNlIFVSTCBjb250ZXh0IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKScpO1xufVxuXG4vKipcbiAqIEEgYHNjcmlwdGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGphdmFzY3JpcHQgdGhyb3VnaC5cbiAqXG4gKiBUaGlzIHBhc3NlcyBvbmx5IGBzY3JpcHRgcyBtYXJrZWQgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFNjcmlwdH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVNjcmlwdCB1bnRydXN0ZWQgYHNjcmlwdGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYDxzY3JpcHQ+YCBlbGVtZW50IHN1Y2ggYXMgYDxpbWcgc3JjPmAsXG4gKiBiZWNhdXNlIG9ubHkgdHJ1c3RlZCBgc2NyaXB0c2BzIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVNjcmlwdCh1bnNhZmVTY3JpcHQ6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBnZXRDdXJyZW50U2FuaXRpemVyKCk7XG4gIGlmIChzKSB7XG4gICAgcmV0dXJuIHMuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlNDUklQVCwgdW5zYWZlU2NyaXB0KSB8fCAnJztcbiAgfVxuICBpZiAodW5zYWZlU2NyaXB0IGluc3RhbmNlb2YgU3RyaW5nICYmICh1bnNhZmVTY3JpcHQgYXMgVHJ1c3RlZFNjcmlwdFN0cmluZylbQlJBTkRdID09PSAnU2NyaXB0Jykge1xuICAgIHJldHVybiB1bnNhZmVTY3JpcHQudG9TdHJpbmcoKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2FmZSB2YWx1ZSB1c2VkIGluIGEgc2NyaXB0IGNvbnRleHQnKTtcbn1cblxuLyoqXG4gKiBNYXJrIGBodG1sYCBzdHJpbmcgYXMgdHJ1c3RlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdyYXBzIHRoZSB0cnVzdGVkIHN0cmluZyBpbiBgU3RyaW5nYCBhbmQgYnJhbmRzIGl0IGluIGEgd2F5IHdoaWNoIG1ha2VzIGl0XG4gKiByZWNvZ25pemFibGUgdG8ge0BsaW5rIGh0bWxTYW5pdGl6ZXJ9IHRvIGJlIHRydXN0ZWQgaW1wbGljaXRseS5cbiAqXG4gKiBAcGFyYW0gdHJ1c3RlZEh0bWwgYGh0bWxgIHN0cmluZyB3aGljaCBuZWVkcyB0byBiZSBpbXBsaWNpdGx5IHRydXN0ZWQuXG4gKiBAcmV0dXJucyBhIGBodG1sYCBgU3RyaW5nYCB3aGljaCBoYXMgYmVlbiBicmFuZGVkIHRvIGJlIGltcGxpY2l0bHkgdHJ1c3RlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0SHRtbCh0cnVzdGVkSHRtbDogc3RyaW5nKTogVHJ1c3RlZEh0bWxTdHJpbmcge1xuICByZXR1cm4gYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHJpbmcodHJ1c3RlZEh0bWwsICdIdG1sJyk7XG59XG4vKipcbiAqIE1hcmsgYHN0eWxlYCBzdHJpbmcgYXMgdHJ1c3RlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdyYXBzIHRoZSB0cnVzdGVkIHN0cmluZyBpbiBgU3RyaW5nYCBhbmQgYnJhbmRzIGl0IGluIGEgd2F5IHdoaWNoIG1ha2VzIGl0XG4gKiByZWNvZ25pemFibGUgdG8ge0BsaW5rIHN0eWxlU2FuaXRpemVyfSB0byBiZSB0cnVzdGVkIGltcGxpY2l0bHkuXG4gKlxuICogQHBhcmFtIHRydXN0ZWRTdHlsZSBgc3R5bGVgIHN0cmluZyB3aGljaCBuZWVkcyB0byBiZSBpbXBsaWNpdGx5IHRydXN0ZWQuXG4gKiBAcmV0dXJucyBhIGBzdHlsZWAgYFN0cmluZ2Agd2hpY2ggaGFzIGJlZW4gYnJhbmRlZCB0byBiZSBpbXBsaWNpdGx5IHRydXN0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0eWxlKHRydXN0ZWRTdHlsZTogc3RyaW5nKTogVHJ1c3RlZFN0eWxlU3RyaW5nIHtcbiAgcmV0dXJuIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U3RyaW5nKHRydXN0ZWRTdHlsZSwgJ1N0eWxlJyk7XG59XG4vKipcbiAqIE1hcmsgYHNjcmlwdGAgc3RyaW5nIGFzIHRydXN0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3cmFwcyB0aGUgdHJ1c3RlZCBzdHJpbmcgaW4gYFN0cmluZ2AgYW5kIGJyYW5kcyBpdCBpbiBhIHdheSB3aGljaCBtYWtlcyBpdFxuICogcmVjb2duaXphYmxlIHRvIHtAbGluayBzY3JpcHRTYW5pdGl6ZXJ9IHRvIGJlIHRydXN0ZWQgaW1wbGljaXRseS5cbiAqXG4gKiBAcGFyYW0gdHJ1c3RlZFNjcmlwdCBgc2NyaXB0YCBzdHJpbmcgd2hpY2ggbmVlZHMgdG8gYmUgaW1wbGljaXRseSB0cnVzdGVkLlxuICogQHJldHVybnMgYSBgc2NyaXB0YCBgU3RyaW5nYCB3aGljaCBoYXMgYmVlbiBicmFuZGVkIHRvIGJlIGltcGxpY2l0bHkgdHJ1c3RlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U2NyaXB0KHRydXN0ZWRTY3JpcHQ6IHN0cmluZyk6IFRydXN0ZWRTY3JpcHRTdHJpbmcge1xuICByZXR1cm4gYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHJpbmcodHJ1c3RlZFNjcmlwdCwgJ1NjcmlwdCcpO1xufVxuLyoqXG4gKiBNYXJrIGB1cmxgIHN0cmluZyBhcyB0cnVzdGVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd3JhcHMgdGhlIHRydXN0ZWQgc3RyaW5nIGluIGBTdHJpbmdgIGFuZCBicmFuZHMgaXQgaW4gYSB3YXkgd2hpY2ggbWFrZXMgaXRcbiAqIHJlY29nbml6YWJsZSB0byB7QGxpbmsgdXJsU2FuaXRpemVyfSB0byBiZSB0cnVzdGVkIGltcGxpY2l0bHkuXG4gKlxuICogQHBhcmFtIHRydXN0ZWRVcmwgYHVybGAgc3RyaW5nIHdoaWNoIG5lZWRzIHRvIGJlIGltcGxpY2l0bHkgdHJ1c3RlZC5cbiAqIEByZXR1cm5zIGEgYHVybGAgYFN0cmluZ2Agd2hpY2ggaGFzIGJlZW4gYnJhbmRlZCB0byBiZSBpbXBsaWNpdGx5IHRydXN0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFVybCh0cnVzdGVkVXJsOiBzdHJpbmcpOiBUcnVzdGVkVXJsU3RyaW5nIHtcbiAgcmV0dXJuIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U3RyaW5nKHRydXN0ZWRVcmwsICdVcmwnKTtcbn1cbi8qKlxuICogTWFyayBgdXJsYCBzdHJpbmcgYXMgdHJ1c3RlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdyYXBzIHRoZSB0cnVzdGVkIHN0cmluZyBpbiBgU3RyaW5nYCBhbmQgYnJhbmRzIGl0IGluIGEgd2F5IHdoaWNoIG1ha2VzIGl0XG4gKiByZWNvZ25pemFibGUgdG8ge0BsaW5rIHJlc291cmNlVXJsU2FuaXRpemVyfSB0byBiZSB0cnVzdGVkIGltcGxpY2l0bHkuXG4gKlxuICogQHBhcmFtIHRydXN0ZWRSZXNvdXJjZVVybCBgdXJsYCBzdHJpbmcgd2hpY2ggbmVlZHMgdG8gYmUgaW1wbGljaXRseSB0cnVzdGVkLlxuICogQHJldHVybnMgYSBgdXJsYCBgU3RyaW5nYCB3aGljaCBoYXMgYmVlbiBicmFuZGVkIHRvIGJlIGltcGxpY2l0bHkgdHJ1c3RlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0UmVzb3VyY2VVcmwodHJ1c3RlZFJlc291cmNlVXJsOiBzdHJpbmcpOlxuICAgIFRydXN0ZWRSZXNvdXJjZVVybFN0cmluZyB7XG4gIHJldHVybiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0cmluZyh0cnVzdGVkUmVzb3VyY2VVcmwsICdSZXNvdXJjZVVybCcpO1xufVxuXG5cbmZ1bmN0aW9uIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U3RyaW5nKHRydXN0ZWRTdHJpbmc6IHN0cmluZywgbW9kZTogJ0h0bWwnKTogVHJ1c3RlZEh0bWxTdHJpbmc7XG5mdW5jdGlvbiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0cmluZyh0cnVzdGVkU3RyaW5nOiBzdHJpbmcsIG1vZGU6ICdTdHlsZScpOiBUcnVzdGVkU3R5bGVTdHJpbmc7XG5mdW5jdGlvbiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0cmluZyh0cnVzdGVkU3RyaW5nOiBzdHJpbmcsIG1vZGU6ICdTY3JpcHQnKTogVHJ1c3RlZFNjcmlwdFN0cmluZztcbmZ1bmN0aW9uIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U3RyaW5nKHRydXN0ZWRTdHJpbmc6IHN0cmluZywgbW9kZTogJ1VybCcpOiBUcnVzdGVkVXJsU3RyaW5nO1xuZnVuY3Rpb24gYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHJpbmcoXG4gICAgdHJ1c3RlZFN0cmluZzogc3RyaW5nLCBtb2RlOiAnUmVzb3VyY2VVcmwnKTogVHJ1c3RlZFJlc291cmNlVXJsU3RyaW5nO1xuZnVuY3Rpb24gYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHJpbmcoXG4gICAgdHJ1c3RlZFN0cmluZzogc3RyaW5nLFxuICAgIG1vZGU6ICdIdG1sJyB8ICdTdHlsZScgfCAnU2NyaXB0JyB8ICdVcmwnIHwgJ1Jlc291cmNlVXJsJyk6IFRydXN0ZWRTdHJpbmcge1xuICBjb25zdCB0cnVzdGVkID0gbmV3IFN0cmluZyh0cnVzdGVkU3RyaW5nKSBhcyBUcnVzdGVkU3RyaW5nO1xuICB0cnVzdGVkW0JSQU5EXSA9IG1vZGU7XG4gIHJldHVybiB0cnVzdGVkO1xufVxuIl19