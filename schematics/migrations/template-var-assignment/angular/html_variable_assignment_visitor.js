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
        define("@angular/core/schematics/migrations/template-var-assignment/angular/html_variable_assignment_visitor", ["require", "exports", "@angular/core/schematics/utils/template_ast_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HtmlVariableAssignmentVisitor = void 0;
    const template_ast_visitor_1 = require("@angular/core/schematics/utils/template_ast_visitor");
    /**
     * HTML AST visitor that traverses the Render3 HTML AST in order to find all
     * expressions that write to local template variables within bound events.
     */
    class HtmlVariableAssignmentVisitor extends template_ast_visitor_1.TemplateAstVisitor {
        constructor(compilerModule) {
            super(compilerModule);
            this.variableAssignments = [];
            this.currentVariables = [];
            // AST visitor that resolves all variable assignments within a given expression AST.
            // This class must be defined within the template visitor due to the need to extend from a class
            // value found within `@angular/compiler` which is dynamically imported and provided to the
            // visitor.
            this.expressionAstVisitor = new (class extends compilerModule.RecursiveAstVisitor {
                constructor(variableAssignments, currentVariables) {
                    super();
                    this.variableAssignments = variableAssignments;
                    this.currentVariables = currentVariables;
                }
                visitPropertyWrite(node, span) {
                    if (node.receiver instanceof compilerModule.ImplicitReceiver &&
                        this.currentVariables.some(v => v.name === node.name)) {
                        this.variableAssignments.push({
                            node: node,
                            start: span.start.offset,
                            end: span.end.offset,
                        });
                    }
                    super.visitPropertyWrite(node, span);
                }
            })(this.variableAssignments, this.currentVariables);
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF92YXJpYWJsZV9hc3NpZ25tZW50X3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy90ZW1wbGF0ZS12YXItYXNzaWdubWVudC9hbmd1bGFyL2h0bWxfdmFyaWFibGVfYXNzaWdubWVudF92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUdILDhGQUF1RTtJQVN2RTs7O09BR0c7SUFDSCxNQUFhLDZCQUE4QixTQUFRLHlDQUFrQjtRQU1uRSxZQUFZLGNBQWtEO1lBQzVELEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQU54Qix3QkFBbUIsR0FBaUMsRUFBRSxDQUFDO1lBRS9DLHFCQUFnQixHQUFzQixFQUFFLENBQUM7WUFNL0Msb0ZBQW9GO1lBQ3BGLGdHQUFnRztZQUNoRywyRkFBMkY7WUFDM0YsV0FBVztZQUNYLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsS0FBTSxTQUFRLGNBQWMsQ0FBQyxtQkFBbUI7Z0JBQy9FLFlBQ1ksbUJBQWlELEVBQ2pELGdCQUFtQztvQkFDN0MsS0FBSyxFQUFFLENBQUM7b0JBRkUsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUE4QjtvQkFDakQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtnQkFFL0MsQ0FBQztnQkFFUSxrQkFBa0IsQ0FBQyxJQUFtQixFQUFFLElBQXFCO29CQUNwRSxJQUFJLElBQUksQ0FBQyxRQUFRLFlBQVksY0FBYyxDQUFDLGdCQUFnQjt3QkFDeEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUN6RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDOzRCQUM1QixJQUFJLEVBQUUsSUFBSTs0QkFDVixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNOzRCQUN4QixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNO3lCQUNyQixDQUFDLENBQUM7cUJBQ0o7b0JBQ0QsS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdkMsQ0FBQzthQUNGLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVRLFlBQVksQ0FBQyxPQUF1QjtZQUMzQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRVEsYUFBYSxDQUFDLFFBQXlCO1lBQzlDLDZFQUE2RTtZQUM3RSw2Q0FBNkM7WUFDN0MsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVsRCw4RUFBOEU7WUFDOUUsaUZBQWlGO1lBQ2pGLDJDQUEyQztZQUMzQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVqQyw2RUFBNkU7WUFDN0UsbUNBQW1DO1lBQ25DLFFBQVEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVyRCxJQUFJLFdBQVcsS0FBSyxDQUFDLENBQUMsRUFBRTtvQkFDdEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQzlDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRVEsZUFBZSxDQUFDLElBQXVCO1lBQzlDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEUsQ0FBQztLQUNGO0lBL0RELHNFQStEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7SW1wbGljaXRSZWNlaXZlciwgUGFyc2VTb3VyY2VTcGFuLCBQcm9wZXJ0eVdyaXRlLCBSZWN1cnNpdmVBc3RWaXNpdG9yLCBUbXBsQXN0Qm91bmRFdmVudCwgVG1wbEFzdEVsZW1lbnQsIFRtcGxBc3RUZW1wbGF0ZSwgVG1wbEFzdFZhcmlhYmxlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge1RlbXBsYXRlQXN0VmlzaXRvcn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdGVtcGxhdGVfYXN0X3Zpc2l0b3InO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnQge1xuICBzdGFydDogbnVtYmVyO1xuICBlbmQ6IG51bWJlcjtcbiAgbm9kZTogUHJvcGVydHlXcml0ZTtcbn1cblxuLyoqXG4gKiBIVE1MIEFTVCB2aXNpdG9yIHRoYXQgdHJhdmVyc2VzIHRoZSBSZW5kZXIzIEhUTUwgQVNUIGluIG9yZGVyIHRvIGZpbmQgYWxsXG4gKiBleHByZXNzaW9ucyB0aGF0IHdyaXRlIHRvIGxvY2FsIHRlbXBsYXRlIHZhcmlhYmxlcyB3aXRoaW4gYm91bmQgZXZlbnRzLlxuICovXG5leHBvcnQgY2xhc3MgSHRtbFZhcmlhYmxlQXNzaWdubWVudFZpc2l0b3IgZXh0ZW5kcyBUZW1wbGF0ZUFzdFZpc2l0b3Ige1xuICB2YXJpYWJsZUFzc2lnbm1lbnRzOiBUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudFtdID0gW107XG5cbiAgcHJpdmF0ZSBjdXJyZW50VmFyaWFibGVzOiBUbXBsQXN0VmFyaWFibGVbXSA9IFtdO1xuICBwcml2YXRlIGV4cHJlc3Npb25Bc3RWaXNpdG9yO1xuXG4gIGNvbnN0cnVjdG9yKGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpKSB7XG4gICAgc3VwZXIoY29tcGlsZXJNb2R1bGUpO1xuXG4gICAgLy8gQVNUIHZpc2l0b3IgdGhhdCByZXNvbHZlcyBhbGwgdmFyaWFibGUgYXNzaWdubWVudHMgd2l0aGluIGEgZ2l2ZW4gZXhwcmVzc2lvbiBBU1QuXG4gICAgLy8gVGhpcyBjbGFzcyBtdXN0IGJlIGRlZmluZWQgd2l0aGluIHRoZSB0ZW1wbGF0ZSB2aXNpdG9yIGR1ZSB0byB0aGUgbmVlZCB0byBleHRlbmQgZnJvbSBhIGNsYXNzXG4gICAgLy8gdmFsdWUgZm91bmQgd2l0aGluIGBAYW5ndWxhci9jb21waWxlcmAgd2hpY2ggaXMgZHluYW1pY2FsbHkgaW1wb3J0ZWQgYW5kIHByb3ZpZGVkIHRvIHRoZVxuICAgIC8vIHZpc2l0b3IuXG4gICAgdGhpcy5leHByZXNzaW9uQXN0VmlzaXRvciA9IG5ldyAoY2xhc3MgZXh0ZW5kcyBjb21waWxlck1vZHVsZS5SZWN1cnNpdmVBc3RWaXNpdG9yIHtcbiAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgIHByaXZhdGUgdmFyaWFibGVBc3NpZ25tZW50czogVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRbXSxcbiAgICAgICAgICBwcml2YXRlIGN1cnJlbnRWYXJpYWJsZXM6IFRtcGxBc3RWYXJpYWJsZVtdKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICB9XG5cbiAgICAgIG92ZXJyaWRlIHZpc2l0UHJvcGVydHlXcml0ZShub2RlOiBQcm9wZXJ0eVdyaXRlLCBzcGFuOiBQYXJzZVNvdXJjZVNwYW4pIHtcbiAgICAgICAgaWYgKG5vZGUucmVjZWl2ZXIgaW5zdGFuY2VvZiBjb21waWxlck1vZHVsZS5JbXBsaWNpdFJlY2VpdmVyICYmXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXMuc29tZSh2ID0+IHYubmFtZSA9PT0gbm9kZS5uYW1lKSkge1xuICAgICAgICAgIHRoaXMudmFyaWFibGVBc3NpZ25tZW50cy5wdXNoKHtcbiAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICBzdGFydDogc3Bhbi5zdGFydC5vZmZzZXQsXG4gICAgICAgICAgICBlbmQ6IHNwYW4uZW5kLm9mZnNldCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci52aXNpdFByb3BlcnR5V3JpdGUobm9kZSwgc3Bhbik7XG4gICAgICB9XG4gICAgfSkodGhpcy52YXJpYWJsZUFzc2lnbm1lbnRzLCB0aGlzLmN1cnJlbnRWYXJpYWJsZXMpO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRFbGVtZW50KGVsZW1lbnQ6IFRtcGxBc3RFbGVtZW50KTogdm9pZCB7XG4gICAgdGhpcy52aXNpdEFsbChlbGVtZW50Lm91dHB1dHMpO1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5jaGlsZHJlbik7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdFRlbXBsYXRlKHRlbXBsYXRlOiBUbXBsQXN0VGVtcGxhdGUpOiB2b2lkIHtcbiAgICAvLyBLZWVwIHRyYWNrIG9mIHRoZSB0ZW1wbGF0ZSB2YXJpYWJsZXMgd2hpY2ggY2FuIGJlIGFjY2Vzc2VkIGJ5IHRoZSB0ZW1wbGF0ZVxuICAgIC8vIGNoaWxkIG5vZGVzIHRocm91Z2ggdGhlIGltcGxpY2l0IHJlY2VpdmVyLlxuICAgIHRoaXMuY3VycmVudFZhcmlhYmxlcy5wdXNoKC4uLnRlbXBsYXRlLnZhcmlhYmxlcyk7XG5cbiAgICAvLyBWaXNpdCBhbGwgY2hpbGRyZW4gb2YgdGhlIHRlbXBsYXRlLiBUaGUgdGVtcGxhdGUgcHJveGllcyB0aGUgb3V0cHV0cyBvZiB0aGVcbiAgICAvLyBpbW1lZGlhdGUgY2hpbGQgZWxlbWVudHMsIHNvIHdlIGp1c3QgaWdub3JlIG91dHB1dHMgb24gdGhlIFwiVGVtcGxhdGVcIiBpbiBvcmRlclxuICAgIC8vIHRvIG5vdCB2aXNpdCBzaW1pbGFyIGJvdW5kIGV2ZW50cyB0d2ljZS5cbiAgICB0aGlzLnZpc2l0QWxsKHRlbXBsYXRlLmNoaWxkcmVuKTtcblxuICAgIC8vIFJlbW92ZSBhbGwgcHJldmlvdXNseSBhZGRlZCB2YXJpYWJsZXMgc2luY2UgYWxsIGNoaWxkcmVuIHRoYXQgY291bGQgYWNjZXNzXG4gICAgLy8gdGhlc2UgaGF2ZSBiZWVuIHZpc2l0ZWQgYWxyZWFkeS5cbiAgICB0ZW1wbGF0ZS52YXJpYWJsZXMuZm9yRWFjaCh2ID0+IHtcbiAgICAgIGNvbnN0IHZhcmlhYmxlSWR4ID0gdGhpcy5jdXJyZW50VmFyaWFibGVzLmluZGV4T2Yodik7XG5cbiAgICAgIGlmICh2YXJpYWJsZUlkeCAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VmFyaWFibGVzLnNwbGljZSh2YXJpYWJsZUlkeCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdEJvdW5kRXZlbnQobm9kZTogVG1wbEFzdEJvdW5kRXZlbnQpIHtcbiAgICBub2RlLmhhbmRsZXIudmlzaXQodGhpcy5leHByZXNzaW9uQXN0VmlzaXRvciwgbm9kZS5oYW5kbGVyU3Bhbik7XG4gIH1cbn1cbiJdfQ==