/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../application_ref';
import { InertBodyHelper } from './inert_body';
import { _sanitizeUrl, sanitizeSrcset } from './url_sanitizer';
/**
 * @param {?} tags
 * @return {?}
 */
function tagSet(tags) {
    const /** @type {?} */ res = {};
    for (const /** @type {?} */ t of tags.split(','))
        res[t] = true;
    return res;
}
/**
 * @param {...?} sets
 * @return {?}
 */
function merge(...sets) {
    const /** @type {?} */ res = {};
    for (const /** @type {?} */ s of sets) {
        for (const /** @type {?} */ v in s) {
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
const /** @type {?} */ VOID_ELEMENTS = tagSet('area,br,col,hr,img,wbr');
// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
const /** @type {?} */ OPTIONAL_END_TAG_BLOCK_ELEMENTS = tagSet('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr');
const /** @type {?} */ OPTIONAL_END_TAG_INLINE_ELEMENTS = tagSet('rp,rt');
const /** @type {?} */ OPTIONAL_END_TAG_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, OPTIONAL_END_TAG_BLOCK_ELEMENTS);
// Safe Block Elements - HTML5
const /** @type {?} */ BLOCK_ELEMENTS = merge(OPTIONAL_END_TAG_BLOCK_ELEMENTS, tagSet('address,article,' +
    'aside,blockquote,caption,center,del,details,dialog,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
    'h6,header,hgroup,hr,ins,main,map,menu,nav,ol,pre,section,summary,table,ul'));
// Inline Elements - HTML5
const /** @type {?} */ INLINE_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, tagSet('a,abbr,acronym,audio,b,' +
    'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,picture,q,ruby,rp,rt,s,' +
    'samp,small,source,span,strike,strong,sub,sup,time,track,tt,u,var,video'));
const /** @type {?} */ VALID_ELEMENTS = merge(VOID_ELEMENTS, BLOCK_ELEMENTS, INLINE_ELEMENTS, OPTIONAL_END_TAG_ELEMENTS);
// Attributes that have href and hence need to be sanitized
const /** @type {?} */ URI_ATTRS = tagSet('background,cite,href,itemtype,longdesc,poster,src,xlink:href');
// Attributes that have special href set hence need to be sanitized
const /** @type {?} */ SRCSET_ATTRS = tagSet('srcset');
const /** @type {?} */ HTML_ATTRS = tagSet('abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,' +
    'compact,controls,coords,datetime,default,dir,download,face,headers,height,hidden,hreflang,hspace,' +
    'ismap,itemscope,itemprop,kind,label,lang,language,loop,media,muted,nohref,nowrap,open,preload,rel,rev,role,rows,rowspan,rules,' +
    'scope,scrolling,shape,size,sizes,span,srclang,start,summary,tabindex,target,title,translate,type,usemap,' +
    'valign,value,vspace,width');
// NB: This currently consciously doesn't support SVG. SVG sanitization has had several security
// issues in the past, so it seems safer to leave it out if possible. If support for binding SVG via
// innerHTML is required, SVG attributes should be added here.
// NB: Sanitization does not allow <form> elements or other active elements (<button> etc). Those
// can be sanitized, but they increase security surface area without a legitimate use case, so they
// are left out here.
const /** @type {?} */ VALID_ATTRS = merge(URI_ATTRS, SRCSET_ATTRS, HTML_ATTRS);
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
        // This cannot use a TreeWalker, as it has to run on Angular's various DOM adapters.
        // However this code never accesses properties off of `document` before deleting its contents
        // again, so it shouldn't be vulnerable to DOM clobbering.
        let /** @type {?} */ current = /** @type {?} */ ((el.firstChild));
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                this.startElement(/** @type {?} */ (current));
            }
            else if (current.nodeType === Node.TEXT_NODE) {
                this.chars(/** @type {?} */ ((current.nodeValue)));
            }
            else {
                // Strip non-element, non-text nodes.
                this.sanitizedSomething = true;
            }
            if (current.firstChild) {
                current = /** @type {?} */ ((current.firstChild));
                continue;
            }
            while (current) {
                // Leaving the element. Walk up and to the right, closing tags as we go.
                if (current.nodeType === Node.ELEMENT_NODE) {
                    this.endElement(/** @type {?} */ (current));
                }
                let /** @type {?} */ next = this.checkClobberedElement(current, /** @type {?} */ ((current.nextSibling)));
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
     * @param {?} element
     * @return {?}
     */
    startElement(element) {
        const /** @type {?} */ tagName = element.nodeName.toLowerCase();
        if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
            this.sanitizedSomething = true;
            return;
        }
        this.buf.push('<');
        this.buf.push(tagName);
        const /** @type {?} */ elAttrs = element.attributes;
        for (let /** @type {?} */ i = 0; i < elAttrs.length; i++) {
            const /** @type {?} */ elAttr = elAttrs.item(i);
            const /** @type {?} */ attrName = /** @type {?} */ ((elAttr)).name;
            const /** @type {?} */ lower = attrName.toLowerCase();
            if (!VALID_ATTRS.hasOwnProperty(lower)) {
                this.sanitizedSomething = true;
                continue;
            }
            let /** @type {?} */ value = /** @type {?} */ ((elAttr)).value;
            // TODO(martinprobst): Special case image URIs for data:image/...
            if (URI_ATTRS[lower])
                value = _sanitizeUrl(value);
            if (SRCSET_ATTRS[lower])
                value = sanitizeSrcset(value);
            this.buf.push(' ', attrName, '="', encodeEntities(value), '"');
        }
        this.buf.push('>');
    }
    /**
     * @param {?} current
     * @return {?}
     */
    endElement(current) {
        const /** @type {?} */ tagName = current.nodeName.toLowerCase();
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
function SanitizingHtmlSerializer_tsickle_Closure_declarations() {
    /** @type {?} */
    SanitizingHtmlSerializer.prototype.sanitizedSomething;
    /** @type {?} */
    SanitizingHtmlSerializer.prototype.buf;
}
// Regular Expressions for parsing tags and attributes
const /** @type {?} */ SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
// ! to ~ is the ASCII range.
const /** @type {?} */ NON_ALPHANUMERIC_REGEXP = /([^\#-~ |!])/g;
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
        const /** @type {?} */ hi = match.charCodeAt(0);
        const /** @type {?} */ low = match.charCodeAt(1);
        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
    })
        .replace(NON_ALPHANUMERIC_REGEXP, function (match) { return '&#' + match.charCodeAt(0) + ';'; })
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
let /** @type {?} */ inertBodyHelper;
/**
 * Sanitizes the given unsafe, untrusted HTML fragment, and returns HTML text that is safe to add to
 * the DOM in a browser environment.
 * @param {?} defaultDoc
 * @param {?} unsafeHtmlInput
 * @return {?}
 */
export function _sanitizeHtml(defaultDoc, unsafeHtmlInput) {
    let /** @type {?} */ inertBodyElement = null;
    try {
        inertBodyHelper = inertBodyHelper || new InertBodyHelper(defaultDoc);
        // Make sure unsafeHtml is actually a string (TypeScript types are not enforced at runtime).
        let /** @type {?} */ unsafeHtml = unsafeHtmlInput ? String(unsafeHtmlInput) : '';
        inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
        // mXSS protection. Repeatedly parse the document to make sure it stabilizes, so that a browser
        // trying to auto-correct incorrect HTML cannot cause formerly inert HTML to become dangerous.
        let /** @type {?} */ mXSSAttempts = 5;
        let /** @type {?} */ parsedHtml = unsafeHtml;
        do {
            if (mXSSAttempts === 0) {
                throw new Error('Failed to sanitize html because the input is unstable');
            }
            mXSSAttempts--;
            unsafeHtml = parsedHtml;
            parsedHtml = /** @type {?} */ ((inertBodyElement)).innerHTML;
            inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
        } while (unsafeHtml !== parsedHtml);
        const /** @type {?} */ sanitizer = new SanitizingHtmlSerializer();
        const /** @type {?} */ safeHtml = sanitizer.sanitizeChildren(/** @type {?} */ (getTemplateContent(/** @type {?} */ ((inertBodyElement)))) || inertBodyElement);
        if (isDevMode() && sanitizer.sanitizedSomething) {
            console.warn('WARNING: sanitizing HTML stripped some content (see http://g.co/ng/security#xss).');
        }
        return safeHtml;
    }
    finally {
        // In case anything goes wrong, clear out inertElement to reset the entire DOM structure.
        if (inertBodyElement) {
            const /** @type {?} */ parent = getTemplateContent(inertBodyElement) || inertBodyElement;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vaHRtbF9zYW5pdGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDN0MsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsWUFBWSxFQUFFLGNBQWMsRUFBQyxNQUFNLGlCQUFpQixDQUFDOzs7OztBQUU3RCxnQkFBZ0IsSUFBWTtJQUMxQix1QkFBTSxHQUFHLEdBQTJCLEVBQUUsQ0FBQztJQUN2QyxLQUFLLHVCQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDL0MsT0FBTyxHQUFHLENBQUM7Q0FDWjs7Ozs7QUFFRCxlQUFlLEdBQUcsSUFBOEI7SUFDOUMsdUJBQU0sR0FBRyxHQUEyQixFQUFFLENBQUM7SUFDdkMsS0FBSyx1QkFBTSxDQUFDLElBQUksSUFBSSxFQUFFO1FBQ3BCLEtBQUssdUJBQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqQixJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDeEM7S0FDRjtJQUNELE9BQU8sR0FBRyxDQUFDO0NBQ1o7Ozs7OztBQVFELHVCQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQzs7O0FBSXZELHVCQUFNLCtCQUErQixHQUFHLE1BQU0sQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO0FBQ2pHLHVCQUFNLGdDQUFnQyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN6RCx1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QkFBTSxTQUFTLEdBQUcsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO1FBQ2pELHVCQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsZ0JBQWdCLG1CQUN2QyxrQkFBa0Isb0JBQUMsZ0JBQWdCLEdBQWMsS0FBSSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzNFLElBQUksU0FBUyxFQUFFLElBQUksU0FBUyxDQUFDLGtCQUFrQixFQUFFO1lBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQ1IsbUZBQW1GLENBQUMsQ0FBQztTQUMxRjtRQUVELE9BQU8sUUFBUSxDQUFDO0tBQ2pCO1lBQVM7O1FBRVIsSUFBSSxnQkFBZ0IsRUFBRTtZQUNwQix1QkFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQztZQUN4RSxPQUFPLE1BQU0sQ0FBQyxVQUFVLEVBQUU7Z0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3ZDO1NBQ0Y7S0FDRjtDQUNGOzs7OztBQUVELDRCQUE0QixFQUFRO0lBQ2xDLE9BQU8sU0FBUyxJQUFJLG1CQUFDLEVBQVMsQ0FBQyxpQ0FBaUMsb0NBQUMsSUFBSSxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hGLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQztDQUNWOzs7OztBQUNELDJCQUEyQixFQUFRO0lBQ2pDLE9BQU8sRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDO0NBQ3hFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2lzRGV2TW9kZX0gZnJvbSAnLi4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuL2luZXJ0X2JvZHknO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwsIHNhbml0aXplU3Jjc2V0fSBmcm9tICcuL3VybF9zYW5pdGl6ZXInO1xuXG5mdW5jdGlvbiB0YWdTZXQodGFnczogc3RyaW5nKToge1trOiBzdHJpbmddOiBib29sZWFufSB7XG4gIGNvbnN0IHJlczoge1trOiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICBmb3IgKGNvbnN0IHQgb2YgdGFncy5zcGxpdCgnLCcpKSByZXNbdF0gPSB0cnVlO1xuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBtZXJnZSguLi5zZXRzOiB7W2s6IHN0cmluZ106IGJvb2xlYW59W10pOiB7W2s6IHN0cmluZ106IGJvb2xlYW59IHtcbiAgY29uc3QgcmVzOiB7W2s6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIGZvciAoY29uc3QgcyBvZiBzZXRzKSB7XG4gICAgZm9yIChjb25zdCB2IGluIHMpIHtcbiAgICAgIGlmIChzLmhhc093blByb3BlcnR5KHYpKSByZXNbdl0gPSB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG4vLyBHb29kIHNvdXJjZSBvZiBpbmZvIGFib3V0IGVsZW1lbnRzIGFuZCBhdHRyaWJ1dGVzXG4vLyBodHRwOi8vZGV2LnczLm9yZy9odG1sNS9zcGVjL092ZXJ2aWV3Lmh0bWwjc2VtYW50aWNzXG4vLyBodHRwOi8vc2ltb24uaHRtbDUub3JnL2h0bWwtZWxlbWVudHNcblxuLy8gU2FmZSBWb2lkIEVsZW1lbnRzIC0gSFRNTDVcbi8vIGh0dHA6Ly9kZXYudzMub3JnL2h0bWw1L3NwZWMvT3ZlcnZpZXcuaHRtbCN2b2lkLWVsZW1lbnRzXG5jb25zdCBWT0lEX0VMRU1FTlRTID0gdGFnU2V0KCdhcmVhLGJyLGNvbCxocixpbWcsd2JyJyk7XG5cbi8vIEVsZW1lbnRzIHRoYXQgeW91IGNhbiwgaW50ZW50aW9uYWxseSwgbGVhdmUgb3BlbiAoYW5kIHdoaWNoIGNsb3NlIHRoZW1zZWx2ZXMpXG4vLyBodHRwOi8vZGV2LnczLm9yZy9odG1sNS9zcGVjL092ZXJ2aWV3Lmh0bWwjb3B0aW9uYWwtdGFnc1xuY29uc3QgT1BUSU9OQUxfRU5EX1RBR19CTE9DS19FTEVNRU5UUyA9IHRhZ1NldCgnY29sZ3JvdXAsZGQsZHQsbGkscCx0Ym9keSx0ZCx0Zm9vdCx0aCx0aGVhZCx0cicpO1xuY29uc3QgT1BUSU9OQUxfRU5EX1RBR19JTkxJTkVfRUxFTUVOVFMgPSB0YWdTZXQoJ3JwLHJ0Jyk7XG5jb25zdCBPUFRJT05BTF9FTkRfVEFHX0VMRU1FTlRTID1cbiAgICBtZXJnZShPUFRJT05BTF9FTkRfVEFHX0lOTElORV9FTEVNRU5UUywgT1BUSU9OQUxfRU5EX1RBR19CTE9DS19FTEVNRU5UUyk7XG5cbi8vIFNhZmUgQmxvY2sgRWxlbWVudHMgLSBIVE1MNVxuY29uc3QgQkxPQ0tfRUxFTUVOVFMgPSBtZXJnZShcbiAgICBPUFRJT05BTF9FTkRfVEFHX0JMT0NLX0VMRU1FTlRTLFxuICAgIHRhZ1NldChcbiAgICAgICAgJ2FkZHJlc3MsYXJ0aWNsZSwnICtcbiAgICAgICAgJ2FzaWRlLGJsb2NrcXVvdGUsY2FwdGlvbixjZW50ZXIsZGVsLGRldGFpbHMsZGlhbG9nLGRpcixkaXYsZGwsZmlndXJlLGZpZ2NhcHRpb24sZm9vdGVyLGgxLGgyLGgzLGg0LGg1LCcgK1xuICAgICAgICAnaDYsaGVhZGVyLGhncm91cCxocixpbnMsbWFpbixtYXAsbWVudSxuYXYsb2wscHJlLHNlY3Rpb24sc3VtbWFyeSx0YWJsZSx1bCcpKTtcblxuLy8gSW5saW5lIEVsZW1lbnRzIC0gSFRNTDVcbmNvbnN0IElOTElORV9FTEVNRU5UUyA9IG1lcmdlKFxuICAgIE9QVElPTkFMX0VORF9UQUdfSU5MSU5FX0VMRU1FTlRTLFxuICAgIHRhZ1NldChcbiAgICAgICAgJ2EsYWJicixhY3JvbnltLGF1ZGlvLGIsJyArXG4gICAgICAgICdiZGksYmRvLGJpZyxicixjaXRlLGNvZGUsZGVsLGRmbixlbSxmb250LGksaW1nLGlucyxrYmQsbGFiZWwsbWFwLG1hcmsscGljdHVyZSxxLHJ1YnkscnAscnQscywnICtcbiAgICAgICAgJ3NhbXAsc21hbGwsc291cmNlLHNwYW4sc3RyaWtlLHN0cm9uZyxzdWIsc3VwLHRpbWUsdHJhY2ssdHQsdSx2YXIsdmlkZW8nKSk7XG5cbmNvbnN0IFZBTElEX0VMRU1FTlRTID1cbiAgICBtZXJnZShWT0lEX0VMRU1FTlRTLCBCTE9DS19FTEVNRU5UUywgSU5MSU5FX0VMRU1FTlRTLCBPUFRJT05BTF9FTkRfVEFHX0VMRU1FTlRTKTtcblxuLy8gQXR0cmlidXRlcyB0aGF0IGhhdmUgaHJlZiBhbmQgaGVuY2UgbmVlZCB0byBiZSBzYW5pdGl6ZWRcbmNvbnN0IFVSSV9BVFRSUyA9IHRhZ1NldCgnYmFja2dyb3VuZCxjaXRlLGhyZWYsaXRlbXR5cGUsbG9uZ2Rlc2MscG9zdGVyLHNyYyx4bGluazpocmVmJyk7XG5cbi8vIEF0dHJpYnV0ZXMgdGhhdCBoYXZlIHNwZWNpYWwgaHJlZiBzZXQgaGVuY2UgbmVlZCB0byBiZSBzYW5pdGl6ZWRcbmNvbnN0IFNSQ1NFVF9BVFRSUyA9IHRhZ1NldCgnc3Jjc2V0Jyk7XG5cbmNvbnN0IEhUTUxfQVRUUlMgPSB0YWdTZXQoXG4gICAgJ2FiYnIsYWNjZXNza2V5LGFsaWduLGFsdCxhdXRvcGxheSxheGlzLGJnY29sb3IsYm9yZGVyLGNlbGxwYWRkaW5nLGNlbGxzcGFjaW5nLGNsYXNzLGNsZWFyLGNvbG9yLGNvbHMsY29sc3BhbiwnICtcbiAgICAnY29tcGFjdCxjb250cm9scyxjb29yZHMsZGF0ZXRpbWUsZGVmYXVsdCxkaXIsZG93bmxvYWQsZmFjZSxoZWFkZXJzLGhlaWdodCxoaWRkZW4saHJlZmxhbmcsaHNwYWNlLCcgK1xuICAgICdpc21hcCxpdGVtc2NvcGUsaXRlbXByb3Asa2luZCxsYWJlbCxsYW5nLGxhbmd1YWdlLGxvb3AsbWVkaWEsbXV0ZWQsbm9ocmVmLG5vd3JhcCxvcGVuLHByZWxvYWQscmVsLHJldixyb2xlLHJvd3Mscm93c3BhbixydWxlcywnICtcbiAgICAnc2NvcGUsc2Nyb2xsaW5nLHNoYXBlLHNpemUsc2l6ZXMsc3BhbixzcmNsYW5nLHN0YXJ0LHN1bW1hcnksdGFiaW5kZXgsdGFyZ2V0LHRpdGxlLHRyYW5zbGF0ZSx0eXBlLHVzZW1hcCwnICtcbiAgICAndmFsaWduLHZhbHVlLHZzcGFjZSx3aWR0aCcpO1xuXG4vLyBOQjogVGhpcyBjdXJyZW50bHkgY29uc2Npb3VzbHkgZG9lc24ndCBzdXBwb3J0IFNWRy4gU1ZHIHNhbml0aXphdGlvbiBoYXMgaGFkIHNldmVyYWwgc2VjdXJpdHlcbi8vIGlzc3VlcyBpbiB0aGUgcGFzdCwgc28gaXQgc2VlbXMgc2FmZXIgdG8gbGVhdmUgaXQgb3V0IGlmIHBvc3NpYmxlLiBJZiBzdXBwb3J0IGZvciBiaW5kaW5nIFNWRyB2aWFcbi8vIGlubmVySFRNTCBpcyByZXF1aXJlZCwgU1ZHIGF0dHJpYnV0ZXMgc2hvdWxkIGJlIGFkZGVkIGhlcmUuXG5cbi8vIE5COiBTYW5pdGl6YXRpb24gZG9lcyBub3QgYWxsb3cgPGZvcm0+IGVsZW1lbnRzIG9yIG90aGVyIGFjdGl2ZSBlbGVtZW50cyAoPGJ1dHRvbj4gZXRjKS4gVGhvc2Vcbi8vIGNhbiBiZSBzYW5pdGl6ZWQsIGJ1dCB0aGV5IGluY3JlYXNlIHNlY3VyaXR5IHN1cmZhY2UgYXJlYSB3aXRob3V0IGEgbGVnaXRpbWF0ZSB1c2UgY2FzZSwgc28gdGhleVxuLy8gYXJlIGxlZnQgb3V0IGhlcmUuXG5cbmNvbnN0IFZBTElEX0FUVFJTID0gbWVyZ2UoVVJJX0FUVFJTLCBTUkNTRVRfQVRUUlMsIEhUTUxfQVRUUlMpO1xuXG4vKipcbiAqIFNhbml0aXppbmdIdG1sU2VyaWFsaXplciBzZXJpYWxpemVzIGEgRE9NIGZyYWdtZW50LCBzdHJpcHBpbmcgb3V0IGFueSB1bnNhZmUgZWxlbWVudHMgYW5kIHVuc2FmZVxuICogYXR0cmlidXRlcy5cbiAqL1xuY2xhc3MgU2FuaXRpemluZ0h0bWxTZXJpYWxpemVyIHtcbiAgLy8gRXhwbGljaXRseSB0cmFjayBpZiBzb21ldGhpbmcgd2FzIHN0cmlwcGVkLCB0byBhdm9pZCBhY2NpZGVudGFsbHkgd2FybmluZyBvZiBzYW5pdGl6YXRpb24ganVzdFxuICAvLyBiZWNhdXNlIGNoYXJhY3RlcnMgd2VyZSByZS1lbmNvZGVkLlxuICBwdWJsaWMgc2FuaXRpemVkU29tZXRoaW5nID0gZmFsc2U7XG4gIHByaXZhdGUgYnVmOiBzdHJpbmdbXSA9IFtdO1xuXG4gIHNhbml0aXplQ2hpbGRyZW4oZWw6IEVsZW1lbnQpOiBzdHJpbmcge1xuICAgIC8vIFRoaXMgY2Fubm90IHVzZSBhIFRyZWVXYWxrZXIsIGFzIGl0IGhhcyB0byBydW4gb24gQW5ndWxhcidzIHZhcmlvdXMgRE9NIGFkYXB0ZXJzLlxuICAgIC8vIEhvd2V2ZXIgdGhpcyBjb2RlIG5ldmVyIGFjY2Vzc2VzIHByb3BlcnRpZXMgb2ZmIG9mIGBkb2N1bWVudGAgYmVmb3JlIGRlbGV0aW5nIGl0cyBjb250ZW50c1xuICAgIC8vIGFnYWluLCBzbyBpdCBzaG91bGRuJ3QgYmUgdnVsbmVyYWJsZSB0byBET00gY2xvYmJlcmluZy5cbiAgICBsZXQgY3VycmVudDogTm9kZSA9IGVsLmZpcnN0Q2hpbGQgITtcbiAgICB3aGlsZSAoY3VycmVudCkge1xuICAgICAgaWYgKGN1cnJlbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHRoaXMuc3RhcnRFbGVtZW50KGN1cnJlbnQgYXMgRWxlbWVudCk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgIHRoaXMuY2hhcnMoY3VycmVudC5ub2RlVmFsdWUgISk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTdHJpcCBub24tZWxlbWVudCwgbm9uLXRleHQgbm9kZXMuXG4gICAgICAgIHRoaXMuc2FuaXRpemVkU29tZXRoaW5nID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChjdXJyZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnQuZmlyc3RDaGlsZCAhO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChjdXJyZW50KSB7XG4gICAgICAgIC8vIExlYXZpbmcgdGhlIGVsZW1lbnQuIFdhbGsgdXAgYW5kIHRvIHRoZSByaWdodCwgY2xvc2luZyB0YWdzIGFzIHdlIGdvLlxuICAgICAgICBpZiAoY3VycmVudC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICB0aGlzLmVuZEVsZW1lbnQoY3VycmVudCBhcyBFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBuZXh0ID0gdGhpcy5jaGVja0Nsb2JiZXJlZEVsZW1lbnQoY3VycmVudCwgY3VycmVudC5uZXh0U2libGluZyAhKTtcblxuICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgIGN1cnJlbnQgPSBuZXh0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudCA9IHRoaXMuY2hlY2tDbG9iYmVyZWRFbGVtZW50KGN1cnJlbnQsIGN1cnJlbnQucGFyZW50Tm9kZSAhKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYnVmLmpvaW4oJycpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGFydEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKCFWQUxJRF9FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSkge1xuICAgICAgdGhpcy5zYW5pdGl6ZWRTb21ldGhpbmcgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmJ1Zi5wdXNoKCc8Jyk7XG4gICAgdGhpcy5idWYucHVzaCh0YWdOYW1lKTtcbiAgICBjb25zdCBlbEF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxBdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxBdHRyID0gZWxBdHRycy5pdGVtKGkpO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBlbEF0dHIgIS5uYW1lO1xuICAgICAgY29uc3QgbG93ZXIgPSBhdHRyTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKCFWQUxJRF9BVFRSUy5oYXNPd25Qcm9wZXJ0eShsb3dlcikpIHtcbiAgICAgICAgdGhpcy5zYW5pdGl6ZWRTb21ldGhpbmcgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCB2YWx1ZSA9IGVsQXR0ciAhLnZhbHVlO1xuICAgICAgLy8gVE9ETyhtYXJ0aW5wcm9ic3QpOiBTcGVjaWFsIGNhc2UgaW1hZ2UgVVJJcyBmb3IgZGF0YTppbWFnZS8uLi5cbiAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJdKSB2YWx1ZSA9IF9zYW5pdGl6ZVVybCh2YWx1ZSk7XG4gICAgICBpZiAoU1JDU0VUX0FUVFJTW2xvd2VyXSkgdmFsdWUgPSBzYW5pdGl6ZVNyY3NldCh2YWx1ZSk7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKCcgJywgYXR0ck5hbWUsICc9XCInLCBlbmNvZGVFbnRpdGllcyh2YWx1ZSksICdcIicpO1xuICAgIH1cbiAgICB0aGlzLmJ1Zi5wdXNoKCc+Jyk7XG4gIH1cblxuICBwcml2YXRlIGVuZEVsZW1lbnQoY3VycmVudDogRWxlbWVudCkge1xuICAgIGNvbnN0IHRhZ05hbWUgPSBjdXJyZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKFZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpICYmICFWT0lEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKCc8LycpO1xuICAgICAgdGhpcy5idWYucHVzaCh0YWdOYW1lKTtcbiAgICAgIHRoaXMuYnVmLnB1c2goJz4nKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNoYXJzKGNoYXJzOiBzdHJpbmcpIHsgdGhpcy5idWYucHVzaChlbmNvZGVFbnRpdGllcyhjaGFycykpOyB9XG5cbiAgY2hlY2tDbG9iYmVyZWRFbGVtZW50KG5vZGU6IE5vZGUsIG5leHROb2RlOiBOb2RlKTogTm9kZSB7XG4gICAgaWYgKG5leHROb2RlICYmXG4gICAgICAgIChub2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG5leHROb2RlKSAmXG4gICAgICAgICBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0NPTlRBSU5FRF9CWSkgPT09wqBOb2RlLkRPQ1VNRU5UX1BPU0lUSU9OX0NPTlRBSU5FRF9CWSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBGYWlsZWQgdG8gc2FuaXRpemUgaHRtbCBiZWNhdXNlIHRoZSBlbGVtZW50IGlzIGNsb2JiZXJlZDogJHsobm9kZSBhcyBFbGVtZW50KS5vdXRlckhUTUx9YCk7XG4gICAgfVxuICAgIHJldHVybiBuZXh0Tm9kZTtcbiAgfVxufVxuXG4vLyBSZWd1bGFyIEV4cHJlc3Npb25zIGZvciBwYXJzaW5nIHRhZ3MgYW5kIGF0dHJpYnV0ZXNcbmNvbnN0IFNVUlJPR0FURV9QQUlSX1JFR0VYUCA9IC9bXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZdL2c7XG4vLyAhIHRvIH4gaXMgdGhlIEFTQ0lJIHJhbmdlLlxuY29uc3QgTk9OX0FMUEhBTlVNRVJJQ19SRUdFWFAgPSAvKFteXFwjLX4gfCFdKS9nO1xuXG4vKipcbiAqIEVzY2FwZXMgYWxsIHBvdGVudGlhbGx5IGRhbmdlcm91cyBjaGFyYWN0ZXJzLCBzbyB0aGF0IHRoZVxuICogcmVzdWx0aW5nIHN0cmluZyBjYW4gYmUgc2FmZWx5IGluc2VydGVkIGludG8gYXR0cmlidXRlIG9yXG4gKiBlbGVtZW50IHRleHQuXG4gKiBAcGFyYW0gdmFsdWVcbiAqL1xuZnVuY3Rpb24gZW5jb2RlRW50aXRpZXModmFsdWU6IHN0cmluZykge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICAgU1VSUk9HQVRFX1BBSVJfUkVHRVhQLFxuICAgICAgICAgIGZ1bmN0aW9uKG1hdGNoOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IGhpID0gbWF0Y2guY2hhckNvZGVBdCgwKTtcbiAgICAgICAgICAgIGNvbnN0IGxvdyA9IG1hdGNoLmNoYXJDb2RlQXQoMSk7XG4gICAgICAgICAgICByZXR1cm4gJyYjJyArICgoKGhpIC0gMHhEODAwKSAqIDB4NDAwKSArIChsb3cgLSAweERDMDApICsgMHgxMDAwMCkgKyAnOyc7XG4gICAgICAgICAgfSlcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAgIE5PTl9BTFBIQU5VTUVSSUNfUkVHRVhQLFxuICAgICAgICAgIGZ1bmN0aW9uKG1hdGNoOiBzdHJpbmcpIHsgcmV0dXJuICcmIycgKyBtYXRjaC5jaGFyQ29kZUF0KDApICsgJzsnOyB9KVxuICAgICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbn1cblxubGV0IGluZXJ0Qm9keUhlbHBlcjogSW5lcnRCb2R5SGVscGVyO1xuXG4vKipcbiAqIFNhbml0aXplcyB0aGUgZ2l2ZW4gdW5zYWZlLCB1bnRydXN0ZWQgSFRNTCBmcmFnbWVudCwgYW5kIHJldHVybnMgSFRNTCB0ZXh0IHRoYXQgaXMgc2FmZSB0byBhZGQgdG9cbiAqIHRoZSBET00gaW4gYSBicm93c2VyIGVudmlyb25tZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gX3Nhbml0aXplSHRtbChkZWZhdWx0RG9jOiBhbnksIHVuc2FmZUh0bWxJbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGluZXJ0Qm9keUVsZW1lbnQ6IEhUTUxFbGVtZW50fG51bGwgPSBudWxsO1xuICB0cnkge1xuICAgIGluZXJ0Qm9keUhlbHBlciA9IGluZXJ0Qm9keUhlbHBlciB8fCBuZXcgSW5lcnRCb2R5SGVscGVyKGRlZmF1bHREb2MpO1xuICAgIC8vIE1ha2Ugc3VyZSB1bnNhZmVIdG1sIGlzIGFjdHVhbGx5IGEgc3RyaW5nIChUeXBlU2NyaXB0IHR5cGVzIGFyZSBub3QgZW5mb3JjZWQgYXQgcnVudGltZSkuXG4gICAgbGV0IHVuc2FmZUh0bWwgPSB1bnNhZmVIdG1sSW5wdXQgPyBTdHJpbmcodW5zYWZlSHRtbElucHV0KSA6ICcnO1xuICAgIGluZXJ0Qm9keUVsZW1lbnQgPSBpbmVydEJvZHlIZWxwZXIuZ2V0SW5lcnRCb2R5RWxlbWVudCh1bnNhZmVIdG1sKTtcblxuICAgIC8vIG1YU1MgcHJvdGVjdGlvbi4gUmVwZWF0ZWRseSBwYXJzZSB0aGUgZG9jdW1lbnQgdG8gbWFrZSBzdXJlIGl0IHN0YWJpbGl6ZXMsIHNvIHRoYXQgYSBicm93c2VyXG4gICAgLy8gdHJ5aW5nIHRvIGF1dG8tY29ycmVjdCBpbmNvcnJlY3QgSFRNTCBjYW5ub3QgY2F1c2UgZm9ybWVybHkgaW5lcnQgSFRNTCB0byBiZWNvbWUgZGFuZ2Vyb3VzLlxuICAgIGxldCBtWFNTQXR0ZW1wdHMgPSA1O1xuICAgIGxldCBwYXJzZWRIdG1sID0gdW5zYWZlSHRtbDtcblxuICAgIGRvIHtcbiAgICAgIGlmIChtWFNTQXR0ZW1wdHMgPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gc2FuaXRpemUgaHRtbCBiZWNhdXNlIHRoZSBpbnB1dCBpcyB1bnN0YWJsZScpO1xuICAgICAgfVxuICAgICAgbVhTU0F0dGVtcHRzLS07XG5cbiAgICAgIHVuc2FmZUh0bWwgPSBwYXJzZWRIdG1sO1xuICAgICAgcGFyc2VkSHRtbCA9IGluZXJ0Qm9keUVsZW1lbnQgIS5pbm5lckhUTUw7XG4gICAgICBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG4gICAgfSB3aGlsZSAodW5zYWZlSHRtbCAhPT0gcGFyc2VkSHRtbCk7XG5cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSBuZXcgU2FuaXRpemluZ0h0bWxTZXJpYWxpemVyKCk7XG4gICAgY29uc3Qgc2FmZUh0bWwgPSBzYW5pdGl6ZXIuc2FuaXRpemVDaGlsZHJlbihcbiAgICAgICAgZ2V0VGVtcGxhdGVDb250ZW50KGluZXJ0Qm9keUVsZW1lbnQgISkgYXMgRWxlbWVudCB8fCBpbmVydEJvZHlFbGVtZW50KTtcbiAgICBpZiAoaXNEZXZNb2RlKCkgJiYgc2FuaXRpemVyLnNhbml0aXplZFNvbWV0aGluZykge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICdXQVJOSU5HOiBzYW5pdGl6aW5nIEhUTUwgc3RyaXBwZWQgc29tZSBjb250ZW50IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2FmZUh0bWw7XG4gIH0gZmluYWxseSB7XG4gICAgLy8gSW4gY2FzZSBhbnl0aGluZyBnb2VzIHdyb25nLCBjbGVhciBvdXQgaW5lcnRFbGVtZW50IHRvIHJlc2V0IHRoZSBlbnRpcmUgRE9NIHN0cnVjdHVyZS5cbiAgICBpZiAoaW5lcnRCb2R5RWxlbWVudCkge1xuICAgICAgY29uc3QgcGFyZW50ID0gZ2V0VGVtcGxhdGVDb250ZW50KGluZXJ0Qm9keUVsZW1lbnQpIHx8IGluZXJ0Qm9keUVsZW1lbnQ7XG4gICAgICB3aGlsZSAocGFyZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHBhcmVudC5maXJzdENoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGVDb250ZW50KGVsOiBOb2RlKTogTm9kZXxudWxsIHtcbiAgcmV0dXJuICdjb250ZW50JyBpbiAoZWwgYXMgYW55IC8qKiBNaWNyb3NvZnQvVHlwZVNjcmlwdCMyMTUxNyAqLykgJiYgaXNUZW1wbGF0ZUVsZW1lbnQoZWwpID9cbiAgICAgIGVsLmNvbnRlbnQgOlxuICAgICAgbnVsbDtcbn1cbmZ1bmN0aW9uIGlzVGVtcGxhdGVFbGVtZW50KGVsOiBOb2RlKTogZWwgaXMgSFRNTFRlbXBsYXRlRWxlbWVudCB7XG4gIHJldHVybiBlbC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUgJiYgZWwubm9kZU5hbWUgPT09ICdURU1QTEFURSc7XG59XG4iXX0=