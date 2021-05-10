/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @description Represents the version of Angular
 *
 * @publicApi
 */
export class Version {
    constructor(full) {
        this.full = full;
        const [major, minor, ...rest] = full.split('.');
        this.major = major;
        this.minor = minor;
        this.patch = rest.join('.');
    }
}
/**
 * @publicApi
 */
export const VERSION = new Version('12.0.0-next.8+380.sha-d59f2b0');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVyc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZlcnNpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUg7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxPQUFPO0lBS2xCLFlBQW1CLElBQVk7UUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO1FBQzdCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUIsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBSZXByZXNlbnRzIHRoZSB2ZXJzaW9uIG9mIEFuZ3VsYXJcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBWZXJzaW9uIHtcbiAgcHVibGljIHJlYWRvbmx5IG1ham9yOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBtaW5vcjogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgcGF0Y2g6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgZnVsbDogc3RyaW5nKSB7XG4gICAgY29uc3QgW21ham9yLCBtaW5vciwgLi4ucmVzdF0gPSBmdWxsLnNwbGl0KCcuJyk7XG4gICAgdGhpcy5tYWpvciA9IG1ham9yO1xuICAgIHRoaXMubWlub3IgPSBtaW5vcjtcbiAgICB0aGlzLnBhdGNoID0gcmVzdC5qb2luKCcuJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBWRVJTSU9OID0gbmV3IFZlcnNpb24oJzAuMC4wLVBMQUNFSE9MREVSJyk7XG4iXX0=