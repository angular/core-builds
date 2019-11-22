/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/sanitization/inert_body.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * This helper class is used to get hold of an inert tree of DOM elements containing dirty HTML
 * that needs sanitizing.
 * Depending upon browser support we must use one of three strategies for doing this.
 * Support: Safari 10.x -> XHR strategy
 * Support: Firefox -> DomParser strategy
 * Default: InertDocument strategy
 */
export class InertBodyHelper {
    /**
     * @param {?} defaultDoc
     */
    constructor(defaultDoc) {
        this.defaultDoc = defaultDoc;
        this.inertDocument = this.defaultDoc.implementation.createHTMLDocument('sanitization-inert');
        this.inertBodyElement = this.inertDocument.body;
        if (this.inertBodyElement == null) {
            // usually there should be only one body element in the document, but IE doesn't have any, so
            // we need to create one.
            /** @type {?} */
            const inertHtml = this.inertDocument.createElement('html');
            this.inertDocument.appendChild(inertHtml);
            this.inertBodyElement = this.inertDocument.createElement('body');
            inertHtml.appendChild(this.inertBodyElement);
        }
        this.inertBodyElement.innerHTML = '<svg><g onload="this.parentNode.remove()"></g></svg>';
        if (this.inertBodyElement.querySelector && !this.inertBodyElement.querySelector('svg')) {
            // We just hit the Safari 10.1 bug - which allows JS to run inside the SVG G element
            // so use the XHR strategy.
            this.getInertBodyElement = this.getInertBodyElement_XHR;
            return;
        }
        this.inertBodyElement.innerHTML =
            '<svg><p><style><img src="</style><img src=x onerror=alert(1)//">';
        if (this.inertBodyElement.querySelector && this.inertBodyElement.querySelector('svg img')) {
            // We just hit the Firefox bug - which prevents the inner img JS from being sanitized
            // so use the DOMParser strategy, if it is available.
            // If the DOMParser is not available then we are not in Firefox (Server/WebWorker?) so we
            // fall through to the default strategy below.
            if (isDOMParserAvailable()) {
                this.getInertBodyElement = this.getInertBodyElement_DOMParser;
                return;
            }
        }
        // None of the bugs were hit so it is safe for us to use the default InertDocument strategy
        this.getInertBodyElement = this.getInertBodyElement_InertDocument;
    }
    /**
     * Use XHR to create and fill an inert body element (on Safari 10.1)
     * See
     * https://github.com/cure53/DOMPurify/blob/a992d3a75031cb8bb032e5ea8399ba972bdf9a65/src/purify.js#L439-L449
     * @private
     * @param {?} html
     * @return {?}
     */
    getInertBodyElement_XHR(html) {
        // We add these extra elements to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
        // `<head>` tag.
        html = '<body><remove></remove>' + html + '</body>';
        try {
            html = encodeURI(html);
        }
        catch (_a) {
            return null;
        }
        /** @type {?} */
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'document';
        xhr.open('GET', 'data:text/html;charset=utf-8,' + html, false);
        xhr.send(undefined);
        /** @type {?} */
        const body = xhr.response.body;
        body.removeChild((/** @type {?} */ (body.firstChild)));
        return body;
    }
    /**
     * Use DOMParser to create and fill an inert body element (on Firefox)
     * See https://github.com/cure53/DOMPurify/releases/tag/0.6.7
     *
     * @private
     * @param {?} html
     * @return {?}
     */
    getInertBodyElement_DOMParser(html) {
        // We add these extra elements to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
        // `<head>` tag.
        html = '<body><remove></remove>' + html + '</body>';
        try {
            /** @type {?} */
            const body = (/** @type {?} */ (new ((/** @type {?} */ (window)))
                .DOMParser()
                .parseFromString(html, 'text/html')
                .body));
            body.removeChild((/** @type {?} */ (body.firstChild)));
            return body;
        }
        catch (_a) {
            return null;
        }
    }
    /**
     * Use an HTML5 `template` element, if supported, or an inert body element created via
     * `createHtmlDocument` to create and fill an inert DOM element.
     * This is the default sane strategy to use if the browser does not require one of the specialised
     * strategies above.
     * @private
     * @param {?} html
     * @return {?}
     */
    getInertBodyElement_InertDocument(html) {
        // Prefer using <template> element if supported.
        /** @type {?} */
        const templateEl = this.inertDocument.createElement('template');
        if ('content' in templateEl) {
            templateEl.innerHTML = html;
            return templateEl;
        }
        this.inertBodyElement.innerHTML = html;
        // Support: IE 9-11 only
        // strip custom-namespaced attributes on IE<=11
        if (((/** @type {?} */ (this.defaultDoc))).documentMode) {
            this.stripCustomNsAttrs(this.inertBodyElement);
        }
        return this.inertBodyElement;
    }
    /**
     * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1'
     * attribute to declare ns1 namespace and prefixes the attribute with 'ns1' (e.g.
     * 'ns1:xlink:foo').
     *
     * This is undesirable since we don't want to allow any of these custom attributes. This method
     * strips them all.
     * @private
     * @param {?} el
     * @return {?}
     */
    stripCustomNsAttrs(el) {
        /** @type {?} */
        const elAttrs = el.attributes;
        // loop backwards so that we can support removals.
        for (let i = elAttrs.length - 1; 0 < i; i--) {
            /** @type {?} */
            const attrib = elAttrs.item(i);
            /** @type {?} */
            const attrName = (/** @type {?} */ (attrib)).name;
            if (attrName === 'xmlns:ns1' || attrName.indexOf('ns1:') === 0) {
                el.removeAttribute(attrName);
            }
        }
        /** @type {?} */
        let childNode = (/** @type {?} */ (el.firstChild));
        while (childNode) {
            if (childNode.nodeType === Node.ELEMENT_NODE)
                this.stripCustomNsAttrs((/** @type {?} */ (childNode)));
            childNode = childNode.nextSibling;
        }
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    InertBodyHelper.prototype.inertBodyElement;
    /**
     * @type {?}
     * @private
     */
    InertBodyHelper.prototype.inertDocument;
    /**
     * Get an inert DOM element containing DOM created from the dirty HTML string provided.
     * The implementation of this is determined in the constructor, when the class is instantiated.
     * @type {?}
     */
    InertBodyHelper.prototype.getInertBodyElement;
    /**
     * @type {?}
     * @private
     */
    InertBodyHelper.prototype.defaultDoc;
}
/**
 * We need to determine whether the DOMParser exists in the global context.
 * The try-catch is because, on some browsers, trying to access this property
 * on window can actually throw an error.
 *
 * @suppress {uselessCode}
 * @return {?}
 */
function isDOMParserAvailable() {
    try {
        return !!((/** @type {?} */ (window))).DOMParser;
    }
    catch (_a) {
        return false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5lcnRfYm9keS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi9pbmVydF9ib2R5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JBLE1BQU0sT0FBTyxlQUFlOzs7O0lBSTFCLFlBQW9CLFVBQW9CO1FBQXBCLGVBQVUsR0FBVixVQUFVLENBQVU7UUFDdEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzdGLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQztRQUVoRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLEVBQUU7Ozs7a0JBRzNCLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7WUFDMUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pFLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLHNEQUFzRCxDQUFDO1FBQ3pGLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDdEYsb0ZBQW9GO1lBQ3BGLDJCQUEyQjtZQUMzQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDO1lBQ3hELE9B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Q0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2tCQUNyQyxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O2tCQUN4QixRQUFRLEdBQUcsbUJBQUEsTUFBTSxFQUFFLENBQUMsSUFBSTtZQUM5QixJQUFJLFFBQVEsS0FBSyxXQUFXLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzlELEVBQUUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDOUI7U0FDRjs7WUFDRyxTQUFTLEdBQUcsbUJBQUEsRUFBRSxDQUFDLFVBQVUsRUFBZTtRQUM1QyxPQUFPLFNBQVMsRUFBRTtZQUNoQixJQUFJLFNBQVMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVk7Z0JBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLG1CQUFBLFNBQVMsRUFBVyxDQUFDLENBQUM7WUFDNUYsU0FBUyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7U0FDbkM7SUFDSCxDQUFDO0NBQ0Y7Ozs7OztJQTlJQywyQ0FBc0M7Ozs7O0lBQ3RDLHdDQUFnQzs7Ozs7O0lBNENoQyw4Q0FBMEQ7Ozs7O0lBMUM5QyxxQ0FBNEI7Ozs7Ozs7Ozs7QUFvSjFDLFNBQVMsb0JBQW9CO0lBQzNCLElBQUk7UUFDRixPQUFPLENBQUMsQ0FBQyxDQUFDLG1CQUFBLE1BQU0sRUFBTyxDQUFDLENBQUMsU0FBUyxDQUFDO0tBQ3BDO0lBQUMsV0FBTTtRQUNOLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRoaXMgaGVscGVyIGNsYXNzIGlzIHVzZWQgdG8gZ2V0IGhvbGQgb2YgYW4gaW5lcnQgdHJlZSBvZiBET00gZWxlbWVudHMgY29udGFpbmluZyBkaXJ0eSBIVE1MXG4gKiB0aGF0IG5lZWRzIHNhbml0aXppbmcuXG4gKiBEZXBlbmRpbmcgdXBvbiBicm93c2VyIHN1cHBvcnQgd2UgbXVzdCB1c2Ugb25lIG9mIHRocmVlIHN0cmF0ZWdpZXMgZm9yIGRvaW5nIHRoaXMuXG4gKiBTdXBwb3J0OiBTYWZhcmkgMTAueCAtPiBYSFIgc3RyYXRlZ3lcbiAqIFN1cHBvcnQ6IEZpcmVmb3ggLT4gRG9tUGFyc2VyIHN0cmF0ZWd5XG4gKiBEZWZhdWx0OiBJbmVydERvY3VtZW50IHN0cmF0ZWd5XG4gKi9cbmV4cG9ydCBjbGFzcyBJbmVydEJvZHlIZWxwZXIge1xuICBwcml2YXRlIGluZXJ0Qm9keUVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGluZXJ0RG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVmYXVsdERvYzogRG9jdW1lbnQpIHtcbiAgICB0aGlzLmluZXJ0RG9jdW1lbnQgPSB0aGlzLmRlZmF1bHREb2MuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCdzYW5pdGl6YXRpb24taW5lcnQnKTtcbiAgICB0aGlzLmluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmluZXJ0RG9jdW1lbnQuYm9keTtcblxuICAgIGlmICh0aGlzLmluZXJ0Qm9keUVsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgLy8gdXN1YWxseSB0aGVyZSBzaG91bGQgYmUgb25seSBvbmUgYm9keSBlbGVtZW50IGluIHRoZSBkb2N1bWVudCwgYnV0IElFIGRvZXNuJ3QgaGF2ZSBhbnksIHNvXG4gICAgICAvLyB3ZSBuZWVkIHRvIGNyZWF0ZSBvbmUuXG4gICAgICBjb25zdCBpbmVydEh0bWwgPSB0aGlzLmluZXJ0RG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaHRtbCcpO1xuICAgICAgdGhpcy5pbmVydERvY3VtZW50LmFwcGVuZENoaWxkKGluZXJ0SHRtbCk7XG4gICAgICB0aGlzLmluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmluZXJ0RG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYm9keScpO1xuICAgICAgaW5lcnRIdG1sLmFwcGVuZENoaWxkKHRoaXMuaW5lcnRCb2R5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5pbmVydEJvZHlFbGVtZW50LmlubmVySFRNTCA9ICc8c3ZnPjxnIG9ubG9hZD1cInRoaXMucGFyZW50Tm9kZS5yZW1vdmUoKVwiPjwvZz48L3N2Zz4nO1xuICAgIGlmICh0aGlzLmluZXJ0Qm9keUVsZW1lbnQucXVlcnlTZWxlY3RvciAmJiAhdGhpcy5pbmVydEJvZHlFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3N2ZycpKSB7XG4gICAgICAvLyBXZSBqdXN0IGhpdCB0aGUgU2FmYXJpIDEwLjEgYnVnIC0gd2hpY2ggYWxsb3dzIEpTIHRvIHJ1biBpbnNpZGUgdGhlIFNWRyBHIGVsZW1lbnRcbiAgICAgIC8vIHNvIHVzZSB0aGUgWEhSIHN0cmF0ZWd5LlxuICAgICAgdGhpcy5nZXRJbmVydEJvZHlFbGVtZW50ID0gdGhpcy5nZXRJbmVydEJvZHlFbGVtZW50X1hIUjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmluZXJ0Qm9keUVsZW1lbnQuaW5uZXJIVE1MID1cbiAgICAgICAgJzxzdmc+PHA+PHN0eWxlPjxpbWcgc3JjPVwiPC9zdHlsZT48aW1nIHNyYz14IG9uZXJyb3I9YWxlcnQoMSkvL1wiPic7XG4gICAgaWYgKHRoaXMuaW5lcnRCb2R5RWxlbWVudC5xdWVyeVNlbGVjdG9yICYmIHRoaXMuaW5lcnRCb2R5RWxlbWVudC5xdWVyeVNlbGVjdG9yKCdzdmcgaW1nJykpIHtcbiAgICAgIC8vIFdlIGp1c3QgaGl0IHRoZSBGaXJlZm94IGJ1ZyAtIHdoaWNoIHByZXZlbnRzIHRoZSBpbm5lciBpbWcgSlMgZnJvbSBiZWluZyBzYW5pdGl6ZWRcbiAgICAgIC8vIHNvIHVzZSB0aGUgRE9NUGFyc2VyIHN0cmF0ZWd5LCBpZiBpdCBpcyBhdmFpbGFibGUuXG4gICAgICAvLyBJZiB0aGUgRE9NUGFyc2VyIGlzIG5vdCBhdmFpbGFibGUgdGhlbiB3ZSBhcmUgbm90IGluIEZpcmVmb3ggKFNlcnZlci9XZWJXb3JrZXI/KSBzbyB3ZVxuICAgICAgLy8gZmFsbCB0aHJvdWdoIHRvIHRoZSBkZWZhdWx0IHN0cmF0ZWd5IGJlbG93LlxuICAgICAgaWYgKGlzRE9NUGFyc2VyQXZhaWxhYmxlKCkpIHtcbiAgICAgICAgdGhpcy5nZXRJbmVydEJvZHlFbGVtZW50ID0gdGhpcy5nZXRJbmVydEJvZHlFbGVtZW50X0RPTVBhcnNlcjtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5vbmUgb2YgdGhlIGJ1Z3Mgd2VyZSBoaXQgc28gaXQgaXMgc2FmZSBmb3IgdXMgdG8gdXNlIHRoZSBkZWZhdWx0IEluZXJ0RG9jdW1lbnQgc3RyYXRlZ3lcbiAgICB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnRfSW5lcnREb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYW4gaW5lcnQgRE9NIGVsZW1lbnQgY29udGFpbmluZyBET00gY3JlYXRlZCBmcm9tIHRoZSBkaXJ0eSBIVE1MIHN0cmluZyBwcm92aWRlZC5cbiAgICogVGhlIGltcGxlbWVudGF0aW9uIG9mIHRoaXMgaXMgZGV0ZXJtaW5lZCBpbiB0aGUgY29uc3RydWN0b3IsIHdoZW4gdGhlIGNsYXNzIGlzIGluc3RhbnRpYXRlZC5cbiAgICovXG4gIGdldEluZXJ0Qm9keUVsZW1lbnQ6IChodG1sOiBzdHJpbmcpID0+IEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAvKipcbiAgICogVXNlIFhIUiB0byBjcmVhdGUgYW5kIGZpbGwgYW4gaW5lcnQgYm9keSBlbGVtZW50IChvbiBTYWZhcmkgMTAuMSlcbiAgICogU2VlXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jdXJlNTMvRE9NUHVyaWZ5L2Jsb2IvYTk5MmQzYTc1MDMxY2I4YmIwMzJlNWVhODM5OWJhOTcyYmRmOWE2NS9zcmMvcHVyaWZ5LmpzI0w0MzktTDQ0OVxuICAgKi9cbiAgcHJpdmF0ZSBnZXRJbmVydEJvZHlFbGVtZW50X1hIUihodG1sOiBzdHJpbmcpIHtcbiAgICAvLyBXZSBhZGQgdGhlc2UgZXh0cmEgZWxlbWVudHMgdG8gZW5zdXJlIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIGNvbnRlbnQgaXMgcGFyc2VkIGFzIGV4cGVjdGVkXG4gICAgLy8gZS5nLiBsZWFkaW5nIHdoaXRlc3BhY2UgaXMgbWFpbnRhaW5lZCBhbmQgdGFncyBsaWtlIGA8bWV0YT5gIGRvIG5vdCBnZXQgaG9pc3RlZCB0byB0aGVcbiAgICAvLyBgPGhlYWQ+YCB0YWcuXG4gICAgaHRtbCA9ICc8Ym9keT48cmVtb3ZlPjwvcmVtb3ZlPicgKyBodG1sICsgJzwvYm9keT4nO1xuICAgIHRyeSB7XG4gICAgICBodG1sID0gZW5jb2RlVVJJKGh0bWwpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5yZXNwb25zZVR5cGUgPSAnZG9jdW1lbnQnO1xuICAgIHhoci5vcGVuKCdHRVQnLCAnZGF0YTp0ZXh0L2h0bWw7Y2hhcnNldD11dGYtOCwnICsgaHRtbCwgZmFsc2UpO1xuICAgIHhoci5zZW5kKHVuZGVmaW5lZCk7XG4gICAgY29uc3QgYm9keTogSFRNTEJvZHlFbGVtZW50ID0geGhyLnJlc3BvbnNlLmJvZHk7XG4gICAgYm9keS5yZW1vdmVDaGlsZChib2R5LmZpcnN0Q2hpbGQgISk7XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICAvKipcbiAgICogVXNlIERPTVBhcnNlciB0byBjcmVhdGUgYW5kIGZpbGwgYW4gaW5lcnQgYm9keSBlbGVtZW50IChvbiBGaXJlZm94KVxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2N1cmU1My9ET01QdXJpZnkvcmVsZWFzZXMvdGFnLzAuNi43XG4gICAqXG4gICAqL1xuICBwcml2YXRlIGdldEluZXJ0Qm9keUVsZW1lbnRfRE9NUGFyc2VyKGh0bWw6IHN0cmluZykge1xuICAgIC8vIFdlIGFkZCB0aGVzZSBleHRyYSBlbGVtZW50cyB0byBlbnN1cmUgdGhhdCB0aGUgcmVzdCBvZiB0aGUgY29udGVudCBpcyBwYXJzZWQgYXMgZXhwZWN0ZWRcbiAgICAvLyBlLmcuIGxlYWRpbmcgd2hpdGVzcGFjZSBpcyBtYWludGFpbmVkIGFuZCB0YWdzIGxpa2UgYDxtZXRhPmAgZG8gbm90IGdldCBob2lzdGVkIHRvIHRoZVxuICAgIC8vIGA8aGVhZD5gIHRhZy5cbiAgICBodG1sID0gJzxib2R5PjxyZW1vdmU+PC9yZW1vdmU+JyArIGh0bWwgKyAnPC9ib2R5Pic7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGJvZHkgPSBuZXcgKHdpbmRvdyBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgIC5ET01QYXJzZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKVxuICAgICAgICAgICAgICAgICAgICAgICAuYm9keSBhcyBIVE1MQm9keUVsZW1lbnQ7XG4gICAgICBib2R5LnJlbW92ZUNoaWxkKGJvZHkuZmlyc3RDaGlsZCAhKTtcbiAgICAgIHJldHVybiBib2R5O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBhbiBIVE1MNSBgdGVtcGxhdGVgIGVsZW1lbnQsIGlmIHN1cHBvcnRlZCwgb3IgYW4gaW5lcnQgYm9keSBlbGVtZW50IGNyZWF0ZWQgdmlhXG4gICAqIGBjcmVhdGVIdG1sRG9jdW1lbnRgIHRvIGNyZWF0ZSBhbmQgZmlsbCBhbiBpbmVydCBET00gZWxlbWVudC5cbiAgICogVGhpcyBpcyB0aGUgZGVmYXVsdCBzYW5lIHN0cmF0ZWd5IHRvIHVzZSBpZiB0aGUgYnJvd3NlciBkb2VzIG5vdCByZXF1aXJlIG9uZSBvZiB0aGUgc3BlY2lhbGlzZWRcbiAgICogc3RyYXRlZ2llcyBhYm92ZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0SW5lcnRCb2R5RWxlbWVudF9JbmVydERvY3VtZW50KGh0bWw6IHN0cmluZykge1xuICAgIC8vIFByZWZlciB1c2luZyA8dGVtcGxhdGU+IGVsZW1lbnQgaWYgc3VwcG9ydGVkLlxuICAgIGNvbnN0IHRlbXBsYXRlRWwgPSB0aGlzLmluZXJ0RG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICBpZiAoJ2NvbnRlbnQnIGluIHRlbXBsYXRlRWwpIHtcbiAgICAgIHRlbXBsYXRlRWwuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgIHJldHVybiB0ZW1wbGF0ZUVsO1xuICAgIH1cblxuICAgIHRoaXMuaW5lcnRCb2R5RWxlbWVudC5pbm5lckhUTUwgPSBodG1sO1xuXG4gICAgLy8gU3VwcG9ydDogSUUgOS0xMSBvbmx5XG4gICAgLy8gc3RyaXAgY3VzdG9tLW5hbWVzcGFjZWQgYXR0cmlidXRlcyBvbiBJRTw9MTFcbiAgICBpZiAoKHRoaXMuZGVmYXVsdERvYyBhcyBhbnkpLmRvY3VtZW50TW9kZSkge1xuICAgICAgdGhpcy5zdHJpcEN1c3RvbU5zQXR0cnModGhpcy5pbmVydEJvZHlFbGVtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5pbmVydEJvZHlFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gSUU5LTExIGNvbWVzIGFjcm9zcyBhbiB1bmtub3duIG5hbWVzcGFjZWQgYXR0cmlidXRlIGUuZy4gJ3hsaW5rOmZvbycgaXQgYWRkcyAneG1sbnM6bnMxJ1xuICAgKiBhdHRyaWJ1dGUgdG8gZGVjbGFyZSBuczEgbmFtZXNwYWNlIGFuZCBwcmVmaXhlcyB0aGUgYXR0cmlidXRlIHdpdGggJ25zMScgKGUuZy5cbiAgICogJ25zMTp4bGluazpmb28nKS5cbiAgICpcbiAgICogVGhpcyBpcyB1bmRlc2lyYWJsZSBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIGFsbG93IGFueSBvZiB0aGVzZSBjdXN0b20gYXR0cmlidXRlcy4gVGhpcyBtZXRob2RcbiAgICogc3RyaXBzIHRoZW0gYWxsLlxuICAgKi9cbiAgcHJpdmF0ZSBzdHJpcEN1c3RvbU5zQXR0cnMoZWw6IEVsZW1lbnQpIHtcbiAgICBjb25zdCBlbEF0dHJzID0gZWwuYXR0cmlidXRlcztcbiAgICAvLyBsb29wIGJhY2t3YXJkcyBzbyB0aGF0IHdlIGNhbiBzdXBwb3J0IHJlbW92YWxzLlxuICAgIGZvciAobGV0IGkgPSBlbEF0dHJzLmxlbmd0aCAtIDE7IDAgPCBpOyBpLS0pIHtcbiAgICAgIGNvbnN0IGF0dHJpYiA9IGVsQXR0cnMuaXRlbShpKTtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cmliICEubmFtZTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gJ3htbG5zOm5zMScgfHwgYXR0ck5hbWUuaW5kZXhPZignbnMxOicpID09PSAwKSB7XG4gICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBjaGlsZE5vZGUgPSBlbC5maXJzdENoaWxkIGFzIE5vZGUgfCBudWxsO1xuICAgIHdoaWxlIChjaGlsZE5vZGUpIHtcbiAgICAgIGlmIChjaGlsZE5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB0aGlzLnN0cmlwQ3VzdG9tTnNBdHRycyhjaGlsZE5vZGUgYXMgRWxlbWVudCk7XG4gICAgICBjaGlsZE5vZGUgPSBjaGlsZE5vZGUubmV4dFNpYmxpbmc7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogV2UgbmVlZCB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgRE9NUGFyc2VyIGV4aXN0cyBpbiB0aGUgZ2xvYmFsIGNvbnRleHQuXG4gKiBUaGUgdHJ5LWNhdGNoIGlzIGJlY2F1c2UsIG9uIHNvbWUgYnJvd3NlcnMsIHRyeWluZyB0byBhY2Nlc3MgdGhpcyBwcm9wZXJ0eVxuICogb24gd2luZG93IGNhbiBhY3R1YWxseSB0aHJvdyBhbiBlcnJvci5cbiAqXG4gKiBAc3VwcHJlc3Mge3VzZWxlc3NDb2RlfVxuICovXG5mdW5jdGlvbiBpc0RPTVBhcnNlckF2YWlsYWJsZSgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gISEod2luZG93IGFzIGFueSkuRE9NUGFyc2VyO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdfQ==