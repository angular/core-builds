/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter } from '../event_emitter';
import { getSymbolIterator } from '../util';
import { assertDefined, assertEqual } from './assert';
import { ReadFromInjectorFn } from './di';
import { _getViewData, assertPreviousIsParent, getOrCreateCurrentQueries, store, storeCleanupWithContext } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { DIRECTIVES, TVIEW } from './interfaces/view';
import { flatten, isContentQueryHost } from './util';
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
export class LQueries_ {
    constructor(parent, shallow, deep) {
        this.parent = parent;
        this.shallow = shallow;
        this.deep = deep;
    }
    track(queryList, predicate, descend, read) {
        if (descend) {
            this.deep = createQuery(this.deep, queryList, predicate, read != null ? read : null);
        }
        else {
            this.shallow = createQuery(this.shallow, queryList, predicate, read != null ? read : null);
        }
    }
    clone() { return new LQueries_(this, null, this.deep); }
    container() {
        const shallowResults = copyQueriesToContainer(this.shallow);
        const deepResults = copyQueriesToContainer(this.deep);
        return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
    }
    createView() {
        const shallowResults = copyQueriesToView(this.shallow);
        const deepResults = copyQueriesToView(this.deep);
        return shallowResults || deepResults ? new LQueries_(this, shallowResults, deepResults) : null;
    }
    insertView(index) {
        insertView(index, this.shallow);
        insertView(index, this.deep);
    }
    addNode(tNode) {
        add(this.deep, tNode);
        if (isContentQueryHost(tNode)) {
            add(this.shallow, tNode);
            if (tNode.parent && isContentQueryHost(tNode.parent)) {
                // if node has a content query and parent also has a content query
                // both queries need to check this node for shallow matches
                add(this.parent.shallow, tNode);
            }
            return this.parent;
        }
        isRootNodeOfQuery(tNode) && add(this.shallow, tNode);
        return this;
    }
    removeView() {
        removeView(this.shallow);
        removeView(this.deep);
    }
}
function isRootNodeOfQuery(tNode) {
    return tNode.parent === null || isContentQueryHost(tNode.parent);
}
function copyQueriesToContainer(query) {
    let result = null;
    while (query) {
        const containerValues = []; // prepare room for views
        query.values.push(containerValues);
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
function copyQueriesToView(query) {
    let result = null;
    while (query) {
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
function insertView(index, query) {
    while (query) {
        ngDevMode &&
            assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
        query.containerValues.splice(index, 0, query.values);
        query = query.next;
    }
}
function removeView(query) {
    while (query) {
        ngDevMode &&
            assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
        const containerValues = query.containerValues;
        const viewValuesIdx = containerValues.indexOf(query.values);
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
 * @param tNode static data of a node to check
 * @param selector selector to match
 * @returns directive index, -1 or null if a selector didn't match any of the local names
 */
function getIdxOfMatchingSelector(tNode, selector) {
    const localNames = tNode.localNames;
    if (localNames) {
        for (let i = 0; i < localNames.length; i += 2) {
            if (localNames[i] === selector) {
                return localNames[i + 1];
            }
        }
    }
    return null;
}
/**
 * Iterates over all the directives for a node and returns index of a directive for a given type.
 *
 * @param tNode TNode on which directives are present.
 * @param currentView The view we are currently processing
 * @param type Type of a directive to look for.
 * @returns Index of a found directive or null when none found.
 */
function getIdxOfMatchingDirective(tNode, currentView, type) {
    const defs = currentView[TVIEW].directives;
    if (defs) {
        const flags = tNode.flags;
        const count = flags & 4095 /* DirectiveCountMask */;
        const start = flags >> 15 /* DirectiveStartingIndexShift */;
        const end = start + count;
        for (let i = start; i < end; i++) {
            const def = defs[i];
            if (def.type === type && def.diPublic) {
                return i;
            }
        }
    }
    return null;
}
function readFromNodeInjector(tNode, currentView, read, directiveIdx) {
    if (read instanceof ReadFromInjectorFn) {
        return read.read(tNode, currentView, directiveIdx);
    }
    else {
        const matchingIdx = getIdxOfMatchingDirective(tNode, currentView, read);
        if (matchingIdx !== null) {
            return currentView[DIRECTIVES][matchingIdx];
        }
    }
    return null;
}
function add(query, tNode) {
    const currentView = _getViewData();
    while (query) {
        const predicate = query.predicate;
        const type = predicate.type;
        if (type) {
            const directiveIdx = getIdxOfMatchingDirective(tNode, currentView, type);
            if (directiveIdx !== null) {
                // a node is matching a predicate - determine what to read
                // if read token and / or strategy is not specified, use type as read token
                const result = readFromNodeInjector(tNode, currentView, predicate.read || type, directiveIdx);
                if (result !== null) {
                    addMatch(query, result);
                }
            }
        }
        else {
            const selector = predicate.selector;
            for (let i = 0; i < selector.length; i++) {
                const directiveIdx = getIdxOfMatchingSelector(tNode, selector[i]);
                if (directiveIdx !== null) {
                    // a node is matching a predicate - determine what to read
                    // note that queries using name selector must specify read strategy
                    ngDevMode && assertDefined(predicate.read, 'the node should have a predicate');
                    const result = readFromNodeInjector(tNode, currentView, predicate.read, directiveIdx);
                    if (result !== null) {
                        addMatch(query, result);
                    }
                }
            }
        }
        query = query.next;
    }
}
function addMatch(query, matchingValue) {
    query.values.push(matchingValue);
    query.list.setDirty();
}
function createPredicate(predicate, read) {
    const isArray = Array.isArray(predicate);
    return {
        type: isArray ? null : predicate,
        selector: isArray ? predicate : null,
        read: read
    };
}
function createQuery(previous, queryList, predicate, read) {
    return {
        next: previous,
        list: queryList,
        predicate: createPredicate(predicate, read),
        values: queryList._valuesTree,
        containerValues: null
    };
}
class QueryList_ {
    constructor() {
        this.dirty = true;
        this.changes = new EventEmitter();
        this._values = [];
        /** @internal */
        this._valuesTree = [];
    }
    get length() { return this._values.length; }
    get first() {
        let values = this._values;
        return values.length ? values[0] : null;
    }
    get last() {
        let values = this._values;
        return values.length ? values[values.length - 1] : null;
    }
    /**
     * See
     * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
     */
    map(fn) { return this._values.map(fn); }
    /**
     * See
     * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
     */
    filter(fn) {
        return this._values.filter(fn);
    }
    /**
     * See
     * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
     */
    find(fn) {
        return this._values.find(fn);
    }
    /**
     * See
     * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
     */
    reduce(fn, init) {
        return this._values.reduce(fn, init);
    }
    /**
     * See
     * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
     */
    forEach(fn) { this._values.forEach(fn); }
    /**
     * See
     * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
     */
    some(fn) {
        return this._values.some(fn);
    }
    toArray() { return this._values.slice(0); }
    [getSymbolIterator()]() { return this._values[getSymbolIterator()](); }
    toString() { return this._values.toString(); }
    reset(res) {
        this._values = flatten(res);
        this.dirty = false;
    }
    notifyOnChanges() { this.changes.emit(this); }
    setDirty() { this.dirty = true; }
    destroy() {
        this.changes.complete();
        this.changes.unsubscribe();
    }
}
export const QueryList = QueryList_;
/**
 * Creates and returns a QueryList.
 *
 * @param memoryIndex The index in memory where the QueryList should be saved. If null,
 * this is is a content query and the QueryList will be saved later through directiveCreate.
 * @param predicate The type for which the query will search
 * @param descend Whether or not to descend into children
 * @param read What to save in the query
 * @returns QueryList<T>
 */
export function query(memoryIndex, predicate, descend, read) {
    ngDevMode && assertPreviousIsParent();
    const queryList = new QueryList();
    const queries = getOrCreateCurrentQueries(LQueries_);
    queries.track(queryList, predicate, descend, read);
    storeCleanupWithContext(null, queryList, queryList.destroy);
    if (memoryIndex != null) {
        store(memoryIndex, queryList);
    }
    return queryList;
}
/**
 * Refreshes a query by combining matches from all active views and removing matches from deleted
 * views.
 * Returns true if a query got dirty during change detection, false otherwise.
 */
export function queryRefresh(queryList) {
    const queryListImpl = queryList;
    if (queryList.dirty) {
        queryList.reset(queryListImpl._valuesTree);
        queryList.notifyOnChanges();
        return true;
    }
    return false;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUc5QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFMUMsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLGtCQUFrQixFQUFpQyxNQUFNLE1BQU0sQ0FBQztBQUN4RSxPQUFPLEVBQUMsWUFBWSxFQUFFLHNCQUFzQixFQUFFLHlCQUF5QixFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9ILE9BQU8sRUFBdUIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDdkcsT0FBTyxFQUFZLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFGLE9BQU8sRUFBdUcsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakwsT0FBTyxFQUEwQiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRyxPQUFPLEVBQUMsVUFBVSxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQy9ELE9BQU8sRUFBQyxPQUFPLEVBQVksa0JBQWtCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFN0QsTUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUE0RHRFLE1BQU0sT0FBTyxTQUFTO0lBQ3BCLFlBQ1csTUFBc0IsRUFBVSxPQUF5QixFQUN4RCxJQUFzQjtRQUR2QixXQUFNLEdBQU4sTUFBTSxD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Q0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFLRCxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQWdDLFVBQWlCLENBQUM7QUFFeEU7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLEtBQUssQ0FDakIsV0FBMEIsRUFBRSxTQUE4QixFQUFFLE9BQWlCLEVBQzdFLElBQWdDO0lBQ2xDLFNBQVMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0lBQ3RDLE1BQU0sU0FBUyxHQUFHLElBQUksU0FBUyxFQUFLLENBQUM7SUFDckMsTUFBTSxPQUFPLEdBQUcseUJBQXlCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckQsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRCx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxJQUFJLFdBQVcsSUFBSSxJQUFJLEVBQUU7UUFDdkIsS0FBSyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUMvQjtJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxTQUF5QjtJQUNwRCxNQUFNLGFBQWEsR0FBSSxTQUFvQyxDQUFDO0lBQzVELElBQUksU0FBUyxDQUFDLEtBQUssRUFBRTtRQUNuQixTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzQyxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICcuLi9ldmVudF9lbWl0dGVyJztcbmltcG9ydCB7UXVlcnlMaXN0IGFzIHZpZXdFbmdpbmVfUXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtnZXRTeW1ib2xJdGVyYXRvcn0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7UmVhZEZyb21JbmplY3RvckZuLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtfZ2V0Vmlld0RhdGEsIGFzc2VydFByZXZpb3VzSXNQYXJlbnQsIGdldE9yQ3JlYXRlQ3VycmVudFF1ZXJpZXMsIHN0b3JlLCBzdG9yZUNsZWFudXBXaXRoQ29udGV4dH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZJbnRlcm5hbCwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMSW5qZWN0b3IsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0xDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0RJUkVDVElWRVMsIExWaWV3RGF0YSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7ZmxhdHRlbiwgZ2V0TE5vZGUsIGlzQ29udGVudFF1ZXJ5SG9zdH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0O1xuXG4vKipcbiAqIEEgcHJlZGljYXRlIHdoaWNoIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiByZXN1bHRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgLyoqXG4gICAqIElmIGxvb2tpbmcgZm9yIGRpcmVjdGl2ZXMgdGhlbiBpdCBjb250YWlucyB0aGUgZGlyZWN0aXZlIHR5cGUuXG4gICAqL1xuICB0eXBlOiBUeXBlPFQ+fG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHNlbGVjdG9yIHRoZW4gY29udGFpbnMgbG9jYWwgbmFtZXMgdG8gcXVlcnkgZm9yLlxuICAgKi9cbiAgc2VsZWN0b3I6IHN0cmluZ1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGljaCB0b2tlbiBzaG91bGQgYmUgcmVhZCBmcm9tIERJIGZvciB0aGlzIHF1ZXJ5LlxuICAgKi9cbiAgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnxUeXBlPFQ+fG51bGw7XG59XG5cbi8qKlxuICogQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhIHF1ZXJ5LCB3aGljaCBpcyBhIGNvbWJpbmF0aW9uIG9mOlxuICogLSBxdWVyeSBwcmVkaWNhdGUgdG8gZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAqIC0gdmFsdWVzIGNvbGxlY3RlZCBiYXNlZCBvbiBhIHByZWRpY2F0ZVxuICogLSBgUXVlcnlMaXN0YCB0byB3aGljaCBjb2xsZWN0ZWQgdmFsdWVzIHNob3VsZCBiZSByZXBvcnRlZFxuICovXG5leHBvcnQgaW50ZXJmYWNlIExRdWVyeTxUPiB7XG4gIC8qKlxuICAgKiBOZXh0IHF1ZXJ5LiBVc2VkIHdoZW4gcXVlcmllcyBhcmUgc3RvcmVkIGFzIGEgbGlua2VkIGxpc3QgaW4gYExRdWVyaWVzYC5cbiAgICovXG4gIG5leHQ6IExRdWVyeTxhbnk+fG51bGw7XG5cbiAgLyoqXG4gICAqIERlc3RpbmF0aW9uIHRvIHdoaWNoIHRoZSB2YWx1ZSBzaG91bGQgYmUgYWRkZWQuXG4gICAqL1xuICBsaXN0OiBRdWVyeUxpc3Q8VD47XG5cbiAgLyoqXG4gICAqIEEgcHJlZGljYXRlIHdoaWNoIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gICAqIHJlc3VsdHMuXG4gICAqL1xuICBwcmVkaWNhdGU6IFF1ZXJ5UHJlZGljYXRlPFQ+O1xuXG4gIC8qKlxuICAgKiBWYWx1ZXMgd2hpY2ggaGF2ZSBiZWVuIGxvY2F0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgd2hhdCBidWlsZHMgdXAgdGhlIGBRdWVyeUxpc3QuX3ZhbHVlc1RyZWVgLlxuICAgKi9cbiAgdmFsdWVzOiBhbnlbXTtcblxuICAvKipcbiAgICogQSBwb2ludGVyIHRvIGFuIGFycmF5IHRoYXQgc3RvcmVzIGNvbGxlY3RlZCB2YWx1ZXMgZnJvbSB2aWV3cy4gVGhpcyBpcyBuZWNlc3Nhcnkgc28gd2Uga25vdyBhXG4gICAqIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRvIGluc2VydCBub2RlcyBjb2xsZWN0ZWQgZnJvbSB2aWV3cy5cbiAgICovXG4gIGNvbnRhaW5lclZhbHVlczogYW55W118bnVsbDtcbn1cblxuZXhwb3J0IGNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcGFyZW50OiBMUXVlcmllc198bnVsbCwgcHJpdmF0ZSBzaGFsbG93OiBMUXVlcnk8YW55PnxudWxsLFxuICAgICAgcHJpdmF0ZSBkZWVwOiBMUXVlcnk8YW55PnxudWxsKSB7fVxuXG4gIHRyYWNrPFQ+KFxuICAgICAgcXVlcnlMaXN0OiB2aWV3RW5naW5lX1F1ZXJ5TGlzdDxUPiwgcHJlZGljYXRlOiBUeXBlPFQ+fHN0cmluZ1tdLCBkZXNjZW5kPzogYm9vbGVhbixcbiAgICAgIHJlYWQ/OiBRdWVyeVJlYWRUeXBlPFQ+fFR5cGU8VD4pOiB2b2lkIHtcbiAgICBpZiAoZGVzY2VuZCkge1xuICAgICAgdGhpcy5kZWVwID0gY3JlYXRlUXVlcnkodGhpcy5kZWVwLCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNoYWxsb3cgPSBjcmVhdGVRdWVyeSh0aGlzLnNoYWxsb3csIHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCByZWFkICE9IG51bGwgPyByZWFkIDogbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgY2xvbmUoKTogTFF1ZXJpZXMgeyByZXR1cm4gbmV3IExRdWVyaWVzXyh0aGlzLCBudWxsLCB0aGlzLmRlZXApOyB9XG5cbiAgY29udGFpbmVyKCk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHNoYWxsb3dSZXN1bHRzID0gY29weVF1ZXJpZXNUb0NvbnRhaW5lcih0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb0NvbnRhaW5lcih0aGlzLmRlZXApO1xuXG4gICAgcmV0dXJuIHNoYWxsb3dSZXN1bHRzIHx8IGRlZXBSZXN1bHRzID8gbmV3IExRdWVyaWVzXyh0aGlzLCBzaGFsbG93UmVzdWx0cywgZGVlcFJlc3VsdHMpIDogbnVsbDtcbiAgfVxuXG4gIGNyZWF0ZVZpZXcoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3Qgc2hhbGxvd1Jlc3VsdHMgPSBjb3B5UXVlcmllc1RvVmlldyh0aGlzLnNoYWxsb3cpO1xuICAgIGNvbnN0IGRlZXBSZXN1bHRzID0gY29weVF1ZXJpZXNUb1ZpZXcodGhpcy5kZWVwKTtcblxuICAgIHJldHVybiBzaGFsbG93UmVzdWx0cyB8fCBkZWVwUmVzdWx0cyA/IG5ldyBMUXVlcmllc18odGhpcywgc2hhbGxvd1Jlc3VsdHMsIGRlZXBSZXN1bHRzKSA6IG51bGw7XG4gIH1cblxuICBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpbnNlcnRWaWV3KGluZGV4LCB0aGlzLnNoYWxsb3cpO1xuICAgIGluc2VydFZpZXcoaW5kZXgsIHRoaXMuZGVlcCk7XG4gIH1cblxuICBhZGROb2RlKHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgYWRkKHRoaXMuZGVlcCwgdE5vZGUpO1xuXG4gICAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICAgIGFkZCh0aGlzLnNoYWxsb3csIHROb2RlKTtcblxuICAgICAgaWYgKHROb2RlLnBhcmVudCAmJiBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUucGFyZW50KSkge1xuICAgICAgICAvLyBpZiBub2RlIGhhcyBhIGNvbnRlbnQgcXVlcnkgYW5kIHBhcmVudCBhbHNvIGhhcyBhIGNvbnRlbnQgcXVlcnlcbiAgICAgICAgLy8gYm90aCBxdWVyaWVzIG5lZWQgdG8gY2hlY2sgdGhpcyBub2RlIGZvciBzaGFsbG93IG1hdGNoZXNcbiAgICAgICAgYWRkKHRoaXMucGFyZW50ICEuc2hhbGxvdywgdE5vZGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucGFyZW50O1xuICAgIH1cblxuICAgIGlzUm9vdE5vZGVPZlF1ZXJ5KHROb2RlKSAmJiBhZGQodGhpcy5zaGFsbG93LCB0Tm9kZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVWaWV3KCk6IHZvaWQge1xuICAgIHJlbW92ZVZpZXcodGhpcy5zaGFsbG93KTtcbiAgICByZW1vdmVWaWV3KHRoaXMuZGVlcCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNSb290Tm9kZU9mUXVlcnkodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiB0Tm9kZS5wYXJlbnQgPT09IG51bGwgfHwgaXNDb250ZW50UXVlcnlIb3N0KHROb2RlLnBhcmVudCk7XG59XG5cbmZ1bmN0aW9uIGNvcHlRdWVyaWVzVG9Db250YWluZXIocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlczogYW55W10gPSBbXTsgIC8vIHByZXBhcmUgcm9vbSBmb3Igdmlld3NcbiAgICBxdWVyeS52YWx1ZXMucHVzaChjb250YWluZXJWYWx1ZXMpO1xuICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgIG5leHQ6IHJlc3VsdCxcbiAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgIHZhbHVlczogY29udGFpbmVyVmFsdWVzLFxuICAgICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpOiBMUXVlcnk8YW55PnxudWxsIHtcbiAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgY2xvbmVkUXVlcnk6IExRdWVyeTxhbnk+ID0ge1xuICAgICAgbmV4dDogcmVzdWx0LFxuICAgICAgbGlzdDogcXVlcnkubGlzdCxcbiAgICAgIHByZWRpY2F0ZTogcXVlcnkucHJlZGljYXRlLFxuICAgICAgdmFsdWVzOiBbXSxcbiAgICAgIGNvbnRhaW5lclZhbHVlczogcXVlcnkudmFsdWVzXG4gICAgfTtcbiAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRWaWV3KGluZGV4OiBudW1iZXIsIHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG4gICAgcXVlcnkuY29udGFpbmVyVmFsdWVzICEuc3BsaWNlKGluZGV4LCAwLCBxdWVyeS52YWx1ZXMpO1xuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVWaWV3KHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCkge1xuICB3aGlsZSAocXVlcnkpIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG5cbiAgICBjb25zdCBjb250YWluZXJWYWx1ZXMgPSBxdWVyeS5jb250YWluZXJWYWx1ZXMgITtcbiAgICBjb25zdCB2aWV3VmFsdWVzSWR4ID0gY29udGFpbmVyVmFsdWVzLmluZGV4T2YocXVlcnkudmFsdWVzKTtcbiAgICBjb25zdCByZW1vdmVkID0gY29udGFpbmVyVmFsdWVzLnNwbGljZSh2aWV3VmFsdWVzSWR4LCAxKTtcblxuICAgIC8vIG1hcmsgYSBxdWVyeSBhcyBkaXJ0eSBvbmx5IHdoZW4gcmVtb3ZlZCB2aWV3IGhhZCBtYXRjaGluZyBtb2Rlc1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChyZW1vdmVkLmxlbmd0aCwgMSwgJ3JlbW92ZWQubGVuZ3RoJyk7XG4gICAgaWYgKHJlbW92ZWRbMF0ubGVuZ3RoKSB7XG4gICAgICBxdWVyeS5saXN0LnNldERpcnR5KCk7XG4gICAgfVxuXG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIHRoZSBkaXJlY3RpdmVzIGZvciBhIG5vZGUgYW5kIHJldHVybnMgaW5kZXggb2YgYSBkaXJlY3RpdmUgZm9yIGEgZ2l2ZW4gdHlwZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgb24gd2hpY2ggZGlyZWN0aXZlcyBhcmUgcHJlc2VudC5cbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgdmlldyB3ZSBhcmUgY3VycmVudGx5IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSB0eXBlIFR5cGUgb2YgYSBkaXJlY3RpdmUgdG8gbG9vayBmb3IuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBhIGZvdW5kIGRpcmVjdGl2ZSBvciBudWxsIHdoZW4gbm9uZSBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIHR5cGU6IFR5cGU8YW55Pik6IG51bWJlcnxcbiAgICBudWxsIHtcbiAgY29uc3QgZGVmcyA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kaXJlY3RpdmVzO1xuICBpZiAoZGVmcykge1xuICAgIGNvbnN0IGZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gICAgY29uc3QgY291bnQgPSBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICAgIGNvbnN0IHN0YXJ0ID0gZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0eXBlICYmIGRlZi5kaVB1YmxpYykge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlYWRGcm9tTm9kZUluamVjdG9yKFxuICAgIHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSwgcmVhZDogUXVlcnlSZWFkVHlwZTxhbnk+fCBUeXBlPGFueT4sXG4gICAgZGlyZWN0aXZlSWR4OiBudW1iZXIpOiBhbnkge1xuICBpZiAocmVhZCBpbnN0YW5jZW9mIFJlYWRGcm9tSW5qZWN0b3JGbikge1xuICAgIHJldHVybiByZWFkLnJlYWQodE5vZGUsIGN1cnJlbnRWaWV3LCBkaXJlY3RpdmVJZHgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZSh0Tm9kZSwgY3VycmVudFZpZXcsIHJlYWQgYXMgVHlwZTxhbnk+KTtcbiAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBjdXJyZW50Vmlld1tESVJFQ1RJVkVTXSAhW21hdGNoaW5nSWR4XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGFkZChcbiAgICBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwsIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSkge1xuICBjb25zdCBjdXJyZW50VmlldyA9IF9nZXRWaWV3RGF0YSgpO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IHF1ZXJ5LnByZWRpY2F0ZTtcbiAgICBjb25zdCB0eXBlID0gcHJlZGljYXRlLnR5cGU7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeCA9IGdldElkeE9mTWF0Y2hpbmdEaXJlY3RpdmUodE5vZGUsIGN1cnJlbnRWaWV3LCB0eXBlKTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggIT09IG51bGwpIHtcbiAgICAgICAgLy8gYSBub2RlIGlzIG1hdGNoaW5nIGEgcHJlZGljYXRlIC0gZGV0ZXJtaW5lIHdoYXQgdG8gcmVhZFxuICAgICAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIHVzZSB0eXBlIGFzIHJlYWQgdG9rZW5cbiAgICAgICAgY29uc3QgcmVzdWx0ID1cbiAgICAgICAgICAgIHJlYWRGcm9tTm9kZUluamVjdG9yKHROb2RlLCBjdXJyZW50VmlldywgcHJlZGljYXRlLnJlYWQgfHwgdHlwZSwgZGlyZWN0aXZlSWR4KTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcHJlZGljYXRlLnNlbGVjdG9yICE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeCA9IGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0pO1xuICAgICAgICBpZiAoZGlyZWN0aXZlSWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gYSBub2RlIGlzIG1hdGNoaW5nIGEgcHJlZGljYXRlIC0gZGV0ZXJtaW5lIHdoYXQgdG8gcmVhZFxuICAgICAgICAgIC8vIG5vdGUgdGhhdCBxdWVyaWVzIHVzaW5nIG5hbWUgc2VsZWN0b3IgbXVzdCBzcGVjaWZ5IHJlYWQgc3RyYXRlZ3lcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmVkaWNhdGUucmVhZCwgJ3RoZSBub2RlIHNob3VsZCBoYXZlIGEgcHJlZGljYXRlJyk7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVhZEZyb21Ob2RlSW5qZWN0b3IodE5vZGUsIGN1cnJlbnRWaWV3LCBwcmVkaWNhdGUucmVhZCAhLCBkaXJlY3RpdmVJZHgpO1xuICAgICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkTWF0Y2gocXVlcnk6IExRdWVyeTxhbnk+LCBtYXRjaGluZ1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgcXVlcnkudmFsdWVzLnB1c2gobWF0Y2hpbmdWYWx1ZSk7XG4gIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJlZGljYXRlPFQ+KFxuICAgIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD58IG51bGwpOiBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHByZWRpY2F0ZSk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogaXNBcnJheSA/IG51bGwgOiBwcmVkaWNhdGUgYXMgVHlwZTxUPixcbiAgICBzZWxlY3RvcjogaXNBcnJheSA/IHByZWRpY2F0ZSBhcyBzdHJpbmdbXSA6IG51bGwsXG4gICAgcmVhZDogcmVhZFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVRdWVyeTxUPihcbiAgICBwcmV2aW91czogTFF1ZXJ5PGFueT58IG51bGwsIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58IHN0cmluZ1tdLFxuICAgIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD58IG51bGwpOiBMUXVlcnk8VD4ge1xuICByZXR1cm4ge1xuICAgIG5leHQ6IHByZXZpb3VzLFxuICAgIGxpc3Q6IHF1ZXJ5TGlzdCxcbiAgICBwcmVkaWNhdGU6IGNyZWF0ZVByZWRpY2F0ZShwcmVkaWNhdGUsIHJlYWQpLFxuICAgIHZhbHVlczogKHF1ZXJ5TGlzdCBhcyBhbnkgYXMgUXVlcnlMaXN0XzxUPikuX3ZhbHVlc1RyZWUsXG4gICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gIH07XG59XG5cbmNsYXNzIFF1ZXJ5TGlzdF88VD4vKiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfUXVlcnlMaXN0PFQ+ICovIHtcbiAgcmVhZG9ubHkgZGlydHkgPSB0cnVlO1xuICByZWFkb25seSBjaGFuZ2VzOiBPYnNlcnZhYmxlPFQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBwcml2YXRlIF92YWx1ZXM6IFRbXSA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIF92YWx1ZXNUcmVlOiBhbnlbXSA9IFtdO1xuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5sZW5ndGg7IH1cblxuICBnZXQgZmlyc3QoKTogVHxudWxsIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID8gdmFsdWVzWzBdIDogbnVsbDtcbiAgfVxuXG4gIGdldCBsYXN0KCk6IFR8bnVsbCB7XG4gICAgbGV0IHZhbHVlcyA9IHRoaXMuX3ZhbHVlcztcbiAgICByZXR1cm4gdmFsdWVzLmxlbmd0aCA/IHZhbHVlc1t2YWx1ZXMubGVuZ3RoIC0gMV0gOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkubWFwXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9tYXApXG4gICAqL1xuICBtYXA8VT4oZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVKTogVVtdIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5tYXAoZm4pOyB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZmlsdGVyXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maWx0ZXIpXG4gICAqL1xuICBmaWx0ZXIoZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogVFtdIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmZpbHRlcihmbik7XG4gIH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5maW5kXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maW5kKVxuICAgKi9cbiAgZmluZChmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBUfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5maW5kKGZuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LnJlZHVjZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvcmVkdWNlKVxuICAgKi9cbiAgcmVkdWNlPFU+KGZuOiAocHJldlZhbHVlOiBVLCBjdXJWYWx1ZTogVCwgY3VySW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gVSwgaW5pdDogVSk6IFUge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMucmVkdWNlKGZuLCBpbml0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZvckVhY2hdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2gpXG4gICAqL1xuICBmb3JFYWNoKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl92YWx1ZXMuZm9yRWFjaChmbik7IH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5zb21lXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9zb21lKVxuICAgKi9cbiAgc29tZShmbjogKHZhbHVlOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5zb21lKGZuKTtcbiAgfVxuXG4gIHRvQXJyYXkoKTogVFtdIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5zbGljZSgwKTsgfVxuXG4gIFtnZXRTeW1ib2xJdGVyYXRvcigpXSgpOiBJdGVyYXRvcjxUPiB7IHJldHVybiAodGhpcy5fdmFsdWVzIGFzIGFueSlbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTsgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLl92YWx1ZXMudG9TdHJpbmcoKTsgfVxuXG4gIHJlc2V0KHJlczogKGFueVtdfFQpW10pOiB2b2lkIHtcbiAgICB0aGlzLl92YWx1ZXMgPSBmbGF0dGVuKHJlcyk7XG4gICAgKHRoaXMgYXN7ZGlydHk6IGJvb2xlYW59KS5kaXJ0eSA9IGZhbHNlO1xuICB9XG5cbiAgbm90aWZ5T25DaGFuZ2VzKCk6IHZvaWQgeyAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS5lbWl0KHRoaXMpOyB9XG4gIHNldERpcnR5KCk6IHZvaWQgeyAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gdHJ1ZTsgfVxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLmNvbXBsZXRlKCk7XG4gICAgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikudW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG4vLyBOT1RFOiB0aGlzIGhhY2sgaXMgaGVyZSBiZWNhdXNlIElRdWVyeUxpc3QgaGFzIHByaXZhdGUgbWVtYmVycyBhbmQgdGhlcmVmb3JlXG4vLyBpdCBjYW4ndCBiZSBpbXBsZW1lbnRlZCBvbmx5IGV4dGVuZGVkLlxuZXhwb3J0IHR5cGUgUXVlcnlMaXN0PFQ+ID0gdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD47XG5leHBvcnQgY29uc3QgUXVlcnlMaXN0OiB0eXBlb2Ygdmlld0VuZ2luZV9RdWVyeUxpc3QgPSBRdWVyeUxpc3RfIGFzIGFueTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBtZW1vcnlJbmRleCBUaGUgaW5kZXggaW4gbWVtb3J5IHdoZXJlIHRoZSBRdWVyeUxpc3Qgc2hvdWxkIGJlIHNhdmVkLiBJZiBudWxsLFxuICogdGhpcyBpcyBpcyBhIGNvbnRlbnQgcXVlcnkgYW5kIHRoZSBRdWVyeUxpc3Qgd2lsbCBiZSBzYXZlZCBsYXRlciB0aHJvdWdoIGRpcmVjdGl2ZUNyZWF0ZS5cbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5PFQ+KFxuICAgIG1lbW9yeUluZGV4OiBudW1iZXIgfCBudWxsLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgIHJlYWQ/OiBRdWVyeVJlYWRUeXBlPFQ+fCBUeXBlPFQ+KTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBjb25zdCBxdWVyaWVzID0gZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcyhMUXVlcmllc18pO1xuICBxdWVyaWVzLnRyYWNrKHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobnVsbCwgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG4gIGlmIChtZW1vcnlJbmRleCAhPSBudWxsKSB7XG4gICAgc3RvcmUobWVtb3J5SW5kZXgsIHF1ZXJ5TGlzdCk7XG4gIH1cbiAgcmV0dXJuIHF1ZXJ5TGlzdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0SW1wbCA9IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88YW55Pik7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkpIHtcbiAgICBxdWVyeUxpc3QucmVzZXQocXVlcnlMaXN0SW1wbC5fdmFsdWVzVHJlZSk7XG4gICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==