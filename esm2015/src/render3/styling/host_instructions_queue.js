/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { DEFAULT_TEMPLATE_DIRECTIVE_INDEX } from '../styling/shared';
/*
 * This file contains the logic to defer all hostBindings-related styling code to run
 * at a later point, instead of immediately (as is the case with how template-level
 * styling instructions are run).
 *
 * Certain styling instructions, present within directives, components and sub-classed
 * directives, are evaluated at different points (depending on priority) and will therefore
 * not be applied to the styling context of an element immediately. They are instead
 * designed to be applied just before styling is applied to an element.
 *
 * (The priority for when certain host-related styling operations are executed is discussed
 * more within `interfaces/styling.ts`.)
 */
/**
 * @param {?} context
 * @param {?} directiveIndex
 * @return {?}
 */
export function registerHostDirective(context, directiveIndex) {
    /** @type {?} */
    let buffer = context[8 /* HostInstructionsQueue */];
    if (!buffer) {
        buffer = context[8 /* HostInstructionsQueue */] = [DEFAULT_TEMPLATE_DIRECTIVE_INDEX];
    }
    buffer[0 /* LastRegisteredDirectiveIndexPosition */] = directiveIndex;
}
/**
 * Queues a styling instruction to be run just before `renderStyling()` is executed.
 * @template T
 * @param {?} context
 * @param {?} priority
 * @param {?} instructionFn
 * @param {?} instructionFnArgs
 * @return {?}
 */
export function enqueueHostInstruction(context, priority, instructionFn, instructionFnArgs) {
    /** @type {?} */
    const buffer = context[8 /* HostInstructionsQueue */];
    // Buffer may be null if host element is a template node. In this case, just ignore the style.
    if (buffer != null) {
        /** @type {?} */
        const index = findNextInsertionIndex(buffer, priority);
        buffer.splice(index, 0, priority, instructionFn, instructionFnArgs);
    }
}
/**
 * Figures out where exactly to to insert the next host instruction queue entry.
 * @param {?} buffer
 * @param {?} priority
 * @return {?}
 */
function findNextInsertionIndex(buffer, priority) {
    for (let i = 1 /* ValuesStartPosition */; i < buffer.length; i += 3 /* Size */) {
        /** @type {?} */
        const p = (/** @type {?} */ (buffer[i + 0 /* DirectiveIndexOffset */]));
        if (p > priority) {
            return i;
        }
    }
    return buffer.length;
}
/**
 * Iterates through the host instructions queue (if present within the provided
 * context) and executes each queued instruction entry.
 * @param {?} context
 * @return {?}
 */
export function flushQueue(context) {
    /** @type {?} */
    const buffer = context[8 /* HostInstructionsQueue */];
    if (buffer) {
        for (let i = 1 /* ValuesStartPosition */; i < buffer.length; i += 3 /* Size */) {
            /** @type {?} */
            const fn = (/** @type {?} */ (buffer[i + 1 /* InstructionFnOffset */]));
            /** @type {?} */
            const args = (/** @type {?} */ (buffer[i + 2 /* ParamsOffset */]));
            fn.apply(this, args);
        }
        buffer.length = 1 /* ValuesStartPosition */;
    }
}
/**
 * Determines whether or not to allow the host instructions queue to be flushed or not.
 *
 * Because the hostBindings function code is unaware of the presence of other host bindings
 * (as well as the template function) then styling is evaluated multiple times per element.
 * To prevent style and class values from being applied to the element multiple times, a
 * flush is only allowed when the last directive (the directive that was registered into
 * the styling context) attempts to render its styling.
 * @param {?} context
 * @param {?} directiveIndex
 * @return {?}
 */
