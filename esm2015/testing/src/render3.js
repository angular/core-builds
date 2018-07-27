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
* @param html HTML which should be inserted into `body` of the `document`.
* @param blockFn function to wrap. The function can return promise or be `async`.
* @experimental
*/
export function withBody(html, blockFn) {
    return function (done) {
        ensureDocument();
        if (typeof blockFn === 'function') {
            document.body.innerHTML = html;
            const blockReturn = blockFn();
            if (blockReturn instanceof Promise) {
                blockReturn.then(done, done.fail);
            }
            else {
                done();
            }
        }
    };
}
let savedDocument = undefined;
let savedRequestAnimationFrame = undefined;
let savedNode = undefined;
let requestAnimationFrameCount = 0;
/**
 * System.js uses regexp to look for `require` statements. `domino` has to be
 * extracted into a constant so that the regexp in the System.js does not match
 * and does not try to load domino in the browser.
 */
const domino = (function (domino) {
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
})('domino');
/**
 * Ensure that global has `Document` if we are in node.js
 * @experimental
 */
export function ensureDocument() {
    if (domino) {
        // we are in node.js.
        const window = domino.createWindow('', 'http://localhost');
        savedDocument = global.document;
        global.window = window;
        global.document = window.document;
        // Trick to avoid Event patching from
        // https://github.com/angular/angular/blob/7cf5e95ac9f0f2648beebf0d5bd9056b79946970/packages/platform-browser/src/dom/events/dom_events.ts#L112-L132
        // It fails with Domino with TypeError: Cannot assign to read only property
        // 'stopImmediatePropagation' of object '#<Event>'
        global.Event = null;
        savedNode = global.Node;
        global.Node = domino.impl.Node;
        savedRequestAnimationFrame = global.requestAnimationFrame;
        global.requestAnimationFrame = function (cb) {
            setImmediate(cb);
            return requestAnimationFrameCount++;
        };
    }
}
/**
 * Restore the state of `Document` between tests.
 * @experimental
 */
export function cleanupDocument() {
    if (savedDocument) {
        global.document = savedDocument;
        global.window = undefined;
        savedDocument = undefined;
    }
    if (savedNode) {
        global.Node = savedNode;
        savedNode = undefined;
    }
    if (savedRequestAnimationFrame) {
        global.requestAnimationFrame = savedRequestAnimationFrame;
        savedRequestAnimationFrame = undefined;
    }
}
if (typeof beforeEach == 'function')
    beforeEach(ensureDocument);
