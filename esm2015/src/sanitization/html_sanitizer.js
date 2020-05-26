/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../util/is_dev_mode';
import { InertBodyHelper } from './inert_body';
import { _sanitizeUrl, sanitizeSrcset } from './url_sanitizer';
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
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements
// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
const VOID_ELEMENTS = tagSet('area,br,col,hr,img,wbr');
// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
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
// Attributes that have special href set hence need to be sanitized
export const SRCSET_ATTRS = tagSet('srcset');
const HTML_ATTRS = tagSet('abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,' +
    'compact,controls,coords,datetime,default,dir,download,face,headers,height,hidden,hreflang,hspace,' +
    'ismap,itemscope,itemprop,kind,label,lang,language,loop,media,muted,nohref,nowrap,open,preload,rel,rev,role,rows,rowspan,rules,' +
    'scope,scrolling,shape,size,sizes,span,srclang,start,summary,tabindex,target,title,translate,type,usemap,' +
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
export const VALID_ATTRS = merge(URI_ATTRS, SRCSET_ATTRS, HTML_ATTRS, ARIA_ATTRS);
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
            if (SRCSET_ATTRS[lower])
                value = sanitizeSrcset(value);
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
        inertBodyHelper = inertBodyHelper || new InertBodyHelper(defaultDoc);
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
        if (isDevMode() && sanitizer.sanitizedSomething) {
            console.warn('WARNING: sanitizing HTML stripped some content, see http://g.co/ng/security#xss');
        }
        return safeHtml;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vaHRtbF9zYW5pdGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLFlBQVksRUFBRSxjQUFjLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUU3RCxTQUFTLE1BQU0sQ0FBQyxJQUFZO0lBQzFCLE1BQU0sR0FBRyxHQUEyQixFQUFFLENBQUM7SUFDdkMsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDL0MsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsU0FBUyxLQUFLLENBQUMsR0FBRyxJQUE4QjtJQUM5QyxNQUFNLEdBQUcsR0FBMkIsRUFBRSxDQUFDO0lBQ3ZDLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxFQUFFO1FBQ3BCLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2pCLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUN4QztLQUNGO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsb0RBQW9EO0FBQ3BELHVEQUF1RDtBQUN2RCx1Q0FBdUM7QUFFdkMsNkJBQTZCO0FBQzdCLDJEQUEyRDtBQUMzRCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUV2RCxnRkFBZ0Y7QUFDaEYsMkRBQTJEO0FBQzNE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d0IsRUFBRSxDQUFDO1FBQ2pELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FDdkMsa0JBQWtCLENBQUMsZ0JBQWlCLENBQVksSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzFFLElBQUksU0FBUyxFQUFFLElBQUksU0FBUyxDQUFDLGtCQUFrQixFQUFFO1lBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQ1IsaUZBQWlGLENBQUMsQ0FBQztTQUN4RjtRQUVELE9BQU8sUUFBUSxDQUFDO0tBQ2pCO1lBQVM7UUFDUix5RkFBeUY7UUFDekYsSUFBSSxnQkFBZ0IsRUFBRTtZQUNwQixNQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO1lBQ3hFLE9BQU8sTUFBTSxDQUFDLFVBQVUsRUFBRTtnQkFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDdkM7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxFQUFRO0lBQ3pDLE9BQU8sU0FBUyxJQUFLLEVBQVMsQ0FBQyxpQ0FBa0MsSUFBSSxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hGLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQztBQUNYLENBQUM7QUFDRCxTQUFTLGlCQUFpQixDQUFDLEVBQVE7SUFDakMsT0FBTyxFQUFFLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUM7QUFDekUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc0Rldk1vZGV9IGZyb20gJy4uL3V0aWwvaXNfZGV2X21vZGUnO1xuaW1wb3J0IHtJbmVydEJvZHlIZWxwZXJ9IGZyb20gJy4vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybCwgc2FuaXRpemVTcmNzZXR9IGZyb20gJy4vdXJsX3Nhbml0aXplcic7XG5cbmZ1bmN0aW9uIHRhZ1NldCh0YWdzOiBzdHJpbmcpOiB7W2s6IHN0cmluZ106IGJvb2xlYW59IHtcbiAgY29uc3QgcmVzOiB7W2s6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIGZvciAoY29uc3QgdCBvZiB0YWdzLnNwbGl0KCcsJykpIHJlc1t0XSA9IHRydWU7XG4gIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIG1lcmdlKC4uLnNldHM6IHtbazogc3RyaW5nXTogYm9vbGVhbn1bXSk6IHtbazogc3RyaW5nXTogYm9vbGVhbn0ge1xuICBjb25zdCByZXM6IHtbazogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgZm9yIChjb25zdCBzIG9mIHNldHMpIHtcbiAgICBmb3IgKGNvbnN0IHYgaW4gcykge1xuICAgICAgaWYgKHMuaGFzT3duUHJvcGVydHkodikpIHJlc1t2XSA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59XG5cbi8vIEdvb2Qgc291cmNlIG9mIGluZm8gYWJvdXQgZWxlbWVudHMgYW5kIGF0dHJpYnV0ZXNcbi8vIGh0dHA6Ly9kZXYudzMub3JnL2h0bWw1L3NwZWMvT3ZlcnZpZXcuaHRtbCNzZW1hbnRpY3Ncbi8vIGh0dHA6Ly9zaW1vbi5odG1sNS5vcmcvaHRtbC1lbGVtZW50c1xuXG4vLyBTYWZlIFZvaWQgRWxlbWVudHMgLSBIVE1MNVxuLy8gaHR0cDovL2Rldi53My5vcmcvaHRtbDUvc3BlYy9PdmVydmlldy5odG1sI3ZvaWQtZWxlbWVudHNcbmNvbnN0IFZPSURfRUxFTUVOVFMgPSB0YWdTZXQoJ2FyZWEsYnIsY29sLGhyLGltZyx3YnInKTtcblxuLy8gRWxlbWVudHMgdGhhdCB5b3UgY2FuLCBpbnRlbnRpb25hbGx5LCBsZWF2ZSBvcGVuIChhbmQgd2hpY2ggY2xvc2UgdGhlbXNlbHZlcylcbi8vIGh0dHA6Ly9kZXYudzMub3JnL2h0bWw1L3NwZWMvT3ZlcnZpZXcuaHRtbCNvcHRpb25hbC10YWdzXG5jb25zdCBPUFRJT05BTF9FTkRfVEFHX0JMT0NLX0VMRU1FTlRTID0gdGFnU2V0KCdjb2xncm91cCxkZCxkdCxsaSxwLHRib2R5LHRkLHRmb290LHRoLHRoZWFkLHRyJyk7XG5jb25zdCBPUFRJT05BTF9FTkRfVEFHX0lOTElORV9FTEVNRU5UUyA9IHRhZ1NldCgncnAscnQnKTtcbmNvbnN0IE9QVElPTkFMX0VORF9UQUdfRUxFTUVOVFMgPVxuICAgIG1lcmdlKE9QVElPTkFMX0VORF9UQUdfSU5MSU5FX0VMRU1FTlRTLCBPUFRJT05BTF9FTkRfVEFHX0JMT0NLX0VMRU1FTlRTKTtcblxuLy8gU2FmZSBCbG9jayBFbGVtZW50cyAtIEhUTUw1XG5jb25zdCBCTE9DS19FTEVNRU5UUyA9IG1lcmdlKFxuICAgIE9QVElPTkFMX0VORF9UQUdfQkxPQ0tfRUxFTUVOVFMsXG4gICAgdGFnU2V0KFxuICAgICAgICAnYWRkcmVzcyxhcnRpY2xlLCcgK1xuICAgICAgICAnYXNpZGUsYmxvY2txdW90ZSxjYXB0aW9uLGNlbnRlcixkZWwsZGV0YWlscyxkaWFsb2csZGlyLGRpdixkbCxmaWd1cmUsZmlnY2FwdGlvbixmb290ZXIsaDEsaDIsaDMsaDQsaDUsJyArXG4gICAgICAgICdoNixoZWFkZXIsaGdyb3VwLGhyLGlucyxtYWluLG1hcCxtZW51LG5hdixvbCxwcmUsc2VjdGlvbixzdW1tYXJ5LHRhYmxlLHVsJykpO1xuXG4vLyBJbmxpbmUgRWxlbWVudHMgLSBIVE1MNVxuY29uc3QgSU5MSU5FX0VMRU1FTlRTID0gbWVyZ2UoXG4gICAgT1BUSU9OQUxfRU5EX1RBR19JTkxJTkVfRUxFTUVOVFMsXG4gICAgdGFnU2V0KFxuICAgICAgICAnYSxhYmJyLGFjcm9ueW0sYXVkaW8sYiwnICtcbiAgICAgICAgJ2JkaSxiZG8sYmlnLGJyLGNpdGUsY29kZSxkZWwsZGZuLGVtLGZvbnQsaSxpbWcsaW5zLGtiZCxsYWJlbCxtYXAsbWFyayxwaWN0dXJlLHEscnVieSxycCxydCxzLCcgK1xuICAgICAgICAnc2FtcCxzbWFsbCxzb3VyY2Usc3BhbixzdHJpa2Usc3Ryb25nLHN1YixzdXAsdGltZSx0cmFjayx0dCx1LHZhcix2aWRlbycpKTtcblxuZXhwb3J0IGNvbnN0IFZBTElEX0VMRU1FTlRTID1cbiAgICBtZXJnZShWT0lEX0VMRU1FTlRTLCBCTE9DS19FTEVNRU5UUywgSU5MSU5FX0VMRU1FTlRTLCBPUFRJT05BTF9FTkRfVEFHX0VMRU1FTlRTKTtcblxuLy8gQXR0cmlidXRlcyB0aGF0IGhhdmUgaHJlZiBhbmQgaGVuY2UgbmVlZCB0byBiZSBzYW5pdGl6ZWRcbmV4cG9ydCBjb25zdCBVUklfQVRUUlMgPSB0YWdTZXQoJ2JhY2tncm91bmQsY2l0ZSxocmVmLGl0ZW10eXBlLGxvbmdkZXNjLHBvc3RlcixzcmMseGxpbms6aHJlZicpO1xuXG4vLyBBdHRyaWJ1dGVzIHRoYXQgaGF2ZSBzcGVjaWFsIGhyZWYgc2V0IGhlbmNlIG5lZWQgdG8gYmUgc2FuaXRpemVkXG5leHBvcnQgY29uc3QgU1JDU0VUX0FUVFJTID0gdGFnU2V0KCdzcmNzZXQnKTtcblxuY29uc3QgSFRNTF9BVFRSUyA9IHRhZ1NldChcbiAgICAnYWJicixhY2Nlc3NrZXksYWxpZ24sYWx0LGF1dG9wbGF5LGF4aXMsYmdjb2xvcixib3JkZXIsY2VsbHBhZGRpbmcsY2VsbHNwYWNpbmcsY2xhc3MsY2xlYXIsY29sb3IsY29scyxjb2xzcGFuLCcgK1xuICAgICdjb21wYWN0LGNvbnRyb2xzLGNvb3JkcyxkYXRldGltZSxkZWZhdWx0LGRpcixkb3dubG9hZCxmYWNlLGhlYWRlcnMsaGVpZ2h0LGhpZGRlbixocmVmbGFuZyxoc3BhY2UsJyArXG4gICAgJ2lzbWFwLGl0ZW1zY29wZSxpdGVtcHJvcCxraW5kLGxhYmVsLGxhbmcsbGFuZ3VhZ2UsbG9vcCxtZWRpYSxtdXRlZCxub2hyZWYsbm93cmFwLG9wZW4scHJlbG9hZCxyZWwscmV2LHJvbGUscm93cyxyb3dzcGFuLHJ1bGVzLCcgK1xuICAgICdzY29wZSxzY3JvbGxpbmcsc2hhcGUsc2l6ZSxzaXplcyxzcGFuLHNyY2xhbmcsc3RhcnQsc3VtbWFyeSx0YWJpbmRleCx0YXJnZXQsdGl0bGUsdHJhbnNsYXRlLHR5cGUsdXNlbWFwLCcgK1xuICAgICd2YWxpZ24sdmFsdWUsdnNwYWNlLHdpZHRoJyk7XG5cbi8vIEFjY2Vzc2liaWxpdHkgYXR0cmlidXRlcyBhcyBwZXIgV0FJLUFSSUEgMS4xIChXM0MgV29ya2luZyBEcmFmdCAxNCBEZWNlbWJlciAyMDE4KVxuY29uc3QgQVJJQV9BVFRSUyA9IHRhZ1NldChcbiAgICAnYXJpYS1hY3RpdmVkZXNjZW5kYW50LGFyaWEtYXRvbWljLGFyaWEtYXV0b2NvbXBsZXRlLGFyaWEtYnVzeSxhcmlhLWNoZWNrZWQsYXJpYS1jb2xjb3VudCxhcmlhLWNvbGluZGV4LCcgK1xuICAgICdhcmlhLWNvbHNwYW4sYXJpYS1jb250cm9scyxhcmlhLWN1cnJlbnQsYXJpYS1kZXNjcmliZWRieSxhcmlhLWRldGFpbHMsYXJpYS1kaXNhYmxlZCxhcmlhLWRyb3BlZmZlY3QsJyArXG4gICAgJ2FyaWEtZXJyb3JtZXNzYWdlLGFyaWEtZXhwYW5kZWQsYXJpYS1mbG93dG8sYXJpYS1ncmFiYmVkLGFyaWEtaGFzcG9wdXAsYXJpYS1oaWRkZW4sYXJpYS1pbnZhbGlkLCcgK1xuICAgICdhcmlhLWtleXNob3J0Y3V0cyxhcmlhLWxhYmVsLGFyaWEtbGFiZWxsZWRieSxhcmlhLWxldmVsLGFyaWEtbGl2ZSxhcmlhLW1vZGFsLGFyaWEtbXVsdGlsaW5lLCcgK1xuICAgICdhcmlhLW11bHRpc2VsZWN0YWJsZSxhcmlhLW9yaWVudGF0aW9uLGFyaWEtb3ducyxhcmlhLXBsYWNlaG9sZGVyLGFyaWEtcG9zaW5zZXQsYXJpYS1wcmVzc2VkLGFyaWEtcmVhZG9ubHksJyArXG4gICAgJ2FyaWEtcmVsZXZhbnQsYXJpYS1yZXF1aXJlZCxhcmlhLXJvbGVkZXNjcmlwdGlvbixhcmlhLXJvd2NvdW50LGFyaWEtcm93aW5kZXgsYXJpYS1yb3dzcGFuLGFyaWEtc2VsZWN0ZWQsJyArXG4gICAgJ2FyaWEtc2V0c2l6ZSxhcmlhLXNvcnQsYXJpYS12YWx1ZW1heCxhcmlhLXZhbHVlbWluLGFyaWEtdmFsdWVub3csYXJpYS12YWx1ZXRleHQnKTtcblxuLy8gTkI6IFRoaXMgY3VycmVudGx5IGNvbnNjaW91c2x5IGRvZXNuJ3Qgc3VwcG9ydCBTVkcuIFNWRyBzYW5pdGl6YXRpb24gaGFzIGhhZCBzZXZlcmFsIHNlY3VyaXR5XG4vLyBpc3N1ZXMgaW4gdGhlIHBhc3QsIHNvIGl0IHNlZW1zIHNhZmVyIHRvIGxlYXZlIGl0IG91dCBpZiBwb3NzaWJsZS4gSWYgc3VwcG9ydCBmb3IgYmluZGluZyBTVkcgdmlhXG4vLyBpbm5lckhUTUwgaXMgcmVxdWlyZWQsIFNWRyBhdHRyaWJ1dGVzIHNob3VsZCBiZSBhZGRlZCBoZXJlLlxuXG4vLyBOQjogU2FuaXRpemF0aW9uIGRvZXMgbm90IGFsbG93IDxmb3JtPiBlbGVtZW50cyBvciBvdGhlciBhY3RpdmUgZWxlbWVudHMgKDxidXR0b24+IGV0YykuIFRob3NlXG4vLyBjYW4gYmUgc2FuaXRpemVkLCBidXQgdGhleSBpbmNyZWFzZSBzZWN1cml0eSBzdXJmYWNlIGFyZWEgd2l0aG91dCBhIGxlZ2l0aW1hdGUgdXNlIGNhc2UsIHNvIHRoZXlcbi8vIGFyZSBsZWZ0IG91dCBoZXJlLlxuXG5leHBvcnQgY29uc3QgVkFMSURfQVRUUlMgPSBtZXJnZShVUklfQVRUUlMsIFNSQ1NFVF9BVFRSUywgSFRNTF9BVFRSUywgQVJJQV9BVFRSUyk7XG5cbi8vIEVsZW1lbnRzIHdob3NlIGNvbnRlbnQgc2hvdWxkIG5vdCBiZSB0cmF2ZXJzZWQvcHJlc2VydmVkLCBpZiB0aGUgZWxlbWVudHMgdGhlbXNlbHZlcyBhcmUgaW52YWxpZC5cbi8vXG4vLyBUeXBpY2FsbHksIGA8aW52YWxpZD5Tb21lIGNvbnRlbnQ8L2ludmFsaWQ+YCB3b3VsZCB0cmF2ZXJzZSAoYW5kIGluIHRoaXMgY2FzZSBwcmVzZXJ2ZSlcbi8vIGBTb21lIGNvbnRlbnRgLCBidXQgc3RyaXAgYGludmFsaWQtZWxlbWVudGAgb3BlbmluZy9jbG9zaW5nIHRhZ3MuIEZvciBzb21lIGVsZW1lbnRzLCB0aG91Z2gsIHdlXG4vLyBkb24ndCB3YW50IHRvIHByZXNlcnZlIHRoZSBjb250ZW50LCBpZiB0aGUgZWxlbWVudHMgdGhlbXNlbHZlcyBhcmUgZ29pbmcgdG8gYmUgcmVtb3ZlZC5cbmNvbnN0IFNLSVBfVFJBVkVSU0lOR19DT05URU5UX0lGX0lOVkFMSURfRUxFTUVOVFMgPSB0YWdTZXQoJ3NjcmlwdCxzdHlsZSx0ZW1wbGF0ZScpO1xuXG4vKipcbiAqIFNhbml0aXppbmdIdG1sU2VyaWFsaXplciBzZXJpYWxpemVzIGEgRE9NIGZyYWdtZW50LCBzdHJpcHBpbmcgb3V0IGFueSB1bnNhZmUgZWxlbWVudHMgYW5kIHVuc2FmZVxuICogYXR0cmlidXRlcy5cbiAqL1xuY2xhc3MgU2FuaXRpemluZ0h0bWxTZXJpYWxpemVyIHtcbiAgLy8gRXhwbGljaXRseSB0cmFjayBpZiBzb21ldGhpbmcgd2FzIHN0cmlwcGVkLCB0byBhdm9pZCBhY2NpZGVudGFsbHkgd2FybmluZyBvZiBzYW5pdGl6YXRpb24ganVzdFxuICAvLyBiZWNhdXNlIGNoYXJhY3RlcnMgd2VyZSByZS1lbmNvZGVkLlxuICBwdWJsaWMgc2FuaXRpemVkU29tZXRoaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgYnVmOiBzdHJpbmdbXSA9IFtdO1xuXG4gIHNhbml0aXplQ2hpbGRyZW4oZWw6IEVsZW1lbnQpOiBzdHJpbmcge1xuICAgIC8vIFRoaXMgY2Fubm90IHVzZSBhIFRyZWVXYWxrZXIsIGFzIGl0IGhhcyB0byBydW4gb24gQW5ndWxhcidzIHZhcmlvdXMgRE9NIGFkYXB0ZXJzLlxuICAgIC8vIEhvd2V2ZXIgdGhpcyBjb2RlIG5ldmVyIGFjY2Vzc2VzIHByb3BlcnRpZXMgb2ZmIG9mIGBkb2N1bWVudGAgYmVmb3JlIGRlbGV0aW5nIGl0cyBjb250ZW50c1xuICAgIC8vIGFnYWluLCBzbyBpdCBzaG91bGRuJ3QgYmUgdnVsbmVyYWJsZSB0byBET00gY2xvYmJlcmluZy5cbiAgICBsZXQgY3VycmVudDogTm9kZSA9IGVsLmZpcnN0Q2hpbGQhO1xuICAgIGxldCB0cmF2ZXJzZUNvbnRlbnQgPSB0cnVlO1xuICAgIHdoaWxlIChjdXJyZW50KSB7XG4gICAgICBpZiAoY3VycmVudC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgdHJhdmVyc2VDb250ZW50ID0gdGhpcy5zdGFydEVsZW1lbnQoY3VycmVudCBhcyBFbGVtZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgdGhpcy5jaGFycyhjdXJyZW50Lm5vZGVWYWx1ZSEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RyaXAgbm9uLWVsZW1lbnQsIG5vbi10ZXh0IG5vZGVzLlxuICAgICAgICB0aGlzLnNhbml0aXplZFNvbWV0aGluZyA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAodHJhdmVyc2VDb250ZW50ICYmIGN1cnJlbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICBjdXJyZW50ID0gY3VycmVudC5maXJzdENoaWxkITtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB3aGlsZSAoY3VycmVudCkge1xuICAgICAgICAvLyBMZWF2aW5nIHRoZSBlbGVtZW50LiBXYWxrIHVwIGFuZCB0byB0aGUgcmlnaHQsIGNsb3NpbmcgdGFncyBhcyB3ZSBnby5cbiAgICAgICAgaWYgKGN1cnJlbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgdGhpcy5lbmRFbGVtZW50KGN1cnJlbnQgYXMgRWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbmV4dCA9IHRoaXMuY2hlY2tDbG9iYmVyZWRFbGVtZW50KGN1cnJlbnQsIGN1cnJlbnQubmV4dFNpYmxpbmchKTtcblxuICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgIGN1cnJlbnQgPSBuZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudCA9IHRoaXMuY2hlY2tDbG9iYmVyZWRFbGVtZW50KGN1cnJlbnQsIGN1cnJlbnQucGFyZW50Tm9kZSEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWYuam9pbignJyk7XG4gIH1cblxuICAvKipcbiAgICogU2FuaXRpemVzIGFuIG9wZW5pbmcgZWxlbWVudCB0YWcgKGlmIHZhbGlkKSBhbmQgcmV0dXJucyB3aGV0aGVyIHRoZSBlbGVtZW50J3MgY29udGVudHMgc2hvdWxkXG4gICAqIGJlIHRyYXZlcnNlZC4gRWxlbWVudCBjb250ZW50IG11c3QgYWx3YXlzIGJlIHRyYXZlcnNlZCAoZXZlbiBpZiB0aGUgZWxlbWVudCBpdHNlbGYgaXMgbm90XG4gICAqIHZhbGlkL3NhZmUpLCB1bmxlc3MgdGhlIGVsZW1lbnQgaXMgb25lIG9mIGBTS0lQX1RSQVZFUlNJTkdfQ09OVEVOVF9JRl9JTlZBTElEX0VMRU1FTlRTYC5cbiAgICpcbiAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gc2FuaXRpemUuXG4gICAqIEByZXR1cm4gVHJ1ZSBpZiB0aGUgZWxlbWVudCdzIGNvbnRlbnRzIHNob3VsZCBiZSB0cmF2ZXJzZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXJ0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICB0aGlzLnNhbml0aXplZFNvbWV0aGluZyA9IHRydWU7XG4gICAgICByZXR1cm4gIVNLSVBfVFJBVkVSU0lOR19DT05URU5UX0lGX0lOVkFMSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSk7XG4gICAgfVxuICAgIHRoaXMuYnVmLnB1c2goJzwnKTtcbiAgICB0aGlzLmJ1Zi5wdXNoKHRhZ05hbWUpO1xuICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbEF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbEF0dHIgPSBlbEF0dHJzLml0ZW0oaSk7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGVsQXR0ciEubmFtZTtcbiAgICAgIGNvbnN0IGxvd2VyID0gYXR0ck5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmICghVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXIpKSB7XG4gICAgICAgIHRoaXMuc2FuaXRpemVkU29tZXRoaW5nID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsZXQgdmFsdWUgPSBlbEF0dHIhLnZhbHVlO1xuICAgICAgLy8gVE9ETyhtYXJ0aW5wcm9ic3QpOiBTcGVjaWFsIGNhc2UgaW1hZ2UgVVJJcyBmb3IgZGF0YTppbWFnZS8uLi5cbiAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJdKSB2YWx1ZSA9IF9zYW5pdGl6ZVVybCh2YWx1ZSk7XG4gICAgICBpZiAoU1JDU0VUX0FUVFJTW2xvd2VyXSkgdmFsdWUgPSBzYW5pdGl6ZVNyY3NldCh2YWx1ZSk7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKCcgJywgYXR0ck5hbWUsICc9XCInLCBlbmNvZGVFbnRpdGllcyh2YWx1ZSksICdcIicpO1xuICAgIH1cbiAgICB0aGlzLmJ1Zi5wdXNoKCc+Jyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIGVuZEVsZW1lbnQoY3VycmVudDogRWxlbWVudCkge1xuICAgIGNvbnN0IHRhZ05hbWUgPSBjdXJyZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKFZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpICYmICFWT0lEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKCc8LycpO1xuICAgICAgdGhpcy5idWYucHVzaCh0YWdOYW1lKTtcbiAgICAgIHRoaXMuYnVmLnB1c2goJz4nKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoYXJzKGNoYXJzOiBzdHJpbmcpIHtcbiAgICB0aGlzLmJ1Zi5wdXNoKGVuY29kZUVudGl0aWVzKGNoYXJzKSk7XG4gIH1cblxuICBjaGVja0Nsb2JiZXJlZEVsZW1lbnQobm9kZTogTm9kZSwgbmV4dE5vZGU6IE5vZGUpOiBOb2RlIHtcbiAgICBpZiAobmV4dE5vZGUgJiZcbiAgICAgICAgKG5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24obmV4dE5vZGUpICZcbiAgICAgICAgIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZKSA9PT3CoE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBzYW5pdGl6ZSBodG1sIGJlY2F1c2UgdGhlIGVsZW1lbnQgaXMgY2xvYmJlcmVkOiAke1xuICAgICAgICAgIChub2RlIGFzIEVsZW1lbnQpLm91dGVySFRNTH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIG5leHROb2RlO1xuICB9XG59XG5cbi8vIFJlZ3VsYXIgRXhwcmVzc2lvbnMgZm9yIHBhcnNpbmcgdGFncyBhbmQgYXR0cmlidXRlc1xuY29uc3QgU1VSUk9HQVRFX1BBSVJfUkVHRVhQID0gL1tcXHVEODAwLVxcdURCRkZdW1xcdURDMDAtXFx1REZGRl0vZztcbi8vICEgdG8gfiBpcyB0aGUgQVNDSUkgcmFuZ2UuXG5jb25zdCBOT05fQUxQSEFOVU1FUklDX1JFR0VYUCA9IC8oW15cXCMtfiB8IV0pL2c7XG5cbi8qKlxuICogRXNjYXBlcyBhbGwgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNoYXJhY3RlcnMsIHNvIHRoYXQgdGhlXG4gKiByZXN1bHRpbmcgc3RyaW5nIGNhbiBiZSBzYWZlbHkgaW5zZXJ0ZWQgaW50byBhdHRyaWJ1dGUgb3JcbiAqIGVsZW1lbnQgdGV4dC5cbiAqIEBwYXJhbSB2YWx1ZVxuICovXG5mdW5jdGlvbiBlbmNvZGVFbnRpdGllcyh2YWx1ZTogc3RyaW5nKSB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgICBTVVJST0dBVEVfUEFJUl9SRUdFWFAsXG4gICAgICAgICAgZnVuY3Rpb24obWF0Y2g6IHN0cmluZykge1xuICAgICAgICAgICAgY29uc3QgaGkgPSBtYXRjaC5jaGFyQ29kZUF0KDApO1xuICAgICAgICAgICAgY29uc3QgbG93ID0gbWF0Y2guY2hhckNvZGVBdCgxKTtcbiAgICAgICAgICAgIHJldHVybiAnJiMnICsgKCgoaGkgLSAweEQ4MDApICogMHg0MDApICsgKGxvdyAtIDB4REMwMCkgKyAweDEwMDAwKSArICc7JztcbiAgICAgICAgICB9KVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICAgTk9OX0FMUEhBTlVNRVJJQ19SRUdFWFAsXG4gICAgICAgICAgZnVuY3Rpb24obWF0Y2g6IHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuICcmIycgKyBtYXRjaC5jaGFyQ29kZUF0KDApICsgJzsnO1xuICAgICAgICAgIH0pXG4gICAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xufVxuXG5sZXQgaW5lcnRCb2R5SGVscGVyOiBJbmVydEJvZHlIZWxwZXI7XG5cbi8qKlxuICogU2FuaXRpemVzIHRoZSBnaXZlbiB1bnNhZmUsIHVudHJ1c3RlZCBIVE1MIGZyYWdtZW50LCBhbmQgcmV0dXJucyBIVE1MIHRleHQgdGhhdCBpcyBzYWZlIHRvIGFkZCB0b1xuICogdGhlIERPTSBpbiBhIGJyb3dzZXIgZW52aXJvbm1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfc2FuaXRpemVIdG1sKGRlZmF1bHREb2M6IGFueSwgdW5zYWZlSHRtbElucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgaW5lcnRCb2R5RWxlbWVudDogSFRNTEVsZW1lbnR8bnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgaW5lcnRCb2R5SGVscGVyID0gaW5lcnRCb2R5SGVscGVyIHx8IG5ldyBJbmVydEJvZHlIZWxwZXIoZGVmYXVsdERvYyk7XG4gICAgLy8gTWFrZSBzdXJlIHVuc2FmZUh0bWwgaXMgYWN0dWFsbHkgYSBzdHJpbmcgKFR5cGVTY3JpcHQgdHlwZXMgYXJlIG5vdCBlbmZvcmNlZCBhdCBydW50aW1lKS5cbiAgICBsZXQgdW5zYWZlSHRtbCA9IHVuc2FmZUh0bWxJbnB1dCA/IFN0cmluZyh1bnNhZmVIdG1sSW5wdXQpIDogJyc7XG4gICAgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUh0bWwpO1xuXG4gICAgLy8gbVhTUyBwcm90ZWN0aW9uLiBSZXBlYXRlZGx5IHBhcnNlIHRoZSBkb2N1bWVudCB0byBtYWtlIHN1cmUgaXQgc3RhYmlsaXplcywgc28gdGhhdCBhIGJyb3dzZXJcbiAgICAvLyB0cnlpbmcgdG8gYXV0by1jb3JyZWN0IGluY29ycmVjdCBIVE1MIGNhbm5vdCBjYXVzZSBmb3JtZXJseSBpbmVydCBIVE1MIHRvIGJlY29tZSBkYW5nZXJvdXMuXG4gICAgbGV0IG1YU1NBdHRlbXB0cyA9IDU7XG4gICAgbGV0IHBhcnNlZEh0bWwgPSB1bnNhZmVIdG1sO1xuXG4gICAgZG8ge1xuICAgICAgaWYgKG1YU1NBdHRlbXB0cyA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBzYW5pdGl6ZSBodG1sIGJlY2F1c2UgdGhlIGlucHV0IGlzIHVuc3RhYmxlJyk7XG4gICAgICB9XG4gICAgICBtWFNTQXR0ZW1wdHMtLTtcblxuICAgICAgdW5zYWZlSHRtbCA9IHBhcnNlZEh0bWw7XG4gICAgICBwYXJzZWRIdG1sID0gaW5lcnRCb2R5RWxlbWVudCEuaW5uZXJIVE1MO1xuICAgICAgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUh0bWwpO1xuICAgIH0gd2hpbGUgKHVuc2FmZUh0bWwgIT09IHBhcnNlZEh0bWwpO1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gbmV3IFNhbml0aXppbmdIdG1sU2VyaWFsaXplcigpO1xuICAgIGNvbnN0IHNhZmVIdG1sID0gc2FuaXRpemVyLnNhbml0aXplQ2hpbGRyZW4oXG4gICAgICAgIGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50ISkgYXMgRWxlbWVudCB8fCBpbmVydEJvZHlFbGVtZW50KTtcbiAgICBpZiAoaXNEZXZNb2RlKCkgJiYgc2FuaXRpemVyLnNhbml0aXplZFNvbWV0aGluZykge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICdXQVJOSU5HOiBzYW5pdGl6aW5nIEhUTUwgc3RyaXBwZWQgc29tZSBjb250ZW50LCBzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNhZmVIdG1sO1xuICB9IGZpbmFsbHkge1xuICAgIC8vIEluIGNhc2UgYW55dGhpbmcgZ29lcyB3cm9uZywgY2xlYXIgb3V0IGluZXJ0RWxlbWVudCB0byByZXNldCB0aGUgZW50aXJlIERPTSBzdHJ1Y3R1cmUuXG4gICAgaWYgKGluZXJ0Qm9keUVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50KSB8fCBpbmVydEJvZHlFbGVtZW50O1xuICAgICAgd2hpbGUgKHBhcmVudC5maXJzdENoaWxkKSB7XG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChwYXJlbnQuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZW1wbGF0ZUNvbnRlbnQoZWw6IE5vZGUpOiBOb2RlfG51bGwge1xuICByZXR1cm4gJ2NvbnRlbnQnIGluIChlbCBhcyBhbnkgLyoqIE1pY3Jvc29mdC9UeXBlU2NyaXB0IzIxNTE3ICovKSAmJiBpc1RlbXBsYXRlRWxlbWVudChlbCkgP1xuICAgICAgZWwuY29udGVudCA6XG4gICAgICBudWxsO1xufVxuZnVuY3Rpb24gaXNUZW1wbGF0ZUVsZW1lbnQoZWw6IE5vZGUpOiBlbCBpcyBIVE1MVGVtcGxhdGVFbGVtZW50IHtcbiAgcmV0dXJuIGVsLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSAmJiBlbC5ub2RlTmFtZSA9PT0gJ1RFTVBMQVRFJztcbn1cbiJdfQ==