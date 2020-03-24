import * as i0 from "@angular/core";
export declare class Log {
    logItems: any[];
    constructor();
    add(value: any /** TODO #9100 */): void;
    fn(value: any /** TODO #9100 */): (a1?: any, a2?: any, a3?: any, a4?: any, a5?: any) => void;
    clear(): void;
    result(): string;
    static ɵfac: i0.ɵɵFactoryDef<Log, never>;
    static ɵprov: i0.ɵɵInjectableDef<Log>;
}
