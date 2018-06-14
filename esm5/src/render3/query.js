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
var unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
var LQueries_ = /** @class */ (function () {
    function LQueries_(deep) {
        this.shallow = null;
        this.deep = null;
        this.deep = deep == null ? null : deep;
    }
    LQueries_.prototype.track = function (queryList, predicate, descend, read) {
        // TODO(misko): This is not right. In case of inherited state, a calling track will incorrectly
        // mutate parent.
        if (descend) {
            this.deep = createQuery(this.deep, queryList, predicate, read != null ? read : null);
        }
        else {
            this.shallow = createQuery(this.shallow, queryList, predicate, read != null ? read : null);
        }
    };
    LQueries_.prototype.child = function () {
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
    };
    LQueries_.prototype.container = function () {
        var result = null;
        var query = this.deep;
        while (query) {
            var containerValues = []; // prepare room for views
            query.values.push(containerValues);
            var clonedQuery = {
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
    };
    LQueries_.prototype.createView = function () {
        var result = null;
        var query = this.deep;
        while (query) {
            var clonedQuery = {
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
    };
    LQueries_.prototype.insertView = function (index) {
        var query = this.deep;
        while (query) {
            ngDevMode &&
                assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
            query.containerValues.splice(index, 0, query.values);
            query = query.next;
        }
    };
    LQueries_.prototype.addNode = function (node) {
        add(this.shallow, node);
        add(this.deep, node);
    };
    LQueries_.prototype.removeView = function () {
        var query = this.deep;
        while (query) {
            ngDevMode &&
                assertDefined(query.containerValues, 'View queries need to have a pointer to container values.');
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
    };
    return LQueries_;
}());
export { LQueries_ };
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
/**
 * Iterates over all the directives for a node and returns index of a directive for a given type.
 *
 * @param node Node on which directives are present.
 * @param type Type of a directive to look for.
 * @returns Index of a found directive or null when none found.
 */
function getIdxOfMatchingDirective(node, type) {
    var defs = node.view[TVIEW].directives;
    var flags = node.tNode.flags;
    var count = flags & 4095 /* DirectiveCountMask */;
    var start = flags >> 13 /* DirectiveStartingIndexShift */;
    var end = start + count;
    for (var i = start; i < end; i++) {
        var def = defs[i];
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
        var matchingIdx = getIdxOfMatchingDirective(node, read);
        if (matchingIdx !== null) {
            return node.view[DIRECTIVES][matchingIdx];
        }
    }
    return null;
}
function add(query, node) {
    var nodeInjector = getOrCreateNodeInjectorForNode(node);
    while (query) {
        var predicate = query.predicate;
        var type = predicate.type;
        if (type) {
            var directiveIdx = getIdxOfMatchingDirective(node, type);
            if (directiveIdx !== null) {
                // a node is matching a predicate - determine what to read
                // if read token and / or strategy is not specified, use type as read token
                var result = readFromNodeInjector(nodeInjector, node, predicate.read || type, directiveIdx);
                if (result !== null) {
                    addMatch(query, result);
                }
            }
        }
        else {
            var selector = predicate.selector;
            for (var i = 0; i < selector.length; i++) {
                var directiveIdx = getIdxOfMatchingSelector(node.tNode, selector[i]);
                if (directiveIdx !== null) {
                    // a node is matching a predicate - determine what to read
                    // note that queries using name selector must specify read strategy
                    ngDevMode && assertDefined(predicate.read, 'the node should have a predicate');
                    var result = readFromNodeInjector(nodeInjector, node, predicate.read, directiveIdx);
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
    var isArray = Array.isArray(predicate);
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
var QueryList_ = /** @class */ (function () {
    function QueryList_() {
        this.dirty = true;
        this.changes = new EventEmitter();
        this._values = [];
        /** @internal */
        this._valuesTree = [];
    }
    Object.defineProperty(QueryList_.prototype, "length", {
        get: function () { return this._values.length; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryList_.prototype, "first", {
        get: function () {
            var values = this._values;
            return values.length ? values[0] : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryList_.prototype, "last", {
        get: function () {
            var values = this._values;
            return values.length ? values[values.length - 1] : null;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * See
     * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
     */
    QueryList_.prototype.map = function (fn) { return this._values.map(fn); };
    /**
     * See
     * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
     */
    QueryList_.prototype.filter = function (fn) {
        return this._values.filter(fn);
    };
    /**
     * See
     * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
     */
    QueryList_.prototype.find = function (fn) {
        return this._values.find(fn);
    };
    /**
     * See
     * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
     */
    QueryList_.prototype.reduce = function (fn, init) {
        return this._values.reduce(fn, init);
    };
    /**
     * See
     * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
     */
    QueryList_.prototype.forEach = function (fn) { this._values.forEach(fn); };
    /**
     * See
     * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
     */
    QueryList_.prototype.some = function (fn) {
        return this._values.some(fn);
    };
    QueryList_.prototype.toArray = function () { return this._values.slice(0); };
    QueryList_.prototype[getSymbolIterator()] = function () { return this._values[getSymbolIterator()](); };
    QueryList_.prototype.toString = function () { return this._values.toString(); };
    QueryList_.prototype.reset = function (res) {
        this._values = flatten(res);
        this.dirty = false;
    };
    QueryList_.prototype.notifyOnChanges = function () { this.changes.emit(this); };
    QueryList_.prototype.setDirty = function () { this.dirty = true; };
    QueryList_.prototype.destroy = function () {
        this.changes.complete();
        this.changes.unsubscribe();
    };
    return QueryList_;
}());
export var QueryList = QueryList_;
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
    var queryList = new QueryList();
    var queries = getCurrentQueries(LQueries_);
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
    var queryListImpl = queryList;
    if (queryList.dirty) {
        queryList.reset(queryListImpl._valuesTree);
        queryList.notifyOnChanges();
        return true;
    }
    return false;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUc5QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFMUMsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RyxPQUFPLEVBQWUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDL0YsT0FBTyxFQUFZLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFGLE9BQU8sRUFBeUQsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkksT0FBTyxFQUEwQiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRyxPQUFPLEVBQUMsVUFBVSxFQUFFLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFL0IsSUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUE0RHRFO0lBSUUsbUJBQVksSUFBa0I7UUFIOUIsWUFBTyxHQUFxQixJQUFJLENBQUM7UUFDakMsU0FBSSxHQUFxQixJQUFJLENBQUM7UUFFSSxJQUFJ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dUIsU0FBeUI7SUFDcEQsSUFBTSxhQUFhLEdBQUksU0FBb0MsQ0FBQztJQUM1RCxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUU7UUFDbkIsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0MsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzVCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnLi4vZXZlbnRfZW1pdHRlcic7XG5pbXBvcnQge1F1ZXJ5TGlzdCBhcyB2aWV3RW5naW5lX1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7Z2V0U3ltYm9sSXRlcmF0b3J9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge1JlYWRGcm9tSW5qZWN0b3JGbiwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuL2RpJztcbmltcG9ydCB7YXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgZ2V0Q3VycmVudFF1ZXJpZXMsIHN0b3JlLCBzdG9yZUNsZWFudXBXaXRoQ29udGV4dH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWYsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEluamVjdG9yLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0RJUkVDVElWRVMsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2ZsYXR0ZW59IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNDtcblxuLyoqXG4gKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICogcmVzdWx0cy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBRdWVyeVByZWRpY2F0ZTxUPiB7XG4gIC8qKlxuICAgKiBJZiBsb29raW5nIGZvciBkaXJlY3RpdmVzIHRoZW4gaXQgY29udGFpbnMgdGhlIGRpcmVjdGl2ZSB0eXBlLlxuICAgKi9cbiAgdHlwZTogVHlwZTxUPnxudWxsO1xuXG4gIC8qKlxuICAgKiBJZiBzZWxlY3RvciB0aGVuIGNvbnRhaW5zIGxvY2FsIG5hbWVzIHRvIHF1ZXJ5IGZvci5cbiAgICovXG4gIHNlbGVjdG9yOiBzdHJpbmdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hpY2ggdG9rZW4gc2hvdWxkIGJlIHJlYWQgZnJvbSBESSBmb3IgdGhpcyBxdWVyeS5cbiAgICovXG4gIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8VD58VHlwZTxUPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCByZXByZXNlbnRpbmcgYSBxdWVyeSwgd2hpY2ggaXMgYSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gcXVlcnkgcHJlZGljYXRlIHRvIGRldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50L2RpcmVjdGl2ZSBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlIHF1ZXJ5XG4gKiAtIHZhbHVlcyBjb2xsZWN0ZWQgYmFzZWQgb24gYSBwcmVkaWNhdGVcbiAqIC0gYFF1ZXJ5TGlzdGAgdG8gd2hpY2ggY29sbGVjdGVkIHZhbHVlcyBzaG91bGQgYmUgcmVwb3J0ZWRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMUXVlcnk8VD4ge1xuICAvKipcbiAgICogTmV4dCBxdWVyeS4gVXNlZCB3aGVuIHF1ZXJpZXMgYXJlIHN0b3JlZCBhcyBhIGxpbmtlZCBsaXN0IGluIGBMUXVlcmllc2AuXG4gICAqL1xuICBuZXh0OiBMUXVlcnk8YW55PnxudWxsO1xuXG4gIC8qKlxuICAgKiBEZXN0aW5hdGlvbiB0byB3aGljaCB0aGUgdmFsdWUgc2hvdWxkIGJlIGFkZGVkLlxuICAgKi9cbiAgbGlzdDogUXVlcnlMaXN0PFQ+O1xuXG4gIC8qKlxuICAgKiBBIHByZWRpY2F0ZSB3aGljaCBkZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudC9kaXJlY3RpdmUgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZSBxdWVyeVxuICAgKiByZXN1bHRzLlxuICAgKi9cbiAgcHJlZGljYXRlOiBRdWVyeVByZWRpY2F0ZTxUPjtcblxuICAvKipcbiAgICogVmFsdWVzIHdoaWNoIGhhdmUgYmVlbiBsb2NhdGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHdoYXQgYnVpbGRzIHVwIHRoZSBgUXVlcnlMaXN0Ll92YWx1ZXNUcmVlYC5cbiAgICovXG4gIHZhbHVlczogYW55W107XG5cbiAgLyoqXG4gICAqIEEgcG9pbnRlciB0byBhbiBhcnJheSB0aGF0IHN0b3JlcyBjb2xsZWN0ZWQgdmFsdWVzIGZyb20gdmlld3MuIFRoaXMgaXMgbmVjZXNzYXJ5IHNvIHdlIGtub3cgYVxuICAgKiBjb250YWluZXIgaW50byB3aGljaCB0byBpbnNlcnQgbm9kZXMgY29sbGVjdGVkIGZyb20gdmlld3MuXG4gICAqL1xuICBjb250YWluZXJWYWx1ZXM6IGFueVtdfG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBMUXVlcmllc18gaW1wbGVtZW50cyBMUXVlcmllcyB7XG4gIHNoYWxsb3c6IExRdWVyeTxhbnk+fG51bGwgPSBudWxsO1xuICBkZWVwOiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihkZWVwPzogTFF1ZXJ5PGFueT4pIHsgdGhpcy5kZWVwID0gZGVlcCA9PSBudWxsID8gbnVsbCA6IGRlZXA7IH1cblxuICB0cmFjazxUPihcbiAgICAgIHF1ZXJ5TGlzdDogdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnxzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgICByZWFkPzogUXVlcnlSZWFkVHlwZTxUPnxUeXBlPFQ+KTogdm9pZCB7XG4gICAgLy8gVE9ETyhtaXNrbyk6IFRoaXMgaXMgbm90IHJpZ2h0LiBJbiBjYXNlIG9mIGluaGVyaXRlZCBzdGF0ZSwgYSBjYWxsaW5nIHRyYWNrIHdpbGwgaW5jb3JyZWN0bHlcbiAgICAvLyBtdXRhdGUgcGFyZW50LlxuICAgIGlmIChkZXNjZW5kKSB7XG4gICAgICB0aGlzLmRlZXAgPSBjcmVhdGVRdWVyeSh0aGlzLmRlZXAsIHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCByZWFkICE9IG51bGwgPyByZWFkIDogbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hhbGxvdyA9IGNyZWF0ZVF1ZXJ5KHRoaXMuc2hhbGxvdywgcXVlcnlMaXN0LCBwcmVkaWNhdGUsIHJlYWQgIT0gbnVsbCA/IHJlYWQgOiBudWxsKTtcbiAgICB9XG4gIH1cblxuICBjaGlsZCgpOiBMUXVlcmllc3xudWxsIHtcbiAgICBpZiAodGhpcy5kZWVwID09PSBudWxsKSB7XG4gICAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIGFueSBkZWVwIHF1ZXJpZXMgdGhlbiBubyBuZWVkIHRvIHRyYWNrIGFueXRoaW5nIG1vcmUuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hhbGxvdyA9PT0gbnVsbCkge1xuICAgICAgLy8gRGVlcFF1ZXJ5OiBXZSBjYW4gcmV1c2UgdGhlIGN1cnJlbnQgc3RhdGUgaWYgdGhlIGNoaWxkIHN0YXRlIHdvdWxkIGJlIHNhbWUgYXMgY3VycmVudFxuICAgICAgLy8gc3RhdGUuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgbmVlZCB0byBjcmVhdGUgbmV3IHN0YXRlXG4gICAgICByZXR1cm4gbmV3IExRdWVyaWVzXyh0aGlzLmRlZXApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnRhaW5lcigpOiBMUXVlcmllc3xudWxsIHtcbiAgICBsZXQgcmVzdWx0OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcbiAgICBsZXQgcXVlcnkgPSB0aGlzLmRlZXA7XG5cbiAgICB3aGlsZSAocXVlcnkpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlczogYW55W10gPSBbXTsgIC8vIHByZXBhcmUgcm9vbSBmb3Igdmlld3NcbiAgICAgIHF1ZXJ5LnZhbHVlcy5wdXNoKGNvbnRhaW5lclZhbHVlcyk7XG4gICAgICBjb25zdCBjbG9uZWRRdWVyeTogTFF1ZXJ5PGFueT4gPSB7XG4gICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgIGxpc3Q6IHF1ZXJ5Lmxpc3QsXG4gICAgICAgIHByZWRpY2F0ZTogcXVlcnkucHJlZGljYXRlLFxuICAgICAgICB2YWx1ZXM6IGNvbnRhaW5lclZhbHVlcyxcbiAgICAgICAgY29udGFpbmVyVmFsdWVzOiBudWxsXG4gICAgICB9O1xuICAgICAgY2xvbmVkUXVlcnkubmV4dCA9IHJlc3VsdDtcbiAgICAgIHJlc3VsdCA9IGNsb25lZFF1ZXJ5O1xuICAgICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQgPyBuZXcgTFF1ZXJpZXNfKHJlc3VsdCkgOiBudWxsO1xuICB9XG5cbiAgY3JlYXRlVmlldygpOiBMUXVlcmllc3xudWxsIHtcbiAgICBsZXQgcmVzdWx0OiBMUXVlcnk8YW55PnxudWxsID0gbnVsbDtcbiAgICBsZXQgcXVlcnkgPSB0aGlzLmRlZXA7XG5cbiAgICB3aGlsZSAocXVlcnkpIHtcbiAgICAgIGNvbnN0IGNsb25lZFF1ZXJ5OiBMUXVlcnk8YW55PiA9IHtcbiAgICAgICAgbmV4dDogbnVsbCxcbiAgICAgICAgbGlzdDogcXVlcnkubGlzdCxcbiAgICAgICAgcHJlZGljYXRlOiBxdWVyeS5wcmVkaWNhdGUsXG4gICAgICAgIHZhbHVlczogW10sXG4gICAgICAgIGNvbnRhaW5lclZhbHVlczogcXVlcnkudmFsdWVzXG4gICAgICB9O1xuICAgICAgY2xvbmVkUXVlcnkubmV4dCA9IHJlc3VsdDtcbiAgICAgIHJlc3VsdCA9IGNsb25lZFF1ZXJ5O1xuICAgICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQgPyBuZXcgTFF1ZXJpZXNfKHJlc3VsdCkgOiBudWxsO1xuICB9XG5cbiAgaW5zZXJ0VmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgbGV0IHF1ZXJ5ID0gdGhpcy5kZWVwO1xuICAgIHdoaWxlIChxdWVyeSkge1xuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgcXVlcnkuY29udGFpbmVyVmFsdWVzLCAnVmlldyBxdWVyaWVzIG5lZWQgdG8gaGF2ZSBhIHBvaW50ZXIgdG8gY29udGFpbmVyIHZhbHVlcy4nKTtcbiAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhLnNwbGljZShpbmRleCwgMCwgcXVlcnkudmFsdWVzKTtcbiAgICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgICB9XG4gIH1cblxuICBhZGROb2RlKG5vZGU6IExOb2RlKTogdm9pZCB7XG4gICAgYWRkKHRoaXMuc2hhbGxvdywgbm9kZSk7XG4gICAgYWRkKHRoaXMuZGVlcCwgbm9kZSk7XG4gIH1cblxuICByZW1vdmVWaWV3KCk6IHZvaWQge1xuICAgIGxldCBxdWVyeSA9IHRoaXMuZGVlcDtcbiAgICB3aGlsZSAocXVlcnkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgIHF1ZXJ5LmNvbnRhaW5lclZhbHVlcywgJ1ZpZXcgcXVlcmllcyBuZWVkIHRvIGhhdmUgYSBwb2ludGVyIHRvIGNvbnRhaW5lciB2YWx1ZXMuJyk7XG5cbiAgICAgIGNvbnN0IGNvbnRhaW5lclZhbHVlcyA9IHF1ZXJ5LmNvbnRhaW5lclZhbHVlcyAhO1xuICAgICAgY29uc3Qgdmlld1ZhbHVlc0lkeCA9IGNvbnRhaW5lclZhbHVlcy5pbmRleE9mKHF1ZXJ5LnZhbHVlcyk7XG4gICAgICBjb25zdCByZW1vdmVkID0gY29udGFpbmVyVmFsdWVzLnNwbGljZSh2aWV3VmFsdWVzSWR4LCAxKTtcblxuICAgICAgLy8gbWFyayBhIHF1ZXJ5IGFzIGRpcnR5IG9ubHkgd2hlbiByZW1vdmVkIHZpZXcgaGFkIG1hdGNoaW5nIG1vZGVzXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwocmVtb3ZlZC5sZW5ndGgsIDEsICdyZW1vdmVkLmxlbmd0aCcpO1xuICAgICAgaWYgKHJlbW92ZWRbMF0ubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXJ5Lmxpc3Quc2V0RGlydHkoKTtcbiAgICAgIH1cblxuICAgICAgcXVlcnkgPSBxdWVyeS5uZXh0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgbG9jYWwgbmFtZXMgZm9yIGEgZ2l2ZW4gbm9kZSBhbmQgcmV0dXJucyBkaXJlY3RpdmUgaW5kZXhcbiAqIChvciAtMSBpZiBhIGxvY2FsIG5hbWUgcG9pbnRzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBzdGF0aWMgZGF0YSBvZiBhIG5vZGUgdG8gY2hlY2tcbiAqIEBwYXJhbSBzZWxlY3RvciBzZWxlY3RvciB0byBtYXRjaFxuICogQHJldHVybnMgZGlyZWN0aXZlIGluZGV4LCAtMSBvciBudWxsIGlmIGEgc2VsZWN0b3IgZGlkbid0IG1hdGNoIGFueSBvZiB0aGUgbG9jYWwgbmFtZXNcbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBpZiAobG9jYWxOYW1lc1tpXSA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgdGhlIGRpcmVjdGl2ZXMgZm9yIGEgbm9kZSBhbmQgcmV0dXJucyBpbmRleCBvZiBhIGRpcmVjdGl2ZSBmb3IgYSBnaXZlbiB0eXBlLlxuICpcbiAqIEBwYXJhbSBub2RlIE5vZGUgb24gd2hpY2ggZGlyZWN0aXZlcyBhcmUgcHJlc2VudC5cbiAqIEBwYXJhbSB0eXBlIFR5cGUgb2YgYSBkaXJlY3RpdmUgdG8gbG9vayBmb3IuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBhIGZvdW5kIGRpcmVjdGl2ZSBvciBudWxsIHdoZW4gbm9uZSBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZShub2RlOiBMTm9kZSwgdHlwZTogVHlwZTxhbnk+KTogbnVtYmVyfG51bGwge1xuICBjb25zdCBkZWZzID0gbm9kZS52aWV3W1RWSUVXXS5kaXJlY3RpdmVzICE7XG4gIGNvbnN0IGZsYWdzID0gbm9kZS50Tm9kZS5mbGFncztcbiAgY29uc3QgY291bnQgPSBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBjb25zdCBzdGFydCA9IGZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGRlZi50eXBlID09PSB0eXBlICYmIGRlZi5kaVB1YmxpYykge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiByZWFkRnJvbU5vZGVJbmplY3RvcihcbiAgICBub2RlSW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIHJlYWQ6IFF1ZXJ5UmVhZFR5cGU8YW55PnwgVHlwZTxhbnk+LFxuICAgIGRpcmVjdGl2ZUlkeDogbnVtYmVyKTogYW55IHtcbiAgaWYgKHJlYWQgaW5zdGFuY2VvZiBSZWFkRnJvbUluamVjdG9yRm4pIHtcbiAgICByZXR1cm4gcmVhZC5yZWFkKG5vZGVJbmplY3Rvciwgbm9kZSwgZGlyZWN0aXZlSWR4KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBtYXRjaGluZ0lkeCA9IGdldElkeE9mTWF0Y2hpbmdEaXJlY3RpdmUobm9kZSwgcmVhZCBhcyBUeXBlPGFueT4pO1xuICAgIGlmIChtYXRjaGluZ0lkeCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG5vZGUudmlld1tESVJFQ1RJVkVTXSAhW21hdGNoaW5nSWR4XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGFkZChxdWVyeTogTFF1ZXJ5PGFueT58IG51bGwsIG5vZGU6IExOb2RlKSB7XG4gIGNvbnN0IG5vZGVJbmplY3RvciA9IGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShub2RlIGFzIExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTtcbiAgd2hpbGUgKHF1ZXJ5KSB7XG4gICAgY29uc3QgcHJlZGljYXRlID0gcXVlcnkucHJlZGljYXRlO1xuICAgIGNvbnN0IHR5cGUgPSBwcmVkaWNhdGUudHlwZTtcbiAgICBpZiAodHlwZSkge1xuICAgICAgY29uc3QgZGlyZWN0aXZlSWR4ID0gZ2V0SWR4T2ZNYXRjaGluZ0RpcmVjdGl2ZShub2RlLCB0eXBlKTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggIT09IG51bGwpIHtcbiAgICAgICAgLy8gYSBub2RlIGlzIG1hdGNoaW5nIGEgcHJlZGljYXRlIC0gZGV0ZXJtaW5lIHdoYXQgdG8gcmVhZFxuICAgICAgICAvLyBpZiByZWFkIHRva2VuIGFuZCAvIG9yIHN0cmF0ZWd5IGlzIG5vdCBzcGVjaWZpZWQsIHVzZSB0eXBlIGFzIHJlYWQgdG9rZW5cbiAgICAgICAgY29uc3QgcmVzdWx0ID1cbiAgICAgICAgICAgIHJlYWRGcm9tTm9kZUluamVjdG9yKG5vZGVJbmplY3Rvciwgbm9kZSwgcHJlZGljYXRlLnJlYWQgfHwgdHlwZSwgZGlyZWN0aXZlSWR4KTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgIGFkZE1hdGNoKHF1ZXJ5LCByZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yID0gcHJlZGljYXRlLnNlbGVjdG9yICE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeCA9IGdldElkeE9mTWF0Y2hpbmdTZWxlY3Rvcihub2RlLnROb2RlLCBzZWxlY3RvcltpXSk7XG4gICAgICAgIGlmIChkaXJlY3RpdmVJZHggIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBhIG5vZGUgaXMgbWF0Y2hpbmcgYSBwcmVkaWNhdGUgLSBkZXRlcm1pbmUgd2hhdCB0byByZWFkXG4gICAgICAgICAgLy8gbm90ZSB0aGF0IHF1ZXJpZXMgdXNpbmcgbmFtZSBzZWxlY3RvciBtdXN0IHNwZWNpZnkgcmVhZCBzdHJhdGVneVxuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZWRpY2F0ZS5yZWFkLCAndGhlIG5vZGUgc2hvdWxkIGhhdmUgYSBwcmVkaWNhdGUnKTtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSByZWFkRnJvbU5vZGVJbmplY3Rvcihub2RlSW5qZWN0b3IsIG5vZGUsIHByZWRpY2F0ZS5yZWFkICEsIGRpcmVjdGl2ZUlkeCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkTWF0Y2gocXVlcnksIHJlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHF1ZXJ5ID0gcXVlcnkubmV4dDtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRNYXRjaChxdWVyeTogTFF1ZXJ5PGFueT4sIG1hdGNoaW5nVmFsdWU6IGFueSk6IHZvaWQge1xuICBxdWVyeS52YWx1ZXMucHVzaChtYXRjaGluZ1ZhbHVlKTtcbiAgcXVlcnkubGlzdC5zZXREaXJ0eSgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcmVkaWNhdGU8VD4oXG4gICAgcHJlZGljYXRlOiBUeXBlPFQ+fCBzdHJpbmdbXSwgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnwgVHlwZTxUPnwgbnVsbCk6IFF1ZXJ5UHJlZGljYXRlPFQ+IHtcbiAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkocHJlZGljYXRlKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBpc0FycmF5ID8gbnVsbCA6IHByZWRpY2F0ZSBhcyBUeXBlPFQ+LFxuICAgIHNlbGVjdG9yOiBpc0FycmF5ID8gcHJlZGljYXRlIGFzIHN0cmluZ1tdIDogbnVsbCxcbiAgICByZWFkOiByZWFkXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5PFQ+KFxuICAgIHByZXZpb3VzOiBMUXVlcnk8YW55PnwgbnVsbCwgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4sIHByZWRpY2F0ZTogVHlwZTxUPnwgc3RyaW5nW10sXG4gICAgcmVhZDogUXVlcnlSZWFkVHlwZTxUPnwgVHlwZTxUPnwgbnVsbCk6IExRdWVyeTxUPiB7XG4gIHJldHVybiB7XG4gICAgbmV4dDogcHJldmlvdXMsXG4gICAgbGlzdDogcXVlcnlMaXN0LFxuICAgIHByZWRpY2F0ZTogY3JlYXRlUHJlZGljYXRlKHByZWRpY2F0ZSwgcmVhZCksXG4gICAgdmFsdWVzOiAocXVlcnlMaXN0IGFzIGFueSBhcyBRdWVyeUxpc3RfPFQ+KS5fdmFsdWVzVHJlZSxcbiAgICBjb250YWluZXJWYWx1ZXM6IG51bGxcbiAgfTtcbn1cblxuY2xhc3MgUXVlcnlMaXN0XzxUPi8qIGltcGxlbWVudHMgdmlld0VuZ2luZV9RdWVyeUxpc3Q8VD4gKi8ge1xuICByZWFkb25seSBkaXJ0eSA9IHRydWU7XG4gIHJlYWRvbmx5IGNoYW5nZXM6IE9ic2VydmFibGU8VD4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHByaXZhdGUgX3ZhbHVlczogVFtdID0gW107XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ZhbHVlc1RyZWU6IGFueVtdID0gW107XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmFsdWVzLmxlbmd0aDsgfVxuXG4gIGdldCBmaXJzdCgpOiBUfG51bGwge1xuICAgIGxldCB2YWx1ZXMgPSB0aGlzLl92YWx1ZXM7XG4gICAgcmV0dXJuIHZhbHVlcy5sZW5ndGggPyB2YWx1ZXNbMF0gOiBudWxsO1xuICB9XG5cbiAgZ2V0IGxhc3QoKTogVHxudWxsIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5fdmFsdWVzO1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoID8gdmFsdWVzW3ZhbHVlcy5sZW5ndGggLSAxXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5tYXBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L21hcClcbiAgICovXG4gIG1hcDxVPihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IFUpOiBVW10geyByZXR1cm4gdGhpcy5fdmFsdWVzLm1hcChmbik7IH1cblxuICAvKipcbiAgICogU2VlXG4gICAqIFtBcnJheS5maWx0ZXJdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbHRlcilcbiAgICovXG4gIGZpbHRlcihmbjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBUW10ge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZXMuZmlsdGVyKGZuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LmZpbmRdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbmQpXG4gICAqL1xuICBmaW5kKGZuOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFRbXSkgPT4gYm9vbGVhbik6IFR8dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLmZpbmQoZm4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkucmVkdWNlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9yZWR1Y2UpXG4gICAqL1xuICByZWR1Y2U8VT4oZm46IChwcmV2VmFsdWU6IFUsIGN1clZhbHVlOiBULCBjdXJJbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiBVLCBpbml0OiBVKTogVSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlcy5yZWR1Y2UoZm4sIGluaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZVxuICAgKiBbQXJyYXkuZm9yRWFjaF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZm9yRWFjaClcbiAgICovXG4gIGZvckVhY2goZm46IChpdGVtOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogVFtdKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX3ZhbHVlcy5mb3JFYWNoKGZuKTsgfVxuXG4gIC8qKlxuICAgKiBTZWVcbiAgICogW0FycmF5LnNvbWVdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L3NvbWUpXG4gICAqL1xuICBzb21lKGZuOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUW10pID0+IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVzLnNvbWUoZm4pO1xuICB9XG5cbiAgdG9BcnJheSgpOiBUW10geyByZXR1cm4gdGhpcy5fdmFsdWVzLnNsaWNlKDApOyB9XG5cbiAgW2dldFN5bWJvbEl0ZXJhdG9yKCldKCk6IEl0ZXJhdG9yPFQ+IHsgcmV0dXJuICh0aGlzLl92YWx1ZXMgYXMgYW55KVtnZXRTeW1ib2xJdGVyYXRvcigpXSgpOyB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX3ZhbHVlcy50b1N0cmluZygpOyB9XG5cbiAgcmVzZXQocmVzOiAoYW55W118VClbXSk6IHZvaWQge1xuICAgIHRoaXMuX3ZhbHVlcyA9IGZsYXR0ZW4ocmVzKTtcbiAgICAodGhpcyBhc3tkaXJ0eTogYm9vbGVhbn0pLmRpcnR5ID0gZmFsc2U7XG4gIH1cblxuICBub3RpZnlPbkNoYW5nZXMoKTogdm9pZCB7ICh0aGlzLmNoYW5nZXMgYXMgRXZlbnRFbWl0dGVyPGFueT4pLmVtaXQodGhpcyk7IH1cbiAgc2V0RGlydHkoKTogdm9pZCB7ICh0aGlzIGFze2RpcnR5OiBib29sZWFufSkuZGlydHkgPSB0cnVlOyB9XG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgKHRoaXMuY2hhbmdlcyBhcyBFdmVudEVtaXR0ZXI8YW55PikuY29tcGxldGUoKTtcbiAgICAodGhpcy5jaGFuZ2VzIGFzIEV2ZW50RW1pdHRlcjxhbnk+KS51bnN1YnNjcmliZSgpO1xuICB9XG59XG5cbi8vIE5PVEU6IHRoaXMgaGFjayBpcyBoZXJlIGJlY2F1c2UgSVF1ZXJ5TGlzdCBoYXMgcHJpdmF0ZSBtZW1iZXJzIGFuZCB0aGVyZWZvcmVcbi8vIGl0IGNhbid0IGJlIGltcGxlbWVudGVkIG9ubHkgZXh0ZW5kZWQuXG5leHBvcnQgdHlwZSBRdWVyeUxpc3Q8VD4gPSB2aWV3RW5naW5lX1F1ZXJ5TGlzdDxUPjtcbmV4cG9ydCBjb25zdCBRdWVyeUxpc3Q6IHR5cGVvZiB2aWV3RW5naW5lX1F1ZXJ5TGlzdCA9IFF1ZXJ5TGlzdF8gYXMgYW55O1xuXG4vKipcbiAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBRdWVyeUxpc3QuXG4gKlxuICogQHBhcmFtIG1lbW9yeUluZGV4IFRoZSBpbmRleCBpbiBtZW1vcnkgd2hlcmUgdGhlIFF1ZXJ5TGlzdCBzaG91bGQgYmUgc2F2ZWQuIElmIG51bGwsXG4gKiB0aGlzIGlzIGlzIGEgY29udGVudCBxdWVyeSBhbmQgdGhlIFF1ZXJ5TGlzdCB3aWxsIGJlIHNhdmVkIGxhdGVyIHRocm91Z2ggZGlyZWN0aXZlQ3JlYXRlLlxuICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgdHlwZSBmb3Igd2hpY2ggdGhlIHF1ZXJ5IHdpbGwgc2VhcmNoXG4gKiBAcGFyYW0gZGVzY2VuZCBXaGV0aGVyIG9yIG5vdCB0byBkZXNjZW5kIGludG8gY2hpbGRyZW5cbiAqIEBwYXJhbSByZWFkIFdoYXQgdG8gc2F2ZSBpbiB0aGUgcXVlcnlcbiAqIEByZXR1cm5zIFF1ZXJ5TGlzdDxUPlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnk8VD4oXG4gICAgbWVtb3J5SW5kZXg6IG51bWJlciB8IG51bGwsIHByZWRpY2F0ZTogVHlwZTxhbnk+fCBzdHJpbmdbXSwgZGVzY2VuZD86IGJvb2xlYW4sXG4gICAgcmVhZD86IFF1ZXJ5UmVhZFR5cGU8VD58IFR5cGU8VD4pOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBxdWVyeUxpc3QgPSBuZXcgUXVlcnlMaXN0PFQ+KCk7XG4gIGNvbnN0IHF1ZXJpZXMgPSBnZXRDdXJyZW50UXVlcmllcyhMUXVlcmllc18pO1xuICBxdWVyaWVzLnRyYWNrKHF1ZXJ5TGlzdCwgcHJlZGljYXRlLCBkZXNjZW5kLCByZWFkKTtcbiAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobnVsbCwgcXVlcnlMaXN0LCBxdWVyeUxpc3QuZGVzdHJveSk7XG4gIGlmIChtZW1vcnlJbmRleCAhPSBudWxsKSB7XG4gICAgc3RvcmUobWVtb3J5SW5kZXgsIHF1ZXJ5TGlzdCk7XG4gIH1cbiAgcmV0dXJuIHF1ZXJ5TGlzdDtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYSBxdWVyeSBieSBjb21iaW5pbmcgbWF0Y2hlcyBmcm9tIGFsbCBhY3RpdmUgdmlld3MgYW5kIHJlbW92aW5nIG1hdGNoZXMgZnJvbSBkZWxldGVkXG4gKiB2aWV3cy5cbiAqIFJldHVybnMgdHJ1ZSBpZiBhIHF1ZXJ5IGdvdCBkaXJ0eSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgZmFsc2Ugb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnlSZWZyZXNoKHF1ZXJ5TGlzdDogUXVlcnlMaXN0PGFueT4pOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0SW1wbCA9IChxdWVyeUxpc3QgYXMgYW55IGFzIFF1ZXJ5TGlzdF88YW55Pik7XG4gIGlmIChxdWVyeUxpc3QuZGlydHkpIHtcbiAgICBxdWVyeUxpc3QucmVzZXQocXVlcnlMaXN0SW1wbC5fdmFsdWVzVHJlZSk7XG4gICAgcXVlcnlMaXN0Lm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==