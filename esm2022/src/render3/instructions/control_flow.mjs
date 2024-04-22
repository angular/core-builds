/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { setActiveConsumer } from '@angular/core/primitives/signals';
import { formatRuntimeError } from '../../errors';
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
 * @param matchingTemplateIndex Index of a template TNode representing a conditional view to be
 *     inserted; -1 represents a special case when there is no view to insert.
 * @param contextValue Value that should be exposed as the context of the conditional.
 * @codeGenApi
 */
export function ɵɵconditional(matchingTemplateIndex, contextValue) {
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
                const embeddedLView = createAndRenderEmbeddedLView(hostLView, templateTNode, contextValue, { dehydratedView });
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
            lView[CONTEXT] = contextValue;
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
function isViewExpensiveToRecreate(lView) {
    // assumption: anything more than a text node with a binding is considered "expensive"
    return lView.length - HEADER_OFFSET > 2;
}
class OperationsCounter {
    constructor() {
        this.created = 0;
        this.destroyed = 0;
    }
    reset() {
        this.created = 0;
        this.destroyed = 0;
    }
    recordCreate() {
        this.created++;
    }
    recordDestroy() {
        this.destroyed++;
    }
    /**
     * A method indicating if the entire collection was re-created as part of the reconciliation pass.
     * Used to warn developers about the usage of a tracking function that might result in excessive
     * amount of view creation / destroy operations.
     *
     * @returns boolean value indicating if a live collection was re-created
     */
    wasReCreated(collectionLen) {
        return collectionLen > 0 && this.created === this.destroyed && this.created === collectionLen;
    }
}
class LiveCollectionLContainerImpl extends LiveCollection {
    constructor(lContainer, hostLView, templateTNode) {
        super();
        this.lContainer = lContainer;
        this.hostLView = hostLView;
        this.templateTNode = templateTNode;
        this.operationsCounter = ngDevMode ? new OperationsCounter() : undefined;
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
        this.operationsCounter?.recordCreate();
        return embeddedLView;
    }
    destroy(lView) {
        destroyLView(lView[TVIEW], lView);
        this.operationsCounter?.recordDestroy();
    }
    updateValue(index, value) {
        this.getLView(index)[CONTEXT].$implicit = value;
    }
    reset() {
        this.needsIndexUpdate = false;
        this.operationsCounter?.reset();
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
        const containerIndex = metadataSlotIdx + 1;
        const lContainer = getLContainer(hostLView, containerIndex);
        if (metadata.liveCollection === undefined) {
            const itemTemplateTNode = getExistingTNode(hostTView, containerIndex);
            metadata.liveCollection =
                new LiveCollectionLContainerImpl(lContainer, hostLView, itemTemplateTNode);
        }
        else {
            metadata.liveCollection.reset();
        }
        const liveCollection = metadata.liveCollection;
        reconcile(liveCollection, collection, metadata.trackByFn);
        // Warn developers about situations where the entire collection was re-created as part of the
        // reconciliation pass. Note that this warning might be "overreacting" and report cases where
        // the collection re-creation is the intended behavior. Still, the assumption is that most of
        // the time it is undesired.
        if (ngDevMode && metadata.trackByFn === ɵɵrepeaterTrackByIdentity &&
            liveCollection.operationsCounter?.wasReCreated(liveCollection.length) &&
            isViewExpensiveToRecreate(getExistingLViewFromLContainer(lContainer, 0))) {
            const message = formatRuntimeError(956 /* RuntimeErrorCode.LOOP_TRACK_RECREATE */, `The configured tracking expression (track by identity) caused re-creation of the entire collection of size ${liveCollection.length}. ` +
                'This is an expensive operation requiring destruction and subsequent creation of DOM nodes, directives, components etc. ' +
                'Please review the "track expression" and make sure that it uniquely identifies items in a collection.');
            console.warn(message);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbF9mbG93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udHJvbF9mbG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBR25FLE9BQU8sRUFBQyxrQkFBa0IsRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFFbEUsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM5RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNyRSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyx1QkFBdUIsRUFBYSxNQUFNLHlCQUF5QixDQUFDO0FBRzVFLE9BQU8sRUFBQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBUyxLQUFLLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUN0SCxPQUFPLEVBQUMsY0FBYyxFQUFFLFNBQVMsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUQsT0FBTyxFQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsV0FBVyxFQUFFLFFB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VSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BELFNBQVMsSUFBSSxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFeEMsT0FBTyxhQUF5QixDQUFDO0FBQ25DLENBQUM7QUFFRCxTQUFTLDhCQUE4QixDQUFJLFVBQXNCLEVBQUUsS0FBYTtJQUM5RSxNQUFNLGFBQWEsR0FBRyxzQkFBc0IsQ0FBSSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbkUsU0FBUyxJQUFJLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUV4QyxPQUFPLGFBQWMsQ0FBQztBQUN4QixDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFZLEVBQUUsS0FBYTtJQUNuRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JDLFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFaEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7c2V0QWN0aXZlQ29uc3VtZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtUcmFja0J5RnVuY3Rpb259IGZyb20gJy4uLy4uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge0RlaHlkcmF0ZWRDb250YWluZXJWaWV3fSBmcm9tICcuLi8uLi9oeWRyYXRpb24vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3fSBmcm9tICcuLi8uLi9oeWRyYXRpb24vdmlld3MnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRGdW5jdGlvbn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi8uLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXcsIGFzc2VydFROb2RlfSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIERFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBIRUFERVJfT0ZGU0VULCBIWURSQVRJT04sIExWaWV3LCBUVklFVywgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge0xpdmVDb2xsZWN0aW9uLCByZWNvbmNpbGV9IGZyb20gJy4uL2xpc3RfcmVjb25jaWxpYXRpb24nO1xuaW1wb3J0IHtkZXN0cm95TFZpZXcsIGRldGFjaFZpZXd9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIGdldFRWaWV3LCBuZXh0QmluZGluZ0luZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7Z2V0Q29uc3RhbnQsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthZGRMVmlld1RvTENvbnRhaW5lciwgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldywgZ2V0TFZpZXdGcm9tTENvbnRhaW5lciwgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lciwgc2hvdWxkQWRkVmlld1RvRG9tfSBmcm9tICcuLi92aWV3X21hbmlwdWxhdGlvbic7XG5cbmltcG9ydCB7ZGVjbGFyZVRlbXBsYXRlfSBmcm9tICcuL3RlbXBsYXRlJztcblxuLyoqXG4gKiBUaGUgY29uZGl0aW9uYWwgaW5zdHJ1Y3Rpb24gcmVwcmVzZW50cyB0aGUgYmFzaWMgYnVpbGRpbmcgYmxvY2sgb24gdGhlIHJ1bnRpbWUgc2lkZSB0byBzdXBwb3J0XG4gKiBidWlsdC1pbiBcImlmXCIgYW5kIFwic3dpdGNoXCIuIE9uIHRoZSBoaWdoIGxldmVsIHRoaXMgaW5zdHJ1Y3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIGFkZGluZyBhbmRcbiAqIHJlbW92aW5nIHZpZXdzIHNlbGVjdGVkIGJ5IGEgY29uZGl0aW9uYWwgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gbWF0Y2hpbmdUZW1wbGF0ZUluZGV4IEluZGV4IG9mIGEgdGVtcGxhdGUgVE5vZGUgcmVwcmVzZW50aW5nIGEgY29uZGl0aW9uYWwgdmlldyB0byBiZVxuICogICAgIGluc2VydGVkOyAtMSByZXByZXNlbnRzIGEgc3BlY2lhbCBjYXNlIHdoZW4gdGhlcmUgaXMgbm8gdmlldyB0byBpbnNlcnQuXG4gKiBAcGFyYW0gY29udGV4dFZhbHVlIFZhbHVlIHRoYXQgc2hvdWxkIGJlIGV4cG9zZWQgYXMgdGhlIGNvbnRleHQgb2YgdGhlIGNvbmRpdGlvbmFsLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb25kaXRpb25hbDxUPihtYXRjaGluZ1RlbXBsYXRlSW5kZXg6IG51bWJlciwgY29udGV4dFZhbHVlPzogVCkge1xuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0NvbnRyb2xGbG93Jyk7XG5cbiAgY29uc3QgaG9zdExWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBjb25zdCBwcmV2TWF0Y2hpbmdUZW1wbGF0ZUluZGV4OiBudW1iZXIgPVxuICAgICAgaG9zdExWaWV3W2JpbmRpbmdJbmRleF0gIT09IE5PX0NIQU5HRSA/IGhvc3RMVmlld1tiaW5kaW5nSW5kZXhdIDogLTE7XG4gIGNvbnN0IHByZXZDb250YWluZXIgPSBwcmV2TWF0Y2hpbmdUZW1wbGF0ZUluZGV4ICE9PSAtMSA/XG4gICAgICBnZXRMQ29udGFpbmVyKGhvc3RMVmlldywgSEVBREVSX09GRlNFVCArIHByZXZNYXRjaGluZ1RlbXBsYXRlSW5kZXgpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgY29uc3Qgdmlld0luQ29udGFpbmVySWR4ID0gMDtcblxuICBpZiAoYmluZGluZ1VwZGF0ZWQoaG9zdExWaWV3LCBiaW5kaW5nSW5kZXgsIG1hdGNoaW5nVGVtcGxhdGVJbmRleCkpIHtcbiAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgLy8gVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHNob3cgY2hhbmdlZCAtIHJlbW92ZSB0aGUgcHJldmlvdXNseSBkaXNwbGF5ZWQgb25lXG4gICAgICAvLyAoaXQgaXMgYSBub29wIGlmIHRoZXJlIGFyZSBubyBhY3RpdmUgdmlld3MgaW4gYSBjb250YWluZXIpLlxuICAgICAgaWYgKHByZXZDb250YWluZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZW1vdmVMVmlld0Zyb21MQ29udGFpbmVyKHByZXZDb250YWluZXIsIHZpZXdJbkNvbnRhaW5lcklkeCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluZGV4IC0xIGlzIGEgc3BlY2lhbCBjYXNlIHdoZXJlIG5vbmUgb2YgdGhlIGNvbmRpdGlvbnMgZXZhbHVhdGVzIHRvXG4gICAgICAvLyBhIHRydXRoeSB2YWx1ZSBhbmQgYXMgdGhlIGNvbnNlcXVlbmNlIHdlJ3ZlIGdvdCBubyB2aWV3IHRvIHNob3cuXG4gICAgICBpZiAobWF0Y2hpbmdUZW1wbGF0ZUluZGV4ICE9PSAtMSkge1xuICAgICAgICBjb25zdCBuZXh0TENvbnRhaW5lckluZGV4ID0gSEVBREVSX09GRlNFVCArIG1hdGNoaW5nVGVtcGxhdGVJbmRleDtcbiAgICAgICAgY29uc3QgbmV4dENvbnRhaW5lciA9IGdldExDb250YWluZXIoaG9zdExWaWV3LCBuZXh0TENvbnRhaW5lckluZGV4KTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVUTm9kZSA9IGdldEV4aXN0aW5nVE5vZGUoaG9zdExWaWV3W1RWSUVXXSwgbmV4dExDb250YWluZXJJbmRleCk7XG5cbiAgICAgICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPVxuICAgICAgICAgICAgZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcobmV4dENvbnRhaW5lciwgdGVtcGxhdGVUTm9kZS50VmlldyEuc3NySWQpO1xuICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID1cbiAgICAgICAgICAgIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoaG9zdExWaWV3LCB0ZW1wbGF0ZVROb2RlLCBjb250ZXh0VmFsdWUsIHtkZWh5ZHJhdGVkVmlld30pO1xuXG4gICAgICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICAgICAgbmV4dENvbnRhaW5lciwgZW1iZWRkZWRMVmlldywgdmlld0luQ29udGFpbmVySWR4LFxuICAgICAgICAgICAgc2hvdWxkQWRkVmlld1RvRG9tKHRlbXBsYXRlVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHByZXZDb250YWluZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFdlIG1pZ2h0IGtlZXAgZGlzcGxheWluZyB0aGUgc2FtZSB0ZW1wbGF0ZSBidXQgdGhlIGFjdHVhbCB2YWx1ZSBvZiB0aGUgZXhwcmVzc2lvbiBjb3VsZCBoYXZlXG4gICAgLy8gY2hhbmdlZCAtIHJlLWJpbmQgaW4gY29udGV4dC5cbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3RnJvbUxDb250YWluZXI8VHx1bmRlZmluZWQ+KHByZXZDb250YWluZXIsIHZpZXdJbkNvbnRhaW5lcklkeCk7XG4gICAgaWYgKGxWaWV3ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxWaWV3W0NPTlRFWFRdID0gY29udGV4dFZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVwZWF0ZXJDb250ZXh0PFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBwdWJsaWMgJGltcGxpY2l0OiBULCBwdWJsaWMgJGluZGV4OiBudW1iZXIpIHt9XG5cbiAgZ2V0ICRjb3VudCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmxDb250YWluZXIubGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGJ1aWx0LWluIHRyYWNrQnkgZnVuY3Rpb24gdXNlZCBmb3Igc2l0dWF0aW9ucyB3aGVyZSB1c2VycyBzcGVjaWZpZWQgY29sbGVjdGlvbiBpbmRleCBhcyBhXG4gKiB0cmFja2luZyBleHByZXNzaW9uLiBIYXZpbmcgdGhpcyBmdW5jdGlvbiBib2R5IGluIHRoZSBydW50aW1lIGF2b2lkcyB1bm5lY2Vzc2FyeSBjb2RlIGdlbmVyYXRpb24uXG4gKlxuICogQHBhcmFtIGluZGV4XG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlcGVhdGVyVHJhY2tCeUluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIEEgYnVpbHQtaW4gdHJhY2tCeSBmdW5jdGlvbiB1c2VkIGZvciBzaXR1YXRpb25zIHdoZXJlIHVzZXJzIHNwZWNpZmllZCBjb2xsZWN0aW9uIGl0ZW0gcmVmZXJlbmNlXG4gKiBhcyBhIHRyYWNraW5nIGV4cHJlc3Npb24uIEhhdmluZyB0aGlzIGZ1bmN0aW9uIGJvZHkgaW4gdGhlIHJ1bnRpbWUgYXZvaWRzIHVubmVjZXNzYXJ5IGNvZGVcbiAqIGdlbmVyYXRpb24uXG4gKlxuICogQHBhcmFtIGluZGV4XG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlcGVhdGVyVHJhY2tCeUlkZW50aXR5PFQ+KF86IG51bWJlciwgdmFsdWU6IFQpIHtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5jbGFzcyBSZXBlYXRlck1ldGFkYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaGFzRW1wdHlCbG9jazogYm9vbGVhbiwgcHVibGljIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPHVua25vd24+LFxuICAgICAgcHVibGljIGxpdmVDb2xsZWN0aW9uPzogTGl2ZUNvbGxlY3Rpb25MQ29udGFpbmVySW1wbCkge31cbn1cblxuLyoqXG4gKiBUaGUgcmVwZWF0ZXJDcmVhdGUgaW5zdHJ1Y3Rpb24gcnVucyBpbiB0aGUgY3JlYXRpb24gcGFydCBvZiB0aGUgdGVtcGxhdGUgcGFzcyBhbmQgaW5pdGlhbGl6ZXNcbiAqIGludGVybmFsIGRhdGEgc3RydWN0dXJlcyByZXF1aXJlZCBieSB0aGUgdXBkYXRlIHBhc3Mgb2YgdGhlIGJ1aWx0LWluIHJlcGVhdGVyIGxvZ2ljLiBSZXBlYXRlclxuICogbWV0YWRhdGEgYXJlIGFsbG9jYXRlZCBpbiB0aGUgZGF0YSBwYXJ0IG9mIExWaWV3IHdpdGggdGhlIGZvbGxvd2luZyBsYXlvdXQ6XG4gKiAtIExWaWV3W0hFQURFUl9PRkZTRVQgKyBpbmRleF0gLSBtZXRhZGF0YVxuICogLSBMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXggKyAxXSAtIHJlZmVyZW5jZSB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIHJlbmRlcmluZyBhbiBpdGVtXG4gKiAtIExWaWV3W0hFQURFUl9PRkZTRVQgKyBpbmRleCArIDJdIC0gb3B0aW9uYWwgcmVmZXJlbmNlIHRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gcmVuZGVyaW5nIGFuIGVtcHR5XG4gKiBibG9ja1xuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBhdCB3aGljaCB0byBzdG9yZSB0aGUgbWV0YWRhdGEgb2YgdGhlIHJlcGVhdGVyLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gUmVmZXJlbmNlIHRvIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgbWFpbiByZXBlYXRlciBibG9jay5cbiAqIEBwYXJhbSBkZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoZSBtYWluIGJsb2NrLlxuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhlIG1haW4gYmxvY2suXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRyc0luZGV4IEluZGV4IG9mIHRlbXBsYXRlIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIHRyYWNrQnlGbiBSZWZlcmVuY2UgdG8gdGhlIHRyYWNraW5nIGZ1bmN0aW9uLlxuICogQHBhcmFtIHRyYWNrQnlVc2VzQ29tcG9uZW50SW5zdGFuY2UgV2hldGhlciB0aGUgdHJhY2tpbmcgZnVuY3Rpb24gaGFzIGFueSByZWZlcmVuY2VzIHRvIHRoZVxuICogIGNvbXBvbmVudCBpbnN0YW5jZS4gSWYgaXQgZG9lc24ndCwgd2UgY2FuIGF2b2lkIHJlYmluZGluZyBpdC5cbiAqIEBwYXJhbSBlbXB0eVRlbXBsYXRlRm4gUmVmZXJlbmNlIHRvIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBvZiB0aGUgZW1wdHkgYmxvY2suXG4gKiBAcGFyYW0gZW1wdHlEZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoZSBlbXB0eSBibG9jay5cbiAqIEBwYXJhbSBlbXB0eVZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhlIGVtcHR5IGJsb2NrLlxuICogQHBhcmFtIGVtcHR5VGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgZW1wdHkgYmxvY2sgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBlbXB0eUF0dHJzSW5kZXggSW5kZXggb2YgdGhlIGVtcHR5IGJsb2NrIHRlbXBsYXRlIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVwZWF0ZXJDcmVhdGUoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8dW5rbm93bj4sIGRlY2xzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnNJbmRleDogbnVtYmVyfG51bGwsIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPHVua25vd24+LFxuICAgIHRyYWNrQnlVc2VzQ29tcG9uZW50SW5zdGFuY2U/OiBib29sZWFuLCBlbXB0eVRlbXBsYXRlRm4/OiBDb21wb25lbnRUZW1wbGF0ZTx1bmtub3duPixcbiAgICBlbXB0eURlY2xzPzogbnVtYmVyLCBlbXB0eVZhcnM/OiBudW1iZXIsIGVtcHR5VGFnTmFtZT86IHN0cmluZ3xudWxsLFxuICAgIGVtcHR5QXR0cnNJbmRleD86IG51bWJlcnxudWxsKTogdm9pZCB7XG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nQ29udHJvbEZsb3cnKTtcblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEZ1bmN0aW9uKFxuICAgICAgICAgIHRyYWNrQnlGbiwgYEEgdHJhY2sgZXhwcmVzc2lvbiBtdXN0IGJlIGEgZnVuY3Rpb24sIHdhcyAke3R5cGVvZiB0cmFja0J5Rm59IGluc3RlYWQuYCk7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IGhhc0VtcHR5QmxvY2sgPSBlbXB0eVRlbXBsYXRlRm4gIT09IHVuZGVmaW5lZDtcbiAgY29uc3QgaG9zdExWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYm91bmRUcmFja0J5ID0gdHJhY2tCeVVzZXNDb21wb25lbnRJbnN0YW5jZSA/XG4gICAgICAvLyBXZSBvbmx5IHdhbnQgdG8gYmluZCB3aGVuIG5lY2Vzc2FyeSwgYmVjYXVzZSBpdCBwcm9kdWNlcyBhXG4gICAgICAvLyBuZXcgZnVuY3Rpb24uIEZvciBwdXJlIGZ1bmN0aW9ucyBpdCdzIG5vdCBuZWNlc3NhcnkuXG4gICAgICB0cmFja0J5Rm4uYmluZChob3N0TFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddW0NPTlRFWFRdKSA6XG4gICAgICB0cmFja0J5Rm47XG4gIGNvbnN0IG1ldGFkYXRhID0gbmV3IFJlcGVhdGVyTWV0YWRhdGEoaGFzRW1wdHlCbG9jaywgYm91bmRUcmFja0J5KTtcbiAgaG9zdExWaWV3W0hFQURFUl9PRkZTRVQgKyBpbmRleF0gPSBtZXRhZGF0YTtcblxuICBkZWNsYXJlVGVtcGxhdGUoXG4gICAgICBsVmlldywgdFZpZXcsIGluZGV4ICsgMSwgdGVtcGxhdGVGbiwgZGVjbHMsIHZhcnMsIHRhZ05hbWUsXG4gICAgICBnZXRDb25zdGFudCh0Vmlldy5jb25zdHMsIGF0dHJzSW5kZXgpKTtcblxuICBpZiAoaGFzRW1wdHlCbG9jaykge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKGVtcHR5RGVjbHMsICdNaXNzaW5nIG51bWJlciBvZiBkZWNsYXJhdGlvbnMgZm9yIHRoZSBlbXB0eSByZXBlYXRlciBibG9jay4nKTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChlbXB0eVZhcnMsICdNaXNzaW5nIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhlIGVtcHR5IHJlcGVhdGVyIGJsb2NrLicpO1xuXG4gICAgZGVjbGFyZVRlbXBsYXRlKFxuICAgICAgICBsVmlldywgdFZpZXcsIGluZGV4ICsgMiwgZW1wdHlUZW1wbGF0ZUZuLCBlbXB0eURlY2xzISwgZW1wdHlWYXJzISwgZW1wdHlUYWdOYW1lLFxuICAgICAgICBnZXRDb25zdGFudCh0Vmlldy5jb25zdHMsIGVtcHR5QXR0cnNJbmRleCkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzVmlld0V4cGVuc2l2ZVRvUmVjcmVhdGUobFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIC8vIGFzc3VtcHRpb246IGFueXRoaW5nIG1vcmUgdGhhbiBhIHRleHQgbm9kZSB3aXRoIGEgYmluZGluZyBpcyBjb25zaWRlcmVkIFwiZXhwZW5zaXZlXCJcbiAgcmV0dXJuIGxWaWV3Lmxlbmd0aCAtIEhFQURFUl9PRkZTRVQgPiAyO1xufVxuXG5jbGFzcyBPcGVyYXRpb25zQ291bnRlciB7XG4gIGNyZWF0ZWQgPSAwO1xuICBkZXN0cm95ZWQgPSAwO1xuXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuY3JlYXRlZCA9IDA7XG4gICAgdGhpcy5kZXN0cm95ZWQgPSAwO1xuICB9XG5cbiAgcmVjb3JkQ3JlYXRlKCkge1xuICAgIHRoaXMuY3JlYXRlZCsrO1xuICB9XG5cbiAgcmVjb3JkRGVzdHJveSgpIHtcbiAgICB0aGlzLmRlc3Ryb3llZCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbWV0aG9kIGluZGljYXRpbmcgaWYgdGhlIGVudGlyZSBjb2xsZWN0aW9uIHdhcyByZS1jcmVhdGVkIGFzIHBhcnQgb2YgdGhlIHJlY29uY2lsaWF0aW9uIHBhc3MuXG4gICAqIFVzZWQgdG8gd2FybiBkZXZlbG9wZXJzIGFib3V0IHRoZSB1c2FnZSBvZiBhIHRyYWNraW5nIGZ1bmN0aW9uIHRoYXQgbWlnaHQgcmVzdWx0IGluIGV4Y2Vzc2l2ZVxuICAgKiBhbW91bnQgb2YgdmlldyBjcmVhdGlvbiAvIGRlc3Ryb3kgb3BlcmF0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgYm9vbGVhbiB2YWx1ZSBpbmRpY2F0aW5nIGlmIGEgbGl2ZSBjb2xsZWN0aW9uIHdhcyByZS1jcmVhdGVkXG4gICAqL1xuICB3YXNSZUNyZWF0ZWQoY29sbGVjdGlvbkxlbjogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb25MZW4gPiAwICYmIHRoaXMuY3JlYXRlZCA9PT0gdGhpcy5kZXN0cm95ZWQgJiYgdGhpcy5jcmVhdGVkID09PSBjb2xsZWN0aW9uTGVuO1xuICB9XG59XG5cbmNsYXNzIExpdmVDb2xsZWN0aW9uTENvbnRhaW5lckltcGwgZXh0ZW5kc1xuICAgIExpdmVDb2xsZWN0aW9uPExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4sIHVua25vd24+IHtcbiAgb3BlcmF0aW9uc0NvdW50ZXIgPSBuZ0Rldk1vZGUgPyBuZXcgT3BlcmF0aW9uc0NvdW50ZXIoKSA6IHVuZGVmaW5lZDtcblxuICAvKipcbiAgIFByb3BlcnR5IGluZGljYXRpbmcgaWYgaW5kZXhlcyBpbiB0aGUgcmVwZWF0ZXIgY29udGV4dCBuZWVkIHRvIGJlIHVwZGF0ZWQgZm9sbG93aW5nIHRoZSBsaXZlXG4gICBjb2xsZWN0aW9uIGNoYW5nZXMuIEluZGV4IHVwZGF0ZXMgYXJlIG5lY2Vzc2FyeSBpZiBhbmQgb25seSBpZiB2aWV3cyBhcmUgaW5zZXJ0ZWQgLyByZW1vdmVkIGluXG4gICB0aGUgbWlkZGxlIG9mIExDb250YWluZXIuIEFkZHMgYW5kIHJlbW92YWxzIGF0IHRoZSBlbmQgZG9uJ3QgcmVxdWlyZSBpbmRleCB1cGRhdGVzLlxuICovXG4gIHByaXZhdGUgbmVlZHNJbmRleFVwZGF0ZSA9IGZhbHNlO1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcHJpdmF0ZSBob3N0TFZpZXc6IExWaWV3LCBwcml2YXRlIHRlbXBsYXRlVE5vZGU6IFROb2RlKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5sQ29udGFpbmVyLmxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUO1xuICB9XG4gIG92ZXJyaWRlIGF0KGluZGV4OiBudW1iZXIpOiB1bmtub3duIHtcbiAgICByZXR1cm4gdGhpcy5nZXRMVmlldyhpbmRleClbQ09OVEVYVF0uJGltcGxpY2l0O1xuICB9XG4gIG92ZXJyaWRlIGF0dGFjaChpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+Pik6IHZvaWQge1xuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID0gbFZpZXdbSFlEUkFUSU9OXSBhcyBEZWh5ZHJhdGVkQ29udGFpbmVyVmlldztcbiAgICB0aGlzLm5lZWRzSW5kZXhVcGRhdGUgfHw9IGluZGV4ICE9PSB0aGlzLmxlbmd0aDtcbiAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgdGhpcy5sQ29udGFpbmVyLCBsVmlldywgaW5kZXgsIHNob3VsZEFkZFZpZXdUb0RvbSh0aGlzLnRlbXBsYXRlVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gIH1cbiAgb3ZlcnJpZGUgZGV0YWNoKGluZGV4OiBudW1iZXIpOiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+IHtcbiAgICB0aGlzLm5lZWRzSW5kZXhVcGRhdGUgfHw9IGluZGV4ICE9PSB0aGlzLmxlbmd0aCAtIDE7XG4gICAgcmV0dXJuIGRldGFjaEV4aXN0aW5nVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+KHRoaXMubENvbnRhaW5lciwgaW5kZXgpO1xuICB9XG4gIG92ZXJyaWRlIGNyZWF0ZShpbmRleDogbnVtYmVyLCB2YWx1ZTogdW5rbm93bik6IExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4ge1xuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID1cbiAgICAgICAgZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcodGhpcy5sQ29udGFpbmVyLCB0aGlzLnRlbXBsYXRlVE5vZGUudFZpZXchLnNzcklkKTtcbiAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldyhcbiAgICAgICAgdGhpcy5ob3N0TFZpZXcsIHRoaXMudGVtcGxhdGVUTm9kZSwgbmV3IFJlcGVhdGVyQ29udGV4dCh0aGlzLmxDb250YWluZXIsIHZhbHVlLCBpbmRleCksXG4gICAgICAgIHtkZWh5ZHJhdGVkVmlld30pO1xuICAgIHRoaXMub3BlcmF0aW9uc0NvdW50ZXI/LnJlY29yZENyZWF0ZSgpO1xuXG4gICAgcmV0dXJuIGVtYmVkZGVkTFZpZXc7XG4gIH1cbiAgb3ZlcnJpZGUgZGVzdHJveShsVmlldzogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+Pik6IHZvaWQge1xuICAgIGRlc3Ryb3lMVmlldyhsVmlld1tUVklFV10sIGxWaWV3KTtcbiAgICB0aGlzLm9wZXJhdGlvbnNDb3VudGVyPy5yZWNvcmREZXN0cm95KCk7XG4gIH1cbiAgb3ZlcnJpZGUgdXBkYXRlVmFsdWUoaW5kZXg6IG51bWJlciwgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLmdldExWaWV3KGluZGV4KVtDT05URVhUXS4kaW1wbGljaXQgPSB2YWx1ZTtcbiAgfVxuXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMubmVlZHNJbmRleFVwZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMub3BlcmF0aW9uc0NvdW50ZXI/LnJlc2V0KCk7XG4gIH1cblxuICB1cGRhdGVJbmRleGVzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm5lZWRzSW5kZXhVcGRhdGUpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmdldExWaWV3KGkpW0NPTlRFWFRdLiRpbmRleCA9IGk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRMVmlldyhpbmRleDogbnVtYmVyKTogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+PiB7XG4gICAgcmV0dXJuIGdldEV4aXN0aW5nTFZpZXdGcm9tTENvbnRhaW5lcih0aGlzLmxDb250YWluZXIsIGluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSByZXBlYXRlciBpbnN0cnVjdGlvbiBkb2VzIHVwZGF0ZS10aW1lIGRpZmZpbmcgb2YgYSBwcm92aWRlZCBjb2xsZWN0aW9uIChhZ2FpbnN0IHRoZVxuICogY29sbGVjdGlvbiBzZWVuIHByZXZpb3VzbHkpIGFuZCBtYXBzIGNoYW5nZXMgaW4gdGhlIGNvbGxlY3Rpb24gdG8gdmlld3Mgc3RydWN0dXJlIChieSBhZGRpbmcsXG4gKiByZW1vdmluZyBvciBtb3Zpbmcgdmlld3MgYXMgbmVlZGVkKS5cbiAqIEBwYXJhbSBjb2xsZWN0aW9uIC0gdGhlIGNvbGxlY3Rpb24gaW5zdGFuY2UgdG8gYmUgY2hlY2tlZCBmb3IgY2hhbmdlc1xuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXBlYXRlcihjb2xsZWN0aW9uOiBJdGVyYWJsZTx1bmtub3duPnx1bmRlZmluZWR8bnVsbCk6IHZvaWQge1xuICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgY29uc3QgbWV0YWRhdGFTbG90SWR4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIGNvbnN0IGhvc3RMVmlldyA9IGdldExWaWV3KCk7XG4gICAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgICBjb25zdCBtZXRhZGF0YSA9IGhvc3RMVmlld1ttZXRhZGF0YVNsb3RJZHhdIGFzIFJlcGVhdGVyTWV0YWRhdGE7XG4gICAgY29uc3QgY29udGFpbmVySW5kZXggPSBtZXRhZGF0YVNsb3RJZHggKyAxO1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBnZXRMQ29udGFpbmVyKGhvc3RMVmlldywgY29udGFpbmVySW5kZXgpO1xuXG4gICAgaWYgKG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGl0ZW1UZW1wbGF0ZVROb2RlID0gZ2V0RXhpc3RpbmdUTm9kZShob3N0VFZpZXcsIGNvbnRhaW5lckluZGV4KTtcbiAgICAgIG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uID1cbiAgICAgICAgICBuZXcgTGl2ZUNvbGxlY3Rpb25MQ29udGFpbmVySW1wbChsQ29udGFpbmVyLCBob3N0TFZpZXcsIGl0ZW1UZW1wbGF0ZVROb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWV0YWRhdGEubGl2ZUNvbGxlY3Rpb24ucmVzZXQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXZlQ29sbGVjdGlvbiA9IG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uO1xuICAgIHJlY29uY2lsZShsaXZlQ29sbGVjdGlvbiwgY29sbGVjdGlvbiwgbWV0YWRhdGEudHJhY2tCeUZuKTtcblxuICAgIC8vIFdhcm4gZGV2ZWxvcGVycyBhYm91dCBzaXR1YXRpb25zIHdoZXJlIHRoZSBlbnRpcmUgY29sbGVjdGlvbiB3YXMgcmUtY3JlYXRlZCBhcyBwYXJ0IG9mIHRoZVxuICAgIC8vIHJlY29uY2lsaWF0aW9uIHBhc3MuIE5vdGUgdGhhdCB0aGlzIHdhcm5pbmcgbWlnaHQgYmUgXCJvdmVycmVhY3RpbmdcIiBhbmQgcmVwb3J0IGNhc2VzIHdoZXJlXG4gICAgLy8gdGhlIGNvbGxlY3Rpb24gcmUtY3JlYXRpb24gaXMgdGhlIGludGVuZGVkIGJlaGF2aW9yLiBTdGlsbCwgdGhlIGFzc3VtcHRpb24gaXMgdGhhdCBtb3N0IG9mXG4gICAgLy8gdGhlIHRpbWUgaXQgaXMgdW5kZXNpcmVkLlxuICAgIGlmIChuZ0Rldk1vZGUgJiYgbWV0YWRhdGEudHJhY2tCeUZuID09PSDJtcm1cmVwZWF0ZXJUcmFja0J5SWRlbnRpdHkgJiZcbiAgICAgICAgbGl2ZUNvbGxlY3Rpb24ub3BlcmF0aW9uc0NvdW50ZXI/Lndhc1JlQ3JlYXRlZChsaXZlQ29sbGVjdGlvbi5sZW5ndGgpICYmXG4gICAgICAgIGlzVmlld0V4cGVuc2l2ZVRvUmVjcmVhdGUoZ2V0RXhpc3RpbmdMVmlld0Zyb21MQ29udGFpbmVyKGxDb250YWluZXIsIDApKSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkxPT1BfVFJBQ0tfUkVDUkVBVEUsXG4gICAgICAgICAgYFRoZSBjb25maWd1cmVkIHRyYWNraW5nIGV4cHJlc3Npb24gKHRyYWNrIGJ5IGlkZW50aXR5KSBjYXVzZWQgcmUtY3JlYXRpb24gb2YgdGhlIGVudGlyZSBjb2xsZWN0aW9uIG9mIHNpemUgJHtcbiAgICAgICAgICAgICAgbGl2ZUNvbGxlY3Rpb24ubGVuZ3RofS4gYCArXG4gICAgICAgICAgICAgICdUaGlzIGlzIGFuIGV4cGVuc2l2ZSBvcGVyYXRpb24gcmVxdWlyaW5nIGRlc3RydWN0aW9uIGFuZCBzdWJzZXF1ZW50IGNyZWF0aW9uIG9mIERPTSBub2RlcywgZGlyZWN0aXZlcywgY29tcG9uZW50cyBldGMuICcgK1xuICAgICAgICAgICAgICAnUGxlYXNlIHJldmlldyB0aGUgXCJ0cmFjayBleHByZXNzaW9uXCIgYW5kIG1ha2Ugc3VyZSB0aGF0IGl0IHVuaXF1ZWx5IGlkZW50aWZpZXMgaXRlbXMgaW4gYSBjb2xsZWN0aW9uLicpO1xuICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8vIG1vdmVzIGluIHRoZSBjb250YWluZXIgbWlnaHQgY2F1c2VkIGNvbnRleHQncyBpbmRleCB0byBnZXQgb3V0IG9mIG9yZGVyLCByZS1hZGp1c3QgaWYgbmVlZGVkXG4gICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlSW5kZXhlcygpO1xuXG4gICAgLy8gaGFuZGxlIGVtcHR5IGJsb2Nrc1xuICAgIGlmIChtZXRhZGF0YS5oYXNFbXB0eUJsb2NrKSB7XG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gICAgICBjb25zdCBpc0NvbGxlY3Rpb25FbXB0eSA9IGxpdmVDb2xsZWN0aW9uLmxlbmd0aCA9PT0gMDtcbiAgICAgIGlmIChiaW5kaW5nVXBkYXRlZChob3N0TFZpZXcsIGJpbmRpbmdJbmRleCwgaXNDb2xsZWN0aW9uRW1wdHkpKSB7XG4gICAgICAgIGNvbnN0IGVtcHR5VGVtcGxhdGVJbmRleCA9IG1ldGFkYXRhU2xvdElkeCArIDI7XG4gICAgICAgIGNvbnN0IGxDb250YWluZXJGb3JFbXB0eSA9IGdldExDb250YWluZXIoaG9zdExWaWV3LCBlbXB0eVRlbXBsYXRlSW5kZXgpO1xuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uRW1wdHkpIHtcbiAgICAgICAgICBjb25zdCBlbXB0eVRlbXBsYXRlVE5vZGUgPSBnZXRFeGlzdGluZ1ROb2RlKGhvc3RUVmlldywgZW1wdHlUZW1wbGF0ZUluZGV4KTtcbiAgICAgICAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9XG4gICAgICAgICAgICAgIGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXJGb3JFbXB0eSwgZW1wdHlUZW1wbGF0ZVROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoXG4gICAgICAgICAgICAgIGhvc3RMVmlldywgZW1wdHlUZW1wbGF0ZVROb2RlLCB1bmRlZmluZWQsIHtkZWh5ZHJhdGVkVmlld30pO1xuICAgICAgICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICAgICAgICBsQ29udGFpbmVyRm9yRW1wdHksIGVtYmVkZGVkTFZpZXcsIDAsXG4gICAgICAgICAgICAgIHNob3VsZEFkZFZpZXdUb0RvbShlbXB0eVRlbXBsYXRlVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihsQ29udGFpbmVyRm9yRW1wdHksIDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TENvbnRhaW5lcihsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIpOiBMQ29udGFpbmVyIHtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2luZGV4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG5cbiAgcmV0dXJuIGxDb250YWluZXI7XG59XG5cbmZ1bmN0aW9uIGRldGFjaEV4aXN0aW5nVmlldzxUPihsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKTogTFZpZXc8VD4ge1xuICBjb25zdCBleGlzdGluZ0xWaWV3ID0gZGV0YWNoVmlldyhsQ29udGFpbmVyLCBpbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhleGlzdGluZ0xWaWV3KTtcblxuICByZXR1cm4gZXhpc3RpbmdMVmlldyBhcyBMVmlldzxUPjtcbn1cblxuZnVuY3Rpb24gZ2V0RXhpc3RpbmdMVmlld0Zyb21MQ29udGFpbmVyPFQ+KGxDb250YWluZXI6IExDb250YWluZXIsIGluZGV4OiBudW1iZXIpOiBMVmlldzxUPiB7XG4gIGNvbnN0IGV4aXN0aW5nTFZpZXcgPSBnZXRMVmlld0Zyb21MQ29udGFpbmVyPFQ+KGxDb250YWluZXIsIGluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGV4aXN0aW5nTFZpZXcpO1xuXG4gIHJldHVybiBleGlzdGluZ0xWaWV3ITtcbn1cblxuZnVuY3Rpb24gZ2V0RXhpc3RpbmdUTm9kZSh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIpOiBUTm9kZSB7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUodFZpZXcsIGluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlKHROb2RlKTtcblxuICByZXR1cm4gdE5vZGU7XG59XG4iXX0=