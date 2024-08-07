/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { trustedHTMLFromString } from '../util/security/trusted_types';
/**
 * This helper is used to get hold of an inert tree of DOM elements containing dirty HTML
 * that needs sanitizing.
 * Depending upon browser support we use one of two strategies for doing this.
 * Default: DOMParser strategy
 * Fallback: InertDocument strategy
 */
export function getInertBodyHelper(defaultDoc) {
    const inertDocumentHelper = new InertDocumentHelper(defaultDoc);
    return isDOMParserAvailable() ? new DOMParserHelper(inertDocumentHelper) : inertDocumentHelper;
}
/**
 * Uses DOMParser to create and fill an inert body element.
 * This is the default strategy used in browsers that support it.
 */
class DOMParserHelper {
    constructor(inertDocumentHelper) {
        this.inertDocumentHelper = inertDocumentHelper;
    }
    getInertBodyElement(html) {
        // We add these extra elements to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
        // `<head>` tag. Note that the `<body>` tag is closed implicitly to prevent unclosed tags
        // in `html` from consuming the otherwise explicit `</body>` tag.
        html = '<body><remove></remove>' + html;
        try {
            const body = new window.DOMParser().parseFromString(trustedHTMLFromString(html), 'text/html').body;
            if (body === null) {
                // In some browsers (e.g. Mozilla/5.0 iPad AppleWebKit Mobile) the `body` property only
                // becomes available in the following tick of the JS engine. In that case we fall back to
                // the `inertDocumentHelper` instead.
                return this.inertDocumentHelper.getInertBodyElement(html);
            }
            body.firstChild?.remove();
            return body;
        }
        catch {
            return null;
        }
    }
}
/**
 * Use an HTML5 `template` element to create and fill an inert DOM element.
 * This is the fallback strategy if the browser does not support DOMParser.
 */
class InertDocumentHelper {
    constructor(defaultDoc) {
        this.defaultDoc = defaultDoc;
        this.inertDocument = this.defaultDoc.implementation.createHTMLDocument('sanitization-inert');
    }
    getInertBodyElement(html) {
        const templateEl = this.inertDocument.createElement('template');
        templateEl.innerHTML = trustedHTMLFromString(html);
        return templateEl;
    }
}
/**
 * We need to determine whether the DOMParser exists in the global context and
 * supports parsing HTML; HTML parsing support is not as wide as other formats, see
 * https://developer.mozilla.org/en-US/docs/Web/API/DOMParser#Browser_compatibility.
 *
 * @suppress {uselessCode}
 */
