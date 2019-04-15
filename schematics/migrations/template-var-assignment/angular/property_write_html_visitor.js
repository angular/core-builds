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
        define("@angular/core/schematics/migrations/template-var-assignment/angular/property_write_html_visitor", ["require", "exports", "@angular/compiler", "@angular/compiler/src/render3/r3_ast"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const compiler_1 = require("@angular/compiler");
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    /**
     * AST visitor that traverses the Render3 HTML AST in order to find all declared
     * template variables and property assignments within bound events.
     */
    class PropertyWriteHtmlVisitor extends r3_ast_1.NullVisitor {
        constructor() {
            super(...arguments);
            this.templateVariables = [];
            this.propertyAssignments = [];
            this.expressionAstVisitor = new ExpressionAstVisitor(this.propertyAssignments);
        }
        visitElement(element) {
            r3_ast_1.visitAll(this, element.outputs);
            r3_ast_1.visitAll(this, element.children);
        }
        visitTemplate(template) {
            // Visit all children of the template. The template proxies the outputs of the
            // immediate child elements, so we just ignore outputs on the "Template" in order
            // to not visit similar bound events twice.
            r3_ast_1.visitAll(this, template.children);
            // Keep track of all declared local template variables.
            this.templateVariables.push(...template.variables);
        }
        visitBoundEvent(node) {
            node.handler.visit(this.expressionAstVisitor, node.handlerSpan);
        }
    }
    exports.PropertyWriteHtmlVisitor = PropertyWriteHtmlVisitor;
    /** AST visitor that resolves all property assignments with a given expression AST. */
    class ExpressionAstVisitor extends compiler_1.RecursiveAstVisitor {
        constructor(propertyAssignments) {
            super();
            this.propertyAssignments = propertyAssignments;
        }
        visitPropertyWrite(node, span) {
            this.propertyAssignments.push({
                node: node,
                start: span.start.offset,
                end: span.end.offset,
            });
            super.visitPropertyWrite(node, span);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfd3JpdGVfaHRtbF92aXNpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdGVtcGxhdGUtdmFyLWFzc2lnbm1lbnQvYW5ndWxhci9wcm9wZXJ0eV93cml0ZV9odG1sX3Zpc2l0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxnREFBc0Y7SUFDdEYsaUVBQW9IO0lBUXBIOzs7T0FHRztJQUNILE1BQWEsd0JBQXlCLFNBQVEsb0JBQVc7UUFBekQ7O1lBQ0Usc0JBQWlCLEdBQWUsRUFBRSxDQUFDO1lBQ25DLHdCQUFtQixHQUF5QixFQUFFLENBQUM7WUFFdkMseUJBQW9CLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQW9CcEYsQ0FBQztRQWxCQyxZQUFZLENBQUMsT0FBZ0I7WUFDM0IsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLGlCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsYUFBYSxDQUFDLFFBQWtCO1lBQzlCLDhFQUE4RTtZQUM5RSxpRkFBaUY7WUFDakYsMkNBQTJDO1lBQzNDLGlCQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVsQyx1REFBdUQ7WUFDdkQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRUQsZUFBZSxDQUFDLElBQWdCO1lBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEUsQ0FBQztLQUNGO0lBeEJELDREQXdCQztJQUVELHNGQUFzRjtJQUN0RixNQUFNLG9CQUFxQixTQUFRLDhCQUFtQjtRQUNwRCxZQUFvQixtQkFBeUM7WUFBSSxLQUFLLEVBQUUsQ0FBQztZQUFyRCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1FBQWEsQ0FBQztRQUUzRSxrQkFBa0IsQ0FBQyxJQUFtQixFQUFFLElBQXFCO1lBQzNELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7Z0JBQzVCLElBQUksRUFBRSxJQUFJO2dCQUNWLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07Z0JBQ3hCLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU07YUFDckIsQ0FBQyxDQUFDO1lBRUgsS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2QyxDQUFDO0tBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UGFyc2VTb3VyY2VTcGFuLCBQcm9wZXJ0eVdyaXRlLCBSZWN1cnNpdmVBc3RWaXNpdG9yfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0JvdW5kRXZlbnQsIEVsZW1lbnQsIE51bGxWaXNpdG9yLCBUZW1wbGF0ZSwgVmFyaWFibGUsIHZpc2l0QWxsfSBmcm9tICdAYW5ndWxhci9jb21waWxlci9zcmMvcmVuZGVyMy9yM19hc3QnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb3BlcnR5QXNzaWdubWVudCB7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGVuZDogbnVtYmVyO1xuICBub2RlOiBQcm9wZXJ0eVdyaXRlO1xufVxuXG4vKipcbiAqIEFTVCB2aXNpdG9yIHRoYXQgdHJhdmVyc2VzIHRoZSBSZW5kZXIzIEhUTUwgQVNUIGluIG9yZGVyIHRvIGZpbmQgYWxsIGRlY2xhcmVkXG4gKiB0ZW1wbGF0ZSB2YXJpYWJsZXMgYW5kIHByb3BlcnR5IGFzc2lnbm1lbnRzIHdpdGhpbiBib3VuZCBldmVudHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eVdyaXRlSHRtbFZpc2l0b3IgZXh0ZW5kcyBOdWxsVmlzaXRvciB7XG4gIHRlbXBsYXRlVmFyaWFibGVzOiBWYXJpYWJsZVtdID0gW107XG4gIHByb3BlcnR5QXNzaWdubWVudHM6IFByb3BlcnR5QXNzaWdubWVudFtdID0gW107XG5cbiAgcHJpdmF0ZSBleHByZXNzaW9uQXN0VmlzaXRvciA9IG5ldyBFeHByZXNzaW9uQXN0VmlzaXRvcih0aGlzLnByb3BlcnR5QXNzaWdubWVudHMpO1xuXG4gIHZpc2l0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogdm9pZCB7XG4gICAgdmlzaXRBbGwodGhpcywgZWxlbWVudC5vdXRwdXRzKTtcbiAgICB2aXNpdEFsbCh0aGlzLCBlbGVtZW50LmNoaWxkcmVuKTtcbiAgfVxuXG4gIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFRlbXBsYXRlKTogdm9pZCB7XG4gICAgLy8gVmlzaXQgYWxsIGNoaWxkcmVuIG9mIHRoZSB0ZW1wbGF0ZS4gVGhlIHRlbXBsYXRlIHByb3hpZXMgdGhlIG91dHB1dHMgb2YgdGhlXG4gICAgLy8gaW1tZWRpYXRlIGNoaWxkIGVsZW1lbnRzLCBzbyB3ZSBqdXN0IGlnbm9yZSBvdXRwdXRzIG9uIHRoZSBcIlRlbXBsYXRlXCIgaW4gb3JkZXJcbiAgICAvLyB0byBub3QgdmlzaXQgc2ltaWxhciBib3VuZCBldmVudHMgdHdpY2UuXG4gICAgdmlzaXRBbGwodGhpcywgdGVtcGxhdGUuY2hpbGRyZW4pO1xuXG4gICAgLy8gS2VlcCB0cmFjayBvZiBhbGwgZGVjbGFyZWQgbG9jYWwgdGVtcGxhdGUgdmFyaWFibGVzLlxuICAgIHRoaXMudGVtcGxhdGVWYXJpYWJsZXMucHVzaCguLi50ZW1wbGF0ZS52YXJpYWJsZXMpO1xuICB9XG5cbiAgdmlzaXRCb3VuZEV2ZW50KG5vZGU6IEJvdW5kRXZlbnQpIHtcbiAgICBub2RlLmhhbmRsZXIudmlzaXQodGhpcy5leHByZXNzaW9uQXN0VmlzaXRvciwgbm9kZS5oYW5kbGVyU3Bhbik7XG4gIH1cbn1cblxuLyoqIEFTVCB2aXNpdG9yIHRoYXQgcmVzb2x2ZXMgYWxsIHByb3BlcnR5IGFzc2lnbm1lbnRzIHdpdGggYSBnaXZlbiBleHByZXNzaW9uIEFTVC4gKi9cbmNsYXNzIEV4cHJlc3Npb25Bc3RWaXNpdG9yIGV4dGVuZHMgUmVjdXJzaXZlQXN0VmlzaXRvciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcGVydHlBc3NpZ25tZW50czogUHJvcGVydHlBc3NpZ25tZW50W10pIHsgc3VwZXIoKTsgfVxuXG4gIHZpc2l0UHJvcGVydHlXcml0ZShub2RlOiBQcm9wZXJ0eVdyaXRlLCBzcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHtcbiAgICB0aGlzLnByb3BlcnR5QXNzaWdubWVudHMucHVzaCh7XG4gICAgICBub2RlOiBub2RlLFxuICAgICAgc3RhcnQ6IHNwYW4uc3RhcnQub2Zmc2V0LFxuICAgICAgZW5kOiBzcGFuLmVuZC5vZmZzZXQsXG4gICAgfSk7XG5cbiAgICBzdXBlci52aXNpdFByb3BlcnR5V3JpdGUobm9kZSwgc3Bhbik7XG4gIH1cbn1cbiJdfQ==