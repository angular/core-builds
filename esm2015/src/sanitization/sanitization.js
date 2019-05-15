/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { allowSanitizationBypass } from './bypass';
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
export function ΔsanitizeHtml(unsafeHtml) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.HTML, unsafeHtml) || '';
    }
    if (allowSanitizationBypass(unsafeHtml, "Html" /* Html */)) {
        return unsafeHtml.toString();
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
export function ΔsanitizeStyle(unsafeStyle) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.STYLE, unsafeStyle) || '';
    }
    if (allowSanitizationBypass(unsafeStyle, "Style" /* Style */)) {
        return unsafeStyle.toString();
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
export function ΔsanitizeUrl(unsafeUrl) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.URL, unsafeUrl) || '';
    }
    if (allowSanitizationBypass(unsafeUrl, "Url" /* Url */)) {
        return unsafeUrl.toString();
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
export function ΔsanitizeResourceUrl(unsafeResourceUrl) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.RESOURCE_URL, unsafeResourceUrl) || '';
    }
    if (allowSanitizationBypass(unsafeResourceUrl, "ResourceUrl" /* ResourceUrl */)) {
        return unsafeResourceUrl.toString();
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
export function ΔsanitizeScript(unsafeScript) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.SCRIPT, unsafeScript) || '';
    }
    if (allowSanitizationBypass(unsafeScript, "Script" /* Script */)) {
        return unsafeScript.toString();
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
        return ΔsanitizeResourceUrl;
    }
    return ΔsanitizeUrl;
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
export function ΔsanitizeUrlOrResourceUrl(unsafeUrl, tag, prop) {
    return getUrlSanitizer(tag, prop)(unsafeUrl);
}
/**
 * The default style sanitizer will handle sanitization for style properties by
 * sanitizing any CSS property that can include a `url` value (usually image-based properties)
 *
 * \@publicApi
 * @type {?}
 */
