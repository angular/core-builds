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
export class ReadFromInjectorFn {
    constructor(read) {
        this.read = read;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQU05QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFMUMsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBRSxzQkFBc0IsRUFBRSx5QkFBeUIsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvSCxPQUFPLEVBQXVCLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3ZHLE9BQU8sRUFBWSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRixPQUFPLEVBQWtILDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVMLE9BQU8sRUFBMEIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDckcsT0FBTyxFQUFDLFVBQVUsRUFBYSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUUvRCxPQUFPLEVBQUMsT0FBTyxFQUFZLGtCQUFrQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRzdELE1BQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBNER0RSxNQUFNLE9BQU8sU0FBUztJQUNwQixZQUNXLE1BQXNCLEVBQVUsT0FBeUIsRUFDeEQsSUFBc0I7UUFEdkIsV0FBTSxHQUFOLE1BQU0sQ0FBZ0I7UUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFrQjtRQUN4RCxTQUFJLEdBQUosSUFBSSxDQUFrQjtJQUFHLENBQUM7SUFFdEMsS0FBSyxDQUNELFNBQWtDLEVBQUUsU0FBMkIsRUFBRSxPQUFpQixFQUNsRixJQUErQjtRQUNqQyxJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3RGO2FBQU07WUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM1RjtJQUNILENBQUM7SUFFRCxLQUFLLEtBQWUsT0FBTyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbEUsU0FBUztRQUNQLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1RCxNQUFNLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdEQsT0FBTyxjQUFjLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDakcsQ0FBQztJQUVELFVBQVU7UUFDUixNQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkQsTUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWpELE9BQU8sY0FBYyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2pHLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYTtRQUN0QixVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsT0FBTyxDQUFDLEtBQXdEO1FBQzlELEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLElBQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDN0IsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFekIsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDcEQsa0VBQWtFO2dCQUNsRSwyREFBMkQ7Z0JBQzNELEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBUSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQzthQUNuQztZQUNELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztTQUNwQjtRQUVELGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELFVBQVU7UUFDUixVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pCLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsQ0FBQztDQUNGO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxLQUFZO0lBQ3JDLE9BQU8sS0FBSyxDQUFDLE1BQU0sS0FBSyxJQUFJLElBQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25FLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUFDLEtBQXdCO0lBQ3RELElBQUksTUFBTSxHQUFxQixJQUFJLENBQUM7SUFFcEMsT0FBTyxLQUFLLEVBQUU7UUFDWixNQUFNLGVBQWUsR0FBVSxFQUFFLENBQUMsQ0FBRSx5QkFBeUI7UUFDN0QsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkMsTUFBTSxXQUFXLEdBQWdCO1lBQy9CLElBQUksRUFBRSxNQUFNO1lBQ1osSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUztZQUMxQixNQUFNLEVBQUUsZUFBZTtZQUN2QixlQUFlLEVBQUUsSUFBSTtTQUN0QixDQUFDO1FBQ0YsTUFBTSxHQUFHLFdBQVcsQ0FBQztRQUNyQixLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztLQUNwQjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQXdCO0lBQ2pELElBQUksTUFBTSxHQUFxQixJQUFJLENBQUM7SUFFcEMsT0FBTyxLQUFLLEVBQUU7UUFDWixNQUFNLFdBQVcsR0FBZ0I7WUFDL0IsSUFBSSxFQUFFLE1BQU07WUFDWixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7WUFDaEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO1lBQzFCLE1BQU0sRUFBRSxFQUFFO1lBQ1YsZUFBZSxFQUFFLEtBQUssQ0FBQyxNQUFNO1NBQzlCLENBQUM7UUFDRixNQUFNLEdBQUcsV0FBVyxDQUFDO1FBQ3JCLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0tBQ3BCO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEtBQWEsRUFBRSxLQUF3QjtJQUN6RCxPQUFPLEtBQUssRUFBRTtRQUNaLFNBQVM7WUFDTCxhQUFhLENBQ1QsS0FBSyxDQUFDLGVBQWUsRUFBRSwwREFBMEQsQ0FBQyxDQUFDO1FBQzNGLEtBQUssQ0FBQyxlQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2RCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztLQUNwQjtBQUNILENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxLQUF3QjtJQUMxQyxPQUFPLEtBQUssRUFBRTtRQUNaLFNBQVM7WUFDTCxhQUFhLENBQ1QsS0FBSyxDQUFDLGVBQWUsRUFBRSwwREFBMEQsQ0FBQyxDQUFDO1FBRTNGLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFpQixDQUFDO1FBQ2hELE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVELE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXpELGtFQUFrRTtRQUNsRSxTQUFTLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDOUQsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFO1lBQ3JCLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7U0FDdkI7UUFFRCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztLQUNwQjtBQUNILENBQUM7QUFHRDs7Ozs7OztHQU9HO0FBQ0gsU0FBUyx3QkFBd0IsQ0FBQyxLQUFZLEVBQUUsUUFBZ0I7SUFDOUQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztJQUNwQyxJQUFJLFVBQVUsRUFBRTtRQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0MsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUM5QixPQUFPLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFXLENBQUM7YUFDcEM7U0FDRjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILFNBQVMseUJBQXlCLENBQUMsS0FBWSxFQUFFLFdBQXNCLEVBQUUsSUFBZTtJQUV0RixNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDO0lBQzNDLElBQUksSUFBSSxFQUFFO1FBQ1IsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUMxQixNQUFNLEtBQUssR0FBRyxLQUFLLGdDQUFnQyxDQUFDO1FBQ3BELE1BQU0sS0FBSyxHQUFHLEtBQUssd0NBQTBDLENBQUM7UUFDOUQsTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUMxQixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQThCLENBQUM7WUFDakQsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFO2dCQUNyQyxPQUFPLENBQUMsQ0FBQzthQUNWO1NBQ0Y7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQ3pCLEtBQVksRUFBRSxXQUFzQixFQUFFLElBQW1DLEVBQ3pFLFlBQW9CO0lBQ3RCLElBQUksSUFBSSxZQUFZLGtCQUFrQixFQUFFO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ3BEO1NBQU07UUFDTCxNQUFNLFdBQVcsR0FBRyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQWlCLENBQUMsQ0FBQztRQUNyRixJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7WUFDeEIsT0FBTyxXQUFXLENBQUMsVUFBVSxDQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDL0M7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQVMsR0FBRyxDQUNSLEtBQXdCLEVBQUUsS0FBNEQ7SUFDeEYsTUFBTSxXQUFXLEdBQUcsWUFBWSxFQUFFLENBQUM7SUFFbkMsT0FBTyxLQUFLLEVBQUU7UUFDWixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQ2xDLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDNUIsSUFBSSxJQUFJLEVBQUU7WUFDUixNQUFNLFlBQVksR0FBRyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pFLElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtnQkFDekIsMERBQTBEO2dCQUMxRCwyRUFBMkU7Z0JBQzNFLE1BQU0sTUFBTSxHQUNSLG9CQUFvQixDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ25GLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtvQkFDbkIsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDekI7YUFDRjtTQUNGO2FBQU07WUFDTCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsUUFBVSxDQUFDO1lBQ3RDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN4QyxNQUFNLFlBQVksR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtvQkFDekIsMERBQTBEO29CQUMxRCxtRUFBbUU7b0JBQ25FLFNBQVMsSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO29CQUMvRSxNQUFNLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxJQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQ3hGLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTt3QkFDbkIsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztxQkFDekI7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7S0FDcEI7QUFDSCxDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsS0FBa0IsRUFBRSxhQUFrQjtJQUN0RCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNqQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FDcEIsU0FBNEIsRUFBRSxJQUFxQztJQUNyRSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3pDLE9BQU87UUFDTCxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQW9CO1FBQzNDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFDaEQsSUFBSSxFQUFFLElBQUk7S0FDWCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsV0FBVyxDQUNoQixRQUEyQixFQUFFLFNBQXVCLEVBQUUsU0FBNEIsRUFDbEYsSUFBcUM7SUFDdkMsT0FBTztRQUNMLElBQUksRUFBRSxRQUFRO1FBQ2QsSUFBSSxFQUFFLFNBQVM7UUFDZixTQUFTLEVBQUUsZUFBZSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUM7UUFDM0MsTUFBTSxFQUFHLFNBQWtDLENBQUMsV0FBVztRQUN2RCxlQUFlLEVBQUUsSUFBSTtLQUN0QixDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sVUFBVTtJQUFoQjtRQUNXLFVBQUssR0FBRyxJQUFJLENBQUM7UUFDYixZQUFPLEdBQWtCLElBQUksWUFBWSxFQUFFLENBQUM7UUFDN0MsWUFBTyxHQUFRLEVBQUUsQ0FBQztRQUMxQixnQkFBZ0I7UUFDaEIsZ0JBQVcsR0FBVSxFQUFFLENBQUM7SUEyRTFCLENBQUM7SUF6RUMsSUFBSSxNQUFNLEtBQWEsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFcEQsSUFBSSxLQUFLO1FBQ1AsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUMxQixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQzFDLENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzFCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUMxRCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsR0FBRyxDQUFJLEVBQTZDLElBQVMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFM0Y7OztPQUdHO0lBQ0gsTUFBTSxDQUFDLEVBQW1EO1FBQ3hELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksQ0FBQyxFQUFtRDtRQUN0RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUksRUFBa0UsRUFBRSxJQUFPO1FBQ25GLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxPQUFPLENBQUMsRUFBZ0QsSUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFN0Y7OztPQUdHO0lBQ0gsSUFBSSxDQUFDLEVBQW9EO1FBQ3ZELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELE9BQU8sS0FBVSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVoRCxDQUFDLGlCQUFpQixFQUFFLENBQUMsS0FBa0IsT0FBUSxJQUFJLENBQUMsT0FBZSxDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU3RixRQUFRLEtBQWEsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV0RCxLQUFLLENBQUMsR0FBZ0I7UUFDcEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsSUFBd0IsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQzFDLENBQUM7SUFFRCxlQUFlLEtBQVksSUFBSSxDQUFDLE9BQTZCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRSxRQUFRLEtBQVksSUFBd0IsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM1RCxPQUFPO1FBQ0osSUFBSSxDQUFDLE9BQTZCLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsSUFBSSxDQUFDLE9BQTZCLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDcEQsQ0FBQztDQUNGO0FBS0QsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFnQyxVQUFpQixDQUFDO0FBRXhFOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxLQUFLLENBQ2pCLFdBQTBCLEVBQUUsU0FBOEIsRUFBRSxPQUFpQixFQUM3RSxJQUFnQztJQUNsQyxTQUFTLElBQUksc0JBQXNCLEVBQUUsQ0FBQztJQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJLFNBQVMsRUFBSyxDQUFDO0lBQ3JDLE1BQU0sT0FBTyxHQUFHLHlCQUF5QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbkQsdUJBQXVCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUQsSUFBSSxXQUFXLElBQUksSUFBSSxFQUFFO1FBQ3ZCLEtBQUssQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDL0I7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsU0FBeUI7SUFDcEQsTUFBTSxhQUFhLEdBQUksU0FBb0MsQ0FBQztJQUM1RCxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUU7UUFDbkIsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0MsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzVCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxNQUFNLE9BQU8sa0JBQWtCO0lBQzdCLFlBQXFCLElBQW1FO1FBQW5FLFNBQUksR0FBSixJQUFJLENBQStEO0lBQUcsQ0FBQztDQUM3RiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICcuLi9ldmVudF9lbWl0dGVyJztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1F1ZXJ5TGlzdCBhcyB2aWV3RW5naW5lX1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyBWaWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyBWaWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7Z2V0U3ltYm9sSXRlcmF0b3J9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge19nZXRWaWV3RGF0YSwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcywgc3RvcmUsIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkludGVybmFsLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3RvciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCBRdWVyeVJlYWRUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtESVJFQ1RJVkVTLCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtmbGF0dGVuLCBnZXRMTm9kZSwgaXNDb250ZW50UXVlcnlIb3N0fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtjcmVhdGVDb250YWluZXJSZWYsIGNyZWF0ZUVsZW1lbnRSZWYsIGNyZWF0ZVRlbXBsYXRlUmVmfSBmcm9tICcuL3ZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHknO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQ7XG5cbi8qKlxuICogQSBwcmVkaWNhdGUgd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAqIHJlc3VsdHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnlQcmVkaWNhdGU8VD4ge1xuICAvKipcbiAgICogSWYgbG9va2luZyBmb3IgZGlyZWN0aXZlcyB0aGVuIGl0IGNvbnRhaW5zIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgICovXG4gIHR5cGU6IFR5cGU8VD58bnVsbDtcblxuICAvKipcbiAgICogSWYgc2VsZWN0b3IgdGhlbiBjb250YWlucyBsb2NhbCBuYW1lcyB0byBxdWVyeSBmb3IuXG4gICAqL1xuICBzZWxlY3Rvcjogc3RyaW5nW118bnVsbDtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoaWNoIHRva2VuIHNob3VsZCBiZSByZWFkIGZyb20gREkgZm9yIHRoaXMgcXVlcnkuXG4gICAqL1xuICByZWFkOiBRdWVyeVJlYWRUeXBlPFQ+fFR5cGU8VD58bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBvYmplY3QgcmVwcmVzZW50aW5nIGEgcXVlcnksIHdoaWNoIGlzIGEgY29tYmluYXRpb24gb2Y6XG4gKiAtIHF1ZXJ5IHByZWRpY2F0ZSB0byBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogLSB2YWx1ZXMgY29sbGVjdGVkIGJhc2VkIG9uIGEgcHJlZGljYXRlXG4gKiAtIGBRdWVyeUxpc3RgIHRvIHdoaWNoIGNvbGxlY3RlZCB2YWx1ZXMgc2hvdWxkIGJlIHJlcG9ydGVkXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFF1ZXJ5PFQ+IHtcbiAgLyoqXG4gICAqIE5leHQgcXVlcnkuIFVzZWQgd2hlbiBxdWVyaWVzIGFyZSBzdG9yZWQgYXMgYSBsaW5rZWQgbGlzdCBpbiBgTFF1ZXJpZXNgLlxuICAgKi9cbiAgbmV4dDogTFF1ZXJ5PGFueT58bnVsbDtcblxuICAvKipcbiAgICogRGVzdGluYXRpb24gdG8gd2hpY2ggdGhlIHZhbHVlIHNob3VsZCBiZSBhZGRlZC5cbiAgICovXG4gIGxpc3Q6IFF1ZXJ5TGlzdDxUPjtcblxuICAvKipcbiAgICogQSBwcmVkaWNhdGUgd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAgICogcmVzdWx0cy5cbiAgICovXG4gIHByZWRpY2F0ZTogUXVlcnlQcmVkaWNhdGU8VD47XG5cbiAgLyoqXG4gICAqIFZhbHVlcyB3aGljaCBoYXZlIGJlZW4gbG9jYXRlZC5cbiAgICpcbiAgICogVGhpcyBpcyB3aGF0IGJ1aWxkcyB1cCB0aGUgYFF1ZXJ5TGlzdC5fdmFsdWVzVHJlZWAuXG4gICAqL1xuICB2YWx1ZXM6IGFueVtdO1xuXG4gIC8qKlxuICAgKiBBIHBvaW50ZXIgdG8gYW4gYXJyYXkgdGhhdCBzdG9yZXMgY29sbGVjdGVkIHZhbHVlcyBmcm9tIHZpZXdzLiBUaGlzIGlzIG5lY2Vzc2FyeSBzbyB3ZSBrbm93IGFcbiAgICogY29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IG5vZGVzIGNvbGxlY3RlZCBmcm9tIHZpZXdzLlxuICAgKi9cbiAgY29udGFpbmVyVmFsdWVzOiBhbnlbXXxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgTFF1ZXJpZXNfIGltcGxlbWVudHMgTFF1ZXJpZXMge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBwYXJlbnQ6IExRdWVyaWVzX3xudWxsLCBwcml2YXRlIHNoYWxsb3c6IExRdWVyeTxhbnk+fG51bGwsXG4gICAgICBwcml2YXRlIGRlZXA6IExRdWVyeTxhbnk+fG51bGwpIHt9XG5cbiAgdHJhY2s8VD4oXG4gICAgICBxdWVyeUxpc3Q6IHZpZXdFbmdpbmVfUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58c3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgICAgcmVhZD86IFF1ZXJ5UmVhZFR5cGU8VD58VHlwZTxUPik6IHZvaWQge1xuICAgIGlmIChkZXNjZW5kKSB7XG4gICAgICB0aGlzLmRlZXAgPSBjcmVhdGVRdWVyeSh0aGlzLmRlZXAsIHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCByZWFkICE9IG51bGwgPyByZWFkIDogbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hhbGxvdyA9IGNyZWF0ZVF1ZXJ5KHRoaXMuc2hhbGxvdywgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9XG4gIH1cblxuICBjbG9uZSgpOiBMUXVlcmllcyB7IHJldHVybiBuZXcgTFF1ZXJpZXNfKHRoaXMsIG51bGwsIHRoaXMuZGVlcCk7IH1cblxuICBjb250YWluZXIoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3Qgc2hhbGxvd1Jlc3VsdHMgPSBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHRoaXMuc2hhbGxvdyk7XG4gICAgY29uc3QgZGVlcFJlc3VsdHMgPSBjb3B5UXVlcmllc1RvQ29udGFpbmVyKHRoaXMuZGVlcCk7XG5cbiAgICByZXR1cm4gc2hhbGxvd1Jlc3VsdHMgfHwgZGVlcFJlc3VsdHMgPyBuZXcgTFF1ZXJpZXNfKHRoaXMsIHNoYWxsb3dSZXN1bHRzLCBkZWVwUmVzdWx0cykgOiBudWxsO1xuICB9XG5cbiAgY3JlYXRlVmlldygpOiBMUXVlcmllc3xudWxsIHtcbiAgICBjb25zdCBzaGFsbG93UmVzdWx0cyA9IGNvcHlRdWVyaWVzVG9WaWV3KHRoaXMuc2hhbGxvdyk7XG4gICAgY29uc3QgZGVlcFJlc3VsdHMgPSBjb3B5UXVlcmllc1RvVmlldyh0aGlzLmRlZXApO1xuXG4gICAgcmV0dXJuIHNoYWxsb3dSZXN1bHRzIHx8IGRlZXBSZXN1bHRzID8gbmV3IExRdWVyaWVzXyh0aGlzLCBzaGFsbG93UmVzdWx0cywgZGVlcFJlc3VsdHMpIDogbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGluc2VydFZpZXcoaW5kZXgsIHRoaXMuc2hhbGxvdyk7XG4gICAgaW5zZXJ0VmlldyhpbmRleCwgdGhpcy5kZWVwKTtcbiAgfVxuXG4gIGFkZE5vZGUodE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpOiBMUXVlcmllc3xudWxsIHtcbiAgICBhZGQodGhpcy5kZWVwLCB0Tm9kZSk7XG5cbiAgICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgICAgYWRkKHRoaXMuc2hhbGxvdywgdE5vZGUpO1xuXG4gICAgICBpZiAodE5vZGUucGFyZW50ICYmIGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZS5wYXJlbnQpKSB7XG4gICAgICAgIC8vIGlmIG5vZGUgaGFzIGEgY29udGVudCBxdWVyeSBhbmQgcGFyZW50IGFsc28gaGFzIGEgY29udGVudCBxdWVyeVxuICAgICAgICAvLyBib3RoIHF1ZXJpZXMgbmVlZCB0byBjaGVjayB0aGlzIG5vZGUgZm9yIHNoYWxsb3cgbWF0Y2hlc1xuICAgICAgICBhZGQodGhpcy5wYXJlbnQgIS5zaGFsbG93LCB0Tm9kZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5wYXJlbnQ7XG4gICAgfVxuXG4gICAgaXNSb290Tm9kZU9mUXVlcnkodE5vZGUpICYmIGFkZCh0aGlzLnNoYWxsb3csIHROb2RlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZVZpZXcoKTogdm9pZCB7XG4gICAgcmVtb3ZlVmlldyh0aGlzLnNoYWxsb3cpO1xuICAgIHJlbW92ZVZpZXcodGhpcy5kZWVwKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1Jvb3ROb2RlT2ZRdWVyeSh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuIHROb2RlLnBhcmVudCA9PT0gbnVsbCB8fCBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUucGFyZW50KTtcbn1cblxuZnVuY3Rpb24gY29weVF1ZXJpZXNUb0NvbnRhaW5lcihxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwpOiBMUXVlcnk8YW55PnxudWxsIHtcbiAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgY29udGFpbmVyVmFsdWVzOiBhbnlbXSA9IFtdOyAgLy8gcHJlcGFyZSByb29tIGZvciB2aWV3c1xuICAgIHF1ZXJ5LnZhbHVlcy5wdXNoKGNvbnRhaW5lclZhbHVlcyk7XG4gICAgY29uc3QgY2xvbmVkUXVlcnk6IExRdWVyeTxhbnk+ID0ge1xuICAgICAgbmV4dDogcmVzdWx0LFxuICAgICAgbGlzdDogcXVlcnkubGlzdCxcbiAgICAgIHByZWRpY2F0ZTogcXVlcnkucHJlZGljYXRlLFxuICAgICAgdmFsdWVzOiBjb250YWluZXJWYWx1ZXMsXG4gICAgICBjb250YWluZXJWYWx1ZXM6IG51bGxcbiAgICB9O1xuICAgIHJlc3VsdCA9IGNsb25lZFF1ZXJ5O1xuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGNvcHlRdWVyaWVzVG9WaWV3KHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCk6IExRdWVyeTxhbnk+fG51bGwge1xuICBsZXQgcmVzdWx0OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcblxuICB3aGlsZSAocXVlcnkpIHtcbiAgICBjb25zdCBjbG9uZWRRdWVyeTogTFF1ZXJ5PGFueT4gPSB7XG4gICAgICBuZXh0OiByZXN1bHQsXG4gICAgICBsaXN0OiBxdWVyeS5saXN0LFxuICAgICAgcHJlZGljYXRlOiBxdWVyeS5wcmVkaWNhdGUsXG4gICAgICB2YWx1ZXM6IFtdLFxuICAgICAgY29udGFpbmVyVmFsdWVzOiBxdWVyeS52YWx1ZXNcbiAgICB9O1xuICAgIHJlc3VsdCA9IGNsb25lZFF1ZXJ5O1xuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGluc2VydFZpZXcoaW5kZXg6IG51bWJlciwgcXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKSB7XG4gIHdoaWxlIChxdWVyeSkge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgcXVlcnkuY29udGFpbmVyVmFsdWVzLCAnVmlldyBxdWVyaWVzIG5lZWQgdG8gaGF2ZSBhIHBvaW50ZXIgdG8gY29udGFpbmVyIHZhbHVlcy4nKTtcbiAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMgIS5zcGxpY2UoaW5kZXgsIDAsIHF1ZXJ5LnZhbHVlcyk7XG4gICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVZpZXcocXVlcnk6IExRdWVyeTxhbnk+fCBudWxsKSB7XG4gIHdoaWxlIChxdWVyeSkge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgcXVlcnkuY29udGFpbmVyVmFsdWVzLCAnVmlldyBxdWVyaWVzIG5lZWQgdG8gaGF2ZSBhIHBvaW50ZXIgdG8gY29udGFpbmVyIHZhbHVlcy4nKTtcblxuICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlcyA9IHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhO1xuICAgIGNvbnN0IHZpZXdWYWx1ZXNJZHggPSBjb250YWluZXJWYWx1ZXMuaW5kZXhPZihxdWVyeS52YWx1ZXMpO1xuICAgIGNvbnN0IHJlbW92ZWQgPSBjb250YWluZXJWYWx1ZXMuc3BsaWNlKHZpZXdWYWx1ZXNJZHgsIDEpO1xuXG4gICAgLy8gbWFyayBhIHF1ZXJ5IGFzIGRpcnR5IG9ubHkgd2hlbiByZW1vdmVkIHZpZXcgaGFkIG1hdGNoaW5nIG1vZGVzXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHJlbW92ZWQubGVuZ3RoLCAxLCAncmVtb3ZlZC5sZW5ndGgnKTtcbiAgICBpZiAocmVtb3ZlZFswXS5sZW5ndGgpIHtcbiAgICAgIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbiAgICB9XG5cbiAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gIH1cbn1cblxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgbG9jYWwgbmFtZXMgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgcmV0dXJucyBkaXJlY3RpdmUgaW5kZXhcbiAqIChvciAtMSBpZiBhIGxvY2FsIG5hbWUgcG9pbnRzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBzdGF0aWMgZGF0YSBvZiBhIG5vZGUgdG8gY2hlY2tcbiAqIEBwYXJhbSBzZWxlY3RvciBzZWxlY3RvciB0byBtYXRjaFxuICogQHJldHVybnMgZGlyZWN0aXZlIGluZGV4LCAtMSBvciBudWxsIGlmIGEgc2VsZWN0b3IgZGlkbid0IG1hdGNoIGFueSBvZiB0aGUgbG9jYWwgbmFtZXNcbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAobG9jYWxOYW1lc1tpXSA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgdGhlIGRpcmVjdGl2ZXMgZm9yIGEgbm9kZSBhbmQgcmV0dXJucyBpbmRleCBvZiBhIGRpcmVjdGl2ZSBmb3IgYSBnaXZlbiB0eXBlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUTm9kZSBvbiB3aGljaCBkaXJlY3RpdmVzIGFyZSBwcmVzZW50LlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSB2aWV3IHdlIGFyZSBjdXJyZW50bHkgcHJvY2Vzc2luZ1xuICogQHBhcmFtIHR5cGUgVHlwZSBvZiBhIGRpcmVjdGl2ZSB0byBsb29rIGZvci5cbiAqIEByZXR1cm5zIEluZGV4IG9mIGEgZm91bmQgZGlyZWN0aXZlIG9yIG51bGwgd2hlbiBub25lIGZvdW5kLlxuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nRGlyZWN0aXZlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSwgdHlwZTogVHlwZTxhbnk+KTogbnVtYmVyfFxuICAgIG51bGwge1xuICBjb25zdCBkZWZzID0gY3VycmVudFZpZXdbVFZJRVddLmRpcmVjdGl2ZXM7XG4gIGlmIChkZWZzKSB7XG4gICAgY29uc3QgZmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgICBjb25zdCBjb3VudCA9IGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gICAgY29uc3Qgc3RhcnQgPSBmbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBpZiAoZGVmLnR5cGUgPT09IHR5cGUgJiYgZGVmLmRpUHVibGljKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVhZEZyb21Ob2RlSW5qZWN0b3IoXG4gICAgdE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLCByZWFkOiBRdWVyeVJlYWRUeXBlPGFueT58IFR5cGU8YW55PixcbiAgICBkaXJlY3RpdmVJZHg6IG51bWJlcik6IGFueSB7XG4gIGlmIChyZWFkIGluc3RhbmNlb2YgUmVhZEZyb21JbmplY3RvckZuKSB7XG4gICAgcmV0dXJuIHJlYWQucmVhZCh0Tm9kZSwgY3VycmVudFZpZXcsIGRpcmVjdGl2ZUlkeCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbWF0Y2hpbmdJZHggPSBnZXRJZHhPZk1hdGNoaW5nRGlyZWN0aXZlKHROb2RlLCBjdXJyZW50VmlldywgcmVhZCBhcyBUeXBlPGFueT4pO1xuICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGN1cnJlbnRWaWV3W0RJUkVDVElWRVNdICFbbWF0Y2hpbmdJZHhdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gYWRkKFxuICAgIHF1ZXJ5OiBMUXVlcnk8YW55PnwgbnVsbCwgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlKSB7XG4gIGNvbnN0IGN1cnJlbnRWaWV3ID0gX2dldFZpZXdEYXRhKCk7XG5cbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gcXVlcnkucHJlZGljYXRlO1xuICAgIGNvbnN0IHR5cGUgPSBwcmVkaWNhdGUudHlwZTtcbiAgICBpZiAodHlwZSkge1xuICAgICAgY29uc3QgZGlyZWN0aXZlSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZSh0Tm9kZSwgY3VycmVudFZpZXcsIHR5cGUpO1xuICAgICAgaWYgKGRpcmVjdGl2ZUlkeCAhPT0gbnVsbCkge1xuICAgICAgICAvLyBhIG5vZGUgaXMgbWF0Y2hpbmcgYSBwcmVkaWNhdGUgLSBkZXRlcm1pbmUgd2hhdCB0byByZWFkXG4gICAgICAgIC8vIGlmIHJlYWQgdG9rZW4gYW5kIC8gb3Igc3RyYXRlZ3kgaXMgbm90IHNwZWNpZmllZCwgdXNlIHR5cGUgYXMgcmVhZCB0b2tlblxuICAgICAgICBjb25zdCByZXN1bHQgPVxuICAgICAgICAgICAgcmVhZEZyb21Ob2RlSW5qZWN0b3IodE5vZGUsIGN1cnJlbnRWaWV3LCBwcmVkaWNhdGUucmVhZCB8fCB0eXBlLCBkaXJlY3RpdmVJZHgpO1xuICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc2VsZWN0b3IgPSBwcmVkaWNhdGUuc2VsZWN0b3IgITtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSk7XG4gICAgICAgIGlmIChkaXJlY3RpdmVJZHggIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBhIG5vZGUgaXMgbWF0Y2hpbmcgYSBwcmVkaWNhdGUgLSBkZXRlcm1pbmUgd2hhdCB0byByZWFkXG4gICAgICAgICAgLy8gbm90ZSB0aGF0IHF1ZXJpZXMgdXNpbmcgbmFtZSBzZWxlY3RvciBtdXN0IHNwZWNpZnkgcmVhZCBzdHJhdGVneVxuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZWRpY2F0ZS5yZWFkLCAndGhlIG5vZGUgc2hvdWxkIGhhdmUgYSBwcmVkaWNhdGUnKTtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSByZWFkRnJvbU5vZGVJbmplY3Rvcih0Tm9kZSwgY3VycmVudFZpZXcsIHByZWRpY2F0ZS5yZWFkICEsIGRpcmVjdGl2ZUlkeCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRNYXRjaChxdWVyeTogTFF1ZXJ5PGFueT4sIG1hdGNoaW5nVmFsdWU6IGFueSk6IHZvaWQge1xuICBxdWVyeS52YWx1ZXMucHVzaChtYXRjaGluZ1ZhbHVlKTtcbiAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcmVkaWNhdGU8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSwgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnwgVHlwZTxUPnwgbnVsbCk6IFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkocHJlZGljYXRlKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBpc0FycmF5ID8gbnVsbCA6IHByZWRpY2F0ZSBhcyBUeXBlPFQ+LFxuICAgIHNlbGVjdG9yOiBpc0FycmF5ID8gcHJlZGljYXRlIGFzIHN0cmluZ1tdIDogbnVsbCxcbiAgICByZWFkOiByZWFkXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5PFQ+KFxuICAgIHByZXZpb3VzOiBMUXVlcnk8YW55PnwgbnVsbCwgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sXG4gICAgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnwgVHlwZTxUPnwgbnVsbCk6IExRdWVyeTxUPiB7XG4gIHJldHVybiB7XG4gICAgbmV4dDogcHJldmlvdXMsXG4gICAgbGlzdDogcXVlcnlMaXN0LFxuICAgIHByZWRpY2F0ZTogY3JlYXRlUHJlZGljYXRlKHByZWRpY2F0ZSwgcmVhZCksXG4gICAgdmFsdWVzOiAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPFQ+KS5fdmFsdWVzVHJlZSxcbiAgICBjb250YWluZXJWYWx1ZXM6IG51bGxcbiAgfTtcbn1cblxuY2xhc3MgUXVlcnlMaXN0XzxUPi8qIGltcGxlbWVudHMgdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD4gKi8ge1xuICByZWFkb25seSBkaXJ0eSA9IHRydWU7XG4gIHJlYWRvbmx5IGNoYW5nZXM6IE9ic2VydmFibGU8VD4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHByaXZhdGUgX3ZhbHVlczogVFtdID0gW107XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ZhbHVlc1RyZWU6IGFueVtdID0gW107XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmFsdWVzLmxlbmd0aDsgfVxuXG4gIGdldCBmaXJzdCgpOiBUfG51bGwge1xuICAgIGxldCB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgcmV0dXJuIHZhbHVlcy5sZW5ndGggPyB2YWx1ZXNbMF0gOiBudWxsO1xuICB9XG5cbiAgZ2V0IGxhc3QoKTogVHxudWxsIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID8gdmFsdWVzW3ZhbHVlcy5sZW5ndGggLSAxXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5tYXBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L21hcClcbiAgICovXG4gIG1hcDxVPihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IFUpOiBVW10geyByZXR1cm4gdGhpcy5fdmFsdWVzLm1hcChmbik7IH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5maWx0ZXJdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbHRlcilcbiAgICovXG4gIGZpbHRlcihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBUW10ge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMuZmlsdGVyKGZuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZpbmRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbmQpXG4gICAqL1xuICBmaW5kKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gYm9vbGVhbik6IFR8dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmZpbmQoZm4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkucmVkdWNlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9yZWR1Y2UpXG4gICAqL1xuICByZWR1Y2U8VT4oZm46IChwcmV2VmFsdWU6IFUsIGN1clZhbHVlOiBULCBjdXJJbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVLCBpbml0OiBVKTogVSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5yZWR1Y2UoZm4sIGluaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZm9yRWFjaF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZm9yRWFjaClcbiAgICovXG4gIGZvckVhY2goZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX3ZhbHVlcy5mb3JFYWNoKGZuKTsgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LnNvbWVdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L3NvbWUpXG4gICAqL1xuICBzb21lKGZuOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLnNvbWUoZm4pO1xuICB9XG5cbiAgdG9BcnJheSgpOiBUW10geyByZXR1cm4gdGhpcy5fdmFsdWVzLnNsaWNlKDApOyB9XG5cbiAgW2dldFN5bWJvbEl0ZXJhdG9yKCldKCk6IEl0ZXJhdG9yPFQ+IHsgcmV0dXJuICh0aGlzLl92YWx1ZXMgYXMgYW55KVtnZXRTeW1ib2xJdGVyYXRvcigpXSgpOyB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy50b1N0cmluZygpOyB9XG5cbiAgcmVzZXQocmVzOiAoYW55W118VClbXSk6IHZvaWQge1xuICAgIHRoaXMuX3ZhbHVlcyA9IGZsYXR0ZW4ocmVzKTtcbiAgICAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gZmFsc2U7XG4gIH1cblxuICBub3RpZnlPbkNoYW5nZXMoKTogdm9pZCB7ICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLmVtaXQodGhpcyk7IH1cbiAgc2V0RGlydHkoKTogdm9pZCB7ICh0aGlzIGFze2RpcnR5OiBib29sZWFufSkuZGlydHkgPSB0cnVlOyB9XG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikuY29tcGxldGUoKTtcbiAgICAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbi8vIE5PVEU6IHRoaXMgaGFjayBpcyBoZXJlIGJlY2F1c2UgSVF1ZXJ5TGlzdCBoYXMgcHJpdmF0ZSBtZW1iZXJzIGFuZCB0aGVyZWZvcmVcbi8vIGl0IGNhbid0IGJlIGltcGxlbWVudGVkIG9ubHkgZXh0ZW5kZWQuXG5leHBvcnQgdHlwZSBRdWVyeUxpc3Q8VD4gPSB2aWV3RW5naW5lX1F1ZXJ5TGlzdDxUPjtcbmV4cG9ydCBjb25zdCBRdWVyeUxpc3Q6IHR5cGVvZiB2aWV3RW5naW5lX1F1ZXJ5TGlzdCA9IFF1ZXJ5TGlzdF8gYXMgYW55O1xuXG4vKipcbiAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBRdWVyeUxpc3QuXG4gKlxuICogQHBhcmFtIG1lbW9yeUluZGV4IFRoZSBpbmRleCBpbiBtZW1vcnkgd2hlcmUgdGhlIFF1ZXJ5TGlzdCBzaG91bGQgYmUgc2F2ZWQuIElmIG51bGwsXG4gKiB0aGlzIGlzIGlzIGEgY29udGVudCBxdWVyeSBhbmQgdGhlIFF1ZXJ5TGlzdCB3aWxsIGJlIHNhdmVkIGxhdGVyIHRocm91Z2ggZGlyZWN0aXZlQ3JlYXRlLlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnk8VD4oXG4gICAgbWVtb3J5SW5kZXg6IG51bWJlciB8IG51bGwsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgcmVhZD86IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD4pOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KCk7XG4gIGNvbnN0IHF1ZXJpZXMgPSBnZXRPckNyZWF0ZUN1cnJlbnRRdWVyaWVzKExRdWVyaWVzXyk7XG4gIHF1ZXJpZXMudHJhY2socXVlcnlMaXN0LCBwcmVkaWNhdGUsIGRlc2NlbmQsIHJlYWQpO1xuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChudWxsLCBxdWVyeUxpc3QsIHF1ZXJ5TGlzdC5kZXN0cm95KTtcbiAgaWYgKG1lbW9yeUluZGV4ICE9IG51bGwpIHtcbiAgICBzdG9yZShtZW1vcnlJbmRleCwgcXVlcnlMaXN0KTtcbiAgfVxuICByZXR1cm4gcXVlcnlMaXN0O1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhIHF1ZXJ5IGJ5IGNvbWJpbmluZyBtYXRjaGVzIGZyb20gYWxsIGFjdGl2ZSB2aWV3cyBhbmQgcmVtb3ZpbmcgbWF0Y2hlcyBmcm9tIGRlbGV0ZWRcbiAqIHZpZXdzLlxuICogUmV0dXJucyB0cnVlIGlmIGEgcXVlcnkgZ290IGRpcnR5IGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWVyeVJlZnJlc2gocXVlcnlMaXN0OiBRdWVyeUxpc3Q8YW55Pik6IGJvb2xlYW4ge1xuICBjb25zdCBxdWVyeUxpc3RJbXBsID0gKHF1ZXJ5TGlzdCBhcyBhbnkgYXMgUXVlcnlMaXN0Xzxhbnk+KTtcbiAgaWYgKHF1ZXJ5TGlzdC5kaXJ0eSkge1xuICAgIHF1ZXJ5TGlzdC5yZXNldChxdWVyeUxpc3RJbXBsLl92YWx1ZXNUcmVlKTtcbiAgICBxdWVyeUxpc3Qubm90aWZ5T25DaGFuZ2VzKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgY2xhc3MgUmVhZEZyb21JbmplY3RvckZuPFQ+IHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcmVhZDogKHROb2RlOiBUTm9kZSwgdmlldzogTFZpZXdEYXRhLCBkaXJlY3RpdmVJbmRleD86IG51bWJlcikgPT4gVCkge31cbn1cbiJdfQ==