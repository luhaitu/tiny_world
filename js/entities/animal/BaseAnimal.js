export default class BaseAnimal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.isAlive = true;
    }

    draw(ctx) {}
    update() {}
}
