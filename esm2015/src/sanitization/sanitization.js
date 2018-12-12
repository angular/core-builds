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
import { SANITIZER } from '../render3/interfaces/view';
import { getLView } from '../render3/state';
import { stringify } from '../render3/util';
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
 * @param {?} unsafeHtml untrusted `html`, typically from the user.
 * @return {?} `html` string which is safe to display to user, because all of the dangerous javascript
 * and urls have been removed.
 */
export function sanitizeHtml(unsafeHtml) {
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.HTML, unsafeHtml) || '';
    }
    if (allowSanitizationBypass(unsafeHtml, "Html" /* Html */)) {
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
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.STYLE, unsafeStyle) || '';
    }
    if (allowSanitizationBypass(unsafeStyle, "Style" /* Style */)) {
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
    /** @type {?} */
    const sanitizer = getSanitizer();
    if (sanitizer) {
        return sanitizer.sanitize(SecurityContext.URL, unsafeUrl) || '';
    }
    if (allowSanitizationBypass(unsafeUrl, "Url" /* Url */)) {
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
 * @param {?} unsafeScript untrusted `script`, typically from the user.
 * @return {?} `url` string which is safe to bind to the `<script>` element such as `<img src>`,
 * because only trusted `scripts` have been allowed to pass.
 */
export function sanitizeScript(unsafeScript) {
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
/** *
 * The default style sanitizer will handle sanitization for style properties by
 * sanitizing any CSS property that can include a `url` value (usually image-based properties)
  @type {?} */
export const defaultStyleSanitizer = (/** @type {?} */ (function (prop, value) {
    if (value === undefined) {
        return prop === 'background-image' || prop === 'background' || prop === 'border-image' ||
            prop === 'filter' || prop === 'filter' || prop === 'list-style' ||
            prop === 'list-style-image';
    }
    return sanitizeStyle(value);
}));
/**
 * @return {?}
 */
function getSanitizer() {
    /** @type {?} */
    const lView = getLView();
    return lView && lView[SANITIZER];
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTFDLE9BQU8sRUFBYSx1QkFBdUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxJQUFJLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hFLE9BQU8sRUFBWSxlQUFlLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDdEQsT0FBTyxFQUFrQixjQUFjLElBQUksY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDcEYsT0FBTyxFQUFDLFlBQVksSUFBSSxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFpQjdELE1BQU0sVUFBVSxZQUFZLENBQUMsVUFBZTs7SUFDMUMsTUFBTSxTQUFTLEdBQUcsWUFBWSxFQUFFLENBQUM7SUFDakMsSUFBSSxTQUFTLEVBQUU7UUFDYixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDbkU7SUFDRCxJQUFJLHVCQUF1QixDQUFDLFVBQVUsb0JBQWtCLEVBQUU7UUFDeEQsT0FBTyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDOUI7SUFDRCxPQUFPLGFBQWEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Q0FDdkQ7Ozs7Ozs7Ozs7Ozs7O0FBZUQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxXQUFnQjs7SUFDNUMsTUFBTSxTQUFTLEdBQUcsWUFBWSxFQUFFLENBQUM7SUFDakMsSUFBSSxTQUFTLEVBQUU7UUFDYixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDckU7SUFDRCxJQUFJLHVCQUF1QixDQUFDLFdBQVcsc0JBQW1CLEVBQUU7UUFDMUQsT0FBTyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDL0I7SUFDRCxPQUFPLGNBQWMsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztDQUMvQzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELE1BQU0sVUFBVSxXQUFXLENBQUMsU0FBYzs7SUFDeEMsTUFBTSxTQUFTLEdBQUcsWUFBWSxFQUFFLENBQUM7SUFDakMsSUFBSSxTQUFTLEVBQUU7UUFDYixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDakU7SUFDRCxJQUFJLHVCQUF1QixDQUFDLFNBQVMsa0JBQWlCLEVBQUU7UUFDdEQsT0FBTyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDN0I7SUFDRCxPQUFPLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztDQUMzQzs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxpQkFBc0I7O0lBQ3hELE1BQU0sU0FBUyxHQUFHLFlBQVksRUFBRSxDQUFDO0lBQ2pDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDbEY7SUFDRCxJQUFJLHVCQUF1QixDQUFDLGlCQUFpQixrQ0FBeUIsRUFBRTtRQUN0RSxPQUFPLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ3JDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQywrRUFBK0UsQ0FBQyxDQUFDO0NBQ2xHOzs7Ozs7Ozs7OztBQVlELE1BQU0sVUFBVSxjQUFjLENBQUMsWUFBaUI7O0lBQzlDLE1BQU0sU0FBUyxHQUFHLFlBQVksRUFBRSxDQUFDO0lBQ2pDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3ZFO0lBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxZQUFZLHdCQUFvQixFQUFFO1FBQzVELE9BQU8sWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ2hDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0NBQzFEOzs7OztBQU1ELGFBQWEscUJBQXFCLEdBQUcsbUJBQUMsVUFBUyxJQUFZLEVBQUUsS0FBYztJQUN6RSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsT0FBTyxJQUFJLEtBQUssa0JBQWtCLElBQUksSUFBSSxLQUFLLFlBQVksSUFBSSxJQUFJLEtBQUssY0FBYztZQUNsRixJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxLQUFLLFlBQVk7WUFDL0QsSUFBSSxLQUFLLGtCQUFrQixDQUFDO0tBQ2pDO0lBRUQsT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDVixFQUFDLENBQUM7Ozs7QUFFdEIsU0FBUyxZQUFZOztJQUNuQixNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixPQUFPLEtBQUssSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Q0FDbEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U0FOSVRJWkVSfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3fSBmcm9tICcuLi9yZW5kZXIzL3N0YXRlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwnO1xuXG5pbXBvcnQge0J5cGFzc1R5cGUsIGFsbG93U2FuaXRpemF0aW9uQnlwYXNzfSBmcm9tICcuL2J5cGFzcyc7XG5pbXBvcnQge19zYW5pdGl6ZUh0bWwgYXMgX3Nhbml0aXplSHRtbH0gZnJvbSAnLi9odG1sX3Nhbml0aXplcic7XG5pbXBvcnQge1Nhbml0aXplciwgU2VjdXJpdHlDb250ZXh0fSBmcm9tICcuL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBfc2FuaXRpemVTdHlsZSBhcyBfc2FuaXRpemVTdHlsZX0gZnJvbSAnLi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwgYXMgX3Nhbml0aXplVXJsfSBmcm9tICcuL3VybF9zYW5pdGl6ZXInO1xuXG5cblxuLyoqXG4gKiBBbiBgaHRtbGAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgaHRtbGAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXMgY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGBodG1sYCBhbmQgbG9jYXRlcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY29udGVudCAoc3VjaCBhcyB1cmxzIGFuZFxuICogamF2YXNjcmlwdCkgYW5kIHJlbW92ZXMgaXQuXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gbWFyayBhIHN0cmluZyBhcyB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0SHRtbH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZUh0bWwgdW50cnVzdGVkIGBodG1sYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgaHRtbGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gZGlzcGxheSB0byB1c2VyLCBiZWNhdXNlIGFsbCBvZiB0aGUgZGFuZ2Vyb3VzIGphdmFzY3JpcHRcbiAqIGFuZCB1cmxzIGhhdmUgYmVlbiByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVIdG1sKHVuc2FmZUh0bWw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuSFRNTCwgdW5zYWZlSHRtbCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZUh0bWwsIEJ5cGFzc1R5cGUuSHRtbCkpIHtcbiAgICByZXR1cm4gdW5zYWZlSHRtbC50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVIdG1sKGRvY3VtZW50LCBzdHJpbmdpZnkodW5zYWZlSHRtbCkpO1xufVxuXG4vKipcbiAqIEEgYHN0eWxlYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGBzdHlsZWAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXMgY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGBzdHlsZWAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgdXJscyBhbmRcbiAqIGphdmFzY3JpcHQpIGFuZCByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFN0eWxlfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlU3R5bGUgdW50cnVzdGVkIGBzdHlsZWAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHN0eWxlYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3R5bGVgIHByb3BlcnRpZXMsIGJlY2F1c2UgYWxsIG9mIHRoZVxuICogZGFuZ2Vyb3VzIGphdmFzY3JpcHQgYW5kIHVybHMgaGF2ZSBiZWVuIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVN0eWxlKHVuc2FmZVN0eWxlOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTYW5pdGl6ZXIoKTtcbiAgaWYgKHNhbml0aXplcikge1xuICAgIHJldHVybiBzYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlNUWUxFLCB1bnNhZmVTdHlsZSkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVN0eWxlLCBCeXBhc3NUeXBlLlN0eWxlKSkge1xuICAgIHJldHVybiB1bnNhZmVTdHlsZS50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVTdHlsZShzdHJpbmdpZnkodW5zYWZlU3R5bGUpKTtcbn1cblxuLyoqXG4gKiBBIGB1cmxgIHNhbml0aXplciB3aGljaCBjb252ZXJ0cyB1bnRydXN0ZWQgYHVybGAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXNcbiAqIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgdXJsYCBhbmQgbG9jYXRlcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY29udGVudCAoc3VjaCBhcyBqYXZhc2NyaXB0KSBhbmRcbiAqIHJlbW92ZXMgaXQuXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gbWFyayBhIHN0cmluZyBhcyB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0VXJsfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kIHRvIHRoZSBgc3JjYCBwcm9wZXJ0aWVzIHN1Y2ggYXMgYDxpbWcgc3JjPmAsIGJlY2F1c2VcbiAqIGFsbCBvZiB0aGUgZGFuZ2Vyb3VzIGphdmFzY3JpcHQgaGFzIGJlZW4gcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplVXJsKHVuc2FmZVVybDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5VUkwsIHVuc2FmZVVybCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVVybCwgQnlwYXNzVHlwZS5VcmwpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVVybC50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVVcmwoc3RyaW5naWZ5KHVuc2FmZVVybCkpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGB1cmxgcyB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHVybGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0UmVzb3VyY2VVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVSZXNvdXJjZVVybCB1bnRydXN0ZWQgYHVybGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHNyY2AgcHJvcGVydGllcyBzdWNoIGFzIGA8aW1nIHNyYz5gLCBiZWNhdXNlXG4gKiBvbmx5IHRydXN0ZWQgYHVybGBzIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVJlc291cmNlVXJsKHVuc2FmZVJlc291cmNlVXJsOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTYW5pdGl6ZXIoKTtcbiAgaWYgKHNhbml0aXplcikge1xuICAgIHJldHVybiBzYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlJFU09VUkNFX1VSTCwgdW5zYWZlUmVzb3VyY2VVcmwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVSZXNvdXJjZVVybCwgQnlwYXNzVHlwZS5SZXNvdXJjZVVybCkpIHtcbiAgICByZXR1cm4gdW5zYWZlUmVzb3VyY2VVcmwudG9TdHJpbmcoKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2FmZSB2YWx1ZSB1c2VkIGluIGEgcmVzb3VyY2UgVVJMIGNvbnRleHQgKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpJyk7XG59XG5cbi8qKlxuICogQSBgc2NyaXB0YCBzYW5pdGl6ZXIgd2hpY2ggb25seSBsZXRzIHRydXN0ZWQgamF2YXNjcmlwdCB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHNjcmlwdGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rXG4gKiBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFNjcmlwdH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVNjcmlwdCB1bnRydXN0ZWQgYHNjcmlwdGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYDxzY3JpcHQ+YCBlbGVtZW50IHN1Y2ggYXMgYDxpbWcgc3JjPmAsXG4gKiBiZWNhdXNlIG9ubHkgdHJ1c3RlZCBgc2NyaXB0c2AgaGF2ZSBiZWVuIGFsbG93ZWQgdG8gcGFzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplU2NyaXB0KHVuc2FmZVNjcmlwdDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TQ1JJUFQsIHVuc2FmZVNjcmlwdCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVNjcmlwdCwgQnlwYXNzVHlwZS5TY3JpcHQpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVNjcmlwdC50b1N0cmluZygpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcigndW5zYWZlIHZhbHVlIHVzZWQgaW4gYSBzY3JpcHQgY29udGV4dCcpO1xufVxuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHN0eWxlIHNhbml0aXplciB3aWxsIGhhbmRsZSBzYW5pdGl6YXRpb24gZm9yIHN0eWxlIHByb3BlcnRpZXMgYnlcbiAqIHNhbml0aXppbmcgYW55IENTUyBwcm9wZXJ0eSB0aGF0IGNhbiBpbmNsdWRlIGEgYHVybGAgdmFsdWUgKHVzdWFsbHkgaW1hZ2UtYmFzZWQgcHJvcGVydGllcylcbiAqL1xuZXhwb3J0IGNvbnN0IGRlZmF1bHRTdHlsZVNhbml0aXplciA9IChmdW5jdGlvbihwcm9wOiBzdHJpbmcsIHZhbHVlPzogc3RyaW5nKTogc3RyaW5nIHwgYm9vbGVhbiB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHByb3AgPT09ICdiYWNrZ3JvdW5kLWltYWdlJyB8fCBwcm9wID09PSAnYmFja2dyb3VuZCcgfHwgcHJvcCA9PT0gJ2JvcmRlci1pbWFnZScgfHxcbiAgICAgICAgcHJvcCA9PT0gJ2ZpbHRlcicgfHwgcHJvcCA9PT0gJ2ZpbHRlcicgfHwgcHJvcCA9PT0gJ2xpc3Qtc3R5bGUnIHx8XG4gICAgICAgIHByb3AgPT09ICdsaXN0LXN0eWxlLWltYWdlJztcbiAgfVxuXG4gIHJldHVybiBzYW5pdGl6ZVN0eWxlKHZhbHVlKTtcbn0gYXMgU3R5bGVTYW5pdGl6ZUZuKTtcblxuZnVuY3Rpb24gZ2V0U2FuaXRpemVyKCk6IFNhbml0aXplcnxudWxsIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICByZXR1cm4gbFZpZXcgJiYgbFZpZXdbU0FOSVRJWkVSXTtcbn0iXX0=