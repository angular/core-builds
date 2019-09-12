/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WrappedValue } from '../change_detection/change_detection_util';
import { getFactoryDef } from './definition';
import { store } from './instructions/all';
import { BINDING_INDEX, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunctionV } from './pure_function';
import { getLView } from './state';
import { NO_CHANGE } from './tokens';
import { load } from './util/view_utils';
/**
 * Create a pipe.
 *
 * \@codeGenApi
 * @param {?} index Pipe index where the pipe will be stored.
 * @param {?} pipeName The name of the pipe
 * @return {?} T the instance of the pipe.
 *
 */
export function ɵɵpipe(index, pipeName) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    /** @type {?} */
    let pipeDef;
    /** @type {?} */
    const adjustedIndex = index + HEADER_OFFSET;
    if (tView.firstTemplatePass) {
        pipeDef = getPipeDef(pipeName, tView.pipeRegistry);
        tView.data[adjustedIndex] = pipeDef;
        if (pipeDef.onDestroy) {
            (tView.destroyHooks || (tView.destroyHooks = [])).push(adjustedIndex, pipeDef.onDestroy);
        }
    }
    else {
        pipeDef = (/** @type {?} */ (tView.data[adjustedIndex]));
    }
    /** @type {?} */
    const pipeFactory = pipeDef.factory || (pipeDef.factory = getFactoryDef(pipeDef.type, true));
    /** @type {?} */
    const pipeInstance = pipeFactory();
    store(index, pipeInstance);
    return pipeInstance;
}
/**
 * Searches the pipe registry for a pipe with the given name. If one is found,
 * returns the pipe. Otherwise, an error is thrown because the pipe cannot be resolved.
 *
 * \@publicApi
 * @param {?} name Name of pipe to resolve
 * @param {?} registry Full list of available pipes
 * @return {?} Matching PipeDef
 *
 */
function getPipeDef(name, registry) {
    if (registry) {
        for (let i = registry.length - 1; i >= 0; i--) {
            /** @type {?} */
            const pipeDef = registry[i];
            if (name === pipeDef.name) {
                return pipeDef;
            }
        }
    }
    throw new Error(`The pipe '${name}' could not be found!`);
}
/**
 * Invokes a pipe with 1 arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * \@codeGenApi
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} v1 1st argument to {\@link PipeTransform#transform}.
 *
 * @return {?}
 */
export function ɵɵpipeBind1(index, slotOffset, v1) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const pipeInstance = load(lView, index);
    return unwrapValue(lView, isPure(lView, index) ?
        ɵɵpureFunction1(slotOffset, pipeInstance.transform, v1, pipeInstance) :
        pipeInstance.transform(v1));
}
/**
 * Invokes a pipe with 2 arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * \@codeGenApi
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} v1 1st argument to {\@link PipeTransform#transform}.
 * @param {?} v2 2nd argument to {\@link PipeTransform#transform}.
 *
 * @return {?}
 */
export function ɵɵpipeBind2(index, slotOffset, v1, v2) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const pipeInstance = load(lView, index);
    return unwrapValue(lView, isPure(lView, index) ?
        ɵɵpureFunction2(slotOffset, pipeInstance.transform, v1, v2, pipeInstance) :
        pipeInstance.transform(v1, v2));
}
/**
 * Invokes a pipe with 3 arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * \@codeGenApi
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} v1 1st argument to {\@link PipeTransform#transform}.
 * @param {?} v2 2nd argument to {\@link PipeTransform#transform}.
 * @param {?} v3 4rd argument to {\@link PipeTransform#transform}.
 *
 * @return {?}
 */
export function ɵɵpipeBind3(index, slotOffset, v1, v2, v3) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const pipeInstance = load(lView, index);
    return unwrapValue(lView, isPure(lView, index) ?
        ɵɵpureFunction3(slotOffset, pipeInstance.transform, v1, v2, v3, pipeInstance) :
        pipeInstance.transform(v1, v2, v3));
}
/**
 * Invokes a pipe with 4 arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * \@codeGenApi
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} v1 1st argument to {\@link PipeTransform#transform}.
 * @param {?} v2 2nd argument to {\@link PipeTransform#transform}.
 * @param {?} v3 3rd argument to {\@link PipeTransform#transform}.
 * @param {?} v4 4th argument to {\@link PipeTransform#transform}.
 *
 * @return {?}
 */
