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
import { assertDataInRange, assertDefined, throwError } from '../util/assert';
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
import { assertNodeOfPossibleTypes } from './node_assert';
import { getCurrentQueryIndex, getLView, getPreviousOrParentTNode, getTView, setCurrentQueryIndex } from './state';
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
        ngDevMode && assertDataInRange(this.queries, index);
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
            while (parent !== null && parent.type === 4 /* ElementContainer */ &&
                parent.index !== declarationNodeIdx) {
                parent = parent.parent;
            }
            return declarationNodeIdx === (parent !== null ? parent.index : -1);
        }
        return this._appliesToNextNode;
    }
    matchTNode(tView, tNode) {
        if (Array.isArray(this.metadata.predicate)) {
            const localNames = this.metadata.predicate;
            for (let i = 0; i < localNames.length; i++) {
                this.matchTNodeWithReadOption(tView, tNode, getIdxOfMatchingSelector(tNode, localNames[i]));
            }
        }
        else {
            const typePredicate = this.metadata.predicate;
            if (typePredicate === ViewEngine_TemplateRef) {
                if (tNode.type === 0 /* Container */) {
                    this.matchTNodeWithReadOption(tView, tNode, -1);
                }
            }
            else {
                this.matchTNodeWithReadOption(tView, tNode, locateDirectiveOrProvider(tNode, tView, typePredicate, false, false));
            }
        }
    }
    matchTNodeWithReadOption(tView, tNode, nodeMatchIdx) {
        if (nodeMatchIdx !== null) {
            const read = this.metadata.read;
            if (read !== null) {
                if (read === ViewEngine_ElementRef || read === ViewContainerRef ||
                    read === ViewEngine_TemplateRef && tNode.type === 0 /* Container */) {
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
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        return createElementRef(ViewEngine_ElementRef, tNode, currentView);
    }
    else if (tNode.type === 0 /* Container */) {
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
        ngDevMode &&
            assertNodeOfPossibleTypes(tNode, [3 /* Element */, 0 /* Container */, 4 /* ElementContainer */]);
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
                ngDevMode && assertDataInRange(tViewData, matchedNodeIdx);
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
    contentQueryInternal(getTView(), getLView(), predicate, descend, read, false, getPreviousOrParentTNode(), directiveIndex);
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
    contentQueryInternal(getTView(), getLView(), predicate, descend, read, true, getPreviousOrParentTNode(), directiveIndex);
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
    ngDevMode && assertDataInRange(lView[QUERIES].queries, queryIndex);
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
    const lastSavedDirectiveIndex = tView.contentQueries.length ? tViewContentQueries[tViewContentQueries.length - 1] : -1;
    if (directiveIndex !== lastSavedDirectiveIndex) {
        tViewContentQueries.push(tView.queries.length - 1, directiveIndex);
    }
}
function getTQuery(tView, index) {
    ngDevMode && assertDefined(tView.queries, 'TQueries must be defined to retrieve a TQuery');
    return tView.queries.getByIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU9ILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLHVCQUF1QixFQUFjLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hGLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQXFELDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hJLE9B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QWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCB0aHJvd0Vycm9yfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lcn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0YWJsZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3N0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgTFF1ZXJ5LCBUUXVlcmllcywgVFF1ZXJ5LCBUUXVlcnlNZXRhZGF0YSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7REVDTEFSQVRJT05fTENPTlRBSU5FUiwgTFZpZXcsIFBBUkVOVCwgUVVFUklFUywgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDdXJyZW50UXVlcnlJbmRleCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0VFZpZXcsIHNldEN1cnJlbnRRdWVyeUluZGV4fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDcmVhdGlvbk1vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Y3JlYXRlQ29udGFpbmVyUmVmLCBjcmVhdGVFbGVtZW50UmVmLCBjcmVhdGVUZW1wbGF0ZVJlZn0gZnJvbSAnLi92aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5JztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG5jbGFzcyBMUXVlcnlfPFQ+IGltcGxlbWVudHMgTFF1ZXJ5PFQ+IHtcbiAgbWF0Y2hlczogKFR8bnVsbClbXXxudWxsID0gbnVsbDtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+KSB7fVxuICBjbG9uZSgpOiBMUXVlcnk8VD4ge1xuICAgIHJldHVybiBuZXcgTFF1ZXJ5Xyh0aGlzLnF1ZXJ5TGlzdCk7XG4gIH1cbiAgc2V0RGlydHkoKTogdm9pZCB7XG4gICAgdGhpcy5xdWVyeUxpc3Quc2V0RGlydHkoKTtcbiAgfVxufVxuXG5jbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBxdWVyaWVzOiBMUXVlcnk8YW55PltdID0gW10pIHt9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KHRWaWV3OiBUVmlldyk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHRRdWVyaWVzID0gdFZpZXcucXVlcmllcztcbiAgICBpZiAodFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IG5vT2ZJbmhlcml0ZWRRdWVyaWVzID1cbiAgICAgICAgICB0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCA/IHRWaWV3LmNvbnRlbnRRdWVyaWVzWzBdIDogdFF1ZXJpZXMubGVuZ3RoO1xuICAgICAgY29uc3Qgdmlld0xRdWVyaWVzOiBMUXVlcnk8YW55PltdID0gW107XG5cbiAgICAgIC8vIEFuIGVtYmVkZGVkIHZpZXcgaGFzIHF1ZXJpZXMgcHJvcGFnYXRlZCBmcm9tIGEgZGVjbGFyYXRpb24gdmlldyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuICAgICAgLy8gVFF1ZXJpZXMgY29sbGVjdGlvbiBhbmQgdXAgdW50aWwgYSBmaXJzdCBjb250ZW50IHF1ZXJ5IGRlY2xhcmVkIGluIHRoZSBlbWJlZGRlZCB2aWV3LiBPbmx5XG4gICAgICAvLyBwcm9wYWdhdGVkIExRdWVyaWVzIGFyZSBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKExRdWVyeSBjb3JyZXNwb25kaW5nIHRvIGRlY2xhcmVkIGNvbnRlbnRcbiAgICAgIC8vIHF1ZXJpZXMgd2lsbCBiZSBpbnN0YW50aWF0ZWQgZnJvbSB0aGUgY29udGVudCBxdWVyeSBpbnN0cnVjdGlvbnMgZm9yIGVhY2ggZGlyZWN0aXZlKS5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9PZkluaGVyaXRlZFF1ZXJpZXM7IGkrKykge1xuICAgICAgICBjb25zdCB0UXVlcnkgPSB0UXVlcmllcy5nZXRCeUluZGV4KGkpO1xuICAgICAgICBjb25zdCBwYXJlbnRMUXVlcnkgPSB0aGlzLnF1ZXJpZXNbdFF1ZXJ5LmluZGV4SW5EZWNsYXJhdGlvblZpZXddO1xuICAgICAgICB2aWV3TFF1ZXJpZXMucHVzaChwYXJlbnRMUXVlcnkuY2xvbmUoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgTFF1ZXJpZXNfKHZpZXdMUXVlcmllcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICAgIHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpO1xuICB9XG5cbiAgZGV0YWNoVmlldyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgICB0aGlzLmRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3KTtcbiAgfVxuXG4gIHByaXZhdGUgZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXc6IFRWaWV3KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChnZXRUUXVlcnkodFZpZXcsIGkpLm1hdGNoZXMgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5xdWVyaWVzW2ldLnNldERpcnR5KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFRRdWVyeU1ldGFkYXRhXyBpbXBsZW1lbnRzIFRRdWVyeU1ldGFkYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcHJlZGljYXRlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48dW5rbm93bj58c3RyaW5nW10sIHB1YmxpYyBkZXNjZW5kYW50czogYm9vbGVhbixcbiAgICAgIHB1YmxpYyBpc1N0YXRpYzogYm9vbGVhbiwgcHVibGljIHJlYWQ6IGFueSA9IG51bGwpIHt9XG59XG5cbmNsYXNzIFRRdWVyaWVzXyBpbXBsZW1lbnRzIFRRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBxdWVyaWVzOiBUUXVlcnlbXSA9IFtdKSB7fVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cbiAgZWxlbWVudEVuZCh0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRFbmQodE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSk6IFRRdWVyaWVzfG51bGwge1xuICAgIGxldCBxdWVyaWVzRm9yVGVtcGxhdGVSZWY6IFRRdWVyeVtdfG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgIT09IG51bGwgPyBxdWVyaWVzRm9yVGVtcGxhdGVSZWYubGVuZ3RoIDogMDtcbiAgICAgIGNvbnN0IHRxdWVyeUNsb25lID0gdGhpcy5nZXRCeUluZGV4KGkpLmVtYmVkZGVkVFZpZXcodE5vZGUsIGNoaWxkUXVlcnlJbmRleCk7XG5cbiAgICAgIGlmICh0cXVlcnlDbG9uZSkge1xuICAgICAgICB0cXVlcnlDbG9uZS5pbmRleEluRGVjbGFyYXRpb25WaWV3ID0gaTtcbiAgICAgICAgaWYgKHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCkge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5wdXNoKHRxdWVyeUNsb25lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgPSBbdHF1ZXJ5Q2xvbmVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IG5ldyBUUXVlcmllc18ocXVlcmllc0ZvclRlbXBsYXRlUmVmKSA6IG51bGw7XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS50ZW1wbGF0ZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGdldEJ5SW5kZXgoaW5kZXg6IG51bWJlcik6IFRRdWVyeSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHRoaXMucXVlcmllcywgaW5kZXgpO1xuICAgIHJldHVybiB0aGlzLnF1ZXJpZXNbaW5kZXhdO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnF1ZXJpZXMubGVuZ3RoO1xuICB9XG5cbiAgdHJhY2sodHF1ZXJ5OiBUUXVlcnkpOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXJpZXMucHVzaCh0cXVlcnkpO1xuICB9XG59XG5cbmNsYXNzIFRRdWVyeV8gaW1wbGVtZW50cyBUUXVlcnkge1xuICBtYXRjaGVzOiBudW1iZXJbXXxudWxsID0gbnVsbDtcbiAgaW5kZXhJbkRlY2xhcmF0aW9uVmlldyA9IC0xO1xuICBjcm9zc2VzTmdUZW1wbGF0ZSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBBIG5vZGUgaW5kZXggb24gd2hpY2ggYSBxdWVyeSB3YXMgZGVjbGFyZWQgKC0xIGZvciB2aWV3IHF1ZXJpZXMgYW5kIG9uZXMgaW5oZXJpdGVkIGZyb20gdGhlXG4gICAqIGRlY2xhcmF0aW9uIHRlbXBsYXRlKS4gV2UgdXNlIHRoaXMgaW5kZXggKGFsb25nc2lkZSB3aXRoIF9hcHBsaWVzVG9OZXh0Tm9kZSBmbGFnKSB0byBrbm93XG4gICAqIHdoZW4gdG8gYXBwbHkgY29udGVudCBxdWVyaWVzIHRvIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbk5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIGZsYWcgaW5kaWNhdGluZyBpZiBhIGdpdmVuIHF1ZXJ5IHN0aWxsIGFwcGxpZXMgdG8gbm9kZXMgaXQgaXMgY3Jvc3NpbmcuIFdlIHVzZSB0aGlzIGZsYWdcbiAgICogKGFsb25nc2lkZSB3aXRoIF9kZWNsYXJhdGlvbk5vZGVJbmRleCkgdG8ga25vdyB3aGVuIHRvIHN0b3AgYXBwbHlpbmcgY29udGVudCBxdWVyaWVzIHRvXG4gICAqIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9hcHBsaWVzVG9OZXh0Tm9kZSA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIG1ldGFkYXRhOiBUUXVlcnlNZXRhZGF0YSwgbm9kZUluZGV4OiBudW1iZXIgPSAtMSkge1xuICAgIHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID0gbm9kZUluZGV4O1xuICB9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMubWF0Y2hUTm9kZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGVsZW1lbnRFbmQodE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID09PSB0Tm9kZS5pbmRleCkge1xuICAgICAgdGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudFN0YXJ0KHRWaWV3LCB0Tm9kZSk7XG4gIH1cblxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSwgY2hpbGRRdWVyeUluZGV4OiBudW1iZXIpOiBUUXVlcnl8bnVsbCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMuY3Jvc3Nlc05nVGVtcGxhdGUgPSB0cnVlO1xuICAgICAgLy8gQSBtYXJrZXIgaW5kaWNhdGluZyBhIGA8bmctdGVtcGxhdGU+YCBlbGVtZW50IChhIHBsYWNlaG9sZGVyIGZvciBxdWVyeSByZXN1bHRzIGZyb21cbiAgICAgIC8vIGVtYmVkZGVkIHZpZXdzIGNyZWF0ZWQgYmFzZWQgb24gdGhpcyBgPG5nLXRlbXBsYXRlPmApLlxuICAgICAgdGhpcy5hZGRNYXRjaCgtdE5vZGUuaW5kZXgsIGNoaWxkUXVlcnlJbmRleCk7XG4gICAgICByZXR1cm4gbmV3IFRRdWVyeV8odGhpcy5tZXRhZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0FwcGx5aW5nVG9Ob2RlKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZSAmJiB0aGlzLm1ldGFkYXRhLmRlc2NlbmRhbnRzID09PSBmYWxzZSkge1xuICAgICAgY29uc3QgZGVjbGFyYXRpb25Ob2RlSWR4ID0gdGhpcy5fZGVjbGFyYXRpb25Ob2RlSW5kZXg7XG4gICAgICBsZXQgcGFyZW50ID0gdE5vZGUucGFyZW50O1xuICAgICAgLy8gRGV0ZXJtaW5lIGlmIGEgZ2l2ZW4gVE5vZGUgaXMgYSBcImRpcmVjdFwiIGNoaWxkIG9mIGEgbm9kZSBvbiB3aGljaCBhIGNvbnRlbnQgcXVlcnkgd2FzXG4gICAgICAvLyBkZWNsYXJlZCAob25seSBkaXJlY3QgY2hpbGRyZW4gb2YgcXVlcnkncyBob3N0IG5vZGUgY2FuIG1hdGNoIHdpdGggdGhlIGRlc2NlbmRhbnRzOiBmYWxzZVxuICAgICAgLy8gb3B0aW9uKS4gVGhlcmUgYXJlIDMgbWFpbiB1c2UtY2FzZSAvIGNvbmRpdGlvbnMgdG8gY29uc2lkZXIgaGVyZTpcbiAgICAgIC8vIC0gPG5lZWRzLXRhcmdldD48aSAjdGFyZ2V0PjwvaT48L25lZWRzLXRhcmdldD46IGhlcmUgPGkgI3RhcmdldD4gcGFyZW50IG5vZGUgaXMgYSBxdWVyeVxuICAgICAgLy8gaG9zdCBub2RlO1xuICAgICAgLy8gLSA8bmVlZHMtdGFyZ2V0PjxuZy10ZW1wbGF0ZSBbbmdJZl09XCJ0cnVlXCI+PGkgI3RhcmdldD48L2k+PC9uZy10ZW1wbGF0ZT48L25lZWRzLXRhcmdldD46XG4gICAgICAvLyBoZXJlIDxpICN0YXJnZXQ+IHBhcmVudCBub2RlIGlzIG51bGw7XG4gICAgICAvLyAtIDxuZWVkcy10YXJnZXQ+PG5nLWNvbnRhaW5lcj48aSAjdGFyZ2V0PjwvaT48L25nLWNvbnRhaW5lcj48L25lZWRzLXRhcmdldD46IGhlcmUgd2UgbmVlZFxuICAgICAgLy8gdG8gZ28gcGFzdCBgPG5nLWNvbnRhaW5lcj5gIHRvIGRldGVybWluZSA8aSAjdGFyZ2V0PiBwYXJlbnQgbm9kZSAoYnV0IHdlIHNob3VsZG4ndCB0cmF2ZXJzZVxuICAgICAgLy8gdXAgcGFzdCB0aGUgcXVlcnkncyBob3N0IG5vZGUhKS5cbiAgICAgIHdoaWxlIChwYXJlbnQgIT09IG51bGwgJiYgcGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyICYmXG4gICAgICAgICAgICAgcGFyZW50LmluZGV4ICE9PSBkZWNsYXJhdGlvbk5vZGVJZHgpIHtcbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWNsYXJhdGlvbk5vZGVJZHggPT09IChwYXJlbnQgIT09IG51bGwgPyBwYXJlbnQuaW5kZXggOiAtMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZTtcbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hUTm9kZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMubWV0YWRhdGEucHJlZGljYXRlKSkge1xuICAgICAgY29uc3QgbG9jYWxOYW1lcyA9IHRoaXMubWV0YWRhdGEucHJlZGljYXRlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3LCB0Tm9kZSwgZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBsb2NhbE5hbWVzW2ldKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHR5cGVQcmVkaWNhdGUgPSB0aGlzLm1ldGFkYXRhLnByZWRpY2F0ZSBhcyBhbnk7XG4gICAgICBpZiAodHlwZVByZWRpY2F0ZSA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3LCB0Tm9kZSwgLTEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbihcbiAgICAgICAgICAgIHRWaWV3LCB0Tm9kZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHR5cGVQcmVkaWNhdGUsIGZhbHNlLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBub2RlTWF0Y2hJZHg6IG51bWJlcnxudWxsKTogdm9pZCB7XG4gICAgaWYgKG5vZGVNYXRjaElkeCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgcmVhZCA9IHRoaXMubWV0YWRhdGEucmVhZDtcbiAgICAgIGlmIChyZWFkICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChyZWFkID09PSBWaWV3RW5naW5lX0VsZW1lbnRSZWYgfHwgcmVhZCA9PT0gVmlld0NvbnRhaW5lclJlZiB8fFxuICAgICAgICAgICAgcmVhZCA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiAmJiB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgLTIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHggPVxuICAgICAgICAgICAgICBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgcmVhZCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICBpZiAoZGlyZWN0aXZlT3JQcm92aWRlcklkeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgZGlyZWN0aXZlT3JQcm92aWRlcklkeCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCBub2RlTWF0Y2hJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkTWF0Y2godE5vZGVJZHg6IG51bWJlciwgbWF0Y2hJZHg6IG51bWJlcikge1xuICAgIGlmICh0aGlzLm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMubWF0Y2hlcyA9IFt0Tm9kZUlkeCwgbWF0Y2hJZHhdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1hdGNoZXMucHVzaCh0Tm9kZUlkeCwgbWF0Y2hJZHgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgbG9jYWwgbmFtZXMgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgcmV0dXJucyBkaXJlY3RpdmUgaW5kZXhcbiAqIChvciAtMSBpZiBhIGxvY2FsIG5hbWUgcG9pbnRzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBzdGF0aWMgZGF0YSBvZiBhIG5vZGUgdG8gY2hlY2tcbiAqIEBwYXJhbSBzZWxlY3RvciBzZWxlY3RvciB0byBtYXRjaFxuICogQHJldHVybnMgZGlyZWN0aXZlIGluZGV4LCAtMSBvciBudWxsIGlmIGEgc2VsZWN0b3IgZGlkbid0IG1hdGNoIGFueSBvZiB0aGUgbG9jYWwgbmFtZXNcbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAobG9jYWxOYW1lc1tpXSA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVzdWx0QnlUTm9kZVR5cGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZihWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVzdWx0Rm9yTm9kZShsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgbWF0Y2hpbmdJZHg6IG51bWJlciwgcmVhZDogYW55KTogYW55IHtcbiAgaWYgKG1hdGNoaW5nSWR4ID09PSAtMSkge1xuICAgIC8vIGlmIHJlYWQgdG9rZW4gYW5kIC8gb3Igc3RyYXRlZ3kgaXMgbm90IHNwZWNpZmllZCwgZGV0ZWN0IGl0IHVzaW5nIGFwcHJvcHJpYXRlIHROb2RlIHR5cGVcbiAgICByZXR1cm4gY3JlYXRlUmVzdWx0QnlUTm9kZVR5cGUodE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChtYXRjaGluZ0lkeCA9PT0gLTIpIHtcbiAgICAvLyByZWFkIGEgc3BlY2lhbCB0b2tlbiBmcm9tIGEgbm9kZSBpbmplY3RvclxuICAgIHJldHVybiBjcmVhdGVTcGVjaWFsVG9rZW4obFZpZXcsIHROb2RlLCByZWFkKTtcbiAgfSBlbHNlIHtcbiAgICAvLyByZWFkIGEgdG9rZW5cbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIGxWaWV3W1RWSUVXXSwgbWF0Y2hpbmdJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU3BlY2lhbFRva2VuKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCByZWFkOiBhbnkpOiBhbnkge1xuICBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9FbGVtZW50UmVmKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgIHROb2RlLCBbVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyXSk7XG4gICAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICAgICAgVmlld0NvbnRhaW5lclJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgYFNwZWNpYWwgdG9rZW4gdG8gcmVhZCBzaG91bGQgYmUgb25lIG9mIEVsZW1lbnRSZWYsIFRlbXBsYXRlUmVmIG9yIFZpZXdDb250YWluZXJSZWYgYnV0IGdvdCAke1xuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShyZWFkKX0uYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgcXVlcnkgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3LiBUaGlzIGZ1bmN0aW9uIGlzIG1lYW50IHRvIGRvIHRoZVxuICogcHJvY2Vzc2luZyBvbmNlIGFuZCBvbmx5IG9uY2UgZm9yIGEgZ2l2ZW4gdmlldyBpbnN0YW5jZSAoYSBzZXQgb2YgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3XG4gKiBkb2Vzbid0IGNoYW5nZSkuXG4gKi9cbmZ1bmN0aW9uIG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRRdWVyeTogVFF1ZXJ5LCBxdWVyeUluZGV4OiBudW1iZXIpOiAoVHxudWxsKVtdIHtcbiAgY29uc3QgbFF1ZXJ5ID0gbFZpZXdbUVVFUklFU10hLnF1ZXJpZXMhW3F1ZXJ5SW5kZXhdO1xuICBpZiAobFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICBjb25zdCB0Vmlld0RhdGEgPSB0Vmlldy5kYXRhO1xuICAgIGNvbnN0IHRRdWVyeU1hdGNoZXMgPSB0UXVlcnkubWF0Y2hlcyE7XG4gICAgY29uc3QgcmVzdWx0OiBUfG51bGxbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFF1ZXJ5TWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgbWF0Y2hlZE5vZGVJZHggPSB0UXVlcnlNYXRjaGVzW2ldO1xuICAgICAgaWYgKG1hdGNoZWROb2RlSWR4IDwgMCkge1xuICAgICAgICAvLyB3ZSBhdCB0aGUgPG5nLXRlbXBsYXRlPiBtYXJrZXIgd2hpY2ggbWlnaHQgaGF2ZSByZXN1bHRzIGluIHZpZXdzIGNyZWF0ZWQgYmFzZWQgb24gdGhpc1xuICAgICAgICAvLyA8bmctdGVtcGxhdGU+IC0gdGhvc2UgcmVzdWx0cyB3aWxsIGJlIGluIHNlcGFyYXRlIHZpZXdzIHRob3VnaCwgc28gaGVyZSB3ZSBqdXN0IGxlYXZlXG4gICAgICAgIC8vIG51bGwgYXMgYSBwbGFjZWhvbGRlclxuICAgICAgICByZXN1bHQucHVzaChudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh0Vmlld0RhdGEsIG1hdGNoZWROb2RlSWR4KTtcbiAgICAgICAgY29uc3QgdE5vZGUgPSB0Vmlld0RhdGFbbWF0Y2hlZE5vZGVJZHhdIGFzIFROb2RlO1xuICAgICAgICByZXN1bHQucHVzaChjcmVhdGVSZXN1bHRGb3JOb2RlKGxWaWV3LCB0Tm9kZSwgdFF1ZXJ5TWF0Y2hlc1tpICsgMV0sIHRRdWVyeS5tZXRhZGF0YS5yZWFkKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxRdWVyeS5tYXRjaGVzID0gcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIGxRdWVyeS5tYXRjaGVzO1xufVxuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgY29sbGVjdHMgKGFscmVhZHkgbWF0ZXJpYWxpemVkKSBxdWVyeSByZXN1bHRzIGZyb20gYSB0cmVlIG9mIHZpZXdzLFxuICogc3RhcnRpbmcgd2l0aCBhIHByb3ZpZGVkIExWaWV3LlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UXVlcnlSZXN1bHRzPFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBxdWVyeUluZGV4OiBudW1iZXIsIHJlc3VsdDogVFtdKTogVFtdIHtcbiAgY29uc3QgdFF1ZXJ5ID0gdFZpZXcucXVlcmllcyEuZ2V0QnlJbmRleChxdWVyeUluZGV4KTtcbiAgY29uc3QgdFF1ZXJ5TWF0Y2hlcyA9IHRRdWVyeS5tYXRjaGVzO1xuICBpZiAodFF1ZXJ5TWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxWaWV3UmVzdWx0cyA9IG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4odFZpZXcsIGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0UXVlcnlNYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCB0Tm9kZUlkeCA9IHRRdWVyeU1hdGNoZXNbaV07XG4gICAgICBpZiAodE5vZGVJZHggPiAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGxWaWV3UmVzdWx0c1tpIC8gMl0gYXMgVCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSB0UXVlcnlNYXRjaGVzW2kgKyAxXTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1stdE5vZGVJZHhdIGFzIExDb250YWluZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uTENvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBpbnNlcnRlZCBpbiB0aGlzIGNvbnRhaW5lclxuICAgICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBkZWNsYXJhdGlvbkxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW2ldO1xuICAgICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdID09PSBlbWJlZGRlZExWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld1tUVklFV10sIGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGlzIGRlY2xhcmF0aW9uIGNvbnRhaW5lciBhbmQgaW5zZXJ0ZWQgaW50b1xuICAgICAgICAvLyBkaWZmZXJlbnQgY29udGFpbmVyc1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXdzID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbWJlZGRlZExWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGVtYmVkZGVkTFZpZXdzW2ldO1xuICAgICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyhlbWJlZGRlZExWaWV3W1RWSUVXXSwgZW1iZWRkZWRMVmlldywgY2hpbGRRdWVyeUluZGV4LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhIHF1ZXJ5IGJ5IGNvbWJpbmluZyBtYXRjaGVzIGZyb20gYWxsIGFjdGl2ZSB2aWV3cyBhbmQgcmVtb3ZpbmcgbWF0Y2hlcyBmcm9tIGRlbGV0ZWRcbiAqIHZpZXdzLlxuICpcbiAqIEByZXR1cm5zIGB0cnVlYCBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBvciBpZiB0aGlzIGlzIGEgc3RhdGljIHF1ZXJ5XG4gKiByZXNvbHZpbmcgaW4gY3JlYXRpb24gbW9kZSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVxdWVyeVJlZnJlc2gocXVlcnlMaXN0OiBRdWVyeUxpc3Q8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgcXVlcnlJbmRleCA9IGdldEN1cnJlbnRRdWVyeUluZGV4KCk7XG5cbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlJbmRleCArIDEpO1xuXG4gIGNvbnN0IHRRdWVyeSA9IGdldFRRdWVyeSh0VmlldywgcXVlcnlJbmRleCk7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkgJiYgKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSA9PT0gdFF1ZXJ5Lm1ldGFkYXRhLmlzU3RhdGljKSkge1xuICAgIGlmICh0UXVlcnkubWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgcXVlcnlMaXN0LnJlc2V0KFtdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdFF1ZXJ5LmNyb3NzZXNOZ1RlbXBsYXRlID9cbiAgICAgICAgICBjb2xsZWN0UXVlcnlSZXN1bHRzKHRWaWV3LCBsVmlldywgcXVlcnlJbmRleCwgW10pIDpcbiAgICAgICAgICBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzKHRWaWV3LCBsVmlldywgdFF1ZXJ5LCBxdWVyeUluZGV4KTtcbiAgICAgIHF1ZXJ5TGlzdC5yZXNldChyZXN1bHQpO1xuICAgICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QgZm9yIGEgc3RhdGljIHZpZXcgcXVlcnkuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY1ZpZXdRdWVyeTxUPihcbiAgICBwcmVkaWNhdGU6IFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjx1bmtub3duPnxzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICB2aWV3UXVlcnlJbnRlcm5hbChnZXRUVmlldygpLCBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCwgc3RvcmVzIHRoZSByZWZlcmVuY2UgaW4gTFZpZXcgYW5kIHJldHVybnMgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV2aWV3UXVlcnk8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48dW5rbm93bj58c3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgdmlld1F1ZXJ5SW50ZXJuYWwoZ2V0VFZpZXcoKSwgZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHZpZXdRdWVyeUludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjx1bmtub3duPnxzdHJpbmdbXSxcbiAgICBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnksIGlzU3RhdGljOiBib29sZWFuKTogdm9pZCB7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjcmVhdGVUUXVlcnkodFZpZXcsIG5ldyBUUXVlcnlNZXRhZGF0YV8ocHJlZGljYXRlLCBkZXNjZW5kLCBpc1N0YXRpYywgcmVhZCksIC0xKTtcbiAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgIHRWaWV3LnN0YXRpY1ZpZXdRdWVyaWVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgY3JlYXRlTFF1ZXJ5PFQ+KHRWaWV3LCBsVmlldyk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fEluamVjdGlvblRva2VuPHVua25vd24+fHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLFxuICAgIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRUVmlldygpLCBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGZhbHNlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSxcbiAgICAgIGRpcmVjdGl2ZUluZGV4KTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIHN0YXRpYyBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaFxuICogKHBhcnQgb2YgYSB2aWV3IHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3RhdGljQ29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fEluamVjdGlvblRva2VuPHVua25vd24+fHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLFxuICAgIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRUVmlldygpLCBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLFxuICAgICAgZGlyZWN0aXZlSW5kZXgpO1xufVxuXG5mdW5jdGlvbiBjb250ZW50UXVlcnlJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48dW5rbm93bj58c3RyaW5nW10sXG4gICAgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55LCBpc1N0YXRpYzogYm9vbGVhbiwgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjcmVhdGVUUXVlcnkodFZpZXcsIG5ldyBUUXVlcnlNZXRhZGF0YV8ocHJlZGljYXRlLCBkZXNjZW5kLCBpc1N0YXRpYywgcmVhZCksIHROb2RlLmluZGV4KTtcbiAgICBzYXZlQ29udGVudFF1ZXJ5QW5kRGlyZWN0aXZlSW5kZXgodFZpZXcsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgIHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVMUXVlcnk8VD4odFZpZXcsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBMb2FkcyBhIFF1ZXJ5TGlzdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBjdXJyZW50IHZpZXcgb3IgY29udGVudCBxdWVyeS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxvYWRRdWVyeTxUPigpOiBRdWVyeUxpc3Q8VD4ge1xuICByZXR1cm4gbG9hZFF1ZXJ5SW50ZXJuYWw8VD4oZ2V0TFZpZXcoKSwgZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRRdWVyeUludGVybmFsPFQ+KGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGxWaWV3W1FVRVJJRVNdLCAnTFF1ZXJpZXMgc2hvdWxkIGJlIGRlZmluZWQgd2hlbiB0cnlpbmcgdG8gbG9hZCBhIHF1ZXJ5Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlld1tRVUVSSUVTXSEucXVlcmllcywgcXVlcnlJbmRleCk7XG4gIHJldHVybiBsVmlld1tRVUVSSUVTXSEucXVlcmllc1txdWVyeUluZGV4XS5xdWVyeUxpc3Q7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxRdWVyeTxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KCk7XG4gIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KHRWaWV3LCBsVmlldywgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG5cbiAgaWYgKGxWaWV3W1FVRVJJRVNdID09PSBudWxsKSBsVmlld1tRVUVSSUVTXSA9IG5ldyBMUXVlcmllc18oKTtcbiAgbFZpZXdbUVVFUklFU10hLnF1ZXJpZXMucHVzaChuZXcgTFF1ZXJ5XyhxdWVyeUxpc3QpKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVFF1ZXJ5KHRWaWV3OiBUVmlldywgbWV0YWRhdGE6IFRRdWVyeU1ldGFkYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBpZiAodFZpZXcucXVlcmllcyA9PT0gbnVsbCkgdFZpZXcucXVlcmllcyA9IG5ldyBUUXVlcmllc18oKTtcbiAgdFZpZXcucXVlcmllcy50cmFjayhuZXcgVFF1ZXJ5XyhtZXRhZGF0YSwgbm9kZUluZGV4KSk7XG59XG5cbmZ1bmN0aW9uIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldzogVFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXdDb250ZW50UXVlcmllc1t0Vmlld0NvbnRlbnRRdWVyaWVzLmxlbmd0aCAtIDFdIDogLTE7XG4gIGlmIChkaXJlY3RpdmVJbmRleCAhPT0gbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXgpIHtcbiAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2godFZpZXcucXVlcmllcyEubGVuZ3RoIC0gMSwgZGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFRRdWVyeSh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIpOiBUUXVlcnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Vmlldy5xdWVyaWVzLCAnVFF1ZXJpZXMgbXVzdCBiZSBkZWZpbmVkIHRvIHJldHJpZXZlIGEgVFF1ZXJ5Jyk7XG4gIHJldHVybiB0Vmlldy5xdWVyaWVzIS5nZXRCeUluZGV4KGluZGV4KTtcbn1cbiJdfQ==