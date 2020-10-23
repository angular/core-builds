/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef as ViewEngine_ElementRef } from '../linker/element_ref';
import { QueryList } from '../linker/query_list';
import { TemplateRef as ViewEngine_TemplateRef } from '../linker/template_ref';
import { ViewContainerRef } from '../linker/view_container_ref';
import { assertDefined, assertIndexInRange, throwError } from '../util/assert';
import { stringify } from '../util/stringify';
import { assertFirstCreatePass, assertLContainer } from './assert';
import { getNodeInjectable, locateDirectiveOrProvider } from './di';
import { storeCleanupWithContext } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET, MOVED_VIEWS } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { DECLARATION_LCONTAINER, PARENT, QUERIES, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { getCurrentQueryIndex, getCurrentTNode, getLView, getTView, setCurrentQueryIndex } from './state';
import { isCreationMode } from './util/view_utils';
import { createContainerRef, createElementRef, createTemplateRef } from './view_engine_compatibility';
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
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
class TQueryMetadata_ {
    constructor(predicate, descendants, isStatic, read = null) {
        this.predicate = predicate;
        this.descendants = descendants;
        this.isStatic = isStatic;
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
        if (this._appliesToNextNode && this.metadata.descendants === false) {
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
            while (parent !== null && (parent.type & 8 /* ElementContainer */) &&
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
                if (tNode.type & 4 /* Container */) {
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
                    read === ViewEngine_TemplateRef && (tNode.type & 4 /* Container */)) {
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
    if (tNode.type & (3 /* AnyRNode */ | 8 /* ElementContainer */)) {
        return createElementRef(ViewEngine_ElementRef, tNode, currentView);
    }
    else if (tNode.type & 4 /* Container */) {
        return createTemplateRef(ViewEngine_TemplateRef, ViewEngine_ElementRef, tNode, currentView);
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
        return createElementRef(ViewEngine_ElementRef, tNode, lView);
    }
    else if (read === ViewEngine_TemplateRef) {
        return createTemplateRef(ViewEngine_TemplateRef, ViewEngine_ElementRef, tNode, lView);
    }
    else if (read === ViewContainerRef) {
        ngDevMode && assertTNodeType(tNode, 3 /* AnyRNode */ | 12 /* AnyContainer */);
        return createContainerRef(ViewContainerRef, ViewEngine_ElementRef, tNode, lView);
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
function materializeViewResults(tView, lView, tQuery, queryIndex) {
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
function collectQueryResults(tView, lView, queryIndex, result) {
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
/**
 * Refreshes a query by combining matches from all active views and removing matches from deleted
 * views.
 *
 * @returns `true` if a query got dirty during change detection or if this is a static query
 * resolving in creation mode, `false` otherwise.
 *
 * @codeGenApi
 */
export function ɵɵqueryRefresh(queryList) {
    const lView = getLView();
    const tView = getTView();
    const queryIndex = getCurrentQueryIndex();
    setCurrentQueryIndex(queryIndex + 1);
    const tQuery = getTQuery(tView, queryIndex);
    if (queryList.dirty && (isCreationMode(lView) === tQuery.metadata.isStatic)) {
        if (tQuery.matches === null) {
            queryList.reset([]);
        }
        else {
            const result = tQuery.crossesNgTemplate ?
                collectQueryResults(tView, lView, queryIndex, []) :
                materializeViewResults(tView, lView, tQuery, queryIndex);
            queryList.reset(result);
            queryList.notifyOnChanges();
        }
        return true;
    }
    return false;
}
/**
 * Creates new QueryList for a static view query.
 *
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 *
 * @codeGenApi
 */
export function ɵɵstaticViewQuery(predicate, descend, read) {
    viewQueryInternal(getTView(), getLView(), predicate, descend, read, true);
}
/**
 * Creates new QueryList, stores the reference in LView and returns QueryList.
 *
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 *
 * @codeGenApi
 */
export function ɵɵviewQuery(predicate, descend, read) {
    viewQueryInternal(getTView(), getLView(), predicate, descend, read, false);
}
function viewQueryInternal(tView, lView, predicate, descend, read, isStatic) {
    if (tView.firstCreatePass) {
        createTQuery(tView, new TQueryMetadata_(predicate, descend, isStatic, read), -1);
        if (isStatic) {
            tView.staticViewQueries = true;
        }
    }
    createLQuery(tView, lView);
}
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 *
 * @param directiveIndex Current directive index
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 * @returns QueryList<T>
 *
 * @codeGenApi
 */
export function ɵɵcontentQuery(directiveIndex, predicate, descend, read) {
    contentQueryInternal(getTView(), getLView(), predicate, descend, read, false, getCurrentTNode(), directiveIndex);
}
/**
 * Registers a QueryList, associated with a static content query, for later refresh
 * (part of a view refresh).
 *
 * @param directiveIndex Current directive index
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 * @returns QueryList<T>
 *
 * @codeGenApi
 */
export function ɵɵstaticContentQuery(directiveIndex, predicate, descend, read) {
    contentQueryInternal(getTView(), getLView(), predicate, descend, read, true, getCurrentTNode(), directiveIndex);
}
function contentQueryInternal(tView, lView, predicate, descend, read, isStatic, tNode, directiveIndex) {
    if (tView.firstCreatePass) {
        createTQuery(tView, new TQueryMetadata_(predicate, descend, isStatic, read), tNode.index);
        saveContentQueryAndDirectiveIndex(tView, directiveIndex);
        if (isStatic) {
            tView.staticContentQueries = true;
        }
    }
    createLQuery(tView, lView);
}
/**
 * Loads a QueryList corresponding to the current view or content query.
 *
 * @codeGenApi
 */
export function ɵɵloadQuery() {
    return loadQueryInternal(getLView(), getCurrentQueryIndex());
}
function loadQueryInternal(lView, queryIndex) {
    ngDevMode &&
        assertDefined(lView[QUERIES], 'LQueries should be defined when trying to load a query');
    ngDevMode && assertIndexInRange(lView[QUERIES].queries, queryIndex);
    return lView[QUERIES].queries[queryIndex].queryList;
}
function createLQuery(tView, lView) {
    const queryList = new QueryList();
    storeCleanupWithContext(tView, lView, queryList, queryList.destroy);
    if (lView[QUERIES] === null)
        lView[QUERIES] = new LQueries_();
    lView[QUERIES].queries.push(new LQuery_(queryList));
}
function createTQuery(tView, metadata, nodeIndex) {
    if (tView.queries === null)
        tView.queries = new TQueries_();
    tView.queries.track(new TQuery_(metadata, nodeIndex));
}
function saveContentQueryAndDirectiveIndex(tView, directiveIndex) {
    const tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
    const lastSavedDirectiveIndex = tViewContentQueries.length ? tViewContentQueries[tViewContentQueries.length - 1] : -1;
    if (directiveIndex !== lastSavedDirectiveIndex) {
        tViewContentQueries.push(tView.queries.length - 1, directiveIndex);
    }
}
function getTQuery(tView, index) {
    ngDevMode && assertDefined(tView.queries, 'TQueries must be defined to retrieve a TQuery');
    return tView.queries.getByIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU9ILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlELE9BQU8sRUFBQyxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0UsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLHVCQUF1QixFQUFjLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hGLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQXFELDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hJLE9B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LENBQUMsQ0FBQztBQUMxQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEluZGV4SW5SYW5nZSwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHthc3NlcnRGaXJzdENyZWF0ZVBhc3MsIGFzc2VydExDb250YWluZXJ9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Tm9kZUluamVjdGFibGUsIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXJ9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtzdG9yZUNsZWFudXBXaXRoQ29udGV4dH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIExRdWVyeSwgVFF1ZXJpZXMsIFRRdWVyeSwgVFF1ZXJ5TWV0YWRhdGEsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX0xDT05UQUlORVIsIExWaWV3LCBQQVJFTlQsIFFVRVJJRVMsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDdXJyZW50UXVlcnlJbmRleCwgZ2V0Q3VycmVudFROb2RlLCBnZXRMVmlldywgZ2V0VFZpZXcsIHNldEN1cnJlbnRRdWVyeUluZGV4fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDcmVhdGlvbk1vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Y3JlYXRlQ29udGFpbmVyUmVmLCBjcmVhdGVFbGVtZW50UmVmLCBjcmVhdGVUZW1wbGF0ZVJlZn0gZnJvbSAnLi92aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5JztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG5jbGFzcyBMUXVlcnlfPFQ+IGltcGxlbWVudHMgTFF1ZXJ5PFQ+IHtcbiAgbWF0Y2hlczogKFR8bnVsbClbXXxudWxsID0gbnVsbDtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+KSB7fVxuICBjbG9uZSgpOiBMUXVlcnk8VD4ge1xuICAgIHJldHVybiBuZXcgTFF1ZXJ5Xyh0aGlzLnF1ZXJ5TGlzdCk7XG4gIH1cbiAgc2V0RGlydHkoKTogdm9pZCB7XG4gICAgdGhpcy5xdWVyeUxpc3Quc2V0RGlydHkoKTtcbiAgfVxufVxuXG5jbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBxdWVyaWVzOiBMUXVlcnk8YW55PltdID0gW10pIHt9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KHRWaWV3OiBUVmlldyk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHRRdWVyaWVzID0gdFZpZXcucXVlcmllcztcbiAgICBpZiAodFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IG5vT2ZJbmhlcml0ZWRRdWVyaWVzID1cbiAgICAgICAgICB0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCA/IHRWaWV3LmNvbnRlbnRRdWVyaWVzWzBdIDogdFF1ZXJpZXMubGVuZ3RoO1xuICAgICAgY29uc3Qgdmlld0xRdWVyaWVzOiBMUXVlcnk8YW55PltdID0gW107XG5cbiAgICAgIC8vIEFuIGVtYmVkZGVkIHZpZXcgaGFzIHF1ZXJpZXMgcHJvcGFnYXRlZCBmcm9tIGEgZGVjbGFyYXRpb24gdmlldyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuICAgICAgLy8gVFF1ZXJpZXMgY29sbGVjdGlvbiBhbmQgdXAgdW50aWwgYSBmaXJzdCBjb250ZW50IHF1ZXJ5IGRlY2xhcmVkIGluIHRoZSBlbWJlZGRlZCB2aWV3LiBPbmx5XG4gICAgICAvLyBwcm9wYWdhdGVkIExRdWVyaWVzIGFyZSBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKExRdWVyeSBjb3JyZXNwb25kaW5nIHRvIGRlY2xhcmVkIGNvbnRlbnRcbiAgICAgIC8vIHF1ZXJpZXMgd2lsbCBiZSBpbnN0YW50aWF0ZWQgZnJvbSB0aGUgY29udGVudCBxdWVyeSBpbnN0cnVjdGlvbnMgZm9yIGVhY2ggZGlyZWN0aXZlKS5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9PZkluaGVyaXRlZFF1ZXJpZXM7IGkrKykge1xuICAgICAgICBjb25zdCB0UXVlcnkgPSB0UXVlcmllcy5nZXRCeUluZGV4KGkpO1xuICAgICAgICBjb25zdCBwYXJlbnRMUXVlcnkgPSB0aGlzLnF1ZXJpZXNbdFF1ZXJ5LmluZGV4SW5EZWNsYXJhdGlvblZpZXddO1xuICAgICAgICB2aWV3TFF1ZXJpZXMucHVzaChwYXJlbnRMUXVlcnkuY2xvbmUoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgTFF1ZXJpZXNfKHZpZXdMUXVlcmllcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICAgIHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpO1xuICB9XG5cbiAgZGV0YWNoVmlldyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgICB0aGlzLmRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3KTtcbiAgfVxuXG4gIHByaXZhdGUgZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXc6IFRWaWV3KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChnZXRUUXVlcnkodFZpZXcsIGkpLm1hdGNoZXMgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5xdWVyaWVzW2ldLnNldERpcnR5KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFRRdWVyeU1ldGFkYXRhXyBpbXBsZW1lbnRzIFRRdWVyeU1ldGFkYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcHJlZGljYXRlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48dW5rbm93bj58c3RyaW5nW10sIHB1YmxpYyBkZXNjZW5kYW50czogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBpc1N0YXRpYzogYm9vbGVhbiwgcHVibGljIHJlYWQ6IGFueSA9IG51bGwpIHt9XG59XG5cbmNsYXNzIFRRdWVyaWVzXyBpbXBsZW1lbnRzIFRRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBxdWVyaWVzOiBUUXVlcnlbXSA9IFtdKSB7fVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cbiAgZWxlbWVudEVuZCh0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRFbmQodE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSk6IFRRdWVyaWVzfG51bGwge1xuICAgIGxldCBxdWVyaWVzRm9yVGVtcGxhdGVSZWY6IFRRdWVyeVtdfG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgIT09IG51bGwgPyBxdWVyaWVzRm9yVGVtcGxhdGVSZWYubGVuZ3RoIDogMDtcbiAgICAgIGNvbnN0IHRxdWVyeUNsb25lID0gdGhpcy5nZXRCeUluZGV4KGkpLmVtYmVkZGVkVFZpZXcodE5vZGUsIGNoaWxkUXVlcnlJbmRleCk7XG5cbiAgICAgIGlmICh0cXVlcnlDbG9uZSkge1xuICAgICAgICB0cXVlcnlDbG9uZS5pbmRleEluRGVjbGFyYXRpb25WaWV3ID0gaTtcbiAgICAgICAgaWYgKHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCkge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5wdXNoKHRxdWVyeUNsb25lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgPSBbdHF1ZXJ5Q2xvbmVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IG5ldyBUUXVlcmllc18ocXVlcmllc0ZvclRlbXBsYXRlUmVmKSA6IG51bGw7XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS50ZW1wbGF0ZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGdldEJ5SW5kZXgoaW5kZXg6IG51bWJlcik6IFRRdWVyeSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZSh0aGlzLnF1ZXJpZXMsIGluZGV4KTtcbiAgICByZXR1cm4gdGhpcy5xdWVyaWVzW2luZGV4XTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyaWVzLmxlbmd0aDtcbiAgfVxuXG4gIHRyYWNrKHRxdWVyeTogVFF1ZXJ5KTogdm9pZCB7XG4gICAgdGhpcy5xdWVyaWVzLnB1c2godHF1ZXJ5KTtcbiAgfVxufVxuXG5jbGFzcyBUUXVlcnlfIGltcGxlbWVudHMgVFF1ZXJ5IHtcbiAgbWF0Y2hlczogbnVtYmVyW118bnVsbCA9IG51bGw7XG4gIGluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSAtMTtcbiAgY3Jvc3Nlc05nVGVtcGxhdGUgPSBmYWxzZTtcblxuICAvKipcbiAgICogQSBub2RlIGluZGV4IG9uIHdoaWNoIGEgcXVlcnkgd2FzIGRlY2xhcmVkICgtMSBmb3IgdmlldyBxdWVyaWVzIGFuZCBvbmVzIGluaGVyaXRlZCBmcm9tIHRoZVxuICAgKiBkZWNsYXJhdGlvbiB0ZW1wbGF0ZSkuIFdlIHVzZSB0aGlzIGluZGV4IChhbG9uZ3NpZGUgd2l0aCBfYXBwbGllc1RvTmV4dE5vZGUgZmxhZykgdG8ga25vd1xuICAgKiB3aGVuIHRvIGFwcGx5IGNvbnRlbnQgcXVlcmllcyB0byBlbGVtZW50cyBpbiBhIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZGVjbGFyYXRpb25Ob2RlSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQSBmbGFnIGluZGljYXRpbmcgaWYgYSBnaXZlbiBxdWVyeSBzdGlsbCBhcHBsaWVzIHRvIG5vZGVzIGl0IGlzIGNyb3NzaW5nLiBXZSB1c2UgdGhpcyBmbGFnXG4gICAqIChhbG9uZ3NpZGUgd2l0aCBfZGVjbGFyYXRpb25Ob2RlSW5kZXgpIHRvIGtub3cgd2hlbiB0byBzdG9wIGFwcGx5aW5nIGNvbnRlbnQgcXVlcmllcyB0b1xuICAgKiBlbGVtZW50cyBpbiBhIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbGllc1RvTmV4dE5vZGUgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBtZXRhZGF0YTogVFF1ZXJ5TWV0YWRhdGEsIG5vZGVJbmRleDogbnVtYmVyID0gLTEpIHtcbiAgICB0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9IG5vZGVJbmRleDtcbiAgfVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzQXBwbHlpbmdUb05vZGUodE5vZGUpKSB7XG4gICAgICB0aGlzLm1hdGNoVE5vZGUodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cblxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9PT0gdE5vZGUuaW5kZXgpIHtcbiAgICAgIHRoaXMuX2FwcGxpZXNUb05leHROb2RlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgdGVtcGxhdGUodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICB0aGlzLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICB9XG5cbiAgZW1iZWRkZWRUVmlldyh0Tm9kZTogVE5vZGUsIGNoaWxkUXVlcnlJbmRleDogbnVtYmVyKTogVFF1ZXJ5fG51bGwge1xuICAgIGlmICh0aGlzLmlzQXBwbHlpbmdUb05vZGUodE5vZGUpKSB7XG4gICAgICB0aGlzLmNyb3NzZXNOZ1RlbXBsYXRlID0gdHJ1ZTtcbiAgICAgIC8vIEEgbWFya2VyIGluZGljYXRpbmcgYSBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudCAoYSBwbGFjZWhvbGRlciBmb3IgcXVlcnkgcmVzdWx0cyBmcm9tXG4gICAgICAvLyBlbWJlZGRlZCB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXMgYDxuZy10ZW1wbGF0ZT5gKS5cbiAgICAgIHRoaXMuYWRkTWF0Y2goLXROb2RlLmluZGV4LCBjaGlsZFF1ZXJ5SW5kZXgpO1xuICAgICAgcmV0dXJuIG5ldyBUUXVlcnlfKHRoaXMubWV0YWRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgaXNBcHBseWluZ1RvTm9kZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgJiYgdGhpcy5tZXRhZGF0YS5kZXNjZW5kYW50cyA9PT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uTm9kZUlkeCA9IHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4O1xuICAgICAgbGV0IHBhcmVudCA9IHROb2RlLnBhcmVudDtcbiAgICAgIC8vIERldGVybWluZSBpZiBhIGdpdmVuIFROb2RlIGlzIGEgXCJkaXJlY3RcIiBjaGlsZCBvZiBhIG5vZGUgb24gd2hpY2ggYSBjb250ZW50IHF1ZXJ5IHdhc1xuICAgICAgLy8gZGVjbGFyZWQgKG9ubHkgZGlyZWN0IGNoaWxkcmVuIG9mIHF1ZXJ5J3MgaG9zdCBub2RlIGNhbiBtYXRjaCB3aXRoIHRoZSBkZXNjZW5kYW50czogZmFsc2VcbiAgICAgIC8vIG9wdGlvbikuIFRoZXJlIGFyZSAzIG1haW4gdXNlLWNhc2UgLyBjb25kaXRpb25zIHRvIGNvbnNpZGVyIGhlcmU6XG4gICAgICAvLyAtIDxuZWVkcy10YXJnZXQ+PGkgI3RhcmdldD48L2k+PC9uZWVkcy10YXJnZXQ+OiBoZXJlIDxpICN0YXJnZXQ+IHBhcmVudCBub2RlIGlzIGEgcXVlcnlcbiAgICAgIC8vIGhvc3Qgbm9kZTtcbiAgICAgIC8vIC0gPG5lZWRzLXRhcmdldD48bmctdGVtcGxhdGUgW25nSWZdPVwidHJ1ZVwiPjxpICN0YXJnZXQ+PC9pPjwvbmctdGVtcGxhdGU+PC9uZWVkcy10YXJnZXQ+OlxuICAgICAgLy8gaGVyZSA8aSAjdGFyZ2V0PiBwYXJlbnQgbm9kZSBpcyBudWxsO1xuICAgICAgLy8gLSA8bmVlZHMtdGFyZ2V0PjxuZy1jb250YWluZXI+PGkgI3RhcmdldD48L2k+PC9uZy1jb250YWluZXI+PC9uZWVkcy10YXJnZXQ+OiBoZXJlIHdlIG5lZWRcbiAgICAgIC8vIHRvIGdvIHBhc3QgYDxuZy1jb250YWluZXI+YCB0byBkZXRlcm1pbmUgPGkgI3RhcmdldD4gcGFyZW50IG5vZGUgKGJ1dCB3ZSBzaG91bGRuJ3QgdHJhdmVyc2VcbiAgICAgIC8vIHVwIHBhc3QgdGhlIHF1ZXJ5J3MgaG9zdCBub2RlISkuXG4gICAgICB3aGlsZSAocGFyZW50ICE9PSBudWxsICYmIChwYXJlbnQudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSAmJlxuICAgICAgICAgICAgIHBhcmVudC5pbmRleCAhPT0gZGVjbGFyYXRpb25Ob2RlSWR4KSB7XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVjbGFyYXRpb25Ob2RlSWR4ID09PSAocGFyZW50ICE9PSBudWxsID8gcGFyZW50LmluZGV4IDogLTEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fYXBwbGllc1RvTmV4dE5vZGU7XG4gIH1cblxuICBwcml2YXRlIG1hdGNoVE5vZGUodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBjb25zdCBwcmVkaWNhdGUgPSB0aGlzLm1ldGFkYXRhLnByZWRpY2F0ZTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcmVkaWNhdGUpKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWRpY2F0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBuYW1lID0gcHJlZGljYXRlW2ldO1xuICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldywgdE5vZGUsIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgbmFtZSkpO1xuICAgICAgICAvLyBBbHNvIHRyeSBtYXRjaGluZyB0aGUgbmFtZSB0byBhIHByb3ZpZGVyIHNpbmNlIHN0cmluZ3MgY2FuIGJlIHVzZWQgYXMgREkgdG9rZW5zIHRvby5cbiAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24oXG4gICAgICAgICAgICB0VmlldywgdE5vZGUsIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCBuYW1lLCBmYWxzZSwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKChwcmVkaWNhdGUgYXMgYW55KSA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldywgdE5vZGUsIC0xKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24oXG4gICAgICAgICAgICB0VmlldywgdE5vZGUsIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCBwcmVkaWNhdGUsIGZhbHNlLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBub2RlTWF0Y2hJZHg6IG51bWJlcnxudWxsKTogdm9pZCB7XG4gICAgaWYgKG5vZGVNYXRjaElkeCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgcmVhZCA9IHRoaXMubWV0YWRhdGEucmVhZDtcbiAgICAgIGlmIChyZWFkICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChyZWFkID09PSBWaWV3RW5naW5lX0VsZW1lbnRSZWYgfHwgcmVhZCA9PT0gVmlld0NvbnRhaW5lclJlZiB8fFxuICAgICAgICAgICAgcmVhZCA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiAmJiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Db250YWluZXIpKSB7XG4gICAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgLTIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHggPVxuICAgICAgICAgICAgICBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgcmVhZCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICBpZiAoZGlyZWN0aXZlT3JQcm92aWRlcklkeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgZGlyZWN0aXZlT3JQcm92aWRlcklkeCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCBub2RlTWF0Y2hJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkTWF0Y2godE5vZGVJZHg6IG51bWJlciwgbWF0Y2hJZHg6IG51bWJlcikge1xuICAgIGlmICh0aGlzLm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMubWF0Y2hlcyA9IFt0Tm9kZUlkeCwgbWF0Y2hJZHhdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1hdGNoZXMucHVzaCh0Tm9kZUlkeCwgbWF0Y2hJZHgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgbG9jYWwgbmFtZXMgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgcmV0dXJucyBkaXJlY3RpdmUgaW5kZXhcbiAqIChvciAtMSBpZiBhIGxvY2FsIG5hbWUgcG9pbnRzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBzdGF0aWMgZGF0YSBvZiBhIG5vZGUgdG8gY2hlY2tcbiAqIEBwYXJhbSBzZWxlY3RvciBzZWxlY3RvciB0byBtYXRjaFxuICogQHJldHVybnMgZGlyZWN0aXZlIGluZGV4LCAtMSBvciBudWxsIGlmIGEgc2VsZWN0b3IgZGlkbid0IG1hdGNoIGFueSBvZiB0aGUgbG9jYWwgbmFtZXNcbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAobG9jYWxOYW1lc1tpXSA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVzdWx0QnlUTm9kZVR5cGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBpZiAodE5vZGUudHlwZSAmIChUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIG1hdGNoaW5nSWR4OiBudW1iZXIsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGlmIChtYXRjaGluZ0lkeCA9PT0gLTEpIHtcbiAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIGRldGVjdCBpdCB1c2luZyBhcHByb3ByaWF0ZSB0Tm9kZSB0eXBlXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAobWF0Y2hpbmdJZHggPT09IC0yKSB7XG4gICAgLy8gcmVhZCBhIHNwZWNpYWwgdG9rZW4gZnJvbSBhIG5vZGUgaW5qZWN0b3JcbiAgICByZXR1cm4gY3JlYXRlU3BlY2lhbFRva2VuKGxWaWV3LCB0Tm9kZSwgcmVhZCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gcmVhZCBhIHRva2VuXG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCBsVmlld1tUVklFV10sIG1hdGNoaW5nSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNwZWNpYWxUb2tlbihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgcmVhZDogYW55KTogYW55IHtcbiAgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChyZWFkID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmKFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChyZWFkID09PSBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkFueUNvbnRhaW5lcik7XG4gICAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICAgICAgVmlld0NvbnRhaW5lclJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgYFNwZWNpYWwgdG9rZW4gdG8gcmVhZCBzaG91bGQgYmUgb25lIG9mIEVsZW1lbnRSZWYsIFRlbXBsYXRlUmVmIG9yIFZpZXdDb250YWluZXJSZWYgYnV0IGdvdCAke1xuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShyZWFkKX0uYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgcXVlcnkgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3LiBUaGlzIGZ1bmN0aW9uIGlzIG1lYW50IHRvIGRvIHRoZVxuICogcHJvY2Vzc2luZyBvbmNlIGFuZCBvbmx5IG9uY2UgZm9yIGEgZ2l2ZW4gdmlldyBpbnN0YW5jZSAoYSBzZXQgb2YgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3XG4gKiBkb2Vzbid0IGNoYW5nZSkuXG4gKi9cbmZ1bmN0aW9uIG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRRdWVyeTogVFF1ZXJ5LCBxdWVyeUluZGV4OiBudW1iZXIpOiAoVHxudWxsKVtdIHtcbiAgY29uc3QgbFF1ZXJ5ID0gbFZpZXdbUVVFUklFU10hLnF1ZXJpZXMhW3F1ZXJ5SW5kZXhdO1xuICBpZiAobFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICBjb25zdCB0Vmlld0RhdGEgPSB0Vmlldy5kYXRhO1xuICAgIGNvbnN0IHRRdWVyeU1hdGNoZXMgPSB0UXVlcnkubWF0Y2hlcyE7XG4gICAgY29uc3QgcmVzdWx0OiBUfG51bGxbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFF1ZXJ5TWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgbWF0Y2hlZE5vZGVJZHggPSB0UXVlcnlNYXRjaGVzW2ldO1xuICAgICAgaWYgKG1hdGNoZWROb2RlSWR4IDwgMCkge1xuICAgICAgICAvLyB3ZSBhdCB0aGUgPG5nLXRlbXBsYXRlPiBtYXJrZXIgd2hpY2ggbWlnaHQgaGF2ZSByZXN1bHRzIGluIHZpZXdzIGNyZWF0ZWQgYmFzZWQgb24gdGhpc1xuICAgICAgICAvLyA8bmctdGVtcGxhdGU+IC0gdGhvc2UgcmVzdWx0cyB3aWxsIGJlIGluIHNlcGFyYXRlIHZpZXdzIHRob3VnaCwgc28gaGVyZSB3ZSBqdXN0IGxlYXZlXG4gICAgICAgIC8vIG51bGwgYXMgYSBwbGFjZWhvbGRlclxuICAgICAgICByZXN1bHQucHVzaChudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UodFZpZXdEYXRhLCBtYXRjaGVkTm9kZUlkeCk7XG4gICAgICAgIGNvbnN0IHROb2RlID0gdFZpZXdEYXRhW21hdGNoZWROb2RlSWR4XSBhcyBUTm9kZTtcbiAgICAgICAgcmVzdWx0LnB1c2goY3JlYXRlUmVzdWx0Rm9yTm9kZShsVmlldywgdE5vZGUsIHRRdWVyeU1hdGNoZXNbaSArIDFdLCB0UXVlcnkubWV0YWRhdGEucmVhZCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBsUXVlcnkubWF0Y2hlcyA9IHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBsUXVlcnkubWF0Y2hlcztcbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNvbGxlY3RzIChhbHJlYWR5IG1hdGVyaWFsaXplZCkgcXVlcnkgcmVzdWx0cyBmcm9tIGEgdHJlZSBvZiB2aWV3cyxcbiAqIHN0YXJ0aW5nIHdpdGggYSBwcm92aWRlZCBMVmlldy5cbiAqL1xuZnVuY3Rpb24gY29sbGVjdFF1ZXJ5UmVzdWx0czxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyLCByZXN1bHQ6IFRbXSk6IFRbXSB7XG4gIGNvbnN0IHRRdWVyeSA9IHRWaWV3LnF1ZXJpZXMhLmdldEJ5SW5kZXgocXVlcnlJbmRleCk7XG4gIGNvbnN0IHRRdWVyeU1hdGNoZXMgPSB0UXVlcnkubWF0Y2hlcztcbiAgaWYgKHRRdWVyeU1hdGNoZXMgIT09IG51bGwpIHtcbiAgICBjb25zdCBsVmlld1Jlc3VsdHMgPSBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzPFQ+KHRWaWV3LCBsVmlldywgdFF1ZXJ5LCBxdWVyeUluZGV4KTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFF1ZXJ5TWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgdE5vZGVJZHggPSB0UXVlcnlNYXRjaGVzW2ldO1xuICAgICAgaWYgKHROb2RlSWR4ID4gMCkge1xuICAgICAgICByZXN1bHQucHVzaChsVmlld1Jlc3VsdHNbaSAvIDJdIGFzIFQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY2hpbGRRdWVyeUluZGV4ID0gdFF1ZXJ5TWF0Y2hlc1tpICsgMV07XG5cbiAgICAgICAgY29uc3QgZGVjbGFyYXRpb25MQ29udGFpbmVyID0gbFZpZXdbLXROb2RlSWR4XSBhcyBMQ29udGFpbmVyO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkxDb250YWluZXIpO1xuXG4gICAgICAgIC8vIGNvbGxlY3QgbWF0Y2hlcyBmb3Igdmlld3MgaW5zZXJ0ZWQgaW4gdGhpcyBjb250YWluZXJcbiAgICAgICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgZGVjbGFyYXRpb25MQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGRlY2xhcmF0aW9uTENvbnRhaW5lcltpXTtcbiAgICAgICAgICBpZiAoZW1iZWRkZWRMVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXSA9PT0gZW1iZWRkZWRMVmlld1tQQVJFTlRdKSB7XG4gICAgICAgICAgICBjb2xsZWN0UXVlcnlSZXN1bHRzKGVtYmVkZGVkTFZpZXdbVFZJRVddLCBlbWJlZGRlZExWaWV3LCBjaGlsZFF1ZXJ5SW5kZXgsIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBjcmVhdGVkIGZyb20gdGhpcyBkZWNsYXJhdGlvbiBjb250YWluZXIgYW5kIGluc2VydGVkIGludG9cbiAgICAgICAgLy8gZGlmZmVyZW50IGNvbnRhaW5lcnNcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lcltNT1ZFRF9WSUVXU10gIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3cyA9IGRlY2xhcmF0aW9uTENvbnRhaW5lcltNT1ZFRF9WSUVXU10hO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW1iZWRkZWRMVmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBlbWJlZGRlZExWaWV3c1tpXTtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld1tUVklFV10sIGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqXG4gKiBAcmV0dXJucyBgdHJ1ZWAgaWYgYSBxdWVyeSBnb3QgZGlydHkgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gb3IgaWYgdGhpcyBpcyBhIHN0YXRpYyBxdWVyeVxuICogcmVzb2x2aW5nIGluIGNyZWF0aW9uIG1vZGUsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IHF1ZXJ5SW5kZXggPSBnZXRDdXJyZW50UXVlcnlJbmRleCgpO1xuXG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KHF1ZXJ5SW5kZXggKyAxKTtcblxuICBjb25zdCB0UXVlcnkgPSBnZXRUUXVlcnkodFZpZXcsIHF1ZXJ5SW5kZXgpO1xuICBpZiAocXVlcnlMaXN0LmRpcnR5ICYmIChpc0NyZWF0aW9uTW9kZShsVmlldykgPT09IHRRdWVyeS5tZXRhZGF0YS5pc1N0YXRpYykpIHtcbiAgICBpZiAodFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgIHF1ZXJ5TGlzdC5yZXNldChbXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRRdWVyeS5jcm9zc2VzTmdUZW1wbGF0ZSA/XG4gICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyh0VmlldywgbFZpZXcsIHF1ZXJ5SW5kZXgsIFtdKSA6XG4gICAgICAgICAgbWF0ZXJpYWxpemVWaWV3UmVzdWx0cyh0VmlldywgbFZpZXcsIHRRdWVyeSwgcXVlcnlJbmRleCk7XG4gICAgICBxdWVyeUxpc3QucmVzZXQocmVzdWx0KTtcbiAgICAgIHF1ZXJ5TGlzdC5ub3RpZnlPbkNoYW5nZXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBuZXcgUXVlcnlMaXN0IGZvciBhIHN0YXRpYyB2aWV3IHF1ZXJ5LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdGF0aWNWaWV3UXVlcnk8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48dW5rbm93bj58c3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgdmlld1F1ZXJ5SW50ZXJuYWwoZ2V0VFZpZXcoKSwgZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QsIHN0b3JlcyB0aGUgcmVmZXJlbmNlIGluIExWaWV3IGFuZCByZXR1cm5zIFF1ZXJ5TGlzdC5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dmlld1F1ZXJ5PFQ+KFxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fEluamVjdGlvblRva2VuPHVua25vd24+fHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkPzogYW55KTogdm9pZCB7XG4gIHZpZXdRdWVyeUludGVybmFsKGdldFRWaWV3KCksIGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiB2aWV3UXVlcnlJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48dW5rbm93bj58c3RyaW5nW10sXG4gICAgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55LCBpc1N0YXRpYzogYm9vbGVhbik6IHZvaWQge1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZGVzY2VuZCwgaXNTdGF0aWMsIHJlYWQpLCAtMSk7XG4gICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNWaWV3UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG4gIGNyZWF0ZUxRdWVyeTxUPih0VmlldywgbFZpZXcpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2ggKHBhcnQgb2YgYSB2aWV3XG4gKiByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjx1bmtub3duPnxzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbixcbiAgICByZWFkPzogYW55KTogdm9pZCB7XG4gIGNvbnRlbnRRdWVyeUludGVybmFsKFxuICAgICAgZ2V0VFZpZXcoKSwgZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCBmYWxzZSwgZ2V0Q3VycmVudFROb2RlKCkhLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBzdGF0aWMgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2hcbiAqIChwYXJ0IG9mIGEgdmlldyByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY0NvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjx1bmtub3duPnxzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbixcbiAgICByZWFkPzogYW55KTogdm9pZCB7XG4gIGNvbnRlbnRRdWVyeUludGVybmFsKFxuICAgICAgZ2V0VFZpZXcoKSwgZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCB0cnVlLCBnZXRDdXJyZW50VE5vZGUoKSEsIGRpcmVjdGl2ZUluZGV4KTtcbn1cblxuZnVuY3Rpb24gY29udGVudFF1ZXJ5SW50ZXJuYWw8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogVHlwZTxhbnk+fEluamVjdGlvblRva2VuPHVua25vd24+fHN0cmluZ1tdLFxuICAgIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSwgaXNTdGF0aWM6IGJvb2xlYW4sIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZGVzY2VuZCwgaXNTdGF0aWMsIHJlYWQpLCB0Tm9kZS5pbmRleCk7XG4gICAgc2F2ZUNvbnRlbnRRdWVyeUFuZERpcmVjdGl2ZUluZGV4KHRWaWV3LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlTFF1ZXJ5PFQ+KHRWaWV3LCBsVmlldyk7XG59XG5cbi8qKlxuICogTG9hZHMgYSBRdWVyeUxpc3QgY29ycmVzcG9uZGluZyB0byB0aGUgY3VycmVudCB2aWV3IG9yIGNvbnRlbnQgcXVlcnkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVsb2FkUXVlcnk8VD4oKTogUXVlcnlMaXN0PFQ+IHtcbiAgcmV0dXJuIGxvYWRRdWVyeUludGVybmFsPFQ+KGdldExWaWV3KCksIGdldEN1cnJlbnRRdWVyeUluZGV4KCkpO1xufVxuXG5mdW5jdGlvbiBsb2FkUXVlcnlJbnRlcm5hbDxUPihsVmlldzogTFZpZXcsIHF1ZXJ5SW5kZXg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChsVmlld1tRVUVSSUVTXSwgJ0xRdWVyaWVzIHNob3VsZCBiZSBkZWZpbmVkIHdoZW4gdHJ5aW5nIHRvIGxvYWQgYSBxdWVyeScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3W1FVRVJJRVNdIS5xdWVyaWVzLCBxdWVyeUluZGV4KTtcbiAgcmV0dXJuIGxWaWV3W1FVRVJJRVNdIS5xdWVyaWVzW3F1ZXJ5SW5kZXhdLnF1ZXJ5TGlzdDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTFF1ZXJ5PFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IHF1ZXJ5TGlzdCA9IG5ldyBRdWVyeUxpc3Q8VD4oKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQodFZpZXcsIGxWaWV3LCBxdWVyeUxpc3QsIHF1ZXJ5TGlzdC5kZXN0cm95KTtcblxuICBpZiAobFZpZXdbUVVFUklFU10gPT09IG51bGwpIGxWaWV3W1FVRVJJRVNdID0gbmV3IExRdWVyaWVzXygpO1xuICBsVmlld1tRVUVSSUVTXSEucXVlcmllcy5wdXNoKG5ldyBMUXVlcnlfKHF1ZXJ5TGlzdCkpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUUXVlcnkodFZpZXc6IFRWaWV3LCBtZXRhZGF0YTogVFF1ZXJ5TWV0YWRhdGEsIG5vZGVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGlmICh0Vmlldy5xdWVyaWVzID09PSBudWxsKSB0Vmlldy5xdWVyaWVzID0gbmV3IFRRdWVyaWVzXygpO1xuICB0Vmlldy5xdWVyaWVzLnRyYWNrKG5ldyBUUXVlcnlfKG1ldGFkYXRhLCBub2RlSW5kZXgpKTtcbn1cblxuZnVuY3Rpb24gc2F2ZUNvbnRlbnRRdWVyeUFuZERpcmVjdGl2ZUluZGV4KHRWaWV3OiBUVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCB0Vmlld0NvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXMgfHwgKHRWaWV3LmNvbnRlbnRRdWVyaWVzID0gW10pO1xuICBjb25zdCBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCA9XG4gICAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLmxlbmd0aCA/IHRWaWV3Q29udGVudFF1ZXJpZXNbdFZpZXdDb250ZW50UXVlcmllcy5sZW5ndGggLSAxXSA6IC0xO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKHRWaWV3LnF1ZXJpZXMhLmxlbmd0aCAtIDEsIGRpcmVjdGl2ZUluZGV4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRUUXVlcnkodFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyKTogVFF1ZXJ5IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcucXVlcmllcywgJ1RRdWVyaWVzIG11c3QgYmUgZGVmaW5lZCB0byByZXRyaWV2ZSBhIFRRdWVyeScpO1xuICByZXR1cm4gdFZpZXcucXVlcmllcyEuZ2V0QnlJbmRleChpbmRleCk7XG59XG4iXX0=