/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDevMode } from '../util/is_dev_mode';
/**
 * A pattern that recognizes a commonly useful subset of URLs that are safe.
 *
 * This regular expression matches a subset of URLs that will not cause script
 * execution if used in URL context within a HTML document. Specifically, this
 * regular expression matches if (comment from here on and regex copied from
 * Soy's EscapingConventions):
 * (1) Either an allowed protocol (http, https, mailto or ftp).
 * (2) or no protocol.  A protocol must be followed by a colon. The below
 *     allows that by allowing colons only after one of the characters [/?#].
 *     A colon after a hash (#) must be in the fragment.
 *     Otherwise, a colon after a (?) must be in a query.
 *     Otherwise, a colon after a single solidus (/) must be in a path.
 *     Otherwise, a colon after a double solidus (//) must be in the authority
 *     (before port).
 *
 * The pattern disallows &, used in HTML entity declarations before
 * one of the characters in [/?#]. This disallows HTML entities used in the
 * protocol name, which should never happen, e.g. "h&#116;tp" for "http".
 * It also disallows HTML entities in the first path part of a relative path,
 * e.g. "foo&lt;bar/baz".  Our existing escaping functions should not produce
 * that. More importantly, it disallows masking of a colon,
 * e.g. "javascript&#58;...".
 *
 * This regular expression was taken from the Closure sanitization library.
 */
