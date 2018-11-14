import { Player } from '../interfaces/player';
import { Timing } from './interfaces';
/**
 * Used to construct an animation player for `[style]` and `[class]` bindings.
 *
 * `AnimatePipe` is designed to be used alongside `[style]` and
 * `[class]` bindings and will produce an animation player that
 * will animate the change in styling using CSS transitions
 * (for both styles and classes).
 *
 * AnimatePipe returns an instance of `BoundPlayerFactory`
 * when executed. Once styling has been applied to the element
 * then the `BoundPlayerFactory` value will be called and an
 * animation player will be produced. This player will then
 * handle the application of the styling to the element within
 * its animation methodology.
 *
 * If any styling changes occur when the an existing animation is
 * midway then the `AnimatePipe`'s player factory will cancel
 * the existing animation and animate towards the new values.
 * While a cancellation does occur, the follow-up player will
 * retain all the earlier styling and will take that into account
 * when animating the new values that were passed in without
 * any flickers or timing gaps.
 *
 * Note that there is zero logic in the code below that will decide
 * if an animation is run based on application structure logic. (This
 * logic will be handled on a higher level via the component
 * `PlayerHandler` interface.)
 *
 * @publicApi
 */
export declare class AnimatePipe {
    transform(value: string | boolean | null | undefined | {
        [key: string]: any;
    }, timingExp: string | number): import("@angular/core/src/render3/interfaces/player").PlayerFactory;
}
export declare function invokeStylingAnimation(element: HTMLElement, classes: {
    [className: string]: boolean;
} | null, styles: {
    [key: string]: any;
} | null, timing: Timing): Player;
/**
 * @publicApi
 */
export declare class AnimatePipeModule {
}