export function ɵɵpipeBind4(index, slotOffset, v1, v2, v3, v4) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const pipeInstance = load(lView, index);
    return unwrapValue(lView, isPure(lView, index) ?
        ɵɵpureFunction4(slotOffset, pipeInstance.transform, v1, v2, v3, v4, pipeInstance) :
        pipeInstance.transform(v1, v2, v3, v4));
}
/**
 * Invokes a pipe with variable number of arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * \@codeGenApi
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} values Array of arguments to pass to {\@link PipeTransform#transform} method.
 *
 * @return {?}
 */
export function ɵɵpipeBindV(index, slotOffset, values) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const pipeInstance = load(lView, index);
    return unwrapValue(lView, isPure(lView, index) ?
        ɵɵpureFunctionV(slotOffset, pipeInstance.transform, values, pipeInstance) :
        pipeInstance.transform.apply(pipeInstance, values));
}
/**
 * @param {?} lView
 * @param {?} index
 * @return {?}
 */
function isPure(lView, index) {
    return ((/** @type {?} */ (lView[TVIEW].data[index + HEADER_OFFSET]))).pure;
}
/**
 * Unwrap the output of a pipe transformation.
 * In order to trick change detection into considering that the new value is always different from
 * the old one, the old value is overwritten by NO_CHANGE.
 *
 * @param {?} lView
 * @param {?} newValue the pipe transformation output.
 * @return {?}
 */
