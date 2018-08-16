/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SimpleChange } from '../../change_detection/change_detection_util';
const PRIVATE_PREFIX = '__ngOnChanges_';
/**
 * The NgOnChangesFeature decorates a component with support for the ngOnChanges
 * lifecycle hook, so it should be included in any component that implements
 * that hook.
 *
 * If the component or directive uses inheritance, the NgOnChangesFeature MUST
 * be included as a feature AFTER {@link InheritDefinitionFeature}, otherwise
 * inherited properties will not be propagated to the ngOnChanges lifecycle
 * hook.
 *
 * Example usage:
 *
 * ```
 * static ngComponentDef = defineComponent({
 *   ...
 *   inputs: {name: 'publicName'},
 *   features: [NgOnChangesFeature]
 * });
 * ```
 */
export function NgOnChangesFeature(definition) {
    const declaredToMinifiedInputs = definition.declaredInputs;
    const proto = definition.type.prototype;
    for (const declaredName in declaredToMinifiedInputs) {
        if (declaredToMinifiedInputs.hasOwnProperty(declaredName)) {
            const minifiedKey = declaredToMinifiedInputs[declaredName];
            const privateMinKey = PRIVATE_PREFIX + minifiedKey;
            // Walk the prototype chain to see if we find a property descriptor
            // That way we can honor setters and getters that were inherited.
            let originalProperty = undefined;
            let checkProto = proto;
            while (!originalProperty && checkProto &&
                Object.getPrototypeOf(checkProto) !== Object.getPrototypeOf(Object.prototype)) {
                originalProperty = Object.getOwnPropertyDescriptor(checkProto, minifiedKey);
                checkProto = Object.getPrototypeOf(checkProto);
            }
            const getter = originalProperty && originalProperty.get;
            const setter = originalProperty && originalProperty.set;
            // create a getter and setter for property
            Object.defineProperty(proto, minifiedKey, {
                get: getter ||
                    (setter ? undefined : function () { return this[privateMinKey]; }),
                set(value) {
                    let simpleChanges = this[PRIVATE_PREFIX];
                    if (!simpleChanges) {
                        simpleChanges = {};
                        // Place where we will store SimpleChanges if there is a change
                        Object.defineProperty(this, PRIVATE_PREFIX, { value: simpleChanges, writable: true });
                    }
                    const isFirstChange = !this.hasOwnProperty(privateMinKey);
                    const currentChange = simpleChanges[declaredName];
                    if (currentChange) {
                        currentChange.currentValue = value;
                    }
                    else {
                        simpleChanges[declaredName] =
                            new SimpleChange(this[privateMinKey], value, isFirstChange);
                    }
                    if (isFirstChange) {
                        // Create a place where the actual value will be stored and make it non-enumerable
                        Object.defineProperty(this, privateMinKey, { value, writable: true });
                    }
                    else {
                        this[privateMinKey] = value;
                    }
                    if (setter)
                        setter.call(this, value);
                },
                // Make the property configurable in dev mode to allow overriding in tests
                configurable: !!ngDevMode
            });
        }
    }
    // If an onInit hook is defined, it will need to wrap the ngOnChanges call
    // so the call order is changes-init-check in creation mode. In subsequent
    // change detection runs, only the check wrapper will be called.
    if (definition.onInit != null) {
        definition.onInit = onChangesWrapper(definition.onInit);
    }
    definition.doCheck = onChangesWrapper(definition.doCheck);
}
function onChangesWrapper(delegateHook) {
    return function () {
        const simpleChanges = this[PRIVATE_PREFIX];
        if (simpleChanges != null) {
            this.ngOnChanges(simpleChanges);
            this[PRIVATE_PREFIX] = null;
        }
        if (delegateHook)
            delegateHook.apply(this);
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw4Q0FBOEMsQ0FBQztBQUkxRSxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQztBQVF4Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sNkJBQWdDLFVBQW1DO0lBQ3ZFLE1BQU0sd0JBQXdCLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQztJQUMzRCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QyxLQUFLLE1BQU0sWUFBWSxJQUFJLHdCQUF3QixFQUFFO1FBQ25ELElBQUksd0JBQXdCLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ3pELE1BQU0sV0FBVyxHQUFHLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNELE1BQU0sYUFBYSxHQUFHLGNBQWMsR0FBRyxXQUFXLENBQUM7WUFFbkQsbUVBQW1FO1lBQ25FLGlFQUFpRTtZQUNqRSxJQUFJLGdCQUFnQixHQUFpQyxTQUFTLENBQUM7WUFDL0QsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxVQUFVO2dCQUMvQixNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNwRixnQkFBZ0IsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUM1RSxVQUFVLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNoRDtZQUVELE1BQU0sTUFBTSxHQUFHLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLEdBQUcsQ0FBQztZQUN4RCxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7WUFFeEQsMENBQTBDO1lBQzFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRTtnQkFDeEMsR0FBRyxFQUFFLE1BQU07b0JBQ1AsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsY0FBbUMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNGLEdBQUcsQ0FBNEIsS0FBUTtvQkFDckMsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUN6QyxJQUFJLENBQUMsYUFBYSxFQUFFO3dCQUNsQixhQUFhLEdBQUcsRUFBRSxDQUFDO3dCQUNuQiwrREFBK0Q7d0JBQy9ELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7cUJBQ3JGO29CQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDMUQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUVsRCxJQUFJLGFBQWEsRUFBRTt3QkFDakIsYUFBYSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7cUJBQ3BDO3lCQUFNO3dCQUNMLGFBQWEsQ0FBQyxZQUFZLENBQUM7NEJBQ3ZCLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7cUJBQ2pFO29CQUVELElBQUksYUFBYSxFQUFFO3dCQUNqQixrRkFBa0Y7d0JBQ2xGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxFQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztxQkFDckU7eUJBQU07d0JBQ0wsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEtBQUssQ0FBQztxQkFDN0I7b0JBRUQsSUFBSSxNQUFNO3dCQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUNELDBFQUEwRTtnQkFDMUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxTQUFTO2FBQzFCLENBQUMsQ0FBQztTQUNKO0tBQ0Y7SUFFRCwwRUFBMEU7SUFDMUUsMEVBQTBFO0lBQzFFLGdFQUFnRTtJQUNoRSxJQUFJLFVBQVUsQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFFO1FBQzdCLFVBQVUsQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3pEO0lBRUQsVUFBVSxDQUFDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVELDBCQUEwQixZQUFpQztJQUN6RCxPQUFPO1FBQ0wsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzNDLElBQUksYUFBYSxJQUFJLElBQUksRUFBRTtZQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDN0I7UUFDRCxJQUFJLFlBQVk7WUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdDLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2ltcGxlQ2hhbmdlfSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb25fdXRpbCc7XG5pbXBvcnQge09uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlc30gZnJvbSAnLi4vLi4vbWV0YWRhdGEvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmSW50ZXJuYWx9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5cbmNvbnN0IFBSSVZBVEVfUFJFRklYID0gJ19fbmdPbkNoYW5nZXNfJztcblxudHlwZSBPbkNoYW5nZXNFeHBhbmRvID0gT25DaGFuZ2VzICYge1xuICBfX25nT25DaGFuZ2VzXzogU2ltcGxlQ2hhbmdlc3xudWxsfHVuZGVmaW5lZDtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueSBDYW4gaG9sZCBhbnkgdmFsdWVcbiAgW2tleTogc3RyaW5nXTogYW55O1xufTtcblxuLyoqXG4gKiBUaGUgTmdPbkNoYW5nZXNGZWF0dXJlIGRlY29yYXRlcyBhIGNvbXBvbmVudCB3aXRoIHN1cHBvcnQgZm9yIHRoZSBuZ09uQ2hhbmdlc1xuICogbGlmZWN5Y2xlIGhvb2ssIHNvIGl0IHNob3VsZCBiZSBpbmNsdWRlZCBpbiBhbnkgY29tcG9uZW50IHRoYXQgaW1wbGVtZW50c1xuICogdGhhdCBob29rLlxuICpcbiAqIElmIHRoZSBjb21wb25lbnQgb3IgZGlyZWN0aXZlIHVzZXMgaW5oZXJpdGFuY2UsIHRoZSBOZ09uQ2hhbmdlc0ZlYXR1cmUgTVVTVFxuICogYmUgaW5jbHVkZWQgYXMgYSBmZWF0dXJlIEFGVEVSIHtAbGluayBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmV9LCBvdGhlcndpc2VcbiAqIGluaGVyaXRlZCBwcm9wZXJ0aWVzIHdpbGwgbm90IGJlIHByb3BhZ2F0ZWQgdG8gdGhlIG5nT25DaGFuZ2VzIGxpZmVjeWNsZVxuICogaG9vay5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICpcbiAqIGBgYFxuICogc3RhdGljIG5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgLi4uXG4gKiAgIGlucHV0czoge25hbWU6ICdwdWJsaWNOYW1lJ30sXG4gKiAgIGZlYXR1cmVzOiBbTmdPbkNoYW5nZXNGZWF0dXJlXVxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE5nT25DaGFuZ2VzRmVhdHVyZTxUPihkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxUPik6IHZvaWQge1xuICBjb25zdCBkZWNsYXJlZFRvTWluaWZpZWRJbnB1dHMgPSBkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzO1xuICBjb25zdCBwcm90byA9IGRlZmluaXRpb24udHlwZS5wcm90b3R5cGU7XG4gIGZvciAoY29uc3QgZGVjbGFyZWROYW1lIGluIGRlY2xhcmVkVG9NaW5pZmllZElucHV0cykge1xuICAgIGlmIChkZWNsYXJlZFRvTWluaWZpZWRJbnB1dHMuaGFzT3duUHJvcGVydHkoZGVjbGFyZWROYW1lKSkge1xuICAgICAgY29uc3QgbWluaWZpZWRLZXkgPSBkZWNsYXJlZFRvTWluaWZpZWRJbnB1dHNbZGVjbGFyZWROYW1lXTtcbiAgICAgIGNvbnN0IHByaXZhdGVNaW5LZXkgPSBQUklWQVRFX1BSRUZJWCArIG1pbmlmaWVkS2V5O1xuXG4gICAgICAvLyBXYWxrIHRoZSBwcm90b3R5cGUgY2hhaW4gdG8gc2VlIGlmIHdlIGZpbmQgYSBwcm9wZXJ0eSBkZXNjcmlwdG9yXG4gICAgICAvLyBUaGF0IHdheSB3ZSBjYW4gaG9ub3Igc2V0dGVycyBhbmQgZ2V0dGVycyB0aGF0IHdlcmUgaW5oZXJpdGVkLlxuICAgICAgbGV0IG9yaWdpbmFsUHJvcGVydHk6IFByb3BlcnR5RGVzY3JpcHRvcnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgY2hlY2tQcm90byA9IHByb3RvO1xuICAgICAgd2hpbGUgKCFvcmlnaW5hbFByb3BlcnR5ICYmIGNoZWNrUHJvdG8gJiZcbiAgICAgICAgICAgICBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY2hlY2tQcm90bykgIT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QucHJvdG90eXBlKSkge1xuICAgICAgICBvcmlnaW5hbFByb3BlcnR5ID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihjaGVja1Byb3RvLCBtaW5pZmllZEtleSk7XG4gICAgICAgIGNoZWNrUHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY2hlY2tQcm90byk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGdldHRlciA9IG9yaWdpbmFsUHJvcGVydHkgJiYgb3JpZ2luYWxQcm9wZXJ0eS5nZXQ7XG4gICAgICBjb25zdCBzZXR0ZXIgPSBvcmlnaW5hbFByb3BlcnR5ICYmIG9yaWdpbmFsUHJvcGVydHkuc2V0O1xuXG4gICAgICAvLyBjcmVhdGUgYSBnZXR0ZXIgYW5kIHNldHRlciBmb3IgcHJvcGVydHlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgbWluaWZpZWRLZXksIHtcbiAgICAgICAgZ2V0OiBnZXR0ZXIgfHxcbiAgICAgICAgICAgIChzZXR0ZXIgPyB1bmRlZmluZWQgOiBmdW5jdGlvbih0aGlzOiBPbkNoYW5nZXNFeHBhbmRvKSB7IHJldHVybiB0aGlzW3ByaXZhdGVNaW5LZXldOyB9KSxcbiAgICAgICAgc2V0PFQ+KHRoaXM6IE9uQ2hhbmdlc0V4cGFuZG8sIHZhbHVlOiBUKSB7XG4gICAgICAgICAgbGV0IHNpbXBsZUNoYW5nZXMgPSB0aGlzW1BSSVZBVEVfUFJFRklYXTtcbiAgICAgICAgICBpZiAoIXNpbXBsZUNoYW5nZXMpIHtcbiAgICAgICAgICAgIHNpbXBsZUNoYW5nZXMgPSB7fTtcbiAgICAgICAgICAgIC8vIFBsYWNlIHdoZXJlIHdlIHdpbGwgc3RvcmUgU2ltcGxlQ2hhbmdlcyBpZiB0aGVyZSBpcyBhIGNoYW5nZVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFBSSVZBVEVfUFJFRklYLCB7dmFsdWU6IHNpbXBsZUNoYW5nZXMsIHdyaXRhYmxlOiB0cnVlfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgaXNGaXJzdENoYW5nZSA9ICF0aGlzLmhhc093blByb3BlcnR5KHByaXZhdGVNaW5LZXkpO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRDaGFuZ2UgPSBzaW1wbGVDaGFuZ2VzW2RlY2xhcmVkTmFtZV07XG5cbiAgICAgICAgICBpZiAoY3VycmVudENoYW5nZSkge1xuICAgICAgICAgICAgY3VycmVudENoYW5nZS5jdXJyZW50VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2ltcGxlQ2hhbmdlc1tkZWNsYXJlZE5hbWVdID1cbiAgICAgICAgICAgICAgICBuZXcgU2ltcGxlQ2hhbmdlKHRoaXNbcHJpdmF0ZU1pbktleV0sIHZhbHVlLCBpc0ZpcnN0Q2hhbmdlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaXNGaXJzdENoYW5nZSkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgcGxhY2Ugd2hlcmUgdGhlIGFjdHVhbCB2YWx1ZSB3aWxsIGJlIHN0b3JlZCBhbmQgbWFrZSBpdCBub24tZW51bWVyYWJsZVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIHByaXZhdGVNaW5LZXksIHt2YWx1ZSwgd3JpdGFibGU6IHRydWV9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpc1twcml2YXRlTWluS2V5XSA9IHZhbHVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzZXR0ZXIpIHNldHRlci5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICAgICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYW4gb25Jbml0IGhvb2sgaXMgZGVmaW5lZCwgaXQgd2lsbCBuZWVkIHRvIHdyYXAgdGhlIG5nT25DaGFuZ2VzIGNhbGxcbiAgLy8gc28gdGhlIGNhbGwgb3JkZXIgaXMgY2hhbmdlcy1pbml0LWNoZWNrIGluIGNyZWF0aW9uIG1vZGUuIEluIHN1YnNlcXVlbnRcbiAgLy8gY2hhbmdlIGRldGVjdGlvbiBydW5zLCBvbmx5IHRoZSBjaGVjayB3cmFwcGVyIHdpbGwgYmUgY2FsbGVkLlxuICBpZiAoZGVmaW5pdGlvbi5vbkluaXQgIT0gbnVsbCkge1xuICAgIGRlZmluaXRpb24ub25Jbml0ID0gb25DaGFuZ2VzV3JhcHBlcihkZWZpbml0aW9uLm9uSW5pdCk7XG4gIH1cblxuICBkZWZpbml0aW9uLmRvQ2hlY2sgPSBvbkNoYW5nZXNXcmFwcGVyKGRlZmluaXRpb24uZG9DaGVjayk7XG59XG5cbmZ1bmN0aW9uIG9uQ2hhbmdlc1dyYXBwZXIoZGVsZWdhdGVIb29rOiAoKCkgPT4gdm9pZCkgfCBudWxsKSB7XG4gIHJldHVybiBmdW5jdGlvbih0aGlzOiBPbkNoYW5nZXNFeHBhbmRvKSB7XG4gICAgY29uc3Qgc2ltcGxlQ2hhbmdlcyA9IHRoaXNbUFJJVkFURV9QUkVGSVhdO1xuICAgIGlmIChzaW1wbGVDaGFuZ2VzICE9IG51bGwpIHtcbiAgICAgIHRoaXMubmdPbkNoYW5nZXMoc2ltcGxlQ2hhbmdlcyk7XG4gICAgICB0aGlzW1BSSVZBVEVfUFJFRklYXSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChkZWxlZ2F0ZUhvb2spIGRlbGVnYXRlSG9vay5hcHBseSh0aGlzKTtcbiAgfTtcbn1cbiJdfQ==