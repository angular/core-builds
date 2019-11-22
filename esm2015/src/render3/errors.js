/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/errors.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { stringify } from '../util/stringify';
/**
 * Called when directives inject each other (creating a circular dependency)
 * @param {?} token
 * @return {?}
 */
export function throwCyclicDependencyError(token) {
    throw new Error(`Cannot instantiate cyclic dependency! ${token}`);
}
/**
 * Called when there are multiple component selectors that match a given node
 * @param {?} tNode
 * @return {?}
 */
export function throwMultipleComponentError(tNode) {
    throw new Error(`Multiple components match node with tagname ${tNode.tagName}`);
}
/**
 * Throws an ExpressionChangedAfterChecked error if checkNoChanges mode is on.
 * @param {?} creationMode
 * @param {?} oldValue
 * @param {?} currValue
 * @return {?}
 */
export function throwErrorIfNoChangesMode(creationMode, oldValue, currValue) {
    /** @type {?} */
    let msg = `ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: '${oldValue}'. Current value: '${currValue}'.`;
    if (creationMode) {
        msg +=
            ` It seems like the view has been created after its parent and its children have been dirty checked.` +
                ` Has it been created in a change detection hook ?`;
    }
    // TODO: include debug context
    throw new Error(msg);
}
/**
 * @return {?}
 */
export function throwMixedMultiProviderError() {
    throw new Error(`Cannot mix multi providers and regular providers`);
}
/**
 * @param {?=} ngModuleType
 * @param {?=} providers
 * @param {?=} provider
 * @return {?}
 */
