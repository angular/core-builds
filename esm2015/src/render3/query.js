/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
/**
 * A predicate which determines if a given element/directive should be included in the query
 * results.
 * @record
 * @template T
 */
export function QueryPredicate() { }
if (false) {
    /**
     * If looking for directives then it contains the directive type.
     * @type {?}
     */
    QueryPredicate.prototype.type;
    /**
     * If selector then contains local names to query for.
     * @type {?}
     */
    QueryPredicate.prototype.selector;
    /**
     * Indicates which token should be read from DI for this query.
     * @type {?}
     */
    QueryPredicate.prototype.read;
}
/**
 * An object representing a query, which is a combination of:
 * - query predicate to determines if a given element/directive should be included in the query
 * - values collected based on a predicate
 * - `QueryList` to which collected values should be reported
 * @template T
 */
class LQuery {
    /**
     * @param {?} next
     * @param {?} list
     * @param {?} predicate
     * @param {?} values
     * @param {?} containerValues
     */
    constructor(next, list, predicate, values, containerValues) {
        this.next = next;
        this.list = list;
        this.predicate = predicate;
        this.values = values;
        this.containerValues = containerValues;
    }
}
if (false) {
    /**
     * Next query. Used when queries are stored as a linked list in `LQueries`.
     * @type {?}
     */
    LQuery.prototype.next;
    /**
     * Destination to which the value should be added.
     * @type {?}
     */
    LQuery.prototype.list;
    /**
     * A predicate which determines if a given element/directive should be included in the query
     * results.
     * @type {?}
     */
    LQuery.prototype.predicate;
    /**
     * Values which have been located.
     * This is what builds up the `QueryList._valuesTree`.
     * @type {?}
     */
    LQuery.prototype.values;
    /**
     * A pointer to an array that stores collected values from views. This is necessary so we
     * know a container into which to insert nodes collected from views.
     * @type {?}
     */
    LQuery.prototype.containerValues;
}
export class LQueries_ {
    /**
     * @param {?} parent
     * @param {?} shallow
     * @param {?} deep
     * @param {?=} nodeIndex
     */
    constructor(parent, shallow, deep, nodeIndex = -1) {
        this.parent = parent;
        this.shallow = shallow;
        this.deep = deep;
        this.nodeIndex = nodeIndex;
    }
    /**
     * @template T
     * @param {?} queryList
     * @param {?} predicate
     * @param {?=} descend
     * @param {?=} read
     * @return {?}
     */
    track(queryList, predicate, descend, read) {
        if (descend) {
            this.deep = createLQuery(this.deep, queryList, predicate, read != null ? read : null);
        }
        else {
            this.shallow = createLQuery(this.shallow, queryList, predicate, read != null ? read : null);
        }
    }
    /**
     * @param {?} tNode
     * @return {?}
     */
    clone(tNode) {
        return this.shallow !== null || isContentQueryHost(tNode) ?
            new LQueries_(this, null, this.deep, tNode.index) :
            this;
    }
    /**
     * @return {?}
     */
    container() {
        /** @type {?} */
        const shallowResults = copyQueriesToContainer(this.shallow);
        /** @type {?} */
        const deepResults = copyQueriesToContainer(this.deep);
        return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
    }
    /**
     * @return {?}
     */
    createView() {
        /** @type {?} */
        const shallowResults = copyQueriesToView(this.shallow);
        /** @type {?} */
        const deepResults = copyQueriesToView(this.deep);
        return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
    }
    /**
     * @param {?} index
     * @return {?}
     */
    insertView(index) {
        insertView(index, this.shallow);
        insertView(index, this.deep);
    }
    /**
     * @param {?} tNode
     * @return {?}
     */
    addNode(tNode) {
        add(this.deep, tNode, false);
        add(this.shallow, tNode, false);
    }
    /**
     * @param {?} tNode
     * @return {?}
     */
    insertNodeBeforeViews(tNode) {
        add(this.deep, tNode, true);
        add(this.shallow, tNode, true);
    }
    /**
     * @return {?}
     */
    removeView() {
        removeView(this.shallow);
        removeView(this.deep);
    }
}
if (false) {
    /** @type {?} */
    LQueries_.prototype.parent;
    /**
     * @type {?}
     * @private
     */
    LQueries_.prototype.shallow;
    /**
     * @type {?}
     * @private
     */
    LQueries_.prototype.deep;
    /** @type {?} */
    LQueries_.prototype.nodeIndex;
}
/**
 * @param {?} query
 * @return {?}
 */
function copyQueriesToContainer(query) {
    /** @type {?} */
    let result = null;
    while (query) {
        /** @type {?} */
        const containerValues = [];
        query.values.push(containerValues);
        result = new LQuery(result, query.list, query.predicate, containerValues, null);
        query = query.next;
    }
    return result;
}
/**
 * @param {?} query
 * @return {?}
 */
function copyQueriesToView(query) {
    /** @type {?} */
    let result = null;
    while (query) {
        result = new LQuery(result, query.list, query.predicate, [], query.values);
        query = query.next;
    }
    return result;
}
/**
 * @param {?} index
 * @param {?} query
 * @return {?}
 */
function insertView(index, query) {
    while (query) {
        ngDevMode && assertViewQueryhasPointerToDeclarationContainer(query);
        (/** @type {?} */ (query.containerValues)).splice(index, 0, query.values);
        // mark a query as dirty only when inserted view had matching modes
        if (query.values.length) {
            query.list.setDirty();
        }
        query = query.next;
    }
}
/**
 * @param {?} query
 * @return {?}
 */
function removeView(query) {
    while (query) {
        ngDevMode && assertViewQueryhasPointerToDeclarationContainer(query);
        /** @type {?} */
        const containerValues = (/** @type {?} */ (query.containerValues));
        /** @type {?} */
        const viewValuesIdx = containerValues.indexOf(query.values);
        /** @type {?} */
        const removed = containerValues.splice(viewValuesIdx, 1);
        // mark a query as dirty only when removed view had matching modes
        ngDevMode && assertEqual(removed.length, 1, 'removed.length');
        if (removed[0].length) {
            query.list.setDirty();
        }
        query = query.next;
    }
}
/**
 * @param {?} query
 * @return {?}
 */
