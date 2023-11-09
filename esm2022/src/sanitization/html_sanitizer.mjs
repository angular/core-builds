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
                current = current.firstChild;
                continue;
            }
            while (current) {
                // Leaving the element. Walk up and to the right, closing tags as we go.
                if (current.nodeType === Node.ELEMENT_NODE) {
                    this.endElement(current);
                }
                let next = this.checkClobberedElement(current, current.nextSibling);
                if (next) {
                    current = next;
                    break;
                }
                current = this.checkClobberedElement(current, current.parentNode);
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
        const tagName = element.nodeName.toLowerCase();
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
        const tagName = current.nodeName.toLowerCase();
        if (VALID_ELEMENTS.hasOwnProperty(tagName) && !VOID_ELEMENTS.hasOwnProperty(tagName)) {
            this.buf.push('</');
            this.buf.push(tagName);
            this.buf.push('>');
        }
    }
    chars(chars) {
        this.buf.push(encodeEntities(chars));
    }
    checkClobberedElement(node, nextNode) {
        if (nextNode &&
            (node.compareDocumentPosition(nextNode) &
                Node.DOCUMENT_POSITION_CONTAINED_BY) === Node.DOCUMENT_POSITION_CONTAINED_BY) {
            throw new Error(`Failed to sanitize html because the element is clobbered: ${node.outerHTML}`);
        }
        return nextNode;
    }
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
    return value.replace(/&/g, '&amp;')
        .replace(SURROGATE_PAIR_REGEXP, function (match) {
        const hi = match.charCodeAt(0);
        const low = match.charCodeAt(1);
        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
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
                parent.removeChild(parent.firstChild);
            }
        }
    }
}
export function getTemplateContent(el) {
    return 'content' in el /** Microsoft/TypeScript#21517 */ && isTemplateElement(el) ?
        el.content :
        null;
}
function isTemplateElement(el) {
    return el.nodeType === Node.ELEMENT_NODE && el.nodeName === 'TEMPLATE';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vaHRtbF9zYW5pdGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFM0QsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFFckUsT0FBTyxFQUFDLGtCQUFrQixFQUFrQixNQUFNLGNBQWMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFN0MsU0FBUyxNQUFNLENBQUMsSUFBWTtJQUMxQixNQUFNLEdBQUcsR0FBMkIsRUFBRSxDQUFDO0lBQ3ZDLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQy9DLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELFNBQVMsS0FBSyxDQUFDLEdBQUcsSUFBOEI7SUFDOUMsTUFBTSxHQUFHLEdBQTJCLEVBQUUsQ0FBQztJQUN2QyxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3JCLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3pDLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsb0RBQW9EO0FBQ3BELDBDQUEwQztBQUMxQyx3Q0FBd0M7QUFFeEMsNkJBQTZCO0FBQzdCLDhDQUE4QztBQUM5QyxNQUFNLGFBQWEsR0FB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IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1hTU19TRUNVUklUWV9VUkx9IGZyb20gJy4uL2Vycm9yX2RldGFpbHNfYmFzZV91cmwnO1xuaW1wb3J0IHtUcnVzdGVkSFRNTH0gZnJvbSAnLi4vdXRpbC9zZWN1cml0eS90cnVzdGVkX3R5cGVfZGVmcyc7XG5pbXBvcnQge3RydXN0ZWRIVE1MRnJvbVN0cmluZ30gZnJvbSAnLi4vdXRpbC9zZWN1cml0eS90cnVzdGVkX3R5cGVzJztcblxuaW1wb3J0IHtnZXRJbmVydEJvZHlIZWxwZXIsIEluZXJ0Qm9keUhlbHBlcn0gZnJvbSAnLi9pbmVydF9ib2R5JztcbmltcG9ydCB7X3Nhbml0aXplVXJsfSBmcm9tICcuL3VybF9zYW5pdGl6ZXInO1xuXG5mdW5jdGlvbiB0YWdTZXQodGFnczogc3RyaW5nKToge1trOiBzdHJpbmddOiBib29sZWFufSB7XG4gIGNvbnN0IHJlczoge1trOiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICBmb3IgKGNvbnN0IHQgb2YgdGFncy5zcGxpdCgnLCcpKSByZXNbdF0gPSB0cnVlO1xuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBtZXJnZSguLi5zZXRzOiB7W2s6IHN0cmluZ106IGJvb2xlYW59W10pOiB7W2s6IHN0cmluZ106IGJvb2xlYW59IHtcbiAgY29uc3QgcmVzOiB7W2s6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIGZvciAoY29uc3QgcyBvZiBzZXRzKSB7XG4gICAgZm9yIChjb25zdCB2IGluIHMpIHtcbiAgICAgIGlmIChzLmhhc093blByb3BlcnR5KHYpKSByZXNbdl0gPSB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG4vLyBHb29kIHNvdXJjZSBvZiBpbmZvIGFib3V0IGVsZW1lbnRzIGFuZCBhdHRyaWJ1dGVzXG4vLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnLyNzZW1hbnRpY3Ncbi8vIGh0dHBzOi8vc2ltb24uaHRtbDUub3JnL2h0bWwtZWxlbWVudHNcblxuLy8gU2FmZSBWb2lkIEVsZW1lbnRzIC0gSFRNTDVcbi8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvI3ZvaWQtZWxlbWVudHNcbmNvbnN0IFZPSURfRUxFTUVOVFMgPSB0YWdTZXQoJ2FyZWEsYnIsY29sLGhyLGltZyx3YnInKTtcblxuLy8gRWxlbWVudHMgdGhhdCB5b3UgY2FuLCBpbnRlbnRpb25hbGx5LCBsZWF2ZSBvcGVuIChhbmQgd2hpY2ggY2xvc2UgdGhlbXNlbHZlcylcbi8vIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvI29wdGlvbmFsLXRhZ3NcbmNvbnN0IE9QVElPTkFMX0VORF9UQUdfQkxPQ0tfRUxFTUVOVFMgPSB0YWdTZXQoJ2NvbGdyb3VwLGRkLGR0LGxpLHAsdGJvZHksdGQsdGZvb3QsdGgsdGhlYWQsdHInKTtcbmNvbnN0IE9QVElPTkFMX0VORF9UQUdfSU5MSU5FX0VMRU1FTlRTID0gdGFnU2V0KCdycCxydCcpO1xuY29uc3QgT1BUSU9OQUxfRU5EX1RBR19FTEVNRU5UUyA9XG4gICAgbWVyZ2UoT1BUSU9OQUxfRU5EX1RBR19JTkxJTkVfRUxFTUVOVFMsIE9QVElPTkFMX0VORF9UQUdfQkxPQ0tfRUxFTUVOVFMpO1xuXG4vLyBTYWZlIEJsb2NrIEVsZW1lbnRzIC0gSFRNTDVcbmNvbnN0IEJMT0NLX0VMRU1FTlRTID0gbWVyZ2UoXG4gICAgT1BUSU9OQUxfRU5EX1RBR19CTE9DS19FTEVNRU5UUyxcbiAgICB0YWdTZXQoXG4gICAgICAgICdhZGRyZXNzLGFydGljbGUsJyArXG4gICAgICAgICdhc2lkZSxibG9ja3F1b3RlLGNhcHRpb24sY2VudGVyLGRlbCxkZXRhaWxzLGRpYWxvZyxkaXIsZGl2LGRsLGZpZ3VyZSxmaWdjYXB0aW9uLGZvb3RlcixoMSxoMixoMyxoNCxoNSwnICtcbiAgICAgICAgJ2g2LGhlYWRlcixoZ3JvdXAsaHIsaW5zLG1haW4sbWFwLG1lbnUsbmF2LG9sLHByZSxzZWN0aW9uLHN1bW1hcnksdGFibGUsdWwnKSk7XG5cbi8vIElubGluZSBFbGVtZW50cyAtIEhUTUw1XG5jb25zdCBJTkxJTkVfRUxFTUVOVFMgPSBtZXJnZShcbiAgICBPUFRJT05BTF9FTkRfVEFHX0lOTElORV9FTEVNRU5UUyxcbiAgICB0YWdTZXQoXG4gICAgICAgICdhLGFiYnIsYWNyb255bSxhdWRpbyxiLCcgK1xuICAgICAgICAnYmRpLGJkbyxiaWcsYnIsY2l0ZSxjb2RlLGRlbCxkZm4sZW0sZm9udCxpLGltZyxpbnMsa2JkLGxhYmVsLG1hcCxtYXJrLHBpY3R1cmUscSxydWJ5LHJwLHJ0LHMsJyArXG4gICAgICAgICdzYW1wLHNtYWxsLHNvdXJjZSxzcGFuLHN0cmlrZSxzdHJvbmcsc3ViLHN1cCx0aW1lLHRyYWNrLHR0LHUsdmFyLHZpZGVvJykpO1xuXG5leHBvcnQgY29uc3QgVkFMSURfRUxFTUVOVFMgPVxuICAgIG1lcmdlKFZPSURfRUxFTUVOVFMsIEJMT0NLX0VMRU1FTlRTLCBJTkxJTkVfRUxFTUVOVFMsIE9QVElPTkFMX0VORF9UQUdfRUxFTUVOVFMpO1xuXG4vLyBBdHRyaWJ1dGVzIHRoYXQgaGF2ZSBocmVmIGFuZCBoZW5jZSBuZWVkIHRvIGJlIHNhbml0aXplZFxuZXhwb3J0IGNvbnN0IFVSSV9BVFRSUyA9IHRhZ1NldCgnYmFja2dyb3VuZCxjaXRlLGhyZWYsaXRlbXR5cGUsbG9uZ2Rlc2MscG9zdGVyLHNyYyx4bGluazpocmVmJyk7XG5cbmNvbnN0IEhUTUxfQVRUUlMgPSB0YWdTZXQoXG4gICAgJ2FiYnIsYWNjZXNza2V5LGFsaWduLGFsdCxhdXRvcGxheSxheGlzLGJnY29sb3IsYm9yZGVyLGNlbGxwYWRkaW5nLGNlbGxzcGFjaW5nLGNsYXNzLGNsZWFyLGNvbG9yLGNvbHMsY29sc3BhbiwnICtcbiAgICAnY29tcGFjdCxjb250cm9scyxjb29yZHMsZGF0ZXRpbWUsZGVmYXVsdCxkaXIsZG93bmxvYWQsZmFjZSxoZWFkZXJzLGhlaWdodCxoaWRkZW4saHJlZmxhbmcsaHNwYWNlLCcgK1xuICAgICdpc21hcCxpdGVtc2NvcGUsaXRlbXByb3Asa2luZCxsYWJlbCxsYW5nLGxhbmd1YWdlLGxvb3AsbWVkaWEsbXV0ZWQsbm9ocmVmLG5vd3JhcCxvcGVuLHByZWxvYWQscmVsLHJldixyb2xlLHJvd3Mscm93c3BhbixydWxlcywnICtcbiAgICAnc2NvcGUsc2Nyb2xsaW5nLHNoYXBlLHNpemUsc2l6ZXMsc3BhbixzcmNsYW5nLHNyY3NldCxzdGFydCxzdW1tYXJ5LHRhYmluZGV4LHRhcmdldCx0aXRsZSx0cmFuc2xhdGUsdHlwZSx1c2VtYXAsJyArXG4gICAgJ3ZhbGlnbix2YWx1ZSx2c3BhY2Usd2lkdGgnKTtcblxuLy8gQWNjZXNzaWJpbGl0eSBhdHRyaWJ1dGVzIGFzIHBlciBXQUktQVJJQSAxLjEgKFczQyBXb3JraW5nIERyYWZ0IDE0IERlY2VtYmVyIDIwMTgpXG5jb25zdCBBUklBX0FUVFJTID0gdGFnU2V0KFxuICAgICdhcmlhLWFjdGl2ZWRlc2NlbmRhbnQsYXJpYS1hdG9taWMsYXJpYS1hdXRvY29tcGxldGUsYXJpYS1idXN5LGFyaWEtY2hlY2tlZCxhcmlhLWNvbGNvdW50LGFyaWEtY29saW5kZXgsJyArXG4gICAgJ2FyaWEtY29sc3BhbixhcmlhLWNvbnRyb2xzLGFyaWEtY3VycmVudCxhcmlhLWRlc2NyaWJlZGJ5LGFyaWEtZGV0YWlscyxhcmlhLWRpc2FibGVkLGFyaWEtZHJvcGVmZmVjdCwnICtcbiAgICAnYXJpYS1lcnJvcm1lc3NhZ2UsYXJpYS1leHBhbmRlZCxhcmlhLWZsb3d0byxhcmlhLWdyYWJiZWQsYXJpYS1oYXNwb3B1cCxhcmlhLWhpZGRlbixhcmlhLWludmFsaWQsJyArXG4gICAgJ2FyaWEta2V5c2hvcnRjdXRzLGFyaWEtbGFiZWwsYXJpYS1sYWJlbGxlZGJ5LGFyaWEtbGV2ZWwsYXJpYS1saXZlLGFyaWEtbW9kYWwsYXJpYS1tdWx0aWxpbmUsJyArXG4gICAgJ2FyaWEtbXVsdGlzZWxlY3RhYmxlLGFyaWEtb3JpZW50YXRpb24sYXJpYS1vd25zLGFyaWEtcGxhY2Vob2xkZXIsYXJpYS1wb3NpbnNldCxhcmlhLXByZXNzZWQsYXJpYS1yZWFkb25seSwnICtcbiAgICAnYXJpYS1yZWxldmFudCxhcmlhLXJlcXVpcmVkLGFyaWEtcm9sZWRlc2NyaXB0aW9uLGFyaWEtcm93Y291bnQsYXJpYS1yb3dpbmRleCxhcmlhLXJvd3NwYW4sYXJpYS1zZWxlY3RlZCwnICtcbiAgICAnYXJpYS1zZXRzaXplLGFyaWEtc29ydCxhcmlhLXZhbHVlbWF4LGFyaWEtdmFsdWVtaW4sYXJpYS12YWx1ZW5vdyxhcmlhLXZhbHVldGV4dCcpO1xuXG4vLyBOQjogVGhpcyBjdXJyZW50bHkgY29uc2Npb3VzbHkgZG9lc24ndCBzdXBwb3J0IFNWRy4gU1ZHIHNhbml0aXphdGlvbiBoYXMgaGFkIHNldmVyYWwgc2VjdXJpdHlcbi8vIGlzc3VlcyBpbiB0aGUgcGFzdCwgc28gaXQgc2VlbXMgc2FmZXIgdG8gbGVhdmUgaXQgb3V0IGlmIHBvc3NpYmxlLiBJZiBzdXBwb3J0IGZvciBiaW5kaW5nIFNWRyB2aWFcbi8vIGlubmVySFRNTCBpcyByZXF1aXJlZCwgU1ZHIGF0dHJpYnV0ZXMgc2hvdWxkIGJlIGFkZGVkIGhlcmUuXG5cbi8vIE5COiBTYW5pdGl6YXRpb24gZG9lcyBub3QgYWxsb3cgPGZvcm0+IGVsZW1lbnRzIG9yIG90aGVyIGFjdGl2ZSBlbGVtZW50cyAoPGJ1dHRvbj4gZXRjKS4gVGhvc2Vcbi8vIGNhbiBiZSBzYW5pdGl6ZWQsIGJ1dCB0aGV5IGluY3JlYXNlIHNlY3VyaXR5IHN1cmZhY2UgYXJlYSB3aXRob3V0IGEgbGVnaXRpbWF0ZSB1c2UgY2FzZSwgc28gdGhleVxuLy8gYXJlIGxlZnQgb3V0IGhlcmUuXG5cbmV4cG9ydCBjb25zdCBWQUxJRF9BVFRSUyA9IG1lcmdlKFVSSV9BVFRSUywgSFRNTF9BVFRSUywgQVJJQV9BVFRSUyk7XG5cbi8vIEVsZW1lbnRzIHdob3NlIGNvbnRlbnQgc2hvdWxkIG5vdCBiZSB0cmF2ZXJzZWQvcHJlc2VydmVkLCBpZiB0aGUgZWxlbWVudHMgdGhlbXNlbHZlcyBhcmUgaW52YWxpZC5cbi8vXG4vLyBUeXBpY2FsbHksIGA8aW52YWxpZD5Tb21lIGNvbnRlbnQ8L2ludmFsaWQ+YCB3b3VsZCB0cmF2ZXJzZSAoYW5kIGluIHRoaXMgY2FzZSBwcmVzZXJ2ZSlcbi8vIGBTb21lIGNvbnRlbnRgLCBidXQgc3RyaXAgYGludmFsaWQtZWxlbWVudGAgb3BlbmluZy9jbG9zaW5nIHRhZ3MuIEZvciBzb21lIGVsZW1lbnRzLCB0aG91Z2gsIHdlXG4vLyBkb24ndCB3YW50IHRvIHByZXNlcnZlIHRoZSBjb250ZW50LCBpZiB0aGUgZWxlbWVudHMgdGhlbXNlbHZlcyBhcmUgZ29pbmcgdG8gYmUgcmVtb3ZlZC5cbmNvbnN0IFNLSVBfVFJBVkVSU0lOR19DT05URU5UX0lGX0lOVkFMSURfRUxFTUVOVFMgPSB0YWdTZXQoJ3NjcmlwdCxzdHlsZSx0ZW1wbGF0ZScpO1xuXG4vKipcbiAqIFNhbml0aXppbmdIdG1sU2VyaWFsaXplciBzZXJpYWxpemVzIGEgRE9NIGZyYWdtZW50LCBzdHJpcHBpbmcgb3V0IGFueSB1bnNhZmUgZWxlbWVudHMgYW5kIHVuc2FmZVxuICogYXR0cmlidXRlcy5cbiAqL1xuY2xhc3MgU2FuaXRpemluZ0h0bWxTZXJpYWxpemVyIHtcbiAgLy8gRXhwbGljaXRseSB0cmFjayBpZiBzb21ldGhpbmcgd2FzIHN0cmlwcGVkLCB0byBhdm9pZCBhY2NpZGVudGFsbHkgd2FybmluZyBvZiBzYW5pdGl6YXRpb24ganVzdFxuICAvLyBiZWNhdXNlIGNoYXJhY3RlcnMgd2VyZSByZS1lbmNvZGVkLlxuICBwdWJsaWMgc2FuaXRpemVkU29tZXRoaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgYnVmOiBzdHJpbmdbXSA9IFtdO1xuXG4gIHNhbml0aXplQ2hpbGRyZW4oZWw6IEVsZW1lbnQpOiBzdHJpbmcge1xuICAgIC8vIFRoaXMgY2Fubm90IHVzZSBhIFRyZWVXYWxrZXIsIGFzIGl0IGhhcyB0byBydW4gb24gQW5ndWxhcidzIHZhcmlvdXMgRE9NIGFkYXB0ZXJzLlxuICAgIC8vIEhvd2V2ZXIgdGhpcyBjb2RlIG5ldmVyIGFjY2Vzc2VzIHByb3BlcnRpZXMgb2ZmIG9mIGBkb2N1bWVudGAgYmVmb3JlIGRlbGV0aW5nIGl0cyBjb250ZW50c1xuICAgIC8vIGFnYWluLCBzbyBpdCBzaG91bGRuJ3QgYmUgdnVsbmVyYWJsZSB0byBET00gY2xvYmJlcmluZy5cbiAgICBsZXQgY3VycmVudDogTm9kZSA9IGVsLmZpcnN0Q2hpbGQhO1xuICAgIGxldCB0cmF2ZXJzZUNvbnRlbnQgPSB0cnVlO1xuICAgIHdoaWxlIChjdXJyZW50KSB7XG4gICAgICBpZiAoY3VycmVudC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgdHJhdmVyc2VDb250ZW50ID0gdGhpcy5zdGFydEVsZW1lbnQoY3VycmVudCBhcyBFbGVtZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgdGhpcy5jaGFycyhjdXJyZW50Lm5vZGVWYWx1ZSEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RyaXAgbm9uLWVsZW1lbnQsIG5vbi10ZXh0IG5vZGVzLlxuICAgICAgICB0aGlzLnNhbml0aXplZFNvbWV0aGluZyA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAodHJhdmVyc2VDb250ZW50ICYmIGN1cnJlbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICBjdXJyZW50ID0gY3VycmVudC5maXJzdENoaWxkITtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB3aGlsZSAoY3VycmVudCkge1xuICAgICAgICAvLyBMZWF2aW5nIHRoZSBlbGVtZW50LiBXYWxrIHVwIGFuZCB0byB0aGUgcmlnaHQsIGNsb3NpbmcgdGFncyBhcyB3ZSBnby5cbiAgICAgICAgaWYgKGN1cnJlbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgdGhpcy5lbmRFbGVtZW50KGN1cnJlbnQgYXMgRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbmV4dCA9IHRoaXMuY2hlY2tDbG9iYmVyZWRFbGVtZW50KGN1cnJlbnQsIGN1cnJlbnQubmV4dFNpYmxpbmchKTtcblxuICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgIGN1cnJlbnQgPSBuZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudCA9IHRoaXMuY2hlY2tDbG9iYmVyZWRFbGVtZW50KGN1cnJlbnQsIGN1cnJlbnQucGFyZW50Tm9kZSEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWYuam9pbignJyk7XG4gIH1cblxuICAvKipcbiAgICogU2FuaXRpemVzIGFuIG9wZW5pbmcgZWxlbWVudCB0YWcgKGlmIHZhbGlkKSBhbmQgcmV0dXJucyB3aGV0aGVyIHRoZSBlbGVtZW50J3MgY29udGVudHMgc2hvdWxkXG4gICAqIGJlIHRyYXZlcnNlZC4gRWxlbWVudCBjb250ZW50IG11c3QgYWx3YXlzIGJlIHRyYXZlcnNlZCAoZXZlbiBpZiB0aGUgZWxlbWVudCBpdHNlbGYgaXMgbm90XG4gICAqIHZhbGlkL3NhZmUpLCB1bmxlc3MgdGhlIGVsZW1lbnQgaXMgb25lIG9mIGBTS0lQX1RSQVZFUlNJTkdfQ09OVEVOVF9JRl9JTlZBTElEX0VMRU1FTlRTYC5cbiAgICpcbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc2FuaXRpemUuXG4gICAqIEByZXR1cm4gVHJ1ZSBpZiB0aGUgZWxlbWVudCdzIGNvbnRlbnRzIHNob3VsZCBiZSB0cmF2ZXJzZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXJ0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICB0aGlzLnNhbml0aXplZFNvbWV0aGluZyA9IHRydWU7XG4gICAgICByZXR1cm4gIVNLSVBfVFJBVkVSU0lOR19DT05URU5UX0lGX0lOVkFMSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSk7XG4gICAgfVxuICAgIHRoaXMuYnVmLnB1c2goJzwnKTtcbiAgICB0aGlzLmJ1Zi5wdXNoKHRhZ05hbWUpO1xuICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbEF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbEF0dHIgPSBlbEF0dHJzLml0ZW0oaSk7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGVsQXR0ciEubmFtZTtcbiAgICAgIGNvbnN0IGxvd2VyID0gYXR0ck5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmICghVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXIpKSB7XG4gICAgICAgIHRoaXMuc2FuaXRpemVkU29tZXRoaW5nID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsZXQgdmFsdWUgPSBlbEF0dHIhLnZhbHVlO1xuICAgICAgLy8gVE9ETyhtYXJ0aW5wcm9ic3QpOiBTcGVjaWFsIGNhc2UgaW1hZ2UgVVJJcyBmb3IgZGF0YTppbWFnZS8uLi5cbiAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJdKSB2YWx1ZSA9IF9zYW5pdGl6ZVVybCh2YWx1ZSk7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKCcgJywgYXR0ck5hbWUsICc9XCInLCBlbmNvZGVFbnRpdGllcyh2YWx1ZSksICdcIicpO1xuICAgIH1cbiAgICB0aGlzLmJ1Zi5wdXNoKCc+Jyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGVuZEVsZW1lbnQoY3VycmVudDogRWxlbWVudCkge1xuICAgIGNvbnN0IHRhZ05hbWUgPSBjdXJyZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKFZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpICYmICFWT0lEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKCc8LycpO1xuICAgICAgdGhpcy5idWYucHVzaCh0YWdOYW1lKTtcbiAgICAgIHRoaXMuYnVmLnB1c2goJz4nKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoYXJzKGNoYXJzOiBzdHJpbmcpIHtcbiAgICB0aGlzLmJ1Zi5wdXNoKGVuY29kZUVudGl0aWVzKGNoYXJzKSk7XG4gIH1cblxuICBjaGVja0Nsb2JiZXJlZEVsZW1lbnQobm9kZTogTm9kZSwgbmV4dE5vZGU6IE5vZGUpOiBOb2RlIHtcbiAgICBpZiAobmV4dE5vZGUgJiZcbiAgICAgICAgKG5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24obmV4dE5vZGUpICZcbiAgICAgICAgIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZKSA9PT3CoE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBzYW5pdGl6ZSBodG1sIGJlY2F1c2UgdGhlIGVsZW1lbnQgaXMgY2xvYmJlcmVkOiAke1xuICAgICAgICAgIChub2RlIGFzIEVsZW1lbnQpLm91dGVySFRNTH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIG5leHROb2RlO1xuICB9XG59XG5cbi8vIFJlZ3VsYXIgRXhwcmVzc2lvbnMgZm9yIHBhcnNpbmcgdGFncyBhbmQgYXR0cmlidXRlc1xuY29uc3QgU1VSUk9HQVRFX1BBSVJfUkVHRVhQID0gL1tcXHVEODAwLVxcdURCRkZdW1xcdURDMDAtXFx1REZGRl0vZztcbi8vICEgdG8gfiBpcyB0aGUgQVNDSUkgcmFuZ2UuXG5jb25zdCBOT05fQUxQSEFOVU1FUklDX1JFR0VYUCA9IC8oW15cXCMtfiB8IV0pL2c7XG5cbi8qKlxuICogRXNjYXBlcyBhbGwgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNoYXJhY3RlcnMsIHNvIHRoYXQgdGhlXG4gKiByZXN1bHRpbmcgc3RyaW5nIGNhbiBiZSBzYWZlbHkgaW5zZXJ0ZWQgaW50byBhdHRyaWJ1dGUgb3JcbiAqIGVsZW1lbnQgdGV4dC5cbiAqIEBwYXJhbSB2YWx1ZVxuICovXG5mdW5jdGlvbiBlbmNvZGVFbnRpdGllcyh2YWx1ZTogc3RyaW5nKSB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgICBTVVJST0dBVEVfUEFJUl9SRUdFWFAsXG4gICAgICAgICAgZnVuY3Rpb24obWF0Y2g6IHN0cmluZykge1xuICAgICAgICAgICAgY29uc3QgaGkgPSBtYXRjaC5jaGFyQ29kZUF0KDApO1xuICAgICAgICAgICAgY29uc3QgbG93ID0gbWF0Y2guY2hhckNvZGVBdCgxKTtcbiAgICAgICAgICAgIHJldHVybiAnJiMnICsgKCgoaGkgLSAweEQ4MDApICogMHg0MDApICsgKGxvdyAtIDB4REMwMCkgKyAweDEwMDAwKSArICc7JztcbiAgICAgICAgICB9KVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICAgTk9OX0FMUEhBTlVNRVJJQ19SRUdFWFAsXG4gICAgICAgICAgZnVuY3Rpb24obWF0Y2g6IHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuICcmIycgKyBtYXRjaC5jaGFyQ29kZUF0KDApICsgJzsnO1xuICAgICAgICAgIH0pXG4gICAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xufVxuXG5sZXQgaW5lcnRCb2R5SGVscGVyOiBJbmVydEJvZHlIZWxwZXI7XG5cbi8qKlxuICogU2FuaXRpemVzIHRoZSBnaXZlbiB1bnNhZmUsIHVudHJ1c3RlZCBIVE1MIGZyYWdtZW50LCBhbmQgcmV0dXJucyBIVE1MIHRleHQgdGhhdCBpcyBzYWZlIHRvIGFkZCB0b1xuICogdGhlIERPTSBpbiBhIGJyb3dzZXIgZW52aXJvbm1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfc2FuaXRpemVIdG1sKGRlZmF1bHREb2M6IGFueSwgdW5zYWZlSHRtbElucHV0OiBzdHJpbmcpOiBUcnVzdGVkSFRNTHxzdHJpbmcge1xuICBsZXQgaW5lcnRCb2R5RWxlbWVudDogSFRNTEVsZW1lbnR8bnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgaW5lcnRCb2R5SGVscGVyID0gaW5lcnRCb2R5SGVscGVyIHx8IGdldEluZXJ0Qm9keUhlbHBlcihkZWZhdWx0RG9jKTtcbiAgICAvLyBNYWtlIHN1cmUgdW5zYWZlSHRtbCBpcyBhY3R1YWxseSBhIHN0cmluZyAoVHlwZVNjcmlwdCB0eXBlcyBhcmUgbm90IGVuZm9yY2VkIGF0IHJ1bnRpbWUpLlxuICAgIGxldCB1bnNhZmVIdG1sID0gdW5zYWZlSHRtbElucHV0ID8gU3RyaW5nKHVuc2FmZUh0bWxJbnB1dCkgOiAnJztcbiAgICBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG5cbiAgICAvLyBtWFNTIHByb3RlY3Rpb24uIFJlcGVhdGVkbHkgcGFyc2UgdGhlIGRvY3VtZW50IHRvIG1ha2Ugc3VyZSBpdCBzdGFiaWxpemVzLCBzbyB0aGF0IGEgYnJvd3NlclxuICAgIC8vIHRyeWluZyB0byBhdXRvLWNvcnJlY3QgaW5jb3JyZWN0IEhUTUwgY2Fubm90IGNhdXNlIGZvcm1lcmx5IGluZXJ0IEhUTUwgdG8gYmVjb21lIGRhbmdlcm91cy5cbiAgICBsZXQgbVhTU0F0dGVtcHRzID0gNTtcbiAgICBsZXQgcGFyc2VkSHRtbCA9IHVuc2FmZUh0bWw7XG5cbiAgICBkbyB7XG4gICAgICBpZiAobVhTU0F0dGVtcHRzID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHNhbml0aXplIGh0bWwgYmVjYXVzZSB0aGUgaW5wdXQgaXMgdW5zdGFibGUnKTtcbiAgICAgIH1cbiAgICAgIG1YU1NBdHRlbXB0cy0tO1xuXG4gICAgICB1bnNhZmVIdG1sID0gcGFyc2VkSHRtbDtcbiAgICAgIHBhcnNlZEh0bWwgPSBpbmVydEJvZHlFbGVtZW50IS5pbm5lckhUTUw7XG4gICAgICBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG4gICAgfSB3aGlsZSAodW5zYWZlSHRtbCAhPT0gcGFyc2VkSHRtbCk7XG5cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSBuZXcgU2FuaXRpemluZ0h0bWxTZXJpYWxpemVyKCk7XG4gICAgY29uc3Qgc2FmZUh0bWwgPSBzYW5pdGl6ZXIuc2FuaXRpemVDaGlsZHJlbihcbiAgICAgICAgZ2V0VGVtcGxhdGVDb250ZW50KGluZXJ0Qm9keUVsZW1lbnQhKSBhcyBFbGVtZW50IHx8IGluZXJ0Qm9keUVsZW1lbnQpO1xuICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiBzYW5pdGl6ZXIuc2FuaXRpemVkU29tZXRoaW5nKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFdBUk5JTkc6IHNhbml0aXppbmcgSFRNTCBzdHJpcHBlZCBzb21lIGNvbnRlbnQsIHNlZSAke1hTU19TRUNVUklUWV9VUkx9YCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydXN0ZWRIVE1MRnJvbVN0cmluZyhzYWZlSHRtbCk7XG4gIH0gZmluYWxseSB7XG4gICAgLy8gSW4gY2FzZSBhbnl0aGluZyBnb2VzIHdyb25nLCBjbGVhciBvdXQgaW5lcnRFbGVtZW50IHRvIHJlc2V0IHRoZSBlbnRpcmUgRE9NIHN0cnVjdHVyZS5cbiAgICBpZiAoaW5lcnRCb2R5RWxlbWVudCkge1xuICAgICAgY29uc3QgcGFyZW50ID0gZ2V0VGVtcGxhdGVDb250ZW50KGluZXJ0Qm9keUVsZW1lbnQpIHx8IGluZXJ0Qm9keUVsZW1lbnQ7XG4gICAgICB3aGlsZSAocGFyZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHBhcmVudC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRlbXBsYXRlQ29udGVudChlbDogTm9kZSk6IE5vZGV8bnVsbCB7XG4gIHJldHVybiAnY29udGVudCcgaW4gKGVsIGFzIGFueSAvKiogTWljcm9zb2Z0L1R5cGVTY3JpcHQjMjE1MTcgKi8pICYmIGlzVGVtcGxhdGVFbGVtZW50KGVsKSA/XG4gICAgICBlbC5jb250ZW50IDpcbiAgICAgIG51bGw7XG59XG5mdW5jdGlvbiBpc1RlbXBsYXRlRWxlbWVudChlbDogTm9kZSk6IGVsIGlzIEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xuICByZXR1cm4gZWwubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFICYmIGVsLm5vZGVOYW1lID09PSAnVEVNUExBVEUnO1xufVxuIl19