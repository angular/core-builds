/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { IMAGE_CONFIG, PLATFORM_ID } from './application/application_tokens';
import { Injectable } from './di';
import { inject } from './di/injector_compatibility';
import { formatRuntimeError } from './errors';
import { getDocument } from './render3/interfaces/document';
import * as i0 from "./r3_symbols";
// A delay in milliseconds before the scan is run after onLoad, to avoid any
// potential race conditions with other LCP-related functions. This delay
// happens outside of the main JavaScript execution and will only effect the timing
// on when the warning becomes visible in the console.
const SCAN_DELAY = 200;
const OVERSIZED_IMAGE_TOLERANCE = 1200;
export class ImagePerformanceWarning {
    constructor() {
        // Map of full image URLs -> original `ngSrc` values.
        this.window = null;
        this.observer = null;
        this.options = inject(IMAGE_CONFIG);
        this.isBrowser = inject(PLATFORM_ID) === 'browser';
    }
    start() {
        if (!this.isBrowser ||
            typeof PerformanceObserver === 'undefined' ||
            (this.options?.disableImageSizeWarning && this.options?.disableImageLazyLoadWarning)) {
            return;
        }
        this.observer = this.initPerformanceObserver();
        const doc = getDocument();
        const win = doc.defaultView;
        if (typeof win !== 'undefined') {
            this.window = win;
            // Wait to avoid race conditions where LCP image triggers
            // load event before it's recorded by the performance observer
            const waitToScan = () => {
                setTimeout(this.scanImages.bind(this), SCAN_DELAY);
            };
            const setup = () => {
                // Consider the case when the application is created and destroyed multiple times.
                // Typically, applications are created instantly once the page is loaded, and the
                // `window.load` listener is always triggered. However, the `window.load` event will never
                // be fired if the page is loaded, and the application is created later. Checking for
                // `readyState` is the easiest way to determine whether the page has been loaded or not.
                if (doc.readyState === 'complete') {
                    waitToScan();
                }
                else {
                    this.window?.addEventListener('load', waitToScan, { once: true });
                }
            };
            // Angular doesn't have to run change detection whenever any asynchronous tasks are invoked in
            // the scope of this functionality.
            if (typeof Zone !== 'undefined') {
                Zone.root.run(() => setup());
            }
            else {
                setup();
            }
        }
    }
    ngOnDestroy() {
        this.observer?.disconnect();
    }
    initPerformanceObserver() {
        if (typeof PerformanceObserver === 'undefined') {
            return null;
        }
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length === 0)
                return;
            // We use the latest entry produced by the `PerformanceObserver` as the best
            // signal on which element is actually an LCP one. As an example, the first image to load on
            // a page, by virtue of being the only thing on the page so far, is often a LCP candidate
            // and gets reported by PerformanceObserver, but isn't necessarily the LCP element.
            const lcpElement = entries[entries.length - 1];
            // Cast to `any` due to missing `element` on the `LargestContentfulPaint` type of entry.
            // See https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint
            const imgSrc = lcpElement.element?.src ?? '';
            // Exclude `data:` and `blob:` URLs, since they are fetched resources.
            if (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:'))
                return;
            this.lcpImageUrl = imgSrc;
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        return observer;
    }
    scanImages() {
        const images = getDocument().querySelectorAll('img');
        let lcpElementFound, lcpElementLoadedCorrectly = false;
        images.forEach((image) => {
            if (!this.options?.disableImageSizeWarning) {
                for (const image of images) {
                    // Image elements using the NgOptimizedImage directive are excluded,
                    // as that directive has its own version of this check.
                    if (!image.getAttribute('ng-img') && this.isOversized(image)) {
                        logOversizedImageWarning(image.src);
                    }
                }
            }
            if (!this.options?.disableImageLazyLoadWarning && this.lcpImageUrl) {
                if (image.src === this.lcpImageUrl) {
                    lcpElementFound = true;
                    if (image.loading !== 'lazy' || image.getAttribute('ng-img')) {
                        // This variable is set to true and never goes back to false to account
                        // for the case where multiple images have the same src url, and some
                        // have lazy loading while others don't.
                        // Also ignore NgOptimizedImage because there's a different warning for that.
                        lcpElementLoadedCorrectly = true;
                    }
                }
            }
        });
        if (lcpElementFound &&
            !lcpElementLoadedCorrectly &&
            this.lcpImageUrl &&
            !this.options?.disableImageLazyLoadWarning) {
            logLazyLCPWarning(this.lcpImageUrl);
        }
    }
    isOversized(image) {
        if (!this.window) {
            return false;
        }
        const computedStyle = this.window.getComputedStyle(image);
        let renderedWidth = parseFloat(computedStyle.getPropertyValue('width'));
        let renderedHeight = parseFloat(computedStyle.getPropertyValue('height'));
        const boxSizing = computedStyle.getPropertyValue('box-sizing');
        const objectFit = computedStyle.getPropertyValue('object-fit');
        if (objectFit === `cover`) {
            // Object fit cover may indicate a use case such as a sprite sheet where
            // this warning does not apply.
            return false;
        }
        if (boxSizing === 'border-box') {
            const paddingTop = computedStyle.getPropertyValue('padding-top');
            const paddingRight = computedStyle.getPropertyValue('padding-right');
            const paddingBottom = computedStyle.getPropertyValue('padding-bottom');
            const paddingLeft = computedStyle.getPropertyValue('padding-left');
            renderedWidth -= parseFloat(paddingRight) + parseFloat(paddingLeft);
            renderedHeight -= parseFloat(paddingTop) + parseFloat(paddingBottom);
        }
        const intrinsicWidth = image.naturalWidth;
        const intrinsicHeight = image.naturalHeight;
        const recommendedWidth = this.window.devicePixelRatio * renderedWidth;
        const recommendedHeight = this.window.devicePixelRatio * renderedHeight;
        const oversizedWidth = intrinsicWidth - recommendedWidth >= OVERSIZED_IMAGE_TOLERANCE;
        const oversizedHeight = intrinsicHeight - recommendedHeight >= OVERSIZED_IMAGE_TOLERANCE;
        return oversizedWidth || oversizedHeight;
    }
    static { this.ɵfac = function ImagePerformanceWarning_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ImagePerformanceWarning)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ImagePerformanceWarning, factory: ImagePerformanceWarning.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ImagePerformanceWarning, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
function logLazyLCPWarning(src) {
    console.warn(formatRuntimeError(-913 /* RuntimeErrorCode.IMAGE_PERFORMANCE_WARNING */, `An image with src ${src} is the Largest Contentful Paint (LCP) element ` +
        `but was given a "loading" value of "lazy", which can negatively impact ` +
        `application loading performance. This warning can be addressed by ` +
        `changing the loading value of the LCP image to "eager", or by using the ` +
        `NgOptimizedImage directive's prioritization utilities. For more ` +
        `information about addressing or disabling this warning, see ` +
        `https://angular.dev/errors/NG0913`));
}
function logOversizedImageWarning(src) {
    console.warn(formatRuntimeError(-913 /* RuntimeErrorCode.IMAGE_PERFORMANCE_WARNING */, `An image with src ${src} has intrinsic file dimensions much larger than its ` +
        `rendered size. This can negatively impact application loading performance. ` +
        `For more information about addressing or disabling this warning, see ` +
        `https://angular.dev/errors/NG0913`));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VfcGVyZm9ybWFuY2Vfd2FybmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2ltYWdlX3BlcmZvcm1hbmNlX3dhcm5pbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBZSxXQUFXLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUN4RixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2hDLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsa0JBQWtCLEVBQW1CLE1BQU0sVUFBVSxDQUFDO0FBRTlELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQzs7QUFFMUQsNEVBQTRFO0FBQzVFLHlFQUF5RTtBQUN6RSxtRkFBbUY7QUFDbkYsc0RBQXNEO0FBQ3RELE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUV2QixNQUFNLHlCQUF5QixHQUFHLElBQUksQ0FBQztBQUd2QyxNQUFNLE9BQU8sdUJBQXVCO0lBRHBDO1FBRUUscURBQXFEO1FBQzdDLFdBQU0sR0FBa0IsSUFBSSxDQUFDO1FBQzdCLGFBQVEsR0FBK0IsSUFBSSxDQUFDO1FBQzVDLFlBQU8sR0FBZ0IsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLGNBQVMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxDQUFDO0tBK0loRTtJQTVJUSxLQUFLO1FBQ1YsSUFDRSxDQUFDLElBQUksQ0FBQyxTQUFTO1lBQ2YsT0FBTyxtQkFBbUIsS0FBSyxXQUFXO1lBQzFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSx1QkFBdUIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLDJCQUEyQixDQUFDLEVBQ3BGLENBQUM7WUFDRCxPQUFPO1FBQ1QsQ0FBQztRQUNELElB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QVksQ0FBQztRQUMxQyxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO1FBRTVDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxhQUFhLENBQUM7UUFDdEUsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLGNBQWMsQ0FBQztRQUN4RSxNQUFNLGNBQWMsR0FBRyxjQUFjLEdBQUcsZ0JBQWdCLElBQUkseUJBQXlCLENBQUM7UUFDdEYsTUFBTSxlQUFlLEdBQUcsZUFBZSxHQUFHLGlCQUFpQixJQUFJLHlCQUF5QixDQUFDO1FBQ3pGLE9BQU8sY0FBYyxJQUFJLGVBQWUsQ0FBQztJQUMzQyxDQUFDO3dIQW5KVSx1QkFBdUI7dUVBQXZCLHVCQUF1QixXQUF2Qix1QkFBdUIsbUJBRFgsTUFBTTs7Z0ZBQ2xCLHVCQUF1QjtjQURuQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQXVKaEMsU0FBUyxpQkFBaUIsQ0FBQyxHQUFXO0lBQ3BDLE9BQU8sQ0FBQyxJQUFJLENBQ1Ysa0JBQWtCLHdEQUVoQixxQkFBcUIsR0FBRyxpREFBaUQ7UUFDdkUseUVBQXlFO1FBQ3pFLG9FQUFvRTtRQUNwRSwwRUFBMEU7UUFDMUUsa0VBQWtFO1FBQ2xFLDhEQUE4RDtRQUM5RCxtQ0FBbUMsQ0FDdEMsQ0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQUMsR0FBVztJQUMzQyxPQUFPLENBQUMsSUFBSSxDQUNWLGtCQUFrQix3REFFaEIscUJBQXFCLEdBQUcsc0RBQXNEO1FBQzVFLDZFQUE2RTtRQUM3RSx1RUFBdUU7UUFDdkUsbUNBQW1DLENBQ3RDLENBQ0YsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJTUFHRV9DT05GSUcsIEltYWdlQ29uZmlnLCBQTEFURk9STV9JRH0gZnJvbSAnLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7T25EZXN0cm95fSBmcm9tICcuL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtnZXREb2N1bWVudH0gZnJvbSAnLi9yZW5kZXIzL2ludGVyZmFjZXMvZG9jdW1lbnQnO1xuXG4vLyBBIGRlbGF5IGluIG1pbGxpc2Vjb25kcyBiZWZvcmUgdGhlIHNjYW4gaXMgcnVuIGFmdGVyIG9uTG9hZCwgdG8gYXZvaWQgYW55XG4vLyBwb3RlbnRpYWwgcmFjZSBjb25kaXRpb25zIHdpdGggb3RoZXIgTENQLXJlbGF0ZWQgZnVuY3Rpb25zLiBUaGlzIGRlbGF5XG4vLyBoYXBwZW5zIG91dHNpZGUgb2YgdGhlIG1haW4gSmF2YVNjcmlwdCBleGVjdXRpb24gYW5kIHdpbGwgb25seSBlZmZlY3QgdGhlIHRpbWluZ1xuLy8gb24gd2hlbiB0aGUgd2FybmluZyBiZWNvbWVzIHZpc2libGUgaW4gdGhlIGNvbnNvbGUuXG5jb25zdCBTQ0FOX0RFTEFZID0gMjAwO1xuXG5jb25zdCBPVkVSU0laRURfSU1BR0VfVE9MRVJBTkNFID0gMTIwMDtcblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgSW1hZ2VQZXJmb3JtYW5jZVdhcm5pbmcgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvLyBNYXAgb2YgZnVsbCBpbWFnZSBVUkxzIC0+IG9yaWdpbmFsIGBuZ1NyY2AgdmFsdWVzLlxuICBwcml2YXRlIHdpbmRvdzogV2luZG93IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgb2JzZXJ2ZXI6IFBlcmZvcm1hbmNlT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBvcHRpb25zOiBJbWFnZUNvbmZpZyA9IGluamVjdChJTUFHRV9DT05GSUcpO1xuICBwcml2YXRlIHJlYWRvbmx5IGlzQnJvd3NlciA9IGluamVjdChQTEFURk9STV9JRCkgPT09ICdicm93c2VyJztcbiAgcHJpdmF0ZSBsY3BJbWFnZVVybD86IHN0cmluZztcblxuICBwdWJsaWMgc3RhcnQoKSB7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuaXNCcm93c2VyIHx8XG4gICAgICB0eXBlb2YgUGVyZm9ybWFuY2VPYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICh0aGlzLm9wdGlvbnM/LmRpc2FibGVJbWFnZVNpemVXYXJuaW5nICYmIHRoaXMub3B0aW9ucz8uZGlzYWJsZUltYWdlTGF6eUxvYWRXYXJuaW5nKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm9ic2VydmVyID0gdGhpcy5pbml0UGVyZm9ybWFuY2VPYnNlcnZlcigpO1xuICAgIGNvbnN0IGRvYyA9IGdldERvY3VtZW50KCk7XG4gICAgY29uc3Qgd2luID0gZG9jLmRlZmF1bHRWaWV3O1xuICAgIGlmICh0eXBlb2Ygd2luICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy53aW5kb3cgPSB3aW47XG4gICAgICAvLyBXYWl0IHRvIGF2b2lkIHJhY2UgY29uZGl0aW9ucyB3aGVyZSBMQ1AgaW1hZ2UgdHJpZ2dlcnNcbiAgICAgIC8vIGxvYWQgZXZlbnQgYmVmb3JlIGl0J3MgcmVjb3JkZWQgYnkgdGhlIHBlcmZvcm1hbmNlIG9ic2VydmVyXG4gICAgICBjb25zdCB3YWl0VG9TY2FuID0gKCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KHRoaXMuc2NhbkltYWdlcy5iaW5kKHRoaXMpLCBTQ0FOX0RFTEFZKTtcbiAgICAgIH07XG4gICAgICBjb25zdCBzZXR1cCA9ICgpID0+IHtcbiAgICAgICAgLy8gQ29uc2lkZXIgdGhlIGNhc2Ugd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgY3JlYXRlZCBhbmQgZGVzdHJveWVkIG11bHRpcGxlIHRpbWVzLlxuICAgICAgICAvLyBUeXBpY2FsbHksIGFwcGxpY2F0aW9ucyBhcmUgY3JlYXRlZCBpbnN0YW50bHkgb25jZSB0aGUgcGFnZSBpcyBsb2FkZWQsIGFuZCB0aGVcbiAgICAgICAgLy8gYHdpbmRvdy5sb2FkYCBsaXN0ZW5lciBpcyBhbHdheXMgdHJpZ2dlcmVkLiBIb3dldmVyLCB0aGUgYHdpbmRvdy5sb2FkYCBldmVudCB3aWxsIG5ldmVyXG4gICAgICAgIC8vIGJlIGZpcmVkIGlmIHRoZSBwYWdlIGlzIGxvYWRlZCwgYW5kIHRoZSBhcHBsaWNhdGlvbiBpcyBjcmVhdGVkIGxhdGVyLiBDaGVja2luZyBmb3JcbiAgICAgICAgLy8gYHJlYWR5U3RhdGVgIGlzIHRoZSBlYXNpZXN0IHdheSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgcGFnZSBoYXMgYmVlbiBsb2FkZWQgb3Igbm90LlxuICAgICAgICBpZiAoZG9jLnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgICAgICB3YWl0VG9TY2FuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy53aW5kb3c/LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB3YWl0VG9TY2FuLCB7b25jZTogdHJ1ZX0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgLy8gQW5ndWxhciBkb2Vzbid0IGhhdmUgdG8gcnVuIGNoYW5nZSBkZXRlY3Rpb24gd2hlbmV2ZXIgYW55IGFzeW5jaHJvbm91cyB0YXNrcyBhcmUgaW52b2tlZCBpblxuICAgICAgLy8gdGhlIHNjb3BlIG9mIHRoaXMgZnVuY3Rpb25hbGl0eS5cbiAgICAgIGlmICh0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgWm9uZS5yb290LnJ1bigoKSA9PiBzZXR1cCgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldHVwKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5vYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBpbml0UGVyZm9ybWFuY2VPYnNlcnZlcigpOiBQZXJmb3JtYW5jZU9ic2VydmVyIHwgbnVsbCB7XG4gICAgaWYgKHR5cGVvZiBQZXJmb3JtYW5jZU9ic2VydmVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IFBlcmZvcm1hbmNlT2JzZXJ2ZXIoKGVudHJ5TGlzdCkgPT4ge1xuICAgICAgY29uc3QgZW50cmllcyA9IGVudHJ5TGlzdC5nZXRFbnRyaWVzKCk7XG4gICAgICBpZiAoZW50cmllcy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICAgIC8vIFdlIHVzZSB0aGUgbGF0ZXN0IGVudHJ5IHByb2R1Y2VkIGJ5IHRoZSBgUGVyZm9ybWFuY2VPYnNlcnZlcmAgYXMgdGhlIGJlc3RcbiAgICAgIC8vIHNpZ25hbCBvbiB3aGljaCBlbGVtZW50IGlzIGFjdHVhbGx5IGFuIExDUCBvbmUuIEFzIGFuIGV4YW1wbGUsIHRoZSBmaXJzdCBpbWFnZSB0byBsb2FkIG9uXG4gICAgICAvLyBhIHBhZ2UsIGJ5IHZpcnR1ZSBvZiBiZWluZyB0aGUgb25seSB0aGluZyBvbiB0aGUgcGFnZSBzbyBmYXIsIGlzIG9mdGVuIGEgTENQIGNhbmRpZGF0ZVxuICAgICAgLy8gYW5kIGdldHMgcmVwb3J0ZWQgYnkgUGVyZm9ybWFuY2VPYnNlcnZlciwgYnV0IGlzbid0IG5lY2Vzc2FyaWx5IHRoZSBMQ1AgZWxlbWVudC5cbiAgICAgIGNvbnN0IGxjcEVsZW1lbnQgPSBlbnRyaWVzW2VudHJpZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgIC8vIENhc3QgdG8gYGFueWAgZHVlIHRvIG1pc3NpbmcgYGVsZW1lbnRgIG9uIHRoZSBgTGFyZ2VzdENvbnRlbnRmdWxQYWludGAgdHlwZSBvZiBlbnRyeS5cbiAgICAgIC8vIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTGFyZ2VzdENvbnRlbnRmdWxQYWludFxuICAgICAgY29uc3QgaW1nU3JjID0gKGxjcEVsZW1lbnQgYXMgYW55KS5lbGVtZW50Py5zcmMgPz8gJyc7XG5cbiAgICAgIC8vIEV4Y2x1ZGUgYGRhdGE6YCBhbmQgYGJsb2I6YCBVUkxzLCBzaW5jZSB0aGV5IGFyZSBmZXRjaGVkIHJlc291cmNlcy5cbiAgICAgIGlmIChpbWdTcmMuc3RhcnRzV2l0aCgnZGF0YTonKSB8fCBpbWdTcmMuc3RhcnRzV2l0aCgnYmxvYjonKSkgcmV0dXJuO1xuICAgICAgdGhpcy5sY3BJbWFnZVVybCA9IGltZ1NyYztcbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKHt0eXBlOiAnbGFyZ2VzdC1jb250ZW50ZnVsLXBhaW50JywgYnVmZmVyZWQ6IHRydWV9KTtcbiAgICByZXR1cm4gb2JzZXJ2ZXI7XG4gIH1cblxuICBwcml2YXRlIHNjYW5JbWFnZXMoKTogdm9pZCB7XG4gICAgY29uc3QgaW1hZ2VzID0gZ2V0RG9jdW1lbnQoKS5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKTtcbiAgICBsZXQgbGNwRWxlbWVudEZvdW5kLFxuICAgICAgbGNwRWxlbWVudExvYWRlZENvcnJlY3RseSA9IGZhbHNlO1xuICAgIGltYWdlcy5mb3JFYWNoKChpbWFnZSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnM/LmRpc2FibGVJbWFnZVNpemVXYXJuaW5nKSB7XG4gICAgICAgIGZvciAoY29uc3QgaW1hZ2Ugb2YgaW1hZ2VzKSB7XG4gICAgICAgICAgLy8gSW1hZ2UgZWxlbWVudHMgdXNpbmcgdGhlIE5nT3B0aW1pemVkSW1hZ2UgZGlyZWN0aXZlIGFyZSBleGNsdWRlZCxcbiAgICAgICAgICAvLyBhcyB0aGF0IGRpcmVjdGl2ZSBoYXMgaXRzIG93biB2ZXJzaW9uIG9mIHRoaXMgY2hlY2suXG4gICAgICAgICAgaWYgKCFpbWFnZS5nZXRBdHRyaWJ1dGUoJ25nLWltZycpICYmIHRoaXMuaXNPdmVyc2l6ZWQoaW1hZ2UpKSB7XG4gICAgICAgICAgICBsb2dPdmVyc2l6ZWRJbWFnZVdhcm5pbmcoaW1hZ2Uuc3JjKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5vcHRpb25zPy5kaXNhYmxlSW1hZ2VMYXp5TG9hZFdhcm5pbmcgJiYgdGhpcy5sY3BJbWFnZVVybCkge1xuICAgICAgICBpZiAoaW1hZ2Uuc3JjID09PSB0aGlzLmxjcEltYWdlVXJsKSB7XG4gICAgICAgICAgbGNwRWxlbWVudEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoaW1hZ2UubG9hZGluZyAhPT0gJ2xhenknIHx8IGltYWdlLmdldEF0dHJpYnV0ZSgnbmctaW1nJykpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgdmFyaWFibGUgaXMgc2V0IHRvIHRydWUgYW5kIG5ldmVyIGdvZXMgYmFjayB0byBmYWxzZSB0byBhY2NvdW50XG4gICAgICAgICAgICAvLyBmb3IgdGhlIGNhc2Ugd2hlcmUgbXVsdGlwbGUgaW1hZ2VzIGhhdmUgdGhlIHNhbWUgc3JjIHVybCwgYW5kIHNvbWVcbiAgICAgICAgICAgIC8vIGhhdmUgbGF6eSBsb2FkaW5nIHdoaWxlIG90aGVycyBkb24ndC5cbiAgICAgICAgICAgIC8vIEFsc28gaWdub3JlIE5nT3B0aW1pemVkSW1hZ2UgYmVjYXVzZSB0aGVyZSdzIGEgZGlmZmVyZW50IHdhcm5pbmcgZm9yIHRoYXQuXG4gICAgICAgICAgICBsY3BFbGVtZW50TG9hZGVkQ29ycmVjdGx5ID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoXG4gICAgICBsY3BFbGVtZW50Rm91bmQgJiZcbiAgICAgICFsY3BFbGVtZW50TG9hZGVkQ29ycmVjdGx5ICYmXG4gICAgICB0aGlzLmxjcEltYWdlVXJsICYmXG4gICAgICAhdGhpcy5vcHRpb25zPy5kaXNhYmxlSW1hZ2VMYXp5TG9hZFdhcm5pbmdcbiAgICApIHtcbiAgICAgIGxvZ0xhenlMQ1BXYXJuaW5nKHRoaXMubGNwSW1hZ2VVcmwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNPdmVyc2l6ZWQoaW1hZ2U6IEhUTUxJbWFnZUVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMud2luZG93KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGNvbXB1dGVkU3R5bGUgPSB0aGlzLndpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGltYWdlKTtcbiAgICBsZXQgcmVuZGVyZWRXaWR0aCA9IHBhcnNlRmxvYXQoY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpKTtcbiAgICBsZXQgcmVuZGVyZWRIZWlnaHQgPSBwYXJzZUZsb2F0KGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JykpO1xuICAgIGNvbnN0IGJveFNpemluZyA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm94LXNpemluZycpO1xuICAgIGNvbnN0IG9iamVjdEZpdCA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnb2JqZWN0LWZpdCcpO1xuXG4gICAgaWYgKG9iamVjdEZpdCA9PT0gYGNvdmVyYCkge1xuICAgICAgLy8gT2JqZWN0IGZpdCBjb3ZlciBtYXkgaW5kaWNhdGUgYSB1c2UgY2FzZSBzdWNoIGFzIGEgc3ByaXRlIHNoZWV0IHdoZXJlXG4gICAgICAvLyB0aGlzIHdhcm5pbmcgZG9lcyBub3QgYXBwbHkuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnKSB7XG4gICAgICBjb25zdCBwYWRkaW5nVG9wID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXRvcCcpO1xuICAgICAgY29uc3QgcGFkZGluZ1JpZ2h0ID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXJpZ2h0Jyk7XG4gICAgICBjb25zdCBwYWRkaW5nQm90dG9tID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWJvdHRvbScpO1xuICAgICAgY29uc3QgcGFkZGluZ0xlZnQgPSBjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctbGVmdCcpO1xuICAgICAgcmVuZGVyZWRXaWR0aCAtPSBwYXJzZUZsb2F0KHBhZGRpbmdSaWdodCkgKyBwYXJzZUZsb2F0KHBhZGRpbmdMZWZ0KTtcbiAgICAgIHJlbmRlcmVkSGVpZ2h0IC09IHBhcnNlRmxvYXQocGFkZGluZ1RvcCkgKyBwYXJzZUZsb2F0KHBhZGRpbmdCb3R0b20pO1xuICAgIH1cblxuICAgIGNvbnN0IGludHJpbnNpY1dpZHRoID0gaW1hZ2UubmF0dXJhbFdpZHRoO1xuICAgIGNvbnN0IGludHJpbnNpY0hlaWdodCA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG5cbiAgICBjb25zdCByZWNvbW1lbmRlZFdpZHRoID0gdGhpcy53aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyAqIHJlbmRlcmVkV2lkdGg7XG4gICAgY29uc3QgcmVjb21tZW5kZWRIZWlnaHQgPSB0aGlzLndpbmRvdy5kZXZpY2VQaXhlbFJhdGlvICogcmVuZGVyZWRIZWlnaHQ7XG4gICAgY29uc3Qgb3ZlcnNpemVkV2lkdGggPSBpbnRyaW5zaWNXaWR0aCAtIHJlY29tbWVuZGVkV2lkdGggPj0gT1ZFUlNJWkVEX0lNQUdFX1RPTEVSQU5DRTtcbiAgICBjb25zdCBvdmVyc2l6ZWRIZWlnaHQgPSBpbnRyaW5zaWNIZWlnaHQgLSByZWNvbW1lbmRlZEhlaWdodCA+PSBPVkVSU0laRURfSU1BR0VfVE9MRVJBTkNFO1xuICAgIHJldHVybiBvdmVyc2l6ZWRXaWR0aCB8fCBvdmVyc2l6ZWRIZWlnaHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbG9nTGF6eUxDUFdhcm5pbmcoc3JjOiBzdHJpbmcpIHtcbiAgY29uc29sZS53YXJuKFxuICAgIGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU1BR0VfUEVSRk9STUFOQ0VfV0FSTklORyxcbiAgICAgIGBBbiBpbWFnZSB3aXRoIHNyYyAke3NyY30gaXMgdGhlIExhcmdlc3QgQ29udGVudGZ1bCBQYWludCAoTENQKSBlbGVtZW50IGAgK1xuICAgICAgICBgYnV0IHdhcyBnaXZlbiBhIFwibG9hZGluZ1wiIHZhbHVlIG9mIFwibGF6eVwiLCB3aGljaCBjYW4gbmVnYXRpdmVseSBpbXBhY3QgYCArXG4gICAgICAgIGBhcHBsaWNhdGlvbiBsb2FkaW5nIHBlcmZvcm1hbmNlLiBUaGlzIHdhcm5pbmcgY2FuIGJlIGFkZHJlc3NlZCBieSBgICtcbiAgICAgICAgYGNoYW5naW5nIHRoZSBsb2FkaW5nIHZhbHVlIG9mIHRoZSBMQ1AgaW1hZ2UgdG8gXCJlYWdlclwiLCBvciBieSB1c2luZyB0aGUgYCArXG4gICAgICAgIGBOZ09wdGltaXplZEltYWdlIGRpcmVjdGl2ZSdzIHByaW9yaXRpemF0aW9uIHV0aWxpdGllcy4gRm9yIG1vcmUgYCArXG4gICAgICAgIGBpbmZvcm1hdGlvbiBhYm91dCBhZGRyZXNzaW5nIG9yIGRpc2FibGluZyB0aGlzIHdhcm5pbmcsIHNlZSBgICtcbiAgICAgICAgYGh0dHBzOi8vYW5ndWxhci5kZXYvZXJyb3JzL05HMDkxM2AsXG4gICAgKSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9nT3ZlcnNpemVkSW1hZ2VXYXJuaW5nKHNyYzogc3RyaW5nKSB7XG4gIGNvbnNvbGUud2FybihcbiAgICBmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLklNQUdFX1BFUkZPUk1BTkNFX1dBUk5JTkcsXG4gICAgICBgQW4gaW1hZ2Ugd2l0aCBzcmMgJHtzcmN9IGhhcyBpbnRyaW5zaWMgZmlsZSBkaW1lbnNpb25zIG11Y2ggbGFyZ2VyIHRoYW4gaXRzIGAgK1xuICAgICAgICBgcmVuZGVyZWQgc2l6ZS4gVGhpcyBjYW4gbmVnYXRpdmVseSBpbXBhY3QgYXBwbGljYXRpb24gbG9hZGluZyBwZXJmb3JtYW5jZS4gYCArXG4gICAgICAgIGBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBhZGRyZXNzaW5nIG9yIGRpc2FibGluZyB0aGlzIHdhcm5pbmcsIHNlZSBgICtcbiAgICAgICAgYGh0dHBzOi8vYW5ndWxhci5kZXYvZXJyb3JzL05HMDkxM2AsXG4gICAgKSxcbiAgKTtcbn1cbiJdfQ==