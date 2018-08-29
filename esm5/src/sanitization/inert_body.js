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
var InertBodyHelper = /** @class */ (function () {
    function InertBodyHelper(defaultDoc) {
        this.defaultDoc = defaultDoc;
        this.inertDocument = this.defaultDoc.implementation.createHTMLDocument('sanitization-inert');
        this.inertBodyElement = this.inertDocument.body;
        if (this.inertBodyElement == null) {
            // usually there should be only one body element in the document, but IE doesn't have any, so
            // we need to create one.
            var inertHtml = this.inertDocument.createElement('html');
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
     */
    InertBodyHelper.prototype.getInertBodyElement_XHR = function (html) {
        // We add these extra elements to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
        // `<head>` tag.
        html = '<body><remove></remove>' + html + '</body>';
        try {
            html = encodeURI(html);
        }
        catch (e) {
            return null;
        }
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'document';
        xhr.open('GET', 'data:text/html;charset=utf-8,' + html, false);
        xhr.send(undefined);
        var body = xhr.response.body;
        body.removeChild(body.firstChild);
        return body;
    };
    /**
     * Use DOMParser to create and fill an inert body element (on Firefox)
     * See https://github.com/cure53/DOMPurify/releases/tag/0.6.7
     *
     */
    InertBodyHelper.prototype.getInertBodyElement_DOMParser = function (html) {
        // We add these extra elements to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
        // `<head>` tag.
        html = '<body><remove></remove>' + html + '</body>';
        try {
            var body = new window
                .DOMParser()
                .parseFromString(html, 'text/html')
                .body;
            body.removeChild(body.firstChild);
            return body;
        }
        catch (e) {
            return null;
        }
    };
    /**
     * Use an HTML5 `template` element, if supported, or an inert body element created via
     * `createHtmlDocument` to create and fill an inert DOM element.
     * This is the default sane strategy to use if the browser does not require one of the specialised
     * strategies above.
     */
    InertBodyHelper.prototype.getInertBodyElement_InertDocument = function (html) {
        // Prefer using <template> element if supported.
        var templateEl = this.inertDocument.createElement('template');
        if ('content' in templateEl) {
            templateEl.innerHTML = html;
            return templateEl;
        }
        this.inertBodyElement.innerHTML = html;
        // Support: IE 9-11 only
        // strip custom-namespaced attributes on IE<=11
        if (this.defaultDoc.documentMode) {
            this.stripCustomNsAttrs(this.inertBodyElement);
        }
        return this.inertBodyElement;
    };
    /**
     * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1'
     * attribute to declare ns1 namespace and prefixes the attribute with 'ns1' (e.g.
     * 'ns1:xlink:foo').
     *
     * This is undesirable since we don't want to allow any of these custom attributes. This method
     * strips them all.
     */
    InertBodyHelper.prototype.stripCustomNsAttrs = function (el) {
        var elAttrs = el.attributes;
        // loop backwards so that we can support removals.
        for (var i = elAttrs.length - 1; 0 < i; i--) {
            var attrib = elAttrs.item(i);
            var attrName = attrib.name;
            if (attrName === 'xmlns:ns1' || attrName.indexOf('ns1:') === 0) {
                el.removeAttribute(attrName);
            }
        }
        var childNode = el.firstChild;
        while (childNode) {
            if (childNode.nodeType === Node.ELEMENT_NODE)
                this.stripCustomNsAttrs(childNode);
            childNode = childNode.nextSibling;
        }
    };
    return InertBodyHelper;
}());
export { InertBodyHelper };
/**
 * We need to determine whether the DOMParser exists in the global context.
 * The try-catch is because, on some browsers, trying to access this property
 * on window can actually throw an error.
 *
 * @suppress {uselessCode}
 */
function isDOMParserAvailable() {
    try {
        return !!window.DOMParser;
    }
    catch (e) {
        return false;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5lcnRfYm9keS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi9pbmVydF9ib2R5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7Ozs7O0dBT0c7QUFDSDtJQUlFLHlCQUFvQixVQUFvQjtRQUFwQixlQUFVLEdBQVYsVUFBVSxDQUFVO1FBQ3RDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUM3RixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFFaEQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxFQUFFO1lBQ2pDLDZGQUE2RjtZQUM3Rix5QkFBeUI7WUFDekIsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pFLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLHNEQUFzRCxDQUFDO1FBQ3pGLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDdEYsb0ZBQW9GO1lBQ3BGLDJCQUEyQjtZQUMzQixJQUFJLENBQUMsbUJBQW1CLEdB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MUIsVUFBMkIsRUFBVztRQUNwQyxJQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDO1FBQzlCLGtEQUFrRDtRQUNsRCxLQUFLLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0MsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixJQUFNLFFBQVEsR0FBRyxNQUFRLENBQUMsSUFBSSxDQUFDO1lBQy9CLElBQUksUUFBUSxLQUFLLFdBQVcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDOUQsRUFBRSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM5QjtTQUNGO1FBQ0QsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztRQUM5QixPQUFPLFNBQVMsRUFBRTtZQUNoQixJQUFJLFNBQVMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVk7Z0JBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQW9CLENBQUMsQ0FBQztZQUM1RixTQUFTLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQztTQUNuQztJQUNILENBQUM7SUFDSCxzQkFBQztBQUFELENBQUMsQUEvSUQsSUErSUM7O0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxvQkFBb0I7SUFDM0IsSUFBSTtRQUNGLE9BQU8sQ0FBQyxDQUFFLE1BQWMsQ0FBQyxTQUFTLENBQUM7S0FDcEM7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRoaXMgaGVscGVyIGNsYXNzIGlzIHVzZWQgdG8gZ2V0IGhvbGQgb2YgYW4gaW5lcnQgdHJlZSBvZiBET00gZWxlbWVudHMgY29udGFpbmluZyBkaXJ0eSBIVE1MXG4gKiB0aGF0IG5lZWRzIHNhbml0aXppbmcuXG4gKiBEZXBlbmRpbmcgdXBvbiBicm93c2VyIHN1cHBvcnQgd2UgbXVzdCB1c2Ugb25lIG9mIHRocmVlIHN0cmF0ZWdpZXMgZm9yIGRvaW5nIHRoaXMuXG4gKiBTdXBwb3J0OiBTYWZhcmkgMTAueCAtPiBYSFIgc3RyYXRlZ3lcbiAqIFN1cHBvcnQ6IEZpcmVmb3ggLT4gRG9tUGFyc2VyIHN0cmF0ZWd5XG4gKiBEZWZhdWx0OiBJbmVydERvY3VtZW50IHN0cmF0ZWd5XG4gKi9cbmV4cG9ydCBjbGFzcyBJbmVydEJvZHlIZWxwZXIge1xuICBwcml2YXRlIGluZXJ0Qm9keUVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGluZXJ0RG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVmYXVsdERvYzogRG9jdW1lbnQpIHtcbiAgICB0aGlzLmluZXJ0RG9jdW1lbnQgPSB0aGlzLmRlZmF1bHREb2MuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCdzYW5pdGl6YXRpb24taW5lcnQnKTtcbiAgICB0aGlzLmluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmluZXJ0RG9jdW1lbnQuYm9keTtcblxuICAgIGlmICh0aGlzLmluZXJ0Qm9keUVsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgLy8gdXN1YWxseSB0aGVyZSBzaG91bGQgYmUgb25seSBvbmUgYm9keSBlbGVtZW50IGluIHRoZSBkb2N1bWVudCwgYnV0IElFIGRvZXNuJ3QgaGF2ZSBhbnksIHNvXG4gICAgICAvLyB3ZSBuZWVkIHRvIGNyZWF0ZSBvbmUuXG4gICAgICBjb25zdCBpbmVydEh0bWwgPSB0aGlzLmluZXJ0RG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaHRtbCcpO1xuICAgICAgdGhpcy5pbmVydERvY3VtZW50LmFwcGVuZENoaWxkKGluZXJ0SHRtbCk7XG4gICAgICB0aGlzLmluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmluZXJ0RG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYm9keScpO1xuICAgICAgaW5lcnRIdG1sLmFwcGVuZENoaWxkKHRoaXMuaW5lcnRCb2R5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5pbmVydEJvZHlFbGVtZW50LmlubmVySFRNTCA9ICc8c3ZnPjxnIG9ubG9hZD1cInRoaXMucGFyZW50Tm9kZS5yZW1vdmUoKVwiPjwvZz48L3N2Zz4nO1xuICAgIGlmICh0aGlzLmluZXJ0Qm9keUVsZW1lbnQucXVlcnlTZWxlY3RvciAmJiAhdGhpcy5pbmVydEJvZHlFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3N2ZycpKSB7XG4gICAgICAvLyBXZSBqdXN0IGhpdCB0aGUgU2FmYXJpIDEwLjEgYnVnIC0gd2hpY2ggYWxsb3dzIEpTIHRvIHJ1biBpbnNpZGUgdGhlIFNWRyBHIGVsZW1lbnRcbiAgICAgIC8vIHNvIHVzZSB0aGUgWEhSIHN0cmF0ZWd5LlxuICAgICAgdGhpcy5nZXRJbmVydEJvZHlFbGVtZW50ID0gdGhpcy5nZXRJbmVydEJvZHlFbGVtZW50X1hIUjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmluZXJ0Qm9keUVsZW1lbnQuaW5uZXJIVE1MID1cbiAgICAgICAgJzxzdmc+PHA+PHN0eWxlPjxpbWcgc3JjPVwiPC9zdHlsZT48aW1nIHNyYz14IG9uZXJyb3I9YWxlcnQoMSkvL1wiPic7XG4gICAgaWYgKHRoaXMuaW5lcnRCb2R5RWxlbWVudC5xdWVyeVNlbGVjdG9yICYmIHRoaXMuaW5lcnRCb2R5RWxlbWVudC5xdWVyeVNlbGVjdG9yKCdzdmcgaW1nJykpIHtcbiAgICAgIC8vIFdlIGp1c3QgaGl0IHRoZSBGaXJlZm94IGJ1ZyAtIHdoaWNoIHByZXZlbnRzIHRoZSBpbm5lciBpbWcgSlMgZnJvbSBiZWluZyBzYW5pdGl6ZWRcbiAgICAgIC8vIHNvIHVzZSB0aGUgRE9NUGFyc2VyIHN0cmF0ZWd5LCBpZiBpdCBpcyBhdmFpbGFibGUuXG4gICAgICAvLyBJZiB0aGUgRE9NUGFyc2VyIGlzIG5vdCBhdmFpbGFibGUgdGhlbiB3ZSBhcmUgbm90IGluIEZpcmVmb3ggKFNlcnZlci9XZWJXb3JrZXI/KSBzbyB3ZVxuICAgICAgLy8gZmFsbCB0aHJvdWdoIHRvIHRoZSBkZWZhdWx0IHN0cmF0ZWd5IGJlbG93LlxuICAgICAgaWYgKGlzRE9NUGFyc2VyQXZhaWxhYmxlKCkpIHtcbiAgICAgICAgdGhpcy5nZXRJbmVydEJvZHlFbGVtZW50ID0gdGhpcy5nZXRJbmVydEJvZHlFbGVtZW50X0RPTVBhcnNlcjtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5vbmUgb2YgdGhlIGJ1Z3Mgd2VyZSBoaXQgc28gaXQgaXMgc2FmZSBmb3IgdXMgdG8gdXNlIHRoZSBkZWZhdWx0IEluZXJ0RG9jdW1lbnQgc3RyYXRlZ3lcbiAgICB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnRfSW5lcnREb2N1bWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYW4gaW5lcnQgRE9NIGVsZW1lbnQgY29udGFpbmluZyBET00gY3JlYXRlZCBmcm9tIHRoZSBkaXJ0eSBIVE1MIHN0cmluZyBwcm92aWRlZC5cbiAgICogVGhlIGltcGxlbWVudGF0aW9uIG9mIHRoaXMgaXMgZGV0ZXJtaW5lZCBpbiB0aGUgY29uc3RydWN0b3IsIHdoZW4gdGhlIGNsYXNzIGlzIGluc3RhbnRpYXRlZC5cbiAgICovXG4gIGdldEluZXJ0Qm9keUVsZW1lbnQ6IChodG1sOiBzdHJpbmcpID0+IEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAvKipcbiAgICogVXNlIFhIUiB0byBjcmVhdGUgYW5kIGZpbGwgYW4gaW5lcnQgYm9keSBlbGVtZW50IChvbiBTYWZhcmkgMTAuMSlcbiAgICogU2VlXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jdXJlNTMvRE9NUHVyaWZ5L2Jsb2IvYTk5MmQzYTc1MDMxY2I4YmIwMzJlNWVhODM5OWJhOTcyYmRmOWE2NS9zcmMvcHVyaWZ5LmpzI0w0MzktTDQ0OVxuICAgKi9cbiAgcHJpdmF0ZSBnZXRJbmVydEJvZHlFbGVtZW50X1hIUihodG1sOiBzdHJpbmcpIHtcbiAgICAvLyBXZSBhZGQgdGhlc2UgZXh0cmEgZWxlbWVudHMgdG8gZW5zdXJlIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIGNvbnRlbnQgaXMgcGFyc2VkIGFzIGV4cGVjdGVkXG4gICAgLy8gZS5nLiBsZWFkaW5nIHdoaXRlc3BhY2UgaXMgbWFpbnRhaW5lZCBhbmQgdGFncyBsaWtlIGA8bWV0YT5gIGRvIG5vdCBnZXQgaG9pc3RlZCB0byB0aGVcbiAgICAvLyBgPGhlYWQ+YCB0YWcuXG4gICAgaHRtbCA9ICc8Ym9keT48cmVtb3ZlPjwvcmVtb3ZlPicgKyBodG1sICsgJzwvYm9keT4nO1xuICAgIHRyeSB7XG4gICAgICBodG1sID0gZW5jb2RlVVJJKGh0bWwpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2RvY3VtZW50JztcbiAgICB4aHIub3BlbignR0VUJywgJ2RhdGE6dGV4dC9odG1sO2NoYXJzZXQ9dXRmLTgsJyArIGh0bWwsIGZhbHNlKTtcbiAgICB4aHIuc2VuZCh1bmRlZmluZWQpO1xuICAgIGNvbnN0IGJvZHk6IEhUTUxCb2R5RWxlbWVudCA9IHhoci5yZXNwb25zZS5ib2R5O1xuICAgIGJvZHkucmVtb3ZlQ2hpbGQoYm9keS5maXJzdENoaWxkICEpO1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBET01QYXJzZXIgdG8gY3JlYXRlIGFuZCBmaWxsIGFuIGluZXJ0IGJvZHkgZWxlbWVudCAob24gRmlyZWZveClcbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jdXJlNTMvRE9NUHVyaWZ5L3JlbGVhc2VzL3RhZy8wLjYuN1xuICAgKlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRJbmVydEJvZHlFbGVtZW50X0RPTVBhcnNlcihodG1sOiBzdHJpbmcpIHtcbiAgICAvLyBXZSBhZGQgdGhlc2UgZXh0cmEgZWxlbWVudHMgdG8gZW5zdXJlIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIGNvbnRlbnQgaXMgcGFyc2VkIGFzIGV4cGVjdGVkXG4gICAgLy8gZS5nLiBsZWFkaW5nIHdoaXRlc3BhY2UgaXMgbWFpbnRhaW5lZCBhbmQgdGFncyBsaWtlIGA8bWV0YT5gIGRvIG5vdCBnZXQgaG9pc3RlZCB0byB0aGVcbiAgICAvLyBgPGhlYWQ+YCB0YWcuXG4gICAgaHRtbCA9ICc8Ym9keT48cmVtb3ZlPjwvcmVtb3ZlPicgKyBodG1sICsgJzwvYm9keT4nO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBib2R5ID0gbmV3ICh3aW5kb3cgYXMgYW55KVxuICAgICAgICAgICAgICAgICAgICAgICAuRE9NUGFyc2VyKClcbiAgICAgICAgICAgICAgICAgICAgICAgLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJylcbiAgICAgICAgICAgICAgICAgICAgICAgLmJvZHkgYXMgSFRNTEJvZHlFbGVtZW50O1xuICAgICAgYm9keS5yZW1vdmVDaGlsZChib2R5LmZpcnN0Q2hpbGQgISk7XG4gICAgICByZXR1cm4gYm9keTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXNlIGFuIEhUTUw1IGB0ZW1wbGF0ZWAgZWxlbWVudCwgaWYgc3VwcG9ydGVkLCBvciBhbiBpbmVydCBib2R5IGVsZW1lbnQgY3JlYXRlZCB2aWFcbiAgICogYGNyZWF0ZUh0bWxEb2N1bWVudGAgdG8gY3JlYXRlIGFuZCBmaWxsIGFuIGluZXJ0IERPTSBlbGVtZW50LlxuICAgKiBUaGlzIGlzIHRoZSBkZWZhdWx0IHNhbmUgc3RyYXRlZ3kgdG8gdXNlIGlmIHRoZSBicm93c2VyIGRvZXMgbm90IHJlcXVpcmUgb25lIG9mIHRoZSBzcGVjaWFsaXNlZFxuICAgKiBzdHJhdGVnaWVzIGFib3ZlLlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRJbmVydEJvZHlFbGVtZW50X0luZXJ0RG9jdW1lbnQoaHRtbDogc3RyaW5nKSB7XG4gICAgLy8gUHJlZmVyIHVzaW5nIDx0ZW1wbGF0ZT4gZWxlbWVudCBpZiBzdXBwb3J0ZWQuXG4gICAgY29uc3QgdGVtcGxhdGVFbCA9IHRoaXMuaW5lcnREb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgIGlmICgnY29udGVudCcgaW4gdGVtcGxhdGVFbCkge1xuICAgICAgdGVtcGxhdGVFbC5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgcmV0dXJuIHRlbXBsYXRlRWw7XG4gICAgfVxuXG4gICAgdGhpcy5pbmVydEJvZHlFbGVtZW50LmlubmVySFRNTCA9IGh0bWw7XG5cbiAgICAvLyBTdXBwb3J0OiBJRSA5LTExIG9ubHlcbiAgICAvLyBzdHJpcCBjdXN0b20tbmFtZXNwYWNlZCBhdHRyaWJ1dGVzIG9uIElFPD0xMVxuICAgIGlmICgodGhpcy5kZWZhdWx0RG9jIGFzIGFueSkuZG9jdW1lbnRNb2RlKSB7XG4gICAgICB0aGlzLnN0cmlwQ3VzdG9tTnNBdHRycyh0aGlzLmluZXJ0Qm9keUVsZW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmluZXJ0Qm9keUVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiBJRTktMTEgY29tZXMgYWNyb3NzIGFuIHVua25vd24gbmFtZXNwYWNlZCBhdHRyaWJ1dGUgZS5nLiAneGxpbms6Zm9vJyBpdCBhZGRzICd4bWxuczpuczEnXG4gICAqIGF0dHJpYnV0ZSB0byBkZWNsYXJlIG5zMSBuYW1lc3BhY2UgYW5kIHByZWZpeGVzIHRoZSBhdHRyaWJ1dGUgd2l0aCAnbnMxJyAoZS5nLlxuICAgKiAnbnMxOnhsaW5rOmZvbycpLlxuICAgKlxuICAgKiBUaGlzIGlzIHVuZGVzaXJhYmxlIHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gYWxsb3cgYW55IG9mIHRoZXNlIGN1c3RvbSBhdHRyaWJ1dGVzLiBUaGlzIG1ldGhvZFxuICAgKiBzdHJpcHMgdGhlbSBhbGwuXG4gICAqL1xuICBwcml2YXRlIHN0cmlwQ3VzdG9tTnNBdHRycyhlbDogRWxlbWVudCkge1xuICAgIGNvbnN0IGVsQXR0cnMgPSBlbC5hdHRyaWJ1dGVzO1xuICAgIC8vIGxvb3AgYmFja3dhcmRzIHNvIHRoYXQgd2UgY2FuIHN1cHBvcnQgcmVtb3ZhbHMuXG4gICAgZm9yIChsZXQgaSA9IGVsQXR0cnMubGVuZ3RoIC0gMTsgMCA8IGk7IGktLSkge1xuICAgICAgY29uc3QgYXR0cmliID0gZWxBdHRycy5pdGVtKGkpO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyaWIgIS5uYW1lO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSAneG1sbnM6bnMxJyB8fCBhdHRyTmFtZS5pbmRleE9mKCduczE6JykgPT09IDApIHtcbiAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGNoaWxkTm9kZSA9IGVsLmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKGNoaWxkTm9kZSkge1xuICAgICAgaWYgKGNoaWxkTm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHRoaXMuc3RyaXBDdXN0b21Oc0F0dHJzKGNoaWxkTm9kZSBhcyBFbGVtZW50KTtcbiAgICAgIGNoaWxkTm9kZSA9IGNoaWxkTm9kZS5uZXh0U2libGluZztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBXZSBuZWVkIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBET01QYXJzZXIgZXhpc3RzIGluIHRoZSBnbG9iYWwgY29udGV4dC5cbiAqIFRoZSB0cnktY2F0Y2ggaXMgYmVjYXVzZSwgb24gc29tZSBicm93c2VycywgdHJ5aW5nIHRvIGFjY2VzcyB0aGlzIHByb3BlcnR5XG4gKiBvbiB3aW5kb3cgY2FuIGFjdHVhbGx5IHRocm93IGFuIGVycm9yLlxuICpcbiAqIEBzdXBwcmVzcyB7dXNlbGVzc0NvZGV9XG4gKi9cbmZ1bmN0aW9uIGlzRE9NUGFyc2VyQXZhaWxhYmxlKCkge1xuICB0cnkge1xuICAgIHJldHVybiAhISh3aW5kb3cgYXMgYW55KS5ET01QYXJzZXI7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdfQ==