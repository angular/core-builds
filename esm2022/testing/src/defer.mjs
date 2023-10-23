/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵCONTAINER_HEADER_OFFSET as CONTAINER_HEADER_OFFSET, ɵDeferBlockState as DeferBlockState, ɵgetDeferBlocks as getDeferBlocks, ɵrenderDeferBlockState as renderDeferBlockState, ɵtriggerResourceLoading as triggerResourceLoading } from '@angular/core';
/**
 * Represents an individual defer block for testing purposes.
 *
 * @publicApi
 * @developerPreview
 */
export class DeferBlockFixture {
    /** @nodoc */
    constructor(block, componentFixture) {
        this.block = block;
        this.componentFixture = componentFixture;
    }
    /**
     * Renders the specified state of the defer fixture.
     * @param state the defer state to render
     */
    async render(state) {
        if (!hasStateTemplate(state, this.block)) {
            const stateAsString = getDeferBlockStateNameFromEnum(state);
            throw new Error(`Tried to render this defer block in the \`${stateAsString}\` state, ` +
                `but there was no @${stateAsString.toLowerCase()} block defined in a template.`);
        }
        if (state === DeferBlockState.Complete) {
            await triggerResourceLoading(this.block.tDetails, this.block.lView, this.block.tNode);
        }
        renderDeferBlockState(state, this.block.tNode, this.block.lContainer);
        this.componentFixture.detectChanges();
        return this.componentFixture.whenStable();
    }
    /**
     * Retrieves all nested child defer block fixtures
     * in a given defer block.
     */
    getDeferBlocks() {
        const deferBlocks = [];
        // An LContainer that represents a defer block has at most 1 view, which is
        // located right after an LContainer header. Get a hold of that view and inspect
        // it for nested defer blocks.
        const deferBlockFixtures = [];
        if (this.block.lContainer.length >= CONTAINER_HEADER_OFFSET) {
            const lView = this.block.lContainer[CONTAINER_HEADER_OFFSET];
            getDeferBlocks(lView, deferBlocks);
            for (const block of deferBlocks) {
                deferBlockFixtures.push(new DeferBlockFixture(block, this.componentFixture));
            }
        }
        return Promise.resolve(deferBlockFixtures);
    }
}
function hasStateTemplate(state, block) {
    switch (state) {
        case DeferBlockState.Placeholder:
            return block.tDetails.placeholderTmplIndex !== null;
        case DeferBlockState.Loading:
            return block.tDetails.loadingTmplIndex !== null;
        case DeferBlockState.Error:
            return block.tDetails.errorTmplIndex !== null;
        case DeferBlockState.Complete:
            return true;
        default:
            return false;
    }
}
function getDeferBlockStateNameFromEnum(state) {
    switch (state) {
        case DeferBlockState.Placeholder:
            return 'Placeholder';
        case DeferBlockState.Loading:
            return 'Loading';
        case DeferBlockState.Error:
            return 'Error';
        default:
            return 'Main';
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2RlZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyx3QkFBd0IsSUFBSSx1QkFBdUIsRUFBMkMsZ0JBQWdCLElBQUksZUFBZSxFQUFFLGVBQWUsSUFBSSxjQUFjLEVBQUUsc0JBQXNCLElBQUkscUJBQXFCLEVBQUUsdUJBQXVCLElBQUksc0JBQXNCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFJdlM7Ozs7O0dBS0c7QUFDSCxNQUFNLE9BQU8saUJBQWlCO0lBQzVCLGFBQWE7SUFDYixZQUNZLEtBQXdCLEVBQVUsZ0JBQTJDO1FBQTdFLFVBQUssR0FBTCxLQUFLLENBQW1CO1FBQVUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUEyQjtJQUFHLENBQUM7SUFFN0Y7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFzQjtRQUNqQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN4QyxNQUFNLGFBQWEsR0FBRyw4QkFBOEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1RCxNQUFNLElBQUksS0FBSyxDQUNYLDZDQUE2QyxhQUFhLFlBQVk7Z0JBQ3RFLHFCQUFxQixhQUFhLENBQUMsV0FBVyxFQUFFLCtCQUErQixDQUFDLENBQUM7U0FDdEY7UUFDRCxJQUFJLEtBQUssS0FBSyxlQUFlLENBQUMsUUFBUSxFQUFFO1lBQ3RDLE1BQU0sc0JBQXNCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN2RjtRQUNELHFCQUFxQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUN0QyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsY0FBYztRQUNaLE1BQU0sV0FBVyxHQUF3QixFQUFFLENBQUM7UUFDNUMsMkVBQTJFO1FBQzNFLGdGQUFnRjtRQUNoRiw4QkFBOEI7UUFDOUIsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUM7UUFDOUIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksdUJBQXVCLEVBQUU7WUFDM0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUM3RCxjQUFjLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ25DLEtBQUssTUFBTSxLQUFLLElBQUksV0FBVyxFQUFFO2dCQUMvQixrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQzthQUM5RTtTQUNGO1FBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFzQixFQUFFLEtBQXdCO0lBQ3hFLFFBQVEsS0FBSyxFQUFFO1FBQ2IsS0FBSyxlQUFlLENBQUMsV0FBVztZQUM5QixPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEtBQUssSUFBSSxDQUFDO1FBQ3RELEtBQUssZUFBZSxDQUFDLE9BQU87WUFDMUIsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLGdCQUFnQixLQUFLLElBQUksQ0FBQztRQUNsRCxLQUFLLGVBQWUsQ0FBQyxLQUFLO1lBQ3hCLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEtBQUssSUFBSSxDQUFDO1FBQ2hELEtBQUssZUFBZSxDQUFDLFFBQVE7WUFDM0IsT0FBTyxJQUFJLENBQUM7UUFDZDtZQUNFLE9BQU8sS0FBSyxDQUFDO0tBQ2hCO0FBQ0gsQ0FBQztBQUVELFNBQVMsOEJBQThCLENBQUMsS0FBc0I7SUFDNUQsUUFBUSxLQUFLLEVBQUU7UUFDYixLQUFLLGVBQWUsQ0FBQyxXQUFXO1lBQzlCLE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLEtBQUssZUFBZSxDQUFDLE9BQU87WUFDMUIsT0FBTyxTQUFTLENBQUM7UUFDbkIsS0FBSyxlQUFlLENBQUMsS0FBSztZQUN4QixPQUFPLE9BQU8sQ0FBQztRQUNqQjtZQUNFLE9BQU8sTUFBTSxDQUFDO0tBQ2pCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge8m1Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQgYXMgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIMm1RGVmZXJCbG9ja0RldGFpbHMgYXMgRGVmZXJCbG9ja0RldGFpbHMsIMm1RGVmZXJCbG9ja1N0YXRlIGFzIERlZmVyQmxvY2tTdGF0ZSwgybVnZXREZWZlckJsb2NrcyBhcyBnZXREZWZlckJsb2NrcywgybVyZW5kZXJEZWZlckJsb2NrU3RhdGUgYXMgcmVuZGVyRGVmZXJCbG9ja1N0YXRlLCDJtXRyaWdnZXJSZXNvdXJjZUxvYWRpbmcgYXMgdHJpZ2dlclJlc291cmNlTG9hZGluZ30gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB0eXBlIHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluZGl2aWR1YWwgZGVmZXIgYmxvY2sgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGNsYXNzIERlZmVyQmxvY2tGaXh0dXJlIHtcbiAgLyoqIEBub2RvYyAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgYmxvY2s6IERlZmVyQmxvY2tEZXRhaWxzLCBwcml2YXRlIGNvbXBvbmVudEZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4pIHt9XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgdGhlIHNwZWNpZmllZCBzdGF0ZSBvZiB0aGUgZGVmZXIgZml4dHVyZS5cbiAgICogQHBhcmFtIHN0YXRlIHRoZSBkZWZlciBzdGF0ZSB0byByZW5kZXJcbiAgICovXG4gIGFzeW5jIHJlbmRlcihzdGF0ZTogRGVmZXJCbG9ja1N0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCFoYXNTdGF0ZVRlbXBsYXRlKHN0YXRlLCB0aGlzLmJsb2NrKSkge1xuICAgICAgY29uc3Qgc3RhdGVBc1N0cmluZyA9IGdldERlZmVyQmxvY2tTdGF0ZU5hbWVGcm9tRW51bShzdGF0ZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFRyaWVkIHRvIHJlbmRlciB0aGlzIGRlZmVyIGJsb2NrIGluIHRoZSBcXGAke3N0YXRlQXNTdHJpbmd9XFxgIHN0YXRlLCBgICtcbiAgICAgICAgICBgYnV0IHRoZXJlIHdhcyBubyBAJHtzdGF0ZUFzU3RyaW5nLnRvTG93ZXJDYXNlKCl9IGJsb2NrIGRlZmluZWQgaW4gYSB0ZW1wbGF0ZS5gKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUpIHtcbiAgICAgIGF3YWl0IHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodGhpcy5ibG9jay50RGV0YWlscywgdGhpcy5ibG9jay5sVmlldywgdGhpcy5ibG9jay50Tm9kZSk7XG4gICAgfVxuICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShzdGF0ZSwgdGhpcy5ibG9jay50Tm9kZSwgdGhpcy5ibG9jay5sQ29udGFpbmVyKTtcbiAgICB0aGlzLmNvbXBvbmVudEZpeHR1cmUuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHJldHVybiB0aGlzLmNvbXBvbmVudEZpeHR1cmUud2hlblN0YWJsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbGwgbmVzdGVkIGNoaWxkIGRlZmVyIGJsb2NrIGZpeHR1cmVzXG4gICAqIGluIGEgZ2l2ZW4gZGVmZXIgYmxvY2suXG4gICAqL1xuICBnZXREZWZlckJsb2NrcygpOiBQcm9taXNlPERlZmVyQmxvY2tGaXh0dXJlW10+IHtcbiAgICBjb25zdCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSA9IFtdO1xuICAgIC8vIEFuIExDb250YWluZXIgdGhhdCByZXByZXNlbnRzIGEgZGVmZXIgYmxvY2sgaGFzIGF0IG1vc3QgMSB2aWV3LCB3aGljaCBpc1xuICAgIC8vIGxvY2F0ZWQgcmlnaHQgYWZ0ZXIgYW4gTENvbnRhaW5lciBoZWFkZXIuIEdldCBhIGhvbGQgb2YgdGhhdCB2aWV3IGFuZCBpbnNwZWN0XG4gICAgLy8gaXQgZm9yIG5lc3RlZCBkZWZlciBibG9ja3MuXG4gICAgY29uc3QgZGVmZXJCbG9ja0ZpeHR1cmVzID0gW107XG4gICAgaWYgKHRoaXMuYmxvY2subENvbnRhaW5lci5sZW5ndGggPj0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpIHtcbiAgICAgIGNvbnN0IGxWaWV3ID0gdGhpcy5ibG9jay5sQ29udGFpbmVyW0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VUXTtcbiAgICAgIGdldERlZmVyQmxvY2tzKGxWaWV3LCBkZWZlckJsb2Nrcyk7XG4gICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGRlZmVyQmxvY2tzKSB7XG4gICAgICAgIGRlZmVyQmxvY2tGaXh0dXJlcy5wdXNoKG5ldyBEZWZlckJsb2NrRml4dHVyZShibG9jaywgdGhpcy5jb21wb25lbnRGaXh0dXJlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGVmZXJCbG9ja0ZpeHR1cmVzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBoYXNTdGF0ZVRlbXBsYXRlKHN0YXRlOiBEZWZlckJsb2NrU3RhdGUsIGJsb2NrOiBEZWZlckJsb2NrRGV0YWlscykge1xuICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXI6XG4gICAgICByZXR1cm4gYmxvY2sudERldGFpbHMucGxhY2Vob2xkZXJUbXBsSW5kZXggIT09IG51bGw7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuTG9hZGluZzpcbiAgICAgIHJldHVybiBibG9jay50RGV0YWlscy5sb2FkaW5nVG1wbEluZGV4ICE9PSBudWxsO1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkVycm9yOlxuICAgICAgcmV0dXJuIGJsb2NrLnREZXRhaWxzLmVycm9yVG1wbEluZGV4ICE9PSBudWxsO1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXREZWZlckJsb2NrU3RhdGVOYW1lRnJvbUVudW0oc3RhdGU6IERlZmVyQmxvY2tTdGF0ZSkge1xuICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXI6XG4gICAgICByZXR1cm4gJ1BsYWNlaG9sZGVyJztcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nOlxuICAgICAgcmV0dXJuICdMb2FkaW5nJztcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5FcnJvcjpcbiAgICAgIHJldHVybiAnRXJyb3InO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ01haW4nO1xuICB9XG59XG4iXX0=