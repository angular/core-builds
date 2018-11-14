/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * A base interface player for all animations.
 *
 * \@publicApi
 * @record
 */
export function Player() { }
/** @type {?|undefined} */
Player.prototype.parent;
/** @type {?} */
Player.prototype.state;
/** @type {?} */
Player.prototype.getStatus;
/** @type {?} */
Player.prototype.play;
/** @type {?} */
Player.prototype.pause;
/** @type {?} */
Player.prototype.finish;
/** @type {?} */
Player.prototype.destroy;
/** @enum {number} */
var BindingType = {
    Unset: 0,
    Class: 1,
    Style: 2,
};
export { BindingType };
/**
 * Defines the shape which produces the Player.
 *
 * Used to produce a player that will be placed on an element that contains
 * styling bindings that make use of the player. This function is designed
 * to be used with `PlayerFactory`.
 *
 * \@publicApi
 * @record
 */
export function PlayerFactoryBuildFn() { }
/**
 * Used as a reference to build a player from a styling template binding
 * (`[style]` and `[class]`).
 *
 * The `fn` function will be called once any styling-related changes are
 * evaluated on an element and is expected to return a player that will
 * be then run on the element.
 *
 * `[style]`, `[style.prop]`, `[class]` and `[class.name]` template bindings
 * all accept a `PlayerFactory` as input and this player factories.
 *
 * \@publicApi
 * @record
 */
export function PlayerFactory() { }
/** @type {?} */
PlayerFactory.prototype.__brand__;
/**
 * @record
 */
export function BindingStore() { }
/** @type {?} */
BindingStore.prototype.setValue;
/**
 * @record
 */
export function PlayerBuilder() { }
/** @type {?} */
PlayerBuilder.prototype.buildPlayer;
/** @enum {number} */
var PlayState = {
    Pending: 0, Running: 1, Paused: 2, Finished: 100, Destroyed: 200,
};
export { PlayState };
/**
 * The context that stores all the active players and queued player factories present on an element.
 *
 * \@publicApi
 * @record
 */
