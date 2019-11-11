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
import { SANITIZER } from '../render3/interfaces/view';
import { getLView } from '../render3/state';
import { renderStringify } from '../render3/util/misc_utils';
import { allowSanitizationBypassAndThrow, unwrapSafeValue } from './bypass';
import { _sanitizeHtml as _sanitizeHtml } from './html_sanitizer';
import { SecurityContext } from './security';
import { _sanitizeStyle as _sanitizeStyle } from './style_sanitizer';
import { _sanitizeUrl as _sanitizeUrl } from './url_sanitizer';
/**
 * An `html` sanitizer which converts untrusted `html` **string** into trusted string by removing
 * dangerous content.
 *
 * This method parses the `html` and locates potentially dangerous content (such as urls and
 * javascript) and removes it.
 *
 * It is possible to mark a string as trusted by calling {\@link bypassSanitizationTrustHtml}.
 *
 * \@publicApi
 * @param {?} unsafeHtml untrusted `html`, typically from the user.
 * @return {?} `html` string which is safe to display to user, because all of the dangerous javascript
 * and urls have been removed.
 *
 */
export function ɵɵsanitizeHtml(unsafeHtml) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.HTML, unsafeHtml) || '';
    }
    if (allowSanitizationBypassAndThrow(unsafeHtml, "HTML" /* Html */)) {
        return unwrapSafeValue(unsafeHtml);
    }
    return _sanitizeHtml(document, renderStringify(unsafeHtml));
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
 * \@publicApi
 * @param {?} unsafeStyle untrusted `style`, typically from the user.
 * @return {?} `style` string which is safe to bind to the `style` properties, because all of the
 * dangerous javascript and urls have been removed.
 *
 */
export function ɵɵsanitizeStyle(unsafeStyle) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.STYLE, unsafeStyle) || '';
    }
    if (allowSanitizationBypassAndThrow(unsafeStyle, "Style" /* Style */)) {
        return unwrapSafeValue(unsafeStyle);
    }
    return _sanitizeStyle(renderStringify(unsafeStyle));
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
 * \@publicApi
 * @param {?} unsafeUrl untrusted `url`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * all of the dangerous javascript has been removed.
 *
 */
export function ɵɵsanitizeUrl(unsafeUrl) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.URL, unsafeUrl) || '';
    }
    if (allowSanitizationBypassAndThrow(unsafeUrl, "URL" /* Url */)) {
        return unwrapSafeValue(unsafeUrl);
    }
    return _sanitizeUrl(renderStringify(unsafeUrl));
}
/**
 * A `url` sanitizer which only lets trusted `url`s through.
 *
 * This passes only `url`s marked trusted by calling {\@link bypassSanitizationTrustResourceUrl}.
 *
 * \@publicApi
 * @param {?} unsafeResourceUrl untrusted `url`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * only trusted `url`s have been allowed to pass.
 *
 */
export function ɵɵsanitizeResourceUrl(unsafeResourceUrl) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.RESOURCE_URL, unsafeResourceUrl) || '';
    }
    if (allowSanitizationBypassAndThrow(unsafeResourceUrl, "ResourceURL" /* ResourceUrl */)) {
        return unwrapSafeValue(unsafeResourceUrl);
    }
    throw new Error('unsafe value used in a resource URL context (see http://g.co/ng/security#xss)');
}
/**
 * A `script` sanitizer which only lets trusted javascript through.
 *
 * This passes only `script`s marked trusted by calling {\@link
 * bypassSanitizationTrustScript}.
 *
 * \@publicApi
 * @param {?} unsafeScript untrusted `script`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `<script>` element such as `<img src>`,
 * because only trusted `scripts` have been allowed to pass.
 *
 */
