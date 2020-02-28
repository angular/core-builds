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
import { getCurrentQueryIndex, getLView, getPreviousOrParentTNode, getTView, setCurrentQueryIndex } from './state';
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
            var declarationNodeIdx = this._declarationNodeIndex;
            var parent_1 = tNode.parent;
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
            while (parent_1 !== null && parent_1.type === 4 /* ElementContainer */ &&
                parent_1.index !== declarationNodeIdx) {
                parent_1 = parent_1.parent;
            }
            return declarationNodeIdx === (parent_1 !== null ? parent_1.index : -1);
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
function materializeViewResults(tView, lView, tQuery, queryIndex) {
    var lQuery = lView[QUERIES].queries[queryIndex];
    if (lQuery.matches === null) {
        var tViewData = tView.data;
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
function collectQueryResults(tView, lView, queryIndex, result) {
    var tQuery = tView.queries.getByIndex(queryIndex);
    var tQueryMatches = tQuery.matches;
    if (tQueryMatches !== null) {
        var lViewResults = materializeViewResults(tView, lView, tQuery, queryIndex);
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
                        collectQueryResults(embeddedLView[TVIEW], embeddedLView, childQueryIndex, result);
                    }
                }
                // collect matches for views created from this declaration container and inserted into
                // different containers
                if (declarationLContainer[MOVED_VIEWS] !== null) {
                    var embeddedLViews = declarationLContainer[MOVED_VIEWS];
                    for (var i_2 = 0; i_2 < embeddedLViews.length; i_2++) {
                        var embeddedLView = embeddedLViews[i_2];
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
    var lView = getLView();
    var tView = getTView();
    var queryIndex = getCurrentQueryIndex();
    setCurrentQueryIndex(queryIndex + 1);
    var tQuery = getTQuery(tView, queryIndex);
    if (queryList.dirty && (isCreationMode(lView) === tQuery.metadata.isStatic)) {
        if (tQuery.matches === null) {
            queryList.reset([]);
        }
        else {
            var result = tQuery.crossesNgTemplate ?
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
    var queryList = new QueryList();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLHVCQUF1QixFQUFjLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hGLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQXFELDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFD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QUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNGLElBQUksY0FBYyxLQUFLLHVCQUF1QixFQUFFO1FBQzlDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDdEU7QUFDSCxDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsS0FBWSxFQUFFLEtBQWE7SUFDNUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLCtDQUErQyxDQUFDLENBQUM7SUFDM0YsT0FBTyxLQUFLLENBQUMsT0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCB0aHJvd0Vycm9yfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lcn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0YWJsZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3N0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgTFF1ZXJ5LCBUUXVlcmllcywgVFF1ZXJ5LCBUUXVlcnlNZXRhZGF0YSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7REVDTEFSQVRJT05fTENPTlRBSU5FUiwgTFZpZXcsIFBBUkVOVCwgUVVFUklFUywgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDdXJyZW50UXVlcnlJbmRleCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0VFZpZXcsIHNldEN1cnJlbnRRdWVyeUluZGV4fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDcmVhdGlvbk1vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Y3JlYXRlQ29udGFpbmVyUmVmLCBjcmVhdGVFbGVtZW50UmVmLCBjcmVhdGVUZW1wbGF0ZVJlZn0gZnJvbSAnLi92aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5JztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG5jbGFzcyBMUXVlcnlfPFQ+IGltcGxlbWVudHMgTFF1ZXJ5PFQ+IHtcbiAgbWF0Y2hlczogKFR8bnVsbClbXXxudWxsID0gbnVsbDtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+KSB7fVxuICBjbG9uZSgpOiBMUXVlcnk8VD4geyByZXR1cm4gbmV3IExRdWVyeV8odGhpcy5xdWVyeUxpc3QpOyB9XG4gIHNldERpcnR5KCk6IHZvaWQgeyB0aGlzLnF1ZXJ5TGlzdC5zZXREaXJ0eSgpOyB9XG59XG5cbmNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXSkge31cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcodFZpZXc6IFRWaWV3KTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3QgdFF1ZXJpZXMgPSB0Vmlldy5xdWVyaWVzO1xuICAgIGlmICh0UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgbm9PZkluaGVyaXRlZFF1ZXJpZXMgPVxuICAgICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsID8gdFZpZXcuY29udGVudFF1ZXJpZXNbMF0gOiB0UXVlcmllcy5sZW5ndGg7XG4gICAgICBjb25zdCB2aWV3TFF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXTtcblxuICAgICAgLy8gQW4gZW1iZWRkZWQgdmlldyBoYXMgcXVlcmllcyBwcm9wYWdhdGVkIGZyb20gYSBkZWNsYXJhdGlvbiB2aWV3IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gICAgICAvLyBUUXVlcmllcyBjb2xsZWN0aW9uIGFuZCB1cCB1bnRpbCBhIGZpcnN0IGNvbnRlbnQgcXVlcnkgZGVjbGFyZWQgaW4gdGhlIGVtYmVkZGVkIHZpZXcuIE9ubHlcbiAgICAgIC8vIHByb3BhZ2F0ZWQgTFF1ZXJpZXMgYXJlIGNyZWF0ZWQgYXQgdGhpcyBwb2ludCAoTFF1ZXJ5IGNvcnJlc3BvbmRpbmcgdG8gZGVjbGFyZWQgY29udGVudFxuICAgICAgLy8gcXVlcmllcyB3aWxsIGJlIGluc3RhbnRpYXRlZCBmcm9tIHRoZSBjb250ZW50IHF1ZXJ5IGluc3RydWN0aW9ucyBmb3IgZWFjaCBkaXJlY3RpdmUpLlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mSW5oZXJpdGVkUXVlcmllczsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHRRdWVyeSA9IHRRdWVyaWVzLmdldEJ5SW5kZXgoaSk7XG4gICAgICAgIGNvbnN0IHBhcmVudExRdWVyeSA9IHRoaXMucXVlcmllc1t0UXVlcnkuaW5kZXhJbkRlY2xhcmF0aW9uVmlld107XG4gICAgICAgIHZpZXdMUXVlcmllcy5wdXNoKHBhcmVudExRdWVyeS5jbG9uZSgpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBMUXVlcmllc18odmlld0xRdWVyaWVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcodFZpZXc6IFRWaWV3KTogdm9pZCB7IHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpOyB9XG5cbiAgZGV0YWNoVmlldyh0VmlldzogVFZpZXcpOiB2b2lkIHsgdGhpcy5kaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0Vmlldyk7IH1cblxuICBwcml2YXRlIGRpcnR5UXVlcmllc1dpdGhNYXRjaGVzKHRWaWV3OiBUVmlldykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoZ2V0VFF1ZXJ5KHRWaWV3LCBpKS5tYXRjaGVzICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMucXVlcmllc1tpXS5zZXREaXJ0eSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBUUXVlcnlNZXRhZGF0YV8gaW1wbGVtZW50cyBUUXVlcnlNZXRhZGF0YSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHByZWRpY2F0ZTogVHlwZTxhbnk+fHN0cmluZ1tdLCBwdWJsaWMgZGVzY2VuZGFudHM6IGJvb2xlYW4sIHB1YmxpYyBpc1N0YXRpYzogYm9vbGVhbixcbiAgICAgIHB1YmxpYyByZWFkOiBhbnkgPSBudWxsKSB7fVxufVxuXG5jbGFzcyBUUXVlcmllc18gaW1wbGVtZW50cyBUUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcXVlcmllczogVFF1ZXJ5W10gPSBbXSkge31cblxuICBlbGVtZW50U3RhcnQodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKFxuICAgICAgICAgICAgICAgICAgICAgdFZpZXcsICdRdWVyaWVzIHNob3VsZCBjb2xsZWN0IHJlc3VsdHMgb24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnF1ZXJpZXNbaV0uZWxlbWVudFN0YXJ0KHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG4gIGVsZW1lbnRFbmQodE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS5lbGVtZW50RW5kKHROb2RlKTtcbiAgICB9XG4gIH1cbiAgZW1iZWRkZWRUVmlldyh0Tm9kZTogVE5vZGUpOiBUUXVlcmllc3xudWxsIHtcbiAgICBsZXQgcXVlcmllc0ZvclRlbXBsYXRlUmVmOiBUUXVlcnlbXXxudWxsID0gbnVsbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY2hpbGRRdWVyeUluZGV4ID0gcXVlcmllc0ZvclRlbXBsYXRlUmVmICE9PSBudWxsID8gcXVlcmllc0ZvclRlbXBsYXRlUmVmLmxlbmd0aCA6IDA7XG4gICAgICBjb25zdCB0cXVlcnlDbG9uZSA9IHRoaXMuZ2V0QnlJbmRleChpKS5lbWJlZGRlZFRWaWV3KHROb2RlLCBjaGlsZFF1ZXJ5SW5kZXgpO1xuXG4gICAgICBpZiAodHF1ZXJ5Q2xvbmUpIHtcbiAgICAgICAgdHF1ZXJ5Q2xvbmUuaW5kZXhJbkRlY2xhcmF0aW9uVmlldyA9IGk7XG4gICAgICAgIGlmIChxdWVyaWVzRm9yVGVtcGxhdGVSZWYgIT09IG51bGwpIHtcbiAgICAgICAgICBxdWVyaWVzRm9yVGVtcGxhdGVSZWYucHVzaCh0cXVlcnlDbG9uZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcXVlcmllc0ZvclRlbXBsYXRlUmVmID0gW3RxdWVyeUNsb25lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgIT09IG51bGwgPyBuZXcgVFF1ZXJpZXNfKHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZikgOiBudWxsO1xuICB9XG5cbiAgdGVtcGxhdGUodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKFxuICAgICAgICAgICAgICAgICAgICAgdFZpZXcsICdRdWVyaWVzIHNob3VsZCBjb2xsZWN0IHJlc3VsdHMgb24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnF1ZXJpZXNbaV0udGVtcGxhdGUodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cblxuICBnZXRCeUluZGV4KGluZGV4OiBudW1iZXIpOiBUUXVlcnkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh0aGlzLnF1ZXJpZXMsIGluZGV4KTtcbiAgICByZXR1cm4gdGhpcy5xdWVyaWVzW2luZGV4XTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMucXVlcmllcy5sZW5ndGg7IH1cblxuICB0cmFjayh0cXVlcnk6IFRRdWVyeSk6IHZvaWQgeyB0aGlzLnF1ZXJpZXMucHVzaCh0cXVlcnkpOyB9XG59XG5cbmNsYXNzIFRRdWVyeV8gaW1wbGVtZW50cyBUUXVlcnkge1xuICBtYXRjaGVzOiBudW1iZXJbXXxudWxsID0gbnVsbDtcbiAgaW5kZXhJbkRlY2xhcmF0aW9uVmlldyA9IC0xO1xuICBjcm9zc2VzTmdUZW1wbGF0ZSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBBIG5vZGUgaW5kZXggb24gd2hpY2ggYSBxdWVyeSB3YXMgZGVjbGFyZWQgKC0xIGZvciB2aWV3IHF1ZXJpZXMgYW5kIG9uZXMgaW5oZXJpdGVkIGZyb20gdGhlXG4gICAqIGRlY2xhcmF0aW9uIHRlbXBsYXRlKS4gV2UgdXNlIHRoaXMgaW5kZXggKGFsb25nc2lkZSB3aXRoIF9hcHBsaWVzVG9OZXh0Tm9kZSBmbGFnKSB0byBrbm93XG4gICAqIHdoZW4gdG8gYXBwbHkgY29udGVudCBxdWVyaWVzIHRvIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbk5vZGVJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIGZsYWcgaW5kaWNhdGluZyBpZiBhIGdpdmVuIHF1ZXJ5IHN0aWxsIGFwcGxpZXMgdG8gbm9kZXMgaXQgaXMgY3Jvc3NpbmcuIFdlIHVzZSB0aGlzIGZsYWdcbiAgICogKGFsb25nc2lkZSB3aXRoIF9kZWNsYXJhdGlvbk5vZGVJbmRleCkgdG8ga25vdyB3aGVuIHRvIHN0b3AgYXBwbHlpbmcgY29udGVudCBxdWVyaWVzIHRvXG4gICAqIGVsZW1lbnRzIGluIGEgdGVtcGxhdGUuXG4gICAqL1xuICBwcml2YXRlIF9hcHBsaWVzVG9OZXh0Tm9kZSA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IocHVibGljIG1ldGFkYXRhOiBUUXVlcnlNZXRhZGF0YSwgbm9kZUluZGV4OiBudW1iZXIgPSAtMSkge1xuICAgIHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID0gbm9kZUluZGV4O1xuICB9XG5cbiAgZWxlbWVudFN0YXJ0KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNBcHBseWluZ1RvTm9kZSh0Tm9kZSkpIHtcbiAgICAgIHRoaXMubWF0Y2hUTm9kZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGVsZW1lbnRFbmQodE5vZGU6IFROb2RlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4ID09PSB0Tm9kZS5pbmRleCkge1xuICAgICAgdGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQgeyB0aGlzLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpOyB9XG5cbiAgZW1iZWRkZWRUVmlldyh0Tm9kZTogVE5vZGUsIGNoaWxkUXVlcnlJbmRleDogbnVtYmVyKTogVFF1ZXJ5fG51bGwge1xuICAgIGlmICh0aGlzLmlzQXBwbHlpbmdUb05vZGUodE5vZGUpKSB7XG4gICAgICB0aGlzLmNyb3NzZXNOZ1RlbXBsYXRlID0gdHJ1ZTtcbiAgICAgIC8vIEEgbWFya2VyIGluZGljYXRpbmcgYSBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudCAoYSBwbGFjZWhvbGRlciBmb3IgcXVlcnkgcmVzdWx0cyBmcm9tXG4gICAgICAvLyBlbWJlZGRlZCB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXMgYDxuZy10ZW1wbGF0ZT5gKS5cbiAgICAgIHRoaXMuYWRkTWF0Y2goLXROb2RlLmluZGV4LCBjaGlsZFF1ZXJ5SW5kZXgpO1xuICAgICAgcmV0dXJuIG5ldyBUUXVlcnlfKHRoaXMubWV0YWRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgaXNBcHBseWluZ1RvTm9kZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgJiYgdGhpcy5tZXRhZGF0YS5kZXNjZW5kYW50cyA9PT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uTm9kZUlkeCA9IHRoaXMuX2RlY2xhcmF0aW9uTm9kZUluZGV4O1xuICAgICAgbGV0IHBhcmVudCA9IHROb2RlLnBhcmVudDtcbiAgICAgIC8vIERldGVybWluZSBpZiBhIGdpdmVuIFROb2RlIGlzIGEgXCJkaXJlY3RcIiBjaGlsZCBvZiBhIG5vZGUgb24gd2hpY2ggYSBjb250ZW50IHF1ZXJ5IHdhc1xuICAgICAgLy8gZGVjbGFyZWQgKG9ubHkgZGlyZWN0IGNoaWxkcmVuIG9mIHF1ZXJ5J3MgaG9zdCBub2RlIGNhbiBtYXRjaCB3aXRoIHRoZSBkZXNjZW5kYW50czogZmFsc2VcbiAgICAgIC8vIG9wdGlvbikuIFRoZXJlIGFyZSAzIG1haW4gdXNlLWNhc2UgLyBjb25kaXRpb25zIHRvIGNvbnNpZGVyIGhlcmU6XG4gICAgICAvLyAtIDxuZWVkcy10YXJnZXQ+PGkgI3RhcmdldD48L2k+PC9uZWVkcy10YXJnZXQ+OiBoZXJlIDxpICN0YXJnZXQ+IHBhcmVudCBub2RlIGlzIGEgcXVlcnlcbiAgICAgIC8vIGhvc3Qgbm9kZTtcbiAgICAgIC8vIC0gPG5lZWRzLXRhcmdldD48bmctdGVtcGxhdGUgW25nSWZdPVwidHJ1ZVwiPjxpICN0YXJnZXQ+PC9pPjwvbmctdGVtcGxhdGU+PC9uZWVkcy10YXJnZXQ+OlxuICAgICAgLy8gaGVyZSA8aSAjdGFyZ2V0PiBwYXJlbnQgbm9kZSBpcyBudWxsO1xuICAgICAgLy8gLSA8bmVlZHMtdGFyZ2V0PjxuZy1jb250YWluZXI+PGkgI3RhcmdldD48L2k+PC9uZy1jb250YWluZXI+PC9uZWVkcy10YXJnZXQ+OiBoZXJlIHdlIG5lZWRcbiAgICAgIC8vIHRvIGdvIHBhc3QgYDxuZy1jb250YWluZXI+YCB0byBkZXRlcm1pbmUgPGkgI3RhcmdldD4gcGFyZW50IG5vZGUgKGJ1dCB3ZSBzaG91bGRuJ3QgdHJhdmVyc2VcbiAgICAgIC8vIHVwIHBhc3QgdGhlIHF1ZXJ5J3MgaG9zdCBub2RlISkuXG4gICAgICB3aGlsZSAocGFyZW50ICE9PSBudWxsICYmIHBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciAmJlxuICAgICAgICAgICAgIHBhcmVudC5pbmRleCAhPT0gZGVjbGFyYXRpb25Ob2RlSWR4KSB7XG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVjbGFyYXRpb25Ob2RlSWR4ID09PSAocGFyZW50ICE9PSBudWxsID8gcGFyZW50LmluZGV4IDogLTEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fYXBwbGllc1RvTmV4dE5vZGU7XG4gIH1cblxuICBwcml2YXRlIG1hdGNoVE5vZGUodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLm1ldGFkYXRhLnByZWRpY2F0ZSkpIHtcbiAgICAgIGNvbnN0IGxvY2FsTmFtZXMgPSB0aGlzLm1ldGFkYXRhLnByZWRpY2F0ZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldywgdE5vZGUsIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgbG9jYWxOYW1lc1tpXSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB0eXBlUHJlZGljYXRlID0gdGhpcy5tZXRhZGF0YS5wcmVkaWNhdGUgYXMgYW55O1xuICAgICAgaWYgKHR5cGVQcmVkaWNhdGUgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldywgdE5vZGUsIC0xKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tYXRjaFROb2RlV2l0aFJlYWRPcHRpb24oXG4gICAgICAgICAgICB0VmlldywgdE5vZGUsIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCB0eXBlUHJlZGljYXRlLCBmYWxzZSwgZmFsc2UpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbih0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbm9kZU1hdGNoSWR4OiBudW1iZXJ8bnVsbCk6IHZvaWQge1xuICAgIGlmIChub2RlTWF0Y2hJZHggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHJlYWQgPSB0aGlzLm1ldGFkYXRhLnJlYWQ7XG4gICAgICBpZiAocmVhZCAhPT0gbnVsbCkge1xuICAgICAgICBpZiAocmVhZCA9PT0gVmlld0VuZ2luZV9FbGVtZW50UmVmIHx8IHJlYWQgPT09IFZpZXdDb250YWluZXJSZWYgfHxcbiAgICAgICAgICAgIHJlYWQgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYgJiYgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIC0yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVPclByb3ZpZGVySWR4ID1cbiAgICAgICAgICAgICAgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHJlYWQsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIGRpcmVjdGl2ZU9yUHJvdmlkZXJJZHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hZGRNYXRjaCh0Tm9kZS5pbmRleCwgbm9kZU1hdGNoSWR4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFkZE1hdGNoKHROb2RlSWR4OiBudW1iZXIsIG1hdGNoSWR4OiBudW1iZXIpIHtcbiAgICBpZiAodGhpcy5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgICB0aGlzLm1hdGNoZXMgPSBbdE5vZGVJZHgsIG1hdGNoSWR4XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tYXRjaGVzLnB1c2godE5vZGVJZHgsIG1hdGNoSWR4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYW55IHtcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIG1hdGNoaW5nSWR4OiBudW1iZXIsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGlmIChtYXRjaGluZ0lkeCA9PT0gLTEpIHtcbiAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIGRldGVjdCBpdCB1c2luZyBhcHByb3ByaWF0ZSB0Tm9kZSB0eXBlXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3VsdEJ5VE5vZGVUeXBlKHROb2RlLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAobWF0Y2hpbmdJZHggPT09IC0yKSB7XG4gICAgLy8gcmVhZCBhIHNwZWNpYWwgdG9rZW4gZnJvbSBhIG5vZGUgaW5qZWN0b3JcbiAgICByZXR1cm4gY3JlYXRlU3BlY2lhbFRva2VuKGxWaWV3LCB0Tm9kZSwgcmVhZCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gcmVhZCBhIHRva2VuXG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCBsVmlld1tUVklFV10sIG1hdGNoaW5nSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNwZWNpYWxUb2tlbihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgcmVhZDogYW55KTogYW55IHtcbiAgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChyZWFkID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmKFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChyZWFkID09PSBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgICByZXR1cm4gY3JlYXRlQ29udGFpbmVyUmVmKFxuICAgICAgICBWaWV3Q29udGFpbmVyUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIHRocm93RXJyb3IoXG4gICAgICAgICAgICBgU3BlY2lhbCB0b2tlbiB0byByZWFkIHNob3VsZCBiZSBvbmUgb2YgRWxlbWVudFJlZiwgVGVtcGxhdGVSZWYgb3IgVmlld0NvbnRhaW5lclJlZiBidXQgZ290ICR7c3RyaW5naWZ5KHJlYWQpfS5gKTtcbiAgfVxufVxuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBxdWVyeSByZXN1bHRzIGZvciBhIGdpdmVuIHZpZXcuIFRoaXMgZnVuY3Rpb24gaXMgbWVhbnQgdG8gZG8gdGhlXG4gKiBwcm9jZXNzaW5nIG9uY2UgYW5kIG9ubHkgb25jZSBmb3IgYSBnaXZlbiB2aWV3IGluc3RhbmNlIChhIHNldCBvZiByZXN1bHRzIGZvciBhIGdpdmVuIHZpZXdcbiAqIGRvZXNuJ3QgY2hhbmdlKS5cbiAqL1xuZnVuY3Rpb24gbWF0ZXJpYWxpemVWaWV3UmVzdWx0czxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdFF1ZXJ5OiBUUXVlcnksIHF1ZXJ5SW5kZXg6IG51bWJlcik6IChUIHwgbnVsbClbXSB7XG4gIGNvbnN0IGxRdWVyeSA9IGxWaWV3W1FVRVJJRVNdICEucXVlcmllcyAhW3F1ZXJ5SW5kZXhdO1xuICBpZiAobFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICBjb25zdCB0Vmlld0RhdGEgPSB0Vmlldy5kYXRhO1xuICAgIGNvbnN0IHRRdWVyeU1hdGNoZXMgPSB0UXVlcnkubWF0Y2hlcyAhO1xuICAgIGNvbnN0IHJlc3VsdDogVHxudWxsW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRRdWVyeU1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IG1hdGNoZWROb2RlSWR4ID0gdFF1ZXJ5TWF0Y2hlc1tpXTtcbiAgICAgIGlmIChtYXRjaGVkTm9kZUlkeCA8IDApIHtcbiAgICAgICAgLy8gd2UgYXQgdGhlIDxuZy10ZW1wbGF0ZT4gbWFya2VyIHdoaWNoIG1pZ2h0IGhhdmUgcmVzdWx0cyBpbiB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXNcbiAgICAgICAgLy8gPG5nLXRlbXBsYXRlPiAtIHRob3NlIHJlc3VsdHMgd2lsbCBiZSBpbiBzZXBhcmF0ZSB2aWV3cyB0aG91Z2gsIHNvIGhlcmUgd2UganVzdCBsZWF2ZVxuICAgICAgICAvLyBudWxsIGFzIGEgcGxhY2Vob2xkZXJcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UodFZpZXdEYXRhLCBtYXRjaGVkTm9kZUlkeCk7XG4gICAgICAgIGNvbnN0IHROb2RlID0gdFZpZXdEYXRhW21hdGNoZWROb2RlSWR4XSBhcyBUTm9kZTtcbiAgICAgICAgcmVzdWx0LnB1c2goY3JlYXRlUmVzdWx0Rm9yTm9kZShsVmlldywgdE5vZGUsIHRRdWVyeU1hdGNoZXNbaSArIDFdLCB0UXVlcnkubWV0YWRhdGEucmVhZCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBsUXVlcnkubWF0Y2hlcyA9IHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBsUXVlcnkubWF0Y2hlcztcbn1cblxuLyoqXG4gKiBBIGhlbHBlciBmdW5jdGlvbiB0aGF0IGNvbGxlY3RzIChhbHJlYWR5IG1hdGVyaWFsaXplZCkgcXVlcnkgcmVzdWx0cyBmcm9tIGEgdHJlZSBvZiB2aWV3cyxcbiAqIHN0YXJ0aW5nIHdpdGggYSBwcm92aWRlZCBMVmlldy5cbiAqL1xuZnVuY3Rpb24gY29sbGVjdFF1ZXJ5UmVzdWx0czxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyLCByZXN1bHQ6IFRbXSk6IFRbXSB7XG4gIGNvbnN0IHRRdWVyeSA9IHRWaWV3LnF1ZXJpZXMgIS5nZXRCeUluZGV4KHF1ZXJ5SW5kZXgpO1xuICBjb25zdCB0UXVlcnlNYXRjaGVzID0gdFF1ZXJ5Lm1hdGNoZXM7XG4gIGlmICh0UXVlcnlNYXRjaGVzICE9PSBudWxsKSB7XG4gICAgY29uc3QgbFZpZXdSZXN1bHRzID0gbWF0ZXJpYWxpemVWaWV3UmVzdWx0czxUPih0VmlldywgbFZpZXcsIHRRdWVyeSwgcXVlcnlJbmRleCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRRdWVyeU1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IHROb2RlSWR4ID0gdFF1ZXJ5TWF0Y2hlc1tpXTtcbiAgICAgIGlmICh0Tm9kZUlkeCA+IDApIHtcbiAgICAgICAgY29uc3Qgdmlld1Jlc3VsdCA9IGxWaWV3UmVzdWx0c1tpIC8gMl07XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHZpZXdSZXN1bHQsICdtYXRlcmlhbGl6ZWQgcXVlcnkgcmVzdWx0IHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIHJlc3VsdC5wdXNoKHZpZXdSZXN1bHQgYXMgVCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSB0UXVlcnlNYXRjaGVzW2kgKyAxXTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1stdE5vZGVJZHhdIGFzIExDb250YWluZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uTENvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBpbnNlcnRlZCBpbiB0aGlzIGNvbnRhaW5lclxuICAgICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBkZWNsYXJhdGlvbkxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW2ldO1xuICAgICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdID09PSBlbWJlZGRlZExWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld1tUVklFV10sIGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGlzIGRlY2xhcmF0aW9uIGNvbnRhaW5lciBhbmQgaW5zZXJ0ZWQgaW50b1xuICAgICAgICAvLyBkaWZmZXJlbnQgY29udGFpbmVyc1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXdzID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW1iZWRkZWRMVmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBlbWJlZGRlZExWaWV3c1tpXTtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld1tUVklFV10sIGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqXG4gKiBAcmV0dXJucyBgdHJ1ZWAgaWYgYSBxdWVyeSBnb3QgZGlydHkgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gb3IgaWYgdGhpcyBpcyBhIHN0YXRpYyBxdWVyeVxuICogcmVzb2x2aW5nIGluIGNyZWF0aW9uIG1vZGUsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IHF1ZXJ5SW5kZXggPSBnZXRDdXJyZW50UXVlcnlJbmRleCgpO1xuXG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KHF1ZXJ5SW5kZXggKyAxKTtcblxuICBjb25zdCB0UXVlcnkgPSBnZXRUUXVlcnkodFZpZXcsIHF1ZXJ5SW5kZXgpO1xuICBpZiAocXVlcnlMaXN0LmRpcnR5ICYmIChpc0NyZWF0aW9uTW9kZShsVmlldykgPT09IHRRdWVyeS5tZXRhZGF0YS5pc1N0YXRpYykpIHtcbiAgICBpZiAodFF1ZXJ5Lm1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgIHF1ZXJ5TGlzdC5yZXNldChbXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRRdWVyeS5jcm9zc2VzTmdUZW1wbGF0ZSA/XG4gICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyh0VmlldywgbFZpZXcsIHF1ZXJ5SW5kZXgsIFtdKSA6XG4gICAgICAgICAgbWF0ZXJpYWxpemVWaWV3UmVzdWx0cyh0VmlldywgbFZpZXcsIHRRdWVyeSwgcXVlcnlJbmRleCk7XG4gICAgICBxdWVyeUxpc3QucmVzZXQocmVzdWx0KTtcbiAgICAgIHF1ZXJ5TGlzdC5ub3RpZnlPbkNoYW5nZXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBuZXcgUXVlcnlMaXN0IGZvciBhIHN0YXRpYyB2aWV3IHF1ZXJ5LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdGF0aWNWaWV3UXVlcnk8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkPzogYW55KTogdm9pZCB7XG4gIHZpZXdRdWVyeUludGVybmFsKGdldFRWaWV3KCksIGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgdHJ1ZSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBuZXcgUXVlcnlMaXN0LCBzdG9yZXMgdGhlIHJlZmVyZW5jZSBpbiBMVmlldyBhbmQgcmV0dXJucyBRdWVyeUxpc3QuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXZpZXdRdWVyeTxUPihwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgdmlld1F1ZXJ5SW50ZXJuYWwoZ2V0VFZpZXcoKSwgZ2V0TFZpZXcoKSwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHZpZXdRdWVyeUludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSxcbiAgICBpc1N0YXRpYzogYm9vbGVhbik6IHZvaWQge1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZGVzY2VuZCwgaXNTdGF0aWMsIHJlYWQpLCAtMSk7XG4gICAgaWYgKGlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNWaWV3UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG4gIGNyZWF0ZUxRdWVyeTxUPih0VmlldywgbFZpZXcpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2ggKHBhcnQgb2YgYSB2aWV3XG4gKiByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiB2b2lkIHtcbiAgY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBnZXRUVmlldygpLCBnZXRMVmlldygpLCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGZhbHNlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSxcbiAgICAgIGRpcmVjdGl2ZUluZGV4KTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIHN0YXRpYyBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaFxuICogKHBhcnQgb2YgYSB2aWV3IHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3RhdGljQ29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZD86IGFueSk6IHZvaWQge1xuICBjb250ZW50UXVlcnlJbnRlcm5hbChcbiAgICAgIGdldFRWaWV3KCksIGdldExWaWV3KCksIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgdHJ1ZSwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksXG4gICAgICBkaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRlbnRRdWVyeUludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSxcbiAgICBpc1N0YXRpYzogYm9vbGVhbiwgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjcmVhdGVUUXVlcnkodFZpZXcsIG5ldyBUUXVlcnlNZXRhZGF0YV8ocHJlZGljYXRlLCBkZXNjZW5kLCBpc1N0YXRpYywgcmVhZCksIHROb2RlLmluZGV4KTtcbiAgICBzYXZlQ29udGVudFF1ZXJ5QW5kRGlyZWN0aXZlSW5kZXgodFZpZXcsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICBpZiAoaXNTdGF0aWMpIHtcbiAgICAgIHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVMUXVlcnk8VD4odFZpZXcsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBMb2FkcyBhIFF1ZXJ5TGlzdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBjdXJyZW50IHZpZXcgb3IgY29udGVudCBxdWVyeS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxvYWRRdWVyeTxUPigpOiBRdWVyeUxpc3Q8VD4ge1xuICByZXR1cm4gbG9hZFF1ZXJ5SW50ZXJuYWw8VD4oZ2V0TFZpZXcoKSwgZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRRdWVyeUludGVybmFsPFQ+KGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGxWaWV3W1FVRVJJRVNdLCAnTFF1ZXJpZXMgc2hvdWxkIGJlIGRlZmluZWQgd2hlbiB0cnlpbmcgdG8gbG9hZCBhIHF1ZXJ5Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlld1tRVUVSSUVTXSAhLnF1ZXJpZXMsIHF1ZXJ5SW5kZXgpO1xuICByZXR1cm4gbFZpZXdbUVVFUklFU10gIS5xdWVyaWVzW3F1ZXJ5SW5kZXhdLnF1ZXJ5TGlzdDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTFF1ZXJ5PFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IHF1ZXJ5TGlzdCA9IG5ldyBRdWVyeUxpc3Q8VD4oKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQodFZpZXcsIGxWaWV3LCBxdWVyeUxpc3QsIHF1ZXJ5TGlzdC5kZXN0cm95KTtcblxuICBpZiAobFZpZXdbUVVFUklFU10gPT09IG51bGwpIGxWaWV3W1FVRVJJRVNdID0gbmV3IExRdWVyaWVzXygpO1xuICBsVmlld1tRVUVSSUVTXSAhLnF1ZXJpZXMucHVzaChuZXcgTFF1ZXJ5XyhxdWVyeUxpc3QpKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVFF1ZXJ5KHRWaWV3OiBUVmlldywgbWV0YWRhdGE6IFRRdWVyeU1ldGFkYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBpZiAodFZpZXcucXVlcmllcyA9PT0gbnVsbCkgdFZpZXcucXVlcmllcyA9IG5ldyBUUXVlcmllc18oKTtcbiAgdFZpZXcucXVlcmllcy50cmFjayhuZXcgVFF1ZXJ5XyhtZXRhZGF0YSwgbm9kZUluZGV4KSk7XG59XG5cbmZ1bmN0aW9uIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldzogVFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXdDb250ZW50UXVlcmllc1t0Vmlld0NvbnRlbnRRdWVyaWVzLmxlbmd0aCAtIDFdIDogLTE7XG4gIGlmIChkaXJlY3RpdmVJbmRleCAhPT0gbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXgpIHtcbiAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2godFZpZXcucXVlcmllcyAhLmxlbmd0aCAtIDEsIGRpcmVjdGl2ZUluZGV4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRUUXVlcnkodFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyKTogVFF1ZXJ5IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcucXVlcmllcywgJ1RRdWVyaWVzIG11c3QgYmUgZGVmaW5lZCB0byByZXRyaWV2ZSBhIFRRdWVyeScpO1xuICByZXR1cm4gdFZpZXcucXVlcmllcyAhLmdldEJ5SW5kZXgoaW5kZXgpO1xufVxuIl19