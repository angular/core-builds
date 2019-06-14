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
import { assertDataInRange, assertDefined, assertEqual } from '../util/assert';
import { assertPreviousIsParent } from './assert';
import { getNodeInjectable, locateDirectiveOrProvider } from './di';
import { NG_ELEMENT_ID } from './fields';
import { store } from './instructions/all';
import { storeCleanupWithContext } from './instructions/shared';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { CONTENT_QUERIES, HEADER_OFFSET, QUERIES, TVIEW } from './interfaces/view';
import { getCurrentQueryIndex, getIsParent, getLView, getPreviousOrParentTNode, isCreationMode, setCurrentQueryIndex } from './state';
import { isContentQueryHost, loadInternal } from './util/view_utils';
import { createElementRef, createTemplateRef } from './view_engine_compatibility';
var unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
/**
 * An object representing a query, which is a combination of:
 * - query predicate to determines if a given element/directive should be included in the query
 * - values collected based on a predicate
 * - `QueryList` to which collected values should be reported
 */
var LQuery = /** @class */ (function () {
    function LQuery(
    /**
     * Next query. Used when queries are stored as a linked list in `LQueries`.
     */
    next, 
    /**
     * Destination to which the value should be added.
     */
    list, 
    /**
     * A predicate which determines if a given element/directive should be included in the query
     * results.
     */
    predicate, 
    /**
     * Values which have been located.
     * This is what builds up the `QueryList._valuesTree`.
     */
    values, 
    /**
     * A pointer to an array that stores collected values from views. This is necessary so we
     * know a container into which to insert nodes collected from views.
     */
    containerValues) {
        this.next = next;
        this.list = list;
        this.predicate = predicate;
        this.values = values;
        this.containerValues = containerValues;
    }
    return LQuery;
}());
var LQueries_ = /** @class */ (function () {
    function LQueries_(parent, shallow, deep, nodeIndex) {
        if (nodeIndex === void 0) { nodeIndex = -1; }
        this.parent = parent;
        this.shallow = shallow;
        this.deep = deep;
        this.nodeIndex = nodeIndex;
    }
    LQueries_.prototype.track = function (queryList, predicate, descend, read) {
        if (descend) {
            this.deep = createLQuery(this.deep, queryList, predicate, read != null ? read : null);
        }
        else {
            this.shallow = createLQuery(this.shallow, queryList, predicate, read != null ? read : null);
        }
    };
    LQueries_.prototype.clone = function (tNode) {
        return this.shallow !== null || isContentQueryHost(tNode) ?
            new LQueries_(this, null, this.deep, tNode.index) :
            this;
    };
    LQueries_.prototype.container = function () {
        var shallowResults = copyQueriesToContainer(this.shallow);
        var deepResults = copyQueriesToContainer(this.deep);
        return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
    };
    LQueries_.prototype.createView = function () {
        var shallowResults = copyQueriesToView(this.shallow);
        var deepResults = copyQueriesToView(this.deep);
        return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
    };
    LQueries_.prototype.insertView = function (index) {
        insertView(index, this.shallow);
        insertView(index, this.deep);
    };
    LQueries_.prototype.addNode = function (tNode) {
        add(this.deep, tNode, false);
        add(this.shallow, tNode, false);
    };
    LQueries_.prototype.insertNodeBeforeViews = function (tNode) {
        add(this.deep, tNode, true);
        add(this.shallow, tNode, true);
    };
    LQueries_.prototype.removeView = function () {
        removeView(this.shallow);
        removeView(this.deep);
    };
    return LQueries_;
}());
export { LQueries_ };
function copyQueriesToContainer(query) {
    var result = null;
    while (query) {
        var containerValues = []; // prepare room for views
        query.values.push(containerValues);
        result = new LQuery(result, query.list, query.predicate, containerValues, null);
        query = query.next;
    }
    return result;
}
function copyQueriesToView(query) {
    var result = null;
    while (query) {
        result = new LQuery(result, query.list, query.predicate, [], query.values);
        query = query.next;
    }
    return result;
}
function insertView(index, query) {
    while (query) {
        ngDevMode && assertViewQueryhasPointerToDeclarationContainer(query);
        query.containerValues.splice(index, 0, query.values);
        // mark a query as dirty only when inserted view had matching modes
        if (query.values.length) {
            query.list.setDirty();
        }
        query = query.next;
    }
}
function removeView(query) {
    while (query) {
        ngDevMode && assertViewQueryhasPointerToDeclarationContainer(query);
        var containerValues = query.containerValues;
        var viewValuesIdx = containerValues.indexOf(query.values);
        var removed = containerValues.splice(viewValuesIdx, 1);
        // mark a query as dirty only when removed view had matching modes
        ngDevMode && assertEqual(removed.length, 1, 'removed.length');
        if (removed[0].length) {
            query.list.setDirty();
        }
        query = query.next;
    }
}
function assertViewQueryhasPointerToDeclarationContainer(query) {
    assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
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
    var localNames = tNode.localNames;
    if (localNames) {
        for (var i = 0; i < localNames.length; i += 2) {
            if (localNames[i] === selector) {
                return localNames[i + 1];
            }
        }
    }
    return null;
}
// TODO: "read" should be an AbstractType (FW-486)
function queryByReadToken(read, tNode, currentView) {
    var factoryFn = read[NG_ELEMENT_ID];
    if (typeof factoryFn === 'function') {
        return factoryFn();
    }
    else {
        var tView = currentView[TVIEW];
        var matchingIdx = locateDirectiveOrProvider(tNode, tView, read, false, false);
        if (matchingIdx !== null) {
            return getNodeInjectable(tView.data, currentView, matchingIdx, tNode);
        }
    }
    return null;
}
function queryByTNodeType(tNode, currentView) {
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        return createElementRef(ViewEngine_ElementRef, tNode, currentView);
    }
    if (tNode.type === 0 /* Container */) {
        return createTemplateRef(ViewEngine_TemplateRef, ViewEngine_ElementRef, tNode, currentView);
    }
    return null;
}
function queryByTemplateRef(templateRefToken, tNode, currentView, read) {
    var templateRefResult = templateRefToken[NG_ELEMENT_ID]();
    if (read) {
        return templateRefResult ? queryByReadToken(read, tNode, currentView) : null;
    }
    return templateRefResult;
}
function queryRead(tNode, currentView, read, matchingIdx) {
    if (read) {
        return queryByReadToken(read, tNode, currentView);
    }
    if (matchingIdx > -1) {
        return getNodeInjectable(currentView[TVIEW].data, currentView, matchingIdx, tNode);
    }
    // if read token and / or strategy is not specified,
    // detect it using appropriate tNode type
    return queryByTNodeType(tNode, currentView);
}
/**
 * Add query matches for a given node.
 *
 * @param query The first query in the linked list
 * @param tNode The TNode to match against queries
 * @param insertBeforeContainer Whether or not we should add matches before the last
 * container array. This mode is necessary if the query container had to be created
 * out of order (e.g. a view was created in a constructor)
 */
