/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/reconcile.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @param {?} renderer Renderer to use
 * @param {?} element The element which needs to be updated.
 * @param {?} expectedValue The expected (previous/old) value of the class list which we will use to
 *        check if out of bounds modification has happened to the `element`.
 * @param {?} newValue The new class list to write.
 * @return {?}
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
 * @param {?} renderer Renderer to use
 * @param {?} element The element which needs to be updated.
 * @param {?} expectedValue The expected (previous/old) value of the class list to write.
 * @param {?} newValue The new class list to write
 * @return {?}
 */
export function writeAndReconcileStyle(renderer, element, expectedValue, newValue) {
    /** @type {?} */
    const style = ((/** @type {?} */ (element))).style;
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
 * @param {?} renderer Renderer to use when updating DOM.
 * @param {?} element The native element to update.
 * @param {?} oldValue Old value of `classNames`.
 * @param {?} newValue New value of `classNames`.
 * @return {?}
 */
function reconcileClassNames(renderer, element, oldValue, newValue) {
    /** @type {?} */
    const isProcedural = isProceduralRenderer(renderer);
    computeClassChanges(oldValue, newValue).forEach((/**
     * @param {?} classValue
     * @param {?} className
     * @return {?}
     */
    (classValue, className) => {
        if (classValue === true) {
            if (isProcedural) {
                ((/** @type {?} */ (renderer))).addClass(element, className);
            }
            else {
                ((/** @type {?} */ (element))).classList.add(className);
            }
            ngDevMode && ngDevMode.rendererAddClass++;
        }
        else if (classValue === false) {
            if (isProcedural) {
                ((/** @type {?} */ (renderer))).removeClass(element, className);
            }
            else {
                ((/** @type {?} */ (element))).classList.remove(className);
            }
            ngDevMode && ngDevMode.rendererRemoveClass++;
        }
    }));
}
/**
 * Writes to `styles` by computing the difference between `oldValue` and `newValue` and using
 * `styles.setProperty` and `styles.removeProperty`.
 *
 * NOTE: Keep this a separate function so that `writeAndReconcileStyle` is small and subject to
 * inlining. (We expect that this function will be called rarely.)
 *
 * @param {?} renderer Renderer to use when updating DOM.
 * @param {?} element The DOM element to update.
 * @param {?} oldValue Old value of `classNames`.
 * @param {?} newValue New value of `classNames`.
 * @return {?}
 */
function reconcileStyleNames(renderer, element, oldValue, newValue) {
    /** @type {?} */
    const isProcedural = isProceduralRenderer(renderer);
    /** @type {?} */
    const changes = computeStyleChanges(oldValue, newValue);
    changes.forEach((/**
     * @param {?} styleValue
     * @param {?} styleName
     * @return {?}
     */
    (styleValue, styleName) => {
        /** @type {?} */
        const newValue = styleValue.new;
        if (newValue === null) {
            if (isProcedural) {
                ((/** @type {?} */ (renderer))).removeStyle(element, styleName);
            }
            else {
                ((/** @type {?} */ (element))).style.removeProperty(styleName);
            }
            ngDevMode && ngDevMode.rendererRemoveStyle++;
        }
        else if (styleValue.old !== newValue) {
            if (isProcedural) {
                ((/** @type {?} */ (renderer))).setStyle(element, styleName, newValue);
            }
            else {
                ((/** @type {?} */ (element))).style.setProperty(styleName, newValue);
            }
            ngDevMode && ngDevMode.rendererSetStyle++;
        }
    }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb25jaWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3JlY29uY2lsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQTJDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdEcsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlDbkQsTUFBTSxVQUFVLHNCQUFzQixDQUNsQyxRQUFtQixFQUFFLE9BQWlCLEVBQUUsYUFBcUIsRUFBRSxRQUFnQjtJQUNqRixJQUFJLE9BQU8sQ0FBQyxTQUFTLEtBQUssYUFBYSxFQUFFO1FBQ3ZDLDRGQUE0RjtRQUM1RixJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNuRDthQUFNO1lBQ0wsT0FBTyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7U0FDOUI7UUFDRCxTQUFTLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7S0FDL0M7U0FBTTtRQUNMLDhGQUE4RjtRQUM5Rix5REFBeUQ7UUFDekQsbUJBQW1CLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDakU7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE4QkQsTUFBTSxVQUFVLHNCQUFzQixDQUNsQyxRQUFtQixFQUFFLE9BQWlCLEVBQUUsYUFBcUIsRUFBRSxRQUFnQjs7VUFDM0UsS0FBSyxHQUFHLENBQUMsbUJBQUEsT0FBTyxF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LEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDMUU7aUJBQU07Z0JBQ0wsQ0FBQyxtQkFBQSxPQUFPLEVBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ2pFO1lBQ0QsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1NBQzNDO0lBQ0gsQ0FBQyxFQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuXG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Y29tcHV0ZUNsYXNzQ2hhbmdlc30gZnJvbSAnLi9jbGFzc19kaWZmZXInO1xuaW1wb3J0IHtjb21wdXRlU3R5bGVDaGFuZ2VzfSBmcm9tICcuL3N0eWxlX2RpZmZlcic7XG5cbi8qKlxuICogV3JpdGVzIG5ldyBgY2xhc3NOYW1lYCB2YWx1ZSBpbiB0aGUgRE9NIG5vZGUuXG4gKlxuICogSW4gaXRzIHNpbXBsZXN0IGZvcm0gdGhpcyBmdW5jdGlvbiBqdXN0IHdyaXRlcyB0aGUgYG5ld1ZhbHVlYCBpbnRvIHRoZSBgZWxlbWVudC5jbGFzc05hbWVgXG4gKiBwcm9wZXJ0eS5cbiAqXG4gKiBIb3dldmVyLCB1bmRlciBzb21lIGNpcmN1bXN0YW5jZXMgdGhpcyBpcyBtb3JlIGNvbXBsZXggYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlciBjb2RlIHdoaWNoXG4gKiBoYXMgYWRkZWQgYGNsYXNzYCBpbmZvcm1hdGlvbiB0byB0aGUgRE9NIGVsZW1lbnQuIEluIHN1Y2ggYSBjYXNlIHdyaXRpbmcgb3VyIG5ldyB2YWx1ZSB3b3VsZFxuICogY2xvYmJlciB3aGF0IGlzIGFscmVhZHkgb24gdGhlIGVsZW1lbnQgYW5kIHdvdWxkIHJlc3VsdCBpbiBpbmNvcnJlY3QgYmVoYXZpb3IuXG4gKlxuICogVG8gc29sdmUgdGhlIGFib3ZlIHRoZSBmdW5jdGlvbiBmaXJzdCByZWFkcyB0aGUgYGVsZW1lbnQuY2xhc3NOYW1lYCB0byBzZWUgaWYgaXQgbWF0Y2hlcyB0aGVcbiAqIGBleHBlY3RlZFZhbHVlYC4gKEluIG91ciBjYXNlIGBleHBlY3RlZFZhbHVlYCBpcyBqdXN0IGxhc3QgdmFsdWUgd3JpdHRlbiBpbnRvIHRoZSBET00uKSBJbiB0aGlzXG4gKiB3YXkgd2UgY2FuIGRldGVjdCB0byBzZWUgaWYgYW55b25lIGhhcyBtb2RpZmllZCB0aGUgRE9NIHNpbmNlIG91ciBsYXN0IHdyaXRlLlxuICogLSBJZiB3ZSBkZXRlY3Qgbm8gY2hhbmdlIHdlIHNpbXBseSB3cml0ZTogYGVsZW1lbnQuY2xhc3NOYW1lID0gbmV3VmFsdWVgLlxuICogLSBJZiB3ZSBkbyBkZXRlY3QgY2hhbmdlIHRoZW4gd2UgY29tcHV0ZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBgZXhwZWN0ZWRWYWx1ZWAgYW5kXG4gKiBgbmV3VmFsdWVgIGFuZCB0aGVuIHVzZSBgZWxlbWVudC5jbGFzc0xpc3QuYWRkYCBhbmQgYGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZWAgdG8gbW9kaWZ5IHRoZVxuICogRE9NLlxuICpcbiAqIE5PVEU6IFNvbWUgcGxhdGZvcm1zIChzdWNoIGFzIE5hdGl2ZVNjcmlwdCBhbmQgV2ViV29ya2Vycykgd2lsbCBub3QgaGF2ZSBgZWxlbWVudC5jbGFzc05hbWVgXG4gKiBhdmFpbGFibGUgYW5kIHJlYWRpbmcgdGhlIHZhbHVlIHdpbGwgcmVzdWx0IGluIGB1bmRlZmluZWRgLiBUaGlzIG1lYW5zIHRoYXQgZm9yIHRob3NlIHBsYXRmb3Jtc1xuICogd2Ugd2lsbCBhbHdheXMgZmFpbCB0aGUgY2hlY2sgYW5kIHdpbGwgYWx3YXlzIHVzZSAgYGVsZW1lbnQuY2xhc3NMaXN0LmFkZGAgYW5kXG4gKiBgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlYCB0byBtb2RpZnkgdGhlIGBlbGVtZW50YC4gKEEgZ29vZCBtZW50YWwgbW9kZWwgaXMgdGhhdCB3ZSBjYW4gZG9cbiAqIGBlbGVtZW50LmNsYXNzTmFtZSA9PT0gZXhwZWN0ZWRWYWx1ZWAgYnV0IHdlIG1heSBuZXZlciBrbm93IHRoZSBhY3R1YWwgdmFsdWUgb2ZcbiAqIGBlbGVtZW50LmNsYXNzTmFtZWApXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgd2hpY2ggbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSBleHBlY3RlZFZhbHVlIFRoZSBleHBlY3RlZCAocHJldmlvdXMvb2xkKSB2YWx1ZSBvZiB0aGUgY2xhc3MgbGlzdCB3aGljaCB3ZSB3aWxsIHVzZSB0b1xuICogICAgICAgIGNoZWNrIGlmIG91dCBvZiBib3VuZHMgbW9kaWZpY2F0aW9uIGhhcyBoYXBwZW5lZCB0byB0aGUgYGVsZW1lbnRgLlxuICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgY2xhc3MgbGlzdCB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlQW5kUmVjb25jaWxlQ2xhc3MoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgZWxlbWVudDogUkVsZW1lbnQsIGV4cGVjdGVkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBpZiAoZWxlbWVudC5jbGFzc05hbWUgPT09IGV4cGVjdGVkVmFsdWUpIHtcbiAgICAvLyBUaGlzIGlzIHRoZSBzaW1wbGUvZmFzdCBjYXNlIHdoZXJlIG5vIG9uZSBoYXMgd3JpdHRlbiBpbnRvIGVsZW1lbnQgd2l0aG91dCBvdXIga25vd2xlZGdlLlxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCAnY2xhc3MnLCBuZXdWYWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gbmV3VmFsdWU7XG4gICAgfVxuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRDbGFzc05hbWUrKztcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgZXhwZWN0ZWQgdmFsdWUgaXMgbm90IHRoZSBzYW1lIGFzIGxhc3QgdmFsdWUuIFNvbWV0aGluZyBjaGFuZ2VkIHRoZSBET00gZWxlbWVudCB3aXRob3V0XG4gICAgLy8gb3VyIGtub3dsZWRnZSBzbyB3ZSBuZWVkIHRvIGRvIHJlY29uY2lsaWF0aW9uIGluc3RlYWQuXG4gICAgcmVjb25jaWxlQ2xhc3NOYW1lcyhyZW5kZXJlciwgZWxlbWVudCwgZXhwZWN0ZWRWYWx1ZSwgbmV3VmFsdWUpO1xuICB9XG59XG5cbi8qKlxuKiBXcml0ZXMgbmV3IGBjc3NUZXh0YCB2YWx1ZSBpbiB0aGUgRE9NIG5vZGUuXG4qXG4qIEluIGl0cyBzaW1wbGVzdCBmb3JtIHRoaXMgZnVuY3Rpb24ganVzdCB3cml0ZXMgdGhlIGBuZXdWYWx1ZWAgaW50byB0aGUgYGVsZW1lbnQuc3R5bGUuY3NzVGV4dGBcbiogcHJvcGVydHkuXG4qXG4qIEhvd2V2ZXIsIHVuZGVyIHNvbWUgY2lyY3Vtc3RhbmNlcyB0aGlzIGlzIG1vcmUgY29tcGxleCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyIGNvZGUgd2hpY2hcbiogaGFzIGFkZGVkIGBzdHlsZWAgaW5mb3JtYXRpb24gdG8gdGhlIERPTSBlbGVtZW50LiBJbiBzdWNoIGEgY2FzZSB3cml0aW5nIG91ciBuZXcgdmFsdWUgd291bGRcbiogY2xvYmJlciB3aGF0IGlzIGFscmVhZHkgb24gdGhlIGVsZW1lbnQgYW5kIHdvdWxkIHJlc3VsdCBpbiBpbmNvcnJlY3QgYmVoYXZpb3IuXG4qXG4qIFRvIHNvbHZlIHRoZSBhYm92ZSB0aGUgZnVuY3Rpb24gZmlyc3QgcmVhZHMgdGhlIGBlbGVtZW50LnN0eWxlLmNzc1RleHRgIHRvIHNlZSBpZiBpdCBtYXRjaGVzIHRoZVxuKiBgZXhwZWN0ZWRWYWx1ZWAuIChJbiBvdXIgY2FzZSBgZXhwZWN0ZWRWYWx1ZWAgaXMganVzdCBsYXN0IHZhbHVlIHdyaXR0ZW4gaW50byB0aGUgRE9NLikgSW4gdGhpc1xuKiB3YXkgd2UgY2FuIGRldGVjdCB0byBzZWUgaWYgYW55b25lIGhhcyBtb2RpZmllZCB0aGUgRE9NIHNpbmNlIG91ciBsYXN0IHdyaXRlLlxuKiAtIElmIHdlIGRldGVjdCBubyBjaGFuZ2Ugd2Ugc2ltcGx5IHdyaXRlOiBgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gbmV3VmFsdWVgXG4qIC0gSWYgd2UgZG8gZGV0ZWN0IGNoYW5nZSB0aGVuIHdlIGNvbXB1dGUgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgYGV4cGVjdGVkVmFsdWVgIGFuZFxuKiBgbmV3VmFsdWVgIGFuZCB0aGVuIHVzZSBgZWxlbWVudC5zdHlsZVtwcm9wZXJ0eV1gIHRvIG1vZGlmeSB0aGUgRE9NLlxuKlxuKiBOT1RFOiBTb21lIHBsYXRmb3JtcyAoc3VjaCBhcyBOYXRpdmVTY3JpcHQgYW5kIFdlYldvcmtlcnMpIHdpbGwgbm90IGhhdmUgYGVsZW1lbnQuc3R5bGVgXG4qIGF2YWlsYWJsZSBhbmQgcmVhZGluZyB0aGUgdmFsdWUgd2lsbCByZXN1bHQgaW4gYHVuZGVmaW5lZGAgVGhpcyBtZWFucyB0aGF0IGZvciB0aG9zZSBwbGF0Zm9ybXMgd2Vcbiogd2lsbCBhbHdheXMgZmFpbCB0aGUgY2hlY2sgYW5kIHdpbGwgYWx3YXlzIHVzZSAgYGVsZW1lbnQuc3R5bGVbcHJvcGVydHldYCB0b1xuKiBtb2RpZnkgdGhlIGBlbGVtZW50YC4gKEEgZ29vZCBtZW50YWwgbW9kZWwgaXMgdGhhdCB3ZSBjYW4gZG8gYGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9PT1cbiogZXhwZWN0ZWRWYWx1ZWAgYnV0IHdlIG1heSBuZXZlciBrbm93IHRoZSBhY3R1YWwgdmFsdWUgb2YgYGVsZW1lbnQuc3R5bGUuY3NzVGV4dGApXG4qXG4qIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgd2hpY2ggbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiogQHBhcmFtIGV4cGVjdGVkVmFsdWUgVGhlIGV4cGVjdGVkIChwcmV2aW91cy9vbGQpIHZhbHVlIG9mIHRoZSBjbGFzcyBsaXN0IHRvIHdyaXRlLlxuKiBAcGFyYW0gbmV3VmFsdWUgVGhlIG5ldyBjbGFzcyBsaXN0IHRvIHdyaXRlXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlQW5kUmVjb25jaWxlU3R5bGUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgZWxlbWVudDogUkVsZW1lbnQsIGV4cGVjdGVkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBzdHlsZSA9IChlbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZTtcbiAgaWYgKHN0eWxlICE9IG51bGwgJiYgc3R5bGUuY3NzVGV4dCA9PT0gZXhwZWN0ZWRWYWx1ZSkge1xuICAgIC8vIFRoaXMgaXMgdGhlIHNpbXBsZS9mYXN0IGNhc2Ugd2hlcmUgbm8gb25lIGhhcyB3cml0dGVuIGludG8gZWxlbWVudCB3aXRob3V0IG91ciBrbm93bGVkZ2UuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsICdzdHlsZScsIG5ld1ZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGUuY3NzVGV4dCA9IG5ld1ZhbHVlO1xuICAgIH1cbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3NzVGV4dCsrO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBleHBlY3RlZCB2YWx1ZSBpcyBub3QgdGhlIHNhbWUgYXMgbGFzdCB2YWx1ZS4gU29tZXRoaW5nIGNoYW5nZWQgdGhlIERPTSBlbGVtZW50IHdpdGhvdXRcbiAgICAvLyBvdXIga25vd2xlZGdlIHNvIHdlIG5lZWQgdG8gZG8gcmVjb25jaWxpYXRpb24gaW5zdGVhZC5cbiAgICByZWNvbmNpbGVTdHlsZU5hbWVzKHJlbmRlcmVyLCBlbGVtZW50LCBleHBlY3RlZFZhbHVlLCBuZXdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZXMgdG8gYGNsYXNzTmFtZXNgIGJ5IGNvbXB1dGluZyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIGBvbGRWYWx1ZWAgYW5kIGBuZXdWYWx1ZWAgYW5kIHVzaW5nXG4gKiBgY2xhc3NMaXN0LmFkZGAgYW5kIGBjbGFzc0xpc3QucmVtb3ZlYC5cbiAqXG4gKiBOT1RFOiBLZWVwIHRoaXMgYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGB3cml0ZUFuZFJlY29uY2lsZUNsYXNzYCBpcyBzbWFsbCBhbmQgc3ViamVjdCB0b1xuICogaW5saW5pbmcuIChXZSBleHBlY3QgdGhhdCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHJhcmVseS4pXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZSB3aGVuIHVwZGF0aW5nIERPTS5cbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBuYXRpdmUgZWxlbWVudCB0byB1cGRhdGUuXG4gKiBAcGFyYW0gb2xkVmFsdWUgT2xkIHZhbHVlIG9mIGBjbGFzc05hbWVzYC5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBOZXcgdmFsdWUgb2YgYGNsYXNzTmFtZXNgLlxuICovXG5mdW5jdGlvbiByZWNvbmNpbGVDbGFzc05hbWVzKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBvbGRWYWx1ZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IGlzUHJvY2VkdXJhbCA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgY29tcHV0ZUNsYXNzQ2hhbmdlcyhvbGRWYWx1ZSwgbmV3VmFsdWUpLmZvckVhY2goKGNsYXNzVmFsdWUsIGNsYXNzTmFtZSkgPT4ge1xuICAgIGlmIChjbGFzc1ZhbHVlID09PSB0cnVlKSB7XG4gICAgICBpZiAoaXNQcm9jZWR1cmFsKSB7XG4gICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5hZGRDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgIH0gZWxzZSBpZiAoY2xhc3NWYWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgIGlmIChpc1Byb2NlZHVyYWwpIHtcbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoZWxlbWVudCBhcyBIVE1MRWxlbWVudCkuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgfVxuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBXcml0ZXMgdG8gYHN0eWxlc2AgYnkgY29tcHV0aW5nIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gYG9sZFZhbHVlYCBhbmQgYG5ld1ZhbHVlYCBhbmQgdXNpbmdcbiAqIGBzdHlsZXMuc2V0UHJvcGVydHlgIGFuZCBgc3R5bGVzLnJlbW92ZVByb3BlcnR5YC5cbiAqXG4gKiBOT1RFOiBLZWVwIHRoaXMgYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGB3cml0ZUFuZFJlY29uY2lsZVN0eWxlYCBpcyBzbWFsbCBhbmQgc3ViamVjdCB0b1xuICogaW5saW5pbmcuIChXZSBleHBlY3QgdGhhdCB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHJhcmVseS4pXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZSB3aGVuIHVwZGF0aW5nIERPTS5cbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBET00gZWxlbWVudCB0byB1cGRhdGUuXG4gKiBAcGFyYW0gb2xkVmFsdWUgT2xkIHZhbHVlIG9mIGBjbGFzc05hbWVzYC5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBOZXcgdmFsdWUgb2YgYGNsYXNzTmFtZXNgLlxuICovXG5mdW5jdGlvbiByZWNvbmNpbGVTdHlsZU5hbWVzKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBvbGRWYWx1ZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IGlzUHJvY2VkdXJhbCA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgY29uc3QgY2hhbmdlcyA9IGNvbXB1dGVTdHlsZUNoYW5nZXMob2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgY2hhbmdlcy5mb3JFYWNoKChzdHlsZVZhbHVlLCBzdHlsZU5hbWUpID0+IHtcbiAgICBjb25zdCBuZXdWYWx1ZSA9IHN0eWxlVmFsdWUubmV3O1xuICAgIGlmIChuZXdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgaWYgKGlzUHJvY2VkdXJhbCkge1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykucmVtb3ZlU3R5bGUoZWxlbWVudCwgc3R5bGVOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChlbGVtZW50IGFzIEhUTUxFbGVtZW50KS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShzdHlsZU5hbWUpO1xuICAgICAgfVxuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgfSBlbHNlIGlmIChzdHlsZVZhbHVlLm9sZCAhPT0gbmV3VmFsdWUpIHtcbiAgICAgIGlmIChpc1Byb2NlZHVyYWwpIHtcbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnNldFN0eWxlKGVsZW1lbnQsIHN0eWxlTmFtZSwgbmV3VmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnNldFByb3BlcnR5KHN0eWxlTmFtZSwgbmV3VmFsdWUpO1xuICAgICAgfVxuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==