export function ɵɵsanitizeScript(unsafeScript) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.SCRIPT, unsafeScript) || '';
    }
    if (allowSanitizationBypassAndThrow(unsafeScript, "Script" /* Script */)) {
        return unwrapSafeValue(unsafeScript);
    }
    throw new Error('unsafe value used in a script context');
}
/**
 * Detects which sanitizer to use for URL property, based on tag name and prop name.
 *
 * The rules are based on the RESOURCE_URL context config from
 * `packages/compiler/src/schema/dom_security_schema.ts`.
 * If tag and prop names don't match Resource URL schema, use URL sanitizer.
 * @param {?} tag
 * @param {?} prop
 * @return {?}
 */
export function getUrlSanitizer(tag, prop) {
    if ((prop === 'src' && (tag === 'embed' || tag === 'frame' || tag === 'iframe' ||
        tag === 'media' || tag === 'script')) ||
        (prop === 'href' && (tag === 'base' || tag === 'link'))) {
        return ɵɵsanitizeResourceUrl;
    }
    return ɵɵsanitizeUrl;
}
/**
 * Sanitizes URL, selecting sanitizer function based on tag and property names.
 *
 * This function is used in case we can't define security context at compile time, when only prop
 * name is available. This happens when we generate host bindings for Directives/Components. The
 * host element is unknown at compile time, so we defer calculation of specific sanitizer to
 * runtime.
 *
 * \@publicApi
 * @param {?} unsafeUrl untrusted `url`, typically from the user.
 * @param {?} tag target element tag name.
 * @param {?} prop name of the property that contains the value.
 * @return {?} `url` string which is safe to bind.
 *
 */
export function ɵɵsanitizeUrlOrResourceUrl(unsafeUrl, tag, prop) {
    return getUrlSanitizer(tag, prop)(unsafeUrl);
}
/**
 * The default style sanitizer will handle sanitization for style properties by
 * sanitizing any CSS property that can include a `url` value (usually image-based properties)
 *
 * \@publicApi
 * @type {?}
 */
export const ɵɵdefaultStyleSanitizer = ((/** @type {?} */ ((/**
 * @param {?} prop
 * @param {?} value
 * @param {?=} mode
 * @return {?}
 */
function (prop, value, mode) {
    mode = mode || 3 /* ValidateAndSanitize */;
    /** @type {?} */
    let doSanitizeValue = true;
    if (mode & 1 /* ValidateProperty */) {
        doSanitizeValue = prop === 'background-image' || prop === 'background' ||
            prop === 'border-image' || prop === 'filter' || prop === 'list-style' ||
            prop === 'list-style-image' || prop === 'clip-path';
    }
    if (mode & 2 /* SanitizeOnly */) {
        return doSanitizeValue ? ɵɵsanitizeStyle(value) : value;
    }
    else {
        return doSanitizeValue;
    }
}))));
/**
 * @param {?} name
 * @return {?}
 */
export function validateAgainstEventProperties(name) {
    if (name.toLowerCase().startsWith('on')) {
        /** @type {?} */
        const msg = `Binding to event property '${name}' is disallowed for security reasons, ` +
            `please use (${name.slice(2)})=...` +
            `\nIf '${name}' is a directive input, make sure the directive is imported by the` +
            ` current module.`;
        throw new Error(msg);
    }
}
/**
 * @param {?} name
 * @return {?}
 */
export function validateAgainstEventAttributes(name) {
    if (name.toLowerCase().startsWith('on')) {
        /** @type {?} */
        const msg = `Binding to event attribute '${name}' is disallowed for security reasons, ` +
            `please use (${name.slice(2)})=...`;
        throw new Error(msg);
    }
}
/**
 * @return {?}
 */