export function PlayerContext() { }
/**
 * Designed to be used as an injection service to capture all animation players.
 *
 * When present all animation players will be passed into the flush method below.
 * This feature is designed to service application-wide animation testing, live
 * debugging as well as custom animation choreographing tools.
 *
 * \@publicApi
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
/** @enum {number} */
var PlayerIndex = {
    // The position where the index that reveals where players start in the PlayerContext
    NonBuilderPlayersStart: 0,
    // The position where the player builder lives (which handles {key:value} map expression) for
    // classes
    ClassMapPlayerBuilderPosition: 1,
    // The position where the last player assigned to the class player builder is stored
    ClassMapPlayerPosition: 2,
    // The position where the player builder lives (which handles {key:value} map expression) for
    // styles
    StyleMapPlayerBuilderPosition: 3,
    // The position where the last player assigned to the style player builder is stored
    StyleMapPlayerPosition: 4,
    // The position where any player builders start in the PlayerContext
    PlayerBuildersStartPosition: 1,
    // The position where non map-based player builders start in the PlayerContext
    SinglePlayerBuildersStartPosition: 5,
    // For each player builder there is a player in the player context (therefore size = 2)
    PlayerAndPlayerBuildersTupleSize: 2,
    // The player exists next to the player builder in the list
    PlayerOffsetPosition: 1,
};
export { PlayerIndex };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnRlcmZhY2VzL3BsYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUE4QkUsUUFBUztJQUNULFFBQVM7SUFDVCxRQUFTOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUErQ2tCLFVBQVcsRUFBRSxVQUFXLEVBQUUsU0FBVSxFQUFFLGFBQWMsRUFBRSxjQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXVDaEcseUJBQTBCOzs7SUFHMUIsZ0NBQWlDOztJQUVqQyx5QkFBMEI7OztJQUcxQixnQ0FBaUM7O0lBRWpDLHlCQUEwQjs7SUFFMUIsOEJBQStCOztJQUUvQixvQ0FBcUM7O0lBRXJDLG1DQUFvQzs7SUFFcEMsdUJBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcblxuLyoqXG4gKiBBIGJhc2UgaW50ZXJmYWNlIHBsYXllciBmb3IgYWxsIGFuaW1hdGlvbnMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXllciB7XG4gIHBhcmVudD86IFBsYXllcnxudWxsO1xuICBzdGF0ZTogUGxheVN0YXRlO1xuICBnZXRTdGF0dXMoKTogT2JzZXJ2YWJsZTxQbGF5U3RhdGV8c3RyaW5nPjtcbiAgcGxheSgpOiB2b2lkO1xuICBwYXVzZSgpOiB2b2lkO1xuICBmaW5pc2gocmVwbGFjZW1lbnRQbGF5ZXI/OiBQbGF5ZXJ8bnVsbCk6IHZvaWQ7XG4gIGRlc3Ryb3kocmVwbGFjZW1lbnRQbGF5ZXI/OiBQbGF5ZXJ8bnVsbCk6IHZvaWQ7XG59XG5cbi8qKlxuICogVGhlIHR5cGUgb2YgYmluZGluZyBwYXNzZWQgaW50byB0aGUgcGxheWVyIGZhY3RvcnlcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEJpbmRpbmdUeXBlIHtcbiAgVW5zZXQgPSAwLFxuICBDbGFzcyA9IDEsXG4gIFN0eWxlID0gMixcbn1cblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBzaGFwZSB3aGljaCBwcm9kdWNlcyB0aGUgUGxheWVyLlxuICpcbiAqIFVzZWQgdG8gcHJvZHVjZSBhIHBsYXllciB0aGF0IHdpbGwgYmUgcGxhY2VkIG9uIGFuIGVsZW1lbnQgdGhhdCBjb250YWluc1xuICogc3R5bGluZyBiaW5kaW5ncyB0aGF0IG1ha2UgdXNlIG9mIHRoZSBwbGF5ZXIuIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWRcbiAqIHRvIGJlIHVzZWQgd2l0aCBgUGxheWVyRmFjdG9yeWAuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXllckZhY3RvcnlCdWlsZEZuIHtcbiAgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCB0eXBlOiBCaW5kaW5nVHlwZSwgdmFsdWVzOiB7W2tleTogc3RyaW5nXTogYW55fSwgaXNGaXJzdFJlbmRlcjogYm9vbGVhbixcbiAgIGN1cnJlbnRQbGF5ZXI6IFBsYXllcnxudWxsKTogUGxheWVyfHVuZGVmaW5lZHxudWxsO1xufVxuXG4vKipcbiAqIFVzZWQgYXMgYSByZWZlcmVuY2UgdG8gYnVpbGQgYSBwbGF5ZXIgZnJvbSBhIHN0eWxpbmcgdGVtcGxhdGUgYmluZGluZ1xuICogKGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gKS5cbiAqXG4gKiBUaGUgYGZuYCBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBvbmNlIGFueSBzdHlsaW5nLXJlbGF0ZWQgY2hhbmdlcyBhcmVcbiAqIGV2YWx1YXRlZCBvbiBhbiBlbGVtZW50IGFuZCBpcyBleHBlY3RlZCB0byByZXR1cm4gYSBwbGF5ZXIgdGhhdCB3aWxsXG4gKiBiZSB0aGVuIHJ1biBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gIHRlbXBsYXRlIGJpbmRpbmdzXG4gKiBhbGwgYWNjZXB0IGEgYFBsYXllckZhY3RvcnlgIGFzIGlucHV0IGFuZCB0aGlzIHBsYXllciBmYWN0b3JpZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXllckZhY3RvcnkgeyAnX19icmFuZF9fJzogJ0JyYW5kIGZvciBQbGF5ZXJGYWN0b3J5IHRoYXQgbm90aGluZyB3aWxsIG1hdGNoJzsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIEJpbmRpbmdTdG9yZSB7IHNldFZhbHVlKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQ7IH1cblxuZXhwb3J0IGludGVyZmFjZSBQbGF5ZXJCdWlsZGVyIGV4dGVuZHMgQmluZGluZ1N0b3JlIHtcbiAgYnVpbGRQbGF5ZXIoY3VycmVudFBsYXllcjogUGxheWVyfG51bGwsIGlzRmlyc3RSZW5kZXI6IGJvb2xlYW4pOiBQbGF5ZXJ8dW5kZWZpbmVkfG51bGw7XG59XG5cbi8qKlxuICogVGhlIHN0YXRlIG9mIGEgZ2l2ZW4gcGxheWVyXG4gKlxuICogRG8gbm90IGNoYW5nZSB0aGUgaW5jcmVhc2luZyBuYXR1cmUgb2YgdGhlIG51bWJlcnMgc2luY2UgdGhlIHBsYXllclxuICogY29kZSBtYXkgY29tcGFyZSBzdGF0ZSBieSBjaGVja2luZyBpZiBhIG51bWJlciBpcyBoaWdoZXIgb3IgbG93ZXIgdGhhblxuICogYSBjZXJ0YWluIG51bWVyaWMgdmFsdWUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZW51bSBQbGF5U3RhdGUge1BlbmRpbmcgPSAwLCBSdW5uaW5nID0gMSwgUGF1c2VkID0gMiwgRmluaXNoZWQgPSAxMDAsIERlc3Ryb3llZCA9IDIwMH1cblxuLyoqXG4gKiBUaGUgY29udGV4dCB0aGF0IHN0b3JlcyBhbGwgdGhlIGFjdGl2ZSBwbGF5ZXJzIGFuZCBxdWV1ZWQgcGxheWVyIGZhY3RvcmllcyBwcmVzZW50IG9uIGFuIGVsZW1lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXllckNvbnRleHQgZXh0ZW5kcyBBcnJheTxudWxsfG51bWJlcnxQbGF5ZXJ8UGxheWVyQnVpbGRlcj4ge1xuICBbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF06IG51bWJlcjtcbiAgW1BsYXllckluZGV4LkNsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uXTogUGxheWVyQnVpbGRlcnxudWxsO1xuICBbUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJQb3NpdGlvbl06IFBsYXllcnxudWxsO1xuICBbUGxheWVySW5kZXguU3R5bGVNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb25dOiBQbGF5ZXJCdWlsZGVyfG51bGw7XG4gIFtQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllclBvc2l0aW9uXTogUGxheWVyfG51bGw7XG59XG5cbi8qKlxuICogRGVzaWduZWQgdG8gYmUgdXNlZCBhcyBhbiBpbmplY3Rpb24gc2VydmljZSB0byBjYXB0dXJlIGFsbCBhbmltYXRpb24gcGxheWVycy5cbiAqXG4gKiBXaGVuIHByZXNlbnQgYWxsIGFuaW1hdGlvbiBwbGF5ZXJzIHdpbGwgYmUgcGFzc2VkIGludG8gdGhlIGZsdXNoIG1ldGhvZCBiZWxvdy5cbiAqIFRoaXMgZmVhdHVyZSBpcyBkZXNpZ25lZCB0byBzZXJ2aWNlIGFwcGxpY2F0aW9uLXdpZGUgYW5pbWF0aW9uIHRlc3RpbmcsIGxpdmVcbiAqIGRlYnVnZ2luZyBhcyB3ZWxsIGFzIGN1c3RvbSBhbmltYXRpb24gY2hvcmVvZ3JhcGhpbmcgdG9vbHMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXllckhhbmRsZXIge1xuICAvKipcbiAgICogRGVzaWduZWQgdG8ga2ljayBvZmYgdGhlIHBsYXllciBhdCB0aGUgZW5kIG9mIGNoYW5nZSBkZXRlY3Rpb25cbiAgICovXG4gIGZsdXNoUGxheWVycygpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gcGxheWVyIFRoZSBwbGF5ZXIgdGhhdCBoYXMgYmVlbiBzY2hlZHVsZWQgdG8gcnVuIHdpdGhpbiB0aGUgYXBwbGljYXRpb24uXG4gICAqIEBwYXJhbSBjb250ZXh0IFRoZSBjb250ZXh0IGFzIHRvIHdoZXJlIHRoZSBwbGF5ZXIgd2FzIGJvdW5kIHRvXG4gICAqL1xuICBxdWV1ZVBsYXllcihwbGF5ZXI6IFBsYXllciwgY29udGV4dDogQ29tcG9uZW50SW5zdGFuY2V8RGlyZWN0aXZlSW5zdGFuY2V8SFRNTEVsZW1lbnQpOiB2b2lkO1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBQbGF5ZXJJbmRleCB7XG4gIC8vIFRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgaW5kZXggdGhhdCByZXZlYWxzIHdoZXJlIHBsYXllcnMgc3RhcnQgaW4gdGhlIFBsYXllckNvbnRleHRcbiAgTm9uQnVpbGRlclBsYXllcnNTdGFydCA9IDAsXG4gIC8vIFRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgcGxheWVyIGJ1aWxkZXIgbGl2ZXMgKHdoaWNoIGhhbmRsZXMge2tleTp2YWx1ZX0gbWFwIGV4cHJlc3Npb24pIGZvclxuICAvLyBjbGFzc2VzXG4gIENsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uID0gMSxcbiAgLy8gVGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBsYXN0IHBsYXllciBhc3NpZ25lZCB0byB0aGUgY2xhc3MgcGxheWVyIGJ1aWxkZXIgaXMgc3RvcmVkXG4gIENsYXNzTWFwUGxheWVyUG9zaXRpb24gPSAyLFxuICAvLyBUaGUgcG9zaXRpb24gd2hlcmUgdGhlIHBsYXllciBidWlsZGVyIGxpdmVzICh3aGljaCBoYW5kbGVzIHtrZXk6dmFsdWV9IG1hcCBleHByZXNzaW9uKSBmb3JcbiAgLy8gc3R5bGVzXG4gIFN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uID0gMyxcbiAgLy8gVGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBsYXN0IHBsYXllciBhc3NpZ25lZCB0byB0aGUgc3R5bGUgcGxheWVyIGJ1aWxkZXIgaXMgc3RvcmVkXG4gIFN0eWxlTWFwUGxheWVyUG9zaXRpb24gPSA0LFxuICAvLyBUaGUgcG9zaXRpb24gd2hlcmUgYW55IHBsYXllciBidWlsZGVycyBzdGFydCBpbiB0aGUgUGxheWVyQ29udGV4dFxuICBQbGF5ZXJCdWlsZGVyc1N0YXJ0UG9zaXRpb24gPSAxLFxuICAvLyBUaGUgcG9zaXRpb24gd2hlcmUgbm9uIG1hcC1iYXNlZCBwbGF5ZXIgYnVpbGRlcnMgc3RhcnQgaW4gdGhlIFBsYXllckNvbnRleHRcbiAgU2luZ2xlUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uID0gNSxcbiAgLy8gRm9yIGVhY2ggcGxheWVyIGJ1aWxkZXIgdGhlcmUgaXMgYSBwbGF5ZXIgaW4gdGhlIHBsYXllciBjb250ZXh0ICh0aGVyZWZvcmUgc2l6ZSA9IDIpXG4gIFBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplID0gMixcbiAgLy8gVGhlIHBsYXllciBleGlzdHMgbmV4dCB0byB0aGUgcGxheWVyIGJ1aWxkZXIgaW4gdGhlIGxpc3RcbiAgUGxheWVyT2Zmc2V0UG9zaXRpb24gPSAxLFxufVxuXG4vKipcbiAqIEEgbmFtZWQgc3ltYm9sIHRoYXQgcmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGNvbXBvbmVudFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGRlY2xhcmUgdHlwZSBDb21wb25lbnRJbnN0YW5jZSA9IHt9O1xuXG4vKipcbiAqIEEgbmFtZWQgc3ltYm9sIHRoYXQgcmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRpcmVjdGl2ZVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGRlY2xhcmUgdHlwZSBEaXJlY3RpdmVJbnN0YW5jZSA9IHt9O1xuIl19