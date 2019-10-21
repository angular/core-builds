/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// We are temporarily importing the existing viewEngine_from core so we can be sure we are
// correctly implementing its interfaces for backwards compatibility.
import { ElementRef as ViewEngine_ElementRef } from '../linker/element_ref';
import { QueryList } from '../linker/query_list';
import { TemplateRef as ViewEngine_TemplateRef } from '../linker/template_ref';
import { ViewContainerRef } from '../linker/view_container_ref';
import { assertDataInRange, assertDefined, throwError } from '../util/assert';
import { stringify } from '../util/stringify';
import { assertFirstTemplatePass, assertLContainer } from './assert';
import { getNodeInjectable, locateDirectiveOrProvider } from './di';
import { storeCleanupWithContext } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET, MOVED_VIEWS } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { DECLARATION_LCONTAINER, PARENT, QUERIES, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { getCurrentQueryIndex, getLView, getPreviousOrParentTNode, setCurrentQueryIndex } from './state';
import { isCreationMode } from './util/view_utils';
import { createContainerRef, createElementRef, createTemplateRef } from './view_engine_compatibility';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
/**
 * @template T
 */
class LQuery_ {
    /**
     * @param {?} queryList
     */
    constructor(queryList) {
        this.queryList = queryList;
        this.matches = null;
    }
    /**
     * @return {?}
     */
    clone() { return new LQuery_(this.queryList); }
    /**
     * @return {?}
     */
    setDirty() { this.queryList.setDirty(); }
}
if (false) {
    /** @type {?} */
    LQuery_.prototype.matches;
    /** @type {?} */
    LQuery_.prototype.queryList;
}
class LQueries_ {
    /**
     * @param {?=} queries
     */
    constructor(queries = []) {
        this.queries = queries;
    }
    /**
     * @param {?} tView
     * @return {?}
     */
    createEmbeddedView(tView) {
        /** @type {?} */
        const tQueries = tView.queries;
        if (tQueries !== null) {
            /** @type {?} */
            const noOfInheritedQueries = tView.contentQueries !== null ? tView.contentQueries[0] : tQueries.length;
            /** @type {?} */
            const viewLQueries = [];
            // An embedded view has queries propagated from a declaration view at the beginning of the
            // TQueries collection and up until a first content query declared in the embedded view. Only
            // propagated LQueries are created at this point (LQuery corresponding to declared content
            // queries will be instantiated from the content query instructions for each directive).
            for (let i = 0; i < noOfInheritedQueries; i++) {
                /** @type {?} */
                const tQuery = tQueries.getByIndex(i);
                /** @type {?} */
                const parentLQuery = this.queries[tQuery.indexInDeclarationView];
                viewLQueries.push(parentLQuery.clone());
            }
            return new LQueries_(viewLQueries);
        }
        return null;
    }
    /**
     * @param {?} tView
     * @return {?}
     */
    insertView(tView) { this.dirtyQueriesWithMatches(tView); }
    /**
     * @param {?} tView
     * @return {?}
     */
    detachView(tView) { this.dirtyQueriesWithMatches(tView); }
    /**
     * @private
     * @param {?} tView
     * @return {?}
     */
    dirtyQueriesWithMatches(tView) {
        for (let i = 0; i < this.queries.length; i++) {
            if (getTQuery(tView, i).matches !== null) {
                this.queries[i].setDirty();
            }
        }
    }
}
if (false) {
    /** @type {?} */
    LQueries_.prototype.queries;
}
class TQueryMetadata_ {
    /**
     * @param {?} predicate
     * @param {?} descendants
     * @param {?} isStatic
     * @param {?=} read
     */
    constructor(predicate, descendants, isStatic, read = null) {
        this.predicate = predicate;
        this.descendants = descendants;
        this.isStatic = isStatic;
        this.read = read;
    }
}
if (false) {
    /** @type {?} */
    TQueryMetadata_.prototype.predicate;
    /** @type {?} */
    TQueryMetadata_.prototype.descendants;
    /** @type {?} */
    TQueryMetadata_.prototype.isStatic;
    /** @type {?} */
    TQueryMetadata_.prototype.read;
}
class TQueries_ {
    /**
     * @param {?=} queries
     */
    constructor(queries = []) {
        this.queries = queries;
    }
    /**
     * @param {?} tView
     * @param {?} tNode
     * @return {?}
     */
    elementStart(tView, tNode) {
        ngDevMode && assertFirstTemplatePass(tView, 'Queries should collect results on the first template pass only');
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].elementStart(tView, tNode);
        }
    }
    /**
     * @param {?} tNode
     * @return {?}
     */
    elementEnd(tNode) {
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].elementEnd(tNode);
        }
    }
    /**
     * @param {?} tNode
     * @return {?}
     */
    embeddedTView(tNode) {
        /** @type {?} */
        let queriesForTemplateRef = null;
        for (let i = 0; i < this.length; i++) {
            /** @type {?} */
            const childQueryIndex = queriesForTemplateRef !== null ? queriesForTemplateRef.length : 0;
            /** @type {?} */
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
    /**
     * @param {?} tView
     * @param {?} tNode
     * @return {?}
     */
    template(tView, tNode) {
        ngDevMode && assertFirstTemplatePass(tView, 'Queries should collect results on the first template pass only');
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].template(tView, tNode);
        }
    }
    /**
     * @param {?} index
     * @return {?}
     */
    getByIndex(index) {
        ngDevMode && assertDataInRange(this.queries, index);
        return this.queries[index];
    }
    /**
     * @return {?}
     */
    get length() { return this.queries.length; }
    /**
     * @param {?} tquery
     * @return {?}
     */
    track(tquery) { this.queries.push(tquery); }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    TQueries_.prototype.queries;
}
class TQuery_ {
    /**
     * @param {?} metadata
     * @param {?=} nodeIndex
     */
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
    /**
     * @param {?} tView
     * @param {?} tNode
     * @return {?}
     */
    elementStart(tView, tNode) {
        if (this.isApplyingToNode(tNode)) {
            this.matchTNode(tView, tNode);
        }
    }
    /**
     * @param {?} tNode
     * @return {?}
     */
    elementEnd(tNode) {
        if (this._declarationNodeIndex === tNode.index) {
            this._appliesToNextNode = false;
        }
    }
    /**
     * @param {?} tView
     * @param {?} tNode
     * @return {?}
     */
    template(tView, tNode) { this.elementStart(tView, tNode); }
    /**
     * @param {?} tNode
     * @param {?} childQueryIndex
     * @return {?}
     */
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
    /**
     * @private
     * @param {?} tNode
     * @return {?}
     */
    isApplyingToNode(tNode) {
        if (this._appliesToNextNode && this.metadata.descendants === false) {
            return this._declarationNodeIndex === (tNode.parent ? tNode.parent.index : -1);
        }
        return this._appliesToNextNode;
    }
    /**
     * @private
     * @param {?} tView
     * @param {?} tNode
     * @return {?}
     */
    matchTNode(tView, tNode) {
        if (Array.isArray(this.metadata.predicate)) {
            /** @type {?} */
            const localNames = this.metadata.predicate;
            for (let i = 0; i < localNames.length; i++) {
                this.matchTNodeWithReadOption(tView, tNode, getIdxOfMatchingSelector(tNode, localNames[i]));
            }
        }
        else {
            /** @type {?} */
            const typePredicate = (/** @type {?} */ (this.metadata.predicate));
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
    /**
     * @private
     * @param {?} tView
     * @param {?} tNode
     * @param {?} nodeMatchIdx
     * @return {?}
     */
    matchTNodeWithReadOption(tView, tNode, nodeMatchIdx) {
        if (nodeMatchIdx !== null) {
            /** @type {?} */
            const read = this.metadata.read;
            if (read !== null) {
                if (read === ViewEngine_ElementRef || read === ViewContainerRef ||
                    read === ViewEngine_TemplateRef && tNode.type === 0 /* Container */) {
                    this.addMatch(tNode.index, -2);
                }
                else {
                    /** @type {?} */
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
    /**
     * @private
     * @param {?} tNodeIdx
     * @param {?} matchIdx
     * @return {?}
     */
    addMatch(tNodeIdx, matchIdx) {
        if (this.matches === null) {
            this.matches = [tNodeIdx, matchIdx];
        }
        else {
            this.matches.push(tNodeIdx, matchIdx);
        }
    }
}
if (false) {
    /** @type {?} */
    TQuery_.prototype.matches;
    /** @type {?} */
    TQuery_.prototype.indexInDeclarationView;
    /** @type {?} */
    TQuery_.prototype.crossesNgTemplate;
    /**
     * A node index on which a query was declared (-1 for view queries and ones inherited from the
     * declaration template). We use this index (alongside with _appliesToNextNode flag) to know
     * when to apply content queries to elements in a template.
     * @type {?}
     * @private
     */
    TQuery_.prototype._declarationNodeIndex;
    /**
     * A flag indicating if a given query still applies to nodes it is crossing. We use this flag
     * (alongside with _declarationNodeIndex) to know when to stop applying content queries to
     * elements in a template.
     * @type {?}
     * @private
     */
    TQuery_.prototype._appliesToNextNode;
    /** @type {?} */
    TQuery_.prototype.metadata;
}
/**
 * Iterates over local names for a given node and returns directive index
 * (or -1 if a local name points to an element).
 *
 * @param {?} tNode static data of a node to check
 * @param {?} selector selector to match
 * @return {?} directive index, -1 or null if a selector didn't match any of the local names
 */
function getIdxOfMatchingSelector(tNode, selector) {
    /** @type {?} */
    const localNames = tNode.localNames;
    if (localNames !== null) {
        for (let i = 0; i < localNames.length; i += 2) {
            if (localNames[i] === selector) {
                return (/** @type {?} */ (localNames[i + 1]));
            }
        }
    }
    return null;
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function createResultByTNodeType(tNode, currentView) {
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        return createElementRef(ViewEngine_ElementRef, tNode, currentView);
    }
    else if (tNode.type === 0 /* Container */) {
        return createTemplateRef(ViewEngine_TemplateRef, ViewEngine_ElementRef, tNode, currentView);
    }
    return null;
}
/**
 * @param {?} lView
 * @param {?} tNode
 * @param {?} matchingIdx
 * @param {?} read
 * @return {?}
 */
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
        return getNodeInjectable(lView[TVIEW].data, lView, matchingIdx, (/** @type {?} */ (tNode)));
    }
}
/**
 * @param {?} lView
 * @param {?} tNode
 * @param {?} read
 * @return {?}
 */
function createSpecialToken(lView, tNode, read) {
    if (read === ViewEngine_ElementRef) {
        return createElementRef(ViewEngine_ElementRef, tNode, lView);
    }
    else if (read === ViewEngine_TemplateRef) {
        return createTemplateRef(ViewEngine_TemplateRef, ViewEngine_ElementRef, tNode, lView);
    }
    else if (read === ViewContainerRef) {
        ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
        return createContainerRef(ViewContainerRef, ViewEngine_ElementRef, (/** @type {?} */ (tNode)), lView);
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
 * @template T
 * @param {?} lView
 * @param {?} tQuery
 * @param {?} queryIndex
 * @return {?}
 */
function materializeViewResults(lView, tQuery, queryIndex) {
    /** @type {?} */
    const lQuery = (/** @type {?} */ ((/** @type {?} */ (lView[QUERIES])).queries))[queryIndex];
    if (lQuery.matches === null) {
        /** @type {?} */
        const tViewData = lView[TVIEW].data;
        /** @type {?} */
        const tQueryMatches = (/** @type {?} */ (tQuery.matches));
        /** @type {?} */
        const result = [];
        for (let i = 0; i < tQueryMatches.length; i += 2) {
            /** @type {?} */
            const matchedNodeIdx = tQueryMatches[i];
            if (matchedNodeIdx < 0) {
                // we at the <ng-template> marker which might have results in views created based on this
                // <ng-template> - those results will be in separate views though, so here we just leave
                // null as a placeholder
                result.push(null);
            }
            else {
                ngDevMode && assertDataInRange(tViewData, matchedNodeIdx);
                /** @type {?} */
                const tNode = (/** @type {?} */ (tViewData[matchedNodeIdx]));
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
 * @template T
 * @param {?} lView
 * @param {?} queryIndex
 * @param {?} result
 * @return {?}
 */
function collectQueryResults(lView, queryIndex, result) {
    /** @type {?} */
    const tQuery = (/** @type {?} */ (lView[TVIEW].queries)).getByIndex(queryIndex);
    /** @type {?} */
    const tQueryMatches = tQuery.matches;
    if (tQueryMatches !== null) {
        /** @type {?} */
        const lViewResults = materializeViewResults(lView, tQuery, queryIndex);
        for (let i = 0; i < tQueryMatches.length; i += 2) {
            /** @type {?} */
            const tNodeIdx = tQueryMatches[i];
            if (tNodeIdx > 0) {
                /** @type {?} */
                const viewResult = lViewResults[i / 2];
                ngDevMode && assertDefined(viewResult, 'materialized query result should be defined');
                result.push((/** @type {?} */ (viewResult)));
            }
            else {
                /** @type {?} */
                const childQueryIndex = tQueryMatches[i + 1];
                /** @type {?} */
                const declarationLContainer = (/** @type {?} */ (lView[-tNodeIdx]));
                ngDevMode && assertLContainer(declarationLContainer);
                // collect matches for views inserted in this container
                for (let i = CONTAINER_HEADER_OFFSET; i < declarationLContainer.length; i++) {
                    /** @type {?} */
                    const embeddedLView = declarationLContainer[i];
                    if (embeddedLView[DECLARATION_LCONTAINER] === embeddedLView[PARENT]) {
                        collectQueryResults(embeddedLView, childQueryIndex, result);
                    }
                }
                // collect matches for views created from this declaration container and inserted into
                // different containers
                if (declarationLContainer[MOVED_VIEWS] !== null) {
                    /** @type {?} */
                    const embeddedLViews = (/** @type {?} */ (declarationLContainer[MOVED_VIEWS]));
                    for (let i = 0; i < embeddedLViews.length; i++) {
                        collectQueryResults(embeddedLViews[i], childQueryIndex, result);
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
 * \@codeGenApi
 * @param {?} queryList
 * @return {?} `true` if a query got dirty during change detection or if this is a static query
 * resolving in creation mode, `false` otherwise.
 *
 */
export function ɵɵqueryRefresh(queryList) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const queryIndex = getCurrentQueryIndex();
    setCurrentQueryIndex(queryIndex + 1);
    /** @type {?} */
    const tQuery = getTQuery(lView[TVIEW], queryIndex);
    if (queryList.dirty && (isCreationMode(lView) === tQuery.metadata.isStatic)) {
        if (tQuery.matches === null) {
            queryList.reset([]);
        }
        else {
            /** @type {?} */
            const result = tQuery.crossesNgTemplate ? collectQueryResults(lView, queryIndex, []) :
                materializeViewResults(lView, tQuery, queryIndex);
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
 * \@codeGenApi
 * @template T
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 *
 * @return {?}
 */
export function ɵɵstaticViewQuery(predicate, descend, read) {
    viewQueryInternal(getLView(), predicate, descend, read, true);
}
/**
 * Creates new QueryList, stores the reference in LView and returns QueryList.
 *
 * \@codeGenApi
 * @template T
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 *
 * @return {?}
 */
export function ɵɵviewQuery(predicate, descend, read) {
    viewQueryInternal(getLView(), predicate, descend, read, false);
}
/**
 * @template T
 * @param {?} lView
 * @param {?} predicate
 * @param {?} descend
 * @param {?} read
 * @param {?} isStatic
 * @return {?}
 */
function viewQueryInternal(lView, predicate, descend, read, isStatic) {
    /** @type {?} */
    const tView = lView[TVIEW];
    if (tView.firstTemplatePass) {
        createTQuery(tView, new TQueryMetadata_(predicate, descend, isStatic, read), -1);
        if (isStatic) {
            tView.staticViewQueries = true;
        }
    }
    createLQuery(lView);
}
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 *
 * \@codeGenApi
 * @template T
 * @param {?} directiveIndex Current directive index
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 * @return {?} QueryList<T>
 *
 */
export function ɵɵcontentQuery(directiveIndex, predicate, descend, read) {
    contentQueryInternal(getLView(), predicate, descend, read, false, getPreviousOrParentTNode(), directiveIndex);
}
/**
 * Registers a QueryList, associated with a static content query, for later refresh
 * (part of a view refresh).
 *
 * \@codeGenApi
 * @template T
 * @param {?} directiveIndex Current directive index
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 * @return {?} QueryList<T>
 *
 */
export function ɵɵstaticContentQuery(directiveIndex, predicate, descend, read) {
    contentQueryInternal(getLView(), predicate, descend, read, true, getPreviousOrParentTNode(), directiveIndex);
}
/**
 * @template T
 * @param {?} lView
 * @param {?} predicate
 * @param {?} descend
 * @param {?} read
 * @param {?} isStatic
 * @param {?} tNode
 * @param {?} directiveIndex
 * @return {?}
 */
function contentQueryInternal(lView, predicate, descend, read, isStatic, tNode, directiveIndex) {
    /** @type {?} */
    const tView = lView[TVIEW];
    if (tView.firstTemplatePass) {
        createTQuery(tView, new TQueryMetadata_(predicate, descend, isStatic, read), tNode.index);
        saveContentQueryAndDirectiveIndex(tView, directiveIndex);
        if (isStatic) {
            tView.staticContentQueries = true;
        }
    }
    createLQuery(lView);
}
/**
 * Loads a QueryList corresponding to the current view or content query.
 *
 * \@codeGenApi
 * @template T
 * @return {?}
 */
export function ɵɵloadQuery() {
    return loadQueryInternal(getLView(), getCurrentQueryIndex());
}
/**
 * @template T
 * @param {?} lView
 * @param {?} queryIndex
 * @return {?}
 */
function loadQueryInternal(lView, queryIndex) {
    ngDevMode &&
        assertDefined(lView[QUERIES], 'LQueries should be defined when trying to load a query');
    ngDevMode && assertDataInRange((/** @type {?} */ (lView[QUERIES])).queries, queryIndex);
    return (/** @type {?} */ (lView[QUERIES])).queries[queryIndex].queryList;
}
/**
 * @template T
 * @param {?} lView
 * @return {?}
 */
function createLQuery(lView) {
    /** @type {?} */
    const queryList = new QueryList();
    storeCleanupWithContext(lView, queryList, queryList.destroy);
    if (lView[QUERIES] === null)
        lView[QUERIES] = new LQueries_();
    (/** @type {?} */ (lView[QUERIES])).queries.push(new LQuery_(queryList));
}
/**
 * @param {?} tView
 * @param {?} metadata
 * @param {?} nodeIndex
 * @return {?}
 */
function createTQuery(tView, metadata, nodeIndex) {
    if (tView.queries === null)
        tView.queries = new TQueries_();
    tView.queries.track(new TQuery_(metadata, nodeIndex));
}
/**
 * @param {?} tView
 * @param {?} directiveIndex
 * @return {?}
 */
function saveContentQueryAndDirectiveIndex(tView, directiveIndex) {
    /** @type {?} */
    const tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
    /** @type {?} */
    const lastSavedDirectiveIndex = tView.contentQueries.length ? tViewContentQueries[tViewContentQueries.length - 1] : -1;
    if (directiveIndex !== lastSavedDirectiveIndex) {
        tViewContentQueries.push((/** @type {?} */ (tView.queries)).length - 1, directiveIndex);
    }
}
/**
 * @param {?} tView
 * @param {?} index
 * @return {?}
 */
function getTQuery(tView, index) {
    ngDevMode && assertDefined(tView.queries, 'TQueries must be defined to retrieve a TQuery');
    return (/** @type {?} */ (tView.queries)).getByIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbkUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHlCQUF5QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xFLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzlELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN4RixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9FLE9BQU8sRUFBd0UsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbEosT0FBTyxFQUFxRCw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNoSSxPQUFP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LElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUM7Ozs7OztBQUVELFNBQVMsaUNBQWlDLENBQUMsS0FBWSxFQUFFLGNBQXNCOztVQUN2RSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsY0FBYyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7O1VBQ3pFLHVCQUF1QixHQUN6QixLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsbUJBQW1CLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUYsSUFBSSxjQUFjLEtBQUssdUJBQXVCLEVBQUU7UUFDOUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLG1CQUFBLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQ3RFO0FBQ0gsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxTQUFTLENBQUMsS0FBWSxFQUFFLEtBQWE7SUFDNUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLCtDQUErQyxDQUFDLENBQUM7SUFDM0YsT0FBTyxtQkFBQSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7YXNzZXJ0Rmlyc3RUZW1wbGF0ZVBhc3MsIGFzc2VydExDb250YWluZXJ9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Tm9kZUluamVjdGFibGUsIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXJ9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtzdG9yZUNsZWFudXBXaXRoQ29udGV4dH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIExRdWVyeSwgVFF1ZXJpZXMsIFRRdWVyeSwgVFF1ZXJ5TWV0YWRhdGEsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX0xDT05UQUlORVIsIExWaWV3LCBQQVJFTlQsIFFVRVJJRVMsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q3VycmVudFF1ZXJ5SW5kZXgsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHNldEN1cnJlbnRRdWVyeUluZGV4fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDcmVhdGlvbk1vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Y3JlYXRlQ29udGFpbmVyUmVmLCBjcmVhdGVFbGVtZW50UmVmLCBjcmVhdGVUZW1wbGF0ZVJlZn0gZnJvbSAnLi92aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5JztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG5jbGFzcyBMUXVlcnlfPFQ+IGltcGxlbWVudHMgTFF1ZXJ5PFQ+IHtcbiAgbWF0Y2hlczogKFR8bnVsbClbXXxudWxsID0gbnVsbDtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+KSB7fVxuICBjbG9uZSgpOiBMUXVlcnk8VD4geyByZXR1cm4gbmV3IExRdWVyeV8odGhpcy5xdWVyeUxpc3QpOyB9XG4gIHNldERpcnR5KCk6IHZvaWQgeyB0aGlzLnF1ZXJ5TGlzdC5zZXREaXJ0eSgpOyB9XG59XG5cbmNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXSkge31cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcodFZpZXc6IFRWaWV3KTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3QgdFF1ZXJpZXMgPSB0Vmlldy5xdWVyaWVzO1xuICAgIGlmICh0UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgbm9PZkluaGVyaXRlZFF1ZXJpZXMgPVxuICAgICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsID8gdFZpZXcuY29udGVudFF1ZXJpZXNbMF0gOiB0UXVlcmllcy5sZW5ndGg7XG4gICAgICBjb25zdCB2aWV3TFF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXTtcblxuICAgICAgLy8gQW4gZW1iZWRkZWQgdmlldyBoYXMgcXVlcmllcyBwcm9wYWdhdGVkIGZyb20gYSBkZWNsYXJhdGlvbiB2aWV3IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gICAgICAvLyBUUXVlcmllcyBjb2xsZWN0aW9uIGFuZCB1cCB1bnRpbCBhIGZpcnN0IGNvbnRlbnQgcXVlcnkgZGVjbGFyZWQgaW4gdGhlIGVtYmVkZGVkIHZpZXcuIE9ubHlcbiAgICAgIC8vIHByb3BhZ2F0ZWQgTFF1ZXJpZXMgYXJlIGNyZWF0ZWQgYXQgdGhpcyBwb2ludCAoTFF1ZXJ5IGNvcnJlc3BvbmRpbmcgdG8gZGVjbGFyZWQgY29udGVudFxuICAgICAgLy8gcXVlcmllcyB3aWxsIGJlIGluc3RhbnRpYXRlZCBmcm9tIHRoZSBjb250ZW50IHF1ZXJ5IGluc3RydWN0aW9ucyBmb3IgZWFjaCBkaXJlY3RpdmUpLlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mSW5oZXJpdGVkUXVlcmllczsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHRRdWVyeSA9IHRRdWVyaWVzLmdldEJ5SW5kZXgoaSk7XG4gICAgICAgIGNvbnN0IHBhcmVudExRdWVyeSA9IHRoaXMucXVlcmllc1t0UXVlcnkuaW5kZXhJbkRlY2xhcmF0aW9uVmlld107XG4gICAgICAgIHZpZXdMUXVlcmllcy5wdXNoKHBhcmVudExRdWVyeS5jbG9uZSgpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBMUXVlcmllc18odmlld0xRdWVyaWVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcodFZpZXc6IFRWaWV3KTogdm9pZCB7IHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpOyB9XG5cbiAgZGV0YWNoVmlldyh0VmlldzogVFZpZXcpOiB2b2lkIHsgdGhpcy5kaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0Vmlldyk7IH1cblxuICBwcml2YXRlIGRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3OiBUVmlldykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoZ2V0VFF1ZXJ5KHRWaWV3LCBpKS5tYXRjaGVzICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMucXVlcmllc1tpXS5zZXREaXJ0eSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBUUXVlcnlNZXRhZGF0YV8gaW1wbGVtZW50cyBUUXVlcnlNZXRhZGF0YSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHByZWRpY2F0ZTogVHlwZTxhbnk+fHN0cmluZ1tdLCBwdWJsaWMgZGVzY2VuZGFudHM6IGJvb2xlYW4sIHB1YmxpYyBpc1N0YXRpYzogYm9vbGVhbixcbiAgICAgIHB1YmxpYyByZWFkOiBhbnkgPSBudWxsKSB7fVxufVxuXG5jbGFzcyBUUXVlcmllc18gaW1wbGVtZW50cyBUUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcXVlcmllczogVFF1ZXJ5W10gPSBbXSkge31cblxuICBlbGVtZW50U3RhcnQodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RUZW1wbGF0ZVBhc3MoXG4gICAgICAgICAgICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cbiAgZWxlbWVudEVuZCh0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRFbmQodE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSk6IFRRdWVyaWVzfG51bGwge1xuICAgIGxldCBxdWVyaWVzRm9yVGVtcGxhdGVSZWY6IFRRdWVyeVtdfG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgIT09IG51bGwgPyBxdWVyaWVzRm9yVGVtcGxhdGVSZWYubGVuZ3RoIDogMDtcbiAgICAgIGNvbnN0IHRxdWVyeUNsb25lID0gdGhpcy5nZXRCeUluZGV4KGkpLmVtYmVkZGVkVFZpZXcodE5vZGUsIGNoaWxkUXVlcnlJbmRleCk7XG5cbiAgICAgIGlmICh0cXVlcnlDbG9uZSkge1xuICAgICAgICB0cXVlcnlDbG9uZS5pbmRleEluRGVjbGFyYXRpb25WaWV3ID0gaTtcbiAgICAgICAgaWYgKHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCkge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5wdXNoKHRxdWVyeUNsb25lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgPSBbdHF1ZXJ5Q2xvbmVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IG5ldyBUUXVlcmllc18ocXVlcmllc0ZvclRlbXBsYXRlUmVmKSA6IG51bGw7XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdFRlbXBsYXRlUGFzcyhcbiAgICAgICAgICAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLnRlbXBsYXRlKHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QnlJbmRleChpbmRleDogbnVtYmVyKTogVFF1ZXJ5IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UodGhpcy5xdWVyaWVzLCBpbmRleCk7XG4gICAgcmV0dXJuIHRoaXMucXVlcmllc1tpbmRleF07XG4gIH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnF1ZXJpZXMubGVuZ3RoOyB9XG5cbiAgdHJhY2sodHF1ZXJ5OiBUUXVlcnkpOiB2b2lkIHsgdGhpcy5xdWVyaWVzLnB1c2godHF1ZXJ5KTsgfVxufVxuXG5jbGFzcyBUUXVlcnlfIGltcGxlbWVudHMgVFF1ZXJ5IHtcbiAgbWF0Y2hlczogbnVtYmVyW118bnVsbCA9IG51bGw7XG4gIGluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSAtMTtcbiAgY3Jvc3Nlc05nVGVtcGxhdGUgPSBmYWxzZTtcblxuICAvKipcbiAgICogQSBub2RlIGluZGV4IG9uIHdoaWNoIGEgcXVlcnkgd2FzIGRlY2xhcmVkICgtMSBmb3IgdmlldyBxdWVyaWVzIGFuZCBvbmVzIGluaGVyaXRlZCBmcm9tIHRoZVxuICAgKiBkZWNsYXJhdGlvbiB0ZW1wbGF0ZSkuIFdlIHVzZSB0aGlzIGluZGV4IChhbG9uZ3NpZGUgd2l0aCBfYXBwbGllc1RvTmV4dE5vZGUgZmxhZykgdG8ga25vd1xuICAgKiB3aGVuIHRvIGFwcGx5IGNvbnRlbnQgcXVlcmllcyB0byBlbGVtZW50cyBpbiBhIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZGVjbGFyYXRpb25Ob2RlSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQSBmbGFnIGluZGljYXRpbmcgaWYgYSBnaXZlbiBxdWVyeSBzdGlsbCBhcHBsaWVzIHRvIG5vZGVzIGl0IGlzIGNyb3NzaW5nLiBXZSB1c2UgdGhpcyBmbGFnXG4gICAqIChhbG9uZ3NpZGUgd2l0aCBfZGVjbGFyYXRpb25Ob2RlSW5kZXgpIHRvIGtub3cgd2hlbiB0byBzdG9wIGFwcGx5aW5nIGNvbnRlbnQgcXVlcmllcyB0b1xuICAgKiBlbGVtZW50cyBpbiBhIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbGllc1RvTmV4dE5vZGUgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBtZXRhZGF0YTogVFF1ZXJ5TWV0YWRhdGEsIG5vZGVJbmRleDogbnVtYmVyID0gLTEpIHtcbiAgICB0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9IG5vZGVJbmRleDtcbiAgfVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzQXBwbHlpbmdUb05vZGUodE5vZGUpKSB7XG4gICAgICB0aGlzLm1hdGNoVE5vZGUodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cblxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9PT0gdE5vZGUuaW5kZXgpIHtcbiAgICAgIHRoaXMuX2FwcGxpZXNUb05leHROb2RlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgdGVtcGxhdGUodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHsgdGhpcy5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTsgfVxuXG4gIGVtYmVkZGVkVFZpZXcodE5vZGU6IFROb2RlLCBjaGlsZFF1ZXJ5SW5kZXg6IG51bWJlcik6IFRRdWVyeXxudWxsIHtcbiAgICBpZiAodGhpcy5pc0FwcGx5aW5nVG9Ob2RlKHROb2RlKSkge1xuICAgICAgdGhpcy5jcm9zc2VzTmdUZW1wbGF0ZSA9IHRydWU7XG4gICAgICAvLyBBIG1hcmtlciBpbmRpY2F0aW5nIGEgYDxuZy10ZW1wbGF0ZT5gIGVsZW1lbnQgKGEgcGxhY2Vob2xkZXIgZm9yIHF1ZXJ5IHJlc3VsdHMgZnJvbVxuICAgICAgLy8gZW1iZWRkZWQgdmlld3MgY3JlYXRlZCBiYXNlZCBvbiB0aGlzIGA8bmctdGVtcGxhdGU+YCkuXG4gICAgICB0aGlzLmFkZE1hdGNoKC10Tm9kZS5pbmRleCwgY2hpbGRRdWVyeUluZGV4KTtcbiAgICAgIHJldHVybiBuZXcgVFF1ZXJ5Xyh0aGlzLm1ldGFkYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGlzQXBwbHlpbmdUb05vZGUodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX2FwcGxpZXNUb05leHROb2RlICYmIHRoaXMubWV0YWRhdGEuZGVzY2VuZGFudHMgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVjbGFyYXRpb25Ob2RlSW5kZXggPT09ICh0Tm9kZS5wYXJlbnQgPyB0Tm9kZS5wYXJlbnQuaW5kZXggOiAtMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZTtcbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hUTm9kZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMubWV0YWRhdGEucHJlZGljYXRlKSkge1xuICAgICAgY29uc3QgbG9jYWxOYW1lcyA9IHRoaXMubWV0YWRhdGEucHJlZGljYXRlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3LCB0Tm9kZSwgZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBsb2NhbE5hbWVzW2ldKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHR5cGVQcmVkaWNhdGUgPSB0aGlzLm1ldGFkYXRhLnByZWRpY2F0ZSBhcyBhbnk7XG4gICAgICBpZiAodHlwZVByZWRpY2F0ZSA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3LCB0Tm9kZSwgLTEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbihcbiAgICAgICAgICAgIHRWaWV3LCB0Tm9kZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHR5cGVQcmVkaWNhdGUsIGZhbHNlLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBub2RlTWF0Y2hJZHg6IG51bWJlcnxudWxsKTogdm9pZCB7XG4gICAgaWYgKG5vZGVNYXRjaElkeCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgcmVhZCA9IHRoaXMubWV0YWRhdGEucmVhZDtcbiAgICAgIGlmIChyZWFkICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChyZWFkID09PSBWaWV3RW5naW5lX0VsZW1lbnRSZWYgfHwgcmVhZCA9PT0gVmlld0NvbnRhaW5lclJlZiB8fFxuICAgICAgICAgICAgcmVhZCA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiAmJiB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgLTIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHggPVxuICAgICAgICAgICAgICBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgcmVhZCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICBpZiAoZGlyZWN0aXZlT3JQcm92aWRlcklkeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgZGlyZWN0aXZlT3JQcm92aWRlcklkeCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCBub2RlTWF0Y2hJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkTWF0Y2godE5vZGVJZHg6IG51bWJlciwgbWF0Y2hJZHg6IG51bWJlcikge1xuICAgIGlmICh0aGlzLm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMubWF0Y2hlcyA9IFt0Tm9kZUlkeCwgbWF0Y2hJZHhdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1hdGNoZXMucHVzaCh0Tm9kZUlkeCwgbWF0Y2hJZHgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgbG9jYWwgbmFtZXMgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgcmV0dXJucyBkaXJlY3RpdmUgaW5kZXhcbiAqIChvciAtMSBpZiBhIGxvY2FsIG5hbWUgcG9pbnRzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBzdGF0aWMgZGF0YSBvZiBhIG5vZGUgdG8gY2hlY2tcbiAqIEBwYXJhbSBzZWxlY3RvciBzZWxlY3RvciB0byBtYXRjaFxuICogQHJldHVybnMgZGlyZWN0aXZlIGluZGV4LCAtMSBvciBudWxsIGlmIGEgc2VsZWN0b3IgZGlkbid0IG1hdGNoIGFueSBvZiB0aGUgbG9jYWwgbmFtZXNcbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAobG9jYWxOYW1lc1tpXSA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVzdWx0QnlUTm9kZVR5cGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZihWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVzdWx0Rm9yTm9kZShsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgbWF0Y2hpbmdJZHg6IG51bWJlciwgcmVhZDogYW55KTogYW55IHtcbiAgaWYgKG1hdGNoaW5nSWR4ID09PSAtMSkge1xuICAgIC8vIGlmIHJlYWQgdG9rZW4gYW5kIC8gb3Igc3RyYXRlZ3kgaXMgbm90IHNwZWNpZmllZCwgZGV0ZWN0IGl0IHVzaW5nIGFwcHJvcHJpYXRlIHROb2RlIHR5cGVcbiAgICByZXR1cm4gY3JlYXRlUmVzdWx0QnlUTm9kZVR5cGUodE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChtYXRjaGluZ0lkeCA9PT0gLTIpIHtcbiAgICAvLyByZWFkIGEgc3BlY2lhbCB0b2tlbiBmcm9tIGEgbm9kZSBpbmplY3RvclxuICAgIHJldHVybiBjcmVhdGVTcGVjaWFsVG9rZW4obFZpZXcsIHROb2RlLCByZWFkKTtcbiAgfSBlbHNlIHtcbiAgICAvLyByZWFkIGEgdG9rZW5cbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUobFZpZXdbVFZJRVddLmRhdGEsIGxWaWV3LCBtYXRjaGluZ0lkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTcGVjaWFsVG9rZW4obFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGlmIChyZWFkID09PSBWaWV3RW5naW5lX0VsZW1lbnRSZWYpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZihWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAocmVhZCA9PT0gVmlld0NvbnRhaW5lclJlZikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gICAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICAgICAgVmlld0NvbnRhaW5lclJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgYFNwZWNpYWwgdG9rZW4gdG8gcmVhZCBzaG91bGQgYmUgb25lIG9mIEVsZW1lbnRSZWYsIFRlbXBsYXRlUmVmIG9yIFZpZXdDb250YWluZXJSZWYgYnV0IGdvdCAke3N0cmluZ2lmeShyZWFkKX0uYCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNyZWF0ZXMgcXVlcnkgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3LiBUaGlzIGZ1bmN0aW9uIGlzIG1lYW50IHRvIGRvIHRoZVxuICogcHJvY2Vzc2luZyBvbmNlIGFuZCBvbmx5IG9uY2UgZm9yIGEgZ2l2ZW4gdmlldyBpbnN0YW5jZSAoYSBzZXQgb2YgcmVzdWx0cyBmb3IgYSBnaXZlbiB2aWV3XG4gKiBkb2Vzbid0IGNoYW5nZSkuXG4gKi9cbmZ1bmN0aW9uIG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4obFZpZXc6IExWaWV3LCB0UXVlcnk6IFRRdWVyeSwgcXVlcnlJbmRleDogbnVtYmVyKTogKFQgfCBudWxsKVtdIHtcbiAgY29uc3QgbFF1ZXJ5ID0gbFZpZXdbUVVFUklFU10gIS5xdWVyaWVzICFbcXVlcnlJbmRleF07XG4gIGlmIChsUXVlcnkubWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgIGNvbnN0IHRWaWV3RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIGNvbnN0IHRRdWVyeU1hdGNoZXMgPSB0UXVlcnkubWF0Y2hlcyAhO1xuICAgIGNvbnN0IHJlc3VsdDogVHxudWxsW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRRdWVyeU1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IG1hdGNoZWROb2RlSWR4ID0gdFF1ZXJ5TWF0Y2hlc1tpXTtcbiAgICAgIGlmIChtYXRjaGVkTm9kZUlkeCA8IDApIHtcbiAgICAgICAgLy8gd2UgYXQgdGhlIDxuZy10ZW1wbGF0ZT4gbWFya2VyIHdoaWNoIG1pZ2h0IGhhdmUgcmVzdWx0cyBpbiB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXNcbiAgICAgICAgLy8gPG5nLXRlbXBsYXRlPiAtIHRob3NlIHJlc3VsdHMgd2lsbCBiZSBpbiBzZXBhcmF0ZSB2aWV3cyB0aG91Z2gsIHNvIGhlcmUgd2UganVzdCBsZWF2ZVxuICAgICAgICAvLyBudWxsIGFzIGEgcGxhY2Vob2xkZXJcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UodFZpZXdEYXRhLCBtYXRjaGVkTm9kZUlkeCk7XG4gICAgICAgIGNvbnN0IHROb2RlID0gdFZpZXdEYXRhW21hdGNoZWROb2RlSWR4XSBhcyBUTm9kZTtcbiAgICAgICAgcmVzdWx0LnB1c2goY3JlYXRlUmVzdWx0Rm9yTm9kZShsVmlldywgdE5vZGUsIHRRdWVyeU1hdGNoZXNbaSArIDFdLCB0UXVlcnkubWV0YWRhdGEucmVhZCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBsUXVlcnkubWF0Y2hlcyA9IHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBsUXVlcnkubWF0Y2hlcztcbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNvbGxlY3RzIChhbHJlYWR5IG1hdGVyaWFsaXplZCkgcXVlcnkgcmVzdWx0cyBmcm9tIGEgdHJlZSBvZiB2aWV3cyxcbiAqIHN0YXJ0aW5nIHdpdGggYSBwcm92aWRlZCBMVmlldy5cbiAqL1xuZnVuY3Rpb24gY29sbGVjdFF1ZXJ5UmVzdWx0czxUPihsVmlldzogTFZpZXcsIHF1ZXJ5SW5kZXg6IG51bWJlciwgcmVzdWx0OiBUW10pOiBUW10ge1xuICBjb25zdCB0UXVlcnkgPSBsVmlld1tUVklFV10ucXVlcmllcyAhLmdldEJ5SW5kZXgocXVlcnlJbmRleCk7XG4gIGNvbnN0IHRRdWVyeU1hdGNoZXMgPSB0UXVlcnkubWF0Y2hlcztcbiAgaWYgKHRRdWVyeU1hdGNoZXMgIT09IG51bGwpIHtcbiAgICBjb25zdCBsVmlld1Jlc3VsdHMgPSBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzPFQ+KGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0UXVlcnlNYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCB0Tm9kZUlkeCA9IHRRdWVyeU1hdGNoZXNbaV07XG4gICAgICBpZiAodE5vZGVJZHggPiAwKSB7XG4gICAgICAgIGNvbnN0IHZpZXdSZXN1bHQgPSBsVmlld1Jlc3VsdHNbaSAvIDJdO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3UmVzdWx0LCAnbWF0ZXJpYWxpemVkIHF1ZXJ5IHJlc3VsdCBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICAgICAgICByZXN1bHQucHVzaCh2aWV3UmVzdWx0IGFzIFQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY2hpbGRRdWVyeUluZGV4ID0gdFF1ZXJ5TWF0Y2hlc1tpICsgMV07XG5cbiAgICAgICAgY29uc3QgZGVjbGFyYXRpb25MQ29udGFpbmVyID0gbFZpZXdbLXROb2RlSWR4XSBhcyBMQ29udGFpbmVyO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkxDb250YWluZXIpO1xuXG4gICAgICAgIC8vIGNvbGxlY3QgbWF0Y2hlcyBmb3Igdmlld3MgaW5zZXJ0ZWQgaW4gdGhpcyBjb250YWluZXJcbiAgICAgICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgZGVjbGFyYXRpb25MQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGRlY2xhcmF0aW9uTENvbnRhaW5lcltpXTtcbiAgICAgICAgICBpZiAoZW1iZWRkZWRMVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXSA9PT0gZW1iZWRkZWRMVmlld1tQQVJFTlRdKSB7XG4gICAgICAgICAgICBjb2xsZWN0UXVlcnlSZXN1bHRzKGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGlzIGRlY2xhcmF0aW9uIGNvbnRhaW5lciBhbmQgaW5zZXJ0ZWQgaW50b1xuICAgICAgICAvLyBkaWZmZXJlbnQgY29udGFpbmVyc1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXdzID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW1iZWRkZWRMVmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld3NbaV0sIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqXG4gKiBAcmV0dXJucyBgdHJ1ZWAgaWYgYSBxdWVyeSBnb3QgZGlydHkgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gb3IgaWYgdGhpcyBpcyBhIHN0YXRpYyBxdWVyeVxuICogcmVzb2x2aW5nIGluIGNyZWF0aW9uIG1vZGUsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBxdWVyeUluZGV4ID0gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTtcblxuICBzZXRDdXJyZW50UXVlcnlJbmRleChxdWVyeUluZGV4ICsgMSk7XG5cbiAgY29uc3QgdFF1ZXJ5ID0gZ2V0VFF1ZXJ5KGxWaWV3W1RWSUVXXSwgcXVlcnlJbmRleCk7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkgJiYgKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSA9PT0gdFF1ZXJ5Lm1ldGFkYXRhLmlzU3RhdGljKSkge1xuICAgIGlmICh0UXVlcnkubWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgcXVlcnlMaXN0LnJlc2V0KFtdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdFF1ZXJ5LmNyb3NzZXNOZ1RlbXBsYXRlID8gY29sbGVjdFF1ZXJ5UmVzdWx0cyhsVmlldywgcXVlcnlJbmRleCwgW10pIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsaXplVmlld1Jlc3VsdHMobFZpZXcsIHRRdWVyeSwgcXVlcnlJbmRleCk7XG4gICAgICBxdWVyeUxpc3QucmVzZXQocmVzdWx0KTtcbiAgICAgIHF1ZXJ5TGlzdC5ub3RpZnlPbkNoYW5nZXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBuZXcgUXVlcnlMaXN0IGZvciBhIHN0YXRpYyB2aWV3IHF1ZXJ5LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdGF0aWNWaWV3UXVlcnk8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkPzogYW55KTogdm9pZCB7XG4gIHZpZXdRdWVyeUludGVybmFsKGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgdHJ1ZSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBuZXcgUXVlcnlMaXN0LCBzdG9yZXMgdGhlIHJlZmVyZW5jZSBpbiBMVmlldyBhbmQgcmV0dXJucyBRdWVyeUxpc3QuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXZpZXdRdWVyeTxUPihwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgdmlld1F1ZXJ5SW50ZXJuYWwoZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHZpZXdRdWVyeUludGVybmFsPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnksXG4gICAgaXNTdGF0aWM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNyZWF0ZVRRdWVyeSh0VmlldywgbmV3IFRRdWVyeU1ldGFkYXRhXyhwcmVkaWNhdGUsIGRlc2NlbmQsIGlzU3RhdGljLCByZWFkKSwgLTEpO1xuICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgdFZpZXcuc3RhdGljVmlld1F1ZXJpZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBjcmVhdGVMUXVlcnk8VD4obFZpZXcpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2ggKHBhcnQgb2YgYSB2aWV3XG4gKiByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGZhbHNlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZGlyZWN0aXZlSW5kZXgpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgc3RhdGljIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoXG4gKiAocGFydCBvZiBhIHZpZXcgcmVmcmVzaCkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEN1cnJlbnQgZGlyZWN0aXZlIGluZGV4XG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdGF0aWNDb250ZW50UXVlcnk8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkPzogYW55KTogdm9pZCB7XG4gIGNvbnRlbnRRdWVyeUludGVybmFsKFxuICAgICAgZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCB0cnVlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZGlyZWN0aXZlSW5kZXgpO1xufVxuXG5mdW5jdGlvbiBjb250ZW50UXVlcnlJbnRlcm5hbDxUPihcbiAgICBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55LCBpc1N0YXRpYzogYm9vbGVhbixcbiAgICB0Tm9kZTogVE5vZGUsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNyZWF0ZVRRdWVyeSh0VmlldywgbmV3IFRRdWVyeU1ldGFkYXRhXyhwcmVkaWNhdGUsIGRlc2NlbmQsIGlzU3RhdGljLCByZWFkKSwgdE5vZGUuaW5kZXgpO1xuICAgIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldywgZGlyZWN0aXZlSW5kZXgpO1xuICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgdFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUxRdWVyeTxUPihsVmlldyk7XG59XG5cbi8qKlxuICogTG9hZHMgYSBRdWVyeUxpc3QgY29ycmVzcG9uZGluZyB0byB0aGUgY3VycmVudCB2aWV3IG9yIGNvbnRlbnQgcXVlcnkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVsb2FkUXVlcnk8VD4oKTogUXVlcnlMaXN0PFQ+IHtcbiAgcmV0dXJuIGxvYWRRdWVyeUludGVybmFsPFQ+KGdldExWaWV3KCksIGdldEN1cnJlbnRRdWVyeUluZGV4KCkpO1xufVxuXG5mdW5jdGlvbiBsb2FkUXVlcnlJbnRlcm5hbDxUPihsVmlldzogTFZpZXcsIHF1ZXJ5SW5kZXg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChsVmlld1tRVUVSSUVTXSwgJ0xRdWVyaWVzIHNob3VsZCBiZSBkZWZpbmVkIHdoZW4gdHJ5aW5nIHRvIGxvYWQgYSBxdWVyeScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXdbUVVFUklFU10gIS5xdWVyaWVzLCBxdWVyeUluZGV4KTtcbiAgcmV0dXJuIGxWaWV3W1FVRVJJRVNdICEucXVlcmllc1txdWVyeUluZGV4XS5xdWVyeUxpc3Q7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxRdWVyeTxUPihsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChsVmlldywgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG5cbiAgaWYgKGxWaWV3W1FVRVJJRVNdID09PSBudWxsKSBsVmlld1tRVUVSSUVTXSA9IG5ldyBMUXVlcmllc18oKTtcbiAgbFZpZXdbUVVFUklFU10gIS5xdWVyaWVzLnB1c2gobmV3IExRdWVyeV8ocXVlcnlMaXN0KSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRRdWVyeSh0VmlldzogVFZpZXcsIG1ldGFkYXRhOiBUUXVlcnlNZXRhZGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LnF1ZXJpZXMgPT09IG51bGwpIHRWaWV3LnF1ZXJpZXMgPSBuZXcgVFF1ZXJpZXNfKCk7XG4gIHRWaWV3LnF1ZXJpZXMudHJhY2sobmV3IFRRdWVyeV8obWV0YWRhdGEsIG5vZGVJbmRleCkpO1xufVxuXG5mdW5jdGlvbiBzYXZlQ29udGVudFF1ZXJ5QW5kRGlyZWN0aXZlSW5kZXgodFZpZXc6IFRWaWV3LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHRWaWV3Q29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcyB8fCAodFZpZXcuY29udGVudFF1ZXJpZXMgPSBbXSk7XG4gIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCA/IHRWaWV3Q29udGVudFF1ZXJpZXNbdFZpZXdDb250ZW50UXVlcmllcy5sZW5ndGggLSAxXSA6IC0xO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKHRWaWV3LnF1ZXJpZXMgIS5sZW5ndGggLSAxLCBkaXJlY3RpdmVJbmRleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0VFF1ZXJ5KHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlcik6IFRRdWVyeSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LnF1ZXJpZXMsICdUUXVlcmllcyBtdXN0IGJlIGRlZmluZWQgdG8gcmV0cmlldmUgYSBUUXVlcnknKTtcbiAgcmV0dXJuIHRWaWV3LnF1ZXJpZXMgIS5nZXRCeUluZGV4KGluZGV4KTtcbn1cbiJdfQ==