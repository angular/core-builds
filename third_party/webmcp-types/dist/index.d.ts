export {};

type IsUnion<T, TWhole = T> = T extends TWhole ? [TWhole] extends [T] ? false : true : never;
type NonUnionTupleElements<TTuple extends readonly string[]> = {
    [TIndex in keyof TTuple]: true extends IsUnion<TTuple[TIndex]> ? never : TTuple[TIndex];
}[number];
type Simplify<T> = { [TKey in keyof T]: T[TKey] } & {};

type JsonSchemaRequiredKeys<TSchema> = TSchema extends {
    readonly required: infer TRequired extends readonly string[];
} ? number extends TRequired["length"]
    ? never
    : true extends IsUnion<TRequired>
        ? never
        : string extends TRequired[number]
            ? never
            : NonUnionTupleElements<TRequired>
    : never;

type InferJsonSchema<TSchema> = TSchema extends { readonly const: infer TValue } ? TValue
    : TSchema extends { readonly enum: readonly (infer TValue)[] } ? TValue
    : TSchema extends { readonly type: "string" } ? string
    : TSchema extends { readonly type: "number" | "integer" } ? number
    : TSchema extends { readonly type: "boolean" } ? boolean
    : TSchema extends { readonly type: "null" } ? null
    : TSchema extends { readonly type: "array" }
        ? TSchema extends { readonly items: infer TItems } ? InferJsonSchema<TItems>[] : unknown[]
    : TSchema extends { readonly type: "object" } | { readonly properties: object }
        ? TSchema extends { readonly properties: infer TProperties extends object }
            ? keyof TProperties extends never ? Record<string, unknown> : Simplify<{
                -readonly [K in keyof TProperties]?: InferJsonSchema<TProperties[K]>;
            } & {
                -readonly [K in keyof TProperties & JsonSchemaRequiredKeys<TSchema>]-?: InferJsonSchema<TProperties[K]>;
            }>
        : Record<string, unknown>
    : unknown;

type InferToolInput<TSchema> = [InferJsonSchema<TSchema>] extends [null | undefined] ? Record<string, unknown>
    : InferJsonSchema<TSchema> extends object ? InferJsonSchema<TSchema>
    : Record<string, unknown>;

