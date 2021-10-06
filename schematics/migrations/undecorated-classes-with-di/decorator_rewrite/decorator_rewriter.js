var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/decorator_rewriter", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/functions", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/import_rewrite_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecoratorRewriter = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const functions_1 = require("@angular/core/schematics/utils/typescript/functions");
    const import_rewrite_visitor_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/import_rewrite_visitor");
    /**
     * Class that can be used to copy decorators to a new location. The rewriter ensures that
     * identifiers and imports are rewritten to work in the new file location. Fields in a
     * decorator that cannot be cleanly copied will be copied with a comment explaining that
     * imports and identifiers need to be adjusted manually.
     */
    class DecoratorRewriter {
        constructor(importManager, typeChecker, compiler) {
            this.importManager = importManager;
            this.typeChecker = typeChecker;
            this.compiler = compiler;
            this.previousSourceFile = null;
            this.newSourceFile = null;
            this.newProperties = [];
            this.nonCopyableProperties = [];
            this.importRewriterFactory = new import_rewrite_visitor_1.ImportRewriteTransformerFactory(this.importManager, this.typeChecker, this.compiler['_host']);
        }
        rewrite(ngDecorator, newSourceFile) {
            const decorator = ngDecorator.node;
            // Reset the previous state of the decorator rewriter.
            this.newProperties = [];
            this.nonCopyableProperties = [];
            this.newSourceFile = newSourceFile;
            this.previousSourceFile = decorator.getSourceFile();
            // If the decorator will be added to the same source file it currently
            // exists in, we don't need to rewrite any paths or add new imports.
            if (this.previousSourceFile === newSourceFile) {
                return this._createDecorator(decorator.expression);
            }
            const oldCallExpr = decorator.expression;
            if (!oldCallExpr.arguments.length) {
                // Re-use the original decorator if there are no arguments and nothing needs
                // to be sanitized or rewritten.
                return this._createDecorator(decorator.expression);
            }
            const metadata = (0, functions_1.unwrapExpression)(oldCallExpr.arguments[0]);
            if (!typescript_1.default.isObjectLiteralExpression(metadata)) {
                // Re-use the original decorator as there is no metadata that can be sanitized.
                return this._createDecorator(decorator.expression);
            }
            metadata.properties.forEach(prop => {
                // We don't handle spread assignments, accessors or method declarations automatically
                // as it involves more advanced static analysis and these type of properties are not
                // picked up by ngc either.
                if (typescript_1.default.isSpreadAssignment(prop) || typescript_1.default.isAccessor(prop) || typescript_1.default.isMethodDeclaration(prop)) {
                    this.nonCopyableProperties.push(prop);
                    return;
                }
                const sanitizedProp = this._sanitizeMetadataProperty(prop);
                if (sanitizedProp !== null) {
                    this.newProperties.push(sanitizedProp);
                }
                else {
                    this.nonCopyableProperties.push(prop);
                }
            });
            // In case there is at least one non-copyable property, we add a leading comment to
            // the first property assignment in order to ask the developer to manually manage
            // imports and do path rewriting for these properties.
            if (this.nonCopyableProperties.length !== 0) {
                ['The following fields were copied from the base class,',
                    'but could not be updated automatically to work in the',
                    'new file location. Please add any required imports for', 'the properties below:']
                    .forEach(text => typescript_1.default.addSyntheticLeadingComment(this.nonCopyableProperties[0], typescript_1.default.SyntaxKind.SingleLineCommentTrivia, ` ${text}`, true));
            }
            // Note that we don't update the decorator as we don't want to copy potential leading
            // comments of the decorator. This is necessary because otherwise comments from the
            // copied decorator end up describing the new class (which is not always correct).
            return this._createDecorator(typescript_1.default.createCall(this.importManager.addImportToSourceFile(newSourceFile, ngDecorator.name, ngDecorator.moduleName), undefined, [typescript_1.default.updateObjectLiteral(metadata, [...this.newProperties, ...this.nonCopyableProperties])]));
        }
        /** Creates a new decorator with the given expression. */
        _createDecorator(expr) {
            // Note that we don't update the decorator as we don't want to copy potential leading
            // comments of the decorator. This is necessary because otherwise comments from the
            // copied decorator end up describing the new class (which is not always correct).
            return typescript_1.default.createDecorator(expr);
        }
        /**
         * Sanitizes a metadata property by ensuring that all contained identifiers
         * are imported in the target source file.
         */
        _sanitizeMetadataProperty(prop) {
            try {
                return typescript_1.default
                    .transform(prop, [ctx => this.importRewriterFactory.create(ctx, this.newSourceFile)])
                    .transformed[0];
            }
            catch (e) {
                // If the error is for an unresolved identifier, we want to return "null" because
                // such object literal elements could be added to the non-copyable properties.
                if (e instanceof import_rewrite_visitor_1.UnresolvedIdentifierError) {
                    return null;
                }
                throw e;
            }
        }
    }
    exports.DecoratorRewriter = DecoratorRewriter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9yX3Jld3JpdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL2RlY29yYXRvcl9yZXdyaXRlL2RlY29yYXRvcl9yZXdyaXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7SUFTQSw0REFBNEI7SUFJNUIsbUZBQXFFO0lBRXJFLHFKQUFvRztJQUdwRzs7Ozs7T0FLRztJQUNILE1BQWEsaUJBQWlCO1FBVTVCLFlBQ1ksYUFBNEIsRUFBVSxXQUEyQixFQUNqRSxRQUFxQjtZQURyQixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUFVLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUNqRSxhQUFRLEdBQVIsUUFBUSxDQUFhO1lBWGpDLHVCQUFrQixHQUF1QixJQUFJLENBQUM7WUFDOUMsa0JBQWEsR0FBdUIsSUFBSSxDQUFDO1lBRXpDLGtCQUFhLEdBQWtDLEVBQUUsQ0FBQztZQUNsRCwwQkFBcUIsR0FBa0MsRUFBRSxDQUFDO1lBRWxELDBCQUFxQixHQUFHLElBQUksd0RBQStCLENBQy9ELElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFJOUIsQ0FBQztRQUVyQyxPQUFPLENBQUMsV0FBd0IsRUFBRSxhQUE0QjtZQUM1RCxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDO1lBRW5DLHNEQUFzRDtZQUN0RCxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMscUJBQXFCLEdBQUcsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxT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RjtZQUNsRixPQUFPLG9CQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRDs7O1dBR0c7UUFDSyx5QkFBeUIsQ0FBQyxJQUFpQztZQUVqRSxJQUFJO2dCQUNGLE9BQU8sb0JBQUU7cUJBQ0osU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLGFBQWMsQ0FBQyxDQUFDLENBQUM7cUJBQ3JGLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNyQjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLGlGQUFpRjtnQkFDakYsOEVBQThFO2dCQUM5RSxJQUFJLENBQUMsWUFBWSxrREFBeUIsRUFBRTtvQkFDMUMsT0FBTyxJQUFJLENBQUM7aUJBQ2I7Z0JBQ0QsTUFBTSxDQUFDLENBQUM7YUFDVDtRQUNILENBQUM7S0FDRjtJQTlHRCw4Q0E4R0MiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHR5cGUge0FvdENvbXBpbGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0TWFuYWdlcn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvaW1wb3J0X21hbmFnZXInO1xuaW1wb3J0IHtOZ0RlY29yYXRvcn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge3Vud3JhcEV4cHJlc3Npb259IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcblxuaW1wb3J0IHtJbXBvcnRSZXdyaXRlVHJhbnNmb3JtZXJGYWN0b3J5LCBVbnJlc29sdmVkSWRlbnRpZmllckVycm9yfSBmcm9tICcuL2ltcG9ydF9yZXdyaXRlX3Zpc2l0b3InO1xuXG5cbi8qKlxuICogQ2xhc3MgdGhhdCBjYW4gYmUgdXNlZCB0byBjb3B5IGRlY29yYXRvcnMgdG8gYSBuZXcgbG9jYXRpb24uIFRoZSByZXdyaXRlciBlbnN1cmVzIHRoYXRcbiAqIGlkZW50aWZpZXJzIGFuZCBpbXBvcnRzIGFyZSByZXdyaXR0ZW4gdG8gd29yayBpbiB0aGUgbmV3IGZpbGUgbG9jYXRpb24uIEZpZWxkcyBpbiBhXG4gKiBkZWNvcmF0b3IgdGhhdCBjYW5ub3QgYmUgY2xlYW5seSBjb3BpZWQgd2lsbCBiZSBjb3BpZWQgd2l0aCBhIGNvbW1lbnQgZXhwbGFpbmluZyB0aGF0XG4gKiBpbXBvcnRzIGFuZCBpZGVudGlmaWVycyBuZWVkIHRvIGJlIGFkanVzdGVkIG1hbnVhbGx5LlxuICovXG5leHBvcnQgY2xhc3MgRGVjb3JhdG9yUmV3cml0ZXIge1xuICBwcmV2aW91c1NvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGV8bnVsbCA9IG51bGw7XG4gIG5ld1NvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGV8bnVsbCA9IG51bGw7XG5cbiAgbmV3UHJvcGVydGllczogdHMuT2JqZWN0TGl0ZXJhbEVsZW1lbnRMaWtlW10gPSBbXTtcbiAgbm9uQ29weWFibGVQcm9wZXJ0aWVzOiB0cy5PYmplY3RMaXRlcmFsRWxlbWVudExpa2VbXSA9IFtdO1xuXG4gIHByaXZhdGUgaW1wb3J0UmV3cml0ZXJGYWN0b3J5ID0gbmV3IEltcG9ydFJld3JpdGVUcmFuc2Zvcm1lckZhY3RvcnkoXG4gICAgICB0aGlzLmltcG9ydE1hbmFnZXIsIHRoaXMudHlwZUNoZWNrZXIsIHRoaXMuY29tcGlsZXJbJ19ob3N0J10pO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBpbXBvcnRNYW5hZ2VyOiBJbXBvcnRNYW5hZ2VyLCBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICAgIHByaXZhdGUgY29tcGlsZXI6IEFvdENvbXBpbGVyKSB7fVxuXG4gIHJld3JpdGUobmdEZWNvcmF0b3I6IE5nRGVjb3JhdG9yLCBuZXdTb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuRGVjb3JhdG9yIHtcbiAgICBjb25zdCBkZWNvcmF0b3IgPSBuZ0RlY29yYXRvci5ub2RlO1xuXG4gICAgLy8gUmVzZXQgdGhlIHByZXZpb3VzIHN0YXRlIG9mIHRoZSBkZWNvcmF0b3IgcmV3cml0ZXIuXG4gICAgdGhpcy5uZXdQcm9wZXJ0aWVzID0gW107XG4gICAgdGhpcy5ub25Db3B5YWJsZVByb3BlcnRpZXMgPSBbXTtcbiAgICB0aGlzLm5ld1NvdXJjZUZpbGUgPSBuZXdTb3VyY2VGaWxlO1xuICAgIHRoaXMucHJldmlvdXNTb3VyY2VGaWxlID0gZGVjb3JhdG9yLmdldFNvdXJjZUZpbGUoKTtcblxuICAgIC8vIElmIHRoZSBkZWNvcmF0b3Igd2lsbCBiZSBhZGRlZCB0byB0aGUgc2FtZSBzb3VyY2UgZmlsZSBpdCBjdXJyZW50bHlcbiAgICAvLyBleGlzdHMgaW4sIHdlIGRvbid0IG5lZWQgdG8gcmV3cml0ZSBhbnkgcGF0aHMgb3IgYWRkIG5ldyBpbXBvcnRzLlxuICAgIGlmICh0aGlzLnByZXZpb3VzU291cmNlRmlsZSA9PT0gbmV3U291cmNlRmlsZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZURlY29yYXRvcihkZWNvcmF0b3IuZXhwcmVzc2lvbik7XG4gICAgfVxuXG4gICAgY29uc3Qgb2xkQ2FsbEV4cHIgPSBkZWNvcmF0b3IuZXhwcmVzc2lvbjtcblxuICAgIGlmICghb2xkQ2FsbEV4cHIuYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gUmUtdXNlIHRoZSBvcmlnaW5hbCBkZWNvcmF0b3IgaWYgdGhlcmUgYXJlIG5vIGFyZ3VtZW50cyBhbmQgbm90aGluZyBuZWVkc1xuICAgICAgLy8gdG8gYmUgc2FuaXRpemVkIG9yIHJld3JpdHRlbi5cbiAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVEZWNvcmF0b3IoZGVjb3JhdG9yLmV4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIGNvbnN0IG1ldGFkYXRhID0gdW53cmFwRXhwcmVzc2lvbihvbGRDYWxsRXhwci5hcmd1bWVudHNbMF0pO1xuICAgIGlmICghdHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihtZXRhZGF0YSkpIHtcbiAgICAgIC8vIFJlLXVzZSB0aGUgb3JpZ2luYWwgZGVjb3JhdG9yIGFzIHRoZXJlIGlzIG5vIG1ldGFkYXRhIHRoYXQgY2FuIGJlIHNhbml0aXplZC5cbiAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVEZWNvcmF0b3IoZGVjb3JhdG9yLmV4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIG1ldGFkYXRhLnByb3BlcnRpZXMuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIC8vIFdlIGRvbid0IGhhbmRsZSBzcHJlYWQgYXNzaWdubWVudHMsIGFjY2Vzc29ycyBvciBtZXRob2QgZGVjbGFyYXRpb25zIGF1dG9tYXRpY2FsbHlcbiAgICAgIC8vIGFzIGl0IGludm9sdmVzIG1vcmUgYWR2YW5jZWQgc3RhdGljIGFuYWx5c2lzIGFuZCB0aGVzZSB0eXBlIG9mIHByb3BlcnRpZXMgYXJlIG5vdFxuICAgICAgLy8gcGlja2VkIHVwIGJ5IG5nYyBlaXRoZXIuXG4gICAgICBpZiAodHMuaXNTcHJlYWRBc3NpZ25tZW50KHByb3ApIHx8IHRzLmlzQWNjZXNzb3IocHJvcCkgfHwgdHMuaXNNZXRob2REZWNsYXJhdGlvbihwcm9wKSkge1xuICAgICAgICB0aGlzLm5vbkNvcHlhYmxlUHJvcGVydGllcy5wdXNoKHByb3ApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNhbml0aXplZFByb3AgPSB0aGlzLl9zYW5pdGl6ZU1ldGFkYXRhUHJvcGVydHkocHJvcCk7XG4gICAgICBpZiAoc2FuaXRpemVkUHJvcCAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLm5ld1Byb3BlcnRpZXMucHVzaChzYW5pdGl6ZWRQcm9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubm9uQ29weWFibGVQcm9wZXJ0aWVzLnB1c2gocHJvcCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBub24tY29weWFibGUgcHJvcGVydHksIHdlIGFkZCBhIGxlYWRpbmcgY29tbWVudCB0b1xuICAgIC8vIHRoZSBmaXJzdCBwcm9wZXJ0eSBhc3NpZ25tZW50IGluIG9yZGVyIHRvIGFzayB0aGUgZGV2ZWxvcGVyIHRvIG1hbnVhbGx5IG1hbmFnZVxuICAgIC8vIGltcG9ydHMgYW5kIGRvIHBhdGggcmV3cml0aW5nIGZvciB0aGVzZSBwcm9wZXJ0aWVzLlxuICAgIGlmICh0aGlzLm5vbkNvcHlhYmxlUHJvcGVydGllcy5sZW5ndGggIT09IDApIHtcbiAgICAgIFsnVGhlIGZvbGxvd2luZyBmaWVsZHMgd2VyZSBjb3BpZWQgZnJvbSB0aGUgYmFzZSBjbGFzcywnLFxuICAgICAgICdidXQgY291bGQgbm90IGJlIHVwZGF0ZWQgYXV0b21hdGljYWxseSB0byB3b3JrIGluIHRoZScsXG4gICAgICAgJ25ldyBmaWxlIGxvY2F0aW9uLiBQbGVhc2UgYWRkIGFueSByZXF1aXJlZCBpbXBvcnRzIGZvcicsICd0aGUgcHJvcGVydGllcyBiZWxvdzonXVxuICAgICAgICAgIC5mb3JFYWNoKFxuICAgICAgICAgICAgICB0ZXh0ID0+IHRzLmFkZFN5bnRoZXRpY0xlYWRpbmdDb21tZW50KFxuICAgICAgICAgICAgICAgICAgdGhpcy5ub25Db3B5YWJsZVByb3BlcnRpZXNbMF0sIHRzLlN5bnRheEtpbmQuU2luZ2xlTGluZUNvbW1lbnRUcml2aWEsIGAgJHt0ZXh0fWAsXG4gICAgICAgICAgICAgICAgICB0cnVlKSk7XG4gICAgfVxuXG4gICAgLy8gTm90ZSB0aGF0IHdlIGRvbid0IHVwZGF0ZSB0aGUgZGVjb3JhdG9yIGFzIHdlIGRvbid0IHdhbnQgdG8gY29weSBwb3RlbnRpYWwgbGVhZGluZ1xuICAgIC8vIGNvbW1lbnRzIG9mIHRoZSBkZWNvcmF0b3IuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugb3RoZXJ3aXNlIGNvbW1lbnRzIGZyb20gdGhlXG4gICAgLy8gY29waWVkIGRlY29yYXRvciBlbmQgdXAgZGVzY3JpYmluZyB0aGUgbmV3IGNsYXNzICh3aGljaCBpcyBub3QgYWx3YXlzIGNvcnJlY3QpLlxuICAgIHJldHVybiB0aGlzLl9jcmVhdGVEZWNvcmF0b3IodHMuY3JlYXRlQ2FsbChcbiAgICAgICAgdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShcbiAgICAgICAgICAgIG5ld1NvdXJjZUZpbGUsIG5nRGVjb3JhdG9yLm5hbWUsIG5nRGVjb3JhdG9yLm1vZHVsZU5hbWUpLFxuICAgICAgICB1bmRlZmluZWQsIFt0cy51cGRhdGVPYmplY3RMaXRlcmFsKFxuICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YSwgWy4uLnRoaXMubmV3UHJvcGVydGllcywgLi4udGhpcy5ub25Db3B5YWJsZVByb3BlcnRpZXNdKV0pKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGVzIGEgbmV3IGRlY29yYXRvciB3aXRoIHRoZSBnaXZlbiBleHByZXNzaW9uLiAqL1xuICBwcml2YXRlIF9jcmVhdGVEZWNvcmF0b3IoZXhwcjogdHMuRXhwcmVzc2lvbik6IHRzLkRlY29yYXRvciB7XG4gICAgLy8gTm90ZSB0aGF0IHdlIGRvbid0IHVwZGF0ZSB0aGUgZGVjb3JhdG9yIGFzIHdlIGRvbid0IHdhbnQgdG8gY29weSBwb3RlbnRpYWwgbGVhZGluZ1xuICAgIC8vIGNvbW1lbnRzIG9mIHRoZSBkZWNvcmF0b3IuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugb3RoZXJ3aXNlIGNvbW1lbnRzIGZyb20gdGhlXG4gICAgLy8gY29waWVkIGRlY29yYXRvciBlbmQgdXAgZGVzY3JpYmluZyB0aGUgbmV3IGNsYXNzICh3aGljaCBpcyBub3QgYWx3YXlzIGNvcnJlY3QpLlxuICAgIHJldHVybiB0cy5jcmVhdGVEZWNvcmF0b3IoZXhwcik7XG4gIH1cblxuICAvKipcbiAgICogU2FuaXRpemVzIGEgbWV0YWRhdGEgcHJvcGVydHkgYnkgZW5zdXJpbmcgdGhhdCBhbGwgY29udGFpbmVkIGlkZW50aWZpZXJzXG4gICAqIGFyZSBpbXBvcnRlZCBpbiB0aGUgdGFyZ2V0IHNvdXJjZSBmaWxlLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2FuaXRpemVNZXRhZGF0YVByb3BlcnR5KHByb3A6IHRzLk9iamVjdExpdGVyYWxFbGVtZW50TGlrZSk6IHRzLk9iamVjdExpdGVyYWxFbGVtZW50TGlrZVxuICAgICAgfG51bGwge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdHNcbiAgICAgICAgICAudHJhbnNmb3JtKHByb3AsIFtjdHggPT4gdGhpcy5pbXBvcnRSZXdyaXRlckZhY3RvcnkuY3JlYXRlKGN0eCwgdGhpcy5uZXdTb3VyY2VGaWxlISldKVxuICAgICAgICAgIC50cmFuc2Zvcm1lZFswXTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBJZiB0aGUgZXJyb3IgaXMgZm9yIGFuIHVucmVzb2x2ZWQgaWRlbnRpZmllciwgd2Ugd2FudCB0byByZXR1cm4gXCJudWxsXCIgYmVjYXVzZVxuICAgICAgLy8gc3VjaCBvYmplY3QgbGl0ZXJhbCBlbGVtZW50cyBjb3VsZCBiZSBhZGRlZCB0byB0aGUgbm9uLWNvcHlhYmxlIHByb3BlcnRpZXMuXG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIFVucmVzb2x2ZWRJZGVudGlmaWVyRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxufVxuIl19