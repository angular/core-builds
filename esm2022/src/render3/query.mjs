/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createElementRef, ElementRef as ViewEngine_ElementRef } from '../linker/element_ref';
import { QueryList } from '../linker/query_list';
import { createTemplateRef, TemplateRef as ViewEngine_TemplateRef } from '../linker/template_ref';
import { createContainerRef, ViewContainerRef } from '../linker/view_container_ref';
import { assertDefined, assertIndexInRange, throwError } from '../util/assert';
import { stringify } from '../util/stringify';
import { assertFirstCreatePass, assertLContainer } from './assert';
import { getNodeInjectable, locateDirectiveOrProvider } from './di';
import { storeCleanupWithContext } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET, MOVED_VIEWS } from './interfaces/container';
import { DECLARATION_LCONTAINER, PARENT, QUERIES, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
class LQuery_ {
    constructor(queryList) {
        this.queryList = queryList;
        this.matches = null;
    }
    clone() {
        return new LQuery_(this.queryList);
    }
    setDirty() {
        this.queryList.setDirty();
    }
}
class LQueries_ {
    constructor(queries = []) {
        this.queries = queries;
    }
    createEmbeddedView(tView) {
        const tQueries = tView.queries;
        if (tQueries !== null) {
            const noOfInheritedQueries = tView.contentQueries !== null ? tView.contentQueries[0] : tQueries.length;
            const viewLQueries = [];
            // An embedded view has queries propagated from a declaration view at the beginning of the
            // TQueries collection and up until a first content query declared in the embedded view. Only
            // propagated LQueries are created at this point (LQuery corresponding to declared content
            // queries will be instantiated from the content query instructions for each directive).
            for (let i = 0; i < noOfInheritedQueries; i++) {
                const tQuery = tQueries.getByIndex(i);
                const parentLQuery = this.queries[tQuery.indexInDeclarationView];
                viewLQueries.push(parentLQuery.clone());
            }
            return new LQueries_(viewLQueries);
        }
        return null;
    }
    insertView(tView) {
        this.dirtyQueriesWithMatches(tView);
    }
    detachView(tView) {
        this.dirtyQueriesWithMatches(tView);
    }
    dirtyQueriesWithMatches(tView) {
        for (let i = 0; i < this.queries.length; i++) {
            if (getTQuery(tView, i).matches !== null) {
                this.queries[i].setDirty();
            }
        }
    }
}
export class TQueryMetadata_ {
    constructor(predicate, flags, read = null) {
        this.predicate = predicate;
        this.flags = flags;
        this.read = read;
    }
}
class TQueries_ {
    constructor(queries = []) {
        this.queries = queries;
    }
    elementStart(tView, tNode) {
        ngDevMode &&
            assertFirstCreatePass(tView, 'Queries should collect results on the first template pass only');
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].elementStart(tView, tNode);
        }
    }
    elementEnd(tNode) {
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].elementEnd(tNode);
        }
    }
    embeddedTView(tNode) {
        let queriesForTemplateRef = null;
        for (let i = 0; i < this.length; i++) {
            const childQueryIndex = queriesForTemplateRef !== null ? queriesForTemplateRef.length : 0;
            const tqueryClone = this.getByIndex(i).embeddedTView(tNode, childQueryIndex);
            if (tqueryClone) {
                tqueryClone.indexInDeclarationView = i;
                if (queriesForTemplateRef !== null) {
                    queriesForTemplateRef.push(tqueryClone);
                }
                else {
                    queriesForTemplateRef = [tqueryClone];
                }
            }
        }
        return queriesForTemplateRef !== null ? new TQueries_(queriesForTemplateRef) : null;
    }
    template(tView, tNode) {
        ngDevMode &&
            assertFirstCreatePass(tView, 'Queries should collect results on the first template pass only');
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].template(tView, tNode);
        }
    }
    getByIndex(index) {
        ngDevMode && assertIndexInRange(this.queries, index);
        return this.queries[index];
    }
    get length() {
        return this.queries.length;
    }
    track(tquery) {
        this.queries.push(tquery);
    }
}
class TQuery_ {
    constructor(metadata, nodeIndex = -1) {
        this.metadata = metadata;
        this.matches = null;
        this.indexInDeclarationView = -1;
        this.crossesNgTemplate = false;
        /**
         * A flag indicating if a given query still applies to nodes it is crossing. We use this flag
         * (alongside with _declarationNodeIndex) to know when to stop applying content queries to
         * elements in a template.
         */
        this._appliesToNextNode = true;
        this._declarationNodeIndex = nodeIndex;
    }
    elementStart(tView, tNode) {
        if (this.isApplyingToNode(tNode)) {
            this.matchTNode(tView, tNode);
        }
    }
    elementEnd(tNode) {
        if (this._declarationNodeIndex === tNode.index) {
            this._appliesToNextNode = false;
        }
    }
    template(tView, tNode) {
        this.elementStart(tView, tNode);
    }
    embeddedTView(tNode, childQueryIndex) {
        if (this.isApplyingToNode(tNode)) {
            this.crossesNgTemplate = true;
            // A marker indicating a `<ng-template>` element (a placeholder for query results from
            // embedded views created based on this `<ng-template>`).
            this.addMatch(-tNode.index, childQueryIndex);
            return new TQuery_(this.metadata);
        }
        return null;
    }
    isApplyingToNode(tNode) {
        if (this._appliesToNextNode &&
            (this.metadata.flags & 1 /* QueryFlags.descendants */) !== 1 /* QueryFlags.descendants */) {
            const declarationNodeIdx = this._declarationNodeIndex;
            let parent = tNode.parent;
            // Determine if a given TNode is a "direct" child of a node on which a content query was
            // declared (only direct children of query's host node can match with the descendants: false
            // option). There are 3 main use-case / conditions to consider here:
            // - <needs-target><i #target></i></needs-target>: here <i #target> parent node is a query
            // host node;
            // - <needs-target><ng-template [ngIf]="true"><i #target></i></ng-template></needs-target>:
            // here <i #target> parent node is null;
            // - <needs-target><ng-container><i #target></i></ng-container></needs-target>: here we need
            // to go past `<ng-container>` to determine <i #target> parent node (but we shouldn't traverse
            // up past the query's host node!).
            while (parent !== null && (parent.type & 8 /* TNodeType.ElementContainer */) &&
                parent.index !== declarationNodeIdx) {
                parent = parent.parent;
            }
            return declarationNodeIdx === (parent !== null ? parent.index : -1);
        }
        return this._appliesToNextNode;
    }
    matchTNode(tView, tNode) {
        const predicate = this.metadata.predicate;
        if (Array.isArray(predicate)) {
            for (let i = 0; i < predicate.length; i++) {
                const name = predicate[i];
                this.matchTNodeWithReadOption(tView, tNode, getIdxOfMatchingSelector(tNode, name));
                // Also try matching the name to a provider since strings can be used as DI tokens too.
                this.matchTNodeWithReadOption(tView, tNode, locateDirectiveOrProvider(tNode, tView, name, false, false));
            }
        }
        else {
            if (predicate === ViewEngine_TemplateRef) {
                if (tNode.type & 4 /* TNodeType.Container */) {
                    this.matchTNodeWithReadOption(tView, tNode, -1);
                }
            }
            else {
                this.matchTNodeWithReadOption(tView, tNode, locateDirectiveOrProvider(tNode, tView, predicate, false, false));
            }
        }
    }
    matchTNodeWithReadOption(tView, tNode, nodeMatchIdx) {
        if (nodeMatchIdx !== null) {
            const read = this.metadata.read;
            if (read !== null) {
                if (read === ViewEngine_ElementRef || read === ViewContainerRef ||
                    read === ViewEngine_TemplateRef && (tNode.type & 4 /* TNodeType.Container */)) {
                    this.addMatch(tNode.index, -2);
                }
                else {
                    const directiveOrProviderIdx = locateDirectiveOrProvider(tNode, tView, read, false, false);
                    if (directiveOrProviderIdx !== null) {
                        this.addMatch(tNode.index, directiveOrProviderIdx);
                    }
                }
            }
            else {
                this.addMatch(tNode.index, nodeMatchIdx);
            }
        }
    }
    addMatch(tNodeIdx, matchIdx) {
        if (this.matches === null) {
            this.matches = [tNodeIdx, matchIdx];
        }
        else {
            this.matches.push(tNodeIdx, matchIdx);
        }
    }
}
/**
 * Iterates over local names for a given node and returns directive index
 * (or -1 if a local name points to an element).
 *
 * @param tNode static data of a node to check
 * @param selector selector to match
 * @returns directive index, -1 or null if a selector didn't match any of the local names
 */
