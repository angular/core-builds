/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { XSS_SECURITY_URL } from '../error_details_base_url';
import { trustedHTMLFromString } from '../util/security/trusted_types';
import { getInertBodyHelper } from './inert_body';
import { _sanitizeUrl } from './url_sanitizer';
function tagSet(tags) {
    const res = {};
    for (const t of tags.split(','))
        res[t] = true;
    return res;
}
function merge(...sets) {
    const res = {};
    for (const s of sets) {
        for (const v in s) {
            if (s.hasOwnProperty(v))
                res[v] = true;
        }
    }
    return res;
}
// Good source of info about elements and attributes
// https://html.spec.whatwg.org/#semantics
// https://simon.html5.org/html-elements
// Safe Void Elements - HTML5
// https://html.spec.whatwg.org/#void-elements
const VOID_ELEMENTS = tagSet('area,br,col,hr,img,wbr');
// Elements that you can, intentionally, leave open (and which close themselves)
// https://html.spec.whatwg.org/#optional-tags
const OPTIONAL_END_TAG_BLOCK_ELEMENTS = tagSet('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr');
const OPTIONAL_END_TAG_INLINE_ELEMENTS = tagSet('rp,rt');
const OPTIONAL_END_TAG_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, OPTIONAL_END_TAG_BLOCK_ELEMENTS);
// Safe Block Elements - HTML5
const BLOCK_ELEMENTS = merge(OPTIONAL_END_TAG_BLOCK_ELEMENTS, tagSet('address,article,' +
    'aside,blockquote,caption,center,del,details,dialog,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
    'h6,header,hgroup,hr,ins,main,map,menu,nav,ol,pre,section,summary,table,ul'));
// Inline Elements - HTML5
const INLINE_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, tagSet('a,abbr,acronym,audio,b,' +
    'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,picture,q,ruby,rp,rt,s,' +
    'samp,small,source,span,strike,strong,sub,sup,time,track,tt,u,var,video'));
export const VALID_ELEMENTS = merge(VOID_ELEMENTS, BLOCK_ELEMENTS, INLINE_ELEMENTS, OPTIONAL_END_TAG_ELEMENTS);
// Attributes that have href and hence need to be sanitized
export const URI_ATTRS = tagSet('background,cite,href,itemtype,longdesc,poster,src,xlink:href');
const HTML_ATTRS = tagSet('abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,' +
    'compact,controls,coords,datetime,default,dir,download,face,headers,height,hidden,hreflang,hspace,' +
    'ismap,itemscope,itemprop,kind,label,lang,language,loop,media,muted,nohref,nowrap,open,preload,rel,rev,role,rows,rowspan,rules,' +
    'scope,scrolling,shape,size,sizes,span,srclang,srcset,start,summary,tabindex,target,title,translate,type,usemap,' +
    'valign,value,vspace,width');
// Accessibility attributes as per WAI-ARIA 1.1 (W3C Working Draft 14 December 2018)
const ARIA_ATTRS = tagSet('aria-activedescendant,aria-atomic,aria-autocomplete,aria-busy,aria-checked,aria-colcount,aria-colindex,' +
    'aria-colspan,aria-controls,aria-current,aria-describedby,aria-details,aria-disabled,aria-dropeffect,' +
    'aria-errormessage,aria-expanded,aria-flowto,aria-grabbed,aria-haspopup,aria-hidden,aria-invalid,' +
    'aria-keyshortcuts,aria-label,aria-labelledby,aria-level,aria-live,aria-modal,aria-multiline,' +
    'aria-multiselectable,aria-orientation,aria-owns,aria-placeholder,aria-posinset,aria-pressed,aria-readonly,' +
    'aria-relevant,aria-required,aria-roledescription,aria-rowcount,aria-rowindex,aria-rowspan,aria-selected,' +
    'aria-setsize,aria-sort,aria-valuemax,aria-valuemin,aria-valuenow,aria-valuetext');
// NB: This currently consciously doesn't support SVG. SVG sanitization has had several security
// issues in the past, so it seems safer to leave it out if possible. If support for binding SVG via
// innerHTML is required, SVG attributes should be added here.
// NB: Sanitization does not allow <form> elements or other active elements (<button> etc). Those
// can be sanitized, but they increase security surface area without a legitimate use case, so they
// are left out here.
export const VALID_ATTRS = merge(URI_ATTRS, HTML_ATTRS, ARIA_ATTRS);
// Elements whose content should not be traversed/preserved, if the elements themselves are invalid.
//
// Typically, `<invalid>Some content</invalid>` would traverse (and in this case preserve)
// `Some content`, but strip `invalid-element` opening/closing tags. For some elements, though, we
// don't want to preserve the content, if the elements themselves are going to be removed.
const SKIP_TRAVERSING_CONTENT_IF_INVALID_ELEMENTS = tagSet('script,style,template');
/**
 * SanitizingHtmlSerializer serializes a DOM fragment, stripping out any unsafe elements and unsafe
 * attributes.
 */
