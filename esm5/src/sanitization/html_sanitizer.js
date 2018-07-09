/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { isDevMode } from '../application_ref';
import { InertBodyHelper } from './inert_body';
import { _sanitizeUrl, sanitizeSrcset } from './url_sanitizer';
function tagSet(tags) {
    var res = {};
    try {
        for (var _a = tslib_1.__values(tags.split(',')), _b = _a.next(); !_b.done; _b = _a.next()) {
            var t = _b.value;
            res[t] = true;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return res;
    var e_1, _c;
}
function merge() {
    var sets = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sets[_i] = arguments[_i];
    }
    var res = {};
    try {
        for (var sets_1 = tslib_1.__values(sets), sets_1_1 = sets_1.next(); !sets_1_1.done; sets_1_1 = sets_1.next()) {
            var s = sets_1_1.value;
            for (var v in s) {
                if (s.hasOwnProperty(v))
                    res[v] = true;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (sets_1_1 && !sets_1_1.done && (_a = sets_1.return)) _a.call(sets_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return res;
    var e_2, _a;
}
// Good source of info about elements and attributes
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements
// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
var VOID_ELEMENTS = tagSet('area,br,col,hr,img,wbr');
// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
var OPTIONAL_END_TAG_BLOCK_ELEMENTS = tagSet('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr');
var OPTIONAL_END_TAG_INLINE_ELEMENTS = tagSet('rp,rt');
var OPTIONAL_END_TAG_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, OPTIONAL_END_TAG_BLOCK_ELEMENTS);
// Safe Block Elements - HTML5
var BLOCK_ELEMENTS = merge(OPTIONAL_END_TAG_BLOCK_ELEMENTS, tagSet('address,article,' +
    'aside,blockquote,caption,center,del,details,dialog,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
    'h6,header,hgroup,hr,ins,main,map,menu,nav,ol,pre,section,summary,table,ul'));
// Inline Elements - HTML5
var INLINE_ELEMENTS = merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, tagSet('a,abbr,acronym,audio,b,' +
    'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,picture,q,ruby,rp,rt,s,' +
    'samp,small,source,span,strike,strong,sub,sup,time,track,tt,u,var,video'));
var VALID_ELEMENTS = merge(VOID_ELEMENTS, BLOCK_ELEMENTS, INLINE_ELEMENTS, OPTIONAL_END_TAG_ELEMENTS);
// Attributes that have href and hence need to be sanitized
var URI_ATTRS = tagSet('background,cite,href,itemtype,longdesc,poster,src,xlink:href');
// Attributes that have special href set hence need to be sanitized
var SRCSET_ATTRS = tagSet('srcset');
var HTML_ATTRS = tagSet('abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,color,cols,colspan,' +
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
var VALID_ATTRS = merge(URI_ATTRS, SRCSET_ATTRS, HTML_ATTRS);
/**
 * SanitizingHtmlSerializer serializes a DOM fragment, stripping out any unsafe elements and unsafe
 * attributes.
 */
var SanitizingHtmlSerializer = /** @class */ (function () {
    function SanitizingHtmlSerializer() {
        // Explicitly track if something was stripped, to avoid accidentally warning of sanitization just
        // because characters were re-encoded.
        this.sanitizedSomething = false;
        this.buf = [];
    }
    SanitizingHtmlSerializer.prototype.sanitizeChildren = function (el) {
        // This cannot use a TreeWalker, as it has to run on Angular's various DOM adapters.
        // However this code never accesses properties off of `document` before deleting its contents
        // again, so it shouldn't be vulnerable to DOM clobbering.
        var current = el.firstChild;
        while (current) {
            if (current.nodeType === Node.ELEMENT_NODE) {
                this.startElement(current);
            }
            else if (current.nodeType === Node.TEXT_NODE) {
                this.chars(current.nodeValue);
            }
            else {
                // Strip non-element, non-text nodes.
                this.sanitizedSomething = true;
            }
            if (current.firstChild) {
                current = current.firstChild;
                continue;
            }
            while (current) {
                // Leaving the element. Walk up and to the right, closing tags as we go.
                if (current.nodeType === Node.ELEMENT_NODE) {
                    this.endElement(current);
                }
                var next = this.checkClobberedElement(current, current.nextSibling);
                if (next) {
                    current = next;
                    break;
                }
                current = this.checkClobberedElement(current, current.parentNode);
            }
        }
        return this.buf.join('');
    };
    SanitizingHtmlSerializer.prototype.startElement = function (element) {
        var tagName = element.nodeName.toLowerCase();
        if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
            this.sanitizedSomething = true;
            return;
        }
        this.buf.push('<');
        this.buf.push(tagName);
        var elAttrs = element.attributes;
        for (var i = 0; i < elAttrs.length; i++) {
            var elAttr = elAttrs.item(i);
            var attrName = elAttr.name;
            var lower = attrName.toLowerCase();
            if (!VALID_ATTRS.hasOwnProperty(lower)) {
                this.sanitizedSomething = true;
                continue;
            }
            var value = elAttr.value;
            // TODO(martinprobst): Special case image URIs for data:image/...
            if (URI_ATTRS[lower])
                value = _sanitizeUrl(value);
            if (SRCSET_ATTRS[lower])
                value = sanitizeSrcset(value);
            this.buf.push(' ', attrName, '="', encodeEntities(value), '"');
        }
        this.buf.push('>');
    };
    SanitizingHtmlSerializer.prototype.endElement = function (current) {
        var tagName = current.nodeName.toLowerCase();
        if (VALID_ELEMENTS.hasOwnProperty(tagName) && !VOID_ELEMENTS.hasOwnProperty(tagName)) {
            this.buf.push('</');
            this.buf.push(tagName);
            this.buf.push('>');
        }
    };
    SanitizingHtmlSerializer.prototype.chars = function (chars) { this.buf.push(encodeEntities(chars)); };
    SanitizingHtmlSerializer.prototype.checkClobberedElement = function (node, nextNode) {
        if (nextNode &&
            (node.compareDocumentPosition(nextNode) &
                Node.DOCUMENT_POSITION_CONTAINED_BY) === Node.DOCUMENT_POSITION_CONTAINED_BY) {
            throw new Error("Failed to sanitize html because the element is clobbered: " + node.outerHTML);
        }
        return nextNode;
    };
    return SanitizingHtmlSerializer;
}());
// Regular Expressions for parsing tags and attributes
var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
// ! to ~ is the ASCII range.
var NON_ALPHANUMERIC_REGEXP = /([^\#-~ |!])/g;
/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param value
 */
function encodeEntities(value) {
    return value.replace(/&/g, '&amp;')
        .replace(SURROGATE_PAIR_REGEXP, function (match) {
        var hi = match.charCodeAt(0);
        var low = match.charCodeAt(1);
        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
    })
        .replace(NON_ALPHANUMERIC_REGEXP, function (match) { return '&#' + match.charCodeAt(0) + ';'; })
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
var inertBodyHelper;
/**
 * Sanitizes the given unsafe, untrusted HTML fragment, and returns HTML text that is safe to add to
 * the DOM in a browser environment.
 */
export function _sanitizeHtml(defaultDoc, unsafeHtmlInput) {
    var inertBodyElement = null;
    try {
        inertBodyHelper = inertBodyHelper || new InertBodyHelper(defaultDoc);
        // Make sure unsafeHtml is actually a string (TypeScript types are not enforced at runtime).
        var unsafeHtml = unsafeHtmlInput ? String(unsafeHtmlInput) : '';
        inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
        // mXSS protection. Repeatedly parse the document to make sure it stabilizes, so that a browser
        // trying to auto-correct incorrect HTML cannot cause formerly inert HTML to become dangerous.
        var mXSSAttempts = 5;
        var parsedHtml = unsafeHtml;
        do {
            if (mXSSAttempts === 0) {
                throw new Error('Failed to sanitize html because the input is unstable');
            }
            mXSSAttempts--;
            unsafeHtml = parsedHtml;
            parsedHtml = inertBodyElement.innerHTML;
            inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
        } while (unsafeHtml !== parsedHtml);
        var sanitizer = new SanitizingHtmlSerializer();
        var safeHtml = sanitizer.sanitizeChildren(getTemplateContent(inertBodyElement) || inertBodyElement);
        if (isDevMode() && sanitizer.sanitizedSomething) {
            console.warn('WARNING: sanitizing HTML stripped some content (see http://g.co/ng/security#xss).');
        }
        return safeHtml;
    }
    finally {
        // In case anything goes wrong, clear out inertElement to reset the entire DOM structure.
        if (inertBodyElement) {
            var parent_1 = getTemplateContent(inertBodyElement) || inertBodyElement;
            while (parent_1.firstChild) {
                parent_1.removeChild(parent_1.firstChild);
            }
        }
    }
}
function getTemplateContent(el) {
    return 'content' in el /** Microsoft/TypeScript#21517 */ && isTemplateElement(el) ?
        el.content :
        null;
}
function isTemplateElement(el) {
    return el.nodeType === Node.ELEMENT_NODE && el.nodeName === 'TEMPLATE';
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9zYW5pdGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zYW5pdGl6YXRpb24vaHRtbF9zYW5pdGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxZQUFZLEVBQUUsY0FBYyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFN0QsZ0JBQWdCLElBQVk7SUFDMUIsSUFBTSxHQUFHLEdBQTJCLEVBQUUsQ0FBQzs7UUFDdkMsR0FBRyxDQUFDLENBQVksSUFBQSxLQUFBLGlCQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUEsZ0JBQUE7WUFBMUIsSUFBTSxDQUFDLFdBQUE7WUFBcUIsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUFBOzs7Ozs7Ozs7SUFDL0MsTUFBTSxDQUFDLEdBQUcsQ0FBQzs7QUFDYixDQUFDO0FBRUQ7SUFBZSxjQUFpQztTQUFqQyxVQUFpQyxFQUFqQyxxQkFBaUMsRUFBakMsSUFBaUM7UUFBakMseUJBQWlDOztJQUM5QyxJQUFNLEdBQUcsR0FBMkIsRUFBRSxDQUFDOztRQUN2QyxHQUFHLENBQUMsQ0FBWSxJQUFBLFNBQUEsaUJBQUEsSUFBSSxDQUFBLDBCQUFBO1lBQWYsSUFBTSxDQUFDLGlCQUFBO1lBQ1YsR0FBRyxDQUFDLENBQUMsSUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ3pDLENB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QUMsRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDO0FBQ3pFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aXNEZXZNb2RlfSBmcm9tICcuLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtJbmVydEJvZHlIZWxwZXJ9IGZyb20gJy4vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybCwgc2FuaXRpemVTcmNzZXR9IGZyb20gJy4vdXJsX3Nhbml0aXplcic7XG5cbmZ1bmN0aW9uIHRhZ1NldCh0YWdzOiBzdHJpbmcpOiB7W2s6IHN0cmluZ106IGJvb2xlYW59IHtcbiAgY29uc3QgcmVzOiB7W2s6IHN0cmluZ106IGJvb2xlYW59ID0ge307XG4gIGZvciAoY29uc3QgdCBvZiB0YWdzLnNwbGl0KCcsJykpIHJlc1t0XSA9IHRydWU7XG4gIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIG1lcmdlKC4uLnNldHM6IHtbazogc3RyaW5nXTogYm9vbGVhbn1bXSk6IHtbazogc3RyaW5nXTogYm9vbGVhbn0ge1xuICBjb25zdCByZXM6IHtbazogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgZm9yIChjb25zdCBzIG9mIHNldHMpIHtcbiAgICBmb3IgKGNvbnN0IHYgaW4gcykge1xuICAgICAgaWYgKHMuaGFzT3duUHJvcGVydHkodikpIHJlc1t2XSA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59XG5cbi8vIEdvb2Qgc291cmNlIG9mIGluZm8gYWJvdXQgZWxlbWVudHMgYW5kIGF0dHJpYnV0ZXNcbi8vIGh0dHA6Ly9kZXYudzMub3JnL2h0bWw1L3NwZWMvT3ZlcnZpZXcuaHRtbCNzZW1hbnRpY3Ncbi8vIGh0dHA6Ly9zaW1vbi5odG1sNS5vcmcvaHRtbC1lbGVtZW50c1xuXG4vLyBTYWZlIFZvaWQgRWxlbWVudHMgLSBIVE1MNVxuLy8gaHR0cDovL2Rldi53My5vcmcvaHRtbDUvc3BlYy9PdmVydmlldy5odG1sI3ZvaWQtZWxlbWVudHNcbmNvbnN0IFZPSURfRUxFTUVOVFMgPSB0YWdTZXQoJ2FyZWEsYnIsY29sLGhyLGltZyx3YnInKTtcblxuLy8gRWxlbWVudHMgdGhhdCB5b3UgY2FuLCBpbnRlbnRpb25hbGx5LCBsZWF2ZSBvcGVuIChhbmQgd2hpY2ggY2xvc2UgdGhlbXNlbHZlcylcbi8vIGh0dHA6Ly9kZXYudzMub3JnL2h0bWw1L3NwZWMvT3ZlcnZpZXcuaHRtbCNvcHRpb25hbC10YWdzXG5jb25zdCBPUFRJT05BTF9FTkRfVEFHX0JMT0NLX0VMRU1FTlRTID0gdGFnU2V0KCdjb2xncm91cCxkZCxkdCxsaSxwLHRib2R5LHRkLHRmb290LHRoLHRoZWFkLHRyJyk7XG5jb25zdCBPUFRJT05BTF9FTkRfVEFHX0lOTElORV9FTEVNRU5UUyA9IHRhZ1NldCgncnAscnQnKTtcbmNvbnN0IE9QVElPTkFMX0VORF9UQUdfRUxFTUVOVFMgPVxuICAgIG1lcmdlKE9QVElPTkFMX0VORF9UQUdfSU5MSU5FX0VMRU1FTlRTLCBPUFRJT05BTF9FTkRfVEFHX0JMT0NLX0VMRU1FTlRTKTtcblxuLy8gU2FmZSBCbG9jayBFbGVtZW50cyAtIEhUTUw1XG5jb25zdCBCTE9DS19FTEVNRU5UUyA9IG1lcmdlKFxuICAgIE9QVElPTkFMX0VORF9UQUdfQkxPQ0tfRUxFTUVOVFMsXG4gICAgdGFnU2V0KFxuICAgICAgICAnYWRkcmVzcyxhcnRpY2xlLCcgK1xuICAgICAgICAnYXNpZGUsYmxvY2txdW90ZSxjYXB0aW9uLGNlbnRlcixkZWwsZGV0YWlscyxkaWFsb2csZGlyLGRpdixkbCxmaWd1cmUsZmlnY2FwdGlvbixmb290ZXIsaDEsaDIsaDMsaDQsaDUsJyArXG4gICAgICAgICdoNixoZWFkZXIsaGdyb3VwLGhyLGlucyxtYWluLG1hcCxtZW51LG5hdixvbCxwcmUsc2VjdGlvbixzdW1tYXJ5LHRhYmxlLHVsJykpO1xuXG4vLyBJbmxpbmUgRWxlbWVudHMgLSBIVE1MNVxuY29uc3QgSU5MSU5FX0VMRU1FTlRTID0gbWVyZ2UoXG4gICAgT1BUSU9OQUxfRU5EX1RBR19JTkxJTkVfRUxFTUVOVFMsXG4gICAgdGFnU2V0KFxuICAgICAgICAnYSxhYmJyLGFjcm9ueW0sYXVkaW8sYiwnICtcbiAgICAgICAgJ2JkaSxiZG8sYmlnLGJyLGNpdGUsY29kZSxkZWwsZGZuLGVtLGZvbnQsaSxpbWcsaW5zLGtiZCxsYWJlbCxtYXAsbWFyayxwaWN0dXJlLHEscnVieSxycCxydCxzLCcgK1xuICAgICAgICAnc2FtcCxzbWFsbCxzb3VyY2Usc3BhbixzdHJpa2Usc3Ryb25nLHN1YixzdXAsdGltZSx0cmFjayx0dCx1LHZhcix2aWRlbycpKTtcblxuY29uc3QgVkFMSURfRUxFTUVOVFMgPVxuICAgIG1lcmdlKFZPSURfRUxFTUVOVFMsIEJMT0NLX0VMRU1FTlRTLCBJTkxJTkVfRUxFTUVOVFMsIE9QVElPTkFMX0VORF9UQUdfRUxFTUVOVFMpO1xuXG4vLyBBdHRyaWJ1dGVzIHRoYXQgaGF2ZSBocmVmIGFuZCBoZW5jZSBuZWVkIHRvIGJlIHNhbml0aXplZFxuY29uc3QgVVJJX0FUVFJTID0gdGFnU2V0KCdiYWNrZ3JvdW5kLGNpdGUsaHJlZixpdGVtdHlwZSxsb25nZGVzYyxwb3N0ZXIsc3JjLHhsaW5rOmhyZWYnKTtcblxuLy8gQXR0cmlidXRlcyB0aGF0IGhhdmUgc3BlY2lhbCBocmVmIHNldCBoZW5jZSBuZWVkIHRvIGJlIHNhbml0aXplZFxuY29uc3QgU1JDU0VUX0FUVFJTID0gdGFnU2V0KCdzcmNzZXQnKTtcblxuY29uc3QgSFRNTF9BVFRSUyA9IHRhZ1NldChcbiAgICAnYWJicixhY2Nlc3NrZXksYWxpZ24sYWx0LGF1dG9wbGF5LGF4aXMsYmdjb2xvcixib3JkZXIsY2VsbHBhZGRpbmcsY2VsbHNwYWNpbmcsY2xhc3MsY2xlYXIsY29sb3IsY29scyxjb2xzcGFuLCcgK1xuICAgICdjb21wYWN0LGNvbnRyb2xzLGNvb3JkcyxkYXRldGltZSxkZWZhdWx0LGRpcixkb3dubG9hZCxmYWNlLGhlYWRlcnMsaGVpZ2h0LGhpZGRlbixocmVmbGFuZyxoc3BhY2UsJyArXG4gICAgJ2lzbWFwLGl0ZW1zY29wZSxpdGVtcHJvcCxraW5kLGxhYmVsLGxhbmcsbGFuZ3VhZ2UsbG9vcCxtZWRpYSxtdXRlZCxub2hyZWYsbm93cmFwLG9wZW4scHJlbG9hZCxyZWwscmV2LHJvbGUscm93cyxyb3dzcGFuLHJ1bGVzLCcgK1xuICAgICdzY29wZSxzY3JvbGxpbmcsc2hhcGUsc2l6ZSxzaXplcyxzcGFuLHNyY2xhbmcsc3RhcnQsc3VtbWFyeSx0YWJpbmRleCx0YXJnZXQsdGl0bGUsdHJhbnNsYXRlLHR5cGUsdXNlbWFwLCcgK1xuICAgICd2YWxpZ24sdmFsdWUsdnNwYWNlLHdpZHRoJyk7XG5cbi8vIE5COiBUaGlzIGN1cnJlbnRseSBjb25zY2lvdXNseSBkb2Vzbid0IHN1cHBvcnQgU1ZHLiBTVkcgc2FuaXRpemF0aW9uIGhhcyBoYWQgc2V2ZXJhbCBzZWN1cml0eVxuLy8gaXNzdWVzIGluIHRoZSBwYXN0LCBzbyBpdCBzZWVtcyBzYWZlciB0byBsZWF2ZSBpdCBvdXQgaWYgcG9zc2libGUuIElmIHN1cHBvcnQgZm9yIGJpbmRpbmcgU1ZHIHZpYVxuLy8gaW5uZXJIVE1MIGlzIHJlcXVpcmVkLCBTVkcgYXR0cmlidXRlcyBzaG91bGQgYmUgYWRkZWQgaGVyZS5cblxuLy8gTkI6IFNhbml0aXphdGlvbiBkb2VzIG5vdCBhbGxvdyA8Zm9ybT4gZWxlbWVudHMgb3Igb3RoZXIgYWN0aXZlIGVsZW1lbnRzICg8YnV0dG9uPiBldGMpLiBUaG9zZVxuLy8gY2FuIGJlIHNhbml0aXplZCwgYnV0IHRoZXkgaW5jcmVhc2Ugc2VjdXJpdHkgc3VyZmFjZSBhcmVhIHdpdGhvdXQgYSBsZWdpdGltYXRlIHVzZSBjYXNlLCBzbyB0aGV5XG4vLyBhcmUgbGVmdCBvdXQgaGVyZS5cblxuY29uc3QgVkFMSURfQVRUUlMgPSBtZXJnZShVUklfQVRUUlMsIFNSQ1NFVF9BVFRSUywgSFRNTF9BVFRSUyk7XG5cbi8qKlxuICogU2FuaXRpemluZ0h0bWxTZXJpYWxpemVyIHNlcmlhbGl6ZXMgYSBET00gZnJhZ21lbnQsIHN0cmlwcGluZyBvdXQgYW55IHVuc2FmZSBlbGVtZW50cyBhbmQgdW5zYWZlXG4gKiBhdHRyaWJ1dGVzLlxuICovXG5jbGFzcyBTYW5pdGl6aW5nSHRtbFNlcmlhbGl6ZXIge1xuICAvLyBFeHBsaWNpdGx5IHRyYWNrIGlmIHNvbWV0aGluZyB3YXMgc3RyaXBwZWQsIHRvIGF2b2lkIGFjY2lkZW50YWxseSB3YXJuaW5nIG9mIHNhbml0aXphdGlvbiBqdXN0XG4gIC8vIGJlY2F1c2UgY2hhcmFjdGVycyB3ZXJlIHJlLWVuY29kZWQuXG4gIHB1YmxpYyBzYW5pdGl6ZWRTb21ldGhpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBidWY6IHN0cmluZ1tdID0gW107XG5cbiAgc2FuaXRpemVDaGlsZHJlbihlbDogRWxlbWVudCk6IHN0cmluZyB7XG4gICAgLy8gVGhpcyBjYW5ub3QgdXNlIGEgVHJlZVdhbGtlciwgYXMgaXQgaGFzIHRvIHJ1biBvbiBBbmd1bGFyJ3MgdmFyaW91cyBET00gYWRhcHRlcnMuXG4gICAgLy8gSG93ZXZlciB0aGlzIGNvZGUgbmV2ZXIgYWNjZXNzZXMgcHJvcGVydGllcyBvZmYgb2YgYGRvY3VtZW50YCBiZWZvcmUgZGVsZXRpbmcgaXRzIGNvbnRlbnRzXG4gICAgLy8gYWdhaW4sIHNvIGl0IHNob3VsZG4ndCBiZSB2dWxuZXJhYmxlIHRvIERPTSBjbG9iYmVyaW5nLlxuICAgIGxldCBjdXJyZW50OiBOb2RlID0gZWwuZmlyc3RDaGlsZCAhO1xuICAgIHdoaWxlIChjdXJyZW50KSB7XG4gICAgICBpZiAoY3VycmVudC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgdGhpcy5zdGFydEVsZW1lbnQoY3VycmVudCBhcyBFbGVtZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgdGhpcy5jaGFycyhjdXJyZW50Lm5vZGVWYWx1ZSAhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFN0cmlwIG5vbi1lbGVtZW50LCBub24tdGV4dCBub2Rlcy5cbiAgICAgICAgdGhpcy5zYW5pdGl6ZWRTb21ldGhpbmcgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICBjdXJyZW50ID0gY3VycmVudC5maXJzdENoaWxkICE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICAgICAgLy8gTGVhdmluZyB0aGUgZWxlbWVudC4gV2FsayB1cCBhbmQgdG8gdGhlIHJpZ2h0LCBjbG9zaW5nIHRhZ3MgYXMgd2UgZ28uXG4gICAgICAgIGlmIChjdXJyZW50Lm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgIHRoaXMuZW5kRWxlbWVudChjdXJyZW50IGFzIEVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5leHQgPSB0aGlzLmNoZWNrQ2xvYmJlcmVkRWxlbWVudChjdXJyZW50LCBjdXJyZW50Lm5leHRTaWJsaW5nICEpO1xuXG4gICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgY3VycmVudCA9IG5leHQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50ID0gdGhpcy5jaGVja0Nsb2JiZXJlZEVsZW1lbnQoY3VycmVudCwgY3VycmVudC5wYXJlbnROb2RlICEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWYuam9pbignJyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXJ0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICB0aGlzLnNhbml0aXplZFNvbWV0aGluZyA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuYnVmLnB1c2goJzwnKTtcbiAgICB0aGlzLmJ1Zi5wdXNoKHRhZ05hbWUpO1xuICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbEF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbEF0dHIgPSBlbEF0dHJzLml0ZW0oaSk7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGVsQXR0ciAhLm5hbWU7XG4gICAgICBjb25zdCBsb3dlciA9IGF0dHJOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAoIVZBTElEX0FUVFJTLmhhc093blByb3BlcnR5KGxvd2VyKSkge1xuICAgICAgICB0aGlzLnNhbml0aXplZFNvbWV0aGluZyA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbGV0IHZhbHVlID0gZWxBdHRyICEudmFsdWU7XG4gICAgICAvLyBUT0RPKG1hcnRpbnByb2JzdCk6IFNwZWNpYWwgY2FzZSBpbWFnZSBVUklzIGZvciBkYXRhOmltYWdlLy4uLlxuICAgICAgaWYgKFVSSV9BVFRSU1tsb3dlcl0pIHZhbHVlID0gX3Nhbml0aXplVXJsKHZhbHVlKTtcbiAgICAgIGlmIChTUkNTRVRfQVRUUlNbbG93ZXJdKSB2YWx1ZSA9IHNhbml0aXplU3Jjc2V0KHZhbHVlKTtcbiAgICAgIHRoaXMuYnVmLnB1c2goJyAnLCBhdHRyTmFtZSwgJz1cIicsIGVuY29kZUVudGl0aWVzKHZhbHVlKSwgJ1wiJyk7XG4gICAgfVxuICAgIHRoaXMuYnVmLnB1c2goJz4nKTtcbiAgfVxuXG4gIHByaXZhdGUgZW5kRWxlbWVudChjdXJyZW50OiBFbGVtZW50KSB7XG4gICAgY29uc3QgdGFnTmFtZSA9IGN1cnJlbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoVkFMSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSkgJiYgIVZPSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSkpIHtcbiAgICAgIHRoaXMuYnVmLnB1c2goJzwvJyk7XG4gICAgICB0aGlzLmJ1Zi5wdXNoKHRhZ05hbWUpO1xuICAgICAgdGhpcy5idWYucHVzaCgnPicpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2hhcnMoY2hhcnM6IHN0cmluZykgeyB0aGlzLmJ1Zi5wdXNoKGVuY29kZUVudGl0aWVzKGNoYXJzKSk7IH1cblxuICBjaGVja0Nsb2JiZXJlZEVsZW1lbnQobm9kZTogTm9kZSwgbmV4dE5vZGU6IE5vZGUpOiBOb2RlIHtcbiAgICBpZiAobmV4dE5vZGUgJiZcbiAgICAgICAgKG5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24obmV4dE5vZGUpICZcbiAgICAgICAgIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZKSA9PT3CoE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fQ09OVEFJTkVEX0JZKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEZhaWxlZCB0byBzYW5pdGl6ZSBodG1sIGJlY2F1c2UgdGhlIGVsZW1lbnQgaXMgY2xvYmJlcmVkOiAkeyhub2RlIGFzIEVsZW1lbnQpLm91dGVySFRNTH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIG5leHROb2RlO1xuICB9XG59XG5cbi8vIFJlZ3VsYXIgRXhwcmVzc2lvbnMgZm9yIHBhcnNpbmcgdGFncyBhbmQgYXR0cmlidXRlc1xuY29uc3QgU1VSUk9HQVRFX1BBSVJfUkVHRVhQID0gL1tcXHVEODAwLVxcdURCRkZdW1xcdURDMDAtXFx1REZGRl0vZztcbi8vICEgdG8gfiBpcyB0aGUgQVNDSUkgcmFuZ2UuXG5jb25zdCBOT05fQUxQSEFOVU1FUklDX1JFR0VYUCA9IC8oW15cXCMtfiB8IV0pL2c7XG5cbi8qKlxuICogRXNjYXBlcyBhbGwgcG90ZW50aWFsbHkgZGFuZ2Vyb3VzIGNoYXJhY3RlcnMsIHNvIHRoYXQgdGhlXG4gKiByZXN1bHRpbmcgc3RyaW5nIGNhbiBiZSBzYWZlbHkgaW5zZXJ0ZWQgaW50byBhdHRyaWJ1dGUgb3JcbiAqIGVsZW1lbnQgdGV4dC5cbiAqIEBwYXJhbSB2YWx1ZVxuICovXG5mdW5jdGlvbiBlbmNvZGVFbnRpdGllcyh2YWx1ZTogc3RyaW5nKSB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgICBTVVJST0dBVEVfUEFJUl9SRUdFWFAsXG4gICAgICAgICAgZnVuY3Rpb24obWF0Y2g6IHN0cmluZykge1xuICAgICAgICAgICAgY29uc3QgaGkgPSBtYXRjaC5jaGFyQ29kZUF0KDApO1xuICAgICAgICAgICAgY29uc3QgbG93ID0gbWF0Y2guY2hhckNvZGVBdCgxKTtcbiAgICAgICAgICAgIHJldHVybiAnJiMnICsgKCgoaGkgLSAweEQ4MDApICogMHg0MDApICsgKGxvdyAtIDB4REMwMCkgKyAweDEwMDAwKSArICc7JztcbiAgICAgICAgICB9KVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICAgTk9OX0FMUEhBTlVNRVJJQ19SRUdFWFAsXG4gICAgICAgICAgZnVuY3Rpb24obWF0Y2g6IHN0cmluZykgeyByZXR1cm4gJyYjJyArIG1hdGNoLmNoYXJDb2RlQXQoMCkgKyAnOyc7IH0pXG4gICAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xufVxuXG5sZXQgaW5lcnRCb2R5SGVscGVyOiBJbmVydEJvZHlIZWxwZXI7XG5cbi8qKlxuICogU2FuaXRpemVzIHRoZSBnaXZlbiB1bnNhZmUsIHVudHJ1c3RlZCBIVE1MIGZyYWdtZW50LCBhbmQgcmV0dXJucyBIVE1MIHRleHQgdGhhdCBpcyBzYWZlIHRvIGFkZCB0b1xuICogdGhlIERPTSBpbiBhIGJyb3dzZXIgZW52aXJvbm1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfc2FuaXRpemVIdG1sKGRlZmF1bHREb2M6IGFueSwgdW5zYWZlSHRtbElucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgaW5lcnRCb2R5RWxlbWVudDogSFRNTEVsZW1lbnR8bnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgaW5lcnRCb2R5SGVscGVyID0gaW5lcnRCb2R5SGVscGVyIHx8IG5ldyBJbmVydEJvZHlIZWxwZXIoZGVmYXVsdERvYyk7XG4gICAgLy8gTWFrZSBzdXJlIHVuc2FmZUh0bWwgaXMgYWN0dWFsbHkgYSBzdHJpbmcgKFR5cGVTY3JpcHQgdHlwZXMgYXJlIG5vdCBlbmZvcmNlZCBhdCBydW50aW1lKS5cbiAgICBsZXQgdW5zYWZlSHRtbCA9IHVuc2FmZUh0bWxJbnB1dCA/IFN0cmluZyh1bnNhZmVIdG1sSW5wdXQpIDogJyc7XG4gICAgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUh0bWwpO1xuXG4gICAgLy8gbVhTUyBwcm90ZWN0aW9uLiBSZXBlYXRlZGx5IHBhcnNlIHRoZSBkb2N1bWVudCB0byBtYWtlIHN1cmUgaXQgc3RhYmlsaXplcywgc28gdGhhdCBhIGJyb3dzZXJcbiAgICAvLyB0cnlpbmcgdG8gYXV0by1jb3JyZWN0IGluY29ycmVjdCBIVE1MIGNhbm5vdCBjYXVzZSBmb3JtZXJseSBpbmVydCBIVE1MIHRvIGJlY29tZSBkYW5nZXJvdXMuXG4gICAgbGV0IG1YU1NBdHRlbXB0cyA9IDU7XG4gICAgbGV0IHBhcnNlZEh0bWwgPSB1bnNhZmVIdG1sO1xuXG4gICAgZG8ge1xuICAgICAgaWYgKG1YU1NBdHRlbXB0cyA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBzYW5pdGl6ZSBodG1sIGJlY2F1c2UgdGhlIGlucHV0IGlzIHVuc3RhYmxlJyk7XG4gICAgICB9XG4gICAgICBtWFNTQXR0ZW1wdHMtLTtcblxuICAgICAgdW5zYWZlSHRtbCA9IHBhcnNlZEh0bWw7XG4gICAgICBwYXJzZWRIdG1sID0gaW5lcnRCb2R5RWxlbWVudCAhLmlubmVySFRNTDtcbiAgICAgIGluZXJ0Qm9keUVsZW1lbnQgPSBpbmVydEJvZHlIZWxwZXIuZ2V0SW5lcnRCb2R5RWxlbWVudCh1bnNhZmVIdG1sKTtcbiAgICB9IHdoaWxlICh1bnNhZmVIdG1sICE9PSBwYXJzZWRIdG1sKTtcblxuICAgIGNvbnN0IHNhbml0aXplciA9IG5ldyBTYW5pdGl6aW5nSHRtbFNlcmlhbGl6ZXIoKTtcbiAgICBjb25zdCBzYWZlSHRtbCA9IHNhbml0aXplci5zYW5pdGl6ZUNoaWxkcmVuKFxuICAgICAgICBnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCAhKSBhcyBFbGVtZW50IHx8IGluZXJ0Qm9keUVsZW1lbnQpO1xuICAgIGlmIChpc0Rldk1vZGUoKSAmJiBzYW5pdGl6ZXIuc2FuaXRpemVkU29tZXRoaW5nKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgJ1dBUk5JTkc6IHNhbml0aXppbmcgSFRNTCBzdHJpcHBlZCBzb21lIGNvbnRlbnQgKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpLicpO1xuICAgIH1cblxuICAgIHJldHVybiBzYWZlSHRtbDtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBJbiBjYXNlIGFueXRoaW5nIGdvZXMgd3JvbmcsIGNsZWFyIG91dCBpbmVydEVsZW1lbnQgdG8gcmVzZXQgdGhlIGVudGlyZSBET00gc3RydWN0dXJlLlxuICAgIGlmIChpbmVydEJvZHlFbGVtZW50KSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSBnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCkgfHwgaW5lcnRCb2R5RWxlbWVudDtcbiAgICAgIHdoaWxlIChwYXJlbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQocGFyZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZUNvbnRlbnQoZWw6IE5vZGUpOiBOb2RlfG51bGwge1xuICByZXR1cm4gJ2NvbnRlbnQnIGluIChlbCBhcyBhbnkgLyoqIE1pY3Jvc29mdC9UeXBlU2NyaXB0IzIxNTE3ICovKSAmJiBpc1RlbXBsYXRlRWxlbWVudChlbCkgP1xuICAgICAgZWwuY29udGVudCA6XG4gICAgICBudWxsO1xufVxuZnVuY3Rpb24gaXNUZW1wbGF0ZUVsZW1lbnQoZWw6IE5vZGUpOiBlbCBpcyBIVE1MVGVtcGxhdGVFbGVtZW50IHtcbiAgcmV0dXJuIGVsLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSAmJiBlbC5ub2RlTmFtZSA9PT0gJ1RFTVBMQVRFJztcbn1cbiJdfQ==