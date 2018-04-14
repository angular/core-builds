/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { global } from '../util';
/**
 * A scope function for the Web Tracing Framework (WTF).
 *
 * \@experimental
 * @record
 */
export function WtfScopeFn() { }
function WtfScopeFn_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (arg0?: any, arg1?: any): any;
    */
}
/**
 * @record
 */
function WTF() { }
function WTF_tsickle_Closure_declarations() {
    /** @type {?} */
    WTF.prototype.trace;
}
/**
 * @record
 */
function Trace() { }
function Trace_tsickle_Closure_declarations() {
    /** @type {?} */
    Trace.prototype.events;
    /** @type {?} */
    Trace.prototype.leaveScope;
    /** @type {?} */
    Trace.prototype.beginTimeRange;
    /** @type {?} */
    Trace.prototype.endTimeRange;
}
/**
 * @record
 */
export function Range() { }
function Range_tsickle_Closure_declarations() {
}
/**
 * @record
 */
function Events() { }
function Events_tsickle_Closure_declarations() {
    /** @type {?} */
    Events.prototype.createScope;
}
/**
 * @record
 */
export function Scope() { }
function Scope_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (...args: any[] __* TODO #9100 __): any;
    */
}
let /** @type {?} */ trace;
let /** @type {?} */ events;
/**
 * @return {?}
 */
export function detectWTF() {
    const /** @type {?} */ wtf = (/** @type {?} */ (global /** TODO #9100 */) /** TODO #9100 */)['wtf'];
    if (wtf) {
        trace = wtf['trace'];
        if (trace) {
            events = trace['events'];
            return true;
        }
    }
    return false;
}
/**
 * @param {?} signature
 * @param {?=} flags
 * @return {?}
 */
export function createScope(signature, flags = null) {
    return events.createScope(signature, flags);
}
/**
 * @template T
 * @param {?} scope
 * @param {?=} returnValue
 * @return {?}
 */
export function leave(scope, returnValue) {
    trace.leaveScope(scope, returnValue);
    return returnValue;
}
/**
 * @param {?} rangeType
 * @param {?} action
 * @return {?}
 */
export function startTimeRange(rangeType, action) {
    return trace.beginTimeRange(rangeType, action);
}
/**
 * @param {?} range
 * @return {?}
 */
export function endTimeRange(range) {
    trace.endTimeRange(range);
}
//# sourceMappingURL=wtf_impl.js.map