function add(query, tNode, insertBeforeContainer) {
    var lView = getLView();
    var tView = lView[TVIEW];
    while (query) {
        var predicate = query.predicate;
        var type = predicate.type;
        if (type) {
            var result = null;
            if (type === ViewEngine_TemplateRef) {
                result = queryByTemplateRef(type, tNode, lView, predicate.read);
            }
            else {
                var matchingIdx = locateDirectiveOrProvider(tNode, tView, type, false, false);
                if (matchingIdx !== null) {
                    result = queryRead(tNode, lView, predicate.read, matchingIdx);
                }
            }
            if (result !== null) {
                addMatch(query, result, insertBeforeContainer);
            }
        }
        else {
            var selector = predicate.selector;
            for (var i = 0; i < selector.length; i++) {
                var matchingIdx = getIdxOfMatchingSelector(tNode, selector[i]);
                if (matchingIdx !== null) {
                    var result = queryRead(tNode, lView, predicate.read, matchingIdx);
                    if (result !== null) {
                        addMatch(query, result, insertBeforeContainer);
                    }
                }
            }
        }
        query = query.next;
    }
}
function addMatch(query, matchingValue, insertBeforeViewMatches) {
    // Views created in constructors may have their container values created too early. In this case,
    // ensure template node results are unshifted before container results. Otherwise, results inside
    // embedded views will appear before results on parent template nodes when flattened.
    insertBeforeViewMatches ? query.values.unshift(matchingValue) : query.values.push(matchingValue);
    query.list.setDirty();
}
function createPredicate(predicate, read) {
    var isArray = Array.isArray(predicate);
    return {
        type: isArray ? null : predicate,
        selector: isArray ? predicate : null,
        read: read
    };
}
function createLQuery(previous, queryList, predicate, read) {
    return new LQuery(previous, queryList, createPredicate(predicate, read), queryList._valuesTree, null);
}
/**
 * Creates a QueryList and stores it in LView's collection of active queries (LQueries).
 *
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 * @returns QueryList<T>
 */
