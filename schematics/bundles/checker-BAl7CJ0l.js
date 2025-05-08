'use strict';
/**
 * @license Angular v20.0.0-rc.0+sha-3076117
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var compiler = require('./compiler-BSv6JWRF.js');
var ts = require('typescript');
require('os');
var fs$1 = require('fs');
var module$1 = require('module');
var p = require('path');
var url = require('url');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var p__namespace = /*#__PURE__*/_interopNamespaceDefault(p);

/**
 * @publicApi
 */
exports.ErrorCode = void 0;
(function (ErrorCode) {
    ErrorCode[ErrorCode["DECORATOR_ARG_NOT_LITERAL"] = 1001] = "DECORATOR_ARG_NOT_LITERAL";
    ErrorCode[ErrorCode["DECORATOR_ARITY_WRONG"] = 1002] = "DECORATOR_ARITY_WRONG";
    ErrorCode[ErrorCode["DECORATOR_NOT_CALLED"] = 1003] = "DECORATOR_NOT_CALLED";
    ErrorCode[ErrorCode["DECORATOR_UNEXPECTED"] = 1005] = "DECORATOR_UNEXPECTED";
    /**
     * This error code indicates that there are incompatible decorators on a type or a class field.
     */
    ErrorCode[ErrorCode["DECORATOR_COLLISION"] = 1006] = "DECORATOR_COLLISION";
    ErrorCode[ErrorCode["VALUE_HAS_WRONG_TYPE"] = 1010] = "VALUE_HAS_WRONG_TYPE";
    ErrorCode[ErrorCode["VALUE_NOT_LITERAL"] = 1011] = "VALUE_NOT_LITERAL";
    ErrorCode[ErrorCode["DUPLICATE_DECORATED_PROPERTIES"] = 1012] = "DUPLICATE_DECORATED_PROPERTIES";
    /**
     * Raised when an initializer API is annotated with an unexpected decorator.
     *
     * e.g. `@Input` is also applied on the class member using `input`.
     */
    ErrorCode[ErrorCode["INITIALIZER_API_WITH_DISALLOWED_DECORATOR"] = 1050] = "INITIALIZER_API_WITH_DISALLOWED_DECORATOR";
    /**
     * Raised when an initializer API feature (like signal inputs) are also
     * declared in the class decorator metadata.
     *
     * e.g. a signal input is also declared in the `@Directive` `inputs` array.
     */
    ErrorCode[ErrorCode["INITIALIZER_API_DECORATOR_METADATA_COLLISION"] = 1051] = "INITIALIZER_API_DECORATOR_METADATA_COLLISION";
    /**
     * Raised whenever an initializer API does not support the `.required`
     * function, but is still detected unexpectedly.
     */
    ErrorCode[ErrorCode["INITIALIZER_API_NO_REQUIRED_FUNCTION"] = 1052] = "INITIALIZER_API_NO_REQUIRED_FUNCTION";
    /**
     * Raised whenever an initializer API is used on a class member
     * and the given access modifiers (e.g. `private`) are not allowed.
     */
    ErrorCode[ErrorCode["INITIALIZER_API_DISALLOWED_MEMBER_VISIBILITY"] = 1053] = "INITIALIZER_API_DISALLOWED_MEMBER_VISIBILITY";
    /**
     * An Angular feature, like inputs, outputs or queries is incorrectly
     * declared on a static member.
     */
    ErrorCode[ErrorCode["INCORRECTLY_DECLARED_ON_STATIC_MEMBER"] = 1100] = "INCORRECTLY_DECLARED_ON_STATIC_MEMBER";
    ErrorCode[ErrorCode["COMPONENT_MISSING_TEMPLATE"] = 2001] = "COMPONENT_MISSING_TEMPLATE";
    ErrorCode[ErrorCode["PIPE_MISSING_NAME"] = 2002] = "PIPE_MISSING_NAME";
    ErrorCode[ErrorCode["PARAM_MISSING_TOKEN"] = 2003] = "PARAM_MISSING_TOKEN";
    ErrorCode[ErrorCode["DIRECTIVE_MISSING_SELECTOR"] = 2004] = "DIRECTIVE_MISSING_SELECTOR";
    /** Raised when an undecorated class is passed in as a provider to a module or a directive. */
    ErrorCode[ErrorCode["UNDECORATED_PROVIDER"] = 2005] = "UNDECORATED_PROVIDER";
    /**
     * Raised when a Directive inherits its constructor from a base class without an Angular
     * decorator.
     */
    ErrorCode[ErrorCode["DIRECTIVE_INHERITS_UNDECORATED_CTOR"] = 2006] = "DIRECTIVE_INHERITS_UNDECORATED_CTOR";
    /**
     * Raised when an undecorated class that is using Angular features
     * has been discovered.
     */
    ErrorCode[ErrorCode["UNDECORATED_CLASS_USING_ANGULAR_FEATURES"] = 2007] = "UNDECORATED_CLASS_USING_ANGULAR_FEATURES";
    /**
     * Raised when an component cannot resolve an external resource, such as a template or a style
     * sheet.
     */
    ErrorCode[ErrorCode["COMPONENT_RESOURCE_NOT_FOUND"] = 2008] = "COMPONENT_RESOURCE_NOT_FOUND";
    /**
     * Raised when a component uses `ShadowDom` view encapsulation, but its selector
     * does not match the shadow DOM tag name requirements.
     */
    ErrorCode[ErrorCode["COMPONENT_INVALID_SHADOW_DOM_SELECTOR"] = 2009] = "COMPONENT_INVALID_SHADOW_DOM_SELECTOR";
    /**
     * Raised when a component has `imports` but is not marked as `standalone: true`.
     */
    ErrorCode[ErrorCode["COMPONENT_NOT_STANDALONE"] = 2010] = "COMPONENT_NOT_STANDALONE";
    /**
     * Raised when a type in the `imports` of a component is a directive or pipe, but is not
     * standalone.
     */
    ErrorCode[ErrorCode["COMPONENT_IMPORT_NOT_STANDALONE"] = 2011] = "COMPONENT_IMPORT_NOT_STANDALONE";
    /**
     * Raised when a type in the `imports` of a component is not a directive, pipe, or NgModule.
     */
    ErrorCode[ErrorCode["COMPONENT_UNKNOWN_IMPORT"] = 2012] = "COMPONENT_UNKNOWN_IMPORT";
    /**
     * Raised when the compiler wasn't able to resolve the metadata of a host directive.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_INVALID"] = 2013] = "HOST_DIRECTIVE_INVALID";
    /**
     * Raised when a host directive isn't standalone.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_NOT_STANDALONE"] = 2014] = "HOST_DIRECTIVE_NOT_STANDALONE";
    /**
     * Raised when a host directive is a component.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_COMPONENT"] = 2015] = "HOST_DIRECTIVE_COMPONENT";
    /**
     * Raised when a type with Angular decorator inherits its constructor from a base class
     * which has a constructor that is incompatible with Angular DI.
     */
    ErrorCode[ErrorCode["INJECTABLE_INHERITS_INVALID_CONSTRUCTOR"] = 2016] = "INJECTABLE_INHERITS_INVALID_CONSTRUCTOR";
    /** Raised when a host tries to alias a host directive binding that does not exist. */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_UNDEFINED_BINDING"] = 2017] = "HOST_DIRECTIVE_UNDEFINED_BINDING";
    /**
     * Raised when a host tries to alias a host directive
     * binding to a pre-existing binding's public name.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_CONFLICTING_ALIAS"] = 2018] = "HOST_DIRECTIVE_CONFLICTING_ALIAS";
    /**
     * Raised when a host directive definition doesn't expose a
     * required binding from the host directive.
     */
    ErrorCode[ErrorCode["HOST_DIRECTIVE_MISSING_REQUIRED_BINDING"] = 2019] = "HOST_DIRECTIVE_MISSING_REQUIRED_BINDING";
    /**
     * Raised when a component specifies both a `transform` function on an input
     * and has a corresponding `ngAcceptInputType_` member for the same input.
     */
    ErrorCode[ErrorCode["CONFLICTING_INPUT_TRANSFORM"] = 2020] = "CONFLICTING_INPUT_TRANSFORM";
    /** Raised when a component has both `styleUrls` and `styleUrl`. */
    ErrorCode[ErrorCode["COMPONENT_INVALID_STYLE_URLS"] = 2021] = "COMPONENT_INVALID_STYLE_URLS";
    /**
     * Raised when a type in the `deferredImports` of a component is not a component, directive or
     * pipe.
     */
    ErrorCode[ErrorCode["COMPONENT_UNKNOWN_DEFERRED_IMPORT"] = 2022] = "COMPONENT_UNKNOWN_DEFERRED_IMPORT";
    /**
     * Raised when a `standalone: false` component is declared but `strictStandalone` is set.
     */
    ErrorCode[ErrorCode["NON_STANDALONE_NOT_ALLOWED"] = 2023] = "NON_STANDALONE_NOT_ALLOWED";
    /**
     * Raised when a named template dependency isn't defined in the component's source file.
     */
    ErrorCode[ErrorCode["MISSING_NAMED_TEMPLATE_DEPENDENCY"] = 2024] = "MISSING_NAMED_TEMPLATE_DEPENDENCY";
    /**
     * Raised if an incorrect type is used for a named template dependency (e.g. directive
     * class used as a component).
     */
    ErrorCode[ErrorCode["INCORRECT_NAMED_TEMPLATE_DEPENDENCY_TYPE"] = 2025] = "INCORRECT_NAMED_TEMPLATE_DEPENDENCY_TYPE";
    ErrorCode[ErrorCode["SYMBOL_NOT_EXPORTED"] = 3001] = "SYMBOL_NOT_EXPORTED";
    /**
     * Raised when a relationship between directives and/or pipes would cause a cyclic import to be
     * created that cannot be handled, such as in partial compilation mode.
     */
    ErrorCode[ErrorCode["IMPORT_CYCLE_DETECTED"] = 3003] = "IMPORT_CYCLE_DETECTED";
    /**
     * Raised when the compiler is unable to generate an import statement for a reference.
     */
    ErrorCode[ErrorCode["IMPORT_GENERATION_FAILURE"] = 3004] = "IMPORT_GENERATION_FAILURE";
    ErrorCode[ErrorCode["CONFIG_FLAT_MODULE_NO_INDEX"] = 4001] = "CONFIG_FLAT_MODULE_NO_INDEX";
    ErrorCode[ErrorCode["CONFIG_STRICT_TEMPLATES_IMPLIES_FULL_TEMPLATE_TYPECHECK"] = 4002] = "CONFIG_STRICT_TEMPLATES_IMPLIES_FULL_TEMPLATE_TYPECHECK";
    ErrorCode[ErrorCode["CONFIG_EXTENDED_DIAGNOSTICS_IMPLIES_STRICT_TEMPLATES"] = 4003] = "CONFIG_EXTENDED_DIAGNOSTICS_IMPLIES_STRICT_TEMPLATES";
    ErrorCode[ErrorCode["CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CATEGORY_LABEL"] = 4004] = "CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CATEGORY_LABEL";
    ErrorCode[ErrorCode["CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CHECK"] = 4005] = "CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CHECK";
    /**
     * Raised when a host expression has a parse error, such as a host listener or host binding
     * expression containing a pipe.
     */
    ErrorCode[ErrorCode["HOST_BINDING_PARSE_ERROR"] = 5001] = "HOST_BINDING_PARSE_ERROR";
    /**
     * Raised when the compiler cannot parse a component's template.
     */
    ErrorCode[ErrorCode["TEMPLATE_PARSE_ERROR"] = 5002] = "TEMPLATE_PARSE_ERROR";
    /**
     * Raised when an NgModule contains an invalid reference in `declarations`.
     */
    ErrorCode[ErrorCode["NGMODULE_INVALID_DECLARATION"] = 6001] = "NGMODULE_INVALID_DECLARATION";
    /**
     * Raised when an NgModule contains an invalid type in `imports`.
     */
    ErrorCode[ErrorCode["NGMODULE_INVALID_IMPORT"] = 6002] = "NGMODULE_INVALID_IMPORT";
    /**
     * Raised when an NgModule contains an invalid type in `exports`.
     */
    ErrorCode[ErrorCode["NGMODULE_INVALID_EXPORT"] = 6003] = "NGMODULE_INVALID_EXPORT";
    /**
     * Raised when an NgModule contains a type in `exports` which is neither in `declarations` nor
     * otherwise imported.
     */
    ErrorCode[ErrorCode["NGMODULE_INVALID_REEXPORT"] = 6004] = "NGMODULE_INVALID_REEXPORT";
    /**
     * Raised when a `ModuleWithProviders` with a missing
     * generic type argument is passed into an `NgModule`.
     */
    ErrorCode[ErrorCode["NGMODULE_MODULE_WITH_PROVIDERS_MISSING_GENERIC"] = 6005] = "NGMODULE_MODULE_WITH_PROVIDERS_MISSING_GENERIC";
    /**
     * Raised when an NgModule exports multiple directives/pipes of the same name and the compiler
     * attempts to generate private re-exports within the NgModule file.
     */
    ErrorCode[ErrorCode["NGMODULE_REEXPORT_NAME_COLLISION"] = 6006] = "NGMODULE_REEXPORT_NAME_COLLISION";
    /**
     * Raised when a directive/pipe is part of the declarations of two or more NgModules.
     */
    ErrorCode[ErrorCode["NGMODULE_DECLARATION_NOT_UNIQUE"] = 6007] = "NGMODULE_DECLARATION_NOT_UNIQUE";
    /**
     * Raised when a standalone directive/pipe is part of the declarations of an NgModule.
     */
    ErrorCode[ErrorCode["NGMODULE_DECLARATION_IS_STANDALONE"] = 6008] = "NGMODULE_DECLARATION_IS_STANDALONE";
    /**
     * Raised when a standalone component is part of the bootstrap list of an NgModule.
     */
    ErrorCode[ErrorCode["NGMODULE_BOOTSTRAP_IS_STANDALONE"] = 6009] = "NGMODULE_BOOTSTRAP_IS_STANDALONE";
    /**
     * Indicates that an NgModule is declared with `id: module.id`. This is an anti-pattern that is
     * disabled explicitly in the compiler, that was originally based on a misunderstanding of
     * `NgModule.id`.
     */
    ErrorCode[ErrorCode["WARN_NGMODULE_ID_UNNECESSARY"] = 6100] = "WARN_NGMODULE_ID_UNNECESSARY";
    /**
     * 6999 was previously assigned to NGMODULE_VE_DEPENDENCY_ON_IVY_LIB
     * To prevent any confusion, let's not reassign it.
     */
    /**
     * An element name failed validation against the DOM schema.
     */
    ErrorCode[ErrorCode["SCHEMA_INVALID_ELEMENT"] = 8001] = "SCHEMA_INVALID_ELEMENT";
    /**
     * An element's attribute name failed validation against the DOM schema.
     */
    ErrorCode[ErrorCode["SCHEMA_INVALID_ATTRIBUTE"] = 8002] = "SCHEMA_INVALID_ATTRIBUTE";
    /**
     * No matching directive was found for a `#ref="target"` expression.
     */
    ErrorCode[ErrorCode["MISSING_REFERENCE_TARGET"] = 8003] = "MISSING_REFERENCE_TARGET";
    /**
     * No matching pipe was found for a
     */
    ErrorCode[ErrorCode["MISSING_PIPE"] = 8004] = "MISSING_PIPE";
    /**
     * The left-hand side of an assignment expression was a template variable. Effectively, the
     * template looked like:
     *
     * ```html
     * <ng-template let-something>
     *   <button (click)="something = ...">...</button>
     * </ng-template>
     * ```
     *
     * Template variables are read-only.
     */
    ErrorCode[ErrorCode["WRITE_TO_READ_ONLY_VARIABLE"] = 8005] = "WRITE_TO_READ_ONLY_VARIABLE";
    /**
     * A template variable was declared twice. For example:
     *
     * ```html
     * <div *ngFor="let i of items; let i = index">
     * </div>
     * ```
     */
    ErrorCode[ErrorCode["DUPLICATE_VARIABLE_DECLARATION"] = 8006] = "DUPLICATE_VARIABLE_DECLARATION";
    /**
     * A template has a two way binding (two bindings created by a single syntactical element)
     * in which the input and output are going to different places.
     */
    ErrorCode[ErrorCode["SPLIT_TWO_WAY_BINDING"] = 8007] = "SPLIT_TWO_WAY_BINDING";
    /**
     * A directive usage isn't binding to one or more required inputs.
     */
    ErrorCode[ErrorCode["MISSING_REQUIRED_INPUTS"] = 8008] = "MISSING_REQUIRED_INPUTS";
    /**
     * The tracking expression of a `for` loop block is accessing a variable that is unavailable,
     * for example:
     *
     * ```angular-html
     * <ng-template let-ref>
     *   @for (item of items; track ref) {}
     * </ng-template>
     * ```
     */
    ErrorCode[ErrorCode["ILLEGAL_FOR_LOOP_TRACK_ACCESS"] = 8009] = "ILLEGAL_FOR_LOOP_TRACK_ACCESS";
    /**
     * The trigger of a `defer` block cannot access its trigger element,
     * either because it doesn't exist or it's in a different view.
     *
     * ```angular-html
     * @defer (on interaction(trigger)) {...}
     *
     * <ng-template>
     *   <button #trigger></button>
     * </ng-template>
     * ```
     */
    ErrorCode[ErrorCode["INACCESSIBLE_DEFERRED_TRIGGER_ELEMENT"] = 8010] = "INACCESSIBLE_DEFERRED_TRIGGER_ELEMENT";
    /**
     * A control flow node is projected at the root of a component and is preventing its direct
     * descendants from being projected, because it has more than one root node.
     *
     * ```angular-html
     * <comp>
     *  @if (expr) {
     *    <div projectsIntoSlot></div>
     *    Text preventing the div from being projected
     *  }
     * </comp>
     * ```
     */
    ErrorCode[ErrorCode["CONTROL_FLOW_PREVENTING_CONTENT_PROJECTION"] = 8011] = "CONTROL_FLOW_PREVENTING_CONTENT_PROJECTION";
    /**
     * A pipe imported via `@Component.deferredImports` is
     * used outside of a `@defer` block in a template.
     */
    ErrorCode[ErrorCode["DEFERRED_PIPE_USED_EAGERLY"] = 8012] = "DEFERRED_PIPE_USED_EAGERLY";
    /**
     * A directive/component imported via `@Component.deferredImports` is
     * used outside of a `@defer` block in a template.
     */
    ErrorCode[ErrorCode["DEFERRED_DIRECTIVE_USED_EAGERLY"] = 8013] = "DEFERRED_DIRECTIVE_USED_EAGERLY";
    /**
     * A directive/component/pipe imported via `@Component.deferredImports` is
     * also included into the `@Component.imports` list.
     */
    ErrorCode[ErrorCode["DEFERRED_DEPENDENCY_IMPORTED_EAGERLY"] = 8014] = "DEFERRED_DEPENDENCY_IMPORTED_EAGERLY";
    /** An expression is trying to write to an `@let` declaration. */
    ErrorCode[ErrorCode["ILLEGAL_LET_WRITE"] = 8015] = "ILLEGAL_LET_WRITE";
    /** An expression is trying to read an `@let` before it has been defined. */
    ErrorCode[ErrorCode["LET_USED_BEFORE_DEFINITION"] = 8016] = "LET_USED_BEFORE_DEFINITION";
    /** A `@let` declaration conflicts with another symbol in the same scope. */
    ErrorCode[ErrorCode["CONFLICTING_LET_DECLARATION"] = 8017] = "CONFLICTING_LET_DECLARATION";
    /**
     * A binding inside selectorless directive syntax did
     * not match any inputs/outputs of the directive.
     */
    ErrorCode[ErrorCode["UNCLAIMED_DIRECTIVE_BINDING"] = 8018] = "UNCLAIMED_DIRECTIVE_BINDING";
    /**
     * A two way binding in a template has an incorrect syntax,
     * parentheses outside brackets. For example:
     *
     * ```html
     * <div ([foo])="bar" />
     * ```
     */
    ErrorCode[ErrorCode["INVALID_BANANA_IN_BOX"] = 8101] = "INVALID_BANANA_IN_BOX";
    /**
     * The left side of a nullish coalescing operation is not nullable.
     *
     * ```html
     * {{ foo ?? bar }}
     * ```
     * When the type of foo doesn't include `null` or `undefined`.
     */
    ErrorCode[ErrorCode["NULLISH_COALESCING_NOT_NULLABLE"] = 8102] = "NULLISH_COALESCING_NOT_NULLABLE";
    /**
     * A known control flow directive (e.g. `*ngIf`) is used in a template,
     * but the `CommonModule` is not imported.
     */
    ErrorCode[ErrorCode["MISSING_CONTROL_FLOW_DIRECTIVE"] = 8103] = "MISSING_CONTROL_FLOW_DIRECTIVE";
    /**
     * A text attribute is not interpreted as a binding but likely intended to be.
     *
     * For example:
     * ```html
     * <div
     *   attr.x="value"
     *   class.blue="true"
     *   style.margin-right.px="5">
     * </div>
     * ```
     *
     * All of the above attributes will just be static text attributes and will not be interpreted as
     * bindings by the compiler.
     */
    ErrorCode[ErrorCode["TEXT_ATTRIBUTE_NOT_BINDING"] = 8104] = "TEXT_ATTRIBUTE_NOT_BINDING";
    /**
     * NgForOf is used in a template, but the user forgot to include let
     * in their statement.
     *
     * For example:
     * ```html
     * <ul><li *ngFor="item of items">{{item["name"]}};</li></ul>
     * ```
     */
    ErrorCode[ErrorCode["MISSING_NGFOROF_LET"] = 8105] = "MISSING_NGFOROF_LET";
    /**
     * Indicates that the binding suffix is not supported
     *
     * Style bindings support suffixes like `style.width.px`, `.em`, and `.%`.
     * These suffixes are _not_ supported for attribute bindings.
     *
     * For example `[attr.width.px]="5"` becomes `width.px="5"` when bound.
     * This is almost certainly unintentional and this error is meant to
     * surface this mistake to the developer.
     */
    ErrorCode[ErrorCode["SUFFIX_NOT_SUPPORTED"] = 8106] = "SUFFIX_NOT_SUPPORTED";
    /**
     * The left side of an optional chain operation is not nullable.
     *
     * ```html
     * {{ foo?.bar }}
     * {{ foo?.['bar'] }}
     * {{ foo?.() }}
     * ```
     * When the type of foo doesn't include `null` or `undefined`.
     */
    ErrorCode[ErrorCode["OPTIONAL_CHAIN_NOT_NULLABLE"] = 8107] = "OPTIONAL_CHAIN_NOT_NULLABLE";
    /**
     * `ngSkipHydration` should not be a binding (it should be a static attribute).
     *
     * For example:
     * ```html
     * <my-cmp [ngSkipHydration]="someTruthyVar" />
     * ```
     *
     * `ngSkipHydration` cannot be a binding and can not have values other than "true" or an empty
     * value
     */
    ErrorCode[ErrorCode["SKIP_HYDRATION_NOT_STATIC"] = 8108] = "SKIP_HYDRATION_NOT_STATIC";
    /**
     * Signal functions should be invoked when interpolated in templates.
     *
     * For example:
     * ```html
     * {{ mySignal() }}
     * ```
     */
    ErrorCode[ErrorCode["INTERPOLATED_SIGNAL_NOT_INVOKED"] = 8109] = "INTERPOLATED_SIGNAL_NOT_INVOKED";
    /**
     * Initializer-based APIs can only be invoked from inside of an initializer.
     *
     * ```ts
     * // Allowed
     * myInput = input();
     *
     * // Not allowed
     * function myInput() {
     *   return input();
     * }
     * ```
     */
    ErrorCode[ErrorCode["UNSUPPORTED_INITIALIZER_API_USAGE"] = 8110] = "UNSUPPORTED_INITIALIZER_API_USAGE";
    /**
     * A function in an event binding is not called.
     *
     * For example:
     * ```html
     * <button (click)="myFunc"></button>
     * ```
     *
     * This will not call `myFunc` when the button is clicked. Instead, it should be
     * `<button (click)="myFunc()"></button>`.
     */
    ErrorCode[ErrorCode["UNINVOKED_FUNCTION_IN_EVENT_BINDING"] = 8111] = "UNINVOKED_FUNCTION_IN_EVENT_BINDING";
    /**
     * A `@let` declaration in a template isn't used.
     *
     * For example:
     * ```angular-html
     * @let used = 1; <!-- Not an error -->
     * @let notUsed = 2; <!-- Error -->
     *
     * {{used}}
     * ```
     */
    ErrorCode[ErrorCode["UNUSED_LET_DECLARATION"] = 8112] = "UNUSED_LET_DECLARATION";
    /**
     * A symbol referenced in `@Component.imports` isn't being used within the template.
     */
    ErrorCode[ErrorCode["UNUSED_STANDALONE_IMPORTS"] = 8113] = "UNUSED_STANDALONE_IMPORTS";
    /**
     * An expression mixes nullish coalescing and logical and/or without parentheses.
     */
    ErrorCode[ErrorCode["UNPARENTHESIZED_NULLISH_COALESCING"] = 8114] = "UNPARENTHESIZED_NULLISH_COALESCING";
    /**
     * The function passed to `@for` track is not invoked.
     *
     * For example:
     * ```angular-html
     * @for (item of items; track trackByName) {}
     * ```
     *
     * For the track function to work properly, it must be invoked.
     *
     * For example:
     * ```angular-html
     * @for (item of items; track trackByName(item)) {}
     * ```
     */
    ErrorCode[ErrorCode["UNINVOKED_TRACK_FUNCTION"] = 8115] = "UNINVOKED_TRACK_FUNCTION";
    /**
     * A structural directive is used in a template, but the directive is not imported.
     */
    ErrorCode[ErrorCode["MISSING_STRUCTURAL_DIRECTIVE"] = 8116] = "MISSING_STRUCTURAL_DIRECTIVE";
    /**
     * The template type-checking engine would need to generate an inline type check block for a
     * component, but the current type-checking environment doesn't support it.
     */
    ErrorCode[ErrorCode["INLINE_TCB_REQUIRED"] = 8900] = "INLINE_TCB_REQUIRED";
    /**
     * The template type-checking engine would need to generate an inline type constructor for a
     * directive or component, but the current type-checking environment doesn't support it.
     */
    ErrorCode[ErrorCode["INLINE_TYPE_CTOR_REQUIRED"] = 8901] = "INLINE_TYPE_CTOR_REQUIRED";
    /**
     * An injectable already has a `ɵprov` property.
     */
    ErrorCode[ErrorCode["INJECTABLE_DUPLICATE_PROV"] = 9001] = "INJECTABLE_DUPLICATE_PROV";
    // 10XXX error codes are reserved for diagnostics with categories other than
    // `ts.DiagnosticCategory.Error`. These diagnostics are generated by the compiler when configured
    // to do so by a tool such as the Language Service, or by the Language Service itself.
    /**
     * Suggest users to enable `strictTemplates` to make use of full capabilities
     * provided by Angular language service.
     */
    ErrorCode[ErrorCode["SUGGEST_STRICT_TEMPLATES"] = 10001] = "SUGGEST_STRICT_TEMPLATES";
    /**
     * Indicates that a particular structural directive provides advanced type narrowing
     * functionality, but the current template type-checking configuration does not allow its usage in
     * type inference.
     */
    ErrorCode[ErrorCode["SUGGEST_SUBOPTIMAL_TYPE_INFERENCE"] = 10002] = "SUGGEST_SUBOPTIMAL_TYPE_INFERENCE";
    /**
     * In local compilation mode a const is required to be resolved statically but cannot be so since
     * it is imported from a file outside of the compilation unit. This usually happens with const
     * being used as Angular decorators parameters such as `@Component.template`,
     * `@HostListener.eventName`, etc.
     */
    ErrorCode[ErrorCode["LOCAL_COMPILATION_UNRESOLVED_CONST"] = 11001] = "LOCAL_COMPILATION_UNRESOLVED_CONST";
    /**
     * In local compilation mode a certain expression or syntax is not supported. This is usually
     * because the expression/syntax is not very common and so we did not add support for it yet. This
     * can be changed in the future and support for more expressions could be added if need be.
     * Meanwhile, this error is thrown to indicate a current unavailability.
     */
    ErrorCode[ErrorCode["LOCAL_COMPILATION_UNSUPPORTED_EXPRESSION"] = 11003] = "LOCAL_COMPILATION_UNSUPPORTED_EXPRESSION";
})(exports.ErrorCode || (exports.ErrorCode = {}));

/**
 * Contains a set of error messages that have detailed guides at angular.io.
 * Full list of available error guides can be found at https://angular.dev/errors
 */
const COMPILER_ERRORS_WITH_GUIDES = new Set([
    exports.ErrorCode.DECORATOR_ARG_NOT_LITERAL,
    exports.ErrorCode.IMPORT_CYCLE_DETECTED,
    exports.ErrorCode.PARAM_MISSING_TOKEN,
    exports.ErrorCode.SCHEMA_INVALID_ELEMENT,
    exports.ErrorCode.SCHEMA_INVALID_ATTRIBUTE,
    exports.ErrorCode.MISSING_REFERENCE_TARGET,
    exports.ErrorCode.COMPONENT_INVALID_SHADOW_DOM_SELECTOR,
    exports.ErrorCode.WARN_NGMODULE_ID_UNNECESSARY,
]);

function ngErrorCode(code) {
    return parseInt('-99' + code);
}

class FatalDiagnosticError extends Error {
    code;
    node;
    diagnosticMessage;
    relatedInformation;
    constructor(code, node, diagnosticMessage, relatedInformation) {
        super(`FatalDiagnosticError: Code: ${code}, Message: ${ts.flattenDiagnosticMessageText(diagnosticMessage, '\n')}`);
        this.code = code;
        this.node = node;
        this.diagnosticMessage = diagnosticMessage;
        this.relatedInformation = relatedInformation;
        // Extending `Error` ends up breaking some internal tests. This appears to be a known issue
        // when extending errors in TS and the workaround is to explicitly set the prototype.
        // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        Object.setPrototypeOf(this, new.target.prototype);
    }
    /**
     * @internal
     */
    _isFatalDiagnosticError = true;
    toDiagnostic() {
        return makeDiagnostic(this.code, this.node, this.diagnosticMessage, this.relatedInformation);
    }
}
function makeDiagnostic(code, node, messageText, relatedInformation, category = ts.DiagnosticCategory.Error) {
    node = ts.getOriginalNode(node);
    return {
        category,
        code: ngErrorCode(code),
        file: ts.getOriginalNode(node).getSourceFile(),
        start: node.getStart(undefined, false),
        length: node.getWidth(),
        messageText,
        relatedInformation,
    };
}
function makeDiagnosticChain(messageText, next) {
    return {
        category: ts.DiagnosticCategory.Message,
        code: 0,
        messageText,
        next,
    };
}
function makeRelatedInformation(node, messageText) {
    node = ts.getOriginalNode(node);
    return {
        category: ts.DiagnosticCategory.Message,
        code: 0,
        file: node.getSourceFile(),
        start: node.getStart(),
        length: node.getWidth(),
        messageText,
    };
}
function addDiagnosticChain(messageText, add) {
    if (typeof messageText === 'string') {
        return makeDiagnosticChain(messageText, add);
    }
    if (messageText.next === undefined) {
        messageText.next = add;
    }
    else {
        messageText.next.push(...add);
    }
    return messageText;
}
function isFatalDiagnosticError(err) {
    return err._isFatalDiagnosticError === true;
}

/**
 * Enum holding the name of each extended template diagnostic. The name is used as a user-meaningful
 * value for configuring the diagnostic in the project's options.
 *
 * See the corresponding `ErrorCode` for documentation about each specific error.
 * packages/compiler-cli/src/ngtsc/diagnostics/src/error_code.ts
 *
 * @publicApi
 */
exports.ExtendedTemplateDiagnosticName = void 0;
(function (ExtendedTemplateDiagnosticName) {
    ExtendedTemplateDiagnosticName["INVALID_BANANA_IN_BOX"] = "invalidBananaInBox";
    ExtendedTemplateDiagnosticName["NULLISH_COALESCING_NOT_NULLABLE"] = "nullishCoalescingNotNullable";
    ExtendedTemplateDiagnosticName["OPTIONAL_CHAIN_NOT_NULLABLE"] = "optionalChainNotNullable";
    ExtendedTemplateDiagnosticName["MISSING_CONTROL_FLOW_DIRECTIVE"] = "missingControlFlowDirective";
    ExtendedTemplateDiagnosticName["MISSING_STRUCTURAL_DIRECTIVE"] = "missingStructuralDirective";
    ExtendedTemplateDiagnosticName["TEXT_ATTRIBUTE_NOT_BINDING"] = "textAttributeNotBinding";
    ExtendedTemplateDiagnosticName["UNINVOKED_FUNCTION_IN_EVENT_BINDING"] = "uninvokedFunctionInEventBinding";
    ExtendedTemplateDiagnosticName["MISSING_NGFOROF_LET"] = "missingNgForOfLet";
    ExtendedTemplateDiagnosticName["SUFFIX_NOT_SUPPORTED"] = "suffixNotSupported";
    ExtendedTemplateDiagnosticName["SKIP_HYDRATION_NOT_STATIC"] = "skipHydrationNotStatic";
    ExtendedTemplateDiagnosticName["INTERPOLATED_SIGNAL_NOT_INVOKED"] = "interpolatedSignalNotInvoked";
    ExtendedTemplateDiagnosticName["CONTROL_FLOW_PREVENTING_CONTENT_PROJECTION"] = "controlFlowPreventingContentProjection";
    ExtendedTemplateDiagnosticName["UNUSED_LET_DECLARATION"] = "unusedLetDeclaration";
    ExtendedTemplateDiagnosticName["UNINVOKED_TRACK_FUNCTION"] = "uninvokedTrackFunction";
    ExtendedTemplateDiagnosticName["UNUSED_STANDALONE_IMPORTS"] = "unusedStandaloneImports";
    ExtendedTemplateDiagnosticName["UNPARENTHESIZED_NULLISH_COALESCING"] = "unparenthesizedNullishCoalescing";
})(exports.ExtendedTemplateDiagnosticName || (exports.ExtendedTemplateDiagnosticName = {}));

/**
 * The default `FileSystem` that will always fail.
 *
 * This is a way of ensuring that the developer consciously chooses and
 * configures the `FileSystem` before using it; particularly important when
 * considering static functions like `absoluteFrom()` which rely on
 * the `FileSystem` under the hood.
 */
class InvalidFileSystem {
    exists(path) {
        throw makeError();
    }
    readFile(path) {
        throw makeError();
    }
    readFileBuffer(path) {
        throw makeError();
    }
    writeFile(path, data, exclusive) {
        throw makeError();
    }
    removeFile(path) {
        throw makeError();
    }
    symlink(target, path) {
        throw makeError();
    }
    readdir(path) {
        throw makeError();
    }
    lstat(path) {
        throw makeError();
    }
    stat(path) {
        throw makeError();
    }
    pwd() {
        throw makeError();
    }
    chdir(path) {
        throw makeError();
    }
    extname(path) {
        throw makeError();
    }
    copyFile(from, to) {
        throw makeError();
    }
    moveFile(from, to) {
        throw makeError();
    }
    ensureDir(path) {
        throw makeError();
    }
    removeDeep(path) {
        throw makeError();
    }
    isCaseSensitive() {
        throw makeError();
    }
    resolve(...paths) {
        throw makeError();
    }
    dirname(file) {
        throw makeError();
    }
    join(basePath, ...paths) {
        throw makeError();
    }
    isRoot(path) {
        throw makeError();
    }
    isRooted(path) {
        throw makeError();
    }
    relative(from, to) {
        throw makeError();
    }
    basename(filePath, extension) {
        throw makeError();
    }
    realpath(filePath) {
        throw makeError();
    }
    getDefaultLibLocation() {
        throw makeError();
    }
    normalize(path) {
        throw makeError();
    }
}
function makeError() {
    return new Error('FileSystem has not been configured. Please call `setFileSystem()` before calling this method.');
}

const TS_DTS_JS_EXTENSION = /(?:\.d)?\.ts$|\.js$/;
/**
 * Remove a .ts, .d.ts, or .js extension from a file name.
 */
function stripExtension(path) {
    return path.replace(TS_DTS_JS_EXTENSION, '');
}
function getSourceFileOrError(program, fileName) {
    const sf = program.getSourceFile(fileName);
    if (sf === undefined) {
        throw new Error(`Program does not contain "${fileName}" - available files are ${program
            .getSourceFiles()
            .map((sf) => sf.fileName)
            .join(', ')}`);
    }
    return sf;
}

let fs = new InvalidFileSystem();
function getFileSystem() {
    return fs;
}
function setFileSystem(fileSystem) {
    fs = fileSystem;
}
/**
 * Convert the path `path` to an `AbsoluteFsPath`, throwing an error if it's not an absolute path.
 */
function absoluteFrom(path) {
    if (!fs.isRooted(path)) {
        throw new Error(`Internal Error: absoluteFrom(${path}): path is not absolute`);
    }
    return fs.resolve(path);
}
const ABSOLUTE_PATH = Symbol('AbsolutePath');
/**
 * Extract an `AbsoluteFsPath` from a `ts.SourceFile`-like object.
 */
function absoluteFromSourceFile(sf) {
    const sfWithPatch = sf;
    if (sfWithPatch[ABSOLUTE_PATH] === undefined) {
        sfWithPatch[ABSOLUTE_PATH] = fs.resolve(sfWithPatch.fileName);
    }
    // Non-null assertion needed since TS doesn't narrow the type of fields that use a symbol as a key
    // apparently.
    return sfWithPatch[ABSOLUTE_PATH];
}
/**
 * Static access to `dirname`.
 */
function dirname(file) {
    return fs.dirname(file);
}
/**
 * Static access to `join`.
 */
function join(basePath, ...paths) {
    return fs.join(basePath, ...paths);
}
/**
 * Static access to `resolve`s.
 */
function resolve(basePath, ...paths) {
    return fs.resolve(basePath, ...paths);
}
/**
 * Static access to `isRooted`.
 */
function isRooted(path) {
    return fs.isRooted(path);
}
/**
 * Static access to `relative`.
 */
function relative(from, to) {
    return fs.relative(from, to);
}
/**
 * Returns true if the given path is locally relative.
 *
 * This is used to work out if the given path is relative (i.e. not absolute) but also is not
 * escaping the current directory.
 */
function isLocalRelativePath(relativePath) {
    return !isRooted(relativePath) && !relativePath.startsWith('..');
}
/**
 * Converts a path to a form suitable for use as a relative module import specifier.
 *
 * In other words it adds the `./` to the path if it is locally relative.
 */
function toRelativeImport(relativePath) {
    return isLocalRelativePath(relativePath) ? `./${relativePath}` : relativePath;
}

const LogicalProjectPath = {
    /**
     * Get the relative path between two `LogicalProjectPath`s.
     *
     * This will return a `PathSegment` which would be a valid module specifier to use in `from` when
     * importing from `to`.
     */
    relativePathBetween: function (from, to) {
        const relativePath = relative(dirname(resolve(from)), resolve(to));
        return toRelativeImport(relativePath);
    },
};
/**
 * A utility class which can translate absolute paths to source files into logical paths in
 * TypeScript's logical file system, based on the root directories of the project.
 */
class LogicalFileSystem {
    compilerHost;
    /**
     * The root directories of the project, sorted with the longest path first.
     */
    rootDirs;
    /**
     * The same root directories as `rootDirs` but with each one converted to its
     * canonical form for matching in case-insensitive file-systems.
     */
    canonicalRootDirs;
    /**
     * A cache of file paths to project paths, because computation of these paths is slightly
     * expensive.
     */
    cache = new Map();
    constructor(rootDirs, compilerHost) {
        this.compilerHost = compilerHost;
        // Make a copy and sort it by length in reverse order (longest first). This speeds up lookups,
        // since there's no need to keep going through the array once a match is found.
        this.rootDirs = rootDirs.concat([]).sort((a, b) => b.length - a.length);
        this.canonicalRootDirs = this.rootDirs.map((dir) => this.compilerHost.getCanonicalFileName(dir));
    }
    /**
     * Get the logical path in the project of a `ts.SourceFile`.
     *
     * This method is provided as a convenient alternative to calling
     * `logicalPathOfFile(absoluteFromSourceFile(sf))`.
     */
    logicalPathOfSf(sf) {
        return this.logicalPathOfFile(absoluteFromSourceFile(sf));
    }
    /**
     * Get the logical path in the project of a source file.
     *
     * @returns A `LogicalProjectPath` to the source file, or `null` if the source file is not in any
     * of the TS project's root directories.
     */
    logicalPathOfFile(physicalFile) {
        if (!this.cache.has(physicalFile)) {
            const canonicalFilePath = this.compilerHost.getCanonicalFileName(physicalFile);
            let logicalFile = null;
            for (let i = 0; i < this.rootDirs.length; i++) {
                const rootDir = this.rootDirs[i];
                const canonicalRootDir = this.canonicalRootDirs[i];
                if (isWithinBasePath(canonicalRootDir, canonicalFilePath)) {
                    // Note that we match against canonical paths but then create the logical path from
                    // original paths.
                    logicalFile = this.createLogicalProjectPath(physicalFile, rootDir);
                    // The logical project does not include any special "node_modules" nested directories.
                    if (logicalFile.indexOf('/node_modules/') !== -1) {
                        logicalFile = null;
                    }
                    else {
                        break;
                    }
                }
            }
            this.cache.set(physicalFile, logicalFile);
        }
        return this.cache.get(physicalFile);
    }
    createLogicalProjectPath(file, rootDir) {
        const logicalPath = stripExtension(file.slice(rootDir.length));
        return (logicalPath.startsWith('/') ? logicalPath : '/' + logicalPath);
    }
}
/**
 * Is the `path` a descendant of the `base`?
 * E.g. `foo/bar/zee` is within `foo/bar` but not within `foo/car`.
 */
function isWithinBasePath(base, path) {
    return isLocalRelativePath(relative(base, path));
}

/// <reference types="node" />
/**
 * A wrapper around the Node.js file-system that supports path manipulation.
 */
class NodeJSPathManipulation {
    pwd() {
        return this.normalize(process.cwd());
    }
    chdir(dir) {
        process.chdir(dir);
    }
    resolve(...paths) {
        return this.normalize(p__namespace.resolve(...paths));
    }
    dirname(file) {
        return this.normalize(p__namespace.dirname(file));
    }
    join(basePath, ...paths) {
        return this.normalize(p__namespace.join(basePath, ...paths));
    }
    isRoot(path) {
        return this.dirname(path) === this.normalize(path);
    }
    isRooted(path) {
        return p__namespace.isAbsolute(path);
    }
    relative(from, to) {
        return this.normalize(p__namespace.relative(from, to));
    }
    basename(filePath, extension) {
        return p__namespace.basename(filePath, extension);
    }
    extname(path) {
        return p__namespace.extname(path);
    }
    normalize(path) {
        // Convert backslashes to forward slashes
        return path.replace(/\\/g, '/');
    }
}
// G3-ESM-MARKER: G3 uses CommonJS, but externally everything in ESM.
// CommonJS/ESM interop for determining the current file name and containing dir.
const isCommonJS = typeof __filename !== 'undefined';
const currentFileUrl = isCommonJS ? null : (typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('checker-BAl7CJ0l.js', document.baseURI).href));
const currentFileName = isCommonJS ? __filename : url.fileURLToPath(currentFileUrl);
/**
 * A wrapper around the Node.js file-system that supports readonly operations and path manipulation.
 */
class NodeJSReadonlyFileSystem extends NodeJSPathManipulation {
    _caseSensitive = undefined;
    isCaseSensitive() {
        if (this._caseSensitive === undefined) {
            // Note the use of the real file-system is intentional:
            // `this.exists()` relies upon `isCaseSensitive()` so that would cause an infinite recursion.
            this._caseSensitive = !fs$1.existsSync(this.normalize(toggleCase(currentFileName)));
        }
        return this._caseSensitive;
    }
    exists(path) {
        return fs$1.existsSync(path);
    }
    readFile(path) {
        return fs$1.readFileSync(path, 'utf8');
    }
    readFileBuffer(path) {
        return fs$1.readFileSync(path);
    }
    readdir(path) {
        return fs$1.readdirSync(path);
    }
    lstat(path) {
        return fs$1.lstatSync(path);
    }
    stat(path) {
        return fs$1.statSync(path);
    }
    realpath(path) {
        return this.resolve(fs$1.realpathSync(path));
    }
    getDefaultLibLocation() {
        // G3-ESM-MARKER: G3 uses CommonJS, but externally everything in ESM.
        const requireFn = isCommonJS ? require : module$1.createRequire(currentFileUrl);
        return this.resolve(requireFn.resolve('typescript'), '..');
    }
}
/**
 * A wrapper around the Node.js file-system (i.e. the `fs` package).
 */
class NodeJSFileSystem extends NodeJSReadonlyFileSystem {
    writeFile(path, data, exclusive = false) {
        fs$1.writeFileSync(path, data, exclusive ? { flag: 'wx' } : undefined);
    }
    removeFile(path) {
        fs$1.unlinkSync(path);
    }
    symlink(target, path) {
        fs$1.symlinkSync(target, path);
    }
    copyFile(from, to) {
        fs$1.copyFileSync(from, to);
    }
    moveFile(from, to) {
        fs$1.renameSync(from, to);
    }
    ensureDir(path) {
        fs$1.mkdirSync(path, { recursive: true });
    }
    removeDeep(path) {
        fs$1.rmdirSync(path, { recursive: true });
    }
}
/**
 * Toggle the case of each character in a string.
 */
function toggleCase(str) {
    return str.replace(/\w/g, (ch) => ch.toUpperCase() === ch ? ch.toLowerCase() : ch.toUpperCase());
}

const TS = /\.tsx?$/i;
const D_TS = /\.d\.ts$/i;
function isSymbolWithValueDeclaration(symbol) {
    // If there is a value declaration set, then the `declarations` property is never undefined. We
    // still check for the property to exist as this matches with the type that `symbol` is narrowed
    // to.
    return (symbol != null && symbol.valueDeclaration !== undefined && symbol.declarations !== undefined);
}
function isDtsPath(filePath) {
    return D_TS.test(filePath);
}
function isNonDeclarationTsPath(filePath) {
    return TS.test(filePath) && !D_TS.test(filePath);
}
function isFromDtsFile(node) {
    let sf = node.getSourceFile();
    if (sf === undefined) {
        sf = ts.getOriginalNode(node).getSourceFile();
    }
    return sf !== undefined && sf.isDeclarationFile;
}
function nodeNameForError(node) {
    if (node.name !== undefined && ts.isIdentifier(node.name)) {
        return node.name.text;
    }
    else {
        const kind = ts.SyntaxKind[node.kind];
        const { line, character } = ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
        return `${kind}@${line}:${character}`;
    }
}
function getSourceFile(node) {
    // In certain transformation contexts, `ts.Node.getSourceFile()` can actually return `undefined`,
    // despite the type signature not allowing it. In that event, get the `ts.SourceFile` via the
    // original node instead (which works).
    const directSf = node.getSourceFile();
    return directSf !== undefined ? directSf : ts.getOriginalNode(node).getSourceFile();
}
function getSourceFileOrNull(program, fileName) {
    return program.getSourceFile(fileName) || null;
}
function getTokenAtPosition(sf, pos) {
    // getTokenAtPosition is part of TypeScript's private API.
    return ts.getTokenAtPosition(sf, pos);
}
function identifierOfNode(decl) {
    if (decl.name !== undefined && ts.isIdentifier(decl.name)) {
        return decl.name;
    }
    else {
        return null;
    }
}
function isDeclaration(node) {
    return isValueDeclaration(node) || isTypeDeclaration(node);
}
function isValueDeclaration(node) {
    return (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node));
}
function isTypeDeclaration(node) {
    return (ts.isEnumDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node));
}
function isNamedDeclaration(node) {
    const namedNode = node;
    return namedNode.name !== undefined && ts.isIdentifier(namedNode.name);
}
function getRootDirs(host, options) {
    const rootDirs = [];
    const cwd = host.getCurrentDirectory();
    const fs = getFileSystem();
    if (options.rootDirs !== undefined) {
        rootDirs.push(...options.rootDirs);
    }
    else if (options.rootDir !== undefined) {
        rootDirs.push(options.rootDir);
    }
    else {
        rootDirs.push(cwd);
    }
    // In Windows the above might not always return posix separated paths
    // See:
    // https://github.com/Microsoft/TypeScript/blob/3f7357d37f66c842d70d835bc925ec2a873ecfec/src/compiler/sys.ts#L650
    // Also compiler options might be set via an API which doesn't normalize paths
    return rootDirs.map((rootDir) => fs.resolve(cwd, host.getCanonicalFileName(rootDir)));
}
function nodeDebugInfo(node) {
    const sf = getSourceFile(node);
    const { line, character } = ts.getLineAndCharacterOfPosition(sf, node.pos);
    return `[${sf.fileName}: ${ts.SyntaxKind[node.kind]} @ ${line}:${character}]`;
}
/**
 * Resolve the specified `moduleName` using the given `compilerOptions` and `compilerHost`.
 *
 * This helper will attempt to use the `CompilerHost.resolveModuleNames()` method if available.
 * Otherwise it will fallback on the `ts.ResolveModuleName()` function.
 */
function resolveModuleName(moduleName, containingFile, compilerOptions, compilerHost, moduleResolutionCache) {
    if (compilerHost.resolveModuleNames) {
        return compilerHost.resolveModuleNames([moduleName], containingFile, undefined, // reusedNames
        undefined, // redirectedReference
        compilerOptions)[0];
    }
    else {
        return ts.resolveModuleName(moduleName, containingFile, compilerOptions, compilerHost, moduleResolutionCache !== null ? moduleResolutionCache : undefined).resolvedModule;
    }
}
/** Returns true if the node is an assignment expression. */
function isAssignment(node) {
    return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken;
}
/**
 * Obtains the non-redirected source file for `sf`.
 */
function toUnredirectedSourceFile(sf) {
    const redirectInfo = sf.redirectInfo;
    if (redirectInfo === undefined) {
        return sf;
    }
    return redirectInfo.unredirected;
}

/**
 * Find the name, if any, by which a node is exported from a given file.
 */
function findExportedNameOfNode(target, file, reflector) {
    const exports = reflector.getExportsOfModule(file);
    if (exports === null) {
        return null;
    }
    const declaredName = isNamedDeclaration(target) ? target.name.text : null;
    // Look for the export which declares the node.
    let foundExportName = null;
    for (const [exportName, declaration] of exports) {
        if (declaration.node !== target) {
            continue;
        }
        if (exportName === declaredName) {
            // A non-alias export exists which is always preferred, so use that one.
            return exportName;
        }
        foundExportName = exportName;
    }
    return foundExportName;
}

/**
 * Flags which alter the imports generated by the `ReferenceEmitter`.
 */
exports.ImportFlags = void 0;
(function (ImportFlags) {
    ImportFlags[ImportFlags["None"] = 0] = "None";
    /**
     * Force the generation of a new import when generating a reference, even if an identifier already
     * exists in the target file which could be used instead.
     *
     * This is sometimes required if there's a risk TypeScript might remove imports during emit.
     */
    ImportFlags[ImportFlags["ForceNewImport"] = 1] = "ForceNewImport";
    /**
     * Don't make use of any aliasing information when emitting a reference.
     *
     * This is sometimes required if emitting into a context where generated references will be fed
     * into TypeScript and type-checked (such as in template type-checking).
     */
    ImportFlags[ImportFlags["NoAliasing"] = 2] = "NoAliasing";
    /**
     * Indicates that an import to a type-only declaration is allowed.
     *
     * For references that occur in type-positions, the referred declaration may be a type-only
     * declaration that is not retained during emit. Including this flag allows to emit references to
     * type-only declarations as used in e.g. template type-checking.
     */
    ImportFlags[ImportFlags["AllowTypeImports"] = 4] = "AllowTypeImports";
    /**
     * Indicates that importing from a declaration file using a relative import path is allowed.
     *
     * The generated imports should normally use module specifiers that are valid for use in
     * production code, where arbitrary relative imports into e.g. node_modules are not allowed. For
     * template type-checking code it is however acceptable to use relative imports, as such files are
     * never emitted to JS code.
     *
     * Non-declaration files have to be contained within a configured `rootDir` so using relative
     * paths may not be possible for those, hence this flag only applies when importing from a
     * declaration file.
     */
    ImportFlags[ImportFlags["AllowRelativeDtsImports"] = 8] = "AllowRelativeDtsImports";
    /**
     * Indicates that references coming from ambient imports are allowed.
     */
    ImportFlags[ImportFlags["AllowAmbientReferences"] = 16] = "AllowAmbientReferences";
})(exports.ImportFlags || (exports.ImportFlags = {}));
exports.ReferenceEmitKind = void 0;
(function (ReferenceEmitKind) {
    ReferenceEmitKind[ReferenceEmitKind["Success"] = 0] = "Success";
    ReferenceEmitKind[ReferenceEmitKind["Failed"] = 1] = "Failed";
})(exports.ReferenceEmitKind || (exports.ReferenceEmitKind = {}));
/**
 * Verifies that a reference was emitted successfully, or raises a `FatalDiagnosticError` otherwise.
 * @param result The emit result that should have been successful.
 * @param origin The node that is used to report the failure diagnostic.
 * @param typeKind The kind of the symbol that the reference represents, e.g. 'component' or
 *     'class'.
 */
function assertSuccessfulReferenceEmit(result, origin, typeKind) {
    if (result.kind === exports.ReferenceEmitKind.Success) {
        return;
    }
    const message = makeDiagnosticChain(`Unable to import ${typeKind} ${nodeNameForError(result.ref.node)}.`, [makeDiagnosticChain(result.reason)]);
    throw new FatalDiagnosticError(exports.ErrorCode.IMPORT_GENERATION_FAILURE, origin, message, [
        makeRelatedInformation(result.ref.node, `The ${typeKind} is declared here.`),
    ]);
}
/**
 * Generates `Expression`s which refer to `Reference`s in a given context.
 *
 * A `ReferenceEmitter` uses one or more `ReferenceEmitStrategy` implementations to produce an
 * `Expression` which refers to a `Reference` in the context of a particular file.
 */
class ReferenceEmitter {
    strategies;
    constructor(strategies) {
        this.strategies = strategies;
    }
    emit(ref, context, importFlags = exports.ImportFlags.None) {
        for (const strategy of this.strategies) {
            const emitted = strategy.emit(ref, context, importFlags);
            if (emitted !== null) {
                return emitted;
            }
        }
        return {
            kind: exports.ReferenceEmitKind.Failed,
            ref,
            context,
            reason: `Unable to write a reference to ${nodeNameForError(ref.node)}.`,
        };
    }
}
/**
 * A `ReferenceEmitStrategy` which will refer to declarations by any local `ts.Identifier`s, if
 * such identifiers are available.
 */
class LocalIdentifierStrategy {
    emit(ref, context, importFlags) {
        const refSf = getSourceFile(ref.node);
        // If the emitter has specified ForceNewImport, then LocalIdentifierStrategy should not use a
        // local identifier at all, *except* in the source file where the node is actually declared.
        if (importFlags & exports.ImportFlags.ForceNewImport && refSf !== context) {
            return null;
        }
        // If referenced node is not an actual TS declaration (e.g. `class Foo` or `function foo() {}`,
        // etc) and it is in the current file then just use it directly.
        // This is important because the reference could be a property access (e.g. `exports.foo`). In
        // such a case, the reference's `identities` property would be `[foo]`, which would result in an
        // invalid emission of a free-standing `foo` identifier, rather than `exports.foo`.
        if (!isDeclaration(ref.node) && refSf === context) {
            return {
                kind: exports.ReferenceEmitKind.Success,
                expression: new compiler.WrappedNodeExpr(ref.node),
                importedFile: null,
            };
        }
        // If the reference is to an ambient type, it can be referenced directly.
        if (ref.isAmbient && importFlags & exports.ImportFlags.AllowAmbientReferences) {
            const identifier = identifierOfNode(ref.node);
            if (identifier !== null) {
                return {
                    kind: exports.ReferenceEmitKind.Success,
                    expression: new compiler.WrappedNodeExpr(identifier),
                    importedFile: null,
                };
            }
            else {
                return null;
            }
        }
        // A Reference can have multiple identities in different files, so it may already have an
        // Identifier in the requested context file.
        const identifier = ref.getIdentityIn(context);
        if (identifier !== null) {
            return {
                kind: exports.ReferenceEmitKind.Success,
                expression: new compiler.WrappedNodeExpr(identifier),
                importedFile: null,
            };
        }
        else {
            return null;
        }
    }
}
/**
 * A `ReferenceEmitStrategy` which will refer to declarations that come from `node_modules` using
 * an absolute import.
 *
 * Part of this strategy involves looking at the target entry point and identifying the exported
 * name of the targeted declaration, as it might be different from the declared name (e.g. a
 * directive might be declared as FooDirImpl, but exported as FooDir). If no export can be found
 * which maps back to the original directive, an error is thrown.
 */
class AbsoluteModuleStrategy {
    program;
    checker;
    moduleResolver;
    reflectionHost;
    /**
     * A cache of the exports of specific modules, because resolving a module to its exports is a
     * costly operation.
     */
    moduleExportsCache = new Map();
    constructor(program, checker, moduleResolver, reflectionHost) {
        this.program = program;
        this.checker = checker;
        this.moduleResolver = moduleResolver;
        this.reflectionHost = reflectionHost;
    }
    emit(ref, context, importFlags) {
        if (ref.bestGuessOwningModule === null) {
            // There is no module name available for this Reference, meaning it was arrived at via a
            // relative path.
            return null;
        }
        else if (!isDeclaration(ref.node)) {
            // It's not possible to import something which isn't a declaration.
            throw new Error(`Debug assert: unable to import a Reference to non-declaration of type ${ts.SyntaxKind[ref.node.kind]}.`);
        }
        else if ((importFlags & exports.ImportFlags.AllowTypeImports) === 0 && isTypeDeclaration(ref.node)) {
            throw new Error(`Importing a type-only declaration of type ${ts.SyntaxKind[ref.node.kind]} in a value position is not allowed.`);
        }
        // Try to find the exported name of the declaration, if one is available.
        const { specifier, resolutionContext } = ref.bestGuessOwningModule;
        const exports$1 = this.getExportsOfModule(specifier, resolutionContext);
        if (exports$1.module === null) {
            return {
                kind: exports.ReferenceEmitKind.Failed,
                ref,
                context,
                reason: `The module '${specifier}' could not be found.`,
            };
        }
        else if (exports$1.exportMap === null || !exports$1.exportMap.has(ref.node)) {
            return {
                kind: exports.ReferenceEmitKind.Failed,
                ref,
                context,
                reason: `The symbol is not exported from ${exports$1.module.fileName} (module '${specifier}').`,
            };
        }
        const symbolName = exports$1.exportMap.get(ref.node);
        return {
            kind: exports.ReferenceEmitKind.Success,
            expression: new compiler.ExternalExpr(new compiler.ExternalReference(specifier, symbolName)),
            importedFile: exports$1.module,
        };
    }
    getExportsOfModule(moduleName, fromFile) {
        if (!this.moduleExportsCache.has(moduleName)) {
            this.moduleExportsCache.set(moduleName, this.enumerateExportsOfModule(moduleName, fromFile));
        }
        return this.moduleExportsCache.get(moduleName);
    }
    enumerateExportsOfModule(specifier, fromFile) {
        // First, resolve the module specifier to its entry point, and get the ts.Symbol for it.
        const entryPointFile = this.moduleResolver.resolveModule(specifier, fromFile);
        if (entryPointFile === null) {
            return { module: null, exportMap: null };
        }
        const exports = this.reflectionHost.getExportsOfModule(entryPointFile);
        if (exports === null) {
            return { module: entryPointFile, exportMap: null };
        }
        const exportMap = new Map();
        for (const [name, declaration] of exports) {
            if (exportMap.has(declaration.node)) {
                // An export for this declaration has already been registered. We prefer an export that
                // has the same name as the declared name, i.e. is not an aliased export. This is relevant
                // for partial compilations where emitted references should import symbols using a stable
                // name. This is particularly relevant for declarations inside VE-generated libraries, as
                // such libraries contain private, unstable reexports of symbols.
                const existingExport = exportMap.get(declaration.node);
                if (isNamedDeclaration(declaration.node) && declaration.node.name.text === existingExport) {
                    continue;
                }
            }
            exportMap.set(declaration.node, name);
        }
        return { module: entryPointFile, exportMap };
    }
}
/**
 * A `ReferenceEmitStrategy` which will refer to declarations via relative paths, provided they're
 * both in the logical project "space" of paths.
 *
 * This is trickier than it sounds, as the two files may be in different root directories in the
 * project. Simply calculating a file system relative path between the two is not sufficient.
 * Instead, `LogicalProjectPath`s are used.
 */
class LogicalProjectStrategy {
    reflector;
    logicalFs;
    relativePathStrategy;
    constructor(reflector, logicalFs) {
        this.reflector = reflector;
        this.logicalFs = logicalFs;
        this.relativePathStrategy = new RelativePathStrategy(this.reflector);
    }
    emit(ref, context, importFlags) {
        const destSf = getSourceFile(ref.node);
        // Compute the relative path from the importing file to the file being imported. This is done
        // as a logical path computation, because the two files might be in different rootDirs.
        const destPath = this.logicalFs.logicalPathOfSf(destSf);
        if (destPath === null) {
            // The imported file is not within the logical project filesystem. An import into a
            // declaration file is exempt from `TS6059: File is not under 'rootDir'` so we choose to allow
            // using a filesystem relative path as fallback, if allowed per the provided import flags.
            if (destSf.isDeclarationFile && importFlags & exports.ImportFlags.AllowRelativeDtsImports) {
                return this.relativePathStrategy.emit(ref, context);
            }
            // Note: this error is analogous to `TS6059: File is not under 'rootDir'` that TypeScript
            // reports.
            return {
                kind: exports.ReferenceEmitKind.Failed,
                ref,
                context,
                reason: `The file ${destSf.fileName} is outside of the configured 'rootDir'.`,
            };
        }
        const originPath = this.logicalFs.logicalPathOfSf(context);
        if (originPath === null) {
            throw new Error(`Debug assert: attempt to import from ${context.fileName} but it's outside the program?`);
        }
        // There's no way to emit a relative reference from a file to itself.
        if (destPath === originPath) {
            return null;
        }
        const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
        if (name === null) {
            // The target declaration isn't exported from the file it's declared in. This is an issue!
            return {
                kind: exports.ReferenceEmitKind.Failed,
                ref,
                context,
                reason: `The symbol is not exported from ${destSf.fileName}.`,
            };
        }
        // With both files expressed as LogicalProjectPaths, getting the module specifier as a relative
        // path is now straightforward.
        const moduleName = LogicalProjectPath.relativePathBetween(originPath, destPath);
        return {
            kind: exports.ReferenceEmitKind.Success,
            expression: new compiler.ExternalExpr({ moduleName, name }),
            importedFile: destSf,
        };
    }
}
/**
 * A `ReferenceEmitStrategy` which constructs relatives paths between `ts.SourceFile`s.
 *
 * This strategy can be used if there is no `rootDir`/`rootDirs` structure for the project which
 * necessitates the stronger logic of `LogicalProjectStrategy`.
 */
class RelativePathStrategy {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    emit(ref, context) {
        const destSf = getSourceFile(ref.node);
        const relativePath = relative(dirname(absoluteFromSourceFile(context)), absoluteFromSourceFile(destSf));
        const moduleName = toRelativeImport(stripExtension(relativePath));
        const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
        if (name === null) {
            return {
                kind: exports.ReferenceEmitKind.Failed,
                ref,
                context,
                reason: `The symbol is not exported from ${destSf.fileName}.`,
            };
        }
        return {
            kind: exports.ReferenceEmitKind.Success,
            expression: new compiler.ExternalExpr({ moduleName, name }),
            importedFile: destSf,
        };
    }
}
/**
 * A `ReferenceEmitStrategy` which uses a `UnifiedModulesHost` to generate absolute import
 * references.
 */
class UnifiedModulesStrategy {
    reflector;
    unifiedModulesHost;
    constructor(reflector, unifiedModulesHost) {
        this.reflector = reflector;
        this.unifiedModulesHost = unifiedModulesHost;
    }
    emit(ref, context) {
        const destSf = getSourceFile(ref.node);
        const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
        if (name === null) {
            return null;
        }
        const moduleName = this.unifiedModulesHost.fileNameToModuleName(destSf.fileName, context.fileName);
        return {
            kind: exports.ReferenceEmitKind.Success,
            expression: new compiler.ExternalExpr({ moduleName, name }),
            importedFile: destSf,
        };
    }
}

const patchedReferencedAliasesSymbol = Symbol('patchedReferencedAliases');
/**
 * Patches the alias declaration reference resolution for a given transformation context
 * so that TypeScript knows about the specified alias declarations being referenced.
 *
 * This exists because TypeScript performs analysis of import usage before transformers
 * run and doesn't refresh its state after transformations. This means that imports
 * for symbols used as constructor types are elided due to their original type-only usage.
 *
 * In reality though, since we downlevel decorators and constructor parameters, we want
 * these symbols to be retained in the JavaScript output as they will be used as values
 * at runtime. We can instruct TypeScript to preserve imports for such identifiers by
 * creating a mutable clone of a given import specifier/clause or namespace, but that
 * has the downside of preserving the full import in the JS output. See:
 * https://github.com/microsoft/TypeScript/blob/3eaa7c65f6f076a08a5f7f1946fd0df7c7430259/src/compiler/transformers/ts.ts#L242-L250.
 *
 * This is a trick the CLI used in the past  for constructor parameter downleveling in JIT:
 * https://github.com/angular/angular-cli/blob/b3f84cc5184337666ce61c07b7b9df418030106f/packages/ngtools/webpack/src/transformers/ctor-parameters.ts#L323-L325
 * The trick is not ideal though as it preserves the full import (as outlined before), and it
 * results in a slow-down due to the type checker being involved multiple times. The CLI worked
 * around this import preserving issue by having another complex post-process step that detects and
 * elides unused imports. Note that these unused imports could cause unused chunks being generated
 * by webpack if the application or library is not marked as side-effect free.
 *
 * This is not ideal though, as we basically re-implement the complex import usage resolution
 * from TypeScript. We can do better by letting TypeScript do the import eliding, but providing
 * information about the alias declarations (e.g. import specifiers) that should not be elided
 * because they are actually referenced (as they will now appear in static properties).
 *
 * More information about these limitations with transformers can be found in:
 *   1. https://github.com/Microsoft/TypeScript/issues/17552.
 *   2. https://github.com/microsoft/TypeScript/issues/17516.
 *   3. https://github.com/angular/tsickle/issues/635.
 *
 * The patch we apply to tell TypeScript about actual referenced aliases (i.e. imported symbols),
 * matches conceptually with the logic that runs internally in TypeScript when the
 * `emitDecoratorMetadata` flag is enabled. TypeScript basically surfaces the same problem and
 * solves it conceptually the same way, but obviously doesn't need to access an internal API.
 *
 * The set that is returned by this function is meant to be filled with import declaration nodes
 * that have been referenced in a value-position by the transform, such the installed patch can
 * ensure that those import declarations are not elided.
 *
 * If `null` is returned then the transform operates in an isolated context, i.e. using the
 * `ts.transform` API. In such scenario there is no information whether an alias declaration
 * is referenced, so all alias declarations are naturally preserved and explicitly registering
 * an alias declaration as used isn't necessary.
 *
 * See below. Note that this uses sourcegraph as the TypeScript checker file doesn't display on
 * Github.
 * https://sourcegraph.com/github.com/microsoft/TypeScript@3eaa7c65f6f076a08a5f7f1946fd0df7c7430259/-/blob/src/compiler/checker.ts#L31219-31257
 */
function loadIsReferencedAliasDeclarationPatch(context) {
    // If the `getEmitResolver` method is not available, TS most likely changed the
    // internal structure of the transformation context. We will abort gracefully.
    if (!isTransformationContextWithEmitResolver(context)) {
        throwIncompatibleTransformationContextError();
    }
    const emitResolver = context.getEmitResolver();
    if (emitResolver === undefined) {
        // In isolated `ts.transform` operations no emit resolver is present, return null as `isReferencedAliasDeclaration`
        // will never be invoked.
        return null;
    }
    // The emit resolver may have been patched already, in which case we return the set of referenced
    // aliases that was created when the patch was first applied.
    // See https://github.com/angular/angular/issues/40276.
    const existingReferencedAliases = emitResolver[patchedReferencedAliasesSymbol];
    if (existingReferencedAliases !== undefined) {
        return existingReferencedAliases;
    }
    const originalIsReferencedAliasDeclaration = emitResolver.isReferencedAliasDeclaration;
    // If the emit resolver does not have a function called `isReferencedAliasDeclaration`, then
    // we abort gracefully as most likely TS changed the internal structure of the emit resolver.
    if (originalIsReferencedAliasDeclaration === undefined) {
        throwIncompatibleTransformationContextError();
    }
    const referencedAliases = new Set();
    emitResolver.isReferencedAliasDeclaration = function (node, ...args) {
        if (isAliasImportDeclaration(node) && referencedAliases.has(node)) {
            return true;
        }
        return originalIsReferencedAliasDeclaration.call(emitResolver, node, ...args);
    };
    return (emitResolver[patchedReferencedAliasesSymbol] = referencedAliases);
}
/**
 * Gets whether a given node corresponds to an import alias declaration. Alias
 * declarations can be import specifiers, namespace imports or import clauses
 * as these do not declare an actual symbol but just point to a target declaration.
 */
function isAliasImportDeclaration(node) {
    return ts.isImportSpecifier(node) || ts.isNamespaceImport(node) || ts.isImportClause(node);
}
/** Whether the transformation context exposes its emit resolver. */
function isTransformationContextWithEmitResolver(context) {
    return context.getEmitResolver !== undefined;
}
/**
 * Throws an error about an incompatible TypeScript version for which the alias
 * declaration reference resolution could not be monkey-patched. The error will
 * also propose potential solutions that can be applied by developers.
 */
function throwIncompatibleTransformationContextError() {
    throw Error('Angular compiler is incompatible with this version of the TypeScript compiler.\n\n' +
        'If you recently updated TypeScript and this issue surfaces now, consider downgrading.\n\n' +
        'Please report an issue on the Angular repositories when this issue ' +
        'surfaces and you are using a supposedly compatible TypeScript version.');
}

const DefaultImportDeclaration = Symbol('DefaultImportDeclaration');
/**
 * Attaches a default import declaration to `expr` to indicate the dependency of `expr` on the
 * default import.
 */
function attachDefaultImportDeclaration(expr, importDecl) {
    expr[DefaultImportDeclaration] = importDecl;
}
/**
 * Obtains the default import declaration that `expr` depends on, or `null` if there is no such
 * dependency.
 */
function getDefaultImportDeclaration(expr) {
    return expr[DefaultImportDeclaration] ?? null;
}
/**
 * TypeScript has trouble with generating default imports inside of transformers for some module
 * formats. The issue is that for the statement:
 *
 * import X from 'some/module';
 * console.log(X);
 *
 * TypeScript will not use the "X" name in generated code. For normal user code, this is fine
 * because references to X will also be renamed. However, if both the import and any references are
 * added in a transformer, TypeScript does not associate the two, and will leave the "X" references
 * dangling while renaming the import variable. The generated code looks something like:
 *
 * const module_1 = require('some/module');
 * console.log(X); // now X is a dangling reference.
 *
 * Therefore, we cannot synthetically add default imports, and must reuse the imports that users
 * include. Doing this poses a challenge for imports that are only consumed in the type position in
 * the user's code. If Angular reuses the imported symbol in a value position (for example, we
 * see a constructor parameter of type Foo and try to write "inject(Foo)") we will also end up with
 * a dangling reference, as TS will elide the import because it was only used in the type position
 * originally.
 *
 * To avoid this, the compiler must patch the emit resolver, and should only do this for imports
 * which are actually consumed. The `DefaultImportTracker` keeps track of these imports as they're
 * encountered and emitted, and implements a transform which can correctly flag the imports as
 * required.
 *
 * This problem does not exist for non-default imports as the compiler can easily insert
 * "import * as X" style imports for those, and the "X" identifier survives transformation.
 */
class DefaultImportTracker {
    /**
     * A `Map` which tracks the `Set` of `ts.ImportClause`s for default imports that were used in
     * a given file name.
     */
    sourceFileToUsedImports = new Map();
    recordUsedImport(importDecl) {
        if (importDecl.importClause) {
            const sf = getSourceFile(importDecl);
            // Add the default import declaration to the set of used import declarations for the file.
            if (!this.sourceFileToUsedImports.has(sf.fileName)) {
                this.sourceFileToUsedImports.set(sf.fileName, new Set());
            }
            this.sourceFileToUsedImports.get(sf.fileName).add(importDecl.importClause);
        }
    }
    /**
     * Get a `ts.TransformerFactory` which will preserve default imports that were previously marked
     * as used.
     *
     * This transformer must run after any other transformers which call `recordUsedImport`.
     */
    importPreservingTransformer() {
        return (context) => {
            let clausesToPreserve = null;
            return (sourceFile) => {
                const clausesForFile = this.sourceFileToUsedImports.get(sourceFile.fileName);
                if (clausesForFile !== undefined) {
                    for (const clause of clausesForFile) {
                        // Initialize the patch lazily so that apps that
                        // don't use default imports aren't patched.
                        if (clausesToPreserve === null) {
                            clausesToPreserve = loadIsReferencedAliasDeclarationPatch(context);
                        }
                        clausesToPreserve?.add(clause);
                    }
                }
                return sourceFile;
            };
        };
    }
}

function isDecoratorIdentifier(exp) {
    return (ts.isIdentifier(exp) ||
        (ts.isPropertyAccessExpression(exp) &&
            ts.isIdentifier(exp.expression) &&
            ts.isIdentifier(exp.name)));
}
/**
 * An enumeration of possible kinds of class members.
 */
exports.ClassMemberKind = void 0;
(function (ClassMemberKind) {
    ClassMemberKind[ClassMemberKind["Constructor"] = 0] = "Constructor";
    ClassMemberKind[ClassMemberKind["Getter"] = 1] = "Getter";
    ClassMemberKind[ClassMemberKind["Setter"] = 2] = "Setter";
    ClassMemberKind[ClassMemberKind["Property"] = 3] = "Property";
    ClassMemberKind[ClassMemberKind["Method"] = 4] = "Method";
})(exports.ClassMemberKind || (exports.ClassMemberKind = {}));
/** Possible access levels of a class member. */
var ClassMemberAccessLevel;
(function (ClassMemberAccessLevel) {
    ClassMemberAccessLevel[ClassMemberAccessLevel["PublicWritable"] = 0] = "PublicWritable";
    ClassMemberAccessLevel[ClassMemberAccessLevel["PublicReadonly"] = 1] = "PublicReadonly";
    ClassMemberAccessLevel[ClassMemberAccessLevel["Protected"] = 2] = "Protected";
    ClassMemberAccessLevel[ClassMemberAccessLevel["Private"] = 3] = "Private";
    ClassMemberAccessLevel[ClassMemberAccessLevel["EcmaScriptPrivate"] = 4] = "EcmaScriptPrivate";
})(ClassMemberAccessLevel || (ClassMemberAccessLevel = {}));
/** Indicates that a declaration is referenced through an ambient type. */
const AmbientImport = {};

/**
 * Potentially convert a `ts.TypeNode` to a `TypeValueReference`, which indicates how to use the
 * type given in the `ts.TypeNode` in a value position.
 *
 * This can return `null` if the `typeNode` is `null`, if it does not refer to a symbol with a value
 * declaration, or if it is not possible to statically understand.
 */
function typeToValue(typeNode, checker, isLocalCompilation) {
    // It's not possible to get a value expression if the parameter doesn't even have a type.
    if (typeNode === null) {
        return missingType();
    }
    if (!ts.isTypeReferenceNode(typeNode)) {
        return unsupportedType(typeNode);
    }
    const symbols = resolveTypeSymbols(typeNode, checker);
    if (symbols === null) {
        return unknownReference(typeNode);
    }
    const { local, decl } = symbols;
    // It's only valid to convert a type reference to a value reference if the type actually
    // has a value declaration associated with it. Note that const enums are an exception,
    // because while they do have a value declaration, they don't exist at runtime.
    if (decl.valueDeclaration === undefined || decl.flags & ts.SymbolFlags.ConstEnum) {
        let typeOnlyDecl = null;
        if (decl.declarations !== undefined && decl.declarations.length > 0) {
            typeOnlyDecl = decl.declarations[0];
        }
        // In local compilation mode a declaration is considered invalid only if it is a type related
        // declaration.
        if (!isLocalCompilation ||
            (typeOnlyDecl &&
                [
                    ts.SyntaxKind.TypeParameter,
                    ts.SyntaxKind.TypeAliasDeclaration,
                    ts.SyntaxKind.InterfaceDeclaration,
                ].includes(typeOnlyDecl.kind))) {
            return noValueDeclaration(typeNode, typeOnlyDecl);
        }
    }
    // The type points to a valid value declaration. Rewrite the TypeReference into an
    // Expression which references the value pointed to by the TypeReference, if possible.
    // Look at the local `ts.Symbol`'s declarations and see if it comes from an import
    // statement. If so, extract the module specifier and the name of the imported type.
    const firstDecl = local.declarations && local.declarations[0];
    if (firstDecl !== undefined) {
        if (ts.isImportClause(firstDecl) && firstDecl.name !== undefined) {
            // This is a default import.
            //   import Foo from 'foo';
            if (firstDecl.isTypeOnly) {
                // Type-only imports cannot be represented as value.
                return typeOnlyImport(typeNode, firstDecl);
            }
            if (!ts.isImportDeclaration(firstDecl.parent)) {
                return unsupportedType(typeNode);
            }
            return {
                kind: 0 /* TypeValueReferenceKind.LOCAL */,
                expression: firstDecl.name,
                defaultImportStatement: firstDecl.parent,
            };
        }
        else if (ts.isImportSpecifier(firstDecl)) {
            // The symbol was imported by name
            //   import {Foo} from 'foo';
            // or
            //   import {Foo as Bar} from 'foo';
            if (firstDecl.isTypeOnly) {
                // The import specifier can't be type-only (e.g. `import {type Foo} from '...')`.
                return typeOnlyImport(typeNode, firstDecl);
            }
            if (firstDecl.parent.parent.isTypeOnly) {
                // The import specifier can't be inside a type-only import clause
                // (e.g. `import type {Foo} from '...')`.
                return typeOnlyImport(typeNode, firstDecl.parent.parent);
            }
            // Determine the name to import (`Foo`) from the import specifier, as the symbol names of
            // the imported type could refer to a local alias (like `Bar` in the example above).
            const importedName = (firstDecl.propertyName || firstDecl.name).text;
            // The first symbol name refers to the local name, which is replaced by `importedName` above.
            // Any remaining symbol names make up the complete path to the value.
            const [_localName, ...nestedPath] = symbols.symbolNames;
            const importDeclaration = firstDecl.parent.parent.parent;
            if (!ts.isImportDeclaration(importDeclaration)) {
                return unsupportedType(typeNode);
            }
            const moduleName = extractModuleName(importDeclaration);
            return {
                kind: 1 /* TypeValueReferenceKind.IMPORTED */,
                valueDeclaration: decl.valueDeclaration ?? null,
                moduleName,
                importedName,
                nestedPath,
            };
        }
        else if (ts.isNamespaceImport(firstDecl)) {
            // The import is a namespace import
            //   import * as Foo from 'foo';
            if (firstDecl.parent.isTypeOnly) {
                // Type-only imports cannot be represented as value.
                return typeOnlyImport(typeNode, firstDecl.parent);
            }
            if (symbols.symbolNames.length === 1) {
                // The type refers to the namespace itself, which cannot be represented as a value.
                return namespaceImport(typeNode, firstDecl.parent);
            }
            // The first symbol name refers to the local name of the namespace, which is is discarded
            // as a new namespace import will be generated. This is followed by the symbol name that needs
            // to be imported and any remaining names that constitute the complete path to the value.
            const [_ns, importedName, ...nestedPath] = symbols.symbolNames;
            const importDeclaration = firstDecl.parent.parent;
            if (!ts.isImportDeclaration(importDeclaration)) {
                return unsupportedType(typeNode);
            }
            const moduleName = extractModuleName(importDeclaration);
            return {
                kind: 1 /* TypeValueReferenceKind.IMPORTED */,
                valueDeclaration: decl.valueDeclaration ?? null,
                moduleName,
                importedName,
                nestedPath,
            };
        }
    }
    // If the type is not imported, the type reference can be converted into an expression as is.
    const expression = typeNodeToValueExpr(typeNode);
    if (expression !== null) {
        return {
            kind: 0 /* TypeValueReferenceKind.LOCAL */,
            expression,
            defaultImportStatement: null,
        };
    }
    else {
        return unsupportedType(typeNode);
    }
}
function unsupportedType(typeNode) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 5 /* ValueUnavailableKind.UNSUPPORTED */, typeNode },
    };
}
function noValueDeclaration(typeNode, decl) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 1 /* ValueUnavailableKind.NO_VALUE_DECLARATION */, typeNode, decl },
    };
}
function typeOnlyImport(typeNode, node) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 2 /* ValueUnavailableKind.TYPE_ONLY_IMPORT */, typeNode, node },
    };
}
function unknownReference(typeNode) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 3 /* ValueUnavailableKind.UNKNOWN_REFERENCE */, typeNode },
    };
}
function namespaceImport(typeNode, importClause) {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 4 /* ValueUnavailableKind.NAMESPACE */, typeNode, importClause },
    };
}
function missingType() {
    return {
        kind: 2 /* TypeValueReferenceKind.UNAVAILABLE */,
        reason: { kind: 0 /* ValueUnavailableKind.MISSING_TYPE */ },
    };
}
/**
 * Attempt to extract a `ts.Expression` that's equivalent to a `ts.TypeNode`, as the two have
 * different AST shapes but can reference the same symbols.
 *
 * This will return `null` if an equivalent expression cannot be constructed.
 */
function typeNodeToValueExpr(node) {
    if (ts.isTypeReferenceNode(node)) {
        return entityNameToValue(node.typeName);
    }
    else {
        return null;
    }
}
/**
 * Resolve a `TypeReference` node to the `ts.Symbol`s for both its declaration and its local source.
 *
 * In the event that the `TypeReference` refers to a locally declared symbol, these will be the
 * same. If the `TypeReference` refers to an imported symbol, then `decl` will be the fully resolved
 * `ts.Symbol` of the referenced symbol. `local` will be the `ts.Symbol` of the `ts.Identifier`
 * which points to the import statement by which the symbol was imported.
 *
 * All symbol names that make up the type reference are returned left-to-right into the
 * `symbolNames` array, which is guaranteed to include at least one entry.
 */
function resolveTypeSymbols(typeRef, checker) {
    const typeName = typeRef.typeName;
    // typeRefSymbol is the ts.Symbol of the entire type reference.
    const typeRefSymbol = checker.getSymbolAtLocation(typeName);
    if (typeRefSymbol === undefined) {
        return null;
    }
    // `local` is the `ts.Symbol` for the local `ts.Identifier` for the type.
    // If the type is actually locally declared or is imported by name, for example:
    //   import {Foo} from './foo';
    // then it'll be the same as `typeRefSymbol`.
    //
    // If the type is imported via a namespace import, for example:
    //   import * as foo from './foo';
    // and then referenced as:
    //   constructor(f: foo.Foo)
    // then `local` will be the `ts.Symbol` of `foo`, whereas `typeRefSymbol` will be the `ts.Symbol`
    // of `foo.Foo`. This allows tracking of the import behind whatever type reference exists.
    let local = typeRefSymbol;
    // Destructure a name like `foo.X.Y.Z` as follows:
    // - in `leftMost`, the `ts.Identifier` of the left-most name (`foo`) in the qualified name.
    //   This identifier is used to resolve the `ts.Symbol` for `local`.
    // - in `symbolNames`, all names involved in the qualified path, or a single symbol name if the
    //   type is not qualified.
    let leftMost = typeName;
    const symbolNames = [];
    while (ts.isQualifiedName(leftMost)) {
        symbolNames.unshift(leftMost.right.text);
        leftMost = leftMost.left;
    }
    symbolNames.unshift(leftMost.text);
    if (leftMost !== typeName) {
        const localTmp = checker.getSymbolAtLocation(leftMost);
        if (localTmp !== undefined) {
            local = localTmp;
        }
    }
    // De-alias the top-level type reference symbol to get the symbol of the actual declaration.
    let decl = typeRefSymbol;
    if (typeRefSymbol.flags & ts.SymbolFlags.Alias) {
        decl = checker.getAliasedSymbol(typeRefSymbol);
    }
    return { local, decl, symbolNames };
}
function entityNameToValue(node) {
    if (ts.isQualifiedName(node)) {
        const left = entityNameToValue(node.left);
        return left !== null ? ts.factory.createPropertyAccessExpression(left, node.right) : null;
    }
    else if (ts.isIdentifier(node)) {
        const clone = ts.setOriginalNode(ts.factory.createIdentifier(node.text), node);
        clone.parent = node.parent;
        return clone;
    }
    else {
        return null;
    }
}
function extractModuleName(node) {
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
        throw new Error('not a module specifier');
    }
    return node.moduleSpecifier.text;
}

function isNamedClassDeclaration(node) {
    return ts.isClassDeclaration(node) && isIdentifier(node.name);
}
function isIdentifier(node) {
    return node !== undefined && ts.isIdentifier(node);
}
/**
 * Converts the given class member access level to a string.
 * Useful fo error messages.
 */
function classMemberAccessLevelToString(level) {
    switch (level) {
        case ClassMemberAccessLevel.EcmaScriptPrivate:
            return 'ES private';
        case ClassMemberAccessLevel.Private:
            return 'private';
        case ClassMemberAccessLevel.Protected:
            return 'protected';
        case ClassMemberAccessLevel.PublicReadonly:
            return 'public readonly';
        case ClassMemberAccessLevel.PublicWritable:
        default:
            return 'public';
    }
}

/**
 * reflector.ts implements static reflection of declarations using the TypeScript `ts.TypeChecker`.
 */
class TypeScriptReflectionHost {
    checker;
    isLocalCompilation;
    skipPrivateValueDeclarationTypes;
    /**
     * @param skipPrivateValueDeclarationTypes Avoids using a value declaration that is considered private (using a ɵ-prefix),
     * instead using the first available declaration. This is needed for the {@link FormControl} API of
     * which the type declaration documents the type and the value declaration corresponds with an implementation detail.
     */
    constructor(checker, isLocalCompilation = false, skipPrivateValueDeclarationTypes = false) {
        this.checker = checker;
        this.isLocalCompilation = isLocalCompilation;
        this.skipPrivateValueDeclarationTypes = skipPrivateValueDeclarationTypes;
    }
    getDecoratorsOfDeclaration(declaration) {
        const decorators = ts.canHaveDecorators(declaration)
            ? ts.getDecorators(declaration)
            : undefined;
        return decorators !== undefined && decorators.length
            ? decorators
                .map((decorator) => this._reflectDecorator(decorator))
                .filter((dec) => dec !== null)
            : null;
    }
    getMembersOfClass(clazz) {
        const tsClazz = castDeclarationToClassOrDie(clazz);
        return tsClazz.members
            .map((member) => {
            const result = reflectClassMember(member);
            if (result === null) {
                return null;
            }
            return {
                ...result,
                decorators: this.getDecoratorsOfDeclaration(member),
            };
        })
            .filter((member) => member !== null);
    }
    getConstructorParameters(clazz) {
        const tsClazz = castDeclarationToClassOrDie(clazz);
        const isDeclaration = tsClazz.getSourceFile().isDeclarationFile;
        // For non-declaration files, we want to find the constructor with a `body`. The constructors
        // without a `body` are overloads whereas we want the implementation since it's the one that'll
        // be executed and which can have decorators. For declaration files, we take the first one that
        // we get.
        const ctor = tsClazz.members.find((member) => ts.isConstructorDeclaration(member) && (isDeclaration || member.body !== undefined));
        if (ctor === undefined) {
            return null;
        }
        return ctor.parameters.map((node) => {
            // The name of the parameter is easy.
            const name = parameterName(node.name);
            const decorators = this.getDecoratorsOfDeclaration(node);
            // It may or may not be possible to write an expression that refers to the value side of the
            // type named for the parameter.
            let originalTypeNode = node.type || null;
            let typeNode = originalTypeNode;
            // Check if we are dealing with a simple nullable union type e.g. `foo: Foo|null`
            // and extract the type. More complex union types e.g. `foo: Foo|Bar` are not supported.
            // We also don't need to support `foo: Foo|undefined` because Angular's DI injects `null` for
            // optional tokes that don't have providers.
            if (typeNode && ts.isUnionTypeNode(typeNode)) {
                let childTypeNodes = typeNode.types.filter((childTypeNode) => !(ts.isLiteralTypeNode(childTypeNode) &&
                    childTypeNode.literal.kind === ts.SyntaxKind.NullKeyword));
                if (childTypeNodes.length === 1) {
                    typeNode = childTypeNodes[0];
                }
            }
            const typeValueReference = typeToValue(typeNode, this.checker, this.isLocalCompilation);
            return {
                name,
                nameNode: node.name,
                typeValueReference,
                typeNode: originalTypeNode,
                decorators,
            };
        });
    }
    getImportOfIdentifier(id) {
        const directImport = this.getDirectImportOfIdentifier(id);
        if (directImport !== null) {
            return directImport;
        }
        else if (ts.isQualifiedName(id.parent) && id.parent.right === id) {
            return this.getImportOfNamespacedIdentifier(id, getQualifiedNameRoot(id.parent));
        }
        else if (ts.isPropertyAccessExpression(id.parent) && id.parent.name === id) {
            return this.getImportOfNamespacedIdentifier(id, getFarLeftIdentifier(id.parent));
        }
        else {
            return null;
        }
    }
    getExportsOfModule(node) {
        // In TypeScript code, modules are only ts.SourceFiles. Throw if the node isn't a module.
        if (!ts.isSourceFile(node)) {
            throw new Error(`getExportsOfModule() called on non-SourceFile in TS code`);
        }
        // Reflect the module to a Symbol, and use getExportsOfModule() to get a list of exported
        // Symbols.
        const symbol = this.checker.getSymbolAtLocation(node);
        if (symbol === undefined) {
            return null;
        }
        const map = new Map();
        this.checker.getExportsOfModule(symbol).forEach((exportSymbol) => {
            // Map each exported Symbol to a Declaration and add it to the map.
            const decl = this.getDeclarationOfSymbol(exportSymbol, null);
            if (decl !== null) {
                map.set(exportSymbol.name, decl);
            }
        });
        return map;
    }
    isClass(node) {
        // For our purposes, classes are "named" ts.ClassDeclarations;
        // (`node.name` can be undefined in unnamed default exports: `default export class { ... }`).
        return isNamedClassDeclaration(node);
    }
    hasBaseClass(clazz) {
        return this.getBaseClassExpression(clazz) !== null;
    }
    getBaseClassExpression(clazz) {
        if (!(ts.isClassDeclaration(clazz) || ts.isClassExpression(clazz)) ||
            clazz.heritageClauses === undefined) {
            return null;
        }
        const extendsClause = clazz.heritageClauses.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
        if (extendsClause === undefined) {
            return null;
        }
        const extendsType = extendsClause.types[0];
        if (extendsType === undefined) {
            return null;
        }
        return extendsType.expression;
    }
    getDeclarationOfIdentifier(id) {
        // Resolve the identifier to a Symbol, and return the declaration of that.
        let symbol = this.checker.getSymbolAtLocation(id);
        if (symbol === undefined) {
            return null;
        }
        return this.getDeclarationOfSymbol(symbol, id);
    }
    getDefinitionOfFunction(node) {
        if (!ts.isFunctionDeclaration(node) &&
            !ts.isMethodDeclaration(node) &&
            !ts.isFunctionExpression(node) &&
            !ts.isArrowFunction(node)) {
            return null;
        }
        let body = null;
        if (node.body !== undefined) {
            // The body might be an expression if the node is an arrow function.
            body = ts.isBlock(node.body)
                ? Array.from(node.body.statements)
                : [ts.factory.createReturnStatement(node.body)];
        }
        const type = this.checker.getTypeAtLocation(node);
        const signatures = this.checker.getSignaturesOfType(type, ts.SignatureKind.Call);
        return {
            node,
            body,
            signatureCount: signatures.length,
            typeParameters: node.typeParameters === undefined ? null : Array.from(node.typeParameters),
            parameters: node.parameters.map((param) => {
                const name = parameterName(param.name);
                const initializer = param.initializer || null;
                return { name, node: param, initializer, type: param.type || null };
            }),
        };
    }
    getGenericArityOfClass(clazz) {
        if (!ts.isClassDeclaration(clazz)) {
            return null;
        }
        return clazz.typeParameters !== undefined ? clazz.typeParameters.length : 0;
    }
    getVariableValue(declaration) {
        return declaration.initializer || null;
    }
    isStaticallyExported(decl) {
        // First check if there's an `export` modifier directly on the declaration.
        let topLevel = decl;
        if (ts.isVariableDeclaration(decl) && ts.isVariableDeclarationList(decl.parent)) {
            topLevel = decl.parent.parent;
        }
        const modifiers = ts.canHaveModifiers(topLevel) ? ts.getModifiers(topLevel) : undefined;
        if (modifiers !== undefined &&
            modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
            // The node is part of a declaration that's directly exported.
            return true;
        }
        // If `topLevel` is not directly exported via a modifier, then it might be indirectly exported,
        // e.g.:
        //
        // class Foo {}
        // export {Foo};
        //
        // The only way to check this is to look at the module level for exports of the class. As a
        // performance optimization, this check is only performed if the class is actually declared at
        // the top level of the file and thus eligible for exporting in the first place.
        if (topLevel.parent === undefined || !ts.isSourceFile(topLevel.parent)) {
            return false;
        }
        const localExports = this.getLocalExportedDeclarationsOfSourceFile(decl.getSourceFile());
        return localExports.has(decl);
    }
    getDirectImportOfIdentifier(id) {
        const symbol = this.checker.getSymbolAtLocation(id);
        if (symbol === undefined ||
            symbol.declarations === undefined ||
            symbol.declarations.length !== 1) {
            return null;
        }
        const decl = symbol.declarations[0];
        const importDecl = getContainingImportDeclaration(decl);
        // Ignore declarations that are defined locally (not imported).
        if (importDecl === null) {
            return null;
        }
        // The module specifier is guaranteed to be a string literal, so this should always pass.
        if (!ts.isStringLiteral(importDecl.moduleSpecifier)) {
            // Not allowed to happen in TypeScript ASTs.
            return null;
        }
        return {
            from: importDecl.moduleSpecifier.text,
            name: getExportedName(decl, id),
            node: importDecl,
        };
    }
    /**
     * Try to get the import info for this identifier as though it is a namespaced import.
     *
     * For example, if the identifier is the `Directive` part of a qualified type chain like:
     *
     * ```ts
     * core.Directive
     * ```
     *
     * then it might be that `core` is a namespace import such as:
     *
     * ```ts
     * import * as core from 'tslib';
     * ```
     *
     * @param id the TypeScript identifier to find the import info for.
     * @returns The import info if this is a namespaced import or `null`.
     */
    getImportOfNamespacedIdentifier(id, namespaceIdentifier) {
        if (namespaceIdentifier === null) {
            return null;
        }
        const namespaceSymbol = this.checker.getSymbolAtLocation(namespaceIdentifier);
        if (!namespaceSymbol || namespaceSymbol.declarations === undefined) {
            return null;
        }
        const declaration = namespaceSymbol.declarations.length === 1 ? namespaceSymbol.declarations[0] : null;
        if (!declaration) {
            return null;
        }
        const namespaceDeclaration = ts.isNamespaceImport(declaration) ? declaration : null;
        if (!namespaceDeclaration) {
            return null;
        }
        const importDeclaration = namespaceDeclaration.parent.parent;
        if (!ts.isImportDeclaration(importDeclaration) ||
            !ts.isStringLiteral(importDeclaration.moduleSpecifier)) {
            // Should not happen as this would be invalid TypesScript
            return null;
        }
        return {
            from: importDeclaration.moduleSpecifier.text,
            name: id.text,
            node: importDeclaration,
        };
    }
    /**
     * Resolve a `ts.Symbol` to its declaration, keeping track of the `viaModule` along the way.
     */
    getDeclarationOfSymbol(symbol, originalId) {
        // If the symbol points to a ShorthandPropertyAssignment, resolve it.
        let valueDeclaration = undefined;
        if (symbol.valueDeclaration !== undefined) {
            valueDeclaration = symbol.valueDeclaration;
        }
        else if (symbol.declarations !== undefined && symbol.declarations.length > 0) {
            valueDeclaration = symbol.declarations[0];
        }
        if (valueDeclaration !== undefined && ts.isShorthandPropertyAssignment(valueDeclaration)) {
            const shorthandSymbol = this.checker.getShorthandAssignmentValueSymbol(valueDeclaration);
            if (shorthandSymbol === undefined) {
                return null;
            }
            return this.getDeclarationOfSymbol(shorthandSymbol, originalId);
        }
        else if (valueDeclaration !== undefined && ts.isExportSpecifier(valueDeclaration)) {
            const targetSymbol = this.checker.getExportSpecifierLocalTargetSymbol(valueDeclaration);
            if (targetSymbol === undefined) {
                return null;
            }
            return this.getDeclarationOfSymbol(targetSymbol, originalId);
        }
        const importInfo = originalId && this.getImportOfIdentifier(originalId);
        // Now, resolve the Symbol to its declaration by following any and all aliases.
        while (symbol.flags & ts.SymbolFlags.Alias) {
            symbol = this.checker.getAliasedSymbol(symbol);
        }
        // Look at the resolved Symbol's declarations and pick one of them to return.
        // Value declarations are given precedence over type declarations if not specified otherwise
        if (symbol.valueDeclaration !== undefined &&
            (!this.skipPrivateValueDeclarationTypes || !isPrivateSymbol(this.checker, symbol))) {
            return {
                node: symbol.valueDeclaration,
                viaModule: this._viaModule(symbol.valueDeclaration, originalId, importInfo),
            };
        }
        else if (symbol.declarations !== undefined && symbol.declarations.length > 0) {
            return {
                node: symbol.declarations[0],
                viaModule: this._viaModule(symbol.declarations[0], originalId, importInfo),
            };
        }
        else {
            return null;
        }
    }
    _reflectDecorator(node) {
        // Attempt to resolve the decorator expression into a reference to a concrete Identifier. The
        // expression may contain a call to a function which returns the decorator function, in which
        // case we want to return the arguments.
        let decoratorExpr = node.expression;
        let args = null;
        // Check for call expressions.
        if (ts.isCallExpression(decoratorExpr)) {
            args = Array.from(decoratorExpr.arguments);
            decoratorExpr = decoratorExpr.expression;
        }
        // The final resolved decorator should be a `ts.Identifier` - if it's not, then something is
        // wrong and the decorator can't be resolved statically.
        if (!isDecoratorIdentifier(decoratorExpr)) {
            return null;
        }
        const decoratorIdentifier = ts.isIdentifier(decoratorExpr) ? decoratorExpr : decoratorExpr.name;
        const importDecl = this.getImportOfIdentifier(decoratorIdentifier);
        return {
            name: decoratorIdentifier.text,
            identifier: decoratorExpr,
            import: importDecl,
            node,
            args,
        };
    }
    /**
     * Get the set of declarations declared in `file` which are exported.
     */
    getLocalExportedDeclarationsOfSourceFile(file) {
        const cacheSf = file;
        if (cacheSf[LocalExportedDeclarations] !== undefined) {
            // TS does not currently narrow symbol-keyed fields, hence the non-null assert is needed.
            return cacheSf[LocalExportedDeclarations];
        }
        const exportSet = new Set();
        cacheSf[LocalExportedDeclarations] = exportSet;
        const sfSymbol = this.checker.getSymbolAtLocation(cacheSf);
        if (sfSymbol === undefined || sfSymbol.exports === undefined) {
            return exportSet;
        }
        // Scan the exported symbol of the `ts.SourceFile` for the original `symbol` of the class
        // declaration.
        //
        // Note: when checking multiple classes declared in the same file, this repeats some operations.
        // In theory, this could be expensive if run in the context of a massive input file. If
        // performance does become an issue here, it should be possible to create a `Set<>`
        // Unfortunately, `ts.Iterator` doesn't implement the iterator protocol, so iteration here is
        // done manually.
        const iter = sfSymbol.exports.values();
        let item = iter.next();
        while (item.done !== true) {
            let exportedSymbol = item.value;
            // If this exported symbol comes from an `export {Foo}` statement, then the symbol is actually
            // for the export declaration, not the original declaration. Such a symbol will be an alias,
            // so unwrap aliasing if necessary.
            if (exportedSymbol.flags & ts.SymbolFlags.Alias) {
                exportedSymbol = this.checker.getAliasedSymbol(exportedSymbol);
            }
            if (exportedSymbol.valueDeclaration !== undefined &&
                exportedSymbol.valueDeclaration.getSourceFile() === file) {
                exportSet.add(exportedSymbol.valueDeclaration);
            }
            item = iter.next();
        }
        return exportSet;
    }
    _viaModule(declaration, originalId, importInfo) {
        if (importInfo === null &&
            originalId !== null &&
            declaration.getSourceFile() !== originalId.getSourceFile()) {
            return AmbientImport;
        }
        return importInfo !== null && importInfo.from !== null && !importInfo.from.startsWith('.')
            ? importInfo.from
            : null;
    }
}
class TypeEntityToDeclarationError extends Error {
    constructor(message) {
        super(message);
        // Extending `Error` ends up breaking some internal tests. This appears to be a known issue
        // when extending errors in TS and the workaround is to explicitly set the prototype.
        // https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
/**
 * @throws {TypeEntityToDeclarationError} if the type cannot be converted
 *   to a declaration.
 */
function reflectTypeEntityToDeclaration(type, checker) {
    let realSymbol = checker.getSymbolAtLocation(type);
    if (realSymbol === undefined) {
        throw new TypeEntityToDeclarationError(`Cannot resolve type entity ${type.getText()} to symbol`);
    }
    while (realSymbol.flags & ts.SymbolFlags.Alias) {
        realSymbol = checker.getAliasedSymbol(realSymbol);
    }
    let node = null;
    if (realSymbol.valueDeclaration !== undefined) {
        node = realSymbol.valueDeclaration;
    }
    else if (realSymbol.declarations !== undefined && realSymbol.declarations.length === 1) {
        node = realSymbol.declarations[0];
    }
    else {
        throw new TypeEntityToDeclarationError(`Cannot resolve type entity symbol to declaration`);
    }
    if (ts.isQualifiedName(type)) {
        if (!ts.isIdentifier(type.left)) {
            throw new TypeEntityToDeclarationError(`Cannot handle qualified name with non-identifier lhs`);
        }
        const symbol = checker.getSymbolAtLocation(type.left);
        if (symbol === undefined ||
            symbol.declarations === undefined ||
            symbol.declarations.length !== 1) {
            throw new TypeEntityToDeclarationError(`Cannot resolve qualified type entity lhs to symbol`);
        }
        const decl = symbol.declarations[0];
        if (ts.isNamespaceImport(decl)) {
            const clause = decl.parent;
            const importDecl = clause.parent;
            if (!ts.isStringLiteral(importDecl.moduleSpecifier)) {
                throw new TypeEntityToDeclarationError(`Module specifier is not a string`);
            }
            return { node, from: importDecl.moduleSpecifier.text };
        }
        else if (ts.isModuleDeclaration(decl)) {
            return { node, from: null };
        }
        else {
            throw new TypeEntityToDeclarationError(`Unknown import type?`);
        }
    }
    else {
        return { node, from: null };
    }
}
function filterToMembersWithDecorator(members, name, module) {
    return members
        .filter((member) => !member.isStatic)
        .map((member) => {
        if (member.decorators === null) {
            return null;
        }
        const decorators = member.decorators.filter((dec) => {
            if (dec.import !== null) {
                return dec.import.name === name && (module === undefined || dec.import.from === module);
            }
            else {
                return dec.name === name && module === undefined;
            }
        });
        if (decorators.length === 0) {
            return null;
        }
        return { member, decorators };
    })
        .filter((value) => value !== null);
}
function extractModifiersOfMember(node) {
    const modifiers = ts.getModifiers(node);
    let isStatic = false;
    let isReadonly = false;
    let accessLevel = ClassMemberAccessLevel.PublicWritable;
    if (modifiers !== undefined) {
        for (const modifier of modifiers) {
            switch (modifier.kind) {
                case ts.SyntaxKind.StaticKeyword:
                    isStatic = true;
                    break;
                case ts.SyntaxKind.PrivateKeyword:
                    accessLevel = ClassMemberAccessLevel.Private;
                    break;
                case ts.SyntaxKind.ProtectedKeyword:
                    accessLevel = ClassMemberAccessLevel.Protected;
                    break;
                case ts.SyntaxKind.ReadonlyKeyword:
                    isReadonly = true;
                    break;
            }
        }
    }
    if (isReadonly && accessLevel === ClassMemberAccessLevel.PublicWritable) {
        accessLevel = ClassMemberAccessLevel.PublicReadonly;
    }
    if (node.name !== undefined && ts.isPrivateIdentifier(node.name)) {
        accessLevel = ClassMemberAccessLevel.EcmaScriptPrivate;
    }
    return { accessLevel, isStatic };
}
/**
 * Reflects a class element and returns static information about the
 * class member.
 *
 * Note: Decorator information is not included in this helper as it relies
 * on type checking to resolve originating import.
 */
function reflectClassMember(node) {
    let kind = null;
    let value = null;
    let name = null;
    let nameNode = null;
    if (ts.isPropertyDeclaration(node)) {
        kind = exports.ClassMemberKind.Property;
        value = node.initializer || null;
    }
    else if (ts.isGetAccessorDeclaration(node)) {
        kind = exports.ClassMemberKind.Getter;
    }
    else if (ts.isSetAccessorDeclaration(node)) {
        kind = exports.ClassMemberKind.Setter;
    }
    else if (ts.isMethodDeclaration(node)) {
        kind = exports.ClassMemberKind.Method;
    }
    else if (ts.isConstructorDeclaration(node)) {
        kind = exports.ClassMemberKind.Constructor;
    }
    else {
        return null;
    }
    if (ts.isConstructorDeclaration(node)) {
        name = 'constructor';
    }
    else if (ts.isIdentifier(node.name)) {
        name = node.name.text;
        nameNode = node.name;
    }
    else if (ts.isStringLiteral(node.name)) {
        name = node.name.text;
        nameNode = node.name;
    }
    else if (ts.isPrivateIdentifier(node.name)) {
        name = node.name.text;
        nameNode = node.name;
    }
    else {
        return null;
    }
    const { accessLevel, isStatic } = extractModifiersOfMember(node);
    return {
        node,
        implementation: node,
        kind,
        type: node.type || null,
        accessLevel,
        name,
        nameNode,
        value,
        isStatic,
    };
}
function reflectObjectLiteral(node) {
    const map = new Map();
    node.properties.forEach((prop) => {
        if (ts.isPropertyAssignment(prop)) {
            const name = propertyNameToString(prop.name);
            if (name === null) {
                return;
            }
            map.set(name, prop.initializer);
        }
        else if (ts.isShorthandPropertyAssignment(prop)) {
            map.set(prop.name.text, prop.name);
        }
        else {
            return;
        }
    });
    return map;
}
function castDeclarationToClassOrDie(declaration) {
    if (!ts.isClassDeclaration(declaration)) {
        throw new Error(`Reflecting on a ${ts.SyntaxKind[declaration.kind]} instead of a ClassDeclaration.`);
    }
    return declaration;
}
function parameterName(name) {
    if (ts.isIdentifier(name)) {
        return name.text;
    }
    else {
        return null;
    }
}
function propertyNameToString(node) {
    if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
        return node.text;
    }
    else {
        return null;
    }
}
/** Determines whether a given symbol represents a private API (symbols with names that start with `ɵ`) */
function isPrivateSymbol(typeChecker, symbol) {
    if (symbol.valueDeclaration !== undefined) {
        const symbolType = typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        return symbolType?.symbol?.name.startsWith('ɵ') === true;
    }
    return false;
}
/**
 * Compute the left most identifier in a qualified type chain. E.g. the `a` of `a.b.c.SomeType`.
 * @param qualifiedName The starting property access expression from which we want to compute
 * the left most identifier.
 * @returns the left most identifier in the chain or `null` if it is not an identifier.
 */
function getQualifiedNameRoot(qualifiedName) {
    while (ts.isQualifiedName(qualifiedName.left)) {
        qualifiedName = qualifiedName.left;
    }
    return ts.isIdentifier(qualifiedName.left) ? qualifiedName.left : null;
}
/**
 * Compute the left most identifier in a property access chain. E.g. the `a` of `a.b.c.d`.
 * @param propertyAccess The starting property access expression from which we want to compute
 * the left most identifier.
 * @returns the left most identifier in the chain or `null` if it is not an identifier.
 */
function getFarLeftIdentifier(propertyAccess) {
    while (ts.isPropertyAccessExpression(propertyAccess.expression)) {
        propertyAccess = propertyAccess.expression;
    }
    return ts.isIdentifier(propertyAccess.expression) ? propertyAccess.expression : null;
}
/**
 * Gets the closest ancestor `ImportDeclaration` to a node.
 */
function getContainingImportDeclaration(node) {
    let parent = node.parent;
    while (parent && !ts.isSourceFile(parent)) {
        if (ts.isImportDeclaration(parent)) {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
}
/**
 * Compute the name by which the `decl` was exported, not imported.
 * If no such declaration can be found (e.g. it is a namespace import)
 * then fallback to the `originalId`.
 */
function getExportedName(decl, originalId) {
    return ts.isImportSpecifier(decl)
        ? (decl.propertyName !== undefined ? decl.propertyName : decl.name).text
        : originalId.text;
}
const LocalExportedDeclarations = Symbol('LocalExportedDeclarations');

/**
 * A `ts.Node` plus the context in which it was discovered.
 *
 * A `Reference` is a pointer to a `ts.Node` that was extracted from the program somehow. It
 * contains not only the node itself, but the information regarding how the node was located. In
 * particular, it might track different identifiers by which the node is exposed, as well as
 * potentially a module specifier which might expose the node.
 *
 * The Angular compiler uses `Reference`s instead of `ts.Node`s when tracking classes or generating
 * imports.
 */
class Reference {
    node;
    /**
     * The compiler's best guess at an absolute module specifier which owns this `Reference`.
     *
     * This is usually determined by tracking the import statements which led the compiler to a given
     * node. If any of these imports are absolute, it's an indication that the node being imported
     * might come from that module.
     *
     * It is not _guaranteed_ that the node in question is exported from its `bestGuessOwningModule` -
     * that is mostly a convention that applies in certain package formats.
     *
     * If `bestGuessOwningModule` is `null`, then it's likely the node came from the current program.
     */
    bestGuessOwningModule;
    identifiers = [];
    /**
     * Indicates that the Reference was created synthetically, not as a result of natural value
     * resolution.
     *
     * This is used to avoid misinterpreting the Reference in certain contexts.
     */
    synthetic = false;
    _alias = null;
    isAmbient;
    constructor(node, bestGuessOwningModule = null) {
        this.node = node;
        if (bestGuessOwningModule === AmbientImport) {
            this.isAmbient = true;
            this.bestGuessOwningModule = null;
        }
        else {
            this.isAmbient = false;
            this.bestGuessOwningModule = bestGuessOwningModule;
        }
        const id = identifierOfNode(node);
        if (id !== null) {
            this.identifiers.push(id);
        }
    }
    /**
     * The best guess at which module specifier owns this particular reference, or `null` if there
     * isn't one.
     */
    get ownedByModuleGuess() {
        if (this.bestGuessOwningModule !== null) {
            return this.bestGuessOwningModule.specifier;
        }
        else {
            return null;
        }
    }
    /**
     * Whether this reference has a potential owning module or not.
     *
     * See `bestGuessOwningModule`.
     */
    get hasOwningModuleGuess() {
        return this.bestGuessOwningModule !== null;
    }
    /**
     * A name for the node, if one is available.
     *
     * This is only suited for debugging. Any actual references to this node should be made with
     * `ts.Identifier`s (see `getIdentityIn`).
     */
    get debugName() {
        const id = identifierOfNode(this.node);
        return id !== null ? id.text : null;
    }
    get alias() {
        return this._alias;
    }
    /**
     * Record a `ts.Identifier` by which it's valid to refer to this node, within the context of this
     * `Reference`.
     */
    addIdentifier(identifier) {
        this.identifiers.push(identifier);
    }
    /**
     * Get a `ts.Identifier` within this `Reference` that can be used to refer within the context of a
     * given `ts.SourceFile`, if any.
     */
    getIdentityIn(context) {
        return this.identifiers.find((id) => id.getSourceFile() === context) || null;
    }
    /**
     * Get a `ts.Identifier` for this `Reference` that exists within the given expression.
     *
     * This is very useful for producing `ts.Diagnostic`s that reference `Reference`s that were
     * extracted from some larger expression, as it can be used to pinpoint the `ts.Identifier` within
     * the expression from which the `Reference` originated.
     */
    getIdentityInExpression(expr) {
        const sf = expr.getSourceFile();
        return (this.identifiers.find((id) => {
            if (id.getSourceFile() !== sf) {
                return false;
            }
            // This identifier is a match if its position lies within the given expression.
            return id.pos >= expr.pos && id.end <= expr.end;
        }) || null);
    }
    /**
     * Given the 'container' expression from which this `Reference` was extracted, produce a
     * `ts.Expression` to use in a diagnostic which best indicates the position within the container
     * expression that generated the `Reference`.
     *
     * For example, given a `Reference` to the class 'Bar' and the containing expression:
     * `[Foo, Bar, Baz]`, this function would attempt to return the `ts.Identifier` for `Bar` within
     * the array. This could be used to produce a nice diagnostic context:
     *
     * ```text
     * [Foo, Bar, Baz]
     *       ~~~
     * ```
     *
     * If no specific node can be found, then the `fallback` expression is used, which defaults to the
     * entire containing expression.
     */
    getOriginForDiagnostics(container, fallback = container) {
        const id = this.getIdentityInExpression(container);
        return id !== null ? id : fallback;
    }
    cloneWithAlias(alias) {
        const ref = new Reference(this.node, this.isAmbient ? AmbientImport : this.bestGuessOwningModule);
        ref.identifiers = [...this.identifiers];
        ref._alias = alias;
        return ref;
    }
    cloneWithNoIdentifiers() {
        const ref = new Reference(this.node, this.isAmbient ? AmbientImport : this.bestGuessOwningModule);
        ref._alias = this._alias;
        ref.identifiers = [];
        return ref;
    }
}

/** Module name of the framework core. */
const CORE_MODULE = '@angular/core';
function valueReferenceToExpression(valueRef) {
    if (valueRef.kind === 2 /* TypeValueReferenceKind.UNAVAILABLE */) {
        return null;
    }
    else if (valueRef.kind === 0 /* TypeValueReferenceKind.LOCAL */) {
        const expr = new compiler.WrappedNodeExpr(valueRef.expression);
        if (valueRef.defaultImportStatement !== null) {
            attachDefaultImportDeclaration(expr, valueRef.defaultImportStatement);
        }
        return expr;
    }
    else {
        let importExpr = new compiler.ExternalExpr({
            moduleName: valueRef.moduleName,
            name: valueRef.importedName,
        });
        if (valueRef.nestedPath !== null) {
            for (const property of valueRef.nestedPath) {
                importExpr = new compiler.ReadPropExpr(importExpr, property);
            }
        }
        return importExpr;
    }
}
function toR3Reference(origin, ref, context, refEmitter) {
    const emittedValueRef = refEmitter.emit(ref, context);
    assertSuccessfulReferenceEmit(emittedValueRef, origin, 'class');
    const emittedTypeRef = refEmitter.emit(ref, context, exports.ImportFlags.ForceNewImport | exports.ImportFlags.AllowTypeImports);
    assertSuccessfulReferenceEmit(emittedTypeRef, origin, 'class');
    return {
        value: emittedValueRef.expression,
        type: emittedTypeRef.expression,
    };
}
function isAngularCore(decorator) {
    return decorator.import !== null && decorator.import.from === CORE_MODULE;
}
/**
 * This function is used for verifying that a given reference is declared
 * inside `@angular/core` and corresponds to the given symbol name.
 *
 * In some cases, due to the compiler face duplicating many symbols as
 * an independent bridge between core and the compiler, the dts bundler may
 * decide to alias declarations in the `.d.ts`, to avoid conflicts.
 *
 * e.g.
 *
 * ```
 * declare enum ViewEncapsulation {} // from the facade
 * declare enum ViewEncapsulation$1 {} // the real one exported to users.
 * ```
 *
 * This function accounts for such potential re-namings.
 */
function isAngularCoreReferenceWithPotentialAliasing(reference, symbolName, isCore) {
    return ((reference.ownedByModuleGuess === CORE_MODULE || isCore) &&
        reference.debugName?.replace(/\$\d+$/, '') === symbolName);
}
function findAngularDecorator(decorators, name, isCore) {
    return decorators.find((decorator) => isAngularDecorator(decorator, name, isCore));
}
function isAngularDecorator(decorator, name, isCore) {
    if (isCore) {
        return decorator.name === name;
    }
    else if (isAngularCore(decorator)) {
        return decorator.import.name === name;
    }
    return false;
}
function getAngularDecorators(decorators, names, isCore) {
    return decorators.filter((decorator) => {
        const name = isCore ? decorator.name : decorator.import?.name;
        if (name === undefined || !names.includes(name)) {
            return false;
        }
        return isCore || isAngularCore(decorator);
    });
}
/**
 * Unwrap a `ts.Expression`, removing outer type-casts or parentheses until the expression is in its
 * lowest level form.
 *
 * For example, the expression "(foo as Type)" unwraps to "foo".
 */
function unwrapExpression(node) {
    while (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) {
        node = node.expression;
    }
    return node;
}
function expandForwardRef(arg) {
    arg = unwrapExpression(arg);
    if (!ts.isArrowFunction(arg) && !ts.isFunctionExpression(arg)) {
        return null;
    }
    const body = arg.body;
    // Either the body is a ts.Expression directly, or a block with a single return statement.
    if (ts.isBlock(body)) {
        // Block body - look for a single return statement.
        if (body.statements.length !== 1) {
            return null;
        }
        const stmt = body.statements[0];
        if (!ts.isReturnStatement(stmt) || stmt.expression === undefined) {
            return null;
        }
        return stmt.expression;
    }
    else {
        // Shorthand body - return as an expression.
        return body;
    }
}
/**
 * If the given `node` is a forwardRef() expression then resolve its inner value, otherwise return
 * `null`.
 *
 * @param node the forwardRef() expression to resolve
 * @param reflector a ReflectionHost
 * @returns the resolved expression, if the original expression was a forwardRef(), or `null`
 *     otherwise.
 */
function tryUnwrapForwardRef(node, reflector) {
    node = unwrapExpression(node);
    if (!ts.isCallExpression(node) || node.arguments.length !== 1) {
        return null;
    }
    const fn = ts.isPropertyAccessExpression(node.expression)
        ? node.expression.name
        : node.expression;
    if (!ts.isIdentifier(fn)) {
        return null;
    }
    const expr = expandForwardRef(node.arguments[0]);
    if (expr === null) {
        return null;
    }
    const imp = reflector.getImportOfIdentifier(fn);
    if (imp === null || imp.from !== '@angular/core' || imp.name !== 'forwardRef') {
        return null;
    }
    return expr;
}
/**
 * A foreign function resolver for `staticallyResolve` which unwraps forwardRef() expressions.
 *
 * @param ref a Reference to the declaration of the function being called (which might be
 * forwardRef)
 * @param args the arguments to the invocation of the forwardRef expression
 * @returns an unwrapped argument if `ref` pointed to forwardRef, or null otherwise
 */
function createForwardRefResolver(isCore) {
    return (fn, callExpr, resolve, unresolvable) => {
        if (!isAngularCoreReferenceWithPotentialAliasing(fn, 'forwardRef', isCore) ||
            callExpr.arguments.length !== 1) {
            return unresolvable;
        }
        const expanded = expandForwardRef(callExpr.arguments[0]);
        if (expanded !== null) {
            return resolve(expanded);
        }
        else {
            return unresolvable;
        }
    };
}
/**
 * Combines an array of resolver functions into a one.
 * @param resolvers Resolvers to be combined.
 */
function combineResolvers(resolvers) {
    return (fn, callExpr, resolve, unresolvable) => {
        for (const resolver of resolvers) {
            const resolved = resolver(fn, callExpr, resolve, unresolvable);
            if (resolved !== unresolvable) {
                return resolved;
            }
        }
        return unresolvable;
    };
}
function isExpressionForwardReference(expr, context, contextSource) {
    if (isWrappedTsNodeExpr(expr)) {
        const node = ts.getOriginalNode(expr.node);
        return node.getSourceFile() === contextSource && context.pos < node.pos;
    }
    else {
        return false;
    }
}
function isWrappedTsNodeExpr(expr) {
    return expr instanceof compiler.WrappedNodeExpr;
}
function readBaseClass(node, reflector, evaluator) {
    const baseExpression = reflector.getBaseClassExpression(node);
    if (baseExpression !== null) {
        const baseClass = evaluator.evaluate(baseExpression);
        if (baseClass instanceof Reference && reflector.isClass(baseClass.node)) {
            return baseClass;
        }
        else {
            return 'dynamic';
        }
    }
    return null;
}
const parensWrapperTransformerFactory = (context) => {
    const visitor = (node) => {
        const visited = ts.visitEachChild(node, visitor, context);
        if (ts.isArrowFunction(visited) || ts.isFunctionExpression(visited)) {
            return ts.factory.createParenthesizedExpression(visited);
        }
        return visited;
    };
    return (node) => ts.visitEachChild(node, visitor, context);
};
/**
 * Wraps all functions in a given expression in parentheses. This is needed to avoid problems
 * where Tsickle annotations added between analyse and transform phases in Angular may trigger
 * automatic semicolon insertion, e.g. if a function is the expression in a `return` statement.
 * More
 * info can be found in Tsickle source code here:
 * https://github.com/angular/tsickle/blob/d7974262571c8a17d684e5ba07680e1b1993afdd/src/jsdoc_transformer.ts#L1021
 *
 * @param expression Expression where functions should be wrapped in parentheses
 */
function wrapFunctionExpressionsInParens(expression) {
    return ts.transform(expression, [parensWrapperTransformerFactory]).transformed[0];
}
/**
 * Resolves the given `rawProviders` into `ClassDeclarations` and returns
 * a set containing those that are known to require a factory definition.
 * @param rawProviders Expression that declared the providers array in the source.
 */
function resolveProvidersRequiringFactory(rawProviders, reflector, evaluator) {
    const providers = new Set();
    const resolvedProviders = evaluator.evaluate(rawProviders);
    if (!Array.isArray(resolvedProviders)) {
        return providers;
    }
    resolvedProviders.forEach(function processProviders(provider) {
        let tokenClass = null;
        if (Array.isArray(provider)) {
            // If we ran into an array, recurse into it until we've resolve all the classes.
            provider.forEach(processProviders);
        }
        else if (provider instanceof Reference) {
            tokenClass = provider;
        }
        else if (provider instanceof Map && provider.has('useClass') && !provider.has('deps')) {
            const useExisting = provider.get('useClass');
            if (useExisting instanceof Reference) {
                tokenClass = useExisting;
            }
        }
        // TODO(alxhub): there was a bug where `getConstructorParameters` would return `null` for a
        // class in a .d.ts file, always, even if the class had a constructor. This was fixed for
        // `getConstructorParameters`, but that fix causes more classes to be recognized here as needing
        // provider checks, which is a breaking change in g3. Avoid this breakage for now by skipping
        // classes from .d.ts files here directly, until g3 can be cleaned up.
        if (tokenClass !== null &&
            !tokenClass.node.getSourceFile().isDeclarationFile &&
            reflector.isClass(tokenClass.node)) {
            const constructorParameters = reflector.getConstructorParameters(tokenClass.node);
            // Note that we only want to capture providers with a non-trivial constructor,
            // because they're the ones that might be using DI and need to be decorated.
            if (constructorParameters !== null && constructorParameters.length > 0) {
                providers.add(tokenClass);
            }
        }
    });
    return providers;
}
/**
 * Create an R3Reference for a class.
 *
 * The `value` is the exported declaration of the class from its source file.
 * The `type` is an expression that would be used in the typings (.d.ts) files.
 */
function wrapTypeReference(reflector, clazz) {
    const value = new compiler.WrappedNodeExpr(clazz.name);
    const type = value;
    return { value, type };
}
/** Creates a ParseSourceSpan for a TypeScript node. */
function createSourceSpan(node) {
    const sf = node.getSourceFile();
    const [startOffset, endOffset] = [node.getStart(), node.getEnd()];
    const { line: startLine, character: startCol } = sf.getLineAndCharacterOfPosition(startOffset);
    const { line: endLine, character: endCol } = sf.getLineAndCharacterOfPosition(endOffset);
    const parseSf = new compiler.ParseSourceFile(sf.getFullText(), sf.fileName);
    // +1 because values are zero-indexed.
    return new compiler.ParseSourceSpan(new compiler.ParseLocation(parseSf, startOffset, startLine + 1, startCol + 1), new compiler.ParseLocation(parseSf, endOffset, endLine + 1, endCol + 1));
}
/**
 * Collate the factory and definition compiled results into an array of CompileResult objects.
 */
function compileResults(fac, def, metadataStmt, propName, additionalFields, deferrableImports, debugInfo = null, hmrInitializer = null) {
    const statements = def.statements;
    if (metadataStmt !== null) {
        statements.push(metadataStmt);
    }
    if (debugInfo !== null) {
        statements.push(debugInfo);
    }
    if (hmrInitializer !== null) {
        statements.push(hmrInitializer);
    }
    const results = [
        fac,
        {
            name: propName,
            initializer: def.expression,
            statements: def.statements,
            type: def.type,
            deferrableImports,
        },
    ];
    if (additionalFields !== null) {
        results.push(...additionalFields);
    }
    return results;
}
function toFactoryMetadata(meta, target) {
    return {
        name: meta.name,
        type: meta.type,
        typeArgumentCount: meta.typeArgumentCount,
        deps: meta.deps,
        target,
    };
}
function resolveImportedFile(moduleResolver, importedFile, expr, origin) {
    // If `importedFile` is not 'unknown' then it accurately reflects the source file that is
    // being imported.
    if (importedFile !== 'unknown') {
        return importedFile;
    }
    // Otherwise `expr` has to be inspected to determine the file that is being imported. If `expr`
    // is not an `ExternalExpr` then it does not correspond with an import, so return null in that
    // case.
    if (!(expr instanceof compiler.ExternalExpr)) {
        return null;
    }
    // Figure out what file is being imported.
    return moduleResolver.resolveModule(expr.value.moduleName, origin.fileName);
}
/**
 * Determines the most appropriate expression for diagnostic reporting purposes. If `expr` is
 * contained within `container` then `expr` is used as origin node, otherwise `container` itself is
 * used.
 */
function getOriginNodeForDiagnostics(expr, container) {
    const nodeSf = expr.getSourceFile();
    const exprSf = container.getSourceFile();
    if (nodeSf === exprSf && expr.pos >= container.pos && expr.end <= container.end) {
        // `expr` occurs within the same source file as `container` and is contained within it, so
        // `expr` is appropriate to use as origin node for diagnostics.
        return expr;
    }
    else {
        return container;
    }
}
function isAbstractClassDeclaration(clazz) {
    return ts.canHaveModifiers(clazz) && clazz.modifiers !== undefined
        ? clazz.modifiers.some((mod) => mod.kind === ts.SyntaxKind.AbstractKeyword)
        : false;
}

function getConstructorDependencies(clazz, reflector, isCore) {
    const deps = [];
    const errors = [];
    let ctorParams = reflector.getConstructorParameters(clazz);
    if (ctorParams === null) {
        if (reflector.hasBaseClass(clazz)) {
            return null;
        }
        else {
            ctorParams = [];
        }
    }
    ctorParams.forEach((param, idx) => {
        let token = valueReferenceToExpression(param.typeValueReference);
        let attributeNameType = null;
        let optional = false, self = false, skipSelf = false, host = false;
        (param.decorators || [])
            .filter((dec) => isCore || isAngularCore(dec))
            .forEach((dec) => {
            const name = isCore || dec.import === null ? dec.name : dec.import.name;
            if (name === 'Inject') {
                if (dec.args === null || dec.args.length !== 1) {
                    throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, dec.node, `Unexpected number of arguments to @Inject().`);
                }
                token = new compiler.WrappedNodeExpr(dec.args[0]);
            }
            else if (name === 'Optional') {
                optional = true;
            }
            else if (name === 'SkipSelf') {
                skipSelf = true;
            }
            else if (name === 'Self') {
                self = true;
            }
            else if (name === 'Host') {
                host = true;
            }
            else if (name === 'Attribute') {
                if (dec.args === null || dec.args.length !== 1) {
                    throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, dec.node, `Unexpected number of arguments to @Attribute().`);
                }
                const attributeName = dec.args[0];
                token = new compiler.WrappedNodeExpr(attributeName);
                if (ts.isStringLiteralLike(attributeName)) {
                    attributeNameType = new compiler.LiteralExpr(attributeName.text);
                }
                else {
                    attributeNameType = new compiler.WrappedNodeExpr(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword));
                }
            }
            else {
                throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_UNEXPECTED, dec.node, `Unexpected decorator ${name} on parameter.`);
            }
        });
        if (token === null) {
            if (param.typeValueReference.kind !== 2 /* TypeValueReferenceKind.UNAVAILABLE */) {
                throw new Error('Illegal state: expected value reference to be unavailable if no token is present');
            }
            errors.push({
                index: idx,
                param,
                reason: param.typeValueReference.reason,
            });
        }
        else {
            deps.push({ token, attributeNameType, optional, self, skipSelf, host });
        }
    });
    if (errors.length === 0) {
        return { deps };
    }
    else {
        return { deps: null, errors };
    }
}
/**
 * Convert `ConstructorDeps` into the `R3DependencyMetadata` array for those deps if they're valid,
 * or into an `'invalid'` signal if they're not.
 *
 * This is a companion function to `validateConstructorDependencies` which accepts invalid deps.
 */
function unwrapConstructorDependencies(deps) {
    if (deps === null) {
        return null;
    }
    else if (deps.deps !== null) {
        // These constructor dependencies are valid.
        return deps.deps;
    }
    else {
        // These deps are invalid.
        return 'invalid';
    }
}
function getValidConstructorDependencies(clazz, reflector, isCore) {
    return validateConstructorDependencies(clazz, getConstructorDependencies(clazz, reflector, isCore));
}
/**
 * Validate that `ConstructorDeps` does not have any invalid dependencies and convert them into the
 * `R3DependencyMetadata` array if so, or raise a diagnostic if some deps are invalid.
 *
 * This is a companion function to `unwrapConstructorDependencies` which does not accept invalid
 * deps.
 */
function validateConstructorDependencies(clazz, deps) {
    if (deps === null) {
        return null;
    }
    else if (deps.deps !== null) {
        return deps.deps;
    }
    else {
        // There is at least one error.
        const error = deps.errors[0];
        throw createUnsuitableInjectionTokenError(clazz, error);
    }
}
/**
 * Creates a fatal error with diagnostic for an invalid injection token.
 * @param clazz The class for which the injection token was unavailable.
 * @param error The reason why no valid injection token is available.
 */
function createUnsuitableInjectionTokenError(clazz, error) {
    const { param, index, reason } = error;
    let chainMessage = undefined;
    let hints = undefined;
    switch (reason.kind) {
        case 5 /* ValueUnavailableKind.UNSUPPORTED */:
            chainMessage = 'Consider using the @Inject decorator to specify an injection token.';
            hints = [
                makeRelatedInformation(reason.typeNode, 'This type is not supported as injection token.'),
            ];
            break;
        case 1 /* ValueUnavailableKind.NO_VALUE_DECLARATION */:
            chainMessage = 'Consider using the @Inject decorator to specify an injection token.';
            hints = [
                makeRelatedInformation(reason.typeNode, 'This type does not have a value, so it cannot be used as injection token.'),
            ];
            if (reason.decl !== null) {
                hints.push(makeRelatedInformation(reason.decl, 'The type is declared here.'));
            }
            break;
        case 2 /* ValueUnavailableKind.TYPE_ONLY_IMPORT */:
            chainMessage =
                'Consider changing the type-only import to a regular import, or use the @Inject decorator to specify an injection token.';
            hints = [
                makeRelatedInformation(reason.typeNode, 'This type is imported using a type-only import, which prevents it from being usable as an injection token.'),
                makeRelatedInformation(reason.node, 'The type-only import occurs here.'),
            ];
            break;
        case 4 /* ValueUnavailableKind.NAMESPACE */:
            chainMessage = 'Consider using the @Inject decorator to specify an injection token.';
            hints = [
                makeRelatedInformation(reason.typeNode, 'This type corresponds with a namespace, which cannot be used as injection token.'),
                makeRelatedInformation(reason.importClause, 'The namespace import occurs here.'),
            ];
            break;
        case 3 /* ValueUnavailableKind.UNKNOWN_REFERENCE */:
            chainMessage = 'The type should reference a known declaration.';
            hints = [makeRelatedInformation(reason.typeNode, 'This type could not be resolved.')];
            break;
        case 0 /* ValueUnavailableKind.MISSING_TYPE */:
            chainMessage =
                'Consider adding a type to the parameter or use the @Inject decorator to specify an injection token.';
            break;
    }
    const chain = {
        messageText: `No suitable injection token for parameter '${param.name || index}' of class '${clazz.name.text}'.`,
        category: ts.DiagnosticCategory.Error,
        code: 0,
        next: [
            {
                messageText: chainMessage,
                category: ts.DiagnosticCategory.Message,
                code: 0,
            },
        ],
    };
    return new FatalDiagnosticError(exports.ErrorCode.PARAM_MISSING_TOKEN, param.nameNode, chain, hints);
}

/**
 * Disambiguates different kinds of compiler metadata objects.
 */
exports.MetaKind = void 0;
(function (MetaKind) {
    MetaKind[MetaKind["Directive"] = 0] = "Directive";
    MetaKind[MetaKind["Pipe"] = 1] = "Pipe";
    MetaKind[MetaKind["NgModule"] = 2] = "NgModule";
})(exports.MetaKind || (exports.MetaKind = {}));
/**
 * Possible ways that a directive can be matched.
 */
exports.MatchSource = void 0;
(function (MatchSource) {
    /** The directive was matched by its selector. */
    MatchSource[MatchSource["Selector"] = 0] = "Selector";
    /** The directive was applied as a host directive. */
    MatchSource[MatchSource["HostDirective"] = 1] = "HostDirective";
})(exports.MatchSource || (exports.MatchSource = {}));

/**
 * A mapping of component property and template binding property names, for example containing the
 * inputs of a particular directive or component.
 *
 * A single component property has exactly one input/output annotation (and therefore one binding
 * property name) associated with it, but the same binding property name may be shared across many
 * component property names.
 *
 * Allows bidirectional querying of the mapping - looking up all inputs/outputs with a given
 * property name, or mapping from a specific class property to its binding property name.
 */
class ClassPropertyMapping {
    /**
     * Mapping from class property names to the single `InputOrOutput` for that class property.
     */
    forwardMap;
    /**
     * Mapping from property names to one or more `InputOrOutput`s which share that name.
     */
    reverseMap;
    constructor(forwardMap) {
        this.forwardMap = forwardMap;
        this.reverseMap = reverseMapFromForwardMap(forwardMap);
    }
    /**
     * Construct a `ClassPropertyMapping` with no entries.
     */
    static empty() {
        return new ClassPropertyMapping(new Map());
    }
    /**
     * Construct a `ClassPropertyMapping` from a primitive JS object which maps class property names
     * to either binding property names or an array that contains both names, which is used in on-disk
     * metadata formats (e.g. in .d.ts files).
     */
    static fromMappedObject(obj) {
        const forwardMap = new Map();
        for (const classPropertyName of Object.keys(obj)) {
            const value = obj[classPropertyName];
            let inputOrOutput;
            if (typeof value === 'string') {
                inputOrOutput = {
                    classPropertyName,
                    bindingPropertyName: value,
                    // Inputs/outputs not captured via an explicit `InputOrOutput` mapping
                    // value are always considered non-signal. This is the string shorthand.
                    isSignal: false,
                };
            }
            else {
                inputOrOutput = value;
            }
            forwardMap.set(classPropertyName, inputOrOutput);
        }
        return new ClassPropertyMapping(forwardMap);
    }
    /**
     * Merge two mappings into one, with class properties from `b` taking precedence over class
     * properties from `a`.
     */
    static merge(a, b) {
        const forwardMap = new Map(a.forwardMap.entries());
        for (const [classPropertyName, inputOrOutput] of b.forwardMap) {
            forwardMap.set(classPropertyName, inputOrOutput);
        }
        return new ClassPropertyMapping(forwardMap);
    }
    /**
     * All class property names mapped in this mapping.
     */
    get classPropertyNames() {
        return Array.from(this.forwardMap.keys());
    }
    /**
     * All binding property names mapped in this mapping.
     */
    get propertyNames() {
        return Array.from(this.reverseMap.keys());
    }
    /**
     * Check whether a mapping for the given property name exists.
     */
    hasBindingPropertyName(propertyName) {
        return this.reverseMap.has(propertyName);
    }
    /**
     * Lookup all `InputOrOutput`s that use this `propertyName`.
     */
    getByBindingPropertyName(propertyName) {
        return this.reverseMap.has(propertyName) ? this.reverseMap.get(propertyName) : null;
    }
    /**
     * Lookup the `InputOrOutput` associated with a `classPropertyName`.
     */
    getByClassPropertyName(classPropertyName) {
        return this.forwardMap.has(classPropertyName) ? this.forwardMap.get(classPropertyName) : null;
    }
    /**
     * Convert this mapping to a primitive JS object which maps each class property directly to the
     * binding property name associated with it.
     */
    toDirectMappedObject() {
        const obj = {};
        for (const [classPropertyName, inputOrOutput] of this.forwardMap) {
            obj[classPropertyName] = inputOrOutput.bindingPropertyName;
        }
        return obj;
    }
    /**
     * Convert this mapping to a primitive JS object which maps each class property either to itself
     * (for cases where the binding property name is the same) or to an array which contains both
     * names if they differ.
     *
     * This object format is used when mappings are serialized (for example into .d.ts files).
     * @param transform Function used to transform the values of the generated map.
     */
    toJointMappedObject(transform) {
        const obj = {};
        for (const [classPropertyName, inputOrOutput] of this.forwardMap) {
            obj[classPropertyName] = transform(inputOrOutput);
        }
        return obj;
    }
    /**
     * Implement the iterator protocol and return entry objects which contain the class and binding
     * property names (and are useful for destructuring).
     */
    *[Symbol.iterator]() {
        for (const inputOrOutput of this.forwardMap.values()) {
            yield inputOrOutput;
        }
    }
}
function reverseMapFromForwardMap(forwardMap) {
    const reverseMap = new Map();
    for (const [_, inputOrOutput] of forwardMap) {
        if (!reverseMap.has(inputOrOutput.bindingPropertyName)) {
            reverseMap.set(inputOrOutput.bindingPropertyName, []);
        }
        reverseMap.get(inputOrOutput.bindingPropertyName).push(inputOrOutput);
    }
    return reverseMap;
}

function extractReferencesFromType(checker, def, bestGuessOwningModule) {
    if (!ts.isTupleTypeNode(def)) {
        return { result: [], isIncomplete: false };
    }
    const result = [];
    let isIncomplete = false;
    for (const element of def.elements) {
        if (!ts.isTypeQueryNode(element)) {
            throw new Error(`Expected TypeQueryNode: ${nodeDebugInfo(element)}`);
        }
        const ref = extraReferenceFromTypeQuery(checker, element, def, bestGuessOwningModule);
        // Note: Sometimes a reference inside the type tuple/array
        // may not be resolvable/existent. We proceed with incomplete data.
        if (ref === null) {
            isIncomplete = true;
        }
        else {
            result.push(ref);
        }
    }
    return { result, isIncomplete };
}
function extraReferenceFromTypeQuery(checker, typeNode, origin, bestGuessOwningModule) {
    const type = typeNode.exprName;
    let node;
    let from;
    // Gracefully handle when the type entity could not be converted or
    // resolved to its declaration node.
    try {
        const result = reflectTypeEntityToDeclaration(type, checker);
        node = result.node;
        from = result.from;
    }
    catch (e) {
        if (e instanceof TypeEntityToDeclarationError) {
            return null;
        }
        throw e;
    }
    if (!isNamedClassDeclaration(node)) {
        throw new Error(`Expected named ClassDeclaration: ${nodeDebugInfo(node)}`);
    }
    if (from !== null && !from.startsWith('.')) {
        // The symbol was imported using an absolute module specifier so return a reference that
        // uses that absolute module specifier as its best guess owning module.
        return new Reference(node, {
            specifier: from,
            resolutionContext: origin.getSourceFile().fileName,
        });
    }
    // For local symbols or symbols that were imported using a relative module import it is
    // assumed that the symbol is exported from the provided best guess owning module.
    return new Reference(node, bestGuessOwningModule);
}
function readBooleanType(type) {
    if (!ts.isLiteralTypeNode(type)) {
        return null;
    }
    switch (type.literal.kind) {
        case ts.SyntaxKind.TrueKeyword:
            return true;
        case ts.SyntaxKind.FalseKeyword:
            return false;
        default:
            return null;
    }
}
function readStringType(type) {
    if (!ts.isLiteralTypeNode(type) || !ts.isStringLiteral(type.literal)) {
        return null;
    }
    return type.literal.text;
}
function readMapType(type, valueTransform) {
    if (!ts.isTypeLiteralNode(type)) {
        return {};
    }
    const obj = {};
    type.members.forEach((member) => {
        if (!ts.isPropertySignature(member) ||
            member.type === undefined ||
            member.name === undefined ||
            (!ts.isStringLiteral(member.name) && !ts.isIdentifier(member.name))) {
            return;
        }
        const value = valueTransform(member.type);
        if (value !== null) {
            obj[member.name.text] = value;
        }
    });
    return obj;
}
function readStringArrayType(type) {
    if (!ts.isTupleTypeNode(type)) {
        return [];
    }
    const res = [];
    type.elements.forEach((el) => {
        if (!ts.isLiteralTypeNode(el) || !ts.isStringLiteral(el.literal)) {
            return;
        }
        res.push(el.literal.text);
    });
    return res;
}
/**
 * Inspects the class' members and extracts the metadata that is used when type-checking templates
 * that use the directive. This metadata does not contain information from a base class, if any,
 * making this metadata invariant to changes of inherited classes.
 */
function extractDirectiveTypeCheckMeta(node, inputs, reflector) {
    const members = reflector.getMembersOfClass(node);
    const staticMembers = members.filter((member) => member.isStatic);
    const ngTemplateGuards = staticMembers
        .map(extractTemplateGuard)
        .filter((guard) => guard !== null);
    const hasNgTemplateContextGuard = staticMembers.some((member) => member.kind === exports.ClassMemberKind.Method && member.name === 'ngTemplateContextGuard');
    const coercedInputFields = new Set(staticMembers.map(extractCoercedInput).filter((inputName) => {
        // If the input refers to a signal input, we will not respect coercion members.
        // A transform function should be used instead.
        if (inputName === null || inputs.getByClassPropertyName(inputName)?.isSignal) {
            return false;
        }
        return true;
    }));
    const restrictedInputFields = new Set();
    const stringLiteralInputFields = new Set();
    const undeclaredInputFields = new Set();
    for (const { classPropertyName, transform } of inputs) {
        const field = members.find((member) => member.name === classPropertyName);
        if (field === undefined || field.node === null) {
            undeclaredInputFields.add(classPropertyName);
            continue;
        }
        if (isRestricted(field.node)) {
            restrictedInputFields.add(classPropertyName);
        }
        if (field.nameNode !== null && ts.isStringLiteral(field.nameNode)) {
            stringLiteralInputFields.add(classPropertyName);
        }
        if (transform !== null) {
            coercedInputFields.add(classPropertyName);
        }
    }
    const arity = reflector.getGenericArityOfClass(node);
    return {
        hasNgTemplateContextGuard,
        ngTemplateGuards,
        coercedInputFields,
        restrictedInputFields,
        stringLiteralInputFields,
        undeclaredInputFields,
        isGeneric: arity !== null && arity > 0,
    };
}
function isRestricted(node) {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return (modifiers !== undefined &&
        modifiers.some(({ kind }) => {
            return (kind === ts.SyntaxKind.PrivateKeyword ||
                kind === ts.SyntaxKind.ProtectedKeyword ||
                kind === ts.SyntaxKind.ReadonlyKeyword);
        }));
}
function extractTemplateGuard(member) {
    if (!member.name.startsWith('ngTemplateGuard_')) {
        return null;
    }
    const inputName = afterUnderscore(member.name);
    if (member.kind === exports.ClassMemberKind.Property) {
        let type = null;
        if (member.type !== null &&
            ts.isLiteralTypeNode(member.type) &&
            ts.isStringLiteral(member.type.literal)) {
            type = member.type.literal.text;
        }
        // Only property members with string literal type 'binding' are considered as template guard.
        if (type !== 'binding') {
            return null;
        }
        return { inputName, type };
    }
    else if (member.kind === exports.ClassMemberKind.Method) {
        return { inputName, type: 'invocation' };
    }
    else {
        return null;
    }
}
function extractCoercedInput(member) {
    if (member.kind !== exports.ClassMemberKind.Property || !member.name.startsWith('ngAcceptInputType_')) {
        return null;
    }
    return afterUnderscore(member.name);
}
/**
 * A `MetadataReader` that reads from an ordered set of child readers until it obtains the requested
 * metadata.
 *
 * This is used to combine `MetadataReader`s that read from different sources (e.g. from a registry
 * and from .d.ts files).
 */
class CompoundMetadataReader {
    readers;
    constructor(readers) {
        this.readers = readers;
    }
    getDirectiveMetadata(node) {
        for (const reader of this.readers) {
            const meta = reader.getDirectiveMetadata(node);
            if (meta !== null) {
                return meta;
            }
        }
        return null;
    }
    getNgModuleMetadata(node) {
        for (const reader of this.readers) {
            const meta = reader.getNgModuleMetadata(node);
            if (meta !== null) {
                return meta;
            }
        }
        return null;
    }
    getPipeMetadata(node) {
        for (const reader of this.readers) {
            const meta = reader.getPipeMetadata(node);
            if (meta !== null) {
                return meta;
            }
        }
        return null;
    }
}
function afterUnderscore(str) {
    const pos = str.indexOf('_');
    if (pos === -1) {
        throw new Error(`Expected '${str}' to contain '_'`);
    }
    return str.slice(pos + 1);
}
/** Returns whether a class declaration has the necessary class fields to make it injectable. */
function hasInjectableFields(clazz, host) {
    const members = host.getMembersOfClass(clazz);
    return members.some(({ isStatic, name }) => isStatic && (name === 'ɵprov' || name === 'ɵfac'));
}
function isHostDirectiveMetaForGlobalMode(hostDirectiveMeta) {
    return hostDirectiveMeta.directive instanceof Reference;
}

/**
 * Given a reference to a directive, return a flattened version of its `DirectiveMeta` metadata
 * which includes metadata from its entire inheritance chain.
 *
 * The returned `DirectiveMeta` will either have `baseClass: null` if the inheritance chain could be
 * fully resolved, or `baseClass: 'dynamic'` if the inheritance chain could not be completely
 * followed.
 */
function flattenInheritedDirectiveMetadata(reader, dir) {
    const topMeta = reader.getDirectiveMetadata(dir);
    if (topMeta === null) {
        return null;
    }
    if (topMeta.baseClass === null) {
        return topMeta;
    }
    const coercedInputFields = new Set();
    const undeclaredInputFields = new Set();
    const restrictedInputFields = new Set();
    const stringLiteralInputFields = new Set();
    let hostDirectives = null;
    let isDynamic = false;
    let inputs = ClassPropertyMapping.empty();
    let outputs = ClassPropertyMapping.empty();
    let isStructural = false;
    const addMetadata = (meta) => {
        if (meta.baseClass === 'dynamic') {
            isDynamic = true;
        }
        else if (meta.baseClass !== null) {
            const baseMeta = reader.getDirectiveMetadata(meta.baseClass);
            if (baseMeta !== null) {
                addMetadata(baseMeta);
            }
            else {
                // Missing metadata for the base class means it's effectively dynamic.
                isDynamic = true;
            }
        }
        isStructural = isStructural || meta.isStructural;
        inputs = ClassPropertyMapping.merge(inputs, meta.inputs);
        outputs = ClassPropertyMapping.merge(outputs, meta.outputs);
        for (const coercedInputField of meta.coercedInputFields) {
            coercedInputFields.add(coercedInputField);
        }
        for (const undeclaredInputField of meta.undeclaredInputFields) {
            undeclaredInputFields.add(undeclaredInputField);
        }
        for (const restrictedInputField of meta.restrictedInputFields) {
            restrictedInputFields.add(restrictedInputField);
        }
        for (const field of meta.stringLiteralInputFields) {
            stringLiteralInputFields.add(field);
        }
        if (meta.hostDirectives !== null && meta.hostDirectives.length > 0) {
            hostDirectives ??= [];
            hostDirectives.push(...meta.hostDirectives);
        }
    };
    addMetadata(topMeta);
    return {
        ...topMeta,
        inputs,
        outputs,
        coercedInputFields,
        undeclaredInputFields,
        restrictedInputFields,
        stringLiteralInputFields,
        baseClass: isDynamic ? 'dynamic' : null,
        isStructural,
        hostDirectives,
    };
}

/**
 * Represents a value which cannot be determined statically.
 */
class DynamicValue {
    node;
    reason;
    code;
    constructor(node, reason, code) {
        this.node = node;
        this.reason = reason;
        this.code = code;
    }
    static fromDynamicInput(node, input) {
        return new DynamicValue(node, input, 0 /* DynamicValueReason.DYNAMIC_INPUT */);
    }
    static fromDynamicString(node) {
        return new DynamicValue(node, undefined, 1 /* DynamicValueReason.DYNAMIC_STRING */);
    }
    static fromExternalReference(node, ref) {
        return new DynamicValue(node, ref, 2 /* DynamicValueReason.EXTERNAL_REFERENCE */);
    }
    static fromUnsupportedSyntax(node) {
        return new DynamicValue(node, undefined, 3 /* DynamicValueReason.UNSUPPORTED_SYNTAX */);
    }
    static fromUnknownIdentifier(node) {
        return new DynamicValue(node, undefined, 4 /* DynamicValueReason.UNKNOWN_IDENTIFIER */);
    }
    static fromInvalidExpressionType(node, value) {
        return new DynamicValue(node, value, 5 /* DynamicValueReason.INVALID_EXPRESSION_TYPE */);
    }
    static fromComplexFunctionCall(node, fn) {
        return new DynamicValue(node, fn, 6 /* DynamicValueReason.COMPLEX_FUNCTION_CALL */);
    }
    static fromDynamicType(node) {
        return new DynamicValue(node, undefined, 7 /* DynamicValueReason.DYNAMIC_TYPE */);
    }
    static fromSyntheticInput(node, value) {
        return new DynamicValue(node, value, 8 /* DynamicValueReason.SYNTHETIC_INPUT */);
    }
    static fromUnknown(node) {
        return new DynamicValue(node, undefined, 9 /* DynamicValueReason.UNKNOWN */);
    }
    isFromDynamicInput() {
        return this.code === 0 /* DynamicValueReason.DYNAMIC_INPUT */;
    }
    isFromDynamicString() {
        return this.code === 1 /* DynamicValueReason.DYNAMIC_STRING */;
    }
    isFromExternalReference() {
        return this.code === 2 /* DynamicValueReason.EXTERNAL_REFERENCE */;
    }
    isFromUnsupportedSyntax() {
        return this.code === 3 /* DynamicValueReason.UNSUPPORTED_SYNTAX */;
    }
    isFromUnknownIdentifier() {
        return this.code === 4 /* DynamicValueReason.UNKNOWN_IDENTIFIER */;
    }
    isFromInvalidExpressionType() {
        return this.code === 5 /* DynamicValueReason.INVALID_EXPRESSION_TYPE */;
    }
    isFromComplexFunctionCall() {
        return this.code === 6 /* DynamicValueReason.COMPLEX_FUNCTION_CALL */;
    }
    isFromDynamicType() {
        return this.code === 7 /* DynamicValueReason.DYNAMIC_TYPE */;
    }
    isFromUnknown() {
        return this.code === 9 /* DynamicValueReason.UNKNOWN */;
    }
    accept(visitor) {
        switch (this.code) {
            case 0 /* DynamicValueReason.DYNAMIC_INPUT */:
                return visitor.visitDynamicInput(this);
            case 1 /* DynamicValueReason.DYNAMIC_STRING */:
                return visitor.visitDynamicString(this);
            case 2 /* DynamicValueReason.EXTERNAL_REFERENCE */:
                return visitor.visitExternalReference(this);
            case 3 /* DynamicValueReason.UNSUPPORTED_SYNTAX */:
                return visitor.visitUnsupportedSyntax(this);
            case 4 /* DynamicValueReason.UNKNOWN_IDENTIFIER */:
                return visitor.visitUnknownIdentifier(this);
            case 5 /* DynamicValueReason.INVALID_EXPRESSION_TYPE */:
                return visitor.visitInvalidExpressionType(this);
            case 6 /* DynamicValueReason.COMPLEX_FUNCTION_CALL */:
                return visitor.visitComplexFunctionCall(this);
            case 7 /* DynamicValueReason.DYNAMIC_TYPE */:
                return visitor.visitDynamicType(this);
            case 8 /* DynamicValueReason.SYNTHETIC_INPUT */:
                return visitor.visitSyntheticInput(this);
            case 9 /* DynamicValueReason.UNKNOWN */:
                return visitor.visitUnknown(this);
        }
    }
}

/**
 * A collection of publicly exported declarations from a module. Each declaration is evaluated
 * lazily upon request.
 */
class ResolvedModule {
    exports;
    evaluate;
    constructor(exports, evaluate) {
        this.exports = exports;
        this.evaluate = evaluate;
    }
    getExport(name) {
        if (!this.exports.has(name)) {
            return undefined;
        }
        return this.evaluate(this.exports.get(name));
    }
    getExports() {
        const map = new Map();
        this.exports.forEach((decl, name) => {
            map.set(name, this.evaluate(decl));
        });
        return map;
    }
}
/**
 * A value member of an enumeration.
 *
 * Contains a `Reference` to the enumeration itself, and the name of the referenced member.
 */
class EnumValue {
    enumRef;
    name;
    resolved;
    constructor(enumRef, name, resolved) {
        this.enumRef = enumRef;
        this.name = name;
        this.resolved = resolved;
    }
}
/**
 * An implementation of a known function that can be statically evaluated.
 * It could be a built-in function or method (such as `Array.prototype.slice`) or a TypeScript
 * helper (such as `__spread`).
 */
class KnownFn {
}

/**
 * Derives a type representation from a resolved value to be reported in a diagnostic.
 *
 * @param value The resolved value for which a type representation should be derived.
 * @param maxDepth The maximum nesting depth of objects and arrays, defaults to 1 level.
 */
function describeResolvedType(value, maxDepth = 1) {
    if (value === null) {
        return 'null';
    }
    else if (value === undefined) {
        return 'undefined';
    }
    else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
        return typeof value;
    }
    else if (value instanceof Map) {
        if (maxDepth === 0) {
            return 'object';
        }
        const entries = Array.from(value.entries()).map(([key, v]) => {
            return `${quoteKey(key)}: ${describeResolvedType(v, maxDepth - 1)}`;
        });
        return entries.length > 0 ? `{ ${entries.join('; ')} }` : '{}';
    }
    else if (value instanceof ResolvedModule) {
        return '(module)';
    }
    else if (value instanceof EnumValue) {
        return value.enumRef.debugName ?? '(anonymous)';
    }
    else if (value instanceof Reference) {
        return value.debugName ?? '(anonymous)';
    }
    else if (Array.isArray(value)) {
        if (maxDepth === 0) {
            return 'Array';
        }
        return `[${value.map((v) => describeResolvedType(v, maxDepth - 1)).join(', ')}]`;
    }
    else if (value instanceof DynamicValue) {
        return '(not statically analyzable)';
    }
    else if (value instanceof KnownFn) {
        return 'Function';
    }
    else {
        return 'unknown';
    }
}
function quoteKey(key) {
    if (/^[a-z0-9_]+$/i.test(key)) {
        return key;
    }
    else {
        return `'${key.replace(/'/g, "\\'")}'`;
    }
}
/**
 * Creates an array of related information diagnostics for a `DynamicValue` that describe the trace
 * of why an expression was evaluated as dynamic.
 *
 * @param node The node for which a `ts.Diagnostic` is to be created with the trace.
 * @param value The dynamic value for which a trace should be created.
 */
function traceDynamicValue(node, value) {
    return value.accept(new TraceDynamicValueVisitor(node));
}
class TraceDynamicValueVisitor {
    node;
    currentContainerNode = null;
    constructor(node) {
        this.node = node;
    }
    visitDynamicInput(value) {
        const trace = value.reason.accept(this);
        if (this.shouldTrace(value.node)) {
            const info = makeRelatedInformation(value.node, 'Unable to evaluate this expression statically.');
            trace.unshift(info);
        }
        return trace;
    }
    visitSyntheticInput(value) {
        return [makeRelatedInformation(value.node, 'Unable to evaluate this expression further.')];
    }
    visitDynamicString(value) {
        return [
            makeRelatedInformation(value.node, 'A string value could not be determined statically.'),
        ];
    }
    visitExternalReference(value) {
        const name = value.reason.debugName;
        const description = name !== null ? `'${name}'` : 'an anonymous declaration';
        return [
            makeRelatedInformation(value.node, `A value for ${description} cannot be determined statically, as it is an external declaration.`),
        ];
    }
    visitComplexFunctionCall(value) {
        return [
            makeRelatedInformation(value.node, 'Unable to evaluate function call of complex function. A function must have exactly one return statement.'),
            makeRelatedInformation(value.reason.node, 'Function is declared here.'),
        ];
    }
    visitInvalidExpressionType(value) {
        return [makeRelatedInformation(value.node, 'Unable to evaluate an invalid expression.')];
    }
    visitUnknown(value) {
        return [makeRelatedInformation(value.node, 'Unable to evaluate statically.')];
    }
    visitUnknownIdentifier(value) {
        return [makeRelatedInformation(value.node, 'Unknown reference.')];
    }
    visitDynamicType(value) {
        return [makeRelatedInformation(value.node, 'Dynamic type.')];
    }
    visitUnsupportedSyntax(value) {
        return [makeRelatedInformation(value.node, 'This syntax is not supported.')];
    }
    /**
     * Determines whether the dynamic value reported for the node should be traced, i.e. if it is not
     * part of the container for which the most recent trace was created.
     */
    shouldTrace(node) {
        if (node === this.node) {
            // Do not include a dynamic value for the origin node, as the main diagnostic is already
            // reported on that node.
            return false;
        }
        const container = getContainerNode(node);
        if (container === this.currentContainerNode) {
            // The node is part of the same container as the previous trace entry, so this dynamic value
            // should not become part of the trace.
            return false;
        }
        this.currentContainerNode = container;
        return true;
    }
}
/**
 * Determines the closest parent node that is to be considered as container, which is used to reduce
 * the granularity of tracing the dynamic values to a single entry per container. Currently, full
 * statements and destructuring patterns are considered as container.
 */
function getContainerNode(node) {
    let currentNode = node;
    while (currentNode !== undefined) {
        switch (currentNode.kind) {
            case ts.SyntaxKind.ExpressionStatement:
            case ts.SyntaxKind.VariableStatement:
            case ts.SyntaxKind.ReturnStatement:
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.SwitchStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.ContinueStatement:
            case ts.SyntaxKind.BreakStatement:
            case ts.SyntaxKind.ThrowStatement:
            case ts.SyntaxKind.ObjectBindingPattern:
            case ts.SyntaxKind.ArrayBindingPattern:
                return currentNode;
        }
        currentNode = currentNode.parent;
    }
    return node.getSourceFile();
}

class ArraySliceBuiltinFn extends KnownFn {
    lhs;
    constructor(lhs) {
        super();
        this.lhs = lhs;
    }
    evaluate(node, args) {
        if (args.length === 0) {
            return this.lhs;
        }
        else {
            return DynamicValue.fromUnknown(node);
        }
    }
}
class ArrayConcatBuiltinFn extends KnownFn {
    lhs;
    constructor(lhs) {
        super();
        this.lhs = lhs;
    }
    evaluate(node, args) {
        const result = [...this.lhs];
        for (const arg of args) {
            if (arg instanceof DynamicValue) {
                result.push(DynamicValue.fromDynamicInput(node, arg));
            }
            else if (Array.isArray(arg)) {
                result.push(...arg);
            }
            else {
                result.push(arg);
            }
        }
        return result;
    }
}
class StringConcatBuiltinFn extends KnownFn {
    lhs;
    constructor(lhs) {
        super();
        this.lhs = lhs;
    }
    evaluate(node, args) {
        let result = this.lhs;
        for (const arg of args) {
            const resolved = arg instanceof EnumValue ? arg.resolved : arg;
            if (typeof resolved === 'string' ||
                typeof resolved === 'number' ||
                typeof resolved === 'boolean' ||
                resolved == null) {
                // Cast to `any`, because `concat` will convert
                // anything to a string, but TS only allows strings.
                result = result.concat(resolved);
            }
            else {
                return DynamicValue.fromUnknown(node);
            }
        }
        return result;
    }
}

/**
 * A value produced which originated in a `ForeignFunctionResolver` and doesn't come from the
 * template itself.
 *
 * Synthetic values cannot be further evaluated, and attempts to do so produce `DynamicValue`s
 * instead.
 */
class SyntheticValue {
    value;
    constructor(value) {
        this.value = value;
    }
}

function literalBinaryOp(op) {
    return { op, literal: true };
}
function referenceBinaryOp(op) {
    return { op, literal: false };
}
const BINARY_OPERATORS$2 = new Map([
    [ts.SyntaxKind.PlusToken, literalBinaryOp((a, b) => a + b)],
    [ts.SyntaxKind.MinusToken, literalBinaryOp((a, b) => a - b)],
    [ts.SyntaxKind.AsteriskToken, literalBinaryOp((a, b) => a * b)],
    [ts.SyntaxKind.SlashToken, literalBinaryOp((a, b) => a / b)],
    [ts.SyntaxKind.PercentToken, literalBinaryOp((a, b) => a % b)],
    [ts.SyntaxKind.AmpersandToken, literalBinaryOp((a, b) => a & b)],
    [ts.SyntaxKind.BarToken, literalBinaryOp((a, b) => a | b)],
    [ts.SyntaxKind.CaretToken, literalBinaryOp((a, b) => a ^ b)],
    [ts.SyntaxKind.LessThanToken, literalBinaryOp((a, b) => a < b)],
    [ts.SyntaxKind.LessThanEqualsToken, literalBinaryOp((a, b) => a <= b)],
    [ts.SyntaxKind.GreaterThanToken, literalBinaryOp((a, b) => a > b)],
    [ts.SyntaxKind.GreaterThanEqualsToken, literalBinaryOp((a, b) => a >= b)],
    [ts.SyntaxKind.EqualsEqualsToken, literalBinaryOp((a, b) => a == b)],
    [ts.SyntaxKind.EqualsEqualsEqualsToken, literalBinaryOp((a, b) => a === b)],
    [ts.SyntaxKind.ExclamationEqualsToken, literalBinaryOp((a, b) => a != b)],
    [ts.SyntaxKind.ExclamationEqualsEqualsToken, literalBinaryOp((a, b) => a !== b)],
    [ts.SyntaxKind.LessThanLessThanToken, literalBinaryOp((a, b) => a << b)],
    [ts.SyntaxKind.GreaterThanGreaterThanToken, literalBinaryOp((a, b) => a >> b)],
    [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, literalBinaryOp((a, b) => a >>> b)],
    [ts.SyntaxKind.AsteriskAsteriskToken, literalBinaryOp((a, b) => Math.pow(a, b))],
    [ts.SyntaxKind.AmpersandAmpersandToken, referenceBinaryOp((a, b) => a && b)],
    [ts.SyntaxKind.BarBarToken, referenceBinaryOp((a, b) => a || b)],
]);
const UNARY_OPERATORS$2 = new Map([
    [ts.SyntaxKind.TildeToken, (a) => ~a],
    [ts.SyntaxKind.MinusToken, (a) => -a],
    [ts.SyntaxKind.PlusToken, (a) => +a],
    [ts.SyntaxKind.ExclamationToken, (a) => !a],
]);
class StaticInterpreter {
    host;
    checker;
    dependencyTracker;
    constructor(host, checker, dependencyTracker) {
        this.host = host;
        this.checker = checker;
        this.dependencyTracker = dependencyTracker;
    }
    visit(node, context) {
        return this.visitExpression(node, context);
    }
    visitExpression(node, context) {
        let result;
        if (node.kind === ts.SyntaxKind.TrueKeyword) {
            return true;
        }
        else if (node.kind === ts.SyntaxKind.FalseKeyword) {
            return false;
        }
        else if (node.kind === ts.SyntaxKind.NullKeyword) {
            return null;
        }
        else if (ts.isStringLiteral(node)) {
            return node.text;
        }
        else if (ts.isNoSubstitutionTemplateLiteral(node)) {
            return node.text;
        }
        else if (ts.isTemplateExpression(node)) {
            result = this.visitTemplateExpression(node, context);
        }
        else if (ts.isNumericLiteral(node)) {
            return parseFloat(node.text);
        }
        else if (ts.isObjectLiteralExpression(node)) {
            result = this.visitObjectLiteralExpression(node, context);
        }
        else if (ts.isIdentifier(node)) {
            result = this.visitIdentifier(node, context);
        }
        else if (ts.isPropertyAccessExpression(node)) {
            result = this.visitPropertyAccessExpression(node, context);
        }
        else if (ts.isCallExpression(node)) {
            result = this.visitCallExpression(node, context);
        }
        else if (ts.isConditionalExpression(node)) {
            result = this.visitConditionalExpression(node, context);
        }
        else if (ts.isPrefixUnaryExpression(node)) {
            result = this.visitPrefixUnaryExpression(node, context);
        }
        else if (ts.isBinaryExpression(node)) {
            result = this.visitBinaryExpression(node, context);
        }
        else if (ts.isArrayLiteralExpression(node)) {
            result = this.visitArrayLiteralExpression(node, context);
        }
        else if (ts.isParenthesizedExpression(node)) {
            result = this.visitParenthesizedExpression(node, context);
        }
        else if (ts.isElementAccessExpression(node)) {
            result = this.visitElementAccessExpression(node, context);
        }
        else if (ts.isAsExpression(node)) {
            result = this.visitExpression(node.expression, context);
        }
        else if (ts.isNonNullExpression(node)) {
            result = this.visitExpression(node.expression, context);
        }
        else if (this.host.isClass(node)) {
            result = this.visitDeclaration(node, context);
        }
        else {
            return DynamicValue.fromUnsupportedSyntax(node);
        }
        if (result instanceof DynamicValue && result.node !== node) {
            return DynamicValue.fromDynamicInput(node, result);
        }
        return result;
    }
    visitArrayLiteralExpression(node, context) {
        const array = [];
        for (let i = 0; i < node.elements.length; i++) {
            const element = node.elements[i];
            if (ts.isSpreadElement(element)) {
                array.push(...this.visitSpreadElement(element, context));
            }
            else {
                array.push(this.visitExpression(element, context));
            }
        }
        return array;
    }
    visitObjectLiteralExpression(node, context) {
        const map = new Map();
        for (let i = 0; i < node.properties.length; i++) {
            const property = node.properties[i];
            if (ts.isPropertyAssignment(property)) {
                const name = this.stringNameFromPropertyName(property.name, context);
                // Check whether the name can be determined statically.
                if (name === undefined) {
                    return DynamicValue.fromDynamicInput(node, DynamicValue.fromDynamicString(property.name));
                }
                map.set(name, this.visitExpression(property.initializer, context));
            }
            else if (ts.isShorthandPropertyAssignment(property)) {
                const symbol = this.checker.getShorthandAssignmentValueSymbol(property);
                if (symbol === undefined || symbol.valueDeclaration === undefined) {
                    map.set(property.name.text, DynamicValue.fromUnknown(property));
                }
                else {
                    map.set(property.name.text, this.visitDeclaration(symbol.valueDeclaration, context));
                }
            }
            else if (ts.isSpreadAssignment(property)) {
                const spread = this.visitExpression(property.expression, context);
                if (spread instanceof DynamicValue) {
                    return DynamicValue.fromDynamicInput(node, spread);
                }
                else if (spread instanceof Map) {
                    spread.forEach((value, key) => map.set(key, value));
                }
                else if (spread instanceof ResolvedModule) {
                    spread.getExports().forEach((value, key) => map.set(key, value));
                }
                else {
                    return DynamicValue.fromDynamicInput(node, DynamicValue.fromInvalidExpressionType(property, spread));
                }
            }
            else {
                return DynamicValue.fromUnknown(node);
            }
        }
        return map;
    }
    visitTemplateExpression(node, context) {
        const pieces = [node.head.text];
        for (let i = 0; i < node.templateSpans.length; i++) {
            const span = node.templateSpans[i];
            const value = literal(this.visit(span.expression, context), () => DynamicValue.fromDynamicString(span.expression));
            if (value instanceof DynamicValue) {
                return DynamicValue.fromDynamicInput(node, value);
            }
            pieces.push(`${value}`, span.literal.text);
        }
        return pieces.join('');
    }
    visitIdentifier(node, context) {
        const decl = this.host.getDeclarationOfIdentifier(node);
        if (decl === null) {
            if (ts.identifierToKeywordKind(node) === ts.SyntaxKind.UndefinedKeyword) {
                return undefined;
            }
            else {
                // Check if the symbol here is imported.
                if (this.dependencyTracker !== null && this.host.getImportOfIdentifier(node) !== null) {
                    // It was, but no declaration for the node could be found. This means that the dependency
                    // graph for the current file cannot be properly updated to account for this (broken)
                    // import. Instead, the originating file is reported as failing dependency analysis,
                    // ensuring that future compilations will always attempt to re-resolve the previously
                    // broken identifier.
                    this.dependencyTracker.recordDependencyAnalysisFailure(context.originatingFile);
                }
                return DynamicValue.fromUnknownIdentifier(node);
            }
        }
        const declContext = { ...context, ...joinModuleContext(context, node, decl) };
        const result = this.visitDeclaration(decl.node, declContext);
        if (result instanceof Reference) {
            // Only record identifiers to non-synthetic references. Synthetic references may not have the
            // same value at runtime as they do at compile time, so it's not legal to refer to them by the
            // identifier here.
            if (!result.synthetic) {
                result.addIdentifier(node);
            }
        }
        else if (result instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, result);
        }
        return result;
    }
    visitDeclaration(node, context) {
        if (this.dependencyTracker !== null) {
            this.dependencyTracker.addDependency(context.originatingFile, node.getSourceFile());
        }
        if (this.host.isClass(node)) {
            return this.getReference(node, context);
        }
        else if (ts.isVariableDeclaration(node)) {
            return this.visitVariableDeclaration(node, context);
        }
        else if (ts.isParameter(node) && context.scope.has(node)) {
            return context.scope.get(node);
        }
        else if (ts.isExportAssignment(node)) {
            return this.visitExpression(node.expression, context);
        }
        else if (ts.isEnumDeclaration(node)) {
            return this.visitEnumDeclaration(node, context);
        }
        else if (ts.isSourceFile(node)) {
            return this.visitSourceFile(node, context);
        }
        else if (ts.isBindingElement(node)) {
            return this.visitBindingElement(node, context);
        }
        else {
            return this.getReference(node, context);
        }
    }
    visitVariableDeclaration(node, context) {
        const value = this.host.getVariableValue(node);
        if (value !== null) {
            return this.visitExpression(value, context);
        }
        else if (isVariableDeclarationDeclared(node)) {
            // If the declaration has a literal type that can be statically reduced to a value, resolve to
            // that value. If not, the historical behavior for variable declarations is to return a
            // `Reference` to the variable, as the consumer could use it in a context where knowing its
            // static value is not necessary.
            //
            // Arguably, since the value cannot be statically determined, we should return a
            // `DynamicValue`. This returns a `Reference` because it's the same behavior as before
            // `visitType` was introduced.
            //
            // TODO(zarend): investigate switching to a `DynamicValue` and verify this won't break any
            // use cases, especially in ngcc
            if (node.type !== undefined) {
                const evaluatedType = this.visitType(node.type, context);
                if (!(evaluatedType instanceof DynamicValue)) {
                    return evaluatedType;
                }
            }
            return this.getReference(node, context);
        }
        else {
            return undefined;
        }
    }
    visitEnumDeclaration(node, context) {
        const enumRef = this.getReference(node, context);
        const map = new Map();
        node.members.forEach((member, index) => {
            const name = this.stringNameFromPropertyName(member.name, context);
            if (name !== undefined) {
                const resolved = member.initializer ? this.visit(member.initializer, context) : index;
                map.set(name, new EnumValue(enumRef, name, resolved));
            }
        });
        return map;
    }
    visitElementAccessExpression(node, context) {
        const lhs = this.visitExpression(node.expression, context);
        if (lhs instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, lhs);
        }
        const rhs = this.visitExpression(node.argumentExpression, context);
        if (rhs instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, rhs);
        }
        if (typeof rhs !== 'string' && typeof rhs !== 'number') {
            return DynamicValue.fromInvalidExpressionType(node, rhs);
        }
        return this.accessHelper(node, lhs, rhs, context);
    }
    visitPropertyAccessExpression(node, context) {
        const lhs = this.visitExpression(node.expression, context);
        const rhs = node.name.text;
        // TODO: handle reference to class declaration.
        if (lhs instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, lhs);
        }
        return this.accessHelper(node, lhs, rhs, context);
    }
    visitSourceFile(node, context) {
        const declarations = this.host.getExportsOfModule(node);
        if (declarations === null) {
            return DynamicValue.fromUnknown(node);
        }
        return new ResolvedModule(declarations, (decl) => {
            const declContext = {
                ...context,
                ...joinModuleContext(context, node, decl),
            };
            // Visit both concrete and inline declarations.
            return this.visitDeclaration(decl.node, declContext);
        });
    }
    accessHelper(node, lhs, rhs, context) {
        const strIndex = `${rhs}`;
        if (lhs instanceof Map) {
            if (lhs.has(strIndex)) {
                return lhs.get(strIndex);
            }
            else {
                return undefined;
            }
        }
        else if (lhs instanceof ResolvedModule) {
            return lhs.getExport(strIndex);
        }
        else if (Array.isArray(lhs)) {
            if (rhs === 'length') {
                return lhs.length;
            }
            else if (rhs === 'slice') {
                return new ArraySliceBuiltinFn(lhs);
            }
            else if (rhs === 'concat') {
                return new ArrayConcatBuiltinFn(lhs);
            }
            if (typeof rhs !== 'number' || !Number.isInteger(rhs)) {
                return DynamicValue.fromInvalidExpressionType(node, rhs);
            }
            return lhs[rhs];
        }
        else if (typeof lhs === 'string' && rhs === 'concat') {
            return new StringConcatBuiltinFn(lhs);
        }
        else if (lhs instanceof Reference) {
            const ref = lhs.node;
            if (this.host.isClass(ref)) {
                const module = owningModule(context, lhs.bestGuessOwningModule);
                let value = undefined;
                const member = this.host
                    .getMembersOfClass(ref)
                    .find((member) => member.isStatic && member.name === strIndex);
                if (member !== undefined) {
                    if (member.value !== null) {
                        value = this.visitExpression(member.value, context);
                    }
                    else if (member.implementation !== null) {
                        value = new Reference(member.implementation, module);
                    }
                    else if (member.node) {
                        value = new Reference(member.node, module);
                    }
                }
                return value;
            }
            else if (isDeclaration(ref)) {
                return DynamicValue.fromDynamicInput(node, DynamicValue.fromExternalReference(ref, lhs));
            }
        }
        else if (lhs instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, lhs);
        }
        else if (lhs instanceof SyntheticValue) {
            return DynamicValue.fromSyntheticInput(node, lhs);
        }
        return DynamicValue.fromUnknown(node);
    }
    visitCallExpression(node, context) {
        const lhs = this.visitExpression(node.expression, context);
        if (lhs instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, lhs);
        }
        // If the call refers to a builtin function, attempt to evaluate the function.
        if (lhs instanceof KnownFn) {
            return lhs.evaluate(node, this.evaluateFunctionArguments(node, context));
        }
        if (!(lhs instanceof Reference)) {
            return DynamicValue.fromInvalidExpressionType(node.expression, lhs);
        }
        const fn = this.host.getDefinitionOfFunction(lhs.node);
        if (fn === null) {
            return DynamicValue.fromInvalidExpressionType(node.expression, lhs);
        }
        if (!isFunctionOrMethodReference(lhs)) {
            return DynamicValue.fromInvalidExpressionType(node.expression, lhs);
        }
        const resolveFfrExpr = (expr) => {
            let contextExtension = {};
            // TODO(alxhub): the condition `fn.body === null` here is vestigial - we probably _do_ want to
            // change the context like this even for non-null function bodies. But, this is being
            // redesigned as a refactoring with no behavior changes so that should be done as a follow-up.
            if (fn.body === null &&
                expr.getSourceFile() !== node.expression.getSourceFile() &&
                lhs.bestGuessOwningModule !== null) {
                contextExtension = {
                    absoluteModuleName: lhs.bestGuessOwningModule.specifier,
                    resolutionContext: lhs.bestGuessOwningModule.resolutionContext,
                };
            }
            return this.visitFfrExpression(expr, { ...context, ...contextExtension });
        };
        // If the function is foreign (declared through a d.ts file), attempt to resolve it with the
        // foreignFunctionResolver, if one is specified.
        if (fn.body === null && context.foreignFunctionResolver !== undefined) {
            const unresolvable = DynamicValue.fromDynamicInput(node, DynamicValue.fromExternalReference(node.expression, lhs));
            return context.foreignFunctionResolver(lhs, node, resolveFfrExpr, unresolvable);
        }
        const res = this.visitFunctionBody(node, fn, context);
        // If the result of attempting to resolve the function body was a DynamicValue, attempt to use
        // the foreignFunctionResolver if one is present. This could still potentially yield a usable
        // value.
        if (res instanceof DynamicValue && context.foreignFunctionResolver !== undefined) {
            const unresolvable = DynamicValue.fromComplexFunctionCall(node, fn);
            return context.foreignFunctionResolver(lhs, node, resolveFfrExpr, unresolvable);
        }
        return res;
    }
    /**
     * Visit an expression which was extracted from a foreign-function resolver.
     *
     * This will process the result and ensure it's correct for FFR-resolved values, including marking
     * `Reference`s as synthetic.
     */
    visitFfrExpression(expr, context) {
        const res = this.visitExpression(expr, context);
        if (res instanceof Reference) {
            // This Reference was created synthetically, via a foreign function resolver. The real
            // runtime value of the function expression may be different than the foreign function
            // resolved value, so mark the Reference as synthetic to avoid it being misinterpreted.
            res.synthetic = true;
        }
        return res;
    }
    visitFunctionBody(node, fn, context) {
        if (fn.body === null) {
            return DynamicValue.fromUnknown(node);
        }
        else if (fn.body.length !== 1 || !ts.isReturnStatement(fn.body[0])) {
            return DynamicValue.fromComplexFunctionCall(node, fn);
        }
        const ret = fn.body[0];
        const args = this.evaluateFunctionArguments(node, context);
        const newScope = new Map();
        const calleeContext = { ...context, scope: newScope };
        fn.parameters.forEach((param, index) => {
            let arg = args[index];
            if (param.node.dotDotDotToken !== undefined) {
                arg = args.slice(index);
            }
            if (arg === undefined && param.initializer !== null) {
                arg = this.visitExpression(param.initializer, calleeContext);
            }
            newScope.set(param.node, arg);
        });
        return ret.expression !== undefined
            ? this.visitExpression(ret.expression, calleeContext)
            : undefined;
    }
    visitConditionalExpression(node, context) {
        const condition = this.visitExpression(node.condition, context);
        if (condition instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, condition);
        }
        if (condition) {
            return this.visitExpression(node.whenTrue, context);
        }
        else {
            return this.visitExpression(node.whenFalse, context);
        }
    }
    visitPrefixUnaryExpression(node, context) {
        const operatorKind = node.operator;
        if (!UNARY_OPERATORS$2.has(operatorKind)) {
            return DynamicValue.fromUnsupportedSyntax(node);
        }
        const op = UNARY_OPERATORS$2.get(operatorKind);
        const value = this.visitExpression(node.operand, context);
        if (value instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, value);
        }
        else {
            return op(value);
        }
    }
    visitBinaryExpression(node, context) {
        const tokenKind = node.operatorToken.kind;
        if (!BINARY_OPERATORS$2.has(tokenKind)) {
            return DynamicValue.fromUnsupportedSyntax(node);
        }
        const opRecord = BINARY_OPERATORS$2.get(tokenKind);
        let lhs, rhs;
        if (opRecord.literal) {
            lhs = literal(this.visitExpression(node.left, context), (value) => DynamicValue.fromInvalidExpressionType(node.left, value));
            rhs = literal(this.visitExpression(node.right, context), (value) => DynamicValue.fromInvalidExpressionType(node.right, value));
        }
        else {
            lhs = this.visitExpression(node.left, context);
            rhs = this.visitExpression(node.right, context);
        }
        if (lhs instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, lhs);
        }
        else if (rhs instanceof DynamicValue) {
            return DynamicValue.fromDynamicInput(node, rhs);
        }
        else {
            return opRecord.op(lhs, rhs);
        }
    }
    visitParenthesizedExpression(node, context) {
        return this.visitExpression(node.expression, context);
    }
    evaluateFunctionArguments(node, context) {
        const args = [];
        for (const arg of node.arguments) {
            if (ts.isSpreadElement(arg)) {
                args.push(...this.visitSpreadElement(arg, context));
            }
            else {
                args.push(this.visitExpression(arg, context));
            }
        }
        return args;
    }
    visitSpreadElement(node, context) {
        const spread = this.visitExpression(node.expression, context);
        if (spread instanceof DynamicValue) {
            return [DynamicValue.fromDynamicInput(node, spread)];
        }
        else if (!Array.isArray(spread)) {
            return [DynamicValue.fromInvalidExpressionType(node, spread)];
        }
        else {
            return spread;
        }
    }
    visitBindingElement(node, context) {
        const path = [];
        let closestDeclaration = node;
        while (ts.isBindingElement(closestDeclaration) ||
            ts.isArrayBindingPattern(closestDeclaration) ||
            ts.isObjectBindingPattern(closestDeclaration)) {
            if (ts.isBindingElement(closestDeclaration)) {
                path.unshift(closestDeclaration);
            }
            closestDeclaration = closestDeclaration.parent;
        }
        if (!ts.isVariableDeclaration(closestDeclaration) ||
            closestDeclaration.initializer === undefined) {
            return DynamicValue.fromUnknown(node);
        }
        let value = this.visit(closestDeclaration.initializer, context);
        for (const element of path) {
            let key;
            if (ts.isArrayBindingPattern(element.parent)) {
                key = element.parent.elements.indexOf(element);
            }
            else {
                const name = element.propertyName || element.name;
                if (ts.isIdentifier(name)) {
                    key = name.text;
                }
                else {
                    return DynamicValue.fromUnknown(element);
                }
            }
            value = this.accessHelper(element, value, key, context);
            if (value instanceof DynamicValue) {
                return value;
            }
        }
        return value;
    }
    stringNameFromPropertyName(node, context) {
        if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
            return node.text;
        }
        else if (ts.isComputedPropertyName(node)) {
            const literal = this.visitExpression(node.expression, context);
            return typeof literal === 'string' ? literal : undefined;
        }
        else {
            return undefined;
        }
    }
    getReference(node, context) {
        return new Reference(node, owningModule(context));
    }
    visitType(node, context) {
        if (ts.isLiteralTypeNode(node)) {
            return this.visitExpression(node.literal, context);
        }
        else if (ts.isTupleTypeNode(node)) {
            return this.visitTupleType(node, context);
        }
        else if (ts.isNamedTupleMember(node)) {
            return this.visitType(node.type, context);
        }
        else if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.ReadonlyKeyword) {
            return this.visitType(node.type, context);
        }
        else if (ts.isTypeQueryNode(node)) {
            return this.visitTypeQuery(node, context);
        }
        return DynamicValue.fromDynamicType(node);
    }
    visitTupleType(node, context) {
        const res = [];
        for (const elem of node.elements) {
            res.push(this.visitType(elem, context));
        }
        return res;
    }
    visitTypeQuery(node, context) {
        if (!ts.isIdentifier(node.exprName)) {
            return DynamicValue.fromUnknown(node);
        }
        const decl = this.host.getDeclarationOfIdentifier(node.exprName);
        if (decl === null) {
            return DynamicValue.fromUnknownIdentifier(node.exprName);
        }
        const declContext = { ...context, ...joinModuleContext(context, node, decl) };
        return this.visitDeclaration(decl.node, declContext);
    }
}
function isFunctionOrMethodReference(ref) {
    return (ts.isFunctionDeclaration(ref.node) ||
        ts.isMethodDeclaration(ref.node) ||
        ts.isFunctionExpression(ref.node));
}
function literal(value, reject) {
    if (value instanceof EnumValue) {
        value = value.resolved;
    }
    if (value instanceof DynamicValue ||
        value === null ||
        value === undefined ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean') {
        return value;
    }
    return reject(value);
}
function isVariableDeclarationDeclared(node) {
    if (node.parent === undefined || !ts.isVariableDeclarationList(node.parent)) {
        return false;
    }
    const declList = node.parent;
    if (declList.parent === undefined || !ts.isVariableStatement(declList.parent)) {
        return false;
    }
    const varStmt = declList.parent;
    const modifiers = ts.getModifiers(varStmt);
    return (modifiers !== undefined && modifiers.some((mod) => mod.kind === ts.SyntaxKind.DeclareKeyword));
}
const EMPTY = {};
function joinModuleContext(existing, node, decl) {
    if (typeof decl.viaModule === 'string' && decl.viaModule !== existing.absoluteModuleName) {
        return {
            absoluteModuleName: decl.viaModule,
            resolutionContext: node.getSourceFile().fileName,
        };
    }
    else {
        return EMPTY;
    }
}
function owningModule(context, override = null) {
    let specifier = context.absoluteModuleName;
    if (override !== null) {
        specifier = override.specifier;
    }
    if (specifier !== null) {
        return {
            specifier,
            resolutionContext: context.resolutionContext,
        };
    }
    else {
        return null;
    }
}

/**
 * Specifies the compilation mode that is used for the compilation.
 */
exports.CompilationMode = void 0;
(function (CompilationMode) {
    /**
     * Generates fully AOT compiled code using Ivy instructions.
     */
    CompilationMode[CompilationMode["FULL"] = 0] = "FULL";
    /**
     * Generates code using a stable, but intermediate format suitable to be published to NPM.
     */
    CompilationMode[CompilationMode["PARTIAL"] = 1] = "PARTIAL";
    /**
     * Generates code based on each individual source file without using its
     * dependencies (suitable for local dev edit/refresh workflow).
     */
    CompilationMode[CompilationMode["LOCAL"] = 2] = "LOCAL";
})(exports.CompilationMode || (exports.CompilationMode = {}));
exports.HandlerPrecedence = void 0;
(function (HandlerPrecedence) {
    /**
     * Handler with PRIMARY precedence cannot overlap - there can only be one on a given class.
     *
     * If more than one PRIMARY handler matches a class, an error is produced.
     */
    HandlerPrecedence[HandlerPrecedence["PRIMARY"] = 0] = "PRIMARY";
    /**
     * Handlers with SHARED precedence can match any class, possibly in addition to a single PRIMARY
     * handler.
     *
     * It is not an error for a class to have any number of SHARED handlers.
     */
    HandlerPrecedence[HandlerPrecedence["SHARED"] = 1] = "SHARED";
    /**
     * Handlers with WEAK precedence that match a class are ignored if any handlers with stronger
     * precedence match a class.
     */
    HandlerPrecedence[HandlerPrecedence["WEAK"] = 2] = "WEAK";
})(exports.HandlerPrecedence || (exports.HandlerPrecedence = {}));

/**
 * A phase of compilation for which time is tracked in a distinct bucket.
 */
exports.PerfPhase = void 0;
(function (PerfPhase) {
    /**
     * The "default" phase which tracks time not spent in any other phase.
     */
    PerfPhase[PerfPhase["Unaccounted"] = 0] = "Unaccounted";
    /**
     * Time spent setting up the compiler, before a TypeScript program is created.
     *
     * This includes operations like configuring the `ts.CompilerHost` and any wrappers.
     */
    PerfPhase[PerfPhase["Setup"] = 1] = "Setup";
    /**
     * Time spent in `ts.createProgram`, including reading and parsing `ts.SourceFile`s in the
     * `ts.CompilerHost`.
     *
     * This might be an incremental program creation operation.
     */
    PerfPhase[PerfPhase["TypeScriptProgramCreate"] = 2] = "TypeScriptProgramCreate";
    /**
     * Time spent reconciling the contents of an old `ts.Program` with the new incremental one.
     *
     * Only present in incremental compilations.
     */
    PerfPhase[PerfPhase["Reconciliation"] = 3] = "Reconciliation";
    /**
     * Time spent updating an `NgCompiler` instance with a resource-only change.
     *
     * Only present in incremental compilations where the change was resource-only.
     */
    PerfPhase[PerfPhase["ResourceUpdate"] = 4] = "ResourceUpdate";
    /**
     * Time spent calculating the plain TypeScript diagnostics (structural and semantic).
     */
    PerfPhase[PerfPhase["TypeScriptDiagnostics"] = 5] = "TypeScriptDiagnostics";
    /**
     * Time spent in Angular analysis of individual classes in the program.
     */
    PerfPhase[PerfPhase["Analysis"] = 6] = "Analysis";
    /**
     * Time spent in Angular global analysis (synthesis of analysis information into a complete
     * understanding of the program).
     */
    PerfPhase[PerfPhase["Resolve"] = 7] = "Resolve";
    /**
     * Time spent building the import graph of the program in order to perform cycle detection.
     */
    PerfPhase[PerfPhase["CycleDetection"] = 8] = "CycleDetection";
    /**
     * Time spent generating the text of Type Check Blocks in order to perform template type checking.
     */
    PerfPhase[PerfPhase["TcbGeneration"] = 9] = "TcbGeneration";
    /**
     * Time spent updating the `ts.Program` with new Type Check Block code.
     */
    PerfPhase[PerfPhase["TcbUpdateProgram"] = 10] = "TcbUpdateProgram";
    /**
     * Time spent by TypeScript performing its emit operations, including downleveling and writing
     * output files.
     */
    PerfPhase[PerfPhase["TypeScriptEmit"] = 11] = "TypeScriptEmit";
    /**
     * Time spent by Angular performing code transformations of ASTs as they're about to be emitted.
     *
     * This includes the actual code generation step for templates, and occurs during the emit phase
     * (but is tracked separately from `TypeScriptEmit` time).
     */
    PerfPhase[PerfPhase["Compile"] = 12] = "Compile";
    /**
     * Time spent performing a `TemplateTypeChecker` autocompletion operation.
     */
    PerfPhase[PerfPhase["TtcAutocompletion"] = 13] = "TtcAutocompletion";
    /**
     * Time spent computing template type-checking diagnostics.
     */
    PerfPhase[PerfPhase["TtcDiagnostics"] = 14] = "TtcDiagnostics";
    /**
     * Time spent getting a `Symbol` from the `TemplateTypeChecker`.
     */
    PerfPhase[PerfPhase["TtcSymbol"] = 15] = "TtcSymbol";
    /**
     * Time spent by the Angular Language Service calculating a "get references" or a renaming
     * operation.
     */
    PerfPhase[PerfPhase["LsReferencesAndRenames"] = 16] = "LsReferencesAndRenames";
    /**
     * Time spent by the Angular Language Service calculating a "quick info" operation.
     */
    PerfPhase[PerfPhase["LsQuickInfo"] = 17] = "LsQuickInfo";
    /**
     * Time spent by the Angular Language Service calculating a "get type definition" or "get
     * definition" operation.
     */
    PerfPhase[PerfPhase["LsDefinition"] = 18] = "LsDefinition";
    /**
     * Time spent by the Angular Language Service calculating a "get completions" (AKA autocomplete)
     * operation.
     */
    PerfPhase[PerfPhase["LsCompletions"] = 19] = "LsCompletions";
    /**
     * Time spent by the Angular Language Service calculating a "view template typecheck block"
     * operation.
     */
    PerfPhase[PerfPhase["LsTcb"] = 20] = "LsTcb";
    /**
     * Time spent by the Angular Language Service calculating diagnostics.
     */
    PerfPhase[PerfPhase["LsDiagnostics"] = 21] = "LsDiagnostics";
    /**
     * Time spent by the Angular Language Service calculating a "get component locations for template"
     * operation.
     */
    PerfPhase[PerfPhase["LsComponentLocations"] = 22] = "LsComponentLocations";
    /**
     * Time spent by the Angular Language Service calculating signature help.
     */
    PerfPhase[PerfPhase["LsSignatureHelp"] = 23] = "LsSignatureHelp";
    /**
     * Time spent by the Angular Language Service calculating outlining spans.
     */
    PerfPhase[PerfPhase["OutliningSpans"] = 24] = "OutliningSpans";
    /**
     * Tracks the number of `PerfPhase`s, and must appear at the end of the list.
     */
    PerfPhase[PerfPhase["LAST"] = 25] = "LAST";
    /**
     * Time spent by the Angular Language Service calculating code fixes.
     */
    PerfPhase[PerfPhase["LsCodeFixes"] = 26] = "LsCodeFixes";
    /**
     * Time spent by the Angular Language Service to fix all detected same type errors.
     */
    PerfPhase[PerfPhase["LsCodeFixesAll"] = 27] = "LsCodeFixesAll";
    /**
     * Time spent computing possible Angular refactorings.
     */
    PerfPhase[PerfPhase["LSComputeApplicableRefactorings"] = 28] = "LSComputeApplicableRefactorings";
    /**
     * Time spent computing changes for applying a given refactoring.
     */
    PerfPhase[PerfPhase["LSApplyRefactoring"] = 29] = "LSApplyRefactoring";
})(exports.PerfPhase || (exports.PerfPhase = {}));
/**
 * Represents some occurrence during compilation, and is tracked with a counter.
 */
exports.PerfEvent = void 0;
(function (PerfEvent) {
    /**
     * Counts the number of `.d.ts` files in the program.
     */
    PerfEvent[PerfEvent["InputDtsFile"] = 0] = "InputDtsFile";
    /**
     * Counts the number of non-`.d.ts` files in the program.
     */
    PerfEvent[PerfEvent["InputTsFile"] = 1] = "InputTsFile";
    /**
     * An `@Component` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzeComponent"] = 2] = "AnalyzeComponent";
    /**
     * An `@Directive` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzeDirective"] = 3] = "AnalyzeDirective";
    /**
     * An `@Injectable` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzeInjectable"] = 4] = "AnalyzeInjectable";
    /**
     * An `@NgModule` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzeNgModule"] = 5] = "AnalyzeNgModule";
    /**
     * An `@Pipe` class was analyzed.
     */
    PerfEvent[PerfEvent["AnalyzePipe"] = 6] = "AnalyzePipe";
    /**
     * A trait was analyzed.
     *
     * In theory, this should be the sum of the `Analyze` counters for each decorator type.
     */
    PerfEvent[PerfEvent["TraitAnalyze"] = 7] = "TraitAnalyze";
    /**
     * A trait had a prior analysis available from an incremental program, and did not need to be
     * re-analyzed.
     */
    PerfEvent[PerfEvent["TraitReuseAnalysis"] = 8] = "TraitReuseAnalysis";
    /**
     * A `ts.SourceFile` directly changed between the prior program and a new incremental compilation.
     */
    PerfEvent[PerfEvent["SourceFilePhysicalChange"] = 9] = "SourceFilePhysicalChange";
    /**
     * A `ts.SourceFile` did not physically changed, but according to the file dependency graph, has
     * logically changed between the prior program and a new incremental compilation.
     */
    PerfEvent[PerfEvent["SourceFileLogicalChange"] = 10] = "SourceFileLogicalChange";
    /**
     * A `ts.SourceFile` has not logically changed and all of its analysis results were thus available
     * for reuse.
     */
    PerfEvent[PerfEvent["SourceFileReuseAnalysis"] = 11] = "SourceFileReuseAnalysis";
    /**
     * A Type Check Block (TCB) was generated.
     */
    PerfEvent[PerfEvent["GenerateTcb"] = 12] = "GenerateTcb";
    /**
     * A Type Check Block (TCB) could not be generated because inlining was disabled, and the block
     * would've required inlining.
     */
    PerfEvent[PerfEvent["SkipGenerateTcbNoInline"] = 13] = "SkipGenerateTcbNoInline";
    /**
     * A `.ngtypecheck.ts` file could be reused from the previous program and did not need to be
     * regenerated.
     */
    PerfEvent[PerfEvent["ReuseTypeCheckFile"] = 14] = "ReuseTypeCheckFile";
    /**
     * The template type-checking program required changes and had to be updated in an incremental
     * step.
     */
    PerfEvent[PerfEvent["UpdateTypeCheckProgram"] = 15] = "UpdateTypeCheckProgram";
    /**
     * The compiler was able to prove that a `ts.SourceFile` did not need to be re-emitted.
     */
    PerfEvent[PerfEvent["EmitSkipSourceFile"] = 16] = "EmitSkipSourceFile";
    /**
     * A `ts.SourceFile` was emitted.
     */
    PerfEvent[PerfEvent["EmitSourceFile"] = 17] = "EmitSourceFile";
    /**
     * Tracks the number of `PrefEvent`s, and must appear at the end of the list.
     */
    PerfEvent[PerfEvent["LAST"] = 18] = "LAST";
})(exports.PerfEvent || (exports.PerfEvent = {}));
/**
 * Represents a checkpoint during compilation at which the memory usage of the compiler should be
 * recorded.
 */
exports.PerfCheckpoint = void 0;
(function (PerfCheckpoint) {
    /**
     * The point at which the `PerfRecorder` was created, and ideally tracks memory used before any
     * compilation structures are created.
     */
    PerfCheckpoint[PerfCheckpoint["Initial"] = 0] = "Initial";
    /**
     * The point just after the `ts.Program` has been created.
     */
    PerfCheckpoint[PerfCheckpoint["TypeScriptProgramCreate"] = 1] = "TypeScriptProgramCreate";
    /**
     * The point just before Angular analysis starts.
     *
     * In the main usage pattern for the compiler, TypeScript diagnostics have been calculated at this
     * point, so the `ts.TypeChecker` has fully ingested the current program, all `ts.Type` structures
     * and `ts.Symbol`s have been created.
     */
    PerfCheckpoint[PerfCheckpoint["PreAnalysis"] = 2] = "PreAnalysis";
    /**
     * The point just after Angular analysis completes.
     */
    PerfCheckpoint[PerfCheckpoint["Analysis"] = 3] = "Analysis";
    /**
     * The point just after Angular resolution is complete.
     */
    PerfCheckpoint[PerfCheckpoint["Resolve"] = 4] = "Resolve";
    /**
     * The point just after Type Check Blocks (TCBs) have been generated.
     */
    PerfCheckpoint[PerfCheckpoint["TtcGeneration"] = 5] = "TtcGeneration";
    /**
     * The point just after the template type-checking program has been updated with any new TCBs.
     */
    PerfCheckpoint[PerfCheckpoint["TtcUpdateProgram"] = 6] = "TtcUpdateProgram";
    /**
     * The point just before emit begins.
     *
     * In the main usage pattern for the compiler, all template type-checking diagnostics have been
     * requested at this point.
     */
    PerfCheckpoint[PerfCheckpoint["PreEmit"] = 7] = "PreEmit";
    /**
     * The point just after the program has been fully emitted.
     */
    PerfCheckpoint[PerfCheckpoint["Emit"] = 8] = "Emit";
    /**
     * Tracks the number of `PerfCheckpoint`s, and must appear at the end of the list.
     */
    PerfCheckpoint[PerfCheckpoint["LAST"] = 9] = "LAST";
})(exports.PerfCheckpoint || (exports.PerfCheckpoint = {}));

exports.TraitState = void 0;
(function (TraitState) {
    /**
     * Pending traits are freshly created and have never been analyzed.
     */
    TraitState[TraitState["Pending"] = 0] = "Pending";
    /**
     * Analyzed traits have successfully been analyzed, but are pending resolution.
     */
    TraitState[TraitState["Analyzed"] = 1] = "Analyzed";
    /**
     * Resolved traits have successfully been analyzed and resolved and are ready for compilation.
     */
    TraitState[TraitState["Resolved"] = 2] = "Resolved";
    /**
     * Skipped traits are no longer considered for compilation.
     */
    TraitState[TraitState["Skipped"] = 3] = "Skipped";
})(exports.TraitState || (exports.TraitState = {}));
/**
 * The value side of `Trait` exposes a helper to create a `Trait` in a pending state (by delegating
 * to `TraitImpl`).
 */
const Trait = {
    pending: (handler, detected) => TraitImpl.pending(handler, detected),
};
/**
 * An implementation of the `Trait` type which transitions safely between the various
 * `TraitState`s.
 */
class TraitImpl {
    state = exports.TraitState.Pending;
    handler;
    detected;
    analysis = null;
    symbol = null;
    resolution = null;
    analysisDiagnostics = null;
    resolveDiagnostics = null;
    typeCheckDiagnostics = null;
    constructor(handler, detected) {
        this.handler = handler;
        this.detected = detected;
    }
    toAnalyzed(analysis, diagnostics, symbol) {
        // Only pending traits can be analyzed.
        this.assertTransitionLegal(exports.TraitState.Pending, exports.TraitState.Analyzed);
        this.analysis = analysis;
        this.analysisDiagnostics = diagnostics;
        this.symbol = symbol;
        this.state = exports.TraitState.Analyzed;
        return this;
    }
    toResolved(resolution, diagnostics) {
        // Only analyzed traits can be resolved.
        this.assertTransitionLegal(exports.TraitState.Analyzed, exports.TraitState.Resolved);
        if (this.analysis === null) {
            throw new Error(`Cannot transition an Analyzed trait with a null analysis to Resolved`);
        }
        this.resolution = resolution;
        this.state = exports.TraitState.Resolved;
        this.resolveDiagnostics = diagnostics;
        this.typeCheckDiagnostics = null;
        return this;
    }
    toSkipped() {
        // Only pending traits can be skipped.
        this.assertTransitionLegal(exports.TraitState.Pending, exports.TraitState.Skipped);
        this.state = exports.TraitState.Skipped;
        return this;
    }
    /**
     * Verifies that the trait is currently in one of the `allowedState`s.
     *
     * If correctly used, the `Trait` type and transition methods prevent illegal transitions from
     * occurring. However, if a reference to the `TraitImpl` instance typed with the previous
     * interface is retained after calling one of its transition methods, it will allow for illegal
     * transitions to take place. Hence, this assertion provides a little extra runtime protection.
     */
    assertTransitionLegal(allowedState, transitionTo) {
        if (!(this.state === allowedState)) {
            throw new Error(`Assertion failure: cannot transition from ${exports.TraitState[this.state]} to ${exports.TraitState[transitionTo]}.`);
        }
    }
    /**
     * Construct a new `TraitImpl` in the pending state.
     */
    static pending(handler, detected) {
        return new TraitImpl(handler, detected);
    }
}

/**
 * The current context of a translator visitor as it traverses the AST tree.
 *
 * It tracks whether we are in the process of outputting a statement or an expression.
 */
let Context$1 = class Context {
    isStatement;
    constructor(isStatement) {
        this.isStatement = isStatement;
    }
    get withExpressionMode() {
        return this.isStatement ? new Context(false) : this;
    }
    get withStatementMode() {
        return !this.isStatement ? new Context(true) : this;
    }
};

/**
 * Generates a helper for `ImportManagerConfig` to generate unique identifiers
 * for a given source file.
 */
function createGenerateUniqueIdentifierHelper() {
    const generatedIdentifiers = new Set();
    const isGeneratedIdentifier = (sf, identifierName) => generatedIdentifiers.has(`${sf.fileName}@@${identifierName}`);
    const markIdentifierAsGenerated = (sf, identifierName) => generatedIdentifiers.add(`${sf.fileName}@@${identifierName}`);
    return (sourceFile, symbolName) => {
        const sf = sourceFile;
        if (sf.identifiers === undefined) {
            throw new Error('Source file unexpectedly lacks map of parsed `identifiers`.');
        }
        const isUniqueIdentifier = (name) => !sf.identifiers.has(name) && !isGeneratedIdentifier(sf, name);
        if (isUniqueIdentifier(symbolName)) {
            markIdentifierAsGenerated(sf, symbolName);
            return null;
        }
        let name = null;
        let counter = 1;
        do {
            name = `${symbolName}_${counter++}`;
        } while (!isUniqueIdentifier(name));
        markIdentifierAsGenerated(sf, name);
        return ts.factory.createUniqueName(name, ts.GeneratedIdentifierFlags.Optimistic);
    };
}

/**
 * Creates a TypeScript transform for the given import manager.
 *
 *  - The transform updates existing imports with new symbols to be added.
 *  - The transform adds new necessary imports.
 *  - The transform inserts additional optional statements after imports.
 *  - The transform deletes any nodes that are marked for deletion by the manager.
 */
function createTsTransformForImportManager(manager, extraStatementsForFiles) {
    return (ctx) => {
        const { affectedFiles, newImports, updatedImports, reusedOriginalAliasDeclarations, deletedImports, } = manager.finalize();
        // If we re-used existing source file alias declarations, mark those as referenced so TypeScript
        // doesn't drop these thinking they are unused.
        if (reusedOriginalAliasDeclarations.size > 0) {
            const referencedAliasDeclarations = loadIsReferencedAliasDeclarationPatch(ctx);
            if (referencedAliasDeclarations !== null) {
                reusedOriginalAliasDeclarations.forEach((aliasDecl) => referencedAliasDeclarations.add(aliasDecl));
            }
        }
        // Update the set of affected files to include files that need extra statements to be inserted.
        if (extraStatementsForFiles !== undefined) {
            for (const [fileName, statements] of extraStatementsForFiles.entries()) {
                if (statements.length > 0) {
                    affectedFiles.add(fileName);
                }
            }
        }
        const visitStatement = (node) => {
            if (!ts.isImportDeclaration(node)) {
                return node;
            }
            if (deletedImports.has(node)) {
                return undefined;
            }
            if (node.importClause === undefined || !ts.isImportClause(node.importClause)) {
                return node;
            }
            const clause = node.importClause;
            if (clause.namedBindings === undefined ||
                !ts.isNamedImports(clause.namedBindings) ||
                !updatedImports.has(clause.namedBindings)) {
                return node;
            }
            const newClause = ctx.factory.updateImportClause(clause, clause.isTypeOnly, clause.name, updatedImports.get(clause.namedBindings));
            const newImport = ctx.factory.updateImportDeclaration(node, node.modifiers, newClause, node.moduleSpecifier, node.attributes);
            // This tricks TypeScript into thinking that the `importClause` is still optimizable.
            // By default, TS assumes, no specifiers are elide-able if the clause of the "original
            // node" has changed. google3:
            // typescript/unstable/src/compiler/transformers/ts.ts;l=456;rcl=611254538.
            ts.setOriginalNode(newImport, {
                importClause: newClause,
                kind: newImport.kind,
            });
            return newImport;
        };
        return (sourceFile) => {
            if (!affectedFiles.has(sourceFile.fileName)) {
                return sourceFile;
            }
            sourceFile = ts.visitEachChild(sourceFile, visitStatement, ctx);
            // Filter out the existing imports and the source file body.
            // All new statements will be inserted between them.
            const extraStatements = extraStatementsForFiles?.get(sourceFile.fileName) ?? [];
            const existingImports = [];
            const body = [];
            for (const statement of sourceFile.statements) {
                if (isImportStatement(statement)) {
                    existingImports.push(statement);
                }
                else {
                    body.push(statement);
                }
            }
            return ctx.factory.updateSourceFile(sourceFile, [
                ...existingImports,
                ...(newImports.get(sourceFile.fileName) ?? []),
                ...extraStatements,
                ...body,
            ], sourceFile.isDeclarationFile, sourceFile.referencedFiles, sourceFile.typeReferenceDirectives, sourceFile.hasNoDefaultLib, sourceFile.libReferenceDirectives);
        };
    };
}
/** Whether the given statement is an import statement. */
function isImportStatement(stmt) {
    return (ts.isImportDeclaration(stmt) || ts.isImportEqualsDeclaration(stmt) || ts.isNamespaceImport(stmt));
}

/** Attempts to efficiently re-use previous generated import requests. */
function attemptToReuseGeneratedImports(tracker, request) {
    const requestHash = hashImportRequest(request);
    // In case the given import has been already generated previously, we just return
    // the previous generated identifier in order to avoid duplicate generated imports.
    const existingExactImport = tracker.directReuseCache.get(requestHash);
    if (existingExactImport !== undefined) {
        return existingExactImport;
    }
    const potentialNamespaceImport = tracker.namespaceImportReuseCache.get(request.exportModuleSpecifier);
    if (potentialNamespaceImport === undefined) {
        return null;
    }
    if (request.exportSymbolName === null) {
        return potentialNamespaceImport;
    }
    return [potentialNamespaceImport, ts.factory.createIdentifier(request.exportSymbolName)];
}
/** Captures the given import request and its generated reference node/path for future re-use. */
function captureGeneratedImport(request, tracker, referenceNode) {
    tracker.directReuseCache.set(hashImportRequest(request), referenceNode);
    if (request.exportSymbolName === null && !Array.isArray(referenceNode)) {
        tracker.namespaceImportReuseCache.set(request.exportModuleSpecifier, referenceNode);
    }
}
/** Generates a unique hash for the given import request. */
function hashImportRequest(req) {
    return `${req.requestedFile.fileName}:${req.exportModuleSpecifier}:${req.exportSymbolName}${req.unsafeAliasOverride ? ':' + req.unsafeAliasOverride : ''}`;
}

/** Attempts to re-use original source file imports for the given request. */
function attemptToReuseExistingSourceFileImports(tracker, sourceFile, request) {
    // Walk through all source-file top-level statements and search for import declarations
    // that already match the specified "moduleName" and can be updated to import the
    // given symbol. If no matching import can be found, the last import in the source-file
    // will be used as starting point for a new import that will be generated.
    let candidateImportToBeUpdated = null;
    for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
        const statement = sourceFile.statements[i];
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
            continue;
        }
        // Side-effect imports are ignored, or type-only imports.
        // TODO: Consider re-using type-only imports efficiently.
        if (!statement.importClause || statement.importClause.isTypeOnly) {
            continue;
        }
        const moduleSpecifier = statement.moduleSpecifier.text;
        // If the import does not match the module name, or requested target file, continue.
        // Note: In the future, we may consider performing better analysis here. E.g. resolve paths,
        // or try to detect re-usable symbols via type-checking.
        if (moduleSpecifier !== request.exportModuleSpecifier) {
            continue;
        }
        if (statement.importClause.namedBindings) {
            const namedBindings = statement.importClause.namedBindings;
            // A namespace import can be reused.
            if (ts.isNamespaceImport(namedBindings)) {
                tracker.reusedAliasDeclarations.add(namedBindings);
                if (request.exportSymbolName === null) {
                    return namedBindings.name;
                }
                return [namedBindings.name, ts.factory.createIdentifier(request.exportSymbolName)];
            }
            // Named imports can be re-used if a specific symbol is requested.
            if (ts.isNamedImports(namedBindings) && request.exportSymbolName !== null) {
                const existingElement = namedBindings.elements.find((e) => {
                    // TODO: Consider re-using type-only imports efficiently.
                    let nameMatches;
                    if (request.unsafeAliasOverride) {
                        // If a specific alias is passed, both the original name and alias have to match.
                        nameMatches =
                            e.propertyName?.text === request.exportSymbolName &&
                                e.name.text === request.unsafeAliasOverride;
                    }
                    else {
                        nameMatches = e.propertyName
                            ? e.propertyName.text === request.exportSymbolName
                            : e.name.text === request.exportSymbolName;
                    }
                    return !e.isTypeOnly && nameMatches;
                });
                if (existingElement !== undefined) {
                    tracker.reusedAliasDeclarations.add(existingElement);
                    return existingElement.name;
                }
                // In case the symbol could not be found in an existing import, we
                // keep track of the import declaration as it can be updated to include
                // the specified symbol name without having to create a new import.
                candidateImportToBeUpdated = statement;
            }
        }
    }
    if (candidateImportToBeUpdated === null || request.exportSymbolName === null) {
        return null;
    }
    // We have a candidate import. Update it to import what we need.
    if (!tracker.updatedImports.has(candidateImportToBeUpdated)) {
        tracker.updatedImports.set(candidateImportToBeUpdated, []);
    }
    const symbolsToBeImported = tracker.updatedImports.get(candidateImportToBeUpdated);
    const propertyName = ts.factory.createIdentifier(request.exportSymbolName);
    const fileUniqueAlias = request.unsafeAliasOverride
        ? ts.factory.createIdentifier(request.unsafeAliasOverride)
        : tracker.generateUniqueIdentifier(sourceFile, request.exportSymbolName);
    // Since it can happen that multiple classes need to be imported within the
    // specified source file and we want to add the identifiers to the existing
    // import declaration, we need to keep track of the updated import declarations.
    // We can't directly update the import declaration for each identifier as this
    // would not be reflected in the AST— or would throw of update recording offsets.
    symbolsToBeImported.push({
        propertyName,
        fileUniqueAlias,
    });
    return fileUniqueAlias ?? propertyName;
}

/**
 * Preset configuration for forcing namespace imports.
 *
 * This preset is commonly used to avoid test differences to previous
 * versions of the `ImportManager`.
 */
const presetImportManagerForceNamespaceImports = {
    // Forcing namespace imports also means no-reuse.
    // Re-using would otherwise become more complicated and we don't
    // expect re-usable namespace imports.
    disableOriginalSourceFileReuse: true,
    forceGenerateNamespacesForNewImports: true,
};
/**
 * Import manager that can be used to conveniently and efficiently generate
 * imports It efficiently re-uses existing source file imports, or previous
 * generated imports.
 *
 * These capabilities are important for efficient TypeScript transforms that
 * minimize structural changes to the dependency graph of source files, enabling
 * as much incremental re-use as possible.
 *
 * Those imports may be inserted via a TypeScript transform, or via manual string
 * manipulation using e.g. `magic-string`.
 */
class ImportManager {
    /** List of new imports that will be inserted into given source files. */
    newImports = new Map();
    /**
     * Keeps track of imports marked for removal. The root-level key is the file from which the
     * import should be removed, the inner map key is the name of the module from which the symbol
     * is being imported. The value of the inner map is a set of symbol names that should be removed.
     * Note! the inner map tracks the original names of the imported symbols, not their local aliases.
     */
    removedImports = new Map();
    nextUniqueIndex = 0;
    config;
    reuseSourceFileImportsTracker;
    reuseGeneratedImportsTracker = {
        directReuseCache: new Map(),
        namespaceImportReuseCache: new Map(),
    };
    constructor(config = {}) {
        this.config = {
            shouldUseSingleQuotes: config.shouldUseSingleQuotes ?? (() => false),
            rewriter: config.rewriter ?? null,
            disableOriginalSourceFileReuse: config.disableOriginalSourceFileReuse ?? false,
            forceGenerateNamespacesForNewImports: config.forceGenerateNamespacesForNewImports ?? false,
            namespaceImportPrefix: config.namespaceImportPrefix ?? 'i',
            generateUniqueIdentifier: config.generateUniqueIdentifier ?? createGenerateUniqueIdentifierHelper(),
        };
        this.reuseSourceFileImportsTracker = {
            generateUniqueIdentifier: this.config.generateUniqueIdentifier,
            reusedAliasDeclarations: new Set(),
            updatedImports: new Map(),
        };
    }
    /** Adds a side-effect import for the given module. */
    addSideEffectImport(requestedFile, moduleSpecifier) {
        if (this.config.rewriter !== null) {
            moduleSpecifier = this.config.rewriter.rewriteSpecifier(moduleSpecifier, requestedFile.fileName);
        }
        this._getNewImportsTrackerForFile(requestedFile).sideEffectImports.add(moduleSpecifier);
    }
    addImport(request) {
        if (this.config.rewriter !== null) {
            if (request.exportSymbolName !== null) {
                request.exportSymbolName = this.config.rewriter.rewriteSymbol(request.exportSymbolName, request.exportModuleSpecifier);
            }
            request.exportModuleSpecifier = this.config.rewriter.rewriteSpecifier(request.exportModuleSpecifier, request.requestedFile.fileName);
        }
        // Remove the newly-added import from the set of removed imports.
        if (request.exportSymbolName !== null && !request.asTypeReference) {
            this.removedImports
                .get(request.requestedFile)
                ?.get(request.exportModuleSpecifier)
                ?.delete(request.exportSymbolName);
        }
        // Attempt to re-use previous identical import requests.
        const previousGeneratedImportRef = attemptToReuseGeneratedImports(this.reuseGeneratedImportsTracker, request);
        if (previousGeneratedImportRef !== null) {
            return createImportReference(!!request.asTypeReference, previousGeneratedImportRef);
        }
        // Generate a new one, and cache it.
        const resultImportRef = this._generateNewImport(request);
        captureGeneratedImport(request, this.reuseGeneratedImportsTracker, resultImportRef);
        return createImportReference(!!request.asTypeReference, resultImportRef);
    }
    /**
     * Marks all imported symbols with a specific name for removal.
     * Call `addImport` to undo this operation.
     * @param requestedFile File from which to remove the imports.
     * @param exportSymbolName Declared name of the symbol being removed.
     * @param moduleSpecifier Module from which the symbol is being imported.
     */
    removeImport(requestedFile, exportSymbolName, moduleSpecifier) {
        let moduleMap = this.removedImports.get(requestedFile);
        if (!moduleMap) {
            moduleMap = new Map();
            this.removedImports.set(requestedFile, moduleMap);
        }
        let removedSymbols = moduleMap.get(moduleSpecifier);
        if (!removedSymbols) {
            removedSymbols = new Set();
            moduleMap.set(moduleSpecifier, removedSymbols);
        }
        removedSymbols.add(exportSymbolName);
    }
    _generateNewImport(request) {
        const { requestedFile: sourceFile } = request;
        const disableOriginalSourceFileReuse = this.config.disableOriginalSourceFileReuse;
        const forceGenerateNamespacesForNewImports = this.config.forceGenerateNamespacesForNewImports;
        // If desired, attempt to re-use original source file imports as a base, or as much as possible.
        // This may involve updates to existing import named bindings.
        if (!disableOriginalSourceFileReuse) {
            const reuseResult = attemptToReuseExistingSourceFileImports(this.reuseSourceFileImportsTracker, sourceFile, request);
            if (reuseResult !== null) {
                return reuseResult;
            }
        }
        // A new import needs to be generated.
        // No candidate existing import was found.
        const { namedImports, namespaceImports } = this._getNewImportsTrackerForFile(sourceFile);
        // If a namespace import is requested, or the symbol should be forcibly
        // imported through namespace imports:
        if (request.exportSymbolName === null || forceGenerateNamespacesForNewImports) {
            let namespaceImportName = `${this.config.namespaceImportPrefix}${this.nextUniqueIndex++}`;
            if (this.config.rewriter) {
                namespaceImportName = this.config.rewriter.rewriteNamespaceImportIdentifier(namespaceImportName, request.exportModuleSpecifier);
            }
            const namespaceImport = ts.factory.createNamespaceImport(this.config.generateUniqueIdentifier(sourceFile, namespaceImportName) ??
                ts.factory.createIdentifier(namespaceImportName));
            namespaceImports.set(request.exportModuleSpecifier, namespaceImport);
            // Capture the generated namespace import alone, to allow re-use.
            captureGeneratedImport({ ...request, exportSymbolName: null }, this.reuseGeneratedImportsTracker, namespaceImport.name);
            if (request.exportSymbolName !== null) {
                return [namespaceImport.name, ts.factory.createIdentifier(request.exportSymbolName)];
            }
            return namespaceImport.name;
        }
        // Otherwise, an individual named import is requested.
        if (!namedImports.has(request.exportModuleSpecifier)) {
            namedImports.set(request.exportModuleSpecifier, []);
        }
        const exportSymbolName = ts.factory.createIdentifier(request.exportSymbolName);
        const fileUniqueName = request.unsafeAliasOverride
            ? null
            : this.config.generateUniqueIdentifier(sourceFile, request.exportSymbolName);
        let needsAlias;
        let specifierName;
        if (request.unsafeAliasOverride) {
            needsAlias = true;
            specifierName = ts.factory.createIdentifier(request.unsafeAliasOverride);
        }
        else if (fileUniqueName !== null) {
            needsAlias = true;
            specifierName = fileUniqueName;
        }
        else {
            needsAlias = false;
            specifierName = exportSymbolName;
        }
        namedImports
            .get(request.exportModuleSpecifier)
            .push(ts.factory.createImportSpecifier(false, needsAlias ? exportSymbolName : undefined, specifierName));
        return specifierName;
    }
    /**
     * Finalizes the import manager by computing all necessary import changes
     * and returning them.
     *
     * Changes are collected once at the end, after all imports are requested,
     * because this simplifies building up changes to existing imports that need
     * to be updated, and allows more trivial re-use of previous generated imports.
     */
    finalize() {
        const affectedFiles = new Set();
        const updatedImportsResult = new Map();
        const newImportsResult = new Map();
        const deletedImports = new Set();
        const importDeclarationsPerFile = new Map();
        const addNewImport = (fileName, importDecl) => {
            affectedFiles.add(fileName);
            if (newImportsResult.has(fileName)) {
                newImportsResult.get(fileName).push(importDecl);
            }
            else {
                newImportsResult.set(fileName, [importDecl]);
            }
        };
        // Collect original source file imports that need to be updated.
        this.reuseSourceFileImportsTracker.updatedImports.forEach((expressions, importDecl) => {
            const sourceFile = importDecl.getSourceFile();
            const namedBindings = importDecl.importClause.namedBindings;
            const moduleName = importDecl.moduleSpecifier.text;
            const newElements = namedBindings.elements
                .concat(expressions.map(({ propertyName, fileUniqueAlias }) => ts.factory.createImportSpecifier(false, fileUniqueAlias !== null ? propertyName : undefined, fileUniqueAlias ?? propertyName)))
                .filter((specifier) => this._canAddSpecifier(sourceFile, moduleName, specifier));
            affectedFiles.add(sourceFile.fileName);
            if (newElements.length === 0) {
                deletedImports.add(importDecl);
            }
            else {
                updatedImportsResult.set(namedBindings, ts.factory.updateNamedImports(namedBindings, newElements));
            }
        });
        this.removedImports.forEach((removeMap, sourceFile) => {
            if (removeMap.size === 0) {
                return;
            }
            let allImports = importDeclarationsPerFile.get(sourceFile);
            if (!allImports) {
                allImports = sourceFile.statements.filter(ts.isImportDeclaration);
                importDeclarationsPerFile.set(sourceFile, allImports);
            }
            for (const node of allImports) {
                if (!node.importClause?.namedBindings ||
                    !ts.isNamedImports(node.importClause.namedBindings) ||
                    this.reuseSourceFileImportsTracker.updatedImports.has(node) ||
                    deletedImports.has(node)) {
                    continue;
                }
                const namedBindings = node.importClause.namedBindings;
                const moduleName = node.moduleSpecifier.text;
                const newImports = namedBindings.elements.filter((specifier) => this._canAddSpecifier(sourceFile, moduleName, specifier));
                if (newImports.length === 0) {
                    affectedFiles.add(sourceFile.fileName);
                    deletedImports.add(node);
                }
                else if (newImports.length !== namedBindings.elements.length) {
                    affectedFiles.add(sourceFile.fileName);
                    updatedImportsResult.set(namedBindings, ts.factory.updateNamedImports(namedBindings, newImports));
                }
            }
        });
        // Collect all new imports to be added. Named imports, namespace imports or side-effects.
        this.newImports.forEach(({ namedImports, namespaceImports, sideEffectImports }, sourceFile) => {
            const useSingleQuotes = this.config.shouldUseSingleQuotes(sourceFile);
            const fileName = sourceFile.fileName;
            sideEffectImports.forEach((moduleName) => {
                addNewImport(fileName, ts.factory.createImportDeclaration(undefined, undefined, ts.factory.createStringLiteral(moduleName)));
            });
            namespaceImports.forEach((namespaceImport, moduleName) => {
                const newImport = ts.factory.createImportDeclaration(undefined, ts.factory.createImportClause(false, undefined, namespaceImport), ts.factory.createStringLiteral(moduleName, useSingleQuotes));
                // IMPORTANT: Set the original TS node to the `ts.ImportDeclaration`. This allows
                // downstream transforms such as tsickle to properly process references to this import.
                //
                // This operation is load-bearing in g3 as some imported modules contain special metadata
                // generated by clutz, which tsickle uses to transform imports and references to those
                // imports. See: `google3: node_modules/tsickle/src/googmodule.ts;l=637-640;rcl=615418148`
                ts.setOriginalNode(namespaceImport.name, newImport);
                addNewImport(fileName, newImport);
            });
            namedImports.forEach((specifiers, moduleName) => {
                const filteredSpecifiers = specifiers.filter((specifier) => this._canAddSpecifier(sourceFile, moduleName, specifier));
                if (filteredSpecifiers.length > 0) {
                    const newImport = ts.factory.createImportDeclaration(undefined, ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports(filteredSpecifiers)), ts.factory.createStringLiteral(moduleName, useSingleQuotes));
                    addNewImport(fileName, newImport);
                }
            });
        });
        return {
            affectedFiles,
            newImports: newImportsResult,
            updatedImports: updatedImportsResult,
            reusedOriginalAliasDeclarations: this.reuseSourceFileImportsTracker.reusedAliasDeclarations,
            deletedImports,
        };
    }
    /**
     * Gets a TypeScript transform for the import manager.
     *
     * @param extraStatementsMap Additional set of statements to be inserted
     *   for given source files after their imports. E.g. top-level constants.
     */
    toTsTransform(extraStatementsMap) {
        return createTsTransformForImportManager(this, extraStatementsMap);
    }
    /**
     * Transforms a single file as a shorthand, using {@link toTsTransform}.
     *
     * @param extraStatementsMap Additional set of statements to be inserted
     *   for given source files after their imports. E.g. top-level constants.
     */
    transformTsFile(ctx, file, extraStatementsAfterImports) {
        const extraStatementsMap = extraStatementsAfterImports
            ? new Map([[file.fileName, extraStatementsAfterImports]])
            : undefined;
        return this.toTsTransform(extraStatementsMap)(ctx)(file);
    }
    _getNewImportsTrackerForFile(file) {
        if (!this.newImports.has(file)) {
            this.newImports.set(file, {
                namespaceImports: new Map(),
                namedImports: new Map(),
                sideEffectImports: new Set(),
            });
        }
        return this.newImports.get(file);
    }
    _canAddSpecifier(sourceFile, moduleSpecifier, specifier) {
        return !this.removedImports
            .get(sourceFile)
            ?.get(moduleSpecifier)
            ?.has((specifier.propertyName || specifier.name).text);
    }
}
/** Creates an import reference based on the given identifier, or nested access. */
function createImportReference(asTypeReference, ref) {
    if (asTypeReference) {
        return Array.isArray(ref) ? ts.factory.createQualifiedName(ref[0], ref[1]) : ref;
    }
    else {
        return Array.isArray(ref) ? ts.factory.createPropertyAccessExpression(ref[0], ref[1]) : ref;
    }
}

const UNARY_OPERATORS$1 = new Map([
    [compiler.UnaryOperator.Minus, '-'],
    [compiler.UnaryOperator.Plus, '+'],
]);
const BINARY_OPERATORS$1 = new Map([
    [compiler.BinaryOperator.And, '&&'],
    [compiler.BinaryOperator.Bigger, '>'],
    [compiler.BinaryOperator.BiggerEquals, '>='],
    [compiler.BinaryOperator.BitwiseAnd, '&'],
    [compiler.BinaryOperator.BitwiseOr, '|'],
    [compiler.BinaryOperator.Divide, '/'],
    [compiler.BinaryOperator.Equals, '=='],
    [compiler.BinaryOperator.Identical, '==='],
    [compiler.BinaryOperator.Lower, '<'],
    [compiler.BinaryOperator.LowerEquals, '<='],
    [compiler.BinaryOperator.Minus, '-'],
    [compiler.BinaryOperator.Modulo, '%'],
    [compiler.BinaryOperator.Multiply, '*'],
    [compiler.BinaryOperator.NotEquals, '!='],
    [compiler.BinaryOperator.NotIdentical, '!=='],
    [compiler.BinaryOperator.Or, '||'],
    [compiler.BinaryOperator.Plus, '+'],
    [compiler.BinaryOperator.NullishCoalesce, '??'],
    [compiler.BinaryOperator.Exponentiation, '**'],
    [compiler.BinaryOperator.In, 'in'],
]);
class ExpressionTranslatorVisitor {
    factory;
    imports;
    contextFile;
    downlevelTaggedTemplates;
    downlevelVariableDeclarations;
    recordWrappedNode;
    constructor(factory, imports, contextFile, options) {
        this.factory = factory;
        this.imports = imports;
        this.contextFile = contextFile;
        this.downlevelTaggedTemplates = options.downlevelTaggedTemplates === true;
        this.downlevelVariableDeclarations = options.downlevelVariableDeclarations === true;
        this.recordWrappedNode = options.recordWrappedNode || (() => { });
    }
    visitDeclareVarStmt(stmt, context) {
        const varType = this.downlevelVariableDeclarations
            ? 'var'
            : stmt.hasModifier(compiler.StmtModifier.Final)
                ? 'const'
                : 'let';
        return this.attachComments(this.factory.createVariableDeclaration(stmt.name, stmt.value?.visitExpression(this, context.withExpressionMode), varType), stmt.leadingComments);
    }
    visitDeclareFunctionStmt(stmt, context) {
        return this.attachComments(this.factory.createFunctionDeclaration(stmt.name, stmt.params.map((param) => param.name), this.factory.createBlock(this.visitStatements(stmt.statements, context.withStatementMode))), stmt.leadingComments);
    }
    visitExpressionStmt(stmt, context) {
        return this.attachComments(this.factory.createExpressionStatement(stmt.expr.visitExpression(this, context.withStatementMode)), stmt.leadingComments);
    }
    visitReturnStmt(stmt, context) {
        return this.attachComments(this.factory.createReturnStatement(stmt.value.visitExpression(this, context.withExpressionMode)), stmt.leadingComments);
    }
    visitIfStmt(stmt, context) {
        return this.attachComments(this.factory.createIfStatement(stmt.condition.visitExpression(this, context), this.factory.createBlock(this.visitStatements(stmt.trueCase, context.withStatementMode)), stmt.falseCase.length > 0
            ? this.factory.createBlock(this.visitStatements(stmt.falseCase, context.withStatementMode))
            : null), stmt.leadingComments);
    }
    visitReadVarExpr(ast, _context) {
        const identifier = this.factory.createIdentifier(ast.name);
        this.setSourceMapRange(identifier, ast.sourceSpan);
        return identifier;
    }
    visitWriteVarExpr(expr, context) {
        const assignment = this.factory.createAssignment(this.setSourceMapRange(this.factory.createIdentifier(expr.name), expr.sourceSpan), expr.value.visitExpression(this, context));
        return context.isStatement
            ? assignment
            : this.factory.createParenthesizedExpression(assignment);
    }
    visitWriteKeyExpr(expr, context) {
        const exprContext = context.withExpressionMode;
        const target = this.factory.createElementAccess(expr.receiver.visitExpression(this, exprContext), expr.index.visitExpression(this, exprContext));
        const assignment = this.factory.createAssignment(target, expr.value.visitExpression(this, exprContext));
        return context.isStatement
            ? assignment
            : this.factory.createParenthesizedExpression(assignment);
    }
    visitWritePropExpr(expr, context) {
        const target = this.factory.createPropertyAccess(expr.receiver.visitExpression(this, context), expr.name);
        return this.factory.createAssignment(target, expr.value.visitExpression(this, context));
    }
    visitInvokeFunctionExpr(ast, context) {
        return this.setSourceMapRange(this.factory.createCallExpression(ast.fn.visitExpression(this, context), ast.args.map((arg) => arg.visitExpression(this, context)), ast.pure), ast.sourceSpan);
    }
    visitTaggedTemplateLiteralExpr(ast, context) {
        return this.setSourceMapRange(this.createTaggedTemplateExpression(ast.tag.visitExpression(this, context), this.getTemplateLiteralFromAst(ast.template, context)), ast.sourceSpan);
    }
    visitTemplateLiteralExpr(ast, context) {
        return this.setSourceMapRange(this.factory.createTemplateLiteral(this.getTemplateLiteralFromAst(ast, context)), ast.sourceSpan);
    }
    visitInstantiateExpr(ast, context) {
        return this.factory.createNewExpression(ast.classExpr.visitExpression(this, context), ast.args.map((arg) => arg.visitExpression(this, context)));
    }
    visitLiteralExpr(ast, _context) {
        return this.setSourceMapRange(this.factory.createLiteral(ast.value), ast.sourceSpan);
    }
    visitLocalizedString(ast, context) {
        // A `$localize` message consists of `messageParts` and `expressions`, which get interleaved
        // together. The interleaved pieces look like:
        // `[messagePart0, expression0, messagePart1, expression1, messagePart2]`
        //
        // Note that there is always a message part at the start and end, and so therefore
        // `messageParts.length === expressions.length + 1`.
        //
        // Each message part may be prefixed with "metadata", which is wrapped in colons (:) delimiters.
        // The metadata is attached to the first and subsequent message parts by calls to
        // `serializeI18nHead()` and `serializeI18nTemplatePart()` respectively.
        //
        // The first message part (i.e. `ast.messageParts[0]`) is used to initialize `messageParts`
        // array.
        const elements = [createTemplateElement(ast.serializeI18nHead())];
        const expressions = [];
        for (let i = 0; i < ast.expressions.length; i++) {
            const placeholder = this.setSourceMapRange(ast.expressions[i].visitExpression(this, context), ast.getPlaceholderSourceSpan(i));
            expressions.push(placeholder);
            elements.push(createTemplateElement(ast.serializeI18nTemplatePart(i + 1)));
        }
        const localizeTag = this.factory.createIdentifier('$localize');
        return this.setSourceMapRange(this.createTaggedTemplateExpression(localizeTag, { elements, expressions }), ast.sourceSpan);
    }
    createTaggedTemplateExpression(tag, template) {
        return this.downlevelTaggedTemplates
            ? this.createES5TaggedTemplateFunctionCall(tag, template)
            : this.factory.createTaggedTemplate(tag, template);
    }
    /**
     * Translate the tagged template literal into a call that is compatible with ES5, using the
     * imported `__makeTemplateObject` helper for ES5 formatted output.
     */
    createES5TaggedTemplateFunctionCall(tagHandler, { elements, expressions }) {
        // Ensure that the `__makeTemplateObject()` helper has been imported.
        const __makeTemplateObjectHelper = this.imports.addImport({
            exportModuleSpecifier: 'tslib',
            exportSymbolName: '__makeTemplateObject',
            requestedFile: this.contextFile,
        });
        // Collect up the cooked and raw strings into two separate arrays.
        const cooked = [];
        const raw = [];
        for (const element of elements) {
            cooked.push(this.factory.setSourceMapRange(this.factory.createLiteral(element.cooked), element.range));
            raw.push(this.factory.setSourceMapRange(this.factory.createLiteral(element.raw), element.range));
        }
        // Generate the helper call in the form: `__makeTemplateObject([cooked], [raw]);`
        const templateHelperCall = this.factory.createCallExpression(__makeTemplateObjectHelper, [this.factory.createArrayLiteral(cooked), this.factory.createArrayLiteral(raw)], 
        /* pure */ false);
        // Finally create the tagged handler call in the form:
        // `tag(__makeTemplateObject([cooked], [raw]), ...expressions);`
        return this.factory.createCallExpression(tagHandler, [templateHelperCall, ...expressions], 
        /* pure */ false);
    }
    visitExternalExpr(ast, _context) {
        if (ast.value.name === null) {
            if (ast.value.moduleName === null) {
                throw new Error('Invalid import without name nor moduleName');
            }
            return this.imports.addImport({
                exportModuleSpecifier: ast.value.moduleName,
                exportSymbolName: null,
                requestedFile: this.contextFile,
            });
        }
        // If a moduleName is specified, this is a normal import. If there's no module name, it's a
        // reference to a global/ambient symbol.
        if (ast.value.moduleName !== null) {
            // This is a normal import. Find the imported module.
            return this.imports.addImport({
                exportModuleSpecifier: ast.value.moduleName,
                exportSymbolName: ast.value.name,
                requestedFile: this.contextFile,
            });
        }
        else {
            // The symbol is ambient, so just reference it.
            return this.factory.createIdentifier(ast.value.name);
        }
    }
    visitConditionalExpr(ast, context) {
        return this.factory.createConditional(ast.condition.visitExpression(this, context), ast.trueCase.visitExpression(this, context), ast.falseCase.visitExpression(this, context));
    }
    visitDynamicImportExpr(ast, context) {
        const urlExpression = typeof ast.url === 'string'
            ? this.factory.createLiteral(ast.url)
            : ast.url.visitExpression(this, context);
        if (ast.urlComment) {
            this.factory.attachComments(urlExpression, [compiler.leadingComment(ast.urlComment, true)]);
        }
        return this.factory.createDynamicImport(urlExpression);
    }
    visitNotExpr(ast, context) {
        return this.factory.createUnaryExpression('!', ast.condition.visitExpression(this, context));
    }
    visitFunctionExpr(ast, context) {
        return this.factory.createFunctionExpression(ast.name ?? null, ast.params.map((param) => param.name), this.factory.createBlock(this.visitStatements(ast.statements, context)));
    }
    visitArrowFunctionExpr(ast, context) {
        return this.factory.createArrowFunctionExpression(ast.params.map((param) => param.name), Array.isArray(ast.body)
            ? this.factory.createBlock(this.visitStatements(ast.body, context))
            : ast.body.visitExpression(this, context));
    }
    visitBinaryOperatorExpr(ast, context) {
        if (!BINARY_OPERATORS$1.has(ast.operator)) {
            throw new Error(`Unknown binary operator: ${compiler.BinaryOperator[ast.operator]}`);
        }
        return this.factory.createBinaryExpression(ast.lhs.visitExpression(this, context), BINARY_OPERATORS$1.get(ast.operator), ast.rhs.visitExpression(this, context));
    }
    visitReadPropExpr(ast, context) {
        return this.factory.createPropertyAccess(ast.receiver.visitExpression(this, context), ast.name);
    }
    visitReadKeyExpr(ast, context) {
        return this.factory.createElementAccess(ast.receiver.visitExpression(this, context), ast.index.visitExpression(this, context));
    }
    visitLiteralArrayExpr(ast, context) {
        return this.factory.createArrayLiteral(ast.entries.map((expr) => this.setSourceMapRange(expr.visitExpression(this, context), ast.sourceSpan)));
    }
    visitLiteralMapExpr(ast, context) {
        const properties = ast.entries.map((entry) => {
            return {
                propertyName: entry.key,
                quoted: entry.quoted,
                value: entry.value.visitExpression(this, context),
            };
        });
        return this.setSourceMapRange(this.factory.createObjectLiteral(properties), ast.sourceSpan);
    }
    visitCommaExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitTemplateLiteralElementExpr(ast, context) {
        throw new Error('Method not implemented');
    }
    visitWrappedNodeExpr(ast, _context) {
        this.recordWrappedNode(ast);
        return ast.node;
    }
    visitTypeofExpr(ast, context) {
        return this.factory.createTypeOfExpression(ast.expr.visitExpression(this, context));
    }
    visitVoidExpr(ast, context) {
        return this.factory.createVoidExpression(ast.expr.visitExpression(this, context));
    }
    visitUnaryOperatorExpr(ast, context) {
        if (!UNARY_OPERATORS$1.has(ast.operator)) {
            throw new Error(`Unknown unary operator: ${compiler.UnaryOperator[ast.operator]}`);
        }
        return this.factory.createUnaryExpression(UNARY_OPERATORS$1.get(ast.operator), ast.expr.visitExpression(this, context));
    }
    visitParenthesizedExpr(ast, context) {
        const result = ast.expr.visitExpression(this, context);
        return this.factory.createParenthesizedExpression(result);
    }
    visitStatements(statements, context) {
        return statements
            .map((stmt) => stmt.visitStatement(this, context))
            .filter((stmt) => stmt !== undefined);
    }
    setSourceMapRange(ast, span) {
        return this.factory.setSourceMapRange(ast, createRange(span));
    }
    attachComments(statement, leadingComments) {
        if (leadingComments !== undefined) {
            this.factory.attachComments(statement, leadingComments);
        }
        return statement;
    }
    getTemplateLiteralFromAst(ast, context) {
        return {
            elements: ast.elements.map((e) => createTemplateElement({
                cooked: e.text,
                raw: e.rawText,
                range: e.sourceSpan ?? ast.sourceSpan,
            })),
            expressions: ast.expressions.map((e) => e.visitExpression(this, context)),
        };
    }
}
/**
 * Convert a cooked-raw string object into one that can be used by the AST factories.
 */
function createTemplateElement({ cooked, raw, range, }) {
    return { cooked, raw, range: createRange(range) };
}
/**
 * Convert an OutputAST source-span into a range that can be used by the AST factories.
 */
function createRange(span) {
    if (span === null) {
        return null;
    }
    const { start, end } = span;
    const { url, content } = start.file;
    if (!url) {
        return null;
    }
    return {
        url,
        content,
        start: { offset: start.offset, line: start.line, column: start.col },
        end: { offset: end.offset, line: end.line, column: end.col },
    };
}

const INELIGIBLE = {};
/**
 * Determines whether the provided type can be emitted, which means that it can be safely emitted
 * into a different location.
 *
 * If this function returns true, a `TypeEmitter` should be able to succeed. Vice versa, if this
 * function returns false, then using the `TypeEmitter` should not be attempted as it is known to
 * fail.
 */
function canEmitType(type, canEmit) {
    return canEmitTypeWorker(type);
    function canEmitTypeWorker(type) {
        return visitNode(type) !== INELIGIBLE;
    }
    // To determine whether a type can be emitted, we have to recursively look through all type nodes.
    // If an unsupported type node is found at any position within the type, then the `INELIGIBLE`
    // constant is returned to stop the recursive walk as the type as a whole cannot be emitted in
    // that case. Otherwise, the result of visiting all child nodes determines the result. If no
    // ineligible type reference node is found then the walk returns `undefined`, indicating that
    // no type node was visited that could not be emitted.
    function visitNode(node) {
        // `import('module')` type nodes are not supported, as it may require rewriting the module
        // specifier which is currently not done.
        if (ts.isImportTypeNode(node)) {
            return INELIGIBLE;
        }
        // Emitting a type reference node in a different context requires that an import for the type
        // can be created. If a type reference node cannot be emitted, `INELIGIBLE` is returned to stop
        // the walk.
        if (ts.isTypeReferenceNode(node) && !canEmitTypeReference(node)) {
            return INELIGIBLE;
        }
        else {
            return ts.forEachChild(node, visitNode);
        }
    }
    function canEmitTypeReference(type) {
        if (!canEmit(type)) {
            return false;
        }
        // The type can be emitted if either it does not have any type arguments, or all of them can be
        // emitted.
        return type.typeArguments === undefined || type.typeArguments.every(canEmitTypeWorker);
    }
}
/**
 * Given a `ts.TypeNode`, this class derives an equivalent `ts.TypeNode` that has been emitted into
 * a different context.
 *
 * For example, consider the following code:
 *
 * ```ts
 * import {NgIterable} from '@angular/core';
 *
 * class NgForOf<T, U extends NgIterable<T>> {}
 * ```
 *
 * Here, the generic type parameters `T` and `U` can be emitted into a different context, as the
 * type reference to `NgIterable` originates from an absolute module import so that it can be
 * emitted anywhere, using that same module import. The process of emitting translates the
 * `NgIterable` type reference to a type reference that is valid in the context in which it is
 * emitted, for example:
 *
 * ```ts
 * import * as i0 from '@angular/core';
 * import * as i1 from '@angular/common';
 *
 * const _ctor1: <T, U extends i0.NgIterable<T>>(o: Pick<i1.NgForOf<T, U>, 'ngForOf'>):
 * i1.NgForOf<T, U>;
 * ```
 *
 * Notice how the type reference for `NgIterable` has been translated into a qualified name,
 * referring to the namespace import that was created.
 */
class TypeEmitter {
    translator;
    constructor(translator) {
        this.translator = translator;
    }
    emitType(type) {
        const typeReferenceTransformer = (context) => {
            const visitNode = (node) => {
                if (ts.isImportTypeNode(node)) {
                    throw new Error('Unable to emit import type');
                }
                if (ts.isTypeReferenceNode(node)) {
                    return this.emitTypeReference(node);
                }
                else if (ts.isLiteralExpression(node)) {
                    // TypeScript would typically take the emit text for a literal expression from the source
                    // file itself. As the type node is being emitted into a different file, however,
                    // TypeScript would extract the literal text from the wrong source file. To mitigate this
                    // issue the literal is cloned and explicitly marked as synthesized by setting its text
                    // range to a negative range, forcing TypeScript to determine the node's literal text from
                    // the synthesized node's text instead of the incorrect source file.
                    let clone;
                    if (ts.isStringLiteral(node)) {
                        clone = ts.factory.createStringLiteral(node.text);
                    }
                    else if (ts.isNumericLiteral(node)) {
                        clone = ts.factory.createNumericLiteral(node.text);
                    }
                    else if (ts.isBigIntLiteral(node)) {
                        clone = ts.factory.createBigIntLiteral(node.text);
                    }
                    else if (ts.isNoSubstitutionTemplateLiteral(node)) {
                        clone = ts.factory.createNoSubstitutionTemplateLiteral(node.text, node.rawText);
                    }
                    else if (ts.isRegularExpressionLiteral(node)) {
                        clone = ts.factory.createRegularExpressionLiteral(node.text);
                    }
                    else {
                        throw new Error(`Unsupported literal kind ${ts.SyntaxKind[node.kind]}`);
                    }
                    ts.setTextRange(clone, { pos: -1, end: -1 });
                    return clone;
                }
                else {
                    return ts.visitEachChild(node, visitNode, context);
                }
            };
            return (node) => ts.visitNode(node, visitNode, ts.isTypeNode);
        };
        return ts.transform(type, [typeReferenceTransformer]).transformed[0];
    }
    emitTypeReference(type) {
        // Determine the reference that the type corresponds with.
        const translatedType = this.translator(type);
        if (translatedType === null) {
            throw new Error('Unable to emit an unresolved reference');
        }
        // Emit the type arguments, if any.
        let typeArguments = undefined;
        if (type.typeArguments !== undefined) {
            typeArguments = ts.factory.createNodeArray(type.typeArguments.map((typeArg) => this.emitType(typeArg)));
        }
        return ts.factory.updateTypeReferenceNode(type, translatedType.typeName, typeArguments);
    }
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Creates a TypeScript node representing a numeric value.
 */
function tsNumericExpression$1(value) {
    // As of TypeScript 5.3 negative numbers are represented as `prefixUnaryOperator` and passing a
    // negative number (even as a string) into `createNumericLiteral` will result in an error.
    if (value < 0) {
        const operand = ts.factory.createNumericLiteral(Math.abs(value));
        return ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, operand);
    }
    return ts.factory.createNumericLiteral(value);
}

function translateType(type, contextFile, reflector, refEmitter, imports) {
    return type.visitType(new TypeTranslatorVisitor(imports, contextFile, reflector, refEmitter), new Context$1(false));
}
class TypeTranslatorVisitor {
    imports;
    contextFile;
    reflector;
    refEmitter;
    constructor(imports, contextFile, reflector, refEmitter) {
        this.imports = imports;
        this.contextFile = contextFile;
        this.reflector = reflector;
        this.refEmitter = refEmitter;
    }
    visitBuiltinType(type, context) {
        switch (type.name) {
            case compiler.BuiltinTypeName.Bool:
                return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
            case compiler.BuiltinTypeName.Dynamic:
                return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
            case compiler.BuiltinTypeName.Int:
            case compiler.BuiltinTypeName.Number:
                return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
            case compiler.BuiltinTypeName.String:
                return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
            case compiler.BuiltinTypeName.None:
                return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
            default:
                throw new Error(`Unsupported builtin type: ${compiler.BuiltinTypeName[type.name]}`);
        }
    }
    visitExpressionType(type, context) {
        const typeNode = this.translateExpression(type.value, context);
        if (type.typeParams === null) {
            return typeNode;
        }
        if (!ts.isTypeReferenceNode(typeNode)) {
            throw new Error('An ExpressionType with type arguments must translate into a TypeReferenceNode');
        }
        else if (typeNode.typeArguments !== undefined) {
            throw new Error(`An ExpressionType with type arguments cannot have multiple levels of type arguments`);
        }
        const typeArgs = type.typeParams.map((param) => this.translateType(param, context));
        return ts.factory.createTypeReferenceNode(typeNode.typeName, typeArgs);
    }
    visitArrayType(type, context) {
        return ts.factory.createArrayTypeNode(this.translateType(type.of, context));
    }
    visitMapType(type, context) {
        const parameter = ts.factory.createParameterDeclaration(undefined, undefined, 'key', undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword));
        const typeArgs = type.valueType !== null
            ? this.translateType(type.valueType, context)
            : ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
        const indexSignature = ts.factory.createIndexSignature(undefined, [parameter], typeArgs);
        return ts.factory.createTypeLiteralNode([indexSignature]);
    }
    visitTransplantedType(ast, context) {
        const node = ast.type instanceof Reference ? ast.type.node : ast.type;
        if (!ts.isTypeNode(node)) {
            throw new Error(`A TransplantedType must wrap a TypeNode`);
        }
        const viaModule = ast.type instanceof Reference ? ast.type.bestGuessOwningModule : null;
        const emitter = new TypeEmitter((typeRef) => this.translateTypeReference(typeRef, context, viaModule));
        return emitter.emitType(node);
    }
    visitReadVarExpr(ast, context) {
        if (ast.name === null) {
            throw new Error(`ReadVarExpr with no variable name in type`);
        }
        return ts.factory.createTypeQueryNode(ts.factory.createIdentifier(ast.name));
    }
    visitWriteVarExpr(expr, context) {
        throw new Error('Method not implemented.');
    }
    visitWriteKeyExpr(expr, context) {
        throw new Error('Method not implemented.');
    }
    visitWritePropExpr(expr, context) {
        throw new Error('Method not implemented.');
    }
    visitInvokeFunctionExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitTaggedTemplateLiteralExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitTemplateLiteralExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitTemplateLiteralElementExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitInstantiateExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitLiteralExpr(ast, context) {
        if (ast.value === null) {
            return ts.factory.createLiteralTypeNode(ts.factory.createNull());
        }
        else if (ast.value === undefined) {
            return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
        }
        else if (typeof ast.value === 'boolean') {
            return ts.factory.createLiteralTypeNode(ast.value ? ts.factory.createTrue() : ts.factory.createFalse());
        }
        else if (typeof ast.value === 'number') {
            return ts.factory.createLiteralTypeNode(tsNumericExpression$1(ast.value));
        }
        else {
            return ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(ast.value));
        }
    }
    visitLocalizedString(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitExternalExpr(ast, context) {
        if (ast.value.moduleName === null || ast.value.name === null) {
            throw new Error(`Import unknown module or symbol`);
        }
        const typeName = this.imports.addImport({
            exportModuleSpecifier: ast.value.moduleName,
            exportSymbolName: ast.value.name,
            requestedFile: this.contextFile,
            asTypeReference: true,
        });
        const typeArguments = ast.typeParams !== null
            ? ast.typeParams.map((type) => this.translateType(type, context))
            : undefined;
        return ts.factory.createTypeReferenceNode(typeName, typeArguments);
    }
    visitConditionalExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitDynamicImportExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitNotExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitFunctionExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitArrowFunctionExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitUnaryOperatorExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitBinaryOperatorExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitReadPropExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitReadKeyExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitLiteralArrayExpr(ast, context) {
        const values = ast.entries.map((expr) => this.translateExpression(expr, context));
        return ts.factory.createTupleTypeNode(values);
    }
    visitLiteralMapExpr(ast, context) {
        const entries = ast.entries.map((entry) => {
            const { key, quoted } = entry;
            const type = this.translateExpression(entry.value, context);
            return ts.factory.createPropertySignature(
            /* modifiers */ undefined, 
            /* name */ quoted ? ts.factory.createStringLiteral(key) : key, 
            /* questionToken */ undefined, 
            /* type */ type);
        });
        return ts.factory.createTypeLiteralNode(entries);
    }
    visitCommaExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitWrappedNodeExpr(ast, context) {
        const node = ast.node;
        if (ts.isEntityName(node)) {
            return ts.factory.createTypeReferenceNode(node, /* typeArguments */ undefined);
        }
        else if (ts.isTypeNode(node)) {
            return node;
        }
        else if (ts.isLiteralExpression(node)) {
            return ts.factory.createLiteralTypeNode(node);
        }
        else {
            throw new Error(`Unsupported WrappedNodeExpr in TypeTranslatorVisitor: ${ts.SyntaxKind[node.kind]}`);
        }
    }
    visitTypeofExpr(ast, context) {
        const typeNode = this.translateExpression(ast.expr, context);
        if (!ts.isTypeReferenceNode(typeNode)) {
            throw new Error(`The target of a typeof expression must be a type reference, but it was
          ${ts.SyntaxKind[typeNode.kind]}`);
        }
        return ts.factory.createTypeQueryNode(typeNode.typeName);
    }
    visitVoidExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    visitParenthesizedExpr(ast, context) {
        throw new Error('Method not implemented.');
    }
    translateType(type, context) {
        const typeNode = type.visitType(this, context);
        if (!ts.isTypeNode(typeNode)) {
            throw new Error(`A Type must translate to a TypeNode, but was ${ts.SyntaxKind[typeNode.kind]}`);
        }
        return typeNode;
    }
    translateExpression(expr, context) {
        const typeNode = expr.visitExpression(this, context);
        if (!ts.isTypeNode(typeNode)) {
            throw new Error(`An Expression must translate to a TypeNode, but was ${ts.SyntaxKind[typeNode.kind]}`);
        }
        return typeNode;
    }
    translateTypeReference(type, context, viaModule) {
        const target = ts.isIdentifier(type.typeName) ? type.typeName : type.typeName.right;
        const declaration = this.reflector.getDeclarationOfIdentifier(target);
        if (declaration === null) {
            throw new Error(`Unable to statically determine the declaration file of type node ${target.text}`);
        }
        let owningModule = viaModule;
        if (typeof declaration.viaModule === 'string') {
            owningModule = {
                specifier: declaration.viaModule,
                resolutionContext: type.getSourceFile().fileName,
            };
        }
        const reference = new Reference(declaration.node, declaration.viaModule === AmbientImport ? AmbientImport : owningModule);
        const emittedType = this.refEmitter.emit(reference, this.contextFile, exports.ImportFlags.NoAliasing | exports.ImportFlags.AllowTypeImports | exports.ImportFlags.AllowAmbientReferences);
        assertSuccessfulReferenceEmit(emittedType, target, 'type');
        const typeNode = this.translateExpression(emittedType.expression, context);
        if (!ts.isTypeReferenceNode(typeNode)) {
            throw new Error(`Expected TypeReferenceNode for emitted reference, got ${ts.SyntaxKind[typeNode.kind]}.`);
        }
        return typeNode;
    }
}

/**
 * Different optimizers use different annotations on a function or method call to indicate its pure
 * status.
 */
var PureAnnotation;
(function (PureAnnotation) {
    /**
     * Closure's annotation for purity is `@pureOrBreakMyCode`, but this needs to be in a semantic
     * (jsdoc) enabled comment. Thus, the actual comment text for Closure must include the `*` that
     * turns a `/*` comment into a `/**` comment, as well as surrounding whitespace.
     */
    PureAnnotation["CLOSURE"] = "* @pureOrBreakMyCode ";
    PureAnnotation["TERSER"] = "@__PURE__";
})(PureAnnotation || (PureAnnotation = {}));
const UNARY_OPERATORS = {
    '+': ts.SyntaxKind.PlusToken,
    '-': ts.SyntaxKind.MinusToken,
    '!': ts.SyntaxKind.ExclamationToken,
};
const BINARY_OPERATORS = {
    '&&': ts.SyntaxKind.AmpersandAmpersandToken,
    '>': ts.SyntaxKind.GreaterThanToken,
    '>=': ts.SyntaxKind.GreaterThanEqualsToken,
    '&': ts.SyntaxKind.AmpersandToken,
    '|': ts.SyntaxKind.BarToken,
    '/': ts.SyntaxKind.SlashToken,
    '==': ts.SyntaxKind.EqualsEqualsToken,
    '===': ts.SyntaxKind.EqualsEqualsEqualsToken,
    '<': ts.SyntaxKind.LessThanToken,
    '<=': ts.SyntaxKind.LessThanEqualsToken,
    '-': ts.SyntaxKind.MinusToken,
    '%': ts.SyntaxKind.PercentToken,
    '*': ts.SyntaxKind.AsteriskToken,
    '**': ts.SyntaxKind.AsteriskAsteriskToken,
    '!=': ts.SyntaxKind.ExclamationEqualsToken,
    '!==': ts.SyntaxKind.ExclamationEqualsEqualsToken,
    '||': ts.SyntaxKind.BarBarToken,
    '+': ts.SyntaxKind.PlusToken,
    '??': ts.SyntaxKind.QuestionQuestionToken,
    'in': ts.SyntaxKind.InKeyword,
};
const VAR_TYPES = {
    'const': ts.NodeFlags.Const,
    'let': ts.NodeFlags.Let,
    'var': ts.NodeFlags.None,
};
/**
 * A TypeScript flavoured implementation of the AstFactory.
 */
class TypeScriptAstFactory {
    annotateForClosureCompiler;
    externalSourceFiles = new Map();
    constructor(annotateForClosureCompiler) {
        this.annotateForClosureCompiler = annotateForClosureCompiler;
    }
    attachComments = attachComments;
    createArrayLiteral = ts.factory.createArrayLiteralExpression;
    createAssignment(target, value) {
        return ts.factory.createBinaryExpression(target, ts.SyntaxKind.EqualsToken, value);
    }
    createBinaryExpression(leftOperand, operator, rightOperand) {
        return ts.factory.createBinaryExpression(leftOperand, BINARY_OPERATORS[operator], rightOperand);
    }
    createBlock(body) {
        return ts.factory.createBlock(body);
    }
    createCallExpression(callee, args, pure) {
        const call = ts.factory.createCallExpression(callee, undefined, args);
        if (pure) {
            ts.addSyntheticLeadingComment(call, ts.SyntaxKind.MultiLineCommentTrivia, this.annotateForClosureCompiler ? PureAnnotation.CLOSURE : PureAnnotation.TERSER, 
            /* trailing newline */ false);
        }
        return call;
    }
    createConditional(condition, whenTrue, whenFalse) {
        return ts.factory.createConditionalExpression(condition, undefined, whenTrue, undefined, whenFalse);
    }
    createElementAccess = ts.factory.createElementAccessExpression;
    createExpressionStatement = ts.factory.createExpressionStatement;
    createDynamicImport(url) {
        return ts.factory.createCallExpression(ts.factory.createToken(ts.SyntaxKind.ImportKeyword), 
        /* type */ undefined, [typeof url === 'string' ? ts.factory.createStringLiteral(url) : url]);
    }
    createFunctionDeclaration(functionName, parameters, body) {
        if (!ts.isBlock(body)) {
            throw new Error(`Invalid syntax, expected a block, but got ${ts.SyntaxKind[body.kind]}.`);
        }
        return ts.factory.createFunctionDeclaration(undefined, undefined, functionName, undefined, parameters.map((param) => ts.factory.createParameterDeclaration(undefined, undefined, param)), undefined, body);
    }
    createFunctionExpression(functionName, parameters, body) {
        if (!ts.isBlock(body)) {
            throw new Error(`Invalid syntax, expected a block, but got ${ts.SyntaxKind[body.kind]}.`);
        }
        return ts.factory.createFunctionExpression(undefined, undefined, functionName ?? undefined, undefined, parameters.map((param) => ts.factory.createParameterDeclaration(undefined, undefined, param)), undefined, body);
    }
    createArrowFunctionExpression(parameters, body) {
        if (ts.isStatement(body) && !ts.isBlock(body)) {
            throw new Error(`Invalid syntax, expected a block, but got ${ts.SyntaxKind[body.kind]}.`);
        }
        return ts.factory.createArrowFunction(undefined, undefined, parameters.map((param) => ts.factory.createParameterDeclaration(undefined, undefined, param)), undefined, undefined, body);
    }
    createIdentifier = ts.factory.createIdentifier;
    createIfStatement(condition, thenStatement, elseStatement) {
        return ts.factory.createIfStatement(condition, thenStatement, elseStatement ?? undefined);
    }
    createLiteral(value) {
        if (value === undefined) {
            return ts.factory.createIdentifier('undefined');
        }
        else if (value === null) {
            return ts.factory.createNull();
        }
        else if (typeof value === 'boolean') {
            return value ? ts.factory.createTrue() : ts.factory.createFalse();
        }
        else if (typeof value === 'number') {
            return tsNumericExpression$1(value);
        }
        else {
            return ts.factory.createStringLiteral(value);
        }
    }
    createNewExpression(expression, args) {
        return ts.factory.createNewExpression(expression, undefined, args);
    }
    createObjectLiteral(properties) {
        return ts.factory.createObjectLiteralExpression(properties.map((prop) => ts.factory.createPropertyAssignment(prop.quoted
            ? ts.factory.createStringLiteral(prop.propertyName)
            : ts.factory.createIdentifier(prop.propertyName), prop.value)));
    }
    createParenthesizedExpression = ts.factory.createParenthesizedExpression;
    createPropertyAccess = ts.factory.createPropertyAccessExpression;
    createReturnStatement(expression) {
        return ts.factory.createReturnStatement(expression ?? undefined);
    }
    createTaggedTemplate(tag, template) {
        return ts.factory.createTaggedTemplateExpression(tag, undefined, this.createTemplateLiteral(template));
    }
    createTemplateLiteral(template) {
        let templateLiteral;
        const length = template.elements.length;
        const head = template.elements[0];
        if (length === 1) {
            templateLiteral = ts.factory.createNoSubstitutionTemplateLiteral(head.cooked, head.raw);
        }
        else {
            const spans = [];
            // Create the middle parts
            for (let i = 1; i < length - 1; i++) {
                const { cooked, raw, range } = template.elements[i];
                const middle = createTemplateMiddle(cooked, raw);
                if (range !== null) {
                    this.setSourceMapRange(middle, range);
                }
                spans.push(ts.factory.createTemplateSpan(template.expressions[i - 1], middle));
            }
            // Create the tail part
            const resolvedExpression = template.expressions[length - 2];
            const templatePart = template.elements[length - 1];
            const templateTail = createTemplateTail(templatePart.cooked, templatePart.raw);
            if (templatePart.range !== null) {
                this.setSourceMapRange(templateTail, templatePart.range);
            }
            spans.push(ts.factory.createTemplateSpan(resolvedExpression, templateTail));
            // Put it all together
            templateLiteral = ts.factory.createTemplateExpression(ts.factory.createTemplateHead(head.cooked, head.raw), spans);
        }
        if (head.range !== null) {
            this.setSourceMapRange(templateLiteral, head.range);
        }
        return templateLiteral;
    }
    createThrowStatement = ts.factory.createThrowStatement;
    createTypeOfExpression = ts.factory.createTypeOfExpression;
    createVoidExpression = ts.factory.createVoidExpression;
    createUnaryExpression(operator, operand) {
        return ts.factory.createPrefixUnaryExpression(UNARY_OPERATORS[operator], operand);
    }
    createVariableDeclaration(variableName, initializer, type) {
        return ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([
            ts.factory.createVariableDeclaration(variableName, undefined, undefined, initializer ?? undefined),
        ], VAR_TYPES[type]));
    }
    setSourceMapRange(node, sourceMapRange) {
        if (sourceMapRange === null) {
            return node;
        }
        const url = sourceMapRange.url;
        if (!this.externalSourceFiles.has(url)) {
            this.externalSourceFiles.set(url, ts.createSourceMapSource(url, sourceMapRange.content, (pos) => pos));
        }
        const source = this.externalSourceFiles.get(url);
        ts.setSourceMapRange(node, {
            pos: sourceMapRange.start.offset,
            end: sourceMapRange.end.offset,
            source,
        });
        return node;
    }
}
// HACK: Use this in place of `ts.createTemplateMiddle()`.
// Revert once https://github.com/microsoft/TypeScript/issues/35374 is fixed.
function createTemplateMiddle(cooked, raw) {
    const node = ts.factory.createTemplateHead(cooked, raw);
    node.kind = ts.SyntaxKind.TemplateMiddle;
    return node;
}
// HACK: Use this in place of `ts.createTemplateTail()`.
// Revert once https://github.com/microsoft/TypeScript/issues/35374 is fixed.
function createTemplateTail(cooked, raw) {
    const node = ts.factory.createTemplateHead(cooked, raw);
    node.kind = ts.SyntaxKind.TemplateTail;
    return node;
}
/**
 * Attach the given `leadingComments` to the `statement` node.
 *
 * @param statement The statement that will have comments attached.
 * @param leadingComments The comments to attach to the statement.
 */
function attachComments(statement, leadingComments) {
    for (const comment of leadingComments) {
        const commentKind = comment.multiline
            ? ts.SyntaxKind.MultiLineCommentTrivia
            : ts.SyntaxKind.SingleLineCommentTrivia;
        if (comment.multiline) {
            ts.addSyntheticLeadingComment(statement, commentKind, comment.toString(), comment.trailingNewline);
        }
        else {
            for (const line of comment.toString().split('\n')) {
                ts.addSyntheticLeadingComment(statement, commentKind, line, comment.trailingNewline);
            }
        }
    }
}

function translateExpression(contextFile, expression, imports, options = {}) {
    return expression.visitExpression(new ExpressionTranslatorVisitor(new TypeScriptAstFactory(options.annotateForClosureCompiler === true), imports, contextFile, options), new Context$1(false));
}
function translateStatement(contextFile, statement, imports, options = {}) {
    return statement.visitStatement(new ExpressionTranslatorVisitor(new TypeScriptAstFactory(options.annotateForClosureCompiler === true), imports, contextFile, options), new Context$1(true));
}

/**
 * Create a `ts.Diagnostic` which indicates the given class is part of the declarations of two or
 * more NgModules.
 *
 * The resulting `ts.Diagnostic` will have a context entry for each NgModule showing the point where
 * the directive/pipe exists in its `declarations` (if possible).
 */
function makeDuplicateDeclarationError(node, data, kind) {
    const context = [];
    for (const decl of data) {
        if (decl.rawDeclarations === null) {
            continue;
        }
        // Try to find the reference to the declaration within the declarations array, to hang the
        // error there. If it can't be found, fall back on using the NgModule's name.
        const contextNode = decl.ref.getOriginForDiagnostics(decl.rawDeclarations, decl.ngModule.name);
        context.push(makeRelatedInformation(contextNode, `'${node.name.text}' is listed in the declarations of the NgModule '${decl.ngModule.name.text}'.`));
    }
    // Finally, produce the diagnostic.
    return makeDiagnostic(exports.ErrorCode.NGMODULE_DECLARATION_NOT_UNIQUE, node.name, `The ${kind} '${node.name.text}' is declared by more than one NgModule.`, context);
}
/**
 * Creates a `FatalDiagnosticError` for a node that did not evaluate to the expected type. The
 * diagnostic that is created will include details on why the value is incorrect, i.e. it includes
 * a representation of the actual type that was unsupported, or in the case of a dynamic value the
 * trace to the node where the dynamic value originated.
 *
 * @param node The node for which the diagnostic should be produced.
 * @param value The evaluated value that has the wrong type.
 * @param messageText The message text of the error.
 */
function createValueHasWrongTypeError(node, value, messageText) {
    let chainedMessage;
    let relatedInformation;
    if (value instanceof DynamicValue) {
        chainedMessage = 'Value could not be determined statically.';
        relatedInformation = traceDynamicValue(node, value);
    }
    else if (value instanceof Reference) {
        const target = value.debugName !== null ? `'${value.debugName}'` : 'an anonymous declaration';
        chainedMessage = `Value is a reference to ${target}.`;
        const referenceNode = identifierOfNode(value.node) ?? value.node;
        relatedInformation = [makeRelatedInformation(referenceNode, 'Reference is declared here.')];
    }
    else {
        chainedMessage = `Value is of type '${describeResolvedType(value)}'.`;
    }
    const chain = {
        messageText,
        category: ts.DiagnosticCategory.Error,
        code: 0,
        next: [
            {
                messageText: chainedMessage,
                category: ts.DiagnosticCategory.Message,
                code: 0,
            },
        ],
    };
    return new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, node, chain, relatedInformation);
}
/**
 * Gets the diagnostics for a set of provider classes.
 * @param providerClasses Classes that should be checked.
 * @param providersDeclaration Node that declares the providers array.
 * @param registry Registry that keeps track of the registered injectable classes.
 */
function getProviderDiagnostics(providerClasses, providersDeclaration, registry) {
    const diagnostics = [];
    for (const provider of providerClasses) {
        const injectableMeta = registry.getInjectableMeta(provider.node);
        if (injectableMeta !== null) {
            // The provided type is recognized as injectable, so we don't report a diagnostic for this
            // provider.
            continue;
        }
        const contextNode = provider.getOriginForDiagnostics(providersDeclaration);
        diagnostics.push(makeDiagnostic(exports.ErrorCode.UNDECORATED_PROVIDER, contextNode, `The class '${provider.node.name.text}' cannot be created via dependency injection, as it does not have an Angular decorator. This will result in an error at runtime.

Either add the @Injectable() decorator to '${provider.node.name.text}', or configure a different provider (such as a provider with 'useFactory').
`, [makeRelatedInformation(provider.node, `'${provider.node.name.text}' is declared here.`)]));
    }
    return diagnostics;
}
function getDirectiveDiagnostics(node, injectableRegistry, evaluator, reflector, scopeRegistry, strictInjectionParameters, kind) {
    let diagnostics = [];
    const addDiagnostics = (more) => {
        if (more === null) {
            return;
        }
        else if (diagnostics === null) {
            diagnostics = Array.isArray(more) ? more : [more];
        }
        else if (Array.isArray(more)) {
            diagnostics.push(...more);
        }
        else {
            diagnostics.push(more);
        }
    };
    const duplicateDeclarations = scopeRegistry.getDuplicateDeclarations(node);
    if (duplicateDeclarations !== null) {
        addDiagnostics(makeDuplicateDeclarationError(node, duplicateDeclarations, kind));
    }
    addDiagnostics(checkInheritanceOfInjectable(node, injectableRegistry, reflector, evaluator, strictInjectionParameters, kind));
    return diagnostics;
}
function validateHostDirectives(origin, hostDirectives, metaReader) {
    const diagnostics = [];
    for (const current of hostDirectives) {
        if (!isHostDirectiveMetaForGlobalMode(current)) {
            throw new Error('Impossible state: diagnostics code path for local compilation');
        }
        const hostMeta = flattenInheritedDirectiveMetadata(metaReader, current.directive);
        if (hostMeta === null) {
            diagnostics.push(makeDiagnostic(exports.ErrorCode.HOST_DIRECTIVE_INVALID, current.directive.getOriginForDiagnostics(origin), `${current.directive.debugName} must be a standalone directive to be used as a host directive`));
            continue;
        }
        if (!hostMeta.isStandalone) {
            diagnostics.push(makeDiagnostic(exports.ErrorCode.HOST_DIRECTIVE_NOT_STANDALONE, current.directive.getOriginForDiagnostics(origin), `Host directive ${hostMeta.name} must be standalone`));
        }
        if (hostMeta.isComponent) {
            diagnostics.push(makeDiagnostic(exports.ErrorCode.HOST_DIRECTIVE_COMPONENT, current.directive.getOriginForDiagnostics(origin), `Host directive ${hostMeta.name} cannot be a component`));
        }
        const requiredInputNames = Array.from(hostMeta.inputs)
            .filter((input) => input.required)
            .map((input) => input.classPropertyName);
        validateHostDirectiveMappings('input', current, hostMeta, origin, diagnostics, requiredInputNames.length > 0 ? new Set(requiredInputNames) : null);
        validateHostDirectiveMappings('output', current, hostMeta, origin, diagnostics, null);
    }
    return diagnostics;
}
function validateHostDirectiveMappings(bindingType, hostDirectiveMeta, meta, origin, diagnostics, requiredBindings) {
    if (!isHostDirectiveMetaForGlobalMode(hostDirectiveMeta)) {
        throw new Error('Impossible state: diagnostics code path for local compilation');
    }
    const className = meta.name;
    const hostDirectiveMappings = bindingType === 'input' ? hostDirectiveMeta.inputs : hostDirectiveMeta.outputs;
    const existingBindings = bindingType === 'input' ? meta.inputs : meta.outputs;
    const exposedRequiredBindings = new Set();
    for (const publicName in hostDirectiveMappings) {
        if (hostDirectiveMappings.hasOwnProperty(publicName)) {
            const bindings = existingBindings.getByBindingPropertyName(publicName);
            if (bindings === null) {
                diagnostics.push(makeDiagnostic(exports.ErrorCode.HOST_DIRECTIVE_UNDEFINED_BINDING, hostDirectiveMeta.directive.getOriginForDiagnostics(origin), `Directive ${className} does not have an ${bindingType} with a public name of ${publicName}.`));
            }
            else if (requiredBindings !== null) {
                for (const field of bindings) {
                    if (requiredBindings.has(field.classPropertyName)) {
                        exposedRequiredBindings.add(field.classPropertyName);
                    }
                }
            }
            const remappedPublicName = hostDirectiveMappings[publicName];
            const bindingsForPublicName = existingBindings.getByBindingPropertyName(remappedPublicName);
            if (bindingsForPublicName !== null) {
                for (const binding of bindingsForPublicName) {
                    if (binding.bindingPropertyName !== publicName) {
                        diagnostics.push(makeDiagnostic(exports.ErrorCode.HOST_DIRECTIVE_CONFLICTING_ALIAS, hostDirectiveMeta.directive.getOriginForDiagnostics(origin), `Cannot alias ${bindingType} ${publicName} of host directive ${className} to ${remappedPublicName}, because it already has a different ${bindingType} with the same public name.`));
                    }
                }
            }
        }
    }
    if (requiredBindings !== null && requiredBindings.size !== exposedRequiredBindings.size) {
        const missingBindings = [];
        for (const publicName of requiredBindings) {
            if (!exposedRequiredBindings.has(publicName)) {
                const name = existingBindings.getByClassPropertyName(publicName);
                if (name) {
                    missingBindings.push(`'${name.bindingPropertyName}'`);
                }
            }
        }
        diagnostics.push(makeDiagnostic(exports.ErrorCode.HOST_DIRECTIVE_MISSING_REQUIRED_BINDING, hostDirectiveMeta.directive.getOriginForDiagnostics(origin), `Required ${bindingType}${missingBindings.length === 1 ? '' : 's'} ${missingBindings.join(', ')} from host directive ${className} must be exposed.`));
    }
}
function getUndecoratedClassWithAngularFeaturesDiagnostic(node) {
    return makeDiagnostic(exports.ErrorCode.UNDECORATED_CLASS_USING_ANGULAR_FEATURES, node.name, `Class is using Angular features but is not decorated. Please add an explicit ` +
        `Angular decorator.`);
}
function checkInheritanceOfInjectable(node, injectableRegistry, reflector, evaluator, strictInjectionParameters, kind) {
    const classWithCtor = findInheritedCtor(node, injectableRegistry, reflector, evaluator);
    if (classWithCtor === null || classWithCtor.isCtorValid) {
        // The class does not inherit a constructor, or the inherited constructor is compatible
        // with DI; no need to report a diagnostic.
        return null;
    }
    if (!classWithCtor.isDecorated) {
        // The inherited constructor exists in a class that does not have an Angular decorator.
        // This is an error, as there won't be a factory definition available for DI to invoke
        // the constructor.
        return getInheritedUndecoratedCtorDiagnostic(node, classWithCtor.ref, kind);
    }
    if (isFromDtsFile(classWithCtor.ref.node)) {
        // The inherited class is declared in a declaration file, in which case there is not enough
        // information to detect invalid constructors as `@Inject()` metadata is not present in the
        // declaration file. Consequently, we have to accept such occurrences, although they might
        // still fail at runtime.
        return null;
    }
    if (!strictInjectionParameters || isAbstractClassDeclaration(node)) {
        // An invalid constructor is only reported as error under `strictInjectionParameters` and
        // only for concrete classes; follow the same exclusions for derived types.
        return null;
    }
    return getInheritedInvalidCtorDiagnostic(node, classWithCtor.ref, kind);
}
function findInheritedCtor(node, injectableRegistry, reflector, evaluator) {
    if (!reflector.isClass(node) || reflector.getConstructorParameters(node) !== null) {
        // We should skip nodes that aren't classes. If a constructor exists, then no base class
        // definition is required on the runtime side - it's legal to inherit from any class.
        return null;
    }
    // The extends clause is an expression which can be as dynamic as the user wants. Try to
    // evaluate it, but fall back on ignoring the clause if it can't be understood. This is a View
    // Engine compatibility hack: View Engine ignores 'extends' expressions that it cannot understand.
    let baseClass = readBaseClass(node, reflector, evaluator);
    while (baseClass !== null) {
        if (baseClass === 'dynamic') {
            return null;
        }
        const injectableMeta = injectableRegistry.getInjectableMeta(baseClass.node);
        if (injectableMeta !== null) {
            if (injectableMeta.ctorDeps !== null) {
                // The class has an Angular decorator with a constructor.
                return {
                    ref: baseClass,
                    isCtorValid: injectableMeta.ctorDeps !== 'invalid',
                    isDecorated: true,
                };
            }
        }
        else {
            const baseClassConstructorParams = reflector.getConstructorParameters(baseClass.node);
            if (baseClassConstructorParams !== null) {
                // The class is not decorated, but it does have constructor. An undecorated class is only
                // allowed to have a constructor without parameters, otherwise it is invalid.
                return {
                    ref: baseClass,
                    isCtorValid: baseClassConstructorParams.length === 0,
                    isDecorated: false,
                };
            }
        }
        // Go up the chain and continue
        baseClass = readBaseClass(baseClass.node, reflector, evaluator);
    }
    return null;
}
function getInheritedInvalidCtorDiagnostic(node, baseClass, kind) {
    const baseClassName = baseClass.debugName;
    return makeDiagnostic(exports.ErrorCode.INJECTABLE_INHERITS_INVALID_CONSTRUCTOR, node.name, `The ${kind.toLowerCase()} ${node.name.text} inherits its constructor from ${baseClassName}, ` +
        `but the latter has a constructor parameter that is not compatible with dependency injection. ` +
        `Either add an explicit constructor to ${node.name.text} or change ${baseClassName}'s constructor to ` +
        `use parameters that are valid for DI.`);
}
function getInheritedUndecoratedCtorDiagnostic(node, baseClass, kind) {
    const baseClassName = baseClass.debugName;
    const baseNeedsDecorator = kind === 'Component' || kind === 'Directive' ? 'Directive' : 'Injectable';
    return makeDiagnostic(exports.ErrorCode.DIRECTIVE_INHERITS_UNDECORATED_CTOR, node.name, `The ${kind.toLowerCase()} ${node.name.text} inherits its constructor from ${baseClassName}, ` +
        `but the latter does not have an Angular decorator of its own. Dependency injection will not be able to ` +
        `resolve the parameters of ${baseClassName}'s constructor. Either add a @${baseNeedsDecorator} decorator ` +
        `to ${baseClassName}, or add an explicit constructor to ${node.name.text}.`);
}
/**
 * Throws `FatalDiagnosticError` with error code `LOCAL_COMPILATION_UNRESOLVED_CONST`
 * if the compilation mode is local and the value is not resolved due to being imported
 * from external files. This is a common scenario for errors in local compilation mode,
 * and so this helper can be used to quickly generate the relevant errors.
 *
 * @param nodeToHighlight Node to be highlighted in teh error message.
 * Will default to value.node if not provided.
 */
function assertLocalCompilationUnresolvedConst(compilationMode, value, nodeToHighlight, errorMessage) {
    if (compilationMode === exports.CompilationMode.LOCAL &&
        value instanceof DynamicValue &&
        value.isFromUnknownIdentifier()) {
        throw new FatalDiagnosticError(exports.ErrorCode.LOCAL_COMPILATION_UNRESOLVED_CONST, nodeToHighlight ?? value.node, errorMessage);
    }
}

exports.ComponentScopeKind = void 0;
(function (ComponentScopeKind) {
    ComponentScopeKind[ComponentScopeKind["NgModule"] = 0] = "NgModule";
    ComponentScopeKind[ComponentScopeKind["Standalone"] = 1] = "Standalone";
})(exports.ComponentScopeKind || (exports.ComponentScopeKind = {}));

/**
 * Validates that the initializer member is compatible with the given class
 * member in terms of field access and visibility.
 *
 * @throws {FatalDiagnosticError} If the recognized initializer API is
 *   incompatible.
 */
function validateAccessOfInitializerApiMember({ api, call }, member) {
    if (!api.allowedAccessLevels.includes(member.accessLevel)) {
        throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_DISALLOWED_MEMBER_VISIBILITY, call, makeDiagnosticChain(`Cannot use "${api.functionName}" on a class member that is declared as ${classMemberAccessLevelToString(member.accessLevel)}.`, [
            makeDiagnosticChain(`Update the class field to be either: ` +
                api.allowedAccessLevels.map((l) => classMemberAccessLevelToString(l)).join(', ')),
        ]));
    }
}

/**
 * Attempts to identify an Angular initializer function call.
 *
 * Note that multiple possible initializer API function names can be specified,
 * allowing for checking multiple types in one pass.
 *
 * @returns The parsed initializer API, or null if none was found.
 */
function tryParseInitializerApi(functions, expression, reflector, importTracker) {
    if (!ts.isCallExpression(expression)) {
        return null;
    }
    const staticResult = parseTopLevelCall(expression, functions, importTracker) ||
        parseTopLevelRequiredCall(expression, functions, importTracker) ||
        parseTopLevelCallFromNamespace(expression, functions, importTracker);
    if (staticResult === null) {
        return null;
    }
    const { api, apiReference, isRequired } = staticResult;
    // Once we've statically determined that the initializer is one of the APIs we're looking for, we
    // need to verify it using the type checker which accounts for things like shadowed variables.
    // This should be done as the absolute last step since using the type check can be expensive.
    const resolvedImport = reflector.getImportOfIdentifier(apiReference);
    if (resolvedImport === null ||
        api.functionName !== resolvedImport.name ||
        api.owningModule !== resolvedImport.from) {
        return null;
    }
    return {
        api,
        call: expression,
        isRequired,
    };
}
/**
 * Attempts to parse a top-level call to an initializer function,
 * e.g. `prop = input()`. Returns null if it can't be parsed.
 */
function parseTopLevelCall(call, functions, importTracker) {
    const node = call.expression;
    if (!ts.isIdentifier(node)) {
        return null;
    }
    const matchingApi = functions.find((fn) => importTracker.isPotentialReferenceToNamedImport(node, fn.functionName, fn.owningModule));
    if (matchingApi === undefined) {
        return null;
    }
    return { api: matchingApi, apiReference: node, isRequired: false };
}
/**
 * Attempts to parse a top-level call to a required initializer,
 * e.g. `prop = input.required()`. Returns null if it can't be parsed.
 */
function parseTopLevelRequiredCall(call, functions, importTracker) {
    const node = call.expression;
    if (!ts.isPropertyAccessExpression(node) ||
        !ts.isIdentifier(node.expression) ||
        node.name.text !== 'required') {
        return null;
    }
    const expression = node.expression;
    const matchingApi = functions.find((fn) => importTracker.isPotentialReferenceToNamedImport(expression, fn.functionName, fn.owningModule));
    if (matchingApi === undefined) {
        return null;
    }
    return { api: matchingApi, apiReference: expression, isRequired: true };
}
/**
 * Attempts to parse a top-level call to a function referenced via a namespace import,
 * e.g. `prop = core.input.required()`. Returns null if it can't be parsed.
 */
function parseTopLevelCallFromNamespace(call, functions, importTracker) {
    const node = call.expression;
    if (!ts.isPropertyAccessExpression(node)) {
        return null;
    }
    let apiReference = null;
    let matchingApi = undefined;
    let isRequired = false;
    // `prop = core.input()`
    if (ts.isIdentifier(node.expression) && ts.isIdentifier(node.name)) {
        const namespaceRef = node.expression;
        apiReference = node.name;
        matchingApi = functions.find((fn) => node.name.text === fn.functionName &&
            importTracker.isPotentialReferenceToNamespaceImport(namespaceRef, fn.owningModule));
    }
    else if (
    // `prop = core.input.required()`
    ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        ts.isIdentifier(node.expression.name) &&
        node.name.text === 'required') {
        const potentialName = node.expression.name.text;
        const namespaceRef = node.expression.expression;
        apiReference = node.expression.name;
        matchingApi = functions.find((fn) => fn.functionName === potentialName &&
            importTracker.isPotentialReferenceToNamespaceImport(namespaceRef, fn.owningModule));
        isRequired = true;
    }
    if (matchingApi === undefined || apiReference === null) {
        return null;
    }
    return { api: matchingApi, apiReference, isRequired };
}

/**
 * Parses and validates input and output initializer function options.
 *
 * This currently only parses the `alias` option and returns it. The other
 * options for signal inputs are runtime constructs that aren't relevant at
 * compile time.
 */
function parseAndValidateInputAndOutputOptions(optionsNode) {
    if (!ts.isObjectLiteralExpression(optionsNode)) {
        throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, optionsNode, 'Argument needs to be an object literal that is statically analyzable.');
    }
    const options = reflectObjectLiteral(optionsNode);
    let alias = undefined;
    if (options.has('alias')) {
        const aliasExpr = options.get('alias');
        if (!ts.isStringLiteralLike(aliasExpr)) {
            throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, aliasExpr, 'Alias needs to be a string that is statically analyzable.');
        }
        alias = aliasExpr.text;
    }
    return { alias };
}

/** Represents a function that can declare an input. */
const INPUT_INITIALIZER_FN = {
    functionName: 'input',
    owningModule: '@angular/core',
    // Inputs are accessed from parents, via the `property` instruction.
    // Conceptually, the fields need to be publicly readable, but in practice,
    // accessing `protected` or `private` members works at runtime, so we can allow
    // cases where the input is intentionally not part of the public API, programmatically.
    // Note: `private` is omitted intentionally as this would be a conceptual confusion point.
    allowedAccessLevels: [
        ClassMemberAccessLevel.PublicWritable,
        ClassMemberAccessLevel.PublicReadonly,
        ClassMemberAccessLevel.Protected,
    ],
};
/**
 * Attempts to parse a signal input class member. Returns the parsed
 * input mapping if possible.
 */
function tryParseSignalInputMapping(member, reflector, importTracker) {
    if (member.value === null) {
        return null;
    }
    const signalInput = tryParseInitializerApi([INPUT_INITIALIZER_FN], member.value, reflector, importTracker);
    if (signalInput === null) {
        return null;
    }
    validateAccessOfInitializerApiMember(signalInput, member);
    const optionsNode = (signalInput.isRequired ? signalInput.call.arguments[0] : signalInput.call.arguments[1]);
    const options = optionsNode !== undefined ? parseAndValidateInputAndOutputOptions(optionsNode) : null;
    const classPropertyName = member.name;
    return {
        isSignal: true,
        classPropertyName,
        bindingPropertyName: options?.alias ?? classPropertyName,
        required: signalInput.isRequired,
        // Signal inputs do not capture complex transform metadata.
        // See more details in the `transform` type of `InputMapping`.
        transform: null,
    };
}

/** Represents a function that can declare a model. */
const MODEL_INITIALIZER_FN = {
    functionName: 'model',
    owningModule: '@angular/core',
    // Inputs are accessed from parents, via the `property` instruction.
    // Conceptually, the fields need to be publicly readable, but in practice,
    // accessing `protected` or `private` members works at runtime, so we can allow
    // cases where the input is intentionally not part of the public API, programmatically.
    allowedAccessLevels: [
        ClassMemberAccessLevel.PublicWritable,
        ClassMemberAccessLevel.PublicReadonly,
        ClassMemberAccessLevel.Protected,
    ],
};
/**
 * Attempts to parse a model class member. Returns the parsed model mapping if possible.
 */
function tryParseSignalModelMapping(member, reflector, importTracker) {
    if (member.value === null) {
        return null;
    }
    const model = tryParseInitializerApi([MODEL_INITIALIZER_FN], member.value, reflector, importTracker);
    if (model === null) {
        return null;
    }
    validateAccessOfInitializerApiMember(model, member);
    const optionsNode = (model.isRequired ? model.call.arguments[0] : model.call.arguments[1]);
    const options = optionsNode !== undefined ? parseAndValidateInputAndOutputOptions(optionsNode) : null;
    const classPropertyName = member.name;
    const bindingPropertyName = options?.alias ?? classPropertyName;
    return {
        call: model.call,
        input: {
            isSignal: true,
            transform: null,
            classPropertyName,
            bindingPropertyName,
            required: model.isRequired,
        },
        output: {
            isSignal: false,
            classPropertyName,
            bindingPropertyName: bindingPropertyName + 'Change',
        },
    };
}

// Outputs are accessed from parents, via the `listener` instruction.
// Conceptually, the fields need to be publicly readable, but in practice,
// accessing `protected` or `private` members works at runtime, so we can allow
// such outputs that may not want to expose the `OutputRef` as part of the
// component API, programmatically.
// Note: `private` is omitted intentionally as this would be a conceptual confusion point.
const allowedAccessLevels = [
    ClassMemberAccessLevel.PublicWritable,
    ClassMemberAccessLevel.PublicReadonly,
    ClassMemberAccessLevel.Protected,
];
/** Possible functions that can declare an output. */
const OUTPUT_INITIALIZER_FNS = [
    {
        functionName: 'output',
        owningModule: '@angular/core',
        allowedAccessLevels,
    },
    {
        functionName: 'outputFromObservable',
        owningModule: '@angular/core/rxjs-interop',
        allowedAccessLevels,
    },
];
/**
 * Attempts to parse a signal output class member. Returns the parsed
 * input mapping if possible.
 */
function tryParseInitializerBasedOutput(member, reflector, importTracker) {
    if (member.value === null) {
        return null;
    }
    const output = tryParseInitializerApi(OUTPUT_INITIALIZER_FNS, member.value, reflector, importTracker);
    if (output === null) {
        return null;
    }
    if (output.isRequired) {
        throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_NO_REQUIRED_FUNCTION, output.call, `Output does not support ".required()".`);
    }
    validateAccessOfInitializerApiMember(output, member);
    // Options are the first parameter for `output()`, while for
    // the interop `outputFromObservable()` they are the second argument.
    const optionsNode = (output.api.functionName === 'output' ? output.call.arguments[0] : output.call.arguments[1]);
    const options = optionsNode !== undefined ? parseAndValidateInputAndOutputOptions(optionsNode) : null;
    const classPropertyName = member.name;
    return {
        call: output.call,
        metadata: {
            // Outputs are not signal-based.
            isSignal: false,
            classPropertyName,
            bindingPropertyName: options?.alias ?? classPropertyName,
        },
    };
}

/** Possible names of query initializer APIs. */
const queryFunctionNames = [
    'viewChild',
    'viewChildren',
    'contentChild',
    'contentChildren',
];
/** Possible query initializer API functions. */
const QUERY_INITIALIZER_FNS = queryFunctionNames.map((fnName) => ({
    functionName: fnName,
    owningModule: '@angular/core',
    // Queries are accessed from within static blocks, via the query definition functions.
    // Conceptually, the fields could access private members— even ES private fields.
    // Support for ES private fields requires special caution and complexity when partial
    // output is linked— hence not supported. TS private members are allowed in static blocks.
    allowedAccessLevels: [
        ClassMemberAccessLevel.PublicWritable,
        ClassMemberAccessLevel.PublicReadonly,
        ClassMemberAccessLevel.Protected,
        ClassMemberAccessLevel.Private,
    ],
}));
// The `descendants` option is enabled by default, except for content children.
const defaultDescendantsValue = (type) => type !== 'contentChildren';
/**
 * Attempts to detect a possible query definition for the given class member.
 *
 * This function checks for all possible variants of queries and matches the
 * first one. The query is then analyzed and its resolved metadata is returned.
 *
 * @returns Resolved query metadata, or null if no query is declared.
 */
function tryParseSignalQueryFromInitializer(member, reflector, importTracker) {
    if (member.value === null) {
        return null;
    }
    const query = tryParseInitializerApi(QUERY_INITIALIZER_FNS, member.value, reflector, importTracker);
    if (query === null) {
        return null;
    }
    validateAccessOfInitializerApiMember(query, member);
    const { functionName } = query.api;
    const isSingleQuery = functionName === 'viewChild' || functionName === 'contentChild';
    const predicateNode = query.call.arguments[0];
    if (predicateNode === undefined) {
        throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, query.call, 'No locator specified.');
    }
    const optionsNode = query.call.arguments[1];
    if (optionsNode !== undefined && !ts.isObjectLiteralExpression(optionsNode)) {
        throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, optionsNode, 'Argument needs to be an object literal.');
    }
    const options = optionsNode && reflectObjectLiteral(optionsNode);
    const read = options?.has('read') ? parseReadOption(options.get('read')) : null;
    const descendants = options?.has('descendants')
        ? parseDescendantsOption(options.get('descendants'))
        : defaultDescendantsValue(functionName);
    return {
        name: functionName,
        call: query.call,
        metadata: {
            isSignal: true,
            propertyName: member.name,
            static: false,
            emitDistinctChangesOnly: true,
            predicate: parseLocator(predicateNode, reflector),
            first: isSingleQuery,
            read,
            descendants,
        },
    };
}
/** Parses the locator/predicate of the query. */
function parseLocator(expression, reflector) {
    // Attempt to unwrap `forwardRef` calls.
    const unwrappedExpression = tryUnwrapForwardRef(expression, reflector);
    if (unwrappedExpression !== null) {
        expression = unwrappedExpression;
    }
    if (ts.isStringLiteralLike(expression)) {
        return [expression.text];
    }
    return compiler.createMayBeForwardRefExpression(new compiler.WrappedNodeExpr(expression), unwrappedExpression !== null ? 2 /* ForwardRefHandling.Unwrapped */ : 0 /* ForwardRefHandling.None */);
}
/**
 * Parses the `read` option of a query.
 *
 * We only support the following patterns for the `read` option:
 *     - `read: someImport.BLA`,
 *     - `read: BLA`
 *
 * That is because we cannot trivially support complex expressions,
 * especially those referencing `this`. The read provider token will
 * live outside of the class in the static class definition.
 */
function parseReadOption(value) {
    if (ts.isExpressionWithTypeArguments(value) ||
        ts.isParenthesizedExpression(value) ||
        ts.isAsExpression(value)) {
        return parseReadOption(value.expression);
    }
    if ((ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression)) ||
        ts.isIdentifier(value)) {
        return new compiler.WrappedNodeExpr(value);
    }
    throw new FatalDiagnosticError(exports.ErrorCode.VALUE_NOT_LITERAL, value, `Query "read" option expected a literal class reference.`);
}
/** Parses the `descendants` option of a query. */
function parseDescendantsOption(value) {
    if (value.kind === ts.SyntaxKind.TrueKeyword) {
        return true;
    }
    else if (value.kind === ts.SyntaxKind.FalseKeyword) {
        return false;
    }
    throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, value, `Expected "descendants" option to be a boolean literal.`);
}

const EMPTY_OBJECT = {};
const queryDecoratorNames = [
    'ViewChild',
    'ViewChildren',
    'ContentChild',
    'ContentChildren',
];
const QUERY_TYPES = new Set(queryDecoratorNames);
/**
 * Helper function to extract metadata from a `Directive` or `Component`. `Directive`s without a
 * selector are allowed to be used for abstract base classes. These abstract directives should not
 * appear in the declarations of an `NgModule` and additional verification is done when processing
 * the module.
 */
function extractDirectiveMetadata(clazz, decorator, reflector, importTracker, evaluator, refEmitter, referencesRegistry, isCore, annotateForClosureCompiler, compilationMode, defaultSelector, strictStandalone, implicitStandaloneValue) {
    let directive;
    if (decorator.args === null || decorator.args.length === 0) {
        directive = new Map();
    }
    else if (decorator.args.length !== 1) {
        throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `Incorrect number of arguments to @${decorator.name} decorator`);
    }
    else {
        const meta = unwrapExpression(decorator.args[0]);
        if (!ts.isObjectLiteralExpression(meta)) {
            throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, `@${decorator.name} argument must be an object literal`);
        }
        directive = reflectObjectLiteral(meta);
    }
    if (directive.has('jit')) {
        // The only allowed value is true, so there's no need to expand further.
        return { jitForced: true };
    }
    const members = reflector.getMembersOfClass(clazz);
    // Precompute a list of ts.ClassElements that have decorators. This includes things like @Input,
    // @Output, @HostBinding, etc.
    const decoratedElements = members.filter((member) => !member.isStatic && member.decorators !== null);
    const coreModule = isCore ? undefined : '@angular/core';
    // Construct the map of inputs both from the @Directive/@Component
    // decorator, and the decorated fields.
    const inputsFromMeta = parseInputsArray(clazz, directive, evaluator, reflector, refEmitter, compilationMode);
    const inputsFromFields = parseInputFields(clazz, members, evaluator, reflector, importTracker, refEmitter, isCore, compilationMode, inputsFromMeta, decorator);
    const inputs = ClassPropertyMapping.fromMappedObject({ ...inputsFromMeta, ...inputsFromFields });
    // And outputs.
    const outputsFromMeta = parseOutputsArray(directive, evaluator);
    const outputsFromFields = parseOutputFields(clazz, decorator, members, isCore, reflector, importTracker, evaluator, outputsFromMeta);
    const outputs = ClassPropertyMapping.fromMappedObject({ ...outputsFromMeta, ...outputsFromFields });
    // Parse queries of fields.
    const { viewQueries, contentQueries } = parseQueriesOfClassFields(members, reflector, importTracker, evaluator, isCore);
    if (directive.has('queries')) {
        const signalQueryFields = new Set([...viewQueries, ...contentQueries].filter((q) => q.isSignal).map((q) => q.propertyName));
        const queriesFromDecorator = extractQueriesFromDecorator(directive.get('queries'), reflector, evaluator, isCore);
        // Checks if the query is already declared/reserved via class members declaration.
        // If so, we throw a fatal diagnostic error to prevent this unintentional pattern.
        const checkAndUnwrapQuery = (q) => {
            if (signalQueryFields.has(q.metadata.propertyName)) {
                throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_DECORATOR_METADATA_COLLISION, q.expr, `Query is declared multiple times. "@${decorator.name}" declares a query for the same property.`);
            }
            return q.metadata;
        };
        contentQueries.push(...queriesFromDecorator.content.map((q) => checkAndUnwrapQuery(q)));
        viewQueries.push(...queriesFromDecorator.view.map((q) => checkAndUnwrapQuery(q)));
    }
    // Parse the selector.
    let selector = defaultSelector;
    if (directive.has('selector')) {
        const expr = directive.get('selector');
        const resolved = evaluator.evaluate(expr);
        assertLocalCompilationUnresolvedConst(compilationMode, resolved, null, 'Unresolved identifier found for @Component.selector field! Did you ' +
            'import this identifier from a file outside of the compilation unit? ' +
            'This is not allowed when Angular compiler runs in local mode. Possible ' +
            'solutions: 1) Move the declarations into a file within the compilation ' +
            'unit, 2) Inline the selector');
        if (typeof resolved !== 'string') {
            throw createValueHasWrongTypeError(expr, resolved, `selector must be a string`);
        }
        // use default selector in case selector is an empty string
        selector = resolved === '' ? defaultSelector : resolved;
        if (!selector) {
            throw new FatalDiagnosticError(exports.ErrorCode.DIRECTIVE_MISSING_SELECTOR, expr, `Directive ${clazz.name.text} has no selector, please add it!`);
        }
    }
    const hostBindingNodes = {
        literal: null,
        bindingDecorators: new Set(),
        listenerDecorators: new Set(),
    };
    const host = extractHostBindings(decoratedElements, evaluator, coreModule, compilationMode, hostBindingNodes, directive);
    const providers = directive.has('providers')
        ? new compiler.WrappedNodeExpr(annotateForClosureCompiler
            ? wrapFunctionExpressionsInParens(directive.get('providers'))
            : directive.get('providers'))
        : null;
    // Determine if `ngOnChanges` is a lifecycle hook defined on the component.
    const usesOnChanges = members.some((member) => !member.isStatic && member.kind === exports.ClassMemberKind.Method && member.name === 'ngOnChanges');
    // Parse exportAs.
    let exportAs = null;
    if (directive.has('exportAs')) {
        const expr = directive.get('exportAs');
        const resolved = evaluator.evaluate(expr);
        assertLocalCompilationUnresolvedConst(compilationMode, resolved, null, 'Unresolved identifier found for exportAs field! Did you import this ' +
            'identifier from a file outside of the compilation unit? This is not ' +
            'allowed when Angular compiler runs in local mode. Possible solutions: ' +
            '1) Move the declarations into a file within the compilation unit, ' +
            '2) Inline the selector');
        if (typeof resolved !== 'string') {
            throw createValueHasWrongTypeError(expr, resolved, `exportAs must be a string`);
        }
        exportAs = resolved.split(',').map((part) => part.trim());
    }
    const rawCtorDeps = getConstructorDependencies(clazz, reflector, isCore);
    // Non-abstract directives (those with a selector) require valid constructor dependencies, whereas
    // abstract directives are allowed to have invalid dependencies, given that a subclass may call
    // the constructor explicitly.
    const ctorDeps = selector !== null
        ? validateConstructorDependencies(clazz, rawCtorDeps)
        : unwrapConstructorDependencies(rawCtorDeps);
    // Structural directives must have a `TemplateRef` dependency.
    const isStructural = ctorDeps !== null &&
        ctorDeps !== 'invalid' &&
        ctorDeps.some((dep) => dep.token instanceof compiler.ExternalExpr &&
            dep.token.value.moduleName === '@angular/core' &&
            dep.token.value.name === 'TemplateRef');
    let isStandalone = implicitStandaloneValue;
    if (directive.has('standalone')) {
        const expr = directive.get('standalone');
        const resolved = evaluator.evaluate(expr);
        if (typeof resolved !== 'boolean') {
            throw createValueHasWrongTypeError(expr, resolved, `standalone flag must be a boolean`);
        }
        isStandalone = resolved;
        if (!isStandalone && strictStandalone) {
            throw new FatalDiagnosticError(exports.ErrorCode.NON_STANDALONE_NOT_ALLOWED, expr, `Only standalone components/directives are allowed when 'strictStandalone' is enabled.`);
        }
    }
    let isSignal = false;
    if (directive.has('signals')) {
        const expr = directive.get('signals');
        const resolved = evaluator.evaluate(expr);
        if (typeof resolved !== 'boolean') {
            throw createValueHasWrongTypeError(expr, resolved, `signals flag must be a boolean`);
        }
        isSignal = resolved;
    }
    // Detect if the component inherits from another class
    const usesInheritance = reflector.hasBaseClass(clazz);
    const sourceFile = clazz.getSourceFile();
    const type = wrapTypeReference(reflector, clazz);
    const rawHostDirectives = directive.get('hostDirectives') || null;
    const hostDirectives = rawHostDirectives === null
        ? null
        : extractHostDirectives(rawHostDirectives, evaluator, compilationMode, createForwardRefResolver(isCore));
    if (compilationMode !== exports.CompilationMode.LOCAL && hostDirectives !== null) {
        // In global compilation mode where we do type checking, the template type-checker will need to
        // import host directive types, so add them as referenced by `clazz`. This will ensure that
        // libraries are required to export host directives which are visible from publicly exported
        // components.
        referencesRegistry.add(clazz, ...hostDirectives.map((hostDir) => {
            if (!isHostDirectiveMetaForGlobalMode(hostDir)) {
                throw new Error('Impossible state');
            }
            return hostDir.directive;
        }));
    }
    const metadata = {
        name: clazz.name.text,
        deps: ctorDeps,
        host: {
            ...host,
        },
        lifecycle: {
            usesOnChanges,
        },
        inputs: inputs.toJointMappedObject(toR3InputMetadata),
        outputs: outputs.toDirectMappedObject(),
        queries: contentQueries,
        viewQueries,
        selector,
        fullInheritance: false,
        type,
        typeArgumentCount: reflector.getGenericArityOfClass(clazz) || 0,
        typeSourceSpan: createSourceSpan(clazz.name),
        usesInheritance,
        exportAs,
        providers,
        isStandalone,
        isSignal,
        hostDirectives: hostDirectives?.map((hostDir) => toHostDirectiveMetadata(hostDir, sourceFile, refEmitter)) ||
            null,
    };
    return {
        jitForced: false,
        decorator: directive,
        metadata,
        inputs,
        outputs,
        isStructural,
        hostDirectives,
        rawHostDirectives,
        hostBindingNodes,
        // Track inputs from class metadata. This is useful for migration efforts.
        inputFieldNamesFromMetadataArray: new Set(Object.values(inputsFromMeta).map((i) => i.classPropertyName)),
    };
}
function extractDecoratorQueryMetadata(exprNode, name, args, propertyName, reflector, evaluator) {
    if (args.length === 0) {
        throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, exprNode, `@${name} must have arguments`);
    }
    const first = name === 'ViewChild' || name === 'ContentChild';
    const forwardReferenceTarget = tryUnwrapForwardRef(args[0], reflector);
    const node = forwardReferenceTarget ?? args[0];
    const arg = evaluator.evaluate(node);
    /** Whether or not this query should collect only static results (see view/api.ts)  */
    let isStatic = false;
    // Extract the predicate
    let predicate = null;
    if (arg instanceof Reference || arg instanceof DynamicValue) {
        // References and predicates that could not be evaluated statically are emitted as is.
        predicate = compiler.createMayBeForwardRefExpression(new compiler.WrappedNodeExpr(node), forwardReferenceTarget !== null ? 2 /* ForwardRefHandling.Unwrapped */ : 0 /* ForwardRefHandling.None */);
    }
    else if (typeof arg === 'string') {
        predicate = [arg];
    }
    else if (isStringArrayOrDie(arg, `@${name} predicate`, node)) {
        predicate = arg;
    }
    else {
        throw createValueHasWrongTypeError(node, arg, `@${name} predicate cannot be interpreted`);
    }
    // Extract the read and descendants options.
    let read = null;
    // The default value for descendants is true for every decorator except @ContentChildren.
    let descendants = name !== 'ContentChildren';
    let emitDistinctChangesOnly = compiler.emitDistinctChangesOnlyDefaultValue;
    if (args.length === 2) {
        const optionsExpr = unwrapExpression(args[1]);
        if (!ts.isObjectLiteralExpression(optionsExpr)) {
            throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARG_NOT_LITERAL, optionsExpr, `@${name} options must be an object literal`);
        }
        const options = reflectObjectLiteral(optionsExpr);
        if (options.has('read')) {
            read = new compiler.WrappedNodeExpr(options.get('read'));
        }
        if (options.has('descendants')) {
            const descendantsExpr = options.get('descendants');
            const descendantsValue = evaluator.evaluate(descendantsExpr);
            if (typeof descendantsValue !== 'boolean') {
                throw createValueHasWrongTypeError(descendantsExpr, descendantsValue, `@${name} options.descendants must be a boolean`);
            }
            descendants = descendantsValue;
        }
        if (options.has('emitDistinctChangesOnly')) {
            const emitDistinctChangesOnlyExpr = options.get('emitDistinctChangesOnly');
            const emitDistinctChangesOnlyValue = evaluator.evaluate(emitDistinctChangesOnlyExpr);
            if (typeof emitDistinctChangesOnlyValue !== 'boolean') {
                throw createValueHasWrongTypeError(emitDistinctChangesOnlyExpr, emitDistinctChangesOnlyValue, `@${name} options.emitDistinctChangesOnly must be a boolean`);
            }
            emitDistinctChangesOnly = emitDistinctChangesOnlyValue;
        }
        if (options.has('static')) {
            const staticValue = evaluator.evaluate(options.get('static'));
            if (typeof staticValue !== 'boolean') {
                throw createValueHasWrongTypeError(node, staticValue, `@${name} options.static must be a boolean`);
            }
            isStatic = staticValue;
        }
    }
    else if (args.length > 2) {
        // Too many arguments.
        throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, node, `@${name} has too many arguments`);
    }
    return {
        isSignal: false,
        propertyName,
        predicate,
        first,
        descendants,
        read,
        static: isStatic,
        emitDistinctChangesOnly,
    };
}
function extractHostBindings(members, evaluator, coreModule, compilationMode, hostBindingNodes, metadata) {
    let bindings;
    if (metadata && metadata.has('host')) {
        const hostExpression = metadata.get('host');
        bindings = evaluateHostExpressionBindings(hostExpression, evaluator);
        if (ts.isObjectLiteralExpression(hostExpression)) {
            hostBindingNodes.literal = hostExpression;
        }
    }
    else {
        bindings = compiler.parseHostBindings({});
    }
    filterToMembersWithDecorator(members, 'HostBinding', coreModule).forEach(({ member, decorators }) => {
        decorators.forEach((decorator) => {
            let hostPropertyName = member.name;
            if (decorator.args !== null && decorator.args.length > 0) {
                if (decorator.args.length !== 1) {
                    throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `@HostBinding can have at most one argument, got ${decorator.args.length} argument(s)`);
                }
                const resolved = evaluator.evaluate(decorator.args[0]);
                // Specific error for local compilation mode if the argument cannot be resolved
                assertLocalCompilationUnresolvedConst(compilationMode, resolved, null, "Unresolved identifier found for @HostBinding's argument! Did " +
                    'you import this identifier from a file outside of the compilation ' +
                    'unit? This is not allowed when Angular compiler runs in local mode. ' +
                    'Possible solutions: 1) Move the declaration into a file within ' +
                    'the compilation unit, 2) Inline the argument');
                if (typeof resolved !== 'string') {
                    throw createValueHasWrongTypeError(decorator.node, resolved, `@HostBinding's argument must be a string`);
                }
                hostPropertyName = resolved;
            }
            if (ts.isDecorator(decorator.node)) {
                hostBindingNodes.bindingDecorators.add(decorator.node);
            }
            // Since this is a decorator, we know that the value is a class member. Always access it
            // through `this` so that further down the line it can't be confused for a literal value
            // (e.g. if there's a property called `true`). There is no size penalty, because all
            // values (except literals) are converted to `ctx.propName` eventually.
            bindings.properties[hostPropertyName] = compiler.getSafePropertyAccessString('this', member.name);
        });
    });
    filterToMembersWithDecorator(members, 'HostListener', coreModule).forEach(({ member, decorators }) => {
        decorators.forEach((decorator) => {
            let eventName = member.name;
            let args = [];
            if (decorator.args !== null && decorator.args.length > 0) {
                if (decorator.args.length > 2) {
                    throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, decorator.args[2], `@HostListener can have at most two arguments`);
                }
                const resolved = evaluator.evaluate(decorator.args[0]);
                // Specific error for local compilation mode if the event name cannot be resolved
                assertLocalCompilationUnresolvedConst(compilationMode, resolved, null, "Unresolved identifier found for @HostListener's event name " +
                    'argument! Did you import this identifier from a file outside of ' +
                    'the compilation unit? This is not allowed when Angular compiler ' +
                    'runs in local mode. Possible solutions: 1) Move the declaration ' +
                    'into a file within the compilation unit, 2) Inline the argument');
                if (typeof resolved !== 'string') {
                    throw createValueHasWrongTypeError(decorator.args[0], resolved, `@HostListener's event name argument must be a string`);
                }
                eventName = resolved;
                if (decorator.args.length === 2) {
                    const expression = decorator.args[1];
                    const resolvedArgs = evaluator.evaluate(decorator.args[1]);
                    if (!isStringArrayOrDie(resolvedArgs, '@HostListener.args', expression)) {
                        throw createValueHasWrongTypeError(decorator.args[1], resolvedArgs, `@HostListener's second argument must be a string array`);
                    }
                    args = resolvedArgs;
                }
            }
            if (ts.isDecorator(decorator.node)) {
                hostBindingNodes.listenerDecorators.add(decorator.node);
            }
            bindings.listeners[eventName] = `${member.name}(${args.join(',')})`;
        });
    });
    return bindings;
}
function extractQueriesFromDecorator(queryData, reflector, evaluator, isCore) {
    const content = [];
    const view = [];
    if (!ts.isObjectLiteralExpression(queryData)) {
        throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, queryData, 'Decorator queries metadata must be an object literal');
    }
    reflectObjectLiteral(queryData).forEach((queryExpr, propertyName) => {
        queryExpr = unwrapExpression(queryExpr);
        if (!ts.isNewExpression(queryExpr)) {
            throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, queryData, 'Decorator query metadata must be an instance of a query type');
        }
        const queryType = ts.isPropertyAccessExpression(queryExpr.expression)
            ? queryExpr.expression.name
            : queryExpr.expression;
        if (!ts.isIdentifier(queryType)) {
            throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, queryData, 'Decorator query metadata must be an instance of a query type');
        }
        const type = reflector.getImportOfIdentifier(queryType);
        if (type === null ||
            (!isCore && type.from !== '@angular/core') ||
            !QUERY_TYPES.has(type.name)) {
            throw new FatalDiagnosticError(exports.ErrorCode.VALUE_HAS_WRONG_TYPE, queryData, 'Decorator query metadata must be an instance of a query type');
        }
        const query = extractDecoratorQueryMetadata(queryExpr, type.name, queryExpr.arguments || [], propertyName, reflector, evaluator);
        if (type.name.startsWith('Content')) {
            content.push({ expr: queryExpr, metadata: query });
        }
        else {
            view.push({ expr: queryExpr, metadata: query });
        }
    });
    return { content, view };
}
function parseDirectiveStyles(directive, evaluator, compilationMode) {
    const expression = directive.get('styles');
    if (!expression) {
        return null;
    }
    const evaluated = evaluator.evaluate(expression);
    const value = typeof evaluated === 'string' ? [evaluated] : evaluated;
    // Check if the identifier used for @Component.styles cannot be resolved in local compilation
    // mode. if the case, an error specific to this situation is generated.
    if (compilationMode === exports.CompilationMode.LOCAL) {
        let unresolvedNode = null;
        if (Array.isArray(value)) {
            const entry = value.find((e) => e instanceof DynamicValue && e.isFromUnknownIdentifier());
            unresolvedNode = entry?.node ?? null;
        }
        else if (value instanceof DynamicValue && value.isFromUnknownIdentifier()) {
            unresolvedNode = value.node;
        }
        if (unresolvedNode !== null) {
            throw new FatalDiagnosticError(exports.ErrorCode.LOCAL_COMPILATION_UNRESOLVED_CONST, unresolvedNode, 'Unresolved identifier found for @Component.styles field! Did you import ' +
                'this identifier from a file outside of the compilation unit? This is ' +
                'not allowed when Angular compiler runs in local mode. Possible ' +
                'solutions: 1) Move the declarations into a file within the compilation ' +
                'unit, 2) Inline the styles, 3) Move the styles into separate files and ' +
                'include it using @Component.styleUrls');
        }
    }
    if (!isStringArrayOrDie(value, 'styles', expression)) {
        throw createValueHasWrongTypeError(expression, value, `Failed to resolve @Component.styles to a string or an array of strings`);
    }
    return value;
}
function parseFieldStringArrayValue(directive, field, evaluator) {
    if (!directive.has(field)) {
        return null;
    }
    // Resolve the field of interest from the directive metadata to a string[].
    const expression = directive.get(field);
    const value = evaluator.evaluate(expression);
    if (!isStringArrayOrDie(value, field, expression)) {
        throw createValueHasWrongTypeError(expression, value, `Failed to resolve @Directive.${field} to a string array`);
    }
    return value;
}
function isStringArrayOrDie(value, name, node) {
    if (!Array.isArray(value)) {
        return false;
    }
    for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== 'string') {
            throw createValueHasWrongTypeError(node, value[i], `Failed to resolve ${name} at position ${i} to a string`);
        }
    }
    return true;
}
function tryGetQueryFromFieldDecorator(member, reflector, evaluator, isCore) {
    const decorators = member.decorators;
    if (decorators === null) {
        return null;
    }
    const queryDecorators = getAngularDecorators(decorators, queryDecoratorNames, isCore);
    if (queryDecorators.length === 0) {
        return null;
    }
    if (queryDecorators.length !== 1) {
        throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_COLLISION, member.node ?? queryDecorators[0].node, 'Cannot combine multiple query decorators.');
    }
    const decorator = queryDecorators[0];
    const node = member.node || decorator.node;
    // Throw in case of `@Input() @ContentChild('foo') foo: any`, which is not supported in Ivy
    if (decorators.some((v) => v.name === 'Input')) {
        throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_COLLISION, node, 'Cannot combine @Input decorators with query decorators');
    }
    if (!isPropertyTypeMember(member)) {
        throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_UNEXPECTED, node, 'Query decorator must go on a property-type member');
    }
    // Either the decorator was aliased, or is referenced directly with
    // the proper query name.
    const name = (decorator.import?.name ?? decorator.name);
    return {
        name,
        decorator,
        metadata: extractDecoratorQueryMetadata(node, name, decorator.args || [], member.name, reflector, evaluator),
    };
}
function isPropertyTypeMember(member) {
    return (member.kind === exports.ClassMemberKind.Getter ||
        member.kind === exports.ClassMemberKind.Setter ||
        member.kind === exports.ClassMemberKind.Property);
}
function parseMappingStringArray(values) {
    return values.reduce((results, value) => {
        if (typeof value !== 'string') {
            throw new Error('Mapping value must be a string');
        }
        const [bindingPropertyName, fieldName] = parseMappingString(value);
        results[fieldName] = bindingPropertyName;
        return results;
    }, {});
}
function parseMappingString(value) {
    // Either the value is 'field' or 'field: property'. In the first case, `property` will
    // be undefined, in which case the field name should also be used as the property name.
    const [fieldName, bindingPropertyName] = value.split(':', 2).map((str) => str.trim());
    return [bindingPropertyName ?? fieldName, fieldName];
}
/** Parses the `inputs` array of a directive/component decorator. */
function parseInputsArray(clazz, decoratorMetadata, evaluator, reflector, refEmitter, compilationMode) {
    const inputsField = decoratorMetadata.get('inputs');
    if (inputsField === undefined) {
        return {};
    }
    const inputs = {};
    const inputsArray = evaluator.evaluate(inputsField);
    if (!Array.isArray(inputsArray)) {
        throw createValueHasWrongTypeError(inputsField, inputsArray, `Failed to resolve @Directive.inputs to an array`);
    }
    for (let i = 0; i < inputsArray.length; i++) {
        const value = inputsArray[i];
        if (typeof value === 'string') {
            // If the value is a string, we treat it as a mapping string.
            const [bindingPropertyName, classPropertyName] = parseMappingString(value);
            inputs[classPropertyName] = {
                bindingPropertyName,
                classPropertyName,
                required: false,
                transform: null,
                // Note: Signal inputs are not allowed with the array form.
                isSignal: false,
            };
        }
        else if (value instanceof Map) {
            // If it's a map, we treat it as a config object.
            const name = value.get('name');
            const alias = value.get('alias');
            const required = value.get('required');
            let transform = null;
            if (typeof name !== 'string') {
                throw createValueHasWrongTypeError(inputsField, name, `Value at position ${i} of @Directive.inputs array must have a "name" property`);
            }
            if (value.has('transform')) {
                const transformValue = value.get('transform');
                if (!(transformValue instanceof DynamicValue) && !(transformValue instanceof Reference)) {
                    throw createValueHasWrongTypeError(inputsField, transformValue, `Transform of value at position ${i} of @Directive.inputs array must be a function`);
                }
                transform = parseDecoratorInputTransformFunction(clazz, name, transformValue, reflector, refEmitter, compilationMode);
            }
            inputs[name] = {
                classPropertyName: name,
                bindingPropertyName: typeof alias === 'string' ? alias : name,
                required: required === true,
                // Note: Signal inputs are not allowed with the array form.
                isSignal: false,
                transform,
            };
        }
        else {
            throw createValueHasWrongTypeError(inputsField, value, `@Directive.inputs array can only contain strings or object literals`);
        }
    }
    return inputs;
}
/** Attempts to find a given Angular decorator on the class member. */
function tryGetDecoratorOnMember(member, decoratorName, isCore) {
    if (member.decorators === null) {
        return null;
    }
    for (const decorator of member.decorators) {
        if (isAngularDecorator(decorator, decoratorName, isCore)) {
            return decorator;
        }
    }
    return null;
}
function tryParseInputFieldMapping(clazz, member, evaluator, reflector, importTracker, isCore, refEmitter, compilationMode) {
    const classPropertyName = member.name;
    const decorator = tryGetDecoratorOnMember(member, 'Input', isCore);
    const signalInputMapping = tryParseSignalInputMapping(member, reflector, importTracker);
    const modelInputMapping = tryParseSignalModelMapping(member, reflector, importTracker);
    if (decorator !== null && signalInputMapping !== null) {
        throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_WITH_DISALLOWED_DECORATOR, decorator.node, `Using @Input with a signal input is not allowed.`);
    }
    if (decorator !== null && modelInputMapping !== null) {
        throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_WITH_DISALLOWED_DECORATOR, decorator.node, `Using @Input with a model input is not allowed.`);
    }
    // Check `@Input` case.
    if (decorator !== null) {
        if (decorator.args !== null && decorator.args.length > 1) {
            throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `@${decorator.name} can have at most one argument, got ${decorator.args.length} argument(s)`);
        }
        const optionsNode = decorator.args !== null && decorator.args.length === 1 ? decorator.args[0] : undefined;
        const options = optionsNode !== undefined ? evaluator.evaluate(optionsNode) : null;
        const required = options instanceof Map ? options.get('required') === true : false;
        // To preserve old behavior: Even though TypeScript types ensure proper options are
        // passed, we sanity check for unsupported values here again.
        if (options !== null && typeof options !== 'string' && !(options instanceof Map)) {
            throw createValueHasWrongTypeError(decorator.node, options, `@${decorator.name} decorator argument must resolve to a string or an object literal`);
        }
        let alias = null;
        if (typeof options === 'string') {
            alias = options;
        }
        else if (options instanceof Map && typeof options.get('alias') === 'string') {
            alias = options.get('alias');
        }
        const publicInputName = alias ?? classPropertyName;
        let transform = null;
        if (options instanceof Map && options.has('transform')) {
            const transformValue = options.get('transform');
            if (!(transformValue instanceof DynamicValue) && !(transformValue instanceof Reference)) {
                throw createValueHasWrongTypeError(optionsNode, transformValue, `Input transform must be a function`);
            }
            transform = parseDecoratorInputTransformFunction(clazz, classPropertyName, transformValue, reflector, refEmitter, compilationMode);
        }
        return {
            isSignal: false,
            classPropertyName,
            bindingPropertyName: publicInputName,
            transform,
            required,
        };
    }
    // Look for signal inputs. e.g. `memberName = input()`
    if (signalInputMapping !== null) {
        return signalInputMapping;
    }
    if (modelInputMapping !== null) {
        return modelInputMapping.input;
    }
    return null;
}
/** Parses the class members that declare inputs (via decorator or initializer). */
function parseInputFields(clazz, members, evaluator, reflector, importTracker, refEmitter, isCore, compilationMode, inputsFromClassDecorator, classDecorator) {
    const inputs = {};
    for (const member of members) {
        const classPropertyName = member.name;
        const inputMapping = tryParseInputFieldMapping(clazz, member, evaluator, reflector, importTracker, isCore, refEmitter, compilationMode);
        if (inputMapping === null) {
            continue;
        }
        if (member.isStatic) {
            throw new FatalDiagnosticError(exports.ErrorCode.INCORRECTLY_DECLARED_ON_STATIC_MEMBER, member.node ?? clazz, `Input "${member.name}" is incorrectly declared as static member of "${clazz.name.text}".`);
        }
        // Validate that signal inputs are not accidentally declared in the `inputs` metadata.
        if (inputMapping.isSignal && inputsFromClassDecorator.hasOwnProperty(classPropertyName)) {
            throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_DECORATOR_METADATA_COLLISION, member.node ?? clazz, `Input "${member.name}" is also declared as non-signal in @${classDecorator.name}.`);
        }
        inputs[classPropertyName] = inputMapping;
    }
    return inputs;
}
/**
 * Parses the `transform` function and its type for a decorator `@Input`.
 *
 * This logic verifies feasibility of extracting the transform write type
 * into a different place, so that the input write type can be captured at
 * a later point in a static acceptance member.
 *
 * Note: This is not needed for signal inputs where the transform type is
 * automatically captured in the type of the `InputSignal`.
 *
 */
function parseDecoratorInputTransformFunction(clazz, classPropertyName, value, reflector, refEmitter, compilationMode) {
    // In local compilation mode we can skip type checking the function args. This is because usually
    // the type check is done in a separate build which runs in full compilation mode. So here we skip
    // all the diagnostics.
    if (compilationMode === exports.CompilationMode.LOCAL) {
        const node = value instanceof Reference ? value.getIdentityIn(clazz.getSourceFile()) : value.node;
        // This should never be null since we know the reference originates
        // from the same file, but we null check it just in case.
        if (node === null) {
            throw createValueHasWrongTypeError(value.node, value, 'Input transform function could not be referenced');
        }
        return {
            node,
            type: new Reference(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)),
        };
    }
    const definition = reflector.getDefinitionOfFunction(value.node);
    if (definition === null) {
        throw createValueHasWrongTypeError(value.node, value, 'Input transform must be a function');
    }
    if (definition.typeParameters !== null && definition.typeParameters.length > 0) {
        throw createValueHasWrongTypeError(value.node, value, 'Input transform function cannot be generic');
    }
    if (definition.signatureCount > 1) {
        throw createValueHasWrongTypeError(value.node, value, 'Input transform function cannot have multiple signatures');
    }
    const members = reflector.getMembersOfClass(clazz);
    for (const member of members) {
        const conflictingName = `ngAcceptInputType_${classPropertyName}`;
        if (member.name === conflictingName && member.isStatic) {
            throw new FatalDiagnosticError(exports.ErrorCode.CONFLICTING_INPUT_TRANSFORM, value.node, `Class cannot have both a transform function on Input ${classPropertyName} and a static member called ${conflictingName}`);
        }
    }
    const node = value instanceof Reference ? value.getIdentityIn(clazz.getSourceFile()) : value.node;
    // This should never be null since we know the reference originates
    // from the same file, but we null check it just in case.
    if (node === null) {
        throw createValueHasWrongTypeError(value.node, value, 'Input transform function could not be referenced');
    }
    // Skip over `this` parameters since they're typing the context, not the actual parameter.
    // `this` parameters are guaranteed to be first if they exist, and the only to distinguish them
    // is using the name, TS doesn't have a special AST for them.
    const firstParam = definition.parameters[0]?.name === 'this' ? definition.parameters[1] : definition.parameters[0];
    // Treat functions with no arguments as `unknown` since returning
    // the same value from the transform function is valid.
    if (!firstParam) {
        return {
            node,
            type: new Reference(ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)),
        };
    }
    // This should be caught by `noImplicitAny` already, but null check it just in case.
    if (!firstParam.type) {
        throw createValueHasWrongTypeError(value.node, value, 'Input transform function first parameter must have a type');
    }
    if (firstParam.node.dotDotDotToken) {
        throw createValueHasWrongTypeError(value.node, value, 'Input transform function first parameter cannot be a spread parameter');
    }
    assertEmittableInputType(firstParam.type, clazz.getSourceFile(), reflector, refEmitter);
    const viaModule = value instanceof Reference ? value.bestGuessOwningModule : null;
    return { node, type: new Reference(firstParam.type, viaModule) };
}
/**
 * Verifies that a type and all types contained within
 * it can be referenced in a specific context file.
 */
function assertEmittableInputType(type, contextFile, reflector, refEmitter) {
    (function walk(node) {
        if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
            const declaration = reflector.getDeclarationOfIdentifier(node.typeName);
            if (declaration !== null) {
                // If the type is declared in a different file, we have to check that it can be imported
                // into the context file. If they're in the same file, we need to verify that they're
                // exported, otherwise TS won't emit it to the .d.ts.
                if (declaration.node.getSourceFile() !== contextFile) {
                    const emittedType = refEmitter.emit(new Reference(declaration.node, declaration.viaModule === AmbientImport ? AmbientImport : null), contextFile, exports.ImportFlags.NoAliasing |
                        exports.ImportFlags.AllowTypeImports |
                        exports.ImportFlags.AllowRelativeDtsImports |
                        exports.ImportFlags.AllowAmbientReferences);
                    assertSuccessfulReferenceEmit(emittedType, node, 'type');
                }
                else if (!reflector.isStaticallyExported(declaration.node)) {
                    throw new FatalDiagnosticError(exports.ErrorCode.SYMBOL_NOT_EXPORTED, type, `Symbol must be exported in order to be used as the type of an Input transform function`, [makeRelatedInformation(declaration.node, `The symbol is declared here.`)]);
                }
            }
        }
        node.forEachChild(walk);
    })(type);
}
/**
 * Iterates through all specified class members and attempts to detect
 * view and content queries defined.
 *
 * Queries may be either defined via decorators, or through class member
 * initializers for signal-based queries.
 */
function parseQueriesOfClassFields(members, reflector, importTracker, evaluator, isCore) {
    const viewQueries = [];
    const contentQueries = [];
    // For backwards compatibility, decorator-based queries are grouped and
    // ordered in a specific way. The order needs to match with what we had in:
    // https://github.com/angular/angular/blob/8737544d6963bf664f752de273e919575cca08ac/packages/compiler-cli/src/ngtsc/annotations/directive/src/shared.ts#L94-L111.
    const decoratorViewChild = [];
    const decoratorViewChildren = [];
    const decoratorContentChild = [];
    const decoratorContentChildren = [];
    for (const member of members) {
        const decoratorQuery = tryGetQueryFromFieldDecorator(member, reflector, evaluator, isCore);
        const signalQuery = tryParseSignalQueryFromInitializer(member, reflector, importTracker);
        if (decoratorQuery !== null && signalQuery !== null) {
            throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_WITH_DISALLOWED_DECORATOR, decoratorQuery.decorator.node, `Using @${decoratorQuery.name} with a signal-based query is not allowed.`);
        }
        const queryNode = decoratorQuery?.decorator.node ?? signalQuery?.call;
        if (queryNode !== undefined && member.isStatic) {
            throw new FatalDiagnosticError(exports.ErrorCode.INCORRECTLY_DECLARED_ON_STATIC_MEMBER, queryNode, `Query is incorrectly declared on a static class member.`);
        }
        if (decoratorQuery !== null) {
            switch (decoratorQuery.name) {
                case 'ViewChild':
                    decoratorViewChild.push(decoratorQuery.metadata);
                    break;
                case 'ViewChildren':
                    decoratorViewChildren.push(decoratorQuery.metadata);
                    break;
                case 'ContentChild':
                    decoratorContentChild.push(decoratorQuery.metadata);
                    break;
                case 'ContentChildren':
                    decoratorContentChildren.push(decoratorQuery.metadata);
                    break;
            }
        }
        else if (signalQuery !== null) {
            switch (signalQuery.name) {
                case 'viewChild':
                case 'viewChildren':
                    viewQueries.push(signalQuery.metadata);
                    break;
                case 'contentChild':
                case 'contentChildren':
                    contentQueries.push(signalQuery.metadata);
                    break;
            }
        }
    }
    return {
        viewQueries: [...viewQueries, ...decoratorViewChild, ...decoratorViewChildren],
        contentQueries: [...contentQueries, ...decoratorContentChild, ...decoratorContentChildren],
    };
}
/** Parses the `outputs` array of a directive/component. */
function parseOutputsArray(directive, evaluator) {
    const metaValues = parseFieldStringArrayValue(directive, 'outputs', evaluator);
    return metaValues ? parseMappingStringArray(metaValues) : EMPTY_OBJECT;
}
/** Parses the class members that are outputs. */
function parseOutputFields(clazz, classDecorator, members, isCore, reflector, importTracker, evaluator, outputsFromMeta) {
    const outputs = {};
    for (const member of members) {
        const decoratorOutput = tryParseDecoratorOutput(member, evaluator, isCore);
        const initializerOutput = tryParseInitializerBasedOutput(member, reflector, importTracker);
        const modelMapping = tryParseSignalModelMapping(member, reflector, importTracker);
        if (decoratorOutput !== null && initializerOutput !== null) {
            throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_WITH_DISALLOWED_DECORATOR, decoratorOutput.decorator.node, `Using "@Output" with "output()" is not allowed.`);
        }
        if (decoratorOutput !== null && modelMapping !== null) {
            throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_WITH_DISALLOWED_DECORATOR, decoratorOutput.decorator.node, `Using @Output with a model input is not allowed.`);
        }
        const queryNode = decoratorOutput?.decorator.node ?? initializerOutput?.call ?? modelMapping?.call;
        if (queryNode !== undefined && member.isStatic) {
            throw new FatalDiagnosticError(exports.ErrorCode.INCORRECTLY_DECLARED_ON_STATIC_MEMBER, queryNode, `Output is incorrectly declared on a static class member.`);
        }
        let bindingPropertyName;
        if (decoratorOutput !== null) {
            bindingPropertyName = decoratorOutput.metadata.bindingPropertyName;
        }
        else if (initializerOutput !== null) {
            bindingPropertyName = initializerOutput.metadata.bindingPropertyName;
        }
        else if (modelMapping !== null) {
            bindingPropertyName = modelMapping.output.bindingPropertyName;
        }
        else {
            continue;
        }
        // Validate that initializer-based outputs are not accidentally declared
        // in the `outputs` class metadata.
        if ((initializerOutput !== null || modelMapping !== null) &&
            outputsFromMeta.hasOwnProperty(member.name)) {
            throw new FatalDiagnosticError(exports.ErrorCode.INITIALIZER_API_DECORATOR_METADATA_COLLISION, member.node ?? clazz, `Output "${member.name}" is unexpectedly declared in @${classDecorator.name} as well.`);
        }
        outputs[member.name] = bindingPropertyName;
    }
    return outputs;
}
/** Attempts to parse a decorator-based @Output. */
function tryParseDecoratorOutput(member, evaluator, isCore) {
    const decorator = tryGetDecoratorOnMember(member, 'Output', isCore);
    if (decorator === null) {
        return null;
    }
    if (decorator.args !== null && decorator.args.length > 1) {
        throw new FatalDiagnosticError(exports.ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `@Output can have at most one argument, got ${decorator.args.length} argument(s)`);
    }
    const classPropertyName = member.name;
    let alias = null;
    if (decorator.args?.length === 1) {
        const resolvedAlias = evaluator.evaluate(decorator.args[0]);
        if (typeof resolvedAlias !== 'string') {
            throw createValueHasWrongTypeError(decorator.node, resolvedAlias, `@Output decorator argument must resolve to a string`);
        }
        alias = resolvedAlias;
    }
    return {
        decorator,
        metadata: {
            isSignal: false,
            classPropertyName,
            bindingPropertyName: alias ?? classPropertyName,
        },
    };
}
function evaluateHostExpressionBindings(hostExpr, evaluator) {
    const hostMetaMap = evaluator.evaluate(hostExpr);
    if (!(hostMetaMap instanceof Map)) {
        throw createValueHasWrongTypeError(hostExpr, hostMetaMap, `Decorator host metadata must be an object`);
    }
    const hostMetadata = {};
    hostMetaMap.forEach((value, key) => {
        // Resolve Enum references to their declared value.
        if (value instanceof EnumValue) {
            value = value.resolved;
        }
        if (typeof key !== 'string') {
            throw createValueHasWrongTypeError(hostExpr, key, `Decorator host metadata must be a string -> string object, but found unparseable key`);
        }
        if (typeof value == 'string') {
            hostMetadata[key] = value;
        }
        else if (value instanceof DynamicValue) {
            hostMetadata[key] = new compiler.WrappedNodeExpr(value.node);
        }
        else {
            throw createValueHasWrongTypeError(hostExpr, value, `Decorator host metadata must be a string -> string object, but found unparseable value`);
        }
    });
    const bindings = compiler.parseHostBindings(hostMetadata);
    const errors = compiler.verifyHostBindings(bindings, createSourceSpan(hostExpr));
    if (errors.length > 0) {
        throw new FatalDiagnosticError(exports.ErrorCode.HOST_BINDING_PARSE_ERROR, getHostBindingErrorNode(errors[0], hostExpr), errors.map((error) => error.msg).join('\n'));
    }
    return bindings;
}
/**
 * Attempts to match a parser error to the host binding expression that caused it.
 * @param error Error to match.
 * @param hostExpr Expression declaring the host bindings.
 */
function getHostBindingErrorNode(error, hostExpr) {
    // In the most common case the `host` object is an object literal with string values. We can
    // confidently match the error to its expression by looking at the string value that the parser
    // failed to parse and the initializers for each of the properties. If we fail to match, we fall
    // back to the old behavior where the error is reported on the entire `host` object.
    if (ts.isObjectLiteralExpression(hostExpr) && error.relatedError instanceof compiler.ParserError) {
        for (const prop of hostExpr.properties) {
            if (ts.isPropertyAssignment(prop) &&
                ts.isStringLiteralLike(prop.initializer) &&
                prop.initializer.text === error.relatedError.input) {
                return prop.initializer;
            }
        }
    }
    return hostExpr;
}
/**
 * Extracts and prepares the host directives metadata from an array literal expression.
 * @param rawHostDirectives Expression that defined the `hostDirectives`.
 */
function extractHostDirectives(rawHostDirectives, evaluator, compilationMode, forwardRefResolver) {
    const resolved = evaluator.evaluate(rawHostDirectives, forwardRefResolver);
    if (!Array.isArray(resolved)) {
        throw createValueHasWrongTypeError(rawHostDirectives, resolved, 'hostDirectives must be an array');
    }
    return resolved.map((value) => {
        const hostReference = value instanceof Map ? value.get('directive') : value;
        // Diagnostics
        if (compilationMode !== exports.CompilationMode.LOCAL) {
            if (!(hostReference instanceof Reference)) {
                throw createValueHasWrongTypeError(rawHostDirectives, hostReference, 'Host directive must be a reference');
            }
            if (!isNamedClassDeclaration(hostReference.node)) {
                throw createValueHasWrongTypeError(rawHostDirectives, hostReference, 'Host directive reference must be a class');
            }
        }
        let directive;
        let nameForErrors = (fieldName) => '@Directive.hostDirectives';
        if (compilationMode === exports.CompilationMode.LOCAL && hostReference instanceof DynamicValue) {
            // At the moment in local compilation we only support simple array for host directives, i.e.,
            // an array consisting of the directive identifiers. We don't support forward refs or other
            // expressions applied on externally imported directives. The main reason is simplicity, and
            // that almost nobody wants to use host directives this way (e.g., what would be the point of
            // forward ref for imported symbols?!)
            if (!ts.isIdentifier(hostReference.node) &&
                !ts.isPropertyAccessExpression(hostReference.node)) {
                throw new FatalDiagnosticError(exports.ErrorCode.LOCAL_COMPILATION_UNSUPPORTED_EXPRESSION, hostReference.node, `In local compilation mode, host directive cannot be an expression. Use an identifier instead`);
            }
            directive = new compiler.WrappedNodeExpr(hostReference.node);
        }
        else if (hostReference instanceof Reference) {
            directive = hostReference;
            nameForErrors = (fieldName) => `@Directive.hostDirectives.${directive.node.name.text}.${fieldName}`;
        }
        else {
            throw new Error('Impossible state');
        }
        const meta = {
            directive,
            isForwardReference: hostReference instanceof Reference && hostReference.synthetic,
            inputs: parseHostDirectivesMapping('inputs', value, nameForErrors('input'), rawHostDirectives),
            outputs: parseHostDirectivesMapping('outputs', value, nameForErrors('output'), rawHostDirectives),
        };
        return meta;
    });
}
/**
 * Parses the expression that defines the `inputs` or `outputs` of a host directive.
 * @param field Name of the field that is being parsed.
 * @param resolvedValue Evaluated value of the expression that defined the field.
 * @param classReference Reference to the host directive class.
 * @param sourceExpression Expression that the host directive is referenced in.
 */
function parseHostDirectivesMapping(field, resolvedValue, nameForErrors, sourceExpression) {
    if (resolvedValue instanceof Map && resolvedValue.has(field)) {
        const rawInputs = resolvedValue.get(field);
        if (isStringArrayOrDie(rawInputs, nameForErrors, sourceExpression)) {
            return parseMappingStringArray(rawInputs);
        }
    }
    return null;
}
/** Converts the parsed host directive information into metadata. */
function toHostDirectiveMetadata(hostDirective, context, refEmitter) {
    let directive;
    if (hostDirective.directive instanceof Reference) {
        directive = toR3Reference(hostDirective.directive.node, hostDirective.directive, context, refEmitter);
    }
    else {
        directive = {
            value: hostDirective.directive,
            type: hostDirective.directive,
        };
    }
    return {
        directive,
        isForwardReference: hostDirective.isForwardReference,
        inputs: hostDirective.inputs || null,
        outputs: hostDirective.outputs || null,
    };
}
/** Converts the parsed input information into metadata. */
function toR3InputMetadata(mapping) {
    return {
        classPropertyName: mapping.classPropertyName,
        bindingPropertyName: mapping.bindingPropertyName,
        required: mapping.required,
        transformFunction: mapping.transform !== null ? new compiler.WrappedNodeExpr(mapping.transform.node) : null,
        isSignal: mapping.isSignal,
    };
}
function extractHostBindingResources(nodes) {
    const result = new Set();
    if (nodes.literal !== null) {
        result.add({ path: null, node: nodes.literal });
    }
    for (const current of nodes.bindingDecorators) {
        result.add({ path: null, node: current.expression });
    }
    for (const current of nodes.listenerDecorators) {
        result.add({ path: null, node: current.expression });
    }
    return result;
}

const NgOriginalFile = Symbol('NgOriginalFile');
exports.UpdateMode = void 0;
(function (UpdateMode) {
    /**
     * A complete update creates a completely new overlay of type-checking code on top of the user's
     * original program, which doesn't include type-checking code from previous calls to
     * `updateFiles`.
     */
    UpdateMode[UpdateMode["Complete"] = 0] = "Complete";
    /**
     * An incremental update changes the contents of some files in the type-checking program without
     * reverting any prior changes.
     */
    UpdateMode[UpdateMode["Incremental"] = 1] = "Incremental";
})(exports.UpdateMode || (exports.UpdateMode = {}));

/**
 * A `Symbol` which is used to patch extension data onto `ts.SourceFile`s.
 */
const NgExtension = Symbol('NgExtension');
/**
 * Narrows a `ts.SourceFile` if it has an `NgExtension` property.
 */
function isExtended(sf) {
    return sf[NgExtension] !== undefined;
}
/**
 * Returns the `NgExtensionData` for a given `ts.SourceFile`, adding it if none exists.
 */
function sfExtensionData(sf) {
    const extSf = sf;
    if (extSf[NgExtension] !== undefined) {
        // The file already has extension data, so return it directly.
        return extSf[NgExtension];
    }
    // The file has no existing extension data, so add it and return it.
    const extension = {
        isTopLevelShim: false,
        fileShim: null,
        originalReferencedFiles: null,
        taggedReferenceFiles: null,
    };
    extSf[NgExtension] = extension;
    return extension;
}
/**
 * Check whether `sf` is a per-file shim `ts.SourceFile`.
 */
function isFileShimSourceFile(sf) {
    return isExtended(sf) && sf[NgExtension].fileShim !== null;
}
/**
 * Check whether `sf` is a shim `ts.SourceFile` (either a per-file shim or a top-level shim).
 */
function isShim(sf) {
    return isExtended(sf) && (sf[NgExtension].fileShim !== null || sf[NgExtension].isTopLevelShim);
}
/**
 * Copy any shim data from one `ts.SourceFile` to another.
 */
function copyFileShimData(from, to) {
    if (!isFileShimSourceFile(from)) {
        return;
    }
    sfExtensionData(to).fileShim = sfExtensionData(from).fileShim;
}
/**
 * For those `ts.SourceFile`s in the `program` which have previously been tagged by a
 * `ShimReferenceTagger`, restore the original `referencedFiles` array that does not have shim tags.
 */
function untagAllTsFiles(program) {
    for (const sf of program.getSourceFiles()) {
        untagTsFile(sf);
    }
}
/**
 * For those `ts.SourceFile`s in the `program` which have previously been tagged by a
 * `ShimReferenceTagger`, re-apply the effects of tagging by updating the `referencedFiles` array to
 * the tagged version produced previously.
 */
function retagAllTsFiles(program) {
    for (const sf of program.getSourceFiles()) {
        retagTsFile(sf);
    }
}
/**
 * Restore the original `referencedFiles` for the given `ts.SourceFile`.
 */
function untagTsFile(sf) {
    if (sf.isDeclarationFile || !isExtended(sf)) {
        return;
    }
    const ext = sfExtensionData(sf);
    if (ext.originalReferencedFiles !== null) {
        sf.referencedFiles = ext.originalReferencedFiles;
    }
}
/**
 * Apply the previously tagged `referencedFiles` to the given `ts.SourceFile`, if it was previously
 * tagged.
 */
function retagTsFile(sf) {
    if (sf.isDeclarationFile || !isExtended(sf)) {
        return;
    }
    const ext = sfExtensionData(sf);
    if (ext.taggedReferenceFiles !== null) {
        sf.referencedFiles = ext.taggedReferenceFiles;
    }
}

/**
 * Describes the scope of the caller's interest in template type-checking results.
 */
exports.OptimizeFor = void 0;
(function (OptimizeFor) {
    /**
     * Indicates that a consumer of a `TemplateTypeChecker` is only interested in results for a
     * given file, and wants them as fast as possible.
     *
     * Calling `TemplateTypeChecker` methods successively for multiple files while specifying
     * `OptimizeFor.SingleFile` can result in significant unnecessary overhead overall.
     */
    OptimizeFor[OptimizeFor["SingleFile"] = 0] = "SingleFile";
    /**
     * Indicates that a consumer of a `TemplateTypeChecker` intends to query for results pertaining
     * to the entire user program, and so the type-checker should internally optimize for this case.
     *
     * Initial calls to retrieve type-checking information may take longer, but repeated calls to
     * gather information for the whole user program will be significantly faster with this mode of
     * optimization.
     */
    OptimizeFor[OptimizeFor["WholeProgram"] = 1] = "WholeProgram";
})(exports.OptimizeFor || (exports.OptimizeFor = {}));

/**
 * Discriminant of an autocompletion source (a `Completion`).
 */
var CompletionKind;
(function (CompletionKind) {
    CompletionKind[CompletionKind["Reference"] = 0] = "Reference";
    CompletionKind[CompletionKind["Variable"] = 1] = "Variable";
    CompletionKind[CompletionKind["LetDeclaration"] = 2] = "LetDeclaration";
})(CompletionKind || (CompletionKind = {}));

/**
 * Which kind of Angular Trait the import targets.
 */
exports.PotentialImportKind = void 0;
(function (PotentialImportKind) {
    PotentialImportKind[PotentialImportKind["NgModule"] = 0] = "NgModule";
    PotentialImportKind[PotentialImportKind["Standalone"] = 1] = "Standalone";
})(exports.PotentialImportKind || (exports.PotentialImportKind = {}));
/**
 * Possible modes in which to look up a potential import.
 */
exports.PotentialImportMode = void 0;
(function (PotentialImportMode) {
    /** Whether an import is standalone is inferred based on its metadata. */
    PotentialImportMode[PotentialImportMode["Normal"] = 0] = "Normal";
    /**
     * An import is assumed to be standalone and is imported directly. This is useful for migrations
     * where a declaration wasn't standalone when the program was created, but will become standalone
     * as a part of the migration.
     */
    PotentialImportMode[PotentialImportMode["ForceDirect"] = 1] = "ForceDirect";
})(exports.PotentialImportMode || (exports.PotentialImportMode = {}));

exports.SymbolKind = void 0;
(function (SymbolKind) {
    SymbolKind[SymbolKind["Input"] = 0] = "Input";
    SymbolKind[SymbolKind["Output"] = 1] = "Output";
    SymbolKind[SymbolKind["Binding"] = 2] = "Binding";
    SymbolKind[SymbolKind["Reference"] = 3] = "Reference";
    SymbolKind[SymbolKind["Variable"] = 4] = "Variable";
    SymbolKind[SymbolKind["Directive"] = 5] = "Directive";
    SymbolKind[SymbolKind["Element"] = 6] = "Element";
    SymbolKind[SymbolKind["Template"] = 7] = "Template";
    SymbolKind[SymbolKind["Expression"] = 8] = "Expression";
    SymbolKind[SymbolKind["DomBinding"] = 9] = "DomBinding";
    SymbolKind[SymbolKind["Pipe"] = 10] = "Pipe";
    SymbolKind[SymbolKind["LetDeclaration"] = 11] = "LetDeclaration";
})(exports.SymbolKind || (exports.SymbolKind = {}));

/**
 * Constructs a `ts.Diagnostic` for a given `ParseSourceSpan` within a template.
 */
function makeTemplateDiagnostic(id, mapping, span, category, code, messageText, relatedMessages) {
    if (mapping.type === 'direct') {
        let relatedInformation = undefined;
        if (relatedMessages !== undefined) {
            relatedInformation = [];
            for (const relatedMessage of relatedMessages) {
                relatedInformation.push({
                    category: ts.DiagnosticCategory.Message,
                    code: 0,
                    file: relatedMessage.sourceFile,
                    start: relatedMessage.start,
                    length: relatedMessage.end - relatedMessage.start,
                    messageText: relatedMessage.text,
                });
            }
        }
        // For direct mappings, the error is shown inline as ngtsc was able to pinpoint a string
        // constant within the `@Component` decorator for the template. This allows us to map the error
        // directly into the bytes of the source file.
        return {
            source: 'ngtsc',
            code,
            category,
            messageText,
            file: mapping.node.getSourceFile(),
            sourceFile: mapping.node.getSourceFile(),
            typeCheckId: id,
            start: span.start.offset,
            length: span.end.offset - span.start.offset,
            relatedInformation,
        };
    }
    else if (mapping.type === 'indirect' || mapping.type === 'external') {
        // For indirect mappings (template was declared inline, but ngtsc couldn't map it directly
        // to a string constant in the decorator), the component's file name is given with a suffix
        // indicating it's not the TS file being displayed, but a template.
        // For external temoplates, the HTML filename is used.
        const componentSf = mapping.componentClass.getSourceFile();
        const componentName = mapping.componentClass.name.text;
        const fileName = mapping.type === 'indirect'
            ? `${componentSf.fileName} (${componentName} template)`
            : mapping.templateUrl;
        let relatedInformation = [];
        if (relatedMessages !== undefined) {
            for (const relatedMessage of relatedMessages) {
                relatedInformation.push({
                    category: ts.DiagnosticCategory.Message,
                    code: 0,
                    file: relatedMessage.sourceFile,
                    start: relatedMessage.start,
                    length: relatedMessage.end - relatedMessage.start,
                    messageText: relatedMessage.text,
                });
            }
        }
        let sf;
        try {
            sf = getParsedTemplateSourceFile(fileName, mapping);
        }
        catch (e) {
            const failureChain = makeDiagnosticChain(`Failed to report an error in '${fileName}' at ${span.start.line + 1}:${span.start.col + 1}`, [makeDiagnosticChain(e?.stack ?? `${e}`)]);
            return {
                source: 'ngtsc',
                category,
                code,
                messageText: addDiagnosticChain(messageText, [failureChain]),
                file: componentSf,
                sourceFile: componentSf,
                typeCheckId: id,
                // mapping.node represents either the 'template' or 'templateUrl' expression. getStart()
                // and getEnd() are used because they don't include surrounding whitespace.
                start: mapping.node.getStart(),
                length: mapping.node.getEnd() - mapping.node.getStart(),
                relatedInformation,
            };
        }
        relatedInformation.push({
            category: ts.DiagnosticCategory.Message,
            code: 0,
            file: componentSf,
            // mapping.node represents either the 'template' or 'templateUrl' expression. getStart()
            // and getEnd() are used because they don't include surrounding whitespace.
            start: mapping.node.getStart(),
            length: mapping.node.getEnd() - mapping.node.getStart(),
            messageText: `Error occurs in the template of component ${componentName}.`,
        });
        return {
            source: 'ngtsc',
            category,
            code,
            messageText,
            file: sf,
            sourceFile: componentSf,
            typeCheckId: id,
            start: span.start.offset,
            length: span.end.offset - span.start.offset,
            // Show a secondary message indicating the component whose template contains the error.
            relatedInformation,
        };
    }
    else {
        throw new Error(`Unexpected source mapping type: ${mapping.type}`);
    }
}
const TemplateSourceFile = Symbol('TemplateSourceFile');
function getParsedTemplateSourceFile(fileName, mapping) {
    if (mapping[TemplateSourceFile] === undefined) {
        mapping[TemplateSourceFile] = parseTemplateAsSourceFile(fileName, mapping.template);
    }
    return mapping[TemplateSourceFile];
}
function parseTemplateAsSourceFile(fileName, template) {
    // TODO(alxhub): investigate creating a fake `ts.SourceFile` here instead of invoking the TS
    // parser against the template (HTML is just really syntactically invalid TypeScript code ;).
    return ts.createSourceFile(fileName, template, ts.ScriptTarget.Latest, 
    /* setParentNodes */ false, ts.ScriptKind.JSX);
}

const TYPE_CHECK_ID_MAP = Symbol('TypeCheckId');
function getTypeCheckId$1(clazz) {
    const sf = clazz.getSourceFile();
    if (sf[TYPE_CHECK_ID_MAP] === undefined) {
        sf[TYPE_CHECK_ID_MAP] = new Map();
    }
    if (sf[TYPE_CHECK_ID_MAP].get(clazz) === undefined) {
        sf[TYPE_CHECK_ID_MAP].set(clazz, `tcb${sf[TYPE_CHECK_ID_MAP].size + 1}`);
    }
    return sf[TYPE_CHECK_ID_MAP].get(clazz);
}

const parseSpanComment = /^(\d+),(\d+)$/;
/**
 * Reads the trailing comments and finds the first match which is a span comment (i.e. 4,10) on a
 * node and returns it as an `AbsoluteSourceSpan`.
 *
 * Will return `null` if no trailing comments on the node match the expected form of a source span.
 */
function readSpanComment(node, sourceFile = node.getSourceFile()) {
    return (ts.forEachTrailingCommentRange(sourceFile.text, node.getEnd(), (pos, end, kind) => {
        if (kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
            return null;
        }
        const commentText = sourceFile.text.substring(pos + 2, end - 2);
        const match = commentText.match(parseSpanComment);
        if (match === null) {
            return null;
        }
        return new compiler.AbsoluteSourceSpan(+match[1], +match[2]);
    }) || null);
}
/** Used to identify what type the comment is. */
var CommentTriviaType;
(function (CommentTriviaType) {
    CommentTriviaType["DIAGNOSTIC"] = "D";
    CommentTriviaType["EXPRESSION_TYPE_IDENTIFIER"] = "T";
})(CommentTriviaType || (CommentTriviaType = {}));
/** Identifies what the TCB expression is for (for example, a directive declaration). */
var ExpressionIdentifier;
(function (ExpressionIdentifier) {
    ExpressionIdentifier["DIRECTIVE"] = "DIR";
    ExpressionIdentifier["COMPONENT_COMPLETION"] = "COMPCOMP";
    ExpressionIdentifier["EVENT_PARAMETER"] = "EP";
    ExpressionIdentifier["VARIABLE_AS_EXPRESSION"] = "VAE";
})(ExpressionIdentifier || (ExpressionIdentifier = {}));
/** Tags the node with the given expression identifier. */
function addExpressionIdentifier(node, identifier) {
    ts.addSyntheticTrailingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, `${CommentTriviaType.EXPRESSION_TYPE_IDENTIFIER}:${identifier}`, 
    /* hasTrailingNewLine */ false);
}
const IGNORE_FOR_DIAGNOSTICS_MARKER = `${CommentTriviaType.DIAGNOSTIC}:ignore`;
/**
 * Tag the `ts.Node` with an indication that any errors arising from the evaluation of the node
 * should be ignored.
 */
function markIgnoreDiagnostics(node) {
    ts.addSyntheticTrailingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, IGNORE_FOR_DIAGNOSTICS_MARKER, 
    /* hasTrailingNewLine */ false);
}
/** Returns true if the node has a marker that indicates diagnostics errors should be ignored.  */
function hasIgnoreForDiagnosticsMarker(node, sourceFile) {
    return (ts.forEachTrailingCommentRange(sourceFile.text, node.getEnd(), (pos, end, kind) => {
        if (kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
            return null;
        }
        const commentText = sourceFile.text.substring(pos + 2, end - 2);
        return commentText === IGNORE_FOR_DIAGNOSTICS_MARKER;
    }) === true);
}
function makeRecursiveVisitor(visitor) {
    function recursiveVisitor(node) {
        const res = visitor(node);
        return res !== null ? res : node.forEachChild(recursiveVisitor);
    }
    return recursiveVisitor;
}
function getSpanFromOptions(opts) {
    let withSpan = null;
    if (opts.withSpan !== undefined) {
        if (opts.withSpan instanceof compiler.AbsoluteSourceSpan) {
            withSpan = opts.withSpan;
        }
        else {
            withSpan = { start: opts.withSpan.start.offset, end: opts.withSpan.end.offset };
        }
    }
    return withSpan;
}
/**
 * Given a `ts.Node` with finds the first node whose matching the criteria specified
 * by the `FindOptions`.
 *
 * Returns `null` when no `ts.Node` matches the given conditions.
 */
function findFirstMatchingNode(tcb, opts) {
    const withSpan = getSpanFromOptions(opts);
    const withExpressionIdentifier = opts.withExpressionIdentifier;
    const sf = tcb.getSourceFile();
    const visitor = makeRecursiveVisitor((node) => {
        if (!opts.filter(node)) {
            return null;
        }
        if (withSpan !== null) {
            const comment = readSpanComment(node, sf);
            if (comment === null || withSpan.start !== comment.start || withSpan.end !== comment.end) {
                return null;
            }
        }
        if (withExpressionIdentifier !== undefined &&
            !hasExpressionIdentifier(sf, node, withExpressionIdentifier)) {
            return null;
        }
        return node;
    });
    return tcb.forEachChild(visitor) ?? null;
}
/**
 * Given a `ts.Node` with source span comments, finds the first node whose source span comment
 * matches the given `sourceSpan`. Additionally, the `filter` function allows matching only
 * `ts.Nodes` of a given type, which provides the ability to select only matches of a given type
 * when there may be more than one.
 *
 * Returns `null` when no `ts.Node` matches the given conditions.
 */
function findAllMatchingNodes(tcb, opts) {
    const withSpan = getSpanFromOptions(opts);
    const withExpressionIdentifier = opts.withExpressionIdentifier;
    const results = [];
    const stack = [tcb];
    const sf = tcb.getSourceFile();
    while (stack.length > 0) {
        const node = stack.pop();
        if (!opts.filter(node)) {
            stack.push(...node.getChildren());
            continue;
        }
        if (withSpan !== null) {
            const comment = readSpanComment(node, sf);
            if (comment === null || withSpan.start !== comment.start || withSpan.end !== comment.end) {
                stack.push(...node.getChildren());
                continue;
            }
        }
        if (withExpressionIdentifier !== undefined &&
            !hasExpressionIdentifier(sf, node, withExpressionIdentifier)) {
            continue;
        }
        results.push(node);
    }
    return results;
}
function hasExpressionIdentifier(sourceFile, node, identifier) {
    return (ts.forEachTrailingCommentRange(sourceFile.text, node.getEnd(), (pos, end, kind) => {
        if (kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
            return false;
        }
        const commentText = sourceFile.text.substring(pos + 2, end - 2);
        return commentText === `${CommentTriviaType.EXPRESSION_TYPE_IDENTIFIER}:${identifier}`;
    }) || false);
}

/**
 * Powers autocompletion for a specific component.
 *
 * Internally caches autocompletion results, and must be discarded if the component template or
 * surrounding TS program have changed.
 */
class CompletionEngine {
    tcb;
    data;
    tcbPath;
    tcbIsShim;
    componentContext;
    /**
     * Cache of completions for various levels of the template, including the root template (`null`).
     * Memoizes `getTemplateContextCompletions`.
     */
    templateContextCache = new Map();
    expressionCompletionCache = new Map();
    constructor(tcb, data, tcbPath, tcbIsShim) {
        this.tcb = tcb;
        this.data = data;
        this.tcbPath = tcbPath;
        this.tcbIsShim = tcbIsShim;
        // Find the component completion expression within the TCB. This looks like: `ctx. /* ... */;`
        const globalRead = findFirstMatchingNode(this.tcb, {
            filter: ts.isPropertyAccessExpression,
            withExpressionIdentifier: ExpressionIdentifier.COMPONENT_COMPLETION,
        });
        if (globalRead !== null) {
            this.componentContext = {
                tcbPath: this.tcbPath,
                isShimFile: this.tcbIsShim,
                // `globalRead.name` is an empty `ts.Identifier`, so its start position immediately follows
                // the `.` in `ctx.`. TS autocompletion APIs can then be used to access completion results
                // for the component context.
                positionInFile: globalRead.name.getStart(),
            };
        }
        else {
            this.componentContext = null;
        }
    }
    /**
     * Get global completions within the given template context and AST node.
     *
     * @param context the given template context - either a `TmplAstTemplate` embedded view, or `null`
     *     for the root
     * template context.
     * @param node the given AST node
     */
    getGlobalCompletions(context, node) {
        if (this.componentContext === null) {
            return null;
        }
        const templateContext = this.getTemplateContextCompletions(context);
        if (templateContext === null) {
            return null;
        }
        let nodeContext = null;
        if (node instanceof compiler.EmptyExpr) {
            const nodeLocation = findFirstMatchingNode(this.tcb, {
                filter: ts.isIdentifier,
                withSpan: node.sourceSpan,
            });
            if (nodeLocation !== null) {
                nodeContext = {
                    tcbPath: this.tcbPath,
                    isShimFile: this.tcbIsShim,
                    positionInFile: nodeLocation.getStart(),
                };
            }
        }
        if (node instanceof compiler.PropertyRead && node.receiver instanceof compiler.ImplicitReceiver) {
            const nodeLocation = findFirstMatchingNode(this.tcb, {
                filter: ts.isPropertyAccessExpression,
                withSpan: node.sourceSpan,
            });
            if (nodeLocation) {
                nodeContext = {
                    tcbPath: this.tcbPath,
                    isShimFile: this.tcbIsShim,
                    positionInFile: nodeLocation.getStart(),
                };
            }
        }
        return {
            componentContext: this.componentContext,
            templateContext,
            nodeContext,
        };
    }
    getExpressionCompletionLocation(expr) {
        if (this.expressionCompletionCache.has(expr)) {
            return this.expressionCompletionCache.get(expr);
        }
        // Completion works inside property reads and method calls.
        let tsExpr = null;
        if (expr instanceof compiler.PropertyRead || expr instanceof compiler.PropertyWrite) {
            // Non-safe navigation operations are trivial: `foo.bar` or `foo.bar()`
            tsExpr = findFirstMatchingNode(this.tcb, {
                filter: ts.isPropertyAccessExpression,
                withSpan: expr.nameSpan,
            });
        }
        else if (expr instanceof compiler.SafePropertyRead) {
            // Safe navigation operations are a little more complex, and involve a ternary. Completion
            // happens in the "true" case of the ternary.
            const ternaryExpr = findFirstMatchingNode(this.tcb, {
                filter: ts.isParenthesizedExpression,
                withSpan: expr.sourceSpan,
            });
            if (ternaryExpr === null || !ts.isConditionalExpression(ternaryExpr.expression)) {
                return null;
            }
            const whenTrue = ternaryExpr.expression.whenTrue;
            if (ts.isPropertyAccessExpression(whenTrue)) {
                tsExpr = whenTrue;
            }
            else if (ts.isCallExpression(whenTrue) &&
                ts.isPropertyAccessExpression(whenTrue.expression)) {
                tsExpr = whenTrue.expression;
            }
        }
        if (tsExpr === null) {
            return null;
        }
        const res = {
            tcbPath: this.tcbPath,
            isShimFile: this.tcbIsShim,
            positionInFile: tsExpr.name.getEnd(),
        };
        this.expressionCompletionCache.set(expr, res);
        return res;
    }
    getLiteralCompletionLocation(expr) {
        if (this.expressionCompletionCache.has(expr)) {
            return this.expressionCompletionCache.get(expr);
        }
        let tsExpr = null;
        if (expr instanceof compiler.TextAttribute) {
            const strNode = findFirstMatchingNode(this.tcb, {
                filter: ts.isParenthesizedExpression,
                withSpan: expr.sourceSpan,
            });
            if (strNode !== null && ts.isStringLiteral(strNode.expression)) {
                tsExpr = strNode.expression;
            }
        }
        else {
            tsExpr = findFirstMatchingNode(this.tcb, {
                filter: (n) => ts.isStringLiteral(n) || ts.isNumericLiteral(n),
                withSpan: expr.sourceSpan,
            });
        }
        if (tsExpr === null) {
            return null;
        }
        let positionInShimFile = tsExpr.getEnd();
        if (ts.isStringLiteral(tsExpr)) {
            // In the shimFile, if `tsExpr` is a string, the position should be in the quotes.
            positionInShimFile -= 1;
        }
        const res = {
            tcbPath: this.tcbPath,
            isShimFile: this.tcbIsShim,
            positionInFile: positionInShimFile,
        };
        this.expressionCompletionCache.set(expr, res);
        return res;
    }
    /**
     * Get global completions within the given template context - either a `TmplAstTemplate` embedded
     * view, or `null` for the root context.
     */
    getTemplateContextCompletions(context) {
        if (this.templateContextCache.has(context)) {
            return this.templateContextCache.get(context);
        }
        const templateContext = new Map();
        // The bound template already has details about the references and variables in scope in the
        // `context` template - they just need to be converted to `Completion`s.
        for (const node of this.data.boundTarget.getEntitiesInScope(context)) {
            if (node instanceof compiler.Reference) {
                templateContext.set(node.name, {
                    kind: CompletionKind.Reference,
                    node,
                });
            }
            else if (node instanceof compiler.LetDeclaration) {
                templateContext.set(node.name, {
                    kind: CompletionKind.LetDeclaration,
                    node,
                });
            }
            else {
                templateContext.set(node.name, {
                    kind: CompletionKind.Variable,
                    node,
                });
            }
        }
        this.templateContextCache.set(context, templateContext);
        return templateContext;
    }
}

const comma = ','.charCodeAt(0);
const semicolon = ';'.charCodeAt(0);
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const intToChar = new Uint8Array(64); // 64 possible chars.
const charToInt = new Uint8Array(128); // z is 122 in ASCII
for (let i = 0; i < chars.length; i++) {
    const c = chars.charCodeAt(i);
    intToChar[i] = c;
    charToInt[c] = i;
}
function encodeInteger(builder, num, relative) {
    let delta = num - relative;
    delta = delta < 0 ? (-delta << 1) | 1 : delta << 1;
    do {
        let clamped = delta & 0b011111;
        delta >>>= 5;
        if (delta > 0)
            clamped |= 0b100000;
        builder.write(intToChar[clamped]);
    } while (delta > 0);
    return num;
}

const bufLength = 1024 * 16;
// Provide a fallback for older environments.
const td = typeof TextDecoder !== 'undefined'
    ? /* #__PURE__ */ new TextDecoder()
    : typeof Buffer !== 'undefined'
        ? {
            decode(buf) {
                const out = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
                return out.toString();
            },
        }
        : {
            decode(buf) {
                let out = '';
                for (let i = 0; i < buf.length; i++) {
                    out += String.fromCharCode(buf[i]);
                }
                return out;
            },
        };
class StringWriter {
    constructor() {
        this.pos = 0;
        this.out = '';
        this.buffer = new Uint8Array(bufLength);
    }
    write(v) {
        const { buffer } = this;
        buffer[this.pos++] = v;
        if (this.pos === bufLength) {
            this.out += td.decode(buffer);
            this.pos = 0;
        }
    }
    flush() {
        const { buffer, out, pos } = this;
        return pos > 0 ? out + td.decode(buffer.subarray(0, pos)) : out;
    }
}
function encode(decoded) {
    const writer = new StringWriter();
    let sourcesIndex = 0;
    let sourceLine = 0;
    let sourceColumn = 0;
    let namesIndex = 0;
    for (let i = 0; i < decoded.length; i++) {
        const line = decoded[i];
        if (i > 0)
            writer.write(semicolon);
        if (line.length === 0)
            continue;
        let genColumn = 0;
        for (let j = 0; j < line.length; j++) {
            const segment = line[j];
            if (j > 0)
                writer.write(comma);
            genColumn = encodeInteger(writer, segment[0], genColumn);
            if (segment.length === 1)
                continue;
            sourcesIndex = encodeInteger(writer, segment[1], sourcesIndex);
            sourceLine = encodeInteger(writer, segment[2], sourceLine);
            sourceColumn = encodeInteger(writer, segment[3], sourceColumn);
            if (segment.length === 4)
                continue;
            namesIndex = encodeInteger(writer, segment[4], namesIndex);
        }
    }
    return writer.flush();
}

class BitSet {
	constructor(arg) {
		this.bits = arg instanceof BitSet ? arg.bits.slice() : [];
	}

	add(n) {
		this.bits[n >> 5] |= 1 << (n & 31);
	}

	has(n) {
		return !!(this.bits[n >> 5] & (1 << (n & 31)));
	}
}

class Chunk {
	constructor(start, end, content) {
		this.start = start;
		this.end = end;
		this.original = content;

		this.intro = '';
		this.outro = '';

		this.content = content;
		this.storeName = false;
		this.edited = false;

		{
			this.previous = null;
			this.next = null;
		}
	}

	appendLeft(content) {
		this.outro += content;
	}

	appendRight(content) {
		this.intro = this.intro + content;
	}

	clone() {
		const chunk = new Chunk(this.start, this.end, this.original);

		chunk.intro = this.intro;
		chunk.outro = this.outro;
		chunk.content = this.content;
		chunk.storeName = this.storeName;
		chunk.edited = this.edited;

		return chunk;
	}

	contains(index) {
		return this.start < index && index < this.end;
	}

	eachNext(fn) {
		let chunk = this;
		while (chunk) {
			fn(chunk);
			chunk = chunk.next;
		}
	}

	eachPrevious(fn) {
		let chunk = this;
		while (chunk) {
			fn(chunk);
			chunk = chunk.previous;
		}
	}

	edit(content, storeName, contentOnly) {
		this.content = content;
		if (!contentOnly) {
			this.intro = '';
			this.outro = '';
		}
		this.storeName = storeName;

		this.edited = true;

		return this;
	}

	prependLeft(content) {
		this.outro = content + this.outro;
	}

	prependRight(content) {
		this.intro = content + this.intro;
	}

	reset() {
		this.intro = '';
		this.outro = '';
		if (this.edited) {
			this.content = this.original;
			this.storeName = false;
			this.edited = false;
		}
	}

	split(index) {
		const sliceIndex = index - this.start;

		const originalBefore = this.original.slice(0, sliceIndex);
		const originalAfter = this.original.slice(sliceIndex);

		this.original = originalBefore;

		const newChunk = new Chunk(index, this.end, originalAfter);
		newChunk.outro = this.outro;
		this.outro = '';

		this.end = index;

		if (this.edited) {
			// after split we should save the edit content record into the correct chunk
			// to make sure sourcemap correct
			// For example:
			// '  test'.trim()
			//     split   -> '  ' + 'test'
			//   ✔️ edit    -> '' + 'test'
			//   ✖️ edit    -> 'test' + ''
			// TODO is this block necessary?...
			newChunk.edit('', false);
			this.content = '';
		} else {
			this.content = originalBefore;
		}

		newChunk.next = this.next;
		if (newChunk.next) newChunk.next.previous = newChunk;
		newChunk.previous = this;
		this.next = newChunk;

		return newChunk;
	}

	toString() {
		return this.intro + this.content + this.outro;
	}

	trimEnd(rx) {
		this.outro = this.outro.replace(rx, '');
		if (this.outro.length) return true;

		const trimmed = this.content.replace(rx, '');

		if (trimmed.length) {
			if (trimmed !== this.content) {
				this.split(this.start + trimmed.length).edit('', undefined, true);
				if (this.edited) {
					// save the change, if it has been edited
					this.edit(trimmed, this.storeName, true);
				}
			}
			return true;
		} else {
			this.edit('', undefined, true);

			this.intro = this.intro.replace(rx, '');
			if (this.intro.length) return true;
		}
	}

	trimStart(rx) {
		this.intro = this.intro.replace(rx, '');
		if (this.intro.length) return true;

		const trimmed = this.content.replace(rx, '');

		if (trimmed.length) {
			if (trimmed !== this.content) {
				const newChunk = this.split(this.end - trimmed.length);
				if (this.edited) {
					// save the change, if it has been edited
					newChunk.edit(trimmed, this.storeName, true);
				}
				this.edit('', undefined, true);
			}
			return true;
		} else {
			this.edit('', undefined, true);

			this.outro = this.outro.replace(rx, '');
			if (this.outro.length) return true;
		}
	}
}

function getBtoa() {
	if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
		return (str) => globalThis.btoa(unescape(encodeURIComponent(str)));
	} else if (typeof Buffer === 'function') {
		return (str) => Buffer.from(str, 'utf-8').toString('base64');
	} else {
		return () => {
			throw new Error('Unsupported environment: `window.btoa` or `Buffer` should be supported.');
		};
	}
}

const btoa = /*#__PURE__*/ getBtoa();

class SourceMap {
	constructor(properties) {
		this.version = 3;
		this.file = properties.file;
		this.sources = properties.sources;
		this.sourcesContent = properties.sourcesContent;
		this.names = properties.names;
		this.mappings = encode(properties.mappings);
		if (typeof properties.x_google_ignoreList !== 'undefined') {
			this.x_google_ignoreList = properties.x_google_ignoreList;
		}
		if (typeof properties.debugId !== 'undefined') {
			this.debugId = properties.debugId;
		}
	}

	toString() {
		return JSON.stringify(this);
	}

	toUrl() {
		return 'data:application/json;charset=utf-8;base64,' + btoa(this.toString());
	}
}

function guessIndent(code) {
	const lines = code.split('\n');

	const tabbed = lines.filter((line) => /^\t+/.test(line));
	const spaced = lines.filter((line) => /^ {2,}/.test(line));

	if (tabbed.length === 0 && spaced.length === 0) {
		return null;
	}

	// More lines tabbed than spaced? Assume tabs, and
	// default to tabs in the case of a tie (or nothing
	// to go on)
	if (tabbed.length >= spaced.length) {
		return '\t';
	}

	// Otherwise, we need to guess the multiple
	const min = spaced.reduce((previous, current) => {
		const numSpaces = /^ +/.exec(current)[0].length;
		return Math.min(numSpaces, previous);
	}, Infinity);

	return new Array(min + 1).join(' ');
}

function getRelativePath(from, to) {
	const fromParts = from.split(/[/\\]/);
	const toParts = to.split(/[/\\]/);

	fromParts.pop(); // get dirname

	while (fromParts[0] === toParts[0]) {
		fromParts.shift();
		toParts.shift();
	}

	if (fromParts.length) {
		let i = fromParts.length;
		while (i--) fromParts[i] = '..';
	}

	return fromParts.concat(toParts).join('/');
}

const toString = Object.prototype.toString;

function isObject(thing) {
	return toString.call(thing) === '[object Object]';
}

function getLocator(source) {
	const originalLines = source.split('\n');
	const lineOffsets = [];

	for (let i = 0, pos = 0; i < originalLines.length; i++) {
		lineOffsets.push(pos);
		pos += originalLines[i].length + 1;
	}

	return function locate(index) {
		let i = 0;
		let j = lineOffsets.length;
		while (i < j) {
			const m = (i + j) >> 1;
			if (index < lineOffsets[m]) {
				j = m;
			} else {
				i = m + 1;
			}
		}
		const line = i - 1;
		const column = index - lineOffsets[line];
		return { line, column };
	};
}

const wordRegex = /\w/;

class Mappings {
	constructor(hires) {
		this.hires = hires;
		this.generatedCodeLine = 0;
		this.generatedCodeColumn = 0;
		this.raw = [];
		this.rawSegments = this.raw[this.generatedCodeLine] = [];
		this.pending = null;
	}

	addEdit(sourceIndex, content, loc, nameIndex) {
		if (content.length) {
			const contentLengthMinusOne = content.length - 1;
			let contentLineEnd = content.indexOf('\n', 0);
			let previousContentLineEnd = -1;
			// Loop through each line in the content and add a segment, but stop if the last line is empty,
			// else code afterwards would fill one line too many
			while (contentLineEnd >= 0 && contentLengthMinusOne > contentLineEnd) {
				const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
				if (nameIndex >= 0) {
					segment.push(nameIndex);
				}
				this.rawSegments.push(segment);

				this.generatedCodeLine += 1;
				this.raw[this.generatedCodeLine] = this.rawSegments = [];
				this.generatedCodeColumn = 0;

				previousContentLineEnd = contentLineEnd;
				contentLineEnd = content.indexOf('\n', contentLineEnd + 1);
			}

			const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
			if (nameIndex >= 0) {
				segment.push(nameIndex);
			}
			this.rawSegments.push(segment);

			this.advance(content.slice(previousContentLineEnd + 1));
		} else if (this.pending) {
			this.rawSegments.push(this.pending);
			this.advance(content);
		}

		this.pending = null;
	}

	addUneditedChunk(sourceIndex, chunk, original, loc, sourcemapLocations) {
		let originalCharIndex = chunk.start;
		let first = true;
		// when iterating each char, check if it's in a word boundary
		let charInHiresBoundary = false;

		while (originalCharIndex < chunk.end) {
			if (original[originalCharIndex] === '\n') {
				loc.line += 1;
				loc.column = 0;
				this.generatedCodeLine += 1;
				this.raw[this.generatedCodeLine] = this.rawSegments = [];
				this.generatedCodeColumn = 0;
				first = true;
				charInHiresBoundary = false;
			} else {
				if (this.hires || first || sourcemapLocations.has(originalCharIndex)) {
					const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];

					if (this.hires === 'boundary') {
						// in hires "boundary", group segments per word boundary than per char
						if (wordRegex.test(original[originalCharIndex])) {
							// for first char in the boundary found, start the boundary by pushing a segment
							if (!charInHiresBoundary) {
								this.rawSegments.push(segment);
								charInHiresBoundary = true;
							}
						} else {
							// for non-word char, end the boundary by pushing a segment
							this.rawSegments.push(segment);
							charInHiresBoundary = false;
						}
					} else {
						this.rawSegments.push(segment);
					}
				}

				loc.column += 1;
				this.generatedCodeColumn += 1;
				first = false;
			}

			originalCharIndex += 1;
		}

		this.pending = null;
	}

	advance(str) {
		if (!str) return;

		const lines = str.split('\n');

		if (lines.length > 1) {
			for (let i = 0; i < lines.length - 1; i++) {
				this.generatedCodeLine++;
				this.raw[this.generatedCodeLine] = this.rawSegments = [];
			}
			this.generatedCodeColumn = 0;
		}

		this.generatedCodeColumn += lines[lines.length - 1].length;
	}
}

const n = '\n';

const warned = {
	insertLeft: false,
	insertRight: false,
	storeName: false,
};

class MagicString {
	constructor(string, options = {}) {
		const chunk = new Chunk(0, string.length, string);

		Object.defineProperties(this, {
			original: { writable: true, value: string },
			outro: { writable: true, value: '' },
			intro: { writable: true, value: '' },
			firstChunk: { writable: true, value: chunk },
			lastChunk: { writable: true, value: chunk },
			lastSearchedChunk: { writable: true, value: chunk },
			byStart: { writable: true, value: {} },
			byEnd: { writable: true, value: {} },
			filename: { writable: true, value: options.filename },
			indentExclusionRanges: { writable: true, value: options.indentExclusionRanges },
			sourcemapLocations: { writable: true, value: new BitSet() },
			storedNames: { writable: true, value: {} },
			indentStr: { writable: true, value: undefined },
			ignoreList: { writable: true, value: options.ignoreList },
			offset: { writable: true, value: options.offset || 0 },
		});

		this.byStart[0] = chunk;
		this.byEnd[string.length] = chunk;
	}

	addSourcemapLocation(char) {
		this.sourcemapLocations.add(char);
	}

	append(content) {
		if (typeof content !== 'string') throw new TypeError('outro content must be a string');

		this.outro += content;
		return this;
	}

	appendLeft(index, content) {
		index = index + this.offset;

		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byEnd[index];

		if (chunk) {
			chunk.appendLeft(content);
		} else {
			this.intro += content;
		}
		return this;
	}

	appendRight(index, content) {
		index = index + this.offset;

		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byStart[index];

		if (chunk) {
			chunk.appendRight(content);
		} else {
			this.outro += content;
		}
		return this;
	}

	clone() {
		const cloned = new MagicString(this.original, { filename: this.filename, offset: this.offset });

		let originalChunk = this.firstChunk;
		let clonedChunk = (cloned.firstChunk = cloned.lastSearchedChunk = originalChunk.clone());

		while (originalChunk) {
			cloned.byStart[clonedChunk.start] = clonedChunk;
			cloned.byEnd[clonedChunk.end] = clonedChunk;

			const nextOriginalChunk = originalChunk.next;
			const nextClonedChunk = nextOriginalChunk && nextOriginalChunk.clone();

			if (nextClonedChunk) {
				clonedChunk.next = nextClonedChunk;
				nextClonedChunk.previous = clonedChunk;

				clonedChunk = nextClonedChunk;
			}

			originalChunk = nextOriginalChunk;
		}

		cloned.lastChunk = clonedChunk;

		if (this.indentExclusionRanges) {
			cloned.indentExclusionRanges = this.indentExclusionRanges.slice();
		}

		cloned.sourcemapLocations = new BitSet(this.sourcemapLocations);

		cloned.intro = this.intro;
		cloned.outro = this.outro;

		return cloned;
	}

	generateDecodedMap(options) {
		options = options || {};

		const sourceIndex = 0;
		const names = Object.keys(this.storedNames);
		const mappings = new Mappings(options.hires);

		const locate = getLocator(this.original);

		if (this.intro) {
			mappings.advance(this.intro);
		}

		this.firstChunk.eachNext((chunk) => {
			const loc = locate(chunk.start);

			if (chunk.intro.length) mappings.advance(chunk.intro);

			if (chunk.edited) {
				mappings.addEdit(
					sourceIndex,
					chunk.content,
					loc,
					chunk.storeName ? names.indexOf(chunk.original) : -1,
				);
			} else {
				mappings.addUneditedChunk(sourceIndex, chunk, this.original, loc, this.sourcemapLocations);
			}

			if (chunk.outro.length) mappings.advance(chunk.outro);
		});

		return {
			file: options.file ? options.file.split(/[/\\]/).pop() : undefined,
			sources: [
				options.source ? getRelativePath(options.file || '', options.source) : options.file || '',
			],
			sourcesContent: options.includeContent ? [this.original] : undefined,
			names,
			mappings: mappings.raw,
			x_google_ignoreList: this.ignoreList ? [sourceIndex] : undefined,
		};
	}

	generateMap(options) {
		return new SourceMap(this.generateDecodedMap(options));
	}

	_ensureindentStr() {
		if (this.indentStr === undefined) {
			this.indentStr = guessIndent(this.original);
		}
	}

	_getRawIndentString() {
		this._ensureindentStr();
		return this.indentStr;
	}

	getIndentString() {
		this._ensureindentStr();
		return this.indentStr === null ? '\t' : this.indentStr;
	}

	indent(indentStr, options) {
		const pattern = /^[^\r\n]/gm;

		if (isObject(indentStr)) {
			options = indentStr;
			indentStr = undefined;
		}

		if (indentStr === undefined) {
			this._ensureindentStr();
			indentStr = this.indentStr || '\t';
		}

		if (indentStr === '') return this; // noop

		options = options || {};

		// Process exclusion ranges
		const isExcluded = {};

		if (options.exclude) {
			const exclusions =
				typeof options.exclude[0] === 'number' ? [options.exclude] : options.exclude;
			exclusions.forEach((exclusion) => {
				for (let i = exclusion[0]; i < exclusion[1]; i += 1) {
					isExcluded[i] = true;
				}
			});
		}

		let shouldIndentNextCharacter = options.indentStart !== false;
		const replacer = (match) => {
			if (shouldIndentNextCharacter) return `${indentStr}${match}`;
			shouldIndentNextCharacter = true;
			return match;
		};

		this.intro = this.intro.replace(pattern, replacer);

		let charIndex = 0;
		let chunk = this.firstChunk;

		while (chunk) {
			const end = chunk.end;

			if (chunk.edited) {
				if (!isExcluded[charIndex]) {
					chunk.content = chunk.content.replace(pattern, replacer);

					if (chunk.content.length) {
						shouldIndentNextCharacter = chunk.content[chunk.content.length - 1] === '\n';
					}
				}
			} else {
				charIndex = chunk.start;

				while (charIndex < end) {
					if (!isExcluded[charIndex]) {
						const char = this.original[charIndex];

						if (char === '\n') {
							shouldIndentNextCharacter = true;
						} else if (char !== '\r' && shouldIndentNextCharacter) {
							shouldIndentNextCharacter = false;

							if (charIndex === chunk.start) {
								chunk.prependRight(indentStr);
							} else {
								this._splitChunk(chunk, charIndex);
								chunk = chunk.next;
								chunk.prependRight(indentStr);
							}
						}
					}

					charIndex += 1;
				}
			}

			charIndex = chunk.end;
			chunk = chunk.next;
		}

		this.outro = this.outro.replace(pattern, replacer);

		return this;
	}

	insert() {
		throw new Error(
			'magicString.insert(...) is deprecated. Use prependRight(...) or appendLeft(...)',
		);
	}

	insertLeft(index, content) {
		if (!warned.insertLeft) {
			console.warn(
				'magicString.insertLeft(...) is deprecated. Use magicString.appendLeft(...) instead',
			);
			warned.insertLeft = true;
		}

		return this.appendLeft(index, content);
	}

	insertRight(index, content) {
		if (!warned.insertRight) {
			console.warn(
				'magicString.insertRight(...) is deprecated. Use magicString.prependRight(...) instead',
			);
			warned.insertRight = true;
		}

		return this.prependRight(index, content);
	}

	move(start, end, index) {
		start = start + this.offset;
		end = end + this.offset;
		index = index + this.offset;

		if (index >= start && index <= end) throw new Error('Cannot move a selection inside itself');

		this._split(start);
		this._split(end);
		this._split(index);

		const first = this.byStart[start];
		const last = this.byEnd[end];

		const oldLeft = first.previous;
		const oldRight = last.next;

		const newRight = this.byStart[index];
		if (!newRight && last === this.lastChunk) return this;
		const newLeft = newRight ? newRight.previous : this.lastChunk;

		if (oldLeft) oldLeft.next = oldRight;
		if (oldRight) oldRight.previous = oldLeft;

		if (newLeft) newLeft.next = first;
		if (newRight) newRight.previous = last;

		if (!first.previous) this.firstChunk = last.next;
		if (!last.next) {
			this.lastChunk = first.previous;
			this.lastChunk.next = null;
		}

		first.previous = newLeft;
		last.next = newRight || null;

		if (!newLeft) this.firstChunk = first;
		if (!newRight) this.lastChunk = last;
		return this;
	}

	overwrite(start, end, content, options) {
		options = options || {};
		return this.update(start, end, content, { ...options, overwrite: !options.contentOnly });
	}

	update(start, end, content, options) {
		start = start + this.offset;
		end = end + this.offset;

		if (typeof content !== 'string') throw new TypeError('replacement content must be a string');

		if (this.original.length !== 0) {
			while (start < 0) start += this.original.length;
			while (end < 0) end += this.original.length;
		}

		if (end > this.original.length) throw new Error('end is out of bounds');
		if (start === end)
			throw new Error(
				'Cannot overwrite a zero-length range – use appendLeft or prependRight instead',
			);

		this._split(start);
		this._split(end);

		if (options === true) {
			if (!warned.storeName) {
				console.warn(
					'The final argument to magicString.overwrite(...) should be an options object. See https://github.com/rich-harris/magic-string',
				);
				warned.storeName = true;
			}

			options = { storeName: true };
		}
		const storeName = options !== undefined ? options.storeName : false;
		const overwrite = options !== undefined ? options.overwrite : false;

		if (storeName) {
			const original = this.original.slice(start, end);
			Object.defineProperty(this.storedNames, original, {
				writable: true,
				value: true,
				enumerable: true,
			});
		}

		const first = this.byStart[start];
		const last = this.byEnd[end];

		if (first) {
			let chunk = first;
			while (chunk !== last) {
				if (chunk.next !== this.byStart[chunk.end]) {
					throw new Error('Cannot overwrite across a split point');
				}
				chunk = chunk.next;
				chunk.edit('', false);
			}

			first.edit(content, storeName, !overwrite);
		} else {
			// must be inserting at the end
			const newChunk = new Chunk(start, end, '').edit(content, storeName);

			// TODO last chunk in the array may not be the last chunk, if it's moved...
			last.next = newChunk;
			newChunk.previous = last;
		}
		return this;
	}

	prepend(content) {
		if (typeof content !== 'string') throw new TypeError('outro content must be a string');

		this.intro = content + this.intro;
		return this;
	}

	prependLeft(index, content) {
		index = index + this.offset;

		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byEnd[index];

		if (chunk) {
			chunk.prependLeft(content);
		} else {
			this.intro = content + this.intro;
		}
		return this;
	}

	prependRight(index, content) {
		index = index + this.offset;

		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byStart[index];

		if (chunk) {
			chunk.prependRight(content);
		} else {
			this.outro = content + this.outro;
		}
		return this;
	}

	remove(start, end) {
		start = start + this.offset;
		end = end + this.offset;

		if (this.original.length !== 0) {
			while (start < 0) start += this.original.length;
			while (end < 0) end += this.original.length;
		}

		if (start === end) return this;

		if (start < 0 || end > this.original.length) throw new Error('Character is out of bounds');
		if (start > end) throw new Error('end must be greater than start');

		this._split(start);
		this._split(end);

		let chunk = this.byStart[start];

		while (chunk) {
			chunk.intro = '';
			chunk.outro = '';
			chunk.edit('');

			chunk = end > chunk.end ? this.byStart[chunk.end] : null;
		}
		return this;
	}

	reset(start, end) {
		start = start + this.offset;
		end = end + this.offset;

		if (this.original.length !== 0) {
			while (start < 0) start += this.original.length;
			while (end < 0) end += this.original.length;
		}

		if (start === end) return this;

		if (start < 0 || end > this.original.length) throw new Error('Character is out of bounds');
		if (start > end) throw new Error('end must be greater than start');

		this._split(start);
		this._split(end);

		let chunk = this.byStart[start];

		while (chunk) {
			chunk.reset();

			chunk = end > chunk.end ? this.byStart[chunk.end] : null;
		}
		return this;
	}

	lastChar() {
		if (this.outro.length) return this.outro[this.outro.length - 1];
		let chunk = this.lastChunk;
		do {
			if (chunk.outro.length) return chunk.outro[chunk.outro.length - 1];
			if (chunk.content.length) return chunk.content[chunk.content.length - 1];
			if (chunk.intro.length) return chunk.intro[chunk.intro.length - 1];
		} while ((chunk = chunk.previous));
		if (this.intro.length) return this.intro[this.intro.length - 1];
		return '';
	}

	lastLine() {
		let lineIndex = this.outro.lastIndexOf(n);
		if (lineIndex !== -1) return this.outro.substr(lineIndex + 1);
		let lineStr = this.outro;
		let chunk = this.lastChunk;
		do {
			if (chunk.outro.length > 0) {
				lineIndex = chunk.outro.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.outro.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.outro + lineStr;
			}

			if (chunk.content.length > 0) {
				lineIndex = chunk.content.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.content.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.content + lineStr;
			}

			if (chunk.intro.length > 0) {
				lineIndex = chunk.intro.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.intro.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.intro + lineStr;
			}
		} while ((chunk = chunk.previous));
		lineIndex = this.intro.lastIndexOf(n);
		if (lineIndex !== -1) return this.intro.substr(lineIndex + 1) + lineStr;
		return this.intro + lineStr;
	}

	slice(start = 0, end = this.original.length - this.offset) {
		start = start + this.offset;
		end = end + this.offset;

		if (this.original.length !== 0) {
			while (start < 0) start += this.original.length;
			while (end < 0) end += this.original.length;
		}

		let result = '';

		// find start chunk
		let chunk = this.firstChunk;
		while (chunk && (chunk.start > start || chunk.end <= start)) {
			// found end chunk before start
			if (chunk.start < end && chunk.end >= end) {
				return result;
			}

			chunk = chunk.next;
		}

		if (chunk && chunk.edited && chunk.start !== start)
			throw new Error(`Cannot use replaced character ${start} as slice start anchor.`);

		const startChunk = chunk;
		while (chunk) {
			if (chunk.intro && (startChunk !== chunk || chunk.start === start)) {
				result += chunk.intro;
			}

			const containsEnd = chunk.start < end && chunk.end >= end;
			if (containsEnd && chunk.edited && chunk.end !== end)
				throw new Error(`Cannot use replaced character ${end} as slice end anchor.`);

			const sliceStart = startChunk === chunk ? start - chunk.start : 0;
			const sliceEnd = containsEnd ? chunk.content.length + end - chunk.end : chunk.content.length;

			result += chunk.content.slice(sliceStart, sliceEnd);

			if (chunk.outro && (!containsEnd || chunk.end === end)) {
				result += chunk.outro;
			}

			if (containsEnd) {
				break;
			}

			chunk = chunk.next;
		}

		return result;
	}

	// TODO deprecate this? not really very useful
	snip(start, end) {
		const clone = this.clone();
		clone.remove(0, start);
		clone.remove(end, clone.original.length);

		return clone;
	}

	_split(index) {
		if (this.byStart[index] || this.byEnd[index]) return;

		let chunk = this.lastSearchedChunk;
		const searchForward = index > chunk.end;

		while (chunk) {
			if (chunk.contains(index)) return this._splitChunk(chunk, index);

			chunk = searchForward ? this.byStart[chunk.end] : this.byEnd[chunk.start];
		}
	}

	_splitChunk(chunk, index) {
		if (chunk.edited && chunk.content.length) {
			// zero-length edited chunks are a special case (overlapping replacements)
			const loc = getLocator(this.original)(index);
			throw new Error(
				`Cannot split a chunk that has already been edited (${loc.line}:${loc.column} – "${chunk.original}")`,
			);
		}

		const newChunk = chunk.split(index);

		this.byEnd[index] = chunk;
		this.byStart[index] = newChunk;
		this.byEnd[newChunk.end] = newChunk;

		if (chunk === this.lastChunk) this.lastChunk = newChunk;

		this.lastSearchedChunk = chunk;
		return true;
	}

	toString() {
		let str = this.intro;

		let chunk = this.firstChunk;
		while (chunk) {
			str += chunk.toString();
			chunk = chunk.next;
		}

		return str + this.outro;
	}

	isEmpty() {
		let chunk = this.firstChunk;
		do {
			if (
				(chunk.intro.length && chunk.intro.trim()) ||
				(chunk.content.length && chunk.content.trim()) ||
				(chunk.outro.length && chunk.outro.trim())
			)
				return false;
		} while ((chunk = chunk.next));
		return true;
	}

	length() {
		let chunk = this.firstChunk;
		let length = 0;
		do {
			length += chunk.intro.length + chunk.content.length + chunk.outro.length;
		} while ((chunk = chunk.next));
		return length;
	}

	trimLines() {
		return this.trim('[\\r\\n]');
	}

	trim(charType) {
		return this.trimStart(charType).trimEnd(charType);
	}

	trimEndAborted(charType) {
		const rx = new RegExp((charType || '\\s') + '+$');

		this.outro = this.outro.replace(rx, '');
		if (this.outro.length) return true;

		let chunk = this.lastChunk;

		do {
			const end = chunk.end;
			const aborted = chunk.trimEnd(rx);

			// if chunk was trimmed, we have a new lastChunk
			if (chunk.end !== end) {
				if (this.lastChunk === chunk) {
					this.lastChunk = chunk.next;
				}

				this.byEnd[chunk.end] = chunk;
				this.byStart[chunk.next.start] = chunk.next;
				this.byEnd[chunk.next.end] = chunk.next;
			}

			if (aborted) return true;
			chunk = chunk.previous;
		} while (chunk);

		return false;
	}

	trimEnd(charType) {
		this.trimEndAborted(charType);
		return this;
	}
	trimStartAborted(charType) {
		const rx = new RegExp('^' + (charType || '\\s') + '+');

		this.intro = this.intro.replace(rx, '');
		if (this.intro.length) return true;

		let chunk = this.firstChunk;

		do {
			const end = chunk.end;
			const aborted = chunk.trimStart(rx);

			if (chunk.end !== end) {
				// special case...
				if (chunk === this.lastChunk) this.lastChunk = chunk.next;

				this.byEnd[chunk.end] = chunk;
				this.byStart[chunk.next.start] = chunk.next;
				this.byEnd[chunk.next.end] = chunk.next;
			}

			if (aborted) return true;
			chunk = chunk.next;
		} while (chunk);

		return false;
	}

	trimStart(charType) {
		this.trimStartAborted(charType);
		return this;
	}

	hasChanged() {
		return this.original !== this.toString();
	}

	_replaceRegexp(searchValue, replacement) {
		function getReplacement(match, str) {
			if (typeof replacement === 'string') {
				return replacement.replace(/\$(\$|&|\d+)/g, (_, i) => {
					// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
					if (i === '$') return '$';
					if (i === '&') return match[0];
					const num = +i;
					if (num < match.length) return match[+i];
					return `$${i}`;
				});
			} else {
				return replacement(...match, match.index, str, match.groups);
			}
		}
		function matchAll(re, str) {
			let match;
			const matches = [];
			while ((match = re.exec(str))) {
				matches.push(match);
			}
			return matches;
		}
		if (searchValue.global) {
			const matches = matchAll(searchValue, this.original);
			matches.forEach((match) => {
				if (match.index != null) {
					const replacement = getReplacement(match, this.original);
					if (replacement !== match[0]) {
						this.overwrite(match.index, match.index + match[0].length, replacement);
					}
				}
			});
		} else {
			const match = this.original.match(searchValue);
			if (match && match.index != null) {
				const replacement = getReplacement(match, this.original);
				if (replacement !== match[0]) {
					this.overwrite(match.index, match.index + match[0].length, replacement);
				}
			}
		}
		return this;
	}

	_replaceString(string, replacement) {
		const { original } = this;
		const index = original.indexOf(string);

		if (index !== -1) {
			this.overwrite(index, index + string.length, replacement);
		}

		return this;
	}

	replace(searchValue, replacement) {
		if (typeof searchValue === 'string') {
			return this._replaceString(searchValue, replacement);
		}

		return this._replaceRegexp(searchValue, replacement);
	}

	_replaceAllString(string, replacement) {
		const { original } = this;
		const stringLength = string.length;
		for (
			let index = original.indexOf(string);
			index !== -1;
			index = original.indexOf(string, index + stringLength)
		) {
			const previous = original.slice(index, index + stringLength);
			if (previous !== replacement) this.overwrite(index, index + stringLength, replacement);
		}

		return this;
	}

	replaceAll(searchValue, replacement) {
		if (typeof searchValue === 'string') {
			return this._replaceAllString(searchValue, replacement);
		}

		if (!searchValue.global) {
			throw new TypeError(
				'MagicString.prototype.replaceAll called with a non-global RegExp argument',
			);
		}

		return this._replaceRegexp(searchValue, replacement);
	}
}

const REGISTRY$1 = new compiler.DomElementSchemaRegistry();
const REMOVE_XHTML_REGEX = /^:xhtml:/;
/**
 * Checks non-Angular elements and properties against the `DomElementSchemaRegistry`, a schema
 * maintained by the Angular team via extraction from a browser IDL.
 */
class RegistryDomSchemaChecker {
    resolver;
    _diagnostics = [];
    get diagnostics() {
        return this._diagnostics;
    }
    constructor(resolver) {
        this.resolver = resolver;
    }
    checkElement(id, tagName, sourceSpanForDiagnostics, schemas, hostIsStandalone) {
        // HTML elements inside an SVG `foreignObject` are declared in the `xhtml` namespace.
        // We need to strip it before handing it over to the registry because all HTML tag names
        // in the registry are without a namespace.
        const name = tagName.replace(REMOVE_XHTML_REGEX, '');
        if (!REGISTRY$1.hasElement(name, schemas)) {
            const mapping = this.resolver.getTemplateSourceMapping(id);
            const schemas = `'${hostIsStandalone ? '@Component' : '@NgModule'}.schemas'`;
            let errorMsg = `'${name}' is not a known element:\n`;
            errorMsg += `1. If '${name}' is an Angular component, then verify that it is ${hostIsStandalone
                ? "included in the '@Component.imports' of this component"
                : 'part of this module'}.\n`;
            if (name.indexOf('-') > -1) {
                errorMsg += `2. If '${name}' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the ${schemas} of this component to suppress this message.`;
            }
            else {
                errorMsg += `2. To allow any element add 'NO_ERRORS_SCHEMA' to the ${schemas} of this component.`;
            }
            const diag = makeTemplateDiagnostic(id, mapping, sourceSpanForDiagnostics, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.SCHEMA_INVALID_ELEMENT), errorMsg);
            this._diagnostics.push(diag);
        }
    }
    checkTemplateElementProperty(id, tagName, name, span, schemas, hostIsStandalone) {
        if (!REGISTRY$1.hasProperty(tagName, name, schemas)) {
            const mapping = this.resolver.getTemplateSourceMapping(id);
            const decorator = hostIsStandalone ? '@Component' : '@NgModule';
            const schemas = `'${decorator}.schemas'`;
            let errorMsg = `Can't bind to '${name}' since it isn't a known property of '${tagName}'.`;
            if (tagName.startsWith('ng-')) {
                errorMsg +=
                    `\n1. If '${name}' is an Angular directive, then add 'CommonModule' to the '${decorator}.imports' of this component.` +
                        `\n2. To allow any property add 'NO_ERRORS_SCHEMA' to the ${schemas} of this component.`;
            }
            else if (tagName.indexOf('-') > -1) {
                errorMsg +=
                    `\n1. If '${tagName}' is an Angular component and it has '${name}' input, then verify that it is ${hostIsStandalone
                        ? "included in the '@Component.imports' of this component"
                        : 'part of this module'}.` +
                        `\n2. If '${tagName}' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the ${schemas} of this component to suppress this message.` +
                        `\n3. To allow any property add 'NO_ERRORS_SCHEMA' to the ${schemas} of this component.`;
            }
            const diag = makeTemplateDiagnostic(id, mapping, span, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.SCHEMA_INVALID_ATTRIBUTE), errorMsg);
            this._diagnostics.push(diag);
        }
    }
    checkHostElementProperty(id, element, name, span, schemas) {
        for (const tagName of element.tagNames) {
            if (REGISTRY$1.hasProperty(tagName, name, schemas)) {
                continue;
            }
            const errorMessage = `Can't bind to '${name}' since it isn't a known property of '${tagName}'.`;
            const mapping = this.resolver.getHostBindingsMapping(id);
            const diag = makeTemplateDiagnostic(id, mapping, span, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.SCHEMA_INVALID_ATTRIBUTE), errorMessage);
            this._diagnostics.push(diag);
            break;
        }
    }
}

/**
 * An environment for a given source file that can be used to emit references.
 *
 * This can be used by the type-checking block, or constructor logic to generate
 * references to directives or other symbols or types.
 */
class ReferenceEmitEnvironment {
    importManager;
    refEmitter;
    reflector;
    contextFile;
    constructor(importManager, refEmitter, reflector, contextFile) {
        this.importManager = importManager;
        this.refEmitter = refEmitter;
        this.reflector = reflector;
        this.contextFile = contextFile;
    }
    canReferenceType(ref, flags = exports.ImportFlags.NoAliasing |
        exports.ImportFlags.AllowTypeImports |
        exports.ImportFlags.AllowRelativeDtsImports) {
        const result = this.refEmitter.emit(ref, this.contextFile, flags);
        return result.kind === exports.ReferenceEmitKind.Success;
    }
    /**
     * Generate a `ts.TypeNode` that references the given node as a type.
     *
     * This may involve importing the node into the file if it's not declared there already.
     */
    referenceType(ref, flags = exports.ImportFlags.NoAliasing |
        exports.ImportFlags.AllowTypeImports |
        exports.ImportFlags.AllowRelativeDtsImports) {
        const ngExpr = this.refEmitter.emit(ref, this.contextFile, flags);
        assertSuccessfulReferenceEmit(ngExpr, this.contextFile, 'symbol');
        // Create an `ExpressionType` from the `Expression` and translate it via `translateType`.
        // TODO(alxhub): support references to types with generic arguments in a clean way.
        return translateType(new compiler.ExpressionType(ngExpr.expression), this.contextFile, this.reflector, this.refEmitter, this.importManager);
    }
    /**
     * Generate a `ts.Expression` that refers to the external symbol. This
     * may result in new imports being generated.
     */
    referenceExternalSymbol(moduleName, name) {
        const external = new compiler.ExternalExpr({ moduleName, name });
        return translateExpression(this.contextFile, external, this.importManager);
    }
    /**
     * Generate a `ts.TypeNode` that references a given type from the provided module.
     *
     * This will involve importing the type into the file, and will also add type parameters if
     * provided.
     */
    referenceExternalType(moduleName, name, typeParams) {
        const external = new compiler.ExternalExpr({ moduleName, name });
        return translateType(new compiler.ExpressionType(external, compiler.TypeModifier.None, typeParams), this.contextFile, this.reflector, this.refEmitter, this.importManager);
    }
    /**
     * Generates a `ts.TypeNode` representing a type that is being referenced from a different place
     * in the program. Any type references inside the transplanted type will be rewritten so that
     * they can be imported in the context file.
     */
    referenceTransplantedType(type) {
        return translateType(type, this.contextFile, this.reflector, this.refEmitter, this.importManager);
    }
}

/**
 * A `Set` of `ts.SyntaxKind`s of `ts.Expression` which are safe to wrap in a `ts.AsExpression`
 * without needing to be wrapped in parentheses.
 *
 * For example, `foo.bar()` is a `ts.CallExpression`, and can be safely cast to `any` with
 * `foo.bar() as any`. however, `foo !== bar` is a `ts.BinaryExpression`, and attempting to cast
 * without the parentheses yields the expression `foo !== bar as any`. This is semantically
 * equivalent to `foo !== (bar as any)`, which is not what was intended. Thus,
 * `ts.BinaryExpression`s need to be wrapped in parentheses before casting.
 */
//
const SAFE_TO_CAST_WITHOUT_PARENS = new Set([
    // Expressions which are already parenthesized can be cast without further wrapping.
    ts.SyntaxKind.ParenthesizedExpression,
    // Expressions which form a single lexical unit leave no room for precedence issues with the cast.
    ts.SyntaxKind.Identifier,
    ts.SyntaxKind.CallExpression,
    ts.SyntaxKind.NonNullExpression,
    ts.SyntaxKind.ElementAccessExpression,
    ts.SyntaxKind.PropertyAccessExpression,
    ts.SyntaxKind.ArrayLiteralExpression,
    ts.SyntaxKind.ObjectLiteralExpression,
    // The same goes for various literals.
    ts.SyntaxKind.StringLiteral,
    ts.SyntaxKind.NumericLiteral,
    ts.SyntaxKind.TrueKeyword,
    ts.SyntaxKind.FalseKeyword,
    ts.SyntaxKind.NullKeyword,
    ts.SyntaxKind.UndefinedKeyword,
]);
function tsCastToAny(expr) {
    // Wrap `expr` in parentheses if needed (see `SAFE_TO_CAST_WITHOUT_PARENS` above).
    if (!SAFE_TO_CAST_WITHOUT_PARENS.has(expr.kind)) {
        expr = ts.factory.createParenthesizedExpression(expr);
    }
    // The outer expression is always wrapped in parentheses.
    return ts.factory.createParenthesizedExpression(ts.factory.createAsExpression(expr, ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)));
}
/**
 * Create an expression which instantiates an element by its HTML tagName.
 *
 * Thanks to narrowing of `document.createElement()`, this expression will have its type inferred
 * based on the tag name, including for custom elements that have appropriate .d.ts definitions.
 */
function tsCreateElement(...tagNames) {
    const createElement = ts.factory.createPropertyAccessExpression(
    /* expression */ ts.factory.createIdentifier('document'), 'createElement');
    let arg;
    if (tagNames.length === 1) {
        // If there's only one tag name, we can pass it in directly.
        arg = ts.factory.createStringLiteral(tagNames[0]);
    }
    else {
        // If there's more than one name, we have to generate a union of all the tag names. To do so,
        // create an expression in the form of `null! as 'tag-1' | 'tag-2' | 'tag-3'`. This allows
        // TypeScript to infer the type as a union of the differnet tags.
        const assertedNullExpression = ts.factory.createNonNullExpression(ts.factory.createNull());
        const type = ts.factory.createUnionTypeNode(tagNames.map((tag) => ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(tag))));
        arg = ts.factory.createAsExpression(assertedNullExpression, type);
    }
    return ts.factory.createCallExpression(
    /* expression */ createElement, 
    /* typeArguments */ undefined, 
    /* argumentsArray */ [arg]);
}
/**
 * Create a `ts.VariableStatement` which declares a variable without explicit initialization.
 *
 * The initializer `null!` is used to bypass strict variable initialization checks.
 *
 * Unlike with `tsCreateVariable`, the type of the variable is explicitly specified.
 */
function tsDeclareVariable(id, type) {
    // When we create a variable like `var _t1: boolean = null!`, TypeScript actually infers `_t1`
    // to be `never`, instead of a `boolean`. To work around it, we cast the value
    // in the initializer, e.g. `var _t1 = null! as boolean;`.
    addExpressionIdentifier(type, ExpressionIdentifier.VARIABLE_AS_EXPRESSION);
    const initializer = ts.factory.createAsExpression(ts.factory.createNonNullExpression(ts.factory.createNull()), type);
    const decl = ts.factory.createVariableDeclaration(
    /* name */ id, 
    /* exclamationToken */ undefined, 
    /* type */ undefined, 
    /* initializer */ initializer);
    return ts.factory.createVariableStatement(
    /* modifiers */ undefined, 
    /* declarationList */ [decl]);
}
/**
 * Creates a `ts.TypeQueryNode` for a coerced input.
 *
 * For example: `typeof MatInput.ngAcceptInputType_value`, where MatInput is `typeName` and `value`
 * is the `coercedInputName`.
 *
 * @param typeName The `EntityName` of the Directive where the static coerced input is defined.
 * @param coercedInputName The field name of the coerced input.
 */
function tsCreateTypeQueryForCoercedInput(typeName, coercedInputName) {
    return ts.factory.createTypeQueryNode(ts.factory.createQualifiedName(typeName, `ngAcceptInputType_${coercedInputName}`));
}
/**
 * Create a `ts.VariableStatement` that initializes a variable with a given expression.
 *
 * Unlike with `tsDeclareVariable`, the type of the variable is inferred from the initializer
 * expression.
 */
function tsCreateVariable(id, initializer, flags = null) {
    const decl = ts.factory.createVariableDeclaration(
    /* name */ id, 
    /* exclamationToken */ undefined, 
    /* type */ undefined, 
    /* initializer */ initializer);
    return ts.factory.createVariableStatement(
    /* modifiers */ undefined, 
    /* declarationList */ flags === null
        ? [decl]
        : ts.factory.createVariableDeclarationList([decl], flags));
}
/**
 * Construct a `ts.CallExpression` that calls a method on a receiver.
 */
function tsCallMethod(receiver, methodName, args = []) {
    const methodAccess = ts.factory.createPropertyAccessExpression(receiver, methodName);
    return ts.factory.createCallExpression(
    /* expression */ methodAccess, 
    /* typeArguments */ undefined, 
    /* argumentsArray */ args);
}
function isAccessExpression(node) {
    return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
}
/**
 * Creates a TypeScript node representing a numeric value.
 */
function tsNumericExpression(value) {
    // As of TypeScript 5.3 negative numbers are represented as `prefixUnaryOperator` and passing a
    // negative number (even as a string) into `createNumericLiteral` will result in an error.
    if (value < 0) {
        const operand = ts.factory.createNumericLiteral(Math.abs(value));
        return ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, operand);
    }
    return ts.factory.createNumericLiteral(value);
}

/**
 * See `TypeEmitter` for more information on the emitting process.
 */
class TypeParameterEmitter {
    typeParameters;
    reflector;
    constructor(typeParameters, reflector) {
        this.typeParameters = typeParameters;
        this.reflector = reflector;
    }
    /**
     * Determines whether the type parameters can be emitted. If this returns true, then a call to
     * `emit` is known to succeed. Vice versa, if false is returned then `emit` should not be
     * called, as it would fail.
     */
    canEmit(canEmitReference) {
        if (this.typeParameters === undefined) {
            return true;
        }
        return this.typeParameters.every((typeParam) => {
            return (this.canEmitType(typeParam.constraint, canEmitReference) &&
                this.canEmitType(typeParam.default, canEmitReference));
        });
    }
    canEmitType(type, canEmitReference) {
        if (type === undefined) {
            return true;
        }
        return canEmitType(type, (typeReference) => {
            const reference = this.resolveTypeReference(typeReference);
            if (reference === null) {
                return false;
            }
            if (reference instanceof Reference) {
                return canEmitReference(reference);
            }
            return true;
        });
    }
    /**
     * Emits the type parameters using the provided emitter function for `Reference`s.
     */
    emit(emitReference) {
        if (this.typeParameters === undefined) {
            return undefined;
        }
        const emitter = new TypeEmitter((type) => this.translateTypeReference(type, emitReference));
        return this.typeParameters.map((typeParam) => {
            const constraint = typeParam.constraint !== undefined ? emitter.emitType(typeParam.constraint) : undefined;
            const defaultType = typeParam.default !== undefined ? emitter.emitType(typeParam.default) : undefined;
            return ts.factory.updateTypeParameterDeclaration(typeParam, typeParam.modifiers, typeParam.name, constraint, defaultType);
        });
    }
    resolveTypeReference(type) {
        const target = ts.isIdentifier(type.typeName) ? type.typeName : type.typeName.right;
        const declaration = this.reflector.getDeclarationOfIdentifier(target);
        // If no declaration could be resolved or does not have a `ts.Declaration`, the type cannot be
        // resolved.
        if (declaration === null || declaration.node === null) {
            return null;
        }
        // If the declaration corresponds with a local type parameter, the type reference can be used
        // as is.
        if (this.isLocalTypeParameter(declaration.node)) {
            return type;
        }
        let owningModule = null;
        if (typeof declaration.viaModule === 'string') {
            owningModule = {
                specifier: declaration.viaModule,
                resolutionContext: type.getSourceFile().fileName,
            };
        }
        return new Reference(declaration.node, declaration.viaModule === AmbientImport ? AmbientImport : owningModule);
    }
    translateTypeReference(type, emitReference) {
        const reference = this.resolveTypeReference(type);
        if (!(reference instanceof Reference)) {
            return reference;
        }
        const typeNode = emitReference(reference);
        if (typeNode === null) {
            return null;
        }
        if (!ts.isTypeReferenceNode(typeNode)) {
            throw new Error(`Expected TypeReferenceNode for emitted reference, got ${ts.SyntaxKind[typeNode.kind]}.`);
        }
        return typeNode;
    }
    isLocalTypeParameter(decl) {
        // Checking for local type parameters only occurs during resolution of type parameters, so it is
        // guaranteed that type parameters are present.
        return this.typeParameters.some((param) => param === decl);
    }
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Comment attached to an AST node that serves as a guard to distinguish nodes
 * used for type checking host bindings from ones used for templates.
 */
const GUARD_COMMENT_TEXT = 'hostBindingsBlockGuard';
/**
 * Creates an AST node that represents the host element of a directive.
 * Can return null if there are no valid bindings to be checked.
 * @param type Whether the host element is for a directive or a component.
 * @param selector Selector of the directive.
 * @param sourceNode Class declaration for the directive.
 * @param literal `host` object literal from the decorator.
 * @param bindingDecorators `HostBinding` decorators discovered on the node.
 * @param listenerDecorators `HostListener` decorators discovered on the node.
 */
function createHostElement(type, selector, sourceNode, literal, bindingDecorators, listenerDecorators) {
    const bindings = [];
    const listeners = [];
    let parser = null;
    if (literal !== null) {
        for (const prop of literal.properties) {
            // We only support type checking of static bindings.
            if (ts.isPropertyAssignment(prop) &&
                ts.isStringLiteralLike(prop.initializer) &&
                isStaticName(prop.name)) {
                parser ??= compiler.makeBindingParser();
                createNodeFromHostLiteralProperty(prop, parser, bindings, listeners);
            }
        }
    }
    for (const decorator of bindingDecorators) {
        createNodeFromBindingDecorator(decorator, bindings);
    }
    for (const decorator of listenerDecorators) {
        parser ??= compiler.makeBindingParser();
        createNodeFromListenerDecorator(decorator, parser, listeners);
    }
    // The element will be a no-op if there are no bindings.
    if (bindings.length === 0 && listeners.length === 0) {
        return null;
    }
    const tagNames = [];
    if (selector !== null) {
        const parts = compiler.CssSelector.parse(selector);
        for (const part of parts) {
            if (part.element !== null) {
                tagNames.push(part.element);
            }
        }
    }
    // If none of the selectors have a tag name, fall back to `ng-component`/`ng-directive`.
    // This is how the runtime handles components without tag names as well.
    if (tagNames.length === 0) {
        tagNames.push(`ng-${type}`);
    }
    return new compiler.HostElement(tagNames, bindings, listeners, createSourceSpan(sourceNode.name));
}
/**
 * Creates an AST node that can be used as a guard in `if` statements to distinguish TypeScript
 * nodes used for checking host bindings from ones used for checking templates.
 */
function createHostBindingsBlockGuard() {
    // Note that the comment text is quite generic. This doesn't really matter, because it is
    // used only inside a TCB and there's no way for users to produce a comment there.
    // `true /*hostBindings*/`.
    const trueExpr = ts.addSyntheticTrailingComment(ts.factory.createTrue(), ts.SyntaxKind.MultiLineCommentTrivia, GUARD_COMMENT_TEXT);
    // Wrap the expression in parentheses to ensure that the comment is attached to the correct node.
    return ts.factory.createParenthesizedExpression(trueExpr);
}
/**
 * Determines if a given node is a guard that indicates that descendant nodes are used to check
 * host bindings.
 */
function isHostBindingsBlockGuard(node) {
    if (!ts.isIfStatement(node)) {
        return false;
    }
    // Needs to be kept in sync with `createHostBindingsMarker`.
    const expr = node.expression;
    if (!ts.isParenthesizedExpression(expr) || expr.expression.kind !== ts.SyntaxKind.TrueKeyword) {
        return false;
    }
    const text = expr.getSourceFile().text;
    return (ts.forEachTrailingCommentRange(text, expr.expression.getEnd(), (pos, end, kind) => kind === ts.SyntaxKind.MultiLineCommentTrivia &&
        text.substring(pos + 2, end - 2) === GUARD_COMMENT_TEXT) || false);
}
/**
 * If possible, creates and tracks the relevant AST node for a binding declared
 * through a property on the `host` literal.
 * @param prop Property to parse.
 * @param parser Binding parser used to parse the expressions.
 * @param bindings Array tracking the bound attributes of the host element.
 * @param listeners Array tracking the event listeners of the host element.
 */
function createNodeFromHostLiteralProperty(property, parser, bindings, listeners) {
    // TODO(crisbeto): surface parsing errors here, because currently they just get ignored.
    // They'll still get reported when the handler tries to parse the bindings, but here we
    // can highlight the nodes more accurately.
    const { name, initializer } = property;
    if (name.text.startsWith('[') && name.text.endsWith(']')) {
        const { attrName, type } = inferBoundAttribute(name.text.slice(1, -1));
        const valueSpan = createStaticExpressionSpan(initializer);
        const ast = parser.parseBinding(initializer.text, true, valueSpan, valueSpan.start.offset);
        if (ast.errors.length > 0) {
            return; // See TODO above.
        }
        fixupSpans(ast, initializer);
        bindings.push(new compiler.BoundAttribute(attrName, type, 0, ast, null, createSourceSpan(property), createStaticExpressionSpan(name), valueSpan, undefined));
    }
    else if (name.text.startsWith('(') && name.text.endsWith(')')) {
        const events = [];
        parser.parseEvent(name.text.slice(1, -1), initializer.text, false, createSourceSpan(property), createStaticExpressionSpan(initializer), [], events, createStaticExpressionSpan(name));
        if (events.length === 0 || events[0].handler.errors.length > 0) {
            return; // See TODO above.
        }
        fixupSpans(events[0].handler, initializer);
        listeners.push(compiler.BoundEvent.fromParsedEvent(events[0]));
    }
}
/**
 * If possible, creates and tracks a bound attribute node from a `HostBinding` decorator.
 * @param decorator Decorator from which to create the node.
 * @param bindings Array tracking the bound attributes of the host element.
 */
function createNodeFromBindingDecorator(decorator, bindings) {
    // We only support decorators that are being called.
    if (!ts.isCallExpression(decorator.expression)) {
        return;
    }
    const args = decorator.expression.arguments;
    const property = decorator.parent;
    let nameNode = null;
    let propertyName = null;
    if (property && ts.isPropertyDeclaration(property) && isStaticName(property.name)) {
        propertyName = property.name;
    }
    // The first parameter is optional. If omitted, the name
    // of the class member is used as the property.
    if (args.length === 0) {
        nameNode = propertyName;
    }
    else if (ts.isStringLiteralLike(args[0])) {
        nameNode = args[0];
    }
    else {
        return;
    }
    if (nameNode === null || propertyName === null) {
        return;
    }
    // We can't synthesize a fake expression here and pass it through the binding parser, because
    // it constructs all the spans based on the source code origin and they aren't easily mappable
    // back to the source. E.g. `@HostBinding('foo') id = '123'` in source code would look
    // something like `[foo]="this.id"` in the AST. Instead we construct the expressions
    // manually here. Note that we use a dummy span with -1/-1 as offsets, because it isn't
    // used for type checking and constructing it accurately would take some effort.
    const span = new compiler.ParseSpan(-1, -1);
    const propertyStart = property.getStart();
    const receiver = new compiler.ThisReceiver(span, new compiler.AbsoluteSourceSpan(propertyStart, propertyStart));
    const nameSpan = new compiler.AbsoluteSourceSpan(propertyName.getStart(), propertyName.getEnd());
    const read = ts.isIdentifier(propertyName)
        ? new compiler.PropertyRead(span, nameSpan, nameSpan, receiver, propertyName.text)
        : new compiler.KeyedRead(span, nameSpan, receiver, new compiler.LiteralPrimitive(span, nameSpan, propertyName.text));
    const { attrName, type } = inferBoundAttribute(nameNode.text);
    bindings.push(new compiler.BoundAttribute(attrName, type, 0, read, null, createSourceSpan(decorator), createStaticExpressionSpan(nameNode), createSourceSpan(decorator), undefined));
}
/**
 * If possible, creates and tracks a bound event node from a `HostBinding` decorator.
 * @param decorator Decorator from which to create the node.
 * @param parser Binding parser used to parse the expressions.
 * @param bindings Array tracking the bound events of the host element.
 */
function createNodeFromListenerDecorator(decorator, parser, listeners) {
    // We only support decorators that are being called with at least one argument.
    if (!ts.isCallExpression(decorator.expression) || decorator.expression.arguments.length === 0) {
        return;
    }
    const args = decorator.expression.arguments;
    const method = decorator.parent;
    // Only handle decorators that are statically analyzable.
    if (!method ||
        !ts.isMethodDeclaration(method) ||
        !isStaticName(method.name) ||
        !ts.isStringLiteralLike(args[0])) {
        return;
    }
    // We can't synthesize a fake expression here and pass it through the binding parser, because
    // it constructs all the spans based on the source code origin and they aren't easily mappable
    // back to the source. E.g. `@HostListener('foo') handleFoo() {}` in source code would look
    // something like `(foo)="handleFoo()"` in the AST. Instead we construct the expressions
    // manually here. Note that we use a dummy span with -1/-1 as offsets, because it isn't
    // used for type checking and constructing it accurately would take some effort.
    const span = new compiler.ParseSpan(-1, -1);
    const argNodes = [];
    const methodStart = method.getStart();
    const methodReceiver = new compiler.ThisReceiver(span, new compiler.AbsoluteSourceSpan(methodStart, methodStart));
    const nameSpan = new compiler.AbsoluteSourceSpan(method.name.getStart(), method.name.getEnd());
    const receiver = ts.isIdentifier(method.name)
        ? new compiler.PropertyRead(span, nameSpan, nameSpan, methodReceiver, method.name.text)
        : new compiler.KeyedRead(span, nameSpan, methodReceiver, new compiler.LiteralPrimitive(span, nameSpan, method.name.text));
    if (args.length > 1 && ts.isArrayLiteralExpression(args[1])) {
        for (const expr of args[1].elements) {
            // If the parameter is a static string, parse it using the binding parser since it can be any
            // expression, otherwise treat it as `any` so the rest of the parameters can be checked.
            if (ts.isStringLiteralLike(expr)) {
                const span = createStaticExpressionSpan(expr);
                const ast = parser.parseBinding(expr.text, true, span, span.start.offset);
                fixupSpans(ast, expr);
                argNodes.push(ast);
            }
            else {
                // Represents `$any(0)`. We need to construct it manually in order to set the right spans.
                const expressionSpan = new compiler.AbsoluteSourceSpan(expr.getStart(), expr.getEnd());
                const anyRead = new compiler.PropertyRead(span, expressionSpan, expressionSpan, new compiler.ImplicitReceiver(span, expressionSpan), '$any');
                const anyCall = new compiler.Call(span, expressionSpan, anyRead, [new compiler.LiteralPrimitive(span, expressionSpan, 0)], expressionSpan);
                argNodes.push(anyCall);
            }
        }
    }
    const callNode = new compiler.Call(span, nameSpan, receiver, argNodes, span);
    const eventNameNode = args[0];
    let type;
    let eventName;
    let phase;
    let target;
    if (eventNameNode.text.startsWith('@')) {
        const parsedName = parser.parseAnimationEventName(eventNameNode.text);
        type = compiler.ParsedEventType.Animation;
        eventName = parsedName.eventName;
        phase = parsedName.phase;
        target = null;
    }
    else {
        const parsedName = parser.parseEventListenerName(eventNameNode.text);
        type = compiler.ParsedEventType.Regular;
        eventName = parsedName.eventName;
        target = parsedName.target;
        phase = null;
    }
    listeners.push(new compiler.BoundEvent(eventName, type, callNode, target, phase, createSourceSpan(decorator), createSourceSpan(decorator), createStaticExpressionSpan(eventNameNode)));
}
/**
 * Infers the attribute name and binding type of a bound attribute based on its raw name.
 * @param name Name from which to infer the information.
 */
function inferBoundAttribute(name) {
    const attrPrefix = 'attr.';
    const classPrefix = 'class.';
    const stylePrefix = 'style.';
    const animationPrefix = '@';
    let attrName;
    let type;
    // Infer the binding type based on the prefix.
    if (name.startsWith(attrPrefix)) {
        attrName = name.slice(attrPrefix.length);
        type = compiler.BindingType.Attribute;
    }
    else if (name.startsWith(classPrefix)) {
        attrName = name.slice(classPrefix.length);
        type = compiler.BindingType.Class;
    }
    else if (name.startsWith(stylePrefix)) {
        attrName = name.slice(stylePrefix.length);
        type = compiler.BindingType.Style;
    }
    else if (name.startsWith(animationPrefix)) {
        attrName = name.slice(animationPrefix.length);
        type = compiler.BindingType.Animation;
    }
    else {
        attrName = name;
        type = compiler.BindingType.Property;
    }
    return { attrName, type };
}
/** Checks whether the specified node is a static name node. */
function isStaticName(node) {
    return ts.isIdentifier(node) || ts.isStringLiteralLike(node);
}
/** Creates a `ParseSourceSpan` pointing to a static expression AST node's source. */
function createStaticExpressionSpan(node) {
    const span = createSourceSpan(node);
    // Offset by one on both sides to skip over the quotes.
    if (ts.isStringLiteralLike(node)) {
        span.fullStart = span.fullStart.moveBy(1);
        span.start = span.start.moveBy(1);
        span.end = span.end.moveBy(-1);
    }
    return span;
}
/**
 * Adjusts the spans of a parsed AST so that they're appropriate for a host bindings context.
 * @param ast The parsed AST that may need to be adjusted.
 * @param initializer TypeScript node from which the source of the AST was extracted.
 */
function fixupSpans(ast, initializer) {
    // When parsing the initializer as a property/event binding, we use `.text` which excludes escaped
    // quotes and is generally what we want, because preserving them would result in a parser error,
    // however it has the downside in that the spans of the expressions following the escaped
    // characters are no longer accurate relative to the source code. The more escaped characters
    // there are before a node, the more inaccurate its span will be. If we detect cases like that,
    // we override the spans of all nodes following the escaped string to point to the entire
    // initializer string so that we don't surface diagnostics with mangled spans. This isn't ideal,
    // but is likely rare in user code. Some workarounds that were attempted and ultimately discarded:
    // 1. Counting the number of escaped strings before a node and adjusting its span accordingly -
    // There's a prototype of this approach in https://github.com/crisbeto/angular/commit/1eb92353784a609f6be7e6653ae5a9faef549e6a
    // It works for the most part, but is complex and somewhat brittle, because it's not just the
    // escaped literals that need to be updated, but also any nodes _after_ them and any nodes
    // _containing_ them which gets increasingly complex with more complicated ASTs.
    // 2. Replacing escape characters with whitespaces, for example `\'foo\' + 123` would become
    // ` 'foo ' + 123` - this appears to produce accurate ASTs for some simpler use cases, but has
    // the potential of either changing the user's code into something that's no longer parseable or
    // causing type checking errors (e.g. the typings might require the exact string 'foo').
    // 3. Passing the raw text (e.g. `initializer.getText().slice(1, -1)`) into the binding parser -
    // This will preserve the right mappings, but can lead to parsing errors, because some of the
    // strings won't have to be escaped anymore. We could add a mode to the parser that allows it to
    // recover from such cases, but it'll introduce more complexity that we may not want to take on.
    // 4. Constructing some sort of string like `<host ${name.getText()}=${initializer.getText()}/>`,
    // passing it through the HTML parser and extracting the first attribute from it - wasn't explored
    // much, but likely has the same issues as approach #3.
    const escapeIndex = initializer.getText().indexOf('\\', 1);
    if (escapeIndex > -1) {
        const newSpan = new compiler.ParseSpan(0, initializer.getWidth());
        const newSourceSpan = new compiler.AbsoluteSourceSpan(initializer.getStart(), initializer.getEnd());
        ast.visit(new ReplaceSpanVisitor(escapeIndex, newSpan, newSourceSpan));
    }
}
/**
 * Visitor that replaces the spans of all nodes with new ones,
 * if they're defined after a specific index.
 */
class ReplaceSpanVisitor extends compiler.RecursiveAstVisitor {
    afterIndex;
    overrideSpan;
    overrideSourceSpan;
    constructor(afterIndex, overrideSpan, overrideSourceSpan) {
        super();
        this.afterIndex = afterIndex;
        this.overrideSpan = overrideSpan;
        this.overrideSourceSpan = overrideSourceSpan;
    }
    visit(ast) {
        // Only nodes after the index need to be adjusted, but all nodes should be visited.
        if (ast.span.start >= this.afterIndex || ast.span.end >= this.afterIndex) {
            ast.span = this.overrideSpan;
            ast.sourceSpan = this.overrideSourceSpan;
            if (ast instanceof compiler.ASTWithName) {
                ast.nameSpan = this.overrideSourceSpan;
            }
            if (ast instanceof compiler.Call || ast instanceof compiler.SafeCall) {
                ast.argumentSpan = this.overrideSourceSpan;
            }
        }
        super.visit(ast);
    }
}

/**
 * External modules/identifiers that always should exist for type check
 * block files.
 *
 * Importing the modules in preparation helps ensuring a stable import graph
 * that would not degrade TypeScript's incremental program structure re-use.
 *
 * Note: For inline type check blocks, or type constructors, we cannot add preparation
 * imports, but ideally the required modules are already imported and can be re-used
 * to not incur a structural TypeScript program re-use discarding.
 */
const TCB_FILE_IMPORT_GRAPH_PREPARE_IDENTIFIERS = [
    // Imports may be added for signal input checking. We wouldn't want to change the
    // import graph for incremental compilations when suddenly a signal input is used,
    // or removed.
    compiler.Identifiers.InputSignalBrandWriteType,
];
/**
 * Indicates whether a particular component requires an inline type check block.
 *
 * This is not a boolean state as inlining might only be required to get the best possible
 * type-checking, but the component could theoretically still be checked without it.
 */
var TcbInliningRequirement;
(function (TcbInliningRequirement) {
    /**
     * There is no way to type check this component without inlining.
     */
    TcbInliningRequirement[TcbInliningRequirement["MustInline"] = 0] = "MustInline";
    /**
     * Inlining should be used due to the component's generic bounds, but a non-inlining fallback
     * method can be used if that's not possible.
     */
    TcbInliningRequirement[TcbInliningRequirement["ShouldInlineForGenericBounds"] = 1] = "ShouldInlineForGenericBounds";
    /**
     * There is no requirement for this component's TCB to be inlined.
     */
    TcbInliningRequirement[TcbInliningRequirement["None"] = 2] = "None";
})(TcbInliningRequirement || (TcbInliningRequirement = {}));
function requiresInlineTypeCheckBlock(ref, env, usedPipes, reflector) {
    // In order to qualify for a declared TCB (not inline) two conditions must be met:
    // 1) the class must be suitable to be referenced from `env` (e.g. it must be exported)
    // 2) it must not have contextual generic type bounds
    if (!env.canReferenceType(ref)) {
        // Condition 1 is false, the class is not exported.
        return TcbInliningRequirement.MustInline;
    }
    else if (!checkIfGenericTypeBoundsCanBeEmitted(ref.node, reflector, env)) {
        // Condition 2 is false, the class has constrained generic types. It should be checked with an
        // inline TCB if possible, but can potentially use fallbacks to avoid inlining if not.
        return TcbInliningRequirement.ShouldInlineForGenericBounds;
    }
    else if (usedPipes.some((pipeRef) => !env.canReferenceType(pipeRef))) {
        // If one of the pipes used by the component is not exported, a non-inline TCB will not be able
        // to import it, so this requires an inline TCB.
        return TcbInliningRequirement.MustInline;
    }
    else {
        return TcbInliningRequirement.None;
    }
}
/** Maps a shim position back to a source code location. */
function getSourceMapping(shimSf, position, resolver, isDiagnosticRequest) {
    const node = getTokenAtPosition(shimSf, position);
    const sourceLocation = findSourceLocation(node, shimSf, isDiagnosticRequest);
    if (sourceLocation === null) {
        return null;
    }
    if (isInHostBindingTcb(node)) {
        const hostSourceMapping = resolver.getHostBindingsMapping(sourceLocation.id);
        const span = resolver.toHostParseSourceSpan(sourceLocation.id, sourceLocation.span);
        if (span === null) {
            return null;
        }
        return { sourceLocation, sourceMapping: hostSourceMapping, span };
    }
    const span = resolver.toTemplateParseSourceSpan(sourceLocation.id, sourceLocation.span);
    if (span === null) {
        return null;
    }
    // TODO(atscott): Consider adding a context span by walking up from `node` until we get a
    // different span.
    return {
        sourceLocation,
        sourceMapping: resolver.getTemplateSourceMapping(sourceLocation.id),
        span,
    };
}
function isInHostBindingTcb(node) {
    let current = node;
    while (current && !ts.isFunctionDeclaration(current)) {
        if (isHostBindingsBlockGuard(current)) {
            return true;
        }
        current = current.parent;
    }
    return false;
}
function findTypeCheckBlock(file, id, isDiagnosticRequest) {
    // This prioritised-level statements using a breadth-first search
    // This is usually sufficient to find the TCB we're looking for
    for (const stmt of file.statements) {
        if (ts.isFunctionDeclaration(stmt) && getTypeCheckId(stmt, file, isDiagnosticRequest) === id) {
            return stmt;
        }
    }
    // In case the TCB we're looking for is nested (which is not common)
    // eg: when a directive is declared inside a function, as it can happen in test files
    return findNodeInFile(file, (node) => ts.isFunctionDeclaration(node) && getTypeCheckId(node, file, isDiagnosticRequest) === id);
}
/**
 * Traverses up the AST starting from the given node to extract the source location from comments
 * that have been emitted into the TCB. If the node does not exist within a TCB, or if an ignore
 * marker comment is found up the tree (and this is part of a diagnostic request), this function
 * returns null.
 */
function findSourceLocation(node, sourceFile, isDiagnosticsRequest) {
    // Search for comments until the TCB's function declaration is encountered.
    while (node !== undefined && !ts.isFunctionDeclaration(node)) {
        if (hasIgnoreForDiagnosticsMarker(node, sourceFile) && isDiagnosticsRequest) {
            // There's an ignore marker on this node, so the diagnostic should not be reported.
            return null;
        }
        const span = readSpanComment(node, sourceFile);
        if (span !== null) {
            // Once the positional information has been extracted, search further up the TCB to extract
            // the unique id that is attached with the TCB's function declaration.
            const id = getTypeCheckId(node, sourceFile, isDiagnosticsRequest);
            if (id === null) {
                return null;
            }
            return { id, span };
        }
        node = node.parent;
    }
    return null;
}
function getTypeCheckId(node, sourceFile, isDiagnosticRequest) {
    // Walk up to the function declaration of the TCB, the file information is attached there.
    while (!ts.isFunctionDeclaration(node)) {
        if (hasIgnoreForDiagnosticsMarker(node, sourceFile) && isDiagnosticRequest) {
            // There's an ignore marker on this node, so the diagnostic should not be reported.
            return null;
        }
        node = node.parent;
        // Bail once we have reached the root.
        if (node === undefined) {
            return null;
        }
    }
    const start = node.getFullStart();
    return (ts.forEachLeadingCommentRange(sourceFile.text, start, (pos, end, kind) => {
        if (kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
            return null;
        }
        const commentText = sourceFile.text.substring(pos + 2, end - 2);
        return commentText;
    }) || null);
}
/**
 * Ensure imports for certain external modules that should always
 * exist are generated. These are ensured to exist to avoid frequent
 * import graph changes whenever e.g. a signal input is introduced in user code.
 */
function ensureTypeCheckFilePreparationImports(env) {
    for (const identifier of TCB_FILE_IMPORT_GRAPH_PREPARE_IDENTIFIERS) {
        env.importManager.addImport({
            exportModuleSpecifier: identifier.moduleName,
            exportSymbolName: identifier.name,
            requestedFile: env.contextFile,
        });
    }
}
function checkIfGenericTypeBoundsCanBeEmitted(node, reflector, env) {
    // Generic type parameters are considered context free if they can be emitted into any context.
    const emitter = new TypeParameterEmitter(node.typeParameters, reflector);
    return emitter.canEmit((ref) => env.canReferenceType(ref));
}
function findNodeInFile(file, predicate) {
    const visit = (node) => {
        if (predicate(node)) {
            return node;
        }
        return ts.forEachChild(node, visit) ?? null;
    };
    return ts.forEachChild(file, visit) ?? null;
}

function generateTypeCtorDeclarationFn(env, meta, nodeTypeRef, typeParams) {
    const rawTypeArgs = typeParams !== undefined ? generateGenericArgs(typeParams) : undefined;
    const rawType = ts.factory.createTypeReferenceNode(nodeTypeRef, rawTypeArgs);
    const initParam = constructTypeCtorParameter(env, meta, rawType);
    const typeParameters = typeParametersWithDefaultTypes(typeParams);
    if (meta.body) {
        const fnType = ts.factory.createFunctionTypeNode(
        /* typeParameters */ typeParameters, 
        /* parameters */ [initParam], 
        /* type */ rawType);
        const decl = ts.factory.createVariableDeclaration(
        /* name */ meta.fnName, 
        /* exclamationToken */ undefined, 
        /* type */ fnType, 
        /* body */ ts.factory.createNonNullExpression(ts.factory.createNull()));
        const declList = ts.factory.createVariableDeclarationList([decl], ts.NodeFlags.Const);
        return ts.factory.createVariableStatement(
        /* modifiers */ undefined, 
        /* declarationList */ declList);
    }
    else {
        return ts.factory.createFunctionDeclaration(
        /* modifiers */ [ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)], 
        /* asteriskToken */ undefined, 
        /* name */ meta.fnName, 
        /* typeParameters */ typeParameters, 
        /* parameters */ [initParam], 
        /* type */ rawType, 
        /* body */ undefined);
    }
}
/**
 * Generate an inline type constructor for the given class and metadata.
 *
 * An inline type constructor is a specially shaped TypeScript static method, intended to be placed
 * within a directive class itself, that permits type inference of any generic type parameters of
 * the class from the types of expressions bound to inputs or outputs, and the types of elements
 * that match queries performed by the directive. It also catches any errors in the types of these
 * expressions. This method is never called at runtime, but is used in type-check blocks to
 * construct directive types.
 *
 * An inline type constructor for NgFor looks like:
 *
 * static ngTypeCtor<T>(init: Pick<NgForOf<T>, 'ngForOf'|'ngForTrackBy'|'ngForTemplate'>):
 *   NgForOf<T>;
 *
 * A typical constructor would be:
 *
 * NgForOf.ngTypeCtor(init: {
 *   ngForOf: ['foo', 'bar'],
 *   ngForTrackBy: null as any,
 *   ngForTemplate: null as any,
 * }); // Infers a type of NgForOf<string>.
 *
 * Any inputs declared on the type for which no property binding is present are assigned a value of
 * type `any`, to avoid producing any type errors for unset inputs.
 *
 * Inline type constructors are used when the type being created has bounded generic types which
 * make writing a declared type constructor (via `generateTypeCtorDeclarationFn`) difficult or
 * impossible.
 *
 * @param node the `ClassDeclaration<ts.ClassDeclaration>` for which a type constructor will be
 * generated.
 * @param meta additional metadata required to generate the type constructor.
 * @returns a `ts.MethodDeclaration` for the type constructor.
 */
function generateInlineTypeCtor(env, node, meta) {
    // Build rawType, a `ts.TypeNode` of the class with its generic parameters passed through from
    // the definition without any type bounds. For example, if the class is
    // `FooDirective<T extends Bar>`, its rawType would be `FooDirective<T>`.
    const rawTypeArgs = node.typeParameters !== undefined ? generateGenericArgs(node.typeParameters) : undefined;
    const rawType = ts.factory.createTypeReferenceNode(node.name, rawTypeArgs);
    const initParam = constructTypeCtorParameter(env, meta, rawType);
    // If this constructor is being generated into a .ts file, then it needs a fake body. The body
    // is set to a return of `null!`. If the type constructor is being generated into a .d.ts file,
    // it needs no body.
    let body = undefined;
    if (meta.body) {
        body = ts.factory.createBlock([
            ts.factory.createReturnStatement(ts.factory.createNonNullExpression(ts.factory.createNull())),
        ]);
    }
    // Create the type constructor method declaration.
    return ts.factory.createMethodDeclaration(
    /* modifiers */ [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)], 
    /* asteriskToken */ undefined, 
    /* name */ meta.fnName, 
    /* questionToken */ undefined, 
    /* typeParameters */ typeParametersWithDefaultTypes(node.typeParameters), 
    /* parameters */ [initParam], 
    /* type */ rawType, 
    /* body */ body);
}
function constructTypeCtorParameter(env, meta, rawType) {
    // initType is the type of 'init', the single argument to the type constructor method.
    // If the Directive has any inputs, its initType will be:
    //
    // Pick<rawType, 'inputA'|'inputB'>
    //
    // Pick here is used to select only those fields from which the generic type parameters of the
    // directive will be inferred.
    //
    // In the special case there are no inputs, initType is set to {}.
    let initType = null;
    const plainKeys = [];
    const coercedKeys = [];
    const signalInputKeys = [];
    for (const { classPropertyName, transform, isSignal } of meta.fields.inputs) {
        if (isSignal) {
            signalInputKeys.push(ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(classPropertyName)));
        }
        else if (!meta.coercedInputFields.has(classPropertyName)) {
            plainKeys.push(ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(classPropertyName)));
        }
        else {
            const coercionType = transform != null
                ? transform.type.node
                : tsCreateTypeQueryForCoercedInput(rawType.typeName, classPropertyName);
            coercedKeys.push(ts.factory.createPropertySignature(
            /* modifiers */ undefined, 
            /* name */ classPropertyName, 
            /* questionToken */ undefined, 
            /* type */ coercionType));
        }
    }
    if (plainKeys.length > 0) {
        // Construct a union of all the field names.
        const keyTypeUnion = ts.factory.createUnionTypeNode(plainKeys);
        // Construct the Pick<rawType, keyTypeUnion>.
        initType = ts.factory.createTypeReferenceNode('Pick', [rawType, keyTypeUnion]);
    }
    if (coercedKeys.length > 0) {
        const coercedLiteral = ts.factory.createTypeLiteralNode(coercedKeys);
        initType =
            initType !== null
                ? ts.factory.createIntersectionTypeNode([initType, coercedLiteral])
                : coercedLiteral;
    }
    if (signalInputKeys.length > 0) {
        const keyTypeUnion = ts.factory.createUnionTypeNode(signalInputKeys);
        // Construct the UnwrapDirectiveSignalInputs<rawType, keyTypeUnion>.
        const unwrapDirectiveSignalInputsExpr = env.referenceExternalType(compiler.Identifiers.UnwrapDirectiveSignalInputs.moduleName, compiler.Identifiers.UnwrapDirectiveSignalInputs.name, [
            // TODO:
            new compiler.ExpressionType(new compiler.WrappedNodeExpr(rawType)),
            new compiler.ExpressionType(new compiler.WrappedNodeExpr(keyTypeUnion)),
        ]);
        initType =
            initType !== null
                ? ts.factory.createIntersectionTypeNode([initType, unwrapDirectiveSignalInputsExpr])
                : unwrapDirectiveSignalInputsExpr;
    }
    if (initType === null) {
        // Special case - no inputs, outputs, or other fields which could influence the result type.
        initType = ts.factory.createTypeLiteralNode([]);
    }
    // Create the 'init' parameter itself.
    return ts.factory.createParameterDeclaration(
    /* modifiers */ undefined, 
    /* dotDotDotToken */ undefined, 
    /* name */ 'init', 
    /* questionToken */ undefined, 
    /* type */ initType, 
    /* initializer */ undefined);
}
function generateGenericArgs(params) {
    return params.map((param) => ts.factory.createTypeReferenceNode(param.name, undefined));
}
function requiresInlineTypeCtor(node, host, env) {
    // The class requires an inline type constructor if it has generic type bounds that can not be
    // emitted into the provided type-check environment.
    return !checkIfGenericTypeBoundsCanBeEmitted(node, host, env);
}
/**
 * Add a default `= any` to type parameters that don't have a default value already.
 *
 * TypeScript uses the default type of a type parameter whenever inference of that parameter
 * fails. This can happen when inferring a complex type from 'any'. For example, if `NgFor`'s
 * inference is done with the TCB code:
 *
 * ```ts
 * class NgFor<T> {
 *   ngForOf: T[];
 * }
 *
 * declare function ctor<T>(o: Pick<NgFor<T>, 'ngForOf'|'ngForTrackBy'|'ngForTemplate'>):
 * NgFor<T>;
 * ```
 *
 * An invocation looks like:
 *
 * ```ts
 * var _t1 = ctor({ngForOf: [1, 2], ngForTrackBy: null as any, ngForTemplate: null as any});
 * ```
 *
 * This correctly infers the type `NgFor<number>` for `_t1`, since `T` is inferred from the
 * assignment of type `number[]` to `ngForOf`'s type `T[]`. However, if `any` is passed instead:
 *
 * ```ts
 * var _t2 = ctor({ngForOf: [1, 2] as any, ngForTrackBy: null as any, ngForTemplate: null as
 * any});
 * ```
 *
 * then inference for `T` fails (it cannot be inferred from `T[] = any`). In this case, `T`
 * takes the type `{}`, and so `_t2` is inferred as `NgFor<{}>`. This is obviously wrong.
 *
 * Adding a default type to the generic declaration in the constructor solves this problem, as
 * the default type will be used in the event that inference fails.
 *
 * ```ts
 * declare function ctor<T = any>(o: Pick<NgFor<T>, 'ngForOf'>): NgFor<T>;
 *
 * var _t3 = ctor({ngForOf: [1, 2] as any});
 * ```
 *
 * This correctly infers `T` as `any`, and therefore `_t3` as `NgFor<any>`.
 */
function typeParametersWithDefaultTypes(params) {
    if (params === undefined) {
        return undefined;
    }
    return params.map((param) => {
        if (param.default === undefined) {
            return ts.factory.updateTypeParameterDeclaration(param, param.modifiers, param.name, param.constraint, ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        }
        else {
            return param;
        }
    });
}

/**
 * A context which hosts one or more Type Check Blocks (TCBs).
 *
 * An `Environment` supports the generation of TCBs by tracking necessary imports, declarations of
 * type constructors, and other statements beyond the type-checking code within the TCB itself.
 * Through method calls on `Environment`, the TCB generator can request `ts.Expression`s which
 * reference declarations in the `Environment` for these artifacts`.
 *
 * `Environment` can be used in a standalone fashion, or can be extended to support more specialized
 * usage.
 */
class Environment extends ReferenceEmitEnvironment {
    config;
    nextIds = {
        pipeInst: 1,
        typeCtor: 1,
    };
    typeCtors = new Map();
    typeCtorStatements = [];
    pipeInsts = new Map();
    pipeInstStatements = [];
    constructor(config, importManager, refEmitter, reflector, contextFile) {
        super(importManager, refEmitter, reflector, contextFile);
        this.config = config;
    }
    /**
     * Get an expression referring to a type constructor for the given directive.
     *
     * Depending on the shape of the directive itself, this could be either a reference to a declared
     * type constructor, or to an inline type constructor.
     */
    typeCtorFor(dir) {
        const dirRef = dir.ref;
        const node = dirRef.node;
        if (this.typeCtors.has(node)) {
            return this.typeCtors.get(node);
        }
        if (requiresInlineTypeCtor(node, this.reflector, this)) {
            // The constructor has already been created inline, we just need to construct a reference to
            // it.
            const ref = this.reference(dirRef);
            const typeCtorExpr = ts.factory.createPropertyAccessExpression(ref, 'ngTypeCtor');
            this.typeCtors.set(node, typeCtorExpr);
            return typeCtorExpr;
        }
        else {
            const fnName = `_ctor${this.nextIds.typeCtor++}`;
            const nodeTypeRef = this.referenceType(dirRef);
            if (!ts.isTypeReferenceNode(nodeTypeRef)) {
                throw new Error(`Expected TypeReferenceNode from reference to ${dirRef.debugName}`);
            }
            const meta = {
                fnName,
                body: true,
                fields: {
                    inputs: dir.inputs,
                    // TODO: support queries
                    queries: dir.queries,
                },
                coercedInputFields: dir.coercedInputFields,
            };
            const typeParams = this.emitTypeParameters(node);
            const typeCtor = generateTypeCtorDeclarationFn(this, meta, nodeTypeRef.typeName, typeParams);
            this.typeCtorStatements.push(typeCtor);
            const fnId = ts.factory.createIdentifier(fnName);
            this.typeCtors.set(node, fnId);
            return fnId;
        }
    }
    /*
     * Get an expression referring to an instance of the given pipe.
     */
    pipeInst(ref) {
        if (this.pipeInsts.has(ref.node)) {
            return this.pipeInsts.get(ref.node);
        }
        const pipeType = this.referenceType(ref);
        const pipeInstId = ts.factory.createIdentifier(`_pipe${this.nextIds.pipeInst++}`);
        this.pipeInstStatements.push(tsDeclareVariable(pipeInstId, pipeType));
        this.pipeInsts.set(ref.node, pipeInstId);
        return pipeInstId;
    }
    /**
     * Generate a `ts.Expression` that references the given node.
     *
     * This may involve importing the node into the file if it's not declared there already.
     */
    reference(ref) {
        // Disable aliasing for imports generated in a template type-checking context, as there is no
        // guarantee that any alias re-exports exist in the .d.ts files. It's safe to use direct imports
        // in these cases as there is no strict dependency checking during the template type-checking
        // pass.
        const ngExpr = this.refEmitter.emit(ref, this.contextFile, exports.ImportFlags.NoAliasing);
        assertSuccessfulReferenceEmit(ngExpr, this.contextFile, 'class');
        // Use `translateExpression` to convert the `Expression` into a `ts.Expression`.
        return translateExpression(this.contextFile, ngExpr.expression, this.importManager);
    }
    emitTypeParameters(declaration) {
        const emitter = new TypeParameterEmitter(declaration.typeParameters, this.reflector);
        return emitter.emit((ref) => this.referenceType(ref));
    }
    getPreludeStatements() {
        return [...this.pipeInstStatements, ...this.typeCtorStatements];
    }
}

class OutOfBandDiagnosticRecorderImpl {
    resolver;
    _diagnostics = [];
    /**
     * Tracks which `BindingPipe` nodes have already been recorded as invalid, so only one diagnostic
     * is ever produced per node.
     */
    recordedPipes = new Set();
    constructor(resolver) {
        this.resolver = resolver;
    }
    get diagnostics() {
        return this._diagnostics;
    }
    missingReferenceTarget(id, ref) {
        const mapping = this.resolver.getTemplateSourceMapping(id);
        const value = ref.value.trim();
        const errorMsg = `No directive found with exportAs '${value}'.`;
        this._diagnostics.push(makeTemplateDiagnostic(id, mapping, ref.valueSpan || ref.sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.MISSING_REFERENCE_TARGET), errorMsg));
    }
    missingPipe(id, ast) {
        if (this.recordedPipes.has(ast)) {
            return;
        }
        const mapping = this.resolver.getTemplateSourceMapping(id);
        const errorMsg = `No pipe found with name '${ast.name}'.`;
        const sourceSpan = this.resolver.toTemplateParseSourceSpan(id, ast.nameSpan);
        if (sourceSpan === null) {
            throw new Error(`Assertion failure: no SourceLocation found for usage of pipe '${ast.name}'.`);
        }
        this._diagnostics.push(makeTemplateDiagnostic(id, mapping, sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.MISSING_PIPE), errorMsg));
        this.recordedPipes.add(ast);
    }
    deferredPipeUsedEagerly(id, ast) {
        if (this.recordedPipes.has(ast)) {
            return;
        }
        const mapping = this.resolver.getTemplateSourceMapping(id);
        const errorMsg = `Pipe '${ast.name}' was imported  via \`@Component.deferredImports\`, ` +
            `but was used outside of a \`@defer\` block in a template. To fix this, either ` +
            `use the '${ast.name}' pipe inside of a \`@defer\` block or import this dependency ` +
            `using the \`@Component.imports\` field.`;
        const sourceSpan = this.resolver.toTemplateParseSourceSpan(id, ast.nameSpan);
        if (sourceSpan === null) {
            throw new Error(`Assertion failure: no SourceLocation found for usage of pipe '${ast.name}'.`);
        }
        this._diagnostics.push(makeTemplateDiagnostic(id, mapping, sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.DEFERRED_PIPE_USED_EAGERLY), errorMsg));
        this.recordedPipes.add(ast);
    }
    deferredComponentUsedEagerly(id, element) {
        const mapping = this.resolver.getTemplateSourceMapping(id);
        const errorMsg = `Element '${element.name}' contains a component or a directive that ` +
            `was imported  via \`@Component.deferredImports\`, but the element itself is located ` +
            `outside of a \`@defer\` block in a template. To fix this, either ` +
            `use the '${element.name}' element inside of a \`@defer\` block or ` +
            `import referenced component/directive dependency using the \`@Component.imports\` field.`;
        const { start, end } = element.startSourceSpan;
        const absoluteSourceSpan = new compiler.AbsoluteSourceSpan(start.offset, end.offset);
        const sourceSpan = this.resolver.toTemplateParseSourceSpan(id, absoluteSourceSpan);
        if (sourceSpan === null) {
            throw new Error(`Assertion failure: no SourceLocation found for usage of pipe '${element.name}'.`);
        }
        this._diagnostics.push(makeTemplateDiagnostic(id, mapping, sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.DEFERRED_DIRECTIVE_USED_EAGERLY), errorMsg));
    }
    duplicateTemplateVar(id, variable, firstDecl) {
        const mapping = this.resolver.getTemplateSourceMapping(id);
        const errorMsg = `Cannot redeclare variable '${variable.name}' as it was previously declared elsewhere for the same template.`;
        // The allocation of the error here is pretty useless for variables declared in microsyntax,
        // since the sourceSpan refers to the entire microsyntax property, not a span for the specific
        // variable in question.
        //
        // TODO(alxhub): allocate to a tighter span once one is available.
        this._diagnostics.push(makeTemplateDiagnostic(id, mapping, variable.sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.DUPLICATE_VARIABLE_DECLARATION), errorMsg, [
            {
                text: `The variable '${firstDecl.name}' was first declared here.`,
                start: firstDecl.sourceSpan.start.offset,
                end: firstDecl.sourceSpan.end.offset,
                sourceFile: mapping.node.getSourceFile(),
            },
        ]));
    }
    requiresInlineTcb(id, node) {
        this._diagnostics.push(makeInlineDiagnostic(id, exports.ErrorCode.INLINE_TCB_REQUIRED, node.name, `This component requires inline template type-checking, which is not supported by the current environment.`));
    }
    requiresInlineTypeConstructors(id, node, directives) {
        let message;
        if (directives.length > 1) {
            message = `This component uses directives which require inline type constructors, which are not supported by the current environment.`;
        }
        else {
            message = `This component uses a directive which requires an inline type constructor, which is not supported by the current environment.`;
        }
        this._diagnostics.push(makeInlineDiagnostic(id, exports.ErrorCode.INLINE_TYPE_CTOR_REQUIRED, node.name, message, directives.map((dir) => makeRelatedInformation(dir.name, `Requires an inline type constructor.`))));
    }
    suboptimalTypeInference(id, variables) {
        const mapping = this.resolver.getTemplateSourceMapping(id);
        // Select one of the template variables that's most suitable for reporting the diagnostic. Any
        // variable will do, but prefer one bound to the context's $implicit if present.
        let diagnosticVar = null;
        for (const variable of variables) {
            if (diagnosticVar === null || variable.value === '' || variable.value === '$implicit') {
                diagnosticVar = variable;
            }
        }
        if (diagnosticVar === null) {
            // There is no variable on which to report the diagnostic.
            return;
        }
        let varIdentification = `'${diagnosticVar.name}'`;
        if (variables.length === 2) {
            varIdentification += ` (and 1 other)`;
        }
        else if (variables.length > 2) {
            varIdentification += ` (and ${variables.length - 1} others)`;
        }
        const message = `This structural directive supports advanced type inference, but the current compiler configuration prevents its usage. The variable ${varIdentification} will have type 'any' as a result.\n\nConsider enabling the 'strictTemplates' option in your tsconfig.json for better type inference within this template.`;
        this._diagnostics.push(makeTemplateDiagnostic(id, mapping, diagnosticVar.keySpan, ts.DiagnosticCategory.Suggestion, ngErrorCode(exports.ErrorCode.SUGGEST_SUBOPTIMAL_TYPE_INFERENCE), message));
    }
    splitTwoWayBinding(id, input, output, inputConsumer, outputConsumer) {
        const mapping = this.resolver.getTemplateSourceMapping(id);
        const errorMsg = `The property and event halves of the two-way binding '${input.name}' are not bound to the same target.
            Find more at https://angular.dev/guide/templates/two-way-binding#how-two-way-binding-works`;
        const relatedMessages = [];
        relatedMessages.push({
            text: `The property half of the binding is to the '${inputConsumer.name.text}' component.`,
            start: inputConsumer.name.getStart(),
            end: inputConsumer.name.getEnd(),
            sourceFile: inputConsumer.name.getSourceFile(),
        });
        if (outputConsumer instanceof compiler.Element) {
            let message = `The event half of the binding is to a native event called '${input.name}' on the <${outputConsumer.name}> DOM element.`;
            if (!mapping.node.getSourceFile().isDeclarationFile) {
                message += `\n \n Are you missing an output declaration called '${output.name}'?`;
            }
            relatedMessages.push({
                text: message,
                start: outputConsumer.sourceSpan.start.offset + 1,
                end: outputConsumer.sourceSpan.start.offset + outputConsumer.name.length + 1,
                sourceFile: mapping.node.getSourceFile(),
            });
        }
        else {
            relatedMessages.push({
                text: `The event half of the binding is to the '${outputConsumer.name.text}' component.`,
                start: outputConsumer.name.getStart(),
                end: outputConsumer.name.getEnd(),
                sourceFile: outputConsumer.name.getSourceFile(),
            });
        }
        this._diagnostics.push(makeTemplateDiagnostic(id, mapping, input.keySpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.SPLIT_TWO_WAY_BINDING), errorMsg, relatedMessages));
    }
    missingRequiredInputs(id, element, directiveName, isComponent, inputAliases) {
        const message = `Required input${inputAliases.length === 1 ? '' : 's'} ${inputAliases
            .map((n) => `'${n}'`)
            .join(', ')} from ${isComponent ? 'component' : 'directive'} ${directiveName} must be specified.`;
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), element.startSourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.MISSING_REQUIRED_INPUTS), message));
    }
    illegalForLoopTrackAccess(id, block, access) {
        const sourceSpan = this.resolver.toTemplateParseSourceSpan(id, access.sourceSpan);
        if (sourceSpan === null) {
            throw new Error(`Assertion failure: no SourceLocation found for property read.`);
        }
        const messageVars = [block.item, ...block.contextVariables.filter((v) => v.value === '$index')]
            .map((v) => `'${v.name}'`)
            .join(', ');
        const message = `Cannot access '${access.name}' inside of a track expression. ` +
            `Only ${messageVars} and properties on the containing component are available to this expression.`;
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.ILLEGAL_FOR_LOOP_TRACK_ACCESS), message));
    }
    inaccessibleDeferredTriggerElement(id, trigger) {
        let message;
        if (trigger.reference === null) {
            message =
                `Trigger cannot find reference. Make sure that the @defer block has a ` +
                    `@placeholder with at least one root element node.`;
        }
        else {
            message =
                `Trigger cannot find reference "${trigger.reference}".\nCheck that an element with #${trigger.reference} exists in the same template and it's accessible from the ` +
                    `@defer block.\nDeferred blocks can only access triggers in same view, a parent ` +
                    `embedded view or the root view of the @placeholder block.`;
        }
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), trigger.sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.INACCESSIBLE_DEFERRED_TRIGGER_ELEMENT), message));
    }
    controlFlowPreventingContentProjection(id, category, projectionNode, componentName, slotSelector, controlFlowNode, preservesWhitespaces) {
        const blockName = controlFlowNode.nameSpan.toString().trim();
        const lines = [
            `Node matches the "${slotSelector}" slot of the "${componentName}" component, but will not be projected into the specific slot because the surrounding ${blockName} has more than one node at its root. To project the node in the right slot, you can:\n`,
            `1. Wrap the content of the ${blockName} block in an <ng-container/> that matches the "${slotSelector}" selector.`,
            `2. Split the content of the ${blockName} block across multiple ${blockName} blocks such that each one only has a single projectable node at its root.`,
            `3. Remove all content from the ${blockName} block, except for the node being projected.`,
        ];
        if (preservesWhitespaces) {
            lines.push('Note: the host component has `preserveWhitespaces: true` which may ' +
                'cause whitespace to affect content projection.');
        }
        lines.push('', 'This check can be disabled using the `extendedDiagnostics.checks.' +
            'controlFlowPreventingContentProjection = "suppress" compiler option.`');
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), projectionNode.startSourceSpan, category, ngErrorCode(exports.ErrorCode.CONTROL_FLOW_PREVENTING_CONTENT_PROJECTION), lines.join('\n')));
    }
    illegalWriteToLetDeclaration(id, node, target) {
        const sourceSpan = this.resolver.toTemplateParseSourceSpan(id, node.sourceSpan);
        if (sourceSpan === null) {
            throw new Error(`Assertion failure: no SourceLocation found for property write.`);
        }
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.ILLEGAL_LET_WRITE), `Cannot assign to @let declaration '${target.name}'.`));
    }
    letUsedBeforeDefinition(id, node, target) {
        const sourceSpan = this.resolver.toTemplateParseSourceSpan(id, node.sourceSpan);
        if (sourceSpan === null) {
            throw new Error(`Assertion failure: no SourceLocation found for property read.`);
        }
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.LET_USED_BEFORE_DEFINITION), `Cannot read @let declaration '${target.name}' before it has been defined.`));
    }
    conflictingDeclaration(id, decl) {
        const mapping = this.resolver.getTemplateSourceMapping(id);
        const errorMsg = `Cannot declare @let called '${decl.name}' as there is another symbol in the template with the same name.`;
        this._diagnostics.push(makeTemplateDiagnostic(id, mapping, decl.sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.CONFLICTING_LET_DECLARATION), errorMsg));
    }
    missingNamedTemplateDependency(id, node) {
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), node.startSourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.MISSING_NAMED_TEMPLATE_DEPENDENCY), 
        // Wording is meant to mimic the wording TS uses in their diagnostic for missing symbols.
        `Cannot find name "${node instanceof compiler.Directive ? node.name : node.componentName}".`));
    }
    incorrectTemplateDependencyType(id, node) {
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), node.startSourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.INCORRECT_NAMED_TEMPLATE_DEPENDENCY_TYPE), `Incorrect reference type. Type must be an ${node instanceof compiler.Component ? '@Component' : '@Directive'}.`));
    }
    unclaimedDirectiveBinding(id, directive, node) {
        const errorMsg = `Directive ${directive.name} does not have an ` +
            `${node instanceof compiler.BoundEvent ? 'output' : 'input'} named "${node.name}". ` +
            `Bindings to directives must target existing inputs or outputs.`;
        this._diagnostics.push(makeTemplateDiagnostic(id, this.resolver.getTemplateSourceMapping(id), node.keySpan || node.sourceSpan, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.UNCLAIMED_DIRECTIVE_BINDING), errorMsg));
    }
}
function makeInlineDiagnostic(id, code, node, messageText, relatedInformation) {
    return {
        ...makeDiagnostic(code, node, messageText, relatedInformation),
        sourceFile: node.getSourceFile(),
        typeCheckId: id,
    };
}

/**
 * A `ShimGenerator` which adds type-checking files to the `ts.Program`.
 *
 * This is a requirement for performant template type-checking, as TypeScript will only reuse
 * information in the main program when creating the type-checking program if the set of files in
 * each are exactly the same. Thus, the main program also needs the synthetic type-checking files.
 */
class TypeCheckShimGenerator {
    extensionPrefix = 'ngtypecheck';
    shouldEmit = false;
    generateShimForFile(sf, genFilePath, priorShimSf) {
        if (priorShimSf !== null) {
            // If this shim existed in the previous program, reuse it now. It might not be correct, but
            // reusing it in the main program allows the shape of its imports to potentially remain the
            // same and TS can then use the fastest path for incremental program creation. Later during
            // the type-checking phase it's going to either be reused, or replaced anyways. Thus there's
            // no harm in reuse here even if it's out of date.
            return priorShimSf;
        }
        return ts.createSourceFile(genFilePath, 'export const USED_FOR_NG_TYPE_CHECKING = true;', ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    }
    static shimFor(fileName) {
        return absoluteFrom(fileName.replace(/\.tsx?$/, '.ngtypecheck.ts'));
    }
}

/**
 * Wraps the node in parenthesis such that inserted span comments become attached to the proper
 * node. This is an alias for `ts.factory.createParenthesizedExpression` with the benefit that it
 * signifies that the inserted parenthesis are for diagnostic purposes, not for correctness of the
 * rendered TCB code.
 *
 * Note that it is important that nodes and its attached comment are not wrapped into parenthesis
 * by default, as it prevents correct translation of e.g. diagnostics produced for incorrect method
 * arguments. Such diagnostics would then be produced for the parenthesised node whereas the
 * positional comment would be located within that node, resulting in a mismatch.
 */
function wrapForDiagnostics(expr) {
    return ts.factory.createParenthesizedExpression(expr);
}
/**
 * Wraps the node in parenthesis such that inserted span comments become attached to the proper
 * node. This is an alias for `ts.factory.createParenthesizedExpression` with the benefit that it
 * signifies that the inserted parenthesis are for use by the type checker, not for correctness of
 * the rendered TCB code.
 */
function wrapForTypeChecker(expr) {
    return ts.factory.createParenthesizedExpression(expr);
}
/**
 * Adds a synthetic comment to the expression that represents the parse span of the provided node.
 * This comment can later be retrieved as trivia of a node to recover original source locations.
 */
function addParseSpanInfo(node, span) {
    let commentText;
    if (span instanceof compiler.AbsoluteSourceSpan) {
        commentText = `${span.start},${span.end}`;
    }
    else {
        commentText = `${span.start.offset},${span.end.offset}`;
    }
    ts.addSyntheticTrailingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, commentText, 
    /* hasTrailingNewLine */ false);
}
/**
 * Adds a synthetic comment to the function declaration that contains the type checking ID
 * of the class declaration.
 */
function addTypeCheckId(tcb, id) {
    ts.addSyntheticLeadingComment(tcb, ts.SyntaxKind.MultiLineCommentTrivia, id, true);
}
/**
 * Determines if the diagnostic should be reported. Some diagnostics are produced because of the
 * way TCBs are generated; those diagnostics should not be reported as type check errors of the
 * template.
 */
function shouldReportDiagnostic(diagnostic) {
    const { code } = diagnostic;
    if (code === 6133 /* $var is declared but its value is never read. */) {
        return false;
    }
    else if (code === 6199 /* All variables are unused. */) {
        return false;
    }
    else if (code === 2695 /* Left side of comma operator is unused and has no side effects. */) {
        return false;
    }
    else if (code === 7006 /* Parameter '$event' implicitly has an 'any' type. */) {
        return false;
    }
    return true;
}
/**
 * Attempts to translate a TypeScript diagnostic produced during template type-checking to their
 * location of origin, based on the comments that are emitted in the TCB code.
 *
 * If the diagnostic could not be translated, `null` is returned to indicate that the diagnostic
 * should not be reported at all. This prevents diagnostics from non-TCB code in a user's source
 * file from being reported as type-check errors.
 */
function translateDiagnostic(diagnostic, resolver) {
    if (diagnostic.file === undefined || diagnostic.start === undefined) {
        return null;
    }
    const fullMapping = getSourceMapping(diagnostic.file, diagnostic.start, resolver, 
    /*isDiagnosticsRequest*/ true);
    if (fullMapping === null) {
        return null;
    }
    const { sourceLocation, sourceMapping: templateSourceMapping, span } = fullMapping;
    return makeTemplateDiagnostic(sourceLocation.id, templateSourceMapping, span, diagnostic.category, diagnostic.code, diagnostic.messageText);
}

/**
 * Expression that is cast to any. Currently represented as `0 as any`.
 *
 * Historically this expression was using `null as any`, but a newly-added check in TypeScript 5.6
 * (https://devblogs.microsoft.com/typescript/announcing-typescript-5-6-beta/#disallowed-nullish-and-truthy-checks)
 * started flagging it as always being nullish. Other options that were considered:
 * - `NaN as any` or `Infinity as any` - not used, because they don't work if the `noLib` compiler
 *   option is enabled. Also they require more characters.
 * - Some flavor of function call, like `isNan(0) as any` - requires even more characters than the
 *   NaN option and has the same issue with `noLib`.
 */
const ANY_EXPRESSION = ts.factory.createAsExpression(ts.factory.createNumericLiteral('0'), ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
const UNDEFINED = ts.factory.createIdentifier('undefined');
const UNARY_OPS = new Map([
    ['+', ts.SyntaxKind.PlusToken],
    ['-', ts.SyntaxKind.MinusToken],
]);
const BINARY_OPS = new Map([
    ['+', ts.SyntaxKind.PlusToken],
    ['-', ts.SyntaxKind.MinusToken],
    ['<', ts.SyntaxKind.LessThanToken],
    ['>', ts.SyntaxKind.GreaterThanToken],
    ['<=', ts.SyntaxKind.LessThanEqualsToken],
    ['>=', ts.SyntaxKind.GreaterThanEqualsToken],
    ['==', ts.SyntaxKind.EqualsEqualsToken],
    ['===', ts.SyntaxKind.EqualsEqualsEqualsToken],
    ['*', ts.SyntaxKind.AsteriskToken],
    ['**', ts.SyntaxKind.AsteriskAsteriskToken],
    ['/', ts.SyntaxKind.SlashToken],
    ['%', ts.SyntaxKind.PercentToken],
    ['!=', ts.SyntaxKind.ExclamationEqualsToken],
    ['!==', ts.SyntaxKind.ExclamationEqualsEqualsToken],
    ['||', ts.SyntaxKind.BarBarToken],
    ['&&', ts.SyntaxKind.AmpersandAmpersandToken],
    ['&', ts.SyntaxKind.AmpersandToken],
    ['|', ts.SyntaxKind.BarToken],
    ['??', ts.SyntaxKind.QuestionQuestionToken],
    ['in', ts.SyntaxKind.InKeyword],
]);
/**
 * Convert an `AST` to TypeScript code directly, without going through an intermediate `Expression`
 * AST.
 */
function astToTypescript(ast, maybeResolve, config) {
    const translator = new AstTranslator(maybeResolve, config);
    return translator.translate(ast);
}
class AstTranslator {
    maybeResolve;
    config;
    constructor(maybeResolve, config) {
        this.maybeResolve = maybeResolve;
        this.config = config;
    }
    translate(ast) {
        // Skip over an `ASTWithSource` as its `visit` method calls directly into its ast's `visit`,
        // which would prevent any custom resolution through `maybeResolve` for that node.
        if (ast instanceof compiler.ASTWithSource) {
            ast = ast.ast;
        }
        // The `EmptyExpr` doesn't have a dedicated method on `AstVisitor`, so it's special cased here.
        if (ast instanceof compiler.EmptyExpr) {
            const res = ts.factory.createIdentifier('undefined');
            addParseSpanInfo(res, ast.sourceSpan);
            return res;
        }
        // First attempt to let any custom resolution logic provide a translation for the given node.
        const resolved = this.maybeResolve(ast);
        if (resolved !== null) {
            return resolved;
        }
        return ast.visit(this);
    }
    visitUnary(ast) {
        const expr = this.translate(ast.expr);
        const op = UNARY_OPS.get(ast.operator);
        if (op === undefined) {
            throw new Error(`Unsupported Unary.operator: ${ast.operator}`);
        }
        const node = wrapForDiagnostics(ts.factory.createPrefixUnaryExpression(op, expr));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitBinary(ast) {
        const lhs = wrapForDiagnostics(this.translate(ast.left));
        const rhs = wrapForDiagnostics(this.translate(ast.right));
        const op = BINARY_OPS.get(ast.operation);
        if (op === undefined) {
            throw new Error(`Unsupported Binary.operation: ${ast.operation}`);
        }
        const node = ts.factory.createBinaryExpression(lhs, op, rhs);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitChain(ast) {
        const elements = ast.expressions.map((expr) => this.translate(expr));
        const node = wrapForDiagnostics(ts.factory.createCommaListExpression(elements));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitConditional(ast) {
        const condExpr = this.translate(ast.condition);
        const trueExpr = this.translate(ast.trueExp);
        // Wrap `falseExpr` in parens so that the trailing parse span info is not attributed to the
        // whole conditional.
        // In the following example, the last source span comment (5,6) could be seen as the
        // trailing comment for _either_ the whole conditional expression _or_ just the `falseExpr` that
        // is immediately before it:
        // `conditional /*1,2*/ ? trueExpr /*3,4*/ : falseExpr /*5,6*/`
        // This should be instead be `conditional /*1,2*/ ? trueExpr /*3,4*/ : (falseExpr /*5,6*/)`
        const falseExpr = wrapForTypeChecker(this.translate(ast.falseExp));
        const node = ts.factory.createParenthesizedExpression(ts.factory.createConditionalExpression(condExpr, undefined, trueExpr, undefined, falseExpr));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitImplicitReceiver(ast) {
        throw new Error('Method not implemented.');
    }
    visitThisReceiver(ast) {
        throw new Error('Method not implemented.');
    }
    visitInterpolation(ast) {
        // Build up a chain of binary + operations to simulate the string concatenation of the
        // interpolation's expressions. The chain is started using an actual string literal to ensure
        // the type is inferred as 'string'.
        return ast.expressions.reduce((lhs, ast) => ts.factory.createBinaryExpression(lhs, ts.SyntaxKind.PlusToken, wrapForTypeChecker(this.translate(ast))), ts.factory.createStringLiteral(''));
    }
    visitKeyedRead(ast) {
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const key = this.translate(ast.key);
        const node = ts.factory.createElementAccessExpression(receiver, key);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitKeyedWrite(ast) {
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const left = ts.factory.createElementAccessExpression(receiver, this.translate(ast.key));
        // TODO(joost): annotate `left` with the span of the element access, which is not currently
        //  available on `ast`.
        const right = wrapForTypeChecker(this.translate(ast.value));
        const node = wrapForDiagnostics(ts.factory.createBinaryExpression(left, ts.SyntaxKind.EqualsToken, right));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitLiteralArray(ast) {
        const elements = ast.expressions.map((expr) => this.translate(expr));
        const literal = ts.factory.createArrayLiteralExpression(elements);
        // If strictLiteralTypes is disabled, array literals are cast to `any`.
        const node = this.config.strictLiteralTypes ? literal : tsCastToAny(literal);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitLiteralMap(ast) {
        const properties = ast.keys.map(({ key }, idx) => {
            const value = this.translate(ast.values[idx]);
            return ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(key), value);
        });
        const literal = ts.factory.createObjectLiteralExpression(properties, true);
        // If strictLiteralTypes is disabled, object literals are cast to `any`.
        const node = this.config.strictLiteralTypes ? literal : tsCastToAny(literal);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitLiteralPrimitive(ast) {
        let node;
        if (ast.value === undefined) {
            node = ts.factory.createIdentifier('undefined');
        }
        else if (ast.value === null) {
            node = ts.factory.createNull();
        }
        else if (typeof ast.value === 'string') {
            node = ts.factory.createStringLiteral(ast.value);
        }
        else if (typeof ast.value === 'number') {
            node = tsNumericExpression(ast.value);
        }
        else if (typeof ast.value === 'boolean') {
            node = ast.value ? ts.factory.createTrue() : ts.factory.createFalse();
        }
        else {
            throw Error(`Unsupported AST value of type ${typeof ast.value}`);
        }
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitNonNullAssert(ast) {
        const expr = wrapForDiagnostics(this.translate(ast.expression));
        const node = ts.factory.createNonNullExpression(expr);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitPipe(ast) {
        throw new Error('Method not implemented.');
    }
    visitPrefixNot(ast) {
        const expression = wrapForDiagnostics(this.translate(ast.expression));
        const node = ts.factory.createLogicalNot(expression);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitTypeofExpression(ast) {
        const expression = wrapForDiagnostics(this.translate(ast.expression));
        const node = ts.factory.createTypeOfExpression(expression);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitVoidExpression(ast) {
        const expression = wrapForDiagnostics(this.translate(ast.expression));
        const node = ts.factory.createVoidExpression(expression);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitPropertyRead(ast) {
        // This is a normal property read - convert the receiver to an expression and emit the correct
        // TypeScript expression to read the property.
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const name = ts.factory.createPropertyAccessExpression(receiver, ast.name);
        addParseSpanInfo(name, ast.nameSpan);
        const node = wrapForDiagnostics(name);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitPropertyWrite(ast) {
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const left = ts.factory.createPropertyAccessExpression(receiver, ast.name);
        addParseSpanInfo(left, ast.nameSpan);
        // TypeScript reports assignment errors on the entire lvalue expression. Annotate the lvalue of
        // the assignment with the sourceSpan, which includes receivers, rather than nameSpan for
        // consistency of the diagnostic location.
        // a.b.c = 1
        // ^^^^^^^^^ sourceSpan
        //     ^     nameSpan
        const leftWithPath = wrapForDiagnostics(left);
        addParseSpanInfo(leftWithPath, ast.sourceSpan);
        // The right needs to be wrapped in parens as well or we cannot accurately match its
        // span to just the RHS. For example, the span in `e = $event /*0,10*/` is ambiguous.
        // It could refer to either the whole binary expression or just the RHS.
        // We should instead generate `e = ($event /*0,10*/)` so we know the span 0,10 matches RHS.
        const right = wrapForTypeChecker(this.translate(ast.value));
        const node = wrapForDiagnostics(ts.factory.createBinaryExpression(leftWithPath, ts.SyntaxKind.EqualsToken, right));
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitSafePropertyRead(ast) {
        let node;
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        // The form of safe property reads depends on whether strictness is in use.
        if (this.config.strictSafeNavigationTypes) {
            // Basically, the return here is either the type of the complete expression with a null-safe
            // property read, or `undefined`. So a ternary is used to create an "or" type:
            // "a?.b" becomes (0 as any ? a!.b : undefined)
            // The type of this expression is (typeof a!.b) | undefined, which is exactly as desired.
            const expr = ts.factory.createPropertyAccessExpression(ts.factory.createNonNullExpression(receiver), ast.name);
            addParseSpanInfo(expr, ast.nameSpan);
            node = ts.factory.createParenthesizedExpression(ts.factory.createConditionalExpression(ANY_EXPRESSION, undefined, expr, undefined, UNDEFINED));
        }
        else if (VeSafeLhsInferenceBugDetector.veWillInferAnyFor(ast)) {
            // Emulate a View Engine bug where 'any' is inferred for the left-hand side of the safe
            // navigation operation. With this bug, the type of the left-hand side is regarded as any.
            // Therefore, the left-hand side only needs repeating in the output (to validate it), and then
            // 'any' is used for the rest of the expression. This is done using a comma operator:
            // "a?.b" becomes (a as any).b, which will of course have type 'any'.
            node = ts.factory.createPropertyAccessExpression(tsCastToAny(receiver), ast.name);
        }
        else {
            // The View Engine bug isn't active, so check the entire type of the expression, but the final
            // result is still inferred as `any`.
            // "a?.b" becomes (a!.b as any)
            const expr = ts.factory.createPropertyAccessExpression(ts.factory.createNonNullExpression(receiver), ast.name);
            addParseSpanInfo(expr, ast.nameSpan);
            node = tsCastToAny(expr);
        }
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitSafeKeyedRead(ast) {
        const receiver = wrapForDiagnostics(this.translate(ast.receiver));
        const key = this.translate(ast.key);
        let node;
        // The form of safe property reads depends on whether strictness is in use.
        if (this.config.strictSafeNavigationTypes) {
            // "a?.[...]" becomes (0 as any ? a![...] : undefined)
            const expr = ts.factory.createElementAccessExpression(ts.factory.createNonNullExpression(receiver), key);
            addParseSpanInfo(expr, ast.sourceSpan);
            node = ts.factory.createParenthesizedExpression(ts.factory.createConditionalExpression(ANY_EXPRESSION, undefined, expr, undefined, UNDEFINED));
        }
        else if (VeSafeLhsInferenceBugDetector.veWillInferAnyFor(ast)) {
            // "a?.[...]" becomes (a as any)[...]
            node = ts.factory.createElementAccessExpression(tsCastToAny(receiver), key);
        }
        else {
            // "a?.[...]" becomes (a!.[...] as any)
            const expr = ts.factory.createElementAccessExpression(ts.factory.createNonNullExpression(receiver), key);
            addParseSpanInfo(expr, ast.sourceSpan);
            node = tsCastToAny(expr);
        }
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitCall(ast) {
        const args = ast.args.map((expr) => this.translate(expr));
        let expr;
        const receiver = ast.receiver;
        // For calls that have a property read as receiver, we have to special-case their emit to avoid
        // inserting superfluous parenthesis as they prevent TypeScript from applying a narrowing effect
        // if the method acts as a type guard.
        if (receiver instanceof compiler.PropertyRead) {
            const resolved = this.maybeResolve(receiver);
            if (resolved !== null) {
                expr = resolved;
            }
            else {
                const propertyReceiver = wrapForDiagnostics(this.translate(receiver.receiver));
                expr = ts.factory.createPropertyAccessExpression(propertyReceiver, receiver.name);
                addParseSpanInfo(expr, receiver.nameSpan);
            }
        }
        else {
            expr = this.translate(receiver);
        }
        let node;
        // Safe property/keyed reads will produce a ternary whose value is nullable.
        // We have to generate a similar ternary around the call.
        if (ast.receiver instanceof compiler.SafePropertyRead || ast.receiver instanceof compiler.SafeKeyedRead) {
            node = this.convertToSafeCall(ast, expr, args);
        }
        else {
            node = ts.factory.createCallExpression(expr, undefined, args);
        }
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitSafeCall(ast) {
        const args = ast.args.map((expr) => this.translate(expr));
        const expr = wrapForDiagnostics(this.translate(ast.receiver));
        const node = this.convertToSafeCall(ast, expr, args);
        addParseSpanInfo(node, ast.sourceSpan);
        return node;
    }
    visitTemplateLiteral(ast) {
        const length = ast.elements.length;
        const head = ast.elements[0];
        let result;
        if (length === 1) {
            result = ts.factory.createNoSubstitutionTemplateLiteral(head.text);
        }
        else {
            const spans = [];
            const tailIndex = length - 1;
            for (let i = 1; i < tailIndex; i++) {
                const middle = ts.factory.createTemplateMiddle(ast.elements[i].text);
                spans.push(ts.factory.createTemplateSpan(this.translate(ast.expressions[i - 1]), middle));
            }
            const resolvedExpression = this.translate(ast.expressions[tailIndex - 1]);
            const templateTail = ts.factory.createTemplateTail(ast.elements[tailIndex].text);
            spans.push(ts.factory.createTemplateSpan(resolvedExpression, templateTail));
            result = ts.factory.createTemplateExpression(ts.factory.createTemplateHead(head.text), spans);
        }
        return result;
    }
    visitTemplateLiteralElement(ast, context) {
        throw new Error('Method not implemented');
    }
    visitTaggedTemplateLiteral(ast) {
        return ts.factory.createTaggedTemplateExpression(this.translate(ast.tag), undefined, this.visitTemplateLiteral(ast.template));
    }
    visitParenthesizedExpression(ast) {
        return ts.factory.createParenthesizedExpression(this.translate(ast.expression));
    }
    convertToSafeCall(ast, expr, args) {
        if (this.config.strictSafeNavigationTypes) {
            // "a?.method(...)" becomes (0 as any ? a!.method(...) : undefined)
            const call = ts.factory.createCallExpression(ts.factory.createNonNullExpression(expr), undefined, args);
            return ts.factory.createParenthesizedExpression(ts.factory.createConditionalExpression(ANY_EXPRESSION, undefined, call, undefined, UNDEFINED));
        }
        if (VeSafeLhsInferenceBugDetector.veWillInferAnyFor(ast)) {
            // "a?.method(...)" becomes (a as any).method(...)
            return ts.factory.createCallExpression(tsCastToAny(expr), undefined, args);
        }
        // "a?.method(...)" becomes (a!.method(...) as any)
        return tsCastToAny(ts.factory.createCallExpression(ts.factory.createNonNullExpression(expr), undefined, args));
    }
}
/**
 * Checks whether View Engine will infer a type of 'any' for the left-hand side of a safe navigation
 * operation.
 *
 * In View Engine's template type-checker, certain receivers of safe navigation operations will
 * cause a temporary variable to be allocated as part of the checking expression, to save the value
 * of the receiver and use it more than once in the expression. This temporary variable has type
 * 'any'. In practice, this means certain receivers cause View Engine to not check the full
 * expression, and other receivers will receive more complete checking.
 *
 * For compatibility, this logic is adapted from View Engine's expression_converter.ts so that the
 * Ivy checker can emulate this bug when needed.
 */
class VeSafeLhsInferenceBugDetector {
    static SINGLETON = new VeSafeLhsInferenceBugDetector();
    static veWillInferAnyFor(ast) {
        const visitor = VeSafeLhsInferenceBugDetector.SINGLETON;
        return ast instanceof compiler.Call ? ast.visit(visitor) : ast.receiver.visit(visitor);
    }
    visitUnary(ast) {
        return ast.expr.visit(this);
    }
    visitBinary(ast) {
        return ast.left.visit(this) || ast.right.visit(this);
    }
    visitChain(ast) {
        return false;
    }
    visitConditional(ast) {
        return ast.condition.visit(this) || ast.trueExp.visit(this) || ast.falseExp.visit(this);
    }
    visitCall(ast) {
        return true;
    }
    visitSafeCall(ast) {
        return false;
    }
    visitImplicitReceiver(ast) {
        return false;
    }
    visitThisReceiver(ast) {
        return false;
    }
    visitInterpolation(ast) {
        return ast.expressions.some((exp) => exp.visit(this));
    }
    visitKeyedRead(ast) {
        return false;
    }
    visitKeyedWrite(ast) {
        return false;
    }
    visitLiteralArray(ast) {
        return true;
    }
    visitLiteralMap(ast) {
        return true;
    }
    visitLiteralPrimitive(ast) {
        return false;
    }
    visitPipe(ast) {
        return true;
    }
    visitPrefixNot(ast) {
        return ast.expression.visit(this);
    }
    visitTypeofExpression(ast) {
        return ast.expression.visit(this);
    }
    visitVoidExpression(ast) {
        return ast.expression.visit(this);
    }
    visitNonNullAssert(ast) {
        return ast.expression.visit(this);
    }
    visitPropertyRead(ast) {
        return false;
    }
    visitPropertyWrite(ast) {
        return false;
    }
    visitSafePropertyRead(ast) {
        return false;
    }
    visitSafeKeyedRead(ast) {
        return false;
    }
    visitTemplateLiteral(ast, context) {
        return false;
    }
    visitTemplateLiteralElement(ast, context) {
        return false;
    }
    visitTaggedTemplateLiteral(ast, context) {
        return false;
    }
    visitParenthesizedExpression(ast, context) {
        return ast.expression.visit(this);
    }
}

/**
 * Controls how generics for the component context class will be handled during TCB generation.
 */
var TcbGenericContextBehavior;
(function (TcbGenericContextBehavior) {
    /**
     * References to generic parameter bounds will be emitted via the `TypeParameterEmitter`.
     *
     * The caller must verify that all parameter bounds are emittable in order to use this mode.
     */
    TcbGenericContextBehavior[TcbGenericContextBehavior["UseEmitter"] = 0] = "UseEmitter";
    /**
     * Generic parameter declarations will be copied directly from the `ts.ClassDeclaration` of the
     * component class.
     *
     * The caller must only use the generated TCB code in a context where such copies will still be
     * valid, such as an inline type check block.
     */
    TcbGenericContextBehavior[TcbGenericContextBehavior["CopyClassNodes"] = 1] = "CopyClassNodes";
    /**
     * Any generic parameters for the component context class will be set to `any`.
     *
     * Produces a less useful type, but is always safe to use.
     */
    TcbGenericContextBehavior[TcbGenericContextBehavior["FallbackToAny"] = 2] = "FallbackToAny";
})(TcbGenericContextBehavior || (TcbGenericContextBehavior = {}));
/**
 * Given a `ts.ClassDeclaration` for a component, and metadata regarding that component, compose a
 * "type check block" function.
 *
 * When passed through TypeScript's TypeChecker, type errors that arise within the type check block
 * function indicate issues in the template itself.
 *
 * As a side effect of generating a TCB for the component, `ts.Diagnostic`s may also be produced
 * directly for issues within the template which are identified during generation. These issues are
 * recorded in either the `domSchemaChecker` (which checks usage of DOM elements and bindings) as
 * well as the `oobRecorder` (which records errors when the type-checking code generator is unable
 * to sufficiently understand a template).
 *
 * @param env an `Environment` into which type-checking code will be generated.
 * @param ref a `Reference` to the component class which should be type-checked.
 * @param name a `ts.Identifier` to use for the generated `ts.FunctionDeclaration`.
 * @param meta metadata about the component's template and the function being generated.
 * @param domSchemaChecker used to check and record errors regarding improper usage of DOM elements
 * and bindings.
 * @param oobRecorder used to record errors regarding template elements which could not be correctly
 * translated into types during TCB generation.
 * @param genericContextBehavior controls how generic parameters (especially parameters with generic
 * bounds) will be referenced from the generated TCB code.
 */
function generateTypeCheckBlock(env, ref, name, meta, domSchemaChecker, oobRecorder, genericContextBehavior) {
    const tcb = new Context(env, domSchemaChecker, oobRecorder, meta.id, meta.boundTarget, meta.pipes, meta.schemas, meta.isStandalone, meta.preserveWhitespaces);
    const ctxRawType = env.referenceType(ref);
    if (!ts.isTypeReferenceNode(ctxRawType)) {
        throw new Error(`Expected TypeReferenceNode when referencing the ctx param for ${ref.debugName}`);
    }
    let typeParameters = undefined;
    let typeArguments = undefined;
    if (ref.node.typeParameters !== undefined) {
        if (!env.config.useContextGenericType) {
            genericContextBehavior = TcbGenericContextBehavior.FallbackToAny;
        }
        switch (genericContextBehavior) {
            case TcbGenericContextBehavior.UseEmitter:
                // Guaranteed to emit type parameters since we checked that the class has them above.
                typeParameters = new TypeParameterEmitter(ref.node.typeParameters, env.reflector).emit((typeRef) => env.referenceType(typeRef));
                typeArguments = typeParameters.map((param) => ts.factory.createTypeReferenceNode(param.name));
                break;
            case TcbGenericContextBehavior.CopyClassNodes:
                typeParameters = [...ref.node.typeParameters];
                typeArguments = typeParameters.map((param) => ts.factory.createTypeReferenceNode(param.name));
                break;
            case TcbGenericContextBehavior.FallbackToAny:
                typeArguments = ref.node.typeParameters.map(() => ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
                break;
        }
    }
    const paramList = [tcbThisParam(ctxRawType.typeName, typeArguments)];
    const statements = [];
    // Add the template type checking code.
    if (tcb.boundTarget.target.template !== undefined) {
        const templateScope = Scope.forNodes(tcb, null, null, tcb.boundTarget.target.template, 
        /* guard */ null);
        statements.push(renderBlockStatements(env, templateScope, ts.factory.createTrue()));
    }
    // Add the host bindings type checking code.
    if (tcb.boundTarget.target.host !== undefined) {
        const hostScope = Scope.forNodes(tcb, null, tcb.boundTarget.target.host, null, null);
        statements.push(renderBlockStatements(env, hostScope, createHostBindingsBlockGuard()));
    }
    const body = ts.factory.createBlock(statements);
    const fnDecl = ts.factory.createFunctionDeclaration(
    /* modifiers */ undefined, 
    /* asteriskToken */ undefined, 
    /* name */ name, 
    /* typeParameters */ env.config.useContextGenericType ? typeParameters : undefined, 
    /* parameters */ paramList, 
    /* type */ undefined, 
    /* body */ body);
    addTypeCheckId(fnDecl, meta.id);
    return fnDecl;
}
function renderBlockStatements(env, scope, wrapperExpression) {
    const scopeStatements = scope.render();
    const innerBody = ts.factory.createBlock([...env.getPreludeStatements(), ...scopeStatements]);
    // Wrap the body in an if statement. This serves two purposes:
    // 1. It allows us to distinguish between the sections of the block (e.g. host or template).
    // 2. It allows the `ts.Printer` to produce better-looking output.
    return ts.factory.createIfStatement(wrapperExpression, innerBody);
}
/**
 * A code generation operation that's involved in the construction of a Type Check Block.
 *
 * The generation of a TCB is non-linear. Bindings within a template may result in the need to
 * construct certain types earlier than they otherwise would be constructed. That is, if the
 * generation of a TCB for a template is broken down into specific operations (constructing a
 * directive, extracting a variable from a let- operation, etc), then it's possible for operations
 * earlier in the sequence to depend on operations which occur later in the sequence.
 *
 * `TcbOp` abstracts the different types of operations which are required to convert a template into
 * a TCB. This allows for two phases of processing for the template, where 1) a linear sequence of
 * `TcbOp`s is generated, and then 2) these operations are executed, not necessarily in linear
 * order.
 *
 * Each `TcbOp` may insert statements into the body of the TCB, and also optionally return a
 * `ts.Expression` which can be used to reference the operation's result.
 */
class TcbOp {
    /**
     * Replacement value or operation used while this `TcbOp` is executing (i.e. to resolve circular
     * references during its execution).
     *
     * This is usually a `null!` expression (which asks TS to infer an appropriate type), but another
     * `TcbOp` can be returned in cases where additional code generation is necessary to deal with
     * circular references.
     */
    circularFallback() {
        return INFER_TYPE_FOR_CIRCULAR_OP_EXPR;
    }
}
/**
 * A `TcbOp` which creates an expression for a native DOM element (or web component) from a
 * `TmplAstElement`.
 *
 * Executing this operation returns a reference to the element variable.
 */
class TcbElementOp extends TcbOp {
    tcb;
    scope;
    element;
    constructor(tcb, scope, element) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.element = element;
    }
    get optional() {
        // The statement generated by this operation is only used for type-inference of the DOM
        // element's type and won't report diagnostics by itself, so the operation is marked as optional
        // to avoid generating statements for DOM elements that are never referenced.
        return true;
    }
    execute() {
        const id = this.tcb.allocateId();
        // Add the declaration of the element using document.createElement.
        const initializer = tsCreateElement(this.element.name);
        addParseSpanInfo(initializer, this.element.startSourceSpan || this.element.sourceSpan);
        this.scope.addStatement(tsCreateVariable(id, initializer));
        return id;
    }
}
/**
 * A `TcbOp` which creates an expression for particular let- `TmplAstVariable` on a
 * `TmplAstTemplate`'s context.
 *
 * Executing this operation returns a reference to the variable variable (lol).
 */
class TcbTemplateVariableOp extends TcbOp {
    tcb;
    scope;
    template;
    variable;
    constructor(tcb, scope, template, variable) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.template = template;
        this.variable = variable;
    }
    get optional() {
        return false;
    }
    execute() {
        // Look for a context variable for the template.
        const ctx = this.scope.resolve(this.template);
        // Allocate an identifier for the TmplAstVariable, and initialize it to a read of the variable
        // on the template context.
        const id = this.tcb.allocateId();
        const initializer = ts.factory.createPropertyAccessExpression(
        /* expression */ ctx, 
        /* name */ this.variable.value || '$implicit');
        addParseSpanInfo(id, this.variable.keySpan);
        // Declare the variable, and return its identifier.
        let variable;
        if (this.variable.valueSpan !== undefined) {
            addParseSpanInfo(initializer, this.variable.valueSpan);
            variable = tsCreateVariable(id, wrapForTypeChecker(initializer));
        }
        else {
            variable = tsCreateVariable(id, initializer);
        }
        addParseSpanInfo(variable.declarationList.declarations[0], this.variable.sourceSpan);
        this.scope.addStatement(variable);
        return id;
    }
}
/**
 * A `TcbOp` which generates a variable for a `TmplAstTemplate`'s context.
 *
 * Executing this operation returns a reference to the template's context variable.
 */
class TcbTemplateContextOp extends TcbOp {
    tcb;
    scope;
    constructor(tcb, scope) {
        super();
        this.tcb = tcb;
        this.scope = scope;
    }
    // The declaration of the context variable is only needed when the context is actually referenced.
    optional = true;
    execute() {
        // Allocate a template ctx variable and declare it with an 'any' type. The type of this variable
        // may be narrowed as a result of template guard conditions.
        const ctx = this.tcb.allocateId();
        const type = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        this.scope.addStatement(tsDeclareVariable(ctx, type));
        return ctx;
    }
}
/**
 * A `TcbOp` which generates a constant for a `TmplAstLetDeclaration`.
 *
 * Executing this operation returns a reference to the `@let` declaration.
 */
class TcbLetDeclarationOp extends TcbOp {
    tcb;
    scope;
    node;
    constructor(tcb, scope, node) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
    }
    /**
     * `@let` declarations are mandatory, because their expressions
     * should be checked even if they aren't referenced anywhere.
     */
    optional = false;
    execute() {
        const id = this.tcb.allocateId();
        addParseSpanInfo(id, this.node.nameSpan);
        const value = tcbExpression(this.node.value, this.tcb, this.scope);
        // Value needs to be wrapped, because spans for the expressions inside of it can
        // be picked up incorrectly as belonging to the full variable declaration.
        const varStatement = tsCreateVariable(id, wrapForTypeChecker(value), ts.NodeFlags.Const);
        addParseSpanInfo(varStatement.declarationList.declarations[0], this.node.sourceSpan);
        this.scope.addStatement(varStatement);
        return id;
    }
}
/**
 * A `TcbOp` which descends into a `TmplAstTemplate`'s children and generates type-checking code for
 * them.
 *
 * This operation wraps the children's type-checking code in an `if` block, which may include one
 * or more type guard conditions that narrow types within the template body.
 */
class TcbTemplateBodyOp extends TcbOp {
    tcb;
    scope;
    template;
    constructor(tcb, scope, template) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.template = template;
    }
    get optional() {
        return false;
    }
    execute() {
        // An `if` will be constructed, within which the template's children will be type checked. The
        // `if` is used for two reasons: it creates a new syntactic scope, isolating variables declared
        // in the template's TCB from the outer context, and it allows any directives on the templates
        // to perform type narrowing of either expressions or the template's context.
        //
        // The guard is the `if` block's condition. It's usually set to `true` but directives that exist
        // on the template can trigger extra guard expressions that serve to narrow types within the
        // `if`. `guard` is calculated by starting with `true` and adding other conditions as needed.
        // Collect these into `guards` by processing the directives.
        // By default the guard is simply `true`.
        let guard = null;
        const directiveGuards = [];
        this.addDirectiveGuards(directiveGuards, this.template, this.tcb.boundTarget.getDirectivesOfNode(this.template));
        for (const directive of this.template.directives) {
            this.addDirectiveGuards(directiveGuards, directive, this.tcb.boundTarget.getDirectivesOfNode(directive));
        }
        // If there are any guards from directives, use them instead.
        if (directiveGuards.length > 0) {
            // Pop the first value and use it as the initializer to reduce(). This way, a single guard
            // will be used on its own, but two or more will be combined into binary AND expressions.
            guard = directiveGuards.reduce((expr, dirGuard) => ts.factory.createBinaryExpression(expr, ts.SyntaxKind.AmpersandAmpersandToken, dirGuard), directiveGuards.pop());
        }
        // Create a new Scope for the template. This constructs the list of operations for the template
        // children, as well as tracks bindings within the template.
        const tmplScope = Scope.forNodes(this.tcb, this.scope, this.template, this.template.children, guard);
        // Render the template's `Scope` into its statements.
        const statements = tmplScope.render();
        if (statements.length === 0) {
            // As an optimization, don't generate the scope's block if it has no statements. This is
            // beneficial for templates that contain for example `<span *ngIf="first"></span>`, in which
            // case there's no need to render the `NgIf` guard expression. This seems like a minor
            // improvement, however it reduces the number of flow-node antecedents that TypeScript needs
            // to keep into account for such cases, resulting in an overall reduction of
            // type-checking time.
            return null;
        }
        let tmplBlock = ts.factory.createBlock(statements);
        if (guard !== null) {
            // The scope has a guard that needs to be applied, so wrap the template block into an `if`
            // statement containing the guard expression.
            tmplBlock = ts.factory.createIfStatement(
            /* expression */ guard, 
            /* thenStatement */ tmplBlock);
        }
        this.scope.addStatement(tmplBlock);
        return null;
    }
    addDirectiveGuards(guards, hostNode, directives) {
        if (directives === null || directives.length === 0) {
            return;
        }
        const isTemplate = hostNode instanceof compiler.Template;
        for (const dir of directives) {
            const dirInstId = this.scope.resolve(hostNode, dir);
            const dirId = this.tcb.env.reference(dir.ref);
            // There are two kinds of guards. Template guards (ngTemplateGuards) allow type narrowing of
            // the expression passed to an @Input of the directive. Scan the directive to see if it has
            // any template guards, and generate them if needed.
            dir.ngTemplateGuards.forEach((guard) => {
                // For each template guard function on the directive, look for a binding to that input.
                const boundInput = hostNode.inputs.find((i) => i.name === guard.inputName) ||
                    (isTemplate
                        ? hostNode.templateAttrs.find((input) => {
                            return input instanceof compiler.BoundAttribute && input.name === guard.inputName;
                        })
                        : undefined);
                if (boundInput !== undefined) {
                    // If there is such a binding, generate an expression for it.
                    const expr = tcbExpression(boundInput.value, this.tcb, this.scope);
                    // The expression has already been checked in the type constructor invocation, so
                    // it should be ignored when used within a template guard.
                    markIgnoreDiagnostics(expr);
                    if (guard.type === 'binding') {
                        // Use the binding expression itself as guard.
                        guards.push(expr);
                    }
                    else {
                        // Call the guard function on the directive with the directive instance and that
                        // expression.
                        const guardInvoke = tsCallMethod(dirId, `ngTemplateGuard_${guard.inputName}`, [
                            dirInstId,
                            expr,
                        ]);
                        addParseSpanInfo(guardInvoke, boundInput.value.sourceSpan);
                        guards.push(guardInvoke);
                    }
                }
            });
            // The second kind of guard is a template context guard. This guard narrows the template
            // rendering context variable `ctx`.
            if (dir.hasNgTemplateContextGuard) {
                if (this.tcb.env.config.applyTemplateContextGuards) {
                    const ctx = this.scope.resolve(hostNode);
                    const guardInvoke = tsCallMethod(dirId, 'ngTemplateContextGuard', [dirInstId, ctx]);
                    addParseSpanInfo(guardInvoke, hostNode.sourceSpan);
                    guards.push(guardInvoke);
                }
                else if (isTemplate &&
                    hostNode.variables.length > 0 &&
                    this.tcb.env.config.suggestionsForSuboptimalTypeInference) {
                    // The compiler could have inferred a better type for the variables in this template,
                    // but was prevented from doing so by the type-checking configuration. Issue a warning
                    // diagnostic.
                    this.tcb.oobRecorder.suboptimalTypeInference(this.tcb.id, hostNode.variables);
                }
            }
        }
    }
}
/**
 * A `TcbOp` which renders an Angular expression (e.g. `{{foo() && bar.baz}}`).
 *
 * Executing this operation returns nothing.
 */
class TcbExpressionOp extends TcbOp {
    tcb;
    scope;
    expression;
    constructor(tcb, scope, expression) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.expression = expression;
    }
    get optional() {
        return false;
    }
    execute() {
        const expr = tcbExpression(this.expression, this.tcb, this.scope);
        this.scope.addStatement(ts.factory.createExpressionStatement(expr));
        return null;
    }
}
/**
 * A `TcbOp` which constructs an instance of a directive. For generic directives, generic
 * parameters are set to `any` type.
 */
class TcbDirectiveTypeOpBase extends TcbOp {
    tcb;
    scope;
    node;
    dir;
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        // The statement generated by this operation is only used to declare the directive's type and
        // won't report diagnostics by itself, so the operation is marked as optional to avoid
        // generating declarations for directives that don't have any inputs/outputs.
        return true;
    }
    execute() {
        const dirRef = this.dir.ref;
        const rawType = this.tcb.env.referenceType(this.dir.ref);
        let type;
        if (this.dir.isGeneric === false || dirRef.node.typeParameters === undefined) {
            type = rawType;
        }
        else {
            if (!ts.isTypeReferenceNode(rawType)) {
                throw new Error(`Expected TypeReferenceNode when referencing the type for ${this.dir.ref.debugName}`);
            }
            const typeArguments = dirRef.node.typeParameters.map(() => ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
            type = ts.factory.createTypeReferenceNode(rawType.typeName, typeArguments);
        }
        const id = this.tcb.allocateId();
        addExpressionIdentifier(id, ExpressionIdentifier.DIRECTIVE);
        addParseSpanInfo(id, this.node.startSourceSpan || this.node.sourceSpan);
        this.scope.addStatement(tsDeclareVariable(id, type));
        return id;
    }
}
/**
 * A `TcbOp` which constructs an instance of a non-generic directive _without_ setting any of its
 * inputs. Inputs are later set in the `TcbDirectiveInputsOp`. Type checking was found to be
 * faster when done in this way as opposed to `TcbDirectiveCtorOp` which is only necessary when the
 * directive is generic.
 *
 * Executing this operation returns a reference to the directive instance variable with its inferred
 * type.
 */
class TcbNonGenericDirectiveTypeOp extends TcbDirectiveTypeOpBase {
    /**
     * Creates a variable declaration for this op's directive of the argument type. Returns the id of
     * the newly created variable.
     */
    execute() {
        const dirRef = this.dir.ref;
        if (this.dir.isGeneric) {
            throw new Error(`Assertion Error: expected ${dirRef.debugName} not to be generic.`);
        }
        return super.execute();
    }
}
/**
 * A `TcbOp` which constructs an instance of a generic directive with its generic parameters set
 * to `any` type. This op is like `TcbDirectiveTypeOp`, except that generic parameters are set to
 * `any` type. This is used for situations where we want to avoid inlining.
 *
 * Executing this operation returns a reference to the directive instance variable with its generic
 * type parameters set to `any`.
 */
class TcbGenericDirectiveTypeWithAnyParamsOp extends TcbDirectiveTypeOpBase {
    execute() {
        const dirRef = this.dir.ref;
        if (dirRef.node.typeParameters === undefined) {
            throw new Error(`Assertion Error: expected typeParameters when creating a declaration for ${dirRef.debugName}`);
        }
        return super.execute();
    }
}
/**
 * A `TcbOp` which creates a variable for a local ref in a template.
 * The initializer for the variable is the variable expression for the directive, template, or
 * element the ref refers to. When the reference is used in the template, those TCB statements will
 * access this variable as well. For example:
 * ```ts
 * var _t1 = document.createElement('div');
 * var _t2 = _t1;
 * _t2.value
 * ```
 * This operation supports more fluent lookups for the `TemplateTypeChecker` when getting a symbol
 * for a reference. In most cases, this isn't essential; that is, the information for the symbol
 * could be gathered without this operation using the `BoundTarget`. However, for the case of
 * ng-template references, we will need this reference variable to not only provide a location in
 * the shim file, but also to narrow the variable to the correct `TemplateRef<T>` type rather than
 * `TemplateRef<any>` (this work is still TODO).
 *
 * Executing this operation returns a reference to the directive instance variable with its inferred
 * type.
 */
class TcbReferenceOp extends TcbOp {
    tcb;
    scope;
    node;
    host;
    target;
    constructor(tcb, scope, node, host, target) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.host = host;
        this.target = target;
    }
    // The statement generated by this operation is only used to for the Type Checker
    // so it can map a reference variable in the template directly to a node in the TCB.
    optional = true;
    execute() {
        const id = this.tcb.allocateId();
        let initializer = this.target instanceof compiler.Template || this.target instanceof compiler.Element
            ? this.scope.resolve(this.target)
            : this.scope.resolve(this.host, this.target);
        // The reference is either to an element, an <ng-template> node, or to a directive on an
        // element or template.
        if ((this.target instanceof compiler.Element && !this.tcb.env.config.checkTypeOfDomReferences) ||
            !this.tcb.env.config.checkTypeOfNonDomReferences) {
            // References to DOM nodes are pinned to 'any' when `checkTypeOfDomReferences` is `false`.
            // References to `TemplateRef`s and directives are pinned to 'any' when
            // `checkTypeOfNonDomReferences` is `false`.
            initializer = ts.factory.createAsExpression(initializer, ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        }
        else if (this.target instanceof compiler.Template) {
            // Direct references to an <ng-template> node simply require a value of type
            // `TemplateRef<any>`. To get this, an expression of the form
            // `(_t1 as any as TemplateRef<any>)` is constructed.
            initializer = ts.factory.createAsExpression(initializer, ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
            initializer = ts.factory.createAsExpression(initializer, this.tcb.env.referenceExternalType('@angular/core', 'TemplateRef', [compiler.DYNAMIC_TYPE]));
            initializer = ts.factory.createParenthesizedExpression(initializer);
        }
        addParseSpanInfo(initializer, this.node.sourceSpan);
        addParseSpanInfo(id, this.node.keySpan);
        this.scope.addStatement(tsCreateVariable(id, initializer));
        return id;
    }
}
/**
 * A `TcbOp` which is used when the target of a reference is missing. This operation generates a
 * variable of type any for usages of the invalid reference to resolve to. The invalid reference
 * itself is recorded out-of-band.
 */
class TcbInvalidReferenceOp extends TcbOp {
    tcb;
    scope;
    constructor(tcb, scope) {
        super();
        this.tcb = tcb;
        this.scope = scope;
    }
    // The declaration of a missing reference is only needed when the reference is resolved.
    optional = true;
    execute() {
        const id = this.tcb.allocateId();
        this.scope.addStatement(tsCreateVariable(id, ANY_EXPRESSION));
        return id;
    }
}
/**
 * A `TcbOp` which constructs an instance of a directive with types inferred from its inputs. The
 * inputs themselves are not checked here; checking of inputs is achieved in `TcbDirectiveInputsOp`.
 * Any errors reported in this statement are ignored, as the type constructor call is only present
 * for type-inference.
 *
 * When a Directive is generic, it is required that the TCB generates the instance using this method
 * in order to infer the type information correctly.
 *
 * Executing this operation returns a reference to the directive instance variable with its inferred
 * type.
 */
class TcbDirectiveCtorOp extends TcbOp {
    tcb;
    scope;
    node;
    dir;
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        // The statement generated by this operation is only used to infer the directive's type and
        // won't report diagnostics by itself, so the operation is marked as optional.
        return true;
    }
    execute() {
        const id = this.tcb.allocateId();
        addExpressionIdentifier(id, ExpressionIdentifier.DIRECTIVE);
        addParseSpanInfo(id, this.node.startSourceSpan || this.node.sourceSpan);
        const genericInputs = new Map();
        const boundAttrs = getBoundAttributes(this.dir, this.node);
        for (const attr of boundAttrs) {
            // Skip text attributes if configured to do so.
            if (!this.tcb.env.config.checkTypeOfAttributes &&
                attr.attribute instanceof compiler.TextAttribute) {
                continue;
            }
            for (const { fieldName, isTwoWayBinding } of attr.inputs) {
                // Skip the field if an attribute has already been bound to it; we can't have a duplicate
                // key in the type constructor call.
                if (genericInputs.has(fieldName)) {
                    continue;
                }
                const expression = translateInput(attr.attribute, this.tcb, this.scope);
                genericInputs.set(fieldName, {
                    type: 'binding',
                    field: fieldName,
                    expression,
                    sourceSpan: attr.attribute.sourceSpan,
                    isTwoWayBinding,
                });
            }
        }
        // Add unset directive inputs for each of the remaining unset fields.
        for (const { classPropertyName } of this.dir.inputs) {
            if (!genericInputs.has(classPropertyName)) {
                genericInputs.set(classPropertyName, { type: 'unset', field: classPropertyName });
            }
        }
        // Call the type constructor of the directive to infer a type, and assign the directive
        // instance.
        const typeCtor = tcbCallTypeCtor(this.dir, this.tcb, Array.from(genericInputs.values()));
        markIgnoreDiagnostics(typeCtor);
        this.scope.addStatement(tsCreateVariable(id, typeCtor));
        return id;
    }
    circularFallback() {
        return new TcbDirectiveCtorCircularFallbackOp(this.tcb, this.scope, this.dir);
    }
}
/**
 * A `TcbOp` which generates code to check input bindings on an element that correspond with the
 * members of a directive.
 *
 * Executing this operation returns nothing.
 */
class TcbDirectiveInputsOp extends TcbOp {
    tcb;
    scope;
    node;
    dir;
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        return false;
    }
    execute() {
        let dirId = null;
        // TODO(joost): report duplicate properties
        const boundAttrs = getBoundAttributes(this.dir, this.node);
        const seenRequiredInputs = new Set();
        for (const attr of boundAttrs) {
            // For bound inputs, the property is assigned the binding expression.
            const expr = widenBinding(translateInput(attr.attribute, this.tcb, this.scope), this.tcb);
            let assignment = wrapForDiagnostics(expr);
            for (const { fieldName, required, transformType, isSignal, isTwoWayBinding } of attr.inputs) {
                let target;
                if (required) {
                    seenRequiredInputs.add(fieldName);
                }
                // Note: There is no special logic for transforms/coercion with signal inputs.
                // For signal inputs, a `transformType` will never be set as we do not capture
                // the transform in the compiler metadata. Signal inputs incorporate their
                // transform write type into their member type, and we extract it below when
                // setting the `WriteT` of such `InputSignalWithTransform<_, WriteT>`.
                if (this.dir.coercedInputFields.has(fieldName)) {
                    let type;
                    if (transformType !== null) {
                        type = this.tcb.env.referenceTransplantedType(new compiler.TransplantedType(transformType));
                    }
                    else {
                        // The input has a coercion declaration which should be used instead of assigning the
                        // expression into the input field directly. To achieve this, a variable is declared
                        // with a type of `typeof Directive.ngAcceptInputType_fieldName` which is then used as
                        // target of the assignment.
                        const dirTypeRef = this.tcb.env.referenceType(this.dir.ref);
                        if (!ts.isTypeReferenceNode(dirTypeRef)) {
                            throw new Error(`Expected TypeReferenceNode from reference to ${this.dir.ref.debugName}`);
                        }
                        type = tsCreateTypeQueryForCoercedInput(dirTypeRef.typeName, fieldName);
                    }
                    const id = this.tcb.allocateId();
                    this.scope.addStatement(tsDeclareVariable(id, type));
                    target = id;
                }
                else if (this.dir.undeclaredInputFields.has(fieldName)) {
                    // If no coercion declaration is present nor is the field declared (i.e. the input is
                    // declared in a `@Directive` or `@Component` decorator's `inputs` property) there is no
                    // assignment target available, so this field is skipped.
                    continue;
                }
                else if (!this.tcb.env.config.honorAccessModifiersForInputBindings &&
                    this.dir.restrictedInputFields.has(fieldName)) {
                    // If strict checking of access modifiers is disabled and the field is restricted
                    // (i.e. private/protected/readonly), generate an assignment into a temporary variable
                    // that has the type of the field. This achieves type-checking but circumvents the access
                    // modifiers.
                    if (dirId === null) {
                        dirId = this.scope.resolve(this.node, this.dir);
                    }
                    const id = this.tcb.allocateId();
                    const dirTypeRef = this.tcb.env.referenceType(this.dir.ref);
                    if (!ts.isTypeReferenceNode(dirTypeRef)) {
                        throw new Error(`Expected TypeReferenceNode from reference to ${this.dir.ref.debugName}`);
                    }
                    const type = ts.factory.createIndexedAccessTypeNode(ts.factory.createTypeQueryNode(dirId), ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(fieldName)));
                    const temp = tsDeclareVariable(id, type);
                    this.scope.addStatement(temp);
                    target = id;
                }
                else {
                    if (dirId === null) {
                        dirId = this.scope.resolve(this.node, this.dir);
                    }
                    // To get errors assign directly to the fields on the instance, using property access
                    // when possible. String literal fields may not be valid JS identifiers so we use
                    // literal element access instead for those cases.
                    target = this.dir.stringLiteralInputFields.has(fieldName)
                        ? ts.factory.createElementAccessExpression(dirId, ts.factory.createStringLiteral(fieldName))
                        : ts.factory.createPropertyAccessExpression(dirId, ts.factory.createIdentifier(fieldName));
                }
                // For signal inputs, we unwrap the target `InputSignal`. Note that
                // we intentionally do the following things:
                //   1. keep the direct access to `dir.[field]` so that modifiers are honored.
                //   2. follow the existing pattern where multiple targets assign a single expression.
                //      This is a significant requirement for language service auto-completion.
                if (isSignal) {
                    const inputSignalBrandWriteSymbol = this.tcb.env.referenceExternalSymbol(compiler.Identifiers.InputSignalBrandWriteType.moduleName, compiler.Identifiers.InputSignalBrandWriteType.name);
                    if (!ts.isIdentifier(inputSignalBrandWriteSymbol) &&
                        !ts.isPropertyAccessExpression(inputSignalBrandWriteSymbol)) {
                        throw new Error(`Expected identifier or property access for reference to ${compiler.Identifiers.InputSignalBrandWriteType.name}`);
                    }
                    target = ts.factory.createElementAccessExpression(target, inputSignalBrandWriteSymbol);
                }
                if (attr.attribute.keySpan !== undefined) {
                    addParseSpanInfo(target, attr.attribute.keySpan);
                }
                // Two-way bindings accept `T | WritableSignal<T>` so we have to unwrap the value.
                if (isTwoWayBinding && this.tcb.env.config.allowSignalsInTwoWayBindings) {
                    assignment = unwrapWritableSignal(assignment, this.tcb);
                }
                // Finally the assignment is extended by assigning it into the target expression.
                assignment = ts.factory.createBinaryExpression(target, ts.SyntaxKind.EqualsToken, assignment);
            }
            addParseSpanInfo(assignment, attr.attribute.sourceSpan);
            // Ignore diagnostics for text attributes if configured to do so.
            if (!this.tcb.env.config.checkTypeOfAttributes &&
                attr.attribute instanceof compiler.TextAttribute) {
                markIgnoreDiagnostics(assignment);
            }
            this.scope.addStatement(ts.factory.createExpressionStatement(assignment));
        }
        this.checkRequiredInputs(seenRequiredInputs);
        return null;
    }
    checkRequiredInputs(seenRequiredInputs) {
        const missing = [];
        for (const input of this.dir.inputs) {
            if (input.required && !seenRequiredInputs.has(input.classPropertyName)) {
                missing.push(input.bindingPropertyName);
            }
        }
        if (missing.length > 0) {
            this.tcb.oobRecorder.missingRequiredInputs(this.tcb.id, this.node, this.dir.name, this.dir.isComponent, missing);
        }
    }
}
/**
 * A `TcbOp` which is used to generate a fallback expression if the inference of a directive type
 * via `TcbDirectiveCtorOp` requires a reference to its own type. This can happen using a template
 * reference:
 *
 * ```html
 * <some-cmp #ref [prop]="ref.foo"></some-cmp>
 * ```
 *
 * In this case, `TcbDirectiveCtorCircularFallbackOp` will add a second inference of the directive
 * type to the type-check block, this time calling the directive's type constructor without any
 * input expressions. This infers the widest possible supertype for the directive, which is used to
 * resolve any recursive references required to infer the real type.
 */
class TcbDirectiveCtorCircularFallbackOp extends TcbOp {
    tcb;
    scope;
    dir;
    constructor(tcb, scope, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.dir = dir;
    }
    get optional() {
        return false;
    }
    execute() {
        const id = this.tcb.allocateId();
        const typeCtor = this.tcb.env.typeCtorFor(this.dir);
        const circularPlaceholder = ts.factory.createCallExpression(typeCtor, 
        /* typeArguments */ undefined, [ts.factory.createNonNullExpression(ts.factory.createNull())]);
        this.scope.addStatement(tsCreateVariable(id, circularPlaceholder));
        return id;
    }
}
/**
 * A `TcbOp` which feeds elements and unclaimed properties to the `DomSchemaChecker`.
 *
 * The DOM schema is not checked via TCB code generation. Instead, the `DomSchemaChecker` ingests
 * elements and property bindings and accumulates synthetic `ts.Diagnostic`s out-of-band. These are
 * later merged with the diagnostics generated from the TCB.
 *
 * For convenience, the TCB iteration of the template is used to drive the `DomSchemaChecker` via
 * the `TcbDomSchemaCheckerOp`.
 */
class TcbDomSchemaCheckerOp extends TcbOp {
    tcb;
    element;
    checkElement;
    claimedInputs;
    constructor(tcb, element, checkElement, claimedInputs) {
        super();
        this.tcb = tcb;
        this.element = element;
        this.checkElement = checkElement;
        this.claimedInputs = claimedInputs;
    }
    get optional() {
        return false;
    }
    execute() {
        const element = this.element;
        const isTemplateElement = element instanceof compiler.Element || element instanceof compiler.Component;
        const bindings = isTemplateElement ? element.inputs : element.bindings;
        if (this.checkElement && isTemplateElement) {
            this.tcb.domSchemaChecker.checkElement(this.tcb.id, this.getTagName(element), element.startSourceSpan, this.tcb.schemas, this.tcb.hostIsStandalone);
        }
        // TODO(alxhub): this could be more efficient.
        for (const binding of bindings) {
            const isPropertyBinding = binding.type === compiler.BindingType.Property || binding.type === compiler.BindingType.TwoWay;
            if (isPropertyBinding && this.claimedInputs?.has(binding.name)) {
                // Skip this binding as it was claimed by a directive.
                continue;
            }
            if (isPropertyBinding && binding.name !== 'style' && binding.name !== 'class') {
                // A direct binding to a property.
                const propertyName = ATTR_TO_PROP.get(binding.name) ?? binding.name;
                if (isTemplateElement) {
                    this.tcb.domSchemaChecker.checkTemplateElementProperty(this.tcb.id, this.getTagName(element), propertyName, binding.sourceSpan, this.tcb.schemas, this.tcb.hostIsStandalone);
                }
                else {
                    this.tcb.domSchemaChecker.checkHostElementProperty(this.tcb.id, element, propertyName, binding.keySpan, this.tcb.schemas);
                }
            }
        }
        return null;
    }
    getTagName(node) {
        return node instanceof compiler.Element ? node.name : getComponentTagName(node);
    }
}
/**
 * A `TcbOp` that finds and flags control flow nodes that interfere with content projection.
 *
 * Context:
 * Control flow blocks try to emulate the content projection behavior of `*ngIf` and `*ngFor`
 * in order to reduce breakages when moving from one syntax to the other (see #52414), however the
 * approach only works if there's only one element at the root of the control flow expression.
 * This means that a stray sibling node (e.g. text) can prevent an element from being projected
 * into the right slot. The purpose of the `TcbOp` is to find any places where a node at the root
 * of a control flow expression *would have been projected* into a specific slot, if the control
 * flow node didn't exist.
 */
class TcbControlFlowContentProjectionOp extends TcbOp {
    tcb;
    element;
    ngContentSelectors;
    componentName;
    category;
    constructor(tcb, element, ngContentSelectors, componentName) {
        super();
        this.tcb = tcb;
        this.element = element;
        this.ngContentSelectors = ngContentSelectors;
        this.componentName = componentName;
        // We only need to account for `error` and `warning` since
        // this check won't be enabled for `suppress`.
        this.category =
            tcb.env.config.controlFlowPreventingContentProjection === 'error'
                ? ts.DiagnosticCategory.Error
                : ts.DiagnosticCategory.Warning;
    }
    optional = false;
    execute() {
        const controlFlowToCheck = this.findPotentialControlFlowNodes();
        if (controlFlowToCheck.length > 0) {
            const matcher = new compiler.SelectorMatcher();
            for (const selector of this.ngContentSelectors) {
                // `*` is a special selector for the catch-all slot.
                if (selector !== '*') {
                    matcher.addSelectables(compiler.CssSelector.parse(selector), selector);
                }
            }
            for (const root of controlFlowToCheck) {
                for (const child of root.children) {
                    if (child instanceof compiler.Element || child instanceof compiler.Template) {
                        matcher.match(compiler.createCssSelectorFromNode(child), (_, originalSelector) => {
                            this.tcb.oobRecorder.controlFlowPreventingContentProjection(this.tcb.id, this.category, child, this.componentName, originalSelector, root, this.tcb.hostPreserveWhitespaces);
                        });
                    }
                }
            }
        }
        return null;
    }
    findPotentialControlFlowNodes() {
        const result = [];
        for (const child of this.element.children) {
            if (child instanceof compiler.ForLoopBlock) {
                if (this.shouldCheck(child)) {
                    result.push(child);
                }
                if (child.empty !== null && this.shouldCheck(child.empty)) {
                    result.push(child.empty);
                }
            }
            else if (child instanceof compiler.IfBlock) {
                for (const branch of child.branches) {
                    if (this.shouldCheck(branch)) {
                        result.push(branch);
                    }
                }
            }
            else if (child instanceof compiler.SwitchBlock) {
                for (const current of child.cases) {
                    if (this.shouldCheck(current)) {
                        result.push(current);
                    }
                }
            }
        }
        return result;
    }
    shouldCheck(node) {
        // Skip nodes with less than two children since it's impossible
        // for them to run into the issue that we're checking for.
        if (node.children.length < 2) {
            return false;
        }
        let hasSeenRootNode = false;
        // Check the number of root nodes while skipping empty text where relevant.
        for (const child of node.children) {
            // Normally `preserveWhitspaces` would have been accounted for during parsing, however
            // in `ngtsc/annotations/component/src/resources.ts#parseExtractedTemplate` we enable
            // `preserveWhitespaces` to preserve the accuracy of source maps diagnostics. This means
            // that we have to account for it here since the presence of text nodes affects the
            // content projection behavior.
            if (!(child instanceof compiler.Text$3) ||
                this.tcb.hostPreserveWhitespaces ||
                child.value.trim().length > 0) {
                // Content projection will be affected if there's more than one root node.
                if (hasSeenRootNode) {
                    return true;
                }
                hasSeenRootNode = true;
            }
        }
        return false;
    }
}
/**
 * A `TcbOp` which creates an expression for a the host element of a directive.
 *
 * Executing this operation returns a reference to the element variable.
 */
class TcbHostElementOp extends TcbOp {
    tcb;
    scope;
    element;
    optional = true;
    constructor(tcb, scope, element) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.element = element;
    }
    execute() {
        const id = this.tcb.allocateId();
        const initializer = tsCreateElement(...this.element.tagNames);
        addParseSpanInfo(initializer, this.element.sourceSpan);
        this.scope.addStatement(tsCreateVariable(id, initializer));
        return id;
    }
}
/**
 * A `TcbOp` which creates an expression for a native DOM element from a `TmplAstComponent`.
 *
 * Executing this operation returns a reference to the element variable.
 */
class TcbComponentNodeOp extends TcbOp {
    tcb;
    scope;
    component;
    optional = true;
    constructor(tcb, scope, component) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.component = component;
    }
    execute() {
        const id = this.tcb.allocateId();
        const initializer = tsCreateElement(getComponentTagName(this.component));
        addParseSpanInfo(initializer, this.component.startSourceSpan || this.component.sourceSpan);
        this.scope.addStatement(tsCreateVariable(id, initializer));
        return id;
    }
}
/**
 * Mapping between attributes names that don't correspond to their element property names.
 * Note: this mapping has to be kept in sync with the equally named mapping in the runtime.
 */
const ATTR_TO_PROP = new Map(Object.entries({
    'class': 'className',
    'for': 'htmlFor',
    'formaction': 'formAction',
    'innerHtml': 'innerHTML',
    'readonly': 'readOnly',
    'tabindex': 'tabIndex',
}));
/**
 * A `TcbOp` which generates code to check "unclaimed inputs" - bindings on an element which were
 * not attributed to any directive or component, and are instead processed against the HTML element
 * itself.
 *
 * Currently, only the expressions of these bindings are checked. The targets of the bindings are
 * checked against the DOM schema via a `TcbDomSchemaCheckerOp`.
 *
 * Executing this operation returns nothing.
 */
class TcbUnclaimedInputsOp extends TcbOp {
    tcb;
    scope;
    inputs;
    target;
    claimedInputs;
    constructor(tcb, scope, inputs, target, claimedInputs) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.inputs = inputs;
        this.target = target;
        this.claimedInputs = claimedInputs;
    }
    get optional() {
        return false;
    }
    execute() {
        // `this.inputs` contains only those bindings not matched by any directive. These bindings go to
        // the element itself.
        let elId = null;
        // TODO(alxhub): this could be more efficient.
        for (const binding of this.inputs) {
            const isPropertyBinding = binding.type === compiler.BindingType.Property || binding.type === compiler.BindingType.TwoWay;
            if (isPropertyBinding && this.claimedInputs?.has(binding.name)) {
                // Skip this binding as it was claimed by a directive.
                continue;
            }
            const expr = widenBinding(tcbExpression(binding.value, this.tcb, this.scope), this.tcb);
            if (this.tcb.env.config.checkTypeOfDomBindings && isPropertyBinding) {
                if (binding.name !== 'style' && binding.name !== 'class') {
                    if (elId === null) {
                        elId = this.scope.resolve(this.target);
                    }
                    // A direct binding to a property.
                    const propertyName = ATTR_TO_PROP.get(binding.name) ?? binding.name;
                    const prop = ts.factory.createElementAccessExpression(elId, ts.factory.createStringLiteral(propertyName));
                    const stmt = ts.factory.createBinaryExpression(prop, ts.SyntaxKind.EqualsToken, wrapForDiagnostics(expr));
                    addParseSpanInfo(stmt, binding.sourceSpan);
                    this.scope.addStatement(ts.factory.createExpressionStatement(stmt));
                }
                else {
                    this.scope.addStatement(ts.factory.createExpressionStatement(expr));
                }
            }
            else {
                // A binding to an animation, attribute, class or style. For now, only validate the right-
                // hand side of the expression.
                // TODO: properly check class and style bindings.
                this.scope.addStatement(ts.factory.createExpressionStatement(expr));
            }
        }
        return null;
    }
}
/**
 * A `TcbOp` which generates code to check event bindings on an element that correspond with the
 * outputs of a directive.
 *
 * Executing this operation returns nothing.
 */
class TcbDirectiveOutputsOp extends TcbOp {
    tcb;
    scope;
    node;
    dir;
    constructor(tcb, scope, node, dir) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.node = node;
        this.dir = dir;
    }
    get optional() {
        return false;
    }
    execute() {
        let dirId = null;
        const outputs = this.dir.outputs;
        for (const output of this.node.outputs) {
            if (output.type === compiler.ParsedEventType.Animation ||
                !outputs.hasBindingPropertyName(output.name)) {
                continue;
            }
            if (this.tcb.env.config.checkTypeOfOutputEvents && output.name.endsWith('Change')) {
                const inputName = output.name.slice(0, -6);
                checkSplitTwoWayBinding(inputName, output, this.node.inputs, this.tcb);
            }
            // TODO(alxhub): consider supporting multiple fields with the same property name for outputs.
            const field = outputs.getByBindingPropertyName(output.name)[0].classPropertyName;
            if (dirId === null) {
                dirId = this.scope.resolve(this.node, this.dir);
            }
            const outputField = ts.factory.createElementAccessExpression(dirId, ts.factory.createStringLiteral(field));
            addParseSpanInfo(outputField, output.keySpan);
            if (this.tcb.env.config.checkTypeOfOutputEvents) {
                // For strict checking of directive events, generate a call to the `subscribe` method
                // on the directive's output field to let type information flow into the handler function's
                // `$event` parameter.
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, 0 /* EventParamType.Infer */);
                const subscribeFn = ts.factory.createPropertyAccessExpression(outputField, 'subscribe');
                const call = ts.factory.createCallExpression(subscribeFn, /* typeArguments */ undefined, [
                    handler,
                ]);
                addParseSpanInfo(call, output.sourceSpan);
                this.scope.addStatement(ts.factory.createExpressionStatement(call));
            }
            else {
                // If strict checking of directive events is disabled:
                //
                // * We still generate the access to the output field as a statement in the TCB so consumers
                //   of the `TemplateTypeChecker` can still find the node for the class member for the
                //   output.
                // * Emit a handler function where the `$event` parameter has an explicit `any` type.
                this.scope.addStatement(ts.factory.createExpressionStatement(outputField));
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, 1 /* EventParamType.Any */);
                this.scope.addStatement(ts.factory.createExpressionStatement(handler));
            }
        }
        return null;
    }
}
/**
 * A `TcbOp` which generates code to check "unclaimed outputs" - event bindings on an element which
 * were not attributed to any directive or component, and are instead processed against the HTML
 * element itself.
 *
 * Executing this operation returns nothing.
 */
class TcbUnclaimedOutputsOp extends TcbOp {
    tcb;
    scope;
    target;
    outputs;
    inputs;
    claimedOutputs;
    constructor(tcb, scope, target, outputs, inputs, claimedOutputs) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.target = target;
        this.outputs = outputs;
        this.inputs = inputs;
        this.claimedOutputs = claimedOutputs;
    }
    get optional() {
        return false;
    }
    execute() {
        let elId = null;
        // TODO(alxhub): this could be more efficient.
        for (const output of this.outputs) {
            if (this.claimedOutputs?.has(output.name)) {
                // Skip this event handler as it was claimed by a directive.
                continue;
            }
            if (this.tcb.env.config.checkTypeOfOutputEvents &&
                this.inputs !== null &&
                output.name.endsWith('Change')) {
                const inputName = output.name.slice(0, -6);
                if (checkSplitTwoWayBinding(inputName, output, this.inputs, this.tcb)) {
                    // Skip this event handler as the error was already handled.
                    continue;
                }
            }
            if (output.type === compiler.ParsedEventType.Animation) {
                // Animation output bindings always have an `$event` parameter of type `AnimationEvent`.
                const eventType = this.tcb.env.config.checkTypeOfAnimationEvents
                    ? this.tcb.env.referenceExternalType('@angular/animations', 'AnimationEvent')
                    : 1 /* EventParamType.Any */;
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, eventType);
                this.scope.addStatement(ts.factory.createExpressionStatement(handler));
            }
            else if (this.tcb.env.config.checkTypeOfDomEvents) {
                // If strict checking of DOM events is enabled, generate a call to `addEventListener` on
                // the element instance so that TypeScript's type inference for
                // `HTMLElement.addEventListener` using `HTMLElementEventMap` to infer an accurate type for
                // `$event` depending on the event name. For unknown event names, TypeScript resorts to the
                // base `Event` type.
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, 0 /* EventParamType.Infer */);
                let target;
                // Only check for `window` and `document` since in theory any target can be passed.
                if (output.target === 'window' || output.target === 'document') {
                    target = ts.factory.createIdentifier(output.target);
                }
                else if (elId === null) {
                    target = elId = this.scope.resolve(this.target);
                }
                else {
                    target = elId;
                }
                const propertyAccess = ts.factory.createPropertyAccessExpression(target, 'addEventListener');
                addParseSpanInfo(propertyAccess, output.keySpan);
                const call = ts.factory.createCallExpression(
                /* expression */ propertyAccess, 
                /* typeArguments */ undefined, 
                /* arguments */ [ts.factory.createStringLiteral(output.name), handler]);
                addParseSpanInfo(call, output.sourceSpan);
                this.scope.addStatement(ts.factory.createExpressionStatement(call));
            }
            else {
                // If strict checking of DOM inputs is disabled, emit a handler function where the `$event`
                // parameter has an explicit `any` type.
                const handler = tcbCreateEventHandler(output, this.tcb, this.scope, 1 /* EventParamType.Any */);
                this.scope.addStatement(ts.factory.createExpressionStatement(handler));
            }
        }
        return null;
    }
}
/**
 * A `TcbOp` which generates a completion point for the component context.
 *
 * This completion point looks like `this. ;` in the TCB output, and does not produce diagnostics.
 * TypeScript autocompletion APIs can be used at this completion point (after the '.') to produce
 * autocompletion results of properties and methods from the template's component context.
 */
class TcbComponentContextCompletionOp extends TcbOp {
    scope;
    constructor(scope) {
        super();
        this.scope = scope;
    }
    optional = false;
    execute() {
        const ctx = ts.factory.createThis();
        const ctxDot = ts.factory.createPropertyAccessExpression(ctx, '');
        markIgnoreDiagnostics(ctxDot);
        addExpressionIdentifier(ctxDot, ExpressionIdentifier.COMPONENT_COMPLETION);
        this.scope.addStatement(ts.factory.createExpressionStatement(ctxDot));
        return null;
    }
}
/**
 * A `TcbOp` which renders a variable defined inside of block syntax (e.g. `@if (expr; as var) {}`).
 *
 * Executing this operation returns the identifier which can be used to refer to the variable.
 */
class TcbBlockVariableOp extends TcbOp {
    tcb;
    scope;
    initializer;
    variable;
    constructor(tcb, scope, initializer, variable) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.initializer = initializer;
        this.variable = variable;
    }
    get optional() {
        return false;
    }
    execute() {
        const id = this.tcb.allocateId();
        addParseSpanInfo(id, this.variable.keySpan);
        const variable = tsCreateVariable(id, wrapForTypeChecker(this.initializer));
        addParseSpanInfo(variable.declarationList.declarations[0], this.variable.sourceSpan);
        this.scope.addStatement(variable);
        return id;
    }
}
/**
 * A `TcbOp` which renders a variable that is implicitly available within a block (e.g. `$count`
 * in a `@for` block).
 *
 * Executing this operation returns the identifier which can be used to refer to the variable.
 */
class TcbBlockImplicitVariableOp extends TcbOp {
    tcb;
    scope;
    type;
    variable;
    constructor(tcb, scope, type, variable) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.type = type;
        this.variable = variable;
    }
    optional = true;
    execute() {
        const id = this.tcb.allocateId();
        addParseSpanInfo(id, this.variable.keySpan);
        const variable = tsDeclareVariable(id, this.type);
        addParseSpanInfo(variable.declarationList.declarations[0], this.variable.sourceSpan);
        this.scope.addStatement(variable);
        return id;
    }
}
/**
 * A `TcbOp` which renders an `if` template block as a TypeScript `if` statement.
 *
 * Executing this operation returns nothing.
 */
class TcbIfOp extends TcbOp {
    tcb;
    scope;
    block;
    expressionScopes = new Map();
    constructor(tcb, scope, block) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.block = block;
    }
    get optional() {
        return false;
    }
    execute() {
        const root = this.generateBranch(0);
        root && this.scope.addStatement(root);
        return null;
    }
    generateBranch(index) {
        const branch = this.block.branches[index];
        if (!branch) {
            return undefined;
        }
        // If the expression is null, it means that it's an `else` statement.
        if (branch.expression === null) {
            const branchScope = this.getBranchScope(this.scope, branch, index);
            return ts.factory.createBlock(branchScope.render());
        }
        // We process the expression first in the parent scope, but create a scope around the block
        // that the body will inherit from. We do this, because we need to declare a separate variable
        // for the case where the expression has an alias _and_ because we need the processed
        // expression when generating the guard for the body.
        const outerScope = Scope.forNodes(this.tcb, this.scope, branch, [], null);
        outerScope.render().forEach((stmt) => this.scope.addStatement(stmt));
        this.expressionScopes.set(branch, outerScope);
        let expression = tcbExpression(branch.expression, this.tcb, this.scope);
        if (branch.expressionAlias !== null) {
            expression = ts.factory.createBinaryExpression(ts.factory.createParenthesizedExpression(expression), ts.SyntaxKind.AmpersandAmpersandToken, outerScope.resolve(branch.expressionAlias));
        }
        const bodyScope = this.getBranchScope(outerScope, branch, index);
        return ts.factory.createIfStatement(expression, ts.factory.createBlock(bodyScope.render()), this.generateBranch(index + 1));
    }
    getBranchScope(parentScope, branch, index) {
        const checkBody = this.tcb.env.config.checkControlFlowBodies;
        return Scope.forNodes(this.tcb, parentScope, null, checkBody ? branch.children : [], checkBody ? this.generateBranchGuard(index) : null);
    }
    generateBranchGuard(index) {
        let guard = null;
        // Since event listeners are inside callbacks, type narrowing doesn't apply to them anymore.
        // To recreate the behavior, we generate an expression that negates all the values of the
        // branches _before_ the current one, and then we add the current branch's expression on top.
        // For example `@if (expr === 1) {} @else if (expr === 2) {} @else if (expr === 3)`, the guard
        // for the last expression will be `!(expr === 1) && !(expr === 2) && expr === 3`.
        for (let i = 0; i <= index; i++) {
            const branch = this.block.branches[i];
            // Skip over branches without an expression.
            if (branch.expression === null) {
                continue;
            }
            // This shouldn't happen since all the state is handled
            // internally, but we have the check just in case.
            if (!this.expressionScopes.has(branch)) {
                throw new Error(`Could not determine expression scope of branch at index ${i}`);
            }
            const expressionScope = this.expressionScopes.get(branch);
            let expression;
            // We need to recreate the expression and mark it to be ignored for diagnostics,
            // because it was already checked as a part of the block's condition and we don't
            // want it to produce a duplicate diagnostic.
            expression = tcbExpression(branch.expression, this.tcb, expressionScope);
            if (branch.expressionAlias !== null) {
                expression = ts.factory.createBinaryExpression(ts.factory.createParenthesizedExpression(expression), ts.SyntaxKind.AmpersandAmpersandToken, expressionScope.resolve(branch.expressionAlias));
            }
            markIgnoreDiagnostics(expression);
            // The expressions of the preceding branches have to be negated
            // (e.g. `expr` becomes `!(expr)`) when comparing in the guard, except
            // for the branch's own expression which is preserved as is.
            const comparisonExpression = i === index
                ? expression
                : ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, ts.factory.createParenthesizedExpression(expression));
            // Finally add the expression to the guard with an && operator.
            guard =
                guard === null
                    ? comparisonExpression
                    : ts.factory.createBinaryExpression(guard, ts.SyntaxKind.AmpersandAmpersandToken, comparisonExpression);
        }
        return guard;
    }
}
/**
 * A `TcbOp` which renders a `switch` block as a TypeScript `switch` statement.
 *
 * Executing this operation returns nothing.
 */
class TcbSwitchOp extends TcbOp {
    tcb;
    scope;
    block;
    constructor(tcb, scope, block) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.block = block;
    }
    get optional() {
        return false;
    }
    execute() {
        const switchExpression = tcbExpression(this.block.expression, this.tcb, this.scope);
        const clauses = this.block.cases.map((current) => {
            const checkBody = this.tcb.env.config.checkControlFlowBodies;
            const clauseScope = Scope.forNodes(this.tcb, this.scope, null, checkBody ? current.children : [], checkBody ? this.generateGuard(current, switchExpression) : null);
            const statements = [...clauseScope.render(), ts.factory.createBreakStatement()];
            return current.expression === null
                ? ts.factory.createDefaultClause(statements)
                : ts.factory.createCaseClause(tcbExpression(current.expression, this.tcb, clauseScope), statements);
        });
        this.scope.addStatement(ts.factory.createSwitchStatement(switchExpression, ts.factory.createCaseBlock(clauses)));
        return null;
    }
    generateGuard(node, switchValue) {
        // For non-default cases, the guard needs to compare against the case value, e.g.
        // `switchExpression === caseExpression`.
        if (node.expression !== null) {
            // The expression needs to be ignored for diagnostics since it has been checked already.
            const expression = tcbExpression(node.expression, this.tcb, this.scope);
            markIgnoreDiagnostics(expression);
            return ts.factory.createBinaryExpression(switchValue, ts.SyntaxKind.EqualsEqualsEqualsToken, expression);
        }
        // To fully narrow the type in the default case, we need to generate an expression that negates
        // the values of all of the other expressions. For example:
        // @switch (expr) {
        //   @case (1) {}
        //   @case (2) {}
        //   @default {}
        // }
        // Will produce the guard `expr !== 1 && expr !== 2`.
        let guard = null;
        for (const current of this.block.cases) {
            if (current.expression === null) {
                continue;
            }
            // The expression needs to be ignored for diagnostics since it has been checked already.
            const expression = tcbExpression(current.expression, this.tcb, this.scope);
            markIgnoreDiagnostics(expression);
            const comparison = ts.factory.createBinaryExpression(switchValue, ts.SyntaxKind.ExclamationEqualsEqualsToken, expression);
            if (guard === null) {
                guard = comparison;
            }
            else {
                guard = ts.factory.createBinaryExpression(guard, ts.SyntaxKind.AmpersandAmpersandToken, comparison);
            }
        }
        return guard;
    }
}
/**
 * A `TcbOp` which renders a `for` block as a TypeScript `for...of` loop.
 *
 * Executing this operation returns nothing.
 */
class TcbForOfOp extends TcbOp {
    tcb;
    scope;
    block;
    constructor(tcb, scope, block) {
        super();
        this.tcb = tcb;
        this.scope = scope;
        this.block = block;
    }
    get optional() {
        return false;
    }
    execute() {
        const loopScope = Scope.forNodes(this.tcb, this.scope, this.block, this.tcb.env.config.checkControlFlowBodies ? this.block.children : [], null);
        const initializerId = loopScope.resolve(this.block.item);
        if (!ts.isIdentifier(initializerId)) {
            throw new Error(`Could not resolve for loop variable ${this.block.item.name} to an identifier`);
        }
        const initializer = ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(initializerId)], ts.NodeFlags.Const);
        addParseSpanInfo(initializer, this.block.item.keySpan);
        // It's common to have a for loop over a nullable value (e.g. produced by the `async` pipe).
        // Add a non-null expression to allow such values to be assigned.
        const expression = ts.factory.createNonNullExpression(tcbExpression(this.block.expression, this.tcb, this.scope));
        const trackTranslator = new TcbForLoopTrackTranslator(this.tcb, loopScope, this.block);
        const trackExpression = trackTranslator.translate(this.block.trackBy);
        const statements = [
            ...loopScope.render(),
            ts.factory.createExpressionStatement(trackExpression),
        ];
        this.scope.addStatement(ts.factory.createForOfStatement(undefined, initializer, expression, ts.factory.createBlock(statements)));
        return null;
    }
}
/**
 * Value used to break a circular reference between `TcbOp`s.
 *
 * This value is returned whenever `TcbOp`s have a circular dependency. The expression is a non-null
 * assertion of the null value (in TypeScript, the expression `null!`). This construction will infer
 * the least narrow type for whatever it's assigned to.
 */
const INFER_TYPE_FOR_CIRCULAR_OP_EXPR = ts.factory.createNonNullExpression(ts.factory.createNull());
/**
 * Overall generation context for the type check block.
 *
 * `Context` handles operations during code generation which are global with respect to the whole
 * block. It's responsible for variable name allocation and management of any imports needed. It
 * also contains the template metadata itself.
 */
class Context {
    env;
    domSchemaChecker;
    oobRecorder;
    id;
    boundTarget;
    pipes;
    schemas;
    hostIsStandalone;
    hostPreserveWhitespaces;
    nextId = 1;
    constructor(env, domSchemaChecker, oobRecorder, id, boundTarget, pipes, schemas, hostIsStandalone, hostPreserveWhitespaces) {
        this.env = env;
        this.domSchemaChecker = domSchemaChecker;
        this.oobRecorder = oobRecorder;
        this.id = id;
        this.boundTarget = boundTarget;
        this.pipes = pipes;
        this.schemas = schemas;
        this.hostIsStandalone = hostIsStandalone;
        this.hostPreserveWhitespaces = hostPreserveWhitespaces;
    }
    /**
     * Allocate a new variable name for use within the `Context`.
     *
     * Currently this uses a monotonically increasing counter, but in the future the variable name
     * might change depending on the type of data being stored.
     */
    allocateId() {
        return ts.factory.createIdentifier(`_t${this.nextId++}`);
    }
    getPipeByName(name) {
        if (this.pipes === null || !this.pipes.has(name)) {
            return null;
        }
        return this.pipes.get(name);
    }
}
/**
 * Local scope within the type check block for a particular template.
 *
 * The top-level template and each nested `<ng-template>` have their own `Scope`, which exist in a
 * hierarchy. The structure of this hierarchy mirrors the syntactic scopes in the generated type
 * check block, where each nested template is encased in an `if` structure.
 *
 * As a template's `TcbOp`s are executed in a given `Scope`, statements are added via
 * `addStatement()`. When this processing is complete, the `Scope` can be turned into a `ts.Block`
 * via `renderToBlock()`.
 *
 * If a `TcbOp` requires the output of another, it can call `resolve()`.
 */
class Scope {
    tcb;
    parent;
    guard;
    /**
     * A queue of operations which need to be performed to generate the TCB code for this scope.
     *
     * This array can contain either a `TcbOp` which has yet to be executed, or a `ts.Expression|null`
     * representing the memoized result of executing the operation. As operations are executed, their
     * results are written into the `opQueue`, overwriting the original operation.
     *
     * If an operation is in the process of being executed, it is temporarily overwritten here with
     * `INFER_TYPE_FOR_CIRCULAR_OP_EXPR`. This way, if a cycle is encountered where an operation
     * depends transitively on its own result, the inner operation will infer the least narrow type
     * that fits instead. This has the same semantics as TypeScript itself when types are referenced
     * circularly.
     */
    opQueue = [];
    /**
     * A map of `TmplAstElement`s to the index of their `TcbElementOp` in the `opQueue`
     */
    elementOpMap = new Map();
    /**
     * A map of `TmplAstHostElement`s to the index of their `TcbHostElementOp` in the `opQueue`
     */
    hostElementOpMap = new Map();
    /**
     * A map of `TmplAstComponent`s to the index of their `TcbComponentNodeOp` in the `opQueue`
     */
    componentNodeOpMap = new Map();
    /**
     * A map of maps which tracks the index of `TcbDirectiveCtorOp`s in the `opQueue` for each
     * directive on a `TmplAstElement` or `TmplAstTemplate` node.
     */
    directiveOpMap = new Map();
    /**
     * A map of `TmplAstReference`s to the index of their `TcbReferenceOp` in the `opQueue`
     */
    referenceOpMap = new Map();
    /**
     * Map of immediately nested <ng-template>s (within this `Scope`) represented by `TmplAstTemplate`
     * nodes to the index of their `TcbTemplateContextOp`s in the `opQueue`.
     */
    templateCtxOpMap = new Map();
    /**
     * Map of variables declared on the template that created this `Scope` (represented by
     * `TmplAstVariable` nodes) to the index of their `TcbVariableOp`s in the `opQueue`, or to
     * pre-resolved variable identifiers.
     */
    varMap = new Map();
    /**
     * A map of the names of `TmplAstLetDeclaration`s to the index of their op in the `opQueue`.
     *
     * Assumes that there won't be duplicated `@let` declarations within the same scope.
     */
    letDeclOpMap = new Map();
    /**
     * Statements for this template.
     *
     * Executing the `TcbOp`s in the `opQueue` populates this array.
     */
    statements = [];
    /**
     * Names of the for loop context variables and their types.
     */
    static forLoopContextVariableTypes = new Map([
        ['$first', ts.SyntaxKind.BooleanKeyword],
        ['$last', ts.SyntaxKind.BooleanKeyword],
        ['$even', ts.SyntaxKind.BooleanKeyword],
        ['$odd', ts.SyntaxKind.BooleanKeyword],
        ['$index', ts.SyntaxKind.NumberKeyword],
        ['$count', ts.SyntaxKind.NumberKeyword],
    ]);
    constructor(tcb, parent = null, guard = null) {
        this.tcb = tcb;
        this.parent = parent;
        this.guard = guard;
    }
    /**
     * Constructs a `Scope` given either a `TmplAstTemplate` or a list of `TmplAstNode`s.
     *
     * @param tcb the overall context of TCB generation.
     * @param parentScope the `Scope` of the parent template (if any) or `null` if this is the root
     * `Scope`.
     * @param scopedNode Node that provides the scope around the child nodes (e.g. a
     * `TmplAstTemplate` node exposing variables to its children).
     * @param children Child nodes that should be appended to the TCB.
     * @param guard an expression that is applied to this scope for type narrowing purposes.
     */
    static forNodes(tcb, parentScope, scopedNode, children, guard) {
        const scope = new Scope(tcb, parentScope, guard);
        if (parentScope === null && tcb.env.config.enableTemplateTypeChecker) {
            // Add an autocompletion point for the component context.
            scope.opQueue.push(new TcbComponentContextCompletionOp(scope));
        }
        // If given an actual `TmplAstTemplate` instance, then process any additional information it
        // has.
        if (scopedNode instanceof compiler.Template) {
            // The template's variable declarations need to be added as `TcbVariableOp`s.
            const varMap = new Map();
            for (const v of scopedNode.variables) {
                // Validate that variables on the `TmplAstTemplate` are only declared once.
                if (!varMap.has(v.name)) {
                    varMap.set(v.name, v);
                }
                else {
                    const firstDecl = varMap.get(v.name);
                    tcb.oobRecorder.duplicateTemplateVar(tcb.id, v, firstDecl);
                }
                this.registerVariable(scope, v, new TcbTemplateVariableOp(tcb, scope, scopedNode, v));
            }
        }
        else if (scopedNode instanceof compiler.IfBlockBranch) {
            const { expression, expressionAlias } = scopedNode;
            if (expression !== null && expressionAlias !== null) {
                this.registerVariable(scope, expressionAlias, new TcbBlockVariableOp(tcb, scope, tcbExpression(expression, tcb, scope), expressionAlias));
            }
        }
        else if (scopedNode instanceof compiler.ForLoopBlock) {
            // Register the variable for the loop so it can be resolved by
            // children. It'll be declared once the loop is created.
            const loopInitializer = tcb.allocateId();
            addParseSpanInfo(loopInitializer, scopedNode.item.sourceSpan);
            scope.varMap.set(scopedNode.item, loopInitializer);
            for (const variable of scopedNode.contextVariables) {
                if (!this.forLoopContextVariableTypes.has(variable.value)) {
                    throw new Error(`Unrecognized for loop context variable ${variable.name}`);
                }
                const type = ts.factory.createKeywordTypeNode(this.forLoopContextVariableTypes.get(variable.value));
                this.registerVariable(scope, variable, new TcbBlockImplicitVariableOp(tcb, scope, type, variable));
            }
        }
        else if (scopedNode instanceof compiler.HostElement) {
            scope.appendNode(scopedNode);
        }
        if (children !== null) {
            for (const node of children) {
                scope.appendNode(node);
            }
        }
        // Once everything is registered, we need to check if there are `@let`
        // declarations that conflict with other local symbols defined after them.
        for (const variable of scope.varMap.keys()) {
            Scope.checkConflictingLet(scope, variable);
        }
        for (const ref of scope.referenceOpMap.keys()) {
            Scope.checkConflictingLet(scope, ref);
        }
        return scope;
    }
    /** Registers a local variable with a scope. */
    static registerVariable(scope, variable, op) {
        const opIndex = scope.opQueue.push(op) - 1;
        scope.varMap.set(variable, opIndex);
    }
    /**
     * Look up a `ts.Expression` representing the value of some operation in the current `Scope`,
     * including any parent scope(s). This method always returns a mutable clone of the
     * `ts.Expression` with the comments cleared.
     *
     * @param node a `TmplAstNode` of the operation in question. The lookup performed will depend on
     * the type of this node:
     *
     * Assuming `directive` is not present, then `resolve` will return:
     *
     * * `TmplAstElement` - retrieve the expression for the element DOM node
     * * `TmplAstTemplate` - retrieve the template context variable
     * * `TmplAstVariable` - retrieve a template let- variable
     * * `TmplAstLetDeclaration` - retrieve a template `@let` declaration
     * * `TmplAstReference` - retrieve variable created for the local ref
     *
     * @param directive if present, a directive type on a `TmplAstElement` or `TmplAstTemplate` to
     * look up instead of the default for an element or template node.
     */
    resolve(node, directive) {
        // Attempt to resolve the operation locally.
        const res = this.resolveLocal(node, directive);
        if (res !== null) {
            // We want to get a clone of the resolved expression and clear the trailing comments
            // so they don't continue to appear in every place the expression is used.
            // As an example, this would otherwise produce:
            // var _t1 /**T:DIR*/ /*1,2*/ = _ctor1();
            // _t1 /**T:DIR*/ /*1,2*/.input = 'value';
            //
            // In addition, returning a clone prevents the consumer of `Scope#resolve` from
            // attaching comments at the declaration site.
            let clone;
            if (ts.isIdentifier(res)) {
                clone = ts.factory.createIdentifier(res.text);
            }
            else if (ts.isNonNullExpression(res)) {
                clone = ts.factory.createNonNullExpression(res.expression);
            }
            else {
                throw new Error(`Could not resolve ${node} to an Identifier or a NonNullExpression`);
            }
            ts.setOriginalNode(clone, res);
            clone.parent = clone.parent;
            return ts.setSyntheticTrailingComments(clone, []);
        }
        else if (this.parent !== null) {
            // Check with the parent.
            return this.parent.resolve(node, directive);
        }
        else {
            throw new Error(`Could not resolve ${node} / ${directive}`);
        }
    }
    /**
     * Add a statement to this scope.
     */
    addStatement(stmt) {
        this.statements.push(stmt);
    }
    /**
     * Get the statements.
     */
    render() {
        for (let i = 0; i < this.opQueue.length; i++) {
            // Optional statements cannot be skipped when we are generating the TCB for use
            // by the TemplateTypeChecker.
            const skipOptional = !this.tcb.env.config.enableTemplateTypeChecker;
            this.executeOp(i, skipOptional);
        }
        return this.statements;
    }
    /**
     * Returns an expression of all template guards that apply to this scope, including those of
     * parent scopes. If no guards have been applied, null is returned.
     */
    guards() {
        let parentGuards = null;
        if (this.parent !== null) {
            // Start with the guards from the parent scope, if present.
            parentGuards = this.parent.guards();
        }
        if (this.guard === null) {
            // This scope does not have a guard, so return the parent's guards as is.
            return parentGuards;
        }
        else if (parentGuards === null) {
            // There's no guards from the parent scope, so this scope's guard represents all available
            // guards.
            return this.guard;
        }
        else {
            // Both the parent scope and this scope provide a guard, so create a combination of the two.
            // It is important that the parent guard is used as left operand, given that it may provide
            // narrowing that is required for this scope's guard to be valid.
            return ts.factory.createBinaryExpression(parentGuards, ts.SyntaxKind.AmpersandAmpersandToken, this.guard);
        }
    }
    /** Returns whether a template symbol is defined locally within the current scope. */
    isLocal(node) {
        if (node instanceof compiler.Variable) {
            return this.varMap.has(node);
        }
        if (node instanceof compiler.LetDeclaration) {
            return this.letDeclOpMap.has(node.name);
        }
        return this.referenceOpMap.has(node);
    }
    resolveLocal(ref, directive) {
        if (ref instanceof compiler.Reference && this.referenceOpMap.has(ref)) {
            return this.resolveOp(this.referenceOpMap.get(ref));
        }
        else if (ref instanceof compiler.LetDeclaration && this.letDeclOpMap.has(ref.name)) {
            return this.resolveOp(this.letDeclOpMap.get(ref.name).opIndex);
        }
        else if (ref instanceof compiler.Variable && this.varMap.has(ref)) {
            // Resolving a context variable for this template.
            // Execute the `TcbVariableOp` associated with the `TmplAstVariable`.
            const opIndexOrNode = this.varMap.get(ref);
            return typeof opIndexOrNode === 'number' ? this.resolveOp(opIndexOrNode) : opIndexOrNode;
        }
        else if (ref instanceof compiler.Template &&
            directive === undefined &&
            this.templateCtxOpMap.has(ref)) {
            // Resolving the context of the given sub-template.
            // Execute the `TcbTemplateContextOp` for the template.
            return this.resolveOp(this.templateCtxOpMap.get(ref));
        }
        else if ((ref instanceof compiler.Element ||
            ref instanceof compiler.Template ||
            ref instanceof compiler.Component ||
            ref instanceof compiler.Directive) &&
            directive !== undefined &&
            this.directiveOpMap.has(ref)) {
            // Resolving a directive on an element or sub-template.
            const dirMap = this.directiveOpMap.get(ref);
            return dirMap.has(directive) ? this.resolveOp(dirMap.get(directive)) : null;
        }
        else if (ref instanceof compiler.Element && this.elementOpMap.has(ref)) {
            // Resolving the DOM node of an element in this template.
            return this.resolveOp(this.elementOpMap.get(ref));
        }
        else if (ref instanceof compiler.Component && this.componentNodeOpMap.has(ref)) {
            return this.resolveOp(this.componentNodeOpMap.get(ref));
        }
        else if (ref instanceof compiler.HostElement && this.hostElementOpMap.has(ref)) {
            return this.resolveOp(this.hostElementOpMap.get(ref));
        }
        else {
            return null;
        }
    }
    /**
     * Like `executeOp`, but assert that the operation actually returned `ts.Expression`.
     */
    resolveOp(opIndex) {
        const res = this.executeOp(opIndex, /* skipOptional */ false);
        if (res === null) {
            throw new Error(`Error resolving operation, got null`);
        }
        return res;
    }
    /**
     * Execute a particular `TcbOp` in the `opQueue`.
     *
     * This method replaces the operation in the `opQueue` with the result of execution (once done)
     * and also protects against a circular dependency from the operation to itself by temporarily
     * setting the operation's result to a special expression.
     */
    executeOp(opIndex, skipOptional) {
        const op = this.opQueue[opIndex];
        if (!(op instanceof TcbOp)) {
            return op;
        }
        if (skipOptional && op.optional) {
            return null;
        }
        // Set the result of the operation in the queue to its circular fallback. If executing this
        // operation results in a circular dependency, this will prevent an infinite loop and allow for
        // the resolution of such cycles.
        this.opQueue[opIndex] = op.circularFallback();
        const res = op.execute();
        // Once the operation has finished executing, it's safe to cache the real result.
        this.opQueue[opIndex] = res;
        return res;
    }
    appendNode(node) {
        if (node instanceof compiler.Element) {
            const opIndex = this.opQueue.push(new TcbElementOp(this.tcb, this, node)) - 1;
            this.elementOpMap.set(node, opIndex);
            if (this.tcb.env.config.controlFlowPreventingContentProjection !== 'suppress') {
                this.appendContentProjectionCheckOp(node);
            }
            this.appendDirectivesAndInputsOfElementLikeNode(node);
            this.appendOutputsOfElementLikeNode(node);
            this.appendSelectorlessDirectives(node);
            this.appendChildren(node);
            this.checkAndAppendReferencesOfNode(node);
        }
        else if (node instanceof compiler.Template) {
            // Template children are rendered in a child scope.
            this.appendDirectivesAndInputsOfElementLikeNode(node);
            this.appendOutputsOfElementLikeNode(node);
            this.appendSelectorlessDirectives(node);
            const ctxIndex = this.opQueue.push(new TcbTemplateContextOp(this.tcb, this)) - 1;
            this.templateCtxOpMap.set(node, ctxIndex);
            if (this.tcb.env.config.checkTemplateBodies) {
                this.opQueue.push(new TcbTemplateBodyOp(this.tcb, this, node));
            }
            else if (this.tcb.env.config.alwaysCheckSchemaInTemplateBodies) {
                this.appendDeepSchemaChecks(node.children);
            }
            this.checkAndAppendReferencesOfNode(node);
        }
        else if (node instanceof compiler.Component) {
            this.appendComponentNode(node);
        }
        else if (node instanceof compiler.DeferredBlock) {
            this.appendDeferredBlock(node);
        }
        else if (node instanceof compiler.IfBlock) {
            this.opQueue.push(new TcbIfOp(this.tcb, this, node));
        }
        else if (node instanceof compiler.SwitchBlock) {
            this.opQueue.push(new TcbSwitchOp(this.tcb, this, node));
        }
        else if (node instanceof compiler.ForLoopBlock) {
            this.opQueue.push(new TcbForOfOp(this.tcb, this, node));
            node.empty && this.tcb.env.config.checkControlFlowBodies && this.appendChildren(node.empty);
        }
        else if (node instanceof compiler.BoundText) {
            this.opQueue.push(new TcbExpressionOp(this.tcb, this, node.value));
        }
        else if (node instanceof compiler.Icu$1) {
            this.appendIcuExpressions(node);
        }
        else if (node instanceof compiler.Content) {
            this.appendChildren(node);
        }
        else if (node instanceof compiler.LetDeclaration) {
            const opIndex = this.opQueue.push(new TcbLetDeclarationOp(this.tcb, this, node)) - 1;
            if (this.isLocal(node)) {
                this.tcb.oobRecorder.conflictingDeclaration(this.tcb.id, node);
            }
            else {
                this.letDeclOpMap.set(node.name, { opIndex, node });
            }
        }
        else if (node instanceof compiler.HostElement) {
            const opIndex = this.opQueue.push(new TcbHostElementOp(this.tcb, this, node)) - 1;
            this.hostElementOpMap.set(node, opIndex);
            this.opQueue.push(new TcbUnclaimedInputsOp(this.tcb, this, node.bindings, node, null), new TcbUnclaimedOutputsOp(this.tcb, this, node, node.listeners, null, null), new TcbDomSchemaCheckerOp(this.tcb, node, false, null));
        }
    }
    appendChildren(node) {
        for (const child of node.children) {
            this.appendNode(child);
        }
    }
    checkAndAppendReferencesOfNode(node) {
        for (const ref of node.references) {
            const target = this.tcb.boundTarget.getReferenceTarget(ref);
            let ctxIndex;
            if (target === null) {
                // The reference is invalid if it doesn't have a target, so report it as an error.
                this.tcb.oobRecorder.missingReferenceTarget(this.tcb.id, ref);
                // Any usages of the invalid reference will be resolved to a variable of type any.
                ctxIndex = this.opQueue.push(new TcbInvalidReferenceOp(this.tcb, this)) - 1;
            }
            else if (target instanceof compiler.Template || target instanceof compiler.Element) {
                ctxIndex = this.opQueue.push(new TcbReferenceOp(this.tcb, this, ref, node, target)) - 1;
            }
            else {
                ctxIndex =
                    this.opQueue.push(new TcbReferenceOp(this.tcb, this, ref, node, target.directive)) - 1;
            }
            this.referenceOpMap.set(ref, ctxIndex);
        }
    }
    appendDirectivesAndInputsOfElementLikeNode(node) {
        // Collect all the inputs on the element.
        const claimedInputs = new Set();
        // Don't resolve directives when selectorless is enabled and treat all the inputs on the element
        // as unclaimed. In selectorless the inputs are defined either in component or directive nodes.
        const directives = this.tcb.boundTarget.getDirectivesOfNode(node);
        if (directives === null || directives.length === 0) {
            // If there are no directives, then all inputs are unclaimed inputs, so queue an operation
            // to add them if needed.
            if (node instanceof compiler.Element) {
                this.opQueue.push(new TcbUnclaimedInputsOp(this.tcb, this, node.inputs, node, claimedInputs), new TcbDomSchemaCheckerOp(this.tcb, node, /* checkElement */ true, claimedInputs));
            }
            return;
        }
        if (node instanceof compiler.Element) {
            const isDeferred = this.tcb.boundTarget.isDeferred(node);
            if (!isDeferred && directives.some((dirMeta) => dirMeta.isExplicitlyDeferred)) {
                // This node has directives/components that were defer-loaded (included into
                // `@Component.deferredImports`), but the node itself was used outside of a
                // `@defer` block, which is the error.
                this.tcb.oobRecorder.deferredComponentUsedEagerly(this.tcb.id, node);
            }
        }
        const dirMap = new Map();
        for (const dir of directives) {
            this.appendDirectiveInputs(dir, node, dirMap);
        }
        this.directiveOpMap.set(node, dirMap);
        // After expanding the directives, we might need to queue an operation to check any unclaimed
        // inputs.
        if (node instanceof compiler.Element) {
            // Go through the directives and remove any inputs that it claims from `elementInputs`.
            for (const dir of directives) {
                for (const propertyName of dir.inputs.propertyNames) {
                    claimedInputs.add(propertyName);
                }
            }
            this.opQueue.push(new TcbUnclaimedInputsOp(this.tcb, this, node.inputs, node, claimedInputs));
            // If there are no directives which match this element, then it's a "plain" DOM element (or a
            // web component), and should be checked against the DOM schema. If any directives match,
            // we must assume that the element could be custom (either a component, or a directive like
            // <router-outlet>) and shouldn't validate the element name itself.
            const checkElement = directives.length === 0;
            this.opQueue.push(new TcbDomSchemaCheckerOp(this.tcb, node, checkElement, claimedInputs));
        }
    }
    appendOutputsOfElementLikeNode(node) {
        // Collect all the outputs on the element.
        const claimedOutputs = new Set();
        // Don't resolve directives when selectorless is enabled and treat all the outputs on the
        // element as unclaimed. In selectorless the outputs are defined either in component or
        // directive nodes.
        const directives = this.tcb.boundTarget.getDirectivesOfNode(node);
        if (directives === null || directives.length === 0) {
            // If there are no directives, then all outputs are unclaimed outputs, so queue an operation
            // to add them if needed.
            if (node instanceof compiler.Element) {
                this.opQueue.push(new TcbUnclaimedOutputsOp(this.tcb, this, node, node.outputs, node.inputs, claimedOutputs));
            }
            return;
        }
        // Queue operations for all directives to check the relevant outputs for a directive.
        for (const dir of directives) {
            this.opQueue.push(new TcbDirectiveOutputsOp(this.tcb, this, node, dir));
        }
        // After expanding the directives, we might need to queue an operation to check any unclaimed
        // outputs.
        if (node instanceof compiler.Element) {
            // Go through the directives and register any outputs that it claims in `claimedOutputs`.
            for (const dir of directives) {
                for (const outputProperty of dir.outputs.propertyNames) {
                    claimedOutputs.add(outputProperty);
                }
            }
            this.opQueue.push(new TcbUnclaimedOutputsOp(this.tcb, this, node, node.outputs, node.inputs, claimedOutputs));
        }
    }
    appendInputsOfSelectorlessNode(node) {
        // Only resolve the directives that were brought in by this specific directive.
        const directives = this.tcb.boundTarget.getDirectivesOfNode(node);
        const claimedInputs = new Set();
        if (directives !== null && directives.length > 0) {
            const dirMap = new Map();
            for (const dir of directives) {
                this.appendDirectiveInputs(dir, node, dirMap);
                for (const propertyName of dir.inputs.propertyNames) {
                    claimedInputs.add(propertyName);
                }
            }
            this.directiveOpMap.set(node, dirMap);
        }
        // In selectorless all directive inputs have to be claimed.
        if (node instanceof compiler.Directive) {
            for (const input of node.inputs) {
                if (!claimedInputs.has(input.name)) {
                    this.tcb.oobRecorder.unclaimedDirectiveBinding(this.tcb.id, node, input);
                }
            }
            for (const attr of node.attributes) {
                if (!claimedInputs.has(attr.name)) {
                    this.tcb.oobRecorder.unclaimedDirectiveBinding(this.tcb.id, node, attr);
                }
            }
        }
        else {
            const checkElement = node.tagName !== null;
            this.opQueue.push(new TcbUnclaimedInputsOp(this.tcb, this, node.inputs, node, claimedInputs), new TcbDomSchemaCheckerOp(this.tcb, node, checkElement, claimedInputs));
        }
    }
    appendOutputsOfSelectorlessNode(node) {
        // Only resolve the directives that were brought in by this specific directive.
        const directives = this.tcb.boundTarget.getDirectivesOfNode(node);
        const claimedOutputs = new Set();
        if (directives !== null && directives.length > 0) {
            for (const dir of directives) {
                this.opQueue.push(new TcbDirectiveOutputsOp(this.tcb, this, node, dir));
                for (const outputProperty of dir.outputs.propertyNames) {
                    claimedOutputs.add(outputProperty);
                }
            }
        }
        // In selectorless all directive outputs have to be claimed.
        if (node instanceof compiler.Directive) {
            for (const output of node.outputs) {
                if (!claimedOutputs.has(output.name)) {
                    this.tcb.oobRecorder.unclaimedDirectiveBinding(this.tcb.id, node, output);
                }
            }
        }
        else {
            this.opQueue.push(new TcbUnclaimedOutputsOp(this.tcb, this, node, node.outputs, node.inputs, claimedOutputs));
        }
    }
    appendDirectiveInputs(dir, node, dirMap) {
        let directiveOp;
        const host = this.tcb.env.reflector;
        const dirRef = dir.ref;
        if (!dir.isGeneric) {
            // The most common case is that when a directive is not generic, we use the normal
            // `TcbNonDirectiveTypeOp`.
            directiveOp = new TcbNonGenericDirectiveTypeOp(this.tcb, this, node, dir);
        }
        else if (!requiresInlineTypeCtor(dirRef.node, host, this.tcb.env) ||
            this.tcb.env.config.useInlineTypeConstructors) {
            // For generic directives, we use a type constructor to infer types. If a directive requires
            // an inline type constructor, then inlining must be available to use the
            // `TcbDirectiveCtorOp`. If not we, we fallback to using `any` – see below.
            directiveOp = new TcbDirectiveCtorOp(this.tcb, this, node, dir);
        }
        else {
            // If inlining is not available, then we give up on inferring the generic params, and use
            // `any` type for the directive's generic parameters.
            directiveOp = new TcbGenericDirectiveTypeWithAnyParamsOp(this.tcb, this, node, dir);
        }
        const dirIndex = this.opQueue.push(directiveOp) - 1;
        dirMap.set(dir, dirIndex);
        this.opQueue.push(new TcbDirectiveInputsOp(this.tcb, this, node, dir));
    }
    appendSelectorlessDirectives(node) {
        for (const directive of node.directives) {
            // Check that the directive exists.
            if (!this.tcb.boundTarget.referencedDirectiveExists(directive.name)) {
                this.tcb.oobRecorder.missingNamedTemplateDependency(this.tcb.id, directive);
                continue;
            }
            // Check that the class is a directive class.
            const directives = this.tcb.boundTarget.getDirectivesOfNode(directive);
            if (directives === null ||
                directives.length === 0 ||
                directives.some((dir) => dir.isComponent)) {
                this.tcb.oobRecorder.incorrectTemplateDependencyType(this.tcb.id, directive);
                continue;
            }
            this.appendInputsOfSelectorlessNode(directive);
            this.appendOutputsOfSelectorlessNode(directive);
            this.checkAndAppendReferencesOfNode(directive);
        }
    }
    appendDeepSchemaChecks(nodes) {
        for (const node of nodes) {
            if (!(node instanceof compiler.Element || node instanceof compiler.Template)) {
                continue;
            }
            if (node instanceof compiler.Element) {
                const claimedInputs = new Set();
                let directives = this.tcb.boundTarget.getDirectivesOfNode(node);
                for (const dirNode of node.directives) {
                    const directiveResults = this.tcb.boundTarget.getDirectivesOfNode(dirNode);
                    if (directiveResults !== null && directiveResults.length > 0) {
                        directives ??= [];
                        directives.push(...directiveResults);
                    }
                }
                let hasDirectives;
                if (directives === null || directives.length === 0) {
                    hasDirectives = false;
                }
                else {
                    hasDirectives = true;
                    for (const dir of directives) {
                        for (const propertyName of dir.inputs.propertyNames) {
                            claimedInputs.add(propertyName);
                        }
                    }
                }
                this.opQueue.push(new TcbDomSchemaCheckerOp(this.tcb, node, !hasDirectives, claimedInputs));
            }
            this.appendDeepSchemaChecks(node.children);
        }
    }
    appendIcuExpressions(node) {
        for (const variable of Object.values(node.vars)) {
            this.opQueue.push(new TcbExpressionOp(this.tcb, this, variable.value));
        }
        for (const placeholder of Object.values(node.placeholders)) {
            if (placeholder instanceof compiler.BoundText) {
                this.opQueue.push(new TcbExpressionOp(this.tcb, this, placeholder.value));
            }
        }
    }
    appendContentProjectionCheckOp(root) {
        const meta = this.tcb.boundTarget.getDirectivesOfNode(root)?.find((meta) => meta.isComponent) || null;
        if (meta !== null && meta.ngContentSelectors !== null && meta.ngContentSelectors.length > 0) {
            const selectors = meta.ngContentSelectors;
            // We don't need to generate anything for components that don't have projection
            // slots, or they only have one catch-all slot (represented by `*`).
            if (selectors.length > 1 || (selectors.length === 1 && selectors[0] !== '*')) {
                this.opQueue.push(new TcbControlFlowContentProjectionOp(this.tcb, root, selectors, meta.name));
            }
        }
    }
    appendComponentNode(node) {
        // TODO(crisbeto): should we still append the children if the component is invalid?
        // Check that the referenced class exists.
        if (!this.tcb.boundTarget.referencedDirectiveExists(node.componentName)) {
            this.tcb.oobRecorder.missingNamedTemplateDependency(this.tcb.id, node);
            return;
        }
        // Check that the class is a component.
        const directives = this.tcb.boundTarget.getDirectivesOfNode(node);
        if (directives === null ||
            directives.length === 0 ||
            directives.every((dir) => !dir.isComponent)) {
            this.tcb.oobRecorder.incorrectTemplateDependencyType(this.tcb.id, node);
            return;
        }
        const opIndex = this.opQueue.push(new TcbComponentNodeOp(this.tcb, this, node)) - 1;
        this.componentNodeOpMap.set(node, opIndex);
        if (this.tcb.env.config.controlFlowPreventingContentProjection !== 'suppress') {
            this.appendContentProjectionCheckOp(node);
        }
        this.appendInputsOfSelectorlessNode(node);
        this.appendOutputsOfSelectorlessNode(node);
        this.appendSelectorlessDirectives(node);
        this.appendChildren(node);
        this.checkAndAppendReferencesOfNode(node);
    }
    appendDeferredBlock(block) {
        this.appendDeferredTriggers(block, block.triggers);
        this.appendDeferredTriggers(block, block.prefetchTriggers);
        // Only the `when` hydration trigger needs to be checked.
        if (block.hydrateTriggers.when) {
            this.opQueue.push(new TcbExpressionOp(this.tcb, this, block.hydrateTriggers.when.value));
        }
        this.appendChildren(block);
        if (block.placeholder !== null) {
            this.appendChildren(block.placeholder);
        }
        if (block.loading !== null) {
            this.appendChildren(block.loading);
        }
        if (block.error !== null) {
            this.appendChildren(block.error);
        }
    }
    appendDeferredTriggers(block, triggers) {
        if (triggers.when !== undefined) {
            this.opQueue.push(new TcbExpressionOp(this.tcb, this, triggers.when.value));
        }
        if (triggers.hover !== undefined) {
            this.appendReferenceBasedDeferredTrigger(block, triggers.hover);
        }
        if (triggers.interaction !== undefined) {
            this.appendReferenceBasedDeferredTrigger(block, triggers.interaction);
        }
        if (triggers.viewport !== undefined) {
            this.appendReferenceBasedDeferredTrigger(block, triggers.viewport);
        }
    }
    appendReferenceBasedDeferredTrigger(block, trigger) {
        if (this.tcb.boundTarget.getDeferredTriggerTarget(block, trigger) === null) {
            this.tcb.oobRecorder.inaccessibleDeferredTriggerElement(this.tcb.id, trigger);
        }
    }
    /** Reports a diagnostic if there are any `@let` declarations that conflict with a node. */
    static checkConflictingLet(scope, node) {
        if (scope.letDeclOpMap.has(node.name)) {
            scope.tcb.oobRecorder.conflictingDeclaration(scope.tcb.id, scope.letDeclOpMap.get(node.name).node);
        }
    }
}
/**
 * Create the `this` parameter to the top-level TCB function, with the given generic type
 * arguments.
 */
function tcbThisParam(name, typeArguments) {
    return ts.factory.createParameterDeclaration(
    /* modifiers */ undefined, 
    /* dotDotDotToken */ undefined, 
    /* name */ 'this', 
    /* questionToken */ undefined, 
    /* type */ ts.factory.createTypeReferenceNode(name, typeArguments), 
    /* initializer */ undefined);
}
/**
 * Process an `AST` expression and convert it into a `ts.Expression`, generating references to the
 * correct identifiers in the current scope.
 */
function tcbExpression(ast, tcb, scope) {
    const translator = new TcbExpressionTranslator(tcb, scope);
    return translator.translate(ast);
}
class TcbExpressionTranslator {
    tcb;
    scope;
    constructor(tcb, scope) {
        this.tcb = tcb;
        this.scope = scope;
    }
    translate(ast) {
        // `astToTypescript` actually does the conversion. A special resolver `tcbResolve` is passed
        // which interprets specific expression nodes that interact with the `ImplicitReceiver`. These
        // nodes actually refer to identifiers within the current scope.
        return astToTypescript(ast, (ast) => this.resolve(ast), this.tcb.env.config);
    }
    /**
     * Resolve an `AST` expression within the given scope.
     *
     * Some `AST` expressions refer to top-level concepts (references, variables, the component
     * context). This method assists in resolving those.
     */
    resolve(ast) {
        if (ast instanceof compiler.PropertyRead &&
            ast.receiver instanceof compiler.ImplicitReceiver &&
            !(ast.receiver instanceof compiler.ThisReceiver)) {
            // Try to resolve a bound target for this expression. If no such target is available, then
            // the expression is referencing the top-level component context. In that case, `null` is
            // returned here to let it fall through resolution so it will be caught when the
            // `ImplicitReceiver` is resolved in the branch below.
            const target = this.tcb.boundTarget.getExpressionTarget(ast);
            const targetExpression = target === null ? null : this.getTargetNodeExpression(target, ast);
            if (target instanceof compiler.LetDeclaration &&
                !this.isValidLetDeclarationAccess(target, ast)) {
                this.tcb.oobRecorder.letUsedBeforeDefinition(this.tcb.id, ast, target);
                // Cast the expression to `any` so we don't produce additional diagnostics.
                // We don't use `markIgnoreForDiagnostics` here, because it won't prevent duplicate
                // diagnostics for nested accesses in cases like `@let value = value.foo.bar.baz`.
                if (targetExpression !== null) {
                    return ts.factory.createAsExpression(targetExpression, ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
                }
            }
            return targetExpression;
        }
        else if (ast instanceof compiler.PropertyWrite && ast.receiver instanceof compiler.ImplicitReceiver) {
            const target = this.tcb.boundTarget.getExpressionTarget(ast);
            if (target === null) {
                return null;
            }
            const targetExpression = this.getTargetNodeExpression(target, ast);
            const expr = this.translate(ast.value);
            const result = ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(targetExpression, ts.SyntaxKind.EqualsToken, expr));
            addParseSpanInfo(result, ast.sourceSpan);
            // Ignore diagnostics from TS produced for writes to `@let` and re-report them using
            // our own infrastructure. We can't rely on the TS reporting, because it includes
            // the name of the auto-generated TCB variable name.
            if (target instanceof compiler.LetDeclaration) {
                markIgnoreDiagnostics(result);
                this.tcb.oobRecorder.illegalWriteToLetDeclaration(this.tcb.id, ast, target);
            }
            return result;
        }
        else if (ast instanceof compiler.ImplicitReceiver) {
            // AST instances representing variables and references look very similar to property reads
            // or method calls from the component context: both have the shape
            // PropertyRead(ImplicitReceiver, 'propName') or Call(ImplicitReceiver, 'methodName').
            //
            // `translate` will first try to `resolve` the outer PropertyRead/Call. If this works,
            // it's because the `BoundTarget` found an expression target for the whole expression, and
            // therefore `translate` will never attempt to `resolve` the ImplicitReceiver of that
            // PropertyRead/Call.
            //
            // Therefore if `resolve` is called on an `ImplicitReceiver`, it's because no outer
            // PropertyRead/Call resolved to a variable or reference, and therefore this is a
            // property read or method call on the component context itself.
            return ts.factory.createThis();
        }
        else if (ast instanceof compiler.BindingPipe) {
            const expr = this.translate(ast.exp);
            const pipeMeta = this.tcb.getPipeByName(ast.name);
            let pipe;
            if (pipeMeta === null) {
                // No pipe by that name exists in scope. Record this as an error.
                this.tcb.oobRecorder.missingPipe(this.tcb.id, ast);
                // Use an 'any' value to at least allow the rest of the expression to be checked.
                pipe = ANY_EXPRESSION;
            }
            else if (pipeMeta.isExplicitlyDeferred &&
                this.tcb.boundTarget.getEagerlyUsedPipes().includes(ast.name)) {
                // This pipe was defer-loaded (included into `@Component.deferredImports`),
                // but was used outside of a `@defer` block, which is the error.
                this.tcb.oobRecorder.deferredPipeUsedEagerly(this.tcb.id, ast);
                // Use an 'any' value to at least allow the rest of the expression to be checked.
                pipe = ANY_EXPRESSION;
            }
            else {
                // Use a variable declared as the pipe's type.
                pipe = this.tcb.env.pipeInst(pipeMeta.ref);
            }
            const args = ast.args.map((arg) => this.translate(arg));
            let methodAccess = ts.factory.createPropertyAccessExpression(pipe, 'transform');
            addParseSpanInfo(methodAccess, ast.nameSpan);
            if (!this.tcb.env.config.checkTypeOfPipes) {
                methodAccess = ts.factory.createAsExpression(methodAccess, ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
            }
            const result = ts.factory.createCallExpression(
            /* expression */ methodAccess, 
            /* typeArguments */ undefined, 
            /* argumentsArray */ [expr, ...args]);
            addParseSpanInfo(result, ast.sourceSpan);
            return result;
        }
        else if ((ast instanceof compiler.Call || ast instanceof compiler.SafeCall) &&
            (ast.receiver instanceof compiler.PropertyRead || ast.receiver instanceof compiler.SafePropertyRead)) {
            // Resolve the special `$any(expr)` syntax to insert a cast of the argument to type `any`.
            // `$any(expr)` -> `expr as any`
            if (ast.receiver.receiver instanceof compiler.ImplicitReceiver &&
                !(ast.receiver.receiver instanceof compiler.ThisReceiver) &&
                ast.receiver.name === '$any' &&
                ast.args.length === 1) {
                const expr = this.translate(ast.args[0]);
                const exprAsAny = ts.factory.createAsExpression(expr, ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
                const result = ts.factory.createParenthesizedExpression(exprAsAny);
                addParseSpanInfo(result, ast.sourceSpan);
                return result;
            }
            // Attempt to resolve a bound target for the method, and generate the method call if a target
            // could be resolved. If no target is available, then the method is referencing the top-level
            // component context, in which case `null` is returned to let the `ImplicitReceiver` being
            // resolved to the component context.
            const target = this.tcb.boundTarget.getExpressionTarget(ast);
            if (target === null) {
                return null;
            }
            const receiver = this.getTargetNodeExpression(target, ast);
            const method = wrapForDiagnostics(receiver);
            addParseSpanInfo(method, ast.receiver.nameSpan);
            const args = ast.args.map((arg) => this.translate(arg));
            const node = ts.factory.createCallExpression(method, undefined, args);
            addParseSpanInfo(node, ast.sourceSpan);
            return node;
        }
        else {
            // This AST isn't special after all.
            return null;
        }
    }
    getTargetNodeExpression(targetNode, expressionNode) {
        const expr = this.scope.resolve(targetNode);
        addParseSpanInfo(expr, expressionNode.sourceSpan);
        return expr;
    }
    isValidLetDeclarationAccess(target, ast) {
        const targetStart = target.sourceSpan.start.offset;
        const targetEnd = target.sourceSpan.end.offset;
        const astStart = ast.sourceSpan.start;
        // We only flag local references that occur before the declaration, because embedded views
        // are updated before the child views. In practice this means that something like
        // `<ng-template [ngIf]="true">{{value}}</ng-template> @let value = 1;` is valid.
        return (targetStart < astStart && astStart > targetEnd) || !this.scope.isLocal(target);
    }
}
/**
 * Call the type constructor of a directive instance on a given template node, inferring a type for
 * the directive instance from any bound inputs.
 */
function tcbCallTypeCtor(dir, tcb, inputs) {
    const typeCtor = tcb.env.typeCtorFor(dir);
    // Construct an array of `ts.PropertyAssignment`s for each of the directive's inputs.
    const members = inputs.map((input) => {
        const propertyName = ts.factory.createStringLiteral(input.field);
        if (input.type === 'binding') {
            // For bound inputs, the property is assigned the binding expression.
            let expr = widenBinding(input.expression, tcb);
            if (input.isTwoWayBinding && tcb.env.config.allowSignalsInTwoWayBindings) {
                expr = unwrapWritableSignal(expr, tcb);
            }
            const assignment = ts.factory.createPropertyAssignment(propertyName, wrapForDiagnostics(expr));
            addParseSpanInfo(assignment, input.sourceSpan);
            return assignment;
        }
        else {
            // A type constructor is required to be called with all input properties, so any unset
            // inputs are simply assigned a value of type `any` to ignore them.
            return ts.factory.createPropertyAssignment(propertyName, ANY_EXPRESSION);
        }
    });
    // Call the `ngTypeCtor` method on the directive class, with an object literal argument created
    // from the matched inputs.
    return ts.factory.createCallExpression(
    /* expression */ typeCtor, 
    /* typeArguments */ undefined, 
    /* argumentsArray */ [ts.factory.createObjectLiteralExpression(members)]);
}
function getBoundAttributes(directive, node) {
    const boundInputs = [];
    const processAttribute = (attr) => {
        // Skip non-property bindings.
        if (attr instanceof compiler.BoundAttribute &&
            attr.type !== compiler.BindingType.Property &&
            attr.type !== compiler.BindingType.TwoWay) {
            return;
        }
        // Skip the attribute if the directive does not have an input for it.
        const inputs = directive.inputs.getByBindingPropertyName(attr.name);
        if (inputs !== null) {
            boundInputs.push({
                attribute: attr,
                inputs: inputs.map((input) => {
                    return {
                        fieldName: input.classPropertyName,
                        required: input.required,
                        transformType: input.transform?.type || null,
                        isSignal: input.isSignal,
                        isTwoWayBinding: attr instanceof compiler.BoundAttribute && attr.type === compiler.BindingType.TwoWay,
                    };
                }),
            });
        }
    };
    node.inputs.forEach(processAttribute);
    node.attributes.forEach(processAttribute);
    if (node instanceof compiler.Template) {
        node.templateAttrs.forEach(processAttribute);
    }
    return boundInputs;
}
/**
 * Translates the given attribute binding to a `ts.Expression`.
 */
function translateInput(attr, tcb, scope) {
    if (attr instanceof compiler.BoundAttribute) {
        // Produce an expression representing the value of the binding.
        return tcbExpression(attr.value, tcb, scope);
    }
    else {
        // For regular attributes with a static string value, use the represented string literal.
        return ts.factory.createStringLiteral(attr.value);
    }
}
/**
 * Potentially widens the type of `expr` according to the type-checking configuration.
 */
function widenBinding(expr, tcb) {
    if (!tcb.env.config.checkTypeOfInputBindings) {
        // If checking the type of bindings is disabled, cast the resulting expression to 'any'
        // before the assignment.
        return tsCastToAny(expr);
    }
    else if (!tcb.env.config.strictNullInputBindings) {
        if (ts.isObjectLiteralExpression(expr) || ts.isArrayLiteralExpression(expr)) {
            // Object literals and array literals should not be wrapped in non-null assertions as that
            // would cause literals to be prematurely widened, resulting in type errors when assigning
            // into a literal type.
            return expr;
        }
        else {
            // If strict null checks are disabled, erase `null` and `undefined` from the type by
            // wrapping the expression in a non-null assertion.
            return ts.factory.createNonNullExpression(expr);
        }
    }
    else {
        // No widening is requested, use the expression as is.
        return expr;
    }
}
/**
 * Wraps an expression in an `unwrapSignal` call which extracts the signal's value.
 */
function unwrapWritableSignal(expression, tcb) {
    const unwrapRef = tcb.env.referenceExternalSymbol(compiler.Identifiers.unwrapWritableSignal.moduleName, compiler.Identifiers.unwrapWritableSignal.name);
    return ts.factory.createCallExpression(unwrapRef, undefined, [expression]);
}
const EVENT_PARAMETER = '$event';
/**
 * Creates an arrow function to be used as handler function for event bindings. The handler
 * function has a single parameter `$event` and the bound event's handler `AST` represented as a
 * TypeScript expression as its body.
 *
 * When `eventType` is set to `Infer`, the `$event` parameter will not have an explicit type. This
 * allows for the created handler function to have its `$event` parameter's type inferred based on
 * how it's used, to enable strict type checking of event bindings. When set to `Any`, the `$event`
 * parameter will have an explicit `any` type, effectively disabling strict type checking of event
 * bindings. Alternatively, an explicit type can be passed for the `$event` parameter.
 */
function tcbCreateEventHandler(event, tcb, scope, eventType) {
    const handler = tcbEventHandlerExpression(event.handler, tcb, scope);
    const statements = [];
    // TODO(crisbeto): remove the `checkTwoWayBoundEvents` check in v20.
    if (event.type === compiler.ParsedEventType.TwoWay && tcb.env.config.checkTwoWayBoundEvents) {
        // If we're dealing with a two-way event, we create a variable initialized to the unwrapped
        // signal value of the expression and then we assign `$event` to it. Note that in most cases
        // this will already be covered by the corresponding input binding, however it allows us to
        // handle the case where the input has a wider type than the output (see #58971).
        const target = tcb.allocateId();
        const assignment = ts.factory.createBinaryExpression(target, ts.SyntaxKind.EqualsToken, ts.factory.createIdentifier(EVENT_PARAMETER));
        statements.push(tsCreateVariable(target, tcb.env.config.allowSignalsInTwoWayBindings ? unwrapWritableSignal(handler, tcb) : handler), ts.factory.createExpressionStatement(assignment));
    }
    else {
        statements.push(ts.factory.createExpressionStatement(handler));
    }
    let eventParamType;
    if (eventType === 0 /* EventParamType.Infer */) {
        eventParamType = undefined;
    }
    else if (eventType === 1 /* EventParamType.Any */) {
        eventParamType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    }
    else {
        eventParamType = eventType;
    }
    // Obtain all guards that have been applied to the scope and its parents, as they have to be
    // repeated within the handler function for their narrowing to be in effect within the handler.
    const guards = scope.guards();
    let body = ts.factory.createBlock(statements);
    if (guards !== null) {
        // Wrap the body in an `if` statement containing all guards that have to be applied.
        body = ts.factory.createBlock([ts.factory.createIfStatement(guards, body)]);
    }
    const eventParam = ts.factory.createParameterDeclaration(
    /* modifiers */ undefined, 
    /* dotDotDotToken */ undefined, 
    /* name */ EVENT_PARAMETER, 
    /* questionToken */ undefined, 
    /* type */ eventParamType);
    addExpressionIdentifier(eventParam, ExpressionIdentifier.EVENT_PARAMETER);
    // Return an arrow function instead of a function expression to preserve the `this` context.
    return ts.factory.createArrowFunction(
    /* modifiers */ undefined, 
    /* typeParameters */ undefined, 
    /* parameters */ [eventParam], 
    /* type */ ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), 
    /* equalsGreaterThanToken */ undefined, 
    /* body */ body);
}
/**
 * Similar to `tcbExpression`, this function converts the provided `AST` expression into a
 * `ts.Expression`, with special handling of the `$event` variable that can be used within event
 * bindings.
 */
function tcbEventHandlerExpression(ast, tcb, scope) {
    const translator = new TcbEventHandlerTranslator(tcb, scope);
    return translator.translate(ast);
}
function checkSplitTwoWayBinding(inputName, output, inputs, tcb) {
    const input = inputs.find((input) => input.name === inputName);
    if (input === undefined || input.sourceSpan !== output.sourceSpan) {
        return false;
    }
    // Input consumer should be a directive because it's claimed
    const inputConsumer = tcb.boundTarget.getConsumerOfBinding(input);
    const outputConsumer = tcb.boundTarget.getConsumerOfBinding(output);
    if (outputConsumer === null ||
        inputConsumer.ref === undefined ||
        outputConsumer instanceof compiler.Template) {
        return false;
    }
    if (outputConsumer instanceof compiler.Element) {
        tcb.oobRecorder.splitTwoWayBinding(tcb.id, input, output, inputConsumer.ref.node, outputConsumer);
        return true;
    }
    else if (outputConsumer.ref !== inputConsumer.ref) {
        tcb.oobRecorder.splitTwoWayBinding(tcb.id, input, output, inputConsumer.ref.node, outputConsumer.ref.node);
        return true;
    }
    return false;
}
class TcbEventHandlerTranslator extends TcbExpressionTranslator {
    resolve(ast) {
        // Recognize a property read on the implicit receiver corresponding with the event parameter
        // that is available in event bindings. Since this variable is a parameter of the handler
        // function that the converted expression becomes a child of, just create a reference to the
        // parameter by its name.
        if (ast instanceof compiler.PropertyRead &&
            ast.receiver instanceof compiler.ImplicitReceiver &&
            !(ast.receiver instanceof compiler.ThisReceiver) &&
            ast.name === EVENT_PARAMETER) {
            const event = ts.factory.createIdentifier(EVENT_PARAMETER);
            addParseSpanInfo(event, ast.nameSpan);
            return event;
        }
        return super.resolve(ast);
    }
    isValidLetDeclarationAccess() {
        // Event listeners are allowed to read `@let` declarations before
        // they're declared since the callback won't be executed immediately.
        return true;
    }
}
class TcbForLoopTrackTranslator extends TcbExpressionTranslator {
    block;
    allowedVariables;
    constructor(tcb, scope, block) {
        super(tcb, scope);
        this.block = block;
        // Tracking expressions are only allowed to read the `$index`,
        // the item and properties off the component instance.
        this.allowedVariables = new Set([block.item]);
        for (const variable of block.contextVariables) {
            if (variable.value === '$index') {
                this.allowedVariables.add(variable);
            }
        }
    }
    resolve(ast) {
        if (ast instanceof compiler.PropertyRead && ast.receiver instanceof compiler.ImplicitReceiver) {
            const target = this.tcb.boundTarget.getExpressionTarget(ast);
            if (target !== null &&
                (!(target instanceof compiler.Variable) || !this.allowedVariables.has(target))) {
                this.tcb.oobRecorder.illegalForLoopTrackAccess(this.tcb.id, this.block, ast);
            }
        }
        return super.resolve(ast);
    }
}
// TODO(crisbeto): the logic for determining the fallback tag name of a Component node is
// still being designed. For now fall back to `ng-component`, but this will have to be
// revisited once the design is finalized.
function getComponentTagName(node) {
    return node.tagName || 'ng-component';
}

/**
 * An `Environment` representing the single type-checking file into which most (if not all) Type
 * Check Blocks (TCBs) will be generated.
 *
 * The `TypeCheckFile` hosts multiple TCBs and allows the sharing of declarations (e.g. type
 * constructors) between them. Rather than return such declarations via `getPreludeStatements()`, it
 * hoists them to the top of the generated `ts.SourceFile`.
 */
class TypeCheckFile extends Environment {
    fileName;
    nextTcbId = 1;
    tcbStatements = [];
    constructor(fileName, config, refEmitter, reflector, compilerHost) {
        super(config, new ImportManager({
            // This minimizes noticeable changes with older versions of `ImportManager`.
            forceGenerateNamespacesForNewImports: true,
            // Type check block code affects code completion and fix suggestions.
            // We want to encourage single quotes for now, like we always did.
            shouldUseSingleQuotes: () => true,
        }), refEmitter, reflector, ts.createSourceFile(compilerHost.getCanonicalFileName(fileName), '', ts.ScriptTarget.Latest, true));
        this.fileName = fileName;
    }
    addTypeCheckBlock(ref, meta, domSchemaChecker, oobRecorder, genericContextBehavior) {
        const fnId = ts.factory.createIdentifier(`_tcb${this.nextTcbId++}`);
        const fn = generateTypeCheckBlock(this, ref, fnId, meta, domSchemaChecker, oobRecorder, genericContextBehavior);
        this.tcbStatements.push(fn);
    }
    render(removeComments) {
        // NOTE: We are conditionally adding imports whenever we discover signal inputs. This has a
        // risk of changing the import graph of the TypeScript program, degrading incremental program
        // re-use due to program structure changes. For type check block files, we are ensuring an
        // import to e.g. `@angular/core` always exists to guarantee a stable graph.
        ensureTypeCheckFilePreparationImports(this);
        const importChanges = this.importManager.finalize();
        if (importChanges.updatedImports.size > 0) {
            throw new Error('AssertionError: Expected no imports to be updated for a new type check file.');
        }
        const printer = ts.createPrinter({ removeComments });
        let source = '';
        const newImports = importChanges.newImports.get(this.contextFile.fileName);
        if (newImports !== undefined) {
            source += newImports
                .map((i) => printer.printNode(ts.EmitHint.Unspecified, i, this.contextFile))
                .join('\n');
        }
        source += '\n';
        for (const stmt of this.pipeInstStatements) {
            source += printer.printNode(ts.EmitHint.Unspecified, stmt, this.contextFile) + '\n';
        }
        for (const stmt of this.typeCtorStatements) {
            source += printer.printNode(ts.EmitHint.Unspecified, stmt, this.contextFile) + '\n';
        }
        source += '\n';
        for (const stmt of this.tcbStatements) {
            source += printer.printNode(ts.EmitHint.Unspecified, stmt, this.contextFile) + '\n';
        }
        // Ensure the template type-checking file is an ES module. Otherwise, it's interpreted as some
        // kind of global namespace in TS, which forces a full re-typecheck of the user's program that
        // is somehow more expensive than the initial parse.
        source += '\nexport const IS_A_MODULE = true;\n';
        return source;
    }
    getPreludeStatements() {
        return [];
    }
}

/**
 * How a type-checking context should handle operations which would require inlining.
 */
var InliningMode;
(function (InliningMode) {
    /**
     * Use inlining operations when required.
     */
    InliningMode[InliningMode["InlineOps"] = 0] = "InlineOps";
    /**
     * Produce diagnostics if an operation would require inlining.
     */
    InliningMode[InliningMode["Error"] = 1] = "Error";
})(InliningMode || (InliningMode = {}));
/**
 * A template type checking context for a program.
 *
 * The `TypeCheckContext` allows registration of directives to be type checked.
 */
class TypeCheckContextImpl {
    config;
    compilerHost;
    refEmitter;
    reflector;
    host;
    inlining;
    perf;
    fileMap = new Map();
    constructor(config, compilerHost, refEmitter, reflector, host, inlining, perf) {
        this.config = config;
        this.compilerHost = compilerHost;
        this.refEmitter = refEmitter;
        this.reflector = reflector;
        this.host = host;
        this.inlining = inlining;
        this.perf = perf;
        if (inlining === InliningMode.Error && config.useInlineTypeConstructors) {
            // We cannot use inlining for type checking since this environment does not support it.
            throw new Error(`AssertionError: invalid inlining configuration.`);
        }
    }
    /**
     * A `Map` of `ts.SourceFile`s that the context has seen to the operations (additions of methods
     * or type-check blocks) that need to be eventually performed on that file.
     */
    opMap = new Map();
    /**
     * Tracks when an a particular class has a pending type constructor patching operation already
     * queued.
     */
    typeCtorPending = new Set();
    /**
     * Register a template to potentially be type-checked.
     *
     * Implements `TypeCheckContext.addTemplate`.
     */
    addDirective(ref, binder, schemas, templateContext, hostBindingContext, isStandalone) {
        if (!this.host.shouldCheckClass(ref.node)) {
            return;
        }
        const sourceFile = ref.node.getSourceFile();
        const fileData = this.dataForFile(sourceFile);
        const shimData = this.pendingShimForClass(ref.node);
        const id = fileData.sourceManager.getTypeCheckId(ref.node);
        const templateParsingDiagnostics = [];
        if (templateContext !== null && templateContext.parseErrors !== null) {
            templateParsingDiagnostics.push(...getTemplateDiagnostics(templateContext.parseErrors, id, templateContext.sourceMapping));
        }
        const boundTarget = binder.bind({
            template: templateContext?.nodes,
            host: hostBindingContext?.node,
        });
        if (this.inlining === InliningMode.InlineOps) {
            // Get all of the directives used in the template and record inline type constructors when
            // required.
            for (const dir of boundTarget.getUsedDirectives()) {
                const dirRef = dir.ref;
                const dirNode = dirRef.node;
                if (!dir.isGeneric || !requiresInlineTypeCtor(dirNode, this.reflector, shimData.file)) {
                    // inlining not required
                    continue;
                }
                // Add an inline type constructor operation for the directive.
                this.addInlineTypeCtor(fileData, dirNode.getSourceFile(), dirRef, {
                    fnName: 'ngTypeCtor',
                    // The constructor should have a body if the directive comes from a .ts file, but not if
                    // it comes from a .d.ts file. .d.ts declarations don't have bodies.
                    body: !dirNode.getSourceFile().isDeclarationFile,
                    fields: {
                        inputs: dir.inputs,
                        // TODO(alxhub): support queries
                        queries: dir.queries,
                    },
                    coercedInputFields: dir.coercedInputFields,
                });
            }
        }
        shimData.data.set(id, {
            template: templateContext?.nodes || null,
            boundTarget,
            templateParsingDiagnostics,
            hostElement: hostBindingContext?.node ?? null,
        });
        const usedPipes = [];
        if (templateContext !== null) {
            for (const name of boundTarget.getUsedPipes()) {
                if (templateContext.pipes.has(name)) {
                    usedPipes.push(templateContext.pipes.get(name).ref);
                }
            }
        }
        const inliningRequirement = requiresInlineTypeCheckBlock(ref, shimData.file, usedPipes, this.reflector);
        // If inlining is not supported, but is required for either the TCB or one of its directive
        // dependencies, then exit here with an error.
        if (this.inlining === InliningMode.Error &&
            inliningRequirement === TcbInliningRequirement.MustInline) {
            // This template cannot be supported because the underlying strategy does not support inlining
            // and inlining would be required.
            // Record diagnostics to indicate the issues with this template.
            shimData.oobRecorder.requiresInlineTcb(id, ref.node);
            // Checking this template would be unsupported, so don't try.
            this.perf.eventCount(exports.PerfEvent.SkipGenerateTcbNoInline);
            return;
        }
        if (templateContext !== null) {
            fileData.sourceManager.captureTemplateSource(id, templateContext.sourceMapping, templateContext.file);
        }
        if (hostBindingContext !== null) {
            fileData.sourceManager.captureHostBindingsMapping(id, hostBindingContext.sourceMapping, 
            // We only support host bindings in the same file as the directive
            // so we can get the source file from here.
            new compiler.ParseSourceFile(sourceFile.text, sourceFile.fileName));
        }
        const meta = {
            id,
            boundTarget,
            pipes: templateContext?.pipes || null,
            schemas,
            isStandalone,
            preserveWhitespaces: templateContext?.preserveWhitespaces ?? false,
        };
        this.perf.eventCount(exports.PerfEvent.GenerateTcb);
        if (inliningRequirement !== TcbInliningRequirement.None &&
            this.inlining === InliningMode.InlineOps) {
            // This class didn't meet the requirements for external type checking, so generate an inline
            // TCB for the class.
            this.addInlineTypeCheckBlock(fileData, shimData, ref, meta);
        }
        else if (inliningRequirement === TcbInliningRequirement.ShouldInlineForGenericBounds &&
            this.inlining === InliningMode.Error) {
            // It's suggested that this TCB should be generated inline due to the class' generic
            // bounds, but inlining is not supported by the current environment. Use a non-inline type
            // check block, but fall back to `any` generic parameters since the generic bounds can't be
            // referenced in that context. This will infer a less useful type for the class, but allow
            // for type-checking it in an environment where that would not be possible otherwise.
            shimData.file.addTypeCheckBlock(ref, meta, shimData.domSchemaChecker, shimData.oobRecorder, TcbGenericContextBehavior.FallbackToAny);
        }
        else {
            shimData.file.addTypeCheckBlock(ref, meta, shimData.domSchemaChecker, shimData.oobRecorder, TcbGenericContextBehavior.UseEmitter);
        }
    }
    /**
     * Record a type constructor for the given `node` with the given `ctorMetadata`.
     */
    addInlineTypeCtor(fileData, sf, ref, ctorMeta) {
        if (this.typeCtorPending.has(ref.node)) {
            return;
        }
        this.typeCtorPending.add(ref.node);
        // Lazily construct the operation map.
        if (!this.opMap.has(sf)) {
            this.opMap.set(sf, []);
        }
        const ops = this.opMap.get(sf);
        // Push a `TypeCtorOp` into the operation queue for the source file.
        ops.push(new TypeCtorOp(ref, this.reflector, ctorMeta));
        fileData.hasInlines = true;
    }
    /**
     * Transform a `ts.SourceFile` into a version that includes type checking code.
     *
     * If this particular `ts.SourceFile` requires changes, the text representing its new contents
     * will be returned. Otherwise, a `null` return indicates no changes were necessary.
     */
    transform(sf) {
        // If there are no operations pending for this particular file, return `null` to indicate no
        // changes.
        if (!this.opMap.has(sf)) {
            return null;
        }
        // Use a `ts.Printer` to generate source code.
        const printer = ts.createPrinter({ omitTrailingSemicolon: true });
        // Imports may need to be added to the file to support type-checking of directives
        // used in the template within it.
        const importManager = new ImportManager({
            // This minimizes noticeable changes with older versions of `ImportManager`.
            forceGenerateNamespacesForNewImports: true,
            // Type check block code affects code completion and fix suggestions.
            // We want to encourage single quotes for now, like we always did.
            shouldUseSingleQuotes: () => true,
        });
        // Execute ops.
        // Each Op has a splitPoint index into the text where it needs to be inserted.
        const updates = this.opMap
            .get(sf)
            .map((op) => {
            return {
                pos: op.splitPoint,
                text: op.execute(importManager, sf, this.refEmitter, printer),
            };
        });
        const { newImports, updatedImports } = importManager.finalize();
        // Capture new imports
        if (newImports.has(sf.fileName)) {
            newImports.get(sf.fileName).forEach((newImport) => {
                updates.push({
                    pos: 0,
                    text: printer.printNode(ts.EmitHint.Unspecified, newImport, sf),
                });
            });
        }
        // Capture updated imports
        for (const [oldBindings, newBindings] of updatedImports.entries()) {
            if (oldBindings.getSourceFile() !== sf) {
                throw new Error('Unexpected updates to unrelated source files.');
            }
            updates.push({
                pos: oldBindings.getStart(),
                deletePos: oldBindings.getEnd(),
                text: printer.printNode(ts.EmitHint.Unspecified, newBindings, sf),
            });
        }
        const result = new MagicString(sf.text, { filename: sf.fileName });
        for (const update of updates) {
            if (update.deletePos !== undefined) {
                result.remove(update.pos, update.deletePos);
            }
            result.appendLeft(update.pos, update.text);
        }
        return result.toString();
    }
    finalize() {
        // First, build the map of updates to source files.
        const updates = new Map();
        for (const originalSf of this.opMap.keys()) {
            const newText = this.transform(originalSf);
            if (newText !== null) {
                updates.set(absoluteFromSourceFile(originalSf), {
                    newText,
                    originalFile: originalSf,
                });
            }
        }
        // Then go through each input file that has pending code generation operations.
        for (const [sfPath, pendingFileData] of this.fileMap) {
            // For each input file, consider generation operations for each of its shims.
            for (const pendingShimData of pendingFileData.shimData.values()) {
                this.host.recordShimData(sfPath, {
                    genesisDiagnostics: [
                        ...pendingShimData.domSchemaChecker.diagnostics,
                        ...pendingShimData.oobRecorder.diagnostics,
                    ],
                    hasInlines: pendingFileData.hasInlines,
                    path: pendingShimData.file.fileName,
                    data: pendingShimData.data,
                });
                const sfText = pendingShimData.file.render(false /* removeComments */);
                updates.set(pendingShimData.file.fileName, {
                    newText: sfText,
                    // Shim files do not have an associated original file.
                    originalFile: null,
                });
            }
        }
        return updates;
    }
    addInlineTypeCheckBlock(fileData, shimData, ref, tcbMeta) {
        const sf = ref.node.getSourceFile();
        if (!this.opMap.has(sf)) {
            this.opMap.set(sf, []);
        }
        const ops = this.opMap.get(sf);
        ops.push(new InlineTcbOp(ref, tcbMeta, this.config, this.reflector, shimData.domSchemaChecker, shimData.oobRecorder));
        fileData.hasInlines = true;
    }
    pendingShimForClass(node) {
        const fileData = this.dataForFile(node.getSourceFile());
        const shimPath = TypeCheckShimGenerator.shimFor(absoluteFromSourceFile(node.getSourceFile()));
        if (!fileData.shimData.has(shimPath)) {
            fileData.shimData.set(shimPath, {
                domSchemaChecker: new RegistryDomSchemaChecker(fileData.sourceManager),
                oobRecorder: new OutOfBandDiagnosticRecorderImpl(fileData.sourceManager),
                file: new TypeCheckFile(shimPath, this.config, this.refEmitter, this.reflector, this.compilerHost),
                data: new Map(),
            });
        }
        return fileData.shimData.get(shimPath);
    }
    dataForFile(sf) {
        const sfPath = absoluteFromSourceFile(sf);
        if (!this.fileMap.has(sfPath)) {
            const data = {
                hasInlines: false,
                sourceManager: this.host.getSourceManager(sfPath),
                shimData: new Map(),
            };
            this.fileMap.set(sfPath, data);
        }
        return this.fileMap.get(sfPath);
    }
}
function getTemplateDiagnostics(parseErrors, templateId, sourceMapping) {
    return parseErrors.map((error) => {
        const span = error.span;
        if (span.start.offset === span.end.offset) {
            // Template errors can contain zero-length spans, if the error occurs at a single point.
            // However, TypeScript does not handle displaying a zero-length diagnostic very well, so
            // increase the ending offset by 1 for such errors, to ensure the position is shown in the
            // diagnostic.
            span.end.offset++;
        }
        return makeTemplateDiagnostic(templateId, sourceMapping, span, ts.DiagnosticCategory.Error, ngErrorCode(exports.ErrorCode.TEMPLATE_PARSE_ERROR), error.msg);
    });
}
/**
 * A type check block operation which produces inline type check code for a particular directive.
 */
class InlineTcbOp {
    ref;
    meta;
    config;
    reflector;
    domSchemaChecker;
    oobRecorder;
    constructor(ref, meta, config, reflector, domSchemaChecker, oobRecorder) {
        this.ref = ref;
        this.meta = meta;
        this.config = config;
        this.reflector = reflector;
        this.domSchemaChecker = domSchemaChecker;
        this.oobRecorder = oobRecorder;
    }
    /**
     * Type check blocks are inserted immediately after the end of the directve class.
     */
    get splitPoint() {
        return this.ref.node.end + 1;
    }
    execute(im, sf, refEmitter, printer) {
        const env = new Environment(this.config, im, refEmitter, this.reflector, sf);
        const fnName = ts.factory.createIdentifier(`_tcb_${this.ref.node.pos}`);
        // Inline TCBs should copy any generic type parameter nodes directly, as the TCB code is
        // inlined into the class in a context where that will always be legal.
        const fn = generateTypeCheckBlock(env, this.ref, fnName, this.meta, this.domSchemaChecker, this.oobRecorder, TcbGenericContextBehavior.CopyClassNodes);
        return printer.printNode(ts.EmitHint.Unspecified, fn, sf);
    }
}
/**
 * A type constructor operation which produces type constructor code for a particular directive.
 */
class TypeCtorOp {
    ref;
    reflector;
    meta;
    constructor(ref, reflector, meta) {
        this.ref = ref;
        this.reflector = reflector;
        this.meta = meta;
    }
    /**
     * Type constructor operations are inserted immediately before the end of the directive class.
     */
    get splitPoint() {
        return this.ref.node.end - 1;
    }
    execute(im, sf, refEmitter, printer) {
        const emitEnv = new ReferenceEmitEnvironment(im, refEmitter, this.reflector, sf);
        const tcb = generateInlineTypeCtor(emitEnv, this.ref.node, this.meta);
        return printer.printNode(ts.EmitHint.Unspecified, tcb, sf);
    }
}

const LF_CHAR = 10;
const CR_CHAR = 13;
const LINE_SEP_CHAR = 8232;
const PARAGRAPH_CHAR = 8233;
/** Gets the line and character for the given position from the line starts map. */
function getLineAndCharacterFromPosition(lineStartsMap, position) {
    const lineIndex = findClosestLineStartPosition(lineStartsMap, position);
    return { character: position - lineStartsMap[lineIndex], line: lineIndex };
}
/**
 * Computes the line start map of the given text. This can be used in order to
 * retrieve the line and character of a given text position index.
 */
function computeLineStartsMap(text) {
    const result = [0];
    let pos = 0;
    while (pos < text.length) {
        const char = text.charCodeAt(pos++);
        // Handles the "CRLF" line break. In that case we peek the character
        // after the "CR" and check if it is a line feed.
        if (char === CR_CHAR) {
            if (text.charCodeAt(pos) === LF_CHAR) {
                pos++;
            }
            result.push(pos);
        }
        else if (char === LF_CHAR || char === LINE_SEP_CHAR || char === PARAGRAPH_CHAR) {
            result.push(pos);
        }
    }
    result.push(pos);
    return result;
}
/** Finds the closest line start for the given position. */
function findClosestLineStartPosition(linesMap, position, low = 0, high = linesMap.length - 1) {
    while (low <= high) {
        const pivotIdx = Math.floor((low + high) / 2);
        const pivotEl = linesMap[pivotIdx];
        if (pivotEl === position) {
            return pivotIdx;
        }
        else if (position > pivotEl) {
            low = pivotIdx + 1;
        }
        else {
            high = pivotIdx - 1;
        }
    }
    // In case there was no exact match, return the closest "lower" line index. We also
    // subtract the index by one because want the index of the previous line start.
    return low - 1;
}

/**
 * Represents the source of code processed during type-checking. This information is used when
 * translating parse offsets in diagnostics back to their original line/column location.
 */
class Source {
    mapping;
    file;
    lineStarts = null;
    constructor(mapping, file) {
        this.mapping = mapping;
        this.file = file;
    }
    toParseSourceSpan(start, end) {
        const startLoc = this.toParseLocation(start);
        const endLoc = this.toParseLocation(end);
        return new compiler.ParseSourceSpan(startLoc, endLoc);
    }
    toParseLocation(position) {
        const lineStarts = this.acquireLineStarts();
        const { line, character } = getLineAndCharacterFromPosition(lineStarts, position);
        return new compiler.ParseLocation(this.file, position, line, character);
    }
    acquireLineStarts() {
        if (this.lineStarts === null) {
            this.lineStarts = computeLineStartsMap(this.file.content);
        }
        return this.lineStarts;
    }
}
/**
 * Assigns IDs for type checking and keeps track of their origins.
 *
 * Implements `TypeCheckSourceResolver` to resolve the source of a template based on these IDs.
 */
class DirectiveSourceManager {
    /**
     * This map keeps track of all template sources that have been type-checked by the id that is
     * attached to a TCB's function declaration as leading trivia. This enables translation of
     * diagnostics produced for TCB code to their source location in the template.
     */
    templateSources = new Map();
    /** Keeps track of type check IDs and the source location of their host bindings. */
    hostBindingSources = new Map();
    getTypeCheckId(node) {
        return getTypeCheckId$1(node);
    }
    captureTemplateSource(id, mapping, file) {
        this.templateSources.set(id, new Source(mapping, file));
    }
    captureHostBindingsMapping(id, mapping, file) {
        this.hostBindingSources.set(id, new Source(mapping, file));
    }
    getTemplateSourceMapping(id) {
        if (!this.templateSources.has(id)) {
            throw new Error(`Unexpected unknown type check ID: ${id}`);
        }
        return this.templateSources.get(id).mapping;
    }
    getHostBindingsMapping(id) {
        if (!this.hostBindingSources.has(id)) {
            throw new Error(`Unexpected unknown type check ID: ${id}`);
        }
        return this.hostBindingSources.get(id).mapping;
    }
    toTemplateParseSourceSpan(id, span) {
        if (!this.templateSources.has(id)) {
            return null;
        }
        const templateSource = this.templateSources.get(id);
        return templateSource.toParseSourceSpan(span.start, span.end);
    }
    toHostParseSourceSpan(id, span) {
        if (!this.hostBindingSources.has(id)) {
            return null;
        }
        const source = this.hostBindingSources.get(id);
        return source.toParseSourceSpan(span.start, span.end);
    }
}

/**
 * Generates and caches `Symbol`s for various template structures for a given component.
 *
 * The `SymbolBuilder` internally caches the `Symbol`s it creates, and must be destroyed and
 * replaced if the component's template changes.
 */
class SymbolBuilder {
    tcbPath;
    tcbIsShim;
    typeCheckBlock;
    typeCheckData;
    componentScopeReader;
    getTypeChecker;
    symbolCache = new Map();
    constructor(tcbPath, tcbIsShim, typeCheckBlock, typeCheckData, componentScopeReader, 
    // The `ts.TypeChecker` depends on the current type-checking program, and so must be requested
    // on-demand instead of cached.
    getTypeChecker) {
        this.tcbPath = tcbPath;
        this.tcbIsShim = tcbIsShim;
        this.typeCheckBlock = typeCheckBlock;
        this.typeCheckData = typeCheckData;
        this.componentScopeReader = componentScopeReader;
        this.getTypeChecker = getTypeChecker;
    }
    getSymbol(node) {
        if (this.symbolCache.has(node)) {
            return this.symbolCache.get(node);
        }
        let symbol = null;
        if (node instanceof compiler.BoundAttribute || node instanceof compiler.TextAttribute) {
            // TODO(atscott): input and output bindings only return the first directive match but should
            // return a list of bindings for all of them.
            symbol = this.getSymbolOfInputBinding(node);
        }
        else if (node instanceof compiler.BoundEvent) {
            symbol = this.getSymbolOfBoundEvent(node);
        }
        else if (node instanceof compiler.Element) {
            symbol = this.getSymbolOfElement(node);
        }
        else if (node instanceof compiler.Template) {
            symbol = this.getSymbolOfAstTemplate(node);
        }
        else if (node instanceof compiler.Variable) {
            symbol = this.getSymbolOfVariable(node);
        }
        else if (node instanceof compiler.LetDeclaration) {
            symbol = this.getSymbolOfLetDeclaration(node);
        }
        else if (node instanceof compiler.Reference) {
            symbol = this.getSymbolOfReference(node);
        }
        else if (node instanceof compiler.BindingPipe) {
            symbol = this.getSymbolOfPipe(node);
        }
        else if (node instanceof compiler.AST) {
            symbol = this.getSymbolOfTemplateExpression(node);
        }
        else ;
        this.symbolCache.set(node, symbol);
        return symbol;
    }
    getSymbolOfAstTemplate(template) {
        const directives = this.getDirectivesOfNode(template);
        return { kind: exports.SymbolKind.Template, directives, templateNode: template };
    }
    getSymbolOfElement(element) {
        const elementSourceSpan = element.startSourceSpan ?? element.sourceSpan;
        const node = findFirstMatchingNode(this.typeCheckBlock, {
            withSpan: elementSourceSpan,
            filter: ts.isVariableDeclaration,
        });
        if (node === null) {
            return null;
        }
        const symbolFromDeclaration = this.getSymbolOfTsNode(node);
        if (symbolFromDeclaration === null || symbolFromDeclaration.tsSymbol === null) {
            return null;
        }
        const directives = this.getDirectivesOfNode(element);
        // All statements in the TCB are `Expression`s that optionally include more information.
        // An `ElementSymbol` uses the information returned for the variable declaration expression,
        // adds the directives for the element, and updates the `kind` to be `SymbolKind.Element`.
        return {
            ...symbolFromDeclaration,
            kind: exports.SymbolKind.Element,
            directives,
            templateNode: element,
        };
    }
    getDirectivesOfNode(element) {
        const elementSourceSpan = element.startSourceSpan ?? element.sourceSpan;
        const tcbSourceFile = this.typeCheckBlock.getSourceFile();
        // directives could be either:
        // - var _t1: TestDir /*T:D*/ = null! as TestDir;
        // - var _t1 /*T:D*/ = _ctor1({});
        const isDirectiveDeclaration = (node) => (ts.isTypeNode(node) || ts.isIdentifier(node)) &&
            ts.isVariableDeclaration(node.parent) &&
            hasExpressionIdentifier(tcbSourceFile, node, ExpressionIdentifier.DIRECTIVE);
        const nodes = findAllMatchingNodes(this.typeCheckBlock, {
            withSpan: elementSourceSpan,
            filter: isDirectiveDeclaration,
        });
        const symbols = [];
        for (const node of nodes) {
            const symbol = this.getSymbolOfTsNode(node.parent);
            if (symbol === null ||
                !isSymbolWithValueDeclaration(symbol.tsSymbol) ||
                !ts.isClassDeclaration(symbol.tsSymbol.valueDeclaration)) {
                continue;
            }
            const meta = this.getDirectiveMeta(element, symbol.tsSymbol.valueDeclaration);
            if (meta !== null && meta.selector !== null) {
                const ref = new Reference(symbol.tsSymbol.valueDeclaration);
                if (meta.hostDirectives !== null) {
                    this.addHostDirectiveSymbols(element, meta.hostDirectives, symbols);
                }
                const directiveSymbol = {
                    ...symbol,
                    ref,
                    tsSymbol: symbol.tsSymbol,
                    selector: meta.selector,
                    isComponent: meta.isComponent,
                    ngModule: this.getDirectiveModule(symbol.tsSymbol.valueDeclaration),
                    kind: exports.SymbolKind.Directive,
                    isStructural: meta.isStructural,
                    isInScope: true,
                    isHostDirective: false,
                };
                symbols.push(directiveSymbol);
            }
        }
        return symbols;
    }
    addHostDirectiveSymbols(host, hostDirectives, symbols) {
        for (const current of hostDirectives) {
            if (!isHostDirectiveMetaForGlobalMode(current)) {
                throw new Error('Impossible state: typecheck code path in local compilation mode.');
            }
            if (!ts.isClassDeclaration(current.directive.node)) {
                continue;
            }
            const symbol = this.getSymbolOfTsNode(current.directive.node);
            const meta = this.getDirectiveMeta(host, current.directive.node);
            if (meta !== null && symbol !== null && isSymbolWithValueDeclaration(symbol.tsSymbol)) {
                if (meta.hostDirectives !== null) {
                    this.addHostDirectiveSymbols(host, meta.hostDirectives, symbols);
                }
                const directiveSymbol = {
                    ...symbol,
                    isHostDirective: true,
                    ref: current.directive,
                    tsSymbol: symbol.tsSymbol,
                    exposedInputs: current.inputs,
                    exposedOutputs: current.outputs,
                    selector: meta.selector,
                    isComponent: meta.isComponent,
                    ngModule: this.getDirectiveModule(current.directive.node),
                    kind: exports.SymbolKind.Directive,
                    isStructural: meta.isStructural,
                    isInScope: true,
                };
                symbols.push(directiveSymbol);
            }
        }
    }
    getDirectiveMeta(host, directiveDeclaration) {
        let directives = this.typeCheckData.boundTarget.getDirectivesOfNode(host);
        // `getDirectivesOfNode` will not return the directives intended for an element
        // on a microsyntax template, for example `<div *ngFor="let user of users;" dir>`,
        // the `dir` will be skipped, but it's needed in language service.
        const firstChild = host.children[0];
        if (firstChild instanceof compiler.Element) {
            const isMicrosyntaxTemplate = host instanceof compiler.Template && sourceSpanEqual(firstChild.sourceSpan, host.sourceSpan);
            if (isMicrosyntaxTemplate) {
                const firstChildDirectives = this.typeCheckData.boundTarget.getDirectivesOfNode(firstChild);
                if (firstChildDirectives !== null && directives !== null) {
                    directives = directives.concat(firstChildDirectives);
                }
                else {
                    directives = directives ?? firstChildDirectives;
                }
            }
        }
        if (directives === null) {
            return null;
        }
        const directive = directives.find((m) => m.ref.node === directiveDeclaration);
        if (directive) {
            return directive;
        }
        const originalFile = directiveDeclaration.getSourceFile()[NgOriginalFile];
        if (originalFile !== undefined) {
            // This is a preliminary check ahead of a more expensive search
            const hasPotentialCandidate = directives.find((m) => m.ref.node.name.text === directiveDeclaration.name?.text);
            if (hasPotentialCandidate) {
                // In case the TCB has been inlined,
                // We will look for a matching class
                // If we find one, we look for it in the directives array
                const classWithSameName = findMatchingDirective(originalFile, directiveDeclaration);
                if (classWithSameName !== null) {
                    return directives.find((m) => m.ref.node === classWithSameName) ?? null;
                }
            }
        }
        // Really nothing was found
        return null;
    }
    getDirectiveModule(declaration) {
        const scope = this.componentScopeReader.getScopeForComponent(declaration);
        if (scope === null || scope.kind !== exports.ComponentScopeKind.NgModule) {
            return null;
        }
        return scope.ngModule;
    }
    getSymbolOfBoundEvent(eventBinding) {
        const consumer = this.typeCheckData.boundTarget.getConsumerOfBinding(eventBinding);
        if (consumer === null) {
            return null;
        }
        // Outputs in the TCB look like one of the two:
        // * _t1["outputField"].subscribe(handler);
        // * _t1.addEventListener(handler);
        // Even with strict null checks disabled, we still produce the access as a separate statement
        // so that it can be found here.
        let expectedAccess;
        if (consumer instanceof compiler.Template || consumer instanceof compiler.Element) {
            expectedAccess = 'addEventListener';
        }
        else {
            const bindingPropertyNames = consumer.outputs.getByBindingPropertyName(eventBinding.name);
            if (bindingPropertyNames === null || bindingPropertyNames.length === 0) {
                return null;
            }
            // Note that we only get the expectedAccess text from a single consumer of the binding. If
            // there are multiple consumers (not supported in the `boundTarget` API) and one of them has
            // an alias, it will not get matched here.
            expectedAccess = bindingPropertyNames[0].classPropertyName;
        }
        function filter(n) {
            if (!isAccessExpression(n)) {
                return false;
            }
            if (ts.isPropertyAccessExpression(n)) {
                return n.name.getText() === expectedAccess;
            }
            else {
                return (ts.isStringLiteral(n.argumentExpression) && n.argumentExpression.text === expectedAccess);
            }
        }
        const outputFieldAccesses = findAllMatchingNodes(this.typeCheckBlock, {
            withSpan: eventBinding.keySpan,
            filter,
        });
        const bindings = [];
        for (const outputFieldAccess of outputFieldAccesses) {
            if (consumer instanceof compiler.Template || consumer instanceof compiler.Element) {
                if (!ts.isPropertyAccessExpression(outputFieldAccess)) {
                    continue;
                }
                const addEventListener = outputFieldAccess.name;
                const tsSymbol = this.getTypeChecker().getSymbolAtLocation(addEventListener);
                const tsType = this.getTypeChecker().getTypeAtLocation(addEventListener);
                const positionInFile = this.getTcbPositionForNode(addEventListener);
                const target = this.getSymbol(consumer);
                if (target === null || tsSymbol === undefined) {
                    continue;
                }
                bindings.push({
                    kind: exports.SymbolKind.Binding,
                    tsSymbol,
                    tsType,
                    target,
                    tcbLocation: {
                        tcbPath: this.tcbPath,
                        isShimFile: this.tcbIsShim,
                        positionInFile,
                    },
                });
            }
            else {
                if (!ts.isElementAccessExpression(outputFieldAccess)) {
                    continue;
                }
                const tsSymbol = this.getTypeChecker().getSymbolAtLocation(outputFieldAccess.argumentExpression);
                if (tsSymbol === undefined) {
                    continue;
                }
                const target = this.getDirectiveSymbolForAccessExpression(outputFieldAccess, consumer);
                if (target === null) {
                    continue;
                }
                const positionInFile = this.getTcbPositionForNode(outputFieldAccess);
                const tsType = this.getTypeChecker().getTypeAtLocation(outputFieldAccess);
                bindings.push({
                    kind: exports.SymbolKind.Binding,
                    tsSymbol,
                    tsType,
                    target,
                    tcbLocation: {
                        tcbPath: this.tcbPath,
                        isShimFile: this.tcbIsShim,
                        positionInFile,
                    },
                });
            }
        }
        if (bindings.length === 0) {
            return null;
        }
        return { kind: exports.SymbolKind.Output, bindings };
    }
    getSymbolOfInputBinding(binding) {
        const consumer = this.typeCheckData.boundTarget.getConsumerOfBinding(binding);
        if (consumer === null) {
            return null;
        }
        if (consumer instanceof compiler.Element || consumer instanceof compiler.Template) {
            const host = this.getSymbol(consumer);
            return host !== null ? { kind: exports.SymbolKind.DomBinding, host } : null;
        }
        const nodes = findAllMatchingNodes(this.typeCheckBlock, {
            withSpan: binding.sourceSpan,
            filter: isAssignment,
        });
        const bindings = [];
        for (const node of nodes) {
            if (!isAccessExpression(node.left)) {
                continue;
            }
            const signalInputAssignment = unwrapSignalInputWriteTAccessor(node.left);
            let fieldAccessExpr;
            let symbolInfo = null;
            // Signal inputs need special treatment because they are generated with an extra keyed
            // access. E.g. `_t1.prop[WriteT_ACCESSOR_SYMBOL]`. Observations:
            //   - The keyed access for the write type needs to be resolved for the "input type".
            //   - The definition symbol of the input should be the input class member, and not the
            //     internal write accessor. Symbol should resolve `_t1.prop`.
            if (signalInputAssignment !== null) {
                // Note: If the field expression for the input binding refers to just an identifier,
                // then we are handling the case of a temporary variable being used for the input field.
                // This is the case with `honorAccessModifiersForInputBindings = false` and in those cases
                // we cannot resolve the owning directive, similar to how we guard above with `isAccessExpression`.
                if (ts.isIdentifier(signalInputAssignment.fieldExpr)) {
                    continue;
                }
                const fieldSymbol = this.getSymbolOfTsNode(signalInputAssignment.fieldExpr);
                const typeSymbol = this.getSymbolOfTsNode(signalInputAssignment.typeExpr);
                fieldAccessExpr = signalInputAssignment.fieldExpr;
                symbolInfo =
                    fieldSymbol === null || typeSymbol === null
                        ? null
                        : {
                            tcbLocation: fieldSymbol.tcbLocation,
                            tsSymbol: fieldSymbol.tsSymbol,
                            tsType: typeSymbol.tsType,
                        };
            }
            else {
                fieldAccessExpr = node.left;
                symbolInfo = this.getSymbolOfTsNode(node.left);
            }
            if (symbolInfo === null || symbolInfo.tsSymbol === null) {
                continue;
            }
            const target = this.getDirectiveSymbolForAccessExpression(fieldAccessExpr, consumer);
            if (target === null) {
                continue;
            }
            bindings.push({
                ...symbolInfo,
                tsSymbol: symbolInfo.tsSymbol,
                kind: exports.SymbolKind.Binding,
                target,
            });
        }
        if (bindings.length === 0) {
            return null;
        }
        return { kind: exports.SymbolKind.Input, bindings };
    }
    getDirectiveSymbolForAccessExpression(fieldAccessExpr, { isComponent, selector, isStructural }) {
        // In all cases, `_t1["index"]` or `_t1.index`, `node.expression` is _t1.
        const tsSymbol = this.getTypeChecker().getSymbolAtLocation(fieldAccessExpr.expression);
        if (tsSymbol?.declarations === undefined ||
            tsSymbol.declarations.length === 0 ||
            selector === null) {
            return null;
        }
        const [declaration] = tsSymbol.declarations;
        if (!ts.isVariableDeclaration(declaration) ||
            !hasExpressionIdentifier(
            // The expression identifier could be on the type (for regular directives) or the name
            // (for generic directives and the ctor op).
            declaration.getSourceFile(), declaration.type ?? declaration.name, ExpressionIdentifier.DIRECTIVE)) {
            return null;
        }
        const symbol = this.getSymbolOfTsNode(declaration);
        if (symbol === null ||
            !isSymbolWithValueDeclaration(symbol.tsSymbol) ||
            !ts.isClassDeclaration(symbol.tsSymbol.valueDeclaration)) {
            return null;
        }
        const ref = new Reference(symbol.tsSymbol.valueDeclaration);
        const ngModule = this.getDirectiveModule(symbol.tsSymbol.valueDeclaration);
        return {
            ref,
            kind: exports.SymbolKind.Directive,
            tsSymbol: symbol.tsSymbol,
            tsType: symbol.tsType,
            tcbLocation: symbol.tcbLocation,
            isComponent,
            isStructural,
            selector,
            ngModule,
            isHostDirective: false,
            isInScope: true, // TODO: this should always be in scope in this context, right?
        };
    }
    getSymbolOfVariable(variable) {
        const node = findFirstMatchingNode(this.typeCheckBlock, {
            withSpan: variable.sourceSpan,
            filter: ts.isVariableDeclaration,
        });
        if (node === null) {
            return null;
        }
        let nodeValueSymbol = null;
        if (ts.isForOfStatement(node.parent.parent)) {
            nodeValueSymbol = this.getSymbolOfTsNode(node);
        }
        else if (node.initializer !== undefined) {
            nodeValueSymbol = this.getSymbolOfTsNode(node.initializer);
        }
        if (nodeValueSymbol === null) {
            return null;
        }
        return {
            tsType: nodeValueSymbol.tsType,
            tsSymbol: nodeValueSymbol.tsSymbol,
            initializerLocation: nodeValueSymbol.tcbLocation,
            kind: exports.SymbolKind.Variable,
            declaration: variable,
            localVarLocation: {
                tcbPath: this.tcbPath,
                isShimFile: this.tcbIsShim,
                positionInFile: this.getTcbPositionForNode(node.name),
            },
        };
    }
    getSymbolOfReference(ref) {
        const target = this.typeCheckData.boundTarget.getReferenceTarget(ref);
        // Find the node for the reference declaration, i.e. `var _t2 = _t1;`
        let node = findFirstMatchingNode(this.typeCheckBlock, {
            withSpan: ref.sourceSpan,
            filter: ts.isVariableDeclaration,
        });
        if (node === null || target === null || node.initializer === undefined) {
            return null;
        }
        // Get the original declaration for the references variable, with the exception of template refs
        // which are of the form var _t3 = (_t2 as any as i2.TemplateRef<any>)
        // TODO(atscott): Consider adding an `ExpressionIdentifier` to tag variable declaration
        // initializers as invalid for symbol retrieval.
        const originalDeclaration = ts.isParenthesizedExpression(node.initializer) &&
            ts.isAsExpression(node.initializer.expression)
            ? this.getTypeChecker().getSymbolAtLocation(node.name)
            : this.getTypeChecker().getSymbolAtLocation(node.initializer);
        if (originalDeclaration === undefined || originalDeclaration.valueDeclaration === undefined) {
            return null;
        }
        const symbol = this.getSymbolOfTsNode(originalDeclaration.valueDeclaration);
        if (symbol === null || symbol.tsSymbol === null) {
            return null;
        }
        const referenceVarTcbLocation = {
            tcbPath: this.tcbPath,
            isShimFile: this.tcbIsShim,
            positionInFile: this.getTcbPositionForNode(node),
        };
        if (target instanceof compiler.Template || target instanceof compiler.Element) {
            return {
                kind: exports.SymbolKind.Reference,
                tsSymbol: symbol.tsSymbol,
                tsType: symbol.tsType,
                target,
                declaration: ref,
                targetLocation: symbol.tcbLocation,
                referenceVarLocation: referenceVarTcbLocation,
            };
        }
        else {
            if (!ts.isClassDeclaration(target.directive.ref.node)) {
                return null;
            }
            return {
                kind: exports.SymbolKind.Reference,
                tsSymbol: symbol.tsSymbol,
                tsType: symbol.tsType,
                declaration: ref,
                target: target.directive.ref.node,
                targetLocation: symbol.tcbLocation,
                referenceVarLocation: referenceVarTcbLocation,
            };
        }
    }
    getSymbolOfLetDeclaration(decl) {
        const node = findFirstMatchingNode(this.typeCheckBlock, {
            withSpan: decl.sourceSpan,
            filter: ts.isVariableDeclaration,
        });
        if (node === null) {
            return null;
        }
        const nodeValueSymbol = this.getSymbolOfTsNode(node.initializer);
        if (nodeValueSymbol === null) {
            return null;
        }
        return {
            tsType: nodeValueSymbol.tsType,
            tsSymbol: nodeValueSymbol.tsSymbol,
            initializerLocation: nodeValueSymbol.tcbLocation,
            kind: exports.SymbolKind.LetDeclaration,
            declaration: decl,
            localVarLocation: {
                tcbPath: this.tcbPath,
                isShimFile: this.tcbIsShim,
                positionInFile: this.getTcbPositionForNode(node.name),
            },
        };
    }
    getSymbolOfPipe(expression) {
        const methodAccess = findFirstMatchingNode(this.typeCheckBlock, {
            withSpan: expression.nameSpan,
            filter: ts.isPropertyAccessExpression,
        });
        if (methodAccess === null) {
            return null;
        }
        const pipeVariableNode = methodAccess.expression;
        const pipeDeclaration = this.getTypeChecker().getSymbolAtLocation(pipeVariableNode);
        if (pipeDeclaration === undefined || pipeDeclaration.valueDeclaration === undefined) {
            return null;
        }
        const pipeInstance = this.getSymbolOfTsNode(pipeDeclaration.valueDeclaration);
        // The instance should never be null, nor should the symbol lack a value declaration. This
        // is because the node used to look for the `pipeInstance` symbol info is a value
        // declaration of another symbol (i.e. the `pipeDeclaration` symbol).
        if (pipeInstance === null || !isSymbolWithValueDeclaration(pipeInstance.tsSymbol)) {
            return null;
        }
        const symbolInfo = this.getSymbolOfTsNode(methodAccess);
        if (symbolInfo === null) {
            return null;
        }
        return {
            kind: exports.SymbolKind.Pipe,
            ...symbolInfo,
            classSymbol: {
                ...pipeInstance,
                tsSymbol: pipeInstance.tsSymbol,
            },
        };
    }
    getSymbolOfTemplateExpression(expression) {
        if (expression instanceof compiler.ASTWithSource) {
            expression = expression.ast;
        }
        const expressionTarget = this.typeCheckData.boundTarget.getExpressionTarget(expression);
        if (expressionTarget !== null) {
            return this.getSymbol(expressionTarget);
        }
        let withSpan = expression.sourceSpan;
        // The `name` part of a `PropertyWrite` and `ASTWithName` do not have their own
        // AST so there is no way to retrieve a `Symbol` for just the `name` via a specific node.
        // Also skipping SafePropertyReads as it breaks nullish coalescing not nullable extended diagnostic
        if (expression instanceof compiler.PropertyWrite ||
            (expression instanceof compiler.ASTWithName && !(expression instanceof compiler.SafePropertyRead))) {
            withSpan = expression.nameSpan;
        }
        let node = null;
        // Property reads in templates usually map to a `PropertyAccessExpression`
        // (e.g. `ctx.foo`) so try looking for one first.
        if (expression instanceof compiler.PropertyRead) {
            node = findFirstMatchingNode(this.typeCheckBlock, {
                withSpan,
                filter: ts.isPropertyAccessExpression,
            });
        }
        // Otherwise fall back to searching for any AST node.
        if (node === null) {
            node = findFirstMatchingNode(this.typeCheckBlock, { withSpan, filter: anyNodeFilter });
        }
        if (node === null) {
            return null;
        }
        while (ts.isParenthesizedExpression(node)) {
            node = node.expression;
        }
        // - If we have safe property read ("a?.b") we want to get the Symbol for b, the `whenTrue`
        // expression.
        // - If our expression is a pipe binding ("a | test:b:c"), we want the Symbol for the
        // `transform` on the pipe.
        // - Otherwise, we retrieve the symbol for the node itself with no special considerations
        if (expression instanceof compiler.SafePropertyRead && ts.isConditionalExpression(node)) {
            const whenTrueSymbol = this.getSymbolOfTsNode(node.whenTrue);
            if (whenTrueSymbol === null) {
                return null;
            }
            return {
                ...whenTrueSymbol,
                kind: exports.SymbolKind.Expression,
                // Rather than using the type of only the `whenTrue` part of the expression, we should
                // still get the type of the whole conditional expression to include `|undefined`.
                tsType: this.getTypeChecker().getTypeAtLocation(node),
            };
        }
        else {
            const symbolInfo = this.getSymbolOfTsNode(node);
            return symbolInfo === null ? null : { ...symbolInfo, kind: exports.SymbolKind.Expression };
        }
    }
    getSymbolOfTsNode(node) {
        while (ts.isParenthesizedExpression(node)) {
            node = node.expression;
        }
        let tsSymbol;
        if (ts.isPropertyAccessExpression(node)) {
            tsSymbol = this.getTypeChecker().getSymbolAtLocation(node.name);
        }
        else if (ts.isCallExpression(node)) {
            tsSymbol = this.getTypeChecker().getSymbolAtLocation(node.expression);
        }
        else {
            tsSymbol = this.getTypeChecker().getSymbolAtLocation(node);
        }
        const positionInFile = this.getTcbPositionForNode(node);
        const type = this.getTypeChecker().getTypeAtLocation(node);
        return {
            // If we could not find a symbol, fall back to the symbol on the type for the node.
            // Some nodes won't have a "symbol at location" but will have a symbol for the type.
            // Examples of this would be literals and `document.createElement('div')`.
            tsSymbol: tsSymbol ?? type.symbol ?? null,
            tsType: type,
            tcbLocation: {
                tcbPath: this.tcbPath,
                isShimFile: this.tcbIsShim,
                positionInFile,
            },
        };
    }
    getTcbPositionForNode(node) {
        if (ts.isTypeReferenceNode(node)) {
            return this.getTcbPositionForNode(node.typeName);
        }
        else if (ts.isQualifiedName(node)) {
            return node.right.getStart();
        }
        else if (ts.isPropertyAccessExpression(node)) {
            return node.name.getStart();
        }
        else if (ts.isElementAccessExpression(node)) {
            return node.argumentExpression.getStart();
        }
        else {
            return node.getStart();
        }
    }
}
/** Filter predicate function that matches any AST node. */
function anyNodeFilter(n) {
    return true;
}
function sourceSpanEqual(a, b) {
    return a.start.offset === b.start.offset && a.end.offset === b.end.offset;
}
function unwrapSignalInputWriteTAccessor(expr) {
    // e.g. `_t2.inputA[i2.ɵINPUT_SIGNAL_BRAND_WRITE_TYPE]`
    // 1. Assert that we are dealing with an element access expression.
    // 2. Assert that we are dealing with a signal brand symbol access in the argument expression.
    if (!ts.isElementAccessExpression(expr) ||
        !ts.isPropertyAccessExpression(expr.argumentExpression)) {
        return null;
    }
    // Assert that the property access in the element access is a simple identifier and
    // refers to `ɵINPUT_SIGNAL_BRAND_WRITE_TYPE`.
    if (!ts.isIdentifier(expr.argumentExpression.name) ||
        expr.argumentExpression.name.text !== compiler.Identifiers.InputSignalBrandWriteType.name) {
        return null;
    }
    // Assert that the expression is either:
    //   - `_t2.inputA[ɵINPUT_SIGNAL_BRAND_WRITE_TYPE]` or (common case)
    //   - or `_t2['input-A'][ɵINPUT_SIGNAL_BRAND_WRITE_TYPE]` (non-identifier input field names)
    //   - or `_dirInput[ɵINPUT_SIGNAL_BRAND_WRITE_TYPE` (honorAccessModifiersForInputBindings=false)
    // This is checked for type safety and to catch unexpected cases.
    if (!ts.isPropertyAccessExpression(expr.expression) &&
        !ts.isElementAccessExpression(expr.expression) &&
        !ts.isIdentifier(expr.expression)) {
        throw new Error('Unexpected expression for signal input write type.');
    }
    return {
        fieldExpr: expr.expression,
        typeExpr: expr,
    };
}
/**
 * Looks for a class declaration in the original source file that matches a given directive
 * from the type check source file.
 *
 * @param originalSourceFile The original source where the runtime code resides
 * @param directiveDeclarationInTypeCheckSourceFile The directive from the type check source file
 */
function findMatchingDirective(originalSourceFile, directiveDeclarationInTypeCheckSourceFile) {
    const className = directiveDeclarationInTypeCheckSourceFile.name?.text ?? '';
    // We build an index of the class declarations with the same name
    // To then compare the indexes to confirm we found the right class declaration
    const ogClasses = collectClassesWithName(originalSourceFile, className);
    const typecheckClasses = collectClassesWithName(directiveDeclarationInTypeCheckSourceFile.getSourceFile(), className);
    return ogClasses[typecheckClasses.indexOf(directiveDeclarationInTypeCheckSourceFile)] ?? null;
}
/**
 * Builds a list of class declarations of a given name
 * Is used as a index based reference to compare class declarations
 * between the typecheck source file and the original source file
 */
function collectClassesWithName(sourceFile, className) {
    const classes = [];
    function visit(node) {
        if (ts.isClassDeclaration(node) && node.name?.text === className) {
            classes.push(node);
        }
        ts.forEachChild(node, visit);
    }
    sourceFile.forEachChild(visit);
    return classes;
}

const REGISTRY = new compiler.DomElementSchemaRegistry();
/**
 * Primary template type-checking engine, which performs type-checking using a
 * `TypeCheckingProgramStrategy` for type-checking program maintenance, and the
 * `ProgramTypeCheckAdapter` for generation of template type-checking code.
 */
class TemplateTypeCheckerImpl {
    originalProgram;
    programDriver;
    typeCheckAdapter;
    config;
    refEmitter;
    reflector;
    compilerHost;
    priorBuild;
    metaReader;
    localMetaReader;
    ngModuleIndex;
    componentScopeReader;
    typeCheckScopeRegistry;
    perf;
    state = new Map();
    /**
     * Stores the `CompletionEngine` which powers autocompletion for each component class.
     *
     * Must be invalidated whenever the component's template or the `ts.Program` changes. Invalidation
     * on template changes is performed within this `TemplateTypeCheckerImpl` instance. When the
     * `ts.Program` changes, the `TemplateTypeCheckerImpl` as a whole is destroyed and replaced.
     */
    completionCache = new Map();
    /**
     * Stores the `SymbolBuilder` which creates symbols for each component class.
     *
     * Must be invalidated whenever the component's template or the `ts.Program` changes. Invalidation
     * on template changes is performed within this `TemplateTypeCheckerImpl` instance. When the
     * `ts.Program` changes, the `TemplateTypeCheckerImpl` as a whole is destroyed and replaced.
     */
    symbolBuilderCache = new Map();
    /**
     * Stores directives and pipes that are in scope for each component.
     *
     * Unlike other caches, the scope of a component is not affected by its template. It will be
     * destroyed when the `ts.Program` changes and the `TemplateTypeCheckerImpl` as a whole is
     * destroyed and replaced.
     */
    scopeCache = new Map();
    /**
     * Stores potential element tags for each component (a union of DOM tags as well as directive
     * tags).
     *
     * Unlike other caches, the scope of a component is not affected by its template. It will be
     * destroyed when the `ts.Program` changes and the `TemplateTypeCheckerImpl` as a whole is
     * destroyed and replaced.
     */
    elementTagCache = new Map();
    isComplete = false;
    constructor(originalProgram, programDriver, typeCheckAdapter, config, refEmitter, reflector, compilerHost, priorBuild, metaReader, localMetaReader, ngModuleIndex, componentScopeReader, typeCheckScopeRegistry, perf) {
        this.originalProgram = originalProgram;
        this.programDriver = programDriver;
        this.typeCheckAdapter = typeCheckAdapter;
        this.config = config;
        this.refEmitter = refEmitter;
        this.reflector = reflector;
        this.compilerHost = compilerHost;
        this.priorBuild = priorBuild;
        this.metaReader = metaReader;
        this.localMetaReader = localMetaReader;
        this.ngModuleIndex = ngModuleIndex;
        this.componentScopeReader = componentScopeReader;
        this.typeCheckScopeRegistry = typeCheckScopeRegistry;
        this.perf = perf;
    }
    getTemplate(component, optimizeFor) {
        const { data } = this.getLatestComponentState(component, optimizeFor);
        return data?.template ?? null;
    }
    getHostElement(directive, optimizeFor) {
        const { data } = this.getLatestComponentState(directive, optimizeFor);
        return data?.hostElement ?? null;
    }
    getUsedDirectives(component) {
        return this.getLatestComponentState(component).data?.boundTarget.getUsedDirectives() ?? null;
    }
    getUsedPipes(component) {
        return this.getLatestComponentState(component).data?.boundTarget.getUsedPipes() ?? null;
    }
    getLatestComponentState(component, optimizeFor = exports.OptimizeFor.SingleFile) {
        switch (optimizeFor) {
            case exports.OptimizeFor.WholeProgram:
                this.ensureAllShimsForAllFiles();
                break;
            case exports.OptimizeFor.SingleFile:
                this.ensureShimForComponent(component);
                break;
        }
        const sf = component.getSourceFile();
        const sfPath = absoluteFromSourceFile(sf);
        const shimPath = TypeCheckShimGenerator.shimFor(sfPath);
        const fileRecord = this.getFileData(sfPath);
        if (!fileRecord.shimData.has(shimPath)) {
            return { data: null, tcb: null, tcbPath: shimPath, tcbIsShim: true };
        }
        const id = fileRecord.sourceManager.getTypeCheckId(component);
        const shimRecord = fileRecord.shimData.get(shimPath);
        const program = this.programDriver.getProgram();
        const shimSf = getSourceFileOrNull(program, shimPath);
        if (shimSf === null || !fileRecord.shimData.has(shimPath)) {
            throw new Error(`Error: no shim file in program: ${shimPath}`);
        }
        let tcb = findTypeCheckBlock(shimSf, id, /*isDiagnosticsRequest*/ false);
        let tcbPath = shimPath;
        if (tcb === null) {
            // Try for an inline block.
            const inlineSf = getSourceFileOrError(program, sfPath);
            tcb = findTypeCheckBlock(inlineSf, id, /*isDiagnosticsRequest*/ false);
            if (tcb !== null) {
                tcbPath = sfPath;
            }
        }
        let data = null;
        if (shimRecord.data.has(id)) {
            data = shimRecord.data.get(id);
        }
        return { data, tcb, tcbPath, tcbIsShim: tcbPath === shimPath };
    }
    isTrackedTypeCheckFile(filePath) {
        return this.getFileAndShimRecordsForPath(filePath) !== null;
    }
    getFileRecordForTcbLocation({ tcbPath, isShimFile, }) {
        if (!isShimFile) {
            // The location is not within a shim file but corresponds with an inline TCB in an original
            // source file; we can obtain the record directly by its path.
            if (this.state.has(tcbPath)) {
                return this.state.get(tcbPath);
            }
            else {
                return null;
            }
        }
        // The location is within a type-checking shim file; find the type-checking data that owns this
        // shim path.
        const records = this.getFileAndShimRecordsForPath(tcbPath);
        if (records !== null) {
            return records.fileRecord;
        }
        else {
            return null;
        }
    }
    getFileAndShimRecordsForPath(shimPath) {
        for (const fileRecord of this.state.values()) {
            if (fileRecord.shimData.has(shimPath)) {
                return { fileRecord, shimRecord: fileRecord.shimData.get(shimPath) };
            }
        }
        return null;
    }
    getSourceMappingAtTcbLocation(tcbLocation) {
        const fileRecord = this.getFileRecordForTcbLocation(tcbLocation);
        if (fileRecord === null) {
            return null;
        }
        const shimSf = this.programDriver.getProgram().getSourceFile(tcbLocation.tcbPath);
        if (shimSf === undefined) {
            return null;
        }
        return getSourceMapping(shimSf, tcbLocation.positionInFile, fileRecord.sourceManager, 
        /*isDiagnosticsRequest*/ false);
    }
    generateAllTypeCheckBlocks() {
        this.ensureAllShimsForAllFiles();
    }
    /**
     * Retrieve type-checking and template parse diagnostics from the given `ts.SourceFile` using the
     * most recent type-checking program.
     */
    getDiagnosticsForFile(sf, optimizeFor) {
        switch (optimizeFor) {
            case exports.OptimizeFor.WholeProgram:
                this.ensureAllShimsForAllFiles();
                break;
            case exports.OptimizeFor.SingleFile:
                this.ensureAllShimsForOneFile(sf);
                break;
        }
        return this.perf.inPhase(exports.PerfPhase.TtcDiagnostics, () => {
            const sfPath = absoluteFromSourceFile(sf);
            const fileRecord = this.state.get(sfPath);
            const typeCheckProgram = this.programDriver.getProgram();
            const diagnostics = [];
            if (fileRecord.hasInlines) {
                const inlineSf = getSourceFileOrError(typeCheckProgram, sfPath);
                diagnostics.push(...typeCheckProgram
                    .getSemanticDiagnostics(inlineSf)
                    .map((diag) => convertDiagnostic(diag, fileRecord.sourceManager)));
            }
            for (const [shimPath, shimRecord] of fileRecord.shimData) {
                const shimSf = getSourceFileOrError(typeCheckProgram, shimPath);
                diagnostics.push(...typeCheckProgram
                    .getSemanticDiagnostics(shimSf)
                    .map((diag) => convertDiagnostic(diag, fileRecord.sourceManager)));
                diagnostics.push(...shimRecord.genesisDiagnostics);
                for (const templateData of shimRecord.data.values()) {
                    diagnostics.push(...templateData.templateParsingDiagnostics);
                }
            }
            return diagnostics.filter((diag) => diag !== null);
        });
    }
    getDiagnosticsForComponent(component) {
        this.ensureShimForComponent(component);
        return this.perf.inPhase(exports.PerfPhase.TtcDiagnostics, () => {
            const sf = component.getSourceFile();
            const sfPath = absoluteFromSourceFile(sf);
            const shimPath = TypeCheckShimGenerator.shimFor(sfPath);
            const fileRecord = this.getFileData(sfPath);
            if (!fileRecord.shimData.has(shimPath)) {
                return [];
            }
            const id = fileRecord.sourceManager.getTypeCheckId(component);
            const shimRecord = fileRecord.shimData.get(shimPath);
            const typeCheckProgram = this.programDriver.getProgram();
            const diagnostics = [];
            if (shimRecord.hasInlines) {
                const inlineSf = getSourceFileOrError(typeCheckProgram, sfPath);
                diagnostics.push(...typeCheckProgram
                    .getSemanticDiagnostics(inlineSf)
                    .map((diag) => convertDiagnostic(diag, fileRecord.sourceManager)));
            }
            const shimSf = getSourceFileOrError(typeCheckProgram, shimPath);
            diagnostics.push(...typeCheckProgram
                .getSemanticDiagnostics(shimSf)
                .map((diag) => convertDiagnostic(diag, fileRecord.sourceManager)));
            diagnostics.push(...shimRecord.genesisDiagnostics);
            for (const templateData of shimRecord.data.values()) {
                diagnostics.push(...templateData.templateParsingDiagnostics);
            }
            return diagnostics.filter((diag) => diag !== null && diag.typeCheckId === id);
        });
    }
    getTypeCheckBlock(component) {
        return this.getLatestComponentState(component).tcb;
    }
    getGlobalCompletions(context, component, node) {
        const engine = this.getOrCreateCompletionEngine(component);
        if (engine === null) {
            return null;
        }
        return this.perf.inPhase(exports.PerfPhase.TtcAutocompletion, () => engine.getGlobalCompletions(context, node));
    }
    getExpressionCompletionLocation(ast, component) {
        const engine = this.getOrCreateCompletionEngine(component);
        if (engine === null) {
            return null;
        }
        return this.perf.inPhase(exports.PerfPhase.TtcAutocompletion, () => engine.getExpressionCompletionLocation(ast));
    }
    getLiteralCompletionLocation(node, component) {
        const engine = this.getOrCreateCompletionEngine(component);
        if (engine === null) {
            return null;
        }
        return this.perf.inPhase(exports.PerfPhase.TtcAutocompletion, () => engine.getLiteralCompletionLocation(node));
    }
    invalidateClass(clazz) {
        this.completionCache.delete(clazz);
        this.symbolBuilderCache.delete(clazz);
        this.scopeCache.delete(clazz);
        this.elementTagCache.delete(clazz);
        const sf = clazz.getSourceFile();
        const sfPath = absoluteFromSourceFile(sf);
        const shimPath = TypeCheckShimGenerator.shimFor(sfPath);
        const fileData = this.getFileData(sfPath);
        fileData.sourceManager.getTypeCheckId(clazz);
        fileData.shimData.delete(shimPath);
        fileData.isComplete = false;
        this.isComplete = false;
    }
    getExpressionTarget(expression, clazz) {
        return (this.getLatestComponentState(clazz).data?.boundTarget.getExpressionTarget(expression) ?? null);
    }
    makeTemplateDiagnostic(clazz, sourceSpan, category, errorCode, message, relatedInformation) {
        const sfPath = absoluteFromSourceFile(clazz.getSourceFile());
        const fileRecord = this.state.get(sfPath);
        const id = fileRecord.sourceManager.getTypeCheckId(clazz);
        const mapping = fileRecord.sourceManager.getTemplateSourceMapping(id);
        return {
            ...makeTemplateDiagnostic(id, mapping, sourceSpan, category, ngErrorCode(errorCode), message, relatedInformation),
            __ngCode: errorCode,
        };
    }
    getOrCreateCompletionEngine(component) {
        if (this.completionCache.has(component)) {
            return this.completionCache.get(component);
        }
        const { tcb, data, tcbPath, tcbIsShim } = this.getLatestComponentState(component);
        if (tcb === null || data === null) {
            return null;
        }
        const engine = new CompletionEngine(tcb, data, tcbPath, tcbIsShim);
        this.completionCache.set(component, engine);
        return engine;
    }
    maybeAdoptPriorResultsForFile(sf) {
        const sfPath = absoluteFromSourceFile(sf);
        if (this.state.has(sfPath)) {
            const existingResults = this.state.get(sfPath);
            if (existingResults.isComplete) {
                // All data for this file has already been generated, so no need to adopt anything.
                return;
            }
        }
        const previousResults = this.priorBuild.priorTypeCheckingResultsFor(sf);
        if (previousResults === null || !previousResults.isComplete) {
            return;
        }
        this.perf.eventCount(exports.PerfEvent.ReuseTypeCheckFile);
        this.state.set(sfPath, previousResults);
    }
    ensureAllShimsForAllFiles() {
        if (this.isComplete) {
            return;
        }
        this.perf.inPhase(exports.PerfPhase.TcbGeneration, () => {
            const host = new WholeProgramTypeCheckingHost(this);
            const ctx = this.newContext(host);
            for (const sf of this.originalProgram.getSourceFiles()) {
                if (sf.isDeclarationFile || isShim(sf)) {
                    continue;
                }
                this.maybeAdoptPriorResultsForFile(sf);
                const sfPath = absoluteFromSourceFile(sf);
                const fileData = this.getFileData(sfPath);
                if (fileData.isComplete) {
                    continue;
                }
                this.typeCheckAdapter.typeCheck(sf, ctx);
                fileData.isComplete = true;
            }
            this.updateFromContext(ctx);
            this.isComplete = true;
        });
    }
    ensureAllShimsForOneFile(sf) {
        this.perf.inPhase(exports.PerfPhase.TcbGeneration, () => {
            this.maybeAdoptPriorResultsForFile(sf);
            const sfPath = absoluteFromSourceFile(sf);
            const fileData = this.getFileData(sfPath);
            if (fileData.isComplete) {
                // All data for this file is present and accounted for already.
                return;
            }
            const host = new SingleFileTypeCheckingHost(sfPath, fileData, this);
            const ctx = this.newContext(host);
            this.typeCheckAdapter.typeCheck(sf, ctx);
            fileData.isComplete = true;
            this.updateFromContext(ctx);
        });
    }
    ensureShimForComponent(component) {
        const sf = component.getSourceFile();
        const sfPath = absoluteFromSourceFile(sf);
        const shimPath = TypeCheckShimGenerator.shimFor(sfPath);
        this.maybeAdoptPriorResultsForFile(sf);
        const fileData = this.getFileData(sfPath);
        if (fileData.shimData.has(shimPath)) {
            // All data for this component is available.
            return;
        }
        const host = new SingleShimTypeCheckingHost(sfPath, fileData, this, shimPath);
        const ctx = this.newContext(host);
        this.typeCheckAdapter.typeCheck(sf, ctx);
        this.updateFromContext(ctx);
    }
    newContext(host) {
        const inlining = this.programDriver.supportsInlineOperations
            ? InliningMode.InlineOps
            : InliningMode.Error;
        return new TypeCheckContextImpl(this.config, this.compilerHost, this.refEmitter, this.reflector, host, inlining, this.perf);
    }
    /**
     * Remove any shim data that depends on inline operations applied to the type-checking program.
     *
     * This can be useful if new inlines need to be applied, and it's not possible to guarantee that
     * they won't overwrite or corrupt existing inlines that are used by such shims.
     */
    clearAllShimDataUsingInlines() {
        for (const fileData of this.state.values()) {
            if (!fileData.hasInlines) {
                continue;
            }
            for (const [shimFile, shimData] of fileData.shimData.entries()) {
                if (shimData.hasInlines) {
                    fileData.shimData.delete(shimFile);
                }
            }
            fileData.hasInlines = false;
            fileData.isComplete = false;
            this.isComplete = false;
        }
    }
    updateFromContext(ctx) {
        const updates = ctx.finalize();
        return this.perf.inPhase(exports.PerfPhase.TcbUpdateProgram, () => {
            if (updates.size > 0) {
                this.perf.eventCount(exports.PerfEvent.UpdateTypeCheckProgram);
            }
            this.programDriver.updateFiles(updates, exports.UpdateMode.Incremental);
            this.priorBuild.recordSuccessfulTypeCheck(this.state);
            this.perf.memory(exports.PerfCheckpoint.TtcUpdateProgram);
        });
    }
    getFileData(path) {
        if (!this.state.has(path)) {
            this.state.set(path, {
                hasInlines: false,
                sourceManager: new DirectiveSourceManager(),
                isComplete: false,
                shimData: new Map(),
            });
        }
        return this.state.get(path);
    }
    getSymbolOfNode(node, component) {
        const builder = this.getOrCreateSymbolBuilder(component);
        if (builder === null) {
            return null;
        }
        return this.perf.inPhase(exports.PerfPhase.TtcSymbol, () => builder.getSymbol(node));
    }
    getOrCreateSymbolBuilder(component) {
        if (this.symbolBuilderCache.has(component)) {
            return this.symbolBuilderCache.get(component);
        }
        const { tcb, data, tcbPath, tcbIsShim } = this.getLatestComponentState(component);
        if (tcb === null || data === null) {
            return null;
        }
        const builder = new SymbolBuilder(tcbPath, tcbIsShim, tcb, data, this.componentScopeReader, () => this.programDriver.getProgram().getTypeChecker());
        this.symbolBuilderCache.set(component, builder);
        return builder;
    }
    getPotentialTemplateDirectives(component) {
        const typeChecker = this.programDriver.getProgram().getTypeChecker();
        const inScopeDirectives = this.getScopeData(component)?.directives ?? [];
        const resultingDirectives = new Map();
        // First, all in scope directives can be used.
        for (const d of inScopeDirectives) {
            resultingDirectives.set(d.ref.node, d);
        }
        // Any additional directives found from the global registry can be used, but are not in scope.
        // In the future, we can also walk other registries for .d.ts files, or traverse the
        // import/export graph.
        for (const directiveClass of this.localMetaReader.getKnown(exports.MetaKind.Directive)) {
            const directiveMeta = this.metaReader.getDirectiveMetadata(new Reference(directiveClass));
            if (directiveMeta === null)
                continue;
            if (resultingDirectives.has(directiveClass))
                continue;
            const withScope = this.scopeDataOfDirectiveMeta(typeChecker, directiveMeta);
            if (withScope === null)
                continue;
            resultingDirectives.set(directiveClass, { ...withScope, isInScope: false });
        }
        return Array.from(resultingDirectives.values());
    }
    getPotentialPipes(component) {
        // Very similar to the above `getPotentialTemplateDirectives`, but on pipes.
        const typeChecker = this.programDriver.getProgram().getTypeChecker();
        const inScopePipes = this.getScopeData(component)?.pipes ?? [];
        const resultingPipes = new Map();
        for (const p of inScopePipes) {
            resultingPipes.set(p.ref.node, p);
        }
        for (const pipeClass of this.localMetaReader.getKnown(exports.MetaKind.Pipe)) {
            const pipeMeta = this.metaReader.getPipeMetadata(new Reference(pipeClass));
            if (pipeMeta === null)
                continue;
            if (resultingPipes.has(pipeClass))
                continue;
            const withScope = this.scopeDataOfPipeMeta(typeChecker, pipeMeta);
            if (withScope === null)
                continue;
            resultingPipes.set(pipeClass, { ...withScope, isInScope: false });
        }
        return Array.from(resultingPipes.values());
    }
    getDirectiveMetadata(dir) {
        if (!isNamedClassDeclaration(dir)) {
            return null;
        }
        return this.typeCheckScopeRegistry.getTypeCheckDirectiveMetadata(new Reference(dir));
    }
    getNgModuleMetadata(module) {
        if (!isNamedClassDeclaration(module)) {
            return null;
        }
        return this.metaReader.getNgModuleMetadata(new Reference(module));
    }
    getPipeMetadata(pipe) {
        if (!isNamedClassDeclaration(pipe)) {
            return null;
        }
        return this.metaReader.getPipeMetadata(new Reference(pipe));
    }
    getPotentialElementTags(component) {
        if (this.elementTagCache.has(component)) {
            return this.elementTagCache.get(component);
        }
        const tagMap = new Map();
        for (const tag of REGISTRY.allKnownElementNames()) {
            tagMap.set(tag, null);
        }
        const potentialDirectives = this.getPotentialTemplateDirectives(component);
        for (const directive of potentialDirectives) {
            if (directive.selector === null) {
                continue;
            }
            for (const selector of compiler.CssSelector.parse(directive.selector)) {
                if (selector.element === null || tagMap.has(selector.element)) {
                    // Skip this directive if it doesn't match an element tag, or if another directive has
                    // already been included with the same element name.
                    continue;
                }
                tagMap.set(selector.element, directive);
            }
        }
        this.elementTagCache.set(component, tagMap);
        return tagMap;
    }
    getPotentialDomBindings(tagName) {
        const attributes = REGISTRY.allKnownAttributesOfElement(tagName);
        return attributes.map((attribute) => ({
            attribute,
            property: REGISTRY.getMappedPropName(attribute),
        }));
    }
    getPotentialDomEvents(tagName) {
        return REGISTRY.allKnownEventsOfElement(tagName);
    }
    getPrimaryAngularDecorator(target) {
        this.ensureAllShimsForOneFile(target.getSourceFile());
        if (!isNamedClassDeclaration(target)) {
            return null;
        }
        const ref = new Reference(target);
        const dirMeta = this.metaReader.getDirectiveMetadata(ref);
        if (dirMeta !== null) {
            return dirMeta.decorator;
        }
        const pipeMeta = this.metaReader.getPipeMetadata(ref);
        if (pipeMeta !== null) {
            return pipeMeta.decorator;
        }
        const ngModuleMeta = this.metaReader.getNgModuleMetadata(ref);
        if (ngModuleMeta !== null) {
            return ngModuleMeta.decorator;
        }
        return null;
    }
    getOwningNgModule(component) {
        if (!isNamedClassDeclaration(component)) {
            return null;
        }
        const dirMeta = this.metaReader.getDirectiveMetadata(new Reference(component));
        if (dirMeta !== null && dirMeta.isStandalone) {
            return null;
        }
        const scope = this.componentScopeReader.getScopeForComponent(component);
        if (scope === null ||
            scope.kind !== exports.ComponentScopeKind.NgModule ||
            !isNamedClassDeclaration(scope.ngModule)) {
            return null;
        }
        return scope.ngModule;
    }
    emit(kind, refTo, inContext) {
        const emittedRef = this.refEmitter.emit(refTo, inContext.getSourceFile());
        if (emittedRef.kind === exports.ReferenceEmitKind.Failed) {
            return null;
        }
        const emitted = emittedRef.expression;
        if (emitted instanceof compiler.WrappedNodeExpr) {
            if (refTo.node === inContext) {
                // Suppress self-imports since components do not have to import themselves.
                return null;
            }
            let isForwardReference = false;
            if (emitted.node.getStart() > inContext.getStart()) {
                const declaration = this.programDriver
                    .getProgram()
                    .getTypeChecker()
                    .getTypeAtLocation(emitted.node)
                    .getSymbol()?.declarations?.[0];
                if (declaration && declaration.getSourceFile() === inContext.getSourceFile()) {
                    isForwardReference = true;
                }
            }
            // An appropriate identifier is already in scope.
            return { kind, symbolName: emitted.node.text, isForwardReference };
        }
        else if (emitted instanceof compiler.ExternalExpr &&
            emitted.value.moduleName !== null &&
            emitted.value.name !== null) {
            return {
                kind,
                moduleSpecifier: emitted.value.moduleName,
                symbolName: emitted.value.name,
                isForwardReference: false,
            };
        }
        return null;
    }
    getPotentialImportsFor(toImport, inContext, importMode) {
        const imports = [];
        const meta = this.metaReader.getDirectiveMetadata(toImport) ?? this.metaReader.getPipeMetadata(toImport);
        if (meta === null) {
            return imports;
        }
        if (meta.isStandalone || importMode === exports.PotentialImportMode.ForceDirect) {
            const emitted = this.emit(exports.PotentialImportKind.Standalone, toImport, inContext);
            if (emitted !== null) {
                imports.push(emitted);
            }
        }
        const exportingNgModules = this.ngModuleIndex.getNgModulesExporting(meta.ref.node);
        if (exportingNgModules !== null) {
            for (const exporter of exportingNgModules) {
                const emittedRef = this.emit(exports.PotentialImportKind.NgModule, exporter, inContext);
                if (emittedRef !== null) {
                    imports.push(emittedRef);
                }
            }
        }
        return imports;
    }
    getScopeData(component) {
        if (this.scopeCache.has(component)) {
            return this.scopeCache.get(component);
        }
        if (!isNamedClassDeclaration(component)) {
            throw new Error(`AssertionError: components must have names`);
        }
        const scope = this.componentScopeReader.getScopeForComponent(component);
        if (scope === null) {
            return null;
        }
        const dependencies = scope.kind === exports.ComponentScopeKind.NgModule
            ? scope.compilation.dependencies
            : scope.dependencies;
        const data = {
            directives: [],
            pipes: [],
            isPoisoned: scope.kind === exports.ComponentScopeKind.NgModule
                ? scope.compilation.isPoisoned
                : scope.isPoisoned,
        };
        const typeChecker = this.programDriver.getProgram().getTypeChecker();
        for (const dep of dependencies) {
            if (dep.kind === exports.MetaKind.Directive) {
                const dirScope = this.scopeDataOfDirectiveMeta(typeChecker, dep);
                if (dirScope === null)
                    continue;
                data.directives.push({ ...dirScope, isInScope: true });
            }
            else if (dep.kind === exports.MetaKind.Pipe) {
                const pipeScope = this.scopeDataOfPipeMeta(typeChecker, dep);
                if (pipeScope === null)
                    continue;
                data.pipes.push({ ...pipeScope, isInScope: true });
            }
        }
        this.scopeCache.set(component, data);
        return data;
    }
    scopeDataOfDirectiveMeta(typeChecker, dep) {
        if (dep.selector === null) {
            // Skip this directive, it can't be added to a template anyway.
            return null;
        }
        const tsSymbol = typeChecker.getSymbolAtLocation(dep.ref.node.name);
        if (!isSymbolWithValueDeclaration(tsSymbol)) {
            return null;
        }
        let ngModule = null;
        const moduleScopeOfDir = this.componentScopeReader.getScopeForComponent(dep.ref.node);
        if (moduleScopeOfDir !== null && moduleScopeOfDir.kind === exports.ComponentScopeKind.NgModule) {
            ngModule = moduleScopeOfDir.ngModule;
        }
        return {
            ref: dep.ref,
            isComponent: dep.isComponent,
            isStructural: dep.isStructural,
            selector: dep.selector,
            tsSymbol,
            ngModule,
        };
    }
    scopeDataOfPipeMeta(typeChecker, dep) {
        const tsSymbol = typeChecker.getSymbolAtLocation(dep.ref.node.name);
        if (tsSymbol === undefined) {
            return null;
        }
        return {
            ref: dep.ref,
            name: dep.name,
            tsSymbol,
        };
    }
}
function convertDiagnostic(diag, sourceResolver) {
    if (!shouldReportDiagnostic(diag)) {
        return null;
    }
    return translateDiagnostic(diag, sourceResolver);
}
/**
 * Drives a `TypeCheckContext` to generate type-checking code for every component in the program.
 */
class WholeProgramTypeCheckingHost {
    impl;
    constructor(impl) {
        this.impl = impl;
    }
    getSourceManager(sfPath) {
        return this.impl.getFileData(sfPath).sourceManager;
    }
    shouldCheckClass(node) {
        const sfPath = absoluteFromSourceFile(node.getSourceFile());
        const shimPath = TypeCheckShimGenerator.shimFor(sfPath);
        const fileData = this.impl.getFileData(sfPath);
        // The component needs to be checked unless the shim which would contain it already exists.
        return !fileData.shimData.has(shimPath);
    }
    recordShimData(sfPath, data) {
        const fileData = this.impl.getFileData(sfPath);
        fileData.shimData.set(data.path, data);
        if (data.hasInlines) {
            fileData.hasInlines = true;
        }
    }
    recordComplete(sfPath) {
        this.impl.getFileData(sfPath).isComplete = true;
    }
}
/**
 * Drives a `TypeCheckContext` to generate type-checking code efficiently for a single input file.
 */
class SingleFileTypeCheckingHost {
    sfPath;
    fileData;
    impl;
    seenInlines = false;
    constructor(sfPath, fileData, impl) {
        this.sfPath = sfPath;
        this.fileData = fileData;
        this.impl = impl;
    }
    assertPath(sfPath) {
        if (this.sfPath !== sfPath) {
            throw new Error(`AssertionError: querying TypeCheckingHost outside of assigned file`);
        }
    }
    getSourceManager(sfPath) {
        this.assertPath(sfPath);
        return this.fileData.sourceManager;
    }
    shouldCheckClass(node) {
        if (this.sfPath !== absoluteFromSourceFile(node.getSourceFile())) {
            return false;
        }
        const shimPath = TypeCheckShimGenerator.shimFor(this.sfPath);
        // Only need to generate a TCB for the class if no shim exists for it currently.
        return !this.fileData.shimData.has(shimPath);
    }
    recordShimData(sfPath, data) {
        this.assertPath(sfPath);
        // Previous type-checking state may have required the use of inlines (assuming they were
        // supported). If the current operation also requires inlines, this presents a problem:
        // generating new inlines may invalidate any old inlines that old state depends on.
        //
        // Rather than resolve this issue by tracking specific dependencies on inlines, if the new state
        // relies on inlines, any old state that relied on them is simply cleared. This happens when the
        // first new state that uses inlines is encountered.
        if (data.hasInlines && !this.seenInlines) {
            this.impl.clearAllShimDataUsingInlines();
            this.seenInlines = true;
        }
        this.fileData.shimData.set(data.path, data);
        if (data.hasInlines) {
            this.fileData.hasInlines = true;
        }
    }
    recordComplete(sfPath) {
        this.assertPath(sfPath);
        this.fileData.isComplete = true;
    }
}
/**
 * Drives a `TypeCheckContext` to generate type-checking code efficiently for only those components
 * which map to a single shim of a single input file.
 */
class SingleShimTypeCheckingHost extends SingleFileTypeCheckingHost {
    shimPath;
    constructor(sfPath, fileData, impl, shimPath) {
        super(sfPath, fileData, impl);
        this.shimPath = shimPath;
    }
    shouldCheckNode(node) {
        if (this.sfPath !== absoluteFromSourceFile(node.getSourceFile())) {
            return false;
        }
        // Only generate a TCB for the component if it maps to the requested shim file.
        const shimPath = TypeCheckShimGenerator.shimFor(this.sfPath);
        if (shimPath !== this.shimPath) {
            return false;
        }
        // Only need to generate a TCB for the class if no shim exists for it currently.
        return !this.fileData.shimData.has(shimPath);
    }
}

exports.AbsoluteModuleStrategy = AbsoluteModuleStrategy;
exports.COMPILER_ERRORS_WITH_GUIDES = COMPILER_ERRORS_WITH_GUIDES;
exports.ClassPropertyMapping = ClassPropertyMapping;
exports.CompoundMetadataReader = CompoundMetadataReader;
exports.DefaultImportTracker = DefaultImportTracker;
exports.DynamicValue = DynamicValue;
exports.EnumValue = EnumValue;
exports.FatalDiagnosticError = FatalDiagnosticError;
exports.INPUT_INITIALIZER_FN = INPUT_INITIALIZER_FN;
exports.ImportManager = ImportManager;
exports.LocalIdentifierStrategy = LocalIdentifierStrategy;
exports.LogicalFileSystem = LogicalFileSystem;
exports.LogicalProjectStrategy = LogicalProjectStrategy;
exports.MODEL_INITIALIZER_FN = MODEL_INITIALIZER_FN;
exports.NgOriginalFile = NgOriginalFile;
exports.NodeJSFileSystem = NodeJSFileSystem;
exports.OUTPUT_INITIALIZER_FNS = OUTPUT_INITIALIZER_FNS;
exports.QUERY_INITIALIZER_FNS = QUERY_INITIALIZER_FNS;
exports.Reference = Reference;
exports.ReferenceEmitter = ReferenceEmitter;
exports.RelativePathStrategy = RelativePathStrategy;
exports.StaticInterpreter = StaticInterpreter;
exports.SyntheticValue = SyntheticValue;
exports.TemplateTypeCheckerImpl = TemplateTypeCheckerImpl;
exports.Trait = Trait;
exports.TypeCheckShimGenerator = TypeCheckShimGenerator;
exports.TypeScriptReflectionHost = TypeScriptReflectionHost;
exports.UnifiedModulesStrategy = UnifiedModulesStrategy;
exports.absoluteFrom = absoluteFrom;
exports.absoluteFromSourceFile = absoluteFromSourceFile;
exports.assertLocalCompilationUnresolvedConst = assertLocalCompilationUnresolvedConst;
exports.assertSuccessfulReferenceEmit = assertSuccessfulReferenceEmit;
exports.checkInheritanceOfInjectable = checkInheritanceOfInjectable;
exports.combineResolvers = combineResolvers;
exports.compileResults = compileResults;
exports.copyFileShimData = copyFileShimData;
exports.createForwardRefResolver = createForwardRefResolver;
exports.createHostElement = createHostElement;
exports.createValueHasWrongTypeError = createValueHasWrongTypeError;
exports.dirname = dirname;
exports.entityNameToValue = entityNameToValue;
exports.extraReferenceFromTypeQuery = extraReferenceFromTypeQuery;
exports.extractDecoratorQueryMetadata = extractDecoratorQueryMetadata;
exports.extractDirectiveMetadata = extractDirectiveMetadata;
exports.extractDirectiveTypeCheckMeta = extractDirectiveTypeCheckMeta;
exports.extractHostBindingResources = extractHostBindingResources;
exports.extractReferencesFromType = extractReferencesFromType;
exports.findAngularDecorator = findAngularDecorator;
exports.flattenInheritedDirectiveMetadata = flattenInheritedDirectiveMetadata;
exports.getAngularDecorators = getAngularDecorators;
exports.getConstructorDependencies = getConstructorDependencies;
exports.getContainingImportDeclaration = getContainingImportDeclaration;
exports.getDefaultImportDeclaration = getDefaultImportDeclaration;
exports.getDirectiveDiagnostics = getDirectiveDiagnostics;
exports.getFileSystem = getFileSystem;
exports.getOriginNodeForDiagnostics = getOriginNodeForDiagnostics;
exports.getProviderDiagnostics = getProviderDiagnostics;
exports.getRootDirs = getRootDirs;
exports.getSourceFile = getSourceFile;
exports.getSourceFileOrNull = getSourceFileOrNull;
exports.getTemplateDiagnostics = getTemplateDiagnostics;
exports.getUndecoratedClassWithAngularFeaturesDiagnostic = getUndecoratedClassWithAngularFeaturesDiagnostic;
exports.getValidConstructorDependencies = getValidConstructorDependencies;
exports.hasInjectableFields = hasInjectableFields;
exports.identifierOfNode = identifierOfNode;
exports.isAbstractClassDeclaration = isAbstractClassDeclaration;
exports.isAliasImportDeclaration = isAliasImportDeclaration;
exports.isAngularCore = isAngularCore;
exports.isAngularCoreReferenceWithPotentialAliasing = isAngularCoreReferenceWithPotentialAliasing;
exports.isAngularDecorator = isAngularDecorator;
exports.isDtsPath = isDtsPath;
exports.isExpressionForwardReference = isExpressionForwardReference;
exports.isFatalDiagnosticError = isFatalDiagnosticError;
exports.isFileShimSourceFile = isFileShimSourceFile;
exports.isHostDirectiveMetaForGlobalMode = isHostDirectiveMetaForGlobalMode;
exports.isLocalRelativePath = isLocalRelativePath;
exports.isNamedClassDeclaration = isNamedClassDeclaration;
exports.isNonDeclarationTsPath = isNonDeclarationTsPath;
exports.isShim = isShim;
exports.join = join;
exports.loadIsReferencedAliasDeclarationPatch = loadIsReferencedAliasDeclarationPatch;
exports.makeDiagnostic = makeDiagnostic;
exports.makeDuplicateDeclarationError = makeDuplicateDeclarationError;
exports.makeRelatedInformation = makeRelatedInformation;
exports.ngErrorCode = ngErrorCode;
exports.nodeDebugInfo = nodeDebugInfo;
exports.nodeNameForError = nodeNameForError;
exports.parseDecoratorInputTransformFunction = parseDecoratorInputTransformFunction;
exports.parseDirectiveStyles = parseDirectiveStyles;
exports.presetImportManagerForceNamespaceImports = presetImportManagerForceNamespaceImports;
exports.queryDecoratorNames = queryDecoratorNames;
exports.readBaseClass = readBaseClass;
exports.readBooleanType = readBooleanType;
exports.readMapType = readMapType;
exports.readStringArrayType = readStringArrayType;
exports.readStringType = readStringType;
exports.reflectClassMember = reflectClassMember;
exports.reflectObjectLiteral = reflectObjectLiteral;
exports.relative = relative;
exports.resolve = resolve;
exports.resolveImportedFile = resolveImportedFile;
exports.resolveModuleName = resolveModuleName;
exports.resolveProvidersRequiringFactory = resolveProvidersRequiringFactory;
exports.retagAllTsFiles = retagAllTsFiles;
exports.setFileSystem = setFileSystem;
exports.sfExtensionData = sfExtensionData;
exports.stripExtension = stripExtension;
exports.toFactoryMetadata = toFactoryMetadata;
exports.toR3Reference = toR3Reference;
exports.toRelativeImport = toRelativeImport;
exports.toUnredirectedSourceFile = toUnredirectedSourceFile;
exports.translateExpression = translateExpression;
exports.translateStatement = translateStatement;
exports.translateType = translateType;
exports.tryParseInitializerApi = tryParseInitializerApi;
exports.tryParseInitializerBasedOutput = tryParseInitializerBasedOutput;
exports.tryParseSignalInputMapping = tryParseSignalInputMapping;
exports.tryParseSignalModelMapping = tryParseSignalModelMapping;
exports.tryParseSignalQueryFromInitializer = tryParseSignalQueryFromInitializer;
exports.tryUnwrapForwardRef = tryUnwrapForwardRef;
exports.typeNodeToValueExpr = typeNodeToValueExpr;
exports.untagAllTsFiles = untagAllTsFiles;
exports.unwrapConstructorDependencies = unwrapConstructorDependencies;
exports.unwrapExpression = unwrapExpression;
exports.validateConstructorDependencies = validateConstructorDependencies;
exports.validateHostDirectives = validateHostDirectives;
exports.valueReferenceToExpression = valueReferenceToExpression;
exports.wrapFunctionExpressionsInParens = wrapFunctionExpressionsInParens;
exports.wrapTypeReference = wrapTypeReference;
