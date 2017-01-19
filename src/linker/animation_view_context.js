import { AnimationGroupPlayer } from '../animation/animation_group_player';
import { AnimationSequencePlayer } from '../animation/animation_sequence_player';
import { ViewAnimationMap } from '../animation/view_animation_map';
export class AnimationViewContext {
    /**
     * @param {?} _animationQueue
     */
    constructor(_animationQueue) {
        this._animationQueue = _animationQueue;
        this._players = new ViewAnimationMap();
    }
    /**
     * @param {?} callback
     * @return {?}
     */
    onAllActiveAnimationsDone(callback) {
        const /** @type {?} */ activeAnimationPlayers = this._players.getAllPlayers();
        // we check for the length to avoid having GroupAnimationPlayer
        // issue an unnecessary microtask when zero players are passed in
        if (activeAnimationPlayers.length) {
            new AnimationGroupPlayer(activeAnimationPlayers).onDone(() => callback());
        }
        else {
            callback();
        }
    }
    /**
     * @param {?} element
     * @param {?} animationName
     * @param {?} player
     * @return {?}
     */
    queueAnimation(element, animationName, player) {
        this._animationQueue.enqueue(player);
        this._players.set(element, animationName, player);
        player.onDone(() => this._players.remove(element, animationName, player));
    }
    /**
     * @param {?} element
     * @param {?=} animationName
     * @return {?}
     */
    getAnimationPlayers(element, animationName = null) {
        const /** @type {?} */ players = [];
        if (animationName) {
            const /** @type {?} */ currentPlayer = this._players.find(element, animationName);
            if (currentPlayer) {
                _recursePlayers(currentPlayer, players);
            }
        }
        else {
            this._players.findAllPlayersByElement(element).forEach(player => _recursePlayers(player, players));
        }
        return players;
    }
}
function AnimationViewContext_tsickle_Closure_declarations() {
    /** @type {?} */
    AnimationViewContext.prototype._players;
    /** @type {?} */
    AnimationViewContext.prototype._animationQueue;
}
/**
 * @param {?} player
 * @param {?} collectedPlayers
 * @return {?}
 */
function _recursePlayers(player, collectedPlayers) {
    if ((player instanceof AnimationGroupPlayer) || (player instanceof AnimationSequencePlayer)) {
        player.players.forEach(player => _recursePlayers(player, collectedPlayers));
    }
    else {
        collectedPlayers.push(player);
    }
}
//# sourceMappingURL=animation_view_context.js.map