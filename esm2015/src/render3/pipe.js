/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WrappedValue } from '../change_detection/change_detection_util';
import { load, store } from './instructions';
import { HEADER_OFFSET, TVIEW } from './interfaces/view';
import { pureFunction1, pureFunction2, pureFunction3, pureFunction4, pureFunctionV } from './pure_function';
import { getBindingRoot, getLView } from './state';
import { NO_CHANGE } from './tokens';
/**
 * Create a pipe.
 *
 * @param {?} index Pipe index where the pipe will be stored.
 * @param {?} pipeName The name of the pipe
 * @return {?} T the instance of the pipe.
 */
export function pipe(index, pipeName) {
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
    const pipeInstance = pipeDef.factory(null);
    store(index, pipeInstance);
    return pipeInstance;
}
/**
 * Searches the pipe registry for a pipe with the given name. If one is found,
 * returns the pipe. Otherwise, an error is thrown because the pipe cannot be resolved.
 *
 * @param {?} name Name of pipe to resolve
 * @param {?} registry Full list of available pipes
 * @return {?} Matching PipeDef
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
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} v1 1st argument to {\@link PipeTransform#transform}.
 * @return {?}
 */
export function pipeBind1(index, slotOffset, v1) {
    /** @type {?} */
    const pipeInstance = load(index);
    return unwrapValue(isPure(index) ? pureFunction1(slotOffset, pipeInstance.transform, v1, pipeInstance) :
        pipeInstance.transform(v1));
}
/**
 * Invokes a pipe with 2 arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} v1 1st argument to {\@link PipeTransform#transform}.
 * @param {?} v2 2nd argument to {\@link PipeTransform#transform}.
 * @return {?}
 */
export function pipeBind2(index, slotOffset, v1, v2) {
    /** @type {?} */
    const pipeInstance = load(index);
    return unwrapValue(isPure(index) ? pureFunction2(slotOffset, pipeInstance.transform, v1, v2, pipeInstance) :
        pipeInstance.transform(v1, v2));
}
/**
 * Invokes a pipe with 3 arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} v1 1st argument to {\@link PipeTransform#transform}.
 * @param {?} v2 2nd argument to {\@link PipeTransform#transform}.
 * @param {?} v3 4rd argument to {\@link PipeTransform#transform}.
 * @return {?}
 */
export function pipeBind3(index, slotOffset, v1, v2, v3) {
    /** @type {?} */
    const pipeInstance = load(index);
    return unwrapValue(isPure(index) ? pureFunction3(slotOffset, pipeInstance.transform, v1, v2, v3, pipeInstance) :
        pipeInstance.transform(v1, v2, v3));
}
/**
 * Invokes a pipe with 4 arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} v1 1st argument to {\@link PipeTransform#transform}.
 * @param {?} v2 2nd argument to {\@link PipeTransform#transform}.
 * @param {?} v3 3rd argument to {\@link PipeTransform#transform}.
 * @param {?} v4 4th argument to {\@link PipeTransform#transform}.
 * @return {?}
 */
export function pipeBind4(index, slotOffset, v1, v2, v3, v4) {
    /** @type {?} */
    const pipeInstance = load(index);
    return unwrapValue(isPure(index) ?
        pureFunction4(slotOffset, pipeInstance.transform, v1, v2, v3, v4, pipeInstance) :
        pipeInstance.transform(v1, v2, v3, v4));
}
/**
 * Invokes a pipe with variable number of arguments.
 *
 * This instruction acts as a guard to {\@link PipeTransform#transform} invoking
 * the pipe only when an input to the pipe changes.
 *
 * @param {?} index Pipe index where the pipe was stored on creation.
 * @param {?} slotOffset the offset in the reserved slot space
 * @param {?} values Array of arguments to pass to {\@link PipeTransform#transform} method.
 * @return {?}
 */
export function pipeBindV(index, slotOffset, values) {
    /** @type {?} */
    const pipeInstance = load(index);
    return unwrapValue(isPure(index) ? pureFunctionV(slotOffset, pipeInstance.transform, values, pipeInstance) :
        pipeInstance.transform.apply(pipeInstance, values));
}
/**
 * @param {?} index
 * @return {?}
 */
