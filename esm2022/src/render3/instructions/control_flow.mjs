/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { setActiveConsumer } from '@angular/core/primitives/signals';
import { findMatchingDehydratedView } from '../../hydration/views';
import { assertDefined, assertFunction } from '../../util/assert';
import { performanceMarkFeature } from '../../util/performance';
import { assertLContainer, assertLView, assertTNode } from '../assert';
import { bindingUpdated } from '../bindings';
import { CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { CONTEXT, DECLARATION_COMPONENT_VIEW, HEADER_OFFSET, HYDRATION, TVIEW } from '../interfaces/view';
import { LiveCollection, reconcile } from '../list_reconciliation';
import { destroyLView, detachView } from '../node_manipulation';
import { getLView, getSelectedIndex, getTView, nextBindingIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { getConstant, getTNode } from '../util/view_utils';
import { addLViewToLContainer, createAndRenderEmbeddedLView, getLViewFromLContainer, removeLViewFromLContainer, shouldAddViewToDom } from '../view_manipulation';
import { declareTemplate } from './template';
/**
 * The conditional instruction represents the basic building block on the runtime side to support
 * built-in "if" and "switch". On the high level this instruction is responsible for adding and
 * removing views selected by a conditional expression.
 *
 * @param matchingTemplateIndex index of a template TNode representing a conditional view to be
 *     inserted; -1 represents a special case when there is no view to insert.
 * @codeGenApi
 */
export function ɵɵconditional(containerIndex, matchingTemplateIndex, value) {
    // TODO: we could remove the containerIndex argument to this instruction now (!)
    performanceMarkFeature('NgControlFlow');
    const hostLView = getLView();
    const bindingIndex = nextBindingIndex();
    const prevMatchingTemplateIndex = hostLView[bindingIndex] !== NO_CHANGE ? hostLView[bindingIndex] : -1;
    const prevContainer = prevMatchingTemplateIndex !== -1 ?
        getLContainer(hostLView, HEADER_OFFSET + prevMatchingTemplateIndex) :
        undefined;
    const viewInContainerIdx = 0;
    if (bindingUpdated(hostLView, bindingIndex, matchingTemplateIndex)) {
        const prevConsumer = setActiveConsumer(null);
        try {
            // The index of the view to show changed - remove the previously displayed one
            // (it is a noop if there are no active views in a container).
            if (prevContainer !== undefined) {
                removeLViewFromLContainer(prevContainer, viewInContainerIdx);
            }
            // Index -1 is a special case where none of the conditions evaluates to
            // a truthy value and as the consequence we've got no view to show.
            if (matchingTemplateIndex !== -1) {
                const nextLContainerIndex = HEADER_OFFSET + matchingTemplateIndex;
                const nextContainer = getLContainer(hostLView, nextLContainerIndex);
                const templateTNode = getExistingTNode(hostLView[TVIEW], nextLContainerIndex);
                const dehydratedView = findMatchingDehydratedView(nextContainer, templateTNode.tView.ssrId);
                const embeddedLView = createAndRenderEmbeddedLView(hostLView, templateTNode, value, { dehydratedView });
                addLViewToLContainer(nextContainer, embeddedLView, viewInContainerIdx, shouldAddViewToDom(templateTNode, dehydratedView));
            }
        }
        finally {
            setActiveConsumer(prevConsumer);
        }
    }
    else if (prevContainer !== undefined) {
        // We might keep displaying the same template but the actual value of the expression could have
        // changed - re-bind in context.
        const lView = getLViewFromLContainer(prevContainer, viewInContainerIdx);
        if (lView !== undefined) {
            lView[CONTEXT] = value;
        }
    }
}
export class RepeaterContext {
    constructor(lContainer, $implicit, $index) {
        this.lContainer = lContainer;
        this.$implicit = $implicit;
        this.$index = $index;
    }
    get $count() {
        return this.lContainer.length - CONTAINER_HEADER_OFFSET;
    }
}
/**
 * A built-in trackBy function used for situations where users specified collection index as a
 * tracking expression. Having this function body in the runtime avoids unnecessary code generation.
 *
 * @param index
 * @returns
 */
export function ɵɵrepeaterTrackByIndex(index) {
    return index;
}
/**
 * A built-in trackBy function used for situations where users specified collection item reference
 * as a tracking expression. Having this function body in the runtime avoids unnecessary code
 * generation.
 *
 * @param index
 * @returns
 */
export function ɵɵrepeaterTrackByIdentity(_, value) {
    return value;
}
class RepeaterMetadata {
    constructor(hasEmptyBlock, trackByFn, liveCollection) {
        this.hasEmptyBlock = hasEmptyBlock;
        this.trackByFn = trackByFn;
        this.liveCollection = liveCollection;
    }
}
/**
 * The repeaterCreate instruction runs in the creation part of the template pass and initializes
 * internal data structures required by the update pass of the built-in repeater logic. Repeater
 * metadata are allocated in the data part of LView with the following layout:
 * - LView[HEADER_OFFSET + index] - metadata
 * - LView[HEADER_OFFSET + index + 1] - reference to a template function rendering an item
 * - LView[HEADER_OFFSET + index + 2] - optional reference to a template function rendering an empty
 * block
 *
 * @param index Index at which to store the metadata of the repeater.
 * @param templateFn Reference to the template of the main repeater block.
 * @param decls The number of nodes, local refs, and pipes for the main block.
 * @param vars The number of bindings for the main block.
 * @param tagName The name of the container element, if applicable
 * @param attrsIndex Index of template attributes in the `consts` array.
 * @param trackByFn Reference to the tracking function.
 * @param trackByUsesComponentInstance Whether the tracking function has any references to the
 *  component instance. If it doesn't, we can avoid rebinding it.
 * @param emptyTemplateFn Reference to the template function of the empty block.
 * @param emptyDecls The number of nodes, local refs, and pipes for the empty block.
 * @param emptyVars The number of bindings for the empty block.
 * @param emptyTagName The name of the empty block container element, if applicable
 * @param emptyAttrsIndex Index of the empty block template attributes in the `consts` array.
 *
 * @codeGenApi
 */
export function ɵɵrepeaterCreate(index, templateFn, decls, vars, tagName, attrsIndex, trackByFn, trackByUsesComponentInstance, emptyTemplateFn, emptyDecls, emptyVars, emptyTagName, emptyAttrsIndex) {
    performanceMarkFeature('NgControlFlow');
    ngDevMode &&
        assertFunction(trackByFn, `A track expression must be a function, was ${typeof trackByFn} instead.`);
    const lView = getLView();
    const tView = getTView();
    const hasEmptyBlock = emptyTemplateFn !== undefined;
    const hostLView = getLView();
    const boundTrackBy = trackByUsesComponentInstance ?
        // We only want to bind when necessary, because it produces a
        // new function. For pure functions it's not necessary.
        trackByFn.bind(hostLView[DECLARATION_COMPONENT_VIEW][CONTEXT]) :
        trackByFn;
    const metadata = new RepeaterMetadata(hasEmptyBlock, boundTrackBy);
    hostLView[HEADER_OFFSET + index] = metadata;
    declareTemplate(lView, tView, index + 1, templateFn, decls, vars, tagName, getConstant(tView.consts, attrsIndex));
    if (hasEmptyBlock) {
        ngDevMode &&
            assertDefined(emptyDecls, 'Missing number of declarations for the empty repeater block.');
        ngDevMode &&
            assertDefined(emptyVars, 'Missing number of bindings for the empty repeater block.');
        declareTemplate(lView, tView, index + 2, emptyTemplateFn, emptyDecls, emptyVars, emptyTagName, getConstant(tView.consts, emptyAttrsIndex));
    }
}
class LiveCollectionLContainerImpl extends LiveCollection {
    constructor(lContainer, hostLView, templateTNode) {
        super();
        this.lContainer = lContainer;
        this.hostLView = hostLView;
        this.templateTNode = templateTNode;
        /**
         Property indicating if indexes in the repeater context need to be updated following the live
         collection changes. Index updates are necessary if and only if views are inserted / removed in
         the middle of LContainer. Adds and removals at the end don't require index updates.
       */
        this.needsIndexUpdate = false;
    }
    get length() {
        return this.lContainer.length - CONTAINER_HEADER_OFFSET;
    }
    at(index) {
        return this.getLView(index)[CONTEXT].$implicit;
    }
    attach(index, lView) {
        const dehydratedView = lView[HYDRATION];
        this.needsIndexUpdate ||= index !== this.length;
        addLViewToLContainer(this.lContainer, lView, index, shouldAddViewToDom(this.templateTNode, dehydratedView));
    }
    detach(index) {
        this.needsIndexUpdate ||= index !== this.length - 1;
        return detachExistingView(this.lContainer, index);
    }
    create(index, value) {
        const dehydratedView = findMatchingDehydratedView(this.lContainer, this.templateTNode.tView.ssrId);
        const embeddedLView = createAndRenderEmbeddedLView(this.hostLView, this.templateTNode, new RepeaterContext(this.lContainer, value, index), { dehydratedView });
        return embeddedLView;
    }
    destroy(lView) {
        destroyLView(lView[TVIEW], lView);
    }
    updateValue(index, value) {
        this.getLView(index)[CONTEXT].$implicit = value;
    }
    reset() {
        this.needsIndexUpdate = false;
    }
    updateIndexes() {
        if (this.needsIndexUpdate) {
            for (let i = 0; i < this.length; i++) {
                this.getLView(i)[CONTEXT].$index = i;
            }
        }
    }
    getLView(index) {
        return getExistingLViewFromLContainer(this.lContainer, index);
    }
}
/**
 * The repeater instruction does update-time diffing of a provided collection (against the
 * collection seen previously) and maps changes in the collection to views structure (by adding,
 * removing or moving views as needed).
 * @param collection - the collection instance to be checked for changes
 * @codeGenApi
 */
export function ɵɵrepeater(collection) {
    const prevConsumer = setActiveConsumer(null);
    const metadataSlotIdx = getSelectedIndex();
    try {
        const hostLView = getLView();
        const hostTView = hostLView[TVIEW];
        const metadata = hostLView[metadataSlotIdx];
        if (metadata.liveCollection === undefined) {
            const containerIndex = metadataSlotIdx + 1;
            const lContainer = getLContainer(hostLView, containerIndex);
            const itemTemplateTNode = getExistingTNode(hostTView, containerIndex);
            metadata.liveCollection =
                new LiveCollectionLContainerImpl(lContainer, hostLView, itemTemplateTNode);
        }
        else {
            metadata.liveCollection.reset();
        }
        const liveCollection = metadata.liveCollection;
        reconcile(liveCollection, collection, metadata.trackByFn);
        // moves in the container might caused context's index to get out of order, re-adjust if needed
        liveCollection.updateIndexes();
        // handle empty blocks
        if (metadata.hasEmptyBlock) {
            const bindingIndex = nextBindingIndex();
            const isCollectionEmpty = liveCollection.length === 0;
            if (bindingUpdated(hostLView, bindingIndex, isCollectionEmpty)) {
                const emptyTemplateIndex = metadataSlotIdx + 2;
                const lContainerForEmpty = getLContainer(hostLView, emptyTemplateIndex);
                if (isCollectionEmpty) {
                    const emptyTemplateTNode = getExistingTNode(hostTView, emptyTemplateIndex);
                    const dehydratedView = findMatchingDehydratedView(lContainerForEmpty, emptyTemplateTNode.tView.ssrId);
                    const embeddedLView = createAndRenderEmbeddedLView(hostLView, emptyTemplateTNode, undefined, { dehydratedView });
                    addLViewToLContainer(lContainerForEmpty, embeddedLView, 0, shouldAddViewToDom(emptyTemplateTNode, dehydratedView));
                }
                else {
                    removeLViewFromLContainer(lContainerForEmpty, 0);
                }
            }
        }
    }
    finally {
        setActiveConsumer(prevConsumer);
    }
}
function getLContainer(lView, index) {
    const lContainer = lView[index];
    ngDevMode && assertLContainer(lContainer);
    return lContainer;
}
function detachExistingView(lContainer, index) {
    const existingLView = detachView(lContainer, index);
    ngDevMode && assertLView(existingLView);
    return existingLView;
}
function getExistingLViewFromLContainer(lContainer, index) {
    const existingLView = getLViewFromLContainer(lContainer, index);
    ngDevMode && assertLView(existingLView);
    return existingLView;
}
function getExistingTNode(tView, index) {
    const tNode = getTNode(tView, index);
    ngDevMode && assertTNode(tNode);
    return tNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbF9mbG93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udHJvbF9mbG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBSW5FLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDckUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUMzQyxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUc1RSxPQUFPLEVBQUMsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQVMsS0FBSyxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDdEgsT0FBTyxFQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzlELE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsb0JB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T0FBTyxhQUFjLENBQUM7QUFDeEIsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsS0FBWSxFQUFFLEtBQWE7SUFDbkQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyQyxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWhDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3NldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7VHJhY2tCeUZ1bmN0aW9ufSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7RGVoeWRyYXRlZENvbnRhaW5lclZpZXd9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7ZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi92aWV3cyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEZ1bmN0aW9ufSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlldywgYXNzZXJ0VE5vZGV9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudFRlbXBsYXRlfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIEhFQURFUl9PRkZTRVQsIEhZRFJBVElPTiwgTFZpZXcsIFRWSUVXLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7TGl2ZUNvbGxlY3Rpb24sIHJlY29uY2lsZX0gZnJvbSAnLi4vbGlzdF9yZWNvbmNpbGlhdGlvbic7XG5pbXBvcnQge2Rlc3Ryb3lMVmlldywgZGV0YWNoVmlld30gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgZ2V0VFZpZXcsIG5leHRCaW5kaW5nSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtnZXRDb25zdGFudCwgZ2V0VE5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2FkZExWaWV3VG9MQ29udGFpbmVyLCBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3LCBnZXRMVmlld0Zyb21MQ29udGFpbmVyLCByZW1vdmVMVmlld0Zyb21MQ29udGFpbmVyLCBzaG91bGRBZGRWaWV3VG9Eb219IGZyb20gJy4uL3ZpZXdfbWFuaXB1bGF0aW9uJztcblxuaW1wb3J0IHtkZWNsYXJlVGVtcGxhdGV9IGZyb20gJy4vdGVtcGxhdGUnO1xuXG4vKipcbiAqIFRoZSBjb25kaXRpb25hbCBpbnN0cnVjdGlvbiByZXByZXNlbnRzIHRoZSBiYXNpYyBidWlsZGluZyBibG9jayBvbiB0aGUgcnVudGltZSBzaWRlIHRvIHN1cHBvcnRcbiAqIGJ1aWx0LWluIFwiaWZcIiBhbmQgXCJzd2l0Y2hcIi4gT24gdGhlIGhpZ2ggbGV2ZWwgdGhpcyBpbnN0cnVjdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgYWRkaW5nIGFuZFxuICogcmVtb3Zpbmcgdmlld3Mgc2VsZWN0ZWQgYnkgYSBjb25kaXRpb25hbCBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBtYXRjaGluZ1RlbXBsYXRlSW5kZXggaW5kZXggb2YgYSB0ZW1wbGF0ZSBUTm9kZSByZXByZXNlbnRpbmcgYSBjb25kaXRpb25hbCB2aWV3IHRvIGJlXG4gKiAgICAgaW5zZXJ0ZWQ7IC0xIHJlcHJlc2VudHMgYSBzcGVjaWFsIGNhc2Ugd2hlbiB0aGVyZSBpcyBubyB2aWV3IHRvIGluc2VydC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29uZGl0aW9uYWw8VD4oY29udGFpbmVySW5kZXg6IG51bWJlciwgbWF0Y2hpbmdUZW1wbGF0ZUluZGV4OiBudW1iZXIsIHZhbHVlPzogVCkge1xuICAvLyBUT0RPOiB3ZSBjb3VsZCByZW1vdmUgdGhlIGNvbnRhaW5lckluZGV4IGFyZ3VtZW50IHRvIHRoaXMgaW5zdHJ1Y3Rpb24gbm93ICghKVxuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0NvbnRyb2xGbG93Jyk7XG5cbiAgY29uc3QgaG9zdExWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBjb25zdCBwcmV2TWF0Y2hpbmdUZW1wbGF0ZUluZGV4OiBudW1iZXIgPVxuICAgICAgaG9zdExWaWV3W2JpbmRpbmdJbmRleF0gIT09IE5PX0NIQU5HRSA/IGhvc3RMVmlld1tiaW5kaW5nSW5kZXhdIDogLTE7XG4gIGNvbnN0IHByZXZDb250YWluZXIgPSBwcmV2TWF0Y2hpbmdUZW1wbGF0ZUluZGV4ICE9PSAtMSA/XG4gICAgICBnZXRMQ29udGFpbmVyKGhvc3RMVmlldywgSEVBREVSX09GRlNFVCArIHByZXZNYXRjaGluZ1RlbXBsYXRlSW5kZXgpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgY29uc3Qgdmlld0luQ29udGFpbmVySWR4ID0gMDtcblxuICBpZiAoYmluZGluZ1VwZGF0ZWQoaG9zdExWaWV3LCBiaW5kaW5nSW5kZXgsIG1hdGNoaW5nVGVtcGxhdGVJbmRleCkpIHtcbiAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgLy8gVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHNob3cgY2hhbmdlZCAtIHJlbW92ZSB0aGUgcHJldmlvdXNseSBkaXNwbGF5ZWQgb25lXG4gICAgICAvLyAoaXQgaXMgYSBub29wIGlmIHRoZXJlIGFyZSBubyBhY3RpdmUgdmlld3MgaW4gYSBjb250YWluZXIpLlxuICAgICAgaWYgKHByZXZDb250YWluZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZW1vdmVMVmlld0Zyb21MQ29udGFpbmVyKHByZXZDb250YWluZXIsIHZpZXdJbkNvbnRhaW5lcklkeCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluZGV4IC0xIGlzIGEgc3BlY2lhbCBjYXNlIHdoZXJlIG5vbmUgb2YgdGhlIGNvbmRpdGlvbnMgZXZhbHVhdGVzIHRvXG4gICAgICAvLyBhIHRydXRoeSB2YWx1ZSBhbmQgYXMgdGhlIGNvbnNlcXVlbmNlIHdlJ3ZlIGdvdCBubyB2aWV3IHRvIHNob3cuXG4gICAgICBpZiAobWF0Y2hpbmdUZW1wbGF0ZUluZGV4ICE9PSAtMSkge1xuICAgICAgICBjb25zdCBuZXh0TENvbnRhaW5lckluZGV4ID0gSEVBREVSX09GRlNFVCArIG1hdGNoaW5nVGVtcGxhdGVJbmRleDtcbiAgICAgICAgY29uc3QgbmV4dENvbnRhaW5lciA9IGdldExDb250YWluZXIoaG9zdExWaWV3LCBuZXh0TENvbnRhaW5lckluZGV4KTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVUTm9kZSA9IGdldEV4aXN0aW5nVE5vZGUoaG9zdExWaWV3W1RWSUVXXSwgbmV4dExDb250YWluZXJJbmRleCk7XG5cbiAgICAgICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPVxuICAgICAgICAgICAgZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcobmV4dENvbnRhaW5lciwgdGVtcGxhdGVUTm9kZS50VmlldyEuc3NySWQpO1xuICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID1cbiAgICAgICAgICAgIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoaG9zdExWaWV3LCB0ZW1wbGF0ZVROb2RlLCB2YWx1ZSwge2RlaHlkcmF0ZWRWaWV3fSk7XG5cbiAgICAgICAgYWRkTFZpZXdUb0xDb250YWluZXIoXG4gICAgICAgICAgICBuZXh0Q29udGFpbmVyLCBlbWJlZGRlZExWaWV3LCB2aWV3SW5Db250YWluZXJJZHgsXG4gICAgICAgICAgICBzaG91bGRBZGRWaWV3VG9Eb20odGVtcGxhdGVUTm9kZSwgZGVoeWRyYXRlZFZpZXcpKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAocHJldkNvbnRhaW5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gV2UgbWlnaHQga2VlcCBkaXNwbGF5aW5nIHRoZSBzYW1lIHRlbXBsYXRlIGJ1dCB0aGUgYWN0dWFsIHZhbHVlIG9mIHRoZSBleHByZXNzaW9uIGNvdWxkIGhhdmVcbiAgICAvLyBjaGFuZ2VkIC0gcmUtYmluZCBpbiBjb250ZXh0LlxuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXdGcm9tTENvbnRhaW5lcjxUfHVuZGVmaW5lZD4ocHJldkNvbnRhaW5lciwgdmlld0luQ29udGFpbmVySWR4KTtcbiAgICBpZiAobFZpZXcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbFZpZXdbQ09OVEVYVF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlcGVhdGVyQ29udGV4dDxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcHVibGljICRpbXBsaWNpdDogVCwgcHVibGljICRpbmRleDogbnVtYmVyKSB7fVxuXG4gIGdldCAkY291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5sQ29udGFpbmVyLmxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUO1xuICB9XG59XG5cbi8qKlxuICogQSBidWlsdC1pbiB0cmFja0J5IGZ1bmN0aW9uIHVzZWQgZm9yIHNpdHVhdGlvbnMgd2hlcmUgdXNlcnMgc3BlY2lmaWVkIGNvbGxlY3Rpb24gaW5kZXggYXMgYVxuICogdHJhY2tpbmcgZXhwcmVzc2lvbi4gSGF2aW5nIHRoaXMgZnVuY3Rpb24gYm9keSBpbiB0aGUgcnVudGltZSBhdm9pZHMgdW5uZWNlc3NhcnkgY29kZSBnZW5lcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBpbmRleFxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXBlYXRlclRyYWNrQnlJbmRleChpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXG4gKiBBIGJ1aWx0LWluIHRyYWNrQnkgZnVuY3Rpb24gdXNlZCBmb3Igc2l0dWF0aW9ucyB3aGVyZSB1c2VycyBzcGVjaWZpZWQgY29sbGVjdGlvbiBpdGVtIHJlZmVyZW5jZVxuICogYXMgYSB0cmFja2luZyBleHByZXNzaW9uLiBIYXZpbmcgdGhpcyBmdW5jdGlvbiBib2R5IGluIHRoZSBydW50aW1lIGF2b2lkcyB1bm5lY2Vzc2FyeSBjb2RlXG4gKiBnZW5lcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBpbmRleFxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXBlYXRlclRyYWNrQnlJZGVudGl0eTxUPihfOiBudW1iZXIsIHZhbHVlOiBUKSB7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuY2xhc3MgUmVwZWF0ZXJNZXRhZGF0YSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGhhc0VtcHR5QmxvY2s6IGJvb2xlYW4sIHB1YmxpYyB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjx1bmtub3duPixcbiAgICAgIHB1YmxpYyBsaXZlQ29sbGVjdGlvbj86IExpdmVDb2xsZWN0aW9uTENvbnRhaW5lckltcGwpIHt9XG59XG5cbi8qKlxuICogVGhlIHJlcGVhdGVyQ3JlYXRlIGluc3RydWN0aW9uIHJ1bnMgaW4gdGhlIGNyZWF0aW9uIHBhcnQgb2YgdGhlIHRlbXBsYXRlIHBhc3MgYW5kIGluaXRpYWxpemVzXG4gKiBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgcmVxdWlyZWQgYnkgdGhlIHVwZGF0ZSBwYXNzIG9mIHRoZSBidWlsdC1pbiByZXBlYXRlciBsb2dpYy4gUmVwZWF0ZXJcbiAqIG1ldGFkYXRhIGFyZSBhbGxvY2F0ZWQgaW4gdGhlIGRhdGEgcGFydCBvZiBMVmlldyB3aXRoIHRoZSBmb2xsb3dpbmcgbGF5b3V0OlxuICogLSBMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXhdIC0gbWV0YWRhdGFcbiAqIC0gTFZpZXdbSEVBREVSX09GRlNFVCArIGluZGV4ICsgMV0gLSByZWZlcmVuY2UgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiByZW5kZXJpbmcgYW4gaXRlbVxuICogLSBMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXggKyAyXSAtIG9wdGlvbmFsIHJlZmVyZW5jZSB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIHJlbmRlcmluZyBhbiBlbXB0eVxuICogYmxvY2tcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggYXQgd2hpY2ggdG8gc3RvcmUgdGhlIG1ldGFkYXRhIG9mIHRoZSByZXBlYXRlci5cbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFJlZmVyZW5jZSB0byB0aGUgdGVtcGxhdGUgb2YgdGhlIG1haW4gcmVwZWF0ZXIgYmxvY2suXG4gKiBAcGFyYW0gZGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGUgbWFpbiBibG9jay5cbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoZSBtYWluIGJsb2NrLlxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0ZW1wbGF0ZSBhdHRyaWJ1dGVzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqIEBwYXJhbSB0cmFja0J5Rm4gUmVmZXJlbmNlIHRvIHRoZSB0cmFja2luZyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB0cmFja0J5VXNlc0NvbXBvbmVudEluc3RhbmNlIFdoZXRoZXIgdGhlIHRyYWNraW5nIGZ1bmN0aW9uIGhhcyBhbnkgcmVmZXJlbmNlcyB0byB0aGVcbiAqICBjb21wb25lbnQgaW5zdGFuY2UuIElmIGl0IGRvZXNuJ3QsIHdlIGNhbiBhdm9pZCByZWJpbmRpbmcgaXQuXG4gKiBAcGFyYW0gZW1wdHlUZW1wbGF0ZUZuIFJlZmVyZW5jZSB0byB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gb2YgdGhlIGVtcHR5IGJsb2NrLlxuICogQHBhcmFtIGVtcHR5RGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGUgZW1wdHkgYmxvY2suXG4gKiBAcGFyYW0gZW1wdHlWYXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoZSBlbXB0eSBibG9jay5cbiAqIEBwYXJhbSBlbXB0eVRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGVtcHR5IGJsb2NrIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gZW1wdHlBdHRyc0luZGV4IEluZGV4IG9mIHRoZSBlbXB0eSBibG9jayB0ZW1wbGF0ZSBhdHRyaWJ1dGVzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlcGVhdGVyQ3JlYXRlKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHVua25vd24+LCBkZWNsczogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzSW5kZXg6IG51bWJlcnxudWxsLCB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjx1bmtub3duPixcbiAgICB0cmFja0J5VXNlc0NvbXBvbmVudEluc3RhbmNlPzogYm9vbGVhbiwgZW1wdHlUZW1wbGF0ZUZuPzogQ29tcG9uZW50VGVtcGxhdGU8dW5rbm93bj4sXG4gICAgZW1wdHlEZWNscz86IG51bWJlciwgZW1wdHlWYXJzPzogbnVtYmVyLCBlbXB0eVRhZ05hbWU/OiBzdHJpbmd8bnVsbCxcbiAgICBlbXB0eUF0dHJzSW5kZXg/OiBudW1iZXJ8bnVsbCk6IHZvaWQge1xuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0NvbnRyb2xGbG93Jyk7XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRGdW5jdGlvbihcbiAgICAgICAgICB0cmFja0J5Rm4sIGBBIHRyYWNrIGV4cHJlc3Npb24gbXVzdCBiZSBhIGZ1bmN0aW9uLCB3YXMgJHt0eXBlb2YgdHJhY2tCeUZufSBpbnN0ZWFkLmApO1xuXG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBoYXNFbXB0eUJsb2NrID0gZW1wdHlUZW1wbGF0ZUZuICE9PSB1bmRlZmluZWQ7XG4gIGNvbnN0IGhvc3RMVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJvdW5kVHJhY2tCeSA9IHRyYWNrQnlVc2VzQ29tcG9uZW50SW5zdGFuY2UgP1xuICAgICAgLy8gV2Ugb25seSB3YW50IHRvIGJpbmQgd2hlbiBuZWNlc3NhcnksIGJlY2F1c2UgaXQgcHJvZHVjZXMgYVxuICAgICAgLy8gbmV3IGZ1bmN0aW9uLiBGb3IgcHVyZSBmdW5jdGlvbnMgaXQncyBub3QgbmVjZXNzYXJ5LlxuICAgICAgdHJhY2tCeUZuLmJpbmQoaG9zdExWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXVtDT05URVhUXSkgOlxuICAgICAgdHJhY2tCeUZuO1xuICBjb25zdCBtZXRhZGF0YSA9IG5ldyBSZXBlYXRlck1ldGFkYXRhKGhhc0VtcHR5QmxvY2ssIGJvdW5kVHJhY2tCeSk7XG4gIGhvc3RMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXhdID0gbWV0YWRhdGE7XG5cbiAgZGVjbGFyZVRlbXBsYXRlKFxuICAgICAgbFZpZXcsIHRWaWV3LCBpbmRleCArIDEsIHRlbXBsYXRlRm4sIGRlY2xzLCB2YXJzLCB0YWdOYW1lLFxuICAgICAgZ2V0Q29uc3RhbnQodFZpZXcuY29uc3RzLCBhdHRyc0luZGV4KSk7XG5cbiAgaWYgKGhhc0VtcHR5QmxvY2spIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChlbXB0eURlY2xzLCAnTWlzc2luZyBudW1iZXIgb2YgZGVjbGFyYXRpb25zIGZvciB0aGUgZW1wdHkgcmVwZWF0ZXIgYmxvY2suJyk7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoZW1wdHlWYXJzLCAnTWlzc2luZyBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoZSBlbXB0eSByZXBlYXRlciBibG9jay4nKTtcblxuICAgIGRlY2xhcmVUZW1wbGF0ZShcbiAgICAgICAgbFZpZXcsIHRWaWV3LCBpbmRleCArIDIsIGVtcHR5VGVtcGxhdGVGbiwgZW1wdHlEZWNscyEsIGVtcHR5VmFycyEsIGVtcHR5VGFnTmFtZSxcbiAgICAgICAgZ2V0Q29uc3RhbnQodFZpZXcuY29uc3RzLCBlbXB0eUF0dHJzSW5kZXgpKTtcbiAgfVxufVxuXG5jbGFzcyBMaXZlQ29sbGVjdGlvbkxDb250YWluZXJJbXBsIGV4dGVuZHNcbiAgICBMaXZlQ29sbGVjdGlvbjxMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+LCB1bmtub3duPiB7XG4gIC8qKlxuICAgUHJvcGVydHkgaW5kaWNhdGluZyBpZiBpbmRleGVzIGluIHRoZSByZXBlYXRlciBjb250ZXh0IG5lZWQgdG8gYmUgdXBkYXRlZCBmb2xsb3dpbmcgdGhlIGxpdmVcbiAgIGNvbGxlY3Rpb24gY2hhbmdlcy4gSW5kZXggdXBkYXRlcyBhcmUgbmVjZXNzYXJ5IGlmIGFuZCBvbmx5IGlmIHZpZXdzIGFyZSBpbnNlcnRlZCAvIHJlbW92ZWQgaW5cbiAgIHRoZSBtaWRkbGUgb2YgTENvbnRhaW5lci4gQWRkcyBhbmQgcmVtb3ZhbHMgYXQgdGhlIGVuZCBkb24ndCByZXF1aXJlIGluZGV4IHVwZGF0ZXMuXG4gKi9cbiAgcHJpdmF0ZSBuZWVkc0luZGV4VXBkYXRlID0gZmFsc2U7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBwcml2YXRlIGhvc3RMVmlldzogTFZpZXcsIHByaXZhdGUgdGVtcGxhdGVUTm9kZTogVE5vZGUpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmxDb250YWluZXIubGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7XG4gIH1cbiAgb3ZlcnJpZGUgYXQoaW5kZXg6IG51bWJlcik6IHVua25vd24ge1xuICAgIHJldHVybiB0aGlzLmdldExWaWV3KGluZGV4KVtDT05URVhUXS4kaW1wbGljaXQ7XG4gIH1cbiAgb3ZlcnJpZGUgYXR0YWNoKGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+KTogdm9pZCB7XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPSBsVmlld1tIWURSQVRJT05dIGFzIERlaHlkcmF0ZWRDb250YWluZXJWaWV3O1xuICAgIHRoaXMubmVlZHNJbmRleFVwZGF0ZSB8fD0gaW5kZXggIT09IHRoaXMubGVuZ3RoO1xuICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICB0aGlzLmxDb250YWluZXIsIGxWaWV3LCBpbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHRoaXMudGVtcGxhdGVUTm9kZSwgZGVoeWRyYXRlZFZpZXcpKTtcbiAgfVxuICBvdmVycmlkZSBkZXRhY2goaW5kZXg6IG51bWJlcik6IExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4ge1xuICAgIHRoaXMubmVlZHNJbmRleFVwZGF0ZSB8fD0gaW5kZXggIT09IHRoaXMubGVuZ3RoIC0gMTtcbiAgICByZXR1cm4gZGV0YWNoRXhpc3RpbmdWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4odGhpcy5sQ29udGFpbmVyLCBpbmRleCk7XG4gIH1cbiAgb3ZlcnJpZGUgY3JlYXRlKGluZGV4OiBudW1iZXIsIHZhbHVlOiB1bmtub3duKTogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+PiB7XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPVxuICAgICAgICBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyh0aGlzLmxDb250YWluZXIsIHRoaXMudGVtcGxhdGVUTm9kZS50VmlldyEuc3NySWQpO1xuICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KFxuICAgICAgICB0aGlzLmhvc3RMVmlldywgdGhpcy50ZW1wbGF0ZVROb2RlLCBuZXcgUmVwZWF0ZXJDb250ZXh0KHRoaXMubENvbnRhaW5lciwgdmFsdWUsIGluZGV4KSxcbiAgICAgICAge2RlaHlkcmF0ZWRWaWV3fSk7XG5cbiAgICByZXR1cm4gZW1iZWRkZWRMVmlldztcbiAgfVxuICBvdmVycmlkZSBkZXN0cm95KGxWaWV3OiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+KTogdm9pZCB7XG4gICAgZGVzdHJveUxWaWV3KGxWaWV3W1RWSUVXXSwgbFZpZXcpO1xuICB9XG4gIG92ZXJyaWRlIHVwZGF0ZVZhbHVlKGluZGV4OiBudW1iZXIsIHZhbHVlOiB1bmtub3duKTogdm9pZCB7XG4gICAgdGhpcy5nZXRMVmlldyhpbmRleClbQ09OVEVYVF0uJGltcGxpY2l0ID0gdmFsdWU7XG4gIH1cblxuICByZXNldCgpIHtcbiAgICB0aGlzLm5lZWRzSW5kZXhVcGRhdGUgPSBmYWxzZTtcbiAgfVxuXG4gIHVwZGF0ZUluZGV4ZXMoKSB7XG4gICAgaWYgKHRoaXMubmVlZHNJbmRleFVwZGF0ZSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZ2V0TFZpZXcoaSlbQ09OVEVYVF0uJGluZGV4ID0gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldExWaWV3KGluZGV4OiBudW1iZXIpOiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+IHtcbiAgICByZXR1cm4gZ2V0RXhpc3RpbmdMVmlld0Zyb21MQ29udGFpbmVyKHRoaXMubENvbnRhaW5lciwgaW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogVGhlIHJlcGVhdGVyIGluc3RydWN0aW9uIGRvZXMgdXBkYXRlLXRpbWUgZGlmZmluZyBvZiBhIHByb3ZpZGVkIGNvbGxlY3Rpb24gKGFnYWluc3QgdGhlXG4gKiBjb2xsZWN0aW9uIHNlZW4gcHJldmlvdXNseSkgYW5kIG1hcHMgY2hhbmdlcyBpbiB0aGUgY29sbGVjdGlvbiB0byB2aWV3cyBzdHJ1Y3R1cmUgKGJ5IGFkZGluZyxcbiAqIHJlbW92aW5nIG9yIG1vdmluZyB2aWV3cyBhcyBuZWVkZWQpLlxuICogQHBhcmFtIGNvbGxlY3Rpb24gLSB0aGUgY29sbGVjdGlvbiBpbnN0YW5jZSB0byBiZSBjaGVja2VkIGZvciBjaGFuZ2VzXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlcGVhdGVyKGNvbGxlY3Rpb246IEl0ZXJhYmxlPHVua25vd24+fHVuZGVmaW5lZHxudWxsKTogdm9pZCB7XG4gIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICBjb25zdCBtZXRhZGF0YVNsb3RJZHggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgY29uc3QgaG9zdExWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gaG9zdExWaWV3W21ldGFkYXRhU2xvdElkeF0gYXMgUmVwZWF0ZXJNZXRhZGF0YTtcblxuICAgIGlmIChtZXRhZGF0YS5saXZlQ29sbGVjdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBjb250YWluZXJJbmRleCA9IG1ldGFkYXRhU2xvdElkeCArIDE7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gZ2V0TENvbnRhaW5lcihob3N0TFZpZXcsIGNvbnRhaW5lckluZGV4KTtcbiAgICAgIGNvbnN0IGl0ZW1UZW1wbGF0ZVROb2RlID0gZ2V0RXhpc3RpbmdUTm9kZShob3N0VFZpZXcsIGNvbnRhaW5lckluZGV4KTtcbiAgICAgIG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uID1cbiAgICAgICAgICBuZXcgTGl2ZUNvbGxlY3Rpb25MQ29udGFpbmVySW1wbChsQ29udGFpbmVyLCBob3N0TFZpZXcsIGl0ZW1UZW1wbGF0ZVROb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWV0YWRhdGEubGl2ZUNvbGxlY3Rpb24ucmVzZXQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXZlQ29sbGVjdGlvbiA9IG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uO1xuICAgIHJlY29uY2lsZShsaXZlQ29sbGVjdGlvbiwgY29sbGVjdGlvbiwgbWV0YWRhdGEudHJhY2tCeUZuKTtcblxuICAgIC8vIG1vdmVzIGluIHRoZSBjb250YWluZXIgbWlnaHQgY2F1c2VkIGNvbnRleHQncyBpbmRleCB0byBnZXQgb3V0IG9mIG9yZGVyLCByZS1hZGp1c3QgaWYgbmVlZGVkXG4gICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlSW5kZXhlcygpO1xuXG4gICAgLy8gaGFuZGxlIGVtcHR5IGJsb2Nrc1xuICAgIGlmIChtZXRhZGF0YS5oYXNFbXB0eUJsb2NrKSB7XG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gICAgICBjb25zdCBpc0NvbGxlY3Rpb25FbXB0eSA9IGxpdmVDb2xsZWN0aW9uLmxlbmd0aCA9PT0gMDtcbiAgICAgIGlmIChiaW5kaW5nVXBkYXRlZChob3N0TFZpZXcsIGJpbmRpbmdJbmRleCwgaXNDb2xsZWN0aW9uRW1wdHkpKSB7XG4gICAgICAgIGNvbnN0IGVtcHR5VGVtcGxhdGVJbmRleCA9IG1ldGFkYXRhU2xvdElkeCArIDI7XG4gICAgICAgIGNvbnN0IGxDb250YWluZXJGb3JFbXB0eSA9IGdldExDb250YWluZXIoaG9zdExWaWV3LCBlbXB0eVRlbXBsYXRlSW5kZXgpO1xuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uRW1wdHkpIHtcbiAgICAgICAgICBjb25zdCBlbXB0eVRlbXBsYXRlVE5vZGUgPSBnZXRFeGlzdGluZ1ROb2RlKGhvc3RUVmlldywgZW1wdHlUZW1wbGF0ZUluZGV4KTtcbiAgICAgICAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9XG4gICAgICAgICAgICAgIGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXJGb3JFbXB0eSwgZW1wdHlUZW1wbGF0ZVROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoXG4gICAgICAgICAgICAgIGhvc3RMVmlldywgZW1wdHlUZW1wbGF0ZVROb2RlLCB1bmRlZmluZWQsIHtkZWh5ZHJhdGVkVmlld30pO1xuICAgICAgICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICAgICAgICBsQ29udGFpbmVyRm9yRW1wdHksIGVtYmVkZGVkTFZpZXcsIDAsXG4gICAgICAgICAgICAgIHNob3VsZEFkZFZpZXdUb0RvbShlbXB0eVRlbXBsYXRlVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihsQ29udGFpbmVyRm9yRW1wdHksIDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TENvbnRhaW5lcihsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIpOiBMQ29udGFpbmVyIHtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2luZGV4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG5cbiAgcmV0dXJuIGxDb250YWluZXI7XG59XG5cbmZ1bmN0aW9uIGRldGFjaEV4aXN0aW5nVmlldzxUPihsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKTogTFZpZXc8VD4ge1xuICBjb25zdCBleGlzdGluZ0xWaWV3ID0gZGV0YWNoVmlldyhsQ29udGFpbmVyLCBpbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhleGlzdGluZ0xWaWV3KTtcblxuICByZXR1cm4gZXhpc3RpbmdMVmlldyBhcyBMVmlldzxUPjtcbn1cblxuZnVuY3Rpb24gZ2V0RXhpc3RpbmdMVmlld0Zyb21MQ29udGFpbmVyPFQ+KGxDb250YWluZXI6IExDb250YWluZXIsIGluZGV4OiBudW1iZXIpOiBMVmlldzxUPiB7XG4gIGNvbnN0IGV4aXN0aW5nTFZpZXcgPSBnZXRMVmlld0Zyb21MQ29udGFpbmVyPFQ+KGxDb250YWluZXIsIGluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGV4aXN0aW5nTFZpZXcpO1xuXG4gIHJldHVybiBleGlzdGluZ0xWaWV3ITtcbn1cblxuZnVuY3Rpb24gZ2V0RXhpc3RpbmdUTm9kZSh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIpOiBUTm9kZSB7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUodFZpZXcsIGluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlKHROb2RlKTtcblxuICByZXR1cm4gdE5vZGU7XG59XG4iXX0=