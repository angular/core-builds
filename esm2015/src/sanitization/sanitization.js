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
 * It is possible to mark a string as trusted by calling {\@link bypassSanitizationTrustStyle}.
 *
 * \@publicApi
 * @param {?} unsafeStyle untrusted `style`, typically from the user.
 * @return {?} `style` string which is safe to bind to the `style` properties.
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
    return renderStringify(unsafeStyle);
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
    if ((prop === 'src' &&
        (tag === 'embed' || tag === 'frame' || tag === 'iframe' || tag === 'media' ||
            tag === 'script')) ||
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
 * The default style sanitizer will handle sanitization for style properties.
 *
 * Style sanitization is no longer apart of Angular because modern browsers no
 * longer support javascript expressions. Therefore, the reason why this API
 * exists is exclusively for unwrapping any style value expressions that were
 * marked as `SafeValue` values.
 *
 * This API will be removed in a future release of Angular.
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
    if (value === undefined && mode === undefined) {
        // This is a workaround for the fact that `StyleSanitizeFn` should not exist once PR#34480
        // lands. For now the `StyleSanitizeFn` and should act like `(value: any) => string` as a
        // work around.
        return ɵɵsanitizeStyle(prop);
    }
    mode = mode || 3 /* ValidateAndSanitize */;
    /** @type {?} */
    let doSanitizeValue = true;
    if (mode & 1 /* ValidateProperty */) {
        doSanitizeValue = stylePropNeedsSanitization(prop);
    }
    if (mode & 2 /* SanitizeOnly */) {
        return doSanitizeValue ? ɵɵsanitizeStyle(value) : unwrapSafeValue(value);
    }
    else {
        return doSanitizeValue;
    }
}))));
/**
 * @param {?} prop
 * @return {?}
 */
