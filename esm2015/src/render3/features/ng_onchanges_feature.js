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
                }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw4Q0FBOEMsQ0FBQztBQUkxRSxNQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQztBQVF4Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sNkJBQWdDLFVBQW1DO0lBQ3ZFLE1BQU0sd0JBQXdCLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQztJQUMzRCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QyxLQUFLLE1BQU0sWUFBWSxJQUFJLHdCQUF3QixFQUFFO1FBQ25ELElBQUksd0JBQXdCLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ3pELE1BQU0sV0FBVyxHQUFHLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNELE1BQU0sYUFBYSxHQUFHLGNBQWMsR0FBRyxXQUFXLENBQUM7WUFFbkQsbUVBQW1FO1lBQ25FLGlFQUFpRTtZQUNqRSxJQUFJLGdCQUFnQixHQUFpQyxTQUFTLENBQUM7WUFDL0QsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLE9BQU8sQ0FBQyxnQkFBZ0IsSUFBSSxVQUFVO2dCQUMvQixNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNwRixnQkFBZ0IsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUM1RSxVQUFVLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNoRDtZQUVELE1BQU0sTUFBTSxHQUFHLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLEdBQUcsQ0FBQztZQUN4RCxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7WUFFeEQsMENBQTBDO1lBQzFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRTtnQkFDeEMsR0FBRyxFQUFFLE1BQU07b0JBQ1AsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsY0FBbUMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNGLEdBQUcsQ0FBNEIsS0FBUTtvQkFDckMsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUN6QyxJQUFJLENBQUMsYUFBYSxFQUFFO3dCQUNsQixhQUFhLEdBQUcsRUFBRSxDQUFDO3dCQUNuQiwrREFBK0Q7d0JBQy9ELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7cUJBQ3JGO29CQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDMUQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUVsRCxJQUFJLGFBQWEsRUFBRTt3QkFDakIsYUFBYSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7cUJBQ3BDO3lCQUFNO3dCQUNMLGFBQWEsQ0FBQyxZQUFZLENBQUM7NEJBQ3ZCLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7cUJBQ2pFO29CQUVELElBQUksYUFBYSxFQUFFO3dCQUNqQixrRkFBa0Y7d0JBQ2xGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxFQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztxQkFDckU7eUJBQU07d0JBQ0wsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEtBQUssQ0FBQztxQkFDN0I7b0JBRUQsSUFBSSxNQUFNO3dCQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1NBQ0o7S0FDRjtJQUVELDBFQUEwRTtJQUMxRSwwRUFBMEU7SUFDMUUsZ0VBQWdFO0lBQ2hFLElBQUksVUFBVSxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUU7UUFDN0IsVUFBVSxDQUFDLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDekQ7SUFFRCxVQUFVLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQsMEJBQTBCLFlBQWlDO0lBQ3pELE9BQU87UUFDTCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDM0MsSUFBSSxhQUFhLElBQUksSUFBSSxFQUFFO1lBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUM3QjtRQUNELElBQUksWUFBWTtZQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0MsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTaW1wbGVDaGFuZ2V9IGZyb20gJy4uLy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcbmltcG9ydCB7T25DaGFuZ2VzLCBTaW1wbGVDaGFuZ2VzfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZJbnRlcm5hbH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuY29uc3QgUFJJVkFURV9QUkVGSVggPSAnX19uZ09uQ2hhbmdlc18nO1xuXG50eXBlIE9uQ2hhbmdlc0V4cGFuZG8gPSBPbkNoYW5nZXMgJiB7XG4gIF9fbmdPbkNoYW5nZXNfOiBTaW1wbGVDaGFuZ2VzfG51bGx8dW5kZWZpbmVkO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55IENhbiBob2xkIGFueSB2YWx1ZVxuICBba2V5OiBzdHJpbmddOiBhbnk7XG59O1xuXG4vKipcbiAqIFRoZSBOZ09uQ2hhbmdlc0ZlYXR1cmUgZGVjb3JhdGVzIGEgY29tcG9uZW50IHdpdGggc3VwcG9ydCBmb3IgdGhlIG5nT25DaGFuZ2VzXG4gKiBsaWZlY3ljbGUgaG9vaywgc28gaXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIGFueSBjb21wb25lbnQgdGhhdCBpbXBsZW1lbnRzXG4gKiB0aGF0IGhvb2suXG4gKlxuICogSWYgdGhlIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgdXNlcyBpbmhlcml0YW5jZSwgdGhlIE5nT25DaGFuZ2VzRmVhdHVyZSBNVVNUXG4gKiBiZSBpbmNsdWRlZCBhcyBhIGZlYXR1cmUgQUZURVIge0BsaW5rIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZX0sIG90aGVyd2lzZVxuICogaW5oZXJpdGVkIHByb3BlcnRpZXMgd2lsbCBub3QgYmUgcHJvcGFnYXRlZCB0byB0aGUgbmdPbkNoYW5nZXMgbGlmZWN5Y2xlXG4gKiBob29rLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKlxuICogYGBgXG4gKiBzdGF0aWMgbmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAuLi5cbiAqICAgaW5wdXRzOiB7bmFtZTogJ3B1YmxpY05hbWUnfSxcbiAqICAgZmVhdHVyZXM6IFtOZ09uQ2hhbmdlc0ZlYXR1cmVdXG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gTmdPbkNoYW5nZXNGZWF0dXJlPFQ+KGRlZmluaXRpb246IERpcmVjdGl2ZURlZkludGVybmFsPFQ+KTogdm9pZCB7XG4gIGNvbnN0IGRlY2xhcmVkVG9NaW5pZmllZElucHV0cyA9IGRlZmluaXRpb24uZGVjbGFyZWRJbnB1dHM7XG4gIGNvbnN0IHByb3RvID0gZGVmaW5pdGlvbi50eXBlLnByb3RvdHlwZTtcbiAgZm9yIChjb25zdCBkZWNsYXJlZE5hbWUgaW4gZGVjbGFyZWRUb01pbmlmaWVkSW5wdXRzKSB7XG4gICAgaWYgKGRlY2xhcmVkVG9NaW5pZmllZElucHV0cy5oYXNPd25Qcm9wZXJ0eShkZWNsYXJlZE5hbWUpKSB7XG4gICAgICBjb25zdCBtaW5pZmllZEtleSA9IGRlY2xhcmVkVG9NaW5pZmllZElucHV0c1tkZWNsYXJlZE5hbWVdO1xuICAgICAgY29uc3QgcHJpdmF0ZU1pbktleSA9IFBSSVZBVEVfUFJFRklYICsgbWluaWZpZWRLZXk7XG5cbiAgICAgIC8vIFdhbGsgdGhlIHByb3RvdHlwZSBjaGFpbiB0byBzZWUgaWYgd2UgZmluZCBhIHByb3BlcnR5IGRlc2NyaXB0b3JcbiAgICAgIC8vIFRoYXQgd2F5IHdlIGNhbiBob25vciBzZXR0ZXJzIGFuZCBnZXR0ZXJzIHRoYXQgd2VyZSBpbmhlcml0ZWQuXG4gICAgICBsZXQgb3JpZ2luYWxQcm9wZXJ0eTogUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBjaGVja1Byb3RvID0gcHJvdG87XG4gICAgICB3aGlsZSAoIW9yaWdpbmFsUHJvcGVydHkgJiYgY2hlY2tQcm90byAmJlxuICAgICAgICAgICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZihjaGVja1Byb3RvKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5wcm90b3R5cGUpKSB7XG4gICAgICAgIG9yaWdpbmFsUHJvcGVydHkgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGNoZWNrUHJvdG8sIG1pbmlmaWVkS2V5KTtcbiAgICAgICAgY2hlY2tQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihjaGVja1Byb3RvKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZ2V0dGVyID0gb3JpZ2luYWxQcm9wZXJ0eSAmJiBvcmlnaW5hbFByb3BlcnR5LmdldDtcbiAgICAgIGNvbnN0IHNldHRlciA9IG9yaWdpbmFsUHJvcGVydHkgJiYgb3JpZ2luYWxQcm9wZXJ0eS5zZXQ7XG5cbiAgICAgIC8vIGNyZWF0ZSBhIGdldHRlciBhbmQgc2V0dGVyIGZvciBwcm9wZXJ0eVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLCBtaW5pZmllZEtleSwge1xuICAgICAgICBnZXQ6IGdldHRlciB8fFxuICAgICAgICAgICAgKHNldHRlciA/IHVuZGVmaW5lZCA6IGZ1bmN0aW9uKHRoaXM6IE9uQ2hhbmdlc0V4cGFuZG8pIHsgcmV0dXJuIHRoaXNbcHJpdmF0ZU1pbktleV07IH0pLFxuICAgICAgICBzZXQ8VD4odGhpczogT25DaGFuZ2VzRXhwYW5kbywgdmFsdWU6IFQpIHtcbiAgICAgICAgICBsZXQgc2ltcGxlQ2hhbmdlcyA9IHRoaXNbUFJJVkFURV9QUkVGSVhdO1xuICAgICAgICAgIGlmICghc2ltcGxlQ2hhbmdlcykge1xuICAgICAgICAgICAgc2ltcGxlQ2hhbmdlcyA9IHt9O1xuICAgICAgICAgICAgLy8gUGxhY2Ugd2hlcmUgd2Ugd2lsbCBzdG9yZSBTaW1wbGVDaGFuZ2VzIGlmIHRoZXJlIGlzIGEgY2hhbmdlXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgUFJJVkFURV9QUkVGSVgsIHt2YWx1ZTogc2ltcGxlQ2hhbmdlcywgd3JpdGFibGU6IHRydWV9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBpc0ZpcnN0Q2hhbmdlID0gIXRoaXMuaGFzT3duUHJvcGVydHkocHJpdmF0ZU1pbktleSk7XG4gICAgICAgICAgY29uc3QgY3VycmVudENoYW5nZSA9IHNpbXBsZUNoYW5nZXNbZGVjbGFyZWROYW1lXTtcblxuICAgICAgICAgIGlmIChjdXJyZW50Q2hhbmdlKSB7XG4gICAgICAgICAgICBjdXJyZW50Q2hhbmdlLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaW1wbGVDaGFuZ2VzW2RlY2xhcmVkTmFtZV0gPVxuICAgICAgICAgICAgICAgIG5ldyBTaW1wbGVDaGFuZ2UodGhpc1twcml2YXRlTWluS2V5XSwgdmFsdWUsIGlzRmlyc3RDaGFuZ2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpc0ZpcnN0Q2hhbmdlKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBwbGFjZSB3aGVyZSB0aGUgYWN0dWFsIHZhbHVlIHdpbGwgYmUgc3RvcmVkIGFuZCBtYWtlIGl0IG5vbi1lbnVtZXJhYmxlXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgcHJpdmF0ZU1pbktleSwge3ZhbHVlLCB3cml0YWJsZTogdHJ1ZX0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzW3ByaXZhdGVNaW5LZXldID0gdmFsdWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNldHRlcikgc2V0dGVyLmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbiBvbkluaXQgaG9vayBpcyBkZWZpbmVkLCBpdCB3aWxsIG5lZWQgdG8gd3JhcCB0aGUgbmdPbkNoYW5nZXMgY2FsbFxuICAvLyBzbyB0aGUgY2FsbCBvcmRlciBpcyBjaGFuZ2VzLWluaXQtY2hlY2sgaW4gY3JlYXRpb24gbW9kZS4gSW4gc3Vic2VxdWVudFxuICAvLyBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMsIG9ubHkgdGhlIGNoZWNrIHdyYXBwZXIgd2lsbCBiZSBjYWxsZWQuXG4gIGlmIChkZWZpbml0aW9uLm9uSW5pdCAhPSBudWxsKSB7XG4gICAgZGVmaW5pdGlvbi5vbkluaXQgPSBvbkNoYW5nZXNXcmFwcGVyKGRlZmluaXRpb24ub25Jbml0KTtcbiAgfVxuXG4gIGRlZmluaXRpb24uZG9DaGVjayA9IG9uQ2hhbmdlc1dyYXBwZXIoZGVmaW5pdGlvbi5kb0NoZWNrKTtcbn1cblxuZnVuY3Rpb24gb25DaGFuZ2VzV3JhcHBlcihkZWxlZ2F0ZUhvb2s6ICgoKSA9PiB2b2lkKSB8IG51bGwpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IE9uQ2hhbmdlc0V4cGFuZG8pIHtcbiAgICBjb25zdCBzaW1wbGVDaGFuZ2VzID0gdGhpc1tQUklWQVRFX1BSRUZJWF07XG4gICAgaWYgKHNpbXBsZUNoYW5nZXMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5uZ09uQ2hhbmdlcyhzaW1wbGVDaGFuZ2VzKTtcbiAgICAgIHRoaXNbUFJJVkFURV9QUkVGSVhdID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGRlbGVnYXRlSG9vaykgZGVsZWdhdGVIb29rLmFwcGx5KHRoaXMpO1xuICB9O1xufVxuIl19