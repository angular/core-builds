/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/template_usage_visitor", ["require", "exports", "@angular/compiler", "@angular/core/schematics/utils/template_ast_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateUsageVisitor = void 0;
    const compiler_1 = require("@angular/compiler");
    const template_ast_visitor_1 = require("@angular/core/schematics/utils/template_ast_visitor");
    /**
     * AST visitor that traverses the Render3 HTML AST in order to check if the given
     * query property is accessed statically in the template.
     */
    class TemplateUsageVisitor extends template_ast_visitor_1.TemplateAstVisitor {
        constructor(queryPropertyName) {
            super();
            this.queryPropertyName = queryPropertyName;
            this.hasQueryTemplateReference = false;
            this.expressionAstVisitor = new ExpressionAstVisitor(this.queryPropertyName);
        }
        /** Checks whether the given query is statically accessed within the specified HTML nodes. */
        isQueryUsedStatically(htmlNodes) {
            this.hasQueryTemplateReference = false;
            this.expressionAstVisitor.hasQueryPropertyRead = false;
            // Visit all AST nodes and check if the query property is used statically.
            this.visitAll(htmlNodes);
            return !this.hasQueryTemplateReference && this.expressionAstVisitor.hasQueryPropertyRead;
        }
        visitElement(element) {
            // In case there is a template references variable that matches the query property
            // name, we can finish this visitor as such a template variable can be used in the
            // entire template and the query therefore can't be accessed from the template.
            if (element.references.some(r => r.name === this.queryPropertyName)) {
                this.hasQueryTemplateReference = true;
                return;
            }
            this.visitAll(element.attributes);
            this.visitAll(element.inputs);
            this.visitAll(element.outputs);
            this.visitAll(element.children);
        }
        visitTemplate(template) {
            this.visitAll(template.attributes);
            this.visitAll(template.inputs);
            this.visitAll(template.outputs);
            // We don't want to visit any children of the template as these never can't
            // access a query statically. The templates can be rendered in the ngAfterViewInit"
            // lifecycle hook at the earliest.
        }
        visitBoundAttribute(attribute) {
            attribute.value.visit(this.expressionAstVisitor, attribute.sourceSpan);
        }
        visitBoundText(text) {
            text.value.visit(this.expressionAstVisitor, text.sourceSpan);
        }
        visitBoundEvent(node) {
            node.handler.visit(this.expressionAstVisitor, node.handlerSpan);
        }
    }
    exports.TemplateUsageVisitor = TemplateUsageVisitor;
    /**
     * AST visitor that checks if the given expression contains property reads that
     * refer to the specified query property name.
     */
    class ExpressionAstVisitor extends compiler_1.RecursiveAstVisitor {
        constructor(queryPropertyName) {
            super();
            this.queryPropertyName = queryPropertyName;
            this.hasQueryPropertyRead = false;
        }
        visitPropertyRead(node, span) {
            // The receiver of the property read needs to be "implicit" as queries are accessed
            // from the component instance and not from other objects.
            if (node.receiver instanceof compiler_1.ImplicitReceiver && node.name === this.queryPropertyName) {
                this.hasQueryPropertyRead = true;
                return;
            }
            super.visitPropertyRead(node, span);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvdGVtcGxhdGVfdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxnREFBaU47SUFDak4sOEZBQTBFO0lBRTFFOzs7T0FHRztJQUNILE1BQWEsb0JBQXFCLFNBQVEseUNBQWtCO1FBSTFELFlBQW1CLGlCQUF5QjtZQUMxQyxLQUFLLEVBQUUsQ0FBQztZQURTLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQUhwQyw4QkFBeUIsR0FBRyxLQUFLLENBQUM7WUFDbEMseUJBQW9CLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUloRixDQUFDO1FBRUQsNkZBQTZGO1FBQzdGLHFCQUFxQixDQUFDLFNBQXdCO1lBQzVDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxLQUFLLENBQUM7WUFDdkMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztZQUV2RCwwRUFBMEU7WUFDMUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUV6QixPQUFPLENBQUMsSUFBSSxDQUFDLHlCQUF5QixJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQztRQUMzRixDQUFDO1FBRVEsWUFBWSxDQUFDLE9BQXVCO1lBQzNDLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsK0VBQStFO1lBQy9FLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO2dCQUNuRSxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDO2dCQUN0QyxPQUFPO2FBQ1I7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRVEsYUFBYSxDQUFDLFFBQXlCO1lBQzlDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWhDLDJFQUEyRTtZQUMzRSxtRkFBbUY7WUFDbkYsa0NBQWtDO1FBQ3BDLENBQUM7UUFFUSxtQkFBbUIsQ0FBQyxTQUFnQztZQUMzRCxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFUSxjQUFjLENBQUMsSUFBc0I7WUFDNUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRVEsZUFBZSxDQUFDLElBQXVCO1lBQzlDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEUsQ0FBQztLQUNGO0lBdkRELG9EQXVEQztJQUVEOzs7T0FHRztJQUNILE1BQU0sb0JBQXFCLFNBQVEsOEJBQW1CO1FBR3BELFlBQW9CLGlCQUF5QjtZQUMzQyxLQUFLLEVBQUUsQ0FBQztZQURVLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQUY3Qyx5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFJN0IsQ0FBQztRQUVRLGlCQUFpQixDQUFDLElBQWtCLEVBQUUsSUFBcUI7WUFDbEUsbUZBQW1GO1lBQ25GLDBEQUEwRDtZQUMxRCxJQUFJLElBQUksQ0FBQyxRQUFRLFlBQVksMkJBQWdCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ3JGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7Z0JBQ2pDLE9BQU87YUFDUjtZQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsQ0FBQztLQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW1wbGljaXRSZWNlaXZlciwgUGFyc2VTb3VyY2VTcGFuLCBQcm9wZXJ0eVJlYWQsIFJlY3Vyc2l2ZUFzdFZpc2l0b3IsIFRtcGxBc3RCb3VuZEF0dHJpYnV0ZSwgVG1wbEFzdEJvdW5kRXZlbnQsIFRtcGxBc3RCb3VuZFRleHQsIFRtcGxBc3RFbGVtZW50LCBUbXBsQXN0Tm9kZSwgVG1wbEFzdFRlbXBsYXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge1RlbXBsYXRlQXN0VmlzaXRvcn0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvdGVtcGxhdGVfYXN0X3Zpc2l0b3InO1xuXG4vKipcbiAqIEFTVCB2aXNpdG9yIHRoYXQgdHJhdmVyc2VzIHRoZSBSZW5kZXIzIEhUTUwgQVNUIGluIG9yZGVyIHRvIGNoZWNrIGlmIHRoZSBnaXZlblxuICogcXVlcnkgcHJvcGVydHkgaXMgYWNjZXNzZWQgc3RhdGljYWxseSBpbiB0aGUgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVVzYWdlVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlQXN0VmlzaXRvciB7XG4gIHByaXZhdGUgaGFzUXVlcnlUZW1wbGF0ZVJlZmVyZW5jZSA9IGZhbHNlO1xuICBwcml2YXRlIGV4cHJlc3Npb25Bc3RWaXNpdG9yID0gbmV3IEV4cHJlc3Npb25Bc3RWaXNpdG9yKHRoaXMucXVlcnlQcm9wZXJ0eU5hbWUpO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBxdWVyeVByb3BlcnR5TmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8qKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gcXVlcnkgaXMgc3RhdGljYWxseSBhY2Nlc3NlZCB3aXRoaW4gdGhlIHNwZWNpZmllZCBIVE1MIG5vZGVzLiAqL1xuICBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkoaHRtbE5vZGVzOiBUbXBsQXN0Tm9kZVtdKTogYm9vbGVhbiB7XG4gICAgdGhpcy5oYXNRdWVyeVRlbXBsYXRlUmVmZXJlbmNlID0gZmFsc2U7XG4gICAgdGhpcy5leHByZXNzaW9uQXN0VmlzaXRvci5oYXNRdWVyeVByb3BlcnR5UmVhZCA9IGZhbHNlO1xuXG4gICAgLy8gVmlzaXQgYWxsIEFTVCBub2RlcyBhbmQgY2hlY2sgaWYgdGhlIHF1ZXJ5IHByb3BlcnR5IGlzIHVzZWQgc3RhdGljYWxseS5cbiAgICB0aGlzLnZpc2l0QWxsKGh0bWxOb2Rlcyk7XG5cbiAgICByZXR1cm4gIXRoaXMuaGFzUXVlcnlUZW1wbGF0ZVJlZmVyZW5jZSAmJiB0aGlzLmV4cHJlc3Npb25Bc3RWaXNpdG9yLmhhc1F1ZXJ5UHJvcGVydHlSZWFkO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRFbGVtZW50KGVsZW1lbnQ6IFRtcGxBc3RFbGVtZW50KTogdm9pZCB7XG4gICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBhIHRlbXBsYXRlIHJlZmVyZW5jZXMgdmFyaWFibGUgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeSBwcm9wZXJ0eVxuICAgIC8vIG5hbWUsIHdlIGNhbiBmaW5pc2ggdGhpcyB2aXNpdG9yIGFzIHN1Y2ggYSB0ZW1wbGF0ZSB2YXJpYWJsZSBjYW4gYmUgdXNlZCBpbiB0aGVcbiAgICAvLyBlbnRpcmUgdGVtcGxhdGUgYW5kIHRoZSBxdWVyeSB0aGVyZWZvcmUgY2FuJ3QgYmUgYWNjZXNzZWQgZnJvbSB0aGUgdGVtcGxhdGUuXG4gICAgaWYgKGVsZW1lbnQucmVmZXJlbmNlcy5zb21lKHIgPT4gci5uYW1lID09PSB0aGlzLnF1ZXJ5UHJvcGVydHlOYW1lKSkge1xuICAgICAgdGhpcy5oYXNRdWVyeVRlbXBsYXRlUmVmZXJlbmNlID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnZpc2l0QWxsKGVsZW1lbnQuYXR0cmlidXRlcyk7XG4gICAgdGhpcy52aXNpdEFsbChlbGVtZW50LmlucHV0cyk7XG4gICAgdGhpcy52aXNpdEFsbChlbGVtZW50Lm91dHB1dHMpO1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5jaGlsZHJlbik7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdFRlbXBsYXRlKHRlbXBsYXRlOiBUbXBsQXN0VGVtcGxhdGUpOiB2b2lkIHtcbiAgICB0aGlzLnZpc2l0QWxsKHRlbXBsYXRlLmF0dHJpYnV0ZXMpO1xuICAgIHRoaXMudmlzaXRBbGwodGVtcGxhdGUuaW5wdXRzKTtcbiAgICB0aGlzLnZpc2l0QWxsKHRlbXBsYXRlLm91dHB1dHMpO1xuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byB2aXNpdCBhbnkgY2hpbGRyZW4gb2YgdGhlIHRlbXBsYXRlIGFzIHRoZXNlIG5ldmVyIGNhbid0XG4gICAgLy8gYWNjZXNzIGEgcXVlcnkgc3RhdGljYWxseS4gVGhlIHRlbXBsYXRlcyBjYW4gYmUgcmVuZGVyZWQgaW4gdGhlIG5nQWZ0ZXJWaWV3SW5pdFwiXG4gICAgLy8gbGlmZWN5Y2xlIGhvb2sgYXQgdGhlIGVhcmxpZXN0LlxuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRCb3VuZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IFRtcGxBc3RCb3VuZEF0dHJpYnV0ZSkge1xuICAgIGF0dHJpYnV0ZS52YWx1ZS52aXNpdCh0aGlzLmV4cHJlc3Npb25Bc3RWaXNpdG9yLCBhdHRyaWJ1dGUuc291cmNlU3Bhbik7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdEJvdW5kVGV4dCh0ZXh0OiBUbXBsQXN0Qm91bmRUZXh0KSB7XG4gICAgdGV4dC52YWx1ZS52aXNpdCh0aGlzLmV4cHJlc3Npb25Bc3RWaXNpdG9yLCB0ZXh0LnNvdXJjZVNwYW4pO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRCb3VuZEV2ZW50KG5vZGU6IFRtcGxBc3RCb3VuZEV2ZW50KSB7XG4gICAgbm9kZS5oYW5kbGVyLnZpc2l0KHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IsIG5vZGUuaGFuZGxlclNwYW4pO1xuICB9XG59XG5cbi8qKlxuICogQVNUIHZpc2l0b3IgdGhhdCBjaGVja3MgaWYgdGhlIGdpdmVuIGV4cHJlc3Npb24gY29udGFpbnMgcHJvcGVydHkgcmVhZHMgdGhhdFxuICogcmVmZXIgdG8gdGhlIHNwZWNpZmllZCBxdWVyeSBwcm9wZXJ0eSBuYW1lLlxuICovXG5jbGFzcyBFeHByZXNzaW9uQXN0VmlzaXRvciBleHRlbmRzIFJlY3Vyc2l2ZUFzdFZpc2l0b3Ige1xuICBoYXNRdWVyeVByb3BlcnR5UmVhZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcXVlcnlQcm9wZXJ0eU5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdFByb3BlcnR5UmVhZChub2RlOiBQcm9wZXJ0eVJlYWQsIHNwYW46IFBhcnNlU291cmNlU3Bhbik6IGFueSB7XG4gICAgLy8gVGhlIHJlY2VpdmVyIG9mIHRoZSBwcm9wZXJ0eSByZWFkIG5lZWRzIHRvIGJlIFwiaW1wbGljaXRcIiBhcyBxdWVyaWVzIGFyZSBhY2Nlc3NlZFxuICAgIC8vIGZyb20gdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgbm90IGZyb20gb3RoZXIgb2JqZWN0cy5cbiAgICBpZiAobm9kZS5yZWNlaXZlciBpbnN0YW5jZW9mIEltcGxpY2l0UmVjZWl2ZXIgJiYgbm9kZS5uYW1lID09PSB0aGlzLnF1ZXJ5UHJvcGVydHlOYW1lKSB7XG4gICAgICB0aGlzLmhhc1F1ZXJ5UHJvcGVydHlSZWFkID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzdXBlci52aXNpdFByb3BlcnR5UmVhZChub2RlLCBzcGFuKTtcbiAgfVxufVxuIl19