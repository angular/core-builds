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
/**
 * A shared interface which contains an animation player
 * @record
 */
export function Player() { }
/** @type {?|undefined} */
Player.prototype.parent;
/** @type {?} */
Player.prototype.state;
/** @type {?} */
Player.prototype.play;
/** @type {?} */
Player.prototype.pause;
/** @type {?} */
Player.prototype.finish;
/** @type {?} */
Player.prototype.destroy;
/** @type {?} */
Player.prototype.addEventListener;
/** @enum {number} */
var PlayState = {
    Pending: 0, Running: 1, Paused: 2, Finished: 100, Destroyed: 200,
};
export { PlayState };
/**
 * Designed to be used as an injection service to capture all animation players.
 *
 * When present all animation players will be passed into the flush method below.
 * This feature is designed to service application-wide animation testing, live
 * debugging as well as custom animation choreographing tools.
 * @record
 */
export function PlayerHandler() { }
/**
 * Designed to kick off the player at the end of change detection
 * @type {?}
 */
PlayerHandler.prototype.flushPlayers;
/**
 * \@param player The player that has been scheduled to run within the application.
 * \@param context The context as to where the player was bound to
 * @type {?}
 */
PlayerHandler.prototype.queuePlayer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvYW5pbWF0aW9ucy9pbnRlcmZhY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBNEI2QixVQUFXLEVBQUUsVUFBVyxFQUFFLFNBQVUsRUFBRSxhQUFjLEVBQUUsY0FBZSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBBIHNoYXJlZCBpbnRlcmZhY2Ugd2hpY2ggY29udGFpbnMgYW4gYW5pbWF0aW9uIHBsYXllclxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXllciB7XG4gIHBhcmVudD86IFBsYXllcnxudWxsO1xuICBzdGF0ZTogUGxheVN0YXRlO1xuICBwbGF5KCk6IHZvaWQ7XG4gIHBhdXNlKCk6IHZvaWQ7XG4gIGZpbmlzaCgpOiB2b2lkO1xuICBkZXN0cm95KCk6IHZvaWQ7XG4gIGFkZEV2ZW50TGlzdGVuZXIoc3RhdGU6IFBsYXlTdGF0ZXxzdHJpbmcsIGNiOiAoZGF0YT86IGFueSkgPT4gYW55KTogdm9pZDtcbn1cblxuLyoqXG4gKiBUaGUgc3RhdGUgb2YgYSBnaXZlbiBwbGF5ZXJcbiAqXG4gKiBEbyBub3QgY2hhbmdlIHRoZSBpbmNyZWFzaW5nIG5hdHVyZSBvZiB0aGUgbnVtYmVycyBzaW5jZSB0aGUgcGxheWVyXG4gKiBjb2RlIG1heSBjb21wYXJlIHN0YXRlIGJ5IGNoZWNraW5nIGlmIGEgbnVtYmVyIGlzIGhpZ2hlciBvciBsb3dlciB0aGFuXG4gKiBhIGNlcnRhaW4gbnVtZXJpYyB2YWx1ZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gUGxheVN0YXRlIHtQZW5kaW5nID0gMCwgUnVubmluZyA9IDEsIFBhdXNlZCA9IDIsIEZpbmlzaGVkID0gMTAwLCBEZXN0cm95ZWQgPSAyMDB9XG5cbi8qKlxuICogVGhlIGNvbnRleHQgdGhhdCBzdG9yZXMgYWxsIGFjdGl2ZSBhbmltYXRpb24gcGxheWVycyBwcmVzZW50IG9uIGFuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBkZWNsYXJlIHR5cGUgQW5pbWF0aW9uQ29udGV4dCA9IFBsYXllcltdO1xuZXhwb3J0IGRlY2xhcmUgdHlwZSBDb21wb25lbnRJbnN0YW5jZSA9IHt9O1xuZXhwb3J0IGRlY2xhcmUgdHlwZSBEaXJlY3RpdmVJbnN0YW5jZSA9IHt9O1xuXG4vKipcbiAqIERlc2lnbmVkIHRvIGJlIHVzZWQgYXMgYW4gaW5qZWN0aW9uIHNlcnZpY2UgdG8gY2FwdHVyZSBhbGwgYW5pbWF0aW9uIHBsYXllcnMuXG4gKlxuICogV2hlbiBwcmVzZW50IGFsbCBhbmltYXRpb24gcGxheWVycyB3aWxsIGJlIHBhc3NlZCBpbnRvIHRoZSBmbHVzaCBtZXRob2QgYmVsb3cuXG4gKiBUaGlzIGZlYXR1cmUgaXMgZGVzaWduZWQgdG8gc2VydmljZSBhcHBsaWNhdGlvbi13aWRlIGFuaW1hdGlvbiB0ZXN0aW5nLCBsaXZlXG4gKiBkZWJ1Z2dpbmcgYXMgd2VsbCBhcyBjdXN0b20gYW5pbWF0aW9uIGNob3Jlb2dyYXBoaW5nIHRvb2xzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXllckhhbmRsZXIge1xuICAvKipcbiAgICogRGVzaWduZWQgdG8ga2ljayBvZmYgdGhlIHBsYXllciBhdCB0aGUgZW5kIG9mIGNoYW5nZSBkZXRlY3Rpb25cbiAgICovXG4gIGZsdXNoUGxheWVycygpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gcGxheWVyIFRoZSBwbGF5ZXIgdGhhdCBoYXMgYmVlbiBzY2hlZHVsZWQgdG8gcnVuIHdpdGhpbiB0aGUgYXBwbGljYXRpb24uXG4gICAqIEBwYXJhbSBjb250ZXh0IFRoZSBjb250ZXh0IGFzIHRvIHdoZXJlIHRoZSBwbGF5ZXIgd2FzIGJvdW5kIHRvXG4gICAqL1xuICBxdWV1ZVBsYXllcihwbGF5ZXI6IFBsYXllciwgY29udGV4dDogQ29tcG9uZW50SW5zdGFuY2V8RGlyZWN0aXZlSW5zdGFuY2V8SFRNTEVsZW1lbnQpOiB2b2lkO1xufVxuIl19