export function allowFlush(context, directiveIndex) {
    /** @type {?} */
    const buffer = context[8 /* HostInstructionsQueue */];
    if (buffer) {
        return buffer[0 /* LastRegisteredDirectiveIndexPosition */] ===
            directiveIndex;
    }
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdF9pbnN0cnVjdGlvbnNfcXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvaG9zdF9pbnN0cnVjdGlvbnNfcXVldWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JuRSxNQUFNLFVBQVUscUJBQXFCLENBQUMsT0FBdUIsRUFBRSxjQUFzQjs7UUFDL0UsTUFBTSxHQUFHLE9BQU8sK0JBQW9DO0lBQ3hELElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxNQUFNLEdBQUcsT0FBTywrQkFBb0MsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7S0FDM0Y7SUFDRCxNQUFNLDhDQUFpRSxHQUFHLGNBQWMsQ0FBQztBQUMzRixDQUFDOzs7Ozs7Ozs7O0FBS0QsTUFBTSxVQUFVLHNCQUFzQixDQUNsQyxPQUF1QixFQUFFLFFBQWdCLEVBQUUsYUFBZ0IsRUFBRSxpQkFBOEI7O1VBQ3ZGLE1BQU0sR0FBK0IsT0FBTywrQkFBb0M7SUFDdEYsOEZBQThGO0lBQzlGLElBQUksTUFBTSxJQUFJLElBQUksRUFBRTs7Y0FDWixLQUFLLEdBQUcsc0JBQXNCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztRQUN0RCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3JFO0FBQ0gsQ0FBQzs7Ozs7OztBQUtELFNBQVMsc0JBQXNCLENBQUMsTUFBNkIsRUFBRSxRQUFnQjtJQUM3RSxLQUFLLElBQUksQ0FBQyw4QkFBaUQsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFDekUsQ0FBQyxnQkFBbUMsRUFBRTs7Y0FDbkMsQ0FBQyxHQUFHLG1CQUFBLE1BQU0sQ0FBQyxDQUFDLCtCQUFrRCxDQUFDLEVBQVU7UUFDL0UsSUFBSSxDQUFDLEdBQUcsUUFBUSxFQUFFO1lBQ2hCLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7S0FDRjtJQUNELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUN2QixDQUFDOzs7Ozs7O0FBTUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxPQUF1Qjs7VUFDMUMsTUFBTSxHQUFHLE9BQU8sK0JBQW9DO0lBQzFELElBQUksTUFBTSxFQUFFO1FBQ1YsS0FBSyxJQUFJLENBQUMsOEJBQWlELEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQ3pFLENBQUMsZ0JBQW1DLEVBQUU7O2tCQUNuQyxFQUFFLEdBQUcsbUJBQUEsTUFBTSxDQUFDLENBQUMsOEJBQWlELENBQUMsRUFBWTs7a0JBQzNFLElBQUksR0FBRyxtQkFBQSxNQUFNLENBQUMsQ0FBQyx1QkFBMEMsQ0FBQyxFQUFTO1lBQ3pFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3RCO1FBQ0QsTUFBTSxDQUFDLE1BQU0sOEJBQWlELENBQUM7S0FDaEU7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLFVBQVUsQ0FBQyxPQUF1QixFQUFFLGNBQXNCOztVQUNsRSxNQUFNLEdBQUcsT0FBTywrQkFBb0M7SUFDMUQsSUFBSSxNQUFNLEVBQUU7UUFDVixPQUFPLE1BQU0sOENBQWlFO1lBQzFFLGNBQWMsQ0FBQztLQUNwQjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7SG9zdEluc3RydWN0aW9uc1F1ZXVlLCBIb3N0SW5zdHJ1Y3Rpb25zUXVldWVJbmRleCwgU3R5bGluZ0NvbnRleHQsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7REVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVh9IGZyb20gJy4uL3N0eWxpbmcvc2hhcmVkJztcblxuLypcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgbG9naWMgdG8gZGVmZXIgYWxsIGhvc3RCaW5kaW5ncy1yZWxhdGVkIHN0eWxpbmcgY29kZSB0byBydW5cbiAqIGF0IGEgbGF0ZXIgcG9pbnQsIGluc3RlYWQgb2YgaW1tZWRpYXRlbHkgKGFzIGlzIHRoZSBjYXNlIHdpdGggaG93IHRlbXBsYXRlLWxldmVsXG4gKiBzdHlsaW5nIGluc3RydWN0aW9ucyBhcmUgcnVuKS5cbiAqXG4gKiBDZXJ0YWluIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zLCBwcmVzZW50IHdpdGhpbiBkaXJlY3RpdmVzLCBjb21wb25lbnRzIGFuZCBzdWItY2xhc3NlZFxuICogZGlyZWN0aXZlcywgYXJlIGV2YWx1YXRlZCBhdCBkaWZmZXJlbnQgcG9pbnRzIChkZXBlbmRpbmcgb24gcHJpb3JpdHkpIGFuZCB3aWxsIHRoZXJlZm9yZVxuICogbm90IGJlIGFwcGxpZWQgdG8gdGhlIHN0eWxpbmcgY29udGV4dCBvZiBhbiBlbGVtZW50IGltbWVkaWF0ZWx5LiBUaGV5IGFyZSBpbnN0ZWFkXG4gKiBkZXNpZ25lZCB0byBiZSBhcHBsaWVkIGp1c3QgYmVmb3JlIHN0eWxpbmcgaXMgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICpcbiAqIChUaGUgcHJpb3JpdHkgZm9yIHdoZW4gY2VydGFpbiBob3N0LXJlbGF0ZWQgc3R5bGluZyBvcGVyYXRpb25zIGFyZSBleGVjdXRlZCBpcyBkaXNjdXNzZWRcbiAqIG1vcmUgd2l0aGluIGBpbnRlcmZhY2VzL3N0eWxpbmcudHNgLilcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJIb3N0RGlyZWN0aXZlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGxldCBidWZmZXIgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Ib3N0SW5zdHJ1Y3Rpb25zUXVldWVdO1xuICBpZiAoIWJ1ZmZlcikge1xuICAgIGJ1ZmZlciA9IGNvbnRleHRbU3R5bGluZ0luZGV4Lkhvc3RJbnN0cnVjdGlvbnNRdWV1ZV0gPSBbREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVhdO1xuICB9XG4gIGJ1ZmZlcltIb3N0SW5zdHJ1Y3Rpb25zUXVldWVJbmRleC5MYXN0UmVnaXN0ZXJlZERpcmVjdGl2ZUluZGV4UG9zaXRpb25dID0gZGlyZWN0aXZlSW5kZXg7XG59XG5cbi8qKlxuICogUXVldWVzIGEgc3R5bGluZyBpbnN0cnVjdGlvbiB0byBiZSBydW4ganVzdCBiZWZvcmUgYHJlbmRlclN0eWxpbmcoKWAgaXMgZXhlY3V0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnF1ZXVlSG9zdEluc3RydWN0aW9uPFQgZXh0ZW5kcyBGdW5jdGlvbj4oXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHByaW9yaXR5OiBudW1iZXIsIGluc3RydWN0aW9uRm46IFQsIGluc3RydWN0aW9uRm5BcmdzOiBQYXJhbXNPZjxUPikge1xuICBjb25zdCBidWZmZXI6IEhvc3RJbnN0cnVjdGlvbnNRdWV1ZXxudWxsID0gY29udGV4dFtTdHlsaW5nSW5kZXguSG9zdEluc3RydWN0aW9uc1F1ZXVlXTtcbiAgLy8gQnVmZmVyIG1heSBiZSBudWxsIGlmIGhvc3QgZWxlbWVudCBpcyBhIHRlbXBsYXRlIG5vZGUuIEluIHRoaXMgY2FzZSwganVzdCBpZ25vcmUgdGhlIHN0eWxlLlxuICBpZiAoYnVmZmVyICE9IG51bGwpIHtcbiAgICBjb25zdCBpbmRleCA9IGZpbmROZXh0SW5zZXJ0aW9uSW5kZXgoYnVmZmVyLCBwcmlvcml0eSk7XG4gICAgYnVmZmVyLnNwbGljZShpbmRleCwgMCwgcHJpb3JpdHksIGluc3RydWN0aW9uRm4sIGluc3RydWN0aW9uRm5BcmdzKTtcbiAgfVxufVxuXG4vKipcbiAqIEZpZ3VyZXMgb3V0IHdoZXJlIGV4YWN0bHkgdG8gdG8gaW5zZXJ0IHRoZSBuZXh0IGhvc3QgaW5zdHJ1Y3Rpb24gcXVldWUgZW50cnkuXG4gKi9cbmZ1bmN0aW9uIGZpbmROZXh0SW5zZXJ0aW9uSW5kZXgoYnVmZmVyOiBIb3N0SW5zdHJ1Y3Rpb25zUXVldWUsIHByaW9yaXR5OiBudW1iZXIpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGJ1ZmZlci5sZW5ndGg7XG4gICAgICAgaSArPSBIb3N0SW5zdHJ1Y3Rpb25zUXVldWVJbmRleC5TaXplKSB7XG4gICAgY29uc3QgcCA9IGJ1ZmZlcltpICsgSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguRGlyZWN0aXZlSW5kZXhPZmZzZXRdIGFzIG51bWJlcjtcbiAgICBpZiAocCA+IHByaW9yaXR5KSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ1ZmZlci5sZW5ndGg7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgaG9zdCBpbnN0cnVjdGlvbnMgcXVldWUgKGlmIHByZXNlbnQgd2l0aGluIHRoZSBwcm92aWRlZFxuICogY29udGV4dCkgYW5kIGV4ZWN1dGVzIGVhY2ggcXVldWVkIGluc3RydWN0aW9uIGVudHJ5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmx1c2hRdWV1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IHZvaWQge1xuICBjb25zdCBidWZmZXIgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Ib3N0SW5zdHJ1Y3Rpb25zUXVldWVdO1xuICBpZiAoYnVmZmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IEhvc3RJbnN0cnVjdGlvbnNRdWV1ZUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBidWZmZXIubGVuZ3RoO1xuICAgICAgICAgaSArPSBIb3N0SW5zdHJ1Y3Rpb25zUXVldWVJbmRleC5TaXplKSB7XG4gICAgICBjb25zdCBmbiA9IGJ1ZmZlcltpICsgSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguSW5zdHJ1Y3Rpb25Gbk9mZnNldF0gYXMgRnVuY3Rpb247XG4gICAgICBjb25zdCBhcmdzID0gYnVmZmVyW2kgKyBIb3N0SW5zdHJ1Y3Rpb25zUXVldWVJbmRleC5QYXJhbXNPZmZzZXRdIGFzIGFueVtdO1xuICAgICAgZm4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIGJ1ZmZlci5sZW5ndGggPSBIb3N0SW5zdHJ1Y3Rpb25zUXVldWVJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byBhbGxvdyB0aGUgaG9zdCBpbnN0cnVjdGlvbnMgcXVldWUgdG8gYmUgZmx1c2hlZCBvciBub3QuXG4gKlxuICogQmVjYXVzZSB0aGUgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGNvZGUgaXMgdW5hd2FyZSBvZiB0aGUgcHJlc2VuY2Ugb2Ygb3RoZXIgaG9zdCBiaW5kaW5nc1xuICogKGFzIHdlbGwgYXMgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKSB0aGVuIHN0eWxpbmcgaXMgZXZhbHVhdGVkIG11bHRpcGxlIHRpbWVzIHBlciBlbGVtZW50LlxuICogVG8gcHJldmVudCBzdHlsZSBhbmQgY2xhc3MgdmFsdWVzIGZyb20gYmVpbmcgYXBwbGllZCB0byB0aGUgZWxlbWVudCBtdWx0aXBsZSB0aW1lcywgYVxuICogZmx1c2ggaXMgb25seSBhbGxvd2VkIHdoZW4gdGhlIGxhc3QgZGlyZWN0aXZlICh0aGUgZGlyZWN0aXZlIHRoYXQgd2FzIHJlZ2lzdGVyZWQgaW50b1xuICogdGhlIHN0eWxpbmcgY29udGV4dCkgYXR0ZW1wdHMgdG8gcmVuZGVyIGl0cyBzdHlsaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dGbHVzaChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBidWZmZXIgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Ib3N0SW5zdHJ1Y3Rpb25zUXVldWVdO1xuICBpZiAoYnVmZmVyKSB7XG4gICAgcmV0dXJuIGJ1ZmZlcltIb3N0SW5zdHJ1Y3Rpb25zUXVldWVJbmRleC5MYXN0UmVnaXN0ZXJlZERpcmVjdGl2ZUluZGV4UG9zaXRpb25dID09PVxuICAgICAgICBkaXJlY3RpdmVJbmRleDtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBJbmZlcnMgdGhlIHBhcmFtZXRlcnMgb2YgYSBnaXZlbiBmdW5jdGlvbiBpbnRvIGEgdHlwZWQgYXJyYXkuXG4gKi9cbmV4cG9ydCB0eXBlIFBhcmFtc09mPFQ+ID0gVCBleHRlbmRzKC4uLmFyZ3M6IGluZmVyIFQpID0+IGFueSA/IFQgOiBuZXZlcjtcbiJdfQ==