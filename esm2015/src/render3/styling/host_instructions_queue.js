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
    const buffer = (/** @type {?} */ (context[8 /* HostInstructionsQueue */]));
    /** @type {?} */
    const index = findNextInsertionIndex(buffer, priority);
    buffer.splice(index, 0, priority, instructionFn, instructionFnArgs);
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
            fn(...args);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdF9pbnN0cnVjdGlvbnNfcXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvaG9zdF9pbnN0cnVjdGlvbnNfcXVldWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JuRSxNQUFNLFVBQVUscUJBQXFCLENBQUMsT0FBdUIsRUFBRSxjQUFzQjs7UUFDL0UsTUFBTSxHQUFHLE9BQU8sK0JBQW9DO0lBQ3hELElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxNQUFNLEdBQUcsT0FBTywrQkFBb0MsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7S0FDM0Y7SUFDRCxNQUFNLDhDQUFpRSxHQUFHLGNBQWMsQ0FBQztBQUMzRixDQUFDOzs7Ozs7Ozs7O0FBS0QsTUFBTSxVQUFVLHNCQUFzQixDQUNsQyxPQUF1QixFQUFFLFFBQWdCLEVBQUUsYUFBZ0IsRUFBRSxpQkFBOEI7O1VBQ3ZGLE1BQU0sR0FBMEIsbUJBQUEsT0FBTywrQkFBb0MsRUFBRTs7VUFDN0UsS0FBSyxHQUFHLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUM7SUFDdEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUN0RSxDQUFDOzs7Ozs7O0FBS0QsU0FBUyxzQkFBc0IsQ0FBQyxNQUE2QixFQUFFLFFBQWdCO0lBQzdFLEtBQUssSUFBSSxDQUFDLDhCQUFpRCxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUN6RSxDQUFDLGdCQUFtQyxFQUFFOztjQUNuQyxDQUFDLEdBQUcsbUJBQUEsTUFBTSxDQUFDLENBQUMsK0JBQWtELENBQUMsRUFBVTtRQUMvRSxJQUFJLENBQUMsR0FBRyxRQUFRLEVBQUU7WUFDaEIsT0FBTyxDQUFDLENBQUM7U0FDVjtLQUNGO0lBQ0QsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ3ZCLENBQUM7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsVUFBVSxDQUFDLE9BQXVCOztVQUMxQyxNQUFNLEdBQUcsT0FBTywrQkFBb0M7SUFDMUQsSUFBSSxNQUFNLEVBQUU7UUFDVixLQUFLLElBQUksQ0FBQyw4QkFBaUQsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFDekUsQ0FBQyxnQkFBbUMsRUFBRTs7a0JBQ25DLEVBQUUsR0FBRyxtQkFBQSxNQUFNLENBQUMsQ0FBQyw4QkFBaUQsQ0FBQyxFQUFZOztrQkFDM0UsSUFBSSxHQUFHLG1CQUFBLE1BQU0sQ0FBQyxDQUFDLHVCQUEwQyxDQUFDLEVBQVM7WUFDekUsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDYjtRQUNELE1BQU0sQ0FBQyxNQUFNLDhCQUFpRCxDQUFDO0tBQ2hFO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxVQUFVLENBQUMsT0FBdUIsRUFBRSxjQUFzQjs7VUFDbEUsTUFBTSxHQUFHLE9BQU8sK0JBQW9DO0lBQzFELElBQUksTUFBTSxFQUFFO1FBQ1YsT0FBTyxNQUFNLDhDQUFpRTtZQUMxRSxjQUFjLENBQUM7S0FDcEI7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge0hvc3RJbnN0cnVjdGlvbnNRdWV1ZSwgSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXgsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0RFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYfSBmcm9tICcuLi9zdHlsaW5nL3NoYXJlZCc7XG5cbi8qXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGxvZ2ljIHRvIGRlZmVyIGFsbCBob3N0QmluZGluZ3MtcmVsYXRlZCBzdHlsaW5nIGNvZGUgdG8gcnVuXG4gKiBhdCBhIGxhdGVyIHBvaW50LCBpbnN0ZWFkIG9mIGltbWVkaWF0ZWx5IChhcyBpcyB0aGUgY2FzZSB3aXRoIGhvdyB0ZW1wbGF0ZS1sZXZlbFxuICogc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHJ1bikuXG4gKlxuICogQ2VydGFpbiBzdHlsaW5nIGluc3RydWN0aW9ucywgcHJlc2VudCB3aXRoaW4gZGlyZWN0aXZlcywgY29tcG9uZW50cyBhbmQgc3ViLWNsYXNzZWRcbiAqIGRpcmVjdGl2ZXMsIGFyZSBldmFsdWF0ZWQgYXQgZGlmZmVyZW50IHBvaW50cyAoZGVwZW5kaW5nIG9uIHByaW9yaXR5KSBhbmQgd2lsbCB0aGVyZWZvcmVcbiAqIG5vdCBiZSBhcHBsaWVkIHRvIHRoZSBzdHlsaW5nIGNvbnRleHQgb2YgYW4gZWxlbWVudCBpbW1lZGlhdGVseS4gVGhleSBhcmUgaW5zdGVhZFxuICogZGVzaWduZWQgdG8gYmUgYXBwbGllZCBqdXN0IGJlZm9yZSBzdHlsaW5nIGlzIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiAoVGhlIHByaW9yaXR5IGZvciB3aGVuIGNlcnRhaW4gaG9zdC1yZWxhdGVkIHN0eWxpbmcgb3BlcmF0aW9ucyBhcmUgZXhlY3V0ZWQgaXMgZGlzY3Vzc2VkXG4gKiBtb3JlIHdpdGhpbiBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzYC4pXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySG9zdERpcmVjdGl2ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBsZXQgYnVmZmVyID0gY29udGV4dFtTdHlsaW5nSW5kZXguSG9zdEluc3RydWN0aW9uc1F1ZXVlXTtcbiAgaWYgKCFidWZmZXIpIHtcbiAgICBidWZmZXIgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Ib3N0SW5zdHJ1Y3Rpb25zUXVldWVdID0gW0RFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYXTtcbiAgfVxuICBidWZmZXJbSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguTGFzdFJlZ2lzdGVyZWREaXJlY3RpdmVJbmRleFBvc2l0aW9uXSA9IGRpcmVjdGl2ZUluZGV4O1xufVxuXG4vKipcbiAqIFF1ZXVlcyBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdG8gYmUgcnVuIGp1c3QgYmVmb3JlIGByZW5kZXJTdHlsaW5nKClgIGlzIGV4ZWN1dGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbjxUIGV4dGVuZHMgRnVuY3Rpb24+KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBwcmlvcml0eTogbnVtYmVyLCBpbnN0cnVjdGlvbkZuOiBULCBpbnN0cnVjdGlvbkZuQXJnczogUGFyYW1zT2Y8VD4pIHtcbiAgY29uc3QgYnVmZmVyOiBIb3N0SW5zdHJ1Y3Rpb25zUXVldWUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Ib3N0SW5zdHJ1Y3Rpb25zUXVldWVdICE7XG4gIGNvbnN0IGluZGV4ID0gZmluZE5leHRJbnNlcnRpb25JbmRleChidWZmZXIsIHByaW9yaXR5KTtcbiAgYnVmZmVyLnNwbGljZShpbmRleCwgMCwgcHJpb3JpdHksIGluc3RydWN0aW9uRm4sIGluc3RydWN0aW9uRm5BcmdzKTtcbn1cblxuLyoqXG4gKiBGaWd1cmVzIG91dCB3aGVyZSBleGFjdGx5IHRvIHRvIGluc2VydCB0aGUgbmV4dCBob3N0IGluc3RydWN0aW9uIHF1ZXVlIGVudHJ5LlxuICovXG5mdW5jdGlvbiBmaW5kTmV4dEluc2VydGlvbkluZGV4KGJ1ZmZlcjogSG9zdEluc3RydWN0aW9uc1F1ZXVlLCBwcmlvcml0eTogbnVtYmVyKTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IEhvc3RJbnN0cnVjdGlvbnNRdWV1ZUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBidWZmZXIubGVuZ3RoO1xuICAgICAgIGkgKz0gSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IHAgPSBidWZmZXJbaSArIEhvc3RJbnN0cnVjdGlvbnNRdWV1ZUluZGV4LkRpcmVjdGl2ZUluZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gICAgaWYgKHAgPiBwcmlvcml0eSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBidWZmZXIubGVuZ3RoO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIGhvc3QgaW5zdHJ1Y3Rpb25zIHF1ZXVlIChpZiBwcmVzZW50IHdpdGhpbiB0aGUgcHJvdmlkZWRcbiAqIGNvbnRleHQpIGFuZCBleGVjdXRlcyBlYWNoIHF1ZXVlZCBpbnN0cnVjdGlvbiBlbnRyeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoUXVldWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiB2b2lkIHtcbiAgY29uc3QgYnVmZmVyID0gY29udGV4dFtTdHlsaW5nSW5kZXguSG9zdEluc3RydWN0aW9uc1F1ZXVlXTtcbiAgaWYgKGJ1ZmZlcikge1xuICAgIGZvciAobGV0IGkgPSBIb3N0SW5zdHJ1Y3Rpb25zUXVldWVJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgYnVmZmVyLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguU2l6ZSkge1xuICAgICAgY29uc3QgZm4gPSBidWZmZXJbaSArIEhvc3RJbnN0cnVjdGlvbnNRdWV1ZUluZGV4Lkluc3RydWN0aW9uRm5PZmZzZXRdIGFzIEZ1bmN0aW9uO1xuICAgICAgY29uc3QgYXJncyA9IGJ1ZmZlcltpICsgSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguUGFyYW1zT2Zmc2V0XSBhcyBhbnlbXTtcbiAgICAgIGZuKC4uLmFyZ3MpO1xuICAgIH1cbiAgICBidWZmZXIubGVuZ3RoID0gSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdG8gYWxsb3cgdGhlIGhvc3QgaW5zdHJ1Y3Rpb25zIHF1ZXVlIHRvIGJlIGZsdXNoZWQgb3Igbm90LlxuICpcbiAqIEJlY2F1c2UgdGhlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBjb2RlIGlzIHVuYXdhcmUgb2YgdGhlIHByZXNlbmNlIG9mIG90aGVyIGhvc3QgYmluZGluZ3NcbiAqIChhcyB3ZWxsIGFzIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbikgdGhlbiBzdHlsaW5nIGlzIGV2YWx1YXRlZCBtdWx0aXBsZSB0aW1lcyBwZXIgZWxlbWVudC5cbiAqIFRvIHByZXZlbnQgc3R5bGUgYW5kIGNsYXNzIHZhbHVlcyBmcm9tIGJlaW5nIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgbXVsdGlwbGUgdGltZXMsIGFcbiAqIGZsdXNoIGlzIG9ubHkgYWxsb3dlZCB3aGVuIHRoZSBsYXN0IGRpcmVjdGl2ZSAodGhlIGRpcmVjdGl2ZSB0aGF0IHdhcyByZWdpc3RlcmVkIGludG9cbiAqIHRoZSBzdHlsaW5nIGNvbnRleHQpIGF0dGVtcHRzIHRvIHJlbmRlciBpdHMgc3R5bGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93Rmx1c2goY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYnVmZmVyID0gY29udGV4dFtTdHlsaW5nSW5kZXguSG9zdEluc3RydWN0aW9uc1F1ZXVlXTtcbiAgaWYgKGJ1ZmZlcikge1xuICAgIHJldHVybiBidWZmZXJbSG9zdEluc3RydWN0aW9uc1F1ZXVlSW5kZXguTGFzdFJlZ2lzdGVyZWREaXJlY3RpdmVJbmRleFBvc2l0aW9uXSA9PT1cbiAgICAgICAgZGlyZWN0aXZlSW5kZXg7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogSW5mZXJzIHRoZSBwYXJhbWV0ZXJzIG9mIGEgZ2l2ZW4gZnVuY3Rpb24gaW50byBhIHR5cGVkIGFycmF5LlxuICovXG5leHBvcnQgdHlwZSBQYXJhbXNPZjxUPiA9IFQgZXh0ZW5kcyguLi5hcmdzOiBpbmZlciBUKSA9PiBhbnkgPyBUIDogbmV2ZXI7XG4iXX0=