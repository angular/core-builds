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
import { getTView, load, store } from './instructions';
import { HEADER_OFFSET } from './interfaces/view';
import { pureFunction1, pureFunction2, pureFunction3, pureFunction4, pureFunctionV } from './pure_function';
/**
 * Create a pipe.
 *
 * @param {?} index Pipe index where the pipe will be stored.
 * @param {?} pipeName The name of the pipe
 * @return {?} T the instance of the pipe.
 */
export function pipe(index, pipeName) {
    /** @type {?} */
    const tView = getTView();
    /** @type {?} */
    let pipeDef;
    /** @type {?} */
    const adjustedIndex = index + HEADER_OFFSET;
    if (tView.firstTemplatePass) {
        pipeDef = getPipeDef(pipeName, tView.pipeRegistry);
        tView.data[adjustedIndex] = pipeDef;
        if (pipeDef.onDestroy) {
            (tView.pipeDestroyHooks || (tView.pipeDestroyHooks = [])).push(adjustedIndex, pipeDef.onDestroy);
        }
    }
    else {
        pipeDef = /** @type {?} */ (tView.data[adjustedIndex]);
    }
    /** @type {?} */
    const pipeInstance = pipeDef.factory();
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
        for (let i = 0; i < registry.length; i++) {
            /** @type {?} */
            const pipeDef = registry[i];
            if (name === pipeDef.name) {
                return pipeDef;
            }
        }
    }
    throw new Error(`Pipe with name '${name}' not found!`);
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
    return isPure(index) ? pureFunction1(slotOffset, pipeInstance.transform, v1, pipeInstance) :
        pipeInstance.transform(v1);
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
    return isPure(index) ? pureFunction2(slotOffset, pipeInstance.transform, v1, v2, pipeInstance) :
        pipeInstance.transform(v1, v2);
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
    return isPure(index) ?
        pureFunction3(slotOffset, pipeInstance.transform, v1, v2, v3, pipeInstance) :
        pipeInstance.transform(v1, v2, v3);
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
    return isPure(index) ?
        pureFunction4(slotOffset, pipeInstance.transform, v1, v2, v3, v4, pipeInstance) :
        pipeInstance.transform(v1, v2, v3, v4);
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
    return isPure(index) ? pureFunctionV(slotOffset, pipeInstance.transform, values, pipeInstance) :
        pipeInstance.transform.apply(pipeInstance, values);
}
/**
 * @param {?} index
 * @return {?}
 */
