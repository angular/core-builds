/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/sanitization/sanitization.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getDocument } from '../render3/interfaces/document';
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
    return _sanitizeHtml(getDocument(), renderStringify(unsafeHtml));
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
        return doSanitizeValue ? ɵɵsanitizeStyle(value) : unwrapSafeValue(value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFM0QsT0FBTyxFQUFhLCtCQUErQixFQUFFLGVBQWUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0RixPQUFPLEVBQUMsYUFBYSxJQUFJLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRWhFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDM0MsT0FBTyxFQUFxQyxjQUFjLElBQUksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdkcsT0FBTyxFQUFDLFlBQVksSUFBSSxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQW1CN0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxVQUFlOztVQUN0QyxTQUFTLEdBQUcsWUFBWSxFQUFFO0lBQ2hDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ25FO0lBQ0QsSUFBSSwrQkFBK0IsQ0FBQyxVQUFVLG9CQUFrQixFQUFFO1FBQ2hFLE9BQU8sZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxhQUFhLENBQUMsV0FBVyxFQUFFLEVBQUUsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDbkUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRCxNQUFNLFVBQVUsZUFBZSxDQUFDLFdBQWdCOztVQUN4QyxTQUFTLEdBQUcsWUFBWSxFQUFFO0lBQ2hDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3JFO0lBQ0QsSUFBSSwrQkFBK0IsQ0FBQyxXQUFXLHNCQUFtQixFQUFFO1FBQ2xFLE9BQU8sZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ3JDO0lBQ0QsT0FBTyxjQUFjLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7QUFDdEQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxTQUFjOztVQUNwQyxTQUFTLEdBQUcsWUFBWSxFQUFFO0lBQ2hDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ2pFO0lBQ0QsSUFBSSwrQkFBK0IsQ0FBQyxTQUFTLGtCQUFpQixFQUFFO1FBQzlELE9BQU8sZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ25DO0lBQ0QsT0FBTyxZQUFZLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQzs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLGlCQUFzQjs7VUFDcEQsU0FBUyxHQUFHLFlBQVksRUFBRTtJQUNoQyxJQUFJLFNBQVMsRUFBRTtRQUNiLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO0tBQ2xGO0lBQ0QsSUFBSSwrQkFBK0IsQ0FBQyxpQkFBaUIsa0NBQXlCLEVBQUU7UUFDOUUsT0FBTyxlQUFlLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUMzQztJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsK0VBQStFLENBQUMsQ0FBQztBQUNuRyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSxVQUFVLGdCQUFnQixDQUFDLFlBQWlCOztVQUMxQyxTQUFTLEdBQUcsWUFBWSxFQUFFO0lBQ2hDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3ZFO0lBQ0QsSUFBSSwrQkFBK0IsQ0FBQyxZQUFZLHdCQUFvQixFQUFFO1FBQ3BFLE9BQU8sZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQ3RDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0FBQzNELENBQUM7Ozs7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxHQUFXLEVBQUUsSUFBWTtJQUN2RCxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxPQUFPLElBQUksR0FBRyxLQUFLLE9BQU8sSUFBSSxHQUFHLEtBQUssUUFBUTtRQUN0RCxHQUFHLEtBQUssT0FBTyxJQUFJLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQztRQUN6RCxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksQ0FBQyxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFO1FBQzNELE9BQU8scUJBQXFCLENBQUM7S0FDOUI7SUFDRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBaUJELE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxTQUFjLEVBQUUsR0FBVyxFQUFFLElBQVk7SUFDbEYsT0FBTyxlQUFlLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQy9DLENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxPQUFPLHVCQUF1QixHQUNoQyxDQUFDOzs7Ozs7QUFBQSxVQUFTLElBQVksRUFBRSxLQUFrQixFQUFFLElBQXdCO0lBQ2xFLElBQUksR0FBRyxJQUFJLCtCQUF5QyxDQUFDOztRQUNqRCxlQUFlLEdBQUcsSUFBSTtJQUMxQixJQUFJLElBQUksMkJBQXFDLEVBQUU7UUFDN0MsZUFBZSxHQUFHLElBQUksS0FBSyxrQkFBa0IsSUFBSSxJQUFJLEtBQUssWUFBWTtZQUNsRSxJQUFJLEtBQUssY0FBYyxJQUFJLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxLQUFLLFlBQVk7WUFDckUsSUFBSSxLQUFLLGtCQUFrQixJQUFJLElBQUksS0FBSyxXQUFXLENBQUM7S0FDekQ7SUFFRCxJQUFJLElBQUksdUJBQWlDLEVBQUU7UUFDekMsT0FBTyxlQUFlLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzFFO1NBQU07UUFDTCxPQUFPLGVBQWUsQ0FBQztLQUN4QjtBQUNILENBQUMsR0FBbUIsQ0FBQzs7Ozs7QUFFekIsTUFBTSxVQUFVLDhCQUE4QixDQUFDLElBQVk7SUFDekQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFOztjQUNqQyxHQUFHLEdBQUcsOEJBQThCLElBQUksd0NBQXdDO1lBQ2xGLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTztZQUNuQyxTQUFTLElBQUksb0VBQW9FO1lBQ2pGLGtCQUFrQjtRQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsOEJBQThCLENBQUMsSUFBWTtJQUN6RCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7O2NBQ2pDLEdBQUcsR0FBRywrQkFBK0IsSUFBSSx3Q0FBd0M7WUFDbkYsZUFBZSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPO1FBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDdEI7QUFDSCxDQUFDOzs7O0FBRUQsU0FBUyxZQUFZOztVQUNiLEtBQUssR0FBRyxRQUFRLEVBQUU7SUFDeEIsT0FBTyxLQUFLLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge1NBTklUSVpFUn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9zdGF0ZSc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuXG5pbXBvcnQge0J5cGFzc1R5cGUsIGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3csIHVud3JhcFNhZmVWYWx1ZX0gZnJvbSAnLi9ieXBhc3MnO1xuaW1wb3J0IHtfc2FuaXRpemVIdG1sIGFzIF9zYW5pdGl6ZUh0bWx9IGZyb20gJy4vaHRtbF9zYW5pdGl6ZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4vc2FuaXRpemVyJztcbmltcG9ydCB7U2VjdXJpdHlDb250ZXh0fSBmcm9tICcuL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZSwgX3Nhbml0aXplU3R5bGUgYXMgX3Nhbml0aXplU3R5bGV9IGZyb20gJy4vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7X3Nhbml0aXplVXJsIGFzIF9zYW5pdGl6ZVVybH0gZnJvbSAnLi91cmxfc2FuaXRpemVyJztcblxuXG5cbi8qKlxuICogQW4gYGh0bWxgIHNhbml0aXplciB3aGljaCBjb252ZXJ0cyB1bnRydXN0ZWQgYGh0bWxgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgaHRtbGAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgdXJscyBhbmRcbiAqIGphdmFzY3JpcHQpIGFuZCByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdEh0bWx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVIdG1sIHVudHJ1c3RlZCBgaHRtbGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYGh0bWxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGRpc3BsYXkgdG8gdXNlciwgYmVjYXVzZSBhbGwgb2YgdGhlIGRhbmdlcm91cyBqYXZhc2NyaXB0XG4gKiBhbmQgdXJscyBoYXZlIGJlZW4gcmVtb3ZlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c2FuaXRpemVIdG1sKHVuc2FmZUh0bWw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdW5zYWZlSHRtbCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codW5zYWZlSHRtbCwgQnlwYXNzVHlwZS5IdG1sKSkge1xuICAgIHJldHVybiB1bndyYXBTYWZlVmFsdWUodW5zYWZlSHRtbCk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZUh0bWwoZ2V0RG9jdW1lbnQoKSwgcmVuZGVyU3RyaW5naWZ5KHVuc2FmZUh0bWwpKTtcbn1cblxuLyoqXG4gKiBBIGBzdHlsZWAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgc3R5bGVgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgc3R5bGVgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIHVybHMgYW5kXG4gKiBqYXZhc2NyaXB0KSBhbmQgcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHlsZX0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVN0eWxlIHVudHJ1c3RlZCBgc3R5bGVgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGBzdHlsZWAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHN0eWxlYCBwcm9wZXJ0aWVzLCBiZWNhdXNlIGFsbCBvZiB0aGVcbiAqIGRhbmdlcm91cyBqYXZhc2NyaXB0IGFuZCB1cmxzIGhhdmUgYmVlbiByZW1vdmVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzYW5pdGl6ZVN0eWxlKHVuc2FmZVN0eWxlOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTYW5pdGl6ZXIoKTtcbiAgaWYgKHNhbml0aXplcikge1xuICAgIHJldHVybiBzYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlNUWUxFLCB1bnNhZmVTdHlsZSkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codW5zYWZlU3R5bGUsIEJ5cGFzc1R5cGUuU3R5bGUpKSB7XG4gICAgcmV0dXJuIHVud3JhcFNhZmVWYWx1ZSh1bnNhZmVTdHlsZSk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZVN0eWxlKHJlbmRlclN0cmluZ2lmeSh1bnNhZmVTdHlsZSkpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgdXJsYCAqKnN0cmluZyoqIGludG8gdHJ1c3RlZCBzdHJpbmcgYnkgcmVtb3ZpbmdcbiAqIGRhbmdlcm91c1xuICogY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGB1cmxgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIGphdmFzY3JpcHQpIGFuZFxuICogcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVVcmwgdW50cnVzdGVkIGB1cmxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGBzcmNgIHByb3BlcnRpZXMgc3VjaCBhcyBgPGltZyBzcmM+YCwgYmVjYXVzZVxuICogYWxsIG9mIHRoZSBkYW5nZXJvdXMgamF2YXNjcmlwdCBoYXMgYmVlbiByZW1vdmVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzYW5pdGl6ZVVybCh1bnNhZmVVcmw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuVVJMLCB1bnNhZmVVcmwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc0FuZFRocm93KHVuc2FmZVVybCwgQnlwYXNzVHlwZS5VcmwpKSB7XG4gICAgcmV0dXJuIHVud3JhcFNhZmVWYWx1ZSh1bnNhZmVVcmwpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVVcmwocmVuZGVyU3RyaW5naWZ5KHVuc2FmZVVybCkpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGB1cmxgcyB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHVybGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0UmVzb3VyY2VVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVSZXNvdXJjZVVybCB1bnRydXN0ZWQgYHVybGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHNyY2AgcHJvcGVydGllcyBzdWNoIGFzIGA8aW1nIHNyYz5gLCBiZWNhdXNlXG4gKiBvbmx5IHRydXN0ZWQgYHVybGBzIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplUmVzb3VyY2VVcmwodW5zYWZlUmVzb3VyY2VVcmw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuUkVTT1VSQ0VfVVJMLCB1bnNhZmVSZXNvdXJjZVVybCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codW5zYWZlUmVzb3VyY2VVcmwsIEJ5cGFzc1R5cGUuUmVzb3VyY2VVcmwpKSB7XG4gICAgcmV0dXJuIHVud3JhcFNhZmVWYWx1ZSh1bnNhZmVSZXNvdXJjZVVybCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnNhZmUgdmFsdWUgdXNlZCBpbiBhIHJlc291cmNlIFVSTCBjb250ZXh0IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKScpO1xufVxuXG4vKipcbiAqIEEgYHNjcmlwdGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGphdmFzY3JpcHQgdGhyb3VnaC5cbiAqXG4gKiBUaGlzIHBhc3NlcyBvbmx5IGBzY3JpcHRgcyBtYXJrZWQgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGlua1xuICogYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTY3JpcHR9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVTY3JpcHQgdW50cnVzdGVkIGBzY3JpcHRgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGA8c2NyaXB0PmAgZWxlbWVudCBzdWNoIGFzIGA8aW1nIHNyYz5gLFxuICogYmVjYXVzZSBvbmx5IHRydXN0ZWQgYHNjcmlwdHNgIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplU2NyaXB0KHVuc2FmZVNjcmlwdDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TQ1JJUFQsIHVuc2FmZVNjcmlwdCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codW5zYWZlU2NyaXB0LCBCeXBhc3NUeXBlLlNjcmlwdCkpIHtcbiAgICByZXR1cm4gdW53cmFwU2FmZVZhbHVlKHVuc2FmZVNjcmlwdCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnNhZmUgdmFsdWUgdXNlZCBpbiBhIHNjcmlwdCBjb250ZXh0Jyk7XG59XG5cbi8qKlxuICogRGV0ZWN0cyB3aGljaCBzYW5pdGl6ZXIgdG8gdXNlIGZvciBVUkwgcHJvcGVydHksIGJhc2VkIG9uIHRhZyBuYW1lIGFuZCBwcm9wIG5hbWUuXG4gKlxuICogVGhlIHJ1bGVzIGFyZSBiYXNlZCBvbiB0aGUgUkVTT1VSQ0VfVVJMIGNvbnRleHQgY29uZmlnIGZyb21cbiAqIGBwYWNrYWdlcy9jb21waWxlci9zcmMvc2NoZW1hL2RvbV9zZWN1cml0eV9zY2hlbWEudHNgLlxuICogSWYgdGFnIGFuZCBwcm9wIG5hbWVzIGRvbid0IG1hdGNoIFJlc291cmNlIFVSTCBzY2hlbWEsIHVzZSBVUkwgc2FuaXRpemVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VXJsU2FuaXRpemVyKHRhZzogc3RyaW5nLCBwcm9wOiBzdHJpbmcpIHtcbiAgaWYgKChwcm9wID09PSAnc3JjJyAmJiAodGFnID09PSAnZW1iZWQnIHx8IHRhZyA9PT0gJ2ZyYW1lJyB8fCB0YWcgPT09ICdpZnJhbWUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRhZyA9PT0gJ21lZGlhJyB8fCB0YWcgPT09ICdzY3JpcHQnKSkgfHxcbiAgICAgIChwcm9wID09PSAnaHJlZicgJiYgKHRhZyA9PT0gJ2Jhc2UnIHx8IHRhZyA9PT0gJ2xpbmsnKSkpIHtcbiAgICByZXR1cm4gybXJtXNhbml0aXplUmVzb3VyY2VVcmw7XG4gIH1cbiAgcmV0dXJuIMm1ybVzYW5pdGl6ZVVybDtcbn1cblxuLyoqXG4gKiBTYW5pdGl6ZXMgVVJMLCBzZWxlY3Rpbmcgc2FuaXRpemVyIGZ1bmN0aW9uIGJhc2VkIG9uIHRhZyBhbmQgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGluIGNhc2Ugd2UgY2FuJ3QgZGVmaW5lIHNlY3VyaXR5IGNvbnRleHQgYXQgY29tcGlsZSB0aW1lLCB3aGVuIG9ubHkgcHJvcFxuICogbmFtZSBpcyBhdmFpbGFibGUuIFRoaXMgaGFwcGVucyB3aGVuIHdlIGdlbmVyYXRlIGhvc3QgYmluZGluZ3MgZm9yIERpcmVjdGl2ZXMvQ29tcG9uZW50cy4gVGhlXG4gKiBob3N0IGVsZW1lbnQgaXMgdW5rbm93biBhdCBjb21waWxlIHRpbWUsIHNvIHdlIGRlZmVyIGNhbGN1bGF0aW9uIG9mIHNwZWNpZmljIHNhbml0aXplciB0b1xuICogcnVudGltZS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcGFyYW0gdGFnIHRhcmdldCBlbGVtZW50IHRhZyBuYW1lLlxuICogQHBhcmFtIHByb3AgbmFtZSBvZiB0aGUgcHJvcGVydHkgdGhhdCBjb250YWlucyB0aGUgdmFsdWUuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzYW5pdGl6ZVVybE9yUmVzb3VyY2VVcmwodW5zYWZlVXJsOiBhbnksIHRhZzogc3RyaW5nLCBwcm9wOiBzdHJpbmcpOiBhbnkge1xuICByZXR1cm4gZ2V0VXJsU2FuaXRpemVyKHRhZywgcHJvcCkodW5zYWZlVXJsKTtcbn1cblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBzdHlsZSBzYW5pdGl6ZXIgd2lsbCBoYW5kbGUgc2FuaXRpemF0aW9uIGZvciBzdHlsZSBwcm9wZXJ0aWVzIGJ5XG4gKiBzYW5pdGl6aW5nIGFueSBDU1MgcHJvcGVydHkgdGhhdCBjYW4gaW5jbHVkZSBhIGB1cmxgIHZhbHVlICh1c3VhbGx5IGltYWdlLWJhc2VkIHByb3BlcnRpZXMpXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgybXJtWRlZmF1bHRTdHlsZVNhbml0aXplciA9XG4gICAgKGZ1bmN0aW9uKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xudWxsLCBtb2RlPzogU3R5bGVTYW5pdGl6ZU1vZGUpOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCB7XG4gICAgICBtb2RlID0gbW9kZSB8fCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZUFuZFNhbml0aXplO1xuICAgICAgbGV0IGRvU2FuaXRpemVWYWx1ZSA9IHRydWU7XG4gICAgICBpZiAobW9kZSAmIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlUHJvcGVydHkpIHtcbiAgICAgICAgZG9TYW5pdGl6ZVZhbHVlID0gcHJvcCA9PT0gJ2JhY2tncm91bmQtaW1hZ2UnIHx8IHByb3AgPT09ICdiYWNrZ3JvdW5kJyB8fFxuICAgICAgICAgICAgcHJvcCA9PT0gJ2JvcmRlci1pbWFnZScgfHwgcHJvcCA9PT0gJ2ZpbHRlcicgfHwgcHJvcCA9PT0gJ2xpc3Qtc3R5bGUnIHx8XG4gICAgICAgICAgICBwcm9wID09PSAnbGlzdC1zdHlsZS1pbWFnZScgfHwgcHJvcCA9PT0gJ2NsaXAtcGF0aCc7XG4gICAgICB9XG5cbiAgICAgIGlmIChtb2RlICYgU3R5bGVTYW5pdGl6ZU1vZGUuU2FuaXRpemVPbmx5KSB7XG4gICAgICAgIHJldHVybiBkb1Nhbml0aXplVmFsdWUgPyDJtcm1c2FuaXRpemVTdHlsZSh2YWx1ZSkgOiB1bndyYXBTYWZlVmFsdWUodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRvU2FuaXRpemVWYWx1ZTtcbiAgICAgIH1cbiAgICB9IGFzIFN0eWxlU2FuaXRpemVGbik7XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgIGNvbnN0IG1zZyA9IGBCaW5kaW5nIHRvIGV2ZW50IHByb3BlcnR5ICcke25hbWV9JyBpcyBkaXNhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zLCBgICtcbiAgICAgICAgYHBsZWFzZSB1c2UgKCR7bmFtZS5zbGljZSgyKX0pPS4uLmAgK1xuICAgICAgICBgXFxuSWYgJyR7bmFtZX0nIGlzIGEgZGlyZWN0aXZlIGlucHV0LCBtYWtlIHN1cmUgdGhlIGRpcmVjdGl2ZSBpcyBpbXBvcnRlZCBieSB0aGVgICtcbiAgICAgICAgYCBjdXJyZW50IG1vZHVsZS5gO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgIGNvbnN0IG1zZyA9IGBCaW5kaW5nIHRvIGV2ZW50IGF0dHJpYnV0ZSAnJHtuYW1lfScgaXMgZGlzYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29ucywgYCArXG4gICAgICAgIGBwbGVhc2UgdXNlICgke25hbWUuc2xpY2UoMil9KT0uLi5gO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNhbml0aXplcigpOiBTYW5pdGl6ZXJ8bnVsbCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGxWaWV3ICYmIGxWaWV3W1NBTklUSVpFUl07XG59XG4iXX0=