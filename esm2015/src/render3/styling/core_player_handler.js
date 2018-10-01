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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZV9wbGF5ZXJfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9jb3JlX3BsYXllcl9oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxNQUFNLE9BQU8saUJBQWlCOzt3QkFDQyxFQUFFOzs7OztJQUUvQixZQUFZO1FBQ1YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztZQUM3QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUNsQixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDZjtTQUNGO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0tBQzFCOzs7OztJQUVELFdBQVcsQ0FBQyxNQUFjLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRTtDQUM1RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7UGxheWVyLCBQbGF5ZXJIYW5kbGVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5cbmV4cG9ydCBjbGFzcyBDb3JlUGxheWVySGFuZGxlciBpbXBsZW1lbnRzIFBsYXllckhhbmRsZXIge1xuICBwcml2YXRlIF9wbGF5ZXJzOiBQbGF5ZXJbXSA9IFtdO1xuXG4gIGZsdXNoUGxheWVycygpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX3BsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHBsYXllciA9IHRoaXMuX3BsYXllcnNbaV07XG4gICAgICBpZiAoIXBsYXllci5wYXJlbnQpIHtcbiAgICAgICAgcGxheWVyLnBsYXkoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fcGxheWVycy5sZW5ndGggPSAwO1xuICB9XG5cbiAgcXVldWVQbGF5ZXIocGxheWVyOiBQbGF5ZXIpIHsgdGhpcy5fcGxheWVycy5wdXNoKHBsYXllcik7IH1cbn1cbiJdfQ==