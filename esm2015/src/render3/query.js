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
            const localNames = (/** @type {?} */ (this.metadata.predicate));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbkUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHlCQUF5QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xFLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzlELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN4RixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9FLE9BQU8sRUFBd0UsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbEosT0FBTyxFQUFxRCw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNoSSxPQUFP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QyxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxpQ0FBaUMsQ0FBQyxLQUFZLEVBQUUsY0FBc0I7O1VBQ3ZFLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQzs7VUFDekUsdUJBQXVCLEdBQ3pCLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRixJQUFJLGNBQWMsS0FBSyx1QkFBdUIsRUFBRTtRQUM5QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsbUJBQUEsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDdEU7QUFDSCxDQUFDOzs7Ozs7QUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFZLEVBQUUsS0FBYTtJQUM1QyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsK0NBQStDLENBQUMsQ0FBQztJQUMzRixPQUFPLG1CQUFBLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlci9xdWVyeV9saXN0JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHthc3NlcnRGaXJzdFRlbXBsYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lcn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0YWJsZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3N0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgTFF1ZXJ5LCBUUXVlcmllcywgVFF1ZXJ5LCBUUXVlcnlNZXRhZGF0YSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7REVDTEFSQVRJT05fTENPTlRBSU5FUiwgTFZpZXcsIFBBUkVOVCwgUVVFUklFUywgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDdXJyZW50UXVlcnlJbmRleCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0Q3VycmVudFF1ZXJ5SW5kZXh9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtpc0NyZWF0aW9uTW9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtjcmVhdGVDb250YWluZXJSZWYsIGNyZWF0ZUVsZW1lbnRSZWYsIGNyZWF0ZVRlbXBsYXRlUmVmfSBmcm9tICcuL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQ7XG5cbmNsYXNzIExRdWVyeV88VD4gaW1wbGVtZW50cyBMUXVlcnk8VD4ge1xuICBtYXRjaGVzOiAoVHxudWxsKVtdfG51bGwgPSBudWxsO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4pIHt9XG4gIGNsb25lKCk6IExRdWVyeTxUPiB7IHJldHVybiBuZXcgTFF1ZXJ5Xyh0aGlzLnF1ZXJ5TGlzdCk7IH1cbiAgc2V0RGlydHkoKTogdm9pZCB7IHRoaXMucXVlcnlMaXN0LnNldERpcnR5KCk7IH1cbn1cblxuY2xhc3MgTFF1ZXJpZXNfIGltcGxlbWVudHMgTFF1ZXJpZXMge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcmllczogTFF1ZXJ5PGFueT5bXSA9IFtdKSB7fVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldyh0VmlldzogVFZpZXcpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCB0UXVlcmllcyA9IHRWaWV3LnF1ZXJpZXM7XG4gICAgaWYgKHRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBub09mSW5oZXJpdGVkUXVlcmllcyA9XG4gICAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMgIT09IG51bGwgPyB0Vmlldy5jb250ZW50UXVlcmllc1swXSA6IHRRdWVyaWVzLmxlbmd0aDtcbiAgICAgIGNvbnN0IHZpZXdMUXVlcmllczogTFF1ZXJ5PGFueT5bXSA9IFtdO1xuXG4gICAgICAvLyBBbiBlbWJlZGRlZCB2aWV3IGhhcyBxdWVyaWVzIHByb3BhZ2F0ZWQgZnJvbSBhIGRlY2xhcmF0aW9uIHZpZXcgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGVcbiAgICAgIC8vIFRRdWVyaWVzIGNvbGxlY3Rpb24gYW5kIHVwIHVudGlsIGEgZmlyc3QgY29udGVudCBxdWVyeSBkZWNsYXJlZCBpbiB0aGUgZW1iZWRkZWQgdmlldy4gT25seVxuICAgICAgLy8gcHJvcGFnYXRlZCBMUXVlcmllcyBhcmUgY3JlYXRlZCBhdCB0aGlzIHBvaW50IChMUXVlcnkgY29ycmVzcG9uZGluZyB0byBkZWNsYXJlZCBjb250ZW50XG4gICAgICAvLyBxdWVyaWVzIHdpbGwgYmUgaW5zdGFudGlhdGVkIGZyb20gdGhlIGNvbnRlbnQgcXVlcnkgaW5zdHJ1Y3Rpb25zIGZvciBlYWNoIGRpcmVjdGl2ZSkuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vT2ZJbmhlcml0ZWRRdWVyaWVzOyBpKyspIHtcbiAgICAgICAgY29uc3QgdFF1ZXJ5ID0gdFF1ZXJpZXMuZ2V0QnlJbmRleChpKTtcbiAgICAgICAgY29uc3QgcGFyZW50TFF1ZXJ5ID0gdGhpcy5xdWVyaWVzW3RRdWVyeS5pbmRleEluRGVjbGFyYXRpb25WaWV3XTtcbiAgICAgICAgdmlld0xRdWVyaWVzLnB1c2gocGFyZW50TFF1ZXJ5LmNsb25lKCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IExRdWVyaWVzXyh2aWV3TFF1ZXJpZXMpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaW5zZXJ0Vmlldyh0VmlldzogVFZpZXcpOiB2b2lkIHsgdGhpcy5kaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0Vmlldyk7IH1cblxuICBkZXRhY2hWaWV3KHRWaWV3OiBUVmlldyk6IHZvaWQgeyB0aGlzLmRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3KTsgfVxuXG4gIHByaXZhdGUgZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXc6IFRWaWV3KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChnZXRUUXVlcnkodFZpZXcsIGkpLm1hdGNoZXMgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5xdWVyaWVzW2ldLnNldERpcnR5KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFRRdWVyeU1ldGFkYXRhXyBpbXBsZW1lbnRzIFRRdWVyeU1ldGFkYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcHJlZGljYXRlOiBUeXBlPGFueT58c3RyaW5nW10sIHB1YmxpYyBkZXNjZW5kYW50czogYm9vbGVhbiwgcHVibGljIGlzU3RhdGljOiBib29sZWFuLFxuICAgICAgcHVibGljIHJlYWQ6IGFueSA9IG51bGwpIHt9XG59XG5cbmNsYXNzIFRRdWVyaWVzXyBpbXBsZW1lbnRzIFRRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBxdWVyaWVzOiBUUXVlcnlbXSA9IFtdKSB7fVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdFRlbXBsYXRlUGFzcyhcbiAgICAgICAgICAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnF1ZXJpZXNbaV0uZWxlbWVudEVuZCh0Tm9kZSk7XG4gICAgfVxuICB9XG4gIGVtYmVkZGVkVFZpZXcodE5vZGU6IFROb2RlKTogVFF1ZXJpZXN8bnVsbCB7XG4gICAgbGV0IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZjogVFF1ZXJ5W118bnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNoaWxkUXVlcnlJbmRleCA9IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5sZW5ndGggOiAwO1xuICAgICAgY29uc3QgdHF1ZXJ5Q2xvbmUgPSB0aGlzLmdldEJ5SW5kZXgoaSkuZW1iZWRkZWRUVmlldyh0Tm9kZSwgY2hpbGRRdWVyeUluZGV4KTtcblxuICAgICAgaWYgKHRxdWVyeUNsb25lKSB7XG4gICAgICAgIHRxdWVyeUNsb25lLmluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSBpO1xuICAgICAgICBpZiAocXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsKSB7XG4gICAgICAgICAgcXVlcmllc0ZvclRlbXBsYXRlUmVmLnB1c2godHF1ZXJ5Q2xvbmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiA9IFt0cXVlcnlDbG9uZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsID8gbmV3IFRRdWVyaWVzXyhxdWVyaWVzRm9yVGVtcGxhdGVSZWYpIDogbnVsbDtcbiAgfVxuXG4gIHRlbXBsYXRlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0VGVtcGxhdGVQYXNzKFxuICAgICAgICAgICAgICAgICAgICAgdFZpZXcsICdRdWVyaWVzIHNob3VsZCBjb2xsZWN0IHJlc3VsdHMgb24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnF1ZXJpZXNbaV0udGVtcGxhdGUodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cblxuICBnZXRCeUluZGV4KGluZGV4OiBudW1iZXIpOiBUUXVlcnkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh0aGlzLnF1ZXJpZXMsIGluZGV4KTtcbiAgICByZXR1cm4gdGhpcy5xdWVyaWVzW2luZGV4XTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMucXVlcmllcy5sZW5ndGg7IH1cblxuICB0cmFjayh0cXVlcnk6IFRRdWVyeSk6IHZvaWQgeyB0aGlzLnF1ZXJpZXMucHVzaCh0cXVlcnkpOyB9XG59XG5cbmNsYXNzIFRRdWVyeV8gaW1wbGVtZW50cyBUUXVlcnkge1xuICBtYXRjaGVzOiBudW1iZXJbXXxudWxsID0gbnVsbDtcbiAgaW5kZXhJbkRlY2xhcmF0aW9uVmlldyA9IC0xO1xuICBjcm9zc2VzTmdUZW1wbGF0ZSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBBIG5vZGUgaW5kZXggb24gd2hpY2ggYSBxdWVyeSB3YXMgZGVjbGFyZWQgKC0xIGZvciB2aWV3IHF1ZXJpZXMgYW5kIG9uZXMgaW5oZXJpdGVkIGZyb20gdGhlXG4gICAqIGRlY2xhcmF0aW9uIHRlbXBsYXRlKS4gV2UgdXNlIHRoaXMgaW5kZXggKGFsb25nc2lkZSB3aXRoIF9hcHBsaWVzVG9OZXh0Tm9kZSBmbGFnKSB0byBrbm93XG4gICAqIHdoZW4gdG8gYXBwbHkgY29udGVudCBxdWVyaWVzIHRvIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbk5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIGZsYWcgaW5kaWNhdGluZyBpZiBhIGdpdmVuIHF1ZXJ5IHN0aWxsIGFwcGxpZXMgdG8gbm9kZXMgaXQgaXMgY3Jvc3NpbmcuIFdlIHVzZSB0aGlzIGZsYWdcbiAgICogKGFsb25nc2lkZSB3aXRoIF9kZWNsYXJhdGlvbk5vZGVJbmRleCkgdG8ga25vdyB3aGVuIHRvIHN0b3AgYXBwbHlpbmcgY29udGVudCBxdWVyaWVzIHRvXG4gICAqIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9hcHBsaWVzVG9OZXh0Tm9kZSA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIG1ldGFkYXRhOiBUUXVlcnlNZXRhZGF0YSwgbm9kZUluZGV4OiBudW1iZXIgPSAtMSkge1xuICAgIHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID0gbm9kZUluZGV4O1xuICB9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMubWF0Y2hUTm9kZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGVsZW1lbnRFbmQodE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID09PSB0Tm9kZS5pbmRleCkge1xuICAgICAgdGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQgeyB0aGlzLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpOyB9XG5cbiAgZW1iZWRkZWRUVmlldyh0Tm9kZTogVE5vZGUsIGNoaWxkUXVlcnlJbmRleDogbnVtYmVyKTogVFF1ZXJ5fG51bGwge1xuICAgIGlmICh0aGlzLmlzQXBwbHlpbmdUb05vZGUodE5vZGUpKSB7XG4gICAgICB0aGlzLmNyb3NzZXNOZ1RlbXBsYXRlID0gdHJ1ZTtcbiAgICAgIC8vIEEgbWFya2VyIGluZGljYXRpbmcgYSBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudCAoYSBwbGFjZWhvbGRlciBmb3IgcXVlcnkgcmVzdWx0cyBmcm9tXG4gICAgICAvLyBlbWJlZGRlZCB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXMgYDxuZy10ZW1wbGF0ZT5gKS5cbiAgICAgIHRoaXMuYWRkTWF0Y2goLXROb2RlLmluZGV4LCBjaGlsZFF1ZXJ5SW5kZXgpO1xuICAgICAgcmV0dXJuIG5ldyBUUXVlcnlfKHRoaXMubWV0YWRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgaXNBcHBseWluZ1RvTm9kZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgJiYgdGhpcy5tZXRhZGF0YS5kZXNjZW5kYW50cyA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9PT0gKHROb2RlLnBhcmVudCA/IHROb2RlLnBhcmVudC5pbmRleCA6IC0xKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2FwcGxpZXNUb05leHROb2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaFROb2RlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5tZXRhZGF0YS5wcmVkaWNhdGUpKSB7XG4gICAgICBjb25zdCBsb2NhbE5hbWVzID0gdGhpcy5tZXRhZGF0YS5wcmVkaWNhdGUgYXMgc3RyaW5nW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXcsIHROb2RlLCBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIGxvY2FsTmFtZXNbaV0pKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgdHlwZVByZWRpY2F0ZSA9IHRoaXMubWV0YWRhdGEucHJlZGljYXRlIGFzIGFueTtcbiAgICAgIGlmICh0eXBlUHJlZGljYXRlID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXcsIHROb2RlLCAtMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKFxuICAgICAgICAgICAgdFZpZXcsIHROb2RlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgdHlwZVByZWRpY2F0ZSwgZmFsc2UsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIG5vZGVNYXRjaElkeDogbnVtYmVyfG51bGwpOiB2b2lkIHtcbiAgICBpZiAobm9kZU1hdGNoSWR4ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCByZWFkID0gdGhpcy5tZXRhZGF0YS5yZWFkO1xuICAgICAgaWYgKHJlYWQgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB8fCByZWFkID09PSBWaWV3Q29udGFpbmVyUmVmIHx8XG4gICAgICAgICAgICByZWFkID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmICYmIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCAtMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aXZlT3JQcm92aWRlcklkeCA9XG4gICAgICAgICAgICAgIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCByZWFkLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgIGlmIChkaXJlY3RpdmVPclByb3ZpZGVySWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCBkaXJlY3RpdmVPclByb3ZpZGVySWR4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIG5vZGVNYXRjaElkeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRNYXRjaCh0Tm9kZUlkeDogbnVtYmVyLCBtYXRjaElkeDogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMubWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5tYXRjaGVzID0gW3ROb2RlSWR4LCBtYXRjaElkeF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWF0Y2hlcy5wdXNoKHROb2RlSWR4LCBtYXRjaElkeCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBsb2NhbCBuYW1lcyBmb3IgYSBnaXZlbiBub2RlIGFuZCByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleFxuICogKG9yIC0xIGlmIGEgbG9jYWwgbmFtZSBwb2ludHMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIHROb2RlIHN0YXRpYyBkYXRhIG9mIGEgbm9kZSB0byBjaGVja1xuICogQHBhcmFtIHNlbGVjdG9yIHNlbGVjdG9yIHRvIG1hdGNoXG4gKiBAcmV0dXJucyBkaXJlY3RpdmUgaW5kZXgsIC0xIG9yIG51bGwgaWYgYSBzZWxlY3RvciBkaWRuJ3QgbWF0Y2ggYW55IG9mIHRoZSBsb2NhbCBuYW1lc1xuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3Rvcjogc3RyaW5nKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGlmIChsb2NhbE5hbWVzW2ldID09PSBzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVSZXN1bHRCeVROb2RlVHlwZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGFueSB7XG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmKFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVSZXN1bHRGb3JOb2RlKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCBtYXRjaGluZ0lkeDogbnVtYmVyLCByZWFkOiBhbnkpOiBhbnkge1xuICBpZiAobWF0Y2hpbmdJZHggPT09IC0xKSB7XG4gICAgLy8gaWYgcmVhZCB0b2tlbiBhbmQgLyBvciBzdHJhdGVneSBpcyBub3Qgc3BlY2lmaWVkLCBkZXRlY3QgaXQgdXNpbmcgYXBwcm9wcmlhdGUgdE5vZGUgdHlwZVxuICAgIHJldHVybiBjcmVhdGVSZXN1bHRCeVROb2RlVHlwZSh0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKG1hdGNoaW5nSWR4ID09PSAtMikge1xuICAgIC8vIHJlYWQgYSBzcGVjaWFsIHRva2VuIGZyb20gYSBub2RlIGluamVjdG9yXG4gICAgcmV0dXJuIGNyZWF0ZVNwZWNpYWxUb2tlbihsVmlldywgdE5vZGUsIHJlYWQpO1xuICB9IGVsc2Uge1xuICAgIC8vIHJlYWQgYSB0b2tlblxuICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZShsVmlld1tUVklFV10uZGF0YSwgbFZpZXcsIG1hdGNoaW5nSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNwZWNpYWxUb2tlbihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgcmVhZDogYW55KTogYW55IHtcbiAgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChyZWFkID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmKFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChyZWFkID09PSBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgICAgICBWaWV3Q29udGFpbmVyUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIHRocm93RXJyb3IoXG4gICAgICAgICAgICBgU3BlY2lhbCB0b2tlbiB0byByZWFkIHNob3VsZCBiZSBvbmUgb2YgRWxlbWVudFJlZiwgVGVtcGxhdGVSZWYgb3IgVmlld0NvbnRhaW5lclJlZiBidXQgZ290ICR7c3RyaW5naWZ5KHJlYWQpfS5gKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBxdWVyeSByZXN1bHRzIGZvciBhIGdpdmVuIHZpZXcuIFRoaXMgZnVuY3Rpb24gaXMgbWVhbnQgdG8gZG8gdGhlXG4gKiBwcm9jZXNzaW5nIG9uY2UgYW5kIG9ubHkgb25jZSBmb3IgYSBnaXZlbiB2aWV3IGluc3RhbmNlIChhIHNldCBvZiByZXN1bHRzIGZvciBhIGdpdmVuIHZpZXdcbiAqIGRvZXNuJ3QgY2hhbmdlKS5cbiAqL1xuZnVuY3Rpb24gbWF0ZXJpYWxpemVWaWV3UmVzdWx0czxUPihsVmlldzogTFZpZXcsIHRRdWVyeTogVFF1ZXJ5LCBxdWVyeUluZGV4OiBudW1iZXIpOiAoVCB8IG51bGwpW10ge1xuICBjb25zdCBsUXVlcnkgPSBsVmlld1tRVUVSSUVTXSAhLnF1ZXJpZXMgIVtxdWVyeUluZGV4XTtcbiAgaWYgKGxRdWVyeS5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgY29uc3QgdFZpZXdEYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgY29uc3QgdFF1ZXJ5TWF0Y2hlcyA9IHRRdWVyeS5tYXRjaGVzICE7XG4gICAgY29uc3QgcmVzdWx0OiBUfG51bGxbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFF1ZXJ5TWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgbWF0Y2hlZE5vZGVJZHggPSB0UXVlcnlNYXRjaGVzW2ldO1xuICAgICAgaWYgKG1hdGNoZWROb2RlSWR4IDwgMCkge1xuICAgICAgICAvLyB3ZSBhdCB0aGUgPG5nLXRlbXBsYXRlPiBtYXJrZXIgd2hpY2ggbWlnaHQgaGF2ZSByZXN1bHRzIGluIHZpZXdzIGNyZWF0ZWQgYmFzZWQgb24gdGhpc1xuICAgICAgICAvLyA8bmctdGVtcGxhdGU+IC0gdGhvc2UgcmVzdWx0cyB3aWxsIGJlIGluIHNlcGFyYXRlIHZpZXdzIHRob3VnaCwgc28gaGVyZSB3ZSBqdXN0IGxlYXZlXG4gICAgICAgIC8vIG51bGwgYXMgYSBwbGFjZWhvbGRlclxuICAgICAgICByZXN1bHQucHVzaChudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh0Vmlld0RhdGEsIG1hdGNoZWROb2RlSWR4KTtcbiAgICAgICAgY29uc3QgdE5vZGUgPSB0Vmlld0RhdGFbbWF0Y2hlZE5vZGVJZHhdIGFzIFROb2RlO1xuICAgICAgICByZXN1bHQucHVzaChjcmVhdGVSZXN1bHRGb3JOb2RlKGxWaWV3LCB0Tm9kZSwgdFF1ZXJ5TWF0Y2hlc1tpICsgMV0sIHRRdWVyeS5tZXRhZGF0YS5yZWFkKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxRdWVyeS5tYXRjaGVzID0gcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIGxRdWVyeS5tYXRjaGVzO1xufVxuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgY29sbGVjdHMgKGFscmVhZHkgbWF0ZXJpYWxpemVkKSBxdWVyeSByZXN1bHRzIGZyb20gYSB0cmVlIG9mIHZpZXdzLFxuICogc3RhcnRpbmcgd2l0aCBhIHByb3ZpZGVkIExWaWV3LlxuICovXG5mdW5jdGlvbiBjb2xsZWN0UXVlcnlSZXN1bHRzPFQ+KGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyLCByZXN1bHQ6IFRbXSk6IFRbXSB7XG4gIGNvbnN0IHRRdWVyeSA9IGxWaWV3W1RWSUVXXS5xdWVyaWVzICEuZ2V0QnlJbmRleChxdWVyeUluZGV4KTtcbiAgY29uc3QgdFF1ZXJ5TWF0Y2hlcyA9IHRRdWVyeS5tYXRjaGVzO1xuICBpZiAodFF1ZXJ5TWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxWaWV3UmVzdWx0cyA9IG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4obFZpZXcsIHRRdWVyeSwgcXVlcnlJbmRleCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRRdWVyeU1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IHROb2RlSWR4ID0gdFF1ZXJ5TWF0Y2hlc1tpXTtcbiAgICAgIGlmICh0Tm9kZUlkeCA+IDApIHtcbiAgICAgICAgY29uc3Qgdmlld1Jlc3VsdCA9IGxWaWV3UmVzdWx0c1tpIC8gMl07XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHZpZXdSZXN1bHQsICdtYXRlcmlhbGl6ZWQgcXVlcnkgcmVzdWx0IHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIHJlc3VsdC5wdXNoKHZpZXdSZXN1bHQgYXMgVCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSB0UXVlcnlNYXRjaGVzW2kgKyAxXTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1stdE5vZGVJZHhdIGFzIExDb250YWluZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uTENvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBpbnNlcnRlZCBpbiB0aGlzIGNvbnRhaW5lclxuICAgICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBkZWNsYXJhdGlvbkxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW2ldO1xuICAgICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdID09PSBlbWJlZGRlZExWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlldywgY2hpbGRRdWVyeUluZGV4LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbGxlY3QgbWF0Y2hlcyBmb3Igdmlld3MgY3JlYXRlZCBmcm9tIHRoaXMgZGVjbGFyYXRpb24gY29udGFpbmVyIGFuZCBpbnNlcnRlZCBpbnRvXG4gICAgICAgIC8vIGRpZmZlcmVudCBjb250YWluZXJzXG4gICAgICAgIGlmIChkZWNsYXJhdGlvbkxDb250YWluZXJbTU9WRURfVklFV1NdICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlld3MgPSBkZWNsYXJhdGlvbkxDb250YWluZXJbTU9WRURfVklFV1NdICE7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbWJlZGRlZExWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyhlbWJlZGRlZExWaWV3c1tpXSwgY2hpbGRRdWVyeUluZGV4LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhIHF1ZXJ5IGJ5IGNvbWJpbmluZyBtYXRjaGVzIGZyb20gYWxsIGFjdGl2ZSB2aWV3cyBhbmQgcmVtb3ZpbmcgbWF0Y2hlcyBmcm9tIGRlbGV0ZWRcbiAqIHZpZXdzLlxuICpcbiAqIEByZXR1cm5zIGB0cnVlYCBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBvciBpZiB0aGlzIGlzIGEgc3RhdGljIHF1ZXJ5XG4gKiByZXNvbHZpbmcgaW4gY3JlYXRpb24gbW9kZSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVxdWVyeVJlZnJlc2gocXVlcnlMaXN0OiBRdWVyeUxpc3Q8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHF1ZXJ5SW5kZXggPSBnZXRDdXJyZW50UXVlcnlJbmRleCgpO1xuXG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KHF1ZXJ5SW5kZXggKyAxKTtcblxuICBjb25zdCB0UXVlcnkgPSBnZXRUUXVlcnkobFZpZXdbVFZJRVddLCBxdWVyeUluZGV4KTtcbiAgaWYgKHF1ZXJ5TGlzdC5kaXJ0eSAmJiAoaXNDcmVhdGlvbk1vZGUobFZpZXcpID09PSB0UXVlcnkubWV0YWRhdGEuaXNTdGF0aWMpKSB7XG4gICAgaWYgKHRRdWVyeS5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgICBxdWVyeUxpc3QucmVzZXQoW10pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB0UXVlcnkuY3Jvc3Nlc05nVGVtcGxhdGUgPyBjb2xsZWN0UXVlcnlSZXN1bHRzKGxWaWV3LCBxdWVyeUluZGV4LCBbXSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0ZXJpYWxpemVWaWV3UmVzdWx0cyhsVmlldywgdFF1ZXJ5LCBxdWVyeUluZGV4KTtcbiAgICAgIHF1ZXJ5TGlzdC5yZXNldChyZXN1bHQpO1xuICAgICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QgZm9yIGEgc3RhdGljIHZpZXcgcXVlcnkuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY1ZpZXdRdWVyeTxUPihcbiAgICBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgdmlld1F1ZXJ5SW50ZXJuYWwoZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QsIHN0b3JlcyB0aGUgcmVmZXJlbmNlIGluIExWaWV3IGFuZCByZXR1cm5zIFF1ZXJ5TGlzdC5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dmlld1F1ZXJ5PFQ+KHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICB2aWV3UXVlcnlJbnRlcm5hbChnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gdmlld1F1ZXJ5SW50ZXJuYWw8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSxcbiAgICBpc1N0YXRpYzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZGVzY2VuZCwgaXNTdGF0aWMsIHJlYWQpLCAtMSk7XG4gICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNWaWV3UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG4gIGNyZWF0ZUxRdWVyeTxUPihsVmlldyk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICBjb250ZW50UXVlcnlJbnRlcm5hbChcbiAgICAgIGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgZmFsc2UsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBzdGF0aWMgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2hcbiAqIChwYXJ0IG9mIGEgdmlldyByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY0NvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRlbnRRdWVyeUludGVybmFsPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnksIGlzU3RhdGljOiBib29sZWFuLFxuICAgIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZGVzY2VuZCwgaXNTdGF0aWMsIHJlYWQpLCB0Tm9kZS5pbmRleCk7XG4gICAgc2F2ZUNvbnRlbnRRdWVyeUFuZERpcmVjdGl2ZUluZGV4KHRWaWV3LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlTFF1ZXJ5PFQ+KGxWaWV3KTtcbn1cblxuLyoqXG4gKiBMb2FkcyBhIFF1ZXJ5TGlzdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBjdXJyZW50IHZpZXcgb3IgY29udGVudCBxdWVyeS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxvYWRRdWVyeTxUPigpOiBRdWVyeUxpc3Q8VD4ge1xuICByZXR1cm4gbG9hZFF1ZXJ5SW50ZXJuYWw8VD4oZ2V0TFZpZXcoKSwgZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRRdWVyeUludGVybmFsPFQ+KGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGxWaWV3W1FVRVJJRVNdLCAnTFF1ZXJpZXMgc2hvdWxkIGJlIGRlZmluZWQgd2hlbiB0cnlpbmcgdG8gbG9hZCBhIHF1ZXJ5Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlld1tRVUVSSUVTXSAhLnF1ZXJpZXMsIHF1ZXJ5SW5kZXgpO1xuICByZXR1cm4gbFZpZXdbUVVFUklFU10gIS5xdWVyaWVzW3F1ZXJ5SW5kZXhdLnF1ZXJ5TGlzdDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTFF1ZXJ5PFQ+KGxWaWV3OiBMVmlldykge1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KCk7XG4gIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KGxWaWV3LCBxdWVyeUxpc3QsIHF1ZXJ5TGlzdC5kZXN0cm95KTtcblxuICBpZiAobFZpZXdbUVVFUklFU10gPT09IG51bGwpIGxWaWV3W1FVRVJJRVNdID0gbmV3IExRdWVyaWVzXygpO1xuICBsVmlld1tRVUVSSUVTXSAhLnF1ZXJpZXMucHVzaChuZXcgTFF1ZXJ5XyhxdWVyeUxpc3QpKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVFF1ZXJ5KHRWaWV3OiBUVmlldywgbWV0YWRhdGE6IFRRdWVyeU1ldGFkYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBpZiAodFZpZXcucXVlcmllcyA9PT0gbnVsbCkgdFZpZXcucXVlcmllcyA9IG5ldyBUUXVlcmllc18oKTtcbiAgdFZpZXcucXVlcmllcy50cmFjayhuZXcgVFF1ZXJ5XyhtZXRhZGF0YSwgbm9kZUluZGV4KSk7XG59XG5cbmZ1bmN0aW9uIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldzogVFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXdDb250ZW50UXVlcmllc1t0Vmlld0NvbnRlbnRRdWVyaWVzLmxlbmd0aCAtIDFdIDogLTE7XG4gIGlmIChkaXJlY3RpdmVJbmRleCAhPT0gbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXgpIHtcbiAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2godFZpZXcucXVlcmllcyAhLmxlbmd0aCAtIDEsIGRpcmVjdGl2ZUluZGV4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRUUXVlcnkodFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyKTogVFF1ZXJ5IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcucXVlcmllcywgJ1RRdWVyaWVzIG11c3QgYmUgZGVmaW5lZCB0byByZXRyaWV2ZSBhIFRRdWVyeScpO1xuICByZXR1cm4gdFZpZXcucXVlcmllcyAhLmdldEJ5SW5kZXgoaW5kZXgpO1xufVxuIl19