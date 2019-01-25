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
import { assertDefined, assertEqual } from '../util/assert';
import { assertPreviousIsParent } from './assert';
import { getNodeInjectable, locateDirectiveOrProvider } from './di';
import { NG_ELEMENT_ID } from './fields';
import { load, store, storeCleanupWithContext } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { HEADER_OFFSET, TVIEW } from './interfaces/view';
import { getCurrentViewQueryIndex, getIsParent, getLView, getOrCreateCurrentQueries, setCurrentViewQueryIndex } from './state';
import { isContentQueryHost } from './util';
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
        if (isContentQueryHost(tNode)) {
            add(this.shallow, tNode);
            if (tNode.parent && isContentQueryHost(tNode.parent)) {
                // if node has a content query and parent also has a content query
                // both queries need to check this node for shallow matches
                add((/** @type {?} */ (this.parent)).shallow, tNode);
            }
            return this.parent;
        }
        isRootNodeOfQuery(tNode) && add(this.shallow, tNode);
        return this;
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
 * @param {?} tNode
 * @return {?}
 */
function isRootNodeOfQuery(tNode) {
    return tNode.parent === null || isContentQueryHost(tNode.parent);
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
        ngDevMode &&
            assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
        (/** @type {?} */ (query.containerValues)).splice(index, 0, query.values);
        query = query.next;
    }
}
/**
 * @param {?} query
 * @return {?}
 */
