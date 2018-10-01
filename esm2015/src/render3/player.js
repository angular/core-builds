/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { getContext } from './context_discovery';
import { scheduleTick } from './instructions';
import { CorePlayerHandler } from './styling/core_player_handler';
import { getOrCreatePlayerContext } from './styling/util';
import { getRootContext } from './util';
/**
 * @param {?} ref
 * @param {?} player
 * @return {?}
 */
export function addPlayer(ref, player) {
    /** @type {?} */
    const elementContext = /** @type {?} */ ((getContext(ref)));
    /** @type {?} */
    const animationContext = /** @type {?} */ ((getOrCreatePlayerContext(elementContext.native, elementContext)));
    animationContext.push(player);
    player.addEventListener(200 /* Destroyed */, () => {
        /** @type {?} */
        const index = animationContext.indexOf(player);
        if (index >= 0) {
            animationContext.splice(index, 1);
        }
        player.destroy();
    });
    /** @type {?} */
    const rootContext = getRootContext(elementContext.lViewData);
    /** @type {?} */
    const playerHandler = rootContext.playerHandler || (rootContext.playerHandler = new CorePlayerHandler());
    playerHandler.queuePlayer(player, ref);
    /** @type {?} */
    const nothingScheduled = rootContext.flags === 0 /* Empty */;
    // change detection may or may not happen therefore
    // the core code needs to be kicked off to flush the animations
    rootContext.flags |= 2 /* FlushPlayers */;
    if (nothingScheduled) {
        scheduleTick(rootContext);
    }
}
/**
 * @param {?} ref
 * @return {?}
 */
export function getPlayers(ref) {
    return getOrCreatePlayerContext(ref);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9wbGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQU9BLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMvQyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHNUMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDaEUsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7O0FBRXRDLE1BQU0sVUFBVSxTQUFTLENBQ3JCLEdBQXdELEVBQUUsTUFBYzs7SUFDMUUsTUFBTSxjQUFjLHNCQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRzs7SUFDekMsTUFBTSxnQkFBZ0Isc0JBQUcsd0JBQXdCLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsR0FBRztJQUMzRixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFOUIsTUFBTSxDQUFDLGdCQUFnQixzQkFBc0IsR0FBRyxFQUFFOztRQUNoRCxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0MsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO1lBQ2QsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNuQztRQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNsQixDQUFDLENBQUM7O0lBRUgsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7SUFDN0QsTUFBTSxhQUFhLEdBQ2YsV0FBVyxDQUFDLGFBQWEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7SUFDdkYsYUFBYSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7O0lBRXZDLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEtBQUssa0JBQTJCLENBQUM7OztJQUl0RSxXQUFXLENBQUMsS0FBSyx3QkFBaUMsQ0FBQztJQUNuRCxJQUFJLGdCQUFnQixFQUFFO1FBQ3BCLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUMzQjtDQUNGOzs7OztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUMsR0FBd0Q7SUFDakYsT0FBTyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUN0QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Z2V0Q29udGV4dH0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3NjaGVkdWxlVGlja30gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtDb21wb25lbnRJbnN0YW5jZSwgRGlyZWN0aXZlSW5zdGFuY2UsIFBsYXlTdGF0ZSwgUGxheWVyfSBmcm9tICcuL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7Um9vdENvbnRleHRGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtDb3JlUGxheWVySGFuZGxlcn0gZnJvbSAnLi9zdHlsaW5nL2NvcmVfcGxheWVyX2hhbmRsZXInO1xuaW1wb3J0IHtnZXRPckNyZWF0ZVBsYXllckNvbnRleHR9IGZyb20gJy4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7Z2V0Um9vdENvbnRleHR9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRQbGF5ZXIoXG4gICAgcmVmOiBDb21wb25lbnRJbnN0YW5jZSB8IERpcmVjdGl2ZUluc3RhbmNlIHwgSFRNTEVsZW1lbnQsIHBsYXllcjogUGxheWVyKTogdm9pZCB7XG4gIGNvbnN0IGVsZW1lbnRDb250ZXh0ID0gZ2V0Q29udGV4dChyZWYpICE7XG4gIGNvbnN0IGFuaW1hdGlvbkNvbnRleHQgPSBnZXRPckNyZWF0ZVBsYXllckNvbnRleHQoZWxlbWVudENvbnRleHQubmF0aXZlLCBlbGVtZW50Q29udGV4dCkgITtcbiAgYW5pbWF0aW9uQ29udGV4dC5wdXNoKHBsYXllcik7XG5cbiAgcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoUGxheVN0YXRlLkRlc3Ryb3llZCwgKCkgPT4ge1xuICAgIGNvbnN0IGluZGV4ID0gYW5pbWF0aW9uQ29udGV4dC5pbmRleE9mKHBsYXllcik7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIGFuaW1hdGlvbkNvbnRleHQuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcGxheWVyLmRlc3Ryb3koKTtcbiAgfSk7XG5cbiAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Q29udGV4dChlbGVtZW50Q29udGV4dC5sVmlld0RhdGEpO1xuICBjb25zdCBwbGF5ZXJIYW5kbGVyID1cbiAgICAgIHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgfHwgKHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgPSBuZXcgQ29yZVBsYXllckhhbmRsZXIoKSk7XG4gIHBsYXllckhhbmRsZXIucXVldWVQbGF5ZXIocGxheWVyLCByZWYpO1xuXG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcblxuICAvLyBjaGFuZ2UgZGV0ZWN0aW9uIG1heSBvciBtYXkgbm90IGhhcHBlbiB0aGVyZWZvcmVcbiAgLy8gdGhlIGNvcmUgY29kZSBuZWVkcyB0byBiZSBraWNrZWQgb2ZmIHRvIGZsdXNoIHRoZSBhbmltYXRpb25zXG4gIHJvb3RDb250ZXh0LmZsYWdzIHw9IFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzO1xuICBpZiAobm90aGluZ1NjaGVkdWxlZCkge1xuICAgIHNjaGVkdWxlVGljayhyb290Q29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXllcnMocmVmOiBDb21wb25lbnRJbnN0YW5jZSB8IERpcmVjdGl2ZUluc3RhbmNlIHwgSFRNTEVsZW1lbnQpOiBQbGF5ZXJbXSB7XG4gIHJldHVybiBnZXRPckNyZWF0ZVBsYXllckNvbnRleHQocmVmKTtcbn1cbiJdfQ==