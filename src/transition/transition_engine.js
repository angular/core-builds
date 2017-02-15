var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NoOpAnimationPlayer } from '../animation/animation_player';
/**
 * \@experimental Transition support is experimental.
 * @abstract
 */
var TransitionEngine = (function () {
    function TransitionEngine() {
    }
    /**
     * @abstract
     * @param {?} container
     * @param {?} element
     * @return {?}
     */
    TransitionEngine.prototype.insertNode = function (container, element) { };
    /**
     * @abstract
     * @param {?} element
     * @return {?}
     */
    TransitionEngine.prototype.removeNode = function (element) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} instructions
     * @return {?}
     */
    TransitionEngine.prototype.process = function (element, instructions) { };
    /**
     * @abstract
     * @return {?}
     */
    TransitionEngine.prototype.triggerAnimations = function () { };
    return TransitionEngine;
}());
export { TransitionEngine };
/**
 * \@experimental Transition support is experimental.
 */
var NoOpTransitionEngine = (function (_super) {
    __extends(NoOpTransitionEngine, _super);
    function NoOpTransitionEngine() {
        return _super.call(this) || this;
    }
    /**
     * @param {?} container
     * @param {?} element
     * @return {?}
     */
    NoOpTransitionEngine.prototype.insertNode = function (container, element) { container.appendChild(element); };
    /**
     * @param {?} element
     * @return {?}
     */
    NoOpTransitionEngine.prototype.removeNode = function (element) { remove(element); };
    /**
     * @param {?} element
     * @param {?} instructions
     * @return {?}
     */
    NoOpTransitionEngine.prototype.process = function (element, instructions) {
        return new NoOpAnimationPlayer();
    };
    /**
     * @return {?}
     */
    NoOpTransitionEngine.prototype.triggerAnimations = function () { };
    return NoOpTransitionEngine;
}(TransitionEngine));
export { NoOpTransitionEngine };
/**
 * @param {?} element
 * @return {?}
 */
function remove(element) {
    element.parentNode.removeChild(element);
}
//# sourceMappingURL=transition_engine.js.map