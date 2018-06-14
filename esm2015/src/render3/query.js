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
import { assertPreviousIsParent, getCurrentQueries, store, storeCleanupWithContext } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { DIRECTIVES, TVIEW } from './interfaces/view';
import { flatten } from './util';
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
export class LQueries_ {
    constructor(deep) {
        this.shallow = null;
        this.deep = null;
        this.deep = deep == null ? null : deep;
    }
    track(queryList, predicate, descend, read) {
        // TODO(misko): This is not right. In case of inherited state, a calling track will incorrectly
        // mutate parent.
        if (descend) {
            this.deep = createQuery(this.deep, queryList, predicate, read != null ? read : null);
        }
        else {
            this.shallow = createQuery(this.shallow, queryList, predicate, read != null ? read : null);
        }
    }
    child() {
        if (this.deep === null) {
            // if we don't have any deep queries then no need to track anything more.
            return null;
        }
        if (this.shallow === null) {
            // DeepQuery: We can reuse the current state if the child state would be same as current
            // state.
            return this;
        }
        else {
            // We need to create new state
            return new LQueries_(this.deep);
        }
    }
    container() {
        let result = null;
        let query = this.deep;
        while (query) {
            const containerValues = []; // prepare room for views
            query.values.push(containerValues);
            const clonedQuery = {
                next: null,
                list: query.list,
                predicate: query.predicate,
                values: containerValues,
                containerValues: null
            };
            clonedQuery.next = result;
            result = clonedQuery;
            query = query.next;
        }
        return result ? new LQueries_(result) : null;
    }
    createView() {
        let result = null;
        let query = this.deep;
        while (query) {
            const clonedQuery = {
                next: null,
                list: query.list,
                predicate: query.predicate,
                values: [],
                containerValues: query.values
            };
            clonedQuery.next = result;
            result = clonedQuery;
            query = query.next;
        }
        return result ? new LQueries_(result) : null;
    }
    insertView(index) {
        let query = this.deep;
        while (query) {
            ngDevMode &&
                assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
            query.containerValues.splice(index, 0, query.values);
            query = query.next;
        }
    }
    addNode(node) {
        add(this.shallow, node);
        add(this.deep, node);
    }
    removeView() {
        let query = this.deep;
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
 * @param node Node on which directives are present.
 * @param type Type of a directive to look for.
 * @returns Index of a found directive or null when none found.
 */
function getIdxOfMatchingDirective(node, type) {
    const defs = node.view[TVIEW].directives;
    const flags = node.tNode.flags;
    const count = flags & 4095 /* DirectiveCountMask */;
    const start = flags >> 13 /* DirectiveStartingIndexShift */;
    const end = start + count;
    for (let i = start; i < end; i++) {
        const def = defs[i];
        if (def.type === type && def.diPublic) {
            return i;
        }
    }
    return null;
}
function readFromNodeInjector(nodeInjector, node, read, directiveIdx) {
    if (read instanceof ReadFromInjectorFn) {
        return read.read(nodeInjector, node, directiveIdx);
    }
    else {
        const matchingIdx = getIdxOfMatchingDirective(node, read);
        if (matchingIdx !== null) {
            return node.view[DIRECTIVES][matchingIdx];
        }
    }
    return null;
}
function add(query, node) {
    const nodeInjector = getOrCreateNodeInjectorForNode(node);
    while (query) {
        const predicate = query.predicate;
        const type = predicate.type;
        if (type) {
            const directiveIdx = getIdxOfMatchingDirective(node, type);
            if (directiveIdx !== null) {
                // a node is matching a predicate - determine what to read
                // if read token and / or strategy is not specified, use type as read token
                const result = readFromNodeInjector(nodeInjector, node, predicate.read || type, directiveIdx);
                if (result !== null) {
                    addMatch(query, result);
                }
            }
        }
        else {
            const selector = predicate.selector;
            for (let i = 0; i < selector.length; i++) {
                const directiveIdx = getIdxOfMatchingSelector(node.tNode, selector[i]);
                if (directiveIdx !== null) {
                    // a node is matching a predicate - determine what to read
                    // note that queries using name selector must specify read strategy
                    ngDevMode && assertDefined(predicate.read, 'the node should have a predicate');
                    const result = readFromNodeInjector(nodeInjector, node, predicate.read, directiveIdx);
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
    const queries = getCurrentQueries(LQueries_);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUc5QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFMUMsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RyxPQUFPLEVBQXVCLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3ZHLE9BQU8sRUFBWSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRixPQUFPLEVBQXlELDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25JLE9BQU8sRUFBMEIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDckcsT0FBTyxFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRS9CLE1BQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBNER0RSxNQUFNO0lBSUosWUFBWSxJQUFrQjtRQUg5QixZQUFPLEdBQXFCLElBQUksQ0FBQztRQUNqQyxTQUFJLEdBQXFCLElBQUksQ0FBQztRQUVJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFBQyxDQUFDO0lBRTNFLEtBQUssQ0FDRCxTQUFrQyxFQUFFLFNBQTJCLEVBQUUsT0FBaUIsRUFDbEYsSUFBK0I7UUFDakMsK0ZBQStGO1FBQy9GLGlCQUFpQjtRQUNqQixJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3RGO2FBQU07WUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM1RjtJQUNILENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtZQUN0Qix5RUFBeUU7WUFDekUsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7WUFDekIsd0ZBQXdGO1lBQ3hGLFNBQVM7WUFDVCxPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCw4QkFBOEI7WUFDOUIsT0FBTyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakM7SUFDSCxDQUFDO0lBRUQsU0FBUztRQUNQLElBQUksTUFBTSxHQUFxQixJQUFJLENBQUM7UUFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUV0QixPQUFPLEtBQUssRUFBRTtZQUNaLE1BQU0sZUFBZSxHQUFVLEVBQUUsQ0FBQyxDQUFFLHlCQUF5QjtZQUM3RCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNuQyxNQUFNLFdBQVcsR0FBZ0I7Z0JBQy9CLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtnQkFDaEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2dCQUMxQixNQUFNLEVBQUUsZUFBZTtnQkFDdkIsZUFBZSxFQUFFLElBQUk7YUFDdEIsQ0FBQztZQUNGLFdBQVcsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1lBQzFCLE1BQU0sR0FBRyxXQUFXLENBQUM7WUFDckIsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7U0FDcEI7UUFFRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUMvQyxDQUFDO0lBRUQsVUFBVTtRQUNSLElBQUksTUFBTSxHQUFxQixJQUFJLENBQUM7UUFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUV0QixPQUFPLEtBQUssRUFBRTtZQUNaLE1BQU0sV0FBVyxHQUFnQjtnQkFDL0IsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO2dCQUNoQixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7Z0JBQzFCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLGVBQWUsRUFBRSxLQUFLLENBQUMsTUFBTTthQUM5QixDQUFDO1lBQ0YsV0FBVyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7WUFDMUIsTUFBTSxHQUFHLFdBQVcsQ0FBQztZQUNyQixLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztTQUNwQjtRQUVELE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQy9DLENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYTtRQUN0QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLE9BQU8sS0FBSyxFQUFFO1lBQ1osU0FBUztnQkFDTCxhQUFhLENBQ1QsS0FBSyxDQUFDLGVBQWUsRUFBRSwwREFBMEQsQ0FBQyxDQUFDO1lBQzNGLEtBQUssQ0FBQyxlQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2RCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztTQUNwQjtJQUNILENBQUM7SUFFRCxPQUFPLENBQUMsSUFBVztRQUNqQixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4QixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQsVUFBVTtRQUNSLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdEIsT0FBTyxLQUFLLEVBQUU7WUFDWixTQUFTO2dCQUNMLGFBQWEsQ0FDVCxLQUFLLENBQUMsZUFBZSxFQUFFLDBEQUEwRCxDQUFDLENBQUM7WUFFM0YsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWlCLENBQUM7WUFDaEQsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUQsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFekQsa0VBQWtFO1lBQ2xFLFNBQVMsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM5RCxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3JCLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDdkI7WUFFRCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztTQUNwQjtJQUNILENBQUM7Q0FDRjtBQUVEOzs7Ozs7O0dBT0c7QUFDSCxrQ0FBa0MsS0FBWSxFQUFFLFFBQWdCO0lBQzlELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7SUFDcEMsSUFBSSxVQUFVLEVBQUU7UUFDZCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzdDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtnQkFDOUIsT0FBTyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBVyxDQUFDO2FBQ3BDO1NBQ0Y7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILG1DQUFtQyxJQUFXLEVBQUUsSUFBZTtJQUM3RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVksQ0FBQztJQUMzQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUMvQixNQUFNLEtBQUssR0FBRyxLQUFLLGdDQUFnQyxDQUFDO0lBQ3BELE1BQU0sS0FBSyxHQUFHLEtBQUssd0NBQTBDLENBQUM7SUFDOUQsTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUMxQixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2hDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQThCLENBQUM7UUFDakQsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFO1lBQ3JDLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELDhCQUNJLFlBQXVCLEVBQUUsSUFBVyxFQUFFLElBQW1DLEVBQ3pFLFlBQW9CO0lBQ3RCLElBQUksSUFBSSxZQUFZLGtCQUFrQixFQUFFO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ3BEO1NBQU07UUFDTCxNQUFNLFdBQVcsR0FBRyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsSUFBaUIsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtZQUN4QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDN0M7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELGFBQWEsS0FBd0IsRUFBRSxJQUFXO0lBQ2hELE1BQU0sWUFBWSxHQUFHLDhCQUE4QixDQUFDLElBQXFDLENBQUMsQ0FBQztJQUMzRixPQUFPLEtBQUssRUFBRTtRQUNaLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDbEMsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztRQUM1QixJQUFJLElBQUksRUFBRTtZQUNSLE1BQU0sWUFBWSxHQUFHLHlCQUF5QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzRCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7Z0JBQ3pCLDBEQUEwRDtnQkFDMUQsMkVBQTJFO2dCQUMzRSxNQUFNLE1BQU0sR0FDUixvQkFBb0IsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNuRixJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7b0JBQ25CLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ3pCO2FBQ0Y7U0FDRjthQUFNO1lBQ0wsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFFBQVUsQ0FBQztZQUN0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDeEMsTUFBTSxZQUFZLEdBQUcsd0JBQXdCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkUsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFO29CQUN6QiwwREFBMEQ7b0JBQzFELG1FQUFtRTtvQkFDbkUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtDQUFrQyxDQUFDLENBQUM7b0JBQy9FLE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztvQkFDeEYsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO3dCQUNuQixRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO3FCQUN6QjtpQkFDRjthQUNGO1NBQ0Y7UUFDRCxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztLQUNwQjtBQUNILENBQUM7QUFFRCxrQkFBa0IsS0FBa0IsRUFBRSxhQUFrQjtJQUN0RCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNqQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLENBQUM7QUFFRCx5QkFDSSxTQUE0QixFQUFFLElBQXFDO0lBQ3JFLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDekMsT0FBTztRQUNMLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBb0I7UUFDM0MsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSTtRQUNoRCxJQUFJLEVBQUUsSUFBSTtLQUNYLENBQUM7QUFDSixDQUFDO0FBRUQscUJBQ0ksUUFBMkIsRUFBRSxTQUF1QixFQUFFLFNBQTRCLEVBQ2xGLElBQXFDO0lBQ3ZDLE9BQU87UUFDTCxJQUFJLEVBQUUsUUFBUTtRQUNkLElBQUksRUFBRSxTQUFTO1FBQ2YsU0FBUyxFQUFFLGVBQWUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDO1FBQzNDLE1BQU0sRUFBRyxTQUFrQyxDQUFDLFdBQVc7UUFDdkQsZUFBZSxFQUFFLElBQUk7S0FDdEIsQ0FBQztBQUNKLENBQUM7QUFFRDtJQUFBO1FBQ1csVUFBSyxHQUFHLElBQUksQ0FBQztRQUNiLFlBQU8sR0FBa0IsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUM3QyxZQUFPLEdBQVEsRUFBRSxDQUFDO1FBQzFCLGdCQUFnQjtRQUNoQixnQkFBVyxHQUFVLEVBQUUsQ0FBQztJQTJFMUIsQ0FBQztJQXpFQyxJQUFJLE1BQU0sS0FBYSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUVwRCxJQUFJLEtBQUs7UUFDUCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzFCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDMUMsQ0FBQztJQUVELElBQUksSUFBSTtRQUNOLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDMUIsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQzFELENBQUM7SUFFRDs7O09BR0c7SUFDSCxHQUFHLENBQUksRUFBNkMsSUFBUyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUUzRjs7O09BR0c7SUFDSCxNQUFNLENBQUMsRUFBbUQ7UUFDeEQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxDQUFDLEVBQW1EO1FBQ3RELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU0sQ0FBSSxFQUFrRSxFQUFFLElBQU87UUFDbkYsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7T0FHRztJQUNILE9BQU8sQ0FBQyxFQUFnRCxJQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3Rjs7O09BR0c7SUFDSCxJQUFJLENBQUMsRUFBb0Q7UUFDdkQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsT0FBTyxLQUFVLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWhELENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxLQUFrQixPQUFRLElBQUksQ0FBQyxPQUFlLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTdGLFFBQVEsS0FBYSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXRELEtBQUssQ0FBQyxHQUFnQjtRQUNwQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixJQUF3QixDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDMUMsQ0FBQztJQUVELGVBQWUsS0FBWSxJQUFJLENBQUMsT0FBNkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNFLFFBQVEsS0FBWSxJQUF3QixDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzVELE9BQU87UUFDSixJQUFJLENBQUMsT0FBNkIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxJQUFJLENBQUMsT0FBNkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFLRCxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQWdDLFVBQWlCLENBQUM7QUFFeEU7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxnQkFDRixXQUEwQixFQUFFLFNBQThCLEVBQUUsT0FBaUIsRUFDN0UsSUFBZ0M7SUFDbEMsU0FBUyxJQUFJLHNCQUFzQixFQUFFLENBQUM7SUFDdEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFTLEVBQUssQ0FBQztJQUNyQyxNQUFNLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM3QyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ25ELHVCQUF1QixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVELElBQUksV0FBVyxJQUFJLElBQUksRUFBRTtRQUN2QixLQUFLLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQy9CO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLHVCQUF1QixTQUF5QjtJQUNwRCxNQUFNLGFBQWEsR0FBSSxTQUFvQyxDQUFDO0lBQzVELElBQUksU0FBUyxDQUFDLEtBQUssRUFBRTtRQUNuQixTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzQyxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICcuLi9ldmVudF9lbWl0dGVyJztcbmltcG9ydCB7UXVlcnlMaXN0IGFzIHZpZXdFbmdpbmVfUXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtnZXRTeW1ib2xJdGVyYXRvcn0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7UmVhZEZyb21JbmplY3RvckZuLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4vZGknO1xuaW1wb3J0IHthc3NlcnRQcmV2aW91c0lzUGFyZW50LCBnZXRDdXJyZW50UXVlcmllcywgc3RvcmUsIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkludGVybmFsLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3RvciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCBRdWVyeVJlYWRUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtESVJFQ1RJVkVTLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtmbGF0dGVufSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQ7XG5cbi8qKlxuICogQSBwcmVkaWNhdGUgd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAqIHJlc3VsdHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnlQcmVkaWNhdGU8VD4ge1xuICAvKipcbiAgICogSWYgbG9va2luZyBmb3IgZGlyZWN0aXZlcyB0aGVuIGl0IGNvbnRhaW5zIHRoZSBkaXJlY3RpdmUgdHlwZS5cbiAgICovXG4gIHR5cGU6IFR5cGU8VD58bnVsbDtcblxuICAvKipcbiAgICogSWYgc2VsZWN0b3IgdGhlbiBjb250YWlucyBsb2NhbCBuYW1lcyB0byBxdWVyeSBmb3IuXG4gICAqL1xuICBzZWxlY3Rvcjogc3RyaW5nW118bnVsbDtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoaWNoIHRva2VuIHNob3VsZCBiZSByZWFkIGZyb20gREkgZm9yIHRoaXMgcXVlcnkuXG4gICAqL1xuICByZWFkOiBRdWVyeVJlYWRUeXBlPFQ+fFR5cGU8VD58bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBvYmplY3QgcmVwcmVzZW50aW5nIGEgcXVlcnksIHdoaWNoIGlzIGEgY29tYmluYXRpb24gb2Y6XG4gKiAtIHF1ZXJ5IHByZWRpY2F0ZSB0byBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogLSB2YWx1ZXMgY29sbGVjdGVkIGJhc2VkIG9uIGEgcHJlZGljYXRlXG4gKiAtIGBRdWVyeUxpc3RgIHRvIHdoaWNoIGNvbGxlY3RlZCB2YWx1ZXMgc2hvdWxkIGJlIHJlcG9ydGVkXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFF1ZXJ5PFQ+IHtcbiAgLyoqXG4gICAqIE5leHQgcXVlcnkuIFVzZWQgd2hlbiBxdWVyaWVzIGFyZSBzdG9yZWQgYXMgYSBsaW5rZWQgbGlzdCBpbiBgTFF1ZXJpZXNgLlxuICAgKi9cbiAgbmV4dDogTFF1ZXJ5PGFueT58bnVsbDtcblxuICAvKipcbiAgICogRGVzdGluYXRpb24gdG8gd2hpY2ggdGhlIHZhbHVlIHNob3VsZCBiZSBhZGRlZC5cbiAgICovXG4gIGxpc3Q6IFF1ZXJ5TGlzdDxUPjtcblxuICAvKipcbiAgICogQSBwcmVkaWNhdGUgd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQvZGlyZWN0aXZlIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcXVlcnlcbiAgICogcmVzdWx0cy5cbiAgICovXG4gIHByZWRpY2F0ZTogUXVlcnlQcmVkaWNhdGU8VD47XG5cbiAgLyoqXG4gICAqIFZhbHVlcyB3aGljaCBoYXZlIGJlZW4gbG9jYXRlZC5cbiAgICpcbiAgICogVGhpcyBpcyB3aGF0IGJ1aWxkcyB1cCB0aGUgYFF1ZXJ5TGlzdC5fdmFsdWVzVHJlZWAuXG4gICAqL1xuICB2YWx1ZXM6IGFueVtdO1xuXG4gIC8qKlxuICAgKiBBIHBvaW50ZXIgdG8gYW4gYXJyYXkgdGhhdCBzdG9yZXMgY29sbGVjdGVkIHZhbHVlcyBmcm9tIHZpZXdzLiBUaGlzIGlzIG5lY2Vzc2FyeSBzbyB3ZSBrbm93IGFcbiAgICogY29udGFpbmVyIGludG8gd2hpY2ggdG8gaW5zZXJ0IG5vZGVzIGNvbGxlY3RlZCBmcm9tIHZpZXdzLlxuICAgKi9cbiAgY29udGFpbmVyVmFsdWVzOiBhbnlbXXxudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgTFF1ZXJpZXNfIGltcGxlbWVudHMgTFF1ZXJpZXMge1xuICBzaGFsbG93OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcbiAgZGVlcDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoZGVlcD86IExRdWVyeTxhbnk+KSB7IHRoaXMuZGVlcCA9IGRlZXAgPT0gbnVsbCA/IG51bGwgOiBkZWVwOyB9XG5cbiAgdHJhY2s8VD4oXG4gICAgICBxdWVyeUxpc3Q6IHZpZXdFbmdpbmVfUXVlcnlMaXN0PFQ+LCBwcmVkaWNhdGU6IFR5cGU8VD58c3RyaW5nW10sIGRlc2NlbmQ/OiBib29sZWFuLFxuICAgICAgcmVhZD86IFF1ZXJ5UmVhZFR5cGU8VD58VHlwZTxUPik6IHZvaWQge1xuICAgIC8vIFRPRE8obWlza28pOiBUaGlzIGlzIG5vdCByaWdodC4gSW4gY2FzZSBvZiBpbmhlcml0ZWQgc3RhdGUsIGEgY2FsbGluZyB0cmFjayB3aWxsIGluY29ycmVjdGx5XG4gICAgLy8gbXV0YXRlIHBhcmVudC5cbiAgICBpZiAoZGVzY2VuZCkge1xuICAgICAgdGhpcy5kZWVwID0gY3JlYXRlUXVlcnkodGhpcy5kZWVwLCBxdWVyeUxpc3QsIHByZWRpY2F0ZSwgcmVhZCAhPSBudWxsID8gcmVhZCA6IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNoYWxsb3cgPSBjcmVhdGVRdWVyeSh0aGlzLnNoYWxsb3csIHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCByZWFkICE9IG51bGwgPyByZWFkIDogbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgY2hpbGQoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgaWYgKHRoaXMuZGVlcCA9PT0gbnVsbCkge1xuICAgICAgLy8gaWYgd2UgZG9uJ3QgaGF2ZSBhbnkgZGVlcCBxdWVyaWVzIHRoZW4gbm8gbmVlZCB0byB0cmFjayBhbnl0aGluZyBtb3JlLlxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLnNoYWxsb3cgPT09IG51bGwpIHtcbiAgICAgIC8vIERlZXBRdWVyeTogV2UgY2FuIHJldXNlIHRoZSBjdXJyZW50IHN0YXRlIGlmIHRoZSBjaGlsZCBzdGF0ZSB3b3VsZCBiZSBzYW1lIGFzIGN1cnJlbnRcbiAgICAgIC8vIHN0YXRlLlxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gY3JlYXRlIG5ldyBzdGF0ZVxuICAgICAgcmV0dXJuIG5ldyBMUXVlcmllc18odGhpcy5kZWVwKTtcbiAgICB9XG4gIH1cblxuICBjb250YWluZXIoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG4gICAgbGV0IHF1ZXJ5ID0gdGhpcy5kZWVwO1xuXG4gICAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgICBjb25zdCBjb250YWluZXJWYWx1ZXM6IGFueVtdID0gW107ICAvLyBwcmVwYXJlIHJvb20gZm9yIHZpZXdzXG4gICAgICBxdWVyeS52YWx1ZXMucHVzaChjb250YWluZXJWYWx1ZXMpO1xuICAgICAgY29uc3QgY2xvbmVkUXVlcnk6IExRdWVyeTxhbnk+ID0ge1xuICAgICAgICBuZXh0OiBudWxsLFxuICAgICAgICBsaXN0OiBxdWVyeS5saXN0LFxuICAgICAgICBwcmVkaWNhdGU6IHF1ZXJ5LnByZWRpY2F0ZSxcbiAgICAgICAgdmFsdWVzOiBjb250YWluZXJWYWx1ZXMsXG4gICAgICAgIGNvbnRhaW5lclZhbHVlczogbnVsbFxuICAgICAgfTtcbiAgICAgIGNsb25lZFF1ZXJ5Lm5leHQgPSByZXN1bHQ7XG4gICAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0ID8gbmV3IExRdWVyaWVzXyhyZXN1bHQpIDogbnVsbDtcbiAgfVxuXG4gIGNyZWF0ZVZpZXcoKTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgbGV0IHJlc3VsdDogTFF1ZXJ5PGFueT58bnVsbCA9IG51bGw7XG4gICAgbGV0IHF1ZXJ5ID0gdGhpcy5kZWVwO1xuXG4gICAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgICBjb25zdCBjbG9uZWRRdWVyeTogTFF1ZXJ5PGFueT4gPSB7XG4gICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICAgIHByZWRpY2F0ZTogcXVlcnkucHJlZGljYXRlLFxuICAgICAgICB2YWx1ZXM6IFtdLFxuICAgICAgICBjb250YWluZXJWYWx1ZXM6IHF1ZXJ5LnZhbHVlc1xuICAgICAgfTtcbiAgICAgIGNsb25lZFF1ZXJ5Lm5leHQgPSByZXN1bHQ7XG4gICAgICByZXN1bHQgPSBjbG9uZWRRdWVyeTtcbiAgICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0ID8gbmV3IExRdWVyaWVzXyhyZXN1bHQpIDogbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGxldCBxdWVyeSA9IHRoaXMuZGVlcDtcbiAgICB3aGlsZSAocXVlcnkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG4gICAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMgIS5zcGxpY2UoaW5kZXgsIDAsIHF1ZXJ5LnZhbHVlcyk7XG4gICAgICBxdWVyeSA9IHF1ZXJ5Lm5leHQ7XG4gICAgfVxuICB9XG5cbiAgYWRkTm9kZShub2RlOiBMTm9kZSk6IHZvaWQge1xuICAgIGFkZCh0aGlzLnNoYWxsb3csIG5vZGUpO1xuICAgIGFkZCh0aGlzLmRlZXAsIG5vZGUpO1xuICB9XG5cbiAgcmVtb3ZlVmlldygpOiB2b2lkIHtcbiAgICBsZXQgcXVlcnkgPSB0aGlzLmRlZXA7XG4gICAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICBxdWVyeS5jb250YWluZXJWYWx1ZXMsICdWaWV3IHF1ZXJpZXMgbmVlZCB0byBoYXZlIGEgcG9pbnRlciB0byBjb250YWluZXIgdmFsdWVzLicpO1xuXG4gICAgICBjb25zdCBjb250YWluZXJWYWx1ZXMgPSBxdWVyeS5jb250YWluZXJWYWx1ZXMgITtcbiAgICAgIGNvbnN0IHZpZXdWYWx1ZXNJZHggPSBjb250YWluZXJWYWx1ZXMuaW5kZXhPZihxdWVyeS52YWx1ZXMpO1xuICAgICAgY29uc3QgcmVtb3ZlZCA9IGNvbnRhaW5lclZhbHVlcy5zcGxpY2Uodmlld1ZhbHVlc0lkeCwgMSk7XG5cbiAgICAgIC8vIG1hcmsgYSBxdWVyeSBhcyBkaXJ0eSBvbmx5IHdoZW4gcmVtb3ZlZCB2aWV3IGhhZCBtYXRjaGluZyBtb2Rlc1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHJlbW92ZWQubGVuZ3RoLCAxLCAncmVtb3ZlZC5sZW5ndGgnKTtcbiAgICAgIGlmIChyZW1vdmVkWzBdLmxlbmd0aCkge1xuICAgICAgICBxdWVyeS5saXN0LnNldERpcnR5KCk7XG4gICAgICB9XG5cbiAgICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGxvY2FsIG5hbWVzIGZvciBhIGdpdmVuIG5vZGUgYW5kIHJldHVybnMgZGlyZWN0aXZlIGluZGV4XG4gKiAob3IgLTEgaWYgYSBsb2NhbCBuYW1lIHBvaW50cyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgc3RhdGljIGRhdGEgb2YgYSBub2RlIHRvIGNoZWNrXG4gKiBAcGFyYW0gc2VsZWN0b3Igc2VsZWN0b3IgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleCwgLTEgb3IgbnVsbCBpZiBhIHNlbGVjdG9yIGRpZG4ndCBtYXRjaCBhbnkgb2YgdGhlIGxvY2FsIG5hbWVzXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBzdHJpbmcpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgaWYgKGxvY2FsTmFtZXNbaV0gPT09IHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIHRoZSBkaXJlY3RpdmVzIGZvciBhIG5vZGUgYW5kIHJldHVybnMgaW5kZXggb2YgYSBkaXJlY3RpdmUgZm9yIGEgZ2l2ZW4gdHlwZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBOb2RlIG9uIHdoaWNoIGRpcmVjdGl2ZXMgYXJlIHByZXNlbnQuXG4gKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGEgZGlyZWN0aXZlIHRvIGxvb2sgZm9yLlxuICogQHJldHVybnMgSW5kZXggb2YgYSBmb3VuZCBkaXJlY3RpdmUgb3IgbnVsbCB3aGVuIG5vbmUgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGdldElkeE9mTWF0Y2hpbmdEaXJlY3RpdmUobm9kZTogTE5vZGUsIHR5cGU6IFR5cGU8YW55Pik6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgZGVmcyA9IG5vZGUudmlld1tUVklFV10uZGlyZWN0aXZlcyAhO1xuICBjb25zdCBmbGFncyA9IG5vZGUudE5vZGUuZmxhZ3M7XG4gIGNvbnN0IGNvdW50ID0gZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgY29uc3Qgc3RhcnQgPSBmbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgaWYgKGRlZi50eXBlID09PSB0eXBlICYmIGRlZi5kaVB1YmxpYykge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiByZWFkRnJvbU5vZGVJbmplY3RvcihcbiAgICBub2RlSW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8YW55PnwgVHlwZTxhbnk+LFxuICAgIGRpcmVjdGl2ZUlkeDogbnVtYmVyKTogYW55IHtcbiAgaWYgKHJlYWQgaW5zdGFuY2VvZiBSZWFkRnJvbUluamVjdG9yRm4pIHtcbiAgICByZXR1cm4gcmVhZC5yZWFkKG5vZGVJbmplY3Rvciwgbm9kZSwgZGlyZWN0aXZlSWR4KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBtYXRjaGluZ0lkeCA9IGdldElkeE9mTWF0Y2hpbmdEaXJlY3RpdmUobm9kZSwgcmVhZCBhcyBUeXBlPGFueT4pO1xuICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG5vZGUudmlld1tESVJFQ1RJVkVTXSAhW21hdGNoaW5nSWR4XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGFkZChxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwsIG5vZGU6IExOb2RlKSB7XG4gIGNvbnN0IG5vZGVJbmplY3RvciA9IGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShub2RlIGFzIExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gcXVlcnkucHJlZGljYXRlO1xuICAgIGNvbnN0IHR5cGUgPSBwcmVkaWNhdGUudHlwZTtcbiAgICBpZiAodHlwZSkge1xuICAgICAgY29uc3QgZGlyZWN0aXZlSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZShub2RlLCB0eXBlKTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggIT09IG51bGwpIHtcbiAgICAgICAgLy8gYSBub2RlIGlzIG1hdGNoaW5nIGEgcHJlZGljYXRlIC0gZGV0ZXJtaW5lIHdoYXQgdG8gcmVhZFxuICAgICAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIHVzZSB0eXBlIGFzIHJlYWQgdG9rZW5cbiAgICAgICAgY29uc3QgcmVzdWx0ID1cbiAgICAgICAgICAgIHJlYWRGcm9tTm9kZUluamVjdG9yKG5vZGVJbmplY3Rvciwgbm9kZSwgcHJlZGljYXRlLnJlYWQgfHwgdHlwZSwgZGlyZWN0aXZlSWR4KTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcHJlZGljYXRlLnNlbGVjdG9yICE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeCA9IGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcihub2RlLnROb2RlLCBzZWxlY3RvcltpXSk7XG4gICAgICAgIGlmIChkaXJlY3RpdmVJZHggIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBhIG5vZGUgaXMgbWF0Y2hpbmcgYSBwcmVkaWNhdGUgLSBkZXRlcm1pbmUgd2hhdCB0byByZWFkXG4gICAgICAgICAgLy8gbm90ZSB0aGF0IHF1ZXJpZXMgdXNpbmcgbmFtZSBzZWxlY3RvciBtdXN0IHNwZWNpZnkgcmVhZCBzdHJhdGVneVxuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZWRpY2F0ZS5yZWFkLCAndGhlIG5vZGUgc2hvdWxkIGhhdmUgYSBwcmVkaWNhdGUnKTtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSByZWFkRnJvbU5vZGVJbmplY3Rvcihub2RlSW5qZWN0b3IsIG5vZGUsIHByZWRpY2F0ZS5yZWFkICEsIGRpcmVjdGl2ZUlkeCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRNYXRjaChxdWVyeTogTFF1ZXJ5PGFueT4sIG1hdGNoaW5nVmFsdWU6IGFueSk6IHZvaWQge1xuICBxdWVyeS52YWx1ZXMucHVzaChtYXRjaGluZ1ZhbHVlKTtcbiAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcmVkaWNhdGU8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSwgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnwgVHlwZTxUPnwgbnVsbCk6IFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkocHJlZGljYXRlKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBpc0FycmF5ID8gbnVsbCA6IHByZWRpY2F0ZSBhcyBUeXBlPFQ+LFxuICAgIHNlbGVjdG9yOiBpc0FycmF5ID8gcHJlZGljYXRlIGFzIHN0cmluZ1tdIDogbnVsbCxcbiAgICByZWFkOiByZWFkXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5PFQ+KFxuICAgIHByZXZpb3VzOiBMUXVlcnk8YW55PnwgbnVsbCwgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sXG4gICAgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnwgVHlwZTxUPnwgbnVsbCk6IExRdWVyeTxUPiB7XG4gIHJldHVybiB7XG4gICAgbmV4dDogcHJldmlvdXMsXG4gICAgbGlzdDogcXVlcnlMaXN0LFxuICAgIHByZWRpY2F0ZTogY3JlYXRlUHJlZGljYXRlKHByZWRpY2F0ZSwgcmVhZCksXG4gICAgdmFsdWVzOiAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPFQ+KS5fdmFsdWVzVHJlZSxcbiAgICBjb250YWluZXJWYWx1ZXM6IG51bGxcbiAgfTtcbn1cblxuY2xhc3MgUXVlcnlMaXN0XzxUPi8qIGltcGxlbWVudHMgdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD4gKi8ge1xuICByZWFkb25seSBkaXJ0eSA9IHRydWU7XG4gIHJlYWRvbmx5IGNoYW5nZXM6IE9ic2VydmFibGU8VD4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHByaXZhdGUgX3ZhbHVlczogVFtdID0gW107XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ZhbHVlc1RyZWU6IGFueVtdID0gW107XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmFsdWVzLmxlbmd0aDsgfVxuXG4gIGdldCBmaXJzdCgpOiBUfG51bGwge1xuICAgIGxldCB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgcmV0dXJuIHZhbHVlcy5sZW5ndGggPyB2YWx1ZXNbMF0gOiBudWxsO1xuICB9XG5cbiAgZ2V0IGxhc3QoKTogVHxudWxsIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID8gdmFsdWVzW3ZhbHVlcy5sZW5ndGggLSAxXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5tYXBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L21hcClcbiAgICovXG4gIG1hcDxVPihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IFUpOiBVW10geyByZXR1cm4gdGhpcy5fdmFsdWVzLm1hcChmbik7IH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5maWx0ZXJdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbHRlcilcbiAgICovXG4gIGZpbHRlcihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBUW10ge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMuZmlsdGVyKGZuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZpbmRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbmQpXG4gICAqL1xuICBmaW5kKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gYm9vbGVhbik6IFR8dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmZpbmQoZm4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkucmVkdWNlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9yZWR1Y2UpXG4gICAqL1xuICByZWR1Y2U8VT4oZm46IChwcmV2VmFsdWU6IFUsIGN1clZhbHVlOiBULCBjdXJJbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVLCBpbml0OiBVKTogVSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5yZWR1Y2UoZm4sIGluaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZm9yRWFjaF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZm9yRWFjaClcbiAgICovXG4gIGZvckVhY2goZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX3ZhbHVlcy5mb3JFYWNoKGZuKTsgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LnNvbWVdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L3NvbWUpXG4gICAqL1xuICBzb21lKGZuOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLnNvbWUoZm4pO1xuICB9XG5cbiAgdG9BcnJheSgpOiBUW10geyByZXR1cm4gdGhpcy5fdmFsdWVzLnNsaWNlKDApOyB9XG5cbiAgW2dldFN5bWJvbEl0ZXJhdG9yKCldKCk6IEl0ZXJhdG9yPFQ+IHsgcmV0dXJuICh0aGlzLl92YWx1ZXMgYXMgYW55KVtnZXRTeW1ib2xJdGVyYXRvcigpXSgpOyB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy50b1N0cmluZygpOyB9XG5cbiAgcmVzZXQocmVzOiAoYW55W118VClbXSk6IHZvaWQge1xuICAgIHRoaXMuX3ZhbHVlcyA9IGZsYXR0ZW4ocmVzKTtcbiAgICAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gZmFsc2U7XG4gIH1cblxuICBub3RpZnlPbkNoYW5nZXMoKTogdm9pZCB7ICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLmVtaXQodGhpcyk7IH1cbiAgc2V0RGlydHkoKTogdm9pZCB7ICh0aGlzIGFze2RpcnR5OiBib29sZWFufSkuZGlydHkgPSB0cnVlOyB9XG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikuY29tcGxldGUoKTtcbiAgICAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbi8vIE5PVEU6IHRoaXMgaGFjayBpcyBoZXJlIGJlY2F1c2UgSVF1ZXJ5TGlzdCBoYXMgcHJpdmF0ZSBtZW1iZXJzIGFuZCB0aGVyZWZvcmVcbi8vIGl0IGNhbid0IGJlIGltcGxlbWVudGVkIG9ubHkgZXh0ZW5kZWQuXG5leHBvcnQgdHlwZSBRdWVyeUxpc3Q8VD4gPSB2aWV3RW5naW5lX1F1ZXJ5TGlzdDxUPjtcbmV4cG9ydCBjb25zdCBRdWVyeUxpc3Q6IHR5cGVvZiB2aWV3RW5naW5lX1F1ZXJ5TGlzdCA9IFF1ZXJ5TGlzdF8gYXMgYW55O1xuXG4vKipcbiAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBRdWVyeUxpc3QuXG4gKlxuICogQHBhcmFtIG1lbW9yeUluZGV4IFRoZSBpbmRleCBpbiBtZW1vcnkgd2hlcmUgdGhlIFF1ZXJ5TGlzdCBzaG91bGQgYmUgc2F2ZWQuIElmIG51bGwsXG4gKiB0aGlzIGlzIGlzIGEgY29udGVudCBxdWVyeSBhbmQgdGhlIFF1ZXJ5TGlzdCB3aWxsIGJlIHNhdmVkIGxhdGVyIHRocm91Z2ggZGlyZWN0aXZlQ3JlYXRlLlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnk8VD4oXG4gICAgbWVtb3J5SW5kZXg6IG51bWJlciB8IG51bGwsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgcmVhZD86IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD4pOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KCk7XG4gIGNvbnN0IHF1ZXJpZXMgPSBnZXRDdXJyZW50UXVlcmllcyhMUXVlcmllc18pO1xuICBxdWVyaWVzLnRyYWNrKHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobnVsbCwgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG4gIGlmIChtZW1vcnlJbmRleCAhPSBudWxsKSB7XG4gICAgc3RvcmUobWVtb3J5SW5kZXgsIHF1ZXJ5TGlzdCk7XG4gIH1cbiAgcmV0dXJuIHF1ZXJ5TGlzdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0SW1wbCA9IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88YW55Pik7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkpIHtcbiAgICBxdWVyeUxpc3QucmVzZXQocXVlcnlMaXN0SW1wbC5fdmFsdWVzVHJlZSk7XG4gICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==