function isPure(index) {
    return (/** @type {?} */ (getTView().data[index + HEADER_OFFSET])).pure;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXJELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBQyxNQUFNLGlCQUFpQixDQUFDOzs7Ozs7OztBQVMxRyxNQUFNLFVBQVUsSUFBSSxDQUFDLEtBQWEsRUFBRSxRQUFnQjs7SUFDbEQsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7O0lBQ3pCLElBQUksT0FBTyxDQUF1Qjs7SUFDbEMsTUFBTSxhQUFhLEdBQUcsS0FBSyxHQUFHLGFBQWEsQ0FBQztJQUU1QyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUMzQixPQUFPLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkQsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxPQUFPLENBQUM7UUFDcEMsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3JCLENBQUMsS0FBSyxDQUFDLGdCQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixHQUFHLEVBQ25ELENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO0tBQ0Y7U0FBTTtRQUNMLE9BQU8scUJBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQXlCLENBQUEsQ0FBQztLQUM3RDs7SUFFRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMs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QUM7SUFDaEQsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUN6RSxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7Q0FDM0U7Ozs7O0FBRUQsU0FBUyxNQUFNLENBQUMsS0FBYTtJQUMzQixPQUFPLG1CQUF1QixRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxFQUFDLENBQUMsSUFBSSxDQUFDO0NBQzVFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1BpcGVUcmFuc2Zvcm19IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vcGlwZV90cmFuc2Zvcm0nO1xuXG5pbXBvcnQge2dldFRWaWV3LCBsb2FkLCBzdG9yZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtQaXBlRGVmSW50ZXJuYWwsIFBpcGVEZWZMaXN0fSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0hFQURFUl9PRkZTRVR9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7cHVyZUZ1bmN0aW9uMSwgcHVyZUZ1bmN0aW9uMiwgcHVyZUZ1bmN0aW9uMywgcHVyZUZ1bmN0aW9uNCwgcHVyZUZ1bmN0aW9uVn0gZnJvbSAnLi9wdXJlX2Z1bmN0aW9uJztcblxuLyoqXG4gKiBDcmVhdGUgYSBwaXBlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBQaXBlIGluZGV4IHdoZXJlIHRoZSBwaXBlIHdpbGwgYmUgc3RvcmVkLlxuICogQHBhcmFtIHBpcGVOYW1lIFRoZSBuYW1lIG9mIHRoZSBwaXBlXG4gKiBAcmV0dXJucyBUIHRoZSBpbnN0YW5jZSBvZiB0aGUgcGlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBpcGUoaW5kZXg6IG51bWJlciwgcGlwZU5hbWU6IHN0cmluZyk6IGFueSB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgbGV0IHBpcGVEZWY6IFBpcGVEZWZJbnRlcm5hbDxhbnk+O1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHBpcGVEZWYgPSBnZXRQaXBlRGVmKHBpcGVOYW1lLCB0Vmlldy5waXBlUmVnaXN0cnkpO1xuICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBwaXBlRGVmO1xuICAgIGlmIChwaXBlRGVmLm9uRGVzdHJveSkge1xuICAgICAgKHRWaWV3LnBpcGVEZXN0cm95SG9va3MgfHwgKHRWaWV3LnBpcGVEZXN0cm95SG9va3MgPSBbXG4gICAgICAgXSkpLnB1c2goYWRqdXN0ZWRJbmRleCwgcGlwZURlZi5vbkRlc3Ryb3kpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwaXBlRGVmID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSBhcyBQaXBlRGVmSW50ZXJuYWw8YW55PjtcbiAgfVxuXG4gIGNvbnN0IHBpcGVJbnN0YW5jZSA9IHBpcGVEZWYuZmFjdG9yeSgpO1xuICBzdG9yZShpbmRleCwgcGlwZUluc3RhbmNlKTtcbiAgcmV0dXJuIHBpcGVJbnN0YW5jZTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyB0aGUgcGlwZSByZWdpc3RyeSBmb3IgYSBwaXBlIHdpdGggdGhlIGdpdmVuIG5hbWUuIElmIG9uZSBpcyBmb3VuZCxcbiAqIHJldHVybnMgdGhlIHBpcGUuIE90aGVyd2lzZSwgYW4gZXJyb3IgaXMgdGhyb3duIGJlY2F1c2UgdGhlIHBpcGUgY2Fubm90IGJlIHJlc29sdmVkLlxuICpcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgcGlwZSB0byByZXNvbHZlXG4gKiBAcGFyYW0gcmVnaXN0cnkgRnVsbCBsaXN0IG9mIGF2YWlsYWJsZSBwaXBlc1xuICogQHJldHVybnMgTWF0Y2hpbmcgUGlwZURlZlxuICovXG5mdW5jdGlvbiBnZXRQaXBlRGVmKG5hbWU6IHN0cmluZywgcmVnaXN0cnk6IFBpcGVEZWZMaXN0IHwgbnVsbCk6IFBpcGVEZWZJbnRlcm5hbDxhbnk+IHtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcGlwZURlZiA9IHJlZ2lzdHJ5W2ldO1xuICAgICAgaWYgKG5hbWUgPT09IHBpcGVEZWYubmFtZSkge1xuICAgICAgICByZXR1cm4gcGlwZURlZjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBQaXBlIHdpdGggbmFtZSAnJHtuYW1lfScgbm90IGZvdW5kIWApO1xufVxuXG4vKipcbiAqIEludm9rZXMgYSBwaXBlIHdpdGggMSBhcmd1bWVudHMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBhY3RzIGFzIGEgZ3VhcmQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBpbnZva2luZ1xuICogdGhlIHBpcGUgb25seSB3aGVuIGFuIGlucHV0IHRvIHRoZSBwaXBlIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGluZGV4IFBpcGUgaW5kZXggd2hlcmUgdGhlIHBpcGUgd2FzIHN0b3JlZCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgaW4gdGhlIHJlc2VydmVkIHNsb3Qgc3BhY2VcbiAqIEBwYXJhbSB2MSAxc3QgYXJndW1lbnQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBpcGVCaW5kMShpbmRleDogbnVtYmVyLCBzbG90T2Zmc2V0OiBudW1iZXIsIHYxOiBhbnkpOiBhbnkge1xuICBjb25zdCBwaXBlSW5zdGFuY2UgPSBsb2FkPFBpcGVUcmFuc2Zvcm0+KGluZGV4KTtcbiAgcmV0dXJuIGlzUHVyZShpbmRleCkgPyBwdXJlRnVuY3Rpb24xKHNsb3RPZmZzZXQsIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0sIHYxLCBwaXBlSW5zdGFuY2UpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICBwaXBlSW5zdGFuY2UudHJhbnNmb3JtKHYxKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIDIgYXJndW1lbnRzLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gYWN0cyBhcyBhIGd1YXJkIHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0gaW52b2tpbmdcbiAqIHRoZSBwaXBlIG9ubHkgd2hlbiBhbiBpbnB1dCB0byB0aGUgcGlwZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBQaXBlIGluZGV4IHdoZXJlIHRoZSBwaXBlIHdhcyBzdG9yZWQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlXG4gKiBAcGFyYW0gdjEgMXN0IGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjIgMm5kIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaXBlQmluZDIoaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2MTogYW55LCB2MjogYW55KTogYW55IHtcbiAgY29uc3QgcGlwZUluc3RhbmNlID0gbG9hZDxQaXBlVHJhbnNmb3JtPihpbmRleCk7XG4gIHJldHVybiBpc1B1cmUoaW5kZXgpID8gcHVyZUZ1bmN0aW9uMihzbG90T2Zmc2V0LCBwaXBlSW5zdGFuY2UudHJhbnNmb3JtLCB2MSwgdjIsIHBpcGVJbnN0YW5jZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0odjEsIHYyKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIDMgYXJndW1lbnRzLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gYWN0cyBhcyBhIGd1YXJkIHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0gaW52b2tpbmdcbiAqIHRoZSBwaXBlIG9ubHkgd2hlbiBhbiBpbnB1dCB0byB0aGUgcGlwZSBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBQaXBlIGluZGV4IHdoZXJlIHRoZSBwaXBlIHdhcyBzdG9yZWQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlXG4gKiBAcGFyYW0gdjEgMXN0IGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjIgMm5kIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKiBAcGFyYW0gdjMgNHJkIGFyZ3VtZW50IHRvIHtAbGluayBQaXBlVHJhbnNmb3JtI3RyYW5zZm9ybX0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaXBlQmluZDMoaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2MTogYW55LCB2MjogYW55LCB2MzogYW55KTogYW55IHtcbiAgY29uc3QgcGlwZUluc3RhbmNlID0gbG9hZDxQaXBlVHJhbnNmb3JtPihpbmRleCk7XG4gIHJldHVybiBpc1B1cmUoaW5kZXgpID9cbiAgICAgIHB1cmVGdW5jdGlvbjMoc2xvdE9mZnNldCwgcGlwZUluc3RhbmNlLnRyYW5zZm9ybSwgdjEsIHYyLCB2MywgcGlwZUluc3RhbmNlKSA6XG4gICAgICBwaXBlSW5zdGFuY2UudHJhbnNmb3JtKHYxLCB2MiwgdjMpO1xufVxuXG4vKipcbiAqIEludm9rZXMgYSBwaXBlIHdpdGggNCBhcmd1bWVudHMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBhY3RzIGFzIGEgZ3VhcmQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBpbnZva2luZ1xuICogdGhlIHBpcGUgb25seSB3aGVuIGFuIGlucHV0IHRvIHRoZSBwaXBlIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGluZGV4IFBpcGUgaW5kZXggd2hlcmUgdGhlIHBpcGUgd2FzIHN0b3JlZCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgaW4gdGhlIHJlc2VydmVkIHNsb3Qgc3BhY2VcbiAqIEBwYXJhbSB2MSAxc3QgYXJndW1lbnQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfS5cbiAqIEBwYXJhbSB2MiAybmQgYXJndW1lbnQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfS5cbiAqIEBwYXJhbSB2MyAzcmQgYXJndW1lbnQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfS5cbiAqIEBwYXJhbSB2NCA0dGggYXJndW1lbnQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBpcGVCaW5kNChcbiAgICBpbmRleDogbnVtYmVyLCBzbG90T2Zmc2V0OiBudW1iZXIsIHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnkpOiBhbnkge1xuICBjb25zdCBwaXBlSW5zdGFuY2UgPSBsb2FkPFBpcGVUcmFuc2Zvcm0+KGluZGV4KTtcbiAgcmV0dXJuIGlzUHVyZShpbmRleCkgP1xuICAgICAgcHVyZUZ1bmN0aW9uNChzbG90T2Zmc2V0LCBwaXBlSW5zdGFuY2UudHJhbnNmb3JtLCB2MSwgdjIsIHYzLCB2NCwgcGlwZUluc3RhbmNlKSA6XG4gICAgICBwaXBlSW5zdGFuY2UudHJhbnNmb3JtKHYxLCB2MiwgdjMsIHY0KTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGEgcGlwZSB3aXRoIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBhY3RzIGFzIGEgZ3VhcmQgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBpbnZva2luZ1xuICogdGhlIHBpcGUgb25seSB3aGVuIGFuIGlucHV0IHRvIHRoZSBwaXBlIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGluZGV4IFBpcGUgaW5kZXggd2hlcmUgdGhlIHBpcGUgd2FzIHN0b3JlZCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgaW4gdGhlIHJlc2VydmVkIHNsb3Qgc3BhY2VcbiAqIEBwYXJhbSB2YWx1ZXMgQXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3MgdG8ge0BsaW5rIFBpcGVUcmFuc2Zvcm0jdHJhbnNmb3JtfSBtZXRob2QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaXBlQmluZFYoaW5kZXg6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCB2YWx1ZXM6IGFueVtdKTogYW55IHtcbiAgY29uc3QgcGlwZUluc3RhbmNlID0gbG9hZDxQaXBlVHJhbnNmb3JtPihpbmRleCk7XG4gIHJldHVybiBpc1B1cmUoaW5kZXgpID8gcHVyZUZ1bmN0aW9uVihzbG90T2Zmc2V0LCBwaXBlSW5zdGFuY2UudHJhbnNmb3JtLCB2YWx1ZXMsIHBpcGVJbnN0YW5jZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGVJbnN0YW5jZS50cmFuc2Zvcm0uYXBwbHkocGlwZUluc3RhbmNlLCB2YWx1ZXMpO1xufVxuXG5mdW5jdGlvbiBpc1B1cmUoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKDxQaXBlRGVmSW50ZXJuYWw8YW55Pj5nZXRUVmlldygpLmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSkucHVyZTtcbn1cbiJdfQ==