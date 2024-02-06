/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createElementRef, ElementRef as ViewEngine_ElementRef } from '../linker/element_ref';
import { QueryList } from '../linker/query_list';
import { createTemplateRef, TemplateRef as ViewEngine_TemplateRef } from '../linker/template_ref';
import { createContainerRef, ViewContainerRef } from '../linker/view_container_ref';
import { assertDefined, assertIndexInRange, assertNumber, throwError } from '../util/assert';
import { stringify } from '../util/stringify';
import { assertFirstCreatePass, assertLContainer } from './assert';
import { getNodeInjectable, locateDirectiveOrProvider } from './di';
import { storeCleanupWithContext } from './instructions/shared';
import { CONTAINER_HEADER_OFFSET, MOVED_VIEWS } from './interfaces/container';
import { DECLARATION_LCONTAINER, PARENT, QUERIES, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { getCurrentTNode, getLView, getTView } from './state';
class LQuery_ {
    constructor(queryList) {
        this.queryList = queryList;
        this.matches = null;
    }
    clone() {
        return new LQuery_(this.queryList);
    }
    setDirty() {
        this.queryList.setDirty();
    }
}
class LQueries_ {
    constructor(queries = []) {
        this.queries = queries;
    }
    createEmbeddedView(tView) {
        const tQueries = tView.queries;
        if (tQueries !== null) {
            const noOfInheritedQueries = tView.contentQueries !== null ? tView.contentQueries[0] : tQueries.length;
            const viewLQueries = [];
            // An embedded view has queries propagated from a declaration view at the beginning of the
            // TQueries collection and up until a first content query declared in the embedded view. Only
            // propagated LQueries are created at this point (LQuery corresponding to declared content
            // queries will be instantiated from the content query instructions for each directive).
            for (let i = 0; i < noOfInheritedQueries; i++) {
                const tQuery = tQueries.getByIndex(i);
                const parentLQuery = this.queries[tQuery.indexInDeclarationView];
                viewLQueries.push(parentLQuery.clone());
            }
            return new LQueries_(viewLQueries);
        }
        return null;
    }
    insertView(tView) {
        this.dirtyQueriesWithMatches(tView);
    }
    detachView(tView) {
        this.dirtyQueriesWithMatches(tView);
    }
    finishViewCreation(tView) {
        this.dirtyQueriesWithMatches(tView);
    }
    dirtyQueriesWithMatches(tView) {
        for (let i = 0; i < this.queries.length; i++) {
            if (getTQuery(tView, i).matches !== null) {
                this.queries[i].setDirty();
            }
        }
    }
}
export class TQueryMetadata_ {
    constructor(predicate, flags, read = null) {
        this.flags = flags;
        this.read = read;
        // Compiler might not be able to pre-optimize and split multiple selectors.
        if (typeof predicate === 'string') {
            this.predicate = splitQueryMultiSelectors(predicate);
        }
        else {
            this.predicate = predicate;
        }
    }
}
class TQueries_ {
    constructor(queries = []) {
        this.queries = queries;
    }
    elementStart(tView, tNode) {
        ngDevMode &&
            assertFirstCreatePass(tView, 'Queries should collect results on the first template pass only');
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].elementStart(tView, tNode);
        }
    }
    elementEnd(tNode) {
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].elementEnd(tNode);
        }
    }
    embeddedTView(tNode) {
        let queriesForTemplateRef = null;
        for (let i = 0; i < this.length; i++) {
            const childQueryIndex = queriesForTemplateRef !== null ? queriesForTemplateRef.length : 0;
            const tqueryClone = this.getByIndex(i).embeddedTView(tNode, childQueryIndex);
            if (tqueryClone) {
                tqueryClone.indexInDeclarationView = i;
                if (queriesForTemplateRef !== null) {
                    queriesForTemplateRef.push(tqueryClone);
                }
                else {
                    queriesForTemplateRef = [tqueryClone];
                }
            }
        }
        return queriesForTemplateRef !== null ? new TQueries_(queriesForTemplateRef) : null;
    }
    template(tView, tNode) {
        ngDevMode &&
            assertFirstCreatePass(tView, 'Queries should collect results on the first template pass only');
        for (let i = 0; i < this.queries.length; i++) {
            this.queries[i].template(tView, tNode);
        }
    }
    getByIndex(index) {
        ngDevMode && assertIndexInRange(this.queries, index);
        return this.queries[index];
    }
    get length() {
        return this.queries.length;
    }
    track(tquery) {
        this.queries.push(tquery);
    }
}
class TQuery_ {
    constructor(metadata, nodeIndex = -1) {
        this.metadata = metadata;
        this.matches = null;
        this.indexInDeclarationView = -1;
        this.crossesNgTemplate = false;
        /**
         * A flag indicating if a given query still applies to nodes it is crossing. We use this flag
         * (alongside with _declarationNodeIndex) to know when to stop applying content queries to
         * elements in a template.
         */
        this._appliesToNextNode = true;
        this._declarationNodeIndex = nodeIndex;
    }
    elementStart(tView, tNode) {
        if (this.isApplyingToNode(tNode)) {
            this.matchTNode(tView, tNode);
        }
    }
    elementEnd(tNode) {
        if (this._declarationNodeIndex === tNode.index) {
            this._appliesToNextNode = false;
        }
    }
    template(tView, tNode) {
        this.elementStart(tView, tNode);
    }
    embeddedTView(tNode, childQueryIndex) {
        if (this.isApplyingToNode(tNode)) {
            this.crossesNgTemplate = true;
            // A marker indicating a `<ng-template>` element (a placeholder for query results from
            // embedded views created based on this `<ng-template>`).
            this.addMatch(-tNode.index, childQueryIndex);
            return new TQuery_(this.metadata);
        }
        return null;
    }
    isApplyingToNode(tNode) {
        if (this._appliesToNextNode &&
            (this.metadata.flags & 1 /* QueryFlags.descendants */) !== 1 /* QueryFlags.descendants */) {
            const declarationNodeIdx = this._declarationNodeIndex;
            let parent = tNode.parent;
            // Determine if a given TNode is a "direct" child of a node on which a content query was
            // declared (only direct children of query's host node can match with the descendants: false
            // option). There are 3 main use-case / conditions to consider here:
            // - <needs-target><i #target></i></needs-target>: here <i #target> parent node is a query
            // host node;
            // - <needs-target><ng-template [ngIf]="true"><i #target></i></ng-template></needs-target>:
            // here <i #target> parent node is null;
            // - <needs-target><ng-container><i #target></i></ng-container></needs-target>: here we need
            // to go past `<ng-container>` to determine <i #target> parent node (but we shouldn't traverse
            // up past the query's host node!).
            while (parent !== null && (parent.type & 8 /* TNodeType.ElementContainer */) &&
                parent.index !== declarationNodeIdx) {
                parent = parent.parent;
            }
            return declarationNodeIdx === (parent !== null ? parent.index : -1);
        }
        return this._appliesToNextNode;
    }
    matchTNode(tView, tNode) {
        const predicate = this.metadata.predicate;
        if (Array.isArray(predicate)) {
            for (let i = 0; i < predicate.length; i++) {
                const name = predicate[i];
                this.matchTNodeWithReadOption(tView, tNode, getIdxOfMatchingSelector(tNode, name));
                // Also try matching the name to a provider since strings can be used as DI tokens too.
                this.matchTNodeWithReadOption(tView, tNode, locateDirectiveOrProvider(tNode, tView, name, false, false));
            }
        }
        else {
            if (predicate === ViewEngine_TemplateRef) {
                if (tNode.type & 4 /* TNodeType.Container */) {
                    this.matchTNodeWithReadOption(tView, tNode, -1);
                }
            }
            else {
                this.matchTNodeWithReadOption(tView, tNode, locateDirectiveOrProvider(tNode, tView, predicate, false, false));
            }
        }
    }
    matchTNodeWithReadOption(tView, tNode, nodeMatchIdx) {
        if (nodeMatchIdx !== null) {
            const read = this.metadata.read;
            if (read !== null) {
                if (read === ViewEngine_ElementRef || read === ViewContainerRef ||
                    read === ViewEngine_TemplateRef && (tNode.type & 4 /* TNodeType.Container */)) {
                    this.addMatch(tNode.index, -2);
                }
                else {
                    const directiveOrProviderIdx = locateDirectiveOrProvider(tNode, tView, read, false, false);
                    if (directiveOrProviderIdx !== null) {
                        this.addMatch(tNode.index, directiveOrProviderIdx);
                    }
                }
            }
            else {
                this.addMatch(tNode.index, nodeMatchIdx);
            }
        }
    }
    addMatch(tNodeIdx, matchIdx) {
        if (this.matches === null) {
            this.matches = [tNodeIdx, matchIdx];
        }
        else {
            this.matches.push(tNodeIdx, matchIdx);
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
    if (localNames !== null) {
        for (let i = 0; i < localNames.length; i += 2) {
            if (localNames[i] === selector) {
                return localNames[i + 1];
            }
        }
    }
    return null;
}
function createResultByTNodeType(tNode, currentView) {
    if (tNode.type & (3 /* TNodeType.AnyRNode */ | 8 /* TNodeType.ElementContainer */)) {
        return createElementRef(tNode, currentView);
    }
    else if (tNode.type & 4 /* TNodeType.Container */) {
        return createTemplateRef(tNode, currentView);
    }
    return null;
}
function createResultForNode(lView, tNode, matchingIdx, read) {
    if (matchingIdx === -1) {
        // if read token and / or strategy is not specified, detect it using appropriate tNode type
        return createResultByTNodeType(tNode, lView);
    }
    else if (matchingIdx === -2) {
        // read a special token from a node injector
        return createSpecialToken(lView, tNode, read);
    }
    else {
        // read a token
        return getNodeInjectable(lView, lView[TVIEW], matchingIdx, tNode);
    }
}
function createSpecialToken(lView, tNode, read) {
    if (read === ViewEngine_ElementRef) {
        return createElementRef(tNode, lView);
    }
    else if (read === ViewEngine_TemplateRef) {
        return createTemplateRef(tNode, lView);
    }
    else if (read === ViewContainerRef) {
        ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */);
        return createContainerRef(tNode, lView);
    }
    else {
        ngDevMode &&
            throwError(`Special token to read should be one of ElementRef, TemplateRef or ViewContainerRef but got ${stringify(read)}.`);
    }
}
/**
 * A helper function that creates query results for a given view. This function is meant to do the
 * processing once and only once for a given view instance (a set of results for a given view
 * doesn't change).
 */
export function materializeViewResults(tView, lView, tQuery, queryIndex) {
    const lQuery = lView[QUERIES].queries[queryIndex];
    if (lQuery.matches === null) {
        const tViewData = tView.data;
        const tQueryMatches = tQuery.matches;
        const result = [];
        for (let i = 0; i < tQueryMatches.length; i += 2) {
            const matchedNodeIdx = tQueryMatches[i];
            if (matchedNodeIdx < 0) {
                // we at the <ng-template> marker which might have results in views created based on this
                // <ng-template> - those results will be in separate views though, so here we just leave
                // null as a placeholder
                result.push(null);
            }
            else {
                ngDevMode && assertIndexInRange(tViewData, matchedNodeIdx);
                const tNode = tViewData[matchedNodeIdx];
                result.push(createResultForNode(lView, tNode, tQueryMatches[i + 1], tQuery.metadata.read));
            }
        }
        lQuery.matches = result;
    }
    return lQuery.matches;
}
/**
 * A helper function that collects (already materialized) query results from a tree of views,
 * starting with a provided LView.
 */
export function collectQueryResults(tView, lView, queryIndex, result) {
    const tQuery = tView.queries.getByIndex(queryIndex);
    const tQueryMatches = tQuery.matches;
    if (tQueryMatches !== null) {
        const lViewResults = materializeViewResults(tView, lView, tQuery, queryIndex);
        for (let i = 0; i < tQueryMatches.length; i += 2) {
            const tNodeIdx = tQueryMatches[i];
            if (tNodeIdx > 0) {
                result.push(lViewResults[i / 2]);
            }
            else {
                const childQueryIndex = tQueryMatches[i + 1];
                const declarationLContainer = lView[-tNodeIdx];
                ngDevMode && assertLContainer(declarationLContainer);
                // collect matches for views inserted in this container
                for (let i = CONTAINER_HEADER_OFFSET; i < declarationLContainer.length; i++) {
                    const embeddedLView = declarationLContainer[i];
                    if (embeddedLView[DECLARATION_LCONTAINER] === embeddedLView[PARENT]) {
                        collectQueryResults(embeddedLView[TVIEW], embeddedLView, childQueryIndex, result);
                    }
                }
                // collect matches for views created from this declaration container and inserted into
                // different containers
                if (declarationLContainer[MOVED_VIEWS] !== null) {
                    const embeddedLViews = declarationLContainer[MOVED_VIEWS];
                    for (let i = 0; i < embeddedLViews.length; i++) {
                        const embeddedLView = embeddedLViews[i];
                        collectQueryResults(embeddedLView[TVIEW], embeddedLView, childQueryIndex, result);
                    }
                }
            }
        }
    }
    return result;
}
export function loadQueryInternal(lView, queryIndex) {
    ngDevMode &&
        assertDefined(lView[QUERIES], 'LQueries should be defined when trying to load a query');
    ngDevMode && assertIndexInRange(lView[QUERIES].queries, queryIndex);
    return lView[QUERIES].queries[queryIndex].queryList;
}
/**
 * Creates a new instance of LQuery and returns its index in the collection of LQuery objects.
 *
 * @returns index in the collection of LQuery objects
 */
function createLQuery(tView, lView, flags) {
    const queryList = new QueryList((flags & 4 /* QueryFlags.emitDistinctChangesOnly */) === 4 /* QueryFlags.emitDistinctChangesOnly */);
    storeCleanupWithContext(tView, lView, queryList, queryList.destroy);
    const lQueries = (lView[QUERIES] ??= new LQueries_()).queries;
    return lQueries.push(new LQuery_(queryList)) - 1;
}
export function createViewQuery(predicate, flags, read) {
    ngDevMode && assertNumber(flags, 'Expecting flags');
    const tView = getTView();
    if (tView.firstCreatePass) {
        createTQuery(tView, new TQueryMetadata_(predicate, flags, read), -1);
        if ((flags & 2 /* QueryFlags.isStatic */) === 2 /* QueryFlags.isStatic */) {
            tView.staticViewQueries = true;
        }
    }
    return createLQuery(tView, getLView(), flags);
}
export function createContentQuery(directiveIndex, predicate, flags, read) {
    ngDevMode && assertNumber(flags, 'Expecting flags');
    const tView = getTView();
    if (tView.firstCreatePass) {
        const tNode = getCurrentTNode();
        createTQuery(tView, new TQueryMetadata_(predicate, flags, read), tNode.index);
        saveContentQueryAndDirectiveIndex(tView, directiveIndex);
        if ((flags & 2 /* QueryFlags.isStatic */) === 2 /* QueryFlags.isStatic */) {
            tView.staticContentQueries = true;
        }
    }
    return createLQuery(tView, getLView(), flags);
}
/** Splits multiple selectors in the locator. */
function splitQueryMultiSelectors(locator) {
    return locator.split(',').map(s => s.trim());
}
export function createTQuery(tView, metadata, nodeIndex) {
    if (tView.queries === null)
        tView.queries = new TQueries_();
    tView.queries.track(new TQuery_(metadata, nodeIndex));
}
export function saveContentQueryAndDirectiveIndex(tView, directiveIndex) {
    const tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
    const lastSavedDirectiveIndex = tViewContentQueries.length ? tViewContentQueries[tViewContentQueries.length - 1] : -1;
    if (directiveIndex !== lastSavedDirectiveIndex) {
        tViewContentQueries.push(tView.queries.length - 1, directiveIndex);
    }
}
export function getTQuery(tView, index) {
    ngDevMode && assertDefined(tView.queries, 'TQueries must be defined to retrieve a TQuery');
    return tView.queries.getByIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1ILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxVQUFVLElBQUkscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzNGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDakUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHlCQUF5QixFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ2xFLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzlELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUd4RixPQUFPLEVBQUMsc0JBQXNCLEVBQVMsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUMvRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU1RCxN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S0FBSyxDQUFDLE9BQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuXG5pbXBvcnQge1Byb3ZpZGVyVG9rZW59IGZyb20gJy4uL2RpL3Byb3ZpZGVyX3Rva2VuJztcbmltcG9ydCB7Y3JlYXRlRWxlbWVudFJlZiwgRWxlbWVudFJlZiBhcyBWaWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyL3F1ZXJ5X2xpc3QnO1xuaW1wb3J0IHtjcmVhdGVUZW1wbGF0ZVJlZiwgVGVtcGxhdGVSZWYgYXMgVmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge2NyZWF0ZUNvbnRhaW5lclJlZiwgVmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEluZGV4SW5SYW5nZSwgYXNzZXJ0TnVtYmVyLCB0aHJvd0Vycm9yfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lcn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXROb2RlSW5qZWN0YWJsZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3N0b3JlQ2xlYW51cFdpdGhDb250ZXh0fSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIExRdWVyeSwgUXVlcnlGbGFncywgVFF1ZXJpZXMsIFRRdWVyeSwgVFF1ZXJ5TWV0YWRhdGF9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX0xDT05UQUlORVIsIExWaWV3LCBQQVJFTlQsIFFVRVJJRVMsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBnZXRUVmlld30gZnJvbSAnLi9zdGF0ZSc7XG5cbmNsYXNzIExRdWVyeV88VD4gaW1wbGVtZW50cyBMUXVlcnk8VD4ge1xuICBtYXRjaGVzOiAoVHxudWxsKVtdfG51bGwgPSBudWxsO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8VD4pIHt9XG4gIGNsb25lKCk6IExRdWVyeTxUPiB7XG4gICAgcmV0dXJuIG5ldyBMUXVlcnlfKHRoaXMucXVlcnlMaXN0KTtcbiAgfVxuICBzZXREaXJ0eSgpOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXJ5TGlzdC5zZXREaXJ0eSgpO1xuICB9XG59XG5cbmNsYXNzIExRdWVyaWVzXyBpbXBsZW1lbnRzIExRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHVibGljIHF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXSkge31cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcodFZpZXc6IFRWaWV3KTogTFF1ZXJpZXN8bnVsbCB7XG4gICAgY29uc3QgdFF1ZXJpZXMgPSB0Vmlldy5xdWVyaWVzO1xuICAgIGlmICh0UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgbm9PZkluaGVyaXRlZFF1ZXJpZXMgPVxuICAgICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsID8gdFZpZXcuY29udGVudFF1ZXJpZXNbMF0gOiB0UXVlcmllcy5sZW5ndGg7XG4gICAgICBjb25zdCB2aWV3TFF1ZXJpZXM6IExRdWVyeTxhbnk+W10gPSBbXTtcblxuICAgICAgLy8gQW4gZW1iZWRkZWQgdmlldyBoYXMgcXVlcmllcyBwcm9wYWdhdGVkIGZyb20gYSBkZWNsYXJhdGlvbiB2aWV3IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gICAgICAvLyBUUXVlcmllcyBjb2xsZWN0aW9uIGFuZCB1cCB1bnRpbCBhIGZpcnN0IGNvbnRlbnQgcXVlcnkgZGVjbGFyZWQgaW4gdGhlIGVtYmVkZGVkIHZpZXcuIE9ubHlcbiAgICAgIC8vIHByb3BhZ2F0ZWQgTFF1ZXJpZXMgYXJlIGNyZWF0ZWQgYXQgdGhpcyBwb2ludCAoTFF1ZXJ5IGNvcnJlc3BvbmRpbmcgdG8gZGVjbGFyZWQgY29udGVudFxuICAgICAgLy8gcXVlcmllcyB3aWxsIGJlIGluc3RhbnRpYXRlZCBmcm9tIHRoZSBjb250ZW50IHF1ZXJ5IGluc3RydWN0aW9ucyBmb3IgZWFjaCBkaXJlY3RpdmUpLlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mSW5oZXJpdGVkUXVlcmllczsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHRRdWVyeSA9IHRRdWVyaWVzLmdldEJ5SW5kZXgoaSk7XG4gICAgICAgIGNvbnN0IHBhcmVudExRdWVyeSA9IHRoaXMucXVlcmllc1t0UXVlcnkuaW5kZXhJbkRlY2xhcmF0aW9uVmlld107XG4gICAgICAgIHZpZXdMUXVlcmllcy5wdXNoKHBhcmVudExRdWVyeS5jbG9uZSgpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBMUXVlcmllc18odmlld0xRdWVyaWVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGluc2VydFZpZXcodFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gICAgdGhpcy5kaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0Vmlldyk7XG4gIH1cblxuICBkZXRhY2hWaWV3KHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICAgIHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpO1xuICB9XG5cbiAgZmluaXNoVmlld0NyZWF0aW9uKHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICAgIHRoaXMuZGlydHlRdWVyaWVzV2l0aE1hdGNoZXModFZpZXcpO1xuICB9XG5cbiAgcHJpdmF0ZSBkaXJ0eVF1ZXJpZXNXaXRoTWF0Y2hlcyh0VmlldzogVFZpZXcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGdldFRRdWVyeSh0VmlldywgaSkubWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnF1ZXJpZXNbaV0uc2V0RGlydHkoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRRdWVyeU1ldGFkYXRhXyBpbXBsZW1lbnRzIFRRdWVyeU1ldGFkYXRhIHtcbiAgcHVibGljIHByZWRpY2F0ZTogUHJvdmlkZXJUb2tlbjx1bmtub3duPnxzdHJpbmdbXTtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcmVkaWNhdGU6IFByb3ZpZGVyVG9rZW48dW5rbm93bj58c3RyaW5nW118c3RyaW5nLCBwdWJsaWMgZmxhZ3M6IFF1ZXJ5RmxhZ3MsXG4gICAgICBwdWJsaWMgcmVhZDogYW55ID0gbnVsbCkge1xuICAgIC8vIENvbXBpbGVyIG1pZ2h0IG5vdCBiZSBhYmxlIHRvIHByZS1vcHRpbWl6ZSBhbmQgc3BsaXQgbXVsdGlwbGUgc2VsZWN0b3JzLlxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5wcmVkaWNhdGUgPSBzcGxpdFF1ZXJ5TXVsdGlTZWxlY3RvcnMocHJlZGljYXRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcmVkaWNhdGUgPSBwcmVkaWNhdGU7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFRRdWVyaWVzXyBpbXBsZW1lbnRzIFRRdWVyaWVzIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBxdWVyaWVzOiBUUXVlcnlbXSA9IFtdKSB7fVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cbiAgZWxlbWVudEVuZCh0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5xdWVyaWVzW2ldLmVsZW1lbnRFbmQodE5vZGUpO1xuICAgIH1cbiAgfVxuICBlbWJlZGRlZFRWaWV3KHROb2RlOiBUTm9kZSk6IFRRdWVyaWVzfG51bGwge1xuICAgIGxldCBxdWVyaWVzRm9yVGVtcGxhdGVSZWY6IFRRdWVyeVtdfG51bGwgPSBudWxsO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgIT09IG51bGwgPyBxdWVyaWVzRm9yVGVtcGxhdGVSZWYubGVuZ3RoIDogMDtcbiAgICAgIGNvbnN0IHRxdWVyeUNsb25lID0gdGhpcy5nZXRCeUluZGV4KGkpLmVtYmVkZGVkVFZpZXcodE5vZGUsIGNoaWxkUXVlcnlJbmRleCk7XG5cbiAgICAgIGlmICh0cXVlcnlDbG9uZSkge1xuICAgICAgICB0cXVlcnlDbG9uZS5pbmRleEluRGVjbGFyYXRpb25WaWV3ID0gaTtcbiAgICAgICAgaWYgKHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCkge1xuICAgICAgICAgIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZi5wdXNoKHRxdWVyeUNsb25lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxdWVyaWVzRm9yVGVtcGxhdGVSZWYgPSBbdHF1ZXJ5Q2xvbmVdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJpZXNGb3JUZW1wbGF0ZVJlZiAhPT0gbnVsbCA/IG5ldyBUUXVlcmllc18ocXVlcmllc0ZvclRlbXBsYXRlUmVmKSA6IG51bGw7XG4gIH1cblxuICB0ZW1wbGF0ZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgICB0VmlldywgJ1F1ZXJpZXMgc2hvdWxkIGNvbGxlY3QgcmVzdWx0cyBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMucXVlcmllc1tpXS50ZW1wbGF0ZSh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGdldEJ5SW5kZXgoaW5kZXg6IG51bWJlcik6IFRRdWVyeSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZSh0aGlzLnF1ZXJpZXMsIGluZGV4KTtcbiAgICByZXR1cm4gdGhpcy5xdWVyaWVzW2luZGV4XTtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyaWVzLmxlbmd0aDtcbiAgfVxuXG4gIHRyYWNrKHRxdWVyeTogVFF1ZXJ5KTogdm9pZCB7XG4gICAgdGhpcy5xdWVyaWVzLnB1c2godHF1ZXJ5KTtcbiAgfVxufVxuXG5jbGFzcyBUUXVlcnlfIGltcGxlbWVudHMgVFF1ZXJ5IHtcbiAgbWF0Y2hlczogbnVtYmVyW118bnVsbCA9IG51bGw7XG4gIGluZGV4SW5EZWNsYXJhdGlvblZpZXcgPSAtMTtcbiAgY3Jvc3Nlc05nVGVtcGxhdGUgPSBmYWxzZTtcblxuICAvKipcbiAgICogQSBub2RlIGluZGV4IG9uIHdoaWNoIGEgcXVlcnkgd2FzIGRlY2xhcmVkICgtMSBmb3IgdmlldyBxdWVyaWVzIGFuZCBvbmVzIGluaGVyaXRlZCBmcm9tIHRoZVxuICAgKiBkZWNsYXJhdGlvbiB0ZW1wbGF0ZSkuIFdlIHVzZSB0aGlzIGluZGV4IChhbG9uZ3NpZGUgd2l0aCBfYXBwbGllc1RvTmV4dE5vZGUgZmxhZykgdG8ga25vd1xuICAgKiB3aGVuIHRvIGFwcGx5IGNvbnRlbnQgcXVlcmllcyB0byBlbGVtZW50cyBpbiBhIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBfZGVjbGFyYXRpb25Ob2RlSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQSBmbGFnIGluZGljYXRpbmcgaWYgYSBnaXZlbiBxdWVyeSBzdGlsbCBhcHBsaWVzIHRvIG5vZGVzIGl0IGlzIGNyb3NzaW5nLiBXZSB1c2UgdGhpcyBmbGFnXG4gICAqIChhbG9uZ3NpZGUgd2l0aCBfZGVjbGFyYXRpb25Ob2RlSW5kZXgpIHRvIGtub3cgd2hlbiB0byBzdG9wIGFwcGx5aW5nIGNvbnRlbnQgcXVlcmllcyB0b1xuICAgKiBlbGVtZW50cyBpbiBhIHRlbXBsYXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBfYXBwbGllc1RvTmV4dE5vZGUgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBtZXRhZGF0YTogVFF1ZXJ5TWV0YWRhdGEsIG5vZGVJbmRleDogbnVtYmVyID0gLTEpIHtcbiAgICB0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9IG5vZGVJbmRleDtcbiAgfVxuXG4gIGVsZW1lbnRTdGFydCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzQXBwbHlpbmdUb05vZGUodE5vZGUpKSB7XG4gICAgICB0aGlzLm1hdGNoVE5vZGUodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cblxuICBlbGVtZW50RW5kKHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZWNsYXJhdGlvbk5vZGVJbmRleCA9PT0gdE5vZGUuaW5kZXgpIHtcbiAgICAgIHRoaXMuX2FwcGxpZXNUb05leHROb2RlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgdGVtcGxhdGUodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgICB0aGlzLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICB9XG5cbiAgZW1iZWRkZWRUVmlldyh0Tm9kZTogVE5vZGUsIGNoaWxkUXVlcnlJbmRleDogbnVtYmVyKTogVFF1ZXJ5fG51bGwge1xuICAgIGlmICh0aGlzLmlzQXBwbHlpbmdUb05vZGUodE5vZGUpKSB7XG4gICAgICB0aGlzLmNyb3NzZXNOZ1RlbXBsYXRlID0gdHJ1ZTtcbiAgICAgIC8vIEEgbWFya2VyIGluZGljYXRpbmcgYSBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudCAoYSBwbGFjZWhvbGRlciBmb3IgcXVlcnkgcmVzdWx0cyBmcm9tXG4gICAgICAvLyBlbWJlZGRlZCB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXMgYDxuZy10ZW1wbGF0ZT5gKS5cbiAgICAgIHRoaXMuYWRkTWF0Y2goLXROb2RlLmluZGV4LCBjaGlsZFF1ZXJ5SW5kZXgpO1xuICAgICAgcmV0dXJuIG5ldyBUUXVlcnlfKHRoaXMubWV0YWRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgaXNBcHBseWluZ1RvTm9kZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fYXBwbGllc1RvTmV4dE5vZGUgJiZcbiAgICAgICAgKHRoaXMubWV0YWRhdGEuZmxhZ3MgJiBRdWVyeUZsYWdzLmRlc2NlbmRhbnRzKSAhPT0gUXVlcnlGbGFncy5kZXNjZW5kYW50cykge1xuICAgICAgY29uc3QgZGVjbGFyYXRpb25Ob2RlSWR4ID0gdGhpcy5fZGVjbGFyYXRpb25Ob2RlSW5kZXg7XG4gICAgICBsZXQgcGFyZW50ID0gdE5vZGUucGFyZW50O1xuICAgICAgLy8gRGV0ZXJtaW5lIGlmIGEgZ2l2ZW4gVE5vZGUgaXMgYSBcImRpcmVjdFwiIGNoaWxkIG9mIGEgbm9kZSBvbiB3aGljaCBhIGNvbnRlbnQgcXVlcnkgd2FzXG4gICAgICAvLyBkZWNsYXJlZCAob25seSBkaXJlY3QgY2hpbGRyZW4gb2YgcXVlcnkncyBob3N0IG5vZGUgY2FuIG1hdGNoIHdpdGggdGhlIGRlc2NlbmRhbnRzOiBmYWxzZVxuICAgICAgLy8gb3B0aW9uKS4gVGhlcmUgYXJlIDMgbWFpbiB1c2UtY2FzZSAvIGNvbmRpdGlvbnMgdG8gY29uc2lkZXIgaGVyZTpcbiAgICAgIC8vIC0gPG5lZWRzLXRhcmdldD48aSAjdGFyZ2V0PjwvaT48L25lZWRzLXRhcmdldD46IGhlcmUgPGkgI3RhcmdldD4gcGFyZW50IG5vZGUgaXMgYSBxdWVyeVxuICAgICAgLy8gaG9zdCBub2RlO1xuICAgICAgLy8gLSA8bmVlZHMtdGFyZ2V0PjxuZy10ZW1wbGF0ZSBbbmdJZl09XCJ0cnVlXCI+PGkgI3RhcmdldD48L2k+PC9uZy10ZW1wbGF0ZT48L25lZWRzLXRhcmdldD46XG4gICAgICAvLyBoZXJlIDxpICN0YXJnZXQ+IHBhcmVudCBub2RlIGlzIG51bGw7XG4gICAgICAvLyAtIDxuZWVkcy10YXJnZXQ+PG5nLWNvbnRhaW5lcj48aSAjdGFyZ2V0PjwvaT48L25nLWNvbnRhaW5lcj48L25lZWRzLXRhcmdldD46IGhlcmUgd2UgbmVlZFxuICAgICAgLy8gdG8gZ28gcGFzdCBgPG5nLWNvbnRhaW5lcj5gIHRvIGRldGVybWluZSA8aSAjdGFyZ2V0PiBwYXJlbnQgbm9kZSAoYnV0IHdlIHNob3VsZG4ndCB0cmF2ZXJzZVxuICAgICAgLy8gdXAgcGFzdCB0aGUgcXVlcnkncyBob3N0IG5vZGUhKS5cbiAgICAgIHdoaWxlIChwYXJlbnQgIT09IG51bGwgJiYgKHBhcmVudC50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpICYmXG4gICAgICAgICAgICAgcGFyZW50LmluZGV4ICE9PSBkZWNsYXJhdGlvbk5vZGVJZHgpIHtcbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWNsYXJhdGlvbk5vZGVJZHggPT09IChwYXJlbnQgIT09IG51bGwgPyBwYXJlbnQuaW5kZXggOiAtMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9hcHBsaWVzVG9OZXh0Tm9kZTtcbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hUTm9kZSh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IHRoaXMubWV0YWRhdGEucHJlZGljYXRlO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHByZWRpY2F0ZSkpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZGljYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBwcmVkaWNhdGVbaV07XG4gICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3LCB0Tm9kZSwgZ2V0SWR4T2ZNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBuYW1lKSk7XG4gICAgICAgIC8vIEFsc28gdHJ5IG1hdGNoaW5nIHRoZSBuYW1lIHRvIGEgcHJvdmlkZXIgc2luY2Ugc3RyaW5ncyBjYW4gYmUgdXNlZCBhcyBESSB0b2tlbnMgdG9vLlxuICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbihcbiAgICAgICAgICAgIHRWaWV3LCB0Tm9kZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIG5hbWUsIGZhbHNlLCBmYWxzZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoKHByZWRpY2F0ZSBhcyBhbnkpID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgICAgIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIHRoaXMubWF0Y2hUTm9kZVdpdGhSZWFkT3B0aW9uKHRWaWV3LCB0Tm9kZSwgLTEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1hdGNoVE5vZGVXaXRoUmVhZE9wdGlvbihcbiAgICAgICAgICAgIHRWaWV3LCB0Tm9kZSwgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgdFZpZXcsIHByZWRpY2F0ZSwgZmFsc2UsIGZhbHNlKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaFROb2RlV2l0aFJlYWRPcHRpb24odFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIG5vZGVNYXRjaElkeDogbnVtYmVyfG51bGwpOiB2b2lkIHtcbiAgICBpZiAobm9kZU1hdGNoSWR4ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCByZWFkID0gdGhpcy5tZXRhZGF0YS5yZWFkO1xuICAgICAgaWYgKHJlYWQgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfRWxlbWVudFJlZiB8fCByZWFkID09PSBWaWV3Q29udGFpbmVyUmVmIHx8XG4gICAgICAgICAgICByZWFkID09PSBWaWV3RW5naW5lX1RlbXBsYXRlUmVmICYmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkNvbnRhaW5lcikpIHtcbiAgICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCAtMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aXZlT3JQcm92aWRlcklkeCA9XG4gICAgICAgICAgICAgIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIodE5vZGUsIHRWaWV3LCByZWFkLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgIGlmIChkaXJlY3RpdmVPclByb3ZpZGVySWR4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1hdGNoKHROb2RlLmluZGV4LCBkaXJlY3RpdmVPclByb3ZpZGVySWR4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWRkTWF0Y2godE5vZGUuaW5kZXgsIG5vZGVNYXRjaElkeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRNYXRjaCh0Tm9kZUlkeDogbnVtYmVyLCBtYXRjaElkeDogbnVtYmVyKSB7XG4gICAgaWYgKHRoaXMubWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5tYXRjaGVzID0gW3ROb2RlSWR4LCBtYXRjaElkeF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWF0Y2hlcy5wdXNoKHROb2RlSWR4LCBtYXRjaElkeCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBsb2NhbCBuYW1lcyBmb3IgYSBnaXZlbiBub2RlIGFuZCByZXR1cm5zIGRpcmVjdGl2ZSBpbmRleFxuICogKG9yIC0xIGlmIGEgbG9jYWwgbmFtZSBwb2ludHMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIHROb2RlIHN0YXRpYyBkYXRhIG9mIGEgbm9kZSB0byBjaGVja1xuICogQHBhcmFtIHNlbGVjdG9yIHNlbGVjdG9yIHRvIG1hdGNoXG4gKiBAcmV0dXJucyBkaXJlY3RpdmUgaW5kZXgsIC0xIG9yIG51bGwgaWYgYSBzZWxlY3RvciBkaWRuJ3QgbWF0Y2ggYW55IG9mIHRoZSBsb2NhbCBuYW1lc1xuICovXG5mdW5jdGlvbiBnZXRJZHhPZk1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3Rvcjogc3RyaW5nKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGlmIChsb2NhbE5hbWVzW2ldID09PSBzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVSZXN1bHRCeVROb2RlVHlwZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGFueSB7XG4gIGlmICh0Tm9kZS50eXBlICYgKFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSkge1xuICAgIHJldHVybiBjcmVhdGVFbGVtZW50UmVmKHROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYodE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVSZXN1bHRGb3JOb2RlKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCBtYXRjaGluZ0lkeDogbnVtYmVyLCByZWFkOiBhbnkpOiBhbnkge1xuICBpZiAobWF0Y2hpbmdJZHggPT09IC0xKSB7XG4gICAgLy8gaWYgcmVhZCB0b2tlbiBhbmQgLyBvciBzdHJhdGVneSBpcyBub3Qgc3BlY2lmaWVkLCBkZXRlY3QgaXQgdXNpbmcgYXBwcm9wcmlhdGUgdE5vZGUgdHlwZVxuICAgIHJldHVybiBjcmVhdGVSZXN1bHRCeVROb2RlVHlwZSh0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKG1hdGNoaW5nSWR4ID09PSAtMikge1xuICAgIC8vIHJlYWQgYSBzcGVjaWFsIHRva2VuIGZyb20gYSBub2RlIGluamVjdG9yXG4gICAgcmV0dXJuIGNyZWF0ZVNwZWNpYWxUb2tlbihsVmlldywgdE5vZGUsIHJlYWQpO1xuICB9IGVsc2Uge1xuICAgIC8vIHJlYWQgYSB0b2tlblxuICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgbFZpZXdbVFZJRVddLCBtYXRjaGluZ0lkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTcGVjaWFsVG9rZW4obFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIHJlYWQ6IGFueSk6IGFueSB7XG4gIGlmIChyZWFkID09PSBWaWV3RW5naW5lX0VsZW1lbnRSZWYpIHtcbiAgICByZXR1cm4gY3JlYXRlRWxlbWVudFJlZih0Tm9kZSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHJlYWQgPT09IFZpZXdFbmdpbmVfVGVtcGxhdGVSZWYpIHtcbiAgICByZXR1cm4gY3JlYXRlVGVtcGxhdGVSZWYodE5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIGlmIChyZWFkID09PSBWaWV3Q29udGFpbmVyUmVmKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkFueUNvbnRhaW5lcik7XG4gICAgcmV0dXJuIGNyZWF0ZUNvbnRhaW5lclJlZihcbiAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgdGhyb3dFcnJvcihcbiAgICAgICAgICAgIGBTcGVjaWFsIHRva2VuIHRvIHJlYWQgc2hvdWxkIGJlIG9uZSBvZiBFbGVtZW50UmVmLCBUZW1wbGF0ZVJlZiBvciBWaWV3Q29udGFpbmVyUmVmIGJ1dCBnb3QgJHtcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkocmVhZCl9LmApO1xuICB9XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIHF1ZXJ5IHJlc3VsdHMgZm9yIGEgZ2l2ZW4gdmlldy4gVGhpcyBmdW5jdGlvbiBpcyBtZWFudCB0byBkbyB0aGVcbiAqIHByb2Nlc3Npbmcgb25jZSBhbmQgb25seSBvbmNlIGZvciBhIGdpdmVuIHZpZXcgaW5zdGFuY2UgKGEgc2V0IG9mIHJlc3VsdHMgZm9yIGEgZ2l2ZW4gdmlld1xuICogZG9lc24ndCBjaGFuZ2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0ZXJpYWxpemVWaWV3UmVzdWx0czxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdFF1ZXJ5OiBUUXVlcnksIHF1ZXJ5SW5kZXg6IG51bWJlcik6IFRbXSB7XG4gIGNvbnN0IGxRdWVyeSA9IGxWaWV3W1FVRVJJRVNdIS5xdWVyaWVzIVtxdWVyeUluZGV4XTtcbiAgaWYgKGxRdWVyeS5tYXRjaGVzID09PSBudWxsKSB7XG4gICAgY29uc3QgdFZpZXdEYXRhID0gdFZpZXcuZGF0YTtcbiAgICBjb25zdCB0UXVlcnlNYXRjaGVzID0gdFF1ZXJ5Lm1hdGNoZXMhO1xuICAgIGNvbnN0IHJlc3VsdDogVHxudWxsW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRRdWVyeU1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IG1hdGNoZWROb2RlSWR4ID0gdFF1ZXJ5TWF0Y2hlc1tpXTtcbiAgICAgIGlmIChtYXRjaGVkTm9kZUlkeCA8IDApIHtcbiAgICAgICAgLy8gd2UgYXQgdGhlIDxuZy10ZW1wbGF0ZT4gbWFya2VyIHdoaWNoIG1pZ2h0IGhhdmUgcmVzdWx0cyBpbiB2aWV3cyBjcmVhdGVkIGJhc2VkIG9uIHRoaXNcbiAgICAgICAgLy8gPG5nLXRlbXBsYXRlPiAtIHRob3NlIHJlc3VsdHMgd2lsbCBiZSBpbiBzZXBhcmF0ZSB2aWV3cyB0aG91Z2gsIHNvIGhlcmUgd2UganVzdCBsZWF2ZVxuICAgICAgICAvLyBudWxsIGFzIGEgcGxhY2Vob2xkZXJcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKHRWaWV3RGF0YSwgbWF0Y2hlZE5vZGVJZHgpO1xuICAgICAgICBjb25zdCB0Tm9kZSA9IHRWaWV3RGF0YVttYXRjaGVkTm9kZUlkeF0gYXMgVE5vZGU7XG4gICAgICAgIHJlc3VsdC5wdXNoKGNyZWF0ZVJlc3VsdEZvck5vZGUobFZpZXcsIHROb2RlLCB0UXVlcnlNYXRjaGVzW2kgKyAxXSwgdFF1ZXJ5Lm1ldGFkYXRhLnJlYWQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbFF1ZXJ5Lm1hdGNoZXMgPSByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gbFF1ZXJ5Lm1hdGNoZXM7XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdGhhdCBjb2xsZWN0cyAoYWxyZWFkeSBtYXRlcmlhbGl6ZWQpIHF1ZXJ5IHJlc3VsdHMgZnJvbSBhIHRyZWUgb2Ygdmlld3MsXG4gKiBzdGFydGluZyB3aXRoIGEgcHJvdmlkZWQgTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UXVlcnlSZXN1bHRzPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBxdWVyeUluZGV4OiBudW1iZXIsIHJlc3VsdDogVFtdKTogVFtdIHtcbiAgY29uc3QgdFF1ZXJ5ID0gdFZpZXcucXVlcmllcyEuZ2V0QnlJbmRleChxdWVyeUluZGV4KTtcbiAgY29uc3QgdFF1ZXJ5TWF0Y2hlcyA9IHRRdWVyeS5tYXRjaGVzO1xuICBpZiAodFF1ZXJ5TWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxWaWV3UmVzdWx0cyA9IG1hdGVyaWFsaXplVmlld1Jlc3VsdHM8VD4odFZpZXcsIGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0UXVlcnlNYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCB0Tm9kZUlkeCA9IHRRdWVyeU1hdGNoZXNbaV07XG4gICAgICBpZiAodE5vZGVJZHggPiAwKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGxWaWV3UmVzdWx0c1tpIC8gMl0gYXMgVCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjaGlsZFF1ZXJ5SW5kZXggPSB0UXVlcnlNYXRjaGVzW2kgKyAxXTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1stdE5vZGVJZHhdIGFzIExDb250YWluZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uTENvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gY29sbGVjdCBtYXRjaGVzIGZvciB2aWV3cyBpbnNlcnRlZCBpbiB0aGlzIGNvbnRhaW5lclxuICAgICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBkZWNsYXJhdGlvbkxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW2ldO1xuICAgICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdID09PSBlbWJlZGRlZExWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHMoZW1iZWRkZWRMVmlld1tUVklFV10sIGVtYmVkZGVkTFZpZXcsIGNoaWxkUXVlcnlJbmRleCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb2xsZWN0IG1hdGNoZXMgZm9yIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGlzIGRlY2xhcmF0aW9uIGNvbnRhaW5lciBhbmQgaW5zZXJ0ZWQgaW50b1xuICAgICAgICAvLyBkaWZmZXJlbnQgY29udGFpbmVyc1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXdzID0gZGVjbGFyYXRpb25MQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbWJlZGRlZExWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGVtYmVkZGVkTFZpZXdzW2ldO1xuICAgICAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyhlbWJlZGRlZExWaWV3W1RWSUVXXSwgZW1iZWRkZWRMVmlldywgY2hpbGRRdWVyeUluZGV4LCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUludGVybmFsPFQ+KGxWaWV3OiBMVmlldywgcXVlcnlJbmRleDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGxWaWV3W1FVRVJJRVNdLCAnTFF1ZXJpZXMgc2hvdWxkIGJlIGRlZmluZWQgd2hlbiB0cnlpbmcgdG8gbG9hZCBhIHF1ZXJ5Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXdbUVVFUklFU10hLnF1ZXJpZXMsIHF1ZXJ5SW5kZXgpO1xuICByZXR1cm4gbFZpZXdbUVVFUklFU10hLnF1ZXJpZXNbcXVlcnlJbmRleF0ucXVlcnlMaXN0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgTFF1ZXJ5IGFuZCByZXR1cm5zIGl0cyBpbmRleCBpbiB0aGUgY29sbGVjdGlvbiBvZiBMUXVlcnkgb2JqZWN0cy5cbiAqXG4gKiBAcmV0dXJucyBpbmRleCBpbiB0aGUgY29sbGVjdGlvbiBvZiBMUXVlcnkgb2JqZWN0c1xuICovXG5mdW5jdGlvbiBjcmVhdGVMUXVlcnk8VD4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGZsYWdzOiBRdWVyeUZsYWdzKTogbnVtYmVyIHtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbmV3IFF1ZXJ5TGlzdDxUPihcbiAgICAgIChmbGFncyAmIFF1ZXJ5RmxhZ3MuZW1pdERpc3RpbmN0Q2hhbmdlc09ubHkpID09PSBRdWVyeUZsYWdzLmVtaXREaXN0aW5jdENoYW5nZXNPbmx5KTtcblxuICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh0VmlldywgbFZpZXcsIHF1ZXJ5TGlzdCwgcXVlcnlMaXN0LmRlc3Ryb3kpO1xuXG4gIGNvbnN0IGxRdWVyaWVzID0gKGxWaWV3W1FVRVJJRVNdID8/PSBuZXcgTFF1ZXJpZXNfKCkpLnF1ZXJpZXM7XG4gIHJldHVybiBsUXVlcmllcy5wdXNoKG5ldyBMUXVlcnlfKHF1ZXJ5TGlzdCkpIC0gMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZpZXdRdWVyeTxUPihcbiAgICBwcmVkaWNhdGU6IFByb3ZpZGVyVG9rZW48dW5rbm93bj58c3RyaW5nW118c3RyaW5nLCBmbGFnczogUXVlcnlGbGFncywgcmVhZD86IGFueSk6IG51bWJlciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROdW1iZXIoZmxhZ3MsICdFeHBlY3RpbmcgZmxhZ3MnKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY3JlYXRlVFF1ZXJ5KHRWaWV3LCBuZXcgVFF1ZXJ5TWV0YWRhdGFfKHByZWRpY2F0ZSwgZmxhZ3MsIHJlYWQpLCAtMSk7XG4gICAgaWYgKChmbGFncyAmIFF1ZXJ5RmxhZ3MuaXNTdGF0aWMpID09PSBRdWVyeUZsYWdzLmlzU3RhdGljKSB7XG4gICAgICB0Vmlldy5zdGF0aWNWaWV3UXVlcmllcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNyZWF0ZUxRdWVyeTxUPih0VmlldywgZ2V0TFZpZXcoKSwgZmxhZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29udGVudFF1ZXJ5PFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByZWRpY2F0ZTogUHJvdmlkZXJUb2tlbjx1bmtub3duPnxzdHJpbmdbXXxzdHJpbmcsIGZsYWdzOiBRdWVyeUZsYWdzLFxuICAgIHJlYWQ/OiBQcm92aWRlclRva2VuPFQ+KTogbnVtYmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE51bWJlcihmbGFncywgJ0V4cGVjdGluZyBmbGFncycpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgICBjcmVhdGVUUXVlcnkodFZpZXcsIG5ldyBUUXVlcnlNZXRhZGF0YV8ocHJlZGljYXRlLCBmbGFncywgcmVhZCksIHROb2RlLmluZGV4KTtcbiAgICBzYXZlQ29udGVudFF1ZXJ5QW5kRGlyZWN0aXZlSW5kZXgodFZpZXcsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICBpZiAoKGZsYWdzICYgUXVlcnlGbGFncy5pc1N0YXRpYykgPT09IFF1ZXJ5RmxhZ3MuaXNTdGF0aWMpIHtcbiAgICAgIHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3JlYXRlTFF1ZXJ5PFQ+KHRWaWV3LCBnZXRMVmlldygpLCBmbGFncyk7XG59XG5cbi8qKiBTcGxpdHMgbXVsdGlwbGUgc2VsZWN0b3JzIGluIHRoZSBsb2NhdG9yLiAqL1xuZnVuY3Rpb24gc3BsaXRRdWVyeU11bHRpU2VsZWN0b3JzKGxvY2F0b3I6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIGxvY2F0b3Iuc3BsaXQoJywnKS5tYXAocyA9PiBzLnRyaW0oKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUUXVlcnkodFZpZXc6IFRWaWV3LCBtZXRhZGF0YTogVFF1ZXJ5TWV0YWRhdGEsIG5vZGVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGlmICh0Vmlldy5xdWVyaWVzID09PSBudWxsKSB0Vmlldy5xdWVyaWVzID0gbmV3IFRRdWVyaWVzXygpO1xuICB0Vmlldy5xdWVyaWVzLnRyYWNrKG5ldyBUUXVlcnlfKG1ldGFkYXRhLCBub2RlSW5kZXgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVDb250ZW50UXVlcnlBbmREaXJlY3RpdmVJbmRleCh0VmlldzogVFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgdFZpZXdDb250ZW50UXVlcmllcy5sZW5ndGggPyB0Vmlld0NvbnRlbnRRdWVyaWVzW3RWaWV3Q29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMV0gOiAtMTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ICE9PSBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCkge1xuICAgIHRWaWV3Q29udGVudFF1ZXJpZXMucHVzaCh0Vmlldy5xdWVyaWVzIS5sZW5ndGggLSAxLCBkaXJlY3RpdmVJbmRleCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRRdWVyeSh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIpOiBUUXVlcnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Vmlldy5xdWVyaWVzLCAnVFF1ZXJpZXMgbXVzdCBiZSBkZWZpbmVkIHRvIHJldHJpZXZlIGEgVFF1ZXJ5Jyk7XG4gIHJldHVybiB0Vmlldy5xdWVyaWVzIS5nZXRCeUluZGV4KGluZGV4KTtcbn1cbiJdfQ==