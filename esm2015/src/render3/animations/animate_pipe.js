/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
 * \@publicApi
 */
export class AnimatePipe {
    /**
     * @param {?} value
     * @param {?} timingExp
     * @return {?}
     */
    transform(value, timingExp) {
        /** @type {?} */
        const timing = parseTimingExp(timingExp);
        return bindPlayerFactory((element, type, values, isFirstRender, previousPlayer) => {
            /** @type {?} */
            const styles = type === 2 /* Style */ ? values : null;
            /** @type {?} */
            const classes = type === 1 /* Class */ ? values : null;
            if (!isFirstRender) {
                return invokeStylingAnimation(element, classes, styles, timing);
            }
            return null;
        }, value);
    }
}
AnimatePipe.decorators = [
    { type: Pipe, args: [{ name: 'animate', pure: true },] }
];
/** @type {?} */
const ANIMATOR_MAP = new WeakMap();
/**
 * @param {?} element
 * @param {?} classes
 * @param {?} styles
 * @param {?} timing
 * @return {?}
 */
export function invokeStylingAnimation(element, classes, styles, timing) {
    /** @type {?} */
    let animator = ANIMATOR_MAP.get(element);
    if (!animator || animator.state === 6 /* Destroyed */) {
        ANIMATOR_MAP.set(element, animator = new CssTransitionAnimator(element, getDefaultRenderUtil()));
    }
    return new StylingPlayer(element, animator, timing, classes, styles);
}
/**
 * \@publicApi
 */
