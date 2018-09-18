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
import { ReadFromInjectorFn, getOrCreateNodeInjectorForNode } from './di';
import { _getViewData, assertPreviousIsParent, getOrCreateCurrentQueries, store, storeCleanupWithContext } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { DIRECTIVES, TVIEW } from './interfaces/view';
import { flatten, getLNode, isContentQueryHost } from './util';
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
function readFromNodeInjector(nodeInjector, tNode, currentView, read, directiveIdx) {
    if (read instanceof ReadFromInjectorFn) {
        return read.read(nodeInjector, tNode, directiveIdx);
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
    // TODO: remove this lookup when nodeInjector is removed from LNode
    const nodeInjector = getOrCreateNodeInjectorForNode(getLNode(tNode, currentView), tNode, currentView);
    while (query) {
        const predicate = query.predicate;
        const type = predicate.type;
        if (type) {
            const directiveIdx = getIdxOfMatchingDirective(tNode, currentView, type);
            if (directiveIdx !== null) {
                // a node is matching a predicate - determine what to read
                // if read token and / or strategy is not specified, use type as read token
                const result = readFromNodeInjector(nodeInjector, tNode, currentView, predicate.read || type, directiveIdx);
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
                    const result = readFromNodeInjector(nodeInjector, tNode, currentView, predicate.read, directiveIdx);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUc5QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFMUMsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxZQUFZLEVBQUUsc0JBQXNCLEVBQUUseUJBQXlCLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0gsT0FBTyxFQUF1Qiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN2RyxPQUFPLEVBQVksNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUYsT0FBTyxFQUF1Ryw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqTCxPQUFPLEVBQTBCLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3JHLE9BQU8sRUFBQyxVQUFVLEVBQWEsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0QsT0FBTyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFN0QsTUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUE0RHRFLE1BQU0sT0FBTyxTQUFTO0lBQ3BCLFlBQ1csTUFBc0IsRUFBVSxPQUF5QixFQUN4RCxJQUFzQjtR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QUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnLi4vZXZlbnRfZW1pdHRlcic7XG5pbXBvcnQge1F1ZXJ5TGlzdCBhcyB2aWV3RW5naW5lX1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7Z2V0U3ltYm9sSXRlcmF0b3J9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge1JlYWRGcm9tSW5qZWN0b3JGbiwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuL2RpJztcbmltcG9ydCB7X2dldFZpZXdEYXRhLCBhc3NlcnRQcmV2aW91c0lzUGFyZW50LCBnZXRPckNyZWF0ZUN1cnJlbnRRdWVyaWVzLCBzdG9yZSwgc3RvcmVDbGVhbnVwV2l0aENvbnRleHR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmSW50ZXJuYWwsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEluamVjdG9yLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCBRdWVyeVJlYWRUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtESVJFQ1RJVkVTLCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2ZsYXR0ZW4sIGdldExOb2RlLCBpc0NvbnRlbnRRdWVyeUhvc3R9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNDtcblxuLyoqXG4gKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogcmVzdWx0cy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIC8qKlxuICAgKiBJZiBsb29raW5nIGZvciBkaXJlY3RpdmVzIHRoZW4gaXQgY29udGFpbnMgdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICAgKi9cbiAgdHlwZTogVHlwZTxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBJZiBzZWxlY3RvciB0aGVuIGNvbnRhaW5zIGxvY2FsIG5hbWVzIHRvIHF1ZXJ5IGZvci5cbiAgICovXG4gIHNlbGVjdG9yOiBzdHJpbmdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hpY2ggdG9rZW4gc2hvdWxkIGJlIHJlYWQgZnJvbSBESSBmb3IgdGhpcyBxdWVyeS5cbiAgICovXG4gIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58VHlwZTxUPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCByZXByZXNlbnRpbmcgYSBxdWVyeSwgd2hpY2ggaXMgYSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gcXVlcnkgcHJlZGljYXRlIHRvIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiAtIHZhbHVlcyBjb2xsZWN0ZWQgYmFzZWQgb24gYSBwcmVkaWNhdGVcbiAqIC0gYFF1ZXJ5TGlzdGAgdG8gd2hpY2ggY29sbGVjdGVkIHZhbHVlcyBzaG91bGQgYmUgcmVwb3J0ZWRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMUXVlcnk8VD4ge1xuICAvKipcbiAgICogTmV4dCBxdWVyeS4gVXNlZCB3aGVuIHF1ZXJpZXMgYXJlIHN0b3JlZCBhcyBhIGxpbmtlZCBsaXN0IGluIGBMUXVlcmllc2AuXG4gICAqL1xuICBuZXh0OiBMUXVlcnk8YW55PnxudWxsO1xuXG4gIC8qKlxuICAgKiBEZXN0aW5hdGlvbiB0byB3aGljaCB0aGUgdmFsdWUgc2hvdWxkIGJlIGFkZGVkLlxuICAgKi9cbiAgbGlzdDogUXVlcnlMaXN0PFQ+O1xuXG4gIC8qKlxuICAgKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICAgKiByZXN1bHRzLlxuICAgKi9cbiAgcHJlZGljYXRlOiBRdWVyeVByZWRpY2F0ZTxUPjtcblxuICAvKipcbiAgICogVmFsdWVzIHdoaWNoIGhhdmUgYmVlbiBsb2NhdGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHdoYXQgYnVpbGRzIHVwIHRoZSBgUXVlcnlMaXN0Ll92YWx1ZXNUcmVlYC5cbiAgICovXG4gIHZhbHVlczogYW55W107XG5cbiAgLyoqXG4gICAqIEEgcG9pbnRlciB0byBhbiBhcnJheSB0aGF0IHN0b3JlcyBjb2xsZWN0ZWQgdmFsdWVzIGZyb20gdmlld3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHdlIGtub3cgYVxuICAgKiBjb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgbm9kZXMgY29sbGVjdGVkIGZyb20gdmlld3MuXG4gICAqL1xuICBjb250YWluZXJWYWx1ZXM6IGFueVtdfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHBhcmVudDogTFF1ZXJpZXNffG51bGwsIHByaXZhdGUgc2hhbGxvdzogTFF1ZXJ5PGFueT58bnVsbCxcbiAgICAgIHByaXZhdGUgZGVlcDogTFF1ZXJ5PGFueT58bnVsbCkge31cblxuICB0cmFjazxUPihcbiAgICAgIHF1ZXJ5TGlzdDogdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnxzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgICByZWFkPzogUXVlcnlSZWFkVHlwZTxUPnxUeXBlPFQ+KTogdm9pZCB7XG4gICAgaWYgKGRlc2NlbmQpIHtcbiAgICAgIHRoaXMuZGVlcCA9IGNyZWF0ZVF1ZXJ5KHRoaXMuZGVlcCwgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaGFsbG93ID0gY3JlYXRlUXVlcnkodGhpcy5zaGFsbG93LCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKCk6IExRdWVyaWVzIHsgcmV0dXJuIG5ldyBMUXVlcmllc18odGhpcywgbnVsbCwgdGhpcy5kZWVwKTsgfVxuXG4gIGNvbnRhaW5lcigpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCBzaGFsbG93UmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9Db250YWluZXIodGhpcy5zaGFsbG93KTtcbiAgICBjb25zdCBkZWVwUmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9Db250YWluZXIodGhpcy5kZWVwKTtcblxuICAgIHJldHVybiBzaGFsbG93UmVzdWx0cyB8fCBkZWVwUmVzdWx0cyA/IG5ldyBMUXVlcmllc18odGhpcywgc2hhbGxvd1Jlc3VsdHMsIGRlZXBSZXN1bHRzKSA6IG51bGw7XG4gIH1cblxuICBjcmVhdGVWaWV3KCk6IExRdWVyaWVzfG51bGwge1xuICAgIGNvbnN0IHNoYWxsb3dSZXN1bHRzID0gY29weVF1ZXJpZXNUb1ZpZXcodGhpcy5zaGFsbG93KTtcbiAgICBjb25zdCBkZWVwUmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9WaWV3KHRoaXMuZGVlcCk7XG5cbiAgICByZXR1cm4gc2hhbGxvd1Jlc3VsdHMgfHwgZGVlcFJlc3VsdHMgPyBuZXcgTFF1ZXJpZXNfKHRoaXMsIHNoYWxsb3dSZXN1bHRzLCBkZWVwUmVzdWx0cykgOiBudWxsO1xuICB9XG5cbiAgaW5zZXJ0VmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgaW5zZXJ0VmlldyhpbmRleCwgdGhpcy5zaGFsbG93KTtcbiAgICBpbnNlcnRWaWV3KGluZGV4LCB0aGlzLmRlZXApO1xuICB9XG5cbiAgYWRkTm9kZSh0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6IExRdWVyaWVzfG51bGwge1xuICAgIGFkZCh0aGlzLmRlZXAsIHROb2RlKTtcblxuICAgIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUpKSB7XG4gICAgICBhZGQodGhpcy5zaGFsbG93LCB0Tm9kZSk7XG5cbiAgICAgIGlmICh0Tm9kZS5wYXJlbnQgJiYgaXNDb250ZW50UXVlcnlIb3N0KHROb2RlLnBhcmVudCkpIHtcbiAgICAgICAgLy8gaWYgbm9kZSBoYXMgYSBjb250ZW50IHF1ZXJ5IGFuZCBwYXJlbnQgYWxzbyBoYXMgYSBjb250ZW50IHF1ZXJ5XG4gICAgICAgIC8vIGJvdGggcXVlcmllcyBuZWVkIHRvIGNoZWNrIHRoaXMgbm9kZSBmb3Igc2hhbGxvdyBtYXRjaGVzXG4gICAgICAgIGFkZCh0aGlzLnBhcmVudCAhLnNoYWxsb3csIHROb2RlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnBhcmVudDtcbiAgICB9XG5cbiAgICBpc1Jvb3ROb2RlT2ZRdWVyeSh0Tm9kZSkgJiYgYWRkKHRoaXMuc2hhbGxvdywgdE5vZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlVmlldygpOiB2b2lkIHtcbiAgICByZW1vdmVWaWV3KHRoaXMuc2hhbGxvdyk7XG4gICAgcmVtb3ZlVmlldyh0aGlzLmRlZXApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzUm9vdE5vZGVPZlF1ZXJ5KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gdE5vZGUucGFyZW50ID09PSBudWxsIHx8IGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZS5wYXJlbnQpO1xufVxuXG5mdW5jdGlvbiBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCk6IExRdWVyeTxhbnk+fG51bGwge1xuICBsZXQgcmVzdWx0OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcblxuICB3aGlsZSAocXVlcnkpIHtcbiAgICBjb25zdCBjb250YWluZXJWYWx1ZXM6IGFueVtdID0gW107ICAvLyBwcmVwYXJlIHJvb20gZm9yIHZpZXdzXG4gICAgcXVlcnkudmFsdWVzLnB1c2goY29udGFpbmVyVmFsdWVzKTtcbiAgICBjb25zdCBjbG9uZWRRdWVyeTogTFF1ZXJ5PGFueT4gPSB7XG4gICAgICBuZXh0OiByZXN1bHQsXG4gICAgICBsaXN0OiBxdWVyeS5saXN0LFxuICAgICAgcHJlZGljYXRlOiBxdWVyeS5wcmVkaWNhdGUsXG4gICAgICB2YWx1ZXM6IGNvbnRhaW5lclZhbHVlcyxcbiAgICAgIGNvbnRhaW5lclZhbHVlczogbnVsbFxuICAgIH07XG4gICAgcmVzdWx0ID0gY2xvbmVkUXVlcnk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY29weVF1ZXJpZXNUb1ZpZXcocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKTogTFF1ZXJ5PGFueT58bnVsbCB7XG4gIGxldCByZXN1bHQ6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgIG5leHQ6IHJlc3VsdCxcbiAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgIHZhbHVlczogW10sXG4gICAgICBjb250YWluZXJWYWx1ZXM6IHF1ZXJ5LnZhbHVlc1xuICAgIH07XG4gICAgcmVzdWx0ID0gY2xvbmVkUXVlcnk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0VmlldyhpbmRleDogbnVtYmVyLCBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpIHtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMsICdWaWV3IHF1ZXJpZXMgbmVlZCB0byBoYXZlIGEgcG9pbnRlciB0byBjb250YWluZXIgdmFsdWVzLicpO1xuICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhLnNwbGljZShpbmRleCwgMCwgcXVlcnkudmFsdWVzKTtcbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlVmlldyhxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpIHtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMsICdWaWV3IHF1ZXJpZXMgbmVlZCB0byBoYXZlIGEgcG9pbnRlciB0byBjb250YWluZXIgdmFsdWVzLicpO1xuXG4gICAgY29uc3QgY29udGFpbmVyVmFsdWVzID0gcXVlcnkuY29udGFpbmVyVmFsdWVzICE7XG4gICAgY29uc3Qgdmlld1ZhbHVlc0lkeCA9IGNvbnRhaW5lclZhbHVlcy5pbmRleE9mKHF1ZXJ5LnZhbHVlcyk7XG4gICAgY29uc3QgcmVtb3ZlZCA9IGNvbnRhaW5lclZhbHVlcy5zcGxpY2Uodmlld1ZhbHVlc0lkeCwgMSk7XG5cbiAgICAvLyBtYXJrIGEgcXVlcnkgYXMgZGlydHkgb25seSB3aGVuIHJlbW92ZWQgdmlldyBoYWQgbWF0Y2hpbmcgbW9kZXNcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwocmVtb3ZlZC5sZW5ndGgsIDEsICdyZW1vdmVkLmxlbmd0aCcpO1xuICAgIGlmIChyZW1vdmVkWzBdLmxlbmd0aCkge1xuICAgICAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xuICAgIH1cblxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBsb2NhbCBuYW1lcyBmb3IgYSBnaXZlbiBub2RlIGFuZCByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleFxuICogKG9yIC0xIGlmIGEgbG9jYWwgbmFtZSBwb2ludHMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIHROb2RlIHN0YXRpYyBkYXRhIG9mIGEgbm9kZSB0byBjaGVja1xuICogQHBhcmFtIHNlbGVjdG9yIHNlbGVjdG9yIHRvIG1hdGNoXG4gKiBAcmV0dXJucyBkaXJlY3RpdmUgaW5kZXgsIC0xIG9yIG51bGwgaWYgYSBzZWxlY3RvciBkaWRuJ3QgbWF0Y2ggYW55IG9mIHRoZSBsb2NhbCBuYW1lc1xuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3Rvcjogc3RyaW5nKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGlmIChsb2NhbE5hbWVzW2ldID09PSBzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGFsbCB0aGUgZGlyZWN0aXZlcyBmb3IgYSBub2RlIGFuZCByZXR1cm5zIGluZGV4IG9mIGEgZGlyZWN0aXZlIGZvciBhIGdpdmVuIHR5cGUuXG4gKlxuICogQHBhcmFtIHROb2RlIFROb2RlIG9uIHdoaWNoIGRpcmVjdGl2ZXMgYXJlIHByZXNlbnQuXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHZpZXcgd2UgYXJlIGN1cnJlbnRseSBwcm9jZXNzaW5nXG4gKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGEgZGlyZWN0aXZlIHRvIGxvb2sgZm9yLlxuICogQHJldHVybnMgSW5kZXggb2YgYSBmb3VuZCBkaXJlY3RpdmUgb3IgbnVsbCB3aGVuIG5vbmUgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdEaXJlY3RpdmUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLCB0eXBlOiBUeXBlPGFueT4pOiBudW1iZXJ8XG4gICAgbnVsbCB7XG4gIGNvbnN0IGRlZnMgPSBjdXJyZW50Vmlld1tUVklFV10uZGlyZWN0aXZlcztcbiAgaWYgKGRlZnMpIHtcbiAgICBjb25zdCBmbGFncyA9IHROb2RlLmZsYWdzO1xuICAgIGNvbnN0IGNvdW50ID0gZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgICBjb25zdCBzdGFydCA9IGZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGlmIChkZWYudHlwZSA9PT0gdHlwZSAmJiBkZWYuZGlQdWJsaWMpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiByZWFkRnJvbU5vZGVJbmplY3RvcihcbiAgICBub2RlSW5qZWN0b3I6IExJbmplY3RvciwgdE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLFxuICAgIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8YW55PnwgVHlwZTxhbnk+LCBkaXJlY3RpdmVJZHg6IG51bWJlcik6IGFueSB7XG4gIGlmIChyZWFkIGluc3RhbmNlb2YgUmVhZEZyb21JbmplY3RvckZuKSB7XG4gICAgcmV0dXJuIHJlYWQucmVhZChub2RlSW5qZWN0b3IsIHROb2RlLCBkaXJlY3RpdmVJZHgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG1hdGNoaW5nSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZSh0Tm9kZSwgY3VycmVudFZpZXcsIHJlYWQgYXMgVHlwZTxhbnk+KTtcbiAgICBpZiAobWF0Y2hpbmdJZHggIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBjdXJyZW50Vmlld1tESVJFQ1RJVkVTXSAhW21hdGNoaW5nSWR4XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGFkZChcbiAgICBxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwsIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSkge1xuICBjb25zdCBjdXJyZW50VmlldyA9IF9nZXRWaWV3RGF0YSgpO1xuXG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIGxvb2t1cCB3aGVuIG5vZGVJbmplY3RvciBpcyByZW1vdmVkIGZyb20gTE5vZGVcbiAgY29uc3Qgbm9kZUluamVjdG9yID1cbiAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShnZXRMTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpLCB0Tm9kZSwgY3VycmVudFZpZXcpO1xuXG4gIHdoaWxlIChxdWVyeSkge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IHF1ZXJ5LnByZWRpY2F0ZTtcbiAgICBjb25zdCB0eXBlID0gcHJlZGljYXRlLnR5cGU7XG4gICAgaWYgKHR5cGUpIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeCA9IGdldElkeE9mTWF0Y2hpbmdEaXJlY3RpdmUodE5vZGUsIGN1cnJlbnRWaWV3LCB0eXBlKTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggIT09IG51bGwpIHtcbiAgICAgICAgLy8gYSBub2RlIGlzIG1hdGNoaW5nIGEgcHJlZGljYXRlIC0gZGV0ZXJtaW5lIHdoYXQgdG8gcmVhZFxuICAgICAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIHVzZSB0eXBlIGFzIHJlYWQgdG9rZW5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVhZEZyb21Ob2RlSW5qZWN0b3IoXG4gICAgICAgICAgICBub2RlSW5qZWN0b3IsIHROb2RlLCBjdXJyZW50VmlldywgcHJlZGljYXRlLnJlYWQgfHwgdHlwZSwgZGlyZWN0aXZlSWR4KTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcHJlZGljYXRlLnNlbGVjdG9yICE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeCA9IGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0pO1xuICAgICAgICBpZiAoZGlyZWN0aXZlSWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gYSBub2RlIGlzIG1hdGNoaW5nIGEgcHJlZGljYXRlIC0gZGV0ZXJtaW5lIHdoYXQgdG8gcmVhZFxuICAgICAgICAgIC8vIG5vdGUgdGhhdCBxdWVyaWVzIHVzaW5nIG5hbWUgc2VsZWN0b3IgbXVzdCBzcGVjaWZ5IHJlYWQgc3RyYXRlZ3lcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmVkaWNhdGUucmVhZCwgJ3RoZSBub2RlIHNob3VsZCBoYXZlIGEgcHJlZGljYXRlJyk7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVhZEZyb21Ob2RlSW5qZWN0b3IoXG4gICAgICAgICAgICAgIG5vZGVJbmplY3RvciwgdE5vZGUsIGN1cnJlbnRWaWV3LCBwcmVkaWNhdGUucmVhZCAhLCBkaXJlY3RpdmVJZHgpO1xuICAgICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkTWF0Y2gocXVlcnk6IExRdWVyeTxhbnk+LCBtYXRjaGluZ1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgcXVlcnkudmFsdWVzLnB1c2gobWF0Y2hpbmdWYWx1ZSk7XG4gIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJlZGljYXRlPFQ+KFxuICAgIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD58IG51bGwpOiBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHByZWRpY2F0ZSk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogaXNBcnJheSA/IG51bGwgOiBwcmVkaWNhdGUgYXMgVHlwZTxUPixcbiAgICBzZWxlY3RvcjogaXNBcnJheSA/IHByZWRpY2F0ZSBhcyBzdHJpbmdbXSA6IG51bGwsXG4gICAgcmVhZDogcmVhZFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVRdWVyeTxUPihcbiAgICBwcmV2aW91czogTFF1ZXJ5PGFueT58IG51bGwsIHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58IHN0cmluZ1tdLFxuICAgIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD58IG51bGwpOiBMUXVlcnk8VD4ge1xuICByZXR1cm4ge1xuICAgIG5leHQ6IHByZXZpb3VzLFxuICAgIGxpc3Q6IHF1ZXJ5TGlzdCxcbiAgICBwcmVkaWNhdGU6IGNyZWF0ZVByZWRpY2F0ZShwcmVkaWNhdGUsIHJlYWQpLFxuICAgIHZhbHVlczogKHF1ZXJ5TGlzdCBhcyBhbnkgYXMgUXVlcnlMaXN0XzxUPikuX3ZhbHVlc1RyZWUsXG4gICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gIH07XG59XG5cbmNsYXNzIFF1ZXJ5TGlzdF88VD4vKiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfUXVlcnlMaXN0PFQ+ICovIHtcbiAgcmVhZG9ubHkgZGlydHkgPSB0cnVlO1xuICByZWFkb25seSBjaGFuZ2VzOiBPYnNlcnZhYmxlPFQ+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBwcml2YXRlIF92YWx1ZXM6IFRbXSA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIF92YWx1ZXNUcmVlOiBhbnlbXSA9IFtdO1xuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5sZW5ndGg7IH1cblxuICBnZXQgZmlyc3QoKTogVHxudWxsIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID8gdmFsdWVzWzBdIDogbnVsbDtcbiAgfVxuXG4gIGdldCBsYXN0KCk6IFR8bnVsbCB7XG4gICAgbGV0IHZhbHVlcyA9IHRoaXMuX3ZhbHVlcztcbiAgICByZXR1cm4gdmFsdWVzLmxlbmd0aCA/IHZhbHVlc1t2YWx1ZXMubGVuZ3RoIC0gMV0gOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkubWFwXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9tYXApXG4gICAqL1xuICBtYXA8VT4oZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVKTogVVtdIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5tYXAoZm4pOyB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZmlsdGVyXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maWx0ZXIpXG4gICAqL1xuICBmaWx0ZXIoZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogVFtdIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmZpbHRlcihmbik7XG4gIH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5maW5kXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maW5kKVxuICAgKi9cbiAgZmluZChmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBUfHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5maW5kKGZuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LnJlZHVjZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvcmVkdWNlKVxuICAgKi9cbiAgcmVkdWNlPFU+KGZuOiAocHJldlZhbHVlOiBVLCBjdXJWYWx1ZTogVCwgY3VySW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gVSwgaW5pdDogVSk6IFUge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMucmVkdWNlKGZuLCBpbml0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZvckVhY2hdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2gpXG4gICAqL1xuICBmb3JFYWNoKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl92YWx1ZXMuZm9yRWFjaChmbik7IH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5zb21lXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9zb21lKVxuICAgKi9cbiAgc29tZShmbjogKHZhbHVlOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5zb21lKGZuKTtcbiAgfVxuXG4gIHRvQXJyYXkoKTogVFtdIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy5zbGljZSgwKTsgfVxuXG4gIFtnZXRTeW1ib2xJdGVyYXRvcigpXSgpOiBJdGVyYXRvcjxUPiB7IHJldHVybiAodGhpcy5fdmFsdWVzIGFzIGFueSlbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTsgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLl92YWx1ZXMudG9TdHJpbmcoKTsgfVxuXG4gIHJlc2V0KHJlczogKGFueVtdfFQpW10pOiB2b2lkIHtcbiAgICB0aGlzLl92YWx1ZXMgPSBmbGF0dGVuKHJlcyk7XG4gICAgKHRoaXMgYXN7ZGlydHk6IGJvb2xlYW59KS5kaXJ0eSA9IGZhbHNlO1xuICB9XG5cbiAgbm90aWZ5T25DaGFuZ2VzKCk6IHZvaWQgeyAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS5lbWl0KHRoaXMpOyB9XG4gIHNldERpcnR5KCk6IHZvaWQgeyAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gdHJ1ZTsgfVxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLmNvbXBsZXRlKCk7XG4gICAgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikudW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG4vLyBOT1RFOiB0aGlzIGhhY2sgaXMgaGVyZSBiZWNhdXNlIElRdWVyeUxpc3QgaGFzIHByaXZhdGUgbWVtYmVycyBhbmQgdGhlcmVmb3JlXG4vLyBpdCBjYW4ndCBiZSBpbXBsZW1lbnRlZCBvbmx5IGV4dGVuZGVkLlxuZXhwb3J0IHR5cGUgUXVlcnlMaXN0PFQ+ID0gdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD47XG5leHBvcnQgY29uc3QgUXVlcnlMaXN0OiB0eXBlb2Ygdmlld0VuZ2luZV9RdWVyeUxpc3QgPSBRdWVyeUxpc3RfIGFzIGFueTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgUXVlcnlMaXN0LlxuICpcbiAqIEBwYXJhbSBtZW1vcnlJbmRleCBUaGUgaW5kZXggaW4gbWVtb3J5IHdoZXJlIHRoZSBRdWVyeUxpc3Qgc2hvdWxkIGJlIHNhdmVkLiBJZiBudWxsLFxuICogdGhpcyBpcyBpcyBhIGNvbnRlbnQgcXVlcnkgYW5kIHRoZSBRdWVyeUxpc3Qgd2lsbCBiZSBzYXZlZCBsYXRlciB0aHJvdWdoIGRpcmVjdGl2ZUNyZWF0ZS5cbiAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHR5cGUgZm9yIHdoaWNoIHRoZSBxdWVyeSB3aWxsIHNlYXJjaFxuICogQHBhcmFtIGRlc2NlbmQgV2hldGhlciBvciBub3QgdG8gZGVzY2VuZCBpbnRvIGNoaWxkcmVuXG4gKiBAcGFyYW0gcmVhZCBXaGF0IHRvIHNhdmUgaW4gdGhlIHF1ZXJ5XG4gKiBAcmV0dXJucyBRdWVyeUxpc3Q8VD5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXJ5PFQ+KFxuICAgIG1lbW9yeUluZGV4OiBudW1iZXIgfCBudWxsLCBwcmVkaWNhdGU6IFR5cGU8YW55Pnwgc3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgIHJlYWQ/OiBRdWVyeVJlYWRUeXBlPFQ+fCBUeXBlPFQ+KTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPigpO1xuICBjb25zdCBxdWVyaWVzID0gZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcyhMUXVlcmllc18pO1xuICBxdWVyaWVzLnRyYWNrKHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobnVsbCwgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG4gIGlmIChtZW1vcnlJbmRleCAhPSBudWxsKSB7XG4gICAgc3RvcmUobWVtb3J5SW5kZXgsIHF1ZXJ5TGlzdCk7XG4gIH1cbiAgcmV0dXJuIHF1ZXJ5TGlzdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0SW1wbCA9IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88YW55Pik7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkpIHtcbiAgICBxdWVyeUxpc3QucmVzZXQocXVlcnlMaXN0SW1wbC5fdmFsdWVzVHJlZSk7XG4gICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==