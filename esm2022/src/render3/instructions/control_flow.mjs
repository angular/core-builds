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
import { getLView, getSelectedIndex, nextBindingIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { getTNode } from '../util/view_utils';
import { addLViewToLContainer, createAndRenderEmbeddedLView, getLViewFromLContainer, removeLViewFromLContainer, shouldAddViewToDom } from '../view_manipulation';
import { ɵɵtemplate } from './template';
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
    const hasEmptyBlock = emptyTemplateFn !== undefined;
    const hostLView = getLView();
    const boundTrackBy = trackByUsesComponentInstance ?
        // We only want to bind when necessary, because it produces a
        // new function. For pure functions it's not necessary.
        trackByFn.bind(hostLView[DECLARATION_COMPONENT_VIEW][CONTEXT]) :
        trackByFn;
    const metadata = new RepeaterMetadata(hasEmptyBlock, boundTrackBy);
    hostLView[HEADER_OFFSET + index] = metadata;
    ɵɵtemplate(index + 1, templateFn, decls, vars, tagName, attrsIndex);
    if (hasEmptyBlock) {
        ngDevMode &&
            assertDefined(emptyDecls, 'Missing number of declarations for the empty repeater block.');
        ngDevMode &&
            assertDefined(emptyVars, 'Missing number of bindings for the empty repeater block.');
        ɵɵtemplate(index + 2, emptyTemplateFn, emptyDecls, emptyVars, emptyTagName, emptyAttrsIndex);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbF9mbG93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udHJvbF9mbG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBSW5FLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDckUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUMzQyxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUc1RSxPQUFPLEVBQUMsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQVMsS0FBSyxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDdEgsT0FBTyxFQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzlELE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUMsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDRCQUE0QixFQUFF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ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3NldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7VHJhY2tCeUZ1bmN0aW9ufSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7RGVoeWRyYXRlZENvbnRhaW5lclZpZXd9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi9pbnRlcmZhY2VzJztcbmltcG9ydCB7ZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi92aWV3cyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEZ1bmN0aW9ufSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlldywgYXNzZXJ0VE5vZGV9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudFRlbXBsYXRlfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIEhFQURFUl9PRkZTRVQsIEhZRFJBVElPTiwgTFZpZXcsIFRWSUVXLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7TGl2ZUNvbGxlY3Rpb24sIHJlY29uY2lsZX0gZnJvbSAnLi4vbGlzdF9yZWNvbmNpbGlhdGlvbic7XG5pbXBvcnQge2Rlc3Ryb3lMVmlldywgZGV0YWNoVmlld30gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgbmV4dEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthZGRMVmlld1RvTENvbnRhaW5lciwgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldywgZ2V0TFZpZXdGcm9tTENvbnRhaW5lciwgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lciwgc2hvdWxkQWRkVmlld1RvRG9tfSBmcm9tICcuLi92aWV3X21hbmlwdWxhdGlvbic7XG5cbmltcG9ydCB7ybXJtXRlbXBsYXRlfSBmcm9tICcuL3RlbXBsYXRlJztcblxuLyoqXG4gKiBUaGUgY29uZGl0aW9uYWwgaW5zdHJ1Y3Rpb24gcmVwcmVzZW50cyB0aGUgYmFzaWMgYnVpbGRpbmcgYmxvY2sgb24gdGhlIHJ1bnRpbWUgc2lkZSB0byBzdXBwb3J0XG4gKiBidWlsdC1pbiBcImlmXCIgYW5kIFwic3dpdGNoXCIuIE9uIHRoZSBoaWdoIGxldmVsIHRoaXMgaW5zdHJ1Y3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIGFkZGluZyBhbmRcbiAqIHJlbW92aW5nIHZpZXdzIHNlbGVjdGVkIGJ5IGEgY29uZGl0aW9uYWwgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gbWF0Y2hpbmdUZW1wbGF0ZUluZGV4IGluZGV4IG9mIGEgdGVtcGxhdGUgVE5vZGUgcmVwcmVzZW50aW5nIGEgY29uZGl0aW9uYWwgdmlldyB0byBiZVxuICogICAgIGluc2VydGVkOyAtMSByZXByZXNlbnRzIGEgc3BlY2lhbCBjYXNlIHdoZW4gdGhlcmUgaXMgbm8gdmlldyB0byBpbnNlcnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbmRpdGlvbmFsPFQ+KGNvbnRhaW5lckluZGV4OiBudW1iZXIsIG1hdGNoaW5nVGVtcGxhdGVJbmRleDogbnVtYmVyLCB2YWx1ZT86IFQpIHtcbiAgLy8gVE9ETzogd2UgY291bGQgcmVtb3ZlIHRoZSBjb250YWluZXJJbmRleCBhcmd1bWVudCB0byB0aGlzIGluc3RydWN0aW9uIG5vdyAoISlcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdDb250cm9sRmxvdycpO1xuXG4gIGNvbnN0IGhvc3RMVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgY29uc3QgcHJldk1hdGNoaW5nVGVtcGxhdGVJbmRleDogbnVtYmVyID1cbiAgICAgIGhvc3RMVmlld1tiaW5kaW5nSW5kZXhdICE9PSBOT19DSEFOR0UgPyBob3N0TFZpZXdbYmluZGluZ0luZGV4XSA6IC0xO1xuICBjb25zdCBwcmV2Q29udGFpbmVyID0gcHJldk1hdGNoaW5nVGVtcGxhdGVJbmRleCAhPT0gLTEgP1xuICAgICAgZ2V0TENvbnRhaW5lcihob3N0TFZpZXcsIEhFQURFUl9PRkZTRVQgKyBwcmV2TWF0Y2hpbmdUZW1wbGF0ZUluZGV4KSA6XG4gICAgICB1bmRlZmluZWQ7XG4gIGNvbnN0IHZpZXdJbkNvbnRhaW5lcklkeCA9IDA7XG5cbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGhvc3RMVmlldywgYmluZGluZ0luZGV4LCBtYXRjaGluZ1RlbXBsYXRlSW5kZXgpKSB7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBzaG93IGNoYW5nZWQgLSByZW1vdmUgdGhlIHByZXZpb3VzbHkgZGlzcGxheWVkIG9uZVxuICAgICAgLy8gKGl0IGlzIGEgbm9vcCBpZiB0aGVyZSBhcmUgbm8gYWN0aXZlIHZpZXdzIGluIGEgY29udGFpbmVyKS5cbiAgICAgIGlmIChwcmV2Q29udGFpbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihwcmV2Q29udGFpbmVyLCB2aWV3SW5Db250YWluZXJJZHgpO1xuICAgICAgfVxuXG4gICAgICAvLyBJbmRleCAtMSBpcyBhIHNwZWNpYWwgY2FzZSB3aGVyZSBub25lIG9mIHRoZSBjb25kaXRpb25zIGV2YWx1YXRlcyB0b1xuICAgICAgLy8gYSB0cnV0aHkgdmFsdWUgYW5kIGFzIHRoZSBjb25zZXF1ZW5jZSB3ZSd2ZSBnb3Qgbm8gdmlldyB0byBzaG93LlxuICAgICAgaWYgKG1hdGNoaW5nVGVtcGxhdGVJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgbmV4dExDb250YWluZXJJbmRleCA9IEhFQURFUl9PRkZTRVQgKyBtYXRjaGluZ1RlbXBsYXRlSW5kZXg7XG4gICAgICAgIGNvbnN0IG5leHRDb250YWluZXIgPSBnZXRMQ29udGFpbmVyKGhvc3RMVmlldywgbmV4dExDb250YWluZXJJbmRleCk7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlVE5vZGUgPSBnZXRFeGlzdGluZ1ROb2RlKGhvc3RMVmlld1tUVklFV10sIG5leHRMQ29udGFpbmVySW5kZXgpO1xuXG4gICAgICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID1cbiAgICAgICAgICAgIGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KG5leHRDb250YWluZXIsIHRlbXBsYXRlVE5vZGUudFZpZXchLnNzcklkKTtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9XG4gICAgICAgICAgICBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KGhvc3RMVmlldywgdGVtcGxhdGVUTm9kZSwgdmFsdWUsIHtkZWh5ZHJhdGVkVmlld30pO1xuXG4gICAgICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICAgICAgbmV4dENvbnRhaW5lciwgZW1iZWRkZWRMVmlldywgdmlld0luQ29udGFpbmVySWR4LFxuICAgICAgICAgICAgc2hvdWxkQWRkVmlld1RvRG9tKHRlbXBsYXRlVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHByZXZDb250YWluZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFdlIG1pZ2h0IGtlZXAgZGlzcGxheWluZyB0aGUgc2FtZSB0ZW1wbGF0ZSBidXQgdGhlIGFjdHVhbCB2YWx1ZSBvZiB0aGUgZXhwcmVzc2lvbiBjb3VsZCBoYXZlXG4gICAgLy8gY2hhbmdlZCAtIHJlLWJpbmQgaW4gY29udGV4dC5cbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3RnJvbUxDb250YWluZXI8VHx1bmRlZmluZWQ+KHByZXZDb250YWluZXIsIHZpZXdJbkNvbnRhaW5lcklkeCk7XG4gICAgaWYgKGxWaWV3ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxWaWV3W0NPTlRFWFRdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZXBlYXRlckNvbnRleHQ8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGxDb250YWluZXI6IExDb250YWluZXIsIHB1YmxpYyAkaW1wbGljaXQ6IFQsIHB1YmxpYyAkaW5kZXg6IG51bWJlcikge31cblxuICBnZXQgJGNvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDtcbiAgfVxufVxuXG4vKipcbiAqIEEgYnVpbHQtaW4gdHJhY2tCeSBmdW5jdGlvbiB1c2VkIGZvciBzaXR1YXRpb25zIHdoZXJlIHVzZXJzIHNwZWNpZmllZCBjb2xsZWN0aW9uIGluZGV4IGFzIGFcbiAqIHRyYWNraW5nIGV4cHJlc3Npb24uIEhhdmluZyB0aGlzIGZ1bmN0aW9uIGJvZHkgaW4gdGhlIHJ1bnRpbWUgYXZvaWRzIHVubmVjZXNzYXJ5IGNvZGUgZ2VuZXJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gaW5kZXhcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVwZWF0ZXJUcmFja0J5SW5kZXgoaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogQSBidWlsdC1pbiB0cmFja0J5IGZ1bmN0aW9uIHVzZWQgZm9yIHNpdHVhdGlvbnMgd2hlcmUgdXNlcnMgc3BlY2lmaWVkIGNvbGxlY3Rpb24gaXRlbSByZWZlcmVuY2VcbiAqIGFzIGEgdHJhY2tpbmcgZXhwcmVzc2lvbi4gSGF2aW5nIHRoaXMgZnVuY3Rpb24gYm9keSBpbiB0aGUgcnVudGltZSBhdm9pZHMgdW5uZWNlc3NhcnkgY29kZVxuICogZ2VuZXJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gaW5kZXhcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVwZWF0ZXJUcmFja0J5SWRlbnRpdHk8VD4oXzogbnVtYmVyLCB2YWx1ZTogVCkge1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmNsYXNzIFJlcGVhdGVyTWV0YWRhdGEge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBoYXNFbXB0eUJsb2NrOiBib29sZWFuLCBwdWJsaWMgdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248dW5rbm93bj4sXG4gICAgICBwdWJsaWMgbGl2ZUNvbGxlY3Rpb24/OiBMaXZlQ29sbGVjdGlvbkxDb250YWluZXJJbXBsKSB7fVxufVxuXG4vKipcbiAqIFRoZSByZXBlYXRlckNyZWF0ZSBpbnN0cnVjdGlvbiBydW5zIGluIHRoZSBjcmVhdGlvbiBwYXJ0IG9mIHRoZSB0ZW1wbGF0ZSBwYXNzIGFuZCBpbml0aWFsaXplc1xuICogaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzIHJlcXVpcmVkIGJ5IHRoZSB1cGRhdGUgcGFzcyBvZiB0aGUgYnVpbHQtaW4gcmVwZWF0ZXIgbG9naWMuIFJlcGVhdGVyXG4gKiBtZXRhZGF0YSBhcmUgYWxsb2NhdGVkIGluIHRoZSBkYXRhIHBhcnQgb2YgTFZpZXcgd2l0aCB0aGUgZm9sbG93aW5nIGxheW91dDpcbiAqIC0gTFZpZXdbSEVBREVSX09GRlNFVCArIGluZGV4XSAtIG1ldGFkYXRhXG4gKiAtIExWaWV3W0hFQURFUl9PRkZTRVQgKyBpbmRleCArIDFdIC0gcmVmZXJlbmNlIHRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gcmVuZGVyaW5nIGFuIGl0ZW1cbiAqIC0gTFZpZXdbSEVBREVSX09GRlNFVCArIGluZGV4ICsgMl0gLSBvcHRpb25hbCByZWZlcmVuY2UgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiByZW5kZXJpbmcgYW4gZW1wdHlcbiAqIGJsb2NrXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IGF0IHdoaWNoIHRvIHN0b3JlIHRoZSBtZXRhZGF0YSBvZiB0aGUgcmVwZWF0ZXIuXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBSZWZlcmVuY2UgdG8gdGhlIHRlbXBsYXRlIG9mIHRoZSBtYWluIHJlcGVhdGVyIGJsb2NrLlxuICogQHBhcmFtIGRlY2xzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBmb3IgdGhlIG1haW4gYmxvY2suXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGZvciB0aGUgbWFpbiBibG9jay5cbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzSW5kZXggSW5kZXggb2YgdGVtcGxhdGUgYXR0cmlidXRlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKiBAcGFyYW0gdHJhY2tCeUZuIFJlZmVyZW5jZSB0byB0aGUgdHJhY2tpbmcgZnVuY3Rpb24uXG4gKiBAcGFyYW0gdHJhY2tCeVVzZXNDb21wb25lbnRJbnN0YW5jZSBXaGV0aGVyIHRoZSB0cmFja2luZyBmdW5jdGlvbiBoYXMgYW55IHJlZmVyZW5jZXMgdG8gdGhlXG4gKiAgY29tcG9uZW50IGluc3RhbmNlLiBJZiBpdCBkb2Vzbid0LCB3ZSBjYW4gYXZvaWQgcmViaW5kaW5nIGl0LlxuICogQHBhcmFtIGVtcHR5VGVtcGxhdGVGbiBSZWZlcmVuY2UgdG8gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIG9mIHRoZSBlbXB0eSBibG9jay5cbiAqIEBwYXJhbSBlbXB0eURlY2xzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBmb3IgdGhlIGVtcHR5IGJsb2NrLlxuICogQHBhcmFtIGVtcHR5VmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGZvciB0aGUgZW1wdHkgYmxvY2suXG4gKiBAcGFyYW0gZW1wdHlUYWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBlbXB0eSBibG9jayBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGVtcHR5QXR0cnNJbmRleCBJbmRleCBvZiB0aGUgZW1wdHkgYmxvY2sgdGVtcGxhdGUgYXR0cmlidXRlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXBlYXRlckNyZWF0ZShcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx1bmtub3duPiwgZGVjbHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyc0luZGV4OiBudW1iZXJ8bnVsbCwgdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248dW5rbm93bj4sXG4gICAgdHJhY2tCeVVzZXNDb21wb25lbnRJbnN0YW5jZT86IGJvb2xlYW4sIGVtcHR5VGVtcGxhdGVGbj86IENvbXBvbmVudFRlbXBsYXRlPHVua25vd24+LFxuICAgIGVtcHR5RGVjbHM/OiBudW1iZXIsIGVtcHR5VmFycz86IG51bWJlciwgZW1wdHlUYWdOYW1lPzogc3RyaW5nfG51bGwsXG4gICAgZW1wdHlBdHRyc0luZGV4PzogbnVtYmVyfG51bGwpOiB2b2lkIHtcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdDb250cm9sRmxvdycpO1xuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RnVuY3Rpb24oXG4gICAgICAgICAgdHJhY2tCeUZuLCBgQSB0cmFjayBleHByZXNzaW9uIG11c3QgYmUgYSBmdW5jdGlvbiwgd2FzICR7dHlwZW9mIHRyYWNrQnlGbn0gaW5zdGVhZC5gKTtcblxuICBjb25zdCBoYXNFbXB0eUJsb2NrID0gZW1wdHlUZW1wbGF0ZUZuICE9PSB1bmRlZmluZWQ7XG4gIGNvbnN0IGhvc3RMVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJvdW5kVHJhY2tCeSA9IHRyYWNrQnlVc2VzQ29tcG9uZW50SW5zdGFuY2UgP1xuICAgICAgLy8gV2Ugb25seSB3YW50IHRvIGJpbmQgd2hlbiBuZWNlc3NhcnksIGJlY2F1c2UgaXQgcHJvZHVjZXMgYVxuICAgICAgLy8gbmV3IGZ1bmN0aW9uLiBGb3IgcHVyZSBmdW5jdGlvbnMgaXQncyBub3QgbmVjZXNzYXJ5LlxuICAgICAgdHJhY2tCeUZuLmJpbmQoaG9zdExWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXVtDT05URVhUXSkgOlxuICAgICAgdHJhY2tCeUZuO1xuICBjb25zdCBtZXRhZGF0YSA9IG5ldyBSZXBlYXRlck1ldGFkYXRhKGhhc0VtcHR5QmxvY2ssIGJvdW5kVHJhY2tCeSk7XG4gIGhvc3RMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXhdID0gbWV0YWRhdGE7XG5cbiAgybXJtXRlbXBsYXRlKGluZGV4ICsgMSwgdGVtcGxhdGVGbiwgZGVjbHMsIHZhcnMsIHRhZ05hbWUsIGF0dHJzSW5kZXgpO1xuXG4gIGlmIChoYXNFbXB0eUJsb2NrKSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoZW1wdHlEZWNscywgJ01pc3NpbmcgbnVtYmVyIG9mIGRlY2xhcmF0aW9ucyBmb3IgdGhlIGVtcHR5IHJlcGVhdGVyIGJsb2NrLicpO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKGVtcHR5VmFycywgJ01pc3NpbmcgbnVtYmVyIG9mIGJpbmRpbmdzIGZvciB0aGUgZW1wdHkgcmVwZWF0ZXIgYmxvY2suJyk7XG5cbiAgICDJtcm1dGVtcGxhdGUoaW5kZXggKyAyLCBlbXB0eVRlbXBsYXRlRm4sIGVtcHR5RGVjbHMhLCBlbXB0eVZhcnMhLCBlbXB0eVRhZ05hbWUsIGVtcHR5QXR0cnNJbmRleCk7XG4gIH1cbn1cblxuY2xhc3MgTGl2ZUNvbGxlY3Rpb25MQ29udGFpbmVySW1wbCBleHRlbmRzXG4gICAgTGl2ZUNvbGxlY3Rpb248TFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+PiwgdW5rbm93bj4ge1xuICAvKipcbiAgIFByb3BlcnR5IGluZGljYXRpbmcgaWYgaW5kZXhlcyBpbiB0aGUgcmVwZWF0ZXIgY29udGV4dCBuZWVkIHRvIGJlIHVwZGF0ZWQgZm9sbG93aW5nIHRoZSBsaXZlXG4gICBjb2xsZWN0aW9uIGNoYW5nZXMuIEluZGV4IHVwZGF0ZXMgYXJlIG5lY2Vzc2FyeSBpZiBhbmQgb25seSBpZiB2aWV3cyBhcmUgaW5zZXJ0ZWQgLyByZW1vdmVkIGluXG4gICB0aGUgbWlkZGxlIG9mIExDb250YWluZXIuIEFkZHMgYW5kIHJlbW92YWxzIGF0IHRoZSBlbmQgZG9uJ3QgcmVxdWlyZSBpbmRleCB1cGRhdGVzLlxuICovXG4gIHByaXZhdGUgbmVlZHNJbmRleFVwZGF0ZSA9IGZhbHNlO1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcHJpdmF0ZSBob3N0TFZpZXc6IExWaWV3LCBwcml2YXRlIHRlbXBsYXRlVE5vZGU6IFROb2RlKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5sQ29udGFpbmVyLmxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUO1xuICB9XG4gIG92ZXJyaWRlIGF0KGluZGV4OiBudW1iZXIpOiB1bmtub3duIHtcbiAgICByZXR1cm4gdGhpcy5nZXRMVmlldyhpbmRleClbQ09OVEVYVF0uJGltcGxpY2l0O1xuICB9XG4gIG92ZXJyaWRlIGF0dGFjaChpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+Pik6IHZvaWQge1xuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID0gbFZpZXdbSFlEUkFUSU9OXSBhcyBEZWh5ZHJhdGVkQ29udGFpbmVyVmlldztcbiAgICB0aGlzLm5lZWRzSW5kZXhVcGRhdGUgfHw9IGluZGV4ICE9PSB0aGlzLmxlbmd0aDtcbiAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgdGhpcy5sQ29udGFpbmVyLCBsVmlldywgaW5kZXgsIHNob3VsZEFkZFZpZXdUb0RvbSh0aGlzLnRlbXBsYXRlVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gIH1cbiAgb3ZlcnJpZGUgZGV0YWNoKGluZGV4OiBudW1iZXIpOiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+IHtcbiAgICB0aGlzLm5lZWRzSW5kZXhVcGRhdGUgfHw9IGluZGV4ICE9PSB0aGlzLmxlbmd0aCAtIDE7XG4gICAgcmV0dXJuIGRldGFjaEV4aXN0aW5nVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+KHRoaXMubENvbnRhaW5lciwgaW5kZXgpO1xuICB9XG4gIG92ZXJyaWRlIGNyZWF0ZShpbmRleDogbnVtYmVyLCB2YWx1ZTogdW5rbm93bik6IExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4ge1xuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID1cbiAgICAgICAgZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcodGhpcy5sQ29udGFpbmVyLCB0aGlzLnRlbXBsYXRlVE5vZGUudFZpZXchLnNzcklkKTtcbiAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldyhcbiAgICAgICAgdGhpcy5ob3N0TFZpZXcsIHRoaXMudGVtcGxhdGVUTm9kZSwgbmV3IFJlcGVhdGVyQ29udGV4dCh0aGlzLmxDb250YWluZXIsIHZhbHVlLCBpbmRleCksXG4gICAgICAgIHtkZWh5ZHJhdGVkVmlld30pO1xuXG4gICAgcmV0dXJuIGVtYmVkZGVkTFZpZXc7XG4gIH1cbiAgb3ZlcnJpZGUgZGVzdHJveShsVmlldzogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+Pik6IHZvaWQge1xuICAgIGRlc3Ryb3lMVmlldyhsVmlld1tUVklFV10sIGxWaWV3KTtcbiAgfVxuICBvdmVycmlkZSB1cGRhdGVWYWx1ZShpbmRleDogbnVtYmVyLCB2YWx1ZTogdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMuZ2V0TFZpZXcoaW5kZXgpW0NPTlRFWFRdLiRpbXBsaWNpdCA9IHZhbHVlO1xuICB9XG5cbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5uZWVkc0luZGV4VXBkYXRlID0gZmFsc2U7XG4gIH1cblxuICB1cGRhdGVJbmRleGVzKCkge1xuICAgIGlmICh0aGlzLm5lZWRzSW5kZXhVcGRhdGUpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmdldExWaWV3KGkpW0NPTlRFWFRdLiRpbmRleCA9IGk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRMVmlldyhpbmRleDogbnVtYmVyKTogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+PiB7XG4gICAgcmV0dXJuIGdldEV4aXN0aW5nTFZpZXdGcm9tTENvbnRhaW5lcih0aGlzLmxDb250YWluZXIsIGluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSByZXBlYXRlciBpbnN0cnVjdGlvbiBkb2VzIHVwZGF0ZS10aW1lIGRpZmZpbmcgb2YgYSBwcm92aWRlZCBjb2xsZWN0aW9uIChhZ2FpbnN0IHRoZVxuICogY29sbGVjdGlvbiBzZWVuIHByZXZpb3VzbHkpIGFuZCBtYXBzIGNoYW5nZXMgaW4gdGhlIGNvbGxlY3Rpb24gdG8gdmlld3Mgc3RydWN0dXJlIChieSBhZGRpbmcsXG4gKiByZW1vdmluZyBvciBtb3Zpbmcgdmlld3MgYXMgbmVlZGVkKS5cbiAqIEBwYXJhbSBjb2xsZWN0aW9uIC0gdGhlIGNvbGxlY3Rpb24gaW5zdGFuY2UgdG8gYmUgY2hlY2tlZCBmb3IgY2hhbmdlc1xuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXBlYXRlcihjb2xsZWN0aW9uOiBJdGVyYWJsZTx1bmtub3duPnx1bmRlZmluZWR8bnVsbCk6IHZvaWQge1xuICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgY29uc3QgbWV0YWRhdGFTbG90SWR4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIGNvbnN0IGhvc3RMVmlldyA9IGdldExWaWV3KCk7XG4gICAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgICBjb25zdCBtZXRhZGF0YSA9IGhvc3RMVmlld1ttZXRhZGF0YVNsb3RJZHhdIGFzIFJlcGVhdGVyTWV0YWRhdGE7XG5cbiAgICBpZiAobWV0YWRhdGEubGl2ZUNvbGxlY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgY29udGFpbmVySW5kZXggPSBtZXRhZGF0YVNsb3RJZHggKyAxO1xuICAgICAgY29uc3QgbENvbnRhaW5lciA9IGdldExDb250YWluZXIoaG9zdExWaWV3LCBjb250YWluZXJJbmRleCk7XG4gICAgICBjb25zdCBpdGVtVGVtcGxhdGVUTm9kZSA9IGdldEV4aXN0aW5nVE5vZGUoaG9zdFRWaWV3LCBjb250YWluZXJJbmRleCk7XG4gICAgICBtZXRhZGF0YS5saXZlQ29sbGVjdGlvbiA9XG4gICAgICAgICAgbmV3IExpdmVDb2xsZWN0aW9uTENvbnRhaW5lckltcGwobENvbnRhaW5lciwgaG9zdExWaWV3LCBpdGVtVGVtcGxhdGVUTm9kZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uLnJlc2V0KCk7XG4gICAgfVxuXG4gICAgY29uc3QgbGl2ZUNvbGxlY3Rpb24gPSBtZXRhZGF0YS5saXZlQ29sbGVjdGlvbjtcbiAgICByZWNvbmNpbGUobGl2ZUNvbGxlY3Rpb24sIGNvbGxlY3Rpb24sIG1ldGFkYXRhLnRyYWNrQnlGbik7XG5cbiAgICAvLyBtb3ZlcyBpbiB0aGUgY29udGFpbmVyIG1pZ2h0IGNhdXNlZCBjb250ZXh0J3MgaW5kZXggdG8gZ2V0IG91dCBvZiBvcmRlciwgcmUtYWRqdXN0IGlmIG5lZWRlZFxuICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZUluZGV4ZXMoKTtcblxuICAgIC8vIGhhbmRsZSBlbXB0eSBibG9ja3NcbiAgICBpZiAobWV0YWRhdGEuaGFzRW1wdHlCbG9jaykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICAgICAgY29uc3QgaXNDb2xsZWN0aW9uRW1wdHkgPSBsaXZlQ29sbGVjdGlvbi5sZW5ndGggPT09IDA7XG4gICAgICBpZiAoYmluZGluZ1VwZGF0ZWQoaG9zdExWaWV3LCBiaW5kaW5nSW5kZXgsIGlzQ29sbGVjdGlvbkVtcHR5KSkge1xuICAgICAgICBjb25zdCBlbXB0eVRlbXBsYXRlSW5kZXggPSBtZXRhZGF0YVNsb3RJZHggKyAyO1xuICAgICAgICBjb25zdCBsQ29udGFpbmVyRm9yRW1wdHkgPSBnZXRMQ29udGFpbmVyKGhvc3RMVmlldywgZW1wdHlUZW1wbGF0ZUluZGV4KTtcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbkVtcHR5KSB7XG4gICAgICAgICAgY29uc3QgZW1wdHlUZW1wbGF0ZVROb2RlID0gZ2V0RXhpc3RpbmdUTm9kZShob3N0VFZpZXcsIGVtcHR5VGVtcGxhdGVJbmRleCk7XG4gICAgICAgICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPVxuICAgICAgICAgICAgICBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyhsQ29udGFpbmVyRm9yRW1wdHksIGVtcHR5VGVtcGxhdGVUTm9kZS50VmlldyEuc3NySWQpO1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KFxuICAgICAgICAgICAgICBob3N0TFZpZXcsIGVtcHR5VGVtcGxhdGVUTm9kZSwgdW5kZWZpbmVkLCB7ZGVoeWRyYXRlZFZpZXd9KTtcbiAgICAgICAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgICAgICAgbENvbnRhaW5lckZvckVtcHR5LCBlbWJlZGRlZExWaWV3LCAwLFxuICAgICAgICAgICAgICBzaG91bGRBZGRWaWV3VG9Eb20oZW1wdHlUZW1wbGF0ZVROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lckZvckVtcHR5LCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldExDb250YWluZXIobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyKTogTENvbnRhaW5lciB7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tpbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIHJldHVybiBsQ29udGFpbmVyO1xufVxuXG5mdW5jdGlvbiBkZXRhY2hFeGlzdGluZ1ZpZXc8VD4obENvbnRhaW5lcjogTENvbnRhaW5lciwgaW5kZXg6IG51bWJlcik6IExWaWV3PFQ+IHtcbiAgY29uc3QgZXhpc3RpbmdMVmlldyA9IGRldGFjaFZpZXcobENvbnRhaW5lciwgaW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoZXhpc3RpbmdMVmlldyk7XG5cbiAgcmV0dXJuIGV4aXN0aW5nTFZpZXcgYXMgTFZpZXc8VD47XG59XG5cbmZ1bmN0aW9uIGdldEV4aXN0aW5nTFZpZXdGcm9tTENvbnRhaW5lcjxUPihsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKTogTFZpZXc8VD4ge1xuICBjb25zdCBleGlzdGluZ0xWaWV3ID0gZ2V0TFZpZXdGcm9tTENvbnRhaW5lcjxUPihsQ29udGFpbmVyLCBpbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhleGlzdGluZ0xWaWV3KTtcblxuICByZXR1cm4gZXhpc3RpbmdMVmlldyE7XG59XG5cbmZ1bmN0aW9uIGdldEV4aXN0aW5nVE5vZGUodFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyKTogVE5vZGUge1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKHRWaWV3LCBpbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZSh0Tm9kZSk7XG5cbiAgcmV0dXJuIHROb2RlO1xufVxuIl19