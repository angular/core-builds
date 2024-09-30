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
        // The `isOversized` check may not be applicable or may require adjustments
        // for several types of image formats or scenarios. Currently, we specify only
        // `svg`, but this may also include `gif` since their quality isn’t tied to
        // dimensions in the same way as raster images.
        const nonOversizedImageExtentions = [
            // SVG images are vector-based, which means they can scale
            // to any size without losing quality.
            '.svg',
        ];
        // Convert it to lowercase because this may have uppercase
        // extensions, such as `IMAGE.SVG`.
        // We fallback to an empty string because `src` may be `undefined`
        // if it is explicitly set to `null` by some third-party code
        // (e.g., `image.src = null`).
        const imageSource = (image.src || '').toLowerCase();
        if (nonOversizedImageExtentions.some((extension) => imageSource.endsWith(extension))) {
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
            // If the image `box-sizing` is set to `border-box`, we adjust the rendered
            // dimensions by subtracting padding values.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VfcGVyZm9ybWFuY2Vfd2FybmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2ltYWdlX3BlcmZvcm1hbmNlX3dhcm5pbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBZSxXQUFXLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUN4RixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2hDLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsa0JBQWtCLEVBQW1CLE1BQU0sVUFBVSxDQUFDO0FBRTlELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQzs7QUFFMUQsNEVBQTRFO0FBQzVFLHlFQUF5RTtBQUN6RSxtRkFBbUY7QUFDbkYsc0RBQXNEO0FBQ3RELE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUV2QixNQUFNLHlCQUF5QixHQUFHLElBQUksQ0FBQztBQUd2QyxNQUFNLE9BQU8sdUJBQXVCO0lBRHBDO1FBRUUscURBQXFEO1FBQzdDLFdBQU0sR0FBa0IsSUFBSSxDQUFDO1FBQzdCLGFBQVEsR0FBK0IsSUFBSSxDQUFDO1FBQzVDLFlBQU8sR0FBZ0IsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLGNBQVMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxDQUFDO0tBdUtoRTtJQXBLUSxLQUFLO1FBQ1YsSUFDRSxDQUFDLElBQUksQ0FBQyxTQUFTO1lBQ2YsT0FBTyxtQkFBbUIsS0FBSyxXQUFXO1lBQzFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSx1QkFBdUIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLDJCQUEyQixDQUFDLEVBQ3BGLENBQUM7WUFDRCxPQUFPO1FBQ1QsQ0FBQztRQUNELElB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LENBQUMsSUFBSSxDQUNWLGtCQUFrQix3REFFaEIscUJBQXFCLEdBQUcsaURBQWlEO1FBQ3ZFLHlFQUF5RTtRQUN6RSxvRUFBb0U7UUFDcEUsMEVBQTBFO1FBQzFFLGtFQUFrRTtRQUNsRSw4REFBOEQ7UUFDOUQsbUNBQW1DLENBQ3RDLENBQ0YsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUFDLEdBQVc7SUFDM0MsT0FBTyxDQUFDLElBQUksQ0FDVixrQkFBa0Isd0RBRWhCLHFCQUFxQixHQUFHLHNEQUFzRDtRQUM1RSw2RUFBNkU7UUFDN0UsdUVBQXVFO1FBQ3ZFLG1DQUFtQyxDQUN0QyxDQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuZGV2L2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0lNQUdFX0NPTkZJRywgSW1hZ2VDb25maWcsIFBMQVRGT1JNX0lEfSBmcm9tICcuL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2Zvcm1hdFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtPbkRlc3Ryb3l9IGZyb20gJy4vaW50ZXJmYWNlL2xpZmVjeWNsZV9ob29rcyc7XG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5cbi8vIEEgZGVsYXkgaW4gbWlsbGlzZWNvbmRzIGJlZm9yZSB0aGUgc2NhbiBpcyBydW4gYWZ0ZXIgb25Mb2FkLCB0byBhdm9pZCBhbnlcbi8vIHBvdGVudGlhbCByYWNlIGNvbmRpdGlvbnMgd2l0aCBvdGhlciBMQ1AtcmVsYXRlZCBmdW5jdGlvbnMuIFRoaXMgZGVsYXlcbi8vIGhhcHBlbnMgb3V0c2lkZSBvZiB0aGUgbWFpbiBKYXZhU2NyaXB0IGV4ZWN1dGlvbiBhbmQgd2lsbCBvbmx5IGVmZmVjdCB0aGUgdGltaW5nXG4vLyBvbiB3aGVuIHRoZSB3YXJuaW5nIGJlY29tZXMgdmlzaWJsZSBpbiB0aGUgY29uc29sZS5cbmNvbnN0IFNDQU5fREVMQVkgPSAyMDA7XG5cbmNvbnN0IE9WRVJTSVpFRF9JTUFHRV9UT0xFUkFOQ0UgPSAxMjAwO1xuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBJbWFnZVBlcmZvcm1hbmNlV2FybmluZyBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIC8vIE1hcCBvZiBmdWxsIGltYWdlIFVSTHMgLT4gb3JpZ2luYWwgYG5nU3JjYCB2YWx1ZXMuXG4gIHByaXZhdGUgd2luZG93OiBXaW5kb3cgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBvYnNlcnZlcjogUGVyZm9ybWFuY2VPYnNlcnZlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG9wdGlvbnM6IEltYWdlQ29uZmlnID0gaW5qZWN0KElNQUdFX0NPTkZJRyk7XG4gIHByaXZhdGUgcmVhZG9ubHkgaXNCcm93c2VyID0gaW5qZWN0KFBMQVRGT1JNX0lEKSA9PT0gJ2Jyb3dzZXInO1xuICBwcml2YXRlIGxjcEltYWdlVXJsPzogc3RyaW5nO1xuXG4gIHB1YmxpYyBzdGFydCgpIHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5pc0Jyb3dzZXIgfHxcbiAgICAgIHR5cGVvZiBQZXJmb3JtYW5jZU9ic2VydmVyID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgKHRoaXMub3B0aW9ucz8uZGlzYWJsZUltYWdlU2l6ZVdhcm5pbmcgJiYgdGhpcy5vcHRpb25zPy5kaXNhYmxlSW1hZ2VMYXp5TG9hZFdhcm5pbmcpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMub2JzZXJ2ZXIgPSB0aGlzLmluaXRQZXJmb3JtYW5jZU9ic2VydmVyKCk7XG4gICAgY29uc3QgZG9jID0gZ2V0RG9jdW1lbnQoKTtcbiAgICBjb25zdCB3aW4gPSBkb2MuZGVmYXVsdFZpZXc7XG4gICAgaWYgKHR5cGVvZiB3aW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLndpbmRvdyA9IHdpbjtcbiAgICAgIC8vIFdhaXQgdG8gYXZvaWQgcmFjZSBjb25kaXRpb25zIHdoZXJlIExDUCBpbWFnZSB0cmlnZ2Vyc1xuICAgICAgLy8gbG9hZCBldmVudCBiZWZvcmUgaXQncyByZWNvcmRlZCBieSB0aGUgcGVyZm9ybWFuY2Ugb2JzZXJ2ZXJcbiAgICAgIGNvbnN0IHdhaXRUb1NjYW4gPSAoKSA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQodGhpcy5zY2FuSW1hZ2VzLmJpbmQodGhpcyksIFNDQU5fREVMQVkpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHNldHVwID0gKCkgPT4ge1xuICAgICAgICAvLyBDb25zaWRlciB0aGUgY2FzZSB3aGVuIHRoZSBhcHBsaWNhdGlvbiBpcyBjcmVhdGVkIGFuZCBkZXN0cm95ZWQgbXVsdGlwbGUgdGltZXMuXG4gICAgICAgIC8vIFR5cGljYWxseSwgYXBwbGljYXRpb25zIGFyZSBjcmVhdGVkIGluc3RhbnRseSBvbmNlIHRoZSBwYWdlIGlzIGxvYWRlZCwgYW5kIHRoZVxuICAgICAgICAvLyBgd2luZG93LmxvYWRgIGxpc3RlbmVyIGlzIGFsd2F5cyB0cmlnZ2VyZWQuIEhvd2V2ZXIsIHRoZSBgd2luZG93LmxvYWRgIGV2ZW50IHdpbGwgbmV2ZXJcbiAgICAgICAgLy8gYmUgZmlyZWQgaWYgdGhlIHBhZ2UgaXMgbG9hZGVkLCBhbmQgdGhlIGFwcGxpY2F0aW9uIGlzIGNyZWF0ZWQgbGF0ZXIuIENoZWNraW5nIGZvclxuICAgICAgICAvLyBgcmVhZHlTdGF0ZWAgaXMgdGhlIGVhc2llc3Qgd2F5IHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBwYWdlIGhhcyBiZWVuIGxvYWRlZCBvciBub3QuXG4gICAgICAgIGlmIChkb2MucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgIHdhaXRUb1NjYW4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLndpbmRvdz8uYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHdhaXRUb1NjYW4sIHtvbmNlOiB0cnVlfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICAvLyBBbmd1bGFyIGRvZXNuJ3QgaGF2ZSB0byBydW4gY2hhbmdlIGRldGVjdGlvbiB3aGVuZXZlciBhbnkgYXN5bmNocm9ub3VzIHRhc2tzIGFyZSBpbnZva2VkIGluXG4gICAgICAvLyB0aGUgc2NvcGUgb2YgdGhpcyBmdW5jdGlvbmFsaXR5LlxuICAgICAgaWYgKHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBab25lLnJvb3QucnVuKCgpID0+IHNldHVwKCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0dXAoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLm9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gIH1cblxuICBwcml2YXRlIGluaXRQZXJmb3JtYW5jZU9ic2VydmVyKCk6IFBlcmZvcm1hbmNlT2JzZXJ2ZXIgfCBudWxsIHtcbiAgICBpZiAodHlwZW9mIFBlcmZvcm1hbmNlT2JzZXJ2ZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgUGVyZm9ybWFuY2VPYnNlcnZlcigoZW50cnlMaXN0KSA9PiB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gZW50cnlMaXN0LmdldEVudHJpZXMoKTtcbiAgICAgIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgICAgLy8gV2UgdXNlIHRoZSBsYXRlc3QgZW50cnkgcHJvZHVjZWQgYnkgdGhlIGBQZXJmb3JtYW5jZU9ic2VydmVyYCBhcyB0aGUgYmVzdFxuICAgICAgLy8gc2lnbmFsIG9uIHdoaWNoIGVsZW1lbnQgaXMgYWN0dWFsbHkgYW4gTENQIG9uZS4gQXMgYW4gZXhhbXBsZSwgdGhlIGZpcnN0IGltYWdlIHRvIGxvYWQgb25cbiAgICAgIC8vIGEgcGFnZSwgYnkgdmlydHVlIG9mIGJlaW5nIHRoZSBvbmx5IHRoaW5nIG9uIHRoZSBwYWdlIHNvIGZhciwgaXMgb2Z0ZW4gYSBMQ1AgY2FuZGlkYXRlXG4gICAgICAvLyBhbmQgZ2V0cyByZXBvcnRlZCBieSBQZXJmb3JtYW5jZU9ic2VydmVyLCBidXQgaXNuJ3QgbmVjZXNzYXJpbHkgdGhlIExDUCBlbGVtZW50LlxuICAgICAgY29uc3QgbGNwRWxlbWVudCA9IGVudHJpZXNbZW50cmllcy5sZW5ndGggLSAxXTtcblxuICAgICAgLy8gQ2FzdCB0byBgYW55YCBkdWUgdG8gbWlzc2luZyBgZWxlbWVudGAgb24gdGhlIGBMYXJnZXN0Q29udGVudGZ1bFBhaW50YCB0eXBlIG9mIGVudHJ5LlxuICAgICAgLy8gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9MYXJnZXN0Q29udGVudGZ1bFBhaW50XG4gICAgICBjb25zdCBpbWdTcmMgPSAobGNwRWxlbWVudCBhcyBhbnkpLmVsZW1lbnQ/LnNyYyA/PyAnJztcblxuICAgICAgLy8gRXhjbHVkZSBgZGF0YTpgIGFuZCBgYmxvYjpgIFVSTHMsIHNpbmNlIHRoZXkgYXJlIGZldGNoZWQgcmVzb3VyY2VzLlxuICAgICAgaWYgKGltZ1NyYy5zdGFydHNXaXRoKCdkYXRhOicpIHx8IGltZ1NyYy5zdGFydHNXaXRoKCdibG9iOicpKSByZXR1cm47XG4gICAgICB0aGlzLmxjcEltYWdlVXJsID0gaW1nU3JjO1xuICAgIH0pO1xuICAgIG9ic2VydmVyLm9ic2VydmUoe3R5cGU6ICdsYXJnZXN0LWNvbnRlbnRmdWwtcGFpbnQnLCBidWZmZXJlZDogdHJ1ZX0pO1xuICAgIHJldHVybiBvYnNlcnZlcjtcbiAgfVxuXG4gIHByaXZhdGUgc2NhbkltYWdlcygpOiB2b2lkIHtcbiAgICBjb25zdCBpbWFnZXMgPSBnZXREb2N1bWVudCgpLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAgIGxldCBsY3BFbGVtZW50Rm91bmQsXG4gICAgICBsY3BFbGVtZW50TG9hZGVkQ29ycmVjdGx5ID0gZmFsc2U7XG4gICAgaW1hZ2VzLmZvckVhY2goKGltYWdlKSA9PiB7XG4gICAgICBpZiAoIXRoaXMub3B0aW9ucz8uZGlzYWJsZUltYWdlU2l6ZVdhcm5pbmcpIHtcbiAgICAgICAgZm9yIChjb25zdCBpbWFnZSBvZiBpbWFnZXMpIHtcbiAgICAgICAgICAvLyBJbWFnZSBlbGVtZW50cyB1c2luZyB0aGUgTmdPcHRpbWl6ZWRJbWFnZSBkaXJlY3RpdmUgYXJlIGV4Y2x1ZGVkLFxuICAgICAgICAgIC8vIGFzIHRoYXQgZGlyZWN0aXZlIGhhcyBpdHMgb3duIHZlcnNpb24gb2YgdGhpcyBjaGVjay5cbiAgICAgICAgICBpZiAoIWltYWdlLmdldEF0dHJpYnV0ZSgnbmctaW1nJykgJiYgdGhpcy5pc092ZXJzaXplZChpbWFnZSkpIHtcbiAgICAgICAgICAgIGxvZ092ZXJzaXplZEltYWdlV2FybmluZyhpbWFnZS5zcmMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnM/LmRpc2FibGVJbWFnZUxhenlMb2FkV2FybmluZyAmJiB0aGlzLmxjcEltYWdlVXJsKSB7XG4gICAgICAgIGlmIChpbWFnZS5zcmMgPT09IHRoaXMubGNwSW1hZ2VVcmwpIHtcbiAgICAgICAgICBsY3BFbGVtZW50Rm91bmQgPSB0cnVlO1xuICAgICAgICAgIGlmIChpbWFnZS5sb2FkaW5nICE9PSAnbGF6eScgfHwgaW1hZ2UuZ2V0QXR0cmlidXRlKCduZy1pbWcnKSkge1xuICAgICAgICAgICAgLy8gVGhpcyB2YXJpYWJsZSBpcyBzZXQgdG8gdHJ1ZSBhbmQgbmV2ZXIgZ29lcyBiYWNrIHRvIGZhbHNlIHRvIGFjY291bnRcbiAgICAgICAgICAgIC8vIGZvciB0aGUgY2FzZSB3aGVyZSBtdWx0aXBsZSBpbWFnZXMgaGF2ZSB0aGUgc2FtZSBzcmMgdXJsLCBhbmQgc29tZVxuICAgICAgICAgICAgLy8gaGF2ZSBsYXp5IGxvYWRpbmcgd2hpbGUgb3RoZXJzIGRvbid0LlxuICAgICAgICAgICAgLy8gQWxzbyBpZ25vcmUgTmdPcHRpbWl6ZWRJbWFnZSBiZWNhdXNlIHRoZXJlJ3MgYSBkaWZmZXJlbnQgd2FybmluZyBmb3IgdGhhdC5cbiAgICAgICAgICAgIGxjcEVsZW1lbnRMb2FkZWRDb3JyZWN0bHkgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChcbiAgICAgIGxjcEVsZW1lbnRGb3VuZCAmJlxuICAgICAgIWxjcEVsZW1lbnRMb2FkZWRDb3JyZWN0bHkgJiZcbiAgICAgIHRoaXMubGNwSW1hZ2VVcmwgJiZcbiAgICAgICF0aGlzLm9wdGlvbnM/LmRpc2FibGVJbWFnZUxhenlMb2FkV2FybmluZ1xuICAgICkge1xuICAgICAgbG9nTGF6eUxDUFdhcm5pbmcodGhpcy5sY3BJbWFnZVVybCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpc092ZXJzaXplZChpbWFnZTogSFRNTEltYWdlRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy53aW5kb3cpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBUaGUgYGlzT3ZlcnNpemVkYCBjaGVjayBtYXkgbm90IGJlIGFwcGxpY2FibGUgb3IgbWF5IHJlcXVpcmUgYWRqdXN0bWVudHNcbiAgICAvLyBmb3Igc2V2ZXJhbCB0eXBlcyBvZiBpbWFnZSBmb3JtYXRzIG9yIHNjZW5hcmlvcy4gQ3VycmVudGx5LCB3ZSBzcGVjaWZ5IG9ubHlcbiAgICAvLyBgc3ZnYCwgYnV0IHRoaXMgbWF5IGFsc28gaW5jbHVkZSBgZ2lmYCBzaW5jZSB0aGVpciBxdWFsaXR5IGlzbuKAmXQgdGllZCB0b1xuICAgIC8vIGRpbWVuc2lvbnMgaW4gdGhlIHNhbWUgd2F5IGFzIHJhc3RlciBpbWFnZXMuXG4gICAgY29uc3Qgbm9uT3ZlcnNpemVkSW1hZ2VFeHRlbnRpb25zID0gW1xuICAgICAgLy8gU1ZHIGltYWdlcyBhcmUgdmVjdG9yLWJhc2VkLCB3aGljaCBtZWFucyB0aGV5IGNhbiBzY2FsZVxuICAgICAgLy8gdG8gYW55IHNpemUgd2l0aG91dCBsb3NpbmcgcXVhbGl0eS5cbiAgICAgICcuc3ZnJyxcbiAgICBdO1xuXG4gICAgLy8gQ29udmVydCBpdCB0byBsb3dlcmNhc2UgYmVjYXVzZSB0aGlzIG1heSBoYXZlIHVwcGVyY2FzZVxuICAgIC8vIGV4dGVuc2lvbnMsIHN1Y2ggYXMgYElNQUdFLlNWR2AuXG4gICAgLy8gV2UgZmFsbGJhY2sgdG8gYW4gZW1wdHkgc3RyaW5nIGJlY2F1c2UgYHNyY2AgbWF5IGJlIGB1bmRlZmluZWRgXG4gICAgLy8gaWYgaXQgaXMgZXhwbGljaXRseSBzZXQgdG8gYG51bGxgIGJ5IHNvbWUgdGhpcmQtcGFydHkgY29kZVxuICAgIC8vIChlLmcuLCBgaW1hZ2Uuc3JjID0gbnVsbGApLlxuICAgIGNvbnN0IGltYWdlU291cmNlID0gKGltYWdlLnNyYyB8fCAnJykudG9Mb3dlckNhc2UoKTtcblxuICAgIGlmIChub25PdmVyc2l6ZWRJbWFnZUV4dGVudGlvbnMuc29tZSgoZXh0ZW5zaW9uKSA9PiBpbWFnZVNvdXJjZS5lbmRzV2l0aChleHRlbnNpb24pKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXB1dGVkU3R5bGUgPSB0aGlzLndpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGltYWdlKTtcbiAgICBsZXQgcmVuZGVyZWRXaWR0aCA9IHBhcnNlRmxvYXQoY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpKTtcbiAgICBsZXQgcmVuZGVyZWRIZWlnaHQgPSBwYXJzZUZsb2F0KGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JykpO1xuICAgIGNvbnN0IGJveFNpemluZyA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm94LXNpemluZycpO1xuICAgIGNvbnN0IG9iamVjdEZpdCA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnb2JqZWN0LWZpdCcpO1xuXG4gICAgaWYgKG9iamVjdEZpdCA9PT0gYGNvdmVyYCkge1xuICAgICAgLy8gT2JqZWN0IGZpdCBjb3ZlciBtYXkgaW5kaWNhdGUgYSB1c2UgY2FzZSBzdWNoIGFzIGEgc3ByaXRlIHNoZWV0IHdoZXJlXG4gICAgICAvLyB0aGlzIHdhcm5pbmcgZG9lcyBub3QgYXBwbHkuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnKSB7XG4gICAgICAvLyBJZiB0aGUgaW1hZ2UgYGJveC1zaXppbmdgIGlzIHNldCB0byBgYm9yZGVyLWJveGAsIHdlIGFkanVzdCB0aGUgcmVuZGVyZWRcbiAgICAgIC8vIGRpbWVuc2lvbnMgYnkgc3VidHJhY3RpbmcgcGFkZGluZyB2YWx1ZXMuXG4gICAgICBjb25zdCBwYWRkaW5nVG9wID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXRvcCcpO1xuICAgICAgY29uc3QgcGFkZGluZ1JpZ2h0ID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLXJpZ2h0Jyk7XG4gICAgICBjb25zdCBwYWRkaW5nQm90dG9tID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdwYWRkaW5nLWJvdHRvbScpO1xuICAgICAgY29uc3QgcGFkZGluZ0xlZnQgPSBjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctbGVmdCcpO1xuICAgICAgcmVuZGVyZWRXaWR0aCAtPSBwYXJzZUZsb2F0KHBhZGRpbmdSaWdodCkgKyBwYXJzZUZsb2F0KHBhZGRpbmdMZWZ0KTtcbiAgICAgIHJlbmRlcmVkSGVpZ2h0IC09IHBhcnNlRmxvYXQocGFkZGluZ1RvcCkgKyBwYXJzZUZsb2F0KHBhZGRpbmdCb3R0b20pO1xuICAgIH1cblxuICAgIGNvbnN0IGludHJpbnNpY1dpZHRoID0gaW1hZ2UubmF0dXJhbFdpZHRoO1xuICAgIGNvbnN0IGludHJpbnNpY0hlaWdodCA9IGltYWdlLm5hdHVyYWxIZWlnaHQ7XG5cbiAgICBjb25zdCByZWNvbW1lbmRlZFdpZHRoID0gdGhpcy53aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyAqIHJlbmRlcmVkV2lkdGg7XG4gICAgY29uc3QgcmVjb21tZW5kZWRIZWlnaHQgPSB0aGlzLndpbmRvdy5kZXZpY2VQaXhlbFJhdGlvICogcmVuZGVyZWRIZWlnaHQ7XG4gICAgY29uc3Qgb3ZlcnNpemVkV2lkdGggPSBpbnRyaW5zaWNXaWR0aCAtIHJlY29tbWVuZGVkV2lkdGggPj0gT1ZFUlNJWkVEX0lNQUdFX1RPTEVSQU5DRTtcbiAgICBjb25zdCBvdmVyc2l6ZWRIZWlnaHQgPSBpbnRyaW5zaWNIZWlnaHQgLSByZWNvbW1lbmRlZEhlaWdodCA+PSBPVkVSU0laRURfSU1BR0VfVE9MRVJBTkNFO1xuICAgIHJldHVybiBvdmVyc2l6ZWRXaWR0aCB8fCBvdmVyc2l6ZWRIZWlnaHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbG9nTGF6eUxDUFdhcm5pbmcoc3JjOiBzdHJpbmcpIHtcbiAgY29uc29sZS53YXJuKFxuICAgIGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU1BR0VfUEVSRk9STUFOQ0VfV0FSTklORyxcbiAgICAgIGBBbiBpbWFnZSB3aXRoIHNyYyAke3NyY30gaXMgdGhlIExhcmdlc3QgQ29udGVudGZ1bCBQYWludCAoTENQKSBlbGVtZW50IGAgK1xuICAgICAgICBgYnV0IHdhcyBnaXZlbiBhIFwibG9hZGluZ1wiIHZhbHVlIG9mIFwibGF6eVwiLCB3aGljaCBjYW4gbmVnYXRpdmVseSBpbXBhY3QgYCArXG4gICAgICAgIGBhcHBsaWNhdGlvbiBsb2FkaW5nIHBlcmZvcm1hbmNlLiBUaGlzIHdhcm5pbmcgY2FuIGJlIGFkZHJlc3NlZCBieSBgICtcbiAgICAgICAgYGNoYW5naW5nIHRoZSBsb2FkaW5nIHZhbHVlIG9mIHRoZSBMQ1AgaW1hZ2UgdG8gXCJlYWdlclwiLCBvciBieSB1c2luZyB0aGUgYCArXG4gICAgICAgIGBOZ09wdGltaXplZEltYWdlIGRpcmVjdGl2ZSdzIHByaW9yaXRpemF0aW9uIHV0aWxpdGllcy4gRm9yIG1vcmUgYCArXG4gICAgICAgIGBpbmZvcm1hdGlvbiBhYm91dCBhZGRyZXNzaW5nIG9yIGRpc2FibGluZyB0aGlzIHdhcm5pbmcsIHNlZSBgICtcbiAgICAgICAgYGh0dHBzOi8vYW5ndWxhci5kZXYvZXJyb3JzL05HMDkxM2AsXG4gICAgKSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gbG9nT3ZlcnNpemVkSW1hZ2VXYXJuaW5nKHNyYzogc3RyaW5nKSB7XG4gIGNvbnNvbGUud2FybihcbiAgICBmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLklNQUdFX1BFUkZPUk1BTkNFX1dBUk5JTkcsXG4gICAgICBgQW4gaW1hZ2Ugd2l0aCBzcmMgJHtzcmN9IGhhcyBpbnRyaW5zaWMgZmlsZSBkaW1lbnNpb25zIG11Y2ggbGFyZ2VyIHRoYW4gaXRzIGAgK1xuICAgICAgICBgcmVuZGVyZWQgc2l6ZS4gVGhpcyBjYW4gbmVnYXRpdmVseSBpbXBhY3QgYXBwbGljYXRpb24gbG9hZGluZyBwZXJmb3JtYW5jZS4gYCArXG4gICAgICAgIGBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBhZGRyZXNzaW5nIG9yIGRpc2FibGluZyB0aGlzIHdhcm5pbmcsIHNlZSBgICtcbiAgICAgICAgYGh0dHBzOi8vYW5ndWxhci5kZXYvZXJyb3JzL05HMDkxM2AsXG4gICAgKSxcbiAgKTtcbn1cbiJdfQ==