function isPure(index) {
    return ((/** @type {?} */ (getLView()[TVIEW].data[index + HEADER_OFFSET]))).pure;
}
/**
 * Unwrap the output of a pipe transformation.
 * In order to trick change detection into considering that the new value is always different from
 * the old one, the old value is overwritten by NO_CHANGE.
 *
 * @param {?} newValue the pipe transformation output.
 * @return {?}
 */
function unwrapValue(newValue) {
    if (WrappedValue.isWrapped(newValue)) {
        newValue = WrappedValue.unwrap(newValue);
        getLView()[getBindingRoot()] = NO_CHANGE;
    }
    return newValue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQztBQUd2RSxPQUFPLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTNDLE9BQU8sRUFBQyxhQUFhLEVBQUUsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdkQsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUMxRyxPQUFPLEVBQUMsY0FBYyxFQUFFLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNqRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7OztBQVVuQyxNQUFNLFVBQVUsSUFBSSxDQUFDLEtBQWEsRUFBRSxRQUFnQjs7VUFDNUMsS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQzs7UUFDM0IsT0FBcUI7O1VBQ25CLGFBQWEsR0FBRyxLQUFLLEdBQUcsYUFBYTtJQUUzQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUMzQixPQUFPLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkQsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxPQUFPLENBQUM7UUFDcEMsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3JCLENBQUMsS0FBSyxDQUFDLFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMxRjtLQUNG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LEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFhLEVBQUUsVUFBa0IsRUFBRSxNQUFhOztVQUNsRSxZQUFZLEdBQUcsSUFBSSxDQUFnQixLQUFLLENBQUM7SUFDL0MsT0FBTyxXQUFXLENBQ2QsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDekUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQzs7Ozs7QUFFRCxTQUFTLE1BQU0sQ0FBQyxLQUFhO0lBQzNCLE9BQU8sQ0FBQyxtQkFBYyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxFQUFBLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDNUUsQ0FBQzs7Ozs7Ozs7O0FBU0QsU0FBUyxXQUFXLENBQUMsUUFBYTtJQUNoQyxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDcEMsUUFBUSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekMsUUFBUSxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUM7S0FDMUM7SUFDRCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1dyYXBwZWRWYWx1ZX0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwnO1xuaW1wb3J0IHtQaXBlVHJhbnNmb3JtfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3BpcGVfdHJhbnNmb3JtJztcblxuaW1wb3J0IHtsb2FkLCBzdG9yZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtQaXBlRGVmLCBQaXBlRGVmTGlzdH0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtwdXJlRnVuY3Rpb24xLCBwdXJlRnVuY3Rpb24yLCBwdXJlRnVuY3Rpb24zLCBwdXJlRnVuY3Rpb240LCBwdXJlRnVuY3Rpb25WfSBmcm9tICcuL3B1cmVfZnVuY3Rpb24nO1xuaW1wb3J0IHtnZXRCaW5kaW5nUm9vdCwgZ2V0TFZpZXd9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4vdG9rZW5zJztcblxuXG4vKipcbiAqIENyZWF0ZSBhIHBpcGUuXG4gKlxuICogQHBhcmFtIGluZGV4IFBpcGUgaW5kZXggd2hlcmUgdGhlIHBpcGUgd2lsbCBiZSBzdG9yZWQuXG4gKiBAcGFyYW0gcGlwZU5hbWUgVGhlIG5hbWUgb2YgdGhlIHBpcGVcbiAqIEByZXR1cm5zIFQgdGhlIGluc3RhbmNlIG9mIHRoZSBwaXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGlwZShpbmRleDogbnVtYmVyLCBwaXBlTmFtZTogc3RyaW5nKTogYW55IHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbGV0IHBpcGVEZWY6IFBpcGVEZWY8YW55PjtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBwaXBlRGVmID0gZ2V0UGlwZURlZihwaXBlTmFtZSwgdFZpZXcucGlwZVJlZ2lzdHJ5KTtcbiAgICB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID0gcGlwZURlZjtcbiAgICBpZiAocGlwZURlZi5vbkRlc3Ryb3kpIHtcbiAgICAgICh0Vmlldy5kZXN0cm95SG9va3MgfHwgKHRWaWV3LmRlc3Ryb3lIb29rcyA9IFtdKSkucHVzaChhZGp1c3RlZEluZGV4LCBwaXBlRGVmLm9uRGVzdHJveSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHBpcGVEZWYgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFBpcGVEZWY8YW55PjtcbiAgfVxuXG4gIGNvbnN0IHBpcGVJbnN0YW5jZSA9IHBpcGVEZWYuZmFjdG9yeShudWxsKTtcbiAgc3RvcmUoaW5kZXgsIHBpcGVJbnN0YW5jZSk7XG4gIHJldHVybiBwaXBlSW5zdGFuY2U7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgdGhlIHBpcGUgcmVnaXN0cnkgZm9yIGEgcGlwZSB3aXRoIHRoZSBnaXZlbiBuYW1lLiBJZiBvbmUgaXMgZm91bmQsXG4gKiByZXR1cm5zIHRoZSBwaXBlLiBPdGhlcndpc2UsIGFuIGVycm9yIGlzIHRocm93biBiZWNhdXNlIHRoZSBwaXBlIGNhbm5vdCBiZSByZXNvbHZlZC5cbiAqXG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHBpcGUgdG8gcmVzb2x2ZVxuICogQHBhcmFtIHJlZ2lzdHJ5IEZ1bGwgbGlzdCBvZiBhdmFpbGFibGUgcGlwZXNcbiAqIEByZXR1cm5zIE1hdGNoaW5nIFBpcGVEZWZcbiAqL1xuZnVuY3Rpb24gZ2V0UGlwZURlZihuYW1lOiBzdHJpbmcsIHJlZ2lzdHJ5OiBQaXBlRGVmTGlzdCB8IG51bGwpOiBQaXBlRGVmPGFueT4ge1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gcmVnaXN0cnkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IHBpcGVEZWYgPSByZWdpc3RyeVtpXTtcbiAgICAgIGlmIChuYW1lID09PSBwaXBlRGVmLm5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHBpcGVEZWY7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihgVGhlIHBpcGUgJyR7bmFtZX0nIGNvdWxkIG5vdCBiZSBmb3VuZCFgKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIDEgYXJndW1lbnRzLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gYWN0cyBhcyBhIGd1YXJkIHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0gaW52b2tpbmdcbiAqIHRoZSBwaXBlIG9ubHkgd2hlbiBhbiBpbnB1dCB0byB0aGUgcGlwZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBQaXBlIGluZGV4IHdoZXJlIHRoZSBwaXBlIHdhcyBzdG9yZWQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlXG4gKiBAcGFyYW0gdjEgMXN0IGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaXBlQmluZDEoaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2MTogYW55KTogYW55IHtcbiAgY29uc3QgcGlwZUluc3RhbmNlID0gbG9hZDxQaXBlVHJhbnNmb3JtPihpbmRleCk7XG4gIHJldHVybiB1bndyYXBWYWx1ZShcbiAgICAgIGlzUHVyZShpbmRleCkgPyBwdXJlRnVuY3Rpb24xKHNsb3RPZmZzZXQsIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0sIHYxLCBwaXBlSW5zdGFuY2UpIDpcbiAgICAgICAgICAgICAgICAgICAgICBwaXBlSW5zdGFuY2UudHJhbnNmb3JtKHYxKSk7XG59XG5cbi8qKlxuICogSW52b2tlcyBhIHBpcGUgd2l0aCAyIGFyZ3VtZW50cy5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGFjdHMgYXMgYSBndWFyZCB0byB7QGxpbmsgUGlwZVRyYW5zZm9ybSN0cmFuc2Zvcm19IGludm9raW5nXG4gKiB0aGUgcGlwZSBvbmx5IHdoZW4gYW4gaW5wdXQgdG8gdGhlIHBpcGUgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggUGlwZSBpbmRleCB3aGVyZSB0aGUgcGlwZSB3YXMgc3RvcmVkIG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBpbiB0aGUgcmVzZXJ2ZWQgc2xvdCBzcGFjZVxuICogQHBhcmFtIHYxIDFzdCBhcmd1bWVudCB0byB7QGxpbmsgUGlwZVRyYW5zZm9ybSN0cmFuc2Zvcm19LlxuICogQHBhcmFtIHYyIDJuZCBhcmd1bWVudCB0byB7QGxpbmsgUGlwZVRyYW5zZm9ybSN0cmFuc2Zvcm19LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGlwZUJpbmQyKGluZGV4OiBudW1iZXIsIHNsb3RPZmZzZXQ6IG51bWJlciwgdjE6IGFueSwgdjI6IGFueSk6IGFueSB7XG4gIGNvbnN0IHBpcGVJbnN0YW5jZSA9IGxvYWQ8UGlwZVRyYW5zZm9ybT4oaW5kZXgpO1xuICByZXR1cm4gdW53cmFwVmFsdWUoXG4gICAgICBpc1B1cmUoaW5kZXgpID8gcHVyZUZ1bmN0aW9uMihzbG90T2Zmc2V0LCBwaXBlSW5zdGFuY2UudHJhbnNmb3JtLCB2MSwgdjIsIHBpcGVJbnN0YW5jZSkgOlxuICAgICAgICAgICAgICAgICAgICAgIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0odjEsIHYyKSk7XG59XG5cbi8qKlxuICogSW52b2tlcyBhIHBpcGUgd2l0aCAzIGFyZ3VtZW50cy5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGFjdHMgYXMgYSBndWFyZCB0byB7QGxpbmsgUGlwZVRyYW5zZm9ybSN0cmFuc2Zvcm19IGludm9raW5nXG4gKiB0aGUgcGlwZSBvbmx5IHdoZW4gYW4gaW5wdXQgdG8gdGhlIHBpcGUgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggUGlwZSBpbmRleCB3aGVyZSB0aGUgcGlwZSB3YXMgc3RvcmVkIG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBpbiB0aGUgcmVzZXJ2ZWQgc2xvdCBzcGFjZVxuICogQHBhcmFtIHYxIDFzdCBhcmd1bWVudCB0byB7QGxpbmsgUGlwZVRyYW5zZm9ybSN0cmFuc2Zvcm19LlxuICogQHBhcmFtIHYyIDJuZCBhcmd1bWVudCB0byB7QGxpbmsgUGlwZVRyYW5zZm9ybSN0cmFuc2Zvcm19LlxuICogQHBhcmFtIHYzIDRyZCBhcmd1bWVudCB0byB7QGxpbmsgUGlwZVRyYW5zZm9ybSN0cmFuc2Zvcm19LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGlwZUJpbmQzKGluZGV4OiBudW1iZXIsIHNsb3RPZmZzZXQ6IG51bWJlciwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSk6IGFueSB7XG4gIGNvbnN0IHBpcGVJbnN0YW5jZSA9IGxvYWQ8UGlwZVRyYW5zZm9ybT4oaW5kZXgpO1xuICByZXR1cm4gdW53cmFwVmFsdWUoXG4gICAgICBpc1B1cmUoaW5kZXgpID8gcHVyZUZ1bmN0aW9uMyhzbG90T2Zmc2V0LCBwaXBlSW5zdGFuY2UudHJhbnNmb3JtLCB2MSwgdjIsIHYzLCBwaXBlSW5zdGFuY2UpIDpcbiAgICAgICAgICAgICAgICAgICAgICBwaXBlSW5zdGFuY2UudHJhbnNmb3JtKHYxLCB2MiwgdjMpKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIDQgYXJndW1lbnRzLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gYWN0cyBhcyBhIGd1YXJkIHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0gaW52b2tpbmdcbiAqIHRoZSBwaXBlIG9ubHkgd2hlbiBhbiBpbnB1dCB0byB0aGUgcGlwZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBQaXBlIGluZGV4IHdoZXJlIHRoZSBwaXBlIHdhcyBzdG9yZWQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlXG4gKiBAcGFyYW0gdjEgMXN0IGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjIgMm5kIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjMgM3JkIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjQgNHRoIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaXBlQmluZDQoXG4gICAgaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55KTogYW55IHtcbiAgY29uc3QgcGlwZUluc3RhbmNlID0gbG9hZDxQaXBlVHJhbnNmb3JtPihpbmRleCk7XG4gIHJldHVybiB1bndyYXBWYWx1ZShcbiAgICAgIGlzUHVyZShpbmRleCkgP1xuICAgICAgICAgIHB1cmVGdW5jdGlvbjQoc2xvdE9mZnNldCwgcGlwZUluc3RhbmNlLnRyYW5zZm9ybSwgdjEsIHYyLCB2MywgdjQsIHBpcGVJbnN0YW5jZSkgOlxuICAgICAgICAgIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0odjEsIHYyLCB2MywgdjQpKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBhY3RzIGFzIGEgZ3VhcmQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBpbnZva2luZ1xuICogdGhlIHBpcGUgb25seSB3aGVuIGFuIGlucHV0IHRvIHRoZSBwaXBlIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGluZGV4IFBpcGUgaW5kZXggd2hlcmUgdGhlIHBpcGUgd2FzIHN0b3JlZCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgaW4gdGhlIHJlc2VydmVkIHNsb3Qgc3BhY2VcbiAqIEBwYXJhbSB2YWx1ZXMgQXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3MgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBtZXRob2QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaXBlQmluZFYoaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2YWx1ZXM6IGFueVtdKTogYW55IHtcbiAgY29uc3QgcGlwZUluc3RhbmNlID0gbG9hZDxQaXBlVHJhbnNmb3JtPihpbmRleCk7XG4gIHJldHVybiB1bndyYXBWYWx1ZShcbiAgICAgIGlzUHVyZShpbmRleCkgPyBwdXJlRnVuY3Rpb25WKHNsb3RPZmZzZXQsIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0sIHZhbHVlcywgcGlwZUluc3RhbmNlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgcGlwZUluc3RhbmNlLnRyYW5zZm9ybS5hcHBseShwaXBlSW5zdGFuY2UsIHZhbHVlcykpO1xufVxuXG5mdW5jdGlvbiBpc1B1cmUoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKDxQaXBlRGVmPGFueT4+Z2V0TFZpZXcoKVtUVklFV10uZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdKS5wdXJlO1xufVxuXG4vKipcbiAqIFVud3JhcCB0aGUgb3V0cHV0IG9mIGEgcGlwZSB0cmFuc2Zvcm1hdGlvbi5cbiAqIEluIG9yZGVyIHRvIHRyaWNrIGNoYW5nZSBkZXRlY3Rpb24gaW50byBjb25zaWRlcmluZyB0aGF0IHRoZSBuZXcgdmFsdWUgaXMgYWx3YXlzIGRpZmZlcmVudCBmcm9tXG4gKiB0aGUgb2xkIG9uZSwgdGhlIG9sZCB2YWx1ZSBpcyBvdmVyd3JpdHRlbiBieSBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIG5ld1ZhbHVlIHRoZSBwaXBlIHRyYW5zZm9ybWF0aW9uIG91dHB1dC5cbiAqL1xuZnVuY3Rpb24gdW53cmFwVmFsdWUobmV3VmFsdWU6IGFueSk6IGFueSB7XG4gIGlmIChXcmFwcGVkVmFsdWUuaXNXcmFwcGVkKG5ld1ZhbHVlKSkge1xuICAgIG5ld1ZhbHVlID0gV3JhcHBlZFZhbHVlLnVud3JhcChuZXdWYWx1ZSk7XG4gICAgZ2V0TFZpZXcoKVtnZXRCaW5kaW5nUm9vdCgpXSA9IE5PX0NIQU5HRTtcbiAgfVxuICByZXR1cm4gbmV3VmFsdWU7XG59XG4iXX0=