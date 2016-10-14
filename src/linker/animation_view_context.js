import { AnimationGroupPlayer } from '../animation/animation_group_player';
import { queueAnimation as queueAnimationGlobally } from '../animation/animation_queue';
import { ViewAnimationMap } from '../animation/view_animation_map';
export var AnimationViewContext = (function () {
    function AnimationViewContext() {
        this._players = new ViewAnimationMap();
        this._listeners = new Map();
    }
    AnimationViewContext.prototype.onAllActiveAnimationsDone = function (callback) {
        var activeAnimationPlayers = this._players.getAllPlayers();
        // we check for the length to avoid having GroupAnimationPlayer
        // issue an unnecessary microtask when zero players are passed in
        if (activeAnimationPlayers.length) {
            new AnimationGroupPlayer(activeAnimationPlayers).onDone(function () { return callback(); });
        }
        else {
            callback();
        }
    };
    AnimationViewContext.prototype.queueAnimation = function (element, animationName, player, event) {
        var _this = this;
        queueAnimationGlobally(player);
        this._players.set(element, animationName, player);
        player.onDone(function () {
            // TODO: add codegen to remove the need to store these values
            _this._triggerOutputHandler(element, animationName, 'done', event);
            _this._players.remove(element, animationName);
        });
        player.onStart(function () { return _this._triggerOutputHandler(element, animationName, 'start', event); });
    };
    AnimationViewContext.prototype.cancelActiveAnimation = function (element, animationName, removeAllAnimations) {
        if (removeAllAnimations === void 0) { removeAllAnimations = false; }
        if (removeAllAnimations) {
            this._players.findAllPlayersByElement(element).forEach(function (player) { return player.destroy(); });
        }
        else {
            var player = this._players.find(element, animationName);
            if (player) {
                player.destroy();
            }
        }
    };
    AnimationViewContext.prototype.registerOutputHandler = function (element, eventName, eventPhase, eventHandler) {
        var animations = this._listeners.get(element);
        if (!animations) {
            this._listeners.set(element, animations = []);
        }
        animations.push(new _AnimationOutputHandler(eventName, eventPhase, eventHandler));
    };
    AnimationViewContext.prototype._triggerOutputHandler = function (element, animationName, phase, event) {
        var listeners = this._listeners.get(element);
        if (listeners && listeners.length) {
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];
                // we check for both the name in addition to the phase in the event
                // that there may be more than one @trigger on the same element
                if (listener.eventName === animationName && listener.eventPhase === phase) {
                    listener.handler(event);
                    break;
                }
            }
        }
    };
    return AnimationViewContext;
}());
var _AnimationOutputHandler = (function () {
    function _AnimationOutputHandler(eventName, eventPhase, handler) {
        this.eventName = eventName;
        this.eventPhase = eventPhase;
        this.handler = handler;
    }
    return _AnimationOutputHandler;
}());
//# sourceMappingURL=animation_view_context.js.map