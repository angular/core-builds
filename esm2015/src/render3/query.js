/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { load, store, storeCleanupWithContext } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { CONTENT_QUERIES, HEADER_OFFSET, QUERIES, TVIEW } from './interfaces/view';
import { getCurrentQueryIndex, getIsParent, getLView, setCurrentQueryIndex } from './state';
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
 * @param {?=} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 * @return {?} QueryList<T>
 */
export function query(
// TODO: "read" should be an AbstractType (FW-486)
predicate, descend, read) {
    ngDevMode && assertPreviousIsParent(getIsParent());
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const queryList = new QueryList();
    /** @type {?} */
    const queries = lView[QUERIES] || (lView[QUERIES] = new LQueries_(null, null, null));
    ((/** @type {?} */ (queryList)))._valuesTree = [];
    queries.track(queryList, predicate, descend, read);
    storeCleanupWithContext(lView, queryList, queryList.destroy);
    return queryList;
}
/**
 * Refreshes a query by combining matches from all active views and removing matches from deleted
 * views.
 * Returns true if a query got dirty during change detection, false otherwise.
 * @param {?} queryList
 * @return {?}
 */
export function queryRefresh(queryList) {
    /** @type {?} */
    const queryListImpl = ((/** @type {?} */ ((/** @type {?} */ (queryList)))));
    if (queryList.dirty) {
        queryList.reset(queryListImpl._valuesTree || []);
        queryList.notifyOnChanges();
        return true;
    }
    return false;
}
/**
 * Creates new QueryList, stores the reference in LView and returns QueryList.
 *
 * @template T
 * @param {?} predicate The type for which the query will search
 * @param {?=} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 * @return {?} QueryList<T>
 */
