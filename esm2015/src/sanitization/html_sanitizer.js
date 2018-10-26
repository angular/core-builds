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
import { isDevMode } from '../is_dev_mode';
import { InertBodyHelper } from './inert_body';
import { _sanitizeUrl, sanitizeSrcset } from './url_sanitizer';
/**
 * @param {?} tags
 * @return {?}
 */
function tagSet(tags) {
    /** @type {?} */
    const res = {};
    for (const t of tags.split(','))
        res[t] = true;
    return res;
}
/**
 * @param {...?} sets
 * @return {?}
 */
function merge(...sets) {
    /** @type {?} */
    const res = {};
    for (const s of sets) {
        for (const v in s) {
            if (s.hasOwnProperty(v))
                res[v] = true;
        }
    }
    return res;
}
/** @type {?} */
const VOID_ELEMENTS = tagSet('area,br,col,hr,img,wbr');
/** @type {?} */
const OPTIONAL_END_TAG_BLOCK_ELEMENTS = tagSet('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr');
/** @type {?} */
const OPTIONAL_END_TAG_INLINE_ELEMENTS = tagSet('rp,rt');
/** @type {?} */
const OPTIONAL_END_TAG_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, OPTIONAL_END_TAG_BLOCK_ELEMENTS);
/** @type {?} */
const BLOCK_ELEMENTS = merge(OPTIONAL_END_TAG_BLOCK_ELEMENTS, tagSet('address,article,' +
    'aside,blockquote,caption,center,del,details,dialog,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
    'h6,header,hgroup,hr,ins,main,map,menu,nav,ol,pre,section,summary,table,ul'));
/** @type {?} */
const INLINE_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, tagSet('a,abbr,acronym,audio,b,' +
    'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,picture,q,ruby,rp,rt,s,' +
    'samp,small,source,span,strike,strong,sub,sup,time,track,tt,u,var,video'));
/** @type {?} */
const VALID_ELEMENTS = merge(VOID_ELEMENTS, BLOCK_ELEMENTS, INLINE_ELEMENTS, OPTIONAL_END_TAG_ELEMENTS);
/** @type {?} */
const URI_ATTRS = tagSet('background,cite,href,itemtype,longdesc,poster,src,xlink:href');
/** @type {?} */
const SRCSET_ATTRS = tagSet('srcset');
/** @type {?} */
const HTML_ATTRS = tagSet('abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,' +
    'compact,controls,coords,datetime,default,dir,download,face,headers,height,hidden,hreflang,hspace,' +
    'ismap,itemscope,itemprop,kind,label,lang,language,loop,media,muted,nohref,nowrap,open,preload,rel,rev,role,rows,rowspan,rules,' +
    'scope,scrolling,shape,size,sizes,span,srclang,start,summary,tabindex,target,title,translate,type,usemap,' +
    'valign,value,vspace,width');
/** @type {?} */
const VALID_ATTRS = merge(URI_ATTRS, SRCSET_ATTRS, HTML_ATTRS);
/**
 * SanitizingHtmlSerializer serializes a DOM fragment, stripping out any unsafe elements and unsafe
 * attributes.
 */
