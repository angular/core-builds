/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { bindingUpdated } from '../bindings';
import { RENDERER } from '../interfaces/view';
import { getLView, getSelectedTNode, getTView, nextBindingIndex } from '../state';
import { elementPropertyInternal, setInputsForProperty, storePropertyBindingMetadata, } from './shared';
/**
 * Update a property on a selected element.
 *
 * Operates on the element selected by index via the {@link select} instruction.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `@Inputs` don't have to be re-compiled
 *
 * @param propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value New value to write.
 * @param sanitizer An optional function used to sanitize the value.
 * @returns This function returns itself so that it may be chained
 * (e.g. `property('name', ctx.name)('title', ctx.title)`)
 *
 * @codeGenApi
 */
export function ɵɵproperty(propName, value, sanitizer) {
    const lView = getLView();
    const bindingIndex = nextBindingIndex();
    if (bindingUpdated(lView, bindingIndex, value)) {
        const tView = getTView();
        const tNode = getSelectedTNode();
        elementPropertyInternal(tView, tNode, lView, propName, value, lView[RENDERER], sanitizer, false);
        ngDevMode && storePropertyBindingMetadata(tView.data, tNode, propName, bindingIndex);
    }
    return ɵɵproperty;
}
/**
 * Given `<div style="..." my-dir>` and `MyDir` with `@Input('style')` we need to write to
 * directive input.
 */
export function setDirectiveInputsWhichShadowsStyling(tView, tNode, lView, value, isClassBased) {
    const inputs = tNode.inputs;
    const property = isClassBased ? 'class' : 'style';
    // We support both 'class' and `className` hence the fallback.
    setInputsForProperty(tView, lView, inputs[property], property, value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9wcm9wZXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRzNDLE9BQU8sRUFBUSxRQUFRLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVoRixPQUFPLEVBQ0wsdUJBQXVCLEVBQ3ZCLG9CQUFvQixFQUNwQiw0QkFBNEIsR0FDN0IsTUFBTSxVQUFVLENBQUM7QUFFbEI7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FDeEIsUUFBZ0IsRUFDaEIsS0FBUSxFQUNSLFNBQThCO0lBRTlCLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixFQUFFLENBQUM7SUFDeEMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQy9DLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDakMsdUJBQXVCLENBQ3JCLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxFQUNMLFFBQVEsRUFDUixLQUFLLEVBQ0wsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUNmLFNBQVMsRUFDVCxLQUFLLENBQ04sQ0FBQztRQUNGLFNBQVMsSUFBSSw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDdkYsQ0FBQztJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUscUNBQXFDLENBQ25ELEtBQVksRUFDWixLQUFZLEVBQ1osS0FBWSxFQUNaLEtBQVUsRUFDVixZQUFxQjtJQUVyQixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTyxDQUFDO0lBQzdCLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDbEQsOERBQThEO0lBQzlELG9CQUFvQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN4RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtMVmlldywgUkVOREVSRVIsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0U2VsZWN0ZWRUTm9kZSwgZ2V0VFZpZXcsIG5leHRCaW5kaW5nSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcblxuaW1wb3J0IHtcbiAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwsXG4gIHNldElucHV0c0ZvclByb3BlcnR5LFxuICBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhLFxufSBmcm9tICcuL3NoYXJlZCc7XG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYSBzZWxlY3RlZCBlbGVtZW50LlxuICpcbiAqIE9wZXJhdGVzIG9uIHRoZSBlbGVtZW50IHNlbGVjdGVkIGJ5IGluZGV4IHZpYSB0aGUge0BsaW5rIHNlbGVjdH0gaW5zdHJ1Y3Rpb24uXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBgQElucHV0c2AgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZFxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKiBAcmV0dXJucyBUaGlzIGZ1bmN0aW9uIHJldHVybnMgaXRzZWxmIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWRcbiAqIChlLmcuIGBwcm9wZXJ0eSgnbmFtZScsIGN0eC5uYW1lKSgndGl0bGUnLCBjdHgudGl0bGUpYClcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5PFQ+KFxuICBwcm9wTmFtZTogc3RyaW5nLFxuICB2YWx1ZTogVCxcbiAgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuKTogdHlwZW9mIMm1ybVwcm9wZXJ0eSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUpKSB7XG4gICAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKFxuICAgICAgdFZpZXcsXG4gICAgICB0Tm9kZSxcbiAgICAgIGxWaWV3LFxuICAgICAgcHJvcE5hbWUsXG4gICAgICB2YWx1ZSxcbiAgICAgIGxWaWV3W1JFTkRFUkVSXSxcbiAgICAgIHNhbml0aXplcixcbiAgICAgIGZhbHNlLFxuICAgICk7XG4gICAgbmdEZXZNb2RlICYmIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGEodFZpZXcuZGF0YSwgdE5vZGUsIHByb3BOYW1lLCBiaW5kaW5nSW5kZXgpO1xuICB9XG4gIHJldHVybiDJtcm1cHJvcGVydHk7XG59XG5cbi8qKlxuICogR2l2ZW4gYDxkaXYgc3R5bGU9XCIuLi5cIiBteS1kaXI+YCBhbmQgYE15RGlyYCB3aXRoIGBASW5wdXQoJ3N0eWxlJylgIHdlIG5lZWQgdG8gd3JpdGUgdG9cbiAqIGRpcmVjdGl2ZSBpbnB1dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldERpcmVjdGl2ZUlucHV0c1doaWNoU2hhZG93c1N0eWxpbmcoXG4gIHRWaWV3OiBUVmlldyxcbiAgdE5vZGU6IFROb2RlLFxuICBsVmlldzogTFZpZXcsXG4gIHZhbHVlOiBhbnksXG4gIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbikge1xuICBjb25zdCBpbnB1dHMgPSB0Tm9kZS5pbnB1dHMhO1xuICBjb25zdCBwcm9wZXJ0eSA9IGlzQ2xhc3NCYXNlZCA/ICdjbGFzcycgOiAnc3R5bGUnO1xuICAvLyBXZSBzdXBwb3J0IGJvdGggJ2NsYXNzJyBhbmQgYGNsYXNzTmFtZWAgaGVuY2UgdGhlIGZhbGxiYWNrLlxuICBzZXRJbnB1dHNGb3JQcm9wZXJ0eSh0VmlldywgbFZpZXcsIGlucHV0c1twcm9wZXJ0eV0sIHByb3BlcnR5LCB2YWx1ZSk7XG59XG4iXX0=