/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
import { getCurrentQueryIndex, getLView, getPreviousOrParentTNode, setCurrentQueryIndex } from './state';
import { isCreationMode } from './util/view_utils';
import { createContainerRef, createElementRef, createTemplateRef } from './view_engine_compatibility';
var unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
var LQuery_ = /** @class */ (function () {
    function LQuery_(queryList) {
        this.queryList = queryList;
        this.matches = null;
    }
    LQuery_.prototype.clone = function () { return new LQuery_(this.queryList); };
    LQuery_.prototype.setDirty = function () { this.queryList.setDirty(); };
    return LQuery_;
}());
var LQueries_ = /** @class */ (function () {
    function LQueries_(queries) {
        if (queries === void 0) { queries = []; }
        this.queries = queries;
    }
    LQueries_.prototype.createEmbeddedView = function (tView) {
        var tQueries = tView.queries;
        if (tQueries !== null) {
            var noOfInheritedQueries = tView.contentQueries !== null ? tView.contentQueries[0] : tQueries.length;
            var viewLQueries = [];
            // An embedded view has queries propagated from a declaration view at the beginning of the
            // TQueries collection and up until a first content query declared in the embedded view. Only
            // propagated LQueries are created at this point (LQuery corresponding to declared content
            // queries will be instantiated from the content query instructions for each directive).
            for (var i = 0; i < noOfInheritedQueries; i++) {
                var tQuery = tQueries.getByIndex(i);
                var parentLQuery = this.queries[tQuery.indexInDeclarationView];
                viewLQueries.push(parentLQuery.clone());
            }
            return new LQueries_(viewLQueries);
        }
        return null;
    };
    LQueries_.prototype.insertView = function (tView) { this.dirtyQueriesWithMatches(tView); };
    LQueries_.prototype.detachView = function (tView) { this.dirtyQueriesWithMatches(tView); };
    LQueries_.prototype.dirtyQueriesWithMatches = function (tView) {
        for (var i = 0; i < this.queries.length; i++) {
            if (getTQuery(tView, i).matches !== null) {
                this.queries[i].setDirty();
            }
        }
    };
    return LQueries_;
}());
var TQueryMetadata_ = /** @class */ (function () {
    function TQueryMetadata_(predicate, descendants, isStatic, read) {
        if (read === void 0) { read = null; }
        this.predicate = predicate;
        this.descendants = descendants;
        this.isStatic = isStatic;
        this.read = read;
    }
    return TQueryMetadata_;
}());
var TQueries_ = /** @class */ (function () {
    function TQueries_(queries) {
        if (queries === void 0) { queries = []; }
        this.queries = queries;
    }
    TQueries_.prototype.elementStart = function (tView, tNode) {
        ngDevMode && assertFirstCreatePass(tView, 'Queries should collect results on the first template pass only');
        for (var i = 0; i < this.queries.length; i++) {
            this.queries[i].elementStart(tView, tNode);
        }
    };
    TQueries_.prototype.elementEnd = function (tNode) {
        for (var i = 0; i < this.queries.length; i++) {
            this.queries[i].elementEnd(tNode);
        }
    };
    TQueries_.prototype.embeddedTView = function (tNode) {
        var queriesForTemplateRef = null;
        for (var i = 0; i < this.length; i++) {
            var childQueryIndex = queriesForTemplateRef !== null ? queriesForTemplateRef.length : 0;
            var tqueryClone = this.getByIndex(i).embeddedTView(tNode, childQueryIndex);
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
    };
    TQueries_.prototype.template = function (tView, tNode) {
        ngDevMode && assertFirstCreatePass(tView, 'Queries should collect results on the first template pass only');
        for (var i = 0; i < this.queries.length; i++) {
            this.queries[i].template(tView, tNode);
        }
    };
    TQueries_.prototype.getByIndex = function (index) {
        ngDevMode && assertDataInRange(this.queries, index);
        return this.queries[index];
    };
    Object.defineProperty(TQueries_.prototype, "length", {
        get: function () { return this.queries.length; },
        enumerable: true,
        configurable: true
    });
    TQueries_.prototype.track = function (tquery) { this.queries.push(tquery); };
    return TQueries_;
}());
var TQuery_ = /** @class */ (function () {
    function TQuery_(metadata, nodeIndex) {
        if (nodeIndex === void 0) { nodeIndex = -1; }
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
    TQuery_.prototype.elementStart = function (tView, tNode) {
        if (this.isApplyingToNode(tNode)) {
            this.matchTNode(tView, tNode);
        }
    };
    TQuery_.prototype.elementEnd = function (tNode) {
        if (this._declarationNodeIndex === tNode.index) {
            this._appliesToNextNode = false;
        }
    };
    TQuery_.prototype.template = function (tView, tNode) { this.elementStart(tView, tNode); };
    TQuery_.prototype.embeddedTView = function (tNode, childQueryIndex) {
        if (this.isApplyingToNode(tNode)) {
            this.crossesNgTemplate = true;
            // A marker indicating a `<ng-template>` element (a placeholder for query results from
            // embedded views created based on this `<ng-template>`).
            this.addMatch(-tNode.index, childQueryIndex);
            return new TQuery_(this.metadata);
        }
        return null;
    };
    TQuery_.prototype.isApplyingToNode = function (tNode) {
        if (this._appliesToNextNode && this.metadata.descendants === false) {
            return this._declarationNodeIndex === (tNode.parent ? tNode.parent.index : -1);
        }
        return this._appliesToNextNode;
    };
    TQuery_.prototype.matchTNode = function (tView, tNode) {
        if (Array.isArray(this.metadata.predicate)) {
            var localNames = this.metadata.predicate;
            for (var i = 0; i < localNames.length; i++) {
                this.matchTNodeWithReadOption(tView, tNode, getIdxOfMatchingSelector(tNode, localNames[i]));
            }
        }
        else {
            var typePredicate = this.metadata.predicate;
            if (typePredicate === ViewEngine_TemplateRef) {
                if (tNode.type === 0 /* Container */) {
                    this.matchTNodeWithReadOption(tView, tNode, -1);
                }
            }
            else {
                this.matchTNodeWithReadOption(tView, tNode, locateDirectiveOrProvider(tNode, tView, typePredicate, false, false));
            }
        }
    };
    TQuery_.prototype.matchTNodeWithReadOption = function (tView, tNode, nodeMatchIdx) {
        if (nodeMatchIdx !== null) {
            var read = this.metadata.read;
            if (read !== null) {
                if (read === ViewEngine_ElementRef || read === ViewContainerRef ||
                    read === ViewEngine_TemplateRef && tNode.type === 0 /* Container */) {
                    this.addMatch(tNode.index, -2);
                }
                else {
                    var directiveOrProviderIdx = locateDirectiveOrProvider(tNode, tView, read, false, false);
                    if (directiveOrProviderIdx !== null) {
                        this.addMatch(tNode.index, directiveOrProviderIdx);
                    }
                }
            }
            else {
                this.addMatch(tNode.index, nodeMatchIdx);
            }
        }
    };
    TQuery_.prototype.addMatch = function (tNodeIdx, matchIdx) {
        if (this.matches === null) {
            this.matches = [tNodeIdx, matchIdx];
        }
        else {
            this.matches.push(tNodeIdx, matchIdx);
        }
    };
    return TQuery_;
}());
/**
 * Iterates over local names for a given node and returns directive index
 * (or -1 if a local name points to an element).
 *
 * @param tNode static data of a node to check
 * @param selector selector to match
 * @returns directive index, -1 or null if a selector didn't match any of the local names
 */
function getIdxOfMatchingSelector(tNode, selector) {
    var localNames = tNode.localNames;
    if (localNames !== null) {
        for (var i = 0; i < localNames.length; i += 2) {
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
        ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
        return createContainerRef(ViewContainerRef, ViewEngine_ElementRef, tNode, lView);
    }
    else {
        ngDevMode &&
            throwError("Special token to read should be one of ElementRef, TemplateRef or ViewContainerRef but got " + stringify(read) + ".");
    }
}
/**
 * A helper function that creates query results for a given view. This function is meant to do the
 * processing once and only once for a given view instance (a set of results for a given view
 * doesn't change).
 */
function materializeViewResults(lView, tQuery, queryIndex) {
    var lQuery = lView[QUERIES].queries[queryIndex];
    if (lQuery.matches === null) {
        var tViewData = lView[TVIEW].data;
        var tQueryMatches = tQuery.matches;
        var result = [];
        for (var i = 0; i < tQueryMatches.length; i += 2) {
            var matchedNodeIdx = tQueryMatches[i];
            if (matchedNodeIdx < 0) {
                // we at the <ng-template> marker which might have results in views created based on this
                // <ng-template> - those results will be in separate views though, so here we just leave
                // null as a placeholder
                result.push(null);
            }
            else {
                ngDevMode && assertDataInRange(tViewData, matchedNodeIdx);
                var tNode = tViewData[matchedNodeIdx];
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
function collectQueryResults(lView, queryIndex, result) {
    var tQuery = lView[TVIEW].queries.getByIndex(queryIndex);
    var tQueryMatches = tQuery.matches;
    if (tQueryMatches !== null) {
        var lViewResults = materializeViewResults(lView, tQuery, queryIndex);
        for (var i = 0; i < tQueryMatches.length; i += 2) {
            var tNodeIdx = tQueryMatches[i];
            if (tNodeIdx > 0) {
                var viewResult = lViewResults[i / 2];
                ngDevMode && assertDefined(viewResult, 'materialized query result should be defined');
                result.push(viewResult);
            }
            else {
                var childQueryIndex = tQueryMatches[i + 1];
                var declarationLContainer = lView[-tNodeIdx];
                ngDevMode && assertLContainer(declarationLContainer);
                // collect matches for views inserted in this container
                for (var i_1 = CONTAINER_HEADER_OFFSET; i_1 < declarationLContainer.length; i_1++) {
                    var embeddedLView = declarationLContainer[i_1];
                    if (embeddedLView[DECLARATION_LCONTAINER] === embeddedLView[PARENT]) {
                        collectQueryResults(embeddedLView, childQueryIndex, result);
                    }
                }
                // collect matches for views created from this declaration container and inserted into
                // different containers
                if (declarationLContainer[MOVED_VIEWS] !== null) {
                    var embeddedLViews = declarationLContainer[MOVED_VIEWS];
                    for (var i_2 = 0; i_2 < embeddedLViews.length; i_2++) {
                        collectQueryResults(embeddedLViews[i_2], childQueryIndex, result);
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
    var lView = getLView();
    var queryIndex = getCurrentQueryIndex();
    setCurrentQueryIndex(queryIndex + 1);
    var tQuery = getTQuery(lView[TVIEW], queryIndex);
    if (queryList.dirty && (isCreationMode(lView) === tQuery.metadata.isStatic)) {
        if (tQuery.matches === null) {
            queryList.reset([]);
        }
        else {
            var result = tQuery.crossesNgTemplate ? collectQueryResults(lView, queryIndex, []) :
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
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 *
 * @codeGenApi
 */
export function ɵɵstaticViewQuery(predicate, descend, read) {
    viewQueryInternal(getLView(), predicate, descend, read, true);
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
    viewQueryInternal(getLView(), predicate, descend, read, false);
}
function viewQueryInternal(lView, predicate, descend, read, isStatic) {
    var tView = lView[TVIEW];
    if (tView.firstCreatePass) {
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
 * @param directiveIndex Current directive index
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 * @returns QueryList<T>
 *
 * @codeGenApi
 */
export function ɵɵcontentQuery(directiveIndex, predicate, descend, read) {
    contentQueryInternal(getLView(), predicate, descend, read, false, getPreviousOrParentTNode(), directiveIndex);
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
    contentQueryInternal(getLView(), predicate, descend, read, true, getPreviousOrParentTNode(), directiveIndex);
}
function contentQueryInternal(lView, predicate, descend, read, isStatic, tNode, directiveIndex) {
    var tView = lView[TVIEW];
    if (tView.firstCreatePass) {
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
function createLQuery(lView) {
    var queryList = new QueryList();
    storeCleanupWithContext(lView, queryList, queryList.destroy);
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
    var tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
    var lastSavedDirectiveIndex = tView.contentQueries.length ? tViewContentQueries[tViewContentQueries.length - 1] : -1;
    if (directiveIndex !== lastSavedDirectiveIndex) {
        tViewContentQueries.push(tView.queries.length - 1, directiveIndex);
    }
}
function getTQuery(tView, index) {
    ngDevMode && assertDefined(tView.queries, 'TQueries must be defined to retrieve a TQuery');
    return tView.queries.getByIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLHVCQUF1QixFQUFjLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hGLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQXFELDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFD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aUI7SUFDN0UsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLElBQUk7UUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7SUFDNUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELFNBQVMsaUNBQWlDLENBQUMsS0FBWSxFQUFFLGNBQXNCO0lBQzdFLElBQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLGNBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDaEYsSUFBTSx1QkFBdUIsR0FDekIsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0YsSUFBSSxjQUFjLEtBQUssdUJBQXVCLEVBQUU7UUFDOUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztLQUN0RTtBQUNILENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFZLEVBQUUsS0FBYTtJQUM1QyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsK0NBQStDLENBQUMsQ0FBQztJQUMzRixPQUFPLEtBQUssQ0FBQyxPQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7YXNzZXJ0Rmlyc3RDcmVhdGVQYXNzLCBhc3NlcnRMQ29udGFpbmVyfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7c3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCBMUXVlcnksIFRRdWVyaWVzLCBUUXVlcnksIFRRdWVyeU1ldGFkYXRhLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtERUNMQVJBVElPTl9MQ09OVEFJTkVSLCBMVmlldywgUEFSRU5ULCBRVUVSSUVTLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldEN1cnJlbnRRdWVyeUluZGV4LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRDdXJyZW50UXVlcnlJbmRleH0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2lzQ3JlYXRpb25Nb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2NyZWF0ZUNvbnRhaW5lclJlZiwgY3JlYXRlRWxlbWVudFJlZiwgY3JlYXRlVGVtcGxhdGVSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNDtcblxuY2xhc3MgTFF1ZXJ5XzxUPiBpbXBsZW1lbnRzIExRdWVyeTxUPiB7XG4gIG1hdGNoZXM6IChUfG51bGwpW118bnVsbCA9IG51bGw7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPikge31cbiAgY2xvbmUoKTogTFF1ZXJ5PFQ+IHsgcmV0dXJuIG5ldyBMUXVlcnlfKHRoaXMucXVlcnlMaXN0KTsgfVxuICBzZXREaXJ0eSgpOiB2b2lkIHsgdGhpcy5xdWVyeUxpc3Quc2V0RGlydHkoKTsgfVxufVxuXG5jbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBxdWVyaWVzOiBMUXVlcnk8YW55PltdID0gW10pIHt9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KHRWaWV3OiBUVmlldyk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHRRdWVyaWVzID0gdFZpZXcucXVlcmllcztcbiAgICBpZiAodFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IG5vT2ZJbmhlcml0ZWRRdWVyaWVzID1cbiAgICAgICAgICB0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCA/IHRWaWV3LmNvbnRlbnRRdWVyaWVzWzBdIDogdFF1ZXJpZXMubGVuZ3RoO1xuICAgICAgY29uc3Qgdmlld0xRdWVyaWVzOiBMUXVlcnk8YW55PltdID0gW107XG5cbiAgICAgIC8vIEFuIGVtYmVkZGVkIHZpZXcgaGFzIHF1ZXJpZXMgcHJvcGFnYXRlZCBmcm9tIGEgZGVjbGFyYXRpb24gdmlldyBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuICAgICAgLy8gVFF1ZXJpZXMgY29sbGVjdGlvbiBhbmQgdXAgdW50aWwgYSBmaXJzdCBjb250ZW50IHF1ZXJ5IGRlY2xhcmVkIGluIHRoZSBlbWJlZGRlZCB2aWV3LiBPbmx5XG4gICAgICAvLyBwcm9wYWdhdGVkIExRdWVyaWVzIGFyZSBjcmVhdGVkIGF0IHRoaXMgcG9pbnQgKExRdWVyeSBjb3JyZXNwb25kaW5nIHRvIGRlY2xhcmVkIGNvbnRlbnRcbiAgICAgIC8vIHF1ZXJpZXMgd2lsbCBiZSBpbnN0YW50aWF0ZWQgZnJvbSB0aGUgY29udGVudCBxdWVyeSBpbnN0cnVjdGlvbnMgZm9yIGVhY2ggZGlyZWN0aXZlKS5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9PZkluaGVyaXRlZFF1ZXJpZXM7IGkrKykge1xuICAgICAgICBjb25zdCB0UXVlcnkgPSB0UXVlcmllcy5nZXRCeUluZGV4KGkpO1xuICAgICAgICBjb25zdCBwYXJlbnRMUXVlcnkgPSB0aGlzLnF1ZXJpZXNbdFF1ZXJ5LmluZGV4SW5EZWNsYXJhdGlvblZpZXddO1xuICAgICAgICB2aWV3TFF1ZXJpZXMucHVzaChwYXJlbnRMUXVlcnkuY2xvbmUoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgTFF1ZXJpZXNfKHZpZXdMUXVlcmllcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KHRWaWV3OiBUVmlldyk6IHZvaWQgeyB0aGlzLmRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3KTsgfVxuXG4gIGRldGFjaFZpZXcodFZpZXc6IFRWaWV3KTogdm9pZCB7IHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpOyB9XG5cbiAgcHJpdmF0ZSBkaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0VmlldzogVFZpZXcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGdldFRRdWVyeSh0VmlldywgaSkubWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnF1ZXJpZXNbaV0uc2V0RGlydHkoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgVFF1ZXJ5TWV0YWRhdGFfIGltcGxlbWVudHMgVFF1ZXJ5TWV0YWRhdGEge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBwcmVkaWNhdGU6IFR5cGU8YW55PnxzdHJpbmdbXSwgcHVibGljIGRlc2NlbmRhbnRzOiBib29sZWFuLCBwdWJsaWMgaXNTdGF0aWM6IGJvb2xlYW4sXG4gICAgICBwdWJsaWMgcmVhZDogYW55ID0gbnVsbCkge31cbn1cblxuY2xhc3MgVFF1ZXJpZXNfIGltcGxlbWVudHMgVFF1ZXJpZXMge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHF1ZXJpZXM6IFRRdWVyeVtdID0gW10pIHt9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnF1ZXJpZXNbaV0uZWxlbWVudEVuZCh0Tm9kZSk7XG4gICAgfVxuICB9XG4gIGVtYmVkZGVkVFZpZXcodE5vZGU6IFROb2RlKTogVFF1ZXJpZXN8bnVsbCB7XG4gICAgbGV0IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZjogVFF1ZXJ5W118bnVsbCA9IG51bGw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNoaWxkUXVlcnlJbmRleCA9IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5sZW5ndGggOiAwO1xuICAgICAgY29uc3QgdHF1ZXJ5Q2xvbmUgPSB0aGlzLmdldEJ5SW5kZXgoaSkuZW1iZWRkZWRUVmlldyh0Tm9kZSwgY2hpbGRRdWVyeUluZGV4KTtcblxuICAgICAgaWYgKHRxdWVyeUNsb25lKSB7XG4gICAgICAgIHRxdWVyeUNsb25lLmluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSBpO1xuICAgICAgICBpZiAocXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsKSB7XG4gICAgICAgICAgcXVlcmllc0ZvclRlbXBsYXRlUmVmLnB1c2godHF1ZXJ5Q2xvbmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiA9IFt0cXVlcnlDbG9uZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsID8gbmV3IFRRdWVyaWVzXyhxdWVyaWVzRm9yVGVtcGxhdGVSZWYpIDogbnVsbDtcbiAgfVxuXG4gIHRlbXBsYXRlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgICAgICAgICAgICAgICAgIHRWaWV3LCAnUXVlcmllcyBzaG91bGQgY29sbGVjdCByZXN1bHRzIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLnRlbXBsYXRlKHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0QnlJbmRleChpbmRleDogbnVtYmVyKTogVFF1ZXJ5IHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UodGhpcy5xdWVyaWVzLCBpbmRleCk7XG4gICAgcmV0dXJuIHRoaXMucXVlcmllc1tpbmRleF07XG4gIH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLnF1ZXJpZXMubGVuZ3RoOyB9XG5cbiAgdHJhY2sodHF1ZXJ5OiBUUXVlcnkpOiB2b2lkIHsgdGhpcy5xdWVyaWVzLnB1c2godHF1ZXJ5KTsgfVxufVxuXG5jbGFzcyBUUXVlcnlfIGltcGxlbWVudHMgVFF1ZXJ5IHtcbiAgbWF0Y2hlczogbnVtYmVyW118bnVsbCA9IG51bGw7XG4gIGluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSAtMTtcbiAgY3Jvc3Nlc05nVGVtcGxhdGUgPSBmYWxzZTtcblxuICAvKipcbiAgICogQSBub2RlIGluZGV4IG9uIHdoaWNoIGEgcXVlcnkgd2FzIGRlY2xhcmVkICgtMSBmb3IgdmlldyBxdWVyaWVzIGFuZCBvbmVzIGluaGVyaXRlZCBmcm9tIHRoZVxuICAgKiBkZWNsYXJhdGlvbiB0ZW1wbGF0ZSkuIFdlIHVzZSB0aGlzIGluZGV4IChhbG9uZ3NpZGUgd2l0aCBfYXBwbGllc1RvTmV4dE5vZGUgZmxhZykgdG8ga25vd1xuICAgKiB3aGVuIHRvIGFwcGx5IGNvbnRlbnQgcXVlcmllcyB0byBlbGVtZW50cyBpbiBhIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZGVjbGFyYXRpb25Ob2RlSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQSBmbGFnIGluZGljYXRpbmcgaWYgYSBnaXZlbiBxdWVyeSBzdGlsbCBhcHBsaWVzIHRvIG5vZGVzIGl0IGlzIGNyb3NzaW5nLiBXZSB1c2UgdGhpcyBmbGFnXG4gICAqIChhbG9uZ3NpZGUgd2l0aCBfZGVjbGFyYXRpb25Ob2RlSW5kZXgpIHRvIGtub3cgd2hlbiB0byBzdG9wIGFwcGx5aW5nIGNvbnRlbnQgcXVlcmllcyB0b1xuICAgKiBlbGVtZW50cyBpbiBhIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbGllc1RvTmV4dE5vZGUgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBtZXRhZGF0YTogVFF1ZXJ5TWV0YWRhdGEsIG5vZGVJbmRleDogbnVtYmVyID0gLTEpIHtcbiAgICB0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9IG5vZGVJbmRleDtcbiAgfVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzQXBwbHlpbmdUb05vZGUodE5vZGUpKSB7XG4gICAgICB0aGlzLm1hdGNoVE5vZGUodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cblxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9PT0gdE5vZGUuaW5kZXgpIHtcbiAgICAgIHRoaXMuX2FwcGxpZXNUb05leHROb2RlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgdGVtcGxhdGUodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHsgdGhpcy5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTsgfVxuXG4gIGVtYmVkZGVkVFZpZXcodE5vZGU6IFROb2RlLCBjaGlsZFF1ZXJ5SW5kZXg6IG51bWJlcik6IFRRdWVyeXxudWxsIHtcbiAgICBpZiAodGhpcy5pc0FwcGx5aW5nVG9Ob2RlKHROb2RlKSkge1xuICAgICAgdGhpcy5jcm9zc2VzTmdUZW1wbGF0ZSA9IHRydWU7XG4gICAgICAvLyBBIG1hcmtlciBpbmRpY2F0aW5nIGEgYDxuZy10ZW1wbGF0ZT5gIGVsZW1lbnQgKGEgcGxhY2Vob2xkZXIgZm9yIHF1ZXJ5IHJlc3VsdHMgZnJvbVxuICAgICAgLy8gZW1iZWRkZWQgdmlld3MgY3JlYXRlZCBiYXNlZCBvbiB0aGlzIGA8bmctdGVtcGxhdGU+YCkuXG4gICAgICB0aGlzLmFkZE1hdGNoKC10Tm9kZS5pbmRleCwgY2hpbGRRdWVyeUluZGV4KTtcbiAgICAgIHJldHVybiBuZXcgVFF1ZXJ5Xyh0aGlzLm1ldGFkYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGlzQXBwbHlpbmdUb05vZGUodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX2FwcGxpZXNUb05leHROb2RlICYmIHRoaXMubWV0YWRhdGEuZGVzY2VuZGFudHMgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZGVjbGFyYXRpb25Ob2RlSW5kZXggPT09ICh0Tm9kZS5wYXJlbnQgPyB0Tm9kZS5wYXJlbnQuaW5kZXggOiAtMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZTtcbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hUTm9kZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMubWV0YWRhdGEucHJlZGljYXRlKSkge1xuICAgICAgY29uc3QgbG9jYWxOYW1lcyA9IHRoaXMubWV0YWRhdGEucHJlZGljYXRlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3LCB0Tm9kZSwgZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBsb2NhbE5hbWVzW2ldKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHR5cGVQcmVkaWNhdGUgPSB0aGlzLm1ldGFkYXRhLnByZWRpY2F0ZSBhcyBhbnk7XG4gICAgICBpZiAodHlwZVByZWRpY2F0ZSA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3LCB0Tm9kZSwgLTEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbihcbiAgICAgICAgICAgIHRWaWV3LCB0Tm9kZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHR5cGVQcmVkaWNhdGUsIGZhbHNlLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBub2RlTWF0Y2hJZHg6IG51bWJlcnxudWxsKTogdm9pZCB7XG4gICAgaWYgKG5vZGVNYXRjaElkeCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgcmVhZCA9IHRoaXMubWV0YWRhdGEucmVhZDtcbiAgICAgIGlmIChyZWFkICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChyZWFkID09PSBWaWV3RW5naW5lX0VsZW1lbnRSZWYgfHwgcmVhZCA9PT0gVmlld0NvbnRhaW5lclJlZiB8fFxuICAgICAgICAgICAgcmVhZCA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiAmJiB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgLTIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHggPVxuICAgICAgICAgICAgICBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgcmVhZCwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICBpZiAoZGlyZWN0aXZlT3JQcm92aWRlcklkeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgZGlyZWN0aXZlT3JQcm92aWRlcklkeCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCBub2RlTWF0Y2hJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkTWF0Y2godE5vZGVJZHg6IG51bWJlciwgbWF0Y2hJZHg6IG51bWJlcikge1xuICAgIGlmICh0aGlzLm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMubWF0Y2hlcyA9IFt0Tm9kZUlkeCwgbWF0Y2hJZHhdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1hdGNoZXMucHVzaCh0Tm9kZUlkeCwgbWF0Y2hJZHgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgbG9jYWwgbmFtZXMgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgcmV0dXJucyBkaXJlY3RpdmUgaW5kZXhcbiAqIChvciAtMSBpZiBhIGxvY2FsIG5hbWUgcG9pbnRzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBzdGF0aWMgZGF0YSBvZiBhIG5vZGUgdG8gY2hlY2tcbiAqIEBwYXJhbSBzZWxlY3RvciBzZWxlY3RvciB0byBtYXRjaFxuICogQHJldHVybnMgZGlyZWN0aXZlIGluZGV4LCAtMSBvciBudWxsIGlmIGEgc2VsZWN0b3IgZGlkbid0IG1hdGNoIGFueSBvZiB0aGUgbG9jYWwgbmFtZXNcbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAobG9jYWxOYW1lc1tpXSA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVzdWx0QnlUTm9kZVR5cGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZihWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVzdWx0Rm9yTm9kZShsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgbWF0Y2hpbmdJZHg6IG51bWJlciwgcmVhZDogYW55KTogYW55IHtcbiAgaWYgKG1hdGNoaW5nSWR4ID09PSAtMSkge1xuICAgIC8vIGlmIHJlYWQgdG9rZW4gYW5kIC8gb3Igc3RyYXRlZ3kgaXMgbm90IHNwZWNpZmllZCwgZGV0ZWN0IGl0IHVzaW5nIGFwcHJvcHJpYXRlIHROb2RlIHR5cGVcbiAgICByZXR1cm4gY3JlYXRlUmVzdWx0QnlUTm9kZVR5cGUodE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChtYXRjaGluZ0lkeCA9PT0gLTIpIHtcbiAgICAvLyByZWFkIGEgc3BlY2lhbCB0b2tlbiBmcm9tIGEgbm9kZSBpbmplY3RvclxuICAgIHJldHVybiBjcmVhdGVTcGVjaWFsVG9rZW4obFZpZXcsIHROb2RlLCByZWFkKTtcbiAgfSBlbHNlIHtcbiAgICAvLyByZWFkIGEgdG9rZW5cbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIGxWaWV3W1RWSUVXXSwgbWF0Y2hpbmdJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU3BlY2lhbFRva2VuKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCByZWFkOiBhbnkpOiBhbnkge1xuICBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9FbGVtZW50UmVmKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICAgIHJldHVybiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgICAgIFZpZXdDb250YWluZXJSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgdGhyb3dFcnJvcihcbiAgICAgICAgICAgIGBTcGVjaWFsIHRva2VuIHRvIHJlYWQgc2hvdWxkIGJlIG9uZSBvZiBFbGVtZW50UmVmLCBUZW1wbGF0ZVJlZiBvciBWaWV3Q29udGFpbmVyUmVmIGJ1dCBnb3QgJHtzdHJpbmdpZnkocmVhZCl9LmApO1xuICB9XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIHF1ZXJ5IHJlc3VsdHMgZm9yIGEgZ2l2ZW4gdmlldy4gVGhpcyBmdW5jdGlvbiBpcyBtZWFudCB0byBkbyB0aGVcbiAqIHByb2Nlc3Npbmcgb25jZSBhbmQgb25seSBvbmNlIGZvciBhIGdpdmVuIHZpZXcgaW5zdGFuY2UgKGEgc2V0IG9mIHJlc3VsdHMgZm9yIGEgZ2l2ZW4gdmlld1xuICogZG9lc24ndCBjaGFuZ2UpLlxuICovXG5mdW5jdGlvbiBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzPFQ+KGxWaWV3OiBMVmlldywgdFF1ZXJ5OiBUUXVlcnksIHF1ZXJ5SW5kZXg6IG51bWJlcik6IChUIHwgbnVsbClbXSB7XG4gIGNvbnN0IGxRdWVyeSA9IGxWaWV3W1FVRVJJRVNdICEucXVlcmllcyAhW3F1ZXJ5SW5kZXhdO1xuICBpZiAobFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICBjb25zdCB0Vmlld0RhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICBjb25zdCB0UXVlcnlNYXRjaGVzID0gdFF1ZXJ5Lm1hdGNoZXMgITtcbiAgICBjb25zdCByZXN1bHQ6IFR8bnVsbFtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0UXVlcnlNYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBtYXRjaGVkTm9kZUlkeCA9IHRRdWVyeU1hdGNoZXNbaV07XG4gICAgICBpZiAobWF0Y2hlZE5vZGVJZHggPCAwKSB7XG4gICAgICAgIC8vIHdlIGF0IHRoZSA8bmctdGVtcGxhdGU+IG1hcmtlciB3aGljaCBtaWdodCBoYXZlIHJlc3VsdHMgaW4gdmlld3MgY3JlYXRlZCBiYXNlZCBvbiB0aGlzXG4gICAgICAgIC8vIDxuZy10ZW1wbGF0ZT4gLSB0aG9zZSByZXN1bHRzIHdpbGwgYmUgaW4gc2VwYXJhdGUgdmlld3MgdGhvdWdoLCBzbyBoZXJlIHdlIGp1c3QgbGVhdmVcbiAgICAgICAgLy8gbnVsbCBhcyBhIHBsYWNlaG9sZGVyXG4gICAgICAgIHJlc3VsdC5wdXNoKG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHRWaWV3RGF0YSwgbWF0Y2hlZE5vZGVJZHgpO1xuICAgICAgICBjb25zdCB0Tm9kZSA9IHRWaWV3RGF0YVttYXRjaGVkTm9kZUlkeF0gYXMgVE5vZGU7XG4gICAgICAgIHJlc3VsdC5wdXNoKGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXcsIHROb2RlLCB0UXVlcnlNYXRjaGVzW2kgKyAxXSwgdFF1ZXJ5Lm1ldGFkYXRhLnJlYWQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbFF1ZXJ5Lm1hdGNoZXMgPSByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbFF1ZXJ5Lm1hdGNoZXM7XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCBjb2xsZWN0cyAoYWxyZWFkeSBtYXRlcmlhbGl6ZWQpIHF1ZXJ5IHJlc3VsdHMgZnJvbSBhIHRyZWUgb2Ygdmlld3MsXG4gKiBzdGFydGluZyB3aXRoIGEgcHJvdmlkZWQgTFZpZXcuXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RRdWVyeVJlc3VsdHM8VD4obFZpZXc6IExWaWV3LCBxdWVyeUluZGV4OiBudW1iZXIsIHJlc3VsdDogVFtdKTogVFtdIHtcbiAgY29uc3QgdFF1ZXJ5ID0gbFZpZXdbVFZJRVddLnF1ZXJpZXMgIS5nZXRCeUluZGV4KHF1ZXJ5SW5kZXgpO1xuICBjb25zdCB0UXVlcnlNYXRjaGVzID0gdFF1ZXJ5Lm1hdGNoZXM7XG4gIGlmICh0UXVlcnlNYXRjaGVzICE9PSBudWxsKSB7XG4gICAgY29uc3QgbFZpZXdSZXN1bHRzID0gbWF0ZXJpYWxpemVWaWV3UmVzdWx0czxUPihsVmlldywgdFF1ZXJ5LCBxdWVyeUluZGV4KTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFF1ZXJ5TWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgdE5vZGVJZHggPSB0UXVlcnlNYXRjaGVzW2ldO1xuICAgICAgaWYgKHROb2RlSWR4ID4gMCkge1xuICAgICAgICBjb25zdCB2aWV3UmVzdWx0ID0gbFZpZXdSZXN1bHRzW2kgLyAyXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld1Jlc3VsdCwgJ21hdGVyaWFsaXplZCBxdWVyeSByZXN1bHQgc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICAgICAgcmVzdWx0LnB1c2godmlld1Jlc3VsdCBhcyBUKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNoaWxkUXVlcnlJbmRleCA9IHRRdWVyeU1hdGNoZXNbaSArIDFdO1xuXG4gICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IGxWaWV3Wy10Tm9kZUlkeF0gYXMgTENvbnRhaW5lcjtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25MQ29udGFpbmVyKTtcblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGluc2VydGVkIGluIHRoaXMgY29udGFpbmVyXG4gICAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGRlY2xhcmF0aW9uTENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBkZWNsYXJhdGlvbkxDb250YWluZXJbaV07XG4gICAgICAgICAgaWYgKGVtYmVkZGVkTFZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl0gPT09IGVtYmVkZGVkTFZpZXdbUEFSRU5UXSkge1xuICAgICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyhlbWJlZGRlZExWaWV3LCBjaGlsZFF1ZXJ5SW5kZXgsIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBjcmVhdGVkIGZyb20gdGhpcyBkZWNsYXJhdGlvbiBjb250YWluZXIgYW5kIGluc2VydGVkIGludG9cbiAgICAgICAgLy8gZGlmZmVyZW50IGNvbnRhaW5lcnNcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lcltNT1ZFRF9WSUVXU10gIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3cyA9IGRlY2xhcmF0aW9uTENvbnRhaW5lcltNT1ZFRF9WSUVXU10gITtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVtYmVkZGVkTFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb2xsZWN0UXVlcnlSZXN1bHRzKGVtYmVkZGVkTFZpZXdzW2ldLCBjaGlsZFF1ZXJ5SW5kZXgsIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIGEgcXVlcnkgYnkgY29tYmluaW5nIG1hdGNoZXMgZnJvbSBhbGwgYWN0aXZlIHZpZXdzIGFuZCByZW1vdmluZyBtYXRjaGVzIGZyb20gZGVsZXRlZFxuICogdmlld3MuXG4gKlxuICogQHJldHVybnMgYHRydWVgIGlmIGEgcXVlcnkgZ290IGRpcnR5IGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9yIGlmIHRoaXMgaXMgYSBzdGF0aWMgcXVlcnlcbiAqIHJlc29sdmluZyBpbiBjcmVhdGlvbiBtb2RlLCBgZmFsc2VgIG90aGVyd2lzZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXF1ZXJ5UmVmcmVzaChxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxhbnk+KTogYm9vbGVhbiB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgcXVlcnlJbmRleCA9IGdldEN1cnJlbnRRdWVyeUluZGV4KCk7XG5cbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlJbmRleCArIDEpO1xuXG4gIGNvbnN0IHRRdWVyeSA9IGdldFRRdWVyeShsVmlld1tUVklFV10sIHF1ZXJ5SW5kZXgpO1xuICBpZiAocXVlcnlMaXN0LmRpcnR5ICYmIChpc0NyZWF0aW9uTW9kZShsVmlldykgPT09IHRRdWVyeS5tZXRhZGF0YS5pc1N0YXRpYykpIHtcbiAgICBpZiAodFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgIHF1ZXJ5TGlzdC5yZXNldChbXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRRdWVyeS5jcm9zc2VzTmdUZW1wbGF0ZSA/IGNvbGxlY3RRdWVyeVJlc3VsdHMobFZpZXcsIHF1ZXJ5SW5kZXgsIFtdKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzKGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuICAgICAgcXVlcnlMaXN0LnJlc2V0KHJlc3VsdCk7XG4gICAgICBxdWVyeUxpc3Qubm90aWZ5T25DaGFuZ2VzKCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCBmb3IgYSBzdGF0aWMgdmlldyBxdWVyeS5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3RhdGljVmlld1F1ZXJ5PFQ+KFxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICB2aWV3UXVlcnlJbnRlcm5hbChnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCwgc3RvcmVzIHRoZSByZWZlcmVuY2UgaW4gTFZpZXcgYW5kIHJldHVybnMgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV2aWV3UXVlcnk8VD4ocHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkPzogYW55KTogdm9pZCB7XG4gIHZpZXdRdWVyeUludGVybmFsKGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiB2aWV3UXVlcnlJbnRlcm5hbDxUPihcbiAgICBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55LFxuICAgIGlzU3RhdGljOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZGVzY2VuZCwgaXNTdGF0aWMsIHJlYWQpLCAtMSk7XG4gICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNWaWV3UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG4gIGNyZWF0ZUxRdWVyeTxUPihsVmlldyk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICBjb250ZW50UXVlcnlJbnRlcm5hbChcbiAgICAgIGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgZmFsc2UsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBzdGF0aWMgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2hcbiAqIChwYXJ0IG9mIGEgdmlldyByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY0NvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRlbnRRdWVyeUludGVybmFsPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnksIGlzU3RhdGljOiBib29sZWFuLFxuICAgIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGNyZWF0ZVRRdWVyeSh0VmlldywgbmV3IFRRdWVyeU1ldGFkYXRhXyhwcmVkaWNhdGUsIGRlc2NlbmQsIGlzU3RhdGljLCByZWFkKSwgdE5vZGUuaW5kZXgpO1xuICAgIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldywgZGlyZWN0aXZlSW5kZXgpO1xuICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgdFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUxRdWVyeTxUPihsVmlldyk7XG59XG5cbi8qKlxuICogTG9hZHMgYSBRdWVyeUxpc3QgY29ycmVzcG9uZGluZyB0byB0aGUgY3VycmVudCB2aWV3IG9yIGNvbnRlbnQgcXVlcnkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVsb2FkUXVlcnk8VD4oKTogUXVlcnlMaXN0PFQ+IHtcbiAgcmV0dXJuIGxvYWRRdWVyeUludGVybmFsPFQ+KGdldExWaWV3KCksIGdldEN1cnJlbnRRdWVyeUluZGV4KCkpO1xufVxuXG5mdW5jdGlvbiBsb2FkUXVlcnlJbnRlcm5hbDxUPihsVmlldzogTFZpZXcsIHF1ZXJ5SW5kZXg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChsVmlld1tRVUVSSUVTXSwgJ0xRdWVyaWVzIHNob3VsZCBiZSBkZWZpbmVkIHdoZW4gdHJ5aW5nIHRvIGxvYWQgYSBxdWVyeScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXdbUVVFUklFU10gIS5xdWVyaWVzLCBxdWVyeUluZGV4KTtcbiAgcmV0dXJuIGxWaWV3W1FVRVJJRVNdICEucXVlcmllc1txdWVyeUluZGV4XS5xdWVyeUxpc3Q7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxRdWVyeTxUPihsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChsVmlldywgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG5cbiAgaWYgKGxWaWV3W1FVRVJJRVNdID09PSBudWxsKSBsVmlld1tRVUVSSUVTXSA9IG5ldyBMUXVlcmllc18oKTtcbiAgbFZpZXdbUVVFUklFU10gIS5xdWVyaWVzLnB1c2gobmV3IExRdWVyeV8ocXVlcnlMaXN0KSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRRdWVyeSh0VmlldzogVFZpZXcsIG1ldGFkYXRhOiBUUXVlcnlNZXRhZGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LnF1ZXJpZXMgPT09IG51bGwpIHRWaWV3LnF1ZXJpZXMgPSBuZXcgVFF1ZXJpZXNfKCk7XG4gIHRWaWV3LnF1ZXJpZXMudHJhY2sobmV3IFRRdWVyeV8obWV0YWRhdGEsIG5vZGVJbmRleCkpO1xufVxuXG5mdW5jdGlvbiBzYXZlQ29udGVudFF1ZXJ5QW5kRGlyZWN0aXZlSW5kZXgodFZpZXc6IFRWaWV3LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHRWaWV3Q29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcyB8fCAodFZpZXcuY29udGVudFF1ZXJpZXMgPSBbXSk7XG4gIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCA/IHRWaWV3Q29udGVudFF1ZXJpZXNbdFZpZXdDb250ZW50UXVlcmllcy5sZW5ndGggLSAxXSA6IC0xO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKHRWaWV3LnF1ZXJpZXMgIS5sZW5ndGggLSAxLCBkaXJlY3RpdmVJbmRleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0VFF1ZXJ5KHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlcik6IFRRdWVyeSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LnF1ZXJpZXMsICdUUXVlcmllcyBtdXN0IGJlIGRlZmluZWQgdG8gcmV0cmlldmUgYSBUUXVlcnknKTtcbiAgcmV0dXJuIHRWaWV3LnF1ZXJpZXMgIS5nZXRCeUluZGV4KGluZGV4KTtcbn1cbiJdfQ==