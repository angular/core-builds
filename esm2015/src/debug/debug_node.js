/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDomNode } from '../render3/assert';
import { getComponent, getInjector, getLocalRefs, loadContext } from '../render3/discovery_utils';
import { TVIEW } from '../render3/interfaces/view';
export class EventListener {
    /**
     * @param {?} name
     * @param {?} callback
     */
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
    }
}
if (false) {
    /** @type {?} */
    EventListener.prototype.name;
    /** @type {?} */
    EventListener.prototype.callback;
}
export class DebugNode__PRE_R3__ {
    /**
     * @param {?} nativeNode
     * @param {?} parent
     * @param {?} _debugContext
     */
    constructor(nativeNode, parent, _debugContext) {
        this.listeners = [];
        this.parent = null;
        this._debugContext = _debugContext;
        this.nativeNode = nativeNode;
        if (parent && parent instanceof DebugElement__PRE_R3__) {
            parent.addChild(this);
        }
    }
    /**
     * @return {?}
     */
    get injector() { return this._debugContext.injector; }
    /**
     * @return {?}
     */
    get componentInstance() { return this._debugContext.component; }
    /**
     * @return {?}
     */
    get context() { return this._debugContext.context; }
    /**
     * @return {?}
     */
    get references() { return this._debugContext.references; }
    /**
     * @return {?}
     */
    get providerTokens() { return this._debugContext.providerTokens; }
}
if (false) {
    /** @type {?} */
    DebugNode__PRE_R3__.prototype.listeners;
    /** @type {?} */
    DebugNode__PRE_R3__.prototype.parent;
    /** @type {?} */
    DebugNode__PRE_R3__.prototype.nativeNode;
    /** @type {?} */
    DebugNode__PRE_R3__.prototype._debugContext;
}
export class DebugElement__PRE_R3__ extends DebugNode__PRE_R3__ {
    /**
     * @param {?} nativeNode
     * @param {?} parent
     * @param {?} _debugContext
     */
    constructor(nativeNode, parent, _debugContext) {
        super(nativeNode, parent, _debugContext);
        this.properties = {};
        this.attributes = {};
        this.classes = {};
        this.styles = {};
        this.childNodes = [];
        this.nativeElement = nativeNode;
    }
    /**
     * @param {?} child
     * @return {?}
     */
    addChild(child) {
        if (child) {
            this.childNodes.push(child);
            (/** @type {?} */ (child)).parent = this;
        }
    }
    /**
     * @param {?} child
     * @return {?}
     */
    removeChild(child) {
        /** @type {?} */
        const childIndex = this.childNodes.indexOf(child);
        if (childIndex !== -1) {
            (/** @type {?} */ (child)).parent = null;
            this.childNodes.splice(childIndex, 1);
        }
    }
    /**
     * @param {?} child
     * @param {?} newChildren
     * @return {?}
     */
    insertChildrenAfter(child, newChildren) {
        /** @type {?} */
        const siblingIndex = this.childNodes.indexOf(child);
        if (siblingIndex !== -1) {
            this.childNodes.splice(siblingIndex + 1, 0, ...newChildren);
            newChildren.forEach(c => {
                if (c.parent) {
                    (/** @type {?} */ (c.parent)).removeChild(c);
                }
                (/** @type {?} */ (child)).parent = this;
            });
        }
    }
    /**
     * @param {?} refChild
     * @param {?} newChild
     * @return {?}
     */
    insertBefore(refChild, newChild) {
        /** @type {?} */
        const refIndex = this.childNodes.indexOf(refChild);
        if (refIndex === -1) {
            this.addChild(newChild);
        }
        else {
            if (newChild.parent) {
                (/** @type {?} */ (newChild.parent)).removeChild(newChild);
            }
            (/** @type {?} */ (newChild)).parent = this;
            this.childNodes.splice(refIndex, 0, newChild);
        }
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    query(predicate) {
        /** @type {?} */
        const results = this.queryAll(predicate);
        return results[0] || null;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAll(predicate) {
        /** @type {?} */
        const matches = [];
        _queryElementChildren(this, predicate, matches);
        return matches;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAllNodes(predicate) {
        /** @type {?} */
        const matches = [];
        _queryNodeChildren(this, predicate, matches);
        return matches;
    }
    /**
     * @return {?}
     */
    get children() {
        return /** @type {?} */ (this
            .childNodes //
            .filter((node) => node instanceof DebugElement__PRE_R3__));
    }
    /**
     * @param {?} eventName
     * @param {?} eventObj
     * @return {?}
     */
    triggerEventHandler(eventName, eventObj) {
        this.listeners.forEach((listener) => {
            if (listener.name == eventName) {
                listener.callback(eventObj);
            }
        });
    }
}
if (false) {
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.name;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.properties;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.attributes;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.classes;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.styles;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.childNodes;
    /** @type {?} */
    DebugElement__PRE_R3__.prototype.nativeElement;
}
/**
 * \@publicApi
 * @param {?} debugEls
 * @return {?}
 */
export function asNativeElements(debugEls) {
    return debugEls.map((el) => el.nativeElement);
}
/**
 * @param {?} element
 * @param {?} predicate
 * @param {?} matches
 * @return {?}
 */
function _queryElementChildren(element, predicate, matches) {
    element.childNodes.forEach(node => {
        if (node instanceof DebugElement__PRE_R3__) {
            if (predicate(node)) {
                matches.push(node);
            }
            _queryElementChildren(node, predicate, matches);
        }
    });
}
/**
 * @param {?} parentNode
 * @param {?} predicate
 * @param {?} matches
 * @return {?}
 */
function _queryNodeChildren(parentNode, predicate, matches) {
    if (parentNode instanceof DebugElement__PRE_R3__) {
        parentNode.childNodes.forEach(node => {
            if (predicate(node)) {
                matches.push(node);
            }
            if (node instanceof DebugElement__PRE_R3__) {
                _queryNodeChildren(node, predicate, matches);
            }
        });
    }
}
/**
 * @return {?}
 */
function notImplemented() {
    throw new Error('Missing proper ivy implementation.');
}
class DebugNode__POST_R3__ {
    /**
     * @param {?} nativeNode
     */
    constructor(nativeNode) { this.nativeNode = nativeNode; }
    /**
     * @return {?}
     */
    get parent() {
        /** @type {?} */
        const parent = /** @type {?} */ (this.nativeNode.parentNode);
        return parent ? new DebugElement__POST_R3__(parent) : null;
    }
    /**
     * @return {?}
     */
    get injector() { return getInjector(this.nativeNode); }
    /**
     * @return {?}
     */
    get componentInstance() {
        /** @type {?} */
        const nativeElement = this.nativeNode;
        return nativeElement && getComponent(/** @type {?} */ (nativeElement));
    }
    /**
     * @return {?}
     */
    get context() {
        // https://angular-team.atlassian.net/browse/FW-719
        throw notImplemented();
    }
    /**
     * @return {?}
     */
    get listeners() {
        // TODO: add real implementation;
        // https://angular-team.atlassian.net/browse/FW-719
        return [];
    }
    /**
     * @return {?}
     */
    get references() { return getLocalRefs(this.nativeNode); }
    /**
     * @return {?}
     */
    get providerTokens() {
        /** @type {?} */
        const context = /** @type {?} */ ((loadContext(/** @type {?} */ (this.nativeNode), false)));
        if (!context)
            return [];
        /** @type {?} */
        const lView = context.lViewData;
        /** @type {?} */
        const tView = lView[TVIEW];
        /** @type {?} */
        const tNode = /** @type {?} */ (tView.data[context.nodeIndex]);
        /** @type {?} */
        const providerTokens = [];
        /** @type {?} */
        const nodeFlags = tNode.flags;
        /** @type {?} */
        const startIndex = nodeFlags >> 16 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const directiveCount = nodeFlags & 4095 /* DirectiveCountMask */;
        /** @type {?} */
        const endIndex = startIndex + directiveCount;
        for (let i = startIndex; i < endIndex; i++) {
            /** @type {?} */
            let value = tView.data[i];
            if (isDirectiveDefHack(value)) {
                // The fact that we sometimes store Type and sometimes DirectiveDef in this location is a
                // design flaw.  We should always store same type so that we can be monomorphic. The issue
                // is that for Components/Directives we store the def instead the type. The correct behavior
                // is that we should always be storing injectable type in this location.
                value = value.type;
            }
            providerTokens.push(value);
        }
        return providerTokens;
    }
}
if (false) {
    /** @type {?} */
    DebugNode__POST_R3__.prototype.nativeNode;
}
class DebugElement__POST_R3__ extends DebugNode__POST_R3__ {
    /**
     * @param {?} nativeNode
     */
    constructor(nativeNode) {
        ngDevMode && assertDomNode(nativeNode);
        super(nativeNode);
    }
    /**
     * @return {?}
     */
    get nativeElement() {
        return this.nativeNode.nodeType == Node.ELEMENT_NODE ? /** @type {?} */ (this.nativeNode) : null;
    }
    /**
     * @return {?}
     */
    get name() { return (/** @type {?} */ (this.nativeElement)).nodeName; }
    /**
     * @return {?}
     */
    get properties() {
        /** @type {?} */
        const context = /** @type {?} */ ((loadContext(this.nativeNode)));
        /** @type {?} */
        const lView = context.lViewData;
        /** @type {?} */
        const tView = lView[TVIEW];
        /** @type {?} */
        const tNode = /** @type {?} */ (tView.data[context.nodeIndex]);
        /** @type {?} */
        const properties = {};
        // TODO: https://angular-team.atlassian.net/browse/FW-681
        // Missing implementation here...
        return properties;
    }
    /**
     * @return {?}
     */
    get attributes() {
        // https://angular-team.atlassian.net/browse/FW-719
        throw notImplemented();
    }
    /**
     * @return {?}
     */
    get classes() {
        // https://angular-team.atlassian.net/browse/FW-719
        throw notImplemented();
    }
    /**
     * @return {?}
     */
    get styles() {
        // https://angular-team.atlassian.net/browse/FW-719
        throw notImplemented();
    }
    /**
     * @return {?}
     */
    get childNodes() {
        /** @type {?} */
        const childNodes = this.nativeNode.childNodes;
        /** @type {?} */
        const children = [];
        for (let i = 0; i < childNodes.length; i++) {
            /** @type {?} */
            const element = childNodes[i];
            children.push(getDebugNode__POST_R3__(element));
        }
        return children;
    }
    /**
     * @return {?}
     */
    get children() {
        /** @type {?} */
        const nativeElement = this.nativeElement;
        if (!nativeElement)
            return [];
        /** @type {?} */
        const childNodes = nativeElement.children;
        /** @type {?} */
        const children = [];
        for (let i = 0; i < childNodes.length; i++) {
            /** @type {?} */
            const element = childNodes[i];
            children.push(getDebugNode__POST_R3__(element));
        }
        return children;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    query(predicate) {
        /** @type {?} */
        const results = this.queryAll(predicate);
        return results[0] || null;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAll(predicate) {
        /** @type {?} */
        const matches = [];
        _queryNodeChildrenR3(this, predicate, matches, true);
        return matches;
    }
    /**
     * @param {?} predicate
     * @return {?}
     */
    queryAllNodes(predicate) {
        /** @type {?} */
        const matches = [];
        _queryNodeChildrenR3(this, predicate, matches, false);
        return matches;
    }
    /**
     * @param {?} eventName
     * @param {?} eventObj
     * @return {?}
     */
    triggerEventHandler(eventName, eventObj) {
        /** @type {?} */
        const event = document.createEvent('MouseEvent');
        event.initEvent(eventName, true, true);
        (/** @type {?} */ (this.nativeElement)).dispatchEvent(event);
    }
}
/**
 * This function should not exist because it is megamorphic and only mostly correct.
 *
 * See call site for more info.
 * @param {?} obj
 * @return {?}
 */
function isDirectiveDefHack(obj) {
    return obj.type !== undefined && obj.template !== undefined && obj.declaredInputs !== undefined;
}
/**
 * @param {?} parentNode
 * @param {?} predicate
 * @param {?} matches
 * @param {?} elementsOnly
 * @return {?}
 */
function _queryNodeChildrenR3(parentNode, predicate, matches, elementsOnly) {
    if (parentNode instanceof DebugElement__POST_R3__) {
        parentNode.childNodes.forEach(node => {
            if (predicate(node)) {
                matches.push(node);
            }
            if (node instanceof DebugElement__POST_R3__) {
                if (elementsOnly ? node.nativeElement : true) {
                    _queryNodeChildrenR3(node, predicate, matches, elementsOnly);
                }
            }
        });
    }
}
/** @type {?} */
const _nativeNodeToDebugNode = new Map();
/**
 * @param {?} nativeNode
 * @return {?}
 */
function getDebugNode__PRE_R3__(nativeNode) {
    return _nativeNodeToDebugNode.get(nativeNode) || null;
}
/**
 * @param {?} nativeNode
 * @return {?}
 */
export function getDebugNode__POST_R3__(nativeNode) {
    if (nativeNode instanceof Node) {
        return nativeNode.nodeType == Node.ELEMENT_NODE ?
            new DebugElement__POST_R3__(/** @type {?} */ (nativeNode)) :
            new DebugNode__POST_R3__(nativeNode);
    }
    return null;
}
/** *
 * \@publicApi
  @type {?} */
export const getDebugNode = getDebugNode__PRE_R3__;
/**
 * @return {?}
 */
export function getAllDebugNodes() {
    return Array.from(_nativeNodeToDebugNode.values());
}
/**
 * @param {?} node
 * @return {?}
 */
export function indexDebugNode(node) {
    _nativeNodeToDebugNode.set(node.nativeNode, node);
}
/**
 * @param {?} node
 * @return {?}
 */
export function removeDebugNodeFromIndex(node) {
    _nativeNodeToDebugNode.delete(node.nativeNode);
}
/**
 * A boolean-valued function over a value, possibly including context information
 * regarding that value's position in an array.
 *
 * \@publicApi
 * @record
 * @template T
 */
export function Predicate() { }
/** *
 * \@publicApi
  @type {?} */
export const DebugNode = /** @type {?} */ (DebugNode__PRE_R3__);
/** *
 * \@publicApi
  @type {?} */
export const DebugElement = /** @type {?} */ (DebugElement__PRE_R3__);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFVQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRWhHLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUdqRCxNQUFNLE9BQU8sYUFBYTs7Ozs7SUFDeEIsWUFBbUIsSUFBWSxFQUFTLFFBQWtCO1FBQXZDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFVO0tBQUk7Q0FDL0Q7Ozs7Ozs7QUFlRCxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFNOUIsWUFBWSxVQUFlLEVBQUUsTUFBc0IsRUFBRSxhQUEyQjtRQUxoRixpQkFBc0MsRUFBRSxDQUFDO1FBQ3pDLGNBQXFDLElBQUksQ0FBQztRQUt4QyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLE1BQU0sSUFBSSxNQUFNLFlBQVksc0JBQXNCLEVBQUU7WUFDdEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2QjtLQUNGOzs7O0lBRUQsSUFBSSxRQUFRLEtBQWUsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxFQUFFOzs7O0lBRWhFLElBQUksaUJBQWlCLEtBQVUsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFOzs7O0lBRXJFLElBQUksT0FBTyxLQUFVLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENB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Ozs7Ozs7Ozs7Ozs7O0FBYUQsYUFBYSxTQUFTLHFCQUFzQyxtQkFBMEIsRUFBQzs7OztBQUt2RixhQUFhLFlBQVkscUJBQXlDLHNCQUE2QixFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vcmVuZGVyMyc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50LCBnZXRJbmplY3RvciwgZ2V0TG9jYWxSZWZzLCBsb2FkQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy9kaXNjb3ZlcnlfdXRpbHMnO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4uL3ZpZXcvaW5kZXgnO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRMaXN0ZW5lciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyBjYWxsYmFjazogRnVuY3Rpb24pIHt9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRXZlbnRMaXN0ZW5lcltdO1xuICByZWFkb25seSBwYXJlbnQ6IERlYnVnRWxlbWVudHxudWxsO1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBhbnk7XG4gIHJlYWRvbmx5IGluamVjdG9yOiBJbmplY3RvcjtcbiAgcmVhZG9ubHkgY29tcG9uZW50SW5zdGFuY2U6IGFueTtcbiAgcmVhZG9ubHkgY29udGV4dDogYW55O1xuICByZWFkb25seSByZWZlcmVuY2VzOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgcmVhZG9ubHkgcHJvdmlkZXJUb2tlbnM6IGFueVtdO1xufVxuZXhwb3J0IGNsYXNzIERlYnVnTm9kZV9fUFJFX1IzX18ge1xuICByZWFkb25seSBsaXN0ZW5lcnM6IEV2ZW50TGlzdGVuZXJbXSA9IFtdO1xuICByZWFkb25seSBwYXJlbnQ6IERlYnVnRWxlbWVudHxudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogRGVidWdOb2RlfG51bGwsIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHRoaXMuX2RlYnVnQ29udGV4dCA9IF9kZWJ1Z0NvbnRleHQ7XG4gICAgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTtcbiAgICBpZiAocGFyZW50ICYmIHBhcmVudCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIHBhcmVudC5hZGRDaGlsZCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmluamVjdG9yOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29tcG9uZW50OyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb250ZXh0OyB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnJlZmVyZW5jZXM7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnByb3ZpZGVyVG9rZW5zOyB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnRWxlbWVudCBleHRlbmRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgcmVhZG9ubHkgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdO1xuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQ7XG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXTtcbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW107XG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkO1xufVxuZXhwb3J0IGNsYXNzIERlYnVnRWxlbWVudF9fUFJFX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BSRV9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgcmVhZG9ubHkgbmFtZSAhOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBhbnksIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUsIHBhcmVudCwgX2RlYnVnQ29udGV4dCk7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlTm9kZTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5wdXNoKGNoaWxkKTtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGNvbnN0IGNoaWxkSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKGNoaWxkSW5kZXggIT09IC0xKSB7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGUgfCBudWxsfSkucGFyZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UoY2hpbGRJbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0Q2hpbGRyZW5BZnRlcihjaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZHJlbjogRGVidWdOb2RlW10pIHtcbiAgICBjb25zdCBzaWJsaW5nSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKHNpYmxpbmdJbmRleCAhPT0gLTEpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2Uoc2libGluZ0luZGV4ICsgMSwgMCwgLi4ubmV3Q2hpbGRyZW4pO1xuICAgICAgbmV3Q2hpbGRyZW4uZm9yRWFjaChjID0+IHtcbiAgICAgICAgaWYgKGMucGFyZW50KSB7XG4gICAgICAgICAgKGMucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKGMpO1xuICAgICAgICB9XG4gICAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocmVmQ2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGQ6IERlYnVnTm9kZSk6IHZvaWQge1xuICAgIGNvbnN0IHJlZkluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YocmVmQ2hpbGQpO1xuICAgIGlmIChyZWZJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQobmV3Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV3Q2hpbGQucGFyZW50KSB7XG4gICAgICAgIChuZXdDaGlsZC5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQobmV3Q2hpbGQpO1xuICAgICAgfVxuICAgICAgKG5ld0NoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UocmVmSW5kZXgsIDAsIG5ld0NoaWxkKTtcbiAgICB9XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgICAgICAgLmNoaWxkTm9kZXMgIC8vXG4gICAgICAgIC5maWx0ZXIoKG5vZGUpID0+IG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSBhcyBEZWJ1Z0VsZW1lbnRbXTtcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT0gZXZlbnROYW1lKSB7XG4gICAgICAgIGxpc3RlbmVyLmNhbGxiYWNrKGV2ZW50T2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzTmF0aXZlRWxlbWVudHMoZGVidWdFbHM6IERlYnVnRWxlbWVudFtdKTogYW55IHtcbiAgcmV0dXJuIGRlYnVnRWxzLm1hcCgoZWwpID0+IGVsLm5hdGl2ZUVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlFbGVtZW50Q2hpbGRyZW4oXG4gICAgZWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+LCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSkge1xuICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuKFxuICAgIHBhcmVudE5vZGU6IERlYnVnTm9kZSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10pIHtcbiAgaWYgKHBhcmVudE5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3RJbXBsZW1lbnRlZCgpOiBFcnJvciB7XG4gIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBwcm9wZXIgaXZ5IGltcGxlbWVudGF0aW9uLicpO1xufVxuXG5jbGFzcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IE5vZGU7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogTm9kZSkgeyB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlOyB9XG5cbiAgZ2V0IHBhcmVudCgpOiBEZWJ1Z0VsZW1lbnR8bnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5uYXRpdmVOb2RlLnBhcmVudE5vZGUgYXMgSFRNTEVsZW1lbnQ7XG4gICAgcmV0dXJuIHBhcmVudCA/IG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhwYXJlbnQpIDogbnVsbDtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBnZXRJbmplY3Rvcih0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlTm9kZTtcbiAgICByZXR1cm4gbmF0aXZlRWxlbWVudCAmJiBnZXRDb21wb25lbnQobmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCk7XG4gIH1cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICAvLyBodHRwczovL2FuZ3VsYXItdGVhbS5hdGxhc3NpYW4ubmV0L2Jyb3dzZS9GVy03MTlcbiAgICB0aHJvdyBub3RJbXBsZW1lbnRlZCgpO1xuICB9XG5cbiAgZ2V0IGxpc3RlbmVycygpOiBFdmVudExpc3RlbmVyW10ge1xuICAgIC8vIFRPRE86IGFkZCByZWFsIGltcGxlbWVudGF0aW9uO1xuICAgIC8vIGh0dHBzOi8vYW5ndWxhci10ZWFtLmF0bGFzc2lhbi5uZXQvYnJvd3NlL0ZXLTcxOVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7IHJldHVybiBnZXRMb2NhbFJlZnModGhpcy5uYXRpdmVOb2RlKTsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgLy8gVE9ETyBtb3ZlIHRvIGRpc2NvdmVyYWJsZSB1dGlsc1xuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0aGlzLm5hdGl2ZU5vZGUgYXMgSFRNTEVsZW1lbnQsIGZhbHNlKSAhO1xuICAgIGlmICghY29udGV4dCkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlld0RhdGE7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgICBjb25zdCBwcm92aWRlclRva2VuczogYW55W10gPSBbXTtcbiAgICBjb25zdCBub2RlRmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgICBjb25zdCBzdGFydEluZGV4ID0gbm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGRpcmVjdGl2ZUNvdW50ID0gbm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gICAgY29uc3QgZW5kSW5kZXggPSBzdGFydEluZGV4ICsgZGlyZWN0aXZlQ291bnQ7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBlbmRJbmRleDsgaSsrKSB7XG4gICAgICBsZXQgdmFsdWUgPSB0Vmlldy5kYXRhW2ldO1xuICAgICAgaWYgKGlzRGlyZWN0aXZlRGVmSGFjayh2YWx1ZSkpIHtcbiAgICAgICAgLy8gVGhlIGZhY3QgdGhhdCB3ZSBzb21ldGltZXMgc3RvcmUgVHlwZSBhbmQgc29tZXRpbWVzIERpcmVjdGl2ZURlZiBpbiB0aGlzIGxvY2F0aW9uIGlzIGFcbiAgICAgICAgLy8gZGVzaWduIGZsYXcuICBXZSBzaG91bGQgYWx3YXlzIHN0b3JlIHNhbWUgdHlwZSBzbyB0aGF0IHdlIGNhbiBiZSBtb25vbW9ycGhpYy4gVGhlIGlzc3VlXG4gICAgICAgIC8vIGlzIHRoYXQgZm9yIENvbXBvbmVudHMvRGlyZWN0aXZlcyB3ZSBzdG9yZSB0aGUgZGVmIGluc3RlYWQgdGhlIHR5cGUuIFRoZSBjb3JyZWN0IGJlaGF2aW9yXG4gICAgICAgIC8vIGlzIHRoYXQgd2Ugc2hvdWxkIGFsd2F5cyBiZSBzdG9yaW5nIGluamVjdGFibGUgdHlwZSBpbiB0aGlzIGxvY2F0aW9uLlxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnR5cGU7XG4gICAgICB9XG4gICAgICBwcm92aWRlclRva2Vucy5wdXNoKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb3ZpZGVyVG9rZW5zO1xuICB9XG59XG5cbmNsYXNzIERlYnVnRWxlbWVudF9fUE9TVF9SM19fIGV4dGVuZHMgRGVidWdOb2RlX19QT1NUX1IzX18gaW1wbGVtZW50cyBEZWJ1Z0VsZW1lbnQge1xuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBFbGVtZW50KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUobmF0aXZlTm9kZSk7XG4gICAgc3VwZXIobmF0aXZlTm9kZSk7XG4gIH1cblxuICBnZXQgbmF0aXZlRWxlbWVudCgpOiBFbGVtZW50fG51bGwge1xuICAgIHJldHVybiB0aGlzLm5hdGl2ZU5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUgPyB0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCA6IG51bGw7XG4gIH1cblxuICBnZXQgbmFtZSgpOiBzdHJpbmcgeyByZXR1cm4gKHRoaXMubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCkubm9kZU5hbWU7IH1cblxuICBnZXQgcHJvcGVydGllcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkQ29udGV4dCh0aGlzLm5hdGl2ZU5vZGUpICE7XG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3RGF0YTtcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICAgIGNvbnN0IHByb3BlcnRpZXMgPSB7fTtcbiAgICAvLyBUT0RPOiBodHRwczovL2FuZ3VsYXItdGVhbS5hdGxhc3NpYW4ubmV0L2Jyb3dzZS9GVy02ODFcbiAgICAvLyBNaXNzaW5nIGltcGxlbWVudGF0aW9uIGhlcmUuLi5cbiAgICByZXR1cm4gcHJvcGVydGllcztcbiAgfVxuXG4gIGdldCBhdHRyaWJ1dGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30ge1xuICAgIC8vIGh0dHBzOi8vYW5ndWxhci10ZWFtLmF0bGFzc2lhbi5uZXQvYnJvd3NlL0ZXLTcxOVxuICAgIHRocm93IG5vdEltcGxlbWVudGVkKCk7XG4gIH1cblxuICBnZXQgY2xhc3NlcygpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9IHtcbiAgICAvLyBodHRwczovL2FuZ3VsYXItdGVhbS5hdGxhc3NpYW4ubmV0L2Jyb3dzZS9GVy03MTlcbiAgICB0aHJvdyBub3RJbXBsZW1lbnRlZCgpO1xuICB9XG5cbiAgZ2V0IHN0eWxlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICAvLyBodHRwczovL2FuZ3VsYXItdGVhbS5hdGxhc3NpYW4ubmV0L2Jyb3dzZS9GVy03MTlcbiAgICB0aHJvdyBub3RJbXBsZW1lbnRlZCgpO1xuICB9XG5cbiAgZ2V0IGNoaWxkTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSB0aGlzLm5hdGl2ZU5vZGUuY2hpbGROb2RlcztcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdOb2RlW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcbiAgICBpZiAoIW5hdGl2ZUVsZW1lbnQpIHJldHVybiBbXTtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gbmF0aXZlRWxlbWVudC5jaGlsZHJlbjtcbiAgICBjb25zdCBjaGlsZHJlbjogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgY2hpbGRyZW4ucHVzaChnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhlbGVtZW50KSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIHRydWUpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnTm9kZVtdID0gW107XG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCBmYWxzZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICB0cmlnZ2VyRXZlbnRIYW5kbGVyKGV2ZW50TmFtZTogc3RyaW5nLCBldmVudE9iajogYW55KTogdm9pZCB7XG4gICAgLy8gVGhpcyBpcyBhIGhhY2sgaW1wbGVtZW50YXRpb24uIFRoZSBjb3JyZWN0IGltcGxlbWVudGF0aW9uIHdvdWxkIGJ5cGFzcyB0aGUgRE9NIGFuZCBgVE5vZGVgXG4gICAgLy8gaW5mb3JtYXRpb24gdG8gaW52b2tlIHRoZSBsaXN0ZW5lcnMgZGlyZWN0bHkuXG4gICAgLy8gaHR0cHM6Ly9hbmd1bGFyLXRlYW0uYXRsYXNzaWFuLm5ldC9icm93c2UvRlctNzE5XG4gICAgY29uc3QgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudCcpO1xuICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIHRydWUpO1xuICAgICh0aGlzLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgbm90IGV4aXN0IGJlY2F1c2UgaXQgaXMgbWVnYW1vcnBoaWMgYW5kIG9ubHkgbW9zdGx5IGNvcnJlY3QuXG4gKlxuICogU2VlIGNhbGwgc2l0ZSBmb3IgbW9yZSBpbmZvLlxuICovXG5mdW5jdGlvbiBpc0RpcmVjdGl2ZURlZkhhY2sob2JqOiBhbnkpOiBvYmogaXMgRGlyZWN0aXZlRGVmPGFueT4ge1xuICByZXR1cm4gb2JqLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBvYmoudGVtcGxhdGUgIT09IHVuZGVmaW5lZCAmJiBvYmouZGVjbGFyZWRJbnB1dHMgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgcGFyZW50Tm9kZTogRGVidWdOb2RlLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSxcbiAgICBlbGVtZW50c09ubHk6IGJvb2xlYW4pIHtcbiAgaWYgKHBhcmVudE5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXykge1xuICAgIHBhcmVudE5vZGUuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fKSB7XG4gICAgICAgIGlmIChlbGVtZW50c09ubHkgPyBub2RlLm5hdGl2ZUVsZW1lbnQgOiB0cnVlKSB7XG4gICAgICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuXG4vLyBOZWVkIHRvIGtlZXAgdGhlIG5vZGVzIGluIGEgZ2xvYmFsIE1hcCBzbyB0aGF0IG11bHRpcGxlIGFuZ3VsYXIgYXBwcyBhcmUgc3VwcG9ydGVkLlxuY29uc3QgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZSA9IG5ldyBNYXA8YW55LCBEZWJ1Z05vZGU+KCk7XG5cbmZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUFJFX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICByZXR1cm4gX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5nZXQobmF0aXZlTm9kZSkgfHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IEVsZW1lbnQpOiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBOb2RlKTogRGVidWdOb2RlX19QT1NUX1IzX187XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogbnVsbCk6IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogYW55KTogRGVidWdOb2RlfG51bGwge1xuICBpZiAobmF0aXZlTm9kZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICByZXR1cm4gbmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/XG4gICAgICAgIG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhuYXRpdmVOb2RlIGFzIEVsZW1lbnQpIDpcbiAgICAgICAgbmV3IERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGdldERlYnVnTm9kZTogKG5hdGl2ZU5vZGU6IGFueSkgPT4gRGVidWdOb2RlIHwgbnVsbCA9IGdldERlYnVnTm9kZV9fUFJFX1IzX187XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxEZWJ1Z05vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS52YWx1ZXMoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleERlYnVnTm9kZShub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5zZXQobm9kZS5uYXRpdmVOb2RlLCBub2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZURlYnVnTm9kZUZyb21JbmRleChub2RlOiBEZWJ1Z05vZGUpIHtcbiAgX25hdGl2ZU5vZGVUb0RlYnVnTm9kZS5kZWxldGUobm9kZS5uYXRpdmVOb2RlKTtcbn1cblxuLyoqXG4gKiBBIGJvb2xlYW4tdmFsdWVkIGZ1bmN0aW9uIG92ZXIgYSB2YWx1ZSwgcG9zc2libHkgaW5jbHVkaW5nIGNvbnRleHQgaW5mb3JtYXRpb25cbiAqIHJlZ2FyZGluZyB0aGF0IHZhbHVlJ3MgcG9zaXRpb24gaW4gYW4gYXJyYXkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFByZWRpY2F0ZTxUPiB7ICh2YWx1ZTogVCk6IGJvb2xlYW47IH1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z05vZGU6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdOb2RlfSA9IERlYnVnTm9kZV9fUFJFX1IzX18gYXMgYW55O1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnRWxlbWVudDoge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z0VsZW1lbnR9ID0gRGVidWdFbGVtZW50X19QUkVfUjNfXyBhcyBhbnk7XG4iXX0=