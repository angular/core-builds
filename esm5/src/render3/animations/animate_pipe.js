import * as tslib_1 from "tslib";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Pipe } from '../../metadata/directives';
import { NgModule } from '../../metadata/ng_module';
import { bindPlayerFactory } from '../styling/player_factory';
import { CssTransitionAnimator } from './css_transition_animator';
import { getDefaultRenderUtil } from './default_render_util';
import { StylingPlayer } from './styling_player';
import { parseTimingExp } from './util';
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
var AnimatePipe = /** @class */ (function () {
    function AnimatePipe() {
    }
    AnimatePipe.prototype.transform = function (value, timingExp) {
        var timing = parseTimingExp(timingExp);
        return bindPlayerFactory(function (element, type, values, isFirstRender, previousPlayer) {
            var styles = type === 2 /* Style */ ? values : null;
            var classes = type === 1 /* Class */ ? values : null;
            if (!isFirstRender) {
                return invokeStylingAnimation(element, classes, styles, timing);
            }
            return null;
        }, value);
    };
    AnimatePipe = tslib_1.__decorate([
        Pipe({ name: 'animate', pure: true })
    ], AnimatePipe);
    return AnimatePipe;
}());
export { AnimatePipe };
// a WeakMap is used because it avoids the need to rely on a callback
// handler to detect when each element is removed since a weak map will
// automatically update its key state when an element is not referenced.
var ANIMATOR_MAP = new WeakMap();
export function invokeStylingAnimation(element, classes, styles, timing) {
    var animator = ANIMATOR_MAP.get(element);
    if (!animator || animator.state === 6 /* Destroyed */) {
        ANIMATOR_MAP.set(element, animator = new CssTransitionAnimator(element, getDefaultRenderUtil()));
    }
    return new StylingPlayer(element, animator, timing, classes, styles);
}
/**
 * @publicApi
 */