function getIdxOfMatchingSelector(tNode, selector) {
    const localNames = tNode.localNames;
    if (localNames !== null) {
        for (let i = 0; i < localNames.length; i += 2) {
            if (localNames[i] === selector) {
                return localNames[i + 1];
            }
        }
    }
    return null;
}
function createResultByTNodeType(tNode, currentView) {
    if (tNode.type & (3 /* TNodeType.AnyRNode */ | 8 /* TNodeType.ElementContainer */)) {
        return createElementRef(tNode, currentView);
    }
    else if (tNode.type & 4 /* TNodeType.Container */) {
        return createTemplateRef(tNode, currentView);
    }
    return null;
}
function createResultForNode(lView, tNode, matchingIdx, read) {
    if (matchingIdx === -1) {
        // if read token and / or strategy is not specified, detect it using appropriate tNode type
        return createResultByTNodeType(tNode, lView);
    }
    else if (matchingIdx === -2) {
        // read a special token from a node injector
        return createSpecialToken(lView, tNode, read);
    }
    else {
        // read a token
        return getNodeInjectable(lView, lView[TVIEW], matchingIdx, tNode);
    }
}
function createSpecialToken(lView, tNode, read) {
    if (read === ViewEngine_ElementRef) {
        return createElementRef(tNode, lView);
    }
    else if (read === ViewEngine_TemplateRef) {
        return createTemplateRef(tNode, lView);
    }
    else if (read === ViewContainerRef) {
        ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */);
        return createContainerRef(tNode, lView);
    }
    else {
        ngDevMode &&
            throwError(`Special token to read should be one of ElementRef, TemplateRef or ViewContainerRef but got ${stringify(read)}.`);
    }
}
/**
 * A helper function that creates query results for a given view. This function is meant to do the
 * processing once and only once for a given view instance (a set of results for a given view
 * doesn't change).
 */