export function stylePropNeedsSanitization(prop) {
    return prop === 'background-image' || prop === 'backgroundImage' || prop === 'background' ||
        prop === 'border-image' || prop === 'borderImage' || prop === 'border-image-source' ||
        prop === 'borderImageSource' || prop === 'filter' || prop === 'list-style' ||
        prop === 'listStyle' || prop === 'list-style-image' || prop === 'listStyleImage' ||
        prop === 'clip-path' || prop === 'clipPath';
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFM0QsT0FBTyxFQUFDLCtCQUErQixFQUFjLGVBQWUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0RixPQUFPLEVBQUMsYUFBYSxJQUFJLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRWhFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFM0MsT0FBTyxFQUFDLFlBQVksSUFBSSxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQW1CN0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxVQUFlOztVQUN0QyxTQUFTLEdBQUcsWUFBWSxFQUFFO0lBQ2hDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ25FO0lBQ0QsSUFBSSwrQkFBK0IsQ0FBQyxVQUFVLG9CQUFrQixFQUFFO1FBQ2hFLE9BQU8sZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxhQUFhLENBQUMsV0FBVyxFQUFFLEVBQUUsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDbkUsQ0FBQzs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxVQUFV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LHdDQUF3QztZQUNsRixlQUFlLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU87WUFDbkMsU0FBUyxJQUFJLG9FQUFvRTtZQUNqRixrQkFBa0I7UUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUN0QjtBQUNILENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLDhCQUE4QixDQUFDLElBQVk7SUFDekQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFOztjQUNqQyxHQUFHLEdBQUcsK0JBQStCLElBQUksd0NBQXdDO1lBQ25GLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTztRQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQzs7OztBQUVELFNBQVMsWUFBWTs7VUFDYixLQUFLLEdBQUcsUUFBUSxFQUFFO0lBQ3hCLE9BQU8sS0FBSyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvZG9jdW1lbnQnO1xuaW1wb3J0IHtTQU5JVElaRVJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvc3RhdGUnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcblxuaW1wb3J0IHthbGxvd1Nhbml0aXphdGlvbkJ5cGFzc0FuZFRocm93LCBCeXBhc3NUeXBlLCB1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4vYnlwYXNzJztcbmltcG9ydCB7X3Nhbml0aXplSHRtbCBhcyBfc2FuaXRpemVIdG1sfSBmcm9tICcuL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuL3Nhbml0aXplcic7XG5pbXBvcnQge1NlY3VyaXR5Q29udGV4dH0gZnJvbSAnLi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgU3R5bGVTYW5pdGl6ZU1vZGV9IGZyb20gJy4vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7X3Nhbml0aXplVXJsIGFzIF9zYW5pdGl6ZVVybH0gZnJvbSAnLi91cmxfc2FuaXRpemVyJztcblxuXG5cbi8qKlxuICogQW4gYGh0bWxgIHNhbml0aXplciB3aGljaCBjb252ZXJ0cyB1bnRydXN0ZWQgYGh0bWxgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgaHRtbGAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgdXJscyBhbmRcbiAqIGphdmFzY3JpcHQpIGFuZCByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdEh0bWx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVIdG1sIHVudHJ1c3RlZCBgaHRtbGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYGh0bWxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGRpc3BsYXkgdG8gdXNlciwgYmVjYXVzZSBhbGwgb2YgdGhlIGRhbmdlcm91cyBqYXZhc2NyaXB0XG4gKiBhbmQgdXJscyBoYXZlIGJlZW4gcmVtb3ZlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c2FuaXRpemVIdG1sKHVuc2FmZUh0bWw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdW5zYWZlSHRtbCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codW5zYWZlSHRtbCwgQnlwYXNzVHlwZS5IdG1sKSkge1xuICAgIHJldHVybiB1bndyYXBTYWZlVmFsdWUodW5zYWZlSHRtbCk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZUh0bWwoZ2V0RG9jdW1lbnQoKSwgcmVuZGVyU3RyaW5naWZ5KHVuc2FmZUh0bWwpKTtcbn1cblxuLyoqXG4gKiBBIGBzdHlsZWAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgc3R5bGVgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gbWFyayBhIHN0cmluZyBhcyB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0U3R5bGV9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVTdHlsZSB1bnRydXN0ZWQgYHN0eWxlYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgc3R5bGVgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGBzdHlsZWAgcHJvcGVydGllcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c2FuaXRpemVTdHlsZSh1bnNhZmVTdHlsZTogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TVFlMRSwgdW5zYWZlU3R5bGUpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc0FuZFRocm93KHVuc2FmZVN0eWxlLCBCeXBhc3NUeXBlLlN0eWxlKSkge1xuICAgIHJldHVybiB1bndyYXBTYWZlVmFsdWUodW5zYWZlU3R5bGUpO1xuICB9XG4gIHJldHVybiByZW5kZXJTdHJpbmdpZnkodW5zYWZlU3R5bGUpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgdXJsYCAqKnN0cmluZyoqIGludG8gdHJ1c3RlZCBzdHJpbmcgYnkgcmVtb3ZpbmdcbiAqIGRhbmdlcm91c1xuICogY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGB1cmxgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIGphdmFzY3JpcHQpIGFuZFxuICogcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVVcmwgdW50cnVzdGVkIGB1cmxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGBzcmNgIHByb3BlcnRpZXMgc3VjaCBhcyBgPGltZyBzcmM+YCwgYmVjYXVzZVxuICogYWxsIG9mIHRoZSBkYW5nZXJvdXMgamF2YXNjcmlwdCBoYXMgYmVlbiByZW1vdmVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzYW5pdGl6ZVVybCh1bnNhZmVVcmw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuVVJMLCB1bnNhZmVVcmwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc0FuZFRocm93KHVuc2FmZVVybCwgQnlwYXNzVHlwZS5VcmwpKSB7XG4gICAgcmV0dXJuIHVud3JhcFNhZmVWYWx1ZSh1bnNhZmVVcmwpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVVcmwocmVuZGVyU3RyaW5naWZ5KHVuc2FmZVVybCkpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGB1cmxgcyB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHVybGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0UmVzb3VyY2VVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVSZXNvdXJjZVVybCB1bnRydXN0ZWQgYHVybGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHNyY2AgcHJvcGVydGllcyBzdWNoIGFzIGA8aW1nIHNyYz5gLCBiZWNhdXNlXG4gKiBvbmx5IHRydXN0ZWQgYHVybGBzIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplUmVzb3VyY2VVcmwodW5zYWZlUmVzb3VyY2VVcmw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuUkVTT1VSQ0VfVVJMLCB1bnNhZmVSZXNvdXJjZVVybCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codW5zYWZlUmVzb3VyY2VVcmwsIEJ5cGFzc1R5cGUuUmVzb3VyY2VVcmwpKSB7XG4gICAgcmV0dXJuIHVud3JhcFNhZmVWYWx1ZSh1bnNhZmVSZXNvdXJjZVVybCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnNhZmUgdmFsdWUgdXNlZCBpbiBhIHJlc291cmNlIFVSTCBjb250ZXh0IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKScpO1xufVxuXG4vKipcbiAqIEEgYHNjcmlwdGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGphdmFzY3JpcHQgdGhyb3VnaC5cbiAqXG4gKiBUaGlzIHBhc3NlcyBvbmx5IGBzY3JpcHRgcyBtYXJrZWQgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGlua1xuICogYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTY3JpcHR9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVTY3JpcHQgdW50cnVzdGVkIGBzY3JpcHRgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGA8c2NyaXB0PmAgZWxlbWVudCBzdWNoIGFzIGA8aW1nIHNyYz5gLFxuICogYmVjYXVzZSBvbmx5IHRydXN0ZWQgYHNjcmlwdHNgIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplU2NyaXB0KHVuc2FmZVNjcmlwdDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TQ1JJUFQsIHVuc2FmZVNjcmlwdCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzQW5kVGhyb3codW5zYWZlU2NyaXB0LCBCeXBhc3NUeXBlLlNjcmlwdCkpIHtcbiAgICByZXR1cm4gdW53cmFwU2FmZVZhbHVlKHVuc2FmZVNjcmlwdCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnNhZmUgdmFsdWUgdXNlZCBpbiBhIHNjcmlwdCBjb250ZXh0Jyk7XG59XG5cbi8qKlxuICogRGV0ZWN0cyB3aGljaCBzYW5pdGl6ZXIgdG8gdXNlIGZvciBVUkwgcHJvcGVydHksIGJhc2VkIG9uIHRhZyBuYW1lIGFuZCBwcm9wIG5hbWUuXG4gKlxuICogVGhlIHJ1bGVzIGFyZSBiYXNlZCBvbiB0aGUgUkVTT1VSQ0VfVVJMIGNvbnRleHQgY29uZmlnIGZyb21cbiAqIGBwYWNrYWdlcy9jb21waWxlci9zcmMvc2NoZW1hL2RvbV9zZWN1cml0eV9zY2hlbWEudHNgLlxuICogSWYgdGFnIGFuZCBwcm9wIG5hbWVzIGRvbid0IG1hdGNoIFJlc291cmNlIFVSTCBzY2hlbWEsIHVzZSBVUkwgc2FuaXRpemVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VXJsU2FuaXRpemVyKHRhZzogc3RyaW5nLCBwcm9wOiBzdHJpbmcpIHtcbiAgaWYgKChwcm9wID09PSAnc3JjJyAmJlxuICAgICAgICh0YWcgPT09ICdlbWJlZCcgfHwgdGFnID09PSAnZnJhbWUnIHx8IHRhZyA9PT0gJ2lmcmFtZScgfHwgdGFnID09PSAnbWVkaWEnIHx8XG4gICAgICAgIHRhZyA9PT0gJ3NjcmlwdCcpKSB8fFxuICAgICAgKHByb3AgPT09ICdocmVmJyAmJiAodGFnID09PSAnYmFzZScgfHwgdGFnID09PSAnbGluaycpKSkge1xuICAgIHJldHVybiDJtcm1c2FuaXRpemVSZXNvdXJjZVVybDtcbiAgfVxuICByZXR1cm4gybXJtXNhbml0aXplVXJsO1xufVxuXG4vKipcbiAqIFNhbml0aXplcyBVUkwsIHNlbGVjdGluZyBzYW5pdGl6ZXIgZnVuY3Rpb24gYmFzZWQgb24gdGFnIGFuZCBwcm9wZXJ0eSBuYW1lcy5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgaW4gY2FzZSB3ZSBjYW4ndCBkZWZpbmUgc2VjdXJpdHkgY29udGV4dCBhdCBjb21waWxlIHRpbWUsIHdoZW4gb25seSBwcm9wXG4gKiBuYW1lIGlzIGF2YWlsYWJsZS4gVGhpcyBoYXBwZW5zIHdoZW4gd2UgZ2VuZXJhdGUgaG9zdCBiaW5kaW5ncyBmb3IgRGlyZWN0aXZlcy9Db21wb25lbnRzLiBUaGVcbiAqIGhvc3QgZWxlbWVudCBpcyB1bmtub3duIGF0IGNvbXBpbGUgdGltZSwgc28gd2UgZGVmZXIgY2FsY3VsYXRpb24gb2Ygc3BlY2lmaWMgc2FuaXRpemVyIHRvXG4gKiBydW50aW1lLlxuICpcbiAqIEBwYXJhbSB1bnNhZmVVcmwgdW50cnVzdGVkIGB1cmxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEBwYXJhbSB0YWcgdGFyZ2V0IGVsZW1lbnQgdGFnIG5hbWUuXG4gKiBAcGFyYW0gcHJvcCBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0aGF0IGNvbnRhaW5zIHRoZSB2YWx1ZS5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNhbml0aXplVXJsT3JSZXNvdXJjZVVybCh1bnNhZmVVcmw6IGFueSwgdGFnOiBzdHJpbmcsIHByb3A6IHN0cmluZyk6IGFueSB7XG4gIHJldHVybiBnZXRVcmxTYW5pdGl6ZXIodGFnLCBwcm9wKSh1bnNhZmVVcmwpO1xufVxuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHN0eWxlIHNhbml0aXplciB3aWxsIGhhbmRsZSBzYW5pdGl6YXRpb24gZm9yIHN0eWxlIHByb3BlcnRpZXMuXG4gKlxuICogU3R5bGUgc2FuaXRpemF0aW9uIGlzIG5vIGxvbmdlciBhcGFydCBvZiBBbmd1bGFyIGJlY2F1c2UgbW9kZXJuIGJyb3dzZXJzIG5vXG4gKiBsb25nZXIgc3VwcG9ydCBqYXZhc2NyaXB0IGV4cHJlc3Npb25zLiBUaGVyZWZvcmUsIHRoZSByZWFzb24gd2h5IHRoaXMgQVBJXG4gKiBleGlzdHMgaXMgZXhjbHVzaXZlbHkgZm9yIHVud3JhcHBpbmcgYW55IHN0eWxlIHZhbHVlIGV4cHJlc3Npb25zIHRoYXQgd2VyZVxuICogbWFya2VkIGFzIGBTYWZlVmFsdWVgIHZhbHVlcy5cbiAqXG4gKiBUaGlzIEFQSSB3aWxsIGJlIHJlbW92ZWQgaW4gYSBmdXR1cmUgcmVsZWFzZSBvZiBBbmd1bGFyLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IMm1ybVkZWZhdWx0U3R5bGVTYW5pdGl6ZXIgPVxuICAgIChmdW5jdGlvbihwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8bnVsbCwgbW9kZT86IFN0eWxlU2FuaXRpemVNb2RlKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiBtb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIHdvcmthcm91bmQgZm9yIHRoZSBmYWN0IHRoYXQgYFN0eWxlU2FuaXRpemVGbmAgc2hvdWxkIG5vdCBleGlzdCBvbmNlIFBSIzM0NDgwXG4gICAgICAgIC8vIGxhbmRzLiBGb3Igbm93IHRoZSBgU3R5bGVTYW5pdGl6ZUZuYCBhbmQgc2hvdWxkIGFjdCBsaWtlIGAodmFsdWU6IGFueSkgPT4gc3RyaW5nYCBhcyBhXG4gICAgICAgIC8vIHdvcmsgYXJvdW5kLlxuICAgICAgICByZXR1cm4gybXJtXNhbml0aXplU3R5bGUocHJvcCk7XG4gICAgICB9XG4gICAgICBtb2RlID0gbW9kZSB8fCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZUFuZFNhbml0aXplO1xuICAgICAgbGV0IGRvU2FuaXRpemVWYWx1ZSA9IHRydWU7XG4gICAgICBpZiAobW9kZSAmIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlUHJvcGVydHkpIHtcbiAgICAgICAgZG9TYW5pdGl6ZVZhbHVlID0gc3R5bGVQcm9wTmVlZHNTYW5pdGl6YXRpb24ocHJvcCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChtb2RlICYgU3R5bGVTYW5pdGl6ZU1vZGUuU2FuaXRpemVPbmx5KSB7XG4gICAgICAgIHJldHVybiBkb1Nhbml0aXplVmFsdWUgPyDJtcm1c2FuaXRpemVTdHlsZSh2YWx1ZSkgOiB1bndyYXBTYWZlVmFsdWUodmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRvU2FuaXRpemVWYWx1ZTtcbiAgICAgIH1cbiAgICB9IGFzIFN0eWxlU2FuaXRpemVGbik7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZVByb3BOZWVkc1Nhbml0aXphdGlvbihwcm9wOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHByb3AgPT09ICdiYWNrZ3JvdW5kLWltYWdlJyB8fCBwcm9wID09PSAnYmFja2dyb3VuZEltYWdlJyB8fCBwcm9wID09PSAnYmFja2dyb3VuZCcgfHxcbiAgICAgIHByb3AgPT09ICdib3JkZXItaW1hZ2UnIHx8IHByb3AgPT09ICdib3JkZXJJbWFnZScgfHwgcHJvcCA9PT0gJ2JvcmRlci1pbWFnZS1zb3VyY2UnIHx8XG4gICAgICBwcm9wID09PSAnYm9yZGVySW1hZ2VTb3VyY2UnIHx8IHByb3AgPT09ICdmaWx0ZXInIHx8IHByb3AgPT09ICdsaXN0LXN0eWxlJyB8fFxuICAgICAgcHJvcCA9PT0gJ2xpc3RTdHlsZScgfHwgcHJvcCA9PT0gJ2xpc3Qtc3R5bGUtaW1hZ2UnIHx8IHByb3AgPT09ICdsaXN0U3R5bGVJbWFnZScgfHxcbiAgICAgIHByb3AgPT09ICdjbGlwLXBhdGgnIHx8IHByb3AgPT09ICdjbGlwUGF0aCc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgIGNvbnN0IG1zZyA9IGBCaW5kaW5nIHRvIGV2ZW50IHByb3BlcnR5ICcke25hbWV9JyBpcyBkaXNhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zLCBgICtcbiAgICAgICAgYHBsZWFzZSB1c2UgKCR7bmFtZS5zbGljZSgyKX0pPS4uLmAgK1xuICAgICAgICBgXFxuSWYgJyR7bmFtZX0nIGlzIGEgZGlyZWN0aXZlIGlucHV0LCBtYWtlIHN1cmUgdGhlIGRpcmVjdGl2ZSBpcyBpbXBvcnRlZCBieSB0aGVgICtcbiAgICAgICAgYCBjdXJyZW50IG1vZHVsZS5gO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgIGNvbnN0IG1zZyA9IGBCaW5kaW5nIHRvIGV2ZW50IGF0dHJpYnV0ZSAnJHtuYW1lfScgaXMgZGlzYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29ucywgYCArXG4gICAgICAgIGBwbGVhc2UgdXNlICgke25hbWUuc2xpY2UoMil9KT0uLi5gO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNhbml0aXplcigpOiBTYW5pdGl6ZXJ8bnVsbCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGxWaWV3ICYmIGxWaWV3W1NBTklUSVpFUl07XG59XG4iXX0=