var AnimatePipeModule = /** @class */ (function () {
    function AnimatePipeModule() {
    }
    AnimatePipeModule = tslib_1.__decorate([
        NgModule({ declarations: [AnimatePipe] })
    ], AnimatePipeModule);
    return AnimatePipeModule;
}());
export { AnimatePipeModule };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0ZV9waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hbmltYXRpb25zL2FuaW1hdGVfcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUVsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUU1RCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUzRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUd0Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7QUFFSDtJQUFBO0lBZUEsQ0FBQztJQWRDLCtCQUFTLEdBQVQsVUFBVSxLQUF5RCxFQUFFLFNBQXdCO1FBQzNGLElBQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxPQUFPLGlCQUFpQixDQUNwQixVQUFDLE9BQW9CLEVBQUUsSUFBaUIsRUFBRSxNQUE0QixFQUNyRSxhQUFzQixFQUFFLGNBQTZCO1lBQ3BELElBQU0sTUFBTSxHQUFHLElBQUksa0JBQXNCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFELElBQU0sT0FBTyxHQUFHLElBQUksa0JBQXNCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzNELElBQUksQ0FBQyxhQUFhLEVBQUU7Z0JBQ2xCLE9BQU8sc0JBQXNCLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDakU7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUMsRUFDRCxLQUFLLENBQUMsQ0FBQztJQUNiLENBQUM7SUFkVSxXQUFXO1FBRHZCLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUFDO09BQ3ZCLFdBQVcsQ0FldkI7SUFBRCxrQkFBQztDQUFBLEFBZkQsSUFlQztTQWZZLFdBQVc7QUFpQnhCLHFFQUFxRTtBQUNyRSx1RUFBdUU7QUFDdkUsd0VBQXdFO0FBQ3hFLElBQU0sWUFBWSxHQUFHLElBQUksT0FBTyxFQUF5QixDQUFDO0FBRTFELE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsT0FBb0IsRUFBRSxPQUE4QyxFQUNwRSxNQUFtQyxFQUFFLE1BQWM7SUFDckQsSUFBSSxRQUFRLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN6QyxJQUFJLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLLHNCQUE0QixFQUFFO1FBQzNELFlBQVksQ0FBQyxHQUFHLENBQ1osT0FBTyxFQUFFLFFBQVEsR0FBRyxJQUFJLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNyRjtJQUNELE9BQU8sSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7QUFFRDs7R0FFRztBQUVIO0lBQUE7SUFDQSxDQUFDO0lBRFksaUJBQWlCO1FBRDdCLFFBQVEsQ0FBQyxFQUFDLFlBQVksRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFDLENBQUM7T0FDM0IsaUJBQWlCLENBQzdCO0lBQUQsd0JBQUM7Q0FBQSxBQURELElBQ0M7U0FEWSxpQkFBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1BpcGV9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpcmVjdGl2ZXMnO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvbmdfbW9kdWxlJztcbmltcG9ydCB7QmluZGluZ1R5cGUsIFBsYXllcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtiaW5kUGxheWVyRmFjdG9yeX0gZnJvbSAnLi4vc3R5bGluZy9wbGF5ZXJfZmFjdG9yeSc7XG5cbmltcG9ydCB7Q3NzVHJhbnNpdGlvbkFuaW1hdG9yfSBmcm9tICcuL2Nzc190cmFuc2l0aW9uX2FuaW1hdG9yJztcbmltcG9ydCB7Z2V0RGVmYXVsdFJlbmRlclV0aWx9IGZyb20gJy4vZGVmYXVsdF9yZW5kZXJfdXRpbCc7XG5pbXBvcnQge0FuaW1hdG9yLCBBbmltYXRvclN0YXRlLCBUaW1pbmd9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge1N0eWxpbmdQbGF5ZXJ9IGZyb20gJy4vc3R5bGluZ19wbGF5ZXInO1xuaW1wb3J0IHtwYXJzZVRpbWluZ0V4cH0gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIFVzZWQgdG8gY29uc3RydWN0IGFuIGFuaW1hdGlvbiBwbGF5ZXIgZm9yIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzLlxuICpcbiAqIGBBbmltYXRlUGlwZWAgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCBhbG9uZ3NpZGUgYFtzdHlsZV1gIGFuZFxuICogYFtjbGFzc11gIGJpbmRpbmdzIGFuZCB3aWxsIHByb2R1Y2UgYW4gYW5pbWF0aW9uIHBsYXllciB0aGF0XG4gKiB3aWxsIGFuaW1hdGUgdGhlIGNoYW5nZSBpbiBzdHlsaW5nIHVzaW5nIENTUyB0cmFuc2l0aW9uc1xuICogKGZvciBib3RoIHN0eWxlcyBhbmQgY2xhc3NlcykuXG4gKlxuICogQW5pbWF0ZVBpcGUgcmV0dXJucyBhbiBpbnN0YW5jZSBvZiBgQm91bmRQbGF5ZXJGYWN0b3J5YFxuICogd2hlbiBleGVjdXRlZC4gT25jZSBzdHlsaW5nIGhhcyBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqIHRoZW4gdGhlIGBCb3VuZFBsYXllckZhY3RvcnlgIHZhbHVlIHdpbGwgYmUgY2FsbGVkIGFuZCBhblxuICogYW5pbWF0aW9uIHBsYXllciB3aWxsIGJlIHByb2R1Y2VkLiBUaGlzIHBsYXllciB3aWxsIHRoZW5cbiAqIGhhbmRsZSB0aGUgYXBwbGljYXRpb24gb2YgdGhlIHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQgd2l0aGluXG4gKiBpdHMgYW5pbWF0aW9uIG1ldGhvZG9sb2d5LlxuICpcbiAqIElmIGFueSBzdHlsaW5nIGNoYW5nZXMgb2NjdXIgd2hlbiB0aGUgYW4gZXhpc3RpbmcgYW5pbWF0aW9uIGlzXG4gKiBtaWR3YXkgdGhlbiB0aGUgYEFuaW1hdGVQaXBlYCdzIHBsYXllciBmYWN0b3J5IHdpbGwgY2FuY2VsXG4gKiB0aGUgZXhpc3RpbmcgYW5pbWF0aW9uIGFuZCBhbmltYXRlIHRvd2FyZHMgdGhlIG5ldyB2YWx1ZXMuXG4gKiBXaGlsZSBhIGNhbmNlbGxhdGlvbiBkb2VzIG9jY3VyLCB0aGUgZm9sbG93LXVwIHBsYXllciB3aWxsXG4gKiByZXRhaW4gYWxsIHRoZSBlYXJsaWVyIHN0eWxpbmcgYW5kIHdpbGwgdGFrZSB0aGF0IGludG8gYWNjb3VudFxuICogd2hlbiBhbmltYXRpbmcgdGhlIG5ldyB2YWx1ZXMgdGhhdCB3ZXJlIHBhc3NlZCBpbiB3aXRob3V0XG4gKiBhbnkgZmxpY2tlcnMgb3IgdGltaW5nIGdhcHMuXG4gKlxuICogTm90ZSB0aGF0IHRoZXJlIGlzIHplcm8gbG9naWMgaW4gdGhlIGNvZGUgYmVsb3cgdGhhdCB3aWxsIGRlY2lkZVxuICogaWYgYW4gYW5pbWF0aW9uIGlzIHJ1biBiYXNlZCBvbiBhcHBsaWNhdGlvbiBzdHJ1Y3R1cmUgbG9naWMuIChUaGlzXG4gKiBsb2dpYyB3aWxsIGJlIGhhbmRsZWQgb24gYSBoaWdoZXIgbGV2ZWwgdmlhIHRoZSBjb21wb25lbnRcbiAqIGBQbGF5ZXJIYW5kbGVyYCBpbnRlcmZhY2UuKVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQFBpcGUoe25hbWU6ICdhbmltYXRlJywgcHVyZTogdHJ1ZX0pXG5leHBvcnQgY2xhc3MgQW5pbWF0ZVBpcGUge1xuICB0cmFuc2Zvcm0odmFsdWU6IHN0cmluZ3xib29sZWFufG51bGx8dW5kZWZpbmVkfHtba2V5OiBzdHJpbmddOiBhbnl9LCB0aW1pbmdFeHA6IHN0cmluZ3xudW1iZXIpIHtcbiAgICBjb25zdCB0aW1pbmcgPSBwYXJzZVRpbWluZ0V4cCh0aW1pbmdFeHApO1xuICAgIHJldHVybiBiaW5kUGxheWVyRmFjdG9yeShcbiAgICAgICAgKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCB0eXBlOiBCaW5kaW5nVHlwZSwgdmFsdWVzOiB7W2tleTogc3RyaW5nXTogYW55fSxcbiAgICAgICAgIGlzRmlyc3RSZW5kZXI6IGJvb2xlYW4sIHByZXZpb3VzUGxheWVyOiBQbGF5ZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3R5bGVzID0gdHlwZSA9PT0gQmluZGluZ1R5cGUuU3R5bGUgPyB2YWx1ZXMgOiBudWxsO1xuICAgICAgICAgIGNvbnN0IGNsYXNzZXMgPSB0eXBlID09PSBCaW5kaW5nVHlwZS5DbGFzcyA/IHZhbHVlcyA6IG51bGw7XG4gICAgICAgICAgaWYgKCFpc0ZpcnN0UmVuZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gaW52b2tlU3R5bGluZ0FuaW1hdGlvbihlbGVtZW50LCBjbGFzc2VzLCBzdHlsZXMsIHRpbWluZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9LFxuICAgICAgICB2YWx1ZSk7XG4gIH1cbn1cblxuLy8gYSBXZWFrTWFwIGlzIHVzZWQgYmVjYXVzZSBpdCBhdm9pZHMgdGhlIG5lZWQgdG8gcmVseSBvbiBhIGNhbGxiYWNrXG4vLyBoYW5kbGVyIHRvIGRldGVjdCB3aGVuIGVhY2ggZWxlbWVudCBpcyByZW1vdmVkIHNpbmNlIGEgd2VhayBtYXAgd2lsbFxuLy8gYXV0b21hdGljYWxseSB1cGRhdGUgaXRzIGtleSBzdGF0ZSB3aGVuIGFuIGVsZW1lbnQgaXMgbm90IHJlZmVyZW5jZWQuXG5jb25zdCBBTklNQVRPUl9NQVAgPSBuZXcgV2Vha01hcDxIVE1MRWxlbWVudCwgQW5pbWF0b3I+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnZva2VTdHlsaW5nQW5pbWF0aW9uKFxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYm9vbGVhbn0gfCBudWxsLFxuICAgIHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsLCB0aW1pbmc6IFRpbWluZyk6IFBsYXllciB7XG4gIGxldCBhbmltYXRvciA9IEFOSU1BVE9SX01BUC5nZXQoZWxlbWVudCk7XG4gIGlmICghYW5pbWF0b3IgfHwgYW5pbWF0b3Iuc3RhdGUgPT09IEFuaW1hdG9yU3RhdGUuRGVzdHJveWVkKSB7XG4gICAgQU5JTUFUT1JfTUFQLnNldChcbiAgICAgICAgZWxlbWVudCwgYW5pbWF0b3IgPSBuZXcgQ3NzVHJhbnNpdGlvbkFuaW1hdG9yKGVsZW1lbnQsIGdldERlZmF1bHRSZW5kZXJVdGlsKCkpKTtcbiAgfVxuICByZXR1cm4gbmV3IFN0eWxpbmdQbGF5ZXIoZWxlbWVudCwgYW5pbWF0b3IsIHRpbWluZywgY2xhc3Nlcywgc3R5bGVzKTtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBOZ01vZHVsZSh7ZGVjbGFyYXRpb25zOiBbQW5pbWF0ZVBpcGVdfSlcbmV4cG9ydCBjbGFzcyBBbmltYXRlUGlwZU1vZHVsZSB7XG59Il19