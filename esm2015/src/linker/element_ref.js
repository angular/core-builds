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
import { R3_ELEMENT_REF_FACTORY } from '../ivy_switch/runtime/index';
/**
 * A wrapper around a native element inside of a View.
 *
 * An `ElementRef` is backed by a render-specific element. In the browser, this is usually a DOM
 * element.
 *
 * \@security Permitting direct access to the DOM can make your application more vulnerable to
 * XSS attacks. Carefully review any use of `ElementRef` in your code. For more detail, see the
 * [Security Guide](http://g.co/ng/security).
 *
 *
 * @template T
 */
export class ElementRef {
    /**
     * @param {?} nativeElement
     */
    constructor(nativeElement) { this.nativeElement = nativeElement; }
}
/**
 * \@internal
 */
ElementRef.__NG_ELEMENT_ID__ = () => R3_ELEMENT_REF_FACTORY(ElementRef);
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    ElementRef.__NG_ELEMENT_ID__;
    /**
     * The underlying native element or `null` if direct access to native elements is not supported
     * (e.g. when the application runs in a web worker).
     *
     * <div class="callout is-critical">
     *   <header>Use with caution</header>
     *   <p>
     *    Use this API as the last resort when direct access to DOM is needed. Use templating and
     *    data-binding provided by Angular instead. Alternatively you can take a look at {\@link
     * Renderer2}
     *    which provides API that can safely be used even when direct access to native elements is not
     *    supported.
     *   </p>
     *   <p>
     *    Relying on direct DOM access creates tight coupling between your application and rendering
     *    layers which will make it impossible to separate the two and deploy your application into a
     *    web worker.
     *   </p>
     * </div>
     *
     * @type {?}
     */
    ElementRef.prototype.nativeElement;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvZWxlbWVudF9yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFpQm5FLE1BQU0sT0FBTyxVQUFVOzs7O0lBd0JyQixZQUFZLGFBQWdCLElBQUksSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUMsRUFBRTs7Ozs7K0JBR3hCLEdBQUcsRUFBRSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM19FTEVNRU5UX1JFRl9GQUNUT1JZfSBmcm9tICcuLi9pdnlfc3dpdGNoL3J1bnRpbWUvaW5kZXgnO1xuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgYSBuYXRpdmUgZWxlbWVudCBpbnNpZGUgb2YgYSBWaWV3LlxuICpcbiAqIEFuIGBFbGVtZW50UmVmYCBpcyBiYWNrZWQgYnkgYSByZW5kZXItc3BlY2lmaWMgZWxlbWVudC4gSW4gdGhlIGJyb3dzZXIsIHRoaXMgaXMgdXN1YWxseSBhIERPTVxuICogZWxlbWVudC5cbiAqXG4gKiBAc2VjdXJpdHkgUGVybWl0dGluZyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBET00gY2FuIG1ha2UgeW91ciBhcHBsaWNhdGlvbiBtb3JlIHZ1bG5lcmFibGUgdG9cbiAqIFhTUyBhdHRhY2tzLiBDYXJlZnVsbHkgcmV2aWV3IGFueSB1c2Ugb2YgYEVsZW1lbnRSZWZgIGluIHlvdXIgY29kZS4gRm9yIG1vcmUgZGV0YWlsLCBzZWUgdGhlXG4gKiBbU2VjdXJpdHkgR3VpZGVdKGh0dHA6Ly9nLmNvL25nL3NlY3VyaXR5KS5cbiAqXG4gKlxuICovXG4vLyBOb3RlOiBXZSBkb24ndCBleHBvc2UgdGhpbmdzIGxpa2UgYEluamVjdG9yYCwgYFZpZXdDb250YWluZXJgLCAuLi4gaGVyZSxcbi8vIGkuZS4gdXNlcnMgaGF2ZSB0byBhc2sgZm9yIHdoYXQgdGhleSBuZWVkLiBXaXRoIHRoYXQsIHdlIGNhbiBidWlsZCBiZXR0ZXIgYW5hbHlzaXMgdG9vbHNcbi8vIGFuZCBjb3VsZCBkbyBiZXR0ZXIgY29kZWdlbiBpbiB0aGUgZnV0dXJlLlxuZXhwb3J0IGNsYXNzIEVsZW1lbnRSZWY8VCA9IGFueT4ge1xuICAvKipcbiAgICogVGhlIHVuZGVybHlpbmcgbmF0aXZlIGVsZW1lbnQgb3IgYG51bGxgIGlmIGRpcmVjdCBhY2Nlc3MgdG8gbmF0aXZlIGVsZW1lbnRzIGlzIG5vdCBzdXBwb3J0ZWRcbiAgICogKGUuZy4gd2hlbiB0aGUgYXBwbGljYXRpb24gcnVucyBpbiBhIHdlYiB3b3JrZXIpLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiY2FsbG91dCBpcy1jcml0aWNhbFwiPlxuICAgKiAgIDxoZWFkZXI+VXNlIHdpdGggY2F1dGlvbjwvaGVhZGVyPlxuICAgKiAgIDxwPlxuICAgKiAgICBVc2UgdGhpcyBBUEkgYXMgdGhlIGxhc3QgcmVzb3J0IHdoZW4gZGlyZWN0IGFjY2VzcyB0byBET00gaXMgbmVlZGVkLiBVc2UgdGVtcGxhdGluZyBhbmRcbiAgICogICAgZGF0YS1iaW5kaW5nIHByb3ZpZGVkIGJ5IEFuZ3VsYXIgaW5zdGVhZC4gQWx0ZXJuYXRpdmVseSB5b3UgY2FuIHRha2UgYSBsb29rIGF0IHtAbGlua1xuICAgKiBSZW5kZXJlcjJ9XG4gICAqICAgIHdoaWNoIHByb3ZpZGVzIEFQSSB0aGF0IGNhbiBzYWZlbHkgYmUgdXNlZCBldmVuIHdoZW4gZGlyZWN0IGFjY2VzcyB0byBuYXRpdmUgZWxlbWVudHMgaXMgbm90XG4gICAqICAgIHN1cHBvcnRlZC5cbiAgICogICA8L3A+XG4gICAqICAgPHA+XG4gICAqICAgIFJlbHlpbmcgb24gZGlyZWN0IERPTSBhY2Nlc3MgY3JlYXRlcyB0aWdodCBjb3VwbGluZyBiZXR3ZWVuIHlvdXIgYXBwbGljYXRpb24gYW5kIHJlbmRlcmluZ1xuICAgKiAgICBsYXllcnMgd2hpY2ggd2lsbCBtYWtlIGl0IGltcG9zc2libGUgdG8gc2VwYXJhdGUgdGhlIHR3byBhbmQgZGVwbG95IHlvdXIgYXBwbGljYXRpb24gaW50byBhXG4gICAqICAgIHdlYiB3b3JrZXIuXG4gICAqICAgPC9wPlxuICAgKiA8L2Rpdj5cbiAgICpcbiAgICovXG4gIHB1YmxpYyBuYXRpdmVFbGVtZW50OiBUO1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZUVsZW1lbnQ6IFQpIHsgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlRWxlbWVudDsgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fOiAoKSA9PiBFbGVtZW50UmVmID0gKCkgPT4gUjNfRUxFTUVOVF9SRUZfRkFDVE9SWShFbGVtZW50UmVmKTtcbn1cbiJdfQ==