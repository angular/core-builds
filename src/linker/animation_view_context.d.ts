import { AnimationPlayer } from '../animation/animation_player';
import { AnimationTransitionEvent } from '../animation/animation_transition_event';
export declare class AnimationViewContext {
    private _players;
    private _listeners;
    onAllActiveAnimationsDone(callback: () => any): void;
    queueAnimation(element: any, animationName: string, player: AnimationPlayer, event: AnimationTransitionEvent): void;
    cancelActiveAnimation(element: any, animationName: string, removeAllAnimations?: boolean): void;
    registerOutputHandler(element: any, eventName: string, eventPhase: string, eventHandler: Function): void;
    private _triggerOutputHandler(element, animationName, phase, event);
}
