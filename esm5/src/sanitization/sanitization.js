/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SANITIZER } from '../render3/interfaces/view';
import { getLView } from '../render3/state';
import { renderStringify } from '../render3/util';
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
 * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustHtml}.
 *
 * @param unsafeHtml untrusted `html`, typically from the user.
 * @returns `html` string which is safe to display to user, because all of the dangerous javascript
 * and urls have been removed.
 */
export function sanitizeHtml(unsafeHtml) {
    var sanitizer = getSanitizer();
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
 * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustStyle}.
 *
 * @param unsafeStyle untrusted `style`, typically from the user.
 * @returns `style` string which is safe to bind to the `style` properties, because all of the
 * dangerous javascript and urls have been removed.
 */
export function sanitizeStyle(unsafeStyle) {
    var sanitizer = getSanitizer();
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
 * It is possible to mark a string as trusted by calling {@link bypassSanitizationTrustUrl}.
 *
 * @param unsafeUrl untrusted `url`, typically from the user.
 * @returns `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * all of the dangerous javascript has been removed.
 */
export function sanitizeUrl(unsafeUrl) {
    var sanitizer = getSanitizer();
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
 * This passes only `url`s marked trusted by calling {@link bypassSanitizationTrustResourceUrl}.
 *
 * @param unsafeResourceUrl untrusted `url`, typically from the user.
 * @returns `url` string which is safe to bind to the `src` properties such as `<img src>`, because
 * only trusted `url`s have been allowed to pass.
 */
export function sanitizeResourceUrl(unsafeResourceUrl) {
    var sanitizer = getSanitizer();
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
 * This passes only `script`s marked trusted by calling {@link
 * bypassSanitizationTrustScript}.
 *
 * @param unsafeScript untrusted `script`, typically from the user.
 * @returns `url` string which is safe to bind to the `<script>` element such as `<img src>`,
 * because only trusted `scripts` have been allowed to pass.
 */
export function sanitizeScript(unsafeScript) {
    var sanitizer = getSanitizer();
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
 */
export function getUrlSanitizer(tag, prop) {
    if ((prop === 'src' && (tag === 'embed' || tag === 'frame' || tag === 'iframe' ||
        tag === 'media' || tag === 'script')) ||
        (prop === 'href' && (tag === 'base' || tag === 'link'))) {
        return sanitizeResourceUrl;
    }
    return sanitizeUrl;
}
/**
 * Sanitizes URL, selecting sanitizer function based on tag and property names.
 *
 * This function is used in case we can't define security context at compile time, when only prop
 * name is available. This happens when we generate host bindings for Directives/Components. The
 * host element is unknown at compile time, so we defer calculation of specific sanitizer to
 * runtime.
 *
 * @param unsafeUrl untrusted `url`, typically from the user.
 * @param tag target element tag name.
 * @param prop name of the property that contains the value.
 * @returns `url` string which is safe to bind.
 */
export function sanitizeUrlOrResourceUrl(unsafeUrl, tag, prop) {
    return getUrlSanitizer(tag, prop)(unsafeUrl);
}
/**
 * The default style sanitizer will handle sanitization for style properties by
 * sanitizing any CSS property that can include a `url` value (usually image-based properties)
 */
export var defaultStyleSanitizer = function (prop, value) {
    if (value === undefined) {
        return prop === 'background-image' || prop === 'background' || prop === 'border-image' ||
            prop === 'filter' || prop === 'filter' || prop === 'list-style' ||
            prop === 'list-style-image';
    }
    return sanitizeStyle(value);
};
export function validateProperty(name) {
    if (name.toLowerCase().startsWith('on')) {
        var msg = "Binding to event property '" + name + "' is disallowed for security reasons, " +
            ("please use (" + name.slice(2) + ")=...") +
            ("\nIf '" + name + "' is a directive input, make sure the directive is imported by the") +
            " current module.";
        throw new Error(msg);
    }
}
export function validateAttribute(name) {
    if (name.toLowerCase().startsWith('on')) {
        var msg = "Binding to event attribute '" + name + "' is disallowed for security reasons, " +
            ("please use (" + name.slice(2) + ")=...");
        throw new Error(msg);
    }
}
function getSanitizer() {
    var lView = getLView();
    return lView && lView[SANITIZER];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FuaXRpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDckQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUVoRCxPQUFPLEVBQWEsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0QsT0FBTyxFQUFDLGFBQWEsSUFBSSxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNoRSxPQUFPLEVBQVksZUFBZSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3RELE9BQU8sRUFBa0IsY0FBYyxJQUFJLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BGLE9BQU8sRUFBQyxZQUFZLElBQUksWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFJN0Q7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxVQUFlO0lBQzFDLElBQU0sU0FBUyxHQUFHLFlBQVksRUFBRSxDQUFDO0lBQ2pDLElBQUksU0FBUyxFQUFFO1FBQ2IsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ25FO0lBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxVQUFVLG9CQUFrQixFQUFFO1FBQ3hELE9BQU8sVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQzlCO0lBQ0QsT0FBTyxhQUFhLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFF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O0lBQ3pCLE9BQU8sS0FBSyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NBTklUSVpFUn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9zdGF0ZSc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsJztcblxuaW1wb3J0IHtCeXBhc3NUeXBlLCBhbGxvd1Nhbml0aXphdGlvbkJ5cGFzc30gZnJvbSAnLi9ieXBhc3MnO1xuaW1wb3J0IHtfc2FuaXRpemVIdG1sIGFzIF9zYW5pdGl6ZUh0bWx9IGZyb20gJy4vaHRtbF9zYW5pdGl6ZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXIsIFNlY3VyaXR5Q29udGV4dH0gZnJvbSAnLi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgX3Nhbml0aXplU3R5bGUgYXMgX3Nhbml0aXplU3R5bGV9IGZyb20gJy4vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7X3Nhbml0aXplVXJsIGFzIF9zYW5pdGl6ZVVybH0gZnJvbSAnLi91cmxfc2FuaXRpemVyJztcblxuXG5cbi8qKlxuICogQW4gYGh0bWxgIHNhbml0aXplciB3aGljaCBjb252ZXJ0cyB1bnRydXN0ZWQgYGh0bWxgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgaHRtbGAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgdXJscyBhbmRcbiAqIGphdmFzY3JpcHQpIGFuZCByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdEh0bWx9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVIdG1sIHVudHJ1c3RlZCBgaHRtbGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYGh0bWxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGRpc3BsYXkgdG8gdXNlciwgYmVjYXVzZSBhbGwgb2YgdGhlIGRhbmdlcm91cyBqYXZhc2NyaXB0XG4gKiBhbmQgdXJscyBoYXZlIGJlZW4gcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplSHRtbCh1bnNhZmVIdG1sOiBhbnkpOiBzdHJpbmcge1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTYW5pdGl6ZXIoKTtcbiAgaWYgKHNhbml0aXplcikge1xuICAgIHJldHVybiBzYW5pdGl6ZXIuc2FuaXRpemUoU2VjdXJpdHlDb250ZXh0LkhUTUwsIHVuc2FmZUh0bWwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVIdG1sLCBCeXBhc3NUeXBlLkh0bWwpKSB7XG4gICAgcmV0dXJuIHVuc2FmZUh0bWwudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gX3Nhbml0aXplSHRtbChkb2N1bWVudCwgcmVuZGVyU3RyaW5naWZ5KHVuc2FmZUh0bWwpKTtcbn1cblxuLyoqXG4gKiBBIGBzdHlsZWAgc2FuaXRpemVyIHdoaWNoIGNvbnZlcnRzIHVudHJ1c3RlZCBgc3R5bGVgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzIGNvbnRlbnQuXG4gKlxuICogVGhpcyBtZXRob2QgcGFyc2VzIHRoZSBgc3R5bGVgIGFuZCBsb2NhdGVzIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjb250ZW50IChzdWNoIGFzIHVybHMgYW5kXG4gKiBqYXZhc2NyaXB0KSBhbmQgcmVtb3ZlcyBpdC5cbiAqXG4gKiBJdCBpcyBwb3NzaWJsZSB0byBtYXJrIGEgc3RyaW5nIGFzIHRydXN0ZWQgYnkgY2FsbGluZyB7QGxpbmsgYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTdHlsZX0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVN0eWxlIHVudHJ1c3RlZCBgc3R5bGVgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGBzdHlsZWAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHN0eWxlYCBwcm9wZXJ0aWVzLCBiZWNhdXNlIGFsbCBvZiB0aGVcbiAqIGRhbmdlcm91cyBqYXZhc2NyaXB0IGFuZCB1cmxzIGhhdmUgYmVlbiByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVTdHlsZSh1bnNhZmVTdHlsZTogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TVFlMRSwgdW5zYWZlU3R5bGUpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVTdHlsZSwgQnlwYXNzVHlwZS5TdHlsZSkpIHtcbiAgICByZXR1cm4gdW5zYWZlU3R5bGUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gX3Nhbml0aXplU3R5bGUocmVuZGVyU3RyaW5naWZ5KHVuc2FmZVN0eWxlKSk7XG59XG5cbi8qKlxuICogQSBgdXJsYCBzYW5pdGl6ZXIgd2hpY2ggY29udmVydHMgdW50cnVzdGVkIGB1cmxgICoqc3RyaW5nKiogaW50byB0cnVzdGVkIHN0cmluZyBieSByZW1vdmluZ1xuICogZGFuZ2Vyb3VzXG4gKiBjb250ZW50LlxuICpcbiAqIFRoaXMgbWV0aG9kIHBhcnNlcyB0aGUgYHVybGAgYW5kIGxvY2F0ZXMgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNvbnRlbnQgKHN1Y2ggYXMgamF2YXNjcmlwdCkgYW5kXG4gKiByZW1vdmVzIGl0LlxuICpcbiAqIEl0IGlzIHBvc3NpYmxlIHRvIG1hcmsgYSBzdHJpbmcgYXMgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFVybH0uXG4gKlxuICogQHBhcmFtIHVuc2FmZVVybCB1bnRydXN0ZWQgYHVybGAsIHR5cGljYWxseSBmcm9tIHRoZSB1c2VyLlxuICogQHJldHVybnMgYHVybGAgc3RyaW5nIHdoaWNoIGlzIHNhZmUgdG8gYmluZCB0byB0aGUgYHNyY2AgcHJvcGVydGllcyBzdWNoIGFzIGA8aW1nIHNyYz5gLCBiZWNhdXNlXG4gKiBhbGwgb2YgdGhlIGRhbmdlcm91cyBqYXZhc2NyaXB0IGhhcyBiZWVuIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVVybCh1bnNhZmVVcmw6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuVVJMLCB1bnNhZmVVcmwpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVVcmwsIEJ5cGFzc1R5cGUuVXJsKSkge1xuICAgIHJldHVybiB1bnNhZmVVcmwudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gX3Nhbml0aXplVXJsKHJlbmRlclN0cmluZ2lmeSh1bnNhZmVVcmwpKTtcbn1cblxuLyoqXG4gKiBBIGB1cmxgIHNhbml0aXplciB3aGljaCBvbmx5IGxldHMgdHJ1c3RlZCBgdXJsYHMgdGhyb3VnaC5cbiAqXG4gKiBUaGlzIHBhc3NlcyBvbmx5IGB1cmxgcyBtYXJrZWQgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGluayBieXBhc3NTYW5pdGl6YXRpb25UcnVzdFJlc291cmNlVXJsfS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlUmVzb3VyY2VVcmwgdW50cnVzdGVkIGB1cmxgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGBzcmNgIHByb3BlcnRpZXMgc3VjaCBhcyBgPGltZyBzcmM+YCwgYmVjYXVzZVxuICogb25seSB0cnVzdGVkIGB1cmxgcyBoYXZlIGJlZW4gYWxsb3dlZCB0byBwYXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVSZXNvdXJjZVVybCh1bnNhZmVSZXNvdXJjZVVybDogYW55KTogc3RyaW5nIHtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U2FuaXRpemVyKCk7XG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5SRVNPVVJDRV9VUkwsIHVuc2FmZVJlc291cmNlVXJsKSB8fCAnJztcbiAgfVxuICBpZiAoYWxsb3dTYW5pdGl6YXRpb25CeXBhc3ModW5zYWZlUmVzb3VyY2VVcmwsIEJ5cGFzc1R5cGUuUmVzb3VyY2VVcmwpKSB7XG4gICAgcmV0dXJuIHVuc2FmZVJlc291cmNlVXJsLnRvU3RyaW5nKCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnNhZmUgdmFsdWUgdXNlZCBpbiBhIHJlc291cmNlIFVSTCBjb250ZXh0IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKScpO1xufVxuXG4vKipcbiAqIEEgYHNjcmlwdGAgc2FuaXRpemVyIHdoaWNoIG9ubHkgbGV0cyB0cnVzdGVkIGphdmFzY3JpcHQgdGhyb3VnaC5cbiAqXG4gKiBUaGlzIHBhc3NlcyBvbmx5IGBzY3JpcHRgcyBtYXJrZWQgdHJ1c3RlZCBieSBjYWxsaW5nIHtAbGlua1xuICogYnlwYXNzU2FuaXRpemF0aW9uVHJ1c3RTY3JpcHR9LlxuICpcbiAqIEBwYXJhbSB1bnNhZmVTY3JpcHQgdW50cnVzdGVkIGBzY3JpcHRgLCB0eXBpY2FsbHkgZnJvbSB0aGUgdXNlci5cbiAqIEByZXR1cm5zIGB1cmxgIHN0cmluZyB3aGljaCBpcyBzYWZlIHRvIGJpbmQgdG8gdGhlIGA8c2NyaXB0PmAgZWxlbWVudCBzdWNoIGFzIGA8aW1nIHNyYz5gLFxuICogYmVjYXVzZSBvbmx5IHRydXN0ZWQgYHNjcmlwdHNgIGhhdmUgYmVlbiBhbGxvd2VkIHRvIHBhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVNjcmlwdCh1bnNhZmVTY3JpcHQ6IGFueSk6IHN0cmluZyB7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldFNhbml0aXplcigpO1xuICBpZiAoc2FuaXRpemVyKSB7XG4gICAgcmV0dXJuIHNhbml0aXplci5zYW5pdGl6ZShTZWN1cml0eUNvbnRleHQuU0NSSVBULCB1bnNhZmVTY3JpcHQpIHx8ICcnO1xuICB9XG4gIGlmIChhbGxvd1Nhbml0aXphdGlvbkJ5cGFzcyh1bnNhZmVTY3JpcHQsIEJ5cGFzc1R5cGUuU2NyaXB0KSkge1xuICAgIHJldHVybiB1bnNhZmVTY3JpcHQudG9TdHJpbmcoKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2FmZSB2YWx1ZSB1c2VkIGluIGEgc2NyaXB0IGNvbnRleHQnKTtcbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoaWNoIHNhbml0aXplciB0byB1c2UgZm9yIFVSTCBwcm9wZXJ0eSwgYmFzZWQgb24gdGFnIG5hbWUgYW5kIHByb3AgbmFtZS5cbiAqXG4gKiBUaGUgcnVsZXMgYXJlIGJhc2VkIG9uIHRoZSBSRVNPVVJDRV9VUkwgY29udGV4dCBjb25maWcgZnJvbVxuICogYHBhY2thZ2VzL2NvbXBpbGVyL3NyYy9zY2hlbWEvZG9tX3NlY3VyaXR5X3NjaGVtYS50c2AuXG4gKiBJZiB0YWcgYW5kIHByb3AgbmFtZXMgZG9uJ3QgbWF0Y2ggUmVzb3VyY2UgVVJMIHNjaGVtYSwgdXNlIFVSTCBzYW5pdGl6ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRVcmxTYW5pdGl6ZXIodGFnOiBzdHJpbmcsIHByb3A6IHN0cmluZykge1xuICBpZiAoKHByb3AgPT09ICdzcmMnICYmICh0YWcgPT09ICdlbWJlZCcgfHwgdGFnID09PSAnZnJhbWUnIHx8IHRhZyA9PT0gJ2lmcmFtZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnID09PSAnbWVkaWEnIHx8IHRhZyA9PT0gJ3NjcmlwdCcpKSB8fFxuICAgICAgKHByb3AgPT09ICdocmVmJyAmJiAodGFnID09PSAnYmFzZScgfHwgdGFnID09PSAnbGluaycpKSkge1xuICAgIHJldHVybiBzYW5pdGl6ZVJlc291cmNlVXJsO1xuICB9XG4gIHJldHVybiBzYW5pdGl6ZVVybDtcbn1cblxuLyoqXG4gKiBTYW5pdGl6ZXMgVVJMLCBzZWxlY3Rpbmcgc2FuaXRpemVyIGZ1bmN0aW9uIGJhc2VkIG9uIHRhZyBhbmQgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGluIGNhc2Ugd2UgY2FuJ3QgZGVmaW5lIHNlY3VyaXR5IGNvbnRleHQgYXQgY29tcGlsZSB0aW1lLCB3aGVuIG9ubHkgcHJvcFxuICogbmFtZSBpcyBhdmFpbGFibGUuIFRoaXMgaGFwcGVucyB3aGVuIHdlIGdlbmVyYXRlIGhvc3QgYmluZGluZ3MgZm9yIERpcmVjdGl2ZXMvQ29tcG9uZW50cy4gVGhlXG4gKiBob3N0IGVsZW1lbnQgaXMgdW5rbm93biBhdCBjb21waWxlIHRpbWUsIHNvIHdlIGRlZmVyIGNhbGN1bGF0aW9uIG9mIHNwZWNpZmljIHNhbml0aXplciB0b1xuICogcnVudGltZS5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlVXJsIHVudHJ1c3RlZCBgdXJsYCwgdHlwaWNhbGx5IGZyb20gdGhlIHVzZXIuXG4gKiBAcGFyYW0gdGFnIHRhcmdldCBlbGVtZW50IHRhZyBuYW1lLlxuICogQHBhcmFtIHByb3AgbmFtZSBvZiB0aGUgcHJvcGVydHkgdGhhdCBjb250YWlucyB0aGUgdmFsdWUuXG4gKiBAcmV0dXJucyBgdXJsYCBzdHJpbmcgd2hpY2ggaXMgc2FmZSB0byBiaW5kLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVVcmxPclJlc291cmNlVXJsKHVuc2FmZVVybDogYW55LCB0YWc6IHN0cmluZywgcHJvcDogc3RyaW5nKTogYW55IHtcbiAgcmV0dXJuIGdldFVybFNhbml0aXplcih0YWcsIHByb3ApKHVuc2FmZVVybCk7XG59XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgc3R5bGUgc2FuaXRpemVyIHdpbGwgaGFuZGxlIHNhbml0aXphdGlvbiBmb3Igc3R5bGUgcHJvcGVydGllcyBieVxuICogc2FuaXRpemluZyBhbnkgQ1NTIHByb3BlcnR5IHRoYXQgY2FuIGluY2x1ZGUgYSBgdXJsYCB2YWx1ZSAodXN1YWxseSBpbWFnZS1iYXNlZCBwcm9wZXJ0aWVzKVxuICovXG5leHBvcnQgY29uc3QgZGVmYXVsdFN0eWxlU2FuaXRpemVyID0gKGZ1bmN0aW9uKHByb3A6IHN0cmluZywgdmFsdWU/OiBzdHJpbmcpOiBzdHJpbmcgfCBib29sZWFuIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcHJvcCA9PT0gJ2JhY2tncm91bmQtaW1hZ2UnIHx8IHByb3AgPT09ICdiYWNrZ3JvdW5kJyB8fCBwcm9wID09PSAnYm9yZGVyLWltYWdlJyB8fFxuICAgICAgICBwcm9wID09PSAnZmlsdGVyJyB8fCBwcm9wID09PSAnZmlsdGVyJyB8fCBwcm9wID09PSAnbGlzdC1zdHlsZScgfHxcbiAgICAgICAgcHJvcCA9PT0gJ2xpc3Qtc3R5bGUtaW1hZ2UnO1xuICB9XG5cbiAgcmV0dXJuIHNhbml0aXplU3R5bGUodmFsdWUpO1xufSBhcyBTdHlsZVNhbml0aXplRm4pO1xuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQcm9wZXJ0eShuYW1lOiBzdHJpbmcpIHtcbiAgaWYgKG5hbWUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdvbicpKSB7XG4gICAgY29uc3QgbXNnID0gYEJpbmRpbmcgdG8gZXZlbnQgcHJvcGVydHkgJyR7bmFtZX0nIGlzIGRpc2FsbG93ZWQgZm9yIHNlY3VyaXR5IHJlYXNvbnMsIGAgK1xuICAgICAgICBgcGxlYXNlIHVzZSAoJHtuYW1lLnNsaWNlKDIpfSk9Li4uYCArXG4gICAgICAgIGBcXG5JZiAnJHtuYW1lfScgaXMgYSBkaXJlY3RpdmUgaW5wdXQsIG1ha2Ugc3VyZSB0aGUgZGlyZWN0aXZlIGlzIGltcG9ydGVkIGJ5IHRoZWAgK1xuICAgICAgICBgIGN1cnJlbnQgbW9kdWxlLmA7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQXR0cmlidXRlKG5hbWU6IHN0cmluZykge1xuICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ29uJykpIHtcbiAgICBjb25zdCBtc2cgPSBgQmluZGluZyB0byBldmVudCBhdHRyaWJ1dGUgJyR7bmFtZX0nIGlzIGRpc2FsbG93ZWQgZm9yIHNlY3VyaXR5IHJlYXNvbnMsIGAgK1xuICAgICAgICBgcGxlYXNlIHVzZSAoJHtuYW1lLnNsaWNlKDIpfSk9Li4uYDtcbiAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRTYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIHJldHVybiBsVmlldyAmJiBsVmlld1tTQU5JVElaRVJdO1xufSJdfQ==