class SanitizingHtmlSerializer {
    constructor() {
        // Explicitly track if something was stripped, to avoid accidentally warning of sanitization just
        // because characters were re-encoded.
        this.sanitizedSomething = false;
        this.buf = [];
    }
    sanitizeChildren(el) {
        // This cannot use a TreeWalker, as it has to run on Angular's various DOM adapters.
        // However this code never accesses properties off of `document` before deleting its contents
        // again, so it shouldn't be vulnerable to DOM clobbering.
        let current = el.firstChild;
        let traverseContent = true;
        let parentNodes = [];
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                traverseContent = this.startElement(current);
            }
            else if (current.nodeType === Node.TEXT_NODE) {
                this.chars(current.nodeValue);
            }
            else {
                // Strip non-element, non-text nodes.
                this.sanitizedSomething = true;
            }
            if (traverseContent && current.firstChild) {
                // Push current node to the parent stack before entering its content.
                parentNodes.push(current);
                current = getFirstChild(current);
                continue;
            }
            while (current) {
                // Leaving the element.
                // Walk up and to the right, closing tags as we go.
                if (current.nodeType === Node.ELEMENT_NODE) {
                    this.endElement(current);
                }
                let next = getNextSibling(current);
                if (next) {
                    current = next;
                    break;
                }
                // There was no next sibling, walk up to the parent node (extract it from the stack).
                current = parentNodes.pop();
            }
        }
        return this.buf.join('');
    }
    /**
     * Sanitizes an opening element tag (if valid) and returns whether the element's contents should
     * be traversed. Element content must always be traversed (even if the element itself is not
     * valid/safe), unless the element is one of `SKIP_TRAVERSING_CONTENT_IF_INVALID_ELEMENTS`.
     *
     * @param element The element to sanitize.
     * @return True if the element's contents should be traversed.
     */
    startElement(element) {
        const tagName = getNodeName(element).toLowerCase();
        if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
            this.sanitizedSomething = true;
            return !SKIP_TRAVERSING_CONTENT_IF_INVALID_ELEMENTS.hasOwnProperty(tagName);
        }
        this.buf.push('<');
        this.buf.push(tagName);
        const elAttrs = element.attributes;
        for (let i = 0; i < elAttrs.length; i++) {
            const elAttr = elAttrs.item(i);
            const attrName = elAttr.name;
            const lower = attrName.toLowerCase();
            if (!VALID_ATTRS.hasOwnProperty(lower)) {
                this.sanitizedSomething = true;
                continue;
            }
            let value = elAttr.value;
            // TODO(martinprobst): Special case image URIs for data:image/...
            if (URI_ATTRS[lower])
                value = _sanitizeUrl(value);
            this.buf.push(' ', attrName, '="', encodeEntities(value), '"');
        }
        this.buf.push('>');
        return true;
    }
    endElement(current) {
        const tagName = getNodeName(current).toLowerCase();
        if (VALID_ELEMENTS.hasOwnProperty(tagName) && !VOID_ELEMENTS.hasOwnProperty(tagName)) {
            this.buf.push('</');
            this.buf.push(tagName);
            this.buf.push('>');
        }
    }
    chars(chars) {
        this.buf.push(encodeEntities(chars));
    }
}
/**
 * Verifies whether a given child node is a descendant of a given parent node.
 * It may not be the case when properties like `.firstChild` are clobbered and
 * accessing `.firstChild` results in an unexpected node returned.
 */
function isClobberedElement(parentNode, childNode) {
    return ((parentNode.compareDocumentPosition(childNode) & Node.DOCUMENT_POSITION_CONTAINED_BY) !==
        Node.DOCUMENT_POSITION_CONTAINED_BY);
}
/**
 * Retrieves next sibling node and makes sure that there is no
 * clobbering of the `nextSibling` property happening.
 */
function getNextSibling(node) {
    const nextSibling = node.nextSibling;
    // Make sure there is no `nextSibling` clobbering: navigating to
    // the next sibling and going back to the previous one should result
    // in the original node.
    if (nextSibling && node !== nextSibling.previousSibling) {
        throw clobberedElementError(nextSibling);
    }
    return nextSibling;
}
/**
 * Retrieves first child node and makes sure that there is no
 * clobbering of the `firstChild` property happening.
 */
