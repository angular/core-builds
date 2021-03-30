/**
 * @license
 * Copyright Google LLC All Rights Reserved.
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
    constructor(defaultDoc) {
        this.defaultDoc = defaultDoc;
        this.inertDocument = this.defaultDoc.implementation.createHTMLDocument('sanitization-inert');
        let inertBodyElement = this.inertDocument.body;
        if (inertBodyElement == null) {
            // usually there should be only one body element in the document, but IE doesn't have any, so
            // we need to create one.
            const inertHtml = this.inertDocument.createElement('html');
            this.inertDocument.appendChild(inertHtml);
            inertBodyElement = this.inertDocument.createElement('body');
            inertHtml.appendChild(inertBodyElement);
        }
        inertBodyElement.innerHTML = '<svg><g onload="this.parentNode.remove()"></g></svg>';
        if (inertBodyElement.querySelector && !inertBodyElement.querySelector('svg')) {
            // We just hit the Safari 10.1 bug - which allows JS to run inside the SVG G element
            // so use the XHR strategy.
            this.getInertBodyElement = this.getInertBodyElement_XHR;
            return;
        }
        inertBodyElement.innerHTML = '<svg><p><style><img src="</style><img src=x onerror=alert(1)//">';
        if (inertBodyElement.querySelector && inertBodyElement.querySelector('svg img')) {
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
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'document';
        xhr.open('GET', 'data:text/html;charset=utf-8,' + html, false);
        xhr.send(undefined);
        const body = xhr.response.body;
        body.removeChild(body.firstChild);
        return body;
    }
    /**
     * Use DOMParser to create and fill an inert body element (on Firefox)
     * See https://github.com/cure53/DOMPurify/releases/tag/0.6.7
     *
     */
    getInertBodyElement_DOMParser(html) {
        // We add these extra elements to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
        // `<head>` tag.
        html = '<body><remove></remove>' + html + '</body>';
        try {
            const body = new window.DOMParser().parseFromString(html, 'text/html').body;
            body.removeChild(body.firstChild);
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
     */
    getInertBodyElement_InertDocument(html) {
        // Prefer using <template> element if supported.
        const templateEl = this.inertDocument.createElement('template');
        if ('content' in templateEl) {
            templateEl.innerHTML = html;
            return templateEl;
        }
        // Note that previously we used to do something like `this.inertDocument.body.innerHTML = html`
        // and we returned the inert `body` node. This was changed, because IE seems to treat setting
        // `innerHTML` on an inserted element differently, compared to one that hasn't been inserted
        // yet. In particular, IE appears to split some of the text into multiple text nodes rather
        // than keeping them in a single one which ends up messing with Ivy's i18n parsing further
        // down the line. This has been worked around by creating a new inert `body` and using it as
        // the root node in which we insert the HTML.
        const inertBody = this.inertDocument.createElement('body');
        inertBody.innerHTML = html;
        // Support: IE 9-11 only
        // strip custom-namespaced attributes on IE<=11
        if (this.defaultDoc.documentMode) {
            this.stripCustomNsAttrs(inertBody);
        }
        return inertBody;
    }
    /**
     * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1'
     * attribute to declare ns1 namespace and prefixes the attribute with 'ns1' (e.g.
     * 'ns1:xlink:foo').
     *
     * This is undesirable since we don't want to allow any of these custom attributes. This method
     * strips them all.
     */
    stripCustomNsAttrs(el) {
        const elAttrs = el.attributes;
        // loop backwards so that we can support removals.
        for (let i = elAttrs.length - 1; 0 < i; i--) {
            const attrib = elAttrs.item(i);
            const attrName = attrib.name;
            if (attrName === 'xmlns:ns1' || attrName.indexOf('ns1:') === 0) {
                el.removeAttribute(attrName);
            }
        }
        let childNode = el.firstChild;
        while (childNode) {
            if (childNode.nodeType === Node.ELEMENT_NODE)
                this.stripCustomNsAttrs(childNode);
            childNode = childNode.nextSibling;
        }
    }
}
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
    catch (_a) {
        return false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5lcnRfYm9keS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi9pbmVydF9ib2R5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLE9BQU8sZUFBZTtJQUcxQixZQUFvQixVQUFvQjtRQUFwQixlQUFVLEdBQVYsVUFBVSxDQUFVO1FBQ3RDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUM3RixJQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDO1FBRS9DLElBQUksZ0JBQWdCLElBQUksSUFBSSxFQUFFO1lBQzVCLDZGQUE2RjtZQUM3Rix5QkFBeUI7WUFDekIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDMUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1NBQ3pDO1FBRUQsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLHNEQUFzRCxDQUFDO1FBQ3BGLElBQUksZ0JBQWdCLENBQUMsYUFBYSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzVFLG9GQUFvRjtZQUNwRiwyQkFBMkI7WUFDM0IsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztZQUN4RCxPQUFPO1NBQ1I7UUFFRCxnQkFBZ0IsQ0FBQyxT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QUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDO1FBQzlCLGtEQUFrRDtRQUNsRCxLQUFLLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBRyxNQUFPLENBQUMsSUFBSSxDQUFDO1lBQzlCLElBQUksUUFBUSxLQUFLLFdBQVcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDOUQsRUFBRSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM5QjtTQUNGO1FBQ0QsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDLFVBQXlCLENBQUM7UUFDN0MsT0FBTyxTQUFTLEVBQUU7WUFDaEIsSUFBSSxTQUFTLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxZQUFZO2dCQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFvQixDQUFDLENBQUM7WUFDNUYsU0FBUyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7U0FDbkM7SUFDSCxDQUFDO0NBQ0Y7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLG9CQUFvQjtJQUMzQixJQUFJO1FBQ0YsT0FBTyxDQUFDLENBQUUsTUFBYyxDQUFDLFNBQVMsQ0FBQztLQUNwQztJQUFDLFdBQU07UUFDTixPQUFPLEtBQUssQ0FBQztLQUNkO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFRoaXMgaGVscGVyIGNsYXNzIGlzIHVzZWQgdG8gZ2V0IGhvbGQgb2YgYW4gaW5lcnQgdHJlZSBvZiBET00gZWxlbWVudHMgY29udGFpbmluZyBkaXJ0eSBIVE1MXG4gKiB0aGF0IG5lZWRzIHNhbml0aXppbmcuXG4gKiBEZXBlbmRpbmcgdXBvbiBicm93c2VyIHN1cHBvcnQgd2UgbXVzdCB1c2Ugb25lIG9mIHRocmVlIHN0cmF0ZWdpZXMgZm9yIGRvaW5nIHRoaXMuXG4gKiBTdXBwb3J0OiBTYWZhcmkgMTAueCAtPiBYSFIgc3RyYXRlZ3lcbiAqIFN1cHBvcnQ6IEZpcmVmb3ggLT4gRG9tUGFyc2VyIHN0cmF0ZWd5XG4gKiBEZWZhdWx0OiBJbmVydERvY3VtZW50IHN0cmF0ZWd5XG4gKi9cbmV4cG9ydCBjbGFzcyBJbmVydEJvZHlIZWxwZXIge1xuICBwcml2YXRlIGluZXJ0RG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVmYXVsdERvYzogRG9jdW1lbnQpIHtcbiAgICB0aGlzLmluZXJ0RG9jdW1lbnQgPSB0aGlzLmRlZmF1bHREb2MuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCdzYW5pdGl6YXRpb24taW5lcnQnKTtcbiAgICBsZXQgaW5lcnRCb2R5RWxlbWVudCA9IHRoaXMuaW5lcnREb2N1bWVudC5ib2R5O1xuXG4gICAgaWYgKGluZXJ0Qm9keUVsZW1lbnQgPT0gbnVsbCkge1xuICAgICAgLy8gdXN1YWxseSB0aGVyZSBzaG91bGQgYmUgb25seSBvbmUgYm9keSBlbGVtZW50IGluIHRoZSBkb2N1bWVudCwgYnV0IElFIGRvZXNuJ3QgaGF2ZSBhbnksIHNvXG4gICAgICAvLyB3ZSBuZWVkIHRvIGNyZWF0ZSBvbmUuXG4gICAgICBjb25zdCBpbmVydEh0bWwgPSB0aGlzLmluZXJ0RG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaHRtbCcpO1xuICAgICAgdGhpcy5pbmVydERvY3VtZW50LmFwcGVuZENoaWxkKGluZXJ0SHRtbCk7XG4gICAgICBpbmVydEJvZHlFbGVtZW50ID0gdGhpcy5pbmVydERvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2JvZHknKTtcbiAgICAgIGluZXJ0SHRtbC5hcHBlbmRDaGlsZChpbmVydEJvZHlFbGVtZW50KTtcbiAgICB9XG5cbiAgICBpbmVydEJvZHlFbGVtZW50LmlubmVySFRNTCA9ICc8c3ZnPjxnIG9ubG9hZD1cInRoaXMucGFyZW50Tm9kZS5yZW1vdmUoKVwiPjwvZz48L3N2Zz4nO1xuICAgIGlmIChpbmVydEJvZHlFbGVtZW50LnF1ZXJ5U2VsZWN0b3IgJiYgIWluZXJ0Qm9keUVsZW1lbnQucXVlcnlTZWxlY3Rvcignc3ZnJykpIHtcbiAgICAgIC8vIFdlIGp1c3QgaGl0IHRoZSBTYWZhcmkgMTAuMSBidWcgLSB3aGljaCBhbGxvd3MgSlMgdG8gcnVuIGluc2lkZSB0aGUgU1ZHIEcgZWxlbWVudFxuICAgICAgLy8gc28gdXNlIHRoZSBYSFIgc3RyYXRlZ3kuXG4gICAgICB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnRfWEhSO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGluZXJ0Qm9keUVsZW1lbnQuaW5uZXJIVE1MID0gJzxzdmc+PHA+PHN0eWxlPjxpbWcgc3JjPVwiPC9zdHlsZT48aW1nIHNyYz14IG9uZXJyb3I9YWxlcnQoMSkvL1wiPic7XG4gICAgaWYgKGluZXJ0Qm9keUVsZW1lbnQucXVlcnlTZWxlY3RvciAmJiBpbmVydEJvZHlFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3N2ZyBpbWcnKSkge1xuICAgICAgLy8gV2UganVzdCBoaXQgdGhlIEZpcmVmb3ggYnVnIC0gd2hpY2ggcHJldmVudHMgdGhlIGlubmVyIGltZyBKUyBmcm9tIGJlaW5nIHNhbml0aXplZFxuICAgICAgLy8gc28gdXNlIHRoZSBET01QYXJzZXIgc3RyYXRlZ3ksIGlmIGl0IGlzIGF2YWlsYWJsZS5cbiAgICAgIC8vIElmIHRoZSBET01QYXJzZXIgaXMgbm90IGF2YWlsYWJsZSB0aGVuIHdlIGFyZSBub3QgaW4gRmlyZWZveCAoU2VydmVyL1dlYldvcmtlcj8pIHNvIHdlXG4gICAgICAvLyBmYWxsIHRocm91Z2ggdG8gdGhlIGRlZmF1bHQgc3RyYXRlZ3kgYmVsb3cuXG4gICAgICBpZiAoaXNET01QYXJzZXJBdmFpbGFibGUoKSkge1xuICAgICAgICB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnRfRE9NUGFyc2VyO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTm9uZSBvZiB0aGUgYnVncyB3ZXJlIGhpdCBzbyBpdCBpcyBzYWZlIGZvciB1cyB0byB1c2UgdGhlIGRlZmF1bHQgSW5lcnREb2N1bWVudCBzdHJhdGVneVxuICAgIHRoaXMuZ2V0SW5lcnRCb2R5RWxlbWVudCA9IHRoaXMuZ2V0SW5lcnRCb2R5RWxlbWVudF9JbmVydERvY3VtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBpbmVydCBET00gZWxlbWVudCBjb250YWluaW5nIERPTSBjcmVhdGVkIGZyb20gdGhlIGRpcnR5IEhUTUwgc3RyaW5nIHByb3ZpZGVkLlxuICAgKiBUaGUgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBpcyBkZXRlcm1pbmVkIGluIHRoZSBjb25zdHJ1Y3Rvciwgd2hlbiB0aGUgY2xhc3MgaXMgaW5zdGFudGlhdGVkLlxuICAgKi9cbiAgZ2V0SW5lcnRCb2R5RWxlbWVudDogKGh0bWw6IHN0cmluZykgPT4gSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBVc2UgWEhSIHRvIGNyZWF0ZSBhbmQgZmlsbCBhbiBpbmVydCBib2R5IGVsZW1lbnQgKG9uIFNhZmFyaSAxMC4xKVxuICAgKiBTZWVcbiAgICogaHR0cHM6Ly9naXRodWIuY29tL2N1cmU1My9ET01QdXJpZnkvYmxvYi9hOTkyZDNhNzUwMzFjYjhiYjAzMmU1ZWE4Mzk5YmE5NzJiZGY5YTY1L3NyYy9wdXJpZnkuanMjTDQzOS1MNDQ5XG4gICAqL1xuICBwcml2YXRlIGdldEluZXJ0Qm9keUVsZW1lbnRfWEhSKGh0bWw6IHN0cmluZykge1xuICAgIC8vIFdlIGFkZCB0aGVzZSBleHRyYSBlbGVtZW50cyB0byBlbnN1cmUgdGhhdCB0aGUgcmVzdCBvZiB0aGUgY29udGVudCBpcyBwYXJzZWQgYXMgZXhwZWN0ZWRcbiAgICAvLyBlLmcuIGxlYWRpbmcgd2hpdGVzcGFjZSBpcyBtYWludGFpbmVkIGFuZCB0YWdzIGxpa2UgYDxtZXRhPmAgZG8gbm90IGdldCBob2lzdGVkIHRvIHRoZVxuICAgIC8vIGA8aGVhZD5gIHRhZy5cbiAgICBodG1sID0gJzxib2R5PjxyZW1vdmU+PC9yZW1vdmU+JyArIGh0bWwgKyAnPC9ib2R5Pic7XG4gICAgdHJ5IHtcbiAgICAgIGh0bWwgPSBlbmNvZGVVUkkoaHRtbCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdkb2N1bWVudCc7XG4gICAgeGhyLm9wZW4oJ0dFVCcsICdkYXRhOnRleHQvaHRtbDtjaGFyc2V0PXV0Zi04LCcgKyBodG1sLCBmYWxzZSk7XG4gICAgeGhyLnNlbmQodW5kZWZpbmVkKTtcbiAgICBjb25zdCBib2R5OiBIVE1MQm9keUVsZW1lbnQgPSB4aHIucmVzcG9uc2UuYm9keTtcbiAgICBib2R5LnJlbW92ZUNoaWxkKGJvZHkuZmlyc3RDaGlsZCEpO1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBET01QYXJzZXIgdG8gY3JlYXRlIGFuZCBmaWxsIGFuIGluZXJ0IGJvZHkgZWxlbWVudCAob24gRmlyZWZveClcbiAgICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jdXJlNTMvRE9NUHVyaWZ5L3JlbGVhc2VzL3RhZy8wLjYuN1xuICAgKlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRJbmVydEJvZHlFbGVtZW50X0RPTVBhcnNlcihodG1sOiBzdHJpbmcpIHtcbiAgICAvLyBXZSBhZGQgdGhlc2UgZXh0cmEgZWxlbWVudHMgdG8gZW5zdXJlIHRoYXQgdGhlIHJlc3Qgb2YgdGhlIGNvbnRlbnQgaXMgcGFyc2VkIGFzIGV4cGVjdGVkXG4gICAgLy8gZS5nLiBsZWFkaW5nIHdoaXRlc3BhY2UgaXMgbWFpbnRhaW5lZCBhbmQgdGFncyBsaWtlIGA8bWV0YT5gIGRvIG5vdCBnZXQgaG9pc3RlZCB0byB0aGVcbiAgICAvLyBgPGhlYWQ+YCB0YWcuXG4gICAgaHRtbCA9ICc8Ym9keT48cmVtb3ZlPjwvcmVtb3ZlPicgKyBodG1sICsgJzwvYm9keT4nO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBib2R5ID0gbmV3ICh3aW5kb3cgYXMgYW55KS5ET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpLmJvZHkgYXNcbiAgICAgICAgICBIVE1MQm9keUVsZW1lbnQ7XG4gICAgICBib2R5LnJlbW92ZUNoaWxkKGJvZHkuZmlyc3RDaGlsZCEpO1xuICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXNlIGFuIEhUTUw1IGB0ZW1wbGF0ZWAgZWxlbWVudCwgaWYgc3VwcG9ydGVkLCBvciBhbiBpbmVydCBib2R5IGVsZW1lbnQgY3JlYXRlZCB2aWFcbiAgICogYGNyZWF0ZUh0bWxEb2N1bWVudGAgdG8gY3JlYXRlIGFuZCBmaWxsIGFuIGluZXJ0IERPTSBlbGVtZW50LlxuICAgKiBUaGlzIGlzIHRoZSBkZWZhdWx0IHNhbmUgc3RyYXRlZ3kgdG8gdXNlIGlmIHRoZSBicm93c2VyIGRvZXMgbm90IHJlcXVpcmUgb25lIG9mIHRoZSBzcGVjaWFsaXNlZFxuICAgKiBzdHJhdGVnaWVzIGFib3ZlLlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRJbmVydEJvZHlFbGVtZW50X0luZXJ0RG9jdW1lbnQoaHRtbDogc3RyaW5nKSB7XG4gICAgLy8gUHJlZmVyIHVzaW5nIDx0ZW1wbGF0ZT4gZWxlbWVudCBpZiBzdXBwb3J0ZWQuXG4gICAgY29uc3QgdGVtcGxhdGVFbCA9IHRoaXMuaW5lcnREb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgIGlmICgnY29udGVudCcgaW4gdGVtcGxhdGVFbCkge1xuICAgICAgdGVtcGxhdGVFbC5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgcmV0dXJuIHRlbXBsYXRlRWw7XG4gICAgfVxuXG4gICAgLy8gTm90ZSB0aGF0IHByZXZpb3VzbHkgd2UgdXNlZCB0byBkbyBzb21ldGhpbmcgbGlrZSBgdGhpcy5pbmVydERvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gaHRtbGBcbiAgICAvLyBhbmQgd2UgcmV0dXJuZWQgdGhlIGluZXJ0IGBib2R5YCBub2RlLiBUaGlzIHdhcyBjaGFuZ2VkLCBiZWNhdXNlIElFIHNlZW1zIHRvIHRyZWF0IHNldHRpbmdcbiAgICAvLyBgaW5uZXJIVE1MYCBvbiBhbiBpbnNlcnRlZCBlbGVtZW50IGRpZmZlcmVudGx5LCBjb21wYXJlZCB0byBvbmUgdGhhdCBoYXNuJ3QgYmVlbiBpbnNlcnRlZFxuICAgIC8vIHlldC4gSW4gcGFydGljdWxhciwgSUUgYXBwZWFycyB0byBzcGxpdCBzb21lIG9mIHRoZSB0ZXh0IGludG8gbXVsdGlwbGUgdGV4dCBub2RlcyByYXRoZXJcbiAgICAvLyB0aGFuIGtlZXBpbmcgdGhlbSBpbiBhIHNpbmdsZSBvbmUgd2hpY2ggZW5kcyB1cCBtZXNzaW5nIHdpdGggSXZ5J3MgaTE4biBwYXJzaW5nIGZ1cnRoZXJcbiAgICAvLyBkb3duIHRoZSBsaW5lLiBUaGlzIGhhcyBiZWVuIHdvcmtlZCBhcm91bmQgYnkgY3JlYXRpbmcgYSBuZXcgaW5lcnQgYGJvZHlgIGFuZCB1c2luZyBpdCBhc1xuICAgIC8vIHRoZSByb290IG5vZGUgaW4gd2hpY2ggd2UgaW5zZXJ0IHRoZSBIVE1MLlxuICAgIGNvbnN0IGluZXJ0Qm9keSA9IHRoaXMuaW5lcnREb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5Jyk7XG4gICAgaW5lcnRCb2R5LmlubmVySFRNTCA9IGh0bWw7XG5cbiAgICAvLyBTdXBwb3J0OiBJRSA5LTExIG9ubHlcbiAgICAvLyBzdHJpcCBjdXN0b20tbmFtZXNwYWNlZCBhdHRyaWJ1dGVzIG9uIElFPD0xMVxuICAgIGlmICgodGhpcy5kZWZhdWx0RG9jIGFzIGFueSkuZG9jdW1lbnRNb2RlKSB7XG4gICAgICB0aGlzLnN0cmlwQ3VzdG9tTnNBdHRycyhpbmVydEJvZHkpO1xuICAgIH1cblxuICAgIHJldHVybiBpbmVydEJvZHk7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiBJRTktMTEgY29tZXMgYWNyb3NzIGFuIHVua25vd24gbmFtZXNwYWNlZCBhdHRyaWJ1dGUgZS5nLiAneGxpbms6Zm9vJyBpdCBhZGRzICd4bWxuczpuczEnXG4gICAqIGF0dHJpYnV0ZSB0byBkZWNsYXJlIG5zMSBuYW1lc3BhY2UgYW5kIHByZWZpeGVzIHRoZSBhdHRyaWJ1dGUgd2l0aCAnbnMxJyAoZS5nLlxuICAgKiAnbnMxOnhsaW5rOmZvbycpLlxuICAgKlxuICAgKiBUaGlzIGlzIHVuZGVzaXJhYmxlIHNpbmNlIHdlIGRvbid0IHdhbnQgdG8gYWxsb3cgYW55IG9mIHRoZXNlIGN1c3RvbSBhdHRyaWJ1dGVzLiBUaGlzIG1ldGhvZFxuICAgKiBzdHJpcHMgdGhlbSBhbGwuXG4gICAqL1xuICBwcml2YXRlIHN0cmlwQ3VzdG9tTnNBdHRycyhlbDogRWxlbWVudCkge1xuICAgIGNvbnN0IGVsQXR0cnMgPSBlbC5hdHRyaWJ1dGVzO1xuICAgIC8vIGxvb3AgYmFja3dhcmRzIHNvIHRoYXQgd2UgY2FuIHN1cHBvcnQgcmVtb3ZhbHMuXG4gICAgZm9yIChsZXQgaSA9IGVsQXR0cnMubGVuZ3RoIC0gMTsgMCA8IGk7IGktLSkge1xuICAgICAgY29uc3QgYXR0cmliID0gZWxBdHRycy5pdGVtKGkpO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyaWIhLm5hbWU7XG4gICAgICBpZiAoYXR0ck5hbWUgPT09ICd4bWxuczpuczEnIHx8IGF0dHJOYW1lLmluZGV4T2YoJ25zMTonKSA9PT0gMCkge1xuICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgY2hpbGROb2RlID0gZWwuZmlyc3RDaGlsZCBhcyBOb2RlIHwgbnVsbDtcbiAgICB3aGlsZSAoY2hpbGROb2RlKSB7XG4gICAgICBpZiAoY2hpbGROb2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkgdGhpcy5zdHJpcEN1c3RvbU5zQXR0cnMoY2hpbGROb2RlIGFzIEVsZW1lbnQpO1xuICAgICAgY2hpbGROb2RlID0gY2hpbGROb2RlLm5leHRTaWJsaW5nO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdlIG5lZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIERPTVBhcnNlciBleGlzdHMgaW4gdGhlIGdsb2JhbCBjb250ZXh0LlxuICogVGhlIHRyeS1jYXRjaCBpcyBiZWNhdXNlLCBvbiBzb21lIGJyb3dzZXJzLCB0cnlpbmcgdG8gYWNjZXNzIHRoaXMgcHJvcGVydHlcbiAqIG9uIHdpbmRvdyBjYW4gYWN0dWFsbHkgdGhyb3cgYW4gZXJyb3IuXG4gKlxuICogQHN1cHByZXNzIHt1c2VsZXNzQ29kZX1cbiAqL1xuZnVuY3Rpb24gaXNET01QYXJzZXJBdmFpbGFibGUoKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuICEhKHdpbmRvdyBhcyBhbnkpLkRPTVBhcnNlcjtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXX0=