function unwrapValue(lView, newValue) {
    if (WrappedValue.isWrapped(newValue)) {
        newValue = WrappedValue.unwrap(newValue);
        // The NO_CHANGE value needs to be written at the index where the impacted binding value is
        // stored
        /** @type {?} */
        const bindingToInvalidateIdx = lView[BINDING_INDEX];
        lView[bindingToInvalidateIdx] = NO_CHANGE;
    }
    return newValue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQztBQUd2RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzNDLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV6QyxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBUyxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3BILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDakMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNuQyxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7Ozs7QUFhdkMsTUFBTSxVQUFVLE1BQU0sQ0FBQyxLQUFhLEVBQUUsUUFBZ0I7O1VBQzlDLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUM7O1FBQzNCLE9BQXFCOztVQUNuQixhQUFhLEdBQUcsS0FBSyxHQUFHLGFBQWE7SUFFM0MsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7UUFDM0IsT0FBTyxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25ELEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQ3BDLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUNyQixDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUksQ0FBQyxLQUFL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Q0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxFQUFBLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDdkUsQ0FBQzs7Ozs7Ozs7OztBQVNELFNBQVMsV0FBVyxDQUFDLEtBQVksRUFBRSxRQUFhO0lBQzlDLElBQUksWUFBWSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNwQyxRQUFRLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7OztjQUduQyxzQkFBc0IsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO1FBQ25ELEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLFNBQVMsQ0FBQztLQUMzQztJQUNELE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7V3JhcHBlZFZhbHVlfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb25fdXRpbCc7XG5pbXBvcnQge1BpcGVUcmFuc2Zvcm19IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vcGlwZV90cmFuc2Zvcm0nO1xuXG5pbXBvcnQge2dldEZhY3RvcnlEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge3N0b3JlfSBmcm9tICcuL2luc3RydWN0aW9ucy9hbGwnO1xuaW1wb3J0IHtQaXBlRGVmLCBQaXBlRGVmTGlzdH0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBIRUFERVJfT0ZGU0VULCBMVmlldywgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7ybXJtXB1cmVGdW5jdGlvbjEsIMm1ybVwdXJlRnVuY3Rpb24yLCDJtcm1cHVyZUZ1bmN0aW9uMywgybXJtXB1cmVGdW5jdGlvbjQsIMm1ybVwdXJlRnVuY3Rpb25WfSBmcm9tICcuL3B1cmVfZnVuY3Rpb24nO1xuaW1wb3J0IHtnZXRMVmlld30gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtsb2FkfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIENyZWF0ZSBhIHBpcGUuXG4gKlxuICogQHBhcmFtIGluZGV4IFBpcGUgaW5kZXggd2hlcmUgdGhlIHBpcGUgd2lsbCBiZSBzdG9yZWQuXG4gKiBAcGFyYW0gcGlwZU5hbWUgVGhlIG5hbWUgb2YgdGhlIHBpcGVcbiAqIEByZXR1cm5zIFQgdGhlIGluc3RhbmNlIG9mIHRoZSBwaXBlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cGlwZShpbmRleDogbnVtYmVyLCBwaXBlTmFtZTogc3RyaW5nKTogYW55IHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbGV0IHBpcGVEZWY6IFBpcGVEZWY8YW55PjtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBwaXBlRGVmID0gZ2V0UGlwZURlZihwaXBlTmFtZSwgdFZpZXcucGlwZVJlZ2lzdHJ5KTtcbiAgICB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID0gcGlwZURlZjtcbiAgICBpZiAocGlwZURlZi5vbkRlc3Ryb3kpIHtcbiAgICAgICh0Vmlldy5kZXN0cm95SG9va3MgfHwgKHRWaWV3LmRlc3Ryb3lIb29rcyA9IFtdKSkucHVzaChhZGp1c3RlZEluZGV4LCBwaXBlRGVmLm9uRGVzdHJveSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHBpcGVEZWYgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFBpcGVEZWY8YW55PjtcbiAgfVxuXG4gIGNvbnN0IHBpcGVGYWN0b3J5ID0gcGlwZURlZi5mYWN0b3J5IHx8IChwaXBlRGVmLmZhY3RvcnkgPSBnZXRGYWN0b3J5RGVmKHBpcGVEZWYudHlwZSwgdHJ1ZSkpO1xuICBjb25zdCBwaXBlSW5zdGFuY2UgPSBwaXBlRmFjdG9yeSgpO1xuICBzdG9yZShpbmRleCwgcGlwZUluc3RhbmNlKTtcbiAgcmV0dXJuIHBpcGVJbnN0YW5jZTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyB0aGUgcGlwZSByZWdpc3RyeSBmb3IgYSBwaXBlIHdpdGggdGhlIGdpdmVuIG5hbWUuIElmIG9uZSBpcyBmb3VuZCxcbiAqIHJldHVybnMgdGhlIHBpcGUuIE90aGVyd2lzZSwgYW4gZXJyb3IgaXMgdGhyb3duIGJlY2F1c2UgdGhlIHBpcGUgY2Fubm90IGJlIHJlc29sdmVkLlxuICpcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgcGlwZSB0byByZXNvbHZlXG4gKiBAcGFyYW0gcmVnaXN0cnkgRnVsbCBsaXN0IG9mIGF2YWlsYWJsZSBwaXBlc1xuICogQHJldHVybnMgTWF0Y2hpbmcgUGlwZURlZlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZnVuY3Rpb24gZ2V0UGlwZURlZihuYW1lOiBzdHJpbmcsIHJlZ2lzdHJ5OiBQaXBlRGVmTGlzdCB8IG51bGwpOiBQaXBlRGVmPGFueT4ge1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gcmVnaXN0cnkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IHBpcGVEZWYgPSByZWdpc3RyeVtpXTtcbiAgICAgIGlmIChuYW1lID09PSBwaXBlRGVmLm5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHBpcGVEZWY7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihgVGhlIHBpcGUgJyR7bmFtZX0nIGNvdWxkIG5vdCBiZSBmb3VuZCFgKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIDEgYXJndW1lbnRzLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gYWN0cyBhcyBhIGd1YXJkIHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0gaW52b2tpbmdcbiAqIHRoZSBwaXBlIG9ubHkgd2hlbiBhbiBpbnB1dCB0byB0aGUgcGlwZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBQaXBlIGluZGV4IHdoZXJlIHRoZSBwaXBlIHdhcyBzdG9yZWQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlXG4gKiBAcGFyYW0gdjEgMXN0IGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwaXBlQmluZDEoaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2MTogYW55KTogYW55IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBwaXBlSW5zdGFuY2UgPSBsb2FkPFBpcGVUcmFuc2Zvcm0+KGxWaWV3LCBpbmRleCk7XG4gIHJldHVybiB1bndyYXBWYWx1ZShcbiAgICAgIGxWaWV3LCBpc1B1cmUobFZpZXcsIGluZGV4KSA/XG4gICAgICAgICAgybXJtXB1cmVGdW5jdGlvbjEoc2xvdE9mZnNldCwgcGlwZUluc3RhbmNlLnRyYW5zZm9ybSwgdjEsIHBpcGVJbnN0YW5jZSkgOlxuICAgICAgICAgIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0odjEpKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIDIgYXJndW1lbnRzLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gYWN0cyBhcyBhIGd1YXJkIHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0gaW52b2tpbmdcbiAqIHRoZSBwaXBlIG9ubHkgd2hlbiBhbiBpbnB1dCB0byB0aGUgcGlwZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBQaXBlIGluZGV4IHdoZXJlIHRoZSBwaXBlIHdhcyBzdG9yZWQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlXG4gKiBAcGFyYW0gdjEgMXN0IGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjIgMm5kIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwaXBlQmluZDIoaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2MTogYW55LCB2MjogYW55KTogYW55IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBwaXBlSW5zdGFuY2UgPSBsb2FkPFBpcGVUcmFuc2Zvcm0+KGxWaWV3LCBpbmRleCk7XG4gIHJldHVybiB1bndyYXBWYWx1ZShcbiAgICAgIGxWaWV3LCBpc1B1cmUobFZpZXcsIGluZGV4KSA/XG4gICAgICAgICAgybXJtXB1cmVGdW5jdGlvbjIoc2xvdE9mZnNldCwgcGlwZUluc3RhbmNlLnRyYW5zZm9ybSwgdjEsIHYyLCBwaXBlSW5zdGFuY2UpIDpcbiAgICAgICAgICBwaXBlSW5zdGFuY2UudHJhbnNmb3JtKHYxLCB2MikpO1xufVxuXG4vKipcbiAqIEludm9rZXMgYSBwaXBlIHdpdGggMyBhcmd1bWVudHMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBhY3RzIGFzIGEgZ3VhcmQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBpbnZva2luZ1xuICogdGhlIHBpcGUgb25seSB3aGVuIGFuIGlucHV0IHRvIHRoZSBwaXBlIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGluZGV4IFBpcGUgaW5kZXggd2hlcmUgdGhlIHBpcGUgd2FzIHN0b3JlZCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgaW4gdGhlIHJlc2VydmVkIHNsb3Qgc3BhY2VcbiAqIEBwYXJhbSB2MSAxc3QgYXJndW1lbnQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfS5cbiAqIEBwYXJhbSB2MiAybmQgYXJndW1lbnQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfS5cbiAqIEBwYXJhbSB2MyA0cmQgYXJndW1lbnQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXBpcGVCaW5kMyhpbmRleDogbnVtYmVyLCBzbG90T2Zmc2V0OiBudW1iZXIsIHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnkpOiBhbnkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHBpcGVJbnN0YW5jZSA9IGxvYWQ8UGlwZVRyYW5zZm9ybT4obFZpZXcsIGluZGV4KTtcbiAgcmV0dXJuIHVud3JhcFZhbHVlKFxuICAgICAgbFZpZXcsIGlzUHVyZShsVmlldywgaW5kZXgpID9cbiAgICAgICAgICDJtcm1cHVyZUZ1bmN0aW9uMyhzbG90T2Zmc2V0LCBwaXBlSW5zdGFuY2UudHJhbnNmb3JtLCB2MSwgdjIsIHYzLCBwaXBlSW5zdGFuY2UpIDpcbiAgICAgICAgICBwaXBlSW5zdGFuY2UudHJhbnNmb3JtKHYxLCB2MiwgdjMpKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIDQgYXJndW1lbnRzLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gYWN0cyBhcyBhIGd1YXJkIHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0gaW52b2tpbmdcbiAqIHRoZSBwaXBlIG9ubHkgd2hlbiBhbiBpbnB1dCB0byB0aGUgcGlwZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBQaXBlIGluZGV4IHdoZXJlIHRoZSBwaXBlIHdhcyBzdG9yZWQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlXG4gKiBAcGFyYW0gdjEgMXN0IGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjIgMm5kIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjMgM3JkIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjQgNHRoIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwaXBlQmluZDQoXG4gICAgaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55KTogYW55IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBwaXBlSW5zdGFuY2UgPSBsb2FkPFBpcGVUcmFuc2Zvcm0+KGxWaWV3LCBpbmRleCk7XG4gIHJldHVybiB1bndyYXBWYWx1ZShcbiAgICAgIGxWaWV3LCBpc1B1cmUobFZpZXcsIGluZGV4KSA/XG4gICAgICAgICAgybXJtXB1cmVGdW5jdGlvbjQoc2xvdE9mZnNldCwgcGlwZUluc3RhbmNlLnRyYW5zZm9ybSwgdjEsIHYyLCB2MywgdjQsIHBpcGVJbnN0YW5jZSkgOlxuICAgICAgICAgIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0odjEsIHYyLCB2MywgdjQpKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBhY3RzIGFzIGEgZ3VhcmQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBpbnZva2luZ1xuICogdGhlIHBpcGUgb25seSB3aGVuIGFuIGlucHV0IHRvIHRoZSBwaXBlIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGluZGV4IFBpcGUgaW5kZXggd2hlcmUgdGhlIHBpcGUgd2FzIHN0b3JlZCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgaW4gdGhlIHJlc2VydmVkIHNsb3Qgc3BhY2VcbiAqIEBwYXJhbSB2YWx1ZXMgQXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3MgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBtZXRob2QuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwaXBlQmluZFYoaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2YWx1ZXM6IFthbnksIC4uLmFueVtdXSk6IGFueSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgcGlwZUluc3RhbmNlID0gbG9hZDxQaXBlVHJhbnNmb3JtPihsVmlldywgaW5kZXgpO1xuICByZXR1cm4gdW53cmFwVmFsdWUoXG4gICAgICBsVmlldywgaXNQdXJlKGxWaWV3LCBpbmRleCkgP1xuICAgICAgICAgIMm1ybVwdXJlRnVuY3Rpb25WKHNsb3RPZmZzZXQsIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0sIHZhbHVlcywgcGlwZUluc3RhbmNlKSA6XG4gICAgICAgICAgcGlwZUluc3RhbmNlLnRyYW5zZm9ybS5hcHBseShwaXBlSW5zdGFuY2UsIHZhbHVlcykpO1xufVxuXG5mdW5jdGlvbiBpc1B1cmUobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoPFBpcGVEZWY8YW55Pj5sVmlld1tUVklFV10uZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdKS5wdXJlO1xufVxuXG4vKipcbiAqIFVud3JhcCB0aGUgb3V0cHV0IG9mIGEgcGlwZSB0cmFuc2Zvcm1hdGlvbi5cbiAqIEluIG9yZGVyIHRvIHRyaWNrIGNoYW5nZSBkZXRlY3Rpb24gaW50byBjb25zaWRlcmluZyB0aGF0IHRoZSBuZXcgdmFsdWUgaXMgYWx3YXlzIGRpZmZlcmVudCBmcm9tXG4gKiB0aGUgb2xkIG9uZSwgdGhlIG9sZCB2YWx1ZSBpcyBvdmVyd3JpdHRlbiBieSBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIG5ld1ZhbHVlIHRoZSBwaXBlIHRyYW5zZm9ybWF0aW9uIG91dHB1dC5cbiAqL1xuZnVuY3Rpb24gdW53cmFwVmFsdWUobFZpZXc6IExWaWV3LCBuZXdWYWx1ZTogYW55KTogYW55IHtcbiAgaWYgKFdyYXBwZWRWYWx1ZS5pc1dyYXBwZWQobmV3VmFsdWUpKSB7XG4gICAgbmV3VmFsdWUgPSBXcmFwcGVkVmFsdWUudW53cmFwKG5ld1ZhbHVlKTtcbiAgICAvLyBUaGUgTk9fQ0hBTkdFIHZhbHVlIG5lZWRzIHRvIGJlIHdyaXR0ZW4gYXQgdGhlIGluZGV4IHdoZXJlIHRoZSBpbXBhY3RlZCBiaW5kaW5nIHZhbHVlIGlzXG4gICAgLy8gc3RvcmVkXG4gICAgY29uc3QgYmluZGluZ1RvSW52YWxpZGF0ZUlkeCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICAgIGxWaWV3W2JpbmRpbmdUb0ludmFsaWRhdGVJZHhdID0gTk9fQ0hBTkdFO1xuICB9XG4gIHJldHVybiBuZXdWYWx1ZTtcbn1cbiJdfQ==