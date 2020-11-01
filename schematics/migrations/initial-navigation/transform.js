(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/initial-navigation/transform", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InitialNavigationTransform = void 0;
    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    const ts = require("typescript");
    class InitialNavigationTransform {
        constructor(typeChecker, getUpdateRecorder) {
            this.typeChecker = typeChecker;
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = ts.createPrinter();
        }
        /** Migrate the ExtraOptions#InitialNavigation property assignments. */
        migrateInitialNavigationAssignments(literals) {
            literals.forEach(l => this.migrateAssignment(l));
        }
        /** Migrate an ExtraOptions#InitialNavigation expression to use the new options format. */
        migrateAssignment(assignment) {
            const newInitializer = getUpdatedInitialNavigationValue(assignment.initializer);
            if (newInitializer) {
                const newAssignment = ts.updatePropertyAssignment(assignment, assignment.name, newInitializer);
                this._updateNode(assignment, newAssignment);
            }
        }
        _updateNode(node, newNode) {
            const newText = this.printer.printNode(ts.EmitHint.Unspecified, newNode, node.getSourceFile());
            const recorder = this.getUpdateRecorder(node.getSourceFile());
            recorder.updateNode(node, newText);
        }
    }
    exports.InitialNavigationTransform = InitialNavigationTransform;
    /**
     * Updates the deprecated initialNavigation options to their v10 equivalents
     * (or as close as we can get).
     * @param initializer the old initializer to update
     */
    function getUpdatedInitialNavigationValue(initializer) {
        const oldText = ts.isStringLiteralLike(initializer) ?
            initializer.text :
            initializer.kind === ts.SyntaxKind.TrueKeyword;
        let newText;
        switch (oldText) {
            case false:
            case 'legacy_disabled':
                newText = 'disabled';
                break;
            case true:
            case 'legacy_enabled':
                newText = 'enabledNonBlocking';
                break;
        }
        return !!newText ? ts.createIdentifier(`'${newText}'`) : null;
    }
    /**
     * Check whether the value assigned to an `initialNavigation` assignment
     * conforms to the expected types for ExtraOptions#InitialNavigation
     * @param node the property assignment to check
     */
    function isValidInitialNavigationValue(node) {
        return ts.isStringLiteralLike(node.initializer) ||
            node.initializer.kind === ts.SyntaxKind.FalseKeyword ||
            node.initializer.kind === ts.SyntaxKind.TrueKeyword;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvaW5pdGlhbC1uYXZpZ2F0aW9uL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCxpQ0FBaUM7SUFLakMsTUFBYSwwQkFBMEI7UUFHckMsWUFDWSxXQUEyQixFQUMzQixpQkFBd0Q7WUFEeEQsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUM7WUFKNUQsWUFBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUlrQyxDQUFDO1FBRXhFLHVFQUF1RTtRQUN2RSxtQ0FBbUMsQ0FBQyxRQUFpQztZQUNuRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELDBGQUEwRjtRQUMxRixpQkFBaUIsQ0FBQyxVQUFpQztZQUNqRCxNQUFNLGNBQWMsR0FBRyxnQ0FBZ0MsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEYsSUFBSSxjQUFjLEVBQUU7Z0JBQ2xCLE1BQU0sYUFBYSxHQUNmLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDN0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDN0M7UUFDSCxDQUFDO1FBRU8sV0FBVyxDQUFDLElBQWEsRUFBRSxPQUFnQjtZQUNqRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDL0YsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQzlELFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLENBQUM7S0FDRjtJQTNCRCxnRUEyQkM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBUyxnQ0FBZ0MsQ0FBQyxXQUEwQjtRQUNsRSxNQUFNLE9BQU8sR0FBbUIsRUFBRSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDakUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLFdBQVcsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7UUFDbkQsSUFBSSxPQUF5QixDQUFDO1FBQzlCLFFBQVEsT0FBTyxFQUFFO1lBQ2YsS0FBSyxLQUFLLENBQUM7WUFDWCxLQUFLLGlCQUFpQjtnQkFDcEIsT0FBTyxHQUFHLFVBQVUsQ0FBQztnQkFDckIsTUFBTTtZQUNSLEtBQUssSUFBSSxDQUFDO1lBQ1YsS0FBSyxnQkFBZ0I7Z0JBQ25CLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQztnQkFDL0IsTUFBTTtTQUNUO1FBRUQsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDaEUsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFTLDZCQUE2QixDQUFDLElBQTJCO1FBQ2hFLE9BQU8sRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDM0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZO1lBQ3BELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO0lBQzFELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cblxuZXhwb3J0IGNsYXNzIEluaXRpYWxOYXZpZ2F0aW9uVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIGdldFVwZGF0ZVJlY29yZGVyOiAoc2Y6IHRzLlNvdXJjZUZpbGUpID0+IFVwZGF0ZVJlY29yZGVyKSB7fVxuXG4gIC8qKiBNaWdyYXRlIHRoZSBFeHRyYU9wdGlvbnMjSW5pdGlhbE5hdmlnYXRpb24gcHJvcGVydHkgYXNzaWdubWVudHMuICovXG4gIG1pZ3JhdGVJbml0aWFsTmF2aWdhdGlvbkFzc2lnbm1lbnRzKGxpdGVyYWxzOiB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnRbXSkge1xuICAgIGxpdGVyYWxzLmZvckVhY2gobCA9PiB0aGlzLm1pZ3JhdGVBc3NpZ25tZW50KGwpKTtcbiAgfVxuXG4gIC8qKiBNaWdyYXRlIGFuIEV4dHJhT3B0aW9ucyNJbml0aWFsTmF2aWdhdGlvbiBleHByZXNzaW9uIHRvIHVzZSB0aGUgbmV3IG9wdGlvbnMgZm9ybWF0LiAqL1xuICBtaWdyYXRlQXNzaWdubWVudChhc3NpZ25tZW50OiB0cy5Qcm9wZXJ0eUFzc2lnbm1lbnQpIHtcbiAgICBjb25zdCBuZXdJbml0aWFsaXplciA9IGdldFVwZGF0ZWRJbml0aWFsTmF2aWdhdGlvblZhbHVlKGFzc2lnbm1lbnQuaW5pdGlhbGl6ZXIpO1xuICAgIGlmIChuZXdJbml0aWFsaXplcikge1xuICAgICAgY29uc3QgbmV3QXNzaWdubWVudCA9XG4gICAgICAgICAgdHMudXBkYXRlUHJvcGVydHlBc3NpZ25tZW50KGFzc2lnbm1lbnQsIGFzc2lnbm1lbnQubmFtZSwgbmV3SW5pdGlhbGl6ZXIpO1xuICAgICAgdGhpcy5fdXBkYXRlTm9kZShhc3NpZ25tZW50LCBuZXdBc3NpZ25tZW50KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVOb2RlKG5vZGU6IHRzLk5vZGUsIG5ld05vZGU6IHRzLk5vZGUpIHtcbiAgICBjb25zdCBuZXdUZXh0ID0gdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3Tm9kZSwgbm9kZS5nZXRTb3VyY2VGaWxlKCkpO1xuICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgcmVjb3JkZXIudXBkYXRlTm9kZShub2RlLCBuZXdUZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGRlcHJlY2F0ZWQgaW5pdGlhbE5hdmlnYXRpb24gb3B0aW9ucyB0byB0aGVpciB2MTAgZXF1aXZhbGVudHNcbiAqIChvciBhcyBjbG9zZSBhcyB3ZSBjYW4gZ2V0KS5cbiAqIEBwYXJhbSBpbml0aWFsaXplciB0aGUgb2xkIGluaXRpYWxpemVyIHRvIHVwZGF0ZVxuICovXG5mdW5jdGlvbiBnZXRVcGRhdGVkSW5pdGlhbE5hdmlnYXRpb25WYWx1ZShpbml0aWFsaXplcjogdHMuRXhwcmVzc2lvbik6IHRzLkV4cHJlc3Npb258bnVsbCB7XG4gIGNvbnN0IG9sZFRleHQ6IHN0cmluZ3xib29sZWFuID0gdHMuaXNTdHJpbmdMaXRlcmFsTGlrZShpbml0aWFsaXplcikgP1xuICAgICAgaW5pdGlhbGl6ZXIudGV4dCA6XG4gICAgICBpbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLlRydWVLZXl3b3JkO1xuICBsZXQgbmV3VGV4dDogc3RyaW5nfHVuZGVmaW5lZDtcbiAgc3dpdGNoIChvbGRUZXh0KSB7XG4gICAgY2FzZSBmYWxzZTpcbiAgICBjYXNlICdsZWdhY3lfZGlzYWJsZWQnOlxuICAgICAgbmV3VGV4dCA9ICdkaXNhYmxlZCc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIHRydWU6XG4gICAgY2FzZSAnbGVnYWN5X2VuYWJsZWQnOlxuICAgICAgbmV3VGV4dCA9ICdlbmFibGVkTm9uQmxvY2tpbmcnO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICByZXR1cm4gISFuZXdUZXh0ID8gdHMuY3JlYXRlSWRlbnRpZmllcihgJyR7bmV3VGV4dH0nYCkgOiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIHZhbHVlIGFzc2lnbmVkIHRvIGFuIGBpbml0aWFsTmF2aWdhdGlvbmAgYXNzaWdubWVudFxuICogY29uZm9ybXMgdG8gdGhlIGV4cGVjdGVkIHR5cGVzIGZvciBFeHRyYU9wdGlvbnMjSW5pdGlhbE5hdmlnYXRpb25cbiAqIEBwYXJhbSBub2RlIHRoZSBwcm9wZXJ0eSBhc3NpZ25tZW50IHRvIGNoZWNrXG4gKi9cbmZ1bmN0aW9uIGlzVmFsaWRJbml0aWFsTmF2aWdhdGlvblZhbHVlKG5vZGU6IHRzLlByb3BlcnR5QXNzaWdubWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gdHMuaXNTdHJpbmdMaXRlcmFsTGlrZShub2RlLmluaXRpYWxpemVyKSB8fFxuICAgICAgbm9kZS5pbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLkZhbHNlS2V5d29yZCB8fFxuICAgICAgbm9kZS5pbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLlRydWVLZXl3b3JkO1xufVxuIl19