function getFirstChild(node) {
    const firstChild = node.firstChild;
    if (firstChild && isClobberedElement(node, firstChild)) {
        throw clobberedElementError(firstChild);
    }
    return firstChild;
}
/** Gets a reasonable nodeName, even for clobbered nodes. */
export function getNodeName(node) {
    const nodeName = node.nodeName;
    // If the property is clobbered, assume it is an `HTMLFormElement`.
    return typeof nodeName === 'string' ? nodeName : 'FORM';
}
function clobberedElementError(node) {
    return new Error(`Failed to sanitize html because the element is clobbered: ${node.outerHTML}`);
}
// Regular Expressions for parsing tags and attributes
const SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
// ! to ~ is the ASCII range.
const NON_ALPHANUMERIC_REGEXP = /([^\#-~ |!])/g;
/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param value
 */
function encodeEntities(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(SURROGATE_PAIR_REGEXP, function (match) {
        const hi = match.charCodeAt(0);
        const low = match.charCodeAt(1);
        return '&#' + ((hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000) + ';';
    })
        .replace(NON_ALPHANUMERIC_REGEXP, function (match) {
        return '&#' + match.charCodeAt(0) + ';';
    })
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
let inertBodyHelper;
/**
 * Sanitizes the given unsafe, untrusted HTML fragment, and returns HTML text that is safe to add to
 * the DOM in a browser environment.
 */
export function _sanitizeHtml(defaultDoc, unsafeHtmlInput) {
    let inertBodyElement = null;
    try {
        inertBodyHelper = inertBodyHelper || getInertBodyHelper(defaultDoc);
        // Make sure unsafeHtml is actually a string (TypeScript types are not enforced at runtime).
        let unsafeHtml = unsafeHtmlInput ? String(unsafeHtmlInput) : '';
        inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
        // mXSS protection. Repeatedly parse the document to make sure it stabilizes, so that a browser
        // trying to auto-correct incorrect HTML cannot cause formerly inert HTML to become dangerous.
        let mXSSAttempts = 5;
        let parsedHtml = unsafeHtml;
        do {
            if (mXSSAttempts === 0) {
                throw new Error('Failed to sanitize html because the input is unstable');
            }
            mXSSAttempts--;
            unsafeHtml = parsedHtml;
            parsedHtml = inertBodyElement.innerHTML;
            inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
        } while (unsafeHtml !== parsedHtml);
        const sanitizer = new SanitizingHtmlSerializer();
        const safeHtml = sanitizer.sanitizeChildren(getTemplateContent(inertBodyElement) || inertBodyElement);
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && sanitizer.sanitizedSomething) {
            console.warn(`WARNING: sanitizing HTML stripped some content, see ${XSS_SECURITY_URL}`);
        }
        return trustedHTMLFromString(safeHtml);
    }
    finally {
        // In case anything goes wrong, clear out inertElement to reset the entire DOM structure.
        if (inertBodyElement) {
            const parent = getTemplateContent(inertBodyElement) || inertBodyElement;
            while (parent.firstChild) {
                parent.firstChild.remove();
            }
        }
    }
}
export function getTemplateContent(el) {
    return 'content' in el /** Microsoft/TypeScript#21517 */ && isTemplateElement(el)
        ? el.content
        : null;
}
function isTemplateElement(el) {
    return el.nodeType === Node.ELEMENT_NODE && el.nodeName === 'TEMPLATE';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vaHRtbF9zYW5pdGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFM0QsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFFckUsT0FBTyxFQUFDLGtCQUFrQixFQUFrQixNQUFNLGNBQWMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFN0MsU0FBUyxNQUFNLENBQUMsSUFBWTtJQUMxQixNQUFNLEdBQUcsR0FBMkIsRUFBRSxDQUFDO0lBQ3ZDLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQy9DLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELFNBQVMsS0FBSyxDQUFDLEdBQUcsSUFBOEI7SUFDOUMsTUFBTSxHQUFHLEdBQTJCLEVBQUUsQ0FBQztJQUN2QyxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3JCLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3pDLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsb0RBQW9EO0FBQ3BELDBDQUEwQztBQUMxQyx3Q0FBd0M7QUFFeEMsNkJBQTZCO0FBQzdCLDhDQUE4QztBQUM5QyxNQUFNLGFBQWEsR0FB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QUNGLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDcEYsT0FBTyxDQUFDLElBQUksQ0FBQyx1REFBdUQsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFRCxPQUFPLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7WUFBUyxDQUFDO1FBQ1QseUZBQXlGO1FBQ3pGLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztZQUNyQixNQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO1lBQ3hFLE9BQU8sTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN6QixNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzdCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsRUFBUTtJQUN6QyxPQUFPLFNBQVMsSUFBSyxFQUFVLENBQUMsaUNBQWlDLElBQUksaUJBQWlCLENBQUMsRUFBRSxDQUFDO1FBQ3hGLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTztRQUNaLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDWCxDQUFDO0FBQ0QsU0FBUyxpQkFBaUIsQ0FBQyxFQUFRO0lBQ2pDLE9BQU8sRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDO0FBQ3pFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtYU1NfU0VDVVJJVFlfVVJMfSBmcm9tICcuLi9lcnJvcl9kZXRhaWxzX2Jhc2VfdXJsJztcbmltcG9ydCB7VHJ1c3RlZEhUTUx9IGZyb20gJy4uL3V0aWwvc2VjdXJpdHkvdHJ1c3RlZF90eXBlX2RlZnMnO1xuaW1wb3J0IHt0cnVzdGVkSFRNTEZyb21TdHJpbmd9IGZyb20gJy4uL3V0aWwvc2VjdXJpdHkvdHJ1c3RlZF90eXBlcyc7XG5cbmltcG9ydCB7Z2V0SW5lcnRCb2R5SGVscGVyLCBJbmVydEJvZHlIZWxwZXJ9IGZyb20gJy4vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybH0gZnJvbSAnLi91cmxfc2FuaXRpemVyJztcblxuZnVuY3Rpb24gdGFnU2V0KHRhZ3M6IHN0cmluZyk6IHtbazogc3RyaW5nXTogYm9vbGVhbn0ge1xuICBjb25zdCByZXM6IHtbazogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgZm9yIChjb25zdCB0IG9mIHRhZ3Muc3BsaXQoJywnKSkgcmVzW3RdID0gdHJ1ZTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gbWVyZ2UoLi4uc2V0czoge1trOiBzdHJpbmddOiBib29sZWFufVtdKToge1trOiBzdHJpbmddOiBib29sZWFufSB7XG4gIGNvbnN0IHJlczoge1trOiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICBmb3IgKGNvbnN0IHMgb2Ygc2V0cykge1xuICAgIGZvciAoY29uc3QgdiBpbiBzKSB7XG4gICAgICBpZiAocy5oYXNPd25Qcm9wZXJ0eSh2KSkgcmVzW3ZdID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuLy8gR29vZCBzb3VyY2Ugb2YgaW5mbyBhYm91dCBlbGVtZW50cyBhbmQgYXR0cmlidXRlc1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy8jc2VtYW50aWNzXG4vLyBodHRwczovL3NpbW9uLmh0bWw1Lm9yZy9odG1sLWVsZW1lbnRzXG5cbi8vIFNhZmUgVm9pZCBFbGVtZW50cyAtIEhUTUw1XG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnLyN2b2lkLWVsZW1lbnRzXG5jb25zdCBWT0lEX0VMRU1FTlRTID0gdGFnU2V0KCdhcmVhLGJyLGNvbCxocixpbWcsd2JyJyk7XG5cbi8vIEVsZW1lbnRzIHRoYXQgeW91IGNhbiwgaW50ZW50aW9uYWxseSwgbGVhdmUgb3BlbiAoYW5kIHdoaWNoIGNsb3NlIHRoZW1zZWx2ZXMpXG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnLyNvcHRpb25hbC10YWdzXG5jb25zdCBPUFRJT05BTF9FTkRfVEFHX0JMT0NLX0VMRU1FTlRTID0gdGFnU2V0KCdjb2xncm91cCxkZCxkdCxsaSxwLHRib2R5LHRkLHRmb290LHRoLHRoZWFkLHRyJyk7XG5jb25zdCBPUFRJT05BTF9FTkRfVEFHX0lOTElORV9FTEVNRU5UUyA9IHRhZ1NldCgncnAscnQnKTtcbmNvbnN0IE9QVElPTkFMX0VORF9UQUdfRUxFTUVOVFMgPSBtZXJnZShcbiAgT1BUSU9OQUxfRU5EX1RBR19JTkxJTkVfRUxFTUVOVFMsXG4gIE9QVElPTkFMX0VORF9UQUdfQkxPQ0tfRUxFTUVOVFMsXG4pO1xuXG4vLyBTYWZlIEJsb2NrIEVsZW1lbnRzIC0gSFRNTDVcbmNvbnN0IEJMT0NLX0VMRU1FTlRTID0gbWVyZ2UoXG4gIE9QVElPTkFMX0VORF9UQUdfQkxPQ0tfRUxFTUVOVFMsXG4gIHRhZ1NldChcbiAgICAnYWRkcmVzcyxhcnRpY2xlLCcgK1xuICAgICAgJ2FzaWRlLGJsb2NrcXVvdGUsY2FwdGlvbixjZW50ZXIsZGVsLGRldGFpbHMsZGlhbG9nLGRpcixkaXYsZGwsZmlndXJlLGZpZ2NhcHRpb24sZm9vdGVyLGgxLGgyLGgzLGg0LGg1LCcgK1xuICAgICAgJ2g2LGhlYWRlcixoZ3JvdXAsaHIsaW5zLG1haW4sbWFwLG1lbnUsbmF2LG9sLHByZSxzZWN0aW9uLHN1bW1hcnksdGFibGUsdWwnLFxuICApLFxuKTtcblxuLy8gSW5saW5lIEVsZW1lbnRzIC0gSFRNTDVcbmNvbnN0IElOTElORV9FTEVNRU5UUyA9IG1lcmdlKFxuICBPUFRJT05BTF9FTkRfVEFHX0lOTElORV9FTEVNRU5UUyxcbiAgdGFnU2V0KFxuICAgICdhLGFiYnIsYWNyb255bSxhdWRpbyxiLCcgK1xuICAgICAgJ2JkaSxiZG8sYmlnLGJyLGNpdGUsY29kZSxkZWwsZGZuLGVtLGZvbnQsaSxpbWcsaW5zLGtiZCxsYWJlbCxtYXAsbWFyayxwaWN0dXJlLHEscnVieSxycCxydCxzLCcgK1xuICAgICAgJ3NhbXAsc21hbGwsc291cmNlLHNwYW4sc3RyaWtlLHN0cm9uZyxzdWIsc3VwLHRpbWUsdHJhY2ssdHQsdSx2YXIsdmlkZW8nLFxuICApLFxuKTtcblxuZXhwb3J0IGNvbnN0IFZBTElEX0VMRU1FTlRTID0gbWVyZ2UoXG4gIFZPSURfRUxFTUVOVFMsXG4gIEJMT0NLX0VMRU1FTlRTLFxuICBJTkxJTkVfRUxFTUVOVFMsXG4gIE9QVElPTkFMX0VORF9UQUdfRUxFTUVOVFMsXG4pO1xuXG4vLyBBdHRyaWJ1dGVzIHRoYXQgaGF2ZSBocmVmIGFuZCBoZW5jZSBuZWVkIHRvIGJlIHNhbml0aXplZFxuZXhwb3J0IGNvbnN0IFVSSV9BVFRSUyA9IHRhZ1NldCgnYmFja2dyb3VuZCxjaXRlLGhyZWYsaXRlbXR5cGUsbG9uZ2Rlc2MscG9zdGVyLHNyYyx4bGluazpocmVmJyk7XG5cbmNvbnN0IEhUTUxfQVRUUlMgPSB0YWdTZXQoXG4gICdhYmJyLGFjY2Vzc2tleSxhbGlnbixhbHQsYXV0b3BsYXksYXhpcyxiZ2NvbG9yLGJvcmRlcixjZWxscGFkZGluZyxjZWxsc3BhY2luZyxjbGFzcyxjbGVhcixjb2xvcixjb2xzLGNvbHNwYW4sJyArXG4gICAgJ2NvbXBhY3QsY29udHJvbHMsY29vcmRzLGRhdGV0aW1lLGRlZmF1bHQsZGlyLGRvd25sb2FkLGZhY2UsaGVhZGVycyxoZWlnaHQsaGlkZGVuLGhyZWZsYW5nLGhzcGFjZSwnICtcbiAgICAnaXNtYXAsaXRlbXNjb3BlLGl0ZW1wcm9wLGtpbmQsbGFiZWwsbGFuZyxsYW5ndWFnZSxsb29wLG1lZGlhLG11dGVkLG5vaHJlZixub3dyYXAsb3BlbixwcmVsb2FkLHJlbCxyZXYscm9sZSxyb3dzLHJvd3NwYW4scnVsZXMsJyArXG4gICAgJ3Njb3BlLHNjcm9sbGluZyxzaGFwZSxzaXplLHNpemVzLHNwYW4sc3JjbGFuZyxzcmNzZXQsc3RhcnQsc3VtbWFyeSx0YWJpbmRleCx0YXJnZXQsdGl0bGUsdHJhbnNsYXRlLHR5cGUsdXNlbWFwLCcgK1xuICAgICd2YWxpZ24sdmFsdWUsdnNwYWNlLHdpZHRoJyxcbik7XG5cbi8vIEFjY2Vzc2liaWxpdHkgYXR0cmlidXRlcyBhcyBwZXIgV0FJLUFSSUEgMS4xIChXM0MgV29ya2luZyBEcmFmdCAxNCBEZWNlbWJlciAyMDE4KVxuY29uc3QgQVJJQV9BVFRSUyA9IHRhZ1NldChcbiAgJ2FyaWEtYWN0aXZlZGVzY2VuZGFudCxhcmlhLWF0b21pYyxhcmlhLWF1dG9jb21wbGV0ZSxhcmlhLWJ1c3ksYXJpYS1jaGVja2VkLGFyaWEtY29sY291bnQsYXJpYS1jb2xpbmRleCwnICtcbiAgICAnYXJpYS1jb2xzcGFuLGFyaWEtY29udHJvbHMsYXJpYS1jdXJyZW50LGFyaWEtZGVzY3JpYmVkYnksYXJpYS1kZXRhaWxzLGFyaWEtZGlzYWJsZWQsYXJpYS1kcm9wZWZmZWN0LCcgK1xuICAgICdhcmlhLWVycm9ybWVzc2FnZSxhcmlhLWV4cGFuZGVkLGFyaWEtZmxvd3RvLGFyaWEtZ3JhYmJlZCxhcmlhLWhhc3BvcHVwLGFyaWEtaGlkZGVuLGFyaWEtaW52YWxpZCwnICtcbiAgICAnYXJpYS1rZXlzaG9ydGN1dHMsYXJpYS1sYWJlbCxhcmlhLWxhYmVsbGVkYnksYXJpYS1sZXZlbCxhcmlhLWxpdmUsYXJpYS1tb2RhbCxhcmlhLW11bHRpbGluZSwnICtcbiAgICAnYXJpYS1tdWx0aXNlbGVjdGFibGUsYXJpYS1vcmllbnRhdGlvbixhcmlhLW93bnMsYXJpYS1wbGFjZWhvbGRlcixhcmlhLXBvc2luc2V0LGFyaWEtcHJlc3NlZCxhcmlhLXJlYWRvbmx5LCcgK1xuICAgICdhcmlhLXJlbGV2YW50LGFyaWEtcmVxdWlyZWQsYXJpYS1yb2xlZGVzY3JpcHRpb24sYXJpYS1yb3djb3VudCxhcmlhLXJvd2luZGV4LGFyaWEtcm93c3BhbixhcmlhLXNlbGVjdGVkLCcgK1xuICAgICdhcmlhLXNldHNpemUsYXJpYS1zb3J0LGFyaWEtdmFsdWVtYXgsYXJpYS12YWx1ZW1pbixhcmlhLXZhbHVlbm93LGFyaWEtdmFsdWV0ZXh0Jyxcbik7XG5cbi8vIE5COiBUaGlzIGN1cnJlbnRseSBjb25zY2lvdXNseSBkb2Vzbid0IHN1cHBvcnQgU1ZHLiBTVkcgc2FuaXRpemF0aW9uIGhhcyBoYWQgc2V2ZXJhbCBzZWN1cml0eVxuLy8gaXNzdWVzIGluIHRoZSBwYXN0LCBzbyBpdCBzZWVtcyBzYWZlciB0byBsZWF2ZSBpdCBvdXQgaWYgcG9zc2libGUuIElmIHN1cHBvcnQgZm9yIGJpbmRpbmcgU1ZHIHZpYVxuLy8gaW5uZXJIVE1MIGlzIHJlcXVpcmVkLCBTVkcgYXR0cmlidXRlcyBzaG91bGQgYmUgYWRkZWQgaGVyZS5cblxuLy8gTkI6IFNhbml0aXphdGlvbiBkb2VzIG5vdCBhbGxvdyA8Zm9ybT4gZWxlbWVudHMgb3Igb3RoZXIgYWN0aXZlIGVsZW1lbnRzICg8YnV0dG9uPiBldGMpLiBUaG9zZVxuLy8gY2FuIGJlIHNhbml0aXplZCwgYnV0IHRoZXkgaW5jcmVhc2Ugc2VjdXJpdHkgc3VyZmFjZSBhcmVhIHdpdGhvdXQgYSBsZWdpdGltYXRlIHVzZSBjYXNlLCBzbyB0aGV5XG4vLyBhcmUgbGVmdCBvdXQgaGVyZS5cblxuZXhwb3J0IGNvbnN0IFZBTElEX0FUVFJTID0gbWVyZ2UoVVJJX0FUVFJTLCBIVE1MX0FUVFJTLCBBUklBX0FUVFJTKTtcblxuLy8gRWxlbWVudHMgd2hvc2UgY29udGVudCBzaG91bGQgbm90IGJlIHRyYXZlcnNlZC9wcmVzZXJ2ZWQsIGlmIHRoZSBlbGVtZW50cyB0aGVtc2VsdmVzIGFyZSBpbnZhbGlkLlxuLy9cbi8vIFR5cGljYWxseSwgYDxpbnZhbGlkPlNvbWUgY29udGVudDwvaW52YWxpZD5gIHdvdWxkIHRyYXZlcnNlIChhbmQgaW4gdGhpcyBjYXNlIHByZXNlcnZlKVxuLy8gYFNvbWUgY29udGVudGAsIGJ1dCBzdHJpcCBgaW52YWxpZC1lbGVtZW50YCBvcGVuaW5nL2Nsb3NpbmcgdGFncy4gRm9yIHNvbWUgZWxlbWVudHMsIHRob3VnaCwgd2Vcbi8vIGRvbid0IHdhbnQgdG8gcHJlc2VydmUgdGhlIGNvbnRlbnQsIGlmIHRoZSBlbGVtZW50cyB0aGVtc2VsdmVzIGFyZSBnb2luZyB0byBiZSByZW1vdmVkLlxuY29uc3QgU0tJUF9UUkFWRVJTSU5HX0NPTlRFTlRfSUZfSU5WQUxJRF9FTEVNRU5UUyA9IHRhZ1NldCgnc2NyaXB0LHN0eWxlLHRlbXBsYXRlJyk7XG5cbi8qKlxuICogU2FuaXRpemluZ0h0bWxTZXJpYWxpemVyIHNlcmlhbGl6ZXMgYSBET00gZnJhZ21lbnQsIHN0cmlwcGluZyBvdXQgYW55IHVuc2FmZSBlbGVtZW50cyBhbmQgdW5zYWZlXG4gKiBhdHRyaWJ1dGVzLlxuICovXG5jbGFzcyBTYW5pdGl6aW5nSHRtbFNlcmlhbGl6ZXIge1xuICAvLyBFeHBsaWNpdGx5IHRyYWNrIGlmIHNvbWV0aGluZyB3YXMgc3RyaXBwZWQsIHRvIGF2b2lkIGFjY2lkZW50YWxseSB3YXJuaW5nIG9mIHNhbml0aXphdGlvbiBqdXN0XG4gIC8vIGJlY2F1c2UgY2hhcmFjdGVycyB3ZXJlIHJlLWVuY29kZWQuXG4gIHB1YmxpYyBzYW5pdGl6ZWRTb21ldGhpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBidWY6IHN0cmluZ1tdID0gW107XG5cbiAgc2FuaXRpemVDaGlsZHJlbihlbDogRWxlbWVudCk6IHN0cmluZyB7XG4gICAgLy8gVGhpcyBjYW5ub3QgdXNlIGEgVHJlZVdhbGtlciwgYXMgaXQgaGFzIHRvIHJ1biBvbiBBbmd1bGFyJ3MgdmFyaW91cyBET00gYWRhcHRlcnMuXG4gICAgLy8gSG93ZXZlciB0aGlzIGNvZGUgbmV2ZXIgYWNjZXNzZXMgcHJvcGVydGllcyBvZmYgb2YgYGRvY3VtZW50YCBiZWZvcmUgZGVsZXRpbmcgaXRzIGNvbnRlbnRzXG4gICAgLy8gYWdhaW4sIHNvIGl0IHNob3VsZG4ndCBiZSB2dWxuZXJhYmxlIHRvIERPTSBjbG9iYmVyaW5nLlxuICAgIGxldCBjdXJyZW50OiBOb2RlID0gZWwuZmlyc3RDaGlsZCE7XG4gICAgbGV0IHRyYXZlcnNlQ29udGVudCA9IHRydWU7XG4gICAgbGV0IHBhcmVudE5vZGVzID0gW107XG4gICAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICAgIGlmIChjdXJyZW50Lm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICB0cmF2ZXJzZUNvbnRlbnQgPSB0aGlzLnN0YXJ0RWxlbWVudChjdXJyZW50IGFzIEVsZW1lbnQpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50Lm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICB0aGlzLmNoYXJzKGN1cnJlbnQubm9kZVZhbHVlISk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTdHJpcCBub24tZWxlbWVudCwgbm9uLXRleHQgbm9kZXMuXG4gICAgICAgIHRoaXMuc2FuaXRpemVkU29tZXRoaW5nID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICh0cmF2ZXJzZUNvbnRlbnQgJiYgY3VycmVudC5maXJzdENoaWxkKSB7XG4gICAgICAgIC8vIFB1c2ggY3VycmVudCBub2RlIHRvIHRoZSBwYXJlbnQgc3RhY2sgYmVmb3JlIGVudGVyaW5nIGl0cyBjb250ZW50LlxuICAgICAgICBwYXJlbnROb2Rlcy5wdXNoKGN1cnJlbnQpO1xuICAgICAgICBjdXJyZW50ID0gZ2V0Rmlyc3RDaGlsZChjdXJyZW50KSE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICAgICAgLy8gTGVhdmluZyB0aGUgZWxlbWVudC5cbiAgICAgICAgLy8gV2FsayB1cCBhbmQgdG8gdGhlIHJpZ2h0LCBjbG9zaW5nIHRhZ3MgYXMgd2UgZ28uXG4gICAgICAgIGlmIChjdXJyZW50Lm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgIHRoaXMuZW5kRWxlbWVudChjdXJyZW50IGFzIEVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5leHQgPSBnZXROZXh0U2libGluZyhjdXJyZW50KSE7XG5cbiAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICBjdXJyZW50ID0gbmV4dDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZXJlIHdhcyBubyBuZXh0IHNpYmxpbmcsIHdhbGsgdXAgdG8gdGhlIHBhcmVudCBub2RlIChleHRyYWN0IGl0IGZyb20gdGhlIHN0YWNrKS5cbiAgICAgICAgY3VycmVudCA9IHBhcmVudE5vZGVzLnBvcCgpITtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYnVmLmpvaW4oJycpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNhbml0aXplcyBhbiBvcGVuaW5nIGVsZW1lbnQgdGFnIChpZiB2YWxpZCkgYW5kIHJldHVybnMgd2hldGhlciB0aGUgZWxlbWVudCdzIGNvbnRlbnRzIHNob3VsZFxuICAgKiBiZSB0cmF2ZXJzZWQuIEVsZW1lbnQgY29udGVudCBtdXN0IGFsd2F5cyBiZSB0cmF2ZXJzZWQgKGV2ZW4gaWYgdGhlIGVsZW1lbnQgaXRzZWxmIGlzIG5vdFxuICAgKiB2YWxpZC9zYWZlKSwgdW5sZXNzIHRoZSBlbGVtZW50IGlzIG9uZSBvZiBgU0tJUF9UUkFWRVJTSU5HX0NPTlRFTlRfSUZfSU5WQUxJRF9FTEVNRU5UU2AuXG4gICAqXG4gICAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHNhbml0aXplLlxuICAgKiBAcmV0dXJuIFRydWUgaWYgdGhlIGVsZW1lbnQncyBjb250ZW50cyBzaG91bGQgYmUgdHJhdmVyc2VkLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGFydEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRhZ05hbWUgPSBnZXROb2RlTmFtZShlbGVtZW50KS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghVkFMSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSkpIHtcbiAgICAgIHRoaXMuc2FuaXRpemVkU29tZXRoaW5nID0gdHJ1ZTtcbiAgICAgIHJldHVybiAhU0tJUF9UUkFWRVJTSU5HX0NPTlRFTlRfSUZfSU5WQUxJRF9FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKTtcbiAgICB9XG4gICAgdGhpcy5idWYucHVzaCgnPCcpO1xuICAgIHRoaXMuYnVmLnB1c2godGFnTmFtZSk7XG4gICAgY29uc3QgZWxBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsQXR0ciA9IGVsQXR0cnMuaXRlbShpKTtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gZWxBdHRyIS5uYW1lO1xuICAgICAgY29uc3QgbG93ZXIgPSBhdHRyTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKCFWQUxJRF9BVFRSUy5oYXNPd25Qcm9wZXJ0eShsb3dlcikpIHtcbiAgICAgICAgdGhpcy5zYW5pdGl6ZWRTb21ldGhpbmcgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCB2YWx1ZSA9IGVsQXR0ciEudmFsdWU7XG4gICAgICAvLyBUT0RPKG1hcnRpbnByb2JzdCk6IFNwZWNpYWwgY2FzZSBpbWFnZSBVUklzIGZvciBkYXRhOmltYWdlLy4uLlxuICAgICAgaWYgKFVSSV9BVFRSU1tsb3dlcl0pIHZhbHVlID0gX3Nhbml0aXplVXJsKHZhbHVlKTtcbiAgICAgIHRoaXMuYnVmLnB1c2goJyAnLCBhdHRyTmFtZSwgJz1cIicsIGVuY29kZUVudGl0aWVzKHZhbHVlKSwgJ1wiJyk7XG4gICAgfVxuICAgIHRoaXMuYnVmLnB1c2goJz4nKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZW5kRWxlbWVudChjdXJyZW50OiBFbGVtZW50KSB7XG4gICAgY29uc3QgdGFnTmFtZSA9IGdldE5vZGVOYW1lKGN1cnJlbnQpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKFZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpICYmICFWT0lEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKCc8LycpO1xuICAgICAgdGhpcy5idWYucHVzaCh0YWdOYW1lKTtcbiAgICAgIHRoaXMuYnVmLnB1c2goJz4nKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoYXJzKGNoYXJzOiBzdHJpbmcpIHtcbiAgICB0aGlzLmJ1Zi5wdXNoKGVuY29kZUVudGl0aWVzKGNoYXJzKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBWZXJpZmllcyB3aGV0aGVyIGEgZ2l2ZW4gY2hpbGQgbm9kZSBpcyBhIGRlc2NlbmRhbnQgb2YgYSBnaXZlbiBwYXJlbnQgbm9kZS5cbiAqIEl0IG1heSBub3QgYmUgdGhlIGNhc2Ugd2hlbiBwcm9wZXJ0aWVzIGxpa2UgYC5maXJzdENoaWxkYCBhcmUgY2xvYmJlcmVkIGFuZFxuICogYWNjZXNzaW5nIGAuZmlyc3RDaGlsZGAgcmVzdWx0cyBpbiBhbiB1bmV4cGVjdGVkIG5vZGUgcmV0dXJuZWQuXG4gKi9cbmZ1bmN0aW9uIGlzQ2xvYmJlcmVkRWxlbWVudChwYXJlbnROb2RlOiBOb2RlLCBjaGlsZE5vZGU6IE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAocGFyZW50Tm9kZS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihjaGlsZE5vZGUpICYgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9DT05UQUlORURfQlkpICE9PVxuICAgIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZXG4gICk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIG5leHQgc2libGluZyBub2RlIGFuZCBtYWtlcyBzdXJlIHRoYXQgdGhlcmUgaXMgbm9cbiAqIGNsb2JiZXJpbmcgb2YgdGhlIGBuZXh0U2libGluZ2AgcHJvcGVydHkgaGFwcGVuaW5nLlxuICovXG5mdW5jdGlvbiBnZXROZXh0U2libGluZyhub2RlOiBOb2RlKTogTm9kZSB8IG51bGwge1xuICBjb25zdCBuZXh0U2libGluZyA9IG5vZGUubmV4dFNpYmxpbmc7XG4gIC8vIE1ha2Ugc3VyZSB0aGVyZSBpcyBubyBgbmV4dFNpYmxpbmdgIGNsb2JiZXJpbmc6IG5hdmlnYXRpbmcgdG9cbiAgLy8gdGhlIG5leHQgc2libGluZyBhbmQgZ29pbmcgYmFjayB0byB0aGUgcHJldmlvdXMgb25lIHNob3VsZCByZXN1bHRcbiAgLy8gaW4gdGhlIG9yaWdpbmFsIG5vZGUuXG4gIGlmIChuZXh0U2libGluZyAmJiBub2RlICE9PSBuZXh0U2libGluZy5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICB0aHJvdyBjbG9iYmVyZWRFbGVtZW50RXJyb3IobmV4dFNpYmxpbmcpO1xuICB9XG4gIHJldHVybiBuZXh0U2libGluZztcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgZmlyc3QgY2hpbGQgbm9kZSBhbmQgbWFrZXMgc3VyZSB0aGF0IHRoZXJlIGlzIG5vXG4gKiBjbG9iYmVyaW5nIG9mIHRoZSBgZmlyc3RDaGlsZGAgcHJvcGVydHkgaGFwcGVuaW5nLlxuICovXG5mdW5jdGlvbiBnZXRGaXJzdENoaWxkKG5vZGU6IE5vZGUpOiBOb2RlIHwgbnVsbCB7XG4gIGNvbnN0IGZpcnN0Q2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG4gIGlmIChmaXJzdENoaWxkICYmIGlzQ2xvYmJlcmVkRWxlbWVudChub2RlLCBmaXJzdENoaWxkKSkge1xuICAgIHRocm93IGNsb2JiZXJlZEVsZW1lbnRFcnJvcihmaXJzdENoaWxkKTtcbiAgfVxuICByZXR1cm4gZmlyc3RDaGlsZDtcbn1cblxuLyoqIEdldHMgYSByZWFzb25hYmxlIG5vZGVOYW1lLCBldmVuIGZvciBjbG9iYmVyZWQgbm9kZXMuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZU5hbWUobm9kZTogTm9kZSk6IHN0cmluZyB7XG4gIGNvbnN0IG5vZGVOYW1lID0gbm9kZS5ub2RlTmFtZTtcbiAgLy8gSWYgdGhlIHByb3BlcnR5IGlzIGNsb2JiZXJlZCwgYXNzdW1lIGl0IGlzIGFuIGBIVE1MRm9ybUVsZW1lbnRgLlxuICByZXR1cm4gdHlwZW9mIG5vZGVOYW1lID09PSAnc3RyaW5nJyA/IG5vZGVOYW1lIDogJ0ZPUk0nO1xufVxuXG5mdW5jdGlvbiBjbG9iYmVyZWRFbGVtZW50RXJyb3Iobm9kZTogTm9kZSkge1xuICByZXR1cm4gbmV3IEVycm9yKFxuICAgIGBGYWlsZWQgdG8gc2FuaXRpemUgaHRtbCBiZWNhdXNlIHRoZSBlbGVtZW50IGlzIGNsb2JiZXJlZDogJHsobm9kZSBhcyBFbGVtZW50KS5vdXRlckhUTUx9YCxcbiAgKTtcbn1cblxuLy8gUmVndWxhciBFeHByZXNzaW9ucyBmb3IgcGFyc2luZyB0YWdzIGFuZCBhdHRyaWJ1dGVzXG5jb25zdCBTVVJST0dBVEVfUEFJUl9SRUdFWFAgPSAvW1xcdUQ4MDAtXFx1REJGRl1bXFx1REMwMC1cXHVERkZGXS9nO1xuLy8gISB0byB+IGlzIHRoZSBBU0NJSSByYW5nZS5cbmNvbnN0IE5PTl9BTFBIQU5VTUVSSUNfUkVHRVhQID0gLyhbXlxcIy1+IHwhXSkvZztcblxuLyoqXG4gKiBFc2NhcGVzIGFsbCBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY2hhcmFjdGVycywgc28gdGhhdCB0aGVcbiAqIHJlc3VsdGluZyBzdHJpbmcgY2FuIGJlIHNhZmVseSBpbnNlcnRlZCBpbnRvIGF0dHJpYnV0ZSBvclxuICogZWxlbWVudCB0ZXh0LlxuICogQHBhcmFtIHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGVuY29kZUVudGl0aWVzKHZhbHVlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZShTVVJST0dBVEVfUEFJUl9SRUdFWFAsIGZ1bmN0aW9uIChtYXRjaDogc3RyaW5nKSB7XG4gICAgICBjb25zdCBoaSA9IG1hdGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgICBjb25zdCBsb3cgPSBtYXRjaC5jaGFyQ29kZUF0KDEpO1xuICAgICAgcmV0dXJuICcmIycgKyAoKGhpIC0gMHhkODAwKSAqIDB4NDAwICsgKGxvdyAtIDB4ZGMwMCkgKyAweDEwMDAwKSArICc7JztcbiAgICB9KVxuICAgIC5yZXBsYWNlKE5PTl9BTFBIQU5VTUVSSUNfUkVHRVhQLCBmdW5jdGlvbiAobWF0Y2g6IHN0cmluZykge1xuICAgICAgcmV0dXJuICcmIycgKyBtYXRjaC5jaGFyQ29kZUF0KDApICsgJzsnO1xuICAgIH0pXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG59XG5cbmxldCBpbmVydEJvZHlIZWxwZXI6IEluZXJ0Qm9keUhlbHBlcjtcblxuLyoqXG4gKiBTYW5pdGl6ZXMgdGhlIGdpdmVuIHVuc2FmZSwgdW50cnVzdGVkIEhUTUwgZnJhZ21lbnQsIGFuZCByZXR1cm5zIEhUTUwgdGV4dCB0aGF0IGlzIHNhZmUgdG8gYWRkIHRvXG4gKiB0aGUgRE9NIGluIGEgYnJvd3NlciBlbnZpcm9ubWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9zYW5pdGl6ZUh0bWwoZGVmYXVsdERvYzogYW55LCB1bnNhZmVIdG1sSW5wdXQ6IHN0cmluZyk6IFRydXN0ZWRIVE1MIHwgc3RyaW5nIHtcbiAgbGV0IGluZXJ0Qm9keUVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgaW5lcnRCb2R5SGVscGVyID0gaW5lcnRCb2R5SGVscGVyIHx8IGdldEluZXJ0Qm9keUhlbHBlcihkZWZhdWx0RG9jKTtcbiAgICAvLyBNYWtlIHN1cmUgdW5zYWZlSHRtbCBpcyBhY3R1YWxseSBhIHN0cmluZyAoVHlwZVNjcmlwdCB0eXBlcyBhcmUgbm90IGVuZm9yY2VkIGF0IHJ1bnRpbWUpLlxuICAgIGxldCB1bnNhZmVIdG1sID0gdW5zYWZlSHRtbElucHV0ID8gU3RyaW5nKHVuc2FmZUh0bWxJbnB1dCkgOiAnJztcbiAgICBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG5cbiAgICAvLyBtWFNTIHByb3RlY3Rpb24uIFJlcGVhdGVkbHkgcGFyc2UgdGhlIGRvY3VtZW50IHRvIG1ha2Ugc3VyZSBpdCBzdGFiaWxpemVzLCBzbyB0aGF0IGEgYnJvd3NlclxuICAgIC8vIHRyeWluZyB0byBhdXRvLWNvcnJlY3QgaW5jb3JyZWN0IEhUTUwgY2Fubm90IGNhdXNlIGZvcm1lcmx5IGluZXJ0IEhUTUwgdG8gYmVjb21lIGRhbmdlcm91cy5cbiAgICBsZXQgbVhTU0F0dGVtcHRzID0gNTtcbiAgICBsZXQgcGFyc2VkSHRtbCA9IHVuc2FmZUh0bWw7XG5cbiAgICBkbyB7XG4gICAgICBpZiAobVhTU0F0dGVtcHRzID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHNhbml0aXplIGh0bWwgYmVjYXVzZSB0aGUgaW5wdXQgaXMgdW5zdGFibGUnKTtcbiAgICAgIH1cbiAgICAgIG1YU1NBdHRlbXB0cy0tO1xuXG4gICAgICB1bnNhZmVIdG1sID0gcGFyc2VkSHRtbDtcbiAgICAgIHBhcnNlZEh0bWwgPSBpbmVydEJvZHlFbGVtZW50IS5pbm5lckhUTUw7XG4gICAgICBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG4gICAgfSB3aGlsZSAodW5zYWZlSHRtbCAhPT0gcGFyc2VkSHRtbCk7XG5cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSBuZXcgU2FuaXRpemluZ0h0bWxTZXJpYWxpemVyKCk7XG4gICAgY29uc3Qgc2FmZUh0bWwgPSBzYW5pdGl6ZXIuc2FuaXRpemVDaGlsZHJlbihcbiAgICAgIChnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCEpIGFzIEVsZW1lbnQpIHx8IGluZXJ0Qm9keUVsZW1lbnQsXG4gICAgKTtcbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgc2FuaXRpemVyLnNhbml0aXplZFNvbWV0aGluZykge1xuICAgICAgY29uc29sZS53YXJuKGBXQVJOSU5HOiBzYW5pdGl6aW5nIEhUTUwgc3RyaXBwZWQgc29tZSBjb250ZW50LCBzZWUgJHtYU1NfU0VDVVJJVFlfVVJMfWApO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVzdGVkSFRNTEZyb21TdHJpbmcoc2FmZUh0bWwpO1xuICB9IGZpbmFsbHkge1xuICAgIC8vIEluIGNhc2UgYW55dGhpbmcgZ29lcyB3cm9uZywgY2xlYXIgb3V0IGluZXJ0RWxlbWVudCB0byByZXNldCB0aGUgZW50aXJlIERPTSBzdHJ1Y3R1cmUuXG4gICAgaWYgKGluZXJ0Qm9keUVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50KSB8fCBpbmVydEJvZHlFbGVtZW50O1xuICAgICAgd2hpbGUgKHBhcmVudC5maXJzdENoaWxkKSB7XG4gICAgICAgIHBhcmVudC5maXJzdENoaWxkLnJlbW92ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVtcGxhdGVDb250ZW50KGVsOiBOb2RlKTogTm9kZSB8IG51bGwge1xuICByZXR1cm4gJ2NvbnRlbnQnIGluIChlbCBhcyBhbnkpIC8qKiBNaWNyb3NvZnQvVHlwZVNjcmlwdCMyMTUxNyAqLyAmJiBpc1RlbXBsYXRlRWxlbWVudChlbClcbiAgICA/IGVsLmNvbnRlbnRcbiAgICA6IG51bGw7XG59XG5mdW5jdGlvbiBpc1RlbXBsYXRlRWxlbWVudChlbDogTm9kZSk6IGVsIGlzIEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xuICByZXR1cm4gZWwubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFICYmIGVsLm5vZGVOYW1lID09PSAnVEVNUExBVEUnO1xufVxuIl19