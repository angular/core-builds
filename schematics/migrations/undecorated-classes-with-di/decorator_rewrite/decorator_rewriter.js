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
    const ts = require("typescript");
    const functions_1 = require("@angular/core/schematics/utils/typescript/functions");
    const import_rewrite_visitor_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/import_rewrite_visitor");
    /**
     * Class that can be used to copy decorators to a new location. The rewriter ensures that
     * identifiers and imports are rewritten to work in the new file location. Fields in a
     * decorator that cannot be cleanly copied will be copied with a comment explaining that
     * imports and identifiers need to be adjusted manually.
     */
    class DecoratorRewriter {
        constructor(importManager, typeChecker, evaluator, compiler) {
            this.importManager = importManager;
            this.typeChecker = typeChecker;
            this.evaluator = evaluator;
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
            if (!ts.isObjectLiteralExpression(metadata)) {
                // Re-use the original decorator as there is no metadata that can be sanitized.
                return this._createDecorator(decorator.expression);
            }
            metadata.properties.forEach(prop => {
                // We don't handle spread assignments, accessors or method declarations automatically
                // as it involves more advanced static analysis and these type of properties are not
                // picked up by ngc either.
                if (ts.isSpreadAssignment(prop) || ts.isAccessor(prop) || ts.isMethodDeclaration(prop)) {
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
                    .forEach(text => ts.addSyntheticLeadingComment(this.nonCopyableProperties[0], ts.SyntaxKind.SingleLineCommentTrivia, ` ${text}`, true));
            }
            // Note that we don't update the decorator as we don't want to copy potential leading
            // comments of the decorator. This is necessary because otherwise comments from the
            // copied decorator end up describing the new class (which is not always correct).
            return this._createDecorator(ts.createCall(this.importManager.addImportToSourceFile(newSourceFile, ngDecorator.name, ngDecorator.moduleName), undefined, [ts.updateObjectLiteral(metadata, [...this.newProperties, ...this.nonCopyableProperties])]));
        }
        /** Creates a new decorator with the given expression. */
        _createDecorator(expr) {
            // Note that we don't update the decorator as we don't want to copy potential leading
            // comments of the decorator. This is necessary because otherwise comments from the
            // copied decorator end up describing the new class (which is not always correct).
            return ts.createDecorator(expr);
        }
        /**
         * Sanitizes a metadata property by ensuring that all contained identifiers
         * are imported in the target source file.
         */
        _sanitizeMetadataProperty(prop) {
            try {
                return ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9yX3Jld3JpdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL21pZ3JhdGlvbnMvdW5kZWNvcmF0ZWQtY2xhc3Nlcy13aXRoLWRpL2RlY29yYXRvcl9yZXdyaXRlL2RlY29yYXRvcl9yZXdyaXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7SUFVQSxpQ0FBaUM7SUFJakMsbUZBQXFFO0lBRXJFLHFKQUFvRztJQUdwRzs7Ozs7T0FLRztJQUNILE1BQWEsaUJBQWlCO1FBVTVCLFlBQ1ksYUFBNEIsRUFBVSxXQUEyQixFQUNqRSxTQUEyQixFQUFVLFFBQXFCO1lBRDFELGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1lBQ2pFLGNBQVMsR0FBVCxTQUFTLENBQWtCO1lBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBYTtZQVh0RSx1QkFBa0IsR0FBdUIsSUFBSSxDQUFDO1lBQzlDLGtCQUFhLEdBQXVCLElBQUksQ0FBQztZQUV6QyxrQkFBYSxHQUFrQyxFQUFFLENBQUM7WUFDbEQsMEJBQXFCLEdBQWtDLEVBQUUsQ0FBQztZQUVsRCwwQkFBcUIsR0FBRyxJQUFJLHdEQUErQixDQUMvRCxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBSU8sQ0FBQztRQUUxRSxPQUFPLENBQUMsV0FBd0IsRUFBRSxhQUE0QjtZQUM1RCxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDO1lBRW5DLHNEQUFzRDtZQUN0RCxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMscUJBQXFCLEdBQUcsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxD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O1lBQ3JGLG1GQUFtRjtZQUNuRixrRkFBa0Y7WUFDbEYsT0FBTyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRDs7O1dBR0c7UUFDSyx5QkFBeUIsQ0FBQyxJQUFpQztZQUVqRSxJQUFJO2dCQUNGLE9BQU8sRUFBRTtxQkFDSixTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsYUFBYyxDQUFDLENBQUMsQ0FBQztxQkFDckYsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3JCO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsaUZBQWlGO2dCQUNqRiw4RUFBOEU7Z0JBQzlFLElBQUksQ0FBQyxZQUFZLGtEQUF5QixFQUFFO29CQUMxQyxPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFDRCxNQUFNLENBQUMsQ0FBQzthQUNUO1FBQ0gsQ0FBQztLQUNGO0lBOUdELDhDQThHQyIsInNvdXJjZXNDb250ZW50IjpbIlxuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0FvdENvbXBpbGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge1BhcnRpYWxFdmFsdWF0b3J9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvcGFydGlhbF9ldmFsdWF0b3InO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7SW1wb3J0TWFuYWdlcn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvaW1wb3J0X21hbmFnZXInO1xuaW1wb3J0IHtOZ0RlY29yYXRvcn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvbmdfZGVjb3JhdG9ycyc7XG5pbXBvcnQge3Vud3JhcEV4cHJlc3Npb259IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvZnVuY3Rpb25zJztcblxuaW1wb3J0IHtJbXBvcnRSZXdyaXRlVHJhbnNmb3JtZXJGYWN0b3J5LCBVbnJlc29sdmVkSWRlbnRpZmllckVycm9yfSBmcm9tICcuL2ltcG9ydF9yZXdyaXRlX3Zpc2l0b3InO1xuXG5cbi8qKlxuICogQ2xhc3MgdGhhdCBjYW4gYmUgdXNlZCB0byBjb3B5IGRlY29yYXRvcnMgdG8gYSBuZXcgbG9jYXRpb24uIFRoZSByZXdyaXRlciBlbnN1cmVzIHRoYXRcbiAqIGlkZW50aWZpZXJzIGFuZCBpbXBvcnRzIGFyZSByZXdyaXR0ZW4gdG8gd29yayBpbiB0aGUgbmV3IGZpbGUgbG9jYXRpb24uIEZpZWxkcyBpbiBhXG4gKiBkZWNvcmF0b3IgdGhhdCBjYW5ub3QgYmUgY2xlYW5seSBjb3BpZWQgd2lsbCBiZSBjb3BpZWQgd2l0aCBhIGNvbW1lbnQgZXhwbGFpbmluZyB0aGF0XG4gKiBpbXBvcnRzIGFuZCBpZGVudGlmaWVycyBuZWVkIHRvIGJlIGFkanVzdGVkIG1hbnVhbGx5LlxuICovXG5leHBvcnQgY2xhc3MgRGVjb3JhdG9yUmV3cml0ZXIge1xuICBwcmV2aW91c1NvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGV8bnVsbCA9IG51bGw7XG4gIG5ld1NvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGV8bnVsbCA9IG51bGw7XG5cbiAgbmV3UHJvcGVydGllczogdHMuT2JqZWN0TGl0ZXJhbEVsZW1lbnRMaWtlW10gPSBbXTtcbiAgbm9uQ29weWFibGVQcm9wZXJ0aWVzOiB0cy5PYmplY3RMaXRlcmFsRWxlbWVudExpa2VbXSA9IFtdO1xuXG4gIHByaXZhdGUgaW1wb3J0UmV3cml0ZXJGYWN0b3J5ID0gbmV3IEltcG9ydFJld3JpdGVUcmFuc2Zvcm1lckZhY3RvcnkoXG4gICAgICB0aGlzLmltcG9ydE1hbmFnZXIsIHRoaXMudHlwZUNoZWNrZXIsIHRoaXMuY29tcGlsZXJbJ19ob3N0J10pO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBpbXBvcnRNYW5hZ2VyOiBJbXBvcnRNYW5hZ2VyLCBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICAgIHByaXZhdGUgZXZhbHVhdG9yOiBQYXJ0aWFsRXZhbHVhdG9yLCBwcml2YXRlIGNvbXBpbGVyOiBBb3RDb21waWxlcikge31cblxuICByZXdyaXRlKG5nRGVjb3JhdG9yOiBOZ0RlY29yYXRvciwgbmV3U291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IHRzLkRlY29yYXRvciB7XG4gICAgY29uc3QgZGVjb3JhdG9yID0gbmdEZWNvcmF0b3Iubm9kZTtcblxuICAgIC8vIFJlc2V0IHRoZSBwcmV2aW91cyBzdGF0ZSBvZiB0aGUgZGVjb3JhdG9yIHJld3JpdGVyLlxuICAgIHRoaXMubmV3UHJvcGVydGllcyA9IFtdO1xuICAgIHRoaXMubm9uQ29weWFibGVQcm9wZXJ0aWVzID0gW107XG4gICAgdGhpcy5uZXdTb3VyY2VGaWxlID0gbmV3U291cmNlRmlsZTtcbiAgICB0aGlzLnByZXZpb3VzU291cmNlRmlsZSA9IGRlY29yYXRvci5nZXRTb3VyY2VGaWxlKCk7XG5cbiAgICAvLyBJZiB0aGUgZGVjb3JhdG9yIHdpbGwgYmUgYWRkZWQgdG8gdGhlIHNhbWUgc291cmNlIGZpbGUgaXQgY3VycmVudGx5XG4gICAgLy8gZXhpc3RzIGluLCB3ZSBkb24ndCBuZWVkIHRvIHJld3JpdGUgYW55IHBhdGhzIG9yIGFkZCBuZXcgaW1wb3J0cy5cbiAgICBpZiAodGhpcy5wcmV2aW91c1NvdXJjZUZpbGUgPT09IG5ld1NvdXJjZUZpbGUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVEZWNvcmF0b3IoZGVjb3JhdG9yLmV4cHJlc3Npb24pO1xuICAgIH1cblxuICAgIGNvbnN0IG9sZENhbGxFeHByID0gZGVjb3JhdG9yLmV4cHJlc3Npb247XG5cbiAgICBpZiAoIW9sZENhbGxFeHByLmFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIFJlLXVzZSB0aGUgb3JpZ2luYWwgZGVjb3JhdG9yIGlmIHRoZXJlIGFyZSBubyBhcmd1bWVudHMgYW5kIG5vdGhpbmcgbmVlZHNcbiAgICAgIC8vIHRvIGJlIHNhbml0aXplZCBvciByZXdyaXR0ZW4uXG4gICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRGVjb3JhdG9yKGRlY29yYXRvci5leHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCBtZXRhZGF0YSA9IHVud3JhcEV4cHJlc3Npb24ob2xkQ2FsbEV4cHIuYXJndW1lbnRzWzBdKTtcbiAgICBpZiAoIXRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obWV0YWRhdGEpKSB7XG4gICAgICAvLyBSZS11c2UgdGhlIG9yaWdpbmFsIGRlY29yYXRvciBhcyB0aGVyZSBpcyBubyBtZXRhZGF0YSB0aGF0IGNhbiBiZSBzYW5pdGl6ZWQuXG4gICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRGVjb3JhdG9yKGRlY29yYXRvci5leHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICBtZXRhZGF0YS5wcm9wZXJ0aWVzLmZvckVhY2gocHJvcCA9PiB7XG4gICAgICAvLyBXZSBkb24ndCBoYW5kbGUgc3ByZWFkIGFzc2lnbm1lbnRzLCBhY2Nlc3NvcnMgb3IgbWV0aG9kIGRlY2xhcmF0aW9ucyBhdXRvbWF0aWNhbGx5XG4gICAgICAvLyBhcyBpdCBpbnZvbHZlcyBtb3JlIGFkdmFuY2VkIHN0YXRpYyBhbmFseXNpcyBhbmQgdGhlc2UgdHlwZSBvZiBwcm9wZXJ0aWVzIGFyZSBub3RcbiAgICAgIC8vIHBpY2tlZCB1cCBieSBuZ2MgZWl0aGVyLlxuICAgICAgaWYgKHRzLmlzU3ByZWFkQXNzaWdubWVudChwcm9wKSB8fCB0cy5pc0FjY2Vzc29yKHByb3ApIHx8IHRzLmlzTWV0aG9kRGVjbGFyYXRpb24ocHJvcCkpIHtcbiAgICAgICAgdGhpcy5ub25Db3B5YWJsZVByb3BlcnRpZXMucHVzaChwcm9wKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzYW5pdGl6ZWRQcm9wID0gdGhpcy5fc2FuaXRpemVNZXRhZGF0YVByb3BlcnR5KHByb3ApO1xuICAgICAgaWYgKHNhbml0aXplZFByb3AgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5uZXdQcm9wZXJ0aWVzLnB1c2goc2FuaXRpemVkUHJvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm5vbkNvcHlhYmxlUHJvcGVydGllcy5wdXNoKHByb3ApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBhdCBsZWFzdCBvbmUgbm9uLWNvcHlhYmxlIHByb3BlcnR5LCB3ZSBhZGQgYSBsZWFkaW5nIGNvbW1lbnQgdG9cbiAgICAvLyB0aGUgZmlyc3QgcHJvcGVydHkgYXNzaWdubWVudCBpbiBvcmRlciB0byBhc2sgdGhlIGRldmVsb3BlciB0byBtYW51YWxseSBtYW5hZ2VcbiAgICAvLyBpbXBvcnRzIGFuZCBkbyBwYXRoIHJld3JpdGluZyBmb3IgdGhlc2UgcHJvcGVydGllcy5cbiAgICBpZiAodGhpcy5ub25Db3B5YWJsZVByb3BlcnRpZXMubGVuZ3RoICE9PSAwKSB7XG4gICAgICBbJ1RoZSBmb2xsb3dpbmcgZmllbGRzIHdlcmUgY29waWVkIGZyb20gdGhlIGJhc2UgY2xhc3MsJyxcbiAgICAgICAnYnV0IGNvdWxkIG5vdCBiZSB1cGRhdGVkIGF1dG9tYXRpY2FsbHkgdG8gd29yayBpbiB0aGUnLFxuICAgICAgICduZXcgZmlsZSBsb2NhdGlvbi4gUGxlYXNlIGFkZCBhbnkgcmVxdWlyZWQgaW1wb3J0cyBmb3InLCAndGhlIHByb3BlcnRpZXMgYmVsb3c6J11cbiAgICAgICAgICAuZm9yRWFjaChcbiAgICAgICAgICAgICAgdGV4dCA9PiB0cy5hZGRTeW50aGV0aWNMZWFkaW5nQ29tbWVudChcbiAgICAgICAgICAgICAgICAgIHRoaXMubm9uQ29weWFibGVQcm9wZXJ0aWVzWzBdLCB0cy5TeW50YXhLaW5kLlNpbmdsZUxpbmVDb21tZW50VHJpdmlhLCBgICR7dGV4dH1gLFxuICAgICAgICAgICAgICAgICAgdHJ1ZSkpO1xuICAgIH1cblxuICAgIC8vIE5vdGUgdGhhdCB3ZSBkb24ndCB1cGRhdGUgdGhlIGRlY29yYXRvciBhcyB3ZSBkb24ndCB3YW50IHRvIGNvcHkgcG90ZW50aWFsIGxlYWRpbmdcbiAgICAvLyBjb21tZW50cyBvZiB0aGUgZGVjb3JhdG9yLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIG90aGVyd2lzZSBjb21tZW50cyBmcm9tIHRoZVxuICAgIC8vIGNvcGllZCBkZWNvcmF0b3IgZW5kIHVwIGRlc2NyaWJpbmcgdGhlIG5ldyBjbGFzcyAod2hpY2ggaXMgbm90IGFsd2F5cyBjb3JyZWN0KS5cbiAgICByZXR1cm4gdGhpcy5fY3JlYXRlRGVjb3JhdG9yKHRzLmNyZWF0ZUNhbGwoXG4gICAgICAgIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoXG4gICAgICAgICAgICBuZXdTb3VyY2VGaWxlLCBuZ0RlY29yYXRvci5uYW1lLCBuZ0RlY29yYXRvci5tb2R1bGVOYW1lKSxcbiAgICAgICAgdW5kZWZpbmVkLCBbdHMudXBkYXRlT2JqZWN0TGl0ZXJhbChcbiAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGEsIFsuLi50aGlzLm5ld1Byb3BlcnRpZXMsIC4uLnRoaXMubm9uQ29weWFibGVQcm9wZXJ0aWVzXSldKSk7XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIG5ldyBkZWNvcmF0b3Igd2l0aCB0aGUgZ2l2ZW4gZXhwcmVzc2lvbi4gKi9cbiAgcHJpdmF0ZSBfY3JlYXRlRGVjb3JhdG9yKGV4cHI6IHRzLkV4cHJlc3Npb24pOiB0cy5EZWNvcmF0b3Ige1xuICAgIC8vIE5vdGUgdGhhdCB3ZSBkb24ndCB1cGRhdGUgdGhlIGRlY29yYXRvciBhcyB3ZSBkb24ndCB3YW50IHRvIGNvcHkgcG90ZW50aWFsIGxlYWRpbmdcbiAgICAvLyBjb21tZW50cyBvZiB0aGUgZGVjb3JhdG9yLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIG90aGVyd2lzZSBjb21tZW50cyBmcm9tIHRoZVxuICAgIC8vIGNvcGllZCBkZWNvcmF0b3IgZW5kIHVwIGRlc2NyaWJpbmcgdGhlIG5ldyBjbGFzcyAod2hpY2ggaXMgbm90IGFsd2F5cyBjb3JyZWN0KS5cbiAgICByZXR1cm4gdHMuY3JlYXRlRGVjb3JhdG9yKGV4cHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNhbml0aXplcyBhIG1ldGFkYXRhIHByb3BlcnR5IGJ5IGVuc3VyaW5nIHRoYXQgYWxsIGNvbnRhaW5lZCBpZGVudGlmaWVyc1xuICAgKiBhcmUgaW1wb3J0ZWQgaW4gdGhlIHRhcmdldCBzb3VyY2UgZmlsZS5cbiAgICovXG4gIHByaXZhdGUgX3Nhbml0aXplTWV0YWRhdGFQcm9wZXJ0eShwcm9wOiB0cy5PYmplY3RMaXRlcmFsRWxlbWVudExpa2UpOiB0cy5PYmplY3RMaXRlcmFsRWxlbWVudExpa2VcbiAgICAgIHxudWxsIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRzXG4gICAgICAgICAgLnRyYW5zZm9ybShwcm9wLCBbY3R4ID0+IHRoaXMuaW1wb3J0UmV3cml0ZXJGYWN0b3J5LmNyZWF0ZShjdHgsIHRoaXMubmV3U291cmNlRmlsZSEpXSlcbiAgICAgICAgICAudHJhbnNmb3JtZWRbMF07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gSWYgdGhlIGVycm9yIGlzIGZvciBhbiB1bnJlc29sdmVkIGlkZW50aWZpZXIsIHdlIHdhbnQgdG8gcmV0dXJuIFwibnVsbFwiIGJlY2F1c2VcbiAgICAgIC8vIHN1Y2ggb2JqZWN0IGxpdGVyYWwgZWxlbWVudHMgY291bGQgYmUgYWRkZWQgdG8gdGhlIG5vbi1jb3B5YWJsZSBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBVbnJlc29sdmVkSWRlbnRpZmllckVycm9yKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==