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
import { getCurrentSanitizer } from '../render3/state';
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
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.HTML, unsafeHtml) || '';
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
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.STYLE, unsafeStyle) || '';
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
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.URL, unsafeUrl) || '';
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
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.RESOURCE_URL, unsafeResourceUrl) || '';
    }
    if (allowSanitizationBypass(unsafeResourceUrl, "ResourceUrl" /* ResourceUrl */)) {
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
    /** @type {?} */
    const s = getCurrentSanitizer();
    if (s) {
        return s.sanitize(SecurityContext.SCRIPT, unsafeScript) || '';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUUxQyxPQUFPLEVBQWEsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0QsT0FBTyxFQUFDLGFBQWEsSUFBSSxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNoRSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzNDLE9BQU8sRUFBa0IsY0FBYyxJQUFJLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BGLE9BQU8sRUFBQyxZQUFZLElBQUksWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBaUI3RCxNQUFNLFVBQVUsWUFBWSxDQUFDLFVBQWU7O0lBQzFDLE1BQU0sQ0FBQyxHQUFHLG1CQUFtQixFQUFFLENBQUM7SUFDaEMsSUFBSSxDQUFDLEVBQUU7UUFDTCxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDM0Q7SUFDRCxJQUFJLHVCQUF1QixDQUFDLFVBQVUsb0JBQWtCLEVBQUU7UUFDeEQsT0FBTyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDOUI7SUFDRCxPQUFPLGFBQWEsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Q0FDdkQ7Ozs7Ozs7Ozs7Ozs7O0FBZUQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxXQUFnQjs7SUFDNUMsTUFBTSxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztJQUNoQyxJQUFJLENBQUMsRUFBRTtRQUNMLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUM3RDtJQUNELElBQUksdUJBQXVCLENBQUMsV0FBVyxzQkFBbUIsRUFBRTtRQUMxRCxPQUFPLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUMvQjtJQUNELE9BQU8sY0FBYyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0NBQy9DOzs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxTQUFjOztJQUN4QyxNQUFNLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxFQUFFO1FBQ0wsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3pEO0lBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxTQUFTLGtCQUFpQixFQUFFO1FBQ3RELE9BQU8sU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzdCO0lBQ0QsT0FBTyxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Q0FDM0M7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsaUJBQXNCOztJQUN4RCxNQUFNLENBQUMsR0FBRyxtQkFBbUIsRUFBRSxDQUFDO0lBQ2hDLElBQUksQ0FBQyxFQUFFO1FBQ0wsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDMUU7SUFDRCxJQUFJLHVCQUF1QixDQUFDLGlCQUFpQixrQ0FBeUIsRUFBRTtRQUN0RSxPQUFPLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ3JDO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQywrRUFBK0UsQ0FBQyxDQUFDO0NBQ2xHOzs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxZQUFpQjs7SUFDOUMsTUFBTSxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztJQUNoQyxJQUFJLENBQUMsRUFBRTtRQUNMLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUMvRDtJQUNELElBQUksdUJBQXVCLENBQUMsWUFBWSx3QkFBb0IsRUFBRTtRQUM1RCxPQUFPLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUNoQztJQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLENBQUMsQ0FBQztDQUMxRDs7Ozs7QUFNRCxhQUFhLHFCQUFxQixHQUFHLG1CQUFDLFVBQVMsSUFBWSxFQUFFLEtBQWM7SUFDekUsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sSUFBSSxLQUFLLGtCQUFrQixJQUFJLElBQUksS0FBSyxZQUFZLElBQUksSUFBSSxLQUFLLGNBQWM7WUFDbEYsSUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksS0FBSyxZQUFZO1lBQy9ELElBQUksS0FBSyxrQkFBa0IsQ0FBQztLQUNqQztJQUVELE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ1YsRUFBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dldEN1cnJlbnRTYW5pdGl6ZXJ9IGZyb20gJy4uL3JlbmRlcjMvc3RhdGUnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbCc7XG5cbmltcG9ydCB7QnlwYXNzVHlwZSwgYWxsb3dTYW5pdGl6YXRpb25CeXBhc3N9IGZyb20gJy4vYnlwYXNzJztcbmltcG9ydCB7X3Nhbml0aXplSHRtbCBhcyBfc2FuaXRpemVIdG1sfSBmcm9tICcuL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7U2VjdXJpdHlDb250ZXh0fSBmcm9tICcuL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBfc2FuaXRpemVTdHlsZSBhcyBfc2FuaXRpemVTdHlsZX0gZnJvbSAnLi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwgYXMgX3Nhbml0aXplVXJsfSBmcm9tICcuL3VybF9zYW5pdGl6ZXInO1xuXG5cblxuLyoqXG4gKiBBbiBgaHRtbGAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgaHRtbGAgKipzdHJpbmcqKiBpbnRvIHRydXN0ZWQgc3RyaW5nIGJ5IHJlbW92aW5nXG4gKiBkYW5nZXJvdXMgY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGBodG1sYCBhbmQgbG9jYXRlcyBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY29udGVudCAoc3VjaCBhcyB1cmxzIGFuZFxuICogamF2YXNjcmlwdCkgYW5kIHJlbW92ZXMgaXQuXG4gKlxuICogSXQgaXMgcG9zc2libGUgdG8gbWFyayBhIHN0cmluZyBhcyB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0SHRtbH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZUh0bWwgdW50cnVzdGVkIGBodG1sYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcmV0dXJucyBgaHRtbGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gZGlzcGxheSB0byB1c2VyLCBiZWNhdXNlIGFsbCBvZiB0aGUgZGFuZ2Vyb3VzIGphdmFzY3JpcHRcbiAqIGFuZCB1cmxzIGhhdmUgYmVlbiByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVIdG1sKHVuc2FmZUh0bWw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBnZXRDdXJyZW50U2FuaXRpemVyKCk7XG4gIGlmIChzKSB7XG4gICAgcmV0dXJuIHMuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LkhUTUwsIHVuc2FmZUh0bWwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVIdG1sLCBCeXBhc3NUeXBlLkh0bWwpKSB7XG4gICAgcmV0dXJuIHVuc2FmZUh0bWwudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gX3Nhbml0aXplSHRtbChkb2N1bWVudCwgc3RyaW5naWZ5KHVuc2FmZUh0bWwpKTtcbn1cblxuLyoqXG4gKiBBIGBzdHlsZWAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgc3R5bGVgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgc3R5bGVgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIHVybHMgYW5kXG4gKiBqYXZhc2NyaXB0KSBhbmQgcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHlsZX0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVN0eWxlIHVudHJ1c3RlZCBgc3R5bGVgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGBzdHlsZWAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHN0eWxlYCBwcm9wZXJ0aWVzLCBiZWNhdXNlIGFsbCBvZiB0aGVcbiAqIGRhbmdlcm91cyBqYXZhc2NyaXB0IGFuZCB1cmxzIGhhdmUgYmVlbiByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVTdHlsZSh1bnNhZmVTdHlsZTogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IGdldEN1cnJlbnRTYW5pdGl6ZXIoKTtcbiAgaWYgKHMpIHtcbiAgICByZXR1cm4gcy5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuU1RZTEUsIHVuc2FmZVN0eWxlKSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3ModW5zYWZlU3R5bGUsIEJ5cGFzc1R5cGUuU3R5bGUpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVN0eWxlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIF9zYW5pdGl6ZVN0eWxlKHN0cmluZ2lmeSh1bnNhZmVTdHlsZSkpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgdXJsYCAqKnN0cmluZyoqIGludG8gdHJ1c3RlZCBzdHJpbmcgYnkgcmVtb3ZpbmdcbiAqIGRhbmdlcm91c1xuICogY29udGVudC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBwYXJzZXMgdGhlIGB1cmxgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIGphdmFzY3JpcHQpIGFuZFxuICogcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVVcmwgdW50cnVzdGVkIGB1cmxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGBzcmNgIHByb3BlcnRpZXMgc3VjaCBhcyBgPGltZyBzcmM+YCwgYmVjYXVzZVxuICogYWxsIG9mIHRoZSBkYW5nZXJvdXMgamF2YXNjcmlwdCBoYXMgYmVlbiByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVVcmwodW5zYWZlVXJsOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzID0gZ2V0Q3VycmVudFNhbml0aXplcigpO1xuICBpZiAocykge1xuICAgIHJldHVybiBzLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5VUkwsIHVuc2FmZVVybCkgfHwgJyc7XG4gIH1cbiAgaWYgKGFsbG93U2FuaXRpemF0aW9uQnlwYXNzKHVuc2FmZVVybCwgQnlwYXNzVHlwZS5VcmwpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVVybC50b1N0cmluZygpO1xuICB9XG4gIHJldHVybiBfc2FuaXRpemVVcmwoc3RyaW5naWZ5KHVuc2FmZVVybCkpO1xufVxuXG4vKipcbiAqIEEgYHVybGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGB1cmxgcyB0aHJvdWdoLlxuICpcbiAqIFRoaXMgcGFzc2VzIG9ubHkgYHVybGBzIG1hcmtlZCB0cnVzdGVkIGJ5IGNhbGxpbmcge0BsaW5rIGJ5cGFzc1Nhbml0aXphdGlvblRydXN0UmVzb3VyY2VVcmx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVSZXNvdXJjZVVybCB1bnRydXN0ZWQgYHVybGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHNyY2AgcHJvcGVydGllcyBzdWNoIGFzIGA8aW1nIHNyYz5gLCBiZWNhdXNlXG4gKiBvbmx5IHRydXN0ZWQgYHVybGBzIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVJlc291cmNlVXJsKHVuc2FmZVJlc291cmNlVXJsOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzID0gZ2V0Q3VycmVudFNhbml0aXplcigpO1xuICBpZiAocykge1xuICAgIHJldHVybiBzLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5SRVNPVVJDRV9VUkwsIHVuc2FmZVJlc291cmNlVXJsKSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3ModW5zYWZlUmVzb3VyY2VVcmwsIEJ5cGFzc1R5cGUuUmVzb3VyY2VVcmwpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVJlc291cmNlVXJsLnRvU3RyaW5nKCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnNhZmUgdmFsdWUgdXNlZCBpbiBhIHJlc291cmNlIFVSTCBjb250ZXh0IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKScpO1xufVxuXG4vKipcbiAqIEEgYHNjcmlwdGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGphdmFzY3JpcHQgdGhyb3VnaC5cbiAqXG4gKiBUaGlzIHBhc3NlcyBvbmx5IGBzY3JpcHRgcyBtYXJrZWQgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFNjcmlwdH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVNjcmlwdCB1bnRydXN0ZWQgYHNjcmlwdGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYDxzY3JpcHQ+YCBlbGVtZW50IHN1Y2ggYXMgYDxpbWcgc3JjPmAsXG4gKiBiZWNhdXNlIG9ubHkgdHJ1c3RlZCBgc2NyaXB0c2BzIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVNjcmlwdCh1bnNhZmVTY3JpcHQ6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHMgPSBnZXRDdXJyZW50U2FuaXRpemVyKCk7XG4gIGlmIChzKSB7XG4gICAgcmV0dXJuIHMuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LlNDUklQVCwgdW5zYWZlU2NyaXB0KSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3ModW5zYWZlU2NyaXB0LCBCeXBhc3NUeXBlLlNjcmlwdCkpIHtcbiAgICByZXR1cm4gdW5zYWZlU2NyaXB0LnRvU3RyaW5nKCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnNhZmUgdmFsdWUgdXNlZCBpbiBhIHNjcmlwdCBjb250ZXh0Jyk7XG59XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgc3R5bGUgc2FuaXRpemVyIHdpbGwgaGFuZGxlIHNhbml0aXphdGlvbiBmb3Igc3R5bGUgcHJvcGVydGllcyBieVxuICogc2FuaXRpemluZyBhbnkgQ1NTIHByb3BlcnR5IHRoYXQgY2FuIGluY2x1ZGUgYSBgdXJsYCB2YWx1ZSAodXN1YWxseSBpbWFnZS1iYXNlZCBwcm9wZXJ0aWVzKVxuICovXG5leHBvcnQgY29uc3QgZGVmYXVsdFN0eWxlU2FuaXRpemVyID0gKGZ1bmN0aW9uKHByb3A6IHN0cmluZywgdmFsdWU/OiBzdHJpbmcpOiBzdHJpbmcgfCBib29sZWFuIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcHJvcCA9PT0gJ2JhY2tncm91bmQtaW1hZ2UnIHx8IHByb3AgPT09ICdiYWNrZ3JvdW5kJyB8fCBwcm9wID09PSAnYm9yZGVyLWltYWdlJyB8fFxuICAgICAgICBwcm9wID09PSAnZmlsdGVyJyB8fCBwcm9wID09PSAnZmlsdGVyJyB8fCBwcm9wID09PSAnbGlzdC1zdHlsZScgfHxcbiAgICAgICAgcHJvcCA9PT0gJ2xpc3Qtc3R5bGUtaW1hZ2UnO1xuICB9XG5cbiAgcmV0dXJuIHNhbml0aXplU3R5bGUodmFsdWUpO1xufSBhcyBTdHlsZVNhbml0aXplRm4pO1xuIl19