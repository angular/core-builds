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
function detectDuplicateKeys(collection, trackByFn) {
    const keyToIdx = new Map();
    let duplicatedKeysMsg = [];
    let idx = 0;
    for (const item of collection) {
        const key = trackByFn(idx, item);
        if (keyToIdx.has(key)) {
            const prevIdx = keyToIdx.get(key);
            duplicatedKeysMsg.push(`key "${key}" at index "${prevIdx}" and "${idx}"`);
        }
        keyToIdx.set(key, idx++);
    }
    if (duplicatedKeysMsg.length > 0) {
        const message = formatRuntimeError(955 /* RuntimeErrorCode.LOOP_TRACK_DUPLICATE_KEYS */, 'The provided track expression resulted in duplicated keys for a given collection. ' +
            'Adjust the tracking expression such that it uniquely identifies all the items in the collection. ' +
            'Duplicated keys were: \n' + duplicatedKeysMsg.join(', \n') + '.');
        // tslint:disable-next-line:no-console
        console.warn(message);
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
        // make sure that tracking expression doesn't result in duplicate keys for a given collection
        if (ngDevMode && collection != null) {
            detectDuplicateKeys(collection, metadata.trackByFn);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbF9mbG93LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udHJvbF9mbG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBR25FLE9BQU8sRUFBQyxrQkFBa0IsRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFFbEUsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM5RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNyRSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyx1QkFBdUIsRUFBYSxNQUFNLHlCQUF5QixDQUFDO0FBRzVFLE9BQU8sRUFBQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBUyxLQUFLLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUN0SCxPQUFPLEVBQUMsY0FBYyxFQUFFLFNBQVMsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUQsT0FBTyxFQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsV0FBVyxFQUFFLFFB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LENBQUM7SUFFeEMsT0FBTyxhQUFjLENBQUM7QUFDeEIsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsS0FBWSxFQUFFLEtBQWE7SUFDbkQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyQyxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWhDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3NldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7VHJhY2tCeUZ1bmN0aW9ufSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkQ29udGFpbmVyVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3ZpZXdzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RnVuY3Rpb259IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3LCBhc3NlcnRUTm9kZX0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGV9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgSEVBREVSX09GRlNFVCwgSFlEUkFUSU9OLCBMVmlldywgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtMaXZlQ29sbGVjdGlvbiwgcmVjb25jaWxlfSBmcm9tICcuLi9saXN0X3JlY29uY2lsaWF0aW9uJztcbmltcG9ydCB7ZGVzdHJveUxWaWV3LCBkZXRhY2hWaWV3fSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldExWaWV3LCBnZXRTZWxlY3RlZEluZGV4LCBnZXRUVmlldywgbmV4dEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldENvbnN0YW50LCBnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YWRkTFZpZXdUb0xDb250YWluZXIsIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcsIGdldExWaWV3RnJvbUxDb250YWluZXIsIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIsIHNob3VsZEFkZFZpZXdUb0RvbX0gZnJvbSAnLi4vdmlld19tYW5pcHVsYXRpb24nO1xuXG5pbXBvcnQge2RlY2xhcmVUZW1wbGF0ZX0gZnJvbSAnLi90ZW1wbGF0ZSc7XG5cbi8qKlxuICogVGhlIGNvbmRpdGlvbmFsIGluc3RydWN0aW9uIHJlcHJlc2VudHMgdGhlIGJhc2ljIGJ1aWxkaW5nIGJsb2NrIG9uIHRoZSBydW50aW1lIHNpZGUgdG8gc3VwcG9ydFxuICogYnVpbHQtaW4gXCJpZlwiIGFuZCBcInN3aXRjaFwiLiBPbiB0aGUgaGlnaCBsZXZlbCB0aGlzIGluc3RydWN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBhZGRpbmcgYW5kXG4gKiByZW1vdmluZyB2aWV3cyBzZWxlY3RlZCBieSBhIGNvbmRpdGlvbmFsIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIG1hdGNoaW5nVGVtcGxhdGVJbmRleCBpbmRleCBvZiBhIHRlbXBsYXRlIFROb2RlIHJlcHJlc2VudGluZyBhIGNvbmRpdGlvbmFsIHZpZXcgdG8gYmVcbiAqICAgICBpbnNlcnRlZDsgLTEgcmVwcmVzZW50cyBhIHNwZWNpYWwgY2FzZSB3aGVuIHRoZXJlIGlzIG5vIHZpZXcgdG8gaW5zZXJ0LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb25kaXRpb25hbDxUPihjb250YWluZXJJbmRleDogbnVtYmVyLCBtYXRjaGluZ1RlbXBsYXRlSW5kZXg6IG51bWJlciwgdmFsdWU/OiBUKSB7XG4gIC8vIFRPRE86IHdlIGNvdWxkIHJlbW92ZSB0aGUgY29udGFpbmVySW5kZXggYXJndW1lbnQgdG8gdGhpcyBpbnN0cnVjdGlvbiBub3cgKCEpXG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nQ29udHJvbEZsb3cnKTtcblxuICBjb25zdCBob3N0TFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGNvbnN0IHByZXZNYXRjaGluZ1RlbXBsYXRlSW5kZXg6IG51bWJlciA9XG4gICAgICBob3N0TFZpZXdbYmluZGluZ0luZGV4XSAhPT0gTk9fQ0hBTkdFID8gaG9zdExWaWV3W2JpbmRpbmdJbmRleF0gOiAtMTtcbiAgY29uc3QgcHJldkNvbnRhaW5lciA9IHByZXZNYXRjaGluZ1RlbXBsYXRlSW5kZXggIT09IC0xID9cbiAgICAgIGdldExDb250YWluZXIoaG9zdExWaWV3LCBIRUFERVJfT0ZGU0VUICsgcHJldk1hdGNoaW5nVGVtcGxhdGVJbmRleCkgOlxuICAgICAgdW5kZWZpbmVkO1xuICBjb25zdCB2aWV3SW5Db250YWluZXJJZHggPSAwO1xuXG4gIGlmIChiaW5kaW5nVXBkYXRlZChob3N0TFZpZXcsIGJpbmRpbmdJbmRleCwgbWF0Y2hpbmdUZW1wbGF0ZUluZGV4KSkge1xuICAgIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICAvLyBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gc2hvdyBjaGFuZ2VkIC0gcmVtb3ZlIHRoZSBwcmV2aW91c2x5IGRpc3BsYXllZCBvbmVcbiAgICAgIC8vIChpdCBpcyBhIG5vb3AgaWYgdGhlcmUgYXJlIG5vIGFjdGl2ZSB2aWV3cyBpbiBhIGNvbnRhaW5lcikuXG4gICAgICBpZiAocHJldkNvbnRhaW5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIocHJldkNvbnRhaW5lciwgdmlld0luQ29udGFpbmVySWR4KTtcbiAgICAgIH1cblxuICAgICAgLy8gSW5kZXggLTEgaXMgYSBzcGVjaWFsIGNhc2Ugd2hlcmUgbm9uZSBvZiB0aGUgY29uZGl0aW9ucyBldmFsdWF0ZXMgdG9cbiAgICAgIC8vIGEgdHJ1dGh5IHZhbHVlIGFuZCBhcyB0aGUgY29uc2VxdWVuY2Ugd2UndmUgZ290IG5vIHZpZXcgdG8gc2hvdy5cbiAgICAgIGlmIChtYXRjaGluZ1RlbXBsYXRlSW5kZXggIT09IC0xKSB7XG4gICAgICAgIGNvbnN0IG5leHRMQ29udGFpbmVySW5kZXggPSBIRUFERVJfT0ZGU0VUICsgbWF0Y2hpbmdUZW1wbGF0ZUluZGV4O1xuICAgICAgICBjb25zdCBuZXh0Q29udGFpbmVyID0gZ2V0TENvbnRhaW5lcihob3N0TFZpZXcsIG5leHRMQ29udGFpbmVySW5kZXgpO1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZVROb2RlID0gZ2V0RXhpc3RpbmdUTm9kZShob3N0TFZpZXdbVFZJRVddLCBuZXh0TENvbnRhaW5lckluZGV4KTtcblxuICAgICAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9XG4gICAgICAgICAgICBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyhuZXh0Q29udGFpbmVyLCB0ZW1wbGF0ZVROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPVxuICAgICAgICAgICAgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldyhob3N0TFZpZXcsIHRlbXBsYXRlVE5vZGUsIHZhbHVlLCB7ZGVoeWRyYXRlZFZpZXd9KTtcblxuICAgICAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgICAgIG5leHRDb250YWluZXIsIGVtYmVkZGVkTFZpZXcsIHZpZXdJbkNvbnRhaW5lcklkeCxcbiAgICAgICAgICAgIHNob3VsZEFkZFZpZXdUb0RvbSh0ZW1wbGF0ZVROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChwcmV2Q29udGFpbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBXZSBtaWdodCBrZWVwIGRpc3BsYXlpbmcgdGhlIHNhbWUgdGVtcGxhdGUgYnV0IHRoZSBhY3R1YWwgdmFsdWUgb2YgdGhlIGV4cHJlc3Npb24gY291bGQgaGF2ZVxuICAgIC8vIGNoYW5nZWQgLSByZS1iaW5kIGluIGNvbnRleHQuXG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlld0Zyb21MQ29udGFpbmVyPFR8dW5kZWZpbmVkPihwcmV2Q29udGFpbmVyLCB2aWV3SW5Db250YWluZXJJZHgpO1xuICAgIGlmIChsVmlldyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsVmlld1tDT05URVhUXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVwZWF0ZXJDb250ZXh0PFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBwdWJsaWMgJGltcGxpY2l0OiBULCBwdWJsaWMgJGluZGV4OiBudW1iZXIpIHt9XG5cbiAgZ2V0ICRjb3VudCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmxDb250YWluZXIubGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGJ1aWx0LWluIHRyYWNrQnkgZnVuY3Rpb24gdXNlZCBmb3Igc2l0dWF0aW9ucyB3aGVyZSB1c2VycyBzcGVjaWZpZWQgY29sbGVjdGlvbiBpbmRleCBhcyBhXG4gKiB0cmFja2luZyBleHByZXNzaW9uLiBIYXZpbmcgdGhpcyBmdW5jdGlvbiBib2R5IGluIHRoZSBydW50aW1lIGF2b2lkcyB1bm5lY2Vzc2FyeSBjb2RlIGdlbmVyYXRpb24uXG4gKlxuICogQHBhcmFtIGluZGV4XG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlcGVhdGVyVHJhY2tCeUluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIEEgYnVpbHQtaW4gdHJhY2tCeSBmdW5jdGlvbiB1c2VkIGZvciBzaXR1YXRpb25zIHdoZXJlIHVzZXJzIHNwZWNpZmllZCBjb2xsZWN0aW9uIGl0ZW0gcmVmZXJlbmNlXG4gKiBhcyBhIHRyYWNraW5nIGV4cHJlc3Npb24uIEhhdmluZyB0aGlzIGZ1bmN0aW9uIGJvZHkgaW4gdGhlIHJ1bnRpbWUgYXZvaWRzIHVubmVjZXNzYXJ5IGNvZGVcbiAqIGdlbmVyYXRpb24uXG4gKlxuICogQHBhcmFtIGluZGV4XG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlcGVhdGVyVHJhY2tCeUlkZW50aXR5PFQ+KF86IG51bWJlciwgdmFsdWU6IFQpIHtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5jbGFzcyBSZXBlYXRlck1ldGFkYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgaGFzRW1wdHlCbG9jazogYm9vbGVhbiwgcHVibGljIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPHVua25vd24+LFxuICAgICAgcHVibGljIGxpdmVDb2xsZWN0aW9uPzogTGl2ZUNvbGxlY3Rpb25MQ29udGFpbmVySW1wbCkge31cbn1cblxuLyoqXG4gKiBUaGUgcmVwZWF0ZXJDcmVhdGUgaW5zdHJ1Y3Rpb24gcnVucyBpbiB0aGUgY3JlYXRpb24gcGFydCBvZiB0aGUgdGVtcGxhdGUgcGFzcyBhbmQgaW5pdGlhbGl6ZXNcbiAqIGludGVybmFsIGRhdGEgc3RydWN0dXJlcyByZXF1aXJlZCBieSB0aGUgdXBkYXRlIHBhc3Mgb2YgdGhlIGJ1aWx0LWluIHJlcGVhdGVyIGxvZ2ljLiBSZXBlYXRlclxuICogbWV0YWRhdGEgYXJlIGFsbG9jYXRlZCBpbiB0aGUgZGF0YSBwYXJ0IG9mIExWaWV3IHdpdGggdGhlIGZvbGxvd2luZyBsYXlvdXQ6XG4gKiAtIExWaWV3W0hFQURFUl9PRkZTRVQgKyBpbmRleF0gLSBtZXRhZGF0YVxuICogLSBMVmlld1tIRUFERVJfT0ZGU0VUICsgaW5kZXggKyAxXSAtIHJlZmVyZW5jZSB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIHJlbmRlcmluZyBhbiBpdGVtXG4gKiAtIExWaWV3W0hFQURFUl9PRkZTRVQgKyBpbmRleCArIDJdIC0gb3B0aW9uYWwgcmVmZXJlbmNlIHRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gcmVuZGVyaW5nIGFuIGVtcHR5XG4gKiBibG9ja1xuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBhdCB3aGljaCB0byBzdG9yZSB0aGUgbWV0YWRhdGEgb2YgdGhlIHJlcGVhdGVyLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gUmVmZXJlbmNlIHRvIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgbWFpbiByZXBlYXRlciBibG9jay5cbiAqIEBwYXJhbSBkZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoZSBtYWluIGJsb2NrLlxuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhlIG1haW4gYmxvY2suXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRyc0luZGV4IEluZGV4IG9mIHRlbXBsYXRlIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIHRyYWNrQnlGbiBSZWZlcmVuY2UgdG8gdGhlIHRyYWNraW5nIGZ1bmN0aW9uLlxuICogQHBhcmFtIHRyYWNrQnlVc2VzQ29tcG9uZW50SW5zdGFuY2UgV2hldGhlciB0aGUgdHJhY2tpbmcgZnVuY3Rpb24gaGFzIGFueSByZWZlcmVuY2VzIHRvIHRoZVxuICogIGNvbXBvbmVudCBpbnN0YW5jZS4gSWYgaXQgZG9lc24ndCwgd2UgY2FuIGF2b2lkIHJlYmluZGluZyBpdC5cbiAqIEBwYXJhbSBlbXB0eVRlbXBsYXRlRm4gUmVmZXJlbmNlIHRvIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBvZiB0aGUgZW1wdHkgYmxvY2suXG4gKiBAcGFyYW0gZW1wdHlEZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoZSBlbXB0eSBibG9jay5cbiAqIEBwYXJhbSBlbXB0eVZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhlIGVtcHR5IGJsb2NrLlxuICogQHBhcmFtIGVtcHR5VGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgZW1wdHkgYmxvY2sgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBlbXB0eUF0dHJzSW5kZXggSW5kZXggb2YgdGhlIGVtcHR5IGJsb2NrIHRlbXBsYXRlIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVwZWF0ZXJDcmVhdGUoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8dW5rbm93bj4sIGRlY2xzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnNJbmRleDogbnVtYmVyfG51bGwsIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPHVua25vd24+LFxuICAgIHRyYWNrQnlVc2VzQ29tcG9uZW50SW5zdGFuY2U/OiBib29sZWFuLCBlbXB0eVRlbXBsYXRlRm4/OiBDb21wb25lbnRUZW1wbGF0ZTx1bmtub3duPixcbiAgICBlbXB0eURlY2xzPzogbnVtYmVyLCBlbXB0eVZhcnM/OiBudW1iZXIsIGVtcHR5VGFnTmFtZT86IHN0cmluZ3xudWxsLFxuICAgIGVtcHR5QXR0cnNJbmRleD86IG51bWJlcnxudWxsKTogdm9pZCB7XG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nQ29udHJvbEZsb3cnKTtcblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEZ1bmN0aW9uKFxuICAgICAgICAgIHRyYWNrQnlGbiwgYEEgdHJhY2sgZXhwcmVzc2lvbiBtdXN0IGJlIGEgZnVuY3Rpb24sIHdhcyAke3R5cGVvZiB0cmFja0J5Rm59IGluc3RlYWQuYCk7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IGhhc0VtcHR5QmxvY2sgPSBlbXB0eVRlbXBsYXRlRm4gIT09IHVuZGVmaW5lZDtcbiAgY29uc3QgaG9zdExWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYm91bmRUcmFja0J5ID0gdHJhY2tCeVVzZXNDb21wb25lbnRJbnN0YW5jZSA/XG4gICAgICAvLyBXZSBvbmx5IHdhbnQgdG8gYmluZCB3aGVuIG5lY2Vzc2FyeSwgYmVjYXVzZSBpdCBwcm9kdWNlcyBhXG4gICAgICAvLyBuZXcgZnVuY3Rpb24uIEZvciBwdXJlIGZ1bmN0aW9ucyBpdCdzIG5vdCBuZWNlc3NhcnkuXG4gICAgICB0cmFja0J5Rm4uYmluZChob3N0TFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddW0NPTlRFWFRdKSA6XG4gICAgICB0cmFja0J5Rm47XG4gIGNvbnN0IG1ldGFkYXRhID0gbmV3IFJlcGVhdGVyTWV0YWRhdGEoaGFzRW1wdHlCbG9jaywgYm91bmRUcmFja0J5KTtcbiAgaG9zdExWaWV3W0hFQURFUl9PRkZTRVQgKyBpbmRleF0gPSBtZXRhZGF0YTtcblxuICBkZWNsYXJlVGVtcGxhdGUoXG4gICAgICBsVmlldywgdFZpZXcsIGluZGV4ICsgMSwgdGVtcGxhdGVGbiwgZGVjbHMsIHZhcnMsIHRhZ05hbWUsXG4gICAgICBnZXRDb25zdGFudCh0Vmlldy5jb25zdHMsIGF0dHJzSW5kZXgpKTtcblxuICBpZiAoaGFzRW1wdHlCbG9jaykge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKGVtcHR5RGVjbHMsICdNaXNzaW5nIG51bWJlciBvZiBkZWNsYXJhdGlvbnMgZm9yIHRoZSBlbXB0eSByZXBlYXRlciBibG9jay4nKTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChlbXB0eVZhcnMsICdNaXNzaW5nIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhlIGVtcHR5IHJlcGVhdGVyIGJsb2NrLicpO1xuXG4gICAgZGVjbGFyZVRlbXBsYXRlKFxuICAgICAgICBsVmlldywgdFZpZXcsIGluZGV4ICsgMiwgZW1wdHlUZW1wbGF0ZUZuLCBlbXB0eURlY2xzISwgZW1wdHlWYXJzISwgZW1wdHlUYWdOYW1lLFxuICAgICAgICBnZXRDb25zdGFudCh0Vmlldy5jb25zdHMsIGVtcHR5QXR0cnNJbmRleCkpO1xuICB9XG59XG5cbmNsYXNzIExpdmVDb2xsZWN0aW9uTENvbnRhaW5lckltcGwgZXh0ZW5kc1xuICAgIExpdmVDb2xsZWN0aW9uPExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4sIHVua25vd24+IHtcbiAgLyoqXG4gICBQcm9wZXJ0eSBpbmRpY2F0aW5nIGlmIGluZGV4ZXMgaW4gdGhlIHJlcGVhdGVyIGNvbnRleHQgbmVlZCB0byBiZSB1cGRhdGVkIGZvbGxvd2luZyB0aGUgbGl2ZVxuICAgY29sbGVjdGlvbiBjaGFuZ2VzLiBJbmRleCB1cGRhdGVzIGFyZSBuZWNlc3NhcnkgaWYgYW5kIG9ubHkgaWYgdmlld3MgYXJlIGluc2VydGVkIC8gcmVtb3ZlZCBpblxuICAgdGhlIG1pZGRsZSBvZiBMQ29udGFpbmVyLiBBZGRzIGFuZCByZW1vdmFscyBhdCB0aGUgZW5kIGRvbid0IHJlcXVpcmUgaW5kZXggdXBkYXRlcy5cbiAqL1xuICBwcml2YXRlIG5lZWRzSW5kZXhVcGRhdGUgPSBmYWxzZTtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGxDb250YWluZXI6IExDb250YWluZXIsIHByaXZhdGUgaG9zdExWaWV3OiBMVmlldywgcHJpdmF0ZSB0ZW1wbGF0ZVROb2RlOiBUTm9kZSkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBvdmVycmlkZSBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDtcbiAgfVxuICBvdmVycmlkZSBhdChpbmRleDogbnVtYmVyKTogdW5rbm93biB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TFZpZXcoaW5kZXgpW0NPTlRFWFRdLiRpbXBsaWNpdDtcbiAgfVxuICBvdmVycmlkZSBhdHRhY2goaW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4pOiB2b2lkIHtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGxWaWV3W0hZRFJBVElPTl0gYXMgRGVoeWRyYXRlZENvbnRhaW5lclZpZXc7XG4gICAgdGhpcy5uZWVkc0luZGV4VXBkYXRlIHx8PSBpbmRleCAhPT0gdGhpcy5sZW5ndGg7XG4gICAgYWRkTFZpZXdUb0xDb250YWluZXIoXG4gICAgICAgIHRoaXMubENvbnRhaW5lciwgbFZpZXcsIGluZGV4LCBzaG91bGRBZGRWaWV3VG9Eb20odGhpcy50ZW1wbGF0ZVROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICB9XG4gIG92ZXJyaWRlIGRldGFjaChpbmRleDogbnVtYmVyKTogTFZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+PiB7XG4gICAgdGhpcy5uZWVkc0luZGV4VXBkYXRlIHx8PSBpbmRleCAhPT0gdGhpcy5sZW5ndGggLSAxO1xuICAgIHJldHVybiBkZXRhY2hFeGlzdGluZ1ZpZXc8UmVwZWF0ZXJDb250ZXh0PHVua25vd24+Pih0aGlzLmxDb250YWluZXIsIGluZGV4KTtcbiAgfVxuICBvdmVycmlkZSBjcmVhdGUoaW5kZXg6IG51bWJlciwgdmFsdWU6IHVua25vd24pOiBMVmlldzxSZXBlYXRlckNvbnRleHQ8dW5rbm93bj4+IHtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9XG4gICAgICAgIGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KHRoaXMubENvbnRhaW5lciwgdGhpcy50ZW1wbGF0ZVROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoXG4gICAgICAgIHRoaXMuaG9zdExWaWV3LCB0aGlzLnRlbXBsYXRlVE5vZGUsIG5ldyBSZXBlYXRlckNvbnRleHQodGhpcy5sQ29udGFpbmVyLCB2YWx1ZSwgaW5kZXgpLFxuICAgICAgICB7ZGVoeWRyYXRlZFZpZXd9KTtcblxuICAgIHJldHVybiBlbWJlZGRlZExWaWV3O1xuICB9XG4gIG92ZXJyaWRlIGRlc3Ryb3kobFZpZXc6IExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4pOiB2b2lkIHtcbiAgICBkZXN0cm95TFZpZXcobFZpZXdbVFZJRVddLCBsVmlldyk7XG4gIH1cbiAgb3ZlcnJpZGUgdXBkYXRlVmFsdWUoaW5kZXg6IG51bWJlciwgdmFsdWU6IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLmdldExWaWV3KGluZGV4KVtDT05URVhUXS4kaW1wbGljaXQgPSB2YWx1ZTtcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIHRoaXMubmVlZHNJbmRleFVwZGF0ZSA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlSW5kZXhlcygpIHtcbiAgICBpZiAodGhpcy5uZWVkc0luZGV4VXBkYXRlKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5nZXRMVmlldyhpKVtDT05URVhUXS4kaW5kZXggPSBpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0TFZpZXcoaW5kZXg6IG51bWJlcik6IExWaWV3PFJlcGVhdGVyQ29udGV4dDx1bmtub3duPj4ge1xuICAgIHJldHVybiBnZXRFeGlzdGluZ0xWaWV3RnJvbUxDb250YWluZXIodGhpcy5sQ29udGFpbmVyLCBpbmRleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGV0ZWN0RHVwbGljYXRlS2V5cyhcbiAgICBjb2xsZWN0aW9uOiBJdGVyYWJsZTx1bmtub3duPiwgdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248dW5rbm93bj4pOiB2b2lkIHtcbiAgY29uc3Qga2V5VG9JZHggPSBuZXcgTWFwPHVua25vd24sIG51bWJlcj4oKTtcbiAgbGV0IGR1cGxpY2F0ZWRLZXlzTXNnOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGxldCBpZHggPSAwO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgY29sbGVjdGlvbikge1xuICAgIGNvbnN0IGtleSA9IHRyYWNrQnlGbihpZHgsIGl0ZW0pO1xuXG4gICAgaWYgKGtleVRvSWR4LmhhcyhrZXkpKSB7XG4gICAgICBjb25zdCBwcmV2SWR4ID0ga2V5VG9JZHguZ2V0KGtleSk7XG4gICAgICBkdXBsaWNhdGVkS2V5c01zZy5wdXNoKGBrZXkgXCIke2tleX1cIiBhdCBpbmRleCBcIiR7cHJldklkeH1cIiBhbmQgXCIke2lkeH1cImApO1xuICAgIH1cblxuICAgIGtleVRvSWR4LnNldChrZXksIGlkeCsrKTtcbiAgfVxuXG4gIGlmIChkdXBsaWNhdGVkS2V5c01zZy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5MT09QX1RSQUNLX0RVUExJQ0FURV9LRVlTLFxuICAgICAgICAnVGhlIHByb3ZpZGVkIHRyYWNrIGV4cHJlc3Npb24gcmVzdWx0ZWQgaW4gZHVwbGljYXRlZCBrZXlzIGZvciBhIGdpdmVuIGNvbGxlY3Rpb24uICcgK1xuICAgICAgICAgICAgJ0FkanVzdCB0aGUgdHJhY2tpbmcgZXhwcmVzc2lvbiBzdWNoIHRoYXQgaXQgdW5pcXVlbHkgaWRlbnRpZmllcyBhbGwgdGhlIGl0ZW1zIGluIHRoZSBjb2xsZWN0aW9uLiAnICtcbiAgICAgICAgICAgICdEdXBsaWNhdGVkIGtleXMgd2VyZTogXFxuJyArIGR1cGxpY2F0ZWRLZXlzTXNnLmpvaW4oJywgXFxuJykgKyAnLicpO1xuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgcmVwZWF0ZXIgaW5zdHJ1Y3Rpb24gZG9lcyB1cGRhdGUtdGltZSBkaWZmaW5nIG9mIGEgcHJvdmlkZWQgY29sbGVjdGlvbiAoYWdhaW5zdCB0aGVcbiAqIGNvbGxlY3Rpb24gc2VlbiBwcmV2aW91c2x5KSBhbmQgbWFwcyBjaGFuZ2VzIGluIHRoZSBjb2xsZWN0aW9uIHRvIHZpZXdzIHN0cnVjdHVyZSAoYnkgYWRkaW5nLFxuICogcmVtb3Zpbmcgb3IgbW92aW5nIHZpZXdzIGFzIG5lZWRlZCkuXG4gKiBAcGFyYW0gY29sbGVjdGlvbiAtIHRoZSBjb2xsZWN0aW9uIGluc3RhbmNlIHRvIGJlIGNoZWNrZWQgZm9yIGNoYW5nZXNcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVwZWF0ZXIoY29sbGVjdGlvbjogSXRlcmFibGU8dW5rbm93bj58dW5kZWZpbmVkfG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gIGNvbnN0IG1ldGFkYXRhU2xvdElkeCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBob3N0TFZpZXcgPSBnZXRMVmlldygpO1xuICAgIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gICAgY29uc3QgbWV0YWRhdGEgPSBob3N0TFZpZXdbbWV0YWRhdGFTbG90SWR4XSBhcyBSZXBlYXRlck1ldGFkYXRhO1xuXG4gICAgaWYgKG1ldGFkYXRhLmxpdmVDb2xsZWN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lckluZGV4ID0gbWV0YWRhdGFTbG90SWR4ICsgMTtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBnZXRMQ29udGFpbmVyKGhvc3RMVmlldywgY29udGFpbmVySW5kZXgpO1xuICAgICAgY29uc3QgaXRlbVRlbXBsYXRlVE5vZGUgPSBnZXRFeGlzdGluZ1ROb2RlKGhvc3RUVmlldywgY29udGFpbmVySW5kZXgpO1xuICAgICAgbWV0YWRhdGEubGl2ZUNvbGxlY3Rpb24gPVxuICAgICAgICAgIG5ldyBMaXZlQ29sbGVjdGlvbkxDb250YWluZXJJbXBsKGxDb250YWluZXIsIGhvc3RMVmlldywgaXRlbVRlbXBsYXRlVE5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtZXRhZGF0YS5saXZlQ29sbGVjdGlvbi5yZXNldCgpO1xuICAgIH1cblxuICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRyYWNraW5nIGV4cHJlc3Npb24gZG9lc24ndCByZXN1bHQgaW4gZHVwbGljYXRlIGtleXMgZm9yIGEgZ2l2ZW4gY29sbGVjdGlvblxuICAgIGlmIChuZ0Rldk1vZGUgJiYgY29sbGVjdGlvbiAhPSBudWxsKSB7XG4gICAgICBkZXRlY3REdXBsaWNhdGVLZXlzKGNvbGxlY3Rpb24sIG1ldGFkYXRhLnRyYWNrQnlGbik7XG4gICAgfVxuXG4gICAgY29uc3QgbGl2ZUNvbGxlY3Rpb24gPSBtZXRhZGF0YS5saXZlQ29sbGVjdGlvbjtcbiAgICByZWNvbmNpbGUobGl2ZUNvbGxlY3Rpb24sIGNvbGxlY3Rpb24sIG1ldGFkYXRhLnRyYWNrQnlGbik7XG5cbiAgICAvLyBtb3ZlcyBpbiB0aGUgY29udGFpbmVyIG1pZ2h0IGNhdXNlZCBjb250ZXh0J3MgaW5kZXggdG8gZ2V0IG91dCBvZiBvcmRlciwgcmUtYWRqdXN0IGlmIG5lZWRlZFxuICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZUluZGV4ZXMoKTtcblxuICAgIC8vIGhhbmRsZSBlbXB0eSBibG9ja3NcbiAgICBpZiAobWV0YWRhdGEuaGFzRW1wdHlCbG9jaykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICAgICAgY29uc3QgaXNDb2xsZWN0aW9uRW1wdHkgPSBsaXZlQ29sbGVjdGlvbi5sZW5ndGggPT09IDA7XG4gICAgICBpZiAoYmluZGluZ1VwZGF0ZWQoaG9zdExWaWV3LCBiaW5kaW5nSW5kZXgsIGlzQ29sbGVjdGlvbkVtcHR5KSkge1xuICAgICAgICBjb25zdCBlbXB0eVRlbXBsYXRlSW5kZXggPSBtZXRhZGF0YVNsb3RJZHggKyAyO1xuICAgICAgICBjb25zdCBsQ29udGFpbmVyRm9yRW1wdHkgPSBnZXRMQ29udGFpbmVyKGhvc3RMVmlldywgZW1wdHlUZW1wbGF0ZUluZGV4KTtcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbkVtcHR5KSB7XG4gICAgICAgICAgY29uc3QgZW1wdHlUZW1wbGF0ZVROb2RlID0gZ2V0RXhpc3RpbmdUTm9kZShob3N0VFZpZXcsIGVtcHR5VGVtcGxhdGVJbmRleCk7XG4gICAgICAgICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPVxuICAgICAgICAgICAgICBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyhsQ29udGFpbmVyRm9yRW1wdHksIGVtcHR5VGVtcGxhdGVUTm9kZS50VmlldyEuc3NySWQpO1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KFxuICAgICAgICAgICAgICBob3N0TFZpZXcsIGVtcHR5VGVtcGxhdGVUTm9kZSwgdW5kZWZpbmVkLCB7ZGVoeWRyYXRlZFZpZXd9KTtcbiAgICAgICAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgICAgICAgbENvbnRhaW5lckZvckVtcHR5LCBlbWJlZGRlZExWaWV3LCAwLFxuICAgICAgICAgICAgICBzaG91bGRBZGRWaWV3VG9Eb20oZW1wdHlUZW1wbGF0ZVROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lckZvckVtcHR5LCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldExDb250YWluZXIobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyKTogTENvbnRhaW5lciB7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tpbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIHJldHVybiBsQ29udGFpbmVyO1xufVxuXG5mdW5jdGlvbiBkZXRhY2hFeGlzdGluZ1ZpZXc8VD4obENvbnRhaW5lcjogTENvbnRhaW5lciwgaW5kZXg6IG51bWJlcik6IExWaWV3PFQ+IHtcbiAgY29uc3QgZXhpc3RpbmdMVmlldyA9IGRldGFjaFZpZXcobENvbnRhaW5lciwgaW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoZXhpc3RpbmdMVmlldyk7XG5cbiAgcmV0dXJuIGV4aXN0aW5nTFZpZXcgYXMgTFZpZXc8VD47XG59XG5cbmZ1bmN0aW9uIGdldEV4aXN0aW5nTFZpZXdGcm9tTENvbnRhaW5lcjxUPihsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKTogTFZpZXc8VD4ge1xuICBjb25zdCBleGlzdGluZ0xWaWV3ID0gZ2V0TFZpZXdGcm9tTENvbnRhaW5lcjxUPihsQ29udGFpbmVyLCBpbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhleGlzdGluZ0xWaWV3KTtcblxuICByZXR1cm4gZXhpc3RpbmdMVmlldyE7XG59XG5cbmZ1bmN0aW9uIGdldEV4aXN0aW5nVE5vZGUodFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyKTogVE5vZGUge1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKHRWaWV3LCBpbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZSh0Tm9kZSk7XG5cbiAgcmV0dXJuIHROb2RlO1xufVxuIl19