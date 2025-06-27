export default class BaseHuman {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.health = 100;
    }

    draw(ctx) {}
    update() {}
}
