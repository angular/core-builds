/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isPresent } from '../facade/lang';
export class ViewAnimationMap {
    constructor() {
        this._map = new Map();
        this._allPlayers = [];
    }
    /**
     * @param {?} element
     * @param {?} animationName
     * @return {?}
     */
    find(element, animationName) {
        const /** @type {?} */ playersByAnimation = this._map.get(element);
        if (isPresent(playersByAnimation)) {
            return playersByAnimation[animationName];
        }
    }
    /**
     * @param {?} element
     * @return {?}
     */
    findAllPlayersByElement(element) {
        const /** @type {?} */ el = this._map.get(element);
        return el ? Object.keys(el).map(k => el[k]) : [];
    }
    /**
     * @param {?} element
     * @param {?} animationName
     * @param {?} player
     * @return {?}
     */
    set(element, animationName, player) {
        let /** @type {?} */ playersByAnimation = this._map.get(element);
        if (!isPresent(playersByAnimation)) {
            playersByAnimation = {};
        }
        const /** @type {?} */ existingEntry = playersByAnimation[animationName];
        if (isPresent(existingEntry)) {
            this.remove(element, animationName);
        }
        playersByAnimation[animationName] = player;
        this._allPlayers.push(player);
        this._map.set(element, playersByAnimation);
    }
    /**
     * @return {?}
     */
    getAllPlayers() { return this._allPlayers; }
    /**
     * @param {?} element
     * @param {?} animationName
     * @param {?=} targetPlayer
     * @return {?}
     */
    remove(element, animationName, targetPlayer = null) {
        const /** @type {?} */ playersByAnimation = this._map.get(element);
        if (playersByAnimation) {
            const /** @type {?} */ player = playersByAnimation[animationName];
            if (!targetPlayer || player === targetPlayer) {
                delete playersByAnimation[animationName];
                const /** @type {?} */ index = this._allPlayers.indexOf(player);
                this._allPlayers.splice(index, 1);
                if (Object.keys(playersByAnimation).length === 0) {
                    this._map.delete(element);
                }
            }
        }
    }
}
function ViewAnimationMap_tsickle_Closure_declarations() {
    /** @type {?} */
    ViewAnimationMap.prototype._map;
    /** @type {?} */
    ViewAnimationMap.prototype._allPlayers;
}
//# sourceMappingURL=view_animation_map.js.map