function getSanitizer() {
    /** @type {?} */
    const lView = getLView();
    return lView && lView[SANITIZER];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRTNELE9BQU8sRUFBYSwrQkFBK0IsRUFBRSxlQUFlLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdEYsT0FBTyxFQUFDLGFBQWEsSUFBSSxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUVoRSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzNDLE9BQU8sRUFBcUMsY0FBYyxJQUFJLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxZQUFZLElBQUksWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQjdELE1BQU0sVUFBVSxjQUFjLENBQUMsVUFBZTs7VUFDdEMsU0FBUyxHQUFHLFlBQVksRUFBRTtJQUNoQyxJQUFJLFNBQVMsRUFBRTtRQUNiLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUNuRTtJQUNELElBQUksK0JBQStCLENBQUMsVUFBVSxvQkFBa0IsRUFBRTtRQUNoRSxPQUFPLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNwQztJQUNELE9BQU8sYUFBYSxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBaUJE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QUMsQ0FBQztLQUN0QjtBQUNILENBQUM7Ozs7QUFFRCxTQUFTLFlBQVk7O1VBQ2IsS0FBSyxHQUFHLFFBQVEsRUFBRTtJQUN4QixPQUFPLEtBQUssSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTQU5JVElaRVJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvc3RhdGUnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcblxuaW1wb3J0IHtCeXBhc3NUeXBlLCBhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc0FuZFRocm93LCB1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4vYnlwYXNzJztcbmltcG9ydCB7X3Nhbml0aXplSHRtbCBhcyBfc2FuaXRpemVIdG1sfSBmcm9tICcuL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuL3Nhbml0aXplcic7XG5pbXBvcnQge1NlY3VyaXR5Q29udGV4dH0gZnJvbSAnLi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgU3R5bGVTYW5pdGl6ZU1vZGUsIF9zYW5pdGl6ZVN0eWxlIGFzIF9zYW5pdGl6ZVN0eWxlfSBmcm9tICcuL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge19zYW5pdGl6ZVVybCBhcyBfc2FuaXRpemVVcmx9IGZyb20gJy4vdXJsX3Nhbml0aXplcic7XG5cblxuXG4vKipcbiAqIEFuIGBodG1sYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGBodG1sYCAqKnN0cmluZyoqIGludG8gdHJ1c3RlZCBzdHJpbmcgYnkgcmVtb3ZpbmdcbiAqIGRhbmdlcm91cyBjb250ZW50LlxuICpcbiAqIFRoaXMgbWV0aG9kIHBhcnNlcyB0aGUgYGh0bWxgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIHVybHMgYW5kXG4gKiBqYXZhc2NyaXB0KSBhbmQgcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RIdG1sfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlSHRtbCB1bnRydXN0ZWQgYGh0bWxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGBodG1sYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBkaXNwbGF5IHRvIHVzZXIsIGJlY2F1c2UgYWxsIG9mIHRoZSBkYW5nZXJvdXMgamF2YXNjcmlwdFxuICogYW5kIHVybHMgaGF2ZSBiZWVuIHJlbW92ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplSHRtbCh1bnNhZmVIdG1sOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTYW5pdGl6ZXIoKTtcbiAgaWYgKHNhbml0aXplcikge1xuICAgIHJldHVybiBzYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LkhUTUwsIHVuc2FmZUh0bWwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc0FuZFRocm93KHVuc2FmZUh0bWwsIEJ5cGFzc1R5cGUuSHRtbCkpIHtcbiAgICByZXR1cm4gdW53cmFwU2FmZVZhbHVlKHVuc2FmZUh0bWwpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVIdG1sKGRvY3VtZW50LCByZW5kZXJTdHJpbmdpZnkodW5zYWZlSHRtbCkpO1xufVxuXG4vKipcbiAqIEEgYHN0eWxlYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGBzdHlsZWAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXMgY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGBzdHlsZWAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgdXJscyBhbmRcbiAqIGphdmFzY3JpcHQpIGFuZCByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0eWxlfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlU3R5bGUgdW50cnVzdGVkIGBzdHlsZWAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHN0eWxlYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3R5bGVgIHByb3BlcnRpZXMsIGJlY2F1c2UgYWxsIG9mIHRoZVxuICogZGFuZ2Vyb3VzIGphdmFzY3JpcHQgYW5kIHVybHMgaGF2ZSBiZWVuIHJlbW92ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplU3R5bGUodW5zYWZlU3R5bGU6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuU1RZTEUsIHVuc2FmZVN0eWxlKSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3NBbmRUaHJvdyh1bnNhZmVTdHlsZSwgQnlwYXNzVHlwZS5TdHlsZSkpIHtcbiAgICByZXR1cm4gdW53cmFwU2FmZVZhbHVlKHVuc2FmZVN0eWxlKTtcbiAgfVxuICByZXR1cm4gX3Nhbml0aXplU3R5bGUocmVuZGVyU3RyaW5naWZ5KHVuc2FmZVN0eWxlKSk7XG59XG5cbi8qKlxuICogQSBgdXJsYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGB1cmxgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzXG4gKiBjb250ZW50LlxuICpcbiAqIFRoaXMgbWV0aG9kIHBhcnNlcyB0aGUgYHVybGAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgamF2YXNjcmlwdCkgYW5kXG4gKiByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFVybH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVVybCB1bnRydXN0ZWQgYHVybGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHNyY2AgcHJvcGVydGllcyBzdWNoIGFzIGA8aW1nIHNyYz5gLCBiZWNhdXNlXG4gKiBhbGwgb2YgdGhlIGRhbmdlcm91cyBqYXZhc2NyaXB0IGhhcyBiZWVuIHJlbW92ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplVXJsKHVuc2FmZVVybDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5VUkwsIHVuc2FmZVVybCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codW5zYWZlVXJsLCBCeXBhc3NUeXBlLlVybCkpIHtcbiAgICByZXR1cm4gdW53cmFwU2FmZVZhbHVlKHVuc2FmZVVybCk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZVVybChyZW5kZXJTdHJpbmdpZnkodW5zYWZlVXJsKSk7XG59XG5cbi8qKlxuICogQSBgdXJsYCBzYW5pdGl6ZXIgd2hpY2ggb25seSBsZXRzIHRydXN0ZWQgYHVybGBzIHRocm91Z2guXG4gKlxuICogVGhpcyBwYXNzZXMgb25seSBgdXJsYHMgbWFya2VkIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RSZXNvdXJjZVVybH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVJlc291cmNlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3JjYCBwcm9wZXJ0aWVzIHN1Y2ggYXMgYDxpbWcgc3JjPmAsIGJlY2F1c2VcbiAqIG9ubHkgdHJ1c3RlZCBgdXJsYHMgaGF2ZSBiZWVuIGFsbG93ZWQgdG8gcGFzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c2FuaXRpemVSZXNvdXJjZVVybCh1bnNhZmVSZXNvdXJjZVVybDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5SRVNPVVJDRV9VUkwsIHVuc2FmZVJlc291cmNlVXJsKSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3NBbmRUaHJvdyh1bnNhZmVSZXNvdXJjZVVybCwgQnlwYXNzVHlwZS5SZXNvdXJjZVVybCkpIHtcbiAgICByZXR1cm4gdW53cmFwU2FmZVZhbHVlKHVuc2FmZVJlc291cmNlVXJsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2FmZSB2YWx1ZSB1c2VkIGluIGEgcmVzb3VyY2UgVVJMIGNvbnRleHQgKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpJyk7XG59XG5cbi8qKlxuICogQSBgc2NyaXB0YCBzYW5pdGl6ZXIgd2hpY2ggb25seSBsZXRzIHRydXN0ZWQgamF2YXNjcmlwdCB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHNjcmlwdGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rXG4gKiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFNjcmlwdH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVNjcmlwdCB1bnRydXN0ZWQgYHNjcmlwdGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYDxzY3JpcHQ+YCBlbGVtZW50IHN1Y2ggYXMgYDxpbWcgc3JjPmAsXG4gKiBiZWNhdXNlIG9ubHkgdHJ1c3RlZCBgc2NyaXB0c2AgaGF2ZSBiZWVuIGFsbG93ZWQgdG8gcGFzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c2FuaXRpemVTY3JpcHQodW5zYWZlU2NyaXB0OiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTYW5pdGl6ZXIoKTtcbiAgaWYgKHNhbml0aXplcikge1xuICAgIHJldHVybiBzYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlNDUklQVCwgdW5zYWZlU2NyaXB0KSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3NBbmRUaHJvdyh1bnNhZmVTY3JpcHQsIEJ5cGFzc1R5cGUuU2NyaXB0KSkge1xuICAgIHJldHVybiB1bndyYXBTYWZlVmFsdWUodW5zYWZlU2NyaXB0KTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2FmZSB2YWx1ZSB1c2VkIGluIGEgc2NyaXB0IGNvbnRleHQnKTtcbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoaWNoIHNhbml0aXplciB0byB1c2UgZm9yIFVSTCBwcm9wZXJ0eSwgYmFzZWQgb24gdGFnIG5hbWUgYW5kIHByb3AgbmFtZS5cbiAqXG4gKiBUaGUgcnVsZXMgYXJlIGJhc2VkIG9uIHRoZSBSRVNPVVJDRV9VUkwgY29udGV4dCBjb25maWcgZnJvbVxuICogYHBhY2thZ2VzL2NvbXBpbGVyL3NyYy9zY2hlbWEvZG9tX3NlY3VyaXR5X3NjaGVtYS50c2AuXG4gKiBJZiB0YWcgYW5kIHByb3AgbmFtZXMgZG9uJ3QgbWF0Y2ggUmVzb3VyY2UgVVJMIHNjaGVtYSwgdXNlIFVSTCBzYW5pdGl6ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRVcmxTYW5pdGl6ZXIodGFnOiBzdHJpbmcsIHByb3A6IHN0cmluZykge1xuICBpZiAoKHByb3AgPT09ICdzcmMnICYmICh0YWcgPT09ICdlbWJlZCcgfHwgdGFnID09PSAnZnJhbWUnIHx8IHRhZyA9PT0gJ2lmcmFtZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnID09PSAnbWVkaWEnIHx8IHRhZyA9PT0gJ3NjcmlwdCcpKSB8fFxuICAgICAgKHByb3AgPT09ICdocmVmJyAmJiAodGFnID09PSAnYmFzZScgfHwgdGFnID09PSAnbGluaycpKSkge1xuICAgIHJldHVybiDJtcm1c2FuaXRpemVSZXNvdXJjZVVybDtcbiAgfVxuICByZXR1cm4gybXJtXNhbml0aXplVXJsO1xufVxuXG4vKipcbiAqIFNhbml0aXplcyBVUkwsIHNlbGVjdGluZyBzYW5pdGl6ZXIgZnVuY3Rpb24gYmFzZWQgb24gdGFnIGFuZCBwcm9wZXJ0eSBuYW1lcy5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgaW4gY2FzZSB3ZSBjYW4ndCBkZWZpbmUgc2VjdXJpdHkgY29udGV4dCBhdCBjb21waWxlIHRpbWUsIHdoZW4gb25seSBwcm9wXG4gKiBuYW1lIGlzIGF2YWlsYWJsZS4gVGhpcyBoYXBwZW5zIHdoZW4gd2UgZ2VuZXJhdGUgaG9zdCBiaW5kaW5ncyBmb3IgRGlyZWN0aXZlcy9Db21wb25lbnRzLiBUaGVcbiAqIGhvc3QgZWxlbWVudCBpcyB1bmtub3duIGF0IGNvbXBpbGUgdGltZSwgc28gd2UgZGVmZXIgY2FsY3VsYXRpb24gb2Ygc3BlY2lmaWMgc2FuaXRpemVyIHRvXG4gKiBydW50aW1lLlxuICpcbiAqIEBwYXJhbSB1bnNhZmVVcmwgdW50cnVzdGVkIGB1cmxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEBwYXJhbSB0YWcgdGFyZ2V0IGVsZW1lbnQgdGFnIG5hbWUuXG4gKiBAcGFyYW0gcHJvcCBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0aGF0IGNvbnRhaW5zIHRoZSB2YWx1ZS5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplVXJsT3JSZXNvdXJjZVVybCh1bnNhZmVVcmw6IGFueSwgdGFnOiBzdHJpbmcsIHByb3A6IHN0cmluZyk6IGFueSB7XG4gIHJldHVybiBnZXRVcmxTYW5pdGl6ZXIodGFnLCBwcm9wKSh1bnNhZmVVcmwpO1xufVxuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHN0eWxlIHNhbml0aXplciB3aWxsIGhhbmRsZSBzYW5pdGl6YXRpb24gZm9yIHN0eWxlIHByb3BlcnRpZXMgYnlcbiAqIHNhbml0aXppbmcgYW55IENTUyBwcm9wZXJ0eSB0aGF0IGNhbiBpbmNsdWRlIGEgYHVybGAgdmFsdWUgKHVzdWFsbHkgaW1hZ2UtYmFzZWQgcHJvcGVydGllcylcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCDJtcm1ZGVmYXVsdFN0eWxlU2FuaXRpemVyID1cbiAgICAoZnVuY3Rpb24ocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bGwsIG1vZGU/OiBTdHlsZVNhbml0aXplTW9kZSk6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsIHtcbiAgICAgIG1vZGUgPSBtb2RlIHx8IFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlQW5kU2FuaXRpemU7XG4gICAgICBsZXQgZG9TYW5pdGl6ZVZhbHVlID0gdHJ1ZTtcbiAgICAgIGlmIChtb2RlICYgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVQcm9wZXJ0eSkge1xuICAgICAgICBkb1Nhbml0aXplVmFsdWUgPSBwcm9wID09PSAnYmFja2dyb3VuZC1pbWFnZScgfHwgcHJvcCA9PT0gJ2JhY2tncm91bmQnIHx8XG4gICAgICAgICAgICBwcm9wID09PSAnYm9yZGVyLWltYWdlJyB8fCBwcm9wID09PSAnZmlsdGVyJyB8fCBwcm9wID09PSAnbGlzdC1zdHlsZScgfHxcbiAgICAgICAgICAgIHByb3AgPT09ICdsaXN0LXN0eWxlLWltYWdlJyB8fCBwcm9wID09PSAnY2xpcC1wYXRoJztcbiAgICAgIH1cblxuICAgICAgaWYgKG1vZGUgJiBTdHlsZVNhbml0aXplTW9kZS5TYW5pdGl6ZU9ubHkpIHtcbiAgICAgICAgcmV0dXJuIGRvU2FuaXRpemVWYWx1ZSA/IMm1ybVzYW5pdGl6ZVN0eWxlKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRvU2FuaXRpemVWYWx1ZTtcbiAgICAgIH1cbiAgICB9IGFzIFN0eWxlU2FuaXRpemVGbik7XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgIGNvbnN0IG1zZyA9IGBCaW5kaW5nIHRvIGV2ZW50IHByb3BlcnR5ICcke25hbWV9JyBpcyBkaXNhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zLCBgICtcbiAgICAgICAgYHBsZWFzZSB1c2UgKCR7bmFtZS5zbGljZSgyKX0pPS4uLmAgK1xuICAgICAgICBgXFxuSWYgJyR7bmFtZX0nIGlzIGEgZGlyZWN0aXZlIGlucHV0LCBtYWtlIHN1cmUgdGhlIGRpcmVjdGl2ZSBpcyBpbXBvcnRlZCBieSB0aGVgICtcbiAgICAgICAgYCBjdXJyZW50IG1vZHVsZS5gO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgIGNvbnN0IG1zZyA9IGBCaW5kaW5nIHRvIGV2ZW50IGF0dHJpYnV0ZSAnJHtuYW1lfScgaXMgZGlzYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29ucywgYCArXG4gICAgICAgIGBwbGVhc2UgdXNlICgke25hbWUuc2xpY2UoMil9KT0uLi5gO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNhbml0aXplcigpOiBTYW5pdGl6ZXJ8bnVsbCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGxWaWV3ICYmIGxWaWV3W1NBTklUSVpFUl07XG59XG4iXX0=