if (typeof afterEach == 'function')
    beforeEach(cleanupDocument);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyMy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvdGVzdGluZy9zcmMvcmVuZGVyMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQTRCRTtBQUNGLE1BQU0sbUJBQXVDLElBQVksRUFBRSxPQUFVO0lBQ25FLE9BQU8sVUFBUyxJQUFZO1FBQzFCLGNBQWMsRUFBRSxDQUFDO1FBQ2pCLElBQUksT0FBTyxPQUFPLEtBQUssVUFBVSxFQUFFO1lBQ2pDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUMvQixNQUFNLFdBQVcsR0FBRyxPQUFPLEVBQUUsQ0FBQztZQUM5QixJQUFJLFdBQVcsWUFBWSxPQUFPLEVBQUU7Z0JBQ2xDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNuQztpQkFBTTtnQkFDTCxJQUFJLEVBQUUsQ0FBQzthQUNSO1NBQ0Y7SUFDSCxDQUFRLENBQUM7QUFDWCxDQUFDO0FBRUQsSUFBSSxhQUFhLEdBQXVCLFNBQVMsQ0FBQztBQUNsRCxJQUFJLDBCQUEwQixHQUEyRCxTQUFTLENBQUM7QUFDbkcsSUFBSSxTQUFTLEdBQTBCLFNBQVMsQ0FBQztBQUNqRCxJQUFJLDBCQUEwQixHQUFHLENBQUMsQ0FBQztBQUVuQzs7OztHQUlHO0FBQ0gsTUFBTSxNQUFNLEdBQVEsQ0FBQyxVQUFTLE1BQU07SUFDbEMsSUFBSSxPQUFPLE1BQU0sSUFBSSxRQUFRLElBQUksTUFBTSxDQUFDLE9BQU8sSUFBSSxPQUFPLE9BQU8sSUFBSSxVQUFVLEVBQUU7UUFDL0UsSUFBSTtZQUNGLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3hCO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixpRkFBaUY7U0FDbEY7S0FDRjtJQUNELDRDQUE0QztJQUM1QyxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRWI7OztHQUdHO0FBQ0gsTUFBTTtJQUNKLElBQUksTUFBTSxFQUFFO1FBQ1YscUJBQXFCO1FBQ3JCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDM0QsYUFBYSxHQUFJLE1BQWMsQ0FBQyxRQUFRLENBQUM7UUFDeEMsTUFBYyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDL0IsTUFBYyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQzNDLHFDQUFxQztRQUNyQyxvSkFBb0o7UUFDcEosMkVBQTJFO1FBQzNFLGtEQUFrRDtRQUNqRCxNQUFjLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUM3QixTQUFTLEdBQUksTUFBYyxDQUFDLElBQUksQ0FBQztRQUNoQyxNQUFjLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBRXhDLDBCQUEwQixHQUFJLE1BQWMsQ0FBQyxxQkFBcUIsQ0FBQztRQUNsRSxNQUFjLENBQUMscUJBQXFCLEdBQUcsVUFBUyxFQUF3QjtZQUN2RSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakIsT0FBTywwQkFBMEIsRUFBRSxDQUFDO1FBQ3RDLENBQUMsQ0FBQztLQUNIO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU07SUFDSixJQUFJLGFBQWEsRUFBRTtRQUNoQixNQUFjLENBQUMsUUFBUSxHQUFHLGFBQWEsQ0FBQztRQUN4QyxNQUFjLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztRQUNuQyxhQUFhLEdBQUcsU0FBUyxDQUFDO0tBQzNCO0lBQ0QsSUFBSSxTQUFTLEVBQUU7UUFDWixNQUFjLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztRQUNqQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0tBQ3ZCO0lBQ0QsSUFBSSwwQkFBMEIsRUFBRTtRQUM3QixNQUFjLENBQUMscUJBQXFCLEdBQUcsMEJBQTBCLENBQUM7UUFDbkUsMEJBQTBCLEdBQUcsU0FBUyxDQUFDO0tBQ3hDO0FBQ0gsQ0FBQztBQUVELElBQUksT0FBTyxVQUFVLElBQUksVUFBVTtJQUFFLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNoRSxJQUFJLE9BQU8sU0FBUyxJQUFJLFVBQVU7SUFBRSxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuKiBXcmFwcyBhIGZ1bmN0aW9uIGluIGEgbmV3IGZ1bmN0aW9uIHdoaWNoIHNldHMgdXAgZG9jdW1lbnQgYW5kIEhUTUwgZm9yIHJ1bm5pbmcgYSB0ZXN0LlxuKlxuKiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIHdyYXAgYW4gZXhpc3RpbmcgdGVzdGluZyBmdW5jdGlvbi4gVGhlIHdyYXBwZXJcbiogYWRkcyBIVE1MIHRvIHRoZSBgYm9keWAgZWxlbWVudCBvZiB0aGUgYGRvY3VtZW50YCBhbmQgc3Vic2VxdWVudGx5IHRlYXJzIGl0IGRvd24uXG4qXG4qIFRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCB3aXRoIGBhc3luYyBhd2FpdGAgYW5kIGBQcm9taXNlYHMuIElmIHRoZSB3cmFwcGVkXG4qIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIChvciBpcyBgYXN5bmNgKSB0aGVuIHRoZSB0ZWFyZG93biBpcyBkZWxheWVkIHVudGlsIHRoYXQgYFByb21pc2VgXG4qIGlzIHJlc29sdmVkLlxuKlxuKiBPbiBgbm9kZWAgdGhpcyBmdW5jdGlvbiBkZXRlY3RzIGlmIGBkb2N1bWVudGAgaXMgcHJlc2VudCBhbmQgaWYgbm90IGl0IHdpbGwgY3JlYXRlIG9uZSBieVxuKiBsb2FkaW5nIGBkb21pbm9gIGFuZCBpbnN0YWxsaW5nIGl0LlxuKlxuKiBFeGFtcGxlOlxuKlxuKiBgYGBcbiogZGVzY3JpYmUoJ3NvbWV0aGluZycsICgpID0+IHtcbiogICBpdCgnc2hvdWxkIGRvIHNvbWV0aGluZycsIHdpdGhCb2R5KCc8bXktYXBwPjwvbXktYXBwPicsIGFzeW5jICgpID0+IHtcbiogICAgIGNvbnN0IG15QXBwID0gcmVuZGVyQ29tcG9uZW50KE15QXBwKTtcbiogICAgIGF3YWl0IHdoZW5SZW5kZXJlZChteUFwcCk7XG4qICAgICBleHBlY3QoZ2V0UmVuZGVyZWRUZXh0KG15QXBwKSkudG9FcXVhbCgnSGVsbG8gV29ybGQhJyk7XG4qICAgfSkpO1xuKiB9KTtcbiogYGBgXG4qXG4qIEBwYXJhbSBodG1sIEhUTUwgd2hpY2ggc2hvdWxkIGJlIGluc2VydGVkIGludG8gYGJvZHlgIG9mIHRoZSBgZG9jdW1lbnRgLlxuKiBAcGFyYW0gYmxvY2tGbiBmdW5jdGlvbiB0byB3cmFwLiBUaGUgZnVuY3Rpb24gY2FuIHJldHVybiBwcm9taXNlIG9yIGJlIGBhc3luY2AuXG4qIEBleHBlcmltZW50YWxcbiovXG5leHBvcnQgZnVuY3Rpb24gd2l0aEJvZHk8VCBleHRlbmRzIEZ1bmN0aW9uPihodG1sOiBzdHJpbmcsIGJsb2NrRm46IFQpOiBUIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRvbmU6IERvbmVGbikge1xuICAgIGVuc3VyZURvY3VtZW50KCk7XG4gICAgaWYgKHR5cGVvZiBibG9ja0ZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmlubmVySFRNTCA9IGh0bWw7XG4gICAgICBjb25zdCBibG9ja1JldHVybiA9IGJsb2NrRm4oKTtcbiAgICAgIGlmIChibG9ja1JldHVybiBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgYmxvY2tSZXR1cm4udGhlbihkb25lLCBkb25lLmZhaWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfSBhcyBhbnk7XG59XG5cbmxldCBzYXZlZERvY3VtZW50OiBEb2N1bWVudHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5sZXQgc2F2ZWRSZXF1ZXN0QW5pbWF0aW9uRnJhbWU6ICgoY2FsbGJhY2s6IEZyYW1lUmVxdWVzdENhbGxiYWNrKSA9PiBudW1iZXIpfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbmxldCBzYXZlZE5vZGU6IHR5cGVvZiBOb2RlfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbmxldCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVDb3VudCA9IDA7XG5cbi8qKlxuICogU3lzdGVtLmpzIHVzZXMgcmVnZXhwIHRvIGxvb2sgZm9yIGByZXF1aXJlYCBzdGF0ZW1lbnRzLiBgZG9taW5vYCBoYXMgdG8gYmVcbiAqIGV4dHJhY3RlZCBpbnRvIGEgY29uc3RhbnQgc28gdGhhdCB0aGUgcmVnZXhwIGluIHRoZSBTeXN0ZW0uanMgZG9lcyBub3QgbWF0Y2hcbiAqIGFuZCBkb2VzIG5vdCB0cnkgdG8gbG9hZCBkb21pbm8gaW4gdGhlIGJyb3dzZXIuXG4gKi9cbmNvbnN0IGRvbWlubzogYW55ID0gKGZ1bmN0aW9uKGRvbWlubykge1xuICBpZiAodHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwucHJvY2VzcyAmJiB0eXBlb2YgcmVxdWlyZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiByZXF1aXJlKGRvbWlubyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gSXQgaXMgcG9zc2libGUgdGhhdCB3ZSBkb24ndCBoYXZlIGRvbWlubyBhdmFpbGFibGUgaW4gd2hpY2ggY2FzZSBqdXN0IGdpdmUgdXAuXG4gICAgfVxuICB9XG4gIC8vIFNlZW1zIGxpa2Ugd2UgZG9uJ3QgaGF2ZSBkb21pbm8sIGdpdmUgdXAuXG4gIHJldHVybiBudWxsO1xufSkoJ2RvbWlubycpO1xuXG4vKipcbiAqIEVuc3VyZSB0aGF0IGdsb2JhbCBoYXMgYERvY3VtZW50YCBpZiB3ZSBhcmUgaW4gbm9kZS5qc1xuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlRG9jdW1lbnQoKTogdm9pZCB7XG4gIGlmIChkb21pbm8pIHtcbiAgICAvLyB3ZSBhcmUgaW4gbm9kZS5qcy5cbiAgICBjb25zdCB3aW5kb3cgPSBkb21pbm8uY3JlYXRlV2luZG93KCcnLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgIHNhdmVkRG9jdW1lbnQgPSAoZ2xvYmFsIGFzIGFueSkuZG9jdW1lbnQ7XG4gICAgKGdsb2JhbCBhcyBhbnkpLndpbmRvdyA9IHdpbmRvdztcbiAgICAoZ2xvYmFsIGFzIGFueSkuZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XG4gICAgLy8gVHJpY2sgdG8gYXZvaWQgRXZlbnQgcGF0Y2hpbmcgZnJvbVxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvYmxvYi83Y2Y1ZTk1YWM5ZjBmMjY0OGJlZWJmMGQ1YmQ5MDU2Yjc5OTQ2OTcwL3BhY2thZ2VzL3BsYXRmb3JtLWJyb3dzZXIvc3JjL2RvbS9ldmVudHMvZG9tX2V2ZW50cy50cyNMMTEyLUwxMzJcbiAgICAvLyBJdCBmYWlscyB3aXRoIERvbWlubyB3aXRoIFR5cGVFcnJvcjogQ2Fubm90IGFzc2lnbiB0byByZWFkIG9ubHkgcHJvcGVydHlcbiAgICAvLyAnc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uJyBvZiBvYmplY3QgJyM8RXZlbnQ+J1xuICAgIChnbG9iYWwgYXMgYW55KS5FdmVudCA9IG51bGw7XG4gICAgc2F2ZWROb2RlID0gKGdsb2JhbCBhcyBhbnkpLk5vZGU7XG4gICAgKGdsb2JhbCBhcyBhbnkpLk5vZGUgPSBkb21pbm8uaW1wbC5Ob2RlO1xuXG4gICAgc2F2ZWRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSAoZ2xvYmFsIGFzIGFueSkucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgIChnbG9iYWwgYXMgYW55KS5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYjogRnJhbWVSZXF1ZXN0Q2FsbGJhY2spOiBudW1iZXIge1xuICAgICAgc2V0SW1tZWRpYXRlKGNiKTtcbiAgICAgIHJldHVybiByZXF1ZXN0QW5pbWF0aW9uRnJhbWVDb3VudCsrO1xuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBSZXN0b3JlIHRoZSBzdGF0ZSBvZiBgRG9jdW1lbnRgIGJldHdlZW4gdGVzdHMuXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwRG9jdW1lbnQoKTogdm9pZCB7XG4gIGlmIChzYXZlZERvY3VtZW50KSB7XG4gICAgKGdsb2JhbCBhcyBhbnkpLmRvY3VtZW50ID0gc2F2ZWREb2N1bWVudDtcbiAgICAoZ2xvYmFsIGFzIGFueSkud2luZG93ID0gdW5kZWZpbmVkO1xuICAgIHNhdmVkRG9jdW1lbnQgPSB1bmRlZmluZWQ7XG4gIH1cbiAgaWYgKHNhdmVkTm9kZSkge1xuICAgIChnbG9iYWwgYXMgYW55KS5Ob2RlID0gc2F2ZWROb2RlO1xuICAgIHNhdmVkTm9kZSA9IHVuZGVmaW5lZDtcbiAgfVxuICBpZiAoc2F2ZWRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcbiAgICAoZ2xvYmFsIGFzIGFueSkucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gc2F2ZWRSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgc2F2ZWRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB1bmRlZmluZWQ7XG4gIH1cbn1cblxuaWYgKHR5cGVvZiBiZWZvcmVFYWNoID09ICdmdW5jdGlvbicpIGJlZm9yZUVhY2goZW5zdXJlRG9jdW1lbnQpO1xuaWYgKHR5cGVvZiBhZnRlckVhY2ggPT0gJ2Z1bmN0aW9uJykgYmVmb3JlRWFjaChjbGVhbnVwRG9jdW1lbnQpO1xuIl19