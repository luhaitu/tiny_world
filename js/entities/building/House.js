import BaseBuilding from './BaseBuilding.js';

export default class House extends BaseBuilding {
    constructor(x, y) {
        super(x, y);
        this.color = '#cfd8dc';
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    update() {}
}
