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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbF9mbG93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udHJvbF9mbG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBSW5FLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDckUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUMzQyxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUc1RSxPQUFPLEVBQUMsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQVMsS0FBSyxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDdEgsT0FBTyxFQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzlELE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsb0JB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QUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFZLEVBQUUsS0FBYTtJQUNuRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JDLFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFaEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7c2V0QWN0aXZlQ29uc3VtZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtUcmFja0J5RnVuY3Rpb259IGZyb20gJy4uLy4uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtEZWh5ZHJhdGVkQ29udGFpbmVyVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3ZpZXdzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RnVuY3Rpb259IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3LCBhc3NlcnRUTm9kZX0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGV9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgSEVBREVSX09GRlNFVCwgSFlEUkFUSU9OLCBMVmlldywgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtMaXZlQ29sbGVjdGlvbiwgcmVjb25jaWxlfSBmcm9tICcuLi9saXN0X3JlY29uY2lsaWF0aW9uJztcbmltcG9ydCB7ZGVzdHJveUxWaWV3LCBkZXRhY2hWaWV3fSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldExWaWV3LCBnZXRTZWxlY3RlZEluZGV4LCBnZXRUVmlldywgbmV4dEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldENvbnN0YW50LCBnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YWRkTFZpZXdUb0xDb250YWluZXIsIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcsIGdldExWaWV3RnJvbUxDb250YWluZXIsIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIsIHNob3VsZEFkZFZpZXdUb0RvbX0gZnJvbSAnLi4vdmlld19tYW5pcHVsYXRpb24nO1xuXG5pbXBvcnQge2RlY2xhcmVUZW1wbGF0ZX0gZnJvbSAnLi90ZW1wbGF0ZSc7XG5cbi8qKlxuICogVGhlIGNvbmRpdGlvbmFsIGluc3RydWN0aW9uIHJlcHJlc2VudHMgdGhlIGJhc2ljIGJ1aWxkaW5nIGJsb2NrIG9uIHRoZSBydW50aW1lIHNpZGUgdG8gc3VwcG9ydFxuICogYnVpbHQtaW4gXCJpZlwiIGFuZCBcInN3aXRjaFwiLiBPbiB0aGUgaGlnaCBsZXZlbCB0aGlzIGluc3RydWN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBhZGRpbmcgYW5kXG4gKiByZW1vdmluZyB2aWV3cyBzZWxlY3RlZCBieSBhIGNvbmRpdGlvbmFsIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIG1hdGNoaW5nVGVtcGxhdGVJbmRleCBJbmRleCBvZiBhIHRlbXBsYXRlIFROb2RlIHJlcHJlc2VudGluZyBhIGNvbmRpdGlvbmFsIHZpZXcgdG8gYmVcbiAqICAgICBpbnNlcnRlZDsgLTEgcmVwcmVzZW50cyBhIHNwZWNpYWwgY2FzZSB3aGVuIHRoZXJlIGlzIG5vIHZpZXcgdG8gaW5zZXJ0LlxuICogQHBhcmFtIGNvbnRleHRWYWx1ZSBWYWx1ZSB0aGF0IHNob3VsZCBiZSBleHBvc2VkIGFzIHRoZSBjb250ZXh0IG9mIHRoZSBjb25kaXRpb25hbC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29uZGl0aW9uYWw8VD4obWF0Y2hpbmdUZW1wbGF0ZUluZGV4OiBudW1iZXIsIGNvbnRleHRWYWx1ZT86IFQpIHtcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdDb250cm9sRmxvdycpO1xuXG4gIGNvbnN0IGhvc3RMVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgY29uc3QgcHJldk1hdGNoaW5nVGVtcGxhdGVJbmRleDogbnVtYmVyID1cbiAgICAgIGhvc3RMVmlld1tiaW5kaW5nSW5kZXhdICE9PSBOT19DSEFOR0UgPyBob3N0TFZpZXdbYmluZGluZ0luZGV4XSA6IC0xO1xuICBjb25zdCBwcmV2Q29udGFpbmVyID0gcHJldk1hdGNoaW5nVGVtcGxhdGVJbmRleCAhPT0gLTEgP1xuICAgICAgZ2V0TENvbnRhaW5lcihob3N0TFZpZXcsIEhFQURFUl9PRkZTRVQgKyBwcmV2TWF0Y2hpbmdUZW1wbGF0ZUluZGV4KSA6XG4gICAgICB1bmRlZmluZWQ7XG4gIGNvbnN0IHZpZXdJbkNvbnRhaW5lcklkeCA9IDA7XG5cbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGhvc3RMVmlldywgYmluZGluZ0luZGV4LCBtYXRjaGluZ1RlbXBsYXRlSW5kZXgpKSB7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBzaG93IGNoYW5nZWQgLSByZW1vdmUgdGhlIHByZXZpb3VzbHkgZGlzcGxheWVkIG9uZVxuICAgICAgLy8gKGl0IGlzIGEgbm9vcCBpZiB0aGVyZSBhcmUgbm8gYWN0aXZlIHZpZXdzIGluIGEgY29udGFpbmVyKS5cbiAgICAgIGlmIChwcmV2Q29udGFpbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihwcmV2Q29udGFpbmVyLCB2aWV3SW5Db250YWluZXJJZHgpO1xuICAgICAgfVxuXG4gICAgICAvLyBJbmRleCAtMSBpcyBhIHNwZWNpYWwgY2FzZSB3aGVyZSBub25lIG9mIHRoZSBjb25kaXRpb25zIGV2YWx1YXRlcyB0b1xuICAgICAgLy8gYSB0cnV0aHkgdmFsdWUgYW5kIGFzIHRoZSBjb25zZXF1ZW5jZSB3ZSd2ZSBnb3Qgbm8gdmlldyB0byBzaG93LlxuICAgICAgaWYgKG1hdGNoaW5nVGVtcGxhdGVJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgbmV4dExDb250YWluZXJJbmRleCA9IEhFQURFUl9PRkZTRVQgKyBtYXRjaGluZ1RlbXBsYXRlSW5kZXg7XG4gICAgICAgIGNvbnN0IG5leHRDb250YWluZXIgPSBnZXRMQ29udGFpbmVyKGhvc3RMVmlldywgbmV4dExDb250YWluZXJJbmRleCk7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlVE5vZGUgPSBnZXRFeGlzdGluZ1ROb2RlKGhvc3RMVmlld1tUVklFV10sIG5leHRMQ29udGFpbmVySW5kZXgpO1xuXG4gICAgICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID1cbiAgICAgICAgICAgIGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KG5leHRDb250YWluZXIsIHRlbXBsYXRlVE5vZGUudFZpZXchLnNzcklkKTtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9XG4gICAgICAgICAgICBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KGhvc3RMVmlldywgdGVtcGxhdGVUTm9kZSwgY29udGV4dFZhbHVlLCB7ZGVoeWRyYXRlZFZpZXd9KTtcblxuICAgICAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgICAgIG5leHRDb250YWluZXIsIGVtYmVkZGVkTFZpZXcsIHZpZXdJbkNvbnRhaW5lcklkeCxcbiAgICAgICAgICAgIHNob3VsZEFkZFZpZXdUb0RvbSh0ZW1wbGF0ZVROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChwcmV2Q29udGFpbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBXZSBtaWdodCBrZWVwIGRpc3BsYXlpbmcgdGhlIHNhbWUgdGVtcGxhdGUgYnV0IHRoZSBhY3R1YWwgdmFsdWUgb2YgdGhlIGV4cHJlc3Npb24gY291bGQgaGF2ZVxuICAgIC8vIGNoYW5nZWQgLSByZS1iaW5kIGluIGNvbnRleHQuXG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlld0Zyb21MQ29udGFpbmVyPFR8dW5kZWZpbmVkPihwcmV2Q29udGFpbmVyLCB2aWV3SW5Db250YWluZXJJZHgpO1xuICAgIGlmIChsVmlldyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsVmlld1tDT05URVhUXSA9IGNvbnRleHRWYWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlcGVhdGVyQ29udGV4dDxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcHVibGljICRpbXBsaWNpdDogVCwgcHVibGljICRpbmRleDogbnVtYmVyKSB7fVxuXG4gIGdldCAkY291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5sQ29udGFpbmVyLmxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUO1xuICB9XG59XG5cbi8qKlxuICogQSBidWlsdC1pbiB0cmFja0J5IGZ1bmN0aW9uIHVzZWQgZm9yIHNpdHVhdGlvbnMgd2hlcmUgdXNlcnMgc3BlY2lmaWVkIGNvbGxlY3Rpb24gaW5kZXggYXMgYVxuICogdHJhY2tpbmcgZXhwcmVzc2lvbi4gSGF2aW5nIHRoaXMgZnVuY3Rpb24gYm9keSBpbiB0aGUgcnVudGltZSBhdm9pZHMgdW5uZWNlc3NhcnkgY29kZSBnZW5lcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBpbmRleFxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXBlYXRlclRyYWNrQnlJbmRleChpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXG4gKiBBIGJ1aWx0LWluIHRyYWNrQnkgZnVuY3Rpb24gdXNlZCBmb3Igc2l0dWF0aW9ucyB3aGVyZSB1c2VycyBzcGVjaWZpZWQgY29sbGVjdGlvbiBpdGVtIHJlZmVyZW5jZVxuICogYXMgYSB0cmFja2luZyBleHByZXNzaW9uLiBIYXZpbmcgdGhpcyBmdW5jdGlvbiBib2R5IGluIHRoZSBydW50aW1lIGF2b2lkcyB1bm5lY2Vzc2FyeSBjb2RlXG4gKiBnZW5lcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBpbmRleFxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXBlYXRlclRyYWNrQnlJZGVudGl0eTxUPihfOiBudW1iZXIsIHZhbHVlOiBUKSB7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuY2xhc3MgUmVwZWF0ZXJNZXRhZGF0YSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGhhc0VtcHR5QmxvY2s6IGJvb2xlYW4sIHB1YmxpYyB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjx1bmtub3duPixcbiAgICAgIHB1YmxpYyBsaXZlQ29sbGVjdGlvbj86IExpdmVDb2xsZWN0aW9uTENvbnRhaW5lckltcGwpIHt9XG59XG5cbi8qKlxuICogVGhlIHJlcGVhdGVyQ3JlYXRlIGluc3RydWN0aW9uIHJ1bnMgaW4gdGhlIGNyZWF0aW9uIHBhcnQgb2YgdGhlIHRlbXBsYXRlIHBhc3MgYW5kIGluaXRpYWxpemVzXG4gKiBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgcmVxdWlyZWQgYnkgdGhlIHVwZGF0ZSBwYXNzIG9mIHRoZSBidWlsdC1pbiByZXBlYXRlciBsb2dpYy4gUmVwZWF0ZXJcbiAqIG1ldGFkYXRhIGFyZSBhbGxvY2F0ZWQgaW4gdGhlIGRhdGEgcGFydCBvZiBMVmlldyB3aXRoIHRoZSBmb2xsb3dpbmcgbGF5b3V0OlxuICogLSBMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXhdIC0gbWV0YWRhdGFcbiAqIC0gTFZpZXdbSEVBREVSX09GRlNFVCArIGluZGV4ICsgMV0gLSByZWZlcmVuY2UgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiByZW5kZXJpbmcgYW4gaXRlbVxuICogLSBMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXggKyAyXSAtIG9wdGlvbmFsIHJlZmVyZW5jZSB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIHJlbmRlcmluZyBhbiBlbXB0eVxuICogYmxvY2tcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggYXQgd2hpY2ggdG8gc3RvcmUgdGhlIG1ldGFkYXRhIG9mIHRoZSByZXBlYXRlci5cbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFJlZmVyZW5jZSB0byB0aGUgdGVtcGxhdGUgb2YgdGhlIG1haW4gcmVwZWF0ZXIgYmxvY2suXG4gKiBAcGFyYW0gZGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGUgbWFpbiBibG9jay5cbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoZSBtYWluIGJsb2NrLlxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0ZW1wbGF0ZSBhdHRyaWJ1dGVzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqIEBwYXJhbSB0cmFja0J5Rm4gUmVmZXJlbmNlIHRvIHRoZSB0cmFja2luZyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB0cmFja0J5VXNlc0NvbXBvbmVudEluc3RhbmNlIFdoZXRoZXIgdGhlIHRyYWNraW5nIGZ1bmN0aW9uIGhhcyBhbnkgcmVmZXJlbmNlcyB0byB0aGVcbiAqICBjb21wb25lbnQgaW5zdGFuY2UuIElmIGl0IGRvZXNuJ3QsIHdlIGNhbiBhdm9pZCByZWJpbmRpbmcgaXQuXG4gKiBAcGFyYW0gZW1wdHlUZW1wbGF0ZUZuIFJlZmVyZW5jZSB0byB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gb2YgdGhlIGVtcHR5IGJsb2NrLlxuICogQHBhcmFtIGVtcHR5RGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGUgZW1wdHkgYmxvY2suXG4gKiBAcGFyYW0gZW1wdHlWYXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoZSBlbXB0eSBibG9jay5cbiAqIEBwYXJhbSBlbXB0eVRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGVtcHR5IGJsb2NrIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gZW1wdHlBdHRyc0luZGV4IEluZGV4IG9mIHRoZSBlbXB0eSBibG9jayB0ZW1wbGF0ZSBhdHRyaWJ1dGVzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlcGVhdGVyQ3JlYXRlKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHVua25vd24+LCBkZWNsczogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzSW5kZXg6IG51bWJlcnxudWxsLCB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjx1bmtub3duPixcbiAgICB0cmFja0J5VXNlc0NvbXBvbmVudEluc3RhbmNlPzogYm9vbGVhbiwgZW1wdHlUZW1wbGF0ZUZuPzogQ29tcG9uZW50VGVtcGxhdGU8dW5rbm93bj4sXG4gICAgZW1wdHlEZWNscz86IG51bWJlciwgZW1wdHlWYXJzPzogbnVtYmVyLCBlbXB0eVRhZ05hbWU/OiBzdHJpbmd8bnVsbCxcbiAgICBlbXB0eUF0dHJzSW5kZXg/OiBudW1iZXJ8bnVsbCk6IHZvaWQge1xuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0NvbnRyb2xGbG93Jyk7XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRGdW5jdGlvbihcbiAgICAgICAgICB0cmFja0J5Rm4sIGBBIHRyYWNrIGV4cHJlc3Npb24gbXVzdCBiZSBhIGZ1bmN0aW9uLCB3YXMgJHt0eXBlb2YgdHJhY2tCeUZufSBpbnN0ZWFkLmApO1xuXG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBoYXNFbXB0eUJsb2NrID0gZW1wdHlUZW1wbGF0ZUZuICE9PSB1bmRlZmluZWQ7XG4gIGNvbnN0IGhvc3RMVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJvdW5kVHJhY2tCeSA9IHRyYWNrQnlVc2VzQ29tcG9uZW50SW5zdGFuY2UgP1xuICAgICAgLy8gV2Ugb25seSB3YW50IHRvIGJpbmQgd2hlbiBuZWNlc3NhcnksIGJlY2F1c2UgaXQgcHJvZHVjZXMgYVxuICAgICAgLy8gbmV3IGZ1bmN0aW9uLiBGb3IgcHVyZSBmdW5jdGlvbnMgaXQncyBub3QgbmVjZXNzYXJ5LlxuICAgICAgdHJhY2tCeUZuLmJpbmQoaG9zdExWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXVtDT05URVhUXSkgOlxuICAgICAgdHJhY2tCeUZuO1xuICBjb25zdCBtZXRhZGF0YSA9IG5ldyBSZXBlYXRlck1ldGFkYXRhKGhhc0VtcHR5QmxvY2ssIGJvdW5kVHJhY2tCeSk7XG4gIGhvc3RMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXhdID0gbWV0YWRhdGE7XG5cbiAgZGVjbGFyZVRlbXBsYXRlKFxuICAgICAgbFZpZXcsIHRWaWV3LCBpbmRleCArIDEsIHRlbXBsYXRlRm4sIGRlY2xzLCB2YXJzLCB0YWdOYW1lLFxuICAgICAgZ2V0Q29uc3RhbnQodFZpZXcuY29uc3RzLCBhdHRyc0luZGV4KSk7XG5cbiAgaWYgKGhhc0VtcHR5QmxvY2spIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChlbXB0eURlY2xzLCAnTWlzc2luZyBudW1iZXIgb2YgZGVjbGFyYXRpb25zIGZvciB0aGUgZW1wdHkgcmVwZWF0ZXIgYmxvY2suJyk7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoZW1wdHlWYXJzLCAnTWlzc2luZyBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoZSBlbXB0eSByZXBlYXRlciBibG9jay4nKTtcblxuICAgIGRlY2xhcmVUZW1wbGF0ZShcbiAgICAgICAgbFZpZXcsIHRWaWV3LCBpbmRleCArIDIsIGVtcHR5VGVtcGxhdGVGbiwgZW1wdHlEZWNscyEsIGVtcHR5VmFycyEsIGVtcHR5VGFnTmFtZSxcbiAgICAgICAgZ2V0Q29uc3RhbnQodFZpZXcuY29uc3RzLCBlbXB0eUF0dHJzSW5kZXgpKTtcbiAgfVxufVxuXG5jbGFzcyBMaXZlQ29sbGVjdGlvbkxDb250YWluZXJJbXBsIGV4dGVuZHNcbiAgICBMaXZlQ29sbGVjdGlvbjxMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+LCB1bmtub3duPiB7XG4gIC8qKlxuICAgUHJvcGVydHkgaW5kaWNhdGluZyBpZiBpbmRleGVzIGluIHRoZSByZXBlYXRlciBjb250ZXh0IG5lZWQgdG8gYmUgdXBkYXRlZCBmb2xsb3dpbmcgdGhlIGxpdmVcbiAgIGNvbGxlY3Rpb24gY2hhbmdlcy4gSW5kZXggdXBkYXRlcyBhcmUgbmVjZXNzYXJ5IGlmIGFuZCBvbmx5IGlmIHZpZXdzIGFyZSBpbnNlcnRlZCAvIHJlbW92ZWQgaW5cbiAgIHRoZSBtaWRkbGUgb2YgTENvbnRhaW5lci4gQWRkcyBhbmQgcmVtb3ZhbHMgYXQgdGhlIGVuZCBkb24ndCByZXF1aXJlIGluZGV4IHVwZGF0ZXMuXG4gKi9cbiAgcHJpdmF0ZSBuZWVkc0luZGV4VXBkYXRlID0gZmFsc2U7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBwcml2YXRlIGhvc3RMVmlldzogTFZpZXcsIHByaXZhdGUgdGVtcGxhdGVUTm9kZTogVE5vZGUpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb3ZlcnJpZGUgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmxDb250YWluZXIubGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7XG4gIH1cbiAgb3ZlcnJpZGUgYXQoaW5kZXg6IG51bWJlcik6IHVua25vd24ge1xuICAgIHJldHVybiB0aGlzLmdldExWaWV3KGluZGV4KVtDT05URVhUXS4kaW1wbGljaXQ7XG4gIH1cbiAgb3ZlcnJpZGUgYXR0YWNoKGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+KTogdm9pZCB7XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPSBsVmlld1tIWURSQVRJT05dIGFzIERlaHlkcmF0ZWRDb250YWluZXJWaWV3O1xuICAgIHRoaXMubmVlZHNJbmRleFVwZGF0ZSB8fD0gaW5kZXggIT09IHRoaXMubGVuZ3RoO1xuICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICB0aGlzLmxDb250YWluZXIsIGxWaWV3LCBpbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHRoaXMudGVtcGxhdGVUTm9kZSwgZGVoeWRyYXRlZFZpZXcpKTtcbiAgfVxuICBvdmVycmlkZSBkZXRhY2goaW5kZXg6IG51bWJlcik6IExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4ge1xuICAgIHRoaXMubmVlZHNJbmRleFVwZGF0ZSB8fD0gaW5kZXggIT09IHRoaXMubGVuZ3RoIC0gMTtcbiAgICByZXR1cm4gZGV0YWNoRXhpc3RpbmdWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4odGhpcy5sQ29udGFpbmVyLCBpbmRleCk7XG4gIH1cbiAgb3ZlcnJpZGUgY3JlYXRlKGluZGV4OiBudW1iZXIsIHZhbHVlOiB1bmtub3duKTogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+PiB7XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPVxuICAgICAgICBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyh0aGlzLmxDb250YWluZXIsIHRoaXMudGVtcGxhdGVUTm9kZS50VmlldyEuc3NySWQpO1xuICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KFxuICAgICAgICB0aGlzLmhvc3RMVmlldywgdGhpcy50ZW1wbGF0ZVROb2RlLCBuZXcgUmVwZWF0ZXJDb250ZXh0KHRoaXMubENvbnRhaW5lciwgdmFsdWUsIGluZGV4KSxcbiAgICAgICAge2RlaHlkcmF0ZWRWaWV3fSk7XG5cbiAgICByZXR1cm4gZW1iZWRkZWRMVmlldztcbiAgfVxuICBvdmVycmlkZSBkZXN0cm95KGxWaWV3OiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+KTogdm9pZCB7XG4gICAgZGVzdHJveUxWaWV3KGxWaWV3W1RWSUVXXSwgbFZpZXcpO1xuICB9XG4gIG92ZXJyaWRlIHVwZGF0ZVZhbHVlKGluZGV4OiBudW1iZXIsIHZhbHVlOiB1bmtub3duKTogdm9pZCB7XG4gICAgdGhpcy5nZXRMVmlldyhpbmRleClbQ09OVEVYVF0uJGltcGxpY2l0ID0gdmFsdWU7XG4gIH1cblxuICByZXNldCgpIHtcbiAgICB0aGlzLm5lZWRzSW5kZXhVcGRhdGUgPSBmYWxzZTtcbiAgfVxuXG4gIHVwZGF0ZUluZGV4ZXMoKSB7XG4gICAgaWYgKHRoaXMubmVlZHNJbmRleFVwZGF0ZSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZ2V0TFZpZXcoaSlbQ09OVEVYVF0uJGluZGV4ID0gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldExWaWV3KGluZGV4OiBudW1iZXIpOiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+IHtcbiAgICByZXR1cm4gZ2V0RXhpc3RpbmdMVmlld0Zyb21MQ29udGFpbmVyKHRoaXMubENvbnRhaW5lciwgaW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogVGhlIHJlcGVhdGVyIGluc3RydWN0aW9uIGRvZXMgdXBkYXRlLXRpbWUgZGlmZmluZyBvZiBhIHByb3ZpZGVkIGNvbGxlY3Rpb24gKGFnYWluc3QgdGhlXG4gKiBjb2xsZWN0aW9uIHNlZW4gcHJldmlvdXNseSkgYW5kIG1hcHMgY2hhbmdlcyBpbiB0aGUgY29sbGVjdGlvbiB0byB2aWV3cyBzdHJ1Y3R1cmUgKGJ5IGFkZGluZyxcbiAqIHJlbW92aW5nIG9yIG1vdmluZyB2aWV3cyBhcyBuZWVkZWQpLlxuICogQHBhcmFtIGNvbGxlY3Rpb24gLSB0aGUgY29sbGVjdGlvbiBpbnN0YW5jZSB0byBiZSBjaGVja2VkIGZvciBjaGFuZ2VzXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlcGVhdGVyKGNvbGxlY3Rpb246IEl0ZXJhYmxlPHVua25vd24+fHVuZGVmaW5lZHxudWxsKTogdm9pZCB7XG4gIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICBjb25zdCBtZXRhZGF0YVNsb3RJZHggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgY29uc3QgaG9zdExWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gaG9zdExWaWV3W21ldGFkYXRhU2xvdElkeF0gYXMgUmVwZWF0ZXJNZXRhZGF0YTtcblxuICAgIGlmIChtZXRhZGF0YS5saXZlQ29sbGVjdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBjb250YWluZXJJbmRleCA9IG1ldGFkYXRhU2xvdElkeCArIDE7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gZ2V0TENvbnRhaW5lcihob3N0TFZpZXcsIGNvbnRhaW5lckluZGV4KTtcbiAgICAgIGNvbnN0IGl0ZW1UZW1wbGF0ZVROb2RlID0gZ2V0RXhpc3RpbmdUTm9kZShob3N0VFZpZXcsIGNvbnRhaW5lckluZGV4KTtcbiAgICAgIG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uID1cbiAgICAgICAgICBuZXcgTGl2ZUNvbGxlY3Rpb25MQ29udGFpbmVySW1wbChsQ29udGFpbmVyLCBob3N0TFZpZXcsIGl0ZW1UZW1wbGF0ZVROb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWV0YWRhdGEubGl2ZUNvbGxlY3Rpb24ucmVzZXQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBsaXZlQ29sbGVjdGlvbiA9IG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uO1xuICAgIHJlY29uY2lsZShsaXZlQ29sbGVjdGlvbiwgY29sbGVjdGlvbiwgbWV0YWRhdGEudHJhY2tCeUZuKTtcblxuICAgIC8vIG1vdmVzIGluIHRoZSBjb250YWluZXIgbWlnaHQgY2F1c2VkIGNvbnRleHQncyBpbmRleCB0byBnZXQgb3V0IG9mIG9yZGVyLCByZS1hZGp1c3QgaWYgbmVlZGVkXG4gICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlSW5kZXhlcygpO1xuXG4gICAgLy8gaGFuZGxlIGVtcHR5IGJsb2Nrc1xuICAgIGlmIChtZXRhZGF0YS5oYXNFbXB0eUJsb2NrKSB7XG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gICAgICBjb25zdCBpc0NvbGxlY3Rpb25FbXB0eSA9IGxpdmVDb2xsZWN0aW9uLmxlbmd0aCA9PT0gMDtcbiAgICAgIGlmIChiaW5kaW5nVXBkYXRlZChob3N0TFZpZXcsIGJpbmRpbmdJbmRleCwgaXNDb2xsZWN0aW9uRW1wdHkpKSB7XG4gICAgICAgIGNvbnN0IGVtcHR5VGVtcGxhdGVJbmRleCA9IG1ldGFkYXRhU2xvdElkeCArIDI7XG4gICAgICAgIGNvbnN0IGxDb250YWluZXJGb3JFbXB0eSA9IGdldExDb250YWluZXIoaG9zdExWaWV3LCBlbXB0eVRlbXBsYXRlSW5kZXgpO1xuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uRW1wdHkpIHtcbiAgICAgICAgICBjb25zdCBlbXB0eVRlbXBsYXRlVE5vZGUgPSBnZXRFeGlzdGluZ1ROb2RlKGhvc3RUVmlldywgZW1wdHlUZW1wbGF0ZUluZGV4KTtcbiAgICAgICAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9XG4gICAgICAgICAgICAgIGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXJGb3JFbXB0eSwgZW1wdHlUZW1wbGF0ZVROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoXG4gICAgICAgICAgICAgIGhvc3RMVmlldywgZW1wdHlUZW1wbGF0ZVROb2RlLCB1bmRlZmluZWQsIHtkZWh5ZHJhdGVkVmlld30pO1xuICAgICAgICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICAgICAgICBsQ29udGFpbmVyRm9yRW1wdHksIGVtYmVkZGVkTFZpZXcsIDAsXG4gICAgICAgICAgICAgIHNob3VsZEFkZFZpZXdUb0RvbShlbXB0eVRlbXBsYXRlVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihsQ29udGFpbmVyRm9yRW1wdHksIDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TENvbnRhaW5lcihsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIpOiBMQ29udGFpbmVyIHtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2luZGV4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG5cbiAgcmV0dXJuIGxDb250YWluZXI7XG59XG5cbmZ1bmN0aW9uIGRldGFjaEV4aXN0aW5nVmlldzxUPihsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKTogTFZpZXc8VD4ge1xuICBjb25zdCBleGlzdGluZ0xWaWV3ID0gZGV0YWNoVmlldyhsQ29udGFpbmVyLCBpbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhleGlzdGluZ0xWaWV3KTtcblxuICByZXR1cm4gZXhpc3RpbmdMVmlldyBhcyBMVmlldzxUPjtcbn1cblxuZnVuY3Rpb24gZ2V0RXhpc3RpbmdMVmlld0Zyb21MQ29udGFpbmVyPFQ+KGxDb250YWluZXI6IExDb250YWluZXIsIGluZGV4OiBudW1iZXIpOiBMVmlldzxUPiB7XG4gIGNvbnN0IGV4aXN0aW5nTFZpZXcgPSBnZXRMVmlld0Zyb21MQ29udGFpbmVyPFQ+KGxDb250YWluZXIsIGluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGV4aXN0aW5nTFZpZXcpO1xuXG4gIHJldHVybiBleGlzdGluZ0xWaWV3ITtcbn1cblxuZnVuY3Rpb24gZ2V0RXhpc3RpbmdUTm9kZSh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIpOiBUTm9kZSB7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUodFZpZXcsIGluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlKHROb2RlKTtcblxuICByZXR1cm4gdE5vZGU7XG59XG4iXX0=