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
        define("@angular/core/schematics/migrations/template-var-assignment/angular/html_variable_assignment_visitor", ["require", "exports", "@angular/compiler", "@angular/compiler/src/render3/r3_ast"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HtmlVariableAssignmentVisitor = void 0;
    const compiler_1 = require("@angular/compiler");
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    /**
     * HTML AST visitor that traverses the Render3 HTML AST in order to find all
     * expressions that write to local template variables within bound events.
     */
    class HtmlVariableAssignmentVisitor extends r3_ast_1.NullVisitor {
        constructor() {
            super(...arguments);
            this.variableAssignments = [];
            this.currentVariables = [];
            this.expressionAstVisitor = new ExpressionAstVisitor(this.variableAssignments, this.currentVariables);
        }
        visitElement(element) {
            r3_ast_1.visitAll(this, element.outputs);
            r3_ast_1.visitAll(this, element.children);
        }
        visitTemplate(template) {
            // Keep track of the template variables which can be accessed by the template
            // child nodes through the implicit receiver.
            this.currentVariables.push(...template.variables);
            // Visit all children of the template. The template proxies the outputs of the
            // immediate child elements, so we just ignore outputs on the "Template" in order
            // to not visit similar bound events twice.
            r3_ast_1.visitAll(this, template.children);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF92YXJpYWJsZV9hc3NpZ25tZW50X3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9hbmd1bGFyL2h0bWxfdmFyaWFibGVfYXNzaWdubWVudF92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUF3RztJQUN4RyxpRUFBb0g7SUFRcEg7OztPQUdHO0lBQ0gsTUFBYSw2QkFBOEIsU0FBUSxvQkFBVztRQUE5RDs7WUFDRSx3QkFBbUIsR0FBaUMsRUFBRSxDQUFDO1lBRS9DLHFCQUFnQixHQUFlLEVBQUUsQ0FBQztZQUNsQyx5QkFBb0IsR0FDeEIsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUErQmhGLENBQUM7UUE3QkMsWUFBWSxDQUFDLE9BQWdCO1lBQzNCLGlCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoQyxpQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELGFBQWEsQ0FBQyxRQUFrQjtZQUM5Qiw2RUFBNkU7WUFDN0UsNkNBQTZDO1lBQzdDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFbEQsOEVBQThFO1lBQzlFLGlGQUFpRjtZQUNqRiwyQ0FBMkM7WUFDM0MsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRWxDLDZFQUE2RTtZQUM3RSxtQ0FBbUM7WUFDbkMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXJELElBQUksV0FBVyxLQUFLLENBQUMsQ0FBQyxFQUFFO29CQUN0QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztpQkFDOUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxlQUFlLENBQUMsSUFBZ0I7WUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsRSxDQUFDO0tBQ0Y7SUFwQ0Qsc0VBb0NDO0lBRUQsd0ZBQXdGO0lBQ3hGLE1BQU0sb0JBQXFCLFNBQVEsOEJBQW1CO1FBQ3BELFlBQ1ksbUJBQWlELEVBQ2pELGdCQUE0QjtZQUN0QyxLQUFLLEVBQUUsQ0FBQztZQUZFLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFDakQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFZO1FBRXhDLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxJQUFtQixFQUFFLElBQXFCO1lBQzNELElBQUksSUFBSSxDQUFDLFFBQVEsWUFBWSwyQkFBZ0I7Z0JBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQztvQkFDNUIsSUFBSSxFQUFFLElBQUk7b0JBQ1YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtvQkFDeEIsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTTtpQkFDckIsQ0FBQyxDQUFDO2FBQ0o7WUFDRCxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7S0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbXBsaWNpdFJlY2VpdmVyLCBQYXJzZVNvdXJjZVNwYW4sIFByb3BlcnR5V3JpdGUsIFJlY3Vyc2l2ZUFzdFZpc2l0b3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Qm91bmRFdmVudCwgRWxlbWVudCwgTnVsbFZpc2l0b3IsIFRlbXBsYXRlLCBWYXJpYWJsZSwgdmlzaXRBbGx9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3IzX2FzdCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnQge1xuICBzdGFydDogbnVtYmVyO1xuICBlbmQ6IG51bWJlcjtcbiAgbm9kZTogUHJvcGVydHlXcml0ZTtcbn1cblxuLyoqXG4gKiBIVE1MIEFTVCB2aXNpdG9yIHRoYXQgdHJhdmVyc2VzIHRoZSBSZW5kZXIzIEhUTUwgQVNUIGluIG9yZGVyIHRvIGZpbmQgYWxsXG4gKiBleHByZXNzaW9ucyB0aGF0IHdyaXRlIHRvIGxvY2FsIHRlbXBsYXRlIHZhcmlhYmxlcyB3aXRoaW4gYm91bmQgZXZlbnRzLlxuICovXG5leHBvcnQgY2xhc3MgSHRtbFZhcmlhYmxlQXNzaWdubWVudFZpc2l0b3IgZXh0ZW5kcyBOdWxsVmlzaXRvciB7XG4gIHZhcmlhYmxlQXNzaWdubWVudHM6IFRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50W10gPSBbXTtcblxuICBwcml2YXRlIGN1cnJlbnRWYXJpYWJsZXM6IFZhcmlhYmxlW10gPSBbXTtcbiAgcHJpdmF0ZSBleHByZXNzaW9uQXN0VmlzaXRvciA9XG4gICAgICBuZXcgRXhwcmVzc2lvbkFzdFZpc2l0b3IodGhpcy52YXJpYWJsZUFzc2lnbm1lbnRzLCB0aGlzLmN1cnJlbnRWYXJpYWJsZXMpO1xuXG4gIHZpc2l0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogdm9pZCB7XG4gICAgdmlzaXRBbGwodGhpcywgZWxlbWVudC5vdXRwdXRzKTtcbiAgICB2aXNpdEFsbCh0aGlzLCBlbGVtZW50LmNoaWxkcmVuKTtcbiAgfVxuXG4gIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFRlbXBsYXRlKTogdm9pZCB7XG4gICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgdGVtcGxhdGUgdmFyaWFibGVzIHdoaWNoIGNhbiBiZSBhY2Nlc3NlZCBieSB0aGUgdGVtcGxhdGVcbiAgICAvLyBjaGlsZCBub2RlcyB0aHJvdWdoIHRoZSBpbXBsaWNpdCByZWNlaXZlci5cbiAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXMucHVzaCguLi50ZW1wbGF0ZS52YXJpYWJsZXMpO1xuXG4gICAgLy8gVmlzaXQgYWxsIGNoaWxkcmVuIG9mIHRoZSB0ZW1wbGF0ZS4gVGhlIHRlbXBsYXRlIHByb3hpZXMgdGhlIG91dHB1dHMgb2YgdGhlXG4gICAgLy8gaW1tZWRpYXRlIGNoaWxkIGVsZW1lbnRzLCBzbyB3ZSBqdXN0IGlnbm9yZSBvdXRwdXRzIG9uIHRoZSBcIlRlbXBsYXRlXCIgaW4gb3JkZXJcbiAgICAvLyB0byBub3QgdmlzaXQgc2ltaWxhciBib3VuZCBldmVudHMgdHdpY2UuXG4gICAgdmlzaXRBbGwodGhpcywgdGVtcGxhdGUuY2hpbGRyZW4pO1xuXG4gICAgLy8gUmVtb3ZlIGFsbCBwcmV2aW91c2x5IGFkZGVkIHZhcmlhYmxlcyBzaW5jZSBhbGwgY2hpbGRyZW4gdGhhdCBjb3VsZCBhY2Nlc3NcbiAgICAvLyB0aGVzZSBoYXZlIGJlZW4gdmlzaXRlZCBhbHJlYWR5LlxuICAgIHRlbXBsYXRlLnZhcmlhYmxlcy5mb3JFYWNoKHYgPT4ge1xuICAgICAgY29uc3QgdmFyaWFibGVJZHggPSB0aGlzLmN1cnJlbnRWYXJpYWJsZXMuaW5kZXhPZih2KTtcblxuICAgICAgaWYgKHZhcmlhYmxlSWR4ICE9PSAtMSkge1xuICAgICAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXMuc3BsaWNlKHZhcmlhYmxlSWR4LCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHZpc2l0Qm91bmRFdmVudChub2RlOiBCb3VuZEV2ZW50KSB7XG4gICAgbm9kZS5oYW5kbGVyLnZpc2l0KHRoaXMuZXhwcmVzc2lvbkFzdFZpc2l0b3IsIG5vZGUuaGFuZGxlclNwYW4pO1xuICB9XG59XG5cbi8qKiBBU1QgdmlzaXRvciB0aGF0IHJlc29sdmVzIGFsbCB2YXJpYWJsZSBhc3NpZ25tZW50cyB3aXRoaW4gYSBnaXZlbiBleHByZXNzaW9uIEFTVC4gKi9cbmNsYXNzIEV4cHJlc3Npb25Bc3RWaXNpdG9yIGV4dGVuZHMgUmVjdXJzaXZlQXN0VmlzaXRvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB2YXJpYWJsZUFzc2lnbm1lbnRzOiBUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudFtdLFxuICAgICAgcHJpdmF0ZSBjdXJyZW50VmFyaWFibGVzOiBWYXJpYWJsZVtdKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHZpc2l0UHJvcGVydHlXcml0ZShub2RlOiBQcm9wZXJ0eVdyaXRlLCBzcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHtcbiAgICBpZiAobm9kZS5yZWNlaXZlciBpbnN0YW5jZW9mIEltcGxpY2l0UmVjZWl2ZXIgJiZcbiAgICAgICAgdGhpcy5jdXJyZW50VmFyaWFibGVzLnNvbWUodiA9PiB2Lm5hbWUgPT09IG5vZGUubmFtZSkpIHtcbiAgICAgIHRoaXMudmFyaWFibGVBc3NpZ25tZW50cy5wdXNoKHtcbiAgICAgICAgbm9kZTogbm9kZSxcbiAgICAgICAgc3RhcnQ6IHNwYW4uc3RhcnQub2Zmc2V0LFxuICAgICAgICBlbmQ6IHNwYW4uZW5kLm9mZnNldCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBzdXBlci52aXNpdFByb3BlcnR5V3JpdGUobm9kZSwgc3Bhbik7XG4gIH1cbn1cbiJdfQ==