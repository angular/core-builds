export declare class AnimationStyleUtil {
    static balanceStyles(previousStyles: {
        [key: string]: string | number;
    }, newStyles: {
        [key: string]: string | number;
    }, nullValue?: any): {
        [key: string]: string | number;
    };
    static balanceKeyframes(collectedStyles: {
        [key: string]: string | number;
    }, finalStateStyles: {
        [key: string]: string | number;
    }, keyframes: any[]): any[];
    static clearStyles(styles: {
        [key: string]: string | number;
    }): {
        [key: string]: string | number;
    };
    static collectAndResolveStyles(collection: {
        [key: string]: string | number;
    }, styles: {
        [key: string]: string | number;
    }[]): {}[];
    static flattenStyles(styles: {
        [key: string]: string | number;
    }[]): {};
}