const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/gi;
/* A pattern that matches safe srcset values */
const SAFE_SRCSET_PATTERN = /^(?:(?:https?|file):|[^&:/?#]*(?:[/?#]|$))/gi;
/** A pattern that matches safe data URLs. Only matches image, video and audio types. */
const DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+\/]+=*$/i;
export function _sanitizeUrl(url) {
    url = String(url);
    if (url.match(SAFE_URL_PATTERN) || url.match(DATA_URL_PATTERN))
        return url;
    if (isDevMode()) {
        console.warn(`WARNING: sanitizing unsafe URL value ${url} (see http://g.co/ng/security#xss)`);
    }
    return 'unsafe:' + url;
}
export function sanitizeSrcset(srcset) {
    srcset = String(srcset);
    return srcset.split(',').map((srcset) => _sanitizeUrl(srcset.trim())).join(', ');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsX3Nhbml0aXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUU5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlCRztBQUNILE1BQU0sZ0JBQWdCLEdBQUcsNkRBQTZELENBQUM7QUFFdkYsK0NBQStDO0FBQy9DLE1BQU0sbUJBQW1CLEdBQUcsOENBQThDLENBQUM7QUFFM0Usd0ZBQXdGO0FBQ3hGLE1BQU0sZ0JBQWdCLEdBQ2xCLHNJQUFzSSxDQUFDO0FBRTNJLE1BQU0sVUFBVSxZQUFZLENBQUMsR0FBVztJQUN0QyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7UUFBRSxPQUFPLEdBQUcsQ0FBQztJQUUzRSxJQUFJLFNBQVMsRUFBRSxFQUFFO1FBQ2YsT0FBTyxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsR0FBRyxvQ0FBb0MsQ0FBQyxDQUFDO0tBQy9GO0lBRUQsT0FBTyxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBQ3pCLENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLE1BQWM7SUFDM0MsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc0Rldk1vZGV9IGZyb20gJy4uL3V0aWwvaXNfZGV2X21vZGUnO1xuXG4vKipcbiAqIEEgcGF0dGVybiB0aGF0IHJlY29nbml6ZXMgYSBjb21tb25seSB1c2VmdWwgc3Vic2V0IG9mIFVSTHMgdGhhdCBhcmUgc2FmZS5cbiAqXG4gKiBUaGlzIHJlZ3VsYXIgZXhwcmVzc2lvbiBtYXRjaGVzIGEgc3Vic2V0IG9mIFVSTHMgdGhhdCB3aWxsIG5vdCBjYXVzZSBzY3JpcHRcbiAqIGV4ZWN1dGlvbiBpZiB1c2VkIGluIFVSTCBjb250ZXh0IHdpdGhpbiBhIEhUTUwgZG9jdW1lbnQuIFNwZWNpZmljYWxseSwgdGhpc1xuICogcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXMgaWYgKGNvbW1lbnQgZnJvbSBoZXJlIG9uIGFuZCByZWdleCBjb3BpZWQgZnJvbVxuICogU295J3MgRXNjYXBpbmdDb252ZW50aW9ucyk6XG4gKiAoMSkgRWl0aGVyIGFuIGFsbG93ZWQgcHJvdG9jb2wgKGh0dHAsIGh0dHBzLCBtYWlsdG8gb3IgZnRwKS5cbiAqICgyKSBvciBubyBwcm90b2NvbC4gIEEgcHJvdG9jb2wgbXVzdCBiZSBmb2xsb3dlZCBieSBhIGNvbG9uLiBUaGUgYmVsb3dcbiAqICAgICBhbGxvd3MgdGhhdCBieSBhbGxvd2luZyBjb2xvbnMgb25seSBhZnRlciBvbmUgb2YgdGhlIGNoYXJhY3RlcnMgWy8/I10uXG4gKiAgICAgQSBjb2xvbiBhZnRlciBhIGhhc2ggKCMpIG11c3QgYmUgaW4gdGhlIGZyYWdtZW50LlxuICogICAgIE90aGVyd2lzZSwgYSBjb2xvbiBhZnRlciBhICg/KSBtdXN0IGJlIGluIGEgcXVlcnkuXG4gKiAgICAgT3RoZXJ3aXNlLCBhIGNvbG9uIGFmdGVyIGEgc2luZ2xlIHNvbGlkdXMgKC8pIG11c3QgYmUgaW4gYSBwYXRoLlxuICogICAgIE90aGVyd2lzZSwgYSBjb2xvbiBhZnRlciBhIGRvdWJsZSBzb2xpZHVzICgvLykgbXVzdCBiZSBpbiB0aGUgYXV0aG9yaXR5XG4gKiAgICAgKGJlZm9yZSBwb3J0KS5cbiAqXG4gKiBUaGUgcGF0dGVybiBkaXNhbGxvd3MgJiwgdXNlZCBpbiBIVE1MIGVudGl0eSBkZWNsYXJhdGlvbnMgYmVmb3JlXG4gKiBvbmUgb2YgdGhlIGNoYXJhY3RlcnMgaW4gWy8/I10uIFRoaXMgZGlzYWxsb3dzIEhUTUwgZW50aXRpZXMgdXNlZCBpbiB0aGVcbiAqIHByb3RvY29sIG5hbWUsIHdoaWNoIHNob3VsZCBuZXZlciBoYXBwZW4sIGUuZy4gXCJoJiMxMTY7dHBcIiBmb3IgXCJodHRwXCIuXG4gKiBJdCBhbHNvIGRpc2FsbG93cyBIVE1MIGVudGl0aWVzIGluIHRoZSBmaXJzdCBwYXRoIHBhcnQgb2YgYSByZWxhdGl2ZSBwYXRoLFxuICogZS5nLiBcImZvbyZsdDtiYXIvYmF6XCIuICBPdXIgZXhpc3RpbmcgZXNjYXBpbmcgZnVuY3Rpb25zIHNob3VsZCBub3QgcHJvZHVjZVxuICogdGhhdC4gTW9yZSBpbXBvcnRhbnRseSwgaXQgZGlzYWxsb3dzIG1hc2tpbmcgb2YgYSBjb2xvbixcbiAqIGUuZy4gXCJqYXZhc2NyaXB0JiM1ODsuLi5cIi5cbiAqXG4gKiBUaGlzIHJlZ3VsYXIgZXhwcmVzc2lvbiB3YXMgdGFrZW4gZnJvbSB0aGUgQ2xvc3VyZSBzYW5pdGl6YXRpb24gbGlicmFyeS5cbiAqL1xuY29uc3QgU0FGRV9VUkxfUEFUVEVSTiA9IC9eKD86KD86aHR0cHM/fG1haWx0b3xmdHB8dGVsfGZpbGUpOnxbXiY6Lz8jXSooPzpbLz8jXXwkKSkvZ2k7XG5cbi8qIEEgcGF0dGVybiB0aGF0IG1hdGNoZXMgc2FmZSBzcmNzZXQgdmFsdWVzICovXG5jb25zdCBTQUZFX1NSQ1NFVF9QQVRURVJOID0gL14oPzooPzpodHRwcz98ZmlsZSk6fFteJjovPyNdKig/OlsvPyNdfCQpKS9naTtcblxuLyoqIEEgcGF0dGVybiB0aGF0IG1hdGNoZXMgc2FmZSBkYXRhIFVSTHMuIE9ubHkgbWF0Y2hlcyBpbWFnZSwgdmlkZW8gYW5kIGF1ZGlvIHR5cGVzLiAqL1xuY29uc3QgREFUQV9VUkxfUEFUVEVSTiA9XG4gICAgL15kYXRhOig/OmltYWdlXFwvKD86Ym1wfGdpZnxqcGVnfGpwZ3xwbmd8dGlmZnx3ZWJwKXx2aWRlb1xcLyg/Om1wZWd8bXA0fG9nZ3x3ZWJtKXxhdWRpb1xcLyg/Om1wM3xvZ2F8b2dnfG9wdXMpKTtiYXNlNjQsW2EtejAtOStcXC9dKz0qJC9pO1xuXG5leHBvcnQgZnVuY3Rpb24gX3Nhbml0aXplVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdXJsID0gU3RyaW5nKHVybCk7XG4gIGlmICh1cmwubWF0Y2goU0FGRV9VUkxfUEFUVEVSTikgfHwgdXJsLm1hdGNoKERBVEFfVVJMX1BBVFRFUk4pKSByZXR1cm4gdXJsO1xuXG4gIGlmIChpc0Rldk1vZGUoKSkge1xuICAgIGNvbnNvbGUud2FybihgV0FSTklORzogc2FuaXRpemluZyB1bnNhZmUgVVJMIHZhbHVlICR7dXJsfSAoc2VlIGh0dHA6Ly9nLmNvL25nL3NlY3VyaXR5I3hzcylgKTtcbiAgfVxuXG4gIHJldHVybiAndW5zYWZlOicgKyB1cmw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZVNyY3NldChzcmNzZXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHNyY3NldCA9IFN0cmluZyhzcmNzZXQpO1xuICByZXR1cm4gc3Jjc2V0LnNwbGl0KCcsJykubWFwKChzcmNzZXQpID0+IF9zYW5pdGl6ZVVybChzcmNzZXQudHJpbSgpKSkuam9pbignLCAnKTtcbn1cbiJdfQ==