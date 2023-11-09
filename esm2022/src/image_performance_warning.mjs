/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { IMAGE_CONFIG } from './application_tokens';
import { Injectable } from './di';
import { inject } from './di/injector_compatibility';
import { formatRuntimeError } from './errors';
import { getDocument } from './render3/interfaces/document';
import { NgZone } from './zone';
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
        this.ngZone = inject(NgZone);
    }
    start() {
        if (typeof PerformanceObserver === 'undefined' ||
            (this.options?.disableImageSizeWarning && this.options?.disableImageLazyLoadWarning)) {
            return;
        }
        this.observer = this.initPerformanceObserver();
        const win = getDocument().defaultView;
        if (typeof win !== 'undefined') {
            this.window = win;
            // Wait to avoid race conditions where LCP image triggers
            // load event before it's recorded by the performance observer
            const waitToScan = () => {
                setTimeout(this.scanImages.bind(this), SCAN_DELAY);
            };
            // Angular doesn't have to run change detection whenever any asynchronous tasks are invoked in
            // the scope of this functionality.
            this.ngZone.runOutsideAngular(() => {
                this.window?.addEventListener('load', waitToScan);
            });
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
        images.forEach(image => {
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
        if (lcpElementFound && !lcpElementLoadedCorrectly && this.lcpImageUrl &&
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
        const oversizedWidth = (intrinsicWidth - recommendedWidth) >= OVERSIZED_IMAGE_TOLERANCE;
        const oversizedHeight = (intrinsicHeight - recommendedHeight) >= OVERSIZED_IMAGE_TOLERANCE;
        return oversizedWidth || oversizedHeight;
    }
    static { this.ɵfac = function ImagePerformanceWarning_Factory(t) { return new (t || ImagePerformanceWarning)(); }; }
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
        `https://angular.io/errors/NG0913`));
}
function logOversizedImageWarning(src) {
    console.warn(formatRuntimeError(-913 /* RuntimeErrorCode.IMAGE_PERFORMANCE_WARNING */, `An image with src ${src} has intrinsic file dimensions much larger than its ` +
        `rendered size. This can negatively impact application loading performance. ` +
        `For more information about addressing or disabling this warning, see ` +
        `https://angular.io/errors/NG0913`));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VfcGVyZm9ybWFuY2Vfd2FybmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2ltYWdlX3BlcmZvcm1hbmNlX3dhcm5pbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBYyxNQUFNLHNCQUFzQixDQUFDO0FBQy9ELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDaEMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ25ELE9BQU8sRUFBQyxrQkFBa0IsRUFBbUIsTUFBTSxVQUFVLENBQUM7QUFFOUQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzFELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxRQUFRLENBQUM7O0FBRTlCLDRFQUE0RTtBQUM1RSx5RUFBeUU7QUFDekUsbUZBQW1GO0FBQ25GLHNEQUFzRDtBQUN0RCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFFdkIsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLENBQUM7QUFJdkMsTUFBTSxPQUFPLHVCQUF1QjtJQURwQztRQUVFLHFEQUFxRDtRQUM3QyxXQUFNLEdBQWdCLElBQUksQ0FBQztRQUMzQixhQUFRLEdBQTZCLElBQUksQ0FBQztRQUMxQyxZQUFPLEdBQWdCLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM1QyxXQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBd0hqQztJQXJIUSxLQUFLO1FBQ1YsSUFBSSxPQUFPLG1CQUFtQixLQUFLLFdBQVc7WUFDMUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLHVCQUF1QixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsMkJBQTJCLENBQUMsRUFBRSxDQUFDO1lBQ3pGLE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxD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QkFBdUIsbUJBRFgsTUFBTTs7Z0ZBQ2xCLHVCQUF1QjtjQURuQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQWdJaEMsU0FBUyxpQkFBaUIsQ0FBQyxHQUFXO0lBQ3BDLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLHdEQUUzQixxQkFBcUIsR0FBRyxpREFBaUQ7UUFDckUseUVBQXlFO1FBQ3pFLG9FQUFvRTtRQUNwRSwwRUFBMEU7UUFDMUUsa0VBQWtFO1FBQ2xFLDhEQUE4RDtRQUM5RCxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQUMsR0FBVztJQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQix3REFFM0IscUJBQXFCLEdBQUcsc0RBQXNEO1FBQzFFLDZFQUE2RTtRQUM3RSx1RUFBdUU7UUFDdkUsa0NBQWtDLENBQUMsQ0FBQyxDQUFDO0FBQy9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJTUFHRV9DT05GSUcsIEltYWdlQ29uZmlnfSBmcm9tICcuL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2Zvcm1hdFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtPbkRlc3Ryb3l9IGZyb20gJy4vaW50ZXJmYWNlL2xpZmVjeWNsZV9ob29rcyc7XG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi96b25lJztcblxuLy8gQSBkZWxheSBpbiBtaWxsaXNlY29uZHMgYmVmb3JlIHRoZSBzY2FuIGlzIHJ1biBhZnRlciBvbkxvYWQsIHRvIGF2b2lkIGFueVxuLy8gcG90ZW50aWFsIHJhY2UgY29uZGl0aW9ucyB3aXRoIG90aGVyIExDUC1yZWxhdGVkIGZ1bmN0aW9ucy4gVGhpcyBkZWxheVxuLy8gaGFwcGVucyBvdXRzaWRlIG9mIHRoZSBtYWluIEphdmFTY3JpcHQgZXhlY3V0aW9uIGFuZCB3aWxsIG9ubHkgZWZmZWN0IHRoZSB0aW1pbmdcbi8vIG9uIHdoZW4gdGhlIHdhcm5pbmcgYmVjb21lcyB2aXNpYmxlIGluIHRoZSBjb25zb2xlLlxuY29uc3QgU0NBTl9ERUxBWSA9IDIwMDtcblxuY29uc3QgT1ZFUlNJWkVEX0lNQUdFX1RPTEVSQU5DRSA9IDEyMDA7XG5cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgSW1hZ2VQZXJmb3JtYW5jZVdhcm5pbmcgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xuICAvLyBNYXAgb2YgZnVsbCBpbWFnZSBVUkxzIC0+IG9yaWdpbmFsIGBuZ1NyY2AgdmFsdWVzLlxuICBwcml2YXRlIHdpbmRvdzogV2luZG93fG51bGwgPSBudWxsO1xuICBwcml2YXRlIG9ic2VydmVyOiBQZXJmb3JtYW5jZU9ic2VydmVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIG9wdGlvbnM6IEltYWdlQ29uZmlnID0gaW5qZWN0KElNQUdFX0NPTkZJRyk7XG4gIHByaXZhdGUgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgbGNwSW1hZ2VVcmw/OiBzdHJpbmc7XG5cbiAgcHVibGljIHN0YXJ0KCkge1xuICAgIGlmICh0eXBlb2YgUGVyZm9ybWFuY2VPYnNlcnZlciA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgKHRoaXMub3B0aW9ucz8uZGlzYWJsZUltYWdlU2l6ZVdhcm5pbmcgJiYgdGhpcy5vcHRpb25zPy5kaXNhYmxlSW1hZ2VMYXp5TG9hZFdhcm5pbmcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMub2JzZXJ2ZXIgPSB0aGlzLmluaXRQZXJmb3JtYW5jZU9ic2VydmVyKCk7XG4gICAgY29uc3Qgd2luID0gZ2V0RG9jdW1lbnQoKS5kZWZhdWx0VmlldztcbiAgICBpZiAodHlwZW9mIHdpbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMud2luZG93ID0gd2luO1xuICAgICAgLy8gV2FpdCB0byBhdm9pZCByYWNlIGNvbmRpdGlvbnMgd2hlcmUgTENQIGltYWdlIHRyaWdnZXJzXG4gICAgICAvLyBsb2FkIGV2ZW50IGJlZm9yZSBpdCdzIHJlY29yZGVkIGJ5IHRoZSBwZXJmb3JtYW5jZSBvYnNlcnZlclxuICAgICAgY29uc3Qgd2FpdFRvU2NhbiA9ICgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCh0aGlzLnNjYW5JbWFnZXMuYmluZCh0aGlzKSwgU0NBTl9ERUxBWSk7XG4gICAgICB9O1xuICAgICAgLy8gQW5ndWxhciBkb2Vzbid0IGhhdmUgdG8gcnVuIGNoYW5nZSBkZXRlY3Rpb24gd2hlbmV2ZXIgYW55IGFzeW5jaHJvbm91cyB0YXNrcyBhcmUgaW52b2tlZCBpblxuICAgICAgLy8gdGhlIHNjb3BlIG9mIHRoaXMgZnVuY3Rpb25hbGl0eS5cbiAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgdGhpcy53aW5kb3c/LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB3YWl0VG9TY2FuKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMub2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdFBlcmZvcm1hbmNlT2JzZXJ2ZXIoKTogUGVyZm9ybWFuY2VPYnNlcnZlcnxudWxsIHtcbiAgICBpZiAodHlwZW9mIFBlcmZvcm1hbmNlT2JzZXJ2ZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgUGVyZm9ybWFuY2VPYnNlcnZlcigoZW50cnlMaXN0KSA9PiB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gZW50cnlMaXN0LmdldEVudHJpZXMoKTtcbiAgICAgIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgICAgLy8gV2UgdXNlIHRoZSBsYXRlc3QgZW50cnkgcHJvZHVjZWQgYnkgdGhlIGBQZXJmb3JtYW5jZU9ic2VydmVyYCBhcyB0aGUgYmVzdFxuICAgICAgLy8gc2lnbmFsIG9uIHdoaWNoIGVsZW1lbnQgaXMgYWN0dWFsbHkgYW4gTENQIG9uZS4gQXMgYW4gZXhhbXBsZSwgdGhlIGZpcnN0IGltYWdlIHRvIGxvYWQgb25cbiAgICAgIC8vIGEgcGFnZSwgYnkgdmlydHVlIG9mIGJlaW5nIHRoZSBvbmx5IHRoaW5nIG9uIHRoZSBwYWdlIHNvIGZhciwgaXMgb2Z0ZW4gYSBMQ1AgY2FuZGlkYXRlXG4gICAgICAvLyBhbmQgZ2V0cyByZXBvcnRlZCBieSBQZXJmb3JtYW5jZU9ic2VydmVyLCBidXQgaXNuJ3QgbmVjZXNzYXJpbHkgdGhlIExDUCBlbGVtZW50LlxuICAgICAgY29uc3QgbGNwRWxlbWVudCA9IGVudHJpZXNbZW50cmllcy5sZW5ndGggLSAxXTtcblxuICAgICAgLy8gQ2FzdCB0byBgYW55YCBkdWUgdG8gbWlzc2luZyBgZWxlbWVudGAgb24gdGhlIGBMYXJnZXN0Q29udGVudGZ1bFBhaW50YCB0eXBlIG9mIGVudHJ5LlxuICAgICAgLy8gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9MYXJnZXN0Q29udGVudGZ1bFBhaW50XG4gICAgICBjb25zdCBpbWdTcmMgPSAobGNwRWxlbWVudCBhcyBhbnkpLmVsZW1lbnQ/LnNyYyA/PyAnJztcblxuICAgICAgLy8gRXhjbHVkZSBgZGF0YTpgIGFuZCBgYmxvYjpgIFVSTHMsIHNpbmNlIHRoZXkgYXJlIGZldGNoZWQgcmVzb3VyY2VzLlxuICAgICAgaWYgKGltZ1NyYy5zdGFydHNXaXRoKCdkYXRhOicpIHx8IGltZ1NyYy5zdGFydHNXaXRoKCdibG9iOicpKSByZXR1cm47XG4gICAgICB0aGlzLmxjcEltYWdlVXJsID0gaW1nU3JjO1xuICAgIH0pO1xuICAgIG9ic2VydmVyLm9ic2VydmUoe3R5cGU6ICdsYXJnZXN0LWNvbnRlbnRmdWwtcGFpbnQnLCBidWZmZXJlZDogdHJ1ZX0pO1xuICAgIHJldHVybiBvYnNlcnZlcjtcbiAgfVxuXG4gIHByaXZhdGUgc2NhbkltYWdlcygpOiB2b2lkIHtcbiAgICBjb25zdCBpbWFnZXMgPSBnZXREb2N1bWVudCgpLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAgIGxldCBsY3BFbGVtZW50Rm91bmQsIGxjcEVsZW1lbnRMb2FkZWRDb3JyZWN0bHkgPSBmYWxzZTtcbiAgICBpbWFnZXMuZm9yRWFjaChpbWFnZSA9PiB7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucz8uZGlzYWJsZUltYWdlU2l6ZVdhcm5pbmcpIHtcbiAgICAgICAgZm9yIChjb25zdCBpbWFnZSBvZiBpbWFnZXMpIHtcbiAgICAgICAgICAvLyBJbWFnZSBlbGVtZW50cyB1c2luZyB0aGUgTmdPcHRpbWl6ZWRJbWFnZSBkaXJlY3RpdmUgYXJlIGV4Y2x1ZGVkLFxuICAgICAgICAgIC8vIGFzIHRoYXQgZGlyZWN0aXZlIGhhcyBpdHMgb3duIHZlcnNpb24gb2YgdGhpcyBjaGVjay5cbiAgICAgICAgICBpZiAoIWltYWdlLmdldEF0dHJpYnV0ZSgnbmctaW1nJykgJiYgdGhpcy5pc092ZXJzaXplZChpbWFnZSkpIHtcbiAgICAgICAgICAgIGxvZ092ZXJzaXplZEltYWdlV2FybmluZyhpbWFnZS5zcmMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnM/LmRpc2FibGVJbWFnZUxhenlMb2FkV2FybmluZyAmJiB0aGlzLmxjcEltYWdlVXJsKSB7XG4gICAgICAgIGlmIChpbWFnZS5zcmMgPT09IHRoaXMubGNwSW1hZ2VVcmwpIHtcbiAgICAgICAgICBsY3BFbGVtZW50Rm91bmQgPSB0cnVlO1xuICAgICAgICAgIGlmIChpbWFnZS5sb2FkaW5nICE9PSAnbGF6eScgfHwgaW1hZ2UuZ2V0QXR0cmlidXRlKCduZy1pbWcnKSkge1xuICAgICAgICAgICAgLy8gVGhpcyB2YXJpYWJsZSBpcyBzZXQgdG8gdHJ1ZSBhbmQgbmV2ZXIgZ29lcyBiYWNrIHRvIGZhbHNlIHRvIGFjY291bnRcbiAgICAgICAgICAgIC8vIGZvciB0aGUgY2FzZSB3aGVyZSBtdWx0aXBsZSBpbWFnZXMgaGF2ZSB0aGUgc2FtZSBzcmMgdXJsLCBhbmQgc29tZVxuICAgICAgICAgICAgLy8gaGF2ZSBsYXp5IGxvYWRpbmcgd2hpbGUgb3RoZXJzIGRvbid0LlxuICAgICAgICAgICAgLy8gQWxzbyBpZ25vcmUgTmdPcHRpbWl6ZWRJbWFnZSBiZWNhdXNlIHRoZXJlJ3MgYSBkaWZmZXJlbnQgd2FybmluZyBmb3IgdGhhdC5cbiAgICAgICAgICAgIGxjcEVsZW1lbnRMb2FkZWRDb3JyZWN0bHkgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChsY3BFbGVtZW50Rm91bmQgJiYgIWxjcEVsZW1lbnRMb2FkZWRDb3JyZWN0bHkgJiYgdGhpcy5sY3BJbWFnZVVybCAmJlxuICAgICAgICAhdGhpcy5vcHRpb25zPy5kaXNhYmxlSW1hZ2VMYXp5TG9hZFdhcm5pbmcpIHtcbiAgICAgIGxvZ0xhenlMQ1BXYXJuaW5nKHRoaXMubGNwSW1hZ2VVcmwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaXNPdmVyc2l6ZWQoaW1hZ2U6IEhUTUxJbWFnZUVsZW1lbnQpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMud2luZG93KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IGNvbXB1dGVkU3R5bGUgPSB0aGlzLndpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGltYWdlKTtcbiAgICBsZXQgcmVuZGVyZWRXaWR0aCA9IHBhcnNlRmxvYXQoY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpKTtcbiAgICBsZXQgcmVuZGVyZWRIZWlnaHQgPSBwYXJzZUZsb2F0KGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JykpO1xuICAgIGNvbnN0IGJveFNpemluZyA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm94LXNpemluZycpO1xuICAgIGNvbnN0IG9iamVjdEZpdCA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnb2JqZWN0LWZpdCcpO1xuXG4gICAgaWYgKG9iamVjdEZpdCA9PT0gYGNvdmVyYCkge1xuICAgICAgLy8gT2JqZWN0IGZpdCBjb3ZlciBtYXkgaW5kaWNhdGUgYSB1c2UgY2FzZSBzdWNoIGFzIGEgc3ByaXRlIHNoZWV0IHdoZXJlXG4gICAgICAvLyB0aGlzIHdhcm5pbmcgZG9lcyBub3QgYXBwbHkuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnKSB7XG4gICAgICBjb25zdCBwYWRkaW5nVG9wID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXRvcCcpO1xuICAgICAgY29uc3QgcGFkZGluZ1JpZ2h0ID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXJpZ2h0Jyk7XG4gICAgICBjb25zdCBwYWRkaW5nQm90dG9tID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWJvdHRvbScpO1xuICAgICAgY29uc3QgcGFkZGluZ0xlZnQgPSBjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctbGVmdCcpO1xuICAgICAgcmVuZGVyZWRXaWR0aCAtPSBwYXJzZUZsb2F0KHBhZGRpbmdSaWdodCkgKyBwYXJzZUZsb2F0KHBhZGRpbmdMZWZ0KTtcbiAgICAgIHJlbmRlcmVkSGVpZ2h0IC09IHBhcnNlRmxvYXQocGFkZGluZ1RvcCkgKyBwYXJzZUZsb2F0KHBhZGRpbmdCb3R0b20pO1xuICAgIH1cblxuICAgIGNvbnN0IGludHJpbnNpY1dpZHRoID0gaW1hZ2UubmF0dXJhbFdpZHRoO1xuICAgIGNvbnN0IGludHJpbnNpY0hlaWdodCA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG5cbiAgICBjb25zdCByZWNvbW1lbmRlZFdpZHRoID0gdGhpcy53aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyAqIHJlbmRlcmVkV2lkdGg7XG4gICAgY29uc3QgcmVjb21tZW5kZWRIZWlnaHQgPSB0aGlzLndpbmRvdy5kZXZpY2VQaXhlbFJhdGlvICogcmVuZGVyZWRIZWlnaHQ7XG4gICAgY29uc3Qgb3ZlcnNpemVkV2lkdGggPSAoaW50cmluc2ljV2lkdGggLSByZWNvbW1lbmRlZFdpZHRoKSA+PSBPVkVSU0laRURfSU1BR0VfVE9MRVJBTkNFO1xuICAgIGNvbnN0IG92ZXJzaXplZEhlaWdodCA9IChpbnRyaW5zaWNIZWlnaHQgLSByZWNvbW1lbmRlZEhlaWdodCkgPj0gT1ZFUlNJWkVEX0lNQUdFX1RPTEVSQU5DRTtcbiAgICByZXR1cm4gb3ZlcnNpemVkV2lkdGggfHwgb3ZlcnNpemVkSGVpZ2h0O1xuICB9XG59XG5cbmZ1bmN0aW9uIGxvZ0xhenlMQ1BXYXJuaW5nKHNyYzogc3RyaW5nKSB7XG4gIGNvbnNvbGUud2Fybihmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLklNQUdFX1BFUkZPUk1BTkNFX1dBUk5JTkcsXG4gICAgICBgQW4gaW1hZ2Ugd2l0aCBzcmMgJHtzcmN9IGlzIHRoZSBMYXJnZXN0IENvbnRlbnRmdWwgUGFpbnQgKExDUCkgZWxlbWVudCBgICtcbiAgICAgICAgICBgYnV0IHdhcyBnaXZlbiBhIFwibG9hZGluZ1wiIHZhbHVlIG9mIFwibGF6eVwiLCB3aGljaCBjYW4gbmVnYXRpdmVseSBpbXBhY3QgYCArXG4gICAgICAgICAgYGFwcGxpY2F0aW9uIGxvYWRpbmcgcGVyZm9ybWFuY2UuIFRoaXMgd2FybmluZyBjYW4gYmUgYWRkcmVzc2VkIGJ5IGAgK1xuICAgICAgICAgIGBjaGFuZ2luZyB0aGUgbG9hZGluZyB2YWx1ZSBvZiB0aGUgTENQIGltYWdlIHRvIFwiZWFnZXJcIiwgb3IgYnkgdXNpbmcgdGhlIGAgK1xuICAgICAgICAgIGBOZ09wdGltaXplZEltYWdlIGRpcmVjdGl2ZSdzIHByaW9yaXRpemF0aW9uIHV0aWxpdGllcy4gRm9yIG1vcmUgYCArXG4gICAgICAgICAgYGluZm9ybWF0aW9uIGFib3V0IGFkZHJlc3Npbmcgb3IgZGlzYWJsaW5nIHRoaXMgd2FybmluZywgc2VlIGAgK1xuICAgICAgICAgIGBodHRwczovL2FuZ3VsYXIuaW8vZXJyb3JzL05HMDkxM2ApKTtcbn1cblxuZnVuY3Rpb24gbG9nT3ZlcnNpemVkSW1hZ2VXYXJuaW5nKHNyYzogc3RyaW5nKSB7XG4gIGNvbnNvbGUud2Fybihmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLklNQUdFX1BFUkZPUk1BTkNFX1dBUk5JTkcsXG4gICAgICBgQW4gaW1hZ2Ugd2l0aCBzcmMgJHtzcmN9IGhhcyBpbnRyaW5zaWMgZmlsZSBkaW1lbnNpb25zIG11Y2ggbGFyZ2VyIHRoYW4gaXRzIGAgK1xuICAgICAgICAgIGByZW5kZXJlZCBzaXplLiBUaGlzIGNhbiBuZWdhdGl2ZWx5IGltcGFjdCBhcHBsaWNhdGlvbiBsb2FkaW5nIHBlcmZvcm1hbmNlLiBgICtcbiAgICAgICAgICBgRm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgYWRkcmVzc2luZyBvciBkaXNhYmxpbmcgdGhpcyB3YXJuaW5nLCBzZWUgYCArXG4gICAgICAgICAgYGh0dHBzOi8vYW5ndWxhci5pby9lcnJvcnMvTkcwOTEzYCkpO1xufVxuIl19