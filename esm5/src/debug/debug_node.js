import * as tslib_1 from "tslib";
import { assertDomNode } from '../render3/assert';
import { getComponent, getInjector, getLocalRefs, loadContext } from '../render3/discovery_utils';
import { TVIEW } from '../render3/interfaces/view';
var EventListener = /** @class */ (function () {
    function EventListener(name, callback) {
        this.name = name;
        this.callback = callback;
    }
    return EventListener;
}());
export { EventListener };
var DebugNode__PRE_R3__ = /** @class */ (function () {
    function DebugNode__PRE_R3__(nativeNode, parent, _debugContext) {
        this.listeners = [];
        this.parent = null;
        this._debugContext = _debugContext;
        this.nativeNode = nativeNode;
        if (parent && parent instanceof DebugElement__PRE_R3__) {
            parent.addChild(this);
        }
    }
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "injector", {
        get: function () { return this._debugContext.injector; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "componentInstance", {
        get: function () { return this._debugContext.component; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "context", {
        get: function () { return this._debugContext.context; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "references", {
        get: function () { return this._debugContext.references; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "providerTokens", {
        get: function () { return this._debugContext.providerTokens; },
        enumerable: true,
        configurable: true
    });
    return DebugNode__PRE_R3__;
}());
export { DebugNode__PRE_R3__ };
var DebugElement__PRE_R3__ = /** @class */ (function (_super) {
    tslib_1.__extends(DebugElement__PRE_R3__, _super);
    function DebugElement__PRE_R3__(nativeNode, parent, _debugContext) {
        var _this = _super.call(this, nativeNode, parent, _debugContext) || this;
        _this.properties = {};
        _this.attributes = {};
        _this.classes = {};
        _this.styles = {};
        _this.childNodes = [];
        _this.nativeElement = nativeNode;
        return _this;
    }
    DebugElement__PRE_R3__.prototype.addChild = function (child) {
        if (child) {
            this.childNodes.push(child);
            child.parent = this;
        }
    };
    DebugElement__PRE_R3__.prototype.removeChild = function (child) {
        var childIndex = this.childNodes.indexOf(child);
        if (childIndex !== -1) {
            child.parent = null;
            this.childNodes.splice(childIndex, 1);
        }
    };
    DebugElement__PRE_R3__.prototype.insertChildrenAfter = function (child, newChildren) {
        var _this = this;
        var _a;
        var siblingIndex = this.childNodes.indexOf(child);
        if (siblingIndex !== -1) {
            (_a = this.childNodes).splice.apply(_a, tslib_1.__spread([siblingIndex + 1, 0], newChildren));
            newChildren.forEach(function (c) {
                if (c.parent) {
                    c.parent.removeChild(c);
                }
                child.parent = _this;
            });
        }
    };
    DebugElement__PRE_R3__.prototype.insertBefore = function (refChild, newChild) {
        var refIndex = this.childNodes.indexOf(refChild);
        if (refIndex === -1) {
            this.addChild(newChild);
        }
        else {
            if (newChild.parent) {
                newChild.parent.removeChild(newChild);
            }
            newChild.parent = this;
            this.childNodes.splice(refIndex, 0, newChild);
        }
    };
    DebugElement__PRE_R3__.prototype.query = function (predicate) {
        var results = this.queryAll(predicate);
        return results[0] || null;
    };
    DebugElement__PRE_R3__.prototype.queryAll = function (predicate) {
        var matches = [];
        _queryElementChildren(this, predicate, matches);
        return matches;
    };
    DebugElement__PRE_R3__.prototype.queryAllNodes = function (predicate) {
        var matches = [];
        _queryNodeChildren(this, predicate, matches);
        return matches;
    };
    Object.defineProperty(DebugElement__PRE_R3__.prototype, "children", {
        get: function () {
            return this
                .childNodes //
                .filter(function (node) { return node instanceof DebugElement__PRE_R3__; });
        },
        enumerable: true,
        configurable: true
    });
    DebugElement__PRE_R3__.prototype.triggerEventHandler = function (eventName, eventObj) {
        this.listeners.forEach(function (listener) {
            if (listener.name == eventName) {
                listener.callback(eventObj);
            }
        });
    };
    return DebugElement__PRE_R3__;
}(DebugNode__PRE_R3__));
export { DebugElement__PRE_R3__ };
/**
 * @publicApi
 */
export function asNativeElements(debugEls) {
    return debugEls.map(function (el) { return el.nativeElement; });
}
function _queryElementChildren(element, predicate, matches) {
    element.childNodes.forEach(function (node) {
        if (node instanceof DebugElement__PRE_R3__) {
            if (predicate(node)) {
                matches.push(node);
            }
            _queryElementChildren(node, predicate, matches);
        }
    });
}
function _queryNodeChildren(parentNode, predicate, matches) {
    if (parentNode instanceof DebugElement__PRE_R3__) {
        parentNode.childNodes.forEach(function (node) {
            if (predicate(node)) {
                matches.push(node);
            }
            if (node instanceof DebugElement__PRE_R3__) {
                _queryNodeChildren(node, predicate, matches);
            }
        });
    }
}
function notImplemented() {
    throw new Error('Missing proper ivy implementation.');
}
var DebugNode__POST_R3__ = /** @class */ (function () {
    function DebugNode__POST_R3__(nativeNode) {
        this.nativeNode = nativeNode;
    }
    Object.defineProperty(DebugNode__POST_R3__.prototype, "parent", {
        get: function () {
            var parent = this.nativeNode.parentNode;
            return parent ? new DebugElement__POST_R3__(parent) : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "injector", {
        get: function () { return getInjector(this.nativeNode); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "componentInstance", {
        get: function () {
            var nativeElement = this.nativeNode;
            return nativeElement && getComponent(nativeElement);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "context", {
        get: function () {
            // https://angular-team.atlassian.net/browse/FW-719
            throw notImplemented();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "listeners", {
        get: function () {
            // TODO: add real implementation;
            // https://angular-team.atlassian.net/browse/FW-719
            return [];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "references", {
        get: function () { return getLocalRefs(this.nativeNode); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "providerTokens", {
        get: function () {
            // TODO move to discoverable utils
            var context = loadContext(this.nativeNode, false);
            if (!context)
                return [];
            var lView = context.lViewData;
            var tView = lView[TVIEW];
            var tNode = tView.data[context.nodeIndex];
            var providerTokens = [];
            var nodeFlags = tNode.flags;
            var startIndex = nodeFlags >> 16 /* DirectiveStartingIndexShift */;
            var directiveCount = nodeFlags & 4095 /* DirectiveCountMask */;
            var endIndex = startIndex + directiveCount;
            for (var i = startIndex; i < endIndex; i++) {
                var value = tView.data[i];
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
        },
        enumerable: true,
        configurable: true
    });
    return DebugNode__POST_R3__;
}());
var DebugElement__POST_R3__ = /** @class */ (function (_super) {
    tslib_1.__extends(DebugElement__POST_R3__, _super);
    function DebugElement__POST_R3__(nativeNode) {
        var _this = this;
        ngDevMode && assertDomNode(nativeNode);
        _this = _super.call(this, nativeNode) || this;
        return _this;
    }
    Object.defineProperty(DebugElement__POST_R3__.prototype, "nativeElement", {
        get: function () {
            return this.nativeNode.nodeType == Node.ELEMENT_NODE ? this.nativeNode : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "name", {
        get: function () { return this.nativeElement.nodeName; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "properties", {
        get: function () {
            var context = loadContext(this.nativeNode);
            var lView = context.lViewData;
            var tView = lView[TVIEW];
            var tNode = tView.data[context.nodeIndex];
            var properties = {};
            // TODO: https://angular-team.atlassian.net/browse/FW-681
            // Missing implementation here...
            return properties;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "attributes", {
        get: function () {
            // https://angular-team.atlassian.net/browse/FW-719
            throw notImplemented();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "classes", {
        get: function () {
            // https://angular-team.atlassian.net/browse/FW-719
            throw notImplemented();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "styles", {
        get: function () {
            // https://angular-team.atlassian.net/browse/FW-719
            throw notImplemented();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "childNodes", {
        get: function () {
            var childNodes = this.nativeNode.childNodes;
            var children = [];
            for (var i = 0; i < childNodes.length; i++) {
                var element = childNodes[i];
                children.push(getDebugNode__POST_R3__(element));
            }
            return children;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "children", {
        get: function () {
            var nativeElement = this.nativeElement;
            if (!nativeElement)
                return [];
            var childNodes = nativeElement.children;
            var children = [];
            for (var i = 0; i < childNodes.length; i++) {
                var element = childNodes[i];
                children.push(getDebugNode__POST_R3__(element));
            }
            return children;
        },
        enumerable: true,
        configurable: true
    });
    DebugElement__POST_R3__.prototype.query = function (predicate) {
        var results = this.queryAll(predicate);
        return results[0] || null;
    };
    DebugElement__POST_R3__.prototype.queryAll = function (predicate) {
        var matches = [];
        _queryNodeChildrenR3(this, predicate, matches, true);
        return matches;
    };
    DebugElement__POST_R3__.prototype.queryAllNodes = function (predicate) {
        var matches = [];
        _queryNodeChildrenR3(this, predicate, matches, false);
        return matches;
    };
    DebugElement__POST_R3__.prototype.triggerEventHandler = function (eventName, eventObj) {
        // This is a hack implementation. The correct implementation would bypass the DOM and `TNode`
        // information to invoke the listeners directly.
        // https://angular-team.atlassian.net/browse/FW-719
        var event = document.createEvent('MouseEvent');
        event.initEvent(eventName, true, true);
        this.nativeElement.dispatchEvent(event);
    };
    return DebugElement__POST_R3__;
}(DebugNode__POST_R3__));
/**
 * This function should not exist because it is megamorphic and only mostly correct.
 *
 * See call site for more info.
 */
function isDirectiveDefHack(obj) {
    return obj.type !== undefined && obj.template !== undefined && obj.declaredInputs !== undefined;
}
function _queryNodeChildrenR3(parentNode, predicate, matches, elementsOnly) {
    if (parentNode instanceof DebugElement__POST_R3__) {
        parentNode.childNodes.forEach(function (node) {
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
// Need to keep the nodes in a global Map so that multiple angular apps are supported.
var _nativeNodeToDebugNode = new Map();
function getDebugNode__PRE_R3__(nativeNode) {
    return _nativeNodeToDebugNode.get(nativeNode) || null;
}
export function getDebugNode__POST_R3__(nativeNode) {
    if (nativeNode instanceof Node) {
        return nativeNode.nodeType == Node.ELEMENT_NODE ?
            new DebugElement__POST_R3__(nativeNode) :
            new DebugNode__POST_R3__(nativeNode);
    }
    return null;
}
/**
 * @publicApi
 */
export var getDebugNode = getDebugNode__POST_R3__;
export function getAllDebugNodes() {
    return Array.from(_nativeNodeToDebugNode.values());
}
export function indexDebugNode(node) {
    _nativeNodeToDebugNode.set(node.nativeNode, node);
}
export function removeDebugNodeFromIndex(node) {
    _nativeNodeToDebugNode.delete(node.nativeNode);
}
/**
 * @publicApi
 */
export var DebugNode = DebugNode__PRE_R3__;
/**
 * @publicApi
 */
export var DebugElement = DebugElement__PRE_R3__;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQVVBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFaEcsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBR2pEO0lBQ0UsdUJBQW1CLElBQVksRUFBUyxRQUFrQjtRQUF2QyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBVTtJQUFHLENBQUM7SUFDaEUsb0JBQUM7QUFBRCxDQUFDLEFBRkQsSUFFQzs7QUFlRDtJQU1FLDZCQUFZLFVBQWUsRUFBRSxNQUFzQixFQUFFLGFBQTJCO1FBTHZFLGNBQVMsR0FBb0IsRUFBRSxDQUFDO1FBQ2hDLFdBQU0sR0FBc0IsSUFBSSxDQUFDO1FBS3hDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1FBQ25DLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksTUFBTSxJQUFJLE1BQU0sWUFBWSxzQkFBc0IsRUFBRTtZQUN0RCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZCO0lBQ0gsQ0FBQztJQUVELHNCQUFJLHlDQUFRO2FBQVosY0FBMkIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRWhFLHNCQUFJLGtEQUFpQjthQUFyQixjQUErQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFFckUsc0JBQUksd0NBQU87YUFBWCxj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QkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztBQUV6RCxTQUFTLHNCQUFzQixDQUFDLFVBQWU7SUFDN0MsT0FBTyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDO0FBQ3hELENBQUM7QUFLRCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsVUFBZTtJQUNyRCxJQUFJLFVBQVUsWUFBWSxJQUFJLEVBQUU7UUFDOUIsT0FBTyxVQUFVLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM3QyxJQUFJLHVCQUF1QixDQUFDLFVBQXFCLENBQUMsQ0FBQyxDQUFDO1lBQ3BELElBQUksb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDMUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sQ0FBQyxJQUFNLFlBQVksR0FmVCx1QkFleUUsQ0FBQztBQUUxRixNQUFNLFVBQVUsZ0JBQWdCO0lBQzlCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLElBQWU7SUFDNUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxJQUFlO0lBQ3RELHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDakQsQ0FBQztBQVVEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0sU0FBUyxHQUFzQyxtQkFBMEIsQ0FBQztBQUV2Rjs7R0FFRztBQUNILE1BQU0sQ0FBQyxJQUFNLFlBQVksR0FBeUMsc0JBQTZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuLi9yZW5kZXIzJztcbmltcG9ydCB7YXNzZXJ0RG9tTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldEluamVjdG9yLCBnZXRMb2NhbFJlZnMsIGxvYWRDb250ZXh0fSBmcm9tICcuLi9yZW5kZXIzL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1RWSUVXfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldy9pbmRleCc7XG5cbmV4cG9ydCBjbGFzcyBFdmVudExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGNhbGxiYWNrOiBGdW5jdGlvbikge31cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBFdmVudExpc3RlbmVyW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGw7XG4gIHJlYWRvbmx5IG5hdGl2ZU5vZGU6IGFueTtcbiAgcmVhZG9ubHkgaW5qZWN0b3I6IEluamVjdG9yO1xuICByZWFkb25seSBjb21wb25lbnRJbnN0YW5jZTogYW55O1xuICByZWFkb25seSBjb250ZXh0OiBhbnk7XG4gIHJlYWRvbmx5IHJlZmVyZW5jZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICByZWFkb25seSBwcm92aWRlclRva2VuczogYW55W107XG59XG5leHBvcnQgY2xhc3MgRGVidWdOb2RlX19QUkVfUjNfXyB7XG4gIHJlYWRvbmx5IGxpc3RlbmVyczogRXZlbnRMaXN0ZW5lcltdID0gW107XG4gIHJlYWRvbmx5IHBhcmVudDogRGVidWdFbGVtZW50fG51bGwgPSBudWxsO1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBhbnk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBEZWJ1Z05vZGV8bnVsbCwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgdGhpcy5fZGVidWdDb250ZXh0ID0gX2RlYnVnQ29udGV4dDtcbiAgICB0aGlzLm5hdGl2ZU5vZGUgPSBuYXRpdmVOb2RlO1xuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50IGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgcGFyZW50LmFkZENoaWxkKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuaW5qZWN0b3I7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb21wb25lbnQ7IH1cblxuICBnZXQgY29udGV4dCgpOiBhbnkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmNvbnRleHQ7IH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQucmVmZXJlbmNlczsgfVxuXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQucHJvdmlkZXJUb2tlbnM7IH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdFbGVtZW50IGV4dGVuZHMgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICByZWFkb25seSBwcm9wZXJ0aWVzOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgcmVhZG9ubHkgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn07XG4gIHJlYWRvbmx5IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuICByZWFkb25seSBjaGlsZHJlbjogRGVidWdFbGVtZW50W107XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudDtcbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdO1xuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXTtcbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQ7XG59XG5leHBvcnQgY2xhc3MgRGVidWdFbGVtZW50X19QUkVfUjNfXyBleHRlbmRzIERlYnVnTm9kZV9fUFJFX1IzX18gaW1wbGVtZW50cyBEZWJ1Z0VsZW1lbnQge1xuICByZWFkb25seSBuYW1lICE6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgcmVhZG9ubHkgYXR0cmlidXRlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHJlYWRvbmx5IGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjaGlsZE5vZGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG5cbiAgY29uc3RydWN0b3IobmF0aXZlTm9kZTogYW55LCBwYXJlbnQ6IGFueSwgX2RlYnVnQ29udGV4dDogRGVidWdDb250ZXh0KSB7XG4gICAgc3VwZXIobmF0aXZlTm9kZSwgcGFyZW50LCBfZGVidWdDb250ZXh0KTtcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSBuYXRpdmVOb2RlO1xuICB9XG5cbiAgYWRkQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGlmIChjaGlsZCkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnB1c2goY2hpbGQpO1xuICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICB9XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZDogRGVidWdOb2RlKSB7XG4gICAgY29uc3QgY2hpbGRJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoY2hpbGRJbmRleCAhPT0gLTEpIHtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZSB8IG51bGx9KS5wYXJlbnQgPSBudWxsO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShjaGlsZEluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRDaGlsZHJlbkFmdGVyKGNoaWxkOiBEZWJ1Z05vZGUsIG5ld0NoaWxkcmVuOiBEZWJ1Z05vZGVbXSkge1xuICAgIGNvbnN0IHNpYmxpbmdJbmRleCA9IHRoaXMuY2hpbGROb2Rlcy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoc2libGluZ0luZGV4ICE9PSAtMSkge1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShzaWJsaW5nSW5kZXggKyAxLCAwLCAuLi5uZXdDaGlsZHJlbik7XG4gICAgICBuZXdDaGlsZHJlbi5mb3JFYWNoKGMgPT4ge1xuICAgICAgICBpZiAoYy5wYXJlbnQpIHtcbiAgICAgICAgICAoYy5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQoYyk7XG4gICAgICAgIH1cbiAgICAgICAgKGNoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGluc2VydEJlZm9yZShyZWZDaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZDogRGVidWdOb2RlKTogdm9pZCB7XG4gICAgY29uc3QgcmVmSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihyZWZDaGlsZCk7XG4gICAgaWYgKHJlZkluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5hZGRDaGlsZChuZXdDaGlsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZXdDaGlsZC5wYXJlbnQpIHtcbiAgICAgICAgKG5ld0NoaWxkLnBhcmVudCBhcyBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKS5yZW1vdmVDaGlsZChuZXdDaGlsZCk7XG4gICAgICB9XG4gICAgICAobmV3Q2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGV9KS5wYXJlbnQgPSB0aGlzO1xuICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShyZWZJbmRleCwgMCwgbmV3Q2hpbGQpO1xuICAgIH1cbiAgfVxuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHMgPSB0aGlzLnF1ZXJ5QWxsKHByZWRpY2F0ZSk7XG4gICAgcmV0dXJuIHJlc3VsdHNbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdFbGVtZW50W10gPSBbXTtcbiAgICBfcXVlcnlFbGVtZW50Q2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlbih0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICByZXR1cm4gdGhpc1xuICAgICAgICAuY2hpbGROb2RlcyAgLy9cbiAgICAgICAgLmZpbHRlcigobm9kZSkgPT4gbm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIGFzIERlYnVnRWxlbWVudFtdO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBpZiAobGlzdGVuZXIubmFtZSA9PSBldmVudE5hbWUpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbGJhY2soZXZlbnRPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNOYXRpdmVFbGVtZW50cyhkZWJ1Z0VsczogRGVidWdFbGVtZW50W10pOiBhbnkge1xuICByZXR1cm4gZGVidWdFbHMubWFwKChlbCkgPT4gZWwubmF0aXZlRWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIF9xdWVyeUVsZW1lbnRDaGlsZHJlbihcbiAgICBlbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4sIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdKSB7XG4gIGVsZW1lbnQuY2hpbGROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgaWYgKHByZWRpY2F0ZShub2RlKSkge1xuICAgICAgICBtYXRjaGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgICBfcXVlcnlFbGVtZW50Q2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW4oXG4gICAgcGFyZW50Tm9kZTogRGVidWdOb2RlLCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSkge1xuICBpZiAocGFyZW50Tm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICBwYXJlbnROb2RlLmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlbihub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKCk6IEVycm9yIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHByb3BlciBpdnkgaW1wbGVtZW50YXRpb24uJyk7XG59XG5cbmNsYXNzIERlYnVnTm9kZV9fUE9TVF9SM19fIGltcGxlbWVudHMgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogTm9kZTtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBOb2RlKSB7IHRoaXMubmF0aXZlTm9kZSA9IG5hdGl2ZU5vZGU7IH1cblxuICBnZXQgcGFyZW50KCk6IERlYnVnRWxlbWVudHxudWxsIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLm5hdGl2ZU5vZGUucGFyZW50Tm9kZSBhcyBIVE1MRWxlbWVudDtcbiAgICByZXR1cm4gcGFyZW50ID8gbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKHBhcmVudCkgOiBudWxsO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGdldEluamVjdG9yKHRoaXMubmF0aXZlTm9kZSk7IH1cblxuICBnZXQgY29tcG9uZW50SW5zdGFuY2UoKTogYW55IHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVOb2RlO1xuICAgIHJldHVybiBuYXRpdmVFbGVtZW50ICYmIGdldENvbXBvbmVudChuYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbiAgfVxuICBnZXQgY29udGV4dCgpOiBhbnkge1xuICAgIC8vIGh0dHBzOi8vYW5ndWxhci10ZWFtLmF0bGFzc2lhbi5uZXQvYnJvd3NlL0ZXLTcxOVxuICAgIHRocm93IG5vdEltcGxlbWVudGVkKCk7XG4gIH1cblxuICBnZXQgbGlzdGVuZXJzKCk6IEV2ZW50TGlzdGVuZXJbXSB7XG4gICAgLy8gVE9ETzogYWRkIHJlYWwgaW1wbGVtZW50YXRpb247XG4gICAgLy8gaHR0cHM6Ly9hbmd1bGFyLXRlYW0uYXRsYXNzaWFuLm5ldC9icm93c2UvRlctNzE5XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHsgcmV0dXJuIGdldExvY2FsUmVmcyh0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICAvLyBUT0RPIG1vdmUgdG8gZGlzY292ZXJhYmxlIHV0aWxzXG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSBhcyBIVE1MRWxlbWVudCwgZmFsc2UpICE7XG4gICAgaWYgKCFjb250ZXh0KSByZXR1cm4gW107XG4gICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3RGF0YTtcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICAgIGNvbnN0IHByb3ZpZGVyVG9rZW5zOiBhbnlbXSA9IFtdO1xuICAgIGNvbnN0IG5vZGVGbGFncyA9IHROb2RlLmZsYWdzO1xuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZGlyZWN0aXZlQ291bnQgPSBub2RlRmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgICBjb25zdCBlbmRJbmRleCA9IHN0YXJ0SW5kZXggKyBkaXJlY3RpdmVDb3VudDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA8IGVuZEluZGV4OyBpKyspIHtcbiAgICAgIGxldCB2YWx1ZSA9IHRWaWV3LmRhdGFbaV07XG4gICAgICBpZiAoaXNEaXJlY3RpdmVEZWZIYWNrKHZhbHVlKSkge1xuICAgICAgICAvLyBUaGUgZmFjdCB0aGF0IHdlIHNvbWV0aW1lcyBzdG9yZSBUeXBlIGFuZCBzb21ldGltZXMgRGlyZWN0aXZlRGVmIGluIHRoaXMgbG9jYXRpb24gaXMgYVxuICAgICAgICAvLyBkZXNpZ24gZmxhdy4gIFdlIHNob3VsZCBhbHdheXMgc3RvcmUgc2FtZSB0eXBlIHNvIHRoYXQgd2UgY2FuIGJlIG1vbm9tb3JwaGljLiBUaGUgaXNzdWVcbiAgICAgICAgLy8gaXMgdGhhdCBmb3IgQ29tcG9uZW50cy9EaXJlY3RpdmVzIHdlIHN0b3JlIHRoZSBkZWYgaW5zdGVhZCB0aGUgdHlwZS4gVGhlIGNvcnJlY3QgYmVoYXZpb3JcbiAgICAgICAgLy8gaXMgdGhhdCB3ZSBzaG91bGQgYWx3YXlzIGJlIHN0b3JpbmcgaW5qZWN0YWJsZSB0eXBlIGluIHRoaXMgbG9jYXRpb24uXG4gICAgICAgIHZhbHVlID0gdmFsdWUudHlwZTtcbiAgICAgIH1cbiAgICAgIHByb3ZpZGVyVG9rZW5zLnB1c2godmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvdmlkZXJUb2tlbnM7XG4gIH1cbn1cblxuY2xhc3MgRGVidWdFbGVtZW50X19QT1NUX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBuYXRpdmVFbGVtZW50KCk6IEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/IHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50IDogbnVsbDtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7IHJldHVybiAodGhpcy5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5ub2RlTmFtZTsgfVxuXG4gIGdldCBwcm9wZXJ0aWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnk7fSB7XG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSkgITtcbiAgICBjb25zdCBsVmlldyA9IGNvbnRleHQubFZpZXdEYXRhO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gICAgY29uc3QgcHJvcGVydGllcyA9IHt9O1xuICAgIC8vIFRPRE86IGh0dHBzOi8vYW5ndWxhci10ZWFtLmF0bGFzc2lhbi5uZXQvYnJvd3NlL0ZXLTY4MVxuICAgIC8vIE1pc3NpbmcgaW1wbGVtZW50YXRpb24gaGVyZS4uLlxuICAgIHJldHVybiBwcm9wZXJ0aWVzO1xuICB9XG5cbiAgZ2V0IGF0dHJpYnV0ZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGw7fSB7XG4gICAgLy8gaHR0cHM6Ly9hbmd1bGFyLXRlYW0uYXRsYXNzaWFuLm5ldC9icm93c2UvRlctNzE5XG4gICAgdGhyb3cgbm90SW1wbGVtZW50ZWQoKTtcbiAgfVxuXG4gIGdldCBjbGFzc2VzKCk6IHtba2V5OiBzdHJpbmddOiBib29sZWFuO30ge1xuICAgIC8vIGh0dHBzOi8vYW5ndWxhci10ZWFtLmF0bGFzc2lhbi5uZXQvYnJvd3NlL0ZXLTcxOVxuICAgIHRocm93IG5vdEltcGxlbWVudGVkKCk7XG4gIH1cblxuICBnZXQgc3R5bGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsO30ge1xuICAgIC8vIGh0dHBzOi8vYW5ndWxhci10ZWFtLmF0bGFzc2lhbi5uZXQvYnJvd3NlL0ZXLTcxOVxuICAgIHRocm93IG5vdEltcGxlbWVudGVkKCk7XG4gIH1cblxuICBnZXQgY2hpbGROb2RlcygpOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IHRoaXMubmF0aXZlTm9kZS5jaGlsZE5vZGVzO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZV9fUE9TVF9SM19fKGVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdGhpcy5uYXRpdmVFbGVtZW50O1xuICAgIGlmICghbmF0aXZlRWxlbWVudCkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBuYXRpdmVFbGVtZW50LmNoaWxkcmVuO1xuICAgIGNvbnN0IGNoaWxkcmVuOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICBjaGlsZHJlbi5wdXNoKGdldERlYnVnTm9kZV9fUE9TVF9SM19fKGVsZW1lbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkcmVuO1xuICB9XG5cbiAgcXVlcnkocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudCB7XG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucXVlcnlBbGwocHJlZGljYXRlKTtcbiAgICByZXR1cm4gcmVzdWx0c1swXSB8fCBudWxsO1xuICB9XG5cbiAgcXVlcnlBbGwocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50Pik6IERlYnVnRWxlbWVudFtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSA9IFtdO1xuICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgdHJ1ZSk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0aGlzLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGZhbHNlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkIHtcbiAgICAvLyBUaGlzIGlzIGEgaGFjayBpbXBsZW1lbnRhdGlvbi4gVGhlIGNvcnJlY3QgaW1wbGVtZW50YXRpb24gd291bGQgYnlwYXNzIHRoZSBET00gYW5kIGBUTm9kZWBcbiAgICAvLyBpbmZvcm1hdGlvbiB0byBpbnZva2UgdGhlIGxpc3RlbmVycyBkaXJlY3RseS5cbiAgICAvLyBodHRwczovL2FuZ3VsYXItdGVhbS5hdGxhc3NpYW4ubmV0L2Jyb3dzZS9GVy03MTlcbiAgICBjb25zdCBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50TmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgKHRoaXMubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCkuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBub3QgZXhpc3QgYmVjYXVzZSBpdCBpcyBtZWdhbW9ycGhpYyBhbmQgb25seSBtb3N0bHkgY29ycmVjdC5cbiAqXG4gKiBTZWUgY2FsbCBzaXRlIGZvciBtb3JlIGluZm8uXG4gKi9cbmZ1bmN0aW9uIGlzRGlyZWN0aXZlRGVmSGFjayhvYmo6IGFueSk6IG9iaiBpcyBEaXJlY3RpdmVEZWY8YW55PiB7XG4gIHJldHVybiBvYmoudHlwZSAhPT0gdW5kZWZpbmVkICYmIG9iai50ZW1wbGF0ZSAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWNsYXJlZElucHV0cyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICBwYXJlbnROb2RlOiBEZWJ1Z05vZGUsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogYm9vbGVhbikge1xuICBpZiAocGFyZW50Tm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fKSB7XG4gICAgcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QT1NUX1IzX18pIHtcbiAgICAgICAgaWYgKGVsZW1lbnRzT25seSA/IG5vZGUubmF0aXZlRWxlbWVudCA6IHRydWUpIHtcbiAgICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhub2RlLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5cbi8vIE5lZWQgdG8ga2VlcCB0aGUgbm9kZXMgaW4gYSBnbG9iYWwgTWFwIHNvIHRoYXQgbXVsdGlwbGUgYW5ndWxhciBhcHBzIGFyZSBzdXBwb3J0ZWQuXG5jb25zdCBfbmF0aXZlTm9kZVRvRGVidWdOb2RlID0gbmV3IE1hcDxhbnksIERlYnVnTm9kZT4oKTtcblxuZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QUkVfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIHJldHVybiBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmdldChuYXRpdmVOb2RlKSB8fCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogRWxlbWVudCk6IERlYnVnRWxlbWVudF9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IE5vZGUpOiBEZWJ1Z05vZGVfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBudWxsKTogbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIGlmIChuYXRpdmVOb2RlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIHJldHVybiBuYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID9cbiAgICAgICAgbmV3IERlYnVnRWxlbWVudF9fUE9TVF9SM19fKG5hdGl2ZU5vZGUgYXMgRWxlbWVudCkgOlxuICAgICAgICBuZXcgRGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGVidWdOb2RlOiAobmF0aXZlTm9kZTogYW55KSA9PiBEZWJ1Z05vZGUgfCBudWxsID0gZ2V0RGVidWdOb2RlX19QUkVfUjNfXztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbERlYnVnTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnZhbHVlcygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4RGVidWdOb2RlKG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnNldChub2RlLm5hdGl2ZU5vZGUsIG5vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4KG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmRlbGV0ZShub2RlLm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIEEgYm9vbGVhbi12YWx1ZWQgZnVuY3Rpb24gb3ZlciBhIHZhbHVlLCBwb3NzaWJseSBpbmNsdWRpbmcgY29udGV4dCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIHRoYXQgdmFsdWUncyBwb3NpdGlvbiBpbiBhbiBhcnJheS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJlZGljYXRlPFQ+IHsgKHZhbHVlOiBUKTogYm9vbGVhbjsgfVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnTm9kZToge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z05vZGV9ID0gRGVidWdOb2RlX19QUkVfUjNfXyBhcyBhbnk7XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgRGVidWdFbGVtZW50OiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IERlYnVnRWxlbWVudH0gPSBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fIGFzIGFueTtcbiJdfQ==