function assertViewQueryhasPointerToDeclarationContainer(query) {
    assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
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
    if (localNames) {
        for (let i = 0; i < localNames.length; i += 2) {
            if (localNames[i] === selector) {
                return (/** @type {?} */ (localNames[i + 1]));
            }
        }
    }
    return null;
}
// TODO: "read" should be an AbstractType (FW-486)
/**
 * @param {?} read
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function queryByReadToken(read, tNode, currentView) {
    /** @type {?} */
    const factoryFn = ((/** @type {?} */ (read)))[NG_ELEMENT_ID];
    if (typeof factoryFn === 'function') {
        return factoryFn();
    }
    else {
        /** @type {?} */
        const tView = currentView[TVIEW];
        /** @type {?} */
        const matchingIdx = locateDirectiveOrProvider(tNode, tView, (/** @type {?} */ (read)), false, false);
        if (matchingIdx !== null) {
            return getNodeInjectable(tView.data, currentView, matchingIdx, (/** @type {?} */ (tNode)));
        }
    }
    return null;
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function queryByTNodeType(tNode, currentView) {
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        return createElementRef(ViewEngine_ElementRef, tNode, currentView);
    }
    if (tNode.type === 0 /* Container */) {
        return createTemplateRef(ViewEngine_TemplateRef, ViewEngine_ElementRef, tNode, currentView);
    }
    return null;
}
/**
 * @param {?} templateRefToken
 * @param {?} tNode
 * @param {?} currentView
 * @param {?} read
 * @return {?}
 */
