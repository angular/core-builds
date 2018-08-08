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
/**
 * Wraps a function in a new function which sets up document and HTML for running a test.
 *
 * This function is intended to wrap an existing testing function. The wrapper
 * adds HTML to the `body` element of the `document` and subsequently tears it down.
 *
 * This function is intended to be used with `async await` and `Promise`s. If the wrapped
 * function returns a promise (or is `async`) then the teardown is delayed until that `Promise`
 * is resolved.
 *
 * On `node` this function detects if `document` is present and if not it will create one by
 * loading `domino` and installing it.
 *
 * Example:
 *
 * ```
 * describe('something', () => {
 *   it('should do something', withBody('<my-app></my-app>', async () => {
 *     const myApp = renderComponent(MyApp);
 *     await whenRendered(myApp);
 *     expect(getRenderedText(myApp)).toEqual('Hello World!');
 *   }));
 * });
 * ```
 *
 * \@experimental
 * @template T
 * @param {?} html HTML which should be inserted into `body` of the `document`.
 * @param {?} blockFn function to wrap. The function can return promise or be `async`.
 * @return {?}
 */
export function withBody(html, blockFn) {
    return /** @type {?} */ (function (done) {
        ensureDocument();
        if (typeof blockFn === 'function') {
            document.body.innerHTML = html;
            /** @type {?} */
            const blockReturn = blockFn();
            if (blockReturn instanceof Promise) {
                blockReturn.then(done, done.fail);
            }
            else {
                done();
            }
        }
    });
}
/** @type {?} */
let savedDocument = undefined;
/** @type {?} */
let savedRequestAnimationFrame = undefined;
/** @type {?} */
let savedNode = undefined;
/** @type {?} */
let requestAnimationFrameCount = 0;
const ɵ0 = function (domino) {
    if (typeof global == 'object' && global.process && typeof require == 'function') {
        try {
            return require(domino);
        }
        catch (e) {
            // It is possible that we don't have domino available in which case just give up.
        }
    }
    // Seems like we don't have domino, give up.
    return null;
};
/** *
 * System.js uses regexp to look for `require` statements. `domino` has to be
 * extracted into a constant so that the regexp in the System.js does not match
 * and does not try to load domino in the browser.
  @type {?} */
const domino = (ɵ0)('domino');
/**
 * Ensure that global has `Document` if we are in node.js
 * \@experimental
 * @return {?}
 */
export function ensureDocument() {
    if (domino) {
        /** @type {?} */
        const window = domino.createWindow('', 'http://localhost');
        savedDocument = (/** @type {?} */ (global)).document;
        (/** @type {?} */ (global)).window = window;
        (/** @type {?} */ (global)).document = window.document;
        // Trick to avoid Event patching from
        // https://github.com/angular/angular/blob/7cf5e95ac9f0f2648beebf0d5bd9056b79946970/packages/platform-browser/src/dom/events/dom_events.ts#L112-L132
        // It fails with Domino with TypeError: Cannot assign to read only property
        // 'stopImmediatePropagation' of object '#<Event>'
        (/** @type {?} */ (global)).Event = null;
        savedNode = (/** @type {?} */ (global)).Node;
        (/** @type {?} */ (global)).Node = domino.impl.Node;
        savedRequestAnimationFrame = (/** @type {?} */ (global)).requestAnimationFrame;
        (/** @type {?} */ (global)).requestAnimationFrame = function (cb) {
            setImmediate(cb);
            return requestAnimationFrameCount++;
        };
    }
}
/**
 * Restore the state of `Document` between tests.
 * \@experimental
 * @return {?}
 */
export function cleanupDocument() {
    if (savedDocument) {
        (/** @type {?} */ (global)).document = savedDocument;
        (/** @type {?} */ (global)).window = undefined;
        savedDocument = undefined;
    }
    if (savedNode) {
        (/** @type {?} */ (global)).Node = savedNode;
        savedNode = undefined;
    }
    if (savedRequestAnimationFrame) {
        (/** @type {?} */ (global)).requestAnimationFrame = savedRequestAnimationFrame;
        savedRequestAnimationFrame = undefined;
    }
}
if (typeof beforeEach == 'function')
    beforeEach(ensureDocument);
if (typeof afterEach == 'function')
    beforeEach(cleanupDocument);
