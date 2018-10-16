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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnRlcmZhY2VzL3BsYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQTRCNkIsVUFBVyxFQUFFLFVBQVcsRUFBRSxTQUFVLEVBQUUsYUFBYyxFQUFFLGNBQWUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQSBzaGFyZWQgaW50ZXJmYWNlIHdoaWNoIGNvbnRhaW5zIGFuIGFuaW1hdGlvbiBwbGF5ZXJcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQbGF5ZXIge1xuICBwYXJlbnQ/OiBQbGF5ZXJ8bnVsbDtcbiAgc3RhdGU6IFBsYXlTdGF0ZTtcbiAgcGxheSgpOiB2b2lkO1xuICBwYXVzZSgpOiB2b2lkO1xuICBmaW5pc2goKTogdm9pZDtcbiAgZGVzdHJveSgpOiB2b2lkO1xuICBhZGRFdmVudExpc3RlbmVyKHN0YXRlOiBQbGF5U3RhdGV8c3RyaW5nLCBjYjogKGRhdGE/OiBhbnkpID0+IGFueSk6IHZvaWQ7XG59XG5cbi8qKlxuICogVGhlIHN0YXRlIG9mIGEgZ2l2ZW4gcGxheWVyXG4gKlxuICogRG8gbm90IGNoYW5nZSB0aGUgaW5jcmVhc2luZyBuYXR1cmUgb2YgdGhlIG51bWJlcnMgc2luY2UgdGhlIHBsYXllclxuICogY29kZSBtYXkgY29tcGFyZSBzdGF0ZSBieSBjaGVja2luZyBpZiBhIG51bWJlciBpcyBoaWdoZXIgb3IgbG93ZXIgdGhhblxuICogYSBjZXJ0YWluIG51bWVyaWMgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFBsYXlTdGF0ZSB7UGVuZGluZyA9IDAsIFJ1bm5pbmcgPSAxLCBQYXVzZWQgPSAyLCBGaW5pc2hlZCA9IDEwMCwgRGVzdHJveWVkID0gMjAwfVxuXG4vKipcbiAqIFRoZSBjb250ZXh0IHRoYXQgc3RvcmVzIGFsbCBhY3RpdmUgYW5pbWF0aW9uIHBsYXllcnMgcHJlc2VudCBvbiBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgZGVjbGFyZSB0eXBlIFBsYXllckNvbnRleHQgPSBQbGF5ZXJbXTtcbmV4cG9ydCBkZWNsYXJlIHR5cGUgQ29tcG9uZW50SW5zdGFuY2UgPSB7fTtcbmV4cG9ydCBkZWNsYXJlIHR5cGUgRGlyZWN0aXZlSW5zdGFuY2UgPSB7fTtcblxuLyoqXG4gKiBEZXNpZ25lZCB0byBiZSB1c2VkIGFzIGFuIGluamVjdGlvbiBzZXJ2aWNlIHRvIGNhcHR1cmUgYWxsIGFuaW1hdGlvbiBwbGF5ZXJzLlxuICpcbiAqIFdoZW4gcHJlc2VudCBhbGwgYW5pbWF0aW9uIHBsYXllcnMgd2lsbCBiZSBwYXNzZWQgaW50byB0aGUgZmx1c2ggbWV0aG9kIGJlbG93LlxuICogVGhpcyBmZWF0dXJlIGlzIGRlc2lnbmVkIHRvIHNlcnZpY2UgYXBwbGljYXRpb24td2lkZSBhbmltYXRpb24gdGVzdGluZywgbGl2ZVxuICogZGVidWdnaW5nIGFzIHdlbGwgYXMgY3VzdG9tIGFuaW1hdGlvbiBjaG9yZW9ncmFwaGluZyB0b29scy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQbGF5ZXJIYW5kbGVyIHtcbiAgLyoqXG4gICAqIERlc2lnbmVkIHRvIGtpY2sgb2ZmIHRoZSBwbGF5ZXIgYXQgdGhlIGVuZCBvZiBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAqL1xuICBmbHVzaFBsYXllcnMoKTogdm9pZDtcblxuICAvKipcbiAgICogQHBhcmFtIHBsYXllciBUaGUgcGxheWVyIHRoYXQgaGFzIGJlZW4gc2NoZWR1bGVkIHRvIHJ1biB3aXRoaW4gdGhlIGFwcGxpY2F0aW9uLlxuICAgKiBAcGFyYW0gY29udGV4dCBUaGUgY29udGV4dCBhcyB0byB3aGVyZSB0aGUgcGxheWVyIHdhcyBib3VuZCB0b1xuICAgKi9cbiAgcXVldWVQbGF5ZXIocGxheWVyOiBQbGF5ZXIsIGNvbnRleHQ6IENvbXBvbmVudEluc3RhbmNlfERpcmVjdGl2ZUluc3RhbmNlfEhUTUxFbGVtZW50KTogdm9pZDtcbn1cbiJdfQ==