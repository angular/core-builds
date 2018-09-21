/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
export class CorePlayerHandler {
    constructor() {
        this._players = [];
    }
    /**
     * @return {?}
     */
    flushPlayers() {
        for (let i = 0; i < this._players.length; i++) {
            /** @type {?} */
            const player = this._players[i];
            if (!player.parent) {
                player.play();
            }
        }
        this._players.length = 0;
    }
    /**
     * @param {?} player
     * @return {?}
     */
    queuePlayer(player) { this._players.push(player); }
}
if (false) {
    /** @type {?} */
    CorePlayerHandler.prototype._players;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZV9wbGF5ZXJfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvYW5pbWF0aW9ucy9jb3JlX3BsYXllcl9oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxNQUFNLE9BQU8saUJBQWlCOzt3QkFDQyxFQUFFOzs7OztJQUUvQixZQUFZO1FBQ1YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztZQUM3QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUNsQixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDZjtTQUNGO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0tBQzFCOzs7OztJQUVELFdBQVcsQ0FBQyxNQUFjLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRTtDQUM1RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7UGxheWVyLCBQbGF5ZXJIYW5kbGVyfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuXG5leHBvcnQgY2xhc3MgQ29yZVBsYXllckhhbmRsZXIgaW1wbGVtZW50cyBQbGF5ZXJIYW5kbGVyIHtcbiAgcHJpdmF0ZSBfcGxheWVyczogUGxheWVyW10gPSBbXTtcblxuICBmbHVzaFBsYXllcnMoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLl9wbGF5ZXJzW2ldO1xuICAgICAgaWYgKCFwbGF5ZXIucGFyZW50KSB7XG4gICAgICAgIHBsYXllci5wbGF5KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3BsYXllcnMubGVuZ3RoID0gMDtcbiAgfVxuXG4gIHF1ZXVlUGxheWVyKHBsYXllcjogUGxheWVyKSB7IHRoaXMuX3BsYXllcnMucHVzaChwbGF5ZXIpOyB9XG59XG4iXX0=