export const ΔdefaultStyleSanitizer = ((/** @type {?} */ ((/**
 * @param {?} prop
 * @param {?=} value
 * @return {?}
 */
function (prop, value) {
    if (value === undefined) {
        return prop === 'background-image' || prop === 'background' || prop === 'border-image' ||
            prop === 'filter' || prop === 'list-style' || prop === 'list-style-image';
    }
    return ΔsanitizeStyle(value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRTNELE9BQU8sRUFBYSx1QkFBdUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxJQUFJLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hFLE9BQU8sRUFBWSxlQUFlLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDdEQsT0FBTyxFQUFrQixjQUFjLElBQUksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEYsT0FBTyxFQUFDLFlBQVksSUFBSSxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQW1CN0QsTUFBTSxVQUFVLGFBQWEsQ0FBQyxVQUFlOztVQUNyQyxTQUFTLEdBQUcsWUFBWSxFQUFFO0lBQ2hDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ25FO0lBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxVQUFVLG9CQUFrQixFQUFFO1FBQ3hELE9BQU8sVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzlCO0lBQ0QsT0FBTyxhQUFhLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxXQUFnQjs7VUFDdkMsU0FBUyxHQUFHLFlBQVksRUFBRTtJQUNoQyxJQUFJLFNBQVMsRUFBRTtRQUNiLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUNyRTtJQUNELElBQUksdUJBQXVCLENBQUMsV0FBVyxzQkFBbUIsRUFBRTtRQUMxRCxPQUFPLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUMvQjtJQUNELE9BQU8sY0FBYyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQ3RELENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JELE1BQU0sVUFBVSxZQUFZLENBQUMsU0FBYzs7VUFDbkMsU0FBUyxHQUFHLFlBQVksRUFBRTtJQUNoQyxJQUFJLFNBQVMsRUFBRTtRQUNiLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUNqRTtJQUNELElBQUksdUJBQXVCLENBQUMsU0FBUyxrQkFBaUIsRUFBRTtRQUN0RCxPQUFPLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUM3QjtJQUNELE9BQU8sWUFBWSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7Ozs7Ozs7Ozs7OztBQWFELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxpQkFBc0I7O1VBQ25ELFNBQVMsR0FBRyxZQUFZLEVBQUU7SUFDaEMsSUFBSSxTQUFTLEVBQUU7UUFDYixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUNsRjtJQUNELElBQUksdUJBQXVCLENBQUMsaUJBQWlCLGtDQUF5QixFQUFFO1FBQ3RFLE9BQU8saUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDckM7SUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLCtFQUErRSxDQUFDLENBQUM7QUFDbkcsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sVUFBVSxlQUFlLENBQUMsWUFBaUI7O1VBQ3pDLFNBQVMsR0FBRyxZQUFZLEVBQUU7SUFDaEMsSUFBSSxTQUFTLEVBQUU7UUFDYixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDdkU7SUFDRCxJQUFJLHVCQUF1QixDQUFDLFlBQVksd0JBQW9CLEVBQUU7UUFDNUQsT0FBTyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDaEM7SUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7QUFDM0QsQ0FBQzs7Ozs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEdBQVcsRUFBRSxJQUFZO0lBQ3ZELElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLE9BQU8sSUFBSSxHQUFHLEtBQUssT0FBTyxJQUFJLEdBQUcsS0FBSyxRQUFRO1FBQ3RELEdBQUcsS0FBSyxPQUFPLElBQUksR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDO1FBQ3pELENBQUMsSUFBSSxLQUFLLE1BQU0sSUFBSSxDQUFDLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUU7UUFDM0QsT0FBTyxvQkFBb0IsQ0FBQztLQUM3QjtJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLFNBQWMsRUFBRSxHQUFXLEVBQUUsSUFBWTtJQUNqRixPQUFPLGVBQWUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLE9BQU8sc0JBQXNCLEdBQUcsQ0FBQzs7Ozs7QUFBQSxVQUFTLElBQVksRUFBRSxLQUFjO0lBQzFFLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2QixPQUFPLElBQUksS0FBSyxrQkFBa0IsSUFBSSxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksS0FBSyxjQUFjO1lBQ2xGLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxLQUFLLFlBQVksSUFBSSxJQUFJLEtBQUssa0JBQWtCLENBQUM7S0FDL0U7SUFFRCxPQUFPLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMvQixDQUFDLEdBQW1CLENBQUM7Ozs7O0FBRXJCLE1BQU0sVUFBVSw4QkFBOEIsQ0FBQyxJQUFZO0lBQ3pELElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7Y0FDakMsR0FBRyxHQUFHLDhCQUE4QixJQUFJLHdDQUF3QztZQUNsRixlQUFlLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU87WUFDbkMsU0FBUyxJQUFJLG9FQUFvRTtZQUNqRixrQkFBa0I7UUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUN0QjtBQUNILENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLDhCQUE4QixDQUFDLElBQVk7SUFDekQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFOztjQUNqQyxHQUFHLEdBQUcsK0JBQStCLElBQUksd0NBQXdDO1lBQ25GLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTztRQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQzs7OztBQUVELFNBQVMsWUFBWTs7VUFDYixLQUFLLEdBQUcsUUFBUSxFQUFFO0lBQ3hCLE9BQU8sS0FBSyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NBTklUSVpFUn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9zdGF0ZSc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuXG5pbXBvcnQge0J5cGFzc1R5cGUsIGFsbG93U2FuaXRpemF0aW9uQnlwYXNzfSBmcm9tICcuL2J5cGFzcyc7XG5pbXBvcnQge19zYW5pdGl6ZUh0bWwgYXMgX3Nhbml0aXplSHRtbH0gZnJvbSAnLi9odG1sX3Nhbml0aXplcic7XG5pbXBvcnQge1Nhbml0aXplciwgU2VjdXJpdHlDb250ZXh0fSBmcm9tICcuL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBfc2FuaXRpemVTdHlsZSBhcyBfc2FuaXRpemVTdHlsZX0gZnJvbSAnLi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwgYXMgX3Nhbml0aXplVXJsfSBmcm9tICcuL3VybF9zYW5pdGl6ZXInO1xuXG5cblxuLyoqXG4gKiBBbiBgaHRtbGAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgaHRtbGAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXMgY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGBodG1sYCBhbmQgbG9jYXRlcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY29udGVudCAoc3VjaCBhcyB1cmxzIGFuZFxuICogamF2YXNjcmlwdCkgYW5kIHJlbW92ZXMgaXQuXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gbWFyayBhIHN0cmluZyBhcyB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0SHRtbH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZUh0bWwgdW50cnVzdGVkIGBodG1sYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgaHRtbGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gZGlzcGxheSB0byB1c2VyLCBiZWNhdXNlIGFsbCBvZiB0aGUgZGFuZ2Vyb3VzIGphdmFzY3JpcHRcbiAqIGFuZCB1cmxzIGhhdmUgYmVlbiByZW1vdmVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6Uc2FuaXRpemVIdG1sKHVuc2FmZUh0bWw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdW5zYWZlSHRtbCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZUh0bWwsIEJ5cGFzc1R5cGUuSHRtbCkpIHtcbiAgICByZXR1cm4gdW5zYWZlSHRtbC50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVIdG1sKGRvY3VtZW50LCByZW5kZXJTdHJpbmdpZnkodW5zYWZlSHRtbCkpO1xufVxuXG4vKipcbiAqIEEgYHN0eWxlYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGBzdHlsZWAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXMgY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGBzdHlsZWAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgdXJscyBhbmRcbiAqIGphdmFzY3JpcHQpIGFuZCByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0eWxlfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlU3R5bGUgdW50cnVzdGVkIGBzdHlsZWAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHN0eWxlYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3R5bGVgIHByb3BlcnRpZXMsIGJlY2F1c2UgYWxsIG9mIHRoZVxuICogZGFuZ2Vyb3VzIGphdmFzY3JpcHQgYW5kIHVybHMgaGF2ZSBiZWVuIHJlbW92ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRzYW5pdGl6ZVN0eWxlKHVuc2FmZVN0eWxlOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTYW5pdGl6ZXIoKTtcbiAgaWYgKHNhbml0aXplcikge1xuICAgIHJldHVybiBzYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlNUWUxFLCB1bnNhZmVTdHlsZSkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVN0eWxlLCBCeXBhc3NUeXBlLlN0eWxlKSkge1xuICAgIHJldHVybiB1bnNhZmVTdHlsZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVTdHlsZShyZW5kZXJTdHJpbmdpZnkodW5zYWZlU3R5bGUpKTtcbn1cblxuLyoqXG4gKiBBIGB1cmxgIHNhbml0aXplciB3aGljaCBjb252ZXJ0cyB1bnRydXN0ZWQgYHVybGAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXNcbiAqIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgdXJsYCBhbmQgbG9jYXRlcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY29udGVudCAoc3VjaCBhcyBqYXZhc2NyaXB0KSBhbmRcbiAqIHJlbW92ZXMgaXQuXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gbWFyayBhIHN0cmluZyBhcyB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0VXJsfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3JjYCBwcm9wZXJ0aWVzIHN1Y2ggYXMgYDxpbWcgc3JjPmAsIGJlY2F1c2VcbiAqIGFsbCBvZiB0aGUgZGFuZ2Vyb3VzIGphdmFzY3JpcHQgaGFzIGJlZW4gcmVtb3ZlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlHNhbml0aXplVXJsKHVuc2FmZVVybDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5VUkwsIHVuc2FmZVVybCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVVybCwgQnlwYXNzVHlwZS5VcmwpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVVybC50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVVcmwocmVuZGVyU3RyaW5naWZ5KHVuc2FmZVVybCkpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGB1cmxgcyB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHVybGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0UmVzb3VyY2VVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVSZXNvdXJjZVVybCB1bnRydXN0ZWQgYHVybGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHNyY2AgcHJvcGVydGllcyBzdWNoIGFzIGA8aW1nIHNyYz5gLCBiZWNhdXNlXG4gKiBvbmx5IHRydXN0ZWQgYHVybGBzIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRzYW5pdGl6ZVJlc291cmNlVXJsKHVuc2FmZVJlc291cmNlVXJsOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTYW5pdGl6ZXIoKTtcbiAgaWYgKHNhbml0aXplcikge1xuICAgIHJldHVybiBzYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlJFU09VUkNFX1VSTCwgdW5zYWZlUmVzb3VyY2VVcmwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVSZXNvdXJjZVVybCwgQnlwYXNzVHlwZS5SZXNvdXJjZVVybCkpIHtcbiAgICByZXR1cm4gdW5zYWZlUmVzb3VyY2VVcmwudG9TdHJpbmcoKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2FmZSB2YWx1ZSB1c2VkIGluIGEgcmVzb3VyY2UgVVJMIGNvbnRleHQgKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpJyk7XG59XG5cbi8qKlxuICogQSBgc2NyaXB0YCBzYW5pdGl6ZXIgd2hpY2ggb25seSBsZXRzIHRydXN0ZWQgamF2YXNjcmlwdCB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHNjcmlwdGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rXG4gKiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFNjcmlwdH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVNjcmlwdCB1bnRydXN0ZWQgYHNjcmlwdGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYDxzY3JpcHQ+YCBlbGVtZW50IHN1Y2ggYXMgYDxpbWcgc3JjPmAsXG4gKiBiZWNhdXNlIG9ubHkgdHJ1c3RlZCBgc2NyaXB0c2AgaGF2ZSBiZWVuIGFsbG93ZWQgdG8gcGFzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlHNhbml0aXplU2NyaXB0KHVuc2FmZVNjcmlwdDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TQ1JJUFQsIHVuc2FmZVNjcmlwdCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVNjcmlwdCwgQnlwYXNzVHlwZS5TY3JpcHQpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVNjcmlwdC50b1N0cmluZygpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcigndW5zYWZlIHZhbHVlIHVzZWQgaW4gYSBzY3JpcHQgY29udGV4dCcpO1xufVxuXG4vKipcbiAqIERldGVjdHMgd2hpY2ggc2FuaXRpemVyIHRvIHVzZSBmb3IgVVJMIHByb3BlcnR5LCBiYXNlZCBvbiB0YWcgbmFtZSBhbmQgcHJvcCBuYW1lLlxuICpcbiAqIFRoZSBydWxlcyBhcmUgYmFzZWQgb24gdGhlIFJFU09VUkNFX1VSTCBjb250ZXh0IGNvbmZpZyBmcm9tXG4gKiBgcGFja2FnZXMvY29tcGlsZXIvc3JjL3NjaGVtYS9kb21fc2VjdXJpdHlfc2NoZW1hLnRzYC5cbiAqIElmIHRhZyBhbmQgcHJvcCBuYW1lcyBkb24ndCBtYXRjaCBSZXNvdXJjZSBVUkwgc2NoZW1hLCB1c2UgVVJMIHNhbml0aXplci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFVybFNhbml0aXplcih0YWc6IHN0cmluZywgcHJvcDogc3RyaW5nKSB7XG4gIGlmICgocHJvcCA9PT0gJ3NyYycgJiYgKHRhZyA9PT0gJ2VtYmVkJyB8fCB0YWcgPT09ICdmcmFtZScgfHwgdGFnID09PSAnaWZyYW1lJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcgPT09ICdtZWRpYScgfHwgdGFnID09PSAnc2NyaXB0JykpIHx8XG4gICAgICAocHJvcCA9PT0gJ2hyZWYnICYmICh0YWcgPT09ICdiYXNlJyB8fCB0YWcgPT09ICdsaW5rJykpKSB7XG4gICAgcmV0dXJuIM6Uc2FuaXRpemVSZXNvdXJjZVVybDtcbiAgfVxuICByZXR1cm4gzpRzYW5pdGl6ZVVybDtcbn1cblxuLyoqXG4gKiBTYW5pdGl6ZXMgVVJMLCBzZWxlY3Rpbmcgc2FuaXRpemVyIGZ1bmN0aW9uIGJhc2VkIG9uIHRhZyBhbmQgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGluIGNhc2Ugd2UgY2FuJ3QgZGVmaW5lIHNlY3VyaXR5IGNvbnRleHQgYXQgY29tcGlsZSB0aW1lLCB3aGVuIG9ubHkgcHJvcFxuICogbmFtZSBpcyBhdmFpbGFibGUuIFRoaXMgaGFwcGVucyB3aGVuIHdlIGdlbmVyYXRlIGhvc3QgYmluZGluZ3MgZm9yIERpcmVjdGl2ZXMvQ29tcG9uZW50cy4gVGhlXG4gKiBob3N0IGVsZW1lbnQgaXMgdW5rbm93biBhdCBjb21waWxlIHRpbWUsIHNvIHdlIGRlZmVyIGNhbGN1bGF0aW9uIG9mIHNwZWNpZmljIHNhbml0aXplciB0b1xuICogcnVudGltZS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcGFyYW0gdGFnIHRhcmdldCBlbGVtZW50IHRhZyBuYW1lLlxuICogQHBhcmFtIHByb3AgbmFtZSBvZiB0aGUgcHJvcGVydHkgdGhhdCBjb250YWlucyB0aGUgdmFsdWUuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6Uc2FuaXRpemVVcmxPclJlc291cmNlVXJsKHVuc2FmZVVybDogYW55LCB0YWc6IHN0cmluZywgcHJvcDogc3RyaW5nKTogYW55IHtcbiAgcmV0dXJuIGdldFVybFNhbml0aXplcih0YWcsIHByb3ApKHVuc2FmZVVybCk7XG59XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgc3R5bGUgc2FuaXRpemVyIHdpbGwgaGFuZGxlIHNhbml0aXphdGlvbiBmb3Igc3R5bGUgcHJvcGVydGllcyBieVxuICogc2FuaXRpemluZyBhbnkgQ1NTIHByb3BlcnR5IHRoYXQgY2FuIGluY2x1ZGUgYSBgdXJsYCB2YWx1ZSAodXN1YWxseSBpbWFnZS1iYXNlZCBwcm9wZXJ0aWVzKVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IM6UZGVmYXVsdFN0eWxlU2FuaXRpemVyID0gKGZ1bmN0aW9uKHByb3A6IHN0cmluZywgdmFsdWU/OiBzdHJpbmcpOiBzdHJpbmcgfCBib29sZWFuIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcHJvcCA9PT0gJ2JhY2tncm91bmQtaW1hZ2UnIHx8IHByb3AgPT09ICdiYWNrZ3JvdW5kJyB8fCBwcm9wID09PSAnYm9yZGVyLWltYWdlJyB8fFxuICAgICAgICBwcm9wID09PSAnZmlsdGVyJyB8fCBwcm9wID09PSAnbGlzdC1zdHlsZScgfHwgcHJvcCA9PT0gJ2xpc3Qtc3R5bGUtaW1hZ2UnO1xuICB9XG5cbiAgcmV0dXJuIM6Uc2FuaXRpemVTdHlsZSh2YWx1ZSk7XG59IGFzIFN0eWxlU2FuaXRpemVGbik7XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgIGNvbnN0IG1zZyA9IGBCaW5kaW5nIHRvIGV2ZW50IHByb3BlcnR5ICcke25hbWV9JyBpcyBkaXNhbGxvd2VkIGZvciBzZWN1cml0eSByZWFzb25zLCBgICtcbiAgICAgICAgYHBsZWFzZSB1c2UgKCR7bmFtZS5zbGljZSgyKX0pPS4uLmAgK1xuICAgICAgICBgXFxuSWYgJyR7bmFtZX0nIGlzIGEgZGlyZWN0aXZlIGlucHV0LCBtYWtlIHN1cmUgdGhlIGRpcmVjdGl2ZSBpcyBpbXBvcnRlZCBieSB0aGVgICtcbiAgICAgICAgYCBjdXJyZW50IG1vZHVsZS5gO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMobmFtZTogc3RyaW5nKSB7XG4gIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnb24nKSkge1xuICAgIGNvbnN0IG1zZyA9IGBCaW5kaW5nIHRvIGV2ZW50IGF0dHJpYnV0ZSAnJHtuYW1lfScgaXMgZGlzYWxsb3dlZCBmb3Igc2VjdXJpdHkgcmVhc29ucywgYCArXG4gICAgICAgIGBwbGVhc2UgdXNlICgke25hbWUuc2xpY2UoMil9KT0uLi5gO1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNhbml0aXplcigpOiBTYW5pdGl6ZXJ8bnVsbCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGxWaWV3ICYmIGxWaWV3W1NBTklUSVpFUl07XG59XG4iXX0=