export function viewQuery(
// TODO: "read" should be an AbstractType (FW-486)
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
 * @param {?=} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 * @return {?} QueryList<T>
 */
export function contentQuery(directiveIndex, predicate, descend, 
// TODO: "read" should be an AbstractType (FW-486)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3BFLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQVcsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEYsT0FBTyxFQUFDLGVBQWUsRUFBRSxhQUFhLEVBQVMsT0FBTyxFQUFFLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3hGLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxXQUFX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QUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVGLElBQUksY0FBYyxLQUFLLHVCQUF1QixFQUFFO1lBQzlDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUMxQztLQUNGO0lBQ0QsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCOztVQUN4QixLQUFLLEdBQUcsUUFBUSxFQUFFO0lBQ3hCLFNBQVM7UUFDTCxhQUFhLENBQ1QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLCtEQUErRCxDQUFDLENBQUM7O1VBRTNGLEtBQUssR0FBRyxvQkFBb0IsRUFBRTtJQUNwQyxTQUFTLElBQUksaUJBQWlCLENBQUMsbUJBQUEsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFaEUsb0JBQW9CLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sbUJBQUEsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgVmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlci9xdWVyeV9saXN0JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2Fzc2VydFByZXZpb3VzSXNQYXJlbnR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Tm9kZUluamVjdGFibGUsIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXJ9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtOR19FTEVNRU5UX0lEfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge2xvYWQsIHN0b3JlLCBzdG9yZUNsZWFudXBXaXRoQ29udGV4dH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7Q09OVEVOVF9RVUVSSUVTLCBIRUFERVJfT0ZGU0VULCBMVmlldywgUVVFUklFUywgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFF1ZXJ5SW5kZXgsIGdldElzUGFyZW50LCBnZXRMVmlldywgc2V0Q3VycmVudFF1ZXJ5SW5kZXh9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50UmVmLCBjcmVhdGVUZW1wbGF0ZVJlZn0gZnJvbSAnLi92aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5JztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG4vKipcbiAqIEEgcHJlZGljYXRlIHdoaWNoIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiByZXN1bHRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgLyoqXG4gICAqIElmIGxvb2tpbmcgZm9yIGRpcmVjdGl2ZXMgdGhlbiBpdCBjb250YWlucyB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gICAqL1xuICB0eXBlOiBUeXBlPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHNlbGVjdG9yIHRoZW4gY29udGFpbnMgbG9jYWwgbmFtZXMgdG8gcXVlcnkgZm9yLlxuICAgKi9cbiAgc2VsZWN0b3I6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGljaCB0b2tlbiBzaG91bGQgYmUgcmVhZCBmcm9tIERJIGZvciB0aGlzIHF1ZXJ5LlxuICAgKi9cbiAgcmVhZDogVHlwZTxUPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCByZXByZXNlbnRpbmcgYSBxdWVyeSwgd2hpY2ggaXMgYSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gcXVlcnkgcHJlZGljYXRlIHRvIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiAtIHZhbHVlcyBjb2xsZWN0ZWQgYmFzZWQgb24gYSBwcmVkaWNhdGVcbiAqIC0gYFF1ZXJ5TGlzdGAgdG8gd2hpY2ggY29sbGVjdGVkIHZhbHVlcyBzaG91bGQgYmUgcmVwb3J0ZWRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMUXVlcnk8VD4ge1xuICAvKipcbiAgICogTmV4dCBxdWVyeS4gVXNlZCB3aGVuIHF1ZXJpZXMgYXJlIHN0b3JlZCBhcyBhIGxpbmtlZCBsaXN0IGluIGBMUXVlcmllc2AuXG4gICAqL1xuICBuZXh0OiBMUXVlcnk8YW55PnxudWxsO1xuXG4gIC8qKlxuICAgKiBEZXN0aW5hdGlvbiB0byB3aGljaCB0aGUgdmFsdWUgc2hvdWxkIGJlIGFkZGVkLlxuICAgKi9cbiAgbGlzdDogUXVlcnlMaXN0PFQ+O1xuXG4gIC8qKlxuICAgKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICAgKiByZXN1bHRzLlxuICAgKi9cbiAgcHJlZGljYXRlOiBRdWVyeVByZWRpY2F0ZTxUPjtcblxuICAvKipcbiAgICogVmFsdWVzIHdoaWNoIGhhdmUgYmVlbiBsb2NhdGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHdoYXQgYnVpbGRzIHVwIHRoZSBgUXVlcnlMaXN0Ll92YWx1ZXNUcmVlYC5cbiAgICovXG4gIHZhbHVlczogYW55W107XG5cbiAgLyoqXG4gICAqIEEgcG9pbnRlciB0byBhbiBhcnJheSB0aGF0IHN0b3JlcyBjb2xsZWN0ZWQgdmFsdWVzIGZyb20gdmlld3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHdlIGtub3cgYVxuICAgKiBjb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgbm9kZXMgY29sbGVjdGVkIGZyb20gdmlld3MuXG4gICAqL1xuICBjb250YWluZXJWYWx1ZXM6IGFueVtdfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHBhcmVudDogTFF1ZXJpZXNffG51bGwsIHByaXZhdGUgc2hhbGxvdzogTFF1ZXJ5PGFueT58bnVsbCxcbiAgICAgIHByaXZhdGUgZGVlcDogTFF1ZXJ5PGFueT58bnVsbCkge31cblxuICB0cmFjazxUPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fHN0cmluZ1tdLCBkZXNjZW5kPzogYm9vbGVhbiwgcmVhZD86IFR5cGU8VD4pOlxuICAgICAgdm9pZCB7XG4gICAgaWYgKGRlc2NlbmQpIHtcbiAgICAgIHRoaXMuZGVlcCA9IGNyZWF0ZVF1ZXJ5KHRoaXMuZGVlcCwgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFsbG93ID0gY3JlYXRlUXVlcnkodGhpcy5zaGFsbG93LCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKCk6IExRdWVyaWVzIHsgcmV0dXJuIG5ldyBMUXVlcmllc18odGhpcywgbnVsbCwgdGhpcy5kZWVwKTsgfVxuXG4gIGNvbnRhaW5lcigpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCBzaGFsbG93UmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9Db250YWluZXIodGhpcy5zaGFsbG93KTtcbiAgICBjb25zdCBkZWVwUmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9Db250YWluZXIodGhpcy5kZWVwKTtcbiAgICByZXR1cm4gc2hhbGxvd1Jlc3VsdHMgfHwgZGVlcFJlc3VsdHMgPyBuZXcgTFF1ZXJpZXNfKHRoaXMsIHNoYWxsb3dSZXN1bHRzLCBkZWVwUmVzdWx0cykgOiBudWxsO1xuICB9XG5cbiAgY3JlYXRlVmlldygpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCBzaGFsbG93UmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9WaWV3KHRoaXMuc2hhbGxvdyk7XG4gICAgY29uc3QgZGVlcFJlc3VsdHMgPSBjb3B5UXVlcmllc1RvVmlldyh0aGlzLmRlZXApO1xuXG4gICAgcmV0dXJuIHNoYWxsb3dSZXN1bHRzIHx8IGRlZXBSZXN1bHRzID8gbmV3IExRdWVyaWVzXyh0aGlzLCBzaGFsbG93UmVzdWx0cywgZGVlcFJlc3VsdHMpIDogbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGluc2VydFZpZXcoaW5kZXgsIHRoaXMuc2hhbGxvdyk7XG4gICAgaW5zZXJ0VmlldyhpbmRleCwgdGhpcy5kZWVwKTtcbiAgfVxuXG4gIGFkZE5vZGUodE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpOiB2b2lkIHtcbiAgICBhZGQodGhpcy5kZWVwLCB0Tm9kZSk7XG4gICAgYWRkKHRoaXMuc2hhbGxvdywgdE5vZGUpO1xuICB9XG5cbiAgcmVtb3ZlVmlldygpOiB2b2lkIHtcbiAgICByZW1vdmVWaWV3KHRoaXMuc2hhbGxvdyk7XG4gICAgcmVtb3ZlVmlldyh0aGlzLmRlZXApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvcHlRdWVyaWVzVG9Db250YWluZXIocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlczogYW55W10gPSBbXTsgIC8vIHByZXBhcmUgcm9vbSBmb3Igdmlld3NcbiAgICBxdWVyeS52YWx1ZXMucHVzaChjb250YWluZXJWYWx1ZXMpO1xuICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgIG5leHQ6IHJlc3VsdCxcbiAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgIHZhbHVlczogY29udGFpbmVyVmFsdWVzLFxuICAgICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpOiBMUXVlcnk8YW55PnxudWxsIHtcbiAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgY2xvbmVkUXVlcnk6IExRdWVyeTxhbnk+ID0ge1xuICAgICAgbmV4dDogcmVzdWx0LFxuICAgICAgbGlzdDogcXVlcnkubGlzdCxcbiAgICAgIHByZWRpY2F0ZTogcXVlcnkucHJlZGljYXRlLFxuICAgICAgdmFsdWVzOiBbXSxcbiAgICAgIGNvbnRhaW5lclZhbHVlczogcXVlcnkudmFsdWVzXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIsIHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Vmlld1F1ZXJ5aGFzUG9pbnRlclRvRGVjbGFyYXRpb25Db250YWluZXIocXVlcnkpO1xuICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhLnNwbGljZShpbmRleCwgMCwgcXVlcnkudmFsdWVzKTtcblxuICAgIC8vIG1hcmsgYSBxdWVyeSBhcyBkaXJ0eSBvbmx5IHdoZW4gaW5zZXJ0ZWQgdmlldyBoYWQgbWF0Y2hpbmcgbW9kZXNcbiAgICBpZiAocXVlcnkudmFsdWVzLmxlbmd0aCkge1xuICAgICAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xuICAgIH1cblxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVWaWV3KHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Vmlld1F1ZXJ5aGFzUG9pbnRlclRvRGVjbGFyYXRpb25Db250YWluZXIocXVlcnkpO1xuXG4gICAgY29uc3QgY29udGFpbmVyVmFsdWVzID0gcXVlcnkuY29udGFpbmVyVmFsdWVzICE7XG4gICAgY29uc3Qgdmlld1ZhbHVlc0lkeCA9IGNvbnRhaW5lclZhbHVlcy5pbmRleE9mKHF1ZXJ5LnZhbHVlcyk7XG4gICAgY29uc3QgcmVtb3ZlZCA9IGNvbnRhaW5lclZhbHVlcy5zcGxpY2Uodmlld1ZhbHVlc0lkeCwgMSk7XG5cbiAgICAvLyBtYXJrIGEgcXVlcnkgYXMgZGlydHkgb25seSB3aGVuIHJlbW92ZWQgdmlldyBoYWQgbWF0Y2hpbmcgbW9kZXNcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwocmVtb3ZlZC5sZW5ndGgsIDEsICdyZW1vdmVkLmxlbmd0aCcpO1xuICAgIGlmIChyZW1vdmVkWzBdLmxlbmd0aCkge1xuICAgICAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xuICAgIH1cblxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhc3NlcnRWaWV3UXVlcnloYXNQb2ludGVyVG9EZWNsYXJhdGlvbkNvbnRhaW5lcihxdWVyeTogTFF1ZXJ5PGFueT4pIHtcbiAgYXNzZXJ0RGVmaW5lZChxdWVyeS5jb250YWluZXJWYWx1ZXMsICdWaWV3IHF1ZXJpZXMgbmVlZCB0byBoYXZlIGEgcG9pbnRlciB0byBjb250YWluZXIgdmFsdWVzLicpO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgbG9jYWwgbmFtZXMgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgcmV0dXJucyBkaXJlY3RpdmUgaW5kZXhcbiAqIChvciAtMSBpZiBhIGxvY2FsIG5hbWUgcG9pbnRzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBzdGF0aWMgZGF0YSBvZiBhIG5vZGUgdG8gY2hlY2tcbiAqIEBwYXJhbSBzZWxlY3RvciBzZWxlY3RvciB0byBtYXRjaFxuICogQHJldHVybnMgZGlyZWN0aXZlIGluZGV4LCAtMSBvciBudWxsIGlmIGEgc2VsZWN0b3IgZGlkbid0IG1hdGNoIGFueSBvZiB0aGUgbG9jYWwgbmFtZXNcbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAobG9jYWxOYW1lc1tpXSA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLy8gVE9ETzogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZSAoRlctNDg2KVxuZnVuY3Rpb24gcXVlcnlCeVJlYWRUb2tlbihyZWFkOiBhbnksIHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYW55IHtcbiAgY29uc3QgZmFjdG9yeUZuID0gKHJlYWQgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgaWYgKHR5cGVvZiBmYWN0b3J5Rm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFjdG9yeUZuKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbWF0Y2hpbmdJZHggPVxuICAgICAgICBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCBjdXJyZW50VmlldywgcmVhZCBhcyBUeXBlPGFueT4sIGZhbHNlLCBmYWxzZSk7XG4gICAgaWYgKG1hdGNoaW5nSWR4ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgICAgICAgY3VycmVudFZpZXdbVFZJRVddLmRhdGEsIGN1cnJlbnRWaWV3LCBtYXRjaGluZ0lkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5QnlUTm9kZVR5cGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZihWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYoVmlld0VuZ2luZV9UZW1wbGF0ZVJlZiwgVmlld0VuZ2luZV9FbGVtZW50UmVmLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBxdWVyeUJ5VGVtcGxhdGVSZWYoXG4gICAgdGVtcGxhdGVSZWZUb2tlbjogVmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+LCB0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyxcbiAgICByZWFkOiBhbnkpOiBhbnkge1xuICBjb25zdCB0ZW1wbGF0ZVJlZlJlc3VsdCA9ICh0ZW1wbGF0ZVJlZlRva2VuIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0oKTtcbiAgaWYgKHJlYWQpIHtcbiAgICByZXR1cm4gdGVtcGxhdGVSZWZSZXN1bHQgPyBxdWVyeUJ5UmVhZFRva2VuKHJlYWQsIHROb2RlLCBjdXJyZW50VmlldykgOiBudWxsO1xuICB9XG4gIHJldHVybiB0ZW1wbGF0ZVJlZlJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcXVlcnlSZWFkKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LCByZWFkOiBhbnksIG1hdGNoaW5nSWR4OiBudW1iZXIpOiBhbnkge1xuICBpZiAocmVhZCkge1xuICAgIHJldHVybiBxdWVyeUJ5UmVhZFRva2VuKHJlYWQsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgaWYgKG1hdGNoaW5nSWR4ID4gLTEpIHtcbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgICAgIGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhLCBjdXJyZW50VmlldywgbWF0Y2hpbmdJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH1cbiAgLy8gaWYgcmVhZCB0b2tlbiBhbmQgLyBvciBzdHJhdGVneSBpcyBub3Qgc3BlY2lmaWVkLFxuICAvLyBkZXRlY3QgaXQgdXNpbmcgYXBwcm9wcmlhdGUgdE5vZGUgdHlwZVxuICByZXR1cm4gcXVlcnlCeVROb2RlVHlwZSh0Tm9kZSwgY3VycmVudFZpZXcpO1xufVxuXG5mdW5jdGlvbiBhZGQoXG4gICAgcXVlcnk6IExRdWVyeTxhbnk+fCBudWxsLCB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgY29uc3QgY3VycmVudFZpZXcgPSBnZXRMVmlldygpO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IHF1ZXJ5LnByZWRpY2F0ZTtcbiAgICBjb25zdCB0eXBlID0gcHJlZGljYXRlLnR5cGUgYXMgYW55O1xuICAgIGlmICh0eXBlKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gbnVsbDtcbiAgICAgIGlmICh0eXBlID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgICAgIHJlc3VsdCA9IHF1ZXJ5QnlUZW1wbGF0ZVJlZih0eXBlLCB0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgY3VycmVudFZpZXcsIHR5cGUsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgICAgIHJlc3VsdCA9IHF1ZXJ5UmVhZCh0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkLCBtYXRjaGluZ0lkeCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcHJlZGljYXRlLnNlbGVjdG9yICE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSk7XG4gICAgICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHF1ZXJ5UmVhZCh0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkLCBtYXRjaGluZ0lkeCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRNYXRjaChxdWVyeTogTFF1ZXJ5PGFueT4sIG1hdGNoaW5nVmFsdWU6IGFueSk6IHZvaWQge1xuICBxdWVyeS52YWx1ZXMucHVzaChtYXRjaGluZ1ZhbHVlKTtcbiAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcmVkaWNhdGU8VD4ocHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSwgcmVhZDogVHlwZTxUPnwgbnVsbCk6IFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkocHJlZGljYXRlKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBpc0FycmF5ID8gbnVsbCA6IHByZWRpY2F0ZSBhcyBUeXBlPFQ+LFxuICAgIHNlbGVjdG9yOiBpc0FycmF5ID8gcHJlZGljYXRlIGFzIHN0cmluZ1tdIDogbnVsbCxcbiAgICByZWFkOiByZWFkXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5PFQ+KFxuICAgIHByZXZpb3VzOiBMUXVlcnk8YW55PnwgbnVsbCwgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sXG4gICAgcmVhZDogVHlwZTxUPnwgbnVsbCk6IExRdWVyeTxUPiB7XG4gIHJldHVybiB7XG4gICAgbmV4dDogcHJldmlvdXMsXG4gICAgbGlzdDogcXVlcnlMaXN0LFxuICAgIHByZWRpY2F0ZTogY3JlYXRlUHJlZGljYXRlKHByZWRpY2F0ZSwgcmVhZCksXG4gICAgdmFsdWVzOiAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPFQ+KS5fdmFsdWVzVHJlZSxcbiAgICBjb250YWluZXJWYWx1ZXM6IG51bGxcbiAgfTtcbn1cblxudHlwZSBRdWVyeUxpc3RfPFQ+ID0gUXVlcnlMaXN0PFQ+JiB7X3ZhbHVlc1RyZWU6IGFueVtdfTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5PFQ+KFxuICAgIC8vIFRPRE86IFwicmVhZFwiIHNob3VsZCBiZSBhbiBBYnN0cmFjdFR5cGUgKEZXLTQ4NilcbiAgICBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLCByZWFkPzogYW55KTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoZ2V0SXNQYXJlbnQoKSk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBjb25zdCBxdWVyaWVzID0gbFZpZXdbUVVFUklFU10gfHwgKGxWaWV3W1FVRVJJRVNdID0gbmV3IExRdWVyaWVzXyhudWxsLCBudWxsLCBudWxsKSk7XG4gIChxdWVyeUxpc3QgYXMgUXVlcnlMaXN0XzxUPikuX3ZhbHVlc1RyZWUgPSBbXTtcbiAgcXVlcmllcy50cmFjayhxdWVyeUxpc3QsIHByZWRpY2F0ZSwgZGVzY2VuZCwgcmVhZCk7XG4gIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KGxWaWV3LCBxdWVyeUxpc3QsIHF1ZXJ5TGlzdC5kZXN0cm95KTtcbiAgcmV0dXJuIHF1ZXJ5TGlzdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0SW1wbCA9IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88YW55Pik7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkpIHtcbiAgICBxdWVyeUxpc3QucmVzZXQocXVlcnlMaXN0SW1wbC5fdmFsdWVzVHJlZSB8fCBbXSk7XG4gICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QsIHN0b3JlcyB0aGUgcmVmZXJlbmNlIGluIExWaWV3IGFuZCByZXR1cm5zIFF1ZXJ5TGlzdC5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3UXVlcnk8VD4oXG4gICAgLy8gVE9ETzogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZSAoRlctNDg2KVxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCsrO1xuICB9XG4gIGNvbnN0IGluZGV4ID0gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTtcbiAgY29uc3Qgdmlld1F1ZXJ5OiBRdWVyeUxpc3Q8VD4gPSBxdWVyeTxUPihwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQpO1xuICBzdG9yZShpbmRleCAtIEhFQURFUl9PRkZTRVQsIHZpZXdRdWVyeSk7XG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KGluZGV4ICsgMSk7XG4gIHJldHVybiB2aWV3UXVlcnk7XG59XG5cbi8qKlxuKiBMb2FkcyBjdXJyZW50IFZpZXcgUXVlcnkgYW5kIG1vdmVzIHRoZSBwb2ludGVyL2luZGV4IHRvIHRoZSBuZXh0IFZpZXcgUXVlcnkgaW4gTFZpZXcuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRWaWV3UXVlcnk8VD4oKTogVCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoaW5kZXggKyAxKTtcbiAgcmV0dXJuIGxvYWQ8VD4oaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoIChwYXJ0IG9mIGEgdmlld1xuICogcmVmcmVzaCkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEN1cnJlbnQgZGlyZWN0aXZlIGluZGV4XG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50UXVlcnk8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJlZGljYXRlOiBUeXBlPGFueT58IHN0cmluZ1tdLCBkZXNjZW5kPzogYm9vbGVhbixcbiAgICAvLyBUT0RPOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlIChGVy00ODYpXG4gICAgcmVhZD86IGFueSk6IFF1ZXJ5TGlzdDxUPiB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGNvbnRlbnRRdWVyeTogUXVlcnlMaXN0PFQ+ID0gcXVlcnk8VD4ocHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgKGxWaWV3W0NPTlRFTlRfUVVFUklFU10gfHwgKGxWaWV3W0NPTlRFTlRfUVVFUklFU10gPSBbXSkpLnB1c2goY29udGVudFF1ZXJ5KTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgICBjb25zdCBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCA9XG4gICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCA/IHRWaWV3LmNvbnRlbnRRdWVyaWVzW3RWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCAtIDFdIDogLTE7XG4gICAgaWYgKGRpcmVjdGl2ZUluZGV4ICE9PSBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCkge1xuICAgICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRlbnRRdWVyeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRDb250ZW50UXVlcnk8VD4oKTogUXVlcnlMaXN0PFQ+IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgbFZpZXdbQ09OVEVOVF9RVUVSSUVTXSwgJ0NvbnRlbnQgUXVlcnlMaXN0IGFycmF5IHNob3VsZCBiZSBkZWZpbmVkIGlmIHJlYWRpbmcgYSBxdWVyeS4nKTtcblxuICBjb25zdCBpbmRleCA9IGdldEN1cnJlbnRRdWVyeUluZGV4KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlld1tDT05URU5UX1FVRVJJRVNdICEsIGluZGV4KTtcblxuICBzZXRDdXJyZW50UXVlcnlJbmRleChpbmRleCArIDEpO1xuICByZXR1cm4gbFZpZXdbQ09OVEVOVF9RVUVSSUVTXSAhW2luZGV4XTtcbn0iXX0=