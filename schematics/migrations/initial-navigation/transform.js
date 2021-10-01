var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    const typescript_1 = __importDefault(require("typescript"));
    class InitialNavigationTransform {
        constructor(getUpdateRecorder) {
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = typescript_1.default.createPrinter();
        }
        /** Migrate the ExtraOptions#InitialNavigation property assignments. */
        migrateInitialNavigationAssignments(literals) {
            literals.forEach(l => this.migrateAssignment(l));
        }
        /** Migrate an ExtraOptions#InitialNavigation expression to use the new options format. */
        migrateAssignment(assignment) {
            const newInitializer = getUpdatedInitialNavigationValue(assignment.initializer);
            if (newInitializer) {
                const newAssignment = typescript_1.default.updatePropertyAssignment(assignment, assignment.name, newInitializer);
                this._updateNode(assignment, newAssignment);
            }
        }
        _updateNode(node, newNode) {
            const newText = this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newNode, node.getSourceFile());
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
        const oldText = typescript_1.default.isStringLiteralLike(initializer) ?
            initializer.text :
            initializer.kind === typescript_1.default.SyntaxKind.TrueKeyword;
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
        return !!newText ? typescript_1.default.createIdentifier(`'${newText}'`) : null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvaW5pdGlhbC1uYXZpZ2F0aW9uL3RyYW5zZm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7SUFBQTs7Ozs7O09BTUc7SUFDSCw0REFBNEI7SUFLNUIsTUFBYSwwQkFBMEI7UUFHckMsWUFBb0IsaUJBQXdEO1lBQXhELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUM7WUFGcEUsWUFBTyxHQUFHLG9CQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFMEMsQ0FBQztRQUVoRix1RUFBdUU7UUFDdkUsbUNBQW1DLENBQUMsUUFBaUM7WUFDbkUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCwwRkFBMEY7UUFDMUYsaUJBQWlCLENBQUMsVUFBaUM7WUFDakQsTUFBTSxjQUFjLEdBQUcsZ0NBQWdDLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hGLElBQUksY0FBYyxFQUFFO2dCQUNsQixNQUFNLGFBQWEsR0FDZixvQkFBRSxDQUFDLHdCQUF3QixDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUM3RSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQzthQUM3QztRQUNILENBQUM7UUFFTyxXQUFXLENBQUMsSUFBYSxFQUFFLE9BQWdCO1lBQ2pELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLG9CQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDL0YsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQzlELFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLENBQUM7S0FDRjtJQXpCRCxnRUF5QkM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBUyxnQ0FBZ0MsQ0FBQyxXQUEwQjtRQUNsRSxNQUFNLE9BQU8sR0FBbUIsb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixXQUFXLENBQUMsSUFBSSxLQUFLLG9CQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztRQUNuRCxJQUFJLE9BQXlCLENBQUM7UUFDOUIsUUFBUSxPQUFPLEVBQUU7WUFDZixLQUFLLEtBQUssQ0FBQztZQUNYLEtBQUssaUJBQWlCO2dCQUNwQixPQUFPLEdBQUcsVUFBVSxDQUFDO2dCQUNyQixNQUFNO1lBQ1IsS0FBSyxJQUFJLENBQUM7WUFDVixLQUFLLGdCQUFnQjtnQkFDbkIsT0FBTyxHQUFHLG9CQUFvQixDQUFDO2dCQUMvQixNQUFNO1NBQ1Q7UUFFRCxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLG9CQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDaEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge1VwZGF0ZVJlY29yZGVyfSBmcm9tICcuL3VwZGF0ZV9yZWNvcmRlcic7XG5cblxuZXhwb3J0IGNsYXNzIEluaXRpYWxOYXZpZ2F0aW9uVHJhbnNmb3JtIHtcbiAgcHJpdmF0ZSBwcmludGVyID0gdHMuY3JlYXRlUHJpbnRlcigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZ2V0VXBkYXRlUmVjb3JkZXI6IChzZjogdHMuU291cmNlRmlsZSkgPT4gVXBkYXRlUmVjb3JkZXIpIHt9XG5cbiAgLyoqIE1pZ3JhdGUgdGhlIEV4dHJhT3B0aW9ucyNJbml0aWFsTmF2aWdhdGlvbiBwcm9wZXJ0eSBhc3NpZ25tZW50cy4gKi9cbiAgbWlncmF0ZUluaXRpYWxOYXZpZ2F0aW9uQXNzaWdubWVudHMobGl0ZXJhbHM6IHRzLlByb3BlcnR5QXNzaWdubWVudFtdKSB7XG4gICAgbGl0ZXJhbHMuZm9yRWFjaChsID0+IHRoaXMubWlncmF0ZUFzc2lnbm1lbnQobCkpO1xuICB9XG5cbiAgLyoqIE1pZ3JhdGUgYW4gRXh0cmFPcHRpb25zI0luaXRpYWxOYXZpZ2F0aW9uIGV4cHJlc3Npb24gdG8gdXNlIHRoZSBuZXcgb3B0aW9ucyBmb3JtYXQuICovXG4gIG1pZ3JhdGVBc3NpZ25tZW50KGFzc2lnbm1lbnQ6IHRzLlByb3BlcnR5QXNzaWdubWVudCkge1xuICAgIGNvbnN0IG5ld0luaXRpYWxpemVyID0gZ2V0VXBkYXRlZEluaXRpYWxOYXZpZ2F0aW9uVmFsdWUoYXNzaWdubWVudC5pbml0aWFsaXplcik7XG4gICAgaWYgKG5ld0luaXRpYWxpemVyKSB7XG4gICAgICBjb25zdCBuZXdBc3NpZ25tZW50ID1cbiAgICAgICAgICB0cy51cGRhdGVQcm9wZXJ0eUFzc2lnbm1lbnQoYXNzaWdubWVudCwgYXNzaWdubWVudC5uYW1lLCBuZXdJbml0aWFsaXplcik7XG4gICAgICB0aGlzLl91cGRhdGVOb2RlKGFzc2lnbm1lbnQsIG5ld0Fzc2lnbm1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZU5vZGUobm9kZTogdHMuTm9kZSwgbmV3Tm9kZTogdHMuTm9kZSkge1xuICAgIGNvbnN0IG5ld1RleHQgPSB0aGlzLnByaW50ZXIucHJpbnROb2RlKHRzLkVtaXRIaW50LlVuc3BlY2lmaWVkLCBuZXdOb2RlLCBub2RlLmdldFNvdXJjZUZpbGUoKSk7XG4gICAgY29uc3QgcmVjb3JkZXIgPSB0aGlzLmdldFVwZGF0ZVJlY29yZGVyKG5vZGUuZ2V0U291cmNlRmlsZSgpKTtcbiAgICByZWNvcmRlci51cGRhdGVOb2RlKG5vZGUsIG5ld1RleHQpO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgZGVwcmVjYXRlZCBpbml0aWFsTmF2aWdhdGlvbiBvcHRpb25zIHRvIHRoZWlyIHYxMCBlcXVpdmFsZW50c1xuICogKG9yIGFzIGNsb3NlIGFzIHdlIGNhbiBnZXQpLlxuICogQHBhcmFtIGluaXRpYWxpemVyIHRoZSBvbGQgaW5pdGlhbGl6ZXIgdG8gdXBkYXRlXG4gKi9cbmZ1bmN0aW9uIGdldFVwZGF0ZWRJbml0aWFsTmF2aWdhdGlvblZhbHVlKGluaXRpYWxpemVyOiB0cy5FeHByZXNzaW9uKTogdHMuRXhwcmVzc2lvbnxudWxsIHtcbiAgY29uc3Qgb2xkVGV4dDogc3RyaW5nfGJvb2xlYW4gPSB0cy5pc1N0cmluZ0xpdGVyYWxMaWtlKGluaXRpYWxpemVyKSA/XG4gICAgICBpbml0aWFsaXplci50ZXh0IDpcbiAgICAgIGluaXRpYWxpemVyLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVHJ1ZUtleXdvcmQ7XG4gIGxldCBuZXdUZXh0OiBzdHJpbmd8dW5kZWZpbmVkO1xuICBzd2l0Y2ggKG9sZFRleHQpIHtcbiAgICBjYXNlIGZhbHNlOlxuICAgIGNhc2UgJ2xlZ2FjeV9kaXNhYmxlZCc6XG4gICAgICBuZXdUZXh0ID0gJ2Rpc2FibGVkJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgdHJ1ZTpcbiAgICBjYXNlICdsZWdhY3lfZW5hYmxlZCc6XG4gICAgICBuZXdUZXh0ID0gJ2VuYWJsZWROb25CbG9ja2luZyc7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIHJldHVybiAhIW5ld1RleHQgPyB0cy5jcmVhdGVJZGVudGlmaWVyKGAnJHtuZXdUZXh0fSdgKSA6IG51bGw7XG59XG4iXX0=