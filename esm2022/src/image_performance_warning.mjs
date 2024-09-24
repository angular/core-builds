/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VfcGVyZm9ybWFuY2Vfd2FybmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2ltYWdlX3BlcmZvcm1hbmNlX3dhcm5pbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBZSxXQUFXLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUN4RixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2hDLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsa0JBQWtCLEVBQW1CLE1BQU0sVUFBVSxDQUFDO0FBRTlELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQzs7QUFFMUQsNEVBQTRFO0FBQzVFLHlFQUF5RTtBQUN6RSxtRkFBbUY7QUFDbkYsc0RBQXNEO0FBQ3RELE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUV2QixNQUFNLHlCQUF5QixHQUFHLElBQUksQ0FBQztBQUd2QyxNQUFNLE9BQU8sdUJBQXVCO0lBRHBDO1FBRUUscURBQXFEO1FBQzdDLFdBQU0sR0FBa0IsSUFBSSxDQUFDO1FBQzdCLGFBQVEsR0FBK0IsSUFBSSxDQUFDO1FBQzVDLFlBQU8sR0FBZ0IsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLGNBQVMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxDQUFDO0tBK0loRTtJQTVJUSxLQUFLO1FBQ1YsSUFDRSxDQUFDLElBQUksQ0FBQyxTQUFTO1lBQ2YsT0FBTyxtQkFBbUIsS0FBSyxXQUFXO1lBQzFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSx1QkFBdUIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLDJCQUEyQixDQUFDLEVBQ3BGLENBQUM7WUFDRCxPQUFPO1FBQ1QsQ0FBQztRQUNELElB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QVksQ0FBQztRQUMxQyxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO1FBRTVDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxhQUFhLENBQUM7UUFDdEUsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLGNBQWMsQ0FBQztRQUN4RSxNQUFNLGNBQWMsR0FBRyxjQUFjLEdBQUcsZ0JBQWdCLElBQUkseUJBQXlCLENBQUM7UUFDdEYsTUFBTSxlQUFlLEdBQUcsZUFBZSxHQUFHLGlCQUFpQixJQUFJLHlCQUF5QixDQUFDO1FBQ3pGLE9BQU8sY0FBYyxJQUFJLGVBQWUsQ0FBQztJQUMzQyxDQUFDO3dIQW5KVSx1QkFBdUI7dUVBQXZCLHVCQUF1QixXQUF2Qix1QkFBdUIsbUJBRFgsTUFBTTs7Z0ZBQ2xCLHVCQUF1QjtjQURuQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQXVKaEMsU0FBUyxpQkFBaUIsQ0FBQyxHQUFXO0lBQ3BDLE9BQU8sQ0FBQyxJQUFJLENBQ1Ysa0JBQWtCLHdEQUVoQixxQkFBcUIsR0FBRyxpREFBaUQ7UUFDdkUseUVBQXlFO1FBQ3pFLG9FQUFvRTtRQUNwRSwwRUFBMEU7UUFDMUUsa0VBQWtFO1FBQ2xFLDhEQUE4RDtRQUM5RCxtQ0FBbUMsQ0FDdEMsQ0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQUMsR0FBVztJQUMzQyxPQUFPLENBQUMsSUFBSSxDQUNWLGtCQUFrQix3REFFaEIscUJBQXFCLEdBQUcsc0RBQXNEO1FBQzVFLDZFQUE2RTtRQUM3RSx1RUFBdUU7UUFDdkUsbUNBQW1DLENBQ3RDLENBQ0YsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5kZXYvbGljZW5zZVxuICovXG5cbmltcG9ydCB7SU1BR0VfQ09ORklHLCBJbWFnZUNvbmZpZywgUExBVEZPUk1fSUR9IGZyb20gJy4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge09uRGVzdHJveX0gZnJvbSAnLi9pbnRlcmZhY2UvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4vcmVuZGVyMy9pbnRlcmZhY2VzL2RvY3VtZW50JztcblxuLy8gQSBkZWxheSBpbiBtaWxsaXNlY29uZHMgYmVmb3JlIHRoZSBzY2FuIGlzIHJ1biBhZnRlciBvbkxvYWQsIHRvIGF2b2lkIGFueVxuLy8gcG90ZW50aWFsIHJhY2UgY29uZGl0aW9ucyB3aXRoIG90aGVyIExDUC1yZWxhdGVkIGZ1bmN0aW9ucy4gVGhpcyBkZWxheVxuLy8gaGFwcGVucyBvdXRzaWRlIG9mIHRoZSBtYWluIEphdmFTY3JpcHQgZXhlY3V0aW9uIGFuZCB3aWxsIG9ubHkgZWZmZWN0IHRoZSB0aW1pbmdcbi8vIG9uIHdoZW4gdGhlIHdhcm5pbmcgYmVjb21lcyB2aXNpYmxlIGluIHRoZSBjb25zb2xlLlxuY29uc3QgU0NBTl9ERUxBWSA9IDIwMDtcblxuY29uc3QgT1ZFUlNJWkVEX0lNQUdFX1RPTEVSQU5DRSA9IDEyMDA7XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEltYWdlUGVyZm9ybWFuY2VXYXJuaW5nIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgLy8gTWFwIG9mIGZ1bGwgaW1hZ2UgVVJMcyAtPiBvcmlnaW5hbCBgbmdTcmNgIHZhbHVlcy5cbiAgcHJpdmF0ZSB3aW5kb3c6IFdpbmRvdyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG9ic2VydmVyOiBQZXJmb3JtYW5jZU9ic2VydmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgb3B0aW9uczogSW1hZ2VDb25maWcgPSBpbmplY3QoSU1BR0VfQ09ORklHKTtcbiAgcHJpdmF0ZSByZWFkb25seSBpc0Jyb3dzZXIgPSBpbmplY3QoUExBVEZPUk1fSUQpID09PSAnYnJvd3Nlcic7XG4gIHByaXZhdGUgbGNwSW1hZ2VVcmw/OiBzdHJpbmc7XG5cbiAgcHVibGljIHN0YXJ0KCkge1xuICAgIGlmIChcbiAgICAgICF0aGlzLmlzQnJvd3NlciB8fFxuICAgICAgdHlwZW9mIFBlcmZvcm1hbmNlT2JzZXJ2ZXIgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAodGhpcy5vcHRpb25zPy5kaXNhYmxlSW1hZ2VTaXplV2FybmluZyAmJiB0aGlzLm9wdGlvbnM/LmRpc2FibGVJbWFnZUxhenlMb2FkV2FybmluZylcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5vYnNlcnZlciA9IHRoaXMuaW5pdFBlcmZvcm1hbmNlT2JzZXJ2ZXIoKTtcbiAgICBjb25zdCBkb2MgPSBnZXREb2N1bWVudCgpO1xuICAgIGNvbnN0IHdpbiA9IGRvYy5kZWZhdWx0VmlldztcbiAgICBpZiAodHlwZW9mIHdpbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMud2luZG93ID0gd2luO1xuICAgICAgLy8gV2FpdCB0byBhdm9pZCByYWNlIGNvbmRpdGlvbnMgd2hlcmUgTENQIGltYWdlIHRyaWdnZXJzXG4gICAgICAvLyBsb2FkIGV2ZW50IGJlZm9yZSBpdCdzIHJlY29yZGVkIGJ5IHRoZSBwZXJmb3JtYW5jZSBvYnNlcnZlclxuICAgICAgY29uc3Qgd2FpdFRvU2NhbiA9ICgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCh0aGlzLnNjYW5JbWFnZXMuYmluZCh0aGlzKSwgU0NBTl9ERUxBWSk7XG4gICAgICB9O1xuICAgICAgY29uc3Qgc2V0dXAgPSAoKSA9PiB7XG4gICAgICAgIC8vIENvbnNpZGVyIHRoZSBjYXNlIHdoZW4gdGhlIGFwcGxpY2F0aW9uIGlzIGNyZWF0ZWQgYW5kIGRlc3Ryb3llZCBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgLy8gVHlwaWNhbGx5LCBhcHBsaWNhdGlvbnMgYXJlIGNyZWF0ZWQgaW5zdGFudGx5IG9uY2UgdGhlIHBhZ2UgaXMgbG9hZGVkLCBhbmQgdGhlXG4gICAgICAgIC8vIGB3aW5kb3cubG9hZGAgbGlzdGVuZXIgaXMgYWx3YXlzIHRyaWdnZXJlZC4gSG93ZXZlciwgdGhlIGB3aW5kb3cubG9hZGAgZXZlbnQgd2lsbCBuZXZlclxuICAgICAgICAvLyBiZSBmaXJlZCBpZiB0aGUgcGFnZSBpcyBsb2FkZWQsIGFuZCB0aGUgYXBwbGljYXRpb24gaXMgY3JlYXRlZCBsYXRlci4gQ2hlY2tpbmcgZm9yXG4gICAgICAgIC8vIGByZWFkeVN0YXRlYCBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIHBhZ2UgaGFzIGJlZW4gbG9hZGVkIG9yIG5vdC5cbiAgICAgICAgaWYgKGRvYy5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICAgICAgd2FpdFRvU2NhbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMud2luZG93Py5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgd2FpdFRvU2Nhbiwge29uY2U6IHRydWV9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIC8vIEFuZ3VsYXIgZG9lc24ndCBoYXZlIHRvIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIHdoZW5ldmVyIGFueSBhc3luY2hyb25vdXMgdGFza3MgYXJlIGludm9rZWQgaW5cbiAgICAgIC8vIHRoZSBzY29wZSBvZiB0aGlzIGZ1bmN0aW9uYWxpdHkuXG4gICAgICBpZiAodHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIFpvbmUucm9vdC5ydW4oKCkgPT4gc2V0dXAoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXR1cCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMub2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdFBlcmZvcm1hbmNlT2JzZXJ2ZXIoKTogUGVyZm9ybWFuY2VPYnNlcnZlciB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgUGVyZm9ybWFuY2VPYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBQZXJmb3JtYW5jZU9ic2VydmVyKChlbnRyeUxpc3QpID0+IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBlbnRyeUxpc3QuZ2V0RW50cmllcygpO1xuICAgICAgaWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgICAvLyBXZSB1c2UgdGhlIGxhdGVzdCBlbnRyeSBwcm9kdWNlZCBieSB0aGUgYFBlcmZvcm1hbmNlT2JzZXJ2ZXJgIGFzIHRoZSBiZXN0XG4gICAgICAvLyBzaWduYWwgb24gd2hpY2ggZWxlbWVudCBpcyBhY3R1YWxseSBhbiBMQ1Agb25lLiBBcyBhbiBleGFtcGxlLCB0aGUgZmlyc3QgaW1hZ2UgdG8gbG9hZCBvblxuICAgICAgLy8gYSBwYWdlLCBieSB2aXJ0dWUgb2YgYmVpbmcgdGhlIG9ubHkgdGhpbmcgb24gdGhlIHBhZ2Ugc28gZmFyLCBpcyBvZnRlbiBhIExDUCBjYW5kaWRhdGVcbiAgICAgIC8vIGFuZCBnZXRzIHJlcG9ydGVkIGJ5IFBlcmZvcm1hbmNlT2JzZXJ2ZXIsIGJ1dCBpc24ndCBuZWNlc3NhcmlseSB0aGUgTENQIGVsZW1lbnQuXG4gICAgICBjb25zdCBsY3BFbGVtZW50ID0gZW50cmllc1tlbnRyaWVzLmxlbmd0aCAtIDFdO1xuXG4gICAgICAvLyBDYXN0IHRvIGBhbnlgIGR1ZSB0byBtaXNzaW5nIGBlbGVtZW50YCBvbiB0aGUgYExhcmdlc3RDb250ZW50ZnVsUGFpbnRgIHR5cGUgb2YgZW50cnkuXG4gICAgICAvLyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0xhcmdlc3RDb250ZW50ZnVsUGFpbnRcbiAgICAgIGNvbnN0IGltZ1NyYyA9IChsY3BFbGVtZW50IGFzIGFueSkuZWxlbWVudD8uc3JjID8/ICcnO1xuXG4gICAgICAvLyBFeGNsdWRlIGBkYXRhOmAgYW5kIGBibG9iOmAgVVJMcywgc2luY2UgdGhleSBhcmUgZmV0Y2hlZCByZXNvdXJjZXMuXG4gICAgICBpZiAoaW1nU3JjLnN0YXJ0c1dpdGgoJ2RhdGE6JykgfHwgaW1nU3JjLnN0YXJ0c1dpdGgoJ2Jsb2I6JykpIHJldHVybjtcbiAgICAgIHRoaXMubGNwSW1hZ2VVcmwgPSBpbWdTcmM7XG4gICAgfSk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZSh7dHlwZTogJ2xhcmdlc3QtY29udGVudGZ1bC1wYWludCcsIGJ1ZmZlcmVkOiB0cnVlfSk7XG4gICAgcmV0dXJuIG9ic2VydmVyO1xuICB9XG5cbiAgcHJpdmF0ZSBzY2FuSW1hZ2VzKCk6IHZvaWQge1xuICAgIGNvbnN0IGltYWdlcyA9IGdldERvY3VtZW50KCkucXVlcnlTZWxlY3RvckFsbCgnaW1nJyk7XG4gICAgbGV0IGxjcEVsZW1lbnRGb3VuZCxcbiAgICAgIGxjcEVsZW1lbnRMb2FkZWRDb3JyZWN0bHkgPSBmYWxzZTtcbiAgICBpbWFnZXMuZm9yRWFjaCgoaW1hZ2UpID0+IHtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zPy5kaXNhYmxlSW1hZ2VTaXplV2FybmluZykge1xuICAgICAgICBmb3IgKGNvbnN0IGltYWdlIG9mIGltYWdlcykge1xuICAgICAgICAgIC8vIEltYWdlIGVsZW1lbnRzIHVzaW5nIHRoZSBOZ09wdGltaXplZEltYWdlIGRpcmVjdGl2ZSBhcmUgZXhjbHVkZWQsXG4gICAgICAgICAgLy8gYXMgdGhhdCBkaXJlY3RpdmUgaGFzIGl0cyBvd24gdmVyc2lvbiBvZiB0aGlzIGNoZWNrLlxuICAgICAgICAgIGlmICghaW1hZ2UuZ2V0QXR0cmlidXRlKCduZy1pbWcnKSAmJiB0aGlzLmlzT3ZlcnNpemVkKGltYWdlKSkge1xuICAgICAgICAgICAgbG9nT3ZlcnNpemVkSW1hZ2VXYXJuaW5nKGltYWdlLnNyYyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucz8uZGlzYWJsZUltYWdlTGF6eUxvYWRXYXJuaW5nICYmIHRoaXMubGNwSW1hZ2VVcmwpIHtcbiAgICAgICAgaWYgKGltYWdlLnNyYyA9PT0gdGhpcy5sY3BJbWFnZVVybCkge1xuICAgICAgICAgIGxjcEVsZW1lbnRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgaWYgKGltYWdlLmxvYWRpbmcgIT09ICdsYXp5JyB8fCBpbWFnZS5nZXRBdHRyaWJ1dGUoJ25nLWltZycpKSB7XG4gICAgICAgICAgICAvLyBUaGlzIHZhcmlhYmxlIGlzIHNldCB0byB0cnVlIGFuZCBuZXZlciBnb2VzIGJhY2sgdG8gZmFsc2UgdG8gYWNjb3VudFxuICAgICAgICAgICAgLy8gZm9yIHRoZSBjYXNlIHdoZXJlIG11bHRpcGxlIGltYWdlcyBoYXZlIHRoZSBzYW1lIHNyYyB1cmwsIGFuZCBzb21lXG4gICAgICAgICAgICAvLyBoYXZlIGxhenkgbG9hZGluZyB3aGlsZSBvdGhlcnMgZG9uJ3QuXG4gICAgICAgICAgICAvLyBBbHNvIGlnbm9yZSBOZ09wdGltaXplZEltYWdlIGJlY2F1c2UgdGhlcmUncyBhIGRpZmZlcmVudCB3YXJuaW5nIGZvciB0aGF0LlxuICAgICAgICAgICAgbGNwRWxlbWVudExvYWRlZENvcnJlY3RseSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKFxuICAgICAgbGNwRWxlbWVudEZvdW5kICYmXG4gICAgICAhbGNwRWxlbWVudExvYWRlZENvcnJlY3RseSAmJlxuICAgICAgdGhpcy5sY3BJbWFnZVVybCAmJlxuICAgICAgIXRoaXMub3B0aW9ucz8uZGlzYWJsZUltYWdlTGF6eUxvYWRXYXJuaW5nXG4gICAgKSB7XG4gICAgICBsb2dMYXp5TENQV2FybmluZyh0aGlzLmxjcEltYWdlVXJsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzT3ZlcnNpemVkKGltYWdlOiBIVE1MSW1hZ2VFbGVtZW50KTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLndpbmRvdykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBjb21wdXRlZFN0eWxlID0gdGhpcy53aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShpbWFnZSk7XG4gICAgbGV0IHJlbmRlcmVkV2lkdGggPSBwYXJzZUZsb2F0KGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKSk7XG4gICAgbGV0IHJlbmRlcmVkSGVpZ2h0ID0gcGFyc2VGbG9hdChjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpKTtcbiAgICBjb25zdCBib3hTaXppbmcgPSBjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JveC1zaXppbmcnKTtcbiAgICBjb25zdCBvYmplY3RGaXQgPSBjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ29iamVjdC1maXQnKTtcblxuICAgIGlmIChvYmplY3RGaXQgPT09IGBjb3ZlcmApIHtcbiAgICAgIC8vIE9iamVjdCBmaXQgY292ZXIgbWF5IGluZGljYXRlIGEgdXNlIGNhc2Ugc3VjaCBhcyBhIHNwcml0ZSBzaGVldCB3aGVyZVxuICAgICAgLy8gdGhpcyB3YXJuaW5nIGRvZXMgbm90IGFwcGx5LlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChib3hTaXppbmcgPT09ICdib3JkZXItYm94Jykge1xuICAgICAgY29uc3QgcGFkZGluZ1RvcCA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy10b3AnKTtcbiAgICAgIGNvbnN0IHBhZGRpbmdSaWdodCA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1yaWdodCcpO1xuICAgICAgY29uc3QgcGFkZGluZ0JvdHRvbSA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1ib3R0b20nKTtcbiAgICAgIGNvbnN0IHBhZGRpbmdMZWZ0ID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWxlZnQnKTtcbiAgICAgIHJlbmRlcmVkV2lkdGggLT0gcGFyc2VGbG9hdChwYWRkaW5nUmlnaHQpICsgcGFyc2VGbG9hdChwYWRkaW5nTGVmdCk7XG4gICAgICByZW5kZXJlZEhlaWdodCAtPSBwYXJzZUZsb2F0KHBhZGRpbmdUb3ApICsgcGFyc2VGbG9hdChwYWRkaW5nQm90dG9tKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnRyaW5zaWNXaWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aDtcbiAgICBjb25zdCBpbnRyaW5zaWNIZWlnaHQgPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xuXG4gICAgY29uc3QgcmVjb21tZW5kZWRXaWR0aCA9IHRoaXMud2luZG93LmRldmljZVBpeGVsUmF0aW8gKiByZW5kZXJlZFdpZHRoO1xuICAgIGNvbnN0IHJlY29tbWVuZGVkSGVpZ2h0ID0gdGhpcy53aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyAqIHJlbmRlcmVkSGVpZ2h0O1xuICAgIGNvbnN0IG92ZXJzaXplZFdpZHRoID0gaW50cmluc2ljV2lkdGggLSByZWNvbW1lbmRlZFdpZHRoID49IE9WRVJTSVpFRF9JTUFHRV9UT0xFUkFOQ0U7XG4gICAgY29uc3Qgb3ZlcnNpemVkSGVpZ2h0ID0gaW50cmluc2ljSGVpZ2h0IC0gcmVjb21tZW5kZWRIZWlnaHQgPj0gT1ZFUlNJWkVEX0lNQUdFX1RPTEVSQU5DRTtcbiAgICByZXR1cm4gb3ZlcnNpemVkV2lkdGggfHwgb3ZlcnNpemVkSGVpZ2h0O1xuICB9XG59XG5cbmZ1bmN0aW9uIGxvZ0xhenlMQ1BXYXJuaW5nKHNyYzogc3RyaW5nKSB7XG4gIGNvbnNvbGUud2FybihcbiAgICBmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLklNQUdFX1BFUkZPUk1BTkNFX1dBUk5JTkcsXG4gICAgICBgQW4gaW1hZ2Ugd2l0aCBzcmMgJHtzcmN9IGlzIHRoZSBMYXJnZXN0IENvbnRlbnRmdWwgUGFpbnQgKExDUCkgZWxlbWVudCBgICtcbiAgICAgICAgYGJ1dCB3YXMgZ2l2ZW4gYSBcImxvYWRpbmdcIiB2YWx1ZSBvZiBcImxhenlcIiwgd2hpY2ggY2FuIG5lZ2F0aXZlbHkgaW1wYWN0IGAgK1xuICAgICAgICBgYXBwbGljYXRpb24gbG9hZGluZyBwZXJmb3JtYW5jZS4gVGhpcyB3YXJuaW5nIGNhbiBiZSBhZGRyZXNzZWQgYnkgYCArXG4gICAgICAgIGBjaGFuZ2luZyB0aGUgbG9hZGluZyB2YWx1ZSBvZiB0aGUgTENQIGltYWdlIHRvIFwiZWFnZXJcIiwgb3IgYnkgdXNpbmcgdGhlIGAgK1xuICAgICAgICBgTmdPcHRpbWl6ZWRJbWFnZSBkaXJlY3RpdmUncyBwcmlvcml0aXphdGlvbiB1dGlsaXRpZXMuIEZvciBtb3JlIGAgK1xuICAgICAgICBgaW5mb3JtYXRpb24gYWJvdXQgYWRkcmVzc2luZyBvciBkaXNhYmxpbmcgdGhpcyB3YXJuaW5nLCBzZWUgYCArXG4gICAgICAgIGBodHRwczovL2FuZ3VsYXIuZGV2L2Vycm9ycy9ORzA5MTNgLFxuICAgICksXG4gICk7XG59XG5cbmZ1bmN0aW9uIGxvZ092ZXJzaXplZEltYWdlV2FybmluZyhzcmM6IHN0cmluZykge1xuICBjb25zb2xlLndhcm4oXG4gICAgZm9ybWF0UnVudGltZUVycm9yKFxuICAgICAgUnVudGltZUVycm9yQ29kZS5JTUFHRV9QRVJGT1JNQU5DRV9XQVJOSU5HLFxuICAgICAgYEFuIGltYWdlIHdpdGggc3JjICR7c3JjfSBoYXMgaW50cmluc2ljIGZpbGUgZGltZW5zaW9ucyBtdWNoIGxhcmdlciB0aGFuIGl0cyBgICtcbiAgICAgICAgYHJlbmRlcmVkIHNpemUuIFRoaXMgY2FuIG5lZ2F0aXZlbHkgaW1wYWN0IGFwcGxpY2F0aW9uIGxvYWRpbmcgcGVyZm9ybWFuY2UuIGAgK1xuICAgICAgICBgRm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgYWRkcmVzc2luZyBvciBkaXNhYmxpbmcgdGhpcyB3YXJuaW5nLCBzZWUgYCArXG4gICAgICAgIGBodHRwczovL2FuZ3VsYXIuZGV2L2Vycm9ycy9ORzA5MTNgLFxuICAgICksXG4gICk7XG59XG4iXX0=