function createQueryListInLView(
// TODO: "read" should be an AbstractType (FW-486)
lView, predicate, descend, read, isStatic, nodeIndex) {
    ngDevMode && assertPreviousIsParent(getIsParent());
    var queryList = new QueryList();
    var queries = lView[QUERIES] || (lView[QUERIES] = new LQueries_(null, null, null, nodeIndex));
    queryList._valuesTree = [];
    queryList._static = isStatic;
    queries.track(queryList, predicate, descend, read);
    storeCleanupWithContext(lView, queryList, queryList.destroy);
    return queryList;
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
    var queryListImpl = queryList;
    var creationMode = isCreationMode();
    // if creation mode and static or update mode and not static
    if (queryList.dirty && creationMode === queryListImpl._static) {
        queryList.reset(queryListImpl._valuesTree || []);
        queryList.notifyOnChanges();
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
export function ɵɵstaticViewQuery(
// TODO(FW-486): "read" should be an AbstractType
predicate, descend, read) {
    var lView = getLView();
    var tView = lView[TVIEW];
    viewQueryInternal(lView, tView, predicate, descend, read, true);
    tView.staticViewQueries = true;
}
/**
 * Creates new QueryList, stores the reference in LView and returns QueryList.
 *
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 * @returns QueryList<T>
 *
 * @codeGenApi
 */
export function ɵɵviewQuery(
// TODO(FW-486): "read" should be an AbstractType
predicate, descend, read) {
    var lView = getLView();
    var tView = lView[TVIEW];
    return viewQueryInternal(lView, tView, predicate, descend, read, false);
}
function viewQueryInternal(lView, tView, predicate, descend, read, isStatic) {
    if (tView.firstTemplatePass) {
        tView.expandoStartIndex++;
    }
    var index = getCurrentQueryIndex();
    var queryList = createQueryListInLView(lView, predicate, descend, read, isStatic, -1);
    store(index - HEADER_OFFSET, queryList);
    setCurrentQueryIndex(index + 1);
    return queryList;
}
/**
 * Loads current View Query and moves the pointer/index to the next View Query in LView.
 *
 * @codeGenApi
 */
export function ɵɵloadViewQuery() {
    var index = getCurrentQueryIndex();
    setCurrentQueryIndex(index + 1);
    return loadInternal(getLView(), index - HEADER_OFFSET);
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
export function ɵɵcontentQuery(directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read) {
    var lView = getLView();
    var tView = lView[TVIEW];
    var tNode = getPreviousOrParentTNode();
    return contentQueryInternal(lView, tView, directiveIndex, predicate, descend, read, false, tNode.index);
}
function contentQueryInternal(lView, tView, directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read, isStatic, nodeIndex) {
    var contentQuery = createQueryListInLView(lView, predicate, descend, read, isStatic, nodeIndex);
    (lView[CONTENT_QUERIES] || (lView[CONTENT_QUERIES] = [])).push(contentQuery);
    if (tView.firstTemplatePass) {
        var tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
        var lastSavedDirectiveIndex = tView.contentQueries.length ? tView.contentQueries[tView.contentQueries.length - 1] : -1;
        if (directiveIndex !== lastSavedDirectiveIndex) {
            tViewContentQueries.push(directiveIndex);
        }
    }
    return contentQuery;
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
export function ɵɵstaticContentQuery(directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read) {
    var lView = getLView();
    var tView = lView[TVIEW];
    var tNode = getPreviousOrParentTNode();
    contentQueryInternal(lView, tView, directiveIndex, predicate, descend, read, true, tNode.index);
    tView.staticContentQueries = true;
}
/**
 *
 * @codeGenApi
 */
export function ɵɵloadContentQuery() {
    var lView = getLView();
    ngDevMode &&
        assertDefined(lView[CONTENT_QUERIES], 'Content QueryList array should be defined if reading a query.');
    var index = getCurrentQueryIndex();
    ngDevMode && assertDataInRange(lView[CONTENT_QUERIES], index);
    setCurrentQueryIndex(index + 1);
    return lView[CONTENT_QUERIES][index];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzdFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0UsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNsRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9FLE9BQU8sRUFBd0UsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbEosT0FBTyxFQUFXLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3RGLE9BQU8sRUFBQyxlQUFlLEVBQUUsYUFBYSxFQUFTLE9BQU8sRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUMvRixPQUFPLEVBQUMsb0JBQW9CLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxjQUFjLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDcEksT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBRWhGLElBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBdUJ0RTs7Ozs7R0FLRztBQUNIO0lBQ0U7SUFDSTs7T0FFRztJQUNJLElBQXNCO0lBRTdCOztPQUVHO0lBQ0ksSUFBa0I7SUFFekI7OztPQUdHO0lBQ0ksU0FBNEI7SUFFbkM7OztPQUdHO0lBQ0ksTUFBYTtJQUVwQjs7O09BR0c7SUFDSSxlQUEyQjtRQXZCM0IsU0FBSSxHQUFKLElBQUksQ0FBa0I7UUFLdEIsU0FBSSxHQUFKLElBQUksQ0FBYztRQU1sQixjQUFTLEdBQVQsU0FBUyxDQUFtQjtRQU01QixXQUFNLEdBQU4sTUFBTSxDQUFPO1FBTWIsb0JBQWUsR0FBZixlQUFlLENBQVk7SUFBRyxDQUFDO0lBQzVDLGFBQUM7QUFBRCxDQUFDLEFBN0JELElBNkJDO0FBRUQ7SUFDRSxtQkFDVyxNQUFzQixFQUFVLE9BQXlCLEVBQ3hELElBQXNCLEVBQVMsU0FBc0I7UUFBdEIsMEJBQUEsRUFBQSxhQUFxQixDQUFDO1FBRHRELFdBQU0sR0FBTixNQUFNLENBQWdCO1FBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBa0I7UUFDeEQsU0FBSSxHQUFKLElBQUksQ0FBa0I7UUFBUyxjQUFTLEdBQVQsU0FBUyxDQUFhO0lBQUcsQ0FBQztJQUVyRSx5QkFBSyxHQUFMLFVBQVMsU0FBdUIsRUFBRSxTQUEyQixFQUFFLE9BQWlCLEVBQUUsSUFBYztRQUU5RixJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZGO2FBQU07WUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3RjtJQUNILENBQUM7SUFFRCx5QkFBSyxHQUFMLFVBQU0sS0FBWTtRQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssSUFBSSxJQUFJLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdkQsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQztJQUNYLENBQUM7SUFFRCw2QkFBUyxHQUFUO1FBQ0UsSUFBTSxjQUFjLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVELElBQU0sV0FBVyxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0RCxPQUFPLGNBQWMsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNqRyxDQUFDO0lBRUQsOEJBQVUsR0FBVjtRQUNFLElBQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2RCxJQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFakQsT0FBTyxjQUFjLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDakcsQ0FBQztJQUVELDhCQUFVLEdBQVYsVUFBVyxLQUFhO1FBQ3RCLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCwyQkFBTyxHQUFQLFVBQVEsS0FBd0Q7UUFDOUQsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdCLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQseUNBQXFCLEdBQXJCLFVBQXNCLEtBQXdEO1FBQzVFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1QixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELDhCQUFVLEdBQVY7UUFDRSxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pCLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQXBERCxJQW9EQzs7QUFFRCxTQUFTLHNCQUFzQixDQUFDLEtBQXdCO0lBQ3RELElBQUksTUFBTSxHQUFxQixJQUFJLENBQUM7SUFFcEMsT0FBTyxLQUFLLEVBQUU7UUFDWixJQUFNLGVBQWUsR0FBVSxFQUFFLENBQUMsQ0FBRSx5QkFBeUI7UUFDN0QsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFNLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JGLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0tBQ3BCO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBd0I7SUFDakQsSUFBSSxNQUFNLEdBQXFCLElBQUksQ0FBQztJQUVwQyxPQUFPLEtBQUssRUFBRTtRQUNaLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBTSxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEYsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7S0FDcEI7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsS0FBYSxFQUFFLEtBQXdCO0lBQ3pELE9BQU8sS0FBSyxFQUFFO1FBQ1osU0FBUyxJQUFJLCtDQUErQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLEtBQUssQ0FBQyxlQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV2RCxtRUFBbUU7UUFDbkUsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUN2QixLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ3ZCO1FBRUQsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7S0FDcEI7QUFDSCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsS0FBd0I7SUFDMUMsT0FBTyxLQUFLLEVBQUU7UUFDWixTQUFTLElBQUksK0NBQStDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFcEUsSUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWlCLENBQUM7UUFDaEQsSUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUQsSUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFekQsa0VBQWtFO1FBQ2xFLFNBQVMsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUM5RCxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7WUFDckIsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUN2QjtRQUVELEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0tBQ3BCO0FBQ0gsQ0FBQztBQUVELFNBQVMsK0NBQStDLENBQUMsS0FBa0I7SUFDekUsYUFBYSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsMERBQTBELENBQUMsQ0FBQztBQUNuRyxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILFNBQVMsd0JBQXdCLENBQUMsS0FBWSxFQUFFLFFBQWdCO0lBQzlELElBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7SUFDcEMsSUFBSSxVQUFVLEVBQUU7UUFDZCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzdDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtnQkFDOUIsT0FBTyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBVyxDQUFDO2FBQ3BDO1NBQ0Y7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUdELGtEQUFrRDtBQUNsRCxTQUFTLGdCQUFnQixDQUFDLElBQVMsRUFBRSxLQUFZLEVBQUUsV0FBa0I7SUFDbkUsSUFBTSxTQUFTLEdBQUksSUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQy9DLElBQUksT0FBTyxTQUFTLEtBQUssVUFBVSxFQUFFO1FBQ25DLE9BQU8sU0FBUyxFQUFFLENBQUM7S0FDcEI7U0FBTTtRQUNMLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxJQUFNLFdBQVcsR0FBRyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQWlCLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdGLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtZQUN4QixPQUFPLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxLQUFxQixDQUFDLENBQUM7U0FDdkY7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsS0FBWSxFQUFFLFdBQWtCO0lBQ3hELElBQUksS0FBSyxDQUFDLElBQUksb0JBQXNCLElBQUksS0FBSyxDQUFDLElBQUksNkJBQStCLEVBQUU7UUFDakYsT0FBTyxnQkFBZ0IsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDcEU7SUFDRCxJQUFJLEtBQUssQ0FBQyxJQUFJLHNCQUF3QixFQUFFO1FBQ3RDLE9BQU8saUJBQWlCLENBQUMsc0JBQXNCLEVBQUUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQzdGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FDdkIsZ0JBQTZDLEVBQUUsS0FBWSxFQUFFLFdBQWtCLEVBQy9FLElBQVM7SUFDWCxJQUFNLGlCQUFpQixHQUFJLGdCQUF3QixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7SUFDckUsSUFBSSxJQUFJLEVBQUU7UUFDUixPQUFPLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FDOUU7SUFDRCxPQUFPLGlCQUFpQixDQUFDO0FBQzNCLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFZLEVBQUUsV0FBa0IsRUFBRSxJQUFTLEVBQUUsV0FBbUI7SUFDakYsSUFBSSxJQUFJLEVBQUU7UUFDUixPQUFPLGdCQUFnQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDbkQ7SUFDRCxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsRUFBRTtRQUNwQixPQUFPLGlCQUFpQixDQUNwQixXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsS0FBcUIsQ0FBQyxDQUFDO0tBQy9FO0lBQ0Qsb0RBQW9EO0lBQ3BELHlDQUF5QztJQUN6QyxPQUFPLGdCQUFnQixDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLEdBQUcsQ0FDUixLQUF3QixFQUFFLEtBQTRELEVBQ3RGLHFCQUE4QjtJQUNoQyxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFM0IsT0FBTyxLQUFLLEVBQUU7UUFDWixJQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQ2xDLElBQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFXLENBQUM7UUFDbkMsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxJQUFJLEtBQUssc0JBQXNCLEVBQUU7Z0JBQ25DLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDakU7aUJBQU07Z0JBQ0wsSUFBTSxXQUFXLEdBQUcseUJBQXlCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNoRixJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7b0JBQ3hCLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2lCQUMvRDthQUNGO1lBQ0QsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO2dCQUNuQixRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO2FBQ2hEO1NBQ0Y7YUFBTTtZQUNMLElBQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFVLENBQUM7WUFDdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3hDLElBQU0sV0FBVyxHQUFHLHdCQUF3QixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakUsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO29CQUN4QixJQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO29CQUNwRSxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7d0JBQ25CLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLHFCQUFxQixDQUFDLENBQUM7cUJBQ2hEO2lCQUNGO2FBQ0Y7U0FDRjtRQUNELEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0tBQ3BCO0FBQ0gsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLEtBQWtCLEVBQUUsYUFBa0IsRUFBRSx1QkFBZ0M7SUFDeEYsaUdBQWlHO0lBQ2pHLGlHQUFpRztJQUNqRyxxRkFBcUY7SUFDckYsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNqRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBSSxTQUE0QixFQUFFLElBQW1CO0lBQzNFLElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDekMsT0FBTztRQUNMLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBb0I7UUFDM0MsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSTtRQUNoRCxJQUFJLEVBQUUsSUFBSTtLQUNYLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxZQUFZLENBQ2pCLFFBQTJCLEVBQUUsU0FBdUIsRUFBRSxTQUE0QixFQUNsRixJQUFtQjtJQUNyQixPQUFPLElBQUksTUFBTSxDQUNiLFFBQVEsRUFBRSxTQUFTLEVBQUUsZUFBZSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFDcEQsU0FBa0MsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUlEOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLHNCQUFzQjtBQUMzQixrREFBa0Q7QUFDbEQsS0FBWSxFQUFFLFNBQThCLEVBQUUsT0FBZ0IsRUFBRSxJQUFTLEVBQUUsUUFBaUIsRUFDNUYsU0FBaUI7SUFDbkIsU0FBUyxJQUFJLHNCQUFzQixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDbkQsSUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFTLEVBQXNCLENBQUM7SUFDdEQsSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDaEcsU0FBUyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFDM0IsU0FBUyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7SUFDN0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRCx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3RCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLFNBQXlCO0lBQ3RELElBQU0sYUFBYSxHQUFJLFNBQW9DLENBQUM7SUFDNUQsSUFBTSxZQUFZLEdBQUcsY0FBYyxFQUFFLENBQUM7SUFFdEMsNERBQTREO0lBQzVELElBQUksU0FBUyxDQUFDLEtBQUssSUFBSSxZQUFZLEtBQUssYUFBYSxDQUFDLE9BQU8sRUFBRTtRQUM3RCxTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDLENBQUM7UUFDakQsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzVCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxpQkFBaUI7QUFDN0IsaURBQWlEO0FBQ2pELFNBQThCLEVBQUUsT0FBZ0IsRUFBRSxJQUFTO0lBQzdELElBQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2hFLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7QUFDakMsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxXQUFXO0FBQ3ZCLGlEQUFpRDtBQUNqRCxTQUE4QixFQUFFLE9BQWdCLEVBQUUsSUFBUztJQUM3RCxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUN0QixLQUFZLEVBQUUsS0FBWSxFQUFFLFNBQThCLEVBQUUsT0FBZ0IsRUFBRSxJQUFTLEVBQ3ZGLFFBQWlCO0lBQ25CLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBQzNCLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0tBQzNCO0lBQ0QsSUFBTSxLQUFLLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztJQUNyQyxJQUFNLFNBQVMsR0FDWCxzQkFBc0IsQ0FBSSxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0UsS0FBSyxDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsb0JBQW9CLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGVBQWU7SUFDN0IsSUFBTSxLQUFLLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztJQUNyQyxvQkFBb0IsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDaEMsT0FBTyxZQUFZLENBQUksUUFBUSxFQUFFLEVBQUUsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQzFCLGNBQXNCLEVBQUUsU0FBOEIsRUFBRSxPQUFnQjtBQUN4RSxpREFBaUQ7QUFDakQsSUFBUztJQUNYLElBQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixJQUFNLEtBQUssR0FBRyx3QkFBd0IsRUFBRSxDQUFDO0lBQ3pDLE9BQU8sb0JBQW9CLENBQ3ZCLEtBQUssRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbEYsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQ3pCLEtBQVksRUFBRSxLQUFZLEVBQUUsY0FBc0IsRUFBRSxTQUE4QixFQUNsRixPQUFnQjtBQUNoQixpREFBaUQ7QUFDakQsSUFBUyxFQUFFLFFBQWlCLEVBQUUsU0FBaUI7SUFDakQsSUFBTSxZQUFZLEdBQ2Qsc0JBQXNCLENBQUksS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNwRixDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUM3RSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUMzQixJQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ2hGLElBQU0sdUJBQXVCLEdBQ3pCLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RixJQUFJLGNBQWMsS0FBSyx1QkFBdUIsRUFBRTtZQUM5QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDMUM7S0FDRjtJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsY0FBc0IsRUFBRSxTQUE4QixFQUFFLE9BQWdCO0FBQ3hFLGlEQUFpRDtBQUNqRCxJQUFTO0lBQ1gsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLElBQU0sS0FBSyxHQUFHLHdCQUF3QixFQUFFLENBQUM7SUFDekMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoRyxLQUFLLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCO0lBQ2hDLElBQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLFNBQVM7UUFDTCxhQUFhLENBQ1QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLCtEQUErRCxDQUFDLENBQUM7SUFFakcsSUFBTSxLQUFLLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztJQUNyQyxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWhFLG9CQUFvQixDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNoQyxPQUFPLEtBQUssQ0FBQyxlQUFlLENBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YXNzZXJ0UHJldmlvdXNJc1BhcmVudH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0YWJsZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge05HX0VMRU1FTlRfSUR9IGZyb20gJy4vZmllbGRzJztcbmltcG9ydCB7c3RvcmV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2FsbCc7XG5pbXBvcnQge3N0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7Q09OVEVOVF9RVUVSSUVTLCBIRUFERVJfT0ZGU0VULCBMVmlldywgUVVFUklFUywgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEN1cnJlbnRRdWVyeUluZGV4LCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgaXNDcmVhdGlvbk1vZGUsIHNldEN1cnJlbnRRdWVyeUluZGV4fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDb250ZW50UXVlcnlIb3N0LCBsb2FkSW50ZXJuYWx9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgY3JlYXRlVGVtcGxhdGVSZWZ9IGZyb20gJy4vdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eSc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNDtcblxuLyoqXG4gKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogcmVzdWx0cy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIC8qKlxuICAgKiBJZiBsb29raW5nIGZvciBkaXJlY3RpdmVzIHRoZW4gaXQgY29udGFpbnMgdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICAgKi9cbiAgdHlwZTogVHlwZTxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBJZiBzZWxlY3RvciB0aGVuIGNvbnRhaW5zIGxvY2FsIG5hbWVzIHRvIHF1ZXJ5IGZvci5cbiAgICovXG4gIHNlbGVjdG9yOiBzdHJpbmdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hpY2ggdG9rZW4gc2hvdWxkIGJlIHJlYWQgZnJvbSBESSBmb3IgdGhpcyBxdWVyeS5cbiAgICovXG4gIHJlYWQ6IFR5cGU8VD58bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBvYmplY3QgcmVwcmVzZW50aW5nIGEgcXVlcnksIHdoaWNoIGlzIGEgY29tYmluYXRpb24gb2Y6XG4gKiAtIHF1ZXJ5IHByZWRpY2F0ZSB0byBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogLSB2YWx1ZXMgY29sbGVjdGVkIGJhc2VkIG9uIGEgcHJlZGljYXRlXG4gKiAtIGBRdWVyeUxpc3RgIHRvIHdoaWNoIGNvbGxlY3RlZCB2YWx1ZXMgc2hvdWxkIGJlIHJlcG9ydGVkXG4gKi9cbmNsYXNzIExRdWVyeTxUPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqXG4gICAgICAgKiBOZXh0IHF1ZXJ5LiBVc2VkIHdoZW4gcXVlcmllcyBhcmUgc3RvcmVkIGFzIGEgbGlua2VkIGxpc3QgaW4gYExRdWVyaWVzYC5cbiAgICAgICAqL1xuICAgICAgcHVibGljIG5leHQ6IExRdWVyeTxhbnk+fG51bGwsXG5cbiAgICAgIC8qKlxuICAgICAgICogRGVzdGluYXRpb24gdG8gd2hpY2ggdGhlIHZhbHVlIHNob3VsZCBiZSBhZGRlZC5cbiAgICAgICAqL1xuICAgICAgcHVibGljIGxpc3Q6IFF1ZXJ5TGlzdDxUPixcblxuICAgICAgLyoqXG4gICAgICAgKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICAgICAgICogcmVzdWx0cy5cbiAgICAgICAqL1xuICAgICAgcHVibGljIHByZWRpY2F0ZTogUXVlcnlQcmVkaWNhdGU8VD4sXG5cbiAgICAgIC8qKlxuICAgICAgICogVmFsdWVzIHdoaWNoIGhhdmUgYmVlbiBsb2NhdGVkLlxuICAgICAgICogVGhpcyBpcyB3aGF0IGJ1aWxkcyB1cCB0aGUgYFF1ZXJ5TGlzdC5fdmFsdWVzVHJlZWAuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyB2YWx1ZXM6IGFueVtdLFxuXG4gICAgICAvKipcbiAgICAgICAqIEEgcG9pbnRlciB0byBhbiBhcnJheSB0aGF0IHN0b3JlcyBjb2xsZWN0ZWQgdmFsdWVzIGZyb20gdmlld3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHdlXG4gICAgICAgKiBrbm93IGEgY29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IG5vZGVzIGNvbGxlY3RlZCBmcm9tIHZpZXdzLlxuICAgICAgICovXG4gICAgICBwdWJsaWMgY29udGFpbmVyVmFsdWVzOiBhbnlbXXxudWxsKSB7fVxufVxuXG5leHBvcnQgY2xhc3MgTFF1ZXJpZXNfIGltcGxlbWVudHMgTFF1ZXJpZXMge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBwYXJlbnQ6IExRdWVyaWVzX3xudWxsLCBwcml2YXRlIHNoYWxsb3c6IExRdWVyeTxhbnk+fG51bGwsXG4gICAgICBwcml2YXRlIGRlZXA6IExRdWVyeTxhbnk+fG51bGwsIHB1YmxpYyBub2RlSW5kZXg6IG51bWJlciA9IC0xKSB7fVxuXG4gIHRyYWNrPFQ+KHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58c3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLCByZWFkPzogVHlwZTxUPik6XG4gICAgICB2b2lkIHtcbiAgICBpZiAoZGVzY2VuZCkge1xuICAgICAgdGhpcy5kZWVwID0gY3JlYXRlTFF1ZXJ5KHRoaXMuZGVlcCwgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFsbG93ID0gY3JlYXRlTFF1ZXJ5KHRoaXMuc2hhbGxvdywgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9XG4gIH1cblxuICBjbG9uZSh0Tm9kZTogVE5vZGUpOiBMUXVlcmllcyB7XG4gICAgcmV0dXJuIHRoaXMuc2hhbGxvdyAhPT0gbnVsbCB8fCBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUpID9cbiAgICAgICAgbmV3IExRdWVyaWVzXyh0aGlzLCBudWxsLCB0aGlzLmRlZXAsIHROb2RlLmluZGV4KSA6XG4gICAgICAgIHRoaXM7XG4gIH1cblxuICBjb250YWluZXIoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3Qgc2hhbGxvd1Jlc3VsdHMgPSBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHRoaXMuc2hhbGxvdyk7XG4gICAgY29uc3QgZGVlcFJlc3VsdHMgPSBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHRoaXMuZGVlcCk7XG4gICAgcmV0dXJuIHNoYWxsb3dSZXN1bHRzIHx8IGRlZXBSZXN1bHRzID8gbmV3IExRdWVyaWVzXyh0aGlzLCBzaGFsbG93UmVzdWx0cywgZGVlcFJlc3VsdHMpIDogbnVsbDtcbiAgfVxuXG4gIGNyZWF0ZVZpZXcoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3Qgc2hhbGxvd1Jlc3VsdHMgPSBjb3B5UXVlcmllc1RvVmlldyh0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb1ZpZXcodGhpcy5kZWVwKTtcblxuICAgIHJldHVybiBzaGFsbG93UmVzdWx0cyB8fCBkZWVwUmVzdWx0cyA/IG5ldyBMUXVlcmllc18odGhpcywgc2hhbGxvd1Jlc3VsdHMsIGRlZXBSZXN1bHRzKSA6IG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpbnNlcnRWaWV3KGluZGV4LCB0aGlzLnNoYWxsb3cpO1xuICAgIGluc2VydFZpZXcoaW5kZXgsIHRoaXMuZGVlcCk7XG4gIH1cblxuICBhZGROb2RlKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogdm9pZCB7XG4gICAgYWRkKHRoaXMuZGVlcCwgdE5vZGUsIGZhbHNlKTtcbiAgICBhZGQodGhpcy5zaGFsbG93LCB0Tm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgaW5zZXJ0Tm9kZUJlZm9yZVZpZXdzKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogdm9pZCB7XG4gICAgYWRkKHRoaXMuZGVlcCwgdE5vZGUsIHRydWUpO1xuICAgIGFkZCh0aGlzLnNoYWxsb3csIHROb2RlLCB0cnVlKTtcbiAgfVxuXG4gIHJlbW92ZVZpZXcoKTogdm9pZCB7XG4gICAgcmVtb3ZlVmlldyh0aGlzLnNoYWxsb3cpO1xuICAgIHJlbW92ZVZpZXcodGhpcy5kZWVwKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCk6IExRdWVyeTxhbnk+fG51bGwge1xuICBsZXQgcmVzdWx0OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcblxuICB3aGlsZSAocXVlcnkpIHtcbiAgICBjb25zdCBjb250YWluZXJWYWx1ZXM6IGFueVtdID0gW107ICAvLyBwcmVwYXJlIHJvb20gZm9yIHZpZXdzXG4gICAgcXVlcnkudmFsdWVzLnB1c2goY29udGFpbmVyVmFsdWVzKTtcbiAgICByZXN1bHQgPSBuZXcgTFF1ZXJ5PGFueT4ocmVzdWx0LCBxdWVyeS5saXN0LCBxdWVyeS5wcmVkaWNhdGUsIGNvbnRhaW5lclZhbHVlcywgbnVsbCk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY29weVF1ZXJpZXNUb1ZpZXcocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIHJlc3VsdCA9IG5ldyBMUXVlcnk8YW55PihyZXN1bHQsIHF1ZXJ5Lmxpc3QsIHF1ZXJ5LnByZWRpY2F0ZSwgW10sIHF1ZXJ5LnZhbHVlcyk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0VmlldyhpbmRleDogbnVtYmVyLCBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpIHtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFZpZXdRdWVyeWhhc1BvaW50ZXJUb0RlY2xhcmF0aW9uQ29udGFpbmVyKHF1ZXJ5KTtcbiAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMgIS5zcGxpY2UoaW5kZXgsIDAsIHF1ZXJ5LnZhbHVlcyk7XG5cbiAgICAvLyBtYXJrIGEgcXVlcnkgYXMgZGlydHkgb25seSB3aGVuIGluc2VydGVkIHZpZXcgaGFkIG1hdGNoaW5nIG1vZGVzXG4gICAgaWYgKHF1ZXJ5LnZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbiAgICB9XG5cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpIHtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFZpZXdRdWVyeWhhc1BvaW50ZXJUb0RlY2xhcmF0aW9uQ29udGFpbmVyKHF1ZXJ5KTtcblxuICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlcyA9IHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhO1xuICAgIGNvbnN0IHZpZXdWYWx1ZXNJZHggPSBjb250YWluZXJWYWx1ZXMuaW5kZXhPZihxdWVyeS52YWx1ZXMpO1xuICAgIGNvbnN0IHJlbW92ZWQgPSBjb250YWluZXJWYWx1ZXMuc3BsaWNlKHZpZXdWYWx1ZXNJZHgsIDEpO1xuXG4gICAgLy8gbWFyayBhIHF1ZXJ5IGFzIGRpcnR5IG9ubHkgd2hlbiByZW1vdmVkIHZpZXcgaGFkIG1hdGNoaW5nIG1vZGVzXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHJlbW92ZWQubGVuZ3RoLCAxLCAncmVtb3ZlZC5sZW5ndGgnKTtcbiAgICBpZiAocmVtb3ZlZFswXS5sZW5ndGgpIHtcbiAgICAgIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbiAgICB9XG5cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0Vmlld1F1ZXJ5aGFzUG9pbnRlclRvRGVjbGFyYXRpb25Db250YWluZXIocXVlcnk6IExRdWVyeTxhbnk+KSB7XG4gIGFzc2VydERlZmluZWQocXVlcnkuY29udGFpbmVyVmFsdWVzLCAnVmlldyBxdWVyaWVzIG5lZWQgdG8gaGF2ZSBhIHBvaW50ZXIgdG8gY29udGFpbmVyIHZhbHVlcy4nKTtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbi8vIFRPRE86IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGUgKEZXLTQ4NilcbmZ1bmN0aW9uIHF1ZXJ5QnlSZWFkVG9rZW4ocmVhZDogYW55LCB0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGFueSB7XG4gIGNvbnN0IGZhY3RvcnlGbiA9IChyZWFkIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIGlmICh0eXBlb2YgZmFjdG9yeUZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhY3RvcnlGbigpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRWaWV3ID0gY3VycmVudFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHJlYWQgYXMgVHlwZTxhbnk+LCBmYWxzZSwgZmFsc2UpO1xuICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIGN1cnJlbnRWaWV3LCBtYXRjaGluZ0lkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5QnlUTm9kZVR5cGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBxdWVyeUJ5VGVtcGxhdGVSZWYoXG4gICAgdGVtcGxhdGVSZWZUb2tlbjogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+LCB0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyxcbiAgICByZWFkOiBhbnkpOiBhbnkge1xuICBjb25zdCB0ZW1wbGF0ZVJlZlJlc3VsdCA9ICh0ZW1wbGF0ZVJlZlRva2VuIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0oKTtcbiAgaWYgKHJlYWQpIHtcbiAgICByZXR1cm4gdGVtcGxhdGVSZWZSZXN1bHQgPyBxdWVyeUJ5UmVhZFRva2VuKHJlYWQsIHROb2RlLCBjdXJyZW50VmlldykgOiBudWxsO1xuICB9XG4gIHJldHVybiB0ZW1wbGF0ZVJlZlJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcXVlcnlSZWFkKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LCByZWFkOiBhbnksIG1hdGNoaW5nSWR4OiBudW1iZXIpOiBhbnkge1xuICBpZiAocmVhZCkge1xuICAgIHJldHVybiBxdWVyeUJ5UmVhZFRva2VuKHJlYWQsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgaWYgKG1hdGNoaW5nSWR4ID4gLTEpIHtcbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgICAgIGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhLCBjdXJyZW50VmlldywgbWF0Y2hpbmdJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH1cbiAgLy8gaWYgcmVhZCB0b2tlbiBhbmQgLyBvciBzdHJhdGVneSBpcyBub3Qgc3BlY2lmaWVkLFxuICAvLyBkZXRlY3QgaXQgdXNpbmcgYXBwcm9wcmlhdGUgdE5vZGUgdHlwZVxuICByZXR1cm4gcXVlcnlCeVROb2RlVHlwZSh0Tm9kZSwgY3VycmVudFZpZXcpO1xufVxuXG4vKipcbiAqIEFkZCBxdWVyeSBtYXRjaGVzIGZvciBhIGdpdmVuIG5vZGUuXG4gKlxuICogQHBhcmFtIHF1ZXJ5IFRoZSBmaXJzdCBxdWVyeSBpbiB0aGUgbGlua2VkIGxpc3RcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgVE5vZGUgdG8gbWF0Y2ggYWdhaW5zdCBxdWVyaWVzXG4gKiBAcGFyYW0gaW5zZXJ0QmVmb3JlQ29udGFpbmVyIFdoZXRoZXIgb3Igbm90IHdlIHNob3VsZCBhZGQgbWF0Y2hlcyBiZWZvcmUgdGhlIGxhc3RcbiAqIGNvbnRhaW5lciBhcnJheS4gVGhpcyBtb2RlIGlzIG5lY2Vzc2FyeSBpZiB0aGUgcXVlcnkgY29udGFpbmVyIGhhZCB0byBiZSBjcmVhdGVkXG4gKiBvdXQgb2Ygb3JkZXIgKGUuZy4gYSB2aWV3IHdhcyBjcmVhdGVkIGluIGEgY29uc3RydWN0b3IpXG4gKi9cbmZ1bmN0aW9uIGFkZChcbiAgICBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwsIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBpbnNlcnRCZWZvcmVDb250YWluZXI6IGJvb2xlYW4pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcblxuICB3aGlsZSAocXVlcnkpIHtcbiAgICBjb25zdCBwcmVkaWNhdGUgPSBxdWVyeS5wcmVkaWNhdGU7XG4gICAgY29uc3QgdHlwZSA9IHByZWRpY2F0ZS50eXBlIGFzIGFueTtcbiAgICBpZiAodHlwZSkge1xuICAgICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgICBpZiAodHlwZSA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgICAgICByZXN1bHQgPSBxdWVyeUJ5VGVtcGxhdGVSZWYodHlwZSwgdE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUucmVhZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBtYXRjaGluZ0lkeCA9IGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCB0eXBlLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgICAgICByZXN1bHQgPSBxdWVyeVJlYWQodE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUucmVhZCwgbWF0Y2hpbmdJZHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQsIGluc2VydEJlZm9yZUNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcHJlZGljYXRlLnNlbGVjdG9yICE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSk7XG4gICAgICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHF1ZXJ5UmVhZCh0Tm9kZSwgbFZpZXcsIHByZWRpY2F0ZS5yZWFkLCBtYXRjaGluZ0lkeCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCwgaW5zZXJ0QmVmb3JlQ29udGFpbmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZE1hdGNoKHF1ZXJ5OiBMUXVlcnk8YW55PiwgbWF0Y2hpbmdWYWx1ZTogYW55LCBpbnNlcnRCZWZvcmVWaWV3TWF0Y2hlczogYm9vbGVhbik6IHZvaWQge1xuICAvLyBWaWV3cyBjcmVhdGVkIGluIGNvbnN0cnVjdG9ycyBtYXkgaGF2ZSB0aGVpciBjb250YWluZXIgdmFsdWVzIGNyZWF0ZWQgdG9vIGVhcmx5LiBJbiB0aGlzIGNhc2UsXG4gIC8vIGVuc3VyZSB0ZW1wbGF0ZSBub2RlIHJlc3VsdHMgYXJlIHVuc2hpZnRlZCBiZWZvcmUgY29udGFpbmVyIHJlc3VsdHMuIE90aGVyd2lzZSwgcmVzdWx0cyBpbnNpZGVcbiAgLy8gZW1iZWRkZWQgdmlld3Mgd2lsbCBhcHBlYXIgYmVmb3JlIHJlc3VsdHMgb24gcGFyZW50IHRlbXBsYXRlIG5vZGVzIHdoZW4gZmxhdHRlbmVkLlxuICBpbnNlcnRCZWZvcmVWaWV3TWF0Y2hlcyA/IHF1ZXJ5LnZhbHVlcy51bnNoaWZ0KG1hdGNoaW5nVmFsdWUpIDogcXVlcnkudmFsdWVzLnB1c2gobWF0Y2hpbmdWYWx1ZSk7XG4gIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJlZGljYXRlPFQ+KHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sIHJlYWQ6IFR5cGU8VD58IG51bGwpOiBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHByZWRpY2F0ZSk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogaXNBcnJheSA/IG51bGwgOiBwcmVkaWNhdGUgYXMgVHlwZTxUPixcbiAgICBzZWxlY3RvcjogaXNBcnJheSA/IHByZWRpY2F0ZSBhcyBzdHJpbmdbXSA6IG51bGwsXG4gICAgcmVhZDogcmVhZFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMUXVlcnk8VD4oXG4gICAgcHJldmlvdXM6IExRdWVyeTxhbnk+fCBudWxsLCBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSxcbiAgICByZWFkOiBUeXBlPFQ+fCBudWxsKTogTFF1ZXJ5PFQ+IHtcbiAgcmV0dXJuIG5ldyBMUXVlcnkoXG4gICAgICBwcmV2aW91cywgcXVlcnlMaXN0LCBjcmVhdGVQcmVkaWNhdGUocHJlZGljYXRlLCByZWFkKSxcbiAgICAgIChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88VD4pLl92YWx1ZXNUcmVlLCBudWxsKTtcbn1cblxudHlwZSBRdWVyeUxpc3RfPFQ+ID0gUXVlcnlMaXN0PFQ+JiB7X3ZhbHVlc1RyZWU6IGFueVtdLCBfc3RhdGljOiBib29sZWFufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgUXVlcnlMaXN0IGFuZCBzdG9yZXMgaXQgaW4gTFZpZXcncyBjb2xsZWN0aW9uIG9mIGFjdGl2ZSBxdWVyaWVzIChMUXVlcmllcykuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICovXG5mdW5jdGlvbiBjcmVhdGVRdWVyeUxpc3RJbkxWaWV3PFQ+KFxuICAgIC8vIFRPRE86IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGUgKEZXLTQ4NilcbiAgICBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55LCBpc1N0YXRpYzogYm9vbGVhbixcbiAgICBub2RlSW5kZXg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KGdldElzUGFyZW50KCkpO1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KCkgYXMgUXVlcnlMaXN0XzxUPjtcbiAgY29uc3QgcXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdIHx8IChsVmlld1tRVUVSSUVTXSA9IG5ldyBMUXVlcmllc18obnVsbCwgbnVsbCwgbnVsbCwgbm9kZUluZGV4KSk7XG4gIHF1ZXJ5TGlzdC5fdmFsdWVzVHJlZSA9IFtdO1xuICBxdWVyeUxpc3QuX3N0YXRpYyA9IGlzU3RhdGljO1xuICBxdWVyaWVzLnRyYWNrKHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobFZpZXcsIHF1ZXJ5TGlzdCwgcXVlcnlMaXN0LmRlc3Ryb3kpO1xuICByZXR1cm4gcXVlcnlMaXN0O1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhIHF1ZXJ5IGJ5IGNvbWJpbmluZyBtYXRjaGVzIGZyb20gYWxsIGFjdGl2ZSB2aWV3cyBhbmQgcmVtb3ZpbmcgbWF0Y2hlcyBmcm9tIGRlbGV0ZWRcbiAqIHZpZXdzLlxuICpcbiAqIEByZXR1cm5zIGB0cnVlYCBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBvciBpZiB0aGlzIGlzIGEgc3RhdGljIHF1ZXJ5XG4gKiByZXNvbHZpbmcgaW4gY3JlYXRpb24gbW9kZSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVxdWVyeVJlZnJlc2gocXVlcnlMaXN0OiBRdWVyeUxpc3Q8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCBxdWVyeUxpc3RJbXBsID0gKHF1ZXJ5TGlzdCBhcyBhbnkgYXMgUXVlcnlMaXN0Xzxhbnk+KTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlID0gaXNDcmVhdGlvbk1vZGUoKTtcblxuICAvLyBpZiBjcmVhdGlvbiBtb2RlIGFuZCBzdGF0aWMgb3IgdXBkYXRlIG1vZGUgYW5kIG5vdCBzdGF0aWNcbiAgaWYgKHF1ZXJ5TGlzdC5kaXJ0eSAmJiBjcmVhdGlvbk1vZGUgPT09IHF1ZXJ5TGlzdEltcGwuX3N0YXRpYykge1xuICAgIHF1ZXJ5TGlzdC5yZXNldChxdWVyeUxpc3RJbXBsLl92YWx1ZXNUcmVlIHx8IFtdKTtcbiAgICBxdWVyeUxpc3Qubm90aWZ5T25DaGFuZ2VzKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCBmb3IgYSBzdGF0aWMgdmlldyBxdWVyeS5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3RhdGljVmlld1F1ZXJ5PFQ+KFxuICAgIC8vIFRPRE8oRlctNDg2KTogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZVxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55KTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIHZpZXdRdWVyeUludGVybmFsKGxWaWV3LCB0VmlldywgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCB0cnVlKTtcbiAgdFZpZXcuc3RhdGljVmlld1F1ZXJpZXMgPSB0cnVlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCwgc3RvcmVzIHRoZSByZWZlcmVuY2UgaW4gTFZpZXcgYW5kIHJldHVybnMgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXZpZXdRdWVyeTxUPihcbiAgICAvLyBUT0RPKEZXLTQ4Nik6IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGVcbiAgICBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSk6IFF1ZXJ5TGlzdDxUPiB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIHJldHVybiB2aWV3UXVlcnlJbnRlcm5hbChsVmlldywgdFZpZXcsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiB2aWV3UXVlcnlJbnRlcm5hbDxUPihcbiAgICBsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnksXG4gICAgaXNTdGF0aWM6IGJvb2xlYW4pOiBRdWVyeUxpc3Q8VD4ge1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCsrO1xuICB9XG4gIGNvbnN0IGluZGV4ID0gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTtcbiAgY29uc3QgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4gPVxuICAgICAgY3JlYXRlUXVlcnlMaXN0SW5MVmlldzxUPihsVmlldywgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCBpc1N0YXRpYywgLTEpO1xuICBzdG9yZShpbmRleCAtIEhFQURFUl9PRkZTRVQsIHF1ZXJ5TGlzdCk7XG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KGluZGV4ICsgMSk7XG4gIHJldHVybiBxdWVyeUxpc3Q7XG59XG5cbi8qKlxuICogTG9hZHMgY3VycmVudCBWaWV3IFF1ZXJ5IGFuZCBtb3ZlcyB0aGUgcG9pbnRlci9pbmRleCB0byB0aGUgbmV4dCBWaWV3IFF1ZXJ5IGluIExWaWV3LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bG9hZFZpZXdRdWVyeTxUPigpOiBUIHtcbiAgY29uc3QgaW5kZXggPSBnZXRDdXJyZW50UXVlcnlJbmRleCgpO1xuICBzZXRDdXJyZW50UXVlcnlJbmRleChpbmRleCArIDEpO1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGdldExWaWV3KCksIGluZGV4IC0gSEVBREVSX09GRlNFVCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBDdXJyZW50IGRpcmVjdGl2ZSBpbmRleFxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbixcbiAgICAvLyBUT0RPKEZXLTQ4Nik6IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGVcbiAgICByZWFkOiBhbnkpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICByZXR1cm4gY29udGVudFF1ZXJ5SW50ZXJuYWwoXG4gICAgICBsVmlldywgdFZpZXcsIGRpcmVjdGl2ZUluZGV4LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGZhbHNlLCB0Tm9kZS5pbmRleCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRlbnRRdWVyeUludGVybmFsPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sXG4gICAgZGVzY2VuZDogYm9vbGVhbixcbiAgICAvLyBUT0RPKEZXLTQ4Nik6IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGVcbiAgICByZWFkOiBhbnksIGlzU3RhdGljOiBib29sZWFuLCBub2RlSW5kZXg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIGNvbnN0IGNvbnRlbnRRdWVyeTogUXVlcnlMaXN0PFQ+ID1cbiAgICAgIGNyZWF0ZVF1ZXJ5TGlzdEluTFZpZXc8VD4obFZpZXcsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgaXNTdGF0aWMsIG5vZGVJbmRleCk7XG4gIChsVmlld1tDT05URU5UX1FVRVJJRVNdIHx8IChsVmlld1tDT05URU5UX1FVRVJJRVNdID0gW10pKS5wdXNoKGNvbnRlbnRRdWVyeSk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IHRWaWV3Q29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcyB8fCAodFZpZXcuY29udGVudFF1ZXJpZXMgPSBbXSk7XG4gICAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgICB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggPyB0Vmlldy5jb250ZW50UXVlcmllc1t0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggLSAxXSA6IC0xO1xuICAgIGlmIChkaXJlY3RpdmVJbmRleCAhPT0gbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIHRWaWV3Q29udGVudFF1ZXJpZXMucHVzaChkaXJlY3RpdmVJbmRleCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250ZW50UXVlcnk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBzdGF0aWMgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2hcbiAqIChwYXJ0IG9mIGEgdmlldyByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY0NvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sXG4gICAgLy8gVE9ETyhGVy00ODYpOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlXG4gICAgcmVhZDogYW55KTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnRlbnRRdWVyeUludGVybmFsKGxWaWV3LCB0VmlldywgZGlyZWN0aXZlSW5kZXgsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgdHJ1ZSwgdE5vZGUuaW5kZXgpO1xuICB0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcyA9IHRydWU7XG59XG5cbi8qKlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bG9hZENvbnRlbnRRdWVyeTxUPigpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBsVmlld1tDT05URU5UX1FVRVJJRVNdLCAnQ29udGVudCBRdWVyeUxpc3QgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIHF1ZXJ5LicpO1xuXG4gIGNvbnN0IGluZGV4ID0gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3W0NPTlRFTlRfUVVFUklFU10gISwgaW5kZXgpO1xuXG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KGluZGV4ICsgMSk7XG4gIHJldHVybiBsVmlld1tDT05URU5UX1FVRVJJRVNdICFbaW5kZXhdO1xufVxuIl19