export function materializeViewResults(tView, lView, tQuery, queryIndex) {
    const lQuery = lView[QUERIES].queries[queryIndex];
    if (lQuery.matches === null) {
        const tViewData = tView.data;
        const tQueryMatches = tQuery.matches;
        const result = [];
        for (let i = 0; i < tQueryMatches.length; i += 2) {
            const matchedNodeIdx = tQueryMatches[i];
            if (matchedNodeIdx < 0) {
                // we at the <ng-template> marker which might have results in views created based on this
                // <ng-template> - those results will be in separate views though, so here we just leave
                // null as a placeholder
                result.push(null);
            }
            else {
                ngDevMode && assertIndexInRange(tViewData, matchedNodeIdx);
                const tNode = tViewData[matchedNodeIdx];
                result.push(createResultForNode(lView, tNode, tQueryMatches[i + 1], tQuery.metadata.read));
            }
        }
        lQuery.matches = result;
    }
    return lQuery.matches;
}
/**
 * A helper function that collects (already materialized) query results from a tree of views,
 * starting with a provided LView.
 */
export function collectQueryResults(tView, lView, queryIndex, result) {
    const tQuery = tView.queries.getByIndex(queryIndex);
    const tQueryMatches = tQuery.matches;
    if (tQueryMatches !== null) {
        const lViewResults = materializeViewResults(tView, lView, tQuery, queryIndex);
        for (let i = 0; i < tQueryMatches.length; i += 2) {
            const tNodeIdx = tQueryMatches[i];
            if (tNodeIdx > 0) {
                result.push(lViewResults[i / 2]);
            }
            else {
                const childQueryIndex = tQueryMatches[i + 1];
                const declarationLContainer = lView[-tNodeIdx];
                ngDevMode && assertLContainer(declarationLContainer);
                // collect matches for views inserted in this container
                for (let i = CONTAINER_HEADER_OFFSET; i < declarationLContainer.length; i++) {
                    const embeddedLView = declarationLContainer[i];
                    if (embeddedLView[DECLARATION_LCONTAINER] === embeddedLView[PARENT]) {
                        collectQueryResults(embeddedLView[TVIEW], embeddedLView, childQueryIndex, result);
                    }
                }
                // collect matches for views created from this declaration container and inserted into
                // different containers
                if (declarationLContainer[MOVED_VIEWS] !== null) {
                    const embeddedLViews = declarationLContainer[MOVED_VIEWS];
                    for (let i = 0; i < embeddedLViews.length; i++) {
                        const embeddedLView = embeddedLViews[i];
                        collectQueryResults(embeddedLView[TVIEW], embeddedLView, childQueryIndex, result);
                    }
                }
            }
        }
    }
    return result;
}
export function loadQueryInternal(lView, queryIndex) {
    ngDevMode &&
        assertDefined(lView[QUERIES], 'LQueries should be defined when trying to load a query');
    ngDevMode && assertIndexInRange(lView[QUERIES].queries, queryIndex);
    return lView[QUERIES].queries[queryIndex].queryList;
}
export function createLQuery(tView, lView, flags) {
    const queryList = new QueryList((flags & 4 /* QueryFlags.emitDistinctChangesOnly */) === 4 /* QueryFlags.emitDistinctChangesOnly */);
    storeCleanupWithContext(tView, lView, queryList, queryList.destroy);
    if (lView[QUERIES] === null)
        lView[QUERIES] = new LQueries_();
    lView[QUERIES].queries.push(new LQuery_(queryList));
}
export function createTQuery(tView, metadata, nodeIndex) {
    if (tView.queries === null)
        tView.queries = new TQueries_();
    tView.queries.track(new TQuery_(metadata, nodeIndex));
}
export function saveContentQueryAndDirectiveIndex(tView, directiveIndex) {
    const tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
    const lastSavedDirectiveIndex = tViewContentQueries.length ? tViewContentQueries[tViewContentQueries.length - 1] : -1;
    if (directiveIndex !== lastSavedDirectiveIndex) {
        tViewContentQueries.push(tView.queries.length - 1, directiveIndex);
    }
}
export function getTQuery(tView, index) {
    ngDevMode && assertDefined(tView.queries, 'TQueries must be defined to retrieve a TQuery');
    return tView.queries.getByIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0UsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLHVCQUF1QixFQUFjLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3hGLE9BQU8sRUFBQyxzQkFBc0IsRUFBUyxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFOUMsTUFBTSxPQUFPO0lBRVgsWUFBbUIsU0FBdUI7UUFBdkIsY0FBUyxHQUFULFNBQVMsQ0FBYztRQUQxQyxZQUFPLEdBQW9CLElB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QUFNLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUYsSUFBSSxjQUFjLEtBQUssdUJBQXVCLEVBQUUsQ0FBQztRQUMvQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFZLEVBQUUsS0FBYTtJQUNuRCxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsK0NBQStDLENBQUMsQ0FBQztJQUMzRixPQUFPLEtBQUssQ0FBQyxPQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtQcm92aWRlclRva2VufSBmcm9tICcuLi9kaS9wcm92aWRlcl90b2tlbic7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIEVsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlci9xdWVyeV9saXN0JztcbmltcG9ydCB7Y3JlYXRlVGVtcGxhdGVSZWYsIFRlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtjcmVhdGVDb250YWluZXJSZWYsIFZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRJbmRleEluUmFuZ2UsIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7YXNzZXJ0Rmlyc3RDcmVhdGVQYXNzLCBhc3NlcnRMQ29udGFpbmVyfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7c3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgTFF1ZXJ5LCBRdWVyeUZsYWdzLCBUUXVlcmllcywgVFF1ZXJ5LCBUUXVlcnlNZXRhZGF0YX0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7REVDTEFSQVRJT05fTENPTlRBSU5FUiwgTFZpZXcsIFBBUkVOVCwgUVVFUklFUywgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5cbmNsYXNzIExRdWVyeV88VD4gaW1wbGVtZW50cyBMUXVlcnk8VD4ge1xuICBtYXRjaGVzOiAoVHxudWxsKVtdfG51bGwgPSBudWxsO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4pIHt9XG4gIGNsb25lKCk6IExRdWVyeTxUPiB7XG4gICAgcmV0dXJuIG5ldyBMUXVlcnlfKHRoaXMucXVlcnlMaXN0KTtcbiAgfVxuICBzZXREaXJ0eSgpOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXJ5TGlzdC5zZXREaXJ0eSgpO1xuICB9XG59XG5cbmNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXSkge31cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcodFZpZXc6IFRWaWV3KTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3QgdFF1ZXJpZXMgPSB0Vmlldy5xdWVyaWVzO1xuICAgIGlmICh0UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgbm9PZkluaGVyaXRlZFF1ZXJpZXMgPVxuICAgICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsID8gdFZpZXcuY29udGVudFF1ZXJpZXNbMF0gOiB0UXVlcmllcy5sZW5ndGg7XG4gICAgICBjb25zdCB2aWV3TFF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXTtcblxuICAgICAgLy8gQW4gZW1iZWRkZWQgdmlldyBoYXMgcXVlcmllcyBwcm9wYWdhdGVkIGZyb20gYSBkZWNsYXJhdGlvbiB2aWV3IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gICAgICAvLyBUUXVlcmllcyBjb2xsZWN0aW9uIGFuZCB1cCB1bnRpbCBhIGZpcnN0IGNvbnRlbnQgcXVlcnkgZGVjbGFyZWQgaW4gdGhlIGVtYmVkZGVkIHZpZXcuIE9ubHlcbiAgICAgIC8vIHByb3BhZ2F0ZWQgTFF1ZXJpZXMgYXJlIGNyZWF0ZWQgYXQgdGhpcyBwb2ludCAoTFF1ZXJ5IGNvcnJlc3BvbmRpbmcgdG8gZGVjbGFyZWQgY29udGVudFxuICAgICAgLy8gcXVlcmllcyB3aWxsIGJlIGluc3RhbnRpYXRlZCBmcm9tIHRoZSBjb250ZW50IHF1ZXJ5IGluc3RydWN0aW9ucyBmb3IgZWFjaCBkaXJlY3RpdmUpLlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mSW5oZXJpdGVkUXVlcmllczsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHRRdWVyeSA9IHRRdWVyaWVzLmdldEJ5SW5kZXgoaSk7XG4gICAgICAgIGNvbnN0IHBhcmVudExRdWVyeSA9IHRoaXMucXVlcmllc1t0UXVlcnkuaW5kZXhJbkRlY2xhcmF0aW9uVmlld107XG4gICAgICAgIHZpZXdMUXVlcmllcy5wdXNoKHBhcmVudExRdWVyeS5jbG9uZSgpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBMUXVlcmllc18odmlld0xRdWVyaWVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcodFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gICAgdGhpcy5kaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0Vmlldyk7XG4gIH1cblxuICBkZXRhY2hWaWV3KHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICAgIHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBkaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0VmlldzogVFZpZXcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGdldFRRdWVyeSh0VmlldywgaSkubWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnF1ZXJpZXNbaV0uc2V0RGlydHkoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRRdWVyeU1ldGFkYXRhXyBpbXBsZW1lbnRzIFRRdWVyeU1ldGFkYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcHJlZGljYXRlOiBQcm92aWRlclRva2VuPHVua25vd24+fHN0cmluZ1tdLCBwdWJsaWMgZmxhZ3M6IFF1ZXJ5RmxhZ3MsXG4gICAgICBwdWJsaWMgcmVhZDogYW55ID0gbnVsbCkge31cbn1cblxuY2xhc3MgVFF1ZXJpZXNfIGltcGxlbWVudHMgVFF1ZXJpZXMge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHF1ZXJpZXM6IFRRdWVyeVtdID0gW10pIHt9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnF1ZXJpZXNbaV0uZWxlbWVudEVuZCh0Tm9kZSk7XG4gICAgfVxuICB9XG4gIGVtYmVkZGVkVFZpZXcodE5vZGU6IFROb2RlKTogVFF1ZXJpZXN8bnVsbCB7XG4gICAgbGV0IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZjogVFF1ZXJ5W118bnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNoaWxkUXVlcnlJbmRleCA9IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5sZW5ndGggOiAwO1xuICAgICAgY29uc3QgdHF1ZXJ5Q2xvbmUgPSB0aGlzLmdldEJ5SW5kZXgoaSkuZW1iZWRkZWRUVmlldyh0Tm9kZSwgY2hpbGRRdWVyeUluZGV4KTtcblxuICAgICAgaWYgKHRxdWVyeUNsb25lKSB7XG4gICAgICAgIHRxdWVyeUNsb25lLmluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSBpO1xuICAgICAgICBpZiAocXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsKSB7XG4gICAgICAgICAgcXVlcmllc0ZvclRlbXBsYXRlUmVmLnB1c2godHF1ZXJ5Q2xvbmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiA9IFt0cXVlcnlDbG9uZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsID8gbmV3IFRRdWVyaWVzXyhxdWVyaWVzRm9yVGVtcGxhdGVSZWYpIDogbnVsbDtcbiAgfVxuXG4gIHRlbXBsYXRlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLnRlbXBsYXRlKHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QnlJbmRleChpbmRleDogbnVtYmVyKTogVFF1ZXJ5IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKHRoaXMucXVlcmllcywgaW5kZXgpO1xuICAgIHJldHVybiB0aGlzLnF1ZXJpZXNbaW5kZXhdO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnF1ZXJpZXMubGVuZ3RoO1xuICB9XG5cbiAgdHJhY2sodHF1ZXJ5OiBUUXVlcnkpOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXJpZXMucHVzaCh0cXVlcnkpO1xuICB9XG59XG5cbmNsYXNzIFRRdWVyeV8gaW1wbGVtZW50cyBUUXVlcnkge1xuICBtYXRjaGVzOiBudW1iZXJbXXxudWxsID0gbnVsbDtcbiAgaW5kZXhJbkRlY2xhcmF0aW9uVmlldyA9IC0xO1xuICBjcm9zc2VzTmdUZW1wbGF0ZSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBBIG5vZGUgaW5kZXggb24gd2hpY2ggYSBxdWVyeSB3YXMgZGVjbGFyZWQgKC0xIGZvciB2aWV3IHF1ZXJpZXMgYW5kIG9uZXMgaW5oZXJpdGVkIGZyb20gdGhlXG4gICAqIGRlY2xhcmF0aW9uIHRlbXBsYXRlKS4gV2UgdXNlIHRoaXMgaW5kZXggKGFsb25nc2lkZSB3aXRoIF9hcHBsaWVzVG9OZXh0Tm9kZSBmbGFnKSB0byBrbm93XG4gICAqIHdoZW4gdG8gYXBwbHkgY29udGVudCBxdWVyaWVzIHRvIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbk5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIGZsYWcgaW5kaWNhdGluZyBpZiBhIGdpdmVuIHF1ZXJ5IHN0aWxsIGFwcGxpZXMgdG8gbm9kZXMgaXQgaXMgY3Jvc3NpbmcuIFdlIHVzZSB0aGlzIGZsYWdcbiAgICogKGFsb25nc2lkZSB3aXRoIF9kZWNsYXJhdGlvbk5vZGVJbmRleCkgdG8ga25vdyB3aGVuIHRvIHN0b3AgYXBwbHlpbmcgY29udGVudCBxdWVyaWVzIHRvXG4gICAqIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9hcHBsaWVzVG9OZXh0Tm9kZSA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIG1ldGFkYXRhOiBUUXVlcnlNZXRhZGF0YSwgbm9kZUluZGV4OiBudW1iZXIgPSAtMSkge1xuICAgIHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID0gbm9kZUluZGV4O1xuICB9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMubWF0Y2hUTm9kZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGVsZW1lbnRFbmQodE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID09PSB0Tm9kZS5pbmRleCkge1xuICAgICAgdGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudFN0YXJ0KHRWaWV3LCB0Tm9kZSk7XG4gIH1cblxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSwgY2hpbGRRdWVyeUluZGV4OiBudW1iZXIpOiBUUXVlcnl8bnVsbCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMuY3Jvc3Nlc05nVGVtcGxhdGUgPSB0cnVlO1xuICAgICAgLy8gQSBtYXJrZXIgaW5kaWNhdGluZyBhIGA8bmctdGVtcGxhdGU+YCBlbGVtZW50IChhIHBsYWNlaG9sZGVyIGZvciBxdWVyeSByZXN1bHRzIGZyb21cbiAgICAgIC8vIGVtYmVkZGVkIHZpZXdzIGNyZWF0ZWQgYmFzZWQgb24gdGhpcyBgPG5nLXRlbXBsYXRlPmApLlxuICAgICAgdGhpcy5hZGRNYXRjaCgtdE5vZGUuaW5kZXgsIGNoaWxkUXVlcnlJbmRleCk7XG4gICAgICByZXR1cm4gbmV3IFRRdWVyeV8odGhpcy5tZXRhZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0FwcGx5aW5nVG9Ob2RlKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZSAmJlxuICAgICAgICAodGhpcy5tZXRhZGF0YS5mbGFncyAmIFF1ZXJ5RmxhZ3MuZGVzY2VuZGFudHMpICE9PSBRdWVyeUZsYWdzLmRlc2NlbmRhbnRzKSB7XG4gICAgICBjb25zdCBkZWNsYXJhdGlvbk5vZGVJZHggPSB0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleDtcbiAgICAgIGxldCBwYXJlbnQgPSB0Tm9kZS5wYXJlbnQ7XG4gICAgICAvLyBEZXRlcm1pbmUgaWYgYSBnaXZlbiBUTm9kZSBpcyBhIFwiZGlyZWN0XCIgY2hpbGQgb2YgYSBub2RlIG9uIHdoaWNoIGEgY29udGVudCBxdWVyeSB3YXNcbiAgICAgIC8vIGRlY2xhcmVkIChvbmx5IGRpcmVjdCBjaGlsZHJlbiBvZiBxdWVyeSdzIGhvc3Qgbm9kZSBjYW4gbWF0Y2ggd2l0aCB0aGUgZGVzY2VuZGFudHM6IGZhbHNlXG4gICAgICAvLyBvcHRpb24pLiBUaGVyZSBhcmUgMyBtYWluIHVzZS1jYXNlIC8gY29uZGl0aW9ucyB0byBjb25zaWRlciBoZXJlOlxuICAgICAgLy8gLSA8bmVlZHMtdGFyZ2V0PjxpICN0YXJnZXQ+PC9pPjwvbmVlZHMtdGFyZ2V0PjogaGVyZSA8aSAjdGFyZ2V0PiBwYXJlbnQgbm9kZSBpcyBhIHF1ZXJ5XG4gICAgICAvLyBob3N0IG5vZGU7XG4gICAgICAvLyAtIDxuZWVkcy10YXJnZXQ+PG5nLXRlbXBsYXRlIFtuZ0lmXT1cInRydWVcIj48aSAjdGFyZ2V0PjwvaT48L25nLXRlbXBsYXRlPjwvbmVlZHMtdGFyZ2V0PjpcbiAgICAgIC8vIGhlcmUgPGkgI3RhcmdldD4gcGFyZW50IG5vZGUgaXMgbnVsbDtcbiAgICAgIC8vIC0gPG5lZWRzLXRhcmdldD48bmctY29udGFpbmVyPjxpICN0YXJnZXQ+PC9pPjwvbmctY29udGFpbmVyPjwvbmVlZHMtdGFyZ2V0PjogaGVyZSB3ZSBuZWVkXG4gICAgICAvLyB0byBnbyBwYXN0IGA8bmctY29udGFpbmVyPmAgdG8gZGV0ZXJtaW5lIDxpICN0YXJnZXQ+IHBhcmVudCBub2RlIChidXQgd2Ugc2hvdWxkbid0IHRyYXZlcnNlXG4gICAgICAvLyB1cCBwYXN0IHRoZSBxdWVyeSdzIGhvc3Qgbm9kZSEpLlxuICAgICAgd2hpbGUgKHBhcmVudCAhPT0gbnVsbCAmJiAocGFyZW50LnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikgJiZcbiAgICAgICAgICAgICBwYXJlbnQuaW5kZXggIT09IGRlY2xhcmF0aW9uTm9kZUlkeCkge1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlY2xhcmF0aW9uTm9kZUlkeCA9PT0gKHBhcmVudCAhPT0gbnVsbCA/IHBhcmVudC5pbmRleCA6IC0xKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2FwcGxpZXNUb05leHROb2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaFROb2RlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gdGhpcy5tZXRhZGF0YS5wcmVkaWNhdGU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJlZGljYXRlKSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVkaWNhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IHByZWRpY2F0ZVtpXTtcbiAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXcsIHROb2RlLCBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIG5hbWUpKTtcbiAgICAgICAgLy8gQWxzbyB0cnkgbWF0Y2hpbmcgdGhlIG5hbWUgdG8gYSBwcm92aWRlciBzaW5jZSBzdHJpbmdzIGNhbiBiZSB1c2VkIGFzIERJIHRva2VucyB0b28uXG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKFxuICAgICAgICAgICAgdFZpZXcsIHROb2RlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgbmFtZSwgZmFsc2UsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICgocHJlZGljYXRlIGFzIGFueSkgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICAgICAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXcsIHROb2RlLCAtMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKFxuICAgICAgICAgICAgdFZpZXcsIHROb2RlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgcHJlZGljYXRlLCBmYWxzZSwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbm9kZU1hdGNoSWR4OiBudW1iZXJ8bnVsbCk6IHZvaWQge1xuICAgIGlmIChub2RlTWF0Y2hJZHggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHJlYWQgPSB0aGlzLm1ldGFkYXRhLnJlYWQ7XG4gICAgICBpZiAocmVhZCAhPT0gbnVsbCkge1xuICAgICAgICBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9FbGVtZW50UmVmIHx8IHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYgfHxcbiAgICAgICAgICAgIHJlYWQgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYgJiYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQ29udGFpbmVyKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIC0yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVPclByb3ZpZGVySWR4ID1cbiAgICAgICAgICAgICAgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHJlYWQsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgbm9kZU1hdGNoSWR4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFkZE1hdGNoKHROb2RlSWR4OiBudW1iZXIsIG1hdGNoSWR4OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgICB0aGlzLm1hdGNoZXMgPSBbdE5vZGVJZHgsIG1hdGNoSWR4XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tYXRjaGVzLnB1c2godE5vZGVJZHgsIG1hdGNoSWR4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYW55IHtcbiAgaWYgKHROb2RlLnR5cGUgJiAoVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYodE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZih0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIG1hdGNoaW5nSWR4OiBudW1iZXIsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGlmIChtYXRjaGluZ0lkeCA9PT0gLTEpIHtcbiAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIGRldGVjdCBpdCB1c2luZyBhcHByb3ByaWF0ZSB0Tm9kZSB0eXBlXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAobWF0Y2hpbmdJZHggPT09IC0yKSB7XG4gICAgLy8gcmVhZCBhIHNwZWNpYWwgdG9rZW4gZnJvbSBhIG5vZGUgaW5qZWN0b3JcbiAgICByZXR1cm4gY3JlYXRlU3BlY2lhbFRva2VuKGxWaWV3LCB0Tm9kZSwgcmVhZCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gcmVhZCBhIHRva2VuXG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCBsVmlld1tUVklFV10sIG1hdGNoaW5nSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNwZWNpYWxUb2tlbihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgcmVhZDogYW55KTogYW55IHtcbiAgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZih0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyKTtcbiAgICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgYFNwZWNpYWwgdG9rZW4gdG8gcmVhZCBzaG91bGQgYmUgb25lIG9mIEVsZW1lbnRSZWYsIFRlbXBsYXRlUmVmIG9yIFZpZXdDb250YWluZXJSZWYgYnV0IGdvdCAke1xuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShyZWFkKX0uYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgcXVlcnkgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3LiBUaGlzIGZ1bmN0aW9uIGlzIG1lYW50IHRvIGRvIHRoZVxuICogcHJvY2Vzc2luZyBvbmNlIGFuZCBvbmx5IG9uY2UgZm9yIGEgZ2l2ZW4gdmlldyBpbnN0YW5jZSAoYSBzZXQgb2YgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3XG4gKiBkb2Vzbid0IGNoYW5nZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0UXVlcnk6IFRRdWVyeSwgcXVlcnlJbmRleDogbnVtYmVyKTogKFR8bnVsbClbXSB7XG4gIGNvbnN0IGxRdWVyeSA9IGxWaWV3W1FVRVJJRVNdIS5xdWVyaWVzIVtxdWVyeUluZGV4XTtcbiAgaWYgKGxRdWVyeS5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgY29uc3QgdFZpZXdEYXRhID0gdFZpZXcuZGF0YTtcbiAgICBjb25zdCB0UXVlcnlNYXRjaGVzID0gdFF1ZXJ5Lm1hdGNoZXMhO1xuICAgIGNvbnN0IHJlc3VsdDogVHxudWxsW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRRdWVyeU1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IG1hdGNoZWROb2RlSWR4ID0gdFF1ZXJ5TWF0Y2hlc1tpXTtcbiAgICAgIGlmIChtYXRjaGVkTm9kZUlkeCA8IDApIHtcbiAgICAgICAgLy8gd2UgYXQgdGhlIDxuZy10ZW1wbGF0ZT4gbWFya2VyIHdoaWNoIG1pZ2h0IGhhdmUgcmVzdWx0cyBpbiB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXNcbiAgICAgICAgLy8gPG5nLXRlbXBsYXRlPiAtIHRob3NlIHJlc3VsdHMgd2lsbCBiZSBpbiBzZXBhcmF0ZSB2aWV3cyB0aG91Z2gsIHNvIGhlcmUgd2UganVzdCBsZWF2ZVxuICAgICAgICAvLyBudWxsIGFzIGEgcGxhY2Vob2xkZXJcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKHRWaWV3RGF0YSwgbWF0Y2hlZE5vZGVJZHgpO1xuICAgICAgICBjb25zdCB0Tm9kZSA9IHRWaWV3RGF0YVttYXRjaGVkTm9kZUlkeF0gYXMgVE5vZGU7XG4gICAgICAgIHJlc3VsdC5wdXNoKGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXcsIHROb2RlLCB0UXVlcnlNYXRjaGVzW2kgKyAxXSwgdFF1ZXJ5Lm1ldGFkYXRhLnJlYWQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbFF1ZXJ5Lm1hdGNoZXMgPSByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbFF1ZXJ5Lm1hdGNoZXM7XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCBjb2xsZWN0cyAoYWxyZWFkeSBtYXRlcmlhbGl6ZWQpIHF1ZXJ5IHJlc3VsdHMgZnJvbSBhIHRyZWUgb2Ygdmlld3MsXG4gKiBzdGFydGluZyB3aXRoIGEgcHJvdmlkZWQgTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UXVlcnlSZXN1bHRzPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBxdWVyeUluZGV4OiBudW1iZXIsIHJlc3VsdDogVFtdKTogVFtdIHtcbiAgY29uc3QgdFF1ZXJ5ID0gdFZpZXcucXVlcmllcyEuZ2V0QnlJbmRleChxdWVyeUluZGV4KTtcbiAgY29uc3QgdFF1ZXJ5TWF0Y2hlcyA9IHRRdWVyeS5tYXRjaGVzO1xuICBpZiAodFF1ZXJ5TWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxWaWV3UmVzdWx0cyA9IG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4odFZpZXcsIGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0UXVlcnlNYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCB0Tm9kZUlkeCA9IHRRdWVyeU1hdGNoZXNbaV07XG4gICAgICBpZiAodE5vZGVJZHggPiAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGxWaWV3UmVzdWx0c1tpIC8gMl0gYXMgVCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSB0UXVlcnlNYXRjaGVzW2kgKyAxXTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1stdE5vZGVJZHhdIGFzIExDb250YWluZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uTENvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBpbnNlcnRlZCBpbiB0aGlzIGNvbnRhaW5lclxuICAgICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBkZWNsYXJhdGlvbkxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW2ldO1xuICAgICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdID09PSBlbWJlZGRlZExWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld1tUVklFV10sIGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGlzIGRlY2xhcmF0aW9uIGNvbnRhaW5lciBhbmQgaW5zZXJ0ZWQgaW50b1xuICAgICAgICAvLyBkaWZmZXJlbnQgY29udGFpbmVyc1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXdzID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbWJlZGRlZExWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGVtYmVkZGVkTFZpZXdzW2ldO1xuICAgICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyhlbWJlZGRlZExWaWV3W1RWSUVXXSwgZW1iZWRkZWRMVmlldywgY2hpbGRRdWVyeUluZGV4LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUludGVybmFsPFQ+KGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGxWaWV3W1FVRVJJRVNdLCAnTFF1ZXJpZXMgc2hvdWxkIGJlIGRlZmluZWQgd2hlbiB0cnlpbmcgdG8gbG9hZCBhIHF1ZXJ5Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXdbUVVFUklFU10hLnF1ZXJpZXMsIHF1ZXJ5SW5kZXgpO1xuICByZXR1cm4gbFZpZXdbUVVFUklFU10hLnF1ZXJpZXNbcXVlcnlJbmRleF0ucXVlcnlMaXN0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFF1ZXJ5PFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBmbGFnczogUXVlcnlGbGFncykge1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KFxuICAgICAgKGZsYWdzICYgUXVlcnlGbGFncy5lbWl0RGlzdGluY3RDaGFuZ2VzT25seSkgPT09IFF1ZXJ5RmxhZ3MuZW1pdERpc3RpbmN0Q2hhbmdlc09ubHkpO1xuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh0VmlldywgbFZpZXcsIHF1ZXJ5TGlzdCwgcXVlcnlMaXN0LmRlc3Ryb3kpO1xuXG4gIGlmIChsVmlld1tRVUVSSUVTXSA9PT0gbnVsbCkgbFZpZXdbUVVFUklFU10gPSBuZXcgTFF1ZXJpZXNfKCk7XG4gIGxWaWV3W1FVRVJJRVNdIS5xdWVyaWVzLnB1c2gobmV3IExRdWVyeV8ocXVlcnlMaXN0KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUUXVlcnkodFZpZXc6IFRWaWV3LCBtZXRhZGF0YTogVFF1ZXJ5TWV0YWRhdGEsIG5vZGVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGlmICh0Vmlldy5xdWVyaWVzID09PSBudWxsKSB0Vmlldy5xdWVyaWVzID0gbmV3IFRRdWVyaWVzXygpO1xuICB0Vmlldy5xdWVyaWVzLnRyYWNrKG5ldyBUUXVlcnlfKG1ldGFkYXRhLCBub2RlSW5kZXgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldzogVFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgdFZpZXdDb250ZW50UXVlcmllcy5sZW5ndGggPyB0Vmlld0NvbnRlbnRRdWVyaWVzW3RWaWV3Q29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMV0gOiAtMTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ICE9PSBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCkge1xuICAgIHRWaWV3Q29udGVudFF1ZXJpZXMucHVzaCh0Vmlldy5xdWVyaWVzIS5sZW5ndGggLSAxLCBkaXJlY3RpdmVJbmRleCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRRdWVyeSh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIpOiBUUXVlcnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Vmlldy5xdWVyaWVzLCAnVFF1ZXJpZXMgbXVzdCBiZSBkZWZpbmVkIHRvIHJldHJpZXZlIGEgVFF1ZXJ5Jyk7XG4gIHJldHVybiB0Vmlldy5xdWVyaWVzIS5nZXRCeUluZGV4KGluZGV4KTtcbn1cbiJdfQ==