export { ɵ0 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyMy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvcmVuZGVyMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQ0EsTUFBTSxtQkFBdUMsSUFBWSxFQUFFLE9BQVU7SUFDbkUseUJBQU8sVUFBUyxJQUFZO1FBQzFCLGNBQWMsRUFBRSxDQUFDO1FBQ2pCLElBQUksT0FBTyxPQUFPLEtBQUssVUFBVSxFQUFFO1lBQ2pDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQzs7WUFDL0IsTUFBTSxXQUFXLEdBQUcsT0FBTyxFQUFFLENBQUM7WUFDOUIsSUFBSSxXQUFXLFlBQVksT0FBTyxFQUFFO2dCQUNsQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbkM7aUJBQU07Z0JBQ0wsSUFBSSxFQUFFLENBQUM7YUFDUjtTQUNGO0tBQ0ssRUFBQztDQUNWOztBQUVELElBQUksYUFBYSxHQUF1QixTQUFTLENBQUM7O0FBQ2xELElBQUksMEJBQTBCLEdBQTJELFNBQVMsQ0FBQzs7QUFDbkcsSUFBSSxTQUFTLEdBQTBCLFNBQVMsQ0FBQzs7QUFDakQsSUFBSSwwQkFBMEIsR0FBRyxDQUFDLENBQUM7V0FPZCxVQUFTLE1BQU07SUFDbEMsSUFBSSxPQUFPLE1BQU0sSUFBSSxRQUFRLElBQUksTUFBTSxDQUFDLE9BQU8sSUFBSSxPQUFPLE9BQU8sSUFBSSxVQUFVLEVBQUU7UUFDL0UsSUFBSTtZQUNGLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3hCO1FBQUMsT0FBTyxDQUFDLEVBQUU7O1NBRVg7S0FDRjs7SUFFRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7QUFWRCxNQUFNLE1BQU0sR0FBUSxJQVVsQixDQUFDLFFBQVEsQ0FBQyxDQUFDOzs7Ozs7QUFNYixNQUFNO0lBQ0osSUFBSSxNQUFNLEVBQUU7O1FBRVYsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUMzRCxhQUFhLEdBQUcsbUJBQUMsTUFBYSxFQUFDLENBQUMsUUFBUSxDQUFDO1FBQ3pDLG1CQUFDLE1BQWEsRUFBQyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDaEMsbUJBQUMsTUFBYSxFQUFDLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7Ozs7O1FBSzNDLG1CQUFDLE1BQWEsRUFBQyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDN0IsU0FBUyxHQUFHLG1CQUFDLE1BQWEsRUFBQyxDQUFDLElBQUksQ0FBQztRQUNqQyxtQkFBQyxNQUFhLEVBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFFeEMsMEJBQTBCLEdBQUcsbUJBQUMsTUFBYSxFQUFDLENBQUMscUJBQXFCLENBQUM7UUFDbkUsbUJBQUMsTUFBYSxFQUFDLENBQUMscUJBQXFCLEdBQUcsVUFBUyxFQUF3QjtZQUN2RSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakIsT0FBTywwQkFBMEIsRUFBRSxDQUFDO1NBQ3JDLENBQUM7S0FDSDtDQUNGOzs7Ozs7QUFNRCxNQUFNO0lBQ0osSUFBSSxhQUFhLEVBQUU7UUFDakIsbUJBQUMsTUFBYSxFQUFDLENBQUMsUUFBUSxHQUFHLGFBQWEsQ0FBQztRQUN6QyxtQkFBQyxNQUFhLEVBQUMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO1FBQ25DLGFBQWEsR0FBRyxTQUFTLENBQUM7S0FDM0I7SUFDRCxJQUFJLFNBQVMsRUFBRTtRQUNiLG1CQUFDLE1BQWEsRUFBQyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7UUFDakMsU0FBUyxHQUFHLFNBQVMsQ0FBQztLQUN2QjtJQUNELElBQUksMEJBQTBCLEVBQUU7UUFDOUIsbUJBQUMsTUFBYSxFQUFDLENBQUMscUJBQXFCLEdBQUcsMEJBQTBCLENBQUM7UUFDbkUsMEJBQTBCLEdBQUcsU0FBUyxDQUFDO0tBQ3hDO0NBQ0Y7QUFFRCxJQUFJLE9BQU8sVUFBVSxJQUFJLFVBQVU7SUFBRSxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDaEUsSUFBSSxPQUFPLFNBQVMsSUFBSSxVQUFVO0lBQUUsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiogV3JhcHMgYSBmdW5jdGlvbiBpbiBhIG5ldyBmdW5jdGlvbiB3aGljaCBzZXRzIHVwIGRvY3VtZW50IGFuZCBIVE1MIGZvciBydW5uaW5nIGEgdGVzdC5cbipcbiogVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCB0byB3cmFwIGFuIGV4aXN0aW5nIHRlc3RpbmcgZnVuY3Rpb24uIFRoZSB3cmFwcGVyXG4qIGFkZHMgSFRNTCB0byB0aGUgYGJvZHlgIGVsZW1lbnQgb2YgdGhlIGBkb2N1bWVudGAgYW5kIHN1YnNlcXVlbnRseSB0ZWFycyBpdCBkb3duLlxuKlxuKiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgd2l0aCBgYXN5bmMgYXdhaXRgIGFuZCBgUHJvbWlzZWBzLiBJZiB0aGUgd3JhcHBlZFxuKiBmdW5jdGlvbiByZXR1cm5zIGEgcHJvbWlzZSAob3IgaXMgYGFzeW5jYCkgdGhlbiB0aGUgdGVhcmRvd24gaXMgZGVsYXllZCB1bnRpbCB0aGF0IGBQcm9taXNlYFxuKiBpcyByZXNvbHZlZC5cbipcbiogT24gYG5vZGVgIHRoaXMgZnVuY3Rpb24gZGV0ZWN0cyBpZiBgZG9jdW1lbnRgIGlzIHByZXNlbnQgYW5kIGlmIG5vdCBpdCB3aWxsIGNyZWF0ZSBvbmUgYnlcbiogbG9hZGluZyBgZG9taW5vYCBhbmQgaW5zdGFsbGluZyBpdC5cbipcbiogRXhhbXBsZTpcbipcbiogYGBgXG4qIGRlc2NyaWJlKCdzb21ldGhpbmcnLCAoKSA9PiB7XG4qICAgaXQoJ3Nob3VsZCBkbyBzb21ldGhpbmcnLCB3aXRoQm9keSgnPG15LWFwcD48L215LWFwcD4nLCBhc3luYyAoKSA9PiB7XG4qICAgICBjb25zdCBteUFwcCA9IHJlbmRlckNvbXBvbmVudChNeUFwcCk7XG4qICAgICBhd2FpdCB3aGVuUmVuZGVyZWQobXlBcHApO1xuKiAgICAgZXhwZWN0KGdldFJlbmRlcmVkVGV4dChteUFwcCkpLnRvRXF1YWwoJ0hlbGxvIFdvcmxkIScpO1xuKiAgIH0pKTtcbiogfSk7XG4qIGBgYFxuKlxuKiBAcGFyYW0gaHRtbCBIVE1MIHdoaWNoIHNob3VsZCBiZSBpbnNlcnRlZCBpbnRvIGBib2R5YCBvZiB0aGUgYGRvY3VtZW50YC5cbiogQHBhcmFtIGJsb2NrRm4gZnVuY3Rpb24gdG8gd3JhcC4gVGhlIGZ1bmN0aW9uIGNhbiByZXR1cm4gcHJvbWlzZSBvciBiZSBgYXN5bmNgLlxuKiBAZXhwZXJpbWVudGFsXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhCb2R5PFQgZXh0ZW5kcyBGdW5jdGlvbj4oaHRtbDogc3RyaW5nLCBibG9ja0ZuOiBUKTogVCB7XG4gIHJldHVybiBmdW5jdGlvbihkb25lOiBEb25lRm4pIHtcbiAgICBlbnN1cmVEb2N1bWVudCgpO1xuICAgIGlmICh0eXBlb2YgYmxvY2tGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgY29uc3QgYmxvY2tSZXR1cm4gPSBibG9ja0ZuKCk7XG4gICAgICBpZiAoYmxvY2tSZXR1cm4gaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIGJsb2NrUmV0dXJuLnRoZW4oZG9uZSwgZG9uZS5mYWlsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gYXMgYW55O1xufVxuXG5sZXQgc2F2ZWREb2N1bWVudDogRG9jdW1lbnR8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xubGV0IHNhdmVkUmVxdWVzdEFuaW1hdGlvbkZyYW1lOiAoKGNhbGxiYWNrOiBGcmFtZVJlcXVlc3RDYWxsYmFjaykgPT4gbnVtYmVyKXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5sZXQgc2F2ZWROb2RlOiB0eXBlb2YgTm9kZXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5sZXQgcmVxdWVzdEFuaW1hdGlvbkZyYW1lQ291bnQgPSAwO1xuXG4vKipcbiAqIFN5c3RlbS5qcyB1c2VzIHJlZ2V4cCB0byBsb29rIGZvciBgcmVxdWlyZWAgc3RhdGVtZW50cy4gYGRvbWlub2AgaGFzIHRvIGJlXG4gKiBleHRyYWN0ZWQgaW50byBhIGNvbnN0YW50IHNvIHRoYXQgdGhlIHJlZ2V4cCBpbiB0aGUgU3lzdGVtLmpzIGRvZXMgbm90IG1hdGNoXG4gKiBhbmQgZG9lcyBub3QgdHJ5IHRvIGxvYWQgZG9taW5vIGluIHRoZSBicm93c2VyLlxuICovXG5jb25zdCBkb21pbm86IGFueSA9IChmdW5jdGlvbihkb21pbm8pIHtcbiAgaWYgKHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsLnByb2Nlc3MgJiYgdHlwZW9mIHJlcXVpcmUgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gcmVxdWlyZShkb21pbm8pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRoYXQgd2UgZG9uJ3QgaGF2ZSBkb21pbm8gYXZhaWxhYmxlIGluIHdoaWNoIGNhc2UganVzdCBnaXZlIHVwLlxuICAgIH1cbiAgfVxuICAvLyBTZWVtcyBsaWtlIHdlIGRvbid0IGhhdmUgZG9taW5vLCBnaXZlIHVwLlxuICByZXR1cm4gbnVsbDtcbn0pKCdkb21pbm8nKTtcblxuLyoqXG4gKiBFbnN1cmUgdGhhdCBnbG9iYWwgaGFzIGBEb2N1bWVudGAgaWYgd2UgYXJlIGluIG5vZGUuanNcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuc3VyZURvY3VtZW50KCk6IHZvaWQge1xuICBpZiAoZG9taW5vKSB7XG4gICAgLy8gd2UgYXJlIGluIG5vZGUuanMuXG4gICAgY29uc3Qgd2luZG93ID0gZG9taW5vLmNyZWF0ZVdpbmRvdygnJywgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICBzYXZlZERvY3VtZW50ID0gKGdsb2JhbCBhcyBhbnkpLmRvY3VtZW50O1xuICAgIChnbG9iYWwgYXMgYW55KS53aW5kb3cgPSB3aW5kb3c7XG4gICAgKGdsb2JhbCBhcyBhbnkpLmRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xuICAgIC8vIFRyaWNrIHRvIGF2b2lkIEV2ZW50IHBhdGNoaW5nIGZyb21cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2Jsb2IvN2NmNWU5NWFjOWYwZjI2NDhiZWViZjBkNWJkOTA1NmI3OTk0Njk3MC9wYWNrYWdlcy9wbGF0Zm9ybS1icm93c2VyL3NyYy9kb20vZXZlbnRzL2RvbV9ldmVudHMudHMjTDExMi1MMTMyXG4gICAgLy8gSXQgZmFpbHMgd2l0aCBEb21pbm8gd2l0aCBUeXBlRXJyb3I6IENhbm5vdCBhc3NpZ24gdG8gcmVhZCBvbmx5IHByb3BlcnR5XG4gICAgLy8gJ3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbicgb2Ygb2JqZWN0ICcjPEV2ZW50PidcbiAgICAoZ2xvYmFsIGFzIGFueSkuRXZlbnQgPSBudWxsO1xuICAgIHNhdmVkTm9kZSA9IChnbG9iYWwgYXMgYW55KS5Ob2RlO1xuICAgIChnbG9iYWwgYXMgYW55KS5Ob2RlID0gZG9taW5vLmltcGwuTm9kZTtcblxuICAgIHNhdmVkUmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gKGdsb2JhbCBhcyBhbnkpLnJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICAoZ2xvYmFsIGFzIGFueSkucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2I6IEZyYW1lUmVxdWVzdENhbGxiYWNrKTogbnVtYmVyIHtcbiAgICAgIHNldEltbWVkaWF0ZShjYik7XG4gICAgICByZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lQ291bnQrKztcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogUmVzdG9yZSB0aGUgc3RhdGUgb2YgYERvY3VtZW50YCBiZXR3ZWVuIHRlc3RzLlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYW51cERvY3VtZW50KCk6IHZvaWQge1xuICBpZiAoc2F2ZWREb2N1bWVudCkge1xuICAgIChnbG9iYWwgYXMgYW55KS5kb2N1bWVudCA9IHNhdmVkRG9jdW1lbnQ7XG4gICAgKGdsb2JhbCBhcyBhbnkpLndpbmRvdyA9IHVuZGVmaW5lZDtcbiAgICBzYXZlZERvY3VtZW50ID0gdW5kZWZpbmVkO1xuICB9XG4gIGlmIChzYXZlZE5vZGUpIHtcbiAgICAoZ2xvYmFsIGFzIGFueSkuTm9kZSA9IHNhdmVkTm9kZTtcbiAgICBzYXZlZE5vZGUgPSB1bmRlZmluZWQ7XG4gIH1cbiAgaWYgKHNhdmVkUmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgKGdsb2JhbCBhcyBhbnkpLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHNhdmVkUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgIHNhdmVkUmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gdW5kZWZpbmVkO1xuICB9XG59XG5cbmlmICh0eXBlb2YgYmVmb3JlRWFjaCA9PSAnZnVuY3Rpb24nKSBiZWZvcmVFYWNoKGVuc3VyZURvY3VtZW50KTtcbmlmICh0eXBlb2YgYWZ0ZXJFYWNoID09ICdmdW5jdGlvbicpIGJlZm9yZUVhY2goY2xlYW51cERvY3VtZW50KTtcbiJdfQ==