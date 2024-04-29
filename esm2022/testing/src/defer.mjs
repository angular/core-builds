/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵCONTAINER_HEADER_OFFSET as CONTAINER_HEADER_OFFSET, ɵDeferBlockState as DeferBlockState, ɵgetDeferBlocks as getDeferBlocks, ɵrenderDeferBlockState as renderDeferBlockState, ɵtriggerResourceLoading as triggerResourceLoading, } from '@angular/core';
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
        // If the `render` method is used explicitly - skip timer-based scheduling for
        // `@placeholder` and `@loading` blocks and render them immediately.
        const skipTimerScheduling = true;
        renderDeferBlockState(state, this.block.tNode, this.block.lContainer, skipTimerScheduling);
        this.componentFixture.detectChanges();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2RlZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCx3QkFBd0IsSUFBSSx1QkFBdUIsRUFFbkQsZ0JBQWdCLElBQUksZUFBZSxFQUNuQyxlQUFlLElBQUksY0FBYyxFQUNqQyxzQkFBc0IsSUFBSSxxQkFBcUIsRUFDL0MsdUJBQXVCLElBQUksc0JBQXNCLEdBQ2xELE1BQU0sZUFBZSxDQUFDO0FBSXZCOzs7OztHQUtHO0FBQ0gsTUFBTSxPQUFPLGlCQUFpQjtJQUM1QixhQUFhO0lBQ2IsWUFDVSxLQUF3QixFQUN4QixnQkFBMkM7UUFEM0MsVUFBSyxHQUFMLEtBQUssQ0FBbUI7UUFDeEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUEyQjtJQUNsRCxDQUFDO0lBRUo7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFzQjtRQUNqQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sYUFBYSxHQUFHLDhCQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVELE1BQU0sSUFBSSxLQUFLLENBQ2IsNkNBQTZDLGFBQWEsWUFBWTtnQkFDcEUscUJBQXFCLGFBQWEsQ0FBQyxXQUFXLEVBQUUsK0JBQStCLENBQ2xGLENBQUM7UUFDSixDQUFDO1FBQ0QsSUFBSSxLQUFLLEtBQUssZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sc0JBQXNCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBQ0QsOEVBQThFO1FBQzlFLG9FQUFvRTtRQUNwRSxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQztRQUNqQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUMzRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILGNBQWM7UUFDWixNQUFNLFdBQVcsR0FBd0IsRUFBRSxDQUFDO1FBQzVDLDJFQUEyRTtRQUMzRSxnRkFBZ0Y7UUFDaEYsOEJBQThCO1FBQzlCLE1BQU0sa0JBQWtCLEdBQUcsRUFBRSxDQUFDO1FBQzlCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLHVCQUF1QixFQUFFLENBQUM7WUFDNUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUM3RCxjQUFjLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ25DLEtBQUssTUFBTSxLQUFLLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2hDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQy9FLENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDN0MsQ0FBQztDQUNGO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFzQixFQUFFLEtBQXdCO0lBQ3hFLFFBQVEsS0FBSyxFQUFFLENBQUM7UUFDZCxLQUFLLGVBQWUsQ0FBQyxXQUFXO1lBQzlCLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsS0FBSyxJQUFJLENBQUM7UUFDdEQsS0FBSyxlQUFlLENBQUMsT0FBTztZQUMxQixPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxDQUFDO1FBQ2xELEtBQUssZUFBZSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLGNBQWMsS0FBSyxJQUFJLENBQUM7UUFDaEQsS0FBSyxlQUFlLENBQUMsUUFBUTtZQUMzQixPQUFPLElBQUksQ0FBQztRQUNkO1lBQ0UsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLDhCQUE4QixDQUFDLEtBQXNCO0lBQzVELFFBQVEsS0FBSyxFQUFFLENBQUM7UUFDZCxLQUFLLGVBQWUsQ0FBQyxXQUFXO1lBQzlCLE9BQU8sYUFBYSxDQUFDO1FBQ3ZCLEtBQUssZUFBZSxDQUFDLE9BQU87WUFDMUIsT0FBTyxTQUFTLENBQUM7UUFDbkIsS0FBSyxlQUFlLENBQUMsS0FBSztZQUN4QixPQUFPLE9BQU8sQ0FBQztRQUNqQjtZQUNFLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIMm1Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQgYXMgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsXG4gIMm1RGVmZXJCbG9ja0RldGFpbHMgYXMgRGVmZXJCbG9ja0RldGFpbHMsXG4gIMm1RGVmZXJCbG9ja1N0YXRlIGFzIERlZmVyQmxvY2tTdGF0ZSxcbiAgybVnZXREZWZlckJsb2NrcyBhcyBnZXREZWZlckJsb2NrcyxcbiAgybVyZW5kZXJEZWZlckJsb2NrU3RhdGUgYXMgcmVuZGVyRGVmZXJCbG9ja1N0YXRlLFxuICDJtXRyaWdnZXJSZXNvdXJjZUxvYWRpbmcgYXMgdHJpZ2dlclJlc291cmNlTG9hZGluZyxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB0eXBlIHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluZGl2aWR1YWwgZGVmZXIgYmxvY2sgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGNsYXNzIERlZmVyQmxvY2tGaXh0dXJlIHtcbiAgLyoqIEBub2RvYyAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIGJsb2NrOiBEZWZlckJsb2NrRGV0YWlscyxcbiAgICBwcml2YXRlIGNvbXBvbmVudEZpeHR1cmU6IENvbXBvbmVudEZpeHR1cmU8dW5rbm93bj4sXG4gICkge31cblxuICAvKipcbiAgICogUmVuZGVycyB0aGUgc3BlY2lmaWVkIHN0YXRlIG9mIHRoZSBkZWZlciBmaXh0dXJlLlxuICAgKiBAcGFyYW0gc3RhdGUgdGhlIGRlZmVyIHN0YXRlIHRvIHJlbmRlclxuICAgKi9cbiAgYXN5bmMgcmVuZGVyKHN0YXRlOiBEZWZlckJsb2NrU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIWhhc1N0YXRlVGVtcGxhdGUoc3RhdGUsIHRoaXMuYmxvY2spKSB7XG4gICAgICBjb25zdCBzdGF0ZUFzU3RyaW5nID0gZ2V0RGVmZXJCbG9ja1N0YXRlTmFtZUZyb21FbnVtKHN0YXRlKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFRyaWVkIHRvIHJlbmRlciB0aGlzIGRlZmVyIGJsb2NrIGluIHRoZSBcXGAke3N0YXRlQXNTdHJpbmd9XFxgIHN0YXRlLCBgICtcbiAgICAgICAgICBgYnV0IHRoZXJlIHdhcyBubyBAJHtzdGF0ZUFzU3RyaW5nLnRvTG93ZXJDYXNlKCl9IGJsb2NrIGRlZmluZWQgaW4gYSB0ZW1wbGF0ZS5gLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUpIHtcbiAgICAgIGF3YWl0IHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodGhpcy5ibG9jay50RGV0YWlscywgdGhpcy5ibG9jay5sVmlldywgdGhpcy5ibG9jay50Tm9kZSk7XG4gICAgfVxuICAgIC8vIElmIHRoZSBgcmVuZGVyYCBtZXRob2QgaXMgdXNlZCBleHBsaWNpdGx5IC0gc2tpcCB0aW1lci1iYXNlZCBzY2hlZHVsaW5nIGZvclxuICAgIC8vIGBAcGxhY2Vob2xkZXJgIGFuZCBgQGxvYWRpbmdgIGJsb2NrcyBhbmQgcmVuZGVyIHRoZW0gaW1tZWRpYXRlbHkuXG4gICAgY29uc3Qgc2tpcFRpbWVyU2NoZWR1bGluZyA9IHRydWU7XG4gICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKHN0YXRlLCB0aGlzLmJsb2NrLnROb2RlLCB0aGlzLmJsb2NrLmxDb250YWluZXIsIHNraXBUaW1lclNjaGVkdWxpbmcpO1xuICAgIHRoaXMuY29tcG9uZW50Rml4dHVyZS5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBuZXN0ZWQgY2hpbGQgZGVmZXIgYmxvY2sgZml4dHVyZXNcbiAgICogaW4gYSBnaXZlbiBkZWZlciBibG9jay5cbiAgICovXG4gIGdldERlZmVyQmxvY2tzKCk6IFByb21pc2U8RGVmZXJCbG9ja0ZpeHR1cmVbXT4ge1xuICAgIGNvbnN0IGRlZmVyQmxvY2tzOiBEZWZlckJsb2NrRGV0YWlsc1tdID0gW107XG4gICAgLy8gQW4gTENvbnRhaW5lciB0aGF0IHJlcHJlc2VudHMgYSBkZWZlciBibG9jayBoYXMgYXQgbW9zdCAxIHZpZXcsIHdoaWNoIGlzXG4gICAgLy8gbG9jYXRlZCByaWdodCBhZnRlciBhbiBMQ29udGFpbmVyIGhlYWRlci4gR2V0IGEgaG9sZCBvZiB0aGF0IHZpZXcgYW5kIGluc3BlY3RcbiAgICAvLyBpdCBmb3IgbmVzdGVkIGRlZmVyIGJsb2Nrcy5cbiAgICBjb25zdCBkZWZlckJsb2NrRml4dHVyZXMgPSBbXTtcbiAgICBpZiAodGhpcy5ibG9jay5sQ29udGFpbmVyLmxlbmd0aCA+PSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkge1xuICAgICAgY29uc3QgbFZpZXcgPSB0aGlzLmJsb2NrLmxDb250YWluZXJbQ09OVEFJTkVSX0hFQURFUl9PRkZTRVRdO1xuICAgICAgZ2V0RGVmZXJCbG9ja3MobFZpZXcsIGRlZmVyQmxvY2tzKTtcbiAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgZGVmZXJCbG9ja3MpIHtcbiAgICAgICAgZGVmZXJCbG9ja0ZpeHR1cmVzLnB1c2gobmV3IERlZmVyQmxvY2tGaXh0dXJlKGJsb2NrLCB0aGlzLmNvbXBvbmVudEZpeHR1cmUpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShkZWZlckJsb2NrRml4dHVyZXMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhc1N0YXRlVGVtcGxhdGUoc3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgYmxvY2s6IERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIHN3aXRjaCAoc3RhdGUpIHtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcjpcbiAgICAgIHJldHVybiBibG9jay50RGV0YWlscy5wbGFjZWhvbGRlclRtcGxJbmRleCAhPT0gbnVsbDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nOlxuICAgICAgcmV0dXJuIGJsb2NrLnREZXRhaWxzLmxvYWRpbmdUbXBsSW5kZXggIT09IG51bGw7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuRXJyb3I6XG4gICAgICByZXR1cm4gYmxvY2sudERldGFpbHMuZXJyb3JUbXBsSW5kZXggIT09IG51bGw7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuQ29tcGxldGU6XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldERlZmVyQmxvY2tTdGF0ZU5hbWVGcm9tRW51bShzdGF0ZTogRGVmZXJCbG9ja1N0YXRlKSB7XG4gIHN3aXRjaCAoc3RhdGUpIHtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcjpcbiAgICAgIHJldHVybiAnUGxhY2Vob2xkZXInO1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmc6XG4gICAgICByZXR1cm4gJ0xvYWRpbmcnO1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkVycm9yOlxuICAgICAgcmV0dXJuICdFcnJvcic7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnTWFpbic7XG4gIH1cbn1cbiJdfQ==