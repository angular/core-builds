/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
        define("@angular/core/schematics/migrations/static-queries/angular/query_read_html_visitor", ["require", "exports", "@angular/compiler", "@angular/compiler/src/render3/r3_ast"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const compiler_1 = require("@angular/compiler");
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    /**
     * AST visitor that traverses the Render3 HTML AST in order to check if the given
     * query property is accessed statically in the template.
     */
    class QueryReadHtmlVisitor extends r3_ast_1.NullVisitor {
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
            r3_ast_1.visitAll(this, htmlNodes);
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
            r3_ast_1.visitAll(this, element.attributes);
            r3_ast_1.visitAll(this, element.inputs);
            r3_ast_1.visitAll(this, element.outputs);
            r3_ast_1.visitAll(this, element.children);
        }
        visitTemplate(template) {
            r3_ast_1.visitAll(this, template.attributes);
            r3_ast_1.visitAll(this, template.inputs);
            r3_ast_1.visitAll(this, template.outputs);
            // We don't want to visit any children of the template as these never can't
            // access a query statically. The templates can be rendered in the ngAfterViewInit"
            // lifecycle hook at the earliest.
        }
        visitBoundAttribute(attribute) {
            attribute.value.visit(this.expressionAstVisitor, attribute.sourceSpan);
        }
        visitBoundText(text) { text.value.visit(this.expressionAstVisitor, text.sourceSpan); }
        visitBoundEvent(node) {
            node.handler.visit(this.expressionAstVisitor, node.handlerSpan);
        }
    }
    exports.QueryReadHtmlVisitor = QueryReadHtmlVisitor;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlfcmVhZF9odG1sX3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9hbmd1bGFyL3F1ZXJ5X3JlYWRfaHRtbF92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsZ0RBQXVHO0lBQ3ZHLGlFQUEySTtJQUUzSTs7O09BR0c7SUFDSCxNQUFhLG9CQUFxQixTQUFRLG9CQUFXO1FBSW5ELFlBQW1CLGlCQUF5QjtZQUFJLEtBQUssRUFBRSxDQUFDO1lBQXJDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQUhwQyw4QkFBeUIsR0FBRyxLQUFLLENBQUM7WUFDbEMseUJBQW9CLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUV2QixDQUFDO1FBRTFELDZGQUE2RjtRQUM3RixxQkFBcUIsQ0FBQyxTQUFpQjtZQUNyQyxJQUFJLENBQUMseUJBQXlCLEdBQUcsS0FBSyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7WUFFdkQsMEVBQTBFO1lBQzFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRTFCLE9BQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDO1FBQzNGLENBQUM7UUFFRCxZQUFZLENBQUMsT0FBZ0I7WUFDM0Isa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRiwrRUFBK0U7WUFDL0UsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7Z0JBQ25FLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUM7Z0JBQ3RDLE9BQU87YUFDUjtZQUVELGlCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuQyxpQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0IsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsYUFBYSxDQUFDLFFBQWtCO1lBQzlCLGlCQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNwQyxpQkFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWpDLDJFQUEyRTtZQUMzRSxtRkFBbUY7WUFDbkYsa0NBQWtDO1FBQ3BDLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxTQUF5QjtZQUMzQyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxjQUFjLENBQUMsSUFBZSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWpHLGVBQWUsQ0FBQyxJQUFnQjtZQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7S0FDRjtJQW5ERCxvREFtREM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLG9CQUFxQixTQUFRLDhCQUFtQjtRQUdwRCxZQUFvQixpQkFBeUI7WUFBSSxLQUFLLEVBQUUsQ0FBQztZQUFyQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQVE7WUFGN0MseUJBQW9CLEdBQUcsS0FBSyxDQUFDO1FBRTZCLENBQUM7UUFFM0QsaUJBQWlCLENBQUMsSUFBa0IsRUFBRSxJQUFxQjtZQUN6RCxtRkFBbUY7WUFDbkYsMERBQTBEO1lBQzFELElBQUksSUFBSSxDQUFDLFFBQVEsWUFBWSwyQkFBZ0IsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDckYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztnQkFDakMsT0FBTzthQUNSO1lBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDO0tBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW1wbGljaXRSZWNlaXZlciwgUGFyc2VTb3VyY2VTcGFuLCBQcm9wZXJ0eVJlYWQsIFJlY3Vyc2l2ZUFzdFZpc2l0b3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Qm91bmRBdHRyaWJ1dGUsIEJvdW5kRXZlbnQsIEJvdW5kVGV4dCwgRWxlbWVudCwgTm9kZSwgTnVsbFZpc2l0b3IsIFRlbXBsYXRlLCB2aXNpdEFsbH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXIvc3JjL3JlbmRlcjMvcjNfYXN0JztcblxuLyoqXG4gKiBBU1QgdmlzaXRvciB0aGF0IHRyYXZlcnNlcyB0aGUgUmVuZGVyMyBIVE1MIEFTVCBpbiBvcmRlciB0byBjaGVjayBpZiB0aGUgZ2l2ZW5cbiAqIHF1ZXJ5IHByb3BlcnR5IGlzIGFjY2Vzc2VkIHN0YXRpY2FsbHkgaW4gdGhlIHRlbXBsYXRlLlxuICovXG5leHBvcnQgY2xhc3MgUXVlcnlSZWFkSHRtbFZpc2l0b3IgZXh0ZW5kcyBOdWxsVmlzaXRvciB7XG4gIHByaXZhdGUgaGFzUXVlcnlUZW1wbGF0ZVJlZmVyZW5jZSA9IGZhbHNlO1xuICBwcml2YXRlIGV4cHJlc3Npb25Bc3RWaXNpdG9yID0gbmV3IEV4cHJlc3Npb25Bc3RWaXNpdG9yKHRoaXMucXVlcnlQcm9wZXJ0eU5hbWUpO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBxdWVyeVByb3BlcnR5TmFtZTogc3RyaW5nKSB7IHN1cGVyKCk7IH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIHF1ZXJ5IGlzIHN0YXRpY2FsbHkgYWNjZXNzZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgSFRNTCBub2Rlcy4gKi9cbiAgaXNRdWVyeVVzZWRTdGF0aWNhbGx5KGh0bWxOb2RlczogTm9kZVtdKTogYm9vbGVhbiB7XG4gICAgdGhpcy5oYXNRdWVyeVRlbXBsYXRlUmVmZXJlbmNlID0gZmFsc2U7XG4gICAgdGhpcy5leHByZXNzaW9uQXN0VmlzaXRvci5oYXNRdWVyeVByb3BlcnR5UmVhZCA9IGZhbHNlO1xuXG4gICAgLy8gVmlzaXQgYWxsIEFTVCBub2RlcyBhbmQgY2hlY2sgaWYgdGhlIHF1ZXJ5IHByb3BlcnR5IGlzIHVzZWQgc3RhdGljYWxseS5cbiAgICB2aXNpdEFsbCh0aGlzLCBodG1sTm9kZXMpO1xuXG4gICAgcmV0dXJuICF0aGlzLmhhc1F1ZXJ5VGVtcGxhdGVSZWZlcmVuY2UgJiYgdGhpcy5leHByZXNzaW9uQXN0VmlzaXRvci5oYXNRdWVyeVByb3BlcnR5UmVhZDtcbiAgfVxuXG4gIHZpc2l0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogdm9pZCB7XG4gICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBhIHRlbXBsYXRlIHJlZmVyZW5jZXMgdmFyaWFibGUgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeSBwcm9wZXJ0eVxuICAgIC8vIG5hbWUsIHdlIGNhbiBmaW5pc2ggdGhpcyB2aXNpdG9yIGFzIHN1Y2ggYSB0ZW1wbGF0ZSB2YXJpYWJsZSBjYW4gYmUgdXNlZCBpbiB0aGVcbiAgICAvLyBlbnRpcmUgdGVtcGxhdGUgYW5kIHRoZSBxdWVyeSB0aGVyZWZvcmUgY2FuJ3QgYmUgYWNjZXNzZWQgZnJvbSB0aGUgdGVtcGxhdGUuXG4gICAgaWYgKGVsZW1lbnQucmVmZXJlbmNlcy5zb21lKHIgPT4gci5uYW1lID09PSB0aGlzLnF1ZXJ5UHJvcGVydHlOYW1lKSkge1xuICAgICAgdGhpcy5oYXNRdWVyeVRlbXBsYXRlUmVmZXJlbmNlID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2aXNpdEFsbCh0aGlzLCBlbGVtZW50LmF0dHJpYnV0ZXMpO1xuICAgIHZpc2l0QWxsKHRoaXMsIGVsZW1lbnQuaW5wdXRzKTtcbiAgICB2aXNpdEFsbCh0aGlzLCBlbGVtZW50Lm91dHB1dHMpO1xuICAgIHZpc2l0QWxsKHRoaXMsIGVsZW1lbnQuY2hpbGRyZW4pO1xuICB9XG5cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogVGVtcGxhdGUpOiB2b2lkIHtcbiAgICB2aXNpdEFsbCh0aGlzLCB0ZW1wbGF0ZS5hdHRyaWJ1dGVzKTtcbiAgICB2aXNpdEFsbCh0aGlzLCB0ZW1wbGF0ZS5pbnB1dHMpO1xuICAgIHZpc2l0QWxsKHRoaXMsIHRlbXBsYXRlLm91dHB1dHMpO1xuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byB2aXNpdCBhbnkgY2hpbGRyZW4gb2YgdGhlIHRlbXBsYXRlIGFzIHRoZXNlIG5ldmVyIGNhbid0XG4gICAgLy8gYWNjZXNzIGEgcXVlcnkgc3RhdGljYWxseS4gVGhlIHRlbXBsYXRlcyBjYW4gYmUgcmVuZGVyZWQgaW4gdGhlIG5nQWZ0ZXJWaWV3SW5pdFwiXG4gICAgLy8gbGlmZWN5Y2xlIGhvb2sgYXQgdGhlIGVhcmxpZXN0LlxuICB9XG5cbiAgdmlzaXRCb3VuZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IEJvdW5kQXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlLnZpc2l0KHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IsIGF0dHJpYnV0ZS5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0Qm91bmRUZXh0KHRleHQ6IEJvdW5kVGV4dCkgeyB0ZXh0LnZhbHVlLnZpc2l0KHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IsIHRleHQuc291cmNlU3Bhbik7IH1cblxuICB2aXNpdEJvdW5kRXZlbnQobm9kZTogQm91bmRFdmVudCkge1xuICAgIG5vZGUuaGFuZGxlci52aXNpdCh0aGlzLmV4cHJlc3Npb25Bc3RWaXNpdG9yLCBub2RlLmhhbmRsZXJTcGFuKTtcbiAgfVxufVxuXG4vKipcbiAqIEFTVCB2aXNpdG9yIHRoYXQgY2hlY2tzIGlmIHRoZSBnaXZlbiBleHByZXNzaW9uIGNvbnRhaW5zIHByb3BlcnR5IHJlYWRzIHRoYXRcbiAqIHJlZmVyIHRvIHRoZSBzcGVjaWZpZWQgcXVlcnkgcHJvcGVydHkgbmFtZS5cbiAqL1xuY2xhc3MgRXhwcmVzc2lvbkFzdFZpc2l0b3IgZXh0ZW5kcyBSZWN1cnNpdmVBc3RWaXNpdG9yIHtcbiAgaGFzUXVlcnlQcm9wZXJ0eVJlYWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHF1ZXJ5UHJvcGVydHlOYW1lOiBzdHJpbmcpIHsgc3VwZXIoKTsgfVxuXG4gIHZpc2l0UHJvcGVydHlSZWFkKG5vZGU6IFByb3BlcnR5UmVhZCwgc3BhbjogUGFyc2VTb3VyY2VTcGFuKTogYW55IHtcbiAgICAvLyBUaGUgcmVjZWl2ZXIgb2YgdGhlIHByb3BlcnR5IHJlYWQgbmVlZHMgdG8gYmUgXCJpbXBsaWNpdFwiIGFzIHF1ZXJpZXMgYXJlIGFjY2Vzc2VkXG4gICAgLy8gZnJvbSB0aGUgY29tcG9uZW50IGluc3RhbmNlIGFuZCBub3QgZnJvbSBvdGhlciBvYmplY3RzLlxuICAgIGlmIChub2RlLnJlY2VpdmVyIGluc3RhbmNlb2YgSW1wbGljaXRSZWNlaXZlciAmJiBub2RlLm5hbWUgPT09IHRoaXMucXVlcnlQcm9wZXJ0eU5hbWUpIHtcbiAgICAgIHRoaXMuaGFzUXVlcnlQcm9wZXJ0eVJlYWQgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN1cGVyLnZpc2l0UHJvcGVydHlSZWFkKG5vZGUsIHNwYW4pO1xuICB9XG59XG4iXX0=