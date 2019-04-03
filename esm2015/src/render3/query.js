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
import { load, store } from './instructions/all';
import { storeCleanupWithContext } from './instructions/shared';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { CONTENT_QUERIES, HEADER_OFFSET, QUERIES, TVIEW } from './interfaces/view';
import { getCurrentQueryIndex, getIsParent, getLView, isCreationMode, setCurrentQueryIndex } from './state';
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
            this.deep = createQuery(this.deep, queryList, predicate, read != null ? read : null);
        }
        else {
            this.shallow = createQuery(this.shallow, queryList, predicate, read != null ? read : null);
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
        add(this.deep, tNode);
        add(this.shallow, tNode);
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
 * @param {?} query
 * @param {?} tNode
 * @return {?}
 */
function add(query, tNode) {
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
                addMatch(query, result);
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
                        addMatch(query, result);
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
 * @return {?}
 */
function addMatch(query, matchingValue) {
    query.values.push(matchingValue);
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
function createQuery(previous, queryList, predicate, read) {
    return {
        next: previous,
        list: queryList,
        predicate: createPredicate(predicate, read),
        values: ((/** @type {?} */ ((/** @type {?} */ (queryList)))))._valuesTree,
        containerValues: null
    };
}
/**
 * Creates and returns a QueryList.
 *
 * @template T
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 * @return {?} QueryList<T>
 */
export function query(
// TODO: "read" should be an AbstractType (FW-486)
predicate, descend, read) {
    ngDevMode && assertPreviousIsParent(getIsParent());
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const queryList = (/** @type {?} */ (new QueryList()));
    /** @type {?} */
    const queries = lView[QUERIES] || (lView[QUERIES] = new LQueries_(null, null, null));
    queryList._valuesTree = [];
    queryList._static = false;
    queries.track(queryList, predicate, descend, read);
    storeCleanupWithContext(lView, queryList, queryList.destroy);
    return queryList;
}
/**
 * Refreshes a query by combining matches from all active views and removing matches from deleted
 * views.
 *
 * @param {?} queryList
 * @return {?} `true` if a query got dirty during change detection or if this is a static query
 * resolving in creation mode, `false` otherwise.
 */
export function queryRefresh(queryList) {
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
 * @template T
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 * @return {?}
 */
export function staticViewQuery(
// TODO(FW-486): "read" should be an AbstractType
predicate, descend, read) {
    /** @type {?} */
    const queryList = (/** @type {?} */ (viewQuery(predicate, descend, read)));
    /** @type {?} */
    const tView = getLView()[TVIEW];
    queryList._static = true;
    if (!tView.staticViewQueries) {
        tView.staticViewQueries = true;
    }
}
/**
 * Creates new QueryList, stores the reference in LView and returns QueryList.
 *
 * @template T
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 * @return {?} QueryList<T>
 */
export function viewQuery(
// TODO(FW-486): "read" should be an AbstractType
predicate, descend, read) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    if (tView.firstTemplatePass) {
        tView.expandoStartIndex++;
    }
    /** @type {?} */
    const index = getCurrentQueryIndex();
    /** @type {?} */
    const viewQuery = query(predicate, descend, read);
    store(index - HEADER_OFFSET, viewQuery);
    setCurrentQueryIndex(index + 1);
    return viewQuery;
}
/**
 * Loads current View Query and moves the pointer/index to the next View Query in LView.
 * @template T
 * @return {?}
 */
export function loadViewQuery() {
    /** @type {?} */
    const index = getCurrentQueryIndex();
    setCurrentQueryIndex(index + 1);
    return load(index - HEADER_OFFSET);
}
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 *
 * @template T
 * @param {?} directiveIndex Current directive index
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 * @return {?} QueryList<T>
 */
export function contentQuery(directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const contentQuery = query(predicate, descend, read);
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
 * @template T
 * @param {?} directiveIndex Current directive index
 * @param {?} predicate The type for which the query will search
 * @param {?} descend Whether or not to descend into children
 * @param {?} read What to save in the query
 * @return {?} QueryList<T>
 */
export function staticContentQuery(directiveIndex, predicate, descend, 
// TODO(FW-486): "read" should be an AbstractType
read) {
    /** @type {?} */
    const queryList = (/** @type {?} */ (contentQuery(directiveIndex, predicate, descend, read)));
    /** @type {?} */
    const tView = getLView()[TVIEW];
    queryList._static = true;
    if (!tView.staticContentQueries) {
        tView.staticContentQueries = true;
    }
}
/**
 * @template T
 * @return {?}
 */
export function loadContentQuery() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQy9DLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzlELE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQVcsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEYsT0FBTyxFQUFDLGVBQWUsRUFBRSxhQUFhLEVBQVMsT0FBTyxFQUFFLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFD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LG9CQUFvQixHQUFHLElBQUksQ0FBQztLQUNuQztBQUNILENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGdCQUFnQjs7VUFDeEIsS0FBSyxHQUFHLFFBQVEsRUFBRTtJQUN4QixTQUFTO1FBQ0wsYUFBYSxDQUNULEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRSwrREFBK0QsQ0FBQyxDQUFDOztVQUUzRixLQUFLLEdBQUcsb0JBQW9CLEVBQUU7SUFDcEMsU0FBUyxJQUFJLGlCQUFpQixDQUFDLG1CQUFBLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWhFLG9CQUFvQixDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNoQyxPQUFPLG1CQUFBLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIFZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIFZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRQcmV2aW91c0lzUGFyZW50fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtsb2FkLCBzdG9yZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvYWxsJztcbmltcG9ydCB7c3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtDT05URU5UX1FVRVJJRVMsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBRVUVSSUVTLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50UXVlcnlJbmRleCwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBpc0NyZWF0aW9uTW9kZSwgc2V0Q3VycmVudFF1ZXJ5SW5kZXh9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50UmVmLCBjcmVhdGVUZW1wbGF0ZVJlZn0gZnJvbSAnLi92aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5JztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG4vKipcbiAqIEEgcHJlZGljYXRlIHdoaWNoIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiByZXN1bHRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgLyoqXG4gICAqIElmIGxvb2tpbmcgZm9yIGRpcmVjdGl2ZXMgdGhlbiBpdCBjb250YWlucyB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gICAqL1xuICB0eXBlOiBUeXBlPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHNlbGVjdG9yIHRoZW4gY29udGFpbnMgbG9jYWwgbmFtZXMgdG8gcXVlcnkgZm9yLlxuICAgKi9cbiAgc2VsZWN0b3I6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGljaCB0b2tlbiBzaG91bGQgYmUgcmVhZCBmcm9tIERJIGZvciB0aGlzIHF1ZXJ5LlxuICAgKi9cbiAgcmVhZDogVHlwZTxUPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCByZXByZXNlbnRpbmcgYSBxdWVyeSwgd2hpY2ggaXMgYSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gcXVlcnkgcHJlZGljYXRlIHRvIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiAtIHZhbHVlcyBjb2xsZWN0ZWQgYmFzZWQgb24gYSBwcmVkaWNhdGVcbiAqIC0gYFF1ZXJ5TGlzdGAgdG8gd2hpY2ggY29sbGVjdGVkIHZhbHVlcyBzaG91bGQgYmUgcmVwb3J0ZWRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMUXVlcnk8VD4ge1xuICAvKipcbiAgICogTmV4dCBxdWVyeS4gVXNlZCB3aGVuIHF1ZXJpZXMgYXJlIHN0b3JlZCBhcyBhIGxpbmtlZCBsaXN0IGluIGBMUXVlcmllc2AuXG4gICAqL1xuICBuZXh0OiBMUXVlcnk8YW55PnxudWxsO1xuXG4gIC8qKlxuICAgKiBEZXN0aW5hdGlvbiB0byB3aGljaCB0aGUgdmFsdWUgc2hvdWxkIGJlIGFkZGVkLlxuICAgKi9cbiAgbGlzdDogUXVlcnlMaXN0PFQ+O1xuXG4gIC8qKlxuICAgKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICAgKiByZXN1bHRzLlxuICAgKi9cbiAgcHJlZGljYXRlOiBRdWVyeVByZWRpY2F0ZTxUPjtcblxuICAvKipcbiAgICogVmFsdWVzIHdoaWNoIGhhdmUgYmVlbiBsb2NhdGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHdoYXQgYnVpbGRzIHVwIHRoZSBgUXVlcnlMaXN0Ll92YWx1ZXNUcmVlYC5cbiAgICovXG4gIHZhbHVlczogYW55W107XG5cbiAgLyoqXG4gICAqIEEgcG9pbnRlciB0byBhbiBhcnJheSB0aGF0IHN0b3JlcyBjb2xsZWN0ZWQgdmFsdWVzIGZyb20gdmlld3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHdlIGtub3cgYVxuICAgKiBjb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgbm9kZXMgY29sbGVjdGVkIGZyb20gdmlld3MuXG4gICAqL1xuICBjb250YWluZXJWYWx1ZXM6IGFueVtdfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHBhcmVudDogTFF1ZXJpZXNffG51bGwsIHByaXZhdGUgc2hhbGxvdzogTFF1ZXJ5PGFueT58bnVsbCxcbiAgICAgIHByaXZhdGUgZGVlcDogTFF1ZXJ5PGFueT58bnVsbCkge31cblxuICB0cmFjazxUPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fHN0cmluZ1tdLCBkZXNjZW5kPzogYm9vbGVhbiwgcmVhZD86IFR5cGU8VD4pOlxuICAgICAgdm9pZCB7XG4gICAgaWYgKGRlc2NlbmQpIHtcbiAgICAgIHRoaXMuZGVlcCA9IGNyZWF0ZVF1ZXJ5KHRoaXMuZGVlcCwgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFsbG93ID0gY3JlYXRlUXVlcnkodGhpcy5zaGFsbG93LCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKCk6IExRdWVyaWVzIHsgcmV0dXJuIG5ldyBMUXVlcmllc18odGhpcywgbnVsbCwgdGhpcy5kZWVwKTsgfVxuXG4gIGNvbnRhaW5lcigpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCBzaGFsbG93UmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9Db250YWluZXIodGhpcy5zaGFsbG93KTtcbiAgICBjb25zdCBkZWVwUmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9Db250YWluZXIodGhpcy5kZWVwKTtcbiAgICByZXR1cm4gc2hhbGxvd1Jlc3VsdHMgfHwgZGVlcFJlc3VsdHMgPyBuZXcgTFF1ZXJpZXNfKHRoaXMsIHNoYWxsb3dSZXN1bHRzLCBkZWVwUmVzdWx0cykgOiBudWxsO1xuICB9XG5cbiAgY3JlYXRlVmlldygpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCBzaGFsbG93UmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9WaWV3KHRoaXMuc2hhbGxvdyk7XG4gICAgY29uc3QgZGVlcFJlc3VsdHMgPSBjb3B5UXVlcmllc1RvVmlldyh0aGlzLmRlZXApO1xuXG4gICAgcmV0dXJuIHNoYWxsb3dSZXN1bHRzIHx8IGRlZXBSZXN1bHRzID8gbmV3IExRdWVyaWVzXyh0aGlzLCBzaGFsbG93UmVzdWx0cywgZGVlcFJlc3VsdHMpIDogbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGluc2VydFZpZXcoaW5kZXgsIHRoaXMuc2hhbGxvdyk7XG4gICAgaW5zZXJ0VmlldyhpbmRleCwgdGhpcy5kZWVwKTtcbiAgfVxuXG4gIGFkZE5vZGUodE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpOiB2b2lkIHtcbiAgICBhZGQodGhpcy5kZWVwLCB0Tm9kZSk7XG4gICAgYWRkKHRoaXMuc2hhbGxvdywgdE5vZGUpO1xuICB9XG5cbiAgcmVtb3ZlVmlldygpOiB2b2lkIHtcbiAgICByZW1vdmVWaWV3KHRoaXMuc2hhbGxvdyk7XG4gICAgcmVtb3ZlVmlldyh0aGlzLmRlZXApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvcHlRdWVyaWVzVG9Db250YWluZXIocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlczogYW55W10gPSBbXTsgIC8vIHByZXBhcmUgcm9vbSBmb3Igdmlld3NcbiAgICBxdWVyeS52YWx1ZXMucHVzaChjb250YWluZXJWYWx1ZXMpO1xuICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgIG5leHQ6IHJlc3VsdCxcbiAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgIHZhbHVlczogY29udGFpbmVyVmFsdWVzLFxuICAgICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpOiBMUXVlcnk8YW55PnxudWxsIHtcbiAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgY2xvbmVkUXVlcnk6IExRdWVyeTxhbnk+ID0ge1xuICAgICAgbmV4dDogcmVzdWx0LFxuICAgICAgbGlzdDogcXVlcnkubGlzdCxcbiAgICAgIHByZWRpY2F0ZTogcXVlcnkucHJlZGljYXRlLFxuICAgICAgdmFsdWVzOiBbXSxcbiAgICAgIGNvbnRhaW5lclZhbHVlczogcXVlcnkudmFsdWVzXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIsIHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Vmlld1F1ZXJ5aGFzUG9pbnRlclRvRGVjbGFyYXRpb25Db250YWluZXIocXVlcnkpO1xuICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhLnNwbGljZShpbmRleCwgMCwgcXVlcnkudmFsdWVzKTtcblxuICAgIC8vIG1hcmsgYSBxdWVyeSBhcyBkaXJ0eSBvbmx5IHdoZW4gaW5zZXJ0ZWQgdmlldyBoYWQgbWF0Y2hpbmcgbW9kZXNcbiAgICBpZiAocXVlcnkudmFsdWVzLmxlbmd0aCkge1xuICAgICAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xuICAgIH1cblxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVWaWV3KHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Vmlld1F1ZXJ5aGFzUG9pbnRlclRvRGVjbGFyYXRpb25Db250YWluZXIocXVlcnkpO1xuXG4gICAgY29uc3QgY29udGFpbmVyVmFsdWVzID0gcXVlcnkuY29udGFpbmVyVmFsdWVzICE7XG4gICAgY29uc3Qgdmlld1ZhbHVlc0lkeCA9IGNvbnRhaW5lclZhbHVlcy5pbmRleE9mKHF1ZXJ5LnZhbHVlcyk7XG4gICAgY29uc3QgcmVtb3ZlZCA9IGNvbnRhaW5lclZhbHVlcy5zcGxpY2Uodmlld1ZhbHVlc0lkeCwgMSk7XG5cbiAgICAvLyBtYXJrIGEgcXVlcnkgYXMgZGlydHkgb25seSB3aGVuIHJlbW92ZWQgdmlldyBoYWQgbWF0Y2hpbmcgbW9kZXNcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwocmVtb3ZlZC5sZW5ndGgsIDEsICdyZW1vdmVkLmxlbmd0aCcpO1xuICAgIGlmIChyZW1vdmVkWzBdLmxlbmd0aCkge1xuICAgICAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xuICAgIH1cblxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhc3NlcnRWaWV3UXVlcnloYXNQb2ludGVyVG9EZWNsYXJhdGlvbkNvbnRhaW5lcihxdWVyeTogTFF1ZXJ5PGFueT4pIHtcbiAgYXNzZXJ0RGVmaW5lZChxdWVyeS5jb250YWluZXJWYWx1ZXMsICdWaWV3IHF1ZXJpZXMgbmVlZCB0byBoYXZlIGEgcG9pbnRlciB0byBjb250YWluZXIgdmFsdWVzLicpO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgbG9jYWwgbmFtZXMgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgcmV0dXJucyBkaXJlY3RpdmUgaW5kZXhcbiAqIChvciAtMSBpZiBhIGxvY2FsIG5hbWUgcG9pbnRzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBzdGF0aWMgZGF0YSBvZiBhIG5vZGUgdG8gY2hlY2tcbiAqIEBwYXJhbSBzZWxlY3RvciBzZWxlY3RvciB0byBtYXRjaFxuICogQHJldHVybnMgZGlyZWN0aXZlIGluZGV4LCAtMSBvciBudWxsIGlmIGEgc2VsZWN0b3IgZGlkbid0IG1hdGNoIGFueSBvZiB0aGUgbG9jYWwgbmFtZXNcbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAobG9jYWxOYW1lc1tpXSA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLy8gVE9ETzogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZSAoRlctNDg2KVxuZnVuY3Rpb24gcXVlcnlCeVJlYWRUb2tlbihyZWFkOiBhbnksIHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYW55IHtcbiAgY29uc3QgZmFjdG9yeUZuID0gKHJlYWQgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgaWYgKHR5cGVvZiBmYWN0b3J5Rm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFjdG9yeUZuKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbWF0Y2hpbmdJZHggPVxuICAgICAgICBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCBjdXJyZW50VmlldywgcmVhZCBhcyBUeXBlPGFueT4sIGZhbHNlLCBmYWxzZSk7XG4gICAgaWYgKG1hdGNoaW5nSWR4ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgICAgICAgY3VycmVudFZpZXdbVFZJRVddLmRhdGEsIGN1cnJlbnRWaWV3LCBtYXRjaGluZ0lkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5QnlUTm9kZVR5cGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBxdWVyeUJ5VGVtcGxhdGVSZWYoXG4gICAgdGVtcGxhdGVSZWZUb2tlbjogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+LCB0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyxcbiAgICByZWFkOiBhbnkpOiBhbnkge1xuICBjb25zdCB0ZW1wbGF0ZVJlZlJlc3VsdCA9ICh0ZW1wbGF0ZVJlZlRva2VuIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0oKTtcbiAgaWYgKHJlYWQpIHtcbiAgICByZXR1cm4gdGVtcGxhdGVSZWZSZXN1bHQgPyBxdWVyeUJ5UmVhZFRva2VuKHJlYWQsIHROb2RlLCBjdXJyZW50VmlldykgOiBudWxsO1xuICB9XG4gIHJldHVybiB0ZW1wbGF0ZVJlZlJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcXVlcnlSZWFkKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LCByZWFkOiBhbnksIG1hdGNoaW5nSWR4OiBudW1iZXIpOiBhbnkge1xuICBpZiAocmVhZCkge1xuICAgIHJldHVybiBxdWVyeUJ5UmVhZFRva2VuKHJlYWQsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgaWYgKG1hdGNoaW5nSWR4ID4gLTEpIHtcbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgICAgIGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhLCBjdXJyZW50VmlldywgbWF0Y2hpbmdJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH1cbiAgLy8gaWYgcmVhZCB0b2tlbiBhbmQgLyBvciBzdHJhdGVneSBpcyBub3Qgc3BlY2lmaWVkLFxuICAvLyBkZXRlY3QgaXQgdXNpbmcgYXBwcm9wcmlhdGUgdE5vZGUgdHlwZVxuICByZXR1cm4gcXVlcnlCeVROb2RlVHlwZSh0Tm9kZSwgY3VycmVudFZpZXcpO1xufVxuXG5mdW5jdGlvbiBhZGQoXG4gICAgcXVlcnk6IExRdWVyeTxhbnk+fCBudWxsLCB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgY29uc3QgY3VycmVudFZpZXcgPSBnZXRMVmlldygpO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IHF1ZXJ5LnByZWRpY2F0ZTtcbiAgICBjb25zdCB0eXBlID0gcHJlZGljYXRlLnR5cGUgYXMgYW55O1xuICAgIGlmICh0eXBlKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gbnVsbDtcbiAgICAgIGlmICh0eXBlID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgICAgIHJlc3VsdCA9IHF1ZXJ5QnlUZW1wbGF0ZVJlZih0eXBlLCB0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgY3VycmVudFZpZXcsIHR5cGUsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgICAgIHJlc3VsdCA9IHF1ZXJ5UmVhZCh0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkLCBtYXRjaGluZ0lkeCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcHJlZGljYXRlLnNlbGVjdG9yICE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSk7XG4gICAgICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHF1ZXJ5UmVhZCh0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkLCBtYXRjaGluZ0lkeCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRNYXRjaChxdWVyeTogTFF1ZXJ5PGFueT4sIG1hdGNoaW5nVmFsdWU6IGFueSk6IHZvaWQge1xuICBxdWVyeS52YWx1ZXMucHVzaChtYXRjaGluZ1ZhbHVlKTtcbiAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcmVkaWNhdGU8VD4ocHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSwgcmVhZDogVHlwZTxUPnwgbnVsbCk6IFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkocHJlZGljYXRlKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBpc0FycmF5ID8gbnVsbCA6IHByZWRpY2F0ZSBhcyBUeXBlPFQ+LFxuICAgIHNlbGVjdG9yOiBpc0FycmF5ID8gcHJlZGljYXRlIGFzIHN0cmluZ1tdIDogbnVsbCxcbiAgICByZWFkOiByZWFkXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5PFQ+KFxuICAgIHByZXZpb3VzOiBMUXVlcnk8YW55PnwgbnVsbCwgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sXG4gICAgcmVhZDogVHlwZTxUPnwgbnVsbCk6IExRdWVyeTxUPiB7XG4gIHJldHVybiB7XG4gICAgbmV4dDogcHJldmlvdXMsXG4gICAgbGlzdDogcXVlcnlMaXN0LFxuICAgIHByZWRpY2F0ZTogY3JlYXRlUHJlZGljYXRlKHByZWRpY2F0ZSwgcmVhZCksXG4gICAgdmFsdWVzOiAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPFQ+KS5fdmFsdWVzVHJlZSxcbiAgICBjb250YWluZXJWYWx1ZXM6IG51bGxcbiAgfTtcbn1cblxudHlwZSBRdWVyeUxpc3RfPFQ+ID0gUXVlcnlMaXN0PFQ+JiB7X3ZhbHVlc1RyZWU6IGFueVtdLCBfc3RhdGljOiBib29sZWFufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5PFQ+KFxuICAgIC8vIFRPRE86IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGUgKEZXLTQ4NilcbiAgICBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSk6IFF1ZXJ5TGlzdDxUPiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KGdldElzUGFyZW50KCkpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHF1ZXJ5TGlzdCA9IG5ldyBRdWVyeUxpc3Q8VD4oKSBhcyBRdWVyeUxpc3RfPFQ+O1xuICBjb25zdCBxdWVyaWVzID0gbFZpZXdbUVVFUklFU10gfHwgKGxWaWV3W1FVRVJJRVNdID0gbmV3IExRdWVyaWVzXyhudWxsLCBudWxsLCBudWxsKSk7XG4gIHF1ZXJ5TGlzdC5fdmFsdWVzVHJlZSA9IFtdO1xuICBxdWVyeUxpc3QuX3N0YXRpYyA9IGZhbHNlO1xuICBxdWVyaWVzLnRyYWNrKHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobFZpZXcsIHF1ZXJ5TGlzdCwgcXVlcnlMaXN0LmRlc3Ryb3kpO1xuICByZXR1cm4gcXVlcnlMaXN0O1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhIHF1ZXJ5IGJ5IGNvbWJpbmluZyBtYXRjaGVzIGZyb20gYWxsIGFjdGl2ZSB2aWV3cyBhbmQgcmVtb3ZpbmcgbWF0Y2hlcyBmcm9tIGRlbGV0ZWRcbiAqIHZpZXdzLlxuICpcbiAqIEByZXR1cm5zIGB0cnVlYCBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBvciBpZiB0aGlzIGlzIGEgc3RhdGljIHF1ZXJ5XG4gKiByZXNvbHZpbmcgaW4gY3JlYXRpb24gbW9kZSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWVyeVJlZnJlc2gocXVlcnlMaXN0OiBRdWVyeUxpc3Q8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCBxdWVyeUxpc3RJbXBsID0gKHF1ZXJ5TGlzdCBhcyBhbnkgYXMgUXVlcnlMaXN0Xzxhbnk+KTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlID0gaXNDcmVhdGlvbk1vZGUoKTtcblxuICAvLyBpZiBjcmVhdGlvbiBtb2RlIGFuZCBzdGF0aWMgb3IgdXBkYXRlIG1vZGUgYW5kIG5vdCBzdGF0aWNcbiAgaWYgKHF1ZXJ5TGlzdC5kaXJ0eSAmJiBjcmVhdGlvbk1vZGUgPT09IHF1ZXJ5TGlzdEltcGwuX3N0YXRpYykge1xuICAgIHF1ZXJ5TGlzdC5yZXNldChxdWVyeUxpc3RJbXBsLl92YWx1ZXNUcmVlIHx8IFtdKTtcbiAgICBxdWVyeUxpc3Qubm90aWZ5T25DaGFuZ2VzKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCBmb3IgYSBzdGF0aWMgdmlldyBxdWVyeS5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RhdGljVmlld1F1ZXJ5PFQ+KFxuICAgIC8vIFRPRE8oRlctNDg2KTogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZVxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZDogYm9vbGVhbiwgcmVhZDogYW55KTogdm9pZCB7XG4gIGNvbnN0IHF1ZXJ5TGlzdCA9IHZpZXdRdWVyeShwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQpIGFzIFF1ZXJ5TGlzdF88VD47XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIHF1ZXJ5TGlzdC5fc3RhdGljID0gdHJ1ZTtcbiAgaWYgKCF0Vmlldy5zdGF0aWNWaWV3UXVlcmllcykge1xuICAgIHRWaWV3LnN0YXRpY1ZpZXdRdWVyaWVzID0gdHJ1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgbmV3IFF1ZXJ5TGlzdCwgc3RvcmVzIHRoZSByZWZlcmVuY2UgaW4gTFZpZXcgYW5kIHJldHVybnMgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdRdWVyeTxUPihcbiAgICAvLyBUT0RPKEZXLTQ4Nik6IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGVcbiAgICBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sIHJlYWQ6IGFueSk6IFF1ZXJ5TGlzdDxUPiB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3LmV4cGFuZG9TdGFydEluZGV4Kys7XG4gIH1cbiAgY29uc3QgaW5kZXggPSBnZXRDdXJyZW50UXVlcnlJbmRleCgpO1xuICBjb25zdCB2aWV3UXVlcnk6IFF1ZXJ5TGlzdDxUPiA9IHF1ZXJ5PFQ+KHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCk7XG4gIHN0b3JlKGluZGV4IC0gSEVBREVSX09GRlNFVCwgdmlld1F1ZXJ5KTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoaW5kZXggKyAxKTtcbiAgcmV0dXJuIHZpZXdRdWVyeTtcbn1cblxuLyoqXG4qIExvYWRzIGN1cnJlbnQgVmlldyBRdWVyeSBhbmQgbW92ZXMgdGhlIHBvaW50ZXIvaW5kZXggdG8gdGhlIG5leHQgVmlldyBRdWVyeSBpbiBMVmlldy5cbiovXG5leHBvcnQgZnVuY3Rpb24gbG9hZFZpZXdRdWVyeTxUPigpOiBUIHtcbiAgY29uc3QgaW5kZXggPSBnZXRDdXJyZW50UXVlcnlJbmRleCgpO1xuICBzZXRDdXJyZW50UXVlcnlJbmRleChpbmRleCArIDEpO1xuICByZXR1cm4gbG9hZDxUPihpbmRleCAtIEhFQURFUl9PRkZTRVQpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2ggKHBhcnQgb2YgYSB2aWV3XG4gKiByZWZyZXNoKS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggQ3VycmVudCBkaXJlY3RpdmUgaW5kZXhcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRlbnRRdWVyeTxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ6IGJvb2xlYW4sXG4gICAgLy8gVE9ETyhGVy00ODYpOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlXG4gICAgcmVhZDogYW55KTogUXVlcnlMaXN0PFQ+IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgY29udGVudFF1ZXJ5OiBRdWVyeUxpc3Q8VD4gPSBxdWVyeTxUPihwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQpO1xuICAobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSB8fCAobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSA9IFtdKSkucHVzaChjb250ZW50UXVlcnkpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCB0Vmlld0NvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXMgfHwgKHRWaWV3LmNvbnRlbnRRdWVyaWVzID0gW10pO1xuICAgIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXcuY29udGVudFF1ZXJpZXNbdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMV0gOiAtMTtcbiAgICBpZiAoZGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2goZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGVudFF1ZXJ5O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgc3RhdGljIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoXG4gKiAocGFydCBvZiBhIHZpZXcgcmVmcmVzaCkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEN1cnJlbnQgZGlyZWN0aXZlIGluZGV4XG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGF0aWNDb250ZW50UXVlcnk8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kOiBib29sZWFuLFxuICAgIC8vIFRPRE8oRlctNDg2KTogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZVxuICAgIHJlYWQ6IGFueSk6IHZvaWQge1xuICBjb25zdCBxdWVyeUxpc3QgPSBjb250ZW50UXVlcnkoZGlyZWN0aXZlSW5kZXgsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCkgYXMgUXVlcnlMaXN0XzxUPjtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgcXVlcnlMaXN0Ll9zdGF0aWMgPSB0cnVlO1xuICBpZiAoIXRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzKSB7XG4gICAgdFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMgPSB0cnVlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkQ29udGVudFF1ZXJ5PFQ+KCk6IFF1ZXJ5TGlzdDxUPiB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGxWaWV3W0NPTlRFTlRfUVVFUklFU10sICdDb250ZW50IFF1ZXJ5TGlzdCBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgcXVlcnkuJyk7XG5cbiAgY29uc3QgaW5kZXggPSBnZXRDdXJyZW50UXVlcnlJbmRleCgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSAhLCBpbmRleCk7XG5cbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoaW5kZXggKyAxKTtcbiAgcmV0dXJuIGxWaWV3W0NPTlRFTlRfUVVFUklFU10gIVtpbmRleF07XG59XG4iXX0=