export function throwInvalidProviderError(ngModuleType, providers, provider) {
    /** @type {?} */
    let ngModuleDetail = '';
    if (ngModuleType && providers) {
        /** @type {?} */
        const providerDetail = providers.map((/**
         * @param {?} v
         * @return {?}
         */
        v => v == provider ? '?' + provider + '?' : '...'));
        ngModuleDetail =
            ` - only instances of Provider and Type are allowed, got: [${providerDetail.join(', ')}]`;
    }
    throw new Error(`Invalid provider for the NgModule '${stringify(ngModuleType)}'` + ngModuleDetail);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7OztBQU01QyxNQUFNLFVBQVUsMEJBQTBCLENBQUMsS0FBVTtJQUNuRCxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7Ozs7OztBQUdELE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxLQUFZO0lBQ3RELE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ2xGLENBQUM7Ozs7Ozs7O0FBR0QsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxZQUFxQixFQUFFLFFBQWEsRUFBRSxTQUFjOztRQUNsRCxHQUFHLEdBQ0gsOEdBQThHLFFBQVEsc0JBQXNCLFNBQVMsSUFBSTtJQUM3SixJQUFJLFlBQVksRUFBRTtRQUNoQixHQUFHO1lBQ0MscUdBQXFHO2dCQUNyRyxtREFBbUQsQ0FBQztLQUN6RDtJQUNELDhCQUE4QjtJQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsNEJBQTRCO0lBQzFDLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztBQUN0RSxDQUFDOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxZQUFnQyxFQUFFLFNBQWlCLEVBQUUsUUFBYzs7UUFDakUsY0FBYyxHQUFHLEVBQUU7SUFDdkIsSUFBSSxZQUFZLElBQUksU0FBUyxFQUFFOztjQUN2QixjQUFjLEdBQUcsU0FBUyxDQUFDLEdBQUc7Ozs7UUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxRQUFRLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUM7UUFDdkYsY0FBYztZQUNWLDZEQUE2RCxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7S0FDL0Y7SUFFRCxNQUFNLElBQUksS0FBSyxDQUNYLHNDQUFzQyxTQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsR0FBRyxjQUFjLENBQUMsQ0FBQztBQUN6RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0luamVjdG9yVHlwZX0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuXG5cbi8qKiBDYWxsZWQgd2hlbiBkaXJlY3RpdmVzIGluamVjdCBlYWNoIG90aGVyIChjcmVhdGluZyBhIGNpcmN1bGFyIGRlcGVuZGVuY3kpICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IodG9rZW46IGFueSk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgaW5zdGFudGlhdGUgY3ljbGljIGRlcGVuZGVuY3khICR7dG9rZW59YCk7XG59XG5cbi8qKiBDYWxsZWQgd2hlbiB0aGVyZSBhcmUgbXVsdGlwbGUgY29tcG9uZW50IHNlbGVjdG9ycyB0aGF0IG1hdGNoIGEgZ2l2ZW4gbm9kZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZTogVE5vZGUpOiBuZXZlciB7XG4gIHRocm93IG5ldyBFcnJvcihgTXVsdGlwbGUgY29tcG9uZW50cyBtYXRjaCBub2RlIHdpdGggdGFnbmFtZSAke3ROb2RlLnRhZ05hbWV9YCk7XG59XG5cbi8qKiBUaHJvd3MgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IgaWYgY2hlY2tOb0NoYW5nZXMgbW9kZSBpcyBvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKFxuICAgIGNyZWF0aW9uTW9kZTogYm9vbGVhbiwgb2xkVmFsdWU6IGFueSwgY3VyclZhbHVlOiBhbnkpOiBuZXZlcnx2b2lkIHtcbiAgbGV0IG1zZyA9XG4gICAgICBgRXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcjogRXhwcmVzc2lvbiBoYXMgY2hhbmdlZCBhZnRlciBpdCB3YXMgY2hlY2tlZC4gUHJldmlvdXMgdmFsdWU6ICcke29sZFZhbHVlfScuIEN1cnJlbnQgdmFsdWU6ICcke2N1cnJWYWx1ZX0nLmA7XG4gIGlmIChjcmVhdGlvbk1vZGUpIHtcbiAgICBtc2cgKz1cbiAgICAgICAgYCBJdCBzZWVtcyBsaWtlIHRoZSB2aWV3IGhhcyBiZWVuIGNyZWF0ZWQgYWZ0ZXIgaXRzIHBhcmVudCBhbmQgaXRzIGNoaWxkcmVuIGhhdmUgYmVlbiBkaXJ0eSBjaGVja2VkLmAgK1xuICAgICAgICBgIEhhcyBpdCBiZWVuIGNyZWF0ZWQgaW4gYSBjaGFuZ2UgZGV0ZWN0aW9uIGhvb2sgP2A7XG4gIH1cbiAgLy8gVE9ETzogaW5jbHVkZSBkZWJ1ZyBjb250ZXh0XG4gIHRocm93IG5ldyBFcnJvcihtc2cpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dNaXhlZE11bHRpUHJvdmlkZXJFcnJvcigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgbWl4IG11bHRpIHByb3ZpZGVycyBhbmQgcmVndWxhciBwcm92aWRlcnNgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IoXG4gICAgbmdNb2R1bGVUeXBlPzogSW5qZWN0b3JUeXBlPGFueT4sIHByb3ZpZGVycz86IGFueVtdLCBwcm92aWRlcj86IGFueSkge1xuICBsZXQgbmdNb2R1bGVEZXRhaWwgPSAnJztcbiAgaWYgKG5nTW9kdWxlVHlwZSAmJiBwcm92aWRlcnMpIHtcbiAgICBjb25zdCBwcm92aWRlckRldGFpbCA9IHByb3ZpZGVycy5tYXAodiA9PiB2ID09IHByb3ZpZGVyID8gJz8nICsgcHJvdmlkZXIgKyAnPycgOiAnLi4uJyk7XG4gICAgbmdNb2R1bGVEZXRhaWwgPVxuICAgICAgICBgIC0gb25seSBpbnN0YW5jZXMgb2YgUHJvdmlkZXIgYW5kIFR5cGUgYXJlIGFsbG93ZWQsIGdvdDogWyR7cHJvdmlkZXJEZXRhaWwuam9pbignLCAnKX1dYDtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBJbnZhbGlkIHByb3ZpZGVyIGZvciB0aGUgTmdNb2R1bGUgJyR7c3RyaW5naWZ5KG5nTW9kdWxlVHlwZSl9J2AgKyBuZ01vZHVsZURldGFpbCk7XG59XG4iXX0=