class SanitizingHtmlSerializer {
    constructor() {
        this.sanitizedSomething = false;
        this.buf = [];
    }
    /**
     * @param {?} el
     * @return {?}
     */
    sanitizeChildren(el) {
        /** @type {?} */
        let current = /** @type {?} */ ((el.firstChild));
        /** @type {?} */
        let elementValid = true;
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                elementValid = this.startElement(/** @type {?} */ (current));
            }
            else if (current.nodeType === Node.TEXT_NODE) {
                this.chars(/** @type {?} */ ((current.nodeValue)));
            }
            else {
                // Strip non-element, non-text nodes.
                this.sanitizedSomething = true;
            }
            if (elementValid && current.firstChild) {
                current = /** @type {?} */ ((current.firstChild));
                continue;
            }
            while (current) {
                // Leaving the element. Walk up and to the right, closing tags as we go.
                if (current.nodeType === Node.ELEMENT_NODE) {
                    this.endElement(/** @type {?} */ (current));
                }
                /** @type {?} */
                let next = this.checkClobberedElement(current, /** @type {?} */ ((current.nextSibling)));
                if (next) {
                    current = next;
                    break;
                }
                current = this.checkClobberedElement(current, /** @type {?} */ ((current.parentNode)));
            }
        }
        return this.buf.join('');
    }
    /**
     * Outputs only valid Elements.
     *
     * Invalid elements are skipped.
     *
     * @param {?} element element to sanitize
     * Returns true if the element is valid.
     * @return {?}
     */
    startElement(element) {
        /** @type {?} */
        const tagName = element.nodeName.toLowerCase();
        if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
            this.sanitizedSomething = true;
            return false;
        }
        this.buf.push('<');
        this.buf.push(tagName);
        /** @type {?} */
        const elAttrs = element.attributes;
        for (let i = 0; i < elAttrs.length; i++) {
            /** @type {?} */
            const elAttr = elAttrs.item(i);
            /** @type {?} */
            const attrName = /** @type {?} */ ((elAttr)).name;
            /** @type {?} */
            const lower = attrName.toLowerCase();
            if (!VALID_ATTRS.hasOwnProperty(lower)) {
                this.sanitizedSomething = true;
                continue;
            }
            /** @type {?} */
            let value = /** @type {?} */ ((elAttr)).value;
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
    /**
     * @param {?} current
     * @return {?}
     */
    endElement(current) {
        /** @type {?} */
        const tagName = current.nodeName.toLowerCase();
        if (VALID_ELEMENTS.hasOwnProperty(tagName) && !VOID_ELEMENTS.hasOwnProperty(tagName)) {
            this.buf.push('</');
            this.buf.push(tagName);
            this.buf.push('>');
        }
    }
    /**
     * @param {?} chars
     * @return {?}
     */
    chars(chars) { this.buf.push(encodeEntities(chars)); }
    /**
     * @param {?} node
     * @param {?} nextNode
     * @return {?}
     */
    checkClobberedElement(node, nextNode) {
        if (nextNode &&
            (node.compareDocumentPosition(nextNode) &
                Node.DOCUMENT_POSITION_CONTAINED_BY) === Node.DOCUMENT_POSITION_CONTAINED_BY) {
            throw new Error(`Failed to sanitize html because the element is clobbered: ${((/** @type {?} */ (node))).outerHTML}`);
        }
        return nextNode;
    }
}
if (false) {
    /** @type {?} */
    SanitizingHtmlSerializer.prototype.sanitizedSomething;
    /** @type {?} */
    SanitizingHtmlSerializer.prototype.buf;
}
/** @type {?} */
const SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
/** @type {?} */
const NON_ALPHANUMERIC_REGEXP = /([^\#-~ |!])/g;
/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param {?} value
 * @return {?}
 */
function encodeEntities(value) {
    return value.replace(/&/g, '&amp;')
        .replace(SURROGATE_PAIR_REGEXP, function (match) {
        /** @type {?} */
        const hi = match.charCodeAt(0);
        /** @type {?} */
        const low = match.charCodeAt(1);
        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
    })
        .replace(NON_ALPHANUMERIC_REGEXP, function (match) { return '&#' + match.charCodeAt(0) + ';'; })
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
/** @type {?} */
let inertBodyHelper;
/**
 * Sanitizes the given unsafe, untrusted HTML fragment, and returns HTML text that is safe to add to
 * the DOM in a browser environment.
 * @param {?} defaultDoc
 * @param {?} unsafeHtmlInput
 * @return {?}
 */
export function _sanitizeHtml(defaultDoc, unsafeHtmlInput) {
    /** @type {?} */
    let inertBodyElement = null;
    try {
        inertBodyHelper = inertBodyHelper || new InertBodyHelper(defaultDoc);
        /** @type {?} */
        let unsafeHtml = unsafeHtmlInput ? String(unsafeHtmlInput) : '';
        inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
        /** @type {?} */
        let mXSSAttempts = 5;
        /** @type {?} */
        let parsedHtml = unsafeHtml;
        do {
            if (mXSSAttempts === 0) {
                throw new Error('Failed to sanitize html because the input is unstable');
            }
            mXSSAttempts--;
            unsafeHtml = parsedHtml;
            parsedHtml = /** @type {?} */ ((inertBodyElement)).innerHTML;
            inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
        } while (unsafeHtml !== parsedHtml);
        /** @type {?} */
        const sanitizer = new SanitizingHtmlSerializer();
        /** @type {?} */
        const safeHtml = sanitizer.sanitizeChildren(/** @type {?} */ (getTemplateContent(/** @type {?} */ ((inertBodyElement)))) || inertBodyElement);
        if (isDevMode() && sanitizer.sanitizedSomething) {
            console.warn('WARNING: sanitizing HTML stripped some content (see http://g.co/ng/security#xss).');
        }
        return safeHtml;
    }
    finally {
        // In case anything goes wrong, clear out inertElement to reset the entire DOM structure.
        if (inertBodyElement) {
            /** @type {?} */
            const parent = getTemplateContent(inertBodyElement) || inertBodyElement;
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild);
            }
        }
    }
}
/**
 * @param {?} el
 * @return {?}
 */
function getTemplateContent(el) {
    return 'content' in (/** @type {?} */ (el /** Microsoft/TypeScript#21517 */) /** Microsoft/TypeScript#21517 */) && isTemplateElement(el) ?
        el.content :
        null;
}
/**
 * @param {?} el
 * @return {?}
 */
function isTemplateElement(el) {
    return el.nodeType === Node.ELEMENT_NODE && el.nodeName === 'TEMPLATE';
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vaHRtbF9zYW5pdGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsWUFBWSxFQUFFLGNBQWMsRUFBQyxNQUFNLGlCQUFpQixDQUFDOzs7OztBQUU3RCxTQUFTLE1BQU0sQ0FBQyxJQUFZOztJQUMxQixNQUFNLEdBQUcsR0FBMkIsRUFBRSxDQUFDO0lBQ3ZDLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQy9DLE9BQU8sR0FBRyxDQUFDO0NBQ1o7Ozs7O0FBRUQsU0FBUyxLQUFLLENBQUMsR0FBRyxJQUE4Qjs7SUFDOUMsTUFBTSxHQUFHLEdBQTJCLEVBQUUsQ0FBQztJQUN2QyxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRTtRQUNwQixLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqQixJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDeEM7S0FDRjtJQUNELE9BQU8sR0FBRyxDQUFDO0NBQ1o7O0FBUUQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUM7O0FBSXZELE1BQU0sK0JBQStCLEdBQUcsTUFBTSxDQUFDLGdEQUFnRCxDQUFDLENBQUM7O0FBQ2pHLE1BQU0sZ0NBQWdDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFD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IFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aXNEZXZNb2RlfSBmcm9tICcuLi9pc19kZXZfbW9kZSc7XG5pbXBvcnQge0luZXJ0Qm9keUhlbHBlcn0gZnJvbSAnLi9pbmVydF9ib2R5JztcbmltcG9ydCB7X3Nhbml0aXplVXJsLCBzYW5pdGl6ZVNyY3NldH0gZnJvbSAnLi91cmxfc2FuaXRpemVyJztcblxuZnVuY3Rpb24gdGFnU2V0KHRhZ3M6IHN0cmluZyk6IHtbazogc3RyaW5nXTogYm9vbGVhbn0ge1xuICBjb25zdCByZXM6IHtbazogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgZm9yIChjb25zdCB0IG9mIHRhZ3Muc3BsaXQoJywnKSkgcmVzW3RdID0gdHJ1ZTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gbWVyZ2UoLi4uc2V0czoge1trOiBzdHJpbmddOiBib29sZWFufVtdKToge1trOiBzdHJpbmddOiBib29sZWFufSB7XG4gIGNvbnN0IHJlczoge1trOiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICBmb3IgKGNvbnN0IHMgb2Ygc2V0cykge1xuICAgIGZvciAoY29uc3QgdiBpbiBzKSB7XG4gICAgICBpZiAocy5oYXNPd25Qcm9wZXJ0eSh2KSkgcmVzW3ZdID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuLy8gR29vZCBzb3VyY2Ugb2YgaW5mbyBhYm91dCBlbGVtZW50cyBhbmQgYXR0cmlidXRlc1xuLy8gaHR0cDovL2Rldi53My5vcmcvaHRtbDUvc3BlYy9PdmVydmlldy5odG1sI3NlbWFudGljc1xuLy8gaHR0cDovL3NpbW9uLmh0bWw1Lm9yZy9odG1sLWVsZW1lbnRzXG5cbi8vIFNhZmUgVm9pZCBFbGVtZW50cyAtIEhUTUw1XG4vLyBodHRwOi8vZGV2LnczLm9yZy9odG1sNS9zcGVjL092ZXJ2aWV3Lmh0bWwjdm9pZC1lbGVtZW50c1xuY29uc3QgVk9JRF9FTEVNRU5UUyA9IHRhZ1NldCgnYXJlYSxicixjb2wsaHIsaW1nLHdicicpO1xuXG4vLyBFbGVtZW50cyB0aGF0IHlvdSBjYW4sIGludGVudGlvbmFsbHksIGxlYXZlIG9wZW4gKGFuZCB3aGljaCBjbG9zZSB0aGVtc2VsdmVzKVxuLy8gaHR0cDovL2Rldi53My5vcmcvaHRtbDUvc3BlYy9PdmVydmlldy5odG1sI29wdGlvbmFsLXRhZ3NcbmNvbnN0IE9QVElPTkFMX0VORF9UQUdfQkxPQ0tfRUxFTUVOVFMgPSB0YWdTZXQoJ2NvbGdyb3VwLGRkLGR0LGxpLHAsdGJvZHksdGQsdGZvb3QsdGgsdGhlYWQsdHInKTtcbmNvbnN0IE9QVElPTkFMX0VORF9UQUdfSU5MSU5FX0VMRU1FTlRTID0gdGFnU2V0KCdycCxydCcpO1xuY29uc3QgT1BUSU9OQUxfRU5EX1RBR19FTEVNRU5UUyA9XG4gICAgbWVyZ2UoT1BUSU9OQUxfRU5EX1RBR19JTkxJTkVfRUxFTUVOVFMsIE9QVElPTkFMX0VORF9UQUdfQkxPQ0tfRUxFTUVOVFMpO1xuXG4vLyBTYWZlIEJsb2NrIEVsZW1lbnRzIC0gSFRNTDVcbmNvbnN0IEJMT0NLX0VMRU1FTlRTID0gbWVyZ2UoXG4gICAgT1BUSU9OQUxfRU5EX1RBR19CTE9DS19FTEVNRU5UUyxcbiAgICB0YWdTZXQoXG4gICAgICAgICdhZGRyZXNzLGFydGljbGUsJyArXG4gICAgICAgICdhc2lkZSxibG9ja3F1b3RlLGNhcHRpb24sY2VudGVyLGRlbCxkZXRhaWxzLGRpYWxvZyxkaXIsZGl2LGRsLGZpZ3VyZSxmaWdjYXB0aW9uLGZvb3RlcixoMSxoMixoMyxoNCxoNSwnICtcbiAgICAgICAgJ2g2LGhlYWRlcixoZ3JvdXAsaHIsaW5zLG1haW4sbWFwLG1lbnUsbmF2LG9sLHByZSxzZWN0aW9uLHN1bW1hcnksdGFibGUsdWwnKSk7XG5cbi8vIElubGluZSBFbGVtZW50cyAtIEhUTUw1XG5jb25zdCBJTkxJTkVfRUxFTUVOVFMgPSBtZXJnZShcbiAgICBPUFRJT05BTF9FTkRfVEFHX0lOTElORV9FTEVNRU5UUyxcbiAgICB0YWdTZXQoXG4gICAgICAgICdhLGFiYnIsYWNyb255bSxhdWRpbyxiLCcgK1xuICAgICAgICAnYmRpLGJkbyxiaWcsYnIsY2l0ZSxjb2RlLGRlbCxkZm4sZW0sZm9udCxpLGltZyxpbnMsa2JkLGxhYmVsLG1hcCxtYXJrLHBpY3R1cmUscSxydWJ5LHJwLHJ0LHMsJyArXG4gICAgICAgICdzYW1wLHNtYWxsLHNvdXJjZSxzcGFuLHN0cmlrZSxzdHJvbmcsc3ViLHN1cCx0aW1lLHRyYWNrLHR0LHUsdmFyLHZpZGVvJykpO1xuXG5jb25zdCBWQUxJRF9FTEVNRU5UUyA9XG4gICAgbWVyZ2UoVk9JRF9FTEVNRU5UUywgQkxPQ0tfRUxFTUVOVFMsIElOTElORV9FTEVNRU5UUywgT1BUSU9OQUxfRU5EX1RBR19FTEVNRU5UUyk7XG5cbi8vIEF0dHJpYnV0ZXMgdGhhdCBoYXZlIGhyZWYgYW5kIGhlbmNlIG5lZWQgdG8gYmUgc2FuaXRpemVkXG5jb25zdCBVUklfQVRUUlMgPSB0YWdTZXQoJ2JhY2tncm91bmQsY2l0ZSxocmVmLGl0ZW10eXBlLGxvbmdkZXNjLHBvc3RlcixzcmMseGxpbms6aHJlZicpO1xuXG4vLyBBdHRyaWJ1dGVzIHRoYXQgaGF2ZSBzcGVjaWFsIGhyZWYgc2V0IGhlbmNlIG5lZWQgdG8gYmUgc2FuaXRpemVkXG5jb25zdCBTUkNTRVRfQVRUUlMgPSB0YWdTZXQoJ3NyY3NldCcpO1xuXG5jb25zdCBIVE1MX0FUVFJTID0gdGFnU2V0KFxuICAgICdhYmJyLGFjY2Vzc2tleSxhbGlnbixhbHQsYXV0b3BsYXksYXhpcyxiZ2NvbG9yLGJvcmRlcixjZWxscGFkZGluZyxjZWxsc3BhY2luZyxjbGFzcyxjbGVhcixjb2xvcixjb2xzLGNvbHNwYW4sJyArXG4gICAgJ2NvbXBhY3QsY29udHJvbHMsY29vcmRzLGRhdGV0aW1lLGRlZmF1bHQsZGlyLGRvd25sb2FkLGZhY2UsaGVhZGVycyxoZWlnaHQsaGlkZGVuLGhyZWZsYW5nLGhzcGFjZSwnICtcbiAgICAnaXNtYXAsaXRlbXNjb3BlLGl0ZW1wcm9wLGtpbmQsbGFiZWwsbGFuZyxsYW5ndWFnZSxsb29wLG1lZGlhLG11dGVkLG5vaHJlZixub3dyYXAsb3BlbixwcmVsb2FkLHJlbCxyZXYscm9sZSxyb3dzLHJvd3NwYW4scnVsZXMsJyArXG4gICAgJ3Njb3BlLHNjcm9sbGluZyxzaGFwZSxzaXplLHNpemVzLHNwYW4sc3JjbGFuZyxzdGFydCxzdW1tYXJ5LHRhYmluZGV4LHRhcmdldCx0aXRsZSx0cmFuc2xhdGUsdHlwZSx1c2VtYXAsJyArXG4gICAgJ3ZhbGlnbix2YWx1ZSx2c3BhY2Usd2lkdGgnKTtcblxuLy8gTkI6IFRoaXMgY3VycmVudGx5IGNvbnNjaW91c2x5IGRvZXNuJ3Qgc3VwcG9ydCBTVkcuIFNWRyBzYW5pdGl6YXRpb24gaGFzIGhhZCBzZXZlcmFsIHNlY3VyaXR5XG4vLyBpc3N1ZXMgaW4gdGhlIHBhc3QsIHNvIGl0IHNlZW1zIHNhZmVyIHRvIGxlYXZlIGl0IG91dCBpZiBwb3NzaWJsZS4gSWYgc3VwcG9ydCBmb3IgYmluZGluZyBTVkcgdmlhXG4vLyBpbm5lckhUTUwgaXMgcmVxdWlyZWQsIFNWRyBhdHRyaWJ1dGVzIHNob3VsZCBiZSBhZGRlZCBoZXJlLlxuXG4vLyBOQjogU2FuaXRpemF0aW9uIGRvZXMgbm90IGFsbG93IDxmb3JtPiBlbGVtZW50cyBvciBvdGhlciBhY3RpdmUgZWxlbWVudHMgKDxidXR0b24+IGV0YykuIFRob3NlXG4vLyBjYW4gYmUgc2FuaXRpemVkLCBidXQgdGhleSBpbmNyZWFzZSBzZWN1cml0eSBzdXJmYWNlIGFyZWEgd2l0aG91dCBhIGxlZ2l0aW1hdGUgdXNlIGNhc2UsIHNvIHRoZXlcbi8vIGFyZSBsZWZ0IG91dCBoZXJlLlxuXG5jb25zdCBWQUxJRF9BVFRSUyA9IG1lcmdlKFVSSV9BVFRSUywgU1JDU0VUX0FUVFJTLCBIVE1MX0FUVFJTKTtcblxuLyoqXG4gKiBTYW5pdGl6aW5nSHRtbFNlcmlhbGl6ZXIgc2VyaWFsaXplcyBhIERPTSBmcmFnbWVudCwgc3RyaXBwaW5nIG91dCBhbnkgdW5zYWZlIGVsZW1lbnRzIGFuZCB1bnNhZmVcbiAqIGF0dHJpYnV0ZXMuXG4gKi9cbmNsYXNzIFNhbml0aXppbmdIdG1sU2VyaWFsaXplciB7XG4gIC8vIEV4cGxpY2l0bHkgdHJhY2sgaWYgc29tZXRoaW5nIHdhcyBzdHJpcHBlZCwgdG8gYXZvaWQgYWNjaWRlbnRhbGx5IHdhcm5pbmcgb2Ygc2FuaXRpemF0aW9uIGp1c3RcbiAgLy8gYmVjYXVzZSBjaGFyYWN0ZXJzIHdlcmUgcmUtZW5jb2RlZC5cbiAgcHVibGljIHNhbml0aXplZFNvbWV0aGluZyA9IGZhbHNlO1xuICBwcml2YXRlIGJ1Zjogc3RyaW5nW10gPSBbXTtcblxuICBzYW5pdGl6ZUNoaWxkcmVuKGVsOiBFbGVtZW50KTogc3RyaW5nIHtcbiAgICAvLyBUaGlzIGNhbm5vdCB1c2UgYSBUcmVlV2Fsa2VyLCBhcyBpdCBoYXMgdG8gcnVuIG9uIEFuZ3VsYXIncyB2YXJpb3VzIERPTSBhZGFwdGVycy5cbiAgICAvLyBIb3dldmVyIHRoaXMgY29kZSBuZXZlciBhY2Nlc3NlcyBwcm9wZXJ0aWVzIG9mZiBvZiBgZG9jdW1lbnRgIGJlZm9yZSBkZWxldGluZyBpdHMgY29udGVudHNcbiAgICAvLyBhZ2Fpbiwgc28gaXQgc2hvdWxkbid0IGJlIHZ1bG5lcmFibGUgdG8gRE9NIGNsb2JiZXJpbmcuXG4gICAgbGV0IGN1cnJlbnQ6IE5vZGUgPSBlbC5maXJzdENoaWxkICE7XG4gICAgbGV0IGVsZW1lbnRWYWxpZCA9IHRydWU7XG4gICAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICAgIGlmIChjdXJyZW50Lm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBlbGVtZW50VmFsaWQgPSB0aGlzLnN0YXJ0RWxlbWVudChjdXJyZW50IGFzIEVsZW1lbnQpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50Lm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICB0aGlzLmNoYXJzKGN1cnJlbnQubm9kZVZhbHVlICEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RyaXAgbm9uLWVsZW1lbnQsIG5vbi10ZXh0IG5vZGVzLlxuICAgICAgICB0aGlzLnNhbml0aXplZFNvbWV0aGluZyA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoZWxlbWVudFZhbGlkICYmIGN1cnJlbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICBjdXJyZW50ID0gY3VycmVudC5maXJzdENoaWxkICE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICAgICAgLy8gTGVhdmluZyB0aGUgZWxlbWVudC4gV2FsayB1cCBhbmQgdG8gdGhlIHJpZ2h0LCBjbG9zaW5nIHRhZ3MgYXMgd2UgZ28uXG4gICAgICAgIGlmIChjdXJyZW50Lm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgIHRoaXMuZW5kRWxlbWVudChjdXJyZW50IGFzIEVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5leHQgPSB0aGlzLmNoZWNrQ2xvYmJlcmVkRWxlbWVudChjdXJyZW50LCBjdXJyZW50Lm5leHRTaWJsaW5nICEpO1xuXG4gICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgY3VycmVudCA9IG5leHQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50ID0gdGhpcy5jaGVja0Nsb2JiZXJlZEVsZW1lbnQoY3VycmVudCwgY3VycmVudC5wYXJlbnROb2RlICEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWYuam9pbignJyk7XG4gIH1cblxuICAvKipcbiAgICogT3V0cHV0cyBvbmx5IHZhbGlkIEVsZW1lbnRzLlxuICAgKlxuICAgKiBJbnZhbGlkIGVsZW1lbnRzIGFyZSBza2lwcGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIHNhbml0aXplXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBpcyB2YWxpZC5cbiAgICovXG4gIHByaXZhdGUgc3RhcnRFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghVkFMSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSkpIHtcbiAgICAgIHRoaXMuc2FuaXRpemVkU29tZXRoaW5nID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5idWYucHVzaCgnPCcpO1xuICAgIHRoaXMuYnVmLnB1c2godGFnTmFtZSk7XG4gICAgY29uc3QgZWxBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsQXR0ciA9IGVsQXR0cnMuaXRlbShpKTtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gZWxBdHRyICEubmFtZTtcbiAgICAgIGNvbnN0IGxvd2VyID0gYXR0ck5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmICghVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXIpKSB7XG4gICAgICAgIHRoaXMuc2FuaXRpemVkU29tZXRoaW5nID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsZXQgdmFsdWUgPSBlbEF0dHIgIS52YWx1ZTtcbiAgICAgIC8vIFRPRE8obWFydGlucHJvYnN0KTogU3BlY2lhbCBjYXNlIGltYWdlIFVSSXMgZm9yIGRhdGE6aW1hZ2UvLi4uXG4gICAgICBpZiAoVVJJX0FUVFJTW2xvd2VyXSkgdmFsdWUgPSBfc2FuaXRpemVVcmwodmFsdWUpO1xuICAgICAgaWYgKFNSQ1NFVF9BVFRSU1tsb3dlcl0pIHZhbHVlID0gc2FuaXRpemVTcmNzZXQodmFsdWUpO1xuICAgICAgdGhpcy5idWYucHVzaCgnICcsIGF0dHJOYW1lLCAnPVwiJywgZW5jb2RlRW50aXRpZXModmFsdWUpLCAnXCInKTtcbiAgICB9XG4gICAgdGhpcy5idWYucHVzaCgnPicpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBlbmRFbGVtZW50KGN1cnJlbnQ6IEVsZW1lbnQpIHtcbiAgICBjb25zdCB0YWdOYW1lID0gY3VycmVudC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChWQUxJRF9FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSAmJiAhVk9JRF9FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSkge1xuICAgICAgdGhpcy5idWYucHVzaCgnPC8nKTtcbiAgICAgIHRoaXMuYnVmLnB1c2godGFnTmFtZSk7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKCc+Jyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjaGFycyhjaGFyczogc3RyaW5nKSB7IHRoaXMuYnVmLnB1c2goZW5jb2RlRW50aXRpZXMoY2hhcnMpKTsgfVxuXG4gIGNoZWNrQ2xvYmJlcmVkRWxlbWVudChub2RlOiBOb2RlLCBuZXh0Tm9kZTogTm9kZSk6IE5vZGUge1xuICAgIGlmIChuZXh0Tm9kZSAmJlxuICAgICAgICAobm9kZS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihuZXh0Tm9kZSkgJlxuICAgICAgICAgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9DT05UQUlORURfQlkpID09PcKgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9DT05UQUlORURfQlkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgRmFpbGVkIHRvIHNhbml0aXplIGh0bWwgYmVjYXVzZSB0aGUgZWxlbWVudCBpcyBjbG9iYmVyZWQ6ICR7KG5vZGUgYXMgRWxlbWVudCkub3V0ZXJIVE1MfWApO1xuICAgIH1cbiAgICByZXR1cm4gbmV4dE5vZGU7XG4gIH1cbn1cblxuLy8gUmVndWxhciBFeHByZXNzaW9ucyBmb3IgcGFyc2luZyB0YWdzIGFuZCBhdHRyaWJ1dGVzXG5jb25zdCBTVVJST0dBVEVfUEFJUl9SRUdFWFAgPSAvW1xcdUQ4MDAtXFx1REJGRl1bXFx1REMwMC1cXHVERkZGXS9nO1xuLy8gISB0byB+IGlzIHRoZSBBU0NJSSByYW5nZS5cbmNvbnN0IE5PTl9BTFBIQU5VTUVSSUNfUkVHRVhQID0gLyhbXlxcIy1+IHwhXSkvZztcblxuLyoqXG4gKiBFc2NhcGVzIGFsbCBwb3RlbnRpYWxseSBkYW5nZXJvdXMgY2hhcmFjdGVycywgc28gdGhhdCB0aGVcbiAqIHJlc3VsdGluZyBzdHJpbmcgY2FuIGJlIHNhZmVseSBpbnNlcnRlZCBpbnRvIGF0dHJpYnV0ZSBvclxuICogZWxlbWVudCB0ZXh0LlxuICogQHBhcmFtIHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGVuY29kZUVudGl0aWVzKHZhbHVlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAgIFNVUlJPR0FURV9QQUlSX1JFR0VYUCxcbiAgICAgICAgICBmdW5jdGlvbihtYXRjaDogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBoaSA9IG1hdGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgICAgICAgICBjb25zdCBsb3cgPSBtYXRjaC5jaGFyQ29kZUF0KDEpO1xuICAgICAgICAgICAgcmV0dXJuICcmIycgKyAoKChoaSAtIDB4RDgwMCkgKiAweDQwMCkgKyAobG93IC0gMHhEQzAwKSArIDB4MTAwMDApICsgJzsnO1xuICAgICAgICAgIH0pXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgICBOT05fQUxQSEFOVU1FUklDX1JFR0VYUCxcbiAgICAgICAgICBmdW5jdGlvbihtYXRjaDogc3RyaW5nKSB7IHJldHVybiAnJiMnICsgbWF0Y2guY2hhckNvZGVBdCgwKSArICc7JzsgfSlcbiAgICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG59XG5cbmxldCBpbmVydEJvZHlIZWxwZXI6IEluZXJ0Qm9keUhlbHBlcjtcblxuLyoqXG4gKiBTYW5pdGl6ZXMgdGhlIGdpdmVuIHVuc2FmZSwgdW50cnVzdGVkIEhUTUwgZnJhZ21lbnQsIGFuZCByZXR1cm5zIEhUTUwgdGV4dCB0aGF0IGlzIHNhZmUgdG8gYWRkIHRvXG4gKiB0aGUgRE9NIGluIGEgYnJvd3NlciBlbnZpcm9ubWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9zYW5pdGl6ZUh0bWwoZGVmYXVsdERvYzogYW55LCB1bnNhZmVIdG1sSW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBpbmVydEJvZHlFbGVtZW50OiBIVE1MRWxlbWVudHxudWxsID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBpbmVydEJvZHlIZWxwZXIgPSBpbmVydEJvZHlIZWxwZXIgfHwgbmV3IEluZXJ0Qm9keUhlbHBlcihkZWZhdWx0RG9jKTtcbiAgICAvLyBNYWtlIHN1cmUgdW5zYWZlSHRtbCBpcyBhY3R1YWxseSBhIHN0cmluZyAoVHlwZVNjcmlwdCB0eXBlcyBhcmUgbm90IGVuZm9yY2VkIGF0IHJ1bnRpbWUpLlxuICAgIGxldCB1bnNhZmVIdG1sID0gdW5zYWZlSHRtbElucHV0ID8gU3RyaW5nKHVuc2FmZUh0bWxJbnB1dCkgOiAnJztcbiAgICBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG5cbiAgICAvLyBtWFNTIHByb3RlY3Rpb24uIFJlcGVhdGVkbHkgcGFyc2UgdGhlIGRvY3VtZW50IHRvIG1ha2Ugc3VyZSBpdCBzdGFiaWxpemVzLCBzbyB0aGF0IGEgYnJvd3NlclxuICAgIC8vIHRyeWluZyB0byBhdXRvLWNvcnJlY3QgaW5jb3JyZWN0IEhUTUwgY2Fubm90IGNhdXNlIGZvcm1lcmx5IGluZXJ0IEhUTUwgdG8gYmVjb21lIGRhbmdlcm91cy5cbiAgICBsZXQgbVhTU0F0dGVtcHRzID0gNTtcbiAgICBsZXQgcGFyc2VkSHRtbCA9IHVuc2FmZUh0bWw7XG5cbiAgICBkbyB7XG4gICAgICBpZiAobVhTU0F0dGVtcHRzID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIHNhbml0aXplIGh0bWwgYmVjYXVzZSB0aGUgaW5wdXQgaXMgdW5zdGFibGUnKTtcbiAgICAgIH1cbiAgICAgIG1YU1NBdHRlbXB0cy0tO1xuXG4gICAgICB1bnNhZmVIdG1sID0gcGFyc2VkSHRtbDtcbiAgICAgIHBhcnNlZEh0bWwgPSBpbmVydEJvZHlFbGVtZW50ICEuaW5uZXJIVE1MO1xuICAgICAgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUh0bWwpO1xuICAgIH0gd2hpbGUgKHVuc2FmZUh0bWwgIT09IHBhcnNlZEh0bWwpO1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gbmV3IFNhbml0aXppbmdIdG1sU2VyaWFsaXplcigpO1xuICAgIGNvbnN0IHNhZmVIdG1sID0gc2FuaXRpemVyLnNhbml0aXplQ2hpbGRyZW4oXG4gICAgICAgIGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50ICEpIGFzIEVsZW1lbnQgfHwgaW5lcnRCb2R5RWxlbWVudCk7XG4gICAgaWYgKGlzRGV2TW9kZSgpICYmIHNhbml0aXplci5zYW5pdGl6ZWRTb21ldGhpbmcpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAnV0FSTklORzogc2FuaXRpemluZyBIVE1MIHN0cmlwcGVkIHNvbWUgY29udGVudCAoc2VlIGh0dHA6Ly9nLmNvL25nL3NlY3VyaXR5I3hzcykuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNhZmVIdG1sO1xuICB9IGZpbmFsbHkge1xuICAgIC8vIEluIGNhc2UgYW55dGhpbmcgZ29lcyB3cm9uZywgY2xlYXIgb3V0IGluZXJ0RWxlbWVudCB0byByZXNldCB0aGUgZW50aXJlIERPTSBzdHJ1Y3R1cmUuXG4gICAgaWYgKGluZXJ0Qm9keUVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50KSB8fCBpbmVydEJvZHlFbGVtZW50O1xuICAgICAgd2hpbGUgKHBhcmVudC5maXJzdENoaWxkKSB7XG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChwYXJlbnQuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFRlbXBsYXRlQ29udGVudChlbDogTm9kZSk6IE5vZGV8bnVsbCB7XG4gIHJldHVybiAnY29udGVudCcgaW4gKGVsIGFzIGFueSAvKiogTWljcm9zb2Z0L1R5cGVTY3JpcHQjMjE1MTcgKi8pICYmIGlzVGVtcGxhdGVFbGVtZW50KGVsKSA/XG4gICAgICBlbC5jb250ZW50IDpcbiAgICAgIG51bGw7XG59XG5mdW5jdGlvbiBpc1RlbXBsYXRlRWxlbWVudChlbDogTm9kZSk6IGVsIGlzIEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xuICByZXR1cm4gZWwubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFICYmIGVsLm5vZGVOYW1lID09PSAnVEVNUExBVEUnO1xufVxuIl19