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
import { assertDefined, assertIndexInRange, assertNumber, throwError } from '../util/assert';
import { stringify } from '../util/stringify';
import { assertFirstCreatePass, assertLContainer } from './assert';
import { getNodeInjectable, locateDirectiveOrProvider } from './di';
import { storeCleanupWithContext } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET, MOVED_VIEWS } from './interfaces/container';
import { DECLARATION_LCONTAINER, PARENT, QUERIES, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { getCurrentTNode, getLView, getTView } from './state';
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
        this.flags = flags;
        this.read = read;
        // Compiler might not be able to pre-optimize and split multiple selectors.
        if (typeof predicate === 'string') {
            this.predicate = splitQueryMultiSelectors(predicate);
        }
        else {
            this.predicate = predicate;
        }
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
/**
 * Creates a new instance of LQuery and returns its index in the collection of LQuery objects.
 *
 * @returns index in the collection of LQuery objects
 */
function createLQuery(tView, lView, flags) {
    const queryList = new QueryList((flags & 4 /* QueryFlags.emitDistinctChangesOnly */) === 4 /* QueryFlags.emitDistinctChangesOnly */);
    storeCleanupWithContext(tView, lView, queryList, queryList.destroy);
    const lQueries = (lView[QUERIES] ??= new LQueries_()).queries;
    return lQueries.push(new LQuery_(queryList)) - 1;
}
export function createViewQuery(predicate, flags, read) {
    ngDevMode && assertNumber(flags, 'Expecting flags');
    const tView = getTView();
    if (tView.firstCreatePass) {
        createTQuery(tView, new TQueryMetadata_(predicate, flags, read), -1);
        if ((flags & 2 /* QueryFlags.isStatic */) === 2 /* QueryFlags.isStatic */) {
            tView.staticViewQueries = true;
        }
    }
    return createLQuery(tView, getLView(), flags);
}
export function createContentQuery(directiveIndex, predicate, flags, read) {
    ngDevMode && assertNumber(flags, 'Expecting flags');
    const tView = getTView();
    if (tView.firstCreatePass) {
        const tNode = getCurrentTNode();
        createTQuery(tView, new TQueryMetadata_(predicate, flags, read), tNode.index);
        saveContentQueryAndDirectiveIndex(tView, directiveIndex);
        if ((flags & 2 /* QueryFlags.isStatic */) === 2 /* QueryFlags.isStatic */) {
            tView.staticContentQueries = true;
        }
    }
    return createLQuery(tView, getLView(), flags);
}
/** Splits multiple selectors in the locator. */
function splitQueryMultiSelectors(locator) {
    return locator.split(',').map(s => s.trim());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzNGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDakUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHlCQUF5QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xFLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzlELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUd4RixPQUFPLEVBQUMsc0JBQXNCLEVBQVMsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUMvRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU1RCxN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LyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7UHJvdmlkZXJUb2tlbn0gZnJvbSAnLi4vZGkvcHJvdmlkZXJfdG9rZW4nO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50UmVmLCBFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge2NyZWF0ZVRlbXBsYXRlUmVmLCBUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Y3JlYXRlQ29udGFpbmVyUmVmLCBWaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0SW5kZXhJblJhbmdlLCBhc3NlcnROdW1iZXIsIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7YXNzZXJ0Rmlyc3RDcmVhdGVQYXNzLCBhc3NlcnRMQ29udGFpbmVyfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7c3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgTFF1ZXJ5LCBRdWVyeUZsYWdzLCBUUXVlcmllcywgVFF1ZXJ5LCBUUXVlcnlNZXRhZGF0YX0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7REVDTEFSQVRJT05fTENPTlRBSU5FUiwgTFZpZXcsIFBBUkVOVCwgUVVFUklFUywgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGdldFRWaWV3fSBmcm9tICcuL3N0YXRlJztcblxuY2xhc3MgTFF1ZXJ5XzxUPiBpbXBsZW1lbnRzIExRdWVyeTxUPiB7XG4gIG1hdGNoZXM6IChUfG51bGwpW118bnVsbCA9IG51bGw7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPikge31cbiAgY2xvbmUoKTogTFF1ZXJ5PFQ+IHtcbiAgICByZXR1cm4gbmV3IExRdWVyeV8odGhpcy5xdWVyeUxpc3QpO1xuICB9XG4gIHNldERpcnR5KCk6IHZvaWQge1xuICAgIHRoaXMucXVlcnlMaXN0LnNldERpcnR5KCk7XG4gIH1cbn1cblxuY2xhc3MgTFF1ZXJpZXNfIGltcGxlbWVudHMgTFF1ZXJpZXMge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcmllczogTFF1ZXJ5PGFueT5bXSA9IFtdKSB7fVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldyh0VmlldzogVFZpZXcpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCB0UXVlcmllcyA9IHRWaWV3LnF1ZXJpZXM7XG4gICAgaWYgKHRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBub09mSW5oZXJpdGVkUXVlcmllcyA9XG4gICAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMgIT09IG51bGwgPyB0Vmlldy5jb250ZW50UXVlcmllc1swXSA6IHRRdWVyaWVzLmxlbmd0aDtcbiAgICAgIGNvbnN0IHZpZXdMUXVlcmllczogTFF1ZXJ5PGFueT5bXSA9IFtdO1xuXG4gICAgICAvLyBBbiBlbWJlZGRlZCB2aWV3IGhhcyBxdWVyaWVzIHByb3BhZ2F0ZWQgZnJvbSBhIGRlY2xhcmF0aW9uIHZpZXcgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGVcbiAgICAgIC8vIFRRdWVyaWVzIGNvbGxlY3Rpb24gYW5kIHVwIHVudGlsIGEgZmlyc3QgY29udGVudCBxdWVyeSBkZWNsYXJlZCBpbiB0aGUgZW1iZWRkZWQgdmlldy4gT25seVxuICAgICAgLy8gcHJvcGFnYXRlZCBMUXVlcmllcyBhcmUgY3JlYXRlZCBhdCB0aGlzIHBvaW50IChMUXVlcnkgY29ycmVzcG9uZGluZyB0byBkZWNsYXJlZCBjb250ZW50XG4gICAgICAvLyBxdWVyaWVzIHdpbGwgYmUgaW5zdGFudGlhdGVkIGZyb20gdGhlIGNvbnRlbnQgcXVlcnkgaW5zdHJ1Y3Rpb25zIGZvciBlYWNoIGRpcmVjdGl2ZSkuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vT2ZJbmhlcml0ZWRRdWVyaWVzOyBpKyspIHtcbiAgICAgICAgY29uc3QgdFF1ZXJ5ID0gdFF1ZXJpZXMuZ2V0QnlJbmRleChpKTtcbiAgICAgICAgY29uc3QgcGFyZW50TFF1ZXJ5ID0gdGhpcy5xdWVyaWVzW3RRdWVyeS5pbmRleEluRGVjbGFyYXRpb25WaWV3XTtcbiAgICAgICAgdmlld0xRdWVyaWVzLnB1c2gocGFyZW50TFF1ZXJ5LmNsb25lKCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IExRdWVyaWVzXyh2aWV3TFF1ZXJpZXMpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaW5zZXJ0Vmlldyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgICB0aGlzLmRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3KTtcbiAgfVxuXG4gIGRldGFjaFZpZXcodFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gICAgdGhpcy5kaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0Vmlldyk7XG4gIH1cblxuICBwcml2YXRlIGRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3OiBUVmlldykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoZ2V0VFF1ZXJ5KHRWaWV3LCBpKS5tYXRjaGVzICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMucXVlcmllc1tpXS5zZXREaXJ0eSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVFF1ZXJ5TWV0YWRhdGFfIGltcGxlbWVudHMgVFF1ZXJ5TWV0YWRhdGEge1xuICBwdWJsaWMgcHJlZGljYXRlOiBQcm92aWRlclRva2VuPHVua25vd24+fHN0cmluZ1tdO1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByZWRpY2F0ZTogUHJvdmlkZXJUb2tlbjx1bmtub3duPnxzdHJpbmdbXXxzdHJpbmcsIHB1YmxpYyBmbGFnczogUXVlcnlGbGFncyxcbiAgICAgIHB1YmxpYyByZWFkOiBhbnkgPSBudWxsKSB7XG4gICAgLy8gQ29tcGlsZXIgbWlnaHQgbm90IGJlIGFibGUgdG8gcHJlLW9wdGltaXplIGFuZCBzcGxpdCBtdWx0aXBsZSBzZWxlY3RvcnMuXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLnByZWRpY2F0ZSA9IHNwbGl0UXVlcnlNdWx0aVNlbGVjdG9ycyhwcmVkaWNhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnByZWRpY2F0ZSA9IHByZWRpY2F0ZTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgVFF1ZXJpZXNfIGltcGxlbWVudHMgVFF1ZXJpZXMge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHF1ZXJpZXM6IFRRdWVyeVtdID0gW10pIHt9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnF1ZXJpZXNbaV0uZWxlbWVudEVuZCh0Tm9kZSk7XG4gICAgfVxuICB9XG4gIGVtYmVkZGVkVFZpZXcodE5vZGU6IFROb2RlKTogVFF1ZXJpZXN8bnVsbCB7XG4gICAgbGV0IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZjogVFF1ZXJ5W118bnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNoaWxkUXVlcnlJbmRleCA9IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5sZW5ndGggOiAwO1xuICAgICAgY29uc3QgdHF1ZXJ5Q2xvbmUgPSB0aGlzLmdldEJ5SW5kZXgoaSkuZW1iZWRkZWRUVmlldyh0Tm9kZSwgY2hpbGRRdWVyeUluZGV4KTtcblxuICAgICAgaWYgKHRxdWVyeUNsb25lKSB7XG4gICAgICAgIHRxdWVyeUNsb25lLmluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSBpO1xuICAgICAgICBpZiAocXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsKSB7XG4gICAgICAgICAgcXVlcmllc0ZvclRlbXBsYXRlUmVmLnB1c2godHF1ZXJ5Q2xvbmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiA9IFt0cXVlcnlDbG9uZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsID8gbmV3IFRRdWVyaWVzXyhxdWVyaWVzRm9yVGVtcGxhdGVSZWYpIDogbnVsbDtcbiAgfVxuXG4gIHRlbXBsYXRlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLnRlbXBsYXRlKHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QnlJbmRleChpbmRleDogbnVtYmVyKTogVFF1ZXJ5IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKHRoaXMucXVlcmllcywgaW5kZXgpO1xuICAgIHJldHVybiB0aGlzLnF1ZXJpZXNbaW5kZXhdO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnF1ZXJpZXMubGVuZ3RoO1xuICB9XG5cbiAgdHJhY2sodHF1ZXJ5OiBUUXVlcnkpOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXJpZXMucHVzaCh0cXVlcnkpO1xuICB9XG59XG5cbmNsYXNzIFRRdWVyeV8gaW1wbGVtZW50cyBUUXVlcnkge1xuICBtYXRjaGVzOiBudW1iZXJbXXxudWxsID0gbnVsbDtcbiAgaW5kZXhJbkRlY2xhcmF0aW9uVmlldyA9IC0xO1xuICBjcm9zc2VzTmdUZW1wbGF0ZSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBBIG5vZGUgaW5kZXggb24gd2hpY2ggYSBxdWVyeSB3YXMgZGVjbGFyZWQgKC0xIGZvciB2aWV3IHF1ZXJpZXMgYW5kIG9uZXMgaW5oZXJpdGVkIGZyb20gdGhlXG4gICAqIGRlY2xhcmF0aW9uIHRlbXBsYXRlKS4gV2UgdXNlIHRoaXMgaW5kZXggKGFsb25nc2lkZSB3aXRoIF9hcHBsaWVzVG9OZXh0Tm9kZSBmbGFnKSB0byBrbm93XG4gICAqIHdoZW4gdG8gYXBwbHkgY29udGVudCBxdWVyaWVzIHRvIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbk5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIGZsYWcgaW5kaWNhdGluZyBpZiBhIGdpdmVuIHF1ZXJ5IHN0aWxsIGFwcGxpZXMgdG8gbm9kZXMgaXQgaXMgY3Jvc3NpbmcuIFdlIHVzZSB0aGlzIGZsYWdcbiAgICogKGFsb25nc2lkZSB3aXRoIF9kZWNsYXJhdGlvbk5vZGVJbmRleCkgdG8ga25vdyB3aGVuIHRvIHN0b3AgYXBwbHlpbmcgY29udGVudCBxdWVyaWVzIHRvXG4gICAqIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9hcHBsaWVzVG9OZXh0Tm9kZSA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIG1ldGFkYXRhOiBUUXVlcnlNZXRhZGF0YSwgbm9kZUluZGV4OiBudW1iZXIgPSAtMSkge1xuICAgIHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID0gbm9kZUluZGV4O1xuICB9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMubWF0Y2hUTm9kZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGVsZW1lbnRFbmQodE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID09PSB0Tm9kZS5pbmRleCkge1xuICAgICAgdGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudFN0YXJ0KHRWaWV3LCB0Tm9kZSk7XG4gIH1cblxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSwgY2hpbGRRdWVyeUluZGV4OiBudW1iZXIpOiBUUXVlcnl8bnVsbCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMuY3Jvc3Nlc05nVGVtcGxhdGUgPSB0cnVlO1xuICAgICAgLy8gQSBtYXJrZXIgaW5kaWNhdGluZyBhIGA8bmctdGVtcGxhdGU+YCBlbGVtZW50IChhIHBsYWNlaG9sZGVyIGZvciBxdWVyeSByZXN1bHRzIGZyb21cbiAgICAgIC8vIGVtYmVkZGVkIHZpZXdzIGNyZWF0ZWQgYmFzZWQgb24gdGhpcyBgPG5nLXRlbXBsYXRlPmApLlxuICAgICAgdGhpcy5hZGRNYXRjaCgtdE5vZGUuaW5kZXgsIGNoaWxkUXVlcnlJbmRleCk7XG4gICAgICByZXR1cm4gbmV3IFRRdWVyeV8odGhpcy5tZXRhZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0FwcGx5aW5nVG9Ob2RlKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZSAmJlxuICAgICAgICAodGhpcy5tZXRhZGF0YS5mbGFncyAmIFF1ZXJ5RmxhZ3MuZGVzY2VuZGFudHMpICE9PSBRdWVyeUZsYWdzLmRlc2NlbmRhbnRzKSB7XG4gICAgICBjb25zdCBkZWNsYXJhdGlvbk5vZGVJZHggPSB0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleDtcbiAgICAgIGxldCBwYXJlbnQgPSB0Tm9kZS5wYXJlbnQ7XG4gICAgICAvLyBEZXRlcm1pbmUgaWYgYSBnaXZlbiBUTm9kZSBpcyBhIFwiZGlyZWN0XCIgY2hpbGQgb2YgYSBub2RlIG9uIHdoaWNoIGEgY29udGVudCBxdWVyeSB3YXNcbiAgICAgIC8vIGRlY2xhcmVkIChvbmx5IGRpcmVjdCBjaGlsZHJlbiBvZiBxdWVyeSdzIGhvc3Qgbm9kZSBjYW4gbWF0Y2ggd2l0aCB0aGUgZGVzY2VuZGFudHM6IGZhbHNlXG4gICAgICAvLyBvcHRpb24pLiBUaGVyZSBhcmUgMyBtYWluIHVzZS1jYXNlIC8gY29uZGl0aW9ucyB0byBjb25zaWRlciBoZXJlOlxuICAgICAgLy8gLSA8bmVlZHMtdGFyZ2V0PjxpICN0YXJnZXQ+PC9pPjwvbmVlZHMtdGFyZ2V0PjogaGVyZSA8aSAjdGFyZ2V0PiBwYXJlbnQgbm9kZSBpcyBhIHF1ZXJ5XG4gICAgICAvLyBob3N0IG5vZGU7XG4gICAgICAvLyAtIDxuZWVkcy10YXJnZXQ+PG5nLXRlbXBsYXRlIFtuZ0lmXT1cInRydWVcIj48aSAjdGFyZ2V0PjwvaT48L25nLXRlbXBsYXRlPjwvbmVlZHMtdGFyZ2V0PjpcbiAgICAgIC8vIGhlcmUgPGkgI3RhcmdldD4gcGFyZW50IG5vZGUgaXMgbnVsbDtcbiAgICAgIC8vIC0gPG5lZWRzLXRhcmdldD48bmctY29udGFpbmVyPjxpICN0YXJnZXQ+PC9pPjwvbmctY29udGFpbmVyPjwvbmVlZHMtdGFyZ2V0PjogaGVyZSB3ZSBuZWVkXG4gICAgICAvLyB0byBnbyBwYXN0IGA8bmctY29udGFpbmVyPmAgdG8gZGV0ZXJtaW5lIDxpICN0YXJnZXQ+IHBhcmVudCBub2RlIChidXQgd2Ugc2hvdWxkbid0IHRyYXZlcnNlXG4gICAgICAvLyB1cCBwYXN0IHRoZSBxdWVyeSdzIGhvc3Qgbm9kZSEpLlxuICAgICAgd2hpbGUgKHBhcmVudCAhPT0gbnVsbCAmJiAocGFyZW50LnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikgJiZcbiAgICAgICAgICAgICBwYXJlbnQuaW5kZXggIT09IGRlY2xhcmF0aW9uTm9kZUlkeCkge1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlY2xhcmF0aW9uTm9kZUlkeCA9PT0gKHBhcmVudCAhPT0gbnVsbCA/IHBhcmVudC5pbmRleCA6IC0xKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2FwcGxpZXNUb05leHROb2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaFROb2RlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gdGhpcy5tZXRhZGF0YS5wcmVkaWNhdGU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJlZGljYXRlKSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVkaWNhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IHByZWRpY2F0ZVtpXTtcbiAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXcsIHROb2RlLCBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIG5hbWUpKTtcbiAgICAgICAgLy8gQWxzbyB0cnkgbWF0Y2hpbmcgdGhlIG5hbWUgdG8gYSBwcm92aWRlciBzaW5jZSBzdHJpbmdzIGNhbiBiZSB1c2VkIGFzIERJIHRva2VucyB0b28uXG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKFxuICAgICAgICAgICAgdFZpZXcsIHROb2RlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgbmFtZSwgZmFsc2UsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICgocHJlZGljYXRlIGFzIGFueSkgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICAgICAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXcsIHROb2RlLCAtMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKFxuICAgICAgICAgICAgdFZpZXcsIHROb2RlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgcHJlZGljYXRlLCBmYWxzZSwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbm9kZU1hdGNoSWR4OiBudW1iZXJ8bnVsbCk6IHZvaWQge1xuICAgIGlmIChub2RlTWF0Y2hJZHggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHJlYWQgPSB0aGlzLm1ldGFkYXRhLnJlYWQ7XG4gICAgICBpZiAocmVhZCAhPT0gbnVsbCkge1xuICAgICAgICBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9FbGVtZW50UmVmIHx8IHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYgfHxcbiAgICAgICAgICAgIHJlYWQgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYgJiYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQ29udGFpbmVyKSkge1xuICAgICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIC0yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVPclByb3ZpZGVySWR4ID1cbiAgICAgICAgICAgICAgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHJlYWQsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgbm9kZU1hdGNoSWR4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFkZE1hdGNoKHROb2RlSWR4OiBudW1iZXIsIG1hdGNoSWR4OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgICB0aGlzLm1hdGNoZXMgPSBbdE5vZGVJZHgsIG1hdGNoSWR4XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tYXRjaGVzLnB1c2godE5vZGVJZHgsIG1hdGNoSWR4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYW55IHtcbiAgaWYgKHROb2RlLnR5cGUgJiAoVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYodE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZih0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIG1hdGNoaW5nSWR4OiBudW1iZXIsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGlmIChtYXRjaGluZ0lkeCA9PT0gLTEpIHtcbiAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIGRldGVjdCBpdCB1c2luZyBhcHByb3ByaWF0ZSB0Tm9kZSB0eXBlXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAobWF0Y2hpbmdJZHggPT09IC0yKSB7XG4gICAgLy8gcmVhZCBhIHNwZWNpYWwgdG9rZW4gZnJvbSBhIG5vZGUgaW5qZWN0b3JcbiAgICByZXR1cm4gY3JlYXRlU3BlY2lhbFRva2VuKGxWaWV3LCB0Tm9kZSwgcmVhZCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gcmVhZCBhIHRva2VuXG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCBsVmlld1tUVklFV10sIG1hdGNoaW5nSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNwZWNpYWxUb2tlbihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgcmVhZDogYW55KTogYW55IHtcbiAgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZih0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyKTtcbiAgICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgYFNwZWNpYWwgdG9rZW4gdG8gcmVhZCBzaG91bGQgYmUgb25lIG9mIEVsZW1lbnRSZWYsIFRlbXBsYXRlUmVmIG9yIFZpZXdDb250YWluZXJSZWYgYnV0IGdvdCAke1xuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShyZWFkKX0uYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgcXVlcnkgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3LiBUaGlzIGZ1bmN0aW9uIGlzIG1lYW50IHRvIGRvIHRoZVxuICogcHJvY2Vzc2luZyBvbmNlIGFuZCBvbmx5IG9uY2UgZm9yIGEgZ2l2ZW4gdmlldyBpbnN0YW5jZSAoYSBzZXQgb2YgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3XG4gKiBkb2Vzbid0IGNoYW5nZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0UXVlcnk6IFRRdWVyeSwgcXVlcnlJbmRleDogbnVtYmVyKTogKFR8bnVsbClbXSB7XG4gIGNvbnN0IGxRdWVyeSA9IGxWaWV3W1FVRVJJRVNdIS5xdWVyaWVzIVtxdWVyeUluZGV4XTtcbiAgaWYgKGxRdWVyeS5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgY29uc3QgdFZpZXdEYXRhID0gdFZpZXcuZGF0YTtcbiAgICBjb25zdCB0UXVlcnlNYXRjaGVzID0gdFF1ZXJ5Lm1hdGNoZXMhO1xuICAgIGNvbnN0IHJlc3VsdDogVHxudWxsW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRRdWVyeU1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IG1hdGNoZWROb2RlSWR4ID0gdFF1ZXJ5TWF0Y2hlc1tpXTtcbiAgICAgIGlmIChtYXRjaGVkTm9kZUlkeCA8IDApIHtcbiAgICAgICAgLy8gd2UgYXQgdGhlIDxuZy10ZW1wbGF0ZT4gbWFya2VyIHdoaWNoIG1pZ2h0IGhhdmUgcmVzdWx0cyBpbiB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXNcbiAgICAgICAgLy8gPG5nLXRlbXBsYXRlPiAtIHRob3NlIHJlc3VsdHMgd2lsbCBiZSBpbiBzZXBhcmF0ZSB2aWV3cyB0aG91Z2gsIHNvIGhlcmUgd2UganVzdCBsZWF2ZVxuICAgICAgICAvLyBudWxsIGFzIGEgcGxhY2Vob2xkZXJcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKHRWaWV3RGF0YSwgbWF0Y2hlZE5vZGVJZHgpO1xuICAgICAgICBjb25zdCB0Tm9kZSA9IHRWaWV3RGF0YVttYXRjaGVkTm9kZUlkeF0gYXMgVE5vZGU7XG4gICAgICAgIHJlc3VsdC5wdXNoKGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXcsIHROb2RlLCB0UXVlcnlNYXRjaGVzW2kgKyAxXSwgdFF1ZXJ5Lm1ldGFkYXRhLnJlYWQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbFF1ZXJ5Lm1hdGNoZXMgPSByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbFF1ZXJ5Lm1hdGNoZXM7XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCBjb2xsZWN0cyAoYWxyZWFkeSBtYXRlcmlhbGl6ZWQpIHF1ZXJ5IHJlc3VsdHMgZnJvbSBhIHRyZWUgb2Ygdmlld3MsXG4gKiBzdGFydGluZyB3aXRoIGEgcHJvdmlkZWQgTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UXVlcnlSZXN1bHRzPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBxdWVyeUluZGV4OiBudW1iZXIsIHJlc3VsdDogVFtdKTogVFtdIHtcbiAgY29uc3QgdFF1ZXJ5ID0gdFZpZXcucXVlcmllcyEuZ2V0QnlJbmRleChxdWVyeUluZGV4KTtcbiAgY29uc3QgdFF1ZXJ5TWF0Y2hlcyA9IHRRdWVyeS5tYXRjaGVzO1xuICBpZiAodFF1ZXJ5TWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxWaWV3UmVzdWx0cyA9IG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4odFZpZXcsIGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0UXVlcnlNYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCB0Tm9kZUlkeCA9IHRRdWVyeU1hdGNoZXNbaV07XG4gICAgICBpZiAodE5vZGVJZHggPiAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGxWaWV3UmVzdWx0c1tpIC8gMl0gYXMgVCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSB0UXVlcnlNYXRjaGVzW2kgKyAxXTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1stdE5vZGVJZHhdIGFzIExDb250YWluZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uTENvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBpbnNlcnRlZCBpbiB0aGlzIGNvbnRhaW5lclxuICAgICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBkZWNsYXJhdGlvbkxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW2ldO1xuICAgICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdID09PSBlbWJlZGRlZExWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld1tUVklFV10sIGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGlzIGRlY2xhcmF0aW9uIGNvbnRhaW5lciBhbmQgaW5zZXJ0ZWQgaW50b1xuICAgICAgICAvLyBkaWZmZXJlbnQgY29udGFpbmVyc1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXdzID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbWJlZGRlZExWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGVtYmVkZGVkTFZpZXdzW2ldO1xuICAgICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyhlbWJlZGRlZExWaWV3W1RWSUVXXSwgZW1iZWRkZWRMVmlldywgY2hpbGRRdWVyeUluZGV4LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUludGVybmFsPFQ+KGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGxWaWV3W1FVRVJJRVNdLCAnTFF1ZXJpZXMgc2hvdWxkIGJlIGRlZmluZWQgd2hlbiB0cnlpbmcgdG8gbG9hZCBhIHF1ZXJ5Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXdbUVVFUklFU10hLnF1ZXJpZXMsIHF1ZXJ5SW5kZXgpO1xuICByZXR1cm4gbFZpZXdbUVVFUklFU10hLnF1ZXJpZXNbcXVlcnlJbmRleF0ucXVlcnlMaXN0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgTFF1ZXJ5IGFuZCByZXR1cm5zIGl0cyBpbmRleCBpbiB0aGUgY29sbGVjdGlvbiBvZiBMUXVlcnkgb2JqZWN0cy5cbiAqXG4gKiBAcmV0dXJucyBpbmRleCBpbiB0aGUgY29sbGVjdGlvbiBvZiBMUXVlcnkgb2JqZWN0c1xuICovXG5mdW5jdGlvbiBjcmVhdGVMUXVlcnk8VD4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGZsYWdzOiBRdWVyeUZsYWdzKTogbnVtYmVyIHtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPihcbiAgICAgIChmbGFncyAmIFF1ZXJ5RmxhZ3MuZW1pdERpc3RpbmN0Q2hhbmdlc09ubHkpID09PSBRdWVyeUZsYWdzLmVtaXREaXN0aW5jdENoYW5nZXNPbmx5KTtcblxuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh0VmlldywgbFZpZXcsIHF1ZXJ5TGlzdCwgcXVlcnlMaXN0LmRlc3Ryb3kpO1xuXG4gIGNvbnN0IGxRdWVyaWVzID0gKGxWaWV3W1FVRVJJRVNdID8/PSBuZXcgTFF1ZXJpZXNfKCkpLnF1ZXJpZXM7XG4gIHJldHVybiBsUXVlcmllcy5wdXNoKG5ldyBMUXVlcnlfKHF1ZXJ5TGlzdCkpIC0gMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpZXdRdWVyeTxUPihcbiAgICBwcmVkaWNhdGU6IFByb3ZpZGVyVG9rZW48dW5rbm93bj58c3RyaW5nW118c3RyaW5nLCBmbGFnczogUXVlcnlGbGFncywgcmVhZD86IGFueSk6IG51bWJlciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROdW1iZXIoZmxhZ3MsICdFeHBlY3RpbmcgZmxhZ3MnKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZmxhZ3MsIHJlYWQpLCAtMSk7XG4gICAgaWYgKChmbGFncyAmIFF1ZXJ5RmxhZ3MuaXNTdGF0aWMpID09PSBRdWVyeUZsYWdzLmlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNWaWV3UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNyZWF0ZUxRdWVyeTxUPih0VmlldywgZ2V0TFZpZXcoKSwgZmxhZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogUHJvdmlkZXJUb2tlbjx1bmtub3duPnxzdHJpbmdbXXxzdHJpbmcsIGZsYWdzOiBRdWVyeUZsYWdzLFxuICAgIHJlYWQ/OiBQcm92aWRlclRva2VuPFQ+KTogbnVtYmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE51bWJlcihmbGFncywgJ0V4cGVjdGluZyBmbGFncycpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgICBjcmVhdGVUUXVlcnkodFZpZXcsIG5ldyBUUXVlcnlNZXRhZGF0YV8ocHJlZGljYXRlLCBmbGFncywgcmVhZCksIHROb2RlLmluZGV4KTtcbiAgICBzYXZlQ29udGVudFF1ZXJ5QW5kRGlyZWN0aXZlSW5kZXgodFZpZXcsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICBpZiAoKGZsYWdzICYgUXVlcnlGbGFncy5pc1N0YXRpYykgPT09IFF1ZXJ5RmxhZ3MuaXNTdGF0aWMpIHtcbiAgICAgIHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3JlYXRlTFF1ZXJ5PFQ+KHRWaWV3LCBnZXRMVmlldygpLCBmbGFncyk7XG59XG5cbi8qKiBTcGxpdHMgbXVsdGlwbGUgc2VsZWN0b3JzIGluIHRoZSBsb2NhdG9yLiAqL1xuZnVuY3Rpb24gc3BsaXRRdWVyeU11bHRpU2VsZWN0b3JzKGxvY2F0b3I6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIGxvY2F0b3Iuc3BsaXQoJywnKS5tYXAocyA9PiBzLnRyaW0oKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUUXVlcnkodFZpZXc6IFRWaWV3LCBtZXRhZGF0YTogVFF1ZXJ5TWV0YWRhdGEsIG5vZGVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGlmICh0Vmlldy5xdWVyaWVzID09PSBudWxsKSB0Vmlldy5xdWVyaWVzID0gbmV3IFRRdWVyaWVzXygpO1xuICB0Vmlldy5xdWVyaWVzLnRyYWNrKG5ldyBUUXVlcnlfKG1ldGFkYXRhLCBub2RlSW5kZXgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldzogVFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgdFZpZXdDb250ZW50UXVlcmllcy5sZW5ndGggPyB0Vmlld0NvbnRlbnRRdWVyaWVzW3RWaWV3Q29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMV0gOiAtMTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ICE9PSBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCkge1xuICAgIHRWaWV3Q29udGVudFF1ZXJpZXMucHVzaCh0Vmlldy5xdWVyaWVzIS5sZW5ndGggLSAxLCBkaXJlY3RpdmVJbmRleCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRRdWVyeSh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIpOiBUUXVlcnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Vmlldy5xdWVyaWVzLCAnVFF1ZXJpZXMgbXVzdCBiZSBkZWZpbmVkIHRvIHJldHJpZXZlIGEgVFF1ZXJ5Jyk7XG4gIHJldHVybiB0Vmlldy5xdWVyaWVzIS5nZXRCeUluZGV4KGluZGV4KTtcbn1cbiJdfQ==