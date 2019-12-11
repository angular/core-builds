/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { isProceduralRenderer } from '../interfaces/renderer';
import { computeClassChanges } from './class_differ';
import { computeStyleChanges } from './style_differ';
/**
 * Writes new `className` value in the DOM node.
 *
 * In its simplest form this function just writes the `newValue` into the `element.className`
 * property.
 *
 * However, under some circumstances this is more complex because there could be other code which
 * has added `class` information to the DOM element. In such a case writing our new value would
 * clobber what is already on the element and would result in incorrect behavior.
 *
 * To solve the above the function first reads the `element.className` to see if it matches the
 * `expectedValue`. (In our case `expectedValue` is just last value written into the DOM.) In this
 * way we can detect to see if anyone has modified the DOM since our last write.
 * - If we detect no change we simply write: `element.className = newValue`.
 * - If we do detect change then we compute the difference between the `expectedValue` and
 * `newValue` and then use `element.classList.add` and `element.classList.remove` to modify the
 * DOM.
 *
 * NOTE: Some platforms (such as NativeScript and WebWorkers) will not have `element.className`
 * available and reading the value will result in `undefined`. This means that for those platforms
 * we will always fail the check and will always use  `element.classList.add` and
 * `element.classList.remove` to modify the `element`. (A good mental model is that we can do
 * `element.className === expectedValue` but we may never know the actual value of
 * `element.className`)
 *
 * @param renderer Renderer to use
 * @param element The element which needs to be updated.
 * @param expectedValue The expected (previous/old) value of the class list which we will use to
 *        check if out of bounds modification has happened to the `element`.
 * @param newValue The new class list to write.
 */
export function writeAndReconcileClass(renderer, element, expectedValue, newValue) {
    if (element.className === expectedValue) {
        // This is the simple/fast case where no one has written into element without our knowledge.
        if (isProceduralRenderer(renderer)) {
            renderer.setAttribute(element, 'class', newValue);
        }
        else {
            element.className = newValue;
        }
        ngDevMode && ngDevMode.rendererSetClassName++;
    }
    else {
        // The expected value is not the same as last value. Something changed the DOM element without
        // our knowledge so we need to do reconciliation instead.
        reconcileClassNames(renderer, element, expectedValue, newValue);
    }
}
/**
* Writes new `cssText` value in the DOM node.
*
* In its simplest form this function just writes the `newValue` into the `element.style.cssText`
* property.
*
* However, under some circumstances this is more complex because there could be other code which
* has added `style` information to the DOM element. In such a case writing our new value would
* clobber what is already on the element and would result in incorrect behavior.
*
* To solve the above the function first reads the `element.style.cssText` to see if it matches the
* `expectedValue`. (In our case `expectedValue` is just last value written into the DOM.) In this
* way we can detect to see if anyone has modified the DOM since our last write.
* - If we detect no change we simply write: `element.style.cssText = newValue`
* - If we do detect change then we compute the difference between the `expectedValue` and
* `newValue` and then use `element.style[property]` to modify the DOM.
*
* NOTE: Some platforms (such as NativeScript and WebWorkers) will not have `element.style`
* available and reading the value will result in `undefined` This means that for those platforms we
* will always fail the check and will always use  `element.style[property]` to
* modify the `element`. (A good mental model is that we can do `element.style.cssText ===
* expectedValue` but we may never know the actual value of `element.style.cssText`)
*
* @param renderer Renderer to use
* @param element The element which needs to be updated.
* @param expectedValue The expected (previous/old) value of the class list to write.
* @param newValue The new class list to write
*/
export function writeAndReconcileStyle(renderer, element, expectedValue, newValue) {
    var style = element.style;
    if (style != null && style.cssText === expectedValue) {
        // This is the simple/fast case where no one has written into element without our knowledge.
        if (isProceduralRenderer(renderer)) {
            renderer.setAttribute(element, 'style', newValue);
        }
        else {
            style.cssText = newValue;
        }
        ngDevMode && ngDevMode.rendererCssText++;
    }
    else {
        // The expected value is not the same as last value. Something changed the DOM element without
        // our knowledge so we need to do reconciliation instead.
        reconcileStyleNames(renderer, element, expectedValue, newValue);
    }
}
/**
 * Writes to `classNames` by computing the difference between `oldValue` and `newValue` and using
 * `classList.add` and `classList.remove`.
 *
 * NOTE: Keep this a separate function so that `writeAndReconcileClass` is small and subject to
 * inlining. (We expect that this function will be called rarely.)
 *
 * @param renderer Renderer to use when updating DOM.
 * @param element The native element to update.
 * @param oldValue Old value of `classNames`.
 * @param newValue New value of `classNames`.
 */
