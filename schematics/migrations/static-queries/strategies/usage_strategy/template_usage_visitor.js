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
        define("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/template_usage_visitor", ["require", "exports", "@angular/core/schematics/utils/template_ast_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateUsageVisitor = void 0;
    const template_ast_visitor_1 = require("@angular/core/schematics/utils/template_ast_visitor");
    /**
     * AST visitor that traverses the Render3 HTML AST in order to check if the given
     * query property is accessed statically in the template.
     */
    class TemplateUsageVisitor extends template_ast_visitor_1.TemplateAstVisitor {
        constructor(queryPropertyName, compilerModule) {
            super(compilerModule);
            this.queryPropertyName = queryPropertyName;
            this.hasQueryTemplateReference = false;
            // AST visitor that checks if the given expression contains property reads that
            // refer to the specified query property name.
            // This class must be defined within the template visitor due to the need to extend from a class
            // value found within `@angular/compiler` which is dynamically imported and provided to the
            // visitor.
            this.expressionAstVisitor = new (class extends compilerModule.RecursiveAstVisitor {
                constructor() {
                    super(...arguments);
                    this.hasQueryPropertyRead = false;
                }
                visitPropertyRead(node, span) {
                    // The receiver of the property read needs to be "implicit" as queries are accessed
                    // from the component instance and not from other objects.
                    if (node.receiver instanceof compilerModule.ImplicitReceiver &&
                        node.name === queryPropertyName) {
                        this.hasQueryPropertyRead = true;
                        return;
                    }
                    super.visitPropertyRead(node, span);
                }
            })();
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfdXNhZ2VfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3N0cmF0ZWdpZXMvdXNhZ2Vfc3RyYXRlZ3kvdGVtcGxhdGVfdXNhZ2VfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFHSCw4RkFBMEU7SUFFMUU7OztPQUdHO0lBQ0gsTUFBYSxvQkFBcUIsU0FBUSx5Q0FBa0I7UUFJMUQsWUFDVyxpQkFBeUIsRUFBRSxjQUFrRDtZQUN0RixLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7WUFEYixzQkFBaUIsR0FBakIsaUJBQWlCLENBQVE7WUFKNUIsOEJBQXlCLEdBQUcsS0FBSyxDQUFDO1lBT3hDLCtFQUErRTtZQUMvRSw4Q0FBOEM7WUFDOUMsZ0dBQWdHO1lBQ2hHLDJGQUEyRjtZQUMzRixXQUFXO1lBQ1gsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxLQUFNLFNBQVEsY0FBYyxDQUFDLG1CQUFtQjtnQkFBaEQ7O29CQUMvQix5QkFBb0IsR0FBRyxLQUFLLENBQUM7Z0JBYy9CLENBQUM7Z0JBWFUsaUJBQWlCLENBQUMsSUFBa0IsRUFBRSxJQUFxQjtvQkFDbEUsbUZBQW1GO29CQUNuRiwwREFBMEQ7b0JBQzFELElBQUksSUFBSSxDQUFDLFFBQVEsWUFBWSxjQUFjLENBQUMsZ0JBQWdCO3dCQUN4RCxJQUFJLENBQUMsSUFBSSxLQUFLLGlCQUFpQixFQUFFO3dCQUNuQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO3dCQUNqQyxPQUFPO3FCQUNSO29CQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7YUFDRixDQUFDLEVBQUUsQ0FBQztRQUNQLENBQUM7UUFFRCw2RkFBNkY7UUFDN0YscUJBQXFCLENBQUMsU0FBd0I7WUFDNUMsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEtBQUssQ0FBQztZQUN2QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1lBRXZELDBFQUEwRTtZQUMxRSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXpCLE9BQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDO1FBQzNGLENBQUM7UUFFUSxZQUFZLENBQUMsT0FBdUI7WUFDM0Msa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRiwrRUFBK0U7WUFDL0UsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7Z0JBQ25FLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUM7Z0JBQ3RDLE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFUSxhQUFhLENBQUMsUUFBeUI7WUFDOUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFaEMsMkVBQTJFO1lBQzNFLG1GQUFtRjtZQUNuRixrQ0FBa0M7UUFDcEMsQ0FBQztRQUVRLG1CQUFtQixDQUFDLFNBQWdDO1lBQzNELFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVRLGNBQWMsQ0FBQyxJQUFzQjtZQUM1QyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFUSxlQUFlLENBQUMsSUFBdUI7WUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsRSxDQUFDO0tBQ0Y7SUE5RUQsb0RBOEVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtQYXJzZVNvdXJjZVNwYW4sIFByb3BlcnR5UmVhZCwgVG1wbEFzdEJvdW5kQXR0cmlidXRlLCBUbXBsQXN0Qm91bmRFdmVudCwgVG1wbEFzdEJvdW5kVGV4dCwgVG1wbEFzdEVsZW1lbnQsIFRtcGxBc3ROb2RlLCBUbXBsQXN0VGVtcGxhdGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7VGVtcGxhdGVBc3RWaXNpdG9yfSBmcm9tICcuLi8uLi8uLi8uLi91dGlscy90ZW1wbGF0ZV9hc3RfdmlzaXRvcic7XG5cbi8qKlxuICogQVNUIHZpc2l0b3IgdGhhdCB0cmF2ZXJzZXMgdGhlIFJlbmRlcjMgSFRNTCBBU1QgaW4gb3JkZXIgdG8gY2hlY2sgaWYgdGhlIGdpdmVuXG4gKiBxdWVyeSBwcm9wZXJ0eSBpcyBhY2Nlc3NlZCBzdGF0aWNhbGx5IGluIHRoZSB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlbXBsYXRlVXNhZ2VWaXNpdG9yIGV4dGVuZHMgVGVtcGxhdGVBc3RWaXNpdG9yIHtcbiAgcHJpdmF0ZSBoYXNRdWVyeVRlbXBsYXRlUmVmZXJlbmNlID0gZmFsc2U7XG4gIHByaXZhdGUgZXhwcmVzc2lvbkFzdFZpc2l0b3I7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcXVlcnlQcm9wZXJ0eU5hbWU6IHN0cmluZywgY29tcGlsZXJNb2R1bGU6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJykpIHtcbiAgICBzdXBlcihjb21waWxlck1vZHVsZSk7XG5cbiAgICAvLyBBU1QgdmlzaXRvciB0aGF0IGNoZWNrcyBpZiB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiBjb250YWlucyBwcm9wZXJ0eSByZWFkcyB0aGF0XG4gICAgLy8gcmVmZXIgdG8gdGhlIHNwZWNpZmllZCBxdWVyeSBwcm9wZXJ0eSBuYW1lLlxuICAgIC8vIFRoaXMgY2xhc3MgbXVzdCBiZSBkZWZpbmVkIHdpdGhpbiB0aGUgdGVtcGxhdGUgdmlzaXRvciBkdWUgdG8gdGhlIG5lZWQgdG8gZXh0ZW5kIGZyb20gYSBjbGFzc1xuICAgIC8vIHZhbHVlIGZvdW5kIHdpdGhpbiBgQGFuZ3VsYXIvY29tcGlsZXJgIHdoaWNoIGlzIGR5bmFtaWNhbGx5IGltcG9ydGVkIGFuZCBwcm92aWRlZCB0byB0aGVcbiAgICAvLyB2aXNpdG9yLlxuICAgIHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IgPSBuZXcgKGNsYXNzIGV4dGVuZHMgY29tcGlsZXJNb2R1bGUuUmVjdXJzaXZlQXN0VmlzaXRvciB7XG4gICAgICBoYXNRdWVyeVByb3BlcnR5UmVhZCA9IGZhbHNlO1xuXG5cbiAgICAgIG92ZXJyaWRlIHZpc2l0UHJvcGVydHlSZWFkKG5vZGU6IFByb3BlcnR5UmVhZCwgc3BhbjogUGFyc2VTb3VyY2VTcGFuKTogYW55IHtcbiAgICAgICAgLy8gVGhlIHJlY2VpdmVyIG9mIHRoZSBwcm9wZXJ0eSByZWFkIG5lZWRzIHRvIGJlIFwiaW1wbGljaXRcIiBhcyBxdWVyaWVzIGFyZSBhY2Nlc3NlZFxuICAgICAgICAvLyBmcm9tIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIG5vdCBmcm9tIG90aGVyIG9iamVjdHMuXG4gICAgICAgIGlmIChub2RlLnJlY2VpdmVyIGluc3RhbmNlb2YgY29tcGlsZXJNb2R1bGUuSW1wbGljaXRSZWNlaXZlciAmJlxuICAgICAgICAgICAgbm9kZS5uYW1lID09PSBxdWVyeVByb3BlcnR5TmFtZSkge1xuICAgICAgICAgIHRoaXMuaGFzUXVlcnlQcm9wZXJ0eVJlYWQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyLnZpc2l0UHJvcGVydHlSZWFkKG5vZGUsIHNwYW4pO1xuICAgICAgfVxuICAgIH0pKCk7XG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIHF1ZXJ5IGlzIHN0YXRpY2FsbHkgYWNjZXNzZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgSFRNTCBub2Rlcy4gKi9cbiAgaXNRdWVyeVVzZWRTdGF0aWNhbGx5KGh0bWxOb2RlczogVG1wbEFzdE5vZGVbXSk6IGJvb2xlYW4ge1xuICAgIHRoaXMuaGFzUXVlcnlUZW1wbGF0ZVJlZmVyZW5jZSA9IGZhbHNlO1xuICAgIHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IuaGFzUXVlcnlQcm9wZXJ0eVJlYWQgPSBmYWxzZTtcblxuICAgIC8vIFZpc2l0IGFsbCBBU1Qgbm9kZXMgYW5kIGNoZWNrIGlmIHRoZSBxdWVyeSBwcm9wZXJ0eSBpcyB1c2VkIHN0YXRpY2FsbHkuXG4gICAgdGhpcy52aXNpdEFsbChodG1sTm9kZXMpO1xuXG4gICAgcmV0dXJuICF0aGlzLmhhc1F1ZXJ5VGVtcGxhdGVSZWZlcmVuY2UgJiYgdGhpcy5leHByZXNzaW9uQXN0VmlzaXRvci5oYXNRdWVyeVByb3BlcnR5UmVhZDtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0RWxlbWVudChlbGVtZW50OiBUbXBsQXN0RWxlbWVudCk6IHZvaWQge1xuICAgIC8vIEluIGNhc2UgdGhlcmUgaXMgYSB0ZW1wbGF0ZSByZWZlcmVuY2VzIHZhcmlhYmxlIHRoYXQgbWF0Y2hlcyB0aGUgcXVlcnkgcHJvcGVydHlcbiAgICAvLyBuYW1lLCB3ZSBjYW4gZmluaXNoIHRoaXMgdmlzaXRvciBhcyBzdWNoIGEgdGVtcGxhdGUgdmFyaWFibGUgY2FuIGJlIHVzZWQgaW4gdGhlXG4gICAgLy8gZW50aXJlIHRlbXBsYXRlIGFuZCB0aGUgcXVlcnkgdGhlcmVmb3JlIGNhbid0IGJlIGFjY2Vzc2VkIGZyb20gdGhlIHRlbXBsYXRlLlxuICAgIGlmIChlbGVtZW50LnJlZmVyZW5jZXMuc29tZShyID0+IHIubmFtZSA9PT0gdGhpcy5xdWVyeVByb3BlcnR5TmFtZSkpIHtcbiAgICAgIHRoaXMuaGFzUXVlcnlUZW1wbGF0ZVJlZmVyZW5jZSA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy52aXNpdEFsbChlbGVtZW50LmF0dHJpYnV0ZXMpO1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5pbnB1dHMpO1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5vdXRwdXRzKTtcbiAgICB0aGlzLnZpc2l0QWxsKGVsZW1lbnQuY2hpbGRyZW4pO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogVG1wbEFzdFRlbXBsYXRlKTogdm9pZCB7XG4gICAgdGhpcy52aXNpdEFsbCh0ZW1wbGF0ZS5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnZpc2l0QWxsKHRlbXBsYXRlLmlucHV0cyk7XG4gICAgdGhpcy52aXNpdEFsbCh0ZW1wbGF0ZS5vdXRwdXRzKTtcblxuICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gdmlzaXQgYW55IGNoaWxkcmVuIG9mIHRoZSB0ZW1wbGF0ZSBhcyB0aGVzZSBuZXZlciBjYW4ndFxuICAgIC8vIGFjY2VzcyBhIHF1ZXJ5IHN0YXRpY2FsbHkuIFRoZSB0ZW1wbGF0ZXMgY2FuIGJlIHJlbmRlcmVkIGluIHRoZSBuZ0FmdGVyVmlld0luaXRcIlxuICAgIC8vIGxpZmVjeWNsZSBob29rIGF0IHRoZSBlYXJsaWVzdC5cbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0Qm91bmRBdHRyaWJ1dGUoYXR0cmlidXRlOiBUbXBsQXN0Qm91bmRBdHRyaWJ1dGUpIHtcbiAgICBhdHRyaWJ1dGUudmFsdWUudmlzaXQodGhpcy5leHByZXNzaW9uQXN0VmlzaXRvciwgYXR0cmlidXRlLnNvdXJjZVNwYW4pO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRCb3VuZFRleHQodGV4dDogVG1wbEFzdEJvdW5kVGV4dCkge1xuICAgIHRleHQudmFsdWUudmlzaXQodGhpcy5leHByZXNzaW9uQXN0VmlzaXRvciwgdGV4dC5zb3VyY2VTcGFuKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0Qm91bmRFdmVudChub2RlOiBUbXBsQXN0Qm91bmRFdmVudCkge1xuICAgIG5vZGUuaGFuZGxlci52aXNpdCh0aGlzLmV4cHJlc3Npb25Bc3RWaXNpdG9yLCBub2RlLmhhbmRsZXJTcGFuKTtcbiAgfVxufVxuIl19