function removeView(query) {
    while (query) {
        ngDevMode &&
            assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
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
    const queryList = new QueryList();
    /** @type {?} */
    const queries = getOrCreateCurrentQueries(LQueries_);
    ((/** @type {?} */ (queryList)))._valuesTree = [];
    queries.track(queryList, predicate, descend, read);
    storeCleanupWithContext(getLView(), queryList, queryList.destroy);
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
    const index = getCurrentViewQueryIndex();
    /** @type {?} */
    const viewQuery = query(predicate, descend, read);
    store(index - HEADER_OFFSET, viewQuery);
    setCurrentViewQueryIndex(index + 1);
    return viewQuery;
}
/**
 * Loads current View Query and moves the pointer/index to the next View Query in LView.
 * @template T
 * @return {?}
 */
export function loadViewQuery() {
    /** @type {?} */
    const index = getCurrentViewQueryIndex();
    setCurrentViewQueryIndex(index + 1);
    return load(index - HEADER_OFFSET);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFZQSxPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTFELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3BFLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0UsT0FBTyxFQUF3RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSixPQUFPLEVBQVcsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEYsT0FBTyxFQUFDLGFBQWEsRUFBUyxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSx5QkFBeUIsRUFBRSx3QkFB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LENBQUM7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsU0FBUztBQUNyQixrREFBa0Q7QUFDbEQsU0FBOEIsRUFBRSxPQUFpQixFQUFFLElBQVU7O1VBQ3pELEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0lBQzFCLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBQzNCLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0tBQzNCOztVQUNLLEtBQUssR0FBRyx3QkFBd0IsRUFBRTs7VUFDbEMsU0FBUyxHQUFpQixLQUFLLENBQUksU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUM7SUFDbEUsS0FBSyxDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsd0JBQXdCLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7Ozs7OztBQUtELE1BQU0sVUFBVSxhQUFhOztVQUNyQixLQUFLLEdBQUcsd0JBQXdCLEVBQUU7SUFDeEMsd0JBQXdCLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sSUFBSSxDQUFJLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztBQUN4QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRQcmV2aW91c0lzUGFyZW50fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldE5vZGVJbmplY3RhYmxlLCBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtsb2FkLCBzdG9yZSwgc3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3LCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50Vmlld1F1ZXJ5SW5kZXgsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcywgc2V0Q3VycmVudFZpZXdRdWVyeUluZGV4fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDb250ZW50UXVlcnlIb3N0fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjcmVhdGVFbGVtZW50UmVmLCBjcmVhdGVUZW1wbGF0ZVJlZn0gZnJvbSAnLi92aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5JztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG4vKipcbiAqIEEgcHJlZGljYXRlIHdoaWNoIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiByZXN1bHRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgLyoqXG4gICAqIElmIGxvb2tpbmcgZm9yIGRpcmVjdGl2ZXMgdGhlbiBpdCBjb250YWlucyB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gICAqL1xuICB0eXBlOiBUeXBlPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHNlbGVjdG9yIHRoZW4gY29udGFpbnMgbG9jYWwgbmFtZXMgdG8gcXVlcnkgZm9yLlxuICAgKi9cbiAgc2VsZWN0b3I6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGljaCB0b2tlbiBzaG91bGQgYmUgcmVhZCBmcm9tIERJIGZvciB0aGlzIHF1ZXJ5LlxuICAgKi9cbiAgcmVhZDogVHlwZTxUPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCByZXByZXNlbnRpbmcgYSBxdWVyeSwgd2hpY2ggaXMgYSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gcXVlcnkgcHJlZGljYXRlIHRvIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiAtIHZhbHVlcyBjb2xsZWN0ZWQgYmFzZWQgb24gYSBwcmVkaWNhdGVcbiAqIC0gYFF1ZXJ5TGlzdGAgdG8gd2hpY2ggY29sbGVjdGVkIHZhbHVlcyBzaG91bGQgYmUgcmVwb3J0ZWRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMUXVlcnk8VD4ge1xuICAvKipcbiAgICogTmV4dCBxdWVyeS4gVXNlZCB3aGVuIHF1ZXJpZXMgYXJlIHN0b3JlZCBhcyBhIGxpbmtlZCBsaXN0IGluIGBMUXVlcmllc2AuXG4gICAqL1xuICBuZXh0OiBMUXVlcnk8YW55PnxudWxsO1xuXG4gIC8qKlxuICAgKiBEZXN0aW5hdGlvbiB0byB3aGljaCB0aGUgdmFsdWUgc2hvdWxkIGJlIGFkZGVkLlxuICAgKi9cbiAgbGlzdDogUXVlcnlMaXN0PFQ+O1xuXG4gIC8qKlxuICAgKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICAgKiByZXN1bHRzLlxuICAgKi9cbiAgcHJlZGljYXRlOiBRdWVyeVByZWRpY2F0ZTxUPjtcblxuICAvKipcbiAgICogVmFsdWVzIHdoaWNoIGhhdmUgYmVlbiBsb2NhdGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHdoYXQgYnVpbGRzIHVwIHRoZSBgUXVlcnlMaXN0Ll92YWx1ZXNUcmVlYC5cbiAgICovXG4gIHZhbHVlczogYW55W107XG5cbiAgLyoqXG4gICAqIEEgcG9pbnRlciB0byBhbiBhcnJheSB0aGF0IHN0b3JlcyBjb2xsZWN0ZWQgdmFsdWVzIGZyb20gdmlld3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHdlIGtub3cgYVxuICAgKiBjb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgbm9kZXMgY29sbGVjdGVkIGZyb20gdmlld3MuXG4gICAqL1xuICBjb250YWluZXJWYWx1ZXM6IGFueVtdfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHBhcmVudDogTFF1ZXJpZXNffG51bGwsIHByaXZhdGUgc2hhbGxvdzogTFF1ZXJ5PGFueT58bnVsbCxcbiAgICAgIHByaXZhdGUgZGVlcDogTFF1ZXJ5PGFueT58bnVsbCkge31cblxuICB0cmFjazxUPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fHN0cmluZ1tdLCBkZXNjZW5kPzogYm9vbGVhbiwgcmVhZD86IFR5cGU8VD4pOlxuICAgICAgdm9pZCB7XG4gICAgaWYgKGRlc2NlbmQpIHtcbiAgICAgIHRoaXMuZGVlcCA9IGNyZWF0ZVF1ZXJ5KHRoaXMuZGVlcCwgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFsbG93ID0gY3JlYXRlUXVlcnkodGhpcy5zaGFsbG93LCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKCk6IExRdWVyaWVzIHsgcmV0dXJuIG5ldyBMUXVlcmllc18odGhpcywgbnVsbCwgdGhpcy5kZWVwKTsgfVxuXG4gIGNvbnRhaW5lcigpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCBzaGFsbG93UmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9Db250YWluZXIodGhpcy5zaGFsbG93KTtcbiAgICBjb25zdCBkZWVwUmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9Db250YWluZXIodGhpcy5kZWVwKTtcblxuICAgIHJldHVybiBzaGFsbG93UmVzdWx0cyB8fCBkZWVwUmVzdWx0cyA/IG5ldyBMUXVlcmllc18odGhpcywgc2hhbGxvd1Jlc3VsdHMsIGRlZXBSZXN1bHRzKSA6IG51bGw7XG4gIH1cblxuICBjcmVhdGVWaWV3KCk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHNoYWxsb3dSZXN1bHRzID0gY29weVF1ZXJpZXNUb1ZpZXcodGhpcy5zaGFsbG93KTtcbiAgICBjb25zdCBkZWVwUmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9WaWV3KHRoaXMuZGVlcCk7XG5cbiAgICByZXR1cm4gc2hhbGxvd1Jlc3VsdHMgfHwgZGVlcFJlc3VsdHMgPyBuZXcgTFF1ZXJpZXNfKHRoaXMsIHNoYWxsb3dSZXN1bHRzLCBkZWVwUmVzdWx0cykgOiBudWxsO1xuICB9XG5cbiAgaW5zZXJ0VmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgaW5zZXJ0VmlldyhpbmRleCwgdGhpcy5zaGFsbG93KTtcbiAgICBpbnNlcnRWaWV3KGluZGV4LCB0aGlzLmRlZXApO1xuICB9XG5cbiAgYWRkTm9kZSh0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6IExRdWVyaWVzfG51bGwge1xuICAgIGFkZCh0aGlzLmRlZXAsIHROb2RlKTtcblxuICAgIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUpKSB7XG4gICAgICBhZGQodGhpcy5zaGFsbG93LCB0Tm9kZSk7XG5cbiAgICAgIGlmICh0Tm9kZS5wYXJlbnQgJiYgaXNDb250ZW50UXVlcnlIb3N0KHROb2RlLnBhcmVudCkpIHtcbiAgICAgICAgLy8gaWYgbm9kZSBoYXMgYSBjb250ZW50IHF1ZXJ5IGFuZCBwYXJlbnQgYWxzbyBoYXMgYSBjb250ZW50IHF1ZXJ5XG4gICAgICAgIC8vIGJvdGggcXVlcmllcyBuZWVkIHRvIGNoZWNrIHRoaXMgbm9kZSBmb3Igc2hhbGxvdyBtYXRjaGVzXG4gICAgICAgIGFkZCh0aGlzLnBhcmVudCAhLnNoYWxsb3csIHROb2RlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnBhcmVudDtcbiAgICB9XG5cbiAgICBpc1Jvb3ROb2RlT2ZRdWVyeSh0Tm9kZSkgJiYgYWRkKHRoaXMuc2hhbGxvdywgdE5vZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlVmlldygpOiB2b2lkIHtcbiAgICByZW1vdmVWaWV3KHRoaXMuc2hhbGxvdyk7XG4gICAgcmVtb3ZlVmlldyh0aGlzLmRlZXApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzUm9vdE5vZGVPZlF1ZXJ5KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gdE5vZGUucGFyZW50ID09PSBudWxsIHx8IGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZS5wYXJlbnQpO1xufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCk6IExRdWVyeTxhbnk+fG51bGwge1xuICBsZXQgcmVzdWx0OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcblxuICB3aGlsZSAocXVlcnkpIHtcbiAgICBjb25zdCBjb250YWluZXJWYWx1ZXM6IGFueVtdID0gW107ICAvLyBwcmVwYXJlIHJvb20gZm9yIHZpZXdzXG4gICAgcXVlcnkudmFsdWVzLnB1c2goY29udGFpbmVyVmFsdWVzKTtcbiAgICBjb25zdCBjbG9uZWRRdWVyeTogTFF1ZXJ5PGFueT4gPSB7XG4gICAgICBuZXh0OiByZXN1bHQsXG4gICAgICBsaXN0OiBxdWVyeS5saXN0LFxuICAgICAgcHJlZGljYXRlOiBxdWVyeS5wcmVkaWNhdGUsXG4gICAgICB2YWx1ZXM6IGNvbnRhaW5lclZhbHVlcyxcbiAgICAgIGNvbnRhaW5lclZhbHVlczogbnVsbFxuICAgIH07XG4gICAgcmVzdWx0ID0gY2xvbmVkUXVlcnk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY29weVF1ZXJpZXNUb1ZpZXcocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgIG5leHQ6IHJlc3VsdCxcbiAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgIHZhbHVlczogW10sXG4gICAgICBjb250YWluZXJWYWx1ZXM6IHF1ZXJ5LnZhbHVlc1xuICAgIH07XG4gICAgcmVzdWx0ID0gY2xvbmVkUXVlcnk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0VmlldyhpbmRleDogbnVtYmVyLCBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpIHtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMsICdWaWV3IHF1ZXJpZXMgbmVlZCB0byBoYXZlIGEgcG9pbnRlciB0byBjb250YWluZXIgdmFsdWVzLicpO1xuICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhLnNwbGljZShpbmRleCwgMCwgcXVlcnkudmFsdWVzKTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpIHtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMsICdWaWV3IHF1ZXJpZXMgbmVlZCB0byBoYXZlIGEgcG9pbnRlciB0byBjb250YWluZXIgdmFsdWVzLicpO1xuXG4gICAgY29uc3QgY29udGFpbmVyVmFsdWVzID0gcXVlcnkuY29udGFpbmVyVmFsdWVzICE7XG4gICAgY29uc3Qgdmlld1ZhbHVlc0lkeCA9IGNvbnRhaW5lclZhbHVlcy5pbmRleE9mKHF1ZXJ5LnZhbHVlcyk7XG4gICAgY29uc3QgcmVtb3ZlZCA9IGNvbnRhaW5lclZhbHVlcy5zcGxpY2Uodmlld1ZhbHVlc0lkeCwgMSk7XG5cbiAgICAvLyBtYXJrIGEgcXVlcnkgYXMgZGlydHkgb25seSB3aGVuIHJlbW92ZWQgdmlldyBoYWQgbWF0Y2hpbmcgbW9kZXNcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwocmVtb3ZlZC5sZW5ndGgsIDEsICdyZW1vdmVkLmxlbmd0aCcpO1xuICAgIGlmIChyZW1vdmVkWzBdLmxlbmd0aCkge1xuICAgICAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xuICAgIH1cblxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBsb2NhbCBuYW1lcyBmb3IgYSBnaXZlbiBub2RlIGFuZCByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleFxuICogKG9yIC0xIGlmIGEgbG9jYWwgbmFtZSBwb2ludHMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIHROb2RlIHN0YXRpYyBkYXRhIG9mIGEgbm9kZSB0byBjaGVja1xuICogQHBhcmFtIHNlbGVjdG9yIHNlbGVjdG9yIHRvIG1hdGNoXG4gKiBAcmV0dXJucyBkaXJlY3RpdmUgaW5kZXgsIC0xIG9yIG51bGwgaWYgYSBzZWxlY3RvciBkaWRuJ3QgbWF0Y2ggYW55IG9mIHRoZSBsb2NhbCBuYW1lc1xuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3Rvcjogc3RyaW5nKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGlmIChsb2NhbE5hbWVzW2ldID09PSBzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG4vLyBUT0RPOiBcInJlYWRcIiBzaG91bGQgYmUgYW4gQWJzdHJhY3RUeXBlIChGVy00ODYpXG5mdW5jdGlvbiBxdWVyeUJ5UmVhZFRva2VuKHJlYWQ6IGFueSwgdE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBhbnkge1xuICBjb25zdCBmYWN0b3J5Rm4gPSAocmVhZCBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICBpZiAodHlwZW9mIGZhY3RvcnlGbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWN0b3J5Rm4oKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBtYXRjaGluZ0lkeCA9XG4gICAgICAgIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIGN1cnJlbnRWaWV3LCByZWFkIGFzIFR5cGU8YW55PiwgZmFsc2UsIGZhbHNlKTtcbiAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZShcbiAgICAgICAgICBjdXJyZW50Vmlld1tUVklFV10uZGF0YSwgY3VycmVudFZpZXcsIG1hdGNoaW5nSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcXVlcnlCeVROb2RlVHlwZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGFueSB7XG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKFZpZXdFbmdpbmVfRWxlbWVudFJlZiwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIHJldHVybiBjcmVhdGVUZW1wbGF0ZVJlZihWaWV3RW5naW5lX1RlbXBsYXRlUmVmLCBWaWV3RW5naW5lX0VsZW1lbnRSZWYsIHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5QnlUZW1wbGF0ZVJlZihcbiAgICB0ZW1wbGF0ZVJlZlRva2VuOiBWaWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT4sIHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LFxuICAgIHJlYWQ6IGFueSk6IGFueSB7XG4gIGNvbnN0IHRlbXBsYXRlUmVmUmVzdWx0ID0gKHRlbXBsYXRlUmVmVG9rZW4gYXMgYW55KVtOR19FTEVNRU5UX0lEXSgpO1xuICBpZiAocmVhZCkge1xuICAgIHJldHVybiB0ZW1wbGF0ZVJlZlJlc3VsdCA/IHF1ZXJ5QnlSZWFkVG9rZW4ocmVhZCwgdE5vZGUsIGN1cnJlbnRWaWV3KSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIHRlbXBsYXRlUmVmUmVzdWx0O1xufVxuXG5mdW5jdGlvbiBxdWVyeVJlYWQodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcsIHJlYWQ6IGFueSwgbWF0Y2hpbmdJZHg6IG51bWJlcik6IGFueSB7XG4gIGlmIChyZWFkKSB7XG4gICAgcmV0dXJuIHF1ZXJ5QnlSZWFkVG9rZW4ocmVhZCwgdE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICBpZiAobWF0Y2hpbmdJZHggPiAtMSkge1xuICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZShcbiAgICAgICAgY3VycmVudFZpZXdbVFZJRVddLmRhdGEsIGN1cnJlbnRWaWV3LCBtYXRjaGluZ0lkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgfVxuICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsXG4gIC8vIGRldGVjdCBpdCB1c2luZyBhcHByb3ByaWF0ZSB0Tm9kZSB0eXBlXG4gIHJldHVybiBxdWVyeUJ5VE5vZGVUeXBlKHROb2RlLCBjdXJyZW50Vmlldyk7XG59XG5cbmZ1bmN0aW9uIGFkZChcbiAgICBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwsIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSkge1xuICBjb25zdCBjdXJyZW50VmlldyA9IGdldExWaWV3KCk7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gcXVlcnkucHJlZGljYXRlO1xuICAgIGNvbnN0IHR5cGUgPSBwcmVkaWNhdGUudHlwZSBhcyBhbnk7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGxldCByZXN1bHQgPSBudWxsO1xuICAgICAgaWYgKHR5cGUgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICAgICAgcmVzdWx0ID0gcXVlcnlCeVRlbXBsYXRlUmVmKHR5cGUsIHROb2RlLCBjdXJyZW50VmlldywgcHJlZGljYXRlLnJlYWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbWF0Y2hpbmdJZHggPSBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCBjdXJyZW50VmlldywgdHlwZSwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgaWYgKG1hdGNoaW5nSWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmVzdWx0ID0gcXVlcnlSZWFkKHROb2RlLCBjdXJyZW50VmlldywgcHJlZGljYXRlLnJlYWQsIG1hdGNoaW5nSWR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICBhZGRNYXRjaChxdWVyeSwgcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc2VsZWN0b3IgPSBwcmVkaWNhdGUuc2VsZWN0b3IgITtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbWF0Y2hpbmdJZHggPSBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIHNlbGVjdG9yW2ldKTtcbiAgICAgICAgaWYgKG1hdGNoaW5nSWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gcXVlcnlSZWFkKHROb2RlLCBjdXJyZW50VmlldywgcHJlZGljYXRlLnJlYWQsIG1hdGNoaW5nSWR4KTtcbiAgICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBhZGRNYXRjaChxdWVyeSwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZE1hdGNoKHF1ZXJ5OiBMUXVlcnk8YW55PiwgbWF0Y2hpbmdWYWx1ZTogYW55KTogdm9pZCB7XG4gIHF1ZXJ5LnZhbHVlcy5wdXNoKG1hdGNoaW5nVmFsdWUpO1xuICBxdWVyeS5saXN0LnNldERpcnR5KCk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByZWRpY2F0ZTxUPihwcmVkaWNhdGU6IFR5cGU8VD58IHN0cmluZ1tdLCByZWFkOiBUeXBlPFQ+fCBudWxsKTogUXVlcnlQcmVkaWNhdGU8VD4ge1xuICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShwcmVkaWNhdGUpO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IGlzQXJyYXkgPyBudWxsIDogcHJlZGljYXRlIGFzIFR5cGU8VD4sXG4gICAgc2VsZWN0b3I6IGlzQXJyYXkgPyBwcmVkaWNhdGUgYXMgc3RyaW5nW10gOiBudWxsLFxuICAgIHJlYWQ6IHJlYWRcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUXVlcnk8VD4oXG4gICAgcHJldmlvdXM6IExRdWVyeTxhbnk+fCBudWxsLCBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSxcbiAgICByZWFkOiBUeXBlPFQ+fCBudWxsKTogTFF1ZXJ5PFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBuZXh0OiBwcmV2aW91cyxcbiAgICBsaXN0OiBxdWVyeUxpc3QsXG4gICAgcHJlZGljYXRlOiBjcmVhdGVQcmVkaWNhdGUocHJlZGljYXRlLCByZWFkKSxcbiAgICB2YWx1ZXM6IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88VD4pLl92YWx1ZXNUcmVlLFxuICAgIGNvbnRhaW5lclZhbHVlczogbnVsbFxuICB9O1xufVxuXG50eXBlIFF1ZXJ5TGlzdF88VD4gPSBRdWVyeUxpc3Q8VD4mIHtfdmFsdWVzVHJlZTogYW55W119O1xuXG4vKipcbiAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBRdWVyeUxpc3QuXG4gKlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnk8VD4oXG4gICAgLy8gVE9ETzogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZSAoRlctNDg2KVxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudChnZXRJc1BhcmVudCgpKTtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBjb25zdCBxdWVyaWVzID0gZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcyhMUXVlcmllc18pO1xuICAocXVlcnlMaXN0IGFzIFF1ZXJ5TGlzdF88VD4pLl92YWx1ZXNUcmVlID0gW107XG4gIHF1ZXJpZXMudHJhY2socXVlcnlMaXN0LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQpO1xuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChnZXRMVmlldygpLCBxdWVyeUxpc3QsIHF1ZXJ5TGlzdC5kZXN0cm95KTtcbiAgcmV0dXJuIHF1ZXJ5TGlzdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0SW1wbCA9IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88YW55Pik7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkpIHtcbiAgICBxdWVyeUxpc3QucmVzZXQocXVlcnlMaXN0SW1wbC5fdmFsdWVzVHJlZSB8fCBbXSk7XG4gICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIG5ldyBRdWVyeUxpc3QsIHN0b3JlcyB0aGUgcmVmZXJlbmNlIGluIExWaWV3IGFuZCByZXR1cm5zIFF1ZXJ5TGlzdC5cbiAqXG4gKiBAcGFyYW0gcHJlZGljYXRlIFRoZSB0eXBlIGZvciB3aGljaCB0aGUgcXVlcnkgd2lsbCBzZWFyY2hcbiAqIEBwYXJhbSBkZXNjZW5kIFdoZXRoZXIgb3Igbm90IHRvIGRlc2NlbmQgaW50byBjaGlsZHJlblxuICogQHBhcmFtIHJlYWQgV2hhdCB0byBzYXZlIGluIHRoZSBxdWVyeVxuICogQHJldHVybnMgUXVlcnlMaXN0PFQ+XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3UXVlcnk8VD4oXG4gICAgLy8gVE9ETzogXCJyZWFkXCIgc2hvdWxkIGJlIGFuIEFic3RyYWN0VHlwZSAoRlctNDg2KVxuICAgIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sIHJlYWQ/OiBhbnkpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCsrO1xuICB9XG4gIGNvbnN0IGluZGV4ID0gZ2V0Q3VycmVudFZpZXdRdWVyeUluZGV4KCk7XG4gIGNvbnN0IHZpZXdRdWVyeTogUXVlcnlMaXN0PFQ+ID0gcXVlcnk8VD4ocHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgc3RvcmUoaW5kZXggLSBIRUFERVJfT0ZGU0VULCB2aWV3UXVlcnkpO1xuICBzZXRDdXJyZW50Vmlld1F1ZXJ5SW5kZXgoaW5kZXggKyAxKTtcbiAgcmV0dXJuIHZpZXdRdWVyeTtcbn1cblxuLyoqXG4qIExvYWRzIGN1cnJlbnQgVmlldyBRdWVyeSBhbmQgbW92ZXMgdGhlIHBvaW50ZXIvaW5kZXggdG8gdGhlIG5leHQgVmlldyBRdWVyeSBpbiBMVmlldy5cbiovXG5leHBvcnQgZnVuY3Rpb24gbG9hZFZpZXdRdWVyeTxUPigpOiBUIHtcbiAgY29uc3QgaW5kZXggPSBnZXRDdXJyZW50Vmlld1F1ZXJ5SW5kZXgoKTtcbiAgc2V0Q3VycmVudFZpZXdRdWVyeUluZGV4KGluZGV4ICsgMSk7XG4gIHJldHVybiBsb2FkPFQ+KGluZGV4IC0gSEVBREVSX09GRlNFVCk7XG59XG4iXX0=