export class AnimatePipeModule {
}
AnimatePipeModule.decorators = [
    { type: NgModule, args: [{ declarations: [AnimatePipe] },] }
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0ZV9waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hbmltYXRpb25zL2FuaW1hdGVfcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBT0EsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUVsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUU1RCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUzRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtDdEMsTUFBTSxPQUFPLFdBQVc7Ozs7OztJQUN0QixTQUFTLENBQUMsS0FBeUQsRUFBRSxTQUF3Qjs7UUFDM0YsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLE9BQU8saUJBQWlCLENBQ3BCLENBQUMsT0FBb0IsRUFBRSxJQUFpQixFQUFFLE1BQTRCLEVBQ3JFLGFBQXNCLEVBQUUsY0FBNkIsRUFBRSxFQUFFOztZQUN4RCxNQUFNLE1BQU0sR0FBRyxJQUFJLGtCQUFzQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzs7WUFDMUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQkFBc0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDM0QsSUFBSSxDQUFDLGFBQWEsRUFBRTtnQkFDbEIsT0FBTyxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQzthQUNqRTtZQUNELE9BQU8sSUFBSSxDQUFDO1NBQ2IsRUFDRCxLQUFLLENBQUMsQ0FBQztLQUNaOzs7WUFmRixJQUFJLFNBQUMsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7OztBQXFCbkMsTUFBTSxZQUFZLEdBQUcsSUFBSSxPQUFPLEVBQXlCLENBQUM7Ozs7Ozs7O0FBRTFELE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsT0FBb0IsRUFBRSxPQUE4QyxFQUNwRSxNQUFtQyxFQUFFLE1BQWM7O0lBQ3JELElBQUksUUFBUSxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDekMsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsS0FBSyxzQkFBNEIsRUFBRTtRQUMzRCxZQUFZLENBQUMsR0FBRyxDQUNaLE9BQU8sRUFBRSxRQUFRLEdBQUcsSUFBSSxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDckY7SUFDRCxPQUFPLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztDQUN0RTs7OztBQU1ELE1BQU0sT0FBTyxpQkFBaUI7OztZQUQ3QixRQUFRLFNBQUMsRUFBQyxZQUFZLEVBQUUsQ0FBQyxXQUFXLENBQUMsRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7UGlwZX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHtCaW5kaW5nVHlwZSwgUGxheWVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge2JpbmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcblxuaW1wb3J0IHtDc3NUcmFuc2l0aW9uQW5pbWF0b3J9IGZyb20gJy4vY3NzX3RyYW5zaXRpb25fYW5pbWF0b3InO1xuaW1wb3J0IHtnZXREZWZhdWx0UmVuZGVyVXRpbH0gZnJvbSAnLi9kZWZhdWx0X3JlbmRlcl91dGlsJztcbmltcG9ydCB7QW5pbWF0b3IsIEFuaW1hdG9yU3RhdGUsIFRpbWluZ30gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7U3R5bGluZ1BsYXllcn0gZnJvbSAnLi9zdHlsaW5nX3BsYXllcic7XG5pbXBvcnQge3BhcnNlVGltaW5nRXhwfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogVXNlZCB0byBjb25zdHJ1Y3QgYW4gYW5pbWF0aW9uIHBsYXllciBmb3IgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MuXG4gKlxuICogYEFuaW1hdGVQaXBlYCBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIGFsb25nc2lkZSBgW3N0eWxlXWAgYW5kXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MgYW5kIHdpbGwgcHJvZHVjZSBhbiBhbmltYXRpb24gcGxheWVyIHRoYXRcbiAqIHdpbGwgYW5pbWF0ZSB0aGUgY2hhbmdlIGluIHN0eWxpbmcgdXNpbmcgQ1NTIHRyYW5zaXRpb25zXG4gKiAoZm9yIGJvdGggc3R5bGVzIGFuZCBjbGFzc2VzKS5cbiAqXG4gKiBBbmltYXRlUGlwZSByZXR1cm5zIGFuIGluc3RhbmNlIG9mIGBCb3VuZFBsYXllckZhY3RvcnlgXG4gKiB3aGVuIGV4ZWN1dGVkLiBPbmNlIHN0eWxpbmcgaGFzIGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogdGhlbiB0aGUgYEJvdW5kUGxheWVyRmFjdG9yeWAgdmFsdWUgd2lsbCBiZSBjYWxsZWQgYW5kIGFuXG4gKiBhbmltYXRpb24gcGxheWVyIHdpbGwgYmUgcHJvZHVjZWQuIFRoaXMgcGxheWVyIHdpbGwgdGhlblxuICogaGFuZGxlIHRoZSBhcHBsaWNhdGlvbiBvZiB0aGUgc3R5bGluZyB0byB0aGUgZWxlbWVudCB3aXRoaW5cbiAqIGl0cyBhbmltYXRpb24gbWV0aG9kb2xvZ3kuXG4gKlxuICogSWYgYW55IHN0eWxpbmcgY2hhbmdlcyBvY2N1ciB3aGVuIHRoZSBhbiBleGlzdGluZyBhbmltYXRpb24gaXNcbiAqIG1pZHdheSB0aGVuIHRoZSBgQW5pbWF0ZVBpcGVgJ3MgcGxheWVyIGZhY3Rvcnkgd2lsbCBjYW5jZWxcbiAqIHRoZSBleGlzdGluZyBhbmltYXRpb24gYW5kIGFuaW1hdGUgdG93YXJkcyB0aGUgbmV3IHZhbHVlcy5cbiAqIFdoaWxlIGEgY2FuY2VsbGF0aW9uIGRvZXMgb2NjdXIsIHRoZSBmb2xsb3ctdXAgcGxheWVyIHdpbGxcbiAqIHJldGFpbiBhbGwgdGhlIGVhcmxpZXIgc3R5bGluZyBhbmQgd2lsbCB0YWtlIHRoYXQgaW50byBhY2NvdW50XG4gKiB3aGVuIGFuaW1hdGluZyB0aGUgbmV3IHZhbHVlcyB0aGF0IHdlcmUgcGFzc2VkIGluIHdpdGhvdXRcbiAqIGFueSBmbGlja2VycyBvciB0aW1pbmcgZ2Fwcy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlcmUgaXMgemVybyBsb2dpYyBpbiB0aGUgY29kZSBiZWxvdyB0aGF0IHdpbGwgZGVjaWRlXG4gKiBpZiBhbiBhbmltYXRpb24gaXMgcnVuIGJhc2VkIG9uIGFwcGxpY2F0aW9uIHN0cnVjdHVyZSBsb2dpYy4gKFRoaXNcbiAqIGxvZ2ljIHdpbGwgYmUgaGFuZGxlZCBvbiBhIGhpZ2hlciBsZXZlbCB2aWEgdGhlIGNvbXBvbmVudFxuICogYFBsYXllckhhbmRsZXJgIGludGVyZmFjZS4pXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5AUGlwZSh7bmFtZTogJ2FuaW1hdGUnLCBwdXJlOiB0cnVlfSlcbmV4cG9ydCBjbGFzcyBBbmltYXRlUGlwZSB7XG4gIHRyYW5zZm9ybSh2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbHx1bmRlZmluZWR8e1trZXk6IHN0cmluZ106IGFueX0sIHRpbWluZ0V4cDogc3RyaW5nfG51bWJlcikge1xuICAgIGNvbnN0IHRpbWluZyA9IHBhcnNlVGltaW5nRXhwKHRpbWluZ0V4cCk7XG4gICAgcmV0dXJuIGJpbmRQbGF5ZXJGYWN0b3J5KFxuICAgICAgICAoZWxlbWVudDogSFRNTEVsZW1lbnQsIHR5cGU6IEJpbmRpbmdUeXBlLCB2YWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9LFxuICAgICAgICAgaXNGaXJzdFJlbmRlcjogYm9vbGVhbiwgcHJldmlvdXNQbGF5ZXI6IFBsYXllciB8IG51bGwpID0+IHtcbiAgICAgICAgICBjb25zdCBzdHlsZXMgPSB0eXBlID09PSBCaW5kaW5nVHlwZS5TdHlsZSA/IHZhbHVlcyA6IG51bGw7XG4gICAgICAgICAgY29uc3QgY2xhc3NlcyA9IHR5cGUgPT09IEJpbmRpbmdUeXBlLkNsYXNzID8gdmFsdWVzIDogbnVsbDtcbiAgICAgICAgICBpZiAoIWlzRmlyc3RSZW5kZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnZva2VTdHlsaW5nQW5pbWF0aW9uKGVsZW1lbnQsIGNsYXNzZXMsIHN0eWxlcywgdGltaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIHZhbHVlKTtcbiAgfVxufVxuXG4vLyBhIFdlYWtNYXAgaXMgdXNlZCBiZWNhdXNlIGl0IGF2b2lkcyB0aGUgbmVlZCB0byByZWx5IG9uIGEgY2FsbGJhY2tcbi8vIGhhbmRsZXIgdG8gZGV0ZWN0IHdoZW4gZWFjaCBlbGVtZW50IGlzIHJlbW92ZWQgc2luY2UgYSB3ZWFrIG1hcCB3aWxsXG4vLyBhdXRvbWF0aWNhbGx5IHVwZGF0ZSBpdHMga2V5IHN0YXRlIHdoZW4gYW4gZWxlbWVudCBpcyBub3QgcmVmZXJlbmNlZC5cbmNvbnN0IEFOSU1BVE9SX01BUCA9IG5ldyBXZWFrTWFwPEhUTUxFbGVtZW50LCBBbmltYXRvcj4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGludm9rZVN0eWxpbmdBbmltYXRpb24oXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQsIGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBib29sZWFufSB8IG51bGwsXG4gICAgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsIHRpbWluZzogVGltaW5nKTogUGxheWVyIHtcbiAgbGV0IGFuaW1hdG9yID0gQU5JTUFUT1JfTUFQLmdldChlbGVtZW50KTtcbiAgaWYgKCFhbmltYXRvciB8fCBhbmltYXRvci5zdGF0ZSA9PT0gQW5pbWF0b3JTdGF0ZS5EZXN0cm95ZWQpIHtcbiAgICBBTklNQVRPUl9NQVAuc2V0KFxuICAgICAgICBlbGVtZW50LCBhbmltYXRvciA9IG5ldyBDc3NUcmFuc2l0aW9uQW5pbWF0b3IoZWxlbWVudCwgZ2V0RGVmYXVsdFJlbmRlclV0aWwoKSkpO1xuICB9XG4gIHJldHVybiBuZXcgU3R5bGluZ1BsYXllcihlbGVtZW50LCBhbmltYXRvciwgdGltaW5nLCBjbGFzc2VzLCBzdHlsZXMpO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQE5nTW9kdWxlKHtkZWNsYXJhdGlvbnM6IFtBbmltYXRlUGlwZV19KVxuZXhwb3J0IGNsYXNzIEFuaW1hdGVQaXBlTW9kdWxlIHtcbn0iXX0=