declare global {
/**
 * The WebMCP API enables web apps to provide JavaScript-based tools to AI agents.
 */
namespace WebMCP {
    /**
     * Value that may be returned synchronously or via Promise.
     */
    type MaybePromise<T> = T | Promise<T>;

    /**
     * Options passed to a tool's execute callback when the tool is executed.
     */
    interface ToolExecuteCallbackOptions {
        /**
         * An AbortSignal that communicates when the execution of the tool has been cancelled.
         */
        signal: AbortSignal;
    }

    /**
     * Callback for tool execution.
     * @param inputObject The input parameters for the tool, as defined by its inputSchema.
     * @param options Options passed when executing the tool.
     * @returns A promise that resolves with the tool's output.
     */
    type ToolExecuteCallback<T extends object = Record<string, unknown>> = (inputObject: T, options: ToolExecuteCallbackOptions) => MaybePromise<unknown>;

    /**
     * Metadata about a tool's behavior.
     */
    interface ToolAnnotations {
        /**
         * If `true`, the tool does not modify any state and only reads data.
         * @default false
         */
        readOnlyHint?: boolean;
        /**
         * If `true`, indicates the tool may return content from untrusted sources.
         * @default false
         */
        untrustedContentHint?: boolean;
        /**
         * If `true`, indicates that executing the tool will result in consequential actions that are significant, real-world, or non-reversible, ex: booking a flight, transferring money.
         * @default false
         */
        consequentialHint?: boolean;
        /**
         * If `true`, indicates that the tool is intended for debugging and developer tooling rather than end-user interactions.
         * @default false
         */
        debugging?: boolean;
    }

    /**
     * Describes a tool to be registered with the model context.
     */
    interface ModelContextTool {
        /**
         * The name of the tool. Must be 1-128 characters, ASCII alphanumeric, '_', '-', or '.'.
         */
        name: string;
        /**
         * A human-readable title for the tool.
         */
        title?: string;
        /**
         * Natural-language description of what the tool does.
         */
        description: string;
        /**
         * A JSON Schema describing the tool's input parameters.
         */
        inputSchema?: object;
        /**
         * The function to execute when the tool is called.
         */
        execute: ToolExecuteCallback;
        /**
         * Metadata about the tool's behavior.
         */
        annotations?: ToolAnnotations;
    }

    /** A tool whose execute input is inferred from its input schema. */
    type ModelContextToolFromSchema<TInputSchema extends object> = Omit<ModelContextTool, "inputSchema" | "execute"> & {
        inputSchema: TInputSchema;
        execute: ToolExecuteCallback<InferToolInput<TInputSchema>>;
    };

    /**
     * Options for registering a tool.
     */
    interface ModelContextRegisterToolOptions {
        /**
         * An AbortSignal that can be used to unregister the tool.
         */
        signal?: AbortSignal;
        /**
         * A list of origins that are allowed to call this tool.
         */
        exposedTo?: string[];
    }

    /**
     * Options for querying registered tools.
     */
    interface ModelContextGetToolOptions {
        /**
         * An array of origins from which to query tools.
         */
        fromOrigins?: string[];
    }

    /**
     * Options for executing a tool.
     */
    interface ModelContextExecuteToolOptions {
        /**
         * An AbortSignal that can be used to cancel the execution of the tool.
         */
        signal?: AbortSignal;
    }

    /**
     * Represents a tool that has been registered and is available for execution.
     */
    interface RegisteredTool {
        /**
         * A unique identifier for the tool.
         */
        name: string;
        /**
         * A human-readable label for the tool.
         */
        title: string;
        /**
         * Natural-language description of what the tool does.
         */
        description: string;
        /**
         * A JSON Schema object describing the expected input parameters for the tool.
         * It is a deep copy of the schema provided at tool registration, via `ModelContextTool.inputSchema`.
         */
        inputSchema?: object;
        /**
         * The Window of the document that registered the tool.
         */
        window: Window;
        /**
         * The origin of the document that registered the tool.
         */
        origin: string;
        /**
         * Metadata about the tool's behavior.
         */
        annotations?: ToolAnnotations;
    }

    /**
     * Initialization options for a `ToolActivatedEvent`.
     */
    type ToolActivatedEventInit = globalThis.ToolActivatedEventInit;

    /**
     * Event dispatched at a `ModelContext` when the execution of a tool begins.
     */
    type ToolActivatedEvent = globalThis.ToolActivatedEvent;

    /**
     * Initialization options for a `ToolCancelEvent`.
     */
    type ToolCancelEventInit = globalThis.ToolCancelEventInit;

    /**
     * Event dispatched at a `ModelContext` when the execution of a tool is cancelled.
     */
    type ToolCancelEvent = globalThis.ToolCancelEvent;

    interface ModelContextEventMap {
        "toolchange": Event;
        "toolactivated": ToolActivatedEvent;
        "toolcancel": ToolCancelEvent;
    }

    /**
     * The ModelContext interface provides methods for registering tools.
     */
    interface ModelContext extends EventTarget {
        /**
         * Registers a new tool and infers its execute input from its input schema.
         * @param tool The tool definition.
         * @param options Registration options.
         */
        registerTool<const TInputSchema extends object>(tool: ModelContextToolFromSchema<TInputSchema>, options?: ModelContextRegisterToolOptions): Promise<void>;
        /**
         * Registers a new tool.
         * @param tool The tool definition.
         * @param options Registration options.
         */
        registerTool(tool: ModelContextTool, options?: ModelContextRegisterToolOptions): Promise<void>;
        /**
         * Returns a list of registered tools exposed to this document.
         * @param options Filtering options.
         */
        getTools(options?: ModelContextGetToolOptions): Promise<RegisteredTool[]>;
        /**
         * Executes a tool on the document it was registered on.
         * @param tool The tool to execute.
         * @param inputObject The input parameters for the tool.
         * @param options Execution options.
         */
        executeTool(tool: RegisteredTool, inputObject?: object, options?: ModelContextExecuteToolOptions): Promise<string>;
        /**
         * Event handler for the toolchange event.
         */
        ontoolchange: ((this: ModelContext, ev: Event) => any) | null;
        /**
         * Event handler for the toolactivated event.
         */
        ontoolactivated: ((this: ModelContext, ev: ToolActivatedEvent) => any) | null;
        /**
         * Event handler for the toolcancel event.
         */
        ontoolcancel: ((this: ModelContext, ev: ToolCancelEvent) => any) | null;

        addEventListener<K extends keyof ModelContextEventMap>(type: K, listener: (this: ModelContext, ev: ModelContextEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
        removeEventListener<K extends keyof ModelContextEventMap>(type: K, listener: (this: ModelContext, ev: ModelContextEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    }
}

interface Document {
    /**
     * The model context for the current document.
     * May be undefined if the browser doesn't support WebMCP.
     */
    readonly modelContext?: WebMCP.ModelContext;
}

interface ToolActivatedEventInit extends EventInit {
    /**
     * The name of the tool whose execution has started.
     */
    toolName?: string;
}

/**
 * The event dispatched at a `ModelContext` object when the execution of a tool begins.
 */
interface ToolActivatedEvent extends Event {
    /**
     * The name of the tool whose execution has started.
     */
    readonly toolName: string;
}

var ToolActivatedEvent: {
    prototype: ToolActivatedEvent;
    new(type: string, eventInitDict?: ToolActivatedEventInit): ToolActivatedEvent;
};

interface ToolCancelEventInit extends EventInit {
    /**
     * The name of the tool whose execution was cancelled.
     */
    toolName?: string;
}

/**
 * The event dispatched at a `ModelContext` object when the execution of a tool is cancelled.
 */
interface ToolCancelEvent extends Event {
    /**
     * The name of the tool whose execution was cancelled.
     */
    readonly toolName: string;
}

var ToolCancelEvent: {
    prototype: ToolCancelEvent;
    new(type: string, eventInitDict?: ToolCancelEventInit): ToolCancelEvent;
};
}

export type { WebMCP };