function queryByTemplateRef(templateRefToken, tNode, currentView, read) {
    /** @type {?} */
    const templateRefResult = ((/** @type {?} */ (templateRefToken)))[NG_ELEMENT_ID]();
    if (read) {
        return templateRefResult ? queryByReadToken(read, tNode, currentView) : null;
    }
    return templateRefResult;
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @param {?} read
 * @param {?} matchingIdx
 * @return {?}
 */
function queryRead(tNode, currentView, read, matchingIdx) {
    if (read) {
        return queryByReadToken(read, tNode, currentView);
    }
    if (matchingIdx > -1) {
        return getNodeInjectable(currentView[TVIEW].data, currentView, matchingIdx, (/** @type {?} */ (tNode)));
    }
    // if read token and / or strategy is not specified,
    // detect it using appropriate tNode type
    return queryByTNodeType(tNode, currentView);
}
/**
 * Add query matches for a given node.
 *
 * @param {?} query The first query in the linked list
 * @param {?} tNode The TNode to match against queries
 * @param {?} insertBeforeContainer Whether or not we should add matches before the last
 * container array. This mode is necessary if the query container had to be created
 * out of order (e.g. a view was created in a constructor)
 * @return {?}
 */
function add(query, tNode, insertBeforeContainer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    while (query) {
        /** @type {?} */
        const predicate = query.predicate;
        /** @type {?} */
        const type = (/** @type {?} */ (predicate.type));
        if (type) {
            /** @type {?} */
            let result = null;
            if (type === ViewEngine_TemplateRef) {
                result = queryByTemplateRef(type, tNode, lView, predicate.read);
            }
            else {
                /** @type {?} */
                const matchingIdx = locateDirectiveOrProvider(tNode, tView, type, false, false);
                if (matchingIdx !== null) {
                    result = queryRead(tNode, lView, predicate.read, matchingIdx);
                }
            }
            if (result !== null) {
                addMatch(query, result, insertBeforeContainer);
            }
        }
        else {
            /** @type {?} */
            const selector = (/** @type {?} */ (predicate.selector));
            for (let i = 0; i < selector.length; i++) {
                /** @type {?} */
                const matchingIdx = getIdxOfMatchingSelector(tNode, selector[i]);
                if (matchingIdx !== null) {
                    /** @type {?} */
                    const result = queryRead(tNode, lView, predicate.read, matchingIdx);
                    if (result !== null) {
                        addMatch(query, result, insertBeforeContainer);
                    }
                }
            }
        }
        query = query.next;
    }
}
/**
 * @param {?} query
 * @param {?} matchingValue
 * @param {?} insertBeforeViewMatches
 * @return {?}
 */
function addMatch(query, matchingValue, insertBeforeViewMatches) {
    // Views created in constructors may have their container values created too early. In this case,
    // ensure template node results are unshifted before container results. Otherwise, results inside
    // embedded views will appear before results on parent template nodes when flattened.
    insertBeforeViewMatches ? query.values.unshift(matchingValue) : query.values.push(matchingValue);
    query.list.setDirty();
}
/**
 * @template T
 * @param {?} predicate
 * @param {?} read
 * @return {?}
 */
function createPredicate(predicate, read) {
    /** @type {?} */
    const isArray = Array.isArray(predicate);
    return {
        type: isArray ? null : (/** @type {?} */ (predicate)),
        selector: isArray ? (/** @type {?} */ (predicate)) : null,
        read: read
    };
}
/**
 * @template T
 * @param {?} previous
 * @param {?} queryList
 * @param {?} predicate
 * @param {?} read
 * @return {?}
 */
function createLQuery(previous, queryList, predicate, read) {
    return new LQuery(previous, queryList, createPredicate(predicate, read), ((/** @type {?} */ ((/** @type {?} */ (queryList)))))._valuesTree, null);
}
/**
 * Creates a QueryList and stores it in LView's collection of active queries (LQueries).
 *
 * @template T
 * @param {?} lView
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 * @param {?} isStatic
 * @param {?} nodeIndex
 * @return {?} QueryList<T>
 */
function createQueryListInLView(
// TODO: "read" should be an AbstractType (FW-486)
lView, predicate, descend, read, isStatic, nodeIndex) {
    ngDevMode && assertPreviousIsParent(getIsParent());
    /** @type {?} */
    const queryList = (/** @type {?} */ (new QueryList()));
    /** @type {?} */
    const queries = lView[QUERIES] || (lView[QUERIES] = new LQueries_(null, null, null, nodeIndex));
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
 * \@codeGenApi
 * @param {?} queryList
 * @return {?} `true` if a query got dirty during change detection or if this is a static query
 * resolving in creation mode, `false` otherwise.
 *
 */
export function ɵɵqueryRefresh(queryList) {
    /** @type {?} */
    const queryListImpl = ((/** @type {?} */ ((/** @type {?} */ (queryList)))));
    /** @type {?} */
    const creationMode = isCreationMode();
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
 * \@codeGenApi
 * @template T
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 *
 * @return {?}
 */
export function ɵɵstaticViewQuery(
// TODO(FW-486): "read" should be an AbstractType
predicate, descend, read) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    viewQueryInternal(lView, tView, predicate, descend, read, true);
    tView.staticViewQueries = true;
}
/**
 * Creates new QueryList, stores the reference in LView and returns QueryList.
 *
 * \@codeGenApi
 * @template T
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 * @return {?} QueryList<T>
 *
 */
export function ɵɵviewQuery(
// TODO(FW-486): "read" should be an AbstractType
predicate, descend, read) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    return viewQueryInternal(lView, tView, predicate, descend, read, false);
}
/**
 * @template T
 * @param {?} lView
 * @param {?} tView
 * @param {?} predicate
 * @param {?} descend
 * @param {?} read
 * @param {?} isStatic
 * @return {?}
 */
function viewQueryInternal(lView, tView, predicate, descend, read, isStatic) {
    if (tView.firstTemplatePass) {
        tView.expandoStartIndex++;
    }
    /** @type {?} */
    const index = getCurrentQueryIndex();
    /** @type {?} */
    const queryList = createQueryListInLView(lView, predicate, descend, read, isStatic, -1);
    store(index - HEADER_OFFSET, queryList);
    setCurrentQueryIndex(index + 1);
    return queryList;
}
/**
 * Loads current View Query and moves the pointer/index to the next View Query in LView.
 *
 * \@codeGenApi
 * @template T
 * @return {?}
 */
export function ɵɵloadViewQuery() {
    /** @type {?} */
    const index = getCurrentQueryIndex();
    setCurrentQueryIndex(index + 1);
    return loadInternal(getLView(), index - HEADER_OFFSET);
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
 * @param {?} read What to save in the query
 * @return {?} QueryList<T>
 *
 */
export function ɵɵcontentQuery(directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    return contentQueryInternal(lView, tView, directiveIndex, predicate, descend, read, false, tNode.index);
}
/**
 * @template T
 * @param {?} lView
 * @param {?} tView
 * @param {?} directiveIndex
 * @param {?} predicate
 * @param {?} descend
 * @param {?} read
 * @param {?} isStatic
 * @param {?} nodeIndex
 * @return {?}
 */
function contentQueryInternal(lView, tView, directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read, isStatic, nodeIndex) {
    /** @type {?} */
    const contentQuery = createQueryListInLView(lView, predicate, descend, read, isStatic, nodeIndex);
    (lView[CONTENT_QUERIES] || (lView[CONTENT_QUERIES] = [])).push(contentQuery);
    if (tView.firstTemplatePass) {
        /** @type {?} */
        const tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
        /** @type {?} */
        const lastSavedDirectiveIndex = tView.contentQueries.length ? tView.contentQueries[tView.contentQueries.length - 1] : -1;
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
 * \@codeGenApi
 * @template T
 * @param {?} directiveIndex Current directive index
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 * @return {?} QueryList<T>
 *
 */
export function ɵɵstaticContentQuery(directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    contentQueryInternal(lView, tView, directiveIndex, predicate, descend, read, true, tNode.index);
    tView.staticContentQueries = true;
}
/**
 *
 * \@codeGenApi
 * @template T
 * @return {?}
 */
export function ɵɵloadContentQuery() {
    /** @type {?} */
    const lView = getLView();
    ngDevMode &&
        assertDefined(lView[CONTENT_QUERIES], 'Content QueryList array should be defined if reading a query.');
    /** @type {?} */
    const index = getCurrentQueryIndex();
    ngDevMode && assertDataInRange((/** @type {?} */ (lView[CONTENT_QUERIES])), index);
    setCurrentQueryIndex(index + 1);
    return (/** @type {?} */ (lView[CONTENT_QUERIES]))[index];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDekMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2pGLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRSxPQUFPLEVBQXdFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xKLE9BQU8sRUFBVyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RixPQUFPLEVBQUMsZUFBZSxFQUFFLGFBQWEsRUFBUyxPQUFPLEVBQUUsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDL0YsT0FB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QzFDO0tBQ0Y7SUFDRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDOzs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsY0FBc0IsRUFBRSxTQUE4QixFQUFFLE9BQWdCO0FBQ3hFLGlEQUFpRDtBQUNqRCxJQUFTOztVQUNMLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDOztVQUNwQixLQUFLLEdBQUcsd0JBQXdCLEVBQUU7SUFDeEMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoRyxLQUFLLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLENBQUM7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsa0JBQWtCOztVQUMxQixLQUFLLEdBQUcsUUFBUSxFQUFFO0lBQ3hCLFNBQVM7UUFDTCxhQUFhLENBQ1QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLCtEQUErRCxDQUFDLENBQUM7O1VBRTNGLEtBQUssR0FBRyxvQkFBb0IsRUFBRTtJQUNwQyxTQUFTLElBQUksaUJBQWlCLENBQUMsbUJBQUEsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFaEUsb0JBQW9CLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sbUJBQUEsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlci9xdWVyeV9saXN0JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2Fzc2VydFByZXZpb3VzSXNQYXJlbnR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Tm9kZUluamVjdGFibGUsIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXJ9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtOR19FTEVNRU5UX0lEfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge3N0b3JlfSBmcm9tICcuL2luc3RydWN0aW9ucy9hbGwnO1xuaW1wb3J0IHtzdG9yZUNsZWFudXBXaXRoQ29udGV4dH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0NPTlRFTlRfUVVFUklFUywgSEVBREVSX09GRlNFVCwgTFZpZXcsIFFVRVJJRVMsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50UXVlcnlJbmRleCwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGlzQ3JlYXRpb25Nb2RlLCBzZXRDdXJyZW50UXVlcnlJbmRleH0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2lzQ29udGVudFF1ZXJ5SG9zdCwgbG9hZEludGVybmFsfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIGNyZWF0ZVRlbXBsYXRlUmVmfSBmcm9tICcuL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQ7XG5cbi8qKlxuICogQSBwcmVkaWNhdGUgd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAqIHJlc3VsdHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnlQcmVkaWNhdGU8VD4ge1xuICAvKipcbiAgICogSWYgbG9va2luZyBmb3IgZGlyZWN0aXZlcyB0aGVuIGl0IGNvbnRhaW5zIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgICovXG4gIHR5cGU6IFR5cGU8VD58bnVsbDtcblxuICAvKipcbiAgICogSWYgc2VsZWN0b3IgdGhlbiBjb250YWlucyBsb2NhbCBuYW1lcyB0byBxdWVyeSBmb3IuXG4gICAqL1xuICBzZWxlY3Rvcjogc3RyaW5nW118bnVsbDtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoaWNoIHRva2VuIHNob3VsZCBiZSByZWFkIGZyb20gREkgZm9yIHRoaXMgcXVlcnkuXG4gICAqL1xuICByZWFkOiBUeXBlPFQ+fG51bGw7XG59XG5cbi8qKlxuICogQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhIHF1ZXJ5LCB3aGljaCBpcyBhIGNvbWJpbmF0aW9uIG9mOlxuICogLSBxdWVyeSBwcmVkaWNhdGUgdG8gZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAqIC0gdmFsdWVzIGNvbGxlY3RlZCBiYXNlZCBvbiBhIHByZWRpY2F0ZVxuICogLSBgUXVlcnlMaXN0YCB0byB3aGljaCBjb2xsZWN0ZWQgdmFsdWVzIHNob3VsZCBiZSByZXBvcnRlZFxuICovXG5jbGFzcyBMUXVlcnk8VD4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogTmV4dCBxdWVyeS4gVXNlZCB3aGVuIHF1ZXJpZXMgYXJlIHN0b3JlZCBhcyBhIGxpbmtlZCBsaXN0IGluIGBMUXVlcmllc2AuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBuZXh0OiBMUXVlcnk8YW55PnxudWxsLFxuXG4gICAgICAvKipcbiAgICAgICAqIERlc3RpbmF0aW9uIHRvIHdoaWNoIHRoZSB2YWx1ZSBzaG91bGQgYmUgYWRkZWQuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBsaXN0OiBRdWVyeUxpc3Q8VD4sXG5cbiAgICAgIC8qKlxuICAgICAgICogQSBwcmVkaWNhdGUgd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAgICAgICAqIHJlc3VsdHMuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBwcmVkaWNhdGU6IFF1ZXJ5UHJlZGljYXRlPFQ+LFxuXG4gICAgICAvKipcbiAgICAgICAqIFZhbHVlcyB3aGljaCBoYXZlIGJlZW4gbG9jYXRlZC5cbiAgICAgICAqIFRoaXMgaXMgd2hhdCBidWlsZHMgdXAgdGhlIGBRdWVyeUxpc3QuX3ZhbHVlc1RyZWVgLlxuICAgICAgICovXG4gICAgICBwdWJsaWMgdmFsdWVzOiBhbnlbXSxcblxuICAgICAgLyoqXG4gICAgICAgKiBBIHBvaW50ZXIgdG8gYW4gYXJyYXkgdGhhdCBzdG9yZXMgY29sbGVjdGVkIHZhbHVlcyBmcm9tIHZpZXdzLiBUaGlzIGlzIG5lY2Vzc2FyeSBzbyB3ZVxuICAgICAgICoga25vdyBhIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCBub2RlcyBjb2xsZWN0ZWQgZnJvbSB2aWV3cy5cbiAgICAgICAqL1xuICAgICAgcHVibGljIGNvbnRhaW5lclZhbHVlczogYW55W118bnVsbCkge31cbn1cblxuZXhwb3J0IGNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcGFyZW50OiBMUXVlcmllc198bnVsbCwgcHJpdmF0ZSBzaGFsbG93OiBMUXVlcnk8YW55PnxudWxsLFxuICAgICAgcHJpdmF0ZSBkZWVwOiBMUXVlcnk8YW55PnxudWxsLCBwdWJsaWMgbm9kZUluZGV4OiBudW1iZXIgPSAtMSkge31cblxuICB0cmFjazxUPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fHN0cmluZ1tdLCBkZXNjZW5kPzogYm9vbGVhbiwgcmVhZD86IFR5cGU8VD4pOlxuICAgICAgdm9pZCB7XG4gICAgaWYgKGRlc2NlbmQpIHtcbiAgICAgIHRoaXMuZGVlcCA9IGNyZWF0ZUxRdWVyeSh0aGlzLmRlZXAsIHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCByZWFkICE9IG51bGwgPyByZWFkIDogbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hhbGxvdyA9IGNyZWF0ZUxRdWVyeSh0aGlzLnNoYWxsb3csIHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCByZWFkICE9IG51bGwgPyByZWFkIDogbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgY2xvbmUodE5vZGU6IFROb2RlKTogTFF1ZXJpZXMge1xuICAgIHJldHVybiB0aGlzLnNoYWxsb3cgIT09IG51bGwgfHwgaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSA/XG4gICAgICAgIG5ldyBMUXVlcmllc18odGhpcywgbnVsbCwgdGhpcy5kZWVwLCB0Tm9kZS5pbmRleCkgOlxuICAgICAgICB0aGlzO1xuICB9XG5cbiAgY29udGFpbmVyKCk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHNoYWxsb3dSZXN1bHRzID0gY29weVF1ZXJpZXNUb0NvbnRhaW5lcih0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb0NvbnRhaW5lcih0aGlzLmRlZXApO1xuICAgIHJldHVybiBzaGFsbG93UmVzdWx0cyB8fCBkZWVwUmVzdWx0cyA/IG5ldyBMUXVlcmllc18odGhpcywgc2hhbGxvd1Jlc3VsdHMsIGRlZXBSZXN1bHRzKSA6IG51bGw7XG4gIH1cblxuICBjcmVhdGVWaWV3KCk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHNoYWxsb3dSZXN1bHRzID0gY29weVF1ZXJpZXNUb1ZpZXcodGhpcy5zaGFsbG93KTtcbiAgICBjb25zdCBkZWVwUmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9WaWV3KHRoaXMuZGVlcCk7XG5cbiAgICByZXR1cm4gc2hhbGxvd1Jlc3VsdHMgfHwgZGVlcFJlc3VsdHMgPyBuZXcgTFF1ZXJpZXNfKHRoaXMsIHNoYWxsb3dSZXN1bHRzLCBkZWVwUmVzdWx0cykgOiBudWxsO1xuICB9XG5cbiAgaW5zZXJ0VmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgaW5zZXJ0VmlldyhpbmRleCwgdGhpcy5zaGFsbG93KTtcbiAgICBpbnNlcnRWaWV3KGluZGV4LCB0aGlzLmRlZXApO1xuICB9XG5cbiAgYWRkTm9kZSh0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6IHZvaWQge1xuICAgIGFkZCh0aGlzLmRlZXAsIHROb2RlLCBmYWxzZSk7XG4gICAgYWRkKHRoaXMuc2hhbGxvdywgdE5vZGUsIGZhbHNlKTtcbiAgfVxuXG4gIGluc2VydE5vZGVCZWZvcmVWaWV3cyh0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6IHZvaWQge1xuICAgIGFkZCh0aGlzLmRlZXAsIHROb2RlLCB0cnVlKTtcbiAgICBhZGQodGhpcy5zaGFsbG93LCB0Tm9kZSwgdHJ1ZSk7XG4gIH1cblxuICByZW1vdmVWaWV3KCk6IHZvaWQge1xuICAgIHJlbW92ZVZpZXcodGhpcy5zaGFsbG93KTtcbiAgICByZW1vdmVWaWV3KHRoaXMuZGVlcCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29weVF1ZXJpZXNUb0NvbnRhaW5lcihxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpOiBMUXVlcnk8YW55PnxudWxsIHtcbiAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgY29udGFpbmVyVmFsdWVzOiBhbnlbXSA9IFtdOyAgLy8gcHJlcGFyZSByb29tIGZvciB2aWV3c1xuICAgIHF1ZXJ5LnZhbHVlcy5wdXNoKGNvbnRhaW5lclZhbHVlcyk7XG4gICAgcmVzdWx0ID0gbmV3IExRdWVyeTxhbnk+KHJlc3VsdCwgcXVlcnkubGlzdCwgcXVlcnkucHJlZGljYXRlLCBjb250YWluZXJWYWx1ZXMsIG51bGwpO1xuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGNvcHlRdWVyaWVzVG9WaWV3KHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCk6IExRdWVyeTxhbnk+fG51bGwge1xuICBsZXQgcmVzdWx0OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcblxuICB3aGlsZSAocXVlcnkpIHtcbiAgICByZXN1bHQgPSBuZXcgTFF1ZXJ5PGFueT4ocmVzdWx0LCBxdWVyeS5saXN0LCBxdWVyeS5wcmVkaWNhdGUsIFtdLCBxdWVyeS52YWx1ZXMpO1xuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGluc2VydFZpZXcoaW5kZXg6IG51bWJlciwgcXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKSB7XG4gIHdoaWxlIChxdWVyeSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRWaWV3UXVlcnloYXNQb2ludGVyVG9EZWNsYXJhdGlvbkNvbnRhaW5lcihxdWVyeSk7XG4gICAgcXVlcnkuY29udGFpbmVyVmFsdWVzICEuc3BsaWNlKGluZGV4LCAwLCBxdWVyeS52YWx1ZXMpO1xuXG4gICAgLy8gbWFyayBhIHF1ZXJ5IGFzIGRpcnR5IG9ubHkgd2hlbiBpbnNlcnRlZCB2aWV3IGhhZCBtYXRjaGluZyBtb2Rlc1xuICAgIGlmIChxdWVyeS52YWx1ZXMubGVuZ3RoKSB7XG4gICAgICBxdWVyeS5saXN0LnNldERpcnR5KCk7XG4gICAgfVxuXG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVZpZXcocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKSB7XG4gIHdoaWxlIChxdWVyeSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRWaWV3UXVlcnloYXNQb2ludGVyVG9EZWNsYXJhdGlvbkNvbnRhaW5lcihxdWVyeSk7XG5cbiAgICBjb25zdCBjb250YWluZXJWYWx1ZXMgPSBxdWVyeS5jb250YWluZXJWYWx1ZXMgITtcbiAgICBjb25zdCB2aWV3VmFsdWVzSWR4ID0gY29udGFpbmVyVmFsdWVzLmluZGV4T2YocXVlcnkudmFsdWVzKTtcbiAgICBjb25zdCByZW1vdmVkID0gY29udGFpbmVyVmFsdWVzLnNwbGljZSh2aWV3VmFsdWVzSWR4LCAxKTtcblxuICAgIC8vIG1hcmsgYSBxdWVyeSBhcyBkaXJ0eSBvbmx5IHdoZW4gcmVtb3ZlZCB2aWV3IGhhZCBtYXRjaGluZyBtb2Rlc1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChyZW1vdmVkLmxlbmd0aCwgMSwgJ3JlbW92ZWQubGVuZ3RoJyk7XG4gICAgaWYgKHJlbW92ZWRbMF0ubGVuZ3RoKSB7XG4gICAgICBxdWVyeS5saXN0LnNldERpcnR5KCk7XG4gICAgfVxuXG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cbmZ1bmN0aW9uIGFzc2VydFZpZXdRdWVyeWhhc1BvaW50ZXJUb0RlY2xhcmF0aW9uQ29udGFpbmVyKHF1ZXJ5OiBMUXVlcnk8YW55Pikge1xuICBhc3NlcnREZWZpbmVkKHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBsb2NhbCBuYW1lcyBmb3IgYSBnaXZlbiBub2RlIGFuZCByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleFxuICogKG9yIC0xIGlmIGEgbG9jYWwgbmFtZSBwb2ludHMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIHROb2RlIHN0YXRpYyBkYXRhIG9mIGEgbm9kZSB0byBjaGVja1xuICogQHBhcmFtIHNlbGVjdG9yIHNlbGVjdG9yIHRvIG1hdGNoXG4gKiBAcmV0dXJucyBkaXJlY3RpdmUgaW5kZXgsIC0xIG9yIG51bGwgaWYgYSBzZWxlY3RvciBkaWRuJ3QgbWF0Y2ggYW55IG9mIHRoZSBsb2NhbCBuYW1lc1xuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3Rvcjogc3RyaW5nKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGlmIChsb2NhbE5hbWVzW2ldID09PSBzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG4vLyBUT0RPOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlIChGVy00ODYpXG5mdW5jdGlvbiBxdWVyeUJ5UmVhZFRva2VuKHJlYWQ6IGFueSwgdE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBjb25zdCBmYWN0b3J5Rm4gPSAocmVhZCBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICBpZiAodHlwZW9mIGZhY3RvcnlGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWN0b3J5Rm4oKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0VmlldyA9IGN1cnJlbnRWaWV3W1RWSUVXXTtcbiAgICBjb25zdCBtYXRjaGluZ0lkeCA9IGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCByZWFkIGFzIFR5cGU8YW55PiwgZmFsc2UsIGZhbHNlKTtcbiAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZSh0Vmlldy5kYXRhLCBjdXJyZW50VmlldywgbWF0Y2hpbmdJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBxdWVyeUJ5VE5vZGVUeXBlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYW55IHtcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmKFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcXVlcnlCeVRlbXBsYXRlUmVmKFxuICAgIHRlbXBsYXRlUmVmVG9rZW46IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55PiwgdE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcsXG4gICAgcmVhZDogYW55KTogYW55IHtcbiAgY29uc3QgdGVtcGxhdGVSZWZSZXN1bHQgPSAodGVtcGxhdGVSZWZUb2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdKCk7XG4gIGlmIChyZWFkKSB7XG4gICAgcmV0dXJuIHRlbXBsYXRlUmVmUmVzdWx0ID8gcXVlcnlCeVJlYWRUb2tlbihyZWFkLCB0Tm9kZSwgY3VycmVudFZpZXcpIDogbnVsbDtcbiAgfVxuICByZXR1cm4gdGVtcGxhdGVSZWZSZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5UmVhZCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldywgcmVhZDogYW55LCBtYXRjaGluZ0lkeDogbnVtYmVyKTogYW55IHtcbiAgaWYgKHJlYWQpIHtcbiAgICByZXR1cm4gcXVlcnlCeVJlYWRUb2tlbihyZWFkLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIGlmIChtYXRjaGluZ0lkeCA+IC0xKSB7XG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKFxuICAgICAgICBjdXJyZW50Vmlld1tUVklFV10uZGF0YSwgY3VycmVudFZpZXcsIG1hdGNoaW5nSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9XG4gIC8vIGlmIHJlYWQgdG9rZW4gYW5kIC8gb3Igc3RyYXRlZ3kgaXMgbm90IHNwZWNpZmllZCxcbiAgLy8gZGV0ZWN0IGl0IHVzaW5nIGFwcHJvcHJpYXRlIHROb2RlIHR5cGVcbiAgcmV0dXJuIHF1ZXJ5QnlUTm9kZVR5cGUodE5vZGUsIGN1cnJlbnRWaWV3KTtcbn1cblxuLyoqXG4gKiBBZGQgcXVlcnkgbWF0Y2hlcyBmb3IgYSBnaXZlbiBub2RlLlxuICpcbiAqIEBwYXJhbSBxdWVyeSBUaGUgZmlyc3QgcXVlcnkgaW4gdGhlIGxpbmtlZCBsaXN0XG4gKiBAcGFyYW0gdE5vZGUgVGhlIFROb2RlIHRvIG1hdGNoIGFnYWluc3QgcXVlcmllc1xuICogQHBhcmFtIGluc2VydEJlZm9yZUNvbnRhaW5lciBXaGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgYWRkIG1hdGNoZXMgYmVmb3JlIHRoZSBsYXN0XG4gKiBjb250YWluZXIgYXJyYXkuIFRoaXMgbW9kZSBpcyBuZWNlc3NhcnkgaWYgdGhlIHF1ZXJ5IGNvbnRhaW5lciBoYWQgdG8gYmUgY3JlYXRlZFxuICogb3V0IG9mIG9yZGVyIChlLmcuIGEgdmlldyB3YXMgY3JlYXRlZCBpbiBhIGNvbnN0cnVjdG9yKVxuICovXG5mdW5jdGlvbiBhZGQoXG4gICAgcXVlcnk6IExRdWVyeTxhbnk+fCBudWxsLCB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaW5zZXJ0QmVmb3JlQ29udGFpbmVyOiBib29sZWFuKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gcXVlcnkucHJlZGljYXRlO1xuICAgIGNvbnN0IHR5cGUgPSBwcmVkaWNhdGUudHlwZSBhcyBhbnk7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGxldCByZXN1bHQgPSBudWxsO1xuICAgICAgaWYgKHR5cGUgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICAgICAgcmVzdWx0ID0gcXVlcnlCeVRlbXBsYXRlUmVmKHR5cGUsIHROb2RlLCBsVmlldywgcHJlZGljYXRlLnJlYWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbWF0Y2hpbmdJZHggPSBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCB0VmlldywgdHlwZSwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgaWYgKG1hdGNoaW5nSWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmVzdWx0ID0gcXVlcnlSZWFkKHROb2RlLCBsVmlldywgcHJlZGljYXRlLnJlYWQsIG1hdGNoaW5nSWR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICBhZGRNYXRjaChxdWVyeSwgcmVzdWx0LCBpbnNlcnRCZWZvcmVDb250YWluZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzZWxlY3RvciA9IHByZWRpY2F0ZS5zZWxlY3RvciAhO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBtYXRjaGluZ0lkeCA9IGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0pO1xuICAgICAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBxdWVyeVJlYWQodE5vZGUsIGxWaWV3LCBwcmVkaWNhdGUucmVhZCwgbWF0Y2hpbmdJZHgpO1xuICAgICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQsIGluc2VydEJlZm9yZUNvbnRhaW5lcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRNYXRjaChxdWVyeTogTFF1ZXJ5PGFueT4sIG1hdGNoaW5nVmFsdWU6IGFueSwgaW5zZXJ0QmVmb3JlVmlld01hdGNoZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgLy8gVmlld3MgY3JlYXRlZCBpbiBjb25zdHJ1Y3RvcnMgbWF5IGhhdmUgdGhlaXIgY29udGFpbmVyIHZhbHVlcyBjcmVhdGVkIHRvbyBlYXJseS4gSW4gdGhpcyBjYXNlLFxuICAvLyBlbnN1cmUgdGVtcGxhdGUgbm9kZSByZXN1bHRzIGFyZSB1bnNoaWZ0ZWQgYmVmb3JlIGNvbnRhaW5lciByZXN1bHRzLiBPdGhlcndpc2UsIHJlc3VsdHMgaW5zaWRlXG4gIC8vIGVtYmVkZGVkIHZpZXdzIHdpbGwgYXBwZWFyIGJlZm9yZSByZXN1bHRzIG9uIHBhcmVudCB0ZW1wbGF0ZSBub2RlcyB3aGVuIGZsYXR0ZW5lZC5cbiAgaW5zZXJ0QmVmb3JlVmlld01hdGNoZXMgPyBxdWVyeS52YWx1ZXMudW5zaGlmdChtYXRjaGluZ1ZhbHVlKSA6IHF1ZXJ5LnZhbHVlcy5wdXNoKG1hdGNoaW5nVmFsdWUpO1xuICBxdWVyeS5saXN0LnNldERpcnR5KCk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByZWRpY2F0ZTxUPihwcmVkaWNhdGU6IFR5cGU8VD58IHN0cmluZ1tdLCByZWFkOiBUeXBlPFQ+fCBudWxsKTogUXVlcnlQcmVkaWNhdGU8VD4ge1xuICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShwcmVkaWNhdGUpO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IGlzQXJyYXkgPyBudWxsIDogcHJlZGljYXRlIGFzIFR5cGU8VD4sXG4gICAgc2VsZWN0b3I6IGlzQXJyYXkgPyBwcmVkaWNhdGUgYXMgc3RyaW5nW10gOiBudWxsLFxuICAgIHJlYWQ6IHJlYWRcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTFF1ZXJ5PFQ+KFxuICAgIHByZXZpb3VzOiBMUXVlcnk8YW55PnwgbnVsbCwgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sXG4gICAgcmVhZDogVHlwZTxUPnwgbnVsbCk6IExRdWVyeTxUPiB7XG4gIHJldHVybiBuZXcgTFF1ZXJ5KFxuICAgICAgcHJldmlvdXMsIHF1ZXJ5TGlzdCwgY3JlYXRlUHJlZGljYXRlKHByZWRpY2F0ZSwgcmVhZCksXG4gICAgICAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPFQ+KS5fdmFsdWVzVHJlZSwgbnVsbCk7XG59XG5cbnR5cGUgUXVlcnlMaXN0XzxUPiA9IFF1ZXJ5TGlzdDxUPiYge192YWx1ZXNUcmVlOiBhbnlbXSwgX3N0YXRpYzogYm9vbGVhbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFF1ZXJ5TGlzdCBhbmQgc3RvcmVzIGl0IGluIExWaWV3J3MgY29sbGVjdGlvbiBvZiBhY3RpdmUgcXVlcmllcyAoTFF1ZXJpZXMpLlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUXVlcnlMaXN0SW5MVmlldzxUPihcbiAgICAvLyBUT0RPOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlIChGVy00ODYpXG4gICAgbFZpZXc6IExWaWV3LCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSwgaXNTdGF0aWM6IGJvb2xlYW4sXG4gICAgbm9kZUluZGV4OiBudW1iZXIpOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudChnZXRJc1BhcmVudCgpKTtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpIGFzIFF1ZXJ5TGlzdF88VD47XG4gIGNvbnN0IHF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXSB8fCAobFZpZXdbUVVFUklFU10gPSBuZXcgTFF1ZXJpZXNfKG51bGwsIG51bGwsIG51bGwsIG5vZGVJbmRleCkpO1xuICBxdWVyeUxpc3QuX3ZhbHVlc1RyZWUgPSBbXTtcbiAgcXVlcnlMaXN0Ll9zdGF0aWMgPSBpc1N0YXRpYztcbiAgcXVlcmllcy50cmFjayhxdWVyeUxpc3QsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCk7XG4gIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KGxWaWV3LCBxdWVyeUxpc3QsIHF1ZXJ5TGlzdC5kZXN0cm95KTtcbiAgcmV0dXJuIHF1ZXJ5TGlzdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqXG4gKiBAcmV0dXJucyBgdHJ1ZWAgaWYgYSBxdWVyeSBnb3QgZGlydHkgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gb3IgaWYgdGhpcyBpcyBhIHN0YXRpYyBxdWVyeVxuICogcmVzb2x2aW5nIGluIGNyZWF0aW9uIG1vZGUsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0SW1wbCA9IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88YW55Pik7XG4gIGNvbnN0IGNyZWF0aW9uTW9kZSA9IGlzQ3JlYXRpb25Nb2RlKCk7XG5cbiAgLy8gaWYgY3JlYXRpb24gbW9kZSBhbmQgc3RhdGljIG9yIHVwZGF0ZSBtb2RlIGFuZCBub3Qgc3RhdGljXG4gIGlmIChxdWVyeUxpc3QuZGlydHkgJiYgY3JlYXRpb25Nb2RlID09PSBxdWVyeUxpc3RJbXBsLl9zdGF0aWMpIHtcbiAgICBxdWVyeUxpc3QucmVzZXQocXVlcnlMaXN0SW1wbC5fdmFsdWVzVHJlZSB8fCBbXSk7XG4gICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QgZm9yIGEgc3RhdGljIHZpZXcgcXVlcnkuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0YXRpY1ZpZXdRdWVyeTxUPihcbiAgICAvLyBUT0RPKEZXLTQ4Nik6IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGVcbiAgICBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICB2aWV3UXVlcnlJbnRlcm5hbChsVmlldywgdFZpZXcsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgdHJ1ZSk7XG4gIHRWaWV3LnN0YXRpY1ZpZXdRdWVyaWVzID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QsIHN0b3JlcyB0aGUgcmVmZXJlbmNlIGluIExWaWV3IGFuZCByZXR1cm5zIFF1ZXJ5TGlzdC5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV2aWV3UXVlcnk8VD4oXG4gICAgLy8gVE9ETyhGVy00ODYpOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlXG4gICAgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnkpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICByZXR1cm4gdmlld1F1ZXJ5SW50ZXJuYWwobFZpZXcsIHRWaWV3LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gdmlld1F1ZXJ5SW50ZXJuYWw8VD4oXG4gICAgbFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55LFxuICAgIGlzU3RhdGljOiBib29sZWFuKTogUXVlcnlMaXN0PFQ+IHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXgrKztcbiAgfVxuICBjb25zdCBpbmRleCA9IGdldEN1cnJlbnRRdWVyeUluZGV4KCk7XG4gIGNvbnN0IHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+ID1cbiAgICAgIGNyZWF0ZVF1ZXJ5TGlzdEluTFZpZXc8VD4obFZpZXcsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgaXNTdGF0aWMsIC0xKTtcbiAgc3RvcmUoaW5kZXggLSBIRUFERVJfT0ZGU0VULCBxdWVyeUxpc3QpO1xuICBzZXRDdXJyZW50UXVlcnlJbmRleChpbmRleCArIDEpO1xuICByZXR1cm4gcXVlcnlMaXN0O1xufVxuXG4vKipcbiAqIExvYWRzIGN1cnJlbnQgVmlldyBRdWVyeSBhbmQgbW92ZXMgdGhlIHBvaW50ZXIvaW5kZXggdG8gdGhlIG5leHQgVmlldyBRdWVyeSBpbiBMVmlldy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxvYWRWaWV3UXVlcnk8VD4oKTogVCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoaW5kZXggKyAxKTtcbiAgcmV0dXJuIGxvYWRJbnRlcm5hbDxUPihnZXRMVmlldygpLCBpbmRleCAtIEhFQURFUl9PRkZTRVQpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2ggKHBhcnQgb2YgYSB2aWV3XG4gKiByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sXG4gICAgLy8gVE9ETyhGVy00ODYpOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlXG4gICAgcmVhZDogYW55KTogUXVlcnlMaXN0PFQ+IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgcmV0dXJuIGNvbnRlbnRRdWVyeUludGVybmFsKFxuICAgICAgbFZpZXcsIHRWaWV3LCBkaXJlY3RpdmVJbmRleCwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCBmYWxzZSwgdE5vZGUuaW5kZXgpO1xufVxuXG5mdW5jdGlvbiBjb250ZW50UXVlcnlJbnRlcm5hbDxUPihcbiAgICBsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLFxuICAgIGRlc2NlbmQ6IGJvb2xlYW4sXG4gICAgLy8gVE9ETyhGVy00ODYpOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlXG4gICAgcmVhZDogYW55LCBpc1N0YXRpYzogYm9vbGVhbiwgbm9kZUluZGV4OiBudW1iZXIpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBjb250ZW50UXVlcnk6IFF1ZXJ5TGlzdDxUPiA9XG4gICAgICBjcmVhdGVRdWVyeUxpc3RJbkxWaWV3PFQ+KGxWaWV3LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGlzU3RhdGljLCBub2RlSW5kZXgpO1xuICAobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSB8fCAobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSA9IFtdKSkucHVzaChjb250ZW50UXVlcnkpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCB0Vmlld0NvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXMgfHwgKHRWaWV3LmNvbnRlbnRRdWVyaWVzID0gW10pO1xuICAgIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXcuY29udGVudFF1ZXJpZXNbdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMV0gOiAtMTtcbiAgICBpZiAoZGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2goZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGVudFF1ZXJ5O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgc3RhdGljIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoXG4gKiAocGFydCBvZiBhIHZpZXcgcmVmcmVzaCkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEN1cnJlbnQgZGlyZWN0aXZlIGluZGV4XG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdGF0aWNDb250ZW50UXVlcnk8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLFxuICAgIC8vIFRPRE8oRlctNDg2KTogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZVxuICAgIHJlYWQ6IGFueSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb250ZW50UXVlcnlJbnRlcm5hbChsVmlldywgdFZpZXcsIGRpcmVjdGl2ZUluZGV4LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUsIHROb2RlLmluZGV4KTtcbiAgdFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMgPSB0cnVlO1xufVxuXG4vKipcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxvYWRDb250ZW50UXVlcnk8VD4oKTogUXVlcnlMaXN0PFQ+IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgbFZpZXdbQ09OVEVOVF9RVUVSSUVTXSwgJ0NvbnRlbnQgUXVlcnlMaXN0IGFycmF5IHNob3VsZCBiZSBkZWZpbmVkIGlmIHJlYWRpbmcgYSBxdWVyeS4nKTtcblxuICBjb25zdCBpbmRleCA9IGdldEN1cnJlbnRRdWVyeUluZGV4KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlld1tDT05URU5UX1FVRVJJRVNdICEsIGluZGV4KTtcblxuICBzZXRDdXJyZW50UXVlcnlJbmRleChpbmRleCArIDEpO1xuICByZXR1cm4gbFZpZXdbQ09OVEVOVF9RVUVSSUVTXSAhW2luZGV4XTtcbn1cbiJdfQ==