function reconcileClassNames(renderer, element, oldValue, newValue) {
    var isProcedural = isProceduralRenderer(renderer);
    computeClassChanges(oldValue, newValue).forEach(function (classValue, className) {
        if (classValue === true) {
            if (isProcedural) {
                renderer.addClass(element, className);
            }
            else {
                element.classList.add(className);
            }
            ngDevMode && ngDevMode.rendererAddClass++;
        }
        else if (classValue === false) {
            if (isProcedural) {
                renderer.removeClass(element, className);
            }
            else {
                element.classList.remove(className);
            }
            ngDevMode && ngDevMode.rendererRemoveClass++;
        }
    });
}
/**
 * Writes to `styles` by computing the difference between `oldValue` and `newValue` and using
 * `styles.setProperty` and `styles.removeProperty`.
 *
 * NOTE: Keep this a separate function so that `writeAndReconcileStyle` is small and subject to
 * inlining. (We expect that this function will be called rarely.)
 *
 * @param renderer Renderer to use when updating DOM.
 * @param element The DOM element to update.
 * @param oldValue Old value of `classNames`.
 * @param newValue New value of `classNames`.
 */
function reconcileStyleNames(renderer, element, oldValue, newValue) {
    var isProcedural = isProceduralRenderer(renderer);
    var changes = computeStyleChanges(oldValue, newValue);
    changes.forEach(function (styleValue, styleName) {
        var newValue = styleValue.new;
        if (newValue === null) {
            if (isProcedural) {
                renderer.removeStyle(element, styleName);
            }
            else {
                element.style.removeProperty(styleName);
            }
            ngDevMode && ngDevMode.rendererRemoveStyle++;
        }
        else if (styleValue.old !== newValue) {
            if (isProcedural) {
                renderer.setStyle(element, styleName, newValue);
            }
            else {
                element.style.setProperty(styleName, newValue);
            }
            ngDevMode && ngDevMode.rendererSetStyle++;
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb25jaWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3JlY29uY2lsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFFRixPQUFPLEVBQTJDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdEcsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFbkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQThCRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsUUFBbUIsRUFBRSxPQUFpQixFQUFFLGFBQXFCLEVBQUUsUUFBZ0I7SUFDakYsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLGFBQWEsRUFBRTtRQUN2Qyw0RkFBNEY7UUFDNUYsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQyxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDbkQ7YUFBTTtZQUNMLE9BQU8sQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1NBQzlCO1FBQ0QsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0tBQy9DO1NBQU07UUFDTCw4RkFBOEY7UUFDOUYseURBQXlEO1FBQ3pELG1CQUFtQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ2pFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUEyQkU7QUFDRixNQUFNLFVBQVUsc0JBQXNCLENBQ2xDLFFBQW1CLEVBQUUsT0FBaUIsRUFBRSxhQUFxQixFQUFFLFFBQWdCO0lBQ2pGLElB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SUFBSSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztTQUMzQztJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2NvbXB1dGVDbGFzc0NoYW5nZXN9IGZyb20gJy4vY2xhc3NfZGlmZmVyJztcbmltcG9ydCB7Y29tcHV0ZVN0eWxlQ2hhbmdlc30gZnJvbSAnLi9zdHlsZV9kaWZmZXInO1xuXG4vKipcbiAqIFdyaXRlcyBuZXcgYGNsYXNzTmFtZWAgdmFsdWUgaW4gdGhlIERPTSBub2RlLlxuICpcbiAqIEluIGl0cyBzaW1wbGVzdCBmb3JtIHRoaXMgZnVuY3Rpb24ganVzdCB3cml0ZXMgdGhlIGBuZXdWYWx1ZWAgaW50byB0aGUgYGVsZW1lbnQuY2xhc3NOYW1lYFxuICogcHJvcGVydHkuXG4gKlxuICogSG93ZXZlciwgdW5kZXIgc29tZSBjaXJjdW1zdGFuY2VzIHRoaXMgaXMgbW9yZSBjb21wbGV4IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXIgY29kZSB3aGljaFxuICogaGFzIGFkZGVkIGBjbGFzc2AgaW5mb3JtYXRpb24gdG8gdGhlIERPTSBlbGVtZW50LiBJbiBzdWNoIGEgY2FzZSB3cml0aW5nIG91ciBuZXcgdmFsdWUgd291bGRcbiAqIGNsb2JiZXIgd2hhdCBpcyBhbHJlYWR5IG9uIHRoZSBlbGVtZW50IGFuZCB3b3VsZCByZXN1bHQgaW4gaW5jb3JyZWN0IGJlaGF2aW9yLlxuICpcbiAqIFRvIHNvbHZlIHRoZSBhYm92ZSB0aGUgZnVuY3Rpb24gZmlyc3QgcmVhZHMgdGhlIGBlbGVtZW50LmNsYXNzTmFtZWAgdG8gc2VlIGlmIGl0IG1hdGNoZXMgdGhlXG4gKiBgZXhwZWN0ZWRWYWx1ZWAuIChJbiBvdXIgY2FzZSBgZXhwZWN0ZWRWYWx1ZWAgaXMganVzdCBsYXN0IHZhbHVlIHdyaXR0ZW4gaW50byB0aGUgRE9NLikgSW4gdGhpc1xuICogd2F5IHdlIGNhbiBkZXRlY3QgdG8gc2VlIGlmIGFueW9uZSBoYXMgbW9kaWZpZWQgdGhlIERPTSBzaW5jZSBvdXIgbGFzdCB3cml0ZS5cbiAqIC0gSWYgd2UgZGV0ZWN0IG5vIGNoYW5nZSB3ZSBzaW1wbHkgd3JpdGU6IGBlbGVtZW50LmNsYXNzTmFtZSA9IG5ld1ZhbHVlYC5cbiAqIC0gSWYgd2UgZG8gZGV0ZWN0IGNoYW5nZSB0aGVuIHdlIGNvbXB1dGUgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgYGV4cGVjdGVkVmFsdWVgIGFuZFxuICogYG5ld1ZhbHVlYCBhbmQgdGhlbiB1c2UgYGVsZW1lbnQuY2xhc3NMaXN0LmFkZGAgYW5kIGBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmVgIHRvIG1vZGlmeSB0aGVcbiAqIERPTS5cbiAqXG4gKiBOT1RFOiBTb21lIHBsYXRmb3JtcyAoc3VjaCBhcyBOYXRpdmVTY3JpcHQgYW5kIFdlYldvcmtlcnMpIHdpbGwgbm90IGhhdmUgYGVsZW1lbnQuY2xhc3NOYW1lYFxuICogYXZhaWxhYmxlIGFuZCByZWFkaW5nIHRoZSB2YWx1ZSB3aWxsIHJlc3VsdCBpbiBgdW5kZWZpbmVkYC4gVGhpcyBtZWFucyB0aGF0IGZvciB0aG9zZSBwbGF0Zm9ybXNcbiAqIHdlIHdpbGwgYWx3YXlzIGZhaWwgdGhlIGNoZWNrIGFuZCB3aWxsIGFsd2F5cyB1c2UgIGBlbGVtZW50LmNsYXNzTGlzdC5hZGRgIGFuZFxuICogYGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZWAgdG8gbW9kaWZ5IHRoZSBgZWxlbWVudGAuIChBIGdvb2QgbWVudGFsIG1vZGVsIGlzIHRoYXQgd2UgY2FuIGRvXG4gKiBgZWxlbWVudC5jbGFzc05hbWUgPT09IGV4cGVjdGVkVmFsdWVgIGJ1dCB3ZSBtYXkgbmV2ZXIga25vdyB0aGUgYWN0dWFsIHZhbHVlIG9mXG4gKiBgZWxlbWVudC5jbGFzc05hbWVgKVxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHdoaWNoIG5lZWRzIHRvIGJlIHVwZGF0ZWQuXG4gKiBAcGFyYW0gZXhwZWN0ZWRWYWx1ZSBUaGUgZXhwZWN0ZWQgKHByZXZpb3VzL29sZCkgdmFsdWUgb2YgdGhlIGNsYXNzIGxpc3Qgd2hpY2ggd2Ugd2lsbCB1c2UgdG9cbiAqICAgICAgICBjaGVjayBpZiBvdXQgb2YgYm91bmRzIG1vZGlmaWNhdGlvbiBoYXMgaGFwcGVuZWQgdG8gdGhlIGBlbGVtZW50YC5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IGNsYXNzIGxpc3QgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUFuZFJlY29uY2lsZUNsYXNzKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBleHBlY3RlZFZhbHVlOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKGVsZW1lbnQuY2xhc3NOYW1lID09PSBleHBlY3RlZFZhbHVlKSB7XG4gICAgLy8gVGhpcyBpcyB0aGUgc2ltcGxlL2Zhc3QgY2FzZSB3aGVyZSBubyBvbmUgaGFzIHdyaXR0ZW4gaW50byBlbGVtZW50IHdpdGhvdXQgb3VyIGtub3dsZWRnZS5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgJ2NsYXNzJywgbmV3VmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IG5ld1ZhbHVlO1xuICAgIH1cbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0Q2xhc3NOYW1lKys7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIGV4cGVjdGVkIHZhbHVlIGlzIG5vdCB0aGUgc2FtZSBhcyBsYXN0IHZhbHVlLiBTb21ldGhpbmcgY2hhbmdlZCB0aGUgRE9NIGVsZW1lbnQgd2l0aG91dFxuICAgIC8vIG91ciBrbm93bGVkZ2Ugc28gd2UgbmVlZCB0byBkbyByZWNvbmNpbGlhdGlvbiBpbnN0ZWFkLlxuICAgIHJlY29uY2lsZUNsYXNzTmFtZXMocmVuZGVyZXIsIGVsZW1lbnQsIGV4cGVjdGVkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiogV3JpdGVzIG5ldyBgY3NzVGV4dGAgdmFsdWUgaW4gdGhlIERPTSBub2RlLlxuKlxuKiBJbiBpdHMgc2ltcGxlc3QgZm9ybSB0aGlzIGZ1bmN0aW9uIGp1c3Qgd3JpdGVzIHRoZSBgbmV3VmFsdWVgIGludG8gdGhlIGBlbGVtZW50LnN0eWxlLmNzc1RleHRgXG4qIHByb3BlcnR5LlxuKlxuKiBIb3dldmVyLCB1bmRlciBzb21lIGNpcmN1bXN0YW5jZXMgdGhpcyBpcyBtb3JlIGNvbXBsZXggYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlciBjb2RlIHdoaWNoXG4qIGhhcyBhZGRlZCBgc3R5bGVgIGluZm9ybWF0aW9uIHRvIHRoZSBET00gZWxlbWVudC4gSW4gc3VjaCBhIGNhc2Ugd3JpdGluZyBvdXIgbmV3IHZhbHVlIHdvdWxkXG4qIGNsb2JiZXIgd2hhdCBpcyBhbHJlYWR5IG9uIHRoZSBlbGVtZW50IGFuZCB3b3VsZCByZXN1bHQgaW4gaW5jb3JyZWN0IGJlaGF2aW9yLlxuKlxuKiBUbyBzb2x2ZSB0aGUgYWJvdmUgdGhlIGZ1bmN0aW9uIGZpcnN0IHJlYWRzIHRoZSBgZWxlbWVudC5zdHlsZS5jc3NUZXh0YCB0byBzZWUgaWYgaXQgbWF0Y2hlcyB0aGVcbiogYGV4cGVjdGVkVmFsdWVgLiAoSW4gb3VyIGNhc2UgYGV4cGVjdGVkVmFsdWVgIGlzIGp1c3QgbGFzdCB2YWx1ZSB3cml0dGVuIGludG8gdGhlIERPTS4pIEluIHRoaXNcbiogd2F5IHdlIGNhbiBkZXRlY3QgdG8gc2VlIGlmIGFueW9uZSBoYXMgbW9kaWZpZWQgdGhlIERPTSBzaW5jZSBvdXIgbGFzdCB3cml0ZS5cbiogLSBJZiB3ZSBkZXRlY3Qgbm8gY2hhbmdlIHdlIHNpbXBseSB3cml0ZTogYGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IG5ld1ZhbHVlYFxuKiAtIElmIHdlIGRvIGRldGVjdCBjaGFuZ2UgdGhlbiB3ZSBjb21wdXRlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIGBleHBlY3RlZFZhbHVlYCBhbmRcbiogYG5ld1ZhbHVlYCBhbmQgdGhlbiB1c2UgYGVsZW1lbnQuc3R5bGVbcHJvcGVydHldYCB0byBtb2RpZnkgdGhlIERPTS5cbipcbiogTk9URTogU29tZSBwbGF0Zm9ybXMgKHN1Y2ggYXMgTmF0aXZlU2NyaXB0IGFuZCBXZWJXb3JrZXJzKSB3aWxsIG5vdCBoYXZlIGBlbGVtZW50LnN0eWxlYFxuKiBhdmFpbGFibGUgYW5kIHJlYWRpbmcgdGhlIHZhbHVlIHdpbGwgcmVzdWx0IGluIGB1bmRlZmluZWRgIFRoaXMgbWVhbnMgdGhhdCBmb3IgdGhvc2UgcGxhdGZvcm1zIHdlXG4qIHdpbGwgYWx3YXlzIGZhaWwgdGhlIGNoZWNrIGFuZCB3aWxsIGFsd2F5cyB1c2UgIGBlbGVtZW50LnN0eWxlW3Byb3BlcnR5XWAgdG9cbiogbW9kaWZ5IHRoZSBgZWxlbWVudGAuIChBIGdvb2QgbWVudGFsIG1vZGVsIGlzIHRoYXQgd2UgY2FuIGRvIGBlbGVtZW50LnN0eWxlLmNzc1RleHQgPT09XG4qIGV4cGVjdGVkVmFsdWVgIGJ1dCB3ZSBtYXkgbmV2ZXIga25vdyB0aGUgYWN0dWFsIHZhbHVlIG9mIGBlbGVtZW50LnN0eWxlLmNzc1RleHRgKVxuKlxuKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4qIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHdoaWNoIG5lZWRzIHRvIGJlIHVwZGF0ZWQuXG4qIEBwYXJhbSBleHBlY3RlZFZhbHVlIFRoZSBleHBlY3RlZCAocHJldmlvdXMvb2xkKSB2YWx1ZSBvZiB0aGUgY2xhc3MgbGlzdCB0byB3cml0ZS5cbiogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgY2xhc3MgbGlzdCB0byB3cml0ZVxuKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUFuZFJlY29uY2lsZVN0eWxlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBleHBlY3RlZFZhbHVlOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3Qgc3R5bGUgPSAoZWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGU7XG4gIGlmIChzdHlsZSAhPSBudWxsICYmIHN0eWxlLmNzc1RleHQgPT09IGV4cGVjdGVkVmFsdWUpIHtcbiAgICAvLyBUaGlzIGlzIHRoZSBzaW1wbGUvZmFzdCBjYXNlIHdoZXJlIG5vIG9uZSBoYXMgd3JpdHRlbiBpbnRvIGVsZW1lbnQgd2l0aG91dCBvdXIga25vd2xlZGdlLlxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCAnc3R5bGUnLCBuZXdWYWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlLmNzc1RleHQgPSBuZXdWYWx1ZTtcbiAgICB9XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNzc1RleHQrKztcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgZXhwZWN0ZWQgdmFsdWUgaXMgbm90IHRoZSBzYW1lIGFzIGxhc3QgdmFsdWUuIFNvbWV0aGluZyBjaGFuZ2VkIHRoZSBET00gZWxlbWVudCB3aXRob3V0XG4gICAgLy8gb3VyIGtub3dsZWRnZSBzbyB3ZSBuZWVkIHRvIGRvIHJlY29uY2lsaWF0aW9uIGluc3RlYWQuXG4gICAgcmVjb25jaWxlU3R5bGVOYW1lcyhyZW5kZXJlciwgZWxlbWVudCwgZXhwZWN0ZWRWYWx1ZSwgbmV3VmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogV3JpdGVzIHRvIGBjbGFzc05hbWVzYCBieSBjb21wdXRpbmcgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBgb2xkVmFsdWVgIGFuZCBgbmV3VmFsdWVgIGFuZCB1c2luZ1xuICogYGNsYXNzTGlzdC5hZGRgIGFuZCBgY2xhc3NMaXN0LnJlbW92ZWAuXG4gKlxuICogTk9URTogS2VlcCB0aGlzIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gdGhhdCBgd3JpdGVBbmRSZWNvbmNpbGVDbGFzc2AgaXMgc21hbGwgYW5kIHN1YmplY3QgdG9cbiAqIGlubGluaW5nLiAoV2UgZXhwZWN0IHRoYXQgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCByYXJlbHkuKVxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2Ugd2hlbiB1cGRhdGluZyBET00uXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgbmF0aXZlIGVsZW1lbnQgdG8gdXBkYXRlLlxuICogQHBhcmFtIG9sZFZhbHVlIE9sZCB2YWx1ZSBvZiBgY2xhc3NOYW1lc2AuXG4gKiBAcGFyYW0gbmV3VmFsdWUgTmV3IHZhbHVlIG9mIGBjbGFzc05hbWVzYC5cbiAqL1xuZnVuY3Rpb24gcmVjb25jaWxlQ2xhc3NOYW1lcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50OiBSRWxlbWVudCwgb2xkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZykge1xuICBjb25zdCBpc1Byb2NlZHVyYWwgPSBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcik7XG4gIGNvbXB1dGVDbGFzc0NoYW5nZXMob2xkVmFsdWUsIG5ld1ZhbHVlKS5mb3JFYWNoKChjbGFzc1ZhbHVlLCBjbGFzc05hbWUpID0+IHtcbiAgICBpZiAoY2xhc3NWYWx1ZSA9PT0gdHJ1ZSkge1xuICAgICAgaWYgKGlzUHJvY2VkdXJhbCkge1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuYWRkQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChlbGVtZW50IGFzIEhUTUxFbGVtZW50KS5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICB9XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICB9IGVsc2UgaWYgKGNsYXNzVmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICBpZiAoaXNQcm9jZWR1cmFsKSB7XG4gICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5yZW1vdmVDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogV3JpdGVzIHRvIGBzdHlsZXNgIGJ5IGNvbXB1dGluZyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIGBvbGRWYWx1ZWAgYW5kIGBuZXdWYWx1ZWAgYW5kIHVzaW5nXG4gKiBgc3R5bGVzLnNldFByb3BlcnR5YCBhbmQgYHN0eWxlcy5yZW1vdmVQcm9wZXJ0eWAuXG4gKlxuICogTk9URTogS2VlcCB0aGlzIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gdGhhdCBgd3JpdGVBbmRSZWNvbmNpbGVTdHlsZWAgaXMgc21hbGwgYW5kIHN1YmplY3QgdG9cbiAqIGlubGluaW5nLiAoV2UgZXhwZWN0IHRoYXQgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCByYXJlbHkuKVxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2Ugd2hlbiB1cGRhdGluZyBET00uXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgRE9NIGVsZW1lbnQgdG8gdXBkYXRlLlxuICogQHBhcmFtIG9sZFZhbHVlIE9sZCB2YWx1ZSBvZiBgY2xhc3NOYW1lc2AuXG4gKiBAcGFyYW0gbmV3VmFsdWUgTmV3IHZhbHVlIG9mIGBjbGFzc05hbWVzYC5cbiAqL1xuZnVuY3Rpb24gcmVjb25jaWxlU3R5bGVOYW1lcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50OiBSRWxlbWVudCwgb2xkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZykge1xuICBjb25zdCBpc1Byb2NlZHVyYWwgPSBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcik7XG4gIGNvbnN0IGNoYW5nZXMgPSBjb21wdXRlU3R5bGVDaGFuZ2VzKG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gIGNoYW5nZXMuZm9yRWFjaCgoc3R5bGVWYWx1ZSwgc3R5bGVOYW1lKSA9PiB7XG4gICAgY29uc3QgbmV3VmFsdWUgPSBzdHlsZVZhbHVlLm5ldztcbiAgICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcbiAgICAgIGlmIChpc1Byb2NlZHVyYWwpIHtcbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnJlbW92ZVN0eWxlKGVsZW1lbnQsIHN0eWxlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoZWxlbWVudCBhcyBIVE1MRWxlbWVudCkuc3R5bGUucmVtb3ZlUHJvcGVydHkoc3R5bGVOYW1lKTtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgIH0gZWxzZSBpZiAoc3R5bGVWYWx1ZS5vbGQgIT09IG5ld1ZhbHVlKSB7XG4gICAgICBpZiAoaXNQcm9jZWR1cmFsKSB7XG4gICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5zZXRTdHlsZShlbGVtZW50LCBzdHlsZU5hbWUsIG5ld1ZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChlbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZS5zZXRQcm9wZXJ0eShzdHlsZU5hbWUsIG5ld1ZhbHVlKTtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgIH1cbiAgfSk7XG59XG4iXX0=