export function isDOMParserAvailable() {
    try {
        return !!new window.DOMParser().parseFromString(trustedHTMLFromString(''), 'text/html');
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5lcnRfYm9keS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi9pbmVydF9ib2R5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBRXJFOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxVQUFvQjtJQUNyRCxNQUFNLG1CQUFtQixHQUFHLElBQUksbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDaEUsT0FBTyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQztBQUNqRyxDQUFDO0FBU0Q7OztHQUdHO0FBQ0gsTUFBTSxlQUFlO0lBQ25CLFlBQW9CLG1CQUFvQztRQUFwQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQWlCO0lBQUcsQ0FBQztJQUU1RCxtQkFBbUIsQ0FBQyxJQUFZO1FBQzlCLDJGQUEyRjtRQUMzRix5RkFBeUY7UUFDekYseUZBQXlGO1FBQ3pGLGlFQUFpRTtRQUNqRSxJQUFJLEdBQUcseUJBQXlCLEdBQUcsSUFBSSxDQUFDO1FBQ3hDLElBQUksQ0FBQztZQUNILE1BQU0sSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLGVBQWUsQ0FDakQscUJBQXFCLENBQUMsSUFBSSxDQUFXLEVBQ3JDLFdBQVcsQ0FDWixDQUFDLElBQXVCLENBQUM7WUFDMUIsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ2xCLHVGQUF1RjtnQkFDdkYseUZBQXlGO2dCQUN6RixxQ0FBcUM7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELENBQUM7WUFDRCxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQzFCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNQLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILE1BQU0sbUJBQW1CO0lBR3ZCLFlBQW9CLFVBQW9CO1FBQXBCLGVBQVUsR0FBVixVQUFVLENBQVU7UUFDdEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQy9GLENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxJQUFZO1FBQzlCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2hFLFVBQVUsQ0FBQyxTQUFTLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFXLENBQUM7UUFDN0QsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztDQUNGO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxlQUFlLENBQzdDLHFCQUFxQixDQUFDLEVBQUUsQ0FBVyxFQUNuQyxXQUFXLENBQ1osQ0FBQztJQUNKLENBQUM7SUFBQyxNQUFNLENBQUM7UUFDUCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7dHJ1c3RlZEhUTUxGcm9tU3RyaW5nfSBmcm9tICcuLi91dGlsL3NlY3VyaXR5L3RydXN0ZWRfdHlwZXMnO1xuXG4vKipcbiAqIFRoaXMgaGVscGVyIGlzIHVzZWQgdG8gZ2V0IGhvbGQgb2YgYW4gaW5lcnQgdHJlZSBvZiBET00gZWxlbWVudHMgY29udGFpbmluZyBkaXJ0eSBIVE1MXG4gKiB0aGF0IG5lZWRzIHNhbml0aXppbmcuXG4gKiBEZXBlbmRpbmcgdXBvbiBicm93c2VyIHN1cHBvcnQgd2UgdXNlIG9uZSBvZiB0d28gc3RyYXRlZ2llcyBmb3IgZG9pbmcgdGhpcy5cbiAqIERlZmF1bHQ6IERPTVBhcnNlciBzdHJhdGVneVxuICogRmFsbGJhY2s6IEluZXJ0RG9jdW1lbnQgc3RyYXRlZ3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluZXJ0Qm9keUhlbHBlcihkZWZhdWx0RG9jOiBEb2N1bWVudCk6IEluZXJ0Qm9keUhlbHBlciB7XG4gIGNvbnN0IGluZXJ0RG9jdW1lbnRIZWxwZXIgPSBuZXcgSW5lcnREb2N1bWVudEhlbHBlcihkZWZhdWx0RG9jKTtcbiAgcmV0dXJuIGlzRE9NUGFyc2VyQXZhaWxhYmxlKCkgPyBuZXcgRE9NUGFyc2VySGVscGVyKGluZXJ0RG9jdW1lbnRIZWxwZXIpIDogaW5lcnREb2N1bWVudEhlbHBlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmVydEJvZHlIZWxwZXIge1xuICAvKipcbiAgICogR2V0IGFuIGluZXJ0IERPTSBlbGVtZW50IGNvbnRhaW5pbmcgRE9NIGNyZWF0ZWQgZnJvbSB0aGUgZGlydHkgSFRNTCBzdHJpbmcgcHJvdmlkZWQuXG4gICAqL1xuICBnZXRJbmVydEJvZHlFbGVtZW50OiAoaHRtbDogc3RyaW5nKSA9PiBIVE1MRWxlbWVudCB8IG51bGw7XG59XG5cbi8qKlxuICogVXNlcyBET01QYXJzZXIgdG8gY3JlYXRlIGFuZCBmaWxsIGFuIGluZXJ0IGJvZHkgZWxlbWVudC5cbiAqIFRoaXMgaXMgdGhlIGRlZmF1bHQgc3RyYXRlZ3kgdXNlZCBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgaXQuXG4gKi9cbmNsYXNzIERPTVBhcnNlckhlbHBlciBpbXBsZW1lbnRzIEluZXJ0Qm9keUhlbHBlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaW5lcnREb2N1bWVudEhlbHBlcjogSW5lcnRCb2R5SGVscGVyKSB7fVxuXG4gIGdldEluZXJ0Qm9keUVsZW1lbnQoaHRtbDogc3RyaW5nKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICAvLyBXZSBhZGQgdGhlc2UgZXh0cmEgZWxlbWVudHMgdG8gZW5zdXJlIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIGNvbnRlbnQgaXMgcGFyc2VkIGFzIGV4cGVjdGVkXG4gICAgLy8gZS5nLiBsZWFkaW5nIHdoaXRlc3BhY2UgaXMgbWFpbnRhaW5lZCBhbmQgdGFncyBsaWtlIGA8bWV0YT5gIGRvIG5vdCBnZXQgaG9pc3RlZCB0byB0aGVcbiAgICAvLyBgPGhlYWQ+YCB0YWcuIE5vdGUgdGhhdCB0aGUgYDxib2R5PmAgdGFnIGlzIGNsb3NlZCBpbXBsaWNpdGx5IHRvIHByZXZlbnQgdW5jbG9zZWQgdGFnc1xuICAgIC8vIGluIGBodG1sYCBmcm9tIGNvbnN1bWluZyB0aGUgb3RoZXJ3aXNlIGV4cGxpY2l0IGA8L2JvZHk+YCB0YWcuXG4gICAgaHRtbCA9ICc8Ym9keT48cmVtb3ZlPjwvcmVtb3ZlPicgKyBodG1sO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBib2R5ID0gbmV3IHdpbmRvdy5ET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoXG4gICAgICAgIHRydXN0ZWRIVE1MRnJvbVN0cmluZyhodG1sKSBhcyBzdHJpbmcsXG4gICAgICAgICd0ZXh0L2h0bWwnLFxuICAgICAgKS5ib2R5IGFzIEhUTUxCb2R5RWxlbWVudDtcbiAgICAgIGlmIChib2R5ID09PSBudWxsKSB7XG4gICAgICAgIC8vIEluIHNvbWUgYnJvd3NlcnMgKGUuZy4gTW96aWxsYS81LjAgaVBhZCBBcHBsZVdlYktpdCBNb2JpbGUpIHRoZSBgYm9keWAgcHJvcGVydHkgb25seVxuICAgICAgICAvLyBiZWNvbWVzIGF2YWlsYWJsZSBpbiB0aGUgZm9sbG93aW5nIHRpY2sgb2YgdGhlIEpTIGVuZ2luZS4gSW4gdGhhdCBjYXNlIHdlIGZhbGwgYmFjayB0b1xuICAgICAgICAvLyB0aGUgYGluZXJ0RG9jdW1lbnRIZWxwZXJgIGluc3RlYWQuXG4gICAgICAgIHJldHVybiB0aGlzLmluZXJ0RG9jdW1lbnRIZWxwZXIuZ2V0SW5lcnRCb2R5RWxlbWVudChodG1sKTtcbiAgICAgIH1cbiAgICAgIGJvZHkuZmlyc3RDaGlsZD8ucmVtb3ZlKCk7XG4gICAgICByZXR1cm4gYm9keTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVzZSBhbiBIVE1MNSBgdGVtcGxhdGVgIGVsZW1lbnQgdG8gY3JlYXRlIGFuZCBmaWxsIGFuIGluZXJ0IERPTSBlbGVtZW50LlxuICogVGhpcyBpcyB0aGUgZmFsbGJhY2sgc3RyYXRlZ3kgaWYgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBET01QYXJzZXIuXG4gKi9cbmNsYXNzIEluZXJ0RG9jdW1lbnRIZWxwZXIgaW1wbGVtZW50cyBJbmVydEJvZHlIZWxwZXIge1xuICBwcml2YXRlIGluZXJ0RG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVmYXVsdERvYzogRG9jdW1lbnQpIHtcbiAgICB0aGlzLmluZXJ0RG9jdW1lbnQgPSB0aGlzLmRlZmF1bHREb2MuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCdzYW5pdGl6YXRpb24taW5lcnQnKTtcbiAgfVxuXG4gIGdldEluZXJ0Qm9keUVsZW1lbnQoaHRtbDogc3RyaW5nKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCB0ZW1wbGF0ZUVsID0gdGhpcy5pbmVydERvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgdGVtcGxhdGVFbC5pbm5lckhUTUwgPSB0cnVzdGVkSFRNTEZyb21TdHJpbmcoaHRtbCkgYXMgc3RyaW5nO1xuICAgIHJldHVybiB0ZW1wbGF0ZUVsO1xuICB9XG59XG5cbi8qKlxuICogV2UgbmVlZCB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgRE9NUGFyc2VyIGV4aXN0cyBpbiB0aGUgZ2xvYmFsIGNvbnRleHQgYW5kXG4gKiBzdXBwb3J0cyBwYXJzaW5nIEhUTUw7IEhUTUwgcGFyc2luZyBzdXBwb3J0IGlzIG5vdCBhcyB3aWRlIGFzIG90aGVyIGZvcm1hdHMsIHNlZVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0RPTVBhcnNlciNCcm93c2VyX2NvbXBhdGliaWxpdHkuXG4gKlxuICogQHN1cHByZXNzIHt1c2VsZXNzQ29kZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRE9NUGFyc2VyQXZhaWxhYmxlKCkge1xuICB0cnkge1xuICAgIHJldHVybiAhIW5ldyB3aW5kb3cuRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKFxuICAgICAgdHJ1c3RlZEhUTUxGcm9tU3RyaW5nKCcnKSBhcyBzdHJpbmcsXG4gICAgICAndGV4dC9odG1sJyxcbiAgICApO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdfQ==