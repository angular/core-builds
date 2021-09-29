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
        define("@angular/core/schematics/migrations/template-var-assignment/angular/html_variable_assignment_visitor", ["require", "exports", "@angular/compiler", "@angular/core/schematics/utils/template_ast_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HtmlVariableAssignmentVisitor = void 0;
    const compiler_1 = require("@angular/compiler");
    const template_ast_visitor_1 = require("@angular/core/schematics/utils/template_ast_visitor");
    /**
     * HTML AST visitor that traverses the Render3 HTML AST in order to find all
     * expressions that write to local template variables within bound events.
     */
    class HtmlVariableAssignmentVisitor extends template_ast_visitor_1.TemplateAstVisitor {
        constructor() {
            super(...arguments);
            this.variableAssignments = [];
            this.currentVariables = [];
            this.expressionAstVisitor = new ExpressionAstVisitor(this.variableAssignments, this.currentVariables);
        }
        visitElement(element) {
            this.visitAll(element.outputs);
            this.visitAll(element.children);
        }
        visitTemplate(template) {
            // Keep track of the template variables which can be accessed by the template
            // child nodes through the implicit receiver.
            this.currentVariables.push(...template.variables);
            // Visit all children of the template. The template proxies the outputs of the
            // immediate child elements, so we just ignore outputs on the "Template" in order
            // to not visit similar bound events twice.
            this.visitAll(template.children);
            // Remove all previously added variables since all children that could access
            // these have been visited already.
            template.variables.forEach(v => {
                const variableIdx = this.currentVariables.indexOf(v);
                if (variableIdx !== -1) {
                    this.currentVariables.splice(variableIdx, 1);
                }
            });
        }
        visitBoundEvent(node) {
            node.handler.visit(this.expressionAstVisitor, node.handlerSpan);
        }
    }
    exports.HtmlVariableAssignmentVisitor = HtmlVariableAssignmentVisitor;
    /** AST visitor that resolves all variable assignments within a given expression AST. */
    class ExpressionAstVisitor extends compiler_1.RecursiveAstVisitor {
        constructor(variableAssignments, currentVariables) {
            super();
            this.variableAssignments = variableAssignments;
            this.currentVariables = currentVariables;
        }
        visitPropertyWrite(node, span) {
            if (node.receiver instanceof compiler_1.ImplicitReceiver &&
                this.currentVariables.some(v => v.name === node.name)) {
                this.variableAssignments.push({
                    node: node,
                    start: span.start.offset,
                    end: span.end.offset,
                });
            }
            super.visitPropertyWrite(node, span);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF92YXJpYWJsZV9hc3NpZ25tZW50X3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9hbmd1bGFyL2h0bWxfdmFyaWFibGVfYXNzaWdubWVudF92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUE2SztJQUM3Syw4RkFBdUU7SUFTdkU7OztPQUdHO0lBQ0gsTUFBYSw2QkFBOEIsU0FBUSx5Q0FBa0I7UUFBckU7O1lBQ0Usd0JBQW1CLEdBQWlDLEVBQUUsQ0FBQztZQUUvQyxxQkFBZ0IsR0FBc0IsRUFBRSxDQUFDO1lBQ3pDLHlCQUFvQixHQUN4QixJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQStCaEYsQ0FBQztRQTdCVSxZQUFZLENBQUMsT0FBdUI7WUFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVRLGFBQWEsQ0FBQyxRQUF5QjtZQUM5Qyw2RUFBNkU7WUFDN0UsNkNBQTZDO1lBQzdDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFbEQsOEVBQThFO1lBQzlFLGlGQUFpRjtZQUNqRiwyQ0FBMkM7WUFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFakMsNkVBQTZFO1lBQzdFLG1DQUFtQztZQUNuQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDN0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFckQsSUFBSSxXQUFXLEtBQUssQ0FBQyxDQUFDLEVBQUU7b0JBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUM5QztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVRLGVBQWUsQ0FBQyxJQUF1QjtZQUM5QyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7S0FDRjtJQXBDRCxzRUFvQ0M7SUFFRCx3RkFBd0Y7SUFDeEYsTUFBTSxvQkFBcUIsU0FBUSw4QkFBbUI7UUFDcEQsWUFDWSxtQkFBaUQsRUFDakQsZ0JBQW1DO1lBQzdDLEtBQUssRUFBRSxDQUFDO1lBRkUsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUE4QjtZQUNqRCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1FBRS9DLENBQUM7UUFFUSxrQkFBa0IsQ0FBQyxJQUFtQixFQUFFLElBQXFCO1lBQ3BFLElBQUksSUFBSSxDQUFDLFFBQVEsWUFBWSwyQkFBZ0I7Z0JBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQztvQkFDNUIsSUFBSSxFQUFFLElBQUk7b0JBQ1YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtvQkFDeEIsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTTtpQkFDckIsQ0FBQyxDQUFDO2FBQ0o7WUFDRCxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7S0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0ltcGxpY2l0UmVjZWl2ZXIsIFBhcnNlU291cmNlU3BhbiwgUHJvcGVydHlXcml0ZSwgUmVjdXJzaXZlQXN0VmlzaXRvciwgVG1wbEFzdEJvdW5kRXZlbnQsIFRtcGxBc3RFbGVtZW50LCBUbXBsQXN0VGVtcGxhdGUsIFRtcGxBc3RWYXJpYWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtUZW1wbGF0ZUFzdFZpc2l0b3J9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3RlbXBsYXRlX2FzdF92aXNpdG9yJztcblxuXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50IHtcbiAgc3RhcnQ6IG51bWJlcjtcbiAgZW5kOiBudW1iZXI7XG4gIG5vZGU6IFByb3BlcnR5V3JpdGU7XG59XG5cbi8qKlxuICogSFRNTCBBU1QgdmlzaXRvciB0aGF0IHRyYXZlcnNlcyB0aGUgUmVuZGVyMyBIVE1MIEFTVCBpbiBvcmRlciB0byBmaW5kIGFsbFxuICogZXhwcmVzc2lvbnMgdGhhdCB3cml0ZSB0byBsb2NhbCB0ZW1wbGF0ZSB2YXJpYWJsZXMgd2l0aGluIGJvdW5kIGV2ZW50cy5cbiAqL1xuZXhwb3J0IGNsYXNzIEh0bWxWYXJpYWJsZUFzc2lnbm1lbnRWaXNpdG9yIGV4dGVuZHMgVGVtcGxhdGVBc3RWaXNpdG9yIHtcbiAgdmFyaWFibGVBc3NpZ25tZW50czogVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRbXSA9IFtdO1xuXG4gIHByaXZhdGUgY3VycmVudFZhcmlhYmxlczogVG1wbEFzdFZhcmlhYmxlW10gPSBbXTtcbiAgcHJpdmF0ZSBleHByZXNzaW9uQXN0VmlzaXRvciA9XG4gICAgICBuZXcgRXhwcmVzc2lvbkFzdFZpc2l0b3IodGhpcy52YXJpYWJsZUFzc2lnbm1lbnRzLCB0aGlzLmN1cnJlbnRWYXJpYWJsZXMpO1xuXG4gIG92ZXJyaWRlIHZpc2l0RWxlbWVudChlbGVtZW50OiBUbXBsQXN0RWxlbWVudCk6IHZvaWQge1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5vdXRwdXRzKTtcbiAgICB0aGlzLnZpc2l0QWxsKGVsZW1lbnQuY2hpbGRyZW4pO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogVG1wbEFzdFRlbXBsYXRlKTogdm9pZCB7XG4gICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgdGVtcGxhdGUgdmFyaWFibGVzIHdoaWNoIGNhbiBiZSBhY2Nlc3NlZCBieSB0aGUgdGVtcGxhdGVcbiAgICAvLyBjaGlsZCBub2RlcyB0aHJvdWdoIHRoZSBpbXBsaWNpdCByZWNlaXZlci5cbiAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXMucHVzaCguLi50ZW1wbGF0ZS52YXJpYWJsZXMpO1xuXG4gICAgLy8gVmlzaXQgYWxsIGNoaWxkcmVuIG9mIHRoZSB0ZW1wbGF0ZS4gVGhlIHRlbXBsYXRlIHByb3hpZXMgdGhlIG91dHB1dHMgb2YgdGhlXG4gICAgLy8gaW1tZWRpYXRlIGNoaWxkIGVsZW1lbnRzLCBzbyB3ZSBqdXN0IGlnbm9yZSBvdXRwdXRzIG9uIHRoZSBcIlRlbXBsYXRlXCIgaW4gb3JkZXJcbiAgICAvLyB0byBub3QgdmlzaXQgc2ltaWxhciBib3VuZCBldmVudHMgdHdpY2UuXG4gICAgdGhpcy52aXNpdEFsbCh0ZW1wbGF0ZS5jaGlsZHJlbik7XG5cbiAgICAvLyBSZW1vdmUgYWxsIHByZXZpb3VzbHkgYWRkZWQgdmFyaWFibGVzIHNpbmNlIGFsbCBjaGlsZHJlbiB0aGF0IGNvdWxkIGFjY2Vzc1xuICAgIC8vIHRoZXNlIGhhdmUgYmVlbiB2aXNpdGVkIGFscmVhZHkuXG4gICAgdGVtcGxhdGUudmFyaWFibGVzLmZvckVhY2godiA9PiB7XG4gICAgICBjb25zdCB2YXJpYWJsZUlkeCA9IHRoaXMuY3VycmVudFZhcmlhYmxlcy5pbmRleE9mKHYpO1xuXG4gICAgICBpZiAodmFyaWFibGVJZHggIT09IC0xKSB7XG4gICAgICAgIHRoaXMuY3VycmVudFZhcmlhYmxlcy5zcGxpY2UodmFyaWFibGVJZHgsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRCb3VuZEV2ZW50KG5vZGU6IFRtcGxBc3RCb3VuZEV2ZW50KSB7XG4gICAgbm9kZS5oYW5kbGVyLnZpc2l0KHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IsIG5vZGUuaGFuZGxlclNwYW4pO1xuICB9XG59XG5cbi8qKiBBU1QgdmlzaXRvciB0aGF0IHJlc29sdmVzIGFsbCB2YXJpYWJsZSBhc3NpZ25tZW50cyB3aXRoaW4gYSBnaXZlbiBleHByZXNzaW9uIEFTVC4gKi9cbmNsYXNzIEV4cHJlc3Npb25Bc3RWaXNpdG9yIGV4dGVuZHMgUmVjdXJzaXZlQXN0VmlzaXRvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB2YXJpYWJsZUFzc2lnbm1lbnRzOiBUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudFtdLFxuICAgICAgcHJpdmF0ZSBjdXJyZW50VmFyaWFibGVzOiBUbXBsQXN0VmFyaWFibGVbXSkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdFByb3BlcnR5V3JpdGUobm9kZTogUHJvcGVydHlXcml0ZSwgc3BhbjogUGFyc2VTb3VyY2VTcGFuKSB7XG4gICAgaWYgKG5vZGUucmVjZWl2ZXIgaW5zdGFuY2VvZiBJbXBsaWNpdFJlY2VpdmVyICYmXG4gICAgICAgIHRoaXMuY3VycmVudFZhcmlhYmxlcy5zb21lKHYgPT4gdi5uYW1lID09PSBub2RlLm5hbWUpKSB7XG4gICAgICB0aGlzLnZhcmlhYmxlQXNzaWdubWVudHMucHVzaCh7XG4gICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgIHN0YXJ0OiBzcGFuLnN0YXJ0Lm9mZnNldCxcbiAgICAgICAgZW5kOiBzcGFuLmVuZC5vZmZzZXQsXG4gICAgICB9KTtcbiAgICB9XG4gICAgc3VwZXIudmlzaXRQcm9wZXJ0eVdyaXRlKG5vZGUsIHNwYW4pO1xuICB9XG59XG4iXX0=