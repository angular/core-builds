/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter } from '../event_emitter';
import { getSymbolIterator } from '../util';
import { assertEqual, assertNotNull } from './assert';
import { ReadFromInjectorFn, getOrCreateNodeInjectorForNode } from './di';
import { assertPreviousIsParent, getCurrentQueries, store } from './instructions';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/definition';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused4 } from './interfaces/query';
import { flatten } from './util';
var /** @type {?} */ unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4;
/**
 * A predicate which determines if a given element/directive should be included in the query
 * results.
 * @record
 * @template T
 */
export function QueryPredicate() { }
function QueryPredicate_tsickle_Closure_declarations() {
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
function LQuery_tsickle_Closure_declarations() {
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
}
var LQueries_ = /** @class */ (function () {
    function LQueries_(deep) {
        this.shallow = null;
        this.deep = null;
        this.deep = deep == null ? null : deep;
    }
    /**
     * @template T
     * @param {?} queryList
     * @param {?} predicate
     * @param {?=} descend
     * @param {?=} read
     * @return {?}
     */
    LQueries_.prototype.track = /**
     * @template T
     * @param {?} queryList
     * @param {?} predicate
     * @param {?=} descend
     * @param {?=} read
     * @return {?}
     */
    function (queryList, predicate, descend, read) {
        // TODO(misko): This is not right. In case of inherited state, a calling track will incorrectly
        // mutate parent.
        if (descend) {
            this.deep = createQuery(this.deep, queryList, predicate, read != null ? read : null);
        }
        else {
            this.shallow = createQuery(this.shallow, queryList, predicate, read != null ? read : null);
        }
    };
    /**
     * @return {?}
     */
    LQueries_.prototype.child = /**
     * @return {?}
     */
    function () {
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
    /**
     * @return {?}
     */
    LQueries_.prototype.container = /**
     * @return {?}
     */
    function () {
        var /** @type {?} */ result = null;
        var /** @type {?} */ query = this.deep;
        while (query) {
            var /** @type {?} */ containerValues = []; // prepare room for views
            query.values.push(containerValues);
            var /** @type {?} */ clonedQuery = { next: null, list: query.list, predicate: query.predicate, values: containerValues };
            clonedQuery.next = result;
            result = clonedQuery;
            query = query.next;
        }
        return result ? new LQueries_(result) : null;
    };
    /**
     * @param {?} index
     * @return {?}
     */
    LQueries_.prototype.enterView = /**
     * @param {?} index
     * @return {?}
     */
    function (index) {
        var /** @type {?} */ result = null;
        var /** @type {?} */ query = this.deep;
        while (query) {
            var /** @type {?} */ viewValues = []; // prepare room for view nodes
            query.values.splice(index, 0, viewValues);
            var /** @type {?} */ clonedQuery = { next: null, list: query.list, predicate: query.predicate, values: viewValues };
            clonedQuery.next = result;
            result = clonedQuery;
            query = query.next;
        }
        return result ? new LQueries_(result) : null;
    };
    /**
     * @param {?} node
     * @return {?}
     */
    LQueries_.prototype.addNode = /**
     * @param {?} node
     * @return {?}
     */
    function (node) {
        add(this.shallow, node);
        add(this.deep, node);
    };
    /**
     * @param {?} index
     * @return {?}
     */
    LQueries_.prototype.removeView = /**
     * @param {?} index
     * @return {?}
     */
    function (index) {
        var /** @type {?} */ query = this.deep;
        while (query) {
            var /** @type {?} */ removed = query.values.splice(index, 1);
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
function LQueries__tsickle_Closure_declarations() {
    /** @type {?} */
    LQueries_.prototype.shallow;
    /** @type {?} */
    LQueries_.prototype.deep;
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
    var /** @type {?} */ localNames = tNode.localNames;
    if (localNames) {
        for (var /** @type {?} */ i = 0; i < localNames.length; i += 2) {
            if (localNames[i] === selector) {
                return /** @type {?} */ (localNames[i + 1]);
            }
        }
    }
    return null;
}
/**
 * Iterates over all the directives for a node and returns index of a directive for a given type.
 *
 * @param {?} node Node on which directives are present.
 * @param {?} type Type of a directive to look for.
 * @return {?} Index of a found directive or null when none found.
 */
function getIdxOfMatchingDirective(node, type) {
    var /** @type {?} */ defs = /** @type {?} */ ((node.view.tView.directives));
    var /** @type {?} */ flags = /** @type {?} */ ((node.tNode)).flags;
    var /** @type {?} */ count = flags & 4095 /* DirectiveCountMask */;
    var /** @type {?} */ start = flags >> 13 /* DirectiveStartingIndexShift */;
    var /** @type {?} */ end = start + count;
    for (var /** @type {?} */ i = start; i < end; i++) {
        var /** @type {?} */ def = /** @type {?} */ (defs[i]);
        if (def.type === type && def.diPublic) {
            return i;
        }
    }
    return null;
}
/**
 * @param {?} nodeInjector
 * @param {?} node
 * @param {?} read
 * @param {?} directiveIdx
 * @return {?}
 */
function readFromNodeInjector(nodeInjector, node, read, directiveIdx) {
    if (read instanceof ReadFromInjectorFn) {
        return read.read(nodeInjector, node, directiveIdx);
    }
    else {
        var /** @type {?} */ matchingIdx = getIdxOfMatchingDirective(node, /** @type {?} */ (read));
        if (matchingIdx !== null) {
            return /** @type {?} */ ((node.view.directives))[matchingIdx];
        }
    }
    return null;
}
/**
 * @param {?} query
 * @param {?} node
 * @return {?}
 */
function add(query, node) {
    var /** @type {?} */ nodeInjector = getOrCreateNodeInjectorForNode(/** @type {?} */ (node));
    while (query) {
        var /** @type {?} */ predicate = query.predicate;
        var /** @type {?} */ type = predicate.type;
        if (type) {
            var /** @type {?} */ directiveIdx = getIdxOfMatchingDirective(node, type);
            if (directiveIdx !== null) {
                // a node is matching a predicate - determine what to read
                // if read token and / or strategy is not specified, use type as read token
                var /** @type {?} */ result = readFromNodeInjector(nodeInjector, node, predicate.read || type, directiveIdx);
                if (result !== null) {
                    addMatch(query, result);
                }
            }
        }
        else {
            var /** @type {?} */ selector = /** @type {?} */ ((predicate.selector));
            for (var /** @type {?} */ i = 0; i < selector.length; i++) {
                ngDevMode && assertNotNull(node.tNode, 'node.tNode');
                var /** @type {?} */ directiveIdx = getIdxOfMatchingSelector(/** @type {?} */ ((node.tNode)), selector[i]);
                if (directiveIdx !== null) {
                    // a node is matching a predicate - determine what to read
                    // note that queries using name selector must specify read strategy
                    ngDevMode && assertNotNull(predicate.read, 'the node should have a predicate');
                    var /** @type {?} */ result = readFromNodeInjector(nodeInjector, node, /** @type {?} */ ((predicate.read)), directiveIdx);
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
    var /** @type {?} */ isArray = Array.isArray(predicate);
    return {
        type: isArray ? null : /** @type {?} */ (predicate),
        selector: isArray ? /** @type {?} */ (predicate) : null,
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
        values: (/** @type {?} */ ((queryList)))._valuesTree
    };
}
/**
 * @template T
 */
var /**
 * @template T
 */
QueryList_ = /** @class */ (function () {
    function QueryList_() {
        this.dirty = true;
        this.changes = new EventEmitter();
        this._values = [];
        /**
         * \@internal
         */
        this._valuesTree = [];
    }
    Object.defineProperty(QueryList_.prototype, "length", {
        get: /**
         * @return {?}
         */
        function () { return this._values.length; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryList_.prototype, "first", {
        get: /**
         * @return {?}
         */
        function () {
            var /** @type {?} */ values = this._values;
            return values.length ? values[0] : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(QueryList_.prototype, "last", {
        get: /**
         * @return {?}
         */
        function () {
            var /** @type {?} */ values = this._values;
            return values.length ? values[values.length - 1] : null;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * See
     * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
     */
    /**
     * See
     * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
     * @template U
     * @param {?} fn
     * @return {?}
     */
    QueryList_.prototype.map = /**
     * See
     * [Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
     * @template U
     * @param {?} fn
     * @return {?}
     */
    function (fn) { return this._values.map(fn); };
    /**
     * See
     * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
     */
    /**
     * See
     * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
     * @param {?} fn
     * @return {?}
     */
    QueryList_.prototype.filter = /**
     * See
     * [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
     * @param {?} fn
     * @return {?}
     */
    function (fn) {
        return this._values.filter(fn);
    };
    /**
     * See
     * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
     */
    /**
     * See
     * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
     * @param {?} fn
     * @return {?}
     */
    QueryList_.prototype.find = /**
     * See
     * [Array.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
     * @param {?} fn
     * @return {?}
     */
    function (fn) {
        return this._values.find(fn);
    };
    /**
     * See
     * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
     */
    /**
     * See
     * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
     * @template U
     * @param {?} fn
     * @param {?} init
     * @return {?}
     */
    QueryList_.prototype.reduce = /**
     * See
     * [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)
     * @template U
     * @param {?} fn
     * @param {?} init
     * @return {?}
     */
    function (fn, init) {
        return this._values.reduce(fn, init);
    };
    /**
     * See
     * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
     */
    /**
     * See
     * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
     * @param {?} fn
     * @return {?}
     */
    QueryList_.prototype.forEach = /**
     * See
     * [Array.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
     * @param {?} fn
     * @return {?}
     */
    function (fn) { this._values.forEach(fn); };
    /**
     * See
     * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
     */
    /**
     * See
     * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
     * @param {?} fn
     * @return {?}
     */
    QueryList_.prototype.some = /**
     * See
     * [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
     * @param {?} fn
     * @return {?}
     */
    function (fn) {
        return this._values.some(fn);
    };
    /**
     * @return {?}
     */
    QueryList_.prototype.toArray = /**
     * @return {?}
     */
    function () { return this._values.slice(0); };
    /**
     * @return {?}
     */
    QueryList_.prototype[getSymbolIterator()] = /**
     * @return {?}
     */
    function () { return (/** @type {?} */ (this._values))[getSymbolIterator()](); };
    /**
     * @return {?}
     */
    QueryList_.prototype.toString = /**
     * @return {?}
     */
    function () { return this._values.toString(); };
    /**
     * @param {?} res
     * @return {?}
     */
    QueryList_.prototype.reset = /**
     * @param {?} res
     * @return {?}
     */
    function (res) {
        this._values = flatten(res);
        (/** @type {?} */ (this)).dirty = false;
    };
    /**
     * @return {?}
     */
    QueryList_.prototype.notifyOnChanges = /**
     * @return {?}
     */
    function () { (/** @type {?} */ (this.changes)).emit(this); };
    /**
     * @return {?}
     */
    QueryList_.prototype.setDirty = /**
     * @return {?}
     */
    function () { (/** @type {?} */ (this)).dirty = true; };
    /**
     * @return {?}
     */
    QueryList_.prototype.destroy = /**
     * @return {?}
     */
    function () {
        (/** @type {?} */ (this.changes)).complete();
        (/** @type {?} */ (this.changes)).unsubscribe();
    };
    return QueryList_;
}());
function QueryList__tsickle_Closure_declarations() {
    /** @type {?} */
    QueryList_.prototype.dirty;
    /** @type {?} */
    QueryList_.prototype.changes;
    /** @type {?} */
    QueryList_.prototype._values;
    /**
     * \@internal
     * @type {?}
     */
    QueryList_.prototype._valuesTree;
}
export var /** @type {?} */ QueryList = /** @type {?} */ (QueryList_);
/**
 * Creates and returns a QueryList.
 *
 * @template T
 * @param {?} memoryIndex The index in memory where the QueryList should be saved. If null,
 * this is is a content query and the QueryList will be saved later through directiveCreate.
 * @param {?} predicate The type for which the query will search
 * @param {?=} descend Whether or not to descend into children
 * @param {?=} read What to save in the query
 * @return {?} QueryList<T>
 */
export function query(memoryIndex, predicate, descend, read) {
    ngDevMode && assertPreviousIsParent();
    var /** @type {?} */ queryList = new QueryList();
    var /** @type {?} */ queries = getCurrentQueries(LQueries_);
    queries.track(queryList, predicate, descend, read);
    if (memoryIndex != null) {
        store(memoryIndex, queryList);
    }
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
    var /** @type {?} */ queryListImpl = (/** @type {?} */ ((queryList)));
    if (queryList.dirty) {
        queryList.reset(queryListImpl._valuesTree);
        queryList.notifyOnChanges();
        return true;
    }
    return false;
}
//# sourceMappingURL=query.js.map