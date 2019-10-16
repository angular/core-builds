export declare function getNativeRequestAnimationFrame(): {
    nativeRequestAnimationFrame: (callback: FrameRequestCallback) => number;
    nativeCancelAnimationFrame: (handle: number) => void;
};
