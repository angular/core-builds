/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { DebugRendererFactory2 } from '../view/services';
import { getLElementNode } from './context_discovery';
import * as di from './di';
import { _getViewData } from './instructions';
import { CONTEXT, DIRECTIVES, TVIEW } from './interfaces/view';
/**
 * Adapts the DebugRendererFactory2 to create a DebugRenderer2 specific for IVY.
 *
 * The created DebugRenderer know how to create a Debug Context specific to IVY.
 */
export class Render3DebugRendererFactory2 extends DebugRendererFactory2 {
    createRenderer(element, renderData) {
        const renderer = super.createRenderer(element, renderData);
        renderer.debugContextFactory = () => new Render3DebugContext(_getViewData());
        return renderer;
    }
}
/**
 * Stores context information about view nodes.
 *
 * Used in tests to retrieve information those nodes.
 */
class Render3DebugContext {
    constructor(viewData) {
        this.viewData = viewData;
        // The LNode will be created next and appended to viewData
        this.nodeIndex = viewData ? viewData.length : null;
    }
    get view() { return this.viewData; }
    get injector() {
        if (this.nodeIndex !== null) {
            const lElementNode = this.view[this.nodeIndex];
            const nodeInjector = lElementNode.nodeInjector;
            if (nodeInjector) {
                return new di.NodeInjector(nodeInjector);
            }
        }
        return Injector.NULL;
    }
    get component() {
        // TODO(vicb): why/when
        if (this.nodeIndex === null) {
            return null;
        }
        const tView = this.view[TVIEW];
        const components = tView.components;
        return (components && components.indexOf(this.nodeIndex) == -1) ?
            null :
            this.view[this.nodeIndex].data[CONTEXT];
    }
    // TODO(vicb): add view providers when supported
    get providerTokens() {
        const matchedDirectives = [];
        // TODO(vicb): why/when
        if (this.nodeIndex === null) {
            return matchedDirectives;
        }
        const directives = this.view[DIRECTIVES];
        if (directives) {
            const currentNode = this.view[this.nodeIndex];
            for (let dirIndex = 0; dirIndex < directives.length; dirIndex++) {
                const directive = directives[dirIndex];
                if (getLElementNode(directive) === currentNode) {
                    matchedDirectives.push(directive.constructor);
                }
            }
        }
        return matchedDirectives;
    }
    get references() {
        // TODO(vicb): implement retrieving references
        throw new Error('Not implemented yet in ivy');
    }
    get context() {
        if (this.nodeIndex === null) {
            return null;
        }
        const lNode = this.view[this.nodeIndex];
        return lNode.view[CONTEXT];
    }
    get componentRenderElement() { throw new Error('Not implemented in ivy'); }
    get renderNode() { throw new Error('Not implemented in ivy'); }
    // TODO(vicb): check previous implementation
    logError(console, ...values) { console.error(...values); }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUd4QyxPQUFPLEVBQWlCLHFCQUFxQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFdkUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzNCLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU1QyxPQUFPLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBYSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUV4RTs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLDRCQUE2QixTQUFRLHFCQUFxQjtJQUNyRSxjQUFjLENBQUMsT0FBWSxFQUFFLFVBQThCO1FBQ3pELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBbUIsQ0FBQztRQUM3RSxRQUFRLENBQUMsbUJBQW1CLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQzdFLE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7Q0FDRjtBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLG1CQUFtQjtJQUd2QixZQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ3JDLDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3JELENBQUM7SUFFRCxJQUFJLElBQUksS0FBVSxPQUFP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QUFDO0NBQ2pGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldyc7XG5pbXBvcnQge0RlYnVnUmVuZGVyZXIyLCBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3ZpZXcvc2VydmljZXMnO1xuXG5pbXBvcnQge2dldExFbGVtZW50Tm9kZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQgKiBhcyBkaSBmcm9tICcuL2RpJztcbmltcG9ydCB7X2dldFZpZXdEYXRhfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0xFbGVtZW50Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBESVJFQ1RJVkVTLCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogQWRhcHRzIHRoZSBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgdG8gY3JlYXRlIGEgRGVidWdSZW5kZXJlcjIgc3BlY2lmaWMgZm9yIElWWS5cbiAqXG4gKiBUaGUgY3JlYXRlZCBEZWJ1Z1JlbmRlcmVyIGtub3cgaG93IHRvIGNyZWF0ZSBhIERlYnVnIENvbnRleHQgc3BlY2lmaWMgdG8gSVZZLlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiBleHRlbmRzIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQ6IGFueSwgcmVuZGVyRGF0YTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHN1cGVyLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpIGFzIERlYnVnUmVuZGVyZXIyO1xuICAgIHJlbmRlcmVyLmRlYnVnQ29udGV4dEZhY3RvcnkgPSAoKSA9PiBuZXcgUmVuZGVyM0RlYnVnQ29udGV4dChfZ2V0Vmlld0RhdGEoKSk7XG4gICAgcmV0dXJuIHJlbmRlcmVyO1xuICB9XG59XG5cbi8qKlxuICogU3RvcmVzIGNvbnRleHQgaW5mb3JtYXRpb24gYWJvdXQgdmlldyBub2Rlcy5cbiAqXG4gKiBVc2VkIGluIHRlc3RzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIHRob3NlIG5vZGVzLlxuICovXG5jbGFzcyBSZW5kZXIzRGVidWdDb250ZXh0IGltcGxlbWVudHMgRGVidWdDb250ZXh0IHtcbiAgcmVhZG9ubHkgbm9kZUluZGV4OiBudW1iZXJ8bnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgICAvLyBUaGUgTE5vZGUgd2lsbCBiZSBjcmVhdGVkIG5leHQgYW5kIGFwcGVuZGVkIHRvIHZpZXdEYXRhXG4gICAgdGhpcy5ub2RlSW5kZXggPSB2aWV3RGF0YSA/IHZpZXdEYXRhLmxlbmd0aCA6IG51bGw7XG4gIH1cblxuICBnZXQgdmlldygpOiBhbnkgeyByZXR1cm4gdGhpcy52aWV3RGF0YTsgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBsRWxlbWVudE5vZGU6IExFbGVtZW50Tm9kZSA9IHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF07XG4gICAgICBjb25zdCBub2RlSW5qZWN0b3IgPSBsRWxlbWVudE5vZGUubm9kZUluamVjdG9yO1xuXG4gICAgICBpZiAobm9kZUluamVjdG9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGkuTm9kZUluamVjdG9yKG5vZGVJbmplY3Rvcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBJbmplY3Rvci5OVUxMO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkge1xuICAgIC8vIFRPRE8odmljYik6IHdoeS93aGVuXG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCB0VmlldyA9IHRoaXMudmlld1tUVklFV107XG4gICAgY29uc3QgY29tcG9uZW50czogbnVtYmVyW118bnVsbCA9IHRWaWV3LmNvbXBvbmVudHM7XG5cbiAgICByZXR1cm4gKGNvbXBvbmVudHMgJiYgY29tcG9uZW50cy5pbmRleE9mKHRoaXMubm9kZUluZGV4KSA9PSAtMSkgP1xuICAgICAgICBudWxsIDpcbiAgICAgICAgdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XS5kYXRhW0NPTlRFWFRdO1xuICB9XG5cbiAgLy8gVE9ETyh2aWNiKTogYWRkIHZpZXcgcHJvdmlkZXJzIHdoZW4gc3VwcG9ydGVkXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgY29uc3QgbWF0Y2hlZERpcmVjdGl2ZXM6IGFueVtdID0gW107XG5cbiAgICAvLyBUT0RPKHZpY2IpOiB3aHkvd2hlblxuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG1hdGNoZWREaXJlY3RpdmVzO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZXMgPSB0aGlzLnZpZXdbRElSRUNUSVZFU107XG5cbiAgICBpZiAoZGlyZWN0aXZlcykge1xuICAgICAgY29uc3QgY3VycmVudE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgICAgZm9yIChsZXQgZGlySW5kZXggPSAwOyBkaXJJbmRleCA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBkaXJJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZXNbZGlySW5kZXhdO1xuICAgICAgICBpZiAoZ2V0TEVsZW1lbnROb2RlKGRpcmVjdGl2ZSkgPT09IGN1cnJlbnROb2RlKSB7XG4gICAgICAgICAgbWF0Y2hlZERpcmVjdGl2ZXMucHVzaChkaXJlY3RpdmUuY29uc3RydWN0b3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVkRGlyZWN0aXZlcztcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICAvLyBUT0RPKHZpY2IpOiBpbXBsZW1lbnQgcmV0cmlldmluZyByZWZlcmVuY2VzXG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgeWV0IGluIGl2eScpO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBsTm9kZSA9IHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF07XG4gICAgcmV0dXJuIGxOb2RlLnZpZXdbQ09OVEVYVF07XG4gIH1cblxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgLy8gVE9ETyh2aWNiKTogY2hlY2sgcHJldmlvdXMgaW1wbGVtZW50YXRpb25cbiAgbG9nRXJyb3IoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSk6IHZvaWQgeyBjb25zb2xlLmVycm9yKC4uLnZhbHVlcyk7IH1cbn1cbiJdfQ==