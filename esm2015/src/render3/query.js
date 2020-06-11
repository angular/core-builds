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
            assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU9ILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLHVCQUF1QixFQUFjLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hGLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQXFELDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hJLE9B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LENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsS0FBWSxFQUFFLFFBQXdCLEVBQUUsU0FBaUI7SUFDN0UsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLElBQUk7UUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7SUFDNUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELFNBQVMsaUNBQWlDLENBQUMsS0FBWSxFQUFFLGNBQXNCO0lBQzdFLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLGNBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDaEYsTUFBTSx1QkFBdUIsR0FDekIsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0YsSUFBSSxjQUFjLEtBQUssdUJBQXVCLEVBQUU7UUFDOUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztLQUNyRTtBQUNILENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFZLEVBQUUsS0FBYTtJQUM1QyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsK0NBQStDLENBQUMsQ0FBQztJQUMzRixPQUFPLEtBQUssQ0FBQyxPQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7YXNzZXJ0Rmlyc3RDcmVhdGVQYXNzLCBhc3NlcnRMQ29udGFpbmVyfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7c3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCBMUXVlcnksIFRRdWVyaWVzLCBUUXVlcnksIFRRdWVyeU1ldGFkYXRhLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtERUNMQVJBVElPTl9MQ09OVEFJTkVSLCBMVmlldywgUEFSRU5ULCBRVUVSSUVTLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldEN1cnJlbnRRdWVyeUluZGV4LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRUVmlldywgc2V0Q3VycmVudFF1ZXJ5SW5kZXh9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtpc0NyZWF0aW9uTW9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtjcmVhdGVDb250YWluZXJSZWYsIGNyZWF0ZUVsZW1lbnRSZWYsIGNyZWF0ZVRlbXBsYXRlUmVmfSBmcm9tICcuL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQ7XG5cbmNsYXNzIExRdWVyeV88VD4gaW1wbGVtZW50cyBMUXVlcnk8VD4ge1xuICBtYXRjaGVzOiAoVHxudWxsKVtdfG51bGwgPSBudWxsO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4pIHt9XG4gIGNsb25lKCk6IExRdWVyeTxUPiB7XG4gICAgcmV0dXJuIG5ldyBMUXVlcnlfKHRoaXMucXVlcnlMaXN0KTtcbiAgfVxuICBzZXREaXJ0eSgpOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXJ5TGlzdC5zZXREaXJ0eSgpO1xuICB9XG59XG5cbmNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXSkge31cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcodFZpZXc6IFRWaWV3KTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3QgdFF1ZXJpZXMgPSB0Vmlldy5xdWVyaWVzO1xuICAgIGlmICh0UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgbm9PZkluaGVyaXRlZFF1ZXJpZXMgPVxuICAgICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsID8gdFZpZXcuY29udGVudFF1ZXJpZXNbMF0gOiB0UXVlcmllcy5sZW5ndGg7XG4gICAgICBjb25zdCB2aWV3TFF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXTtcblxuICAgICAgLy8gQW4gZW1iZWRkZWQgdmlldyBoYXMgcXVlcmllcyBwcm9wYWdhdGVkIGZyb20gYSBkZWNsYXJhdGlvbiB2aWV3IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gICAgICAvLyBUUXVlcmllcyBjb2xsZWN0aW9uIGFuZCB1cCB1bnRpbCBhIGZpcnN0IGNvbnRlbnQgcXVlcnkgZGVjbGFyZWQgaW4gdGhlIGVtYmVkZGVkIHZpZXcuIE9ubHlcbiAgICAgIC8vIHByb3BhZ2F0ZWQgTFF1ZXJpZXMgYXJlIGNyZWF0ZWQgYXQgdGhpcyBwb2ludCAoTFF1ZXJ5IGNvcnJlc3BvbmRpbmcgdG8gZGVjbGFyZWQgY29udGVudFxuICAgICAgLy8gcXVlcmllcyB3aWxsIGJlIGluc3RhbnRpYXRlZCBmcm9tIHRoZSBjb250ZW50IHF1ZXJ5IGluc3RydWN0aW9ucyBmb3IgZWFjaCBkaXJlY3RpdmUpLlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mSW5oZXJpdGVkUXVlcmllczsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHRRdWVyeSA9IHRRdWVyaWVzLmdldEJ5SW5kZXgoaSk7XG4gICAgICAgIGNvbnN0IHBhcmVudExRdWVyeSA9IHRoaXMucXVlcmllc1t0UXVlcnkuaW5kZXhJbkRlY2xhcmF0aW9uVmlld107XG4gICAgICAgIHZpZXdMUXVlcmllcy5wdXNoKHBhcmVudExRdWVyeS5jbG9uZSgpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBMUXVlcmllc18odmlld0xRdWVyaWVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcodFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gICAgdGhpcy5kaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0Vmlldyk7XG4gIH1cblxuICBkZXRhY2hWaWV3KHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICAgIHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBkaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0VmlldzogVFZpZXcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGdldFRRdWVyeSh0VmlldywgaSkubWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnF1ZXJpZXNbaV0uc2V0RGlydHkoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgVFF1ZXJ5TWV0YWRhdGFfIGltcGxlbWVudHMgVFF1ZXJ5TWV0YWRhdGEge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBwcmVkaWNhdGU6IFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjx1bmtub3duPnxzdHJpbmdbXSwgcHVibGljIGRlc2NlbmRhbnRzOiBib29sZWFuLFxuICAgICAgcHVibGljIGlzU3RhdGljOiBib29sZWFuLCBwdWJsaWMgcmVhZDogYW55ID0gbnVsbCkge31cbn1cblxuY2xhc3MgVFF1ZXJpZXNfIGltcGxlbWVudHMgVFF1ZXJpZXMge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHF1ZXJpZXM6IFRRdWVyeVtdID0gW10pIHt9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnF1ZXJpZXNbaV0uZWxlbWVudEVuZCh0Tm9kZSk7XG4gICAgfVxuICB9XG4gIGVtYmVkZGVkVFZpZXcodE5vZGU6IFROb2RlKTogVFF1ZXJpZXN8bnVsbCB7XG4gICAgbGV0IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZjogVFF1ZXJ5W118bnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNoaWxkUXVlcnlJbmRleCA9IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5sZW5ndGggOiAwO1xuICAgICAgY29uc3QgdHF1ZXJ5Q2xvbmUgPSB0aGlzLmdldEJ5SW5kZXgoaSkuZW1iZWRkZWRUVmlldyh0Tm9kZSwgY2hpbGRRdWVyeUluZGV4KTtcblxuICAgICAgaWYgKHRxdWVyeUNsb25lKSB7XG4gICAgICAgIHRxdWVyeUNsb25lLmluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSBpO1xuICAgICAgICBpZiAocXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsKSB7XG4gICAgICAgICAgcXVlcmllc0ZvclRlbXBsYXRlUmVmLnB1c2godHF1ZXJ5Q2xvbmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiA9IFt0cXVlcnlDbG9uZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsID8gbmV3IFRRdWVyaWVzXyhxdWVyaWVzRm9yVGVtcGxhdGVSZWYpIDogbnVsbDtcbiAgfVxuXG4gIHRlbXBsYXRlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLnRlbXBsYXRlKHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QnlJbmRleChpbmRleDogbnVtYmVyKTogVFF1ZXJ5IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UodGhpcy5xdWVyaWVzLCBpbmRleCk7XG4gICAgcmV0dXJuIHRoaXMucXVlcmllc1tpbmRleF07XG4gIH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMucXVlcmllcy5sZW5ndGg7XG4gIH1cblxuICB0cmFjayh0cXVlcnk6IFRRdWVyeSk6IHZvaWQge1xuICAgIHRoaXMucXVlcmllcy5wdXNoKHRxdWVyeSk7XG4gIH1cbn1cblxuY2xhc3MgVFF1ZXJ5XyBpbXBsZW1lbnRzIFRRdWVyeSB7XG4gIG1hdGNoZXM6IG51bWJlcltdfG51bGwgPSBudWxsO1xuICBpbmRleEluRGVjbGFyYXRpb25WaWV3ID0gLTE7XG4gIGNyb3NzZXNOZ1RlbXBsYXRlID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEEgbm9kZSBpbmRleCBvbiB3aGljaCBhIHF1ZXJ5IHdhcyBkZWNsYXJlZCAoLTEgZm9yIHZpZXcgcXVlcmllcyBhbmQgb25lcyBpbmhlcml0ZWQgZnJvbSB0aGVcbiAgICogZGVjbGFyYXRpb24gdGVtcGxhdGUpLiBXZSB1c2UgdGhpcyBpbmRleCAoYWxvbmdzaWRlIHdpdGggX2FwcGxpZXNUb05leHROb2RlIGZsYWcpIHRvIGtub3dcbiAgICogd2hlbiB0byBhcHBseSBjb250ZW50IHF1ZXJpZXMgdG8gZWxlbWVudHMgaW4gYSB0ZW1wbGF0ZS5cbiAgICovXG4gIHByaXZhdGUgX2RlY2xhcmF0aW9uTm9kZUluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgZmxhZyBpbmRpY2F0aW5nIGlmIGEgZ2l2ZW4gcXVlcnkgc3RpbGwgYXBwbGllcyB0byBub2RlcyBpdCBpcyBjcm9zc2luZy4gV2UgdXNlIHRoaXMgZmxhZ1xuICAgKiAoYWxvbmdzaWRlIHdpdGggX2RlY2xhcmF0aW9uTm9kZUluZGV4KSB0byBrbm93IHdoZW4gdG8gc3RvcCBhcHBseWluZyBjb250ZW50IHF1ZXJpZXMgdG9cbiAgICogZWxlbWVudHMgaW4gYSB0ZW1wbGF0ZS5cbiAgICovXG4gIHByaXZhdGUgX2FwcGxpZXNUb05leHROb2RlID0gdHJ1ZTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgbWV0YWRhdGE6IFRRdWVyeU1ldGFkYXRhLCBub2RlSW5kZXg6IG51bWJlciA9IC0xKSB7XG4gICAgdGhpcy5fZGVjbGFyYXRpb25Ob2RlSW5kZXggPSBub2RlSW5kZXg7XG4gIH1cblxuICBlbGVtZW50U3RhcnQodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pc0FwcGx5aW5nVG9Ob2RlKHROb2RlKSkge1xuICAgICAgdGhpcy5tYXRjaFROb2RlKHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZWxlbWVudEVuZCh0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZGVjbGFyYXRpb25Ob2RlSW5kZXggPT09IHROb2RlLmluZGV4KSB7XG4gICAgICB0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHRlbXBsYXRlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgdGhpcy5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTtcbiAgfVxuXG4gIGVtYmVkZGVkVFZpZXcodE5vZGU6IFROb2RlLCBjaGlsZFF1ZXJ5SW5kZXg6IG51bWJlcik6IFRRdWVyeXxudWxsIHtcbiAgICBpZiAodGhpcy5pc0FwcGx5aW5nVG9Ob2RlKHROb2RlKSkge1xuICAgICAgdGhpcy5jcm9zc2VzTmdUZW1wbGF0ZSA9IHRydWU7XG4gICAgICAvLyBBIG1hcmtlciBpbmRpY2F0aW5nIGEgYDxuZy10ZW1wbGF0ZT5gIGVsZW1lbnQgKGEgcGxhY2Vob2xkZXIgZm9yIHF1ZXJ5IHJlc3VsdHMgZnJvbVxuICAgICAgLy8gZW1iZWRkZWQgdmlld3MgY3JlYXRlZCBiYXNlZCBvbiB0aGlzIGA8bmctdGVtcGxhdGU+YCkuXG4gICAgICB0aGlzLmFkZE1hdGNoKC10Tm9kZS5pbmRleCwgY2hpbGRRdWVyeUluZGV4KTtcbiAgICAgIHJldHVybiBuZXcgVFF1ZXJ5Xyh0aGlzLm1ldGFkYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGlzQXBwbHlpbmdUb05vZGUodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX2FwcGxpZXNUb05leHROb2RlICYmIHRoaXMubWV0YWRhdGEuZGVzY2VuZGFudHMgPT09IGZhbHNlKSB7XG4gICAgICBjb25zdCBkZWNsYXJhdGlvbk5vZGVJZHggPSB0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleDtcbiAgICAgIGxldCBwYXJlbnQgPSB0Tm9kZS5wYXJlbnQ7XG4gICAgICAvLyBEZXRlcm1pbmUgaWYgYSBnaXZlbiBUTm9kZSBpcyBhIFwiZGlyZWN0XCIgY2hpbGQgb2YgYSBub2RlIG9uIHdoaWNoIGEgY29udGVudCBxdWVyeSB3YXNcbiAgICAgIC8vIGRlY2xhcmVkIChvbmx5IGRpcmVjdCBjaGlsZHJlbiBvZiBxdWVyeSdzIGhvc3Qgbm9kZSBjYW4gbWF0Y2ggd2l0aCB0aGUgZGVzY2VuZGFudHM6IGZhbHNlXG4gICAgICAvLyBvcHRpb24pLiBUaGVyZSBhcmUgMyBtYWluIHVzZS1jYXNlIC8gY29uZGl0aW9ucyB0byBjb25zaWRlciBoZXJlOlxuICAgICAgLy8gLSA8bmVlZHMtdGFyZ2V0PjxpICN0YXJnZXQ+PC9pPjwvbmVlZHMtdGFyZ2V0PjogaGVyZSA8aSAjdGFyZ2V0PiBwYXJlbnQgbm9kZSBpcyBhIHF1ZXJ5XG4gICAgICAvLyBob3N0IG5vZGU7XG4gICAgICAvLyAtIDxuZWVkcy10YXJnZXQ+PG5nLXRlbXBsYXRlIFtuZ0lmXT1cInRydWVcIj48aSAjdGFyZ2V0PjwvaT48L25nLXRlbXBsYXRlPjwvbmVlZHMtdGFyZ2V0PjpcbiAgICAgIC8vIGhlcmUgPGkgI3RhcmdldD4gcGFyZW50IG5vZGUgaXMgbnVsbDtcbiAgICAgIC8vIC0gPG5lZWRzLXRhcmdldD48bmctY29udGFpbmVyPjxpICN0YXJnZXQ+PC9pPjwvbmctY29udGFpbmVyPjwvbmVlZHMtdGFyZ2V0PjogaGVyZSB3ZSBuZWVkXG4gICAgICAvLyB0byBnbyBwYXN0IGA8bmctY29udGFpbmVyPmAgdG8gZGV0ZXJtaW5lIDxpICN0YXJnZXQ+IHBhcmVudCBub2RlIChidXQgd2Ugc2hvdWxkbid0IHRyYXZlcnNlXG4gICAgICAvLyB1cCBwYXN0IHRoZSBxdWVyeSdzIGhvc3Qgbm9kZSEpLlxuICAgICAgd2hpbGUgKHBhcmVudCAhPT0gbnVsbCAmJiBwYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgJiZcbiAgICAgICAgICAgICBwYXJlbnQuaW5kZXggIT09IGRlY2xhcmF0aW9uTm9kZUlkeCkge1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlY2xhcmF0aW9uTm9kZUlkeCA9PT0gKHBhcmVudCAhPT0gbnVsbCA/IHBhcmVudC5pbmRleCA6IC0xKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2FwcGxpZXNUb05leHROb2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaFROb2RlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5tZXRhZGF0YS5wcmVkaWNhdGUpKSB7XG4gICAgICBjb25zdCBsb2NhbE5hbWVzID0gdGhpcy5tZXRhZGF0YS5wcmVkaWNhdGU7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXcsIHROb2RlLCBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIGxvY2FsTmFtZXNbaV0pKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgdHlwZVByZWRpY2F0ZSA9IHRoaXMubWV0YWRhdGEucHJlZGljYXRlIGFzIGFueTtcbiAgICAgIGlmICh0eXBlUHJlZGljYXRlID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXcsIHROb2RlLCAtMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKFxuICAgICAgICAgICAgdFZpZXcsIHROb2RlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgdHlwZVByZWRpY2F0ZSwgZmFsc2UsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIG5vZGVNYXRjaElkeDogbnVtYmVyfG51bGwpOiB2b2lkIHtcbiAgICBpZiAobm9kZU1hdGNoSWR4ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCByZWFkID0gdGhpcy5tZXRhZGF0YS5yZWFkO1xuICAgICAgaWYgKHJlYWQgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB8fCByZWFkID09PSBWaWV3Q29udGFpbmVyUmVmIHx8XG4gICAgICAgICAgICByZWFkID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmICYmIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCAtMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aXZlT3JQcm92aWRlcklkeCA9XG4gICAgICAgICAgICAgIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCByZWFkLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgIGlmIChkaXJlY3RpdmVPclByb3ZpZGVySWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCBkaXJlY3RpdmVPclByb3ZpZGVySWR4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIG5vZGVNYXRjaElkeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRNYXRjaCh0Tm9kZUlkeDogbnVtYmVyLCBtYXRjaElkeDogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMubWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5tYXRjaGVzID0gW3ROb2RlSWR4LCBtYXRjaElkeF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWF0Y2hlcy5wdXNoKHROb2RlSWR4LCBtYXRjaElkeCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBsb2NhbCBuYW1lcyBmb3IgYSBnaXZlbiBub2RlIGFuZCByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleFxuICogKG9yIC0xIGlmIGEgbG9jYWwgbmFtZSBwb2ludHMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIHROb2RlIHN0YXRpYyBkYXRhIG9mIGEgbm9kZSB0byBjaGVja1xuICogQHBhcmFtIHNlbGVjdG9yIHNlbGVjdG9yIHRvIG1hdGNoXG4gKiBAcmV0dXJucyBkaXJlY3RpdmUgaW5kZXgsIC0xIG9yIG51bGwgaWYgYSBzZWxlY3RvciBkaWRuJ3QgbWF0Y2ggYW55IG9mIHRoZSBsb2NhbCBuYW1lc1xuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3Rvcjogc3RyaW5nKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGlmIChsb2NhbE5hbWVzW2ldID09PSBzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVSZXN1bHRCeVROb2RlVHlwZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGFueSB7XG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmKFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVSZXN1bHRGb3JOb2RlKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCBtYXRjaGluZ0lkeDogbnVtYmVyLCByZWFkOiBhbnkpOiBhbnkge1xuICBpZiAobWF0Y2hpbmdJZHggPT09IC0xKSB7XG4gICAgLy8gaWYgcmVhZCB0b2tlbiBhbmQgLyBvciBzdHJhdGVneSBpcyBub3Qgc3BlY2lmaWVkLCBkZXRlY3QgaXQgdXNpbmcgYXBwcm9wcmlhdGUgdE5vZGUgdHlwZVxuICAgIHJldHVybiBjcmVhdGVSZXN1bHRCeVROb2RlVHlwZSh0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKG1hdGNoaW5nSWR4ID09PSAtMikge1xuICAgIC8vIHJlYWQgYSBzcGVjaWFsIHRva2VuIGZyb20gYSBub2RlIGluamVjdG9yXG4gICAgcmV0dXJuIGNyZWF0ZVNwZWNpYWxUb2tlbihsVmlldywgdE5vZGUsIHJlYWQpO1xuICB9IGVsc2Uge1xuICAgIC8vIHJlYWQgYSB0b2tlblxuICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgbFZpZXdbVFZJRVddLCBtYXRjaGluZ0lkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTcGVjaWFsVG9rZW4obFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGlmIChyZWFkID09PSBWaWV3RW5naW5lX0VsZW1lbnRSZWYpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZihWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAocmVhZCA9PT0gVmlld0NvbnRhaW5lclJlZikge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gICAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICAgICAgVmlld0NvbnRhaW5lclJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgYFNwZWNpYWwgdG9rZW4gdG8gcmVhZCBzaG91bGQgYmUgb25lIG9mIEVsZW1lbnRSZWYsIFRlbXBsYXRlUmVmIG9yIFZpZXdDb250YWluZXJSZWYgYnV0IGdvdCAke1xuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShyZWFkKX0uYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgcXVlcnkgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3LiBUaGlzIGZ1bmN0aW9uIGlzIG1lYW50IHRvIGRvIHRoZVxuICogcHJvY2Vzc2luZyBvbmNlIGFuZCBvbmx5IG9uY2UgZm9yIGEgZ2l2ZW4gdmlldyBpbnN0YW5jZSAoYSBzZXQgb2YgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3XG4gKiBkb2Vzbid0IGNoYW5nZSkuXG4gKi9cbmZ1bmN0aW9uIG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRRdWVyeTogVFF1ZXJ5LCBxdWVyeUluZGV4OiBudW1iZXIpOiAoVHxudWxsKVtdIHtcbiAgY29uc3QgbFF1ZXJ5ID0gbFZpZXdbUVVFUklFU10hLnF1ZXJpZXMhW3F1ZXJ5SW5kZXhdO1xuICBpZiAobFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICBjb25zdCB0Vmlld0RhdGEgPSB0Vmlldy5kYXRhO1xuICAgIGNvbnN0IHRRdWVyeU1hdGNoZXMgPSB0UXVlcnkubWF0Y2hlcyE7XG4gICAgY29uc3QgcmVzdWx0OiBUfG51bGxbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFF1ZXJ5TWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgbWF0Y2hlZE5vZGVJZHggPSB0UXVlcnlNYXRjaGVzW2ldO1xuICAgICAgaWYgKG1hdGNoZWROb2RlSWR4IDwgMCkge1xuICAgICAgICAvLyB3ZSBhdCB0aGUgPG5nLXRlbXBsYXRlPiBtYXJrZXIgd2hpY2ggbWlnaHQgaGF2ZSByZXN1bHRzIGluIHZpZXdzIGNyZWF0ZWQgYmFzZWQgb24gdGhpc1xuICAgICAgICAvLyA8bmctdGVtcGxhdGU+IC0gdGhvc2UgcmVzdWx0cyB3aWxsIGJlIGluIHNlcGFyYXRlIHZpZXdzIHRob3VnaCwgc28gaGVyZSB3ZSBqdXN0IGxlYXZlXG4gICAgICAgIC8vIG51bGwgYXMgYSBwbGFjZWhvbGRlclxuICAgICAgICByZXN1bHQucHVzaChudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh0Vmlld0RhdGEsIG1hdGNoZWROb2RlSWR4KTtcbiAgICAgICAgY29uc3QgdE5vZGUgPSB0Vmlld0RhdGFbbWF0Y2hlZE5vZGVJZHhdIGFzIFROb2RlO1xuICAgICAgICByZXN1bHQucHVzaChjcmVhdGVSZXN1bHRGb3JOb2RlKGxWaWV3LCB0Tm9kZSwgdFF1ZXJ5TWF0Y2hlc1tpICsgMV0sIHRRdWVyeS5tZXRhZGF0YS5yZWFkKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxRdWVyeS5tYXRjaGVzID0gcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIGxRdWVyeS5tYXRjaGVzO1xufVxuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgY29sbGVjdHMgKGFscmVhZHkgbWF0ZXJpYWxpemVkKSBxdWVyeSByZXN1bHRzIGZyb20gYSB0cmVlIG9mIHZpZXdzLFxuICogc3RhcnRpbmcgd2l0aCBhIHByb3ZpZGVkIExWaWV3LlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UXVlcnlSZXN1bHRzPFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBxdWVyeUluZGV4OiBudW1iZXIsIHJlc3VsdDogVFtdKTogVFtdIHtcbiAgY29uc3QgdFF1ZXJ5ID0gdFZpZXcucXVlcmllcyEuZ2V0QnlJbmRleChxdWVyeUluZGV4KTtcbiAgY29uc3QgdFF1ZXJ5TWF0Y2hlcyA9IHRRdWVyeS5tYXRjaGVzO1xuICBpZiAodFF1ZXJ5TWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxWaWV3UmVzdWx0cyA9IG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4odFZpZXcsIGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0UXVlcnlNYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCB0Tm9kZUlkeCA9IHRRdWVyeU1hdGNoZXNbaV07XG4gICAgICBpZiAodE5vZGVJZHggPiAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGxWaWV3UmVzdWx0c1tpIC8gMl0gYXMgVCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSB0UXVlcnlNYXRjaGVzW2kgKyAxXTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1stdE5vZGVJZHhdIGFzIExDb250YWluZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uTENvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBpbnNlcnRlZCBpbiB0aGlzIGNvbnRhaW5lclxuICAgICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBkZWNsYXJhdGlvbkxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW2ldO1xuICAgICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdID09PSBlbWJlZGRlZExWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld1tUVklFV10sIGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGlzIGRlY2xhcmF0aW9uIGNvbnRhaW5lciBhbmQgaW5zZXJ0ZWQgaW50b1xuICAgICAgICAvLyBkaWZmZXJlbnQgY29udGFpbmVyc1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXdzID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbWJlZGRlZExWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGVtYmVkZGVkTFZpZXdzW2ldO1xuICAgICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyhlbWJlZGRlZExWaWV3W1RWSUVXXSwgZW1iZWRkZWRMVmlldywgY2hpbGRRdWVyeUluZGV4LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhIHF1ZXJ5IGJ5IGNvbWJpbmluZyBtYXRjaGVzIGZyb20gYWxsIGFjdGl2ZSB2aWV3cyBhbmQgcmVtb3ZpbmcgbWF0Y2hlcyBmcm9tIGRlbGV0ZWRcbiAqIHZpZXdzLlxuICpcbiAqIEByZXR1cm5zIGB0cnVlYCBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBvciBpZiB0aGlzIGlzIGEgc3RhdGljIHF1ZXJ5XG4gKiByZXNvbHZpbmcgaW4gY3JlYXRpb24gbW9kZSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVxdWVyeVJlZnJlc2gocXVlcnlMaXN0OiBRdWVyeUxpc3Q8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgcXVlcnlJbmRleCA9IGdldEN1cnJlbnRRdWVyeUluZGV4KCk7XG5cbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlJbmRleCArIDEpO1xuXG4gIGNvbnN0IHRRdWVyeSA9IGdldFRRdWVyeSh0VmlldywgcXVlcnlJbmRleCk7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkgJiYgKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSA9PT0gdFF1ZXJ5Lm1ldGFkYXRhLmlzU3RhdGljKSkge1xuICAgIGlmICh0UXVlcnkubWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgcXVlcnlMaXN0LnJlc2V0KFtdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdFF1ZXJ5LmNyb3NzZXNOZ1RlbXBsYXRlID9cbiAgICAgICAgICBjb2xsZWN0UXVlcnlSZXN1bHRzKHRWaWV3LCBsVmlldywgcXVlcnlJbmRleCwgW10pIDpcbiAgICAgICAgICBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzKHRWaWV3LCBsVmlldywgdFF1ZXJ5LCBxdWVyeUluZGV4KTtcbiAgICAgIHF1ZXJ5TGlzdC5yZXNldChyZXN1bHQpO1xuICAgICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QgZm9yIGEgc3RhdGljIHZpZXcgcXVlcnkuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY1ZpZXdRdWVyeTxUPihcbiAgICBwcmVkaWNhdGU6IFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjx1bmtub3duPnxzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICB2aWV3UXVlcnlJbnRlcm5hbChnZXRUVmlldygpLCBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCwgc3RvcmVzIHRoZSByZWZlcmVuY2UgaW4gTFZpZXcgYW5kIHJldHVybnMgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV2aWV3UXVlcnk8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48dW5rbm93bj58c3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgdmlld1F1ZXJ5SW50ZXJuYWwoZ2V0VFZpZXcoKSwgZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHZpZXdRdWVyeUludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjx1bmtub3duPnxzdHJpbmdbXSxcbiAgICBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnksIGlzU3RhdGljOiBib29sZWFuKTogdm9pZCB7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjcmVhdGVUUXVlcnkodFZpZXcsIG5ldyBUUXVlcnlNZXRhZGF0YV8ocHJlZGljYXRlLCBkZXNjZW5kLCBpc1N0YXRpYywgcmVhZCksIC0xKTtcbiAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgIHRWaWV3LnN0YXRpY1ZpZXdRdWVyaWVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgY3JlYXRlTFF1ZXJ5PFQ+KHRWaWV3LCBsVmlldyk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fEluamVjdGlvblRva2VuPHVua25vd24+fHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLFxuICAgIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRUVmlldygpLCBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGZhbHNlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSxcbiAgICAgIGRpcmVjdGl2ZUluZGV4KTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIHN0YXRpYyBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaFxuICogKHBhcnQgb2YgYSB2aWV3IHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3RhdGljQ29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fEluamVjdGlvblRva2VuPHVua25vd24+fHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLFxuICAgIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRUVmlldygpLCBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLFxuICAgICAgZGlyZWN0aXZlSW5kZXgpO1xufVxuXG5mdW5jdGlvbiBjb250ZW50UXVlcnlJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48dW5rbm93bj58c3RyaW5nW10sXG4gICAgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55LCBpc1N0YXRpYzogYm9vbGVhbiwgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjcmVhdGVUUXVlcnkodFZpZXcsIG5ldyBUUXVlcnlNZXRhZGF0YV8ocHJlZGljYXRlLCBkZXNjZW5kLCBpc1N0YXRpYywgcmVhZCksIHROb2RlLmluZGV4KTtcbiAgICBzYXZlQ29udGVudFF1ZXJ5QW5kRGlyZWN0aXZlSW5kZXgodFZpZXcsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgIHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVMUXVlcnk8VD4odFZpZXcsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBMb2FkcyBhIFF1ZXJ5TGlzdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBjdXJyZW50IHZpZXcgb3IgY29udGVudCBxdWVyeS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxvYWRRdWVyeTxUPigpOiBRdWVyeUxpc3Q8VD4ge1xuICByZXR1cm4gbG9hZFF1ZXJ5SW50ZXJuYWw8VD4oZ2V0TFZpZXcoKSwgZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRRdWVyeUludGVybmFsPFQ+KGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGxWaWV3W1FVRVJJRVNdLCAnTFF1ZXJpZXMgc2hvdWxkIGJlIGRlZmluZWQgd2hlbiB0cnlpbmcgdG8gbG9hZCBhIHF1ZXJ5Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlld1tRVUVSSUVTXSEucXVlcmllcywgcXVlcnlJbmRleCk7XG4gIHJldHVybiBsVmlld1tRVUVSSUVTXSEucXVlcmllc1txdWVyeUluZGV4XS5xdWVyeUxpc3Q7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxRdWVyeTxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KCk7XG4gIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KHRWaWV3LCBsVmlldywgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG5cbiAgaWYgKGxWaWV3W1FVRVJJRVNdID09PSBudWxsKSBsVmlld1tRVUVSSUVTXSA9IG5ldyBMUXVlcmllc18oKTtcbiAgbFZpZXdbUVVFUklFU10hLnF1ZXJpZXMucHVzaChuZXcgTFF1ZXJ5XyhxdWVyeUxpc3QpKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVFF1ZXJ5KHRWaWV3OiBUVmlldywgbWV0YWRhdGE6IFRRdWVyeU1ldGFkYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBpZiAodFZpZXcucXVlcmllcyA9PT0gbnVsbCkgdFZpZXcucXVlcmllcyA9IG5ldyBUUXVlcmllc18oKTtcbiAgdFZpZXcucXVlcmllcy50cmFjayhuZXcgVFF1ZXJ5XyhtZXRhZGF0YSwgbm9kZUluZGV4KSk7XG59XG5cbmZ1bmN0aW9uIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldzogVFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXdDb250ZW50UXVlcmllc1t0Vmlld0NvbnRlbnRRdWVyaWVzLmxlbmd0aCAtIDFdIDogLTE7XG4gIGlmIChkaXJlY3RpdmVJbmRleCAhPT0gbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXgpIHtcbiAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2godFZpZXcucXVlcmllcyEubGVuZ3RoIC0gMSwgZGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFRRdWVyeSh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIpOiBUUXVlcnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Vmlldy5xdWVyaWVzLCAnVFF1ZXJpZXMgbXVzdCBiZSBkZWZpbmVkIHRvIHJldHJpZXZlIGEgVFF1ZXJ5Jyk7XG4gIHJldHVybiB0Vmlldy5xdWVyaWVzIS5nZXRCeUluZGV4KGluZGV4KTtcbn1cbiJdfQ==