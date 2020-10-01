(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/relative-link-resolution/transform", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RelativeLinkResolutionTransform = void 0;
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    const ts = require("typescript");
    const RELATIVE_LINK_RESOLUTION = 'relativeLinkResolution';
    class RelativeLinkResolutionTransform {
        constructor(getUpdateRecorder) {
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = ts.createPrinter();
        }
        /** Migrate the ExtraOptions#RelativeLinkResolution property assignments. */
        migrateRouterModuleForRootCalls(calls) {
            calls.forEach(c => {
                this._updateCallExpressionWithoutExtraOptions(c);
            });
        }
        migrateObjectLiterals(vars) {
            vars.forEach(v => this._maybeUpdateLiteral(v));
        }
        _updateCallExpressionWithoutExtraOptions(callExpression) {
            const args = callExpression.arguments;
            const emptyLiteral = ts.createObjectLiteral();
            const newNode = ts.updateCall(callExpression, callExpression.expression, callExpression.typeArguments, [args[0], this._getMigratedLiteralExpression(emptyLiteral)]);
            this._updateNode(callExpression, newNode);
        }
        _getMigratedLiteralExpression(literal) {
            if (literal.properties.some(prop => ts.isPropertyAssignment(prop) &&
                prop.name.getText() === RELATIVE_LINK_RESOLUTION)) {
                // literal already defines a value for relativeLinkResolution. Skip it
                return literal;
            }
            const legacyExpression = ts.createPropertyAssignment(RELATIVE_LINK_RESOLUTION, ts.createStringLiteral('legacy', true /* singleQuotes */));
            return ts.updateObjectLiteral(literal, [...literal.properties, legacyExpression]);
        }
        _maybeUpdateLiteral(literal) {
            const updatedLiteral = this._getMigratedLiteralExpression(literal);
            if (updatedLiteral !== literal) {
                this._updateNode(literal, updatedLiteral);
            }
        }
        _updateNode(node, newNode) {
            const newText = this.printer.printNode(ts.EmitHint.Unspecified, newNode, node.getSourceFile());
            const recorder = this.getUpdateRecorder(node.getSourceFile());
            recorder.updateNode(node, newText);
        }
    }
    exports.RelativeLinkResolutionTransform = RelativeLinkResolutionTransform;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvcmVsYXRpdmUtbGluay1yZXNvbHV0aW9uL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCxpQ0FBaUM7SUFLakMsTUFBTSx3QkFBd0IsR0FBRyx3QkFBd0IsQ0FBQztJQUUxRCxNQUFhLCtCQUErQjtRQUcxQyxZQUFvQixpQkFBd0Q7WUFBeEQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF1QztZQUZwRSxZQUFPLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRTBDLENBQUM7UUFFaEYsNEVBQTRFO1FBQzVFLCtCQUErQixDQUFDLEtBQTBCO1lBQ3hELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxJQUFrQztZQUN0RCxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVPLHdDQUF3QyxDQUFDLGNBQWlDO1lBQ2hGLE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDOUMsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FDekIsY0FBYyxFQUFFLGNBQWMsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLGFBQWEsRUFDdkUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRU8sNkJBQTZCLENBQUMsT0FBbUM7WUFDdkUsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FDbkIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLHdCQUF3QixDQUFDLEVBQUU7Z0JBQzdELHNFQUFzRTtnQkFDdEUsT0FBTyxPQUFPLENBQUM7YUFDaEI7WUFDRCxNQUFNLGdCQUFnQixHQUFHLEVBQUUsQ0FBQyx3QkFBd0IsQ0FDaEQsd0JBQXdCLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUVPLG1CQUFtQixDQUFDLE9BQW1DO1lBQzdELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuRSxJQUFJLGNBQWMsS0FBSyxPQUFPLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQzNDO1FBQ0gsQ0FBQztRQUVPLFdBQVcsQ0FBQyxJQUFhLEVBQUUsT0FBZ0I7WUFDakQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUM5RCxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyQyxDQUFDO0tBQ0Y7SUFqREQsMEVBaURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtVcGRhdGVSZWNvcmRlcn0gZnJvbSAnLi91cGRhdGVfcmVjb3JkZXInO1xuXG5cbmNvbnN0IFJFTEFUSVZFX0xJTktfUkVTT0xVVElPTiA9ICdyZWxhdGl2ZUxpbmtSZXNvbHV0aW9uJztcblxuZXhwb3J0IGNsYXNzIFJlbGF0aXZlTGlua1Jlc29sdXRpb25UcmFuc2Zvcm0ge1xuICBwcml2YXRlIHByaW50ZXIgPSB0cy5jcmVhdGVQcmludGVyKCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBnZXRVcGRhdGVSZWNvcmRlcjogKHNmOiB0cy5Tb3VyY2VGaWxlKSA9PiBVcGRhdGVSZWNvcmRlcikge31cblxuICAvKiogTWlncmF0ZSB0aGUgRXh0cmFPcHRpb25zI1JlbGF0aXZlTGlua1Jlc29sdXRpb24gcHJvcGVydHkgYXNzaWdubWVudHMuICovXG4gIG1pZ3JhdGVSb3V0ZXJNb2R1bGVGb3JSb290Q2FsbHMoY2FsbHM6IHRzLkNhbGxFeHByZXNzaW9uW10pIHtcbiAgICBjYWxscy5mb3JFYWNoKGMgPT4ge1xuICAgICAgdGhpcy5fdXBkYXRlQ2FsbEV4cHJlc3Npb25XaXRob3V0RXh0cmFPcHRpb25zKGMpO1xuICAgIH0pO1xuICB9XG5cbiAgbWlncmF0ZU9iamVjdExpdGVyYWxzKHZhcnM6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uW10pIHtcbiAgICB2YXJzLmZvckVhY2godiA9PiB0aGlzLl9tYXliZVVwZGF0ZUxpdGVyYWwodikpO1xuICB9XG5cbiAgcHJpdmF0ZSBfdXBkYXRlQ2FsbEV4cHJlc3Npb25XaXRob3V0RXh0cmFPcHRpb25zKGNhbGxFeHByZXNzaW9uOiB0cy5DYWxsRXhwcmVzc2lvbikge1xuICAgIGNvbnN0IGFyZ3MgPSBjYWxsRXhwcmVzc2lvbi5hcmd1bWVudHM7XG4gICAgY29uc3QgZW1wdHlMaXRlcmFsID0gdHMuY3JlYXRlT2JqZWN0TGl0ZXJhbCgpO1xuICAgIGNvbnN0IG5ld05vZGUgPSB0cy51cGRhdGVDYWxsKFxuICAgICAgICBjYWxsRXhwcmVzc2lvbiwgY2FsbEV4cHJlc3Npb24uZXhwcmVzc2lvbiwgY2FsbEV4cHJlc3Npb24udHlwZUFyZ3VtZW50cyxcbiAgICAgICAgW2FyZ3NbMF0sIHRoaXMuX2dldE1pZ3JhdGVkTGl0ZXJhbEV4cHJlc3Npb24oZW1wdHlMaXRlcmFsKV0pO1xuICAgIHRoaXMuX3VwZGF0ZU5vZGUoY2FsbEV4cHJlc3Npb24sIG5ld05vZGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0TWlncmF0ZWRMaXRlcmFsRXhwcmVzc2lvbihsaXRlcmFsOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikge1xuICAgIGlmIChsaXRlcmFsLnByb3BlcnRpZXMuc29tZShcbiAgICAgICAgICAgIHByb3AgPT4gdHMuaXNQcm9wZXJ0eUFzc2lnbm1lbnQocHJvcCkgJiZcbiAgICAgICAgICAgICAgICBwcm9wLm5hbWUuZ2V0VGV4dCgpID09PSBSRUxBVElWRV9MSU5LX1JFU09MVVRJT04pKSB7XG4gICAgICAvLyBsaXRlcmFsIGFscmVhZHkgZGVmaW5lcyBhIHZhbHVlIGZvciByZWxhdGl2ZUxpbmtSZXNvbHV0aW9uLiBTa2lwIGl0XG4gICAgICByZXR1cm4gbGl0ZXJhbDtcbiAgICB9XG4gICAgY29uc3QgbGVnYWN5RXhwcmVzc2lvbiA9IHRzLmNyZWF0ZVByb3BlcnR5QXNzaWdubWVudChcbiAgICAgICAgUkVMQVRJVkVfTElOS19SRVNPTFVUSU9OLCB0cy5jcmVhdGVTdHJpbmdMaXRlcmFsKCdsZWdhY3knLCB0cnVlIC8qIHNpbmdsZVF1b3RlcyAqLykpO1xuICAgIHJldHVybiB0cy51cGRhdGVPYmplY3RMaXRlcmFsKGxpdGVyYWwsIFsuLi5saXRlcmFsLnByb3BlcnRpZXMsIGxlZ2FjeUV4cHJlc3Npb25dKTtcbiAgfVxuXG4gIHByaXZhdGUgX21heWJlVXBkYXRlTGl0ZXJhbChsaXRlcmFsOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbikge1xuICAgIGNvbnN0IHVwZGF0ZWRMaXRlcmFsID0gdGhpcy5fZ2V0TWlncmF0ZWRMaXRlcmFsRXhwcmVzc2lvbihsaXRlcmFsKTtcbiAgICBpZiAodXBkYXRlZExpdGVyYWwgIT09IGxpdGVyYWwpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZU5vZGUobGl0ZXJhbCwgdXBkYXRlZExpdGVyYWwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZU5vZGUobm9kZTogdHMuTm9kZSwgbmV3Tm9kZTogdHMuTm9kZSkge1xuICAgIGNvbnN0IG5ld1RleHQgPSB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdOb2RlLCBub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKG5vZGUuZ2V0U291cmNlRmlsZSgpKTtcbiAgICByZWNvcmRlci51cGRhdGVOb2RlKG5vZGUsIG5ld1RleHQpO1xuICB9XG59XG4iXX0=