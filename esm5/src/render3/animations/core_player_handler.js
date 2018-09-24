var CorePlayerHandler = /** @class */ (function () {
    function CorePlayerHandler() {
        this._players = [];
    }
    CorePlayerHandler.prototype.flushPlayers = function () {
        for (var i = 0; i < this._players.length; i++) {
            var player = this._players[i];
            if (!player.parent) {
                player.play();
            }
        }
        this._players.length = 0;
    };
    CorePlayerHandler.prototype.queuePlayer = function (player) { this._players.push(player); };
    return CorePlayerHandler;
}());
export { CorePlayerHandler };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZV9wbGF5ZXJfaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvYW5pbWF0aW9ucy9jb3JlX3BsYXllcl9oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBO0lBQUE7UUFDVSxhQUFRLEdBQWEsRUFBRSxDQUFDO0lBYWxDLENBQUM7SUFYQyx3Q0FBWSxHQUFaO1FBQ0UsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzdDLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQ2xCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNmO1NBQ0Y7UUFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELHVDQUFXLEdBQVgsVUFBWSxNQUFjLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELHdCQUFDO0FBQUQsQ0FBQyxBQWRELElBY0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1BsYXllciwgUGxheWVySGFuZGxlcn0gZnJvbSAnLi9pbnRlcmZhY2VzJztcblxuZXhwb3J0IGNsYXNzIENvcmVQbGF5ZXJIYW5kbGVyIGltcGxlbWVudHMgUGxheWVySGFuZGxlciB7XG4gIHByaXZhdGUgX3BsYXllcnM6IFBsYXllcltdID0gW107XG5cbiAgZmx1c2hQbGF5ZXJzKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fcGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5fcGxheWVyc1tpXTtcbiAgICAgIGlmICghcGxheWVyLnBhcmVudCkge1xuICAgICAgICBwbGF5ZXIucGxheSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9wbGF5ZXJzLmxlbmd0aCA9IDA7XG4gIH1cblxuICBxdWV1ZVBsYXllcihwbGF5ZXI6IFBsYXllcikgeyB0aGlzLl9wbGF5ZXJzLnB1c2gocGxheWVyKTsgfVxufVxuIl19