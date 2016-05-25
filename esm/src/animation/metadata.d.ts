export declare const AUTO_STYLE: string;
export declare class AnimationEntryMetadata {
    name: string;
    definitions: AnimationStateMetadata[];
    constructor(name: string, definitions: AnimationStateMetadata[]);
}
export declare abstract class AnimationStateMetadata {
}
export declare class AnimationStateDeclarationMetadata extends AnimationStateMetadata {
    stateNameExpr: string;
    styles: AnimationStyleMetadata;
    constructor(stateNameExpr: string, styles: AnimationStyleMetadata);
}
export declare class AnimationStateTransitionMetadata extends AnimationStateMetadata {
    stateChangeExpr: string;
    animation: AnimationMetadata;
    constructor(stateChangeExpr: string, animation: AnimationMetadata);
}
export declare abstract class AnimationMetadata {
}
export declare class AnimationKeyframesSequenceMetadata extends AnimationMetadata {
    steps: AnimationStyleMetadata[];
    constructor(steps: AnimationStyleMetadata[]);
}
export declare class AnimationStyleMetadata extends AnimationMetadata {
    styles: Array<string | {
        [key: string]: string | number;
    }>;
    offset: number;
    constructor(styles: Array<string | {
        [key: string]: string | number;
    }>, offset?: number);
}
export declare class AnimationAnimateMetadata extends AnimationMetadata {
    timings: string | number;
    styles: AnimationStyleMetadata | AnimationKeyframesSequenceMetadata;
    constructor(timings: string | number, styles: AnimationStyleMetadata | AnimationKeyframesSequenceMetadata);
}
export declare abstract class AnimationWithStepsMetadata extends AnimationMetadata {
    constructor();
    readonly steps: AnimationMetadata[];
}
export declare class AnimationSequenceMetadata extends AnimationWithStepsMetadata {
    private _steps;
    constructor(_steps: AnimationMetadata[]);
    readonly steps: AnimationMetadata[];
}
export declare class AnimationGroupMetadata extends AnimationWithStepsMetadata {
    private _steps;
    constructor(_steps: AnimationMetadata[]);
    readonly steps: AnimationMetadata[];
}
export declare function animate(timing: string | number, styles?: AnimationStyleMetadata | AnimationKeyframesSequenceMetadata): AnimationAnimateMetadata;
export declare function group(steps: AnimationMetadata[]): AnimationGroupMetadata;
export declare function sequence(steps: AnimationMetadata[]): AnimationSequenceMetadata;
export declare function style(tokens: string | {
    [key: string]: string | number;
} | Array<string | {
    [key: string]: string | number;
}>): AnimationStyleMetadata;
export declare function state(stateNameExpr: string, styles: AnimationStyleMetadata): AnimationStateDeclarationMetadata;
export declare function keyframes(steps: AnimationStyleMetadata | AnimationStyleMetadata[]): AnimationKeyframesSequenceMetadata;
export declare function transition(stateChangeExpr: string, animationData: AnimationMetadata | AnimationMetadata[]): AnimationStateTransitionMetadata;
export declare function trigger(name: string, animation: AnimationMetadata | AnimationMetadata[]): AnimationEntryMetadata;
