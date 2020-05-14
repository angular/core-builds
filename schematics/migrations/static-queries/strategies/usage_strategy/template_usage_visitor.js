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
        define("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/template_usage_visitor", ["require", "exports", "@angular/compiler", "@angular/compiler/src/render3/r3_ast"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateUsageVisitor = void 0;
    const compiler_1 = require("@angular/compiler");
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    /**
     * AST visitor that traverses the Render3 HTML AST in order to check if the given
     * query property is accessed statically in the template.
     */
    class TemplateUsageVisitor extends r3_ast_1.NullVisitor {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvdGVtcGxhdGVfdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxnREFBdUc7SUFDdkcsaUVBQTJJO0lBRTNJOzs7T0FHRztJQUNILE1BQWEsb0JBQXFCLFNBQVEsb0JBQVc7UUFJbkQsWUFBbUIsaUJBQXlCO1lBQzFDLEtBQUssRUFBRSxDQUFDO1lBRFMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFRO1lBSHBDLDhCQUF5QixHQUFHLEtBQUssQ0FBQztZQUNsQyx5QkFBb0IsR0FBRyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBSWhGLENBQUM7UUFFRCw2RkFBNkY7UUFDN0YscUJBQXFCLENBQUMsU0FBaUI7WUFDckMsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEtBQUssQ0FBQztZQUN2QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1lBRXZELDBFQUEwRTtZQUMxRSxpQkFBUSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUUxQixPQUFPLENBQUMsSUFBSSxDQUFDLHlCQUF5QixJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQztRQUMzRixDQUFDO1FBRUQsWUFBWSxDQUFDLE9BQWdCO1lBQzNCLGtGQUFrRjtZQUNsRixrRkFBa0Y7WUFDbEYsK0VBQStFO1lBQy9FLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO2dCQUNuRSxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDO2dCQUN0QyxPQUFPO2FBQ1I7WUFFRCxpQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLGlCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoQyxpQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELGFBQWEsQ0FBQyxRQUFrQjtZQUM5QixpQkFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDcEMsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLGlCQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqQywyRUFBMkU7WUFDM0UsbUZBQW1GO1lBQ25GLGtDQUFrQztRQUNwQyxDQUFDO1FBRUQsbUJBQW1CLENBQUMsU0FBeUI7WUFDM0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRUQsY0FBYyxDQUFDLElBQWU7WUFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsZUFBZSxDQUFDLElBQWdCO1lBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEUsQ0FBQztLQUNGO0lBdkRELG9EQXVEQztJQUVEOzs7T0FHRztJQUNILE1BQU0sb0JBQXFCLFNBQVEsOEJBQW1CO1FBR3BELFlBQW9CLGlCQUF5QjtZQUMzQyxLQUFLLEVBQUUsQ0FBQztZQURVLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQUY3Qyx5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFJN0IsQ0FBQztRQUVELGlCQUFpQixDQUFDLElBQWtCLEVBQUUsSUFBcUI7WUFDekQsbUZBQW1GO1lBQ25GLDBEQUEwRDtZQUMxRCxJQUFJLElBQUksQ0FBQyxRQUFRLFlBQVksMkJBQWdCLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ3JGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7Z0JBQ2pDLE9BQU87YUFDUjtZQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsQ0FBQztLQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0ltcGxpY2l0UmVjZWl2ZXIsIFBhcnNlU291cmNlU3BhbiwgUHJvcGVydHlSZWFkLCBSZWN1cnNpdmVBc3RWaXNpdG9yfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0JvdW5kQXR0cmlidXRlLCBCb3VuZEV2ZW50LCBCb3VuZFRleHQsIEVsZW1lbnQsIE5vZGUsIE51bGxWaXNpdG9yLCBUZW1wbGF0ZSwgdmlzaXRBbGx9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3IzX2FzdCc7XG5cbi8qKlxuICogQVNUIHZpc2l0b3IgdGhhdCB0cmF2ZXJzZXMgdGhlIFJlbmRlcjMgSFRNTCBBU1QgaW4gb3JkZXIgdG8gY2hlY2sgaWYgdGhlIGdpdmVuXG4gKiBxdWVyeSBwcm9wZXJ0eSBpcyBhY2Nlc3NlZCBzdGF0aWNhbGx5IGluIHRoZSB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlbXBsYXRlVXNhZ2VWaXNpdG9yIGV4dGVuZHMgTnVsbFZpc2l0b3Ige1xuICBwcml2YXRlIGhhc1F1ZXJ5VGVtcGxhdGVSZWZlcmVuY2UgPSBmYWxzZTtcbiAgcHJpdmF0ZSBleHByZXNzaW9uQXN0VmlzaXRvciA9IG5ldyBFeHByZXNzaW9uQXN0VmlzaXRvcih0aGlzLnF1ZXJ5UHJvcGVydHlOYW1lKTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcXVlcnlQcm9wZXJ0eU5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIHF1ZXJ5IGlzIHN0YXRpY2FsbHkgYWNjZXNzZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgSFRNTCBub2Rlcy4gKi9cbiAgaXNRdWVyeVVzZWRTdGF0aWNhbGx5KGh0bWxOb2RlczogTm9kZVtdKTogYm9vbGVhbiB7XG4gICAgdGhpcy5oYXNRdWVyeVRlbXBsYXRlUmVmZXJlbmNlID0gZmFsc2U7XG4gICAgdGhpcy5leHByZXNzaW9uQXN0VmlzaXRvci5oYXNRdWVyeVByb3BlcnR5UmVhZCA9IGZhbHNlO1xuXG4gICAgLy8gVmlzaXQgYWxsIEFTVCBub2RlcyBhbmQgY2hlY2sgaWYgdGhlIHF1ZXJ5IHByb3BlcnR5IGlzIHVzZWQgc3RhdGljYWxseS5cbiAgICB2aXNpdEFsbCh0aGlzLCBodG1sTm9kZXMpO1xuXG4gICAgcmV0dXJuICF0aGlzLmhhc1F1ZXJ5VGVtcGxhdGVSZWZlcmVuY2UgJiYgdGhpcy5leHByZXNzaW9uQXN0VmlzaXRvci5oYXNRdWVyeVByb3BlcnR5UmVhZDtcbiAgfVxuXG4gIHZpc2l0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogdm9pZCB7XG4gICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBhIHRlbXBsYXRlIHJlZmVyZW5jZXMgdmFyaWFibGUgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeSBwcm9wZXJ0eVxuICAgIC8vIG5hbWUsIHdlIGNhbiBmaW5pc2ggdGhpcyB2aXNpdG9yIGFzIHN1Y2ggYSB0ZW1wbGF0ZSB2YXJpYWJsZSBjYW4gYmUgdXNlZCBpbiB0aGVcbiAgICAvLyBlbnRpcmUgdGVtcGxhdGUgYW5kIHRoZSBxdWVyeSB0aGVyZWZvcmUgY2FuJ3QgYmUgYWNjZXNzZWQgZnJvbSB0aGUgdGVtcGxhdGUuXG4gICAgaWYgKGVsZW1lbnQucmVmZXJlbmNlcy5zb21lKHIgPT4gci5uYW1lID09PSB0aGlzLnF1ZXJ5UHJvcGVydHlOYW1lKSkge1xuICAgICAgdGhpcy5oYXNRdWVyeVRlbXBsYXRlUmVmZXJlbmNlID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2aXNpdEFsbCh0aGlzLCBlbGVtZW50LmF0dHJpYnV0ZXMpO1xuICAgIHZpc2l0QWxsKHRoaXMsIGVsZW1lbnQuaW5wdXRzKTtcbiAgICB2aXNpdEFsbCh0aGlzLCBlbGVtZW50Lm91dHB1dHMpO1xuICAgIHZpc2l0QWxsKHRoaXMsIGVsZW1lbnQuY2hpbGRyZW4pO1xuICB9XG5cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogVGVtcGxhdGUpOiB2b2lkIHtcbiAgICB2aXNpdEFsbCh0aGlzLCB0ZW1wbGF0ZS5hdHRyaWJ1dGVzKTtcbiAgICB2aXNpdEFsbCh0aGlzLCB0ZW1wbGF0ZS5pbnB1dHMpO1xuICAgIHZpc2l0QWxsKHRoaXMsIHRlbXBsYXRlLm91dHB1dHMpO1xuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byB2aXNpdCBhbnkgY2hpbGRyZW4gb2YgdGhlIHRlbXBsYXRlIGFzIHRoZXNlIG5ldmVyIGNhbid0XG4gICAgLy8gYWNjZXNzIGEgcXVlcnkgc3RhdGljYWxseS4gVGhlIHRlbXBsYXRlcyBjYW4gYmUgcmVuZGVyZWQgaW4gdGhlIG5nQWZ0ZXJWaWV3SW5pdFwiXG4gICAgLy8gbGlmZWN5Y2xlIGhvb2sgYXQgdGhlIGVhcmxpZXN0LlxuICB9XG5cbiAgdmlzaXRCb3VuZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IEJvdW5kQXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlLnZpc2l0KHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IsIGF0dHJpYnV0ZS5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0Qm91bmRUZXh0KHRleHQ6IEJvdW5kVGV4dCkge1xuICAgIHRleHQudmFsdWUudmlzaXQodGhpcy5leHByZXNzaW9uQXN0VmlzaXRvciwgdGV4dC5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIHZpc2l0Qm91bmRFdmVudChub2RlOiBCb3VuZEV2ZW50KSB7XG4gICAgbm9kZS5oYW5kbGVyLnZpc2l0KHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IsIG5vZGUuaGFuZGxlclNwYW4pO1xuICB9XG59XG5cbi8qKlxuICogQVNUIHZpc2l0b3IgdGhhdCBjaGVja3MgaWYgdGhlIGdpdmVuIGV4cHJlc3Npb24gY29udGFpbnMgcHJvcGVydHkgcmVhZHMgdGhhdFxuICogcmVmZXIgdG8gdGhlIHNwZWNpZmllZCBxdWVyeSBwcm9wZXJ0eSBuYW1lLlxuICovXG5jbGFzcyBFeHByZXNzaW9uQXN0VmlzaXRvciBleHRlbmRzIFJlY3Vyc2l2ZUFzdFZpc2l0b3Ige1xuICBoYXNRdWVyeVByb3BlcnR5UmVhZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcXVlcnlQcm9wZXJ0eU5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICB2aXNpdFByb3BlcnR5UmVhZChub2RlOiBQcm9wZXJ0eVJlYWQsIHNwYW46IFBhcnNlU291cmNlU3Bhbik6IGFueSB7XG4gICAgLy8gVGhlIHJlY2VpdmVyIG9mIHRoZSBwcm9wZXJ0eSByZWFkIG5lZWRzIHRvIGJlIFwiaW1wbGljaXRcIiBhcyBxdWVyaWVzIGFyZSBhY2Nlc3NlZFxuICAgIC8vIGZyb20gdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgbm90IGZyb20gb3RoZXIgb2JqZWN0cy5cbiAgICBpZiAobm9kZS5yZWNlaXZlciBpbnN0YW5jZW9mIEltcGxpY2l0UmVjZWl2ZXIgJiYgbm9kZS5uYW1lID09PSB0aGlzLnF1ZXJ5UHJvcGVydHlOYW1lKSB7XG4gICAgICB0aGlzLmhhc1F1ZXJ5UHJvcGVydHlSZWFkID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzdXBlci52aXNpdFByb3BlcnR5UmVhZChub2RlLCBzcGFuKTtcbiAgfVxufVxuIl19