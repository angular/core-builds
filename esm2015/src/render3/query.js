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
import { getCurrentQueryIndex, getIsParent, getLView, isCreationMode, setCurrentQueryIndex } from './state';
import { loadInternal } from './util/view_utils';
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
 * @record
 * @template T
 */
export function LQuery() { }
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
     *
     * This is what builds up the `QueryList._valuesTree`.
     * @type {?}
     */
    LQuery.prototype.values;
    /**
     * A pointer to an array that stores collected values from views. This is necessary so we know a
     * container into which to insert nodes collected from views.
     * @type {?}
     */
    LQuery.prototype.containerValues;
}
export class LQueries_ {
    /**
     * @param {?} parent
     * @param {?} shallow
     * @param {?} deep
     */
    constructor(parent, shallow, deep) {
        this.parent = parent;
        this.shallow = shallow;
        this.deep = deep;
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
     * @return {?}
     */
    clone() { return new LQueries_(this, null, this.deep); }
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
        /** @type {?} */
        const clonedQuery = {
            next: result,
            list: query.list,
            predicate: query.predicate,
            values: containerValues,
            containerValues: null
        };
        result = clonedQuery;
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
        /** @type {?} */
        const clonedQuery = {
            next: result,
            list: query.list,
            predicate: query.predicate,
            values: [],
            containerValues: query.values
        };
        result = clonedQuery;
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
        const matchingIdx = locateDirectiveOrProvider(tNode, currentView, (/** @type {?} */ (read)), false, false);
        if (matchingIdx !== null) {
            return getNodeInjectable(currentView[TVIEW].data, currentView, matchingIdx, (/** @type {?} */ (tNode)));
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
    const currentView = getLView();
    while (query) {
        /** @type {?} */
        const predicate = query.predicate;
        /** @type {?} */
        const type = (/** @type {?} */ (predicate.type));
        if (type) {
            /** @type {?} */
            let result = null;
            if (type === ViewEngine_TemplateRef) {
                result = queryByTemplateRef(type, tNode, currentView, predicate.read);
            }
            else {
                /** @type {?} */
                const matchingIdx = locateDirectiveOrProvider(tNode, currentView, type, false, false);
                if (matchingIdx !== null) {
                    result = queryRead(tNode, currentView, predicate.read, matchingIdx);
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
                    const result = queryRead(tNode, currentView, predicate.read, matchingIdx);
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
    return {
        next: previous,
        list: queryList,
        predicate: createPredicate(predicate, read),
        values: ((/** @type {?} */ ((/** @type {?} */ (queryList)))))._valuesTree,
        containerValues: null
    };
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
 * @return {?} QueryList<T>
 */
function createQueryListInLView(
// TODO: "read" should be an AbstractType (FW-486)
lView, predicate, descend, read, isStatic) {
    ngDevMode && assertPreviousIsParent(getIsParent());
    /** @type {?} */
    const queryList = (/** @type {?} */ (new QueryList()));
    /** @type {?} */
    const queries = lView[QUERIES] || (lView[QUERIES] = new LQueries_(null, null, null));
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
    const queryList = createQueryListInLView(lView, predicate, descend, read, isStatic);
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
    return contentQueryInternal(lView, tView, directiveIndex, predicate, descend, read, false);
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
 * @return {?}
 */
function contentQueryInternal(lView, tView, directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read, isStatic) {
    /** @type {?} */
    const contentQuery = createQueryListInLView(lView, predicate, descend, read, isStatic);
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
    contentQueryInternal(lView, tView, directiveIndex, predicate, descend, read, true);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDekMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDOUQsT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2pGLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvRSxPQUFPLEVBQXdFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xKLE9BQU8sRUFBVyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RixPQUFPLEVBQUMsZUFBZSxFQUFFLGFBQWEsRUFBUyxPQUFPLEVBQUUsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDL0YsT0FB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LEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRSwrREFBK0QsQ0FBQyxDQUFDOztVQUUzRixLQUFLLEdBQUcsb0JBQW9CLEVBQUU7SUFDcEMsU0FBUyxJQUFJLGlCQUFpQixDQUFDLG1CQUFBLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWhFLG9CQUFvQixDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNoQyxPQUFPLG1CQUFBLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRQcmV2aW91c0lzUGFyZW50fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtzdG9yZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvYWxsJztcbmltcG9ydCB7c3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtDT05URU5UX1FVRVJJRVMsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBRVUVSSUVTLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFF1ZXJ5SW5kZXgsIGdldElzUGFyZW50LCBnZXRMVmlldywgaXNDcmVhdGlvbk1vZGUsIHNldEN1cnJlbnRRdWVyeUluZGV4fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7bG9hZEludGVybmFsfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2NyZWF0ZUVsZW1lbnRSZWYsIGNyZWF0ZVRlbXBsYXRlUmVmfSBmcm9tICcuL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQ7XG5cbi8qKlxuICogQSBwcmVkaWNhdGUgd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAqIHJlc3VsdHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnlQcmVkaWNhdGU8VD4ge1xuICAvKipcbiAgICogSWYgbG9va2luZyBmb3IgZGlyZWN0aXZlcyB0aGVuIGl0IGNvbnRhaW5zIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgICovXG4gIHR5cGU6IFR5cGU8VD58bnVsbDtcblxuICAvKipcbiAgICogSWYgc2VsZWN0b3IgdGhlbiBjb250YWlucyBsb2NhbCBuYW1lcyB0byBxdWVyeSBmb3IuXG4gICAqL1xuICBzZWxlY3Rvcjogc3RyaW5nW118bnVsbDtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoaWNoIHRva2VuIHNob3VsZCBiZSByZWFkIGZyb20gREkgZm9yIHRoaXMgcXVlcnkuXG4gICAqL1xuICByZWFkOiBUeXBlPFQ+fG51bGw7XG59XG5cbi8qKlxuICogQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhIHF1ZXJ5LCB3aGljaCBpcyBhIGNvbWJpbmF0aW9uIG9mOlxuICogLSBxdWVyeSBwcmVkaWNhdGUgdG8gZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAqIC0gdmFsdWVzIGNvbGxlY3RlZCBiYXNlZCBvbiBhIHByZWRpY2F0ZVxuICogLSBgUXVlcnlMaXN0YCB0byB3aGljaCBjb2xsZWN0ZWQgdmFsdWVzIHNob3VsZCBiZSByZXBvcnRlZFxuICovXG5leHBvcnQgaW50ZXJmYWNlIExRdWVyeTxUPiB7XG4gIC8qKlxuICAgKiBOZXh0IHF1ZXJ5LiBVc2VkIHdoZW4gcXVlcmllcyBhcmUgc3RvcmVkIGFzIGEgbGlua2VkIGxpc3QgaW4gYExRdWVyaWVzYC5cbiAgICovXG4gIG5leHQ6IExRdWVyeTxhbnk+fG51bGw7XG5cbiAgLyoqXG4gICAqIERlc3RpbmF0aW9uIHRvIHdoaWNoIHRoZSB2YWx1ZSBzaG91bGQgYmUgYWRkZWQuXG4gICAqL1xuICBsaXN0OiBRdWVyeUxpc3Q8VD47XG5cbiAgLyoqXG4gICAqIEEgcHJlZGljYXRlIHdoaWNoIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gICAqIHJlc3VsdHMuXG4gICAqL1xuICBwcmVkaWNhdGU6IFF1ZXJ5UHJlZGljYXRlPFQ+O1xuXG4gIC8qKlxuICAgKiBWYWx1ZXMgd2hpY2ggaGF2ZSBiZWVuIGxvY2F0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgd2hhdCBidWlsZHMgdXAgdGhlIGBRdWVyeUxpc3QuX3ZhbHVlc1RyZWVgLlxuICAgKi9cbiAgdmFsdWVzOiBhbnlbXTtcblxuICAvKipcbiAgICogQSBwb2ludGVyIHRvIGFuIGFycmF5IHRoYXQgc3RvcmVzIGNvbGxlY3RlZCB2YWx1ZXMgZnJvbSB2aWV3cy4gVGhpcyBpcyBuZWNlc3Nhcnkgc28gd2Uga25vdyBhXG4gICAqIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCBub2RlcyBjb2xsZWN0ZWQgZnJvbSB2aWV3cy5cbiAgICovXG4gIGNvbnRhaW5lclZhbHVlczogYW55W118bnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcGFyZW50OiBMUXVlcmllc198bnVsbCwgcHJpdmF0ZSBzaGFsbG93OiBMUXVlcnk8YW55PnxudWxsLFxuICAgICAgcHJpdmF0ZSBkZWVwOiBMUXVlcnk8YW55PnxudWxsKSB7fVxuXG4gIHRyYWNrPFQ+KHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58c3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLCByZWFkPzogVHlwZTxUPik6XG4gICAgICB2b2lkIHtcbiAgICBpZiAoZGVzY2VuZCkge1xuICAgICAgdGhpcy5kZWVwID0gY3JlYXRlTFF1ZXJ5KHRoaXMuZGVlcCwgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFsbG93ID0gY3JlYXRlTFF1ZXJ5KHRoaXMuc2hhbGxvdywgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9XG4gIH1cblxuICBjbG9uZSgpOiBMUXVlcmllcyB7IHJldHVybiBuZXcgTFF1ZXJpZXNfKHRoaXMsIG51bGwsIHRoaXMuZGVlcCk7IH1cblxuICBjb250YWluZXIoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3Qgc2hhbGxvd1Jlc3VsdHMgPSBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHRoaXMuc2hhbGxvdyk7XG4gICAgY29uc3QgZGVlcFJlc3VsdHMgPSBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHRoaXMuZGVlcCk7XG4gICAgcmV0dXJuIHNoYWxsb3dSZXN1bHRzIHx8IGRlZXBSZXN1bHRzID8gbmV3IExRdWVyaWVzXyh0aGlzLCBzaGFsbG93UmVzdWx0cywgZGVlcFJlc3VsdHMpIDogbnVsbDtcbiAgfVxuXG4gIGNyZWF0ZVZpZXcoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3Qgc2hhbGxvd1Jlc3VsdHMgPSBjb3B5UXVlcmllc1RvVmlldyh0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb1ZpZXcodGhpcy5kZWVwKTtcblxuICAgIHJldHVybiBzaGFsbG93UmVzdWx0cyB8fCBkZWVwUmVzdWx0cyA/IG5ldyBMUXVlcmllc18odGhpcywgc2hhbGxvd1Jlc3VsdHMsIGRlZXBSZXN1bHRzKSA6IG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpbnNlcnRWaWV3KGluZGV4LCB0aGlzLnNoYWxsb3cpO1xuICAgIGluc2VydFZpZXcoaW5kZXgsIHRoaXMuZGVlcCk7XG4gIH1cblxuICBhZGROb2RlKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogdm9pZCB7XG4gICAgYWRkKHRoaXMuZGVlcCwgdE5vZGUsIGZhbHNlKTtcbiAgICBhZGQodGhpcy5zaGFsbG93LCB0Tm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgaW5zZXJ0Tm9kZUJlZm9yZVZpZXdzKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogdm9pZCB7XG4gICAgYWRkKHRoaXMuZGVlcCwgdE5vZGUsIHRydWUpO1xuICAgIGFkZCh0aGlzLnNoYWxsb3csIHROb2RlLCB0cnVlKTtcbiAgfVxuXG4gIHJlbW92ZVZpZXcoKTogdm9pZCB7XG4gICAgcmVtb3ZlVmlldyh0aGlzLnNoYWxsb3cpO1xuICAgIHJlbW92ZVZpZXcodGhpcy5kZWVwKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCk6IExRdWVyeTxhbnk+fG51bGwge1xuICBsZXQgcmVzdWx0OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcblxuICB3aGlsZSAocXVlcnkpIHtcbiAgICBjb25zdCBjb250YWluZXJWYWx1ZXM6IGFueVtdID0gW107ICAvLyBwcmVwYXJlIHJvb20gZm9yIHZpZXdzXG4gICAgcXVlcnkudmFsdWVzLnB1c2goY29udGFpbmVyVmFsdWVzKTtcbiAgICBjb25zdCBjbG9uZWRRdWVyeTogTFF1ZXJ5PGFueT4gPSB7XG4gICAgICBuZXh0OiByZXN1bHQsXG4gICAgICBsaXN0OiBxdWVyeS5saXN0LFxuICAgICAgcHJlZGljYXRlOiBxdWVyeS5wcmVkaWNhdGUsXG4gICAgICB2YWx1ZXM6IGNvbnRhaW5lclZhbHVlcyxcbiAgICAgIGNvbnRhaW5lclZhbHVlczogbnVsbFxuICAgIH07XG4gICAgcmVzdWx0ID0gY2xvbmVkUXVlcnk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY29weVF1ZXJpZXNUb1ZpZXcocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgIG5leHQ6IHJlc3VsdCxcbiAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgIHZhbHVlczogW10sXG4gICAgICBjb250YWluZXJWYWx1ZXM6IHF1ZXJ5LnZhbHVlc1xuICAgIH07XG4gICAgcmVzdWx0ID0gY2xvbmVkUXVlcnk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0VmlldyhpbmRleDogbnVtYmVyLCBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpIHtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFZpZXdRdWVyeWhhc1BvaW50ZXJUb0RlY2xhcmF0aW9uQ29udGFpbmVyKHF1ZXJ5KTtcbiAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMgIS5zcGxpY2UoaW5kZXgsIDAsIHF1ZXJ5LnZhbHVlcyk7XG5cbiAgICAvLyBtYXJrIGEgcXVlcnkgYXMgZGlydHkgb25seSB3aGVuIGluc2VydGVkIHZpZXcgaGFkIG1hdGNoaW5nIG1vZGVzXG4gICAgaWYgKHF1ZXJ5LnZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbiAgICB9XG5cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpIHtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFZpZXdRdWVyeWhhc1BvaW50ZXJUb0RlY2xhcmF0aW9uQ29udGFpbmVyKHF1ZXJ5KTtcblxuICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlcyA9IHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhO1xuICAgIGNvbnN0IHZpZXdWYWx1ZXNJZHggPSBjb250YWluZXJWYWx1ZXMuaW5kZXhPZihxdWVyeS52YWx1ZXMpO1xuICAgIGNvbnN0IHJlbW92ZWQgPSBjb250YWluZXJWYWx1ZXMuc3BsaWNlKHZpZXdWYWx1ZXNJZHgsIDEpO1xuXG4gICAgLy8gbWFyayBhIHF1ZXJ5IGFzIGRpcnR5IG9ubHkgd2hlbiByZW1vdmVkIHZpZXcgaGFkIG1hdGNoaW5nIG1vZGVzXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHJlbW92ZWQubGVuZ3RoLCAxLCAncmVtb3ZlZC5sZW5ndGgnKTtcbiAgICBpZiAocmVtb3ZlZFswXS5sZW5ndGgpIHtcbiAgICAgIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbiAgICB9XG5cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0Vmlld1F1ZXJ5aGFzUG9pbnRlclRvRGVjbGFyYXRpb25Db250YWluZXIocXVlcnk6IExRdWVyeTxhbnk+KSB7XG4gIGFzc2VydERlZmluZWQocXVlcnkuY29udGFpbmVyVmFsdWVzLCAnVmlldyBxdWVyaWVzIG5lZWQgdG8gaGF2ZSBhIHBvaW50ZXIgdG8gY29udGFpbmVyIHZhbHVlcy4nKTtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbi8vIFRPRE86IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGUgKEZXLTQ4NilcbmZ1bmN0aW9uIHF1ZXJ5QnlSZWFkVG9rZW4ocmVhZDogYW55LCB0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGFueSB7XG4gIGNvbnN0IGZhY3RvcnlGbiA9IChyZWFkIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIGlmICh0eXBlb2YgZmFjdG9yeUZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhY3RvcnlGbigpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1hdGNoaW5nSWR4ID1cbiAgICAgICAgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgY3VycmVudFZpZXcsIHJlYWQgYXMgVHlwZTxhbnk+LCBmYWxzZSwgZmFsc2UpO1xuICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKFxuICAgICAgICAgIGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhLCBjdXJyZW50VmlldywgbWF0Y2hpbmdJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBxdWVyeUJ5VE5vZGVUeXBlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYW55IHtcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVsZW1lbnRSZWYoVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVRlbXBsYXRlUmVmKFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYsIFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcXVlcnlCeVRlbXBsYXRlUmVmKFxuICAgIHRlbXBsYXRlUmVmVG9rZW46IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55PiwgdE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcsXG4gICAgcmVhZDogYW55KTogYW55IHtcbiAgY29uc3QgdGVtcGxhdGVSZWZSZXN1bHQgPSAodGVtcGxhdGVSZWZUb2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdKCk7XG4gIGlmIChyZWFkKSB7XG4gICAgcmV0dXJuIHRlbXBsYXRlUmVmUmVzdWx0ID8gcXVlcnlCeVJlYWRUb2tlbihyZWFkLCB0Tm9kZSwgY3VycmVudFZpZXcpIDogbnVsbDtcbiAgfVxuICByZXR1cm4gdGVtcGxhdGVSZWZSZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5UmVhZCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldywgcmVhZDogYW55LCBtYXRjaGluZ0lkeDogbnVtYmVyKTogYW55IHtcbiAgaWYgKHJlYWQpIHtcbiAgICByZXR1cm4gcXVlcnlCeVJlYWRUb2tlbihyZWFkLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIGlmIChtYXRjaGluZ0lkeCA+IC0xKSB7XG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKFxuICAgICAgICBjdXJyZW50Vmlld1tUVklFV10uZGF0YSwgY3VycmVudFZpZXcsIG1hdGNoaW5nSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9XG4gIC8vIGlmIHJlYWQgdG9rZW4gYW5kIC8gb3Igc3RyYXRlZ3kgaXMgbm90IHNwZWNpZmllZCxcbiAgLy8gZGV0ZWN0IGl0IHVzaW5nIGFwcHJvcHJpYXRlIHROb2RlIHR5cGVcbiAgcmV0dXJuIHF1ZXJ5QnlUTm9kZVR5cGUodE5vZGUsIGN1cnJlbnRWaWV3KTtcbn1cblxuLyoqXG4gKiBBZGQgcXVlcnkgbWF0Y2hlcyBmb3IgYSBnaXZlbiBub2RlLlxuICpcbiAqIEBwYXJhbSBxdWVyeSBUaGUgZmlyc3QgcXVlcnkgaW4gdGhlIGxpbmtlZCBsaXN0XG4gKiBAcGFyYW0gdE5vZGUgVGhlIFROb2RlIHRvIG1hdGNoIGFnYWluc3QgcXVlcmllc1xuICogQHBhcmFtIGluc2VydEJlZm9yZUNvbnRhaW5lciBXaGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgYWRkIG1hdGNoZXMgYmVmb3JlIHRoZSBsYXN0XG4gKiBjb250YWluZXIgYXJyYXkuIFRoaXMgbW9kZSBpcyBuZWNlc3NhcnkgaWYgdGhlIHF1ZXJ5IGNvbnRhaW5lciBoYWQgdG8gYmUgY3JlYXRlZFxuICogb3V0IG9mIG9yZGVyIChlLmcuIGEgdmlldyB3YXMgY3JlYXRlZCBpbiBhIGNvbnN0cnVjdG9yKVxuICovXG5mdW5jdGlvbiBhZGQoXG4gICAgcXVlcnk6IExRdWVyeTxhbnk+fCBudWxsLCB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgaW5zZXJ0QmVmb3JlQ29udGFpbmVyOiBib29sZWFuKSB7XG4gIGNvbnN0IGN1cnJlbnRWaWV3ID0gZ2V0TFZpZXcoKTtcblxuICB3aGlsZSAocXVlcnkpIHtcbiAgICBjb25zdCBwcmVkaWNhdGUgPSBxdWVyeS5wcmVkaWNhdGU7XG4gICAgY29uc3QgdHlwZSA9IHByZWRpY2F0ZS50eXBlIGFzIGFueTtcbiAgICBpZiAodHlwZSkge1xuICAgICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgICBpZiAodHlwZSA9PT0gVmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgICAgICByZXN1bHQgPSBxdWVyeUJ5VGVtcGxhdGVSZWYodHlwZSwgdE5vZGUsIGN1cnJlbnRWaWV3LCBwcmVkaWNhdGUucmVhZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBtYXRjaGluZ0lkeCA9IGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIGN1cnJlbnRWaWV3LCB0eXBlLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgICAgICByZXN1bHQgPSBxdWVyeVJlYWQodE5vZGUsIGN1cnJlbnRWaWV3LCBwcmVkaWNhdGUucmVhZCwgbWF0Y2hpbmdJZHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQsIGluc2VydEJlZm9yZUNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcHJlZGljYXRlLnNlbGVjdG9yICE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSk7XG4gICAgICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHF1ZXJ5UmVhZCh0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkLCBtYXRjaGluZ0lkeCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCwgaW5zZXJ0QmVmb3JlQ29udGFpbmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZE1hdGNoKHF1ZXJ5OiBMUXVlcnk8YW55PiwgbWF0Y2hpbmdWYWx1ZTogYW55LCBpbnNlcnRCZWZvcmVWaWV3TWF0Y2hlczogYm9vbGVhbik6IHZvaWQge1xuICAvLyBWaWV3cyBjcmVhdGVkIGluIGNvbnN0cnVjdG9ycyBtYXkgaGF2ZSB0aGVpciBjb250YWluZXIgdmFsdWVzIGNyZWF0ZWQgdG9vIGVhcmx5LiBJbiB0aGlzIGNhc2UsXG4gIC8vIGVuc3VyZSB0ZW1wbGF0ZSBub2RlIHJlc3VsdHMgYXJlIHVuc2hpZnRlZCBiZWZvcmUgY29udGFpbmVyIHJlc3VsdHMuIE90aGVyd2lzZSwgcmVzdWx0cyBpbnNpZGVcbiAgLy8gZW1iZWRkZWQgdmlld3Mgd2lsbCBhcHBlYXIgYmVmb3JlIHJlc3VsdHMgb24gcGFyZW50IHRlbXBsYXRlIG5vZGVzIHdoZW4gZmxhdHRlbmVkLlxuICBpbnNlcnRCZWZvcmVWaWV3TWF0Y2hlcyA/IHF1ZXJ5LnZhbHVlcy51bnNoaWZ0KG1hdGNoaW5nVmFsdWUpIDogcXVlcnkudmFsdWVzLnB1c2gobWF0Y2hpbmdWYWx1ZSk7XG4gIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJlZGljYXRlPFQ+KHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sIHJlYWQ6IFR5cGU8VD58IG51bGwpOiBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHByZWRpY2F0ZSk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogaXNBcnJheSA/IG51bGwgOiBwcmVkaWNhdGUgYXMgVHlwZTxUPixcbiAgICBzZWxlY3RvcjogaXNBcnJheSA/IHByZWRpY2F0ZSBhcyBzdHJpbmdbXSA6IG51bGwsXG4gICAgcmVhZDogcmVhZFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMUXVlcnk8VD4oXG4gICAgcHJldmlvdXM6IExRdWVyeTxhbnk+fCBudWxsLCBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSxcbiAgICByZWFkOiBUeXBlPFQ+fCBudWxsKTogTFF1ZXJ5PFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBuZXh0OiBwcmV2aW91cyxcbiAgICBsaXN0OiBxdWVyeUxpc3QsXG4gICAgcHJlZGljYXRlOiBjcmVhdGVQcmVkaWNhdGUocHJlZGljYXRlLCByZWFkKSxcbiAgICB2YWx1ZXM6IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88VD4pLl92YWx1ZXNUcmVlLFxuICAgIGNvbnRhaW5lclZhbHVlczogbnVsbFxuICB9O1xufVxuXG50eXBlIFF1ZXJ5TGlzdF88VD4gPSBRdWVyeUxpc3Q8VD4mIHtfdmFsdWVzVHJlZTogYW55W10sIF9zdGF0aWM6IGJvb2xlYW59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBRdWVyeUxpc3QgYW5kIHN0b3JlcyBpdCBpbiBMVmlldydzIGNvbGxlY3Rpb24gb2YgYWN0aXZlIHF1ZXJpZXMgKExRdWVyaWVzKS5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5TGlzdEluTFZpZXc8VD4oXG4gICAgLy8gVE9ETzogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZSAoRlctNDg2KVxuICAgIGxWaWV3OiBMVmlldywgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnksXG4gICAgaXNTdGF0aWM6IGJvb2xlYW4pOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudChnZXRJc1BhcmVudCgpKTtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpIGFzIFF1ZXJ5TGlzdF88VD47XG4gIGNvbnN0IHF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXSB8fCAobFZpZXdbUVVFUklFU10gPSBuZXcgTFF1ZXJpZXNfKG51bGwsIG51bGwsIG51bGwpKTtcbiAgcXVlcnlMaXN0Ll92YWx1ZXNUcmVlID0gW107XG4gIHF1ZXJ5TGlzdC5fc3RhdGljID0gaXNTdGF0aWM7XG4gIHF1ZXJpZXMudHJhY2socXVlcnlMaXN0LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQpO1xuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChsVmlldywgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG4gIHJldHVybiBxdWVyeUxpc3Q7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIGEgcXVlcnkgYnkgY29tYmluaW5nIG1hdGNoZXMgZnJvbSBhbGwgYWN0aXZlIHZpZXdzIGFuZCByZW1vdmluZyBtYXRjaGVzIGZyb20gZGVsZXRlZFxuICogdmlld3MuXG4gKlxuICogQHJldHVybnMgYHRydWVgIGlmIGEgcXVlcnkgZ290IGRpcnR5IGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9yIGlmIHRoaXMgaXMgYSBzdGF0aWMgcXVlcnlcbiAqIHJlc29sdmluZyBpbiBjcmVhdGlvbiBtb2RlLCBgZmFsc2VgIG90aGVyd2lzZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXF1ZXJ5UmVmcmVzaChxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxhbnk+KTogYm9vbGVhbiB7XG4gIGNvbnN0IHF1ZXJ5TGlzdEltcGwgPSAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPGFueT4pO1xuICBjb25zdCBjcmVhdGlvbk1vZGUgPSBpc0NyZWF0aW9uTW9kZSgpO1xuXG4gIC8vIGlmIGNyZWF0aW9uIG1vZGUgYW5kIHN0YXRpYyBvciB1cGRhdGUgbW9kZSBhbmQgbm90IHN0YXRpY1xuICBpZiAocXVlcnlMaXN0LmRpcnR5ICYmIGNyZWF0aW9uTW9kZSA9PT0gcXVlcnlMaXN0SW1wbC5fc3RhdGljKSB7XG4gICAgcXVlcnlMaXN0LnJlc2V0KHF1ZXJ5TGlzdEltcGwuX3ZhbHVlc1RyZWUgfHwgW10pO1xuICAgIHF1ZXJ5TGlzdC5ub3RpZnlPbkNoYW5nZXMoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBuZXcgUXVlcnlMaXN0IGZvciBhIHN0YXRpYyB2aWV3IHF1ZXJ5LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdGF0aWNWaWV3UXVlcnk8VD4oXG4gICAgLy8gVE9ETyhGVy00ODYpOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlXG4gICAgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLCByZWFkOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgdmlld1F1ZXJ5SW50ZXJuYWwobFZpZXcsIHRWaWV3LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUpO1xuICB0Vmlldy5zdGF0aWNWaWV3UXVlcmllcyA9IHRydWU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBuZXcgUXVlcnlMaXN0LCBzdG9yZXMgdGhlIHJlZmVyZW5jZSBpbiBMVmlldyBhbmQgcmV0dXJucyBRdWVyeUxpc3QuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dmlld1F1ZXJ5PFQ+KFxuICAgIC8vIFRPRE8oRlctNDg2KTogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZVxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55KTogUXVlcnlMaXN0PFQ+IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgcmV0dXJuIHZpZXdRdWVyeUludGVybmFsKGxWaWV3LCB0VmlldywgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHZpZXdRdWVyeUludGVybmFsPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSxcbiAgICBpc1N0YXRpYzogYm9vbGVhbik6IFF1ZXJ5TGlzdDxUPiB7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3LmV4cGFuZG9TdGFydEluZGV4Kys7XG4gIH1cbiAgY29uc3QgaW5kZXggPSBnZXRDdXJyZW50UXVlcnlJbmRleCgpO1xuICBjb25zdCBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiA9XG4gICAgICBjcmVhdGVRdWVyeUxpc3RJbkxWaWV3PFQ+KGxWaWV3LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIGlzU3RhdGljKTtcbiAgc3RvcmUoaW5kZXggLSBIRUFERVJfT0ZGU0VULCBxdWVyeUxpc3QpO1xuICBzZXRDdXJyZW50UXVlcnlJbmRleChpbmRleCArIDEpO1xuICByZXR1cm4gcXVlcnlMaXN0O1xufVxuXG4vKipcbiAqIExvYWRzIGN1cnJlbnQgVmlldyBRdWVyeSBhbmQgbW92ZXMgdGhlIHBvaW50ZXIvaW5kZXggdG8gdGhlIG5leHQgVmlldyBRdWVyeSBpbiBMVmlldy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxvYWRWaWV3UXVlcnk8VD4oKTogVCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoaW5kZXggKyAxKTtcbiAgcmV0dXJuIGxvYWRJbnRlcm5hbDxUPihnZXRMVmlldygpLCBpbmRleCAtIEhFQURFUl9PRkZTRVQpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2ggKHBhcnQgb2YgYSB2aWV3XG4gKiByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sXG4gICAgLy8gVE9ETyhGVy00ODYpOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlXG4gICAgcmVhZDogYW55KTogUXVlcnlMaXN0PFQ+IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgcmV0dXJuIGNvbnRlbnRRdWVyeUludGVybmFsKGxWaWV3LCB0VmlldywgZGlyZWN0aXZlSW5kZXgsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBjb250ZW50UXVlcnlJbnRlcm5hbDxUPihcbiAgICBsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLFxuICAgIGRlc2NlbmQ6IGJvb2xlYW4sXG4gICAgLy8gVE9ETyhGVy00ODYpOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlXG4gICAgcmVhZDogYW55LCBpc1N0YXRpYzogYm9vbGVhbik6IFF1ZXJ5TGlzdDxUPiB7XG4gIGNvbnN0IGNvbnRlbnRRdWVyeTogUXVlcnlMaXN0PFQ+ID1cbiAgICAgIGNyZWF0ZVF1ZXJ5TGlzdEluTFZpZXc8VD4obFZpZXcsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCwgaXNTdGF0aWMpO1xuICAobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSB8fCAobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSA9IFtdKSkucHVzaChjb250ZW50UXVlcnkpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCB0Vmlld0NvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXMgfHwgKHRWaWV3LmNvbnRlbnRRdWVyaWVzID0gW10pO1xuICAgIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXcuY29udGVudFF1ZXJpZXNbdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMV0gOiAtMTtcbiAgICBpZiAoZGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2goZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGVudFF1ZXJ5O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgc3RhdGljIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoXG4gKiAocGFydCBvZiBhIHZpZXcgcmVmcmVzaCkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEN1cnJlbnQgZGlyZWN0aXZlIGluZGV4XG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdGF0aWNDb250ZW50UXVlcnk8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLFxuICAgIC8vIFRPRE8oRlctNDg2KTogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZVxuICAgIHJlYWQ6IGFueSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb250ZW50UXVlcnlJbnRlcm5hbChsVmlldywgdFZpZXcsIGRpcmVjdGl2ZUluZGV4LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQsIHRydWUpO1xuICB0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcyA9IHRydWU7XG59XG5cbi8qKlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bG9hZENvbnRlbnRRdWVyeTxUPigpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBsVmlld1tDT05URU5UX1FVRVJJRVNdLCAnQ29udGVudCBRdWVyeUxpc3QgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIHF1ZXJ5LicpO1xuXG4gIGNvbnN0IGluZGV4ID0gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3W0NPTlRFTlRfUVVFUklFU10gISwgaW5kZXgpO1xuXG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KGluZGV4ICsgMSk7XG4gIHJldHVybiBsVmlld1tDT05URU5UX1FVRVJJRVNdICFbaW5kZXhdO1xufVxuIl19