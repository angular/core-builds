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
        return getNodeInjectable(lView[TVIEW].data, lView, matchingIdx, tNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLHVCQUF1QixFQUFjLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hGLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQXFELDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hJLE9BQU8sRUFBQyxzQkFBc0IsRUFBUyxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQy9GLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLG9CQUFvQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUVwRyxJQUFNLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUV0RTtJQUVFLGlCQUFtQixTQUF1QjtRQUF2QixjQUFTLEdBQVQsU0FBUyxDQUFjO1FBRDFDLFlBQU8sR0FBb0IsSUFBSSxDQUFDO0lBQ2EsQ0FBQztJQUM5Qyx1QkFBSyxHQUFMLGNBQXFCLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRCwwQkFBUSxHQUFSLGNBQW1CLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pELGNBQUM7QUFBRCxDQUFDLEFBTEQsSUFLQztBQUVEO0lBQ0UsbUJBQW1CLE9BQTJCO1FBQTNCLHdCQUFBLEVBQUEsWUFBMkI7UUFBM0IsWUFBTyxHQUFQLE9BQU8sQ0FBb0I7SUFBRyxDQUFDO0lBRWxELHNDQUFrQixHQUFsQixVQUFtQixLQUFZO1FBQzdCLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDL0IsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO1lBQ3JCLElBQU0sb0JBQW9CLEdBQ3RCLEtBQUssQ0FBQyxjQUFjLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQzlFLElBQU0sWUFBWSxHQUFrQixFQUFFLENBQUM7WUFFdkMsMEZBQTBGO1lBQzFGLDZGQUE2RjtZQUM3RiwwRkFBMEY7WUFDMUYsd0ZBQXdGO1lBQ3hGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsSUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDakUsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzthQUN6QztZQUVELE9BQU8sSUFBSSxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDcEM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCw4QkFBVSxHQUFWLFVBQVcsS0FBWSxJQUFVLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdkUsOEJBQVUsR0FBVixVQUFXLEtBQVksSUFBVSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRS9ELDJDQUF1QixHQUEvQixVQUFnQyxLQUFZO1FBQzFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM1QyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtnQkFDeEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzthQUM1QjtTQUNGO0lBQ0gsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQXJDRCxJQXFDQztBQUVEO0lBQ0UseUJBQ1csU0FBNkIsRUFBUyxXQUFvQixFQUFTLFFBQWlCLEVBQ3BGLElBQWdCO1FBQWhCLHFCQUFBLEVBQUEsV0FBZ0I7UUFEaEIsY0FBUyxHQUFULFNBQVMsQ0FBb0I7UUFBUyxnQkFBVyxHQUFYLFdBQVcsQ0FBUztRQUFTLGFBQVEsR0FBUixRQUFRLENBQVM7UUFDcEYsU0FBSSxHQUFKLElBQUksQ0FBWTtJQUFHLENBQUM7SUFDakMsc0JBQUM7QUFBRCxDQUFDLEFBSkQsSUFJQztBQUVEO0lBQ0UsbUJBQW9CLE9BQXNCO1FBQXRCLHdCQUFBLEVBQUEsWUFBc0I7UUFBdEIsWUFBTyxHQUFQLE9BQU8sQ0FBZTtJQUFHLENBQUM7SUFFOUMsZ0NBQVksR0FBWixVQUFhLEtBQVksRUFBRSxLQUFZO1FBQ3JDLFNBQVMsSUFBSSxxQkFBcUIsQ0FDakIsS0FBSyxFQUFFLGdFQUFnRSxDQUFDLENBQUM7UUFDMUYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM1QztJQUNILENBQUM7SUFDRCw4QkFBVSxHQUFWLFVBQVcsS0FBWTtRQUNyQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbkM7SUFDSCxDQUFDO0lBQ0QsaUNBQWEsR0FBYixVQUFjLEtBQVk7UUFDeEIsSUFBSSxxQkFBcUIsR0FBa0IsSUFBSSxDQUFDO1FBRWhELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3BDLElBQU0sZUFBZSxHQUFHLHFCQUFxQixLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUYsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBRTdFLElBQUksV0FBVyxFQUFFO2dCQUNmLFdBQVcsQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUkscUJBQXFCLEtBQUssSUFBSSxFQUFFO29CQUNsQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQ3pDO3FCQUFNO29CQUNMLHFCQUFxQixHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQ3ZDO2FBQ0Y7U0FDRjtRQUVELE9BQU8scUJBQXFCLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDdEYsQ0FBQztJQUVELDRCQUFRLEdBQVIsVUFBUyxLQUFZLEVBQUUsS0FBWTtRQUNqQyxTQUFTLElBQUkscUJBQXFCLENBQ2pCLEtBQUssRUFBRSxnRUFBZ0UsQ0FBQyxDQUFDO1FBQzFGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM1QyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDeEM7SUFDSCxDQUFDO0lBRUQsOEJBQVUsR0FBVixVQUFXLEtBQWE7UUFDdEIsU0FBUyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRCxzQkFBSSw2QkFBTTthQUFWLGNBQXVCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUVwRCx5QkFBSyxHQUFMLFVBQU0sTUFBYyxJQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RCxnQkFBQztBQUFELENBQUMsQUFuREQsSUFtREM7QUFFRDtJQW1CRSxpQkFBbUIsUUFBd0IsRUFBRSxTQUFzQjtRQUF0QiwwQkFBQSxFQUFBLGFBQXFCLENBQUM7UUFBaEQsYUFBUSxHQUFSLFFBQVEsQ0FBZ0I7UUFsQjNDLFlBQU8sR0FBa0IsSUFBSSxDQUFDO1FBQzlCLDJCQUFzQixHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzVCLHNCQUFpQixHQUFHLEtBQUssQ0FBQztRQVMxQjs7OztXQUlHO1FBQ0ssdUJBQWtCLEdBQUcsSUFBSSxDQUFDO1FBR2hDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUM7SUFDekMsQ0FBQztJQUVELDhCQUFZLEdBQVosVUFBYSxLQUFZLEVBQUUsS0FBWTtRQUNyQyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNoQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUMvQjtJQUNILENBQUM7SUFFRCw0QkFBVSxHQUFWLFVBQVcsS0FBWTtRQUNyQixJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxLQUFLLENBQUMsS0FBSyxFQUFFO1lBQzlDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7U0FDakM7SUFDSCxDQUFDO0lBRUQsMEJBQVEsR0FBUixVQUFTLEtBQVksRUFBRSxLQUFZLElBQVUsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRS9FLCtCQUFhLEdBQWIsVUFBYyxLQUFZLEVBQUUsZUFBdUI7UUFDakQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDaEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUM5QixzRkFBc0Y7WUFDdEYseURBQXlEO1lBQ3pELElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzdDLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ25DO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU8sa0NBQWdCLEdBQXhCLFVBQXlCLEtBQVk7UUFDbkMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEtBQUssS0FBSyxFQUFFO1lBQ2xFLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDaEY7UUFDRCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztJQUNqQyxDQUFDO0lBRU8sNEJBQVUsR0FBbEIsVUFBbUIsS0FBWSxFQUFFLEtBQVk7UUFDM0MsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDMUMsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFDM0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzdGO1NBQ0Y7YUFBTTtZQUNMLElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBZ0IsQ0FBQztZQUNyRCxJQUFJLGFBQWEsS0FBSyxzQkFBc0IsRUFBRTtnQkFDNUMsSUFBSSxLQUFLLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtvQkFDdEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDakQ7YUFDRjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsd0JBQXdCLENBQ3pCLEtBQUssRUFBRSxLQUFLLEVBQUUseUJBQXlCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDekY7U0FDRjtJQUNILENBQUM7SUFFTywwQ0FBd0IsR0FBaEMsVUFBaUMsS0FBWSxFQUFFLEtBQVksRUFBRSxZQUF5QjtRQUNwRixJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7WUFDekIsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDaEMsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO2dCQUNqQixJQUFJLElBQUksS0FBSyxxQkFBcUIsSUFBSSxJQUFJLEtBQUssZ0JBQWdCO29CQUMzRCxJQUFJLEtBQUssc0JBQXNCLElBQUksS0FBSyxDQUFDLElBQUksc0JBQXdCLEVBQUU7b0JBQ3pFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNoQztxQkFBTTtvQkFDTCxJQUFNLHNCQUFzQixHQUN4Qix5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2hFLElBQUksc0JBQXNCLEtBQUssSUFBSSxFQUFFO3dCQUNuQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztxQkFDcEQ7aUJBQ0Y7YUFDRjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDMUM7U0FDRjtJQUNILENBQUM7SUFFTywwQkFBUSxHQUFoQixVQUFpQixRQUFnQixFQUFFLFFBQWdCO1FBQ2pELElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7WUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNyQzthQUFNO1lBQ0wsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3ZDO0lBQ0gsQ0FBQztJQUNILGNBQUM7QUFBRCxDQUFDLEFBckdELElBcUdDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILFNBQVMsd0JBQXdCLENBQUMsS0FBWSxFQUFFLFFBQWdCO0lBQzlELElBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7SUFDcEMsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1FBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0MsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUM5QixPQUFPLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFXLENBQUM7YUFDcEM7U0FDRjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBR0QsU0FBUyx1QkFBdUIsQ0FBQyxLQUFZLEVBQUUsV0FBa0I7SUFDL0QsSUFBSSxLQUFLLENBQUMsSUFBSSxvQkFBc0IsSUFBSSxLQUFLLENBQUMsSUFBSSw2QkFBK0IsRUFBRTtRQUNqRixPQUFPLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztLQUNwRTtTQUFNLElBQUksS0FBSyxDQUFDLElBQUksc0JBQXdCLEVBQUU7UUFDN0MsT0FBTyxpQkFBaUIsQ0FBQyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDN0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFHRCxTQUFTLG1CQUFtQixDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsV0FBbUIsRUFBRSxJQUFTO0lBQ3JGLElBQUksV0FBVyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ3RCLDJGQUEyRjtRQUMzRixPQUFPLHVCQUF1QixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM5QztTQUFNLElBQUksV0FBVyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQzdCLDRDQUE0QztRQUM1QyxPQUFPLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDL0M7U0FBTTtRQUNMLGVBQWU7UUFDZixPQUFPLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxLQUFxQixDQUFDLENBQUM7S0FDeEY7QUFDSCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLElBQVM7SUFDL0QsSUFBSSxJQUFJLEtBQUsscUJBQXFCLEVBQUU7UUFDbEMsT0FBTyxnQkFBZ0IsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUQ7U0FBTSxJQUFJLElBQUksS0FBSyxzQkFBc0IsRUFBRTtRQUMxQyxPQUFPLGlCQUFpQixDQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztLQUN2RjtTQUFNLElBQUksSUFBSSxLQUFLLGdCQUFnQixFQUFFO1FBQ3BDLFNBQVMsSUFBSSx5QkFBeUIsQ0FDckIsS0FBSywrREFBcUUsQ0FBQztRQUM1RixPQUFPLGtCQUFrQixDQUNyQixnQkFBZ0IsRUFBRSxxQkFBcUIsRUFDdkMsS0FBOEQsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM1RTtTQUFNO1FBQ0wsU0FBUztZQUNMLFVBQVUsQ0FDTixnR0FBOEYsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFHLENBQUMsQ0FBQztLQUMzSDtBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBSSxLQUFZLEVBQUUsTUFBYyxFQUFFLFVBQWtCO0lBQ2pGLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUcsQ0FBQyxPQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdEQsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtRQUMzQixJQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BDLElBQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxPQUFTLENBQUM7UUFDdkMsSUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDaEQsSUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtnQkFDdEIseUZBQXlGO2dCQUN6Rix3RkFBd0Y7Z0JBQ3hGLHdCQUF3QjtnQkFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNuQjtpQkFBTTtnQkFDTCxTQUFTLElBQUksaUJBQWlCLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUMxRCxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsY0FBYyxDQUFVLENBQUM7Z0JBQ2pELE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUM1RjtTQUNGO1FBQ0QsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7S0FDekI7SUFFRCxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDeEIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsbUJBQW1CLENBQUksS0FBWSxFQUFFLFVBQWtCLEVBQUUsTUFBVztJQUMzRSxJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBUyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUM3RCxJQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0lBQ3JDLElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtRQUMxQixJQUFNLFlBQVksR0FBRyxzQkFBc0IsQ0FBSSxLQUFLLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRTFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDaEQsSUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRTtnQkFDaEIsSUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdkMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxVQUFVLEVBQUUsNkNBQTZDLENBQUMsQ0FBQztnQkFDdEYsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFlLENBQUMsQ0FBQzthQUM5QjtpQkFBTTtnQkFDTCxJQUFNLGVBQWUsR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUU3QyxJQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBZSxDQUFDO2dCQUM3RCxTQUFTLElBQUksZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFFckQsdURBQXVEO2dCQUN2RCxLQUFLLElBQUksR0FBQyxHQUFHLHVCQUF1QixFQUFFLEdBQUMsR0FBRyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsR0FBQyxFQUFFLEVBQUU7b0JBQzNFLElBQU0sYUFBYSxHQUFHLHFCQUFxQixDQUFDLEdBQUMsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDbkUsbUJBQW1CLENBQUMsYUFBYSxFQUFFLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQztxQkFDN0Q7aUJBQ0Y7Z0JBRUQsc0ZBQXNGO2dCQUN0Rix1QkFBdUI7Z0JBQ3ZCLElBQUkscUJBQXFCLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxFQUFFO29CQUMvQyxJQUFNLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQyxXQUFXLENBQUcsQ0FBQztvQkFDNUQsS0FBSyxJQUFJLEdBQUMsR0FBRyxDQUFDLEVBQUUsR0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBQyxFQUFFLEVBQUU7d0JBQzlDLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxHQUFDLENBQUMsRUFBRSxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUM7cUJBQ2pFO2lCQUNGO2FBQ0Y7U0FDRjtLQUNGO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxTQUF5QjtJQUN0RCxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLFVBQVUsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO0lBRTFDLG9CQUFvQixDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVyQyxJQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ25ELElBQUksU0FBUyxDQUFDLEtBQUssSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsS0FBSyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzNFLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7WUFDM0IsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNyQjthQUFNO1lBQ0wsSUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLHNCQUFzQixDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDNUYsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QixTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7U0FDN0I7UUFDRCxPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLFNBQThCLEVBQUUsT0FBZ0IsRUFBRSxJQUFVO0lBQzlELGlCQUFpQixDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUksU0FBOEIsRUFBRSxPQUFnQixFQUFFLElBQVU7SUFDekYsaUJBQWlCLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQ3RCLEtBQVksRUFBRSxTQUE4QixFQUFFLE9BQWdCLEVBQUUsSUFBUyxFQUN6RSxRQUFpQjtJQUNuQixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO1FBQ3pCLFlBQVksQ0FBQyxLQUFLLEVBQUUsSUFBSSxlQUFlLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRixJQUFJLFFBQVEsRUFBRTtZQUNaLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7U0FDaEM7S0FDRjtJQUNELFlBQVksQ0FBSSxLQUFLLENBQUMsQ0FBQztBQUN6QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUMxQixjQUFzQixFQUFFLFNBQThCLEVBQUUsT0FBZ0IsRUFBRSxJQUFVO0lBQ3RGLG9CQUFvQixDQUNoQixRQUFRLEVBQUUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMvRixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQ2hDLGNBQXNCLEVBQUUsU0FBOEIsRUFBRSxPQUFnQixFQUFFLElBQVU7SUFDdEYsb0JBQW9CLENBQ2hCLFFBQVEsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSx3QkFBd0IsRUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQzlGLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUN6QixLQUFZLEVBQUUsU0FBOEIsRUFBRSxPQUFnQixFQUFFLElBQVMsRUFBRSxRQUFpQixFQUM1RixLQUFZLEVBQUUsY0FBc0I7SUFDdEMsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUN6QixZQUFZLENBQUMsS0FBSyxFQUFFLElBQUksZUFBZSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxRixpQ0FBaUMsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDekQsSUFBSSxRQUFRLEVBQUU7WUFDWixLQUFLLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1NBQ25DO0tBQ0Y7SUFFRCxZQUFZLENBQUksS0FBSyxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsV0FBVztJQUN6QixPQUFPLGlCQUFpQixDQUFJLFFBQVEsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsQ0FBQztBQUNsRSxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBSSxLQUFZLEVBQUUsVUFBa0I7SUFDNUQsU0FBUztRQUNMLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsd0RBQXdELENBQUMsQ0FBQztJQUM1RixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNyRSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3hELENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBSSxLQUFZO0lBQ25DLElBQU0sU0FBUyxHQUFHLElBQUksU0FBUyxFQUFLLENBQUM7SUFDckMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFN0QsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSTtRQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO0lBQzlELEtBQUssQ0FBQyxPQUFPLENBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQVksRUFBRSxRQUF3QixFQUFFLFNBQWlCO0lBQzdFLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxJQUFJO1FBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO0lBQzVELEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFFRCxTQUFTLGlDQUFpQyxDQUFDLEtBQVksRUFBRSxjQUFzQjtJQUM3RSxJQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ2hGLElBQU0sdUJBQXVCLEdBQ3pCLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNGLElBQUksY0FBYyxLQUFLLHVCQUF1QixFQUFFO1FBQzlDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDdEU7QUFDSCxDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsS0FBWSxFQUFFLEtBQWE7SUFDNUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLCtDQUErQyxDQUFDLENBQUM7SUFDM0YsT0FBTyxLQUFLLENBQUMsT0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCB0aHJvd0Vycm9yfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lcn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0YWJsZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3N0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgTFF1ZXJ5LCBUUXVlcmllcywgVFF1ZXJ5LCBUUXVlcnlNZXRhZGF0YSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7REVDTEFSQVRJT05fTENPTlRBSU5FUiwgTFZpZXcsIFBBUkVOVCwgUVVFUklFUywgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDdXJyZW50UXVlcnlJbmRleCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0Q3VycmVudFF1ZXJ5SW5kZXh9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtpc0NyZWF0aW9uTW9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtjcmVhdGVDb250YWluZXJSZWYsIGNyZWF0ZUVsZW1lbnRSZWYsIGNyZWF0ZVRlbXBsYXRlUmVmfSBmcm9tICcuL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQ7XG5cbmNsYXNzIExRdWVyeV88VD4gaW1wbGVtZW50cyBMUXVlcnk8VD4ge1xuICBtYXRjaGVzOiAoVHxudWxsKVtdfG51bGwgPSBudWxsO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4pIHt9XG4gIGNsb25lKCk6IExRdWVyeTxUPiB7IHJldHVybiBuZXcgTFF1ZXJ5Xyh0aGlzLnF1ZXJ5TGlzdCk7IH1cbiAgc2V0RGlydHkoKTogdm9pZCB7IHRoaXMucXVlcnlMaXN0LnNldERpcnR5KCk7IH1cbn1cblxuY2xhc3MgTFF1ZXJpZXNfIGltcGxlbWVudHMgTFF1ZXJpZXMge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcmllczogTFF1ZXJ5PGFueT5bXSA9IFtdKSB7fVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldyh0VmlldzogVFZpZXcpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCB0UXVlcmllcyA9IHRWaWV3LnF1ZXJpZXM7XG4gICAgaWYgKHRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBub09mSW5oZXJpdGVkUXVlcmllcyA9XG4gICAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMgIT09IG51bGwgPyB0Vmlldy5jb250ZW50UXVlcmllc1swXSA6IHRRdWVyaWVzLmxlbmd0aDtcbiAgICAgIGNvbnN0IHZpZXdMUXVlcmllczogTFF1ZXJ5PGFueT5bXSA9IFtdO1xuXG4gICAgICAvLyBBbiBlbWJlZGRlZCB2aWV3IGhhcyBxdWVyaWVzIHByb3BhZ2F0ZWQgZnJvbSBhIGRlY2xhcmF0aW9uIHZpZXcgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGVcbiAgICAgIC8vIFRRdWVyaWVzIGNvbGxlY3Rpb24gYW5kIHVwIHVudGlsIGEgZmlyc3QgY29udGVudCBxdWVyeSBkZWNsYXJlZCBpbiB0aGUgZW1iZWRkZWQgdmlldy4gT25seVxuICAgICAgLy8gcHJvcGFnYXRlZCBMUXVlcmllcyBhcmUgY3JlYXRlZCBhdCB0aGlzIHBvaW50IChMUXVlcnkgY29ycmVzcG9uZGluZyB0byBkZWNsYXJlZCBjb250ZW50XG4gICAgICAvLyBxdWVyaWVzIHdpbGwgYmUgaW5zdGFudGlhdGVkIGZyb20gdGhlIGNvbnRlbnQgcXVlcnkgaW5zdHJ1Y3Rpb25zIGZvciBlYWNoIGRpcmVjdGl2ZSkuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vT2ZJbmhlcml0ZWRRdWVyaWVzOyBpKyspIHtcbiAgICAgICAgY29uc3QgdFF1ZXJ5ID0gdFF1ZXJpZXMuZ2V0QnlJbmRleChpKTtcbiAgICAgICAgY29uc3QgcGFyZW50TFF1ZXJ5ID0gdGhpcy5xdWVyaWVzW3RRdWVyeS5pbmRleEluRGVjbGFyYXRpb25WaWV3XTtcbiAgICAgICAgdmlld0xRdWVyaWVzLnB1c2gocGFyZW50TFF1ZXJ5LmNsb25lKCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IExRdWVyaWVzXyh2aWV3TFF1ZXJpZXMpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaW5zZXJ0Vmlldyh0VmlldzogVFZpZXcpOiB2b2lkIHsgdGhpcy5kaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0Vmlldyk7IH1cblxuICBkZXRhY2hWaWV3KHRWaWV3OiBUVmlldyk6IHZvaWQgeyB0aGlzLmRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3KTsgfVxuXG4gIHByaXZhdGUgZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXc6IFRWaWV3KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChnZXRUUXVlcnkodFZpZXcsIGkpLm1hdGNoZXMgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5xdWVyaWVzW2ldLnNldERpcnR5KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFRRdWVyeU1ldGFkYXRhXyBpbXBsZW1lbnRzIFRRdWVyeU1ldGFkYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcHJlZGljYXRlOiBUeXBlPGFueT58c3RyaW5nW10sIHB1YmxpYyBkZXNjZW5kYW50czogYm9vbGVhbiwgcHVibGljIGlzU3RhdGljOiBib29sZWFuLFxuICAgICAgcHVibGljIHJlYWQ6IGFueSA9IG51bGwpIHt9XG59XG5cbmNsYXNzIFRRdWVyaWVzXyBpbXBsZW1lbnRzIFRRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBxdWVyaWVzOiBUUXVlcnlbXSA9IFtdKSB7fVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cbiAgZWxlbWVudEVuZCh0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRFbmQodE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSk6IFRRdWVyaWVzfG51bGwge1xuICAgIGxldCBxdWVyaWVzRm9yVGVtcGxhdGVSZWY6IFRRdWVyeVtdfG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgIT09IG51bGwgPyBxdWVyaWVzRm9yVGVtcGxhdGVSZWYubGVuZ3RoIDogMDtcbiAgICAgIGNvbnN0IHRxdWVyeUNsb25lID0gdGhpcy5nZXRCeUluZGV4KGkpLmVtYmVkZGVkVFZpZXcodE5vZGUsIGNoaWxkUXVlcnlJbmRleCk7XG5cbiAgICAgIGlmICh0cXVlcnlDbG9uZSkge1xuICAgICAgICB0cXVlcnlDbG9uZS5pbmRleEluRGVjbGFyYXRpb25WaWV3ID0gaTtcbiAgICAgICAgaWYgKHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCkge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5wdXNoKHRxdWVyeUNsb25lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgPSBbdHF1ZXJ5Q2xvbmVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IG5ldyBUUXVlcmllc18ocXVlcmllc0ZvclRlbXBsYXRlUmVmKSA6IG51bGw7XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS50ZW1wbGF0ZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGdldEJ5SW5kZXgoaW5kZXg6IG51bWJlcik6IFRRdWVyeSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHRoaXMucXVlcmllcywgaW5kZXgpO1xuICAgIHJldHVybiB0aGlzLnF1ZXJpZXNbaW5kZXhdO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5xdWVyaWVzLmxlbmd0aDsgfVxuXG4gIHRyYWNrKHRxdWVyeTogVFF1ZXJ5KTogdm9pZCB7IHRoaXMucXVlcmllcy5wdXNoKHRxdWVyeSk7IH1cbn1cblxuY2xhc3MgVFF1ZXJ5XyBpbXBsZW1lbnRzIFRRdWVyeSB7XG4gIG1hdGNoZXM6IG51bWJlcltdfG51bGwgPSBudWxsO1xuICBpbmRleEluRGVjbGFyYXRpb25WaWV3ID0gLTE7XG4gIGNyb3NzZXNOZ1RlbXBsYXRlID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEEgbm9kZSBpbmRleCBvbiB3aGljaCBhIHF1ZXJ5IHdhcyBkZWNsYXJlZCAoLTEgZm9yIHZpZXcgcXVlcmllcyBhbmQgb25lcyBpbmhlcml0ZWQgZnJvbSB0aGVcbiAgICogZGVjbGFyYXRpb24gdGVtcGxhdGUpLiBXZSB1c2UgdGhpcyBpbmRleCAoYWxvbmdzaWRlIHdpdGggX2FwcGxpZXNUb05leHROb2RlIGZsYWcpIHRvIGtub3dcbiAgICogd2hlbiB0byBhcHBseSBjb250ZW50IHF1ZXJpZXMgdG8gZWxlbWVudHMgaW4gYSB0ZW1wbGF0ZS5cbiAgICovXG4gIHByaXZhdGUgX2RlY2xhcmF0aW9uTm9kZUluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgZmxhZyBpbmRpY2F0aW5nIGlmIGEgZ2l2ZW4gcXVlcnkgc3RpbGwgYXBwbGllcyB0byBub2RlcyBpdCBpcyBjcm9zc2luZy4gV2UgdXNlIHRoaXMgZmxhZ1xuICAgKiAoYWxvbmdzaWRlIHdpdGggX2RlY2xhcmF0aW9uTm9kZUluZGV4KSB0byBrbm93IHdoZW4gdG8gc3RvcCBhcHBseWluZyBjb250ZW50IHF1ZXJpZXMgdG9cbiAgICogZWxlbWVudHMgaW4gYSB0ZW1wbGF0ZS5cbiAgICovXG4gIHByaXZhdGUgX2FwcGxpZXNUb05leHROb2RlID0gdHJ1ZTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgbWV0YWRhdGE6IFRRdWVyeU1ldGFkYXRhLCBub2RlSW5kZXg6IG51bWJlciA9IC0xKSB7XG4gICAgdGhpcy5fZGVjbGFyYXRpb25Ob2RlSW5kZXggPSBub2RlSW5kZXg7XG4gIH1cblxuICBlbGVtZW50U3RhcnQodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pc0FwcGx5aW5nVG9Ob2RlKHROb2RlKSkge1xuICAgICAgdGhpcy5tYXRjaFROb2RlKHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZWxlbWVudEVuZCh0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZGVjbGFyYXRpb25Ob2RlSW5kZXggPT09IHROb2RlLmluZGV4KSB7XG4gICAgICB0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHRlbXBsYXRlKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7IHRoaXMuZWxlbWVudFN0YXJ0KHRWaWV3LCB0Tm9kZSk7IH1cblxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSwgY2hpbGRRdWVyeUluZGV4OiBudW1iZXIpOiBUUXVlcnl8bnVsbCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMuY3Jvc3Nlc05nVGVtcGxhdGUgPSB0cnVlO1xuICAgICAgLy8gQSBtYXJrZXIgaW5kaWNhdGluZyBhIGA8bmctdGVtcGxhdGU+YCBlbGVtZW50IChhIHBsYWNlaG9sZGVyIGZvciBxdWVyeSByZXN1bHRzIGZyb21cbiAgICAgIC8vIGVtYmVkZGVkIHZpZXdzIGNyZWF0ZWQgYmFzZWQgb24gdGhpcyBgPG5nLXRlbXBsYXRlPmApLlxuICAgICAgdGhpcy5hZGRNYXRjaCgtdE5vZGUuaW5kZXgsIGNoaWxkUXVlcnlJbmRleCk7XG4gICAgICByZXR1cm4gbmV3IFRRdWVyeV8odGhpcy5tZXRhZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0FwcGx5aW5nVG9Ob2RlKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZSAmJiB0aGlzLm1ldGFkYXRhLmRlc2NlbmRhbnRzID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID09PSAodE5vZGUucGFyZW50ID8gdE5vZGUucGFyZW50LmluZGV4IDogLTEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fYXBwbGllc1RvTmV4dE5vZGU7XG4gIH1cblxuICBwcml2YXRlIG1hdGNoVE5vZGUodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLm1ldGFkYXRhLnByZWRpY2F0ZSkpIHtcbiAgICAgIGNvbnN0IGxvY2FsTmFtZXMgPSB0aGlzLm1ldGFkYXRhLnByZWRpY2F0ZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldywgdE5vZGUsIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgbG9jYWxOYW1lc1tpXSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB0eXBlUHJlZGljYXRlID0gdGhpcy5tZXRhZGF0YS5wcmVkaWNhdGUgYXMgYW55O1xuICAgICAgaWYgKHR5cGVQcmVkaWNhdGUgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldywgdE5vZGUsIC0xKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24oXG4gICAgICAgICAgICB0VmlldywgdE5vZGUsIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCB0eXBlUHJlZGljYXRlLCBmYWxzZSwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbm9kZU1hdGNoSWR4OiBudW1iZXJ8bnVsbCk6IHZvaWQge1xuICAgIGlmIChub2RlTWF0Y2hJZHggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHJlYWQgPSB0aGlzLm1ldGFkYXRhLnJlYWQ7XG4gICAgICBpZiAocmVhZCAhPT0gbnVsbCkge1xuICAgICAgICBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9FbGVtZW50UmVmIHx8IHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYgfHxcbiAgICAgICAgICAgIHJlYWQgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYgJiYgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIC0yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVPclByb3ZpZGVySWR4ID1cbiAgICAgICAgICAgICAgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHJlYWQsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgbm9kZU1hdGNoSWR4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFkZE1hdGNoKHROb2RlSWR4OiBudW1iZXIsIG1hdGNoSWR4OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgICB0aGlzLm1hdGNoZXMgPSBbdE5vZGVJZHgsIG1hdGNoSWR4XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tYXRjaGVzLnB1c2godE5vZGVJZHgsIG1hdGNoSWR4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYW55IHtcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIG1hdGNoaW5nSWR4OiBudW1iZXIsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGlmIChtYXRjaGluZ0lkeCA9PT0gLTEpIHtcbiAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIGRldGVjdCBpdCB1c2luZyBhcHByb3ByaWF0ZSB0Tm9kZSB0eXBlXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAobWF0Y2hpbmdJZHggPT09IC0yKSB7XG4gICAgLy8gcmVhZCBhIHNwZWNpYWwgdG9rZW4gZnJvbSBhIG5vZGUgaW5qZWN0b3JcbiAgICByZXR1cm4gY3JlYXRlU3BlY2lhbFRva2VuKGxWaWV3LCB0Tm9kZSwgcmVhZCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gcmVhZCBhIHRva2VuXG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKGxWaWV3W1RWSUVXXS5kYXRhLCBsVmlldywgbWF0Y2hpbmdJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU3BlY2lhbFRva2VuKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCByZWFkOiBhbnkpOiBhbnkge1xuICBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9FbGVtZW50UmVmKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICAgIHJldHVybiBjcmVhdGVDb250YWluZXJSZWYoXG4gICAgICAgIFZpZXdDb250YWluZXJSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgdGhyb3dFcnJvcihcbiAgICAgICAgICAgIGBTcGVjaWFsIHRva2VuIHRvIHJlYWQgc2hvdWxkIGJlIG9uZSBvZiBFbGVtZW50UmVmLCBUZW1wbGF0ZVJlZiBvciBWaWV3Q29udGFpbmVyUmVmIGJ1dCBnb3QgJHtzdHJpbmdpZnkocmVhZCl9LmApO1xuICB9XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIHF1ZXJ5IHJlc3VsdHMgZm9yIGEgZ2l2ZW4gdmlldy4gVGhpcyBmdW5jdGlvbiBpcyBtZWFudCB0byBkbyB0aGVcbiAqIHByb2Nlc3Npbmcgb25jZSBhbmQgb25seSBvbmNlIGZvciBhIGdpdmVuIHZpZXcgaW5zdGFuY2UgKGEgc2V0IG9mIHJlc3VsdHMgZm9yIGEgZ2l2ZW4gdmlld1xuICogZG9lc24ndCBjaGFuZ2UpLlxuICovXG5mdW5jdGlvbiBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzPFQ+KGxWaWV3OiBMVmlldywgdFF1ZXJ5OiBUUXVlcnksIHF1ZXJ5SW5kZXg6IG51bWJlcik6IChUIHwgbnVsbClbXSB7XG4gIGNvbnN0IGxRdWVyeSA9IGxWaWV3W1FVRVJJRVNdICEucXVlcmllcyAhW3F1ZXJ5SW5kZXhdO1xuICBpZiAobFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICBjb25zdCB0Vmlld0RhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICBjb25zdCB0UXVlcnlNYXRjaGVzID0gdFF1ZXJ5Lm1hdGNoZXMgITtcbiAgICBjb25zdCByZXN1bHQ6IFR8bnVsbFtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0UXVlcnlNYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBtYXRjaGVkTm9kZUlkeCA9IHRRdWVyeU1hdGNoZXNbaV07XG4gICAgICBpZiAobWF0Y2hlZE5vZGVJZHggPCAwKSB7XG4gICAgICAgIC8vIHdlIGF0IHRoZSA8bmctdGVtcGxhdGU+IG1hcmtlciB3aGljaCBtaWdodCBoYXZlIHJlc3VsdHMgaW4gdmlld3MgY3JlYXRlZCBiYXNlZCBvbiB0aGlzXG4gICAgICAgIC8vIDxuZy10ZW1wbGF0ZT4gLSB0aG9zZSByZXN1bHRzIHdpbGwgYmUgaW4gc2VwYXJhdGUgdmlld3MgdGhvdWdoLCBzbyBoZXJlIHdlIGp1c3QgbGVhdmVcbiAgICAgICAgLy8gbnVsbCBhcyBhIHBsYWNlaG9sZGVyXG4gICAgICAgIHJlc3VsdC5wdXNoKG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHRWaWV3RGF0YSwgbWF0Y2hlZE5vZGVJZHgpO1xuICAgICAgICBjb25zdCB0Tm9kZSA9IHRWaWV3RGF0YVttYXRjaGVkTm9kZUlkeF0gYXMgVE5vZGU7XG4gICAgICAgIHJlc3VsdC5wdXNoKGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXcsIHROb2RlLCB0UXVlcnlNYXRjaGVzW2kgKyAxXSwgdFF1ZXJ5Lm1ldGFkYXRhLnJlYWQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbFF1ZXJ5Lm1hdGNoZXMgPSByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbFF1ZXJ5Lm1hdGNoZXM7XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCBjb2xsZWN0cyAoYWxyZWFkeSBtYXRlcmlhbGl6ZWQpIHF1ZXJ5IHJlc3VsdHMgZnJvbSBhIHRyZWUgb2Ygdmlld3MsXG4gKiBzdGFydGluZyB3aXRoIGEgcHJvdmlkZWQgTFZpZXcuXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RRdWVyeVJlc3VsdHM8VD4obFZpZXc6IExWaWV3LCBxdWVyeUluZGV4OiBudW1iZXIsIHJlc3VsdDogVFtdKTogVFtdIHtcbiAgY29uc3QgdFF1ZXJ5ID0gbFZpZXdbVFZJRVddLnF1ZXJpZXMgIS5nZXRCeUluZGV4KHF1ZXJ5SW5kZXgpO1xuICBjb25zdCB0UXVlcnlNYXRjaGVzID0gdFF1ZXJ5Lm1hdGNoZXM7XG4gIGlmICh0UXVlcnlNYXRjaGVzICE9PSBudWxsKSB7XG4gICAgY29uc3QgbFZpZXdSZXN1bHRzID0gbWF0ZXJpYWxpemVWaWV3UmVzdWx0czxUPihsVmlldywgdFF1ZXJ5LCBxdWVyeUluZGV4KTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFF1ZXJ5TWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgdE5vZGVJZHggPSB0UXVlcnlNYXRjaGVzW2ldO1xuICAgICAgaWYgKHROb2RlSWR4ID4gMCkge1xuICAgICAgICBjb25zdCB2aWV3UmVzdWx0ID0gbFZpZXdSZXN1bHRzW2kgLyAyXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld1Jlc3VsdCwgJ21hdGVyaWFsaXplZCBxdWVyeSByZXN1bHQgc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICAgICAgcmVzdWx0LnB1c2godmlld1Jlc3VsdCBhcyBUKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNoaWxkUXVlcnlJbmRleCA9IHRRdWVyeU1hdGNoZXNbaSArIDFdO1xuXG4gICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IGxWaWV3Wy10Tm9kZUlkeF0gYXMgTENvbnRhaW5lcjtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25MQ29udGFpbmVyKTtcblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGluc2VydGVkIGluIHRoaXMgY29udGFpbmVyXG4gICAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGRlY2xhcmF0aW9uTENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBkZWNsYXJhdGlvbkxDb250YWluZXJbaV07XG4gICAgICAgICAgaWYgKGVtYmVkZGVkTFZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl0gPT09IGVtYmVkZGVkTFZpZXdbUEFSRU5UXSkge1xuICAgICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyhlbWJlZGRlZExWaWV3LCBjaGlsZFF1ZXJ5SW5kZXgsIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBjcmVhdGVkIGZyb20gdGhpcyBkZWNsYXJhdGlvbiBjb250YWluZXIgYW5kIGluc2VydGVkIGludG9cbiAgICAgICAgLy8gZGlmZmVyZW50IGNvbnRhaW5lcnNcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lcltNT1ZFRF9WSUVXU10gIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3cyA9IGRlY2xhcmF0aW9uTENvbnRhaW5lcltNT1ZFRF9WSUVXU10gITtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVtYmVkZGVkTFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb2xsZWN0UXVlcnlSZXN1bHRzKGVtYmVkZGVkTFZpZXdzW2ldLCBjaGlsZFF1ZXJ5SW5kZXgsIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIGEgcXVlcnkgYnkgY29tYmluaW5nIG1hdGNoZXMgZnJvbSBhbGwgYWN0aXZlIHZpZXdzIGFuZCByZW1vdmluZyBtYXRjaGVzIGZyb20gZGVsZXRlZFxuICogdmlld3MuXG4gKlxuICogQHJldHVybnMgYHRydWVgIGlmIGEgcXVlcnkgZ290IGRpcnR5IGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9yIGlmIHRoaXMgaXMgYSBzdGF0aWMgcXVlcnlcbiAqIHJlc29sdmluZyBpbiBjcmVhdGlvbiBtb2RlLCBgZmFsc2VgIG90aGVyd2lzZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXF1ZXJ5UmVmcmVzaChxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxhbnk+KTogYm9vbGVhbiB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgcXVlcnlJbmRleCA9IGdldEN1cnJlbnRRdWVyeUluZGV4KCk7XG5cbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlJbmRleCArIDEpO1xuXG4gIGNvbnN0IHRRdWVyeSA9IGdldFRRdWVyeShsVmlld1tUVklFV10sIHF1ZXJ5SW5kZXgpO1xuICBpZiAocXVlcnlMaXN0LmRpcnR5ICYmIChpc0NyZWF0aW9uTW9kZShsVmlldykgPT09IHRRdWVyeS5tZXRhZGF0YS5pc1N0YXRpYykpIHtcbiAgICBpZiAodFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgIHF1ZXJ5TGlzdC5yZXNldChbXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRRdWVyeS5jcm9zc2VzTmdUZW1wbGF0ZSA/IGNvbGxlY3RRdWVyeVJlc3VsdHMobFZpZXcsIHF1ZXJ5SW5kZXgsIFtdKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzKGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuICAgICAgcXVlcnlMaXN0LnJlc2V0KHJlc3VsdCk7XG4gICAgICBxdWVyeUxpc3Qubm90aWZ5T25DaGFuZ2VzKCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCBmb3IgYSBzdGF0aWMgdmlldyBxdWVyeS5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3RhdGljVmlld1F1ZXJ5PFQ+KFxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICB2aWV3UXVlcnlJbnRlcm5hbChnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCwgc3RvcmVzIHRoZSByZWZlcmVuY2UgaW4gTFZpZXcgYW5kIHJldHVybnMgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV2aWV3UXVlcnk8VD4ocHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkPzogYW55KTogdm9pZCB7XG4gIHZpZXdRdWVyeUludGVybmFsKGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiB2aWV3UXVlcnlJbnRlcm5hbDxUPihcbiAgICBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55LFxuICAgIGlzU3RhdGljOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZGVzY2VuZCwgaXNTdGF0aWMsIHJlYWQpLCAtMSk7XG4gICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNWaWV3UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG4gIGNyZWF0ZUxRdWVyeTxUPihsVmlldyk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICBjb250ZW50UXVlcnlJbnRlcm5hbChcbiAgICAgIGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgZmFsc2UsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBzdGF0aWMgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2hcbiAqIChwYXJ0IG9mIGEgdmlldyByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY0NvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRlbnRRdWVyeUludGVybmFsPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnksIGlzU3RhdGljOiBib29sZWFuLFxuICAgIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGNyZWF0ZVRRdWVyeSh0VmlldywgbmV3IFRRdWVyeU1ldGFkYXRhXyhwcmVkaWNhdGUsIGRlc2NlbmQsIGlzU3RhdGljLCByZWFkKSwgdE5vZGUuaW5kZXgpO1xuICAgIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldywgZGlyZWN0aXZlSW5kZXgpO1xuICAgIGlmIChpc1N0YXRpYykge1xuICAgICAgdFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUxRdWVyeTxUPihsVmlldyk7XG59XG5cbi8qKlxuICogTG9hZHMgYSBRdWVyeUxpc3QgY29ycmVzcG9uZGluZyB0byB0aGUgY3VycmVudCB2aWV3IG9yIGNvbnRlbnQgcXVlcnkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVsb2FkUXVlcnk8VD4oKTogUXVlcnlMaXN0PFQ+IHtcbiAgcmV0dXJuIGxvYWRRdWVyeUludGVybmFsPFQ+KGdldExWaWV3KCksIGdldEN1cnJlbnRRdWVyeUluZGV4KCkpO1xufVxuXG5mdW5jdGlvbiBsb2FkUXVlcnlJbnRlcm5hbDxUPihsVmlldzogTFZpZXcsIHF1ZXJ5SW5kZXg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChsVmlld1tRVUVSSUVTXSwgJ0xRdWVyaWVzIHNob3VsZCBiZSBkZWZpbmVkIHdoZW4gdHJ5aW5nIHRvIGxvYWQgYSBxdWVyeScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXdbUVVFUklFU10gIS5xdWVyaWVzLCBxdWVyeUluZGV4KTtcbiAgcmV0dXJuIGxWaWV3W1FVRVJJRVNdICEucXVlcmllc1txdWVyeUluZGV4XS5xdWVyeUxpc3Q7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxRdWVyeTxUPihsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChsVmlldywgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG5cbiAgaWYgKGxWaWV3W1FVRVJJRVNdID09PSBudWxsKSBsVmlld1tRVUVSSUVTXSA9IG5ldyBMUXVlcmllc18oKTtcbiAgbFZpZXdbUVVFUklFU10gIS5xdWVyaWVzLnB1c2gobmV3IExRdWVyeV8ocXVlcnlMaXN0KSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRRdWVyeSh0VmlldzogVFZpZXcsIG1ldGFkYXRhOiBUUXVlcnlNZXRhZGF0YSwgbm9kZUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LnF1ZXJpZXMgPT09IG51bGwpIHRWaWV3LnF1ZXJpZXMgPSBuZXcgVFF1ZXJpZXNfKCk7XG4gIHRWaWV3LnF1ZXJpZXMudHJhY2sobmV3IFRRdWVyeV8obWV0YWRhdGEsIG5vZGVJbmRleCkpO1xufVxuXG5mdW5jdGlvbiBzYXZlQ29udGVudFF1ZXJ5QW5kRGlyZWN0aXZlSW5kZXgodFZpZXc6IFRWaWV3LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHRWaWV3Q29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcyB8fCAodFZpZXcuY29udGVudFF1ZXJpZXMgPSBbXSk7XG4gIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCA/IHRWaWV3Q29udGVudFF1ZXJpZXNbdFZpZXdDb250ZW50UXVlcmllcy5sZW5ndGggLSAxXSA6IC0xO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKHRWaWV3LnF1ZXJpZXMgIS5sZW5ndGggLSAxLCBkaXJlY3RpdmVJbmRleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0VFF1ZXJ5KHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlcik6IFRRdWVyeSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LnF1ZXJpZXMsICdUUXVlcmllcyBtdXN0IGJlIGRlZmluZWQgdG8gcmV0cmlldmUgYSBUUXVlcnknKTtcbiAgcmV0dXJuIHRWaWV3LnF1ZXJpZXMgIS5nZXRCeUluZGV4KGluZGV4KTtcbn1cbiJdfQ==